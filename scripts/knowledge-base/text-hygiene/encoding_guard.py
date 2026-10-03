#!/usr/bin/env python3
"""
encoding_guard.py -- detect and repair the text-encoding traps that silently
corrupt PowerShell pipelines and scraped text.

The trap this exists to catch
-----------------------------
PowerShell reads a .ps1 file as ANSI (the legacy system codepage) unless the
file is UTF-8 *with* BOM. So a script saved as BOM-less UTF-8 that contains a
single non-ASCII character -- an en dash in a comment, a degree sign, a smart
quote -- gets mis-decoded, and in practice that silently kills a scraper with
zero output and no error. This workspace has already lost time to exactly that.

Microsoft's own guidance (about_Character_Encoding) is that BOM-less UTF-8 is
the right default going forward, but that scripts needing non-ASCII under
Windows PowerShell 5.1 must be UTF-8 *with* BOM. Those two rules conflict, and
that conflict is why this script exists: it tells you which side a given file
is on, instead of leaving you to guess.

What it checks
--------------
  - BOM presence and kind (UTF-8 / UTF-16 LE / UTF-16 BE)
  - whether the bytes actually decode under the assumed encoding
  - CRLF vs LF vs mixed line endings
  - mojibake signatures (UTF-8 bytes mis-decoded as cp1252, e.g. 'A(c)')
  - non-ASCII characters in .ps1 files, which is the actual landmine

Usage
-----
    python encoding_guard.py <path-or-dir> [...]          # report
    python encoding_guard.py --fix-dir <dir> --add-bom    # repair .ps1
    python encoding_guard.py --check                      # exit 1 if any problem

Exit codes
    0  no problems
    1  problems found (usable as a CI / pre-commit gate)
    2  usage error

Requires:  standard library only
"""

from __future__ import annotations

import argparse
import sys
from dataclasses import dataclass
from pathlib import Path

# Byte-order marks. Order matters: UTF-32 LE starts with the UTF-16 LE mark.
BOMS: list[tuple[bytes, str]] = [
    (b"\x00\x00\xfe\xff", "utf-32-be"),
    (b"\xff\xfe\x00\x00", "utf-32-le"),
    (b"\xef\xbb\xbf", "utf-8-sig"),
    (b"\xfe\xff", "utf-16-be"),
    (b"\xff\xfe", "utf-16-le"),
]

# Mojibake: the tell-tale result of UTF-8 bytes decoded as cp1252/latin-1.
MOJIBAKE_MARKERS = ("Ã¢", "Ã©", "Ã¨", "Ã¤", "Ã¶", "Ã¼", "Ã±", "â€™", "â€œ",
                    "â€", "Â°", "Â ", "ï»¿")

TEXT_EXTENSIONS = {".ps1", ".psm1", ".psd1", ".py", ".js", ".mjs", ".cjs",
                   ".json", ".jsonl", ".md", ".txt", ".csv", ".yml", ".yaml",
                   ".html", ".xml", ".sh"}

# Non-ASCII that is usually fine in data but dangerous inside a .ps1.
PS1_RISK = set("–—‘’“”°±×→…") | {chr(c) for c in range(0x2010, 0x2040)}


@dataclass
class Finding:
    path: Path
    encoding: str
    has_bom: bool
    line_endings: str
    issues: list[str]
    notes: list[str]
    risk_chars: list[str]

    @property
    def ok(self) -> bool:
        return not self.issues


def detect_bom(data: bytes) -> tuple[str | None, bytes]:
    """Return (bom_name, data_without_bom)."""
    for bom, name in BOMS:
        if data.startswith(bom):
            return name, data[len(bom):]
    return None, data


def sniff_encoding(data: bytes, bom: str | None) -> tuple[str, str]:
    """Return (encoding, note explaining how we decided)."""
    if bom:
        return bom, "from BOM"

    if b"\x00" in data[:4096]:
        # NUL bytes and no BOM: almost certainly UTF-16 in some form.
        even_nul = data[0::2].count(0) > len(data[0::2]) * 0.3
        return ("utf-16-le" if even_nul else "utf-16-be"), "inferred from NUL pattern"

    for enc in ("utf-8", "cp1252", "latin-1"):
        try:
            data.decode(enc)
        except UnicodeDecodeError:
            continue
        if enc == "utf-8":
            return enc, "decodes as UTF-8"
        return enc, f"NOT valid UTF-8; decodes as {enc}"
    return "unknown", "undecodable"


def line_ending_style(data: bytes) -> str:
    """Classify CRLF / LF / CR / mixed, so pipeline diffs stop being mysterious."""
    crlf = data.count(b"\r\n")
    lf = data.count(b"\n") - crlf
    cr = data.count(b"\r") - crlf
    if crlf and not lf and not cr:
        return "CRLF"
    if lf and not crlf and not cr:
        return "LF"
    if cr and not crlf and not lf:
        return "CR"
    if crlf and (lf or cr):
        return f"MIXED (crlf={crlf} lf={lf} cr={cr})"
    return "none"


def analyse(path: Path) -> Finding:
    raw = path.read_bytes()
    bom, body = detect_bom(raw)
    encoding, note = sniff_encoding(body, bom)

    issues: list[str] = []
    notes: list[str] = []
    is_ps = path.suffix.lower() in (".ps1", ".psm1", ".psd1")
    if bom:
        # A UTF-8 BOM on a .ps1 is CORRECT for Windows PowerShell 5.1 when
        # the file has non-ASCII. It is a note, not a finding: flagging it
        # would make --check fail on files that are already correct, and a
        # gate that always fails is a gate nobody runs.
        if bom == "utf-8-sig" and is_ps:
            notes.append("UTF-8 BOM present - correct for Windows PowerShell 5.1; "
                         "note that some unix tools dislike a BOM")
        else:
            notes.append(f"has {bom} BOM")
    if encoding not in ("utf-8", "utf-8-sig"):
        issues.append(f"encoding is {encoding} ({note}) - not BOM-less UTF-8")

    endings = line_ending_style(body)
    if endings.startswith("MIXED"):
        issues.append(f"mixed line endings: {endings}")

    try:
        text = body.decode(encoding if encoding != "unknown" else "utf-8",
                           errors="replace")
    except (UnicodeDecodeError, LookupError):
        text = ""

    hits = [m for m in MOJIBAKE_MARKERS if m in text]
    if hits:
        issues.append(f"mojibake detected: {', '.join(repr(h) for h in hits[:4])}")

    risk = sorted({c for c in text if c in PS1_RISK})
    if is_ps and risk and bom != "utf-8-sig":
        issues.append(
            f".ps1 has non-ASCII {risk} but no UTF-8 BOM. Windows PowerShell "
            "5.1 decodes it as ANSI and can fail silently. Add the BOM, or "
            "strip the characters.")

    return Finding(path, encoding, bool(bom), endings, issues, notes, risk)


def _recode(path: Path, dry_run: bool, add_bom: bool, label: str) -> str:
    """Rewrite a file as UTF-8 in the requested shape, atomically."""
    raw = path.read_bytes()
    bom, body = detect_bom(raw)
    encoding, _ = sniff_encoding(body, bom)
    if encoding.startswith("utf-16") or encoding.startswith("utf-32") \
            or encoding == "unknown":
        return f"SKIP (cannot safely re-encode from {encoding})"

    text = body.decode(encoding, errors="replace")
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    if add_bom:
        payload = b"\xef\xbb\xbf" + text.replace("\n", "\r\n").encode("utf-8")
    else:
        payload = text.encode("utf-8")

    if payload != raw and not dry_run:
        tmp = Path(str(path) + ".encfix")
        tmp.write_bytes(payload)
        tmp.replace(path)
    return f"{'would fix' if dry_run else 'fixed'} -> {label}"


def fix_add_bom(path: Path, dry_run: bool) -> str:
    """UTF-8 *with* BOM + CRLF: what Windows PowerShell 5.1 needs for non-ASCII."""
    return _recode(path, dry_run, True, "UTF-8 with BOM, CRLF")


def fix_strip_bom(path: Path, dry_run: bool) -> str:
    """BOM-less UTF-8 + LF: what pwsh 7 and unix tooling want."""
    return _recode(path, dry_run, False, "BOM-less UTF-8, LF")


def iter_files(targets: list[Path]) -> list[Path]:
    """Expand files and directories into a sorted list of text files."""
    out: list[Path] = []
    for t in targets:
        if t.is_dir():
            for p in sorted(t.rglob("*")):
                if p.is_file() and p.suffix.lower() in TEXT_EXTENSIONS:
                    out.append(p)
        elif t.is_file():
            out.append(t)
    return out


def main() -> int:
    ap = argparse.ArgumentParser(
        description="Detect and repair PowerShell/text encoding traps.")
    ap.add_argument("targets", nargs="*", type=Path,
                    help="files and/or directories to inspect")
    ap.add_argument("--check", action="store_true",
                    help="exit 1 if any file has a problem (CI / pre-commit use)")
    ap.add_argument("--fix-dir", type=Path,
                    help="recursively rewrite .ps1 files in this directory")
    ap.add_argument("--add-bom", action="store_true",
                    help="with --fix-dir: UTF-8 with BOM + CRLF (PS 5.1 safe)")
    ap.add_argument("--strip-bom", action="store_true",
                    help="with --fix-dir: BOM-less UTF-8 + LF (pwsh 7 / unix)")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    if args.add_bom and args.strip_bom:
        print("ERROR: choose --add-bom or --strip-bom, not both", file=sys.stderr)
        return 2

    if args.fix_dir:
        if not args.fix_dir.is_dir():
            print(f"ERROR: not a directory: {args.fix_dir}", file=sys.stderr)
            return 2
        if not (args.add_bom or args.strip_bom):
            print("ERROR: --fix-dir needs --add-bom or --strip-bom", file=sys.stderr)
            return 2
        fixer = fix_add_bom if args.add_bom else fix_strip_bom
        label = "--add-bom" if args.add_bom else "--strip-bom"
        files = [p for p in sorted(args.fix_dir.rglob("*"))
                 if p.is_file() and p.suffix.lower() in (".ps1", ".psm1", ".psd1")]
        print(f"scanning {len(files)} PowerShell file(s) under "
              f"{args.fix_dir} [{label}]")
        for p in files:
            print(f"  {fixer(p, args.dry_run)}\t{p}")
        if not files:
            print("  (nothing to fix)")
        return 0

    if not args.targets:
        ap.print_help()
        return 2

    files = iter_files(args.targets)
    if not files:
        print("no matching text files found", file=sys.stderr)
        return 2

    bad = 0
    for path in files:
        try:
            finding = analyse(path)
        except OSError as exc:
            print(f"{path}: UNREADABLE ({exc.strerror})")
            bad += 1
            continue

        print(f"{'OK  ' if finding.ok else 'WARN'} {path}")
        print(f"       encoding={finding.encoding}  lines={finding.line_endings}")
        for issue in finding.issues:
            print(f"       - {issue}")
        for note in finding.notes:
            print(f"       . {note}")
        if not finding.ok:
            bad += 1

    print("")
    print(f"checked {len(files)} file(s); {bad} with findings")
    if bad:
        print("repair .ps1 files with:  --fix-dir <dir> --add-bom")
    return 1 if (bad and args.check) else 0


if __name__ == "__main__":
    for _stream in (sys.stdout, sys.stderr):
        try:
            _stream.reconfigure(errors="replace")
        except (AttributeError, OSError):
            pass
    sys.exit(main())
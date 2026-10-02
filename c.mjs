import { execFileSync } from "node:child_process";
const g=(...a)=>execFileSync("git",a,{encoding:"utf8",stdio:["ignore","pipe","pipe"]}).trim();
const msg = [
  "feat(oracle): check our physics against data we did not write",
  "",
  "The oracle existed on paper and was not wired in. data/reference/ held 744",
  "rows of independently sourced data that NOTHING read, while three ballistics",
  "defects shipped behind 161 self-written tests that shared the implementation",
  "assumptions.",
  "",
  "check-oracle.mjs compares our hand-transcribed G1/G7 drag tables against",
  "drag_tables.csv at 153 Mach points, and enforces that every oracle row carries",
  "a source and a stated uncertainty. Added as oracle:check to verify.",
  "",
  "Negative-tested four ways: a corrupted Cd fails; a blanked source fails; a",
  "stripped uncertainty fails. A field removal from a file with no such column",
  "correctly passes.",
  "",
  "Not yet done: the gate does not run the solver against measured_data.csv. Those",
  "rows need barrel-length scaling and an atmosphere model first, and comparing",
  "without them would manufacture agreement.",
].join("\n");
try { g("add","--all"); g("commit","-q","-m",msg); console.log("  committed " + g("rev-parse","--short","HEAD")); }
catch(e){ console.log("  commit failed: " + e.message.slice(0,200)); }
console.log("  clean: " + (g("status","--porcelain")===""));

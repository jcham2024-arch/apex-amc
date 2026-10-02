import { execFileSync } from "node:child_process";
const g=(...a)=>execFileSync("git",a,{encoding:"utf8",stdio:["ignore","pipe","pipe"]}).trim();
const msg = [
  "ci: run every gate, on any branch, and prove the list is complete",
  "",
  "CI listed its gates by hand and three were missing: claims:check, tasks:check",
  "and oracle:check. The consequence was concrete - the physics oracle could be",
  "broken by a pull request and CI would still be green, because CI never ran it.",
  "A gate that runs locally but not in CI is not a gate.",
  "",
  "- Adds the three missing gates to verify.yml.",
  "- Adds ci:check, which fails if any gate in `npm run verify` is not named in",
  "  the workflow. Exemptions must carry a reason in CI_ONLY, so an omission",
  "  cannot hide as an exemption.",
  "- ci:check runs in CI and in verify, so the two lists cannot drift.",
  "- Triggers on any branch, not just main. A branch that has never seen CI cannot",
  "  be trusted to merge, and the first real run was previously happening after",
  "  code had already landed.",
  "- Removes the stale 'all 14 stages' comment.",
  "",
  "Negative-tested: deleting oracle:check from the workflow fails ci:check;",
  "deleting claims:check fails it too.",
].join("\n");
try {
  g("add","--all");
  g("commit","-q","-m",msg);
  console.log("  committed " + g("rev-parse","--short","HEAD"));
} catch(e){ console.log("  failed: " + e.message.slice(0,200)); }
console.log("  clean: " + (g("status","--porcelain")===""));

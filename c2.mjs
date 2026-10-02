import { execFileSync } from "node:child_process";
const g=(...a)=>execFileSync("git",a,{encoding:"utf8",stdio:["ignore","pipe","pipe"]}).trim();
try { g("add","-A"); const n=g("diff","--cached","--name-only").split("\n").filter(Boolean).length;
  if(n){ g("commit","-q","-m","chore: remaining untracked files from the consolidation"); console.log("  committed remaining: "+n+" files"); } }
catch(e){ console.log("  (nothing to commit)"); }
console.log("  clean now: " + (g("status","--porcelain")===""));

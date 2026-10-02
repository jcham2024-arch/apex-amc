import { execFileSync } from "node:child_process";
const g=(...a)=>execFileSync("git",a,{encoding:"utf8",stdio:["ignore","pipe","pipe"]}).trim();
const s=g("status","--porcelain").split("\n").filter(Boolean);
console.log("  changed files: " + s.length);
s.forEach(l=>console.log("   " + l.slice(0,3) + " " + l.slice(3)));
try{
  g("add","--all");
  g("commit","-q","-m","docs: correct stale verification counts and gate against future drift\n\nTen documents quoted a 'N stages' figure; no two agreed and the real\nnumber was 15. Corrected the live claims and added a docs:check rule that\nreads the real count from package.json, so a hand-written count can no\nlonger go stale unnoticed.\n\nThe new rule was negative-tested: injecting '7 stages' fails the gate.\nCHANGELOG.md is exempt, since a historical stage count is history.");
  console.log("\n  committed");
}catch(e){ console.log("  commit failed: " + e.message.slice(0,120)); }

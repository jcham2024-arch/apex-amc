import { execFileSync } from "node:child_process";
const g=(...a)=>execFileSync("git",a,{encoding:"utf8",stdio:["ignore","pipe","pipe"]}).trim();
g("add","--all"); g("commit","-q","-m","docs: record the audit resolution and what the new gate caught");
console.log("  committed");

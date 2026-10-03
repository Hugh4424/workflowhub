#!/usr/bin/env node
// Human-readable constitutional reference extraction; facts only, no stage verdict or permit.
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const args=process.argv.slice(2);
const value=(name)=>args.find(v=>v.startsWith(name+"="))?.slice(name.length+1);
const specPath=value("--spec"),outPath=value("--out");
if(!specPath||!outPath)throw new Error("explicit --spec=<current spec.md> and --out=<new ordinary Markdown file> are required");
const spec=readFileSync(resolve(specPath),"utf8"),constitution=readFileSync(resolve(root,"CONSTITUTION.md"),"utf8");
const clauses=new Set([...constitution.matchAll(/^### ([FQS]\d+) /gm)].map(m=>m[1]));
const references=[...new Set([...spec.matchAll(/\b([FQS]\d{1,2})\b/g)].map(m=>m[1]))].sort();
const lines=["# 宪法引用读回","",`当前材料：${resolve(specPath)}`,"","以下仅记录显式条款引用与当前宪法是否存在；没有引用不能推断不适用，存在引用不能推断行为通过。实际改动仍由人／独立审查结合 constitution-checklist 判断。","","| 引用 | 当前条款存在 |","| --- | --- |",...references.map(id=>`| ${id} | ${clauses.has(id)?"是":"否"} |`),"","本文件不是阶段许可、质量判决、hash认证或完成结论。"];
writeFileSync(resolve(outPath),lines.join("\n")+"\n",{flag:"wx"});
console.log(`wrote ${resolve(outPath)} (${references.length} explicit constitutional references)`);

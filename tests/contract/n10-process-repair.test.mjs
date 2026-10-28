// ORACLE-N10-PROCESS-REPAIR: static contracts only; no claim about live step order.
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { describe, test, expect } from 'vitest';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const read=p=>readFileSync(resolve(root,p),'utf8');
const method='workflows/make-decision/SKILL.md';
const data='workflows/make-decision/steps.json';
const contract='skills/wh-review/contracts/make-decision.md';
const adr='docs/adr/0052-direction-review-before-module-convergence.md';
const corrections='specs/archive/n10-finite-check-wiring-20261020/n8-corrections.md';
const normal='workflows/make-decision/flows/normal/SKILL.md';
const section=(s,n)=>s.split(new RegExp(`^${n}\\. \\x60`,'m'))[1]?.split(/^\d+\. `/m)[0]??'';
const needs=(s,patterns)=>patterns.filter(re=>!re.test(s)).map(String);
// TCR074: scoped literal contracts, not a general natural-language classifier.
function namedSection(text,title){const start=text.indexOf('## '+title+'\n');if(start<0)return '';const tail=text.slice(start+title.length+4);return tail.split(/^## /m)[0];}
const requiredText=(text,clauses)=>clauses.filter(clause=>!text.includes(clause));
const reviewPoints='三个必留审查点：build-plan 的 wh-review 合并审查、build-code 每 Phase 的 OCR 审查、build-code 终末 OCR 审查。';

function t026(s){return [...requiredText(namedSection(s,'方法'),['不是新 gate 或审批']),...requiredText(namedSection(s,'人为门与审查点'),[reviewPoints]),...needs(section(s,5),[/只问方向轴与骨架/,/第 9 步/]),...needs(section(s,8),[/第 7 步方向审查已回读/,/不可用与用户选择已具名/,/未达不开始逐包收敛/]),...needs(section(s,9),[/不重复方向审/]),...needs(s,[/普通路线[^\n]*方案审（detail 轨）[^\n]*实现审/])];}
function t027(d,c){const get=n=>d.steps.find(v=>v.step_id===n)?.observable_result??'';return [...requiredText(namedSection(c,'输出与真实边界'),['保留 unavailable/incomplete，不能改成无问题或通过。','空 findings 不证明 checked_no_gap、逐条问题覆盖、阶段完成或用户批准。']),...needs(get(5),[/方向轴/,/第 9 步/]),...needs(get(7),[/骨架级/,/ref＋sha256/]),...needs(get(8),[/未达不开始逐包收敛/]),...(/审查(?:通过|批准)才可继续/.test(c)?['review license']:[]),...needs(c,[/骨架级选择/,/不含逐模块方案结论、字段级取舍或实现细节/,/ref＋sha256/,/不是继续工作、问题身份或阶段许可/])];}
function t028(s){return [...requiredText(namedSection(s,'决定'),['不新增强制门、审批、公共命令或第二套事实面。']),...needs(s,[/实施状态[^\n]*未验证/,/骨架级选择/,/ref＋sha256/,/不作[^\n]*许可/,/方法第 5\/7\/8\/9 步/,/§direction/,/partial/]),...(/SKILL\.md:129\/139\/151/.test(s)?['stale lines']:[])];}
function t029(s){
 const summaries=namedSection(s,'普通路线审查摘要更正'),terms=namedSection(s,'术语更正');
 const issues=[...needs(s,[/归档原文不改/,/:31/,/:98/,/:285/,/:121/,/:619/,/方案审（detail 轨）/,/实现审/,/AC-FLOW-3/])];
 for(const anchor of [':31',':98',':285']){
  const rows=summaries.split('\n').filter(line=>line.startsWith('- '+anchor+'：'));
  if(rows.length!==1){issues.push('unique summary '+anchor);continue;}
  issues.push(...needs(rows[0],[/逐模块收敛后做一次方案审（detail 轨）/,/整次实施再做一次实现审/,/复用|同 build-code/]));
 }
 issues.push(...requiredText(terms,[':121 的“方案审一次”指逐模块收敛后的方案审（detail 轨）',':619 的“代码审”统一读为“实现审”','AC-FLOW-3 判据强度不变']));
 return issues;
}
function t030(s,n){return [...requiredText(s.split(/^## /m)[0],['归档原文不改','不新增矩阵、字段或第二进度权威']),...requiredText(namedSection(s,'技能档位降档登记'),['不新增矩阵文件或字段']),...needs(s,[/^\| small \| talk-with-zhipeng \|/m,/^\| normal \| plan-ceo-review \|/m,/^\| planning \| intake-decision-review \|/m,/^\| planning \| plan-ceo-review \|/m,/^\| planning \| review \|/m,/必需→按需/,/真实调用[^\n]*未测/,/incomplete/,/错序负例[^\n]*未跑/]),...needs(n,[/\| `intake-decision-review` \| 跳过 \|/])];}
const shapeIssues=d=>Object.keys(d).sort().join(',')!=='flows,schema_version,stage_slug,steps'?['top fields']:d.steps.flatMap(step=>Object.keys(step).sort().join(',')==='completion_evidence,observable_result,step_id,step_slug'?[]:['step fields']);
const checkMutations=(legal,check,mutations)=>{expect(check(legal)).toEqual([]);for(const mutate of mutations){const changed=mutate(legal);expect(changed).not.toBe(legal);expect(check(changed).length).toBeGreaterThan(0);expect(check(legal)).toEqual([]);}};
describe('ORACLE-N10-PROCESS-REPAIR',()=>{
 test('T026 method preserves direction scope, readback and ordinary review',()=>{const s=read(method);checkMutations(s,t026,[v=>v.replace('本步只问方向轴与骨架','本步追问字段'),v=>v.replace('第 7 步方向审查已回读','第 7 步未读'),v=>v.replace('未达不开始逐包收敛','继续逐包收敛'),v=>v.replace('本步不重复方向审','本步重跑方向审'),v=>v.replace('普通路线在本阶段逐模块收敛后做一次方案审（detail 轨）、整次实施做一次实现审','普通整次实现一次审查')]);});
 test('T027 steps and direction contract retain skeleton and material identity',()=>{const d=JSON.parse(read(data)),c=read(contract);expect(t027(d,c)).toEqual([]);for(const [id,needle]of [[5,'方向轴'],[7,'骨架级'],[8,'未达不开始逐包收敛']]){const changed=structuredClone(d);changed.steps.find(v=>v.step_id===id).observable_result=changed.steps.find(v=>v.step_id===id).observable_result.replace(needle,'删除');expect(t027(changed,c).length).toBeGreaterThan(0);}for(const word of ['骨架级选择','ref＋sha256','不是继续工作、问题身份或阶段许可'])expect(t027(d,c.replaceAll(word,'删除')).length).toBeGreaterThan(0);expect(t027(d,c+'审查通过才可继续。').length).toBeGreaterThan(0);});
 test('T028 ADR records scope and implementation limits',()=>{checkMutations(read(adr),t028,[v=>v.replaceAll('骨架级选择','全部细节'),v=>v.replaceAll('ref＋sha256','版本'),v=>v.replaceAll('未验证','已验证'),v=>v.replace('方法第 5/7/8/9 步','SKILL.md:129/139/151')]);});
 test('T029 current corrections preserve archived summaries and terminology',()=>{checkMutations(read(corrections),t029,[v=>v.replaceAll(':31','遗漏'),v=>v.replaceAll(':98','遗漏'),v=>v.replaceAll(':285','遗漏'),v=>v.replaceAll('方案审（detail 轨）','仅实现审')]);});
 test('T030 intake and all five downgrades retain historical incomplete',()=>{const s=read(corrections),n=read(normal);expect(t030(s,n)).toEqual([]);for(const line of s.split('\n').filter(v=>/^\| (small|normal|planning) \|/.test(v))){expect(t030(s.replace(line,''),n).length).toBeGreaterThan(0);}expect(t030(s,n.replace('| `intake-decision-review` | 跳过 |','| `intake-decision-review` | 按需 |')).length).toBeGreaterThan(0);});
 test('T032 AC-PROCESS-5 fixed steps shape, frozen review points, archive identity',()=>{const d=JSON.parse(read(data));expect(d.steps).toHaveLength(15);for(const s of d.steps)expect(Object.keys(s).sort()).toEqual(['completion_evidence','observable_result','step_id','step_slug']);expect(d.steps.map(v=>v.step_slug)).toEqual(['load-context','outline-hypothesis-talk','research-and-diverge','outline-revision-check','outline-talk','adversarial-direction-check','direction-advice','module-breadth-confirm','module-convergence','detail-advice','grill-with-docs','write-decision-draft','approve-decision','stage-end-spec-analyze','closeout']);const s=read(method);expect(s).toContain('三个必留审查点');expect(s).toContain('build-plan');expect(s).toContain('build-code');expect(s).toContain('build-code 终末');for(const [p,hash]of Object.entries(archiveHashes))expect(createHash('sha256').update(read(p)).digest('hex')).toBe(hash);const copy=structuredClone(d);copy.steps[7].depends_on='direction';expect(shapeIssues(d)).toEqual([]);expect(shapeIssues(copy)).toContain('step fields');});
});

const archiveHashes={"specs/archive/n8-four-level-route-20261019/spec.md": "46122b1061b2e79f0a9912d277c91c1ab2bd4d52ec9be34fc4dbce9ddeb11ed5", "specs/archive/n8-four-level-route-20261019/phases/P7-四级验收与成本对照.md": "5654a7da99ff4637ab45091513fbf8fa2ba705b251e6fb6cae57ed43eadfea2b"};


// TCR074 approved negative-first extension. Existing checkers remain unchanged for RED.
describe('TCR074 independently scoped frozen negatives',()=>{
 const changed=(original,needle,replacement='')=>{expect(original.includes(needle),needle).toBe(true);const next=original.replace(needle,replacement);expect(next,needle).not.toBe(original);return next;};
 for(const anchor of [':31',':98',':285']){
  test('T029 rejects deleting only correction '+anchor,()=>{const s=read(corrections),line=s.split('\n').find(l=>l.startsWith('- '+anchor+'：'));expect(line).toBeTruthy();expect(t029(changed(s,line)).length).toBeGreaterThan(0);});
  test('T029 rejects reverting only correction '+anchor,()=>{const s=read(corrections),line=s.split('\n').find(l=>l.startsWith('- '+anchor+'：'));expect(line).toBeTruthy();const reverted=line.replace('方案审（detail 轨）','实现审');expect(t029(changed(s,line,reverted)).length).toBeGreaterThan(0);});
 }
 test('T029 rejects only :619 implementation terminology regression',()=>{const s=read(corrections);expect(t029(changed(s,':619 的“代码审”统一读为“实现审”',':619 的“代码审”仍读为“代码审”')).length).toBeGreaterThan(0);});
 for(const [label,needle]of [['no new matrix','不新增矩阵文件或字段'],['archive immutable','归档原文不改']])test('T030 rejects declaration deletion '+label,()=>{const s=read(corrections);expect(t030(changed(s,needle),read(normal)).length).toBeGreaterThan(0);});
 for(const key of ['schema_version','stage_slug','flows'])test('T032 rejects missing top key '+key,()=>{const d=JSON.parse(read(data));expect(Object.hasOwn(d,key)).toBe(true);delete d[key];expect(shapeIssues(d).length).toBeGreaterThan(0);});
 test('T032 rejects added top gate field',()=>{const d=JSON.parse(read(data));expect(Object.hasOwn(d,'gate')).toBe(false);d.gate=true;expect(shapeIssues(d).length).toBeGreaterThan(0);});
 for(const [label,needle]of [['not a gate','不是新 gate 或审批'],['mandatory review points','三个必留审查点：build-plan 的 wh-review 合并审查、build-code 每 Phase 的 OCR 审查、build-code 终末 OCR 审查。']])test('T032 rejects SKILL frozen clause deletion '+label,()=>{expect(t026(changed(read(method),needle)).length).toBeGreaterThan(0);});
 for(const needle of ['保留 unavailable/incomplete，不能改成无问题或通过。','空 findings 不证明 checked_no_gap、逐条问题覆盖、阶段完成或用户批准。'])test('T032 rejects contract frozen clause deletion '+needle,()=>{expect(t027(JSON.parse(read(data)),changed(read(contract),needle)).length).toBeGreaterThan(0);});
 test('T032 rejects ADR no-new-gate clause deletion',()=>{expect(t028(changed(read(adr),'不新增强制门、审批、公共命令或第二套事实面。')).length).toBeGreaterThan(0);});
});

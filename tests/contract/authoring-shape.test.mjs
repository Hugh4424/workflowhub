// ORACLE-C07-AUTHORING / shape and sample: inspect actual author inputs.
import { test, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { phaseTaskProseGaps } from '../../runtime/stage/stage-content-contracts.mjs';
const phase=()=>readFileSync('skills/spec-plan/templates/phase-template.md','utf8');
const spec=()=>readFileSync('skills/spec-specify/templates/spec-template.md','utf8');
const decision=()=>readFileSync('skills/decision-log/templates/decision-log-template.md','utf8');
function sample(text,name){return text.split(`<!-- authoring-sample:${name} -->`)[1]?.match(/```markdown\n([\s\S]*?)\n```/)?.[1];}
function violations(text){const ids=[...text.matchAll(/\b(?:FR|AC|R|U|T)-[A-Z0-9-]+\b/g)].map(m=>m[0]);const hits=[];if(ids.length>new Set(ids).size)hits.push('编号重复');if(text.split('\n').some(l=>[...l].length>300))hits.push('单行超长');if(/^- \*\*(?:证据计划|测试变更请求)\*\*[:：]\s*(?:none|同上|固定常量)\s*$/m.test(text))hits.push('常量字段');return hits;}
// Fill only the generic Task identity so the existing production prose reader
// consumes the actual template; complete material/semantic quality is not implied.
function readerPhase(text){return text.replace(/^### 任务 N：/m,'### 任务 1：').replace('**任务编号**：Tnnn','**任务编号**：T001');}
test('phase author card starts with actual reader prose before its field block',()=>{const card=phase().match(/^### 任务 N：[^\n]*\n([\s\S]*?)(?=^### G-2\b)/m)?.[1]??'';const prose=card.split(/^- \*\*|^\*\*校验器用/m)[0].trim();expect(prose).toMatch(/\S/);expect(phaseTaskProseGaps(readerPhase(phase()))).toEqual([]);expect(card).not.toMatch(/^- \*\*(?:证据计划|预写测试|可观察接缝|RED 证据|测试变更请求)\*\*/m);});
test('actual phase prose reader accepts layout-only reflow and rejects field-only or hidden prose',()=>{const template=phase(),sentences=['读取目标模块并修改返回值。','有效输入保持原输出。','空输出保留原错误。','导入失败交原作者修复。','保存实际命令与退出码。','恢复原输入后重放检查。','未测效果仍明确留缺口。'];const layouts=[sentences.join(''),sentences.join('\n')];expect(layouts[0]).toBe(layouts[1].replace(/\n/g,''));const input=prose=>readerPhase(template.replace(/(^### 任务 N[^\n]*\n)[\s\S]*?(?=^- \*\*)/m,'$1'+prose+'\n\n'));for(const prose of layouts)expect(phaseTaskProseGaps(input(prose))).toEqual([]);for(const prose of ['', '<!-- hidden description -->', '```text\nexample only\n```'])expect(phaseTaskProseGaps(input(prose))).toEqual(['T001']);});
test('real phase and spec sample pairs distinguish all three named failure classes',()=>{for(const text of [phase(),spec()]){const good=sample(text,'good'),bad=sample(text,'bad');expect(good).toBeTypeOf('string');expect(bad).toBeTypeOf('string');expect(violations(good)).toEqual([]);expect(violations(bad)).toEqual(expect.arrayContaining(['编号重复','单行超长','常量字段']));expect(text).toContain('前后读数');}});
test('spec requirement block narrates its result before its identifier',()=>{const text=spec();const block=text.split('## 为什么做，给谁用？')[1]?.split('## 已核实的事实与假设是什么？')[0]??'';expect(block).toMatch(/需求 1：[^\n]+\n(?:[^\n]*\n)*#{0,6}\s*需求 2：/);const appendix=text.split('## Appendix B — 需求与编号对照')[1]??'';expect(appendix).toMatch(/需求 1[^\n]*R-001/);});
// Contract migration (user instruction 2026-10-30; raw message ID not obtained):
// the old assertion required every decision section to open with the scaffold label
// "本节回答" — the defect the current standard names in rule 4. It now requires a real
// answer sentence with comparable mechanical strictness: non-empty, not a scaffold label,
// at least eight actual characters, not a placeholder. The remaining assertions are unchanged.
test('decision sections open with their reader question answer and old ids remain navigation only',()=>{const text=decision();for(const section of text.split(/^#{2,4} /m).slice(1)){const first=section.split('\n').slice(1).find(l=>l.trim());expect(typeof first).toBe('string');expect(first.trim()).not.toMatch(/^(?:本节回答|第一句回答)[：:]/);expect([...first.trim()].length).toBeGreaterThanOrEqual(8);expect(first.trim()).not.toMatch(/^(?:TBD|TODO|N\/A|待补充|占位)/);}expect(text).toContain('### 旧编号对照');expect(text).toMatch(/需求 N[\s\S]*决定 N/);expect(text).toContain('失败怎么办');});

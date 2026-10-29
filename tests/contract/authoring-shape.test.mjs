// ORACLE-C07-AUTHORING / shape and sample: inspect actual author inputs.
import { test, expect } from 'vitest';
import { readFileSync } from 'node:fs';
const phase=()=>readFileSync('skills/spec-plan/templates/phase-template.md','utf8');
const spec=()=>readFileSync('skills/spec-specify/templates/spec-template.md','utf8');
const decision=()=>readFileSync('skills/decision-log/templates/decision-log-template.md','utf8');
function sample(text,name){return text.split(`<!-- authoring-sample:${name} -->`)[1]?.match(/```markdown\n([\s\S]*?)\n```/)?.[1];}
function violations(text){const ids=[...text.matchAll(/\b(?:FR|AC|R|U|T)-[A-Z0-9-]+\b/g)].map(m=>m[0]);const hits=[];if(ids.length>new Set(ids).size)hits.push('编号重复');if(text.split('\n').some(l=>[...l].length>300))hits.push('单行超长');if(/^- \*\*(?:证据计划|测试变更请求)\*\*[:：]\s*(?:none|同上|固定常量)\s*$/m.test(text))hits.push('常量字段');return hits;}
test('phase author card starts with three to six reader prose lines before its field block',()=>{const card=phase().split('### Tnnn —')[1]?.split('### G-2')[0]??'';const prose=card.slice(card.indexOf('\n')+1).split(/^- \*\*/m)[0].trim().split('\n').filter(l=>l.trim());expect(prose.length).toBeGreaterThanOrEqual(3);expect(prose.length).toBeLessThanOrEqual(6);expect(card).not.toMatch(/^- \*\*(?:证据计划|预写测试|可观察接缝|RED 证据|测试变更请求)\*\*/m);});
test('real phase and spec sample pairs distinguish all three named failure classes',()=>{for(const text of [phase(),spec()]){const good=sample(text,'good'),bad=sample(text,'bad');expect(good).toBeTypeOf('string');expect(bad).toBeTypeOf('string');expect(violations(good)).toEqual([]);expect(violations(bad)).toEqual(expect.arrayContaining(['编号重复','单行超长','常量字段']));expect(text).toContain('前后读数');}});
test('spec requirement block narrates its result before its identifier',()=>{const block=spec().split('### 配置错误定位（DOMAIN）')[1]?.split('### 模块职责与依赖')[0]??'';expect(block).toMatch(/非法配置[^\n]+\n(?:[^\n]+\n)*\n- \*\*FR-DOMAIN-001\*\*/);});
test('decision sections open with their reader question and old ids remain navigation only',()=>{const text=decision();for(const section of text.split(/^#{2,4} /m).slice(1)){expect(section.split('\n').slice(1).find(l=>l.trim())).toMatch(/^本节回答/);}expect(text).toContain('### 旧编号对照');expect(text).toMatch(/需求 N[\s\S]*决定 N/);expect(text).toContain('失败怎么办');});

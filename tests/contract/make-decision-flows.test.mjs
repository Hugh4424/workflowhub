// ORACLE-FLOW-STEPS — P5/T007–T009. Independent frozen material oracle.
// Authority: N8 spec FR-ENTRY/FLOW/SKILL/CLOSE; decision-log B/C/D/E/F;
// original 31-skill denominator: archived framework PRD, cross-level shared list.
// Static material coverage only: actual route execution, page generation and cost belong to P7.
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import { describe, test, expect } from 'vitest';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const path = 'workflows/make-decision';
function read(p) { expect(existsSync(join(root, p)), `required material: ${p}`).toBe(true); return readFileSync(join(root,p),'utf8'); }
const text = level => read(`${path}/${level === 'complex' ? '' : `flows/${level}/`}SKILL.md`);
const steps = level => JSON.parse(read(`${path}/${level === 'complex' ? '' : `flows/${level}/`}steps.json`));
function has(s, re, why) { expect(s, why).toMatch(re); }
function section(s, title) { const lines=s.split('\n'); const start=lines.findIndex(l => /^#{1,6} /.test(l) && l.includes(title)); expect(start,`section ${title}`).toBeGreaterThanOrEqual(0); const rank=lines[start].match(/^#+/)[0].length; let end=start+1; while(end<lines.length && !new RegExp(`^#{1,${rank}} `).test(lines[end])) end++; return lines.slice(start,end).join('\n'); }
function blocks(s) { return [...s.matchAll(/^###\s+(\d+)[.、．]\s+([^\n]+)\n([\s\S]*?)(?=^###\s+\d+[.、．]|^##\s|$(?![\s\S]))/gm)].map(m=>({id:Number(m[1]),title:m[2],body:m[3]})); }
function ordered(s, patterns) { let i=-1; for(const re of patterns) { const tail=s.slice(i+1); const m=re.exec(tail); expect(m,`ordered contract ${re}`).not.toBeNull(); i+=1+m.index+m[0].length; } }
const shared31 = ['mini-task','talk-with-zhipeng','decision-log','deep-research','anysearch','grill-with-docs','spec-clarify','spec-specify','spec-prd','spec-analyze','testing-system-blueprint','test-routing-advisor','backend-testing','frontend-testing','fullstack-slice-testing','isolated-browser-qa','project-norm-init','design-source-readiness','frontend-prototype-render','frontend-component-quality','wh-review','intake-decision-review','plan-ceo-review','review','simplicity-guard','plan-design-review','architect-code-review','diagnosing-bugs','stage-reflection','stage-handoff','resolving-merge-conflicts'];
const complexBaseline = [
  {
    "step_slug": "load-context",
    "completion_evidence": [
      {
        "kind": "phase_task_facts",
        "uri_or_path": "facts.jsonl"
      }
    ]
  },
  {
    "step_slug": "outline-hypothesis-talk",
    "completion_evidence": [
      {
        "kind": "phase_task_facts",
        "uri_or_path": "facts.jsonl"
      }
    ]
  },
  {
    "step_slug": "research-and-diverge",
    "completion_evidence": [
      {
        "kind": "phase_task_facts",
        "uri_or_path": "facts.jsonl"
      },
      {
        "kind": "quality_facts",
        "uri_or_path": "quality/evidence/"
      }
    ]
  },
  {
    "step_slug": "outline-revision-check",
    "completion_evidence": [
      {
        "kind": "phase_task_facts",
        "uri_or_path": "facts.jsonl"
      }
    ]
  },
  {
    "step_slug": "outline-talk",
    "completion_evidence": [
      {
        "kind": "phase_task_facts",
        "uri_or_path": "facts.jsonl"
      }
    ]
  },
  {
    "step_slug": "adversarial-direction-check",
    "completion_evidence": [
      {
        "kind": "phase_task_facts",
        "uri_or_path": "facts.jsonl"
      }
    ]
  },
  {
    "step_slug": "direction-advice",
    "completion_evidence": [
      {
        "kind": "phase_task_facts",
        "uri_or_path": "facts.jsonl"
      },
      {
        "kind": "review",
        "uri_or_path": "quality/reviews/"
      }
    ]
  },
  {
    "step_slug": "module-breadth-confirm",
    "completion_evidence": [
      {
        "kind": "phase_task_facts",
        "uri_or_path": "facts.jsonl"
      }
    ]
  },
  {
    "step_slug": "module-convergence",
    "completion_evidence": [
      {
        "kind": "phase_task_facts",
        "uri_or_path": "facts.jsonl"
      }
    ]
  },
  {
    "step_slug": "detail-advice",
    "completion_evidence": [
      {
        "kind": "phase_task_facts",
        "uri_or_path": "facts.jsonl"
      },
      {
        "kind": "review",
        "uri_or_path": "quality/reviews/"
      }
    ]
  },
  {
    "step_slug": "grill-with-docs",
    "completion_evidence": [
      {
        "kind": "phase_task_facts",
        "uri_or_path": "facts.jsonl"
      }
    ]
  },
  {
    "step_slug": "write-decision-draft",
    "completion_evidence": [
      {
        "kind": "phase_task_facts",
        "uri_or_path": "facts.jsonl"
      }
    ]
  },
  {
    "step_slug": "approve-decision",
    "completion_evidence": [
      {
        "kind": "phase_task_facts",
        "uri_or_path": "facts.jsonl"
      }
    ]
  },
  {
    "step_slug": "stage-end-spec-analyze",
    "completion_evidence": [
      {
        "kind": "phase_task_facts",
        "uri_or_path": "facts.jsonl"
      },
      {
        "kind": "quality_facts",
        "uri_or_path": "quality/evidence/"
      }
    ]
  },
  {
    "step_slug": "closeout",
    "completion_evidence": [
      {
        "kind": "phase_task_facts",
        "uri_or_path": "facts.jsonl"
      }
    ]
  }
];
describe('ORACLE-FLOW-STEPS: preserved complex and explicit route contracts', () => {
  test('root keeps N6 15 slugs and artifact identities, including closeout', () => {
    const s=steps('complex'); expect(s.schema_version).toBe('2.0.0'); expect(s.stage_slug).toBe('make-decision');
    expect(s.steps.map(({step_slug,completion_evidence})=>({step_slug,completion_evidence}))).toEqual(complexBaseline);
    expect(s.steps.map(s=>s.step_id)).toEqual(Array.from({length:15},(_,i)=>i+1));
    for(const step of s.steps) { expect(step.observable_result.trim()).not.toBe(''); expect(step.completion_evidence.length).toBeGreaterThan(0); }
    has(s.steps[7].observable_result,/入口路由|对应流程/,'step 8 routes rather than disabling light routes');
    expect(text('complex')).not.toMatch(/三种分级今天不可实跑/);
  });
  test('entry order uses only entry facts, shows recommendation with first question and explicit choice', () => {
    const s=section(text('complex'),'入口路由');
    ordered(s,[/规划/,/超过一个任务|多于一个任务/,/风险/,/默认复杂/,/普通/,/小改动/,/事实缺失|缺事实/]);
    for(const re of [/架构/,/迁移/,/权限/,/安全/,/第一次|首次/,/同批|同时/,/推荐/,/高亮|加粗/,/理由/,/用户.{0,16}(覆盖|选择)/,/入口.{0,24}事实/,/不得|不使用|不能/,/diff/,/Phase/,/未答/,/复杂/]) has(s,re,'entry choice contract');
    has(s,/级别与路线/,'single decision-log reader section'); has(s,/decision-log|决策记录/,'route authority');
    for(const re of [/流程步骤/,/实施.{0,8}审查/,/收口/,/验收/,/读不到|缺失/,/复杂/,/缺口/]) has(s,re,'four independent readers and missing-section behavior');
    const rootSteps=steps('complex');
    const routeIndex=JSON.stringify(rootSteps.flows ?? '')+s+read(`${path}/skill-deps.yaml`);
    for(const level of ['small','normal','planning']) for(const file of ['SKILL.md','steps.json']) { expect(routeIndex).toContain(`flows/${level}/${file}`); read(`${path}/flows/${level}/${file}`); }
  });
  for(const [level,count] of [['small',9],['normal',11],['planning',11]]) {
    test(`${level}: every numbered step has a result and a next-step condition`, () => {
      const s=steps(level), doc=text(level), bs=blocks(doc);
      expect(s.stage_slug).toBe('make-decision'); expect(s.steps).toHaveLength(count); expect(bs).toHaveLength(count);
      expect(s.steps.map(x=>x.step_id)).toEqual(Array.from({length:count},(_,i)=>i+1));
      expect(new Set(s.steps.map(x=>x.step_slug)).size).toBe(count); expect(s.steps.at(-1).step_slug).toBe('closeout');
      s.steps.forEach((step,i)=>{ expect(step.step_slug).toMatch(/^[a-z][a-z0-9-]+$/); expect(step.observable_result.trim()).not.toBe(''); expect(step.completion_evidence.length).toBeGreaterThan(0); for(const e of step.completion_evidence) { expect(e.kind).toBeTruthy(); expect(e.uri_or_path).toBeTruthy(); } expect(bs[i].id).toBe(i+1); expect(bs[i].title).toContain(step.step_slug); has(bs[i].body,/产物[^\n]*[：:][^\n]+/,'actual step output'); has(bs[i].body,/进入[^\n]*条件[^\n]*[：:][^\n]+/,'next step condition'); });
      for(const re of [/调研/,/大纲/,/决策|决定/,/收敛/,/不.{0,8}(写死|限制|固定).{0,15}(问题|提问|问答|轮数)/,/未决.{0,8}清零/,/跳过.{0,12}(不调用|不执行)/]) has(doc,re,'common actions and real skip');
      expect(doc).not.toMatch(/(?:最多|至多|上限[为是：:]?)\s*[1-9一二三四五六七八九十]+\s*(?:个问题|轮问答|轮提问)/);
    });
  }
  test('small: single confirmation precedes implementation; real diff and test failures stay visible', () => {
    const doc=text('small'), b=blocks(doc);
    expect(b).toHaveLength(9); has(b[1].body,/目标/,'outline goal'); has(b[1].body,/推翻/,'falsifiable outline');
    for(const re of [/方案/,/替代/,/验收/,/后果/]) has(b[3].body,re,'thin convergence is substantive');
    has(b[4].body,/spec/,'spec required'); has(b[4].body,/(?:1|一)\s*(?:个|张)?\s*Phase/,'one Phase');
    has(b[5].body,/确认/,'single confirmation at step 6'); has(doc,/N6/,'explicit downgrade source'); has(doc,/两次/,'two-confirmation downgrade'); has(doc,/理由|单模块|方案即骨架/,'downgrade reason');
    has(b[6].body,/实施/,'implementation after confirmation'); has(b[6].body,/测试/,'target execution'); has(b[6].body,/git diff --name-only|真实\s*diff|真实改动/,'real changed paths'); has(b[6].body,/写集/,'compare declared scope');
    for(const re of [/无独立审查|不设独立审查|不做独立审查/,/越界/,/记录|原件/,/失败/,/暂停.{0,12}物理交付/,/用户/,/修.{0,15}通过/]) has(doc,re,'small failure/scope contract');
    expect(steps('small').steps.some(s=>/review/.test(s.step_slug))).toBe(false);
    has(b[7].body,/一致性/,'consistency before delivery'); has(b[7].body,/反思/,'reflection'); has(b[8].body,/物理交付/,'physical delivery last');
  });
  test('normal: plan review, one confirmation, implementation and whole-diff review are ordered', () => {
    const doc=text('normal'), b=blocks(doc); expect(b).toHaveLength(11);
    has(b[2].body,/内部调研/,'internal research mandatory'); has(b[2].body,/talk-with-zhipeng/,'actual talk consumer');
    has(b[4].body,/1[–—~-]2|1\s*至\s*2|一至两/,'one to two Phase cards'); has(b[4].body,/默认.{0,8}1|默认.{0,8}一/,'one by default'); has(b[4].body,/独立交付/,'second Phase justification');
    has(b[5].body,/方案审/,'plan review at 6'); has(b[5].body,/细节|detail/,'existing detail track'); has(b[6].body,/确认/,'confirmation at 7'); has(b[7].body,/实施/,'implementation at 8'); has(b[8].body,/实现审|代码审/,'review at 9');
    expect(steps('normal').steps.filter(s=>s.step_slug==='implementation-review')).toHaveLength(1);
    for(const re of [/N6/,/两次/,/降级|跳过/,/理由|方案即|确认方案/,/整次实施.{0,12}一次/,/build-code/,/provider/,/spec/,/AC/,/测试.{0,12}(原件|回执|证据)/,/真实\s*diff|真实改动/,/声明写集|声明.{0,6}写集/,/不写.{0,15}build-code.{0,12}阶段行/,/报告.{0,20}差异/,/主动.{0,16}(调用|执行|发起|审)/,/失败/,/暂停.{0,12}物理交付/]) has(doc,re,'normal review and honest stage identity');
    for(const re of [/task_id/,/stage\s*[:=]\s*[`'"]?build-code/,/review_scope\s*[:=]\s*[`'"]?phase/,/subject_kind\s*[:=]\s*[`'"]?phase/,/review_kind\s*[:=]\s*[`'"]?null/,/phase_id\s*[:=]\s*[`'"]?null/,/review --action=record --stage=build-code/,/verify-code/]) has(doc,re,'P2 whole-implementation full tuple and existing review entry');
    has(doc,/不裁|不按.{0,8}Phase|整.{0,8}diff/,'whole implementation must not be cropped to a Phase');
    has(doc,/审查记录.{0,18}build-code/,'review record identity'); has(doc,/任务阶段.{0,15}(定方向|make-decision)/,'task stage remains decision');
  });
  test('planning: two confirmations surround direction and task-card detail reviews; no implementation artifacts', () => {
    const doc=text('planning'), b=blocks(doc); expect(b).toHaveLength(11);
    has(b[4].body,/确认/,'first confirmation at 5'); has(b[4].body,/骨架/,'skeleton approval'); has(b[5].body,/方向审/,'direction review after skeleton'); has(b[6].body,/任务卡/,'task convergence'); has(b[7].body,/细节审/,'detail review after convergence'); has(b[8].body,/确认/,'second confirmation at 9'); has(b[8].body,/细节/,'detail approval');
    for(const field of ['任务目标','范围','调研','方向','依赖','验收','风险','产出物','消费者']) expect(b[6].body).toContain(field);
    has(doc,/不产.{0,12}spec\s*[／/]\s*Phase/,'no spec/Phase'); has(doc,/不做实施|不实施/,'no implementation'); has(doc,/不做.{0,8}物理交付|不物理交付/,'no physical delivery'); has(b[10].body,/PRD/,'handoff consumer');
  });
});

describe('ORACLE-FLOW-STEPS: per-flow original skill denominator and cockpit ownership', () => {
  for(const level of ['complex','small','normal','planning']) {
    test(`${level}: all original 31 skills have an explicit status and reason, without duplicate definitions`, () => {
      const doc=text(level); expect(shared31).toHaveLength(31);
      for(const category of ['必需','按需','跳过']) expect(doc).toContain(category);
      for(const name of shared31) {
        const rows=doc.split('\n').filter(l=>l.startsWith('|') && new RegExp('`'+name+'`').test(l));
        expect(rows,`${level}/${name}: one explicit matrix row`).toHaveLength(1);
        has(rows[0],/必需|按需|跳过/,`${name}: selected applicability`);
        const cells=rows[0].split('|').map(x=>x.trim()).filter(Boolean); expect(cells.length,`${name}: status plus actual trigger/reason`).toBeGreaterThanOrEqual(3); expect(cells.at(-1).replace(/[`—-]/g,'').trim().length,`${name}: nonempty trigger or skip reason`).toBeGreaterThan(2);
        if(name==='mini-task') { has(rows[0],/跳过|退役/,'original denominator retained as retired'); has(rows[0],/entry-evaluation|入口/,'retired ability has migrated consumer'); }
        else { read(`skills/${name}/SKILL.md`); }
      }
      // A second level-specific definition would contradict the single shared owner.
      for(const flow of ['small','normal','planning']) if(existsSync(join(root,`${path}/flows/${flow}/skills`))) expect(readdirSync(join(root,`${path}/flows/${flow}/skills`))).toEqual([]);
    });
  }
  for(const level of ['small','normal','planning','complex']) test(`${level}: cockpit has explicit source, owner, sidecar and four update times`, () => {
    const doc=section(text(level),'驾驶舱');
    for(const re of [/answer-as-page/,/三个以上|3个以上/,/概念/,/分支/,/对比/,/层级/,/骨架确认后/,/每细化完一包/,/方向.{0,8}范围.{0,8}验收.{0,8}实质变化/,/Phase.{0,8}定稿.{0,8}收口前/,/调用者指定/,/任务库证据/,/overview-<date>\.html/,/同名.{0,12}\.nodes\.json/,/同一页面.{0,8}owner.{0,8}串行/,/缺环.{0,8}缺/,/尚未产生/,/到时会填什么/,/顶部/,/decision-log|决策记录/,/sha256|指纹/,/只读派生/,/不.{0,8}(进度账本|第二进度)/]) has(doc,re,'cockpit authority/update contract');
    if(level==='small') { has(doc,/不建页/,'small named exception'); has(doc,/小聊|一句事实|纯文字/,'N6 exception rationale'); }
  });
  test('dependencies, catalog and new-file responsibilities name real consumers', () => {
    const deps=yaml.load(read(`${path}/skill-deps.yaml`)); const entry=deps.skills.find(s=>s.name==='answer-as-page'); expect(entry).toBeDefined(); expect(entry.path).toBe('skills/answer-as-page/SKILL.md'); expect(entry.trigger.trim()).not.toBe('');
    const catalog=yaml.load(read('skills/catalog.yaml')); expect(catalog.skills.find(s=>s.name==='answer-as-page').used_by_stages).toContain('make-decision');
    const entries=JSON.parse(read('docs/architecture/move-map.json')).entries;
    for(const level of ['small','normal','planning']) for(const file of ['SKILL.md','steps.json']) { const p=`${path}/flows/${level}/${file}`; const e=entries.find(e=>e.destination===p); expect(e,`registered ${p}`).toBeDefined(); for(const k of ['owner','consumer','responsibility','delete_condition']) expect(e[k]?.trim(),`${p}/${k}`).toBeTruthy(); has(e.consumer,/make-decision|执行者|P6|P7/,'actual route consumer'); }
  });
});

// TCR-P5-CLARIFY-FINDING (182) and TCR-P5-ROUTING-FACTS (183).
// Append-only extension. The original 17 cases above remain byte-for-byte frozen.
// These validators read named human paragraphs, not runtime state or keyword counts.
const clarifyDimensions = ['user journey','page/surface','data/state','success','failure','permissions/actors','integrations/external effects','non-goals','deferred handoff','acceptance/evidence'];
function paragraph(s, label) {
  const match = s.match(new RegExp(`^\\s*\\*\\*${label}\\*\\*\\s*[：:]([^\\n]*(?:\\n(?!\\s*\\n|\\s*\\*\\*)[^\\n]+)*)`, 'm'));
  return match?.[1] ?? '';
}
function obligations(source, rules, prefix) {
  return rules.filter(([re])=>!re.test(source)).map(([,why])=>`${prefix}: ${why}`);
}
function affirmativeCommand(source, pattern) {
  return source.split(/[；;。\n]/).some(clause => {
    const re = new RegExp(pattern.source, pattern.flags.replace('g','')+'g');
    for (const match of clause.matchAll(re)) {
      const before=clause.slice(0,match.index);
      if (!/(?:不|不得|禁止|不应|不能|不要)\s*$/.test(before)) return true;
    }
    return false;
  });
}
function clarifyIssues(doc, step) {
  const body = blocks(doc).find(b=>b.id===5)?.body ?? '';
  const parts = ['读取','分类','十维核对','分支与续步'].map(label=>paragraph(body,label));
  const issues=[];
  let last=-1;
  for(const label of ['读取','分类','十维核对','分支与续步']) { const pos=body.indexOf(`**${label}**`); if(pos<0 || pos<=last) issues.push(`step5: ordered ${label}`); last=pos; }
  issues.push(...obligations(parts[0],[[/(?:实际|先|必须).{0,16}(?:读|消费).{0,24}skills\/spec-clarify\/SKILL\.md/,'read original method before classification']], 'step5/read'));
  issues.push(...obligations(parts[1],[[/Locked upstream decision/i,'locked upstream classification'],[/Upstream unresolved item/i,'upstream unresolved classification'],[/New ambiguity/i,'new ambiguity classification'],[/已答|已回答/,'inherit actual replies'],[/范围/,'inherit reply scope']], 'step5/classify'));
  for(const dimension of clarifyDimensions) if(!parts[2].toLowerCase().includes(dimension)) issues.push(`step5/dimensions: ${dimension}`);
  issues.push(...obligations(parts[2],[[/unknown/i,'unknown remains unknown'],[/deferred/i,'deferred remains deferred'],[/影响.{0,8}范围|影响范围/,'affected scope'],[/owner/,'named owner'],[/下一动作/,'next action'],[/不.{0,10}(?:补造|编造|伪造).{0,12}(?:事实|决定)|不得.{0,12}(?:事实|决定)/,'no invented fact or decision']], 'step5/dimensions'));
  const branch=parts[3];
  issues.push(...obligations(branch,[
    [/无.{0,6}(?:实质)?歧义[\s\S]*trigger\s*=\s*false/,'explicit no-ambiguity false branch'],
    [/具名原因|具体原因/,'named no-trigger reason'],[/零开放方向问题|0\s*(?:个)?开放方向问题/,'zero open direction questions'],
    [/实质歧义[\s\S]*frontier/,'material ambiguity current frontier'],[/独立轴|独立决策轴/,'only independent axes'],
    [/依赖轴.{0,12}(?:不提前|不得提前|留待)|不.{0,10}提前.{0,10}依赖轴/,'dependent axes wait'],
    [/发(?:布)?卡.{0,16}(?:归还|交还)控制/,'publishing returns control'],
    [/未.{0,8}(?:真实回复|真实答复)[\s\S]*不.{0,10}(?:改|修改|写)\s*spec/,'no spec edit before real reply'],
    [/未.{0,8}(?:真实回复|真实答复)[\s\S]*不.{0,10}(?:发起|启动|开始)审查/,'no review before real reply'],
    [/不.{0,8}(?:推断|代填|代答)/,'no simulated answer'],
    [/真实(?:回复|答复)[\s\S]*续[\s\S]*已具前提/,'resume only ready axes after reply'],
    [/已答.{0,12}不复问|不.{0,8}复问.{0,8}已答/,'do not re-ask answered facts'],
    [/环境.{0,12}(?:agent|代理).{0,12}核实/,'agent verifies observable environment'],
    [/冲突.{0,12}locked[\s\S]*不.{0,10}(?:伪装|冒).{0,8}新选择/i,'do not repackage locked conflict'],
  ],'step5/branch'));
  const contradictions=[/有(?:具体|实质)?歧义才(?:读|读取)/,/无歧义.{0,10}跳过.{0,10}(?:读取|原方法)/,/提问后(?:仍|直接|同次)?继续.{0,10}(?:改\s*spec|审查)/,/未(?:获)?真实回复(?:仍|直接)?(?:继续|续步)/,/已答(?:项)?(?:仍|重新)(?:提问|问)/,/提前(?:询问|问)依赖轴/,/unknown.{0,8}(?:补成|填成)事实/i];
  if(contradictions.some(re=>affirmativeCommand(body,re))) issues.push('step5: affirmative contradictory instruction');
  const row=doc.split('\n').find(l=>/^\|\s*`spec-clarify`\s*\|/.test(l)) ?? '';
  if(!/^\|\s*`spec-clarify`\s*\|\s*必需\s*\|/.test(row)) issues.push('skill row: original clarify method is mandatory');
  issues.push(...obligations(step?.observable_result ?? '',[[/skills\/spec-clarify\/SKILL\.md/,'step5 original-method reader'],[/已答|Locked upstream/i,'step5 classification'],[/十维|user journey/,'step5 ten dimensions'],[/trigger\s*=\s*false/,'step5 explicit no-trigger branch'],[/真实回复|真实答复/,'step5 real response continuation']], 'steps observable'));
  return issues;
}
function routeIssues(entry, load, canonical, decision) {
  const issues=[];
  const writer=paragraph(entry,'唯一写入');
  for(const field of ['status','reason','expanded_risks','choices','boundary_clear','single_outcome','limited_impact','major_architecture','migration','permission','security']) if(!writer.includes(field)) issues.push(`canonical writer: ${field}`);
  for(const [s,label] of [[writer,'entry writer'],[canonical,'template canonical']]) issues.push(...obligations(s,[[/级别与路线/,'canonical section'],[/独立可交付验收单元数/,'delivery-unit fact'],[/用户在场或真实凭证/,'human/credential cost fact'],[/逐项来源/,'per-fact sources'],[/调用命令/,'invocation reference'],[/返回.{0,12}原\s*ref/,'single response original reference'],[/唯一|单份/,'single writer/original']],label));
  for(const s of [writer,canonical]) for(const field of ['status','reason','expanded_risks','choices']) if(!s.includes(field)) issues.push(`canonical return field: ${field}`);
  issues.push(...obligations(load,[[/evaluateEntryRoute/,'real entry function'],[/实际调用/,'actual invocation'],[/只写.{0,20}级别与路线/,'load writes canonical only'],[/工作包与决定[\s\S]*只.{0,8}引用/,'workpackage reference only'],[/不.{0,12}(?:复制|抄).{0,12}(?:取值|原值|返回)/,'no second values']], 'complex load'));
  for(const [s,label] of [[entry+'\n'+load,'root'],[canonical,'template']]) issues.push(...obligations(s,[
    [/未返回/,'absent response fields stay absent'],[/unassessed[\s\S]*owner/,'missing source unassessed owner'],[/未评估|未决/,'unavailable evaluation remains unresolved'],
    [/paused[\s\S]*(?:第\s*8\s*步|第8)[\s\S]*(?:第\s*13\s*步|第13)[\s\S]*至少一条[\s\S]*拆分/,'paused displayed with split option at 8/13'],
    [/原\s*ref[\s\S]*(?:缺失|不可回读|不可得)[\s\S]*(?:缺口|原件不可得)/,'missing original is reported'],
    [/不.{0,12}(?:另存|复制)[\s\S]*raw|raw[\s\S]*不.{0,12}(?:另存|复制)/,'raw bytes single original'],
  ],label));
  for(const field of ['做什么','不做什么','风险','改动']) if(!decision.includes(`**${field}**`)) issues.push(`D-0xx: ${field}`);
  issues.push(...obligations(decision,[[/级别与路线/,'decision references canonical'],[/原\s*ref/,'decision references original'],[/只.{0,8}引用/,'decision has no duplicate values']], 'D-0xx'));
  // The decision body and complex loader must not command a second fact writer.
  for(const [s,label] of [[load,'complex load'],[decision,'D-0xx']]) {
    if(affirmativeCommand(s,/(?:记入|写入|记录)[^；;。\n]{0,100}工作包与决定/) || s.split(/[；;。\n]/).some(clause=>clause.includes('工作包与决定') && affirmativeCommand(clause,/(?:逐项记录|存四原值|复制返回|记录真实返回)/))) issues.push(`${label}: second writer`);
    if(/(?:记录|保存|复制)[^。\n]{0,80}(?:status|expanded_risks)[^。\n]{0,80}(?:原值|真实返回|逐项记录)|返回包含的[^。\n]{0,120}逐项记录/.test(s)) issues.push(`${label}: copied return values`);
    if(/(?:记录|复制|保存)本任务承诺的独立可交付验收单元数/.test(s)) issues.push(`${label}: copied cost fact`);
  }
  if(/缺(?:失)?\s*ref[^。\n]{0,70}(?:用|读取)工作包[^。\n]{0,30}(?:兜底|原值)|复制raw到第二原件/.test(entry+'\n'+load+'\n'+canonical)) issues.push('canonical: duplicate raw or fallback writer');
  return issues;
}
function readerIssues(doc, level='complex') {
  const issues=[];
  if(level==='planning' && !/实施不适用|不做实施|不实施/.test(doc)) issues.push('reader: planning implementation is N/A');
  for(const [re,name] of [[/(?:选步骤|选择步骤)前[^；;。\n]*读[^；;。\n]*级别与路线/,'step selection'],[level==='planning' ? /(?:审查|组装审查)[^；;。\n]*前[^；;。\n]*读[^；;。\n]*级别与路线/ : /(?:实施|组装审查)[^；;。\n]*前[^；;。\n]*读[^；;。\n]*级别与路线/,'implementation/review'],[/(?:反思|物理交付|交接)[^；;。\n]*前[^；;。\n]*读[^；;。\n]*级别与路线/,'reflection/delivery'],[/(?:逐\s*AC|逐条验收)[^；;。\n]*前[^；;。\n]*读[^；;。\n]*级别与路线/,'acceptance']]) if(!re.test(doc)) issues.push(`reader: ${name}`);
  if(!/原\s*ref[\s\S]*(?:缺失|不可回读)[\s\S]*缺口[\s\S]*owner[\s\S]*复杂/.test(doc)) issues.push('reader: missing original owner and complex fallback');
  if(!/不.{0,12}(?:冒|当).{0,12}(?:用户授权|授权)/.test(doc)) issues.push('reader: fallback is not authorization');
  return issues;
}

describe('ORACLE-FLOW-STEPS appended TCR182/183: method consumption and canonical writer',()=>{
  test('root binds decision-log writes to the authenticated worktree material route',()=>{
    const doc=text('complex');
    for(const phrase of [
      '认证 worktree 的 `specs/<task-id>/decision-log.md`',
      'run --action=draft --stage=make-decision --name=decision-log.md',
      '`taskPath` 只用于 `task.json`、`facts.jsonl`、`quality/` 和 `evidence/`',
      '不得把 `taskPath` 或 `WORKFLOWHUB_TASK_DIR` 当作当前材料／decision-log 的写入根',
      '记录 `unavailable` 并停止该写入路径，不 fallback 到 taskPath',
    ]) expect(doc,`decision-log canonical material writer: ${phrase}`).toContain(phrase);
  });
  for(const level of ['small','normal']) test(`${level}: step5 consumes clarify before deciding whether to ask`,()=>{
    expect(clarifyIssues(text(level),steps(level).steps[4])).toEqual([]);
  });
  test('root and D-0xx use one entry fact writer while preserving return/failure contracts',()=>{
    const doc=text('complex'), template=read('skills/decision-log/templates/decision-log-template.md');
    const load=doc.match(/1\. `load-context`：[\s\S]*?(?=\n2\. `)/)?.[0] ?? '';
    expect(routeIssues(section(doc,'入口路由'),paragraph(load,'入口评估'),section(template,'级别与路线'),section(template,'D-0xx'))).toEqual([]);
  });
  for(const level of ['complex','small','normal','planning']) test(`${level}: each consumer reads canonical route at its own action boundary`,()=>{
    expect(readerIssues(section(text(level),level==='complex'?'入口路由':level==='planning'?'边界与读取点':'材料、身份与读取点'),level)).toEqual([]);
  });
});

// Independent legal human-material examples exercise each checker before its
// production result is trusted. A mutation changes only one obligation.
const clarifyLegalBody = `
### 5. \`write-light-materials\`
**产物**：方案。
**读取**：先实际读取 skills/spec-clarify/SKILL.md 原方法。
**分类**：Locked upstream decision、Upstream unresolved item、New ambiguity；已答继承真实回复和范围。
**十维核对**：${clarifyDimensions.join('、')}；unknown/deferred 保留影响范围、owner、下一动作，不补造事实或决定。
**分支与续步**：无实质歧义时 trigger=false，记录具名原因和零开放方向问题；有实质歧义按当前 frontier 批问独立轴，不提前问依赖轴。发布卡即归还控制；未获真实回复不修改 spec、不启动审查，不代答。真实回复后只续已具前提轴；已答不复问。环境事实由 agent 核实，冲突 locked 的候选不伪装新选择。
**进入下一步条件**：上述真实消费完成。
## 技能清单
| \`spec-clarify\` | 必需 | 先读原方法后判触发。 |`;
const clarifyLegalStep={observable_result:'实际读取 skills/spec-clarify/SKILL.md；已答分类与十维核对，无歧义 trigger=false，实际歧义等真实回复后续。'};
const routeLegalWriter='级别与路线唯一写入 status/reason/expanded_risks/choices；boundary_clear/single_outcome/limited_impact/major_architecture/migration/permission/security；独立可交付验收单元数，用户在场或真实凭证，逐项来源、调用命令、返回原 ref。';
const routeLegalFailures='未返回不补值；缺来源 unassessed 与 owner；不可用保持未评估/未决；paused 在第8步与第13步同批展示至少一条拆分建议；原 ref 缺失或不可回读时报原件不可得缺口，不另存或复制 raw。';
const routeLegalEntry=`**唯一写入**：${routeLegalWriter}\n\n${routeLegalFailures}`;
const routeLegalLoad='实际调用 evaluateEntryRoute，返回只写「级别与路线」；工作包与决定只引用 canonical 稳定锚与必要决定含义，不复制返回取值。'+routeLegalFailures;
const routeLegalCanonical='## 级别与路线\n'+routeLegalWriter+routeLegalFailures;
const routeLegalDecision='#### D-0xx — 入口评估\n- **做什么**：只引用级别与路线及真实原 ref。\n- **不做什么**：不复制取值。\n- **风险**：失败沿唯一节。\n- **改动**：原四字段 shape 保留。';
const readerLegal='选步骤前读取级别与路线；确认后实施与组装审查前读取级别与路线；反思与物理交付前读取级别与路线；逐 AC 对账前读取级别与路线。原 ref 缺失或不可回读时记录缺口与 owner、按复杂处理，不冒用户授权。';
describe('ORACLE-FLOW-STEPS appended checker counterexamples (controlled material only)',()=>{
  test('clarify checker: legal → each single violation rejected → same legal restored',()=>{
    expect(clarifyIssues(clarifyLegalBody,clarifyLegalStep)).toEqual([]);
    const mutations=[
      ['skill row conditional',s=>s.replace('| 必需 |','| 按需 |')],
      ['list-only method name',s=>s.replace('**读取**：先实际读取 skills/spec-clarify/SKILL.md 原方法。','**读取**：材料可读。')],
      ['read only after judging ambiguity',s=>s.replace('先实际读取 skills/spec-clarify/SKILL.md 原方法。','有实质歧义才读取 skills/spec-clarify/SKILL.md。')],
      ['classification missing',s=>s.replace('Upstream unresolved item','')],
      ...clarifyDimensions.map(d=>[`dimension missing ${d}`,s=>s.replace(d,'')]),
      ['unknown invented',s=>s.replace('unknown/deferred 保留影响范围','unknown补成事实；deferred 保留影响范围')],
      ['false branch missing',s=>s.replace('trigger=false','未触发')],
      ['false reason missing',s=>s.replace('具名原因','')],
      ['open questions missing',s=>s.replace('零开放方向问题','')],
      ['continue in same invocation',s=>s.replace('发布卡即归还控制','发布卡即归还控制；提问后同次继续改spec')],
      ['resume without response',s=>s.replace('真实回复后只续已具前提轴','未获真实回复仍继续；真实回复后只续已具前提轴')],
      ['re-ask answered facts',s=>s.replace('已答不复问','已答重新提问')],
      ['ask dependent axes early',s=>s.replace('不提前问依赖轴','提前问依赖轴')],
    ];
    for(const [name,mutate] of mutations) { const changed=mutate(clarifyLegalBody); expect(changed,name).not.toBe(clarifyLegalBody); expect(clarifyIssues(changed,clarifyLegalStep).length,name).toBeGreaterThan(0); expect(clarifyIssues(clarifyLegalBody,clarifyLegalStep),`${name}: restoration`).toEqual([]); }
    expect(clarifyIssues(clarifyLegalBody,{observable_result:'只有材料，没有原方法读取点。'}).length,'steps drift').toBeGreaterThan(0);
  });
  test('canonical writer checker: legal → second writer or lost failure fact rejected → restored',()=>{
    const legal=[routeLegalEntry,routeLegalLoad,routeLegalCanonical,routeLegalDecision];
    expect(routeIssues(...legal)).toEqual([]);
    const mutations=[
      ['complex writes workpackage',1,s=>s+'把返回四值记入工作包与决定。'],
      ['negated then affirmative second writer',1,s=>s+'工作包不复制原值；仍把返回四值记入工作包与决定。'],
      ['template copies return values',3,s=>s+'返回包含的 status/reason/expanded_risks/choices 逐项记录。'],
      ['template copies cost values',3,s=>s+'记录本任务承诺的独立可交付验收单元数。'],
      ['workpackage fallback',0,s=>s+'缺ref时用工作包原值兜底。'],
      ['duplicate raw original',0,s=>s+'复制raw到第二原件。'],
      ['unassessed source owner missing',2,s=>s.replace('unassessed 与 owner','unknown')],
      ['absent field invented',2,s=>s.replace('未返回不补值','未有项补成功')],
      ['paused split missing',2,s=>s.replace('至少一条拆分建议','仅报暂停')],
      ['canonical raw reference missing',2,s=>s.replaceAll('原 ref','历史值')],
      ['canonical field missing',0,s=>s.replace('expanded_risks','')],
      ['four-field shape broken',3,s=>s.replace('**风险**','**备注**')],
    ];
    for(const [name,index,mutate] of mutations) { const changed=[...legal]; changed[index]=mutate(changed[index]); expect(changed[index],name).not.toBe(legal[index]); expect(routeIssues(...changed).length,name).toBeGreaterThan(0); expect(routeIssues(...legal),`${name}: restoration`).toEqual([]); }
  });
  test('reader checker: an opening-only read or one consumer reading another section is rejected',()=>{
    expect(readerIssues(readerLegal)).toEqual([]);
    const clauses=['选步骤前读取级别与路线','确认后实施与组装审查前读取级别与路线','反思与物理交付前读取级别与路线','逐 AC 对账前读取级别与路线'];
    for(const clause of clauses) for(const replacement of ['',clause.replace('级别与路线','工作包与决定'),clause.replace('前读取','只启动时读取')]) {
      expect(readerIssues(readerLegal.replace(clause,replacement)).length,`individual reader: ${clause} -> ${replacement}`).toBeGreaterThan(0);
      expect(readerIssues(readerLegal)).toEqual([]);
    }
    const planningLegal=readerLegal.replace('确认后实施与组装审查前','组装审查前').replace('反思与物理交付前','反思与交接前')+'实施不适用。';
    expect(readerIssues(planningLegal,'planning')).toEqual([]);
    expect(readerIssues(planningLegal.replace('实施不适用。',''),'planning').length).toBeGreaterThan(0);
    expect(()=>section('## 其它标题\n有读取文字。','边界与读取点')).toThrow();
    for(const source of [readerLegal.replace('逐 AC 对账前读取级别与路线','逐 AC 对账前读取工作包与决定'),readerLegal.replace('实施与组装审查前读取级别与路线','实施与组装审查只沿启动时读取的级别与路线'),readerLegal.replace('原 ref 缺失或不可回读时记录缺口与 owner、按复杂处理','原 ref 缺失时沿用工作包值')]) { expect(readerIssues(source).length).toBeGreaterThan(0); expect(readerIssues(readerLegal)).toEqual([]); }
  });
});


// N10 P6/T031 additive oracle; all earlier cases and TCR segments remain unchanged.
describe('N10 direction review order',()=>{
  function directionOrderIssues(body,list){
    const required=['direction-advice','module-breadth-confirm','module-convergence','detail-advice'];
    const indexes=required.map(slug=>list.findIndex(s=>s.step_slug===slug));
    const issues=[];
    const positions=required.map(slug=>body.indexOf('`'+slug+'`：'));
    if(positions.some(i=>i<0)||positions.some((v,i)=>i>0&&v<=positions[i-1]))issues.push('text order');
    if(list.length!==15||list.some((v,i)=>v.step_id!==i+1))issues.push('step shape');
    if(indexes.some(i=>i<0)||indexes.some((v,i)=>i>0&&v<=indexes[i-1]))issues.push('order');
    const part=n=>body.split(new RegExp('^'+n+'\\. `','m'))[1]?.split(/^\d+\. `/m)[0]??'';
    if(!/只问方向轴与骨架/.test(part(5))||!/第 9 步/.test(part(5)))issues.push('outline scope');
    if(!/第 7 步方向审查已回读/.test(part(8))||!/未达不开始逐包收敛/.test(part(8)))issues.push('readback');
    return issues;
  }
  test('direction review order: legal material rejects removed guards and swapped steps',()=>{
    const body=text('complex'),list=steps('complex').steps;
    expect(directionOrderIssues(body,list)).toEqual([]);
    for(const needle of ['只问方向轴与骨架','第 7 步方向审查已回读','未达不开始逐包收敛'])expect(directionOrderIssues(body.replace(needle,'已删除'),list).length).toBeGreaterThan(0);
    const seven=body.match(/^7\. `direction-advice`：[\s\S]*?(?=^8\. `)/m)?.[0];
    expect(seven).toBeTruthy();
    expect(directionOrderIssues(body.replace(seven,'').replace(/^10\. `/m,seven+'10. `'),list)).toContain('text order');
    const changed=structuredClone(list);[changed[6],changed[8]]=[changed[8],changed[6]];
    expect(directionOrderIssues(body,changed)).toContain('order');
    expect(directionOrderIssues(body,list)).toEqual([]);
  });
});

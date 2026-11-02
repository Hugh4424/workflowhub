// ORACLE-C07-AUTHORING / validator: preserve real trace and failure contracts.
import { test, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { validatePostPhaseContract } from '../../runtime/stage/stage-content-contracts.mjs';
function examples(){const text=readFileSync('skills/spec-plan/templates/phase-template.md','utf8');const block=name=>text.split(`<!-- card05-author-example:${name} -->`)[1].match(/```markdown\n([\s\S]*?)\n```/)[1];return {spec:block('spec'),index:block('index'),phases:{'phases/P1-行为结果.md':block('phase-behavior'),'phases/P2-文档核对.md':block('phase-document')}};}
const prose='读取 src/owned.mjs 并把 owned 导出改为布尔 false。\n验证实际输出，导入失败时保留错误交原作者修复。\n';
function alter(input,change){return {...input,phases:{...input.phases,'phases/P1-行为结果.md':change(input.phases['phases/P1-行为结果.md'])}};}
function withoutCardProse(input){return {...input,phases:Object.fromEntries(Object.entries(input.phases).map(([path,text])=>[path,text.replace(/(^### (?:T\d+|任务 \d+)[^\n]*\n)([\s\S]*?)(?=^## |(?![\s\S]))/gm,(_,heading,body)=>heading+'\n'+body.split('\n').filter(line=>/^- \*\*/.test(line)).join('\n')+'\n\n')]))};}
test('diagnostic reports field-only cards without rejecting them; required rejects them',()=>{const i=alter(examples(),text=>text.replace(/(### 任务 1[^\n]*\n)[\s\S]*?(?=- \*\*任务编号)/,'$1\n'));const r=validatePostPhaseContract({...i,prose_contract:'diagnostic'});expect(r.errors).toEqual([]);expect(r.facts.card_prose_gaps).toContain('phases/P1-行为结果.md T001');expect(validatePostPhaseContract(i).ok).toBe(false);});
test('archive material path explicitly selects diagnostic without cohort inference',()=>{const r=validatePostPhaseContract({...examples(),material_path:'specs/archive/frozen-task'});expect(r.facts.prose_mode).toBe('diagnostic');expect(validatePostPhaseContract({...examples(),material_path:'specs/frozen-task',activation_cohort:'pre'}).facts.prose_mode).toBe('required');});
test('path classification cannot downgrade no-path, nonarchive or cohort-only current inputs',()=>{const i=withoutCardProse(examples());for(const extras of [{},{material_path:'specs/current-task'},{activation_cohort:'pre'},{material_path:'specs/current-task',activation_cohort:'post'}]){const r=validatePostPhaseContract({...i,...extras});expect(r.ok).toBe(false);expect(r.facts.prose_mode).toBe('required');expect(r.facts.card_prose_gaps).toHaveLength(2);}const archive=validatePostPhaseContract({...i,material_path:'specs/archive/frozen-task'});expect(archive.errors).toEqual([]);expect(archive.facts.card_prose_gaps).toHaveLength(2);const forced=validatePostPhaseContract({...i,material_path:'specs/archive/frozen-task',prose_contract:'required'});expect(forced.ok).toBe(false);expect(forced.facts.prose_mode).toBe('required');});
test('missing Action and Inputs are facts when actual prose supplies concrete action',()=>{const i=alter(examples(),text=>text.replace(/(### 任务 1[^\n]*\n)/,'$1\n'+prose).replace(/^- \*\*(?:Action|Inputs)\*\*[^\n]*\n/gm,''));const r=validatePostPhaseContract(i);expect(r.errors).toEqual([]);expect(r.facts.field_gaps).toEqual(expect.arrayContaining([expect.objectContaining({task_id:'T001',field:'Action'}),expect.objectContaining({task_id:'T001',field:'Inputs'})]));});
test('missing actual task action cannot be supplied by index navigation',()=>{const i=alter(examples(),text=>text.replace(/^- \*\*Action\*\*[^\n]*\n/m,''));i.index+='\nAction: preserve source and failure.\n';const r=validatePostPhaseContract(i);expect(r.ok).toBe(false);expect(r.errors).toContain('phases/P1-行为结果.md T001 task card missing concrete Action');});
test('diagnostic preserves executable command, trace, write-set and dependency errors',()=>{const i=alter(examples(),text=>text.replace(/^- \*\*RED\/GREEN gate_cmd\*\*[^\n]*\n/m,'').replace('`src/owned.mjs`；symbol: owned','`src/not-owned.mjs`；symbol: owned').replace('- **Dependency**：none','- **Dependency**：T999'));const r=validatePostPhaseContract({...i,prose_contract:'diagnostic'});expect(r.ok).toBe(false);expect(r.errors.some(e=>e.includes('RED/GREEN gate_cmd'))).toBe(true);expect(r.errors.some(e=>e.includes('owned write-set'))).toBe(true);});
test('diagnostic retains each of the seven existing executable and trace field contracts',()=>{for(const field of ['Source / FR / AC','Files / symbols','Dependency','RED/GREEN gate_cmd','expected_exit','RED target failure','GREEN oracle']){const i=alter(examples(),text=>text.replace(/(### 任务 1[^\n]*\n)([\s\S]*)/,(_,heading,body)=>heading+body.split('\n').filter(line=>!line.startsWith('- **'+field+'**')).join('\n')));const r=validatePostPhaseContract({...i,prose_contract:'diagnostic'});expect(r.ok,field).toBe(false);expect(r.facts.field_gaps).toContainEqual(expect.objectContaining({task_id:'T001',field}));}});
test('reader prose ignores invisible comments and fenced example text',()=>{const i=alter(withoutCardProse(examples()),text=>text.replace(/(### 任务 1[^\n]*\n)/,'$1\n<!-- 隐藏注释不提供读者正文。 -->\n\n```text\n这里只是围栏示例，不是本卡正文。\n```\n'));const r=validatePostPhaseContract(i);expect(r.facts.card_prose_gaps).toContain('phases/P1-行为结果.md T001');expect(r.errors).toContain('phases/P1-行为结果.md T001 task card requires reader prose');});
test('unknown prose mode fails visibly',()=>{const r=validatePostPhaseContract({...examples(),prose_contract:'skip'});expect(r.ok).toBe(false);expect(r.errors.some(e=>e.includes('prose_contract'))).toBe(true);});

// Same-round review sources: standards100/F1 and spec102/F1-F2.
function firstCardWithoutProse(){const original=examples(),input=withoutCardProse(original);input.phases['phases/P2-文档核对.md']=original.phases['phases/P2-文档核对.md'];return input;}
test.each([
  ['different fence character','```text\n~~~\n这里只是代码示例。\n~~~\n```'],
  ['short tilde close','~~~~text\n~~~\n这里只是代码示例。\n~~~\n~~~~'],
  ['short backtick close','````text\n```\n这里只是代码示例。\n```\n````'],
  ['invalid closing suffix','```text\n```invalid\n这里只是代码示例。\n```'],
])('reader prose excludes mismatched fenced examples: %s',(name,example)=>{const input=alter(firstCardWithoutProse(),text=>text.replace(/(### 任务 1[^\n]*\n)/,'$1\n'+example+'\n'));const required=validatePostPhaseContract(input);expect(required.ok,name).toBe(false);expect(required.errors).toContain('phases/P1-行为结果.md T001 task card requires reader prose');const diagnostic=validatePostPhaseContract({...input,prose_contract:'diagnostic'});expect(diagnostic.errors).toEqual([]);expect(diagnostic.facts.card_prose_gaps).toContain('phases/P1-行为结果.md T001');const restored=alter(input,text=>text.replace(/(### 任务 1[^\n]*\n)/,'$1\n'+prose));expect(validatePostPhaseContract(restored).errors).toEqual([]);});
test.each(['TODO','N/A','[占位]','**TODO**','`TBD`'])('placeholder Action cannot substitute a concrete task action: %s',placeholder=>{const input=alter(examples(),text=>text.replace(/(- \*\*Action\*\*：)[^\n]*/,'$1'+placeholder));const result=validatePostPhaseContract(input);expect(result.ok).toBe(false);expect(result.errors).toContain('phases/P1-行为结果.md T001 task card missing concrete Action');expect(result.facts.field_gaps).toContainEqual(expect.objectContaining({task_id:'T001',field:'Action'}));const restored=alter(input,text=>text.replace(/(### 任务 1[^\n]*\n)/,'$1\n'+prose));expect(validatePostPhaseContract(restored).errors).toEqual([]);});

// Formal OCR051 codex/luna F2: only affirmative, Task-bound prose can replace Action.
test.each(['本卡不修改任何文件。','本卡不读取 src/owned.mjs。','本卡无需验证 src/owned.mjs。','Do not change src/owned.mjs.','读者可以检查自己的笔记。','修改 docs/unrelated.md 的说明。'])('negated or unrelated prose cannot supply missing Action: %s',description=>{const input=alter(firstCardWithoutProse(),text=>text.replace(/^- \*\*Action\*\*[^\n]*\n/m,'').replace(/(### 任务 1[^\n]*\n)/,'$1\n'+description+'\n'));const result=validatePostPhaseContract(input);expect(result.ok).toBe(false);expect(result.errors).toContain('phases/P1-行为结果.md T001 task card missing concrete Action');const restored=alter(input,text=>text.replace(description,'不修改其它文件，但读取 src/owned.mjs 并验证 owned 的返回值。'));expect(validatePostPhaseContract(restored).errors).toEqual([]);});

// Independent228 and original Spec124: the existing Files/symbols anchors the object.
test.each(['修改 owned 导出，使其返回布尔 false。','读取 owned 导出并将其改为布尔 false。','修改 `owned` 导出，使其返回布尔 false。'])('declared symbol action does not require repeating a pathname: %s',description=>{const input=alter(examples(),text=>text.replace(/^- \*\*Action\*\*[^\n]*\n/m,'').replace(/(### 任务 1[^\n]*\n)/,'$1\n'+description+'\n'));const result=validatePostPhaseContract(input);expect(result.errors).toEqual([]);expect(result.facts.field_gaps).toContainEqual(expect.objectContaining({task_id:'T001',field:'Action'}));expect(result.facts.card_prose_gaps).toEqual([]);});
test.each(['修改 not_owned 导出，使其返回布尔 false。','修改 ownedElse 导出，使其返回布尔 false。','本卡不修改 owned 导出。'])('nearby or negated symbol cannot supply missing Action: %s',description=>{const input=alter(firstCardWithoutProse(),text=>text.replace(/^- \*\*Action\*\*[^\n]*\n/m,'').replace(/(### 任务 1[^\n]*\n)/,'$1\n'+description+'\n'));const result=validatePostPhaseContract(input);expect(result.errors).toContain('phases/P1-行为结果.md T001 task card missing concrete Action');});

// Current-shape regression: Phase-level fields and task-card fields share
// labels. Only the pre-card region and the file-end machine block may supply a
// Phase-level value; a same-named card field must never stand in.
function splitPhaseMachine(text) {
  const at = text.indexOf('## 机器字段');
  return at < 0 ? [text, ''] : [text.slice(0, at), text.slice(at)];
}
function dropPhaseField(text, label) {
  const [head, tail] = splitPhaseMachine(text);
  return head + tail.split('\n').filter(line => !line.startsWith(`- **${label}**`)).join('\n');
}
function addCardLine(text, line) {
  return text.replace('- **Dependency**：none', '- **Dependency**：none\n' + line);
}
test('a same-named task-card dependency cannot override the Phase-level none', () => {
  const input = alter(examples(), text => text.replace('- **Dependency**：none', '- **依赖**：无，第一张卡。'));
  const result = validatePostPhaseContract(input);
  expect(result.errors).toEqual([]);
  expect(result.ok).toBe(true);
});
test('Chinese same-name dependency in card and machine block reads the Phase-level none', () => {
  const input = alter(examples(), text => {
    const [head, tail] = splitPhaseMachine(text);
    return head.replace('- **Dependency**：none', '- **依赖**：无，第一张卡。')
      + tail.replace('- **Dependency**：none', '- **依赖**：none');
  });
  const result = validatePostPhaseContract(input);
  expect(result.errors).toEqual([]);
  expect(result.ok).toBe(true);
});
test('a task-card dependency cannot supply a missing Phase-level dependency', () => {
  const input = alter(examples(), text => dropPhaseField(text, 'Dependency'));
  const result = validatePostPhaseContract(input);
  expect(result.ok).toBe(false);
  expect(result.errors).toContain('phases/P1-行为结果.md dependency must match the index and reference only earlier Phase IDs');
});
test.each([
  ['Write set', /Write set is missing/],
  ['消费者', /consumer differs from Phase index/],
  ['STOP', /requires STOP, Done, and evidence_path/],
  ['Done', /requires STOP, Done, and evidence_path/],
  ['gate_cmd', /requires an executable gate_cmd and oracle/],
  ['oracle', /requires an executable gate_cmd and oracle/],
  ['evidence_path', /requires STOP, Done, and evidence_path/],
])('Phase-level %s never borrows a same-named task-card field', (label, expected) => {
  const value = label === 'gate_cmd' ? '`node fake.mjs`'
    : label === 'oracle' ? 'ORACLE-FAKE'
    : label === 'Write set' ? '`fake.md`'
    : label === '消费者' ? 'fake consumer'
    : label === 'evidence_path' ? '`quality/fake.json`'
    : 'fake';
  const input = alter(examples(), text => dropPhaseField(addCardLine(text, `- **${label}**：${value}`), label));
  const result = validatePostPhaseContract(input);
  expect(result.ok).toBe(false);
  expect(result.errors.join('; ')).toMatch(expected);
});
test('task cards after the file-end machine block are rejected', () => {
  const input = alter(examples(), text => text + '\n### 任务 99：late\n\n迟到正文。\n');
  const result = validatePostPhaseContract(input);
  expect(result.ok).toBe(false);
  expect(result.errors).toContain('phases/P1-行为结果.md task cards must appear before the file-end machine block');
});

// Wrapped machine values: the first-line value plus indented continuation
// lines form one value. Empty or placeholder first lines stay errors.
test('wrapped Files/symbols continuation is merged before symbol judgment', () => {
  const input = alter(examples(), text => text.replace('- **Files / symbols**：`src/owned.mjs`；symbol: owned', '- **Files / symbols**：`src/owned.mjs`；\n  （修改；symbol: owned）'));
  const result = validatePostPhaseContract(input);
  expect(result.errors).toEqual([]);
});
test('wrapped Source/FR/AC continuation binds both ids', () => {
  const input = alter(examples(), text => text.replace('- **Source / FR / AC**：R-001 / FR-EXAMPLE-001 / AC-EXAMPLE-001；导出必须严格为false，失败不能回退。', '- **Source / FR / AC**：R-001 / FR-EXAMPLE-001 /\n  AC-EXAMPLE-001；导出必须严格为false，失败不能回退。'));
  const result = validatePostPhaseContract(input);
  expect(result.errors).toEqual([]);
});
test('continuation without a first-line Files value is an error', () => {
  const input = alter(examples(), text => text.replace('- **Files / symbols**：`src/owned.mjs`；symbol: owned', '- **Files / symbols**：\n  `src/owned.mjs`；symbol: owned'));
  const result = validatePostPhaseContract(input);
  expect(result.errors).toContain('phases/P1-行为结果.md T001 Files / symbols must name a symbol or explain N/A for non-code files');
});
test('a placeholder first-line Files value is not rescued by a continuation', () => {
  const input = alter(examples(), text => text.replace('- **Files / symbols**：`src/owned.mjs`；symbol: owned', '- **Files / symbols**：TBD\n  `src/owned.mjs`；symbol: owned'));
  const result = validatePostPhaseContract(input);
  expect(result.errors).toContain('phases/P1-行为结果.md T001 Files / symbols must name a symbol or explain N/A for non-code files');
});
test('wrapped Phase Write set merges the continuation path', () => {
  const input = alter(examples(), text => {
    const [head, tail] = splitPhaseMachine(text);
    return head + tail.replace('- **Write set**：`src/owned.mjs`', '- **Write set**：本 Phase 只改\n  `src/owned.mjs`');
  });
  const result = validatePostPhaseContract(input);
  expect(result.errors).toEqual([]);
});
test('Phase Write set continuation without a first-line value is missing', () => {
  const input = alter(examples(), text => {
    const [head, tail] = splitPhaseMachine(text);
    return head + tail.replace('- **Write set**：`src/owned.mjs`', '- **Write set**：\n  `src/owned.mjs`');
  });
  const result = validatePostPhaseContract(input);
  expect(result.errors).toContain('phases/P1-行为结果.md Write set is missing');
});
test('wrapped Phase dependency merges a continuation note', () => {
  const input = alter(examples(), text => text.replace('- **依赖**：P1', '- **依赖**：P1\n  （先看 P1 的结果）'));
  const result = validatePostPhaseContract(input);
  expect(result.errors).toEqual([]);
});
test('Phase Done continuation without a first-line value is missing', () => {
  const input = alter(examples(), text => {
    const [head, tail] = splitPhaseMachine(text);
    return head + tail.replace(/- \*\*Done\*\*：.*$/m, '- **Done**：\n  AC-EXAMPLE-001按原判据逐条件核实际命令与失败反例。');
  });
  const result = validatePostPhaseContract(input);
  expect(result.errors).toContain('phases/P1-行为结果.md requires STOP, Done, and evidence_path');
});

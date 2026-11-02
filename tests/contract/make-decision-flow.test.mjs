// ORACLE-P6-MAKE-DECISION-FLOW — P6/T015–T017, Phase card is the oracle.
// DO NOT TOUCH frozen assertions after RED; changes require an independently reviewed TCR.
// Material contract only: these checks do not prove real Talk, review, glossary or handoff execution.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, test, expect } from 'vitest';
const read = path => readFileSync(fileURLToPath(new URL(`../../${path}`, import.meta.url)), 'utf8');
const skill = read('workflows/make-decision/SKILL.md');
const steps = JSON.parse(read('workflows/make-decision/steps.json'));
const section = (text, title) => {
  const found = text.split(/^## /m).find(chunk => chunk.split('\n')[0] === title);
  expect(found, `section ${title}`).toBeDefined();
  return found;
};
const method = section(skill, '方法');
const stepBody = id => {
  const found = method.split(/^(?=\d+\. `)/m).find(chunk => chunk.startsWith(`${id}. \``));
  expect(found, `method step ${id}`).toBeDefined();
  return found;
};
const named = (body, name) => expect(body.split(name).length - 1, `one local ${name}`).toBe(1);
const syncContracts = {
  1: ['load-context', '开局四级选择', '按入口事实推荐一档并说明理由，用户可覆盖', 'decision级别节'],
  3: ['research-and-diverge', '调研决策', '内部、内部加外部、跳过加理由三选一；跳过必须给理由', 'canonical研究原件'],
  5: ['outline-talk', '大纲确认', '只确认骨架，第13步确认最终方向、范围、验收与风险', '用户骨架确认'],
  7: ['direction-advice', '方向审查时点', '大纲确认后、逐模块收敛前回读独立方向建议或真实不可用', 'review原件'],
  9: ['module-convergence', '逐模块台账', '每包一行，五类分析答复只取已答／事实可定／待你定', '每包五行表'],
  10: ['detail-advice', '细节审查前检查', '未收敛即停，记录缺项与owner，收敛后重跑', 'detail包delivery'],
  11: ['grill-with-docs', '领域词表读回', '已解决术语变更就地写入并读回，或给有来源的不变理由', 'decision/GLOSSARY/ADR原ref'],
  13: ['approve-decision', '最终确认＝阶段收口', '确认原件由现human-confirm owner保存；下一阶段由用户决定', 'human-confirm原件'],
  15: ['closeout', '最终确认＝阶段收口', '生成并独立读回handoff，交付handoff 绝对路径；不催下一阶段', 'immutable handoff与读回'],
};

const syncEvidence = {
  "1": [
    {
      "kind": "decision_log_section",
      "uri_or_path": "decision-log.md#级别与路线"
    },
    {
      "kind": "phase_task_facts",
      "uri_or_path": "facts.jsonl"
    }
  ],
  "3": [
    {
      "kind": "research_report",
      "uri_or_path": "quality/evidence/research/"
    },
    {
      "kind": "phase_task_facts",
      "uri_or_path": "facts.jsonl"
    }
  ],
  "5": [
    {
      "kind": "talk_original",
      "uri_or_path": "quality/evidence/decision-log-refs/talk/"
    },
    {
      "kind": "phase_task_facts",
      "uri_or_path": "facts.jsonl"
    }
  ],
  "7": [
    {
      "kind": "review",
      "uri_or_path": "quality/reviews/"
    },
    {
      "kind": "phase_task_facts",
      "uri_or_path": "facts.jsonl"
    }
  ],
  "9": [
    {
      "kind": "quality_evidence",
      "uri_or_path": "quality/evidence/decision-log-refs/convergence-checklist.md"
    },
    {
      "kind": "phase_task_facts",
      "uri_or_path": "facts.jsonl"
    }
  ],
  "10": [
    {
      "kind": "review",
      "uri_or_path": "quality/reviews/"
    },
    {
      "kind": "phase_task_facts",
      "uri_or_path": "facts.jsonl"
    }
  ],
  "11": [
    {
      "kind": "phase_task_facts",
      "uri_or_path": "facts.jsonl"
    }
  ],
  "13": [
    {
      "kind": "human_confirmation",
      "uri_or_path": "quality/evidence/human-confirmations/"
    },
    {
      "kind": "phase_task_facts",
      "uri_or_path": "facts.jsonl"
    }
  ],
  "15": [
    {
      "kind": "handoff",
      "uri_or_path": "quality/evidence/handoff/"
    },
    {
      "kind": "cost_ledger",
      "uri_or_path": "main-agent-cost.md"
    },
    {
      "kind": "phase_task_facts",
      "uri_or_path": "facts.jsonl"
    }
  ]
};
// TCR: quality/evidence/build-code/2026-10-29-019-p6-tcr-evidence-identity.md
// Independently advised by 020-p6-independent-contract-reader-advice.md and 021-p6-tcr-independent-advice.md.
const checkSynced = (id, row) => {
  const [slug, name, action, original] = syncContracts[id];
  expect(Object.keys(row).sort(), `step ${id} four keys`).toEqual(['completion_evidence', 'observable_result', 'step_id', 'step_slug']);
  expect(row.step_id).toBe(id);
  expect(row.step_slug).toBe(slug);
  expect(row.observable_result, `step ${id} fixed name`).toContain(name);
  expect(row.observable_result, `step ${id} action`).toContain(action);
  const mapping = /判定消费[：:]\s*([^；;\n]+)[；;]\s*原件[：:]\s*(\S[^\n]*)/.exec(row.observable_result);
  expect(mapping, `step ${id} evidence mapping`).not.toBeNull();
  expect(mapping[1].trim()).toBe(`SKILL.md#方法 第${id}步`);
  expect(mapping[2], `step ${id} original description`).toContain(original);
  expect(row.completion_evidence, `step ${id} evidence identity`).toEqual(syncEvidence[id]);
};
const synced = (id, name) => {
  expect(syncContracts[id][1]).toBe(name);
  checkSynced(id, steps.steps.find(step => step.step_id === id));
};
const checkManifest = manifest => {
  expect(manifest.stage_slug).toBe('make-decision');
  expect(manifest.steps.map(row => [row.step_id, row.step_slug])).toEqual([
    [1, 'load-context'], [2, 'outline-hypothesis-talk'], [3, 'research-and-diverge'],
    [4, 'outline-revision-check'], [5, 'outline-talk'], [6, 'adversarial-direction-check'],
    [7, 'direction-advice'], [8, 'module-breadth-confirm'], [9, 'module-convergence'],
    [10, 'detail-advice'], [11, 'grill-with-docs'], [12, 'write-decision-draft'],
    [13, 'approve-decision'], [14, 'stage-end-spec-analyze'], [15, 'closeout'],
  ]);
  for (const row of manifest.steps) {
    expect(Object.keys(row).sort()).toEqual(['completion_evidence', 'observable_result', 'step_id', 'step_slug']);
    if (syncContracts[row.step_id]) checkSynced(row.step_id, row);
  }
};

describe('TCR evidence compatibility counterexamples', () => {
  test('legal manifest satisfies the same independent contract', () => checkManifest(steps));
  for (const [label, mutate] of [
    ['deleted name', (row, id) => { row.observable_result = row.observable_result.replaceAll(syncContracts[id][1], ''); }],
    ['missing action', (row, id) => { row.observable_result = row.observable_result.replace(syncContracts[id][2], ''); }],
    ['missing original marker', row => { row.observable_result = row.observable_result.replace('原件：', '来源：'); }],
    ['empty original description', row => { row.observable_result = row.observable_result.replace(/原件：[^\n]*/, '原件：'); }],
    ['wrong evidence kind', row => { row.completion_evidence[0].kind = row.completion_evidence[0].kind === 'review' ? 'phase_task_facts' : 'review'; }],
    ['wrong evidence path', row => { row.completion_evidence[0].uri_or_path = 'other.jsonl'; }],
    ['additional evidence', row => { row.completion_evidence.push({ kind: 'review', uri_or_path: 'quality/reviews/' }); }],
    ['additional step key', row => { row.gate = true; }],
  ]) test(`${label} is rejected for every synchronized step, legal input restores`, () => {
    for (const key of Object.keys(syncContracts)) {
      const id = Number(key), legal = steps.steps[id - 1], changed = structuredClone(legal);
      mutate(changed, id);
      expect(changed).not.toEqual(legal);
      expect(() => checkSynced(id, changed), `${label}: ${id}`).toThrow();
      checkSynced(id, legal);
    }
  });
  test('a name moved to another step cannot satisfy the original location', () => {
    const changed = structuredClone(steps);
    changed.steps[1].observable_result += ' 开局四级选择';
    changed.steps[0].observable_result = changed.steps[0].observable_result.replace('开局四级选择', '');
    expect(() => checkManifest(changed)).toThrow();
    checkManifest(steps);
    for (const id of [3, 5, 7, 9, 10, 11]) {
      const name = syncContracts[id][1], body = stepBody(id);
      expect(() => named(body.replace(name, ''), name)).toThrow();
      named(body, name);
    }
  });
  for (const [label, mutate] of [
    ['deleted step', value => { value.steps.splice(1, 1); }],
    ['added step', value => { value.steps.push({ ...value.steps[0], step_id: 16 }); }],
    ['changed slug', value => { value.steps[1].step_slug = 'extra-stage'; }],
    ['changed stage', value => { value.stage_slug = 'build-code'; }],
  ]) test(`${label} cannot pass the formal manifest check`, () => {
    const changed = structuredClone(steps); mutate(changed);
    expect(() => checkManifest(changed)).toThrow();
    checkManifest(steps);
  });
});

describe('ORACLE-P6-MAKE-DECISION-FLOW structure', () => {
  test('retains fifteen original step identities', () => {
    expect(steps.steps.map(({ step_id, step_slug }) => [step_id, step_slug])).toEqual([
      [1, 'load-context'], [2, 'outline-hypothesis-talk'], [3, 'research-and-diverge'],
      [4, 'outline-revision-check'], [5, 'outline-talk'], [6, 'adversarial-direction-check'],
      [7, 'direction-advice'], [8, 'module-breadth-confirm'], [9, 'module-convergence'],
      [10, 'detail-advice'], [11, 'grill-with-docs'], [12, 'write-decision-draft'],
      [13, 'approve-decision'], [14, 'stage-end-spec-analyze'], [15, 'closeout'],
    ]);
    expect([...method.matchAll(/^\d+\. `/gm)]).toHaveLength(15);
  });
  test('retains make-decision stage and existing route table', () => {
    expect(steps.stage_slug).toBe('make-decision');
    expect(section(skill, '入口路由')).toContain('| 用户选择 | 流程正文 | 步骤表 |\n| --- | --- | --- |\n| 复杂 | 本文件「方法」 | workflows/make-decision/steps.json |\n| 小改动 | workflows/make-decision/flows/small/SKILL.md | workflows/make-decision/flows/small/steps.json |\n| 普通 | workflows/make-decision/flows/normal/SKILL.md | workflows/make-decision/flows/normal/steps.json |\n| 规划 | workflows/make-decision/flows/planning/SKILL.md | workflows/make-decision/flows/planning/steps.json |');
    expect([...section(skill, '入口路由').matchAll(/^\d+\. /gm)].map(match => match[0])).toEqual(['1. ', '2. ', '3. ', '4. ', '5. ', '6. ', '7. ']);
  });
});

describe('closeout', () => {
  test('领域词表读回 records sourced change or no-change in step eleven', () => {
    const body = stepBody(11);
    named(body, '领域词表读回');
    expect(body).toMatch(/领域词表读回[^\n]*就地写入并读回[^\n]*有来源的不变理由/);
    synced(11, '领域词表读回');
  });
  test('最终确认＝阶段收口 preserves confirmation, glossary and absolute handoff', () => {
    const approval = stepBody(13), close = stepBody(15);
    expect(approval).toContain('最终确认＝阶段收口');
    expect(approval).toContain('确认原件');
    expect(approval).toContain('下一阶段由用户决定');
    expect(close).toContain('最终确认＝阶段收口');
    expect(close).toContain('领域词表读回');
    expect(close).toContain('handoff 绝对路径');
    expect(close).toContain('不催下一阶段');
    synced(13, '最终确认＝阶段收口');
    synced(15, '最终确认＝阶段收口');
  });
  test('template and current route have one sourced closeout interpretation', () => {
    const template = read('skills/decision-log/templates/decision-log-template.md');
    const acceptance = section(template, '验收面');
    expect(acceptance).toContain('最终确认＝阶段收口');
    for (const name of ['确认原件', 'GLOSSARY 读回', 'handoff 绝对路径']) {
      expect(acceptance).toContain(`- **${name}**：`);
    }
    expect(acceptance).not.toMatch(/待填|TODO/);
    expect(section(template, '外置事实索引')).toMatch(/确认原件[^\n]*quality\/evidence\/human-confirmations\/[^\n]*owner/);
    const route = section(read('docs/standard-workflow.md'), '当前路线');
    named(route, '最终确认＝阶段收口');
    expect(route).toMatch(/最终确认＝阶段收口[^\n]*下一阶段由用户决定[^\n]*不催下一阶段/);
  });
});

describe('closeout runlist', () => {
  test('可核运行清单 has exactly the fifteen step identifiers and verbatim criteria', () => {
    const close = section(skill, '安全写入与收口');
    named(close, '可核运行清单');
    const rows = [...close.matchAll(/^\| `([a-z][a-z-]+)` \| (.+) \|$/gm)]
      .map(([, step_slug, criterion]) => ({ step_slug, criterion }));
    expect(rows).toHaveLength(15);
    expect(rows.map(row => row.step_slug)).toEqual(steps.steps.map(row => row.step_slug));
    expect(new Set(rows.map(row => row.step_slug)).size).toBe(15);
    for (const [i, row] of rows.entries()) expect(row.criterion).toBe(steps.steps[i].observable_result);
  });
});

describe('ledger', () => {
  test('逐模块台账 keeps one row per package, states and the five-part order', () => {
    const body = stepBody(9);
    named(body, '逐模块台账');
    expect(body).toContain('每包一行');
    expect(body).toContain('已答／事实可定／待你定');
    expect(body).toContain('调研／发散／收敛／就地讨论／定验收');
    expect(body).toContain('8项证据指针');
    expect(body).toContain('写完立即发布并读回');
    synced(9, '逐模块台账');
  });
  test('细节审查前检查 stops unconverged packages and names the recovery', () => {
    const body = stepBody(10);
    named(body, '细节审查前检查');
    expect(body).toMatch(/细节审查前检查[^\n]*先跑步骤检查器[^\n]*未收敛即停[^\n]*收敛后重跑/);
    synced(10, '细节审查前检查');
    expect(steps.steps[9].observable_result).toContain('未收敛即停');
    expect(steps.steps[9].observable_result).toContain('收敛后重跑');
  });
  test('retains one literal checker command and report-only exit semantics', () => {
    const command = 'node tools/cli/check-stage-steps.mjs --stage=make-decision --task-path=<任务目录>';
    expect(skill.split(command)).toHaveLength(2);
    expect(section(skill, '安全写入与收口')).toContain('检查器只报告、退出 0，不证明完成');
  });
});

describe('entry', () => {
  test('开局四级选择 precedes the route table with recommendation and override', () => {
    const entry = section(skill, '入口路由');
    named(entry, '开局四级选择');
    expect(entry.indexOf('开局四级选择')).toBeLessThan(entry.indexOf('| 用户选择 |'));
    expect(entry).toMatch(/开局四级选择[^\n]*推荐一档[^\n]*用户可覆盖/);
    synced(1, '开局四级选择');
  });
  test('调研决策 offers three options and requires a skip reason', () => {
    const body = stepBody(3);
    named(body, '调研决策');
    expect(body).toContain('内部、内部加外部、跳过加理由');
    expect(body).toContain('跳过必须给理由');
    expect(body).toContain('当前 decision-log');
    synced(3, '调研决策');
  });
  test('大纲确认 confirms the skeleton separately from final direction', () => {
    const body = stepBody(5);
    named(body, '大纲确认');
    expect(body).toMatch(/大纲确认[^\n]*骨架[^\n]*第13步[^\n]*最终方向/);
    synced(5, '大纲确认');
  });
  test('方向审查时点 follows outline confirmation and precedes module convergence', () => {
    const body = stepBody(7);
    named(body, '方向审查时点');
    expect(body).toMatch(/方向审查时点[^\n]*大纲确认后[^\n]*逐模块收敛前/);
    synced(7, '方向审查时点');
  });
});


// Review-fix TCR043: original Spec039 #1/#2/#3 and Standards040 #1.
const methodStep = (text, id) => section(text, '方法').split(/^(?=\d+\. `)/m)
  .find(chunk => chunk.startsWith(id + '. `'));
const checkResearchTiming = (text, manifest) => {
  const outline = methodStep(text, 2), research = methodStep(text, 3);
  for (const expected of ['产出任何大纲前', '分级真实答复后', '主会话', '向用户提问',
    '内部、内部加外部、跳过加理由', '等待并消费本题真实答复',
    '未答就保留待答，不产出大纲', '级别选择不代调研答复',
    '范围、为什么、跳过会缺什么、谁决定与答复原ref']) {
    expect(outline, 'research timing: ' + expected).toContain(expected);
  }
  expect(research).toContain('回读第2步大纲前取得的本题真实调研答复及原ref');
  expect(research).toContain('没有本题答复就保留待答');
  expect(manifest.steps[1].observable_result).toContain('大纲前真实提问并等待本题调研答复，未答不产大纲');
  expect(manifest.steps[2].observable_result).toContain('回读第2步大纲前真实调研答复及原ref');
};
const checkLedgerMeaning = (text, manifest) => {
  const body = methodStep(text, 9);
  for (const expected of ['五类分析答复只取已答／事实可定／待你定',
    '包状态沿原检查器的已收敛语义', '三值不填入包状态列',
    '8项证据均可回读', '有待你定就保留未收敛']) expect(body).toContain(expected);
  expect(manifest.steps[8].observable_result).toContain('五类分析答复只取已答／事实可定／待你定');
  expect(manifest.steps[8].observable_result).toContain('包状态沿原检查器的已收敛语义');
};
const checkModuleResearch = (text, manifest) => {
  const body = methodStep(text, 9);
  for (const expected of ['复杂包逐一判断是否需要内部或外部调研',
    '本包调研格引用开局真实调研答复原ref', '记录本包内/外部需要判断',
    '与开局选择不同则写差异理由及决定来源', '沿现调研格保存，不另建记录']) {
    expect(body, 'module research: ' + expected).toContain(expected);
  }
  expect(manifest.steps[8].observable_result).toContain('复杂包调研格引用开局答复原ref、本包内/外判断、差异理由及决定来源');
};

describe('review fixes', () => {
  test('research timing: ask and wait before any outline, retain four facts and consume the real answer', () => {
    checkResearchTiming(skill, steps);
  });
  test('research timing counterexamples use the formal check and restore the legal source', () => {
    for (const [needle, replacement] of [
      ['产出任何大纲前', '产出大纲后'], ['等待并消费本题真实答复', '直接采用推荐'],
      ['未答就保留待答，不产出大纲', '未答继续产出大纲'],
      ['级别选择不代调研答复', '级别选择代调研答复'],
      ['范围、为什么、跳过会缺什么、谁决定与答复原ref', '范围与推荐'],
      ['回读第2步大纲前取得的本题真实调研答复及原ref', '回读级别答复'],
    ]) {
      const changed = skill.replace(needle, replacement);
      expect(changed).not.toBe(skill);
      expect(() => checkResearchTiming(changed, steps)).toThrow();
      checkResearchTiming(skill, steps);
    }
  });
  test('analysis reply values and original package convergence state retain distinct meanings', () => {
    checkLedgerMeaning(skill, steps);
  });
  test('ledger meaning counterexamples use the same formal check', () => {
    for (const needle of ['五类分析答复只取已答／事实可定／待你定', '包状态沿原检查器的已收敛语义',
      '三值不填入包状态列', '8项证据均可回读', '有待你定就保留未收敛']) {
      const changed = skill.replace(needle, '未提供');
      expect(changed).not.toBe(skill);
      expect(() => checkLedgerMeaning(changed, steps)).toThrow();
      checkLedgerMeaning(skill, steps);
    }
  });
  test('complex module research consumes the opening answer and accounts for any difference', () => {
    checkModuleResearch(skill, steps);
  });
  test('module research missing alignment facts fail the formal check independently', () => {
    for (const needle of ['复杂包逐一判断是否需要内部或外部调研', '本包调研格引用开局真实调研答复原ref',
      '记录本包内/外部需要判断', '与开局选择不同则写差异理由及决定来源', '沿现调研格保存，不另建记录']) {
      const changed = skill.replace(needle, '未提供');
      expect(changed).not.toBe(skill);
      expect(() => checkModuleResearch(changed, steps)).toThrow();
      checkModuleResearch(skill, steps);
    }
  });
  test('real convergence consumer accepts completed packages, rejects analysis values in package state, then restores', async () => {
    const { mkdtempSync, realpathSync, mkdirSync, writeFileSync, rmSync } = await import('node:fs');
    const { tmpdir } = await import('node:os');
    const { join, dirname } = await import('node:path');
    const { runStageStepsCheck } = await import('../../tools/cli/check-stage-steps.mjs');
    const root = realpathSync(mkdtempSync(join(tmpdir(), 'p6-convergence-')));
    const taskPath = join(root, 'task'), materialRoot = join(root, 'materials');
    const put = (base, path, value) => {
      const target = join(base, path); mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, typeof value === 'string' ? value : JSON.stringify(value));
    };
    try {
      put(taskPath, 'task.json', { schema_version: '1.0.0', task_id: 'p6-controlled', baseline_commit: 'HEAD',
        target_repo_root: root, activation_cohort: 'post' });
      put(taskPath, 'facts.jsonl', '');
      put(materialRoot, 'phases/index.md', '# Controlled pointer index\n');
      put(materialRoot, 'decision-log.md', [
        '# Controlled decision', '## 级别与路线', '- 推荐级别：复杂', '## 工作包与决定',
        '#### WP1 — controlled', '- **结果与消费者**：受控结果；消费者是 controlled consumer。',
        '#### D-001 — controlled decision', '- **做什么**：读取受控原件。',
        '- **不做什么**：不改运行时。', '- **风险**：来源缺失。',
        '| AC-01 | 受控结果 | 目标可读 |', '| OI-001 | 当前无未决 | owner：受控维护者 |',
        '清单：`quality/evidence/p6-convergence-checklist.md`',
        '细化：`quality/evidence/p6-module-details.md`',
      ].join('\n'));
      put(taskPath, 'quality/evidence/p6-module-details.md', '# Controlled details\n## 1 模块方案\n读取原件与报告。\n');
      const row = '| 1 controlled | D-001 做什么 | D-001 不做什么 | D-001＋details§1 | AC-01 | D-001 风险 | 无 | controlled consumer | OI-001 | 已收敛 |\n';
      const ref = 'quality/evidence/p6-convergence-checklist.md';
      const invoke = () => runStageStepsCheck({ taskPath, materialRoot,
        repoRoot: fileURLToPath(new URL('../../', import.meta.url)), stage: 'make-decision' });
      put(taskPath, ref, row);
      const legal = invoke();
      expect(legal.modules[0].fields.every(field => field.present)).toBe(true);
      expect(legal.convergence).toMatchObject({ complete: true, gaps: [] });
      for (const state of ['已答', '事实可定', '待你定', '待收敛']) {
        put(taskPath, ref, row.replace('已收敛', state));
        expect(invoke().convergence).toMatchObject({ complete: false, gaps: ['1 controlled'] });
      }
      put(taskPath, ref, row);
      expect(invoke().convergence).toMatchObject({ complete: true, gaps: [] });
      put(taskPath, ref, row.replace('D-001 不做什么', ''));
      expect(invoke().convergence).toMatchObject({ complete: false, gaps: ['1 controlled'] });
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});

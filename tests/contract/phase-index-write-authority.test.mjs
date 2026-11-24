// ORACLE-PLAN-ORACLES — P5 冻结契约测试（独立测试作者，改实现前预写）。
// 观察对象：同仓索引列是否为写集唯一来源、只报告对账、可辨坏例、期限/双装配缺口。
// 只从生产入口 validatePostPhaseContract / runFinalChainCheck / 公开词表与真实文档字节观察；
// 不 import 私有辅助函数冒充外部入口，不为变绿放宽断言。
import { after, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validatePostPhaseContract } from '../../runtime/stage/stage-content-contracts.mjs';
import { runFinalChainCheck } from '../../runtime/task/final-chain-runner.mjs';
import { RUNTIME_BEHAVIORS } from '../../runtime/interface/runtime-facade.mjs';
import {
  FORMAL_DEVELOPMENT_STAGES,
  WORKFLOW_STAGES,
} from '../../runtime/stage/stage-registry.mjs';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const P5_CARD = 'specs/delivery-quality-plan-20261123/phases/P5-判据期限与索引.md';
const P5_SPEC = 'specs/delivery-quality-plan-20261123/spec.md';
const INDEX_TEMPLATE = 'skills/spec-plan/templates/index-template.md';
const PHASE_TEMPLATE = 'skills/spec-plan/templates/phase-template.md';
const SPEC_PLAN_SKILL = 'skills/spec-plan/SKILL.md';
const PHASE_FILE = 'phases/P1-受控结果.md';
const P1_PATHS = ['src/alpha.mjs', 'src/beta.mjs', 'tests/alpha.test.mjs'];
const DECOY_PATH = 'src/decoy.mjs';

const scratchRoots = [];
after(() => {
  while (scratchRoots.length) rmSync(scratchRoots.pop(), { recursive: true, force: true });
});

const read = (relative) => readFileSync(join(ROOT, relative), 'utf8');
const sha256 = (value) => createHash('sha256').update(value, 'utf8').digest('hex');
const sortedBytes = (paths) => [...paths].sort((left, right) => Buffer.compare(Buffer.from(left), Buffer.from(right)));
// 卡 185 行：有效相对路径按 UTF-8 字节序逐行（LF，不补尾换行）取 SHA256；合法 none 取字符串 none。
const writeSetDigest = (paths) => sha256(sortedBytes(paths).join('\n'));
const pointerField = (digest) => `\`phases/index.md#execution-index\`；\`sha256=${digest}\``;
const sameSet = (left, right) => assert.deepEqual(sortedBytes(left), sortedBytes(right));

function assertRule(document, file, rule, patterns) {
  const hit = patterns.find(({ re }) => re.test(document));
  assert.ok(hit, `${file}：缺少「${rule}」。应出现以下之一：${patterns.map(({ label }) => label).join(' / ')}`);
}

const SPEC_HEAD = `# Specification

- **FR-001**：读者能看见受控结果。
- **FR-002**：错误保持可见。

## 验收标准

- [ ] **AC-001 — 受控结果可读**
  - **需求**：FR-001
  - **通过条件**：正确输入返回结果。
  - **失败条件**：结果被隐藏。
- [ ] **AC-002 — 错误可定位**
  - **需求**：FR-002
  - **通过条件**：坏输入报告错误位置。
  - **失败条件**：错误被吞掉。

## 实现设计（全局权威）

### Code Anchors

\`src/alpha.mjs\` owns the visible result; \`src/beta.mjs\` owns error reporting.

### Interfaces and Failure Semantics

renderResult returns visible output; reportError preserves the first failing action.

### Requirement-to-Task Trace

| source | FR | AC | Phase/Task | oracle | evidence |
| --- | --- | --- | --- | --- | --- |
| R-001 | FR-001 | AC-001 | P1/T001 | ORACLE-P1 | \`quality/tests/p1.json\` |
| R-002 | FR-002 | AC-002 | P2/T002 | ORACLE-P2 | \`quality/tests/p2.json\` |

### Global Verification Strategy

\`node --test tests/alpha.test.mjs\`
`;

// 单 Phase 样本：只保留 FR-001/AC-001，避免与未出场的 P2 交叉覆盖。
const SPEC = SPEC_HEAD
  .replaceAll('\n| R-002 | FR-002 | AC-002 | P2/T002 | ORACLE-P2 | \`quality/tests/p2.json\` |', '')
  .replace('- **FR-002**：错误保持可见。\n', '')
  .replace(/\n- \[ \] \*\*AC-002 — 错误可定位\*\*\n  - \*\*需求\*\*：FR-002\n  - \*\*通过条件\*\*：坏输入报告错误位置。\n  - \*\*失败条件\*\*：错误被吞掉。/, '');

function taskCard({ id, paths, frs, acs, sources, oracle, readOnly = false }) {
  const files = readOnly
    ? `只读 \`docs/note.md\`；symbol: N/A — 只读核对；无生产修改。`
    : `${paths.map((path) => `\`${path}\``).join('；')} symbol: renderResult。`;
  return `### ${id} — deliver ${readOnly ? 'the read-only note' : paths[0]}

本卡交付受控结果，并在隐藏输出时保留可重放的失败。

- **Source / FR / AC**：${sources.map((source, index) => `${source} / ${frs[index]} / ${acs[index]}`).join('；')}。
- **Files / symbols**：${files}
- **Action**：${readOnly ? '只读核对现有说明并保留失败；无生产修改。' : '实现可见结果并保留负例。'}
- **Inputs**：一个合法输入和一个坏输入；只读参考 \`${DECOY_PATH}\`。
- **Outputs / failure**：成功返回可见结果；坏输入显式失败。
- **Dependency**：none
- **Boundary / DO NOT TOUCH**：只改本卡写集，不碰相邻模块。
- **Test tier / skill**：feature / backend-testing。
- **Scenario / fixture or service**：合法结果与负例；本地夹具用后清理。
- **RED/GREEN gate_cmd**：\`node --test tests/${id.toLowerCase()}.test.mjs\`。
- **expected_exit**：RED target assertion nonzero; GREEN 0。
- **RED target failure**：${oracle}；隐藏输出时 ${acs[0]} 断言失败。
- **GREEN oracle**：${oracle}；${acs[0]} 通过且失败仍可见。
- **Evidence**：\`quality/tests/${id.toLowerCase()}.json\` 记命令、退出和断言。
- **STOP / recovery**：源契约变化即停；修订 spec 与本卡。
- **Coverage limit**：只证本段目标，不证历史迁移。
- **Done**：正负例、证据和读回齐。
`;
}

function phaseCard({ id = 'P1', writeSetLine, paths, frs, acs, sources, oracle, dependency = 'none', readOnly = false }) {
  const card = taskCard({ id: `T00${id.slice(1)}`, paths, frs, acs, sources, oracle, readOnly });
  const gate = `node --test tests/${id.toLowerCase()}.test.mjs`;
  return `# Phase ${id} — 受控结果

- **Global spec**：\`spec.md\`
- **Write set**：${writeSetLine}
- **Dependency**：\`${dependency}\`
- **Consumer**：build-code

## L0 — Outcome

实现 ${frs[0]}，以 ${acs[0]} 判断结果。

## L1 — Contract

- **FR / AC**：${frs.join(' / ')} / ${acs.join(' / ')}
- **Tasks**：\`T00${id.slice(1)} RED\` → \`T00${id.slice(1)} GREEN\`
- **gate_cmd**：\`${gate}\`
- **expected_exit**：RED nonzero; GREEN 0。
- **oracle**：${oracle}
- **evidence_path**：\`quality/tests/${id.toLowerCase()}.json\`
- **STOP**：输入合同变化则返回 spec owner。
- **Done**：正例和负例可回放。

${card}

## L2 — Removable reference

实现参考可删除；删除后 L0/L1 不变。旧形态的局部说明只供对照，不构成写集来源。
`;
}

const indexRow = ({ id = 'P1', cell, dependency = 'none' }) =>
  `| \`${id}\` | \`phases/${id}-受控结果.md\` | \`phase-${id}\` | ${cell} | \`${dependency}\` | build-code |`;

const indexPath = (rows) => `# Phase index

## Execution Index

| phase | authority ref | semantic anchor | write set | dependency | consumer |
| --- | --- | --- | --- | --- | --- |
${rows.join('\n')}
`;

function authoredMaterial({ spec = SPEC, writeSetLine, indexCell, extraPhases = {}, extraRows = [], changeScope } = {}) {
  const phases = {
    [PHASE_FILE]: phaseCard({
      writeSetLine: writeSetLine ?? pointerField(writeSetDigest(P1_PATHS)),
      paths: P1_PATHS,
      frs: ['FR-001'],
      acs: ['AC-001'],
      sources: ['R-001'],
      oracle: 'ORACLE-P1',
    }),
    ...extraPhases,
  };
  const index = indexPath([indexRow({ cell: indexCell ?? P1_PATHS.map((path) => `\`${path}\``).join(' ' ) }), ...extraRows]);
  return { spec, index, phases, changeScope };
}

const validate = (material) => validatePostPhaseContract({ ...material, phase_id: material.phase_id ?? 'P1' });
const errorsText = (result) => (result.errors ?? []).join('\n');

function namedDigestError(result, subject) {
  const text = errorsText(result);
  assert.match(text, /sha256|摘要|digest|哈希/i,
    `${subject}：错摘要/错引用必须以摘要名点出具体对象，当前错误只有：${text || '（无错误）'}`);
  assert.match(text, /phases\/index\.md:\d+|phases\/P1-受控结果\.md/,
    `${subject}：摘要失败必须点名索引行或 Phase 文件，当前错误只有：${text || '（无错误）'}`);
}

describe('ORACLE-PLAN-ORACLES 同仓索引单源与可再生', () => {
  it('索引模板把 Execution Index 写入集列写成新同仓路径的唯一作者输入，并禁止从 Task 局部目录反推', () => {
    const template = read(INDEX_TEMPLATE);
    assertRule(template, INDEX_TEMPLATE, '写入集列是新同仓路径的唯一作者输入', [
      { label: '写入集…唯一…作者输入', re: /(?:写入集|write\s*set)[^\n。]{0,80}(?:唯一|唯一作者|sole|only)[^\n。]{0,60}(?:作者|author|输入|input|来源|source)/i },
      { label: '唯一…作者输入…写入集', re: /(?:唯一|sole|only)[^\n。]{0,60}(?:作者|author|输入|input|来源|source)[^\n。]{0,80}(?:写入集|write\s*set)/i },
      { label: '写入集只从本表/现列取', re: /(?:写入集|write\s*set)[^\n。]{0,40}(?:只|仅)[^\n。]{0,40}(?:从|由|from)[^\n。]{0,40}(?:本(?:表|列)|索引|现列|this column)/i },
    ]);
    assertRule(template, INDEX_TEMPLATE, '写集列不抄命令或证据', [
      { label: '不抄命令或证据', re: /(?:不抄|不复制|不搬运|not copy|no copy)[^\n。]{0,60}(?:命令|command|证据|evidence)/i },
    ]);
  });

  it('计划技能的重建入口保留已有权威路径列，且不得从卡头或局部 Task 列表反推整集', () => {
    const skill = read(SPEC_PLAN_SKILL);
    assertRule(skill, SPEC_PLAN_SKILL, '重生成保留已有权威路径列，不覆盖写集列', [
      { label: '重生成…保留…路径列', re: /(?:重生成|重新生成|再生成|重建|re-?generat|rebuild)[^\n]{0,240}(?:保留|preserve|不得覆盖|不覆盖|not overwrite)[^\n]{0,120}(?:路径列|写入集|write\s*set)/i },
      { label: '保留已有…路径列', re: /(?:保留|preserve)[^\n]{0,120}(?:已有|现有|原有|existing)[^\n]{0,80}(?:路径列|写入集列|write\s*set)/i },
      { label: '不得覆盖写集列', re: /(?:不得|不|never|must not)[^\n]{0,80}(?:覆盖|overwrite)[^\n]{0,80}(?:路径列|写入集|write\s*set)/i },
    ]);
    const template = read(INDEX_TEMPLATE);
    assert.ok(
      [skill, template].some((document) => /(?:不得|不可|禁止|不要|never|must not|do not)[^\n]{0,120}(?:Task|任务|卡头|契约头|header)[^\n]{0,80}(?:反推|推导|推断|derive|infer)/i.test(document)
        || /(?:Task|任务)[^\n]{0,80}(?:反推|推导|derive|infer)[^\n]{0,60}(?:整集|完整|全集|write\s*set|写入集)/i.test(document)),
      `${SPEC_PLAN_SKILL} / ${INDEX_TEMPLATE}：缺少「不得从卡头或局部 Task 列表反推整集」的规则；实现必须在重建入口写明这一禁止。`,
    );
    assert.ok(/^##\s+.*(?:索引|Index)/m.test(skill),
      `${SPEC_PLAN_SKILL}：缺少具名索引重建入口小节（应有一个可读的索引/Index 方法小节）。`);
    assert.ok(/(?:重生成|重新生成|再生成|重建|渲染|re-?generat|rebuild)/i.test(skill),
      `${SPEC_PLAN_SKILL}：索引重建入口必须写明可再生的生成动作（重生成/重建/渲染）。`);
  });

  it('Phase 模板给出新同仓卡的索引指针与同源摘要写法', () => {
    const template = read(PHASE_TEMPLATE);
    assert.ok(template.includes('phases/index.md#execution-index'),
      `${PHASE_TEMPLATE}：新同仓卡必须用 \`phases/index.md#execution-index\` 指向索引行，当前未给出。`);
    assert.ok(/sha256=/.test(template),
      `${PHASE_TEMPLATE}：新同仓卡必须带同源 sha256 摘要（\`sha256=<64 位小写十六进制>\`），当前未给出。`);
  });
});

describe('ORACLE-PLAN-ORACLES 执行写集只出自现索引列', () => {
  it('指针卡解析为索引行路径本身，指针与摘要不进入写集，正文提及的索引外路径也不进入', () => {
    const result = validate(authoredMaterial());
    assert.equal(result.ok, true, `合法新同仓指针卡应通过；当前错误：\n${errorsText(result)}`);
    const resolved = result.facts.phase_rows.find((row) => row.id === 'P1');
    assert.ok(resolved, '缺少 P1 的解析结果');
    sameSet(resolved.write_set, P1_PATHS);
    for (const value of resolved.write_set) {
      assert.ok(!/index\.md|sha256|#execution-index/i.test(value),
        `写集把 Phase 指针或摘要当成路径清单：${value}（P1 索引行）`);
      assert.notEqual(value, DECOY_PATH,
        `写集把索引外路径 ${DECOY_PATH} 反推进来；写集只能来自索引行写入集列。`);
    }
  });

  it('旧字面写集卡保持只读兼容，仍解析为同一索引集合', () => {
    const result = validate(authoredMaterial({
      writeSetLine: P1_PATHS.map((path) => `\`${path}\``).join('；'),
    }));
    assert.equal(result.ok, true, `旧卡合法形态不应被新格式改坏；当前错误：\n${errorsText(result)}`);
    sameSet(result.facts.phase_rows.find((row) => row.id === 'P1').write_set, P1_PATHS);
  });

  it('合法 none 只读段仍被接受且可与破损空集区分', () => {
    const readOnlyPhase = phaseCard({
      writeSetLine: pointerField(sha256('none')),
      paths: ['docs/note.md'],
      frs: ['FR-001'],
      acs: ['AC-001'],
      sources: ['R-001'],
      oracle: 'ORACLE-P1',
      readOnly: true,
    });
    const accepted = validate({
      spec: SPEC,
      index: indexPath([indexRow({ cell: 'none' })]),
      phases: { [PHASE_FILE]: readOnlyPhase },
      changeScope: { status: 'recorded', changed_paths: ['docs/note.md'] },
    });
    assert.deepEqual(accepted.facts.phase_rows.find((row) => row.id === 'P1').write_set, [],
      `合法 none 必须解析为可区分的只读空集；当前错误：\n${errorsText(accepted)}`);
    assert.ok(!/Write set is missing|none declaration is invalid/i.test(errorsText(accepted)),
      `合法 none 不得被当成缺失/坏词；当前错误：\n${errorsText(accepted)}`);
    assert.equal(accepted.facts.write_set_reconciliation.status, 'recorded',
      `合法 none 的对账应可记录（只读段），当前：${JSON.stringify(accepted.facts.write_set_reconciliation)}`);
    assert.deepEqual(accepted.facts.write_set_reconciliation.out_of_scope, ['docs/note.md']);

    const broken = validate({
      spec: SPEC,
      index: indexPath([indexRow({ cell: 'none' })]),
      phases: { [PHASE_FILE]: phaseCard({
        writeSetLine: pointerField(writeSetDigest(P1_PATHS)),
        paths: P1_PATHS,
        frs: ['FR-001'],
        acs: ['AC-001'],
        sources: ['R-001'],
        oracle: 'ORACLE-P1',
      }) },
      changeScope: { status: 'recorded', changed_paths: [...P1_PATHS] },
    });
    assert.notEqual(broken.facts.write_set_reconciliation.status, 'recorded',
      '被冲掉的写集列不得当成合法空集继续对账；必须具名失败。');
  });
});

describe('ORACLE-PLAN-ORACLES 漏一个已改路径只报告，不改执行许可', () => {
  it('索引声明 3 条、实际改动 4 条时报告那条漏项，其余匹配不变且合同仍有效', () => {
    const changed = [...P1_PATHS, 'src/unlisted.mjs'];
    const result = validate(authoredMaterial({
      changeScope: { status: 'recorded', changed_paths: changed },
    }));
    assert.equal(result.ok, true,
      `漏声明一条实际改动只应报告，不能阻断合法契约；当前错误：\n${errorsText(result)}`);
    const reconciliation = result.facts.write_set_reconciliation;
    assert.equal(reconciliation.status, 'recorded', `对账应可记录，当前：${JSON.stringify(reconciliation)}`);
    assert.deepEqual(reconciliation.out_of_scope, ['src/unlisted.mjs'],
      '漏掉的已改路径必须按 out_of_scope 点名 src/unlisted.mjs');
    sameSet(reconciliation.matched, P1_PATHS);
    assert.deepEqual(reconciliation.listed_not_changed, []);
    sameSet(result.facts.phase_rows.find((row) => row.id === 'P1').write_set, P1_PATHS,
      '报告漏项不得反过来改执行写集：写集仍是索引声明的 3 条');
    assert.ok(!result.errors.some((error) => /unlisted/.test(error)),
      '漏项只能报告，不能升级为错误码或拒绝执行');
  });
});

describe('ORACLE-PLAN-ORACLES 坏例必须逐条辨出', () => {
  it('Phase 指针摘要被当成清单时辨出：错摘要具名失败，正确摘要不进入写集', () => {
    const valid = validate(authoredMaterial());
    const resolved = valid.facts.phase_rows.find((row) => row.id === 'P1');
    assert.ok(resolved.write_set.every((path) => !/index\.md|sha256|#execution-index/i.test(path)),
      `正确摘要不得被当成另一个路径清单：${JSON.stringify(resolved.write_set)}`);

    const stale = validate(authoredMaterial({
      writeSetLine: pointerField(writeSetDigest(P1_PATHS.slice(0, 2))),
    }));
    assert.equal(stale.ok, false, '摘要与索引行不一致必须判失败，不能冻结为通过');
    namedDigestError(stale, '错摘要样本');
    assert.deepEqual(stale.facts.phase_rows.find((row) => row.id === 'P1').write_set, [],
      '错摘要不得留下可用的执行写集');
  });

  it('索引列破损时不回退到旧卡、不当合法空集：具名失败且不出可用写集', () => {
    const p2 = phaseCard({
      id: 'P2',
      writeSetLine: '`src/beta.mjs`',
      paths: ['src/beta.mjs'],
      frs: ['FR-002'],
      acs: ['AC-002'],
      sources: ['R-002'],
      oracle: 'ORACLE-P2',
      dependency: 'P1',
    });
    const result = validate(authoredMaterial({
      spec: SPEC_HEAD,
      indexCell: '`../escape.mjs`',
      extraPhases: { 'phases/P2-受控结果.md': p2 },
      extraRows: [indexRow({ id: 'P2', cell: '`src/beta.mjs`', dependency: 'P1' })],
    }));
    assert.equal(result.ok, false, '破损索引列必须判失败，不能通过');
    assert.match(errorsText(result), /phases\/index\.md:\d+ P1/,
      `破损写入集列必须点名索引行（期望形如 phases/index.md:<行> P1）；当前错误：\n${errorsText(result)}`);
    assert.match(errorsText(result), /\.\.\/escape\.mjs/,
      '破损列必须点名实际坏路径 ../escape.mjs');
    const rows = result.facts.phase_rows;
    assert.equal(rows.some((row) => ['phases/index.md#execution-index', `sha256=${writeSetDigest(P1_PATHS)}`].some((token) => row.write_set.includes(token))), false,
      '不得把 P1 指针/摘要当成回退写集');
    assert.equal(rows.some((row) => row.id === 'P1' && row.write_set.length > 0), false,
      '索引列破损时不得从旧卡或相邻 Phase 借出可用写集');
    assert.equal(rows.some((row) => row.write_set.includes('src/beta.mjs') && row.id === 'P1'), false,
      '不得把 P2 的旧字面写集并进 P1');
    assert.notEqual(result.facts.write_set_reconciliation.status, 'recorded',
      '破损索引不得回落成可对账的合法空集');
  });

  it('重渲染冲掉一条有效路径时辨出，不静默接受缩短后的列', () => {
    const shortened = P1_PATHS.slice(0, 2);
    const result = validate(authoredMaterial({
      indexCell: shortened.map((path) => `\`${path}\``).join(' '),
    }));
    assert.equal(result.ok, false, '重渲染冲掉一条有效路径必须判失败，不能静默接受');
    const resolved = result.facts.phase_rows.find((row) => row.id === 'P1');
    assert.deepEqual(resolved.write_set, [],
      `冲掉路径后不得留下缩短的可执行写集：${JSON.stringify(resolved.write_set)}`);
    namedDigestError(result, '重渲染冲掉路径样本');
  });
});

describe('ORACLE-PLAN-ORACLES 期限与两种合法装配仍是缺条件', () => {
  it('两项分别记缺条件与恢复项，不写成通过，且互不掩盖', () => {
    const card = read(P5_CARD);
    const deadline = card.match(/期限子条件[：:]([^\n]+)/)?.[1] ?? '';
    const dual = card.match(/双装配子条件[：:]([^\n]+)/)?.[1] ?? '';
    assert.ok(deadline, `${P5_CARD}：缺少具名的「期限子条件」。`);
    assert.ok(dual, `${P5_CARD}：缺少具名的「双装配子条件」。`);
    const gap = /未见|未取得|尚无|缺(?:条件|件|少|失)|不可用|unavailable|incomplete|未验证|不证明|不能/;
    assert.match(deadline, gap, '期限子条件必须写成缺条件/未取得，不能写成已通过。');
    assert.match(dual, gap, '双装配子条件必须写成缺条件/未取得，不能写成已通过。');
    assert.match(card, /恢复条件|条件恢复|补齐|补取/,
      `${P5_CARD}：两项缺条件都必须给恢复项。`);
    assert.match(card, /不互等|分别记未验证|分开取证|互不/,
      `${P5_CARD}：期限与双装配必须分别记录，一个缺不得掩盖另一个。`);
    assert.match(card, /不能判业务期限与双装配/,
      `${P5_CARD}：必须写明索引测试命令不能代判业务期限与双装配。`);
    const passClaim = /已通过|验证通过|已取得同条件合法装配/;
    assert.ok(!passClaim.test(deadline) && !passClaim.test(dual),
      `${P5_CARD}：期限子条件与双装配子条件都不得写成已通过；两项须各留缺条件与恢复项。`);
    const spec = read(P5_SPEC);
    assert.match(spec, /^-\s+\[\s\]\s+\*\*AC-QUAL-011\*\*/m,
      `${P5_SPEC}：AC-QUAL-011（业务期限）必须保持未勾选，不能以文档或索引检查代签。`);
    assert.match(spec, /^-\s+\[\s\]\s+\*\*AC-QUAL-013\*\*/m,
      `${P5_SPEC}：AC-QUAL-013（两种合法装配）必须保持未勾选。`);
  });
});

describe('ORACLE-PLAN-ORACLES 公共行为不变', () => {
  it('公共运行时仍是七个词，阶段身份仍是四个，未新增公共命令或阶段', () => {
    assert.deepEqual([...RUNTIME_BEHAVIORS], ['doctor', 'status', 'run', 'review', 'verify', 'confirm', 'authorize'],
      'runtime-facade 公共词表变化即新增/删除公共命令');
    assert.deepEqual([...FORMAL_DEVELOPMENT_STAGES], ['make-decision', 'build-plan', 'build-code'],
      '正式阶段身份变化即新增/删除阶段');
    assert.deepEqual([...WORKFLOW_STAGES], ['make-decision', 'build-plan', 'build-code', 'build-prd'],
      '工作流阶段集合变化即新增/删除阶段');
    for (const behavior of RUNTIME_BEHAVIORS) {
      assert.ok(!/^(?:prepare|start-run|publish-|record-|recover-|rebind-|phase-)/.test(behavior),
        `公共词表出现私有实现词：${behavior}`);
    }
  });
});

describe('ORACLE-PLAN-ORACLES 终链读同一写集', () => {
  it('环 6 写集与阶段解析同一集合，不再把指针当第二份清单报冲突', () => {
    const root = realpathSync(mkdtempSync(join(tmpdir(), 'p5-index-authority-')));
    scratchRoots.push(root);
    const taskId = 'p5-index-authority';
    const taskPath = join(root, 'task');
    const materialRoot = join(root, 'specs', taskId);
    mkdirSync(taskPath, { recursive: true });
    mkdirSync(join(materialRoot, 'phases'), { recursive: true });
    writeFileSync(join(taskPath, 'task.json'), JSON.stringify({
      schema_version: '1.0.0', project_name: 'workflowhub', task_id: taskId,
      target_repo_root: root, workspace_root: root,
    }));
    const material = authoredMaterial();
    writeFileSync(join(materialRoot, 'spec.md'), material.spec);
    writeFileSync(join(materialRoot, 'decision-log.md'), '# 决策\n\n## 任务身份\n\n- **任务类型**：普通任务\n');
    writeFileSync(join(materialRoot, 'phases/index.md'), material.index);
    writeFileSync(join(materialRoot, PHASE_FILE), material.phases[PHASE_FILE]);

    const resolver = validate(material);
    const chain = runFinalChainCheck({ taskPath, materialRoot, workflowRoot: ROOT });
    const ring = chain.rings.find((entry) => entry.ring === 6);
    assert.ok(ring, '终链结果缺少环 6 写集事实');
    sameSet(ring.write_set, P1_PATHS,
      `环 6 必须读索引列的同一集合；当前：${JSON.stringify(ring.write_set)}`);
    assert.equal(ring.write_set_conflict ?? null, null,
      `终链不得再把 Phase 指针当第二份清单报冲突；当前：${ring.write_set_conflict}`);
    assert.ok(!(ring.basis ?? []).some((entry) => entry.write_set_conflict),
      `终链依据里仍保留写集冲突：${JSON.stringify((ring.basis ?? []).map((entry) => entry.write_set_conflict))}`);
    for (const value of ring.write_set) {
      assert.ok(!/index\.md|sha256|#execution-index/i.test(value),
        `环 6 写集把指针/摘要当成路径：${value}`);
    }
    sameSet(ring.write_set, resolver.facts.phase_rows.find((row) => row.id === 'P1').write_set,
      '终链、合同解析与审查读域必须是同一写集（单源）');
  });
});

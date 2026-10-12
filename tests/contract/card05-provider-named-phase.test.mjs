// Frozen build-plan oracle; accepted source 015 scopes existing providerMaterialEntries only.
// Preserve full current Phase members/index, named paths and English/Chinese headers.
import { expect, test } from 'vitest';
import { providerMaterialEntries } from '../../runtime/review/provider-material-projection.mjs';
const first = 'phases/P1-结果接线.md', second = 'phases/P2-review-delivery.md';
const firstBody = '# Phase P1 — 结果接线\n\n## L0\n独立要求：完整正文第一行。\n\n## L1\n### T001 — 真实结果\n完整正文不能截断。\n\n## L2\n末尾标记 FIRST-COMPLETE\n';
const secondBody = '# Phase P2 — review delivery\n\n## L0\nSecond complete contract.\n\n## L1\n### T002 — reviewer-visible outcome\nFull body remains visible.\n\n## L2\nSECOND-COMPLETE\n';
function index({ chinese = false, refs = [['P1', first], ['P2', second]], quoted = true } = {}) {
  const cell = value => quoted ? '`' + value + '`' : value;
  return (chinese ? '## 执行索引\n| 阶段 | 权威引用 | 语义锚点 | 写集 | 依赖 | 消费者 |\n' : '## Execution Index\n| phase | authority ref | semantic anchor | write set | dependency | consumer |\n') + '| --- | --- | --- | --- | --- | --- |\n' + refs.map(([id, path], n) => '| ' + cell(id) + ' | ' + cell(path) + ' | phase-' + id.toLowerCase() + ' | src/' + id.toLowerCase() + '.mjs | ' + (n ? 'P1' : 'none') + ' | build-code |\n').join('');
}
function materials({ chinese = false, refs, quoted, authorities } = {}) {
  return { raw_requirement: 'R-001: preserve current physical authority.', draft_spec: 'AC-001: complete members reach the reviewer.', acceptance_criteria: 'AC-001: current authority is not lost.', phase_authorities: authorities ?? { [first]: chinese ? firstBody.replace('# Phase P1', '# 阶段 P1') : firstBody, [second]: chinese ? secondBody.replace('# Phase P2', '# 阶段 P2') : secondBody }, phase_index: index({ chinese, refs, quoted }) };
}
const project = m => providerMaterialEntries({ stage: 'build-plan', activation_cohort: 'post', materials: m });
test('N17 fourth consumer target: named English index expands complete physical members in index order', () => {
  const m = materials();
  expect(project(m)).toEqual([
    ['raw_requirement', 'R-001: preserve current physical authority.'], ['draft_spec', 'AC-001: complete members reach the reviewer.'], ['acceptance_criteria', 'AC-001: current authority is not lost.'],
    ['phase_authority:' + first, firstBody], ['phase_authority:' + second, secondBody], ['phase_index', m.phase_index],
  ]);
});
test('N17 fourth consumer target: current Chinese index and Phase headers preserve complete named members', () => {
  const m = materials({ chinese: true });
  expect(project(m)).toEqual([
    ['raw_requirement', 'R-001: preserve current physical authority.'], ['draft_spec', 'AC-001: complete members reach the reviewer.'], ['acceptance_criteria', 'AC-001: current authority is not lost.'],
    ['phase_authority:' + first, firstBody.replace('# Phase P1', '# 阶段 P1')], ['phase_authority:' + second, secondBody.replace('# Phase P2', '# 阶段 P2')], ['phase_index', m.phase_index],
  ]);
});
test('N17 fourth consumer baseline: legacy naked P IDs and English index still expand exact full bodies', () => {
  const m = materials({ refs: [['P1', 'phases/P1.md'], ['P2', 'phases/P2.md']], quoted: false, authorities: { 'phases/P1.md': firstBody, 'phases/P2.md': secondBody } });
  expect(project(m)).toEqual([
    ['raw_requirement', 'R-001: preserve current physical authority.'], ['draft_spec', 'AC-001: complete members reach the reviewer.'], ['acceptance_criteria', 'AC-001: current authority is not lost.'],
    ['phase_authority:phases/P1.md', firstBody], ['phase_authority:phases/P2.md', secondBody], ['phase_index', m.phase_index],
  ]);
});
// These must still reject after named support; current failures are baseline controls, not target RED.
test.each([
  ['parent traversal', { refs: [['P1', '../P1.md']], authorities: { '../P1.md': firstBody } }],
  ['cross-root', { refs: [['P1', 'quality/evidence/P1.md']], authorities: { 'quality/evidence/P1.md': firstBody } }],
  ['absolute', { refs: [['P1', '/other-root/P1.md']], authorities: { '/other-root/P1.md': firstBody } }],
  ['duplicate index', { refs: [['P1', 'phases/P1.md'], ['P1', 'phases/P1.md']], authorities: { 'phases/P1.md': firstBody } }],
  ['missing member', { refs: [['P1', 'phases/P1.md'], ['P2', 'phases/P2.md']], authorities: { 'phases/P1.md': firstBody } }],
  ['unindexed member', { refs: [['P1', 'phases/P1.md']], authorities: { 'phases/P1.md': firstBody, 'phases/P2.md': secondBody } }],
  ['nonconsecutive IDs', { refs: [['P1', 'phases/P1.md'], ['P3', 'phases/P3.md']], authorities: { 'phases/P1.md': firstBody, 'phases/P3.md': '# Phase P3\ncomplete\n' } }],
  ['wrong Phase identity', { refs: [['P1', 'phases/P1.md']], authorities: { 'phases/P1.md': '# Phase P2\nwrong owner\n' } }],
])('N17 fourth consumer baseline: rejects %s before member projection', (_kind, options) => {
  expect(() => project(materials(options))).toThrow(/MATERIAL_INCOMPLETE/);
});

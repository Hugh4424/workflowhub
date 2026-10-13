// Frozen planning-only N20 algorithm oracle. Sources: human031, source N16/N20/AC21/23,
// spec 170-180 and 229-231. Pure strings; no AST, external originals, provider or product implementation.
import { expect, test } from 'vitest';
import { checkDecisionLogChain } from '../../tools/cli/check-decision-log-chain.mjs';
const fields = '- **做什么**：把结果交给下游。\n- **不做什么**：不新增推进门。\n- **风险**：来源缺失由原负责人补。\n- **改动**：只改现有声明文件。\n';
function advisory(r) { expect(r.failures).toEqual([]); expect(r.exit_code).toBe(0); }
test('N20 target: real N heading forms exclude fenced blocks and final block cannot borrow child or later section fields', () => {
  const markdown = '# 当前决定\n\n### N1 把结果交给下游\n' + fields + '\n```markdown\n#### N99 — 只是代码示例\n' + fields + '```\n\n#### N2 — 保住当前块边界\n- **做什么**：只读本块父字段。\n  - **风险**：这个缩进子点不是父字段。\n- **不做什么**：不借后续节补字段。\n- **改动**：使用既有函数。\n\n## 各模块前提\n- **风险**：本节不是 N2 的字段。\n';
  const r = checkDecisionLogChain({ markdown });
  expect(r.recognized_blocks, 'ORACLE-N20-N-HEADING-BOUNDARY: ### and #### are current, fenced N99 is not').toBe(2);
  expect(r.warnings.some(w => w.decision_id === 'N2' && w.field === '风险'), 'N2 missing parent risk cannot be filled by indented child or following summary section').toBe(true);
  expect(r.warnings.some(w => w.decision_id === 'N1' && w.field === '风险')).toBe(false); advisory(r);
});
test('N20 target: explicit missing current section is visible but history or another-file N99 is not a current broken reference', () => {
  const markdown = '# 当前决定\n\n### N1 指出当前文缺少的小节\n' + fields + '本当前文引用 ## 不存在小节。\n历史另一文件 `archive/old-decision.md` 中的 N99 是历史来源，不是本当前文的决定引用。\n';
  const r = checkDecisionLogChain({ markdown });
  expect(r.warnings.some(w => w.decision_id === 'N1' && String(w.message).includes('不存在小节')), 'ORACLE-N20-CURRENT-SECTION: explicit current missing section must have a named fact').toBe(true);
  expect(r.warnings.some(w => String(w.message).includes('N99')), 'an explicitly another-file historical number is not in the current reference domain').toBe(false); advisory(r);
});
test('N16/N20 target: current template ADR four-parent shape is lawful and incomplete current shape cannot fall back to historical ADR five', () => {
  // Fixed producer shape from the authored template example, not a transformation of checker output.
  const current = '#### ADR-001 — 让下游直接取得已确认方向\n\n- **做什么**：主文保留下游要用的方向与接口。\n  - 每条原始需求保原义、来源与落点；真实来源未提供时写缺口。\n- **不做什么**：历史过程只引用唯一原件，不复制成第二正文。\n- **风险**：原件缺失时相应依据保持unknown，由来源owner补路径。\n- **改动**：本例仅演示模板形状，实际任务填写精确路径和唯一writer。\n';
  const complete = checkDecisionLogChain({ markdown: current }); expect(complete.recognized_blocks).toBe(1);
  expect(complete.warnings.filter(w => w.code === 'missing_chain_field'), 'ORACLE-N20-TEMPLATE-ADR-FOUR: lawful current producer cannot be checked as historical five labels').toEqual([]);
  expect(complete.recognized_fields).toBe(4); advisory(complete);
  const incomplete = checkDecisionLogChain({ markdown: current.replace('- **风险**：原件缺失时相应依据保持unknown，由来源owner补路径。\n', '') });
  expect(incomplete.warnings.some(w => w.decision_id === 'ADR-001' && w.field === '风险'), 'any current label selects current obligations even when one current field is absent').toBe(true); advisory(incomplete);
  // Existing legacy obligations are separate fixed literals. These controls are reached only after current assertions succeed.
  const old = checkDecisionLogChain({ markdown: '#### ADR-002 — 保留旧决定\n- **决定**：旧决定结果。\n- **为什么**：旧真实依据。\n- **否掉了什么**：旧替代。\n- **后果与风险**：旧特有风险。\n- **影响面**：旧文件。\n' });
  expect(old.recognized_blocks).toBe(1); expect(old.recognized_fields).toBe(5); expect(old.warnings).toEqual([]); advisory(old);
});

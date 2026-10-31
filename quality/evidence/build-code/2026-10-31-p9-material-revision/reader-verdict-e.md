# 独立读者裁决 E

## 1. 三问

**（1）下一步做什么、在哪做、跑什么：能。**
第一步，build-plan 作者在 `<材料根>/phases/P11-去字面断言.md` 的「这一 Phase 怎么验收？」七槽写入验收，并在 `<材料根>/spec.md` Appendix A 加 AC-EFFECT-001 的 P1 行（169-172、270-271）。改完在任务根跑 `node /Users/Hugh/Hugh/Project/workflowhub/tools/cli/run-checks.mjs --material-root <材料根>`，看退出 0、`errors=0`、`ALL CHECKS PASSED`（206-208）。随后在 A/B 各自根目录跑 P11 门禁：`node node_modules/vitest/vitest.mjs run tests/contract/page-audit-doc-contract.test.mjs tests/contract/acceptance-plan.test.mjs tests/contract/n11-plan-quality.test.mjs tests/contract/n11-acceptance-rules.test.mjs`，看退出 0、4 files/145；加 `--reporter=verbose` 核八个具名块；B 须通过九个判定器：C07-TCR、PAGE-AUDIT-DOC、ACCEPT-PLAN、N11-CRITERIA-LOCK、N11-WRITESET-DIFF、N11-ACCEPT-SCOPE、N11-ASSET-FIRST、N11-SKIP-VISIBLE、N11-TIER-MINIMAL（218-229、233）。语义部分按 112-121 人读：只读验收、R-001、A/B、门禁命令与原始输出（无标签），写「用户应看到什么」「哪类错必拒」「门禁为何区分不了」，再标 A/B，预期 A 被接受、B 被拒绝；消费者用一次并留记录（112-121、235-236）。A 须等 P11 审测收口，取不到按 92-93 停、回 build-plan。

**（2）有没有需要你自己裁断的矛盾：有。**
- 基线：53 说「若改既有行为，有改动前基线」，63 的失败信号与 280 的 STOP 却无条件写「缺基线」；23 又说本任务产品行为保持原样。缺基线是否只限改行为，材料未写，我得定。
- 计数：92 说当前四文件门禁 145 通过「只作预检，不作为 A 的最终字节」，211 又要求看到「Tests 145 passed (145)」。若 P11 审测后测试数变化，以退出 0 还是 145 为准，材料未写，我得定。
- 已裁断项：54 的门禁区分不了由判定者答、229 的 ORACLE-EFFECT-BLIND 不参与 B 全绿、89 的用户在场由主会话确认，均已写明取哪个或 owner，不算我要裁断。

**（3）能不能不回头问作者：不能。**
除上述两条，151 说「本片段是提议，未经真实确认」，却未给确认 owner/条件；190 说「见…自评」，材料无「自评」节。我必须问：缺基线是否仅限改行为；145 是否为硬计数；这份提议由谁确认后才能写 P11/spec。材料缺这三条判定规则/owner。其余 unknown 已给 owner 或恢复条件（39-41、89、274），不必问。

## 2. 覆盖范围

只读三份：phase-fragment.md 全文、original-need.md、reader-instruction.md。没读 README、旧 verdict、原件目录、specs/、git 历史，也没跑命令/查仓库；因指令限定三份、要求 fresh context。

## 3. 结论

结论：有缺口：第二件、第三件——需补「缺基线」适用条件、145 的判定规则，并给「提议」的确认 owner/条件。

# T020 评审夹具修复候选（未应用）

本目录只含候选，不改变正式测试、生产认证器、Phase 材料或 Task facts。正式测试原文件 SHA-256：`e4197528887d296211f69fd6f2b5f70a821d0cf80a500886a1991ddce420e17e`。当前仅验证补丁可应用及候选文件可解析；**没有运行正式测试，也没有 GREEN 结论**。逐项命令和退出码见 `validation.json`，均为 0。

## 候选内容

- `tests-first.patch`：只改同一测试文件的夹具选项，允许分别指定 provider 原件与聚合锚点；保留默认原有矛盾，以一条新正控得到目标 RED。另加两种“只改一侧”拒绝检查和“两侧都无效”检查。四条既有路由断言原字节不变。
- `implementation-followup.patch`：仅改变夹具默认聚合输入，让它和保存的 provider 原件使用同一合成锚点；显式指定不同值的负控仍能制造真实矛盾。完整变更见 `candidate.patch`。
- `tests-first.candidate.mjs` 与 `final.candidate.mjs` 只是语法检查用副本，不是正式测试文件。

## 实施时的精确检查顺序

在认证 CARD04 worktree、确认上述源码 SHA 与当前材料版本后：

1. `git apply --check quality/evidence/stage-quality/build-code/P10/T020-review-fixture-candidate-20260927/tests-first.patch`
2. `git apply quality/evidence/stage-quality/build-code/P10/T020-review-fixture-candidate-20260927/tests-first.patch`
3. RED：`npx vitest run tests/contract/freeze-classification-budget-usage-protocol.test.mjs`。须保留原始输出和退出码 1。新增“uses the same valid direct evidence anchor...”正控应因汇总仍是无效锚点失败；旧四条评审夹具路由断言仍失败。负控必须实际被收集，不能用失败总数代替。
4. `git apply --check quality/evidence/stage-quality/build-code/P10/T020-review-fixture-candidate-20260927/implementation-followup.patch`
5. `git apply quality/evidence/stage-quality/build-code/P10/T020-review-fixture-candidate-20260927/implementation-followup.patch`
6. GREEN 范围：`npx vitest run tests/contract/freeze-classification-budget-usage-protocol.test.mjs -t 'same valid direct evidence anchor|rejects an anchor changed|matching invalid anchors|publishes handler routing facts|accepts a fixed direction change|T014 keeps a handler completion incomplete|keeps an otherwise valid active fallback incomplete'`。须检查四条旧断言及四条新正反例的实际身份、原始输出与退出码 0。
7. 再跑同一完整单文件命令：`npx vitest run tests/contract/freeze-classification-budget-usage-protocol.test.mjs`。**不能预报整文件 GREEN**：原先另外两项失败仍在，一项读取不存在的旧任务 `decision-log.md`，另一项要求已不在当前 build-plan 技能中的旧 `tasks.md` 文案。除非另行核查和修复，否则如实记失败。

两侧都为 `[false]` 时，汇总应保留 `invalid_evidence/invalid_anchor`，handler 的有效路由应为 `incomplete`；不能因为来源一致就改判直接证据有效。候选不触及生产认证器，不代表真实业务评审通过，也不能补足 P10 业务覆盖。

宪法对照：F2 只用现有测试夹具接口；F4/Q3 保留真实认证与独立审查边界；F9/Q1 用负控拒绝假绿，未运行的正式测试保持未知；F10/F11 未增加生产控制面或公共入口。其余条款因本候选仅改测试数据，未触及。

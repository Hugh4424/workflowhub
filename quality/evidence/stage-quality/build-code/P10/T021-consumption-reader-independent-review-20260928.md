# P10/T021 消费原件读侧独立审查（2026-09-28）

范围：只读核查 `workflows/build-code/case-reconciliation.mjs`、`tests/contract/build-code-case-reconciliation.test.mjs`，对照当前 `phases/P10.md` 的本次 `run` 消费条款和 `T021-consumption-reader-20260928/` 的原始证据。未修改代码、材料或 Task facts；未另跑测试。

## 结论

局部读取逻辑可保留为待接线草稿，**不能算 T021 完成，也不能把 `run_consumption_status: verified` 当作本次正式 `run` 已消费回执的生产证明**。业务效果仍是 `unknown`，这一点处理正确。

### 交付阻点

1. **正式写入端缺席。** 当前 `runOfficialStage` 未发布 `workflowhub-p10-run-consumption.v1`，也未公开 `p10_consumption_evidence` 定位值。新增用例在测试里直接调用 `publishConsumptionFixture` 手工写原件，然后把定位值传给读者（新测试约第 285–330 行）。该用例证明读者会接受一个结构匹配的 Task 文件，不能证明文件确由本次 `runOfficialStage` 基于其实际输入回执、`runStage` 返回的完整事实清单、最终 `writeStageRow` 返回值写成。阶段行本身也没有回执或事实引用，读者无法仅凭阶段行补出这个缺失的来源关系。最小修复：先由正式写入端按 P10 条款在同一次调用内生成、写入并重读原件；集成测试从真实返回值取 locator，禁止测试手工代替该路径。

2. **认证读者放错位置。** `phases/P10.md` 第 127–130 行指定 `runtime/evidence/freshness.mjs` 为唯一只读认证点，`case-reconciliation.mjs` 只消费其结果；实际新增的 `readRunConsumption`（约第 383–450 行）直接完成路径、原件、阶段行和事实的全部认证，`freshness.mjs` 只被调用来核单个质量事实。两处会形成重复认证规则，后续正式 producer 接入时容易分叉。最小修复：把完整 `readRunConsumption` 认证移到 `freshness.mjs` 的单一导出；`case-reconciliation` 只传经 TaskHandle 的 locator 与当前身份并消费该结果，不保留第二份认证逻辑。需要随迁移保留同目标负控。

3. **“完整事实清单”和本次写行身份尚无独立绑定。** 读者核了原件列出的各 ref/hash，并要求选中 AC 各有一份、测试事实恰好一份；但它无法核 `source.quality_facts` 是否等于本次 `runStage` 实际返回的完整 refs。它只核原件所指 `facts.jsonl#N` 目前仍是唯一当前 build-code 行，不能核这个索引/hash 确实来自**同次** `writeStageRow` 的返回值。手工原件也能通过，测试正是如此。该能力必须由上述正式写入端建立；读者不得把内容哈希本身解释为作者或本次调用身份证明。若需要独立于可信写入端验证完整性，须补另一个受信绑定来源并先修材料，不能由当前读取代码宣称完成。

4. **整份定向合同测试仍失败。** `green-all.txt` 是 54 passed / 3 failed / exit 1。三个失败均在旧无 locator 的复用 Task 用例，预期缺业务事实，实际读到同 Task 先前用例留下的事实而报回执不匹配。`baseline-pair.txt` 用冻结旧读者复现其中一项相同失败；另外两项尚无逐项旧代码对照。最小修复：隔离复用 Task 夹具，逐项确认旧版与新版结果，再重跑本文件；不要把整文件写成通过，也不要借修改旧断言掩盖来源污染。

### 可保留的局部结果

- 显式 locator 限制在内容哈希命名路径，并重读原件原字节/hash；坏 ref/hash、错回执、缺选中 AC、替换当前行均在局部用例中拒绝。`readRunConsumption` 对原件列出的 output、阶段行原行加换行、质量事实和嵌套事实再核 hash；固定回执→output→manifest→raw reporter 仍走原有链。
- 带 locator 时只取原件列出的逐 AC fact，不再扫描同树全部 fact；另一回执的逐 AC fact 在局部测试中被拒。无 locator 的路径仍以 `current_execution_unverified`、`execution_freshness: unknown` 收尾，未冒充通过。
- 局部相同测试目标：旧读者 `red-verified.txt` 为 1 failed，新读者 `green-target.txt` 为 1 passed / 56 skipped。此结果只覆盖一条合成 Task 旅程；未覆盖正式写入端、错 Task/树/材料、半写、两次 `run` 交错写行、完整事实清单及真实 AC-26/27/33 效果。

### 新原件责任

`phase-card.md` 与当前 P10 材料已写 owner（正式 `runOfficialStage` 写入端）、consumer（P10/T021 对账，verify-code 只读）、替代关系和删除条件。实际代码只有合成夹具发布这个新 schema；生产接线与材料规定的唯一认证入口仍未完成。保留这些责任边界，勿把局部 GREEN 升级为阶段通过。

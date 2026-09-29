# P5/T008 六字段接线设计（只读提案）

日期：2026-09-28。只核对当前材料、代码和定向测试；未修改材料、生产代码、测试或 Task facts，未运行测试，也未生成报告。本提案不裁定 P5 中途报告在确无例外时的写法。

## 当前结论

- 现有 P5/T008 写面足够做**代码接线**：`runtime/stage/stage-runner.mjs#p5HumanExceptionFromDecisionLog/#publishP5SameRunSource`、`runtime/evidence/freshness.mjs#authenticateP5StageEndReport` 和 `tests/contract/p5-same-run-report-source.test.mjs` 都已列在当前 P5.md 的 T008 写面。T007 纯转换器已要求六字段并在渲染器复验，不必为接线改它。
- 当前 writer 的 `p5HumanExceptionFromDecisionLog()` 固定返回 `null`，因此永不发布正式报告。即使改成返回声明，writer 调 T007 时只传 `reason/source_path`，会被当前六字段校验拒绝。reader 重算时也只传这两项，最后固定返回 `missing`。现有 12 通过、6 跳过的测试不证明正例。
- 当前 CARD-04 `decision-log.md` 没有 `## 人工例外声明`；历史 `### G-2 豁免记录` 是早期改代码的测试义务，不是本次 P5 报告的当前人工例外，也没有绑定此声明的独立用户确认。不能将其改名、复制或默认注入。三份 P5 报告目前不存在，保持未完成。
- **不得直接用现有 `human-confirmation.v3` 的 accepted 记录确认 P5 例外。** 独立审查发现，该记录可能被不可逆操作的授权读者当成提交、推送、合并、归档、清理的许可。用它解决报告字段会引入越权副作用；本提案先前将其列为“候选载体”的建议在此撤回。agent 代填 `confirm` 更不能成为用户许可。

## 最小接线顺序

1. **先有真实人给出的具体声明和安全的确认来源。** 材料 owner 在当前 `decision-log.md` 增加单一、可解析的 `## 人工例外声明`，逐字保留用户针对该例外的答复；声明至少有 `declared_by`、`reason`、`scope`、`expires_at_phase`、`owner`、`verbatim`。另须保留可独立核对的原始用户答复来源。仅由 agent 写一个自称 `human_approved` 的 JSON，或由 agent 代填 `confirm --reply-text`，不能证明真人已答复。当前不得直接用 `human-confirmation.v3`；它的 accepted 状态可能被不可逆操作授权读者消费。须由材料 owner 先审定一个**只用于本报告、不授予提交/推送等权限**的真人来源及读法，并用负控证明不会误触发这些授权。此机制未确定前，writer 继续不产 CARD-04 正式报告，reader 继续 `missing`。
2. **writer 只读当前材料，不接受调用方自报。** 从已认证 worktree 的 `ArtifactDir` 读 `decision-log.md` 原字节，要求恰好一个声明块和一条声明；JSON 解析失败、多块/多条、夹具标记、缺确认、确认拒绝、确认与材料哈希/当前 Task/树/材料版本不符均不发布。`scope` 采用完整验收项 ID 边界匹配，且须命中同次 `acceptanceChain`，不能把 `AC-0010` 当 `AC-001`。从已认证 `phases/index.md` 解析当前阶段列表，要求 `expires_at_phase` 是该索引唯一列出的 `P<n>`、指向对应 `phases/P<n>.md`，且不早于 P5；不能仅凭 `n>=5` 放过不存在的 `P99`。保留 `decision-log.md` 的 ref 和原字节 SHA-256。
3. **六字段原样传给 T007。** writer 的 `declared.exceptions[0]` 取 `{declared_by, reason, scope, expires_at_phase, owner, source_path, verbatim}`；其中前五项和可选原话只来自上一步核过的声明，`source_path` 由已认证材料 ref 加声明锚点生成，不能采纳声明自写的任意路径。`source.human_exception_source` 保存声明原字段、材料 ref/hash、确认 ref/hash（以及可核原始答复 ref/hash）。不另建进度账本。T007 的 facts 内仍用现有字段名 `source`，渲染器应保留这六项及原话，同时保留机器列出的 `not_done`。
4. **reader 独立重读并重算。** 先读固定 `report-facts.json` 完成标记；无标记时前四个孤儿均为 `missing`。有标记时继续现有 delivery/certificate/source/report 原字节和 SHA-256、Task/材料/树/阶段行、当前实现/测试/审查/质量事实核验；额外重读当前 `decision-log.md`、`phases/index.md`。机械夹具可重做单一声明、完整 ID 范围和当前索引到期，并用**同一份六字段**重算 `buildStageEndReportFacts` 与 `renderStageEndReport`，要求 `report-facts.json`、`report.md` 逐字一致。CARD-04 正式 reader 只有在另经审定的安全真人来源确实可独立认证且全部检查通过时，才可返回 `authenticated: true`；否则即使机械字节相符仍为 `missing`。存在报告但坏哈希、半写或篡改也为 `missing`，实际 I/O 不可读才 `unavailable`。认证只说明报告来源可信，不把报告里的未完成事项改成通过。

## 定向验证设计

- 保留当前测试文件原字节与原始输出。当前先用**隔离夹具**为解析、六字段透传、当前索引到期、ref/hash 和半写补正反例；先让目标断言对旧代码变红，再接线转绿。夹具可测机械绑定，但不能伪装为 CARD-04 用户授权，也不能据此启用真实报告发布。正式正例、同源重试、不同来源冲突、`report.md`/delivery 写入故障与重试，须等安全真人来源机制经材料 owner 审定后再按同一要求执行。
- 增加缺声明、空声明、多声明、`fixture_only`、拒绝或不匹配的确认、确认 ref/hash 坏、原话不符、旧材料/树、当前索引没有到期阶段、P4 已过期、`AC-0010` 对 `AC-001` 错匹配，以及少任一六字段的负控。reader 还需测坏 source/certificate/report/facts 哈希、无最终标记但前四文件存在、源报告字节不一致。只运行该合同和受影响的 T007/P6/P13 定向目标。
- CARD-04 真正的同次官方 `run --action=execute` 必须有本次 P5 游标、同一快照的 T007 实现收据及测试 output、当前 P5 独立审查、已发布质量事实和阶段行；writer 只在这些条件和**独立安全真人来源**都成立后，才写内容寻址 source/certificate 及三检查点。公共 CLI stdout 原字节另存，不能把内部 JSON 序列化声称为 stdout。reader 对真实 Task 再读一遍，不能以夹具正例或三文件存在性代替。

## 仍待外部事实

用户尚未确认 P5 **中途**报告“确无例外”时能否写“没有例外”；先前答复只准最终报告核查后这样写。本提案不修改现行空数组拒绝规则。当前也没有 P5 真人例外声明、安全的独立确认机制，且现有 `human-confirmation.v3` 不能直接承担此用途。若最后确实无例外，应由材料 owner 按用户新答复修订契约和 T007/T008 的正反例；不能为了打通当前 writer 编造一条例外。

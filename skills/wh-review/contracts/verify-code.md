# Verify Code 审查合同

本合同是标准 verify-code 的 post-evidence 外部质量审查。先完成新鲜测试、每条
验收标准的 acceptance-evidence 和 evidence aggregate，再按配置运行一次
`wh-review`。它认证并保留 active accepted build-code 的最终全树 **pass** 审查作为
verify-stage acceptance lineage；本次审查绝不替代、升级或写入该 lineage。

本次结果只是一项非 gate 质量事实：`pass`、`revise_required` 和 `unavailable` 都要
进入 verify-code 人类确认摘要，但不能自动接受、拒绝、修复或放行阶段。verify run
的 `receipts.review` 仍只能引用已认证的 build-code 最终全树审查，不能引用本合同
产生的 result/attempt。

provider 只能审查冻结材料，不得访问真实仓库、运行 Git 或读取宿主绝对路径。

## 必需材料

- `review-instructions.md`：stage、审查问题和输出格式。
- 验收标准。
- 默认不发送完整代码或 diff；只有 `context_map` 明确选择的直接证据片段才可交付。
- `ac-evidence-summary.v1`：每条验收标准的 result、场景、oracle、实际结果、范围限制、例外，以及
  acceptance leaf、嵌套证据和测试 receipt 的 canonical ref/SHA-256。生成器逐条验证这些
  ref、hash、snapshot 和 AC 一对一覆盖；无法从已认证证据推导的字段必须标为 `unknown`，不发送
  aggregate、leaf、原始日志或完整证据树。
- 尚未关闭的问题和例外；没有时也要明确写明“无”。
- 与本次审查有关的 reviewer 技能文件。
- `manifest.json`：列出 provider 可见的每个文件及其 byte size、SHA-256，并据此计算 `material_id`。

`wh_review.v2` 路由还必须给出 `context_map` 和 `evidence_map`。每张 map 都有
`state: complete|unknown`、简短 `summary` 和逐项 `entries`（`id`、`subject`、
`rationale`、`disposition`）；map-level `unknown` 必须同时说明 `unknown_reason`，不能伪装成完整上下文。
`complete` 条目必须有可验证 anchors（id、snapshot path、行区间、role、reason）；
`not_applicable` 或 `unknown` 条目必须给出受限 `reason_code` 和理由，不能用自由文本
`not_needed_reason` 绕过锚点。

首轮返回 `revise_required` 仍是质量事实而不是 stage pass gate。普通修复直接继续，
不做二审；可选 response ledger 只形成外置审计记录，缺失或无法验证时标记
`unverified`，且不自动完整审查。只有完整且可绑定 ledger 显式声明方向、验收标准、
接口、schema、状态、安全、并发、拓扑、phase 顺序或测试策略发生结构性改变时，才最多
再做一次完整审查。第二轮使用配置的 initial route，不带 response ledger；其 finding
不循环也不阻断推进。`accepted_risk` 仅记录，必须在 verify-code 人类确认摘要中显式展示。

人类审查卡按 finding 显示一个 disposition：`fixed`、`rejected_invalid`、
`accepted_risk`；没有可绑定 ledger 时显示 `unverified`。这描述处理事实，不把
provider verdict 转成“审查通过”。

UI scope 还必须包含真实浏览器证据，包括被验证流程、关键状态、结果、是否复用登录态和清理结果。缺少任一必需材料时，本次 attempt 返回 `unavailable`。补齐后直接重跑，不创建或修复永久 flow。

## 审查重点

- 每条验收标准是否有针对当前 snapshot 的客观证据。
- 证据来源、对象和结果是否可定位且互相一致。
- 关键失败和边界场景是否覆盖。
- 尚未关闭的问题和例外是否诚实，是否与交付范围冲突。
- UI 证据是否证明真实页面流程和关键状态，而不是只证明页面能打开。

## 输出

输出遵循 `provider-protocol.md` 的最小 reviewer JSON：`verdict`、`summary`、`findings`。不要求 checklist、pass items、skillResults、bundle hash、finding 生命周期或模型回显材料 hash。

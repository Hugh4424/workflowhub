# Build Code 代码审查边界

## 当前普通流程

`build-code` 对每个 Phase 的当前真实 diff 发起一次 OCR delegation 独立审查。
审查读取适用的验收标准全文、实现、直接 consumer、相关测试和失败边界，
输出有源码锚点的 findings 或真实 `unavailable`。主会话逐条处置 finding，
在同一任务修复，并只复验受影响行为。Phase 的审查事实绑定当次 task、
Phase、材料与代码快照；旧快照的结果保留原身份。

所有 Phase 后，`build-code` 在当前快照执行一次最终 aggregate 测试，并逐 AC
记录实际结果、证据与限制。`verify-code` 随后对最终 worktree 发起一次 OCR
独立代码审查，重点检查真实入口、跨 Phase 接口、consumer、生命周期、安全、
失败路径和测试强度；该次审查携带当前验收标准全文。最终代码审查与功能
验收分别记事实。审查和测试都不能用空 findings 或绿色命令代替逐 AC 结果。

当前代码审查通过既有 public `review --action=record` 与 stage `run` 记录；
Phase 结果由 `receipts.review` 消费，终末 worktree 结果由
`receipts.quality_review` 消费。provider 的身份、原始 findings、失败和
`unavailable` 原样保留。质量事实限制完成声明，不阻止同一任务继续修复。

`wh-review` 保留 make-decision、build-spec、build-plan 等其它审查面的既有
用途；此文件不为代码审查提供第二条派发路径。正式代码质量判断来自各次
OCR 的独立执行与现有 canonical review fact，主会话负责 finding 处置。

## 历史 integration 事实

既有 `build-code/integration` attempt、result、packet、receipt 和 findings
作为只读历史原件保留，按它们记录的 task、scope、材料与 snapshot 解读。
它们不构成当前最终 worktree OCR 审查，也不自动证明本次最终 aggregate、
逐 AC 结果或完成状态。历史 provider 不可用时保留原失败事实；历史 finding
仍可作为风险线索，由当前代码和测试重新核对，不生成新的 integration 审查。

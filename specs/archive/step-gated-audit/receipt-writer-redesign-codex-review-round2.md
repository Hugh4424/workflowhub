# receipt-writer-redesign Codex 异源审查结果（第2轮）

**审查时间**: 2026-07-03T12:32:22Z
**调用方式**: `omc ask codex`（走 bingchaai 代理，模型 gpt-5.5，exit code 0，成功）
**被审文档**: `specs/step-gated-audit/receipt-writer-redesign.md`
**背景**: 针对第1轮审查（`receipt-writer-redesign-codex-review.md`）提出的3条疑虑，planner 已修订文档，本轮逐条复核并查新问题。

---

## 总体结论

> **revise_required，暂不应进入实施阶段。**
>
> 旧3条关键疑虑在新版文档里均做了正面修订，大方向已正确。但新版方案将核心计数键升级为 `journal_entry_id`，却没有定义它的生成方式、持久化格式，以及 `STEP_EXIT` 如何引用对应 `STEP_ENTRY`。这是实施前必须补齐的阻断点。

---

## 旧3条疑虑复核

| 疑虑 | 判断 | 文档证据 |
|------|------|---------|
| 疑虑1：chain-topology 只返回 stepIds，aggregator 仍按 step_id 做 latest，跨重试链路互相覆盖 | **已解决（设计层面）** | 第3.3节：返回值改为 `{ chainNodes: ChainNode[], warnings: string[] }`，ChainNode 含 `journal_entry_id`；第3.4节：aggregator 按 `(step_id, journal_entry_id)` 做 latest，key 格式 `${step_id}::${journal_entry_id}` |
| 疑虑2：`validateReviewPayload` 对 executed=false 时 null/缺失字段处理不明确 | **已解决** | 第3.2节 `validateReviewPayload` JSDoc 明确：`report_path/raw_result_path` 允许 null 或省略；`verdict` 允许 "unknown"/null/省略；`skipped_reason` 或 `error_reason` 至少一个必填 |
| 疑虑3：`receipt_write_warn` 与 audit 可见性没闭合，写失败的 exit payload 会丢 | **已解决（主路径）** | 第3.1节 `appendReceiptWriteWarn`：warn 事件必须携带 `original_exit_payload: exitPayload`（完整不裁剪）；第3.4节：aggregator 消费 `receipt_write_warn` 中的 `original_exit_payload`，视同 STEP_EXIT 纳入计数 |

---

## 新增设计疑虑（5条）

### 1. `journal_entry_id` 是核心键但仍是开放问题（阻断级）

文档第3.3、3.4节把 `journal_entry_id` 作为拓扑和聚合的基础键；但第9节（待确认事项4）仍写"需确认现有 journal 事件是否已有可用的唯一标识字段"。这不是实现细节，是核心数据模型未定义。

**修正建议**：在 journal schema 中正式定义 `journal_entry_id`。推荐 `STEP_ENTRY` 写入时生成 `crypto.randomUUID()`，字段名固定为 `journal_entry_id`。

### 2. `STEP_EXIT` 如何绑定对应 `STEP_ENTRY` 未定义（阻断级）

文档要求 `firstByStepAndEntry(exitEvents)` 使用 key `${step_id}::${journal_entry_id}`，但 `writeExitReceipt` 的接口仍只接收 payload，没有说明 payload 必须携带 entry 的 `journal_entry_id`，也没有说明门面如何把 entry id 传给 exit。没有这个绑定，`latestByStepAndEntry` 无法可靠实现。

**修正建议**：`writeEntryReceipt` 返回 `{ journal_entry_id }`；调用方必须把该 ID 放入 `writeExitReceipt` payload；`validateExitPayload` 校验该字段为非空字符串；`receipt_write_warn.original_exit_payload` 必须保留该字段。

### 3. 历史实现无稳健唯一 entry id（阻断级）

历史 `d5a5ddc:runtime/evidence/receipt-writer.mjs` 的 `buildJournalEvent` 只生成 `schema_version`、`event_type`、`ts`，无唯一 ID 字段。文档提到 `ts + step_id` 作为候选，但同毫秒、多进程、手写迁移场景下均不稳健。

**修正建议**：明确历史/缺字段 journal 的兼容策略：缺 `journal_entry_id` 的旧事件走降级路径（仅按 step_id 聚合，返回 warning），不进入新精确聚合路径；新写入必须生成稳定唯一 ID。

### 4. `receipt_write_warn` 双写失败边界未明说（非阻断，需补文字）

新方案解决了"warn 携带 payload"的问题；但若原始 `STEP_EXIT` 写失败、`receipt_write_warn` 也写失败，aggregator 仍无法恢复计数。文档只说写 stderr，不抛错。此边界可接受，但必须在设计中明说：双写失败时 audit 无法恢复，stderr 是唯一证据，不承诺"写入失败的 exit 一定被计入"。

### 5. 粗粒度 helper 仍公开导出，存在误用入口（建议收窄）

文档仍导出 `firstByStepId`、`latestByStepId`（第3.3、3.4节）。主路径不用它们，但公开 API 仍是误用入口。建议改为内部函数，测试通过公开行为覆盖。

---

## 最小修订项（进入实施的前置条件）

1. **在 journal schema 中正式定义 `journal_entry_id`**，不放在"待确认事项"里。推荐 `crypto.randomUUID()`，字段名固定。
2. **定义 exit 到 entry 的绑定方式**：`writeEntryReceipt` 返回 `journal_entry_id`，`writeExitReceipt` payload 必须携带该字段，`validateExitPayload` 校验非空。
3. **明确历史旧 journal 兼容策略**：缺 `journal_entry_id` 的事件走降级路径 + warning，不进入精确聚合。
4. **补测试用例**：同 step_id 两个 entry、两个 exit、各自引用不同 journal_entry_id，验证 latest 不串链；`receipt_write_warn.original_exit_payload.journal_entry_id` 恢复计数。
5. （建议）收窄 `firstByStepId` / `latestByStepId` 不对外公开导出。

---

**最终判定**：旧3条大方向已修正；新增2条阻断点（journal_entry_id 生成未定义、exit 到 entry 绑定未定义）需补齐后方可进入实施。当前状态 `revise_required`，不是 `can_implement`。

---

*原始 codex artifact 路径: `.omc/artifacts/ask/codex-specs-step-gated-audit-receipt-writer-redesign-md-codex-spec-2026-07-03T12-32-22-634Z.md`*

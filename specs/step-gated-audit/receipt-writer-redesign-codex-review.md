# receipt-writer-redesign Codex 审查报告（Round 3）

**审查时间**: 2026-07-03
**审查对象**: `specs/step-gated-audit/receipt-writer-redesign.md`（含 Round 2 修订）
**审查范围**: Round 2 两个阻断点是否真正解决；有无新阻断点

---

## verdict: revise_required

---

## Round 2 阻断点处置情况

### 阻断点4（journal_entry_id 生成方式）：实质已解决，但文档内部存在矛盾

第9节第4、5条已明确：
- 由 `journal-appender.mjs` 统一生成，格式 `${iso_timestamp}_${step_id}`，调用方禁止自行传入。
- `appendJournalLine` 写入 STEP_ENTRY 后将 `journal_entry_id` 作为返回值返回，接口改为 `Promise<{ journal_entry_id: string }>`。

**但 3.1 节的接口声明仍写 `Promise<void>`，未同步更新。**
第9节提示"现有接口声明（3.1节）需同步更新"，但实际未改。
若实施者以 3.1 节规范性接口定义为准，会产生实现错误（appendJournalLine 不返回 ID，门面层无法透传）。

### 阻断点5（exit-to-entry 绑定机制）：已解决

"调用方持有、显式传入"方案在第9节第5条描述清晰，禁止反查的原因明确，重试场景保证到位。绑定机制本身已解决。

---

## 新疑虑（3条）

### 疑虑1（阻断）：exit 事件中 `journal_entry_id` 字段名歧义，影响所有 key 拼接逻辑

文档在多处使用 key 格式 `${step_id}::${journal_entry_id}` 来索引 exit 事件（`firstByStepAndEntry`、`latestByStepAndEntry`、audit-aggregator 计数逻辑）。但文档未明确：

- exit 事件自身是否携带 `journal_entry_id` 字段（代表 exit 事件本身的唯一ID）？
- 还是 exit 事件只携带 `exit_journal_entry_id` 字段（绑定对应 entry 的ID）？
- key 拼接时的 `journal_entry_id` 到底取 exit 事件的哪个字段？

这一歧义直接影响 `firstByStepAndEntry(exitEvents)` 的实现——从 exitEvents 里拼 key 时，实施者无法确定应取 `event.journal_entry_id` 还是 `event.exit_journal_entry_id`。若取错，拓扑发现和计数聚合的 key 不一致，导致静默漏计或全部未命中。

**需修复**：在 3.3 节 `firstByStepAndEntry` 注释中显式说明：key 中的 `journal_entry_id` 取自 exit 事件的 `exit_journal_entry_id` 字段（即绑定的 entry ID），而非 exit 事件自身的 ID（若 exit 事件有自身 ID，也应一并说明字段名）。

### 疑虑2（文档内部一致性，须修复）：3.1 节 appendJournalLine 返回类型未更新

见"阻断点4"分析。3.1 节是规范性接口定义，第9节是开放问题记录，两者矛盾。实施者会以 3.1 节为权威，导致接口实现错误。需在本轮修订中消除，而非留在第9节作为"待同步"说明。

**需修复**：将 3.1 节 `appendJournalLine` 返回类型从 `Promise<void>` 改为 `Promise<{ journal_entry_id: string }>`（STEP_ENTRY 场景），并明确非 STEP_ENTRY 调用（STEP_EXIT、STEP_AUTO_ROLLBACK）的返回类型约定。

### 疑虑3（连带影响）：`receipt_write_warn` 场景下 warn 事件字段与 ChainNode 字段对齐关系未说明

3.4 节说 warn 事件内嵌的 `original_exit_payload` 被视同 STEP_EXIT 纳入计数，需按 `(step_id, journal_entry_id)` 判断是否属于可达节点。但 `original_exit_payload` 里存的是 `exit_journal_entry_id` 字段（绑定 entry），而可达节点集 `ChainNode` 里存的是 `journal_entry_id`（entry 事件的ID）。文档未说明两者如何对齐。

**需修复**：在 3.4 节显式说明：匹配时取 `original_exit_payload.exit_journal_entry_id` 与 `ChainNode.journal_entry_id` 对比（两字段名不同但值相同），防止实施者用错字段或漏匹配。

---

## 修订建议摘要

1. **3.1 节**：将 `appendJournalLine` 返回类型更新为 `Promise<{ journal_entry_id: string }>`，并明确非 STEP_ENTRY 调用的返回约定。删除第9节第5条末尾的"需同步更新"备注。
2. **3.3 节**：在 `firstByStepAndEntry(exitEvents)` 注释中明确 key 的 `journal_entry_id` 取自 exit 事件的 `exit_journal_entry_id` 字段。
3. **3.4 节**：补充 warn 场景字段对齐说明：`original_exit_payload.exit_journal_entry_id === ChainNode.journal_entry_id`。

---

*本报告覆盖 receipt-writer-redesign-codex-review.md，取代 Round 1 结论。Round 2 审查结论见 receipt-writer-redesign-codex-review-round2.md。*

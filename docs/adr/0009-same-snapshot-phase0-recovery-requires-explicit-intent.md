# ADR 0009 — 同 snapshot Phase 0 恢复需要显式授权

**状态**：拟议  
**日期**：2026-07-26

当当前指针已在 Phase 1，而历史 Phase 0 的正式 PASS evidence、review 和 receipts 仍完整且指向同一 snapshot 时，允许受控恢复到 Phase 0。该能力不是普通重试：凭证的 `phase_subject.recovery_intent` 必须精确为 `same-snapshot-phase0-reopen`；字段缺失时继续返回 `RECOVERY_PHASE_SNAPSHOT_ALREADY_CURRENT`，字段用于 changed-snapshot 时拒绝。成功恢复只追加一次 recovery generation，原子翻转当前 pointer 到 Phase 0/`awaiting_review`，旧记录保持不变；历史 PASS 只证明旧闭合，不直接成为新的当前授权，恢复后仍须完成一次新的正式 Phase 0 review 才能继续 Phase 1。

选择在现有 `workflowhub-recovery-credential.v1` 的 Phase subject 中加入可选、受限字段，保持旧 changed-snapshot 凭证和行为不变，同时让新同 snapshot 凭证必须明确表达更高权限的恢复意图。拒绝“相同 tree 自动恢复”和“直接复用历史 PASS 成为当前结果”：前者扩大授权，后者无法证明恢复后的当前 pointer、generation 与 continuation chain 已被重新核验。

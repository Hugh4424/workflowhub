# ADR 0008 — 同任务恢复采用追加记录

**状态**：已接受  
**日期**：2026-07-25

## 背景

现有任务会因 runner 身份与工作树不一致，或 Phase 指针已推进而无法合法恢复。直接改任务记录或覆盖既有通过结果虽然看似省事，却会破坏正式证据链。

## 决策

Phase 0 的 `phase-pointer` 恢复继续采用追加记录：保留旧通过结果，以追加记录承接新快照的真实凭证；只有重新完成正式证据与审查后，新结果才成为当前结果。恢复期间不得推进 Phase 1 或 Phase 2。

原 runner replacement 决策降为 `legacy_pinned` 任务迁移前的只读兼容，不再是正常工具升级路径。新任务使用 `execution_mode=per_invocation`，任务清单不保存 `runner_root`、`runner_oid` 或当前 replacement 指针。每次正式调用对显式 runner 做 Git 顶层、branch、HEAD、clean 状态和合同内容认证，并把 task/stage/run/来源写入 create-only 调用身份。升级 WorkflowHub 只产生下一次调用身份，不复制 checkout、不改任务清单、不追加 runner recovery generation。

旧任务必须通过一次受控迁移进入 `per_invocation`：迁移以原始 `task.json` hash 做 CAS，追加确定性迁移记录，保留既有 migration/replacement lineage 供历史读取，并从当前 manifest 移除 live runner 绑定。相同输入 replay 只有在迁移记录与当前 manifest 均精确匹配时幂等；旧 hash 不同或并发变化必须失败。没有 `execution_mode` 的任务一律按 `legacy_pinned` 解释，禁止静默升级。

## 考虑过的选项

- 永久保留 runner 绑定：拒绝，因为正常工具升级会制造无业务价值的 runner 目录和 replacement 长链。
- 直接覆盖任务或 Phase 记录：拒绝，因为会破坏不可变证据与追溯。
- 新建独立任务链：拒绝，因为会丢失原任务的已接受输入和证据关系。

## 后果

需要一次遗留迁移和按调用认证；历史 runner lineage 仍可读，但不能继续增长。Phase 恢复规则保持有效。不得手改任务记录、让 dirty 工作树冒充 HEAD、把调用身份冒充质量审查，或绕过正式 review/verify。

## 受限增补：历史 PASS lineage（2026-07-25）

已通过的历史 Phase 在同一任务内可以增加一份 `phase-trace-lineage` 记录，用于让 selector 重新核验既有 PASS。它不是恢复入口：不改旧 receipt、review、snapshot 或 current pointer，不改变连续路径选择，也不调用审查 provider。发布前必须逐项重新核验 task/project、stage/phase、Git tree、trace/material/schema、PASS review/ref；缺失、篡改、错绑、非 PASS 或重复绑定均拒绝。该记录只能追加，且只解除精确匹配的历史分支 untraced 阻塞。

## 增补：make-decision 阶段恢复 run（2026-07-30）

当同任务的 make-decision run 因真实调用缺失、宿主中断或旧快照过期而不能继续时，恢复
追加一个新的 stage run。新 run 仅以 `previous_run_ref/hash` 和 `recovery_source_ref/hash`
引用最近历史 run；它不复制旧 invocation、journal completion、receipt、review 或 accepted
事实。旧 run 如需停止，另追加 invalidation 记录，历史字节不改。

恢复只从 task/kernel 派生确定的已登记、无 symlink、干净的 recovery workspace；当前完整
HEAD 是新 run baseline。调用方不能传 workspace、branch 或 baseline。普通 `prepare`、其他
stage 和 accepted run 的工作区规则不放松。活动 make-decision recovery run 的后续命令及
方向/详情审查继承同一认证工作区，避免把恢复 run 错送入普通 ancestry 检查。

有效 invalidation 后，旧 run 可以作为下一次恢复的只读 source；同一未失效恢复 run 不能被
重复消费。恢复 source 的配对 ref/hash 由 runtime 在锁内 CAS 写入，防止并发重复恢复。这些
规则只保护事实真实性，不创建新的确认点、审计 Gate 或状态机。

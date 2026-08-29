# 实施任务：multica-ZHI-850

**输入**：accepted `spec.md` 与 `plan.md`。  
**测试**：Vitest 定向 suites；完成前 `npm test`、`npm run check`。  
**不变式**：exact intent、权威 pointer、完整闭合、append-only、单 gate、CAS、fresh review、changed-snapshot 不变。

## 阶段 1：credential 与权威校验

- [ ] T001 [contract] 修改 `core/schemas/workflowhub-recovery-credential.v1.json` 与 `core/task-recovery.mjs`：`phase_subject` 只新增可选 exact `recovery_intent`；修正 allowed/required key 集合；保持旧 changed-snapshot credential 有效。  
  **要求**：FR-001、FR-012。**依赖**：无。**验证**：schema/runtime 表驱动 intent 矩阵；额外字段与错误值全部 fail closed。

- [ ] T002 [validation] 修改 `scripts/task-recovery.mjs`：在现有权威 pointer、baseline Phase 0 evidence/review、receipt/hash/tree 闭合上先计算 same/changed，再实现 intent 矩阵；移除既有 snapshot-equality 的无条件提前拒绝。same+missing、same+错值、changed+exact 分别落入 intent 缺失、错配、用途错误语义；exact intent 只放行 same snapshot Phase 1→0。  
  **要求**：FR-002～FR-004、FR-011、FR-012。**依赖**：T001。**验证**：AC-002～AC-006、AC-013；每次拒绝前后比较 pointer/gate/history/review 状态。

- [ ] T003 [P] [tests] 扩展 `core/__tests__/task-recovery.test.mjs`：credential exact-match、unknown key、identity/hash/ref/tree、replay/generation validation；test-only writer/hook 不可从生产 input 到达。  
  **要求**：FR-001、FR-003、FR-011。**依赖**：T001。**验证**：定向 core recovery suite。

- [ ] T004 [tests] 扩展 `scripts/__tests__/task-recovery.test.mjs`：闭合缺项四类代表矩阵、same/changed 用途矩阵、旧 changed-snapshot 基线。  
  **要求**：FR-002～FR-004、FR-012。**依赖**：T002、T003 fixture。**验证**：AC-004～AC-006、AC-013。

## 阶段 2：原子 gate/pointer 提交

- [ ] T005 [atomic] 修改 `core/task-handle.mjs` 的 phase recovery replace：继续使用 `locks/build-code-phase-evidence.lock`、create-only generation 和 expected-prior pointer CAS；确保任一异常恢复旧 pointer并移除本次 generation。新增 test-only `beforeGenerationCreate`，并与 generation create 后的 `beforePointerReplace`、pointer write 的 `validatePointerReplace` 形成三处确定性注入；这些 hook 不进入 CLI/schema/production input。archive 仅可保存旧 pointer 副本，不能成为成功/gate。  
  **要求**：FR-005～FR-009。**依赖**：T002。**验证**：record persist、post-gate/pre-pointer、pointer replace 三个注入点；逐项断言 pointer 原始字节、gate、generation、旧历史不变。

- [ ] T006 [controller] 修改 `scripts/task-recovery.mjs`：所有可前置校验在提交前完成；lock 内重读 gate/pointer。same+exact 提交后立即调用现有 `publishBuildCodePhaseEvidence`：健康时保留 `canonical_phase_evidence_ref`/`fresh wh-review`；continuation 异常不得抛成恢复失败，须成功返回 `recovery_ref`、`recovery_hash`、`phase_id`、`status` 与 `next_entry: stage-runtime publish-phase-evidence`。changed+missing 完整保留现有同步发布、异常、副作用与返回字段；changed+exact、same+missing 在提交前拒绝。  
  **要求**：FR-005～FR-009、FR-011。**依赖**：T005。**验证**：AC-001、AC-007、AC-009、AC-012；post-commit 不存在可让已提交恢复被报告为失败的步骤。

- [ ] T007 [concurrency] 增加确定性 barrier 夹具，让两个合法请求竞争同一来源 pointer；另注入第三方 pointer 更新。  
  **要求**：FR-005、FR-007、FR-008。**依赖**：T006。**验证**：AC-008；恰好一成功，失败为 replay/conflict，只有一条 generation、一次 pointer flip；失败者不产生第二次恢复或额外 review。最终恰好一次 fresh review 由 T010/T011 全链路断言；AC-008 仅在 T011 完成后关闭。

- [ ] T008 [regression] 完成原子失败与历史不可变摘要测试；覆盖重试从权威 pointer/gate 重新判断。  
  **要求**：FR-006、FR-007、FR-009。**依赖**：T006、T007。**验证**：AC-009、AC-012；清除故障后安全重试，旧 Phase/review/receipt/attempt bytes 不变。

## 阶段 3：fresh Phase 0 review

- [ ] T009 [phase-evidence] 修改/收紧 `scripts/task-recovery.mjs` 与 `workflows/build-code/phase-evidence.mjs` 的恢复 continuation：健康路径自动调用；中断后由现有 `stage-runtime publish-phase-evidence` 再驱动。两路都只接受当前 pointer 匹配的 recovery ref/hash；canonical evidence 必须携带该绑定；旧/错/缺失绑定拒绝。  
  **要求**：FR-010、FR-011。**依赖**：T006。**验证**：AC-010；新 evidence hash/material ID 不同于旧 Phase 0，旧 review ref 不能完成新 pointer。

- [ ] T010 [review] 扩展 Phase review 测试：新 recovery material 产生新 attempt/result；同一新材料重试复用同一 canonical result；revise_required/unavailable 不再恢复、不复用旧 review、不追加第二 gate。  
  **要求**：FR-005、FR-010。**依赖**：T009。**验证**：AC-007、AC-010、AC-011。

- [ ] T011 [flow-regression] 扩展 `tests/build-code-phase-evidence.test.mjs` 及必要 e2e：fresh PASS 后才可 Phase 1；normal Phase、existing reopen、无 intent、changed-snapshot、review routing 保持固定夹具结果。  
  **要求**：FR-010、FR-012。**依赖**：T010。**验证**：AC-005、AC-010、AC-013；测试使用现有确定性 provider substitute。

## 阶段 4：文档、全量证据、正式审查

- [ ] T012 [cross-cutting] 更新 `docs/contracts/task-context.md` 与 CLI help：exact intent、same/changed 矩阵、权威 closure、gate/CAS、fresh review、失败语义、禁止手改；运行定向 suites、`npm test`、`npm run check`，显式核对 AC-008 的单成功与单 fresh-review 两半断言均已落地，完成每 Phase 正式 review 与 integration review。  
  **要求**：FR-001～FR-012。**依赖**：T004、T008、T011。**验证**：AC-001～AC-013 全映射且无开放 finding。

## 依赖图与并行性

```text
T001 → T002 → T004 ───────────────┐
  └──→ T003 ───────┘              │
T002 → T005 → T006 → T007 → T008 ├→ T012
                    └→ T009 → T010 → T011 ─┘
```

- T003 可与 T002 并行，但 T004 需等 T002/T003。
- T009 可在 T006 稳定后与 T007/T008 测试工作并行；T010/T011 串行依赖 T009。
- `core/task-handle.mjs`、`scripts/task-recovery.mjs`、共享 fixtures 的修改按 T005→T006→T007 合并，避免同文件并行冲突。

## 停止条件

- 现有 CAS/lock/rollback 无法证明单成功与失败零 gate。
- 现有闭合校验不能覆盖 accepted Phase 1 所需全部正式事实。
- recovery ref/hash 不能让 same-tree fresh review 获得新材料身份。

任一成立：停止实现并回报阻塞；不引入新存储、通用回滚、第二 gate 或审查路由改造。

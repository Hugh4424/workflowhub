# 任务清单：WorkflowHub 整批治理

- **阶段**：`build-plan`
- **状态**：`build-code / in_progress`
- **输入**：canonical `specs/<taskId>/decision-log.md`、`specs/<taskId>/spec.md`、`specs/<taskId>/plan.md`、`specs/<taskId>/tasks.md`
- **执行边界**：本文件只定义 build-code/verify-code 的待执行任务；不把当前 worktree 候选 diff、修复性探针、历史测试或 provider 结果写成任务完成。
- **禁止**：触碰外部输入的 `WORKFLOWHUB_ORIGINAL_CHECKOUT_ROOT`；reset/clean/prune/对象修复；commit/push/merge/archive/cleanup；新增 public stage/gate/state/writer/evidence store。

## 状态规则

- 所有任务当前为 `pending`；build-plan 不填写 `actual_changes`、`executed_commands`、exit code 或 completed_at。
- RED/GREEN 任务必须共用同一个行为命令和 oracle。若当前候选 diff 已让 RED 变绿，记录 `not_applicable: candidate behavior already present`，不得制造失败，也不得把现有 GREEN 当交付完成。
- `unknown`、`unavailable`、`incomplete`、`stale` 和 serious finding 是真实事实，不转换为 pass。
- T000 必须先输出 `mapping_status=complete`、空的 `overlap_conflicts` 和 `target_file_conflict=false`；否则后续任务只记录 blocked，不改目标文件。这是任务链输入契约，不是 public gate。
- T021 只负责 catalog/bundle projection 与 closure 事实；T022 总是消费 census 并产出 disposition/deferred 事实，不执行删除；它不是 public gate，未知 consumer 只延期删除候选，不阻塞普通业务路径。

## 依赖图

```text
T000 → T001 → T002 → T010 → T011 → T020 → T021 → T022 → T050 → T040
```

无循环依赖。每张卡只有一个状态区、一个 owner、一个完成 oracle 和一个回滚边界；T022 是 T040/T050 的事实前置，但不是 public gate。

## T000 — provenance 与授权边界

- **Phase**：P0
- **状态**：`completed`
- **依赖**：无
- **目标**：逐文件核对当前 tracked/untracked diff、来源、授权、owner、真实 consumer、FR/AC、完成 oracle、失败语义、测试和回滚；同时核对 trusted clone 健康基线、活动治理 worktree、恢复 worktree、原始 checkout 只读状态。四个根目录由外部执行输入提供给 `WORKFLOWHUB_WORKTREE_ROOT`、`WORKFLOWHUB_TRUSTED_CLONE_ROOT`、`WORKFLOWHUB_RECOVERY_WORKTREE_ROOT`、`WORKFLOWHUB_ORIGINAL_CHECKOUT_ROOT`，不把宿主绝对路径固定进任务材料。先收集 Git 状态，再逐条以 decision-log/spec/plan 和 code/test search 完成 diff mapping；Git 输出只是输入，不能代替 consumer/oracle 证明。
- **唯一 owner / consumer**：主代理只读审计；后续 build-code 只消费已归属文件。
- **精确输入**：当前 worktree `git status/diff`、`decision-log.md`、`spec.md`、`plan.md`、inventory/design/ADR、三个 worktree。
- **输出**：`evidence/build-plan/T000/provenance.json`；每个 tracked/untracked diff 逐项含 `diff_id`、`root_role`、相对路径、HEAD、branch、tracked/untracked 状态、授权、owner、`real_consumer`、`consumer_evidence_ref`、`requirement_refs`、`completion_oracle`、`test_oracle`、`failure_semantics`、`rollback_point`、`disposition`、`evidence_ref`、`evidence_hash`；顶层另含 `mapping_status`、`overlap_conflicts`、`target_file_conflict`；无 diff 的 root 行允许 `diff_id: null`；build-plan 不伪造内容。
- **命令**：`for root in "$WORKFLOWHUB_WORKTREE_ROOT" "$WORKFLOWHUB_TRUSTED_CLONE_ROOT" "$WORKFLOWHUB_RECOVERY_WORKTREE_ROOT" "$WORKFLOWHUB_ORIGINAL_CHECKOUT_ROOT"; do git -C "$root" status --short --untracked-files=all; git -C "$root" rev-parse --show-toplevel --verify HEAD^{commit}; git -C "$root" symbolic-ref --quiet --short HEAD || true; done; git diff --check`；随后逐条以 decision-log/spec/plan 和代码、测试搜索补齐上述 mapping，并保存每条引用/hash。
- **完成 oracle**：当前 snapshot、原始 checkout 只读和每个 in-scope diff 的 requirement/consumer/oracle/test/rollback mapping 可回指；不能证明的字段标 `unknown`，不能用“无输出”代替盘点。只有全部 in-scope diff 完成映射且 `overlap_conflicts=[]`、`target_file_conflict=false` 时，才可写 `mapping_status=complete`。
- **失败语义补充**：in-scope diff 若仍有 `unknown` 的授权、真实 consumer、完成 oracle、测试 oracle 或回滚点，或存在未解释的目标文件重叠，则 `mapping_status=blocked`，T001/T002/T010/T011/T020/T021/T022/T050/T040 不得修改目标文件或进入最终 handoff；不把此检查升级为 public gate。
- **失败语义**：未授权、无法归属、需要 destructive Git 操作或发现原始 checkout 被写入时 STOP。
- **回滚**：只丢弃本次只读审计输出；不触碰代码、task storage 或 `.git`。
- **覆盖**：`FR-GOV-001`、`FR-BRANCH-001`、`AC-011`、`AC-012`。

### T000 执行事实（2026-08-25）

- `mapping_status=complete`；`overlap_conflicts=[]`；`target_file_conflict=false`。
- 当前 trusted worktree 为 31 个 tracked diff 文件、621 insertions、256 deletions；17-file/260/66 是旧快照，已保留为历史事实，不能覆盖当前盘点。
- 当前还存在 28 个 untracked task-owned path：canonical materials、inventory/design/ADR、build-plan/verify-code evidence 和 workspace contract test；旧任务 `evidence/final/*` 未混入当前盘点。
- 四根目录复核完成：trusted clone 保持 baseline `74a246ea542d82b1fd0d00bc721b0890911c3d52`；recovery worktree 只保留其既有 untracked evidence；original checkout 只读探针确认原有脏状态；未执行 reset/clean/prune/object repair/commit/push/merge。
- 任务记录路径与代码 worktree 已拆开：TaskHandle record 为 `/Users/Hugh/Hugh/Knowledge/Projects/WorkflowHub/tasks/workflowhub-batch-governance-20260824`，其 `target_repo_root` 才是当前 trusted worktree；后续 stage/review 输入不得把代码 worktree 当 TaskHandle path。
- 历史 author/commit、外部手工 consumer 和 legacy 删除时机仍为限制事实；它们只影响兼容删除/最终交付声明，不阻塞已授权的当前 phase 实施。
- 证据：`evidence/build-plan/T000/provenance.json`。

## T001 — workspace/session contract RED

- **Phase**：P0A
- **状态**：`completed / not_applicable_red`
- **依赖**：T000
- **目标**：锁定现有实现会把合法现有 worktree 拼成第二 deterministic path、丢失 explicit workspace 或错误要求 branch；对 existing/legacy task 冻结同一绑定元组：task id、target repo realpath、workspace realpath、Git registration/common dir、当前 symbolic branch 和当前 HEAD/baseline commit。branch/commit 是同一 Workspace/既有 make-decision fact 的认证字段，不新增 manifest、writer 或第二 binding store；stage/skill 嵌套只作为既有 bridge 回归输入，不升级为新的产品 AC 或 public gate。
- **唯一 owner / consumer**：`runtime/task/workspace.mjs` 与 `tools/host/workflowhub-codex-session-state.mjs`；stage-context、stage-runtime、wh-review bootstrap。
- **精确文件**：`runtime/task/task-handle.mjs`、`runtime/task/workspace.mjs`、`tools/cli/task-bootstrap.mjs`、`tools/host/workflowhub-codex-session-state.mjs`、`tools/host/workflowhub-stage-agent-bridge.mjs`、`scripts/__tests__/task-bootstrap.test.mjs`、`tests/contract/workspace-binding.test.mjs`、`tests/m15-codex-session-hook.test.mjs`。
- **命令**：`npx vitest run tests/contract/workspace-binding.test.mjs scripts/__tests__/task-bootstrap.test.mjs tests/m15-codex-session-hook.test.mjs`
- **RED oracle**：基线若未修复，必须失败在 explicit/legacy path、manifest pair、错误 branch/HEAD/path 或 stage filter/order 行为断言；既有 bridge 时间回归只验证不误报；fixture/setup 失败不算 RED。
- **兼容边界**：旧 manifest 只读；普通 repo 仍允许 deterministic 新建默认；existing workspace 不要求固定的 branch 命名，但必须认证实际 symbolic branch 和 baseline HEAD；detached HEAD 不满足本任务的 trusted-worktree 绑定。
- **失败语义**：non-Git、symlink、registration/common-dir/branch/HEAD mismatch 明确失败；session handoff mismatch 仍只记 unavailable；不得 fallback 到第二路径。
- **回滚**：不改实现；保留 RED 事实并回 T000。
- **覆盖**：`FR-EXEC-001`、`FR-BOUNDARY-001`、`AC-001`、`AC-004`。

## T002 — workspace/session contract GREEN

- **Phase**：P0A
- **状态**：`completed`
- **依赖**：T001
- **目标**：让 explicit existing 与旧 linked-worktree manifest 直接进入当前 Workspace；让 session handoff 只投影请求 stage、按时间排序，沿用既有 bridge 合同，不增加第二状态机。
- **唯一 owner / consumer**：沿用 `task-bootstrap`、`TaskHandle`、`workspace.mjs` 和 bridge；stage/review/official runtime consumers。
- **精确文件**：T001 文件集；不得修改 TaskKernel writer、public stage/gate/state、原始 checkout 或 immutable external task manifest。
- **动作**：只在新 task bootstrap 的 `createTask` manifest producer 处成对写入 `workspace_mode: "existing"` + `workspace_root`；认证 real Git toplevel、非 symlink、registration、common dir、symbolic branch 和 current HEAD；legacy direct linked-worktree 只读兼容，并在第一次认证时从同一 Git 检查得到 branch/HEAD，交给既有 make-decision workspace fact 继续绑定；不改写旧 manifest、不新增 binding writer；existing 不进入 task-owned cleanup；bridge 按 stage 投影并保持既有时间校验；session handoff 只做辅助 provenance，已有其他 task binding 时返回 `unavailable`，不阻塞显式 task/workspace；官方 stage smoke 从 canonical `specs/<taskId>/decision-log.md`、`spec.md`、`plan.md`、`tasks.md` 读取四材料。
- **命令**：RED/GREEN 共用且字节一致的行为命令：`npx vitest run tests/contract/workspace-binding.test.mjs scripts/__tests__/task-bootstrap.test.mjs tests/m15-codex-session-hook.test.mjs`，覆盖正确/错误 branch、正确/错误 HEAD、错误 path 和 legacy manifest；T002 再运行 supplemental `node tools/cli/stage-runtime.mjs doctor --action=workspace --stage=build-plan --project=WorkflowHub --task=workflowhub-batch-governance-20260824`，确认 official stage 入口返回当前 worktree、baseline 和 `materials: working`；再运行 supplemental `npx vitest run tests/integration/vnext-official-stage-run.test.mjs tests/contract/spec-stage-artifact-closure.test.mjs tests/contract/workspace-binding.test.mjs scripts/__tests__/task-bootstrap.test.mjs tests/m15-codex-session-hook.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`，由 fixture/manual cases 覆盖四份 canonical 材料正常读取、旧 root copy 只读、单份材料缺失和 material revision/snapshot stale。标准 `wh-review` 只作为一次独立计划审查事实，不属于 T002 GREEN/AC-001 oracle，provider terminal status 不作为 workspace pass/fail。
- **GREEN oracle**：返回用户指定 worktree，且 task/workspace/registration/common dir/branch/HEAD 绑定元组可回指；stage-context/stage-runtime 到达各自后续处理；四份 canonical 材料正常读取，旧路径不会覆盖或替代 current material，缺失/stale 给出可定位的 unavailable/stale 原因；standard wh-review 只作为独立 review fact，不是 T002 GREEN；错误 identity 明确失败；`task.json` 不在运行中被改写，manifest bytes 不被旧兼容路径改写。
- **失败语义**：路径、task、stage、材料或 Git/workspace identity 不匹配时不写事实、不静默修复、不创建第二 workspace；session handoff mismatch 只标记 `unavailable`，不阻断显式 task。
- **回滚**：只回退本卡 exact files 和 contract tests；保留旧 manifest、历史 evidence、task storage 和 `.git`。
- **覆盖**：`FR-EXEC-001`、`FR-EXEC-002`、`FR-BOUNDARY-001`、`FR-HANDOFF-001`、`AC-001`、`AC-002`、`AC-004`、`AC-010`。

### T001/T002 执行事实（2026-08-25）

- RED：`not_applicable`。当前候选实现已存在，未人为制造失败；RED/GREEN 仍绑定同一行为命令。
- 测试路由：`test-routing-advisor` 判为 `fullstack`；原因是 runtime/task、CLI、host/session、stage bridge、TaskHandle 和 integration contracts 跨边界。
- 具体测试：`fullstack-slice-testing` 已执行。
  - `npx vitest run tests/contract/workspace-binding.test.mjs scripts/__tests__/task-bootstrap.test.mjs tests/m15-codex-session-hook.test.mjs`：exit 0，3 files / 34 tests passed。
  - `node tools/cli/stage-runtime.mjs doctor --action=workspace --stage=build-plan --project=WorkflowHub --task=workflowhub-batch-governance-20260824`：exit 0，返回当前 trusted worktree、baseline `74a246ea542d82b1fd0d00bc721b0890911c3d52`、`materials=working`。
  - official-stage supplemental：exit 0，5 files / 76 tests passed；其中一次 fixture 输出了无效 make-decision analyzer packet 的诊断，但测试整体通过，不能把它隐藏成产品验收。
- T002 oracle：explicit existing 与 legacy linked-worktree 均直接绑定当前 worktree；错误 path/branch/HEAD/registration 保持显式失败；session mismatch 仍为 unavailable-only；未创建第二 workspace。
- 当前 canonical test receipt：`quality/tests/build-code-p0a-focused.json`，snapshot tree `4c7a35bcec10380af796e69d3154790108a12fe8`，receipt hash `bb7ca8eab3d3814b6840658f5a8b8d5abc772b275b4332b4581582567fcf4427`。
- 阶段审查：一次 build-code P0A `wh-review` 已使用 TaskHandle record 路径 `/Users/Hugh/Hugh/Knowledge/Projects/WorkflowHub/tasks/workflowhub-batch-governance-20260824`；provider reached but terminal `unavailable`，`PROTOCOL_INCOMPATIBLE`，0 valid reviewer result；没有 findings 可修复，不重复调用。
- 证据：`evidence/build-code/T001-T002/routing-and-tests.json`、`evidence/build-code/T001-T002/review.json`。

## T010 — review ownership RED

- **Phase**：P1
- **状态**：`completed / not_applicable_red`
- **依赖**：T002
- **目标**：证明两个同名 `code_review` 生产面不能同时成为 completion truth，并锁定缺 ref/hash、wrong task/stage/snapshot/material、serious finding 和 unavailable 负例。
- **唯一 owner / consumer**：dsh stage outcome 是 canonical owner；completion/close/release 是唯一 canonical consumer；wh-review 是 advisory consumer。
- **接口事实**：canonical 输入是 `execution.code_review.result` + `execution.code_review.quality_review_ref/hash`，并绑定 `dsh-code-review` skill id；旧同名 advisory 输入只能映射到 `independent_review`，不能喂给 completion。
- **精确文件**：`runtime/stage/stage-agent-outcome-adapter.mjs`、`runtime/stage/stage-handlers.mjs`、`runtime/stage/stage-runner.mjs`、`skills/wh-review/SKILL.md`、`skills/wh-review/contracts/verify-code.md`、`skills/wh-review/scripts/wh-review-cli.mjs`、相关 stage/review tests。
- **命令**：`npx vitest run tests/integration/vnext-official-stage-run.test.mjs tests/final-cutover-guards.red.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **RED oracle**：基线若未收敛，必须失败在 canonical/advisory identity 或 negative contract；当前候选行为已存在时不制造假 RED。
- **失败语义**：无法证明唯一 canonical consumer 时 STOP，退回 make-decision，不新增第三 subject/writer。
- **回滚**：不改历史 review attempt/result/finding/provenance。
- **覆盖**：`FR-REVIEW-001`、`FR-CONTROL-001`、`AC-003`、`AC-005`、`AC-006`。

## T011 — review ownership GREEN

- **Phase**：P1
- **状态**：`completed`
- **依赖**：T010
- **目标**：dsh ref/hash 唯一进入 canonical `code_review`；wh-review 只写已有 `independent_review` advisory subject；completion/close 只消费 canonical；serious finding 不丢。
- **唯一 owner / consumer**：dsh stage outcome producer；stage runner authentication；`TaskKernel` current fact writer；completion/close canonical reader；wh-review advisory reader。
- **精确文件 / API**：`runtime/task/task-kernel-implementation.mjs:publishVNextQualityFact`；`runtime/stage/stage-agent-outcome-adapter.mjs:publishStageAgentOutcome`；`runtime/stage/stage-runner.mjs:publishOfficialStageOutcome/runOfficialStage`；`runtime/stage/stage-handlers.mjs:addCompletion`；`runtime/evidence/quality-store.mjs`（legacy reader/writer boundary）；`runtime/evidence/canonical-evidence-validators.mjs`；`skills/wh-review/scripts/wh-review-cli.mjs:publishStageReviewFact`；consumer tests at least `tests/integration/vnext-official-stage-run.test.mjs`、`tests/final-cutover-guards.red.test.mjs`、`tests/integration/projection-replacement.test.mjs`。
- **动作**：绑定 `quality_review_ref/hash`、`review_fact_intent`、task/stage/snapshot/material revision 和实际 bytes；先重新核对现有 `skills/wh-review/contracts/verify-code.md` 与 `skills/wh-review/scripts/wh-review-cli.mjs`，确认已有 advisory subject=`independent_review`、dsh canonical subject=`code_review`；若现有 subject 不同，按实际既有 schema 更新本任务后停止实现，不新增 subject/object。wh-review CLI 的 intent 固定 subject=`independent_review`，evidence 指向 `quality/reviews/results|attempts` ref/hash；同 bytes replay 幂等，冲突 bytes fail-loud；保留 provider/attempt/finding provenance。
- **GREEN oracle**：canonical/advisory 不再同名争夺完成；缺失、冲突、stale、unavailable、major/serious 都能被真实读取并保持非 pass。
- **命令**：与 T010 同一 focused command。
- **失败语义**：任何 ref/hash/identity mismatch 不写 current fact，不覆盖历史，不降低 serious finding；同一 payload bytes 的并发 replay 只能产生一个 current fact，异 bytes race 必须返回既有冲突语义并保留两边原始 provenance；测试必须覆盖原子幂等、冲突、stale、serious finding 和 unavailable。
- **回滚**：恢复到本卡变更前的既有 owner；历史 records 只读。
- **覆盖**：`FR-REVIEW-001`、`FR-TRUTH-001`、`AC-005`、`AC-006`、`AC-009`。

### T010/T011 执行事实（2026-08-25）

- RED：`not_applicable`。候选实现已具备 canonical/advisory 分流和负例保护，未制造假失败。
- 具体测试：`fullstack-slice-testing` 使用同一 P1 行为命令，exit 0；2 files / 83 tests passed / 22 skipped。
- 关键 oracle：`dsh-code-review` 的 `quality_review_ref/hash` 才能进入 canonical `code_review`；`wh-review` 只进入 `independent_review`；wrong material revision、stale attempt、invalid intent、handler rejection、serious finding、unavailable 均保持非 pass 事实。
- 当前 canonical test receipt：`quality/tests/build-code-p1-focused.json`，snapshot tree `7b1b923fdfeb77c04fc75fd058e61c844285b6f9`，receipt hash `91f7387094fea73c70029a8f22ce823af9feba034118e244c6e7c645ff07d421`。
- 阶段审查：一次 P1 `wh-review` 已用外部 TaskHandle record 路径调用，provider reached 但 terminal `unavailable`，`PROTOCOL_INCOMPATIBLE`，0 valid reviewer result；无 findings 可修复，不重复 unchanged review。
- 证据：`evidence/build-code/T010-T011/routing-and-tests.json`、`evidence/build-code/T010-T011/review.json`。

### T010/T011 外部协议根因修复（2026-08-25）

- 根因：WorkflowHub 旧语义 `materialId` 包含 `canonical-evidence.json`，实际外部 `3rd-review` v3 算法排除它；provider group 因顶层 `material_id` 不同而被 WorkflowHub 拒绝，旧记录的 `provider_attempts=[]` 不能解读为 provider 无 findings。
- 修复：复用 `skills/wh-review/scripts/review-materials.mjs` 的已有 bundle writer；语义身份排除 `canonical-evidence.json`，交付 manifest 仍保留该审计索引。未新增 stage、gate、state、writer 或 evidence store。
- 回归：`review-materials-contract.mjs`、`review-provider-client-v3.test.mjs`、`review-runner.test.mjs` 共 124 tests passed；receipt `quality/tests/wh-review-material-identity-fix.json`，exit 0。
- 修复后外部 `wh-review` 真实 P1 调用已发起并启动 provider，但约 15 分钟无公开终态，停止本任务等待；不写成 pass/空 findings，外部 provider liveness/timeout 作为独立未完成事实保留。
- 详细根因、算法对照、风险和推进边界：`docs/research/workflowhub-wh-review-material-identity-incident-20260825.md`。

## T020 — truth/freshness 与 consumer census

- **Phase**：P2
- **状态**：`completed_with_unknowns`
- **依赖**：T011
- **目标**：收敛 `quality_fact_intent`、material revision、snapshot/freshness、quality/completion/release 三层语义，并逐条列出旧 record/projection/reader 的真实 consumer。为 AC-005 单独记录 history/freshness unavailable、unknown、incomplete、stale 的实际场景、普通任务继续条件和不得改写为 pass 的 oracle；history 缺失不阻塞有效 workspace/core-material/write-boundary 路径。
- **唯一 owner / consumer**：现有 material revision/snapshot/freshness owner；review、completion、release、历史 reader。
- **精确文件**：`runtime/stage/completion-predicates.mjs`、`runtime/stage/stage-runner.mjs`、`runtime/task/task-handle.mjs`、`runtime/evidence/quality-store.mjs`、`runtime/task/task-store.mjs`、`runtime/evidence/fact-collector.mjs`、对应 identity/freshness/projection tests。
- **精确 surface / 来源**：`quality/verify.json` → `runtime/task/task-store.mjs` 的 bootstrap/status/public-behavior/per-AC readers；legacy `quality-store` → `runtime/evidence/quality-store.mjs` 的 mini-task/legacy readers；v1/v2 fact collector → `runtime/evidence/fact-collector.mjs` 与 monitoring/fact-index readers；旧 attempt refs → `runtime/task/task-handle.mjs:listStageAttemptRefs` 及 freshness reader；旧 review path → `tests/integration/verify-freshness-selection.test.mjs` 及其实际调用者。逐项追加 T020 census 未列出的真实 exact surface，不用目录存在或单个测试名称替代 consumer 证明。
- **输出**：`evidence/build-plan/T020/consumer-census.json`；每项必须含 `surface`、`reader`、`source_ref`、`owner`、`real_consumer`、`consumer_evidence_ref`、`requirement_refs`、`completion_oracle`、`failure_semantics`、`compatibility_boundary`、`archive_ref`、`deletion_condition`、`negative_test_ref`、`rollback_point`、`evidence_ref`、`evidence_hash`、`disposition`。
- **命令**：`npx vitest run tests/contract/stage-completion.test.mjs tests/contract/task-handle.test.mjs tests/integration/verify-freshness-selection.test.mjs tests/integration/projection-replacement.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **完成 oracle**：current/history、quality/completion/release、stale/unavailable/incomplete 可区分；同一 current fact 只有 TaskKernel writer；每个 exact surface 都有代码调用、manifest/catalog、CLI/host 或测试来源和真实 consumer 证据；删除后的负向读取/不可用 oracle 已绑定，census 逐项可回指 reader 和测试。
- **失败语义**：身份、revision、snapshot、bytes 不匹配时 fail-loud；未知 consumer 只读保留，不猜删除。
- **回滚**：只回滚本卡 exact mapping/reader 变更；保留 census 和历史事实。
- **覆盖**：`FR-EXEC-002`、`FR-TRUTH-001`、`FR-COMPAT-001`、`AC-002`、`AC-004`、`AC-007`、`AC-009`。

### T020 执行事实（2026-08-25）

- 具体测试：`fullstack-slice-testing` focused command exit 0；4 files / 98 tests passed。
- 证实的 real consumers：canonical quality/freshness、review provenance、workspace/material identity、catalog/bundle projection、legacy readonly projection、close/browser routes。
- 保留 unknown：`requirement-lineage` 与 `qa-only/verify-change` 的外部/manual consumer 无法从当前 checkout 证伪；unknown 不等于 no consumer。
- 处理边界：旧记录只读兼容；没有真实 consumer 的删除候选继续延期；不新增 writer、state、gate 或 evidence store；不执行删除。
- 当前 receipt：`quality/tests/build-code-p2-truth-focused.json`，snapshot tree `d60a08069b9820eb7977736e4a49ed40cc802acb`，receipt hash `3b318441833a23d7a932b84c05423f9c0db3dc3f3c596f26d215fdcf97ee5b19`。
- 证据：`evidence/build-plan/T020/consumer-census.json`。旧 `evidence/build-plan/T040/consumer-census.json` 保留为历史口径，不冒充当前 T020。

## T021 — catalog/bundle 与 projection 对账

- **Phase**：P2
- **状态**：`completed_with_deferred_dispositions`
- **依赖**：T020；**不是删除任务**
- **目标**：只做 catalog、manifest、stage dependency、bundle closure 与真实 host/CLI consumer 的诊断和非破坏性、可逆 projection 对账；只消费 T020 census，不凭猜测 unregister、delete 或 archive；把需要后续授权的 exact surface 交给 T022 做 disposition-only 记录。
- **唯一 owner / consumer**：catalog/manifest/closure owner；真实 host/CLI/stage consumer。
- **精确文件**：`skills/catalog.yaml`、`workflows/*/skill-deps.yaml`、`skills/wh-review/stage-skill-plan.json`、各 `skills/*/skill-bundle.json`、`tools/cli/stage-runtime.mjs`、`skills/wh-review/scripts/wh-review-cli.mjs`、`tools/host/workflowhub-stage-agent-bridge.mjs`、closure/catalog/reuse/lineage tests，以及 T020 census 指定的 legacy exact files；ghost candidates 至少核对 `requirement-lineage`、`qa-only/verify-change`、`resolving-merge-conflicts` 的 manifest/host/CLI/test 来源。
- **命令**：`npx vitest run tests/skill-provenance-strict.test.mjs tests/contract/spec-stage-artifact-closure.test.mjs tests/requirement-lineage.test.mjs tests/reuse-registry.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **输出**：`evidence/build-plan/T021/catalog-closure.json`；每项含 `surface`、`source_ref`、`owner`、`consumer`、`consumer_evidence_ref`、`dependency_path`、`bundle_path`、`closure_oracle`、`negative_test_ref`、`rollback_point`、`failure_semantics`、`live_or_ghost` 和 `T022` 处理引用。
- **完成 oracle**：每个 live surface 有真实 consumer；每个 ghost candidate 有 manifest/catalog/stage/host/CLI/test 来源对账；closure/doctor 只产诊断；T021 只负责 projection/closure 事实，未知 consumer 不会让普通任务路径停住；任何 T021 correction 都能按原 bytes/引用回滚，且不会在 T022 proof 前移除注册关系。
- **失败语义**：closure/consumer 事实缺失时标 `unknown` 并保留最小只读兼容；T021 不得 unregister、delete、archive 或断开旧 reader；不把删除动作塞进本卡，也不阻塞 T022 的事实处置或普通业务路径。
- **回滚**：只回退本卡非破坏性 projection 对账；任何删除、归档、unregister 的 proof、archive bytes 和恢复动作必须由另一个明确授权的 cleanup task 管理，不属于 T021/T022；不 reset/clean/prune。
- **覆盖**：`FR-CATALOG-001`、`FR-COMPAT-001`、`FR-CONTROL-001`、`AC-003`、`AC-007`、`AC-008`。

### T021 执行事实（2026-08-25）

- 具体测试：`fullstack-slice-testing` focused command exit 0；4 files / 20 tests passed。
- 补充 closure：`npm run check:skill-closure` exit 0（`skill closure: ok`）；`npm run smoke:skill-packages` exit 0（5 stages）。
- live surface：build-code declared dependencies、wh-review bundle、stage CLI/host bridge、close/browser routes；catalog/bundle closure 与实际 consumer 可回指。
- ghost/unknown：absorbed `stage-step-receipts`/`audit-summary-carrier`、standalone `requirement-lineage`、`qa-only`/`verify-change` 保留历史或最小只读兼容；不恢复第二 review flow。
- T021 只做 projection/closure 事实；未 unregister、delete、archive，也未新增 public gate/stage/state/writer/evidence store。
- 证据：`evidence/build-plan/T021/catalog-closure.json`。

## T022 — 旧表面处置事实（本批不执行删除）

- **Phase**：P2
- **状态**：`completed_with_deferred_dispositions`
- **依赖**：T021；本卡只产出处置事实，不删除、归档、unregister 或改变运行时；是 T050/T040 的事实前置，但不是 public gate 或普通业务阻塞
- **目标**：只把已经证明没有真实 consumer 的旧 projection/reader 标成 `delete_candidate`，把未知或证据不足的表面标成 `retain_read_only`/`deferred`，不把事实记录误写成删除动作。
- **唯一 owner / consumer**：T020 census 与 T021 closure 的治理执行者；T050 消费 disposition，后续独立 cleanup task（若获授权）才消费删除候选；无消费者旧表面本身不是 live consumer。
- **动作**：逐项写出 `retain_read_only`、`delete_candidate` 或 `deferred`。只有 `real_consumer: none` 且 closure/negative test/rollback/授权证据齐全时，才可标 `delete_candidate`；存在真实或未知 consumer、证据不足或外部 consumer 未绑定时标 `retain_read_only` 或 `deferred`。本卡不执行任何 destructive operation。
- **输出**：`evidence/build-plan/T022/disposition.json`；每项含 `surface`、`census_ref`、`closure_ref`、`real_consumer`、`disposition`、`missing_proof`、`negative_test_ref`、`rollback_point`、`authorization_ref`、`compatibility_path`、`evidence_ref`、`evidence_hash`。
- **完成 oracle**：每个 inventory surface 都有唯一 disposition、owner、consumer、证据和失败语义；`delete_candidate` 只能证明“具备另开 cleanup task 的条件”，不能写成已删除；未知 consumer 保留最小只读兼容；T050 消费本卡事实，不能把 T021 closure pass 当成删除覆盖。
- **失败语义**：任何证明缺失都标 `deferred`/`retain_read_only`，不伪造“无消费者”，不阻塞 T050/T040 的正常交接；若需要本卡直接删除，停止并退回授权边界。
- **回滚**：本卡只写 disposition evidence；丢弃该 evidence 即可，不改代码、历史记录、task storage 或 `.git`。真实删除、归档、unregister 和恢复必须在另一个明确授权的 cleanup task 中完成。
- **覆盖**：`FR-COMPAT-001`、`AC-007`、`AC-008`。

### T022 执行事实（2026-08-25）

- 这是 disposition-only 材料事实，不是行为实现；没有为它新增 gate、stage、state、writer、store 或测试门槛。
- `retain_current`：4 个当前运行时/route surface；`retain_read_only`：3 个旧/standalone surface；`deferred`：1 个 absorbed/historical surface；`delete_candidate`：0；本批没有 merge/delete/unregister/archive。
- 原因：本地没有证明 `requirement-lineage`、`qa-only`、`verify-change` 和历史 provenance 的外部/manual consumer 已不存在；未知不等于无消费者，故按已确认的最小只读兼容原则延期。
- 后续 cleanup 条件：逐项外部 consumer 证明、negative read/dispatch tests、archive hash、restore plan 和单独用户授权；这些不属于当前 build-code。
- 证据：`evidence/build-plan/T022/disposition.json`。

## T040 — truthful handoff 与一次性治理报告

- **Phase**：P3
- **状态**：`completed_with_unknowns`
- **依赖**：T050
- **目标**：一次性说明修改前后对象、gate、stage、writer、测试数量和职责；分别列出删除、合并、保留、未完成、延期、回滚和真实 provider/测试限制。
- **唯一 owner / consumer**：`runtime/stage/stage-handlers.mjs:addCompletion` → `runtime/evidence/stage-completion-facts.mjs:buildStageCompletion` 生成 `completion.confirmation_summary`；`tools/cli/stage-runtime.mjs` 的 `run --action=execute` 返回该 completion；host consumer 是外部 Codex desktop task message（无仓内渲染模块时显式记录 external host boundary），并用人工可见检查验证。报告不是 runtime truth writer，不新增 UI/store。
- **精确文件**：`runtime/stage/stage-handlers.mjs`、`runtime/evidence/stage-completion-facts.mjs`、`tools/cli/stage-runtime.mjs`、`tools/host/workflowhub-codex-session-state.mjs`；外部 host/UI consumer 若没有可回指模块，记录 `external_host_consumer` 和 `visibility_check_ref`，不得凭文件存在宣称可见。
- **动作**：先按 additive 规则核对/同步 `CONSTITUTION.md` 的 F11 和 `constitution-checklist.md` 的 F11 勾选/判据，确认 F1-F10、Q1-Q3、S1-S8 与旧编号未被改写；再识别真实 host/UI consumer（不能只假定“当前 Codex task 消息”可见），用现有 host 的人工可见路径核对目标、范围、非目标、成功标准、风险、review 限制、未决和延期；字段映射固定沿用现有对象：`goal`←`renderUserCompletion.objective`+`confirmation_summary.scope`，`success_criteria`←`verification.conclusion`+`confirmation_summary.tests`+`expected_impact`，`review_limits`←`review.conclusion/providers/findings/refs`+`review_advice`+`verification.limits`，`unresolved`←`missing_items`+`audit_gaps`+`risks`，`deferred`←`confirmation_summary.deferred`，`user_action`←`user_action`，`next_boundary`←`next_stage_boundary`；只允许在 `runtime/evidence/stage-completion-facts.mjs:renderUserCompletion/assertCompletionViewsConsistent` 内补齐已有投影，不能新建对象、store 或 writer。核对三个 worktree/健康基线/原始 checkout/授权记录；AC-005 同时披露 provider、history/freshness、catalog/bundle、auxiliary evidence 的不可用/未知/未完成事实及普通任务继续条件；不把报告变成计数 gate。
- **完成 oracle**：`CONSTITUTION.md` 与 `constitution-checklist.md` 都有 F11，且 diff 证明只新增/同步 F11；上述仓内 producer/CLI 路径产生完整字段，并有 external host consumer 的人工可见检查，证明用户实际能看到目标、范围、风险、审查限制、未决和延期；若 external host consumer 或 visibility check 不存在，AC-010 必须是 `incomplete`/`deferred`，并退回 make-decision 记录“缺少现有可见投影”，不能把 deferred 当成完成；focused green、空 findings、stage ready、closure pass 或 transport success 未被写成产品验收/release；不新增 communication store。
- **失败语义**：host 无法表达或无法证明完整交接时只停止“完成/交付声明”，不阻塞普通修复路径；将 AC-010 标为 `incomplete`/`deferred`，不新增 communication store。
- **回滚**：只重写本次 handoff/report 摘要；保留原始 test/review/evidence bytes。
- **覆盖**：`FR-HANDOFF-001`、`FR-REPORT-001`、`FR-TRUTH-002`、`FR-GOV-001`、`AC-003`、`AC-010`、`AC-011`、`AC-012`。

### T040 执行事实（2026-08-25）

- 沿用现有 `stage-handlers.addCompletion` → `stage-completion-facts` disclosure projection → `stage-runtime` 返回路径；没有新增 communication store、UI、writer、stage 或 gate。
- 宪法同步：只新增 F11，并同步 `constitution-checklist.md`；F1-F10、Q1-Q3、S1-S8 原编号和条文未改写。
- 一次性报告：`evidence/build-plan/T040/truthful-handoff.json`；报告已给出对象、gate、stage、writer、review subject、测试数量和职责的前后对比，并列出合并、保留、未删除、延期、风险和回滚。
- 当前 host 边界：`host_consumer_ref=external:Codex desktop task message`；没有独立 `visibility_check_ref`，AC-010 保持 `deferred`，不把聊天可见性伪装成仓内 receipt。
- public stage runner：当前 explicit task/trusted worktree 调用已执行；第一次 session analyzer 形状错误已在同 task 修正，第二次仍为 `stage_outcome_invalid`；未发布 authenticated current build-code outcome，不宣称 completion、acceptance 或 release。
- T022：`delete_candidate=0`；没有删除、归档、unregister 或 cleanup。外部/manual consumer proof、negative test、archive hash、restore plan 和授权仍是后续独立 cleanup 条件。
- 结论：本卡 `completed_with_unknowns`，表示 truthful handoff 已产出，不表示产品交付完成。后续如需处理 8 个全量失败文件、stage outcome contract 或 provider terminal，应另开有明确范围的任务。
- 证据：`evidence/build-plan/T040/truthful-handoff.json`、`evidence/build-code/repair-wh-review-lifecycle/public-stage-run.json`。

## T050 — current snapshot 测试与交接收口

- **Phase**：P3
- **状态**：`completed_with_unknowns`
- **依赖**：T022
- **目标**：在当前 snapshot 记录 focused suites、一次全量 `npm test`、标准 wh-review terminal result、未完成/不可用和回滚方案。
- **唯一 owner / consumer**：现有 test runner、closure/smoke、quality/review records；用户交接，不是新 release gate。
- **命令**：上述 focused commands；`npm test` 只运行一次并记录实际 exit/counts/files；只读取本 task 之前已经生成的标准 `wh-review` attempt/result/report 引用，不重新调用 broker、不 continuation、不做 format-correction retry；没有终态就记录 `unavailable`/`incomplete`、原 attempt ref 和 error code。输出 `evidence/build-plan/T050/ac-evidence-matrix.json`（交接报告，不是第二 evidence store）。每个 AC 行含 `ac_id`、`applicable`、`scenario`、`oracle`、`command_or_manual_steps`、`actual_result`、`status`、`snapshot_tree`、`material_revision`、`evidence_ref`、`evidence_hash`、`limitation`、`deferred_reason`；AC-005 必须分别披露 provider、history/freshness、catalog/bundle、auxiliary evidence 四类状态和普通任务继续条件；AC-007/AC-008 另含 `deletion_ref`、`census_ref`、`closure_ref`、`archive_ref`、`negative_test_ref`、`rollback_point`、`authorization_ref`、`disposition`，并消费 T022 disposition/deferred facts；若 `disposition=delete_candidate`，`deletion_ref` 只引用候选事实，不得声称实际删除；AC-010 另含 `host_consumer_ref`、`visibility_check_ref`。
- **失败分类**：全量失败按 `governance`、`implementation`、`external_dependency`、`environment`、`not_executed`、`unknown` 分类；每类保留失败文件、exit 和原始输出 ref/hash，不能把未执行、未知或环境失败改写成 pass。
- **完成 oracle**：每个 applicable AC 有 current evidence 或明确 deferred；AC-005 的四类 unavailable/unknown/incomplete/stale 必须保持原状态，不能改写成 pass；T022 已确定的 disposition/deferred 事实必须出现在 AC-007/AC-008 行；若 T022 异常未产事实，这两项必须 `incomplete` 并停止 handoff completion claim；若没有 `host_consumer_ref` 和 `visibility_check_ref`，AC-010 必须是 `deferred`/`incomplete`，不能报告 covered；全量失败原样保留且可分层；不宣称产品验收、merge 或 release。
- **失败语义**：缺 current identity、遗漏 serious finding、隐藏 full failure、或需要新增 gate/state/store 时 STOP。
- **回滚**：保留原始输出，只修正交接摘要；不以重复全量重跑掩盖失败。
- **覆盖**：全部 `FR-*`；`AC-001`～`AC-012`。

### T050 执行事实（2026-08-25）

- 当前身份：见 `evidence/build-plan/T050/ac-evidence-matrix.json` 的 current snapshot/material revision；active trusted worktree 仍是 dirty/uncommitted，未 commit、push、merge。
- changed-seam focused：`npx vitest run skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs tests/contract/review-materials-contract.test.mjs --reporter=dot` exit 0；2 files / 54 tests passed / 0 failed。`npm run check:skill-closure` exit 0，`skill closure: ok`。
- independent clean external lifecycle：在 `/Users/Hugh/Project/3rd-review-repair-20260825`、HEAD `8e41ea3ff07c5ffa5a5133181ca7e031cc86add4` 执行 `node --test test/process.test.mjs test/broker.test.mjs test/health-runner.test.mjs`，exit 0；65 tests passed。该 worktree 未写入。
- 全量回归只运行一次：`npm test` exit 1；`test:safe` 为 8 failed files、15 failed tests、1855 passed、24 skipped、1894 total；`test:exclusive` 未执行，因为 package script 在 `test:safe && test:exclusive` 的 `&&` 处停止。失败文件和分类完整保留在 `evidence/build-code/repair-wh-review-lifecycle/fullstack-test-evidence.json`。
- 标准 wh-review：只读取已有 attempt `quality/reviews/attempts/ade0c950-bfc7-474c-b35a-5b5720535481/attempt.json`；当前 provider review 未调用，历史错误 `PROTOCOL_INCOMPATIBLE` 保持 `unavailable`，没有新 broker、continuation 或 format-correction retry。
- 阶段末 `spec-analyze`：本阶段只执行一次，结果 `consistent`；它只说明材料语义一致，不覆盖 provider unavailable、全量非零、AC-010 host visibility 或产品验收/release。
- public stage runner：按现有 `run --action=execute` 调用一次；第一次暴露错误的 session analyzer 输入形状并在同一 task 修正，第二次仍返回 `stage_outcome_invalid`；没有把失败写成 stage ready 或 completion。
- AC 矩阵：`evidence/build-plan/T050/ac-evidence-matrix.json`；AC-005/009/011 保持 `incomplete`，AC-001/007/010 保持 `deferred`，没有把它们写成 pass。
- 证据：`evidence/build-code/repair-wh-review-lifecycle/focused-results.json`、`fullstack-test-evidence.json`、`review.json`、`spec-analyze-result.json`。
- 回滚：只需回滚本轮 `review-materials.mjs`、`wh-review-cli.mjs`、对应 contract tests 和 bundle/catalog closure hash；保留 red、focused green、全量失败、unavailable 和 T022 disposition 原始 bytes；不执行 cleanup。

## FR/AC 追溯

| FR | AC | 任务 |
| --- | --- | --- |
| `FR-GOV-001` | `AC-011, AC-012` | T000, T040, T050 |
| `FR-EXEC-001` | `AC-001` | T001, T002 |
| `FR-EXEC-002` | `AC-002, AC-007, AC-009` | T002, T020 |
| `FR-CONTROL-001` | `AC-003, AC-004` | T010, T011, T020, T021, T040 |
| `FR-TRUTH-001` | `AC-004, AC-005, AC-009, AC-010` | T010, T011, T020, T021, T040, T050 |
| `FR-TRUTH-002` | `AC-010, AC-011` | T040, T050 |
| `FR-REVIEW-001` | `AC-005, AC-006` | T010, T011, T020, T021, T040, T050 |
| `FR-COMPAT-001` | `AC-007` | T020, T021, T022 |
| `FR-CATALOG-001` | `AC-008` | T021, T022 |
| `FR-BOUNDARY-001` | `AC-004, AC-009` | T002, T011, T020 |
| `FR-HANDOFF-001` | `AC-010` | T040, T050 |
| `FR-REPORT-001` | `AC-011, AC-012` | T040, T050 |
| `FR-BRANCH-001` | `AC-012` | T000, T040, T050 |

## Build-code handoff

build-code 只能按 `T000 → T001 → T002 → T010 → T011 → T020 → T021 → T022 → T050 → T040` 执行；T022 每次只产出 disposition/deferred 事实，不执行删除；若需要实际删除、归档或 unregister，必须另开并明确授权 cleanup task。每张卡执行后才可写真实命令、exit、evidence ref/hash、snapshot 和状态；build-plan 不提前填写 completed，也不把本轮修复性验证或本轮 wh-review provider 结果冒充后续实现完成。

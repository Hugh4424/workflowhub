# WorkflowHub 整批治理实施计划

- **阶段**：`build-plan`
- **状态**：草案；plan 只消费一次标准 `wh-review` terminal result，既有 advice 已离线逐项消费；后续 broker 重调用和历史结果只保留为事实，不再触发新的 plan review；本文件不记录 build-code 执行结果。
- **范围**：只处理当前 trusted worktree 内已经盘点的 WorkflowHub 内部运行时、质量事实、review provenance、snapshot/freshness、catalog/bundle、stage runner/bridge、task handle、旧记录和测试维护面。
- **硬边界**：不写原始 checkout，不创建第二 task workspace，不 commit/push/merge/archive/cleanup，不新增 public stage、public gate、第二状态机、第二 writer 或第二 evidence store。
- **当前事实**：工作区路径阻塞已在当前候选 worktree 做过修复性验证；该验证不是本 build-plan 的完成事实，build-code 仍必须按任务卡重新执行并记录。

## 审查失败根因与修复边界

前一次 spec 审查和本次 plan 审查没有正常形成可用结论，不是产品方向不清，而是审查入口和材料绑定同时有缺口：

1. `workspace.mjs` 把已经存在的 linked worktree 再拼成 `basename-target-task` 的第二路径；`stage-runtime` 因此在进入 analyzer 前就 `ENOENT`。现已改为显式 existing workspace、旧 linked-worktree 只读兼容和普通新任务 deterministic 默认三分支。
2. `workflowhub-codex-session-state` 把不同 stage/嵌套 skill 的事件按 Map 插入顺序直接交给 bridge，合法嵌套被误报为时间倒退。现已按请求 stage 投影、按时间排序，并只对同类重叠和部分重叠 fail-loud；这是既有 bridge 的修复，不是新状态机。
3. `wh-review-cli` 原先按 task/stage 无条件复用早期普通结果，材料变了也可能返回旧 finding。现已移除这条早期捷径，复用只由现有 semantic projection、snapshot/tree 和材料-only 变化判定；材料语义变化会产生新的 attempt。
4. 官方 analyzer 的材料根目录是现有 `ArtifactDir` 的 `specs/<taskId>/`，根目录四份文件不是它的消费入口。治理材料必须归一到这个唯一目录，不增加第二材料路径。

已用 focused contract/integration tests 验证上述运行时修复；后续 build-code 仍要在 canonical `specs/<taskId>/` 材料上重跑真实入口。任何旧 `unavailable` 或旧 finding 继续保留为历史事实，不能改写成“从未发生”。

## 1. 决策与简化规则

### 已确认的选择

1. 用户已提供并通过 Git 边界认证的 existing trusted worktree 直接作为当前 Workspace；deterministic path/branch 只保留给新建 workspace 的默认值。
2. `dsh-code-review` 是 verify-code 唯一 canonical `code_review` 执行审查；`wh-review` 使用已有 advisory subject，不能再写同名 canonical completion fact。completion/close 只消费唯一 canonical ref/hash。
3. 旧 record/projection/reader 只有真实消费者才保留最小只读兼容；无消费者且完成归档、负向测试、回滚证明并取得授权后才删除。未知消费者不会被猜成“无消费者”，但也不会继续成为 live owner。
4. 质量事实、stage completion、产品验收和 release 继续沿用现有语义，互不冒充；`unavailable`、`unknown`、`incomplete`、`stale` 和 serious finding 原样保留。
5. host session 的生命周期事件按请求 stage 投影并按时间排序；step 与其嵌套 skill 可以合法重叠，同类事件重叠或部分重叠仍 fail-loud。这是已有 bridge/sidecar 的兼容修复，不是第二状态机。

### F11 简化检查

- Workspace：复用 `task-bootstrap`、`TaskHandle`、`runtime/task/workspace.mjs`；不新增 Workspace 类或 binding store。
- 写入：复用 `TaskKernel`；不新增 quality/evidence writer。
- Review：复用 dsh canonical writer 和 wh-review advisory writer；不新增 review flow。
- Catalog/bundle：catalog 只做已有 projection，closure 只做诊断；不新增 gate。
- 兼容：一个只读兼容边界；删除是条件动作，不是新的 live 状态机。
- 测试：只复用现有 Vitest、closure checker、smoke 和 `npm test`；不添加复杂度计数器。

## 2. 现有表面与唯一职责

| 表面 | 保留/合并/删除 | 唯一 owner | 真实 consumer / oracle |
| --- | --- | --- | --- |
| task bootstrap / Workspace | 收窄复用 | `workspace.mjs` | stage/review bootstrap；Git identity oracle |
| TaskHandle / manifest | 扩展成对字段 | `task-handle.mjs` | workspace resolver；bytes/identity oracle |
| stage runner / bridge | 修正既有 seam | bridge→adapter→runner | stage outcome；task/stage/snapshot oracle |
| canonical quality fact | 保留唯一写入口 | `TaskKernel` | completion/freshness/release consumers |
| verify review | 合并完成语义 | dsh canonical；wh advisory | close 只读 canonical ref/hash |
| material revision / freshness | 保留现有语义 | existing snapshot/freshness owner | review/completion；hash mismatch oracle |
| catalog / bundle / dependency | 修 projection，删 ghost | catalog/closure owner | host/CLI consumer；closure diagnostic |
| old records / readers | 条件只读兼容或删除 | each confirmed reader | consumer census + negative regression |
| 测试 / 交接报告 | 保留事实，不作 gate | existing test/report materials | AC oracle；不等于验收/release |

每个任务卡必须同时写出 owner、consumer、完成 oracle、失败语义、兼容/删除条件和回滚点；没有这些字段的对象不进入实现范围。

## 3. 实施顺序

### Phase P0 — provenance 与当前边界

逐项核对当前 tracked/untracked diff、健康基线、三个 worktree、原始 checkout 只读状态和用户授权。P0 只读，不修改任何候选实现；输出按 `root_role`、`head`、`branch`、`tracked_changes`、`untracked_files`、`authorization`、`owner`、`consumer`、`oracle`、`failure_semantics`、`rollback` 逐项记录，不能只报一个 diff 数。

### Phase P0A — 正常 workspace 路径

用一个 existing/legacy workspace contract 覆盖 task bootstrap、TaskHandle、Workspace、stage-context 和标准 review bootstrap 的真实调用链。新任务唯一由 `tools/cli/task-bootstrap.mjs` 在 `createTask` 时写入 `task.json` 的 `workspace_mode: "existing"` + `workspace_root`；`TaskHandle` 只读认证这两个成对字段，immutable external task manifest 不在运行中回写。旧 linked-worktree manifest 只读兼容；普通新任务仍使用 deterministic 默认。existing workspace 不进入 task-owned cleanup。

### Phase P1 — review 与质量事实归属

验证 dsh canonical `code_review`、wh-review `independent_review` advisory、唯一 ref/hash、serious finding、material revision、snapshot/freshness 和旧 record 读取边界。`dsh-code-review` 的 `execution.code_review.quality_review_ref/hash` 是 canonical bytes 的唯一 producer/绑定入口；stage-runner 认证后由 `TaskKernel` 写入 current fact，completion/close 只读该绑定。wh-review CLI 只返回已有 `review_fact_intent`，subject 固定为 `independent_review`，evidence 为 `quality/reviews/results|attempts` 的 ref/hash，由既有 stage publication 消费。缺失或冲突只 fail-loud 或保留 unavailable，不再生成重复 completion fact。

### Phase P2 — catalog、bundle、旧兼容

按真实 host/CLI consumer 对账 catalog、manifest、stage dependency 和 bundle closure；T020 先输出逐项 consumer census，T021 再输出 closure/projection 对账。T021 只做诊断和非破坏性、可逆的 projection 对账；T022 只产出处置事实，不执行 unregister、delete、archive。任何破坏性清理都必须另开、另授权、可回滚的 cleanup task，不属于本批 build-code 链。未知外部 consumer 只使删除候选延期，不阻塞正常任务路径。

### Phase P3 — 事实交接与测试分层

输出一次性治理对比和分层测试事实：对象/gate/stage/writer/test 数量与职责前后变化、删除/合并/保留/未完成/延期/回滚边界、标准 review provenance、全量 `npm test` 真实结果。任何 focused green、空 findings 或 closure pass 都不写成产品验收/release。T050 同时输出逐 AC evidence matrix 和全量失败分类，避免“有 evidence”掩盖实际未执行或无法归因。

## 4. 测试策略

| 任务对 | 验证命令 | 预期与 oracle |
| --- | --- | --- |
| T001/T002 workspace | `npx vitest run tests/contract/workspace-binding.test.mjs scripts/__tests__/task-bootstrap.test.mjs tests/m15-codex-session-hook.test.mjs` | GREEN 为 0；existing/legacy/默认/错误 root、stage 过滤和生命周期排序可证伪；`ORACLE-WORKSPACE-BINDING-001` |
| T010/T011 review seam | `npx vitest run tests/integration/vnext-official-stage-run.test.mjs tests/final-cutover-guards.red.test.mjs --poolOptions.forks.singleFork --no-fileParallelism` | canonical/advisory、ref/hash、serious finding、unavailable 负例保持；`ORACLE-REVIEW-REF-001` |
| T020/T021 truth/compat | `npx vitest run tests/contract/stage-completion.test.mjs tests/contract/task-handle.test.mjs tests/integration/verify-freshness-selection.test.mjs tests/integration/projection-replacement.test.mjs --poolOptions.forks.singleFork --no-fileParallelism` | identity、material revision、snapshot/freshness、completion/release 分层；`ORACLE-TRUTH-001` |
| T021/T022 catalog/bundle | `npx vitest run tests/skill-provenance-strict.test.mjs tests/contract/spec-stage-artifact-closure.test.mjs tests/requirement-lineage.test.mjs tests/reuse-registry.test.mjs --poolOptions.forks.singleFork --no-fileParallelism` | 真实 consumer/closure 可解释，ghost 不冒充能力；`ORACLE-CATALOG-001` |
| T040/T050 final facts | `npm test`；另运行上述 focused suites | full exit/counts 原样记录；focused 只说明局部 oracle；逐 AC matrix 绑定 current snapshot；`ORACLE-TRUTHFUL-HANDOFF-001` |

RED/GREEN 只在 build-code 执行。若当前候选 diff 已经让 RED 变绿，不制造假失败；把它记为“基线已含候选行为，未执行本计划 RED”，仍不能把 GREEN 外推为交付完成。

## 5. 任务卡与依赖

### T000 — provenance 与授权边界

- **依赖**：无；**状态**：`pending`。
- **owner / consumer**：主代理只读审计；后续 build-code 只消费已明确归属的文件。
- **动作**：逐文件列出当前 diff、来源、授权、owner、真实 consumer、FR/AC、完成 oracle、测试 oracle、失败语义和回滚点；核对 trusted clone 基线、活动治理 worktree、恢复 worktree、原始 checkout。四个根目录通过外部执行输入提供给变量 `WORKFLOWHUB_WORKTREE_ROOT`、`WORKFLOWHUB_TRUSTED_CLONE_ROOT`、`WORKFLOWHUB_RECOVERY_WORKTREE_ROOT`、`WORKFLOWHUB_ORIGINAL_CHECKOUT_ROOT`，不把宿主路径写死进计划材料。先收集 Git 状态，再逐条以 decision-log/spec/plan 和 code/test search 完成 diff mapping；Git 输出只是输入，不能代替 consumer/oracle 证明。
- **输出**：`evidence/build-plan/T000/provenance.json`（每个 tracked/untracked diff 一行，含 `diff_id`、`root_role`、相对路径、HEAD、branch、tracked/untracked 状态、授权、owner、`real_consumer`、`consumer_evidence_ref`、`requirement_refs`、`completion_oracle`、`test_oracle`、`failure_semantics`、`rollback_point`、`disposition`、`evidence_ref`、`evidence_hash`；顶层另含 `mapping_status`、`overlap_conflicts`、`target_file_conflict`；无 diff 的 root 行允许 `diff_id: null`；目标事实由 build-code 产生，build-plan 不伪造）。
- **命令**：`for root in "$WORKFLOWHUB_WORKTREE_ROOT" "$WORKFLOWHUB_TRUSTED_CLONE_ROOT" "$WORKFLOWHUB_RECOVERY_WORKTREE_ROOT" "$WORKFLOWHUB_ORIGINAL_CHECKOUT_ROOT"; do git -C "$root" status --short --untracked-files=all; git -C "$root" rev-parse --show-toplevel --verify HEAD^{commit}; git -C "$root" symbolic-ref --quiet --short HEAD || true; done; git diff --check`；随后逐条以 decision-log/spec/plan 和代码、测试搜索补齐上述 mapping，并保存每条引用/hash。
- **完成 oracle**：当前 snapshot、原始 checkout 只读和每个 in-scope diff 的 requirement/consumer/oracle/test/rollback mapping 可回指；不能证明的字段标 `unknown`，不能用“无输出”代替盘点。只有全部 in-scope diff 完成映射且 `overlap_conflicts=[]`、`target_file_conflict=false` 时，才可写 `mapping_status=complete`。
- **失败/停止补充**：in-scope diff 若仍有 `unknown` 的授权、真实 consumer、完成 oracle、测试 oracle 或回滚点，或存在未解释的目标文件重叠，则 `mapping_status=blocked`，不得进入 build-code 或最终 handoff，不能声称其覆盖完成；不相关且已完整映射的 diff 可继续，不把此检查升级为 public gate。T001/T002/T010/T011/T020/T021/T022/T050/T040 都以 `mapping_status=complete` 为硬前置；这只是任务链输入契约，不新增 public gate。
- **失败/停止**：发现未授权写入、需 reset/clean/prune/对象修复、或无法归属时停止，不修改候选文件。
- **回滚**：不写代码；丢弃本次审计输出即可，不触碰 Git 对象。
- **覆盖**：`FR-GOV-001`、`FR-BRANCH-001`、`AC-011`、`AC-012`。

### T001 — workspace contract RED

- **依赖**：T000；**状态**：`pending`。
- **owner / consumer**：`workspace.mjs`；stage-context、stage-runtime、wh-review bootstrap。
- **动作**：在基线/目标快照上验证 explicit existing、旧 linked-worktree、普通 repo deterministic default、non-Git/symlink/common-dir/registration mismatch、immutable manifest pair、existing cleanup 禁止和 stage-local session projection；对 existing/legacy task 先冻结同一绑定元组：task id、target repo realpath、workspace realpath、Git registration/common dir、当前 symbolic branch 和当前 HEAD/baseline commit。branch/commit 是同一 Workspace/既有 make-decision fact 的认证字段，不新增 manifest、writer 或第二 binding store；stage/skill 嵌套只作为既有 bridge 回归输入，不升级为新的产品 AC 或 public gate。
- **命令**：T001/T002 共用且字节一致的 RED/GREEN 行为命令：`npx vitest run tests/contract/workspace-binding.test.mjs scripts/__tests__/task-bootstrap.test.mjs tests/m15-codex-session-hook.test.mjs`；目标 RED 必须来自行为断言，不能来自 fixture setup。
- **完成 oracle**：能明确复现旧 deterministic 拼接或字段丢失；能用错误 branch、错误 HEAD、错误 path、未注册 worktree 负例证伪绑定；stage/skill 时间投影只验证既有 bridge 不误报；若当前快照已含候选修复，则标 `not_applicable`，不得伪造 RED。
- **失败/停止**：错误 workspace/task/registration/common dir/branch/HEAD 是结构身份错误，必须 fail-loud；session handoff mismatch 仍只作 unavailable；若需要第二 workspace、第二 resolver、新 manifest writer、public gate/state 或放宽 Git 边界就停止。
- **回滚**：不改实现，保留 RED/基线事实。
- **覆盖**：`FR-EXEC-001`、`FR-BOUNDARY-001`、`AC-001`、`AC-004`。

### T002 — workspace contract GREEN

- **依赖**：T001；**状态**：`pending`。
- **owner / consumer**：沿用 `task-bootstrap`、`TaskHandle`、`workspace.mjs`；既有 stage/review consumers。
- **动作**：只在新 task bootstrap 的 `createTask` manifest producer 处成对写入 `workspace_mode: "existing"` + `workspace_root`；认证 real Git toplevel、非 symlink、registration、common dir、symbolic branch 和 current HEAD；legacy direct linked-worktree 只读兼容，并在第一次认证时从同一 Git 检查得到 branch/HEAD，交给既有 make-decision workspace fact 继续绑定；不改写旧 manifest、不新增 binding writer；existing 不进入 task-owned cleanup；bridge 只按 stage 投影并保持既有时间校验；session handoff 只做辅助 provenance，已有其他 task binding 时返回 `unavailable`，不阻塞显式 task/workspace；不增加 stage/gate/state/writer。
- **命令**：RED/GREEN 共用且字节一致的行为命令：`npx vitest run tests/contract/workspace-binding.test.mjs scripts/__tests__/task-bootstrap.test.mjs tests/m15-codex-session-hook.test.mjs`，覆盖正确/错误 branch、正确/错误 HEAD、错误 path 和 legacy manifest；T002 再运行 supplemental `node tools/cli/stage-runtime.mjs doctor --action=workspace --stage=build-plan --project=WorkflowHub --task=workflowhub-batch-governance-20260824`，确认 official stage 入口返回当前 worktree、baseline 和 `materials: working`；再运行 supplemental `npx vitest run tests/integration/vnext-official-stage-run.test.mjs tests/contract/spec-stage-artifact-closure.test.mjs tests/contract/workspace-binding.test.mjs scripts/__tests__/task-bootstrap.test.mjs tests/m15-codex-session-hook.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`，由 fixture/manual cases 覆盖四份 canonical 材料正常读取、旧 root copy 只读、单份材料缺失和 material revision/snapshot stale。标准 `wh-review` 只作为一次独立计划审查事实，不属于 T002 GREEN/AC-001 oracle，provider terminal status 不作为 workspace pass/fail。
- **完成 oracle**：返回用户指定 worktree，且 task/workspace/registration/common dir/branch/HEAD 绑定元组可回指；不猜第二路径；四份 canonical 材料正常读取，旧路径不会覆盖或替代 current material，缺失/stale 给出可定位的 unavailable/stale 原因；stage-context、stage-runtime 到达各自后续处理；standard wh-review 只作为独立 review fact，不是 T002 GREEN；错误身份明确失败；`task.json` 不在运行中被改写。
- **失败/停止**：路径、task、stage、材料或 Git/workspace identity 失配必须 fail-loud；session handoff 冲突只记录 `unavailable` 并继续显式 task；不能静默 fallback 到第二路径。
- **回滚**：只回退 T002 授权的 `task-bootstrap`、TaskHandle、workspace、bridge/session projection 和 contract tests；不改 task storage/.git。
- **覆盖**：`FR-EXEC-001`、`FR-EXEC-002`、`FR-BOUNDARY-001`、`FR-HANDOFF-001`、`AC-001`、`AC-002`、`AC-004`、`AC-010`。

### T010 — review ownership RED

- **依赖**：T002；**状态**：`pending`。
- **owner / consumer**：dsh stage outcome 是 canonical owner；completion/close/release 是 consumer；wh-review 只 advisory。
- **动作**：用 `execution.code_review.result`、`execution.code_review.quality_review_ref/hash`、`dsh-code-review` skill id、task/stage/snapshot/material revision、serious finding 和同名旧输入负例锁定双链冲突；验证旧 `code_review` advisory 输入只能降级为 `independent_review`，不能成为 canonical。
- **完成 oracle**：能证明两个同名 `code_review` 不能同时成为 completion truth；当前已有候选行为时不制造假 RED。
- **失败/停止**：找不到唯一 canonical consumer，或需要第二 writer/subject 才能表达时退回 make-decision。
- **回滚**：不改历史 review record；保留原始 finding/provenance。
- **覆盖**：`FR-REVIEW-001`、`FR-CONTROL-001`、`AC-003`、`AC-005`、`AC-006`。

### T011 — review ownership GREEN

- **依赖**：T010；**状态**：`pending`。
- **owner / consumer**：dsh 写 canonical stage outcome；stage-runner 认证；`TaskKernel` 是 current fact 唯一 writer；completion/close 只读 canonical `quality_review_ref/hash`。wh-review CLI 写已有 `independent_review` advisory intent，`publishReviewFactIntent` 认证 `quality/reviews/{results|attempts}` 的真实 bytes/ref/hash。
- **精确文件 / API**：`runtime/task/task-kernel-implementation.mjs:publishVNextQualityFact`；`runtime/stage/stage-agent-outcome-adapter.mjs:publishStageAgentOutcome`；`runtime/stage/stage-runner.mjs:publishOfficialStageOutcome/runOfficialStage`；`runtime/stage/stage-handlers.mjs:addCompletion`；`runtime/evidence/quality-store.mjs`（legacy reader/writer boundary）；`runtime/evidence/canonical-evidence-validators.mjs`；`skills/wh-review/scripts/wh-review-cli.mjs:publishStageReviewFact`；consumer tests at least `tests/integration/vnext-official-stage-run.test.mjs`, `tests/final-cutover-guards.red.test.mjs`, `tests/integration/projection-replacement.test.mjs`。
- **动作**：收敛 `quality_review_ref/hash`、`review_fact_intent` 和 advisory provenance；先重新核对现有 `skills/wh-review/contracts/verify-code.md` 与 `skills/wh-review/scripts/wh-review-cli.mjs`，确认已有 advisory subject=`independent_review`、dsh canonical subject=`code_review`；若现有 subject 不同，按实际既有 schema 更新本计划后停止实现，不新增 subject/object。保留 serious finding；同 bytes replay 幂等，冲突 bytes fail-loud；逐项覆盖缺失、冲突、stale、unavailable、同名结果。
- **完成 oracle**：canonical ref/hash 唯一且字节可验证；advisory 不再冒充 `code_review`；unavailable/major/serious 不被 clean 覆盖。
- **失败/停止**：hash、snapshot、material revision、task/stage 不匹配时不写 current fact，不删除历史；同一 payload bytes 的并发 replay 只能产生一个 current fact，异 bytes race 必须返回既有冲突语义并保留两边原始 provenance；测试必须覆盖原子幂等、冲突、stale、serious finding 和 unavailable。
- **回滚**：恢复到本 phase 变更前的既有 owner；历史 records 只读保留。
- **覆盖**：`FR-REVIEW-001`、`FR-TRUTH-001`、`AC-005`、`AC-006`、`AC-009`。

### T020 — truth/freshness 与 consumer census

- **依赖**：T011；**状态**：`pending`。
- **owner / consumer**：既有 material revision/snapshot/freshness owner；completion/release 与 review consumers。
- **动作**：对齐 `quality_fact_intent`、material revision、snapshot identity、freshness、旧 record/projector/reader；列出每个 reader 的 owner、consumer、oracle、失败语义和删除条件。为 AC-005 单独记录 history/freshness unavailable、unknown、incomplete、stale 的实际场景、普通任务继续条件和不得改写为 pass 的 oracle；history 缺失不阻塞有效 workspace/core-material/write-boundary 路径。
- **精确 surface / 来源**：`quality/verify.json` → `runtime/task/task-store.mjs` 的 bootstrap/status/public-behavior/per-AC readers；legacy `quality-store` → `runtime/evidence/quality-store.mjs` 的 mini-task/legacy readers；v1/v2 fact collector → `runtime/evidence/fact-collector.mjs` 与 monitoring/fact-index readers；旧 attempt refs → `runtime/task/task-handle.mjs:listStageAttemptRefs` 及 freshness reader；旧 review path → `tests/integration/verify-freshness-selection.test.mjs` 及其实际调用者。逐项追加 T020 census 未列出的真实 exact surface，不用目录存在或单个测试名称替代 consumer 证明。
- **输出**：`evidence/build-plan/T020/consumer-census.json`；每项必须含 `surface`、`reader`、`source_ref`、`owner`、`real_consumer`、`consumer_evidence_ref`、`requirement_refs`、`completion_oracle`、`failure_semantics`、`compatibility_boundary`、`archive_ref`、`deletion_condition`、`negative_test_ref`、`rollback_point`、`evidence_ref`、`evidence_hash`、`disposition`。
- **完成 oracle**：current/history、quality/completion/release、stale/unavailable/incomplete 可区分；同一 current fact 不被第二 writer 覆盖；每个 exact surface 都有代码调用、manifest/catalog、CLI/host 或测试来源和真实 consumer 证据；删除后的负向读取/不可用 oracle 已绑定，census 能逐项回指 reader 和测试。
- **失败/停止**：缺 identity/ref/hash 或存在真实 consumer 未知时只读保留，不猜删除。
- **回滚**：只回滚本 phase 已授权映射/reader 变更；保留 census 与历史记录。
- **覆盖**：`FR-EXEC-002`、`FR-TRUTH-001`、`FR-COMPAT-001`、`AC-002`、`AC-004`、`AC-007`、`AC-009`。

### T021 — catalog/bundle 与 projection 对账

- **依赖**：T020；**状态**：`pending`；**不是删除任务**。
- **owner / consumer**：catalog/manifest/closure owner；真实 host/CLI/stage consumer。
- **动作**：只做 catalog、skill dependency、bundle closure、stage runner/handle/bridge 之间的诊断和非破坏性、可逆 projection 对账；精确核对 `skills/catalog.yaml`、`workflows/*/skill-deps.yaml`、`skills/wh-review/stage-skill-plan.json`、各 `skills/*/skill-bundle.json`、`tools/cli/stage-runtime.mjs`、`skills/wh-review/scripts/wh-review-cli.mjs`、`tools/host/workflowhub-stage-agent-bridge.mjs`；把 `requirement-lineage`、`qa-only/verify-change`、`resolving-merge-conflicts` 等 inventory 标出的 ghost candidate 逐项追到 manifest/host/CLI/test 来源；只消费 T020 census，不凭猜测 unregister、delete 或 archive；把需要后续授权的 exact surface 交给 T022 做 disposition-only 记录。
- **输出**：`evidence/build-plan/T021/catalog-closure.json`；每项含 `surface`、`source_ref`、`owner`、`consumer`、`consumer_evidence_ref`、`dependency_path`、`bundle_path`、`closure_oracle`、`negative_test_ref`、`rollback_point`、`failure_semantics`、`live_or_ghost` 和 `T022` 处理引用。
- **完成 oracle**：每个保留 surface 有真实 consumer；每个 ghost candidate 有 manifest/catalog/stage/host/CLI/test 来源对账；closure/doctor 只产诊断；T021 只负责 projection/closure 事实，未知 consumer 不会让普通任务路径停住；任何 T021 correction 都能按原 bytes/引用回滚，且不会在 T022 proof 前移除注册关系。
- **失败/停止**：closure/consumer 事实缺失时标 `unknown` 并保留最小只读兼容；T021 不得 unregister、delete、archive 或断开旧 reader；不把删除动作塞进本卡，也不阻塞 T022 的事实处置或普通业务路径。
- **回滚**：只回退本卡非破坏性 projection 对账；任何删除、归档、unregister 的 proof、archive bytes 和恢复动作必须由另一个明确授权的 cleanup task 管理，不属于 T021/T022；不 reset/clean/prune。
- **覆盖**：`FR-CATALOG-001`、`FR-COMPAT-001`、`FR-CONTROL-001`、`AC-003`、`AC-007`、`AC-008`。

### T022 — 旧表面处置事实（本批不执行删除）

- **依赖**：T021；**状态**：`pending`；**本卡只产出处置事实，不删除、归档、unregister 或改变运行时；是 T050/T040 的事实前置，但不是 public gate 或普通业务阻塞。**
- **owner / consumer**：T020 census 与 T021 closure 的治理执行者；T050 消费 disposition，后续独立 cleanup task（若获授权）才消费删除候选；无消费者旧表面本身不是 live consumer。
- **动作**：逐项写出 `retain_read_only`、`delete_candidate` 或 `deferred`。只有 census 明确 `real_consumer: none` 且 closure/negative test/rollback/授权证据齐全时，才可标 `delete_candidate`；存在真实或未知 consumer、证据不足或外部 consumer 未绑定时标 `retain_read_only` 或 `deferred`。本卡不执行任何 destructive operation。
- **输出**：`evidence/build-plan/T022/disposition.json`；每项含 `surface`、`census_ref`、`closure_ref`、`real_consumer`、`disposition`、`missing_proof`、`negative_test_ref`、`rollback_point`、`authorization_ref`、`compatibility_path`、`evidence_ref`、`evidence_hash`。
- **完成 oracle**：每个 inventory surface 都有唯一 disposition、owner、consumer、证据和失败语义；`delete_candidate` 只能证明“具备另开 cleanup task 的条件”，不能写成已删除；未知 consumer 保留最小只读兼容；T050 消费本卡事实，不能把 T021 closure pass 当成删除覆盖。
- **失败语义**：任何证明缺失都标 `deferred`/`retain_read_only`，不伪造“无消费者”，不阻塞 T050/T040 的正常交接；若需要本卡直接删除，停止并退回授权边界。
- **回滚**：本卡只写 disposition evidence；丢弃该 evidence 即可，不改代码、历史记录、task storage 或 `.git`。真实删除、归档、unregister 和恢复必须在另一个明确授权的 cleanup task 中完成。
- **覆盖**：`FR-COMPAT-001`、`AC-007`、`AC-008`。

### T040 — truthful handoff 与一次性治理报告

- **依赖**：T050；**状态**：`pending`。
- **owner / consumer**：`runtime/stage/stage-handlers.mjs:addCompletion` → `runtime/evidence/stage-completion-facts.mjs:buildStageCompletion` 生成 `completion.confirmation_summary`；`tools/cli/stage-runtime.mjs` 的 `run --action=execute` 返回该 completion；host consumer 是外部 Codex desktop task message（无仓内渲染模块时显式记录 external host boundary），并用人工可见检查验证。报告只作为交接材料，不新增 UI/store。
- **精确文件**：`runtime/stage/stage-handlers.mjs`、`runtime/evidence/stage-completion-facts.mjs`、`tools/cli/stage-runtime.mjs`、`tools/host/workflowhub-codex-session-state.mjs`；外部 host/UI consumer 若没有可回指模块，记录 `external_host_consumer` 和 `visibility_check_ref`，不得凭文件存在宣称可见。
- **宪法同步 owner / consumer**：同一治理交接卡负责 `CONSTITUTION.md` 与 `constitution-checklist.md` 的 F11 additive synchronization；consumer 是仓库宪法和 checklist 使用者；不得改写 F1-F10、Q1-Q3、S1-S8 或旧编号。
- **动作**：生成一次性前后对比：对象、gate、stage、writer、测试数量、职责、删除/合并/保留/未完成/延期/回滚；先按 additive 规则核对/同步 `CONSTITUTION.md` 的 F11 和 `constitution-checklist.md` 的 F11 勾选/判据，确认 F1-F10、Q1-Q3、S1-S8 与旧编号未被改写；再识别真实 host/UI consumer（不能只假定“当前 Codex task 消息”可见），用现有 host 的人工可见路径核对 `completion.confirmation_summary` 与用户可见 task handoff 一致，包含目标、范围、非目标、成功标准、风险、review 限制、未决和延期；字段映射固定沿用现有对象：`goal`←`renderUserCompletion.objective`+`confirmation_summary.scope`，`success_criteria`←`verification.conclusion`+`confirmation_summary.tests`+`expected_impact`，`review_limits`←`review.conclusion/providers/findings/refs`+`review_advice`+`verification.limits`，`unresolved`←`missing_items`+`audit_gaps`+`risks`，`deferred`←`confirmation_summary.deferred`，`user_action`←`user_action`，`next_boundary`←`next_stage_boundary`；只允许在 `runtime/evidence/stage-completion-facts.mjs:renderUserCompletion/assertCompletionViewsConsistent` 内补齐已有投影，不能新建对象、store 或 writer。AC-005 同时披露 provider、history/freshness、catalog/bundle、auxiliary evidence 的不可用/未知/未完成事实及普通任务继续条件。
- **完成 oracle**：`CONSTITUTION.md` 与 `constitution-checklist.md` 都有 F11，且 diff 证明只新增/同步 F11；上述仓内 producer/CLI 路径产生完整字段，并有 external host consumer 的人工可见检查，证明用户实际能看到目标、范围、风险、审查限制、未决和延期；若 external host consumer 或 visibility check 不存在，AC-010 必须是 `incomplete`/`deferred`，并退回 make-decision 记录“缺少现有可见投影”，不能把 deferred 当成完成；报告没有把 focused green、空 findings、stage ready 或 provider transport success 写成验收/release；不新增 communication store。
- **失败/停止**：host 无法表达或无法证明完整交接时只停止“完成/交付声明”，不阻塞普通修复路径；将 AC-010 标为 `incomplete`/`deferred`，回交接材料，不新增 communication store。
- **回滚**：只重写本次交接摘要，保留原始 test/review/evidence bytes。
- **覆盖**：`FR-HANDOFF-001`、`FR-REPORT-001`、`FR-TRUTH-002`、`FR-GOV-001`、`AC-003`、`AC-010`、`AC-011`、`AC-012`。

### T050 — current snapshot 测试与交接收口

- **依赖**：T022；**状态**：`pending`。
- **owner / consumer**：现有 Vitest/closure/smoke/`npm test`；用户交接，不是 release gate。
- **动作**：先跑 focused suites，再跑一次 `npm test`；只读取本 task 之前已经生成的标准 `wh-review` attempt/result/report 引用，不重新调用 broker、不 continuation、不做 format-correction retry；没有终态就记录 `unavailable`/`incomplete`、原 attempt ref 和 error code。记录实际 exit、失败数、失败文件、分层、覆盖限制、review terminal status、未完成/不可用和回滚方案。输出 `evidence/build-plan/T050/ac-evidence-matrix.json`（这是交接报告，不是第二 evidence store）。每个 AC 行必须含 `ac_id`、`applicable`、`scenario`、`oracle`、`command_or_manual_steps`、`actual_result`、`status`、`snapshot_tree`、`material_revision`、`evidence_ref`、`evidence_hash`、`limitation`、`deferred_reason`；AC-005 必须分别披露 provider、history/freshness、catalog/bundle、auxiliary evidence 四类状态和普通任务继续条件；AC-007/AC-008 另必须含 `deletion_ref`、`census_ref`、`closure_ref`、`archive_ref`、`negative_test_ref`、`rollback_point`、`authorization_ref`、`disposition`，并消费 T022 的 disposition/deferred facts；若 `disposition=delete_candidate`，`deletion_ref` 只引用候选事实，不得声称实际删除。
- **失败分类**：全量失败按 `governance`、`implementation`、`external_dependency`、`environment`、`not_executed`、`unknown` 分类；每类保留失败文件、exit 和原始输出 ref/hash，不能把未执行、未知或环境失败改写成 pass。
- **完成 oracle**：所有 applicable AC 都有 current-snapshot evidence 或明确 deferred；AC-005 的四类 unavailable/unknown/incomplete/stale 必须保持原状态，不能改写成 pass；T022 已确定的 disposition/deferred 事实必须出现在 AC-007/AC-008 行；若 T022 异常未产事实，这两项必须 `incomplete` 并停止 handoff completion claim；T050 先形成事实，T040 再汇总最终 handoff；没有 host visibility evidence 时 AC-010 必须 `deferred`/`incomplete`；全量失败保持真实且可分层；不宣称 product acceptance/release。
- **失败/停止**：输出缺 current identity、严重 finding 被省略、full failure 被清零、或测试需要新增 gate/state/store 时停止。
- **回滚**：保留原始输出，只修正交接摘要；不重复全量重跑掩盖失败。
- **覆盖**：全部 `FR-*` 的最终事实绑定；`AC-001`～`AC-012`。

## 6. 依赖图

```text
T000 → T001 → T002 → T010 → T011 → T020 → T021 → T022 → T050 → T040
```

- 无循环依赖。
- T021 是必须的 projection/closure 事实；T022 是必经的事实处置卡：有完整 proof 才标记 `delete_candidate`，否则 `retain_read_only`/`deferred`；它不执行破坏性清理，不是 public gate，也不阻塞普通业务路径。删除、归档、unregister 另需用户授权的 cleanup task。
- 每个 RED/GREEN pair 共享同一命令和 oracle；事实任务不伪造 RED/GREEN。
- 任何外部 consumer unknown、provider unavailable 或 baseline failure 都进入交接事实，不改变 public stage 数量。

## 7. FR/AC 双向追溯

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

## 8. 真实风险与延期边界

- 当前候选 code diff 的来源/授权仍由 T000 认证；在此之前不把它写成产品实现、不删除、不提交。
- T022 只记录已经完成证明的无消费者旧表面候选；未知/真实 consumer 继续使用最小只读兼容，但不成为新的 live owner。实际删除、归档、unregister 不在本批。
- provider unavailable、历史测试失败、stage outcome 不完整、snapshot/material stale 和 serious finding 都保留原状态；它们是必须被交接矩阵如实分类的事实，不是本计划留下的“接受风险”。
- 本计划不保留“workspace 需要第二 deterministic path”这一旧风险；T002 的完成 oracle 专门验证它已消失。

## 9. 回滚与授权

- 只允许回退本 task 明确归属且用户授权的 exact files；不使用 `git reset --hard`、`git clean`、`git prune`。
- commit、push、merge、archive、cleanup、删除旧 worktree/分支和修复原始 checkout 对象都不在本计划授权内。
- 若任一文件无法绑定到 FR/AC、owner、consumer、oracle、失败语义和回滚点，停止并交回用户；不靠新增 gate 或新对象补洞。

## 10. Constitution Check

- F1/F2/F6：复用 TaskKernel、Workspace、stage runner 和已有 canonical ref/hash；不新增 owner。
- F3/F4/Q1/Q2/Q3：review/test/evidence 是事实或 advice；严重 finding、unavailable、stale 和 full failure 可见。
- F5/F8/F10/F11：不新增 public gate/stage/state/writer/store；正常路径优先，辅助 projection 缺失不阻塞普通修复。
- F7/F9：用户确认、提交授权、原始 checkout 隔离、失败和未完成事实保持可追溯。
- S1～S8：复用现有 Node/Vitest/closure/skill bundle/host 边界，不增加第二 agent control layer。

## 11. Build-code 交接

build-code 只能按 `T000 → T001 → T002 → T010 → T011 → T020 → T021 → T022 → T050 → T040` 执行；T022 每次只产出 disposition/deferred 事实，不执行删除；若需要实际删除、归档或 unregister，必须另开并明确授权 cleanup task。每张卡写回真实命令、exit、evidence ref/hash、当前 snapshot 和未完成事实。build-plan 的草案状态不能被提前改成 completed，不能把本轮修复性验证或本轮 `wh-review` provider 结果冒充后续实现完成。

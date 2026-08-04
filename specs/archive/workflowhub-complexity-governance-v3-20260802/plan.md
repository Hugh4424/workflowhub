# 实现计划：WorkflowHub 复杂度治理 V3.2

- **Input**：`decision-log.md`、`spec.md`、原始方案 SHA-256 `de3938ce359d281a46da5075ccc1097dcb4b4ef86960aa5544037498d3e7ad59`
- **Status**：当前修订候选；审查结果以 canonical review fact 为准，待用户确认
- **Template version**：`plan-task.v3`

## 速读卡

- **Goal**：完整实现 V3.2，并把整个 WorkflowHub 从重复状态机、重复目录和无 consumer 文件收敛为五阶段、四材料、七行为、质量事实和两个发行边界。
- **Non-goals**：不删除五阶段、真实独立审查、质量证据、三处业务确认、独立不可逆授权、Skill Bundle 或 Local Runner；不迁移历史 task；不自动 close。来源：`specs/workflowhub-complexity-governance-v3-20260802/spec.md`、原始 V3.2 SHA-256 `de3938ce359d281a46da5075ccc1097dcb4b4ef86960aa5544037498d3e7ad59`。
- **Before**：1125 个 tracked 文件；`specs/archive/` 447 个文件；`skills/` 166 个文件；`tests/` 105 个文件；`runtime/` 与 `core/` 职责重叠；旧 lineage 仍有生产消费者。
- **After**：每个 tracked file 有唯一 owner/consumer/disposition；无 consumer 的 skill、spike、migration、旧状态机、重复 schema/test/docs 删除；保留能力通过 baseline、focused tests、E2E、mutation、full suite 和 clean install 证明。
- **Main risk**：动态 consumer、唯一负向 oracle 或历史质量资料被误删。

## Technical Context

Node.js 24、ESM、Vitest；TaskHandle 提供受控 task namespace 和原子写。基线固定为 `main@c3e1b1c5b29e5c0aa35beca7718787b4c7a95faf`。候选实现位于本任务隔离 worktree。五个 stage、七类公开行为、Skill Bundle、Local Runner、独立审查、三处业务确认和独立不可逆授权必须保留。

### Global Constraints

- 四份当前材料是唯一工作真相；质量事实决定完成质量，不控制普通编辑或同任务修复。
- 先记录 baseline 原始行为，再改 writer；先切新写路径并证明，再垂直删除旧机制；不保留双写、importer 或长期兼容 reader。
- 历史 task 只读。实施前后对同一历史清单计算内容摘要，任何写入立即停止。
- 正式写入继续验证 task、workspace、write set、content hash；失败必须零部分写入。普通材料编辑不受该门约束。
- review `unavailable`、stale、失败和 serious finding 保持真实；不得改写为 PASS。
- 复杂度和 inventory 仅诊断。超预算产生人工复盘项，不阻塞业务 stage。
- 不执行 commit、push、merge、archive、cleanup；这些需要 verify-code 之后的独立授权。

T028/T029 是本次 plan 修订中补录的历史 bridge remediation 槽位：现有 T003/T004 的历史 receipt 时间不代表本轮执行顺序，也不把未完成的 T029 伪装成已完成；从本计划重新执行时，必须按 T028→T029→T003 串行落账。

任何已在 candidate tree 存在 GREEN 实现的补录 RED，都必须在 disposable copy 中应用该 slice 的 path-bound inverse diff，记录独立 exit 1 receipt/hash 后销毁 disposable copy，再在 fixed candidate tree 重跑 GREEN；不得回退 candidate、覆盖既有 receipt，或以共享上游 receipt 代替当前任务证据。T003 同样遵守该规则。

RED task 的独立 receipt 直接复用现有 task/phase receipt 形状；补录 RED 只追加 `red_task_id` 与 `inverse_patch_hash`，并保留既有 `gate_cmd`、`exit_code`、`output_ref`、`output_hash`。这两个字段是 RED→inverse patch→GREEN 的永久 provenance，T017 只在最终汇总中引用，不改写或删除既有 receipt。不新增专用证据对象或 CLI。

### Ownership boundary

每个任务都声明 `implementation_owner` 与不同上下文的 `verification_owner`。实现者可以产出测试事实，但不能裁决自己的删除证明、baseline 差异、历史零改动、最终 AC 覆盖或架构审查。`approval_owner` 固定为用户，只在 build-plan、verify-code 和独立 close 边界出现。

跨 Phase 的实现文件按单一 owner 表归属；后续任务只能在已登记 owner 的文件上追加本阶段子范围，并由 gate-only 读取前序事实：`runtime/stage/completion-predicates.mjs` 依次由 T004（初始谓词面）、T008（build/verify 谓词）和 T023（receipt/exit 校验）负责；`core/stage-runner.mjs` 依次由 T006（vNext publication）、T019（review remediation）和 T023（最终质量/退出校验）负责；`core/task-kernel-implementation.mjs` 由 T006 负责 vNext seam、T019 负责存活 legacy writer 的 fault/concurrency 修复，T012 只执行登记的 MOVE；`scripts/stage-runtime.mjs` 依次由 T006（stage cutover）、T008（facade/E2E）负责，T012 只执行登记的 MOVE；`runtime/task/material-workspace.mjs`、`runtime/task/task-store.mjs`、`runtime/evidence/quality-store.mjs` 依次由 T004（最小 writer）、T023（最终质量/存储校验）和 T012（Phase 6 KEEP successor 吸收子范围）负责，T012 不重写 T023 已固定的质量/存储语义。任务的 `精确文件` 是可写集合，`boundary` 仅作关注范围；未标注 `gate-only/read-only` 的 boundary 不得解释为写授权。

共享文件子范围继续受唯一 owner 表约束：`skills/wh-review/scripts/review-materials.mjs` 由 T019 只改 unavailable 状态映射、由 T022 只改逐 AC map/Phase gate；`skills/wh-review/skill-bundle.json` 由 T019 负责 Phase 3 packet/hash，T013 负责 Phase 6 MERGE 后 hash 同步；`tests/integration/atomic-write-faults.test.mjs` 由 T003 负责原子 writer 基线、T020 负责 legacy fault/concurrency RED、T026 负责质量/存储故障注入，其他任务只 gate-only；`tests/integration/vnext-official-stage-run.test.mjs` 由 T005 负责 vNext publication、T020 负责 review RED、T026 负责 fake-pass/质量事实，其他任务只 gate-only；`tests/contract/material-workspace.test.mjs` 由 T003 负责材料契约、T026 只追加 export/no-consumer RED；`tests/contract/execution-identity.test.mjs` 由 T003 负责 `identity:normal-edit-not-blocked` RED、T007 负责 `identity:dirty-worktree` RED，T004/T008 只 gate-only；`tests/contract/legacy-zero.test.mjs` 由 T009 负责 topology/recovery/pointer/phase、T010 负责 review/journal/projection、T013 负责 skill/config/术语归零，T012/T014/T015/T017 只 gate-only；`docs/architecture/move-map.json` 由 T002 负责 Phase 0 冻结、T012 负责 MOVE 前后 hash、T015 负责最终 disposition；`docs/architecture/repository-inventory.tsv`、`tools/architecture/inventory.mjs`、`tools/architecture/complexity-report.mjs` 由 T002 负责基线、T015 负责最终刷新，其余任务只 gate-only；`skills/wh-review/scripts/__tests__/phase-review-subject.test.mjs` 由 T028 负责 bridge RED、T009 负责 replacement/deletion proof，T029/T010 只 gate-only；`tests/build-code-phase-evidence.test.mjs` 由 T028 负责 bridge RED、T009 负责 replacement/deletion proof，T029/T010 只 gate-only。每项子范围都必须记录在对应 evidence receipt，不能把共享测试文件的整文件写权限扩大成跨任务 owner。

## 代码锚点

AC-021 的唯一 final discharge owner 固定为 T023（质量事实/存储完整 gate）；T003/T004/T010/T011/T022/T028/T029 只提供材料、review、history 或 bridge 子范围并标记 matrix-only，不得重复关闭 AC-021。

- `scripts/stage-runtime.mjs`：七行为 public facade 与正式 stage 调用入口。
- `core/stage-runner.mjs`、`core/task-kernel-implementation.mjs`：当前 legacy attempt writer/vNext 断点。
- `runtime/task/`、`runtime/evidence/`、`runtime/stage/`：目标 task/material/fact/publication 深模块。
- `runtime/review/`、`skills/wh-review/`：真实审查与待删除 review control lineage 的边界。
- `workflows/*/SKILL.md`、`steps.json`、`skill-deps.yaml`：五阶段正式合同。
- `docs/architecture/move-map.json`：目录迁移唯一事实；本次所有 MOVE 必须登记。
- `specs/archive/`、`workflows/_spike/`、`tools/cli/migrate-task-v2.mjs`、`config/runtime-fact-v2-sources.mjs`：全仓审计必须明确 KEEP/REMOVE/ARCHIVE 的高概率简化对象。

## 方案设计

### Public behavior baseline

`tests/fixtures/public-behavior-baseline/v1/` 保存 manifest、七类行为的 raw/normalized 样本和比较结果。采集器必须为每类行为建立独立隔离环境，并执行真实固定 action；禁止用同一个未知 action 作为七类 probe。固定 case 至少覆盖：doctor workspace check + `make-decision` stage + fixed task，并保留 worktree-to-baseline-commit relationship；同一 task 连续两次 status（比较 run sequence、workflow ID 一致性、write namespace 和重复调用语义）；run scope 与新 task execute；review 确定性 unavailable 与 `triggered=false`；verify 成功测试与非零退出；confirm 合法 attempt 与错绑 attempt；authorize 精确 confirmation ref 与缺失/错绑 confirmation。无法构造合法正例时必须同时保留明确的失败类别和原因，不能把统一的 facade 解析错误当作行为证据。采集器固定 argv、输入、隔离 HOME/task storage/workspace、Runner 与 baseline commit；manifest 还必须绑定 collector hash、Node 版本、平台、Runner contract、输入 hash、原始 stdout/stderr hash、normalized hash，以及逐项带内容 hash 的 write set；只 token 化时间、UUID、临时/绝对路径、耗时等噪声。比较结果只允许 `preserved`、`approved_internal_change`、`approved_bug_fix`、`behavior_regression`。`run` 的 legacy-writer 错误固定为已知缺陷，修复分类为 `approved_bug_fix`。

唯一 CLI 合同：`capture --baseline=<oid>` 真实采集，`verify --baseline=<oid>` 重算并校验，`compare --baseline=<oid> --candidate=<worktree|tree-oid>` 逐行为比较；`--candidate=worktree` 绑定当前候选 worktree 的实时文件快照，不解析为 `HEAD`，实现必须输出候选 snapshot hash；显式 candidate tree oid 与 baseline oid 相同必须以 `candidate_equals_baseline` 非零退出。collector 不把公开入口路径写死为单一版本：baseline commit 通过 baseline tree 中的 `scripts/stage-runtime.mjs`，candidate worktree/tree 通过其当前公开 Runner/CLI contract 解析（T012 MOVE 后为 `tools/cli/stage-runtime.mjs`），固定 argv、环境和行为身份不变；T012 的 move-map/consumer proof 必须登记该 collector 为 gate-only consumer。参数只接受 `--name=value`，成功 exit 0，采集/绑定/行为回归 exit 非零。

`verify-final-coverage.mjs` CLI 合同：只接受 `--require-ac=<n>`（本方案固定 `n=43`）、`--require-same-review-tree`、`--require-review-raw-hash`、`--require-reference-clean`、`--governance`、`--handoff`，不接受未知参数；exit 0 仅当 AC 数量、逐条 evidence ref/hash、review tree/raw hash、reference clean、治理与交接要求全部满足，否则分别保留 `missing_ac`、`ac_evidence_unresolvable`、`ac_evidence_generic_fill`、`review_tree_drift`、`review_raw_hash_missing`、`reference_consumer_residual`、`constitution_version_drift`、`constitution_revision_drift`、`constitution_mapping_drift`、`checklist_count_drift`、`checklist_entry_drift`、`final_evidence_binding_drift`、`handoff_incomplete` 和 `unknown_argument` 非零失败类别。

`--require-same-review-tree` 的 scope 明确排除 `specs/workflowhub-complexity-governance-v3-20260802/tasks.md` 全文件；wh-review 仍审查完整 tasks.md，实施状态回填属于排除域，不触发 `review_tree_drift`。

merge 授权的 final evidence refs/hash 绑定由 `verify-final-coverage.mjs --handoff` 同时校验；缺失、错绑或漂移统一输出 `final_evidence_binding_drift` 非零。T016 GREEN 的 `--handoff` 只绑定 AC-043 的四项交接 refs/hash：`evidence/final/deletion-list.json`、`evidence/final/retention-list.json`、`evidence/final/m14-m17-impact.md`、`evidence/final/change-summary.md`；T017/T018 之后的最终 `--handoff` 才绑定全部已生成的 `evidence/final/**` 产物及其 refs/hash。T030 RED 必须分别覆盖这两个范围的缺失、错绑和漂移，T016 负责前一范围 GREEN，T018 只消费最终范围事实，不把 `evidence/final/**` 被排除在 tree hash 外解释成无需绑定。

baseline 只冻结七类公开语义、exit code、错误类别与用户可见写集合。`status` 的 run 序号、同次 workflow ID 一致性、写入 namespace 和重复调用语义是 spec 明确要求保留的语义字段：只 token 化 UUID/绝对值并比较一致性；旧 attempt/accepted/receipt ref、checkpoint 和 confirmation lineage 只进入 `legacy_diagnostic`，候选比较忽略这些内部控制对象。

### Current materials

工作树只保留 `specs/<task>/decision-log.md`、`spec.md`、`plan.md`、`tasks.md`。缺失或不可读即时派生 `not_ready`；齐全即可继续修复。材料替换原子完成，不产生 current pointer、revision lineage 或 accepted projection。

### Task facts and quality

新 task_dir 固定为 `task.json`、`facts.jsonl`、`quality/reviews/`、`quality/tests/`、`quality/verify.json`、`index.json`。事实追加且不可覆盖；单事实可保留 source/hash/provenance，但不得有 parent、previous、generation、selector、successor。大 raw 输出可写只读 archive，task index 最低字段固定为 `task_id`、`logical_ref`、`content_hash`、`schema`、`version`、`related_task_id`、`external_raw_ref`、`external_governance_archive_ref`。

单条 fact 的最大字段集合冻结为：`task_id`、`stage`、`material_digest`、`source_digest`、`invocation_id`、`source`、`status`、`content_hash`、`created_at`、`output_ref`。禁止 `parent_ref`、`previous_ref`、`root_result`、`flow_head`、`generation`、`superseded`、`successor`、`predecessor`、`selector`、`checkpoint`、`reopen_ref`、`rebind_ref`、`continuation_ref`。

切换后的业务 task runtime 所读写的 `tasks.md` 执行行固定为 `id/stage/status/owner/key paths/command/result/evidence/next`，每个 task 只有一条当前行；状态只允许 `todo|in_progress|passed|failed|needs_revision|skipped`，变更历史写该行 changelog 或 `decision-log.md`。本治理任务自身的 `specs/<task>/tasks.md` 继续适用 `plan-task.v3` 小节模板，不把两种格式混为一个合同。review report 最低字段固定为 `task_id/stage/review_id/material_digest/source_digest/provider/adapter/model/status/verdict/duration/usage/coverage/findings/raw_output_ref/content_hash`；缺失 duration/usage 写 `UNAVAILABLE`，报告只追加不覆盖。

### Stage completion

五阶段完成谓词按 spec §5 即时计算。vNext `run:execute` 必须直接发布质量事实与 publication，不调用 legacy `publishAttempt`；该 legacy 守卫保留为回归保护。确认只记录业务决定，授权必须精确绑定 task 和不可逆 operation。

### Review and verification

每次 review 是一条不可变质量事实，不存在 flow head、round selector 或 replacement resolution。review candidate 只有 `reviews/results/` 的语义结果可以产生 pass/revise_required；`reviews/attempts/` 的 `terminal_status=unavailable` 必须发布为独立 unavailable quality fact，不能进入 passed 或其他可完成状态。wh-review acceptance map 必须逐 AC 指向真实实现/测试行；没有独立证据时使用 `not_applicable`/`unknown` 和原因码，不得用统一占位行冒充覆盖。verify 只重跑缺失、失败、过期或受影响检查，逐 AC 生成当前结论；最终只执行一次有新增信息的 full suite。

最终验收以候选完整 tree 的配置路由要求独立 adapter/provider 审查、43 个 AC、独立 review raw/hash 和同一被审 tree 为核心质量事实。原始方案中的三方盲审按配置路由执行并保留 provider 数量与 adapter 结果；本计划不额外添加配置外的 provider-count 硬门槛，也不把它们变成普通编辑或同 task 修复 gate。每个 unavailable/invalid 仍保留为独立事实。后续若获 merge 授权，main 必须与被审 tree 完全相同，否则重新审查。

### Governance learning and history

M14a/M14b/M15/M16/M17a/M17b 保留在旁路 governance-learning store 或只读原位置，task index 只引用。历史 task 不迁移、不补 hash、不重新分类；新运行时不把历史 reader 放在推进路径。

`agenthub-extraction-program/artifacts/roadmap.md` 是 M14–M17 承接关系的保留根；Phase 0 retention manifest 必须点名它及 M14–M17 原始数据、index/hash、运行边界，Phase 5 只验证，不移动或改写。

### Complexity budget and stopline

预算是治理诊断，不是业务 stage gate。每次报告同时给当前值、目标、stopline、趋势和解释；超目标生成复盘项，超 stopline 停止扩大本治理任务的改动范围并交用户决定，不得自动新增 gate。

| 指标 | 目标 | stopline |
| --- | ---: | ---: |
| 公开行为 | 7 | 8 |
| 持久对象族 | 4 | 5 |
| 专用恢复状态 | 0 | 0 |
| operational lineage 字段 | 0 | 0 |
| schema | ≤10 | 12 |
| 核心文件 | ≤1000 行 | 1500 行 |
| focused tests | ≤15 秒 | 30 秒 |
| full suite | ≤120 秒 | 180 秒 |
| task_dir 控制根 | 6 | 8 |
| task workspace 材料 | 4 | 4 |

不得靠删除关键测试、合并巨型文件或把复杂度搬进 Skill 达标。

schema 预算的统计口径为当前 tracked tree 的 schema 文件，不把 archive 目录或测试 fixture 混入生产 schema 目标。当前盘点为 41 个；本方案预计删除 6 个、增加 3 个，Phase 6 后约为 38 个，因此本任务无法诚实达到 ≤10 或 stopline 12。该超 stopline 状态是显式人工复盘项，不自动扩大删除范围：owner=user，复盘证据写入 `evidence/final/change-summary.md`，由 T002 在 Phase 0 固定当前值/趋势，由 T016/T017 在最终交接包报告实际值、原因和后续处置。AC-037/AC-038 只能以覆盖 CLI、治理同步和 handoff 证据判定，不能把未达 schema 数字目标伪装成通过。
`node tools/architecture/complexity-report.mjs --check-hard-gates` 只检查报告中的三个 hard-gate：`dedicated_recovery_state`、`dual_write_markers`、`bundle_forbidden_content`；每项要求 `actual === required_final === 0`，并验证其审计根、禁用路径/符号或 Bundle 违规清单。schema、文件行数、持久对象族、测试时长等 budget 只输出当前值/目标/stopline/趋势，不参与该 flag 的退出码；Phase 0 的 `expected_exit=0` 因此可判定，超预算仍走人工复盘，不阻塞业务 stage。
Phase 0 冻结记录中的当前 hard-gate 实测值来自 `docs/architecture/complexity-baseline.json`：`dedicated_recovery_state.actual=0`、`dual_write_markers.actual=0`、`bundle_forbidden_content.actual=0`，三项均为 `phase_0_status=observed_zero` 且 `required_final=0`。这些是当前候选的真实基线，不是预填目标；Phase 0 gate 必须重新读取并验证它们，任一重算值非零就 exit 1、保持 `needs_revision`，不得把 hard-gate 推迟到 Phase 4 或用 allow-list 放行。

### 全仓影响审计

当前 tree 有 1125 个 tracked 文件：`specs/` 458（其中 archive 447）、`skills/` 166、`tests/` 105、`runtime/` 87、`core/` 59、`docs/` 53、`tools/` 27、`workflows/` 29。正式测试合计 146 文件、25,861 行、约 1,478 个 test declaration。问题不只在原方案点名模块：`runtime/` 与 `core/` 双 owner、Runner 按目录过度收集、skills 存在平行职责、旧 V2 工具/配置/测试仍在发行与检查路径、archive 体量压过生产代码。

`docs/architecture/move-map.json` 有 201 条记录，其中 18 个目标 hash 已漂移，task 仍绑定 V2/phase-8；`repository-inventory.tsv` 只有 1029 条，较当前 tree 缺 96 条；旧 complexity baseline 记录 143 个测试和 36 个 schema，当前是 146 个测试和 41 个 schema。三者只能作历史输入，必须在 Phase 0 重算，不能授权 V3 删除。

### 2026-08-03 全仓引用审计修正

Phase 4 的第一次真实引用审计不是“零消费者”：
`node tools/architecture/reference-audit.mjs --check --slice=topology,recovery,pointer,phase,review,journal,projection` 当前以 exit 1 暴露 live consumers。生产路径仍直接消费 `core/canonical-receipt-writer.mjs`、`runtime/task/material-revision.mjs`、`runtime/review/review-flow-authority.mjs`、`runtime/review/stage-review-disposition.mjs`、`runtime/review/phase-review-subject.mjs` 和 `workflows/build-code/phase-evidence.mjs`；`runtime/evidence/receipt-writer.mjs` 还依赖旧 journal/audit 模块，`tools/cli/check-task-record-paths.mjs` 仍保留旧路径检查，不能把它们当作无消费者删除项。

因此本方案的删除判据修正为：replacement 测试通过只证明替代行为存在，不证明旧生产 owner 可删；必须同时满足语义替代、生产引用归零、动态/文档/检查引用归零、删除后最小回归和 retention 绑定。当前 live consumer 的 disposition 是 `KEEP_UNTIL_MIGRATION`，由 T012/T015 继续负责迁移或最终保留说明；Phase 4 不得为满足复杂度数字强行删除。无生产消费者但仍被旧测试、检查器或发行闭包引用的路径，先清理引用再重新审计，不能直接物理删除。

这条修正也适用于 Skill：`skills/wh-review/scripts/review-result.mjs`、`workflows/build-code/capture.mjs` 和 `workflows/verify-code/capture.mjs` 仍消费 canonical receipt authority；在 runtime successor 和 clean Bundle 闭包完成前，wh-review、review-result、capture helpers 统一 `KEEP`，只允许改 packet/hash/contract，不得删除入口或伪造替代实现。每次修改 `skills/wh-review/skill-bundle.json` 必须同步文件 hash 并通过 skill closure。

### 最终目录目标

- `runtime/interface|stage|task|evidence|review|adapters|distribution|schemas` 是唯一生产 runtime owner。
- `tools/cli` 只保留人工/CI 入口，不承载 task 状态或重复 runtime 逻辑。
- `workflows/<five-stage>` 只保留五阶段 SKILL、steps、skill-deps 和该阶段必要 helper。
- `skills/` 只保留被五阶段、wh-review lens、close 或明确维护工具消费的可搬运 skill。
- `tests/contract|integration|e2e|fixtures` 按用户接口和稳定责任组织；`core/__tests__`、`scripts/__tests__` 的保留测试随 owner 移动。
- `core/`、顶层 `scripts/`、顶层 legacy schemas 的生产 owner 归零；无法证明迁移安全的项保持原位并标记 KEEP，本任务不得建立短期兼容 reader、双写或过渡窗口。
- `specs/archive/` 不进入 Runner/Bundle/运行时扫描；本任务只保留 Git 内只读 provenance 并排除生产检查，物理迁出/归档属于独立 archive 授权。

### Skill 影响矩阵

本轮用户已确认继续 build-code，并接受唯一已登记的 `PHASE0_BRIDGE_PRODUCTION_FIX` RED/GREEN 例外；其它 accepted risk 仍保持显式 `incomplete`，不被静默接受。

| 处置 | Skill | 原因 | 主要改动 |
| --- | --- | --- | --- |
| 必须适配 | decision-log、talk-with-zhipeng、grill-with-docs | 五阶段直接消费 | 写四材料/单事实 |
| 必须适配 | wh-review | 唯一审查入口 | 删除 flow/head/replacement |
| 保留 lens | intake-decision-review、plan-ceo-review、plan-design-review、plan-eng-review、qa-only、verify-change | 审查职责不同 | 只改 packet/fact 合同 |
| 并入 build-spec | spec-specify、spec-clarify | 平行规格入口 | 合并模板与歧义事实 |
| 并入 build-plan | spec-plan、spec-tasks | 第二套 plan/tasks | 单一 plan-task 合同 |
| 并入 facts | stage-step-receipts、audit-summary-carrier | 独立控制投影 | facts/quality/index |
| MERGE | review-response → wh-review | 删除 flow/resolution validator，保留最小 disposition fact | wh-review packet |
| 并入 verify | test-strategy | 额外第五材料 | quality test routing |
| 保留独立 | isolated-browser-qa | 真实 UI QA 能力 | 输出进 quality/tests |
| 保留 close | resolving-merge-conflicts | close 独立 consumer | 不进入普通 stage |
| KEEP/EXCLUDE | debate、diagnosing-bugs、test-routing-advisor | 无 stage consumer | 仓内保留，排除核心 Bundle |
| 删除断链 | scope-triage config entry | catalog 已 absorbed | 删除失效注册 |
| 单独维护 | workflowhub-multica-sync | Multica 显式工具 | 不作 stage dependency |

`anysearch` 只作为外部 capability doctor，不当作内置 stage skill；`workflowhub-host-protocol` 和 `_spike` 在仓内保留 provenance、排除 Bundle/生产扫描。物理 MOVE-OUT、ARCHIVE、删除必须另获授权。Phase 0 的 deletion/retention manifest 为每个 skill 写唯一 KEEP/MERGE/REMOVE/EXCLUDE-FROM-BUNDLE 和 owning task；后文不得覆盖该 disposition。适配 owner 固定为 T006/T013：T006 独占前三阶段直接消费的 `skills/decision-log/`、`skills/talk-with-zhipeng/`、`skills/grill-with-docs/`；T013 独占 `skills/isolated-browser-qa/`、`skills/intake-decision-review/`、`skills/plan-ceo-review/`、`skills/plan-design-review/`、`skills/plan-eng-review/`、`skills/qa-only/`、`skills/verify-change/` 的 packet/fact 合同、quality/tests 路由和 bundle disposition。这些 skill 不得被误删或默认加入核心 Bundle，必须记录 KEEP/ADAPT disposition、前后 hash 和对应 closure/dispatch 事实。

### 测试删改范围

全仓审计识别出 17 个纯旧状态机测试候选（2637 行），15 个混合测试需拆分重写（7331 行），21 个核心契约测试必须保留（约 3339 行）。删除候选包括 `tests/audit-aggregator.test.mjs`、`audit-p2.test.mjs`、`build-code-phase-evidence.test.mjs`、`build-code-preflight.red.test.mjs`、`five-stage-audit-e2e.test.mjs`、`five-stage-facts-v2.test.mjs`、`official-component-receipts.test.mjs`、`phase-gate.test.mjs`、`stage-content-host-independence.test.mjs`、`stage-content-publication.test.mjs`、`stage-interaction-contract.test.mjs`、`stage-orchestrator-v2.test.mjs`、`task-accepted-schema.test.mjs`、`workflow-v2-contract.test.mjs`、`scripts/__tests__/ci-chain-check.test.mjs`、`scripts/__tests__/migrate-task-v2.test.mjs`、`core/__tests__/receipt-writer.test.mjs`。

混合测试不能整删：`final-cutover-guards.red`、`stage-content-evidence`、`task-close-delivery`、`terminal-runtime-blockers`、现有 E2E、stage-runtime E2E、progression-without-permits、task-kernel publish/handle 和 wh-review runner/CLI/controller。它们保留身份/hash/write-set/原子性、幂等冲突、review 三态、raw report、confirm/authorize 分离、同 task 修订和中断不假绿；删除 accepted/checkpoint/flow/head/generation/phase/recovery/selector 断言。

### 发行影响

当前 Skill Bundle 81 个文件、14 个 skills，未发现 tests/history/node_modules；Runner 189 个文件，虽然也未包含 tests/node_modules，却按 `core/*.mjs`、`scripts/*.mjs`、`tools/cli/*.mjs` 过宽收集，会继续发行 audit、receipt、checkpoint、migration、phase-gate 等旧代码。Phase 6 将 Runner 改为“公开入口 + 静态依赖闭包 + 明确数据资产”，并用 clean install 覆盖约 35 个动态 import/read 路径。

## 文件边界

### NEW

`runtime/schemas/quality-verify.v1.json`

`tests/contract/execution-identity.test.mjs`

`tests/contract/verify-final-coverage.test.mjs`

`tools/architecture/public-behavior-baseline.mjs`、`tests/contract/public-behavior-baseline.test.mjs`、`tests/fixtures/public-behavior-baseline/v1/manifest.json`、`tests/fixtures/public-behavior-baseline/v1/baseline.json`、`tests/fixtures/public-behavior-baseline/v1/candidate.json`、`tools/architecture/phase0-deletion-disposition.mjs`、`tests/integration/governance-diagnostics-non-gate.test.mjs`、`docs/architecture/retention-manifest.json`、`runtime/task/material-workspace.mjs`、`tests/contract/material-workspace.test.mjs`、`runtime/task/task-store.mjs`、`runtime/evidence/quality-store.mjs`、`runtime/schemas/task-fact.v1.json`、`runtime/schemas/task-index.v1.json`、`tests/integration/minimal-task-storage.test.mjs`、`tests/integration/vnext-official-stage-run.test.mjs`、`tests/integration/first-three-stage-cutover.test.mjs`、`tests/contract/confirmation-authorization.test.mjs`、`tests/contract/doctor-interface.test.mjs`、`tests/contract/status-derivation.test.mjs`、`tests/integration/verify-freshness-selection.test.mjs`、`tests/integration/quality-store-concurrency.test.mjs`、`tests/integration/task-fact-index-consistency.test.mjs`、`tools/architecture/history-inventory.mjs`、`tools/architecture/retention-audit.mjs`、`docs/architecture/history-inventory.json`、`tests/integration/history-read-only.test.mjs`、`tests/integration/governance-learning-non-gate.test.mjs`、`evidence/final/deletion-list.json`、`evidence/final/retention-list.json`、`evidence/final/m14-m17-impact.md`、`evidence/final/change-summary.md`、`evidence/final/verification-summary.json`。

`evidence/final/review-tree-manifest.json`、`evidence/final/final-coverage.json`（Phase 7 T018 最终 review scope 与 coverage 产物）

`tests/integration/journal-replacement.test.mjs`、`tests/integration/projection-replacement.test.mjs`（Phase 4 T010 replacement tests）

`runtime/stage/stage-context.mjs`、`runtime/stage/stage-handlers.mjs`、`runtime/stage/stage-runner.mjs`、`runtime/evidence/stage-content-evidence.mjs`、`runtime/evidence/stage-completion-facts.mjs`、`runtime/task/task-handle.mjs`、`runtime/task/task-kernel-implementation.mjs`、`runtime/task/workspace.mjs`、`runtime/task/task-index.mjs`、`runtime/schemas/interaction-completion.v1.json`、`tools/cli/stage-runtime.mjs`、`tools/cli/task-close.mjs`（Phase 6 T012 当前均为 missing target，按 source→new target 合并后再删除旧 owner）

`tests/contract/task-handle.test.mjs`、`tests/integration/task-kernel-publish.test.mjs`、`tests/e2e/stage-runtime-five-stage-e2e.test.mjs`（Phase 6 T012 随 source test owner 移入稳定测试目录）

### MODIFY

`tools/architecture/inventory.mjs`、`tools/architecture/complexity-report.mjs`、`tools/architecture/verify-final-coverage.mjs`、`tools/architecture/public-behavior-baseline.mjs`、`tests/contract/public-behavior-baseline.test.mjs`、`tests/fixtures/public-behavior-baseline/v1/manifest.json`、`tests/fixtures/public-behavior-baseline/v1/baseline.json`、`tests/fixtures/public-behavior-baseline/v1/candidate.json`、`skills/wh-review/scripts/review-materials.mjs`、`skills/wh-review/scripts/__tests__/review-source-materials.test.mjs`、`skills/wh-review/scripts/__tests__/phase-review-subject.test.mjs`、`skills/wh-review/skill-bundle.json`、`docs/architecture/repository-inventory.tsv`、`docs/architecture/complexity-baseline.json`、`docs/architecture/deletion-plan.json`、`docs/architecture/move-map.json`、`runtime/stage/completion-predicates.mjs`、`tools/cli/task-bootstrap.mjs`、`core/stage-runner.mjs`、`scripts/stage-runtime.mjs`、`core/task-kernel-implementation.mjs`、`core/task-handle.mjs`、`workflows/build-spec/`、`workflows/build-plan/`、`core/stage-handlers.mjs`、`tests/contract/stage-completion.test.mjs`、`workflows/build-code/`、`workflows/build-code/phase-evidence.mjs`、`workflows/verify-code/`、`runtime/review/`、`runtime/evidence/freshness.mjs`、`runtime/interface/runtime-facade.mjs`、`tests/contract/review-layering.test.mjs`、`tests/integration/progression-without-permits.test.mjs`、`tests/integration/atomic-write-faults.test.mjs`、`tests/e2e/five-stage-normal.test.mjs`、`tests/e2e/five-stage-material-revision.test.mjs`、`tests/e2e/five-stage-idempotent-resume.test.mjs`、`tests/integration/mutation-guards.test.mjs`、`tests/contract/legacy-zero.test.mjs`、`AGENTS.md`、`CONSTITUTION.md`、`constitution-checklist.md`、`CONTEXT.md`。

`core/stage-context.mjs`、`core/stage-content-evidence.mjs`、`core/stage-completion-facts.mjs`、`core/task-handle.mjs`、`core/workspace.mjs`、`core/task-index.mjs`、`core/schemas/interaction-completion.v1.json`、`scripts/task-close.mjs`、`scripts/runtime-cutover.mjs`、`skills/spec-specify/`、`skills/spec-clarify/`、`skills/spec-plan/`、`skills/spec-tasks/`、`skills/stage-step-receipts/`、`skills/audit-summary-carrier/`、`skills/review-response/`、`skills/test-strategy/`、`skills/debate/`、`skills/diagnosing-bugs/`、`skills/test-routing-advisor/`、`skills/workflowhub-host-protocol/`、`config/workflowhub.yaml`、`skills/catalog.yaml`、`tests/audit-aggregator.test.mjs`、`tests/audit-p2.test.mjs`、`tests/build-code-phase-evidence.test.mjs`、`tests/build-code-preflight.red.test.mjs`、`tests/five-stage-audit-e2e.test.mjs`、`tests/five-stage-facts-v2.test.mjs`、`tests/official-component-receipts.test.mjs`、`tests/phase-gate.test.mjs`、`tests/stage-content-host-independence.test.mjs`、`tests/stage-content-publication.test.mjs`、`tests/stage-interaction-contract.test.mjs`、`tests/stage-orchestrator-v2.test.mjs`、`tests/task-accepted-schema.test.mjs`、`tests/workflow-v2-contract.test.mjs`、`scripts/__tests__/ci-chain-check.test.mjs`、`scripts/__tests__/migrate-task-v2.test.mjs`、`core/__tests__/receipt-writer.test.mjs`、`tests/final-cutover-guards.red.test.mjs`、`tests/stage-content-evidence.test.mjs`、`tests/task-close-delivery.test.mjs`、`tests/terminal-runtime-blockers.test.mjs`、`scripts/__tests__/stage-runtime-five-stage-e2e.test.mjs`、`core/__tests__/task-kernel-publish.test.mjs`、`core/__tests__/task-handle.test.mjs`、`skills/wh-review/scripts/__tests__/review-runner.test.mjs`、`skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs`、`skills/wh-review/scripts/__tests__/review-controller.test.mjs`、`runtime/distribution/runner-release.mjs`、`runtime/distribution/skill-bundle-release.mjs`、`tests/integration/distribution-closure.test.mjs`、`tests/integration/runner-clean-install.test.mjs`。

诊断入口遵守简化守卫：`tools/architecture/public-behavior-baseline.mjs` 是真实七行为采集器，不能与静态 inventory 混成一个输入/隔离合同；`tools/architecture/phase0-deletion-disposition.mjs` 是删除前冻结检查，`tools/architecture/history-inventory.mjs` 是历史 bytes 只读摘要，`tools/architecture/reference-audit.mjs` 是 consumer=0 证明，`tools/architecture/retention-audit.mjs` 是质量/学习资料保留检查。四者的输入和失败语义不同，不能用“写权限”作为不合并理由：前者校验 Phase 0 冻结 hash/slice，`reference-audit` 校验当前 tree 的 consumer=0，二者都只读但必须保留两类独立失败类别；P1/P2 结论是现有 `inventory.mjs`/`complexity-report.mjs` 没有冻结 deletion-plan 的 `{ref,content_hash}` 与按 slice 选择的输入边界，把这项检查并入会把 `deletion_manifest_drift`/`deletion_slice_mismatch` 与当前 consumer 残留混成同一结果，因此保留独立 CLI，同时由治理 contract 覆盖其两个失败类别。它们只属于架构工具，不进入 Runner/Bundle；`history-inventory.mjs` 与 `reference-audit.mjs` 是最终验证所需的永久 READ/KEEP 诊断 oracle，T015 只记录其 retention，不执行不可达的归档动作。

全局 touched-path 汇总不改变唯一 owner：public behavior baseline 的采集器、contract 和 fixtures 首次归属 Phase 0/T001，Phase 3 仅由 T024/T021 在同一证据 slice 内修订；不视为并行 NEW/MODIFY owner。 `runtime/review/phase-review-subject.mjs`、`workflows/build-code/phase-evidence.mjs` 及其两项 bridge tests 的行为修复唯一归属 T028/T029；T002 只拥有 inventory/complexity/deletion 报告。`scripts/runtime-cutover.mjs` 由 Phase 4/T009 删除，Phase 6 不迁移它。

Phase 2 的 T006 拥有前三阶段与 confirmation/authorization 产品退出断言；Phase 3 的 T007/T008 拥有三条五阶段 E2E、AC-014、identity、build-code/verify-code 与 serious-finding 断言；T023 负责 remediation 后的完整 material/quality gate 与 `tests/contract/stage-completion.test.mjs` 回归。T014 只在 Phase 6 的冻结 snapshot 上删除旧控制断言、整理测试归属和刷新 hash，不重写这些文件的业务语义。progression/wh-review 四个测试由 T009/T010 在 Phase 4 完成语义切分、迁移前后 hash 和 replacement proof；Phase 6 不再把它们列为 MODIFY，T014 不拥有它们。

每个新增架构 CLI 必须登记唯一 consumer 与退出条件：baseline collector 由 T001/T017 用于七行为采集与最终 compare，保留；inventory/complexity 由 T002/T009/T012 消费，保留为诊断；history-inventory 由 T002/T011/T017 消费，永久 READ/KEEP 作为离线历史 bytes 证明工具，不进入 Runner/Bundle；retention-audit 由 T011/T015 消费，直到 T015 写入最终 deletion-list/retention-list 并验证 delete_condition 后才允许 ARCHIVE/REMOVE；phase0-deletion-disposition 由 T002/T009/T010/T015 消费，专门证明冻结 deletion-plan 的 slice/hash 与机制族 deletion-list 完整性，失败类别为 `deletion_manifest_drift`/`deletion_slice_mismatch`，不得由 reference-audit 替代。`reference-audit` 由 T009/T010/T012/T015/T017 消费，永久 READ/KEEP 作为 reference/closure oracle。每项 disposition 写入 retention-manifest 的 `{consumer,failure_evidence,disposition}`；无 consumer 不保留。

`tools/architecture/reference-audit.mjs` 同样登记：consumer 为 T009/T010/T012/T015/T017/T018 的 reference/closure gates；failure_evidence 专门记录当前 tree 的生产 consumer/import 残留、MOVE 后路径闭包和 consumer=0，不复用 deletion-plan slice/hash 结论。默认 `--check` 对任何残留 exit 1；`--allow-keep-until-migration=docs/architecture/retention-manifest.json` 只允许 manifest 中逐项登记的 KEEP target，其它残留仍 exit 1。T009/T010 只使用 allow-list 做 Phase 4 过程 gate；T012/T015 只验证 successor/retention 事实，T017/T018 的最终 reference-clean 不带 allow-list，`violations` 与 `allowed_violations` 均必须为空。它不是业务入口，也不进入 Runner/Bundle，disposition 固定为永久 READ/KEEP。
`history-inventory.mjs` 的 disposition 固定为永久 READ/KEEP：T017 的 `verify-unchanged` receipt 和 T018 的历史摘要引用是它的消费事实，不触发归档；T015 只把这两个诊断 oracle 写入最终 `retention-list.json`，不执行依赖后置 Phase 事实的 ARCHIVE/REMOVE。

补充 touched paths：`core/chain-topology.mjs`、`core/git-checkpoint.mjs`、`runtime/task/material-revision.mjs`、`runtime/schemas/task-material-revision.v1.json`、`tools/cli/ci-chain-check.mjs`、`tools/cli/migrate-task-v2.mjs`、`tools/cli/phase-gate.mjs`、`config/runtime-fact-v2-sources.mjs`、`core/audit-aggregator.mjs`、`core/journal-appender.mjs`、`core/journal-schema.mjs`、`core/receipt-schema.mjs`、`core/canonical-receipt-writer.mjs`、`runtime/evidence/receipt-writer.mjs`、`runtime/review/review-flow-authority.mjs`、`runtime/review/review-controller.mjs`、`runtime/review/phase-review-subject.mjs`、`runtime/review/stage-review-disposition.mjs`、`tools/cli/audit-aggregate.mjs`、`skills/wh-review/scripts/review-runner.mjs`、`skills/wh-review/scripts/wh-review-cli.mjs`、`runtime/evidence/check-skill-closure.mjs`、`tools/cli/check-contract.mjs`、`tools/cli/smoke-local-skill-dispatch.mjs`、`package.json`。其中 DELETE AFTER PROOF 项仅表示结构校验中的 touched path，实际 disposition 见下节。

补充 touched paths（结构合同追加）：`tools/architecture/reference-audit.mjs`、`skills/wh-review/SKILL.md`、`skills/wh-review/scripts/review-result.mjs`、`skills/wh-review/skill-bundle.json`、`skills/wh-review/manifest.json`。这些路径分别由 T009 与 T013 在 Phase 4/6 拥有明确写范围；不得仅因只出现在 Phase 小节而从全局结构校验中遗漏。

### DELETE AFTER PROOF

精确删除集由 Phase 0 的 `docs/architecture/deletion-plan.json` 冻结。当前已识别候选：

本节只是候选索引，不授予 owning task，也不覆盖 Phase 4/Phase 6 小节的 disposition；真实 DELETE、KEEP_UNTIL_MIGRATION、ARCHIVE 和 owner 以对应 Phase 小节与冻结 deletion-plan 为唯一权威，尚未进入冻结 deletion-plan 的候选一律 KEEP。

- topology/journal/receipt/checkpoint：`core/chain-topology.mjs`、`core/audit-aggregator.mjs`、`core/git-checkpoint.mjs`、`core/journal-appender.mjs`、`core/journal-schema.mjs`、`core/receipt-schema.mjs`、`core/canonical-receipt-writer.mjs`、`runtime/evidence/receipt-writer.mjs`。
- current/revision/accepted schema：`runtime/task/material-revision.mjs`、`runtime/schemas/task-material-revision.v1.json`、`runtime/schemas/requirement-ledger.schema.json`、`runtime/schemas/requirements-coverage.schema.json`、`runtime/schemas/stage-content-evidence.v1.json`、`runtime/schemas/task-attempt.v2.schema.json`、`runtime/schemas/task-accepted.v2.schema.json`。其中仍承载质量语义的字段先迁到当前 spec/fact 合同；`runtime/task/material-revision.mjs` 与 `task-material-revision.v1.json` 当前为 `KEEP_UNTIL_MIGRATION`，由 T012 负责 successor migration，其他无 live consumer 项才由对应 Phase 4 owner 申请删除。
- review control：`runtime/review/review-flow-authority.mjs`、`review-controller.mjs` 中 flow/resolution 部分、`phase-review-subject.mjs`、`stage-review-disposition.mjs`；保留 provider 调用、规范化 verdict、raw ref/hash 和独立 review subject。
- 旧 CLI/迁移：`tools/cli/audit-aggregate.mjs`、`ci-chain-check.mjs`、`migrate-task-v2.mjs`、`phase-gate.mjs`、`scripts/runtime-cutover.mjs`、`config/runtime-fact-v2-sources.mjs`。
- phase helper：`workflows/build-code/phase-evidence.mjs`、`runtime/review/phase-review-subject.mjs`、`workflows/verify-code/metrics-writer.mjs`；前两项当前为 `KEEP_UNTIL_MIGRATION`，T009 只做 phase slice gate/consumer audit，T012 负责 successor migration，只有 reference-clean 后才可申请删除；`metrics-writer` 仍按 Phase 6 disposition 处理。
- 合并后 skill：`skills/spec-specify/`、`spec-clarify/`、`spec-plan/`、`spec-tasks/`、`stage-step-receipts/`、`audit-summary-carrier/`、`test-strategy/`；`review-response/` 已确定 MERGE 到 `wh-review`，删除 flow validator，只保留最小 disposition fact 能力，不再保留独立 skill。
- EXCLUDE/KEEP：`workflows/_spike/`、`skills/debate/`、`skills/test-routing-advisor/`、`skills/workflowhub-host-protocol/` 保持仓内 provenance 并排除核心 Bundle/生产扫描；只删除 `config/workflowhub.yaml` 的失效 `scope-triage` 注册。
- 旧状态机测试：全仓影响审计列出的 17 个文件；15 个混合测试只拆分重写，不整删。

这些仍是候选，不是删除许可；每项必须有 consumer=0、替代行为、负测、retention 和可恢复 diff。当前审计确认的 KEEP 集合是 `core/canonical-receipt-writer.mjs`、`runtime/evidence/receipt-writer.mjs`、`runtime/task/material-revision.mjs`、`runtime/schemas/task-material-revision.v1.json`、`runtime/review/review-flow-authority.mjs`、`runtime/review/phase-review-subject.mjs`、`runtime/review/stage-review-disposition.mjs`、`workflows/build-code/phase-evidence.mjs`、`tools/cli/check-task-record-paths.mjs`；其 successor owner 是 T012/T015，T009/T010 只作过程 gate。随机制族删除的测试归 Phase 4 唯一 owning task；只有纯目录/owner 收敛才归 Phase 6，禁止双 owner。`core/stage-runner.mjs`、`stage-handlers.mjs`、`task-kernel-implementation.mjs`、`task-handle.mjs` 不整文件删除：先拆出保留职责到 `runtime/`，再删除 core 旧 owner。

## 技术决策

### DEC-001 — vNext 直接 publication，保留 legacy 守卫

- **Selected**：extend 现有 quality fact/publication 原语，在 stage runner 按 record model 分流；不删除守卫来假装修复。
- **Reason**：真实修复标准流程，同时防止回归旧 attempt writer。

### DEC-002 — 全仓 disposition 后再删/搬

- **Selected**：reuse inventory/move-map；先证明 consumer 和替代，再垂直删除，最后机械移动。
- **Reason**：避免目录整洁掩盖行为变化和误删唯一质量 oracle。

### DEC-003 — skill 也纳入生产架构

- **Selected**：reuse 五 workflow 和必要独立技能；无 stage/skill-deps/catalog/host consumer 的 skill 删除或移出发行闭包，不保留仅因历史存在的 skill。
- **Reason**：166 个 skill 文件是当前主要复杂度来源之一，不能只治理 runtime。

## Implementation Order

严格按 Phase 0→7。Phase 0 在任何 runtime 语义修改前同时冻结七行为、历史 bytes 摘要和 V3 move-map；若审查发现基线不是实际固定输入，基线任务必须在后续修订任务中重新采集后才能作为 AC-008～AC-010 的最终证据。每个 Phase 先 RED/反向证明，再 GREEN，再 focused test；Phase 4 一次只删除一个已盘点机制族。T005 依赖 T004 的最小 task store，因此是正式 stage 路径上的首个行为修复，其真实 legacy-writer RED 先于实现固定。Phase 2 由 T005/T006 只闭合 AC-028、AC-029；AC-014 的五阶段 E2E discharge owner 是 Phase 3 的 T007/T008，不能把 Phase 3 的事实提前算入 Phase 2。T019～T023 与 T024～T026 是同一 Phase 3 remediation slice：先修复 review/unavailable 与真实基线，再补齐多 case/四值差异结论、逐 AC 真实映射和完整 focused gate，最后修复质量事实语义与存储并发边界；任何一项未完成都不得进入 Phase 4。Phase 3 remediation 必须保留 review unavailable/invalid 的原始事实，不得把 provider coverage 压成单一结论。Phase 6 先更新 move-map 再移动，移动后刷新 hash；AC-041 的 mutation/full suite 仍是 spec 固定的 Phase 6 产品退出条件，但按“full suite 只执行一次”约束唯一 receipt 在最终 Phase 7 产生，必须在 build-plan 确认摘要中显式记录该顺序偏离，T017 在运行后回填证据；在此之前 Phase 6 只能是未关闭的 implementation checkpoint，不得进入最终确认。Phase 7 先执行 T030 RED、T016 GREEN，再由 T017 执行最终验证；provider 数量不作为 spec 外硬门槛。

审查 remediation contract（具体 review result 保存在 task storage）：

build-plan 确认摘要必须同时列出并由用户裁决 `accepted_risk=AC008_PHASE_ORDER`、`accepted_risk=AC014_PHASE_ORDER`、`accepted_risk=AC017_019_PHASE_ORDER`、`accepted_risk=AC041_PHASE_ORDER`、`accepted_risk=AC023_PHASE_ORDER`、`accepted_risk=SCHEMA_BUDGET_OVER_STOPLINE` 和 `accepted_risk=PHASE0_BRIDGE_PRODUCTION_FIX`。这七项是对 approved spec §5 “以下产品退出条件不得改写”及其 Phase 0–6 退出清单的显式、用户可见顺序或预算偏离：摘要必须同时引用该原文约束、KEEP live consumer 或 Phase 1 atomicity evidence、full suite 只执行一次的冲突来源、Phase 0 bridge 的唯一 consumer/回退边界/删除 owner、当前 `incomplete` 语义和后续 discharge owner，不得把偏离写成新的 Phase 退出条件。七项未全部获得用户明确接受前，本 plan 不得标记为 accepted；任一被拒绝都必须回到 spec/plan 修订或按用户指示停止。前六项在各自 discharge evidence 回填前都只能是 `incomplete`，bridge 项只允许 T028→T029 这一个已登记例外，schema 项必须同时展示当前 41、目标 ≤10、stopline 12、预计净变化 -3 和不扩大删除范围的理由，不能把这些风险留到 Phase 7 才首次告知。

`accepted_risk=PHASE0_BRIDGE_PRODUCTION_FIX` 仅覆盖 T029 对 `runtime/review/phase-review-subject.mjs` 与 `workflows/build-code/phase-evidence.mjs` 的已登记 RED→GREEN 修复；T028 先在 disposable copy 取 RED，T029 在 fixed candidate tree 取 GREEN，T009/T012 负责后续 replacement/reference proof，T015/T017 负责最终 disposition。它不扩大 Phase 0 的其它 runtime 写权限，也不把 bridge 变成业务控制链。

AC-041 的产品退出条件不改写：discharge owner 固定为 T017；T017 的 `evidence/final/verification-summary.json` 必须显式列出被回填的 Phase 6 退出项、mutation/full suite receipt、AC-041 证据引用和回填时间。full suite 的执行位置是最终 Phase 7，但在 T017 回填前 Phase 6 不得关闭或进入最终确认。

`accepted_risk=AC023_PHASE_ORDER` 对应 approved spec §5 的 Phase 1 atomicity exit：T003/T004 先固定材料/事实 writer sub-contract，AC-023 的最终质量/存储故障注入与一致性 discharge 由 T026/T023 补齐；在该 evidence 回填前保持 `incomplete`，不得把 Phase 1 GREEN 当作 AC-023 最终通过。

- 七类基线必须按原始 spec 为 `status` 采集同一 task 的连续两次调用并比较 run sequence、workflow ID 一致性、write namespace 和重复调用语义，为 `run` 采集 scope 成功 case 与新 task execute case，为 `review` 采集确定性 unavailable case 与 `triggered=false` case，为 `verify` 采集成功 case 与非零退出 case，为 `confirm` 采集合法与错绑 attempt case，为 `authorize` 采集精确、缺失和错绑 confirmation case，并保留“执行后没有隐式 commit、push、merge、archive 或 cleanup”的逐项 postcondition；对比输出必须逐行为给出 `preserved`、`approved_internal_change`、`approved_bug_fix` 或 `behavior_regression`，不能用过滤写集合或总 PASS 掩盖差异，每个写集合项必须有内容 hash。
- `acceptance_map` 只允许将有本 Phase 真实实现和验证证据的 AC 标为 `complete`；其余必须为 `not_applicable` 或 `unknown`，带逐条 reason_code/reason。实现 anchor、验证 anchor、change_id 和 receipt 必须分别指向真实文件/测试/收据，不得用同一条 spec 行和泛化文字批量填充。
- Phase 3 的 T022 只在 T026 创建质量/存储新测试前执行 material-slice GREEN gate；T023 是创建这些测试后的唯一 complete Phase 3 GREEN gate，必须覆盖本 Phase 全部新增/修改测试文件并与当前 implementation snapshot tree 相同。只跑三类代表性测试不算通过。
- `test` 质量事实必须读取绑定 receipt 并校验 `exit_code===0`；`confirmation` 必须校验 task/stage/确认语义；无法校验统一写 `unavailable`，不得由引用存在推导 `passed`。写集合每项保留内容 hash。
- `facts.jsonl` 与 `index.json` 的崩溃窗口、quality-store 的 `EEXIST` 并发幂等和无消费者导出必须分别有负测/修复或明确删除，不得静默吞错或保留无消费者代码。

## 依赖与并行

主链为 T001→T002→T028→T029→T003→T004→T005→T006→T007→T008→T020→T019→T024→T021→T025→T022→T026→T023→T009→T010→T011→T012→T013→T014→T027→T015→T030→T016→T017→T018。全仓扫描可由只读子代理并行，但任何写任务串行，避免 Phase 间文件重叠和审查快照漂移。Phase 4 内机制族也串行删除。 T028/T029 是已登记的 wh-review 临时证据桥 RED/GREEN 行为任务；T030 是 `verify-final-coverage` 的独立 RED，T016 是其 GREEN owner；桥修复不再挂在只读 inventory 任务下。

## Test Strategy

- 基线：在固定 commit 真实运行七行为及 spec 要求的多 case；保留 raw hash、normalized hash、exit code、每个写集合项的内容 hash、固定输入和采集身份；compare 必须逐行为输出四值结论。
- 契约：四材料、最小 task_dir、事实原子性、七行为职责、确认/授权分离、错绑 fail-loud、治理反 gate。
- 集成：五阶段完成谓词、review pass/revise/unavailable、receipt 语义校验、focused verify、quality/index 回读、发行闭包。
- E2E：正常五阶段；材料修订后同 task focused verify；写入中断/review unavailable 后同动作重跑。
- mutation：使用受控 fixture 驱动，不改工作树源码。固定映射为：identity/tree hash→错绑正式写测试；missing completion→完成谓词测试；review major/unavailable→假 PASS 负测；失败 test receipt→质量事实不应 passed 负测；confirmation/authorization→权限测试；bundle pollution→发行闭包测试；nonzero test exit→verify capture 测试；facts/index 中断→一致性检测/恢复测试；quality-store EEXIST→并发幂等测试；historical task write→history digest 测试；baseline invalid-action probe→真实固定 action/输入校验；legacy writer fault→仍存活 writer 的故障/并发契约。每个 fixture 声明目标语义变更、必须失败的 test 名和失败断言；若 mutation 被注入后测试仍 exit 0，则未 kill。
- AC-035 identity mutation 单独固定为 `tests/contract/execution-identity.test.mjs`：在 dirty worktree 下正式 publication 必须非零，且不得写出把 dirty tree 冒充为 bound HEAD 的 identity/tree hash 记录；与 AC-034 的错绑 task/op 负测分开统计。
- AC-036 正向 oracle 单独固定为 `tests/contract/execution-identity.test.mjs -t "identity:normal-edit-not-blocked"`：普通材料编辑和同任务修复不因 publication identity 检查被阻塞；与 AC-035 的 dirty-worktree 非零负测分开统计，并写入 T003 RED、T004/T007/T008 GREEN gate。
- `npm run check` 固定为 `markdownlint-cli2 "**/*.md"`、`node tools/cli/verify-structure.mjs`、`node tools/cli/run-checks.mjs`、`npm run check:skill-closure`、`npm run smoke:skill-dispatch`；它是 lint/结构/contract/closure/dispatch 检查，不等于 `npm test`，不计入 full suite。T017 的 `verification-summary.json` 必须分别记录 `check` receipt 与唯一 `npm test` full-suite receipt。
- 最终：受影响 focused suite、一次必要 `npm test`、上述 `npm run check`、空目录 Local Runner clean install。

## Rollback and Recovery

每个 Phase/机制族在证据目录保存 path list、改前/改后 blob hash 和 `git diff --binary -- <owned-paths>` 生成的 patch hash；这不是 commit、checkpoint 或推进许可证。失败时用该 path-bound inverse diff 恢复当前 slice，不改历史 task，不创建 recovery/successor 对象。Phase 6 MOVE 前后同时登记 move-map，避免反向 patch 误撤后续路径。若 baseline 无法重算、消费者未知、保留索引不完整、历史摘要变化或公开行为出现未解释 regression，停止对应 Phase。

### Engineering Risk Handoff

- **Affected IDs**：FR-DELETION-001、FR-STORAGE-001、FR-HISTORY-001、FR-STAGE-001；AC-017～AC-027、AC-030～AC-036。
- **Trigger**：隐藏 consumer、baseline 不可重算、历史摘要变化、retention ref 缺失或 vNext 仍调用 legacy writer。
- **Consequence**：半迁移、质量资料丢失、标准五阶段不可复现或行为退化。
- **Mitigation or STOP**：对应机制族保持 KEEP；回到最早失败 Task 修复；不增加双写/兼容桥，不改写失败事实。
- **Handling Stage**：build-code Phase 0–7；最终由 verify-code 汇总。
- **Verification**：consumer/reference audit、baseline compare、history digest、focused/E2E/mutation/full/clean install 和独立 review。

## 需求与验证追踪

- FR-PUBLIC-001 → T006、T007、T008、T019、T020、T017、T018 → AC-001～AC-007。
- FR-BASELINE-001 → T001、T021、T024、T017、T018 → AC-008～AC-010。
- FR-MATERIAL-001、FR-STORAGE-001 → T003、T004、T007、T008、T022、T023、T025、T026 → AC-011～AC-013、AC-020～AC-023；AC-013 的最小 E2E discharge 由 T007/T008 负责，T003/T004 只负责材料/存储子契约。
- FR-STAGE-001、FR-QUALITY-001、FR-SAFETY-001 → T003、T004、T005～T008、T017、T018、T019、T022、T023、T025、T026、T028、T029 → AC-014～AC-016、AC-030～AC-036、AC-041；AC-041 的唯一 discharge owner 是 T017，T018 只做最终综合验证。

下列矩阵按每个 FR/AC 的 primary owner 汇总；任务局部 FR/AC 字段可以表示该任务的 RED、GREEN 或验证子范围，T018 是最终综合任务，不要求把它重复填入每一行。

- FR-DELETION-001 → T002、T009、T010、T012、T017 → AC-017～AC-019。
- FR-LEARNING-001、FR-HISTORY-001 → T002、T011、T017 → AC-024～AC-027。
- FR-GOVERNANCE-001、FR-RULES-001 → T002、T012～T016、T030 → AC-037、AC-038、AC-042。
- FR-AUTH-001 → T006、T016、T018 → AC-028、AC-029、AC-043。
- FR-DISTRIBUTION-001 → T027、T015、T017、T018 → AC-039、AC-040；AC-041 归 FR-QUALITY-001，唯一 discharge owner 是 T017，T018 只做最终综合验证。

## 治理同步矩阵

| Surface | Files | Action | Task |
| --- | --- | --- | --- |
| 项目规则 | AGENTS/CONSTITUTION/checklist/CONTEXT | 同步永久边界 | T016 |
| 五阶段 | workflows/* | 去旧许可与隐式状态 | T006–T008 |
| Skills | skills/catalog/skill-deps | 删无 consumer，改受影响合同 | T002/T013 |
| Runtime | runtime/core/scripts/tools | 单写、垂直删除、合并 owner | T003–T012 |
| Tests | core/tests/scripts tests | 保留接口 oracle，删旧状态机专属 | T009–T017 |
| Distribution | Bundle/Runner/config | clean closure，无 history/tests | T015/T017 |
| Final review | real task/43 AC/independent review | 绑定完整候选 tree | T018 |

## Constitution Check

- **Constitution binding**：`{"artifact_kind":"constitution","ref":"CONSTITUTION.md","hash":"a4c63f0c3865fdc2ea83b1f2aea0a824608f65512a27a21e05a58e2d80e16001","id":"WORKFLOWHUB-CONSTITUTION","version":"1.5.0","clause_count":21}`

Phase 7 的 `--governance` 必须可执行校验版本号、修订记录、旧→新映射、`constitution-checklist.md` 条目数和条目内容；失败分别以 `constitution_version_drift`、`constitution_revision_drift`、`constitution_mapping_drift`、`checklist_count_drift`、`checklist_entry_drift` 非零退出。上面的 version/hash/clause_count 是 Phase 0 当前快照锚点，不是最终硬编码值；文档修订后由 T016 重新计算并把新值写入 handoff evidence。

F1、F2、F3、F4、F5、F6、F7、F8、F9、F10、Q1、Q2、Q3、S1、S2、S3、S4、S5、S6、S7、S8 全覆盖：薄 public facade；窄材料/事实/publication 契约；四材料推进；异源审查；不新增 gate；TaskHandle 外置事实；确认与授权分离；不建第二编排平台；baseline/E2E/mutation 可证伪；每个保留机制登记唯一 consumer、替代与删除条件。逐条最终以 `constitution-checklist.md` 复核。

## Complexity Trade-offs

选择一次性 writer cutover 和垂直删除，避免双轨兼容窗口。baseline collector 是一次可重算测试工具，不进入 runtime；inventory 和预算是诊断，不建新 gate。质量事实保留会让 task_dir 不是最少文件数，但避免用目录极简换取不可复盘。

## Phase 0: 冻结、基线行为与盘点

### Goal

先完成七类公开行为 baseline、历史 bytes 摘要和 V3 move-map 冻结，再进行任何 runtime 语义修改；唯一例外是已登记的 wh-review 临时证据桥修复，其 consumer、删除 owner 和回退边界必须固定在本 Phase 记录中。

### Files

- **NEW**：`tools/architecture/public-behavior-baseline.mjs`、`tests/contract/public-behavior-baseline.test.mjs`、`tests/fixtures/public-behavior-baseline/v1/manifest.json`、`tests/fixtures/public-behavior-baseline/v1/baseline.json`、`tests/fixtures/public-behavior-baseline/v1/candidate.json`、`tools/architecture/phase0-deletion-disposition.mjs`、`tests/integration/governance-diagnostics-non-gate.test.mjs`、`docs/architecture/retention-manifest.json`、`tools/architecture/history-inventory.mjs`、`docs/architecture/history-inventory.json`
- **MODIFY**：`tools/architecture/inventory.mjs`、`tools/architecture/complexity-report.mjs`、`runtime/review/phase-review-subject.mjs`、`workflows/build-code/phase-evidence.mjs`、`skills/wh-review/scripts/__tests__/phase-review-subject.test.mjs`、`tests/build-code-phase-evidence.test.mjs`、`tests/contract/review-layering.test.mjs`、`docs/architecture/repository-inventory.tsv`、`docs/architecture/complexity-baseline.json`、`docs/architecture/deletion-plan.json`、`docs/architecture/move-map.json`
- **MODIFY（T009 reference-audit owner）**：`tools/architecture/reference-audit.mjs`；Phase 4/T009 首次生成 live-consumer report，T009/T010/T012/T015/T017 只按登记 gate 消费。

### Tasks

T001、T002、T028、T029。

### Verify

`node tools/architecture/public-behavior-baseline.mjs capture --baseline=c3e1b1c5b29e5c0aa35beca7718787b4c7a95faf && node tools/architecture/public-behavior-baseline.mjs verify --baseline=c3e1b1c5b29e5c0aa35beca7718787b4c7a95faf && node tools/architecture/history-inventory.mjs verify-unchanged && node tools/architecture/inventory.mjs --check && node tools/architecture/complexity-report.mjs --check-hard-gates && node tools/architecture/phase0-deletion-disposition.mjs --check && npx vitest run tests/integration/governance-diagnostics-non-gate.test.mjs tests/contract/review-layering.test.mjs skills/wh-review/scripts/__tests__/phase-review-subject.test.mjs tests/build-code-phase-evidence.test.mjs`

`history-inventory.mjs capture-before` 只由 T002 在冻结动作中执行一次；若已存在冻结的 `{ref,content_hash}`，再次 capture 必须拒绝覆盖并非零退出。Phase 0 gate 使用 `verify-unchanged`，仅校验冻结 hash 与当前历史 bytes；AC-026 的真实 drift oracle 由 T011/T017 在后续实现写入之后执行。

`phase0-deletion-disposition.mjs` 的冻结 CLI 只接受 `--check` 和可选 `--slice=<comma-separated-slices>`；slice 集合固定为 `topology,recovery,pointer,phase,review,journal,projection`，未知参数或 slice 非零退出，所有选中 slice 与冻结 `deletion-plan.json` 一致时 exit 0，否则 exit 1。该检查先验证 Phase 0 锚定的 `{ref,content_hash}`，后续任务只能读取，不得更新删除集合。T029 在 Phase 0 出口复核 T028/T029 现有 receipt 的 `red_task_id`、`inverse_patch_hash`、ref/hash 后，才能宣告桥证据完整。

Phase 0 同时冻结 `docs/architecture/deletion-plan.json` 的 SHA-256，并把 `{ref, content_hash, frozen_at, owner:T002}` 写入 `docs/architecture/retention-manifest.json` 与 Phase 0 evidence；后续 deletion task 只能读取该 hash 并把 proof 写入独立 evidence，不得改动删除集合。

Phase 0 同时冻结 `docs/architecture/history-inventory.json` 的 `{ref, content_hash, frozen_at, owner:T002}` 并写入 `docs/architecture/retention-manifest.json` 与 Phase 0 evidence；T011/T017 对该文件只作 gate-only/read-only 消费，`verify-unchanged` 必须先校验冻结 hash，再比较历史 bytes，不能重算或覆盖基准。

`runtime/review/phase-review-subject.mjs` 与 `workflows/build-code/phase-evidence.mjs` 在 Phase 0/3 只承担临时的跨进程 snapshot/review 证据桥：唯一 consumer 是当前 `wh-review` Phase subject，不能成为新的业务控制链。当前 live consumer 已登记为 `KEEP_UNTIL_MIGRATION`；Phase 4 的 T009 只负责 `phase` slice 的 gate、路径和 consumer 审计，不拥有这两个 production bridge 的删除或行为修复。T012/T015 必须在 successor quality/material facts 完成且 reference-audit unexpected consumer=0 后重评估；proof 不完整时保持 KEEP，不以目录收敛为理由硬删。

### Knowledge

只使用原始 V3.2、当前代码和固定 baseline；外部研究不会改变本地迁移合同，因此 spec-research 记 `skipped`。

### STOP

任一行为不是从固定 commit 真实运行、任一生产文件/消费者未分类、历史清单会被写入时停止。

### Done

初始冻结完成：baseline collector 的七类 probe 仅完成 capture/verify round-trip，可重算且当前 case 数为 7；这不构成 spec 多 case、四值差异和写集合 hash 的 AC-008～AC-010 证据。`docs/architecture/complexity-baseline.json` 同时记录三个 hard-gate 当前值为 `0/0/0`，Phase 0 `--check-hard-gates` 必须以此实测记录为准，重算非零即 exit 1 并保持 `needs_revision`。历史目录改前 bytes 摘要与 V3 move-map 已冻结；全仓零未分类生产文件、零未知机制消费者；deletion-plan hash 已锚定且 deletion set 只读。`accepted_risk=AC008_PHASE_ORDER`：原始 spec 将 AC-008 固定为 Phase 0 产品退出，但真实多 case/四值基线必须在 Phase 3 由 T024/T021 取证，因此 Phase 0 仅记录 `incomplete`，不能继承 T001 初始样本；该偏离必须进入 build-plan 确认摘要并由用户确认，AC-008～AC-010 只能在 Phase 3 证据回填后标为完成。

### Risks and rollback

只新增诊断/fixture，并允许已登记的 Phase review evidence bridge 做跨进程 snapshot/object-store 修复；consumer、删除 owner 和回退边界固定，错误样本或分类可独立回退重算，不触碰业务 writer。

## Phase 1: 四材料与最小 task_dir

### Goal

建立新 task 的单一材料位置、最小外置事实目录和原子 writer；不双写旧结构。

### Files

- **NEW**：`runtime/task/material-workspace.mjs`、`tests/contract/material-workspace.test.mjs`、`runtime/task/task-store.mjs`、`runtime/evidence/quality-store.mjs`、`runtime/schemas/task-fact.v1.json`、`runtime/schemas/task-index.v1.json`、`tests/integration/minimal-task-storage.test.mjs`、`tests/contract/execution-identity.test.mjs`（T003 的普通编辑 RED 子范围）
- **MODIFY**：`runtime/stage/completion-predicates.mjs`、`tools/cli/task-bootstrap.mjs`、`tests/integration/atomic-write-faults.test.mjs`

### Tasks

T003、T004。

### Verify

`npx vitest run tests/contract/material-workspace.test.mjs tests/integration/minimal-task-storage.test.mjs tests/integration/atomic-write-faults.test.mjs`

### Knowledge

task_dir 结构以 spec §5/§7/§8 和原始 V3.2 §4.3 为唯一合同。

### STOP

需要复制四材料、读取 legacy accepted/checkpoint、双写或修改历史 task 时停止。

### Done

新 task 可创建、编辑、读取、重启；材料不复制；事实原子追加；旧许可证缺失不阻塞。

Phase 1 的 T003/T004 只记录 AC-023 的 atomic writer/storage sub-contract，状态为 `incomplete`，`reason_code=AC023_DISCHARGE_OWNED_BY_T026_T023`；AC-023 最终原子性/一致性故障注入与 discharge 仍由 T026/T023 负责，不能因 Phase 1 的 writer GREEN 提前关闭。

### Risks and rollback

新 writer 只服务新 task；失败回退本 Phase，历史目录保持只读。

## Phase 2: 前三阶段切换

### Goal

让 make-decision、build-spec、build-plan 只围绕四材料和质量事实执行，并修复 vNext 正式 publication 引导缺口。

### Files

- **NEW**：`tests/integration/vnext-official-stage-run.test.mjs`、`tests/integration/first-three-stage-cutover.test.mjs`
- **NEW**：`tests/contract/confirmation-authorization.test.mjs`
- **MODIFY**：`core/stage-runner.mjs`、`scripts/stage-runtime.mjs`、`core/task-kernel-implementation.mjs`、`core/task-handle.mjs`
- **MODIFY（T006 skill contract owner）**：`skills/decision-log/`、`skills/talk-with-zhipeng/`、`skills/grill-with-docs/`；只适配前三阶段四材料/单事实写入，不新增 stage 或推进 gate
- **READ/CONSUME**：现有 `workflows/make-decision/`、前三阶段 workflow/handler/content contract；本 Phase 不复制或改写它们的业务校验。`workflows/make-decision/steps.json` 只作稳定入口输入，由 T009/T010 的 reference audit 覆盖旧许可引用，不列入本 Phase 写集合。`tests/contract/stage-completion.test.mjs` 仅作 gate-only/read-only 回归输入，Phase 2 不拥有其断言写入；完整回归 owner 为 T023，后续机械整理由 T014 负责

### Runtime boundary

stage runner 在 `record_model=vnext-single-write` 时消费 handler 已认证的 canonical evidence：review/test/confirmation 事实必须绑定实际 ref/hash，AC 事实使用当前 stage 的结果证据包；没有对应证据只发布 `unknown` quality fact，只有全部必需事实 fresh/current 才生成 derived publication。这样保留 legacy writer 守卫，也不把确认、审查或 publication 身份变成普通编辑许可证。

### Tasks

T005、T006。

### Verify

`npx vitest run tests/integration/vnext-official-stage-run.test.mjs tests/integration/first-three-stage-cutover.test.mjs tests/contract/confirmation-authorization.test.mjs tests/contract/stage-completion.test.mjs`

### Knowledge

当前真实 RED 为 `legacy attempt writer is unavailable for vNext tasks`；正确修复是 vNext 直接写 quality/publication，保留 legacy 守卫。

### STOP

只能靠解除 legacy 守卫、产生 stage-result/accepted/current pointer 或把确认当推进许可时停止。

AC-003 的五阶段 discharge owner 是 Phase 3 的 T007/T008；Phase 2 的 T005/T006 对 AC-003 只记录 `incomplete`（`reason_code=AC003_DISCHARGE_OWNED_BY_T007_T008`），不能把前三阶段切换事实当作五阶段通过。

### Done

前三阶段在真实 vNext task 正式执行；不产生 legacy attempt/accepted/current pointer；计划确认只记录决定。AC-028、AC-029 由 Phase 2 关闭；`accepted_risk=AC014_PHASE_ORDER`：原始 spec 将 AC-014 固定为 Phase 2 退出，但其五阶段 E2E 只能在 Phase 3 执行，因此 AC-014 改由 T007/T008 discharge。T006 只保留 `incomplete`（`reason_code=AC014_DISCHARGE_OWNED_BY_T007_T008`），不得在 T007/T008 回填前关闭 Phase 2；build-code/verify-code、三条 E2E、identity 与 serious-finding 事实属于 Phase 3，不提前计入 Phase 2。该偏离必须进入 build-plan 确认摘要，由用户与 AC-041 一并裁决。

### Risks and rollback

保留 legacy 守卫；按 stage slice 回退，不用临时解除守卫作为正式路径。

## Phase 3: build-code、verify-code、E2E 与质量边界

### Goal

以 tasks 和当前质量事实完成实现/验证；三条最小 E2E 与质量边界测试通过。

### Files

- **NEW**：`runtime/schemas/quality-verify.v1.json`、`tests/integration/quality-store-concurrency.test.mjs`、`tests/integration/task-fact-index-consistency.test.mjs`
- **NEW（T007/T008）**：`tests/e2e/five-stage-normal.test.mjs`、`tests/e2e/five-stage-material-revision.test.mjs`、`tests/e2e/five-stage-idempotent-resume.test.mjs`、`tests/contract/doctor-interface.test.mjs`、`tests/contract/status-derivation.test.mjs`、`tests/integration/verify-freshness-selection.test.mjs`
- **MODIFY**：`core/stage-runner.mjs`、`core/task-kernel-implementation.mjs`、`tools/architecture/public-behavior-baseline.mjs`、`tests/contract/public-behavior-baseline.test.mjs`、`tests/fixtures/public-behavior-baseline/v1/manifest.json`、`tests/fixtures/public-behavior-baseline/v1/baseline.json`、`tests/fixtures/public-behavior-baseline/v1/candidate.json`、`tests/integration/atomic-write-faults.test.mjs`、`tests/integration/vnext-official-stage-run.test.mjs`、`skills/wh-review/scripts/review-materials.mjs`、`skills/wh-review/scripts/__tests__/review-source-materials.test.mjs`、`skills/wh-review/skill-bundle.json`、`runtime/evidence/quality-store.mjs`、`runtime/stage/completion-predicates.mjs`、`runtime/task/task-store.mjs`、`runtime/task/material-workspace.mjs`、`tests/contract/material-workspace.test.mjs`、`tests/integration/minimal-task-storage.test.mjs`、`tests/integration/governance-diagnostics-non-gate.test.mjs`
- **MODIFY（T007/T008）**：`workflows/build-code/`、`workflows/verify-code/`、`runtime/review/`、`runtime/evidence/freshness.mjs`、`runtime/interface/runtime-facade.mjs`、`scripts/stage-runtime.mjs`、`tests/contract/execution-identity.test.mjs`（T007 的 dirty-worktree 子范围）
- **READ/CONSUME（T023 gate-only）**：`tests/contract/stage-completion.test.mjs`、`tests/contract/confirmation-authorization.test.mjs`；Phase 2 T006 已建立前三阶段产品退出事实，本 Phase 仅由 T023 重新运行 completion-predicates 与 confirmation/authorization contracts 作为 remediation 回归 oracle，不在 Phase 3 写集合中。

### Tasks

T007、T008、T020、T019、T024、T021、T025、T022、T026、T023。

T007/T008 是本 Phase 的 build-code/verify-code、E2E、AC-014、identity 与 serious-finding owning tasks；T020～T023、T024～T026 只负责后续 remediation 与质量/基线证据，不覆盖 T007/T008 的产品退出条件。

`runtime/schemas/quality-verify.v1.json` 由 T023 新建并作为 `quality/verify.json` 的替代 schema。

### Verify

`npx vitest run tests/e2e/five-stage-normal.test.mjs tests/e2e/five-stage-material-revision.test.mjs tests/e2e/five-stage-idempotent-resume.test.mjs tests/contract/doctor-interface.test.mjs tests/contract/status-derivation.test.mjs tests/contract/material-workspace.test.mjs tests/contract/public-behavior-baseline.test.mjs tests/integration/verify-freshness-selection.test.mjs tests/integration/vnext-official-stage-run.test.mjs tests/integration/first-three-stage-cutover.test.mjs tests/integration/minimal-task-storage.test.mjs tests/integration/governance-diagnostics-non-gate.test.mjs tests/integration/atomic-write-faults.test.mjs skills/wh-review/scripts/__tests__/review-source-materials.test.mjs tests/integration/quality-store-concurrency.test.mjs tests/integration/task-fact-index-consistency.test.mjs tests/contract/execution-identity.test.mjs tests/contract/confirmation-authorization.test.mjs tests/contract/stage-completion.test.mjs && node runtime/evidence/check-skill-closure.mjs . && node tools/architecture/public-behavior-baseline.mjs verify --baseline=c3e1b1c5b29e5c0aa35beca7718787b4c7a95faf`

### Knowledge

完成谓词与推进资格分离；review unavailable 和 serious finding 允许修复但不能完成。

### STOP

出现 phase trace、transition journal、replacement review、假 PASS 或隐式不可逆授权时停止。

### Done

三条 E2E 通过；七行为多 case 职责稳定并输出四值差异结论；所有 Phase 3 新增/修改测试均在同一 snapshot 绿门中通过；质量 receipt 语义、写集合 hash、facts/index 一致性和并发幂等均有证据；质量缺口不锁修复也不假绿。

### Risks and rollback

按 build-code、verify-code、facade/E2E 三个 slice 回退；已写质量事实保持不可变。

## Phase 4: 垂直删除 operational lineage

### Goal

逐机制完成 consumer→replacement→negative test→production delete→schema/fixture/test/docs delete→reference audit。

### Files

- **MODIFY（T009 owner）**：`tools/architecture/reference-audit.mjs`；T009 在本 Phase 先取当前 live-consumer report，Phase 4 只扩展 KEEP allow-list 和明确 exit 语义。
- **NEW（replacement test owner T010）**：`tests/integration/journal-replacement.test.mjs`、`tests/integration/projection-replacement.test.mjs`。
- **MODIFY（bridge audit owner T009）**：`skills/wh-review/scripts/__tests__/phase-review-subject.test.mjs`；只审计 `runtime/review/phase-review-subject.mjs`、`workflows/build-code/phase-evidence.mjs` 的 consumer/path 和 replacement evidence，T009 不拥有两个 production bridge 的行为修复或删除；proof 不完整则三者保持 KEEP_UNTIL_MIGRATION。
- **bridge test owner override**：`tests/build-code-phase-evidence.test.mjs` 与 `skills/wh-review/scripts/__tests__/phase-review-subject.test.mjs` 只作 T009 gate-only/read-only consumer；T012 是 review/phase successor migration 的唯一 production migration owner，T017 final reference-clean 前二者保持 KEEP_UNTIL_MIGRATION，不进入 T009 删除写集合。
- **KEEP_UNTIL_MIGRATION（bridge oracle）**：`skills/wh-review/scripts/__tests__/phase-review-subject.test.mjs`、`tests/build-code-phase-evidence.test.mjs` 在 T012 的 review/phase successor migration 完成且 T017 无 allow-list `reference-audit --check` 通过前不得删除；T009 只 gate-only/read-only 审计，T012 只消费并记录迁移 RED/GREEN，二者不重复拥有删除写权限。
- **DELETE AFTER PROOF（仅在 KEEP 条件关闭后）**：上述 bridge 路径；当前 disposition 是 `KEEP_UNTIL_MIGRATION`，不属于本 Phase 删除集合。
- **MODIFY（replacement test owner T010）**：`skills/wh-review/scripts/__tests__/review-controller.test.mjs`；该测试只属于 `review` slice 的 replacement gate。
- **MODIFY**：`core/chain-topology.mjs`、`core/git-checkpoint.mjs`、`runtime/task/material-revision.mjs`、`runtime/schemas/task-material-revision.v1.json`、`tools/cli/ci-chain-check.mjs`、`tools/cli/check-task-record-paths.mjs`、`tools/cli/migrate-task-v2.mjs`、`tools/cli/phase-gate.mjs`、`scripts/runtime-cutover.mjs`、`config/runtime-fact-v2-sources.mjs`、`runtime/schemas/requirement-ledger.schema.json`、`runtime/schemas/requirements-coverage.schema.json`、`runtime/schemas/stage-content-evidence.v1.json`、`runtime/schemas/task-attempt.v2.schema.json`、`runtime/schemas/task-accepted.v2.schema.json`、`workflows/verify-code/metrics-writer.mjs`、`workflows/build-code/phase-evidence.mjs`、`tests/integration/progression-without-permits.test.mjs`、`tests/contract/legacy-zero.test.mjs`、`tests/build-code-phase-evidence.test.mjs`、`tests/build-code-preflight.red.test.mjs`、`tests/five-stage-audit-e2e.test.mjs`、`tests/five-stage-facts-v2.test.mjs`、`tests/phase-gate.test.mjs`、`tests/stage-content-host-independence.test.mjs`、`tests/stage-content-publication.test.mjs`、`tests/stage-interaction-contract.test.mjs`、`tests/stage-orchestrator-v2.test.mjs`、`tests/task-accepted-schema.test.mjs`、`tests/workflow-v2-contract.test.mjs`、`scripts/__tests__/ci-chain-check.test.mjs`、`scripts/__tests__/migrate-task-v2.test.mjs`、`core/audit-aggregator.mjs`、`core/journal-appender.mjs`、`core/journal-schema.mjs`、`core/receipt-schema.mjs`、`core/canonical-receipt-writer.mjs`、`runtime/evidence/receipt-writer.mjs`、`runtime/review/review-flow-authority.mjs`、`runtime/review/review-controller.mjs`、`runtime/review/phase-review-subject.mjs`、`runtime/review/stage-review-disposition.mjs`、`tools/cli/audit-aggregate.mjs`、`tests/audit-aggregator.test.mjs`、`tests/audit-p2.test.mjs`、`tests/official-component-receipts.test.mjs`、`core/__tests__/receipt-writer.test.mjs`、`skills/wh-review/scripts/review-runner.mjs`、`skills/wh-review/scripts/wh-review-cli.mjs`、`skills/wh-review/scripts/__tests__/review-runner.test.mjs`、`skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs`
- **KEEP**：`workflows/make-decision/steps.json`、`workflows/build-spec/steps.json`、`workflows/build-plan/steps.json`、`workflows/build-code/steps.json`、`workflows/verify-code/steps.json`；它们是五阶段正式合同，不由 Phase 4 删除或重写，T006–T008 只验证其稳定入口语义。
- **DELETE AFTER PROOF（仅限当前审计确认无 live consumer 的项）**：`core/chain-topology.mjs`、`core/git-checkpoint.mjs`、`tools/cli/audit-aggregate.mjs`、`tools/cli/ci-chain-check.mjs`、`tools/cli/migrate-task-v2.mjs`、`tools/cli/phase-gate.mjs`、`scripts/runtime-cutover.mjs`、`config/runtime-fact-v2-sources.mjs`、`runtime/schemas/requirement-ledger.schema.json`、`runtime/schemas/requirements-coverage.schema.json`、`runtime/schemas/stage-content-evidence.v1.json`、`runtime/schemas/task-attempt.v2.schema.json`、`runtime/schemas/task-accepted.v2.schema.json`、`workflows/verify-code/metrics-writer.mjs`，以及排除 `skills/wh-review/scripts/__tests__/phase-review-subject.test.mjs`、`tests/build-code-phase-evidence.test.mjs` 的 T009/T010 精确分配的 17 个纯旧状态机测试；上述两个 bridge oracle 在 T012/T017 条件满足前不进入删除集合；`core/audit-aggregator.mjs`、`core/journal-appender.mjs`、`core/journal-schema.mjs`、`core/receipt-schema.mjs` 因仍被 `runtime/evidence/receipt-writer.mjs` 及相关 receipt/journal 路径消费，当前列为 KEEP_UNTIL_MIGRATION，不进入本 Phase 删除集合；每一项仍需删除前后引用审计和最小回归。

- **KEEP_UNTIL_MIGRATION（当前不能删除）**：`core/canonical-receipt-writer.mjs`、`runtime/evidence/receipt-writer.mjs`、`core/audit-aggregator.mjs`、`core/journal-appender.mjs`、`core/journal-schema.mjs`、`core/receipt-schema.mjs`、`runtime/task/material-revision.mjs`、`runtime/schemas/task-material-revision.v1.json`、`runtime/review/review-flow-authority.mjs`、`runtime/review/phase-review-subject.mjs`、`workflows/build-code/phase-evidence.mjs`、`runtime/review/stage-review-disposition.mjs`、`tools/cli/check-task-record-paths.mjs`。这些文件的真实消费者和迁移责任必须写入 T012/T015 的 final disposition；replacement 测试不构成删除授权。T012 是 successor migration 的唯一实施 owner，T009/T010 只作 gate-only/read-only consumer；T010 的删除 oracle 必须在 `runtime/evidence/receipt-writer.mjs` 仍依赖旧 journal/audit 或相关测试/检查引用存在时停止。
`accepted_risk=AC017_019_PHASE_ORDER`：approved spec §5 将 AC-017～AC-019 固定在 Phase 0/4 产品退出，但当前 live consumer 需要 T012 successor migration；在 T017 无 allow-list reference-clean 与 final disposition 完成前保持 `incomplete`，discharge owner 为 T012/T015/T017，不能把 KEEP 或 replacement proof 记作完成。

`plan-task.v3` 当前只用 NEW/MODIFY 校验 touched path，因此上行 MODIFY 是结构合同中的“实施会触碰”；本行 DELETE AFTER PROOF 才是 disposition，二者不表示双 owner。

### Tasks

T009、T010。

### Verify

先执行 T009 的 `gate_cmd`（topology/recovery/pointer/phase 四个 slice），再执行 T010 的 `gate_cmd`（review/journal/projection 三个 slice）；每个 slice 仍使用矩阵中独立的 `replacement:<slice>` 过滤命令，不得用共享整文件测试替代归属明确的 oracle。

### Knowledge

只删除 successor/predecessor/selector/snapshot lineage/phase trace/historical correction/replacement review 等控制关系；单事实 provenance、review/test/confirm/auth 和 M14–M17 不删。

#### Slice replacement matrix

每个 slice 必须按 RED（旧控制依赖 fixture，exit 1）→ GREEN（替代路径，`replacement:<slice>` exit 0）→ production delete → 最小回归重跑的顺序执行；对应 replacement 命令未达到 exit 0 前不得删除生产入口。

- `topology` → `npx vitest run tests/integration/progression-without-permits.test.mjs -t "replacement:topology"`; before/after 只认该 slice 命令，分别 expected exit 1/0；删除命令 `node tools/architecture/phase0-deletion-disposition.mjs --check --slice=topology && node tools/architecture/reference-audit.mjs --check --slice=topology --allow-keep-until-migration=docs/architecture/retention-manifest.json`；evidence `evidence/phase-4/control-topology.json`。
- `recovery` → `npx vitest run tests/integration/progression-without-permits.test.mjs -t "replacement:recovery"`; before/after 只认该 slice 命令，分别 expected exit 1/0；删除命令 `node tools/architecture/phase0-deletion-disposition.mjs --check --slice=recovery && node tools/architecture/reference-audit.mjs --check --slice=recovery --allow-keep-until-migration=docs/architecture/retention-manifest.json`；evidence `evidence/phase-4/control-recovery.json`。
- `pointer` → `npx vitest run tests/integration/progression-without-permits.test.mjs -t "replacement:pointer"`; before/after 只认该 slice 命令，分别 expected exit 1/0；删除命令 `node tools/architecture/phase0-deletion-disposition.mjs --check --slice=pointer && node tools/architecture/reference-audit.mjs --check --slice=pointer --allow-keep-until-migration=docs/architecture/retention-manifest.json`；evidence `evidence/phase-4/control-pointer.json`。
- `phase` → `npx vitest run tests/integration/progression-without-permits.test.mjs -t "replacement:phase"`; before/after 只认该 slice 命令，分别 expected exit 1/0；删除命令 `node tools/architecture/phase0-deletion-disposition.mjs --check --slice=phase && node tools/architecture/reference-audit.mjs --check --slice=phase --allow-keep-until-migration=docs/architecture/retention-manifest.json`；evidence `evidence/phase-4/control-phase.json`。
- `review` → `npx vitest run skills/wh-review/scripts/__tests__/review-controller.test.mjs -t "replacement:review"`; before/after 只认该 slice 命令，分别 expected exit 1/0；删除命令 `node tools/architecture/phase0-deletion-disposition.mjs --check --slice=review && node tools/architecture/reference-audit.mjs --check --slice=review --allow-keep-until-migration=docs/architecture/retention-manifest.json`；evidence `evidence/phase-4/control-review.json`。
- `journal` → `npx vitest run tests/integration/journal-replacement.test.mjs -t "replacement:journal"`; before/after 只认该 slice 命令，分别 expected exit 1/0；该测试必须执行 `runtime/task/task-store.mjs`/`runtime/evidence/quality-store.mjs` 的替代写路径；删除命令 `node tools/architecture/phase0-deletion-disposition.mjs --check --slice=journal && node tools/architecture/reference-audit.mjs --check --slice=journal --allow-keep-until-migration=docs/architecture/retention-manifest.json`；evidence `evidence/phase-4/control-journal.json`。
- `projection` → `npx vitest run tests/integration/projection-replacement.test.mjs -t "replacement:projection"`; before/after 只认该 slice 命令，分别 expected exit 1/0；该测试必须执行 task fact/quality projection 的替代写路径；删除命令 `node tools/architecture/phase0-deletion-disposition.mjs --check --slice=projection && node tools/architecture/reference-audit.mjs --check --slice=projection --allow-keep-until-migration=docs/architecture/retention-manifest.json`；evidence `evidence/phase-4/control-projection.json`。
- Phase review evidence bridge 归入 `phase` slice，由 T009 消费该 slice 的 `replacement:phase` before/after oracle 与带 KEEP allow-list 的 `reference-audit`；该 audit 必须同时报告 `allowed_violations` 与 `unexpected_violations`，后者非空即失败。`skills/wh-review/scripts/__tests__/phase-review-subject.test.mjs` 与 `tests/build-code-phase-evidence.test.mjs` 只作被删 bridge 的 consumer/路径审计，不冒充独立替代测试；`replacement:phase` 不通过则 bridge KEEP_UNTIL_MIGRATION。

### STOP

任一 consumer、替代事实、负测或 retention ref 缺失时该机制族保持不删。

### Done

每个机制族都必须得到 `DELETED` 或 `KEEP_UNTIL_MIGRATION` 的明确 disposition；只有前者要求生产引用归零。live consumer 路径不能以“replacement proof 完整”直接删除，必须先由 T012/T015 完成 successor 迁移并重新生成 reference audit。Phase review evidence bridge 当前按 KEEP_UNTIL_MIGRATION 处理，直到 phase evidence、review flow 和 capture helpers 均有同一事实 successor；最终 deletion-list 必须报告精确路径、消费者、责任任务和未完成原因。

### Risks and rollback

一次只删一个机制族；每族独立恢复 diff，禁止用兼容 reader 回滚。

## Phase 5: 历史只读与质量保留

### Goal

证明历史 task 前后摘要一致，新运行时不读取历史链；质量和治理学习资料可定位且不作 gate。

### Files

- **NEW**：`tools/architecture/retention-audit.mjs`、`tests/integration/history-read-only.test.mjs`、`tests/integration/governance-learning-non-gate.test.mjs`
- **MODIFY**：`tools/architecture/history-inventory.mjs`
- **READ/CONSUME**：`docs/architecture/history-inventory.json` 只读使用 Phase 0 冻结的 `{ref,content_hash}`，不属于 T011 写集合

### Tasks

T011。

### Verify

`node tools/architecture/history-inventory.mjs verify-unchanged && node tools/architecture/retention-audit.mjs --check && npx vitest run tests/integration/history-read-only.test.mjs tests/integration/governance-learning-non-gate.test.mjs`

### Knowledge

历史数据不迁移、不补 hash、不改路径；必要读取只能是独立离线诊断，不进入 runtime progression。

### STOP

摘要变化、出现 importer/legacy reader/双写、raw review 或 M14–M17 无引用时停止。

### Done

历史 task 前后摘要一致；新 runtime 不读历史链；quality/M14–M17 可定位且不作 gate。

### Risks and rollback

本 Phase 禁止写历史目录；误写必须无损恢复，否则阻塞交付。

## Phase 6: 目录、测试与发行收敛

### Goal

只移动仍有真实 consumer 的文件，按 interface/contract/integration/e2e 收敛测试，并验证 Bundle/Runner 闭包。

### Files

- **MODIFY**：`core/stage-context.mjs`、`core/stage-handlers.mjs`、`core/stage-runner.mjs`、`core/stage-content-evidence.mjs`、`core/stage-completion-facts.mjs`、`core/task-handle.mjs`、`core/task-kernel-implementation.mjs`、`core/workspace.mjs`、`core/task-index.mjs`、`core/schemas/interaction-completion.v1.json`、`scripts/stage-runtime.mjs`、`scripts/task-close.mjs`、`skills/spec-specify/`、`skills/spec-clarify/`、`skills/spec-plan/`、`skills/spec-tasks/`、`skills/stage-step-receipts/`、`skills/audit-summary-carrier/`、`skills/review-response/`、`skills/test-strategy/`、`skills/debate/`、`skills/diagnosing-bugs/`、`skills/test-routing-advisor/`、`skills/workflowhub-host-protocol/`、`config/workflowhub.yaml`、`skills/catalog.yaml`、`tests/final-cutover-guards.red.test.mjs`、`tests/stage-content-evidence.test.mjs`、`tests/task-close-delivery.test.mjs`、`tests/terminal-runtime-blockers.test.mjs`、`scripts/__tests__/stage-runtime-five-stage-e2e.test.mjs`、`core/__tests__/task-kernel-publish.test.mjs`、`core/__tests__/task-handle.test.mjs`、`tests/e2e/five-stage-normal.test.mjs`、`tests/e2e/five-stage-material-revision.test.mjs`、`tests/e2e/five-stage-idempotent-resume.test.mjs`、`tests/contract/stage-completion.test.mjs`、`runtime/distribution/runner-release.mjs`、`runtime/distribution/skill-bundle-release.mjs`、`tests/integration/distribution-closure.test.mjs`、`tests/integration/runner-clean-install.test.mjs`、`tools/architecture/inventory.mjs`、`tools/architecture/complexity-report.mjs`、`docs/architecture/repository-inventory.tsv`、`docs/architecture/move-map.json`、`workflows/build-spec/`、`workflows/build-plan/`、`runtime/evidence/check-skill-closure.mjs`、`tools/cli/check-contract.mjs`、`tools/cli/smoke-local-skill-dispatch.mjs`、`package.json`
- **MODIFY（T013 MERGE targets）**：`skills/wh-review/SKILL.md`、`skills/wh-review/scripts/review-result.mjs`、`skills/wh-review/skill-bundle.json`、`skills/wh-review/manifest.json`；T013 只写 MERGE 目标和 hash sync，T019 仍拥有 Phase 3 packet/hash。
- **MODIFY（T013 skill contract owner）**：`skills/isolated-browser-qa/`、`skills/intake-decision-review/`、`skills/plan-ceo-review/`、`skills/plan-design-review/`、`skills/plan-eng-review/`、`skills/qa-only/`、`skills/verify-change/`；只适配 packet/fact、quality/tests 路由和 bundle disposition，不把这些 skill 默认加入核心 Bundle
- **NEW（T015 final disposition）**：`evidence/final/deletion-list.json`、`evidence/final/retention-list.json`
- **T013 MERGE target / owner**：`skills/wh-review/SKILL.md`、`skills/wh-review/scripts/review-result.mjs`（最小 disposition fact）、`skills/wh-review/skill-bundle.json`、`skills/wh-review/manifest.json` 由 T013 写入合并结果；T019 仍拥有 Phase 3 `review-materials.mjs` packet/hash，T013 只做 Phase 6 merge 后 hash sync。正向 oracle：`npx vitest run skills/wh-review/__tests__/human-brief-behavioral.test.mjs && node runtime/evidence/check-skill-closure.mjs . && npm run smoke:skill-dispatch`。
- **MOVE（T012 test owners）**：`core/__tests__/task-handle.test.mjs → tests/contract/task-handle.test.mjs`、`core/__tests__/task-kernel-publish.test.mjs → tests/integration/task-kernel-publish.test.mjs`、`scripts/__tests__/stage-runtime-five-stage-e2e.test.mjs → tests/e2e/stage-runtime-five-stage-e2e.test.mjs`
- **MODIFY（final disposition owner T015）**：`tools/architecture/phase0-deletion-disposition.mjs`、`tools/architecture/retention-audit.mjs`、`docs/architecture/retention-manifest.json`；先读证据并更新 disposition，再按 proof 执行已登记的 ARCHIVE/REMOVE。`tools/architecture/reference-audit.mjs` 与 `tools/architecture/history-inventory.mjs` 是永久 READ/KEEP oracle，T015 只把它们写入最终 retention list，不执行归档。

### DELETE AFTER PROOF

`skills/spec-specify/`、`skills/spec-clarify/`、`skills/spec-plan/`、`skills/spec-tasks/`、`skills/stage-step-receipts/`、`skills/audit-summary-carrier/`、`skills/test-strategy/` 由 T013 在 Phase 6 按 T002 的 disposition matrix 执行 MERGE/REMOVE；这些 skill 删除不由 Phase 4/T009 执行。

**DELETE AFTER PROOF（T015）**：`tools/architecture/retention-audit.mjs`；`tools/architecture/phase0-deletion-disposition.mjs` KEEP 至 Phase 4 deletion-list 完成并保留其独立 `deletion_manifest_drift`/`deletion_slice_mismatch` contract；`tools/architecture/reference-audit.mjs` 与 `tools/architecture/history-inventory.mjs` 永久 READ/KEEP，分别作为最终 reference-clean 与历史摘要 oracle，不进入删除集合。`docs/architecture/retention-manifest.json` 保留并回写最终 disposition，最终删除/保留事实由 T015 写入 `evidence/final/deletion-list.json` 与 `evidence/final/retention-list.json`。

`tools/architecture/phase0-deletion-disposition.mjs`、`tools/architecture/retention-audit.mjs`、`tools/architecture/reference-audit.mjs` 是前置证明工具，不进入 Runner/Bundle；T015 在 Phase 6 读取其最终 evidence 和 retention-manifest 后只对已满足 delete_condition 的工具执行 ARCHIVE/REMOVE。`reference-audit.mjs` 与 `history-inventory.mjs` 的永久 READ/KEEP disposition 不依赖后置事实，T017 仍须执行 `reference-audit --check` 与 `history-inventory.mjs verify-unchanged`，T018 只绑定这些 receipts。实际 disposition 写入 `evidence/final/deletion-list.json` 与 `evidence/final/retention-list.json`。`docs/architecture/retention-manifest.json` 由 T015 回写最终 disposition，不删除。

**MOVE source→target contract**：`core/stage-context.mjs → runtime/stage/stage-context.mjs`；`core/stage-handlers.mjs → runtime/stage/stage-handlers.mjs`；`core/stage-runner.mjs → runtime/stage/stage-runner.mjs`；`core/stage-content-evidence.mjs → runtime/evidence/stage-content-evidence.mjs`；`core/stage-completion-facts.mjs → runtime/evidence/stage-completion-facts.mjs`；`core/task-handle.mjs → runtime/task/task-handle.mjs`；`core/task-kernel-implementation.mjs → runtime/task/task-kernel-implementation.mjs`；`core/workspace.mjs → runtime/task/workspace.mjs`；`core/task-index.mjs → runtime/task/task-index.mjs`；`core/schemas/interaction-completion.v1.json → runtime/schemas/interaction-completion.v1.json`；`scripts/stage-runtime.mjs → tools/cli/stage-runtime.mjs`；`scripts/task-close.mjs → tools/cli/task-close.mjs`。每项移动前后登记 source/target/owner/consumer、pre/post blob hash 和 move-map proof；target 验证通过后才删除旧 owner。

- **baseline consumer proof**：`tools/architecture/public-behavior-baseline.mjs` 只作 T012 gate-only consumer；baseline commit 解析旧入口 `scripts/stage-runtime.mjs`，candidate worktree/tree 在 MOVE 后解析当前 `tools/cli/stage-runtime.mjs`，固定 argv/环境/行为身份不变，并在 move-map proof 中记录两套 entry resolution 与 collector hash。
上述 12 个 target 在 Phase 0 candidate snapshot 均为 `missing`，所以 T012 是 source→new target 的职责合并/路径收敛，不是假定已有第二份实现的机械覆盖；若实施时任一 target 已出现，必须停止当前 MOVE，先登记 source/target 语义差异并补该 pair 的 RED/GREEN，再继续删除旧 owner。
T012 同时登记三项测试 MOVE：`core/__tests__/task-handle.test.mjs → tests/contract/task-handle.test.mjs`、`core/__tests__/task-kernel-publish.test.mjs → tests/integration/task-kernel-publish.test.mjs`、`scripts/__tests__/stage-runtime-five-stage-e2e.test.mjs → tests/e2e/stage-runtime-five-stage-e2e.test.mjs`；每项记录 source/target/pre/post blob hash，target 验证通过后才删除 source。T014 只消费迁移后的 target 路径。

T012 还拥有当前 `KEEP_UNTIL_MIGRATION` successor migration，不得只记录 KEEP 而把 AC-017/018/019 推给不存在的后续任务。迁移矩阵固定为：`core/canonical-receipt-writer.mjs`、`runtime/evidence/receipt-writer.mjs`、旧 `core/journal-*`/`core/audit-aggregator.mjs`、`core/receipt-schema.mjs` → `runtime/task/task-store.mjs`（task facts）与 `runtime/evidence/quality-store.mjs`（review/test/phase facts）；`runtime/task/material-revision.mjs`、`runtime/schemas/task-material-revision.v1.json` → `runtime/task/material-workspace.mjs` 与当前材料 receipt；`runtime/review/review-flow-authority.mjs`、`runtime/review/stage-review-disposition.mjs`、`runtime/review/phase-review-subject.mjs`、`workflows/build-code/phase-evidence.mjs` → `runtime/evidence/quality-store.mjs` 加外置 phase evidence；`tools/cli/check-task-record-paths.mjs` → `tools/architecture/reference-audit.mjs` 的 gate-only path contract。`skills/wh-review/scripts/__tests__/phase-review-subject.test.mjs` 与 `tests/build-code-phase-evidence.test.mjs` 是该 review/phase successor 的 KEEP bridge oracles，T009 只 gate-only 审计，T012 只消费 RED/GREEN；T012 精确文件同时包含上述 source、successor target、对应 schema 和 replacement tests；以同一 task 的 `T012-KEEP-MIGRATION-RED` disposable-copy 配对 RED，逐 family 记录 `red_task_id`、`inverse_patch_hash`、旧 consumer、RED/GREEN、pre/post hash、删除条件和 `reference-audit.mjs --check` 无 allow-list 的 exit 0；replacement tests 仍由 T009/T010/T003/T004 原 owner gate-only，T012 只修改 production source/target 与 move-map。任一 successor 未完成则 T017 不得关闭 AC-017/018/019。T012 gate 还必须重跑 `tests/integration/minimal-task-storage.test.mjs`、`tests/contract/material-workspace.test.mjs`、`tests/integration/quality-store-concurrency.test.mjs`、`tests/integration/task-fact-index-consistency.test.mjs`，证明 T004→T023→T012 owner sequence 的 storage contract 未回归。

### Tasks

T012、T013、T014、T027、T015。

### Verify

`node tools/architecture/inventory.mjs --check && npm run check && npx vitest run tests/e2e/five-stage-normal.test.mjs tests/e2e/five-stage-material-revision.test.mjs tests/e2e/five-stage-idempotent-resume.test.mjs tests/contract/stage-completion.test.mjs tests/contract/legacy-zero.test.mjs tests/integration/distribution-closure.test.mjs tests/integration/runner-clean-install.test.mjs tests/integration/vnext-official-stage-run.test.mjs tests/integration/first-three-stage-cutover.test.mjs tests/contract/confirmation-authorization.test.mjs tests/contract/execution-identity.test.mjs tests/contract/task-handle.test.mjs tests/integration/task-kernel-publish.test.mjs tests/e2e/stage-runtime-five-stage-e2e.test.mjs`

T014 的 gate 还必须运行 `npx vitest run tests/integration/mutation-guards.test.mjs`，并比较删除前后同一固定五项 mutant 子集（identity/tree hash、missing stage completion、failed major review、unauthenticated confirmation、bundle pollution）的 kill 数；新增 mutant、完整映射和 AC-041 由 T017 负责，断言清单本身不能作为唯一删除安全证明。

### Knowledge

目录移动是机械收敛，不承载行为修改；测试减少必须来自机制删除，不能删除接口质量覆盖。

### STOP

tracked file 无 owner/consumer/disposition、Bundle 含 tests/node_modules/history 或移动未登记 move-map 时停止。

### Implementation checkpoint（不是 Phase 6 退出）

所有 tracked file 唯一 owner/consumer/disposition；测试按稳定接口组织；Bundle/Runner clean closure 通过。AC-041 仍是 spec 固定的 Phase 6 退出条件；T017 在最终 Phase 7 运行一次 mutation/full suite 并回填证据。在 T017 回填前，Phase 6 只能记录 `incomplete`（`reason_code=AC041_DISCHARGE_OWNED_BY_T017`），不得标为 Phase 6 完成或进入最终确认。build-plan 确认摘要必须显式写出 `accepted_risk=AC041_PHASE_ORDER`，引用原始 spec 的 Phase 6 退出条件与“full suite 只执行一次”约束，允许 T030/T016 在该 implementation checkpoint 尚未关闭时准备最终验证但不得进入最终确认；这是用户可见的顺序偏离，不得静默改写。

### Risks and rollback

行为变化与机械 move 分离；按 move-map 反向恢复，不新增 bridge。

## Phase 7: 治理固化、最终验证与交接

### Goal

同步治理文档，完成候选与 baseline 七行为比较、mutation、必要 full suite、clean install、独立 review 和用户 review pack。

`review-tree-manifest.json` 固定可复算的 `include_globs`：`runtime/**`、`core/**`、`tools/**`、`scripts/**`、`workflows/**`、`skills/**`、`tests/**`、`config/**`、`docs/**`、`specs/**`、`AGENTS.md`、`CONSTITUTION.md`、`constitution-checklist.md`、`CONTEXT.md`、`package.json`、`package-lock.json`；固定 `exclude_globs`：`.git/**`、`node_modules/**`、task 外置存储、`evidence/phase-*/**`、`evidence/final/**`、`specs/workflowhub-complexity-governance-v3-20260802/tasks.md`、manifest 自身。四材料中的 `tasks.md` 全文件仍由 wh-review 审查，但不进入 `review_tree_hash`，因此其实施状态可在审查后回填；manifest 写入 include/exclude globs、排序后的实际 paths 和 `review_tree_hash`，`--require-same-review-tree` 只按这些 globs 重算。

### Files

- **NEW**：`evidence/final/m14-m17-impact.md`、`evidence/final/change-summary.md`、`evidence/final/review-tree-manifest.json`、`evidence/final/verification-summary.json`、`evidence/final/final-coverage.json`、`tests/contract/verify-final-coverage.test.mjs`；该测试由 T030 固定 RED 断言、T016 只改生产 CLI 并复核既有 RED receipt 的 ref/hash。
- **MODIFY**：`AGENTS.md`、`CONSTITUTION.md`、`constitution-checklist.md`、`CONTEXT.md`、`tools/architecture/verify-final-coverage.mjs`、`tests/integration/mutation-guards.test.mjs`

### Tasks

T030、T016、T017、T018。

### Verify

先执行 T030 RED，确认 `verify-final-coverage` 的 `missing_ac`、`ac_evidence_unresolvable`、`ac_evidence_generic_fill`、`review_tree_drift`、`review_raw_hash_missing`、`reference_consumer_residual`、`constitution_version_drift`、`constitution_revision_drift`、`constitution_mapping_drift`、`checklist_count_drift`、`checklist_entry_drift`、`final_evidence_binding_drift`、`handoff_incomplete` 和 `unknown_argument` 每个失败类别都能独立非零；再执行 T016 GREEN。CLI flag 是选择性检查：未传入的类别明确跳过，exit 0 只表示已请求类别全部满足；T016 的 task gate 只执行 `--governance --handoff` 选择性检查，完整最终命令必须传入全部 required flags。随后执行 T017 `gate_cmd` 一次（它是本方案唯一的 `npm test` 入口），并在同一 gate 中执行不带 allow-list 的 `node tools/architecture/reference-audit.mjs --check`；只有 `violations=[]` 且 `allowed_violations=[]` 才能把 AC-017/018/019 记为可通过，任何 KEEP 残留都写入 `DELETION_KEEP_UNTIL_MIGRATION` 并保持 `incomplete`，不得由 43/43 计数掩盖。T018 在独立 review 前生成 `evidence/final/review-tree-manifest.json`：按排序后的候选生产/测试/config/docs/specs 路径计算 `review_tree_hash`，排除 `.git/`、`node_modules/`、task 外置存储、`evidence/final/` 和该 manifest 自身。独立 review 绑定这个 scope/hash；审查后只允许写入被排除的 `evidence/final/`，`--require-same-review-tree` 重新计算同一 scope，`review_tree_drift` 不比较审查后 handoff 产物。Phase 7 Verify 不重新运行 full suite，只读取 T017 的 receipt/hash；完整 `node tools/architecture/verify-final-coverage.mjs --require-ac=43 --require-same-review-tree --require-review-raw-hash --require-reference-clean --governance --handoff` 只在 T017/T018 依赖事实齐全后执行。merge 授权时比较同一 `review_tree_hash`，并另行校验 final evidence refs/hash；`--handoff` 对 final evidence refs/hash 的缺失、错绑、漂移输出 `final_evidence_binding_drift`，该类别必须由 T030 RED/T016 GREEN 覆盖；review scope 漂移必须重审。三方 provider 数量不成为 spec 外硬门槛。

### Knowledge

review tree 的 hash 域明确排除 `specs/workflowhub-complexity-governance-v3-20260802/tasks.md` 全文件；wh-review 仍接收并审查完整四材料，`tasks.md` 的执行状态回填属于排除域，merge 比较只针对生产/测试/config/docs/specs（不含 tasks.md）及另行绑定的 final evidence refs/hash。

最终结论分别报告 behavior comparison、focused/full/mutation、review、history、retention、distribution 和人工交接；不压成单一分数。

### STOP

存在 `behavior_regression`、未处置 serious finding、历史摘要变化、治理文档冲突、review pack 不完整或 clean install 失败时不得进入 verify-code 用户确认。

### Done

七行为逐项有结论；配置路由要求的独立 review 事实绑定当前 tree，每个 unavailable/invalid 均保留；43/43 AC、治理文档和 review pack 齐全，状态真实达到 ready_for_confirmation。

### Risks and rollback

回到最早失败 Task 同 task 修复，只重跑受影响检查；不改写失败/review/unavailable 事实。

---

## Repair Addendum：补齐原方案与当前实现缺口（2026-08-03）

> 本节只追加，不修改上文任何原始计划、历史 task、已记录状态或失败事实。它是同一 WorkflowHub task 的修复补充，不创建 successor task，不引入新的 Phase、状态机、许可证或重复审查。

## 1. 追加范围与最终原则

本补充专门处理上一轮审计确认但原 plan/tasks 没有真正落地的缺口：

- vNext 仍依赖 legacy attempt/accepted/current/revision/checkpoint/flow 链；
- LFS pointer 与 provider/test 实际读取的 hydrated bytes 没有统一绑定；
- `start-run` 的跨文件写入不是事务；
- 多 agent 修改边界只做事后 freshness 检查，没有正式写入前的快照闭合；
- verify 的 AC evidence、`context_map`、`evidence_map` 结构合法但语义没有逐 AC 对齐；
- provider 失败、非法输出和 `revise_required` 被错误汇总成通过的风险；
- ignored 生成物会阻塞清理，但没有分类证据；
- 业务 Git 交付后没有“不伪造 formal accepted”的人工收口事实；
- 旧 control-plane 消费者、迁移 CLI、schema、bridge/shim 和测试仍使项目保持复杂。

最终架构只保留这条最短路径：

```text
四份当前材料
  -> material_digest / source_digest
  -> append-only task facts + quality facts
  -> 一次独立 review fact
  -> 即时派生质量结论与 ready_for_confirmation
  -> 独立 authorize 事实
```

永久规则：

1. 四份材料是唯一当前工作真相；不新增 `materials/current.json`、`requirements/current.json` 或任何 current projection。
2. 不新增 `task-accepted.v3`、accepted shadow copy、checkpoint、run history、lease、selector、successor、recovery、rebind、reopen、continuation 或 phase trace。
3. `accepted` 只保留为派生业务语义或历史只读记录；新运行时不读取/写入 `results/*/accepted.json`。
4. 质量事实说明发生了什么，不决定普通修复能否继续；结构错绑、身份错绑、快照错绑和正式写入错误必须 fail-loud。
5. provider 失败、权限失败、超时、非法 JSON、材料不完整和 serious finding 都如实保存，绝不转换为 `pass`。
6. 只做一次当前树最终验证和一次独立 review；没有新增信息不重跑全量测试或 review。

## 2. 目标分层与影响边界

| 层 | 唯一职责 | 允许持久化 | 本补充明确禁止 |
| --- | --- | --- | --- |
| 当前材料 | 五阶段业务工作 | 四份 Markdown 材料 | current/revision/accepted projection |
| 运行时 | task、workspace、原子写、stage 执行 | task identity、facts、quality | lineage、run/journal 控制链 |
| 质量 | test、AC、review、verify | append-only facts、raw ref/hash | 质量成为推进许可证 |
| 分发 | Bundle、Local Runner | 发布 manifest | history、tests、治理状态 |
| 维护 | inventory、reference、history、complexity | 离线诊断输出 | runtime 依赖、普通任务 gate |

不在本补充中重放 KnowledgeDigest/PaperBuilder 事故、不改业务项目、不迁移或重写历史 task、不把 M14–M17 变成运行时平台。历史目录仍只读；无真实 consumer 的 skill 只做 Bundle 排除或在另有授权后物理移动。

## 3. 12 项问题的最终修复映射

| 编号 | 缺口 | 修复边界 | 完成证明 |
| --- | --- | --- | --- |
| R-01 | LFS 快照不一致 | `git-worktree-snapshot` 同时记录 Git tree、实际 content digest、LFS pointer 状态；未 hydrated 时正式写入报错 | pointer/hydrated fixture、重启复读、同一 source digest 绑定 |
| R-02 | vNext/legacy writer 混用 | 新 task 只写 facts/quality；legacy writer 仅供历史只读审计，生产路径不再调用 | vNext 五阶段 E2E 无 attempt/accepted 写入，旧入口负测无写入 |
| R-03 | accepted 链缺失 | 不新增 accepted successor；close/verify 改读当前材料、quality facts、确认/授权事实并即时派生 | 无 accepted 文件仍可 run/review/verify；formal close 只认派生结论与 authorize |
| R-04 | vNext 材料不完整 | bootstrap 直接校验四份当前材料；缺失只返回 `MATERIAL_INCOMPLETE`，不生成空 current/revision | 删除 legacy pointer 后新 task 可创建、编辑、重启 |
| R-05 | verify map 不完整 | `quality/verify.json` 生成权威 AC 列表和一对一 leaf；map 只做导航/覆盖索引 | 43/43 AC 各有唯一 leaf、receipt/hash、snapshot、scenario、oracle、outcome |
| R-06 | AC 字段不完整 | summary 只读取结构化 leaf，不从 opaque nested evidence 猜测；缺失写 unknown/unavailable | 重复、缺失、额外 AC、generic fill 全部被负测杀死 |
| R-07 | provider 不稳定 | 一次 group dispatch；失败只写 attempt/unavailable；不自动 format correction、closure review 或改写 verdict | Kimi/Cursor 的实际 status/raw/hash 可回看，失败不生成 pass |
| R-08 | start-run 非事务 | 移除公开 `start-run`；`run` 先完成 preflight，再一次原子写正式 fact，journal 不再是成功条件 | preflight/重复/并发/中断测试无孤立 run、无半条事实 |
| R-09 | 多 agent 边界 | review/verify 使用同一 source digest；正式写入前再次比较当前 digest，变化即 `FORMAL_SNAPSHOT_MISMATCH` | 并发修改时 publication 不写入旧快照；不新增持久 lease |
| R-10 | ignored 清理不完整 | close preflight 分类 tracked/untracked/ignored；未知 ignored 不自动删除，正式清理报 `FORMAL_CLEANUP_UNSAFE` | `.vite` fixture 进入分类结果；无授权不删除任何路径 |
| R-11 | CLI 路由误用 | public 只保留七类行为；内部 writer/prepare/start-run/publish/record/recover 不可直接路由 | 旧命令 fail-loud，七类入口和 clean install 通过 |
| R-12 | 正式 close 无降级 | 使用现有 task-facts append-only 写路径追加 `manual_delivery_close` 事实，记录 business delivered/formal blocked；业务确认复用现有 `confirm --stage=verify-code`，不扩展 `authorize` 的 operation 集合，不新增状态文件、不生成 accepted | manual fact 可回看，formal close 仍显示 blocked，后续可继续正式 close |

### 3.1 修复项到任务的唯一归属

R-01/R-09 归 R003；R-02/R-03/R-04 归 R002；R-05/R-06/R-07 归 R005；R-08 归 R004；R-10/R-12 归 R006；R-11 由 R002 先锁定负测、R007 在删除后复核；最终 review-tree/raw/hash 与全量覆盖只归 R008，R009 只消费结果。该映射是说明文字，不新增 task、状态或证据账本。

## 4. 实现设计

### 4.1 当前材料与单写路径

- `runtime/task/material-workspace.mjs` 直接读取并校验 `decision-log.md`、`spec.md`、`plan.md`、`tasks.md`。
- `material_digest` 是四份当前材料字节的确定性摘要；它是质量事实 provenance，不是版本链、CAS 指针或继续工作的许可证。
- 删除新任务路径对 `materials/current.json`、`requirements/current.json`、`material_revision`、`generation`、`previous_ref` 的读取和写入。
- `runtime/task/task-store.mjs`、`runtime/evidence/quality-store.mjs` 是唯一新写入 owner；task 事实 append-only，质量文件 create-only/原子替换。
- `stage-runner` 按 `record_model` 只进入 vNext writer；不得在 handler 成功后无条件调用 `publishAttempt` 或 `acceptAttempt`。
- `status`、`verify`、`task-close` 即时读取四份材料和事实派生结论；不存在 `accepted.json` 也不能阻止普通编辑或正式 verify。

### 4.2 快照、LFS 与正式写入边界

- `captureExecutionSnapshot()` 生成当前 source manifest：`head_commit`、`git_tree`、`content_tree`、每个文件的 `git_blob_oid`、`content_sha256` 和 `filter`。
- LFS pointer 文件必须与 hydrated content 分开识别；pointer 仍在工作树时，正式质量事实写入报 `FORMAL_LFS_CONTENT_UNAVAILABLE`，不使用 `GIT_CONFIG_*` 绕过，也不把 pointer 当业务内容。
- snapshot manifest 作为质量事实的 `output_ref`/`source_digest` 内容保存，不建立 `snapshots/`、previous snapshot 或 snapshot lineage 目录。
- review、test、verify、publication 和 authorize 事实必须引用同一个 source digest；正式写入前重新计算并比较，变化时报 `FORMAL_SNAPSHOT_MISMATCH`，写入零字节。
- 普通材料编辑不需要 snapshot 身份；只有正式事实写入和不可逆交付需要该 fail-loud 检查。

### 4.3 执行、并发和清理

- 删除 public `start-run`、独立 run record 和“先 run 后 journal”的双写；`run` 负责 preflight、执行和一次事实写入。
- 同一 invocation/idempotency key 重试返回同一事实；不同内容或不同 source digest 不能复用旧事实。
- 不新增持久 formal lease。并发正式写入靠 create-only 原子写和写前 source digest recheck；第二个 writer 返回 `FORMAL_SNAPSHOT_MISMATCH` 或 `FORMAL_WRITE_CONFLICT`。
- close preflight 使用 Git 的 tracked/untracked/ignored 全量分类，生成当前 authorization fact 的分类内容摘要；未知 ignored 只阻止清理，不自动执行 `git clean -fdx`。
- manual delivery 通过现有 task-facts append-only 写路径追加 `manual_delivery_close` 事实，字段明确区分 `business_status=delivered` 与 `formal_status=blocked`；如需业务确认，复用 `confirm --stage=verify-code`。`authorize` 仍只处理既有不可逆 operation，不新增 `manual-close` 公共操作；该事实不是 accepted、completed 或新的任务状态。

### 4.4 Review 与 AC evidence

- 权威 AC 列表来自当前 `spec.md`；每个 AC 在 `quality/verify.json` 中恰好一个 canonical leaf。
- leaf 必须包含 `scenario`、`oracle`、`actual_outcome`、`evidence_type`、`coverage_limits`、`exceptions`、test receipt/hash、source digest 和 evidence ref/hash。
- `context_map` 只说明 reviewer 上下文锚点；`evidence_map` 只索引 AC 覆盖；两者不能生成或覆盖 AC 结论。
- `ac-evidence-summary` 不再从任意 nested evidence 推断字段；缺失、重复、额外 ID、错误 hash 或错误 snapshot 只生成 unknown/unavailable。
- provider 只收到一个冻结 packet、一个 AC summary 和两个 map；不发送完整 evidence tree、宿主绝对路径或重复 summary。
- 每个 review identity 正常只调用一次 configured group。provider completed 但 JSON 非法、权限失败、超时、取消、SAME_SOURCE 或协议失败都只保留 attempt/failure fact，不生成 semantic pass。
- `revise_required` 只产生可回看的 resolution fact，不自动二审、不改写原始 verdict、不创建 replacement review 链。

### 4.5 删除与项目收敛

先切断 consumer，再删 owner；每个删除 slice 必须同时完成 production import、schema、fixture、专属测试、文档和术语审计。首批必须重新审计并处理：

- `publishAttempt`/`acceptAttempt`/`readAcceptedAt` 及其旧 schema；
- `materials/current`、`requirements/current`、material revision/generation/parent/previous；
- `git-checkpoint`、journal/audit control projection；
- review-flow authority、flow head、round/selector、phase trace、reopen/rebind/recovery；
- migrate-task-v2、task-migrate-target-repo-root、旧 public publish/record/recover 路由；
- `core/` 与 `skills/wh-review/scripts/` 的 re-export shim；
- 只为上述机制服务的 fixture/test/docs/config。

`reference-audit` 必须扫描真实 import、动态路径、schema、CLI help、skill catalog、Bundle manifest 和测试引用；空 target 数组不得解释为 consumer=0。R001 只使用现有 `--allow-keep-until-migration=docs/architecture/retention-manifest.json` 对已登记 KEEP 做过程分类，未登记残留仍失败；R007/R008 的最终 clean audit 不带 allow-list。没有完整 replacement、负测、retention 和可恢复 diff 的 slice 保持 KEEP，不为复杂度数字强删。

R002/R007 复用现有 `tests/contract/runtime-facade.test.mjs` 与 `tests/contract/public-behavior-baseline.test.mjs` 锁定旧 `prepare`/`start-run`/内部 publish/record/recover 路由 fail-loud；只有现有负测缺口时才补一个最小断言，不新增路由表或第二套 CLI。

## Current material synchronization (r015)

本节是对本文件历史计划记录的追加更正，不改写上方原始方案、历史完成记录或 task 时间。

- 当前树中的 `runtime/review/stage-review-disposition.mjs` 是 vNext 保留的生产能力，负责 serious finding 的 pause/risk acceptance；它由 `runtime/stage/stage-handlers.mjs`、`runtime/task/task-kernel-implementation.mjs` 和 public `review:risk`/`authorize:risk` 路由消费。
- 因此该文件的当前 disposition 是 `KEEP`（vNext risk API），不是 `KEEP_UNTIL_MIGRATION`，不再由 T012/T015/T017 迁移后删除；权威登记见 `docs/architecture/retention-manifest.json`。
- 上方早期 `KEEP_UNTIL_MIGRATION` 和 R007/R008 中关于该文件的文字只保留为历史审计记录；本节与 retention manifest 共同构成当前执行口径，禁止按历史文字删除该生产能力。
- R007 的当前真实表述是“生产风险事实链和 focused tests 消费该能力”，不是“仅测试消费”。该更正不新增阶段、task、review 或推进许可证。

## Current disposition supersession registry (r017)

本登记是当前执行规则，不改写上方历史计划正文；下列历史文字全部作废，不得作为删除、迁移或保留的执行依据：

- plan 中把 `runtime/review/stage-review-disposition.mjs` 列入 `KEEP_UNTIL_MIGRATION`、T012/T015/T017 successor 或迁移后删除的段落，均标记为 `SUPERSEDED_BY_R015_KEEP_VNEXT_RISK_API`。
- plan 中把 `runtime/review/review-flow-authority.mjs`、`runtime/review/phase-review-subject.mjs`、`workflows/build-code/phase-evidence.mjs` 列为当前 KEEP bridge 的段落，均标记为 `SUPERSEDED_BY_R007_DELETED_AND_AUDITED`；这些路径不得恢复。
- 当前唯一可执行 disposition 来源是 `docs/architecture/retention-manifest.json` 与本节：`stage-review-disposition.mjs` 为 `KEEP`，三个已删除路径不属于 KEEP；`tools/cli/check-task-record-paths.mjs` 为 live `KEEP`。
- 任何 task、脚本或人工操作若按上述历史段落尝试删除 risk API、恢复已删 review/phase bridge，必须停止并报告材料冲突；本登记不是新 task、状态、审查或推进许可证。

## 5. 最终唯一验证包

所有最终证据只绑定一个 candidate tree 和一个四材料 digest，不能混用旧 snapshot、旧 task、旧 provider 结果或多个 final ledger。验证顺序：

1. 当前 tree、四材料、历史 bytes、inventory 和 complexity 重新对账；
2. 受影响 focused tests、三条最小 E2E、LFS/事务/并发/ignored/manual-close 负测；
3. Bundle/Runner clean install 和无 allow-list reference audit；
4. 一次 `npm run check`；
5. 仅在前述结果稳定且确有新增信息时执行一次 `npm test`；
6. 生成逐 AC `quality/verify.json`、唯一 review packet、provider raw/status/hash 和 handoff summary；R008 是唯一 review packet/raw/hash owner，R009 只消费，不再次审查；
7. 从当前材料与事实派生 `ready_for_confirmation`，不生成 accepted projection；
8. 用户确认后仍须独立 `authorize`，manual delivery close 只是一条事实，不伪造 formal close，也不新增 `authorize` operation。

本验证包不把复杂度预算、provider 数量、历史 unavailable 或审查报告计数变成普通修复 gate；它只决定能否真实宣称完成、能否进行不可逆交付。

## 6. 回滚与停止条件

- 每个 repair task 保存 owned path、旧/新 blob hash 和可恢复 patch；不改历史 task 数据。
- 发现隐藏 consumer、source digest 漂移、LFS 未 hydrated、AC leaf 不一对一、provider 失败被改写、ignored 未分类或旧 control-plane 仍被生产读取时，停止该 task，回到最早失败点。
- 不用新 bridge、allow-list、successor、replacement review 或额外 task 掩盖失败。
- 本补充完成的标准是：12 项问题都有当前实现和负测证据；原始方案要求归零的生产 control-plane consumer 归零；所有质量缺口仍可回到同一 task 修复；正式 verify、确认和授权边界真实可回看。

## Repair Addendum correction

- R008 是 review-tree、provider raw/status/hash 与最终 coverage 的唯一 owner；本补充的临时方案审查只使用一次 `3rd-review` 直连，R009 只消费结果，不重复审查。
- 最终 coverage 必须执行 `node tools/architecture/verify-final-coverage.mjs --require-ac=43 --require-same-review-tree --require-review-raw-hash --require-reference-clean --governance --handoff`；R001 的 KEEP 分类与 R007/R008 的最终 clean audit 分开。
- 上方原始 task 的 `completed_at` 事实保持不动；本补充没有新的 `completed_at`，任何补充时间只能标为 `addendum_recorded_at`，不代表 R001–R009 已完成。
- `review-runner` 在同一个 review identity 内最多允许一次 OUTPUT_INVALID 的协议格式修正；这只是同会话的传输契约修复，不是二审、replacement review 或新的推进许可证。修正失败仍记录为 invalid/unavailable，原始 attempt 与语义结论不被改写。
- 最终覆盖只引用当前等价 oracle：`tests/contract/review-materials-contract.test.mjs` 与 `tests/e2e/vnext-five-stage-current.test.mjs`；已删除的历史测试名只可出现在迁移/更正记录，不得继续作为当前 coverage ref。

## Current execution authority (r019 targeted repair completion)

本节只同步当前 R008 修复事实，不改写历史计划、task 时间或已发生的 provider 事实。

- R008 当前修复已完成：推进与 formal acceptance 已硬隔离；vNext publication 默认是 progression-only；推进判据只读取当前四份材料。
- 本轮只执行相关 `node --check`、`git diff --check` 和 3 个 focused test files（53 tests，全部通过）；不重跑完整测试，不新增 review loop。
- `3rd-review` 初审的 `REVISE` 结论及其修复保留为质量事实；没有第二次独立 review，不把它改写为 pass。质量警告不阻塞 R009 handoff。
- **next_task**：R009；R009 只做 handoff/用户确认边界，不自动 authorize、commit、push、merge、archive、cleanup 或 formal close。

## Current execution authority (r018 repair synchronization)

本节是当前执行状态的唯一补充口径，不改写上方原始计划、历史 R008 completion record 或已发生的 provider 事实。

- R008 历史 `completed` 记录只代表当时 candidate tree 的历史事实；在当前树继续修复期间，当前状态为 `in_progress`，R009 不得开始。
- r018 3rd-review 是本轮唯一方案审查，使用 Kimi/K3 与 Cursor/Grok；两者共同指出 quality 路径迁移、公共 writer 路由、独立不可逆授权和材料状态对账缺口。修复后只允许一次定向复审，不使用 wh-review，不新增 review 链。
- 当前实现必须同时满足原始方案 §4.3/§5/§10、AGENTS 的 vNext 永久实施边界、公共七行为和 task 目录最小结构；`receipts/`、旧 `reviews/` 仅可作为非 vNext 历史读取兼容，不得被 vNext writer/reader 使用。
- 未形成新的正式 `accepted.json`；验证、确认、授权、业务 Git 交付和 formal close 仍是不同事实。质量证据不能成为继续修复的许可证。

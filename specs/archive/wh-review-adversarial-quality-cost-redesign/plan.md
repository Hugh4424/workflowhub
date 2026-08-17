# 实现计划：WorkflowHub 高质量低成本异源审查

- **Input**：`decision-log.md`、`spec.md`
- **Template version**：`plan-task.v3`
- **Planning status**：待工程审查、异源审查和用户确认

## Quick Read

- **Goal**：九个审查面只审影响交付质量的问题；配置几个 reviewer 就执行几个；失败只按唯一 owner 恢复；状态写回不再触发 P5 重审；ModelTest 能用固定样本比较修改前后质量、成本和失败率。
- **Non-goals**：不新增第五材料、第六 stage、公共命令、review 推进许可证、历史 lineage/rebind/reopen；不让 ModelTest 进入日常运行；不把材料治理当审查主目标。来源：D-003、D-007、D-011、FR-GOV-001..003。
- **Before**：WorkflowHub 同时承担部分重试和来源判断；packet 范围偏大；finding 合同偏弱；P5 使用完整快照绑定；mini-task 可接受调用方自报状态；ModelTest 没有九面成对基准。
- **After**：WorkflowHub 只生成九面最小语义请求并消费规范结果；3rd-review 管 provider 生命周期、deadline 和有限恢复；mini-task 复用同一协议；ModelTest 独立盲测 baseline/candidate。
- **Main risk**：三仓协议同时变化导致混合版本误运行，或真实评测调用量过大。
- **Next step**：先完成已有 P1-P5 事实，再补 P6 正式 verify/close 一致性；真实 540-leg 评测前先生成调用计划并 STOP 检查配置、版本、预算。

## Technical Context

### Global Constraints

- **Verified facts**：当前 WorkflowHub public runtime 仍只有 `doctor/status/run/review/verify/confirm/authorize`；当前材料仍只有 decision/spec/plan/tasks；review/test/evidence 只是事实。`config.json` 是 reviewer 数量和 profile 的唯一来源。
- **Language / runtime**：三仓均使用 Node.js ESM；测试入口为 `node --test`；不得引入仅供本功能使用的新运行时框架。
- **Primary dependencies**：复用 WorkflowHub `wh-review`、3rd-review V4 broker、ModelTest evaluation-assets；不新增服务依赖。
- **Storage / state**：规范结果仍写 task `quality/reviews/`；测试/评测事实写 `quality/tests/` 或 ModelTest report；不新增 current projection、receipt 或第二完成记录。
- **Testing**：确定性 fixture 先行；真实 provider 只在 P1 smoke 和 P5 基准运行；失败原样保留，不能删出分母。
- **Target environment**：本地 macOS 当前三仓；旧 WorkflowHub consumer 继续读 v2，新 WorkflowHub 对旧 broker fail loud。
- **Scale / scope**：9 个 surface、2 个 mini-task surface、3 个仓库、两个用户配置文件、固定 6 case×2 version×5 run×配置 reviewer 的评测矩阵。
- **Unresolved facts**：P5 实际调用总量取决于执行时两个配置文件；P5 先生成 plan-only 账单，不能在 plan 中硬编码总数。
- **Workspace mapping**：`3rd-review/...`、`ModelTest/...`、`user-config/...` 是文件归属名，不是在 WorkflowHub worktree 新建同名目录。P1 cwd 是任务专属 3rd-review worktree，P2/P3 cwd 是当前 WorkflowHub CandidateWorkspace，P4 cwd 是任务专属 ModelTest worktree；两个 `user-config/...` 分别映射真实 `/Users/Hugh/.config/...` 文件。每个 Phase 开始记录 repo root、worktree、HEAD、source-manifest hash 和 dirty summary。

## Code Anchors

- **Verified anchors**：`skills/wh-review/scripts/review-runner.mjs` 提交请求；`skills/wh-review/scripts/review-provider-client.mjs` 接收 broker 结果；`skills/mini-task/scripts/mini-task-runner.mjs` 组织 mini-task；`runtime/stage/completion-predicates.mjs` 定义正式 stage 事实；`core/task-close.mjs` 准备交付关闭；3rd-review `lib/broker.mjs` 管 provider 调度；ModelTest `scripts/run-*` 管离线评测。
- **Existing interfaces**：3rd-review V4 request + result v1/v2；WorkflowHub canonical review result；task facts JSONL；ModelTest bundle/scorecard/runner 模式。
- **Read now**：`CONSTITUTION.md`、`constitution-checklist.md`、三仓现有协议/schema/runner 和相关测试。
- **Must read before task**：每张任务卡列出的精确文件；外仓开始编辑前读取各自 `AGENTS.md` 和工作树状态。
- **Context mode**：Full — 跨三仓协议、失败语义和真实外部调用，Lite 会漏掉 consumer/兼容边界。

### Reuse → Extend → New

| Capability | Decision | Existing anchor | Reason / removal condition |
| --- | --- | --- | --- |
| provider 调度 | extend | `3rd-review/lib/broker.mjs` | 唯一生命周期 owner |
| 九面路由 | extend | `third-review-host-config.mjs` | 配置即事实 |
| packet 构造 | extend | `review-materials.mjs` | 逐面最小材料 |
| canonical result | extend | `canonical-review-result.mjs` | 保留唯一事实格式 |
| semantic hash | new | `review-semantic-projection.mjs` | consumer 是 P5 复审判断；被统一投影替代时删除 |
| v3 协议 | new | `workflowhub-result-v3.mjs` | consumer 是 WorkflowHub；v2 consumer 清零后再评估收敛 |
| 九面 benchmark | new | ModelTest `wh-review-adversarial/v1` | consumer 是离线发布评测；评测退役时归档 |
| verify/close 事实一致性 | extend | `runtime/stage/completion-predicates.mjs` + `core/task-close.mjs` | 共享六项 verify 事实；不新增完成记录；合同替代或 close 删除后移除 |

## Solution Design

### Overview

请求链只有一条：WorkflowHub 根据 surface 选择问题顺序、最小材料、finding 合同和配置中的 reviewer；3rd-review 对每个 profile 建独立 attempt，执行 deadline 与有限恢复；WorkflowHub 将成员事实转为 canonical result，但不再外层重试、不用 adapter 名猜 SAME_SOURCE。

P5 的有效性绑定改成确定性 semantic projection。任务状态、时间戳、review 输出等记录字段不参与 hash；需求、决定、行为 diff、接口、配置、直接 consumer、测试/oracle 和 review contract 参与。真实语义变化只重审受影响主题一次；写回 T010 不改变 hash，直接进入 aggregate。

mini-task 不新增 stage。设计审查和实施审查是两条独立 surface，分别复用九面路由、packet、finding、失败和 canonical result 合同；同一范围不再同时走普通审查。ModelTest 通过真实 WorkflowHub CLI 做 A/B 盲测，只输出离线事实。

P6 只修正式事实闭合：`completion-predicates.mjs` 继续是唯一 stage 完成规则，`task-close.mjs` 消费同一组 verify 事实，不再只检查测试和 review。测试 receipt 的 source digest 与当前交付材料快照分开；材料只写回时复用 receipt/result，代码或真实语义变化时拒绝旧事实。close confirmation 与 verify 人工确认、Git 不可逆授权继续分开。

### Module responsibilities

#### 3rd-review broker

- **Responsibility**：provider session、deadline、同 session repair、允许的一次 fresh retry、终态与 usage/timing/provenance。
- **Consumes**：V4 request、受信 profile 配置。
- **Produces**：`workflowhub-result.v3`，并继续支持旧 v2 consumer。
- **Must not decide**：surface 问题顺序、材料范围、finding 是否影响产品完成。

#### WorkflowHub review semantics

- **Responsibility**：surface 解析、问题顺序、材料 allowlist、finding schema、语义投影、canonical 展示。
- **Consumes**：四份当前材料、task facts、代码/测试精确锚点、v3 result。
- **Produces**：规范 review request、canonical member/aggregate facts、用户可读报告。
- **Must not decide**：provider 恢复策略、动态 reviewer 数、stage 完成。

#### mini-task integration

- **Responsibility**：在已有 mini-task 流程中各触发一次设计/实施审查，绑定完整用户结果和适用 AC。
- **Consumes**：相同 wh-review 协议与一次性采集的实施证据。
- **Produces**：recorded/unavailable/incomplete 事实。
- **Must not decide**：调用方自报 pass、第六 stage、重复普通审查。

#### ModelTest benchmark

- **Responsibility**：固定 mutation/control、盲名交错、严格 matcher、逐面统计质量/成本/失败。
- **Consumes**：版本固定的 WorkflowHub CLI、route config、bundle、scorecard。
- **Produces**：baseline/candidate 原始 attempts、comparison 和报告。
- **Must not decide**：日常 WorkflowHub 是否继续、review 是否完成产品任务。

### Interfaces, data, and lifecycle

- **Interfaces / schemas**：V4 request 保持 `request_id/surface/material_manifest/profiles/contract_version`；新增 `workflowhub-result.v3`，固定 `schema_version/request_id/surface/config_hash/members/aggregate`。member 固定 `profile_id/source_id/adapter/model/context_identity/independent/heterologous/status/binding/attempts/retry_counts/usage/timing/deadline_ms/error/provenance/findings`；成员终态只允许 `completed/failed/timed_out/cancelled/same_source`，aggregate 只允许 `completed/incomplete/unavailable`。三类计数分别为 provider-internal、same-session-repair、fresh-execution，不能相加后再次恢复；v1/v2 不改语义。
- **Data flow / state**：validate request → resolve configured profiles → parallel member attempts → member terminal facts → aggregate fact → WorkflowHub canonical projection；单成员 timeout 不取消其他成员。
- **Canonical state mapping**：Host 在 dispatch 前发现路径/必需输入/hash/material key 错误时直接写 `structural_error` 且 0 provider call；broker aggregate `completed` + findings 非空映射 `completed_with_findings`，`completed` + findings 为空映射 `completed_no_findings`；broker `incomplete/unavailable` 原样保持，不与 stage completion 混淆。
- **API contract**：N/A — 没有网络 API；CLI/stdin JSON 协议保持 V4 request，response 版本升级为可协商 v3。
- **UI / external code**：CLI 报告用大白话分开 findings、provider 失败、成本和下一步；不显示 provider pass。
- **Fail-loud behavior**：新 WorkflowHub 遇到旧 broker 返回 `PROTOCOL_INCOMPATIBLE` 且 0 provider call；缺 surface route、缺正数 deadline、关键材料超限、结果 schema 无效都明确 unavailable，不 fallback。发布顺序固定为 3rd-review v3（仍服务 v2）→ WorkflowHub v3 consumer → mini-task → benchmark；回滚顺序相反。只有已发布 v2 consumer 清零且另一次兼容审计确认后，v2 才可另立任务删除。

## File Boundary

以下为计划边界；任务执行前若精确文件不存在，只能按 NEW 创建；发现还需其他生产文件必须 STOP 回 plan。

### NEW

- `3rd-review/lib/workflowhub-result-v3.mjs`
- `3rd-review/lib/recovery-policy.mjs`
- `3rd-review/docs/workflowhub-result-v3.md`
- `3rd-review/test/workflowhub-result-v3.test.mjs`
- `3rd-review/test/recovery-policy.test.mjs`
- `skills/wh-review/contracts/workflowhub-result.v3.json`
- `skills/wh-review/scripts/review-semantic-projection.mjs`
- `skills/wh-review/scripts/__tests__/review-provider-client-v3.test.mjs`
- `skills/wh-review/scripts/__tests__/review-semantic-projection.test.mjs`
- `skills/wh-review/scripts/__tests__/make-decision-direction-reveal.test.mjs`
- `tests/integration/wh-review-v3-broker-contract.test.mjs`
- `ModelTest/evaluation-assets/subjects/wh-review-adversarial/v1/surface-index.json`
- `ModelTest/evaluation-assets/subjects/wh-review-adversarial/v1/release-manifest.json`
- `ModelTest/evaluation-assets/mutations/wh-review-adversarial/v1/mutation-catalog.json`
- `ModelTest/evaluation-assets/oracle/wh-review-adversarial/v1/target-oracles.json`
- `ModelTest/evaluation-assets/contracts/wh-review-benchmark-v1.mjs`
- `ModelTest/evaluation-assets/bundles/wh-review-adversarial-v1.0.0.json`
- `ModelTest/evaluation-assets/registry/v4.json`
- `ModelTest/evaluation-assets/scorecards/wh-review-benchmark-v1.0.0.json`
- `ModelTest/evaluation-assets/scorecards/wh-review-benchmark-v1.1.0.json`
- `ModelTest/evaluation-assets/scorecards/wh-review-benchmark-v1.2.0.json`
- `ModelTest/evaluation-assets/schemas/wh-review-benchmark-case.schema.json`
- `ModelTest/evaluation-assets/schemas/wh-review-benchmark-run.schema.json`
- `ModelTest/evaluation-assets/schemas/wh-review-benchmark-attempt.schema.json`
- `ModelTest/evaluation-assets/schemas/wh-review-benchmark-projection.schema.json`
- `ModelTest/evaluation-assets/schemas/wh-review-benchmark-comparison.schema.json`
- `ModelTest/evaluation-assets/schemas/wh-review-benchmark-report.schema.json`
- `ModelTest/evaluation-assets/scoring/wh-review-benchmark-matcher.mjs`
- `ModelTest/evaluation-assets/scoring/wh-review-benchmark-score.mjs`
- `ModelTest/evaluation-assets/scoring/wh-review-benchmark-evaluator-v1.1.0.mjs`
- `ModelTest/evaluation-assets/scoring/wh-review-benchmark-evaluator-v1.2.0.mjs`
- `ModelTest/evaluation-assets/scripts/validate-wh-review-benchmark.mjs`
- `ModelTest/evaluation-assets/scripts/plan-wh-review-benchmark.mjs`
- `ModelTest/evaluation-assets/scripts/run-wh-review-benchmark.mjs`
- `ModelTest/evaluation-assets/scripts/compare-wh-review-benchmark.mjs`
- `ModelTest/evaluation-assets/scripts/report-wh-review-benchmark.mjs`
- `ModelTest/evaluation-assets/scripts/replay-wh-review-history.mjs`
- `ModelTest/evaluation-assets/baselines/wh-review-adversarial-v1-history-ledger.json`
- `ModelTest/evaluation-assets/tests/wh-review-benchmark-assets.test.mjs`
- `ModelTest/evaluation-assets/tests/wh-review-benchmark-matcher.test.mjs`
- `ModelTest/evaluation-assets/tests/wh-review-benchmark-score.test.mjs`
- `ModelTest/evaluation-assets/tests/wh-review-benchmark-runner.test.mjs`
- `ModelTest/evaluation-assets/tests/wh-review-benchmark-comparison.test.mjs`
- `ModelTest/evaluation-assets/tests/wh-review-benchmark-report.test.mjs`
- `ModelTest/evaluation-assets/tests/wh-review-benchmark-compatibility.test.mjs`
- `ModelTest/evaluation-assets/tests/wh-review-history-replay.test.mjs`
- `quality/tests/T010-final.json`
- `quality/tests/T009-plan.json`
- `quality/evidence/wh-review-benchmark-plan.json`
- `quality/evidence/wh-review-benchmark-comparison.json`
- `quality/evidence/wh-review-history-replay.json`
- `quality/tests/T013-close-final.json`
- `quality/evidence/p6-close-freshness.json`

### MODIFY

- `3rd-review/lib/broker.mjs`
- `3rd-review/lib/config.mjs`
- `3rd-review/lib/process.mjs`
- `3rd-review/lib/provider-failure.mjs`
- `3rd-review/SKILL.md`
- `3rd-review/docs/adr/0001-v4-cli-contract.md`
- `3rd-review/docs/exceptions.md`
- `3rd-review/test/broker.test.mjs`
- `3rd-review/test/process.test.mjs`
- `3rd-review/test/delivery-outcome.test.mjs`
- `3rd-review/test/new-runtime-integration.test.mjs`
- `3rd-review/test/managed-session-lifecycle.test.mjs`
- `user-config/3rd-review/config.json`
- `skills/wh-review/manifest.json`
- `skills/wh-review/contracts/provider-protocol.md`
- `skills/wh-review/contracts/make-decision.md`
- `skills/wh-review/contracts/build-spec.md`
- `skills/wh-review/contracts/build-plan.md`
- `skills/wh-review/contracts/build-code.md`
- `skills/wh-review/contracts/verify-code.md`
- `skills/wh-review/contracts/mini-task-design.md`
- `skills/wh-review/contracts/mini-task-implementation.md`
- `skills/wh-review/scripts/review-provider-client.mjs`
- `skills/wh-review/scripts/third-review-host-config.mjs`
- `skills/wh-review/scripts/review-runner.mjs`
- `skills/wh-review/scripts/wh-review-cli.mjs`
- `skills/wh-review/scripts/review-result.mjs`
- `skills/wh-review/scripts/review-materials.mjs`
- `runtime/review/stage-materials.json`
- `runtime/review/integration-review-subject.mjs`
- `runtime/review/schemas/attempt.schema.json`
- `runtime/review/schemas/result.schema.json`
- `runtime/review/canonical-review-result.mjs`
- `runtime/evidence/acceptance-evidence-validator.mjs`
- `runtime/stage/stage-handlers.mjs`
- `runtime/stage/completion-predicates.mjs`
- `core/task-close.mjs`
- `skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs`
- `skills/wh-review/scripts/__tests__/integration-review-subject.test.mjs`
- `skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs`
- `skills/wh-review/scripts/__tests__/review-runner.test.mjs`
- `skills/wh-review/scripts/__tests__/simple-contracts.test.mjs`
- `skills/wh-review/scripts/__tests__/schema-validator.test.mjs`
- `tests/integration/verify-freshness-selection.test.mjs`
- `skills/mini-task/scripts/mini-task-runner.mjs`
- `tests/integration/mini-task-delivery.test.mjs`
- `tests/integration/mini-task-a-resume.test.mjs`
- `tests/integration/vnext-official-stage-run.test.mjs`
- `tests/e2e/vnext-five-stage-current.test.mjs`
- `tests/integration/review-test-close-freshness-matrix.test.mjs`
- `tests/integration/vnext-delivery-close.test.mjs`
- `tests/contract/stage-completion.test.mjs`
- `tests/official-component-receipts.test.mjs`
- `tests/final-cutover-guards.red.test.mjs`
- `user-config/workflowhub/config.json`
- `ModelTest/evaluation-assets/README.md`

### DO NOT TOUCH

- `workflows/*/SKILL.md`：本次改 runtime/wh-review 合同，不复制五阶段控制面。
- `3rd-review/lib/attachments.mjs`、`lib/runtime.mjs`、`lib/continuation-materials.mjs`、`lib/provider-ids.mjs`、`scripts/3rd-review.mjs`：现有 transport/runtime 非本问题 owner，除非 RED 证明必须改并返回 plan。
- ModelTest 既有 US-03/US-04/US-05 assets、`docs/prd.md`、monitoring：保持旧评测链不变。
- 所有历史 accepted/run/receipt/review-flow/snapshot lineage：只读。

## Technical Decisions

### DEC-001 — 协议由 3rd-review 统一 provider 生命周期

- **Problem**：多层 retry、timeout 和来源判断相乘，导致慢、贵且结果失真。
- **Options**：继续双层控制；WorkflowHub 全接管；3rd-review 唯一接管。
- **Selected**：extend 3rd-review，WorkflowHub 删除外层恢复判断。
- **Reason**：provider 生命周期只有一个 owner，最少重复状态。
- **Consequence / risk**：需要 v3 协议和混合版本保护。
- **Fallback**：旧 consumer 继续 v2；新 consumer 对旧 broker fail loud。

### DEC-002 — 逐面问题顺序和最小材料

- **Problem**：通用提示词和超大 packet 让 reviewer 花 token 查流程而不是找产品缺陷。
- **Options**：统一长 prompt；只裁材料；九面独立合同。
- **Selected**：extend 现有 wh-review，以 surface registry 管 prompt order、required/optional/forbidden、finding 字段。
- **Reason**：问题角度与输入一起收窄，直接提升有效 finding 密度。
- **Consequence / risk**：合同维护面增至九面，必须共享 schema 和测试，不能复制 runner。
- **Fallback**：单面合同可独立回退，不影响其他 route。

### DEC-003 — P5 使用 deterministic semantic projection

- **Problem**：T010 写回改变完整快照，导致无限“最后一次复核”。
- **Options**：忽略所有写回；模型摘要；确定性字段投影。
- **Selected**：new `review-semantic-projection.mjs`。
- **Reason**：记录字段不触发，真实行为/合同变化必触发，可测试、可解释。
- **Consequence / risk**：漏投影字段会误沿用旧结果。
- **Fallback**：版本升级使 hash 改变并强制一次受影响复审。
- **F10 real threat**：重复 provider 调用与旧审查误复用都是真实风险。
- **F10 existing cover**：完整 snapshot 只覆盖 freshness，但误把记录变化当语义变化。
- **F10 bypassable**：不能由调用方传 hash 或 pass；由 runtime 从 allowlist 字段计算。
- **F10 maintenance cost**：每次新增审查语义字段要更新投影 fixture。
- **F10 disposition**：keep。

### DEC-004 — mini-task 复用合同，不新增 stage

- **Problem**：mini-task 设计/实施也要异源审查，但不能重复普通审查。
- **Selected**：extend 路由和 runner，两个专用 surface 替代同范围普通 review。
- **Reason**：共享执行/失败/finding 合同，避免第二状态机。
- **Consequence / risk**：route 缺失必须 unavailable，不能默认 passed。
- **Fallback**：该 mini-task 事实 incomplete，仍可安全修复。

### DEC-005 — ModelTest 建独立九面 benchmark

- **Problem**：没有固定 mutation/control 就无法证明“更好且更便宜”。
- **Selected**：new `wh-review-benchmark-v1`，不修改既有 US 链。
- **Reason**：独立 consumer、版本化样本、严格 matcher，避免污染现有评分权威。
- **Consequence / risk**：真实运行成本大，必须先 plan-only。
- **Fallback**：只发布不可计算/失败事实，不以少量样本冒充通过。
- **F10 real threat**：prompt 优化容易凭主观感觉自证成功。
- **F10 existing cover**：现有 ModelTest 没有 9 surface/mini-task 样本。
- **F10 bypassable**：runner 直接调用真实 WorkflowHub CLI，失败不得从分母删除。
- **F10 maintenance cost**：新增 surface 时必须新增 mutation/control/oracle。
- **F10 disposition**：keep。

### DEC-006 — 不可变运行清单与原子 leg 状态

- **Problem**：不绑定版本和配置会把同一版本误当 A/B；真实调用若在终态落盘前中断，自动“补缺失”会重复付费。
- **Options**：运行时读 latest；只存汇总；先冻结 manifest 并在 dispatch 前原子写 started。
- **Selected**：extend benchmark run schema。plan-only 生成不可变 run manifest，绑定 baseline/candidate source-manifest hash、3rd-review hash、bundle/scorecard/config bytes hash、route/profile、leg id 和 output root；runner 在每次调用前原子记录 `started`。
- **Reason**：重复执行只跳过 completed；`started` 但无可信 terminal 的 leg 保持 `ambiguous/unavailable`，绝不自动重跑。
- **Consequence / risk**：中断 leg 可能不可计算，但不会重复花费或伪造结果。
- **Fallback**：只有用户另行明确指定具体 leg 后，才能创建新的 replacement run；原 run 不改写。

## Test Strategy

| Target | Task | Role | gate_cmd / expected_exit | Oracle / evidence_path |
| --- | --- | --- | --- | --- |
| AC-10..13 | T001 | RED | `node --test test/workflowhub-result-v3.test.mjs test/recovery-policy.test.mjs test/broker.test.mjs test/process.test.mjs test/delivery-outcome.test.mjs test/new-runtime-integration.test.mjs test/managed-session-lifecycle.test.mjs` / nonzero | ORACLE-PROTOCOL / `quality/tests/T001.json` |
| AC-10..13 | T002 | GREEN | same / 0 | ORACLE-PROTOCOL / `quality/tests/T002.json` |
| AC-01..16,21..26 | T003 | RED | `node --test skills/wh-review/scripts/__tests__/review-provider-client-v3.test.mjs skills/wh-review/scripts/__tests__/review-semantic-projection.test.mjs skills/wh-review/scripts/__tests__/make-decision-direction-reveal.test.mjs skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs skills/wh-review/scripts/__tests__/integration-review-subject.test.mjs skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs skills/wh-review/scripts/__tests__/review-runner.test.mjs skills/wh-review/scripts/__tests__/simple-contracts.test.mjs skills/wh-review/scripts/__tests__/schema-validator.test.mjs tests/integration/wh-review-v3-broker-contract.test.mjs tests/integration/verify-freshness-selection.test.mjs` / nonzero | ORACLE-WH / `quality/tests/T003.json` |
| AC-01..16,21..26 | T004 | GREEN | same / 0 | ORACLE-WH / `quality/tests/T004.json` |
| AC-17..18 | T005 | RED | `node --test tests/integration/mini-task-delivery.test.mjs tests/integration/mini-task-a-resume.test.mjs tests/integration/vnext-official-stage-run.test.mjs tests/e2e/vnext-five-stage-current.test.mjs` / nonzero | ORACLE-MINI / `quality/tests/T005.json` |
| AC-17..18 | T006 | GREEN | same / 0 | ORACLE-MINI / `quality/tests/T006.json` |
| AC-01,19..20 | T007 | RED | `node --test evaluation-assets/tests/wh-review-benchmark-assets.test.mjs evaluation-assets/tests/wh-review-benchmark-matcher.test.mjs evaluation-assets/tests/wh-review-benchmark-score.test.mjs evaluation-assets/tests/wh-review-benchmark-runner.test.mjs evaluation-assets/tests/wh-review-benchmark-comparison.test.mjs evaluation-assets/tests/wh-review-benchmark-report.test.mjs evaluation-assets/tests/wh-review-benchmark-compatibility.test.mjs evaluation-assets/tests/wh-review-history-replay.test.mjs` / nonzero | ORACLE-EVAL / `quality/tests/T007.json` |
| AC-19..20 | T008 | GREEN | same / 0 | ORACLE-EVAL / `quality/tests/T008.json` |
| AC-01..26 | T009/T010 | FINAL | plan-only / one-shot A/B + read-only aggregate | ORACLE-FINAL / `quality/tests/T010-final.json` |
| AC-27..32 | T011/T012/T013 | CLOSE | RED/GREEN + close freshness matrix | ORACLE-CLOSE / `quality/tests/T013-close-final.json` |

## Rollback and Recovery

- **Global recovery rule**：只回滚当前任务新增实现，保留 decision/spec/plan/tasks 和所有真实 review/test/provider 失败事实；不清洗历史结果。
- **Irreversible boundaries**：commit/push/merge/archive/cleanup 均需单独授权；真实 provider 运行会消耗预算，P5 plan-only 后显式报告估算并 STOP。
- **Recovery owner**：3rd-review 协议失败回 P1；WorkflowHub 合同/semantic hash 失败回 P2；mini-task 失败回 P3；评测资产/runner 失败回 P4；真实比较不达标回具体受影响任务，不全量盲重跑。

### Engineering Risk Handoff

- **PLAN-RISK-001：跨仓工作树污染**
  - **Affected IDs**：D-011、AC-06、T001..T010
  - **Trigger**：3rd-review 或 ModelTest 当前工作树有用户改动，或没有任务专属 worktree。
  - **Consequence**：混入无关改动，评测版本不可复现。
  - **Mitigation or STOP**：build-code 开始 P1/P4 前只读检查状态；存在重叠时建立独立 worktree，不能安全隔离则 STOP。
  - **Handling Stage**：build-code
  - **Verification**：记录三仓 repo path、branch、HEAD、source-manifest hash、dirty summary；所有任务按 owning repo cwd 执行。
- **PLAN-RISK-002：混合协议版本**
  - **Affected IDs**：AC-10..13、T001..T004
  - **Trigger**：新 WorkflowHub 连接旧 broker。
  - **Consequence**：字段缺失被误当成功。
  - **Mitigation or STOP**：`PROTOCOL_INCOMPATIBLE`、0 provider call；先完成 P1 再 P2。
  - **Handling Stage**：build-code
  - **Verification**：mixed-version fixture。
- **PLAN-RISK-003：真实评测费用或时长超预算**
  - **Affected IDs**：AC-19..20、T009、T010
  - **Trigger**：plan-only 计算的 leg/reviewer 数或 deadline 总量不可接受。
  - **Consequence**：长时间运行、额外 token 消耗。
  - **Mitigation or STOP**：先输出逐面调用数和上界；真实前后评测已由用户在原始需求中明确授权，但 manifest/config/version/公式任一不符仍不 dispatch，也不再次询问 reviewer 数量。
  - **Handling Stage**：build-code
  - **Verification**：plan-only JSON 与配置 hash。
- **PLAN-RISK-004：semantic projection 漏字段**
  - **Affected IDs**：AC-14..15、T003..T004
  - **Trigger**：真实语义变化 hash 未改变。
  - **Consequence**：沿用过期审查。
  - **Mitigation or STOP**：正反 mutation 覆盖 spec 列出的全部语义类别；新增类别必须升级 contract version。
  - **Handling Stage**：build-code/verify-code
  - **Verification**：projection mutation suite 和 P5 调用计数。

### Planning lens findings and dispositions

- **LENS-F-01 fixed**：九面实际合同已加入 P2 文件边界；T003/T004 覆盖五阶段和两个 mini-task 合同，不再只改 runner。
- **LENS-F-02 fixed**：三个仓库和两个真实配置增加明确 workspace/cwd 映射；禁止在 WorkflowHub worktree 误建 `3rd-review/ModelTest/user-config` 目录。
- **LENS-F-03 fixed**：删除不存在的 `final-evidence-check.mjs` 和错误 ModelTest 目录；T009/T010 使用真实 `evaluation-assets/...` 路径和任务 worktree 环境变量。
- **LENS-F-04 fixed**：T003/T004 gate 显式包含 `verify-freshness-selection.test.mjs`，不再依赖无匹配 wildcard。
- **LENS-F-05 fixed**：v3 字段、终态、retry 矩阵、发布/回滚顺序及 v2 删除条件已写清。
- **LENS-F-06 fixed**：真实 A/B 从可重复 preflight 拆出；T009 只生成不可变 manifest 且 0 provider call，T010 才消费授权执行一次。
- **LENS-F-07 fixed**：manifest 绑定 baseline/candidate source manifest、3rd-review、bundle、scorecard、真实配置 bytes/hash 和输出目录，防止比较同一版本。
- **LENS-F-08 fixed**：每个 leg dispatch 前原子写 started；started/ambiguous/completed 都不自动重跑，只继续 not_started。
- **WH-F-7bdaa71b90d8 / WH-F-a31408118d17 fixed**：T003/T004 新增 direction A→B reveal 的顺序、材料隔离、单 fact 和调用计数 oracle。
- **WH-F-e2cd3cf2b059 / WH-F-f48b6a29661c fixed**：P4 新增 history replay、版本化 ledger 和 RED/GREEN；T009 在 0-dispatch preflight 中重算三个真实目录并验证 hash 不变。
- **WH-F-8b79661e209f fixed**：T004 明确把两个 mini-task route 一起写入真实配置。
- **WH-F-bb526194ea5f fixed**：T003/T004 明确 route 必须有真异源 profile，缺失时配置无效且 0 dispatch。
- **WH-F-c641e6ff391a fixed**：Test Strategy 与任务卡统一为显式测试清单，包含 freshness test，不再使用无约束 wildcard。
- **WH-F-d9ca6458b343 fixed**：T003/T004 增加四种 disposition 和严重 finding 用户权限负例。
- **WH2-F-4b37205f60bf fixed**：P4 matcher 多候选时输出盲人工复核队列；T010 report 保留 blind-review pending/resolved 状态，不把 extra finding 自动算命中。
- **WH2-F-90a9135a3136 / WH2-F-d04eaec31584 fixed**：补齐 structural_error 与 broker aggregate→canonical 状态映射。
- **WH2-F-a482a457f622 fixed**：T009 增加生产对象 inventory 与反向 consumer 检查，验证 owner/consumer/替代/保留条件和无孤儿对象。
- **WH2-F-069c5abe55c8 / WH2-F-f22f4f7271f7 fixed**：Test Strategy 与任务卡的 P1/P2/P4/FINAL 覆盖和命令已同步。
- **WH2-F-35876a2ee28d / WH2-F-c463707e0863 fixed**：修复 history replay 输出路径，P4/T009 显式运行全部 8 个测试。
- **WH2-F-f36ee2a66693 fixed**：最后一次 plan 修订后重新计算 hash 并同步 tasks；不再发起第三轮审查。
- **Simplicity conclusion**：只新增三个必要机制：v3 公共结果、semantic projection、离线 benchmark；九面差异保持数据/合同，复用同一个 runner/schema，不新增 stage、公共命令或第二状态机。

## Implementation Order

P1 先生产 v3 协议和 broker 终态；P2 才让 WorkflowHub 消费 v3 并实现九面合同与 semantic hash；P3 在同一合同上接 mini-task；P4 独立实现 ModelTest benchmark；P5 固定三仓版本后一次 plan-only、一次 baseline/candidate 执行和聚合。P1→P2→P3 必须串行；P4 可在 P1 后与 P2/P3 并行，但真实 runner 必须等 P3。

## Dependencies and Parallelism

- **Dependencies**：T001→T002→T003→T004→T005→T006；T002→T007→T008；T006+T008→T009→T010。
- **Parallel work**：P4 的资产/schema/matcher 可在 P2/P3 实现时由独立上下文完成，写集只在 ModelTest；P1/P2 因协议 producer/consumer 不并行。
- **External dependencies**：两个真实 `/Users/Hugh/.config/...` 配置文件必须存在且每个 surface 至少一个真异源 profile、每个 profile 有正数 deadline；plan-only 冻结配置 bytes/hash，A/B 共用同一快照。缺失语义为 unavailable，不 fallback。

## Requirement and Verification Traceability

| Source / decision | FR | AC | Phase / Task | Depends on | Exact files | Command / oracle |
| --- | --- | --- | --- | --- | --- | --- |
| R-001,R-010,D-001,D-010,D-014 | AUDIT | AC-01 | P2/T003-T004; P5/T009-T010 | T002 | audit ledger and independent research | ORACLE-WH/FINAL |
| R-002,R-007,D-001,D-009,D-012 | FOCUS | AC-02 | P2/T003-T004; P5/T009-T010 | T002 | wh-review contracts/scripts | ORACLE-WH/FINAL |
| R-003,D-010,D-012 | EVAL/COST | AC-19 | P4/T007-T008; P5/T009-T010 | T002 | ModelTest benchmark | ORACLE-EVAL |
| R-004,D-001,D-010 | EVAL/AGENTHUB | AC-20 | P4/T007-T008; P5/T009-T010 | T002 | AgentHub comparison assets | ORACLE-EVAL |
| R-005,D-001,D-004 | PACKET | AC-03..05 | P2/T003-T004 | T002 | packet contracts/materials | ORACLE-WH |
| R-006,D-001,D-008 | OWNER | AC-06 | P1/T001-T002; P2/T003-T004 | none | broker v3 + client | ORACLE-PROTOCOL/WH |
| R-008,D-001 | FINDING | AC-07..09 | P2/T003-T004 | T002 | finding validator/result | ORACLE-WH |
| R-009,D-008,D-013 | EXEC/RECOVERY | AC-10..13 | P1/T001-T002; P2/T003-T004 | none | broker v3 and recovery policy | ORACLE-PROTOCOL/WH |
| R-011,D-011..D-013 | GOV | AC-21..23 | P2-P6/T003-T013 | all | schemas/tests/evidence | ORACLE-WH/FINAL |
| R-012,D-004 | FRESH | AC-14..15 | P2/T003-T004; P6/T011-T013 | T002 | semantic projection + close matrix | ORACLE-WH/CLOSE |
| R-013,R-014,D-001 | BUILD-CODE-FOCUS | AC-16 | P2/T003-T004 | T002 | build-code review contract | ORACLE-WH |
| R-015,R-020,R-022,D-002,D-014 | GOV/PROCESS | AC-21 | P2-P6/T003-T013 | all | five-stage flow and governance | ORACLE-WH/FINAL |
| R-016,D-002 | REPORT/HANDOFF | AC-24 | P6/T011-T013 | all | Talk and handoff contract | ORACLE-CLOSE |
| R-017,R-019,R-023,D-002,D-014 | TRACE | AC-25 | P2-P6/T003-T013 | all | source coverage and session trace | ORACLE-FINAL |
| R-018,D-002 | SCENARIO | AC-26 | P6/T011-T013 | all | user-flow scenario record | ORACLE-CLOSE |
| R-021,D-006,D-007 | MINI | AC-17..18 | P3/T005-T006 | T004 | mini-task runner/tests | ORACLE-MINI |
| R-024,D-015 | CLOSE | AC-27..32 | P6/T011-T013 | T010 | stage predicates, finding validator, task-close, close matrix | ORACLE-CLOSE |

## Governance Synchronization Matrix

| Governance surface | Actual files | Change / no change | Task IDs | Reason |
| --- | --- | --- | --- | --- |
| Constitution | `CONSTITUTION.md` | no change | T009,T010,T013 | 只验证，不改宪法 |
| Formal close facts | `runtime/stage/completion-predicates.mjs`, `core/task-close.mjs` | change | T011,T012,T013 | close 复用唯一 verify 完成事实，不新增状态机 |
| Workflow skills | `workflows/*/SKILL.md` | no change | T004,T006 | 不复制 stage 控制面 |
| wh-review protocol | contracts/scripts/schemas | change | T003,T004 | 唯一审查语义 consumer |
| 3rd-review protocol | lib/docs/tests | change | T001,T002 | 唯一 provider owner |
| ModelTest assets | benchmark v1 files | change | T007,T008 | 仅离线评测 |

## Constitution Check

- **Constitution binding**：`{"artifact_kind":"constitution","ref":"constitution-checklist.md","hash":"368817c2910a36e63d3ab4642c30270abdecef15dee7caf8050e778f095919ca","id":"CONSTITUTION","version":"vNext","clause_count":21}`
- **F1**：从 R-001..024 和已冻结 spec 追溯，不由实现补需求。
- **F2**：完成结果是有效 findings/真实失败/成本对比，不是材料齐全本身。
- **F3**：三仓单一 owner，复用现有 runner/schema/ModelTest 机制。
- **F4**：finding、attempt、usage、failure 原始事实不被摘要覆盖。
- **F5**：每个新增对象在 Reuse 表和文件边界写 consumer/owner/删除条件。
- **F6**：unknown/unavailable/incomplete 保持真实，不伪造 pass。
- **F7**：不新增第五材料、第六 stage 或公共命令。
- **F8**：不写历史 lineage/rebind/reopen/continuation。
- **F9**：只允许 task 当前质量目录和 ModelTest 离线报告。
- **F10**：仅保留 semantic projection、v3 protocol、benchmark 三个有真实威胁的新机制，并写维护/删除条件。
- **Q1**：每个行为有同命令同 oracle RED/GREEN。
- **Q2**：最终 aggregate 只运行一次并保留失败。
- **Q3**：独立 wh-review 产出质量裁决，主 agent 不自判。
- **S1**：每 Phase 有 Goal/Files/Tasks/Verify/Knowledge/STOP/Done/Risk。
- **S2**：任务精确文件是所属 Phase 边界子集。
- **S3**：producer-before-consumer，无环。
- **S4**：review/test/evidence 只记事实，不做推进许可证。
- **S5**：外仓工作树先隔离，保护用户改动。
- **S6**：provider 失败不改写为质量通过。
- **S7**：不可逆 Git 操作与真实高成本运行单列边界。
- **S8**：P5 写回不重审，防止重复执行和 token 浪费。

## Phase P1 — 3rd-review v3 与唯一恢复 owner

### Goal

3rd-review 能按配置执行每个 profile，给出可验证的独立/异源、deadline、attempt/retry、usage/timing/error/provenance 事实；旧 v2 consumer 不退化。

### Files

- **NEW**：`3rd-review/lib/workflowhub-result-v3.mjs`、`3rd-review/lib/recovery-policy.mjs`、`3rd-review/docs/workflowhub-result-v3.md`、`3rd-review/test/workflowhub-result-v3.test.mjs`、`3rd-review/test/recovery-policy.test.mjs`
- **MODIFY**：`3rd-review/lib/broker.mjs`、`3rd-review/lib/config.mjs`、`3rd-review/lib/process.mjs`、`3rd-review/lib/provider-failure.mjs`、`3rd-review/SKILL.md`、`3rd-review/docs/adr/0001-v4-cli-contract.md`、`3rd-review/docs/exceptions.md`、`3rd-review/test/broker.test.mjs`、`3rd-review/test/process.test.mjs`、`3rd-review/test/delivery-outcome.test.mjs`、`3rd-review/test/new-runtime-integration.test.mjs`、`3rd-review/test/managed-session-lifecycle.test.mjs`、`user-config/3rd-review/config.json`
- **DO NOT TOUCH**：`3rd-review/lib/attachments.mjs`、`3rd-review/lib/runtime.mjs`、`3rd-review/lib/continuation-materials.mjs`、`3rd-review/lib/provider-ids.mjs`、`3rd-review/scripts/3rd-review.mjs`

### Tasks

- `T001`：先写 v3、恢复次数、deadline、部分成功和 mixed-version RED。
- `T002`：实现最小 v3 投影和 broker recovery policy，使同命令 GREEN。

### Verify

在 3rd-review worktree 运行 `node --test test/workflowhub-result-v3.test.mjs test/recovery-policy.test.mjs test/broker.test.mjs test/process.test.mjs test/delivery-outcome.test.mjs test/new-runtime-integration.test.mjs test/managed-session-lifecycle.test.mjs`；GREEN exit 0；ORACLE-PROTOCOL 检查每成员一次终态、恢复计数不相乘、旧 v2 仍可读。

### Knowledge

交给 P2 的唯一事实是 v3 schema/fixture 和混合版本错误码；不把 provider 内部状态泄漏成 WorkflowHub 控制面。

### STOP

需修改受保护 transport/runtime/parser、无法保持 v2 consumer、配置缺 source_id/deadline 或外仓无法安全隔离时停止。

### Done

只能报告协议测试/真实 smoke 事实；provider smoke 失败仍是 unavailable，不是 P1 质量通过。

### Risks and rollback

v3 投影漏 attempt 或旧 v2 回归时撤销 P1 生产改动但保留 RED/失败输出；不让 P2 兼容坏协议。

## Phase P2 — WorkflowHub 九面合同与 P5 语义绑定

### Goal

九面请求只包含本面问题和最小材料，finding 可行动；配置 N 个 reviewer 得到 N 个成员事实；T010 状态写回不再触发审查，真实语义变化只复审受影响主题一次。

### Files

- **NEW**：`skills/wh-review/contracts/workflowhub-result.v3.json`、`skills/wh-review/scripts/review-semantic-projection.mjs`、`skills/wh-review/scripts/__tests__/review-provider-client-v3.test.mjs`、`skills/wh-review/scripts/__tests__/review-semantic-projection.test.mjs`、`skills/wh-review/scripts/__tests__/make-decision-direction-reveal.test.mjs`、`tests/integration/wh-review-v3-broker-contract.test.mjs`
- **MODIFY**：`skills/wh-review/manifest.json`、`skills/wh-review/contracts/provider-protocol.md`、`skills/wh-review/contracts/make-decision.md`、`skills/wh-review/contracts/build-spec.md`、`skills/wh-review/contracts/build-plan.md`、`skills/wh-review/contracts/build-code.md`、`skills/wh-review/contracts/verify-code.md`、`skills/wh-review/contracts/mini-task-design.md`、`skills/wh-review/contracts/mini-task-implementation.md`、`skills/wh-review/scripts/review-provider-client.mjs`、`skills/wh-review/scripts/third-review-host-config.mjs`、`skills/wh-review/scripts/review-runner.mjs`、`skills/wh-review/scripts/wh-review-cli.mjs`、`skills/wh-review/scripts/review-result.mjs`、`skills/wh-review/scripts/review-materials.mjs`、`runtime/review/stage-materials.json`、`runtime/review/integration-review-subject.mjs`、`runtime/review/schemas/attempt.schema.json`、`runtime/review/schemas/result.schema.json`、`runtime/review/canonical-review-result.mjs`、`runtime/evidence/acceptance-evidence-validator.mjs`、`runtime/stage/stage-handlers.mjs`、`skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs`、`skills/wh-review/scripts/__tests__/integration-review-subject.test.mjs`、`skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs`、`skills/wh-review/scripts/__tests__/review-runner.test.mjs`、`skills/wh-review/scripts/__tests__/simple-contracts.test.mjs`、`skills/wh-review/scripts/__tests__/schema-validator.test.mjs`、`tests/integration/verify-freshness-selection.test.mjs`、`user-config/workflowhub/config.json`
- **DO NOT TOUCH**：`core/task-close.mjs`、`runtime/stage/completion-predicates.mjs`、`workflows/make-decision/SKILL.md`、`workflows/build-spec/SKILL.md`、`workflows/build-plan/SKILL.md`、`workflows/build-code/SKILL.md`、`workflows/verify-code/SKILL.md`

### Tasks

- `T003`：加入九面 prompt/packet/finding/v3/mixed-version/semantic hash/P5 调用计数 RED。
- `T004`：实现 surface registry、最小 packet、v3 consumer、canonical facts、semantic projection，删除外层 retry/SAME_SOURCE 猜测。

### Verify

运行显式列出的 wh-review unit + v3 broker integration + freshness 计数测试；ORACLE-WH 要看到：direction A 包不含当前选择、B 只能在 A 后并消费 A 结果、两次小请求只写一条逻辑 fact；四种 disposition 和严重 finding 无用户确认时 needs_human；无真异源 route 加载失败且 0 dispatch；无关材料拒绝、关键材料不截断、三轴单调用、状态写回 +0、真实语义修复 +1。

### Knowledge

P3 只调用统一 `runReview(surface, semanticSubject)`；不得复制 provider 循环或 canonical schema。

### STOP

需要新增 public runtime、第五材料、第二 review 状态机、动态改变 reviewer 列表，或 semantic projection 不能确定性覆盖 spec 类别时停止。

### Done

九面合同和 P5 freshness 测试 GREEN；未完成真实 provider 评测前不能宣称质量提升。

### Risks and rollback

逐面合同维护成本通过共享 schema/runner 限制；单面配置错误只回退该 route，不能 fallback 到通用大 prompt。

## Phase P3 — mini-task 两次专用审查

### Goal

mini-task 设计和实施各审一次，替代同范围普通审查；调用方不能自报 pass；测试与用户结果证据只采集一次。

### Files

- **NEW**：N/A — 复用 P2 合同。
- **MODIFY**：`skills/mini-task/scripts/mini-task-runner.mjs`、`tests/integration/mini-task-delivery.test.mjs`、`tests/integration/mini-task-a-resume.test.mjs`、`tests/integration/vnext-official-stage-run.test.mjs`、`tests/e2e/vnext-five-stage-current.test.mjs`
- **DO NOT TOUCH**：`workflows/make-decision/SKILL.md`、`workflows/build-spec/SKILL.md`、`workflows/build-plan/SKILL.md`、`workflows/build-code/SKILL.md`、`workflows/verify-code/SKILL.md`、`runtime/stage/completion-predicates.mjs`

### Tasks

- `T005`：route 缺失、自报 pass、重复 review/test、缺用户结果、越界实现 RED。
- `T006`：runner 接入两个 surface，实施证据一次采集，状态只由 canonical result 派生。

### Verify

运行四个 mini/vNext 测试文件；ORACLE-MINI 检查 design/implementation 各一次、普通 review +0、缺 route 0 provider call +1 unavailable、caller pass 被拒绝。

### Knowledge

交给 P5 的 surface 列表增至 9；mini-task 仍不是第六 stage。

### STOP

必须改 P2 共同协议时回 P2；若只能靠新增 stage/完成记录实现则停止并回 decision。

### Done

只能报告 mini-task 专用审查行为和调用计数，不把 recorded 等同产品完成。

### Risks and rollback

防止双审：fixture 同时开启普通路径时必须只命中专用 route；失败回滚 runner 接线，不回滚 P2 公共合同。

## Phase P4 — ModelTest 九面盲测基准

### Goal

ModelTest 能生成固定九面 mutation/control 计划，通过真实 WorkflowHub CLI 保存每个 leg/reviewer 事实并严格比较 baseline/candidate；plan-only 产物就是不可变 run manifest。

### Files

- **NEW**：`ModelTest/evaluation-assets/subjects/wh-review-adversarial/v1/surface-index.json`、`ModelTest/evaluation-assets/subjects/wh-review-adversarial/v1/release-manifest.json`、`ModelTest/evaluation-assets/mutations/wh-review-adversarial/v1/mutation-catalog.json`、`ModelTest/evaluation-assets/oracle/wh-review-adversarial/v1/target-oracles.json`、`ModelTest/evaluation-assets/contracts/wh-review-benchmark-v1.mjs`、`ModelTest/evaluation-assets/bundles/wh-review-adversarial-v1.0.0.json`、`ModelTest/evaluation-assets/registry/v4.json`、`ModelTest/evaluation-assets/scorecards/wh-review-benchmark-v1.0.0.json`、`ModelTest/evaluation-assets/schemas/wh-review-benchmark-case.schema.json`、`ModelTest/evaluation-assets/schemas/wh-review-benchmark-run.schema.json`、`ModelTest/evaluation-assets/schemas/wh-review-benchmark-attempt.schema.json`、`ModelTest/evaluation-assets/schemas/wh-review-benchmark-projection.schema.json`、`ModelTest/evaluation-assets/schemas/wh-review-benchmark-comparison.schema.json`、`ModelTest/evaluation-assets/schemas/wh-review-benchmark-report.schema.json`、`ModelTest/evaluation-assets/scoring/wh-review-benchmark-matcher.mjs`、`ModelTest/evaluation-assets/scoring/wh-review-benchmark-score.mjs`、`ModelTest/evaluation-assets/scripts/validate-wh-review-benchmark.mjs`、`ModelTest/evaluation-assets/scripts/plan-wh-review-benchmark.mjs`、`ModelTest/evaluation-assets/scripts/run-wh-review-benchmark.mjs`、`ModelTest/evaluation-assets/scripts/compare-wh-review-benchmark.mjs`、`ModelTest/evaluation-assets/scripts/report-wh-review-benchmark.mjs`、`ModelTest/evaluation-assets/scripts/replay-wh-review-history.mjs`、`ModelTest/evaluation-assets/baselines/wh-review-adversarial-v1-history-ledger.json`、`ModelTest/evaluation-assets/tests/wh-review-benchmark-assets.test.mjs`、`ModelTest/evaluation-assets/tests/wh-review-benchmark-matcher.test.mjs`、`ModelTest/evaluation-assets/tests/wh-review-benchmark-score.test.mjs`、`ModelTest/evaluation-assets/tests/wh-review-benchmark-runner.test.mjs`、`ModelTest/evaluation-assets/tests/wh-review-benchmark-comparison.test.mjs`、`ModelTest/evaluation-assets/tests/wh-review-benchmark-report.test.mjs`、`ModelTest/evaluation-assets/tests/wh-review-benchmark-compatibility.test.mjs`、`ModelTest/evaluation-assets/tests/wh-review-history-replay.test.mjs`
- **MODIFY**：`ModelTest/evaluation-assets/README.md`
- **DO NOT TOUCH**：`ModelTest/docs/prd.md`、既有 `ModelTest/evaluation-assets/subjects/us-*`、`ModelTest/monitoring`

### Tasks

- `T007`：assets/schema/matcher/score/runner/comparison/report/compatibility RED。
- `T008`：实现版本化 bundle、严格 matcher、逐面中位数、失败不删、plan/run/compare/report。

### Verify

在 ModelTest worktree 运行 `node --test evaluation-assets/tests/wh-review-benchmark-assets.test.mjs evaluation-assets/tests/wh-review-benchmark-matcher.test.mjs evaluation-assets/tests/wh-review-benchmark-score.test.mjs evaluation-assets/tests/wh-review-benchmark-runner.test.mjs evaluation-assets/tests/wh-review-benchmark-comparison.test.mjs evaluation-assets/tests/wh-review-benchmark-report.test.mjs evaluation-assets/tests/wh-review-benchmark-compatibility.test.mjs evaluation-assets/tests/wh-review-history-replay.test.mjs`；ORACLE-EVAL 检查中性盲名、交错顺序、一 case 一交易、调用数由 route 配置公式计算、dispatch 前原子 started、ambiguous 不重跑、失败与 null usage 保留；`wh-review-history-replay.test.mjs` 检查三个只读历史目录重算、原始 hash 不变和 unavailable 保真。

### Knowledge

P5 只消费 plan JSON 和真实 raw attempts；score/report 不能反写 WorkflowHub runtime。

### STOP

需要改既有 US 评分链、runner 不能调用真实 wh-review CLI、严格 matcher 无法稳定定位 target，或外仓无法隔离时停止。

### Done

离线 deterministic suite GREEN；未执行真实矩阵前只说明工具可运行。

### Risks and rollback

样本过拟合通过 clean control 和盲名缓解；回滚新 benchmark 目录不会影响旧 ModelTest 链。

## Phase P5 — 三仓聚合与真实前后对比

### Goal

固定三仓 source manifest 和配置快照后，先生成不可变运行清单，再按该清单运行 baseline/candidate，逐面判断质量是否提高、token/时长/失败是否下降，并执行一次最终三仓 aggregate。

### Files

- **NEW**：`quality/tests/T009-plan.json`、`quality/tests/T010-final.json`、`quality/evidence/wh-review-benchmark-plan.json`、`quality/evidence/wh-review-benchmark-comparison.json`、`quality/evidence/wh-review-history-replay.json`
- **MODIFY**：N/A — 聚合只读生产文件并写任务证据。
- **DO NOT TOUCH**：`skills/wh-review`、`runtime/review`、`3rd-review/lib`、`ModelTest/evaluation-assets`、历史 review/attempt

### Tasks

- `T009`：安全 gate：三仓 deterministic tests + plan-only，生成不可变运行清单，0 provider call。
- `T010`：一次 final aggregate：只消费 T009 manifest 执行 baseline/candidate → comparison/report → constitution/source coverage；started/ambiguous leg 不自动重跑。

### Verify

ORACLE-FINAL：T009 证明版本/config/bundle/scorecard/leg/output 全绑定且 0 provider call；T010 证明 AC-01..26 均有真实 fact、逐面 AC-20 的质量/稳定性/成本/证据完整性事实可回读、任何不可计算保持 `inconclusive/unavailable`；三仓测试 exit 0 不替代真实评测结果，也不把固定分数当成继续或交付闸门。

### Knowledge

最终交接分开说：找到什么缺陷、哪些 provider 失败、花了多少、哪些面变好/没变好、下一步是什么。

### STOP

配置 hash/source-manifest hash/bundle hash 缺失；任一 route 无真异源 reviewer；plan-only 数量与公式不符；baseline 不可重放；执行中发现协议不兼容。reviewer 数量始终直接读取配置，不动态提问。

### Done

真实比较只负责报告每个 surface 的质量、稳定性、成本和未知项；不输出跨面总排名，不把固定分数当作 WorkflowHub 的继续、阶段完成或正式 close 闸门。发现真实退步或高成本时回对应任务修复；配对不足、provider 失败和 telemetry 缺失原样保留，不通过重复全量运行碰运气。

### Risks and rollback

真实调用不可撤销，先 plan-only 控制；dispatch 前原子写 started。取消时保留已完成 leg；`not_started` 可继续，`started` 无 terminal 变 ambiguous/unavailable，绝不自动重跑。

## Phase P6 — 正式验收事实与交付关闭一致性

### Goal

让 verify-code 和 task-close 共享同一组六项正式事实；材料只写回时可以复用测试/review，不因完整快照变化重复消耗 provider；代码或真实语义变化仍必须重新产生当前事实。finding 处置同时覆盖所有 canonical finding，严重 finding 只额外影响完成和风险接受。

### Files

- **NEW**：`tests/integration/review-test-close-freshness-matrix.test.mjs`
- **NEW**：`quality/tests/T013-close-final.json`、`quality/evidence/p6-close-freshness.json`
- **MODIFY**：`runtime/stage/completion-predicates.mjs`、`runtime/stage/stage-handlers.mjs`、`core/task-close.mjs`、`skills/mini-task/scripts/mini-task-runner.mjs`、`skills/wh-review/contracts/build-spec.md`、`skills/wh-review/contracts/build-plan.md`、`skills/wh-review/contracts/verify-code.md`、`skills/wh-review/contracts/mini-task-implementation.md`、`tests/integration/vnext-delivery-close.test.mjs`、`tests/contract/stage-completion.test.mjs`、`tests/official-component-receipts.test.mjs`、`tests/integration/vnext-official-stage-run.test.mjs`、`tests/final-cutover-guards.red.test.mjs`、`tests/integration/mini-task-delivery.test.mjs`
- **DO NOT TOUCH**：`CONSTITUTION.md`、public runtime 命令、四份材料之外的第二完成记录、3rd-review provider 生命周期

### Tasks

- `T011`：RED：固定所有 canonical finding 都要有 disposition、serious finding 额外需要完成/用户授权、close 六项事实和材料/代码四象限。
- `T012`：GREEN：拆分 all finding 与 serious finding 两个集合；复用共享完成谓词；收紧 `accepted_risk` 授权和 mini-task finding contract；close 逐条消费六项当前事实。
- `T013`：最终验证：运行 finding/stage/mini/receipt/semantic-reuse/close 矩阵和三仓 deterministic gate；真实 provider 失败仍保持 unavailable。

### Verify

T011/T012 使用同一组 RED/GREEN 命令；ORACLE-CLOSE-FINDING 检查：普通 finding 也被保留并处置，只有 serious actionable finding 阻止完成；`accepted_risk` 必须绑定用户确认；六项 verify 事实逐条认证；材料只变 provider 0 次；代码变化不能复用旧 receipt/result；verify confirmation 与 close/Git 授权分开。

### Knowledge

P6 只加强已有事实消费者和共享 validator；不创建第五材料、close 状态机、replacement/rebind/continuation 或新的公共命令。mini-task 复用同一 finding 合同，不另造一套状态；没有真实用户确认时不能自动生成 `accepted_risk` 或通过 human confirmation。

### STOP

需要新增质量事实类型、把 provider verdict 当 pass gate、放宽代码变化后的复用、修改 mini-task 两条 route 或改变宪法时停止并回 make-decision/build-spec。

### Done

缺一项正式 verify 事实都不能准备 close；所有 canonical finding 都有处置；serious risk 没有真实授权不能完成；材料记录写回不会触发测试或 provider 重跑。

### Risks and rollback

旧 fixture 可能只构造测试和 review，改为显式补齐事实；如果新 close 检查误伤旧只读历史，只收紧当前 vNext close consumer，不改历史记录。finding validator 统一失败时回滚接线，保留原始 finding 和失败事实。

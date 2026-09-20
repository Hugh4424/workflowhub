# 实现计划：双任务拓扑与零机器推进门禁骨架（CARD-01）

- **Input**：`specs/workflowhub-thin-core-card-01-20260919/decision-log.md@cf6c62ac0774421733d7872357d0b27390f1fd072bdf15af4b02db2a979a039b`、`specs/workflowhub-thin-core-card-01-20260919/spec.md@9c0a5c0bf4c7687ed01d3d0ae44d5b235d6e2d31b1b1894383914a4567474dc6`
- **Template version**：`plan-task.v4`
- **Status**：正式 build-plan 材料草案；任务均为 pending，未执行测试、实现、Git 或物理动作。

## 材料导航

| 章节 / 材料锚点 | 职责与摘要 | M/S/B/P 读取时机 |
| --- | --- | --- |
| `decision-log.md#决定`（D-001..D-010）、`decision-log.md#调研`（RS-001..RS-005）、`decision-log.md#风险与延期交接`（RK/DF） | 已确认的方向、范围、八处排除点盘点、RS-001⑤ 阻断谓词（原文称 24 项/四类，实列 5 组；本 plan 展开 18 站点并记差异）、两道人为门位置、非目标与延期 | M（主会话常驻）；S 执行各 Phase 前重读相关 D |
| `spec.md#5-功能需求`（TYPE/TOPO/MIG/PRD/FLOW/GATE/STATE/IFACE/REVIEW 九节，23 条 FR）、`spec.md#8-数据和生命周期`、`spec.md#11-验收标准`（23 条 AC） | 产品行为、受控值、拓扑逐字串、状态七值、验收 oracle 与失败边界 | S（build-code/verify-code 逐条对照） |
| `spec.md#产品边界接口蓝图`、`spec.md#迁移期与生效边界`、`spec.md#canonical-gate-inventory` | 后续卡消费的接口契约、cohort×类型规则、谓词×转移冻结义务 | B（build-code 接线前） |
| `plan.md#Technical Decisions`（DEC-001..005）、`plan.md#Phase P1..P4` | 工程方案、文件边界、RED/GREEN、STOP 条件 | M/S 全程 |
| `tasks.md#Phase P1..P4`（build-plan 下一任务卡产出） | 可执行任务边界、命令、execution JSON 与完成记录 | P（并行执行按 tasks 卡） |

## Quick Read

- **Goal**：真实入口 `stage-runtime.mjs run` 按 decision-log 人工声明的任务类型读回并分流——规划任务执行 `make-decision→build-prd`（build-prd 六步 succeeded/failed 收口，不进代码阶段）；普通任务按 activation cohort 走五阶段（pre）或四阶段（post）；阶段推进除两道人为门（confirm/authorize）外零机器门禁，缺事实只记录不阻断。
- **Non-goals**：来源：D-003/D-004/D-006/D-008：不把 build-prd 升为第六正式阶段；不改 build-prd 六步内容；不物理删除校验机器（CARD-06）；不做旧任务迁移（CARD-08）；不改文档权威（CARD-02）、子代理方法（CARD-03）、审查链替换（CARD-05）；入口不新增任务类型参数；不新增 public command、第五份材料、第二状态机、第二 dispatcher。
- **Before**：build-prd 被 8 处硬编码五阶段名单挡住（`step-manifest.mjs:4-10,161-162`、`stage-context.mjs:17-23`、`stage-acceptance-policy.mjs:1-14`、`completion-predicates.mjs:5,250`、`stage-handlers.mjs:400-401`、`task-kernel-implementation.mjs:33`、`workflowhub-stage-agent-bridge.mjs:31`、`core/dispatch-component.mjs:12-17`），`run --stage=build-prd` 抛 `Unknown canonical stage: build-prd`；入口无任务类型读回、无拓扑分流、无 cohort、无 build-prd 状态面；24 项机器谓词仍在推进路径上（RS-001⑤）。
- **After**：入口在 `run`/`status` 前读回任务类型与 cohort，按静态投影校验所请求阶段；`run --stage=build-prd` 对规划任务走 portable 执行链（六步 outcome 记录齐备⇒`succeeded` 终态记录，任一步失败⇒`failed`+真实原因+可重入该步）；cohort 在任务创建时冻结进 task.json；`status --stage=build-prd` 投影七值终态；机器谓词降级为记录事实。
- **Main risk**：把 build-prd 错加进任一正式阶段名单（18+ 处），或把 cohort/拓扑校验做成新的推进门禁（撞 F5/F11 与 FR-GATE-004）。
- **Next step**：build-code 先执行 T001 targeted RED；若实现要求扩正式阶段集合、改 dispatch-component/bridge 或新增 public command，立即 STOP 回本 plan/spec。

## Technical Context

### Global Constraints

- **Verified facts**：正式五阶段集合逐字 `make-decision/build-spec/build-plan/build-code/verify-code`（`step-manifest.mjs:4-10`），全仓 18+ 处同款硬编码，本卡全部保持五阶段不变；build-prd 已注册为 `portable_workflow`（`config/workflowhub.yaml:16-19`），六步 `steps.json`（schema 2.0.0）内容不变；任务类型受控值恰 `{规划任务, 普通任务}`，唯一声明点 decision-log 任务身份段固定标签 `- **任务类型**：<值>`，读回器 `readTaskTypeFromDecisionLog`（`stage-content-contracts.mjs:2881-2918`，纯函数，缺失/重复/冲突/非法返回 `unknown`）；任务追踪目录为 `<storageRoot>/Projects/<project>/tasks/<task-id>/`，含 `task.json`（manifest，createTask 一次写入）、`facts.jsonl`（10 键固定 schema 且 `stage∈五阶段`，`task-store.mjs:8-9,209-215`，**不能**承载 cohort/新状态行）、`quality/**`、`index.json`；`validateManifest`（`task-handle.mjs:52-`）不关闭额外顶层字段，manifest 可透传 cohort 字段；portable outcome 约定命名空间 `quality/evidence/portable-workflow-outcomes/build-prd/<sha256>.json`（`check-skill-closure.mjs:107-151`、`core/task-close.mjs:66,2084` 已校验其声明形状，可复用）；manifest 校验器 `validateStepManifest`（`step-manifest.mjs:46`）**不适用于 portable manifest**（实跑对 `build-prd/steps.json` 返回 `ok:false`，因 `step-manifest.mjs:54-56` 要求 `stage_slug` 属五阶段；该文件在 DO NOT TOUCH 内，本卡不改其语义）；真实任务创建唯一入口 `tools/cli/task-bootstrap.mjs`（RS-001①）；`stage-runtime.mjs` public 七命令（doctor/status/run/review/verify/confirm/authorize，L1165/1177），`run` 在 L1067/L1108 调 `runOfficialStage`；两道人为门：confirm→`publishHumanConfirmation`（`task-kernel-implementation.mjs:879-993`）、authorize→`publishIrreversibleAuthorization`（`task-kernel-implementation.mjs:994-1008`）。
- **Language / runtime**：Node.js ESM、Vitest、YAML/JSON/Markdown；版本沿仓库当前 package/lock，不新增依赖。
- **Primary dependencies**：复用 `readTaskTypeFromDecisionLog`、task-store 原子写纪律、`core/task-close.mjs` 的 build-prd outcome 声明命名空间（只读，不复制其校验器）、既有 integration fixture 模式（`tests/helpers/`、`tests/official-make-decision-cli.test.mjs`）。**不复用** `validateStepManifest`（对 portable manifest 恒 `ok:false`）。
- **Storage / state**：任务类型在 decision-log（worktree）；cohort 在 task.json manifest 字段；build-prd 终态在 `quality/evidence/portable-workflow-outcomes/build-prd/`（内容寻址、追加式）；类型澄清异常尝试在 `quality/evidence/task-type-attempts/`；activation 标记在 `<storageRoot>/activation/card-01.json`（一次性人写记录）。不建 store、不建第五材料、不建第二状态机。
- **Testing**：本卡 non_ui，`e2e_scope=not_required`，tier=command/service。4 个新 contract 测试 + 1 个 integration 测试 + 1 个 acceptance runner；命令固定 singleFork/no-fileParallelism；证据目标 task-relative `quality/tests/`。只跑受影响 targeted 测试，不做全量回归（AGENTS.md 测试硬规则）。
- **Target environment**：WorkflowHub 本地包；真实入口为 `tools/cli/stage-runtime.mjs` 与 `tools/cli/task-bootstrap.mjs`；测试夹具直调不得冒充真实入口（spec 接口蓝图「正式入口」行）。
- **Scale / scope**：2 个新 runtime 模块、1 个新 docs 契约、6 个新测试文件（4 contract + 1 integration + 1 acceptance）、1 个 activation 标记记录面；MODIFY 7 个既有文件（stage-runtime、task-bootstrap、move-map、stage-handlers、task-kernel-implementation、stage-runner、canonical-receipt-writer，后四者仅谓词调用位）；18+ 处正式阶段名单常量与 core/ 历史区零改动。
- **Unresolved facts**：①activation 标记的写入动作发生在本卡发布消费后（CARD-01 owner 关闭动作，AC-MIG-001），本 plan 只设计其形状/位置/读者，不实现写入命令；②RS-001⑤ 的「24 项」无逐项枚举、且原文自称「四类」而列 5 组：本 plan 已在 §机器阻断谓词 inventory 按 5 族冻结并**逐行展开 18 个谓词站点**，同时把 24-vs-18 差异记为事实（不凑数、不虚构）；build-code 复核口径见该节；③任务类型澄清的结构化问答交互形态沿用 make-decision 既有问答卡机制（CARD-07 范畴，本卡只消费其结果写进 decision-log）。

## Code Anchors

- **Verified anchors**：`runtime/stage/stage-content-contracts.mjs:2881-2918`（readTaskTypeFromDecisionLog，纯函数）；`runtime/stage/step-manifest.mjs:4-10,46,160-166`（五阶段冻结 + validateStepManifest + loadStageManifest 拒绝 build-prd）；`tools/cli/stage-runtime.mjs:63`（WORKFLOW_STAGES）、`:1165-1173`（public 七命令与 action 表）、`:1177`（RUNTIME_BEHAVIORS 校验）、`:1067-1108`（run→runOfficialStage 分发缝）；`tools/cli/task-bootstrap.mjs:86-117`（createTask→initializeTaskStore 流程）；`runtime/task/task-handle.mjs:52-80,884-901`（validateManifest 透传、createTask 一次写 manifest）；`runtime/task/task-store.mjs:8-9,190-215`（facts.jsonl 固定 schema）；`core/task-close.mjs:66,2084-2090`（build-prd outcome 声明校验形状）；`runtime/task/task-kernel-implementation.mjs:33,679-682,701-710,757-781,879-1008`（五阶段冻结、阻断谓词、两道人为门）；`runtime/stage/stage-runner.mjs:683-684,696-700,716`（哈希校验、只记录区、步数完整校验）；`runtime/evidence/canonical-receipt-writer.mjs:216,228,677,683`（材料 sha256 冻结）；`workflows/build-prd/steps.json`（六步，本卡不改）；`config/workflowhub.yaml:16-19`（portable_workflow 注册，本卡不改）。
- **Existing interfaces**：decision-log 任务身份段固定标签契约（`- **任务类型**：<值>` 恰一条）；portable outcome 记录形状（task-close 已校验：task_id/workflow=build-prd/reply_text/material_refs/step_results/reflection_facts）；七值状态集合；验收 `entries[].assertions` JSON 形状（tasks-template Delivery contract）。
- **Read now**：上述锚点 + spec.md 全文 + decision-log RS-001 全文 + `constitution-checklist.md`（hash 91c72a0d…）。
- **Must read before task**：T002 前重读 `stage-runtime.mjs` L1000-1110（context 构建与 manifest 加载顺序，确定 portable 分支挂载点）；T004 前重读 `core/task-close.mjs:60-80,2070-2095`（outcome 声明字段精确形状）；T006 前重读 `task-handle.mjs:884-901`（manifest 透传确认）；T007 前重读 plan §机器阻断谓词 inventory 的 18 个站点 + RS-001⑤ 五组锚点（`stage-runner.mjs:683-684,716`、`task-kernel-implementation.mjs:691-702,946-947`、`stage-handlers.mjs:679-682,757-781`、`canonical-receipt-writer.mjs:216,228,677,683`）逐行展开。
- **Context mode**：Full — 横跨入口、拓扑、portable 执行、记录四个 seam；每 Phase 文件互斥，只跑 targeted 测试。

### Reuse → Extend → New

| Capability | Decision | Existing anchor | Reason / removal condition |
| --- | --- | --- | --- |
| 任务类型读回 | reuse | `runtime/stage/stage-content-contracts.mjs:2881 readTaskTypeFromDecisionLog` | 现有纯函数契约已覆盖受控值/唯一性/无法识别语义（D-003），零改动 |
| 拓扑投影/分流 | new | `runtime/task/task-topology.mjs`（本 plan 新增） | consumer=stage-runtime run/status、CARD-02 蓝图读者；owner=本卡主会话；test=T001/T002；删除条件=接口蓝图被后续卡经审查的统一拓扑声明取代 |
| build-prd 执行链 | new | `runtime/task/portable-workflow-run.mjs`（本 plan 新增） | consumer=stage-runtime portable 分支；owner=本卡主会话；test=T003/T004；删除条件=统一 portable workflow 执行器出现且本链无历史消费 |
| 六步 manifest 自校验 | new | `runtime/task/portable-workflow-run.mjs` 内最小形状校验 | **不可复用 `validateStepManifest`**：实跑 `validateStepManifest(build-prd/steps.json)` 返回 `ok:false`（`step-manifest.mjs:54-56` 无条件要求 `stage_slug∈CANONICAL_STAGE_SLUGS`＝五阶段），而该文件在 DO NOT TOUCH 内；故 portable 链自带最小形状校验（steps 非空、step_id 整数、step_slug 非空、字段形态合法），只读 `steps.json` 内容本身。owner=本卡主会话；consumer=portable 链；test=T003；删除条件=统一 portable manifest 校验器出现 |
| build-prd outcome 形状校验 | reuse | `core/task-close.mjs:66,2084`（只读消费其声明形状） | 不复制第二校验器；task-close 本身不改 |
| cohort 冻结 | extend | `tools/cli/task-bootstrap.mjs`（createTask manifest 透传，task-handle 零改动） | 最小方案：入口创建时 stamp，复用 manifest createOnly 即冻结 |
| activation 标记 | new | `<storageRoot>/activation/card-01.json` | 一次性人写记录（非 gate）：owner=CARD-01 owner；consumer=task-bootstrap cohort 判定 + CARD-10 存在性核对；test=T005/T006；删除条件=CARD-01 拓扑规则被后续卡取代 |
| 七值终态记录 | new | `quality/evidence/portable-workflow-outcomes/build-prd/` 命名空间 | 既有约定命名空间内追加 terminal 记录，不建第二状态机 |

## Solution Design

### Overview

入口分流只有一条缝：`stage-runtime.mjs` 在**类型相关阶段执行**（`run` 的目标阶段属于 build-prd / build-plan / build-code / verify-code 之一）构建 stage 上下文**之前**，先调用纯函数模块 `task-topology.mjs` 读回任务类型（复用 `readTaskTypeFromDecisionLog`）与 cohort（task.json manifest 字段，缺省 `pre`），得到静态拓扑投影；所请求阶段不在投影内即 fail-loud 退出（非零 + 具体消息）。**`make-decision` 是类型声明的宿主阶段，必须始终可执行**（用户在其中声明类型并回答澄清）；`status`/`doctor` 与其它类型无关命令/准备动作不受 unknown 影响（只记录事实），在投影内且为正式阶段则走既有 `runOfficialStage` 原路径（该路径同步去机器门禁，见 DEC-005/P4），为 `build-prd` 则走 portable 分支。全程不触碰 18+ 处正式阶段名单、不改 `dispatch-component.mjs`（spawn-node-entry 机制与 Markdown workflow 六步模型不匹配，且 core/ 为历史兼容区禁新增能力）、不改旧 bridge（AGENTS.md 治理边界：旧 bridge 只读保留，不得重新成为 active run 的门）。

portable 分支由新模块 `portable-workflow-run.mjs` 实现：直读 `workflows/build-prd/steps.json`（不经 `loadStageManifest`），用自带最小形状校验（**不导入 `validateStepManifest`**——它要求 `stage_slug` 属五阶段，对 build-prd 必返回 `ok:false`，见 Reuse→New 表）。**六步的实际执行者是当前 WorkflowHub 会话**：会话按 `workflows/build-prd/SKILL.md` + `steps.json` 逐步执行六步内容（与 build-spec/build-plan 今日由会话逐步执行同理），每步产出 portable outcome 记录；`portable-workflow-run.mjs` 只负责**步骤序列推进、outcome 形状/齐备校验与终态记录**，不自行撰写 PRD 内容、不冒充执行。六步齐备且形状合法⇒写 `succeeded` 终态记录；任一步缺失/非法⇒写 `failed` 终态记录（含真实原因与失败步），修复后重跑即重入该步（内容寻址追加，历史全保留）。终态记录写 `quality/evidence/portable-workflow-outcomes/build-prd/` 的 terminal 子面，追加式，`status --stage=build-prd` 读取最新终态记录投影七值。

cohort 在任务创建唯一入口 `task-bootstrap.mjs` 成功建立 task 身份+worktree+记录落点时冻结：判定 `<storageRoot>/activation/card-01.json` 是否存在（owner 发布消费后写入的一次性记录），存在⇒`post`，否则⇒`pre`，stamp 进 createTask manifest（`activation_cohort` + `activation_cohort_frozen_at` + `entry_release_commit`）；manifest createOnly 写入即冻结，暂停/恢复/晚声明/澄清均不改。在途任务（含本卡自身）与旧任务无 cohort 字段，读回缺省 `pre`（D-009 in-flight 政策）。

类型澄清（FR-TYPE-003）：读回为 `unknown` 时，**类型相关阶段执行**立即非零退出并输出「任务类型无法识别，请在 make-decision 任务身份段声明恰一条受控值标签」；`make-decision` 本身不被该检查阻断（否则无人能澄清），类型无关的准备动作继续；入口把本次异常观察（缺失/重复/冲突/非法值原文摘要）追加写入 `quality/evidence/task-type-attempts/<sha256>.json` 作为历史事实（不回写 decision-log 成第二条当前标签）；`status/doctor` 等类型无关命令不受影响。用户在 make-decision 内澄清形成恰一条合法标签后，重新读回成功，仅恢复类型相关分支。

### Module responsibilities

#### task-topology（runtime/task/task-topology.mjs）

- **Responsibility**：任务类型读回、cohort 读回、静态拓扑投影、阶段-拓扑校验、类型澄清异常记录写入。
- **Consumes**：decision-log markdown（经 readTaskTypeFromDecisionLog）、task.json manifest、`<storageRoot>/activation/card-01.json` 存在性。
- **Produces**：`resolveTopology(type, cohort)` 投影数组；`validateStageForTopology(stage, topology)` 判定；`recordTypeAttempt(taskRoot, observation)` 内容寻址记录。
- **Must not decide**：任务类型本身（人声明）、拓扑目标（D-001 已冻结）、质量结论。

#### portable-workflow-run（runtime/task/portable-workflow-run.mjs）

- **Responsibility**：portable workflow manifest 加载与自校验、六步 outcome 核对、终态（succeeded/failed）记录写入与重入。
- **Consumes**：`workflows/build-prd/steps.json`（只读内容）、portable outcome 记录、task 追踪目录写纪律。**不消费** `validateStepManifest`。
- **Produces**：`quality/evidence/portable-workflow-outcomes/build-prd/terminal/<sha256>.json` 终态记录，本 plan 冻结其为 9 字段自有 schema `{record_kind:"portable_workflow_terminal", task_id, workflow:"build-prd", state:七值之一, reason, failed_step, step_result_refs, started_at, completed_at}`；与 task-close 的 6 键 planning-declaration 面用 `terminal/` 子目录 + `record_kind` 区分，不声称复用其校验器。
- **Must not decide**：build-prd 六步内容、PRD 质量 verdict、正式阶段身份。

#### stage-runtime 分流（tools/cli/stage-runtime.mjs 内窄分支）

- **Responsibility**：run/status 前的读回校验与路由；portable 分支调度；保持 public 七命令面不变。
- **Consumes**：task-topology 投影、portable-workflow-run 终态。
- **Produces**：既有 stage 结果 + build-prd portable 结果 + status 七值投影。
- **Must not decide**：类型、拓扑、质量；不新增命令、不扩 WORKFLOW_STAGES。

#### task-bootstrap cohort 冻结（tools/cli/task-bootstrap.mjs 窄扩）

- **Responsibility**：创建成功时 stamp cohort manifest 字段并读 activation 标记。
- **Consumes**：`<storageRoot>/activation/card-01.json`。
- **Produces**：带 `activation_cohort` 的 task.json manifest。
- **Must not decide**：cohort×类型后的拓扑走向（投影模块决定）。

### Interfaces, data, and lifecycle

- **Interfaces / schemas**：拓扑投影为冻结静态映射（代码内常量，非配置）：`规划任务→["make-decision","build-prd"]`；`普通任务+post→["make-decision","build-plan","build-code","verify-code"]`；`普通任务+pre→["make-decision","build-spec","build-plan","build-code","verify-code"]`。无动态拼接、无运行时派生。cohort manifest 字段：`activation_cohort: "pre"|"post"`（必填于新任务）、`activation_cohort_frozen_at`（ISO8601）、`entry_release_commit`（来源规则：标记存在且其 `release_marker.commit` 可解析⇒记该值；否则记入口仓库当前 HEAD；两者皆不可得⇒记字符串 `"unknown"`。它只是 provenance，**不单独决定 cohort**，也不得因缺失而阻断创建）。activation 标记的三事实契约形状与 fail-safe 判定见 Canonical Inventory Freeze §activation 三事实契约。终态记录形状如上；类型尝试记录形状 `{record_kind:"task_type_attempt", task_id, observed_kind:"missing"|"duplicate"|"conflict"|"illegal_value", observed_summary, observed_at}`。
- **Data flow / state**：建任务（bootstrap stamp cohort）→ make-decision 人声明类型（第一道人为门 confirm 所在阶段）→ 类型相关阶段执行前读回类型+cohort→投影→校验所请求阶段→正式阶段走原链（去门禁后）/build-prd 走六步链→终态记录→status 投影（status 只读记录，不被 unknown 阻断）。失败：类型 unknown⇒类型相关阶段非零+澄清（异常入历史），make-decision 与类型无关动作继续；build-prd 步失败⇒failed 终态可重入；材料字节不可读⇒依赖内容动作 failed 可重试（不升级 blocked）。
- **API contract**：N/A — 无网络 API；CLI 仍七命令，`run --stage=build-prd` 仅为规划任务拓扑内合法值。
- **UI / external code**：non_ui；无展示层改动。
- **Fail-loud behavior**：类型 unknown（非零+澄清消息+异常记录）；所请求阶段不在投影（非零+期望拓扑）；build-prd 六步 outcome 形状非法（failed 终态+具体步原因）；activation 标记存在但 JSON 非法或缺字段（**判定 `pre` 并把非法事实记入 task 记录，不阻断创建**，与 §activation 三事实契约一致）；task.json 无 cohort 字段（读回按 `pre`，不报错）。

## UI Delivery Contract

- **UI applicability**：`non_ui` — decision-log 已判 non_ui（三来源一致）；本卡改动面为入口、拓扑、portable 执行链与记录面。
- **Component action / Real consumer / State owner / Typed ViewModel / CSS/token owner**：N/A — 无组件、无样式、无 ViewModel。
- **Fixture / viewport**：N/A — 无浏览器；合同 fixture 为 decision-log 类型声明四种材料（合法规划/合法普通/缺失/重复/冲突/非法值）。
- **Browser / a11y / performance / Screenshot handoff**：N/A — non_ui。
- **Coverage limits**：不证明任何展示层行为。
- **N/A / unknown reason**：本卡无 UI；全部字段不适用。

### Design-gap handoff

- **design_status**：`not_approved` → 实为 `N/A`（non_ui，无 Design.md 权威面）。
- **missing_items / reason**：`[]` — 无 UI 缺项。
- **fallback_visual_basis / constraints / rework_risk**：N/A — non_ui。

## File Boundary

### NEW

- `runtime/task/task-topology.mjs` — 拓扑投影/读回/校验/澄清记录（owner=本卡主会话；consumer=stage-runtime、CARD-02 蓝图；test=T001/T002）
- `runtime/task/portable-workflow-run.mjs` — build-prd 六步执行链与终态记录（owner=本卡主会话；consumer=stage-runtime portable 分支；test=T003/T004）
- `docs/contracts/card-01-stage-material-interface.md` — 接口蓝图公开面（owner=本卡主会话；consumer=CARD-02..10；test=T008 断言其存在与六类契约行）
- `tests/contract/task-topology-projection.test.mjs`
- `tests/contract/portable-workflow-run.test.mjs`
- `tests/contract/activation-cohort.test.mjs`
- `tests/contract/zero-machine-gate-advancement.test.mjs`
- `tests/integration/card-01-dual-journey.test.mjs`
- `tests/acceptance/card-01-current.mjs`

### MODIFY

- `tools/cli/stage-runtime.mjs` — run/status 前挂拓扑读回校验；run 增加 build-prd portable 分支（WORKFLOW_STAGES 常量与正式阶段路径零改动）
- `tools/cli/task-bootstrap.mjs` — createTask 前读 activation 标记，manifest stamp 三个 cohort 字段（activation_cohort、activation_cohort_frozen_at、entry_release_commit）
- `docs/architecture/move-map.json` — 登记上述新增文件职责/consumer/owner/test/删除条件
- `runtime/stage/stage-handlers.mjs`、`runtime/task/task-kernel-implementation.mjs`、`runtime/stage/stage-runner.mjs`、`runtime/evidence/canonical-receipt-writer.mjs` — 24 项机器谓词的推进路径调用位改为记录事实（名单常量零改动）

### DO NOT TOUCH

- **区域级 DO NOT TOUCH（与上面 MODIFY 条目共存，按区域区分）**：
  - `runtime/stage/stage-context.mjs`、`runtime/stage/stage-acceptance-policy.mjs`、`runtime/stage/completion-predicates.mjs` — 各自的 STAGES 五阶段名单与既有校验函数**区域**整体保持原样（这三个文件不在 MODIFY 内）。
  - `runtime/stage/stage-handlers.mjs`、`runtime/task/task-kernel-implementation.mjs`、`runtime/stage/stage-runner.mjs`、`runtime/evidence/canonical-receipt-writer.mjs` — **仅允许改动 24 项谓词在推进路径上的调用位**（把「阻断推进」改为「记录事实」）；这四个文件内的**五阶段名单常量、STAGES 集合与既有校验函数本体**是 DO NOT TOUCH 区域，一律不改。P4 的 RED/GREEN 必须断言名单常量逐字未变。
- `runtime/stage/step-manifest.mjs`（CANONICAL_STAGE_SLUGS 与 loadStageManifest 拒绝语义）— 正式五阶段集合不变；portable 链直读 steps.json 不经过它，也**不导入** `validateStepManifest`。
- `tools/host/workflowhub-stage-agent-bridge.mjs` — AGENTS.md 治理边界：旧 bridge 只读保留历史 provenance，不得重新成为 active run 的门。
- `core/dispatch-component.mjs` — core/ 历史兼容区禁新增能力；其拒绝 portable_workflow 是正确行为（spawn-node-entry 机制不匹配 Markdown workflow 六步模型）。
- `core/task-close.mjs` — 只读消费其 build-prd 声明校验形状；不复制第二校验器。
- `runtime/task/task-handle.mjs`、`runtime/task/task-store.mjs` — manifest 透传与 facts.jsonl 固定 schema 均零改动（cohort 经 manifest 额外字段承载，facts.jsonl 不能承载非五阶段行）。
- `runtime/evidence/write-boundary-preflight.mjs`、`quality-fact.mjs`、`runner-identity.mjs`、`workflow-evolution.mjs`、`research-report.mjs`、`check-skill-closure.mjs`、`runtime/distribution/skill-bundle-release.mjs`、`runtime/review/review-policy.mjs`、`stage-review-disposition.mjs`、`review-record-route.mjs`、`runtime/stage/stage-runner.mjs`、`stage-handoff.mjs`、`contracts/facts-subschema.json`、`tools/cli/build-reflection-page.mjs` 等 18+ 处五阶段硬编码面 — 全部保持五阶段不变。
- `workflows/build-prd/**` — 六步内容与 SKILL 自证约束（SKILL.md:119-121「不要加进五阶段」）不变。
- `config/workflowhub.yaml` — portable_workflow 注册已存在，零改动。
- `specs/archive/**`、母 PRD `specs/workflowhub-thin-core-rebuild-planning-20260919/`、兄弟卡材料 — 只读（FR-IFACE-003），不触发母任务 close。
- `CONSTITUTION.md`、`constitution-checklist.md` — 本卡不改变确认语义与宪法条款，零改动。

## Canonical Inventory Freeze

本节是 build-plan 的冻结面，供 build-code 逐行接线与验收引用；所有引用均以**执行时仓库现行原文**为准，本 plan 不复制可能漂移的清单。

### A/B 人为门 inventory（FR-GATE-002 / AC-GATE-002）

**唯一枚举来源**（现行原文，执行时须重新读取并记录版本）：
- `CONSTITUTION.md:54`（F7 标题）、`:56`（定义四句）、`:57`（最佳实践）、`:58`（正例）、`:59`（反例）。
- 公共 authorize 合同**无单一文档**，冻结为 **10 处合同定位 + 3 处旁证 = 13 处**。合同定位（10）：`CONSTITUTION.md:172`（治理实施边界全句）、`tools/cli/stage-runtime.mjs:1165`（behaviors）、`:1173`（authorize 五个 action）、`:765-767`（`authorize-operation` 参数校验）、`:1204-1208`（action→command 映射）、`runtime/interface/runtime-facade.mjs:3-11`（RUNTIME_BEHAVIORS）、`:21`（映射）、`runtime/task/task-kernel-implementation.mjs:37`（AUTHORIZATION_OPERATIONS）、`:994-1019`（`publishIrreversibleAuthorization`）、`:1021-1044`（`consumeIrreversibleAuthorization`）。旁证（3）：`tools/cli/stage-runtime.mjs:585`（usage 行）、`:1179`（`--action` 必填校验）、`docs/standard-workflow.md:46`（职责读取）。T008 的 oracle 与本节按同一口径（13 = 10 + 3）。

**A 类 = 当前阶段或 portable workflow 既有合同明确要求的推进确认对话**（`spec.md:267`）：

| # | 合同项（原文） | 出处 | 适用路径 | 不适用理由 / 冻结说明 |
| --- | --- | --- | --- | --- |
| A1 | `正常业务确认仍只保留 make-decision、build-plan、verify-code 三处` | `CONSTITUTION.md:56` | 普通任务 pre 五阶段与 post 四阶段、规划任务 `make-decision` | 全部任务适用；本卡不改其语义，`acceptanceModeFor` 映射保持原样 |
| A2 | `第四处限定确认是 UI 设计确认：仅当 ui_applicability=ui 时，build-spec 展示高保真原型后必须取得用户确认` | `CONSTITUTION.md:56` | 仅 `ui_applicability=ui` 的 build-spec | **本卡 N/A**：本任务 ui applicability 已判 `non_ui`（decision-log 三来源一致），故该确认不触发；按 `CONSTITUTION.md:59` 反例「把非 UI 任务拉入设计确认」为禁止项，故此处必须显式记 N/A 而非留空 |
| A3 | `对于 build-prd 规划对象，spec-prd 先完成地图展示与真实核对，并绑定 真实展示版本，再复用同一条件 UI 链绑定设计版本；第二次内容调用后的最终确认（展示稿）必须绑定 decision/source/map/PRD 同版事实，拒绝、未答或错版保持草稿` | `CONSTITUTION.md:56` | 规划任务（`规划任务→make-decision→build-prd`）的 build-prd 最终展示稿确认 | 适用：落在本卡规划旅程终点（build-prd `confirm-final-displayed-draft` 步）；其中「复用同一条件 UI 链」部分对 non_ui 记 N/A。本卡 portable 链须保留该确认事实的核对位，不自行新增对话 |

**B 类 = 宪法与既有授权合同认定需独立授权的不可逆操作**（`spec.md:267`）：

| # | 合同项（原文） | 出处 | 适用路径 | 不适用理由 / 冻结说明 |
| --- | --- | --- | --- | --- |
| B1 | `commit、push、merge、archive、cleanup 等不可逆操作仍需独立授权，不能被阶段确认顺带授权` | `CONSTITUTION.md:56` | 任意任务的实际不可逆动作 | 全部适用；本卡自身**不执行**任何不可逆动作（实现与测试均在 worktree 内），提交/合并须另行取得用户授权 |
| B2 | `不可逆操作使用独立公共 authorize --action=<commit\|push\|merge\|archive\|cleanup>` | `CONSTITUTION.md:172` | 与 B1 同 | 同上；本卡不改该命令面（public runtime 仅七命令） |
| B3 | `authorize: ["commit","push","merge","archive","cleanup"]` 与 `authorize-operation requires --operation=...` 校验 | `stage-runtime.mjs:1173`、`:765-767` | 与 B1 同 | 冻结为**现行授权集合恰五个**；不得自行扩大（AC-GATE-002 失败判据「自行扩大授权集合」） |
| B4 | `irreversible-authorization.v1` 发布/消费合同（stale 校验、`subject_ref`、`plan_hash`、`step_id`、`IRREVERSIBLE_AUTHORIZATION_REQUIRED`） | `task-kernel-implementation.mjs:994-1019`、`:1021-1044` | 收口阶段 | 本卡只读冻结；本卡不新增授权类型、不加第三类人门 |

**禁止项（原文，`spec.md:436`/`:268`）**：除合同原文明列项外，阶段转移、日常执行与 review/test/evidence 派发不得出现人工准入；不新增第三类人为门；阶段/工作流确认不顺带授权不可逆操作；review、test、evidence 或质量缺失不触发新人工准入。

**等待/拒绝/批准语义（原文，`spec.md:267`/`:588`）**：等待真实答复时阶段保持 `in-progress` 并追加 waiting 交互事实，**不新增 pending 状态**；拒绝/未授权时具体动作不执行、阶段仍 `in-progress` 供重试或安全工作，用户终止任务才记 `abandoned`；批准后只执行绑定动作并继续原阶段；A 类事实不满足 B 类授权；B 类批准正例只在一次性沙箱/替身目标上、预先取得该测试动作独立授权后执行，禁止对当前真实仓库执行未授权不可逆操作（fixture 由 DEFER-003 参数化）。

### 机器阻断谓词 inventory（FR-GATE-001 / AC-GATE-001）

**源材料事实（须如实记录，不得伪造）**：`decision-log.md:542` RS-001⑤ 原文只断言「会真正阻断推进的机器校验共 **24** 项，集中在**四类**」并给出 **5 个括号锚点组**；**RS-001 未提供 1..24 的逐项枚举**，且原文自称「四类」与其列出的 5 组不一致。本 plan 按 5 个锚点组冻结族级清单，并**逐行展开锚点处实际谓词站点**如下（文件:行号以执行时现状为准）：

| # | 谓词站点（文件:行号） | 族（RS-001 原文组名） | consumer | 适用阶段 / 转移 | 缺失/无效时的行为（去门禁后） | RS-001 类别 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `stage-runner.mjs:684` | outcome/confirmation 字节哈希 | stage outcome 认证（stage-runner） | 任一阶段 outcome 读取 | 记录 `outcome_receipt_hash_mismatch` 事实；不再阻断推进 | outcome 字节哈希 |
| 2 | `task-kernel-implementation.mjs:946-947` | outcome/confirmation 字节哈希 | human confirmation 读取（task-kernel） | 阶段确认消费 | 记录 `human_confirmation_hash_mismatch`；不当作同意，也不阻断 | outcome 字节哈希 |
| 3 | `task-kernel-implementation.mjs:691-692` | 聚合 decision ref/hash 与 snapshot 新鲜度 | 交互聚合消费（task-kernel） | make-decision/build-spec/build-plan 交互聚合 | 记录 `aggregate_snapshot_stale`；缺失事实如实保留 | 聚合新鲜度 |
| 4 | `task-kernel-implementation.mjs:697-698` | 同上 | 交互聚合消费 | 同上 | 记录 `aggregate_decision_unbound` | 聚合新鲜度 |
| 5 | `task-kernel-implementation.mjs:700-701` | 同上 | 交互聚合消费 | 同上 | 记录 `aggregate_decision_revision_stale` | 聚合新鲜度 |
| 6 | `stage-handlers.mjs:679-682` | 同上 | stage handler invocation 校验 | 阶段 handler 调用 | 记录 `interaction_aggregate_unbound` | 聚合新鲜度 |
| 7 | `canonical-receipt-writer.mjs:216` | review/acceptance 材料 sha256 冻结 | canonical receipt 写入 | review 材料冻结 | 记录 `frozen_review_material_hash_mismatch`；**材料身份仍冻结**，不因不匹配改写既有 receipt，不阻断推进 | 材料 sha256 |
| 8 | `canonical-receipt-writer.mjs:228` | 同上 | 同上 | 同上 | 记录 `frozen_review_material_content_hash_mismatch` | 材料 sha256 |
| 9 | `canonical-receipt-writer.mjs:677` | 同上 | 同上 | evidence 冻结 | 记录 `evidence_ref_hash_mismatch` | 材料 sha256 |
| 10 | `canonical-receipt-writer.mjs:683` | 同上 | 同上 | acceptance evidence 冻结 | 记录 `acceptance_evidence_hash_mismatch` | 材料 sha256 |
| 11 | `stage-handlers.mjs:757-758` | receipt 身份与命名空间 | receipt 消费 | 阶段 receipt 消费 | 记录 `receipt_namespace_violation` | receipt 身份 |
| 12 | `stage-handlers.mjs:764` | 同上 | 同上 | 同上 | 记录 `receipt_missing`（`ENOENT` 分支） | receipt 身份 |
| 13 | `stage-handlers.mjs:773` | 同上 | 同上 | 同上 | 记录 `receipt_schema_version_mismatch` | receipt 身份 |
| 14 | `stage-handlers.mjs:777` | 同上 | 同上 | 同上 | 记录 `receipt_producer_stage_mismatch` | receipt 身份 |
| 15 | `stage-handlers.mjs:778` | 同上 | 同上 | 同上 | 记录 `receipt_producer_component_unofficial` | receipt 身份 |
| 16 | `stage-handlers.mjs:780` | 同上 | 同上 | 同上 | 记录 `receipt_task_mismatch` | receipt 身份 |
| 17 | `stage-handlers.mjs:781` | 同上 | 同上 | 同上 | 记录 `receipt_stage_mismatch` | receipt 身份 |
| 18 | `stage-runner.mjs:716` | 步数完整 | stage outcome 步数完整性 | outcome 记录 | 记录 `step_outcome_coverage_incomplete`；已声明步的缺失如实保留 | 步数完整 |
| **合计** | **18 个谓词站点 / 5 族** | — | — | — | — | — |

**24 ↔ 18 显式映射（AC-GATE-001 输入口径）**：`spec.md` 的 AC-GATE-001 以「RS-001 的 24 项现状阻断谓词」为输入。本表的对应关系是：**5 族 ↔ RS-001⑤ 的 5 个锚点组；18 行 ↔ 锚点区间内可逐行定位的谓词站点**。RS-001 原文未给 1..24 编号，故本 plan 不以行数凑 24；差异本身作为事实冻结（见下段），并由 AC-GATE-001 的族级×转移矩阵断言 + 18 站点逐个去阻断断言共同覆盖。**receipt-writer 的 4 个 sha256 站点（#7–#10）去门禁不削弱 review 材料身份**：材料冻结写入路径不变，只把「哈希不匹配即抛错中断推进」改为「记录不匹配事实并保留原 receipt」，材料身份事实仍完整保留、可事后核对。

**计数差异（记录为事实，不裁决、不伪造）**：RS-001 断言 24 项；按锚点展开得 19 个 throw 站点、剔除 `stage-handlers.mjs:765` 纯重抛后为 **18** 个谓词；RS-001 原文自称「四类」而列出 5 组；本 plan 称「五族」。原文**未定义计数规则**（数 `if`、数 `throw` 或数复合子句）。处置：族级冻结（上表 5 族）为本卡权威；逐行条数以 **18** 为准并标注与 RS-001「24」的差异；若 build-code 按 RS-001 锚点复核得到恰好 24 项（例如把复合子句与 `ENOENT` 分支拆开计数），须在 tasks 卡记录实际口径与条数，**不得为凑 24 而虚构谓词**。

**明确仅记录不阻断的相邻面（不得混入上表）**：`stage-runner.mjs:696-700`（envelope 的 snapshot/material_revision 是 provenance）、`completion-predicates.mjs:93-100`（review 与 stage_end_spec_analyze 在 make-decision/build-spec/build-plan 为 advisory）。

**去门禁目标（FR-FLOW-001/002/003、FR-GATE-001）**：上表 18 个谓词站点的**推进阻断行为**改为「记录事实 + 不阻断」；谓词代码本体与五阶段名单常量**不删除、不改名**（物理删除归 CARD-06/G-002）。`outline_closed=missing` 保持 `missing` 不阻断（`spec.md:263`）。

### 七值状态冻结（FR-STATE-003 / AC-STATE-001..003）

| # | 值 | 语义（原文 `spec.md:295`，枚举见 `:285`） |
| --- | --- | --- |
| 1 | `not-started` | 创建后 |
| 2 | `in-progress` | 开始执行 |
| 3 | `succeeded` | 满足成功行为 |
| 4 | `failed` | 执行失败 |
| 5 | `unverified` | 缺验证（**在七值内**；`§8` `:383`/`:386`：缺验证记 `unverified` 而非 succeeded；只在该阶段自身声明的验证行为尚未执行时使用） |
| 6 | `blocked` | 仅等待可识别的非机器外部依赖时可为 `blocked`，且必须记录依赖方与解除条件 |
| 7 | `abandoned` | 用户终止任务 |

**转换/重入**（`spec.md:295`）：`failed`/`blocked` 修复或条件解除后可重入原阶段；后续阶段不得因失败自动启动；历史状态与原因保留。机器或质量事实（revision/snapshot/material identity/review/test/evidence）缺失**不得**包装为 blocked；材料字节不可读只让依赖内容的具体动作 `failed` 并可重试，不把整个阶段 blocked。

**build-prd 特例**（`spec.md:386`）：可记录 succeeded/failed 任务事实，但仍保持 portable workflow 身份。

### 八处排除名单逐处冻结（spec §迁移期与生效边界 / DEFER-002）

冻结字段（统一四项，出处 `spec.md:442`/`:445`/`:721`）：**是否阻断 / consumer / 最小变更（含可复核理由）/ 验证映射**。

| # | 路径:行号 | 是否阻止 build-prd 从真实入口执行 | consumer | 最小变更 | 可复核理由 | 验证映射 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `runtime/stage/step-manifest.mjs:4-10,161-162` | 是（`loadStageManifest` 抛 `Unknown canonical stage: build-prd`） | `loadStageManifest` 调用方（正式阶段路径） | **零改动**（DO NOT TOUCH） | portable 链直读 `steps.json`、不经该函数，故无需放宽五阶段集合 | T002/T003 断言 `run --stage=build-prd` 不再经过它；P4 断言名单常量逐字未变 |
| 2 | `runtime/stage/stage-context.mjs:17-23` | 是（`STAGES` Set 拒绝 build-prd） | 正式 stage context 构建 | **零改动** | portable 分支在正式上下文构建**之前**分流，故不进入该 Set | T002 分流顺序断言 |
| 3 | `runtime/stage/stage-acceptance-policy.mjs:1-14` | 是（`acceptanceModeFor` 抛 `unsupported stage`） | 正式阶段验收模式查询 | **零改动** | portable 链不调用 `acceptanceModeFor` | T003/T004 断言未调用 |
| 4 | `runtime/stage/completion-predicates.mjs:5,250` | 是（`STAGES` 不含 build-prd） | completion predicate 计算 | **零改动** | portable 分支不触发五阶段 completion 认证 | T004 负例（终态后无后续阶段 outcome） |
| 5 | `runtime/stage/stage-handlers.mjs:400-401` | 是（invocation 校验 Set 拒绝） | 正式阶段 invocation 校验 | 仅谓词调用位（DO NOT TOUCH 区域内零改动） | portable 分支不进入 handler 校验 | T007/T008 |
| 6 | `runtime/task/task-kernel-implementation.mjs:33` | 是（`STAGES` 冻结五阶段） | kernel 阶段合法性 | 仅谓词调用位（名单常量零改动） | 同上 | T007/T008 断言常量逐字未变 |
| 7 | `tools/host/workflowhub-stage-agent-bridge.mjs:31` | 是（bridge `STAGES`） | 旧 bridge（只读保留） | **零改动**（治理边界：旧 bridge 不得重新成为 active run 的门） | 本卡不走 bridge；其存在不阻止真实入口分流 | T008 只读断言 |
| 8 | `core/dispatch-component.mjs:12-17` | 是（显式 reject portable_workflow） | 旧 dispatch 链 | **零改动**（core/ 历史区禁新增能力；spawn-node-entry 机制与六步模型不匹配） | 其拒绝是正确行为；本卡不经该链 | T008 只读断言 + 蓝图「正式/portable 身份」行 |

**追加规则**（`spec.md:445`）：若 build-code 发现新的阻断点，可追加清单并说明来源；不得把「某文件存在」当作「接线已完成」。**本冻结未完成时记为验收缺口，不作推进门禁**（`spec.md:446`）。

### activation 三事实契约（FR-MIG-001 / AC-MIG-001）

cohort 判定**必须**同时满足三项事实（原文 `spec.md:221`）：①`CARD-01 能力验收事实`；②`正式 main/release 发布标识`；③`正式入口实际消费该发布的执行证据`。

`<storageRoot>/activation/card-01.json` 冻结形状（本 plan 设计）：

```json
{"schema_version":"card-01-activation.v1","capability_acceptance":{"ref":"...","sha256":"..."},"release_marker":{"commit":"...","channel":"main|release"},"entry_consumption":{"evidence_ref":"...","observed_at":"ISO8601"},"activated_at":"ISO8601"}
```

判定规则（fail-safe）：**三项齐备且各自可验证 ⇒ `post`；任一项缺失、空标记、JSON 非法或引用不可解析 ⇒ `pre`**。空标记或部分标记**不得**产生 `post`（直接对应 AC-MIG-001 失败判据「缺入口消费证据即启用」）。`entry_release_commit` 记入 manifest 作为 provenance，不单独决定 cohort。

### 五类样本矩阵：AC-MIG-001（`spec.md:496`，原文数字「五类」）

| # | 样本 | 期望顶层拓扑 |
| --- | --- | --- |
| 1 | pre cohort 普通任务跨 activation 恢复 | 旧五阶段（cohort 冻结于创建时，恢复不改写） |
| 2 | pre cohort 晚声明普通 | 旧五阶段 |
| 3 | pre cohort 晚声明规划 | `make-decision→build-prd` |
| 4 | post cohort 普通 | 目标四阶段 |
| 5 | post cohort 规划 | `make-decision→build-prd` |

**七条失败判据**（`spec.md:498`，逐条对照）：能力预演冒充 activation；缺入口消费证据即启用；以类型声明时点替代 cohort；规划任务被 cohort 强制走普通路径；普通任务跨 activation 改道；CARD-10 重做内容验收；等 CARD-06/CARD-10 才首次启用。**本卡只交能力预演面**，正式 activation 三项事实由 CARD-01 owner 在发布消费后补齐（PLAN-RISK-005）。

### AC oracle 冻结补充

- **AC-TYPE-001**（`spec.md:517-519`）：探针含「从不带任务类型参数的正式入口建立两个任务」「两个合法值声明并读回」「**入口类型参数/默认值探针**验证其不被接受或消费」；失败判据含「入口新增或消费类型参数/默认值、允许第三个值、产生多份当前声明/store」。
- **AC-TYPE-002**（`spec.md:524`）：「用**两个体量显著不同**但尚未声明类型的任务进入 make-decision」，断言两者均停留在人工选择处、未被按体量/文本/文件名/历史/哈希自动分类。
- **AC-GATE-002**（`spec.md:587`）：读取并冻结当次 F7 与 authorize 合同原文/版本 → 建立**完整拓扑**（每个阶段/workflow 转移、review/test/evidence 派发、全部合同项）inventory → 逐项执行**等待/未答、拒绝、批准**三条代表性路径；B 类批准正例**仅限一次性沙箱/替身目标**且预先取得该测试动作独立授权。oracle 即「§A/B inventory 逐项一致 + 三路径事实 + 沙箱无真实副作用」。
- **AC-IFACE-001**（`spec.md:629-630`）：蓝图须有六类契约行（受控值、类型→拓扑、正式/portable 身份、七值状态、材料/事实归属、推进/完成分离）**另加「人工边界与审查重派」附加接口行**；缺冻结事实计缺口但不阻断同任务修复。
- **AC-REVIEW-001**（`spec.md:650`）具名断言：①读真实 build-spec manifest 断言 `review-frozen-spec→main-agent-disposes-findings→stage-end-spec-analyze→publish-spec-result` 为单向依赖链；②review 与 publish 之间无第二个 review dispatch step；③SKILL 文本明确 disposition 修改 spec 后不重新派发已完成 review；④真实 `reviewCycleDecision` helper 在 serious finding 且 actualRepair/subjectChanged 存在时仍返回 `action=advance`；⑤独立底层用例中材料 B 不复用 A 的结果。上述为**既有基线回归**（D-007 已修复并合入 `cd26676a`），本卡只回归不新修。

### build-prd 内容归属边界（M6 澄清）

build-prd 六步的**内容执行者与责任主体**是既有 `workflows/build-prd/**`（其 `steps.json` 的 `observable_result` 写明 sole spec-prd content owner）；`spec.md:230` 明写本卡「不改变六项内容与内部质量要求」，`:540` 把「内容被本卡改写」列为 AC-PRD-001 失败，`:685-691` RISK-005 记录「build-prd 内部产出质量无本卡承接」。**本卡只负责**：真实入口可达（DEC-001）、六步 outcome 记录与七值终态（DEC-004）、失败可重入且不滑入代码阶段（DEC-005）。**本卡不负责**：六步内部产出质量、真实 provider/LLM 对话执行（integration 用夹具走真实 `stage-runtime.mjs`，夹具直调不得冒充真实入口）。

## Technical Decisions

### DEC-001 — build-prd 执行路径：run 命令内 portable 分支 + 新执行链模块

- **Problem**：build-prd 被 8 处正式阶段排除点挡住，规划旅程无法从真实入口执行；public runtime 只允许七命令，不能新增命令。
- **Options**：①`run --stage=build-prd` 内部分流到 portable 链；②新增 `run --workflow=build-prd` 参数；③复用 dispatch-component spawn 链。
- **Selected**：① — extend `run` 的阶段值域仅对规划任务投影合法 + new `runtime/task/portable-workflow-run.mjs`。
- **Reason**：七命令面不变（AGENTS.md vNext 边界）；正式阶段路径零改动；dispatch-component 机制不匹配且 core/ 禁新增能力。
- **Consequence / risk**：stage-runtime.mjs 增加一个分支；须保证该分支只在投影合法时可达。
- **Fallback**：回滚 portable 分支与新增模块，build-prd 恢复不可达，五阶段与决策材料不受影响。
- **F10 real threat**：portable 分支被当成正式阶段扩展的入口，逐步把 build-prd 塞进 18+ 名单，或让该分支触发五阶段 completion 认证。
- **F10 existing cover**：本 plan DO NOT TOUCH 名单 + T002 阶段合法性测试（规划任务之外传 build-prd 必须非零退出）+ P4 双旅程投影逐字断言。
- **F10 bypassable**：人可改代码扩名单；改动会立即打破 18+ 处既有五阶段测试，并由 CARD-02 蓝图只读对照与 CARD-10 核对暴露。
- **F10 maintenance cost**：一个 run 分支 + 一个模块；随 build-prd 六步变化只跟 `steps.json` 走，无额外 schema。
- **F10 disposition**：keep — 防止第六阶段污染的真实收益大于两个窄模块的维护成本。

### DEC-002 — 任务类型读回与分流：纯函数读回 + 静态投影校验

- **Problem**：入口须从 decision-log 读回类型并选择唯一固定拓扑，缺失/非法只暂停类型相关分支并请求澄清。
- **Options**：①入口新增 `--type` 参数；②复用 readTaskTypeFromDecisionLog + 新纯函数投影模块；③启动代码动态拼接拓扑。
- **Selected**：② — reuse 读回器 + new `task-topology.mjs` 静态映射。
- **Reason**：D-003 已冻结「声明+读回」契约，入口新增参数被 FR-TYPE-001 范围边界禁止；静态投影可逐字核对（OI-003）。
- **Consequence / risk**：澄清交互依赖 make-decision 既有问答机制（CARD-07 范畴），本卡只消费其结果。
- **Fallback**：读回失败一律澄清，不猜测、不默认值。
- **F10 real threat**：拓扑投影被改成运行时可拼接/可配置，拓扑不再可逐字核对，出现隐式第六拓扑或默认放行分支。
- **F10 existing cover**：T002 对三条固定映射逐字断言 + 「无动态拼接」DO NOT TOUCH 约束 + OI-003 逐字核对。
- **F10 bypassable**：后续卡可自行加映射项而不改本卡测试；由 CARD-02 蓝图 owner 与 move-map consumer 登记约束暴露。
- **F10 maintenance cost**：常量表三项；新增合法类型须人改表并补测试，无隐式默认值兜底。
- **F10 disposition**：keep。

### DEC-003 — activation cohort 字段形态：task.json manifest 字段 + storage-root 一次性标记

- **Problem**：FR-MIG-001 要求创建/记录落点时冻结 cohort，schema 留本 plan，且 activation 必须同时有三项事实（能力验收/发布标识/入口消费证据）；facts.jsonl 被 10 键+五阶段 schema 锁死，无法承载。
- **Options**：①facts.jsonl 自定义行；②task.json manifest 额外字段；③quality 内容寻址记录；④新顶层 cohort 文件。
- **Selected**：② — extend task-bootstrap（manifest 经 createTask 一次写入即冻结；validateManifest 不关闭额外字段，task-handle 零改动）；cohort 值由 `<storageRoot>/activation/card-01.json` 的**三事实契约**判定（见 Canonical Inventory Freeze §activation 三事实契约）：三项齐备且可验证⇒`post`，空标记/部分标记/非法 JSON⇒`pre`（fail-safe）。
- **Reason**：最小接线、零 protected 文件改动、读取廉价（openTask 已读 manifest）；缺 cohort 字段⇒`pre` 符合 D-009 在途政策（本卡自身即 pre cohort 普通任务）。
- **Consequence / risk**：activation 标记是新记录面，须登记 owner/consumer/删除条件（见 Governance 矩阵）；它不 gate 任何事，只决定 cohort 值。
- **Fallback**：标记缺失或任一事实不可验证⇒永远 `pre`，新拓扑不启用（安全侧）。
- **F10 real threat**：误把标记当推进门禁、误把能力预演当 activation、或凭空/部分标记判定 `post`（对应 AC-MIG-001 失败判据「缺入口消费证据即启用」）。
- **F10 existing cover**：AC-MIG-001 五类样本矩阵 + 三事实 fail-safe 判定（任一项缺失⇒`pre`）+ T005/T006 的「空标记/缺消费证据⇒非 post」负例。
- **F10 bypassable**：人可直接写标记文件，但只有 CARD-01 owner 在发布消费后有权写，且写后 CARD-10 核对。
- **F10 maintenance cost**：一个 JSON 记录 + manifest 一个字段。
- **F10 disposition**：keep。

### DEC-004 — build-prd 状态事实：portable outcome 命名空间内追加式终态记录

- **Problem**：build-prd 须记七值状态且与正式阶段解耦（D-008⑤），不得进 facts.jsonl（五阶段锁）或 stage-outcomes 命名空间。
- **Options**：①facts.jsonl 新行；②stage-outcomes 命名空间；③portable outcome 命名空间内 terminal 记录；④第二状态机。
- **Selected**：③ — new 终态记录写 `quality/evidence/portable-workflow-outcomes/build-prd/terminal/<sha256>.json`（与六步 outcome 同约定命名空间；本 plan 冻结自有 9 字段 schema，**不复用** task-close 的 6 键校验器，仅以 `terminal/` 子目录 + `record_kind` 区分）。
- **Reason**：复用既有记录纪律（内容寻址、追加、fsync）；status 读最新终态即投影；不建第二状态机（FR-STATE-002）。
- **Consequence / risk**：status 需扫该命名空间取最新（目录内单 workflow，量极小）。
- **Fallback**：无终态记录⇒status 显示 not-started/in-progress 语义，不伪造。
- **F10 real threat**：portable outcome 记录被当成第二状态机或质量通过凭据，反向变成正式阶段的推进条件。
- **F10 existing cover**：status 只投影最新终态、不动 `facts.jsonl` 与 stage-outcomes；T006 断言终态记录不触发五阶段 completion 认证；记录事实非许可证原则。
- **F10 bypassable**：写者可直接写 succeeded 记录；记录内容寻址 + sha256 + review 事实分离，且它不 gate 任何推进故无造假收益。
- **F10 maintenance cost**：追加式单目录；无索引、无迁移、无清理逻辑。
- **F10 disposition**：keep。

### DEC-005 — 隔离与零机器门禁：静态投影 + 谓词退出推进路径

- **Problem**：build-prd 失败/完成后不得滑入代码阶段；正式阶段推进不得被 24 项机器谓词阻断。
- **Options**：①运行时在正式路径上特判 build-prd；②投影校验阶段合法性 + portable 链不触发 completion 认证/后续阶段；③保留谓词作 gate 但加豁免。
- **Selected**：② — 拓扑投影是固定映射无动态拼接（spec §8 约束）；portable 分支不调用 runOfficialStage、不触发五阶段 completion 认证、不启动后续阶段；P4 把 24 项谓词从推进路径改为记录事实（物理删除归 CARD-06，G-002）。
- **Reason**：隔离由结构保证（投影内无代码阶段），不靠运行特判；去门禁以「推进不被阻断」为证据，不以「代码不存在」为证据。
- **Consequence / risk**：去门禁触及 stage-handlers/task-kernel/stage-runner 内校验调用位（名单常量不改），回归面以 P4 targeted 测试固定。
- **Fallback**：任一谓词仍阻断推进⇒P4 RED 保持红，不回绿。
- **F10 disposition**：keep — 谓词降级为记录，无新增校验基建。

## Test Strategy

设计 RED/GREEN，不在 build-plan 执行命令。两者使用同一 `gate_cmd` 与 oracle identity；`gate_cmd` 只是测试命令，不是工作许可证。所有 targeted 命令固定 singleFork/no-fileParallelism；只跑受影响测试，不做全量回归。

| Target | Task | Role | gate_cmd / expected_exit | Oracle / evidence_path |
| --- | --- | --- | --- | --- |
| FR-TYPE-001/002/003、FR-TOPO-001/002；AC-TYPE-001/002/003、AC-TOPO-001/002 | T001 | RED | `npx --no-install vitest run tests/contract/task-topology-projection.test.mjs --poolOptions.forks.singleFork --no-fileParallelism` / 非零 | `ORACLE-P1-TOPO`：类型受控值/唯一读回/非法四类→unknown、投影逐字、阶段-拓扑校验、build-prd 对普通任务非法、无动态拼接；`quality/tests/P1-topology.json` |
| 同上 | T002 | GREEN | 同一命令 / 0 | 同一 `ORACLE-P1-TOPO`（含负例保留）；同一 evidence |
| FR-PRD-001/002/003；AC-PRD-001/002/003 | T003 | RED | `npx --no-install vitest run tests/contract/portable-workflow-run.test.mjs --poolOptions.forks.singleFork --no-fileParallelism` / 非零 | `ORACLE-P2-PORTABLE`：六步加载/自校验、六 outcome 齐备⇒succeeded、缺步/形状非法⇒failed+原因、重入语义、终态记录形状、不触代码阶段；`quality/tests/P2-portable.json` |
| 同上 | T004 | GREEN | 同一命令 / 0 | 同一 `ORACLE-P2-PORTABLE`；同一 evidence |
| FR-MIG-001、FR-STATE-001/002/003；AC-MIG-001、AC-STATE-001/002/003 | T005 | RED | `npx --no-install vitest run tests/contract/activation-cohort.test.mjs --poolOptions.forks.singleFork --no-fileParallelism` / 非零 | `ORACLE-P3-COHORT-STATE`：bootstrap stamp、标记缺失⇒pre、晚声明/暂停不改、终态七值记录、历史追加不覆盖；`quality/tests/P3-cohort-state.json` |
| 同上 | T006 | GREEN | 同一命令 / 0 | 同一 `ORACLE-P3-COHORT-STATE`；同一 evidence |
| FR-FLOW-001/002/003、FR-GATE-001/002/003/004、FR-IFACE-001/002/003、FR-REVIEW-001；AC-FLOW-001/002/003、AC-GATE-001/002/003/004、AC-IFACE-001/002/003、AC-REVIEW-001、AC-MIG-001 | T007 | RED | `npx --no-install vitest run tests/contract/zero-machine-gate-advancement.test.mjs tests/integration/card-01-dual-journey.test.mjs --poolOptions.forks.singleFork --no-fileParallelism` / 非零 | `ORACLE-P4-ZERO-GATE-JOURNEY`：缺 round_count/机器校验事实时推进不被阻断、缺项如实记录、旧失败不漂白、`outline_closed=missing` 样本保留；真实入口夹具三旅程（规划 make-decision→build-prd 收口无代码阶段；post 普通四阶段；pre 普通五阶段）投影逐字、build-prd 失败重入不滑入代码阶段、蓝图六类契约行存在、母/兄弟卡只读、A/B 两类人为门 inventory 与现行合同一致；`quality/tests/P4-zero-gate-journey.json` |
| 同上 | T008 | GREEN | 同一命令 / 0 | 同一 `ORACLE-P4-ZERO-GATE-JOURNEY`；同一 evidence |
| 全部 23 FR / 23 AC | T009 | FINAL | `node tests/acceptance/card-01-current.mjs` / 0 | `ORACLE-FINAL-CARD01`：按 `tests/acceptance/build-prd-current.mjs` 模式 spawn 上述 targeted 文件，输出 UTF-8 JSON，23 条 AC 各恰好一次 `entries[].assertions`；`quality/tests/final-card-01.json` |

约束：RED 仅接受目标断言失败（或目标文件尚不存在导致的命令失败），GREEN 保留全部负例；真实入口执行记录由 integration 测试夹具产出，夹具直调不冒充真实入口；review/confirm/authorize 事实缺一则对应 AC 保持 missing/unavailable，不伪造。本卡 tier=command/service，`e2e_scope=not_required`，non_ui。

## Rollback and Recovery

- **Global recovery rule**：只回滚受影响 Phase 的实现与新增文件；保留四份材料、既有 review/provider/确认/失败事实及历史只读材料；18+ 处正式阶段名单与 core/ 历史区从未触碰故无需恢复。
- **Irreversible boundaries**：commit/push/merge/archive/cleanup 均需现有独立授权（authorize 合同）；本 plan 的测试/review/确认不代替物理授权；activation 标记写入是 CARD-01 owner 发布后的动作，不由 build-code 执行。
- **Recovery owner**：build-code 修复实现/测试；产品方向冲突回 make-decision；规格语义缺口回 build-spec；计划边界/命令错误回 build-plan。

### Deletion Proofs

- **本卡不涉及删除**：本卡为纯增量面——新增两个 `runtime/task/` 模块、五个测试文件、一个接口蓝图文档、一个 activation 标记记录面，并改三处已有文件的接线（`stage-runtime.mjs`、`task-bootstrap.mjs`、`move-map.json`）与 24 项谓词的推进路径调用位。
- **不删除任何既有文件、schema、命令或事实记录**：`WORKFLOW_STAGES`、18+ 处五阶段名单常量、stage-outcomes 与 facts.jsonl 的既有形状、旧 bridge、`core/` 历史区均原样保留。
- **谓词只退出推进路径、不物理删除**：物理删除机器校验归 CARD-06（G-002）；本卡若被要求物理删除，STOP 回 `plan.md`（DEC-005）/`decision-log`（G-002）。
- **无其他删除例外**：若 build-code 阶段出现真实删除需求，须先回本 plan 更新本节并重新取得计划审查，不得静默删除。

### Engineering Risk Handoff

- **PLAN-RISK-001**：拓扑/类型映射写错代价全局（RK-002）。
  - **Affected IDs**：FR-TOPO-001/002、FR-TYPE-001..003、AC-TOPO-001/002、AC-TYPE-001..003；T001/T002。
  - **Trigger**：投影逐字串与 D-001/D-009 不一致。
  - **Consequence**：后续 9 卡在错误接口上施工。
  - **Mitigation or STOP**：`ORACLE-P1-TOPO` 固定逐字断言与负例；不一致即 STOP 回 spec。
  - **Handling Stage**：build-code。
  - **Verification**：P1 GREEN + P4 双旅程投影逐字复核。
- **PLAN-RISK-002**：build-prd 被误升正式阶段或滑入代码阶段（PFACT-004、FR-PRD-003）。
  - **Affected IDs**：FR-PRD-002/003、AC-PRD-002/003、AC-TOPO-001；T003/T004、T008。
  - **Trigger**：portable 分支触发 completion 认证或后续阶段。
  - **Consequence**：第六阶段污染/规划旅程变轨。
  - **Mitigation or STOP**：`ORACLE-P2-PORTABLE`/`ORACLE-P4-ZERO-GATE-JOURNEY` 负例（终态后无 build-plan/build-code/verify-code outcome）；出现即 STOP。
  - **Handling Stage**：build-code。
  - **Verification**：P2/P4 GREEN 负例保留。
- **PLAN-RISK-003**：去门禁被实现成掩盖失败（RK-001）。
  - **Affected IDs**：FR-FLOW-002/003、FR-GATE-001、AC-FLOW-002/003、AC-GATE-001；T007。
  - **Trigger**：缺认证/轮次不阻断且缺失事实被吞掉。
  - **Consequence**：历史质量事实漂白。
  - **Mitigation or STOP**：`ORACLE-P4-ZERO-GATE-JOURNEY` 以「缺项被记录且推进不被阻断」双断言固定；缺项被隐去即红。
  - **Handling Stage**：build-code。
  - **Verification**：P4 GREEN + AC-FLOW-003 对照证据。
- **PLAN-RISK-004**：cohort 被类型声明时点/暂停恢复错误改写（AC-MIG-001 失败判据）。
  - **Affected IDs**：FR-MIG-001、AC-MIG-001；T005/T006。
  - **Trigger**：晚声明或恢复时重算 cohort。
  - **Consequence**：跨 activation 改道。
  - **Mitigation or STOP**：`ORACLE-P3-COHORT-STATE` 固定「创建时冻结、此后永不改写」断言。
  - **Handling Stage**：build-code。
  - **Verification**：P3 GREEN。
- **PLAN-RISK-005**：能力预演冒充 activation（AC-MIG-001 失败判据）。
  - **Affected IDs**：FR-MIG-001、AC-MIG-001；T006、T008。
  - **Trigger**：本卡 verify-code 通过即宣称启用。
  - **Consequence**：新拓扑未正式发布即生效。
  - **Mitigation or STOP**：plan 明确「本卡只交付能力级预演」；activation 标记由 owner 发布后写入；T008 只验样本矩阵可执行，不宣称 activation。
  - **Handling Stage**：verify-code 与 CARD-01 owner。
  - **Verification**：AC-MIG-001 证据分工（本卡=预演引用；owner=发布标识+消费记录+时点）。

## Implementation Order

P1（类型读回+拓扑分流）→ P2（build-prd 执行链）→ P3（cohort 冻结+状态事实）→ P4（去门禁+蓝图+端到端验收）。P1 先立：无投影则 P2 的 portable 分支无处挂、P3 的 cohort 无人读。P2 次之：执行链是规划旅程终点本体。P3 再之：cohort 消费 P1 投影读回面，状态事实消费 P2 终态记录面。P4 最后：去门禁改的是正式路径调用位，必须在投影/执行链冻结后做，蓝图公开与双旅程验收消费前三 Phase 全部事实。各 Phase 内 RED 先于 GREEN，T009 聚合全部 AC。

## Dependencies and Parallelism

- **Dependencies**：T001→T002→T003→T004→T005→T006→T007→T008→T009 概念串行（后一任务消费前一任务的模块/记录面）；**P4 整体串行**：T007 只写失败测试（RED），T008 在同一 gate 下改生产调用位并产出蓝图文档与 move-map 登记（GREEN），T009 必须最后。
- **Parallel work**：无——P4 的 RED/GREEN 共享同一 gate_cmd/oracle，且蓝图文档归属 T008，故不得并行声明；其余 Phase 亦串行，避免在投影/终态形状未冻结时并发猜接口。
- **External dependencies**：activation 标记由 CARD-01 owner 在本卡发布消费后写入（AC-MIG-001）；其 absence 语义=所有新任务 cohort=pre，安全侧，不阻塞本卡任何 Phase。

## Requirement and Verification Traceability

| Source / decision | FR | AC | Phase / Task | Depends on | Exact files | Command / oracle |
| --- | --- | --- | --- | --- | --- | --- |
| D-003；R-003 | FR-TYPE-001 | AC-TYPE-001、AC-TYPE-002 | P1/T001、T002 | none | `runtime/task/task-topology.mjs`、`tools/cli/stage-runtime.mjs`、`tests/contract/task-topology-projection.test.mjs` | P1 gate / `ORACLE-P1-TOPO` |
| D-003；R-003、R-010 | FR-TYPE-002 | AC-TYPE-001、AC-TYPE-003 | P1/T001、T002 | none | 同上 + `quality/evidence/task-type-attempts/`（写入面） | P1 gate / `ORACLE-P1-TOPO` |
| D-003；R-003、R-010 | FR-TYPE-003 | AC-TYPE-003 | P1/T001、T002 | T001 | 同上 | P1 gate（四类材料+恢复轨迹断言）/ `ORACLE-P1-TOPO` |
| D-001、D-006；R-001、R-010 | FR-TOPO-001 | AC-TOPO-001 | P1/T001、T002；P2/T003、T004；P4/T008 | T002 | 投影模块 + portable 链 + integration | P1 gate + P2 gate + `ORACLE-P4-ZERO-GATE-JOURNEY` 逐字投影 |
| D-001、D-009；R-002、R-010 | FR-TOPO-002 | AC-TOPO-002、AC-MIG-001 | P1/T001、T002；P3/T005、T006；P4/T008 | T002 | 投影模块 + task-bootstrap + integration | P1 gate + P3 gate + `ORACLE-P4-ZERO-GATE-JOURNEY` 样本矩阵 |
| D-009；R-002、R-010、R-014 | FR-MIG-001 | AC-MIG-001、AC-TOPO-002 | P3/T005、T006；P4/T008 预演面 | T002 | `tools/cli/task-bootstrap.mjs`、`<storageRoot>/activation/card-01.json`（三事实契约）、cohort 契约测试 | P3 gate / `ORACLE-P3-COHORT-STATE`：三事实齐备⇒post、空/部分标记⇒pre、五类样本顶层拓扑（`spec.md:496`）+ 七条失败判据对照 |
| D-006、D-008；PFACT-003 | FR-PRD-001 | AC-PRD-001 | P2/T003、T004 | T002 | `runtime/task/portable-workflow-run.mjs`、`workflows/build-prd/steps.json`（只读） | P2 gate / `ORACLE-P2-PORTABLE` |
| D-008；PFACT-004 | FR-PRD-002 | AC-PRD-002 | P2/T003、T004；P4/T008 | T003 | portable 链 + integration | P2 gate + `ORACLE-P4-ZERO-GATE-JOURNEY` 收口断言 |
| D-008；PFACT-004 | FR-PRD-003 | AC-PRD-003 | P2/T003、T004；P4/T008 | T003 | 同上 | P2 gate（失败/重入负例）+ `ORACLE-P4-ZERO-GATE-JOURNEY` |
| D-002；R-004 | FR-FLOW-001 | AC-FLOW-001 | P4/T007、T008 | T006 | `tests/contract/zero-machine-gate-advancement.test.mjs` 驱动的调用位（stage-handlers/stage-runner/task-kernel 内，名单不改） | P4 zero-gate gate / `ORACLE-P4-ZERO-GATE-JOURNEY` |
| D-002；R-004、R-005 | FR-FLOW-002 | AC-FLOW-002 | P4/T007、T008 | T006 | 同上 | 同上 |
| D-002、D-005；R-005 | FR-FLOW-003 | AC-FLOW-003 | P4/T007、T008 | T006 | 同上 | 同上（旧阻断事实保留对照断言） |
| D-002；R-006 | FR-GATE-001 | AC-GATE-001 | P4/T007、T008 | T006 | 同上 + 本 plan §Canonical Inventory Freeze「机器阻断谓词 inventory」（5 族 + 18 谓词站点 + 24-vs-18 差异记录） | 同上（族级×转移矩阵断言 + 18 站点逐个去阻断） |
| D-002；R-007 | FR-GATE-002 | AC-GATE-002 | P4/T008 | T006 | 本 plan §Canonical Inventory Freeze「A/B 人为门 inventory」（F7 原文 L54-59 + authorize 合同 13 处定位）+ 只读调用位（task-kernel-implementation.mjs:879-1008） | `ORACLE-P4-ZERO-GATE-JOURNEY` 之 A/B inventory 逐项一致 + 等待/拒绝/批准三路径 + 沙箱 B 类正例无真实副作用 |
| D-002、D-003；R-006 | FR-GATE-003 | AC-GATE-003 | P4/T007、T008 | T006 | 同上 | `ORACLE-P4-ZERO-GATE-JOURNEY` 四类事实不互冒充断言 |
| D-002、D-004；R-008 | FR-GATE-004 | AC-GATE-004 | P4/T007、T008 | T006 | 同上 | `ORACLE-P4-ZERO-GATE-JOURNEY` 规则事实只影响验收结论断言 |
| D-003、D-008；R-009 | FR-STATE-001 | AC-STATE-001 | P2/T003、T004；P3/T005、T006 | T002 | portable 终态记录 + cohort 契约测试 | P2 gate + P3 gate |
| D-003、D-004；R-009 | FR-STATE-002 | AC-STATE-002 | P3/T005、T006；P4/T008 | T002 | task-bootstrap + integration 材料清单核对 | P3 gate + `ORACLE-P4-ZERO-GATE-JOURNEY` |
| D-002、D-003、D-008；R-009 | FR-STATE-003 | AC-STATE-003 | P3/T005、T006；P4/T008 | T004 | 终态记录 + 本 plan §七值状态冻结（七值语义与转换/重入逐值）+ integration | P3 gate（七值逐值 + `unverified` 在场 + blocked 仅非机器外部依赖 + failed 重入 + abandoned）+ `ORACLE-P4-ZERO-GATE-JOURNEY` |
| D-004；R-011、R-012、R-015 | FR-IFACE-001 | AC-IFACE-001 | P4/T008 | T001..T006 | `docs/contracts/card-01-stage-material-interface.md` + integration 存在性/行断言 | `ORACLE-P4-ZERO-GATE-JOURNEY` 蓝图六类契约行 |
| D-004；R-012 | FR-IFACE-002 | AC-IFACE-002 | P4/T008 | T001 | 蓝图 owner/合并/验收责任行 + integration | `ORACLE-P4-ZERO-GATE-JOURNEY` |
| D-004；R-015 | FR-IFACE-003 | AC-IFACE-003 | P4/T008 | 全程约束 | integration 前后材料对照 | `ORACLE-P4-ZERO-GATE-JOURNEY` 只读断言 |
| D-007、D-010；R-006、R-013 | FR-REVIEW-001 | AC-REVIEW-001 | P4/T009 | 既有基线（0f792a9b/33319b90/cd26676a 已修复） | 既有 manifest/helper/底层测试（回归，不改代码） | `ORACLE-FINAL-CARD01` 含 AC-REVIEW-001 五条具名断言（单向依赖链、无第二个 review dispatch step、SKILL 不回跳语义、`reviewCycleDecision` 只输出 advance、材料 B 不复用 A） |

反向闭包：23 条 AC 各至少绑定一个 oracle；AC-MIG-001 的正式 activation 部分由 CARD-01 owner 在发布后补齐（本卡只交能力预演面，见 PLAN-RISK-005）；AC-REVIEW-001 依赖已合入基线的 D-007 修复事实，本卡只回归不新修。

## Acceptance Criteria Cards

> 本节按 spec.md《11. 验收标准》原样转写 23 条 AC 卡（标题与 验证/通过/失败/证据 四段逐字一致），供 build-code/verify-code 直接消费；不改写 spec 的验收语义。

- [ ] **AC-MIG-001**：四阶段只在正式激活后用于新任务
验证：本卡 verify-code 先在安全环境做能力级预演，证明 cohort×类型映射可执行但不宣称 activation；发布后由 CARD-01 owner 记录正式 main/release 标识、正式入口消费证据和 activation 时点，并创建/恢复矩阵样本：pre cohort 普通任务跨 activation 恢复、pre cohort 晚声明普通、pre cohort 晚声明规划、post cohort 普通、post cohort 规划。
通过：仅能力预演或仅发布时仍未激活；入口实际消费时形成唯一 activation；cohort 在创建/记录落点时追加保存且暂停/恢复/晚声明不改变；两类规划样本均走 `make-decision→build-prd`，pre 普通样本均走旧五阶段，post 普通样本走目标四阶段；CARD-01 owner 关闭 activation 验收，CARD-10 只核对事实存在。
失败：能力预演冒充 activation、缺入口消费证据即启用、以类型声明时点替代 cohort、规划任务被 cohort 强制走普通路径、普通任务跨 activation 改道、CARD-10 重做内容验收，或等 CARD-06/CARD-10 才首次启用。
证据：能力级预演引用；发布后由 CARD-01 owner 补充发布标识、入口消费记录、activation 时点、cohort 追加事实、五类样本顶层拓扑投影和 activation 验收关闭事实。

- [ ] **AC-TOPO-001**：规划拓扑精确且可执行
验证：从真实入口创建任务，在 make-decision 中人工声明“规划任务”，读回工作流定义和实际阶段轨迹。
通过：声明与执行事件导出的规范化顶层拓扑投影均恰为 `make-decision→build-prd`，build-prd 可执行且无第三阶段；build-prd 六步及失败重试保留在嵌套历史，不计为顶层阶段。
失败：顶层投影出现 build-plan、build-code、verify-code 任一阶段；声明与投影不一致；把内部步骤/合法重试误算成新增阶段；或只有静态文件存在而无真实执行。
证据：真实入口执行记录、阶段轨迹、工作流定义读回。

- [ ] **AC-TOPO-002**：普通任务拓扑精确且可执行
验证：能力预演阶段从真实入口的安全环境创建 post-cohort 等价样本，在 make-decision 中人工声明“普通任务”，执行到旅程终点并读取顶层拓扑投影、verify-code 阶段状态、逐项 quality facts 和后续阶段轨迹；发布后由 AC-MIG-001 的 CARD-01 owner 用正式入口消费事实关闭 activation 部分。
通过：能力预演的规范化顶层投影恰为 `make-decision→build-plan→build-code→verify-code`；verify-code 核心行为完成后记 succeeded，验证事实进入任务追踪记录且无后续阶段。若适用 quality facts 缺失，仅对应 facts 保持 missing/unavailable/incomplete 并可继续补验证，不创建 task 质量状态、不改变拓扑终点；发布后 activation 关闭事实另由 CARD-01 owner 补齐。
失败：activation 前在途任务被中途改道；activation 后新任务缺少任一阶段、顺序错误、进入 build-prd、只有静态定义没有真实执行、verify-code 成功后继续出现后续阶段，或缺质量事实/unverified 被写成 task 质量完成。
证据：真实入口执行记录、阶段轨迹、工作流定义读回、verify-code 结果、任务状态与无后续阶段事实。

- [ ] **AC-TYPE-001**：受控值声明与唯一读回
验证：从不带任务类型参数的正式入口分别建立两个任务，再在 make-decision 使用两个合法值创建当前 decision-log 声明并读回；另以入口类型参数/默认值探针验证其不被接受或消费。
通过：任务建立前入口不接受或消费类型路由参数/默认值；每个任务只在 make-decision 形成一条固定标签声明，且读回结果与人工选择完全一致。
失败：入口新增或消费类型参数/默认值、允许第三个值、产生多份当前声明/store，或读回结果与声明不一致。
证据：任务材料与类型读回结果。

- [ ] **AC-TYPE-002**：不存在按体量自动分流
验证：用两个体量显著不同但尚未声明类型的任务进入 make-decision。
通过：两者均停留在人工类型选择/声明处，任务体量不改变类型。
失败：任一任务被代码按体量、文本、文件名、历史或哈希自动分类。
证据：两次真实入口交互与任务材料。

- [ ] **AC-TYPE-003**：非法或不唯一声明触发澄清
验证：覆盖缺失、重复、冲突、非法值四种材料；每种情况均完成一次真实澄清，形成合法当前声明并重新读回，同时观察类型相关与类型无关工作。
通过：四种情况均先返回无法识别；类型相关操作（选择顶层拓扑、进入 build-prd/build-plan 及其类型专属内容）暂停，且不得启动任何后续 stage；类型无关准备（读取当前四材料、记录 cohort/诊断事实、检查 worktree/任务身份）继续。答复后原异常尝试保留为历史事实，当前任务身份段恰好一条合法标签，重新读回后只恢复类型相关分支；该澄清属于既有推进确认对话，不形成第三类阶段门。
失败：系统猜测类型、静默选择默认值、阻断上述全部类型无关准备、在类型未知时启动类型相关 stage、留下多个当前标签、覆盖异常历史，或答复后仍无法恢复依赖类型的分支。
证据：初次与修正后读回结果、澄清交互、任务身份段、异常历史与恢复执行轨迹。

- [ ] **AC-PRD-001**：build-prd 六步从入口可达
验证：规划任务从真实入口进入 build-prd，核对六项内容责任、每项可观察结果和最终完成判据；另构造有理由的乱序/暂停恢复，确认清单顺序不作机器 gate。
通过：六项责任均可执行并产生既有合同要求的结果；依赖关系仍作为推荐顺序核对，但乱序/暂停本身不阻断；只有六项责任全部完成才可 succeeded；接线未改变内容。
失败：入口拒绝 build-prd、任一项因“非正式阶段”身份不可达、为凑顺序伪造事实、缺任一完成责任却 succeeded，或内容被本卡改写。
证据：portable workflow 六项责任记录、乱序/恢复轨迹、完成判据与最终状态。

- [ ] **AC-PRD-002**：规划旅程成功终止
验证：完成 build-prd 六步后检查最终状态、记录和后续阶段。
通过：build-prd 核心六项责任完成后记 succeeded，产出与执行事实存在于任务追踪记录，规划旅程执行收口且不触发 build-plan/build-code/verify-code；正式五阶段集合未新增 build-prd。适用质量事实缺失时，仅对应 quality facts 保持 missing/unavailable/incomplete 并可继续补验证，不创建 task 质量状态、不改变拓扑终点。
失败：无终止状态、进入代码阶段、依赖五阶段 completion 认证才能到达执行终点、缺质量事实却宣称 task 质量完成，或 build-prd 被升为正式阶段。
证据：任务状态、事实记录、后续阶段轨迹、正式阶段定义读回。

- [ ] **AC-PRD-003**：规划旅程失败不滑入代码阶段
验证：使 build-prd 任一步产生可控失败，修复后重入该步。
通过：失败时状态为 failed 且原因保留；修复后可重入失败步骤；全过程不进入任何代码阶段。
失败：失败被写成 succeeded/unverified、任务自动切换到普通旅程，或只能整条旅程重建才能继续。
证据：失败与重试执行记录、状态变化、阶段轨迹。

- [ ] **AC-FLOW-001**：流程清单是参考而非顺序锁
验证：构造一个不适用项、一个有理由的乱序/跳过项和一个追加问题，继续当前阶段。
通过：三种情况均记录真实状态与理由且可继续；清单仍可用于阶段末核对。
失败：因缺步/乱序阻断，要求伪造完成以凑齐，或直接删除清单导致无核对参照。
证据：清单逐项披露、阶段执行记录。

- [ ] **AC-FLOW-002**：固定轮次与通用 completion 不阻断
验证：在未走固定 Talk 轮次且缺 stage completion 通用认证的真实任务中推进。
通过：任务可继续，实际轮次与认证缺失被如实记录，无补造事实。
失败：缺认证或轮次不足即阻断，或系统为推进生成虚假认证/轮次。
证据：真实任务轨迹、质量事实与缺失披露。

- [ ] **AC-FLOW-003**：去阻断前后历史事实同时保留
验证：选择至少一条曾因缺认证或固定轮次而阻断的既有历史记录，再执行去阻断后的同类推进；对照旧记录、变更事实与新执行事实。
通过：旧阻断事实、去阻断变更事实和新推进事实均可分别定位；旧记录的来源与原结论未被覆盖；原 `missing`、`unavailable`、`failed` 或其它非成功结论保持原义，不被写成 pass/succeeded。
失败：旧阻断记录消失、被覆盖或被重写为成功；只保留新推进结果；或摘要替代原始来源。
证据：旧阻断原始记录引用、去阻断变更事实引用、新执行事实引用及三者对照结果。

- [ ] **AC-GATE-001**：零机器推进门禁且事实不漂白
验证：以 RS-001 的 24 项现状阻断谓词为逐项输入，建立“具体谓词/consumer × 适用阶段/转移”矩阵，并映射到 FR-GATE-001 的封闭类别；每个 N/A 必须有谓词级理由，并保留 `outline_closed=missing` 样本；对每个适用格构造缺失或无效事实后继续安全工作。
通过：矩阵每个适用格均记录真实缺失/无效状态且不阻断同任务工作；不适用格有理由；`outline_closed` 仍为 missing；任何缺项均不得支持质量完成声明。
失败：任一适用机器事实成为推进许可，矩阵漏项，缺项被隐去/改写为 pass，或为了通过伪造 aggregate。
证据：完整机器事实矩阵、各缺失/无效场景执行轨迹、事实记录与阶段质量摘要。

- [ ] **AC-GATE-002**：仅保留两类人为门
验证：读取并冻结当次 `CONSTITUTION.md` F7 与公共 authorize 合同原文/版本，据此对规划与普通任务完整拓扑建立人工阻断 inventory，覆盖每个阶段/workflow 转移、review/test/evidence 派发和全部合同项；逐项执行等待/未答、拒绝和批准的代表性路径。B 类批准正例只能在一次性沙箱/替身目标上、预先取得该测试动作独立授权后执行；禁止对当前真实仓库执行未授权不可逆操作，fixture 由 DEFER-003 参数化。
通过：inventory 与引用合同原文逐项一致；所有人工阻断严格属于 A/B 两类。等待/未答时当前动作不执行并记录 pending fact，可在真实答复后恢复；拒绝时动作不执行并记录拒绝，任务可重试、继续不依赖该动作的安全工作或由用户选择 abandoned；批准后仅执行被确认/授权的具体动作；A 类事实不满足 B 类授权；沙箱 B 类正例不影响真实仓库。
失败：出现合同外第三类阻断、漏合同项/转移/派发路径、未答或拒绝却执行动作、伪造同意、把 A 类确认复用为 B 类授权、自行扩大授权集合，或对真实仓库执行未授权动作。
证据：合同原文与版本引用、两类任务 inventory、pending/拒绝/批准交互与授权事实、恢复/重试/abandoned 轨迹、沙箱与真实仓库无副作用记录。

- [ ] **AC-GATE-003**：物理不可行不扩成质量门禁
验证：分别观察任务身份/worktree 无法建立、当前材料字节不可读、已建立任务仅缺材料身份/hash 等辅助质量事实，以及不可逆操作等待独立授权四种情况。
通过：无记录落点时不伪称已开始；材料物理不可读时仅依赖其内容的动作报告读取失败并可修复重试；辅助机器事实缺失时工作继续且缺项保留；不可逆操作只在既有授权合同边界等待人；四类事实互不冒充。
失败：把不可读材料静默当空内容、把辅助事实缺失升级为物理阻断、把授权边界称为额外物理 gate，或无 worktree 时伪称已开始。
证据：四种场景的入口/读取/推进/授权事实与修复重试轨迹。

- [ ] **AC-GATE-004**：规则类要求只影响验收结论
验证：对迁移表冻结、并行声明、接口蓝图冻结建立规则事实 inventory，分别构造缺失或失败样本并继续同任务修复。
通过：每项实际状态均被记录；未做/失败使对应验收核对保持失败或缺失，但不阻断其它安全工作；修复后更新当前事实且旧失败保留。
失败：任一规则事实成为推进许可证、缺失被漂白为通过，或因为不阻断而不记录验收失败。
证据：规则事实 inventory、缺失/失败记录、继续工作与修复后的事实引用。

- [ ] **AC-STATE-001**：七值状态且不假绿
验证：检查规划/普通路径的成功、失败、未验证和放弃等代表性状态记录。
通过：所有阶段状态属于七值集合；未验证、缺失或失败均不写成 succeeded；build-prd 使用状态但未进入正式阶段集合。
失败：出现第八个状态、状态含义漂移，或用 succeeded 漂白缺失/失败。
证据：任务状态记录和正式阶段定义。

- [ ] **AC-STATE-002**：记录归属单一
验证：检查一个规划任务和一个普通任务的当前材料与执行事实落点。
通过：当前权威仍只有四材料；类型位于 decision-log；执行事实位于既有任务追踪目录；不存在第五材料或第二状态机。
失败：新增平行 spec/状态账本/store，或用历史记录替代当前材料。
证据：任务材料清单与任务追踪记录清单。

- [ ] **AC-STATE-003**：普通阶段失败、重入与放弃语义完整
验证：分别在 build-plan、build-code、verify-code 构造代表性失败，并对 build-prd 覆盖人工等待、可识别非机器外部依赖 blocked/解除、材料读取动作 failed/重试、unverified 补验证、用户 abandoned；读取状态历史与后续轨迹。
通过：创建/开始/成功/失败/缺验证/阻塞/放弃均使用七值合同；blocked 仅绑定有 owner/解除条件的非机器外部依赖；failed 或 blocked 时后续阶段不自动启动；修复或条件解除后重入原阶段；abandoned 后不再推进；全部旧状态与原因可查。
失败：失败后自动启动下一阶段、覆盖旧失败、无法重入、把未验证写成功、另造阶段状态值、把机器/质量事实缺失包装为 blocked，或把材料不可读扩大成整个阶段 blocked。
证据：三阶段失败/恢复执行记录、状态历史和后续阶段未启动事实。

- [ ] **AC-IFACE-001**：接口蓝图完整且非门禁
验证：在 build-plan 读取蓝图，逐项核对 FR-IFACE-001 枚举的六类契约（受控值、类型→拓扑、正式/portable 身份、七值状态、材料/事实归属、推进/完成分离），同时模拟蓝图冻结事实缺失后继续修复。
通过：上述六类各有对应蓝图行且可供后续卡消费；人工边界与审查重派作为附加接口保留；缺冻结事实计验收缺口但不阻断同任务修复。
失败：后续卡必须猜任务类型、拓扑、状态或归属；或蓝图事实被升级为推进 gate。
证据：build-plan 接口映射、缺口披露与继续工作记录。

- [ ] **AC-IFACE-002**：跨卡责任不漂移
验证：读取 make-decision 开工责任记录，核对 owner、接口冻结/合并责任、本卡验收责任和 CARD-10 总体责任。
通过：开工记录指派本 task 主会话为 owner；CARD-01 先提供蓝图且承担合并责任、CARD-02 在其上对齐；本卡 verify-code 负责自身 AC；CARD-10 只核对事实存在并可抽验；缺记录只形成验收失败事实，不阻断修复。
失败：开工未指派且被漂白为完成、本卡改写 CARD-02 职责，或 CARD-10 变成逐条重跑本卡 AC 的总门禁。
证据：跨卡交接与各卡验收引用。

- [ ] **AC-IFACE-003**：母任务与兄弟卡保持只读且不被 close
验证：记录母 PRD、母任务和兄弟卡材料的前置内容/位置/任务状态，分别执行规划与普通真实旅程后重新核对。
通过：两条旅程前后母 PRD、母任务和兄弟卡材料未改写、移动或删除；母任务保持原状态且未触发 close。
失败：任一材料内容或位置变化、兄弟卡被本卡写入，或母任务被 close。
证据：前后材料清单与内容对照、母任务状态、两条旅程执行记录。

- [ ] **AC-REVIEW-001**：显式 recorder currentness 与 review→dispose→analyze 前移
验证：读取真实 build-spec manifest，断言 review-frozen-spec→main-agent-disposes-findings→stage-end-spec-analyze→publish-spec-result 为单向依赖链，review 与 publish 之间无第二个 review dispatch step；SKILL 文本明确 disposition 修改 spec 后不重新派发已完成 review；真实 reviewCycleDecision helper 在 serious finding 且 actualRepair/subjectChanged 存在时仍返回 action=advance。另在 workflow 正处 review step 且调用方显式再次调用 recorder 的独立底层用例中，材料 B 不复用 A 的结果。
通过：manifest 单向依赖锁定、SKILL 不回跳语义存在、helper 只输出 advance 不输出 review 动作；显式 recorder 调用把 B 误复用为 A 的情况不存在。
失败：dispose 后自动回跳 review、analyzer 看到 before，或显式 recorder 调用把 B 误复用为 A。
证据：针对性 contract test、真实 manifest depends_on、底层 recorder currentness 既有测试。

## Governance Synchronization Matrix

| Governance surface | Actual files | Change / no change | Task IDs | Reason |
| --- | --- | --- | --- | --- |
| 宪法面 | `CONSTITUTION.md`、`constitution-checklist.md` | no change | 全部 | 本卡不改变确认语义/条款；F7 两道人为门原样复用 |
| 技能面 | `workflows/build-prd/**`、`skills/spec-plan`、`runtime/schemas/**` | no change | 全部 | build-prd 六步内容不变；plan 按 plan-task.v4 再生；无新 schema 文件 |
| 测试面 | 6 个新测试文件（4 contract + 1 integration + 1 acceptance runner） | change | T001-T009 | targeted only；18+ 处五阶段名单的既有测试零改动 |
| 文档面 | `docs/contracts/card-01-stage-material-interface.md`（NEW 公开契约）、`docs/architecture/move-map.json` | change | T008 | owner=本卡主会话；consumer=CARD-02..10；test=T008 存在性与六类契约行断言；**删除条件=接口蓝图被后续卡经审查的统一契约面取代** |
| 记录面 A | `<storageRoot>/activation/card-01.json`（运行时一次性标记，**非本卡 Phase 生产文件**，形状由本 plan 冻结） | design only | T005（仅夹具） | owner=CARD-01 owner（发布消费后写入，本卡不实现写入命令）；consumer=task-bootstrap cohort 判定、CARD-10 存在性核对；test=T005/T006 以夹具构造；删除条件=CARD-01 拓扑规则被取代 |
| 记录面 B | task.json manifest 三个 cohort 字段 | change | T006 | owner=本卡主会话；consumer=task-topology cohort 读回；test=T005/T006；删除条件=cohort 机制被取代 |
| 记录面 C | `quality/evidence/portable-workflow-outcomes/build-prd/terminal/` 七值终态记录 | change | T003/T004、T006 | owner=本卡主会话；consumer=`status --stage=build-prd` 最新终态投影；test=T003/T004/T006；删除条件=统一 portable workflow 执行器出现且本记录无历史消费 |
| 记录面 D | `quality/evidence/task-type-attempts/` 类型异常尝试记录 | change | T001/T002 | owner=本卡主会话；consumer=类型澄清轨迹、CARD-07 读者；test=T002；删除条件=类型澄清机制被取代 |
| 历史/母材料 | `specs/archive/**`、母 PRD、兄弟卡材料 | no change | 全部 | FR-IFACE-003 只读 |

## Constitution Check

- **Constitution binding**：`{"artifact_kind":"constitution","ref":"constitution-checklist.md","hash":"91c72a0db7a77da84369d0aada56105612c21def13761f6aa7db387b8922f434","id":"CONSTITUTION","version":"1.9.0","clause_count":22}`
- **F1**：核心只做调度：stage-runtime 仅加读回校验+路由两个窄分支；拓扑投影/执行链/记录均下沉 `runtime/task/` 新模块；18+ 处正式阶段名单零改动。
- **F2**：窄契约：task-topology 与 portable-workflow-run 均为纯函数/窄接口；decision-log 固定标签、manifest cohort 字段、终态记录形状三个窄 schema。
- **F3**：四材料仍只决定进入/继续；cohort/终态/尝试记录都在任务追踪目录既有记录面内，不写第五材料。
- **F4**：review 不作 pass gate（D-007/D-010 已落地并回归）；类型澄清、build-prd 失败均不锁死修复。
- **F5**：不新增 gate：拓扑校验是路由非质量门；activation 标记是记录非门；谓词只减不增（P4 退出推进路径）。
- **F6**：统一外置执行记录：全部新事实写任务追踪目录既有命名空间；不 pin runner；旧 bridge/dispatch-component 不复活为门。
- **F7**：三处正常确认与授权合同不变；make-decision 的 approve-decision 即类型声明所在阶段（第一道人为门 A）；不可逆动作仍走 authorize（门 B）；本卡不新增日常确认。
- **F8**：简单优先：复用 readTaskTypeFromDecisionLog 与 task-close 的 outcome 命名空间（不复制其校验器）；portable manifest 自带最小形状校验；无 replacement 链。
- **F9**：可证伪：五组 RED/GREEN 同一命令与 oracle；missing/unavailable/failed 保持原义；`outline_closed=missing` 样本保留（PFACT-007）。
- **F10**：真实收益：两个窄模块解决规划旅程不可达与门禁阻断两个真实问题；无「为校验而校验」新基建。
- **F11**：新控制面均登记 owner/consumer/test/删除条件（见 Reuse→Extend→New 与 Governance 矩阵）；辅助事实（机器/质量缺失）未被升级成工作阻塞。
- **Q1**：质量事实不作准入证：去门禁后缺失仍记录且影响完成声明，不影响推进；本 plan 不宣称任何质量完成。
- **Q2**：推进资格（拓扑投影+两道人为门）/发布结构（activation 标记与发布标识）/完成判据（逐 AC oracle）分离。
- **Q3**：异源审查：本卡 verify-code 走独立 review + 用户确认；plan 不自审自判。
- **S1**：复用现有入口/registry/outcome 约定/读回器/校验器，未造轮子。
- **S2**：未采用外部新技能；既有 spec-plan v4 模板就地使用。
- **S3**：plan-task.v4 模板再生本 plan；来源路径（模板路径）已在结构模板中声明。
- **S4**：指标沿统一 targeted 测试与 acceptance entries，不建新指标 store。
- **S5**：两个新模块为纯函数，便于子代理调用与主上下文省占。
- **S6**：结构密度对标 archive `specs/archive/workflowhub-build-prd/plan.md` 与 v4 模板，不闭门新造。
- **S7**：一工作流一文件夹：build-prd 仍在 `workflows/build-prd/`，无新 stage 文件夹；核心零改可加。
- **S8**：新模块为纯 Node ESM、host-agnostic，可独立搬运。

## Phase P1 — 任务类型声明读回与入口拓扑分流

### Goal

入口能从 decision-log 读回唯一受控任务类型，按 cohort 得到逐字静态拓扑投影；类型缺失/重复/冲突/非法返回无法识别、请求澄清并保留异常历史；所请求阶段不在投影内 fail-loud；类型无关命令不受类型状态影响。

### Files

- **NEW**：`runtime/task/task-topology.mjs`、`tests/contract/task-topology-projection.test.mjs`
- **MODIFY**：`tools/cli/stage-runtime.mjs`（run/status 前挂读回校验）
- **DO NOT TOUCH**：`runtime/stage/stage-content-contracts.mjs`（读回器零改动）；18+ 处正式阶段名单；`core/**`；`workflows/build-prd/**`

### Tasks

- T001 — RED：写 `task-topology-projection.test.mjs`，固定受控值恰 `{规划任务,普通任务}`、唯一读回、四类异常→unknown、投影逐字（规划两项/post 普通四项/pre 普通五项）、build-prd 对普通任务非法、无动态拼接、status/doctor 不依赖类型；当前全部失败（模块不存在）。
- T002 — GREEN：实现 `task-topology.mjs`（读回包装、cohort 读回缺省 pre、静态投影、阶段校验、异常记录写入）；stage-runtime run/status 在构建正式上下文前调用校验：unknown⇒非零+澄清消息并写 `quality/evidence/task-type-attempts/`；阶段不在投影⇒非零+期望拓扑；校验通过⇒原路径继续。

### Verify

同一命令 `npx --no-install vitest run tests/contract/task-topology-projection.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`；RED expected=非零，GREEN expected=0；`ORACLE-P1-TOPO`；证据 `quality/tests/P1-topology.json`。

### Knowledge

投影逐字串冻结给 P2/P4：规划=`make-decision→build-prd`；普通 post=`make-decision→build-plan→build-code→verify-code`；普通 pre=含 build-spec 五阶段。澄清语义：只暂停类型相关分支。

### STOP

实现要求入口新增类型参数、扩 WORKFLOW_STAGES、把拓扑校验做成质量门或允许第三值/多标签时，停止回 spec/plan。

### Done

AC-TYPE-001/002/003、AC-TOPO-001/002 的投影/读回/校验面有正负证据；真实行为变化：规划任务可合法请求 `--stage=build-prd`（执行链未接前仍止于路由验证），普通任务请求 build-prd 被拒。

### Risks and rollback

风险是路由误拒/误放；回滚 stage-runtime 挂载点与 task-topology.mjs，入口恢复现状，无其他面受影响。

## Phase P2 — build-prd portable 执行链与终止语义

### Goal

规划任务经 `run --stage=build-prd` 进入 portable 执行链：六步 outcome 记录齐备且形状合法⇒写 succeeded 终态；任一步缺失/非法⇒写 failed 终态（真实原因+失败步），修复后重跑重入该步；全程不触发正式 completion 认证、不启动代码阶段。

### Files

- **NEW**：`runtime/task/portable-workflow-run.mjs`、`tests/contract/portable-workflow-run.test.mjs`
- **MODIFY**：`tools/cli/stage-runtime.mjs`（run 增加 portable 分支；status 增加 build-prd 七值投影）
- **DO NOT TOUCH**：`workflows/build-prd/**`（六步内容）；`runtime/stage/step-manifest.mjs`（portable 链直读 steps.json）；`core/task-close.mjs`（只读复用形状）

### Tasks

- T003 — RED：写 `portable-workflow-run.test.mjs`，固定六步加载与自带最小形状校验（含「`validateStepManifest` 未被导入」与「对 build-prd/steps.json 调用它必 `ok:false`」两条对照断言）、六 outcome 齐备⇒succeeded、缺第三步⇒failed 且 failed_step=confirm-map-and-conditional-design、形状非法⇒failed、重入后写新终态且历史保留、终态记录不含任何代码阶段触发、status 投影七值；当前失败。
- T004 — GREEN：实现 portable-workflow-run.mjs（manifest 直读+自校验、逐步核对 outcome、终态记录写入、最新终态读取）；stage-runtime run 在校验通过后对 build-prd 调该链；status 读最新终态投影 not-started/in-progress/succeeded/failed 等七值。

### Verify

同一命令 `npx --no-install vitest run tests/contract/portable-workflow-run.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`；RED=非零，GREEN=0；`ORACLE-P2-PORTABLE`；证据 `quality/tests/P2-portable.json`。

### Knowledge

终态记录形状冻结给 P3/P4：`{record_kind:"portable_workflow_terminal", task_id, workflow:"build-prd", state, reason, failed_step, step_result_refs, started_at, completed_at}`；命名空间=`quality/evidence/portable-workflow-outcomes/build-prd/`。

### STOP

实现要求改六步内容、把 build-prd 写进正式 manifest/名单、触代码阶段或新建 dispatcher 时，停止回 plan/spec。

### Done

AC-PRD-001/002/003 有正负证据；真实行为：规划任务六步事实齐备后 `status --stage=build-prd` 显示 succeeded 且后续无代码阶段 outcome。

### Risks and rollback

风险是 outcome 形状校验与 task-close 漂移；回滚 portable 模块与 stage-runtime 分支，终态记录保留为历史事实。

## Phase P3 — activation cohort 冻结与状态事实落点

### Goal

任务创建时 cohort 冻结进 task.json manifest（pre/post），来源为 storage-root activation 标记存在性；缺省 pre 覆盖在途任务；晚声明/暂停/恢复/澄清不改 cohort；build-prd 七值状态事实按 P2 形状追加记录、历史不覆盖。

### Files

- **NEW**：`tests/contract/activation-cohort.test.mjs`（含以临时目录夹具构造的 activation 标记样本）。**运行时 activation 标记文件本身不是本卡的 Phase 生产文件**：其路径与形状在设计层冻结于 §activation 三事实契约，由 CARD-01 owner 在发布消费后写入；实现阶段只以测试夹具构造，不得写入真实 storage root。
- **MODIFY**：`tools/cli/task-bootstrap.mjs`（创建时读标记并 stamp manifest）
- **DO NOT TOUCH**：`runtime/task/task-handle.mjs`、`runtime/task/task-store.mjs`（manifest 透传/facts schema 零改动）

### Tasks

- T005 — RED：写 `activation-cohort.test.mjs`，固定：标记存在⇒post、缺失⇒pre、manifest 三字段（cohort/frozen_at/entry_release_commit）、无字段任务读回 pre、晚声明/暂停不改、终态七值记录与历史追加；当前失败。
- T006 — GREEN：task-bootstrap 在 createTask 前读 `<storageRoot>/activation/card-01.json`（非法 JSON 则创建 fail-loud），manifest stamp 三字段；task-topology 的 cohort 读回改读 manifest 字段（缺省 pre）；补齐状态事实断言通过。

### Verify

同一命令 `npx --no-install vitest run tests/contract/activation-cohort.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`；RED=非零，GREEN=0；`ORACLE-P3-COHORT-STATE`；证据 `quality/tests/P3-cohort-state.json`。

### Knowledge

cohort 字段名与取值冻结；在途政策=缺省 pre（本卡自身即 pre cohort 普通任务，按五阶段跑完含本 build-plan）。

### STOP

实现要求把 cohort 写进 facts.jsonl、为其新建 gate、或让类型声明时点参与 cohort 判定时，停止回 spec（D-009）。

### Done

AC-MIG-001 能力预演面、AC-STATE-001/002/003 记录面有证据；真实行为：新任务 manifest 带 cohort，bootstrap 不读标记非法值时不静默。

### Risks and rollback

风险是标记面被误当 gate；回滚 bootstrap stamp 与契约测试，manifest 多余字段无害保留。

## Phase P4 — 零机器门禁接线、接口蓝图公开与端到端验收

### Goal

24 项机器谓词退出推进路径（缺失/无效如实记录、不阻断、不漂白）；接口蓝图六类契约公开给后续卡；两条旅程（规划/post 普通/pre 普通）从真实入口夹具走通且失败语义正确；全部 23 AC 聚合验收。

### Files

- **NEW**：`tests/contract/zero-machine-gate-advancement.test.mjs`、`tests/integration/card-01-dual-journey.test.mjs`、`tests/acceptance/card-01-current.mjs`、`docs/contracts/card-01-stage-material-interface.md`
- **MODIFY**：`docs/architecture/move-map.json`；推进路径上 24 项谓词的调用位（`runtime/stage/stage-handlers.mjs`、`runtime/task/task-kernel-implementation.mjs`、`runtime/stage/stage-runner.mjs`、`runtime/evidence/canonical-receipt-writer.mjs` 内具体行，**五阶段名单常量一律不改**）
- **DO NOT TOUCH**：两道人为门调用位（confirm/authorize）；母/兄弟卡材料；`specs/archive/**`

### Tasks

- T007 — RED：写 `zero-machine-gate-advancement.test.mjs` 与 `card-01-dual-journey.test.mjs` 两组断言（缺 round_count/机器校验事实时推进不被阻断、缺项记录、旧失败不漂白、`outline_closed=missing` 保留；三旅程投影逐字、build-prd 失败重入不滑入、蓝图六类契约行存在、母/兄弟卡只读），对当前快照必然失败，采集原 stdout/stderr。
- T008 — GREEN：在 T007 的同一 gate 下驱动实现：把 24 项谓词调用位改为记录事实（名单常量不改）+ 产出 `docs/contracts/card-01-stage-material-interface.md` 并登记 move-map，使同一命令转 0。
- T009 — FINAL：`tests/acceptance/card-01-current.mjs` 一次运行全部 targeted 文件，23 AC 各恰好一次 assertions，含 FR-REVIEW-001 既有回归断言。

### Verify

T007/T008：`npx --no-install vitest run tests/contract/zero-machine-gate-advancement.test.mjs tests/integration/card-01-dual-journey.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`，非零→0，`ORACLE-P4-ZERO-GATE-JOURNEY`，`quality/tests/P4-zero-gate-journey.json`；T009：`node tests/acceptance/card-01-current.mjs` / 0，`ORACLE-FINAL-CARD01`，`quality/tests/final-card-01.json`。

### Knowledge

去门禁后推进路径谓词清单已按族级 5 族 + 18 站点冻结在 plan §机器阻断谓词 inventory；tasks 卡验收栏回填逐站点 consumer/转移/缺失行为，并记录 24-vs-18 口径；activation 正式关闭动作清单移交 CARD-01 owner（AC-MIG-001）。

### STOP

谓词删除（而非退出路径）、新第三类人为门、蓝图事实升级为 gate、integration 要求改动正式阶段名单或碰母材料时，停止回对应 owner。

### Done

AC-FLOW-001/002/003、AC-GATE-001/002/003/004、AC-IFACE-001/002/003、AC-REVIEW-001 及全 AC 聚合有证据；两条旅程真实执行记录与阶段轨迹可查；只宣称能力级预演，不宣称 activation。

### Risks and rollback

风险是去门禁误伤记录面或 ordinary 路径回归；回滚调用位改动，保留全部事实记录与负例测试，五阶段名单与物理授权面不受影响。

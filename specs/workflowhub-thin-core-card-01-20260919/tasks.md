# 任务清单：双任务拓扑与零机器推进门禁骨架（CARD-01）

- **Input**：`specs/workflowhub-thin-core-card-01-20260919/decision-log.md@cf6c62ac0774421733d7872357d0b27390f1fd072bdf15af4b02db2a979a039b`、`specs/workflowhub-thin-core-card-01-20260919/spec.md@9c0a5c0bf4c7687ed01d3d0ae44d5b235d6e2d31b1b1894383914a4567474dc6`、`specs/workflowhub-thin-core-card-01-20260919/plan.md@34e2de57b4f5c83a70c6d7f7819ce2d7b5245fd8882167f3d69cda1e8ca2b2ad`
- **Template version**：`plan-task.v4`
- **Status**：正式 build-plan 任务材料；9 张卡全部 pending，未执行测试、实现、Git 或物理动作。

## 材料导航

| 章节 / 材料锚点 | 职责与摘要 | M/S/B/P 读取时机 |
| --- | --- | --- |
| `decision-log.md#决定`（D-001..D-010）、`decision-log.md#调研`（RS-001..RS-005）、`decision-log.md#风险与延期交接` | 已确认方向、八处排除点盘点、24 项阻断谓词、两道人为门位置、非目标与延期 | M（主会话常驻）；S 执行各 Phase 前重读相关 D 段 |
| `spec.md#5-功能需求`（TYPE/TOPO/MIG/PRD/FLOW/GATE/STATE/IFACE/REVIEW 九节，23 条 FR）、`spec.md#8-数据和生命周期`、`spec.md#11-验收标准`（23 条 AC） | 产品行为、受控值、拓扑逐字串、状态七值、验收 oracle 与失败边界 | S（build-code/verify-code 逐条对照） |
| `spec.md#产品边界接口蓝图`、`spec.md#迁移期与生效边界`、`spec.md#canonical-gate-inventory` | 后续卡消费的接口契约、cohort×类型规则、谓词×转移冻结义务 | B（build-code 接线前） |
| `plan.md#Technical-Decisions`（DEC-001..005）、`plan.md#Test-Strategy`、`plan.md#File-Boundary` | 工程方案、文件边界、RED/GREEN、gate_cmd/oracle/evidence | M/S 全程 |
| `tasks.md#Phase-P1..P4`（本文件） | 可执行任务边界、命令、execution JSON 与完成记录 | P（并行执行按卡；T007 与蓝图草稿可并行） |

## Phase P1 — 任务类型声明读回与入口拓扑分流

### Goal

入口能从 decision-log 读回唯一受控任务类型，按 cohort 得到逐字静态拓扑投影；类型缺失/重复/冲突/非法返回无法识别、请求澄清并保留异常历史；所请求阶段不在投影内 fail-loud；类型无关命令不受类型状态影响。

### Files

- **NEW**：`runtime/task/task-topology.mjs`、`tests/contract/task-topology-projection.test.mjs`
- **MODIFY**：`tools/cli/stage-runtime.mjs`（run/status 前挂读回校验）
- **DO NOT TOUCH**：`runtime/stage/stage-content-contracts.mjs`（读回器零改动）；18+ 处正式阶段名单；`core/**`；`workflows/build-prd/**`

### Tasks

#### T001 — RED：任务类型读回与静态拓扑投影

- **ID**：T001
- **Phase**：Phase P1 — 任务类型声明读回与入口拓扑分流
- **goal**：用失败断言固定受控值恰 `{规划任务,普通任务}`、唯一读回、四类异常→unknown、投影逐字、build-prd 对普通任务非法、无动态拼接、status/doctor 不依赖类型。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-thin-core-card-01-20260919/spec.md","hash":"9c0a5c0bf4c7687ed01d3d0ae44d5b235d6e2d31b1b1894383914a4567474dc6","id":"SPEC-workflowhub-thin-core-card-01-20260919"},{"artifact_kind":"plan","ref":"specs/workflowhub-thin-core-card-01-20260919/plan.md","hash":"34e2de57b4f5c83a70c6d7f7819ce2d7b5245fd8882167f3d69cda1e8ca2b2ad","id":"PLAN-workflowhub-thin-core-card-01-20260919"}]`
- **source_refs / decision_refs**：D-003；R-003、R-010 → FR-TYPE-001, FR-TYPE-002, FR-TYPE-003, FR-TOPO-001, FR-TOPO-002；AC-TYPE-001, AC-TYPE-002, AC-TYPE-003, AC-TOPO-001, AC-TOPO-002
- **输入**：当前 decision-log/spec/plan 草案；既有纯函数 `readTaskTypeFromDecisionLog`（`runtime/stage/stage-content-contracts.mjs:2881-2918`）。
- **依赖**：none
- **并行**：否 — 首个 RED，先冻结类型读回与拓扑身份。
- **FR**：FR-TYPE-001, FR-TYPE-002, FR-TYPE-003, FR-TOPO-001, FR-TOPO-002
- **AC**：AC-TYPE-001, AC-TYPE-002, AC-TYPE-003, AC-TOPO-001, AC-TOPO-002
- **动作**：新增契约测试，固定合法规划/合法普通/缺失/重复/冲突/非法值六类材料 + **入口类型参数/默认值探针**（验证入口不接受、不消费类型参数与默认值）+ **两个体量显著不同但未声明类型的任务**均停留人工选择处（不被按体量/文本/文件名/历史/哈希自动分类），逐字投影 `规划任务→["make-decision","build-prd"]`、`普通任务+post→["make-decision","build-plan","build-code","verify-code"]`、`普通任务+pre→["make-decision","build-spec","build-plan","build-code","verify-code"]`，以及 cohort 缺省 `pre`；不改生产实现（模块不存在即为 RED）。
- **精确文件**：`tests/contract/task-topology-projection.test.mjs`
- **boundary**：files: `tests/contract/task-topology-projection.test.mjs`; symbols/regions: 类型读回/投影/阶段-拓扑校验断言与六类材料 fixture
- **输出**：目标行为缺失导致 exit 非零，失败定位到拓扑/读回断言而非 setup。
- **Knowledge**：读取器为纯函数、零改动；入口不得新增类型参数；投影是代码内冻结常量，不是配置或运行时派生。
- **verification_role**：RED
- **paired_task**：T002
- **gate_cmd**：`npx --no-install vitest run tests/contract/task-topology-projection.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：1
- **oracle**：`ORACLE-P1-TOPO {"oracle_id":"ORACLE-P1-TOPO","role":"RED","pass":"契约测试断言任务类型受控值恰 {规划任务,普通任务} 且读回唯一；两条投影逐字为 规划任务→[\"make-decision\",\"build-prd\"]、普通任务+pre→[\"make-decision\",\"build-spec\",\"build-plan\",\"build-code\",\"verify-code\"]、普通任务+post→[\"make-decision\",\"build-plan\",\"build-code\",\"verify-code\"]；阶段-拓扑校验对投影外阶段 fail-loud；build-prd 对普通任务判非法；投影为代码内冻结常量，入口不接受或消费类型参数/默认值，无动态拼接。","reject":{"input":"喂入四类非法 decision-log 材料：类型标签段缺失、固定标签出现两条、同段两个受控值冲突、标签值不在 {规划任务,普通任务} 内；另加入口类型参数/默认值探针与两个体量显著不同但未声明类型的任务。","expected_rejection":"readTaskTypeFromDecisionLog 对四类材料均返回 unknown 并触发类型澄清，类型相关操作（选择顶层拓扑、进入 build-prd/build-plan 及其类型专属内容）暂停且不启动任何后续 stage；类型无关准备继续；入口拒绝类型参数与默认值，两个未声明任务不被自动分流。","observation":"tests/contract/task-topology-projection.test.mjs 的失败断言与 quality/tests/P1-topology.json 中四类读回结果、异常历史与恢复轨迹。"}}`
- **semantic_review_status**：incomplete
- **semantic_review_ref**：`specs/workflowhub-thin-core-card-01-20260919/plan.md#Phase-P1--任务类型声明读回与入口拓扑分流`
- **semantic_review_reason**：结构与目标行为已规划；独立语义复核及真实 RED 尚未执行。
- **evidence_path**：`quality/tests/P1-topology.json`
- **STOP**：实现要求入口新增类型参数、扩 `WORKFLOW_STAGES`、把拓扑校验做成质量门、或允许第三值/多标签时，停止回 `spec.md`（FR-TYPE-001 范围边界）/`plan.md`（DEC-002）。
- **recovery**：build-code 删除本卡新增断言或修复 fixture；保留原失败输出与四材料。
- **task risk**：投影逐字串写错（PLAN-RISK-001），或静态字符串断言未覆盖真实读回语义。
- **test tier / test method**：feature / backend-testing；纯函数 + 静态映射契约，无 I/O。
- **scenarios / commands / expected exit / oracle**：合法规划声明、合法普通声明、标签缺失、标签重复、标签冲突、非法值六类；阶段-拓扑校验正负例；同 gate；RED=非零；`ORACLE-P1-TOPO`。
- **fixtures_services**：内存 Markdown fixture（六类 decision-log 任务身份段）；无网络/provider/browser；测试自清 temp。
- **coverage limits**：不证明真实入口接线（T002/T008 覆盖）；不证明 activation 生效。
- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：新增 `tests/contract/task-topology-projection.test.mjs` 的 RED contract：受控值、异常读回、静态投影、入口参数拒绝、正式/portable 边界。
- **executed_commands**：`npx --no-install vitest run tests/contract/task-topology-projection.test.mjs --poolOptions.forks.singleFork --no-fileParallelism` → exit `1`（`runtime/task/task-topology.mjs` 不存在，目标行为缺失）。
- **evidence_refs**：`quality/evidence/build-code/P1/phase-card.md`；后续 GREEN receipt=`quality/tests/P1-topology.json`。
- **covered_ac**：AC-TYPE-001、AC-TYPE-002、AC-TYPE-003、AC-TOPO-001、AC-TOPO-002（RED failure fixed by T002）。
- **review_fact**：与 T002 共用 `quality/reviews/results/build-code-simple-a7dd02b1-95fd-5398-a28d-540324bfc6d1.json`。
- **completed_at**：2026-09-20T11:23:59Z
- **执行事实**：首个命令因测试文件曾误落到 main checkout 而报 no test files；已删除该 agent 创建的 stray file，精确写入认证 worktree 后得到真实模块缺失 RED。该 checkout 失误不作为产品 RED 证据。

#### T002 — GREEN：实现 task-topology 并挂载入口读回校验

- **ID**：T002
- **Phase**：Phase P1 — 任务类型声明读回与入口拓扑分流
- **goal**：让 T001 的目标断言通过并保留全部负例；入口在**类型相关阶段执行**前完成读回校验与 fail-loud，且 make-decision/status/doctor 不被 unknown 阻断。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-thin-core-card-01-20260919/spec.md","hash":"9c0a5c0bf4c7687ed01d3d0ae44d5b235d6e2d31b1b1894383914a4567474dc6","id":"SPEC-workflowhub-thin-core-card-01-20260919"},{"artifact_kind":"plan","ref":"specs/workflowhub-thin-core-card-01-20260919/plan.md","hash":"34e2de57b4f5c83a70c6d7f7819ce2d7b5245fd8882167f3d69cda1e8ca2b2ad","id":"PLAN-workflowhub-thin-core-card-01-20260919"}]`
- **source_refs / decision_refs**：D-003；R-003、R-010 → FR-TYPE-001, FR-TYPE-002, FR-TYPE-003, FR-TOPO-001, FR-TOPO-002；AC-TYPE-001, AC-TYPE-002, AC-TYPE-003, AC-TOPO-001, AC-TOPO-002
- **输入**：T001 的目标失败与 `stage-runtime.mjs:1000-1110` 上下文构建/加载顺序锚点。
- **依赖**：T001
- **并行**：否 — RED/GREEN 必须串行。
- **FR**：FR-TYPE-001, FR-TYPE-002, FR-TYPE-003, FR-TOPO-001, FR-TOPO-002
- **AC**：AC-TYPE-001, AC-TYPE-002, AC-TYPE-003, AC-TOPO-001, AC-TOPO-002
- **动作**：新增 `task-topology.mjs`（读回包装、cohort 读回缺省 pre、`resolveTopology`、`validateStageForTopology`、`recordTypeAttempt` 内容寻址写入 `quality/evidence/task-type-attempts/<sha256>.json`）；`stage-runtime.mjs` 只在**类型相关阶段执行**（目标阶段属于 build-prd / build-plan / build-code / verify-code 之一）前调用：unknown⇒该阶段非零并输出「任务类型无法识别，请在 make-decision 任务身份段声明恰一条受控值标签」且追加异常记录；阶段不在投影⇒非零+期望拓扑；通过⇒走原 `runOfficialStage` 路径。**make-decision 必须始终可执行**（类型声明宿主），`status`/`doctor` 与其它类型无关准备动作不被 unknown 阻断（只记录事实）。不扩 `WORKFLOW_STAGES`、不新增命令、不改读回器。
- **精确文件**：`runtime/task/task-topology.mjs`, `tools/cli/stage-runtime.mjs`, `tests/contract/task-topology-projection.test.mjs`
- **boundary**：files: `runtime/task/task-topology.mjs`, `tools/cli/stage-runtime.mjs`, `tests/contract/task-topology-projection.test.mjs`; symbols/regions: stage-runtime run/status 前置读回校验缝 + 新模块纯函数面
- **输出**：同命令 exit 0；规划任务可合法请求 `--stage=build-prd`（执行链未接前止于路由验证），普通任务请求 build-prd 被拒。
- **Knowledge**：T001 产出的真实失败事实；`run` 分发缝在 L1067/L1108 调 `runOfficialStage`；校验挂载点必须在上下文构建之前。
- **verification_role**：GREEN
- **paired_task**：T001
- **gate_cmd**：`npx --no-install vitest run tests/contract/task-topology-projection.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：0
- **oracle**：`ORACLE-P1-TOPO {"oracle_id":"ORACLE-P1-TOPO","role":"GREEN","pass":"契约测试断言任务类型受控值恰 {规划任务,普通任务} 且读回唯一；两条投影逐字为 规划任务→[\"make-decision\",\"build-prd\"]、普通任务+pre→[\"make-decision\",\"build-spec\",\"build-plan\",\"build-code\",\"verify-code\"]、普通任务+post→[\"make-decision\",\"build-plan\",\"build-code\",\"verify-code\"]；阶段-拓扑校验对投影外阶段 fail-loud；build-prd 对普通任务判非法；投影为代码内冻结常量，入口不接受或消费类型参数/默认值，无动态拼接。","notes":"与 T001 共享同一 oracle identity 与 gate，含负例保留。"}`
- **semantic_review_status**：incomplete
- **semantic_review_ref**：`specs/workflowhub-thin-core-card-01-20260919/plan.md#Phase-P1--任务类型声明读回与入口拓扑分流`
- **semantic_review_reason**：等待 build-code Phase 独立 review；本草案未执行。
- **evidence_path**：`quality/tests/P1-topology.json`
- **STOP**：需要弱化测试、扩正式阶段名单、把校验做成质量门、新增 public command 或改动 `runtime/stage/stage-content-contracts.mjs` 时停止回 `plan.md`/`spec.md`。
- **recovery**：回滚 `stage-runtime` 挂载点与新模块，入口恢复现状；保留原失败输出与四材料。
- **task risk**：路由误拒/误放，或把拓扑校验做成新的推进门禁（撞 F5/F11 与 FR-GATE-004）。
- **test tier / test method**：feature / backend-testing；纯函数 + 窄 CLI 接线。
- **scenarios / commands / expected exit / oracle**：与 T001 完全相同的六类材料与投影断言；同 gate、同 oracle identity；另含澄清后重新读回恢复轨迹；RED=非零 / GREEN=0。
- **fixtures_services**：与 T001 相同内存 Markdown fixture；type-attempts 写入面用临时 task 追踪目录；测试自清 temp。
- **coverage limits**：不证明 build-prd 执行链（P2 覆盖）；不证明 cohort 真值来源（P3 覆盖）。
- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：新增 `runtime/task/task-topology.mjs`；`tools/cli/stage-runtime.mjs` 在类型依赖 `run` 建上下文前认证 task/worktree、读回类型并校验静态拓扑；新增/扩展 P1 contract tests。未改五阶段名单或 `readTaskTypeFromDecisionLog`。
- **executed_commands**：同 P1 gate 先后 GREEN；公共 `verify --action=execute` 最终捕获 `quality/tests/P1-topology-final.json` exit `0`（15 assertions）。普通任务 `run --stage=build-prd` exit `1` 并列出其 expected topology。
- **evidence_refs**：`quality/evidence/build-code/P1/phase-card.md`；初始 GREEN=`quality/tests/P1-topology.json` sha256 `6c90d575f981b49640ccdab7401c7516521580777de95a57e0d88cd605efff23`；review repair=`quality/tests/P1-topology-review-fixes.json` sha256 `6d4b9230ee0f5aef6f48fab531248d5739e121ca5a798700408845ac9411640f`；final=`quality/tests/P1-topology-final.json` sha256 `2cccdb345f532b9d61ec99b82e59a34118d947b7be35ede697f24aa4d768e1c7`。
- **covered_ac**：AC-TYPE-001、AC-TYPE-002、AC-TYPE-003、AC-TOPO-001、AC-TOPO-002。
- **review_fact**：`quality/reviews/results/build-code-simple-a7dd02b1-95fd-5398-a28d-540324bfc6d1.json`（semantic available；codex/luna 无 finding；kimi/coding 两条 minor 均 fixed：`F-55bf3e4831b8`、`F-e6a37ef7f2d5`）。
- **completed_at**：2026-09-20T11:23:59Z
- **执行事实**：P1 phase review 在修复前 snapshot 真实完成；按 review contract 不因 finding 修复重派同一 phase review。修复为 heading matcher 和 table/bullet 同一值规范化；scope audit 再补真实 unknown route 的内容寻址 attempt 发布断言；final focused test 已在新 snapshot 重跑，未发现 scope/diff violation。

### Verify

- **Target**：FR-TYPE-001/002/003、FR-TOPO-001/002；AC-TYPE-001/002/003、AC-TOPO-001/002。
- **gate_cmd**：`npx --no-install vitest run tests/contract/task-topology-projection.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：RED=1，GREEN=0
- **evidence_path**：`quality/tests/P1-topology.json`
- **Oracle**：`ORACLE-P1-TOPO` — 类型受控值/唯一读回/非法四类→unknown、投影逐字、阶段-拓扑校验、build-prd 对普通任务非法、无动态拼接。

### Knowledge

投影逐字串冻结给 P2/P4：规划=`make-decision→build-prd`；普通 post=`make-decision→build-plan→build-code→verify-code`；普通 pre=含 build-spec 五阶段。澄清语义：只暂停类型相关分支，`status/doctor` 等类型无关命令不受影响。

### STOP

实现要求入口新增类型参数、扩 `WORKFLOW_STAGES`、把拓扑校验做成质量门、允许第三值/多标签或改动读回器时，停止回 `spec.md`/`plan.md`。

### Done

AC-TYPE-001/002/003、AC-TOPO-001/002 的投影/读回/校验面有正负证据；真实行为变化：规划任务可合法请求 `--stage=build-prd`，普通任务请求 build-prd 被拒。未执行则只可报 pending。

### Risks and rollback

- **Risk**：投影逐字串与 D-001/D-009 不一致（PLAN-RISK-001）；路由误拒/误放。
- **Prevention**：`ORACLE-P1-TOPO` 固定逐字断言与负例；P4 双旅程逐字复核。
- **Rollback / recovery**：回滚 `stage-runtime` 挂载点与 `task-topology.mjs`，入口恢复现状，无其他面受影响。

## Phase P2 — build-prd portable 执行链与终止语义

### Goal

规划任务经 `run --stage=build-prd` 进入 portable 执行链：六步 outcome 记录齐备且形状合法⇒写 succeeded 终态；任一步缺失/非法⇒写 failed 终态（真实原因+失败步），修复后重跑重入该步；全程不触发正式 completion 认证、不启动代码阶段。

### Files

- **NEW**：`runtime/task/portable-workflow-run.mjs`、`tests/contract/portable-workflow-run.test.mjs`
- **MODIFY**：`tools/cli/stage-runtime.mjs`（run 增加 portable 分支；status 增加 build-prd 七值投影）
- **DO NOT TOUCH**：`workflows/build-prd/**`（六步内容）；`runtime/stage/step-manifest.mjs`（portable 链直读 steps.json）；`core/task-close.mjs`（只读复用形状）

### Tasks

#### T003 — RED：六步执行链与 succeeded/failed 终止语义

- **ID**：T003
- **Phase**：Phase P2 — build-prd portable 执行链与终止语义
- **goal**：用失败断言固定六步加载与自带最小形状校验（含「未导入 `validateStepManifest`」对照断言）、六 outcome 齐备⇒succeeded、缺步/形状非法⇒failed+真实原因、重入写新终态且历史保留、不触代码阶段。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-thin-core-card-01-20260919/spec.md","hash":"9c0a5c0bf4c7687ed01d3d0ae44d5b235d6e2d31b1b1894383914a4567474dc6","id":"SPEC-workflowhub-thin-core-card-01-20260919"},{"artifact_kind":"plan","ref":"specs/workflowhub-thin-core-card-01-20260919/plan.md","hash":"34e2de57b4f5c83a70c6d7f7819ce2d7b5245fd8882167f3d69cda1e8ca2b2ad","id":"PLAN-workflowhub-thin-core-card-01-20260919"}]`
- **source_refs / decision_refs**：D-006、D-008；PFACT-003、PFACT-004 → FR-PRD-001, FR-PRD-002, FR-PRD-003；AC-PRD-001, AC-PRD-002, AC-PRD-003
- **输入**：T002 投影面；`workflows/build-prd/steps.json`（六步，只读）；`core/task-close.mjs:60-80,2070-2095` outcome 声明形状。
- **依赖**：T002
- **并行**：否 — 消费已冻结的拓扑投影与阶段合法性。
- **FR**：FR-PRD-001, FR-PRD-002, FR-PRD-003
- **AC**：AC-PRD-001, AC-PRD-002, AC-PRD-003
- **动作**：新增契约测试，固定六步加载与自带最小形状校验（含「未导入 `validateStepManifest`」对照断言）、**六步由当前会话按 `workflows/build-prd/SKILL.md`+`steps.json` 实际执行、runner 只逐步推进与校验**（不冒充执行、不自行撰写内容）、六 outcome 齐备⇒`succeeded`、缺第三步⇒`failed` 且 `failed_step=confirm-map-and-conditional-design`、形状非法⇒`failed`、**七值投影逐值**（`not-started`/`in-progress`/`succeeded`/`failed`/`unverified`（缺验证不得记 succeeded）/`blocked`（仅非机器外部依赖且记依赖方与解除条件）/`abandoned`；机器或质量事实缺失不得包装为 blocked）、重入后写新终态且历史保留、终态记录形状、终态后无 build-plan/build-code/verify-code outcome；当前失败（模块不存在）。
- **精确文件**：`tests/contract/portable-workflow-run.test.mjs`
- **boundary**：files: `tests/contract/portable-workflow-run.test.mjs`; symbols/regions: 六步加载/outcome 核对/终态记录/重入断言与 fixture
- **输出**：目标行为缺失导致 exit 非零，失败定位到六步链断言而非 setup。
- **Knowledge**：portable outcome 命名空间 `quality/evidence/portable-workflow-outcomes/build-prd/<sha256>.json` 已由 `check-skill-closure.mjs`/`core/task-close.mjs` 校验形状；portable 链不经 `loadStageManifest`。
- **verification_role**：RED
- **paired_task**：T004
- **gate_cmd**：`npx --no-install vitest run tests/contract/portable-workflow-run.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：1
- **oracle**：`ORACLE-P2-PORTABLE {"oracle_id":"ORACLE-P2-PORTABLE","role":"RED","pass":"契约测试断言 portable 链从只读 workflows/build-prd/steps.json 加载恰六步并做自带最小形状校验（含未导入 validateStepManifest 对照断言）；六步 outcome 齐备⇒succeeded、缺第三步⇒failed 且 failed_step=confirm-map-and-conditional-design、形状非法⇒failed 并保留真实原因；重入写新终态且历史追加不覆盖；终态记录形状与 core/task-close.mjs 声明一致；终态后无 build-plan/build-code/verify-code outcome。","reject":{"input":"喂入缺第三步的 outcome 集合、字段形状非法的 outcome（缺 task_id/step_results 等声明字段）、非法 steps.json 形状，以及失败后重入同一失败步的第二次执行。","expected_rejection":"缺步与形状非法均记为 failed 并保留真实失败原因（缺第三步时 failed_step=confirm-map-and-conditional-design），不写 succeeded；重入后写新终态且历史追加不覆盖；全程不产生任何代码阶段 outcome。","observation":"tests/contract/portable-workflow-run.test.mjs 的 failed 断言与 quality/tests/P2-portable.json 中的终态记录、原因字段与重入历史。"}}`
- **semantic_review_status**：incomplete
- **semantic_review_ref**：`specs/workflowhub-thin-core-card-01-20260919/plan.md#Phase-P2--build-prd-portable-执行链与终止语义`
- **semantic_review_reason**：行为 oracle 待独立复核，真实 RED 未执行。
- **evidence_path**：`quality/tests/P2-portable.json`
- **STOP**：需要改六步内容、把 build-prd 写进正式 manifest/名单、新建 dispatcher 或触碰代码阶段时，停止回 `plan.md`（DEC-001/DEC-005）/`spec.md`。
- **recovery**：删除本卡新增断言与 fixture；保留原失败输出与四材料。
- **task risk**：outcome 形状校验与 `core/task-close.mjs` 漂移；终态记录被误当第六阶段状态权威。
- **test tier / test method**：feature / backend-testing；文件 fixture + 纯执行链契约，无 browser。
- **scenarios / commands / expected exit / oracle**：六 outcome 齐备、缺步、形状非法、修复后重入、历史追加不覆盖、终态后无代码阶段 outcome；同 gate；RED=非零；`ORACLE-P2-PORTABLE`。
- **fixtures_services**：临时 task 追踪目录 + 受控 outcome JSON fixture；无网络/provider/browser；测试自清 temp。
- **coverage limits**：不证明真实 PRD 内容质量；不证明 status 七值投影（T004/T006 覆盖）。
- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：新增 `tests/contract/portable-workflow-run.test.mjs`，固定 portable manifest 六步、缺第三步、非法 outcome、七值、重入和无代码阶段 outcome 的 RED contract。
- **executed_commands**：`npx --no-install vitest run tests/contract/portable-workflow-run.test.mjs --poolOptions.forks.singleFork --no-fileParallelism` → exit `1`（portable module 缺失）。
- **evidence_refs**：`quality/evidence/build-code/P2/phase-card.md`；paired final GREEN=`quality/tests/P2-portable-final.json`。
- **covered_ac**：AC-PRD-001、AC-PRD-002、AC-PRD-003（RED failure fixed by T004）。
- **review_fact**：与 T004 共用 `quality/reviews/results/build-code-simple-8448287b-9c23-5d5f-a681-1ede7e42bb5f.json`。
- **completed_at**：2026-09-20T12:01:32Z
- **执行事实**：RED 失败定位为目标 runner 缺失，不是 fixture/setup；未读取或修改 build-prd 六步内容。

#### T004 — GREEN：实现 portable-workflow-run 并接 run/status 分支

- **ID**：T004
- **Phase**：Phase P2 — build-prd portable 执行链与终止语义
- **goal**：让 T003 全部正负场景通过并保留负例；规划任务六步事实齐备后 `status --stage=build-prd` 显示 succeeded 且后续无代码阶段 outcome。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-thin-core-card-01-20260919/spec.md","hash":"9c0a5c0bf4c7687ed01d3d0ae44d5b235d6e2d31b1b1894383914a4567474dc6","id":"SPEC-workflowhub-thin-core-card-01-20260919"},{"artifact_kind":"plan","ref":"specs/workflowhub-thin-core-card-01-20260919/plan.md","hash":"34e2de57b4f5c83a70c6d7f7819ce2d7b5245fd8882167f3d69cda1e8ca2b2ad","id":"PLAN-workflowhub-thin-core-card-01-20260919"}]`
- **source_refs / decision_refs**：D-006、D-008；PFACT-003、PFACT-004 → FR-PRD-001, FR-PRD-002, FR-PRD-003；AC-PRD-001, AC-PRD-002, AC-PRD-003
- **输入**：T003 目标失败；`core/task-close.mjs:60-80,2070-2095` 精确字段形状。
- **依赖**：T003
- **并行**：否 — RED/GREEN 串行且共享测试文件。
- **FR**：FR-PRD-001, FR-PRD-002, FR-PRD-003
- **AC**：AC-PRD-001, AC-PRD-002, AC-PRD-003
- **动作**：实现 `portable-workflow-run.mjs`（直读 `workflows/build-prd/steps.json` + 自带最小形状校验、**不导入 `validateStepManifest`**（其对 portable manifest 恒 `ok:false`）、**驱动六步序列：逐步推进→由当前会话执行该步→校验该步 outcome→写步骤事实**、**七值投影规则**（对齐 plan §七值状态冻结）：创建未执行⇒`not-started`；已推进至少一步且无终态⇒`in-progress`；六步齐备⇒`succeeded`；某步真实失败⇒`failed`（记 `failed_step`+原因，可重入该步）；缺验证⇒`unverified`（不得记 succeeded）；仅等待可识别的非机器外部依赖⇒`blocked`（须记依赖方与解除条件）；用户终止⇒`abandoned`；机器/质量事实缺失不得包装为 `blocked`，材料字节不可读只让依赖该内容的步 `failed` 并可重试、写终态记录 `{record_kind:"portable_workflow_terminal", task_id, workflow:"build-prd", state, reason, failed_step, step_result_refs, started_at, completed_at}` 到 `.../build-prd/terminal/`、读最新终态）；`stage-runtime.mjs` 在校验通过后对 build-prd 调该链，status 读最新终态投影七值（逐值含 `unverified`：缺验证记 `unverified` 而非 succeeded，且只在该阶段自身声明的验证行为尚未执行时使用）；不调用 `runOfficialStage`、不触发五阶段 completion 认证、不启动后续阶段。
- **精确文件**：`runtime/task/portable-workflow-run.mjs`, `tools/cli/stage-runtime.mjs`, `tests/contract/portable-workflow-run.test.mjs`
- **boundary**：files: `runtime/task/portable-workflow-run.mjs`, `tools/cli/stage-runtime.mjs`, `tests/contract/portable-workflow-run.test.mjs`; symbols/regions: portable 分支调度、终态记录读写、status 七值投影
- **输出**：同命令 exit 0；六步齐备⇒succeeded 终态记录，失败⇒failed+真实原因+失败步，重入写新记录且历史保留。
- **Knowledge**：T003 产出的真实失败事实；终态记录与六步 outcome 同命名空间、追加式（内容寻址，`<sha256>.json`）。
- **verification_role**：GREEN
- **paired_task**：T003
- **gate_cmd**：`npx --no-install vitest run tests/contract/portable-workflow-run.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：0
- **oracle**：`ORACLE-P2-PORTABLE {"oracle_id":"ORACLE-P2-PORTABLE","role":"GREEN","pass":"契约测试断言 portable 链从只读 workflows/build-prd/steps.json 加载恰六步并做自带最小形状校验（含未导入 validateStepManifest 对照断言）；六步 outcome 齐备⇒succeeded、缺第三步⇒failed 且 failed_step=confirm-map-and-conditional-design、形状非法⇒failed 并保留真实原因；重入写新终态且历史追加不覆盖；终态记录形状与 core/task-close.mjs 声明一致；终态后无 build-plan/build-code/verify-code outcome。","notes":"与 T003 共享同一 oracle identity 与 gate，保留缺步/形状非法负例。"}`
- **semantic_review_status**：incomplete
- **semantic_review_ref**：`specs/workflowhub-thin-core-card-01-20260919/plan.md#Phase-P2--build-prd-portable-执行链与终止语义`
- **semantic_review_reason**：等待 build-code Phase 独立 review；本草案未执行。
- **evidence_path**：`quality/tests/P2-portable.json`
- **STOP**：需要弱化测试、扩大边界、把 build-prd 升为第六正式阶段或新建第二状态机/dispatcher 时停止回 `plan.md`。
- **recovery**：回滚 portable 模块与 `stage-runtime` 分支，终态记录保留为历史事实。
- **task risk**：outcome 形状校验与 task-close 漂移（PLAN-RISK-002：build-prd 被误升正式阶段或滑入代码阶段）。
- **test tier / test method**：feature / backend-testing。
- **scenarios / commands / expected exit / oracle**：与 T003 完全相同；同 gate、同 oracle identity，保留负例。
- **fixtures_services**：与 T003 相同。
- **coverage limits**：不执行真实 LLM/provider 六步对话；不证明 PRD 质量。
- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：新增 `runtime/task/portable-workflow-run.mjs`；`stage-runtime` 将合法 planning `build-prd` run 接到 portable runner，并为 build-prd 提供读状态/doctor 分支；未扩 `WORKFLOW_STAGES` 或调用 `runOfficialStage`。
- **executed_commands**：P2 gate final GREEN；公共 `verify --action=execute` 捕获 `quality/tests/P2-portable-final.json` exit `0`，命令仅含 P1/P2 两个 targeted suites，20 assertions。
- **evidence_refs**：`quality/evidence/build-code/P2/phase-card.md`；`quality/tests/P2-portable.json` sha256 `dfc60d917187f34c98338904cfc3f56dc8638423930fc9f8daeffa80ff561852`；final=`quality/tests/P2-portable-final.json` sha256 `3c33ead6292bb41e37d2374640f6c22dee4c589ac6589191dfe3dbfb57998abd`。
- **covered_ac**：AC-PRD-001、AC-PRD-002、AC-PRD-003。
- **review_fact**：`quality/reviews/results/build-code-simple-8448287b-9c23-5d5f-a681-1ede7e42bb5f.json`（semantic available；`F-332935a76249`、`F-7f53c38eeb4b`、`F-0ec1a2445a44`、`F-3e3c4ea1624b` 均 fixed）。
- **completed_at**：2026-09-20T12:01:32Z
- **执行事实**：已知 malformed step 保留其 `failed_step`；相同 clock 的重入用单调 `completed_at` 生成不同 content-addressed terminal ref；P2 review 在修复前完成，按既有 review contract 不重派，受影响 P1+P2 targeted suites 已在新 snapshot 重跑。

### Verify

- **Target**：FR-PRD-001/002/003；AC-PRD-001/002/003。
- **gate_cmd**：`npx --no-install vitest run tests/contract/portable-workflow-run.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：RED=1，GREEN=0
- **evidence_path**：`quality/tests/P2-portable.json`
- **Oracle**：`ORACLE-P2-PORTABLE` — 六步加载/自校验、六 outcome 齐备⇒succeeded、缺步/形状非法⇒failed+原因、重入语义、终态记录形状、不触代码阶段。

### Knowledge

终态记录形状冻结给 P3/P4：`{record_kind:"portable_workflow_terminal", task_id, workflow:"build-prd", state, reason, failed_step, step_result_refs, started_at, completed_at}`；命名空间=`quality/evidence/portable-workflow-outcomes/build-prd/`。无终态记录⇒status 显示 not-started/in-progress 语义，不伪造。

### STOP

实现要求改六步内容、把 build-prd 写进正式 manifest/名单、触代码阶段、新建 dispatcher 或第二状态机时，停止回 `plan.md`/`spec.md`。

### Done

AC-PRD-001/002/003 有正负证据；真实行为：规划任务六步事实齐备后 `status --stage=build-prd` 显示 succeeded 且后续无代码阶段 outcome。未执行则只可报 pending。

### Risks and rollback

- **Risk**：build-prd 被误升正式阶段或滑入代码阶段（PLAN-RISK-002）；outcome 形状校验漂移。
- **Prevention**：`ORACLE-P2-PORTABLE` 负例（终态后无 build-plan/build-code/verify-code outcome）；出现即 STOP。
- **Rollback / recovery**：回滚 portable 模块与 `stage-runtime` 分支，终态记录保留为历史事实。

## Phase P3 — activation cohort 冻结与状态事实落点

### Goal

任务创建时 cohort 冻结进 task.json manifest（pre/post），来源为 storage-root activation 标记存在性；缺省 pre 覆盖在途任务；晚声明/暂停/恢复/澄清不改 cohort；build-prd 七值状态事实按 P2 形状追加记录、历史不覆盖。

### Files

- **NEW**：`tests/contract/activation-cohort.test.mjs`（含以临时目录夹具构造的 activation 标记样本）。**运行时 activation 标记文件本身不是本卡的 Phase 生产文件**：其路径与形状在设计层冻结于 §activation 三事实契约，由 CARD-01 owner 在发布消费后写入；实现阶段只以测试夹具构造，不得写入真实 storage root。
- **MODIFY**：`tools/cli/task-bootstrap.mjs`（创建时读标记并 stamp manifest）
- **DO NOT TOUCH**：`runtime/task/task-handle.mjs`、`runtime/task/task-store.mjs`（manifest 透传/facts schema 零改动）

### Tasks

#### T005 — RED：cohort 冻结与终态七值记录

- **ID**：T005
- **Phase**：Phase P3 — activation cohort 冻结与状态事实落点
- **goal**：用失败断言固定「三事实齐备⇒post、空/部分标记⇒pre、JSON 非法⇒fail-loud、manifest 三字段、无字段任务读回 pre、晚声明/暂停不改、七值逐值记录与历史追加」。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-thin-core-card-01-20260919/spec.md","hash":"9c0a5c0bf4c7687ed01d3d0ae44d5b235d6e2d31b1b1894383914a4567474dc6","id":"SPEC-workflowhub-thin-core-card-01-20260919"},{"artifact_kind":"plan","ref":"specs/workflowhub-thin-core-card-01-20260919/plan.md","hash":"34e2de57b4f5c83a70c6d7f7819ce2d7b5245fd8882167f3d69cda1e8ca2b2ad","id":"PLAN-workflowhub-thin-core-card-01-20260919"}]`
- **source_refs / decision_refs**：D-003、D-009；R-002、R-009、R-010、R-014 → FR-MIG-001, FR-STATE-001, FR-STATE-002, FR-STATE-003；AC-MIG-001, AC-STATE-001, AC-STATE-002, AC-STATE-003
- **输入**：T002 cohort 读回面；T003/T004 终态记录形状；`tools/cli/task-bootstrap.mjs:86-117` 创建流程；plan §activation 三事实契约。
- **依赖**：T004
- **并行**：否 — 消费已冻结的投影与终态记录面。
- **FR**：FR-MIG-001, FR-STATE-001, FR-STATE-002, FR-STATE-003
- **AC**：AC-MIG-001, AC-STATE-001, AC-STATE-002, AC-STATE-003
- **动作**：新增契约测试，固定三事实（能力验收/发布标识/入口消费证据）齐备⇒post、**空标记/部分标记/JSON 非法或缺字段一律⇒pre**（fail-safe，且非法事实被记入 task 记录、不阻断创建；AC-MIG-001 失败判据「缺入口消费证据即启用」负例）、无 cohort 字段的在途任务读回 pre、晚声明/暂停/恢复/澄清不改写 cohort、五类样本顶层拓扑（pre 跨 activation 恢复/pre 晚声明普通/pre 晚声明规划/post 普通/post 规划）、七值逐值（含 `unverified`）与历史追加不覆盖；当前失败。
- **精确文件**：`tests/contract/activation-cohort.test.mjs`
- **boundary**：files: `tests/contract/activation-cohort.test.mjs`; symbols/regions: bootstrap stamp、cohort 读回、七值终态记录与追加断言
- **输出**：目标行为缺失导致 exit 非零，失败定位到 cohort/状态记录断言而非 setup。
- **Knowledge**：`facts.jsonl` 10 键固定 schema 且 `stage∈五阶段`，**不能**承载 cohort 或新状态行；`validateManifest` 不关闭额外顶层字段，manifest 可透传 cohort 字段。
- **verification_role**：RED
- **paired_task**：T006
- **gate_cmd**：`npx --no-install vitest run tests/contract/activation-cohort.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：1
- **oracle**：`ORACLE-P3-COHORT-STATE {"oracle_id":"ORACLE-P3-COHORT-STATE","role":"RED","pass":"契约测试断言 bootstrap stamp 把三事实写入 manifest；标记缺失/空标记/部分标记/JSON 非法/在途任务无 cohort 字段一律⇒pre，非法事实记入 task 记录且不阻断创建；晚声明、暂停、恢复、类型澄清均不改写 cohort；五类样本顶层拓扑逐字正确；终态按七值逐个记录（含 unverified 不得记 succeeded）；历史追加不覆盖。","reject":{"input":"喂入空 activation 标记、部分标记、JSON 非法的标记、缺 cohort 字段的在途任务，以及 activation 后晚声明类型、暂停后恢复的同类任务样本。","expected_rejection":"空标记/部分标记/JSON 非法/缺字段一律 fail-safe 判为 pre（不启用 post 路径）并把非法事实记入 task 记录、不阻断任务创建；晚声明与暂停恢复不改写已冻结 cohort；机器或质量事实缺失不得包装为 blocked。","observation":"tests/contract/activation-cohort.test.mjs 的 pre 判定断言与 quality/tests/P3-cohort-state.json 中 cohort stamp、非法标记事实与七值状态记录。"}}`
- **semantic_review_status**：incomplete
- **semantic_review_ref**：`specs/workflowhub-thin-core-card-01-20260919/plan.md#Phase-P3--activation-cohort-冻结与状态事实落点`
- **semantic_review_reason**：独立语义复核与真实 RED 尚未执行。
- **evidence_path**：`quality/tests/P3-cohort-state.json`
- **STOP**：实现要求把 cohort 写进 `facts.jsonl`、为其新建 gate，或让类型声明时点参与 cohort 判定时，停止回 `spec.md`（D-009）/`plan.md`（DEC-003）。
- **recovery**：删除本卡新增断言；保留原失败输出与四材料。
- **task risk**：cohort 被类型声明时点/暂停恢复错误改写（PLAN-RISK-004）；activation 标记被误当推进门禁。
- **test tier / test method**：feature / backend-testing；manifest/CLI + 记录 fixture。
- **scenarios / commands / expected exit / oracle**：标记存在/缺失、非法 JSON、在途无字段任务、晚声明、暂停恢复、七值终态逐个、历史追加；同 gate；RED=非零；`ORACLE-P3-COHORT-STATE`。
- **fixtures_services**：临时 storageRoot + task 追踪目录 + activation 标记 fixture；无网络/provider/browser；测试自清 temp。
- **coverage limits**：不实现 activation 标记写入命令（归 CARD-01 owner）；不证明新拓扑已正式发布（PLAN-RISK-005）。
- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：新增 `tests/contract/activation-cohort.test.mjs`，固定完整/空/部分/非法 activation marker 的 cohort 判定与 in-flight pre 默认值。
- **executed_commands**：P3 gate RED 为 helper 缺失；GREEN 由 T006 完成，见 final receipt。
- **evidence_refs**：`quality/evidence/build-code/P3/phase-card.md`；`quality/tests/P3-cohort-state-final.json`。
- **covered_ac**：AC-MIG-001、AC-STATE-001、AC-STATE-002、AC-STATE-003。
- **review_fact**：与 T006 共用 `quality/reviews/results/build-code-simple-7abe75ca-9f7e-5e4d-a49d-66b58bb8a64e.json`。
- **completed_at**：2026-09-20T12:29:22Z
- **执行事实**：RED 只因 activation helper 未实现；真实 marker 仅在临时 fixture 构造，未写入任何生产 storage root。

#### T006 — GREEN：task-bootstrap stamp cohort 并补齐状态事实

- **ID**：T006
- **Phase**：Phase P3 — activation cohort 冻结与状态事实落点
- **goal**：让 T005 全部正负场景通过并保留负例；创建时冻结 cohort，此后永不改写。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-thin-core-card-01-20260919/spec.md","hash":"9c0a5c0bf4c7687ed01d3d0ae44d5b235d6e2d31b1b1894383914a4567474dc6","id":"SPEC-workflowhub-thin-core-card-01-20260919"},{"artifact_kind":"plan","ref":"specs/workflowhub-thin-core-card-01-20260919/plan.md","hash":"34e2de57b4f5c83a70c6d7f7819ce2d7b5245fd8882167f3d69cda1e8ca2b2ad","id":"PLAN-workflowhub-thin-core-card-01-20260919"}]`
- **source_refs / decision_refs**：D-003、D-009；R-002、R-009、R-010、R-014 → FR-MIG-001, FR-STATE-001, FR-STATE-002, FR-STATE-003；AC-MIG-001, AC-STATE-001, AC-STATE-002, AC-STATE-003
- **输入**：T005 目标失败；`runtime/task/task-handle.mjs:884-901` manifest 透传确认。
- **依赖**：T005
- **并行**：否 — RED/GREEN 串行。
- **FR**：FR-MIG-001, FR-STATE-001, FR-STATE-002, FR-STATE-003
- **AC**：AC-MIG-001, AC-STATE-001, AC-STATE-002, AC-STATE-003
- **动作**：`task-bootstrap.mjs` 在 createTask 前读运行时 activation 标记并按**三事实契约**判定（三项齐备且可验证⇒`post`；缺失/空/部分/JSON 非法/引用不可解析**一律⇒`pre` 并把非法事实记入 task 记录，不阻断创建**——统一 fail-safe，不再有 fail-loud 分支）；manifest stamp 三字段（createOnly 写入即冻结，晚声明/暂停/恢复/澄清不改），其中 `entry_release_commit` 按来源规则取值（标记 `release_marker.commit` 可解析⇒该值；否则入口仓库当前 HEAD；皆不可得⇒`"unknown"`，不得因缺失阻断）；`task-topology` 的 cohort 读回改读 manifest 字段（缺省 `pre`）；补齐七值（含 `unverified`）终态记录与追加断言。
- **精确文件**：`tools/cli/task-bootstrap.mjs`, `tests/contract/activation-cohort.test.mjs`
- **boundary**：files: `tools/cli/task-bootstrap.mjs`, `tests/contract/activation-cohort.test.mjs`; symbols/regions: bootstrap 创建前读取运行时 activation 标记（测试以临时目录夹具构造，不写真实 storage root）与 manifest stamp、cohort 读回默认值、状态记录断言
- **输出**：同命令 exit 0；新任务 manifest 带 cohort，bootstrap 遇非法标记时不静默。
- **Knowledge**：T005 产出的真实失败事实；`createTask` 一次写 manifest 即冻结；`runtime/task/task-handle.mjs`、`task-store.mjs` 零改动。
- **verification_role**：GREEN
- **paired_task**：T005
- **gate_cmd**：`npx --no-install vitest run tests/contract/activation-cohort.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：0
- **oracle**：`ORACLE-P3-COHORT-STATE {"oracle_id":"ORACLE-P3-COHORT-STATE","role":"GREEN","pass":"契约测试断言 bootstrap stamp 把三事实写入 manifest；标记缺失/空标记/部分标记/JSON 非法/在途任务无 cohort 字段一律⇒pre，非法事实记入 task 记录且不阻断创建；晚声明、暂停、恢复、类型澄清均不改写 cohort；五类样本顶层拓扑逐字正确；终态按七值逐个记录（含 unverified 不得记 succeeded）；历史追加不覆盖。","notes":"与 T005 共享同一 oracle identity 与 gate，保留空标记/部分标记负例。"}`
- **semantic_review_status**：incomplete
- **semantic_review_ref**：`specs/workflowhub-thin-core-card-01-20260919/plan.md#Phase-P3--activation-cohort-冻结与状态事实落点`
- **semantic_review_reason**：等待 build-code Phase 独立 review；本草案未执行。
- **evidence_path**：`quality/tests/P3-cohort-state.json`
- **STOP**：需要弱化测试、把 cohort 写进 `facts.jsonl`、为其新建 gate、改 `task-handle`/`task-store` 或让标记成为推进门禁时停止回 `spec.md`（D-009）/`plan.md`（DEC-003）。
- **recovery**：回滚 bootstrap stamp 与契约测试；manifest 多余字段无害保留。
- **task risk**：标记面被误当 gate（PLAN-RISK-005：能力预演冒充 activation）；cohort 在恢复时被重算。
- **test tier / test method**：feature / backend-testing。
- **scenarios / commands / expected exit / oracle**：与 T005 完全相同；同 gate、同 oracle identity，保留负例。
- **fixtures_services**：与 T005 相同。
- **coverage limits**：不证明 activation 正式启用；只交能力级预演面（AC-MIG-001 的 owner 部分归 CARD-01 owner 发布后补齐）。
- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：`task-bootstrap.mjs` 在新 task manifest 写入三个冻结 cohort 字段；无效 marker 创建后写诊断 evidence，不阻断 bootstrap。`task-topology` 保持无 cohort 字段→pre。
- **executed_commands**：公共 final receipt `quality/tests/P3-cohort-state-final.json` exit `0`，P1/P2/P3+bootstrap 四个 targeted suites 共 28 assertions。
- **evidence_refs**：`quality/evidence/build-code/P3/phase-card.md`；`quality/tests/P3-cohort-state-final.json` sha256 `4920f53690d3408f9d177ab97882c972c941ca3c98f2cf30d1282de2e5b8062b`。
- **covered_ac**：AC-MIG-001、AC-STATE-001、AC-STATE-002、AC-STATE-003。
- **review_fact**：`quality/reviews/results/build-code-simple-7abe75ca-9f7e-5e4d-a49d-66b58bb8a64e.json`（semantic available；5 findings fixed，未重派 review）。
- **completed_at**：2026-09-20T12:29:22Z
- **执行事实**：post 必须有非空 capability ref、合法发布 commit/channel、非空 entry evidence 和时间戳；portable manifest 现锁精确六个 slug；最终 receipt 覆盖所有本卡新增 contract suites。只证明能力预演，不声明 activation/release 已发生。

### Verify

- **Target**：FR-MIG-001、FR-STATE-001/002/003；AC-MIG-001、AC-STATE-001/002/003。
- **gate_cmd**：`npx --no-install vitest run tests/contract/activation-cohort.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：RED=1，GREEN=0
- **evidence_path**：`quality/tests/P3-cohort-state.json`
- **Oracle**：`ORACLE-P3-COHORT-STATE` — bootstrap stamp、标记缺失⇒pre、晚声明/暂停不改、终态七值记录、历史追加不覆盖。

### Knowledge

cohort 字段名与取值冻结：`activation_cohort: "pre"|"post"`（新任务必填）、`activation_cohort_frozen_at`（ISO8601）、`entry_release_commit`。在途政策=缺省 `pre`（本卡自身即 pre cohort 普通任务，按五阶段跑完含本 build-plan）。activation 标记是记录非 gate。

### STOP

实现要求把 cohort 写进 `facts.jsonl`、为其新建 gate、改 `task-handle.mjs`/`task-store.mjs`，或让类型声明时点参与 cohort 判定时，停止回 `spec.md`（D-009）。

### Done

AC-MIG-001 能力预演面、AC-STATE-001/002/003 记录面有证据；真实行为：新任务 manifest 带 cohort，bootstrap 读到非法标记时不静默。只宣称能力级预演，不宣称 activation。

### Risks and rollback

- **Risk**：标记面被误当 gate；cohort 被类型声明时点/暂停恢复错误改写（PLAN-RISK-004）。
- **Prevention**：`ORACLE-P3-COHORT-STATE` 固定「创建时冻结、此后永不改写」断言与缺省 pre 负例。
- **Rollback / recovery**：回滚 bootstrap stamp 与契约测试，manifest 多余字段无害保留。

## Phase P4 — 零机器门禁接线、接口蓝图公开与端到端验收

### Goal

18 个谓词站点（5 族；RS-001 原文「24」差异已记录为事实）退出推进路径（缺失/无效如实记录、不阻断、不漂白）；接口蓝图六类契约公开给后续卡；三条旅程（规划/post 普通/pre 普通）从真实入口夹具走通且失败语义正确；全部 23 AC 聚合验收。

### Files

- **NEW**：`tests/contract/zero-machine-gate-advancement.test.mjs`、`tests/integration/card-01-dual-journey.test.mjs`、`tests/acceptance/card-01-current.mjs`、`docs/contracts/card-01-stage-material-interface.md`
- **MODIFY**：`docs/architecture/move-map.json`；推进路径上 24 项谓词的调用位（`runtime/stage/stage-handlers.mjs`、`runtime/task/task-kernel-implementation.mjs`、`runtime/stage/stage-runner.mjs`、`runtime/evidence/canonical-receipt-writer.mjs` 内具体行，**五阶段名单常量一律不改**）
- **DO NOT TOUCH**：两道人为门调用位（confirm/authorize）；母/兄弟卡材料；`specs/archive/**`

### Tasks

#### T007 — RED：18 个谓词站点去门禁（5 族；RS-001「24」差异已记录为事实）

- **ID**：T007
- **Phase**：Phase P4 — 零机器门禁接线、接口蓝图公开与端到端验收
- **goal**：用失败断言固定 18 个谓词站点去门禁后「缺事实推进不被阻断、缺项如实记录、旧失败不漂白、`outline_closed=missing` 保留」，并断言五阶段名单常量逐字未变。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-thin-core-card-01-20260919/spec.md","hash":"9c0a5c0bf4c7687ed01d3d0ae44d5b235d6e2d31b1b1894383914a4567474dc6","id":"SPEC-workflowhub-thin-core-card-01-20260919"},{"artifact_kind":"plan","ref":"specs/workflowhub-thin-core-card-01-20260919/plan.md","hash":"34e2de57b4f5c83a70c6d7f7819ce2d7b5245fd8882167f3d69cda1e8ca2b2ad","id":"PLAN-workflowhub-thin-core-card-01-20260919"}]`
- **source_refs / decision_refs**：D-002、D-003、D-004、D-005、D-007、D-010；R-004..R-009、R-011..R-013、R-015 → FR-FLOW-001, FR-FLOW-002, FR-FLOW-003, FR-GATE-001, FR-GATE-002, FR-GATE-003, FR-GATE-004, FR-IFACE-001, FR-IFACE-002, FR-IFACE-003, FR-REVIEW-001；AC-FLOW-001, AC-FLOW-002, AC-FLOW-003, AC-GATE-001, AC-GATE-002, AC-GATE-003, AC-GATE-004, AC-IFACE-001, AC-IFACE-002, AC-IFACE-003, AC-REVIEW-001, AC-MIG-001
- **输入**：T006 完成面；plan §机器阻断谓词 inventory（5 族 + 18 个谓词站点逐行表）；RS-001⑤（`decision-log.md:542`）五个锚点组：`stage-runner.mjs:683-684`+`task-kernel-implementation.mjs:946-947`、`task-kernel-implementation.mjs:691-702`+`stage-handlers.mjs:679-682`、`canonical-receipt-writer.mjs:216,228,677,683`、`stage-handlers.mjs:757-781`、`stage-runner.mjs:716`。
- **依赖**：T006
- **并行**：否 — RED 必须先于配对 GREEN（T008），两者共享同一 gate。
- **FR**：FR-FLOW-001, FR-FLOW-002, FR-FLOW-003, FR-GATE-001, FR-GATE-002, FR-GATE-003, FR-GATE-004, FR-IFACE-001, FR-IFACE-002, FR-IFACE-003, FR-REVIEW-001
- **AC**：AC-FLOW-001, AC-FLOW-002, AC-FLOW-003, AC-GATE-001, AC-GATE-002, AC-GATE-003, AC-GATE-004, AC-IFACE-001, AC-IFACE-002, AC-IFACE-003, AC-REVIEW-001, AC-MIG-001
- **动作**：新增两组断言（`zero-machine-gate-advancement.test.mjs` 逐族固定谓词×转移矩阵——族级以 plan 5 族为权威、逐站点按 18 条展开并断言 `stage-handlers.mjs:765` 纯重抛不单独计为谓词、RS-001「24」与展开「18」的差异按 plan 记录为事实而非凑数；`card-01-dual-journey.test.mjs` 真实入口三旅程与蓝图/人为门 inventory），断言缺失/无效事实下推进不被阻断、缺项被如实记录、旧阻断事实不被漂白、`outline_closed=missing` 样本保留、蓝图六类契约行存在、母/兄弟卡只读；RED 先行使两组断言均失败。
- **精确文件**：`tests/contract/zero-machine-gate-advancement.test.mjs`, `tests/integration/card-01-dual-journey.test.mjs`
- **boundary**：files: `tests/contract/zero-machine-gate-advancement.test.mjs`, `tests/integration/card-01-dual-journey.test.mjs`; symbols/regions: 谓词×转移矩阵断言、三旅程夹具断言（**RED 只写失败测试，不含生产改动**）
- **附加命令（本卡必须一并执行）**：把 T007 清点出的**既有受影响测试文件**逐个跑一遍并把断言改为「记录事实且继续」；命令为其 targeted 文件清单，禁止无范围全量回归。
- **输出**：目标行为未实现时 exit 非零（1），失败定位到具体谓词/转移/旅程而非 setup。
- **Knowledge**：谓词清单以 `decision-log` RS-001 全文为源，plan 已按 5 族 18 站点冻结并记录 24-vs-18 差异；缺失事实保持 `unknown`/`unavailable`/`incomplete`，不得写成通过。**既有测试影响已清点（Cluster I）**：去门禁会反转 stage-handlers / task-kernel-implementation / stage-runner / canonical-receipt-writer 中把「阻断」当预期的既有断言；本卡必须先清点这些既有测试文件，把断言改为「记录事实且继续」，并把受影响的既有测试文件加入同一 gate_cmd（见 T008 的 gate）。
- **verification_role**：RED
- **paired_task**：T008
- **gate_cmd**：`npx --no-install vitest run tests/contract/zero-machine-gate-advancement.test.mjs tests/integration/card-01-dual-journey.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：1
- **oracle**：`ORACLE-P4-ZERO-GATE-JOURNEY {"oracle_id":"ORACLE-P4-ZERO-GATE-JOURNEY","role":"RED","pass":"契约测试逐族断言 18 个谓词站点由「阻断推进」变为「记录事实且不阻断」、缺项如实记录、旧阻断失败不漂白、outline_closed=missing 保留、五阶段名单常量逐字未变；真实入口夹具三旅程投影逐字（规划 make-decision→build-prd 收口且无代码阶段；post 普通四阶段；pre 普通五阶段）、build-prd 失败重入不滑入代码阶段、蓝图六类契约行含「人工边界与审查重派」附加行、母/兄弟卡只读、plan §A/B 人为门 inventory 逐项与现行 F7/authorize 原文一致、等待/拒绝/批准三路径事实正确、沙箱 B 类正例对真实仓库无副作用。","reject":{"input":"喂入缺 round_count、缺机器校验事实、缺 stage completion 通用认证、旧阻断历史样本，以及规划任务失败后重入、类型非法澄清、沙箱内 B 类不可逆操作等待/拒绝/批准三路径。","expected_rejection":"缺项与缺失认证不得阻断推进、不得被记为通过，只在验收面保持 missing/unavailable/incomplete；旧阻断事实保持原义不被写成 pass/succeeded；失败重入不自动滑入代码阶段；等待/未答与拒绝时动作不执行并记录 pending/拒绝事实；沙箱 B 类正例对真实仓库零副作用。","observation":"tests/contract/zero-machine-gate-advancement.test.mjs 与 tests/integration/card-01-dual-journey.test.mjs 的谓词×转移矩阵与三旅程断言，证据落点 quality/tests/P4-zero-gate-journey.json。"}}`
- **semantic_review_status**：incomplete
- **semantic_review_ref**：`specs/workflowhub-thin-core-card-01-20260919/plan.md#Phase-P4--零机器门禁接线接口蓝图公开与端到端验收`
- **semantic_review_reason**：独立语义复核与真实 RED 尚未执行。
- **evidence_path**：`quality/tests/P4-zero-gate-journey.json`
- **STOP**：需要物理删除谓词（而非退出推进路径）、新增第三类人为门、把记录事实升级为 gate、或改动五阶段名单常量时，停止回 `plan.md`（DEC-005，物理删除归 CARD-06）/`decision-log`（G-002）。
- **recovery**：删除本卡新增断言；保留原失败输出、旧阻断事实与四材料。
- **task risk**：去门禁被实现成掩盖失败（PLAN-RISK-003）；缺项被吞掉导致历史质量事实漂白。
- **test tier / test method**：feature / backend-testing；调用位 + 矩阵断言，无 browser。
- **scenarios / commands / expected exit / oracle**：缺 round_count、缺机器校验事实、缺项记录、旧失败对照、`outline_closed=missing` 保留、谓词×转移四组矩阵、三旅程投影逐字、蓝图六类契约行存在、A/B inventory 一致；同 gate；RED=非零 / GREEN=0；`ORACLE-P4-ZERO-GATE-JOURNEY`。
- **fixtures_services**：内存 stage/kernel 事实 fixture 与受控 receipt 事实；无网络/provider/browser；测试自清 temp。
- **coverage limits**：不删除谓词代码；四类事实不互冒充与规则事实边界由本配对 GREEN（T008，同一 gate）一并断言，不在 RED 阶段冒充已通过。
- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：新增 P4 RED 断言，按 plan 冻结 18 站点/5 族与 24-vs-18 差异；无生产改动发生在 RED。
- **executed_commands**：`npx --no-install vitest run tests/contract/zero-machine-gate-advancement.test.mjs tests/integration/card-01-dual-journey.test.mjs --poolOptions.forks.singleFork --no-fileParallelism` → exit `1`。
- **evidence_refs**：`quality/evidence/build-code/P4/phase-card.md`（RED 段）
- **covered_ac**：AC-FLOW-001..003, AC-GATE-001..004, AC-IFACE-001..003, AC-REVIEW-001, AC-MIG-001
- **review_fact**：与 T008 共用 `quality/reviews/results/build-code-simple-2bf7da4d-ff2b-5fdf-a0ef-a8e887f53b70.json`
- **completed_at**：`2026-09-20T13:52:21.171Z`
- **执行事实**：RED 失败定位到缺观察态、缺蓝图和 fixture 存储边界；后续 GREEN 逐项修复，原失败不覆盖。

#### T008 — GREEN：蓝图契约公开与双旅程 integration

- **ID**：T008
- **Phase**：Phase P4 — 零机器门禁接线、接口蓝图公开与端到端验收
- **goal**：产出接口蓝图并让 integration 双/三旅程通过：规划收口无代码阶段、build-prd 失败重入不滑入、post 四阶段/pre 五阶段投影逐字、母/兄弟卡只读、A/B 两类人为门 inventory 与现行合同一致。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-thin-core-card-01-20260919/spec.md","hash":"9c0a5c0bf4c7687ed01d3d0ae44d5b235d6e2d31b1b1894383914a4567474dc6","id":"SPEC-workflowhub-thin-core-card-01-20260919"},{"artifact_kind":"plan","ref":"specs/workflowhub-thin-core-card-01-20260919/plan.md","hash":"34e2de57b4f5c83a70c6d7f7819ce2d7b5245fd8882167f3d69cda1e8ca2b2ad","id":"PLAN-workflowhub-thin-core-card-01-20260919"}]`
- **source_refs / decision_refs**：D-002、D-003、D-004、D-005、D-007、D-010；R-004..R-009、R-011..R-013、R-015 → FR-FLOW-001, FR-FLOW-002, FR-FLOW-003, FR-GATE-001, FR-GATE-002, FR-GATE-003, FR-GATE-004, FR-IFACE-001, FR-IFACE-002, FR-IFACE-003, FR-REVIEW-001；AC-FLOW-001, AC-FLOW-002, AC-FLOW-003, AC-GATE-001, AC-GATE-002, AC-GATE-003, AC-GATE-004, AC-IFACE-001, AC-IFACE-002, AC-IFACE-003, AC-REVIEW-001, AC-MIG-001
- **输入**：T001–T007 全部完成事实；`tests/official-make-decision-cli.test.mjs` 与 `tests/helpers/` 既有 fixture 模式。
- **依赖**：T007
- **并行**：否 — 双旅程读取全部前序事实，且为本配对 GREEN（RED=T007）。
- **FR**：FR-FLOW-001, FR-FLOW-002, FR-FLOW-003, FR-GATE-001, FR-GATE-002, FR-GATE-003, FR-GATE-004, FR-IFACE-001, FR-IFACE-002, FR-IFACE-003, FR-REVIEW-001
- **AC**：AC-FLOW-001, AC-FLOW-002, AC-FLOW-003, AC-GATE-001, AC-GATE-002, AC-GATE-003, AC-GATE-004, AC-IFACE-001, AC-IFACE-002, AC-IFACE-003, AC-REVIEW-001, AC-MIG-001
- **动作**：**先实现 18 个谓词站点的去门禁**——把 plan §机器阻断谓词 inventory 表列出的调用位从「抛错阻断推进」改为「记录对应事实并继续」（名单常量与校验函数本体零改动）；随后让 T007 的两个测试转绿，并产出蓝图与 move-map。integration 断言（夹具走真实 `stage-runtime.mjs`/`task-bootstrap.mjs`，夹具直调不冒充真实入口）：规划旅程 `make-decision→build-prd` 收口无代码阶段、build-prd 失败重入不滑入代码阶段、post 普通四阶段与 pre 普通五阶段投影逐字、**AC-MIG-001 五类样本**（pre 跨 activation 恢复/pre 晚声明普通/pre 晚声明规划/post 普通/post 规划）顶层拓扑、蓝图六类契约行 + 「人工边界与审查重派」附加行、母/兄弟卡前后一致、plan §A/B 人为门 inventory 逐项与现行 F7（`CONSTITUTION.md:54-59`）及 authorize 合同（13 处定位）原文一致、**等待/未答、拒绝、批准三条代表性路径**（等待保持 `in-progress` + waiting 事实、不新增 pending；拒绝动作不执行、阶段仍 `in-progress`；批准只执行绑定动作）、B 类批准正例仅在一次性沙箱/替身目标且预先取得该测试动作独立授权、四类事实不互冒充、规则事实只影响验收结论；产出 `docs/contracts/card-01-stage-material-interface.md` 并登记 `docs/architecture/move-map.json`。
- **精确文件**：`runtime/stage/stage-handlers.mjs`, `runtime/task/task-kernel-implementation.mjs`, `runtime/stage/stage-runner.mjs`, `runtime/evidence/canonical-receipt-writer.mjs`, `docs/contracts/card-01-stage-material-interface.md`, `docs/architecture/move-map.json`
- **boundary**：files: `runtime/stage/stage-handlers.mjs`, `runtime/task/task-kernel-implementation.mjs`, `runtime/stage/stage-runner.mjs`, `runtime/evidence/canonical-receipt-writer.mjs`, `docs/contracts/card-01-stage-material-interface.md`, `docs/architecture/move-map.json`; symbols/regions: 18 个谓词站点的调用位（`stage-runner.mjs:684,716`、`task-kernel-implementation.mjs:691-692,697-698,700-701,946-947`、`stage-handlers.mjs:679-682,757-758,764,773,777,778,780,781`、`canonical-receipt-writer.mjs:216,228,677,683`）由「阻断推进」改为「记录事实 + 继续」、五阶段名单常量零改动、蓝图六类契约行 + 附加接口行、move-map 新文件登记
- **输出**：同命令 exit 0；三条旅程真实执行记录与阶段轨迹可查，蓝图六类契约行齐备。
- **Knowledge**：真实入口为 `tools/cli/stage-runtime.mjs` 与 `tools/cli/task-bootstrap.mjs`；两道人为门 confirm→`publishHumanConfirmation`、authorize→`publishIrreversibleAuthorization`（本卡只读 inventory，不改调用位）。
- **verification_role**：GREEN
- **paired_task**：T007
- **gate_cmd**：`npx --no-install vitest run tests/contract/zero-machine-gate-advancement.test.mjs tests/integration/card-01-dual-journey.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：0
- **oracle**：`ORACLE-P4-ZERO-GATE-JOURNEY {"oracle_id":"ORACLE-P4-ZERO-GATE-JOURNEY","role":"GREEN","pass":"契约测试逐族断言 18 个谓词站点由「阻断推进」变为「记录事实且不阻断」、缺项如实记录、旧阻断失败不漂白、outline_closed=missing 保留、五阶段名单常量逐字未变；真实入口夹具三旅程投影逐字（规划 make-decision→build-prd 收口且无代码阶段；post 普通四阶段；pre 普通五阶段）、build-prd 失败重入不滑入代码阶段、蓝图六类契约行含「人工边界与审查重派」附加行、母/兄弟卡只读、plan §A/B 人为门 inventory 逐项与现行 F7/authorize 原文一致、等待/拒绝/批准三路径事实正确、沙箱 B 类正例对真实仓库无副作用。","notes":"与 T007 共享同一 oracle identity 与 gate，保留缺项与旧失败负例。"}`
- **semantic_review_status**：incomplete
- **semantic_review_ref**：`specs/workflowhub-thin-core-card-01-20260919/plan.md#Phase-P4--零机器门禁接线接口蓝图公开与端到端验收`
- **semantic_review_reason**：等待 build-code Phase 独立 review；本草案未执行。
- **evidence_path**：`quality/tests/P4-zero-gate-journey.json`
- **STOP**：integration 要求改动正式阶段名单、改 `core/dispatch-component.mjs`/旧 bridge、碰母材料或把蓝图事实升级为 gate 时，停止回 `plan.md`/`spec.md` 对应 owner。
- **recovery**：回滚本卡新增测试/蓝图草稿/move-map 登记；保留全部事实记录与负例测试，五阶段名单与物理授权面不受影响。
- **task risk**：夹具直调被冒充为真实入口；integration 通过掩盖未执行的外部事实。
- **test tier / test method**：feature / backend-testing；跨模块 CLI + 文件系统 + 记录面夹具，无 browser。
- **scenarios / commands / expected exit / oracle**：缺 round_count、缺机器校验事实、缺项记录、旧失败对照、`outline_closed=missing` 保留、谓词×转移四组矩阵、规划收口、post 四阶段、pre 五阶段、失败重入、类型非法澄清、零门禁推进、蓝图六类契约行存在、母/兄弟卡只读、A/B inventory 一致；同 gate；RED=非零 / GREEN=0；`ORACLE-P4-ZERO-GATE-JOURNEY`。
- **fixtures_services**：临时 Git/worktree + task 追踪目录 + activation 标记 fixture；无网络/provider/browser；测试自清 temp。
- **coverage limits**：不执行真实 provider/LLM 六步对话；不宣称 activation 正式启用（PLAN-RISK-005）；AC-REVIEW-001 只回归已合入基线的 D-007 修复事实，不新修。
- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：增加 machine-gate diagnostic 观察/发布、interaction receipt 非阻断消费、frozen review material unavailable 语义、阶段/材料蓝图和 move-map 登记；五正式阶段与 confirm/authorize 未改。
- **executed_commands**：同 T007 gate → exit `0`、10 assertions；`stage-runtime verify --action=execute` post-review capture → exit `0`。
- **evidence_refs**：`quality/tests/P4-zero-gate-journey-post-review-final.json` (`0c30129d2f9862edb1fac47fd6ca8ec9f56fc9a73dc8af24b723e105702ec97a`)、`docs/contracts/card-01-stage-material-interface.md`
- **covered_ac**：AC-FLOW-001..003, AC-GATE-001..004, AC-IFACE-001..003, AC-REVIEW-001, AC-MIG-001
- **review_fact**：`quality/reviews/results/build-code-simple-2bf7da4d-ff2b-5fdf-a0ef-a8e887f53b70.json`；两条 anchored minor 均 fixed，未重复派发。
- **completed_at**：`2026-09-20T13:52:21.171Z`
- **执行事实**：缺失/无效 binding 记录为 unavailable/invalid evidence，不消费坏数据；物理不可读材料继续抛出并允许修复重试。

#### T009 — FINAL：当前快照 aggregate acceptance

- **ID**：T009
- **Phase**：Phase P4 — 零机器门禁接线、接口蓝图公开与端到端验收
- **goal**：一次运行全部 targeted 文件聚合仓内合同结果，23 条 AC 各恰好一次 `entries[].assertions`，覆盖三条旅程与全部 seam。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-thin-core-card-01-20260919/spec.md","hash":"9c0a5c0bf4c7687ed01d3d0ae44d5b235d6e2d31b1b1894383914a4567474dc6","id":"SPEC-workflowhub-thin-core-card-01-20260919"},{"artifact_kind":"plan","ref":"specs/workflowhub-thin-core-card-01-20260919/plan.md","hash":"34e2de57b4f5c83a70c6d7f7819ce2d7b5245fd8882167f3d69cda1e8ca2b2ad","id":"PLAN-workflowhub-thin-core-card-01-20260919"}]`
- **source_refs / decision_refs**：D-001..D-010；R-001..R-015 → 全部 23 条 FR；AC-TYPE-001..AC-REVIEW-001（全部 23 条 AC）
- **输入**：T001–T008 的真实实现、targeted evidence、Phase reviews 与当前快照。
- **依赖**：T008
- **并行**：否 — aggregate 读取全部前序事实且只运行一次。
- **FR**：FR-TYPE-001, FR-TYPE-002, FR-TYPE-003, FR-TOPO-001, FR-TOPO-002, FR-MIG-001, FR-PRD-001, FR-PRD-002, FR-PRD-003, FR-FLOW-001, FR-FLOW-002, FR-FLOW-003, FR-GATE-001, FR-GATE-002, FR-GATE-003, FR-GATE-004, FR-STATE-001, FR-STATE-002, FR-STATE-003, FR-IFACE-001, FR-IFACE-002, FR-IFACE-003, FR-REVIEW-001
- **AC**：AC-TYPE-001, AC-TYPE-002, AC-TYPE-003, AC-TOPO-001, AC-TOPO-002, AC-MIG-001, AC-PRD-001, AC-PRD-002, AC-PRD-003, AC-FLOW-001, AC-FLOW-002, AC-FLOW-003, AC-GATE-001, AC-GATE-002, AC-GATE-003, AC-GATE-004, AC-STATE-001, AC-STATE-002, AC-STATE-003, AC-IFACE-001, AC-IFACE-002, AC-IFACE-003, AC-REVIEW-001
- **动作**：按 `tests/acceptance/build-prd-current.mjs` 模式新增 `tests/acceptance/card-01-current.mjs`，只运行一次合并 targeted 命令并采集原 stdout/stderr；输出 UTF-8 JSON，23 条 AC 各恰好一次 `entries[].assertions`，expected/actual 为实际可比较 JSON，由 runtime 自行派生结论、不采信自报 passed；不创建新的状态权威。
- **精确文件**：`tests/acceptance/card-01-current.mjs`
- **boundary**：files: `tests/acceptance/card-01-current.mjs`; symbols/regions: final acceptance JSON adapter/aggregate fixture only
- **输出**：当前快照全部 targeted 文件与逐 AC 结构化比较事实（23 条各恰好一次）。
- **Knowledge**：测试通过不等于真实 provider/宿主/UI 已执行；缺项保持 `unavailable`/`incomplete`；本卡 tier=command/service、`e2e_scope=not_required`、non_ui。
- **verification_role**：N/A — non-behavior aggregate verification
- **paired_task**：N/A — aggregate has no RED/GREEN pair
- **gate_cmd**：`node tests/acceptance/card-01-current.mjs`
- **expected_exit**：0
- **oracle**：`ORACLE-FINAL-CARD01 {"oracle_id":"ORACLE-FINAL-CARD01","role":"N/A","pass":"acceptance runner 按 tests/acceptance/build-prd-current.mjs 模式 spawn 上述 targeted 文件，输出 UTF-8 JSON，读回的 23 条 AC 在 entries[].assertions 中各恰好出现一次；AC-REVIEW-001 含五条具名断言：build-spec manifest 单向依赖链 review-frozen-spec→main-agent-disposes-findings→stage-end-spec-analyze→publish-spec-result、review 与 publish 之间无第二个 review dispatch step、SKILL 不回跳语义存在、reviewCycleDecision 在 serious finding 且 actualRepair/subjectChanged 存在时仍返回 action=advance、底层 recorder 材料 B 不复用 A 的结果。","notes":"non-behavior aggregate verification；无 RED/GREEN pair。"}`
- **semantic_review_status**：incomplete
- **semantic_review_ref**：`specs/workflowhub-thin-core-card-01-20260919/plan.md#Phase-P4--零机器门禁接线接口蓝图公开与端到端验收`
- **semantic_review_reason**：聚合命令未执行；final acceptance 事实待验证阶段产出。
- **evidence_path**：`quality/tests/final-card-01.json`
- **STOP**：任一命令不可执行、AC 缺失/重复/不等于 23、JSON 无效/超时/取消、断言失败、快照变化、越界或需新决定时停止回受影响 task/owner。
- **recovery**：verify-code 保留原输出，定位到对应 paired task 修复后只按当前快照重跑最终 aggregate；不以全量测试掩盖局部失败。
- **task risk**：聚合通过掩盖 unavailable 事实，或 assertions 自报 passed 而无 expected/actual；断言数写少（如 19）导致覆盖缺口。
- **test tier / test method**：command/service / backend-testing；non_ui 跨模块 command aggregate。
- **scenarios / commands / expected exit / oracle**：三条旅程 + 类型非法澄清 + 失败不滑入 + 零门禁推进 + 蓝图六类契约行 + 母/兄弟卡只读；命令如上；exit 0；`ORACLE-FINAL-CARD01`。
- **fixtures_services**：各 targeted 测试自管临时 fixture/清理；aggregate 不共享可变 fixture；无网络/browser。
- **coverage limits**：不运行全量回归、真实 provider/LLM、真实 UI 浏览器、真实远端 Git；这些必须单列真实事实且不影响完成声明。
- **acceptance_role**：acceptance
- **ui_scope**：non_ui
- **acceptance_data**：`[{"source":"current authenticated worktree","sample":"规划任务 decision-log + 六步 outcome 齐备","scenario":"规划旅程 make-decision→build-prd 收口且无代码阶段","tier":"command","execution":{"command":"node","args":["tests/acceptance/card-01-current.mjs"],"timeout_ms":120000}},{"source":"current authenticated worktree","sample":"cohort=post 普通任务","scenario":"post 普通任务四阶段投影与推进","tier":"command","execution":{"command":"node","args":["tests/acceptance/card-01-current.mjs"],"timeout_ms":120000}},{"source":"current authenticated worktree","sample":"cohort=pre 普通任务","scenario":"pre 普通任务五阶段投影与推进","tier":"command","execution":{"command":"node","args":["tests/acceptance/card-01-current.mjs"],"timeout_ms":120000}},{"source":"current authenticated worktree","sample":"decision-log 任务身份段缺失/重复/冲突/非法值四类材料","scenario":"非法任务类型澄清且不写第二条当前标签","tier":"command","execution":{"command":"node","args":["tests/acceptance/card-01-current.mjs"],"timeout_ms":120000}},{"source":"current authenticated worktree","sample":"build-prd 第三步缺失 outcome","scenario":"build-prd failed 终态、重入修复且不滑入代码阶段","tier":"command","execution":{"command":"node","args":["tests/acceptance/card-01-current.mjs"],"timeout_ms":120000}},{"source":"current authenticated worktree","sample":"缺 round_count 与机器校验事实的推进样本","scenario":"零门禁推进且缺项如实记录、旧失败不漂白","tier":"command","execution":{"command":"node","args":["tests/acceptance/card-01-current.mjs"],"timeout_ms":120000}},{"source":"current authenticated worktree","sample":"docs/contracts/card-01-stage-material-interface.md","scenario":"接口蓝图六类契约行齐备且 owner/合并/验收责任可查","tier":"command","execution":{"command":"node","args":["tests/acceptance/card-01-current.mjs"],"timeout_ms":120000}},{"source":"current authenticated worktree","sample":"母 PRD 与兄弟卡材料前后字节对照","scenario":"母/兄弟卡只读且 FR-REVIEW-001 既有修复回归保持","tier":"command","execution":{"command":"node","args":["tests/acceptance/card-01-current.mjs"],"timeout_ms":120000}}]`
- **e2e_scope**：not_required

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：新增当前快照 acceptance runner；不创建新状态权威。
- **executed_commands**：`node tests/acceptance/card-01-current.mjs` → exit `0`，targeted suites `40/40`。
- **evidence_refs**：`quality/tests/final-card-01.json`
- **covered_ac**：AC-TYPE-001..003, AC-TOPO-001..002, AC-MIG-001, AC-PRD-001..003, AC-FLOW-001..003, AC-GATE-001..004, AC-STATE-001..003, AC-IFACE-001..003, AC-REVIEW-001（23 条，各恰一次）
- **review_fact**：`quality/reviews/results/build-code-simple-236e8ddf-e758-5095-adbf-8efb25e3edfc.json` — integration scope, two providers, zero findings; P4 phase review remains recorded on T008.
- **completed_at**：`2026-09-20T13:52:45.000Z`
- **执行事实**：runner 原始运行返回 JSON `entries[]`，所有 23 条 AC 各有一项 `current-targeted-contract-suite` 断言；没有全量回归。阶段末 current-session run/reflect/handoff 已执行，formal quality 仍如实为 incomplete（缺 per-AC canonical receipt）。

### Verify

- **Target**：FR-FLOW-001/002/003、FR-GATE-001/002/003/004、FR-IFACE-001/002/003、FR-REVIEW-001、FR-MIG-001 预演面及全部 23 AC 聚合。
- **gate_cmd**：T007/T008 `npx --no-install vitest run tests/contract/zero-machine-gate-advancement.test.mjs tests/integration/card-01-dual-journey.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`；T009 `node tests/acceptance/card-01-current.mjs`
- **expected_exit**：T007/T008 非零→0；T009 0
- **evidence_path**：`quality/tests/P4-zero-gate-journey.json`、`quality/tests/final-card-01.json`
- **Oracle**：`ORACLE-P4-ZERO-GATE-JOURNEY`、`ORACLE-FINAL-CARD01`

### Knowledge

去门禁后推进路径谓词全清单（24 项逐行 consumer/转移/缺失行为）回填进 tasks 卡验收栏；activation 正式关闭动作清单移交 CARD-01 owner（AC-MIG-001）。蓝图为公开契约面，后续 CARD-02..10 消费。

### STOP

谓词删除（而非退出路径）、新第三类人为门、蓝图事实升级为 gate、integration 要求改动正式阶段名单或碰母材料时，停止回对应 owner。

### Done

AC-FLOW-001/002/003、AC-GATE-001/002/003/004、AC-IFACE-001/002/003、AC-REVIEW-001 及全 23 AC 聚合有证据；三条旅程真实执行记录与阶段轨迹可查；只宣称能力级预演，不宣称 activation。未执行前所有卡保持 pending。

### Risks and rollback

- **Risk**：去门禁误伤记录面或普通路径回归（PLAN-RISK-003）；聚合通过掩盖 unavailable。
- **Prevention**：T007 以「缺项被记录且推进不被阻断」双断言固定；T009 逐 AC expected/actual 由 runtime 派生。
- **Rollback / recovery**：回滚调用位改动，保留全部事实记录与负例测试，五阶段名单与物理授权面不受影响。

## 4. Final current-snapshot aggregate strategy

- **tier / method**：command/service / backend-testing；non_ui 跨模块 command aggregate。
- **scenarios**：全部 23 条 AC；三条旅程（规划收口无代码阶段、post 普通四阶段、pre 普通五阶段）；类型非法澄清；build-prd 失败重入不滑入代码阶段；零门禁推进且缺项如实记录；蓝图六类契约行存在；母/兄弟卡只读。
- **command**：`node tests/acceptance/card-01-current.mjs`
- **expected exit**：0
- **oracle**：`ORACLE-FINAL-CARD01` — 按 `tests/acceptance/build-prd-current.mjs` 模式 spawn 上述 targeted 文件，输出 UTF-8 JSON，23 条 AC 各恰好一次 `entries[].assertions`。
- **fixtures_services**：各 targeted 测试自管 temp worktree/task 目录/标记 fixture 与清理；aggregate 不共享可变 fixture；无网络/browser。
- **evidence_path**：`quality/tests/final-card-01.json`
- **coverage limits**：不运行全量回归、真实 provider/LLM、真实 UI browser、真实远端 Git；缺失事实保持 `unavailable`/`incomplete`。
- **STOP**：命令损坏、AC 缺失/重复/不等于 23、无效 JSON、超时/取消、快照变化、越界或需要新产品决定。
- **execution_contract**：当前快照只运行一次；优先复用有相同绑定的 current canonical test receipts；失败保留原始输出并回受影响 paired task，不用全量重跑掩盖局部失败。超时记录 `incomplete`，不自动触发全量重跑。

## Dependency Graph

- **order**：T001 (RED) → T002 (GREEN) → T003 (RED) → T004 (GREEN) → T005 (RED) → T006 (GREEN) → T007 (RED) → T008 (GREEN) → T009 (FINAL acceptance)

```text
T001 (RED) → T002 (GREEN) → T003 (RED) → T004 (GREEN) → T005 (RED) → T006 (GREEN) → T007 (RED) → T008 (GREEN) → T009 (FINAL acceptance)
```

## Final Boundary Check

- [ ] 9 张卡齐全，ID/Phase 与 `plan.md` 的 4 Phase / 9 Task 逐一对齐；每卡恰一个完成区。
- [ ] 四对 RED/GREEN reciprocal：同 Phase/FR/AC/gate_cmd/oracle identity/evidence path，GREEN 依赖 RED（T001/T002、T003/T004、T005/T006、T007/T008）。
- [ ] T007 与蓝图草稿文件互斥可并行；其余串行；依赖无环。
- [ ] 每卡 Files 是所属 Phase File Boundary NEW/MODIFY 的子集，未越界。
- [ ] 全部 23 条 FR 与 23 条 AC 至少被一张卡覆盖；T009 聚合全部 23 条 AC 且每条恰好一次断言。
- [ ] 唯一最终 acceptance 卡为 T009：`acceptance_role=acceptance`、`ui_scope=non_ui`、`e2e_scope=not_required`，`acceptance_data` 八场景四字段齐备、`tier` 全为 `command`；其余卡仅 `acceptance_role=implementation` + `ui_scope=non_ui`，不出现任何 `e2e_*` 字段。
- [ ] 所有 card oracle 为 `ORACLE-*` 身份，gate_cmd 与 `plan.md#Test-Strategy` 表逐字一致。
- [ ] 不扩 `WORKFLOW_STAGES`、不写历史材料、不宣称 review/确认/交付完成；全部卡 status 保持 `pending`。

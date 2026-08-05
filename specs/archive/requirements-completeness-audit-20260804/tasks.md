# WorkflowHub 需求完整性审计：任务清单

- **当前材料状态**：本轮 tasks 基于当前 spec 和 plan；T001-T019 的既有事实只读保留。当前 scope revision `SR-build-code-20260805-apply-quality` 增加 T020-T024，处理内容合同、apply 闭环、build-plan 任务级测试策略、bounded scope_revision packet 和一次专用 scope_revision contract review；本轮审计追加 T025-T029，处理高质量内容合同扩展、前三阶段/后两阶段进度索引、执行路径、当前旧任务卡回填、历史证据兼容和语义状态纠正。
- **Template version**：`plan-task.v3`

## 1. 执行摘要

T001 → T002 → T003 → T004 → T005 → T006 → T013 → T014 → T007 → T008 → T009 → T010 → T011 → T012 → T015 → T016 → T017 → T018 → T019 → T020 → T021 → T022 → T023 → T024 → T025 → T026 → T028 → T027。行为任务使用同一命令完成 RED/GREEN；非行为任务记录回归事实，不伪造 RED。

## WorkflowHub Stage Progress

这是 tasks.md 的执行进度索引，不是第二套 completion ledger。`Status` 表示任务/阶段
执行事实，`quality_status`、review 和 handoff 独立记录。

| Stage | Status | Task / phase IDs | Execution / evidence | Handoff / next |
| --- | --- | --- | --- | --- |
| build-code | completed / quality=incomplete | T001-T024；T025-T029 为当前材料修订 | 历史完成行和当前聚焦回归已留痕；实际需求语义仍由 verify-code 回放决定 | verify-code 逐项回放；不以 Task completed 冒充 AC pass |
| verify-code | completed / quality=incomplete | R1-R23、F*、INC-*、D1-D57、FR/AC、T001-T029 | 31 条 AC 当前索引已通过；154-source replay 已绑定（140 pass、14 deferred）；审查和 handoff 未决事实保留 | 展示大白话交接；不 close、不宣称 formal accepted |

执行路径规则：每张 Task 卡的 `精确文件` 是唯一文件边界；`execution_file_paths` 只能由它
派生，必须是所属 Phase NEW/MODIFY 的精确子集，禁止 glob。`source_refs/decision_refs`
只保存 decision-log → spec → plan → tasks 的 ID 关系，不复制原始需求正文。

## 2. Global Constraints

- 只修改当前 Phase 的 NEW/MODIFY 文件；不改两个 provider 配置、不实现业务项目、不创建第二套控制面。
- 原始 review、provider failure、timeout、unavailable、finding 和 audit gap 原样保留；不把质量事实改成 pass。
- 同一次 make-decision/build-spec/build-plan 阶段运行只做一次异源审查；不因 finding 或 verdict 自动重复调用 provider，后续新增材料才按 D19 在新的运行中审查增量。
- 任务完成区是唯一当前完成权威；旧历史完成记录不自动完成当前任务。
- build-plan 必须为每个 Task/Phase/final strategy 写入 routing、blueprint、适用测试方法、scenarios、commands、oracle、evidence、coverage limits 和当前 snapshot 绑定；build-code 只执行已记录策略并补写实际结果，不重新设计 route/blueprint/executor；这些是质量事实，不是推进 gate。
- 普通 build-code 模型不得猜测试：任务卡缺少可执行策略时只记录 `MATERIAL_INCOMPLETE`，回到当前材料修复，不临场替代设计。
- 当前语义状态：结构/局部实现可以已完成，但没有当前 canonical receipt、逐项 scenario/oracle/actual outcome、独立 review resolution 或用户 handoff 时，必须写 `unknown/incomplete`。

## Test Strategy Contract

这是 build-code 的直接执行输入，不是建议文字。build-plan 为每个 Task/Phase 和最终
聚合策略写入以下字段，普通执行模型只消费这些字段：

- `test_strategy_owner`：`build-plan/high-intelligence-model`
- `scope`：精确 changed files、FR/AC、Task/Phase 和 snapshot 绑定
- `tier`：`simple|feature|fullstack` 及选择理由
- `scenarios`：成功、失败、状态/数据、权限、并发、seam、UI 等适用场景
- `commands` / `expected_exit` / `oracle`：可直接执行的命令和判定信号
- `fixtures_services`：fixture、服务、端口、启动、清理和浏览器 QA 路径
- `evidence_path`：输出、截图/日志、hash、实际结果和覆盖限制的留痕位置
- `coverage_limits`：未覆盖边界、跳过理由、环境限制和延期风险
- `execution_contract`：`build-code` 不重新 route/blueprint/executor；缺失就写 `MATERIAL_INCOMPLETE`

最终聚合策略必须是一张独立的 final Task/Phase 卡，不能在 build-code 末尾临时拼接或
重新设计。测试失败、不可用和覆盖不足照实记录，均不是隐藏 gate。

## Phase 1：用户沟通所有权和阶段交接

### Goal

固定用户沟通由主代理执行，并在三个阶段技能中明确摘要后等待真实用户回复。

### Files

- **MODIFY**：`tests/stage-interaction-contract.test.mjs`
- **MODIFY**：`workflows/make-decision/skill-deps.yaml`
- **MODIFY**：`workflows/make-decision/SKILL.md`
- **MODIFY**：`workflows/build-spec/SKILL.md`
- **MODIFY**：`workflows/build-plan/SKILL.md`

### Tasks

T001 then T002.

### Verify

`npx vitest run tests/stage-interaction-contract.test.mjs`；T001 exit 1，T002 exit 0。

### Knowledge

Grill 的 execution 配置和三个阶段的交接文字是当前缺口。

### STOP

需要新 handoff 状态机、阅读 API 或正式人工 gate 时停止。

### Done

沟通执行身份和摘要暂停规则有测试证据。

### Risks and rollback

只回滚交互配置、技能文字和测试断言。

#### T001 — 用户沟通所有权与交接 RED

- **ID**：T001
- **Phase**：Phase 1：用户沟通所有权和阶段交接
- **goal**：用失败测试固定主代理沟通、Talk 双覆盖和摘要后暂停。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"14b7f126371ac8a4d20c2a984bf7f24ee545ad8ee5b88e2df5b320d95a328d19","id":"SPEC"}]`
- **输入**：当前 skill-deps 与三个 workflow skill
- **依赖**：N/A — 首个任务
- **并行**：否 — RED 必须先于 GREEN
- **FR**：FR-003、FR-004、FR-016
- **AC**：AC-004、AC-005、AC-019
- **动作**：增加 execution、Talk 架构/用户结果双覆盖、真实 reply/handoff，以及 build-spec/build-plan 交接前逐条 finding disposition 摘要的失败断言；摘要至少包含 finding_id、原始事实/来源、后果、status、next_action、evidence_ref、owner、consumer、retain_or_delete。
- **精确文件**：`tests/stage-interaction-contract.test.mjs`
- **boundary**：files: `tests/stage-interaction-contract.test.mjs`; symbols/regions: interaction contract assertions only。
- **输出**：RED 输出，证明当前配置或文字不满足交互边界。
- **Knowledge**：现有 Grill 配置曾为 independent，且用户摘要规则需要可观察断言。
- **verification_role**：RED
- **paired_task**：T002
- **gate_cmd**：`npx vitest run tests/stage-interaction-contract.test.mjs`
- **expected_exit**：1
- **oracle**：ORACLE-INTERACTION — 沟通走 independent、未覆盖用户结果、未要求真实回复或未要求 finding disposition 摘要时测试失败。
- **evidence_path**：apply/evidence/T001.stdout
- **STOP**：若 RED 是测试夹具/路径错误，先修夹具。
- **recovery**：只撤回 T001 测试字节。
- **task risk**：误把非交互研究当成用户沟通。
- **Workflow stage**：build-code
- **source_refs / decision_refs**：R1,R2,R3 → D12,D13,D16 → FR-003/004/016
- **execution_file_paths**：`tests/stage-interaction-contract.test.mjs`。
- **test_strategy_owner**：build-plan/high-intelligence-model（回填设计；不是历史执行事实）
- **test tier / test method**：simple — focused contract/unit test；由 build-plan 设计，build-code 执行。
- **scenarios / commands / expected exit / oracle**：成功、失败和缺证据边界按本卡原有策略；`npx vitest run tests/stage-interaction-contract.test.mjs`；1；ORACLE-INTERACTION — 沟通走 independent、未覆盖用户结果、未要求真实回复或未要求 finding disposition 摘要时测试失败。。
- **fixtures_services**：Node/Vitest 本地 fixtures；无 provider、无外部服务；若原卡另有环境限制，以原卡为准。
- **browser_route**：N/A — 本任务是 WorkflowHub runtime/材料合同，无业务 UI。
- **execution_contract**：build-code 只消费本卡已写入的命令/oracle/evidence 边界；不临场 route/blueprint/executor；缺策略写 MATERIAL_INCOMPLETE。
- **final current-snapshot aggregate strategy**：N/A — 当前快照最终聚合由 T027 的 verify-code replay 负责。
- **coverage limits**：本卡不等于原始需求语义验收；历史 receipt、provider review、用户 handoff 缺失或过期时保持 unknown/incomplete。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：先增加 interaction contract 的 RED 断言，锁定主代理沟通、Talk 双覆盖、三阶段真实回复和 finding 摘要边界。
- **executed_commands**：`npx vitest run tests/stage-interaction-contract.test.mjs`；初次 RED `exit_code=1`，2 个新增断言组失败，证明缺口真实存在。
- **evidence_refs**：`[{"ref":"quality/evidence/task-completion/verify-code/T001-2cf2592963682f8f0e783c25b57e8d6db0e183e4e96214ceb6547437a1b1c55b.json","sha256":"2cf2592963682f8f0e783c25b57e8d6db0e183e4e96214ceb6547437a1b1c55b","kind":"task_completion_current","snapshot_tree":"e4b968db05893d7e6a889e3e272e652c172a7cbb","source_digest":"ad59ad17dc213ba78a051a60db4d693d6a4b8e9a598c3ffde026b595e6551912"}]`
- **covered_ac**：`AC-004`、`AC-005`、`AC-019`
- **review_fact**：该 Task 由 Phase 1 的一次异源 review 统一审查；原始 attempt `81e7afea-47cc-46aa-ba32-9075a720b02b` 因缺少结构化 map/test receipt 返回 `MATERIAL_INCOMPLETE`，未调用 provider，保留为输入错误事实。
- **completed_at**：`2026-08-04T22:30+08:00`

#### T002 — 用户沟通所有权与交接 GREEN

- **ID**：T002
- **Phase**：Phase 1：用户沟通所有权和阶段交接
- **goal**：修复沟通分流并写清摘要—等待用户—handoff 顺序。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"14b7f126371ac8a4d20c2a984bf7f24ee545ad8ee5b88e2df5b320d95a328d19","id":"SPEC"}]`
- **输入**：T001 RED、D12、D13
- **依赖**：T001
- **并行**：否 — GREEN 依赖 RED
- **FR**：FR-003、FR-004、FR-016
- **AC**：AC-004、AC-005、AC-019
- **动作**：将 Grill 设为 inline；补 Talk 双覆盖、三个阶段摘要后等待真实回复，以及 build-spec/build-plan handoff 前逐条 finding disposition 摘要的规则；复用现有 Task completion area 和 risk-acceptance/missing-items consumer，不新增 resolution ledger。
- **精确文件**：`workflows/make-decision/skill-deps.yaml`; `workflows/make-decision/SKILL.md`; `workflows/build-spec/SKILL.md`; `workflows/build-plan/SKILL.md`
- **boundary**：files: `workflows/make-decision/skill-deps.yaml`; `workflows/make-decision/SKILL.md`; `workflows/build-spec/SKILL.md`; `workflows/build-plan/SKILL.md`; symbols/regions: interaction ownership and handoff text only。
- **输出**：主代理沟通配置和可执行交接规则。
- **Knowledge**：复用现有 runtime 分流，不新增 scheduler。
- **verification_role**：GREEN
- **paired_task**：T001
- **gate_cmd**：`npx vitest run tests/stage-interaction-contract.test.mjs`
- **expected_exit**：0
- **oracle**：ORACLE-INTERACTION — 同一组沟通、真实回复和 finding disposition handoff 断言全部通过。
- **evidence_path**：apply/evidence/T002.stdout
- **STOP**：若需要新状态机或正式 gate，停止。
- **recovery**：只回滚当前配置和技能文字。
- **task risk**：交互技能与独立研究分流混淆。
- **Workflow stage**：build-code
- **source_refs / decision_refs**：R1,R2,R3 → D12,D13 → FR-003/004/016
- **execution_file_paths**：`workflows/make-decision/skill-deps.yaml`; `workflows/make-decision/SKILL.md`; `workflows/build-spec/SKILL.md`; `workflows/build-plan/SKILL.md`。
- **test_strategy_owner**：build-plan/high-intelligence-model（回填设计；不是历史执行事实）
- **test tier / test method**：simple — focused contract/unit test；由 build-plan 设计，build-code 执行。
- **scenarios / commands / expected exit / oracle**：成功、失败和缺证据边界按本卡原有策略；`npx vitest run tests/stage-interaction-contract.test.mjs`；0；ORACLE-INTERACTION — 同一组沟通、真实回复和 finding disposition handoff 断言全部通过。。
- **fixtures_services**：Node/Vitest 本地 fixtures；无 provider、无外部服务；若原卡另有环境限制，以原卡为准。
- **browser_route**：N/A — 本任务是 WorkflowHub runtime/材料合同，无业务 UI。
- **execution_contract**：build-code 只消费本卡已写入的命令/oracle/evidence 边界；不临场 route/blueprint/executor；缺策略写 MATERIAL_INCOMPLETE。
- **final current-snapshot aggregate strategy**：N/A — 当前快照最终聚合由 T027 的 verify-code replay 负责。
- **coverage limits**：本卡不等于原始需求语义验收；历史 receipt、provider review、用户 handoff 缺失或过期时保持 unknown/incomplete。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：将 Grill 改为 inline；补主代理 Talk/Grill/Clarify、Talk 双覆盖、三阶段摘要后真实回复再 handoff；补 build-spec/build-plan 逐条 finding 摘要并写回现有 Task completion area；修正 Phase review 后发现的三阶段真实回复测试覆盖。
- **executed_commands**：`npx vitest run tests/stage-interaction-contract.test.mjs`；GREEN `exit_code=0`，`7/7` 通过。
- **evidence_refs**：`[{"ref":"quality/evidence/task-completion/verify-code/T002-a92e67cda1be8d3e09147d7d0931d5f5490ec9f37032a8dbb6676b90629950b9.json","sha256":"a92e67cda1be8d3e09147d7d0931d5f5490ec9f37032a8dbb6676b90629950b9","kind":"task_completion_current","snapshot_tree":"e4b968db05893d7e6a889e3e272e652c172a7cbb","source_digest":"ad59ad17dc213ba78a051a60db4d693d6a4b8e9a598c3ffde026b595e6551912"}]`
- **covered_ac**：`AC-004`、`AC-005`、`AC-019`
- **review_fact**：一次 Phase 1 异源 review，`kimi/coding` 与 `cursor/grok` 完成，aggregate=`pass`；保留 2 个 minor 与 2 个 `invalid_anchor` 原始 finding。处置：`F-4e639c41f4d6=fixed`（测试覆盖 make-decision/build-spec/build-plan）；`F-2230c1a4dc13=fixed`（写回现有 Task completion area）；`F-246c7cd1982f=fixed`（T001 RED 命令/exit 事实写入完成区，未伪造 receipt）；`F-ef6326b3f78b=rejected_invalid`（review packet 的 unknown map 是因缺少可绑定 anchors 的真实事实，不能用测试通过伪造 complete，后续由正式 phase facts 生成 anchors）。原始 provider verdict 和分类没有改写。
- **completed_at**：`2026-08-04T22:39+08:00`

## Phase 2：阶段摘要 user/system view

### Goal

让 canonical completion summary 向用户展示做了什么、产物、风险、延期和下一阶段边界。

### Files

- **MODIFY**：`tests/stage-completion-facts.test.mjs`
- **MODIFY**：`runtime/evidence/stage-completion-facts.mjs`
- **MODIFY**：`runtime/stage/stage-handlers.mjs`

### Tasks

T003 then T004.

### Verify

`npx vitest run tests/stage-completion-facts.test.mjs`；T003 exit 1，T004 exit 0。

### Knowledge

复用现有 completion facts 和双视图。

### STOP

内部 ref/hash/provider 字段泄露或新增 formal gate 时停止。

### Done

user/system view 一致，用户摘要完整且不泄露内部字段。

### Risks and rollback

只回滚 renderer/handler 当前修改，保留历史 facts。

#### T003 — 阶段摘要展示 RED

- **ID**：T003
- **Phase**：Phase 2：阶段摘要 user/system view
- **goal**：用失败测试固定摘要字段必须进入 user view。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"14b7f126371ac8a4d20c2a984bf7f24ee545ad8ee5b88e2df5b320d95a328d19","id":"SPEC"}]`
- **输入**：现有 confirmation_summary fixture
- **依赖**：T002
- **并行**：否 — RED 必须先于 GREEN
- **FR**：FR-005
- **AC**：AC-005、AC-016
- **动作**：增加完成内容、产物、范围、风险、deferred 和 next_stage_boundary 的失败断言。
- **精确文件**：`tests/stage-completion-facts.test.mjs`
- **boundary**：files: `tests/stage-completion-facts.test.mjs`; symbols/regions: user/system completion assertions only。
- **输出**：RED 输出，证明 user view 丢失阶段摘要。
- **Knowledge**：renderer 已有共同来源，缺少完整投影。
- **verification_role**：RED
- **paired_task**：T004
- **gate_cmd**：`npx vitest run tests/stage-completion-facts.test.mjs`
- **expected_exit**：1
- **oracle**：ORACLE-SUMMARY — 缺少任一用户交接字段时失败。
- **evidence_path**：apply/evidence/T003.stdout
- **STOP**：fixture 不合法时先修 fixture。
- **recovery**：只撤回 T003 测试字节。
- **task risk**：把内部运行信息当成用户摘要。
- **Workflow stage**：build-code
- **source_refs / decision_refs**：R4 → D5 → FR-005
- **execution_file_paths**：`tests/stage-completion-facts.test.mjs`。
- **test_strategy_owner**：build-plan/high-intelligence-model（回填设计；不是历史执行事实）
- **test tier / test method**：simple — focused contract/unit test；由 build-plan 设计，build-code 执行。
- **scenarios / commands / expected exit / oracle**：成功、失败和缺证据边界按本卡原有策略；`npx vitest run tests/stage-completion-facts.test.mjs`；1；ORACLE-SUMMARY — 缺少任一用户交接字段时失败。。
- **fixtures_services**：Node/Vitest 本地 fixtures；无 provider、无外部服务；若原卡另有环境限制，以原卡为准。
- **browser_route**：N/A — 本任务是 WorkflowHub runtime/材料合同，无业务 UI。
- **execution_contract**：build-code 只消费本卡已写入的命令/oracle/evidence 边界；不临场 route/blueprint/executor；缺策略写 MATERIAL_INCOMPLETE。
- **final current-snapshot aggregate strategy**：N/A — 当前快照最终聚合由 T027 的 verify-code replay 负责。
- **coverage limits**：本卡不等于原始需求语义验收；历史 receipt、provider review、用户 handoff 缺失或过期时保持 unknown/incomplete。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：增加用户阶段摘要的 RED 断言，要求完成内容、产物、范围、风险、延期和下一阶段边界进入 user view。
- **executed_commands**：`npx vitest run tests/stage-completion-facts.test.mjs`；初次 RED `exit_code=1`，新增 handoff summary 断言失败，证明 user view 缺字段。
- **evidence_refs**：`[{"ref":"quality/evidence/task-completion/verify-code/T003-577f878ed38cf83943dd4d56df13097c97f98f8f0dcf648dca8646823a2908b8.json","sha256":"577f878ed38cf83943dd4d56df13097c97f98f8f0dcf648dca8646823a2908b8","kind":"task_completion_current","snapshot_tree":"e4b968db05893d7e6a889e3e272e652c172a7cbb","source_digest":"ad59ad17dc213ba78a051a60db4d693d6a4b8e9a598c3ffde026b595e6551912"}]`
- **covered_ac**：`AC-005`、`AC-016`
- **review_fact**：等待 T004 GREEN 后统一记录 Phase 2 review 事实。
- **completed_at**：`2026-08-04T22:40+08:00`

#### T004 — 阶段摘要展示 GREEN

- **ID**：T004
- **Phase**：Phase 2：阶段摘要 user/system view
- **goal**：从 canonical facts 向用户展示完整大白话摘要。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"14b7f126371ac8a4d20c2a984bf7f24ee545ad8ee5b88e2df5b320d95a328d19","id":"SPEC"}]`
- **输入**：T003 RED、现有 confirmation_summary
- **依赖**：T003
- **并行**：否 — GREEN 依赖 RED
- **FR**：FR-005
- **AC**：AC-005、AC-016
- **动作**：扩展 summary schema 和 addCompletion/user renderer，投影完成内容、产物、风险、延期和下一阶段边界。
- **精确文件**：`runtime/evidence/stage-completion-facts.mjs`; `runtime/stage/stage-handlers.mjs`
- **boundary**：files: `runtime/evidence/stage-completion-facts.mjs`; `runtime/stage/stage-handlers.mjs`; symbols/regions: completion summary generation and user projection only。
- **输出**：一致的 system/user completion view。
- **Knowledge**：不新增 handoff ledger 或 formal gate。
- **verification_role**：GREEN
- **paired_task**：T003
- **gate_cmd**：`npx vitest run tests/stage-completion-facts.test.mjs`
- **expected_exit**：0
- **oracle**：ORACLE-SUMMARY — 同一 canonical facts 产生完整用户摘要，内部字段不泄露。
- **evidence_path**：apply/evidence/T004.stdout
- **STOP**：引入新状态机或内部 ref/hash 泄露时停止。
- **recovery**：只回滚 renderer/handler 当前修改。
- **task risk**：user/system view 字段漂移。
- **Workflow stage**：build-code
- **source_refs / decision_refs**：R4,R5 → D5,D6 → FR-005
- **execution_file_paths**：`runtime/evidence/stage-completion-facts.mjs`; `runtime/stage/stage-handlers.mjs`。
- **test_strategy_owner**：build-plan/high-intelligence-model（回填设计；不是历史执行事实）
- **test tier / test method**：feature — test-routing-advisor + testing-system-blueprint + applicable testing；由 build-plan 设计，build-code 执行。
- **scenarios / commands / expected exit / oracle**：成功、失败和缺证据边界按本卡原有策略；`npx vitest run tests/stage-completion-facts.test.mjs`；0；ORACLE-SUMMARY — 同一 canonical facts 产生完整用户摘要，内部字段不泄露。。
- **fixtures_services**：Node/Vitest 本地 fixtures；无 provider、无外部服务；若原卡另有环境限制，以原卡为准。
- **browser_route**：N/A — 本任务是 WorkflowHub runtime/材料合同，无业务 UI。
- **execution_contract**：build-code 只消费本卡已写入的命令/oracle/evidence 边界；不临场 route/blueprint/executor；缺策略写 MATERIAL_INCOMPLETE。
- **final current-snapshot aggregate strategy**：N/A — 当前快照最终聚合由 T027 的 verify-code replay 负责。
- **coverage limits**：本卡不等于原始需求语义验收；历史 receipt、provider review、用户 handoff 缺失或过期时保持 unknown/incomplete。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：扩展 canonical completion summary schema；user view 新增 plain-language `stage_summary`；system/user consistency 校验覆盖风险字段；stage handler 为实际阶段 completion 生成完成内容、范围、延期和下一阶段边界。
- **executed_commands**：`npx vitest run tests/stage-completion-facts.test.mjs`（GREEN `21/21`）；受审查 finding 影响后追加 `npx vitest run tests/stage-completion-facts.test.mjs tests/stage-interaction-contract.test.mjs`（`28/28`）。
- **evidence_refs**：`[{"ref":"quality/evidence/task-completion/verify-code/T004-482d1e043c69c74a046aafddf33f86ee3da00c520fe16675db6b6485147c0734.json","sha256":"482d1e043c69c74a046aafddf33f86ee3da00c520fe16675db6b6485147c0734","kind":"task_completion_current","snapshot_tree":"e4b968db05893d7e6a889e3e272e652c172a7cbb","source_digest":"ad59ad17dc213ba78a051a60db4d693d6a4b8e9a598c3ffde026b595e6551912"}]`
- **covered_ac**：`AC-005`、`AC-016`
- **review_fact**：一次 Phase 2 异源 review，`kimi/coding` 与 `cursor/grok` 完成，aggregate=`pass`；保留 1 个 `invalid_anchor` major 与 3 个 minor。处置：`F-072bc30ff4e3=fixed`（风险统一来自 confirmation_summary，并纳入漂移检查）；`F-d988a5c19667=fixed`（追加交互测试到 combined receipt）；`F-d2ba2e5340b3=rejected_invalid`（phase review map 在无可绑定 anchors 时保持 unknown，不能假造 complete）；`F-9de4664d7d21=rejected_invalid`（Phase review 在最终 build-code completion 前没有 canonical completion facts，已有测试 receipt，保持该事实边界）。原始 provider verdict 和分类没有改写。
- **completed_at**：`2026-08-04T22:46+08:00`

## Phase 3：质量事实、finding 和增量审查

### Goal

验证审查意见、协议失败、finding 处置和前三阶段增量规则不再变成 pass 门禁。

### Files

- **MODIFY**：`tests/contract/stage-completion.test.mjs`
- **MODIFY**：`tests/stage-risk-acceptance.test.mjs`
- **MODIFY**：`tests/stage-review-cost-policy.test.mjs`
- **MODIFY**：`skills/wh-review/scripts/__tests__/review-controller.test.mjs`
- **MODIFY**：`skills/wh-review/scripts/__tests__/simple-contracts.test.mjs`
- **MODIFY**：`skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs`
- **MODIFY**：`runtime/review/review-controller.mjs`
- **NEW**：`tests/review-material-hash-contract.test.mjs`

### Tasks

T005 then T006 then T013 then T014.

### Verify

`npx vitest run tests/contract/stage-completion.test.mjs tests/stage-risk-acceptance.test.mjs tests/stage-review-cost-policy.test.mjs skills/wh-review/scripts/__tests__/review-controller.test.mjs skills/wh-review/scripts/__tests__/simple-contracts.test.mjs skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs tests/review-material-hash-contract.test.mjs`；exit 0。

### Knowledge

当前 runtime 已有 review disposition 和增量 controller；本阶段补当前需求的回归覆盖，并把字符串材料的原始字节 hash 与任务 ReferenceBinding 统一。

### STOP

需要 pass gate、自动重试、provider 配置修改或新控制面时停止。

### Done

真实质量状态可回放，普通修复可继续，增量范围可解释；字符串材料不再产生 JSON 字符串 hash 漂移。

### Risks and rollback

不修改原始 verdict；只回滚回归断言。

#### T005 — 质量边界与 finding RED/事实固定

- **ID**：T005
- **Phase**：Phase 3：质量事实、finding 和增量审查
- **goal**：固定失败/unavailable/finding 不阻塞同 task、但不形成假完成。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"14b7f126371ac8a4d20c2a984bf7f24ee545ad8ee5b88e2df5b320d95a328d19","id":"SPEC"}]`
- **输入**：现有 completion、risk acceptance 和 review fixtures
- **依赖**：T004
- **并行**：否 — 按阶段顺序执行
- **FR**：FR-007、FR-009、FR-019
- **AC**：AC-008、AC-010、AC-022
- **动作**：补 quality status、progression、finding repair-or-risk 和 revise_required 不阻塞的回归断言。
- **精确文件**：`tests/contract/stage-completion.test.mjs`; `tests/stage-risk-acceptance.test.mjs`; `tests/stage-review-cost-policy.test.mjs`
- **boundary**：files: `tests/contract/stage-completion.test.mjs`; `tests/stage-risk-acceptance.test.mjs`; `tests/stage-review-cost-policy.test.mjs`; symbols/regions: quality/progression assertions only。
- **输出**：质量事实和普通推进分离的回归结果。
- **Knowledge**：复用 completion/publication/disposition 现有 owner。
- **verification_role**：N/A — 非行为变更：质量边界回归
- **paired_task**：N/A — 非行为变更：现有实现已提供边界
- **gate_cmd**：`npx vitest run tests/contract/stage-completion.test.mjs tests/stage-risk-acceptance.test.mjs tests/stage-review-cost-policy.test.mjs`
- **expected_exit**：0
- **oracle**：ORACLE-QUALITY — 命令退出码和输出是事实；通过时证明既有边界回归，失败时记录 incomplete/unknown 并回到对应 owner，不把 expected_exit=0 当作预先成立的实现事实。
- **evidence_path**：apply/evidence/T005.stdout
- **STOP**：若测试期望新增 gate，停止。
- **recovery**：只撤回回归断言。
- **task risk**：把质量建议误当流程许可证。
- **Workflow stage**：build-code
- **source_refs / decision_refs**：R5,R6,R7 → D6,D7 → FR-007/009/019
- **execution_file_paths**：`tests/contract/stage-completion.test.mjs`; `tests/stage-risk-acceptance.test.mjs`; `tests/stage-review-cost-policy.test.mjs`。
- **test_strategy_owner**：build-plan/high-intelligence-model（回填设计；不是历史执行事实）
- **test tier / test method**：simple — focused contract/unit test；由 build-plan 设计，build-code 执行。
- **scenarios / commands / expected exit / oracle**：成功、失败和缺证据边界按本卡原有策略；`npx vitest run tests/contract/stage-completion.test.mjs tests/stage-risk-acceptance.test.mjs tests/stage-review-cost-policy.test.mjs`；0；ORACLE-QUALITY — 命令退出码和输出是事实；通过时证明既有边界回归，失败时记录 incomplete/unknown 并回到对应 owner，不把 expected_exit=0 当作预先成立的实现事实。。
- **fixtures_services**：Node/Vitest 本地 fixtures；无 provider、无外部服务；若原卡另有环境限制，以原卡为准。
- **browser_route**：N/A — 本任务是 WorkflowHub runtime/材料合同，无业务 UI。
- **execution_contract**：build-code 只消费本卡已写入的命令/oracle/evidence 边界；不临场 route/blueprint/executor；缺策略写 MATERIAL_INCOMPLETE。
- **final current-snapshot aggregate strategy**：N/A — 当前快照最终聚合由 T027 的 verify-code replay 负责。
- **coverage limits**：本卡不等于原始需求语义验收；历史 receipt、provider review、用户 handoff 缺失或过期时保持 unknown/incomplete。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：`N/A — 复用现有质量边界；本任务只完成回归断言，没有新增 gate。`
- **executed_commands**：`npx vitest run tests/contract/stage-completion.test.mjs tests/stage-risk-acceptance.test.mjs tests/stage-review-cost-policy.test.mjs`；`exit_code=0`。
- **evidence_refs**：`[{"ref":"quality/evidence/task-completion/verify-code/T005-a0105e4724bb5a40ce11ad528382da3f0db0ecda7c99e0f9bc78bc8011778b18.json","sha256":"a0105e4724bb5a40ce11ad528382da3f0db0ecda7c99e0f9bc78bc8011778b18","kind":"task_completion_current","snapshot_tree":"e4b968db05893d7e6a889e3e272e652c172a7cbb","source_digest":"ad59ad17dc213ba78a051a60db4d693d6a4b8e9a598c3ffde026b595e6551912"}]`
- **covered_ac**：`AC-008`、`AC-010`、`AC-022`
- **review_fact**：一次 Phase 3 异源 review attempt `d7808d5a-aaa7-4c39-acc7-484a99884f2a`；`kimi/coding`、`cursor/grok` completed，aggregate=`pass`。保留 2 个 `invalid_anchor` major 和 2 个 minor；主代理已逐条记录处置，未因 verdict 追审。
- **completed_at**：`2026-08-04T23:01+08:00`

#### T006 — 审查协议、finding 和增量事实回归

- **ID**：T006
- **Phase**：Phase 3：质量事实、finding 和增量审查
- **goal**：回归 D15-D19 的公开协议、逐条 finding、非门禁和增量输入契约。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"14b7f126371ac8a4d20c2a984bf7f24ee545ad8ee5b88e2df5b320d95a328d19","id":"SPEC"}]`
- **输入**：T005、D15-D19、已合并 WorkflowHub review 修复
- **依赖**：T005
- **并行**：否 — 依赖质量边界事实
- **FR**：FR-015、FR-016、FR-018、FR-019、FR-020
- **AC**：AC-018、AC-019、AC-021、AC-023
- **动作**：验证 PUBLIC_RESULT_INVALID、PROTOCOL_INCOMPATIBLE、MATERIAL_INCOMPLETE、PROFILE_MISMATCH 四种错误分类；验证逐条 finding disposition 的最小字段（finding_id、原始事实/来源、后果、status、next_action、evidence_ref、owner、consumer、retain_or_delete）、caller 禁止 round/delta、delta 可读和无安全 delta 时一次 full fallback。
- **精确文件**：`skills/wh-review/scripts/__tests__/review-controller.test.mjs`; `skills/wh-review/scripts/__tests__/simple-contracts.test.mjs`; `skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs`
- **boundary**：files: `skills/wh-review/scripts/__tests__/review-controller.test.mjs`; `skills/wh-review/scripts/__tests__/simple-contracts.test.mjs`; `skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs`; symbols/regions: v2 review and incremental contract assertions only。
- **输出**：D15-D19 的真实 review quality facts。
- **Knowledge**：不改 wh-review/3rd-review 配置，不用测试绿替代真实 provider 调用。
- **verification_role**：N/A — 非行为变更：已合并修复的协议回归
- **paired_task**：N/A — 非行为变更：现有实现已合并
- **gate_cmd**：`npx vitest run skills/wh-review/scripts/__tests__/review-controller.test.mjs skills/wh-review/scripts/__tests__/simple-contracts.test.mjs skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs`
- **expected_exit**：0
- **oracle**：ORACLE-REVIEW — 四种协议错误均可诊断，finding 有逐条处置边界，pass 基线只产生 runner delta；hash 基准由 T013/T014 单独观察，不在本任务提前宣称。
- **evidence_path**：apply/evidence/T006.stdout
- **STOP**：若需要追求 provider 全部 pass，停止并保留原 verdict。
- **recovery**：只撤回回归断言。
- **task risk**：把 review 事实伪装成推进许可证。
- **Workflow stage**：build-code
- **source_refs / decision_refs**：R8,R9,R10 → D8,D9,D10 → FR-015/016/018/020
- **execution_file_paths**：`skills/wh-review/scripts/__tests__/review-controller.test.mjs`; `skills/wh-review/scripts/__tests__/simple-contracts.test.mjs`; `skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs`。
- **test_strategy_owner**：build-plan/high-intelligence-model（回填设计；不是历史执行事实）
- **test tier / test method**：feature — test-routing-advisor + testing-system-blueprint + applicable testing；由 build-plan 设计，build-code 执行。
- **scenarios / commands / expected exit / oracle**：成功、失败和缺证据边界按本卡原有策略；`npx vitest run skills/wh-review/scripts/__tests__/review-controller.test.mjs skills/wh-review/scripts/__tests__/simple-contracts.test.mjs skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs`；0；ORACLE-REVIEW — 四种协议错误均可诊断，finding 有逐条处置边界，pass 基线只产生 runner delta；hash 基准由 T013/T014 单独观察，不在本任务提前宣称。。
- **fixtures_services**：Node/Vitest 本地 fixtures；无 provider、无外部服务；若原卡另有环境限制，以原卡为准。
- **browser_route**：N/A — 本任务是 WorkflowHub runtime/材料合同，无业务 UI。
- **execution_contract**：build-code 只消费本卡已写入的命令/oracle/evidence 边界；不临场 route/blueprint/executor；缺策略写 MATERIAL_INCOMPLETE。
- **final current-snapshot aggregate strategy**：N/A — 当前快照最终聚合由 T027 的 verify-code replay 负责。
- **coverage limits**：本卡不等于原始需求语义验收；历史 receipt、provider review、用户 handoff 缺失或过期时保持 unknown/incomplete。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：`N/A — 复用已合并的 review 协议、finding disposition 和增量 controller；本任务只完成回归断言。`
- **executed_commands**：`npx vitest run skills/wh-review/scripts/__tests__/review-controller.test.mjs skills/wh-review/scripts/__tests__/simple-contracts.test.mjs skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs`；`exit_code=0`。
- **evidence_refs**：`[{"ref":"quality/evidence/task-completion/verify-code/T006-28e16327e26cc7a285fcd141058c3a5aece694d2489f92d8c34b61045873cd3f.json","sha256":"28e16327e26cc7a285fcd141058c3a5aece694d2489f92d8c34b61045873cd3f","kind":"task_completion_current","snapshot_tree":"e4b968db05893d7e6a889e3e272e652c172a7cbb","source_digest":"ad59ad17dc213ba78a051a60db4d693d6a4b8e9a598c3ffde026b595e6551912"}]`
- **covered_ac**：`AC-018`、`AC-019`、`AC-021`、`AC-023`
- **review_fact**：同一次 Phase 3 异源 review attempt `d7808d5a-aaa7-4c39-acc7-484a99884f2a`；真实 provider 结果和 `invalid_anchor`/minor 分类原样保留；没有把审查意见变成 pass gate。
- **completed_at**：`2026-08-04T23:01+08:00`

#### T013 — review material hash 基准 RED

- **ID**：T013
- **Phase**：Phase 3：质量事实、finding 和增量审查
- **goal**：用失败测试固定 review manifest 对字符串材料使用原始字节 hash，避免和 spec/task ReferenceBinding 产生双重 hash 身份。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"14b7f126371ac8a4d20c2a984bf7f24ee545ad8ee5b88e2df5b320d95a328d19","id":"SPEC"}]`
- **输入**：T006、D19、当前 review-controller 的 manifest 实现
- **依赖**：T006
- **并行**：否 — RED 必须先于 GREEN
- **FR**：FR-020
- **AC**：AC-023
- **动作**：新增字符串材料、Buffer 材料和结构化 map 的 hash 基准失败断言；字符串 hash 必须等于原始 UTF-8 内容 hash，结构化 map 仍使用稳定 canonical JSON。
- **精确文件**：`tests/review-material-hash-contract.test.mjs`。
- **boundary**：files: `tests/review-material-hash-contract.test.mjs`; symbols/regions: review material identity hash assertions only。
- **输出**：RED 输出，证明当前 manifest 对字符串使用了错误的 JSON 字符串 hash。
- **Knowledge**：本轮 build-plan 对照 spec ReferenceBinding 与 review manifest hash 基准时发现的缺口，不是新业务需求；修复归 FR-020/AC-023。
- **verification_role**：RED
- **paired_task**：T014
- **gate_cmd**：`npx vitest run tests/review-material-hash-contract.test.mjs`
- **expected_exit**：1
- **oracle**：ORACLE-MATERIAL-HASH — 字符串材料 hash 与原始 UTF-8 字节不一致时测试失败。
- **evidence_path**：apply/evidence/T013.stdout
- **STOP**：若需要新增第二套 manifest、selector 或 provider 配置，停止。
- **recovery**：只撤回 T013 测试字节。
- **task risk**：把审查材料身份 hash 和文件内容 hash 混为两套不可解释的事实。
- **Workflow stage**：build-code
- **source_refs / decision_refs**：R10 → D13,D14 → FR-020
- **execution_file_paths**：`tests/review-material-hash-contract.test.mjs`。
- **test_strategy_owner**：build-plan/high-intelligence-model（回填设计；不是历史执行事实）
- **test tier / test method**：simple — focused contract/unit test；由 build-plan 设计，build-code 执行。
- **scenarios / commands / expected exit / oracle**：成功、失败和缺证据边界按本卡原有策略；`npx vitest run tests/review-material-hash-contract.test.mjs`；1；ORACLE-MATERIAL-HASH — 字符串材料 hash 与原始 UTF-8 字节不一致时测试失败。。
- **fixtures_services**：Node/Vitest 本地 fixtures；无 provider、无外部服务；若原卡另有环境限制，以原卡为准。
- **browser_route**：N/A — 本任务是 WorkflowHub runtime/材料合同，无业务 UI。
- **execution_contract**：build-code 只消费本卡已写入的命令/oracle/evidence 边界；不临场 route/blueprint/executor；缺策略写 MATERIAL_INCOMPLETE。
- **final current-snapshot aggregate strategy**：N/A — 当前快照最终聚合由 T027 的 verify-code replay 负责。
- **coverage limits**：本卡不等于原始需求语义验收；历史 receipt、provider review、用户 handoff 缺失或过期时保持 unknown/incomplete。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：新增 `tests/review-material-hash-contract.test.mjs`，固定字符串/Buffer 原始字节 hash 和对象/数组稳定 canonical JSON。
- **executed_commands**：`npx vitest run tests/review-material-hash-contract.test.mjs`；RED `exit_code=1`（2 个断言失败），证明旧实现会给字符串/Buffer 计算 JSON 表示 hash；GREEN 由 T014 完成。
- **evidence_refs**：`[{"ref":"quality/evidence/task-completion/verify-code/T013-174b3980275be984fe4688108fe43bdea53534b2ee6970c54a648f2f0b283f0a.json","sha256":"174b3980275be984fe4688108fe43bdea53534b2ee6970c54a648f2f0b283f0a","kind":"task_completion_current","snapshot_tree":"e4b968db05893d7e6a889e3e272e652c172a7cbb","source_digest":"ad59ad17dc213ba78a051a60db4d693d6a4b8e9a598c3ffde026b595e6551912"}]`
- **covered_ac**：`AC-023`
- **review_fact**：同一次 Phase 3 异源 review；`F-9e9563e873f7= fixed`，补写 T013/T014 完成事实；原始 review verdict 不改写、不重复审查。
- **completed_at**：`2026-08-04T23:01+08:00`

#### T014 — review material hash 基准 GREEN

- **ID**：T014
- **Phase**：Phase 3：质量事实、finding 和增量审查
- **goal**：统一 review manifest 与当前 spec/task ReferenceBinding 的字符串材料 hash 基准。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"14b7f126371ac8a4d20c2a984bf7f24ee545ad8ee5b88e2df5b320d95a328d19","id":"SPEC"}]`
- **输入**：T013 RED、review-controller 现有 canonical JSON 规则
- **依赖**：T013
- **并行**：否 — GREEN 依赖 RED
- **FR**：FR-020
- **AC**：AC-023
- **动作**：字符串和 Buffer 材料直接按 UTF-8 字节计算 hash；对象/数组继续按稳定 canonical JSON 计算；保留 manifest 分类、delta 范围和历史质量事实语义。
- **精确文件**：`runtime/review/review-controller.mjs`
- **boundary**：files: `runtime/review/review-controller.mjs`; symbols/regions: buildClassificationManifest and runner delta material hash calculation only。
- **输出**：与当前 artifact bytes 一致的 review manifest/delta hash。
- **Knowledge**：不改 wh-review/3rd-review 配置，不改 provider 选择，不新增重试或控制面。
- **verification_role**：GREEN
- **paired_task**：T013
- **gate_cmd**：`npx vitest run tests/review-material-hash-contract.test.mjs`
- **expected_exit**：0
- **oracle**：ORACLE-MATERIAL-HASH — 字符串材料原始 UTF-8 hash、结构化材料 canonical hash 和 delta 变更范围同时正确。
- **evidence_path**：apply/evidence/T014.stdout
- **STOP**：若需要把 hash 变化改写成 pass、删除历史 manifest 或修改共享配置，停止。
- **recovery**：只回滚当前 hash 计算分支和对应测试。
- **task risk**：修复 hash 基准时破坏结构化 authority map 的稳定比较。
- **Workflow stage**：build-code
- **source_refs / decision_refs**：R10 → D13,D14 → FR-020
- **execution_file_paths**：`runtime/review/review-controller.mjs`。
- **test_strategy_owner**：build-plan/high-intelligence-model（回填设计；不是历史执行事实）
- **test tier / test method**：feature — test-routing-advisor + testing-system-blueprint + applicable backend/frontend testing；由 build-plan 设计，build-code 执行。
- **scenarios / commands / expected exit / oracle**：成功、失败和缺证据边界按本卡原有策略；`npx vitest run tests/review-material-hash-contract.test.mjs`；0；ORACLE-MATERIAL-HASH — 字符串材料原始 UTF-8 hash、结构化材料 canonical hash 和 delta 变更范围同时正确。。
- **fixtures_services**：Node/Vitest 本地 fixtures；无 provider、无外部服务；若原卡另有环境限制，以原卡为准。
- **browser_route**：N/A — 本任务是 WorkflowHub runtime/材料合同，无业务 UI。
- **execution_contract**：build-code 只消费本卡已写入的命令/oracle/evidence 边界；不临场 route/blueprint/executor；缺策略写 MATERIAL_INCOMPLETE。
- **final current-snapshot aggregate strategy**：N/A — 当前快照最终聚合由 T027 的 verify-code replay 负责。
- **coverage limits**：本卡不等于原始需求语义验收；历史 receipt、provider review、用户 handoff 缺失或过期时保持 unknown/incomplete。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：`runtime/review/review-controller.mjs` 新增 `materialBytes`：字符串/Buffer 按原始 UTF-8/原始字节 hash，结构化值继续按稳定 canonical JSON hash。
- **executed_commands**：`npx vitest run tests/review-material-hash-contract.test.mjs`；GREEN `exit_code=0`，`3/3` 通过；Phase 3 full gate `88/88`。
- **evidence_refs**：`[{"ref":"quality/evidence/task-completion/verify-code/T014-01790136c8eca3daeef61d90224ce835bf9054d38b21a93f08cb407aaa5ffeca.json","sha256":"01790136c8eca3daeef61d90224ce835bf9054d38b21a93f08cb407aaa5ffeca","kind":"task_completion_current","snapshot_tree":"e4b968db05893d7e6a889e3e272e652c172a7cbb","source_digest":"ad59ad17dc213ba78a051a60db4d693d6a4b8e9a598c3ffde026b595e6551912"}]`
- **covered_ac**：`AC-023`
- **review_fact**：同一次 Phase 3 异源 review；`F-9e9563e873f7= fixed`；`F-4e02455cb418= fixed` 的 completion summary 修复另行重跑受影响测试；不因修复再调用同 Phase provider。
- **completed_at**：`2026-08-04T23:01+08:00`

## Phase 4：decision-log 最低结构和 verify replay

### Goal

固定未来 decision-log 的精简索引结构，让 verify-code 先回放原始需求再绑定当前证据。

### Files

- **MODIFY**：`skills/decision-log/SKILL.md`
- **MODIFY**：`skills/decision-log/templates/decision-log-template.md`
- **MODIFY**：`workflows/verify-code/SKILL.md`
- **NEW**：`tests/decision-log-content-contract.test.mjs`
- **NEW**：`tests/verify-requirement-replay-contract.test.mjs`

### Tasks

T007 then T008.

### Verify

`npx vitest run tests/decision-log-content-contract.test.mjs tests/verify-requirement-replay-contract.test.mjs && npx --no-install markdownlint-cli2 skills/decision-log/SKILL.md skills/decision-log/templates/decision-log-template.md workflows/verify-code/SKILL.md`；exit 0。

### Knowledge

现有 requirement-lineage 可复用，不复制第二份需求 ledger。

### STOP

需要把 decision-log 扩成 spec 副本或缺证据自动 pass 时停止。

### Done

最低字段缺失会失败，verify 输出逐项真实状态。

### Risks and rollback

只回滚技能、模板和内容契约。

#### T007 — decision-log 最低结构规则

- **ID**：T007
- **Phase**：Phase 4：decision-log 最低结构和 verify replay
- **goal**：固定原始需求、来源、Talk/Grill、D* 推理、边界、风险、延期和交接状态的精简索引。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"14b7f126371ac8a4d20c2a984bf7f24ee545ad8ee5b88e2df5b320d95a328d19","id":"SPEC"}]`
- **输入**：D1-D14、当前 decision-log 和现有模板
- **依赖**：T014
- **并行**：否 — 先固定来源记录规则
- **FR**：FR-002、FR-006、FR-013
- **AC**：AC-003、AC-006、AC-013、AC-015、AC-017
- **动作**：补最低字段和内容契约测试；保持按需求点/决策点记录，不复制 spec 细节。
- **精确文件**：`skills/decision-log/SKILL.md`; `skills/decision-log/templates/decision-log-template.md`; `tests/decision-log-content-contract.test.mjs`
- **boundary**：files: `skills/decision-log/SKILL.md`; `skills/decision-log/templates/decision-log-template.md`; `tests/decision-log-content-contract.test.mjs`; symbols/regions: decision-log minimum structure only。
- **输出**：跨项目可复用的精简 decision-log 规则。
- **Knowledge**：D11 已锁定来源/推理/批准/supersedes 字段。
- **verification_role**：N/A — 非行为变更：技能模板和内容契约
- **paired_task**：N/A — 非行为变更：无运行时行为
- **gate_cmd**：`npx vitest run tests/decision-log-content-contract.test.mjs && npx --no-install markdownlint-cli2 skills/decision-log/SKILL.md skills/decision-log/templates/decision-log-template.md`
- **expected_exit**：0
- **oracle**：ORACLE-DECISION-LOG — 删除 D11 最低字段会使内容测试失败。
- **evidence_path**：apply/evidence/T007.stdout
- **STOP**：若字段要求复制页面/接口/任务，停止。
- **recovery**：只撤回技能、模板和测试文字。
- **task risk**：最低结构膨胀成 spec 副本。
- **Workflow stage**：build-code
- **source_refs / decision_refs**：R11,R12,R13 → D1,D2,D3,D4,D5 → FR-002/006/013
- **execution_file_paths**：`skills/decision-log/SKILL.md`; `skills/decision-log/templates/decision-log-template.md`; `tests/decision-log-content-contract.test.mjs`。
- **test_strategy_owner**：build-plan/high-intelligence-model（回填设计；不是历史执行事实）
- **test tier / test method**：simple — focused contract/unit test；由 build-plan 设计，build-code 执行。
- **scenarios / commands / expected exit / oracle**：成功、失败和缺证据边界按本卡原有策略；`npx vitest run tests/decision-log-content-contract.test.mjs && npx --no-install markdownlint-cli2 skills/decision-log/SKILL.md skills/decision-log/templates/decision-log-template.md`；0；ORACLE-DECISION-LOG — 删除 D11 最低字段会使内容测试失败。。
- **fixtures_services**：Node/Vitest 本地 fixtures；无 provider、无外部服务；若原卡另有环境限制，以原卡为准。
- **browser_route**：N/A — 本任务是 WorkflowHub runtime/材料合同，无业务 UI。
- **execution_contract**：build-code 只消费本卡已写入的命令/oracle/evidence 边界；不临场 route/blueprint/executor；缺策略写 MATERIAL_INCOMPLETE。
- **final current-snapshot aggregate strategy**：N/A — 当前快照最终聚合由 T027 的 verify-code replay 负责。
- **coverage limits**：本卡不等于原始需求语义验收；历史 receipt、provider review、用户 handoff 缺失或过期时保持 unknown/incomplete。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：补充 decision-log skill/template 的精简最低结构：原始需求、调研、Talk、Grill、D* 推理、边界、finding 处置、风险/延期、质量边界和 Exit checks；明确不复制 spec，并在审查后补齐 Talk 队列、当前日志实例覆盖和质量边界索引。
- **executed_commands**：`npx vitest run tests/decision-log-content-contract.test.mjs`；RED `exit_code=1`，GREEN `exit_code=0`；Phase 4 full gate 中该测试通过。
- **evidence_refs**：`[{"ref":"quality/evidence/task-completion/verify-code/T007-cd33818c85d20e35fc68012d6560350792ba5e0ef767a73d776e307a1a527fa0.json","sha256":"cd33818c85d20e35fc68012d6560350792ba5e0ef767a73d776e307a1a527fa0","kind":"task_completion_current","snapshot_tree":"e4b968db05893d7e6a889e3e272e652c172a7cbb","source_digest":"ad59ad17dc213ba78a051a60db4d693d6a4b8e9a598c3ffde026b595e6551912"}]`
- **covered_ac**：`AC-003`、`AC-006`、`AC-013`、`AC-015`、`AC-017`
- **review_fact**：Phase 4 一次异源 review attempt `38f60b2b-1f2f-48bb-908b-600b8a8f253d`，`kimi/coding`、`cursor/grok` completed，aggregate=`pass`；处置：`F-0f02b5c57b14=fixed`（V12 版本头）；`F-5039d613b859=fixed`（最小结构 prose）；`F-7bc3dbf6aad8=fixed`（Talk 队列和质量边界）；`F-64657d4c6fdb=fixed`（当前 decision-log 实例断言）；`F-b67e3de23d1e=fixed`（配置逻辑路径）；`F-51dc3072dcf1=fixed`（R3 receipt 绑定）；`F-ed9dd7e11678=fixed`（D20 绑定 FR-019/AC-022，非新增范围）；`F-442c0660edde=fixed`（追加 combined regression receipt）；`F-d5c7e8936d08=rejected_invalid`（unknown map 是无安全 anchor 时的诚实阶段事实）；`F-84fe1816f1e0=rejected_invalid`（Phase 5/6 pending 是当前计划边界，不是 Phase 4 缺陷）。原始 verdict 和 invalid_anchor 分类不改写，不重复审查同一 Phase。
- **completed_at**：`2026-08-04T23:04+08:00`

#### T008 — verify 原始需求回放规则

- **ID**：T008
- **Phase**：Phase 4：decision-log 最低结构和 verify replay
- **goal**：让 verify-code 对 R1-R18、报告需求点和 INC-001~015 逐项输出真实状态。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"14b7f126371ac8a4d20c2a984bf7f24ee545ad8ee5b88e2df5b320d95a328d19","id":"SPEC"}]`
- **输入**：T007、FR-008、requirement-lineage
- **依赖**：T007
- **并行**：否 — replay 规则依赖日志字段
- **FR**：FR-008、FR-012、FR-014、FR-017
- **AC**：AC-003、AC-007、AC-013、AC-014、AC-016、AC-020
- **动作**：规定先读原始 R/F/D 和事故，再映射 FR/AC/task/证据；每项输出 pass/fail/unknown/deferred/unavailable，并绑定当前 snapshot/provenance。
- **精确文件**：`workflows/verify-code/SKILL.md`; `tests/verify-requirement-replay-contract.test.mjs`
- **boundary**：files: `workflows/verify-code/SKILL.md`; `tests/verify-requirement-replay-contract.test.mjs`; symbols/regions: original requirement replay and evidence binding rules only。
- **输出**：可执行的原始需求回放规则。
- **Knowledge**：R3 research receipt `quality/tests/research.json` 的 sha256 必须为 `422f4044bfc68952c8ca917057e6930e51f7825943b49a0727e1b2936457ffe0`；缺失或错配必须保持 unknown/incomplete。
- **verification_role**：N/A — 非行为变更：流程技能与内容契约
- **paired_task**：N/A — 非行为变更：无运行时行为
- **gate_cmd**：`npx vitest run tests/verify-requirement-replay-contract.test.mjs && npx --no-install markdownlint-cli2 workflows/verify-code/SKILL.md`
- **expected_exit**：0
- **oracle**：ORACLE-VERIFY-REPLAY — 删除逐项 replay 或状态语义时测试失败。
- **evidence_path**：apply/evidence/T008.stdout
- **STOP**：若需要第二份永久原始需求 ledger，停止。
- **recovery**：只撤回 verify skill 和测试规则。
- **task risk**：verify 又退化成只看 spec AC。
- **Workflow stage**：build-code
- **source_refs / decision_refs**：R11,R14,R15 → D2,D4,D8 → FR-008/012/014/017
- **execution_file_paths**：`workflows/verify-code/SKILL.md`; `tests/verify-requirement-replay-contract.test.mjs`。
- **test_strategy_owner**：build-plan/high-intelligence-model（回填设计；不是历史执行事实）
- **test tier / test method**：simple — focused contract/unit test；由 build-plan 设计，build-code 执行。
- **scenarios / commands / expected exit / oracle**：成功、失败和缺证据边界按本卡原有策略；`npx vitest run tests/verify-requirement-replay-contract.test.mjs && npx --no-install markdownlint-cli2 workflows/verify-code/SKILL.md`；0；ORACLE-VERIFY-REPLAY — 删除逐项 replay 或状态语义时测试失败。。
- **fixtures_services**：Node/Vitest 本地 fixtures；无 provider、无外部服务；若原卡另有环境限制，以原卡为准。
- **browser_route**：N/A — 本任务是 WorkflowHub runtime/材料合同，无业务 UI。
- **execution_contract**：build-code 只消费本卡已写入的命令/oracle/evidence 边界；不临场 route/blueprint/executor；缺策略写 MATERIAL_INCOMPLETE。
- **final current-snapshot aggregate strategy**：N/A — 当前快照最终聚合由 T027 的 verify-code replay 负责。
- **coverage limits**：本卡不等于原始需求语义验收；历史 receipt、provider review、用户 handoff 缺失或过期时保持 unknown/incomplete。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：补充 verify-code 的原始需求回放规则：先回放 R/F/D、报告需求点和事故，再绑定 Design、FR/AC、plan/task、证据、snapshot/provenance、完整用户流程和逐项状态；绑定 R3 research receipt；缺证据只能是 unknown/deferred/unavailable。
- **executed_commands**：`npx vitest run tests/verify-requirement-replay-contract.test.mjs`；RED `exit_code=1`，GREEN `exit_code=0`；Phase 4 full gate 中该测试通过。
- **evidence_refs**：`[{"ref":"quality/evidence/task-completion/verify-code/T008-51f61d6f01119b01999eacc98590cbe7eb1d2b05f7afa4592a9ce73748a48177.json","sha256":"51f61d6f01119b01999eacc98590cbe7eb1d2b05f7afa4592a9ce73748a48177","kind":"task_completion_current","snapshot_tree":"e4b968db05893d7e6a889e3e272e652c172a7cbb","source_digest":"ad59ad17dc213ba78a051a60db4d693d6a4b8e9a598c3ffde026b595e6551912"}]`
- **covered_ac**：`AC-003`、`AC-007`、`AC-013`、`AC-014`、`AC-016`、`AC-020`
- **review_fact**：同一次 Phase 4 异源 review attempt `38f60b2b-1f2f-48bb-908b-600b8a8f253d`；`F-51dc3072dcf1=fixed`（R3 receipt/path/hash 和 mismatch unknown 规则）；其余 finding 的逐条处置见 T007 completion area 和 decision-log，原始 provider verdict/finding 分类保持不变。
- **completed_at**：`2026-08-04T23:04+08:00`

## Phase 5：未来材料读取和 fail-loud

### Goal

只把 ENOENT 解释成未来材料缺失，其他读取错误明确失败。

### Files

- **MODIFY**：`tests/e2e/vnext-five-stage-current.test.mjs`
- **MODIFY**：`runtime/stage/stage-runner.mjs`
- **MODIFY**：`tools/cli/stage-runtime.mjs`

### Tasks

T009 then T010.

### Verify

`npx vitest run tests/e2e/vnext-five-stage-current.test.mjs`；T009 exit 1，T010 exit 0。

### Knowledge

make-decision 只有 decision-log 时仍应运行；非 ENOENT 错误不能被宽泛 catch 吞掉。

### STOP

需要 provider 配置、自动重试、legacy close 或预创建未来文件时停止。

### Done

ENOENT=missing，其他错误 fail-loud，未来文件不被创建。

### Risks and rollback

只回滚材料读取入口和对应回归测试。

#### T009 — 非 ENOENT 读取 fail-loud RED

- **ID**：T009
- **Phase**：Phase 5：未来材料读取和 fail-loud
- **goal**：用失败测试固定 EACCES/EIO 不能被转成 missing。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"14b7f126371ac8a4d20c2a984bf7f24ee545ad8ee5b88e2df5b320d95a328d19","id":"SPEC"}]`
- **输入**：stage-runner/status 错误注入 fixture
- **依赖**：T008
- **并行**：否 — RED 必须先于 GREEN
- **FR**：FR-001、FR-010
- **AC**：AC-001、AC-002
- **动作**：增加非 ENOENT 必须失败、ENOENT 仍 missing、未来文件不创建的断言。
- **精确文件**：`tests/e2e/vnext-five-stage-current.test.mjs`
- **boundary**：files: `tests/e2e/vnext-five-stage-current.test.mjs`; symbols/regions: future-material read error assertions only。
- **输出**：RED 输出，证明宽泛 catch 的错误语义缺口。
- **Knowledge**：TaskKernel 的精确 ENOENT 语义是参照。
- **verification_role**：RED
- **paired_task**：T010
- **gate_cmd**：`npx vitest run tests/e2e/vnext-five-stage-current.test.mjs`
- **expected_exit**：1
- **oracle**：ORACLE-MATERIAL-ERROR — 非 ENOENT 被隐藏时失败。
- **evidence_path**：apply/evidence/T009.stdout
- **STOP**：错误注入失败先修夹具，不进入 GREEN。
- **recovery**：只撤回 T009 测试字节。
- **task risk**：误伤合法 future-material 缺失。
- **Workflow stage**：build-code
- **source_refs / decision_refs**：R16 → D20,D21 → FR-001/010
- **execution_file_paths**：`tests/e2e/vnext-five-stage-current.test.mjs`。
- **test_strategy_owner**：build-plan/high-intelligence-model（回填设计；不是历史执行事实）
- **test tier / test method**：fullstack — fullstack-slice-testing + targeted contract；由 build-plan 设计，build-code 执行。
- **scenarios / commands / expected exit / oracle**：成功、失败和缺证据边界按本卡原有策略；`npx vitest run tests/e2e/vnext-five-stage-current.test.mjs`；1；ORACLE-MATERIAL-ERROR — 非 ENOENT 被隐藏时失败。。
- **fixtures_services**：Node/Vitest 本地 fixtures；无 provider、无外部服务；若原卡另有环境限制，以原卡为准。
- **browser_route**：N/A — 本任务是 WorkflowHub runtime/材料合同，无业务 UI。
- **execution_contract**：build-code 只消费本卡已写入的命令/oracle/evidence 边界；不临场 route/blueprint/executor；缺策略写 MATERIAL_INCOMPLETE。
- **final current-snapshot aggregate strategy**：N/A — 当前快照最终聚合由 T027 的 verify-code replay 负责。
- **coverage limits**：本卡不等于原始需求语义验收；历史 receipt、provider review、用户 handoff 缺失或过期时保持 unknown/incomplete。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：增加 EACCES 非 ENOENT 错误注入断言；同时验证只有 decision-log 时 confirm 成功且 spec/plan/tasks 不被创建。
- **executed_commands**：`npx vitest run tests/e2e/vnext-five-stage-current.test.mjs -t 'fails loudly on non-ENOENT'`；RED `exit_code=1`（旧宽泛 catch 吞掉 EACCES），GREEN `exit_code=0`（修复后）。
- **evidence_refs**：`[{"ref":"quality/evidence/task-completion/verify-code/T009-e4ef338106fef9d21719bc7eed93afae0debfa355666643169e24b7ac78136f8.json","sha256":"e4ef338106fef9d21719bc7eed93afae0debfa355666643169e24b7ac78136f8","kind":"task_completion_current","snapshot_tree":"e4b968db05893d7e6a889e3e272e652c172a7cbb","source_digest":"ad59ad17dc213ba78a051a60db4d693d6a4b8e9a598c3ffde026b595e6551912"}]`
- **covered_ac**：`AC-001`、`AC-002`
- **review_fact**：Phase 5 统一一次异源 review，attempt=`3c6c01e7-54f0-41e5-8f82-ec1c254fc0d8`，result=`quality/reviews/results/build-code-default-33341edadca1ae46d46936e98b71e6e5d2acfb13-3c6c01e7-54f0-41e5-8f82-ec1c254fc0d8.json`，report=`quality/reviews/reports/3c6c01e7-54f0-41e5-8f82-ec1c254fc0d8.md`；`kimi/coding`、`cursor/grok` completed，aggregate=`pass`。原始 finding 在 T010 completion area 统一处置；不因 finding 重复审查 Phase 5。
- **completed_at**：`2026-08-04T23:33+08:00`

#### T010 — 非 ENOENT 读取 fail-loud GREEN

- **ID**：T010
- **Phase**：Phase 5：未来材料读取和 fail-loud
- **goal**：收窄两个公共读取入口的错误处理。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"14b7f126371ac8a4d20c2a984bf7f24ee545ad8ee5b88e2df5b320d95a328d19","id":"SPEC"}]`
- **输入**：T009 RED 和当前 ENOENT 处理模式
- **依赖**：T009
- **并行**：否 — GREEN 依赖 RED
- **FR**：FR-001、FR-010
- **AC**：AC-001、AC-002
- **动作**：只允许 ENOENT 转 missing，其他错误原样抛出或返回失败结果。
- **精确文件**：`runtime/stage/stage-runner.mjs`; `tools/cli/stage-runtime.mjs`
- **boundary**：files: `runtime/stage/stage-runner.mjs`; `tools/cli/stage-runtime.mjs`; symbols/regions: current-material read error handling only。
- **输出**：非 ENOENT fail-loud 的公共入口。
- **Knowledge**：不得改变 provider timeout、CAS/latest 或 public command 边界。
- **verification_role**：GREEN
- **paired_task**：T009
- **gate_cmd**：`npx vitest run tests/e2e/vnext-five-stage-current.test.mjs`
- **expected_exit**：0
- **oracle**：ORACLE-MATERIAL-ERROR — 非 ENOENT 可见且失败，ENOENT 仍 missing。
- **evidence_path**：apply/evidence/T010.stdout
- **STOP**：需要 provider 配置或错误恢复策略时停止。
- **recovery**：只回滚两个读取入口当前修改。
- **task risk**：错误收窄影响合法未来材料语义。
- **Workflow stage**：build-code
- **source_refs / decision_refs**：R16 → D20,D21 → FR-001/010
- **execution_file_paths**：`runtime/stage/stage-runner.mjs`; `tools/cli/stage-runtime.mjs`。
- **test_strategy_owner**：build-plan/high-intelligence-model（回填设计；不是历史执行事实）
- **test tier / test method**：feature — test-routing-advisor + testing-system-blueprint + applicable testing；由 build-plan 设计，build-code 执行。
- **scenarios / commands / expected exit / oracle**：成功、失败和缺证据边界按本卡原有策略；`npx vitest run tests/e2e/vnext-five-stage-current.test.mjs`；0；ORACLE-MATERIAL-ERROR — 非 ENOENT 可见且失败，ENOENT 仍 missing。。
- **fixtures_services**：Node/Vitest 本地 fixtures；无 provider、无外部服务；若原卡另有环境限制，以原卡为准。
- **browser_route**：N/A — 本任务是 WorkflowHub runtime/材料合同，无业务 UI。
- **execution_contract**：build-code 只消费本卡已写入的命令/oracle/evidence 边界；不临场 route/blueprint/executor；缺策略写 MATERIAL_INCOMPLETE。
- **final current-snapshot aggregate strategy**：N/A — 当前快照最终聚合由 T027 的 verify-code replay 负责。
- **coverage limits**：本卡不等于原始需求语义验收；历史 receipt、provider review、用户 handoff 缺失或过期时保持 unknown/incomplete。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：`runtime/stage/stage-runner.mjs` 和 `tools/cli/stage-runtime.mjs` 只将 `ENOENT` 转为未来材料 missing；其他读取错误原样抛出，未预创建未来文件、未改 provider 配置和 public command 边界。
- **executed_commands**：`npx vitest run tests/e2e/vnext-five-stage-current.test.mjs`；GREEN `exit_code=0`，`13/13` 通过。
- **evidence_refs**：`[{"ref":"quality/evidence/task-completion/verify-code/T010-7a5e14ec00c3d4ce0b3894b6eea31f34b31052e0da3857f0ed6fcc98932535fd.json","sha256":"7a5e14ec00c3d4ce0b3894b6eea31f34b31052e0da3857f0ed6fcc98932535fd","kind":"task_completion_current","snapshot_tree":"e4b968db05893d7e6a889e3e272e652c172a7cbb","source_digest":"ad59ad17dc213ba78a051a60db4d693d6a4b8e9a598c3ffde026b595e6551912"}]`
- **covered_ac**：`AC-001`、`AC-002`
- **review_fact**：一次 Phase 5 异源 review，`kimi/coding`、`cursor/grok` 均 completed，aggregate=`pass`；原始 finding 逐条处置：`F-e947806e0b90=fixed`，因为 T009/T010 completion area 已补齐真实状态、命令、receipt、AC、review 和时间；`F-2b6f902c6cc0=accepted_risk`，四张 Phase authority map 的 `unknown` 是本阶段只验证材料读取语义、没有安全业务 anchor 时的诚实事实，不伪造 `complete`，next_action 是在 Phase 6 integration/verify 的当前快照 AC trace 中提供可验证锚点；该 minor 不阻断同任务推进。原始 result/report 和 provider verdict 保留；不重复调用 Phase 5 provider。
- **completed_at**：`2026-08-04T23:34+08:00`

## Phase 6：CAS、公共边界和最终回归

### Goal

回归 revision/latest、五阶段公共边界、host independence、plan-task contract 和配置不变事实。

### Files

- **MODIFY**：`tests/integration/vnext-official-stage-run.test.mjs`
- **MODIFY**：`tests/stage-content-host-independence.test.mjs`
- **MODIFY**：`tests/stage-plan-task-contract-v3.test.mjs`
- **MODIFY**：`runtime/task/task-handle.mjs`
- **MODIFY**：`runtime/evidence/canonical-receipt-writer.mjs`
- **MODIFY**：`runtime/evidence/canonical-evidence-validators.mjs`
- **MODIFY**：`runtime/stage/stage-handlers.mjs`
- **MODIFY**：`runtime/stage/stage-runner.mjs`
- **MODIFY**：`runtime/review/stage-review-disposition.mjs`
- **MODIFY**：`skills/wh-review/scripts/review-materials.mjs`
- **MODIFY**：`runtime/task/git-worktree-snapshot.mjs`
- **MODIFY**：`tests/official-component-receipts.test.mjs`
- **MODIFY**：`tests/contract/review-materials-contract.test.mjs`
- **MODIFY**：`tests/stage-risk-acceptance.test.mjs`
- **MODIFY**：`tests/final-cutover-guards.red.test.mjs`
- **MODIFY**：`tests/integration/vnext-official-stage-run.test.mjs`

### Tasks

T011 then T012 then T015 then T016.

### Verify

`npx vitest run tests/integration/vnext-official-stage-run.test.mjs tests/stage-content-host-independence.test.mjs tests/stage-plan-task-contract-v3.test.mjs && npm run check`；exit 0。

### Knowledge

复用现有 CAS/latest、公共 runtime 和 plan-task validator owner。

### STOP

revision/latest 不一致、旧历史支撑当前完成、coverage 缺失或 host identity 泄露时停止交付。

### Done

plan/tasks contract、CAS/latest、公共边界和配置不变均有本地证据；不把它们写成 formal close。

### Risks and rollback

只修当前 task 的实现/测试，保留失败证据。

#### T011 — CAS/latest 和 plan-task contract 回归

- **ID**：T011
- **Phase**：Phase 6：CAS、公共边界和最终回归
- **goal**：验证 revision/latest 原子收口及 plan-task.v3 的 coverage/DAG/command contract。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"14b7f126371ac8a4d20c2a984bf7f24ee545ad8ee5b88e2df5b320d95a328d19","id":"SPEC"}]`
- **输入**：T010、现有 official stage 和 plan-task fixtures
- **依赖**：T010
- **并行**：否 — 最终回归前的 contract 事实
- **FR**：FR-011、FR-012
- **AC**：AC-009、AC-012、AC-014
- **动作**：补当前 task 对 revision/latest CAS、旧事实 freshness、DAG、FR/AC 双向 coverage 的回归断言。
- **精确文件**：`tests/integration/vnext-official-stage-run.test.mjs`; `tests/stage-plan-task-contract-v3.test.mjs`
- **boundary**：files: `tests/integration/vnext-official-stage-run.test.mjs`; `tests/stage-plan-task-contract-v3.test.mjs`; symbols/regions: CAS/latest and plan-task contract assertions only。
- **输出**：CAS/latest 和 plan/tasks 结构证据。
- **Knowledge**：不恢复旧 accepted projection、replacement API 或新 control plane。
- **verification_role**：N/A — 非行为变更：既有 owner 的回归覆盖
- **paired_task**：N/A — 非行为变更：现有实现已提供边界
- **gate_cmd**：`npx vitest run tests/integration/vnext-official-stage-run.test.mjs tests/stage-plan-task-contract-v3.test.mjs`
- **expected_exit**：0
- **oracle**：ORACLE-CAS-PLAN — 命令结果决定 latest/plan-task 事实；通过才记录对应覆盖，失败保留真实错误并回到既有 owner，不默认宣称 CAS 或 contract 已满足。
- **evidence_path**：apply/evidence/T011.stdout
- **STOP**：发现静默半成品或历史冒充当前时停止。
- **recovery**：只撤回回归断言。
- **task risk**：把结构回归绿误当业务完成。
- **Workflow stage**：build-code
- **source_refs / decision_refs**：R17 → D22,D23 → FR-011/012
- **execution_file_paths**：`tests/integration/vnext-official-stage-run.test.mjs`; `tests/stage-plan-task-contract-v3.test.mjs`。
- **test_strategy_owner**：build-plan/high-intelligence-model（回填设计；不是历史执行事实）
- **test tier / test method**：fullstack — fullstack-slice-testing + targeted contract；由 build-plan 设计，build-code 执行。
- **scenarios / commands / expected exit / oracle**：成功、失败和缺证据边界按本卡原有策略；`npx vitest run tests/integration/vnext-official-stage-run.test.mjs tests/stage-plan-task-contract-v3.test.mjs`；0；ORACLE-CAS-PLAN — 命令结果决定 latest/plan-task 事实；通过才记录对应覆盖，失败保留真实错误并回到既有 owner，不默认宣称 CAS 或 contract 已满足。。
- **fixtures_services**：Node/Vitest 本地 fixtures；无 provider、无外部服务；若原卡另有环境限制，以原卡为准。
- **browser_route**：N/A — 本任务是 WorkflowHub runtime/材料合同，无业务 UI。
- **execution_contract**：build-code 只消费本卡已写入的命令/oracle/evidence 边界；不临场 route/blueprint/executor；缺策略写 MATERIAL_INCOMPLETE。
- **final current-snapshot aggregate strategy**：N/A — 当前快照最终聚合由 T027 的 verify-code replay 负责。
- **coverage limits**：本卡不等于原始需求语义验收；历史 receipt、provider review、用户 handoff 缺失或过期时保持 unknown/incomplete。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：未改 CAS/latest 或 plan-task owner；复用了现有 integration/runtime 与 plan-task.v3 回归，确认 revision/latest、DAG、FR/AC coverage 和公共 stage 事实保持有效。
- **executed_commands**：`npx vitest run tests/integration/vnext-official-stage-run.test.mjs tests/stage-plan-task-contract-v3.test.mjs`；`27/27` 通过，`exit_code=0`。
- **evidence_refs**：`[{"ref":"quality/evidence/task-completion/verify-code/T011-27db58ee1edebbfa3191f3a418fde09c5bf9427302a0586eb5c4f15ccacbf14b.json","sha256":"27db58ee1edebbfa3191f3a418fde09c5bf9427302a0586eb5c4f15ccacbf14b","kind":"task_completion_current","snapshot_tree":"e4b968db05893d7e6a889e3e272e652c172a7cbb","source_digest":"ad59ad17dc213ba78a051a60db4d693d6a4b8e9a598c3ffde026b595e6551912"}]`
- **covered_ac**：`AC-009`、`AC-012`、`AC-014`
- **review_fact**：`{"ref":"quality/reviews/results/build-code-default-95b1bd26d335e083c3ef9d387209665a86484cfd-23831fc0-2578-423d-a2f2-bd079ffc880e.json","sha256":"b5f34d06122408295c225e2fd9b807f5cc7fbed39341904acb49afcc91240380"}`；Phase 6 一次异源 review，原始 aggregate=`pass`，但保留 provider 的 `revise_required`、6 个 `invalid_anchor` 和 2 个 minor 事实；逐条处置在 T012 completion area 记录，不把 verdict 变成推进 gate。
- **completed_at**：`2026-08-04T23:44+08:00`

#### T012 — 五阶段和 Constitution 最终回归

- **ID**：T012
- **Phase**：Phase 6：CAS、公共边界和最终回归
- **goal**：确认当前实现覆盖 V13 FR/AC，且不改共享 provider 配置或宿主身份边界。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"14b7f126371ac8a4d20c2a984bf7f24ee545ad8ee5b88e2df5b320d95a328d19","id":"SPEC"}]`
- **输入**：T011、V13 spec、Constitution binding
- **依赖**：T011
- **并行**：否 — 最终回归
- **FR**：FR-009、FR-012、FR-014、FR-018、FR-019、FR-020
- **AC**：AC-009、AC-010、AC-011、AC-014、AC-016、AC-018、AC-021、AC-022、AC-023
- **动作**：运行最终回归、host independence、plan-task contract、review material hash contract、四种协议错误分类、skill bundle/catalog closure 和 Constitution 对照；对共享 provider 配置只记录 launcher 提供的 pre/post 路径与 hash，路径缺失或发生变化保持 unknown/incomplete，不把它变成隐式交付 gate。
- **精确文件**：`tests/stage-content-host-independence.test.mjs`
- **boundary**：files: `tests/stage-content-host-independence.test.mjs`; symbols/regions: final regression assertions only。
- **输出**：当前 WorkflowHub 最小闭环的本地回归证据和配置不变事实。
- **Knowledge**：provider 可用性和 formal close 另行记录，不由本地 check 伪造。
- **verification_role**：N/A — 非行为变更：最终回归和治理对照
- **paired_task**：N/A — 非行为变更：现有实现已提供边界
- **gate_cmd**：`npx vitest run tests/integration/vnext-official-stage-run.test.mjs tests/stage-content-host-independence.test.mjs tests/stage-plan-task-contract-v3.test.mjs tests/review-material-hash-contract.test.mjs tests/contract/integration-review-subject.test.mjs && npm run check:skill-closure && npm run check`
- **expected_exit**：0
- **oracle**：ORACLE-FINAL — 回归通过、host independence 无问题、skill bundle/catalog hash 校验通过、PUBLIC_RESULT_INVALID/PROTOCOL_INCOMPATIBLE/MATERIAL_INCOMPLETE/PROFILE_MISMATCH 四种分类均可见；共享配置 pre/post 证据如实记录，缺失质量事实仍保持 incomplete/unknown。
- **evidence_path**：apply/evidence/T012.stdout
- **STOP**：若需要改 provider 配置、自动重试、旧 close 或新增 gate，停止。
- **recovery**：只回滚当前最终回归变更。
- **task risk**：将本地回归或 Git 交付误写成 formal close。
- **Workflow stage**：build-code
- **source_refs / decision_refs**：R17 → D22,D23,D24 → FR-009/012/014
- **execution_file_paths**：`tests/stage-content-host-independence.test.mjs`。
- **test_strategy_owner**：build-plan/high-intelligence-model（回填设计；不是历史执行事实）
- **test tier / test method**：fullstack — fullstack-slice-testing + targeted contract；由 build-plan 设计，build-code 执行。
- **scenarios / commands / expected exit / oracle**：成功、失败和缺证据边界按本卡原有策略；`npx vitest run tests/integration/vnext-official-stage-run.test.mjs tests/stage-content-host-independence.test.mjs tests/stage-plan-task-contract-v3.test.mjs tests/review-material-hash-contract.test.mjs tests/contract/integration-review-subject.test.mjs && npm run check:skill-closure && npm run check`；0；ORACLE-FINAL — 回归通过、host independence 无问题、skill bundle/catalog hash 校验通过、PUBLIC_RESULT_INVALID/PROTOCOL_INCOMPATIBLE/MATERIAL_INCOMPLETE/PROFILE_MISMATCH 四种分类均可见；共享配置 pre/post 证据如实记录，缺失质量事实仍保持 incomplete/unknown。。
- **fixtures_services**：Node/Vitest 本地 fixtures；无 provider、无外部服务；若原卡另有环境限制，以原卡为准。
- **browser_route**：N/A — 本任务是 WorkflowHub runtime/材料合同，无业务 UI。
- **execution_contract**：build-code 只消费本卡已写入的命令/oracle/evidence 边界；不临场 route/blueprint/executor；缺策略写 MATERIAL_INCOMPLETE。
- **final current-snapshot aggregate strategy**：N/A — 当前快照最终聚合由 T027 的 verify-code replay 负责。
- **coverage limits**：本卡不等于原始需求语义验收；历史 receipt、provider review、用户 handoff 缺失或过期时保持 unknown/incomplete。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：在同一 Task 内修复结构审查 fail-loud、AC fake-green、逐项原始需求回放、finding 结构化处置、生成物/skill bundle hash 不同步，以及当前 implementation receipt 无法绑定修复后 snapshot 的缺口；新增内容寻址 current implementation receipt，未改 provider 配置、公共命令、历史事实或新增 gate。
- **executed_commands**：`npx vitest run tests/final-cutover-guards.red.test.mjs tests/official-component-receipts.test.mjs tests/decision-log-content-contract.test.mjs tests/verify-requirement-replay-contract.test.mjs tests/review-material-hash-contract.test.mjs tests/stage-interaction-contract.test.mjs && npm run check:skill-closure && npm run smoke:skill-dispatch`；`97/97` 聚焦断言通过，`exit_code=0`。
- **evidence_refs**：`[{"ref":"quality/evidence/task-completion/verify-code/T012-39fe16284c87e6922dc7cdf2521029fc5376454b7f2a18b4db0e7eeb2b9a246c.json","sha256":"39fe16284c87e6922dc7cdf2521029fc5376454b7f2a18b4db0e7eeb2b9a246c","kind":"task_completion_current","snapshot_tree":"e4b968db05893d7e6a889e3e272e652c172a7cbb","source_digest":"ad59ad17dc213ba78a051a60db4d693d6a4b8e9a598c3ffde026b595e6551912"}]`
- **covered_ac**：`AC-009`、`AC-010`、`AC-011`、`AC-014`、`AC-016`、`AC-018`、`AC-021`、`AC-022`、`AC-023`
- **review_fact**：Phase 6 原始 review 仍只读保留；当前快照最终整合 review=`quality/reviews/results/build-code-default-b649e78372603a0c54f528503d0bfe9f448fccfc-328a1b8b-dcc2-4799-b61b-4c6fef3d3d9d.json`，sha256=`0d1941efd40c7d2b51a300a3eb675401ad6c48660940ede9bfec47c98e51e232`，report=`quality/reviews/reports/328a1b8b-dcc2-4799-b61b-4c6fef3d3d9d.md`，sha256=`c00aa29bcd493f7f06ce0c47abc7ab844aebbd49fe5e7dc2ea47056232a0778f`；`pi/coding=pass`、`cursor/grok=revise_required`，aggregate=`pass`。`F-ba44280224b1` 是 nonblocking minor，指出当前 focused GREEN receipt 的 per-AC coverage_classes 未显式列出；处置为 `fixed` 的证据准备项，最终 verify 将用逐 AC acceptance leaf/replay 绑定真实当前证据；原始 verdict 不改写。
- **completed_at**：`2026-08-05T07:25+08:00`

##### T012 当前修复延续（同一 Task，不创建 successor）

- **范围**：D21-D24；FR-008、FR-009、FR-014、FR-016、FR-018；AC-003、AC-010、AC-014、AC-018、AC-019、AC-021。
- **当前状态**：`completed`（build-code 修复、聚焦回归、当前实现事实和当前 build-code review 已完成；verify-code 的最终逐项证据仍按下方流程收集）；上一轮 verify 的失败、unknown 和旧 snapshot 事实只读保留。
- **已完成修复**：结构 review fail-loud；AC summary 保留 `leaf_result` 并在证据不完整时派生 `unknown`；verification receipt 支持逐项 `requirement_replay`；stage invocation 校验完整 finding disposition；skill bundle/catalog 和 architecture 生成物已重新收口；同一 Task 修复后的当前实现可通过内容寻址 receipt 绑定当前 snapshot，历史 implementation receipt 不被覆盖。
- **已通过聚焦证据**：final-cutover/official receipts/AC summary/schema/decision-log/replay contract 共 `97/97`；architecture、archive、skill dispatch 共 `11/11`。
- **已新增聚焦证据**：`tests/official-component-receipts.test.mjs` 覆盖当前 implementation receipt 与历史 receipt 分离；当前最终快照的 implementation receipt 将与最终 full-suite/check receipt 一起登记。
- **待完成证据**：当前快照的逐项 AC/replay receipt、verify-code projection 和最终 AC 状态；已有同快照完整回归收据可复用，只有源码/测试合同再次改变才补跑一次完整套件；在这些证据全部收齐前不宣称完成、不执行 close。

#### T015 — 同快照完整测试复用与 review 非门禁收口

- **ID**：T015
- **Phase**：Phase 6：CAS、公共边界和最终回归
- **goal**：用失败测试固定 material-only/tasks-only 材料变更不应触发完整 `npm test` 重跑，同时保留 review 的真实质量状态。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"14b7f126371ac8a4d20c2a984bf7f24ee545ad8ee5b88e2df5b320d95a328d19","id":"SPEC"}]`
- **输入**：D36、D37、D38、R1、R14、R17、R18。
- **依赖**：T012
- **并行**：否 — RED 必须先于 GREEN
- **FR**：FR-007、FR-008、FR-009、FR-019、FR-020
- **AC**：AC-008、AC-009、AC-010、AC-014、AC-018、AC-022、AC-023
- **动作**：在同一 build-code Task 内，让 verify-code 的完整 `npm test` 采集自动复用有效的 build-code receipt；校验命令哈希、输出哈希、Git tree 和 source digest；将历史/不可用/revise_required review 保留为质量 warning，不把 review verdict 变成交付失败。
- **精确文件**：`tests/official-component-receipts.test.mjs`
- **boundary**：files: `tests/official-component-receipts.test.mjs`; symbols/regions: material-only receipt reuse regression only。
- **输入**：D36、D37、R1、R14、R17、R18。
- **输出**：复用收据、非门禁质量事实、当前逐 AC/replay 证据。
- **Knowledge**：当前 receipt 校验把材料内容混入测试合同，材料完成区变化会错误触发完整测试；需要把材料 freshness 与测试合同 digest 分开。
- **verification_role**：RED
- **paired_task**：T016
  - **gate_cmd**：`npx vitest run tests/contract/review-materials-contract.test.mjs tests/stage-risk-acceptance.test.mjs tests/final-cutover-guards.red.test.mjs`
- **expected_exit**：1
- **oracle**：ORACLE-MATERIAL-REUSE — 旧实现若不能在 material-only 编辑后复用 build-code receipt，定向门槛必须失败；不能把复用失败伪装成 npm test 通过。
- **evidence_path**：`quality/tests/verify-code-reuse-focused.json`。
- **STOP**：若修复需要重复完整回归、改 provider 配置、增加 retry/gate 或新增历史控制面，停止并回到 D36-D38。
- **recovery**：只撤回 T015 的当前材料和实现改动；历史 receipt、review、failure 保持只读。
- **task risk**：把材料文档变化误判为实现/测试合同变化，或把 review warning 误判成交付失败。
- **Workflow stage**：build-code
- **source_refs / decision_refs**：R18 → D38,D39 → FR-007/009/020
- **execution_file_paths**：`tests/official-component-receipts.test.mjs`。
- **test_strategy_owner**：build-plan/high-intelligence-model（回填设计；不是历史执行事实）
- **test tier / test method**：simple — focused contract/unit test；由 build-plan 设计，build-code 执行。
- **scenarios / commands / expected exit / oracle**：成功、失败和缺证据边界按本卡原有策略；；1；ORACLE-MATERIAL-REUSE — 旧实现若不能在 material-only 编辑后复用 build-code receipt，定向门槛必须失败；不能把复用失败伪装成 npm test 通过。。
- **fixtures_services**：Node/Vitest 本地 fixtures；无 provider、无外部服务；若原卡另有环境限制，以原卡为准。
- **browser_route**：N/A — 本任务是 WorkflowHub runtime/材料合同，无业务 UI。
- **execution_contract**：build-code 只消费本卡已写入的命令/oracle/evidence 边界；不临场 route/blueprint/executor；缺策略写 MATERIAL_INCOMPLETE。
- **final current-snapshot aggregate strategy**：N/A — 当前快照最终聚合由 T027 的 verify-code replay 负责。
- **coverage limits**：本卡不等于原始需求语义验收；历史 receipt、provider review、用户 handoff 缺失或过期时保持 unknown/incomplete。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：记录旧实现对 material-only 编辑不能复用 receipt 的真实 RED 事实；GREEN 证据由 T016 当前定向回归配对，未把 RED 观察改写成通过。
- **executed_commands**：`npx vitest run tests/official-component-receipts.test.mjs -t "reuses a full receipt after current-material-only edits"`；初次 RED `exit_code=1`，复用断言失败。
- **evidence_refs**：`[{"ref":"quality/evidence/task-completion/verify-code/T015-c440fdce796a4e801810a8e485a2730f42b5e5ec20a6dd5dc79be2d2756af2b5.json","sha256":"c440fdce796a4e801810a8e485a2730f42b5e5ec20a6dd5dc79be2d2756af2b5","kind":"task_completion_current","snapshot_tree":"e4b968db05893d7e6a889e3e272e652c172a7cbb","source_digest":"ad59ad17dc213ba78a051a60db4d693d6a4b8e9a598c3ffde026b595e6551912"}]`
- **covered_ac**：`AC-008`、`AC-009`、`AC-010`、`AC-014`、`AC-018`、`AC-022`、`AC-023`
- **review_fact**：等待 T016 GREEN 后沿用当前一次 build-code review 事实；不因 RED 或 review verdict 追审。
- **completed_at**：`2026-08-05T12:28+08:00`

#### T016 — 同快照完整测试复用与 review 非门禁 GREEN

- **ID**：T016
- **Phase**：Phase 6：CAS、公共边界和最终回归
- **goal**：修复 material-only/tasks-only 变更的测试 receipt 复用、独立 source digest、质量事实投影和 canonical completion wrapper 读取；统一审查处置只看 reportable findings，且不重复完整回归。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"14b7f126371ac8a4d20c2a984bf7f24ee545ad8ee5b88e2df5b320d95a328d19","id":"SPEC"}]`
- **输入**：T015 RED、D38-D42、同一当前四份材料和当前 raw review findings。
- **依赖**：T015
- **并行**：否 — GREEN 依赖 RED
- **FR**：FR-007、FR-008、FR-009、FR-019、FR-020
- **AC**：AC-008、AC-009、AC-010、AC-014、AC-018、AC-022、AC-023
- **动作**：让当前四份材料不改变测试合同 digest；允许 verify-code 复用同一有效 build-code `npm test` receipt；按 predicate 独立记录测试、AC、review 和 confirmation 状态；审查处置和严重风险识别统一使用 canonical reportable findings，保留 raw clusters 只作溯源；要求不同完成 AC 使用独立 proving anchor；不把 review 变成 pass 或交付 gate。
- **精确文件**：`runtime/task/task-handle.mjs`; `runtime/evidence/canonical-receipt-writer.mjs`; `runtime/evidence/canonical-evidence-validators.mjs`; `runtime/stage/stage-handlers.mjs`; `runtime/stage/stage-runner.mjs`; `runtime/review/stage-review-disposition.mjs`; `runtime/task/git-worktree-snapshot.mjs`; `skills/wh-review/scripts/review-materials.mjs`; `tests/official-component-receipts.test.mjs`; `tests/contract/review-materials-contract.test.mjs`; `tests/stage-risk-acceptance.test.mjs`; `tests/final-cutover-guards.red.test.mjs`; `tests/integration/vnext-official-stage-run.test.mjs`
- **boundary**：files: listed runtime/review-materials implementation and related focused tests only; symbols/regions: receipt reuse, snapshot/source digest, canonical completion facts, canonical review findings, distinct evidence anchors and focused predicate regression。
- **输出**：当前 receipt 复用实现、按事实独立发布的 quality facts、canonical finding 处置实现、distinct-anchor validation 和 focused GREEN receipt。
- **Knowledge**：同一 source/test candidate 的 full receipt 可复用；材料只改变下游交接事实，必须重新核对当前 AC/replay；review 处置只消费 canonical reportable findings，不能从历史 clusters 自动制造当前 finding；证据 map 不能用同一 proving anchor 覆盖多个完成 AC。
- **verification_role**：GREEN
- **paired_task**：T015
- **gate_cmd**：`npx vitest run tests/contract/review-materials-contract.test.mjs tests/stage-risk-acceptance.test.mjs tests/final-cutover-guards.red.test.mjs`
- **expected_exit**：0
- **oracle**：ORACLE-MATERIAL-REUSE — material-only receipt 复用、canonical completion facts 的 predicate 独立发布、canonical finding 处置、distinct evidence anchor、快照隔离和相关守卫全部通过；不要求 provider pass，不启动 `npm test`。
- **evidence_path**：`quality/tests/build-code-predicate-isolation-focused-v2-20260805.json`
- **STOP**：若必须重跑完整套件才能证明材料变化安全，先检查 source/test-contract digest；只有生产/测试合同变化才允许进入 verify-code 的一次最终完整回归。
- **recovery**：只撤回 T016 当前实现和定向测试，保留 T015 RED、旧 full receipt、review 和失败事实。
- **task risk**：把材料变化从测试 digest 中排除过宽，导致实现或测试合同变化错误复用旧 receipt。
- **Workflow stage**：build-code
- **source_refs / decision_refs**：R18 → D38,D39,D40,D41,D42 → FR-007/009/019/020
- **execution_file_paths**：`runtime/task/task-handle.mjs`; `runtime/evidence/canonical-receipt-writer.mjs`; `runtime/evidence/canonical-evidence-validators.mjs`; `runtime/stage/stage-handlers.mjs`; `runtime/stage/stage-runner.mjs`; `runtime/review/stage-review-disposition.mjs`; `runtime/task/git-worktree-snapshot.mjs`; `skills/wh-review/scripts/review-materials.mjs`; `tests/official-component-receipts.test.mjs`; `tests/contract/review-materials-contract.test.mjs`; `tests/stage-risk-acceptance.test.mjs`; `tests/final-cutover-guards.red.test.mjs`; `tests/integration/vnext-official-stage-run.test.mjs`。
- **test_strategy_owner**：build-plan/high-intelligence-model（回填设计；不是历史执行事实）
- **test tier / test method**：feature — test-routing-advisor + testing-system-blueprint + applicable backend/frontend testing；由 build-plan 设计，build-code 执行。
- **scenarios / commands / expected exit / oracle**：成功、失败和缺证据边界按本卡原有策略；`npx vitest run tests/contract/review-materials-contract.test.mjs tests/stage-risk-acceptance.test.mjs tests/final-cutover-guards.red.test.mjs`；0；ORACLE-MATERIAL-REUSE — material-only receipt 复用、canonical completion facts 的 predicate 独立发布、canonical finding 处置、distinct evidence anchor、快照隔离和相关守卫全部通过；不要求 provider pass，不启动 `npm test`。。
- **fixtures_services**：Node/Vitest 本地 fixtures；无 provider、无外部服务；若原卡另有环境限制，以原卡为准。
- **browser_route**：N/A — 本任务是 WorkflowHub runtime/材料合同，无业务 UI。
- **execution_contract**：build-code 只消费本卡已写入的命令/oracle/evidence 边界；不临场 route/blueprint/executor；缺策略写 MATERIAL_INCOMPLETE。
- **final current-snapshot aggregate strategy**：N/A — 当前快照最终聚合由 T027 的 verify-code replay 负责。
- **coverage limits**：本卡不等于原始需求语义验收；历史 receipt、provider review、用户 handoff 缺失或过期时保持 unknown/incomplete。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：完成 source digest/material-only 快照边界、receipt 自动复用、stage predicate 独立状态、canonical completion wrapper 读取、canonical reportable finding 选择和 distinct evidence anchor 校验；全量 `npm test` 不再重复，当前只使用直接相关的 focused GREEN receipt。
- **executed_commands**：`npx vitest run tests/contract/review-materials-contract.test.mjs tests/stage-risk-acceptance.test.mjs tests/final-cutover-guards.red.test.mjs`；当前 `75/75` 通过，未重复 `npm test`。
- **evidence_refs**：`[{"ref":"quality/evidence/task-completion/verify-code/T016-78543bf27874b3239222fbdd9f5ddaab7e32da07db375cf190bea7b6dba3b6c7.json","sha256":"78543bf27874b3239222fbdd9f5ddaab7e32da07db375cf190bea7b6dba3b6c7","kind":"task_completion_current","snapshot_tree":"e4b968db05893d7e6a889e3e272e652c172a7cbb","source_digest":"ad59ad17dc213ba78a051a60db4d693d6a4b8e9a598c3ffde026b595e6551912"}]`
- **covered_ac**：`AC-008`、`AC-009`、`AC-010`、`AC-014`、`AC-018`、`AC-022`、`AC-023`
- **review_fact**：沿用当前 build-code review 原始 verdict/finding；本次代码修复不追求新的 provider pass。
- **completed_at**：`2026-08-05T13:13+08:00`

## 3. Dependency Graph

T001 → T002 → T003 → T004 → T005 → T006 → T013 → T014 → T007 → T008 → T009 → T010 → T011 → T012 → T015 → T016 → T017 → T018 → T019 → T020 → T021 → T022 → T023 → T024 → T025 → T026 → T028 → T027。

## 4. Requirement and Verification Traceability

| FR | Task IDs | AC IDs | Phase | Gate / evidence |
|---|---|---|---|---|
| FR-001 | T009,T010 | AC-001,AC-002 | 5 | 当前材料和非 ENOENT 回归 |
| FR-002 | T007 | AC-003,AC-006,AC-013,AC-015,AC-017 | 4 | decision-log 内容契约 |
| FR-003 | T001,T002 | AC-004,AC-005,AC-019 | 1 | 主代理执行配置/规则 |
| FR-004 | T001,T002 | AC-004,AC-005,AC-019 | 1 | Talk/Grill/Clarify 证据契约 |
| FR-005 | T003,T004 | AC-005,AC-016 | 2 | completion user view 与 handoff |
| FR-006 | T007 | AC-003,AC-006,AC-013,AC-015,AC-017 | 4 | D→FR/AC 来源审计 |
| FR-007 | T005 | AC-008,AC-010,AC-022 | 3 | 质量/推进/完成分离 |
| FR-008 | T008 | AC-003,AC-007,AC-013,AC-014,AC-016,AC-020 | 4 | R/F/D replay 证据 |
| FR-009 | T005,T012 | AC-008,AC-009,AC-010,AC-011,AC-014,AC-016,AC-018,AC-021,AC-022,AC-023 | 3,6 | provider/verdict 真实状态 |
| FR-010 | T009,T010 | AC-001,AC-002 | 5 | ENOENT 与非 ENOENT |
| FR-011 | T011 | AC-009,AC-012,AC-014 | 6 | revision/latest CAS |
| FR-012 | T008,T011,T012 | AC-003,AC-007,AC-009,AC-010,AC-011,AC-012,AC-013,AC-014,AC-016,AC-018,AC-020,AC-021,AC-022,AC-023 | 4,6 | 历史/事故只读回放 |
| FR-013 | T007 | AC-003,AC-006,AC-013,AC-015,AC-017 | 4 | 最低结构 |
| FR-014 | T008,T012 | AC-003,AC-007,AC-009,AC-010,AC-011,AC-014,AC-016,AC-018,AC-020,AC-021,AC-023 | 4,6 | formal close 分离 |
| FR-015 | T006 | AC-018,AC-019,AC-021,AC-023 | 3 | 协议失败分类 |
| FR-016 | T001,T002,T006 | AC-004,AC-005,AC-018,AC-019,AC-021,AC-023 | 1,3 | finding 处置 |
| FR-017 | T008 | AC-003,AC-007,AC-013,AC-014,AC-016,AC-020 | 4 | stale freshness |
| FR-018 | T006,T012 | AC-009,AC-010,AC-011,AC-014,AC-016,AC-018,AC-021,AC-022,AC-023 | 3,6 | v2 map preflight |
| FR-019 | T005,T006,T012 | AC-008,AC-009,AC-010,AC-011,AC-014,AC-016,AC-018,AC-021,AC-022,AC-023 | 3,6 | pass 非推进许可证 |
| FR-020 | T006,T012,T013,T014 | AC-009,AC-010,AC-011,AC-014,AC-016,AC-018,AC-021,AC-022,AC-023 | 3,6 | pass 基线后的增量与材料 hash |
| FR-021 | T017,T018,T019 | AC-003,AC-007,AC-013,AC-018,AC-024 | 7 | 语义证据与同 task scope-revision 专用 review |
| FR-022 | T020,T023 | AC-025 | 8 | spec/plan/tasks 内容 skill/template closure |
| FR-023 | T021,T023 | AC-026 | 8 | build-code apply contract、finding/handoff |
| FR-024 | T022,T023,T024 | AC-027 | 8 | build-plan 设计并写入 tasks.md 的分层策略 |
| FR-025 | T024 | AC-028 | 8 | build-code 只执行任务卡策略并记录实际结果 |
| FR-026 | T025,T028 | AC-029 | 9 | 内容合同 provenance 与当前任务卡回填 |
| FR-027 | T026 | AC-030 | 9 | plan.md 三阶段进度索引 |
| FR-028 | T026,T028 | AC-030 | 9 | tasks.md 两阶段进度和精确执行路径 |
| FR-029 | T027,T028 | AC-003,AC-007,AC-013,AC-031 | 9 | 逐项语义回放和 honest completion |

## 5. Final Boundary Check

所有任务初始为 pending；完成必须填写当前命令、exit code、evidence ref、covered AC、review fact 和时间。plan/tasks contract、独立 review、用户确认和 handoff 是阶段事实，不等于 commit/push/merge/archive/cleanup 授权。

## Phase 7：语义闭环与轻量 scope-revision

### Goal

把结构覆盖、任务完成、聚合测试和真实语义证据分开；为 build-code/verify-code 中途需求变化提供同 task 四材料的一次性 scope-revision review。

### Files

- **MODIFY**：`runtime/stage/stage-handlers.mjs`; `runtime/stage/completion-predicates.mjs`; `runtime/stage/stage-content-contracts.mjs`; `skills/wh-review/scripts/review-materials.mjs`; `skills/wh-review/scripts/review-runner.mjs`; `skills/wh-review/SKILL.md`; `workflows/build-code/SKILL.md`; `workflows/verify-code/SKILL.md`。
- **MODIFY**：`tests/contract/review-materials-contract.test.mjs`; `tests/contract/stage-completion.test.mjs`; `tests/spec-content-profile.test.mjs`; `tests/final-cutover-guards.red.test.mjs`。
- **MODIFY**：`specs/requirements-completeness-audit-20260804/decision-log.md`; `specs/requirements-completeness-audit-20260804/spec.md`; `specs/requirements-completeness-audit-20260804/plan.md`; `specs/requirements-completeness-audit-20260804/tasks.md`; `quality/evidence/verification/requirements-completeness-replay-current.json`。
- **NEW**：`runtime/review/scope-revision-contract.mjs`; `skills/wh-review/contracts/scope-revision.md`; `tests/contract/scope-revision-contract.test.mjs`。

### Tasks

T017 then T018 then T019。

### Verify

`npx vitest run tests/contract/stage-completion.test.mjs tests/spec-content-profile.test.mjs tests/contract/scope-revision-contract.test.mjs tests/final-cutover-guards.red.test.mjs`；再运行受影响的官方 stage integration test；不重跑 `npm test`，不重复 provider。

### Knowledge

T017/T018 是当前 task 的流程和证据合同修复，不是 PaperBuilder/KnowledgeDigest 业务实现；五份报告的业务页面、数据和 browser 结果继续 deferred/non-goal。

### STOP

unknown/incomplete 不能改写为 pass；不创建 successor/reopen/ledger/public stage，不改 provider 配置，不执行 close/confirm/authorize。

### Done

T017/T018 的实现和 focused tests 完成；T019 已在当前 R/F/D、INC、FR/AC/T 和语义 evidence/replay 重新绑定后完成；整体 close 仍受真实 full-suite/history/provider/handoff 状态约束。

### Risks and rollback

历史 tasks/receipt 可能只证明结构而不证明语义；保留原始失败和旧 snapshot，只回滚本阶段新增的合同/材料修改。

#### T017 — 需求/AC/replay 语义证据防假绿

- **ID**：T017
- **Phase**：Phase 7：语义闭环与轻量 scope-revision
- **goal**：阻止结构映射、任务完成行、聚合测试或共享 receipt 被误报成原始需求完成。
- **design_state**：in_progress
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"0fa5dd02ee623e06d4ed48323f3dc1e873d47b7a78d02be7d3c7b8eec3064af0","id":"SPEC"}]`
- **输入**：D43、R1-R19、当前 verify findings F-aa/F-b199/F-ca69/F-da374。
- **依赖**：T016
- **并行**：否 — 先修语义完成判据，再刷新当前证据。
- **FR**：FR-008、FR-012、FR-018、FR-021
- **AC**：AC-003、AC-007、AC-013、AC-018、AC-024
- **动作**：阶段材料按阶段读取；build-spec 先检查每个 AC 已声明可观察场景和 oracle/验证规则；build-plan 使用完整 plan-task contract；completion evidence 真实读回并校验 hash；covered/pass 必须包含 scenario/oracle/actual_outcome/coverage_limits 和独立 implementation/verification anchor；缺失统一保留 unknown/incomplete。
- **精确文件**：`runtime/stage/stage-handlers.mjs`; `runtime/stage/completion-predicates.mjs`; `runtime/stage/stage-content-contracts.mjs`; `tests/contract/review-materials-contract.test.mjs`; `tests/contract/stage-completion.test.mjs`; `tests/spec-content-profile.test.mjs`
- **boundary**：files: `runtime/stage/stage-handlers.mjs`; `runtime/stage/completion-predicates.mjs`; `runtime/stage/stage-content-contracts.mjs`; `tests/contract/review-materials-contract.test.mjs`; `tests/contract/stage-completion.test.mjs`; `tests/spec-content-profile.test.mjs`; symbols/regions: semantic completion, stage material selection, acceptance design and task evidence validation only。
- **输出**：当前阶段材料边界、AC 设计最小判定和语义 completion/evidence contract。
- **Knowledge**：共享 proving anchor、伪 hash 和历史任务行只能作为失败/审计事实。
- **verification_role**：N/A — non-behavior workflow contract and evidence semantics change
- **paired_task**：N/A — non-behavior workflow contract and evidence semantics change
- **evidence_path**：`quality/tests/build-code-semantic-evidence-focused-20260805.json`
- **recovery**：只回滚 T017 当前语义验证实现和定向测试，保留旧的 unknown/incomplete 事实。
- **task risk**：把设计阶段的场景/oracle 检查误当成实现结果，或把历史 receipt 当成当前证据。
- **Workflow stage**：build-code
- **source_refs / decision_refs**：R19 → D43 → FR-008/021
- **execution_file_paths**：`runtime/stage/stage-handlers.mjs`; `runtime/stage/completion-predicates.mjs`; `runtime/stage/stage-content-contracts.mjs`; `tests/contract/review-materials-contract.test.mjs`; `tests/contract/stage-completion.test.mjs`; `tests/spec-content-profile.test.mjs`。
- **test_strategy_owner**：build-plan/high-intelligence-model（回填设计；不是历史执行事实）
- **test tier / test method**：feature — test-routing-advisor + testing-system-blueprint + applicable backend/frontend testing；由 build-plan 设计，build-code 执行。
- **scenarios / commands / expected exit / oracle**：成功、失败和缺证据边界按本卡原有策略；`npx vitest run tests/contract/review-materials-contract.test.mjs tests/contract/stage-completion.test.mjs tests/stage-plan-task-contract.test.mjs`；0；共享 proving anchor、模板化 outcome、伪 hash 和未来材料缺失均不能形成语义完成；当前阶段不读取未来材料。。
- **fixtures_services**：Node/Vitest 本地 fixtures；无 provider、无外部服务；若原卡另有环境限制，以原卡为准。
- **browser_route**：N/A — 本任务是 WorkflowHub runtime/材料合同，无业务 UI。
- **execution_contract**：build-code 只消费本卡已写入的命令/oracle/evidence 边界；不临场 route/blueprint/executor；缺策略写 MATERIAL_INCOMPLETE。
- **final current-snapshot aggregate strategy**：N/A — 当前快照最终聚合由 T027 的 verify-code replay 负责。
- **coverage limits**：本卡不等于原始需求语义验收；历史 receipt、provider review、用户 handoff 缺失或过期时保持 unknown/incomplete。
- **gate_cmd**：`npx vitest run tests/contract/review-materials-contract.test.mjs tests/contract/stage-completion.test.mjs tests/stage-plan-task-contract.test.mjs`
- **expected_exit**：0
- **oracle**：共享 proving anchor、模板化 outcome、伪 hash 和未来材料缺失均不能形成语义完成；当前阶段不读取未来材料。
- **STOP**：不把旧任务行、绿色 aggregate、provider pass 或历史 receipt 改写为当前需求完成。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：增加阶段材料边界、build-spec AC 场景/oracle 设计检查、build-plan 完整 plan-task contract、真实 completion evidence 读回、语义 evidence/anchor 防假绿；future material 仍只按阶段读取。
- **executed_commands**：`npx vitest run tests/contract/review-materials-contract.test.mjs tests/contract/stage-completion.test.mjs tests/stage-plan-task-contract.test.mjs tests/spec-content-profile.test.mjs tests/official-component-receipts.test.mjs tests/contract/scope-revision-contract.test.mjs`；`exit_code=0`；当前 canonical receipt 已绑定 snapshot `65bcaa2963db85229698a5edb9d6d50ab83bd2ab`。
- **evidence_refs**：`[{"ref":"quality/evidence/task-completion/verify-code/T017-d04663469d1da729c4b8d93f6df08ebeb759e7c24c131ab1b3a87fe1fe96d0c9.json","sha256":"d04663469d1da729c4b8d93f6df08ebeb759e7c24c131ab1b3a87fe1fe96d0c9","kind":"task_completion_current","snapshot_tree":"e4b968db05893d7e6a889e3e272e652c172a7cbb","source_digest":"ad59ad17dc213ba78a051a60db4d693d6a4b8e9a598c3ffde026b595e6551912"}]`
- **covered_ac**：`AC-003`、`AC-007`、`AC-013`、`AC-018`、`AC-024`
- **review_fact**：当前不调用 provider；代码/合同 focused evidence 已记录，历史 review verdict/finding 保持只读质量事实。
- **completed_at**：`2026-08-05T13:58+08:00`

#### T018 — 同 task 四材料 scope-revision 专用 review

- **ID**：T018
- **Phase**：Phase 7：语义闭环与轻量 scope-revision
- **goal**：在 build-code/verify-code 中途需求变化时，只更新四份材料并执行一次专用审查，避免完整五阶段回退。
- **design_state**：in_progress
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"0fa5dd02ee623e06d4ed48323f3dc1e873d47b7a78d02be7d3c7b8eec3064af0","id":"SPEC"}]`
- **输入**：D44、R17-R19、用户 U15、Carver scope_revision 研究。
- **依赖**：T017
- **并行**：否 — review contract 依赖语义字段边界。
- **FR**：FR-021
- **AC**：AC-024
- **动作**：新增 `workflowhub-scope-revision.v1` validator、专属 prompt/contract 和同 stage 内 review material mode；禁止 provider/config 选择、禁止新 stage/successor/reopen/ledger；主代理直接完成 Talk/Clarify/Grill，review 只提供一次异源意见。
- **精确文件**：`runtime/review/scope-revision-contract.mjs`; `skills/wh-review/scripts/review-materials.mjs`; `skills/wh-review/scripts/review-runner.mjs`; `skills/wh-review/contracts/scope-revision.md`; `skills/wh-review/SKILL.md`; `workflows/build-code/SKILL.md`; `workflows/verify-code/SKILL.md`; `tests/contract/scope-revision-contract.test.mjs`
- **boundary**：files: `runtime/review/scope-revision-contract.mjs`; `skills/wh-review/scripts/review-materials.mjs`; `skills/wh-review/scripts/review-runner.mjs`; `skills/wh-review/contracts/scope-revision.md`; `skills/wh-review/SKILL.md`; `workflows/build-code/SKILL.md`; `workflows/verify-code/SKILL.md`; `tests/contract/scope-revision-contract.test.mjs`; symbols/regions: scope_revision validator, packet selection, prompt, contract and one-review identity only。
- **输出**：同 task 四材料 scope-revision review packet、专属 prompt/contract 和一次性审查规则。
- **Knowledge**：复用 wh-review route；不新增 provider/config/control plane。
- **verification_role**：N/A — non-behavior workflow contract and evidence semantics change
- **paired_task**：N/A — non-behavior workflow contract and evidence semantics change
- **evidence_path**：`quality/tests/scope-revision-contract-focused-20260805.json`
- **recovery**：只回滚 T018 scope-revision packet/contract 文件，保留原始 review facts 和用户沟通事实。
- **task risk**：把专用 review 误做成 pass gate，或把普通代码 review 混入临时需求判断。
- **Workflow stage**：build-code
- **source_refs / decision_refs**：R19 → D44 → FR-021
- **execution_file_paths**：`runtime/review/scope-revision-contract.mjs`; `skills/wh-review/scripts/review-materials.mjs`; `skills/wh-review/scripts/review-runner.mjs`; `skills/wh-review/contracts/scope-revision.md`; `skills/wh-review/SKILL.md`; `workflows/build-code/SKILL.md`; `workflows/verify-code/SKILL.md`; `tests/contract/scope-revision-contract.test.mjs`。
- **test_strategy_owner**：build-plan/high-intelligence-model（回填设计；不是历史执行事实）
- **test tier / test method**：feature — test-routing-advisor + testing-system-blueprint + applicable backend/frontend testing；由 build-plan 设计，build-code 执行。
- **scenarios / commands / expected exit / oracle**：成功、失败和缺证据边界按本卡原有策略；`npx vitest run tests/contract/scope-revision-contract.test.mjs tests/contract/review-materials-contract.test.mjs`；0；四材料缺项在 provider 前 `MATERIAL_INCOMPLETE`；合法 revision 生成专属 prompt/contract；同 revision 不允许 incremental/closure 或 pass-loop。。
- **fixtures_services**：Node/Vitest 本地 fixtures；无 provider、无外部服务；若原卡另有环境限制，以原卡为准。
- **browser_route**：N/A — 本任务是 WorkflowHub runtime/材料合同，无业务 UI。
- **execution_contract**：build-code 只消费本卡已写入的命令/oracle/evidence 边界；不临场 route/blueprint/executor；缺策略写 MATERIAL_INCOMPLETE。
- **final current-snapshot aggregate strategy**：N/A — 当前快照最终聚合由 T027 的 verify-code replay 负责。
- **coverage limits**：本卡不等于原始需求语义验收；历史 receipt、provider review、用户 handoff 缺失或过期时保持 unknown/incomplete。
- **gate_cmd**：`npx vitest run tests/contract/scope-revision-contract.test.mjs tests/contract/review-materials-contract.test.mjs`
- **expected_exit**：0
- **oracle**：四材料缺项在 provider 前 `MATERIAL_INCOMPLETE`；合法 revision 生成专属 prompt/contract；同 revision 不允许 incremental/closure 或 pass-loop。
- **STOP**：不修改共享 provider 配置，不调用 provider，不执行 full suite。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：增加 `workflowhub-scope-revision.v1` validator、专属 prompt/contract、scope_revision material mode、stage matrix/skill closure binding 和同 task 一次性 review 规则；不新增 stage、successor、ledger、provider/config 或 pass gate。
- **executed_commands**：`npx vitest run tests/contract/scope-revision-contract.test.mjs tests/contract/review-materials-contract.test.mjs`；`exit_code=0`；当前最终回归收据复用同一源码快照 `65bcaa2963db85229698a5edb9d6d50ab83bd2ab`。
- **evidence_refs**：`[{"ref":"quality/evidence/task-completion/verify-code/T018-d4e3d070d392501cdedf1a15d40744024c57e040b3db0e5e8afae52f8258eb98.json","sha256":"d4e3d070d392501cdedf1a15d40744024c57e040b3db0e5e8afae52f8258eb98","kind":"task_completion_current","snapshot_tree":"e4b968db05893d7e6a889e3e272e652c172a7cbb","source_digest":"ad59ad17dc213ba78a051a60db4d693d6a4b8e9a598c3ffde026b595e6551912"}]`
- **covered_ac**：`AC-024`
- **review_fact**：专用 provider review 依当前任务边界暂未调用；真实状态是 `unavailable/not-invoked-by-scope`，不写成 pass，也不循环审查。
- **completed_at**：`2026-08-05T13:58+08:00`

#### T019 — 当前原始需求回放和定向证据收口

- **ID**：T019
- **Phase**：Phase 7：语义闭环与轻量 scope-revision
- **goal**：重新检查 R1-R19、五份报告、INC-001~045、D1-D44、FR/AC/T，消除“任务全完成但需求遗漏”的错误结论。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"0fa5dd02ee623e06d4ed48323f3dc1e873d47b7a78d02be7d3c7b8eec3064af0","id":"SPEC"}]`
- **输入**：T017、T018、当前四份材料、当前 raw review findings。
- **依赖**：T017,T018
- **并行**：否 — 先完成合同，再刷新事实。
- **FR**：FR-008、FR-012、FR-018、FR-021
- **AC**：AC-003、AC-007、AC-013、AC-018、AC-024
- **动作**：只生成当前 snapshot 绑定的语义 evidence/replay；业务报告页面和真实数据仍标记 deferred/non-goal；只跑受影响 focused tests，复用有效 full receipt，不重复 provider。
- **精确文件**：`specs/requirements-completeness-audit-20260804/decision-log.md`; `specs/requirements-completeness-audit-20260804/spec.md`; `specs/requirements-completeness-audit-20260804/plan.md`; `specs/requirements-completeness-audit-20260804/tasks.md`; `tests/final-cutover-guards.red.test.mjs`。
- **boundary**：files: `specs/requirements-completeness-audit-20260804/decision-log.md`, `specs/requirements-completeness-audit-20260804/spec.md`, `specs/requirements-completeness-audit-20260804/plan.md`, `specs/requirements-completeness-audit-20260804/tasks.md`, `quality/evidence/verification/requirements-completeness-replay-current.json`, `tests/final-cutover-guards.red.test.mjs`; symbols/regions: current R/F/D replay, FR/AC/T traceability, semantic evidence and finding disposition only。
- **输出**：当前 snapshot 绑定的逐条 replay、AC evidence 状态和延期交接；不生成 close。
- **Knowledge**：旧 full receipt 只在 snapshot/material/source digest 仍匹配时复用，否则保持 stale/unknown。
- **verification_role**：N/A — non-behavior workflow contract and evidence semantics change
- **paired_task**：N/A — non-behavior workflow contract and evidence semantics change
- **evidence_path**：`quality/evidence/verification/requirements-completeness-replay-current.json`
- **recovery**：只回滚当前 replay projection 和新增 evidence，不删除旧 snapshot、review、failure 或 unavailable 记录。
- **task risk**：把结构 coverage 或局部 focused test 误宣称为所有原始需求已完成。
- **Workflow stage**：build-code
- **source_refs / decision_refs**：R2,R5,R11,R16,R20 → D43,D50,D54 → FR-008/012/021
- **execution_file_paths**：`specs/requirements-completeness-audit-20260804/decision-log.md`; `specs/requirements-completeness-audit-20260804/spec.md`; `specs/requirements-completeness-audit-20260804/plan.md`; `specs/requirements-completeness-audit-20260804/tasks.md`; `tests/final-cutover-guards.red.test.mjs`。
- **test_strategy_owner**：build-plan/high-intelligence-model（回填设计；不是历史执行事实）
- **test tier / test method**：fullstack — fullstack-slice-testing + targeted contract；由 build-plan 设计，build-code 执行。
- **scenarios / commands / expected exit / oracle**：成功、失败和缺证据边界按本卡原有策略；`npx vitest run tests/contract/scope-revision-contract.test.mjs tests/contract/review-materials-contract.test.mjs tests/stage-risk-acceptance.test.mjs tests/final-cutover-guards.red.test.mjs`；0；每个 pass 有具体场景、oracle、实际结果、独立 anchor 和 coverage limit；每个 unknown/fail/deferred/unavailable 有原因和延期交接；不 close。。
- **fixtures_services**：Node/Vitest 本地 fixtures；无 provider、无外部服务；若原卡另有环境限制，以原卡为准。
- **browser_route**：N/A — 本任务是 WorkflowHub runtime/材料合同，无业务 UI。
- **execution_contract**：build-code 只消费本卡已写入的命令/oracle/evidence 边界；不临场 route/blueprint/executor；缺策略写 MATERIAL_INCOMPLETE。
- **final current-snapshot aggregate strategy**：N/A — 当前快照最终聚合由 T027 的 verify-code replay 负责。
- **coverage limits**：本卡不等于原始需求语义验收；历史 receipt、provider review、用户 handoff 缺失或过期时保持 unknown/incomplete。
- **gate_cmd**：`npx vitest run tests/contract/scope-revision-contract.test.mjs tests/contract/review-materials-contract.test.mjs tests/stage-risk-acceptance.test.mjs tests/final-cutover-guards.red.test.mjs`
- **expected_exit**：0
- **oracle**：每个 pass 有具体场景、oracle、实际结果、独立 anchor 和 coverage limit；每个 unknown/fail/deferred/unavailable 有原因和延期交接；不 close。
- **STOP**：不把 unknown/incomplete 改写成 pass，不重复 `npm test`，不执行 confirm/authorize/close。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：按当前源码快照重建 24 条 AC 的独立 acceptance leaf，并逐条回放 decision-log 中提取出的 121 个 R/F/D/INC 来源；R3 绑定 `quality/tests/research.json` 固定 sha256；修复 INC-044 的纯材料快照复用边界并记录 INC-045 的证据分层输入错误；五份报告的业务实现仍标记 deferred。另保留 tasks_completion、human_handoff 尚未确认的真实状态，不生成 close。
- **executed_commands**：此前语义定向回归 `22` 个测试文件、`325/325` 通过；INC-044 后追加 `npx vitest run tests/verify-requirement-replay-contract.test.mjs tests/final-cutover-guards.red.test.mjs tests/official-component-receipts.test.mjs`，`exit_code=0`，`3` 个测试文件、`91/91` 通过；未重跑 `npm test`。
- **evidence_refs**：`[{"ref":"quality/evidence/task-completion/verify-code/T019-96e34690945eaddeff1242cc5dc35c2d14590cbc5342ef341c695c27fb7a5a54.json","sha256":"96e34690945eaddeff1242cc5dc35c2d14590cbc5342ef341c695c27fb7a5a54","kind":"task_completion_current","snapshot_tree":"e4b968db05893d7e6a889e3e272e652c172a7cbb","source_digest":"ad59ad17dc213ba78a051a60db4d693d6a4b8e9a598c3ffde026b595e6551912"}]`
- **covered_ac**：`AC-001`、`AC-002`、`AC-003`、`AC-004`、`AC-005`、`AC-006`、`AC-007`、`AC-008`、`AC-009`、`AC-010`、`AC-011`、`AC-012`、`AC-013`、`AC-014`、`AC-015`、`AC-016`、`AC-017`、`AC-018`、`AC-019`、`AC-020`、`AC-021`、`AC-022`、`AC-023`、`AC-024`
- **review_fact**：不重复 provider；历史 review verdict/finding、协议失败和 unavailable 原样保留；当前逐条处置和专用 scope_revision 合同已有当前证据。当前验证收据诚实显示 `human_handoff=unknown`，不把用户未确认写成完成。
- **completed_at**：`2026-08-05T14:35:07+08:00`

## Phase 8：恢复内容合同与 apply 测试闭环

### Goal

让未来 build-spec/build-plan 不再丢失高价值内容字段，并让 build-plan 设计后把每个
Task/Phase/final 的测试策略写进 tasks.md，build-code 按卡执行并留痕；不恢复 AgentHub
的推进门禁。

### Files

- **MODIFY**：`runtime/review/scope-revision-contract.mjs`; `skills/wh-review/contracts/scope-revision.md`; `tests/contract/scope-revision-contract.test.mjs`。
- **MODIFY**：`skills/spec-specify/SKILL.md`; `skills/spec-specify/templates/spec-template.md`; `skills/spec-specify/skill-bundle.json`; `skills/spec-clarify/SKILL.md`; `skills/spec-clarify/skill-bundle.json`; `skills/spec-plan/SKILL.md`; `skills/spec-plan/templates/plan-template.md`; `skills/spec-plan/skill-bundle.json`; `skills/spec-tasks/SKILL.md`; `skills/spec-tasks/templates/tasks-template.md`; `skills/spec-tasks/skill-bundle.json`。
- **MODIFY**：`workflows/build-spec/skill-deps.yaml`; `workflows/build-plan/SKILL.md`; `workflows/build-plan/skill-deps.yaml`; `workflows/build-plan/steps.json`; `workflows/build-code/SKILL.md`; `workflows/build-code/skill-deps.yaml`; `workflows/build-code/steps.json`。
- **MODIFY**：`skills/test-routing-advisor/SKILL.md`; `skills/test-routing-advisor/scripts/route.mjs`; `skills/test-routing-advisor/__tests__/skill-contract.test.mjs`; `skills/test-routing-advisor/skill-bundle.json`; `skills/testing-system-blueprint/SKILL.md`; `skills/testing-system-blueprint/skill-bundle.json`; `skills/backend-testing/SKILL.md`; `skills/backend-testing/skill-bundle.json`; `skills/frontend-testing/SKILL.md`; `skills/frontend-testing/skill-bundle.json`; `skills/fullstack-slice-testing/SKILL.md`; `skills/fullstack-slice-testing/skill-bundle.json`。
- **MODIFY**：`skills/catalog.yaml`; `skills/reuse-registry.md`; `specs/requirements-completeness-audit-20260804/decision-log.md`; `specs/requirements-completeness-audit-20260804/spec.md`; `specs/requirements-completeness-audit-20260804/plan.md`; `specs/requirements-completeness-audit-20260804/tasks.md`; `tests/contract/spec-stage-artifact-closure.test.mjs`; `tests/contract/build-code-apply-contract.test.mjs`。
- **DO NOT TOUCH**：wh-review/3rd-review provider 配置、AgentHub 源仓库、历史 review/receipt/snapshot。

### Tasks

T020 → T021 → T022 → T023 → T024。

### Verify

`npx vitest run tests/contract/spec-stage-artifact-closure.test.mjs tests/contract/build-code-apply-contract.test.mjs tests/contract/scope-revision-contract.test.mjs tests/contract/review-materials-contract.test.mjs`；`npm run check:skill-closure`；不跑 `npm test`，不调用 provider。

### Knowledge

AgentHub apply 的可吸收内容是 Phase Card、RED/GREEN、风险测试、报告、finding disposition 和 handoff；其 pass/commit/worktree/session/full-suite gate 与 WorkflowHub Constitution 冲突，明确不迁移。

### STOP

必须新增 public stage、permit、ledger、provider 配置、强制 commit/full-suite gate，或报告无法绑定当前 snapshot 时停止并记录 unknown/incomplete。

### Done

四个 spec 内容 skill/template 能被所属 stage 解析；build-code 能按 changed files 选择 blueprint 和适用 executor；每 Phase/最终收口的测试事实能回放；一次 scope_revision review packet 已生成并记录真实状态。

### Risks and rollback

模板和测试报告会增加输入成本；用唯一模板和风险分层控制成本。回滚只撤回本轮新增文件和当前材料 revision，不删除历史 provenance/失败事实。

#### T020 — 恢复 spec/plan/tasks 内容合同

- **ID**：T020
- **Phase**：Phase 8：恢复内容合同与 apply 测试闭环
- **goal**：让 build-spec/build-plan 使用可搬运、可闭环的内容 skill/template。
- **design_state**：`ready`
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"de8cef1b5d68c8c1bdaa79d445f84a2be3b73c162454603fbcad256aeaaa4fdd","id":"SPEC"}]`
- **输入**：D45、R20、历史 `775b57f` 删除事实。
- **依赖**：T019
- **并行**：否 — stage manifest、catalog 和模板必须一起收口。
- **FR**：FR-022
- **AC**：AC-025
- **动作**：恢复四个 spec skill、三个模板、bundle、stage inline 依赖和 catalog/reuse registry closure；不新增第二材料真相。
- **精确文件**：`skills/spec-specify/SKILL.md`; `skills/spec-specify/templates/spec-template.md`; `skills/spec-specify/skill-bundle.json`; `skills/spec-clarify/SKILL.md`; `skills/spec-clarify/skill-bundle.json`; `skills/spec-plan/SKILL.md`; `skills/spec-plan/templates/plan-template.md`; `skills/spec-plan/skill-bundle.json`; `skills/spec-tasks/SKILL.md`; `skills/spec-tasks/templates/tasks-template.md`; `skills/spec-tasks/skill-bundle.json`; `workflows/build-spec/skill-deps.yaml`; `workflows/build-plan/skill-deps.yaml`; `skills/catalog.yaml`; `tests/contract/spec-stage-artifact-closure.test.mjs`。
- **boundary**：files: 上述路径；symbols/regions: skill content contract、template fields、manifest/catalog closure。
- **输出**：可解析的 spec/plan/tasks 内容合同和模板。
- **Knowledge**：旧模板只读用于字段对照；当前 stage SKILL 仍是唯一编排入口。
- **verification_role**：N/A — non-behavior change: content contract and closure
- **paired_task**：N/A — non-behavior change: no RED/GREEN pair
- **gate_cmd**：`npx vitest run tests/contract/spec-stage-artifact-closure.test.mjs && npm run check:skill-closure`
- **expected_exit**：0
- **oracle**：模板字段和 manifest/catalog/bundle/registry closure 均存在且无第二控制面。
- **evidence_path**：`quality/tests/spec-stage-artifact-closure-20260805.json`
- **STOP**：缺字段、hash/closure 不一致、出现第二计划格式时停止。
- **recovery**：只撤回 T020 新增 skill/template 和 manifest/catalog 修改。
- **task risk**：恢复旧字段时误引入旧宿主或 gate 依赖。
- **Workflow stage**：build-code
- **source_refs / decision_refs**：R20 → D45 → FR-022
- **execution_file_paths**：`skills/spec-specify/SKILL.md`; `skills/spec-specify/templates/spec-template.md`; `skills/spec-specify/skill-bundle.json`; `skills/spec-clarify/SKILL.md`; `skills/spec-clarify/skill-bundle.json`; `skills/spec-plan/SKILL.md`; `skills/spec-plan/templates/plan-template.md`; `skills/spec-plan/skill-bundle.json`; `skills/spec-tasks/SKILL.md`; `skills/spec-tasks/templates/tasks-template.md`; `skills/spec-tasks/skill-bundle.json`; `workflows/build-spec/skill-deps.yaml`; `workflows/build-plan/skill-deps.yaml`; `skills/catalog.yaml`; `tests/contract/spec-stage-artifact-closure.test.mjs`。
- **test_strategy_owner**：build-plan/high-intelligence-model（回填设计；不是历史执行事实）
- **test tier / test method**：feature — test-routing-advisor + testing-system-blueprint + applicable backend/frontend testing；由 build-plan 设计，build-code 执行。
- **scenarios / commands / expected exit / oracle**：成功、失败和缺证据边界按本卡原有策略；`npx vitest run tests/contract/spec-stage-artifact-closure.test.mjs && npm run check:skill-closure`；0；模板字段和 manifest/catalog/bundle/registry closure 均存在且无第二控制面。。
- **fixtures_services**：Node/Vitest 本地 fixtures；无 provider、无外部服务；若原卡另有环境限制，以原卡为准。
- **browser_route**：N/A — 本任务是 WorkflowHub runtime/材料合同，无业务 UI。
- **execution_contract**：build-code 只消费本卡已写入的命令/oracle/evidence 边界；不临场 route/blueprint/executor；缺策略写 MATERIAL_INCOMPLETE。
- **final current-snapshot aggregate strategy**：N/A — 当前快照最终聚合由 T027 的 verify-code replay 负责。
- **coverage limits**：本卡不等于原始需求语义验收；历史 receipt、provider review、用户 handoff 缺失或过期时保持 unknown/incomplete。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：恢复 `spec-specify`、`spec-clarify`、`spec-plan`、`spec-tasks` 及模板、bundle、stage inline 依赖和 catalog/reuse registry 绑定；没有新增第二份材料真相。
- **executed_commands**：`npx vitest run tests/contract/spec-stage-artifact-closure.test.mjs`（2/2）；`npm run check:skill-closure`（ok）。
- **evidence_refs**：`[{"ref":"quality/evidence/task-completion/verify-code/T020-12ca119df303937cfe68c373ef4082a05acf134438553e9ff2f4688d51485133.json","sha256":"12ca119df303937cfe68c373ef4082a05acf134438553e9ff2f4688d51485133","kind":"task_completion_current","snapshot_tree":"e4b968db05893d7e6a889e3e272e652c172a7cbb","source_digest":"ad59ad17dc213ba78a051a60db4d693d6a4b8e9a598c3ffde026b595e6551912"}]`
- **covered_ac**：AC-025。
- **review_fact**：`not-invoked-by-scope` — 本轮不调用共享 provider；内容合同和 closure 事实已保留。
- **completed_at**：`2026-08-05T15:08:00+08:00`

#### T021 — 恢复 build-code apply 顺序和交接

- **ID**：T021
- **Phase**：Phase 8：恢复内容合同与 apply 测试闭环
- **goal**：让每个 build-code Phase 具备边界、测试、差异扫描、finding 处置和 handoff 事实。
- **design_state**：`ready`
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"de8cef1b5d68c8c1bdaa79d445f84a2be3b73c162454603fbcad256aeaaa4fdd","id":"SPEC"}]`
- **输入**：D46、R21、AgentHub apply 对照。
- **依赖**：T020
- **并行**：否 — build-code 流程引用恢复后的内容合同。
- **FR**：FR-023
- **AC**：AC-026
- **动作**：补 Phase Card、RED/GREEN 后风险测试、diff/consumer scan、finding root-cause/disposition 和 plain-language handoff，并更新 steps 证据语义；不新增 gate。
- **精确文件**：`workflows/build-code/SKILL.md`; `workflows/build-code/steps.json`; `tests/contract/build-code-apply-contract.test.mjs`。
- **boundary**：files: 上述路径；symbols/regions: build-code work loop、quality/publication、step 4 evidence。
- **输出**：apply quality contract 可被 focused test 检查。
- **Knowledge**：AgentHub pass/commit/worktree/session gate 明确不迁移。
- **verification_role**：N/A — non-behavior change: workflow contract
- **paired_task**：N/A — non-behavior change: no RED/GREEN pair
- **gate_cmd**：`npx vitest run tests/contract/build-code-apply-contract.test.mjs`
- **expected_exit**：0
- **oracle**：Phase Card、风险测试、diff scan、finding disposition、handoff 存在，且没有隐藏 gate 文案。
- **evidence_path**：`quality/tests/build-code-apply-contract-20260805.json`
- **STOP**：流程要求 provider pass、commit、clean worktree 或 full-suite 才能推进时停止。
- **recovery**：只撤回 T021 的 build-code skill/steps/test 变更。
- **task risk**：文字合同和 runtime 实际执行再次漂移。
- **Workflow stage**：build-code
- **source_refs / decision_refs**：R21 → D46 → FR-023
- **execution_file_paths**：`workflows/build-code/SKILL.md`; `workflows/build-code/steps.json`; `tests/contract/build-code-apply-contract.test.mjs`。
- **test_strategy_owner**：build-plan/high-intelligence-model（回填设计；不是历史执行事实）
- **test tier / test method**：feature — test-routing-advisor + testing-system-blueprint + applicable backend/frontend testing；由 build-plan 设计，build-code 执行。
- **scenarios / commands / expected exit / oracle**：成功、失败和缺证据边界按本卡原有策略；`npx vitest run tests/contract/build-code-apply-contract.test.mjs`；0；Phase Card、风险测试、diff scan、finding disposition、handoff 存在，且没有隐藏 gate 文案。。
- **fixtures_services**：Node/Vitest 本地 fixtures；无 provider、无外部服务；若原卡另有环境限制，以原卡为准。
- **browser_route**：N/A — 本任务是 WorkflowHub runtime/材料合同，无业务 UI。
- **execution_contract**：build-code 只消费本卡已写入的命令/oracle/evidence 边界；不临场 route/blueprint/executor；缺策略写 MATERIAL_INCOMPLETE。
- **final current-snapshot aggregate strategy**：N/A — 当前快照最终聚合由 T027 的 verify-code replay 负责。
- **coverage limits**：本卡不等于原始需求语义验收；历史 receipt、provider review、用户 handoff 缺失或过期时保持 unknown/incomplete。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：补齐 Phase Card、RED/GREEN 顺序、风险测试、diff/consumer scan、finding disposition、handoff 和 final current-snapshot summary；明确 review/commit/full-suite 不作推进 gate。
- **executed_commands**：`npx vitest run tests/contract/build-code-apply-contract.test.mjs`（4/4）；`npm run smoke:skill-dispatch`（5 stages ok）。
- **evidence_refs**：`[{"ref":"quality/evidence/task-completion/verify-code/T021-0721177486c9caa8301870c66c46ee4821cae513405c996b5b21fec0b42c4edc.json","sha256":"0721177486c9caa8301870c66c46ee4821cae513405c996b5b21fec0b42c4edc","kind":"task_completion_current","snapshot_tree":"e4b968db05893d7e6a889e3e272e652c172a7cbb","source_digest":"ad59ad17dc213ba78a051a60db4d693d6a4b8e9a598c3ffde026b595e6551912"}]`
- **covered_ac**：AC-026。
- **review_fact**：`not-invoked-by-scope` — 本轮不调用共享 provider；apply 合同事实已保留。
- **completed_at**：`2026-08-05T15:08:00+08:00`

#### T022 — 接入分层测试技能（初版，已由 T024 修正设计时机）

- **ID**：T022
- **Phase**：Phase 8：恢复内容合同与 apply 测试闭环
- **goal**：恢复 AgentHub 的风险维度和分层测试方法；其设计时机由 T024 修正为 build-plan，build-code 不重复设计。
- **design_state**：`superseded_by_T024`
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"de8cef1b5d68c8c1bdaa79d445f84a2be3b73c162454603fbcad256aeaaa4fdd","id":"SPEC"}]`
- **输入**：D47、D49、R22、R23、AgentHub testing blueprint/executor 对照。
- **依赖**：T021
- **并行**：否 — 测试技能 closure 依赖 build-plan/build-code manifest。
- **FR**：FR-024
- **AC**：AC-027
- **动作**：初版接入 routing、blueprint、backend/frontend/fullstack testing skills；本轮由 T024 将它们移到 build-plan 设计输入，并把策略写入 tasks.md；不重复无关全量。
- **精确文件**：`workflows/build-plan/SKILL.md`; `workflows/build-plan/skill-deps.yaml`; `workflows/build-plan/steps.json`; `workflows/build-code/SKILL.md`; `workflows/build-code/skill-deps.yaml`; `workflows/build-code/steps.json`; `skills/test-routing-advisor/SKILL.md`; `skills/test-routing-advisor/scripts/route.mjs`; `skills/test-routing-advisor/__tests__/skill-contract.test.mjs`; `skills/test-routing-advisor/skill-bundle.json`; `skills/testing-system-blueprint/SKILL.md`; `skills/testing-system-blueprint/skill-bundle.json`; `skills/backend-testing/SKILL.md`; `skills/backend-testing/skill-bundle.json`; `skills/frontend-testing/SKILL.md`; `skills/frontend-testing/skill-bundle.json`; `skills/fullstack-slice-testing/SKILL.md`; `skills/fullstack-slice-testing/skill-bundle.json`; `skills/catalog.yaml`; `skills/reuse-registry.md`; `tests/contract/build-code-apply-contract.test.mjs`。
- **boundary**：files: 上述路径；symbols/regions: dependency closure、test quality contract、step 4 evidence。
- **输出**：风险分层测试技能闭包和可回放策略/执行字段。
- **Knowledge**：失败/unavailable/skipped 是质量事实；浏览器只在 UI 适用时调用。
- **verification_role**：N/A — non-behavior change: skill/contract change
- **paired_task**：N/A — non-behavior change: no RED/GREEN pair
- **gate_cmd**：`npx vitest run tests/contract/build-code-apply-contract.test.mjs && npm run check:skill-closure`
- **expected_exit**：0
- **oracle**：五个技能可解析并由 build-plan 声明；build-code 只消费 task strategy，steps 不要求重新 route/blueprint/executor。
- **evidence_path**：`quality/tests/build-code-testing-skills-20260805.json`（初版事实）
- **STOP**：缺 strategy 的命令/oracle/证据边界，或把执行器结果变成 pass gate 时停止。
- **recovery**：只撤回 T022 测试技能和 manifest/catalog/registry 变更。
- **task risk**：技能存在但实际调用又被 agent 跳过。
- **Workflow stage**：build-code
- **source_refs / decision_refs**：R22,R23 → D47,D49 → FR-024
- **execution_file_paths**：`workflows/build-plan/SKILL.md`; `workflows/build-plan/skill-deps.yaml`; `workflows/build-plan/steps.json`; `workflows/build-code/SKILL.md`; `workflows/build-code/skill-deps.yaml`; `workflows/build-code/steps.json`; `skills/test-routing-advisor/SKILL.md`; `skills/test-routing-advisor/scripts/route.mjs`; `skills/test-routing-advisor/__tests__/skill-contract.test.mjs`; `skills/test-routing-advisor/skill-bundle.json`; `skills/testing-system-blueprint/SKILL.md`; `skills/testing-system-blueprint/skill-bundle.json`; `skills/backend-testing/SKILL.md`; `skills/backend-testing/skill-bundle.json`; `skills/frontend-testing/SKILL.md`; `skills/frontend-testing/skill-bundle.json`; `skills/fullstack-slice-testing/SKILL.md`; `skills/fullstack-slice-testing/skill-bundle.json`; `skills/catalog.yaml`; `skills/reuse-registry.md`; `tests/contract/build-code-apply-contract.test.mjs`。
- **test_strategy_owner**：build-plan/high-intelligence-model（回填设计；不是历史执行事实）
- **test tier / test method**：feature — test-routing-advisor + testing-system-blueprint + applicable backend/frontend testing；由 build-plan 设计，build-code 执行。
- **scenarios / commands / expected exit / oracle**：成功、失败和缺证据边界按本卡原有策略；`npx vitest run tests/contract/build-code-apply-contract.test.mjs && npm run check:skill-closure`；0；五个技能可解析并由 build-plan 声明；build-code 只消费 task strategy，steps 不要求重新 route/blueprint/executor。。
- **fixtures_services**：Node/Vitest 本地 fixtures；无 provider、无外部服务；若原卡另有环境限制，以原卡为准。
- **browser_route**：N/A — 本任务是 WorkflowHub runtime/材料合同，无业务 UI。
- **execution_contract**：build-code 只消费本卡已写入的命令/oracle/evidence 边界；不临场 route/blueprint/executor；缺策略写 MATERIAL_INCOMPLETE。
- **final current-snapshot aggregate strategy**：N/A — 当前快照最终聚合由 T027 的 verify-code replay 负责。
- **coverage limits**：本卡不等于原始需求语义验收；历史 receipt、provider review、用户 handoff 缺失或过期时保持 unknown/incomplete。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：历史初版接入五个技能并让 build-code 每 Phase/最终重做设计；该事实保留，但已被 D49/T024 修正为 build-plan 设计、build-code 执行。
- **executed_commands**：`npx vitest run skills/test-routing-advisor/__tests__/skill-contract.test.mjs tests/contract/build-code-apply-contract.test.mjs`（8/8）；`npm run check:skill-closure`（ok）；`npm run smoke:skill-dispatch`（5 stages ok）。
- **evidence_refs**：`[{"ref":"quality/evidence/task-completion/verify-code/T022-a2f4bdcbffc2900595b760345e3b728ba3d0ff8a8043a92897a75b920c8c099c.json","sha256":"a2f4bdcbffc2900595b760345e3b728ba3d0ff8a8043a92897a75b920c8c099c","kind":"task_completion_current","snapshot_tree":"e4b968db05893d7e6a889e3e272e652c172a7cbb","source_digest":"ad59ad17dc213ba78a051a60db4d693d6a4b8e9a598c3ffde026b595e6551912"}]`
- **covered_ac**：AC-027。
- **review_fact**：`not-invoked-by-scope` — 本轮不调用共享 provider；初版技能 closure 事实保留，设计时机由 T024 修正。
- **completed_at**：`2026-08-05T15:08:00+08:00`

#### T023 — scope_revision 全局影响实验和一次专用审查

- **ID**：T023
- **Phase**：Phase 8：恢复内容合同与 apply 测试闭环
- **goal**：证明轻量 scope_revision 能发现四材料、沟通和全局 consumer 的遗漏，并只生成一次专用 review packet。
- **design_state**：`completed`
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"de8cef1b5d68c8c1bdaa79d445f84a2be3b73c162454603fbcad256aeaaa4fdd","id":"SPEC"}]`
- **输入**：D44-D49、R19-R23、用户 U16/U17/U18、六个子代理审计结果。
- **依赖**：T020,T021,T022
- **并行**：否 — 必须消费最终四材料和合同。
- **FR**：FR-021、FR-022、FR-023、FR-024
- **AC**：AC-024、AC-025、AC-026、AC-027
- **动作**：更新四份材料的 scope_revision 记录，加入 return_stage、main-agent Talk/Clarify/Grill、consumer coverage；运行缺 consumer/子代理沟通/未更新材料/超长摘录负测；生成一次只带 source hash/size 与受影响摘录的专用 scope_revision packet，不调用 provider。
- **精确文件**：`runtime/review/scope-revision-contract.mjs`; `skills/wh-review/contracts/scope-revision.md`; `tests/contract/scope-revision-contract.test.mjs`; `specs/requirements-completeness-audit-20260804/decision-log.md`; `specs/requirements-completeness-audit-20260804/spec.md`; `specs/requirements-completeness-audit-20260804/plan.md`; `specs/requirements-completeness-audit-20260804/tasks.md`。
- **boundary**：files: 上述路径；symbols/regions: scope_revision validator、packet contract、当前 revision 记录。
- **输出**：一次性 scope_revision contract evidence 和 provider 前缺失拦截事实。
- **Knowledge**：review verdict 不作 gate；未调用 provider 要写 `not-invoked-by-scope`。
- **verification_role**：N/A — non-behavior change: review material contract
- **paired_task**：N/A — non-behavior change: no RED/GREEN pair
- **gate_cmd**：`npx vitest run tests/contract/scope-revision-contract.test.mjs tests/contract/review-materials-contract.test.mjs`
- **task risk**：把局部 packet/contract 通过误当全局影响已闭合。
- **Workflow stage**：build-code
- **source_refs / decision_refs**：R19,R20,R21,R22,R23 → D44-D49 → FR-021/022/023/024
- **execution_file_paths**：`runtime/review/scope-revision-contract.mjs`; `skills/wh-review/contracts/scope-revision.md`; `tests/contract/scope-revision-contract.test.mjs`; `specs/requirements-completeness-audit-20260804/decision-log.md`; `specs/requirements-completeness-audit-20260804/spec.md`; `specs/requirements-completeness-audit-20260804/plan.md`; `specs/requirements-completeness-audit-20260804/tasks.md`。
- **test_strategy_owner**：build-plan/high-intelligence-model（回填设计；不是历史执行事实）
- **test tier / test method**：feature — test-routing-advisor + testing-system-blueprint + applicable backend/frontend testing；由 build-plan 设计，build-code 执行。
- **scenarios / commands / expected exit / oracle**：成功、失败和缺证据边界按本卡原有策略；`npx vitest run tests/contract/scope-revision-contract.test.mjs tests/contract/review-materials-contract.test.mjs`；0；合法材料通过；缺 consumer、非 main-agent 沟通、未更新四材料在 provider 前 `MATERIAL_INCOMPLETE`；incremental/pass-loop 被拒绝。。
- **fixtures_services**：Node/Vitest 本地 fixtures；无 provider、无外部服务；若原卡另有环境限制，以原卡为准。
- **browser_route**：N/A — 本任务是 WorkflowHub runtime/材料合同，无业务 UI。
- **execution_contract**：build-code 只消费本卡已写入的命令/oracle/evidence 边界；不临场 route/blueprint/executor；缺策略写 MATERIAL_INCOMPLETE。
- **final current-snapshot aggregate strategy**：N/A — 当前快照最终聚合由 T027 的 verify-code replay 负责。
- **coverage limits**：本卡不等于原始需求语义验收；历史 receipt、provider review、用户 handoff 缺失或过期时保持 unknown/incomplete。
- **expected_exit**：0
- **oracle**：合法材料通过；缺 consumer、非 main-agent 沟通、未更新四材料在 provider 前 `MATERIAL_INCOMPLETE`；incremental/pass-loop 被拒绝。
- **evidence_path**：`quality/tests/scope-revision-apply-quality-20260805.json`
- **STOP**：需要 provider pass、第二次 scope review、新 stage 或新 ledger 时停止。
- **recovery**：只撤回当前 revision 的四份材料和 scope contract 测试变化，不删除旧 review/failure。
- **task risk**：轻量流程变成只检查字段、不检查全局影响。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：已完成 D45-D49 的四材料记录；恢复 spec 内容 skill/template、build-code apply 顺序、任务级测试策略设计和 bounded scope_revision packet；scope_revision validator 增加主代理沟通、consumer coverage、source hash/size、bounded excerpt 和 packet size 保护。
- **executed_commands**：`npx vitest run tests/contract/scope-revision-contract.test.mjs tests/contract/review-materials-contract.test.mjs`（8/8）；`npx vitest run skills/test-routing-advisor/__tests__/skill-contract.test.mjs tests/contract/scope-revision-contract.test.mjs tests/contract/spec-stage-artifact-closure.test.mjs tests/contract/build-code-apply-contract.test.mjs`（14/14）；`npm run check:skill-closure`（ok）；`npm run smoke:skill-dispatch`（5 stages ok）；真实 bounded packet 生成（约 74.7 KiB，inline_complete）。
- **evidence_refs**：`[{"ref":"quality/evidence/task-completion/verify-code/T023-f0268f45e33946457c64b8b8f24944d525d0fecc9e788a2ddfe615fc68c088e0.json","sha256":"f0268f45e33946457c64b8b8f24944d525d0fecc9e788a2ddfe615fc68c088e0","kind":"task_completion_current","snapshot_tree":"e4b968db05893d7e6a889e3e272e652c172a7cbb","source_digest":"ad59ad17dc213ba78a051a60db4d693d6a4b8e9a598c3ffde026b595e6551912"}]`
- **evidence_note**：bounded packet 仅作为当前事实，不伪造额外 canonical receipt。
- **covered_ac**：AC-024、AC-025、AC-026、AC-027；其中 AC-024 增加 bounded excerpt/source hash/packet size 边界，AC-027 的设计时机由 T024 修正。
- **review_fact**：`not-invoked-by-scope` — provider 未调用，不写成 pass；bounded packet 已生成，专用合同负测已通过。
- **completed_at**：`2026-08-05T15:08:00+08:00`

#### T024 — 把每 Task/Phase/final 测试策略固化到 tasks.md

- **ID**：T024
- **Phase**：Phase 8：恢复内容合同与 apply 测试闭环
- **goal**：让高智力 build-plan 模型设计测试，普通 build-code 模型只按任务卡执行，不在每个 Phase 重新 route/blueprint/executor。
- **design_state**：`ready`
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"de8cef1b5d68c8c1bdaa79d445f84a2be3b73c162454603fbcad256aeaaa4fdd","id":"SPEC"}]`
- **输入**：D49、R23、FR-024/FR-025、AC-027/AC-028、T022 初版修正事实。
- **依赖**：T023
- **并行**：否 — 必须先消费当前四材料和已经修正的阶段合同。
- **FR**：FR-024、FR-025
- **AC**：AC-027、AC-028
- **动作**：在每个未来 Task/Phase 卡中固化 `test_strategy_owner`、tier、scenarios、commands、expected exit、oracle、fixtures/services、适用测试方法、browser route、evidence path、coverage limits、snapshot 绑定和 `build-code` 执行契约；为最终聚合建立专门策略卡；build-code 只执行已记录策略并补写实际结果；缺策略时标记 `MATERIAL_INCOMPLETE` 并回到当前材料修复。
- **test_strategy_owner**：build-plan/high-intelligence-model（历史卡原有字段规范化；不是历史执行事实）
- **test tier**：`feature` — WorkflowHub stage/skill/contract 跨多个阶段，但不改运行时业务接口
- **scenarios**：build-plan 写入每 Task/Phase/final 的成功、失败、状态/数据、seam/UI 适用策略；build-code 读取后直接执行；缺字段输出 `MATERIAL_INCOMPLETE`
- **commands / expected exit / oracle**：`npx vitest run skills/test-routing-advisor/__tests__/skill-contract.test.mjs tests/contract/spec-stage-artifact-closure.test.mjs tests/contract/build-code-apply-contract.test.mjs tests/contract/scope-revision-contract.test.mjs tests/contract/review-materials-contract.test.mjs` / `0` / `TASK-TEST-STRATEGY-001`：五个设计技能在 build-plan、build-code manifest 排除、steps 只消费 strategy/result、当前 contract 通过
- **fixtures/services**：本地 skill resolver、Vitest、当前四份材料；无 provider、无浏览器、无外部服务
- **test method**：`backend-testing`、`frontend-testing`、`fullstack-slice-testing` 作为 build-plan 设计输入；本任务是流程/文档契约，build-code 不重新调用
- **browser route**：`N/A — non-UI workflow contract`
- **evidence path**：`quality/tests/task-test-strategy-contract-20260805.json`
- **coverage limits**：不覆盖 provider 实际调用、业务项目页面和完整回归；这些保持 `not-invoked-by-scope` 或延期
- **execution contract**：`build-code` 只执行 tasks.md 已记录命令/oracle，不重新 route/blueprint/executor；策略缺失保持 `MATERIAL_INCOMPLETE`
- **精确文件**：`skills/spec-tasks/SKILL.md`; `skills/spec-tasks/templates/tasks-template.md`; `workflows/build-plan/SKILL.md`; `workflows/build-plan/skill-deps.yaml`; `workflows/build-plan/steps.json`; `workflows/build-code/SKILL.md`; `workflows/build-code/skill-deps.yaml`; `workflows/build-code/steps.json`; `skills/test-routing-advisor/SKILL.md`; `skills/test-routing-advisor/scripts/route.mjs`; `skills/test-routing-advisor/__tests__/skill-contract.test.mjs`; `skills/test-routing-advisor/skill-bundle.json`; `skills/testing-system-blueprint/SKILL.md`; `skills/testing-system-blueprint/skill-bundle.json`; `skills/backend-testing/SKILL.md`; `skills/backend-testing/skill-bundle.json`; `skills/frontend-testing/SKILL.md`; `skills/frontend-testing/skill-bundle.json`; `skills/fullstack-slice-testing/SKILL.md`; `skills/fullstack-slice-testing/skill-bundle.json`; `tests/contract/spec-stage-artifact-closure.test.mjs`; `tests/contract/build-code-apply-contract.test.mjs`; `skills/catalog.yaml`; `skills/reuse-registry.md`。
- **Workflow stage**：build-code
- **source_refs / decision_refs**：R23 → D49,D50 → FR-024/025
- **execution_file_paths**：`skills/spec-tasks/SKILL.md`; `skills/spec-tasks/templates/tasks-template.md`; `workflows/build-plan/SKILL.md`; `workflows/build-plan/skill-deps.yaml`; `workflows/build-plan/steps.json`; `workflows/build-code/SKILL.md`; `workflows/build-code/skill-deps.yaml`; `workflows/build-code/steps.json`; `skills/test-routing-advisor/SKILL.md`; `skills/test-routing-advisor/scripts/route.mjs`; `skills/test-routing-advisor/__tests__/skill-contract.test.mjs`; `skills/test-routing-advisor/skill-bundle.json`; `skills/testing-system-blueprint/SKILL.md`; `skills/testing-system-blueprint/skill-bundle.json`; `skills/backend-testing/SKILL.md`; `skills/backend-testing/skill-bundle.json`; `skills/frontend-testing/SKILL.md`; `skills/frontend-testing/skill-bundle.json`; `skills/fullstack-slice-testing/SKILL.md`; `skills/fullstack-slice-testing/skill-bundle.json`; `tests/contract/spec-stage-artifact-closure.test.mjs`; `tests/contract/build-code-apply-contract.test.mjs`; `skills/catalog.yaml`; `skills/reuse-registry.md`。
- **test tier / test method**：feature — test-routing-advisor + testing-system-blueprint + applicable backend/frontend testing；由 build-plan 设计，build-code 执行。
- **scenarios / commands / expected exit / oracle**：成功、失败和缺证据边界按本卡原有策略；`npx vitest run tests/contract/spec-stage-artifact-closure.test.mjs tests/contract/build-code-apply-contract.test.mjs && npm run check:skill-closure`；0；build-plan 声明五个测试设计技能；tasks template 有完整 strategy 字段；build-code manifest 不含五个设计技能；steps 只要求 strategy/test/result；没有 per-Phase route/blueprint/executor 设计循环，也没有 AgentHub gate。。
- **fixtures_services**：Node/Vitest 本地 fixtures；无 provider、无外部服务；若原卡另有环境限制，以原卡为准。
- **browser_route**：N/A — 本任务是 WorkflowHub runtime/材料合同，无业务 UI。
- **execution_contract**：build-code 只消费本卡已写入的命令/oracle/evidence 边界；不临场 route/blueprint/executor；缺策略写 MATERIAL_INCOMPLETE。
- **final current-snapshot aggregate strategy**：N/A — 当前快照最终聚合由 T027 的 verify-code replay 负责。
- **boundary**：files: 上述路径；symbols/regions: task test_strategy 字段、build-plan design closure、build-code run-tests/publish-code-result evidence。
- **输出**：普通 build-code 模型可以直接按 tasks.md 的命令/oracle 执行；策略缺失会显式暴露，不由执行模型猜测。
- **Knowledge**：高智力设计与普通执行分离降低重复成本，但策略质量是上游风险；不恢复 pass/commit/full-suite gate。
- **verification_role**：N/A — non-behavior change: workflow contract
- **paired_task**：N/A — non-behavior change: no RED/GREEN pair
- **gate_cmd**：`npx vitest run tests/contract/spec-stage-artifact-closure.test.mjs tests/contract/build-code-apply-contract.test.mjs && npm run check:skill-closure`
- **expected_exit**：0
- **oracle**：build-plan 声明五个测试设计技能；tasks template 有完整 strategy 字段；build-code manifest 不含五个设计技能；steps 只要求 strategy/test/result；没有 per-Phase route/blueprint/executor 设计循环，也没有 AgentHub gate。
- **evidence_path**：`quality/tests/task-test-strategy-contract-20260805.json`
- **STOP**：任务卡只有“运行测试”而无命令/oracle/evidence/limits，或执行模型被要求临场选择测试方案。
- **recovery**：只撤回 T024 的 stage/template/skill contract 变化，不删除历史测试失败或审查事实。
- **task risk**：build-plan 策略写得过于笼统，普通模型仍需猜测；focused contract 只能检查字段存在，真实语义由后续 build-code/verify-code 验证。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：完成 D49/R23/D50：五个测试技能移入 build-plan 设计依赖；tasks 模板固化 strategy owner、tier、场景、命令、expected exit、oracle、fixture/service、browser/evidence、coverage limits 和 build-code 执行契约；完成区明确只接受 TaskKernel 可认证的 canonical `evidence_refs`，控制台标签只能进 `evidence_note`；build-code manifest/steps 改为只消费 strategy 并记录结果；增加 AC-028 和对应 focused contract；同时修正 Phase 8 plan/tasks 文件边界逐字一致、非行为任务 reason 字段，plan-task.v3 当前材料验证通过。
- **executed_commands**：`npx vitest run skills/test-routing-advisor/__tests__/skill-contract.test.mjs tests/contract/spec-stage-artifact-closure.test.mjs tests/contract/build-code-apply-contract.test.mjs tests/contract/scope-revision-contract.test.mjs tests/contract/review-materials-contract.test.mjs tests/decision-log-content-contract.test.mjs tests/spec-content-profile.test.mjs tests/verify-requirement-replay-contract.test.mjs`（41/41）；`npm run check:skill-closure`（ok）；`npm run smoke:skill-dispatch`（5 stages ok）；`node tools/cli/verify-structure.mjs`（PASS）；`node --input-type=module ... validatePlanTaskContract(...)`（plan-task-v3: ok）；`git diff --check`（ok）。
- **evidence_refs**：`[{"ref":"quality/evidence/task-completion/verify-code/T024-caa6b11ed19327d5a5f350beb5b6f4367375d4e461577aa6342660cf5d59e089.json","sha256":"caa6b11ed19327d5a5f350beb5b6f4367375d4e461577aa6342660cf5d59e089","kind":"task_completion_current","snapshot_tree":"e4b968db05893d7e6a889e3e272e652c172a7cbb","source_digest":"ad59ad17dc213ba78a051a60db4d693d6a4b8e9a598c3ffde026b595e6551912"}]`
- **evidence_note**：结构验收和差异检查作为同一当前快照的附加事实。
- **covered_ac**：AC-027、AC-028。
- **review_fact**：本轮不调用共享 provider；scope_revision review fact 保持 `not-invoked-by-scope`
- **completed_at**：`2026-08-05T15:33:00+08:00`

## Phase 9：内容映射、阶段进度和语义状态修正

### Goal

把本轮新增的测试策略、测试技能使用、前三阶段进度、后两阶段执行路径、scope_revision
和 `decision-log → spec → plan → tasks` 映射固化进恢复后的高质量内容合同，并明确当前
任务哪些只是结构/局部实现、哪些仍未完成语义验收。

### Files

- **MODIFY**：`skills/spec-specify/SKILL.md`; `skills/spec-specify/templates/spec-template.md`; `skills/spec-clarify/SKILL.md`; `skills/spec-plan/SKILL.md`; `skills/spec-plan/templates/plan-template.md`; `skills/spec-tasks/SKILL.md`; `skills/spec-tasks/templates/tasks-template.md`。
- **MODIFY**：`runtime/stage/completion-predicates.mjs`; `runtime/stage/stage-handlers.mjs`; `workflows/verify-code/SKILL.md`; `skills/catalog.yaml`; `skills/spec-specify/skill-bundle.json`; `skills/spec-clarify/skill-bundle.json`; `skills/spec-plan/skill-bundle.json`; `skills/spec-tasks/skill-bundle.json`; `specs/requirements-completeness-audit-20260804/decision-log.md`; `specs/requirements-completeness-audit-20260804/spec.md`; `specs/requirements-completeness-audit-20260804/plan.md`; `specs/requirements-completeness-audit-20260804/tasks.md`。
- **MODIFY**：`tests/contract/spec-stage-artifact-closure.test.mjs`。
- **MODIFY**：`tests/stage-plan-task-contract-v3.test.mjs`。
- **NEW**：`tests/contract/stage-progress-contract.test.mjs`。
- **MODIFY**：`tests/verify-requirement-replay-contract.test.mjs`; `tests/decision-log-content-contract.test.mjs`。
- **MODIFY**：`skills/wh-review/scripts/review-materials.mjs`; `skills/wh-review/SKILL.md`; `tests/contract/review-materials-contract.test.mjs`。
- **DO NOT TOUCH**：wh-review/3rd-review provider 配置、AgentHub 源仓库、历史质量事实。

### Tasks

T025 → T026 → T028 → T029 → T027；T025 先补内容映射和测试策略合同，T026 再补进度/路径派生，
T028 回填当前旧任务卡，T029 收口执行中暴露的历史证据兼容问题，T027 最后做当前原始/新增需求的语义回放和 honest status 收口。

### Verify

运行 `tests/contract/spec-stage-artifact-closure.test.mjs`、
`tests/contract/stage-progress-contract.test.mjs` 和受影响的
`tests/contract/build-code-apply-contract.test.mjs`；不运行无关全量回归、不调用 provider。

### Knowledge

历史高水位内容来自删除前可读提交 `5af7349554cdfbb0bfa5c502484d12c69e620188`，
组合恢复点为 `c3e1b1c5b29e5c0aa35beca7718787b4c7a95faf`；本阶段只加当前 WorkflowHub
扩展，不把历史版本或日志声明当作当前语义证据。

### STOP

如果需要新增第二份需求账本、隐藏质量 gate、provider 配置、全量回归循环，或无法取得
当前 receipt 就要宣称全量完成，停止并记录 `unknown/incomplete`。

### Done

四个内容 skill/template 明确记录来源映射、scope_revision、测试策略和阶段进度；当前
plan/tasks 可显示真实进度与执行路径；语义回放能保留 missing receipt、needs_human、
deferred 和 unavailable，而不把结构完成误报为正式验收。

### Risks and rollback

字段增加会提高模板输入成本；通过只保存 ID/状态/refs、不复制正文控制体积。回滚只撤回
本阶段扩展和派生检查，不删除历史决策、review、失败或延期事实。

#### T025 — 固化 decision-log 映射与测试策略合同

- **ID**：T025
- **Phase**：Phase 9：内容映射、阶段进度和语义状态修正
- **Workflow stage**：build-plan
- **goal**：让 spec/plan/tasks 内容 skill/template 明确来源映射、scope_revision 和高智力测试策略设计边界。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"a887a44d769b9c798f0b7c61a4fdc34110bc66920a56b8df563202c6865234d9","id":"SPEC"},{"artifact_kind":"plan","ref":"plan.md","hash":"9aa53259366f151bcf80044d45540869ad74bf5e62bd14530429f7433afad48a","id":"PLAN"}]`
- **输入**：D45、D47、D49、当前四份内容 skill/template 和历史 provenance 对照。
- **source_refs / decision_refs**：R20、R22、R23 → D45、D47、D49 → FR-024/025/026 → AC-027/028/029
- **依赖**：T024
- **并行**：否 — 先补内容合同，再由进度合同消费。
- **FR**：FR-024、FR-025、FR-026
- **AC**：AC-027、AC-028、AC-029
- **动作**：在四个 spec 内容 skill/template 中补 `source_refs/decision_refs`、测试策略、final aggregate、build-code only execute、scope_revision 影响映射和历史 provenance；同步 bundle/catalog。
- **输出**：四个内容 skill/template 可复用，且 bundle/catalog hash 与实际文件一致。
- **Knowledge**：高水位 Git provenance、当前 Constitution 和四份材料职责边界。
- **精确文件**：`skills/spec-specify/SKILL.md`; `skills/spec-specify/templates/spec-template.md`; `skills/spec-clarify/SKILL.md`; `skills/spec-plan/SKILL.md`; `skills/spec-plan/templates/plan-template.md`; `skills/spec-tasks/SKILL.md`; `skills/spec-tasks/templates/tasks-template.md`; `skills/catalog.yaml`; `skills/spec-specify/skill-bundle.json`; `skills/spec-clarify/skill-bundle.json`; `skills/spec-plan/skill-bundle.json`; `skills/spec-tasks/skill-bundle.json`
- **execution_file_paths**：`skills/spec-specify/SKILL.md`; `skills/spec-specify/templates/spec-template.md`; `skills/spec-clarify/SKILL.md`; `skills/spec-plan/SKILL.md`; `skills/spec-plan/templates/plan-template.md`; `skills/spec-tasks/SKILL.md`; `skills/spec-tasks/templates/tasks-template.md`; `skills/catalog.yaml`; `skills/spec-specify/skill-bundle.json`; `skills/spec-clarify/skill-bundle.json`; `skills/spec-plan/skill-bundle.json`; `skills/spec-tasks/skill-bundle.json`
- **boundary**：files: 上述精确文件；symbols/regions: 内容合同字段、来源映射、bundle/catalog hash。
- **verification_role**：N/A — non-behavior change: content contract
- **paired_task**：N/A — non-behavior change: no RED/GREEN pair
- **test_strategy_owner**：`build-plan/high-intelligence-model`
- **test tier / test method**：`simple` — skill/template content contract and bundle closure。
- **scenarios / commands / expected exit / oracle**：来源映射、scope_revision、测试策略字段可读且不复制正文；使用本卡 gate_cmd；expected exit `0`；ORACLE-SPEC-CONTENT：缺来源或第二权威时失败。
- **fixtures_services**：`N/A — 纯内容合同`
- **browser_route**：`N/A — 无浏览器界面`
- **execution_contract**：build-code 不执行本卡的设计工作；后续 Task 只消费已写入的策略。
- **final current-snapshot aggregate strategy**：`N/A — 由 T027 负责`
- **gate_cmd**：`npx vitest run tests/contract/spec-stage-artifact-closure.test.mjs`
- **expected_exit**：0
- **oracle**：新增字段可读、来源 ID 可回到 decision-log、没有第二份需求正文；历史删除前来源保持可核对。
- **evidence_path**：`quality/tests/spec-content-contract-current-20260805.json`
- **coverage_limits**：不证明当前每条 AC 已语义验收；不调用 provider。
- **STOP**：只能靠模板字段存在宣称全量语义完成时停止。
- **recovery**：只回滚 T025 的内容合同扩展和 hash 绑定，不删除历史版本。
- **task risk**：字段增加后形成第二份真相或误把模板 closure 当语义验收。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：已修改当前 skill/template 和材料；bundle/catalog hash 已同步，skill closure 已通过；语义是否全部验收由 verify-code 独立记录，未从本卡结构事实推导通过。
- **executed_commands**：当前闭环聚焦回归 `npx vitest run skills/test-routing-advisor/__tests__/skill-contract.test.mjs tests/contract/spec-stage-artifact-closure.test.mjs tests/contract/build-code-apply-contract.test.mjs tests/contract/scope-revision-contract.test.mjs tests/contract/review-materials-contract.test.mjs tests/decision-log-content-contract.test.mjs tests/spec-content-profile.test.mjs tests/verify-requirement-replay-contract.test.mjs tests/contract/stage-progress-contract.test.mjs tests/stage-plan-task-contract-v3.test.mjs`；`exit_code=0`。
- **evidence_refs**：`[{"ref":"quality/evidence/task-completion/verify-code/T025-7d56352878cb6467e1114bd69089e1508538b3a23369a4bdab7a9231e9375b7d.json","sha256":"7d56352878cb6467e1114bd69089e1508538b3a23369a4bdab7a9231e9375b7d","kind":"task_completion_current","snapshot_tree":"e4b968db05893d7e6a889e3e272e652c172a7cbb","source_digest":"ad59ad17dc213ba78a051a60db4d693d6a4b8e9a598c3ffde026b595e6551912"}]`
- **covered_ac**：AC-027、AC-028、AC-029
- **review_fact**：`not-invoked-by-scope` — 不调用共享 provider
- **completed_at**：`2026-08-05T18:52:00+08:00`

#### T026 — 派生阶段进度和执行文件路径

- **ID**：T026
- **Phase**：Phase 9：内容映射、阶段进度和语义状态修正
- **Workflow stage**：build-plan / build-code / verify-code
- **goal**：让 plan.md 追踪前三阶段，tasks.md 追踪 build-code/verify-code，并让 runtime 读取这些进度而不把 quality 当 gate。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"a887a44d769b9c798f0b7c61a4fdc34110bc66920a56b8df563202c6865234d9","id":"SPEC"},{"artifact_kind":"plan","ref":"plan.md","hash":"9aa53259366f151bcf80044d45540869ad74bf5e62bd14530429f7433afad48a","id":"PLAN"}]`
- **输入**：D13、D45、D49、D50、当前 plan/tasks 和 runtime progress consumer。
- **source_refs / decision_refs**：R13、R20、R23 → D13、D45、D49、D50 → FR-027/028 → AC-030
- **依赖**：T025
- **并行**：否 — 进度索引必须先于语义回放。
- **FR**：FR-027、FR-028
- **AC**：AC-030
- **动作**：增加 plan/tasks 唯一 stage-progress 索引，增加 `Workflow stage`/`execution_file_paths` 约束，并让 runtime 派生声明进度；质量状态、review 和 handoff 保持独立。
- **输出**：当前进度可从 plan/tasks 读取，精确执行路径受 Phase 边界约束。
- **Knowledge**：当前 `deriveStageProgress`、plan-task contract 和四份材料唯一权威规则。
- **精确文件**：`runtime/stage/completion-predicates.mjs`; `tests/contract/stage-progress-contract.test.mjs`; `specs/requirements-completeness-audit-20260804/plan.md`; `specs/requirements-completeness-audit-20260804/tasks.md`
- **execution_file_paths**：`runtime/stage/completion-predicates.mjs`; `tests/contract/stage-progress-contract.test.mjs`; `specs/requirements-completeness-audit-20260804/plan.md`; `specs/requirements-completeness-audit-20260804/tasks.md`
- **boundary**：files: 上述精确文件；symbols/regions: stage progress parser/validator 和当前进度索引。
- **verification_role**：N/A — non-behavior change: progress projection
- **paired_task**：N/A — non-behavior change: no RED/GREEN pair
- **test_strategy_owner**：`build-plan/high-intelligence-model`
- **test tier / test method**：`simple` — progress parser/validator and exact-path contract。
- **scenarios / commands / expected exit / oracle**：缺阶段行、glob、quality gate 混写时失败；使用本卡 gate_cmd；expected exit `0`；ORACLE-STAGE-PROGRESS：声明进度可读且 quality 独立。
- **fixtures_services**：`N/A — 纯材料和 runtime parser`
- **browser_route**：`N/A — 无浏览器界面`
- **execution_contract**：build-code/verify-code 只读取声明进度，不把它当质量或授权事实。
- **final current-snapshot aggregate strategy**：`N/A — 由 T027 负责`
- **gate_cmd**：`npx vitest run tests/contract/stage-progress-contract.test.mjs`
- **expected_exit**：0
- **oracle**：缺阶段行、glob 路径或 quality gate 误用时测试失败；当前可显示 completed/incomplete。
- **evidence_path**：`quality/tests/stage-progress-contract-current-20260805.json`
- **coverage_limits**：不证明实际 build-code/verify-code 已完成；只证明进度合同和派生读取。
- **STOP**：不得新增 progress ledger、permit 或 successor/reopen 控制面。
- **recovery**：只回滚 stage-progress parser、focused contract 和当前索引，不删除 TaskKernel/历史事实。
- **task risk**：手写进度过时，或把 quality_status 错写成 progression gate。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：已补当前 plan/tasks 进度索引、runtime 派生读取和 focused contract；plan-task 与 executable minimum 校验均通过；quality_status 和 handoff 仍独立保留。
- **executed_commands**：当前闭环聚焦回归包含 `npx vitest run tests/contract/stage-progress-contract.test.mjs`；`exit_code=0`，并通过当前任务合同回归。
- **evidence_refs**：`[{"ref":"quality/evidence/task-completion/verify-code/T026-0d05dde0b83a0b411b4b351b625d08d5a48eea2b79df8bffee5fe2993549e749.json","sha256":"0d05dde0b83a0b411b4b351b625d08d5a48eea2b79df8bffee5fe2993549e749","kind":"task_completion_current","snapshot_tree":"e4b968db05893d7e6a889e3e272e652c172a7cbb","source_digest":"ad59ad17dc213ba78a051a60db4d693d6a4b8e9a598c3ffde026b595e6551912"}]`
- **covered_ac**：AC-030
- **review_fact**：`not-invoked-by-scope` — 不调用共享 provider
- **completed_at**：`2026-08-05T18:52:00+08:00`

#### T028 — 回填当前旧任务卡的内容合同字段

- **ID**：T028
- **Phase**：Phase 9：内容映射、阶段进度和语义状态修正
- **Workflow stage**：build-plan / build-code / verify-code
- **goal**：把 T001-T024 逐张补齐恢复后任务合同要求的来源关系、阶段、精确执行路径、测试策略和覆盖限制，避免旧卡继续依赖执行模型临场猜测。
- **design_state**：in_progress
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"a887a44d769b9c798f0b7c61a4fdc34110bc66920a56b8df563202c6865234d9","id":"SPEC"},{"artifact_kind":"plan","ref":"plan.md","hash":"9aa53259366f151bcf80044d45540869ad74bf5e62bd14530429f7433afad48a","id":"PLAN"}]`
- **输入**：D51-D56、R20/R23、恢复后的 `spec-tasks` skill/template、Phase.Files、T001-T024 原始卡和现有命令/oracle/证据事实。
- **source_refs / decision_refs**：R20、R23 → D51、D52、D53、D55、D56、D57 → FR-009/026/028/029 → AC-009/029/030/031
- **依赖**：T026
- **并行**：否 — 必须先消费 plan/tasks 的当前进度和 Phase 文件边界。
- **FR**：FR-026、FR-028、FR-029
- **AC**：AC-029、AC-030、AC-031
- **动作**：逐张补 `source_refs/decision_refs`、`Workflow stage`、`execution_file_paths`、`test_strategy_owner`、test tier/method、场景/命令/oracle、fixture/service、evidence path、coverage limits、snapshot 和 execution contract；无法从历史事实核实的字段保持 `unknown/incomplete`，不改写旧 completion facts。
- **精确文件**：`specs/requirements-completeness-audit-20260804/tasks.md`; `tests/contract/spec-stage-artifact-closure.test.mjs`; `skills/wh-review/scripts/review-materials.mjs`; `skills/wh-review/SKILL.md`; `tests/contract/review-materials-contract.test.mjs`
- **execution_file_paths**：`specs/requirements-completeness-audit-20260804/tasks.md`; `tests/contract/spec-stage-artifact-closure.test.mjs`; `skills/wh-review/scripts/review-materials.mjs`; `skills/wh-review/SKILL.md`; `tests/contract/review-materials-contract.test.mjs`
- **boundary**：files: 上述精确文件；symbols/regions: T001-T024 任务卡的新增合同字段、当前卡片结构断言和 provider-derived material host-path redaction。
- **输出**：每张当前 Task 都能从 decision-log → spec → plan → tasks 回放，并能直接执行记录的最小测试策略；旧证据缺口仍显式保留。
- **Knowledge**：T001-T024 的既有命令、oracle 和完成区是只读事实；不能从日志摘要反推不存在的 receipt。
- **verification_role**：N/A — non-behavior change: task-card contract backfill
- **paired_task**：N/A — non-behavior change: no RED/GREEN pair
- **test_strategy_owner**：`build-plan/high-intelligence-model`
- **test tier / test method**：`simple` — Markdown/card structure contract; 不替代实际 build-code/verify-code 语义回放。
- **scenarios / commands / expected exit / oracle**：所有 T001-T024 卡可解析且字段完整；`npx vitest run tests/contract/spec-stage-artifact-closure.test.mjs`；expected exit `0`；ORACLE-TASK-CARD-CONTRACT：缺字段、glob、越界路径或第二完成权威时失败。
- **fixtures_services**：`N/A — 纯材料和结构合同，无外部服务`
- **browser_route**：`N/A — 无浏览器界面`
- **evidence_path**：`quality/tests/current-task-card-contract-20260805.json`
- **coverage limits**：只证明字段和路径合同，不证明旧 Task 的实现、AC 语义或历史 receipt 仍可读。
- **execution_contract**：build-code 只消费回填后的策略；字段缺失写 `MATERIAL_INCOMPLETE`，不得临场设计。
- **final current-snapshot aggregate strategy**：`N/A — 由 T027 的 verify-code replay 负责；本卡只修任务卡输入合同`
- **gate_cmd**：`npx vitest run tests/contract/spec-stage-artifact-closure.test.mjs tests/contract/review-materials-contract.test.mjs`
- **expected_exit**：0
- **oracle**：ORACLE-TASK-CARD-CONTRACT — T001-T024 均有来源、阶段、精确路径、strategy、命令、oracle 和 coverage limits，且 execution paths 都在所属 Phase 文件边界内。
- **STOP**：任一旧卡无法从当前 Phase Files 派生精确路径，或只能靠猜测补 source/strategy/evidence；回到当前材料并保持 unknown/incomplete。
- **recovery**：只回滚 T028 新增字段和结构断言，保留历史卡片、review、失败和延期事实。
- **task risk**：回填时把历史日志里的声明误当当前 receipt，或扩大 Phase 文件边界。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：已为 T001-T024 回填 `source_refs/decision_refs`、`Workflow stage`、精确 `execution_file_paths`、测试策略和 coverage limits；新增合同测试同时检查路径存在、无目录/glob、Phase 边界和 build-code 执行契约。未补造历史 receipt 或完成事实。
- **executed_commands**：当前闭环聚焦回归包含 `npx vitest run tests/contract/spec-stage-artifact-closure.test.mjs`；`exit_code=0`；这些是任务卡合同事实，不等于全量语义验收。
- **evidence_refs**：`[{"ref":"quality/evidence/task-completion/verify-code/T028-c067e26b26ac885d42a4e2e8a259f45ea020628f3cb5a2758c5a1262a72d8a69.json","sha256":"c067e26b26ac885d42a4e2e8a259f45ea020628f3cb5a2758c5a1262a72d8a69","kind":"task_completion_current","snapshot_tree":"e4b968db05893d7e6a889e3e272e652c172a7cbb","source_digest":"ad59ad17dc213ba78a051a60db4d693d6a4b8e9a598c3ffde026b595e6551912"}]`
- **covered_ac**：AC-029、AC-030、AC-031
- **review_fact**：`material-only independent review`；attempt `65786668-a553-4001-8073-1626b2abb523`，aggregate `semantic/pass`，3/1 eligible reviewers，9 findings classified `invalid_anchor`、1 `minor`；原始 findings 已转入 decision-log 逐条处置，verdict 不作 gate。review 未验证业务实现或当前 canonical replay evidence。
- **completed_at**：`2026-08-05T18:52:00+08:00`

#### T029 — 修复历史证据缺失的非门禁兼容和 hash 回退

- **ID**：T029
- **Phase**：Phase 9：内容映射、阶段进度和语义状态修正
- **Workflow stage**：build-code / verify-code
- **goal**：修复聚焦回归发现的历史 completion evidence 缺失抛错和 bytes-only hash 误报，同时保持非 ENOENT 错误 fail-loud。
- **design_state**：in_progress
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"a887a44d769b9c798f0b7c61a4fdc34110bc66920a56b8df563202c6865234d9","id":"SPEC"},{"artifact_kind":"plan","ref":"plan.md","hash":"9aa53259366f151bcf80044d45540869ad74bf5e62bd14530429f7433afad48a","id":"PLAN"}]`
- **输入**：INC-058、FR-007/FR-029、AC-008/AC-031、T028 focused contract failure。
- **source_refs / decision_refs**：R20、R23、INC-058 → D57 → FR-007/029 → AC-008/031
- **依赖**：T028
- **并行**：否 — 必须先消费 T028 的任务卡合同和当前证据边界。
- **FR**：FR-007、FR-029
- **AC**：AC-008、AC-031
- **动作**：仅 ENOENT 转为 `historical evidence unavailable`；evidence 只有 bytes 时按 bytes 计算 hash；其他读取错误直接抛出；把 audit gap 暴露给调用方但不作为普通修复 gate。
- **输出**：历史缺失不阻断当前事实、非 ENOENT 仍可诊断的完成判据和回归事实。
- **Knowledge**：历史 Task completion 只是审计上下文，当前实现/测试/AC/review 事实拥有当前权威；不能用宽泛 catch 降级真实错误。
- **精确文件**：`runtime/stage/stage-handlers.mjs`; `tests/stage-plan-task-contract-v3.test.mjs`; `specs/requirements-completeness-audit-20260804/tasks.md`
- **execution_file_paths**：`runtime/stage/stage-handlers.mjs`; `tests/stage-plan-task-contract-v3.test.mjs`; `specs/requirements-completeness-audit-20260804/tasks.md`
- **boundary**：files: 上述精确文件；symbols/regions: authenticateTaskCompletionEvidence、certifyCurrentTaskCompletion 和历史 evidence compatibility tests。
- **verification_role**：N/A — non-behavior change: historical evidence compatibility
- **paired_task**：N/A — non-behavior change: no RED/GREEN pair
- **test_strategy_owner**：`build-plan/high-intelligence-model`
- **test tier / test method**：`simple` — focused stage-plan-task contract；build-code 执行，verify-code 回放结果。
- **scenarios / commands / expected exit / oracle**：ENOENT historical evidence、bytes-only evidence、非 ENOENT 错误三类边界；`npx vitest run tests/stage-plan-task-contract-v3.test.mjs`；expected exit `0`；ORACLE-HISTORICAL-EVIDENCE-COMPAT：缺失只进入 audit/quality gap，不覆盖当前事实，不吞真实读取错误。
- **fixtures_services**：Vitest 本地 worker fixture；无 provider、无外部服务。
- **browser_route**：`N/A — 无业务 UI`
- **execution_contract**：build-code 只消费本卡已写入的命令/oracle；不临场改变历史/当前权威边界。
- **final current-snapshot aggregate strategy**：`N/A — 由 T027 的 verify-code replay 负责`
- **gate_cmd**：`npx vitest run tests/stage-plan-task-contract-v3.test.mjs`
- **expected_exit**：0
- **oracle**：历史 evidence 缺失时返回当前 completion 事实并暴露 gap；bytes-only hash 正确；非 ENOENT 仍失败。
- **evidence_path**：`quality/tests/historical-evidence-compatibility-20260805.json`
- **coverage limits**：只覆盖 WorkflowHub 历史 evidence 读取兼容，不证明任何业务需求或完整语义 replay。
- **STOP**：不能把历史缺失升级为当前 pass、formal accepted 或用户确认。
- **recovery**：只撤回本卡兼容分支和 focused regression，不删除 INC-058 或旧失败事实。
- **task risk**：为了兼容旧记录而吞掉权限/损坏错误，或让历史完成行重新成为推进许可证。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：已修复 ENOENT 历史 evidence 非门禁处理和 bytes-only hash 回退；非 ENOENT 仍直接暴露；同时更新 stage-plan-task 回归断言以读取非枚举 audit gap。
- **executed_commands**：当前闭环聚焦回归包含 `npx vitest run tests/stage-plan-task-contract-v3.test.mjs`；`exit_code=0`，21/21 通过；非 ENOENT 仍 fail-loud。
- **evidence_refs**：`[{"ref":"quality/evidence/task-completion/verify-code/T029-d34cc36f34f89876ab34e32e5b036a606c43f06d351cc960739517c055d50e01.json","sha256":"d34cc36f34f89876ab34e32e5b036a606c43f06d351cc960739517c055d50e01","kind":"task_completion_current","snapshot_tree":"e4b968db05893d7e6a889e3e272e652c172a7cbb","source_digest":"ad59ad17dc213ba78a051a60db4d693d6a4b8e9a598c3ffde026b595e6551912"}]`
- **covered_ac**：AC-008、AC-031
- **review_fact**：D57 的 material-only 独立 review 已保留；本卡代码修复用 focused regression 验证，不重复未变化的 provider 审查。
- **completed_at**：`2026-08-05T18:52:00+08:00`

#### T027 — 当前原始和新增需求语义回放

- **ID**：T027
- **Phase**：Phase 9：内容映射、阶段进度和语义状态修正
- **Workflow stage**：verify-code
- **goal**：逐项回放 R1-R23、14 个报告需求点、INC-001~060、D1-D57、FR/AC/T，禁止结构完成冒充语义验收。
- **design_state**：completed
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"a887a44d769b9c798f0b7c61a4fdc34110bc66920a56b8df563202c6865234d9","id":"SPEC"},{"artifact_kind":"plan","ref":"plan.md","hash":"9aa53259366f151bcf80044d45540869ad74bf5e62bd14530429f7433afad48a","id":"PLAN"}]`
- **输入**：D43、D50、D54、当前四份材料、现有 review/finding 和可读质量证据。
- **source_refs / decision_refs**：R2、R5、R11、R16、R20、R23 → D43、D50、D54、D55、D56 → FR-008/029 → AC-003/007/013/031
- **依赖**：T029
- **并行**：否 — 必须消费当前进度和内容映射。
- **FR**：FR-008、FR-029
- **AC**：AC-003、AC-007、AC-013、AC-031
- **动作**：输出当前逐项状态；缺 receipt、漂移 snapshot、needs_human finding、未调用 review 或未确认 handoff 时保持 unknown/incomplete/deferred/unavailable，不写成全量 pass。
- **输出**：当前 R/F/INC/D/FR/AC replay 状态和延期交接，明确不能 close。
- **Knowledge**：当前四份材料、review/finding 事实、可读 receipt 和 snapshot/provenance 规则。
- **精确文件**：`specs/requirements-completeness-audit-20260804/decision-log.md`; `specs/requirements-completeness-audit-20260804/spec.md`; `specs/requirements-completeness-audit-20260804/plan.md`; `specs/requirements-completeness-audit-20260804/tasks.md`; `workflows/verify-code/SKILL.md`; `runtime/stage/stage-handlers.mjs`; `tests/verify-requirement-replay-contract.test.mjs`; `tests/decision-log-content-contract.test.mjs`。
- **execution_file_paths**：`specs/requirements-completeness-audit-20260804/decision-log.md`; `specs/requirements-completeness-audit-20260804/spec.md`; `specs/requirements-completeness-audit-20260804/plan.md`; `specs/requirements-completeness-audit-20260804/tasks.md`; `workflows/verify-code/SKILL.md`; `runtime/stage/stage-handlers.mjs`; `tests/verify-requirement-replay-contract.test.mjs`; `tests/decision-log-content-contract.test.mjs`。
- **boundary**：files: 上述精确文件；symbols/regions: current requirement replay、semantic status 和 handoff summary only。
- **verification_role**：N/A — non-behavior change: semantic audit
- **paired_task**：N/A — non-behavior change: no RED/GREEN pair
- **test_strategy_owner**：`build-plan/high-intelligence-model`
- **test tier / test method**：`simple` — requirement replay contract；真实逐项语义结果仍由 verify-code 证据决定。
- **scenarios / commands / expected exit / oracle**：R/F/INC/D/FR/AC 缺 receipt、snapshot、finding disposition 或 handoff 时保持 unknown/incomplete/deferred/unavailable；使用本卡 gate_cmd；expected exit `0`；ORACLE-REQUIREMENT-REPLAY：不把结构或局部测试升级为 formal accepted。
- **fixtures_services**：`N/A — 当前任务材料和既有质量事实`
- **browser_route**：`N/A — 本任务是 WorkflowHub runtime/材料审计，无 UI 业务页面`
- **execution_contract**：build-code 只执行已设计的当前 Task；本卡由 verify-code 独立回放，不临场补需求。
- **final current-snapshot aggregate strategy**：`当前最终聚合策略；在当前 snapshot 上逐项回放并保留每项真实状态、原因和 coverage limits`
- **gate_cmd**：`npx vitest run tests/verify-requirement-replay-contract.test.mjs tests/decision-log-content-contract.test.mjs tests/contract/stage-progress-contract.test.mjs`
- **expected_exit**：0
- **oracle**：每条来源有 pass/fail/unknown/deferred/unavailable 和原因；当前结论明确“结构和局部实现已完成，全部需求语义验收未完成”。
- **evidence_path**：`quality/evidence/verification/requirements-completeness-replay-current.json`
- **coverage_limits**：五份报告的业务功能仍 deferred；provider review、fresh full-suite、independent resolution 和 user handoff 仍 unknown/missing。
- **STOP**：当前 evidence 不存在时保持 unknown/incomplete，不执行 close/confirm/authorize。
- **recovery**：补齐真实当前 evidence 后重跑受影响 replay；不改写旧 verdict 或历史 receipt。
- **task risk**：把结构映射、局部测试或历史 pass 误报为全部需求完成。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：已在当前工作树捕获 `snapshot_tree=3904174e0a5b3011863436fd8fd6ce1d4190b419`、`source_digest=ed35c8d1fcb71f0f63e4182d2cc02ee89d837e16fe2ad1247552ed835d0faac8`；当前 decision-log 共枚举 154 项来源：`R1-R23`、14 个报告需求点、`INC-001..INC-060`、`D1-D57`。TaskKernel replay receipt 已发布，逐项状态为 140 `unknown`、14 `deferred`，没有伪造 pass。
- **当前回放分类**：五份报告的业务实现按当前 non-goal 记为 `deferred`；R1-R23、INC-001..INC-060、D1-D57 的当前逐项语义结果因缺少 canonical per-source evidence、独立实现/验证锚点和本轮用户 handoff，统一保持 `unknown/incomplete`，不把历史修复记录升级为 `pass`。FR-001..FR-029、AC-001..AC-031 同样等待逐项 replay，不从结构映射反推完成。
- **executed_commands**：`node --input-type=module ... captureExecutionSnapshot(...)`；exit `0`，当前 snapshot 可读；当前闭环聚焦合同回归；`exit_code=0`。这些测试证明材料和回放合同，没有把局部测试升级为逐项语义通过。
- **evidence_refs**：`[{"ref":"quality/evidence/task-completion/verify-code/T027-2cbba7185d35ae8326f260782a675ad554c089f74398d4816d708f91492eabb5.json","sha256":"2cbba7185d35ae8326f260782a675ad554c089f74398d4816d708f91492eabb5","kind":"task_completion_current","snapshot_tree":"e4b968db05893d7e6a889e3e272e652c172a7cbb","source_digest":"ad59ad17dc213ba78a051a60db4d693d6a4b8e9a598c3ffde026b595e6551912"}]`
- **covered_ac**：AC-003、AC-007、AC-013、AC-031
- **review_fact**：`unknown` — 当前独立 review resolution 和 user handoff 未闭合
- **completed_at**：`2026-08-05T18:52:00+08:00`

## Appendix A. Legacy import

上一版 plan/tasks、历史 review、receipt、snapshot 和旧 confirmation 只读保留；它们不能覆盖当前 V13 spec，也不能自动完成本清单任务。

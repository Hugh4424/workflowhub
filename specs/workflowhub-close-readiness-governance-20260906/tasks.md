# 任务清单：WorkflowHub 收口准备治理与质量-成本治理及阶段治理闭环

- **Input**：`specs/workflowhub-close-readiness-governance-20260906/decision-log.md`、`specs/workflowhub-close-readiness-governance-20260906/spec.md`、`specs/workflowhub-close-readiness-governance-20260906/plan.md`
- **Template version**：`plan-task.v3`
- **Spec SHA-256**：`c38d0513c05c7d101f191231eb73596adb14eaa00d670437c4c2884e882397ef`
- **Plan SHA-256**：`09997a214575ab803a29233d11e10a7baea7f6bcef1844a2580e36be851ad3db`

## 执行摘要

- **Goal**：以冻结校验、分类路由、暂停态、预算、观测、统一回退六机制为核心，分 4 phases 实现阶段治理闭环；每 phase 独立 RED→GREEN 与独立 review；覆盖全部 30 FR/30 AC；主会话只留 ref+hash+摘要，子代理独立上下文。
- **Main boundary**：不新增公共入口/store/持久对象/第五材料/第二状态机/永久 bridge；review/test/quality/usage 仅事实，不为 gate。
- **First executable task**：T001 RED。

## 全局约束

- 认证 worktree 固定为 `workflowhub-workflowhub-close-readiness-governance-20260906`；仅在该 worktree 内修改 runtime/skills/workflows/tests。
- 每个行为任务先 RED 再 GREEN，二者 gate_cmd 与 oracle（含 pass/reject）同源；完成状态区为唯一权威。
- AC 四段卡证据段为预期证据契约（evidence/test/manual），实际运行证据由 verify-code 回填校验，不在规格编写期要求运行证据。
- 所有主要精确文件变更前先读现有内容；禁止用关键词判型，分类仅依据 FR-LOOP-002 的九维度影响清单。

## Deferred/Open Handoff Index

| ID | owner | trigger | handoff | close condition |
| --- | --- | --- | --- | --- |
| DEFER-006 | build-plan | 验证四阶段统一上下文后再扩 | 四阶段推广 | 后续任务完成评估 |
| OPEN-004 | build-plan 主会话 | 实施前置环境动作，用户授权后动 | `3rd-review` config source_id 绑定修复 | 配置与身份校验链一致后关闭 |
| DEFER-009 | build-plan | 非配对行为任务 reject 扩展评估 | reject 语义扩展 | dogfood 后评估 |

## Phase 1 — 冻结校验与路由基础设施

### Goal

建立决策冻结校验器、增量续签链、分类路由校验器的骨架与 handler 统一后置校验落点（dispositions 后、addCompletion 前）。

### Files

- **MODIFY**：`runtime/stage/stage-content-contracts.mjs`、`runtime/stage/stage-handlers.mjs`、`runtime/stage/stage-runner.mjs`、`runtime/stage/stage-context.mjs`、`runtime/task/material-workspace.mjs`
- **NEW**：`tests/contract/freeze-classification-budget-usage-protocol.test.mjs`（P1 段）

### Tasks

#### T001 — RED：冻结校验拒绝三方不一致与非当前绑定

- **ID**：T001
- **Phase**：Phase 1 — 冻结校验与路由基础设施
- **goal**：构造头部 pending 与正文 accepted 并存、绑定非当前 material、存在方向级未决三类负向 decision-log，证明冻结校验器当前缺失或不拒绝。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-close-readiness-governance-20260906/spec.md","hash":"c38d0513c05c7d101f191231eb73596adb14eaa00d670437c4c2884e882397ef","id":"SPEC-CLOSE-READINESS-20260906"},{"artifact_kind":"plan","ref":"specs/workflowhub-close-readiness-governance-20260906/plan.md","hash":"09997a214575ab803a29233d11e10a7baea7f6bcef1844a2580e36be851ad3db","id":"PLAN-CLOSE-READINESS-20260906"}]`
- **输入**：当前 `spec.md` FR-LOOP-001/AC-LOOP-001、`decision-log.md` 头部 approval_binding、material_revision/snapshot_tree、`stage-content-contracts` 校验入口契约。
- **前置环境检查**：在 Phase 1 首次独立 review 前核验 OPEN-004 的 3rd-review `source_id` 绑定；修改用户侧配置必须先获授权，未执行或不可用时记录真实 unavailable，不伪造独立性通过。
- **依赖**：none
- **并行**：否 — first RED for this behavior
- **FR**：FR-LOOP-001、FR-FLOW-001、FR-PREF-001
- **AC**：AC-LOOP-001、AC-FLOW-001、AC-PREF-001
- **动作**：新增负向 focused 测试，不改生产实现；覆盖三方一致、当前绑定、无方向级未决、冻结包四项覆盖判定。
- **精确文件**：`tests/contract/freeze-classification-budget-usage-protocol.test.mjs`
- **boundary**：files: `tests/contract/freeze-classification-budget-usage-protocol.test.mjs`; symbols/regions: freeze validator sham、decision-log 三方不一致 fixture、续签链解析缺口。
- **输出**：RED 证据显示冻结校验当前不会拒绝或误接受增量续签。
- **Knowledge**：冻结校验为完成条件检查，非公共 gate。
- **producer**：build-spec 主会话
- **consumer**：stage-runtime 入口校验与阶段汇报
- **owner**：runtime/stage
- **freshness**：绑定当前 task/material_revision/snapshot_tree
- **verification_role**：RED
- **paired_task**：T002
- **gate_cmd**：`./node_modules/.bin/vitest run tests/contract/freeze-classification-budget-usage-protocol.test.mjs -t "T001|freeze"`
- **expected_exit**：1
- **oracle**：ORACLE-P1-FREEZE `{"pass": "一致冻结且绑定当前材料、无方向级未决时校验通过并开始规格化", "reject": {"input": "头部 pending 与正文 accepted 并存且绑定非当前材料的 decision-log", "expected_rejection": "冻结校验拒绝开始规格化、记录暂停回 make-decision 并保留原因", "observation": "校验结果事实为 paused，reason 指向三方不一致或绑定漂移且未开始规格化"}}`
- **evidence_path**：`quality/evidence/phase-p1-freeze-T001.json`
- **STOP**：需新增公共 gate/第二状态机或把校验当写入拒绝时停止。
- **recovery**：修正测试 fixture，不降低原则。
- **task risk**：续签链历史重确认误判。

#### T002 — GREEN：实现冻结校验器与增量续签链接受

- **ID**：T002
- **Phase**：Phase 1 — 冻结校验与路由基础设施
- **goal**：使 T001 负向样本被正确拒绝，合法冻结与合法增量增补链被接受；build-plan 重校验 spec 与 decision 绑定配对。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-close-readiness-governance-20260906/spec.md","hash":"c38d0513c05c7d101f191231eb73596adb14eaa00d670437c4c2884e882397ef","id":"SPEC-CLOSE-READINESS-20260906"},{"artifact_kind":"plan","ref":"specs/workflowhub-close-readiness-governance-20260906/plan.md","hash":"09997a214575ab803a29233d11e10a7baea7f6bcef1844a2580e36be851ad3db","id":"PLAN-CLOSE-READINESS-20260906"}]`
- **输入**：T001 RED、现有 stage-handlers 入口、续签链载体约定。
- **依赖**：T001
- **并行**：否 — RED/GREEN 串行
- **FR**：FR-LOOP-001、FR-FLOW-001、FR-PREF-001
- **AC**：AC-LOOP-001、AC-FLOW-001、AC-PREF-001
- **动作**：在 stage 入口实现三方一致检查、当前绑定检查、未决计数与冻结包合同四项；实现增量续签链解析（基线+增补链）并接受合法增补、拒缺回执增补。
- **精确文件**：`runtime/stage/stage-content-contracts.mjs`、`runtime/stage/stage-handlers.mjs`、`runtime/stage/stage-runner.mjs`、`runtime/stage/stage-context.mjs`、`runtime/task/material-workspace.mjs`
- **boundary**：files: `runtime/stage/stage-content-contracts.mjs`, `runtime/stage/stage-handlers.mjs`; symbols/regions: freeze validator、renewal chain parser、entry guard。
- **输出**：正向通过且可继续；负向拒绝且不开始规格化；双向夹具均可判定。
- **Knowledge**：校验仅改变完成条件，不阻断修复。
- **producer**：build-spec 主会话
- **consumer**：stage-runtime 入口校验与阶段汇报
- **owner**：runtime/stage
- **freshness**：绑定当前 task/material_revision/snapshot_tree
- **verification_role**：GREEN
- **paired_task**：T001
- **paired_task**：T001
- **独立审查动作**：Phase 1 GREEN 交接前，使用当前冻结 material_revision/snapshot_tree 调用一次 wh-review；保留 attempt/result、provider identity、usage 或 unavailable 原因，审查是质量事实，不是通过门。
- **gate_cmd**：`./node_modules/.bin/vitest run tests/contract/freeze-classification-budget-usage-protocol.test.mjs -t "T001|freeze"`
- **expected_exit**：0
- **oracle**：ORACLE-P1-FREEZE `{"pass": "合法冻结与合法增量增补链被接受并继续规格化，build-plan 重校验配对一致"}`
- **evidence_path**：`quality/evidence/phase-p1-freeze-T002.json`
- **STOP**：需全量重确认历史 step 11 时停止。
- **recovery**：回退校验分支至只校验基线兼容模式。
- **task risk**：续签链误接受缺回执。

#### T003 — RED：分类与路由校验缺失与路由错误

- **ID**：T003
- **Phase**：Phase 1 — 冻结校验与路由基础设施
- **goal**：构造缺依据/命中方向维度/无法互斥且标 fixed、spec_ambiguity 无答复绑定、direction_change 无增量决策仍放行的缺口，证明路由校验缺失。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-close-readiness-governance-20260906/spec.md","hash":"c38d0513c05c7d101f191231eb73596adb14eaa00d670437c4c2884e882397ef","id":"SPEC-CLOSE-READINESS-20260906"},{"artifact_kind":"plan","ref":"specs/workflowhub-close-readiness-governance-20260906/plan.md","hash":"09997a214575ab803a29233d11e10a7baea7f6bcef1844a2580e36be851ad3db","id":"PLAN-CLOSE-READINESS-20260906"}]`
- **输入**：FR-LOOP-002/AC-LOOP-002、FR-GAP-001/002、九维度影响清单约定。
- **依赖**：T002
- **并行**：否 — first RED for this behavior
- **FR**：FR-LOOP-002、FR-GAP-001、FR-GAP-002
- **AC**：AC-LOOP-002、AC-GAP-001、AC-GAP-002
- **动作**：新增负向测试覆盖互斥分类、维度清单、证据引用、disposition 路由匹配。
- **精确文件**：`tests/contract/freeze-classification-budget-usage-protocol.test.mjs`
- **boundary**：files: `tests/contract/freeze-classification-budget-usage-protocol.test.mjs`; symbols/regions: classification validator、routing checker、gap_id 规范化 fixture。
- **输出**：RED 证据显示路由错误当前不会阻断正式完成或误阻断修复。
- **Knowledge**：分类不靠关键词，仅维度+证据。
- **producer**：对应阶段主会话
- **consumer**：阶段完成条件校验与阶段汇报
- **owner**：runtime/stage
- **freshness**：绑定当前 task/material_revision/snapshot_tree
- **verification_role**：RED
- **paired_task**：T004
- **gate_cmd**：`./node_modules/.bin/vitest run tests/contract/freeze-classification-budget-usage-protocol.test.mjs -t "T003|classification|gap"`
- **expected_exit**：1
- **oracle**：ORACLE-P1-CLASSIFICATION `{"pass": "每条 finding 互斥分类且附维度与证据，路由与 disposition 匹配且增量决策后仅受影响闭包继续", "reject": {"input": "spec_ambiguity 无用户答复绑定却标 fixed 的 finding", "expected_rejection": "路由校验记录错误并阻断正式完成，但不阻断同任务修复", "observation": "校验结果显示 routing_mismatch，completion 仍为 incomplete，修复分支可继续写入"}}`
- **evidence_path**：`quality/evidence/phase-p1-classification-T003.json`
- **STOP**：需采用关键词判型或新增 store 时停止。
- **recovery**：补维度清单与证据引用，不降低校验。
- **task risk**：缺口闭包边界误判。

#### T004 — GREEN：实现分类与路由校验及 gap 规范化

- **ID**：T004
- **Phase**：Phase 1 — 冻结校验与路由基础设施
- **goal**：使 T003 负向被正确阻断及 gap_id 四身份字段哈希与 reason 去重排序正确；增量决策后仅受影响闭包聚焦复核。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-close-readiness-governance-20260906/spec.md","hash":"c38d0513c05c7d101f191231eb73596adb14eaa00d670437c4c2884e882397ef","id":"SPEC-CLOSE-READINESS-20260906"},{"artifact_kind":"plan","ref":"specs/workflowhub-close-readiness-governance-20260906/plan.md","hash":"09997a214575ab803a29233d11e10a7baea7f6bcef1844a2580e36be851ad3db","id":"PLAN-CLOSE-READINESS-20260906"}]`
- **输入**：T003 RED、gap_id 冻结算法与 canonical payload 约定。
- **依赖**：T003
- **并行**：否
- **FR**：FR-LOOP-002、FR-GAP-001、FR-GAP-002
- **AC**：AC-LOOP-002、AC-GAP-001、AC-GAP-002
- **动作**：实现互斥分类器与路由校验器插入 handler 统一后置点；实现 gap_id 四字段保序元组+SHA-256 与 reason 去重排序；实现增量决策局部继续闭包判定。
- **精确文件**：`runtime/stage/stage-content-contracts.mjs`、`runtime/stage/stage-handlers.mjs`
- **boundary**：files: `runtime/stage/stage-content-contracts.mjs`, `runtime/stage/stage-handlers.mjs`; symbols/regions: classifier、router、gap_id canonical、incremental closure。
- **输出**：正向通过且 local-continue；负向被判定 routing_error 不阻断修复。
- **Knowledge**：路由校验仅约束正式完成声明。
- **producer**：对应阶段主会话
- **consumer**：阶段完成条件校验与阶段汇报
- **owner**：runtime/stage
- **freshness**：绑定当前 task/material_revision/snapshot_tree
- **verification_role**：GREEN
- **paired_task**：T003
- **paired_task**：T003
- **独立审查动作**：Phase 1 GREEN 交接前，使用当前冻结 material_revision/snapshot_tree 调用一次 wh-review；保留 attempt/result、provider identity、usage 或 unavailable 原因，审查是质量事实，不是通过门。
- **gate_cmd**：`./node_modules/.bin/vitest run tests/contract/freeze-classification-budget-usage-protocol.test.mjs -t "T003|classification|gap"`
- **expected_exit**：0
- **oracle**：ORACLE-P1-CLASSIFICATION `{"pass": "互斥分类、路由匹配与局部继续均正确，且 gap_id 与 provenance 合并可判定"}`
- **evidence_path**：`quality/evidence/phase-p1-classification-T004.json`
- **STOP**：需持久登记缺口时停止（违宪）。
- **recovery**：回退后置校验至各 handler 私检兼容模式。
- **task risk**：闭包聚焦范围偏差。

### Verify

`./node_modules/.bin/vitest run tests/contract/freeze-classification-budget-usage-protocol.test.mjs -t "P1"` — RED 1、GREEN 0；覆盖冻结三方、增量续签双向、分类路由与 gap 去重。

### Knowledge

交给 P2：冻结与路由骨架已可用；校验落点固定为 dispositions 后。

### STOP

需新增公共 gate/第二状态机时停止。

### Done

冻结三方与路由匹配可独立验收。

### Risks and rollback

- **Risk**：RISK-009 误放行/误阻断。
- **Rollback**：回退校验分支至兼容模式，保留续签历史。

## Phase 2 — 分类与状态机

### Goal

实现 needs_human 暂停态收紧与 attempt 两层分离，并完成材料四段卡与 oracle 结构化校验的统一口径与 gap 消缺增强。

### Files

- **MODIFY**：`runtime/stage/stage-content-contracts.mjs`、`runtime/stage/stage-handlers.mjs`、`runtime/stage/completion-predicates.mjs`、`skills/spec-specify/SKILL.md`、`skills/spec-plan/SKILL.md`、`skills/spec-tasks/SKILL.md`、`skills/spec-specify/templates/spec-template.md`、`skills/spec-plan/templates/plan-template.md`
- **NEW**：`tests/contract/freeze-classification-budget-usage-protocol.test.mjs`（P2 段）、`tests/contract/material-oracle-context-packet.test.mjs`（P2 段）

### Tasks

#### T005 — RED：needs_human 当终态与两层未分离

- **ID**：T005
- **Phase**：Phase 2 — 分类与状态机
- **goal**：构造无 next_action 的 needs_human 仍判完成、accepted_risk 无回执放行、attempt unavailable 被改空 findings 的样本，证明收紧缺失。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-close-readiness-governance-20260906/spec.md","hash":"c38d0513c05c7d101f191231eb73596adb14eaa00d670437c4c2884e882397ef","id":"SPEC-CLOSE-READINESS-20260906"},{"artifact_kind":"plan","ref":"specs/workflowhub-close-readiness-governance-20260906/plan.md","hash":"09997a214575ab803a29233d11e10a7baea7f6bcef1844a2580e36be851ad3db","id":"PLAN-CLOSE-READINESS-20260906"}]`
- **输入**：FR-LOOP-003/AC-LOOP-003、FR-STATUS-001/002。
- **依赖**：T004
- **并行**：否 — first RED for this behavior
- **FR**：FR-LOOP-003、FR-STATUS-001、FR-STATUS-002
- **AC**：AC-LOOP-003、AC-STATUS-001、AC-STATUS-002
- **动作**：新增负向测试覆盖暂停态、出口白名单、两层分离。
- **精确文件**：`tests/contract/freeze-classification-budget-usage-protocol.test.mjs`
- **boundary**：files: `tests/contract/freeze-classification-budget-usage-protocol.test.mjs`; symbols/regions: needs_human validator、two-layer separation。
- **输出**：RED 显示无绑定仍会完成或 attempt 层误入白名单。
- **Knowledge**：完成仅四出口，需绑定。
- **producer**：对应阶段主会话
- **consumer**：阶段完成条件校验与阶段汇报
- **owner**：runtime/stage
- **freshness**：绑定当前 task/material_revision/snapshot_tree
- **verification_role**：RED
- **paired_task**：T006
- **gate_cmd**：`./node_modules/.bin/vitest run tests/contract/freeze-classification-budget-usage-protocol.test.mjs -t "T005|needs_human"`
- **expected_exit**：1
- **oracle**：ORACLE-P2-NEEDS-HUMAN `{"pass": "needs_human 仅暂停且附 next_action，完成仅四白名单，attempt 层分离不入处置", "reject": {"input": "无 next_action 的 needs_human 标为 formally complete", "expected_rejection": "disposition 校验拒绝且 completion 保持 incomplete", "observation": "校验返回 needs_human_requires_next_action，completion=incomplete"}}`
- **evidence_path**：`quality/evidence/phase-p2-needs-human-T005.json`
- **STOP**：需新增状态机持久对象时停止。
- **recovery**：补 next_action 与绑定，不降低门槛。
- **task risk**：attempt 层与 finding 层混淆。

#### T006 — GREEN：实现 needs_human 收紧与两层分离

- **ID**：T006
- **Phase**：Phase 2 — 分类与状态机
- **goal**：使 T005 负向被正确拒绝，答复后转 user_decided（绑 finding_id/card_hash/reply_ref）或 accepted_risk（绑回执）放行，attempt unavailable 不产生 finding。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-close-readiness-governance-20260906/spec.md","hash":"c38d0513c05c7d101f191231eb73596adb14eaa00d670437c4c2884e882397ef","id":"SPEC-CLOSE-READINESS-20260906"},{"artifact_kind":"plan","ref":"specs/workflowhub-close-readiness-governance-20260906/plan.md","hash":"09997a214575ab803a29233d11e10a7baea7f6bcef1844a2580e36be851ad3db","id":"PLAN-CLOSE-READINESS-20260906"}]`
- **输入**：T005 RED。
- **依赖**：T005
- **并行**：否
- **FR**：FR-LOOP-003、FR-STATUS-001、FR-STATUS-002
- **AC**：AC-LOOP-003、AC-STATUS-001、AC-STATUS-002
- **动作**：实现暂停态校验与两层分离谓词（有无 attempt 区分 failed/unavailable）及出口绑定校验。
- **精确文件**：`runtime/stage/stage-handlers.mjs`、`runtime/stage/completion-predicates.mjs`
- **boundary**：files: `runtime/stage/stage-handlers.mjs`, `runtime/stage/completion-predicates.mjs`; symbols/regions: needsHuman guard、attemptLayer fork。
- **输出**：正向暂停与答复流转可判定；两层分离可观测。
- **Knowledge**：收紧仅改变完成判定，不新增状态机。
- **producer**：对应阶段主会话
- **consumer**：阶段完成条件校验与阶段汇报
- **owner**：runtime/stage
- **freshness**：绑定当前 task/material_revision/snapshot_tree
- **verification_role**：GREEN
- **paired_task**：T005
- **paired_task**：T005
- **独立审查动作**：Phase 2 GREEN 交接前，使用当前冻结 material_revision/snapshot_tree 调用一次 wh-review；保留 attempt/result、provider identity、usage 或 unavailable 原因，审查是质量事实，不是通过门。
- **gate_cmd**：`./node_modules/.bin/vitest run tests/contract/freeze-classification-budget-usage-protocol.test.mjs -t "T005|needs_human"`
- **expected_exit**：0
- **oracle**：ORACLE-P2-NEEDS-HUMAN `{"pass": "暂停态与两层分离正确且答复流转绑定完整"}`
- **evidence_path**：`quality/evidence/phase-p2-needs-human-T006.json`
- **STOP**：需把 needs_human 当终态完成时停止。
- **recovery**：回退白名单至兼容检查。
- **task risk**：绑定回执载体缺失。

#### T007 — RED：材料四段卡与 oracle 结构的缺失

- **ID**：T007
- **Phase**：Phase 2 — 分类与状态机
- **goal**：构造旧粗体标签、空失败段、占位符整行、RED 缺 reject、GREEN 配对缺关联等负向材料，证明当前模板/校验器不一致。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-close-readiness-governance-20260906/spec.md","hash":"c38d0513c05c7d101f191231eb73596adb14eaa00d670437c4c2884e882397ef","id":"SPEC-CLOSE-READINESS-20260906"},{"artifact_kind":"plan","ref":"specs/workflowhub-close-readiness-governance-20260906/plan.md","hash":"09997a214575ab803a29233d11e10a7baea7f6bcef1844a2580e36be851ad3db","id":"PLAN-CLOSE-READINESS-20260906"}]`
- **输入**：FR-MATERIAL-001/002/003、FR-PREF-001/002 的 AC 四段与 oracle 约定。
- **依赖**：T006
- **并行**：否
- **FR**：FR-MATERIAL-001、FR-MATERIAL-002、FR-MATERIAL-003
- **AC**：AC-MATERIAL-001、AC-MATERIAL-002、AC-MATERIAL-003
- **动作**：新增负向测试覆盖 plain 验证标签、四段非空、占位符整行拒绝、RED 三段齐备、GREEN 仅 pass 且语义复核字段。
- **精确文件**：`tests/contract/material-oracle-context-packet.test.mjs`
- **boundary**：files: `tests/contract/material-oracle-context-packet.test.mjs`; symbols/regions: AC four-segment parser、oracle struct checker。
- **输出**：RED 显示不一致材料当前会被判通过或依赖绕过脚本。
- **Knowledge**：结构检查不裁决语义，需 semantic_review_status。
- **producer**：build-spec/build-plan 材料校验实现
- **consumer**：build-plan/verify-code/status/close
- **owner**：build-spec/build-plan 阶段实现者
- **freshness**：绑定当前 task/material_revision/snapshot_tree
- **verification_role**：RED
- **paired_task**：T008
- **gate_cmd**：`./node_modules/.bin/vitest run tests/contract/material-oracle-context-packet.test.mjs -t "T007|material"`
- **expected_exit**：1
- **oracle**：ORACLE-P2-MATERIAL `{"pass": "四段 plain 标签均存在非空且无占位，RED 配对 reject 三段齐备且语义复核未缺", "reject": {"input": "verification_role=RED 且 paired_task≠N/A 但 oracle.reject 缺 expected_rejection 的行为验证", "expected_rejection": "材料检查判不完整并提示补 reject 三段", "observation": "检查结果为 incomplete，reason=missing_reject_segment"}}`
- **evidence_path**：`quality/evidence/phase-p2-material-T007.json`
- **STOP**：需用关键词判型时停止。
- **recovery**：按 v4.3 修正 RED-only 语义，不扩大 GREEN。
- **task risk**：模板过度收缩误伤合法段。

#### T008 — GREEN：统一材料模板、校验器与 oracle 表达位

- **ID**：T008
- **Phase**：Phase 2 — 分类与状态机
- **goal**：使 T007 负向被判不完整且正向材料直接通过校验器（无需绕过脚本）；补齐 semantic_review_status 复核。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-close-readiness-governance-20260906/spec.md","hash":"c38d0513c05c7d101f191231eb73596adb14eaa00d670437c4c2884e882397ef","id":"SPEC-CLOSE-READINESS-20260906"},{"artifact_kind":"plan","ref":"specs/workflowhub-close-readiness-governance-20260906/plan.md","hash":"09997a214575ab803a29233d11e10a7baea7f6bcef1844a2580e36be851ad3db","id":"PLAN-CLOSE-READINESS-20260906"}]`
- **输入**：T007 RED、v4.3 冻结文本与校验器 L2948 正则。
- **依赖**：T007
- **并行**：否
- **FR**：FR-MATERIAL-001、FR-MATERIAL-002、FR-MATERIAL-003
- **AC**：AC-MATERIAL-001、AC-MATERIAL-002、AC-MATERIAL-003
- **动作**：对齐 spec/plan/tasks 模板 plain 验证标签与校验器四段检查、占位符整行拒绝、oracle pass/reject 结构与 N/A 豁免；实现语义复核字段 `semantic_review_status` 校验分支，并让 tasks 侧模板/校验器成为同一 oracle 消费者。
- **精确文件**：`runtime/stage/stage-content-contracts.mjs`、`skills/spec-specify/SKILL.md`、`skills/spec-plan/SKILL.md`、`skills/spec-tasks/SKILL.md`、`skills/spec-specify/templates/spec-template.md`、`skills/spec-plan/templates/plan-template.md`
- **boundary**：files: `runtime/stage/stage-content-contracts.mjs`, `skills/spec-specify/templates/spec-template.md`; symbols/regions: spec validator、oracle contract。
- **输出**：新生成 spec/plan/tasks 按统一口径直接通过，正向与负向可区分。
- **Knowledge**：四段非空为结构校验，语义由独立复核决定。
- **producer**：build-spec/build-plan 材料校验实现
- **consumer**：build-plan/verify-code/status/close
- **owner**：build-spec/build-plan 阶段实现者
- **freshness**：绑定当前 task/material_revision/snapshot_tree
- **verification_role**：GREEN
- **paired_task**：T007
- **paired_task**：T007
- **独立审查动作**：Phase 2 GREEN 交接前，使用当前冻结 material_revision/snapshot_tree 调用一次 wh-review；保留 attempt/result、provider identity、usage 或 unavailable 原因，审查是质量事实，不是通过门。
- **gate_cmd**：`./node_modules/.bin/vitest run tests/contract/material-oracle-context-packet.test.mjs -t "T007|material"`
- **expected_exit**：0
- **oracle**：ORACLE-P2-MATERIAL `{"pass": "新材料四段与 oracle 结构统一且校验直通，无需绕过"}`
- **evidence_path**：`quality/evidence/phase-p2-material-T008.json`
- **STOP**：需把 GREEN 强制 reject 时停止（旧语义已作废）。
- **recovery**：回退模板至兼容 plain 标签。
- **task risk**：存量旧材料合规波动（RISK-004）。

### Verify

`./node_modules/.bin/vitest run tests/contract/freeze-classification-budget-usage-protocol.test.mjs -t "P2" && ./node_modules/.bin/vitest run tests/contract/material-oracle-context-packet.test.mjs -t "P2"` — 需覆盖 needs_human 四出口、两层分离与材料 RED-only。

### Knowledge

交给 P3：状态机与材料口径已闭合；gap 冻结算法已可用。

### STOP

需新增第二状态机持久存储时停止。

### Done

分类、暂停态、材料结构可独立验收。

### Risks and rollback

- **Risk**：RISK-007 张力与存量材料波动 RISK-004。
- **Rollback**：分别回退白名单/校验器至兼容实现。

## Phase 3 — 预算与观测

### Goal

实现 review 预算计数器与窄域 diff 核销出口，并完成 provider usage 与字符级代理指标的两层观测落盘；同时落地 Execution model、材料导航与冻结 packet 输入的阶段侧改造。

### Files

- **MODIFY**：`runtime/stage/stage-handlers.mjs`、`runtime/evidence/stage-content-evidence.mjs`、`runtime/stage/stage-runner.mjs`、`runtime/task/material-workspace.mjs`、`skills/spec-specify/SKILL.md`、`skills/spec-plan/SKILL.md`、`workflows/build-spec/SKILL.md`、`workflows/build-plan/SKILL.md`、`skills/spec-tasks/SKILL.md`
- **NEW**：`tests/contract/freeze-classification-budget-usage-protocol.test.mjs`（P3 段）、`tests/contract/material-oracle-context-packet.test.mjs`（P3 段）

### Tasks

#### T009 — RED：超预算重审与空桩误当通过

- **ID**：T009
- **Phase**：Phase 3 — 预算与观测
- **goal**：构造同冻结 revision 无变化重复初始、focused 后残留无核销仍放行、provider 空桩改空 findings 等样本，证明预算缺失。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-close-readiness-governance-20260906/spec.md","hash":"c38d0513c05c7d101f191231eb73596adb14eaa00d670437c4c2884e882397ef","id":"SPEC-CLOSE-READINESS-20260906"},{"artifact_kind":"plan","ref":"specs/workflowhub-close-readiness-governance-20260906/plan.md","hash":"09997a214575ab803a29233d11e10a7baea7f6bcef1844a2580e36be851ad3db","id":"PLAN-CLOSE-READINESS-20260906"}]`
- **输入**：FR-LOOP-004/AC-LOOP-004、FR-REVIEW-001/002。
- **依赖**：T008
- **并行**：否
- **FR**：FR-LOOP-004、FR-REVIEW-001、FR-REVIEW-002
- **AC**：AC-LOOP-004、AC-REVIEW-001、AC-REVIEW-002
- **动作**：新增负向测试覆盖预算拒绝、focused 范围、增量续签新配额、窄域核销、attempt 层 unavailable 与空 findings provenance。
- **精确文件**：`tests/contract/freeze-classification-budget-usage-protocol.test.mjs`
- **boundary**：files: `tests/contract/freeze-classification-budget-usage-protocol.test.mjs`; symbols/regions: budget counter、narrow diff verifier。
- **输出**：RED 显示超预算或空桩未被拒绝。
- **Knowledge**：预算仅约束完成条件，不阻断修复。
- **producer**：对应阶段主会话
- **consumer**：阶段审查纪律与阶段汇报
- **owner**：runtime/stage
- **freshness**：绑定当前 task/material_revision/snapshot_tree
- **verification_role**：RED
- **paired_task**：T010
- **gate_cmd**：`./node_modules/.bin/vitest run tests/contract/freeze-classification-budget-usage-protocol.test.mjs -t "T009|budget"`
- **expected_exit**：1
- **oracle**：ORACLE-P3-BUDGET `{"pass": "同冻结 revision 预算正确、耗尽有确定出口且空桩不算 pass", "reject": {"input": "同冻结 revision 无变化重复发起初始 review", "expected_rejection": "预算拒绝重审并保留原因", "observation": "校验返回 budget_exceeded 且 attempt 未新增"}}`
- **evidence_path**：`quality/evidence/phase-p3-budget-T009.json`
- **STOP**：需把预算做成推进许可证时停止。
- **recovery**：保留耗尽出口检查。
- **task risk**：phase 审查被误计入 spec/plan 预算。

#### T010 — GREEN：实现预算计数与窄域核销

- **ID**：T010
- **Phase**：Phase 3 — 预算与观测
- **goal**：使 T009 负向被正确拒绝且残留可经窄域 diff 核销一次后放行；增量续签产生新 focused 配额，phase 审查独立计数。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-close-readiness-governance-20260906/spec.md","hash":"c38d0513c05c7d101f191231eb73596adb14eaa00d670437c4c2884e882397ef","id":"SPEC-CLOSE-READINESS-20260906"},{"artifact_kind":"plan","ref":"specs/workflowhub-close-readiness-governance-20260906/plan.md","hash":"09997a214575ab803a29233d11e10a7baea7f6bcef1844a2580e36be851ad3db","id":"PLAN-CLOSE-READINESS-20260906"}]`
- **输入**：T009 RED。
- **依赖**：T009
- **并行**：否
- **FR**：FR-LOOP-004、FR-REVIEW-001、FR-REVIEW-002
- **AC**：AC-LOOP-004、AC-REVIEW-001、AC-REVIEW-002
- **动作**：实现按冻结 revision 的预算计数器、增量续签监听、窄域 diff 核销器与 attempt 层记录分支。
- **精确文件**：`runtime/stage/stage-handlers.mjs`、`runtime/evidence/stage-content-evidence.mjs`
- **boundary**：files: `runtime/stage/stage-handlers.mjs`; symbols/regions: budgetGuard、incrementalRenewal。
- **输出**：预算行为可判定且无死锁。
- **Knowledge**：每个状态都有出口（核销→问用户→accepted_risk→记录 unavailable）。
- **producer**：对应阶段主会话
- **consumer**：阶段审查纪律与阶段汇报
- **owner**：runtime/stage
- **freshness**：绑定当前 task/material_revision/snapshot_tree
- **verification_role**：GREEN
- **paired_task**：T009
- **paired_task**：T009
- **独立审查动作**：Phase 3 GREEN 交接前，使用当前冻结 material_revision/snapshot_tree 调用一次 wh-review；保留 attempt/result、provider identity、usage 或 unavailable 原因，审查是质量事实，不是通过门。
- **gate_cmd**：`./node_modules/.bin/vitest run tests/contract/freeze-classification-budget-usage-protocol.test.mjs -t "T009|budget"`
- **expected_exit**：0
- **oracle**：ORACLE-P3-BUDGET `{"pass": "预算计数、耗尽路由与独立 phase 审查正确且无死锁"}`
- **evidence_path**：`quality/evidence/phase-p3-budget-T010.json`
- **STOP**：需把预算耗尽实现为死锁时停止。
- **recovery**：回退计数器至兼容计数。
- **task risk**：窄域限定过窄/过宽。

##### 执行状态填写区（唯一完成权威）

- **status**：completed
- **actual changed files**：`runtime/evidence/stage-content-evidence.mjs`、`runtime/stage/stage-handlers.mjs`、`tests/contract/freeze-classification-budget-usage-protocol.test.mjs`
- **commands and exits**：P3 budget subset=0；combined P1–P3 contract set=0（19 tests）；handler regression=0（74 tests）；cutover=0（47 executed/22 skipped）；official receipts=0（52 tests）。
- **evidence refs**：`quality/evidence/phase-cards/phase-3-budget-observation.md`、`quality/evidence/review-results/build-code-phase-p3-review.json`
- **covered ACs**：AC-LOOP-004、AC-REVIEW-001、AC-REVIEW-002
- **review fact**：Phase 3 independent wh-review unavailable due `REVIEW_EXECUTION_TIMEOUT`; no findings were produced, and this is not approval.
- **completion time**：2026-09-07
- **执行事实**：预算按冻结 revision、focused 与窄域 diff 分支已实现并通过目标负向/正向测试；进入下一 phase 前保留 review unavailable 事实。

#### T011 — RED：usage 缺失与代理指标缺口

- **ID**：T011
- **Phase**：Phase 3 — 预算与观测
- **goal**：构造 provider completed 但 usage 全空仍显示零消耗、或代理指标缺失仍宣称下降的样本，证明观测未落盘。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-close-readiness-governance-20260906/spec.md","hash":"c38d0513c05c7d101f191231eb73596adb14eaa00d670437c4c2884e882397ef","id":"SPEC-CLOSE-READINESS-20260906"},{"artifact_kind":"plan","ref":"specs/workflowhub-close-readiness-governance-20260906/plan.md","hash":"09997a214575ab803a29233d11e10a7baea7f6bcef1844a2580e36be851ad3db","id":"PLAN-CLOSE-READINESS-20260906"}]`
- **输入**：FR-LOOP-005、FR-CONTEXT-001/002/003。
- **依赖**：T010
- **并行**：否
- **FR**：FR-LOOP-005、FR-CONTEXT-001、FR-CONTEXT-003
- **AC**：AC-LOOP-005、AC-CONTEXT-001、AC-CONTEXT-003
- **动作**：新增负向测试覆盖 usage 落盘或标 unavailable、三项字符级代理指标采集与阶段汇报“未证明下降”口径。
- **精确文件**：`tests/contract/freeze-classification-budget-usage-protocol.test.mjs`
- **boundary**：files: `tests/contract/freeze-classification-budget-usage-protocol.test.mjs`; symbols/regions: usage landing、proxy metrics、packet freeze hash。
- **输出**：RED 显示缺失被伪造或下降被虚构。
- **Knowledge**：成功边界不承诺下降，无证据写未证明下降。
- **producer**：对应阶段主会话
- **consumer**：阶段汇报与成本回顾
- **owner**：runtime/stage
- **freshness**：绑定当前 task/material_revision/snapshot_tree
- **verification_role**：RED
- **paired_task**：T012
- **gate_cmd**：`./node_modules/.bin/vitest run tests/contract/freeze-classification-budget-usage-protocol.test.mjs -t "T011|usage|context"`
- **expected_exit**：1
- **oracle**：ORACLE-P3-USAGE `{"pass": "usage 落盘或 unavailable 标注正确，三项代理指标随 outcome 记录且汇报口径如实", "reject": {"input": "provider 返回无 usage 却显示零消耗", "expected_rejection": "attempt 事实标 usage=unavailable 且不伪造零值", "observation": "观测事实为 unavailable，reason=usage_missing"}}`
- **evidence_path**：`quality/evidence/phase-p3-usage-T011.json`
- **STOP**：需新增 token 计费机制时停止。
- **recovery**：保留 unavailable 标注。
- **task risk**：代理指标与 token 混淆。

##### 执行状态填写区（唯一完成权威）

- **status**：completed
- **actual changed files**：`runtime/evidence/stage-content-evidence.mjs`、`runtime/task/material-workspace.mjs`、`runtime/stage/stage-handlers.mjs`、`skills/spec-specify/SKILL.md`、`skills/spec-plan/SKILL.md`、`skills/spec-tasks/SKILL.md`、`workflows/build-spec/SKILL.md`、`workflows/build-plan/SKILL.md`、`tests/contract/freeze-classification-budget-usage-protocol.test.mjs`、`tests/contract/material-oracle-context-packet.test.mjs`
- **commands and exits**：P3 usage/proxy subset=0；P3 packet/hash subset=0；combined P1–P3 contract set=0（19 tests）；node syntax checks=0；`git diff --check`=0。
- **evidence refs**：`quality/evidence/phase-cards/phase-3-budget-observation.md`、`quality/evidence/review-results/build-code-phase-p3-review.json`
- **covered ACs**：AC-LOOP-005、AC-CONTEXT-001、AC-CONTEXT-002、AC-CONTEXT-003
- **review fact**：Phase 3 independent wh-review unavailable due `REVIEW_EXECUTION_TIMEOUT`; provider selection and unavailable reason are retained in the review record.
- **completion time**：2026-09-07
- **执行事实**：usage 缺失保持 unavailable，三项字符代理不宣称下降；stage-input-packet.v1 做规范化内容哈希、路径边界和漂移拒绝；技能文档已改为 packet-only 消费。

#### T012 — GREEN：实现 usage 与代理观测落盘及上下文守恒

- **ID**：T012
- **Phase**：Phase 3 — 预算与观测
- **goal**：使 T011 负向被正确标注，实现 Execution model、材料导航与冻结 packet 输入的阶段侧改造并验证 packet hash 确定性与重建恢复。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-close-readiness-governance-20260906/spec.md","hash":"c38d0513c05c7d101f191231eb73596adb14eaa00d670437c4c2884e882397ef","id":"SPEC-CLOSE-READINESS-20260906"},{"artifact_kind":"plan","ref":"specs/workflowhub-close-readiness-governance-20260906/plan.md","hash":"09997a214575ab803a29233d11e10a7baea7f6bcef1844a2580e36be851ad3db","id":"PLAN-CLOSE-READINESS-20260906"}]`
- **输入**：T011 RED、D-304/D-305 冻结 packet 与导航节约定。
- **依赖**：T011
- **并行**：否
- **FR**：FR-LOOP-005、FR-CONTEXT-001、FR-CONTEXT-003
- **AC**：AC-LOOP-005、AC-CONTEXT-001、AC-CONTEXT-003
- **动作**：实现 provider usage 落盘分支与 proxy 三指标采集；把 spec-specify/spec-plan/spec-tasks 改为只消费冻结 packet，加入材料内嵌导航节校验与 packet freeze hash 确定性构造及重建恢复路径。
- **精确文件**：`runtime/evidence/stage-content-evidence.mjs`、`runtime/stage/stage-runner.mjs`、`runtime/task/material-workspace.mjs`、`skills/spec-specify/SKILL.md`、`skills/spec-plan/SKILL.md`、`workflows/build-spec/SKILL.md`、`workflows/build-plan/SKILL.md`、`skills/spec-tasks/SKILL.md`、`tests/contract/material-oracle-context-packet.test.mjs`
- **boundary**：files: `runtime/evidence/stage-content-evidence.mjs`, `runtime/task/material-workspace.mjs`; symbols/regions: usageWriter、packetFreeze、navGuard、Execution model。
- **输出**：观测与上下文行为可回答成本去向且不宣称 token 下降。
- **Knowledge**：packet 内导航/摘要可再生非权威，审查包字节不减零新文件。
- **producer**：对应阶段主会话
- **consumer**：阶段汇报与成本回顾
- **owner**：runtime/stage
- **freshness**：绑定当前 task/material_revision/snapshot_tree
- **verification_role**：GREEN
- **paired_task**：T011
- **paired_task**：T011
- **独立审查动作**：Phase 3 GREEN 交接前，使用当前冻结 material_revision/snapshot_tree 调用一次 wh-review；保留 attempt/result、provider identity、usage 或 unavailable 原因，审查是质量事实，不是通过门。
- **gate_cmd**：`./node_modules/.bin/vitest run tests/contract/freeze-classification-budget-usage-protocol.test.mjs -t "T011|usage|context"`
- **expected_exit**：0
- **oracle**：ORACLE-P3-USAGE `{"pass": "usage 与三项代理指标落盘正确，packet 组装与上下文守恒可判定且审查包保持 file_only"}`
- **evidence_path**：`quality/evidence/phase-p3-usage-T012.json`
- **STOP**：需把上下文优化宣称已证明下降时停止。
- **recovery**：回退 packet 输入至兼容读法。
- **task risk**：packet 分层隐藏关键行为。

### Verify

`./node_modules/.bin/vitest run tests/contract/freeze-classification-budget-usage-protocol.test.mjs -t "P3" && ./node_modules/.bin/vitest run tests/contract/material-oracle-context-packet.test.mjs -t "P3"` — 覆盖预算与用量观测。

### Knowledge

交给 P4：预算与观测已可用；上下文守恒已生效。

### STOP

需新增持久 store 时停止。

### Done

预算正确、观测如实、上下文可追踪。

### Risks and rollback

- **Risk**：RISK-010 usage 依赖 provider。
- **Rollback**：保留 unavailable 标注，回退计数器。

## Phase 4 — 跨阶段协议与回归

### Goal

以统一回退协议贯通五阶段，完成 E2E 回归与材料/流程的剩余覆盖及 dogfood 观察。

### Files

- **MODIFY**：`runtime/stage/stage-content-contracts.mjs`、`runtime/stage/stage-handlers.mjs`、`workflows/make-decision/SKILL.md`、`workflows/build-spec/SKILL.md`、`workflows/build-plan/SKILL.md`、`workflows/build-code/SKILL.md`、`workflows/verify-code/SKILL.md`、`tools/cli/stage-runtime.mjs`、`tools/host/workflowhub-stage-agent-bridge.mjs`、`tests/contract/host-outcome-bridge.test.mjs`、`evidence/diagnostic-report.md`
- **NEW**：`tests/contract/freeze-classification-budget-usage-protocol.test.mjs`（P4 段）、`tests/contract/material-oracle-context-packet.test.mjs`（P4 段）

### Tasks

#### T013 — RED：统一回退协议缺口与材料边界回归缺失

- **ID**：T013
- **Phase**：Phase 4 — 跨阶段协议与回归
- **goal**：构造方向级在 build-spec 内自修、规格歧义被当实现级吞掉、回退演变为整阶段重跑的样本，证明协议未统一。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-close-readiness-governance-20260906/spec.md","hash":"c38d0513c05c7d101f191231eb73596adb14eaa00d670437c4c2884e882397ef","id":"SPEC-CLOSE-READINESS-20260906"},{"artifact_kind":"plan","ref":"specs/workflowhub-close-readiness-governance-20260906/plan.md","hash":"09997a214575ab803a29233d11e10a7baea7f6bcef1844a2580e36be851ad3db","id":"PLAN-CLOSE-READINESS-20260906"}]`
- **输入**：FR-LOOP-006、FR-BOUND-001/002。
- **依赖**：T012
- **并行**：否
- **FR**：FR-LOOP-006、FR-BOUND-001、FR-BOUND-002
- **AC**：AC-LOOP-006、AC-BOUND-001、AC-BOUND-002
- **动作**：新增负向测试覆盖五类路由（实现级/规格歧义/方向级/材料 gap/环境不可用）、回退校验落点、重跑防护与协议引用一致性。
- **精确文件**：`tests/contract/freeze-classification-budget-usage-protocol.test.mjs`
- **boundary**：files: `tests/contract/freeze-classification-budget-usage-protocol.test.mjs`; symbols/regions: unifiedFallback、routeGuard。
- **输出**：RED 显示错误路由未被阻断或正确路由被误阻断修复。
- **Knowledge**：协议只约束正式完成，不阻断修复。
- **producer**：对应阶段主会话
- **consumer**：五阶段阶段完成条件校验
- **owner**：runtime/stage
- **freshness**：绑定当前 task/material_revision/snapshot_tree
- **verification_role**：RED
- **paired_task**：T014
- **gate_cmd**：`./node_modules/.bin/vitest run tests/contract/freeze-classification-budget-usage-protocol.test.mjs -t "T013|protocol|bound"`
- **expected_exit**：1
- **oracle**：ORACLE-P4-FALLBACK `{"pass": "五类路由均正确且回退不演变为整阶段重跑，修复路径保留", "reject": {"input": "方向级 finding 在 build-spec 内标 fixed 后继续", "expected_rejection": "回退校验记录错误并阻断正式完成但不阻断修复", "observation": "校验返回 fallback_mismatch 且 completion 仍 incomplete"}}`
- **evidence_path**：`quality/evidence/phase-p4-protocol-T013.json`
- **STOP**：需新增阶段/公共入口/门时停止。
- **recovery**：补回退映射，不扩大控制面。
- **task risk**：SKILL 引用不一致残留。

##### 执行状态填写区（唯一完成权威）

- **status**：completed
- **actual changed files**：`tests/contract/freeze-classification-budget-usage-protocol.test.mjs`
- **commands and exits**：T013 RED=1（缺少 `validateFallbackProtocol` 的预期负向失败）。
- **evidence refs**：`quality/evidence/phase-cards/phase-4-fallback-regression.md`、`quality/evidence/phase-p4-protocol-T013.json`
- **covered ACs**：AC-LOOP-006、AC-BOUND-001、AC-BOUND-002
- **review fact**：共享 Phase 4 wh-review 结果为 unavailable；不把空 findings 当通过。
- **completion time**：2026-09-07
- **执行事实**：五类回退路由的负向 oracle 已先 RED；错误 owner、整阶段重跑和完成伪通过均被纳入后续协议校验。

#### T014 — GREEN：实现统一回退协议与边界拒绝

- **ID**：T014
- **Phase**：Phase 4 — 跨阶段协议与回归
- **goal**：使 T013 负向被正确阻断且正向路由正确；协议写入各 SKILL 统一引用；边界错配走拒绝写入而语义缺失走缺口投影。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-close-readiness-governance-20260906/spec.md","hash":"c38d0513c05c7d101f191231eb73596adb14eaa00d670437c4c2884e882397ef","id":"SPEC-CLOSE-READINESS-20260906"},{"artifact_kind":"plan","ref":"specs/workflowhub-close-readiness-governance-20260906/plan.md","hash":"09997a214575ab803a29233d11e10a7baea7f6bcef1844a2580e36be851ad3db","id":"PLAN-CLOSE-READINESS-20260906"}]`
- **输入**：T013 RED。
- **依赖**：T013
- **并行**：否
- **FR**：FR-LOOP-006、FR-BOUND-001、FR-BOUND-002
- **AC**：AC-LOOP-006、AC-BOUND-001、AC-BOUND-002
- **动作**：实现统一回退协议校验器并插入各 handler 完成前；统一五个 stage SKILL 回退引用；在 `workflowhub-stage-agent-bridge.mjs` 的真实提交路径补齐 `project_name/task_id/task_path/stage/attempt_id/agent_run_id` 身份拒绝测试。
- **精确文件**：`runtime/stage/stage-handlers.mjs`、`workflows/make-decision/SKILL.md`、`workflows/build-spec/SKILL.md`、`workflows/build-plan/SKILL.md`、`workflows/build-code/SKILL.md`、`workflows/verify-code/SKILL.md`、`tools/cli/stage-runtime.mjs`、`tools/host/workflowhub-stage-agent-bridge.mjs`、`tests/contract/host-outcome-bridge.test.mjs`
- **boundary**：files: `runtime/stage/stage-handlers.mjs`, `workflows/build-spec/SKILL.md`; symbols/regions: fallbackProtocol、boundEnforce。
- **输出**：协议可判定且 handler 均引用同一协议文本。
- **Knowledge**：回退不重跑已确认部分。
- **producer**：对应阶段主会话
- **consumer**：五阶段阶段完成条件校验
- **owner**：runtime/stage
- **freshness**：绑定当前 task/material_revision/snapshot_tree
- **verification_role**：GREEN
- **paired_task**：T013
- **paired_task**：T013
- **独立审查动作**：Phase 4 GREEN 交接前，使用当前冻结 material_revision/snapshot_tree 调用一次 wh-review；保留 attempt/result、provider identity、usage 或 unavailable 原因，审查是质量事实，不是通过门。
- **gate_cmd**：`./node_modules/.bin/vitest run tests/contract/freeze-classification-budget-usage-protocol.test.mjs -t "T013|protocol|bound"`
- **expected_exit**：0
- **oracle**：ORACLE-P4-FALLBACK `{"pass": "统一协议与边界拒绝均正确且 SKILL 引用一致"}`
- **evidence_path**：`quality/evidence/phase-p4-protocol-T014.json`
- **STOP**：需以新公共入口承载时停止。
- **recovery**：回退协议引用至分散条文兼容模式。
- **task risk**：handler 遗漏插入点。

##### 执行状态填写区（唯一完成权威）

- **status**：completed
- **actual changed files**：`runtime/stage/stage-content-contracts.mjs`、`runtime/stage/stage-handlers.mjs`、五个正式 stage 的 `SKILL.md`、`tests/contract/host-outcome-bridge.test.mjs`、`tests/contract/freeze-classification-budget-usage-protocol.test.mjs`
- **commands and exits**：Phase 4 protocol GREEN=0（4 tests）；bridge=0（10 tests）；syntax/diff=0。
- **evidence refs**：`quality/evidence/phase-cards/phase-4-fallback-regression.md`、`quality/evidence/phase-p4-protocol-T014.json`、`quality/evidence/review-results/build-code-phase-p4-review.json`
- **covered ACs**：AC-LOOP-006、AC-BOUND-001、AC-BOUND-002
- **review fact**：一次共享 Phase 4 independent wh-review 在 broker 超时，`REVIEW_EXECUTION_TIMEOUT`；provider 结果为空，状态保持 unavailable。
- **completion time**：2026-09-07
- **执行事实**：统一协议由 runtime 单一校验器提供，handler 在正式 completion 前消费；错配保持 incomplete 且 continuation_allowed=true；bridge 的 project/task/path/stage/attempt/agent identity 缺失均在写入前拒绝。

#### T015 — RED：诊断、流程与上下文的回归缺口

- **ID**：T015
- **Phase**：Phase 4 — 跨阶段协议与回归
- **goal**：构造诊断无来源、流程缺 worktree 绑定、上下文无导航/摘要、phase 验收缺回执等回归缺口，证明遗留 FR/AC 未被覆盖。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-close-readiness-governance-20260906/spec.md","hash":"c38d0513c05c7d101f191231eb73596adb14eaa00d670437c4c2884e882397ef","id":"SPEC-CLOSE-READINESS-20260906"},{"artifact_kind":"plan","ref":"specs/workflowhub-close-readiness-governance-20260906/plan.md","hash":"09997a214575ab803a29233d11e10a7baea7f6bcef1844a2580e36be851ad3db","id":"PLAN-CLOSE-READINESS-20260906"}]`
- **输入**：FR-DIAG-001/002/003、FR-FLOW-001/002/003、FR-PREF-001/002、FR-GOV-001、FR-REPORT-001、FR-CONTEXT-002 与对应 AC。
- **依赖**：T014
- **并行**：否
- **FR**：FR-DIAG-001、FR-DIAG-002、FR-DIAG-003、FR-FLOW-001、FR-FLOW-002、FR-FLOW-003、FR-PREF-001、FR-PREF-002、FR-GOV-001、FR-REPORT-001、FR-CONTEXT-002
- **AC**：AC-DIAG-001、AC-DIAG-002、AC-DIAG-003、AC-FLOW-001、AC-FLOW-002、AC-FLOW-003、AC-PREF-001、AC-PREF-002、AC-GOV-001、AC-REPORT-001、AC-CONTEXT-002
- **动作**：新增负向回归测试覆盖诊断四段、phase 验收绑定、预检九字段、六状态、导航节可再生性等偏回归项；由本任务生成并复核 `evidence/diagnostic-report.md` 的 source/evidence/impact/conclusion 四段绑定。
- **精确文件**：`tests/contract/material-oracle-context-packet.test.mjs`、`evidence/diagnostic-report.md`
- **boundary**：files: `tests/contract/material-oracle-context-packet.test.mjs`; symbols/regions: diagnosticReport、flowContract、prefContract、govBoundary、reportBrief。
- **输出**：RED 显示遗留项未被 task 覆盖或缺口仍会丢失。
- **Knowledge**：诊断与流程为只读事实，不阻断。
- **producer**：build-spec/build-plan 主会话
- **consumer**：用户与 build-plan/verify-code
- **owner**：build-spec/build-plan 阶段实现者
- **freshness**：绑定当前 task/material_revision/snapshot_tree
- **verification_role**：RED
- **paired_task**：T016
- **gate_cmd**：`./node_modules/.bin/vitest run tests/contract/material-oracle-context-packet.test.mjs -t "T015|diag|flow|pref|gov|report"`
- **expected_exit**：1
- **oracle**：ORACLE-P4-REGRESSION `{"pass": "诊断、流程、预检、治理边界与汇报均完整且可复核", "reject": {"input": "未带 confirmation 回执的 phase 验收被当 accepted", "expected_rejection": "材料检查判不完整并提示补回执绑定", "observation": "检查返回 incomplete，reason=missing_confirmation_receipt"}}`
- **evidence_path**：`quality/evidence/phase-p4-regression-T015.json`
- **STOP**：需新增第五材料时停止。
- **recovery**：补证据契约，不新增 gate。
- **task risk**：跨多域回归遗漏分支。

##### 执行状态填写区（唯一完成权威）

- **status**：completed
- **actual changed files**：`tests/contract/material-oracle-context-packet.test.mjs`、`specs/workflowhub-close-readiness-governance-20260906/evidence/diagnostic-report.md`
- **commands and exits**：T015 RED=1（缺少 `validateDiagnosticReport` 的预期负向失败）；diagnostic/report GREEN=0（2 tests）；实际报告校验=0。
- **evidence refs**：`quality/evidence/phase-cards/phase-4-fallback-regression.md`、`quality/evidence/phase-p4-regression-T015.json`
- **covered ACs**：AC-DIAG-001、AC-DIAG-002、AC-DIAG-003、AC-FLOW-001、AC-FLOW-002、AC-FLOW-003、AC-PREF-001、AC-PREF-002、AC-GOV-001、AC-REPORT-001、AC-CONTEXT-002
- **review fact**：共享 Phase 4 independent wh-review unavailable，未产生 provider findings。
- **completion time**：2026-09-07
- **执行事实**：诊断报告固定四段 source/evidence/impact/conclusion；缺 task/material/snapshot/confirmation 绑定时判 incomplete；报告仅为 derived evidence，不变成第五材料。

#### T016 — GREEN：回归收口与 dogfood 观察落地

- **ID**：T016
- **Phase**：Phase 4 — 跨阶段协议与回归
- **goal**：使 T015 负向被判不完整且正向回归通过；完成全链路端到端回归与 dogfood 五要素观察落地（若独立观察者不可得则记录 unavailable）。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-close-readiness-governance-20260906/spec.md","hash":"c38d0513c05c7d101f191231eb73596adb14eaa00d670437c4c2884e882397ef","id":"SPEC-CLOSE-READINESS-20260906"},{"artifact_kind":"plan","ref":"specs/workflowhub-close-readiness-governance-20260906/plan.md","hash":"09997a214575ab803a29233d11e10a7baea7f6bcef1844a2580e36be851ad3db","id":"PLAN-CLOSE-READINESS-20260906"}]`
- **输入**：T015 RED、全量 30 FR/30 AC 与已实现的 6 机制。
- **依赖**：T015
- **并行**：否
- **FR**：FR-DIAG-001、FR-DIAG-002、FR-DIAG-003、FR-FLOW-001、FR-FLOW-002、FR-FLOW-003、FR-PREF-001、FR-PREF-002、FR-GOV-001、FR-REPORT-001、FR-CONTEXT-002
- **AC**：AC-DIAG-001、AC-DIAG-002、AC-DIAG-003、AC-FLOW-001、AC-FLOW-002、AC-FLOW-003、AC-PREF-001、AC-PREF-002、AC-GOV-001、AC-REPORT-001、AC-CONTEXT-002
- **动作**：实现遗留域的只读合同与检查补齐；组织 E2E 回归（冻结→分类→暂停→预算→观测→回退）与 dogfood 观察记录。
- **精确文件**：`runtime/stage/stage-content-contracts.mjs`、`runtime/stage/stage-handlers.mjs`、`workflows/verify-code/SKILL.md`
- **boundary**：files: `runtime/stage/stage-content-contracts.mjs`, `runtime/stage/stage-handlers.mjs`; symbols/regions: regressionSuite、dogfoodObserve。
- **输出**：回归绿且 30 FR 均被任务覆盖；dogfood 按五要素记录。
- **Knowledge**：回归仅追加事实，不声明发布通过。
- **producer**：build-spec/build-plan 主会话
- **consumer**：用户与 build-plan/verify-code
- **owner**：build-spec/build-plan 阶段实现者
- **freshness**：绑定当前 task/material_revision/snapshot_tree
- **verification_role**：GREEN
- **paired_task**：T015
- **paired_task**：T015
- **独立审查动作**：Phase 4 GREEN 交接前，使用当前冻结 material_revision/snapshot_tree 调用一次 wh-review；保留 attempt/result、provider identity、usage 或 unavailable 原因，审查是质量事实，不是通过门。
- **gate_cmd**：`./node_modules/.bin/vitest run tests/contract/material-oracle-context-packet.test.mjs -t "T015|diag|flow|pref|gov|report"`
- **expected_exit**：0
- **oracle**：ORACLE-P4-REGRESSION `{"pass": "E2E 回归与剩余域收口均通过且 30 FR 覆盖完整"}`
- **evidence_path**：`quality/evidence/phase-p4-regression-T016.json`
- **STOP**：需把 dogfood 当新 gate 时停止。
- **recovery**：回退回归补充，保持已验证部分。
- **task risk**：回归膨胀导致 phase 过重。

##### 执行状态填写区（唯一完成权威）

- **status**：completed
- **actual changed files**：`runtime/stage/stage-content-contracts.mjs`、`runtime/stage/stage-handlers.mjs`、`workflows/verify-code/SKILL.md`、Phase 4 合同测试和诊断报告
- **commands and exits**：Phase 4 regression=0（2 tests）；handler/plan/cutover/official receipt/preflight/bridge focused regression=0（190 passed/22 skipped）；syntax/diff=0。
- **evidence refs**：`quality/evidence/phase-cards/phase-4-fallback-regression.md`、`quality/evidence/phase-p4-regression-T016.json`、`quality/evidence/review-results/build-code-phase-p4-review.json`
- **covered ACs**：AC-DIAG-001、AC-DIAG-002、AC-DIAG-003、AC-FLOW-001、AC-FLOW-002、AC-FLOW-003、AC-PREF-001、AC-PREF-002、AC-GOV-001、AC-REPORT-001、AC-CONTEXT-002
- **review fact**：Phase 4 wh-review `unavailable`，原因 `REVIEW_EXECUTION_TIMEOUT`；这不是 approval，也不解除 build-code 质量不完整。
- **completion time**：2026-09-07
- **执行事实**：完成冻结→分类→暂停→预算→观测→统一回退的 focused 回归和 bridge/preflight 回归；dogfood 五要素已记录，独立观察者 unavailable；未声明发布或 close 通过。

### Verify

`./node_modules/.bin/vitest run tests/contract/freeze-classification-budget-usage-protocol.test.mjs -t "P4" && ./node_modules/.bin/vitest run tests/contract/material-oracle-context-packet.test.mjs -t "P4"` — 覆盖协议、边界与回归。

### Knowledge

交付给 verify-code：全量 30 FR 已覆盖；观测事实随 outcome 归档。

### STOP

需把回归当自动发布门时停止。

### Done

统一协议贯通且回归可复核。

### Risks and rollback

- **Risk**：全链回归过重。
- **Rollback**：拆分回归至独立 phase 追加，不回滚已通过校验。

## Phase 5：verify-code 自动收口与 close 边界回归

### T017：移除 verify-code 重复人工确认

- **Status**：implemented; focused contract tests passed
- **Scope**：completion predicate、acceptance policy、release projection、runner/adapter/kernel、workflow manifest、SKILL 与 docs
- **Oracle**：当前 review + stage outcome 可完成 verify；无 `verify_confirmation_missing`；旧历史确认不成为当前硬门

### T018：保留失败闭合与 close 授权边界

- **Status**：implemented; integration/e2e suite has unrelated pre-existing failures and remains incomplete
- **Scope**：unavailable、旧 revision、错绑 evidence、serious finding、close-plan confirmation、irreversible authorization、accepted_risk
- **Oracle**：质量缺失不伪造通过；close authorization 仍独立要求；运行失败逐项记录，不改写为 green

### Phase 5 completion rule

focused tests、syntax、diff 和旧 step 反向扫描必须全部可解释；任何 unrelated baseline failure、provider unavailable 或新回归都保留为事实，不能以“没有人工确认”替代质量证据。

## Current execution note (2026-09-07)

- verify-code 的“人工确认当前代码审查结论”已从当前流程和完成谓词移除；当前正式代码审查结果由本次任务会话发布，close authorization 仍是独立的不可逆操作授权。
- 当前 build-code 证据已重新采集：focused tests、实现 receipt、独立 wh-review 和 Stage Agent outcome 均绑定本任务材料与 snapshot；provider finding `F-c66753041a1e` 已经源代码和 focused test 复核，判定为 `rejected_invalid`，不修改已正确的实现。
- 发现并修复两类流程问题：make-decision 的 deep-research skill 依赖指向不存在的 `make-decision#researchInput`；所有 review attempt unavailable 时，finding disposition 不得被错误投影成空 findings，应保留为 `missing`。
- 复核实际 broker 退出路径后补充 `BROKER_EXIT_NONZERO` 的 group-level unavailable 白名单，并加入回归用例；这类失败应记录为当前审查不可用，不应因未派发 provider 而触发二次运行时错误。
- 当前验收仍不宣称完成：30 条 AC 的逐条语义证据仍不完整，宽范围回归存在既有 fixture 失败/挂起事实；因此当前任务未 close，product release 保持 `not_released`。

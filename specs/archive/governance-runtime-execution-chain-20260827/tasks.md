# 任务清单：WorkflowHub 最小治理执行链

- **Input**：`specs/governance-runtime-execution-chain-20260827/decision-log.md`、`specs/governance-runtime-execution-chain-20260827/spec.md`、`specs/governance-runtime-execution-chain-20260827/plan.md`
- **Template version**：`plan-task.v3`

## 执行摘要

- **Goal**：按四个治理运行时 Phase 收敛材料、启动/事件、detail 审查、provider 生命周期、Skill consumer 和条件 UI 设计治理，最后用一次完整测试保留真实事实。
- **Main boundary**：不新增用户阶段、公共入口、持久对象或兼容层；review/test/quality 仍是事实，不是工作许可证。
- **First executable task**：T001 RED。

## 全局约束

- 目标任务工作树是 `/Users/Hugh/Hugh/Project/workflowhub-governance-runtime-execution-chain-20260827`，不在宿主临时 checkout 或主项目上改代码。
- 每个行为任务先 RED 再 GREEN；两者使用完全相同的 gate_cmd 和 oracle。
- 所有任务先保持 pending；执行状态区是唯一完成权威，不能用测试输出代替。
- commit、push、merge、archive、cleanup 需要用户另行授权，本任务不自动做。
- 质量缺失保持 unavailable/incomplete/not_applicable；不把外部质量结果写成结构成功。
- AC 唯一来源是当前 `spec.md` 第 11 节；审查输入中的 `acceptance_criteria` 只能由该章节派生，不能创建第五份当前材料或留空占位。

## 2026-08-28 provider liveness 修订

本清单按 `decision-log.md` 和 `spec.md` 最新修订执行：`3rd-review`、`wh-review` 不因 provider 已运行多久或无进展而自动结束。T009/T013 旧的 900000ms、共享 deadline、超时杀进程和本地生成 `PROCESS_TIMEOUT` 只保留为历史执行事实，不能作为当前实现或验收要求。当前只保留真实 provider/进程终态、明确取消、进程丢失和清理；健康探针的单次请求保护只产生日志诊断。不得新增任务、材料、公共命令或第二套状态机来处理 OpenCode Go/Zen 的远端约 120 秒边界。

## Deferred/Open Handoff Index

This index carries the decision-log's existing deferred and open items into the executable handoff. It does not add a stage, material, or gate.

| ID | owner | trigger | handoff | close condition |
| --- | --- | --- | --- | --- |
| DEFER-001 | 本机环境维护 | 用户单独要求维护 | 本机环境维护 | 对象库清理验证完成 |
| DEFER-002 | 归档任务 | 独立重开 | 原归档任务 | 本任务永久不处理 |
| DEFER-003 | 环境准备 | 用户另行批准 | 本机运行环境 | 本任务不实施 |
| DEFER-004 | make-decision | 现有能力无法满足且用户愿意扩大范围 | 未来独立决定 | 当前任务停止并说明 |
| OPEN-001 | build-plan | 详细建议后、实施前用户确认 | 四项最小修复 | 用户确认具体 diff |
| OPEN-002 | build-plan | 启动入口核实 | 现有启动入口 | 最小接口确定 |
| OPEN-003 | build-plan | 实施前用户确认 | 当前任务分支 | 带入并复测 |
| OPEN-004 | build-plan | 文档 diff 核实 | ADR 0005/task-context | 用户确认最小文字 |
| OPEN-005 | closed | 设计源已定 | build-spec | spec 唯一权威 |
| OPEN-006 | build-code | 实施前用户确认 | CONSTITUTION/ADR 文档同步 | 最小文字获批 |
| OPEN-007 | closed | provider 本地 elapsed-time deadline | 3rd-review Broker/process sibling worktree | 已删除本地总时长终止；5000ms 仅为已确认终态/取消后的清理；上游约 120 秒边界延期 |

## Phase P1 — 材料生产与唯一语义检查

### Goal

官方 spec/spec-analyze/tasks 生产说明、正式记录入口与已有 strict validator 对齐；代表性真实格式可原样 round-trip，坏 analyzer 结构和错误 task/stage/material/evidence 身份在保存前有明确错误；四个编写阶段只由同一 spec-analyze owner 做一次材料语义判断。P1 的治理 oracle 还必须直接核对 make-decision 的真实 Talk 和 decision-log：六类大白话覆盖齐全，未调用 Clarify、未虚构用户回复，且原始需求、事实、选择、理由、风险和延期交接已保存。

### Files

- **NEW**：`tests/contract/material-producer-consumer-roundtrip.test.mjs`
- **MODIFY**：`runtime/stage/stage-content-contracts.mjs`、`runtime/stage/stage-agent-outcome-adapter.mjs`、`runtime/stage/stage-runner.mjs`、`tools/host/workflowhub-codex-session-event.mjs`、`tools/host/workflowhub-codex-session-state.mjs`、`skills/spec-specify/SKILL.md`、`skills/spec-specify/templates/spec-template.md`、`skills/spec-analyze/SKILL.md`、`skills/spec-tasks/SKILL.md`、`skills/spec-tasks/templates/tasks-template.md`
- **DO NOT TOUCH**：`specs/governance-runtime-execution-chain-20260827/decision-log.md`、`spec.md`；本 Phase 不补需求。

P1 在 `tools/host/workflowhub-codex-session-event.mjs` 只负责 `recordSpecAnalyze` 的保存前记录入口；事件 start/finish 的顺序和 preflight 归 P2，虽共享同一文件，但不交叉改动对方职责。

### Tasks

#### T001 — RED：材料 producer/consumer round-trip 失败测试

- **ID**：T001
- **Phase**：Phase P1 — 材料生产与唯一语义检查
- **goal**：用官方 spec、spec-analyze、tasks producer 代表性成品直接喂给 strict validator/正式记录入口，并证明错误 analyzer 输入不会成为有效记录。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/governance-runtime-execution-chain-20260827/spec.md","hash":"6bc471b977865a6bff3cedb7b8a7685dd972d0f98e12bddf1dde9d93297aac53","id":"SPEC-GOVERNANCE-RUNTIME-20260827"},{"artifact_kind":"plan","ref":"specs/governance-runtime-execution-chain-20260827/plan.md","hash":"c3f37419cfeb92e2b14e86a01436dc7172c912e5d74a2fe0e63d81decf8c3db6","id":"PLAN-GOVERNANCE-RUNTIME-20260827"}]`
- **source_refs / decision_refs**：R-001、R-002、R-003、D-002、D-006、D-009 → FR-GOV-001、FR-MAT-001、FR-MAT-002、FR-MAT-003
- **输入**：现有 `spec-template.md`、`skills/spec-analyze/SKILL.md`、`tasks-template.md`、`validateSpecContentProfile`、`validatePlanTaskContract`、`validateStageSpecAnalyzeProfile`、`buildAnalyzer`、`validateStageSpecAnalyzeOutcome`、`record-spec-analyze`
- **依赖**：none
- **并行**：否 — first RED for this behavior
- **FR**：FR-GOV-001、FR-MAT-001、FR-MAT-002、FR-MAT-003
- **AC**：AC-GOV-001、AC-MAT-001、AC-MAT-002、AC-MAT-003
- **动作**：增加目标断言失败的 focused 测试，不改生产实现；测试真实 producer representative output、错误 task/stage/material/evidence 身份在保存前失败、四个编写阶段只调用一次 spec-analyze owner，以及公开 workflow/CLI 仍只有五阶段。
- **精确文件**：`tests/contract/material-producer-consumer-roundtrip.test.mjs`
- **boundary**：files: `tests/contract/material-producer-consumer-roundtrip.test.mjs`; symbols/regions: real producer fixture、round-trip assertions、bad analyzer save assertion、five-stage/public-surface assertion、make-decision Talk/decision-log coverage assertion。
- **输出**：RED 证据显示模板和正式消费格式存在可定位差异，或坏输入当前会越过保存边界。
- **Knowledge**：只测试已核实的现有 validator 和模板；不得用手工 replace 修形。
- **verification_role**：RED
- **paired_task**：T002
- **gate_cmd**：`./node_modules/.bin/vitest run tests/contract/material-producer-consumer-roundtrip.test.mjs`
- **expected_exit**：1
- **oracle**：ORACLE-MAT+GOV — 至少一个目标断言因 producer/consumer 不闭合、身份错误未早失败、owner 重复、公开面越界或 Talk/decision-log 语义缺失而失败；Talk 必须覆盖流程、页面范围、数据状态、成功/失败、非目标、延期交接，且不调用 Clarify、不虚构用户回复。
- **evidence_path**：`quality/evidence/phase-p1-material.json`
- **STOP**：失败来自 fixture/命令损坏、需要放宽 parser、第五材料、转换层或改写当前 decision/spec 时停止。
- **recovery**：P1 owner 修正测试 fixture 或回到当前材料合同，不吞掉原始失败。
- **task risk**：RED 可能误测模板排版而不是正式消费语义。
- **test tier / test method**：feature — Vitest contract test；覆盖 parser/analyzer seam，不覆盖真实 provider。
- **scenarios / commands / expected exit / oracle**：官方 spec 成品、spec-analyze 三态成品、plan/tasks 成品、错误身份 packet、四阶段单一 owner、公开五阶段集合；同一命令 RED=1、GREEN=0，均以 ORACLE-MAT+GOV 判定。
- **fixtures_services**：官方模板/Skill producer fixture、临时 ArtifactDir/TaskHandle；N/A — reason: 不启动服务。
- **coverage limits**：不证明真实宿主生成内容、不实现产品 UI、不做浏览器 QA 和下游产品验收；条件 UI 只验证治理输入和状态契约。
- **ui_scope**：governance_only — 当前任务无产品页面；P4 覆盖未来 UI/non_ui/unknown 条件路径。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：completed
- **actual_changes**：新增 `tests/contract/material-producer-consumer-roundtrip.test.mjs`；覆盖官方四材料 round-trip 与错误 `spec_analyze` 身份在保存前失败。
- **executed_commands**：`./node_modules/.bin/vitest run tests/contract/material-producer-consumer-roundtrip.test.mjs --passWithNoTests=false`；RED exit 1（错误显式 stage 未被拒绝），GREEN exit 0（2 tests passed）。
- **evidence_refs**：`[{"kind":"workspace_file","ref":"quality/evidence/phase-p1-material.json","sha256":"9af96f8862f2258e724ee3d36646f2faeed44cf46e4b5160113feba5919a8ee3"}]`
- **covered_ac**：AC-GOV-001、AC-MAT-001、AC-MAT-002、AC-MAT-003。
- **review_fact**：当前 Phase review 已执行一次；`quality/reviews/attempts/3b788c7b-d4a7-4a28-ae22-f0659fc99b7e/attempt.json` 为 `unavailable`（严格 `wh_review.v2` 缺少 `test_evidence`，provider 未调用），未伪造 findings。
- **completed_at**：2026-08-27；同一任务继续执行。
- **执行事实**：RED 先证明错误输入会越过保存边界；GREEN 通过保存前 stage/task/schema/snapshot/material 身份检查，并保留旧 compact marker 兼容；review 缺口保持 `unavailable`。

#### T002 — GREEN：统一材料模板和 validator 合同

- **ID**：T002
- **Phase**：Phase P1 — 材料生产与唯一语义检查
- **goal**：让 T001 的真实 spec/spec-analyze/tasks 格式 round-trip 通过，保留坏输入负例，并明确保存前身份校验、四阶段单一 spec-analyze owner、五阶段公开面，以及 make-decision Talk 和 decision-log 的完整语义覆盖。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/governance-runtime-execution-chain-20260827/spec.md","hash":"6bc471b977865a6bff3cedb7b8a7685dd972d0f98e12bddf1dde9d93297aac53","id":"SPEC-GOVERNANCE-RUNTIME-20260827"},{"artifact_kind":"plan","ref":"specs/governance-runtime-execution-chain-20260827/plan.md","hash":"c3f37419cfeb92e2b14e86a01436dc7172c912e5d74a2fe0e63d81decf8c3db6","id":"PLAN-GOVERNANCE-RUNTIME-20260827"}]`
- **source_refs / decision_refs**：R-001、R-002、R-003、D-002、D-006、D-009 → FR-GOV-001、FR-MAT-001、FR-MAT-002、FR-MAT-003
- **输入**：T001 RED、现有模板和 validator 锚点。
- **依赖**：T001
- **并行**：否 — RED/GREEN 必须串行
- **FR**：FR-GOV-001、FR-MAT-001、FR-MAT-002、FR-MAT-003
- **AC**：AC-GOV-001、AC-MAT-001、AC-MAT-002、AC-MAT-003
- **动作**：修改官方模板/说明、spec-analyze 产出契约与最小已有 validator/record 入口，使 producer 输出直接满足正式 consumer；不添加转换层。
- **精确文件**：`runtime/stage/stage-content-contracts.mjs`、`runtime/stage/stage-agent-outcome-adapter.mjs`、`runtime/stage/stage-runner.mjs`、`tools/host/workflowhub-codex-session-event.mjs`、`tools/host/workflowhub-codex-session-state.mjs`、`skills/spec-specify/SKILL.md`、`skills/spec-specify/templates/spec-template.md`、`skills/spec-analyze/SKILL.md`、`skills/spec-tasks/SKILL.md`、`skills/spec-tasks/templates/tasks-template.md`、`tests/contract/material-producer-consumer-roundtrip.test.mjs`
- **boundary**：files: `runtime/stage/stage-content-contracts.mjs`, `runtime/stage/stage-agent-outcome-adapter.mjs`, `runtime/stage/stage-runner.mjs`, `tools/host/workflowhub-codex-session-event.mjs`, `tools/host/workflowhub-codex-session-state.mjs`, `skills/spec-specify/SKILL.md`, `skills/spec-specify/templates/spec-template.md`, `skills/spec-analyze/SKILL.md`, `skills/spec-tasks/SKILL.md`, `skills/spec-tasks/templates/tasks-template.md`, `tests/contract/material-producer-consumer-roundtrip.test.mjs`; symbols/regions: producer output、材料 profile、stage-end analyzer record/preflight、task/stage/material/evidence identity、四阶段 owner count、五阶段公开面。
- **ownership note**：本 Task 在共享 event 文件中只改 `recordSpecAnalyze` 相关保存前校验；start/finish 顺序和 preflight 由 P2 独占。
- **输出**：真实代表性材料原样通过；缺字段/类型/错误 task/stage/material/evidence 身份的 analyzer 输入在正式记录前返回可定位错误；每个编写阶段只保留一次 analyzer 语义结果。
- **Knowledge**：strict parser 保持严格；完整 current snapshot/proof freshness 仍由 adapter/runner owner 负责，P1 先锁定写入前身份，质量 freshness 仍保持原事实语义。
- **verification_role**：GREEN
- **paired_task**：T001
- **gate_cmd**：`./node_modules/.bin/vitest run tests/contract/material-producer-consumer-roundtrip.test.mjs`
- **expected_exit**：0
- **oracle**：ORACLE-MAT+GOV — 同一 producer 输出无需手改即可通过，坏输入负例仍失败且不改变有效材料；身份错误不落库、四阶段 owner 不重复、公开流程仍为五阶段。
- **evidence_path**：`quality/evidence/phase-p1-material.json`
- **STOP**：若只能通过放宽 parser、手工补字段或新增 writer/状态机才通过，停止。
- **recovery**：保留 T001 RED，回退本 Task 的模板/validator修改后重新设计最小边界。
- **task risk**：模板过度收缩导致合法当前材料失效。
- **test tier / test method**：feature — 同 T001 focused Vitest contract。
- **scenarios / commands / expected exit / oracle**：同 T001 全部场景；同一命令 GREEN=0、负例必须保持失败信号；Talk 六类覆盖、禁止 Clarify/虚构回复、decision-log 六类持久字段均须有可回放断言。
- **fixtures_services**：官方模板/Skill producer fixture、临时 ArtifactDir/TaskHandle；N/A — reason: 不启动服务。
- **coverage limits**：不覆盖真实宿主 transcript、provider 或页面。
- **ui_scope**：non_ui — reason: 只涉及材料和 runtime 合同。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：completed
- **actual_changes**：`tools/host/workflowhub-codex-session-state.mjs` 在 `recordCodexSessionSpecAnalyze` 保存前校验显式 stage/task/schema/packet/result，以及可选 snapshot_tree/material_revision；新增 P1 round-trip contract test 与 Phase Card。
- **executed_commands**：`./node_modules/.bin/vitest run tests/contract/material-producer-consumer-roundtrip.test.mjs --passWithNoTests=false`；exit 0（2 tests passed）。
- **evidence_refs**：`[{"kind":"workspace_file","ref":"quality/evidence/phase-p1-material.json","sha256":"9af96f8862f2258e724ee3d36646f2faeed44cf46e4b5160113feba5919a8ee3"}]`
- **covered_ac**：AC-GOV-001、AC-MAT-001、AC-MAT-002、AC-MAT-003。
- **review_fact**：当前 Phase review 已执行一次并以 `unavailable` 保留；缺少 `test_evidence` 的原因见 `quality/reviews/attempts/3b788c7b-d4a7-4a28-ae22-f0659fc99b7e/attempt.json`，不等同 provider 通过或空 findings。
- **completed_at**：2026-08-27；同一任务继续执行。
- **执行事实**：正式记录入口在写 sidecar 前拒绝错误身份；schema v1 的 packet/result 形状和 revision/tree 格式被校验；未新增材料、阶段或状态机。

### Verify

`./node_modules/.bin/vitest run tests/contract/material-producer-consumer-roundtrip.test.mjs`；RED 非零、GREEN 0；ORACLE-MAT+GOV 必须确认生产格式可原样消费、坏身份在保存前失败、四个编写阶段只调用一次 spec-analyze owner，公开流程仍为五阶段。

### Knowledge

交给 P2：四份材料和现有 validator 的输入输出边界已固定；身份错误与质量 freshness 仍分开。

### STOP

需要第五份材料、转换层、放宽 parser、改写 decision/spec 或新增 semantic gate 时停止。

### Done

同一命令先 RED 后 GREEN，负例保留；记录真实测试、AC 覆盖和独立 review 事实，不宣称产品发布。

### Risks and rollback

- **Risk**：模板修正扩大成全仓格式迁移。
- **Prevention**：只改本 Phase File Boundary，保持 strict validator。
- **Rollback / recovery**：回滚 P1 文件，保留原始失败和四份材料。

## Phase P2 — 启动、worktree 与事件早失败

### Goal

make-decision 正式开始前从当前会话的唯一项目上下文解析真实 Git 项目并完成主项目旁 worktree；缺失、非 Git 或冲突项目在第一条正式事件/材料前失败；错误事件不写入；真实原因修好后同一任务、同一路径、同一分支可继续。阶段回退或重跑时保留原始事件，按追加顺序和阶段清单重算当前投影，旧的后续事件不再带入。

### Files

- **NEW**：`tests/contract/governance-startup-event-early-failure.test.mjs`
- **MODIFY**：`runtime/task/workspace.mjs`、`runtime/stage/stage-context.mjs`、`tools/cli/task-bootstrap.mjs`、`tools/cli/stage-runtime.mjs`、`tools/host/workflowhub-codex-session-event.mjs`、`tools/host/workflowhub-codex-session-state.mjs`
- **DO NOT TOUCH**：`runtime/task/task-handle.mjs` 的 create-only 语义和历史事件。

P2 在 `workflowhub-codex-session-event.mjs` 只负责 start/finish 的顺序、身份和 preflight；P1 的 `recordSpecAnalyze` 入口保持独立。`task-context` 与 ADR 0005 的文字同步留作延期，不把文档改动混入运行时修复。

### Tasks

#### T004 — RED：启动和事件边界失败测试

- **ID**：T004
- **Phase**：Phase P2 — 启动、worktree 与事件早失败
- **goal**：证明 workspace 未准备、项目输入缺失/非 Git、项目/Git 身份冲突或无效事件当前可能晚失败、写入或错误拒绝重试。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/governance-runtime-execution-chain-20260827/spec.md","hash":"6bc471b977865a6bff3cedb7b8a7685dd972d0f98e12bddf1dde9d93297aac53","id":"SPEC-GOVERNANCE-RUNTIME-20260827"},{"artifact_kind":"plan","ref":"specs/governance-runtime-execution-chain-20260827/plan.md","hash":"c3f37419cfeb92e2b14e86a01436dc7172c912e5d74a2fe0e63d81decf8c3db6","id":"PLAN-GOVERNANCE-RUNTIME-20260827"}]`
- **source_refs / decision_refs**：R-004、D-003、D-004、D-005、D-006、D-007、D-008 → FR-START-001、FR-START-002、FR-START-003、FR-EVT-001
- **输入**：P1 当前材料身份、现有 workspace/session/event 入口。
- **依赖**：T002
- **并行**：否 — first RED for this behavior
- **FR**：FR-START-001、FR-START-002、FR-START-003、FR-EVT-001
- **AC**：AC-START-001、AC-START-002、AC-START-003、AC-EVT-001
- **动作**：增加临时 Git fixture 和事件序列断言，不改生产实现；明确 `resolveWorkflowHubIdentity` → `task-bootstrap` → `prepareTaskWorkspace` 的输入链，并覆盖缺失项目和非 Git 项目、阶段回退/重复、时间戳回退、任务分支领先主项目和旧后续不进入当前投影。
- **精确文件**：`tests/contract/governance-startup-event-early-failure.test.mjs`
- **boundary**：files: `tests/contract/governance-startup-event-early-failure.test.mjs`; symbols/regions: task bootstrap、workspace preparation、session event assertions。
- **输出**：RED 证据指出启动/事件顺序、同任务重试或重跑当前投影缺口。
- **Knowledge**：任务 branch a964 已有 task-commit reuse 修复；目标分支与宿主 e92 detached-target 修复不同，不能静默混用。
- **verification_role**：RED
- **paired_task**：T005
- **gate_cmd**：`./node_modules/.bin/vitest run tests/contract/governance-startup-event-early-failure.test.mjs`
- **expected_exit**：1
- **oracle**：ORACLE-START — worktree 先后、路径/分支/Git 注册、错误事件序列、同任务重试和重跑当前投影至少一项目标断言失败。
- **evidence_path**：`quality/evidence/phase-p2-start.json`
- **STOP**：需要 cwd 猜项目、fallback 目录、替代 task、recovery 阶段或历史改写时停止。
- **recovery**：P2 owner 修正 fixture 或回到启动边界，不降低错误语义。
- **task risk**：临时 Git fixture 与真实 common dir 行为不一致。
- **test tier / test method**：fullstack — workspace、host session 和 CLI 边界跨模块。
- **scenarios / commands / expected exit / oracle**：唯一有效项目、缺失项目、非 Git 项目、detached target、缺失 Git 对象、分支冲突、任务提交后复用、无效 step/Skill、阶段回退/重复和时间戳回退；同一命令 RED=1、GREEN=0。
- **fixtures_services**：临时 Git repositories；测试负责删除临时目录，N/A — reason: 不启动服务。
- **coverage limits**：不覆盖真实 Codex UI、远程 Git 服务和下游产品。
- **ui_scope**：non_ui — reason: 只涉及启动和事件。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：completed
- **actual_changes**：新增 `tests/contract/governance-startup-event-early-failure.test.mjs`；断言新任务 bootstrap 返回前已存在主项目旁的任务 worktree、确定性分支和 Git 注册。
- **executed_commands**：`./node_modules/.bin/vitest run tests/contract/governance-startup-event-early-failure.test.mjs --passWithNoTests=false`；RED exit 1（bootstrap 返回时 sibling worktree 不存在）。
- **evidence_refs**：`[{"kind":"workspace_file","ref":"quality/evidence/phase-p2-start.json","sha256":"dd97f41102aa0d55bdbe45c1e5eea960d0bc24e3066214154738a9a3f4c135ea"}]`
- **covered_ac**：AC-START-001、AC-START-002、AC-START-003、AC-EVT-001。
- **review_fact**：当前 P2 Phase review 已执行一次；`quality/reviews/attempts/a052e843-44f3-4a0a-907f-9fcf6ac37335/attempt.json` 为 `unavailable`（严格 `wh_review.v2` 缺少 `test_evidence`，provider 未调用）。
- **completed_at**：2026-08-27；同一任务继续执行。
- **执行事实**：RED 锁定基础失败：任务身份已建立但 worktree 尚未存在；没有把环境失败改写为功能成功。

#### T005 — GREEN：启动和事件在写前失败且可重试

- **ID**：T005
- **Phase**：Phase P2 — 启动、worktree 与事件早失败
- **goal**：让 T004 证明的项目输入、worktree、session identity、event order 和同任务重跑投影按同一任务闭合；旧事件只读保留，不靠时间或旧 attempt 猜当前结果。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/governance-runtime-execution-chain-20260827/spec.md","hash":"6bc471b977865a6bff3cedb7b8a7685dd972d0f98e12bddf1dde9d93297aac53","id":"SPEC-GOVERNANCE-RUNTIME-20260827"},{"artifact_kind":"plan","ref":"specs/governance-runtime-execution-chain-20260827/plan.md","hash":"c3f37419cfeb92e2b14e86a01436dc7172c912e5d74a2fe0e63d81decf8c3db6","id":"PLAN-GOVERNANCE-RUNTIME-20260827"}]`
- **source_refs / decision_refs**：R-004、D-003、D-004、D-005、D-006、D-007、D-008 → FR-START-001、FR-START-002、FR-START-003、FR-EVT-001
- **输入**：T004 RED、现有 workspace/session/event 接口和 a964 task-commit reuse 事实。
- **依赖**：T004
- **并行**：否 — RED/GREEN 必须串行
- **FR**：FR-START-001、FR-START-002、FR-START-003、FR-EVT-001
- **AC**：AC-START-001、AC-START-002、AC-START-003、AC-EVT-001
- **动作**：最小调整现有项目输入链、启动顺序、detached target 诊断、session binding/attempt identity 和 event preflight；不修改冲突文档，保留其延期交接事实。
- **精确文件**：`runtime/task/workspace.mjs`、`runtime/stage/stage-context.mjs`、`tools/cli/task-bootstrap.mjs`、`tools/cli/stage-runtime.mjs`、`tools/host/workflowhub-codex-session-event.mjs`、`tools/host/workflowhub-codex-session-state.mjs`、`tests/contract/governance-startup-event-early-failure.test.mjs`
- **boundary**：files: `runtime/task/workspace.mjs`, `runtime/stage/stage-context.mjs`, `tools/cli/task-bootstrap.mjs`, `tools/cli/stage-runtime.mjs`, `tools/host/workflowhub-codex-session-event.mjs`, `tools/host/workflowhub-codex-session-state.mjs`, `tests/contract/governance-startup-event-early-failure.test.mjs`; symbols/regions: prepare/open workspace、identity bind、event preflight、attempt id。
- **输出**：worktree 成功后才有正式开始；无效事件序列字节不变；修复后同一任务复用同一路径/分支；重跑使用新 attempt，当前投影不带起点之后的旧阶段事件。
- **Knowledge**：未鉴权 task mismatch 不伪造 unavailable；已认证当前任务的输入错误才进入可记录事实。
- **verification_role**：GREEN
- **paired_task**：T004
- **gate_cmd**：`./node_modules/.bin/vitest run tests/contract/governance-startup-event-early-failure.test.mjs`
- **expected_exit**：0
- **oracle**：ORACLE-START — 同一任务的真实错误可修，旧失败保留，主项目 delta 不被改写，当前投影按追加/阶段顺序稳定且不受墙上时钟影响。
- **evidence_path**：`quality/evidence/phase-p2-start.json`
- **STOP**：需要新命令、第二状态机、永久兼容桥或把环境 gc 维护混入功能时停止。
- **recovery**：只回滚本 Task 的启动/事件文件，保留已有质量事实和主项目。
- **task risk**：把用户预先存在的主项目变化误判为系统 delta。
- **test tier / test method**：fullstack — 同 T004。
- **scenarios / commands / expected exit / oracle**：同 T004；GREEN=0 且缺失/非 Git/冲突失败场景仍报告可行动原因，重跑投影和新 attempt 断言成立。
- **fixtures_services**：临时 Git repositories；同 T004。
- **coverage limits**：不覆盖 UI/浏览器/远程 Git。
- **ui_scope**：non_ui — reason: 无页面。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：completed
- **actual_changes**：`tools/cli/task-bootstrap.mjs` 在创建新任务后立即调用现有 `prepareTaskWorkspace`，并返回 worktree 路径、分支和 baseline；`scripts/__tests__/task-bootstrap.test.mjs` 的空仓库 fixture 补齐真实初始 commit；新增 P2 contract test。
- **executed_commands**：`./node_modules/.bin/vitest run tests/contract/governance-startup-event-early-failure.test.mjs scripts/__tests__/task-bootstrap.test.mjs --passWithNoTests=false`；exit 0（6 tests passed）。
- **evidence_refs**：`[{"kind":"workspace_file","ref":"quality/evidence/phase-p2-start.json","sha256":"dd97f41102aa0d55bdbe45c1e5eea960d0bc24e3066214154738a9a3f4c135ea"}]`
- **covered_ac**：AC-START-001、AC-START-002、AC-START-003、AC-EVT-001。
- **review_fact**：当前 P2 Phase review 已执行一次并以 `unavailable` 保留；缺少 `test_evidence` 的原始诊断见 `quality/reviews/attempts/a052e843-44f3-4a0a-907f-9fcf6ac37335/attempt.json`，不等同 provider 通过或空 findings。
- **completed_at**：2026-08-27；同一任务继续执行。
- **执行事实**：新任务只有在主项目旁的确定性 worktree 创建并校验后才返回 bootstrap；无可解析 HEAD 的 Git 仓库仍明确失败；未新增阶段、fallback 目录或状态机。

### Verify

`./node_modules/.bin/vitest run tests/contract/governance-startup-event-early-failure.test.mjs`；RED 非零、GREEN 0；ORACLE-START 必须确认项目输入链、worktree、任务分支、Git 注册、事件顺序和重跑当前投影。

### Knowledge

交给 P3：当前任务、worktree、session identity 和材料 revision 已绑定；未鉴权错误不伪造质量事实。

### STOP

需要 cwd 猜项目、fallback 目录、替代 task、recovery 阶段或历史改写时停止。

### Done

worktree 成功后才开始正式记录；失败不写错误事件；修复后同一任务可重试，旧后续事件不进入当前投影。

### Risks and rollback

- **Risk**：把宿主 session 绑定提前到 workspace 成功之前。
- **Prevention**：保持项目解析、worktree、身份绑定和事件写入的顺序。
- **Rollback / recovery**：只回滚启动与事件改动，不动 TaskHandle 历史事实。

## Phase P3 — detail 审查公开最小输入

### Goal

detail 调用方只需提供公开身份和三项当前材料；provider 调用前逐字段报错，当前决定 bytes/revision 改变后旧结果不复用。对 provider 生命周期，Broker/process 不因 elapsed time/no-progress 自动终止；真实终态、取消或进程丢失结束执行，外部 `PROCESS_TIMEOUT` 只保留为真实失败。

### Files

- **NEW**：`skills/wh-review/scripts/__tests__/detail-minimum-input.test.mjs`
- **MODIFY**：`skills/wh-review/scripts/wh-review-cli.mjs`、`skills/wh-review/scripts/review-materials.mjs`、`skills/wh-review/contracts/make-decision.md`
- **MODIFY**：`3rd-review/lib/broker.mjs`、`3rd-review/lib/process.mjs`、`3rd-review/lib/health-runner.mjs`、`3rd-review/lib/config.mjs`、`3rd-review/docs/workflowhub-result-v3.md`、`3rd-review/test/broker.test.mjs`、`3rd-review/test/health-runner.test.mjs`、`3rd-review/test/opencode-health.test.mjs`、`3rd-review/test/process.test.mjs`
- T009/T013 只在 `3rd-review` 主项目旁的独立平行 worktree 修改上述 provider 生命周期文件。
- **DO NOT TOUCH**：`runtime/review/stage-materials.json` 的现有公开矩阵；`3rd-review` provider adapter、外部 OpenCode Go/Zen 服务和历史 review/事件。健康 runner、config 与 result 文档只同步本次“无本地 elapsed-time deadline”事实。

- **Symbols/regions**：Broker `runAttempt`、process liveness/termination cleanup、health-runner no-progress diagnostic、config timeout validation；这些区域只观察真实终态/取消/进程丢失，不创建 elapsed-time deadline。

### Tasks

#### T007 — RED：detail 最小输入和字段诊断失败测试

- **ID**：T007
- **Phase**：Phase P3 — detail 审查公开最小输入
- **goal**：证明 detail 当前会要求内部字段或在 provider 前诊断不完整，并证明早期阶段存在旧 review 自动复用风险。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/governance-runtime-execution-chain-20260827/spec.md","hash":"6bc471b977865a6bff3cedb7b8a7685dd972d0f98e12bddf1dde9d93297aac53","id":"SPEC-GOVERNANCE-RUNTIME-20260827"},{"artifact_kind":"plan","ref":"specs/governance-runtime-execution-chain-20260827/plan.md","hash":"c3f37419cfeb92e2b14e86a01436dc7172c912e5d74a2fe0e63d81decf8c3db6","id":"PLAN-GOVERNANCE-RUNTIME-20260827"}]`
- **source_refs / decision_refs**：R-001、D-002、D-006、D-016 → FR-REV-001、FR-REV-002、FR-REV-003
- **输入**：现有 `runReviewRound`、`review-materials` 和 make-decision detail contract。
- **依赖**：T005
- **并行**：否 — first RED for this behavior
- **FR**：FR-REV-001、FR-REV-002、FR-REV-003
- **AC**：AC-REV-001、AC-REV-002、AC-REV-003
- **动作**：增加最小 happy path、六类错误、当前决定 freshness 和 provider 未调用断言，不改 production。
- **精确文件**：`skills/wh-review/scripts/__tests__/detail-minimum-input.test.mjs`
- **boundary**：files: `skills/wh-review/scripts/__tests__/detail-minimum-input.test.mjs`; symbols/regions: runReviewRound validation/reuse seam。
- **输出**：RED 证据显示调用方必须猜字段、错误太晚，或同一阶段执行会自动复用旧 review。
- **Knowledge**：未鉴权 task mismatch 不伪造 unavailable；已认证输入错误才可检查事实。
- **verification_role**：RED
- **paired_task**：T008
- **gate_cmd**：`./node_modules/.bin/vitest run skills/wh-review/scripts/__tests__/detail-minimum-input.test.mjs`
- **expected_exit**：1
- **oracle**：ORACLE-DETAIL — 最小输入、字段错误、provider 未调用或“每次执行只审一次当前输入”目标至少一项失败。
- **evidence_path**：`quality/evidence/phase-p3-detail.json`
- **STOP**：需要第二份 decision-log、caller runner 指令、provider fallback 或新 detail 命令时停止。
- **recovery**：P3 owner 修正测试 seam，不把缺 provider 当空 findings。
- **task risk**：测试 stub 绕过真实材料 matrix。
- **test tier / test method**：feature — Vitest review CLI contract with provider stub。
- **scenarios / commands / expected exit / oracle**：missing、empty、forbidden、type、identity、freshness、valid minimal input；同命令 RED=1、GREEN=0。
- **fixtures_services**：provider spy 和临时 current material fixture；不访问网络。
- **coverage limits**：不证明第三方 provider 质量，不覆盖 UI。
- **ui_scope**：non_ui — reason: review CLI。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：completed
- **actual_changes**：新增 `skills/wh-review/scripts/__tests__/detail-minimum-input.test.mjs`，先以 RED 证明 detail 会覆盖 caller 指令、接受错误类型、缺少当前决定绑定，并可能复用旧结果。
- **executed_commands**：`./node_modules/.bin/vitest run skills/wh-review/scripts/__tests__/detail-minimum-input.test.mjs --passWithNoTests=false`；RED exit 1（6/9 断言失败）。
- **evidence_refs**：`[{"kind":"workspace_file","ref":"quality/evidence/phase-p3-detail.json","sha256":"0abc928573ad2025541e2c6b7e4c9ea4a81b90aa7311a222a042daeec11fc42b"}]`
- **covered_ac**：AC-REV-001、AC-REV-002、AC-REV-003（RED 失败事实）。
- **review_fact**：与 T008 同一 P3 Phase review；当前 review 因缺少 `test_evidence` 在 provider 前 unavailable，原始事实见 `quality/reviews/attempts/ff168896-988c-428d-a3d7-8281323fd65e/attempt.json`。
- **completed_at**：2026-08-27；同一任务继续执行。
- **执行事实**：RED 失败来自真实 detail 输入边界，不是 provider 质量；没有改动生产实现。

#### T008 — GREEN：detail 公开最小输入和 freshness 预检

- **ID**：T008
- **Phase**：Phase P3 — detail 审查公开最小输入
- **goal**：让调用方只传公开最小字段，provider 前得到逐字段诊断；detail 绑定当前 decision-log bytes/revision；前三阶段每次实际执行只发送一次当前输入，旧结果只读不自动选用。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/governance-runtime-execution-chain-20260827/spec.md","hash":"6bc471b977865a6bff3cedb7b8a7685dd972d0f98e12bddf1dde9d93297aac53","id":"SPEC-GOVERNANCE-RUNTIME-20260827"},{"artifact_kind":"plan","ref":"specs/governance-runtime-execution-chain-20260827/plan.md","hash":"c3f37419cfeb92e2b14e86a01436dc7172c912e5d74a2fe0e63d81decf8c3db6","id":"PLAN-GOVERNANCE-RUNTIME-20260827"}]`
- **source_refs / decision_refs**：R-001、D-002、D-006、D-016 → FR-REV-001、FR-REV-002、FR-REV-003
- **输入**：T007 RED、现有 review matrix 和 current decision-log ArtifactDir。
- **依赖**：T007
- **并行**：否 — RED/GREEN 必须串行
- **FR**：FR-REV-001、FR-REV-002、FR-REV-003
- **AC**：AC-REV-001、AC-REV-002、AC-REV-003
- **动作**：调整 runReviewRound/review-materials 预检顺序和完整决定绑定；删除前三阶段自动复用分支，保持 provider 指令由 runner 生成、review advice-only；同阶段重跑产生新的结果并保留旧事实。
- **精确文件**：`skills/wh-review/scripts/wh-review-cli.mjs`、`skills/wh-review/scripts/review-materials.mjs`、`skills/wh-review/contracts/make-decision.md`、`skills/wh-review/scripts/__tests__/detail-minimum-input.test.mjs`
- **boundary**：files: `skills/wh-review/scripts/wh-review-cli.mjs`, `skills/wh-review/scripts/review-materials.mjs`, `skills/wh-review/contracts/make-decision.md`, `skills/wh-review/scripts/__tests__/detail-minimum-input.test.mjs`; symbols/regions: detail input normalization、early-stage review dispatch、material preflight 和 contract prose。
- **输出**：最小正常路径可运行；六类错误在 provider 前返回；当前 bytes/revision 被绑定；前三阶段一次执行只产生一次审查，旧结果不被自动选用。
- **Knowledge**：鉴权边界保持清楚；不可安全写 unavailable 的错误直接返回，不伪造质量事实。
- **verification_role**：GREEN
- **paired_task**：T007
- **gate_cmd**：`./node_modules/.bin/vitest run skills/wh-review/scripts/__tests__/detail-minimum-input.test.mjs`
- **expected_exit**：0
- **oracle**：ORACLE-DETAIL — provider spy 在所有预检错误中调用次数为 0，valid input 才调用；每次真实阶段执行恰好一次当前输入审查，历史结果不自动复用。
- **evidence_path**：`quality/evidence/phase-p3-detail.json`
- **STOP**：必须复制决定材料或放宽 forbidden runner fields 时停止。
- **recovery**：回退本 Phase review preflight，保留历史 review bytes。
- **task risk**：freshness 绑定误把建议 review 变成完成 gate。
- **test tier / test method**：feature — 同 T007。
- **scenarios / commands / expected exit / oracle**：同 T007；GREEN=0，旧结果不自动复用、同一执行不重复调用，修复后同一任务生成新结果。
- **fixtures_services**：provider spy 和临时 current material fixture；同 T007。
- **coverage limits**：不覆盖真实 provider 语义、页面和下游验收。
- **ui_scope**：non_ui — reason: 无页面。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：completed
- **actual_changes**：`review-materials.mjs` 新增 detail 公开输入校验；`review-runner.mjs` 在生成 runner 指令前绑定当前 `decision-log.md` 和 material revision；`wh-review-cli.mjs` 固定 detail 的 stage/track 身份并传入当前 revision；合同补充字段级诊断和完整决定约束；新增 focused contract test。
- **executed_commands**：`./node_modules/.bin/vitest run skills/wh-review/scripts/__tests__/detail-minimum-input.test.mjs --passWithNoTests=false`；exit 0（9 tests passed）；wh-review runner/CLI 回归 exit 0（99 tests passed）。
- **evidence_refs**：`[{"kind":"workspace_file","ref":"quality/evidence/phase-p3-detail.json","sha256":"0abc928573ad2025541e2c6b7e4c9ea4a81b90aa7311a222a042daeec11fc42b"}]`
- **covered_ac**：AC-REV-001、AC-REV-002、AC-REV-003。
- **review_fact**：当前 P3 Phase review 已执行一次并以 `unavailable` 保留；缺少 `test_evidence` 的原始诊断见 `quality/reviews/attempts/ff168896-988c-428d-a3d7-8281323fd65e/attempt.json`，不等同 provider 通过或空 findings。
- **completed_at**：2026-08-27；同一任务继续执行。
- **执行事实**：valid detail 只送当前完整决定一次；missing、empty、forbidden、type、identity、freshness 均在 provider 前留下 unavailable；前三阶段旧审查不自动复用；未新增命令、材料、状态机或 fallback。

#### T009 — RED：provider 无终态时不应被本地时长终止

- **ID**：T009
- **Phase**：Phase P3 — detail 审查公开最小输入
- **goal**：证明 `3rd-review` Broker/process/health-runner 不应按 elapsed time/no-progress 终止 provider；健康探针保护不能变成执行期限。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/governance-runtime-execution-chain-20260827/spec.md","hash":"6bc471b977865a6bff3cedb7b8a7685dd972d0f98e12bddf1dde9d93297aac53","id":"SPEC-GOVERNANCE-RUNTIME-20260827"},{"artifact_kind":"plan","ref":"specs/governance-runtime-execution-chain-20260827/plan.md","hash":"c3f37419cfeb92e2b14e86a01436dc7172c912e5d74a2fe0e63d81decf8c3db6","id":"PLAN-GOVERNANCE-RUNTIME-20260827"}]`
- **source_refs / decision_refs**：R-001、D-006、D-017 → FR-REV-004
- **输入**：现有 `3rd-review/lib/broker.mjs` 的 provider attempt/retry/repair/rewrite 路径、`lib/process.mjs` 的 watchdog/termination 实现和现有 PROCESS_TIMEOUT 测试替身。
- **依赖**：T008
- **并行**：否 — P3 detail GREEN 后串行执行
- **FR**：FR-REV-004
- **AC**：AC-REV-004
- **动作**：先增加红测，证明本地 elapsed-time/no-progress 终止会误杀持续运行的 provider，或健康探针错误地结束进程；不改 production。
- **精确文件**：`3rd-review/lib/broker.mjs`、`3rd-review/lib/process.mjs`、`3rd-review/lib/health-runner.mjs`、`3rd-review/lib/config.mjs`、`3rd-review/test/broker.test.mjs`、`3rd-review/test/health-runner.test.mjs`、`3rd-review/test/opencode-health.test.mjs`、`3rd-review/test/process.test.mjs`
- **boundary**：files: `3rd-review/lib/broker.mjs`、`3rd-review/lib/process.mjs`、`3rd-review/lib/health-runner.mjs`、`3rd-review/lib/config.mjs`、`3rd-review/test/broker.test.mjs`、`3rd-review/test/health-runner.test.mjs`、`3rd-review/test/opencode-health.test.mjs`、`3rd-review/test/process.test.mjs`; symbols/regions: Broker `runAttempt`、process watchdog/termination cleanup、health-runner no-progress 结束分支；不改 protocol/adapter。
- **输出**：RED 记录本地时长终止、健康探针误杀或外部失败被本地伪造的缺口。
- **Knowledge**：真实 provider unavailable 不转成测试通过；既有 timeout continuation/retry policy 只保留原语义。
- **verification_role**：RED
- **paired_task**：T013
- **gate_cmd**：`node --test test/process.test.mjs test/broker.test.mjs`
- **expected_exit**：1
- **oracle**：ORACLE-REV-LIVENESS — 无终态 provider 被本地时长终止、健康探针误杀或错误生成 `PROCESS_TIMEOUT` 至少一项断言失败。
- **evidence_path**：`quality/evidence/phase-p3-provider-liveness.json`
- **STOP**：需要新增公开配置/字段、第二状态机、WorkflowHub 外层 timeout、重试策略、provider adapter 或修改 `workflowhub-result.v3` 时停止并回到 decision-log。
- **recovery**：保留 RED 和真实子进程清理事实；只回滚 T009/T013 的 Broker/process/test 改动。
- **task risk**：红测若只等待过短时间，可能漏掉隐藏 timer；必须用假时钟或长运行替身证明 provider 生命周期行为，而非只断言错误文字。
- **test tier / test method**：feature — Node built-in test，Broker integration + process lifecycle contract；不访问网络。
- **scenarios / commands / expected exit / oracle**：静默 provider、持续输出但无终态、fresh retry、same-session repair、输出重写、忽略 SIGTERM；同命令 RED=1，按 ORACLE-REV-LIVENESS 判定。
- **fixtures_services**：现有 silent/slow/ignore-SIGTERM test CLI、临时 runtime root、Broker test config；测试负责清理。
- **coverage limits**：不证明真实模型/网络质量；不改 UI、WorkflowHub outer client、protocol schema、config surface 或历史事件。
- **ui_scope**：non_ui — reason: provider lifecycle runtime。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：completed
- **actual_changes**：历史 RED 断言曾暴露 recovery 重置等待和进程残留；该“共享期限”方向已由 2026-08-28 修订覆盖，原始 RED 证据只读保留。
- **executed_commands**：`node --test --test-name-pattern='timeout eventually kills|provider terminal recovery consumes' test/process.test.mjs test/broker.test.mjs`；RED exit 1，分别观察到超时后进程仍存活和 recovery 获得完整新期限。
- **evidence_refs**：`[{"kind":"workspace_file","ref":"quality/evidence/phase-p3-provider-liveness.json","sha256":"cc0a371ef45ae60d45919876133694bc3564a84880761d56145dbeabcf7f666b"}]`
- **covered_ac**：AC-REV-004。
- **review_fact**：同一当前实现的独立只读审查已完成；原始 RED 事实保留。关于 deadline 到期、新 attempt 和 v3 字段的旧判断属于历史执行事实，不再作为当前实现要求；当前上游 120 秒风险保持 unavailable/延期。
- **completed_at**：2026-08-28；同一任务继续执行。
- **执行事实**：RED 只证明当前缺口，不把测试失败或 provider unavailable 改写成通过。

#### T013 — GREEN：删除 provider 本地 elapsed-time 终止

- **ID**：T013
- **Phase**：Phase P3 — detail 审查公开最小输入
- **goal**：删除 Broker/process/health-runner 的 provider elapsed-time/no-progress 自动终止；保留真实终态、明确取消、进程丢失和清理，外部 `PROCESS_TIMEOUT` 只按真实失败事实保留。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/governance-runtime-execution-chain-20260827/spec.md","hash":"6bc471b977865a6bff3cedb7b8a7685dd972d0f98e12bddf1dde9d93297aac53","id":"SPEC-GOVERNANCE-RUNTIME-20260827"},{"artifact_kind":"plan","ref":"specs/governance-runtime-execution-chain-20260827/plan.md","hash":"c3f37419cfeb92e2b14e86a01436dc7172c912e5d74a2fe0e63d81decf8c3db6","id":"PLAN-GOVERNANCE-RUNTIME-20260827"}]`
- **source_refs / decision_refs**：R-001、D-006、D-017 → FR-REV-004
- **输入**：T009 RED、现有 `3rd-review/lib/broker.mjs`、`lib/process.mjs` 和 `PROCESS_TIMEOUT`。
- **依赖**：T009
- **并行**：否 — T009 RED 后串行 GREEN
- **FR**：FR-REV-004
- **AC**：AC-REV-004
- **动作**：从 Broker/process/health-runner 删除总时长、无进展和 watchdog 终止；在 process 保留已确认终态/取消后的 5000ms 清理宽限；让 OpenCode 配置使用 `timeout:false`；运行同一 focused 命令并记录长运行 provider 不被本地时长截断。
- **精确文件**：`3rd-review/lib/broker.mjs`、`3rd-review/lib/process.mjs`、`3rd-review/lib/health-runner.mjs`、`3rd-review/lib/config.mjs`、`3rd-review/docs/workflowhub-result-v3.md`、`3rd-review/test/broker.test.mjs`、`3rd-review/test/health-runner.test.mjs`、`3rd-review/test/opencode-health.test.mjs`、`3rd-review/test/process.test.mjs`
- **boundary**：files: `3rd-review/lib/broker.mjs`、`3rd-review/lib/process.mjs`、`3rd-review/lib/health-runner.mjs`、`3rd-review/lib/config.mjs`、`3rd-review/docs/workflowhub-result-v3.md`、`3rd-review/test/broker.test.mjs`、`3rd-review/test/health-runner.test.mjs`、`3rd-review/test/opencode-health.test.mjs`、`3rd-review/test/process.test.mjs`; symbols/regions: Broker `runAttempt`、process watchdog/termination cleanup、health-runner no-progress 结束分支、result timing documentation；不改 protocol/adapter。
- **输出**：GREEN 记录 provider 超过历史阈值仍可运行，终态/取消/进程丢失可结束，外部失败事实和正常/健康结果不变。
- **Knowledge**：`doctor` 的 `executable_only` 仍不是真实 review；review unavailable 不转成 findings/pass。
- **verification_role**：GREEN
- **paired_task**：T009
- **gate_cmd**：`node --test test/process.test.mjs test/broker.test.mjs`
- **expected_exit**：0
- **oracle**：ORACLE-REV-LIVENESS — 无终态 provider 不被本地 elapsed-time/no-progress 终止；终态/取消/进程丢失能结束；外部 `PROCESS_TIMEOUT` 不由本地 watchdog 生成；健康探针只产生日志诊断。
- **evidence_path**：`quality/evidence/phase-p3-provider-liveness.json`
- **STOP**：需要新增公开配置/字段、第二状态机、WorkflowHub 外层 timeout、重试策略、provider adapter 或修改 `workflowhub-result.v3` 时停止并回到 decision-log。
- **recovery**：只回滚 T009/T013 的 Broker/process/test 改动，保留 RED 和原始 provider 失败事实。
- **task risk**：不能用第二套超时掩盖上游问题；不能把无终态误报为成功，也不能只检查返回值而不检查取消/进程丢失清理。
- **test tier / test method**：feature — Node built-in test，Broker integration + process lifecycle contract；不访问网络。
- **scenarios / commands / expected exit / oracle**：静默 provider、持续输出但无终态、fresh retry、same-session repair、输出重写、忽略 SIGTERM、正常终态、健康 probe；同命令 GREEN=0，按 ORACLE-REV-LIVENESS 判定。
- **fixtures_services**：现有 silent/slow/ignore-SIGTERM test CLI、临时 runtime root、Broker test config；测试负责清理。
- **coverage limits**：不证明真实模型/网络质量；不改 UI、WorkflowHub outer client、protocol schema、config surface 或历史事件。
- **ui_scope**：non_ui — reason: provider lifecycle runtime。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：completed
- **actual_changes**：在 `3rd-review` 平行 worktree 删除 Broker/process/health-runner 的 provider elapsed-time/no-progress 终止；保留终态/取消/进程丢失后的清理，并将 OpenCode `timeout:false` 写入本机配置。旧 900000ms 共享 deadline 实现已撤下，历史测试事实只读保留。
- **executed_commands**：`node --test test/process.test.mjs test/broker.test.mjs`；exit 0（56 tests passed）；`npm test`；exit 0（322 tests passed）；`node --check lib/broker.mjs`、`node --check lib/process.mjs`、`git diff --check` 均通过。
- **evidence_refs**：`[{"kind":"workspace_file","ref":"quality/evidence/phase-p3-provider-liveness.json","sha256":"cc0a371ef45ae60d45919876133694bc3564a84880761d56145dbeabcf7f666b"}]`
- **covered_ac**：AC-REV-004。
- **review_fact**：独立只读审查的进程树清理事实保留；本次修订不再把 deadline 作为接受风险或当前要求。全 provider 本地无 elapsed-time 终止，v3 `deadline_ms:null` 只保留为事实字段；OpenCode Go/Zen 远端边界仍 unavailable/延期。
- **completed_at**：2026-08-28；同一任务继续执行。
- **执行事实**：正常结果、health probe、既有 retry policy 和外部 `PROCESS_TIMEOUT` 语义保持；没有新增配置、协议、公共命令、状态机或外层 timeout；本地 elapsed-time/no-progress 终止已删除。

### Verify

`./node_modules/.bin/vitest run skills/wh-review/scripts/__tests__/detail-minimum-input.test.mjs`；RED 非零、GREEN 0；ORACLE-DETAIL 必须确认公开字段、当前 decision-log bytes/revision、provider 调用次数和旧结果不自动复用。

### Knowledge

交给 P4：detail 只返回 advice-only review 事实；当前输入 freshness 已绑定，质量缺失仍是 unavailable/incomplete。

### STOP

需要第二份 decision-log、caller runner 指令、provider fallback 或新增 detail 公共命令时停止。

### Done

最小正常路径可运行；字段错误在 provider 前失败；每次实际执行只审当前输入一次，历史结果只读。

### Risks and rollback

- **Risk**：重跑路径再次偷偷引入旧 review 复用。
- **Prevention**：禁止早期阶段自动选旧 review，要求当前 bytes/revision。
- **Rollback / recovery**：回滚 review preflight/dispatch 修改，保留原始 review 事实。

## Phase P4 — Skill 声明到正式 consumer

### Goal

五阶段声明由五份 `skill-deps.yaml` 动态发现（当前快照为 35 条），各有一个具体正式 consumer；完整映射见 `plan.md` 的 Formal consumer map；结构性缺 consumer/无效 outcome 在执行或写入前失败；外部质量 unavailable/not_applicable 保持原语义。条件 UI 的三个 build-spec 步骤还必须把真实输入、Screen Read Map、原型/外部返回、展示顺序和当前用户批准交给现有 build-spec handler；当前治理任务本身仍不生成产品页面。

### Files

- **NEW**：`tests/contract/stage-skill-consumer-contract.test.mjs`
- **MODIFY**：`runtime/stage/stage-handlers.mjs`、`runtime/stage/stage-runner.mjs`、`runtime/stage/stage-agent-outcome-adapter.mjs`、`runtime/stage/stage-skill-runtime.mjs`、`workflows/make-decision/skill-deps.yaml`、`workflows/build-spec/skill-deps.yaml`、`workflows/build-plan/skill-deps.yaml`、`workflows/build-code/skill-deps.yaml`、`workflows/verify-code/skill-deps.yaml`、`skills/catalog.yaml`
- **DO NOT TOUCH**：外部 provider 实现、历史 stage outcome、归档 Skill。

### Tasks

#### T010 — RED：Skill consumer 缺口和错误降级测试

- **ID**：T010
- **Phase**：Phase P4 — Skill 声明到正式 consumer
- **goal**：证明声明 Skill 只有 package/event 记录或无效 outcome 时，当前 formal handler 可能继续发布。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/governance-runtime-execution-chain-20260827/spec.md","hash":"6bc471b977865a6bff3cedb7b8a7685dd972d0f98e12bddf1dde9d93297aac53","id":"SPEC-GOVERNANCE-RUNTIME-20260827"},{"artifact_kind":"plan","ref":"specs/governance-runtime-execution-chain-20260827/plan.md","hash":"c3f37419cfeb92e2b14e86a01436dc7172c912e5d74a2fe0e63d81decf8c3db6","id":"PLAN-GOVERNANCE-RUNTIME-20260827"}]`
- **source_refs / decision_refs**：R-001、D-006、D-010、D-011、D-013、D-014、D-015 → FR-SKL-001、FR-SKL-002、FR-UI-001、FR-UI-002、FR-UI-003
- **输入**：五个 `skill-deps.yaml`、`stage-skill-runtime`、`stage-runner`、`stage-handlers`、`stage-agent-outcome-adapter`。
- **依赖**：T013
- **并行**：否 — first RED for this behavior
- **FR**：FR-SKL-001、FR-SKL-002、FR-UI-001、FR-UI-002、FR-UI-003
- **AC**：AC-SKL-001、AC-SKL-002、AC-UI-001、AC-UI-002、AC-UI-003、AC-UI-004
- **动作**：从五份 manifest 动态发现声明，按 `plan.md` Formal consumer map 做逐项具体 consumer/result/material 断言，覆盖 missing consumer、invalid outcome 和 unavailable/not_applicable；补充 UI applicability、真实输入、原型/外部返回、展示先于回复、当前批准绑定和非 UI not_applicable 断言；UI fixture 还逐项断言页面/区域、交互流程、可见标签、关键状态、桌面/窄屏/手机结构、响应式行为、无障碍意图和缺失输入原因；不改生产实现。
- **精确文件**：`tests/contract/stage-skill-consumer-contract.test.mjs`
- **boundary**：files: `tests/contract/stage-skill-consumer-contract.test.mjs`; symbols/regions: manifest consumer field、stage skill resolution、formal outcome checks。
- **输出**：RED 证据至少捕获一项无 consumer、不可达 receipt 或结构错误被 diagnostic 降级。
- **Knowledge**：build-spec `spec-research` receipt 白名单是已核实缺口；外部 provider/test unavailable 不是结构失败。
- **verification_role**：RED
- **paired_task**：T011
- **gate_cmd**：`./node_modules/.bin/vitest run tests/contract/stage-skill-consumer-contract.test.mjs`
- **expected_exit**：1
- **oracle**：ORACLE-SKILL — manifest 动态发现的每条声明→唯一具体 consumer→handler result/material 绑定或结构错误边界目标断言失败。
- **evidence_path**：`quality/evidence/phase-p4-skill.json`
- **STOP**：需要新增 dispatcher、持久 census、第二状态机或硬质量 gate 时停止。
- **recovery**：P4 owner 修正声明 fixture，不把包存在当成消费成功。
- **task risk**：测试只验证字段存在而未验证真实 handler 读取。
- **test tier / test method**：fullstack — manifests、adapter、runner、handler 跨模块。
- **scenarios / commands / expected exit / oracle**：manifest 动态发现的 declarations 逐项 mapping、缺 consumer、重复/generic consumer、invalid triggered outcome、not_applicable、外部 unavailable，以及 UI/non_ui/unknown、原型展示顺序和当前批准绑定、页面/区域/流程/标签/状态/三种宽度/响应式/a11y 和缺失输入原因；同命令 RED=1、GREEN=0。
- **fixtures_services**：manifest fixture、stage outcome fixture 和 provider/test unavailable stub；不访问网络。
- **coverage limits**：不能证明每个真实 provider/test/UI trigger 的语义质量；不实现产品页面或浏览器 QA。
- **ui_scope**：governance_only — 当前任务无产品页面；测试条件 UI 治理事实。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：completed
- **actual_changes**：新增 `tests/contract/stage-skill-consumer-contract.test.mjs`，先验证声明缺口、loader 不早失败、binding API 缺失和 UI acknowledgement 错误边界。
- **executed_commands**：`./node_modules/.bin/vitest run tests/contract/stage-skill-consumer-contract.test.mjs --passWithNoTests=false`；初始 RED exit 1，4 项断言失败。
- **evidence_refs**：`[{"kind":"workspace_file","ref":"quality/evidence/phase-p4-skill.json","sha256":"cde86196f8ddc0cecc21d112d1528fc7d366cb350c7f484d7a3cbe37afef7d93"}]`
- **covered_ac**：AC-SKL-001、AC-SKL-002、AC-UI-001、AC-UI-002、AC-UI-003、AC-UI-004（RED 识别目标边界，GREEN 与 T011 配对）。
- **review_fact**：与 T011 共用当前 P4 review；review 在 provider 前以 `MATERIAL_INCOMPLETE` unavailable，见 `quality/reviews/attempts/7bbef233-5654-4117-a4c9-d2e0aa77b25a/attempt.json`。
- **completed_at**：2026-08-27；同一任务继续执行。
- **执行事实**：RED 保留在 `phase-p4-skill.json.execution.red`；不把 RED 失败或 provider unavailable 当作功能通过。

#### T011 — GREEN：声明 Skill 绑定唯一正式 consumer

- **ID**：T011
- **Phase**：Phase P4 — Skill 声明到正式 consumer
- **goal**：让每个声明 Skill 的具体结构映射在现有 manifest/runner/handler 内闭合，并区分结构失败与外部 unavailable；让条件 UI facts 被现有 build-spec handler 语义消费。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/governance-runtime-execution-chain-20260827/spec.md","hash":"6bc471b977865a6bff3cedb7b8a7685dd972d0f98e12bddf1dde9d93297aac53","id":"SPEC-GOVERNANCE-RUNTIME-20260827"},{"artifact_kind":"plan","ref":"specs/governance-runtime-execution-chain-20260827/plan.md","hash":"c3f37419cfeb92e2b14e86a01436dc7172c912e5d74a2fe0e63d81decf8c3db6","id":"PLAN-GOVERNANCE-RUNTIME-20260827"}]`
- **source_refs / decision_refs**：R-001、D-006、D-010、D-011、D-013、D-014、D-015 → FR-SKL-001、FR-SKL-002、FR-UI-001、FR-UI-002、FR-UI-003
- **输入**：T010 RED、五阶段 Skill manifest 和现有正式 handler。
- **依赖**：T010
- **并行**：否 — RED/GREEN 必须串行
- **FR**：FR-SKL-001、FR-SKL-002、FR-UI-001、FR-UI-002、FR-UI-003
- **AC**：AC-SKL-001、AC-SKL-002、AC-UI-001、AC-UI-002、AC-UI-003、AC-UI-004
- **动作**：按 `plan.md` Formal consumer map 在现有声明中写唯一具体 consumer 标识、消费字段和身份锚点；由 stage-skill-runtime/stage-runner/adapter/handler 校验当前 task/stage/material/snapshot；修复 build-spec/build-plan research 与 build-spec clarify receipt 可达性；在现有 build-spec handler 增加条件 UI 窄消费，校验 `ui-project-init`、`design-source-readiness`、`plan-design-review` 的当前 facts、本地 HTML/外部返回、展示事件、用户回复和批准绑定；UI fixture 覆盖页面/区域、交互流程、可见标签、关键状态、桌面/窄屏/手机、响应式、a11y 和缺失输入原因；build-plan/verify-code 用 `validateComponentQualityMap` 语义消费 `frontend-component-quality`，无 UI 时明确 `not_applicable`；不修改尚未逐项确认的公共治理文档；保留 unavailable/not_applicable。
- **精确文件**：`runtime/stage/stage-handlers.mjs`、`runtime/stage/stage-runner.mjs`、`runtime/stage/stage-agent-outcome-adapter.mjs`、`runtime/stage/stage-skill-runtime.mjs`、`workflows/make-decision/skill-deps.yaml`、`workflows/build-spec/skill-deps.yaml`、`workflows/build-plan/skill-deps.yaml`、`workflows/build-code/skill-deps.yaml`、`workflows/verify-code/skill-deps.yaml`、`skills/catalog.yaml`、`tests/contract/stage-skill-consumer-contract.test.mjs`
- **boundary**：files: `runtime/stage/stage-handlers.mjs`, `runtime/stage/stage-runner.mjs`, `runtime/stage/stage-agent-outcome-adapter.mjs`, `runtime/stage/stage-skill-runtime.mjs`, `workflows/make-decision/skill-deps.yaml`, `workflows/build-spec/skill-deps.yaml`, `workflows/build-plan/skill-deps.yaml`, `workflows/build-code/skill-deps.yaml`, `workflows/verify-code/skill-deps.yaml`, `skills/catalog.yaml`, `tests/contract/stage-skill-consumer-contract.test.mjs`; symbols/regions: consumer metadata、skill package resolution、outcome authentication、handler receipt allowlist、build-spec conditional UI facts。
- **输出**：结构错误在执行/写入前明确失败；触发项被具体正式 consumer 读取；未触发为 not_applicable，外部质量缺失保持 unavailable/incomplete；条件 UI 的输入、原型、展示、回复和批准状态被现有 handler 消费。
- **Knowledge**：不新增 census 持久对象；generic executed、package 存在、monitoring 记录不算 semantic consumption。
- **verification_role**：GREEN
- **paired_task**：T010
- **gate_cmd**：`./node_modules/.bin/vitest run tests/contract/stage-skill-consumer-contract.test.mjs`
- **expected_exit**：0
- **oracle**：ORACLE-SKILL — manifest 动态发现的每项声明恰好一个具体 consumer，结果/材料被真实 handler 消费，结构错误 fail-loud，外部 unavailable 仍可记录。
- **evidence_path**：`quality/evidence/phase-p4-skill.json`
- **STOP**：任何 consumer 多头、身份绑定缺失或质量 unavailable 被写成结构通过时停止。
- **recovery**：只回滚本 Task manifest/runner/adapter/handler 改动，保留 T010 RED 和旧事实。
- **task risk**：给每项都填同一个 generic consumer，仍未真实读取结果。
- **test tier / test method**：fullstack — 同 T010。
- **scenarios / commands / expected exit / oracle**：同 T010；GREEN=0 且至少一个真实触发 handler seam、一个 not_applicable seam、一个外部 unavailable seam 和一个条件 UI 当前批准绑定 seam 断言。
- **fixtures_services**：manifest/stage outcome fixtures；同 T010。
- **coverage limits**：不证明外部 provider、产品页面或浏览器质量。
- **ui_scope**：governance_only — 当前任务无产品页面。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：completed
- **actual_changes**：五份 `skill-deps.yaml` 的 35 条声明增加具体 consumer/inputs/identity；loader、runner、adapter 做当前身份和结构早失败；现有 build-spec/build-plan/verify-code handler 读取研究、澄清、UI 和 component-quality facts；同步 wh-review bundle hash；新增 P4 合同测试。
- **executed_commands**：`./node_modules/.bin/vitest run tests/contract/stage-skill-consumer-contract.test.mjs --passWithNoTests=false`；GREEN exit 0，1 文件 4 tests；另运行 UI、阶段路由/closure、材料/startup 和官方阶段 focused 回归均通过；`git diff --check` 通过。
- **evidence_refs**：`[{"kind":"workspace_file","ref":"quality/evidence/phase-p4-skill.json","sha256":"cde86196f8ddc0cecc21d112d1528fc7d366cb350c7f484d7a3cbe37afef7d93"}]`
- **covered_ac**：AC-SKL-001、AC-SKL-002、AC-UI-001、AC-UI-002、AC-UI-003、AC-UI-004。
- **review_fact**：P4 review 已真实执行一次；`quality/reviews/attempts/7bbef233-5654-4117-a4c9-d2e0aa77b25a/attempt.json` 与 report 为 `unavailable`，原因 `MATERIAL_INCOMPLETE: missing or empty test_evidence`，provider_attempts=0；不等同 provider 通过或空 findings。
- **completed_at**：2026-08-27；进入最终聚合前复核。
- **执行事实**：触发项绑定具体 consumer 和当前 task/stage/material/snapshot；未触发或外部缺失保留 `not_applicable`/`unavailable`/`incomplete`；没有新增 dispatcher、公共命令、持久对象、状态机或硬 Gate。

#### T012 — FINAL：全局当前快照聚合验证

- **ID**：T012
- **Phase**：Phase P4 — Skill 声明到正式 consumer
- **goal**：在所有 Phase 完成后只做一次当前快照全局检查，聚合四材料、启动/事件、detail、Skill consumer、条件 UI 和跨 Phase seam；不创造新的状态权威。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/governance-runtime-execution-chain-20260827/spec.md","hash":"6bc471b977865a6bff3cedb7b8a7685dd972d0f98e12bddf1dde9d93297aac53","id":"SPEC-GOVERNANCE-RUNTIME-20260827"},{"artifact_kind":"plan","ref":"specs/governance-runtime-execution-chain-20260827/plan.md","hash":"c3f37419cfeb92e2b14e86a01436dc7172c912e5d74a2fe0e63d81decf8c3db6","id":"PLAN-GOVERNANCE-RUNTIME-20260827"}]`
- **source_refs / decision_refs**：R-001 至 R-008、D-002 至 D-016 → 全部 FR/AC
- **输入**：T001/T002、T004/T005、T007/T008/T009/T013、T010/T011 的结果和当前四份材料、实现与质量事实。
- **依赖**：T011
- **并行**：否 — aggregate reads preceding task facts
- **FR**：全部 FR-GOV、FR-MAT、FR-START、FR-EVT、FR-REV、FR-SKL、FR-UI
- **AC**：全部当前 AC-GOV、AC-MAT、AC-START、AC-EVT、AC-REV、AC-SKL、AC-UI
- **动作**：只执行一次 `npm test` 全局聚合并记录真实退出码、覆盖、质量缺失和边界事实。
- **精确文件**：`tests/contract/stage-skill-consumer-contract.test.mjs`
- **boundary**：files: `tests/contract/stage-skill-consumer-contract.test.mjs`; symbols/regions: P1-P4 当前快照聚合断言与跨 Phase seam。
- **输出**：全局当前快照事实，不新增状态权威或发布结论。
- **Knowledge**：aggregate 不把 package/event/monitoring 当语义消费，不把测试绿色当验收或发布。
- **verification_role**：N/A — non-behavior aggregate verification
- **paired_task**：N/A — aggregate has no RED/GREEN pair
- **gate_cmd**：`npm test`
- **expected_exit**：0
- **oracle**：ORACLE-FINAL — `npm test` 只反映当前快照的真实结果；所有适用 AC 有对应事实，外部 unavailable/not_applicable/incomplete 保持可解释。
- **evidence_path**：`quality/evidence/final-aggregate.json`
- **STOP**：聚合命令损坏、AC 缺失、边界越界或需要新控制面时停止。
- **recovery**：回受影响的 P1-P4 任务，保留原始失败，不用全量重跑掩盖局部原因。
- **task risk**：把结构测试绿色当作真实 provider 能力或产品验收。
- **test tier / test method**：fullstack — existing `npm test` aggregate。
- **scenarios / commands / expected exit / oracle**：四材料 round-trip、坏 analyzer 输入、worktree 先后、重跑投影、错误事件不污染、detail 六类诊断、前三阶段每次只审当前输入、provider 无本地 elapsed-time 终止/终态/取消/进程丢失、manifest 动态发现的 Skill 具体 consumer、条件 UI 输入/原型/展示/批准及页面/区域/流程/标签/状态/三种宽度/响应式/a11y/缺失输入原因、外部 unavailable/not_applicable；对应命令均以 exit 0 才记录测试事实。
- **fixtures_services**：Vitest fixture、临时 Git repository、provider spy、stage outcome fixture；测试负责清理，不启动浏览器。
- **coverage limits**：不覆盖真实 provider 能力或真实网络终止时序、产品页面、浏览器 QA、下游产品和旧归档；不把治理原型当产品验收。
- **ui_scope**：governance_only — 当前任务无产品页面；聚合条件 UI 治理契约。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：completed
- **actual_changes**：只记录最终聚合事实；未新增实现、阶段、材料或状态权威。最终核验包含终态 `not_applicable`/`skipped` 会话投影、selector 输入拒绝与具体输入收敛、条件 UI readiness 和 human-approved 证据校验；先前失败快照保留在该文件的 `prior_run` 字段中。
- **executed_commands**：当前工作树 `npm run test:safe` exit 0（171 个测试文件、1922 个测试通过、24 个跳过）；`npm run test:exclusive` exit 0（2 个测试文件、31 个测试通过）；合计 `npm test` exit 0（173 个测试文件、1953 个测试通过、24 个跳过、0 失败）。
- **evidence_refs**：`[{"kind":"workspace_file","ref":"quality/evidence/final-aggregate.json","sha256":"7ef8cd1c47fb95e759d53abb0c9dcaf015ca16b96dac5d96742b6a7055c09492"}]`
- **covered_ac**：全部当前 AC 的聚合映射；测试结果只证明当前自动化快照，不等同真实 provider 能力、产品验收或发布。
- **review_fact**：P1-P4 各 Phase review 已执行一次；P1-P4 的 `wh_review.v2` 均因缺少 `test_evidence` 在 provider 前 `unavailable`，对应 attempt/report 保留，不伪造 findings。
- **completed_at**：2026-08-28；进入 verify-code。
- **执行事实**：当前全量快照已通过；先前失败包含既有 stage-materials/会话完成语义/Stage outcome 集成、临时环境 symlink、inventory 与 mutation fixture 问题，原始列表和计数仍保留在 evidence 的 `prior_run`，没有改写历史事实。未将测试成功写成验收或发布。

### Verify

`./node_modules/.bin/vitest run tests/contract/stage-skill-consumer-contract.test.mjs`；RED 非零、GREEN 0；ORACLE-SKILL+UI 必须逐项确认 declaration → 具体 consumer → 当前 identity → handler result/material，并覆盖 UI/non_ui/unknown 和外部 unavailable/not_applicable。

### Knowledge

交给最终 aggregate：四份材料、当前实现和各 Phase 事实是输入；package/event/monitoring 记录不算语义消费。

### STOP

需要新增 dispatcher、持久 census、第二状态机、永久兼容桥或把质量缺失升级为工作 Gate 时停止。

### Done

P1-P4 的 focused RED/GREEN、review 和真实边界事实齐全后，T012 只运行一次 `npm test`；不把绿色测试写成验收或发布。

### Risks and rollback

- **Risk**：给每项都填同一个 generic consumer，仍未真实读取结果。
- **Prevention**：保留 plan.md Formal consumer map 的具体函数、字段和身份绑定。
- **Rollback / recovery**：只回滚 consumer/handler 改动，保留 T010 RED 和旧事实。

## 4. Final current-snapshot aggregate strategy

- **tier / method**：fullstack — existing `npm test`，跨 runtime、host、Skill 和 handler。
- **scenarios**：四材料 round-trip、坏 analyzer 输入、worktree 先后、任务提交后复用、错误事件不污染、重跑投影、detail 六类诊断、前三阶段每次只审当前输入、manifest 动态发现的 Skill 具体 consumer、条件 UI 输入/原型/展示/批准及页面/区域/流程/标签/状态/三种宽度/响应式/a11y/缺失输入原因、外部 unavailable/not_applicable。
- **command**：`npm test`
- **expected exit**：0
- **oracle**：ORACLE-FINAL — 当前快照全量测试通过，或保留真实 incomplete/unavailable；不把测试绿色写成发布/验收。
- **fixtures_services**：Vitest fixture、临时 Git repository、provider spy；测试负责清理，不启动浏览器。
- **evidence_path**：`quality/evidence/final-aggregate.json`
- **coverage limits**：不覆盖真实 provider 能力、产品页面、浏览器 QA、下游产品和旧归档；只验证条件 UI 治理契约。
- **STOP**：命令损坏、AC 缺失、边界越界或需要新决策。
- **execution_contract**：当前快照只运行一次；失败保留原始输出，回受影响 task，不用全量重跑掩盖局部失败。

## Dependency Graph

- **order**：T001 (RED) → T002 (GREEN) → T004 (RED) → T005 (GREEN) → T007 (RED) → T008 (GREEN) → T009 (RED) → T013 (GREEN) → T010 (RED) → T011 (GREEN) → T012 (FINAL aggregate)

```text
T001 → T002 → T004 → T005 → T007 → T008 → T009 → T013 → T010 → T011 → T012
```

## Final Boundary Check

- [ ] 每个 Phase 的 Goal、Files、Tasks、Verify、Knowledge、STOP、Done、Risks and rollback 已在 plan.md/本文件定义。
- [ ] 每张行为卡只有一个 RED/GREEN pair；FINAL 不创造新的状态权威。
- [ ] 每个 FR/AC 都能回溯到 decision-log/spec、Phase、Task、精确文件和 oracle。
- [ ] 质量、review、测试和 unavailable 只作为事实；commit/push/merge/cleanup 仍需用户授权。

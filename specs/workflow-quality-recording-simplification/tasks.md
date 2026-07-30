# 任务清单：WorkflowHub 核心质量流程真实执行与轻量记录

- **Input**：`specs/workflow-quality-recording-simplification/spec.md`、`specs/workflow-quality-recording-simplification/plan.md`
- **Status**：Draft — transparent recovery
- **Template version**：`plan-task.v2`

## 1. 执行摘要

T001–T012 完成六组 RED/GREEN；每个 Phase 的最终 GREEN 做一次聚焦独立 review；
T013 做唯一 integration review；T014 保存全量与聚焦事实；T016/T017 修复 recovery workspace blocker；T015 同任务正式恢复。

## 2. Global Constraints

- 每个行为变化先 RED，再用相同命令和 oracle GREEN。
- 每 Task 只修改精确文件；越界先 STOP 回 plan。
- audit 不作 Gate；历史记录不回填；review finding 修复不二审。
- 每个 Phase 首次聚焦 review 真实执行或如实 unavailable；修复后只追加 resolution，不重跑 provider。
- 只有 T014 可运行 `npm run check`；同一候选 tree 禁止无变化重跑。
- T014 失败后若修改实现，新的 tree 必须重新运行全量并追加结果，不覆盖旧失败。

## Phase 1：真实 invocation

### Goal

真实 hostInvoke 是 executed 的唯一来源。

### Files

- **NEW**：`core/stage-skill-invocation.mjs`、`core/schemas/stage-skill-invocation.v1.json`
- **MODIFY**：`core/stage-skill-runtime.mjs`、`core/task-kernel-implementation.mjs`、`scripts/stage-runtime.mjs`、`workflows/make-decision/skill-deps.yaml`、`workflows/build-spec/skill-deps.yaml`、`workflows/build-plan/skill-deps.yaml`、`workflows/build-code/skill-deps.yaml`、`workflows/verify-code/skill-deps.yaml`、`core/__tests__/stage-skill-runtime.test.mjs`、`scripts/__tests__/stage-runtime-five-stage-e2e.test.mjs`、`tests/stage-interaction-contract.test.mjs`
- **DO NOT TOUCH**：talk/grill Skill 正文、历史 run。

### Tasks

#### T001: RED：声明 Skill 可被手写记录绕过

- **ID**：T001
- **Phase**：Phase 1：真实 invocation
- **goal**：复现未 hostInvoke 仍被标记 executed/complete。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflow-quality-recording-simplification/spec.md","hash":"34a5eae18324875a80a986f4f2e56eb5ae1be74e3705f995f1c86c87079cac6a","id":"FR-INV-001"},{"artifact_kind":"plan","ref":"specs/workflow-quality-recording-simplification/plan.md","hash":"de83174d5668c9bac8c4bffb168adc88facceca5baaf9d0114d6465b8ce23184","id":"DEC-001"}]`
- **输入**：五阶段声明与现有 runtime。
- **依赖**：N/A — first task
- **并行**：否 — RED/GREEN 串行
- **FR**：FR-INV-001、FR-INV-002、FR-INV-003、FR-INV-004、FR-INV-005
- **AC**：AC-01、AC-02、AC-03、AC-16
- **动作**：新增 zero-question、always 漏调、conditional 无 outcome、host unavailable 反例。
- **精确文件**：`core/__tests__/stage-skill-runtime.test.mjs`、`scripts/__tests__/stage-runtime-five-stage-e2e.test.mjs`、`tests/stage-interaction-contract.test.mjs`
- **boundary**：files: `core/__tests__/stage-skill-runtime.test.mjs`, `scripts/__tests__/stage-runtime-five-stage-e2e.test.mjs`, `tests/stage-interaction-contract.test.mjs`; symbols/regions: test fixtures only.
- **输出**：ORACLE-INV RED。
- **Knowledge**：`dispatchStageSkill` 已要求显式 hostInvoke。
- **verification_role**：RED
- **paired_task**：T002
- **gate_cmd**：`./node_modules/.bin/vitest run core/__tests__/stage-skill-runtime.test.mjs scripts/__tests__/stage-runtime-five-stage-e2e.test.mjs tests/stage-interaction-contract.test.mjs --pool=forks --maxWorkers=1 --minWorkers=1`
- **expected_exit**：1
- **oracle**：ORACLE-INV — 手写内容不能证明真实调用。
- **evidence_path**：`apply/evidence/T001-invocation-red.stdout`
- **STOP**：setup/fixture 失败，或需修改正式 record 才能复现。
- **recovery**：只回退本 Task 测试字节。
- **task risk**：假 RED。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`complete`
- **actual_changes**：新增 always 漏调、conditional 无 outcome、host unavailable、直接发布内容绕过等 RED 反例；同步修正既有 `ambiguity-ledger.v2` 断言。
- **executed_commands**：`./node_modules/.bin/vitest run core/__tests__/stage-skill-runtime.test.mjs scripts/__tests__/stage-runtime-five-stage-e2e.test.mjs tests/stage-interaction-contract.test.mjs --pool=forks --maxWorkers=1 --minWorkers=1` → exit 1，24/28 pass，4 个目标失败；`git diff --check` → exit 0。
- **evidence_refs**：RED 原始临时输出已被宿主清理，`formal_record_status=unavailable`；失败名称与计数保留于本任务记录和 Phase review。
- **covered_ac**：AC-01、AC-02、AC-03、AC-16。
- **review_fact**：Phase 1 独立审查原 verdict=`revise_required`；发现 caller 伪造/no-op 解锁、outcome/snapshot 未绑定、throw 未留 unavailable、重复调用不幂等。原结论保留，处置见 T002 聚焦修复。
- **completed_at**：2026-07-30T01:21:33Z

#### T002: GREEN：统一 hostInvoke 与 invocation fact

- **ID**：T002
- **Phase**：Phase 1：真实 invocation
- **goal**：真实 dispatch 产生 runtime-owned fact，caller 不能伪造。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflow-quality-recording-simplification/spec.md","hash":"34a5eae18324875a80a986f4f2e56eb5ae1be74e3705f995f1c86c87079cac6a","id":"FR-INV-001"},{"artifact_kind":"plan","ref":"specs/workflow-quality-recording-simplification/plan.md","hash":"de83174d5668c9bac8c4bffb168adc88facceca5baaf9d0114d6465b8ce23184","id":"DEC-001"}]`
- **输入**：T001 RED。
- **依赖**：T001
- **并行**：否 — 消费 T001
- **FR**：FR-INV-001、FR-INV-002、FR-INV-003、FR-INV-004、FR-INV-005
- **AC**：AC-01、AC-02、AC-03、AC-16
- **动作**：实现窄 invocation writer、真实 dispatch 写入和五阶段 deps 接线。
- **精确文件**：`core/stage-skill-invocation.mjs`、`core/schemas/stage-skill-invocation.v1.json`、`core/stage-skill-runtime.mjs`、`core/task-kernel-implementation.mjs`、`scripts/stage-runtime.mjs`、`workflows/make-decision/skill-deps.yaml`、`workflows/build-spec/skill-deps.yaml`、`workflows/build-plan/skill-deps.yaml`、`workflows/build-code/skill-deps.yaml`、`workflows/verify-code/skill-deps.yaml`
- **boundary**：files: `core/stage-skill-invocation.mjs`, `core/schemas/stage-skill-invocation.v1.json`, `core/stage-skill-runtime.mjs`, `core/task-kernel-implementation.mjs`, `scripts/stage-runtime.mjs`, `workflows/make-decision/skill-deps.yaml`, `workflows/build-spec/skill-deps.yaml`, `workflows/build-plan/skill-deps.yaml`, `workflows/build-code/skill-deps.yaml`, `workflows/verify-code/skill-deps.yaml`; symbols/regions: invocation path only.
- **输出**：ORACLE-INV GREEN。
- **Knowledge**：content evidence 不授予 executed。
- **verification_role**：GREEN
- **paired_task**：T001
- **gate_cmd**：`./node_modules/.bin/vitest run core/__tests__/stage-skill-runtime.test.mjs scripts/__tests__/stage-runtime-five-stage-e2e.test.mjs tests/stage-interaction-contract.test.mjs --pool=forks --maxWorkers=1 --minWorkers=1`
- **expected_exit**：0
- **oracle**：ORACLE-INV — 手写内容不能证明真实调用。
- **evidence_path**：`apply/evidence/T002-invocation-green.stdout`
- **STOP**：需要宿主签名、真人阅读证明或第二状态机。
- **recovery**：回退 writer/runtime 当前字节，保留 RED。
- **task risk**：owner 重复 dispatch。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`complete`
- **actual_changes**：新增 runtime-owned invocation schema/writer；executed 绑定 canonical outcome ref/hash 与 snapshot tree；caller 结构伪造和 no-op 解锁被拒；hostInvoke throw 先记录 truthful unavailable 再传播；同 identity 同语义幂等复用、不同语义明确失败；completion reconcile 要求 invocation 与 evidence/snapshot 一致。
- **executed_commands**：同一聚焦 Vitest 命令 → exit 0，29/29 pass，105.62s；`git diff --check` → exit 0。
- **evidence_refs**：非 canonical 临时测试输出 `/tmp/T002-focused-resolution.stdout`，sha256 `72351efba292d63673994b4182ed9d586d7fe0c1c7b43f4bf0e045bab8dc9704`；正式 Phase receipt 因同任务透明恢复不可用，`formal_record_status=unavailable`。
- **covered_ac**：AC-01、AC-02、AC-03、AC-16。
- **review_fact**：原 Phase 1 verdict=`revise_required` 保留；四项发现均已修复并由新增反例及 29/29 聚焦测试验证；按规则未强制二审、未改写为 pass。
- **completed_at**：2026-07-30T01:21:33Z

### Verify

T001/T002 同一命令；ORACLE-INV RED→GREEN。

### Knowledge

A-001/A-003；reviewer-owned lens 由 wh-review owner 调用。

### STOP

方案需要宿主签名、真人阅读证明或第二状态机。

### Done

五阶段调用可对账，手写 payload 仍为 missing。

### Risks and rollback

风险是重复 dispatch；只回退本 Phase runtime/writer 字节。

## Phase 2：completion reconcile 与 audit 非 Gate

### Goal

统一完成核对，同时保持审计缺口非阻断。

### Files

- **MODIFY**：`core/stage-completion-facts.mjs`、`core/schemas/stage-completion-facts.v1.json`、`schemas/task-accepted.v2.schema.json`、`core/audit-aggregator.mjs`、`core/canonical-receipt-writer.mjs`、`core/stage-handlers.mjs`、`core/stage-runner.mjs`、`core/task-kernel-implementation.mjs`、`scripts/stage-runtime.mjs`、`tests/stage-completion-facts.test.mjs`、`tests/audit-aggregator.test.mjs`、`tests/five-stage-audit-e2e.test.mjs`
- **DO NOT TOUCH**：阶段进入条件、历史结果。

### Tasks

#### T003: RED：假完成与 audit Gate

- **ID**：T003
- **Phase**：Phase 2：completion reconcile 与 audit 非 Gate
- **goal**：复现内容齐全但调用缺失仍假绿，以及 audit missing 被阻断。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflow-quality-recording-simplification/spec.md","hash":"34a5eae18324875a80a986f4f2e56eb5ae1be74e3705f995f1c86c87079cac6a","id":"FR-COMP-001"},{"artifact_kind":"plan","ref":"specs/workflow-quality-recording-simplification/plan.md","hash":"de83174d5668c9bac8c4bffb168adc88facceca5baaf9d0114d6465b8ce23184","id":"DEC-002"}]`
- **输入**：T002 invocation facts。
- **依赖**：T002
- **并行**：否 — RED/GREEN 串行
- **FR**：FR-COMP-001、FR-COMP-002、FR-COMP-003、FR-COMP-004、FR-COMP-005
- **AC**：AC-03、AC-04、AC-13、AC-14、AC-16
- **动作**：覆盖 missing invocation/content present、audit missing/business complete、错绑 publication。
- **精确文件**：`tests/stage-completion-facts.test.mjs`、`tests/audit-aggregator.test.mjs`、`tests/five-stage-audit-e2e.test.mjs`
- **boundary**：files: `tests/stage-completion-facts.test.mjs`, `tests/audit-aggregator.test.mjs`, `tests/five-stage-audit-e2e.test.mjs`; symbols/regions: tests only.
- **输出**：ORACLE-COMP RED。
- **Knowledge**：F3/Q2 三谓词。
- **verification_role**：RED
- **paired_task**：T004
- **gate_cmd**：`./node_modules/.bin/vitest run tests/stage-completion-facts.test.mjs tests/audit-aggregator.test.mjs tests/five-stage-audit-e2e.test.mjs --pool=forks --maxWorkers=1 --minWorkers=1`
- **expected_exit**：1
- **oracle**：ORACLE-COMP — audit missing 可继续，业务缺失不能 complete。
- **evidence_path**：`apply/evidence/T003-completion-red.stdout`
- **STOP**：测试把业务缺失与 audit 缺失混成一个断言。
- **recovery**：回退测试字节。
- **task risk**：错误 oracle。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`complete`
- **actual_changes**：新增三组独立反例：内容齐但 invocation 缺失、业务完成但 audit 缺失、publication/evidence 错绑；没有把业务缺失和审计缺失混成同一断言。
- **executed_commands**：`./node_modules/.bin/vitest run tests/stage-completion-facts.test.mjs tests/audit-aggregator.test.mjs tests/five-stage-audit-e2e.test.mjs --pool=forks --maxWorkers=1 --minWorkers=1` → exit 1，27/30 pass，3 个目标失败；`git diff --check` → exit 0。
- **evidence_refs**：非 canonical `/tmp/T003-completion-red.stdout`，sha256 `ef923b7d6fe42c8240dfcb5ad9789fe45612a32da0f50c36ed81e16418b978b6`；`formal_record_status=unavailable`。
- **covered_ac**：AC-03、AC-04、AC-13、AC-14、AC-16。
- **review_fact**：Phase 2 独立审查原 verdict=`revise_required`；发现缺省输入绕过、生产 handler 未消费认证事实、conditional false 绑定不足、错绑未走 canonical writer、旧 audit pass Gate 仍存在。处置见 T004。
- **completed_at**：2026-07-30T01:42:19Z

#### T004: GREEN：单一 reconciler

- **ID**：T004
- **Phase**：Phase 2：completion reconcile 与 audit 非 Gate
- **goal**：统一核对 invocation/business/audit 并输出真实 completion。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflow-quality-recording-simplification/spec.md","hash":"34a5eae18324875a80a986f4f2e56eb5ae1be74e3705f995f1c86c87079cac6a","id":"FR-COMP-001"},{"artifact_kind":"plan","ref":"specs/workflow-quality-recording-simplification/plan.md","hash":"de83174d5668c9bac8c4bffb168adc88facceca5baaf9d0114d6465b8ce23184","id":"DEC-002"}]`
- **输入**：T003 RED。
- **依赖**：T003
- **并行**：否 — 消费 T003
- **FR**：FR-COMP-001、FR-COMP-002、FR-COMP-003、FR-COMP-004、FR-COMP-005
- **AC**：AC-03、AC-04、AC-13、AC-14、AC-16
- **动作**：扩展 completion facts 与 audit disclosure，保持结构写边界。
- **精确文件**：`core/stage-completion-facts.mjs`、`core/schemas/stage-completion-facts.v1.json`、`schemas/task-accepted.v2.schema.json`、`core/audit-aggregator.mjs`、`core/canonical-receipt-writer.mjs`、`core/stage-handlers.mjs`、`core/stage-runner.mjs`、`core/task-kernel-implementation.mjs`、`scripts/stage-runtime.mjs`
- **boundary**：files: `core/stage-completion-facts.mjs`, `core/schemas/stage-completion-facts.v1.json`, `schemas/task-accepted.v2.schema.json`, `core/audit-aggregator.mjs`, `core/canonical-receipt-writer.mjs`, `core/stage-handlers.mjs`, `core/stage-runner.mjs`, `core/task-kernel-implementation.mjs`, `scripts/stage-runtime.mjs`; symbols/regions: reconcile/publication only.
- **输出**：ORACLE-COMP GREEN。
- **Knowledge**：A-002；audit 与业务结论分离。
- **verification_role**：GREEN
- **paired_task**：T003
- **gate_cmd**：`./node_modules/.bin/vitest run tests/stage-completion-facts.test.mjs tests/audit-aggregator.test.mjs tests/five-stage-audit-e2e.test.mjs --pool=forks --maxWorkers=1 --minWorkers=1`
- **expected_exit**：0
- **oracle**：ORACLE-COMP — audit missing 可继续，业务缺失不能 complete。
- **evidence_path**：`apply/evidence/T004-completion-green.stdout`
- **STOP**：invocation/audit missing 被用作开发进入 Gate。
- **recovery**：回退 reconciler 映射。
- **task risk**：假绿或新 Gate。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`complete`
- **actual_changes**：production handler 经 stage-runner 消费 manifest-derived declarations 与 TaskKernel invocation facts；reconciler 强制 business/invocation/audit 输入；conditional false 要求完整 identity/trigger/reason；canonical writer 在错绑落盘前失败；writer、handler、stage facts、publication binding、attempt invalidation、make-decision full audit 与 accepted schema 的 audit pass Gate 改为 pass/fail 均保留、fail 仅披露。
- **executed_commands**：Phase 2 主 Gate → exit 0，33/33 pass；相关 schema/handler 聚焦测试 → exit 0，43/43 pass；五阶段 production E2E → exit 0，5/5 pass；`git diff --check` → exit 0。额外 `stage-content-evidence.test.mjs` → 43 个旧 fixture 因缺 Phase 1 invocation facts 失败，已登记给 T012，不在本 Task 白名单内。
- **evidence_refs**：非 canonical `/tmp/T004-focused-resolution.stdout`，sha256 `259f7bac7b18ddcf28d298cd4d0a0deaec12497d43431c87111358918174e98c`；`/tmp/T004-handler-focused.stdout`，sha256 `ca7275b5b9f3bb410027d243a17657327fcbf7492e294c9cd3e4e5214ca2670c`；正式 Phase receipt `formal_record_status=unavailable`。
- **covered_ac**：AC-03、AC-04、AC-13、AC-14、AC-16。
- **review_fact**：原 Phase 2 verdict=`revise_required` 保留；全部审查发现已聚焦修复并由 33/33、43/43、5/5 验证；按规则未强制二审、未改写为 pass。旧 fixture 兼容问题保留给计划内 T012。
- **completed_at**：2026-07-30T01:42:19Z

### Verify

T003/T004 同一命令；ORACLE-COMP RED→GREEN。

### Knowledge

A-002 与宪法 F3/Q2。

### STOP

invocation 或 audit 缺失被用作开发进入 Gate。

### Done

三谓词结果可独立观察。

### Risks and rollback

风险是假绿或新 Gate；回退 reconciler 消费映射。

## Phase 3：review 生命周期与处理组 3

### Goal

一次审查、append-only resolution、同 subject 去重、replay 精确。

### Files

- **MODIFY**：`skills/wh-review/scripts/review-controller.mjs`、`skills/wh-review/scripts/review-runner.mjs`、`skills/wh-review/scripts/wh-review-cli.mjs`、`skills/wh-review/scripts/review-materials.mjs`、`skills/wh-review/schemas/resolution.schema.json`、`skills/review-response/SKILL.md`、`skills/review-response/scripts/validate-response.mjs`、`core/stage-handlers.mjs`、`skills/wh-review/scripts/__tests__/review-controller.test.mjs`、`skills/wh-review/scripts/__tests__/review-runner.test.mjs`、`skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs`、`skills/review-response/__tests__/skill-contract.test.mjs`
- **DO NOT TOUCH**：provider 配置、旧 result 字节。

### Tasks

#### T005: RED：重复 review 与 replay 丢失

- **ID**：T005
- **Phase**：Phase 3：review 生命周期与处理组 3
- **goal**：复现重复 provider、强制二审、材料不全仍调用和 replay 误聚合。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflow-quality-recording-simplification/spec.md","hash":"34a5eae18324875a80a986f4f2e56eb5ae1be74e3705f995f1c86c87079cac6a","id":"FR-REV-001"},{"artifact_kind":"plan","ref":"specs/workflow-quality-recording-simplification/plan.md","hash":"de83174d5668c9bac8c4bffb168adc88facceca5baaf9d0114d6465b8ce23184","id":"DEC-003"}]`
- **输入**：现有 review controller/runner。
- **依赖**：T004
- **并行**：否 — RED/GREEN 串行
- **FR**：FR-REV-001、FR-REV-002、FR-REV-003、FR-REV-004、FR-REV-005、FR-REV-006
- **AC**：AC-05、AC-06、AC-07、AC-08、AC-16
- **动作**：新增同 subject 双 initial、stale ref、MATERIAL_INCOMPLETE、profile/anchor mismatch 反例。
- **精确文件**：`skills/wh-review/scripts/__tests__/review-controller.test.mjs`、`skills/wh-review/scripts/__tests__/review-runner.test.mjs`、`skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs`、`skills/review-response/__tests__/skill-contract.test.mjs`
- **boundary**：files: `skills/wh-review/scripts/__tests__/review-controller.test.mjs`, `skills/wh-review/scripts/__tests__/review-runner.test.mjs`, `skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs`, `skills/review-response/__tests__/skill-contract.test.mjs`; symbols/regions: tests only.
- **输出**：ORACLE-REVIEW RED。
- **Knowledge**：处理组 3 问题 9/15。
- **verification_role**：RED
- **paired_task**：T006
- **gate_cmd**：`./node_modules/.bin/vitest run skills/wh-review/scripts/__tests__/review-controller.test.mjs skills/wh-review/scripts/__tests__/review-runner.test.mjs skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs skills/review-response/__tests__/skill-contract.test.mjs --pool=forks --maxWorkers=1 --minWorkers=1`
- **expected_exit**：1
- **oracle**：ORACLE-REVIEW — 同 subject 单 initial，普通修复零 provider，replay 精确。
- **evidence_path**：`apply/evidence/T005-review-red.stdout`
- **STOP**：RED 需要真实 provider 或网络。
- **recovery**：回退测试字节。
- **task risk**：provider spy 未命中真实入口。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`complete`
- **actual_changes**：新增同 subject 重复 initial、resolution 零 provider、stale ref、profile/anchor/finding mismatch 反例；保留 MATERIAL_INCOMPLETE provider 前失败与真实入口 spy。
- **executed_commands**：Phase 3 四文件 Gate → exit 1，102/109 pass，7 个目标失败；真实 runner provider spy=0，未访问网络；`git diff --check` → exit 0。
- **evidence_refs**：非 canonical `/tmp/T005-review-red.stdout`，sha256 `f45998bb9cb1f45d8c102993063b8e528bc6c9cb8d5ca1e64ab09aa8ca566020`；`formal_record_status=unavailable`。
- **covered_ac**：AC-05、AC-06、AC-07、AC-08、AC-16。
- **review_fact**：Phase 3 独立审查原 verdict=`revise_required`；发现 replay 自报互证、subject 锁非并发安全、canonical head/旧 anchor 漂移、build-code resolution 未覆盖。处置见 T006。
- **completed_at**：2026-07-30T02:01:49Z

#### T006: GREEN：canonical head 与 resolution

- **ID**：T006
- **Phase**：Phase 3：review 生命周期与处理组 3
- **goal**：同 subject 单 initial，修复追加 resolution，replay 精确验证。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflow-quality-recording-simplification/spec.md","hash":"34a5eae18324875a80a986f4f2e56eb5ae1be74e3705f995f1c86c87079cac6a","id":"FR-REV-001"},{"artifact_kind":"plan","ref":"specs/workflow-quality-recording-simplification/plan.md","hash":"de83174d5668c9bac8c4bffb168adc88facceca5baaf9d0114d6465b8ce23184","id":"DEC-003"}]`
- **输入**：T005 RED。
- **依赖**：T005
- **并行**：否 — 消费 T005
- **FR**：FR-REV-001、FR-REV-002、FR-REV-003、FR-REV-004、FR-REV-005、FR-REV-006
- **AC**：AC-05、AC-06、AC-07、AC-08、AC-16
- **动作**：controller 自查 head；resolution 零 provider；材料 preflight；finding id 精确 replay。
- **精确文件**：`skills/wh-review/scripts/review-controller.mjs`、`skills/wh-review/scripts/review-runner.mjs`、`skills/wh-review/scripts/wh-review-cli.mjs`、`skills/wh-review/scripts/review-materials.mjs`、`skills/wh-review/schemas/resolution.schema.json`、`skills/review-response/SKILL.md`、`skills/review-response/scripts/validate-response.mjs`、`core/stage-handlers.mjs`
- **boundary**：files: `skills/wh-review/scripts/review-controller.mjs`, `skills/wh-review/scripts/review-runner.mjs`, `skills/wh-review/scripts/wh-review-cli.mjs`, `skills/wh-review/scripts/review-materials.mjs`, `skills/wh-review/schemas/resolution.schema.json`, `skills/review-response/SKILL.md`, `skills/review-response/scripts/validate-response.mjs`, `core/stage-handlers.mjs`; symbols/regions: review lifecycle only.
- **输出**：ORACLE-REVIEW GREEN。
- **Knowledge**：A-004；旧 verdict 永久保留。
- **verification_role**：GREEN
- **paired_task**：T005
- **gate_cmd**：`./node_modules/.bin/vitest run skills/wh-review/scripts/__tests__/review-controller.test.mjs skills/wh-review/scripts/__tests__/review-runner.test.mjs skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs skills/review-response/__tests__/skill-contract.test.mjs --pool=forks --maxWorkers=1 --minWorkers=1`
- **expected_exit**：0
- **oracle**：ORACLE-REVIEW — 同 subject 单 initial，普通修复零 provider，replay 精确。
- **evidence_path**：`apply/evidence/T006-review-green.stdout`
- **STOP**：需要覆盖旧 verdict、自动 full review 或制造新 pass。
- **recovery**：回退 controller 接线，不改历史。
- **task risk**：误复用不同 subject。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`complete`
- **actual_changes**：同 subject 后续材料/快照变化复用 canonical semantic head；subject 级锁保证并发 initial 只 dispatch 一次；resolution 保留 previous_verdict、finding dispositions、focused validation 与 provider_calls=0；replay 从受信 prior attempt/result/aggregation 精确核对 ref/profiles/anchor/finding；canonical head 按 parent/root lineage 选择并使用旧聚合 anchor；build-code 支持统一 append-only resolution。
- **executed_commands**：Phase 3 四文件 Gate → exit 0，111/111 pass；schema/handler 聚焦测试 → exit 0，30/30 pass；`git diff --check` → exit 0。额外 `stage-risk-acceptance` 的业务测试 24 项通过，4 个断言因测试仍固定宪法 1.3.0、当前为 1.5.0 失败，非本 Phase 改动。
- **evidence_refs**：非 canonical `/tmp/T006-focused-resolution.stdout`，sha256 `880e9a7d120dce893b2c1b09781219c05c827e65ff839b6636f12a8e0f03649c`；正式 Phase receipt `formal_record_status=unavailable`。
- **covered_ac**：AC-05、AC-06、AC-07、AC-08、AC-16。
- **review_fact**：原 Phase 3 verdict=`revise_required` 保留；全部审查发现已聚焦修复并由 111/111、30/30 验证；按规则未强制二审、未改写为 pass。
- **completed_at**：2026-07-30T02:01:49Z

### Verify

T005/T006 同一命令；ORACLE-REVIEW RED→GREEN。

### Knowledge

A-004；处理组 3 问题 9/15。

### STOP

需要覆盖旧 verdict、自动 full review 或真实网络。

### Done

重复审查、材料预检和 replay 反例全部 GREEN。

### Risks and rollback

风险是误复用不同 subject；回退 controller 接线，不改历史。

## Phase 4：四材料 current revision

### Goal

四材料和 requirements ledger 同任务可更新且可追溯。

### Files

- **NEW**：`core/schemas/task-material-revision.v1.json`
- **MODIFY**：`core/stage-content-contracts.mjs`、`core/stage-content-evidence.mjs`、`core/schemas/stage-content-evidence.v1.json`、`core/task-kernel-implementation.mjs`、`core/task-handle.mjs`、`core/build-spec-receipt-recovery.mjs`、`core/canonical-receipt-writer.mjs`、`scripts/stage-runtime.mjs`、`workflows/make-decision/SKILL.md`、`workflows/build-spec/SKILL.md`、`workflows/build-plan/SKILL.md`、`workflows/build-code/SKILL.md`、`workflows/verify-code/SKILL.md`、`tests/stage-plan-task-contract-v3.test.mjs`、`scripts/__tests__/stage-runtime-spec-recovery.test.mjs`、`tests/stage-content-continuation.test.mjs`
- **DO NOT TOUCH**：旧 accepted/hash/checkpoint 字节。

### Tasks

#### T007: RED：旧 hash 阻断当前材料

- **ID**：T007
- **Phase**：Phase 4：四材料 current revision
- **goal**：复现四材料更新被旧 accepted/hash/checkpoint 阻断。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflow-quality-recording-simplification/spec.md","hash":"34a5eae18324875a80a986f4f2e56eb5ae1be74e3705f995f1c86c87079cac6a","id":"FR-MAT-001"},{"artifact_kind":"plan","ref":"specs/workflow-quality-recording-simplification/plan.md","hash":"de83174d5668c9bac8c4bffb168adc88facceca5baaf9d0114d6465b8ce23184","id":"DEC-004"}]`
- **输入**：当前材料和 continuation 行为。
- **依赖**：T004
- **并行**：否 — RED/GREEN 串行
- **FR**：FR-MAT-001、FR-MAT-002、FR-MAT-003、FR-MAT-004、FR-MAT-005
- **AC**：AC-09、AC-10、AC-16
- **动作**：分别/同时更新四材料并追加 requirements，验证旧版本只读。
- **精确文件**：`tests/stage-plan-task-contract-v3.test.mjs`、`scripts/__tests__/stage-runtime-spec-recovery.test.mjs`、`tests/stage-content-continuation.test.mjs`
- **boundary**：files: `tests/stage-plan-task-contract-v3.test.mjs`, `scripts/__tests__/stage-runtime-spec-recovery.test.mjs`, `tests/stage-content-continuation.test.mjs`; symbols/regions: tests only.
- **输出**：ORACLE-MAT RED。
- **Knowledge**：四材料是 current materials。
- **verification_role**：RED
- **paired_task**：T008
- **gate_cmd**：`./node_modules/.bin/vitest run tests/stage-plan-task-contract-v3.test.mjs scripts/__tests__/stage-runtime-spec-recovery.test.mjs tests/stage-content-continuation.test.mjs --pool=forks --maxWorkers=1 --minWorkers=1`
- **expected_exit**：1
- **oracle**：ORACLE-MAT — 任意材料更新可继续，旧版本只读可追溯。
- **evidence_path**：`apply/evidence/T007-material-red.stdout`
- **STOP**：测试通过覆盖旧 canonical 字节实现。
- **recovery**：回退测试字节。
- **task risk**：旧行为未被真实触发。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`complete`
- **actual_changes**：新增 decision/spec/plan/tasks 单独更新、四份同时更新、requirements ledger 同 task 二次发布反例；fixture 跟进 invocation runtime，旧 accepted 字节保持只读。
- **executed_commands**：Phase 4 三文件 Gate → exit 1，36/42 pass，6 个目标失败；`git diff --check` → exit 0。
- **evidence_refs**：非 canonical `/tmp/T007-material-red.stdout`，sha256 `dd6e66d745ab001c12653a4bfe6577c277d80553c2229c640d6cda3f232933cd`；`formal_record_status=unavailable`。
- **covered_ac**：AC-09、AC-10、AC-16。
- **review_fact**：Phase 4 独立审查原 verdict=`revise_required`；发现只有 schema 无真实 task-global writer/consumer、多个 current、caller 自报 hash、正式 consumer 固定读旧 ledger。处置见 T008。
- **completed_at**：2026-07-30T02:37:03Z

#### T008: GREEN：轻量 current revision

- **ID**：T008
- **Phase**：Phase 4：四材料 current revision
- **goal**：四材料和 requirements ledger 支持 append-only revision。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflow-quality-recording-simplification/spec.md","hash":"34a5eae18324875a80a986f4f2e56eb5ae1be74e3705f995f1c86c87079cac6a","id":"FR-MAT-001"},{"artifact_kind":"plan","ref":"specs/workflow-quality-recording-simplification/plan.md","hash":"de83174d5668c9bac8c4bffb168adc88facceca5baaf9d0114d6465b8ce23184","id":"DEC-004"}]`
- **输入**：T007 RED、T006 review lifecycle。
- **依赖**：T007、T006
- **并行**：否 — 消费 T007
- **FR**：FR-MAT-001、FR-MAT-002、FR-MAT-003、FR-MAT-004、FR-MAT-005
- **AC**：AC-09、AC-10、AC-16
- **动作**：实现 revision/parent/files/summary/source/hash，不自动 review。
- **精确文件**：`core/schemas/task-material-revision.v1.json`、`core/stage-content-contracts.mjs`、`core/stage-content-evidence.mjs`、`core/schemas/stage-content-evidence.v1.json`、`core/task-kernel-implementation.mjs`、`core/task-handle.mjs`、`core/build-spec-receipt-recovery.mjs`、`core/canonical-receipt-writer.mjs`、`scripts/stage-runtime.mjs`、`workflows/make-decision/SKILL.md`、`workflows/build-spec/SKILL.md`、`workflows/build-plan/SKILL.md`、`workflows/build-code/SKILL.md`、`workflows/verify-code/SKILL.md`
- **boundary**：files: `core/schemas/task-material-revision.v1.json`, `core/stage-content-contracts.mjs`, `core/stage-content-evidence.mjs`, `core/schemas/stage-content-evidence.v1.json`, `core/task-kernel-implementation.mjs`, `core/task-handle.mjs`, `core/build-spec-receipt-recovery.mjs`, `core/canonical-receipt-writer.mjs`, `scripts/stage-runtime.mjs`, `workflows/make-decision/SKILL.md`, `workflows/build-spec/SKILL.md`, `workflows/build-plan/SKILL.md`, `workflows/build-code/SKILL.md`, `workflows/verify-code/SKILL.md`; symbols/regions: material revision only.
- **输出**：ORACLE-MAT GREEN。
- **Knowledge**：typed writer 注入身份。
- **verification_role**：GREEN
- **paired_task**：T007
- **gate_cmd**：`./node_modules/.bin/vitest run tests/stage-plan-task-contract-v3.test.mjs scripts/__tests__/stage-runtime-spec-recovery.test.mjs tests/stage-content-continuation.test.mjs --pool=forks --maxWorkers=1 --minWorkers=1`
- **expected_exit**：0
- **oracle**：ORACLE-MAT — 任意材料更新可继续，旧版本只读可追溯。
- **evidence_path**：`apply/evidence/T008-material-green.stdout`
- **STOP**：引入 reopen/reset/rebind 或第二任务状态机。
- **recovery**：回退 revision writer，保留 current 文件。
- **task risk**：revision lineage 变 Gate。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`complete`
- **actual_changes**：实现 task-global material writer/CLI/consumer；writer 从认证 ArtifactDir 计算 identity、revision、changed files 与 hashes；material/requirements current pointer 使用窄 CAS，旧 revision 只读；requirements 第二/第三版保持严格 parent/supersedes 链；正式 audit 读取并认证 current requirements；五阶段明确 revision 非 reopen/reset/rebind/checkpoint/review Gate。
- **executed_commands**：Phase 4 三文件 Gate → exit 0，43/43 pass；receipt-writer 聚焦测试 → exit 0，8/8 pass；node checks 与 `git diff --check` → exit 0。额外 stage-content-publication 的 2 个旧预期失败归因 Phase 1 invocation 收紧，已登记 T012。
- **evidence_refs**：非 canonical `/tmp/T008-focused-resolution.stdout`，sha256 `4194c9c006b8340cce20870a11467f863e6d0f91bf8475b3997e5b81f9ec27a5`；正式 Phase receipt `formal_record_status=unavailable`。
- **covered_ac**：AC-09、AC-10、AC-16。
- **review_fact**：原 Phase 4 verdict=`revise_required` 保留；全部审查发现已聚焦修复并由 43/43、8/8 验证；按规则未强制二审、未改写为 pass。
- **completed_at**：2026-07-30T02:37:03Z

### Verify

T007/T008 同一命令；ORACLE-MAT RED→GREEN。

### Knowledge

F3/Q2 与现有 typed writer。

### STOP

引入 reopen/reset/rebind 或第二任务状态机。

### Done

current revision 生效，旧 revision 只读可追溯。

### Risks and rollback

风险是 lineage 变 Gate；回退 revision writer，不删除 current 文件。

## Phase 5：浏览器 QA 证据

### Goal

UI 验收有通用、可定位且不泄露凭据的证据。

### Files

- **NEW**：`core/schemas/browser-qa-evidence.v1.json`
- **MODIFY**：`skills/isolated-browser-qa/SKILL.md`、`workflows/verify-code/isolated-browser-qa.md`、`core/stage-content-evidence.mjs`、`core/schemas/stage-content-evidence.v1.json`、`core/task-kernel-implementation.mjs`、`workflows/verify-code/SKILL.md`、`skills/isolated-browser-qa/__tests__/skill-contract.test.mjs`、`tests/stage-content-evidence.test.mjs`、`tests/five-stage-facts-v2.test.mjs`
- **DO NOT TOUCH**：browser profile/cookie/token。

### Tasks

#### T009: RED：空泛页面通过

- **ID**：T009
- **Phase**：Phase 5：浏览器 QA 证据
- **goal**：复现缺页面、auth、性能、截图、命令或 cleanup 仍通过。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflow-quality-recording-simplification/spec.md","hash":"34a5eae18324875a80a986f4f2e56eb5ae1be74e3705f995f1c86c87079cac6a","id":"FR-BQA-001"},{"artifact_kind":"plan","ref":"specs/workflow-quality-recording-simplification/plan.md","hash":"de83174d5668c9bac8c4bffb168adc88facceca5baaf9d0114d6465b8ce23184","id":"DEC-005"}]`
- **输入**：现有 isolated-browser-qa 合同。
- **依赖**：T004
- **并行**：否 — RED/GREEN 串行
- **FR**：FR-BQA-001、FR-BQA-002、FR-BQA-003
- **AC**：AC-11、AC-12、AC-16
- **动作**：逐字段删除反例；非 UI N/A 和性能 not_measured 正例。
- **精确文件**：`skills/isolated-browser-qa/__tests__/skill-contract.test.mjs`、`tests/stage-content-evidence.test.mjs`、`tests/five-stage-facts-v2.test.mjs`
- **boundary**：files: `skills/isolated-browser-qa/__tests__/skill-contract.test.mjs`, `tests/stage-content-evidence.test.mjs`, `tests/five-stage-facts-v2.test.mjs`; symbols/regions: tests only.
- **输出**：ORACLE-BQA RED。
- **Knowledge**：现有 Skill 已管理隔离/auth/cleanup。
- **verification_role**：RED
- **paired_task**：T010
- **gate_cmd**：`./node_modules/.bin/vitest run skills/isolated-browser-qa/__tests__/skill-contract.test.mjs tests/stage-content-evidence.test.mjs tests/five-stage-facts-v2.test.mjs --pool=forks --maxWorkers=1 --minWorkers=1`
- **expected_exit**：1
- **oracle**：ORACLE-BQA — UI 证据完整，非 UI 不形成 Gate。
- **evidence_path**：`apply/evidence/T009-browser-red.stdout`
- **STOP**：测试依赖真实浏览器或登录凭据。
- **recovery**：回退测试字节。
- **task risk**：把工具行为和事实合同混测。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`complete`
- **actual_changes**：新增 UI browser evidence 顶层/嵌套逐字段缺失、非 UI N/A、performance 三态、auth 三态、隐私字段、producer→consumer、状态一致性和错绑字节反例；同步修复旧 interaction fixture，使用正式 dispatch helper 生成 runtime-owned invocation，不放宽断言。
- **executed_commands**：原三文件 exact Gate 在隔离 pre-GREEN tree → exit 1，91/106 pass，15 个失败全部为 ORACLE-BQA 目标；当前 fixture 聚焦 3/3、9/9 pass；`git diff --check` → exit 0。
- **evidence_refs**：非 canonical `/tmp/T009-browser-red-full.stdout`，sha256 `9748bffdfa2b665722c0f046e06306b8f7b0db54d90685df5abeb6e90d87f7f2`；隔离反向 hunks `/tmp/T009-pre-green-reversed-hunks.diff`，sha256 `23adf0a657aecf925d9e495b6e28400d303d64f3109469b7e47635ff73a8dad7`；tree 说明 sha256 `aa35a932da8a92205af33042fcb71a24a3e98f4149ab3a1636fd973af5237976`；`formal_record_status=unavailable`。
- **covered_ac**：AC-11、AC-12、AC-16。
- **review_fact**：Phase 5 独立审查原 verdict=`revise_required`；发现 producer/consumer 未绑定、状态可矛盾、截图/输出未核字节、session 隐私回归、正式 envelope/schema 与 spec 不一致。处置见 T010。
- **completed_at**：2026-07-30T04:17:03Z

#### T010: GREEN：通用 browser evidence

- **ID**：T010
- **Phase**：Phase 5：浏览器 QA 证据
- **goal**：UI AC 产出可定位、无凭据泄露的证据。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflow-quality-recording-simplification/spec.md","hash":"34a5eae18324875a80a986f4f2e56eb5ae1be74e3705f995f1c86c87079cac6a","id":"FR-BQA-001"},{"artifact_kind":"plan","ref":"specs/workflow-quality-recording-simplification/plan.md","hash":"de83174d5668c9bac8c4bffb168adc88facceca5baaf9d0114d6465b8ce23184","id":"DEC-005"}]`
- **输入**：T009 RED。
- **依赖**：T009
- **并行**：否 — 消费 T009
- **FR**：FR-BQA-001、FR-BQA-002、FR-BQA-003
- **AC**：AC-11、AC-12、AC-16
- **动作**：新增 schema/allowlist，Skill 输出 route/scenario/tool/auth/performance/screenshots/test/cleanup/snapshot。
- **精确文件**：`core/schemas/browser-qa-evidence.v1.json`、`skills/isolated-browser-qa/SKILL.md`、`workflows/verify-code/isolated-browser-qa.md`、`core/stage-content-evidence.mjs`、`core/schemas/stage-content-evidence.v1.json`、`core/task-kernel-implementation.mjs`、`workflows/verify-code/SKILL.md`
- **boundary**：files: `core/schemas/browser-qa-evidence.v1.json`, `skills/isolated-browser-qa/SKILL.md`, `workflows/verify-code/isolated-browser-qa.md`, `core/stage-content-evidence.mjs`, `core/schemas/stage-content-evidence.v1.json`, `core/task-kernel-implementation.mjs`, `workflows/verify-code/SKILL.md`; symbols/regions: browser evidence only.
- **输出**：ORACLE-BQA GREEN。
- **Knowledge**：A-005。
- **verification_role**：GREEN
- **paired_task**：T009
- **gate_cmd**：`./node_modules/.bin/vitest run skills/isolated-browser-qa/__tests__/skill-contract.test.mjs tests/stage-content-evidence.test.mjs tests/five-stage-facts-v2.test.mjs --pool=forks --maxWorkers=1 --minWorkers=1`
- **expected_exit**：0
- **oracle**：ORACLE-BQA — UI 证据完整，非 UI 不形成 Gate。
- **evidence_path**：`apply/evidence/T010-browser-green.stdout`
- **STOP**：要求保存 cookie/token 或所有任务必填。
- **recovery**：回退 schema allowlist，不删除证据。
- **task risk**：schema 膨胀。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`complete`
- **actual_changes**：新增正式 browser evidence schema/envelope kind；verify 只消费 canonical ref/hash 并核 task/kind/snapshot；截图和测试输出读取 canonical 字节复核 hash；pass/fail/blocked/unknown 与 exit、cleanup、app service 状态一致；恢复全局 session 隐私过滤并仅对 browser 顶层精确例外；auth/performance 与 spec 三态一致；Skill 输出记录 route/scenario/tool/engine/derived session/login reuse/performance/screenshots/test/cleanup/snapshot，非 UI N/A 不成 Gate。
- **executed_commands**：原三文件 exact Gate → exit 0，120/120 pass，457.87s；`git diff --check` → exit 0。未启动真实浏览器、未读取或保存 profile/cookie/token；本 Phase 验证的是通用证据合同。
- **evidence_refs**：非 canonical `/tmp/T010-browser-focused-resolution.stdout`，sha256 `41125b616f2b5aec56ae39dd7f998585dbe559ce379cec2c62c6fa04a6f8b293`；正式 Phase receipt `formal_record_status=unavailable`。
- **covered_ac**：AC-11、AC-12、AC-16。
- **review_fact**：原 Phase 5 verdict=`revise_required` 保留；全部 finding 已聚焦修复并由 120/120 exact Gate 验证；按规则未强制二审、未改写为 pass。
- **completed_at**：2026-07-30T04:17:03Z

### Verify

T009/T010 同一命令；ORACLE-BQA RED→GREEN。

### Knowledge

A-005 与现有 cleanup/auth 参考。

### STOP

需要真实凭据或把 UI 证据变成全局 Gate。

### Done

九类 UI 证据字段可复核，非 UI N/A。

### Risks and rollback

风险是 schema 过宽；回退 allowlist，不删除测试证据。

## Phase 6：verify-code 深化与五阶段接线

### Goal

verify-code 完整核对业务事实，五阶段声明调用全部 reconcile。

### Files

- **MODIFY**：`workflows/make-decision/SKILL.md`、`workflows/make-decision/skill-deps.yaml`、`workflows/build-spec/SKILL.md`、`workflows/build-spec/skill-deps.yaml`、`workflows/build-plan/SKILL.md`、`workflows/build-plan/skill-deps.yaml`、`workflows/build-code/SKILL.md`、`workflows/build-code/skill-deps.yaml`、`workflows/verify-code/SKILL.md`、`workflows/verify-code/skill-deps.yaml`、`core/stage-completion-facts.mjs`、`core/schemas/stage-completion-facts.v1.json`、`core/stage-handlers.mjs`、`core/task-kernel-implementation.mjs`、`core/canonical-receipt-writer.mjs`、`scripts/stage-runtime.mjs`、`scripts/__tests__/stage-runtime-five-stage-e2e.test.mjs`、`tests/five-stage-facts-v2.test.mjs`、`tests/official-component-receipts.test.mjs`、`tests/stage-completion-facts.test.mjs`
- **DO NOT TOUCH**：确认数量、close 授权、provider route。

### Tasks

#### T011: RED：快速 verify 漏核

- **ID**：T011
- **Phase**：Phase 6：verify-code 深化与五阶段接线
- **goal**：复现缺 diff、测试、AC、tasks、UI 或调用仍假绿。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflow-quality-recording-simplification/spec.md","hash":"34a5eae18324875a80a986f4f2e56eb5ae1be74e3705f995f1c86c87079cac6a","id":"FR-VER-001"},{"artifact_kind":"plan","ref":"specs/workflow-quality-recording-simplification/plan.md","hash":"de83174d5668c9bac8c4bffb168adc88facceca5baaf9d0114d6465b8ce23184","id":"DEC-002"}]`
- **输入**：Phase 1–5 facts。
- **依赖**：T004、T008、T010
- **并行**：否 — RED/GREEN 串行
- **FR**：FR-VER-001、FR-VER-002、FR-VER-003、FR-REC-001、FR-REC-002
- **AC**：AC-13、AC-14、AC-15、AC-16
- **动作**：逐项缺失、review unavailable、audit missing、human handoff、五阶段漏调反例。
- **精确文件**：`scripts/__tests__/stage-runtime-five-stage-e2e.test.mjs`、`tests/five-stage-facts-v2.test.mjs`、`tests/official-component-receipts.test.mjs`、`tests/stage-completion-facts.test.mjs`
- **boundary**：files: `scripts/__tests__/stage-runtime-five-stage-e2e.test.mjs`, `tests/five-stage-facts-v2.test.mjs`, `tests/official-component-receipts.test.mjs`, `tests/stage-completion-facts.test.mjs`; symbols/regions: tests only.
- **输出**：ORACLE-VERIFY RED。
- **Knowledge**：verify 业务事实与 audit disclosure 分离。
- **verification_role**：RED
- **paired_task**：T012
- **gate_cmd**：`./node_modules/.bin/vitest run scripts/__tests__/stage-runtime-five-stage-e2e.test.mjs tests/five-stage-facts-v2.test.mjs tests/official-component-receipts.test.mjs tests/stage-completion-facts.test.mjs --pool=forks --maxWorkers=1 --minWorkers=1`
- **expected_exit**：1
- **oracle**：ORACLE-VERIFY — 核心缺失不 complete，audit gap 只披露。
- **evidence_path**：`apply/evidence/T011-verify-red.stdout`
- **STOP**：把 review verdict 当 pass Gate。
- **recovery**：回退测试字节。
- **task risk**：漏掉某阶段调用类型。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`complete`
- **actual_changes**：新增 verification_items 九类完整性及逐项缺失、canonical verification receipt、review unavailable/audit gap 非 Gate、五阶段漏调和正式 recovery/host bridge 反例；先修正 build-code final review_scope 的既有 integration/null 契约矛盾，再取得干净 RED。
- **executed_commands**：原四文件 exact Gate → exit 1，67/79 pass，12 个失败全部为 ORACLE-VERIFY 目标；build-code final review_scope 单一 E2E → exit 0，1/1 pass；`git diff --check` → exit 0。
- **evidence_refs**：非 canonical `/tmp/T011-verify-red-clean.stdout`，sha256 `3185019140804c7a306199d667fe63101a7df0be4d0571a2847f5128a78df8b0`；`formal_record_status=unavailable`。
- **covered_ac**：AC-13、AC-14、AC-15、AC-16。
- **review_fact**：Phase 6 独立审查原 verdict=`revise_required`；发现 host bridge 仍可 caller 自报、verification receipt 可省略并合成、pass 可空证据、recovery oracle/E2E 不完整、handoff 名称漂移。处置见 T012。
- **completed_at**：2026-07-30T05:06:41Z

#### T012: GREEN：verify 明细与五阶段接线

- **ID**：T012
- **Phase**：Phase 6：verify-code 深化与五阶段接线
- **goal**：五阶段真实对账；verify 每项给状态、证据和原因。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflow-quality-recording-simplification/spec.md","hash":"34a5eae18324875a80a986f4f2e56eb5ae1be74e3705f995f1c86c87079cac6a","id":"FR-VER-001"},{"artifact_kind":"plan","ref":"specs/workflow-quality-recording-simplification/plan.md","hash":"de83174d5668c9bac8c4bffb168adc88facceca5baaf9d0114d6465b8ce23184","id":"DEC-002"}]`
- **输入**：T011 RED、T006/T008/T010 GREEN。
- **依赖**：T011、T006、T008、T010
- **并行**：否 — 消费 T011
- **FR**：FR-VER-001、FR-VER-002、FR-VER-003、FR-REC-001、FR-REC-002
- **AC**：AC-13、AC-14、AC-15、AC-16
- **动作**：五阶段调用接线；verify 输出 pass/fail/unknown/N/A；audit 独立披露；
  在 `stage-runtime` 增加正式交互式 host bridge/recovery 入口，由 runtime 发 invocation request、
  只在真实 host response 后写 runtime-owned fact，并阻止 completion incomplete 的 attempt
  被误称完成；同时提供只读 recovery oracle，验证旧字节、run 继承、invocation、
  completion、未 confirm/accept 和 journal 新增行范围。
- **精确文件**：`workflows/make-decision/SKILL.md`、`workflows/make-decision/skill-deps.yaml`、`workflows/build-spec/SKILL.md`、`workflows/build-spec/skill-deps.yaml`、`workflows/build-plan/SKILL.md`、`workflows/build-plan/skill-deps.yaml`、`workflows/build-code/SKILL.md`、`workflows/build-code/skill-deps.yaml`、`workflows/verify-code/SKILL.md`、`workflows/verify-code/skill-deps.yaml`、`core/stage-completion-facts.mjs`、`core/schemas/stage-completion-facts.v1.json`、`core/stage-handlers.mjs`、`core/task-kernel-implementation.mjs`、`core/canonical-receipt-writer.mjs`、`scripts/stage-runtime.mjs`
- **boundary**：files: `workflows/make-decision/SKILL.md`, `workflows/make-decision/skill-deps.yaml`, `workflows/build-spec/SKILL.md`, `workflows/build-spec/skill-deps.yaml`, `workflows/build-plan/SKILL.md`, `workflows/build-plan/skill-deps.yaml`, `workflows/build-code/SKILL.md`, `workflows/build-code/skill-deps.yaml`, `workflows/verify-code/SKILL.md`, `workflows/verify-code/skill-deps.yaml`, `core/stage-completion-facts.mjs`, `core/schemas/stage-completion-facts.v1.json`, `core/stage-handlers.mjs`, `core/task-kernel-implementation.mjs`, `core/canonical-receipt-writer.mjs`, `scripts/stage-runtime.mjs`; symbols/regions: five-stage reconcile, verification_items, and verification receipt only.
- **输出**：ORACLE-VERIFY GREEN。
- **Knowledge**：Phase 1–5 typed facts。
- **verification_role**：GREEN
- **paired_task**：T011
- **gate_cmd**：`./node_modules/.bin/vitest run scripts/__tests__/stage-runtime-five-stage-e2e.test.mjs tests/five-stage-facts-v2.test.mjs tests/official-component-receipts.test.mjs tests/stage-completion-facts.test.mjs --pool=forks --maxWorkers=1 --minWorkers=1`
- **expected_exit**：0
- **oracle**：ORACLE-VERIFY — 核心缺失不 complete，audit gap 只披露。
- **evidence_path**：`apply/evidence/T012-verify-green.stdout`
- **STOP**：新增确认点、重复 dispatch lens 或 audit 决定业务结论。
- **recovery**：回退消费映射。
- **task risk**：verify 变重 Gate。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`complete`
- **actual_changes**：verification_items 九类使用 canonical status/evidence/reason；verification receipt 变为必需且 pass 必须绑定可读取证据，N/A 必须空证据并说明原因；review unavailable/audit gap 只披露；五阶段声明统一 reconcile。`invoke-stage-skill` 移除 caller outcome `--input`，改为 runtime 先发完整 request、再从 stdin 接收唯一 host response；缺失、重复、预提交、乱序失败。`recover-run`/oracle 核旧 hash/run 链、talk1/2/3+grill outcomes、完整 completion、journal offsets、无 confirmation/accepted；统一 `human_handoff`。
- **executed_commands**：最终原四文件 exact Gate → exit 0，80/80 pass；真实 spawn/recovery fixture → exit 0，1/1 pass；stage-skill focused → exit 0，10/10 pass；事实/receipt/completion focused → exit 0，72/72 pass；`git diff --check` → exit 0。
- **evidence_refs**：非 canonical `/tmp/T012-focused-resolution.stdout`，sha256 `af4c4ecd73f9eca73d7fe318893d1c91b1e29c10d3b2ab2666eb1be4f13e23bc`；正式 Phase receipt `formal_record_status=unavailable`。
- **covered_ac**：AC-13、AC-14、AC-15、AC-16。
- **review_fact**：原 Phase 6 verdict=`revise_required` 保留；全部 finding 已聚焦修复并由 80/80、真实 spawn/recovery 1/1、10/10、72/72 验证；按规则未强制二审、未改写为 pass。
- **completed_at**：2026-07-30T05:06:41Z

### Verify

T011/T012 同一命令；ORACLE-VERIFY RED→GREEN。

### Knowledge

Phase 1–5 facts 与 Q1/Q2。

### STOP

新增确认点、重复 dispatch lens 或 audit 决定业务结论。

### Done

核心缺失不 complete；audit 缺失不伪造业务 fail/pass。

### Risks and rollback

风险是 verify 变重 Gate；回退消费映射。

## Phase 7：一次审查、一次全量、透明恢复

### Goal

先保存全量与聚焦事实，再以 T016/T017 严格 RED/GREEN 修复 recovery workspace
blocker；之后正式恢复 lineage，真实用户确认后推进 build-spec/build-plan/build-code，
并在 fresh tests 后做唯一 integration review。

### Files

- **MODIFY**：`skills/wh-review/scripts/review-controller.mjs`、`scripts/stage-runtime.mjs`（仅作为 Phase 机器白名单）；T014 全量若只暴露既有基线，可机械修复既有 Markdown 白名单；authenticated smoke、lens-only closure/hash 仍限既有白名单。全量诊断确认的 24 个旧 fixture/断言文件可仅迁移到本任务已确认的新合同；`docs/stage-atomic-step-inventory.md` 仅同步当前五份 `steps.json` 的 numeric `step_id` + `step_slug` 双向覆盖。不得恢复旧 Gate、重复 stage lens dispatch 或弱化 runtime。`check-task-record-paths` 的 14 条旧生产路径治理仅披露，不纳入修改范围。
- **EXECUTE-ONLY（T013–T015）**：`skills/wh-review/scripts/wh-review-cli.mjs`、`scripts/stage-runtime.mjs`；三个收口 Task 不得现场修改实现，finding 必须返回 owning GREEN。
- **RECOVERY WORKSPACE RED/GREEN（T016/T017）**：files: `core/workspace.mjs`, `core/stage-context.mjs`, `scripts/stage-runtime.mjs`, `core/task-kernel-implementation.mjs`, `core/__tests__/workspace-manager.test.mjs`, `core/__tests__/task-kernel-publish.test.mjs`, `scripts/__tests__/stage-runtime-recover-run.test.mjs`, `skills/wh-review/scripts/wh-review-cli.mjs`, `skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs`; `skills/wh-review/skill-bundle.json` 与 `skills/catalog.yaml` 仅同步受影响 bundle hash；kernel implementation 仅用于 runtime-owned previous-run CAS，以及同一 current requirements pointer 在新 active make-decision run 内的 runtime-owned Step 2 完成，不创建冗余 ledger/revision；active make-decision recovery run 的方向/详情审查继承 recovery workspace，普通/accepted run 与显式 prepare 不变；不新增 schema、认证 Gate 或 caller path/branch/baseline。
- **DO NOT TOUCH**：旧 run 字节、provider route、Git refs。

### Tasks

#### T014: 唯一最终全量

- **ID**：T014
- **Phase**：Phase 7：一次审查、一次全量、透明恢复
- **goal**：保存所有已执行全仓检查的真实结果，以代码、风险相关聚焦测试和逐 AC 事实判断完成；全量或审计缺失只披露、不作 Gate。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflow-quality-recording-simplification/spec.md","hash":"34a5eae18324875a80a986f4f2e56eb5ae1be74e3705f995f1c86c87079cac6a","id":"AC-16"},{"artifact_kind":"plan","ref":"specs/workflow-quality-recording-simplification/plan.md","hash":"de83174d5668c9bac8c4bffb168adc88facceca5baaf9d0114d6465b8ce23184","id":"T014"}]`
- **输入**：T001–T012 与全部 resolution。
- **依赖**：T006、T008、T010、T012
- **并行**：否 — 唯一全量
- **FR**：FR-VER-001、FR-VER-002、FR-VER-003
- **AC**：AC-13、AC-14、AC-16
- **动作**：保留三次 `npm run check` 失败、旧 tree 一次完整 `npm test` 失败和当前新 tree 被用户叫停的未完成输出；不得补跑或把它们写成通过。汇总 A/B/C、closure/smoke 聚焦 GREEN 和逐 AC 结果作为完成依据。
- **精确文件**：`scripts/stage-runtime.mjs`；既有 Phase 机器白名单；`docs/stage-atomic-step-inventory.md`；以及 `tests/final-cutover-guards.red.test.mjs`、`core/__tests__/task-kernel-publish.test.mjs`、`tests/m14b-fact-collection.test.mjs`、`tests/stage-orchestrator-v2.test.mjs`、`core/__tests__/task-target-repo-migration.test.mjs`、`core/__tests__/task-runner-root-migration.test.mjs`、`tests/stage-content-publication.test.mjs`、`tests/official-make-decision-cli.test.mjs`、`tests/p0-foundation-contracts.test.mjs`、`scripts/__tests__/runner-replacement-bridge.test.mjs`、`skills/wh-review/scripts/__tests__/simple-contracts.test.mjs`、`tests/design-stage-skill-order.red.test.mjs`、`tests/stage-review-cost-policy.test.mjs`、`skills/wh-review/scripts/__tests__/review-source-materials.test.mjs`、`tests/workflow-v2-contract.test.mjs`、`tests/stage-risk-acceptance.test.mjs`、`tests/build-code-capture.test.mjs`、`tests/build-code-preflight.red.test.mjs`、`tests/verify-code-capture.test.mjs`、`scripts/__tests__/ci-chain-check.test.mjs`、`tests/terminal-runtime-blockers.test.mjs`、`tests/spec-content-profile.test.mjs`、`tests/per-invocation-doc-contract.test.mjs`、`tests/template-content-quality-retention.test.mjs`；inventory 仅同步当前 `steps.json` 的 numeric `step_id` + `step_slug` 双向覆盖，后 24 个文件仅迁移旧 fixture/断言到已确认新合同。
- **boundary**：files: `scripts/stage-runtime.mjs`, `.markdownlint-cli2.jsonc`, `specs/workflow-quality-recording-simplification/plan.md`, `specs/workflow-quality-recording-simplification/tasks.md`, `specs/review-flow-reset/plan.md`, `specs/review-flow-reset/tasks.md`, `skills/spec-tasks/templates/tasks-template.md`, `skills/wh-review/contracts/provider-protocol.md`, `constitution-checklist.md`, `CONTEXT.md`, `scripts/smoke-local-skill-dispatch.mjs`, `scripts/__tests__/smoke-local-skill-dispatch.test.mjs`, `scripts/__tests__/canonical-archive-skill-dispatch.test.mjs`, `core/check-skill-closure.mjs`, `core/__tests__/check-skill-closure.test.mjs`, `skills/reuse-registry.md`, `skills/review-response/skill-bundle.json`, `skills/spec-tasks/skill-bundle.json`, `skills/isolated-browser-qa/skill-bundle.json`, `skills/catalog.yaml`, `tests/final-cutover-guards.red.test.mjs`, `core/__tests__/task-kernel-publish.test.mjs`, `tests/m14b-fact-collection.test.mjs`, `tests/stage-orchestrator-v2.test.mjs`, `core/__tests__/task-target-repo-migration.test.mjs`, `core/__tests__/task-runner-root-migration.test.mjs`, `tests/stage-content-publication.test.mjs`, `tests/official-make-decision-cli.test.mjs`, `tests/p0-foundation-contracts.test.mjs`, `scripts/__tests__/runner-replacement-bridge.test.mjs`, `skills/wh-review/scripts/__tests__/simple-contracts.test.mjs`, `tests/design-stage-skill-order.red.test.mjs`, `tests/stage-review-cost-policy.test.mjs`, `skills/wh-review/scripts/__tests__/review-source-materials.test.mjs`, `tests/workflow-v2-contract.test.mjs`, `tests/stage-risk-acceptance.test.mjs`, `tests/build-code-capture.test.mjs`, `tests/build-code-preflight.red.test.mjs`, `tests/verify-code-capture.test.mjs`, `scripts/__tests__/ci-chain-check.test.mjs`, `tests/terminal-runtime-blockers.test.mjs`, `tests/spec-content-profile.test.mjs`, `tests/per-invocation-doc-contract.test.mjs`, `tests/template-content-quality-retention.test.mjs`; symbols/regions: full check, baseline text alignment, authenticated smoke fixture, lens-only closure, mechanical bundle/catalog hashes, and confirmed stale fixture/assertion migration only; excludes all 14 old `check-task-record-paths` production findings, business implementation edits, checker weakening, and repeated stage lens dispatch.
- **boundary addition**：files: `docs/stage-atomic-step-inventory.md`; symbols/regions: only current five `steps.json` numeric `step_id` + `step_slug` bidirectional coverage.
- **输出**：全部真实全量结果和中止事实 append-only 保留；聚焦代码/测试/AC 完成结果与 disclosure 分开记录。
- **Knowledge**：同一 tree 不为刷绿重跑；全量或审计缺失只披露，不能覆盖已证实的代码、聚焦测试和 AC 结论。
- **verification_role**：N/A — non-behavior change: final regression
- **paired_task**：N/A — final regression has no RED/GREEN pair
- **gate_cmd**：`npm run check`
- **expected_exit**：记录真实结果；不得把失败或中止改写为 0。
- **oracle**：ORACLE-FINAL — 代码、风险相关聚焦测试和逐 AC 结果决定完成；全量/审计缺失及 14 条旧 path finding 如实披露，不作 Gate，不伪报全量通过。
- **evidence_path**：`/tmp/T014-final-check.stdout`、`/tmp/T014-final-check-v2.stdout`、`/tmp/T014-final-check-v3.stdout`、`/tmp/T014-full-vitest.stdout`、`/tmp/T014-full-vitest-v2.stdout` 及 A/B/C、closure/smoke 聚焦输出。
- **STOP**：未改实现却重复全量刷绿，或修复后未验证新的最终 tree。
- **recovery**：保留失败结果；只跑相关聚焦命令定位/修复；产生新 tree 后追加一次新全量。
- **task risk**：baseline failure 与本任务失败混淆。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`complete`
- **actual_changes**：修正全量暴露的既有 Markdown/结构文本、authenticated smoke、lens-only closure/hash、step inventory，以及 A/B/C 共 24 个旧 fixture/断言；未修改 `check-task-record-paths` 的 14 条旧生产治理。
- **executed_commands**：`npm run check` 共三次均 exit 1：第一次为 Markdown 基线，第二次为 checklist/CONTEXT 结构基线，第三次只剩 14 条旧 `check-task-record-paths`；旧 tree 一次完整 `npm test`：safe 129 files（101 pass/28 fail）、1613 tests（1466 pass/147 fail），exit 1，exclusive 未运行；当前新 tree 一次 `npm test` 被用户明确叫停，输出不完整、无最终 exit，未重跑。A 组 10 files/203 tests、B 组 6 files/109 tests、C 组分组 106 tests、closure/smoke 3 files/7 tests 均聚焦 GREEN；`git diff --check` → exit 0。
- **evidence_refs**：三次 check：`/tmp/T014-final-check.stdout` sha256 `dee829950de91b3a4cf62d9dde280cf426f002d6feda3e161bbdc13d220eeae9`、`/tmp/T014-final-check-v2.stdout` sha256 `73517b17f87dee4795773e36d8bb0e68cbf609f5c84644a74139e00343913cd6`、`/tmp/T014-final-check-v3.stdout` sha256 `252e147185869db696ead95784994c91154c03c2b34c3a7d0f12e51d253a549c`；旧完整 npm test：`/tmp/T014-full-vitest.stdout` sha256 `9b9ff9963cd4665de76514a50b27d2081d6df4276aec907b8b16188d7d2318cd`；新 tree 中止输出：`/tmp/T014-full-vitest-v2.stdout` sha256 `3d437aa5747f03d494c8ba61b7d7db8e35b7166b9eb9e4633039d38e3e1f1186`，开始 tree `e0cfabce91060099c4abc060c27bc9e41b93833f`，无完成 tree。C 组证据 sha256：runtime `96e21f2f42d5864f50cbd6a4dd4bfbb530afb7e4c6066b5b19634465dc5aac5e`、contracts `61be6f5f7349d7108c24b30e5eea8f066ab55c9bdacbb0a4d8df4daffd31161a`、verify `e4f9d010ee3777041ef1d01b3458fb43bf041e4074f295c4e624cacf00e93c06`、ci `5575da1a8bdfb766a80f2b7afd04ce3bd3ff1e9b88cc2f5a2d3c09ae5ab38a3d`、host `1c5b4b7e31ed1bac78179e54bec0a4694622f52d3afc746dd90cb6a8e93b74fc`；closure/smoke `/tmp/T014-skill-closure-smoke-focused-v2.stdout` sha256 `cf09fca9651c357392162666b5d04656cb4e0addf54d899c782862de46c05b2c`。
- **covered_ac**：AC-13、AC-14、AC-16；依据代码、A/B/C 聚焦测试、closure/smoke 和 T011/T012 已记录的逐 AC 事实完成。
- **review_fact**：三次 check、旧 tree 完整 test 失败和新 tree 用户中止均保留原事实；14 条旧 path finding 为 disclosure-only。没有写“全量通过”，没有把审计/全量缺失变成 Gate。
- **completed_at**：2026-07-30。

#### T016: recovery workspace 行为 RED

- **ID**：T016
- **Phase**：Phase 7：一次审查、一次全量、透明恢复
- **goal**：用可证伪测试固定 recover-run 专用 recovery workspace 合同，同时证明普通 prepare 仍严格。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflow-quality-recording-simplification/spec.md","hash":"34a5eae18324875a80a986f4f2e56eb5ae1be74e3705f995f1c86c87079cac6a","id":"FR-REC-001"},{"artifact_kind":"plan","ref":"specs/workflow-quality-recording-simplification/plan.md","hash":"de83174d5668c9bac8c4bffb168adc88facceca5baaf9d0114d6465b8ce23184","id":"T016"}]`
- **输入**：T014 保存的真实 blocker 与旧 run recovery source。
- **依赖**：T014
- **并行**：否 — T017 的严格 RED
- **FR**：FR-INV-001、FR-INV-002、FR-INV-003、FR-INV-004、FR-INV-005、FR-REC-001、FR-REC-002
- **AC**：AC-01、AC-02、AC-03、AC-15、AC-16
- **动作**：新增/扩展行为测试：普通 prepare 继续拒绝 ahead/diverged；recover-run 专用路径只接受 exact deterministic registered worktree/branch 的 ahead/diverged，并以当前 clean recovery HEAD 为新 run baseline。反例覆盖 caller path/branch/baseline、错 path/branch/git-common-dir、symlink、dirty 或非完整当前 HEAD；断言旧 run previous ref/hash 仍由 kernel 保留。
- **精确文件**：`core/__tests__/workspace-manager.test.mjs`、`scripts/__tests__/stage-runtime-recover-run.test.mjs`（不存在则新增）。
- **boundary**：files: `core/__tests__/workspace-manager.test.mjs`, `scripts/__tests__/stage-runtime-recover-run.test.mjs`; symbols/regions: behavior fixtures/assertions only.
- **输出**：在实现未支持专用 recovery workspace 时真实失败的 RED。
- **Knowledge**：专用恢复能力不是普通 prepare 的宽松 fallback，也不是新认证 Gate。
- **verification_role**：RED
- **paired_task**：T017
- **gate_cmd**：`npx vitest run --maxWorkers=1 core/__tests__/workspace-manager.test.mjs scripts/__tests__/stage-runtime-recover-run.test.mjs`
- **expected_exit**：1
- **oracle**：ORACLE-RECOVERY-WORKSPACE — 新正例因缺专用 authenticated recovery workspace 失败；普通 prepare 与全部身份/dirty/symlink 反例继续按原边界失败。
- **evidence_path**：`apply/evidence/T016-recovery-workspace-red.stdout`
- **STOP**：测试通过旧宽松入口、接受 caller 身份字段，或必须修改旧 run/历史才能造 RED。
- **recovery**：只回退 T016 测试字节。
- **task risk**：误把恢复例外扩散成普通 prepare 放宽。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`complete`
- **actual_changes**：新增普通 prepare 不放宽、专用 recover-run 当前 HEAD baseline、caller identity 与无旧 run 拒绝的行为 RED。
- **executed_commands**：`npx vitest run --maxWorkers=1 core/__tests__/workspace-manager.test.mjs scripts/__tests__/stage-runtime-recover-run.test.mjs` → exit 1，20/23 pass，3 个目标失败。
- **evidence_refs**：`/tmp/T016-recovery-red.stdout`，sha256 `850f64bf9acc3fb0cbf773769745c0987eced7924215a36ee1b31bd50773de72`。
- **covered_ac**：AC-01、AC-02、AC-03、AC-15、AC-16。
- **review_fact**：独立审查原 verdict=`revise_required`；四项 finding 保留，等待 T017 聚焦 resolution，不覆盖原结论、不写已修。
- **completed_at**：2026-07-30。

#### T017: authenticated recovery workspace GREEN

- **ID**：T017
- **Phase**：Phase 7：一次审查、一次全量、透明恢复
- **goal**：实现 recover-run 专用、kernel 派生且 fail-closed 的 recovery workspace，解除正式恢复 blocker。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflow-quality-recording-simplification/spec.md","hash":"34a5eae18324875a80a986f4f2e56eb5ae1be74e3705f995f1c86c87079cac6a","id":"FR-REC-001"},{"artifact_kind":"plan","ref":"specs/workflow-quality-recording-simplification/plan.md","hash":"de83174d5668c9bac8c4bffb168adc88facceca5baaf9d0114d6465b8ce23184","id":"T017"}]`
- **输入**：T016 RED 与现有 TaskHandle/Workspace/kernel 身份。
- **依赖**：T016
- **并行**：否 — 同命令最小 GREEN
- **FR**：FR-INV-001、FR-INV-002、FR-INV-003、FR-INV-004、FR-INV-005、FR-REC-001、FR-REC-002
- **AC**：AC-01、AC-02、AC-03、AC-15、AC-16
- **动作**：保持普通 prepare 严格；为 recover-run 增加窄的 authenticated recovery workspace：从 task/kernel 派生 deterministic registered worktree/branch，允许当前 clean HEAD 相对旧 baseline 为 ahead/diverged，并把该完整 HEAD 作为新 run baseline。精确核验 path、branch、git-common-dir、无 symlink、clean 与当前 full HEAD；不接受 caller path/branch/baseline；旧 run previous ref/hash 只由 kernel append-only 继承。聚焦解决 finding：验证 branch reflog origin ancestor 并拒绝 orphan；capability 每次写前持续复核 clean，dirty 不得写；recover-run 仅 make-decision 且 invalid args/stage 在任何写前拒绝；以 runtime-owned expected previous ref/hash CAS 保证同一旧 run 只能产生一个新 run，第二次/并发拒绝；`publishRequirementsLedger` 命中同一 current pointer 的 idempotent 路径时，先验证 ledger 与 coverage ref/hash 的实际内容绑定，再为当前 active new make-decision run 完成 runtime-owned Step 2，使 Step 3 可继续，但不创建冗余 ledger/revision。active make-decision recovery run 的方向/详情审查必须继承 recovery workspace；普通 run、accepted run 与显式 prepare 保持原语义。不得新增 schema、认证 Gate、旧历史改写或 fallback。
- **精确文件**：`core/workspace.mjs`、`core/stage-context.mjs`、`scripts/stage-runtime.mjs`、`core/task-kernel-implementation.mjs`、`core/__tests__/workspace-manager.test.mjs`、`core/__tests__/task-kernel-publish.test.mjs`、`scripts/__tests__/stage-runtime-recover-run.test.mjs`、`skills/wh-review/scripts/wh-review-cli.mjs`、`skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs`；`skills/wh-review/skill-bundle.json`、`skills/catalog.yaml` 仅同步受影响 bundle hash。
- **boundary**：files: `core/workspace.mjs`, `core/stage-context.mjs`, `scripts/stage-runtime.mjs`, `core/task-kernel-implementation.mjs`, `core/__tests__/workspace-manager.test.mjs`, `core/__tests__/task-kernel-publish.test.mjs`, `scripts/__tests__/stage-runtime-recover-run.test.mjs`, `skills/wh-review/scripts/wh-review-cli.mjs`, `skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs`, `skills/wh-review/skill-bundle.json`, `skills/catalog.yaml`; symbols/regions: recover-run workspace authentication, runtime-owned previous-run CAS, active recovery run direction/detail review workspace inheritance, idempotent requirements pointer Step 2 completion without redundant content, and affected bundle hash synchronization only.
- **输出**：专用 recovery workspace 能从当前 clean recovery HEAD 建立新 run，普通 prepare 和反例不回归。
- **Knowledge**：当前 clean recovery HEAD 是新 run baseline；旧 baseline 只作为 previous lineage，不决定新 run 可否开始。
- **verification_role**：GREEN
- **paired_task**：T016
- **gate_cmd**：`npx vitest run --maxWorkers=1 core/__tests__/workspace-manager.test.mjs scripts/__tests__/stage-runtime-recover-run.test.mjs`
- **expected_exit**：0
- **oracle**：ORACLE-RECOVERY-WORKSPACE — exact registered identity + clean full HEAD + branch reflog origin ancestor 才成功；orphan、caller identity、symlink/dirty/mismatch、非 make-decision、invalid args/stage 均在写前失败；capability 持续复核 clean；旧 run previous ref/hash 不变，新 run baseline 等于当前 HEAD，且 expected previous ref/hash CAS 只允许一个新 run；active make-decision recovery run 的方向/详情审查使用同一 recovery workspace，普通/accepted run 不变；requirements idempotent 命中仅在 current ledger/coverage ref/hash 都实际绑定内容时复用并完成当前 run Step 2，coverage 缺失/错绑须在 Step 2 journal 写入前失败。
- **evidence_path**：`apply/evidence/T017-recovery-workspace-green.stdout`
- **STOP**：需要新 schema/Gate、放松普通 prepare、信任 caller 字段、改旧 run、只核 abbreviated HEAD，或无法在任何写前拒绝 orphan/dirty/invalid stage/重复并发 recovery。
- **recovery**：回退 T017 六文件；保留 T016 RED。
- **task risk**：恢复专用例外被误用为通用 workspace 接受器。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`complete`
- **actual_changes**：新增 `recoverTaskWorkspace(taskHandle)` 与 make-decision recovery binding；recover-run 从 exact deterministic registered clean worktree 的 full current HEAD 建立新 baseline。聚焦修复四项审查 finding：读取 exact branch reflog origin 并拒绝 orphan/force-rewind；capability 初始及每次使用均复核 clean；invalid args/stage 与已消费 recovery 在认证写前拒绝；kernel 锁内以 expected previous ref/hash CAS 创建标准新 run，并以成对 runtime-owned recovery source 绑定 previous lineage。另公开只读 `latestHistoricalStageRun(stage)`：返回已验证 lineage 的最新历史 run（含有效 invalidated run），仅供 recover-run 选源；同一 active recovery run 的后续 make-decision 命令继续使用 recovery workspace，明确 `prepare` 仍走普通严格路径。有效 invalidated recovery run 可成为下一次 recovery 的 previous/source；未 invalidated 的 recovery run 仍由 kernel 锁内拒绝，CAS 不变。`publishRequirementsLedger` 命中同一 current pointer 时先验证 ledger 与 coverage ref/hash 的实际内容绑定，再复用 canonical ledger evidence 为当前 active make-decision run 完成 runtime-owned Step 2；coverage 缺失/错绑在 journal 写入前以 `requirements current pointer is invalid or misbound` 失败，不改 pointer/ledger/coverage、不造 revision。wh-review trusted make-decision subject 只从 TaskKernel 读取 active run：仅 reader 已验证的 recovery source 使用 recovery workspace；普通/accepted run、`activeStageRun` 与其他 stage 语义不变，不接受 caller recovery 字段或路径。机械刷新 wh-review bundle 文件 hash 与 catalog hash；旧 run/历史、SKILL 内容与 schema 均未改。
- **executed_commands**：`npx vitest run --maxWorkers=1 core/__tests__/workspace-manager.test.mjs scripts/__tests__/stage-runtime-recover-run.test.mjs` → exit 0，2 files、30/30 tests pass；recover-run 单文件先 8/8、continuation 后 9/9、invalidated recovery source 后 10/10 pass；`npx vitest run --maxWorkers=1 skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs` → exit 0，18/18 tests pass；`npx vitest run --maxWorkers=1 core/__tests__/task-kernel-publish.test.mjs` → idempotent Step 2 为 62/62、coverage binding 后 63/63 tests pass；新 tree 仅一次 `npm run check:skill-closure` → exit 0；`git diff --check` → exit 0。
- **evidence_refs**：初始 GREEN `/tmp/T017-recovery-green.stdout`，sha256 `2de074943b759c5dc4aa0e925c79043bb9d490975f0949cffc6c3f533cdc68ed`；审查 finding 聚焦验证 `/tmp/T017-review-findings-green.stdout`，sha256 `4a94ed99f4fc4017907709a5001d0edb232a5c1a99933aba03d2f5469a2cbece`；invalidated historical source `/tmp/T015-invalidated-source-green.stdout`，sha256 `13a09b492df2d0daf9ec69a1abf706c4e5988d861396e7409c2bb8d9d2c97640`；recovery continuation `/tmp/T015-recovery-continuation-green.stdout`，sha256 `be0b551b6b1824c16dcbe862c06ecdd0cbb82c80883730a29ec6b359b3e9d59d`；invalidated recovery source `/tmp/T015-invalidated-recovery-source-green.stdout`，sha256 `bdb5d39d25fea7aa9c6520bbedee69c0f52ec44a1f399245e1a759ad4c55e809`；方向 review 实跑在 provider 前因普通 workspace ancestor 校验失败，作为本轮新增 RED，未创建 provider attempt；wh-review recovery GREEN `/tmp/T017-wh-review-recovery-green.stdout`，sha256 `b8c6e2a37e06923eeb5231c21fabdd37f66a01b42de58a68b2ca98a26bf87061`；closure `/tmp/T017-wh-review-recovery-closure.stdout`，sha256 `81ae1ce22680bb6c998e94229705a18a0ba9d82af3932a0f94f6f01db7bfaf45`；正式 run-0004 Step 2 pre-write failure 保留；idempotent ledger GREEN `/tmp/T017-idempotent-ledger-green.stdout`，sha256 `89f7b79ae362e60f9dffcdba0253869aedf4d1cb58c6db89b6f9f6ed2d12d2de`；coverage binding GREEN `/tmp/T017-coverage-binding-green.stdout`，sha256 `b10cf45149bab84ca93944b19411e3742f4f800d35045bb3b51a541f3bbe7e85`。
- **covered_ac**：AC-01、AC-02、AC-03、AC-15、AC-16。
- **review_fact**：T016 RED 独立审查与 T017 GREEN 独立审查的原 verdict 均为 `revise_required`，两份历史均保留。branch origin、持续 clean、write-before-validation、previous-run CAS finding 已由 30/30 聚焦验证；方向 review 的 recovery workspace finding 已由 18/18 与 closure 聚焦验证；run-0004 的 requirements idempotent Step 2 finding已由 62/62 聚焦验证；current pointer coverage binding finding 已由 63/63 聚焦验证。未二审、未将任一历史改写为 pass。
- **completed_at**：2026-07-30。

#### T015: 同任务透明恢复与正式重跑

- **ID**：T015
- **Phase**：Phase 7：一次审查、一次全量、透明恢复
- **goal**：旧 run 保持 incomplete，新 run 真实执行声明组件。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflow-quality-recording-simplification/spec.md","hash":"34a5eae18324875a80a986f4f2e56eb5ae1be74e3705f995f1c86c87079cac6a","id":"FR-REC-001"},{"artifact_kind":"plan","ref":"specs/workflow-quality-recording-simplification/plan.md","hash":"de83174d5668c9bac8c4bffb168adc88facceca5baaf9d0114d6465b8ce23184","id":"T015"}]`
- **输入**：run-0005 Step 1–10、T021 GREEN 与旧 run recovery source；完成后等待真实用户确认。
- **依赖**：T021
- **并行**：否 — 单一正式 run
- **FR**：FR-INV-001、FR-INV-002、FR-INV-003、FR-INV-004、FR-INV-005、FR-COMP-001、FR-COMP-002、FR-COMP-003、FR-COMP-004、FR-COMP-005、FR-REC-001、FR-REC-002
- **AC**：AC-01、AC-02、AC-03、AC-04、AC-15、AC-16
- **动作**：正式重跑 make-decision，引用 recovery source，不继承伪 facts。
- **精确文件**：`scripts/stage-runtime.mjs`
- **boundary**：files: `scripts/stage-runtime.mjs`; symbols/regions: runtime invocation only; records append-only.
- **输出**：新 run 真实 invocation 与 completion facts。
- **Knowledge**：仍需真实用户确认才可 accepted。
- **verification_role**：N/A — non-behavior change: formal recovery run
- **paired_task**：N/A — recovery run has no RED/GREEN pair
- **gate_cmd**：`node scripts/stage-runtime.mjs recover-run --stage=make-decision --project=workflowhub --task=workflow-quality-recording-simplification --reason=transparent-recovery`
- **expected_exit**：0
- **oracle**：ORACLE-RECOVERY — 命令执行 `prepare → start-run → 正式 host bridge dispatch → make-decision Step 2–10 → run → 只读 recovery audit`；旧 run scoped canonical 文件 hash 不变，journal 仅追加新 run 行；新 run 绑定旧 run、真实 invocation/outcome 与完整 completion；confirmation 和 accepted 均不存在，等待真实用户确认。
- **evidence_path**：`apply/evidence/T015-recovery.stdout`
- **STOP**：需要删除旧历史、倒填、跳过用户确认或自动 close。
- **recovery**：保留旧/新 append-only 事实，停止未授权动作。
- **task risk**：新 run 未完成真实交互即被误称 accepted。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`complete`
- **actual_changes**：run-0004 的 Step 2 pre-write failure 与 invalidation 均保留。run-0005 真实完成 Step 1–10；正式 detail verdict=`revise_required` 永久保留。材料补齐后追加 generation 2 material revision、decision receipt revision、detail resolution、真实 `grill-revalidation-0002` 与最新 aggregate；未重跑 Talk/provider 或 full review。用户确认后生成正式 attempt、confirmation、Steps 11–12、through Step 12 full audit 与 accepted。
- **executed_commands**：前置实现聚焦验证 `npx vitest run --maxWorkers=1 scripts/__tests__/stage-runtime-recover-run.test.mjs` → exit 0，先 8/8、continuation 后 9/9、invalidated recovery source 后 10/10 tests pass；`node scripts/stage-runtime.mjs invalidate-run ... run-0004` → exit 0；`recover-run ... transparent-recovery-after-ledger-binding-fix` → exit 0，生成 run-0005；run-0005 的 Step 1–10 与 detail review 已执行；T019 聚焦 receipt/revalidation tests 4/4 pass、独立 focused verification pass；未跑全量。
- **evidence_refs**：run-0004 invalidation `runs/make-decision/invalidations/321162652d0b87198a8be6c697a4d7232ffa020ab6895883841c3ae573f6e960.json`；run-0005 `runs/make-decision/run-0005.json`；generation 2 material revision `materials/revisions/140e06fd19330c3ba7981145ca3ec067b1962509142670c4030b3a2565ab7ee9.json`；detail resolution `reviews/resolutions/c47d947d015ed33dae0756aef889510b06e9ddce4c8f5bfe31b12c27c591d22c.json`；revalidation `evidence/stage-content/43bbe9d000b580288aa7662d6f86158400a83a35b1965831e9437eacaf09a973/interaction-completion.grill-revalidation-0002.json`；aggregate 同目录 `interaction-completion.aggregate.json`；attempt `results/make-decision/attempt-0001.json`，integrity `e756a89b2ccd746d74605c03ea275a4ba69358c8d54a498bd61dbb6ad327cf07`；confirmation `confirmations/make-decision/attempt-0001.json`；accepted `results/make-decision/accepted.json`；full audit `evidence/audits/make-decision/0c954a4bafbe67629da7b1595afaee0b930a0653f8b477679a71b70cc5c8c1fc.json`。
- **covered_ac**：AC-01、AC-02、AC-03、AC-04、AC-15、AC-16。
- **review_fact**：T017 独立审查原 verdict=`revise_required` 保留；run-0005 detail result verdict=`revise_required` 也永久保留。detail finding 的材料补齐与 T019 独立 focused verification 已记录，未自动 full re-review，未改写为 pass。
- **completed_at**：2026-07-30

#### T018: RED：post-Grill current material revalidation

- **ID**：T018
- **Phase**：Phase 7：一次审查、一次全量、透明恢复
- **goal**：先证明 post-Grill 材料整改会被旧 receipt/Grill 树错误阻断。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflow-quality-recording-simplification/spec.md","hash":"34a5eae18324875a80a986f4f2e56eb5ae1be74e3705f995f1c86c87079cac6a","id":"FR-MAT-006"},{"artifact_kind":"plan","ref":"specs/workflow-quality-recording-simplification/plan.md","hash":"de83174d5668c9bac8c4bffb168adc88facceca5baaf9d0114d6465b8ce23184","id":"T018"}]`
- **输入**：run-0005 Step 10、原 Grill、current material revision、detail finding resolution。
- **依赖**：T017
- **并行**：否 — 单一 active make-decision run
- **FR**：FR-MAT-001、FR-MAT-002、FR-MAT-004、FR-MAT-006、FR-INV-001、FR-INV-003
- **AC**：AC-03、AC-05、AC-09、AC-16、AC-17
- **动作**：新增最小聚焦反例：decision revision 不得触发 Step 9 retry；旧 Grill 不能直绑新 tree；伪造/缺失新 invocation 的 revalidation 不能被 aggregate 接受。
- **精确文件**：`core/__tests__/task-kernel-publish.test.mjs`、`tests/stage-content-evidence.test.mjs`
- **boundary**：files: `core/__tests__/task-kernel-publish.test.mjs`, `tests/stage-content-evidence.test.mjs`; symbols/regions: decision revision and post-Grill revalidation tests only.
- **输出**：失败的聚焦行为测试。
- **Knowledge**：D-05、D-06、D-11；原 `revise_required` 永久保留。
- **verification_role**：RED
- **paired_task**：T019
- **gate_cmd**：`./node_modules/.bin/vitest run core/__tests__/task-kernel-publish.test.mjs tests/stage-content-evidence.test.mjs -t "decision revision|grill revalidation" --pool=forks --maxWorkers=1 --minWorkers=1`
- **expected_exit**：1
- **oracle**：ORACLE-POST-GRILL — 旧 Step 9/Grill bytes 不变；新版 receipt 不重试；revalidation 需要真实新 invocation，Talk 和 provider review 均不新增。
- **evidence_path**：`apply/evidence/T018-post-grill-focused.stdout`
- **STOP**：重写历史、重跑 Talk/full review、把 audit/review 变 Gate，或接受 caller binding。
- **recovery**：保留旧事实；缺 invocation 只记录 incomplete，继续修复。
- **task risk**：新版材料被误当旧 Grill 已验证，或 revalidation 成为重复认证手续。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`complete`
- **actual_changes**：已复现 Step 9 `already has different canonical evidence or status` 与未知 `grill-revalidation` 类型；aggregate 未核新 invocation 的缺口由独立审查逐行确认，后续由 T019 的负向聚焦测试固定。
- **executed_commands**：receipt revision 实际运行失败并保留错误；初始 interaction 聚焦测试失败；无全量测试。
- **evidence_refs**：非 canonical 聚焦 stdout 待本轮收集。
- **covered_ac**：AC-03、AC-05、AC-09、AC-16、AC-17。
- **review_fact**：N/A — RED 不审查；detail review 原 verdict=`revise_required` 不变。
- **completed_at**：2026-07-30。

#### T019: GREEN：post-Grill current material revalidation

- **ID**：T019
- **Phase**：Phase 7：一次审查、一次全量、透明恢复
- **goal**：让 post-Grill 材料整改继续同一 run，不伪造旧 Grill，也不重跑 Talk/full review。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflow-quality-recording-simplification/spec.md","hash":"34a5eae18324875a80a986f4f2e56eb5ae1be74e3705f995f1c86c87079cac6a","id":"FR-MAT-006"},{"artifact_kind":"plan","ref":"specs/workflow-quality-recording-simplification/plan.md","hash":"de83174d5668c9bac8c4bffb168adc88facceca5baaf9d0114d6465b8ce23184","id":"T019"}]`
- **输入**：T018 RED、run-0005 Step 10、原 Grill、current material revision、detail finding resolution。
- **依赖**：T018
- **并行**：否 — 单一 active make-decision run
- **FR**：FR-MAT-001、FR-MAT-002、FR-MAT-004、FR-MAT-006、FR-INV-001、FR-INV-003
- **AC**：AC-03、AC-05、AC-09、AC-16、AC-17
- **动作**：新版 decision receipt 保持 Step 9 历史不变；真实 `grill-with-docs` 只复核材料整改，writer 从可信原 Grill/current material revision 注入 binding；aggregate 复用三轮 Talk，缺新 invocation 拒绝。
- **精确文件**：`core/schemas/interaction-completion.v1.json`、`core/stage-content-evidence.mjs`、`core/task-kernel-implementation.mjs`、`core/__tests__/task-kernel-publish.test.mjs`、`tests/stage-content-evidence.test.mjs`、`workflows/make-decision/SKILL.md`
- **boundary**：files: `core/schemas/interaction-completion.v1.json`, `core/stage-content-evidence.mjs`, `core/task-kernel-implementation.mjs`, `core/__tests__/task-kernel-publish.test.mjs`, `tests/stage-content-evidence.test.mjs`, `workflows/make-decision/SKILL.md`; symbols/regions: decision receipt revision and post-Grill revalidation only.
- **输出**：append-only receipt revision、revalidation evidence 与 aggregate revision。
- **Knowledge**：D-05、D-06、D-11；原 `revise_required` 永久保留。
- **verification_role**：GREEN
- **paired_task**：T018
- **gate_cmd**：`./node_modules/.bin/vitest run core/__tests__/task-kernel-publish.test.mjs tests/stage-content-evidence.test.mjs -t "decision revision|grill revalidation" --pool=forks --maxWorkers=1 --minWorkers=1`
- **expected_exit**：0
- **oracle**：ORACLE-POST-GRILL — 旧 Step 9/Grill bytes 不变；新版 receipt 不重试；revalidation 需要真实新 invocation，Talk 和 provider review 均不新增。
- **evidence_path**：`apply/evidence/T019-post-grill-focused.stdout`
- **STOP**：重写历史、重跑 Talk/full review、把 audit/review 变 Gate，或接受 caller binding。
- **recovery**：保留旧事实；缺 invocation 只记录 incomplete，继续修复。
- **task risk**：新版材料被误当旧 Grill 已验证，或 revalidation 成为重复认证手续。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`complete`
- **actual_changes**：新版 receipt 只在本 run Step 10 后作为当前材料，旧 Step 9 bytes 不重绑、不重试；`grill-revalidation-0001` 固定绑定原 Grill，writer 自动注入原 Grill/current material revision，aggregate 必须核对新 authenticated invocation。真实 `0001`、direction/detail 零 provider resolution 已追加；旧 verdict 和 Talk/provider 均未改写或重跑。其后发现 resolution post-write reset runtime defect，转 T020/T021。
- **executed_commands**：`vitest ... -t "accepts a verified decision revision"` → 1/1 pass；`vitest ... -t "appends a controlled grill revalidation|permits only one focused grill revalidation"` → 2/2 pass；此前 caller forged binding 与 prewritten-without-invocation 两条各 1/1 pass；无全量测试。
- **evidence_refs**：`evidence/stage-content/43bbe9d157e9fdd1a69aa704c919bc6e4ffb2fe67a4a4bda8a12e641660542b3/interaction-completion.grill-revalidation-0001.json`；material revision `materials/revisions/0c6a93c1d7eb0a7b7a9ec2d55ea9001b44eb5b94023dcd19b6c4bbc304ce6dc4.json`；direction resolution `reviews/resolutions/a298bbe6826c387fa263e90123b01a06f9530b0fd8ebfac1ffb1644992d5bc9d.json`；detail resolution 已 canonical 写入且原 CLI post-write error 由 T020 固定。
- **covered_ac**：AC-03、AC-05、AC-09、AC-16、AC-17。
- **review_fact**：独立审查原 verdict=`revise_required` 保留；Step 10 前 revision 与多次 revalidation 循环两项 finding 均已由上述 focused tests 验证修复，未自动 full review、未产生新 provider verdict。detail review 原 verdict=`revise_required` 不变。
- **completed_at**：2026-07-30。

#### T020: RED：resolution post-write reset 与 replacement 缺口

- **ID**：T020
- **Phase**：Phase 8：resolution 完成边界与一次性 revalidation replacement
- **goal**：证明 make-decision structural resolution 已写入后错误调用 unsupported reset，并证明当前合同拒绝代码修复后的唯一 replacement。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflow-quality-recording-simplification/spec.md","hash":"34a5eae18324875a80a986f4f2e56eb5ae1be74e3705f995f1c86c87079cac6a","id":"FR-MAT-007"},{"artifact_kind":"plan","ref":"specs/workflow-quality-recording-simplification/plan.md","hash":"de83174d5668c9bac8c4bffb168adc88facceca5baaf9d0114d6465b8ce23184","id":"T020"}]`
- **输入**：T019、真实 detail resolution post-write error、`grill-revalidation-0001`。
- **依赖**：T019
- **并行**：否 — 同一 runtime 边界
- **FR**：FR-MAT-006、FR-MAT-007、FR-REV-002
- **AC**：AC-05、AC-17、AC-18
- **动作**：新增两个聚焦反例：make-decision structural resolution 应成功返回且无 reset；完成 `0001` 后 direct-next material/tree 变化应允许唯一 `0002`。
- **精确文件**：`core/__tests__/task-kernel-publish.test.mjs`、`tests/stage-content-evidence.test.mjs`
- **boundary**：files: `core/__tests__/task-kernel-publish.test.mjs`, `tests/stage-content-evidence.test.mjs`; symbols/regions: structural resolution and grill replacement tests only.
- **输出**：两个行为 RED。
- **Knowledge**：D-12；旧 canonical resolution/event 已写入事实不回滚。
- **verification_role**：RED
- **paired_task**：T021
- **gate_cmd**：`./node_modules/.bin/vitest run core/__tests__/task-kernel-publish.test.mjs tests/stage-content-evidence.test.mjs -t "structural make-decision resolution|append-only replacement grill revalidation" --pool=forks --maxWorkers=1 --minWorkers=1`
- **expected_exit**：1
- **oracle**：ORACLE-RESOLUTION-REPLACEMENT — RED 分别命中 unsupported reset 和 only-one revalidation；不是 fixture/setup 失败。
- **evidence_path**：`apply/evidence/T020-resolution-replacement-red.stdout`
- **STOP**：删除已写 resolution、重跑 provider/Talk，或把任意材料更新解释成 replacement。
- **recovery**：保留 RED 和旧事实，进入 T021。
- **task risk**：post-write error 误导重试，或修复 tree 无法形成最终可信 aggregate。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`complete`
- **actual_changes**：两个 RED 已分别命中 `review flow reset is only supported for open design and verification stages` 与 `make-decision permits only one focused grill revalidation per workflow run`。
- **executed_commands**：上述 gate 聚焦运行 → exit 1，2 tests failed；修正 test fixture 的 tree OID 后，resolution RED 精确命中 runtime defect。
- **evidence_refs**：当前会话聚焦 stdout；无 canonical Phase receipt。
- **covered_ac**：AC-05、AC-17、AC-18。
- **review_fact**：N/A — RED 不审查。
- **completed_at**：2026-07-30。

#### T021: GREEN：resolution 正常完成与唯一 replacement

- **ID**：T021
- **Phase**：Phase 8：resolution 完成边界与一次性 revalidation replacement
- **goal**：make-decision resolution 干净完成；修复 tree 只允许一个可信 `0002`，不开放循环。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflow-quality-recording-simplification/spec.md","hash":"34a5eae18324875a80a986f4f2e56eb5ae1be74e3705f995f1c86c87079cac6a","id":"FR-MAT-007"},{"artifact_kind":"plan","ref":"specs/workflow-quality-recording-simplification/plan.md","hash":"de83174d5668c9bac8c4bffb168adc88facceca5baaf9d0114d6465b8ce23184","id":"T021"}]`
- **输入**：T020 RED。
- **依赖**：T020
- **并行**：否 — 同一最小 GREEN
- **FR**：FR-MAT-006、FR-MAT-007、FR-REV-002
- **AC**：AC-05、AC-17、AC-18
- **动作**：所有 Stage 的 resolution 都不自动创建 reset；显式 reset API 只保留给用户明确要求的新语义审查。schema/runtime 增加 caller-forbidden `supersedes_revalidation`；只允许 completed `0001` 的 direct-next material/tree 生成 `0002`，要求各自 invocation，禁止 `0003`，aggregate 绑定最新 replacement。
- **精确文件**：`core/task-kernel-implementation.mjs`、`core/schemas/interaction-completion.v1.json`、`core/stage-content-evidence.mjs`、`core/__tests__/task-kernel-publish.test.mjs`、`tests/stage-content-evidence.test.mjs`、`workflows/make-decision/SKILL.md`
- **boundary**：files: `core/task-kernel-implementation.mjs`, `core/schemas/interaction-completion.v1.json`, `core/stage-content-evidence.mjs`, `core/__tests__/task-kernel-publish.test.mjs`, `tests/stage-content-evidence.test.mjs`, `workflows/make-decision/SKILL.md`; symbols/regions: reset eligibility and revalidation replacement only.
- **输出**：干净 resolution 返回和 append-only `0002` 合同。
- **Knowledge**：D-11、D-12；原 review/result/resolution/`0001` 永久保留。
- **verification_role**：GREEN
- **paired_task**：T020
- **gate_cmd**：`./node_modules/.bin/vitest run core/__tests__/task-kernel-publish.test.mjs tests/stage-content-evidence.test.mjs -t "records resolutions as ordered|structural make-decision resolution|grill revalidation|review generation" --pool=forks --maxWorkers=1 --minWorkers=1`
- **expected_exit**：0
- **oracle**：ORACLE-RESOLUTION-REPLACEMENT — 所有 Stage 的 resolution 无自动 reset/provider 增量，显式 reset 能力保持；`0002` 自动 supersede、direct-next、独立 invocation、Talk refs 不变；forged/missing/stale/`0003` 失败。
- **evidence_path**：`apply/evidence/T021-resolution-replacement-green.stdout`
- **STOP**：吞异常、宽化 reset、caller binding、无限 replacement、自动 review。
- **recovery**：失败则保留 RED/历史，不执行正式 aggregate。
- **task risk**：一次性恢复被误扩为重复审查机制。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`complete`
- **actual_changes**：所有 Stage 的 structural resolution 不再自动进入 reset；显式 reset 能力仍受原 Stage/身份约束。`0002` 只从 completed `0001`、direct-next material 和新 tree 派生，caller 不能传 binding；`0003`、缺 invocation 与 stale aggregate 拒绝，aggregate 复用原 Talk。
- **executed_commands**：初始 GREEN：TaskKernel 相关 4 tests pass、stage-content grill revalidation 5 tests pass；finding 修复后 TaskKernel 聚焦 5/5 pass，stage-content revalidation 聚焦 6/6 pass；材料最小可执行合同 1/1 pass；`node --check`、`git diff --check` pass；无全量测试。
- **evidence_refs**：当前会话聚焦 stdout；独立 review verdict=`revise_required` 及两项 finding 保留在本任务记录。
- **covered_ac**：AC-05、AC-17、AC-18。
- **review_fact**：独立 Phase review 原 verdict=`revise_required` 保留；两项 finding 为自动 reset 仍触发重复审查、缺少 `0002` invocation/stale aggregate 负例。修复后分别由 TaskKernel 5/5 和 revalidation 6/6 聚焦测试验证；未覆盖旧 verdict，未强制二审。
- **completed_at**：2026-07-30。

#### T013: 唯一独立 integration review

- **ID**：T013
- **Phase**：Phase 7：一次审查、一次全量、透明恢复
- **goal**：异源审查完整候选且不为 pass 重试。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflow-quality-recording-simplification/spec.md","hash":"34a5eae18324875a80a986f4f2e56eb5ae1be74e3705f995f1c86c87079cac6a","id":"FR-REV-001"},{"artifact_kind":"plan","ref":"specs/workflow-quality-recording-simplification/plan.md","hash":"de83174d5668c9bac8c4bffb168adc88facceca5baaf9d0114d6465b8ce23184","id":"DEC-003"}]`
- **输入**：T015 恢复后的 accepted lineage、正式 build-spec/build-plan/build-code Phase facts、fresh tests、当前 diff 和四材料。
- **依赖**：T015，以及恢复后正式 accepted build-plan/build-code lineage
- **并行**：否 — 唯一 review
- **FR**：FR-REV-001、FR-REV-002、FR-REV-003、FR-VER-003
- **AC**：AC-05、AC-06、AC-13、AC-14、AC-16
- **动作**：真实用户确认 T015 后，按正式入口执行 build-spec、build-plan、build-code；
  在 build-code fresh tests 之后正式 wh-review 一次；finding 只回对应 GREEN 修复并追加 resolution。
- **精确文件**：`skills/wh-review/scripts/review-controller.mjs`
- **boundary**：files: `skills/wh-review/scripts/review-controller.mjs`; symbols/regions: no review-time edits; resolution-only reference.
- **输出**：canonical review result/ref。
- **Knowledge**：Q3 独立来源。
- **verification_role**：N/A — non-behavior change: independent review
- **paired_task**：N/A — independent review has no RED/GREEN pair
- **gate_cmd**：`node skills/wh-review/scripts/wh-review-cli.mjs run < apply/evidence/T013-review-input.json`
- **expected_exit**：0
- **oracle**：ORACLE-INTEGRATION — 一次真实 verdict 或真实 unavailable，不二审。
- **evidence_path**：`apply/evidence/T013-review-result.json`
- **STOP**：需要手写 provider result、扩大 route 或再次 full review。
- **recovery**：不改业务字节；保留真实 verdict。
- **task risk**：review 输入未绑定当前 tree。

##### 执行状态填写区（唯一完成权威）

- [ ] **任务完成**
- **status**：`pending`
- **actual_changes**：N/A — not started
- **executed_commands**：N/A — not started
- **evidence_refs**：N/A — not started
- **covered_ac**：N/A — not started
- **review_fact**：N/A — not reviewed
- **completed_at**：N/A — not completed

### Verify

T014 保存真实验证事实；T016/T017 修复并验证 recovery workspace；T015 新 run
真实 facts并等待用户确认；
确认后形成正式 build lineage，T013 在 fresh tests 后一次 review。

### Knowledge

所有 GREEN、canonical review 与真实用户确认边界。

### STOP

计划二审、第二次全量、倒填历史或自动确认。

### Done

全量与聚焦事实均如实记录；recovery workspace RED/GREEN 完成；新 run 与后续
build lineage 真实；fresh tests 后的一次 integration review 有正式结果，然后才可
进入 verify-code。

### Risks and rollback

风险是为追 pass 重跑；停止并如实记录，不覆盖事实。

## 3. Dependency Graph

`T001→T002→T003→T004→{T005→T006,T007→T008,T009→T010}; {T004,T008,T010}→T011; {T006,T008,T010,T011}→T012→T014→T016→T017→T018→T019→T020→T021→T015→T013`

## 4. Requirement and Verification Traceability

| FR | Task IDs | AC IDs | Phase | Gate / evidence |
| --- | --- | --- | --- | --- |
| FR-INV-001..005 | T001,T002,T011,T012,T016,T017,T015 | AC-01,02,03,16 | 1,6,7 | ORACLE-INV |
| FR-COMP-001..005 | T003,T004,T011,T012,T015 | AC-03,04,13,14,16 | 2,6,7 | ORACLE-COMP |
| FR-REV-001..006 | T005,T006,T013 | AC-05,06,07,08,16 | 3,7 | ORACLE-REVIEW |
| FR-MAT-001..007 | T007,T008,T011,T012,T018,T019,T020,T021 | AC-09,10,16,17,18 | 4,6,7,8 | ORACLE-MAT |
| FR-BQA-001..003 | T009,T010,T011,T012 | AC-11,12,16 | 5,6 | ORACLE-BQA |
| FR-VER-001..003 | T011,T012,T013,T014 | AC-13,14,16 | 6,7 | ORACLE-VERIFY |
| FR-REC-001..002 | T011,T012,T016,T017,T015 | AC-15,16 | 6,7 | ORACLE-RECOVERY |

## 5. Final Boundary Check

- T001–T012、T014–T021 已 complete；T013 保持 pending，等待最终 integration review。
- T001–T012 为六对严格 RED/GREEN；T016/T017 为恢复 blocker 的第七对，T018/T019 为 post-Grill 第八对，T020/T021 为 resolution/replacement 第九对。
- T013–T015 中 T013/T015 是有理由的 non-behavior task，T014 保存真实验证事实。
- commit/push/merge/archive/cleanup 均未授权。

## Appendix A. Legacy import

旧 make-decision run 只读，缺 invocation 标 incomplete；不倒填、不删除、不改 verdict。

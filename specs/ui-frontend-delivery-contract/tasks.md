# 任务清单：WorkflowHub UI 与前端交付契约

- **Input**：`decision-log.md`、`spec.md`、`plan.md`
- **Template version**：`plan-task.v3`

## Phase P1 — 技能包与外部来源闭包

### Goal

交付三个可独立调用的 UI 技能、固定 Vercel 只读上游闭包、ADR/research 事实和 skill/catalog 验证；不接入阶段。

### Files

- **NEW**：`skills/ui-project-init/SKILL.md`, `skills/ui-project-init/skill-bundle.json`, `skills/design-source-readiness/SKILL.md`, `skills/design-source-readiness/skill-bundle.json`, `skills/frontend-component-quality/SKILL.md`, `skills/frontend-component-quality/skill-bundle.json`, `skills/frontend-component-quality/upstream/react-best-practices/AGENTS.md`, `skills/frontend-component-quality/upstream/react-best-practices/LICENSE`, `skills/frontend-component-quality/upstream/react-best-practices/UPSTREAM.md`, `docs/adr/0015-ui-design-source-and-initialization.md`, `docs/adr/0016-external-first-frontend-component-quality.md`, `docs/research/design-md-executable-source-research-2026-08-22.md`, `docs/research/ui-delivery-contract-external-practices-2026-08-22.md`, `docs/research/ui-frontend-simple-workflow-design-2026-08-22.md`, `tests/contract/ui-skill-contract.test.mjs`
- **MODIFY**：`skills/catalog.yaml`, `skills/reuse-registry.md`, `THIRD_PARTY_NOTICES.md`
- **DO NOT TOUCH**：`decision-log.md`, `spec.md`, `runtime/*`, PaperBuilder/F11 source trees。

### Tasks

#### T001 — RED：技能、来源和唯一消费者合同

- **ID**：T001
- **Phase**：Phase P1 — 技能包与外部来源闭包
- **goal**：先让技能契约测试明确暴露缺失的 UI skill、bundle、来源和唯一 consumer。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"a2f190950edd9552c4c82347e7cd4023a705d83c4f3c4c9636f8bafb1d14f80c","id":"SPEC"},{"artifact_kind":"plan","ref":"plan.md","hash":"9d3ce5da0cae21ea0123abfcaacc5e047acaf166290e713fa81ae676e1371382","id":"PLAN"}]`
- **source_refs / decision_refs**：`R-001,R-002,R-003,R-004,R-007,R-009,R-011 → D-001,D-002,D-003,D-004,D-007,D-009,D-014,D-025`
- **输入**：当前 `decision-log.md`、`spec.md`、现有 `skills/catalog.yaml` 和 skill bundle schema。
- **依赖**：none
- **并行**：否 — first RED for this behavior
- **FR**：FR-UI-001, FR-UI-002, FR-UI-003, FR-UI-004
- **AC**：AC-UI-001, AC-UI-002, AC-UI-003, AC-UI-004
- **动作**：增加只读 contract test，断言 `ui-project-init` 的 new/legacy、`design-source-readiness` 的 Read Map、`frontend-component-quality` 的 Component Quality Map、Vercel pinned identity、source/license/consumer/deletion metadata 和无独立 gate；不改生产实现。
- **精确文件**：`tests/contract/ui-skill-contract.test.mjs`
- **boundary**：files: `tests/contract/ui-skill-contract.test.mjs`; symbols/regions: skill catalog/bundle assertions only
- **输出**：RED 测试输出明确指出缺失技能或闭包字段，且保留 UI/non-UI/unknown、Design.md 版本和 no-hash 负例。
- **Knowledge**：测试只能验证文件/字段和事实语义，不把 skill 文件存在当作阶段执行或质量通过。
- **verification_role**：RED
- **paired_task**：T002
- **gate_cmd**：`node --test tests/contract/ui-skill-contract.test.mjs`
- **expected_exit**：1
- **oracle**：`ORACLE-UI-SKILL` — 新技能未实现时命令非零，失败信号包含缺失路径/来源/consumer，而不是静默跳过。
- **evidence_path**：`quality/tests/ui-skill-contract.txt`
- **STOP**：命令不可执行、测试触碰 runtime 状态、发现需要新阶段/第五材料或 Vercel 来源无法核验时停回 plan。
- **recovery**：当前 task 执行者保留 RED 输出，修正测试边界或回 owning material，不删已有决策/研究事实。
- **task risk**：RED 写成只查文件存在会漏掉唯一 consumer、许可证和 unknown/no-gate 语义。
- **test tier / test method**：simple；只读仓库技能/manifest/JSON 合同，不启动服务。
- **scenarios / commands / expected exit / oracle**：new project、legacy project、Design.md missing/version changed、Vercel upstream present/missing、UI applicability conflict；同一命令 exit 1 为 RED，oracle 为 ORACLE-UI-SKILL。
- **fixtures_services**：临时 Markdown/YAML/JSON fixture；无服务；测试结束删除临时目录。
- **coverage limits**：覆盖技能包和来源闭包，不证明 build-spec 实际调用或目标产品页面视觉质量。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：新增 `tests/contract/ui-skill-contract.test.mjs`，只读检查三个 skill、bundle、catalog/provenance、Vercel 来源和 no-gate/no-hash 语义。
- **executed_commands**：`node --test tests/contract/ui-skill-contract.test.mjs` → exit 1（RED）；输出见 `quality/tests/ui-skill-contract-red.txt`。
- **evidence_refs**：`[{"kind":"task_record","ref":"quality/tests/ui-skill-contract-red.txt","sha256":"3481ac806c0ef9f33cd834345a9fb7f12af83836be696ba45b238b4d96cc907f"}]`
- **covered_ac**：AC-UI-001/002/003/004 — RED 缺口事实由 T002 GREEN 配对闭合。
- **review_fact**：P1 phase review unavailable（`MATERIAL_FORBIDDEN: change_map is not allowed for this review`）；未产生可裁决 provider findings。
- **completed_at**：2026-08-22
- **执行事实**：RED 真实暴露技能路径、来源闭包和 provenance 缺口；未执行 runtime 或目标产品页面测试。

#### T002 — GREEN：实现技能包和外部来源闭包

- **ID**：T002
- **Phase**：Phase P1 — 技能包与外部来源闭包
- **goal**：实现三个可搬运技能、Vercel compiled guide 只读闭包和来源治理，使 T001 GREEN。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"a2f190950edd9552c4c82347e7cd4023a705d83c4f3c4c9636f8bafb1d14f80c","id":"SPEC"},{"artifact_kind":"plan","ref":"plan.md","hash":"9d3ce5da0cae21ea0123abfcaacc5e047acaf166290e713fa81ae676e1371382","id":"PLAN"}]`
- **source_refs / decision_refs**：`R-001,R-002,R-003,R-004,R-007,R-009,R-011 → D-001,D-002,D-003,D-004,D-007,D-009,D-014,D-025`
- **输入**：T001 的真实失败断言、`docs/adr/0015...`/`0016...` 方向事实、外部 Vercel compiled guide 和 MIT 来源。
- **依赖**：T001
- **并行**：否 — RED/GREEN 必须串行
- **FR**：FR-UI-001, FR-UI-002, FR-UI-003, FR-UI-004
- **AC**：AC-UI-001, AC-UI-002, AC-UI-003, AC-UI-004
- **动作**：新增三个 `SKILL.md`/bundle；加入 Vercel commit `dd089a8c752c966dee8bf0f27cb625ba193ffd9e` 的 `AGENTS.md`、`LICENSE`、`UPSTREAM.md`；写 ADR/research；更新 catalog/reuse/third-party notice，明确 owner、唯一 consumer、适用范围和删除条件。
- **精确文件**：`skills/ui-project-init/SKILL.md`, `skills/ui-project-init/skill-bundle.json`, `skills/design-source-readiness/SKILL.md`, `skills/design-source-readiness/skill-bundle.json`, `skills/frontend-component-quality/SKILL.md`, `skills/frontend-component-quality/skill-bundle.json`, `skills/frontend-component-quality/upstream/react-best-practices/AGENTS.md`, `skills/frontend-component-quality/upstream/react-best-practices/LICENSE`, `skills/frontend-component-quality/upstream/react-best-practices/UPSTREAM.md`, `docs/adr/0015-ui-design-source-and-initialization.md`, `docs/adr/0016-external-first-frontend-component-quality.md`, `docs/research/design-md-executable-source-research-2026-08-22.md`, `docs/research/ui-delivery-contract-external-practices-2026-08-22.md`, `docs/research/ui-frontend-simple-workflow-design-2026-08-22.md`, `skills/catalog.yaml`, `skills/reuse-registry.md`, `THIRD_PARTY_NOTICES.md`
- **boundary**：files: `skills/ui-project-init/SKILL.md`, `skills/ui-project-init/skill-bundle.json`, `skills/design-source-readiness/SKILL.md`, `skills/design-source-readiness/skill-bundle.json`, `skills/frontend-component-quality/SKILL.md`, `skills/frontend-component-quality/skill-bundle.json`, `skills/frontend-component-quality/upstream/react-best-practices/AGENTS.md`, `skills/frontend-component-quality/upstream/react-best-practices/LICENSE`, `skills/frontend-component-quality/upstream/react-best-practices/UPSTREAM.md`, `docs/adr/0015-ui-design-source-and-initialization.md`, `docs/adr/0016-external-first-frontend-component-quality.md`, `docs/research/design-md-executable-source-research-2026-08-22.md`, `docs/research/ui-delivery-contract-external-practices-2026-08-22.md`, `docs/research/ui-frontend-simple-workflow-design-2026-08-22.md`, `skills/catalog.yaml`, `skills/reuse-registry.md`, `THIRD_PARTY_NOTICES.md`; symbols/regions: each new skill body, catalog entries and matching provenance records
- **输出**：T001 同一命令 exit 0；三个技能可独立读取；Design.md readiness 不打分不设 gate；Component Quality Map 支持 reuse/modify/extend-state-or-variant/add-local/extract-shared/remove-after-no-consumers；Vercel 只对 React/Next 生效。
- **Knowledge**：P2 只消费稳定 path/bundle；`Design.md` 只存项目版本字符串，不存任务状态或 SHA；React/Next 规则是内部 read-only lens。
- **verification_role**：GREEN
- **paired_task**：T001
- **gate_cmd**：`node --test tests/contract/ui-skill-contract.test.mjs`
- **expected_exit**：0
- **oracle**：`ORACLE-UI-SKILL` — same command passes and negative cases still prove caller cannot downgrade UI, missing source stays unknown, and no stage/gate is created。
- **evidence_path**：`quality/tests/ui-skill-contract.txt`
- **STOP**：需要增加第二 authority、独立运行器、Figma/Storybook/CSS framework 强绑定或没有真实 consumer 时停回 plan。
- **recovery**：删除/修正当前 task 新增的 skill/registry 文件，保留原始决策与研究事实；不创建 replacement task。
- **task risk**：把外部规则复制成第二执行器，或把 `not_approved`/missing Design.md 错误地变成阻塞 gate。
- **test tier / test method**：simple；node contract test + skill closure fixture，无服务。
- **scenarios / commands / expected exit / oracle**：new/legacy init、readiness bindable/not_bindable/unknown、component actions、Vercel applicability、license/source/deletion metadata；同一命令 exit 0，oracle 为 ORACLE-UI-SKILL。
- **fixtures_services**：技能 bundle、catalog YAML、ADR/research Markdown；无服务；无外部 token。
- **coverage limits**：不覆盖 workflow runtime 的实际 invocation、浏览器 route 或真实目标组件。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：新增 `ui-project-init`、`design-source-readiness`、`frontend-component-quality` 三个可搬运 skill/bundle；加入 Vercel MIT pinned guide、ADR/research、catalog/reuse/notice 登记；未改四份材料、runtime、PaperBuilder/F11。
- **executed_commands**：`node --test tests/contract/ui-skill-contract.test.mjs` → exit 0（4/4）；额外 `node runtime/evidence/check-skill-closure.mjs .` → exit 1，既有 wh-review bundle/hash 与 workflowhub-host-protocol 基线缺口保留为事实。
- **evidence_refs**：`[{"kind":"task_record","ref":"quality/tests/ui-skill-contract.txt","sha256":"3546babc73e2282dddfdf60f0cf10cdde486b09003dc05785c3b872105f930d3"},{"kind":"task_record","ref":"quality/tests/ui-skill-contract-green.txt","sha256":"6da6b26dd578b753390a5443f465dcd49f5285814f9be956c2601f3afb4783d6"},{"kind":"task_record","ref":"quality/tests/p1-skill-closure.txt","sha256":"ba1834f6aeee95ba51e005524486821bbcac2b3701711b80a01819962f0cce8b"}]`
- **covered_ac**：AC-UI-001/002/003/004 — skill path/bundle、new/legacy、Read Map、Component Quality Map、Vercel pinned identity、唯一 consumer、no-gate 负例均由 contract test 观察。
- **review_fact**：P1 phase review unavailable；原因与 T001 相同，不能宣称 provider pass。
- **completed_at**：2026-08-22
- **执行事实**：P1 GREEN 合同已通过；skill closure 全仓检查受既有基线事实影响，未掩盖为通过；下一任务 T003。

### Verify

- **Target**：FR-UI-001/002/003/004、AC-UI-001/002/003/004 和 P1 skill closure。
- **gate_cmd**：`node --test tests/contract/ui-skill-contract.test.mjs`
- **expected_exit**：0 after T002; T001 intentionally records non-zero RED。
- **evidence_path**：`quality/tests/ui-skill-contract.txt`
- **Oracle**：ORACLE-UI-SKILL；三个技能路径、bundle、来源、license、唯一 consumer、unknown/no-gate 负例均可观察。

### Knowledge

P2 可读取三个稳定 skill path、bundle 和 pinned Vercel source；技能不负责阶段调度或质量 gate。

### STOP

命令损坏、来源无法核验、范围扩到新阶段/第五材料或发现真实 consumer 不存在时回 `plan.md`。

### Done

T001/T002 的命令、退出码、结果、review 和 finding disposition 由 build-code 记录；build-plan 只设计，不声称测试已执行。

### Risks and rollback

受 PLAN-RISK-001 影响；只回滚 P1 新文件和登记，保留四份材料与质量事实。

## Phase P2 — 五阶段接线与运行时合同

### Goal

把 UI 适用性、初始化、readiness、UI Contract 和 Component Quality Map 接入既有 workflow dependencies、stage content/review contracts 和 verify design alignment，仍不新增阶段、公共命令或 gate。

### Files

- **NEW**：`tests/contract/ui-stage-integration.test.mjs`
- **MODIFY**：`workflows/make-decision/SKILL.md`, `workflows/build-spec/SKILL.md`, `workflows/build-spec/skill-deps.yaml`, `workflows/build-spec/steps.json`, `workflows/build-plan/SKILL.md`, `workflows/build-plan/skill-deps.yaml`, `workflows/build-code/SKILL.md`, `workflows/build-code/skill-deps.yaml`, `workflows/verify-code/SKILL.md`, `workflows/verify-code/skill-deps.yaml`, `workflows/verify-code/design-alignment.mjs`, `runtime/stage/stage-content-contracts.mjs`, `runtime/review/stage-materials.json`
- **DO NOT TOUCH**：`runtime/task/`, public CLI surface, `skills/wh-review` review-controller。

### Tasks

#### T003 — RED：阶段接线和运行时字段合同

- **ID**：T003
- **Phase**：Phase P2 — 五阶段接线与运行时合同
- **goal**：先让阶段接线测试暴露缺少 UI skill ownership、UI Contract fields、review semantics 和 AC namespace compatibility 的事实。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"a2f190950edd9552c4c82347e7cd4023a705d83c4f3c4c9636f8bafb1d14f80c","id":"SPEC"},{"artifact_kind":"plan","ref":"plan.md","hash":"9d3ce5da0cae21ea0123abfcaacc5e047acaf166290e713fa81ae676e1371382","id":"PLAN"}]`
- **source_refs / decision_refs**：`R-001,R-002,R-007,R-008,R-011 → D-001,D-002,D-007,D-011,D-020,D-025,D-030`
- **输入**：T002 skill paths、现有五阶段 manifest/steps、runtime content/review contracts、`design-alignment.mjs`。
- **依赖**：T002
- **并行**：否 — first RED for this behavior
- **FR**：FR-UI-001, FR-UI-003, FR-UI-004, FR-UI-005, FR-UI-006, FR-UI-007, FR-UI-008, FR-UI-009, FR-UI-010, FR-UI-011
- **AC**：AC-UI-001, AC-UI-003, AC-UI-004, AC-UI-005, AC-UI-006, AC-UI-007, AC-UI-008, AC-UI-009, AC-UI-010, AC-UI-011
- **动作**：增加只读合同测试，断言 applicability 明确消费 `raw_requirement`、`project_inventory`、`planned_or_changed_frontend_fact`，按 ui/non_ui/unknown 冲突规则合并、拒绝 caller downgrade，并在 plan/frontend fact 变化后重算；make-decision 只做 applicability，build-spec 按现有 UI step 调 init/readiness → `plan-design-review`，build-plan/code/verify 按条件消费 component quality，runtime/review 只扩充既有字段，且不新增 stage、第五材料、gate 或 review controller。测试覆盖八种状态、preview/confirmation 迁移、design-gap handoff、upstream 未冻结 handoff 和 AC compact/namespaced 解析。
- **精确文件**：`tests/contract/ui-stage-integration.test.mjs`
- **boundary**：files: `tests/contract/ui-stage-integration.test.mjs`; symbols/regions: stage manifest/steps/runtime contract assertions only
- **输出**：RED 输出缺少的 skill dependency、trigger、UI fields、review semantics 或 AC namespace 支持。
- **Knowledge**：build-plan 不能执行 frontend-testing；实际前端测试仍属于 build-code，verify 只消费代码和事实。
- **verification_role**：RED
- **paired_task**：T004
- **gate_cmd**：`node --test tests/contract/ui-stage-integration.test.mjs`
- **expected_exit**：1
- **oracle**：`ORACLE-UI-STAGE` — 阶段接线或内容合同缺失时命令非零，失败带精确 manifest/path/symbol。
- **evidence_path**：`quality/tests/ui-stage-integration.txt`
- **STOP**：测试需要新公共入口、第五材料、独立 UI 状态机或发现 UI skill 被多个 authority 同时消费时停回 plan。
- **recovery**：保留 RED 事实，缩窄测试到现有 consumer 或回 build-spec/build-plan owning material，不改当前 spec。
- **task risk**：只查 manifest 文件名而不查 trigger、owner、no-gate、Read Map → `plan-design-review` 顺序、真实 verify consumer 或 applicability 重算。
- **test tier / test method**：feature；读取 JSON/YAML/Markdown 和 runtime exported validators，不启动目标服务。
- **scenarios / commands / expected exit / oracle**：non-ui skip；三类 applicability 输入的 ui/non_ui/unknown merge；caller downgrade negative；plan/frontend change re-evaluation；upstream not frozen/conflict → unknown + make-decision handoff；ui init/readiness → `plan-design-review`；missing/unknown design；default/loading/empty/error/permission/boundary/narrow/race；preview unavailable/cancel/not-returned/version mismatch；approved/acknowledged/not_approved；component quality conditional；canonical `AC-UI-001`…`AC-UI-011` 与 legacy compact fixture 的 parser compatibility；no new stage/gate；同一命令 exit 1 RED，oracle ORACLE-UI-STAGE。
- **fixtures_services**：临时 stage manifest/Markdown/JSON fixture；无服务；结束清理临时目录。
- **coverage limits**：覆盖 WorkflowHub 接线和字段合同，不证明 skill 内容的视觉质量或浏览器行为。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：新增 P2 阶段接线合同测试；仅测试文件变更，未改生产实现。
- **executed_commands**：`node --test tests/contract/ui-stage-integration.test.mjs` → exit 1（RED）；输出见 `quality/tests/ui-stage-integration-red.txt`。
- **evidence_refs**：`[{"kind":"task_record","ref":"quality/tests/ui-stage-integration-red.txt","sha256":"7d9ce12ceaa1c1e320bae7ea0583309d51a3593711492ba19a0007457656f440"}]`
- **covered_ac**：AC-UI-001/003/004/005/006/007/008/009/010/011 — RED 真实暴露 verify consumer、stage wiring、review fields 和 AC parser 缺口。
- **review_fact**：P2 phase review unavailable；未产生可裁决 provider findings。
- **completed_at**：2026-08-22
- **执行事实**：RED 首次执行因 verify-code UI consumer export 与阶段/runtime 合同缺失而失败；未执行目标服务或浏览器。

#### T004 — GREEN：接入五阶段和内容合同

- **ID**：T004
- **Phase**：Phase P2 — 五阶段接线与运行时合同
- **goal**：接入 init/readiness/component-quality 和 UI 字段合同，使 T003 GREEN，保持原有五阶段和四材料边界。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"a2f190950edd9552c4c82347e7cd4023a705d83c4f3c4c9636f8bafb1d14f80c","id":"SPEC"},{"artifact_kind":"plan","ref":"plan.md","hash":"9d3ce5da0cae21ea0123abfcaacc5e047acaf166290e713fa81ae676e1371382","id":"PLAN"}]`
- **source_refs / decision_refs**：`R-001,R-002,R-007,R-008,R-011 → D-001,D-002,D-007,D-011,D-020,D-025,D-030`
- **输入**：T003 的失败断言、P1 skill contracts、现有 workflow steps 和 runtime validators。
- **依赖**：T003
- **并行**：否 — RED/GREEN 必须串行
- **FR**：FR-UI-001, FR-UI-003, FR-UI-004, FR-UI-005, FR-UI-006, FR-UI-007, FR-UI-008, FR-UI-009, FR-UI-010, FR-UI-011
- **AC**：AC-UI-001, AC-UI-003, AC-UI-004, AC-UI-005, AC-UI-006, AC-UI-007, AC-UI-008, AC-UI-009, AC-UI-010, AC-UI-011
- **动作**：更新 make-decision/build-spec/build-plan/build-code/verify-code SKILL 与 dependency/steps；在 `stage-content-contracts.mjs` 接受 UI fields、状态八字段和 compact/namespaced AC IDs；在 `stage-materials.json` 补 UI semantic fields；让 `design-alignment.mjs` 读取 UI Contract、Component Quality Map、真实 consumer 和限制，不产生新 authority。`design-source-readiness` 的 Read Map 作为既有 `plan-design-review` 的输入，合同测试锁定调用顺序、唯一 consumer 和 re-evaluation；UI Contract 保存 design-gap handoff 字段。
- **精确文件**：`workflows/make-decision/SKILL.md`, `workflows/build-spec/SKILL.md`, `workflows/build-spec/skill-deps.yaml`, `workflows/build-spec/steps.json`, `workflows/build-plan/SKILL.md`, `workflows/build-plan/skill-deps.yaml`, `workflows/build-code/SKILL.md`, `workflows/build-code/skill-deps.yaml`, `workflows/verify-code/SKILL.md`, `workflows/verify-code/skill-deps.yaml`, `workflows/verify-code/design-alignment.mjs`, `runtime/stage/stage-content-contracts.mjs`, `runtime/review/stage-materials.json`
- **boundary**：files: `workflows/make-decision/SKILL.md`, `workflows/build-spec/SKILL.md`, `workflows/build-spec/skill-deps.yaml`, `workflows/build-spec/steps.json`, `workflows/build-plan/SKILL.md`, `workflows/build-plan/skill-deps.yaml`, `workflows/build-code/SKILL.md`, `workflows/build-code/skill-deps.yaml`, `workflows/verify-code/SKILL.md`, `workflows/verify-code/skill-deps.yaml`, `workflows/verify-code/design-alignment.mjs`, `runtime/stage/stage-content-contracts.mjs`, `runtime/review/stage-materials.json`; symbols/regions: UI applicability/readiness/quality dependency rows, UI Contract validators, review semantic fields and design alignment projection
- **输出**：T003 同一命令 exit 0；build-spec UI 分支先读取 init/readiness；build-plan 只设计 Component Quality Map；build-code 才调用 frontend-testing；verify 沿真实 consumer 检查；缺设计/浏览器/consumer 写 unknown/unavailable/N/A，不阻止同任务。
- **Knowledge**：P3 可修改模板和 browser/testing 文档；没有 UI route 时 browser evidence 为 N/A — reason，不伪造截图。
- **verification_role**：GREEN
- **paired_task**：T003
- **gate_cmd**：`node --test tests/contract/ui-stage-integration.test.mjs`
- **expected_exit**：0
- **oracle**：`ORACLE-UI-STAGE` — same command passes, all UI skill triggers have a single owner, four materials remain authority, canonical AC IDs and the explicitly scoped legacy fixture are accepted without a new control plane。
- **evidence_path**：`quality/tests/ui-stage-integration.txt`
- **STOP**：实现需要 runtime 状态机、公共命令、第五材料、独立 evidence store 或把 no-design 变成 gate 时回 plan/decision-log。
- **recovery**：只回滚本 task 的 manifest/runtime/review changes；保留 P1 skills 和原 review facts。
- **task risk**：UI skill 接线成功但实际 stage skill invocation/closure、Read Map → `plan-design-review` consumer、行为负例或 re-evaluation 测试未同步，未来会出现 silent skip。
- **test tier / test method**：feature；node contract tests + existing stage closure/routing suites selected in build-code。
- **scenarios / commands / expected exit / oracle**：same scenarios as T003；额外验证 Read Map → `plan-design-review` invocation order 和真实 consumer；exit 0 GREEN；oracle ORACLE-UI-STAGE。
- **fixtures_services**：workflow YAML/JSON and Markdown fixtures; no service; cleanup temporary files.
- **coverage limits**：不执行目标前端、浏览器、React/Next 性能或视觉比较。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：接入 make-decision/build-spec/build-plan/build-code/verify-code 的 UI 依赖与文档；扩展 build-spec steps、stage content validators、review surfaces 和 verify design alignment；保持五阶段、四材料和 no-gate 边界。
- **executed_commands**：`node --test tests/contract/ui-stage-integration.test.mjs` → exit 0（6/6）；证据见 `quality/tests/ui-stage-integration.txt`、`quality/tests/ui-stage-integration-green.txt`。JSON/YAML parse 和 `git diff --check` 通过。
- **evidence_refs**：`[{"kind":"task_record","ref":"quality/tests/ui-stage-integration.txt","sha256":"d6dd137b057d21d054e8294be5168e2763c35612e7137d81df7dce8c454b5dac"},{"kind":"task_record","ref":"quality/tests/ui-stage-integration-green.txt","sha256":"d557551f28081221f76aa1c7f92210a5ebd51503fb9f7405c4e2ad05638bd19b"}]`
- **covered_ac**：AC-UI-001/003/004/005/006/007/008/009/010/011 — UI applicability、Read Map 顺序、Component Quality Map owner、review fields、AC namespace compatibility、design-gap continuation 均可观察。
- **review_fact**：P2 phase review unavailable；未产生可裁决 provider findings。
- **completed_at**：2026-08-22
- **执行事实**：阶段接线合同 GREEN；缺设计/preview/consumer 仍是 unknown/unavailable/N/A 事实，不是推进 gate；未执行目标产品浏览器。
- **后续实现补强事实**：当前运行时已提供 `buildUiProjectInitFact`、`deriveDesignSourceReadiness`、`buildShortUiDesignPrompt` 和 `validateUiDesignLoopFact`；`ui-stage-integration.test.mjs` 当前 10/10 通过，覆盖 new/legacy、Read Map、短提示词、preview、取消、未返回、版本不匹配和人工确认。该补强没有新增 stage、材料或 gate。

### Verify

- **Target**：FR-UI-001/003/004/005/006/007/008/009/010/011、AC-UI-001/003/004/005/006/007/008/009/010/011、无新 stage/gate。
- **gate_cmd**：`node --test tests/contract/ui-stage-integration.test.mjs`
- **expected_exit**：0 after T004; T003 intentionally records non-zero RED。
- **evidence_path**：`quality/tests/ui-stage-integration.txt`
- **Oracle**：ORACLE-UI-STAGE；现有五阶段、技能 owner、UI fields、review fields、AC namespace compatibility 和 verify consumer 可观察。

### Knowledge

P3 只需扩展既有 plan/tasks/browser QA 事实；build-plan 设计测试而不执行 frontend-testing。

### STOP

新增控制面、第五材料、公共入口、强制 gate 或 parser 语义无法保持向后兼容时回 owning material。

### Done

T003/T004 的真实测试、逐条 finding disposition 和阶段事实由 build-code 记录；当前 build-plan 不伪造 GREEN。

### Risks and rollback

受 PLAN-RISK-001/002 影响；回滚仅限 P2 manifest/runtime/review 文件。

## Phase P3 — 计划模板、前端 QA 与治理闭合

### Goal

让每个 UI plan phase/task 明确组件动作、状态/ViewModel/CSS/token、fixture/viewport、browser/a11y/perf、截图和限制；扩展现有 browser-qa payload，使 blocked/unknown 能在保留失败原因时没有截图，并以真实合同/治理测试完成闭合。

### Files

- **NEW**：`tests/contract/ui-frontend-governance.test.mjs`
- **MODIFY**：`skills/spec-plan/templates/plan-template.md`, `skills/spec-tasks/templates/tasks-template.md`, `skills/frontend-testing/SKILL.md`, `skills/isolated-browser-qa/SKILL.md`, `runtime/schemas/browser-qa-evidence.v1.json`, `skills/catalog.yaml`, `docs/architecture/move-map.json`, `docs/architecture/repository-inventory.tsv`, `skills/reuse-registry.md`, `CONTEXT.md`, `THIRD_PARTY_NOTICES.md`
- **DO NOT TOUCH**：`specs/ui-frontend-delivery-contract/decision-log.md`, `spec.md`；不把模板字段写回 Design.md。

### Tasks

#### T005 — RED：计划、测试、浏览器和治理闭合合同

- **ID**：T005
- **Phase**：Phase P3 — 计划模板、前端 QA 与治理闭合
- **goal**：先让治理合同测试暴露缺少 UI phase/task 字段、browser blocked/unknown 原因和目录登记的事实。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"a2f190950edd9552c4c82347e7cd4023a705d83c4f3c4c9636f8bafb1d14f80c","id":"SPEC"},{"artifact_kind":"plan","ref":"plan.md","hash":"9d3ce5da0cae21ea0123abfcaacc5e047acaf166290e713fa81ae676e1371382","id":"PLAN"}]`
- **source_refs / decision_refs**：`R-002,R-008,R-011 → D-009,D-010,D-020,D-021,D-022,D-023,D-024,D-030`
- **输入**：T004 的 UI fields、现有 plan/tasks templates、frontend-testing、isolated-browser-qa 和 browser-qa schema。
- **依赖**：T004
- **并行**：否 — first RED for this behavior
- **FR**：FR-UI-002, FR-UI-006, FR-UI-007, FR-UI-008, FR-UI-009, FR-UI-010, FR-UI-011
- **AC**：AC-UI-002, AC-UI-006, AC-UI-007, AC-UI-008, AC-UI-009, AC-UI-010, AC-UI-011
- **动作**：增加合同测试，断言每个 UI phase/task 有 component action、consumer、state owner、typed ViewModel、CSS/token owner、fixture、viewport、browser/a11y/perf、screenshot、coverage limits 和 N/A/unknown 原因；design-gap handoff 有 `design_status`、`missing_items`/reason、`fallback_visual_basis`、`constraints`、`assumptions`、`rework_risk`、`human_confirmation`、`current_material_ref` 及 preview/fixture/viewport/screenshot/version refs；browser-qa blocked/unknown 有失败原因且不被当 pass；组件/CSS negative fixtures 拒绝 duplicate、无 consumer 删除、少于两个 consumer 抽取、缺 state owner、CSS 泄漏、global override、`!important`；move-map/catalog/reuse/inventory 有 owner/consumer/deletion 记录。
- **精确文件**：`tests/contract/ui-frontend-governance.test.mjs`
- **boundary**：files: `tests/contract/ui-frontend-governance.test.mjs`; symbols/regions: template/schema/governance assertions only
- **输出**：RED 输出精确缺失字段、schema contradiction 或治理登记缺口。
- **Knowledge**：模板是 plan/tasks 的设计合同；浏览器真实执行留 build-code/verify-code；截图是观察事实，不是质量结论。
- **verification_role**：RED
- **paired_task**：T006
- **gate_cmd**：`node --test tests/contract/ui-frontend-governance.test.mjs`
- **expected_exit**：1
- **oracle**：`ORACLE-UI-GOV` — 缺字段或错误 gate 语义时命令非零，明确指出 path/field/schema。
- **evidence_path**：`quality/tests/ui-frontend-governance.txt`
- **STOP**：测试要求新增 UI evidence store、强制截图/浏览器 gate、全仓迁移或 CSS 数值阈值时停回 plan。
- **recovery**：保留 RED 输出，缩窄到现有 schema/模板和治理 consumer；不修改四份当前材料。
- **task risk**：只检查字段名字，没检查每个 UI phase 都有测试和截图交接、design-gap handoff、组件/CSS breaking negative cases 或 blocked/unknown 的真实性。
- **test tier / test method**：feature；node contract tests + AJV schema fixtures，无目标服务。
- **scenarios / commands / expected exit / oracle**：UI phase state/action/consumer map complete/incomplete；八种状态和竞态/a11y/responsive positive/negative fixtures；design-gap complete/missing fields；duplicate/no-consumer/<2-consumer/missing-owner/CSS-leak/global-override/`!important` negative cases；browser pass/fail/blocked/unknown with zero/one screenshots；catalog/inventory closure；exit 1 RED，oracle ORACLE-UI-GOV。
- **fixtures_services**：临时 Markdown/task cards、AJV JSON fixtures、治理 YAML/TSV；无服务；测试后清理。
- **coverage limits**：不证明真实页面布局、字体、颜色、浏览器引擎或业务 API。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：新增 P3 模板、浏览器/前端治理合同测试；只读验证缺失字段与治理登记，不改生产实现。
- **executed_commands**：`node --test tests/contract/ui-frontend-governance.test.mjs` → exit 1（RED）；输出见 `quality/tests/ui-frontend-governance-red.txt`。
- **evidence_refs**：`[{"kind":"task_record","ref":"quality/tests/ui-frontend-governance-red.txt","sha256":"cad7f9afd6648c7969318911596453b4741309be5b6dfa88dbc11aa10e021533"}]`
- **covered_ac**：AC-UI-002/006/007/008/009/010/011 — RED 真实暴露模板、browser schema 和 owner/consumer/delete 登记缺口。
- **review_fact**：P3 phase review unavailable；未产生可裁决 provider findings。
- **completed_at**：2026-08-22
- **执行事实**：RED 暴露 UI phase/task 字段、blocked/unknown 原因和治理闭合缺口；未执行目标服务或浏览器。

#### T006 — GREEN：模板、浏览器证据和治理登记

- **ID**：T006
- **Phase**：Phase P3 — 计划模板、前端 QA 与治理闭合
- **goal**：补齐 UI plan/task 字段、frontend/browser QA 交接、browser-qa schema 和架构治理，使 T005 GREEN。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"a2f190950edd9552c4c82347e7cd4023a705d83c4f3c4c9636f8bafb1d14f80c","id":"SPEC"},{"artifact_kind":"plan","ref":"plan.md","hash":"9d3ce5da0cae21ea0123abfcaacc5e047acaf166290e713fa81ae676e1371382","id":"PLAN"}]`
- **source_refs / decision_refs**：`R-002,R-008,R-011 → D-009,D-010,D-020,D-021,D-022,D-023,D-024,D-030`
- **输入**：T005 的失败断言、T004 的 UI Contract fields、现有 browser evidence envelope 和治理文件格式。
- **依赖**：T005
- **并行**：否 — RED/GREEN 必须串行
- **FR**：FR-UI-002, FR-UI-006, FR-UI-007, FR-UI-008, FR-UI-009, FR-UI-010, FR-UI-011
- **AC**：AC-UI-002, AC-UI-006, AC-UI-007, AC-UI-008, AC-UI-009, AC-UI-010, AC-UI-011
- **动作**：更新 plan/tasks templates 让 UI phase/task 可执行；加入完整 design-gap handoff 字段和当前材料/Design.md 版本引用；更新 frontend-testing/isolated-browser-qa 说明状态、交互、keyboard/a11y、viewport、fixture、截图和 cleanup；扩展 browser-qa schema 的 state/viewport/fixture/design_revision/visual/a11y 和 failure_reason 语义，pass/fail 仍按测试结果，blocked/unknown 可零截图但必须有原因；加入组件/CSS breaking negative oracles；登记 move-map/inventory/reuse/catalog/context/third-party。
- **精确文件**：`skills/spec-plan/templates/plan-template.md`, `skills/spec-tasks/templates/tasks-template.md`, `skills/frontend-testing/SKILL.md`, `skills/isolated-browser-qa/SKILL.md`, `runtime/schemas/browser-qa-evidence.v1.json`, `skills/catalog.yaml`, `docs/architecture/move-map.json`, `docs/architecture/repository-inventory.tsv`, `skills/reuse-registry.md`, `CONTEXT.md`, `THIRD_PARTY_NOTICES.md`
- **boundary**：files: `skills/spec-plan/templates/plan-template.md`, `skills/spec-tasks/templates/tasks-template.md`, `skills/frontend-testing/SKILL.md`, `skills/isolated-browser-qa/SKILL.md`, `runtime/schemas/browser-qa-evidence.v1.json`, `skills/catalog.yaml`, `docs/architecture/move-map.json`, `docs/architecture/repository-inventory.tsv`, `skills/reuse-registry.md`, `CONTEXT.md`, `THIRD_PARTY_NOTICES.md`; symbols/regions: UI fields in templates/skills, browser-qa uiRun schema, matching governance rows
- **输出**：T005 同一命令 exit 0；未来每个 UI phase 都能读到测试/截图 handoff；browser pass/fail/blocked/unknown 语义互斥且缺失原因显式；治理目录可回放。
- **Knowledge**：目标项目没有 route 时使用 `browser_qa: not_applicable` 并说明原因；真实 UI 任务不得用 not_applicable 掩盖 blocked/unknown。
- **verification_role**：GREEN
- **paired_task**：T005
- **gate_cmd**：`node --test tests/contract/ui-frontend-governance.test.mjs`
- **expected_exit**：0
- **oracle**：`ORACLE-UI-GOV` — same command passes, complete UI task cards are executable, browser negative results retain reasons, and governance closure has a single source.
- **evidence_path**：`quality/tests/ui-frontend-governance.txt`
- **STOP**：实现需要新 schema envelope、截图质量 gate、Design.md hash 或非 React 项目强制 Vercel 时回 plan。
- **recovery**：只回滚 P3 模板/schema/governance 文件；保留 P1/P2 skill and stage facts。
- **task risk**：把 `design_revision` 写成 SHA-256，漏掉 design-gap handoff 或组件/CSS breaking negative，或允许 unknown/blocked 空原因导致假绿。
- **test tier / test method**：feature；node contract + AJV negative/positive fixtures，必要时运行 skill closure。
- **scenarios / commands / expected exit / oracle**：same T005 scenarios；真实浏览器/a11y/视觉选择若只能人工判断，标记 manual/unknown/unavailable，不从合同测试绿色推导视觉通过；exit 0 GREEN；oracle ORACLE-UI-GOV。
- **fixtures_services**：AJV payload fixtures、plan/task fragments、catalog/move-map rows；无服务；临时文件清理。
- **coverage limits**：不执行目标页面视觉、真实浏览器 engine 或前端性能命令。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：补齐 plan/tasks UI handoff 字段、frontend/browser QA 失败语义、browser evidence schema 和 move-map/inventory/catalog/reuse/context/notice 登记。
- **executed_commands**：`node --test tests/contract/ui-frontend-governance.test.mjs` → exit 0（4/4）；证据见 `quality/tests/ui-frontend-governance.txt`、`quality/tests/ui-frontend-governance-green.txt`。
- **evidence_refs**：`[{"kind":"task_record","ref":"quality/tests/ui-frontend-governance.txt","sha256":"c710b42a46c2b4373148c7b4898f678078c75862c384016ca6979e042885f577"},{"kind":"task_record","ref":"quality/tests/ui-frontend-governance-green.txt","sha256":"4b79921010844117add8ad28d453d1170e536a61f27e8089792554145f3568e0"}]`
- **covered_ac**：AC-UI-002/006/007/008/009/010/011 — UI phase/task fields、Design.md version/no-hash、browser pass/fail/blocked/unknown、组件/CSS negative 和治理 closure 均可观察。
- **review_fact**：P3 phase review unavailable；未产生可裁决 provider findings。
- **completed_at**：2026-08-22
- **执行事实**：治理合同 GREEN；blocked/unknown 可零截图但必须有 failure_reason，pass/fail 保持真实退出码和截图约束；无目标 route 时仍写 N/A + reason。
- **后续实现补强事实**：`frontend-component-quality` 新增可执行静态检查，当前 focused test 4/4 通过；它发现 duplicate component/selector、global override、`!important`、CSS scope leak 和缺少静态输入，仍不替代浏览器、a11y 或运行时测试。

#### T007 — FINAL：aggregate verification

- **ID**：T007
- **Phase**：Phase P3 — 计划模板、前端 QA 与治理闭合
- **goal**：按 plan.md 预先设计的最终路线验证全部适用 FR/AC、三个技能、五阶段接线、UI fields、browser schema、治理 closure 和 deferred/open handoff。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"a2f190950edd9552c4c82347e7cd4023a705d83c4f3c4c9636f8bafb1d14f80c","id":"SPEC"},{"artifact_kind":"plan","ref":"plan.md","hash":"9d3ce5da0cae21ea0123abfcaacc5e047acaf166290e713fa81ae676e1371382","id":"PLAN"}]`
- **source_refs / decision_refs**：`R-001,R-002,R-003,R-004,R-005,R-006,R-007,R-008,R-009,R-010,R-011 → D-001,D-002,D-003,D-004,D-005,D-006,D-007,D-008,D-009,D-010,D-011,D-012,D-013,D-014,D-015,D-016,D-017,D-018,D-019,D-020,D-021,D-022,D-023,D-024,D-025,D-026,D-027,D-028,D-029,D-030`
- **输入**：T001–T006 的真实结果、当前四材料、review/spec-analyze facts 和最终合同测试命令。
- **依赖**：T006
- **并行**：否 — aggregate reads all preceding task facts
- **FR**：FR-UI-001, FR-UI-002, FR-UI-003, FR-UI-004, FR-UI-005, FR-UI-006, FR-UI-007, FR-UI-008, FR-UI-009, FR-UI-010, FR-UI-011
- **AC**：AC-UI-001, AC-UI-002, AC-UI-003, AC-UI-004, AC-UI-005, AC-UI-006, AC-UI-007, AC-UI-008, AC-UI-009, AC-UI-010, AC-UI-011
- **动作**：只执行一次完整合同聚合并记录真实退出码、oracle、覆盖范围、未知项和 deferred/open 风险；不创建新状态权威，不重新运行普通 review。
- **精确文件**：`tests/contract/ui-frontend-governance.test.mjs`
- **boundary**：files: `tests/contract/ui-frontend-governance.test.mjs`; symbols/regions: final aggregate command and evidence writer only
- **输出**：最终三合同测试输出、逐 FR/AC 覆盖、task oracle/dependency facts、design-gap/unknown/manual 限制、DEFER-001 与 OPEN-UI-001 handoff 和 coverage limits。
- **Knowledge**：此 aggregate 只证明 WorkflowHub 交付契约闭合，不证明任何具体产品页面好看或浏览器通过。
- **verification_role**：N/A — non-behavior aggregate verification
- **paired_task**：N/A — aggregate has no RED/GREEN pair
- **gate_cmd**：`node --test tests/contract/ui-skill-contract.test.mjs tests/contract/ui-stage-integration.test.mjs tests/contract/ui-frontend-governance.test.mjs`
- **expected_exit**：0
- **oracle**：`ORACLE-UI-FINAL` — 三合同测试 exit 0；所有当前 FR/AC、task IDs、oracles、deferred/open owner/trigger/handoff/close 条件可回放；无第五材料、公共 UI gate 或第二 authority。
- **evidence_path**：`quality/tests/ui-frontend-final.txt`
- **STOP**：命令失败、AC/FR/task oracle 缺失、当前快照越界或需要新设计时回受影响 task，不以全量重跑掩盖局部失败。
- **recovery**：记录原始聚合输出，回到受影响的 T002/T004/T006；不修改已冻结 decision/spec。
- **task risk**：把合同测试绿色误报为具体页面质量通过，漏掉组件/CSS negative fixture，或把 unknown/unavailable/manual 清零。
- **test tier / test method**：fullstack；聚合 skill、workflow、runtime、schema、template 和 governance contracts。
- **scenarios / commands / expected exit / oracle**：全部 P1/P2/P3 场景和 negative facts；同一命令 exit 0；oracle ORACLE-UI-FINAL。
- **fixtures_services**：合同测试自有 Markdown/YAML/JSON fixtures；无目标服务；临时目录清理完毕。
- **coverage limits**：不覆盖 PaperBuilder/F11、真实产品页面、浏览器 engine、视觉 baseline、业务 API 或性能阈值。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：执行一次 P1/P2/P3 合同聚合；根据最终跨阶段审查修复 UI 状态矩阵、设计确认/版本、真实消费者、删除证据和 Story/test 更新约束；未新增状态权威、阶段或材料。
- **executed_commands**：最终聚合 → exit 0（16/16）；第一次 final integration 修复后 focused contract → exit 0（15/15）；topic-change 修复后 focused contract → exit 0（16/16），证据见 `quality/tests/ui-frontend-final.txt`、`quality/tests/build-code-review-repair.txt`。
- **evidence_refs**：`[{"kind":"task_record","ref":"quality/tests/ui-frontend-final.txt","sha256":"1825d106fa5656ea30616c95a762cc18fb726738ecd5e712ed9536a05ffc0e34"},{"kind":"task_record","ref":"quality/tests/build-code-review-repair.txt","sha256":"c592c6f055d095960ddec0212042eb86fccaaba99fb9600db765a14a3564f3b2"},{"kind":"task_record","ref":"quality/reviews/final-integration-disposition.txt","sha256":"4ba35cf6e1c3f5b532690cc0dc199fda7e0487f85af7af8fe2d252b2534587c0"},{"kind":"task_record","ref":"quality/tests/build-plan-material-repair.txt","sha256":"e868506f1b7d205d380365ad76adaef97c88441dcbf49d68c8792a05f73a6b7c"}]`
- **covered_ac**：AC-UI-001…AC-UI-011 — 当前 FR/AC、技能来源闭包、五阶段接线、UI fields、browser schema、治理和 deferred/open handoff 可回放。
- **review_fact**：最终 integration review available（2/1 异源 reviewer）；首轮 4 个有效 major finding 已 fixed，3 个 invalid-anchor finding rejected_invalid，1 个 minor finding accepted_risk；topic-change focused review `quality/reviews/reports/ab5a4c3b-547b-4861-a444-152be0af8ab0.md` 返回 8 个有效 major finding，均已修复并通过 16/16 focused test；未启动第三次 build-code review，P1/P2/P3 phase review unavailable 仍保留为事实。
- **completed_at**：2026-08-22
- **执行事实**：最终合同聚合和审查修复测试通过；review 修复只收紧现有 UI 合同，不证明具体产品页面视觉质量、浏览器引擎、业务 API 或性能。下一步进入 verify-code。
- **verify-code 收尾事实**：更新新增 UI skill 依赖的既有测试期望并刷新 stale bundle identities 后，相关回归 56/56 通过，`node runtime/evidence/check-skill-closure.mjs .` exit 0；未启动第三轮 provider review，仍不宣称具体产品页面视觉通过。
- **最终补强事实**：审计发现并补齐了 build-spec UI 设计回路的可执行函数、UI Contract 的 page/state 必填字段和 Component Quality Map 的 component 必填字段；当前 UI aggregate 18/18、static quality 4/4、design-loop 10/10、受影响回归 56/56，syntax/diff/closure 全部通过。异源报告未因该补强重跑，freshness 限制和无真实产品 route/browser 事实保持不变。

### Verify

- **Target**：全部适用 FR/AC、跨阶段 seam、依赖图、UI skill provenance、browser negative semantics 和 deferred/open handoff。
- **gate_cmd**：`node --test tests/contract/ui-skill-contract.test.mjs tests/contract/ui-stage-integration.test.mjs tests/contract/ui-frontend-governance.test.mjs`
- **expected_exit**：0 after T007。
- **evidence_path**：`quality/tests/ui-frontend-final.txt`
- **Oracle**：ORACLE-UI-FINAL；三组合同测试、当前材料引用和限制可回放。

### Knowledge

后续真实 UI task 按 `make-decision → build-spec → build-plan → build-code → verify-code` 使用这些合同；目标项目无 route 时只能记录 N/A/unknown，不伪造 browser pass。

### STOP

最终命令损坏、发现材料 owner 变化或需要新控制面时回 owning material，不把质量事实改成推进 gate。

### Done

T007 由 build-code 在最终快照执行；build-plan 只保留命令、oracle、证据路径和 coverage limits 设计。

### Risks and rollback

受 PLAN-RISK-002/003 影响；回滚到最后一个有真实 consumer 的 P1/P2 边界，保留原始失败事实。

## 4. Final current-snapshot aggregate strategy

- **tier / method**：fullstack；使用现有合同测试、spec-analyze packet validation 和适用时的 frontend-testing/isolated-browser-qa 事实；本功能本身不执行目标项目浏览器。
- **scenarios**：UI applicability 不能被 caller 降级；new/legacy 初始化；Design.md 缺失/版本变化；Screen Read Map 缺项；preview ready/unavailable、短提示词、approved/acknowledged/not_approved；组件复用/修改/增状态/新增局部/共享抽取/删除；真实 consumer/CSS/token/ViewModel；每个 UI phase 测试和截图交接；browser blocked/unknown 失败原因；deferred/open handoff。
- **command**：`node --test tests/contract/ui-skill-contract.test.mjs tests/contract/ui-stage-integration.test.mjs tests/contract/ui-frontend-governance.test.mjs`
- **expected exit**：0
- **oracle**：ORACLE-UI-FINAL；三个 skill 可解析、五阶段接线可核验、模板/任务 UI fields 可执行、browser negative facts 不被伪造、全部当前 FR/AC 与 task oracle 有绑定。
- **fixtures_services**：N/A — reason：WorkflowHub contract feature 不启动目标产品服务；测试使用仓库 fixture 和临时 JSON/Markdown，结束后删除临时目录。
- **evidence_path**：`quality/tests/ui-frontend-final.txt`
- **coverage limits**：覆盖 WorkflowHub skill/manifest/runtime/template/schema 合同；不证明任何具体产品页面的视觉审美、浏览器性能或真实业务 API。
- **STOP**：命令损坏、AC/FR/task oracle 缺失、当前快照越界、发现需要新设计或外部来源无法核验时返回 owning material。
- **execution_contract**：当前快照运行一次；失败保留原始输出，回受影响 task，不用全量重跑掩盖局部失败。

## Dependency Graph

- **order**：T001 (RED) → T002 (GREEN) → T003 (RED) → T004 (GREEN) → T005 (RED) → T006 (GREEN) → T007 (FINAL)

```text
T001 (RED) → T002 (GREEN) → T003 (RED) → T004 (GREEN) → T005 (RED) → T006 (GREEN) → T007 (FINAL)
```

## Final Boundary Check

- [x] 每个 Phase 的 Goal、Files、Tasks、Verify、Knowledge、STOP、Done、Risks and rollback 完整。
- [x] 每个任务只有一张卡和一个完成区；文件属于所属 Phase NEW/MODIFY。
- [x] 每个行为变化都有同命令、同 oracle 的 RED → GREEN；FINAL 只做一次聚合。
- [x] 依赖无环，FR/AC 双向追溯闭合，unknown/unavailable/N/A 都有原因。
- [x] review、test、evidence 只作为事实记录，不是开始、继续或交付许可证。

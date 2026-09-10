# 任务清单：build-prd portable workflow

- **Input**：`specs/workflowhub-build-prd/decision-log.md@92caba276e86f9cb95220bfe5f0ef176b6dbc7db1e35152ce8718014c45e1600`、`specs/workflowhub-build-prd/spec.md@44705bd9ba58d45f917840f1e173f67d80d7fa1c4c291337ff4885bf2bbf689c`、`specs/workflowhub-build-prd/plan.md@a6620acd7aacdadbd13e99d9b881084b6aa2696b7828083939116ee4b19afe6c`
- **Template version**：`plan-task.v4`
- **Status**：正式 build-plan 任务材料；所有卡 pending，未执行测试、实现、Git 或物理动作。

## Phase P1 — Portable 发现、编排与分发闭包

### Goal
build-prd 可由现有 registry/catalog/release 发现并携带完整依赖闭包，同时 formal stage 仍恰好五个且 workflow 只编排不写正式长文。

### Files
- **NEW**：`workflows/build-prd/SKILL.md`, `workflows/build-prd/skill-deps.yaml`, `workflows/build-prd/steps.json`
- **MODIFY**：`config/workflowhub.yaml`, `skills/catalog.yaml`, `skills/reuse-registry.md`, `repo-skills.manifest.json`, `runtime/evidence/check-skill-closure.mjs`, `runtime/distribution/skill-bundle-release.mjs`, `tests/integration/distribution-closure.test.mjs`, `docs/architecture/move-map.json`
- **DO NOT TOUCH**：canonical `STAGES`/`FORMAL_STAGES` 与 `runtime/task/material-workspace.mjs`; 禁止把 build-prd 当第六 stage 或把 prd 加入四材料。

### Tasks

#### T001 — RED：portable workflow 发现与五阶段保护
- **ID**：T001
- **Phase**：Phase P1 — Portable 发现、编排与分发闭包
- **goal**：用失败断言固定 build-prd 可发现/可分发/薄编排且 canonical stages 与四材料不变。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-build-prd/spec.md","hash":"44705bd9ba58d45f917840f1e173f67d80d7fa1c4c291337ff4885bf2bbf689c","id":"SPEC-workflowhub-build-prd"},{"artifact_kind":"plan","ref":"specs/workflowhub-build-prd/plan.md","hash":"efbfd46bf3e91b8afe59552413714bbd1ce90c783f8ce754b945619e605efb32","id":"PLAN-workflowhub-build-prd"}]`
- **source_refs / decision_refs**：R1/R2/R3/R7/R8/R10/R11/R14; D1/D2/D4/D7/D22/D23/D37/D39/D40/D42/D44/D46/D47/D50 → FR-INTENT-001, FR-INTENT-002, FR-INTENT-003, FR-ORCH-001, FR-ORCH-002, FR-ORCH-003, FR-PORT-001, FR-DELIVERY-001; AC-PRD-001, AC-PRD-004, AC-PRD-007, AC-PRD-009, AC-PRD-010
- **输入**：当前 decision/spec/plan 草案与现有 registry/catalog/closure/release fixture。
- **依赖**：none
- **并行**：否 — 首个 RED，先冻结 portable/formal 分型。
- **FR**：FR-INTENT-001, FR-INTENT-002, FR-INTENT-003, FR-ORCH-001, FR-ORCH-002, FR-ORCH-003, FR-PORT-001, FR-DELIVERY-001
- **AC**：AC-PRD-001, AC-PRD-004, AC-PRD-007, AC-PRD-009, AC-PRD-010
- **动作**：仅在既有 distribution targeted test 增加 registry discovery、workflow三件套、spec-prd闭包、formal stage=5、CURRENT_MATERIAL_FILES=4、缺输入/第六stage负例；不改生产实现。
- **精确文件**：`tests/integration/distribution-closure.test.mjs`
- **boundary**：files: `tests/integration/distribution-closure.test.mjs`; symbols/regions: release closure/discovery assertions and fixtures
- **输出**：目标行为缺失导致 exit 1，失败定位到 portable workflow 断言而非 setup。
- **Knowledge**：`check-skill-closure` 当前把 workflows 目录当 stage；release 当前只枚举五 stage；不能靠扩 STAGES 修复。
- **verification_role**：RED
- **paired_task**：T002
- **gate_cmd**：`npx --no-install vitest run tests/integration/distribution-closure.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：1
- **oracle**：`ORACLE-P1-PORTABLE {"pass":"目标 portable workflow 断言在实现前失败，配对 GREEN 后同命令退出 0 且正负例保留。","reject":{"input":"把 build-prd 加入 canonical STAGES/CURRENT_MATERIAL_FILES，或缺 registry/bundle/依赖文件","expected_rejection":"closure 明确拒绝第六 formal stage、第五材料或不闭合 portable 包","observation":"失败信息命中 portable/formal identity 或 missing closure，不是 fixture/setup 噪声"}}`
- **semantic_review_status**：incomplete
- **semantic_review_ref**：`specs/workflowhub-build-prd/plan.md#Phase-P1`
- **semantic_review_reason**：结构与预期行为已规划；独立语义复核及实际 RED 尚未执行。
- **evidence_path**：`quality/tests/P1-portable.json`
- **STOP**：目标断言不能由现接口表达、命令空跑、需新增公共命令/第二 dispatcher 或扩 canonical 集时停止回 build-plan。
- **recovery**：build-code 删除本卡新增断言或修复 fixture；保留原失败输出与四材料。
- **task risk**：静态文件存在被误当真实发现，或总 exit 掩盖非目标失败。
- **test tier / test method**：feature / backend-testing；验证 release/discovery 跨模块 closure。
- **scenarios / commands / expected exit / oracle**：S01–S06逐项断言真实规划决定、仅有PRD不得切换、首次无PRD可开始、母决定缺失、必要来源不可读、旧源与当前决定冲突且只继续未受影响草稿；另含正常discovery/release、缺bundle、错误第六stage/第五材料；同gate；RED=1/GREEN=0；ORACLE-P1-PORTABLE。
- **fixtures_services**：临时 release 目录与仓库 fixture；无网络/provider/browser；测试清理 temp。
- **coverage limits**：不证明任意外部宿主已安装或真实调用成功，只证明仓内现有分发闭包可携带。
- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）
- [ ] **任务完成**
- **status**：`completed`
- **actual_changes**：extended `tests/integration/distribution-closure.test.mjs` with portable registry, three-file, release, closure, five-stage, and four-material assertions
- **executed_commands**：`npx --no-install vitest run tests/integration/distribution-closure.test.mjs --poolOptions.forks.singleFork --no-fileParallelism` (RED exit 1)
- **evidence_refs**：test stdout captured in session; `quality/tests/P1-portable.json` not written (outside requested implementation boundary)
- **covered_ac**：AC-PRD-001, AC-PRD-004, AC-PRD-007, AC-PRD-009, AC-PRD-010 (portable/formal closure assertions)
- **review_fact**：semantic review and Phase review not executed
- **completed_at**：2026-07-14 (execution date from repository test run)
- **执行事实**：RED was observed before production edits; failure was the missing `build-prd` portable registry entry (expected exit 1).

#### T002 — GREEN：声明并分发 portable build-prd 闭包
- **ID**：T002
- **Phase**：Phase P1 — Portable 发现、编排与分发闭包
- **goal**：以最小声明式分型让 T001 通过，不改变 canonical stages/materials。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-build-prd/spec.md","hash":"44705bd9ba58d45f917840f1e173f67d80d7fa1c4c291337ff4885bf2bbf689c","id":"SPEC-workflowhub-build-prd"},{"artifact_kind":"plan","ref":"specs/workflowhub-build-prd/plan.md","hash":"efbfd46bf3e91b8afe59552413714bbd1ce90c783f8ce754b945619e605efb32","id":"PLAN-workflowhub-build-prd"}]`
- **source_refs / decision_refs**：R1/R2/R3/R7/R8/R10/R11/R14; D1/D2/D4/D7/D22/D23/D37/D39/D40/D42/D44/D46/D47/D50 → FR-INTENT-001, FR-INTENT-002, FR-INTENT-003, FR-ORCH-001, FR-ORCH-002, FR-ORCH-003, FR-PORT-001, FR-DELIVERY-001; AC-PRD-001, AC-PRD-004, AC-PRD-007, AC-PRD-009, AC-PRD-010
- **输入**：T001 的目标失败与当前 registry/catalog/release anchors。
- **依赖**：T001
- **并行**：否 — RED/GREEN 串行且共享测试文件。
- **FR**：FR-INTENT-001, FR-INTENT-002, FR-INTENT-003, FR-ORCH-001, FR-ORCH-002, FR-ORCH-003, FR-PORT-001, FR-DELIVERY-001
- **AC**：AC-PRD-001, AC-PRD-004, AC-PRD-007, AC-PRD-009, AC-PRD-010
- **动作**：新增 build-prd 三件套；扩 registry/catalog/reuse/manifest/closure/release 识别 portable kind；workflow 只调度、展示、问答与事实交付；刷新 repo manifest。
- **精确文件**：`workflows/build-prd/SKILL.md`, `workflows/build-prd/skill-deps.yaml`, `workflows/build-prd/steps.json`, `config/workflowhub.yaml`, `skills/catalog.yaml`, `skills/reuse-registry.md`, `repo-skills.manifest.json`, `runtime/evidence/check-skill-closure.mjs`, `runtime/distribution/skill-bundle-release.mjs`, `tests/integration/distribution-closure.test.mjs`, `docs/architecture/move-map.json`
- **boundary**：files: `workflows/build-prd/SKILL.md`, `workflows/build-prd/skill-deps.yaml`, `workflows/build-prd/steps.json`, `config/workflowhub.yaml`, `skills/catalog.yaml`, `skills/reuse-registry.md`, `repo-skills.manifest.json`, `runtime/evidence/check-skill-closure.mjs`, `runtime/distribution/skill-bundle-release.mjs`, `tests/integration/distribution-closure.test.mjs`, `docs/architecture/move-map.json`; symbols/regions: portable classification, declared closure collection, registry/catalog projections
- **输出**：同命令 exit 0；release 含 build-prd/spec-prd 所需文件且 stage/material count 不变。
- **Knowledge**：manifest 由既有 generator 产生；standalone/portable 可 `used_by_stages:[]`，但 build-prd 是 workflow 而非裸 skill。
- **verification_role**：GREEN
- **paired_task**：T001
- **gate_cmd**：`npx --no-install vitest run tests/integration/distribution-closure.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：0
- **oracle**：`ORACLE-P1-PORTABLE {"pass":"同一命令退出 0；build-prd 经 registry/catalog/release 可发现，依赖闭合，formal stages 仍为五且 current materials 仍为四。"}`
- **semantic_review_status**：incomplete
- **semantic_review_ref**：`specs/workflowhub-build-prd/plan.md#Phase-P1`
- **semantic_review_reason**：语义复核由 build-code Phase 独立 review 负责；本草案未执行。
- **evidence_path**：`quality/tests/P1-portable.json`
- **STOP**：必须扩 formal STAGES、CURRENT_MATERIAL_FILES、公共 behavior 或引入隐式扫描时停止。
- **recovery**：回滚 portable 分型/登记/三件套，重建 manifest；不动五阶段。
- **task risk**：闭包漏 spec-prd template/wh-review contract 或误携 tests/history。
- **test tier / test method**：feature / backend-testing。
- **scenarios / commands / expected exit / oracle**：与T001完全相同，包含S01–S06 expected/actual及OPEN-001逐目标宿主发现清单；同命令、同oracle identity，保留负例。
- **fixtures_services**：与 T001 相同。
- **coverage limits**：不证明真实外部宿主安装；该事实留最终验收。
- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）
- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：added the portable `build-prd` three-file package; registered `portable_workflow`; extended closure/release collection; added `spec-prd` dependency/catalog/reuse projection; regenerated repo manifest; registered move-map entry
- **executed_commands**：`npx --no-install vitest run tests/integration/distribution-closure.test.mjs --poolOptions.forks.singleFork --no-fileParallelism` (GREEN exit 0); `node tools/cli/repo-skills-manifest.mjs --check` (exit 0)
- **evidence_refs**：targeted Vitest stdout in session; closure report `{ ok: true, errors: [] }`; `repo skills manifest: ok`
- **covered_ac**：AC-PRD-001, AC-PRD-004, AC-PRD-007, AC-PRD-009, AC-PRD-010 (portable/formal closure assertions)
- **review_fact**：semantic review and Phase review not executed
- **completed_at**：2026-07-14 (execution date from repository test run)
- **执行事实**：GREEN passed 9 tests; stderr retained existing AJV `unknown format "date"` warnings. No external host invocation was performed or claimed.

### Verify
同一命令 `npx --no-install vitest run tests/integration/distribution-closure.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`；RED expected=1，GREEN expected=0；`ORACLE-P1-PORTABLE`；证据 `quality/tests/P1-portable.json`。

### Knowledge
portable workflow 必须有 registry 与 release consumer，但不得进入 stage completion/reflection/material contracts；repo manifest 由既有 generator 刷新。

### STOP
任何实现要求扩 canonical stage 集、公共命令、CURRENT_MATERIAL_FILES、隐式目录扫描或第二分发器时停止回 plan/spec。

### Done
真实 RED/GREEN、closure 文件清单/hash、负例（第六 stage、缺 bundle 文件、缺 registry）和 AC-001/004/007/009/010 覆盖均有证据；未执行则只可报 pending。

### Risks and rollback
风险是 disk workflow 分类回归；回滚 portable 分型及三件套/登记，恢复 manifest 投影，不改五阶段源码。

## Phase P2 — spec-prd 单 writer 与条件 UI/维护合同

### Goal
spec-prd 以同版决定先产大纲/地图、真实核对后成完整单 PRD；UI/非UI、独立调用、最小读取与归档维护均可证伪。

### Files
- **NEW**：`skills/spec-prd/SKILL.md`, `skills/spec-prd/skill-bundle.json`, `skills/spec-prd/templates/prd-template.md`, `tests/contract/spec-prd-skill-contract.test.mjs`
- **MODIFY**：`CONSTITUTION.md`, `constitution-checklist.md`, `docs/architecture/move-map.json`
- **DO NOT TOUCH**：`workflows/build-spec/**` 生产合同及任何产品 UI 源码；只复用语义，不复制第二 UI 引擎。

### Tasks

#### T003 — RED：spec-prd 两步、UI 与维护边界
- **ID**：T003
- **Phase**：Phase P2 — spec-prd 单 writer 与条件 UI/维护合同
- **goal**：以合同测试固定单 writer、地图先确认、完整卡、UI版本确认、独立调用、最小读取与维护反例。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-build-prd/spec.md","hash":"44705bd9ba58d45f917840f1e173f67d80d7fa1c4c291337ff4885bf2bbf689c","id":"SPEC-workflowhub-build-prd"},{"artifact_kind":"plan","ref":"specs/workflowhub-build-prd/plan.md","hash":"efbfd46bf3e91b8afe59552413714bbd1ce90c783f8ce754b945619e605efb32","id":"PLAN-workflowhub-build-prd"}]`
- **source_refs / decision_refs**：R2/R4/R5/R9/R12/R13; D5/D6/D9/D10/D11/D13/D15/D21/D24/D27-D36/D40/D41/D45/D47/D48/D52 → FR-MAP-001, FR-MAP-002, FR-MAP-003, FR-DESIGN-001, FR-DESIGN-002, FR-PRD-001, FR-PRD-002, FR-PRD-003, FR-PORT-001, FR-MAINT-001, FR-MAINT-002; AC-PRD-002, AC-PRD-003, AC-PRD-006, AC-PRD-007, AC-PRD-008
- **输入**：T002 portable closure；当前决策/规格与 build-spec UI 确认先例。
- **依赖**：T002
- **并行**：否 — 消费已声明的 spec-prd dependency。
- **FR**：FR-MAP-001, FR-MAP-002, FR-MAP-003, FR-DESIGN-001, FR-DESIGN-002, FR-PRD-001, FR-PRD-002, FR-PRD-003, FR-PORT-001, FR-MAINT-001, FR-MAINT-002
- **AC**：AC-PRD-002, AC-PRD-003, AC-PRD-006, AC-PRD-007, AC-PRD-008
- **动作**：新增目标合同测试；覆盖 map-before-detail、consumer/oracle、四依赖、UI/non_ui、未答/取消/错版、独立缺决定、失效共享引用、归档实质修订未确认；不写技能实现。
- **精确文件**：`tests/contract/spec-prd-skill-contract.test.mjs`
- **boundary**：files: `tests/contract/spec-prd-skill-contract.test.mjs`; symbols/regions: static bundle/template contract and scenario fixtures
- **输出**：缺 spec-prd/F7 适配时目标断言 exit 1。
- **Knowledge**：PRD 是一份 Markdown，导航+四正文；每卡含结果/consumer/流程状态/FR/AC/四依赖/来源设计/风险/最小读取/开工说明。
- **verification_role**：RED
- **paired_task**：T004
- **gate_cmd**：`npx --no-install vitest run tests/contract/spec-prd-skill-contract.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：1
- **oracle**：`ORACLE-P2-SPEC-PRD {"pass":"实现前因 spec-prd/F7 合同缺失而退出 1；实现后同命令退出 0 并覆盖完整正负场景。","reject":{"input":"缺母决定、地图未确认即成稿、UI未答/取消/错版、共享引用失效或实质归档修订未确认","expected_rejection":"保持草稿并指出具体缺口/受影响范围，不称完整、批准或交付","observation":"断言观察单 writer、版本绑定、缺口和变更说明事实"}}`
- **semantic_review_status**：incomplete
- **semantic_review_ref**：`specs/workflowhub-build-prd/plan.md#Phase-P2`
- **semantic_review_reason**：行为 oracle 待独立复核，未执行 RED。
- **evidence_path**：`quality/tests/P2-spec-prd.json`
- **STOP**：需要猜方向、让 build-spec 补母需求、多 writer、产品 UI 源码或第二设计引擎时停止。
- **recovery**：删除本卡测试增量；保留规格、用户确认与失败事实。
- **task risk**：静态关键词测试未覆盖真实两步/版本语义。
- **test tier / test method**：feature / backend-testing；合同+fixture，不用 browser。
- **scenarios / commands / expected exit / oracle**：non-UI成功；UI全流程；项目规范缺失时先建任务级基线并给规范责任卡consumer/oracle；最终稿拒绝保持draft；取消/未答/错版；补齐后再次调用重读当前材料且只重做受影响范围；独立完整/缺决定；最小读取闭包；归档小修/实质修订；同gate；1→0；ORACLE-P2-SPEC-PRD。
- **fixtures_services**：内存 Markdown/JSON fixture；无网络/provider/browser。
- **coverage limits**：不评价未来实际高保真视觉质量，只验证版本/确认/覆盖合同。
- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）
- [ ] **任务完成**
- **status**：`pending`
- **actual_changes**：N/A — no T003-only implementation; the paired implementation is recorded under T004.
- **executed_commands**：The repository retains no authenticated T003 RED receipt or independently addressable command transcript; T004 GREEN cannot retroactively prove the required pre-implementation RED.
- **evidence_refs**：Current GREEN receipt `quality/tests/P2-spec-prd.json` exists, but no authenticated pre-implementation T003 RED ref/hash is available.
- **covered_ac**：AC-PRD-002, AC-PRD-003, AC-PRD-006, AC-PRD-007, AC-PRD-008 remain `incomplete` for the T003 RED evidence role; implementation coverage is recorded under T004.
- **review_fact**：semantic review and Phase review not executed.
- **completed_at**：N/A — not completed.
- **执行事实**：T003 remains `pending` because no pre-implementation RED evidence can be located or backfilled. On 2026-09-09 the official build-code capture was run against the current authenticated worktree and recorded `quality/tests/P2-spec-prd.json` (outer/inner exit `0`, 10/10 passed, output ref `quality/tests/output/P2-spec-prd.output`, output hash `6b79ba99c51da93eb967e241ae2900c45c7af3ee64d04c84cc337bec9c0aa8c6`, receipt hash `190567d92addf1ea9f8cb32de107820d7121586b6eab88a7971e9272219e94a6`, snapshot tree `ed3ed8f1bd0185fb8a0a8d533b5ce913ff8522ff`, source digest `28b2aa9bda686838a1618e4c399d52719cd285f0880f2f1afd8eade6ca67aed8`). That is a real current GREEN result, not RED; it is retained as a ledger discrepancy and does not complete T003 or retroactively prove the required RED role. This does not claim T004 implementation is undone.

#### T004 — GREEN：实现单一 spec-prd bundle/template 与 F7 适配
- **ID**：T004
- **Phase**：Phase P2 — spec-prd 单 writer 与条件 UI/维护合同
- **goal**：让 T003 全部正负场景通过，保持能力自身 non_ui。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-build-prd/spec.md","hash":"44705bd9ba58d45f917840f1e173f67d80d7fa1c4c291337ff4885bf2bbf689c","id":"SPEC-workflowhub-build-prd"},{"artifact_kind":"plan","ref":"specs/workflowhub-build-prd/plan.md","hash":"efbfd46bf3e91b8afe59552413714bbd1ce90c783f8ce754b945619e605efb32","id":"PLAN-workflowhub-build-prd"}]`
- **source_refs / decision_refs**：R2/R4/R5/R9/R12/R13; D5/D6/D9/D10/D11/D13/D15/D21/D24/D27-D36/D40/D41/D45/D47/D48/D52 → FR-MAP-001, FR-MAP-002, FR-MAP-003, FR-DESIGN-001, FR-DESIGN-002, FR-PRD-001, FR-PRD-002, FR-PRD-003, FR-PORT-001, FR-MAINT-001, FR-MAINT-002; AC-PRD-002, AC-PRD-003, AC-PRD-006, AC-PRD-007, AC-PRD-008
- **输入**：T003 目标失败与确认/UI/维护合同。
- **依赖**：T003
- **并行**：否 — RED/GREEN 串行。
- **FR**：FR-MAP-001, FR-MAP-002, FR-MAP-003, FR-DESIGN-001, FR-DESIGN-002, FR-PRD-001, FR-PRD-002, FR-PRD-003, FR-PORT-001, FR-MAINT-001, FR-MAINT-002
- **AC**：AC-PRD-002, AC-PRD-003, AC-PRD-006, AC-PRD-007, AC-PRD-008
- **动作**：新增 SKILL/bundle/template；定义两次调用与单 writer；同步 F7/checklist 的地图、条件UI分组、最终确认边界；独立调用缺输入 fail-loud；维护写变更说明。
- **精确文件**：`skills/spec-prd/SKILL.md`, `skills/spec-prd/skill-bundle.json`, `skills/spec-prd/templates/prd-template.md`, `tests/contract/spec-prd-skill-contract.test.mjs`, `CONSTITUTION.md`, `constitution-checklist.md`, `docs/architecture/move-map.json`
- **boundary**：files: `skills/spec-prd/SKILL.md`, `skills/spec-prd/skill-bundle.json`, `skills/spec-prd/templates/prd-template.md`, `tests/contract/spec-prd-skill-contract.test.mjs`, `CONSTITUTION.md`, `constitution-checklist.md`, `docs/architecture/move-map.json`; symbols/regions: spec-prd contract/template and F7 confirmation clause/checklist only
- **输出**：同命令 exit 0；模板/技能/F7 行为与负例闭合。
- **Knowledge**：UI 设计确认是规划对象条件路径；本次代码改动仍 non_ui，不新增 browser/card。
- **verification_role**：GREEN
- **paired_task**：T003
- **gate_cmd**：`npx --no-install vitest run tests/contract/spec-prd-skill-contract.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：0
- **oracle**：`ORACLE-P2-SPEC-PRD {"pass":"同一命令退出 0；大纲地图先核对、单 writer 成稿、UI/非UI、独立调用、最小读取和维护正负场景均可观察。"}`
- **semantic_review_status**：incomplete
- **semantic_review_ref**：`specs/workflowhub-build-prd/plan.md#Phase-P2`
- **semantic_review_reason**：等待 build-code 独立 Phase review；不得用作者自检写 completed。
- **evidence_path**：`quality/tests/P2-spec-prd.json`
- **STOP**：测试要求扩大产品方向/组件源码/新确认 gate 或破坏 build-spec owner 时停止。
- **recovery**：回滚 spec-prd/F7 增量；不覆盖已存在确认事实。
- **task risk**：F7 文案不精确导致非UI也多问，或 PRD 模板变成第五材料。
- **test tier / test method**：feature / backend-testing。
- **scenarios / commands / expected exit / oracle**：与T003完全相同，点名缺项目规范、最终稿拒绝和再次调用三类expected/actual；同gate/oracle identity，保留负例。
- **fixtures_services**：与 T003 相同。
- **coverage limits**：不运行真实 UI 设计工具或视觉验收。
- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）
- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：实现并核对 `spec-prd` 单 writer bundle/template/F7 合同；portable `build-prd` 编排现为六步：step 4 `expand-single-prd` 后接非内容 step 5 `confirm-final-displayed-draft`，使用 `final_displayed_draft_confirmation` / `workflow://build-prd/final-confirmation`，再由 step 6 `report-facts-and-handoff` 消费 `step://5`。step 5 绑定 decision/source/map/PRD revisions、displayed draft hash、`display_before_reply` 与 `human_approved`；拒绝、未答、错版、错误 flag/hash 保持 draft。实际变更也包含 `workflows/build-prd/steps.json`；该文件未列入本卡原始精确 boundary，现作为 scope reconciliation fact 保留。
- **executed_commands**：`npx --no-install vitest run tests/contract/spec-prd-skill-contract.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`（exit 0，1 file / 10 tests passed）；`node tools/cli/repo-skills-manifest.mjs --check`（exit 0，`repo skills manifest: ok`）；bundle validation `bundleHash=a84d932e3e3b80119f7797cb89bcc47ad50bbaf91400b08852d2ac7a492effb9`。
- **evidence_refs**：P2 targeted contract stdout（10/10）；repo manifest check stdout；P1 topology sync report `57/57`（由 P1 worker 提供，未在本状态区重复执行）；`skills/spec-prd/skill-bundle.json` inner hashes：`SKILL.md=cc8e6c47700aa2d14192bf493365a294bfa7b93f45c5350b9907d1039a491958`、`templates/prd-template.md=7af31c8a39443bfae616e77873fe107a6d47cca67ea8575ffec1a2a6e150f78c`。
- **covered_ac**：AC-PRD-002, AC-PRD-003, AC-PRD-006, AC-PRD-007, AC-PRD-008（含 post-second-call final confirmation seam、四 revision/hash/flag 绑定、draft preservation、UI coverage wording、动态模板 status、六步 portable orchestration）。
- **review_fact**：独立 semantic/Phase review 未执行；保持 `incomplete`，不得以作者测试宣称 review 完成。
- **completed_at**：2026-09-09（本次会话 targeted execution date；未写入外部 receipt）。
- **执行事实**：P2 exact command GREEN 10/10；manifest check GREEN；canonical spec-prd bundle hash 为 `a84d932e3e3b80119f7797cb89bcc47ad50bbaf91400b08852d2ac7a492effb9`。本次未执行真实 provider、host、browser、UI 或物理交付动作；未修改 P1/P3 runtime closure 或 `docs/architecture/move-map.json`。

### Verify
同一命令 `npx --no-install vitest run tests/contract/spec-prd-skill-contract.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`；RED=1，GREEN=0；`ORACLE-P2-SPEC-PRD`；证据 `quality/tests/P2-spec-prd.json`。

### Knowledge
正式 PRD 只有 spec-prd 可写；地图变化只重核受影响范围；未答/取消/错版保持草稿；归档方向/验收变化先真确认并写变更说明。

### STOP
若缺失决定必须猜产品方向、要让 build-spec 补母需求、需要多人并写正文或需要本任务新增 UI 页面/设计引擎，停止回 owner。

### Done
AC-002/003/006/008 及对应 MAP/DESIGN/PRD/MAINT 全覆盖；独立调用完整/缺输入、UI/non_ui、取消/未答/错版、失效引用均有真实 targeted 结果。

### Risks and rollback
风险是治理确认泛化成新 gate；回滚 F7/spec-prd 增量，保留原确认事实与 decision，不更改历史材料。

## Phase P3 — wh-review build-prd 非 stage 审查面

### Goal
完整 PRD 通过 wh-review 专属非 stage surface 一次审查，保留真实 provider/transport/coverage，条件 debate/analyze/reflection 不形成第二审查或 gate。

### Files
- **NEW**：`skills/wh-review/contracts/build-prd.md`, `tests/contract/build-prd-review-contract.test.mjs`
- **MODIFY**：`skills/wh-review/stage-skill-plan.json`, `skills/wh-review/manifest.json`, `runtime/review/stage-materials.json`, `runtime/review/review-policy.mjs`, `skills/wh-review/scripts/review-materials.mjs`, `skills/wh-review/scripts/third-review-host-config.mjs`, `skills/wh-review/scripts/review-semantic-projection.mjs`, `skills/wh-review/skill-bundle.json`, `docs/architecture/move-map.json`
- **DO NOT TOUCH**：五 stage review routes/provider engine 与历史 attempt/result；禁止把 build-prd 加 `REVIEW_STAGES`。

### Tasks

#### T005 — RED：build-prd 非 stage review surface
- **ID**：T005
- **Phase**：Phase P3 — wh-review build-prd 非 stage 审查面
- **goal**：固定专属材料合同、一次审查、独立 provenance、partial/unavailable 与有界 debate/analyze/reflection 语义。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-build-prd/spec.md","hash":"44705bd9ba58d45f917840f1e173f67d80d7fa1c4c291337ff4885bf2bbf689c","id":"SPEC-workflowhub-build-prd"},{"artifact_kind":"plan","ref":"specs/workflowhub-build-prd/plan.md","hash":"efbfd46bf3e91b8afe59552413714bbd1ce90c783f8ce754b945619e605efb32","id":"PLAN-workflowhub-build-prd"}]`
- **source_refs / decision_refs**：R5/R11/R14/R15; D20/D26/D31/D33/D37/D40/D42/D43/D46/D49 → FR-ORCH-001, FR-ORCH-002, FR-ORCH-003, FR-QUALITY-001, FR-QUALITY-002, FR-QUALITY-003; AC-PRD-004, AC-PRD-005
- **输入**：T004 spec-prd 合同及 wh-review mini-task sibling 先例。
- **依赖**：T004
- **并行**：否 — 审查面消费已冻结 PRD contract。
- **FR**：FR-ORCH-001, FR-ORCH-002, FR-ORCH-003, FR-QUALITY-001, FR-QUALITY-002, FR-QUALITY-003
- **AC**：AC-PRD-004, AC-PRD-005
- **动作**：新增 targeted contract test，断言 build_prd sibling 不在 stages、专属 contract/allowlist、只一次 review、失败保真、debate≤2 且仅实质方向争议、analyze/reflection report-only。
- **精确文件**：`tests/contract/build-prd-review-contract.test.mjs`
- **boundary**：files: `tests/contract/build-prd-review-contract.test.mjs`; symbols/regions: non-stage review surface/material/profile assertions
- **输出**：现有 wh-review 缺 build-prd surface 时 exit 1。
- **Knowledge**：不能复用 build-plan 身份塞假 spec/plan/tasks；非 stage 应仿 mini_task sibling/review_kind。
- **verification_role**：RED
- **paired_task**：T006
- **gate_cmd**：`npx --no-install vitest run tests/contract/build-prd-review-contract.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：1
- **oracle**：`ORACLE-P3-REVIEW {"pass":"实现前专属非 stage surface 缺失导致 exit 1；实现后同命令 exit 0 且单审查/失败保真成立。","reject":{"input":"把 build-prd 加 REVIEW_STAGES、冒用 build-plan 材料、重复 provider 审查、unavailable 写 pass 或无限 debate","expected_rejection":"合同拒绝错误 identity/材料/次数并保留原 provider/transport/coverage","observation":"断言命中非 stage sibling、canonical result 与有界争议字段"}}`
- **semantic_review_status**：incomplete
- **semantic_review_ref**：`specs/workflowhub-build-prd/plan.md#Phase-P3`
- **semantic_review_reason**：独立 review 尚未执行，不能自报 semantic completed。
- **evidence_path**：`quality/tests/P3-review.json`
- **STOP**：需改 provider engine、stage 集、第二 review flow 或将质量事实变 gate 时停止。
- **recovery**：删除新增测试；保留现有 wh-review 与原 provider facts。
- **task risk**：只测静态计划未覆盖材料 bundle 实际选择。
- **test tier / test method**：feature / backend-testing。
- **scenarios / commands / expected exit / oracle**：完整 PRD；缺材料；partial/unavailable；重复调用；实质/非实质 finding；同 gate；1→0；ORACLE-P3-REVIEW。
- **fixtures_services**：临时 bundle/material fixtures；provider 为 test double，不联网；清理 temp。
- **coverage limits**：不运行真实第三方 provider，不宣称审查质量通过。
- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）
- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：新增 `tests/contract/build-prd-review-contract.test.mjs`，先固定缺失专属 surface 的 RED；实现非 stage `build_prd` 的专属 contract、allowlist/material rule、route/profile、semantic surface、report-only provider-fact 边界与 bundle manifest/hash 断言；补充 formal-stage identity、canonical recorder 与 task-bound E2E unavailable/result persistence fail-closed regressions；未改 `REVIEW_STAGES`、canonical attempt/result schemas、provider engine。
- **executed_commands**：`npx --no-install vitest run tests/contract/build-prd-review-contract.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`（RED exit 1，4 tests failed on missing surface）；GREEN 同命令 exit 0（最终 5/5）。
- **evidence_refs**：targeted Vitest RED/GREEN stdout in session; `quality/tests/P3-review.json` not written (outside requested implementation boundary).
- **covered_ac**：AC-PRD-004, AC-PRD-005（contract seam, allowlist, route, projection, one provider-fact call, unavailable/partial preservation, no canonical persistence assertions）。
- **review_fact**：独立 semantic/Phase review 未执行；真实 provider 未调用，质量事实保持 unavailable/unknown。
- **completed_at**：2026-08-04（本次会话执行时间，未写入外部 receipt）。
- **执行事实**：RED 先执行并命中目标缺口；GREEN 初版 4/4，随后新增 formal-stage identity/canonical persistence regression 后最终 5/5；真实 provider/usage/timing 未执行。

#### T006 — GREEN：扩展同一 wh-review broker 的 build-prd sibling
- **ID**：T006
- **Phase**：Phase P3 — wh-review build-prd 非 stage 审查面
- **goal**：让 T005 通过，同时五 stage routes/provider engine 不变。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-build-prd/spec.md","hash":"44705bd9ba58d45f917840f1e173f67d80d7fa1c4c291337ff4885bf2bbf689c","id":"SPEC-workflowhub-build-prd"},{"artifact_kind":"plan","ref":"specs/workflowhub-build-prd/plan.md","hash":"efbfd46bf3e91b8afe59552413714bbd1ce90c783f8ce754b945619e605efb32","id":"PLAN-workflowhub-build-prd"}]`
- **source_refs / decision_refs**：R5/R11/R14/R15; D20/D26/D31/D33/D37/D40/D42/D43/D46/D49 → FR-ORCH-001, FR-ORCH-002, FR-ORCH-003, FR-QUALITY-001, FR-QUALITY-002, FR-QUALITY-003; AC-PRD-004, AC-PRD-005
- **输入**：T005 目标失败、当前 wh-review plan/manifest/material builder。
- **依赖**：T005
- **并行**：否 — RED/GREEN 串行。
- **FR**：FR-ORCH-001, FR-ORCH-002, FR-ORCH-003, FR-QUALITY-001, FR-QUALITY-002, FR-QUALITY-003
- **AC**：AC-PRD-004, AC-PRD-005
- **动作**：新增 build-prd contract；扩 plan/manifest/material surface/builder 与 bundle hash；复用 broker canonical attempt/result；不加 REVIEW_STAGES。
- **精确文件**：`skills/wh-review/contracts/build-prd.md`, `tests/contract/build-prd-review-contract.test.mjs`, `skills/wh-review/stage-skill-plan.json`, `skills/wh-review/manifest.json`, `runtime/review/stage-materials.json`, `runtime/review/review-policy.mjs`, `skills/wh-review/scripts/review-materials.mjs`, `skills/wh-review/scripts/third-review-host-config.mjs`, `skills/wh-review/scripts/review-semantic-projection.mjs`, `skills/wh-review/skill-bundle.json`, `docs/architecture/move-map.json`
- **boundary**：files: `skills/wh-review/contracts/build-prd.md`, `tests/contract/build-prd-review-contract.test.mjs`, `skills/wh-review/stage-skill-plan.json`, `skills/wh-review/manifest.json`, `runtime/review/stage-materials.json`, `runtime/review/review-policy.mjs`, `skills/wh-review/scripts/review-materials.mjs`, `skills/wh-review/scripts/third-review-host-config.mjs`, `skills/wh-review/scripts/review-semantic-projection.mjs`, `skills/wh-review/skill-bundle.json`, `docs/architecture/move-map.json`; symbols/regions: complete build-prd sibling policy/route/contract/material/semantic projection and hashes
- **输出**：同命令 exit 0；非 stage identity 与质量失败事实保真。
- **Knowledge**：simplicity/产品方向/适用设计 lens 属同一 review 包，不是额外 provider 调用。
- **verification_role**：GREEN
- **paired_task**：T005
- **gate_cmd**：`npx --no-install vitest run tests/contract/build-prd-review-contract.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：0
- **oracle**：`ORACLE-P3-REVIEW {"pass":"同一命令退出 0；build-prd 以非 stage sibling 使用专属合同和同一 broker，单次审查及 partial/unavailable 事实均保留。"}`
- **semantic_review_status**：incomplete
- **semantic_review_ref**：`specs/workflowhub-build-prd/plan.md#Phase-P3`
- **semantic_review_reason**：等待 build-code 独立 Phase review；真实 provider 可用性另记。
- **evidence_path**：`quality/tests/P3-review.json`
- **STOP**：任何 stage/provider core 扩张、双审查或 pass gate 要求立即停止。
- **recovery**：回滚 sibling/contract/material/bundle 增量；原结果不可变。
- **task risk**：manifest/hash 漂移或错误材料泄入 provider bundle。
- **test tier / test method**：feature / backend-testing。
- **scenarios / commands / expected exit / oracle**：与 T005 完全相同；同 gate/oracle identity，保留负例。
- **fixtures_services**：与 T005 相同。
- **coverage limits**：真实 provider 执行/usage/timing 未运行时保持 unavailable。
- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）
- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：实现 `build_prd` 顶层 non-stage sibling 的专属 contract、material allowlist/rule、route/profile、semantic projection、report-only provider-fact 边界及 bundle hashes；增加 runner 的 non-stage sentinel identity 拒绝、canonical record/verify guards，以及 task-bound E2E unavailable/result guards；仅扩展 `stage-materials.schema.json` 以登记 non-stage matrix；未改五 formal stages 或 canonical schemas。当前 same-task repair 尚需关闭序列化 packet 的 camel-only identity bypass。
- **executed_commands**：精确 P3 命令 exit 0（最终 5/5）；focused review-record/review-runner tests exit 0（67/67）；`node --check` 对 P3 JavaScript 文件通过；P3 JSON parse、repo manifest check 与 targeted closure 通过。
- **evidence_refs**：Current authenticated receipt `quality/tests/P3-review-current.json` (`receipt_hash=bc8766f2b2ec55930749d8410a113ebb77a79d26826587594e137bd9ab8eb694`, `output_hash=1fe7cbe07a8be3284ca19ecb5b718f122c63c2e789a043f78acb7bbd87c6f8c9`, `snapshot_tree=105998e41d16c69876844c60fcd95a9d8dc2ac99`) records 7 files and 226/226 passed. The earlier P3 receipt remains historical because the review scripts changed afterward. The P3 quality claim remains incomplete because no semantic Phase review result/provider evidence is available.
- **covered_ac**：AC-PRD-004, AC-PRD-005（non-stage identity, dedicated contract/allowlist, one provider-fact request, unavailable/partial provenance, bounded debate/report-only analysis-reflection, semantic hash and no canonical persistence）。
- **review_fact**：独立 semantic/Phase review 未执行；真实第三方 provider 未调用，provider availability/usage/timing 保持 unavailable/unknown。
- **completed_at**：2026-08-04（本次会话执行时间，未写入外部 receipt）。
- **执行事实**：T005 RED exit 1（4 个目标缺口失败）后 T006 GREEN 最终 5/5；随后修复 task-bound E2E persistence bypass；bundle canonical resolver hash 与 catalog 已同步；P3 move-map registrations include all boundary guards；canonical `build_prd` attempt/result persistence remains explicitly rejected/report-only。2026-09-09 当前官方 P3 capture 记录 7 files、226/226 passed，且 P3 compatibility tests remain green。独立审查提出的“序列化 packet camel-only identity bypass”经当前代码复核为 `rebuildSerializedPacket` 的 `SIMPLE_PACKET_KEYS`/`exactKeys` 已拒绝 camel-only 字段，现有 negative tests 覆盖该边界，finding disposition=`rejected_invalid`，无需同 task 代码修复。真实 provider 未形成 semantic result，独立 Phase review 记录为 unavailable（attempt `quality/reviews/attempts/200e071e-be99-5c99-ada7-27e32f52a17a/attempt.json`，hash `6df38fc83d67530feaa75d023d984a73fbbc5f9f338448bb0aa4fe00d0eb2939`）；本卡质量 claim 保持 `incomplete`。

### Verify
同一命令 `npx --no-install vitest run tests/contract/build-prd-review-contract.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`；RED=1，GREEN=0；`ORACLE-P3-REVIEW`；证据 `quality/tests/P3-review.json`。

### Knowledge
review 只返回独立 findings；实质产品分歧才最多两轮 debate，未决交人；analyze/reflection 是 report-only/事实，不冒充 provider 审查。

### STOP
若需伪造 stage、复用 build-plan 假材料、改 provider 引擎、把 unavailable 写 pass 或增加第二 review flow，停止回 plan。

### Done
FR-QUALITY 全部、FR-ORCH 审查部分与 AC-004/005 有正负证据；provider 未实际运行则明确 unavailable，不宣称质量通过。

### Risks and rollback
风险是 bundle hash/contract/profile 漂移；回滚新增 sibling 与 bundle 投影，保留原 attempt/result，不影响五 stage review。

## Phase P4 — planning close、归档读回与最终聚合

### Goal
复用唯一 task-close 对 planning 材料执行显式物理计划，分列规划/材料/开发/质量/动作事实，并以四 targeted tests 聚合全部 AC。

### Files
- **NEW**：`tests/integration/build-prd-delivery.test.mjs`
- **MODIFY**：`core/task-close.mjs`, `tools/cli/task-close.mjs`, `docs/architecture/move-map.json`
- **DO NOT TOUCH**：`runtime/task/material-workspace.mjs`, `specs/archive/**`, 旧 task/receipt/review/snapshot；不新增第二 close 或历史 writer。

### Tasks

#### T007 — RED：planning close 材料与物理事实
- **ID**：T007
- **Phase**：Phase P4 — planning close、归档读回与最终聚合
- **goal**：固定 decision-log+prd planning mode、附件/授权/部分失败/归档读回与普通/mini-task兼容。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-build-prd/spec.md","hash":"44705bd9ba58d45f917840f1e173f67d80d7fa1c4c291337ff4885bf2bbf689c","id":"SPEC-workflowhub-build-prd"},{"artifact_kind":"plan","ref":"specs/workflowhub-build-prd/plan.md","hash":"efbfd46bf3e91b8afe59552413714bbd1ce90c783f8ce754b945619e605efb32","id":"PLAN-workflowhub-build-prd"}]`
- **source_refs / decision_refs**：R2/R5/R6/R9/R12; D11/D13/D14/D16/D17/D39/D48/D50/D52/D53 → FR-MAINT-001, FR-MAINT-002, FR-DELIVERY-001, FR-DELIVERY-002, FR-DELIVERY-003; AC-PRD-008, AC-PRD-009
- **输入**：T006 review surface；现有 close prepare/inspect/execute 与 archive fixture。
- **依赖**：T006
- **并行**：否 — close 消费完整 workflow/content/review identity。
- **FR**：FR-MAINT-001, FR-MAINT-002, FR-DELIVERY-001, FR-DELIVERY-002, FR-DELIVERY-003
- **AC**：AC-PRD-008, AC-PRD-009
- **动作**：新增 integration test，断言 planning mode 不读/造 spec/plan/tasks/verify completion，逐附件/授权，目录归档读回，部分操作失败保真，ordinary/mini-task 无回归。
- **精确文件**：`tests/integration/build-prd-delivery.test.mjs`
- **boundary**：files: `tests/integration/build-prd-delivery.test.mjs`; symbols/regions: prepare/inspect/execute planning mode fixtures
- **输出**：缺 planning mode 时 exit 1，目标失败明确。
- **Knowledge**：现 close archive 整个 decision-log 所在目录；planning 仍用唯一 task-close，prd 不加入 CURRENT_MATERIAL_FILES。
- **verification_role**：RED
- **paired_task**：T008
- **gate_cmd**：`npx --no-install vitest run tests/integration/build-prd-delivery.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：1
- **oracle**：`ORACLE-P4-CLOSE {"pass":"实现前 planning close 目标断言 exit 1；实现后同命令 exit 0 且 ordinary/mini-task 与失败负例保留。","reject":{"input":"缺 decision-log/prd/必要附件/动作授权，或试图以 planning 完成宣称开发/质量完成","expected_rejection":"prepare/execute 明确拒绝缺项或分列未执行/失败，不伪造四材料和 verify facts","observation":"输出可区分 planning/material/development/quality/每个物理动作并可从归档读回对应版本"}}`
- **semantic_review_status**：incomplete
- **semantic_review_ref**：`specs/workflowhub-build-prd/plan.md#Phase-P4`
- **semantic_review_reason**：独立语义复核与真实 RED 未执行。
- **evidence_path**：`quality/tests/P4-close.json`
- **STOP**：需新增第二 close/public behavior、改 CURRENT_MATERIAL_FILES、写历史材料或绕过授权时停止。
- **recovery**：删除新增测试；保留失败、授权与现有 close facts。
- **task risk**：fixture 假造 Git/附件语义，或 archive 路径断言不足。
- **test tier / test method**：fullstack / fullstack-slice-testing；跨 CLI/core/filesystem/Git fixture，无 browser。
- **scenarios / commands / expected exit / oracle**：完整 planning close；缺附件；未授权；部分失败；归档读回；ordinary/mini-task；同 gate；1→0；ORACLE-P4-CLOSE。
- **fixtures_services**：临时 Git repo/worktree/task store；本地文件服务；测试清理 temp，不联网。
- **coverage limits**：不执行真实 remote push/merge；用既有受控 Git fixture 验证边界。
- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）
- [ ] **任务完成**
- **status**：`pending`
- **actual_changes**：N/A — implementation intentionally not started; feasibility audit found the existing TaskKernel authorization context cannot safely support planning materials within the authored boundary.
- **executed_commands**：The prescribed T007 command was probed read-only: `npx --no-install vitest run tests/integration/build-prd-delivery.test.mjs --poolOptions=forks.singleFork --no-fileParallelism` exited 1 with Vitest `No test files found`; this is missing-target/setup failure, not target RED. No valid T007 RED was run.
- **evidence_refs**：Authenticated receipt `quality/tests/P4-close.json` (`receipt_hash=e356c617a471e8254a5b6f353ca6ece0c995b9c851ca50b0db37294549b89625`, `output_hash=59861025e9d519309dcf3003f4d965d4c1acacb69347dfe6bcce9e4dc9b6d193`, `snapshot_tree=a7b3b2246044f1143adc732b5b4ed4024ebbf2c2`) records inner exit 1 and Vitest `No test files found`; this is missing-target/setup failure, not valid T007 RED. Read-only feasibility audit remains separate.
- **covered_ac**：AC-PRD-008, AC-PRD-009 remain `incomplete/unavailable` pending an approved planning authorization seam.
- **review_fact**：Independent feasibility review is `unavailable` for implementation completion; blocker and scope limits are recorded above.
- **completed_at**：N/A — not completed.
- **执行事实**：Existing `TaskKernel.publishHumanConfirmation` and `publishIrreversibleAuthorization` call the four-material `currentContext()` before authorization writes. Implementing planning mode safely requires an approved extension to `runtime/task/task-kernel-implementation.mjs`; no workaround was applied.

#### T008 — GREEN：扩现有 task-close planning mode
- **ID**：T008
- **Phase**：Phase P4 — planning close、归档读回与最终聚合
- **goal**：以显式 mode 让 T007 通过，保持普通/mini-task 行为与独立物理授权。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-build-prd/spec.md","hash":"44705bd9ba58d45f917840f1e173f67d80d7fa1c4c291337ff4885bf2bbf689c","id":"SPEC-workflowhub-build-prd"},{"artifact_kind":"plan","ref":"specs/workflowhub-build-prd/plan.md","hash":"efbfd46bf3e91b8afe59552413714bbd1ce90c783f8ce754b945619e605efb32","id":"PLAN-workflowhub-build-prd"}]`
- **source_refs / decision_refs**：R2/R5/R6/R9/R12; D11/D13/D14/D16/D17/D39/D48/D50/D52/D53 → FR-MAINT-001, FR-MAINT-002, FR-DELIVERY-001, FR-DELIVERY-002, FR-DELIVERY-003; AC-PRD-008, AC-PRD-009
- **输入**：T007 目标失败与 close mode seam。
- **依赖**：T007
- **并行**：否 — RED/GREEN 串行。
- **FR**：FR-MAINT-001, FR-MAINT-002, FR-DELIVERY-001, FR-DELIVERY-002, FR-DELIVERY-003
- **AC**：AC-PRD-008, AC-PRD-009
- **动作**：让planning mode在open workspace/current material revision/四材料/verify/product-release读取之前分流；为prepare→validate→inspect→complete逐段定义decision-log+prd+卡内必要附件的snapshot身份、quality分列和planning completion predicate；CLI复用同一入口；ordinary/mini-task/risk-close保持原路径；move-map在各首次新增生产文件的任务同步登记。
- **精确文件**：`tests/integration/build-prd-delivery.test.mjs`, `core/task-close.mjs`, `tools/cli/task-close.mjs`, `docs/architecture/move-map.json`
- **boundary**：files: `tests/integration/build-prd-delivery.test.mjs`, `core/task-close.mjs`, `tools/cli/task-close.mjs`, `docs/architecture/move-map.json`; symbols/regions: close mode selection, planning material inspection, CLI argument plumbing, architecture registrations
- **输出**：同命令 exit 0；不造开发完成/质量通过，归档与部分失败可观察。
- **Knowledge**：新增/修改文件登记 owner/consumer/test/delete condition；旧事实不可改写。
- **verification_role**：GREEN
- **paired_task**：T007
- **gate_cmd**：`npx --no-install vitest run tests/integration/build-prd-delivery.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：0
- **oracle**：`ORACLE-P4-CLOSE {"pass":"同一命令退出 0；planning mode 使用 decision-log+prd，附件/授权/归档/部分失败事实真实，ordinary/mini-task 保持兼容。"}`
- **semantic_review_status**：incomplete
- **semantic_review_ref**：`specs/workflowhub-build-prd/plan.md#Phase-P4`
- **semantic_review_reason**：等待 build-code Phase 独立 review；未执行不得 completed。
- **evidence_path**：`quality/tests/P4-close.json`
- **STOP**：mode 不能贯穿 prepare/inspect/execute、需假 verify facts 或任何不可逆动作无独立授权时停止。
- **recovery**：回滚 planning 分支/CLI 参数/move-map 当前登记；不 cleanup 实际数据。
- **task risk**：旧 boolean caller 兼容或 mode 写入/回验漂移。
- **test tier / test method**：fullstack / fullstack-slice-testing。
- **scenarios / commands / expected exit / oracle**：与 T007 完全相同；同 gate/oracle identity，保留负例。
- **fixtures_services**：与 T007 相同。
- **coverage limits**：不把受控 fixture 当真实远端物理成功。
- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）
- [ ] **任务完成**
- **status**：`in_progress`
- **actual_changes**：已在 `core/task-close.mjs` 的唯一 delivery path 增加显式 `close_mode=planning`：在四材料/current verify/product-release 读取前只读取 `decision-log.md` 与 `prd.md`，绑定规划材料 revision、snapshot、逐项附件 hash 与归档 hash；planning confirmation/irreversible authorization 使用 canonical planning records；completion/status 分列 `planning/material/development/quality`，ordinary/mini-task/manual-risk-close 保持原路径。`tools/cli/task-close.mjs` 复用同一入口并接受 `--mode`/`--close-mode` 与 `--required-attachments`；`docs/architecture/move-map.json` 登记新增 consumer/owner/delete condition；新增 `tests/integration/build-prd-delivery.test.mjs` 覆盖完整、缺附件、独立动作授权与归档读回。独立 Phase review 尚未形成，因此不标记 completed。
- **executed_commands**：`npx --no-install vitest run tests/integration/build-prd-delivery.test.mjs --poolOptions=forks.singleFork --no-fileParallelism`（exit 0，1 file / 3 tests passed，13.7s）；`npx --no-install vitest run tests/integration/vnext-delivery-close.test.mjs tests/contract/close-sidecar-and-archive.test.mjs --poolOptions=forks.singleFork --no-fileParallelism`（exit 0，2 files / 43 tests passed，539.54s）；P4 `core/task-close.mjs`、`tools/cli/task-close.mjs`、integration test `node --check` 通过；`git diff --check` 通过。
- **evidence_refs**：Current P4 focused GREEN receipt `quality/tests/P4-close-current.json` (`receipt_hash=8b603ddece9801a4ebbe0456bac5dc66e74294acaa951cf8b77274cf9b7f43d2`, `output_hash=e1408b417b3425792b3551040b433a355309a95e8478da207a2c0e6da86a9ae1`, `snapshot_tree=105998e41d16c69876844c60fcd95a9d8dc2ac99`) and focused compatibility stdout (62/62). Historical `quality/tests/P4-close.json` remains the earlier missing-target/setup fact and is not replaced by a receipt claim. Current Phase review attempt is `quality/reviews/attempts/200e071e-be99-5c99-ada7-27e32f52a17a/attempt.json` (`sha256=6df38fc83d67530feaa75d023d984a73fbbc5f9f338448bb0aa4fe00d0eb2939`), terminal status `unavailable`, reason `REVIEW_EXECUTION_CANCELLED`; it is a quality limitation, not a GREEN claim.
- **covered_ac**：AC-PRD-008, AC-PRD-009 targeted implementation behavior is GREEN for planning material binding, attachment/hash failure, independent operation authorization, physical archive and archive readback; development remains `not_executed`, quality remains `not_run` for planning mode; real remote/provider/UI actions were not performed.
- **review_fact**：独立 build-code Phase review was attempted through public `review --action=record` and recorded as unavailable; no semantic provider result exists. Stage-end analysis/reflection and real provider/host evidence remain pending; quality claim is still `incomplete`.
- **completed_at**：N/A — not completed
- **执行事实**：T008 implementation GREEN and ordinary/mini-task compatibility checks passed. The current P4 Phase review was attempted via the existing public route; the configured provider process produced no terminal output and was cancelled after the bounded wait. The resulting canonical unavailable attempt is preserved with `coverage=incomplete`; no finding was invented and no provider pass is claimed. T009 current aggregate, stage-end analysis, integration review, and reflection remain the next build-code facts. No commit, merge, push, cleanup, archive, or close action was authorized.

#### T009 — FINAL：当前快照 aggregate acceptance
- **ID**：T009
- **Phase**：Phase P4 — planning close、归档读回与最终聚合
- **goal**：一次执行四个targeted测试，聚合仓内合同结果，并将真实宿主/UI/provider/远端动作事实分别标为available、unavailable或incomplete。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-build-prd/spec.md","hash":"44705bd9ba58d45f917840f1e173f67d80d7fa1c4c291337ff4885bf2bbf689c","id":"SPEC-workflowhub-build-prd"},{"artifact_kind":"plan","ref":"specs/workflowhub-build-prd/plan.md","hash":"efbfd46bf3e91b8afe59552413714bbd1ce90c783f8ce754b945619e605efb32","id":"PLAN-workflowhub-build-prd"}]`
- **source_refs / decision_refs**：R1-R15; D1-D53 → all FR; AC-PRD-001 through AC-PRD-010
- **输入**：T002/T004/T006/T008 的真实实现、targeted evidence、Phase reviews 与当前快照。
- **依赖**：T002, T004, T006, T008
- **并行**：否 — aggregate 读取全部前序事实且只运行一次。
- **FR**：FR-INTENT-001, FR-INTENT-002, FR-INTENT-003, FR-MAP-001, FR-MAP-002, FR-MAP-003, FR-DESIGN-001, FR-DESIGN-002, FR-ORCH-001, FR-ORCH-002, FR-ORCH-003, FR-PRD-001, FR-PRD-002, FR-PRD-003, FR-QUALITY-001, FR-QUALITY-002, FR-QUALITY-003, FR-PORT-001, FR-MAINT-001, FR-MAINT-002, FR-DELIVERY-001, FR-DELIVERY-002, FR-DELIVERY-003
- **AC**：AC-PRD-001, AC-PRD-002, AC-PRD-003, AC-PRD-004, AC-PRD-005, AC-PRD-006, AC-PRD-007, AC-PRD-008, AC-PRD-009, AC-PRD-010
- **动作**：只运行一次合并targeted命令并采集原stdout/stderr；adapter对每个AC输出仓内contract expected/actual及外部事实状态。AC-PRD-003/005/007没有真实UI展示、provider和目标宿主调用证据时必须为unavailable/incomplete，不得由fixture写passed；不新建状态权威。
- **精确文件**：`tests/integration/build-prd-delivery.test.mjs`
- **boundary**：files: `tests/integration/build-prd-delivery.test.mjs`; symbols/regions: final acceptance JSON adapter/aggregate fixture only
- **输出**：当前快照四套 targeted 测试和逐 AC 结构化比较事实。
- **Knowledge**：测试通过不等于真实 provider/宿主/UI工具/远端物理操作已执行；缺项保持 unavailable/incomplete。
- **verification_role**：N/A — non-behavior aggregate verification
- **paired_task**：N/A — aggregate has no RED/GREEN pair
- **gate_cmd**：`npx --no-install vitest run tests/integration/distribution-closure.test.mjs tests/contract/spec-prd-skill-contract.test.mjs tests/contract/build-prd-review-contract.test.mjs tests/integration/build-prd-delivery.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：0
- **oracle**：`ORACLE-FINAL {"pass":"四个targeted文件同一快照退出0；仓内合同expected/actual逐AC可比较；外部宿主、UI、provider和远端动作另列available/unavailable/incomplete且不影响canonical stage/material/history边界。"}`
- **evidence_path**：`quality/tests/final-build-prd.json`
- **STOP**：任一命令不可执行、AC 缺失/重复、JSON 无效/超时/取消、断言失败、快照变化、越界或需新决定时停止回受影响 task/owner。
- **recovery**：verify-code 保留原输出，定位到对应 paired task 修复后只按当前快照重跑最终 aggregate；不以全量测试掩盖。
- **task risk**：聚合通过掩盖外部 unavailable，或 assertions 自报 passed 而无 expected/actual。
- **test tier / test method**：fullstack / fullstack-slice-testing；non_ui 跨模块 command aggregate。
- **scenarios / commands / expected exit / oracle**：四个子合同成功/失败/取消/错版/缺源/partial/归档 seam；命令如上；exit 0；ORACLE-FINAL。
- **fixtures_services**：四个测试自管临时 fixture/服务/清理；aggregate 不共享可变 fixture；无网络/browser。
- **coverage limits**：不运行全量回归、真实 provider、真实 UI 浏览器、真实远端 Git；这些必须单列真实事实。
- **acceptance_role**：acceptance
- **ui_scope**：non_ui
- **acceptance_data**：`[{"source":"current authenticated worktree","sample":"build-prd four targeted Vitest files via structured acceptance adapter","scenario":"portable discovery, spec-prd content/UI contract, non-stage review, and planning close aggregate","tier":"command","execution":{"command":"node","args":["tests/acceptance/build-prd-current.mjs"],"timeout_ms":120000}}]`
- **e2e_scope**：not_required

##### 执行状态填写区（唯一完成权威）
- [ ] **任务完成**
- **status**：`in_progress`
- **actual_changes**：发现原 acceptance command 直接输出 Vitest 文本，无法满足 runtime 要求的逐 AC JSON；新增 `tests/acceptance/build-prd-current.mjs` 作为 task-local command adapter，仍执行同一四文件 targeted aggregate，并为每个 AC 输出运行时 derived 的 expected/actual。2026-09-10 在当前工作树重新执行同一 aggregate，并通过 public `verify --action=execute` 写入当前 receipt；同时通过 Stage Agent bridge 写入当前不完整 build-code outcome，并用 canonical implementation receipt producer 重新绑定当前实现。
- **executed_commands**：`npx --no-install vitest run tests/integration/distribution-closure.test.mjs tests/contract/spec-prd-skill-contract.test.mjs tests/contract/build-prd-review-contract.test.mjs tests/integration/build-prd-delivery.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`（exit 0；4 files / 45 tests passed；当前 receipt 为 `quality/tests/final-build-prd-current-19.json`）；官方 `stage-runtime.mjs run --action=execute --stage=build-code` exit 0，返回 `status=in_progress`、`quality_status=incomplete`。
- **evidence_refs**：当前 receipt `quality/tests/final-build-prd-current-19.json` (`receipt_hash=e3a0290c65b745f58a403732e80263d5dfbf6e4e76231c3101cee60f411c4e3e`, `output_hash=07deafbb6266f4a3d37bfbf152884d2d6b92d5595acd6b29f0987d7a2d60f239`, `snapshot_tree=8067cc490ef94b61620ee1ca6d95894e64117a1d`, `snapshot_commit=7879b6a1016b635947af70eb13d85825469d2745`, `source_digest=ccac2e0bca05ba6e58fd6a1268beae32fbac73cf9c1b2ecfd997b73d2c2f5ad5`)；canonical implementation receipt `quality/evidence/implementation/13f33f443123db88c49c5475ce18145c7a246643eca5d493ea3d8107226ec303.json` (`sha256=13f33f443123db88c49c5475ce18145c7a246643eca5d493ea3d8107226ec303`, 同一 snapshot)；当前 bridge outcome `quality/evidence/stage-outcomes/build-code/138d7b32a9db5d4f5fcc08819d75f6830bb4c5b3a9e091949e7af60e06aaf9ed.json` (`sha256=138d7b32a9db5d4f5fcc08819d75f6830bb4c5b3a9e091949e7af60e06aaf9ed`, `status=incomplete`, 同一 snapshot)。历史 receipt 与 `quality/tests/final-build-prd.json` 保留为历史/不完整事实，不替代当前证据。
- **covered_ac**：AC-PRD-001–010 have current targeted contract/aggregate assertions; external provider, UI/browser, remote Git, and physical delivery facts remain `unavailable`/`not_applicable` per the task contract rather than being inferred from fixture tests.
- **review_fact**：The previous aggregate is retained as historical test evidence but no longer proves the current snapshot. The current bridge outcome is intentionally `incomplete`; official build-code still reports missing `stage_end_spec_analyze`, `finding_dispositions`, and `integration_review`. The verify-code review result is unavailable for the current snapshot; no provider pass or formal integration review is claimed.
- **completed_at**：N/A — not completed; current aggregate/test receipt is green but quality facts are incomplete.
- **执行事实**：The current aggregate passed all four requested files on snapshot `8067cc490ef94b61620ee1ca6d95894e64117a1d` and records 45 tests. Official build-code accepted the current implementation/test/stage-outcome bindings but returned `quality_status=incomplete`; no external provider/browser/remote operation was executed or claimed. No commit, merge, push, cleanup, archive, or close action was authorized.

### Verify
T007/T008 同命令 `npx --no-install vitest run tests/integration/build-prd-delivery.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`，`ORACLE-P4-CLOSE`，1→0；T009 使用四文件合并命令，expected=0，`ORACLE-FINAL`，证据 `quality/tests/final-build-prd.json`。

### Knowledge
planning complete 不等于 development complete；PRD 随母目录归档；必要附件逐一核实；commit/merge/archive/push/cleanup 每项仍需现有独立授权。

### STOP
缺 prd/decision/附件、mode 漂移、需要伪造 spec/plan/tasks/verify facts、旧材料写入、命令不可执行或任一 AC 无 assertion 时停止回对应 owner。

### Done
T009 唯一 acceptance card 的 command 输出 JSON 对每个 AC 恰好一项 assertions，保存原 stdout/stderr/ref/hash；review/confirmation/物理失败如实分列。未运行前所有卡保持 pending。

### Risks and rollback
风险是 ordinary/mini-task close 回归或归档错路径；回滚 planning mode 分支与 CLI 参数，保留测试失败/授权事实，不清理用户数据。

## 4. Final current-snapshot aggregate strategy

- **tier / method**：fullstack / fullstack-slice-testing；non_ui command aggregate。
- **scenarios**：AC-PRD-001–010；成功、缺源、取消/未答/错版、provider partial/unavailable、第六 stage/第五材料、附件/授权/物理部分失败、跨 portable→writer→review→close seam。
- **command**：`npx --no-install vitest run tests/integration/distribution-closure.test.mjs tests/contract/spec-prd-skill-contract.test.mjs tests/contract/build-prd-review-contract.test.mjs tests/integration/build-prd-delivery.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected exit**：0
- **oracle**：`ORACLE-FINAL {"pass":"四个targeted文件同一快照退出0；仓内合同expected/actual逐AC可比较；外部宿主、UI、provider和远端动作另列available/unavailable/incomplete且不影响canonical stage/material/history边界。"}`
- **fixtures_services**：各测试自管 temp repo/release/bundle/Markdown fixture 与清理；无网络/browser。
- **evidence_path**：`quality/tests/final-build-prd.json`
- **coverage limits**：不运行全量回归、真实 provider/UI browser/remote Git；缺失事实保持 unavailable。
- **STOP**：命令损坏、AC 缺失/重复、无效 JSON、快照变化、越界或需要新产品决定。
- **execution_contract**：当前快照只运行一次；失败保留原始输出并回受影响 paired task，不用全量重跑掩盖。

## Dependency Graph

- **order**：T001 → T002 → T003 → T004 → T005 → T006 → T007 → T008 → T009

```text
T001 (RED) → T002 (GREEN) → T003 (RED) → T004 (GREEN) → T005 (RED) → T006 (GREEN) → T007 (RED) → T008 (GREEN) → T009 (FINAL acceptance)
```

## Final Boundary Check

- [ ] plan 恰有 13 个命名主 sections，随后直接 Phases；没有第二个 Phases wrapper。
- [ ] plan/tasks Phase heading 与 Files body 逐字节相同；每 Phase 恰有 Goal/Files/Tasks/Verify/Knowledge/STOP/Done/Risks and rollback 八块。
- [ ] 每卡一个数字 T ID、一个完成区；所有 status 均为 pending，未写执行事实。
- [ ] 四对 RED/GREEN reciprocal：同 Phase/FR/AC/gate/oracle identity/evidence path，GREEN 依赖 RED。
- [ ] 所有 23 FR 与 10 AC 至少有一对行为任务覆盖；T009 聚合全部 AC。
- [ ] oracle 是 `ORACLE-ID {JSON}`；RED 有 reject 三段；RED/GREEN 有 semantic_review 三字段。
- [ ] 唯一最终 acceptance card 为 T009，`ui_scope=non_ui`、`e2e_scope=not_required` 且 acceptance_data 为 command execution。
- [ ] 不扩 canonical STAGES、CURRENT_MATERIAL_FILES，不写历史材料，不运行测试、不宣称 review/确认/交付完成。

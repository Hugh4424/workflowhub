# 实现计划：build-prd portable workflow

- **Input**：`specs/workflowhub-build-prd/decision-log.md@92caba276e86f9cb95220bfe5f0ef176b6dbc7db1e35152ce8718014c45e1600`、`specs/workflowhub-build-prd/spec.md@44705bd9ba58d45f917840f1e173f67d80d7fa1c4c291337ff4885bf2bbf689c`
- **Template version**：`plan-task.v4`
- **Status**：正式 build-plan 材料；任务均为 pending，未执行测试、实现、Git 或物理动作。

## Quick Read

- **Goal**：在不改变五个 canonical stages 和四份当前材料的前提下，交付可由现有发现/分发链调用的 `build-prd` portable workflow、唯一正式内容技能 `spec-prd`、专属非 stage 审查面，以及复用现有 task-close 的 planning mode。
- **Non-goals**：来源：D2/D3/D4/D39/D50；不新增 formal stage、公共命令、第五当前材料、历史材料 writer、第二 close/review/distribution 控制面、业务页面、自动批量开工或持续看板（D2/D3/D4/D39/D50）。
- **Before**：catalog/release closure只识别五stage或standalone skill；`workflows/`目录会被closure误当stage；仓内没有可证明外部宿主实际调用的adapter；F7 UI确认owner只有build-spec；wh-review非stage面只支持mini-task两类；task-close在mode选择前即读取四材料和verify事实。
- **After**：build-prd以portable workflow身份进入catalog/manifest/release供宿主发现；实际宿主调用由逐目标宿主验收事实证明，仓内打包不得冒充调用成功。spec-prd两步产出单一PRD；wh-review扩完整非stage routing/semantic projection；task-close在workspace/material/verify读取前选择planning mode并保持物理授权独立。
- **Main risk**：把 portable workflow 错加到任何 canonical `STAGES`/`CURRENT_MATERIAL_FILES`，或为规划完成伪造 spec/plan/tasks、review pass、用户确认和物理交付成功。
- **Next step**：build-code 先执行 T001 的 targeted RED；若发现必须扩 canonical stage/material 集，立即 STOP 回当前 plan/spec，而不是实现绕过。

## Technical Context

### Global Constraints

- **Verified facts**：正式 stage 固定 `make-decision/build-spec/build-plan/build-code/verify-code`；当前材料固定 `decision-log.md/spec.md/plan.md/tasks.md`；build-prd 是 portable workflow；spec-prd 是唯一 PRD 正文 writer；能力自身 `non_ui`，但 workflow 必须条件处理其规划对象的 UI。
- **Language / runtime**：Node.js ESM、Vitest、YAML/JSON/Markdown bundle；版本沿仓库当前 package/lock，不新增依赖。
- **Primary dependencies**：复用 registry、catalog、repo-skills manifest generator、skill closure/release、build-spec 现有 UI readiness/render/confirmation 语义、wh-review broker/material bundle、task-close prepare/execute/archive。
- **Storage / state**：PRD 位于母任务 `specs/<task-id>/prd.md` 并随目录归档；它是 portable workflow 产物与后续任务来源，不加入 `CURRENT_MATERIAL_FILES`；执行/质量事实仍写既有 task store。
- **Testing**：仅设计四个 targeted Vitest 文件；本 build-plan 草案不执行测试。命令固定 single-fork/no-file-parallelism，证据目标位于 task-relative `quality/tests/`。
- **Target environment**：WorkflowHub 本地包与现有 portable Skill Bundle 分发目标；独立 spec-prd 调用允许显式输入及仅返回正文。
- **Scale / scope**：7 个新增生产文件、4 个 targeted test 文件（3 新 1 改）、既有 registry/catalog/manifest/distribution/review/close/governance 的窄适配。
- **Unresolved facts**：OPEN-001 owner=技能分发接线与验收责任角色；trigger=逐个声明的目标宿主执行真实发现/调用检查；consumer/handoff=build-prd分发适配者和最终验收汇总；close=全部目标宿主有成功实录，retain=任一未覆盖或不可用时保留宿主清单、`unavailable`原因和后续owner。真实provider/UI工具可用性同样只在实施/验收产生事实，不得退化为假通过。

## Code Anchors

- **Verified anchors**：`core/dispatch-component.mjs:10-47`只执行Node组件而不能调用Markdown workflow；`runtime/evidence/check-skill-closure.mjs:165-223`与`runtime/distribution/skill-bundle-release.mjs:12,93-110`负责静态closure/release；`workflows/build-spec/SKILL.md:106-173`为UI确认先例；`runtime/review/review-policy.mjs:3-9`、`skills/wh-review/scripts/review-materials.mjs:940-1046,2071-2078`、`third-review-host-config.mjs:199,373-395,430-438,539`和`review-semantic-projection.mjs:22`是非stage审查完整锚点；`core/task-close.mjs:1511-1779`在mode前读取四材料并在inspect/complete消费verify freshness；`runtime/task/material-workspace.mjs:6`固定四材料。
- **Existing interfaces**：catalog/repo manifest/skill bundle提供静态发现与打包，不证明外部宿主调用；wh-review的mini-task kind提供非stage routing形状；task-close现有prepare/validate/inspect/complete与focused seam必须整体分支；真实宿主调用只能由目标宿主adapter实录或unavailable事实证明。
- **Read now**：上述锚点、`skills/spec-plan`/`skills/spec-tasks` v4 contract、当前 decision/spec、`constitution-checklist.md`。
- **Must read before task**：每卡 `boundary` 中的目标符号及对应现有 fixture；T007 前重读 task-close archive/material/authorization 分支。
- **Context mode**：Full — 横跨发现、内容、审查、close 四个 seam，但每 Phase 文件互斥且只跑 targeted tests。

### Reuse → Extend → New

| Capability | Decision | Existing anchor | Reason / removal condition |
| --- | --- | --- | --- |
| workflow discovery/release | extend | `config/workflowhub.yaml`; `check-skill-closure.mjs`; `skill-bundle-release.mjs` | 区分 portable workflow 与 formal stage；删除条件是统一声明式 workflow-kind 完全替代该窄分支 |
| PRD content owner | new | `skills/spec-plan`, `skills/spec-tasks` 的两步/投影方法 | consumer=build-prd与独立调用方；owner=spec-prd；test=T003/T004；若现有单技能可同等承接且无消费者则删除 |
| UI design confirmation | extend | `workflows/build-spec/SKILL.md:106-173`; F7 | 复用显示前确认、版本绑定、取消/未答事实，不造 UI 引擎 |
| PRD review | extend | wh-review mini-task non-stage surface | 专属材料合同但同 broker；删除条件=build-prd consumer 移除 |
| physical close | extend | `prepareDeliveryClosePlan` | 显式 planning mode 复用同一 close；删除条件=规划支线移除且无历史只读消费 |

## Solution Design

### Overview

发现链新增一种声明式 portable workflow 分类：`build-prd` 有三件套和 registry 项，但永远不进入 formal stage manifests、stage completion、stage reflection stage 集或 `CURRENT_MATERIAL_FILES`。release 收集其三件套与 `skill-deps.yaml` 声明的技能闭包；catalog/reuse/manifest 保持同源投影。

`build-prd` 只绑定当前母决定、调度条件研究/澄清/UI链、展示与真实问答、调用一次 review/analyze/reflection 并报告事实。`spec-prd` 独占 `prd.md` 模板和正文写入：调用一先返回大纲与结果导向地图，用户核对后调用二展开完整卡；方向缺口回 make-decision，独立调用缺输入时列具体缺口。

UI 规划对象复用 build-spec 已有 readiness/render/display-before-reply 语义并由 F7 明确 planning branch owner；非 UI 写明不适用。审查通过 wh-review 顶层非 stage surface 选择专属 build-prd contract，同一完整 PRD 只发一次 provider review；partial/unavailable 保真。最终 planning close 通过现有 task-close 显式 mode 选择 `decision-log.md`+`prd.md`，归档整个母目录，逐动作仍需独立授权。

### Module responsibilities

#### Portable workflow declaration
- **Responsibility**：发现、依赖闭包和执行说明；保持 formal stage 集为五。
- **Consumes**：registry/catalog/workflow三件套。
- **Produces**：可验证 release closure 与宿主可发现入口。
- **Must not decide**：stage progression、产品方向或完成质量。

#### spec-prd
- **Responsibility**：唯一大纲/地图/完整 PRD 内容 owner。
- **Consumes**：已确认 decision、必要来源、设计/确认 refs。
- **Produces**：同一 `prd.md` 或独立调用正文。
- **Must not decide**：新产品方向、工程 plan/tasks、物理授权。

#### wh-review build-prd surface
- **Responsibility**：一次完整 PRD 独立 findings advice。
- **Consumes**：专属 allowlist 材料及 lens closure。
- **Produces**：report-only/provider-fact findings；canonical formal-stage attempt/result remains unavailable and is never fabricated。
- **Must not decide**：pass gate、stage identity、用户确认。

#### task-close planning mode
- **Responsibility**：规划材料的物理 commit/merge/archive/push/cleanup 计划与事实。
- **Consumes**：显式 mode、decision-log/prd、附件、每动作授权。
- **Produces**：既有 close plan/result。
- **Must not decide**：开发已完成、质量已通过或五阶段已执行。

### Interfaces, data, and lifecycle

- **Interfaces / schemas**：portable kind 只扩既有 registry/catalog/release 内部分类；wh-review 使用现有 `review_kind` 风格 sibling；close 使用显式 `closeMode: ordinary|mini-task|planning`（最终命名以现符号最小兼容为准），不增加公共 behavior。
- **Data flow / state**：decision → outline/map → map confirmation → conditional UI grouped confirmation → detailed PRD → one review/disposition → analyze/reflection → final confirmation → delivery plan/result；取消、未答、错版本、缺附件、provider/物理失败保持原状态。
- **API contract**：N/A — 无网络 API；CLI 仍为现有 `task-close`，只接显式 planning mode 参数或内部 adapter。
- **UI / external code**：能力本身 non_ui；规划对象为 UI 时绑定真实 preview/design revision、分组、viewport/state 覆盖、`display_before_reply` 与 `human_approved`；无真实工具时可外部交接但不得伪造返回。
- **Fail-loud behavior**：portable workflow 被归入 formal stage、缺 decision/source、多人写正式稿、无效 review surface、planning close 缺 prd/附件/授权时返回具体错误/不完整事实。

### UI Delivery Contract

- **UI applicability**：`non_ui` — 本任务不新增产品页面；仅修改技能/治理/运行合同文本与非 UI Node 行为。
- **Component action**：N/A — 无组件改动。
- **Real consumer**：build-prd 对未来 UI 规划对象的条件设计链。
- **State owner / Typed ViewModel / CSS/token owner**：N/A — 无本任务 UI 状态或样式。
- **Fixture / viewport**：合同 fixture 覆盖 UI/non_ui、错 revision、取消、未答；无浏览器 viewport。
- **Browser / a11y / performance / Screenshot handoff**：N/A — non_ui；不运行浏览器或截图。
- **Coverage limits**：不证明具体未来项目的视觉质量或宿主设计工具可用性。

## File Boundary

### NEW
- `workflows/build-prd/SKILL.md`
- `workflows/build-prd/skill-deps.yaml`
- `workflows/build-prd/steps.json`
- `skills/spec-prd/SKILL.md`
- `skills/spec-prd/skill-bundle.json`
- `skills/spec-prd/templates/prd-template.md`
- `skills/wh-review/contracts/build-prd.md`
- `tests/contract/spec-prd-skill-contract.test.mjs`
- `tests/contract/build-prd-review-contract.test.mjs`
- `tests/integration/build-prd-delivery.test.mjs`

### MODIFY
- `config/workflowhub.yaml`
- `skills/catalog.yaml`
- `skills/reuse-registry.md`
- `repo-skills.manifest.json`
- `runtime/evidence/check-skill-closure.mjs`
- `runtime/distribution/skill-bundle-release.mjs`
- `tests/integration/distribution-closure.test.mjs`
- `CONSTITUTION.md`
- `constitution-checklist.md`
- `skills/wh-review/stage-skill-plan.json`
- `skills/wh-review/manifest.json`
- `runtime/review/stage-materials.json`
- `runtime/review/review-policy.mjs`
- `skills/wh-review/scripts/review-materials.mjs`
- `skills/wh-review/scripts/third-review-host-config.mjs`
- `skills/wh-review/scripts/review-semantic-projection.mjs`
- `skills/wh-review/skill-bundle.json`
- `core/task-close.mjs`
- `tools/cli/task-close.mjs`
- `docs/architecture/move-map.json`

### DO NOT TOUCH
- `runtime/task/material-workspace.mjs` — 禁止扩 `CURRENT_MATERIAL_FILES`。
- 所有 canonical `STAGES`/`FORMAL_STAGES` 常量与五阶段 manifest — build-prd 非 stage。
- `specs/archive/**`、旧 task/review/receipt/snapshot — 历史只读。
- `specs/workflowhub-build-prd/decision-log.md`、`spec.md` — 本实施只消费当前批准产品合同。

## Technical Decisions

### DEC-001 — portable workflow 与 formal stage 分型
- **Problem**：当前 closure 把 `workflows/*/SKILL.md` 视为 stage，而 release 又硬编码五 stage。
- **Options**：把 build-prd 加 STAGES；移到 skills；窄扩 workflow-kind。
- **Selected**：extend — 保留 `workflows/build-prd` 三件套并显式分类 portable。
- **Reason**：满足发现/分发又不破坏 canonical stage 语义。
- **Consequence / risk**：catalog/registry/release 必须同步；遗漏会 fail-loud。
- **Fallback**：回滚 portable 声明和新增三件套，不改变五阶段。
- **F10 disposition**：keep — 真实防止第六 stage 污染，测试覆盖。

### DEC-002 — 单一 spec-prd 内容技能
- **Problem**：地图和正文若多 owner 会漂移，若塞进 build-prd 会上下文膨胀。
- **Options**：肥 workflow；两个 writer；单 skill 内两步。
- **Selected**：new — spec-prd 内 outline/map 与 detail 两步。
- **Reason**：最少 owner 且可独立搬运。
- **Consequence / risk**：必须验证同版输入和单 writer。
- **Fallback**：删除 skill/登记，保留原 decision/spec。
- **F10 real threat**：多作者正文漂移与接力漏项。
- **F10 existing cover**：spec-plan/spec-tasks 仅工程材料，不能写母 PRD。
- **F10 bypassable**：调用方可绕过 workflow 直接调用，故 skill 自身校验输入。
- **F10 maintenance cost**：一套 SKILL/bundle/template。
- **F10 disposition**：keep。

### DEC-003 — wh-review 非 stage sibling
- **Problem**：build-prd 需要专属一次审查但不能冒充 stage。
- **Options**：加入 stages；复用 build-plan 假材料；新增非 stage review_kind。
- **Selected**：extend — 仿 mini-task 顶层 sibling。
- **Reason**：复用 broker/provenance 且身份真实。
- **Consequence / risk**：contract/material/profile/bundle hash 联动。
- **Fallback**：撤销 sibling，保留 unavailable，不改 provider 引擎。
- **F10 disposition**：keep。

### DEC-004 — task-close 显式 planning mode
- **Problem**：普通 close 无条件读四材料并推导五阶段质量。
- **Options**：第二 close；伪造四材料；扩现有 mode。
- **Selected**：extend — 同一入口选择 planning material set。
- **Reason**：物理交付统一且不制造历史/质量假象。
- **Consequence / risk**：mode 必须贯穿 prepare/inspect/execute，ordinary/mini-task 不回归。
- **Fallback**：planning close 保持 unavailable，删除 mode 分支。
- **F10 disposition**：keep。

## Test Strategy

| Target | Task | Role | gate_cmd / expected_exit | Oracle / evidence_path |
| --- | --- | --- | --- | --- |
| FR-INTENT/ORCH/PORT/DELIVERY；AC-001/004/007/009/010 | T001/T002 | RED/GREEN | `npx --no-install vitest run tests/integration/distribution-closure.test.mjs --poolOptions.forks.singleFork --no-fileParallelism` / 1→0 | `ORACLE-P1-PORTABLE`; `quality/tests/P1-portable.json` |
| FR-MAP/DESIGN/PRD/MAINT；AC-002/003/006/008 | T003/T004 | RED/GREEN | `npx --no-install vitest run tests/contract/spec-prd-skill-contract.test.mjs --poolOptions.forks.singleFork --no-fileParallelism` / 1→0 | `ORACLE-P2-SPEC-PRD`; `quality/tests/P2-spec-prd.json` |
| FR-ORCH/QUALITY；AC-004/005 | T005/T006 | RED/GREEN | `npx --no-install vitest run tests/contract/build-prd-review-contract.test.mjs --poolOptions.forks.singleFork --no-fileParallelism` / 1→0 | `ORACLE-P3-REVIEW`; `quality/tests/P3-review.json` |
| FR-DELIVERY/MAINT；AC-008/009 | T007/T008 | RED/GREEN | `npx --no-install vitest run tests/integration/build-prd-delivery.test.mjs --poolOptions.forks.singleFork --no-fileParallelism` / 1→0 | `ORACLE-P4-CLOSE`; `quality/tests/P4-close.json` |
| 全部 FR/AC 与跨 seam | T009 | FINAL | 四文件合并 targeted command / 0 | `ORACLE-FINAL`; `quality/tests/final-build-prd.json` |

所有 RED/GREEN 对同一行为使用相同命令、oracle identity 和 task-relative evidence path；RED 仅接受目标断言失败，GREEN 保留负例。结构化 oracle、semantic review 状态、原 stdout/stderr 与逐 AC JSON assertion 由 tasks 卡约束。测试/review 只是事实，不是许可证。

## Rollback and Recovery

- **Global recovery rule**：只回滚受影响 Phase 的实现和 fixture；保留 decision/spec、原 review/provider/确认/失败事实及历史只读材料。
- **Irreversible boundaries**：commit/push/merge/archive/cleanup 均需现有独立授权；规划确认、review、测试不能代替。
- **Recovery owner**：build-code 修复实现/测试；产品方向冲突回 make-decision；规格语义缺口回 build-spec；计划边界/命令错误回 build-plan。

### Engineering Risk Handoff

- **Affected IDs**：PLAN-RISK-001（T001/T002，AC-PRD-007/009）；PLAN-RISK-002（T003/T004，AC-PRD-003）；PLAN-RISK-003（T005/T006，AC-PRD-005）；PLAN-RISK-004（T007–T009，AC-PRD-009）。
- **Trigger**：canonical stage/material 数量变化；UI 未答/取消/错版仍定稿；review unavailable 被写 pass；planning close 伪造开发或质量完成。
- **Consequence**：治理污染、确认失真、质量漂白或物理交付误报。
- **Mitigation or STOP**：以四组 RED/GREEN 负例固定边界；任一路径要求第六 stage、第五材料、第二 close/review、伪确认或假质量时 STOP。
- **Handling Stage**：实现问题由 build-code 修复，验证差异由 verify-code 处置；产品方向冲突回 make-decision，规格语义缺口回 build-spec，计划错误回 build-plan。
- **Verification**：ORACLE-P1-PORTABLE、ORACLE-P2-SPEC-PRD、ORACLE-P3-REVIEW、ORACLE-P4-CLOSE 与 ORACLE-FINAL 的 targeted 证据。

## Implementation Order

P1 先建立 portable discovery/closure 与 workflow 入口；P2 再提供唯一 content producer 与 F7/UI 合同；P3 依赖可识别的 workflow/spec-prd 建立非 stage review；P4 最后接 planning close 与 aggregate。四 Phase 因 producer→consumer 串行；各自 RED 必须先于 GREEN，T009 最后读取全部事实。

## Dependencies and Parallelism

- **Dependencies**：T001→T002→T003→T004→T005→T006→T007→T008→T009；串行理由是后一 seam 消费前一声明/内容/审查身份。
- **Parallel work**：N/A — 四 Phase 有概念依赖；虽文件互斥，避免在 producer contract 未冻结时并发猜接口。
- **External dependencies**：真实设计/provider/宿主发现可能 unavailable；合同实现仍可继续，最终事实必须分列覆盖限制。

## Requirement and Verification Traceability

| Source / decision | FR | AC | Phase / Task | Depends on | Exact files | Command / oracle |
| --- | --- | --- | --- | --- | --- | --- |
| R1/R3/R8/R10; D1/D4/D7/D22/D23 | FR-INTENT-001–003 | AC-PRD-001/010 | P1 T001/T002 | none/T001 | workflow/registry/catalog/closure files | distribution targeted / ORACLE-P1-PORTABLE |
| D37/D40/D42/D44/D47 | FR-ORCH-001–003, FR-PORT-001 | AC-PRD-004/007 | P1 T001/T002; P3 T005/T006 | prior pair | workflow/spec-prd/review files | P1+P3 targeted oracles |
| D5/D6/D15/D28/D40/D45 | FR-MAP-001–003 | AC-PRD-002 | P2 T003/T004 | T002 | spec-prd files | ORACLE-P2-SPEC-PRD |
| D24/D27/D29/D32/D33/D41 | FR-DESIGN-001–002 | AC-PRD-003 | P2 T003/T004 | T002 | spec-prd + F7 files | ORACLE-P2-SPEC-PRD |
| D9/D10/D21/D30/D35/D36 | FR-PRD-001–003 | AC-PRD-006 | P2 T003/T004 | T002 | template/skill files | ORACLE-P2-SPEC-PRD |
| D26/D31/D33/D43/D46 | FR-QUALITY-001–003 | AC-PRD-005 | P3 T005/T006 | T004 | wh-review files | ORACLE-P3-REVIEW |
| D11/D13/D17/D48/D52 | FR-MAINT-001–002 | AC-PRD-008 | P2 T003/T004; P4 T007/T008 | prior pair | template/close files | P2+P4 targeted oracles |
| D14/D16/D39/D50/D53 | FR-DELIVERY-001–003 | AC-PRD-009 | P1 T001/T002; P4 T007-T009 | all | registry/close/tests | ORACLE-P1-PORTABLE/ORACLE-P4-CLOSE/ORACLE-FINAL |

反向闭包：AC-001→INTENT；AC-002→MAP；AC-003→DESIGN；AC-004→ORCH；AC-005→QUALITY；AC-006→PRD；AC-007→PORT+discovery；AC-008→MAINT；AC-009→DELIVERY；AC-010→INTENT-003。全部 23 条 FR 与 10 条 AC 至少绑定一对 RED/GREEN，T009 聚合全部 AC。

## Governance Synchronization Matrix

| Governance surface | Actual files | Change / no change | Task IDs | Reason |
| --- | --- | --- | --- | --- |
| F7 planning/UI confirmation | `CONSTITUTION.md`, `constitution-checklist.md` | change | T003/T004 | 明确 build-prd 地图、条件 UI 分组、最终确认，不新增 non-UI 日常确认 |
| canonical stages/materials | `runtime/task/material-workspace.mjs`, canonical STAGES | no change | T001/T002/T007/T008 | build-prd 非 stage，prd 非第五材料 |
| architecture registration | `docs/architecture/move-map.json` | change | T007/T008 | 登记新增/修改生产文件 owner/consumer/test/delete condition |
| catalog/reuse/manifest | `skills/catalog.yaml`, `skills/reuse-registry.md`, `repo-skills.manifest.json` | change | T001/T002 | 发现与分发投影闭合 |
| review surface | wh-review contract/plan/manifest/material/bundle | change | T005/T006 | 非 stage sibling，复用单 broker |
| history | `specs/archive/**`, legacy task records | no change | all | 只读保留，不加 writer/branch |

## Constitution Check

- **Constitution binding**：`{"artifact_kind":"constitution","ref":"CONSTITUTION.md","hash":"e400d447d94a68fc629ac05acb23c807e34a5c929a5bd723c91c9b02dfc16732","id":"CONSTITUTION","version":"current","clause_count":22}`
- **F1**：build-prd 薄编排，长内容唯一 owner 为 spec-prd。
- **F2**：portable kind、review_kind、close mode 均为窄接口。
- **F3**：不扩四材料；prd 是规划产物，不替代正式材料。
- **F4**：一次独立 PRD review 只产 findings；同任务可修复。
- **F5**：不新增 gate。
- **F6**：沿用 task store/evidence，不建第二记录面。
- **F7**：显式同步 planning branch 三类确认与条件 UI 版本绑定；物理动作另授权。
- **F8**：复用 closure/broker/close，不造第二 dispatcher。
- **F9**：missing/partial/unavailable/未答/失败均 fail-loud，不假绿。
- **F10**：仅四个 targeted tests 与必要分型，无额外平台。
- **F11**：新增件均有 owner/consumer/test/delete condition；辅助事实不阻断安全修复。
- **Q1**：最终完成需真实测试、逐 AC、review/用户确认事实；草案不宣称执行。
- **Q2**：工作资格、publication、质量完成、物理授权分离。
- **Q3**：wh-review 独立 provider 与人工确认，不自审自判。
- **S1**：优先复用现有研究/澄清/UI/review/analyze/reflection/close。
- **S2**：只做 WorkflowHub 合宪适配。
- **S3**：catalog 来源与 update policy 同步。
- **S4**：spec-prd 指标沿统一 stage/skill 事实与 targeted test，不建新指标 store。
- **S5**：spec-prd 可独立上下文调用，主会话只收版本/摘要/ref。
- **S6**：沿用已核 Spec Kit/Superpowers 方法研究结论，不闭门新造双 writer。
- **S7**：一 portable workflow 一目录；不假称第六 stage。
- **S8**：bundle closure 含 SKILL/template，独立输入完整时可搬运调用。

## Phase P1 — Portable 发现、编排与分发闭包

### Goal
build-prd 可由现有 registry/catalog/release 发现并携带完整依赖闭包，同时 formal stage 仍恰好五个且 workflow 只编排不写正式长文。

### Files
- **NEW**：`workflows/build-prd/SKILL.md`, `workflows/build-prd/skill-deps.yaml`, `workflows/build-prd/steps.json`
- **MODIFY**：`config/workflowhub.yaml`, `skills/catalog.yaml`, `skills/reuse-registry.md`, `repo-skills.manifest.json`, `runtime/evidence/check-skill-closure.mjs`, `runtime/distribution/skill-bundle-release.mjs`, `tests/integration/distribution-closure.test.mjs`, `docs/architecture/move-map.json`
- **DO NOT TOUCH**：canonical `STAGES`/`FORMAL_STAGES` 与 `runtime/task/material-workspace.mjs`; 禁止把 build-prd 当第六 stage 或把 prd 加入四材料。

### Tasks
- T001 — RED：以 targeted closure 断言固定 portable 身份、发现、薄编排、独立输入及五 stage 不变。
- T002 — GREEN：新增三件套并窄扩 registry/catalog/manifest/closure/release 使同一 oracle 通过。

### Verify
同一命令 `npx --no-install vitest run tests/integration/distribution-closure.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`；RED expected=1，GREEN expected=0；`ORACLE-P1-PORTABLE`；证据 `quality/tests/P1-portable.json`。

### Knowledge
portable workflow 必须有 registry 与 release consumer，但不得进入 stage completion/reflection/material contracts；repo manifest 由既有 generator 刷新。

### STOP
任何实现要求扩 canonical stage 集、公共命令、CURRENT_MATERIAL_FILES、隐式目录扫描或第二分发器时停止回 plan/spec。

### Done
真实 RED/GREEN、closure 文件清单/hash、OPEN-001逐目标宿主覆盖清单（owner=分发接线与验收责任角色；未覆盖项保留unavailable及handoff）、S01–S06 expected/actual、负例（第六stage、第五材料、缺bundle/registry）和AC-001/004/007/009/010覆盖均有证据；未执行则只可报pending。

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
- T003 — RED：固定两步单 writer、需求/依赖闭包、UI 版本确认、独立调用与维护失败反例。
- T004 — GREEN：实现 spec-prd bundle/template 并同步 F7，使同一 oracle 正负场景通过。

### Verify
同一命令 `npx --no-install vitest run tests/contract/spec-prd-skill-contract.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`；RED=1，GREEN=0；`ORACLE-P2-SPEC-PRD`；证据 `quality/tests/P2-spec-prd.json`。

### Knowledge
正式 PRD 只有 spec-prd 可写；地图变化只重核受影响范围；未答/取消/错版保持草稿；归档方向/验收变化先真确认并写变更说明。

### STOP
若缺失决定必须猜产品方向、要让 build-spec 补母需求、需要多人并写正文或需要本任务新增 UI 页面/设计引擎，停止回 owner。

### Done
AC-002/003/006/008及对应MAP/DESIGN/PRD/MAINT全覆盖；独立调用完整/缺输入、UI/non_ui、项目规范缺失时任务级基线与规范责任卡consumer/oracle、最终稿拒绝、取消/未答/错版、补齐后再次调用只重做受影响范围、失效引用均有真实targeted结果。

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
- T005 — RED：固定非 stage identity、专属材料 allowlist、一次审查、partial/unavailable 与有界争议负例。
- T006 — GREEN：扩 sibling surface/contract/material bundle/hash，使同一 oracle 通过且不改变 stage routes。

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
- T007 — RED：固定 planning mode 材料集、附件/授权/部分失败/归档读回和普通模式兼容失败断言。
- T008 — GREEN：窄扩现有 close mode 并登记 move-map，使同一 oracle 通过。
- T009 — FINAL：一次运行四文件 targeted aggregate，按结构化 command JSON 覆盖全部 FR/AC 和跨 seam。

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
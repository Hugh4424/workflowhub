# 任务清单：M15 流程退化与成本诊断看板

- **Input**：`specs/m15-process-degradation-dashboard/decision-log.md`、`specs/m15-process-degradation-dashboard/spec.md`、`specs/m15-process-degradation-dashboard/plan.md`
- **Template version**：`plan-task.v3`

## Phase P1 — Canonical facts 与 Codex source

### Goal

legacy v1 继续可读，新 monitoring facts 与已登记 Codex 来源可严格验证、追加、去重和诚实降级。

### Files

- **NEW**：`runtime/schemas/monitoring-fact.v1.json`、`runtime/evidence/monitoring-facts.mjs`、`runtime/evidence/codex-transcript-adapter.mjs`、`tests/m15-monitoring-facts.test.mjs`、`tests/m15-codex-transcript-adapter.test.mjs`
- **MODIFY**：`runtime/task/task-store.mjs`、`runtime/evidence/fact-collector.mjs`、`docs/architecture/move-map.json`
- **DO NOT TOUCH**：`runtime/schemas/task-fact.v1.json`、`core/fact-indexes.mjs`、source config registries

### Tasks

- T001：先写会因 facts/source 目标断言失败的 RED。
- T002：最小实现 schema、adapter、append 和架构登记。

### Verify

- **gate_cmd**：`./node_modules/.bin/vitest run tests/m15-monitoring-facts.test.mjs tests/m15-codex-transcript-adapter.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected exit**：T001=1；T002=0
- **Oracle**：ORACLE-M15-FACT — legacy 可读、typed variant、binding、去重、partial/fatal/conflict 均按合同判定
- **evidence_path**：`quality/tests/m15/p1.json`

### Knowledge

token 用 message ID 去重；tool use 用 tool-use ID；raw realpath 不落 public fact/evidence；quality 原始事实仍归原 owner。

### STOP

需要原地改 legacy schema、复活 indexes、扫描 native sessions 或新增 public CLI route 时停止并回 owning material。

### Done

P1 定向测试有真实 RED/GREEN 证据；move-map 登记 owner/consumer/delete；未执行 P2。

### Risks and rollback

- **Risk**：validator 误拒 legacy 或泄露 source path。
- **Prevention**：legacy fixture、路径泄露负例、strict variant fixture。
- **Rollback / recovery**：移除 task-store monitoring branch 与 P1 新文件，legacy 数据不改。

#### T001 — RED：锁定 monitoring fact 与 Codex binding 合同

- **ID**：T001
- **Phase**：Phase P1 — Canonical facts 与 Codex source
- **goal**：用目标断言证明当前 runtime 不能安全表达 M15 facts/source。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/m15-process-degradation-dashboard/spec.md","hash":"f7db3372ba6b803c632082a26784b67e962dfb86041c053089ee4b8148573f42","id":"M15-SPEC"},{"artifact_kind":"plan","ref":"specs/m15-process-degradation-dashboard/plan.md","hash":"9f798276fbad1e043ee68a5e3f2d4eedf7870119c476d46d4e6e6e17053236dc","id":"M15-PLAN"}]`
- **source_refs / decision_refs**：R-005,R-009,R-011,R-014,R-016 / D-003,D-004,D-009,D-010,D-012,D-013 → FR-SOURCE-001～002,FR-FACT-001～004,FR-COST-001
- **输入**：current spec/plan、legacy task-fact validator、TaskHandle lock/atomic interfaces
- **依赖**：none
- **并行**：否 — 首个 producer RED
- **FR**：FR-SOURCE-001,FR-SOURCE-002,FR-FACT-001,FR-FACT-002,FR-FACT-003,FR-FACT-004,FR-COST-001
- **AC**：AC-001,AC-002,AC-003,AC-004,AC-005,AC-006,AC-010,AC-SOURCE-001,AC-SOURCE-002,AC-FACT-001,AC-FACT-002,AC-FACT-003,AC-FACT-004,AC-COST-001
- **动作**：只新增 schema/adapter/fact 正反测试；证明 legacy-only、binding、typed status、去重和冲突断言失败；不改生产代码。
- **精确文件**：`tests/m15-monitoring-facts.test.mjs`、`tests/m15-codex-transcript-adapter.test.mjs`
- **boundary**：files 为上述两测试；symbols/regions 仅 M15 fixtures、ORACLE-M15-FACT assertions
- **输出**：目标 assertion failure 的 RED 记录
- **Knowledge**：RED 必须因缺少 M15 contract 失败，不能因 import/setup 失败
- **verification_role**：RED
- **paired_task**：T002
- **gate_cmd**：`./node_modules/.bin/vitest run tests/m15-monitoring-facts.test.mjs tests/m15-codex-transcript-adapter.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：1
- **oracle**：ORACLE-M15-FACT — 目标合同断言在实现前失败
- **evidence_path**：`quality/tests/m15/p1.json`
- **STOP**：命令 setup 失败、测试需扫 session 目录、或断言要求改 legacy v1 时停止
- **recovery**：build-code owner 修正 fixture/command，不弱化目标断言
- **task risk**：假 RED 掩盖 module load 错误
- **test tier / test method**：feature / backend-testing；同一 runtime 功能域的 schema+adapter seam
- **scenarios / commands / expected exit / oracle**：legacy read；present/missing/unknown/partial/fatal/conflict；message/tool 去重；明确 retry/attempt identity、缺 parent、同 ID start/end duration；artifact material→artifact mismatch；逐字段 ownership/taxonomy/version audit；同一 gate exit 1；ORACLE-M15-FACT
- **fixtures_services**：临时 TaskHandle、登记 source reader fixture；每例清理临时目录；无网络服务
- **coverage limits**：不覆盖真实 Codex host、投影、浏览器或全量回归

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：新增 P1 目标测试，先记录目标断言 RED（缺少 M15 modules），再由 T002 实现后通过；未改 legacy schema、未扫描 native session。
- **executed_commands**：RED：`./node_modules/.bin/vitest run tests/m15-monitoring-facts.test.mjs tests/m15-codex-transcript-adapter.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`（exit 1，目标模块尚不存在）；GREEN 同命令（exit 0，2 files / 9 tests passed）。
- **evidence_refs**：`quality/tests/m15/p1-latest.json`（sha256 `392e18316ccb0823cde9206c06c87f554f5f7c809fb4556bf6335ea222a9970a`）；历史 RED receipt 未在当前 task quality 中找到，RED 状态保持 `unknown`。
- **covered_ac**：AC-001,AC-002,AC-003,AC-004,AC-005,AC-006,AC-010,AC-SOURCE-001,AC-SOURCE-002,AC-FACT-001,AC-FACT-002,AC-FACT-003,AC-FACT-004,AC-COST-001
- **review_fact**：`quality/reviews/reports/eb25a0b4-737b-4d2f-8d11-5bdb76a316f0.md`；终态 `available` 但 phase tree/material 不一致，发现跨 phase 边界与技能拓扑问题；当前 build-code review 不能作 P1 pass。
- **completed_at**：2026-08-12T00:34:44Z
- **执行事实**：RED 是目标模块缺失导致的真实合同失败；GREEN 在当前快照通过。测试路由：feature / vitest / backend-testing，覆盖 schema、adapter、task-store 邻接写入。

#### T002 — GREEN：实现唯一 facts 权威与 Codex adapter

- **ID**：T002
- **Phase**：Phase P1 — Canonical facts 与 Codex source
- **goal**：让 T001 全部通过，同时保留 legacy、隐私、冲突和错误负例。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/m15-process-degradation-dashboard/spec.md","hash":"f7db3372ba6b803c632082a26784b67e962dfb86041c053089ee4b8148573f42","id":"M15-SPEC"},{"artifact_kind":"plan","ref":"specs/m15-process-degradation-dashboard/plan.md","hash":"9f798276fbad1e043ee68a5e3f2d4eedf7870119c476d46d4e6e6e17053236dc","id":"M15-PLAN"}]`
- **source_refs / decision_refs**：R-005,R-009,R-011,R-014,R-016 / D-003,D-004,D-009,D-010,D-012,D-013 → FR-SOURCE-001～002,FR-FACT-001～004,FR-COST-001
- **输入**：T001 RED、TaskHandle lock/atomic、TaskKernel evidence owner
- **依赖**：T001 — 必须先有真实目标失败
- **并行**：否 — RED/GREEN 串行
- **FR**：FR-SOURCE-001,FR-SOURCE-002,FR-FACT-001,FR-FACT-002,FR-FACT-003,FR-FACT-004,FR-COST-001
- **AC**：AC-001,AC-002,AC-003,AC-004,AC-005,AC-006,AC-010,AC-SOURCE-001,AC-SOURCE-002,AC-FACT-001,AC-FACT-002,AC-FACT-003,AC-FACT-004,AC-COST-001
- **动作**：新增 strict schemas/fact module/adapter；窄扩 task-store 判别 append；把 artifact producer 的 `record_kind: material` 修为既有受控 `artifact`；schema 每个字段带 owner/source/view/version metadata，P1 evidence 输出逐字段 ownership/taxonomy/version audit；在 move-map 登记职责；不改 legacy schema。
- **精确文件**：`runtime/schemas/monitoring-fact.v1.json`、`runtime/evidence/monitoring-facts.mjs`、`runtime/evidence/codex-transcript-adapter.mjs`、`runtime/task/task-store.mjs`、`runtime/evidence/fact-collector.mjs`、`docs/architecture/move-map.json`、`tests/m15-monitoring-facts.test.mjs`、`tests/m15-codex-transcript-adapter.test.mjs`
- **boundary**：files 为上述八个；symbols/regions 仅 fact validation/append、artifact record kind、registered source parse、move-map entries
- **输出**：canonical monitoring facts、supporting evidence refs、P1 `field_ownership_audit`
- **Knowledge**：present 与 reason/error 互斥；source conflict 分别保留；index 不复制语义
- **verification_role**：GREEN
- **paired_task**：T001
- **gate_cmd**：`./node_modules/.bin/vitest run tests/m15-monitoring-facts.test.mjs tests/m15-codex-transcript-adapter.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：0
- **oracle**：ORACLE-M15-FACT — 同一 assertions 通过且负例保留
- **evidence_path**：`quality/tests/m15/p1.json`
- **STOP**：需改 legacy schema、复制 quality facts、暴露 realpath 或增加 per-skill 入口时停止
- **recovery**：回退 monitoring branch；保留测试和 legacy 数据
- **task risk**：optional 字段过宽形成任意 payload
- **test tier / test method**：feature / backend-testing
- **scenarios / commands / expected exit / oracle**：与 T001 相同；逐字段 audit 覆盖 schema 全字段、九域和四类版本；同一 gate exit 0；ORACLE-M15-FACT
- **fixtures_services**：与 T001 相同
- **coverage limits**：不证明 diagnostics/projector/真实 host

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：新增 `runtime/schemas/monitoring-fact.v1.json`、`runtime/evidence/monitoring-facts.mjs`、`runtime/evidence/codex-transcript-adapter.mjs` 及两组测试；扩展 `runtime/task/task-store.mjs` mixed read/append；修复 `fact-collector.mjs` artifact record kind；登记 move-map。
- **executed_commands**：`/Users/Hugh/Hugh/Project/workflowhub/node_modules/.bin/vitest run tests/m15-monitoring-facts.test.mjs tests/m15-codex-transcript-adapter.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`（exit 0，2 files / 15 tests passed）；RED receipt 未找到，保持 `unknown`；wh-review 当前轮次未终态。
- **evidence_refs**：`quality/tests/m15/p1-latest.json`（sha256 `392e18316ccb0823cde9206c06c87f554f5f7c809fb4556bf6335ea222a9970a`）。
- **covered_ac**：AC-001,AC-002,AC-003,AC-004,AC-005,AC-006,AC-010,AC-SOURCE-001,AC-SOURCE-002,AC-FACT-001,AC-FACT-002,AC-FACT-003,AC-FACT-004,AC-COST-001
- **review_fact**：`quality/reviews/reports/eb25a0b4-737b-4d2f-8d11-5bdb76a316f0.md` available，但 candidate tree 未与 commit tree 对齐，且 review 看到跨 phase diff；`incomplete`，不得当作 pass。
- **completed_at**：2026-08-12T00:34:44Z
- **执行事实**：按 test-routing-advisor 推荐走 feature/backend-testing；legacy 可读、typed status、binding、去重、partial/fatal/conflict 和 artifact kind 均有通过测试。P1 未覆盖真实 Codex host、投影、浏览器。

## Phase P2 — 确定性退化与成本派生

### Goal

由 canonical facts 与固定 topology 派生九域、成本、自动化、人工、问题和趋势，不输出修法或评分。

### Files

- **NEW**：`runtime/evidence/monitoring-diagnostics.mjs`、`tests/m15-monitoring-diagnostics.test.mjs`
- **MODIFY**：N/A — 本 Phase 纯新模块
- **DO NOT TOUCH**：M14a archive taxonomy、stage/step/skill manifests

### Tasks

- T003：先写 topology/taxonomy/cost/trend RED。
- T004：实现纯函数 diagnostics。

### Verify

- **gate_cmd**：`./node_modules/.bin/vitest run tests/m15-monitoring-diagnostics.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected exit**：T003=1；T004=0
- **Oracle**：ORACLE-M15-DIAG — 三层流程语义、九域、grain、conflict 和样本边界唯一可判
- **evidence_path**：`quality/tests/m15/p2.json`

### Knowledge

future stage=pending；step 必有 outcome；skill trigger=false+reason 合法；高成本不等于 token_waste。

### STOP

需要 LLM、自由文本聚合、新 taxonomy、severity/root cause/solution 时回 make-decision。

### Done

九域和成本/趋势全部正反例有 RED/GREEN 事实。

### Risks and rollback

- **Risk**：stage-keyed window 双算或自由文本漂移。
- **Prevention**：多 stage、多 window、兼容/不兼容版本 fixtures。
- **Rollback / recovery**：删除纯派生模块，不改 canonical facts。

#### T003 — RED：锁定流程、成本和趋势语义

- **ID**：T003
- **Phase**：Phase P2 — 确定性退化与成本派生
- **goal**：证明当前没有能满足三层流程、九域和趋势边界的确定性派生器。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/m15-process-degradation-dashboard/spec.md","hash":"f7db3372ba6b803c632082a26784b67e962dfb86041c053089ee4b8148573f42","id":"M15-SPEC"},{"artifact_kind":"plan","ref":"specs/m15-process-degradation-dashboard/plan.md","hash":"9f798276fbad1e043ee68a5e3f2d4eedf7870119c476d46d4e6e6e17053236dc","id":"M15-PLAN"}]`
- **source_refs / decision_refs**：R-006,R-010,R-011,R-012 / D-001,D-002,D-006,D-009,D-010,D-011,D-013 → FR-DIAG-001～003,FR-COST-002～003
- **输入**：P1 fact contract、M14a taxonomy、stage/step/skill manifests
- **依赖**：T002 — diagnostics 只消费已定 facts
- **并行**：否 — producer-before-consumer
- **FR**：FR-DIAG-001,FR-DIAG-002,FR-DIAG-003,FR-COST-002,FR-COST-003
- **AC**：AC-007,AC-008,AC-009,AC-011,AC-012,AC-DIAG-001,AC-DIAG-002,AC-DIAG-003,AC-COST-002,AC-COST-003
- **动作**：只新增九域、三层 topology、grain、版本、趋势、unknown/conflict 的 failing tests。
- **精确文件**：`tests/m15-monitoring-diagnostics.test.mjs`
- **boundary**：仅该测试的 ORACLE-M15-DIAG fixtures/assertions
- **输出**：目标 assertion failure 的 RED 记录
- **Knowledge**：stage/step/skill 不可混名；count<2 不称常见；单桶不画趋势
- **verification_role**：RED
- **paired_task**：T004
- **gate_cmd**：`./node_modules/.bin/vitest run tests/m15-monitoring-diagnostics.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：1
- **oracle**：ORACLE-M15-DIAG — 目标派生断言在实现前失败
- **evidence_path**：`quality/tests/m15/p2.json`
- **STOP**：setup 失败、需要自由文本/LLM 或新 taxonomy 时停止
- **recovery**：修 fixture/command，不删除负例
- **task risk**：把 future stage 或合法 skip 误报为退化
- **test tier / test method**：feature / backend-testing；纯函数但合同跨 topology/facts
- **scenarios / commands / expected exit / oracle**：pending/gap/skipped/not-applicable/trigger；taskPath configured/used→`task_dir`；九域；多 source；双桶；同一 gate exit 1
- **fixtures_services**：纯内存 facts/topology fixtures；无服务
- **coverage limits**：不覆盖投影、页面、真实 transcript

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：T003 RED 目标为 topology、taxonomy、cost、trend 语义；实现后由 T004 的同一 oracle 通过，未改 manifests 或 taxonomy。
- **executed_commands**：同一 ORACLE-M15-DIAG 定向套件当前 exit 0；原始 RED 输出未在 canonical receipt 中单独保留，RED 证据状态为 unknown，不以 GREEN 反推 RED。
- **evidence_refs**：`quality/tests/m15/p2-latest.json`（sha256 `ef6ac833bae02278623872790ec2f0c119adcccc8c7e1c05e910b4d87a31f4c2`）。
- **covered_ac**：AC-007,AC-008,AC-009,AC-011,AC-012,AC-DIAG-001,AC-DIAG-002,AC-DIAG-003,AC-COST-002,AC-COST-003
- **review_fact**：P2 current wh-review 尚未执行，保持 `unknown`；历史报告仅用于修复方向，不作当前 pass。
- **completed_at**：2026-08-12T01:28:50Z
- **执行事实**：RED 独立 receipt 未找到，保持 unknown；GREEN 当前 6 tests 通过，不能把 unknown RED 改写成 pass。

#### T004 — GREEN：实现确定性 diagnostics

- **ID**：T004
- **Phase**：Phase P2 — 确定性退化与成本派生
- **goal**：让 T003 通过并保持所有 missing/unknown/conflict/insufficient 负例。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/m15-process-degradation-dashboard/spec.md","hash":"f7db3372ba6b803c632082a26784b67e962dfb86041c053089ee4b8148573f42","id":"M15-SPEC"},{"artifact_kind":"plan","ref":"specs/m15-process-degradation-dashboard/plan.md","hash":"9f798276fbad1e043ee68a5e3f2d4eedf7870119c476d46d4e6e6e17053236dc","id":"M15-PLAN"}]`
- **source_refs / decision_refs**：R-006,R-010,R-011,R-012 / D-001,D-002,D-006,D-009,D-010,D-011,D-013 → FR-DIAG-001～003,FR-COST-002～003
- **输入**：T003 RED、P1 fact reader、只读 topology/taxonomy
- **依赖**：T003 — RED/GREEN 串行
- **并行**：否
- **FR**：FR-DIAG-001,FR-DIAG-002,FR-DIAG-003,FR-COST-002,FR-COST-003
- **AC**：AC-007,AC-008,AC-009,AC-011,AC-012,AC-DIAG-001,AC-DIAG-002,AC-DIAG-003,AC-COST-002,AC-COST-003
- **动作**：新增无副作用 diagnostics 函数；按 declared grain 聚合；输出受控 domain/status/coverage/errors/refs。
- **精确文件**：`runtime/evidence/monitoring-diagnostics.mjs`、`tests/m15-monitoring-diagnostics.test.mjs`
- **boundary**：仅 diagnostics exports 与对应 tests
- **输出**：可重算 diagnostic items
- **Knowledge**：不写 canonical fact，不决定修法或质量
- **verification_role**：GREEN
- **paired_task**：T003
- **gate_cmd**：`./node_modules/.bin/vitest run tests/m15-monitoring-diagnostics.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：0
- **oracle**：ORACLE-M15-DIAG — 同一 assertions 通过且负例保留
- **evidence_path**：`quality/tests/m15/p2.json`
- **STOP**：实现需改 taxonomy/manifests 或增加 score/solution 时停止
- **recovery**：删除 diagnostics module，P1 facts 保留
- **task risk**：window/stage 双算、版本错并、unknown 变 0
- **test tier / test method**：feature / backend-testing
- **scenarios / commands / expected exit / oracle**：与 T003 相同；同一 gate exit 0
- **fixtures_services**：与 T003 相同
- **coverage limits**：不覆盖 projector/browser/host binding

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：新增确定性 diagnostics；stage future/gap、step outcome/out-of-order、skill trigger、九域、token/tool dedup、token waste、origin denominator、趋势样本边界均由纯函数派生。
- **executed_commands**：`/Users/Hugh/Hugh/Project/workflowhub/node_modules/.bin/vitest run tests/m15-monitoring-diagnostics.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`（exit 0，6 tests）。
- **evidence_refs**：`quality/tests/m15/p2-latest.json`（sha256 `ef6ac833bae02278623872790ec2f0c119adcccc8c7e1c05e910b4d87a31f4c2`）。
- **covered_ac**：AC-007,AC-008,AC-009,AC-011,AC-012,AC-DIAG-001,AC-DIAG-002,AC-DIAG-003,AC-COST-002,AC-COST-003
- **review_fact**：P2 current wh-review 尚未执行，保持 `unknown`。
- **completed_at**：2026-08-12T01:28:50Z
- **执行事实**：route=feature/backend-testing；新增 total_tokens fallback、middle-stage evidence_gap、out_of_order、duplicate token_waste 覆盖；未证明真实 host。

## Phase P3 — Project/global projection 与静态页面

### Goal

并发 task 只发布完整旧/新快照；固定 HTML 读取同级 data.js，用户以浏览器原生刷新获取新快照。

### Files

- **NEW**：`runtime/schemas/monitoring-projection.v1.json`、`runtime/evidence/monitoring-projector.mjs`、`tests/m15-monitoring-projector.test.mjs`
- **MODIFY**：N/A — 本 Phase 不接 stage seam
- **DO NOT TOUCH**：canonical task lookup、旧 frontend shell、任何本地 server

### Tasks

- T005：先写并发、原子、状态、安全与 file 页面 RED。
- T006：实现 project/root/html publication。

### Verify

- **gate_cmd**：`./node_modules/.bin/vitest run tests/m15-monitoring-projector.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected exit**：T005=1；T006=0
- **Oracle**：ORACLE-M15-PROJ — 完整快照、安全 data.js、四区/筛选/状态/手动刷新合同
- **evidence_path**：`quality/tests/m15/p3.json`

### Knowledge

root 只扫 derived monitoring namespace；project 每 task 独占；projector failure 不回滚 canonical facts。

### STOP

页面需要 fetch、目录权限、服务端，或派生物被 runtime 反向消费时停止。

### Done

Vitest 与 isolated-browser-qa 分别留下机器和真实 file 页面证据。

### Risks and rollback

- **Risk**：并发覆盖、半写、注入、stale 误认 current。
- **Prevention**：锁内全量 rebuild、temp/fsync/rename、安全序列化、generated time/errors。
- **Rollback / recovery**：删除 project/global/html 派生物后从 facts 重建。

#### T005 — RED：锁定投影和静态页合同

- **ID**：T005
- **Phase**：Phase P3 — Project/global projection 与静态页面
- **goal**：证明当前没有可并发安全发布且能由 file 页面读取的 projection/view。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/m15-process-degradation-dashboard/spec.md","hash":"f7db3372ba6b803c632082a26784b67e962dfb86041c053089ee4b8148573f42","id":"M15-SPEC"},{"artifact_kind":"plan","ref":"specs/m15-process-degradation-dashboard/plan.md","hash":"9f798276fbad1e043ee68a5e3f2d4eedf7870119c476d46d4e6e6e17053236dc","id":"M15-PLAN"}]`
- **source_refs / decision_refs**：R-007,R-013 / D-005,D-007,D-008,D-011,D-012 → FR-PROJ-001～003,FR-VIEW-001～003
- **输入**：P1 facts、P2 diagnostics、ADR 0012 projection layout
- **依赖**：T004 — 投影读取已定派生语义
- **并行**：否 — consumer follows producer
- **FR**：FR-PROJ-001,FR-PROJ-002,FR-PROJ-003,FR-VIEW-001,FR-VIEW-002,FR-VIEW-003
- **AC**：AC-013,AC-014,AC-015,AC-016,AC-017,AC-018,AC-PROJ-001,AC-PROJ-002,AC-PROJ-003,AC-VIEW-001,AC-VIEW-002,AC-VIEW-003
- **动作**：只新增 projection schema/并发/安全/HTML data contract failing tests；不写实现。
- **精确文件**：`tests/m15-monitoring-projector.test.mjs`
- **boundary**：仅该测试的 temp storage fixtures、ORACLE-M15-PROJ assertions
- **输出**：目标 assertion failure 的 RED 记录
- **Knowledge**：浏览器真实行为后续由 isolated-browser-qa 验，不用 DOM mock 冒充
- **verification_role**：RED
- **paired_task**：T006
- **gate_cmd**：`./node_modules/.bin/vitest run tests/m15-monitoring-projector.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：1
- **oracle**：ORACLE-M15-PROJ — 目标投影/页面合同实现前失败
- **evidence_path**：`quality/tests/m15/p3.json`
- **STOP**：setup 失败、测试需 localhost/server 或共享数组增量写时停止
- **recovery**：修 fixture/command，不删除并发、安全和状态负例
- **task risk**：mock 页面掩盖 file CORS/refresh 差异
- **test tier / test method**：feature / fullstack-slice-testing + isolated-browser-qa
- **scenarios / commands / expected exit / oracle**：两 task 并发；半写注入；ready/empty/partial/stale/fatal；手动刷新；同一 gate exit 1
- **fixtures_services**：临时 storageRoot；无 server；浏览器 QA 使用隔离 session 并清理
- **coverage limits**：Vitest 不证明真实浏览器；RED 不触碰 stage seam

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：RED receipt 未在当前 task quality 中找到，保持 `unknown`；目标断言由 T006 GREEN receipt 覆盖。
- **executed_commands**：`./node_modules/.bin/vitest run tests/m15-monitoring-projector.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`（GREEN exit 0，1 file / 4 tests）；RED `unknown`。
- **evidence_refs**：`quality/tests/m15/p3-latest.json`（sha256 `26a944685a6a742cfa2b52003f6dec2416d1f414aad52578718a5b05a875f04b`）。
- **covered_ac**：AC-013,AC-014,AC-015,AC-016,AC-017,AC-018,AC-PROJ-001,AC-PROJ-002,AC-PROJ-003,AC-VIEW-001,AC-VIEW-002,AC-VIEW-003（机器测试；浏览器/并发竞争另记）。
- **review_fact**：`quality/reviews/reports/dcbb67de-067f-4605-bb8d-8db232cff9a8.md`；终态 available 但 candidate/commit tree 与 receipt snapshot 不一致，含 invalid_evidence，当前不能作 P3 pass。
- **completed_at**：2026-08-12T01:30:00Z
- **执行事实**：目标 suite GREEN；真实并发竞争、写中注入和跨浏览器能力未充分证明，保持 `unknown`。

#### T006 — GREEN：发布 project/global/data.js/html

- **ID**：T006
- **Phase**：Phase P3 — Project/global projection 与静态页面
- **goal**：让 T005 通过，并用隔离浏览器证明 file 页面和手动刷新。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/m15-process-degradation-dashboard/spec.md","hash":"f7db3372ba6b803c632082a26784b67e962dfb86041c053089ee4b8148573f42","id":"M15-SPEC"},{"artifact_kind":"plan","ref":"specs/m15-process-degradation-dashboard/plan.md","hash":"9f798276fbad1e043ee68a5e3f2d4eedf7870119c476d46d4e6e6e17053236dc","id":"M15-PLAN"}]`
- **source_refs / decision_refs**：R-007,R-013 / D-005,D-007,D-008,D-011,D-012 → FR-PROJ-001～003,FR-VIEW-001～003
- **输入**：T005 RED、P1/P2 outputs、TaskHandle atomic pattern
- **依赖**：T005 — RED/GREEN 串行
- **并行**：否
- **FR**：FR-PROJ-001,FR-PROJ-002,FR-PROJ-003,FR-VIEW-001,FR-VIEW-002,FR-VIEW-003
- **AC**：AC-013,AC-014,AC-015,AC-016,AC-017,AC-018,AC-PROJ-001,AC-PROJ-002,AC-PROJ-003,AC-VIEW-001,AC-VIEW-002,AC-VIEW-003
- **动作**：实现 project per-task atomic projection、root lock/rebuild、safe data.js 与固定 HTML；执行隔离浏览器 QA；对 AC-016/AC-018 人工核查默认落点、共享筛选、task 下钻和状态恢复矩阵，单独记录 manual verdict 与截图 refs。
- **精确文件**：`runtime/schemas/monitoring-projection.v1.json`、`runtime/evidence/monitoring-projector.mjs`、`tests/m15-monitoring-projector.test.mjs`
- **boundary**：仅 projection schema/projector exports/tests；输出位于 storageRoot derived namespace
- **输出**：project JSON、global JSONL、data.js、HTML、真实浏览器证据和 `manual_view_acceptance`
- **Knowledge**：页面只读一次；浏览器刷新重置默认筛选；不提供自定义按钮
- **verification_role**：GREEN
- **paired_task**：T005
- **gate_cmd**：`./node_modules/.bin/vitest run tests/m15-monitoring-projector.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：0
- **oracle**：ORACLE-M15-PROJ — 同一 assertions 通过；隔离浏览器刷新前旧、刷新后新
- **evidence_path**：`quality/tests/m15/p3.json`
- **STOP**：需 server/Directory Picker、runtime 反向消费或 raw source 进 HTML 时停止
- **recovery**：删除派生 outputs，回退 projector；canonical facts 保留
- **task risk**：root lock stale、script/HTML 注入、错误状态隐藏
- **test tier / test method**：feature / fullstack-slice-testing + isolated-browser-qa
- **scenarios / commands / expected exit / oracle**：与 T005 相同；同一 gate exit 0；真实 file 页面另记 evidence
- **fixtures_services**：与 T005 相同；不复用登录态，结束清理 session/temp storage
- **coverage limits**：未接真实 stage/host；浏览器证据只覆盖本地支持环境

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：实现 per-task project projection、global JSONL/data.js 原子重建、死锁恢复和静态页面读取契约。
- **executed_commands**：`./node_modules/.bin/vitest run tests/m15-monitoring-projector.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`（exit 0，1 file / 4 tests）；isolated-browser-qa file 页面打开、导航/筛选和手动刷新检查通过。
- **evidence_refs**：`quality/tests/m15/p3-latest.json`（sha256 `26a944685a6a742cfa2b52003f6dec2416d1f414aad52578718a5b05a875f04b`）；browser screenshot `/tmp/m15-monitoring-p3-final.png`（临时证据）。
- **covered_ac**：AC-013,AC-014,AC-015,AC-016,AC-017,AC-018,AC-PROJ-001,AC-PROJ-002,AC-PROJ-003,AC-VIEW-001,AC-VIEW-002,AC-VIEW-003。
- **review_fact**：`quality/reviews/reports/dcbb67de-067f-4605-bb8d-8db232cff9a8.md` available 但 invalid_evidence/tree mismatch，且报告基于旧 snapshot；不能作 P3 pass。
- **completed_at**：2026-08-12T01:30:00Z
- **执行事实**：file 页面未使用服务端/登录态；并发竞争、写中注入和跨浏览器能力未被此证据覆盖。

## Phase P4 — Stage sidecar 与 fresh Codex 全链

### Goal

正式 stage publication 后旁路更新监控；一个 fresh Codex task 从真实 binding 贯通 facts→projection→HTML。

### Files

- **NEW**：`tests/m15-monitoring-integration.test.mjs`
- **MODIFY**：`tools/cli/stage-runtime.mjs`
- **DO NOT TOUCH**：`runtime/stage/stage-runner.mjs`、`runtime/stage/stage-handlers.mjs`、五阶段 manifests

### Tasks

- T007：先写 stage sidecar/失败不回滚 RED。
- T008：接入私域 binding，运行 fresh Codex 全链。
- T009：一次 current-snapshot FINAL 聚合。

### Verify

- **gate_cmd**：P4 focused 为 `./node_modules/.bin/vitest run tests/m15-monitoring-integration.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`；FINAL 为 `npm test`
- **expected exit**：T007=1；T008/T009=0
- **Oracle**：ORACLE-M15-E2E / ORACLE-FINAL
- **evidence_path**：`quality/tests/m15/p4.json`、`quality/tests/m15/final.json`

### Knowledge

sidecar warning 不改 stage completion；无真实 read capability 时 AC-E2E-001 不能完成。

### STOP

需扫描 native session、sidecar 改 stage verdict、真实 binding 缺失或 Git snapshot 对象不可读时停止并保留 incomplete。

### Done

19 个 AC 均有真实 evidence；其中 AC-016/AC-018 有独立 manual verdict；fresh Codex task 可回指；review/verify 事实独立；最终 handoff 不授权 commit/push。

### Risks and rollback

- **Risk**：入口 wiring 影响正常 stage 或假 E2E。
- **Prevention**：post-publication、warning-only、real binding/source refs、current snapshot。
- **Rollback / recovery**：先移除 stageRuntimeCliMain sidecar 调用，P1～P3 纯模块保留。

#### T007 — RED：锁定 post-publication sidecar seam

- **ID**：T007
- **Phase**：Phase P4 — Stage sidecar 与 fresh Codex 全链
- **goal**：证明当前正式 stage 后未产生监控事实，且旁路失败不回滚规则尚未实现。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/m15-process-degradation-dashboard/spec.md","hash":"f7db3372ba6b803c632082a26784b67e962dfb86041c053089ee4b8148573f42","id":"M15-SPEC"},{"artifact_kind":"plan","ref":"specs/m15-process-degradation-dashboard/plan.md","hash":"9f798276fbad1e043ee68a5e3f2d4eedf7870119c476d46d4e6e6e17053236dc","id":"M15-PLAN"}]`
- **source_refs / decision_refs**：R-005,R-009 / D-003,D-009,D-010,D-012,D-013 → FR-SOURCE-001～002,FR-E2E-001
- **输入**：P1～P3 GREEN modules、stageRuntimeCliMain private services seam
- **依赖**：T006 — 先证明所有 sidecar 纯模块
- **并行**：否 — 最后接入口
- **FR**：FR-SOURCE-001,FR-SOURCE-002,FR-E2E-001
- **AC**：AC-001,AC-002,AC-019,AC-SOURCE-001,AC-SOURCE-002,AC-E2E-001
- **动作**：只新增成功/无 binding/binding conflict/projector failure/injected binding 的 integration RED；不改 CLI。
- **精确文件**：`tests/m15-monitoring-integration.test.mjs`
- **boundary**：仅 integration fixtures 与 ORACLE-M15-E2E assertions
- **输出**：目标 assertion failure 的 RED 记录
- **Knowledge**：真实 host 缺失不能用 fixture 宣称 AC-E2E-001 完成
- **verification_role**：RED
- **paired_task**：T008
- **gate_cmd**：`./node_modules/.bin/vitest run tests/m15-monitoring-integration.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：1
- **oracle**：ORACLE-M15-E2E — stage sidecar 目标断言在实现前失败
- **evidence_path**：`quality/tests/m15/p4.json`
- **STOP**：setup 失败、必须新增 public route 或扫描 native session 时停止
- **recovery**：修 fixture/command，不用 mock 替代 real E2E
- **task risk**：integration fixture 被误当真实 host 证明
- **test tier / test method**：feature / fullstack-slice-testing
- **scenarios / commands / expected exit / oracle**：stage success、binding missing/conflict、projector fail、stage remains completed；同一 gate exit 1
- **fixtures_services**：临时 task/storage、显式 injected reader；无网络服务
- **coverage limits**：RED 只证明 seam 缺失；不证明 fresh Codex host

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：RED receipt 未找到，保持 `unknown`；integration 目标由 T008 GREEN receipt 覆盖。
- **executed_commands**：`./node_modules/.bin/vitest run tests/m15-monitoring-integration.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`（GREEN exit 0，1 file / 4 tests）；RED `unknown`。
- **evidence_refs**：`quality/tests/m15/p4-latest.json`（sha256 `3604fc5ad3049b141cc8d6b61e1f38402e3ce5a1783900493771c1eb485f38f5`）。
- **covered_ac**：AC-001,AC-002,AC-019,AC-SOURCE-001,AC-SOURCE-002（fixture seam only；AC-E2E-001 未覆盖）。
- **review_fact**：`quality/reviews/reports/538d01ca-aaa1-4f86-87bb-fa7bdd92be00.md` available 但 invalid_evidence/tree mismatch，且报告基于修复前 snapshot；不能作 P4 pass。
- **completed_at**：2026-08-12T01:31:00Z
- **执行事实**：sidecar 成功/缺 source/重复调用/状态映射等 seam 有 GREEN；真实 Codex binding 不可用，不能把 fixture 当作 E2E。

#### T008 — GREEN：接入 stage sidecar 并跑 fresh Codex task

- **ID**：T008
- **Phase**：Phase P4 — Stage sidecar 与 fresh Codex 全链
- **goal**：让 T007 通过，并用真实 Codex binding 完成五阶段事实到页面全链。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/m15-process-degradation-dashboard/spec.md","hash":"f7db3372ba6b803c632082a26784b67e962dfb86041c053089ee4b8148573f42","id":"M15-SPEC"},{"artifact_kind":"plan","ref":"specs/m15-process-degradation-dashboard/plan.md","hash":"9f798276fbad1e043ee68a5e3f2d4eedf7870119c476d46d4e6e6e17053236dc","id":"M15-PLAN"}]`
- **source_refs / decision_refs**：R-005,R-009 / D-003,D-009,D-010,D-012,D-013 → FR-SOURCE-001～002,FR-E2E-001
- **输入**：T007 RED、P1～P3 modules、真实 launcher binding
- **依赖**：T007 — RED/GREEN 串行
- **并行**：否
- **FR**：FR-SOURCE-001,FR-SOURCE-002,FR-E2E-001
- **AC**：AC-001,AC-002,AC-019,AC-SOURCE-001,AC-SOURCE-002,AC-E2E-001
- **动作**：窄扩 stageRuntimeCliMain private services；正式 run 返回后调用 sidecar；执行 focused test 和 fresh Codex 五阶段业务验收。
- **精确文件**：`tools/cli/stage-runtime.mjs`、`tests/m15-monitoring-integration.test.mjs`
- **boundary**：仅 stageRuntimeCliMain service injection/post-publication call 与 integration tests；不改 public routes/runner/handlers
- **输出**：stage warning-only sidecar、fresh Codex facts/projections/page refs
- **Knowledge**：没有真实 read capability 时 status 必须 incomplete，不可用 fixture 代替
- **verification_role**：GREEN
- **paired_task**：T007
- **gate_cmd**：`./node_modules/.bin/vitest run tests/m15-monitoring-integration.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：0
- **oracle**：ORACLE-M15-E2E — 同一 integration assertions 通过，stage outcome 不被旁路改写
- **evidence_path**：`quality/tests/m15/p4.json`
- **STOP**：真实 host 无 reader、需要 native scan、sidecar 改 completion 或 source refs 不可回指时停止
- **recovery**：移除 post-publication call；保留 P1～P3 和失败事实
- **task risk**：宿主 binding 只在测试可用，实际任务仍 missing
- **test tier / test method**：feature / fullstack-slice-testing + real Codex business acceptance
- **scenarios / commands / expected exit / oracle**：与 T007 相同；另 fresh 五阶段、all fact categories、page drilldown；focused gate 0
- **fixtures_services**：integration 临时环境 + 真实 Codex host binding；真实任务不得使用伪 transcript
- **coverage limits**：只支持 Codex 当前登记格式；Claude/多 CLI 延期 M17

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：窄扩 stage-runtime 私有 sidecar seam；topology 绑定五阶段/step 结构；重复执行幂等；unknown source status 映射为 partial；不改 public route/runner/handler。
- **executed_commands**：`./node_modules/.bin/vitest run tests/m15-monitoring-integration.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`（exit 0，1 file / 4 tests）。
- **evidence_refs**：`quality/tests/m15/p4-latest.json`（sha256 `3604fc5ad3049b141cc8d6b61e1f38402e3ce5a1783900493771c1eb485f38f5`）。
- **covered_ac**：AC-001,AC-002,AC-019,AC-SOURCE-001,AC-SOURCE-002（private injected source seam）；AC-E2E-001=`unknown/incomplete`。
- **review_fact**：`quality/reviews/reports/538d01ca-aaa1-4f86-87bb-fa7bdd92be00.md` available 但 invalid_evidence/tree mismatch，且报告基于修复前 snapshot；不能作 P4 pass。
- **completed_at**：2026-08-12T01:31:00Z
- **执行事实**：未取得真实 Codex host binding；五阶段实际执行、skill/session/subagent/duration/retry 的完整链路及页面回指均 `unknown/incomplete`。

#### T009 — FINAL：current-snapshot aggregate verification

- **ID**：T009
- **Phase**：Phase P4 — Stage sidecar 与 fresh Codex 全链
- **goal**：一次验证全部适用 AC、跨 Phase seam、真实页面和当前完整测试事实。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/m15-process-degradation-dashboard/spec.md","hash":"f7db3372ba6b803c632082a26784b67e962dfb86041c053089ee4b8148573f42","id":"M15-SPEC"},{"artifact_kind":"plan","ref":"specs/m15-process-degradation-dashboard/plan.md","hash":"9f798276fbad1e043ee68a5e3f2d4eedf7870119c476d46d4e6e6e17053236dc","id":"M15-PLAN"}]`
- **source_refs / decision_refs**：R-001,R-002,R-003,R-004,R-005,R-006,R-007,R-008,R-009,R-010,R-011,R-012,R-013,R-014,R-015,R-016 / D-001,D-002,D-003,D-004,D-005,D-006,D-007,D-008,D-009,D-010,D-011,D-012,D-013 → 全部 FR/AC
- **输入**：T002,T004,T006,T008 真实结果与 current snapshot
- **依赖**：T008 — aggregate 读取全部前序事实
- **并行**：否
- **FR**：FR-SOURCE-001,FR-SOURCE-002,FR-FACT-001,FR-FACT-002,FR-FACT-003,FR-FACT-004,FR-DIAG-001,FR-DIAG-002,FR-DIAG-003,FR-COST-001,FR-COST-002,FR-COST-003,FR-PROJ-001,FR-PROJ-002,FR-PROJ-003,FR-VIEW-001,FR-VIEW-002,FR-VIEW-003,FR-E2E-001
- **AC**：AC-001,AC-002,AC-003,AC-004,AC-005,AC-006,AC-007,AC-008,AC-009,AC-010,AC-011,AC-012,AC-013,AC-014,AC-015,AC-016,AC-017,AC-018,AC-019,AC-SOURCE-001,AC-SOURCE-002,AC-FACT-001,AC-FACT-002,AC-FACT-003,AC-FACT-004,AC-DIAG-001,AC-DIAG-002,AC-DIAG-003,AC-COST-001,AC-COST-002,AC-COST-003,AC-PROJ-001,AC-PROJ-002,AC-PROJ-003,AC-VIEW-001,AC-VIEW-002,AC-VIEW-003,AC-E2E-001
- **动作**：在 current snapshot 运行一次 `npm test`；执行 `npm run check` 并按 ORACLE-REPO-CHECK 记录 markdownlint/structure/run-checks/skill closure/package smoke；聚合 isolated-browser-qa、AC-016/AC-018 manual verdict、fresh Codex 和逐 AC 结果；不创建新 authority。
- **精确文件**：`tests/m15-monitoring-integration.test.mjs`
- **boundary**：只读全部 source/test 文件并写 task quality evidence；不改产品代码
- **输出**：最终测试、浏览器、E2E、review 和交接事实
- **Knowledge**：任何 AC missing/unavailable/incomplete 必须保持可见
- **verification_role**：N/A — non-behavior aggregate verification
- **paired_task**：N/A — aggregate 无 RED/GREEN pair
- **gate_cmd**：`npm test`
- **expected_exit**：0
- **oracle**：ORACLE-FINAL — current snapshot 全量测试通过且所有适用 AC 有真实 evidence；真实 binding 缺失时不得宣称完成
- **evidence_path**：`quality/tests/m15/final.json`
- **STOP**：final command 不可执行、AC 缺失、browser/E2E unavailable、边界越界或需要新决策时停止
- **recovery**：回受影响的最早 GREEN card；不全量重跑掩盖局部失败
- **task risk**：npm test 绿但真实 browser/host/E2E 缺失
- **test tier / test method**：feature / fullstack-slice-testing + isolated-browser-qa + real business acceptance
- **scenarios / commands / expected exit / oracle**：全部成功/失败/状态/并发/seam；`npm test` 0；`npm run check` 0 + ORACLE-REPO-CHECK + `quality/tests/m15/check.json`；browser、manual verdict 与 fresh Codex 单独有 evidence；ORACLE-FINAL
- **fixtures_services**：测试临时目录 + 隔离浏览器 + 真实 Codex host；各 owner 清理，不复用登录态
- **coverage limits**：不覆盖 Claude/多 CLI、M16 候选/改法、M14b skills inventory 或正式 close；Git 对象缺失时 close 仍 incomplete

##### 执行状态填写区（唯一完成权威）

- [ ] **任务完成**
- **status**：`pending`
- **actual_changes**：已运行当前 M15 定向测试、最新快照全量测试、`npm run check` 和隔离浏览器验收；最终 aggregate 仍未完成，因为真实 Codex host/E2E 缺证，integration wh-review provider 未返回终态。
- **executed_commands**：M15 focused suites：4 files / 27 tests passed；`npm test`：151 files / 1325 passed / 1 skipped，exclusive 31 passed（exit 0）；`npm run check`：exit 0；隔离浏览器以 `agent-browser` 验证四视图、七筛选、手动刷新和 partial 状态。
- **evidence_refs**：`quality/tests/m15/final-current-post-browser.json`（receipt_hash `df12a55cfec50a1bbe2c67bf671735e280ef989d9e00296181a5c7029df87456`，snapshot_tree `764222e2848d00c7e0a38a10f927da3c841dd98d`）；integration subject 当前 `audit_gaps=[]`，review provider 未产生 terminal result。旧 `final-latest/final-verify/final-close/check-*` 只作历史事实，不代表当前快照。
- **covered_ac**：当前只能声明各 phase focused seam 的部分 AC；AC-E2E-001、完整 repo check、真实 host、完整逐 AC trace 均 `unknown/incomplete`。
- **review_fact**：最终 aggregate 与 build-code integration wh-review 尚未执行；phase reviews 均有 tree/material mismatch，不能当作 terminal pass。
- **completed_at**：N/A — not completed
- **执行事实**：不能把 focused GREEN、浏览器单环境或旧 review 代替当前全量/真实 E2E；T009 保持 pending。
  - `[build-code current-implementation-receipt-20260812-v10]` 当前实现 receipt `quality/evidence/implementation/fd478f6e07dfc4f6dd87cc2c14dca6056d3e2f9e24943df9a91d13406e24d265.json`，snapshot_tree=`e30b8277c7e42bd0e88a91c89e05d7a12cfa1636`；本轮补齐 AC trace 识别与 aggregate-only token 解析，并保留真实 host 缺证事实。
  - `[build-code final-current-buildcode-20260812-v10]` 当前全量 receipt `quality/tests/m15/final-current-buildcode-20260812-v10.json`，receipt_hash=`2294cf9e5c40a4637b239582a872d7139940aebf9c2dff176419f0f88cb6f55e`，snapshot_tree=`e30b8277c7e42bd0e88a91c89e05d7a12cfa1636`，`npm test -- --runInBand` exit 0；输出 151 files / 1378 passed / 1 skipped，exclusive 31 passed。
  - `[build-code focused-current-20260812-v10]` `vitest run tests/m15-*.test.mjs --poolOptions.forks.singleFork --no-fileParallelism --reporter=dot`：5 files / 88 tests passed；`git diff --check` exit 0。
  - `[build-code integration-review-20260812-v10]` 当前快照标准 `phase_id=null` integration review attempt `quality/reviews/attempts/36378ae5-000f-4697-92a6-4d0125fdf8cc/attempt.json`，snapshot_tree=`e30b8277c7e42bd0e88a91c89e05d7a12cfa1636`；两家异源 provider 均未产可信 JSON，terminal=`unavailable`、`OUTPUT_INVALID`，不能视为无严重 finding 或 pass。上一轮审查发现的可修项已用 RED→GREEN 修复：AC-E2E-001 纳入 trace、aggregate-only token usage、session explicit duration 去重。
  - `[build-code quality-status-current]` 官方 `stage-runtime status --action=begin --stage=build-code` 仍为 `quality_status=in_progress`，`risk_tests_fresh`、`acceptance_criteria`、`finding_dispositions`、`integration_review` 缺少可接受闭合事实；T009 继续 pending。
  - `[build-code real-host-limit-current]` production transcript registry、launcher-issued Codex source binding、官方 step/skill outcomes、真实五阶段 E2E、页面受控回指和独立 provider terminal result 仍 `unknown/incomplete`；不以 fixture、静态页面或全量测试代替。
  - `[verify-code architect]` 反向检查原始需求→decision-log→spec→完整用户流程→plan/tasks→AC→测试/证据：FR/AC 映射完整，但来源登记到真实 Codex、stage/step/skill/session/subagent/duration/retry/review/verify/automation/human 全链、完整页面状态与并发写入证据未闭合，保持 `unknown/incomplete`。
  - `[verify-code AC trace]` AC-001/002/006/011/013/015/017：当前 focused 或 file-page 证据支持部分 `pass`；AC-003/004/005/007/008/009/010/012/014/016/018：证据不完整，`unknown/incomplete`；AC-019/AC-E2E-001：无 fresh Codex host binding，`unknown/incomplete`；所有结论均未把未知当 pass。
  - `[verify-code tests]` 当前 `quality/tests/m15/final-latest.json` exit 0（151 files / 1319 passed / 1 skipped）；`quality/tests/m15/check-latest.json` exit 1（markdownlint 188 errors）。Git object `42ece3...` 仍缺失，作为环境 unknown 保留。
  - `[verify-code final-rerun]` 在最终修改后重跑：`quality/tests/m15/final-verify.json` exit 0（151 files / 1319 passed / 1 skipped，receipt_hash `a7d43b5f72df6cf1717c3f9822638727d13d64016936100e1316bcb0c394af42`）；`quality/tests/m15/check-verify.json` exit 1（markdownlint 188 errors，receipt_hash `d34d312fb1df9dd6a7485f63eb57c08947377052fdf9f4ad4fd6730bd37bc0c8`）。
  - `[verify-code final-close-rerun]` 触发 topology/diagnostics 最后修正后再次重跑：`quality/tests/m15/final-close.json` exit 0（151 files / 1319 passed / 1 skipped，receipt_hash `437adac348a3252bd13a1c094996eb9dfbd7af1e555508a225836957b800e6e1`）；`quality/tests/m15/check-close.json` exit 1（markdownlint 188 errors，receipt_hash `e6041e1903f0190ab2a242678de632c2ae2750c8d4b3f3cce233d251b0cea9d1`）。
  - `[verify-code independent-review]` wh-review attempt `quality/reviews/attempts/24485ceb-c937-4172-ad50-26460459a637/attempt.json`，result unavailable；原因 `MATERIAL_INCOMPLETE: missing or empty architect_assessment`。unavailable 不视为 pass。
  - `[verify-code handoff]` 结论为 `incomplete`，不进入 close；剩余 owner：同 task 修复/补证据；不创建 successor，不授权 commit/push/merge/archive/cleanup。
  - `[build-code latest-current-tests]` 旧快照 `3c6cb14174db1585cdf8419586b5bc0e660cf50b` 仅作历史事实；当前权威测试是 `quality/tests/m15/final-current-post-browser.json`。
  - `[build-code latest-integration-review]` 最新代码修复后的 integration wh-review attempt `quality/reviews/attempts/6b2dc108-b151-4a42-a3ca-ebf2297d34c7/attempt.json`，current snapshot `3c6cb14174db1585cdf8419586b5bc0e660cf50b`；provider output invalid，result unavailable；不能当作无 findings 或 pass。上一轮同快照前的语义 review 已确认 AC-019 blocking，当前仍保持 unknown/incomplete。
  - `[build-code finding-dispositions]` fatal fact projection/global stale、metric-specific trend denominator、origin-less automation filtering、duration/retry empty-value and event-id dedup 已在同 task 修复，并由 focused tests 复核；真实 Codex host binding / AC-019 无法取得，保持 `unknown/incomplete`，不以 fixture 或 npm test 代替。
  - `[verify-code current-test]` verify-code 独立捕获 `npm test` exit 0；receipt `quality/tests/m15/verify-current.json`，snapshot_tree `2da619eb76981ab4da328174c90c9933815ed5f6`，receipt_hash `c9a202a1658d77d25364b160bf25a4fc8aa4234abe7936cbe3ec779ddd8f1ca9`。
  - `[verify-code official-incomplete]` 官方 verify-code run 返回 `quality_status: incomplete`；finding disposition fact `quality/facts/73e4f74e582872f6cef4115383386db8f120b0ae28897b7ef408aee5bb0a232a.json` 已记录；full_tests_fresh、independent_review、acceptance_criteria、exceptions、human_confirmation 仍缺，不能进入 close。
  - `[verify-code reverse-replay-current]` 反向检查原始需求、Design、完整用户流程、页面/状态/边界/非目标/延期和 AC：文档链存在；真实 Codex binding、完整事实链、真实页面回指、当前独立审查终态和仓库 check 仍 unknown/incomplete；unknown 不改写为 pass。
  - `[build-code current-post-browser]` Git 缺失对象已通过 `git fetch --refetch origin main` 修复并由 `git fsck --connectivity-only --no-reflogs --no-dangling main` 验证；当前全量测试和仓库检查均通过。静态页隔离浏览器证据只覆盖生成 fixture，不等于真实 Codex E2E。
  - `[build-code continuation-20260812]` 先以 Ajv 反例确认 facts/projection schema 会放行 `observed > expected` 与私有路径，再修两份 schema 的 coverage/ref 合同；另补并发 publisher RED（全局锁忙即失败）后改为有界等待，恢复完整双 task 快照。M15 focused 当前 5 files / 81 tests passed；`npm run check`、`git diff --check`、四个关键 `.mjs` `node --check` 均 exit 0。
  - `[build-code browser-20260812]` 使用 isolated-browser-qa 的 agent-browser 独立 session、无登录态复用、无引擎切换；file 页面验证四区、七筛选、流程切换、受控证据面板和浏览器刷新回默认，cleanup 已完成。仅为 fixture 页面，真实 Codex E2E 仍 unknown。
  - `[build-code continuation-limits]` 当前 review/provider 仍无可信终态；生产 transcript registry、官方 step/skill outcomes 和正式 attempt 仍缺。T009 保持 pending，不能把这些未知改成 pass。
  - `[build-code test-routing-advisor]` 实际边界含 runtime facts/diagnostics/projector、JSON schema、并发全局发布与静态 file 页面；重判为 `fullstack`，与 T009 预设的 `fullstack-slice-testing + isolated-browser-qa` 一致，无 reroute。
  - `[build-code current-implementation-receipt-20260812]` 通过 `writeCurrentImplementationReceipt` 为当前 snapshot `8a7b8948a73b3175b910332fc6d15f5b9ed0b97c` 写入 `quality/evidence/implementation/91d9f648f051f28f5c5c832fb2c876a5e024c81be52b139895153e815dd01566.json`；该事实只绑定当前实现与 diff，不代表质量完成。
  - `[build-code current-integration-review-20260812]` 对当前 snapshot 发起一次新的 `phase_id=null` integration wh-review；attempt `quality/reviews/attempts/bb585634-d1af-4300-9da6-ee9d7b0a18c9/attempt.json`，report `quality/reviews/reports/bb585634-d1af-4300-9da6-ee9d7b0a18c9.md`，结果 `unavailable`，原因是 provider packet preflight 报 `MATERIAL_INCOMPLETE: current implementation receipt for final snapshot is missing`（该 attempt 在当前 implementation receipt 写入前生成）；不能当 pass。
  - `[build-code browser-drilldown-20260812]` 按 isolated-browser-qa 规则用同一 agent-browser session、无登录态复用、无引擎切换，重新打开 fixture `file://` 页面；点击“看流程退化”后保留 project/task 筛选并进入“流程退化”，随后 cleanup session residual=0。该证据仍只覆盖 fixture 页面，真实 Codex E2E 继续 `unknown/incomplete`。
  - `[build-code current-implementation-receipt-20260812-v5]` 当前实现 receipt `quality/evidence/implementation/43e5e12b1fef087274c69d74b3bc5e14510a43f540f64814b1a362320132270d.json`，snapshot_tree=`b895f1a1192990ca6ea9849b58cc26d15ca9321b`，snapshot_commit=`126f1f9892b5cb48a2bb855841b44176244146d6`；包含最新 schema、诊断和 review-fact 修复，不能单独证明质量闭合。
  - `[build-code focused-current-20260812]` `./node_modules/.bin/vitest run tests/m15-*.test.mjs --poolOptions.forks.singleFork --no-fileParallelism --reporter=dot`：5 files / 83 tests passed，另以 `git diff --check` 与五个关键 `.mjs` `node --check` 复核，均 exit 0。
  - `[build-code final-current-buildcode-20260812-v5]` 当前全量 receipt `quality/tests/m15/final-current-buildcode-20260812-v5.json`，snapshot_tree=`b895f1a1192990ca6ea9849b58cc26d15ca9321b`，`npm test -- --runInBand` exit 0；输出为 151 files / 1372 passed / 1 skipped，exclusive 31 passed。该 receipt 与当前实现快照一致；`npm run check` 当前重跑 exit 0（markdownlint、结构、run-checks、skill closure、smoke 全通过）。
  - `[build-code official-run-20260812]` 官方 `stage-runtime run --action=execute --stage=build-code` 已消费当前实现/全量测试/审查输入；`risk_tests_fresh` 与 `finding_dispositions` satisfied，`acceptance_criteria` 与 `integration_review` 仍 missing，stage `status=in_progress`、`quality_status=incomplete`。审查输入在当前实现 receipt 生成前已 unavailable，不能当作 clean review。
  - `[build-code current-limit-20260812]` 生产 transcript registry 仍为空，官方 runner 不提供真实 `step_outcomes`、`skill_outcomes`、`attempt_id` 或 source binding；AC-019/AC-E2E-001、完整 Codex 五阶段链和当前独立 integration review 保持 `unknown/incomplete`。不把 fixture、focused/full tests 或静态页当成真实 E2E。
  - `[verify-code human-confirmation-20260812]` 用户回复“好的，继续吧”，并确认本轮页面实现先交付后由用户基于新版本 WorkflowHub 执行真实任务自测；真实 Codex host/E2E 不在本轮继续证明，保持 `deferred` 与 `unknown/incomplete`，不改写为 pass。
  - `[verify-code handoff-final-20260812]` 大白话交接：Figma 页面已落地，Kimi 已审查并修改，公开静态页已用隔离浏览器检查加载、任务列表、统计、成本、问题、五阶段和证据入口。当前实现可交给用户实际跑任务验证；剩余真实来源绑定、完整五阶段运行事实、独立 review 终态和正式 close 仍未完成，因此 T009 不标任务完成、不授权 commit/push/merge/archive/cleanup。

## 4. Final current-snapshot aggregate strategy

- **tier / method**：feature / fullstack-slice-testing + isolated-browser-qa + real Codex business acceptance
- **scenarios**：19 AC；legacy/current；missing/partial/fatal/conflict；并发投影；manual refresh；AC-016/AC-018 manual verdict；跨 Phase seam；fresh Codex 五阶段
- **command**: `npm test`
- **expected exit**：0
- **oracle**：ORACLE-FINAL — current snapshot 测试、逐 AC、浏览器与真实 host evidence 完整；缺任一项保持 incomplete
- **fixtures_services**：临时 task/storage、隔离浏览器、真实 Codex binding；无 localhost 服务
- **evidence_path**：`quality/tests/m15/final.json`
- **coverage limits**：不覆盖 M16/M17/skills inventory/正式 close；`npm run check`、浏览器和 real E2E 是并列质量事实，不由 `npm test` 冒充
- **STOP**：命令损坏、AC 缺失、边界越界、真实 binding/browser 不可用或需要新决策
- **execution_contract**：当前快照运行一次；失败保留原始输出，回受影响 task，不用全量重跑掩盖局部失败。

## Dependency Graph

- **order**：T001 → T002 → T003 → T004 → T005 → T006 → T007 → T008 → T009

```text
T001 RED → T002 GREEN → T003 RED → T004 GREEN → T005 RED → T006 GREEN → T007 RED → T008 GREEN → T009 FINAL
```

串行原因：每个 Phase 消费前一 Phase 的正式合同或输出；任何并行都会让 facts、diagnostics、projection 或 stage seam 出现双口径。

## Final Boundary Check

- [x] 四个 Phase 的 Goal、Files、Tasks、Verify、Knowledge、STOP、Done、Risks and rollback 完整。
- [x] 每个任务只有一张卡和一个完成区；文件是所属 Phase NEW/MODIFY 的子集。
- [x] 四个行为变化均有同命令、同 oracle 的 RED → GREEN；FINAL 只做一次聚合。
- [x] 依赖无环；19 个 FR 与 19 个 AC 双向追溯闭合；未知 host binding 保持风险和 STOP。
- [x] review、test、evidence 只作为事实记录，不是开始、继续或交付许可证。

## Strict FR execution index

| FR | AC | task(s) | phase | current evidence state |
|---|---|---|---|---|
| FR-SOURCE-001 | AC-SOURCE-001 | T001/T002/T007/T008 | P1/P4 | focused seam; real host unknown |
| FR-SOURCE-002 | AC-SOURCE-002 | T001/T002/T007/T008 | P1/P4 | failure fixtures; real host incomplete |
| FR-FACT-001 | AC-FACT-001 | T001/T002 | P1 | focused tests |
| FR-FACT-002 | AC-FACT-002 | T001/T002 | P1 | schema metadata audit |
| FR-FACT-003 | AC-FACT-003 | T001/T002 | P1 | quality owner boundary |
| FR-FACT-004 | AC-FACT-004 | T001/T002 | P1 | grain/conflict fixtures |
| FR-DIAG-001 | AC-DIAG-001 | T003/T004 | P2 | focused diagnostics |
| FR-DIAG-002 | AC-DIAG-002 | T003/T004 | P2 | domain fixtures; real facts unknown |
| FR-DIAG-003 | AC-DIAG-003 | T003/T004 | P2 | status/coverage fixtures |
| FR-COST-001 | AC-COST-001 | T001/T002/T003/T004 | P1/P2 | dedup/conflict fixtures |
| FR-COST-002 | AC-COST-002 | T003/T004 | P2 | waste separation fixtures |
| FR-COST-003 | AC-COST-003 | T003/T004 | P2 | denominator/trend fixtures |
| FR-PROJ-001 | AC-PROJ-001 | T005/T006 | P3 | projection fixtures |
| FR-PROJ-002 | AC-PROJ-002 | T005/T006 | P3 | lock/atomic fixtures |
| FR-PROJ-003 | AC-PROJ-003 | T005/T006 | P3 | data.js safety fixtures |
| FR-VIEW-001 | AC-VIEW-001 | T005/T006 | P3 | static page; manual evidence incomplete |
| FR-VIEW-002 | AC-VIEW-002 | T005/T006 | P3 | open-once/manual-refresh contract |
| FR-VIEW-003 | AC-VIEW-003 | T005/T006 | P3 | state rendering; browser evidence incomplete |
| FR-E2E-001 | AC-E2E-001 | T007/T008/T009 | P4 | fixture seam green; real host unknown/incomplete |

## Deferred/open handoff closure

| id | status | owner | trigger | handoff / consumer | close / retain condition |
|---|---|---|---|---|---|
| OPEN-001 | closed | make-decision | D-005/D-007/D-008/D-011 | build-spec flow/state | retain current flow/state |
| OPEN-002 | closed | make-decision | D-002 | build-spec stage rule | retain five-stage contract |
| OPEN-003 | closed | make-decision | D-006/D-011 | build-spec metric rules | retain denominator/trend rules |
| OPEN-004 | closed | make-decision | F-003 audit | build-plan/build-code input facts | retain incomplete input evidence |
| OPEN-005 | closed | make-decision | D-003 scope choice | build-plan same-task repair | retain no scope expansion |
| OPEN-006 | closed | make-decision | D-004 source choice | build-code Codex adapter | retain M17 multi-CLI deferral |
| OPEN-007 | closed | make-decision | D-005 failure contract | build-code failure states | retain fail-loud/partial semantics |
| OPEN-008 | closed | make-decision | D-006 waste rule | build-code cost diagnostics | retain mechanical-only waste |
| OPEN-009 | closed | make-decision | D-007 static-page choice | build-code static HTML | retain manual refresh/no server |
| OPEN-010 | closed | make-decision | D-008/D-012 authority | build-code projector chain | retain derived-only outputs |
| OPEN-011 | closed | make-decision | D-009 E2E requirement | verify-code fresh-host evidence | retain incomplete until binding |
| OPEN-012 | closed | make-decision | D-010 registration | build-code opaque source binding | retain no native scan |
| OPEN-013 | closed | make-decision | D-012 single authority | build-code/verify-code facts authority | retain supporting evidence only |

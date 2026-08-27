# 任务清单：WorkflowHub 可执行的设计与体验交付合同

- **Input**：`specs/executable-ui-fullstack-design-contract-20260826/decision-log.md`（SHA-256 `1cce678ce408a833bc1d65801098fde191a92b56db057c0b5324be7adf92533f`）、`specs/executable-ui-fullstack-design-contract-20260826/spec.md`（SHA-256 `0b2ca495209fe128e87eedc49504e9cbc6baeaa181cb52acf9f0e874b76961e9`）、`specs/executable-ui-fullstack-design-contract-20260826/plan.md`（SHA-256 `88998fadd5c2831d8d51ad98a4a75a43de68aff98ab8c5db60fe975df1722e2f`）
- **Template version**：`plan-task.v3`

## Phase P1 — 规范身份、影响与消费者合同

### Goal

共享合同能区分 Design/Experience 的职责和 identity、按真实证据给出影响分类、生成可重放 census，并为 UI/backend/fullstack 计算唯一的 covered/incomplete/unknown 结论。

### Files

- **NEW**：N/A — no new production file
- **MODIFY**：`runtime/stage/stage-content-contracts.mjs`; `skills/ui-project-init/SKILL.md`; `skills/design-source-readiness/SKILL.md`; `skills/frontend-component-quality/SKILL.md`; `tests/contract/ui-stage-integration.test.mjs`; `tests/contract/ui-frontend-governance.test.mjs`; `tests/stage-interaction-contract.test.mjs`
- **DO NOT TOUCH**：`runtime/stage/stage-agent-outcome-adapter.mjs`、`tests/integration/vnext-official-stage-run.test.mjs`、`tools/host/workflowhub-stage-agent-bridge.mjs`，均为保护的 unrelated WIP/历史 fail-closed 边界。

### Tasks

- T001：先加入 identity、职责、census、影响、interaction aggregate 生命周期和 quality conclusion 的反例，证明当前局部能力不能满足新合同（RED）。
- T002：扩展现有合同和 UI skill 输入输出，使 T001 的目标断言通过并保留 unknown/incomplete 负例（GREEN）。
- T003：加入 API→DTO→schema/migration→persistence→consumer 回读及各层失败边界反例（RED）。
- T004：实现可绑定、可恢复、可幂等声明的后端/fullstack 合同，使 T003 目标断言通过（GREEN）。

### Verify

P1 的目标命令按测试文件实际运行器拆开记录：T001/T003 的历史 RED 使用 `node --test tests/contract/ui-stage-integration.test.mjs tests/contract/ui-frontend-governance.test.mjs`（两文件均为 `node:test`）；T002/T004 的 GREEN 在同一 Node 命令之外，另用 source-pinned Vitest 运行 `tests/stage-interaction-contract.test.mjs` 的生命周期切片。不能把未捕获的历史 RED 输出补写成三文件命令，也不能用后续 GREEN hash 代替；当前 T009 再用三文件 Vitest 组合覆盖全部 P1 seam。证据路径分别为 `quality/tests/plan/P1-T001-red.json`、`quality/tests/plan/P1-T002-green.json`、`quality/tests/plan/P1-T003-red.json` 和 `quality/tests/plan/P1-T004-green.json`，oracle 分别为 ORACLE-P1-CONTRACT 和 ORACLE-P1-DATA-CONTRACT。

### Knowledge

P2 需要 identity/census/quality 函数、interaction writer 和后端层合同的字段、状态枚举、稳定排序、回读和不适用边界；P1 不写 stage outcome，不运行浏览器。

### STOP

若需要新 evidence store、第二状态机、框架特定页面假设，或无法从当前源码 snapshot 得到稳定 consumer_id，停止并回到 spec/plan。

### Done

T001/T003 RED、T002/T004 GREEN、源→FR/AC 映射和 unknown/incomplete 负例都有真实证据；不把仓库无业务页面写成 UI covered。

### Risks and rollback

受 PLAN-RISK-001/002/005 影响；回滚只撤销 P1 修改，保留四材料和已有事实。F11 差异交给 P2。

#### T001 — RED：共享规范与影响合同反例

- **ID**：T001
- **Phase**：Phase P1 — 规范身份、影响与消费者合同
- **goal**：让缺 Design/Experience identity、职责重叠、consumer census unknown、影响 downgrade、interaction aggregate 生命周期和质量结论优先级的反例明确失败。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/executable-ui-fullstack-design-contract-20260826/spec.md","hash":"0b2ca495209fe128e87eedc49504e9cbc6baeaa181cb52acf9f0e874b76961e9","id":"SPEC"},{"artifact_kind":"plan","ref":"specs/executable-ui-fullstack-design-contract-20260826/plan.md","hash":"88998fadd5c2831d8d51ad98a4a75a43de68aff98ab8c5db60fe975df1722e2f","id":"PLAN"}]`
- **source_refs / decision_refs**：R-001/R-002 → D-004/D-008/D-012/D-013/D-016/D-019 → FR-DOC-001、FR-DOC-002、FR-DOC-003、FR-DOC-004、FR-CON-001、FR-CON-002、FR-CON-004、FR-CON-005、FR-REL-001 → AC-001、AC-002、AC-003、AC-004、AC-005、AC-006、AC-008、AC-009、AC-013、AC-016、AC-017、AC-018
- **输入**：当前 spec/plan 与既有 UI contract/export；目标反例在指定 contract tests 中声明。
- **依赖**：none
- **并行**：否 — first RED for P1 behavior
- **FR**：FR-DOC-001、FR-DOC-002、FR-DOC-003、FR-DOC-004、FR-CON-001、FR-CON-002、FR-CON-004、FR-CON-005、FR-REL-001
- **AC**：AC-001、AC-002、AC-003、AC-004、AC-005、AC-006、AC-008、AC-009、AC-013、AC-016、AC-017、AC-018
- **动作**：增加因目标断言失败的 identity、职责、census、影响、interaction aggregate 生命周期和 quality conclusion 测试，不改生产实现。
- **精确文件**：`tests/contract/ui-stage-integration.test.mjs`; `tests/contract/ui-frontend-governance.test.mjs`; `tests/stage-interaction-contract.test.mjs`
- **boundary**：files: `tests/contract/ui-stage-integration.test.mjs`; `tests/contract/ui-frontend-governance.test.mjs`; `tests/stage-interaction-contract.test.mjs`; symbols/regions: P1 governance and aggregate lifecycle contract test cases only
- **输出**：目标断言因缺少新合同而非 setup 错误返回非零；unknown/失败反例可定位。
- **Knowledge**：当前导出只有局部 readiness/applicability/component map；既有浏览器和 plan parser 不能证明本卡全部事实。
- **verification_role**：RED
- **paired_task**：T002
- **gate_cmd**：`npm exec vitest run tests/contract/ui-stage-integration.test.mjs tests/contract/ui-frontend-governance.test.mjs tests/stage-interaction-contract.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：1
- **oracle**：ORACLE-P1-CONTRACT — 缺 identity、职责边界、动态 consumer、unknown downgrade、interaction aggregate 生命周期和结论优先级的目标断言失败。
- **evidence_path**：`quality/tests/plan/P1-T001-red.json`
- **STOP**：若失败来自依赖/环境而不是目标断言，命令不稳定，或测试要求新产品决策，停止回 spec/plan。
- **recovery**：task owner 保留 RED 输出，修正测试输入或回到 owning material，不改写为通过。
- **task risk**：把“字段存在”误当真实 consumer/identity 行为，导致 RED 不可证伪。
- **test tier / test method**：fullstack — runtime contract、schema-adjacent UI facts 和 strict analyzer 共用边界。
- **scenarios / commands / expected exit / oracle**：缺规范、规范重叠、路径/hash/revision/anchor 漂移、未支持 consumer、unknown 影响、aggregate 缺 round/decision binding、covered/incomplete/unknown precedence；同上命令，预期 1，ORACLE-P1-CONTRACT。
- **fixtures_services**：现有 contract fixtures；不启动外部服务，不创建新 fixture store。
- **coverage limits**：只证明合同缺口；不证明下游页面视觉、真实 API 或浏览器。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：completed
- **actual_changes**：在三个指定合同测试文件加入 P1 identity、职责、consumer/impact、aggregate 和 conclusion 的目标反例；未改生产实现。
- **executed_commands**：`node --test tests/contract/ui-stage-integration.test.mjs tests/contract/ui-frontend-governance.test.mjs` → exit 1；失败为目标合同缺少导出，不是 setup 失败。
- **evidence_refs**：`[{"kind":"test_run","ref":"quality/tests/plan/P1-T001-red.json","sha256":"fa690de1fe03392e69fadfbef537702561a54e6fd5c3676d009d2ad8a579d32a"},{"kind":"test_run","ref":"quality/tests/plan/P1-T003-red.json","sha256":"f980450b58b7b80a40a95033a68b12b59eefe8753834222b180a78278ea830c4"}]`
- **covered_ac**：AC-001、AC-002、AC-003、AC-004、AC-005、AC-006、AC-008、AC-009、AC-013、AC-016、AC-017、AC-018 的 RED 缺口事实。
- **review_fact**：与 P1 Phase review 绑定；wh-review 两次材料包均超过 330 KiB，记录 `unavailable`，无 provider findings 可处置。
- **completed_at**：2026-08-26T18:00:00+08:00
- **执行事实**：RED 已证明目标合同断言先失败；不声称产品页面、浏览器、外部 API 或数据库覆盖。

#### T002 — GREEN：规范身份与影响合同实现

- **ID**：T002
- **Phase**：Phase P1 — 规范身份、影响与消费者合同
- **goal**：实现 Design/Experience identity 与职责验证、真实可重放 census、interaction aggregate 生命周期和 quality conclusion，使 T001 目标断言通过并保留负例。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/executable-ui-fullstack-design-contract-20260826/spec.md","hash":"0b2ca495209fe128e87eedc49504e9cbc6baeaa181cb52acf9f0e874b76961e9","id":"SPEC"},{"artifact_kind":"plan","ref":"specs/executable-ui-fullstack-design-contract-20260826/plan.md","hash":"88998fadd5c2831d8d51ad98a4a75a43de68aff98ab8c5db60fe975df1722e2f","id":"PLAN"}]`
- **source_refs / decision_refs**：R-001/R-002 → D-004/D-008/D-012/D-013/D-016/D-019 → FR-DOC-001、FR-DOC-002、FR-DOC-003、FR-DOC-004、FR-CON-001、FR-CON-002、FR-CON-004、FR-CON-005、FR-REL-001 → AC-001、AC-002、AC-003、AC-004、AC-005、AC-006、AC-008、AC-009、AC-013、AC-016、AC-017、AC-018
- **输入**：T001 的目标失败事实、当前 readiness/applicability/component validators 和当前四材料。
- **依赖**：T001
- **并行**：否 — RED/GREEN 必须串行
- **FR**：FR-DOC-001、FR-DOC-002、FR-DOC-003、FR-DOC-004、FR-CON-001、FR-CON-002、FR-CON-004、FR-CON-005、FR-REL-001
- **AC**：AC-001、AC-002、AC-003、AC-004、AC-005、AC-006、AC-008、AC-009、AC-013、AC-016、AC-017、AC-018
- **动作**：在现有 stage-content contract 中增加窄 identity/readiness、Experience 分离、版本化 census、影响/quality conclusion 和 interaction aggregate lifecycle 函数；同步三个 UI skill 的输入输出边界与反例测试。census producer 必须明确 `schema_version`、`scanner_version`、源码 snapshot、扫描配置、逐模式 `support_matrix`、稳定 `consumer_id`、枚举 `unknown_reason`、排序规则和 `source=human` 追加语义。
- **精确文件**：`runtime/stage/stage-content-contracts.mjs`; `skills/ui-project-init/SKILL.md`; `skills/design-source-readiness/SKILL.md`; `skills/frontend-component-quality/SKILL.md`; `tests/contract/ui-stage-integration.test.mjs`; `tests/contract/ui-frontend-governance.test.mjs`; `tests/stage-interaction-contract.test.mjs`
- **boundary**：files: `runtime/stage/stage-content-contracts.mjs`; `skills/ui-project-init/SKILL.md`; `skills/design-source-readiness/SKILL.md`; `skills/frontend-component-quality/SKILL.md`; `tests/contract/ui-stage-integration.test.mjs`; `tests/contract/ui-frontend-governance.test.mjs`; `tests/stage-interaction-contract.test.mjs`; symbols/regions: existing UI/content validators and their contract tests
- **输出**：T001 目标断言通过；identity mismatch、职责重叠、未知 consumer、unknown downgrade、aggregate 生命周期不完整和结论 precedence 仍返回准确非 PASS 事实。
- **Knowledge**：Design/Experience 只保存项目源；运行结果仍属于 task evidence；无下游页面时必须 unknown。
- **verification_role**：GREEN
- **paired_task**：T001
- **gate_cmd**：`npm exec vitest run tests/contract/ui-stage-integration.test.mjs tests/contract/ui-frontend-governance.test.mjs tests/stage-interaction-contract.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：0
- **oracle**：ORACLE-P1-CONTRACT — 同 T001；正例通过，缺 identity/consumer/aggregate 失败证据的负例保持 unknown/incomplete。
- **evidence_path**：`quality/tests/plan/P1-T002-green.json`
- **STOP**：若实现需要新增存储、隐式默认 consumer 或弱化 unknown/失败断言，停止回 spec/plan。
- **recovery**：task owner 仅回滚 P1 生产/测试文件，保留 T001 事实和四材料。
- **task risk**：只增加 validator 而不提供真实调用者会重现治理漂移。
- **test tier / test method**：fullstack — 与 T001 相同。
- **scenarios / commands / expected exit / oracle**：与 T001 相同；同一命令，预期 0，ORACLE-P1-CONTRACT。
- **fixtures_services**：与 T001 相同。
- **coverage limits**：与 T001 相同；阶段 handler/真实浏览器留给 P2/build-code。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：completed
- **actual_changes**：在 `runtime/stage/stage-content-contracts.mjs` 增加双规范 identity/职责、可重放 consumer census、影响/结论、UI/backend/fullstack delivery contract 和 interaction aggregate 输入校验；同步三个 UI skill 和对应测试。
- **executed_commands**：`node --test tests/contract/ui-stage-integration.test.mjs tests/contract/ui-frontend-governance.test.mjs` → exit 0，18/18；Vitest lifecycle 补跑 15/15；`node --check runtime/stage/stage-content-contracts.mjs` → exit 0。
- **evidence_refs**：`[{"kind":"test_run","ref":"quality/tests/plan/P1-T002-green.json","sha256":"b6b6ad763c67df52a23de849abdbe9a06d04e2aeda050c827ead725f36dda588"},{"kind":"test_run","ref":"quality/tests/plan/P1-T004-green.json","sha256":"92297b78c52eb6f9bc54f94031bc41dce6e63e75a586e2f540f4de691d8952c6"}]`
- **covered_ac**：AC-001、AC-002、AC-003、AC-004、AC-005、AC-006、AC-008、AC-009、AC-013、AC-016、AC-017、AC-018；仅覆盖合同和内存事实，真实页面留给 P2/下游。
- **review_fact**：当前 P1 Phase review ref `quality/reviews/attempts/afc19c5f-302f-4090-8b44-aa5279b32a1e/attempt.json` 与 `quality/reviews/attempts/a0af9ece-0a14-42b2-ae6b-e174f79be626/attempt.json` 均为 `unavailable/MATERIAL_TOO_LARGE`；未改写为 pass。
- **completed_at**：2026-08-26T18:01:00+08:00
- **执行事实**：实现和测试绑定 snapshot `e806ec5573e151352d0ea5aa79bf01af30b5fbe0`；unknown/incomplete 负例保持真实状态，P2 负责正式 handler 接线。

#### T003 — RED：后端与全栈数据合同反例

- **ID**：T003
- **Phase**：Phase P1 — 规范身份、影响与消费者合同
- **goal**：让 API、DTO、schema/migration、persistence、consumer 五层的成功/失败、状态 owner、恢复、原子性、部分提交和幂等边界，以及真实请求到 consumer read-back 的缺口先失败。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/executable-ui-fullstack-design-contract-20260826/spec.md","hash":"0b2ca495209fe128e87eedc49504e9cbc6baeaa181cb52acf9f0e874b76961e9","id":"SPEC"},{"artifact_kind":"plan","ref":"specs/executable-ui-fullstack-design-contract-20260826/plan.md","hash":"88998fadd5c2831d8d51ad98a4a75a43de68aff98ab8c5db60fe975df1722e2f","id":"PLAN"}]`
- **source_refs / decision_refs**：R-001 → D-003/D-007 → FR-CON-003 → AC-008、AC-021
- **输入**：T002 的共享 identity/census/quality 合同、当前 handler 输入约束和 spec 中 FR-CON-003 的后端字段要求。
- **依赖**：T002
- **并行**：否 — P1 second RED/GREEN pair
- **FR**：FR-CON-003
- **AC**：AC-008、AC-021
- **动作**：在现有 P1 contract tests 中增加数据合同反例：缺层级 owner/recovery、DTO 不兼容被默认值掩盖、迁移非原子、persistence 部分提交不可见、无幂等声明、consumer 重试边界缺失，以及未绑定真实请求→consumer read-back；不改生产实现。
- **精确文件**：`tests/contract/ui-stage-integration.test.mjs`; `tests/contract/ui-frontend-governance.test.mjs`; `tests/stage-interaction-contract.test.mjs`
- **boundary**：files: `tests/contract/ui-stage-integration.test.mjs`; `tests/contract/ui-frontend-governance.test.mjs`; `tests/stage-interaction-contract.test.mjs`; symbols/regions: backend/fullstack contract fixtures and assertions only
- **输出**：目标断言因数据合同缺口而非 setup 错误返回非零；每一层失败均可定位，不能以 UI covered 或字段存在代替回读。
- **Knowledge**：当前仓库没有产品 API；使用内存 request/DTO/persistence/consumer fixture 证明结构和状态语义，不声称真实外部服务结果。
- **verification_role**：RED
- **paired_task**：T004
- **gate_cmd**：`npm exec vitest run tests/contract/ui-stage-integration.test.mjs tests/contract/ui-frontend-governance.test.mjs tests/stage-interaction-contract.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：1
- **oracle**：ORACLE-P1-DATA-CONTRACT — 缺真实请求→consumer 回读、层级失败、状态 owner、恢复/原子性/幂等边界的目标断言失败。
- **evidence_path**：`quality/tests/plan/P1-T003-red.json`
- **STOP**：若实现需要假定具体框架/API、增加第二数据状态机或把 fixture 结果冒充真实产品请求，停止回 spec/plan。
- **recovery**：task owner 保留 RED 输出，修正 fixture 输入或回 owning material，不改写为通过。
- **task risk**：只断言字段结构而没有回读和失败状态，会继续漏掉跨边界缺陷。
- **test tier / test method**：fullstack — in-memory request path with explicit layer failures; no external service.
- **scenarios / commands / expected exit / oracle**：成功请求回读、DTO mismatch、权限/冲突/超时、迁移停止/回滚、persistence 部分提交、幂等冲突、consumer retry/no-retry 和 unknown；同上命令，预期 1，ORACLE-P1-DATA-CONTRACT。
- **fixtures_services**：临时内存 API/DTO/schema/persistence/consumer doubles；不启动用户服务，不写新 fixture store。
- **coverage limits**：只证明数据合同和状态边界，不证明具体下游数据库、网络或真实 API 性能。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：completed
- **actual_changes**：在同一组 P1 合同测试中加入 API/DTO/schema-migration/persistence/consumer 层失败、恢复、原子性、部分提交、幂等和 read-back 反例；未改生产实现。
- **executed_commands**：`node --test tests/contract/ui-stage-integration.test.mjs tests/contract/ui-frontend-governance.test.mjs` → exit 1；`validateDeliveryContract` 缺口为目标数据合同失败。
- **evidence_refs**：`[{"kind":"test_run","ref":"quality/tests/plan/P1-T003-red.json","sha256":"f980450b58b7b80a40a95033a68b12b59eefe8753834222b180a78278ea830c4"}]`
- **covered_ac**：AC-008、AC-021 的 RED 数据边界事实。
- **review_fact**：与 P1 Phase review 绑定；provider 未形成 semantic findings，`MATERIAL_TOO_LARGE` unavailable 原样保留。
- **completed_at**：2026-08-26T18:02:00+08:00
- **执行事实**：RED 只证明合同缺口；没有把内存 fixture 当成产品 API 或数据库结果。

#### T004 — GREEN：后端与全栈数据合同实现

- **ID**：T004
- **Phase**：Phase P1 — 规范身份、影响与消费者合同
- **goal**：实现可绑定、可恢复、可幂等声明的后端/fullstack 合同，使 T003 目标断言通过并保留层级失败事实。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/executable-ui-fullstack-design-contract-20260826/spec.md","hash":"0b2ca495209fe128e87eedc49504e9cbc6baeaa181cb52acf9f0e874b76961e9","id":"SPEC"},{"artifact_kind":"plan","ref":"specs/executable-ui-fullstack-design-contract-20260826/plan.md","hash":"88998fadd5c2831d8d51ad98a4a75a43de68aff98ab8c5db60fe975df1722e2f","id":"PLAN"}]`
- **source_refs / decision_refs**：R-001 → D-003/D-007 → FR-CON-003 → AC-008、AC-021
- **输入**：T003 的失败断言、P1 identity/census/quality 合同和现有 UI/backend applicability 边界。
- **依赖**：T003
- **并行**：否 — RED/GREEN 必须串行
- **FR**：FR-CON-003
- **AC**：AC-008、AC-021
- **动作**：在 `runtime/stage/stage-content-contracts.mjs` 增加后端/fullstack contract producer/validator：五层均需 status、success/failure、state owner、recovery；migration 写明原子性与 forward/rollback 或人工恢复；persistence 写明部分提交和幂等；consumer 映射 retry/no-retry/unknown；fullstack 正例绑定 request→DTO→schema/persistence→consumer read-back。更新指定 P1 tests 保留不兼容、部分提交和不可重试负例。
- **精确文件**：`runtime/stage/stage-content-contracts.mjs`; `tests/contract/ui-stage-integration.test.mjs`; `tests/contract/ui-frontend-governance.test.mjs`; `tests/stage-interaction-contract.test.mjs`
- **boundary**：files: `runtime/stage/stage-content-contracts.mjs`; `tests/contract/ui-stage-integration.test.mjs`; `tests/contract/ui-frontend-governance.test.mjs`; `tests/stage-interaction-contract.test.mjs`; symbols/regions: backend/fullstack contract producer and its tests
- **输出**：T003 目标断言为 0；成功回读可追溯，任一层失败、未知或不支持均保留准确状态和恢复动作。
- **Knowledge**：不增加产品 API、数据库或第二状态机；该合同只描述真实实现应提供的事实和失败边界。
- **verification_role**：GREEN
- **paired_task**：T003
- **gate_cmd**：`npm exec vitest run tests/contract/ui-stage-integration.test.mjs tests/contract/ui-frontend-governance.test.mjs tests/stage-interaction-contract.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：0
- **oracle**：ORACLE-P1-DATA-CONTRACT — 同 T003；成功回读绑定，失败/部分提交/不兼容/不可重试仍准确降级。
- **evidence_path**：`quality/tests/plan/P1-T004-green.json`
- **STOP**：若只能通过默认值、吞掉层级失败或把全栈成功降级为字段存在，停止回 spec/plan。
- **recovery**：task owner 仅回滚 P1 数据合同实现/测试，保留 T003 RED 和四材料。
- **task risk**：合同过于抽象会让后续 handler 无法消费真实状态；必须保留稳定字段和 read-back oracle。
- **test tier / test method**：fullstack — 与 T003 相同。
- **scenarios / commands / expected exit / oracle**：与 T003 相同；同一命令，预期 0，ORACLE-P1-DATA-CONTRACT。
- **fixtures_services**：与 T003 相同。
- **coverage limits**：与 T003 相同；真实产品 API/数据库留给下游 implementation task。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：completed
- **actual_changes**：复用 P1 合同实现 API/DTO/schema-migration/persistence/consumer 五层成功/失败/owner/recovery、原子性/幂等和全栈 request/read-back 绑定，并保留不兼容、部分提交、不可重试负例。
- **executed_commands**：`node --test tests/contract/ui-stage-integration.test.mjs tests/contract/ui-frontend-governance.test.mjs` → exit 0，18/18；Vitest lifecycle 15/15。
- **evidence_refs**：`[{"kind":"test_run","ref":"quality/tests/plan/P1-T004-green.json","sha256":"92297b78c52eb6f9bc54f94031bc41dce6e63e75a586e2f540f4de691d8952c6"}]`
- **covered_ac**：AC-008、AC-021；只证明可消费的数据合同，不声称具体外部服务性能或数据库实现。
- **review_fact**：P1 Phase review `unavailable/MATERIAL_TOO_LARGE`，没有可信 provider semantic result，因此质量声明仍有限制。
- **completed_at**：2026-08-26T18:03:00+08:00
- **执行事实**：GREEN 绑定 current snapshot；P2 才把合同接入正式 handler、证据和阶段入口。

## Phase P2 — 正式阶段、证据和模板接线

### Goal

正式 handler 真正消费 P1 合同；browser evidence、review materials、spec 模板、Skill/catalog/文档和测试表达同一事实；build-code 对适用 UI attempt 只调用一次受控真实 QA，verify-code 能发现漂移。

### Files

- **NEW**：`tests/contract/make-decision-interaction-publication.test.mjs` — contract/integration coverage only; no production authority
- **MODIFY**：`runtime/task/task-kernel-implementation.mjs`; `runtime/stage/stage-handlers.mjs`; `runtime/schemas/browser-qa-evidence.v1.json`; `runtime/evidence/stage-content-evidence.mjs`; `runtime/review/stage-materials.json`; `skills/frontend-testing/SKILL.md`; `skills/isolated-browser-qa/SKILL.md`; `skills/spec-specify/SKILL.md`; `skills/spec-specify/templates/spec-template.md`; `skills/spec-tasks/templates/tasks-template.md`; `skills/spec-plan/templates/plan-template.md`; `skills/spec-plan/skill-bundle.json`; `skills/spec-tasks/skill-bundle.json`; `skills/spec-specify/skill-bundle.json`; `skills/frontend-testing/skill-bundle.json`; `skills/isolated-browser-qa/skill-bundle.json`; `workflows/build-spec/SKILL.md`; `workflows/build-plan/SKILL.md`; `workflows/build-code/SKILL.md`; `workflows/verify-code/SKILL.md`; `workflows/verify-code/design-alignment.mjs`; `skills/catalog.yaml`; `skills/reuse-registry.md`; `tools/architecture/verify-final-coverage.mjs`; `tools/cli/verify-structure.mjs`; `tests/contract/review-materials-contract.test.mjs`; `tests/contract/stage-routing-and-concrete-testing.test.mjs`; `tests/contract/spec-analyze-completeness.test.mjs`; `tests/contract/phase-quality-handoff.test.mjs`; `tests/contract/workflow-quality-regression.test.mjs`; `tests/e2e/vnext-five-stage-current.test.mjs`; `tests/contract/filled-plan-task-production.test.mjs`; `tests/contract/verify-final-coverage.test.mjs`; `tests/contract/confirmation-authorization.test.mjs`; `tests/final-cutover-guards.red.test.mjs`; `tests/helpers/stage-outcome.mjs`; `tests/stage-plan-task-contract.test.mjs`; `tests/stage-risk-acceptance.test.mjs`; `tests/per-invocation-doc-contract.test.mjs`
- **MODIFY**：`runtime/stage/stage-runner.mjs`; `runtime/stage/completion-predicates.mjs`; `runtime/evidence/quality-fact.mjs`; `runtime/evidence/freshness.mjs`; `runtime/schemas/quality-fact.v1.json`; `tests/contract/stage-completion.test.mjs`; `tests/integration/verify-freshness-selection.test.mjs`; `tests/stage-plan-task-contract-v3.test.mjs`
- **DO NOT TOUCH**：`runtime/stage/stage-agent-outcome-adapter.mjs`、`tests/integration/vnext-official-stage-run.test.mjs`、`tools/host/workflowhub-stage-agent-bridge.mjs`。

### Tasks

- T005：加入正式 handler、schema、模板、dependency/consumer 和受控真实 QA 的失败测试，证明“声明/解析”不等于“正式执行”（RED）。
- T006：接通 P1 合同、make-decision writer、受控真实 QA evidence、detail adapter、spec formatter 和治理同步，保留不可用/失败事实（GREEN）。

### Verify

P2 的 T005/T006 使用同一 `npm exec vitest run tests/contract/review-materials-contract.test.mjs tests/contract/make-decision-interaction-publication.test.mjs tests/contract/stage-routing-and-concrete-testing.test.mjs tests/contract/spec-analyze-completeness.test.mjs tests/contract/phase-quality-handoff.test.mjs tests/contract/workflow-quality-regression.test.mjs tests/e2e/vnext-five-stage-current.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`；T005 预期非零，T006 预期 0，证据路径分别为 `quality/tests/plan/P2-T005-red.json` 和 `quality/tests/plan/P2-T006-green.json`，oracle 为 ORACLE-P2-WIRING。

### Knowledge

P3 只接收已稳定的 stage outcome/evidence 输入和 completion missing semantics；P2 的 unavailable review、browser 或 audit 不得变成通过。

### STOP

若要新增公共命令/Runner/持久 QA 对象、放宽 strict analyzer、让 fixture 代替真实服务，或无法确定唯一 owner/consumer，停止并回到 spec/plan。

### Done

T005 RED 与 T006 GREEN 有同命令/同 oracle；正式 handler、schema、Skill、catalog、review materials、make-decision writer 和测试互相引用；所有 unavailable/unknown/incomplete 保持原始原因。

### Risks and rollback

受 PLAN-RISK-001/002/003/004/005 影响；回滚只撤销 P2 接线，保留 P1 合同和真实失败证据。

#### T005 — RED：正式接线与证据身份反例

- **ID**：T005
- **Phase**：Phase P2 — 正式阶段、证据和模板接线
- **goal**：让未被 handler 消费的 UI/Experience/census、QA service/API identity 错配、浏览器/取消/cleanup 失败、fixture-only、interaction writer 未绑定、detail forbidden field、spec old-format、依赖未执行、治理清单失真和 F11 clause drift 断言失败。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/executable-ui-fullstack-design-contract-20260826/spec.md","hash":"0b2ca495209fe128e87eedc49504e9cbc6baeaa181cb52acf9f0e874b76961e9","id":"SPEC"},{"artifact_kind":"plan","ref":"specs/executable-ui-fullstack-design-contract-20260826/plan.md","hash":"88998fadd5c2831d8d51ad98a4a75a43de68aff98ab8c5db60fe975df1722e2f","id":"PLAN"}]`
- **source_refs / decision_refs**：D-006/D-009/D-011/D-014/D-015/D-018/D-019；N-004/N-005 → FR-QA-001、FR-QA-002、FR-QA-003、FR-QA-004、FR-REL-002、FR-GOV-001、FR-GOV-002、FR-GOV-003 → AC-007、AC-010、AC-011、AC-012、AC-014、AC-015、AC-019、AC-020、AC-022
- **输入**：T004 的共享合同、现有 `tools/cli/stage-runtime.mjs → runOfficialStage → officialStageHandler("build-code")` 路径、handler/evidence/schema/Skill/catalog/review material 和 strict analyzer。
- **依赖**：T004
- **并行**：否 — first RED for P2 behavior
- **FR**：FR-QA-001、FR-QA-002、FR-QA-003、FR-QA-004、FR-REL-002、FR-GOV-001、FR-GOV-002、FR-GOV-003
- **AC**：AC-007、AC-010、AC-011、AC-012、AC-014、AC-015、AC-019、AC-020、AC-022
- **动作**：增加正式 handler invocation、受控真实 QA 成功/失败身份、interaction writer replay/conflict、detail、spec generated→strict analyzer、dependency/catalog/constitution 和 Downloads 清单 append-only 反例测试，不改生产实现。
- **精确文件**：`tests/contract/review-materials-contract.test.mjs`; `tests/contract/make-decision-interaction-publication.test.mjs`; `tests/contract/stage-routing-and-concrete-testing.test.mjs`; `tests/contract/spec-analyze-completeness.test.mjs`; `tests/contract/phase-quality-handoff.test.mjs`; `tests/contract/workflow-quality-regression.test.mjs`; `tests/e2e/vnext-five-stage-current.test.mjs`
- **boundary**：files: `tests/contract/review-materials-contract.test.mjs`; `tests/contract/make-decision-interaction-publication.test.mjs`; `tests/contract/stage-routing-and-concrete-testing.test.mjs`; `tests/contract/spec-analyze-completeness.test.mjs`; `tests/contract/phase-quality-handoff.test.mjs`; `tests/contract/workflow-quality-regression.test.mjs`; `tests/e2e/vnext-five-stage-current.test.mjs`; symbols/regions: P2 governance/handler/evidence/writer integration cases only
- **输出**：缺真实 invocation、身份、allowlist、生成格式或声明/执行对应关系时目标断言非零。
- **Knowledge**：T004 已定义状态和身份字段；测试必须从 official stage path 注入受限 receipt/QA adapter，不能以 Skill 文本或 fixture-only 调用绕过 official input。
- **verification_role**：RED
- **paired_task**：T006
- **gate_cmd**：`npm exec vitest run tests/contract/review-materials-contract.test.mjs tests/contract/make-decision-interaction-publication.test.mjs tests/contract/stage-routing-and-concrete-testing.test.mjs tests/contract/spec-analyze-completeness.test.mjs tests/contract/phase-quality-handoff.test.mjs tests/contract/workflow-quality-regression.test.mjs tests/e2e/vnext-five-stage-current.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：1
- **oracle**：ORACLE-P2-WIRING — official handler 未实际调用、QA 成功路径或 service/API/DTO identity 绑定缺失、取消/cleanup/浏览器失败未降级、writer replay/conflict、fixture-only、禁止字段、旧 spec 格式、治理清单或 F11 mismatch 目标断言失败。
- **evidence_path**：`quality/tests/plan/P2-T005-red.json`
- **STOP**：若测试只能通过放宽 schema/analyzer、接受 fixture 代替真实页面或新增公共对象，停止回 spec/plan。
- **recovery**：task owner 保留 RED 事实，修正测试 setup 或回 owning material，不删除 unavailable；不得用 protected integration WIP 的失败掩盖目标断言。
- **task risk**：把文本匹配或 Skill 解析误认为正式 handler 执行。
- **test tier / test method**：fullstack — stage handler、schema、review adapter、Skill/catalog 和 e2e seam。
- **scenarios / commands / expected exit / oracle**：official build-code invocation 一次且可观察、成功 QA、service/API/DTO mismatch、浏览器失败、oracle 失败、用户取消、cleanup 失败、重试使用新 invocation、fixture-only、interaction 同 identity replay、内容变化 conflict、缺 binding、detail forbidden/incomplete、spec old-format、dependency not executed、Downloads 清单 append-only、F11 22 条；同上命令，预期 1，ORACLE-P2-WIRING。
- **fixtures_services**：受控测试 adapter 同时提供成功结果和逐类失败结果，记录 invocation call count、service/API/DTO identity、cleanup；不启动下游业务服务，fixture-only 明确不得升级为真实页面通过。
- **coverage limits**：不声称真实下游 UI 浏览器通过；只证明正式接线失败边界。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：completed
- **actual_changes**：先以新增 P2 contract test 证明正式 interaction writer、browser evidence validator、official QA seam、F11 同步和 review-chain 目标未满足；RED 后接通 P2 生产路径与 Skill/workflow/catalog/review-materials/template 约束，并修复无效 stage-outcome 不应阻断工作、build-code integration review 必须认证 canonical wh-review 链的问题。
- **executed_commands**：预设 `npm exec vitest ...` 因候选 worktree 无本地 binary 无法解析；按 test-routing 记录改用同一文件集和 flags 的 source-pinned `node /Users/Hugh/Hugh/Project/workflowhub/node_modules/vitest/vitest.mjs run ...`，历史 RED exit 1（stdout 未持久化，见 evidence capture note）；GREEN exit 0，118 passed、1 skipped。
- **evidence_refs**：`[{"kind":"test_run","ref":"quality/tests/plan/P2-T005-red.json","sha256":"74cce84bbcc2471af4c94fa73c2357aa0c185dc27b2a99bc9d3717da9473f590"},{"kind":"test_run","ref":"quality/tests/plan/P2-T006-green.json","sha256":"0be37baf68062dcafa767a4683dbd9ff0e38a7aeb7e282649d603371ab15553c"}]`
- **covered_ac**：AC-007、AC-010、AC-011、AC-012、AC-014、AC-015、AC-019、AC-020、AC-022 的目标反例和 GREEN 回归。
- **review_fact**：与 P2 Phase review 绑定；wh-review 调用因 `MATERIAL_TOO_LARGE` unavailable，未形成 provider findings，事实原样保留。
- **completed_at**：2026-08-27T03:12:00+08:00
- **执行事实**：RED 发生在 P2 接线前且 stdout 未持久化，没有把后续 GREEN 输出 hash 冒充历史 RED；GREEN snapshot tree `013f5b624f24d32fcb1dff7166c80a948386b0f9`；候选仓库没有下游业务页面或真实 UI 服务。

#### T006 — GREEN：正式阶段和 QA/template 接线

- **ID**：T006
- **Phase**：Phase P2 — 正式阶段、证据和模板接线
- **goal**：让正式 handler 消费 P1 合同，make-decision writer 绑定一个不可变 aggregate，browser evidence 绑定完整身份，interaction/detail 与 spec generator 合同一致，Skill/catalog/review materials/test 接线真实可查。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/executable-ui-fullstack-design-contract-20260826/spec.md","hash":"0b2ca495209fe128e87eedc49504e9cbc6baeaa181cb52acf9f0e874b76961e9","id":"SPEC"},{"artifact_kind":"plan","ref":"specs/executable-ui-fullstack-design-contract-20260826/plan.md","hash":"88998fadd5c2831d8d51ad98a4a75a43de68aff98ab8c5db60fe975df1722e2f","id":"PLAN"}]`
- **source_refs / decision_refs**：D-006/D-009/D-011/D-014/D-015/D-018/D-019；N-004/N-005 → FR-QA-001、FR-QA-002、FR-QA-003、FR-QA-004、FR-REL-002、FR-GOV-001、FR-GOV-002、FR-GOV-003 → AC-007、AC-010、AC-011、AC-012、AC-014、AC-015、AC-019、AC-020、AC-022
- **输入**：T005 的失败断言、T004 的共享合同和现有五阶段/证据存储边界。
- **依赖**：T005
- **并行**：否 — RED/GREEN 必须串行
- **FR**：FR-QA-001、FR-QA-002、FR-QA-003、FR-QA-004、FR-REL-002、FR-GOV-001、FR-GOV-002、FR-GOV-003
- **AC**：AC-007、AC-010、AC-011、AC-012、AC-014、AC-015、AC-019、AC-020、AC-022
- **动作**：修改 `runtime/task/task-kernel-implementation.mjs` 的现有 make-decision publication 接口、既有 handler/schema/evidence/stage-materials、Skill/workflow/template/catalog 和 P2 测试；官方 build-code 路径一次消费受控 QA adapter，重试生成新 invocation，verify-code 只检查不回写。QA adapter 按 isolated-browser-qa 既有 context/doctor/cleanup 接口记录 service/API/DTO identity、取消和 cleanup 结果；不新增 Runner。
- **精确文件**：`runtime/task/task-kernel-implementation.mjs`; `runtime/stage/stage-handlers.mjs`; `runtime/stage/stage-runner.mjs`; `runtime/stage/completion-predicates.mjs`; `runtime/evidence/quality-fact.mjs`; `runtime/evidence/freshness.mjs`; `runtime/schemas/quality-fact.v1.json`; `runtime/schemas/browser-qa-evidence.v1.json`; `runtime/evidence/stage-content-evidence.mjs`; `runtime/review/stage-materials.json`; `skills/frontend-testing/SKILL.md`; `skills/isolated-browser-qa/SKILL.md`; `skills/spec-specify/SKILL.md`; `skills/spec-specify/templates/spec-template.md`; `skills/spec-tasks/templates/tasks-template.md`; `skills/spec-plan/templates/plan-template.md`; `skills/spec-plan/skill-bundle.json`; `skills/spec-tasks/skill-bundle.json`; `skills/spec-specify/skill-bundle.json`; `skills/frontend-testing/skill-bundle.json`; `skills/isolated-browser-qa/skill-bundle.json`; `workflows/build-spec/SKILL.md`; `workflows/build-plan/SKILL.md`; `workflows/build-code/SKILL.md`; `workflows/verify-code/SKILL.md`; `workflows/verify-code/design-alignment.mjs`; `skills/catalog.yaml`; `skills/reuse-registry.md`; `tools/architecture/verify-final-coverage.mjs`; `tools/cli/verify-structure.mjs`; `tests/contract/review-materials-contract.test.mjs`; `tests/contract/make-decision-interaction-publication.test.mjs`; `tests/contract/stage-routing-and-concrete-testing.test.mjs`; `tests/contract/spec-analyze-completeness.test.mjs`; `tests/contract/phase-quality-handoff.test.mjs`; `tests/contract/workflow-quality-regression.test.mjs`; `tests/e2e/vnext-five-stage-current.test.mjs`; `tests/contract/stage-completion.test.mjs`; `tests/integration/verify-freshness-selection.test.mjs`; `tests/stage-plan-task-contract-v3.test.mjs`; `tests/contract/filled-plan-task-production.test.mjs`; `tests/contract/verify-final-coverage.test.mjs`; `tests/stage-risk-acceptance.test.mjs`; `tests/per-invocation-doc-contract.test.mjs`
- **boundary**：files: `runtime/task/task-kernel-implementation.mjs`; `runtime/stage/stage-handlers.mjs`; `runtime/stage/stage-runner.mjs`; `runtime/stage/completion-predicates.mjs`; `runtime/evidence/quality-fact.mjs`; `runtime/evidence/freshness.mjs`; `runtime/schemas/quality-fact.v1.json`; `runtime/schemas/browser-qa-evidence.v1.json`; `runtime/evidence/stage-content-evidence.mjs`; `runtime/review/stage-materials.json`; `skills/frontend-testing/SKILL.md`; `skills/isolated-browser-qa/SKILL.md`; `skills/spec-specify/SKILL.md`; `skills/spec-specify/templates/spec-template.md`; `skills/spec-tasks/templates/tasks-template.md`; `skills/spec-plan/templates/plan-template.md`; `skills/spec-plan/skill-bundle.json`; `skills/spec-tasks/skill-bundle.json`; `skills/spec-specify/skill-bundle.json`; `skills/frontend-testing/skill-bundle.json`; `skills/isolated-browser-qa/skill-bundle.json`; `workflows/build-spec/SKILL.md`; `workflows/build-plan/SKILL.md`; `workflows/build-code/SKILL.md`; `workflows/verify-code/SKILL.md`; `workflows/verify-code/design-alignment.mjs`; `skills/catalog.yaml`; `skills/reuse-registry.md`; `tools/architecture/verify-final-coverage.mjs`; `tools/cli/verify-structure.mjs`; `tests/contract/review-materials-contract.test.mjs`; `tests/contract/make-decision-interaction-publication.test.mjs`; `tests/contract/stage-routing-and-concrete-testing.test.mjs`; `tests/contract/spec-analyze-completeness.test.mjs`; `tests/contract/phase-quality-handoff.test.mjs`; `tests/contract/workflow-quality-regression.test.mjs`; `tests/e2e/vnext-five-stage-current.test.mjs`; `tests/contract/stage-completion.test.mjs`; `tests/integration/verify-freshness-selection.test.mjs`; `tests/stage-plan-task-contract-v3.test.mjs`; `tests/contract/filled-plan-task-production.test.mjs`; `tests/contract/verify-final-coverage.test.mjs`; `tests/stage-risk-acceptance.test.mjs`; `tests/per-invocation-doc-contract.test.mjs`; symbols/regions: publication methods, official handlers, review completion semantics, persisted review disposition in quality facts/freshness, browser evidence schema/validator, review surfaces, spec/task templates/validator, workflow/skill declarations and their tests
- **输出**：T005 目标断言为 0；缺身份/服务/浏览器/cleanup/transport 的事实保持 blocked/unknown/incomplete，F11 clause count 与真实宪法同步；同一 task/decision/confirmation 的 aggregate 重放幂等，内容变化或缺绑定明确冲突/不完整。
- **Knowledge**：仅 build-code 真实执行 QA；build-plan 只设计，verify-code 不回写 Design/Experience。
- **verification_role**：GREEN
- **paired_task**：T005
- **gate_cmd**：`npm exec vitest run tests/contract/review-materials-contract.test.mjs tests/contract/make-decision-interaction-publication.test.mjs tests/contract/stage-routing-and-concrete-testing.test.mjs tests/contract/spec-analyze-completeness.test.mjs tests/contract/phase-quality-handoff.test.mjs tests/contract/workflow-quality-regression.test.mjs tests/e2e/vnext-five-stage-current.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：0
- **oracle**：ORACLE-P2-WIRING — 同 T005；正式 consumer、writer replay/conflict、schema、template、Skill/catalog、QA 成功/失败路径和负例均一致。
- **evidence_path**：`quality/tests/plan/P2-T006-green.json`
- **STOP**：若实现引入 Runner/公共命令/持久对象、放宽 strict parser 或把 fixture 当真实页面，停止并回 spec/plan。
- **recovery**：task owner 只回滚 P2 接线，保留 P1 合同及 T005 失败事实。
- **task risk**：handler 接线遗漏某一阶段、publication writer 未绑定当前 identity 或 dependency 仍只解析不执行。
- **test tier / test method**：fullstack — 与 T005 相同。
- **scenarios / commands / expected exit / oracle**：与 T005 相同；同一命令，预期 0，ORACLE-P2-WIRING。
- **fixtures_services**：与 T005 相同；QA success/failure adapter 模拟 isolated-browser-qa 的 context/doctor/cleanup，真实 UI service/browser 仍由下游 task 提供。
- **coverage limits**：与 T005 相同；本卡不生成 WorkflowHub 业务页面截图。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：completed
- **actual_changes**：先以新增 P2 contract test 证明正式 interaction writer、browser evidence validator、official QA seam、F11 同步和 review-chain 目标未满足；RED 后接通 P2 生产路径与 Skill/workflow/catalog/review-materials/template 约束，并修复无效 stage-outcome 不应阻断工作、build-code integration review 必须认证 canonical wh-review 链的问题；后续按当前审查修复 service/API/DTO/browser-profile identity、派生 impact 覆盖、QA 失败合并、Design/Experience 强 identity、旧 QA receipt 复用、缺 contract facts 推导、verify-code source/census 漂移、consumer collision、non_ui reason 和 fullstack read-back 绑定。
- **executed_commands**：预设 `npm exec vitest ...` 因候选 worktree 无本地 binary 无法解析；按 test-routing 记录改用同一文件集和 flags 的 source-pinned `node /Users/Hugh/Hugh/Project/workflowhub/node_modules/vitest/vitest.mjs run ...`；历史 RED exit 1（stdout 未持久化，见 evidence capture note）；当前修复后同一 7 文件命令 exit 0，128 passed、1 skipped，output hash `b363f8d3d05e331936b47e690ddb53845c474aa3b6508a20c32cb56edb20a83f`。
- **evidence_refs**：`[{"kind":"test_run","ref":"quality/tests/plan/P2-T006-green.json","sha256":"0be37baf68062dcafa767a4683dbd9ff0e38a7aeb7e282649d603371ab15553c"}]`
- **covered_ac**：AC-007、AC-010、AC-011、AC-012、AC-014、AC-015、AC-019、AC-020、AC-022 的目标反例。
- **review_fact**：P2 re-review 当前公开结果为 `semantic/available`，attempt `quality/reviews/attempts/a16b2489-9eae-4042-99f0-6a9602b7c95d/attempt.json`，report `quality/reviews/reports/a16b2489-9eae-4042-99f0-6a9602b7c95d.md`；7 条 valid major finding 已修复，4 条 invalid_anchor 事实保留并以测试/实现证据关闭；provider token usage unavailable，未改写为通过。
- **completed_at**：2026-08-27T04:43:00+08:00
- **执行事实**：RED 发生在 P2 接线前；没有把后续 GREEN 输出 hash 冒充历史 RED；当前 P2 canonical GREEN 仅证明 WorkflowHub 正式接线和证据合同，候选仓库没有下游业务页面或真实 UI 服务，因此真实页面、截图、性能和外部 API 仍是下游 unknown。

## Phase P3 — Step writer 早失败和最终聚合

### Goal

新 step event 越序在写入时拒绝，合法父子 skill 仍可记录，历史 overlap 继续 fail-closed；最后一次聚合检查用完整回归验证跨 Phase seam，不改历史。

### Files

- **NEW**：N/A — no new production file
- **MODIFY**：`tools/host/workflowhub-codex-session-state.mjs`; `tests/contract/stage-interaction-batching.test.mjs`; `tests/contract/stage-order-and-host-interaction.test.mjs`
- **DO NOT TOUCH**：`tools/host/workflowhub-stage-agent-bridge.mjs`、`tests/integration/vnext-official-stage-run.test.mjs` 及其他保护 WIP。

### Tasks

- T008：在现有 start writer 中实现 manifest 顺序 preflight，并保留 bridge 的历史 fail-closed 语义（GREEN）。
- T009：FINAL 只执行一次当前 task 的聚焦回归，记录每个适用 AC、跨任务 seam、真实退出码和残余风险。

### Verify

T007/T008 使用同一 `npm exec vitest run tests/contract/stage-interaction-batching.test.mjs tests/contract/stage-order-and-host-interaction.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`，预期分别为非零/0，oracle 为 ORACLE-P3-EVENT-ORDER；T009 使用当前 task 的 focused command / ORACLE-FINAL，预期 0，证据路径为 `quality/tests/plan/T009-final.json`。

### Knowledge

最终交接给 build-code：P1/P2 合同和阶段 consumer 已确定；实现必须按任务卡逐条 RED/GREEN，真实 UI 只走受控真实 QA，不能把本任务无页面当浏览器 PASS。

### STOP

若 aggregate 需要改写旧 event、跳过失败测试、增加第五材料或改变 public route，停止并回到对应 Phase/材料。

### Done

T007 RED、T008 GREEN、T009 聚焦回归事实均有命令、exit、oracle、coverage limits 和证据；最终结论仍区分 covered/incomplete/unknown。

### Risks and rollback

受 PLAN-RISK-006 影响；回滚只撤 writer preflight 和新增测试，历史 sidecar 保持原样。

#### T007 — RED：step 顺序写入反例

- **ID**：T007
- **Phase**：Phase P3 — Step writer 早失败和最终聚合
- **goal**：让后续 step 在前置 open 时 start、非法父子 skill 和历史 overlap 改写尝试的断言失败，同时确认合法顺序可继续。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/executable-ui-fullstack-design-contract-20260826/spec.md","hash":"0b2ca495209fe128e87eedc49504e9cbc6baeaa181cb52acf9f0e874b76961e9","id":"SPEC"},{"artifact_kind":"plan","ref":"specs/executable-ui-fullstack-design-contract-20260826/plan.md","hash":"88998fadd5c2831d8d51ad98a4a75a43de68aff98ab8c5db60fe975df1722e2f","id":"PLAN"}]`
- **source_refs / decision_refs**：N-006/D-019 → FR-REL-003 → AC-023
- **输入**：现有 `startCodexSessionEvent`、`finishCodexSessionEvent`、stage steps manifest 和 bridge fail-closed contract。
- **依赖**：T006
- **并行**：否 — first RED for P3 behavior
- **FR**：FR-REL-003
- **AC**：AC-023
- **动作**：增加 writer preflight、父子 skill、历史 overlap 与 sidecar 不写入测试，不改生产实现。
- **精确文件**：`tests/contract/stage-interaction-batching.test.mjs`; `tests/contract/stage-order-and-host-interaction.test.mjs`
- **boundary**：files: `tests/contract/stage-interaction-batching.test.mjs`; `tests/contract/stage-order-and-host-interaction.test.mjs`; symbols/regions: event-order contract cases only
- **输出**：越序 start 目前未被 writer 拒绝的目标断言非零；历史 bridge error 仍保留。
- **Knowledge**：不能修改 protected bridge 或历史 session sidecar。
- **verification_role**：RED
- **paired_task**：T008
- **gate_cmd**：`npm exec vitest run tests/contract/stage-interaction-batching.test.mjs tests/contract/stage-order-and-host-interaction.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：1
- **oracle**：ORACLE-P3-EVENT-ORDER — writer 越序目标断言失败，合法父子/历史 fail-closed 事实可定位。
- **evidence_path**：`quality/tests/plan/P3-T007-red.json`
- **STOP**：若测试需要改历史 event、bridge 或引入新 ledger，停止回 spec/plan。
- **recovery**：task owner 保存 RED 输出并清理仅由测试创建的临时 session state。
- **task risk**：只测最终 bridge 而没证明 writer 早失败。
- **test tier / test method**：feature — host lifecycle seam 与 interaction contract，无产品 API。
- **scenarios / commands / expected exit / oracle**：前置 open 后启动后续 step、skill 仅可嵌套父 step、历史 overlap 不可改写、合法顺序；同上命令，预期 1，ORACLE-P3-EVENT-ORDER。
- **fixtures_services**：测试临时 cwd/session sidecar；测试结束清理临时目录，不碰用户服务。
- **coverage limits**：不证明公共 stage bridge 对新版本全部路径，只证明 writer 合同和历史 fail-closed。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：completed
- **actual_changes**：在两个 P3 合同测试中加入 writer 越序 start、合法父子 skill、非法父绑定、历史 overlap/sidecar 不写入断言；未改生产实现。
- **executed_commands**：source-pinned `node /Users/Hugh/Hugh/Project/workflowhub/node_modules/vitest/vitest.mjs run tests/contract/stage-interaction-batching.test.mjs tests/contract/stage-order-and-host-interaction.test.mjs --config /Users/Hugh/Hugh/Project/workflowhub/vitest.config.mjs --poolOptions.forks.singleFork --no-fileParallelism`，在暂时关闭 preflight 的 RED 快照中 exit 1，失败为 writer 越序目标断言，不是 setup 失败。
- **evidence_refs**：`[{"kind":"test_run","ref":"quality/tests/plan/P3-T007-red.json","sha256":"011235d79eaa34c9abb16da112c3ce08797d7d1d3333dcfc4bb0b4f8cc67fdfb"}]`
- **covered_ac**：AC-023 的越序早失败、合法父子 skill、历史 overlap 和不写入事实；RED 只证明实现前缺口。
- **review_fact**：与 P3 paired GREEN/最终聚合共享当前代码 review 链；没有把 RED exit 1 解释为产品失败。
- **completed_at**：2026-08-27T04:38:23+08:00
- **执行事实**：RED 运行时仅切换测试用 preflight 分支，随后已恢复 `preflightStartEvent`；历史 sidecar 未修改，候选仓库仍无业务页面。

#### T008 — GREEN：step writer manifest preflight

- **ID**：T008
- **Phase**：Phase P3 — Step writer 早失败和最终聚合
- **goal**：在现有 start writer 写入前读取声明顺序，拒绝后续 step 越过 open 前置，允许合法父子 skill，并保持历史 overlap fail-closed。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/executable-ui-fullstack-design-contract-20260826/spec.md","hash":"0b2ca495209fe128e87eedc49504e9cbc6baeaa181cb52acf9f0e874b76961e9","id":"SPEC"},{"artifact_kind":"plan","ref":"specs/executable-ui-fullstack-design-contract-20260826/plan.md","hash":"88998fadd5c2831d8d51ad98a4a75a43de68aff98ab8c5db60fe975df1722e2f","id":"PLAN"}]`
- **source_refs / decision_refs**：N-006/D-019 → FR-REL-003 → AC-023
- **输入**：T007 的失败断言、现有 `startCodexSessionEvent` 和 stage manifest。
- **依赖**：T007
- **并行**：否 — RED/GREEN 必须串行
- **FR**：FR-REL-003
- **AC**：AC-023
- **动作**：扩展现有 session writer 的顺序 preflight；失败时不追加 event，不排序/改写历史；更新 P3 contract tests。
- **精确文件**：`tools/host/workflowhub-codex-session-state.mjs`; `tests/contract/stage-interaction-batching.test.mjs`; `tests/contract/stage-order-and-host-interaction.test.mjs`
- **boundary**：files: `tools/host/workflowhub-codex-session-state.mjs`; `tests/contract/stage-interaction-batching.test.mjs`; `tests/contract/stage-order-and-host-interaction.test.mjs`; symbols/regions: `startCodexSessionEvent` preflight and P3 tests
- **输出**：T007 目标断言为 0；非法 start 返回明确 sequence error 且 state 不变，合法新 attempt 可继续，旧 overlap 仍不可发布。
- **Knowledge**：P2 的 handler/evidence 语义已稳定；bridge 仍是只读 fail-closed 消费者。
- **verification_role**：GREEN
- **paired_task**：T007
- **gate_cmd**：`npm exec vitest run tests/contract/stage-interaction-batching.test.mjs tests/contract/stage-order-and-host-interaction.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：0
- **oracle**：ORACLE-P3-EVENT-ORDER — 同 T007；非法 start 早失败且不写入，历史事实未被改写。
- **evidence_path**：`quality/tests/plan/P3-T008-green.json`
- **STOP**：若需要改 bridge、删除历史 event、改时间戳或加公共命令，停止回 spec/plan。
- **recovery**：task owner 回滚 writer preflight/测试，保留历史 sidecar 和失败事实。
- **task risk**：manifest 读取异常被默认放行会让坏事件继续产生。
- **test tier / test method**：feature — 与 T007 相同。
- **scenarios / commands / expected exit / oracle**：与 T007 相同；同一命令，预期 0，ORACLE-P3-EVENT-ORDER。
- **fixtures_services**：与 T007 相同。
- **coverage limits**：与 T007 相同；完整五阶段发布留给最终 aggregate/实际运行。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：completed
- **actual_changes**：在现有 `startCodexSessionEvent` 写入前增加 stage manifest 顺序 preflight；越序 step、非法父 skill 和未完成依赖明确失败且不写 event，合法父子 skill 继续记录，历史 bridge fail-closed 语义保留；更新两个 P3 合同测试。
- **executed_commands**：同一 source-pinned P3 命令 exit 0，2 files、17 passed；output hash `b39fa0f75285d2d7ff60bc92b11e27971ba0161907de6676106f7935504e17d3`。
- **evidence_refs**：`[{"kind":"test_run","ref":"quality/tests/plan/P3-T008-green.json","sha256":"b05f342cc6895f533214cc2359a448f4ff9dc48b92368ad0b9a90a81a6cdcc33"}]`
- **covered_ac**：AC-023；合法顺序、父子 skill、越序不写入、历史 overlap 保持 fail-closed。
- **review_fact**：P2 review 的 7 条 valid major finding 已修复；旧 review 仍绑定原快照，只作为“当时审查了什么”的 provenance，不冒充当前 `clean`，也不因此要求重新审查或阻塞完成。
- **completed_at**：2026-08-27T04:38:41+08:00
- **执行事实**：GREEN 恢复并验证 `preflightStartEvent`；没有改 protected bridge、历史 event 或公共 route；完整五阶段结果留给 T009 和 verify-code。

#### T009 — FINAL：current-snapshot aggregate verification

- **ID**：T009
- **Phase**：Phase P3 — Step writer 早失败和最终聚合
- **goal**：按 plan.md 的最终路线验证全部适用 AC、跨 Phase seam、当前 focused snapshot 和残余风险；不创建新 authority。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/executable-ui-fullstack-design-contract-20260826/spec.md","hash":"0b2ca495209fe128e87eedc49504e9cbc6baeaa181cb52acf9f0e874b76961e9","id":"SPEC"},{"artifact_kind":"plan","ref":"specs/executable-ui-fullstack-design-contract-20260826/plan.md","hash":"88998fadd5c2831d8d51ad98a4a75a43de68aff98ab8c5db60fe975df1722e2f","id":"PLAN"}]`
- **source_refs / decision_refs**：R-001..R-006、D-001..D-020、N-001/N-004/N-005/N-006/N-018/N-019/N-020/N-021 → FR-DOC-001..004、FR-CON-001..005、FR-QA-001..004、FR-REL-001..003、FR-GOV-001..003 → AC-001..023
- **输入**：T001–T008 的真实 completion/evidence、当前四材料、当前 snapshot。
- **依赖**：T008
- **并行**：否 — aggregate reads all preceding task facts
- **FR**：FR-DOC-001、FR-DOC-002、FR-DOC-003、FR-DOC-004、FR-CON-001、FR-CON-002、FR-CON-003、FR-CON-004、FR-CON-005、FR-QA-001、FR-QA-002、FR-QA-003、FR-QA-004、FR-REL-001、FR-REL-002、FR-REL-003、FR-GOV-001、FR-GOV-002、FR-GOV-003
- **AC**：AC-001、AC-002、AC-003、AC-004、AC-005、AC-006、AC-007、AC-008、AC-009、AC-010、AC-011、AC-012、AC-013、AC-014、AC-015、AC-016、AC-017、AC-018、AC-019、AC-020、AC-021、AC-022、AC-023
- **动作**：只执行一次当前 task 的 focused Vitest command，记录真实 exit/oracle/覆盖范围/剩余 unknown 或 incomplete；不执行包含受保护 integration WIP 的 `npm test` 作为硬 oracle，不修改生产文件和历史事实。
- **精确文件**：`tests/contract/stage-order-and-host-interaction.test.mjs`
- **boundary**：files: `tests/contract/stage-order-and-host-interaction.test.mjs`; symbols/regions: final aggregate invocation and evidence capture only; the other eleven focused files are read-only inputs owned by T001–T008
- **输出**：一份当前 snapshot 的真实 full regression 事实，逐 AC 标记 covered/incomplete/unknown 和未覆盖限制。
- **Knowledge**：最终 aggregate 不把 test 0、review unavailable 或无页面改成产品 release。
- **verification_role**：N/A — non-behavior aggregate verification
- **paired_task**：N/A — aggregate has no RED/GREEN pair
- **gate_cmd**：`npm exec vitest run tests/contract/ui-stage-integration.test.mjs tests/contract/ui-frontend-governance.test.mjs tests/stage-interaction-contract.test.mjs tests/contract/review-materials-contract.test.mjs tests/contract/make-decision-interaction-publication.test.mjs tests/contract/stage-routing-and-concrete-testing.test.mjs tests/contract/spec-analyze-completeness.test.mjs tests/contract/phase-quality-handoff.test.mjs tests/contract/workflow-quality-regression.test.mjs tests/contract/stage-interaction-batching.test.mjs tests/contract/stage-order-and-host-interaction.test.mjs tests/e2e/vnext-five-stage-current.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：0
- **oracle**：ORACLE-FINAL — 当前 snapshot full regression 为 0，跨任务 seam 与负例仍受保护，缺质量事实保持 incomplete/unknown。
- **evidence_path**：`quality/tests/plan/T009-final.json`
- **STOP**：最终命令不可执行、AC 缺失、出现越界修改或需要新产品决策时停止并回对应 task/material。
- **recovery**：task owner 保存原始输出，回受影响 RED/GREEN 卡；不重复全量运行掩盖局部失败。
- **task risk**：聚合遗漏 AC 或把 test 0 当产品通过。
- **test tier / test method**：fullstack — focused snapshot 覆盖 runtime、handler、schema、Skill/template、host seam；受保护 integration WIP 不纳入硬 oracle。
- **scenarios / commands / expected exit / oracle**：全部 AC-001..023、规范缺失/漂移、consumer unknown、后端层失败、真实 QA 成功/blocked/unknown、detail forbidden、spec old-format、治理清单 append-only、step overlap fail-closed 和合法新顺序；focused command，预期 0，ORACLE-FINAL。
- **fixtures_services**：现有测试 fixtures；不启动下游业务服务，浏览器/外部 provider 事实保持其真实状态。
- **coverage limits**：不覆盖下游页面视觉像素、真实 API 数据、浏览器性能数值或外部 provider 可用性；这些必须在后续真实 task 显示 unknown/unavailable；不纳入受保护 integration WIP 的结果。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：completed
- **actual_changes**：未新增生产能力；按 T009 只执行一次当前 snapshot 的 12 文件聚焦聚合回归，覆盖 AC-001..023 的合同 seam、正式 handler、schema/Skill/template、host writer 和 e2e 当前路径。
- **executed_commands**：source-pinned `node /Users/Hugh/Hugh/Project/workflowhub/node_modules/vitest/vitest.mjs run tests/contract/ui-stage-integration.test.mjs tests/contract/ui-frontend-governance.test.mjs tests/stage-interaction-contract.test.mjs tests/contract/review-materials-contract.test.mjs tests/contract/make-decision-interaction-publication.test.mjs tests/contract/stage-routing-and-concrete-testing.test.mjs tests/contract/spec-analyze-completeness.test.mjs tests/contract/phase-quality-handoff.test.mjs tests/contract/workflow-quality-regression.test.mjs tests/contract/stage-interaction-batching.test.mjs tests/contract/stage-order-and-host-interaction.test.mjs tests/e2e/vnext-five-stage-current.test.mjs --config /Users/Hugh/Hugh/Project/workflowhub/vitest.config.mjs --poolOptions.forks.singleFork --no-fileParallelism` → exit 0，12 paths、10 files reported、161 passed、1 skipped；output hash `7c47f15c89a30d1205195a1a1daf2880166f6f6a19770db9eb350c11efdaeb72`。运行时绑定：`snapshot_tree=650c40307cb6dca34872fe7b3e2925a462ea0f89`、`snapshot_commit=4a4e1b3c8ebf81401f753b1fff35968260acdcae`、`execution_snapshot_tree=9e513210c6cddcb3982e547b18013a86c6eeed08`、`material_revision=revision-d03570b303eff2f175fc292b1bbd9f8a2ea2c8e0e43659a6a77b13b103f5d94c`。
- **evidence_refs**：`[{"kind":"test_run","ref":"quality/tests/plan/T009-final.json","sha256":"eb42b9d40f3c294fcbfb69d93b416e1e77e454bbe66315c9178c4aec11a39103"}]`
- **covered_ac**：AC-001、AC-002、AC-003、AC-004、AC-005、AC-006、AC-007、AC-008、AC-009、AC-010、AC-011、AC-012、AC-013、AC-014、AC-015、AC-016、AC-017、AC-018、AC-019、AC-020、AC-021、AC-022、AC-023 的 WorkflowHub 合同和跨阶段 seam 均有当前 focused test 事实；真实业务页面、真实 API/数据库、视觉像素、浏览器性能和外部 provider 仍为 `unknown`/`unavailable`，未升级为 covered。
- **review_fact**：旧 P2 review 的 valid findings 已按实现和测试修复；旧 snapshot 保留为 provenance，当前 `quality-fact.v1.review_status=resolved` 由 stage outcome 写入并可重读，不作为当前 `clean` 标签，也不构成额外完成条件。
- **completed_at**：2026-08-27T04:42:15+08:00
- **执行事实**：最终聚合命令没有纳入 protected integration WIP，也没有修改历史事实；测试 0 只证明当前 WorkflowHub 合同实现回归通过；下游真实页面、服务、视觉、性能和 provider 证据未在本任务执行，仍不构成覆盖。外部 task-store 的 implementation receipt/confirmation 在候选 checkout 不可读，按 unavailable 保留；依据 D-020，旧 review provenance + 同 task 修复 + 当前检查 + 用户确认即可收口，不把该不可读记录变成 clean 重审或额外阻塞。

## Build-code review repair addendum — same task, no new phase/material

- **来源**：外部 WorkflowHub task-store 的 focused integration review attempt `quality/reviews/attempts/25a95fe2-6929-4839-ac31-d925035d2171/attempt.json`、result `quality/reviews/results/build-code-default-c6a8c051afbb81b28e8de62dde564a106fc9bd72-25a95fe2-6929-4839-ac31-d925035d2171.json`、report `quality/reviews/reports/25a95fe2-6929-4839-ac31-d925035d2171.md`；这些是 provenance ref，不随候选源码重复拷贝，当前 checkout 可读性按 unavailable 处理。
- **边界**：这是 T009 后同一 build-code task 的 review 修复，不新增 phase、material、Runner、public command 或第二套状态机；保留 provider 旧 snapshot 结果的真实 provenance，按“已审查、已修复、当前检查完成”收尾，不把 `clean` 变成循环门槛。
- **修复项**：
  - `F-6f19dd451a2d` → `fixed`：受控 QA invocation 使用 `crypto.randomUUID()`，不再用时间戳加随机数拼接。
  - `F-714d21c6b188` → `fixed`：canonical browser evidence 现在必须读取合法 JSON，并与当前 payload 的全部观察内容逐项比对；只忽略外部 ref/hash，旧 pass 不能借 hash 重新绑定。
  - `F-81ba31f06b56` → `fixed`：API failure_classes 必须覆盖 validation、permission、conflict、upstream、timeout 五个语义类别；未知标签、重复类别和无理由 not_applicable 均失败。
  - `F-b0ce39acaee1` → `fixed`：Design/Experience 绑定必须使用结构化 source identity；任意重合 token 只保留给 opaque census/evidence ref。
  - `F-bc37f5c7f87` → `fixed`：delivery required fact 的 `not_applicable` 进入 incomplete，不再从结论中排除。
  - `F-bf89b4d6235`（invalid anchor underlying issue）→ `fixed`：adapter 输入绑定 acceptance criterion、四类身份、route/page/scenario/fixture，并检查返回 payload 的对应值。
  - `F-fa973b4cd5f7`（invalid anchor underlying issue）→ `fixed`：`runStage` 在读取 upstream 或调用 handler 前校验 publication options。
- **验证**：受影响 Vitest 11/11；UI contract Node test 15/15；five-stage e2e 21 passed、1 skipped；`node --check` 三个 runtime 文件通过。完整 `npm test` 的 600000ms capture timeout 仍按原 receipt 保留，不改写为 GREEN。
- **剩余质量事实**：上述 provider 结果是在修复前的 `c6a8c051afbb81b28e8de62dde564a106fc9bd72` snapshot 取得，真实 provenance 保留；按 wh-review 规则不再发起第三轮 provider 审查。修复、当前检查和用户确认共同说明当前结果，不要求为了 `clean` 标签循环重审；当前下游页面、真实服务、浏览器像素/性能和 provider 完整可用性仍是 unknown/unavailable。
- **执行状态**：
  - [x] **同一 task review repair**
  - **status**：completed
  - **actual_changes**：收紧 canonical QA bytes、后端失败分类、规范结构化 identity、required not_applicable、adapter binding 和 runner preflight；补充对应反例测试。
- **evidence_refs**：`[{"kind":"test_run","ref":"quality/tests/plan/D020-review-repair-current.json","sha256":"8922f3c09661930019bc644d5bb836834b5ba85c3d686e0bab1f2836bd5f8510"}]`；该记录包含当前修复检查、reviewed/repaired snapshot、material revision 和 7 条 finding 处置。候选 checkout 没有可独立读取的 implementation receipt，未伪造该 ref，外部 task-store 记录按 unavailable 保留。
  - **covered_ac**：AC-008、AC-010、AC-011、AC-012、AC-014、AC-015、AC-019、AC-020、AC-021、AC-022、AC-023 的失败边界与绑定语义；其余 AC 仍沿用 T009 的合同事实。
- **review_disposition**：`fixed` / `fixed` / `fixed` / `fixed` / `fixed` / `fixed` / `fixed`；provider 旧 snapshot 仅保留审查 provenance，当前 review fact 持久化为 `resolved`，修复与当前检查完成后不再要求 `clean` 证明。

## User correction D-020 — review repair is completion, not a clean loop

- **原始事实**：异源 review 绑定修复前 snapshot 是真实 provenance；这本身不是当前任务的失败，也不要求再发起一轮 review。
- **完成语义**：同一 task 已完成审查、逐条修复有效 finding、完成当前必要检查并取得 verify-code 用户确认，即可按 `resolved` 收尾。`clean` 仅表示审查时没有 finding，不是必须反复追求的状态。
- **实现**：`runtime/stage/stage-runner.mjs` 保留旧 review 的 task/stage/material/snapshot 事实，并在 stage outcome 的 repairs 覆盖所有 actionable finding 时产生 `resolved`；现有 `quality-fact.v1` review fact 持久化该 disposition，`runtime/evidence/freshness.mjs` 重读时仍能认证旧 review provenance 与当前 repaired snapshot；`runtime/stage/completion-predicates.mjs` 消费 `resolved`，build-code 的 finding-dispositions 继续承担具体处置。
- **接线修正**：`tools/host/workflowhub-codex-session-state.mjs` 不再要求 verify-code 额外提供不存在的 spec-analyze 事件；verify-code 只按自己声明的事件判断交接是否完整。
- **测试**：`tests/contract/stage-completion.test.mjs` 和 `tests/integration/verify-freshness-selection.test.mjs` 覆盖未处置 finding 仍不完成、已修复 finding 不需要 clean re-review、`resolved` fresh read 可重放；其余 focused regression 继续保持。
- **边界**：不改旧 review/evidence/session，不创建第三 review、第五材料、Runner、公共命令、额外 gate 或 close 授权；`resolved` 不会伪造新的 provider clean 结果。

## User correction follow-up N-020/N-021 — current governance snapshot and bundle closure

- **原始事实**：当前 `CONSTITUTION.md`/checklist 是 v1.6.0、22 条；少数仍在用的结构检查、计划模板、测试和 Skill Bundle 快照还停留在 21 条或旧 hash。
- **处理**：同步 `tools/architecture/verify-final-coverage.mjs`、`tools/cli/verify-structure.mjs`、`skills/spec-plan/templates/plan-template.md`、`skills/spec-tasks/templates/tasks-template.md`、相关 bundle/catalog hash 和当前测试夹具；历史材料不改写。
- **验证**：`node runtime/evidence/check-skill-closure.mjs`、`node tools/cli/verify-structure.mjs`、`node tools/architecture/verify-final-coverage.mjs --governance` 均 exit 0；该同步只是修正既有消费者漂移，不新增 gate、Runner、公共命令、阶段、材料或持久状态。
- **完成边界**：旧 21 条文本和旧 review/evidence 只读保留为历史事实；当前代码按真实 22 条、合法任务模板层级和实际 bundle hash 校验。

## Final current-snapshot aggregate strategy

- **tier / method**：fullstack；执行当前 task 的 focused Vitest command，不新增测试框架，也不把受保护 integration WIP 纳入硬 oracle。
- **scenarios**：AC-001..023、所有阶段 seam、成功/失败/unknown/incomplete、历史 overlap 和合法新顺序。
- **command**：`npm exec vitest run tests/contract/ui-stage-integration.test.mjs tests/contract/ui-frontend-governance.test.mjs tests/stage-interaction-contract.test.mjs tests/contract/review-materials-contract.test.mjs tests/contract/make-decision-interaction-publication.test.mjs tests/contract/stage-routing-and-concrete-testing.test.mjs tests/contract/spec-analyze-completeness.test.mjs tests/contract/phase-quality-handoff.test.mjs tests/contract/workflow-quality-regression.test.mjs tests/contract/stage-interaction-batching.test.mjs tests/contract/stage-order-and-host-interaction.test.mjs tests/e2e/vnext-five-stage-current.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected exit**：0
- **oracle**：ORACLE-FINAL — 当前 focused snapshot 测试真实为 0；质量缺失和下游无页面仍不升级为 covered。
- **fixtures_services**：现有 contract fixtures；不启动下游服务；浏览器由 build-code 实际 task 清理。
- **evidence_path**：`quality/tests/plan/T009-final.json`
- **coverage limits**：不包含下游页面、真实 API、视觉像素、性能和外部 provider；不纳入受保护 integration WIP 的结果。
- **STOP**：命令损坏、行为卡缺 RED/GREEN、边界越界或需要新设计时停止。
- **execution_contract**：当前快照只运行一次；失败保存原始输出并回受影响 task。

## Dependency Graph

- **order**：T001 (RED) → T002 (GREEN) → T003 (RED) → T004 (GREEN) → T005 (RED) → T006 (GREEN) → T007 (RED) → T008 (GREEN) → T009 (FINAL) → same-task review repair addendum
- **serial reasons**：P1 contracts are producers for P2 handlers; P2 outcome/evidence semantics are producers for P3 event and aggregate checks; every GREEN depends on its RED；T009 后的修复只处理当前 review 发现，不另开 task/phase/material。

```text
T001 (RED) → T002 (GREEN) → T003 (RED) → T004 (GREEN) → T005 (RED) → T006 (GREEN) → T007 (RED) → T008 (GREEN) → T009 (FINAL) → review repair addendum
```

## Final Boundary Check

- [x] 每个 Phase 的 Goal、Files、Tasks、Verify、Knowledge、STOP、Done、Risks and rollback 完整。
- [x] 每个任务只有一张卡和一个完成区；文件是所属 Phase NEW/MODIFY 的子集。
- [x] 每个行为变化都有同命令、同 oracle 的 RED → GREEN；FINAL 只做一次聚合。
- [x] 依赖无环，FR/AC 双向追溯闭合，未知事实没有被写成假设或通过。
- [x] review、test、evidence 只作为事实记录，不是开始、继续或交付许可证。

# Tasks：设计上下文质量与建议式异源审查

**Input**：受控命名产物 spec.md、plan.md
**Status**：Draft

## Global Constraints

- 只消费 accepted spec/plan 的 artifact identity 和本 task 所列锚点；不得扫描全仓补事实。
- 历史 v1/accepted records 只读；无法无损映射必须输出 unknown 和恢复条件。
- 不改 scripts/stage-runtime.mjs、TaskKernel、Workspace/CandidateWorkspace、dispatch、provider config、package.json、宪法。
- 每个行为变化先 RED，再以同一聚焦 gate GREEN；普通 review 修复不得重派 provider。
- task 设计态只允许 ready 或 blocked-by-design；运行状态只属于外置执行记录。

## Authoritative v2 Task-card Contract

B-SPEC#ID is compact notation. Each final v2 expansion is {artifact_kind:"spec",ref:"specs/spec-plan-context-quality/spec.md",hash:"bb2d81a1301a7d57b7f06ca70ca9fd2c81258cfca68bea7220a2fa5c3024f8a6",id:"ID"}. Final v2 output must write the expanded object, not a bare ID or this shorthand.

Every task card must have: task ID, Phase, goal, versioned_refs, Knowledge, boundary, action, test/acceptance command, design_state, STOP, recovery, and task risk. T001–T008 below are the target-card fixture; Phase sections only give shared constraints and cannot replace card fields.

## Phase 1：版本化 spec 与内容证据合同

### Goal

建立 v2 spec identity/事实状态/风险合同，且 v1 历史内容保持可读取。

### Files

- **NEW**：core/schemas/ambiguity-ledger.v2.json
- **MODIFY**：core/stage-content-contracts.mjs、core/stage-content-evidence.mjs、skills/spec-specify/SKILL.md、skills/spec-specify/templates/spec-template.md、workflows/build-spec/SKILL.md、tests/stage-content-evidence.test.mjs
- **DO NOT TOUCH**：scripts/stage-runtime.mjs、core/task-kernel-implementation.mjs

### Tasks

#### T001 RED — 写 v2 spec 合同失败用例

- **ID**：T001
- **design_state**：ready
- **所属 Phase**：Phase 1
- **目标**：为 spec v2 合同建立可证伪 RED oracle
- **versioned_refs**：B-SPEC#(本卡 FR/AC；最终 v2 展开为逐项 ReferenceBinding)
- **Knowledge**：A-001,A-002；只改测试，不写 schema/历史 v1
- **边界**：仅本卡精确文件和已接受 identity；不得扫描全仓、改 runtime 或改历史 accepted records。
- **STOP**：RED 无法真实复现 spec 分层、ReferenceBinding 或 risk 字段缺失。
- **recovery**：补最小 fixture 后重跑同一 RED oracle。
- **task risk**：误把旧 v1 读兼容当新 v2 通过。
- **动作**：在现有 stage-content evidence 测试中加入完整 identity 缺失、重复 ID、stale snapshot、错误事实状态、spec 含代码锚点/工程方案、ReferenceBinding 缺 artifact_kind/ref/hash/id、risk 的 affected IDs/trigger/consequence/mitigation_or_stop/handling_stage/verification 任一缺失、build-spec 缺 ambiguity-ledger.v2 required kind、v2 revision stage identity 变化和 v1 不可改写的失败断言。
- **精确文件**：tests/stage-content-evidence.test.mjs
- **输入**：A-001、A-002；accepted spec 的 FR-01/FR-02/FR-04/FR-05。
- **输出**：当前实现下 exit 1 的 RED 证据和明确断言名。
- **依赖**：None — first task in this Phase
- **并行**：否；T002 消费同一 oracle 和文件。
- **FR**：FR-01、FR-02、FR-04、FR-05
- **AC**：AC-01、AC-02、AC-03、AC-18
- **gate_cmd**：npx vitest run tests/stage-content-evidence.test.mjs
- **expected_exit**：1
- **oracle**：新 v2 行为在缺实现时失败，现有 v1 fixture 未被写入。
- **evidence_path**：apply/evidence/T001-red-stage-content.stderr

#### T002 GREEN — 实现 v2 spec 内容合同

- **ID**：T002
- **design_state**：ready
- **所属 Phase**：Phase 1
- **目标**：实现 spec v2 identity、风险和 required-kind 合同
- **versioned_refs**：B-SPEC#(本卡 FR/AC；最终 v2 展开为逐项 ReferenceBinding)
- **Knowledge**：A-001,A-002,A-003,A-008；不得改 audit/runner
- **边界**：仅本卡精确文件和已接受 identity；不得扫描全仓、改 runtime 或改历史 accepted records。
- **STOP**：audit 不能消费 v2 required kind，或需写历史 artifact/receipt。
- **recovery**：停止并报告 A-003/A-008 不兼容；不降级为 schema-only。
- **task risk**：v2 把工程方案复制进 spec。
- **动作**：新增 ambiguity-ledger.v2 schema，扩展现有 validator/registry、REQUIRED_STAGE_CONTENT_KINDS.build-spec、REVISIONABLE_KINDS 和 spec/build-spec instructions；build-spec 必须发布该 v2 kind，使 PFACT/FR/AC identity、状态、完整 ReferenceBinding、逐字段 risk 与 version binding 可验证；spec schema 明确拒绝代码锚点和工程方案字段。
- **精确文件**：core/schemas/ambiguity-ledger.v2.json、core/stage-content-contracts.mjs、core/stage-content-evidence.mjs、skills/spec-specify/SKILL.md、skills/spec-specify/templates/spec-template.md、workflows/build-spec/SKILL.md、tests/stage-content-evidence.test.mjs
- **输入**：T001 RED oracle；A-001/A-002；PFACT-01、PFACT-02、PFACT-05、PFACT-06。
- **输出**：v2 typed evidence；v1 compatibility read；明确 unknown/STOP。
- **依赖**：T001
- **并行**：否；修改同一 contract 和测试。
- **FR**：FR-01、FR-02、FR-03、FR-04、FR-05
- **AC**：AC-01、AC-02、AC-03、AC-16、AC-18、AC-19
- **gate_cmd**：npx vitest run tests/stage-content-evidence.test.mjs
- **expected_exit**：0
- **oracle**：完整 v2 通过；缺 identity/状态/风险和 stale evidence 失败；v1 bytes/refs 不变。
- **evidence_path**：apply/evidence/T002-green-stage-content.stdout

### Verify

- **Target**：FR-01/02/03/04/05 和 AC-01/02/03/16/18/19
- **gate_cmd**：npx vitest run tests/stage-content-evidence.test.mjs
- **expected_exit**：0
- **evidence_path**：apply/evidence/phase-1-content-contract.stdout
- **display_cmd**：None — focused gate output is the decision oracle
- **Oracle**：v2 完整性和 v1 只读兼容同时成立。

### Knowledge

- A-001 的现有 v1 validator 和 A-002 的 schema/kind registry 已读。
- None — 不需要外部事实；所有行为来自 accepted spec 和当前代码锚点。

### STOP

- v2 需要改写历史 receipt、扫描 CandidateWorkspace 推断 PFACT、或修改 runner/TaskKernel。
- RED 无法在当前聚焦测试真实复现，或 GREEN 只能通过弱化同一 oracle。

### Done

- 新 schema 与 validator/registry/skill/template 同步。
- RED/GREEN 证据存在，旧 v1 仍只读并可报告 unknown。

### Risks and rollback

- **Risk**：v2 复制完整 spec 或把工程结论写回产品层。
- **Prevention**：schema 仅允许 identity/状态/引用/风险字段；review 只接最小 maps。
- **Rollback / recovery**：回退未接受实现；不触碰历史 spec、receipt、evidence。

## Phase 2：plan/tasks 工程判断与静态投影合同

### Goal

让 plan/task 记录最小已读代码、工程决策、质量矩阵、静态设计态和恢复条件。

### Files

- **NEW**：core/schemas/plan-task-contract.v2.json、tests/stage-plan-task-contract.test.mjs
- **MODIFY**：core/schemas/plan-task-contract.v1.json
- **MODIFY**：core/stage-content-contracts.mjs、core/stage-content-evidence.mjs、skills/spec-plan/SKILL.md、skills/spec-plan/templates/plan-template.md、skills/spec-tasks/SKILL.md、skills/spec-tasks/templates/tasks-template.md、workflows/build-plan/SKILL.md、skills/plan-eng-review/SKILL.md
- **DO NOT TOUCH**：core/task-kernel-implementation.mjs、core/workspace.mjs、core/dispatch-component.mjs

### Tasks

#### T003 RED — 写 plan/task v2 合同失败用例

- **ID**：T003
- **design_state**：ready
- **所属 Phase**：Phase 2
- **目标**：为 plan/task v2 与引用闭合建立 RED oracle
- **versioned_refs**：B-SPEC#(本卡 FR/AC；最终 v2 展开为逐项 ReferenceBinding)
- **Knowledge**：A-001,A-002,A-007；只改测试，不改历史 v1
- **边界**：仅本卡精确文件和已接受 identity；不得扫描全仓、改 runtime 或改历史 accepted records。
- **STOP**：无法让缺 ReferenceBinding、PFACT 复制或 card 字段缺失真实失败。
- **recovery**：补最小 fixture 后重跑同一 RED oracle。
- **task risk**：测试只验证 Markdown 文字而不验证解析结果。
- **动作**：新增 plan-task contract 测试，覆盖现有和 legacy FR/AC grammar、accepted_count 非零、遗漏任一 accepted FR/AC/PFACT→FR→AC 的 ReferenceBinding 四字段、plan 复制 PFACT 或反向引用 spec、build-plan 缺 plan-task-contract.v2 required kind、read_now/must_read、Lite/Full trigger、九维记录、authoritative task-card 字段、静态 state、STOP/recovery、DAG 和 v1 non-lossless unknown。
- **精确文件**：tests/stage-plan-task-contract.test.mjs
- **输入**：A-001、A-002、A-007；T002 的 v2 identity 规则。
- **输出**：当前实现下 exit 1 的 RED cases。
- **依赖**：T002
- **并行**：否；v2 spec identity 是 task refs 的前提。
- **FR**：FR-06、FR-07、FR-08、FR-09、FR-10、FR-11
- **AC**：AC-03、AC-04、AC-05、AC-06、AC-07、AC-08、AC-09、AC-10
- **gate_cmd**：npx vitest run tests/stage-plan-task-contract.test.mjs
- **expected_exit**：1
- **oracle**：缺锚点/版本/质量理由、runtime task state、无恢复条件和错误 DAG 被断言失败。
- **evidence_path**：apply/evidence/T003-red-plan-task.stderr

#### T004 GREEN — 实现 plan/task v2 合同和生成规则

- **ID**：T004
- **design_state**：ready
- **所属 Phase**：Phase 2
- **目标**：实现 v1 grammar 兼容与 v2 plan/task authoritative card 合同
- **versioned_refs**：B-SPEC#(本卡 FR/AC；最终 v2 展开为逐项 ReferenceBinding)
- **Knowledge**：A-001,A-002,A-007；不得新建同名 v1 schema
- **边界**：仅本卡精确文件和已接受 identity；不得扫描全仓、改 runtime 或改历史 accepted records。
- **STOP**：v2 需要 runtime state、第二账本、或 audit/runner 改动。
- **recovery**：保持 v1 read compatibility，缺映射报告 unknown。
- **task risk**：字段膨胀或纯 reuse 被强造 DEC。
- **动作**：先扩展既有 plan-task-contract.v1 的 current/legacy FR/AC 只读 grammar，并断言 accepted_count 非零和漏项失败；再新增 plan-task-contract.v2，扩展 validator/registry、REQUIRED_STAGE_CONTENT_KINDS.build-plan、REVISIONABLE_KINDS、plan/tasks templates 和 build-plan/plan-eng-review instructions。v2 task template/contract 的 authoritative fields 必含 task ID、Phase、goal、展开的 ReferenceBinding、Knowledge、boundary、action、test/acceptance command、design_state=ready|blocked-by-design、STOP、recovery、risk；任何缺失/stale/mismatched artifact_kind/ref/hash/id、复制 PFACT 或反向 spec 引用都失败。
- **精确文件**：core/schemas/plan-task-contract.v1.json（MODIFY）、core/schemas/plan-task-contract.v2.json、core/stage-content-contracts.mjs、core/stage-content-evidence.mjs、skills/spec-plan/SKILL.md、skills/spec-plan/templates/plan-template.md、skills/spec-tasks/SKILL.md、skills/spec-tasks/templates/tasks-template.md、workflows/build-plan/SKILL.md、skills/plan-eng-review/SKILL.md、tests/stage-plan-task-contract.test.mjs、tests/stage-content-evidence.test.mjs
- **输入**：T003 RED oracle；A-001/A-002/A-007；accepted spec FR-06 至 FR-11。
- **输出**：可验证 v2 plan/tasks facts 与每张 authoritative task card；build-plan 缺 v2 kind、ReferenceBinding 或 risk/Knowledge/STOP/recovery/task risk 任一字段失败；v1 可读取 current/legacy FR/AC，其他非无损字段报告 unknown；按 DEC-05 记录 observation 或 explicit unknown。
- **依赖**：T003
- **并行**：否；共同修改 parser/templates/tests。
- **FR**：FR-06、FR-07、FR-08、FR-09、FR-10、FR-11
- **AC**：AC-03、AC-04、AC-05、AC-06、AC-07、AC-08、AC-09、AC-10、AC-21
- **gate_cmd**：npx vitest run tests/stage-plan-task-contract.test.mjs tests/stage-content-evidence.test.mjs
- **expected_exit**：0
- **oracle**：accepted_count 非零、漏掉任一 FR/AC/PFACT→FR→AC/ref/hash/ID 失败；only ready|blocked-by-design；纯 reuse 不强造 DEC；观测口径字段完整或 unknown。
- **evidence_path**：apply/evidence/T004-green-plan-task.stdout

### Verify

- **Target**：FR-06/07/08/09/10/11 和 AC-03、AC-04 至 AC-10、AC-21
- **gate_cmd**：npx vitest run tests/stage-plan-task-contract.test.mjs tests/stage-content-evidence.test.mjs
- **expected_exit**：0
- **evidence_path**：apply/evidence/phase-2-plan-task-contract.stdout
- **display_cmd**：None — focused tests are oracle
- **Oracle**：工程判断和最小静态 task 可重复解析；缺事实不会冒充 verified。

### Knowledge

- A-001 现有 DAG/命令/coverage 规则、A-002 typed evidence、A-007 lens-only 责任已读。
- package.json 的 test:safe/test:exclusive scripts 已核实；本 Phase 不加依赖或存储。

### STOP

- 需要复制完整 spec/Decision Log 到 task。
- 需要给纯 P1 reuse 建 DEC/CTRL，或 Lite/Full trigger 只能靠作者主观判断。
- 需要把 in_progress/done/failed 写入 task，或新建 telemetry 系统。

### Done

- v2 schema/validator、模板、build-plan 和 lens 对同一最小合同一致。
- 每个 key DEC 记录质量控制；无影响维度有事实理由；旧 v1 仅兼容读取。

### Risks and rollback

- **Risk**：模板噪声提高认知负担，或 task 成为 runtime 看板。
- **Prevention**：Lite 仅局部无状态，Full 只对接口/schema/state/data/security/concurrency/topology/phase/test 策略变化。
- **Rollback / recovery**：撤销未接受改动；保持 v1 reader 和历史任务不变。

## Phase 3：冻结审查材料和建议式审查呈现

### Goal

保留 make-decision 双 track；让 build-spec/build-plan/verify 的 review 只输出 findings，不因普通修复反复调用 provider。

### Files

- **NEW**：None — 复用 wh-review flow，新增测试在已有目录
- **MODIFY**：workflows/make-decision/SKILL.md、workflows/build-spec/SKILL.md、workflows/build-plan/SKILL.md、skills/wh-review/stage-materials.json、skills/wh-review/contracts/build-spec.md、skills/wh-review/contracts/build-plan.md、skills/wh-review/contracts/verify-code.md、skills/wh-review/scripts/review-materials.mjs、tests/stage-review-cost-policy.test.mjs、tests/final-cutover-guards.red.test.mjs、skills/wh-review/scripts/__tests__/review-controller.test.mjs、skills/wh-review/scripts/__tests__/review-source-materials.test.mjs、skills/wh-review/scripts/__tests__/simple-contracts.test.mjs
- **DO NOT TOUCH**：provider config、core/dispatch-component.mjs、workflows/build-code/SKILL.md 的 strict review 部分

### Tasks

#### T005 RED — 写审查成本和冻结材料失败用例

- **ID**：T005
- **design_state**：ready
- **所属 Phase**：Phase 3
- **目标**：为 findings-only、disposition 与复审成本建立 RED oracle
- **versioned_refs**：B-SPEC#(本卡 FR/AC；最终 v2 展开为逐项 ReferenceBinding)
- **Knowledge**：A-004；只改 review contract/test，不改 provider route
- **边界**：仅本卡精确文件和已接受 identity；不得扫描全仓、改 runtime 或改历史 accepted records。
- **STOP**：需要 provider 重试、第二审查账本或 strict build-code 改动。
- **recovery**：把不可用材料记录为 unavailable 后停止。
- **task risk**：普通修复被错误升级为复审。
- **动作**：扩展现有 wh-review/controller/source-material tests，断言 maps 缺失只产生 unavailable 且不 dispatch，ordinary edit 零 provider，第二 structural full 拒绝，direction/detail 不合并，verify 不含 simplicity，并且普通 finding 缺 fixed/rejected_invalid/accepted_risk disposition 时 resolution 记录失败。
- **精确文件**：tests/stage-review-cost-policy.test.mjs、tests/final-cutover-guards.red.test.mjs、skills/wh-review/scripts/__tests__/review-controller.test.mjs、skills/wh-review/scripts/__tests__/review-source-materials.test.mjs、skills/wh-review/scripts/__tests__/simple-contracts.test.mjs
- **输入**：A-004；D15；T004 输出的 v2 contract/mapping rules。
- **输出**：当前实现下 exit 1 的 review behavior cases。
- **依赖**：T004
- **并行**：否；冻结材料必须先包含 v2 contract。
- **FR**：FR-12、FR-13、FR-14、FR-16
- **AC**：AC-11、AC-12、AC-13、AC-14、AC-20
- **gate_cmd**：npx vitest run tests/stage-review-cost-policy.test.mjs tests/final-cutover-guards.red.test.mjs skills/wh-review/scripts/__tests__/review-controller.test.mjs skills/wh-review/scripts/__tests__/review-source-materials.test.mjs skills/wh-review/scripts/__tests__/simple-contracts.test.mjs
- **expected_exit**：1
- **oracle**：无 maps、重复 structural、verdict-as-gate、track 合并和 verify simplicity 均真实失败。
- **evidence_path**：apply/evidence/T005-red-review-contract.stderr

#### T006 GREEN — 接入 findings-only 和最小 maps 合同

- **ID**：T006
- **design_state**：ready
- **所属 Phase**：Phase 3
- **目标**：实现冻结最小 maps、三类 disposition 与一次结构复审规则
- **versioned_refs**：B-SPEC#(本卡 FR/AC；最终 v2 展开为逐项 ReferenceBinding)
- **Knowledge**：A-004；不传完整仓库/历史到 packet
- **边界**：仅本卡精确文件和已接受 identity；不得扫描全仓、改 runtime 或改历史 accepted records。
- **STOP**：maps/ref/hash/snapshot 不可完整绑定。
- **recovery**：记录 unavailable 或具体恢复条件。
- **task risk**：严重 finding 被静默绕过。
- **动作**：更新 stage materials、review contracts、review material builder 与三阶段/decision Skill 文案，使 maps/ref/hash/snapshot/bytes facts 完整，review 呈现 finding/disposition，ordinary/structural/unavailable 行为可验证；在既有正式 review record 可用时为 T006 写 DEC-05 observation，否则写 explicit unknown。
- **精确文件**：workflows/make-decision/SKILL.md、workflows/build-spec/SKILL.md、workflows/build-plan/SKILL.md、skills/wh-review/stage-materials.json、skills/wh-review/contracts/build-spec.md、skills/wh-review/contracts/build-plan.md、skills/wh-review/contracts/verify-code.md、skills/wh-review/scripts/review-materials.mjs、tests/stage-review-cost-policy.test.mjs、tests/final-cutover-guards.red.test.mjs、skills/wh-review/scripts/__tests__/review-controller.test.mjs、skills/wh-review/scripts/__tests__/review-source-materials.test.mjs、skills/wh-review/scripts/__tests__/simple-contracts.test.mjs
- **输入**：T005 RED oracle；A-004；existing wh-review resolution/flow semantics。
- **输出**：冻结最小 packet、available/unavailable 真实记录、单次 structural budget。
- **依赖**：T005
- **并行**：否；使用同一 contracts/material builder/tests。
- **FR**：FR-12、FR-13、FR-14、FR-16
- **AC**：AC-11、AC-12、AC-13、AC-14、AC-20
- **gate_cmd**：npx vitest run tests/stage-review-cost-policy.test.mjs tests/final-cutover-guards.red.test.mjs skills/wh-review/scripts/__tests__/review-controller.test.mjs skills/wh-review/scripts/__tests__/review-source-materials.test.mjs skills/wh-review/scripts/__tests__/simple-contracts.test.mjs
- **expected_exit**：0
- **oracle**：双 track 保持；maps missing→unavailable/no dispatch；ordinary zero call；最多一轮 structural；每个普通 finding 必有 fixed/rejected_invalid/accepted_risk disposition；serious 仍由既有风险记录处理；按 DEC-05 记录 observation 或 explicit unknown。
- **evidence_path**：apply/evidence/T006-green-review-contract.stdout

### Verify

- **Target**：FR-12/13/14/16 和 AC-11/12/13/14/20
- **gate_cmd**：npx vitest run tests/stage-review-cost-policy.test.mjs tests/final-cutover-guards.red.test.mjs skills/wh-review/scripts/__tests__/review-controller.test.mjs skills/wh-review/scripts/__tests__/review-source-materials.test.mjs skills/wh-review/scripts/__tests__/simple-contracts.test.mjs
- **expected_exit**：0
- **evidence_path**：apply/evidence/phase-3-review-contract.stdout
- **display_cmd**：None — assertions expose dispatch and consumer behavior
- **Oracle**：review 发现问题而非制造通过；结构复审预算和 simplicity location 可证伪。

### Knowledge

- A-004 的 context_map/evidence_map parser、selected material 逻辑和 v2 maps requirement 已读。
- D15 已锁定：方向盲审和细节审查不同轨；严重 finding 的现有用户风险边界不删除。

### STOP

- 需要新 provider route、packet state store、第二 audit、把 unavailable 伪装成 pass、或改变 build-code strict review。
- 需要第二次 structural review 或用户未接受严重风险仍要绕过时停止。

### Done

- Skill/contract/material/test 对 findings、resolution、structural budget、一致。
- 实际 bytes/ref-count 从正式 material 可用时记录；无来源为 unknown。

### Risks and rollback

- **Risk**：严重 finding 静默绕过、普通文字修正浪费审查成本。
- **Prevention**：保留 authenticated serious risk record；按 change dimensions 决定 delta 或一次 structural。
- **Rollback / recovery**：回退未接受 skills/material/tests；历史 flow/result/resolution 只读。

## Phase 4：最小 task 投影与 verify 当前证据对齐

### Goal

build-code 执行者只读 task 所需版本片段；verify 用 accepted design 和 current evidence 报告真实偏离。

### Files

- **NEW**：tests/verify-code-design-alignment.test.mjs
- **MODIFY**：workflows/build-code/SKILL.md、workflows/verify-code/SKILL.md、tests/verify-code-freshness.test.mjs、tests/verify-code-facts.test.mjs
- **DO NOT TOUCH**：skills/simplicity-guard、provider route、core/task-kernel-implementation.mjs

### Tasks

#### T007 RED — 写投影与 design/evidence 对齐失败用例

- **ID**：T007
- **design_state**：ready
- **所属 Phase**：Phase 4
- **目标**：为最小投影和当前 evidence 对齐建立 RED oracle
- **versioned_refs**：B-SPEC#(本卡 FR/AC；最终 v2 展开为逐项 ReferenceBinding)
- **Knowledge**：A-005,A-006；不新建 conformance schema
- **边界**：仅本卡精确文件和已接受 identity；不得扫描全仓、改 runtime 或改历史 accepted records。
- **STOP**：需扫描全仓或重跑 strict review 才能判断。
- **recovery**：输出 affected ID、gap 与 recovery。
- **task risk**：投影成为新的 accepted 事实。
- **动作**：新增/扩展 verify tests，覆盖 task 缺 versioned ref、过宽投影、unknown/stale evidence、未覆盖 AC、未经授权 DEC/CTRL 偏离和错误 recovery condition。
- **精确文件**：tests/verify-code-design-alignment.test.mjs、tests/verify-code-freshness.test.mjs、tests/verify-code-facts.test.mjs
- **输入**：A-005、A-006；T004 v2 task refs；T006 review maps。
- **输出**：当前实现下 exit 1 的 RED alignment cases。
- **依赖**：T006
- **并行**：否；verify contract 依赖完整 review/design shape。
- **FR**：FR-10、FR-15
- **AC**：AC-08、AC-09、AC-15、AC-17
- **gate_cmd**：npx vitest run tests/verify-code-freshness.test.mjs tests/verify-code-facts.test.mjs tests/verify-code-design-alignment.test.mjs
- **expected_exit**：1
- **oracle**：stale/unknown/missing/overwide evidence 无法被当作当前实现证明。
- **evidence_path**：apply/evidence/T007-red-verify-alignment.stderr

#### T008 GREEN — 实现最小投影与 verify 一致性规则

- **ID**：T008
- **design_state**：ready
- **所属 Phase**：Phase 4
- **目标**：实现最小投影、verify 对齐和 AC-17 既有确认范围
- **versioned_refs**：B-SPEC#(本卡 FR/AC；最终 v2 展开为逐项 ReferenceBinding)
- **Knowledge**：A-005,A-006；只消费 accepted refs/current evidence
- **边界**：仅本卡精确文件和已接受 identity；不得扫描全仓、改 runtime 或改历史 accepted records。
- **STOP**：需扩大到完整 code/diff 或自动 hash gate。
- **recovery**：在既有 human confirmation 写 changed-path scope。
- **task risk**：verify 变成第二代码审查。
- **动作**：补 build-code/verify-code Skill 合同和测试，使 task projection 只解析 selected refs，verify 对齐 accepted spec/plan/tasks IDs 与 current AC/phase/test/review evidence，输出 affected ID/evidence gap/recovery；在既有正式 verify record 可用时为 T008 写 DEC-05 observation，否则写 explicit unknown。
- **精确文件**：workflows/build-code/SKILL.md、workflows/verify-code/SKILL.md、tests/verify-code-design-alignment.test.mjs、tests/verify-code-freshness.test.mjs、tests/verify-code-facts.test.mjs
- **输入**：T007 RED oracle；A-005/A-006；accepted v2 artifacts/evidence。
- **输出**：最小投影 rules、current evidence alignment，以及按 DEC-05 的 observation 或 explicit unknown。
- **依赖**：T007
- **并行**：否；同一 behavior/test oracle。
- **FR**：FR-10、FR-15
- **AC**：AC-08、AC-09、AC-15、AC-17
- **gate_cmd**：npx vitest run tests/verify-code-freshness.test.mjs tests/verify-code-facts.test.mjs tests/verify-code-design-alignment.test.mjs
- **expected_exit**：0
- **oracle**：仅 selected refs 被投影；所有偏离含 ID/证据/恢复；不重跑 simplicity/full code review；AC-17 在既有 build-plan/verify human confirmation 核对 changed-path scope；按 DEC-05 记录 observation 或 explicit unknown。
- **evidence_path**：apply/evidence/T008-green-verify-alignment.stdout

### Verify

- **Target**：FR-10/15 和 AC-08/09/15/17
- **gate_cmd**：npx vitest run tests/verify-code-freshness.test.mjs tests/verify-code-facts.test.mjs tests/verify-code-design-alignment.test.mjs
- **expected_exit**：0
- **evidence_path**：apply/evidence/phase-4-verify-alignment.stdout
- **display_cmd**：None — focused tests are oracle
- **Oracle**：当前 snapshot 的设计对齐可验证；缺口不假绿。

### Knowledge

- A-005 Phase Card、A-006 freshness/facts 已读。
- 正式 accepted refs/evidence 是唯一输入；不得由 cwd 或目录发现。

### STOP

- 需要塞完整 spec/plan/tasks/code/diff 到 packet、创建独立 conformance schema、重跑 build-code quality verdict，或触及 AC-17 非目标文件。

### Done

- build-code task projection 与 verify evidence alignment 有清晰最小合同和 RED/GREEN 证据。
- 既有 strict review、simplicity location、runtime architecture 不变。

### Risks and rollback

- **Risk**：verify 成为第二代码审查，投影成为新的事实源。
- **Prevention**：只索引 accepted refs/current evidence；投影临时且不发布 accepted artifact。
- **Rollback / recovery**：回退未接受 workflow/test 修改；accepted design/records 保持。

## Dependency Graph

T001 → T002 → T003 → T004 → T005 → T006 → T007 → T008

- 每项 GREEN 消费前一 RED 同一 oracle。
- Phase 之间共享 stage-content contract 或 review material，文件/输入不独立，禁止伪并行。

## Bidirectional FR / Task / AC Traceability

| FR | Task IDs | AC IDs | Phase | Gate evidence |
|---|---|---|---|---|
| FR-01,FR-02,FR-03,FR-04,FR-05 | T001,T002 | AC-01,AC-02,AC-03(a),AC-16,AC-18,AC-19 | Phase 1 | phase-1-content-contract |
| FR-06,FR-07,FR-08,FR-09,FR-10,FR-11 | T003,T004 | AC-03(b),AC-04,AC-05,AC-06,AC-07,AC-08,AC-09,AC-10,AC-21 | Phase 2 | phase-2-plan-task-contract |
| FR-12,FR-13,FR-14,FR-16 | T005,T006 | AC-11,AC-12,AC-13,AC-14,AC-20 | Phase 3 | phase-3-review-contract |
| FR-10,FR-15 | T007,T008 | AC-08,AC-09,AC-15,AC-17 | Phase 4 | phase-4-verify-alignment |

## Final Boundary Check

- [x] Every Phase has Goal/Files/Tasks/Verify/Knowledge/STOP/Done/Risks and rollback.
- [x] Every task has all 13 fields.
- [x] Every behavior change has RED before GREEN.
- [x] Every gate is executable, narrow, with explicit oracle.
- [x] DAG and FR/task/AC mappings are complete.
- [x] No host identity, fixed artifact root, unrelated rule, runtime architecture change, or undeclared file entered tasks.
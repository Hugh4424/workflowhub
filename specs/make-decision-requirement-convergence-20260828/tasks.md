# 任务清单：make-decision 需求收敛与执行阻塞修复

- **Input**：`specs/make-decision-requirement-convergence-20260828/decision-log.md`、`specs/make-decision-requirement-convergence-20260828/spec.md`、`specs/make-decision-requirement-convergence-20260828/plan.md`
- **Template version**：`plan-task.v3`

## Phase P1 — 收敛交互与结束卡

### Goal

需求矩阵、Grill frontier、Clarify ask-wait/跳过和结束卡三要素拥有可失败合同。

### Files

- **NEW**：`tests/contract/requirement-convergence-regression.test.mjs`
- **MODIFY**：`CONTEXT.md`、`workflows/make-decision/SKILL.md`、`workflows/build-spec/SKILL.md`、`skills/grill-with-docs/SKILL.md`、`skills/spec-clarify/SKILL.md`、`tests/stage-interaction-contract.test.mjs`
- **DO NOT TOUCH**：`runtime/stage/stage-content-contracts.mjs` — P2 所有。

### Tasks

- `T001`：RED 锁定收敛/frontier/Clarify/结束卡负例。
- `T002`：GREEN 最小扩展既有技能合同。

### Verify

`npx vitest run tests/contract/requirement-convergence-regression.test.mjs tests/stage-interaction-contract.test.mjs`；RED=1，GREEN=0；ORACLE-CONVERGENCE。

### Knowledge

P2 消费明确的覆盖、目标、验收、收敛和 lifecycle 语义。

### STOP

若需新增 interaction schema、公共命令或推断用户答案，回 decision-log/spec。

### Done

合同测试通过；结束卡/frontier/Clarify 负例可判。

### Risks and rollback

风险是只改措辞不咬人；回滚生产文档改动，保留 RED。

#### T001 — RED：收敛/frontier/Clarify/结束卡合同

- **ID**：T001
- **Phase**：Phase P1 — 收敛交互与结束卡
- **goal**：未实施前目标断言失败，证明收敛检查、Grill 同卡批次、Clarify 显式跳过痕迹与结束卡三要素尚不可判。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/make-decision-requirement-convergence-20260828/spec.md","hash":"191b5f9df19fe1c631e532c24a62b708841f5c6cccdb8aab652386fcada30a6d","id":"make-decision-requirement-convergence-20260828"},{"artifact_kind":"plan","ref":"specs/make-decision-requirement-convergence-20260828/plan.md","hash":"ad884434ac887fb1988de9fd690443103f8927a9d8822146b6a19f5e9507b099","id":"make-decision-requirement-convergence-20260828"}]`
- **source_refs / decision_refs**：R-001~R-014 / D-001~D-007
- **输入**：已冻结 spec.md；既有 skills 文档与 interaction 生命周期消费者。
- **依赖**：none
- **并行**：否 — first RED for this behavior
- **FR**：FR-CONV-001, FR-CONV-002, FR-CONV-003, FR-CONV-004, FR-GRILL-001, FR-CLARIFY-001, FR-CLARIFY-002
- **AC**：AC-CONV-001, AC-CONV-002, AC-CONV-003, AC-CONV-004, AC-GRILL-001, AC-CLARIFY-001, AC-CLARIFY-002
- **动作**：新增合同断言：矩阵逐条处置与五维标注；Grill 每轮同卡编号+推荐项且依赖后置、等回复；Clarify 有歧义 ask-wait、无歧义 trigger=false 理由；结束卡三要素人话；负例均失败，不改生产实现。
- **精确文件**：`tests/contract/requirement-convergence-regression.test.mjs`、`tests/stage-interaction-contract.test.mjs`
- **boundary**：files: `tests/contract/requirement-convergence-regression.test.mjs`, `tests/stage-interaction-contract.test.mjs`; symbols/regions: 仅测试描述块，不写生产实现。
- **输出**：RED 证据（负例失败信号）。
- **Knowledge**：执行前先核验当前 TaskHandle 完整性与 existing 绑定（task.json + index.json + facts.jsonl + quality/ 全部存在、workspace_mode=existing 且 workspace_root 指向当前 worktree；无 session 时记录 unavailable 事实）；AC-CONV-003（用户确认后才收尾）的证据位置为 `quality/confirmations/<sha256>.json`（human-confirmation.v2）+ 结束卡三要素痕迹（`quality/evidence/interactions/` 与 decision-log 记录），由 stage-end 人工/交互痕迹审查完成；`workflows/make-decision/SKILL.md`、`skills/grill-with-docs/SKILL.md`、`skills/spec-clarify/SKILL.md`、`workflows/build-spec/SKILL.md` 与 `CONTEXT.md` 当前既有消费契约。
- **verification_role**：RED
- **paired_task**：T002
- **gate_cmd**：`npx vitest run tests/contract/requirement-convergence-regression.test.mjs tests/stage-interaction-contract.test.mjs`
- **expected_exit**：1
- **oracle**：`ORACLE-CONVERGENCE` — 未实施时目标断言失败信号
- **evidence_path**：`quality/tests/T001-red.txt`
- **STOP**：环境失败、命令损坏、越界或需要新设计时停止。
- **recovery**：返回计划与 spec 重新核对断言边界。
- **task risk**：断言过弱导致 GREEN 无意义。
- **test tier / test method**：contract / 静态文档断言 + lifecycle 回放。
- **scenarios / commands / expected exit / oracle**：同 gate_cmd；负例契约未满足时 exit 1；oracle ORACLE-CONVERGENCE。
- **fixtures_services**：N/A — 无 fixture/服务。
- **coverage limits**：不覆盖真实用户对话；只覆盖可观察合同痕迹。

##### 执行状态填写区（唯一完成权威）

- [ ] **任务完成**
- **status**：`pending`
- **actual_changes**：N/A — not started
- **executed_commands**：N/A — not started
- **evidence_refs**：N/A — not started
- **covered_ac**：N/A — not started
- **review_fact**：N/A — RED task is reviewed with its paired GREEN Phase result
- **completed_at**：N/A — not completed
- **执行事实**：N/A — not started

#### T002 — GREEN：最小扩展收敛交互合同

- **ID**：T002
- **Phase**：Phase P1 — 收敛交互与结束卡
- **goal**：最小修改既有技能合同与 CONTEXT，使 T001 断言通过并保留负例。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/make-decision-requirement-convergence-20260828/spec.md","hash":"191b5f9df19fe1c631e532c24a62b708841f5c6cccdb8aab652386fcada30a6d","id":"make-decision-requirement-convergence-20260828"},{"artifact_kind":"plan","ref":"specs/make-decision-requirement-convergence-20260828/plan.md","hash":"ad884434ac887fb1988de9fd690443103f8927a9d8822146b6a19f5e9507b099","id":"make-decision-requirement-convergence-20260828"}]`
- **source_refs / decision_refs**：R-001~R-014 / D-001~D-007
- **输入**：T001 失败断言与既有技能合同。
- **依赖**：T001
- **并行**：否 — RED/GREEN 必须串行
- **FR**：FR-CONV-001, FR-CONV-002, FR-CONV-003, FR-CONV-004, FR-GRILL-001, FR-CLARIFY-001, FR-CLARIFY-002
- **AC**：AC-CONV-001, AC-CONV-002, AC-CONV-003, AC-CONV-004, AC-GRILL-001, AC-CLARIFY-001, AC-CLARIFY-002
- **动作**：把矩阵/五维、Grill frontier 与同卡批次、Clarify ask-wait 或显式跳过、结束卡三要素写入既有技能/工作流文档与 CONTEXT 完成卡；只改措辞契约，不新增状态对象。
- **精确文件**：`CONTEXT.md`、`workflows/make-decision/SKILL.md`、`workflows/build-spec/SKILL.md`、`skills/grill-with-docs/SKILL.md`、`skills/spec-clarify/SKILL.md`、`tests/contract/requirement-convergence-regression.test.mjs`
- **boundary**：files: `CONTEXT.md`, `workflows/make-decision/SKILL.md`, `workflows/build-spec/SKILL.md`, `skills/grill-with-docs/SKILL.md`, `skills/spec-clarify/SKILL.md`, `tests/contract/requirement-convergence-regression.test.mjs`; symbols/regions: 既有章节与完成卡。
- **输出**：GREEN 证据与保留的负例断言。
- **Knowledge**：既有技能文档结构；不得新增第二交互机制。
- **verification_role**：GREEN
- **paired_task**：T001
- **gate_cmd**：`npx vitest run tests/contract/requirement-convergence-regression.test.mjs tests/stage-interaction-contract.test.mjs`
- **expected_exit**：0
- **oracle**：`ORACLE-CONVERGENCE` — 目标断言通过且负例保留
- **evidence_path**：`quality/tests/T002-green.txt`
- **STOP**：需新增交互 schema/公共命令或推断用户答案时停止。
- **recovery**：回滚仅文档改动，保留 T001 测试。
- **task risk**：把产品方向写成实现细节；保持术语回归 spec。
- **test tier / test method**：contract / 静态文档断言。
- **scenarios / commands / expected exit / oracle**：同 gate_cmd；目标契约满足退出 0；保留负例样本断言。
- **fixtures_services**：N/A。
- **coverage limits**：不写测试执行；只锁合同痕迹。

##### 执行状态填写区（唯一完成权威）

- [ ] **任务完成**
- **status**：`pending`
- **actual_changes**：N/A — not started
- **executed_commands**：N/A — not started
- **evidence_refs**：N/A — not started
- **covered_ac**：N/A — not started
- **review_fact**：N/A — GREEN Phase result reviewed with paired RED
- **completed_at**：N/A — not completed
- **执行事实**：N/A — not started

## Phase P2 — 语义分析与 authoring 防错

### Goal

现有 spec-analyze 给出可定位 finding；写后 validator 与禁同参重试被合同化。

### Files

- **NEW**：无新增文件（复用 P1 建立的测试文件，不新增）
- **MODIFY**：`runtime/stage/stage-content-contracts.mjs`、`skills/spec-analyze/SKILL.md`、`workflows/build-spec/SKILL.md`、`tests/contract/spec-analyze-completeness.test.mjs`、`tests/contract/requirement-convergence-regression.test.mjs`
- **DO NOT TOUCH**：`runtime/schemas/` — 不新增 schema。

### Tasks

- `T003`：RED 建立四项语义与 authoring 负例。
- `T004`：GREEN 扩展现有 profile/技能合同。

### Verify

`npx vitest run tests/contract/spec-analyze-completeness.test.mjs tests/contract/requirement-convergence-regression.test.mjs`；RED=1，GREEN=0；ORACLE-ANALYZE。

### Knowledge

inconsistent/material_incomplete 是事实，不是 run gate。

### STOP

若需要第五材料、第二 analyzer 或自动决定产品方向，回 spec。

### Done

四项分别可判；缺口可定位；authoring 错误当前步骤修复。

### Risks and rollback

过严规则误伤历史材料；只约束新产出 profile。

#### T003 — RED：语义分析与 authoring 防错合同

- **ID**：T003
- **Phase**：Phase P2 — 语义分析与 authoring 防错
- **goal**：未实现时四项收敛语义与 authoring 纪律断言失败：原始需求覆盖/目标达成/验收清晰/方案收敛分别可判；写后生产形状失败在冻结前被捕获；同一错误同一参数不盲重试。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/make-decision-requirement-convergence-20260828/spec.md","hash":"191b5f9df19fe1c631e532c24a62b708841f5c6cccdb8aab652386fcada30a6d","id":"make-decision-requirement-convergence-20260828"},{"artifact_kind":"plan","ref":"specs/make-decision-requirement-convergence-20260828/plan.md","hash":"ad884434ac887fb1988de9fd690443103f8927a9d8822146b6a19f5e9507b099","id":"make-decision-requirement-convergence-20260828"}]`
- **source_refs / decision_refs**：R-004,R-007,R-022 / D-003,D-005,D-010
- **输入**：spec.md 与 decision-log.md 语义映射；现有 profile 与 validator 导出。
- **依赖**：T002
- **并行**：否 — RED/GREEN 必须串行
- **FR**：FR-ANALYZE-001, FR-ANALYZE-002, FR-AUTHORING-001, FR-AUTHORING-002
- **AC**：AC-ANALYZE-001, AC-ANALYZE-002, AC-AUTHORING-001, AC-AUTHORING-002
- **动作**：为覆盖缺失/目标未回应/验收不可判/方案未收敛/生产形状失败/同参重试建立负例，不改生产实现。
- **精确文件**：`tests/contract/spec-analyze-completeness.test.mjs`、`tests/contract/requirement-convergence-regression.test.mjs`
- **boundary**：files: `tests/contract/spec-analyze-completeness.test.mjs`, `tests/contract/requirement-convergence-regression.test.mjs`; symbols/regions: 仅测试描述块。
- **输出**：RED 证据（语义负例失败信号）。
- **Knowledge**：`validateStageSpecAnalyzeProfile` 与 production validator 当前签名；失败语义 unavailable/fail-loud 两类。
- **verification_role**：RED
- **paired_task**：T004
- **gate_cmd**：`npx vitest run tests/contract/spec-analyze-completeness.test.mjs tests/contract/requirement-convergence-regression.test.mjs`
- **expected_exit**：1
- **oracle**：`ORACLE-ANALYZE` — 四项或 authoring 断言失败信号
- **evidence_path**：`quality/tests/T003-red.txt`
- **STOP**：需要新增 analyzer 或 schema 时停止回 spec。
- **recovery**：回 plan 核对 profile 扩展范围。
- **task risk**：断言依赖错位导致误判。
- **test tier / test method**：contract / 语义回放。
- **scenarios / commands / expected exit / oracle**：同 gate_cmd；负例契约未满足 exit 1；oracle ORACLE-ANALYZE。
- **fixtures_services**：N/A。
- **coverage limits**：不构造完整五份材料 packet；只测可定位语义边界。

##### 执行状态填写区（唯一完成权威）

- [ ] **任务完成**
- **status**：`pending`
- **actual_changes**：N/A — not started
- **executed_commands**：N/A — not started
- **evidence_refs**：N/A — not started
- **covered_ac**：N/A — not started
- **review_fact**：N/A — RED task is reviewed with its paired GREEN Phase result
- **completed_at**：N/A — not completed
- **执行事实**：N/A — not started

#### T004 — GREEN：扩展语义分析 profile 与 authoring 契约

- **ID**：T004
- **Phase**：Phase P2 — 语义分析与 authoring 防错
- **goal**：扩展现有 spec-analyze profile 与技能/工作流合同，并让写后生产校验与禁同参重试被合同捕获。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/make-decision-requirement-convergence-20260828/spec.md","hash":"191b5f9df19fe1c631e532c24a62b708841f5c6cccdb8aab652386fcada30a6d","id":"make-decision-requirement-convergence-20260828"},{"artifact_kind":"plan","ref":"specs/make-decision-requirement-convergence-20260828/plan.md","hash":"ad884434ac887fb1988de9fd690443103f8927a9d8822146b6a19f5e9507b099","id":"make-decision-requirement-convergence-20260828"}]`
- **source_refs / decision_refs**：R-004,R-007,R-022 / D-003,D-005,D-010
- **输入**：T003 失败断言；现有 profile 判定函数与技能文档。
- **依赖**：T003
- **并行**：否 — RED/GREEN 必须串行
- **FR**：FR-ANALYZE-001, FR-ANALYZE-002, FR-AUTHORING-001, FR-AUTHORING-002
- **AC**：AC-ANALYZE-001, AC-ANALYZE-002, AC-AUTHORING-001, AC-AUTHORING-002
- **动作**：最小扩展 profile 判定与技能/工作流文档：四项分别可判、build-spec 契约比对可定位、写后立即运行生产校验、同参失败换写入者；不新增写入校验器。
- **精确文件**：`runtime/stage/stage-content-contracts.mjs`、`skills/spec-analyze/SKILL.md`、`workflows/build-spec/SKILL.md`、`tests/contract/spec-analyze-completeness.test.mjs`、`tests/contract/requirement-convergence-regression.test.mjs`
- **boundary**：files: `runtime/stage/stage-content-contracts.mjs`, `skills/spec-analyze/SKILL.md`, `workflows/build-spec/SKILL.md`, `tests/contract/spec-analyze-completeness.test.mjs`, `tests/contract/requirement-convergence-regression.test.mjs`; symbols/regions: 既有 profile 扩展与消费文档。
- **输出**：GREEN 证据与保留负例。
- **Knowledge**：production validator 与解析器当前行为；兼容读取不等于通过。
- **verification_role**：GREEN
- **paired_task**：T003
- **gate_cmd**：`npx vitest run tests/contract/spec-analyze-completeness.test.mjs tests/contract/requirement-convergence-regression.test.mjs`
- **expected_exit**：0
- **oracle**：`ORACLE-ANALYZE` — 目标断言通过且负例保留
- **evidence_path**：`quality/tests/T004-green.txt`
- **STOP**：需要新增 schema 或公共命令时停止。
- **recovery**：回滚 runtime 改动并保留测试。
- **task risk**：判定过严影响历史材料。
- **test tier / test method**：contract / 语义回放。
- **scenarios / commands / expected exit / oracle**：同 gate_cmd；目标契约满足退出 0；保留负例断言。
- **fixtures_services**：N/A。
- **coverage limits**：不承诺端到端 dogfood；只覆盖 profile 语义边界。

##### 执行状态填写区（唯一完成权威）

- [ ] **任务完成**
- **status**：`pending`
- **actual_changes**：N/A — not started
- **executed_commands**：N/A — not started
- **evidence_refs**：N/A — not started
- **covered_ac**：N/A — not started
- **review_fact**：N/A — GREEN Phase result reviewed with paired RED
- **completed_at**：N/A — not completed
- **执行事实**：N/A — not started

## Phase P3 — 宿主、TaskHandle 与正式审查边界

### Goal

unavailable、真实错误、worktree 三态、TaskHandle 完整性和正式 review 复用可回放，最终覆盖全部 AC。

### Files

- **NEW**：`tests/contract/task-bootstrap-integrity.test.mjs`
- **MODIFY**：`tools/host/workflowhub-codex-session-state.mjs`、`tools/cli/task-bootstrap.mjs`、`workflows/make-decision/SKILL.md`、`tests/contract/governance-startup-event-early-failure.test.mjs`、`tests/contract/requirement-convergence-regression.test.mjs`
- **DO NOT TOUCH**：`skills/wh-review/scripts/`、`runtime/schemas/` — 只复用。

### Tasks

- `T005`：RED 锁定 host/bootstrap/review 边界。
- `T006`：GREEN 最小修改既有 seam。
- `T007`：FINAL 聚合全部 AC 与 dogfood 信号。

### Verify

T005/T006 使用 ORACLE-BOOTSTRAP；T007 使用 ORACLE-FINAL，期望 0。

### Knowledge

TaskHandle 完整性是事实；半创建不自动恢复；provider unavailable 不宣称 pass。

### STOP

出现新 public command/schema、自动恢复、第二打包器或手写 task.json 即停止。

### Done

聚合测试通过；review 或 truthful unavailable 已记录；风险交 verify-code。

### Risks and rollback

bootstrap 影响所有任务；优先诊断与验证，失败时回滚当前改动。

#### T005 — RED：宿主、TaskHandle 与正式审查边界合同

- **ID**：T005
- **Phase**：Phase P3 — 宿主、TaskHandle 与正式审查边界
- **goal**：未实现时 unavailable/fail-loud、worktree 三态、existing 绑定不回滚、半创建目录真实失败与正式 review 复用断言失败。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/make-decision-requirement-convergence-20260828/spec.md","hash":"191b5f9df19fe1c631e532c24a62b708841f5c6cccdb8aab652386fcada30a6d","id":"make-decision-requirement-convergence-20260828"},{"artifact_kind":"plan","ref":"specs/make-decision-requirement-convergence-20260828/plan.md","hash":"ad884434ac887fb1988de9fd690443103f8927a9d8822146b6a19f5e9507b099","id":"make-decision-requirement-convergence-20260828"}]`
- **source_refs / decision_refs**：R-015~R-021,R-023 / D-008,D-011,D-012
- **输入**：非 Codex session 与 TaskHandle 现有运行事实；官方 bootstrap 入口。
- **依赖**：T004
- **并行**：否 — RED/GREEN 必须串行
- **FR**：FR-HOST-001, FR-HOST-002, FR-HOST-004, FR-TASK-001, FR-TASK-002, FR-REVIEW-001, FR-REVIEW-002, FR-REVIEW-003
- **AC**：AC-HOST-001, AC-HOST-002, AC-HOST-004, AC-TASK-001, AC-TASK-002, AC-REVIEW-001, AC-REVIEW-002, AC-REVIEW-003
- **动作**：建立负例：无 session 结构化 unavailable；真实错误 fail-loud；worktree 全有/全无/单边；existing 绑定只校验不覆盖；会话不可用不回滚；半创建 store 按真实失败；正式 review 只走既有入口且错误码保留；AC-REVIEW-003 验证 = 公共审查请求属性 deadline=null 与长时调用文档后台语义（检查既有 runner 请求属性/文档，无法验证时登记 unavailable 事实）。不改生产实现。
- **精确文件**：`tests/contract/task-bootstrap-integrity.test.mjs`、`tests/contract/governance-startup-event-early-failure.test.mjs`
- **boundary**：files: `tests/contract/task-bootstrap-integrity.test.mjs`, `tests/contract/governance-startup-event-early-failure.test.mjs`; symbols/regions: 仅测试描述块。
- **输出**：RED 证据（边界负例失败信号）。
- **Knowledge**：`tools/cli/task-bootstrap.mjs` 与 `tools/host/workflowhub-codex-session-state.mjs` 当前契约；wh-review 正式 runner。
- **verification_role**：RED
- **paired_task**：T006
- **gate_cmd**：`npx vitest run tests/contract/task-bootstrap-integrity.test.mjs tests/contract/governance-startup-event-early-failure.test.mjs`
- **expected_exit**：1
- **oracle**：`ORACLE-BOOTSTRAP` — 边界断言失败信号
- **evidence_path**：`quality/tests/T005-red.txt`
- **STOP**：需要自动恢复、新命令或手写 task.json 时停止。
- **recovery**：回 plan 核对复用边界。
- **task risk**：把真实性事实误写成 machine gate。
- **test tier / test method**：contract / 回放。
- **scenarios / commands / expected exit / oracle**：同 gate_cmd；边界契约未满足 exit 1；oracle ORACLE-BOOTSTRAP。
- **fixtures_services**：N/A。
- **coverage limits**：不覆盖真实第三方 provider 成功路径。

##### 执行状态填写区（唯一完成权威）

- [ ] **任务完成**
- **status**：`pending`
- **actual_changes**：N/A — not started
- **executed_commands**：N/A — not started
- **evidence_refs**：N/A — not started
- **covered_ac**：N/A — not started
- **review_fact**：N/A — RED task is reviewed with its paired GREEN Phase result
- **completed_at**：N/A — not completed
- **执行事实**：N/A — not started

#### T006 — GREEN：最小修改宿主与 TaskHandle seam

- **ID**：T006
- **Phase**：Phase P3 — 宿主、TaskHandle 与正式审查边界
- **goal**：最小修改既有 host/bootstrap/skill 消费契约，使 T005 边界断言通过并保留负例。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/make-decision-requirement-convergence-20260828/spec.md","hash":"191b5f9df19fe1c631e532c24a62b708841f5c6cccdb8aab652386fcada30a6d","id":"make-decision-requirement-convergence-20260828"},{"artifact_kind":"plan","ref":"specs/make-decision-requirement-convergence-20260828/plan.md","hash":"ad884434ac887fb1988de9fd690443103f8927a9d8822146b6a19f5e9507b099","id":"make-decision-requirement-convergence-20260828"}]`
- **source_refs / decision_refs**：R-015~R-021,R-023 / D-008,D-011,D-012
- **输入**：T005 失败断言与官方 bootstrap/session seam。
- **依赖**：T005
- **并行**：否 — RED/GREEN 必须串行
- **FR**：FR-HOST-001, FR-HOST-002, FR-HOST-004, FR-TASK-001, FR-TASK-002, FR-REVIEW-001, FR-REVIEW-002, FR-REVIEW-003
- **AC**：AC-HOST-001, AC-HOST-002, AC-HOST-004, AC-TASK-001, AC-TASK-002, AC-REVIEW-001, AC-REVIEW-002, AC-REVIEW-003
- **动作**：既有 seam 只增加语义区分与诊断（unavailable vs fail-loud）、worktree 三态确定性结果、完整性事实核验与正式 review 消费；AC-REVIEW-003 验证生产侧 deadline=null 与长时后台文档语义（检查既有 runner 请求属性/文档并保留检查记录）；不新增恢复/回滚/第二入口。
- **精确文件**：`tools/host/workflowhub-codex-session-state.mjs`、`tools/cli/task-bootstrap.mjs`、`workflows/make-decision/SKILL.md`、`tests/contract/task-bootstrap-integrity.test.mjs`、`tests/contract/requirement-convergence-regression.test.mjs`
- **boundary**：files: `tools/host/workflowhub-codex-session-state.mjs`, `tools/cli/task-bootstrap.mjs`, `workflows/make-decision/SKILL.md`, `tests/contract/task-bootstrap-integrity.test.mjs`, `tests/contract/requirement-convergence-regression.test.mjs`; symbols/regions: 既有失败与诊断路径。
- **输出**：GREEN 证据与保留负例。
- **Knowledge**：bootstrap 顺序与 create-only/绑定语义；half-created 风险保持登记。
- **verification_role**：GREEN
- **paired_task**：T005
- **gate_cmd**：`npx vitest run tests/contract/task-bootstrap-integrity.test.mjs tests/contract/governance-startup-event-early-failure.test.mjs`
- **expected_exit**：0
- **oracle**：`ORACLE-BOOTSTRAP` — 目标断言通过且负例保留
- **evidence_path**：`quality/tests/T006-green.txt`
- **STOP**：出现新 public command/schema、自动恢复或手写 task.json 时停止。
- **recovery**：回滚生产改动并保留测试。
- **task risk**：误改所有任务的启动路径。
- **test tier / test method**：contract / 回放。
- **scenarios / commands / expected exit / oracle**：同 gate_cmd；目标契约满足退出 0；保留负例断言。
- **fixtures_services**：N/A。
- **coverage limits**：不承诺第三方 provider 成功审查；失败语义可判即可。

##### 执行状态填写区（唯一完成权威）

- [ ] **任务完成**
- **status**：`pending`
- **actual_changes**：N/A — not started
- **executed_commands**：N/A — not started
- **evidence_refs**：N/A — not started
- **covered_ac**：N/A — not started
- **review_fact**：N/A — GREEN Phase result reviewed with paired RED
- **completed_at**：N/A — not completed
- **执行事实**：N/A — not started

#### T007 — FINAL：全部适用 AC 与 dogfood 信号聚合

- **ID**：T007
- **Phase**：Phase P3 — 宿主、TaskHandle 与正式审查边界
- **goal**：一次聚合运行验证全部适用 AC 与 dogfood 信号可判，结果不作为工作许可。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/make-decision-requirement-convergence-20260828/spec.md","hash":"191b5f9df19fe1c631e532c24a62b708841f5c6cccdb8aab652386fcada30a6d","id":"make-decision-requirement-convergence-20260828"},{"artifact_kind":"plan","ref":"specs/make-decision-requirement-convergence-20260828/plan.md","hash":"ad884434ac887fb1988de9fd690443103f8927a9d8822146b6a19f5e9507b099","id":"make-decision-requirement-convergence-20260828"}]`
- **source_refs / decision_refs**：D-009（dogfood 通过标准）
- **输入**：P1/P2/P3 RED/GREEN 证据与保留负例。
- **依赖**：T006
- **并行**：否 — FINAL 聚合依赖全部前置
- **FR**：FR-DOG-001
- **AC**：AC-DOG-001
- **动作**：运行聚合命令并确认六个信号（结束卡三要素、需求全覆盖、Grill 同卡批次、分析字段有值、Clarify 痕迹、非 Codex 正常降级）可判；聚合不要求真实端到端对抗运行；FR-DOG-001 的真实端到端 dogfood（make-decision → 交接）由 build-code 完成后在 verify-code 阶段运行一次，build-plan 只设计，届时不可行则在质量事实中显式登记 unavailable。
- **精确文件**：`tests/contract/task-bootstrap-integrity.test.mjs`、`tests/contract/requirement-convergence-regression.test.mjs`
- **boundary**：files: `tests/contract/task-bootstrap-integrity.test.mjs`, `tests/contract/requirement-convergence-regression.test.mjs`; symbols/regions: 聚合断言与证据路径。
- **输出**：FINAL 聚合证据。
- **Knowledge**：六信号在四个域测试中的映射；review 可 unavailable；AC-CONV-003 证据位置为 `quality/confirmations/<sha256>.json`（human-confirmation.v2）+ 结束卡三要素痕迹（`quality/evidence/interactions/`），由 stage-end 人工/交互痕迹审查完成。
- **verification_role**：N/A — non-behavior change: aggregate final verification（行为验证由各 RED/GREEN 承担，聚合卡只做一次结果汇总）
- **paired_task**：N/A — non-behavior change: aggregate check
- **gate_cmd**：`npx vitest run tests/contract/requirement-convergence-regression.test.mjs tests/stage-interaction-contract.test.mjs tests/contract/spec-analyze-completeness.test.mjs tests/contract/task-bootstrap-integrity.test.mjs tests/contract/governance-startup-event-early-failure.test.mjs`
- **expected_exit**：0
- **oracle**：`ORACLE-FINAL` — 聚合断言通过、无未覆盖 AC
- **evidence_path**：`quality/tests/T007-final.txt`
- **STOP**：命令损坏、AC 缺失、边界越界或需要新决策时停止。
- **recovery**：按失败映射回对应 RED/GREEN 任务。
- **task risk**：聚合掩盖局部失败；保留每个域独立输出。
- **test tier / test method**：fullstack / 聚合运行。
- **scenarios / commands / expected exit / oracle**：同 gate_cmd；聚合通过退出 0；oracle ORACLE-FINAL。
- **fixtures_services**：N/A。
- **coverage limits**：不声称端到端对抗性结论。

##### 执行状态填写区（唯一完成权威）

- [ ] **任务完成**
- **status**：`pending`
- **actual_changes**：N/A — not started
- **executed_commands**：N/A — not started
- **evidence_refs**：N/A — not started
- **covered_ac**：N/A — not started
- **review_fact**：N/A — FINAL aggregate reviewed with Phase reviews
- **completed_at**：N/A — not completed
- **执行事实**：N/A — not started

## Dependency Graph

- **order**：T001 (RED) → T002 (GREEN) → T003 (RED) → T004 (GREEN) → T005 (RED) → T006 (GREEN) → T007 (FINAL)

```text
T001 (RED) → T002 (GREEN) → T003 (RED) → T004 (GREEN) → T005 (RED) → T006 (GREEN) → T007 (FINAL)
```

## Final Boundary Check

- [ ] 每个 Phase 的 Goal、Files、Tasks、Verify、Knowledge、STOP、Done、Risks and rollback 完整。
- [ ] 每个任务只有一张卡和一个完成区；文件是所属 Phase NEW/MODIFY 的子集。
- [ ] 每个行为变化都有同命令、同 oracle 的 RED → GREEN；FINAL 只做一次聚合。
- [ ] 依赖无环，FR/AC 双向追溯闭合，未知事实没有被写成假设或通过。
- [ ] review、test、evidence 只作为事实记录，不是开始、继续或交付许可证。

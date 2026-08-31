# 任务清单：UI 型需求交付契约与端到端验收/证据落位机制

- **Input**：`specs/ui-e2e-delivery-contract-20260830/decision-log.md`、`specs/ui-e2e-delivery-contract-20260830/spec.md`、`specs/ui-e2e-delivery-contract-20260830/plan.md`
- **Template version**：`plan-task.v4`
- **versioned_refs**（任务统一引用）：
  - `{"artifact_kind": "decision", "ref": "specs/ui-e2e-delivery-contract-20260830/decision-log.md", "hash": "13bca63df2d268a3cc6179f21ff19e1a3c0db839bd6e5a65917bb19ad4a13868", "id": "D1-D16"}`
  - `{"artifact_kind": "spec", "ref": "specs/ui-e2e-delivery-contract-20260830/spec.md", "hash": "4bab833a47dee43e8de8ca0b00bf3bbc9c3d5692a986e0d7ad4caed00b6cbe15", "id": "spec-content.v3"}`
  - `{"artifact_kind": "plan", "ref": "specs/ui-e2e-delivery-contract-20260830/plan.md", "hash": "57839efadd19d2942bbdef91901d89a7e1b04c7e1d1094ca85ee080212c1639d", "id": "plan-task.v4"}`

## Phase P1 — 判定与收敛（UID/CONV）

### Goal

make-decision 完成判据包含 ui_applicability（unknown 必问）与四维收敛检查；unknown/缺维不再静默通过。

### Files

- **NEW**：`tests/contract/ui-applicability-must-ask.test.mjs`、`tests/contract/decision-convergence-depth.test.mjs`
- **MODIFY**：`runtime/stage/stage-handlers.mjs`（make-decision handler）、`runtime/stage/completion-predicates.mjs`（STAGE_PREDICATES）、`runtime/stage/stage-content-contracts.mjs`（analyzeDecisionConvergence）、`workflows/make-decision/SKILL.md`（判定必问步骤）
- **DO NOT TOUCH**：`runtime/evidence/`（本期不动）、`core/task-close.mjs`（P5 才动）

### Tasks

#### T001 — RED：UI 判定 unknown 必问契约测试

- **ID**：T001
- **Phase**：Phase P1 — 判定与收敛（UID/CONV）
- **goal**：三输入缺失/冲突时 make-decision 完成判据不满足且列出缺口
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind": "spec", "ref": "specs/ui-e2e-delivery-contract-20260830/spec.md", "hash": "4bab833a47dee43e8de8ca0b00bf3bbc9c3d5692a986e0d7ad4caed00b6cbe15", "id": "SPEC"}, {"artifact_kind": "plan", "ref": "specs/ui-e2e-delivery-contract-20260830/plan.md", "hash": "57839efadd19d2942bbdef91901d89a7e1b04c7e1d1094ca85ee080212c1639d", "id": "PLAN"}]`
- **source_refs / decision_refs**：D1, R-F19-01 → FR-UID-001 / AC-UID-001
- **输入**：make-decision handler 当前行为
- **依赖**：none
- **并行**：否 — first RED
- **FR**：FR-UID-001
- **AC**：AC-UID-001
- **动作**：新增测试：三类输入（UI/非 UI/缺失冲突）断言完成判据结果
- **精确文件**：`tests/contract/ui-applicability-must-ask.test.mjs`
- **boundary**：files: `tests/contract/ui-applicability-must-ask.test.mjs`; symbols: 测试断言
- **输出**：RED 证据（断言失败：unknown 静默通过）
- **Knowledge**：STAGE_PREDICATES make-decision 现有键；handler completion_subjects 组装点
- **verification_role**：RED
- **paired_task**：T002
- **gate_cmd**：`npx vitest run tests/contract/ui-applicability-must-ask.test.mjs`
- **expected_exit**：1
- **oracle**：`ORACLE-UID-001` — RED：unknown 输入下断言"完成判据不满足"失败；GREEN：同一断言通过
- **evidence_path**：`quality/tests/p1-t001-red.txt`
- **STOP**：命令损坏/环境失败→停
- **recovery**：owner=build-code；最小恢复=修复测试命令
- **task risk**：断言写错导致假 RED → 对照现有 handler 输出核对
- **test tier / test method**：simple — 纯函数+handler 级断言
- **scenarios / commands / expected exit / oracle**：见上
- **fixtures_services**：N/A — 内存构造输入
- **coverage limits**：不覆盖真实 LLM 判定，只覆盖契约行为

- **执行状态填写区（唯一完成权威）**
  - **status**：incomplete
  - **actual changed files**：`tests/contract/ui-applicability-must-ask.test.mjs`
  - **commands and exits**：当前精确 gate → 0（2 passed）；原计划的实现前 gate `exit 1` 未获可认证运行输出
  - **evidence refs**：`quality/tests/p1-t001-red.txt` 不存在；无 task storage record、原始 stdout/stderr bytes 或 hash，不能以当前 GREEN 或卡片文字替代 RED
  - **covered ACs**：当前 GREEN 覆盖 AC-UID-001 的修复行为；RED oracle 未认证
  - **review fact**：实现审查事实不能替代本卡 RED 基线
  - **completion time**：N/A — verification_role=RED 的原始输出缺失
  - **执行事实**：当前实现会发布 `ui_applicability`；旧 handler 的 RED 断言没有可重读证据，状态保持 incomplete

#### T002 — GREEN：ui_applicability 完成判据实现

- **ID**：T002
- **Phase**：Phase P1 — 判定与收敛（UID/CONV）
- **goal**：unknown/冲突时完成判据不满足并列出 missing_items；ui/non_ui 正常记录
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind": "spec", "ref": "specs/ui-e2e-delivery-contract-20260830/spec.md", "hash": "4bab833a47dee43e8de8ca0b00bf3bbc9c3d5692a986e0d7ad4caed00b6cbe15", "id": "SPEC"}, {"artifact_kind": "plan", "ref": "specs/ui-e2e-delivery-contract-20260830/plan.md", "hash": "57839efadd19d2942bbdef91901d89a7e1b04c7e1d1094ca85ee080212c1639d", "id": "PLAN"}]`
- **source_refs / decision_refs**：D1 → FR-UID-001 / AC-UID-001
- **输入**：T001 RED
- **依赖**：T001
- **并行**：否
- **FR**：FR-UID-001
- **AC**：AC-UID-001
- **动作**：STAGE_PREDICATES make-decision 加 `ui_applicability` 条件 subject（复用 build-spec ui_design 机制）；handler 组装该事实，unknown→missing_items
- **精确文件**：`runtime/stage/completion-predicates.mjs`、`runtime/stage/stage-handlers.mjs`、`workflows/make-decision/SKILL.md`
- **boundary**：files: 上述两文件; symbols/regions: STAGE_PREDICATES["make-decision"]、deriveStageCompletion 条件段、make-decision handler completion 组装
- **输出**：GREEN 证据
- **Knowledge**：条件 subject 机制（L182-188 ui_design 先例）
- **verification_role**：GREEN
- **paired_task**：T001
- **gate_cmd**：`npx vitest run tests/contract/ui-applicability-must-ask.test.mjs`
- **expected_exit**：0
- **oracle**：`ORACLE-UID-001` — RED：unknown 输入下断言"完成判据不满足"失败；GREEN：同一断言通过
- **evidence_path**：`quality/tests/p1-t002-green.txt`
- **STOP**：影响非 UI 任务既有行为→停并缩小改动
- **recovery**：owner=build-code；回退单 task 改动
- **task risk**：条件 subject 机制误伤既有 ui_design 行为 → 回归测试覆盖
- **test tier / test method**：feature — 跨 handler+predicate
- **scenarios / commands / expected exit / oracle**：见上
- **fixtures_services**：N/A
- **coverage limits**：不覆盖用户问答 UI 交互本身（宿主层）

- **执行状态填写区（唯一完成权威）**
  - **status**：incomplete
  - **actual changed files**：`runtime/stage/{stage-content-contracts,stage-handlers,completion-predicates,stage-runner}.mjs`、`workflows/make-decision/SKILL.md`、`tests/contract/{ui-applicability-must-ask,stage-completion}.test.mjs`
  - **commands and exits**：当前精确 gate → 0（2 passed）
  - **evidence refs**：声明的 `quality/tests/p1-t002-green.json` 不存在；声明的 output hash 无对应 bytes，当前 GREEN 只证明现在的实现
  - **covered ACs**：当前 GREEN 覆盖 AC-UID-001；原 T001 RED 基线仍未认证
  - **review fact**：`wh-review` 无可解析输出（unavailable）；不能用审查或当前 GREEN 补写历史证据
  - **completion time**：N/A — 配对 RED 与原 GREEN bytes 均不可重读
  - **执行事实**：决策日志读取与 missing 问答路径当前可测，但没有可认证的本卡原始交付证据，状态保持 incomplete

#### T003 — RED：四维收敛检查契约测试

- **ID**：T003
- **Phase**：Phase P1 — 判定与收敛（UID/CONV）
- **goal**：四份收敛状态样本（全收敛/缺范围/缺验收/缺方案取舍）断言检查结果
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind": "spec", "ref": "specs/ui-e2e-delivery-contract-20260830/spec.md", "hash": "4bab833a47dee43e8de8ca0b00bf3bbc9c3d5692a986e0d7ad4caed00b6cbe15", "id": "SPEC"}, {"artifact_kind": "plan", "ref": "specs/ui-e2e-delivery-contract-20260830/plan.md", "hash": "57839efadd19d2942bbdef91901d89a7e1b04c7e1d1094ca85ee080212c1639d", "id": "PLAN"}]`
- **source_refs / decision_refs**：D2, R-F19-01 → FR-CONV-001 / AC-CONV-001
- **输入**：analyzeDecisionConvergence 现状
- **依赖**：none
- **并行**：可与 T001 并行 — 独立测试文件
- **FR**：FR-CONV-001
- **AC**：AC-CONV-001
- **动作**：新增测试断言四维语义检查
- **精确文件**：`tests/contract/decision-convergence-depth.test.mjs`
- **boundary**：files: 该测试文件
- **输出**：RED 证据（现状矩阵存在即过）
- **Knowledge**：analyzeDecisionConvergence L2228+ 现有检查项
- **verification_role**：RED
- **paired_task**：T004
- **gate_cmd**：`npx vitest run tests/contract/decision-convergence-depth.test.mjs`
- **expected_exit**：1
- **oracle**：`ORACLE-CONV-001` — RED：缺维样本断言"不满足"失败；GREEN：同一断言通过
- **evidence_path**：`quality/tests/p1-t003-red.txt`
- **STOP**：函数签名假设错误→先读函数再写断言
- **recovery**：owner=build-code
- **task risk**：语义检查粒度争议 → 按 spec AC 四条判据写
- **test tier / test method**：simple
- **scenarios / commands / expected exit / oracle**：见上
- **fixtures_services**：N/A
- **coverage limits**：不做 LLM 语义理解，只做结构化判据（引用/答案存在性）

- **执行状态填写区（唯一完成权威）**
  - **status**：incomplete
  - **actual changed files**：`tests/contract/decision-convergence-depth.test.mjs`
  - **commands and exits**：当前精确 gate → 0（3 passed）；原计划的实现前 gate `exit 1` 未获可认证运行输出
  - **evidence refs**：`quality/tests/p1-t003-red.txt` 不存在；无 task storage record、原始 stdout/stderr bytes 或 hash，不能以当前 GREEN 或卡片文字替代 RED
  - **covered ACs**：当前 GREEN 覆盖 AC-CONV-001 的修复行为；RED oracle 未认证
  - **review fact**：实现审查事实不能替代本卡 RED 基线
  - **completion time**：N/A — verification_role=RED 的原始输出缺失
  - **执行事实**：当前分析器拒绝缺范围、缺可执行验收或缺方案取舍；旧分析器 RED 断言没有可重读证据，状态保持 incomplete

#### T004 — GREEN：四维收敛检查实现

- **ID**：T004
- **Phase**：Phase P1 — 判定与收敛（UID/CONV）
- **goal**：收敛检查扩展为四维语义级（目标/范围/方案/验收各有可验证判据）
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind": "spec", "ref": "specs/ui-e2e-delivery-contract-20260830/spec.md", "hash": "4bab833a47dee43e8de8ca0b00bf3bbc9c3d5692a986e0d7ad4caed00b6cbe15", "id": "SPEC"}, {"artifact_kind": "plan", "ref": "specs/ui-e2e-delivery-contract-20260830/plan.md", "hash": "57839efadd19d2942bbdef91901d89a7e1b04c7e1d1094ca85ee080212c1639d", "id": "PLAN"}]`
- **source_refs / decision_refs**：D2 → FR-CONV-001 / AC-CONV-001
- **输入**：T003 RED
- **依赖**：T003
- **并行**：否
- **FR**：FR-CONV-001
- **AC**：AC-CONV-001
- **动作**：analyzeDecisionConvergence 增加四维检查（每维：答案存在+事实引用+验收维含可执行判据）；缺口写入结果
- **精确文件**：`runtime/stage/stage-content-contracts.mjs`
- **boundary**：symbols/regions: analyzeDecisionConvergence 函数内
- **输出**：GREEN 证据
- **Knowledge**：现有返回结构含 ok/missing 字段
- **verification_role**：GREEN
- **paired_task**：T003
- **gate_cmd**：`npx vitest run tests/contract/decision-convergence-depth.test.mjs`
- **expected_exit**：0
- **oracle**：`ORACLE-CONV-001` — RED：缺维样本断言"不满足"失败；GREEN：同一断言通过
- **evidence_path**：`quality/tests/p1-t004-green.txt`
- **STOP**：破坏既有决策日志（旧任务四材料）兼容→加 legacy 宽容分支并记录
- **recovery**：owner=build-code
- **task risk**：旧格式决策日志误报 → 宽容读取+只对新结构强制
- **test tier / test method**：feature
- **scenarios / commands / expected exit / oracle**：见上
- **fixtures_services**：N/A
- **coverage limits**：不检查答案质量（语义深度留给审查）

- **执行状态填写区（唯一完成权威）**
  - **status**：incomplete
  - **actual changed files**：`runtime/stage/stage-content-contracts.mjs`、`runtime/stage/stage-handlers.mjs`、`tests/contract/decision-convergence-depth.test.mjs`
  - **commands and exits**：当前精确 gate → 0（3 passed）
  - **evidence refs**：声明的 `quality/tests/p1-t004-green.json` 不存在；声明的 output hash 无对应 bytes，当前 GREEN 只证明现在的实现
  - **covered ACs**：当前 GREEN 覆盖 AC-CONV-001；原 T003 RED 基线仍未认证
  - **review fact**：`wh-review` 无可解析输出（unavailable）；不能用审查或当前 GREEN 补写历史证据
  - **completion time**：N/A — 配对 RED 与原 GREEN bytes 均不可重读
  - **执行事实**：四维表、具体引用、可执行验收和 fail-loud 反例当前可测，但没有可认证的本卡原始交付证据，状态保持 incomplete

### Verify

`npx vitest run tests/contract/ui-applicability-must-ask.test.mjs tests/contract/decision-convergence-depth.test.mjs`，expected_exit=0（GREEN 后）；oracle=ORACLE-UID-001/ORACLE-CONV-001；evidence_path=`quality/tests/p1-*.txt`。

### Knowledge

条件 subject 机制（build-spec ui_design 先例 L182-188）可复用于 make-decision ui_applicability；收敛检查沿用 analyzeDecisionConvergence 返回结构；legacy 决策日志宽容读取。

### STOP

影响非 UI 任务既有 make-decision 行为→回 build-spec 复核 FR-UID-001 边界；命令损坏/环境失败→停。

### Done

unknown 必问判据生效（AC-UID-001）；四维收敛检查生效（AC-CONV-001）；既有契约测试全绿。

### Risks and rollback

旧格式决策日志误报（PLAN-RISK-001）→ legacy 宽容分支；回退=还原 T002/T004 两文件改动。

## Phase P2 — 设计链路（DSG）与宪法修订（CST）

### Goal

UI 需求 build-spec 强制设计源盘点+高保真原型+用户确认；技能接线声明更新；宪法 F7 v1.7.0 修订落地。

### Files

- **NEW**：`tests/contract/ui-design-confirmation-gate.test.mjs`、`tests/contract/frontend-prototype-render-skill.test.mjs`、`skills/frontend-prototype-render/SKILL.md`、`skills/frontend-prototype-render/skill-bundle.json`（+最小自测）
- **MODIFY**：`runtime/stage/stage-handlers.mjs`（buildSpecUiFacts 读源）、`runtime/stage/completion-predicates.mjs`（ui_design 触发源）、`skills/reuse-registry.md`、`skills/catalog.yaml`、`tests/contract/ui-skill-contract.test.mjs`（断言改为强制消费语义）、`workflows/build-spec/SKILL.md`（设计确认步骤）、`CONSTITUTION.md`、`constitution-checklist.md`
- **DO NOT TOUCH**：`runtime/task/git-worktree-snapshot.mjs`（P5）、PaperBuilder 仓库（任何文件）

### Tasks

#### T005 — RED：下游读决策日志不静默测试

- **ID**：T005
- **Phase**：Phase P2 — 设计链路（DSG）与宪法修订（CST）
- **goal**：不传 contract_facts 且决策日志 applicability=ui 时，buildSpecUiFacts 按 ui 校验而非静默 non_ui
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind": "spec", "ref": "specs/ui-e2e-delivery-contract-20260830/spec.md", "hash": "4bab833a47dee43e8de8ca0b00bf3bbc9c3d5692a986e0d7ad4caed00b6cbe15", "id": "SPEC"}, {"artifact_kind": "plan", "ref": "specs/ui-e2e-delivery-contract-20260830/plan.md", "hash": "57839efadd19d2942bbdef91901d89a7e1b04c7e1d1094ca85ee080212c1639d", "id": "PLAN"}]`
- **source_refs / decision_refs**：D1 → FR-UID-002 / AC-UID-002
- **输入**：buildSpecUiFacts 现状（L1836-1838 静默点）
- **依赖**：T002（判定事实已可记录）
- **并行**：否
- **FR**：FR-UID-002, FR-EXE-002
- **AC**：AC-UID-002, AC-EXE-002
- **动作**：新增测试断言五种情形：buildSpecUiFacts 的日志=ui 无 facts→按 ui 校验、日志=non_ui→not_applicable、无日志→显式 unknown missing；controlledBrowserQaFacts 的日志=ui 且缺 UI 契约/组件图/浏览器适配器→各自返回非空 missing_items，绝不返回 null
- **精确文件**：`tests/contract/ui-design-confirmation-gate.test.mjs`
- **boundary**：files: 该测试文件
- **输出**：RED 证据（现状静默 non_ui）
- **Knowledge**：buildSpecUiFacts、controlledBrowserQaFacts 返回结构；决策日志事实读取入口
- **verification_role**：RED
- **paired_task**：T006
- **gate_cmd**：`npx vitest run tests/contract/ui-design-confirmation-gate.test.mjs`
- **expected_exit**：1
- **oracle**：`ORACLE-UID2-001` — RED：静默 non_ui 断言失败；GREEN：同一断言通过
- **evidence_path**：`quality/tests/p2-t005-red.txt`
- **STOP**：测试无法构造 handler 输入→先读 handler 签名
- **recovery**：owner=build-code
- **task risk**：读源改动影响既有显式传入路径 → 显式传入仍可用但以日志为准
- **test tier / test method**：feature
- **scenarios / commands / expected exit / oracle**：见上
- **fixtures_services**：N/A
- **coverage limits**：不覆盖真实决策日志解析的全部边界

- **执行状态填写区（唯一完成权威）**
  - **status**：incomplete
  - **actual changed files**：N/A — 原块误写 T012/P4 文件，不能归属 T005
  - **commands and exits**：N/A — 原命令针对 `evidence-publish-roundtrip`，不是 T005 gate
  - **evidence refs**：N/A — 无可认证的 T005 receipt
  - **covered ACs**：N/A — 不以 T012 oracle 覆盖 T005
  - **review fact**：2026-08-30 更正：原 P4 review 事实串位，T005 独立审查待重跑
  - **completion time**：N/A — 原完成时间不属于 T005
  - **执行事实**：更正：此前写入的是 P4/T012 的 `capture-evidence` RED，和 T005 的下游读决策日志目标无关；该块作废，需按本卡 gate 重新执行。

#### T006 — GREEN：下游读源改为决策日志事实

- **ID**：T006
- **Phase**：Phase P2 — 设计链路（DSG）与宪法修订（CST）
- **goal**：buildSpecUiFacts/controlledBrowserQaFacts 从任务决策日志读 applicability；缺失→显式 missing；静默点消除
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind": "spec", "ref": "specs/ui-e2e-delivery-contract-20260830/spec.md", "hash": "4bab833a47dee43e8de8ca0b00bf3bbc9c3d5692a986e0d7ad4caed00b6cbe15", "id": "SPEC"}, {"artifact_kind": "plan", "ref": "specs/ui-e2e-delivery-contract-20260830/plan.md", "hash": "57839efadd19d2942bbdef91901d89a7e1b04c7e1d1094ca85ee080212c1639d", "id": "PLAN"}]`
- **source_refs / decision_refs**：D1, D8 → FR-UID-002, FR-EXE-002 / AC-UID-002, AC-EXE-002
- **输入**：T005 RED
- **依赖**：T005
- **并行**：否
- **FR**：FR-UID-002, FR-EXE-002
- **AC**：AC-UID-002, AC-EXE-002
- **动作**：读源改为决策日志事实；contract_facts 显式传入保留但与日志冲突时报冲突；buildSpecUiFacts 的静默默认 non_ui 与 controlledBrowserQaFacts 的 return null 路径均改为带原因的显式 missing_items
- **精确文件**：`runtime/stage/stage-handlers.mjs`
- **boundary**：symbols/regions: buildSpecUiFacts、controlledBrowserQaFacts 函数内
- **输出**：GREEN 证据
- **Knowledge**：invocation 上下文可取任务材料；既有 18 个 UI 契约测试
- **verification_role**：GREEN
- **paired_task**：T005
- **gate_cmd**：`npx vitest run tests/contract/ui-design-confirmation-gate.test.mjs`
- **expected_exit**：0
- **oracle**：`ORACLE-UID2-001` — RED：静默 non_ui 断言失败；GREEN：同一断言通过
- **evidence_path**：`quality/tests/p2-t006-green.txt`
- **STOP**：18 个既有 UI 契约测试出现语义性破坏→停并逐条对齐
- **recovery**：owner=build-code；回退
- **task risk**：读源改动波及 verify-code design-alignment → 回归覆盖
- **test tier / test method**：feature
- **scenarios / commands / expected exit / oracle**：见上
- **fixtures_services**：N/A
- **coverage limits**：不覆盖宿主 session 绑定

- **执行状态填写区（唯一完成权威）**
  - **status**：incomplete
  - **actual changed files**：`runtime/stage/stage-handlers.mjs`、`runtime/stage/stage-content-contracts.mjs`、`tests/contract/ui-design-confirmation-gate.test.mjs`、`tests/contract/ui-stage-integration.test.mjs`
  - **commands and exits**：`npx vitest run tests/contract/ui-design-confirmation-gate.test.mjs tests/contract/frontend-prototype-render-skill.test.mjs --poolOptions.forks.singleFork --no-fileParallelism` → `0`（18 passed）；`node --test tests/contract/ui-stage-integration.test.mjs` → `0`（15 passed；此 Node test 被 Vitest 配置显式排除）
  - **evidence refs**：本地命令输出；未伪造 canonical receipt
  - **covered ACs**：当前行为覆盖 `AC-UID-002` 的决策日志读源/显式缺口，以及 UI build-spec 缺 `ui_contract` 的 fail-loud 回归；不以此宣称 AC 完成
  - **review fact**：独立复核最新最小修复，无新增当前实现问题
  - **completion time**：N/A — 缺 T005 历史 RED，且 T007 历史 RED、真实原型展示/用户确认尚未取得，不能完成
  - **执行事实**：在既有决策日志读源路径上，UI build-spec 现在要求 `ui_contract`；其 Design.md/Experience.md identity 会重读当前 Workspace 并验 `content_sha256`，缺文件或伪 hash 均保持 explicit incomplete。此前 P4/T013 串位事实仍不归属本卡。

#### T007 — RED：原型确认完成判据测试

- **ID**：T007
- **Phase**：Phase P2 — 设计链路（DSG）与宪法修订（CST）
- **goal**：ui 任务 build-spec 无原型材料/无用户确认事实时完成判据不满足
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind": "spec", "ref": "specs/ui-e2e-delivery-contract-20260830/spec.md", "hash": "4bab833a47dee43e8de8ca0b00bf3bbc9c3d5692a986e0d7ad4caed00b6cbe15", "id": "SPEC"}, {"artifact_kind": "plan", "ref": "specs/ui-e2e-delivery-contract-20260830/plan.md", "hash": "57839efadd19d2942bbdef91901d89a7e1b04c7e1d1094ca85ee080212c1639d", "id": "PLAN"}]`
- **source_refs / decision_refs**：D3, D5 → FR-DSG-002 / AC-DSG-002
- **输入**：ui_design 条件 subject 现状
- **依赖**：T006
- **并行**：否
- **FR**：FR-DSG-001, FR-DSG-002, FR-DSG-003
- **AC**：AC-DSG-001, AC-DSG-002, AC-DSG-003
- **动作**：测试断言：①applicability=ui 事实存在但无原型/确认事实→ui_design 判据不满足且列缺口；②原型技能缺真实组件输入、可渲染命令、任务存储截图/预览输出或降级前用户同意时，技能合同断言 RED
- **精确文件**：`tests/contract/ui-design-confirmation-gate.test.mjs`（追加）、`tests/contract/frontend-prototype-render-skill.test.mjs`（新建 RED 断言）
- **boundary**：files: 上述两测试文件
- **输出**：RED 证据
- **Knowledge**：deriveStageCompletion 条件 subject 机制
- **verification_role**：RED
- **paired_task**：T008
- **gate_cmd**：`npx vitest run tests/contract/ui-design-confirmation-gate.test.mjs tests/contract/frontend-prototype-render-skill.test.mjs`
- **expected_exit**：1
- **oracle**：`ORACLE-DSG-002` — RED：无确认或可执行原型技能合同被误判满足时断言失败；GREEN：同一断言通过，真实原型展示仍由 T019 留存
- **evidence_path**：`quality/tests/p2-t007-red.txt`
- **STOP**：条件 subject 机制不支持触发源扩展→停并设计最小扩展
- **recovery**：owner=build-code
- **task risk**：确认事实 schema 与既有 display_before_reply 不兼容 → 复用现有字段
- **test tier / test method**：feature
- **scenarios / commands / expected exit / oracle**：见上
- **fixtures_services**：N/A
- **coverage limits**：不验证原型视觉质量（人工）

- **执行状态填写区（唯一完成权威）**
  - **status**：incomplete
  - **actual changed files**：N/A — 原块误写 T021/P4 文件，不能归属 T007
  - **commands and exits**：N/A — 原命令针对 `acceptance-execution-tier`，不是 T007 gate
  - **evidence refs**：N/A — 无可认证的 T007 receipt
  - **covered ACs**：N/A — 不以 T021 oracle 覆盖 T007
  - **review fact**：2026-08-30 更正：原 P4 review 事实串位，T007 独立审查待重跑
  - **completion time**：N/A — 原完成时间不属于 T007
  - **执行事实**：更正：此前写入的是 P4/T021 的逐场景执行 RED，和 T007 的原型确认判据目标无关；该块作废，需按本卡 gate 重新执行。

#### T008 — GREEN：原型确认判据+技能接线

- **ID**：T008
- **Phase**：Phase P2 — 设计链路（DSG）与宪法修订（CST）
- **goal**：ui_design 条件 subject 触发源=决策日志 ui 事实；design-source-readiness/frontend-prototype-render 接线声明改为 UI 强制消费
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind": "spec", "ref": "specs/ui-e2e-delivery-contract-20260830/spec.md", "hash": "4bab833a47dee43e8de8ca0b00bf3bbc9c3d5692a986e0d7ad4caed00b6cbe15", "id": "SPEC"}, {"artifact_kind": "plan", "ref": "specs/ui-e2e-delivery-contract-20260830/plan.md", "hash": "57839efadd19d2942bbdef91901d89a7e1b04c7e1d1094ca85ee080212c1639d", "id": "PLAN"}]`
- **source_refs / decision_refs**：D3, D4 → FR-DSG-001, FR-DSG-002, FR-DSG-003 / AC-DSG-001, AC-DSG-002, AC-DSG-003
- **输入**：T007 RED
- **依赖**：T007
- **并行**：否
- **FR**：FR-DSG-001, FR-DSG-002, FR-DSG-003
- **AC**：AC-DSG-001, AC-DSG-002, AC-DSG-003
- **动作**：①completion-predicates 条件 subject 触发源改为决策日志事实；②新建 skills/frontend-prototype-render（真实组件渲染原型页+截图预览+降级提示词包模板产出，登记四问）；③reuse-registry/catalog 接线声明更新；④ui-skill-contract.test.mjs 断言改为"UI 需求强制消费"语义；⑤workflows/build-spec/SKILL.md 设计确认步骤更新（含降级须用户明确同意）
- **精确文件**：`runtime/stage/completion-predicates.mjs`、`skills/frontend-prototype-render/SKILL.md`、`skills/frontend-prototype-render/skill-bundle.json`、`skills/reuse-registry.md`、`skills/catalog.yaml`、`tests/contract/ui-skill-contract.test.mjs`、`tests/contract/frontend-prototype-render-skill.test.mjs`（改为 GREEN）、`workflows/build-spec/SKILL.md`
- **boundary**：files: 上述文件；symbols/regions: ui_design 条件 subject、原型技能的必填输入/真实组件渲染步骤/任务存储证据输出/用户同意降级步骤、技能登记、构建规范、技能合同断言
- **输出**：GREEN 证据+新技能可执行合同自测；真实项目渲染、截图/预览与用户设计确认留给 T019
- **Knowledge**：技能 bundle 结构（SKILL.md+skill-bundle.json）；catalog 条目格式
- **verification_role**：GREEN
- **paired_task**：T007
- **gate_cmd**：`npx vitest run tests/contract/ui-design-confirmation-gate.test.mjs tests/contract/frontend-prototype-render-skill.test.mjs`
- **expected_exit**：0
- **oracle**：`ORACLE-DSG-002` — 技能合同要求真实组件渲染、任务存储截图/预览输出、降级前用户同意；真实 PaperBuilder 人工部分由独立 UI 后续任务验证
- **evidence_path**：`quality/tests/p2-t008-green.txt`
- **STOP**：catalog/reuse-registry 校验失败→按 schema 修正条目
- **recovery**：owner=build-code
- **task risk**：新技能质量不达标 → S4 指标+最小自测
- **test tier / test method**：feature
- **scenarios / commands / expected exit / oracle**：见上
- **fixtures_services**：N/A
- **coverage limits**：本卡只验证技能合同；原型渲染视觉质量、真实截图/预览与用户设计确认必须由 T019 留存人工事实，未取得时不得宣称 AC-DSG-001/002/003 完成
- **acceptance_role**：implementation
- **ui_scope**：non_ui

- **执行状态填写区（唯一完成权威）**
  - **status**：incomplete
  - **actual changed files**：`runtime/stage/stage-content-contracts.mjs`、`runtime/stage/stage-handlers.mjs`、`tests/contract/ui-design-confirmation-gate.test.mjs`、`tests/contract/ui-stage-integration.test.mjs`
  - **commands and exits**：`npx vitest run tests/contract/ui-design-confirmation-gate.test.mjs tests/contract/frontend-prototype-render-skill.test.mjs --poolOptions.forks.singleFork --no-fileParallelism` → `0`（18 passed）；`node --test tests/contract/ui-stage-integration.test.mjs` → `0`（15 passed；此 Node test 被 Vitest 配置显式排除）
  - **evidence refs**：本地命令输出；未伪造 canonical receipt
  - **covered ACs**：当前覆盖 UI contract required、`design_authority` identity 与当前 Workspace Design.md/Experience.md re-read/hash 的合同回归；不以此宣称 `AC-DSG-001/002/003` 完成
  - **review fact**：独立复核最新最小修复，无新增当前实现问题
  - **completion time**：N/A — 缺 T005/T007 历史 RED；真实组件原型、截图/预览展示与用户设计确认仍缺，不能完成
  - **执行事实**：`ui_contract.design_authority` 现须绑定两份设计源的 path/content_sha256/revision/explicit anchor；handler 重读当前 Workspace 验 hash，缺文件或伪 hash 产出 explicit incomplete。T008 仍是 non_ui 的技能合同与接线卡，真实 UI 事实留给 T019/P6；此前 P4/T022 串位事实仍不归属本卡。

#### T009 — 宪法 F7 v1.7.0 修订

- **ID**：T009
- **Phase**：Phase P2 — 设计链路（DSG）与宪法修订（CST）
- **goal**：CONSTITUTION.md F7 条文+版本 1.7.0+修订记录+映射；checklist F7 判据同步；条目数仍 22
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind": "spec", "ref": "specs/ui-e2e-delivery-contract-20260830/spec.md", "hash": "4bab833a47dee43e8de8ca0b00bf3bbc9c3d5692a986e0d7ad4caed00b6cbe15", "id": "SPEC"}, {"artifact_kind": "plan", "ref": "specs/ui-e2e-delivery-contract-20260830/plan.md", "hash": "57839efadd19d2942bbdef91901d89a7e1b04c7e1d1094ca85ee080212c1639d", "id": "PLAN"}]`
- **source_refs / decision_refs**：D5, R-F19-02 → FR-CST-001 / AC-CST-001
- **输入**：plan.md 宪法修订草案（用户已复核文本）
- **依赖**：用户复核条文（build-plan 确认时完成）
- **并行**：可与 T005-T008 并行 — 独立文件
- **FR**：FR-CST-001
- **AC**：AC-CST-001
- **动作**：按草案修改两处文件；修订记录含来源引用
- **精确文件**：`CONSTITUTION.md`、`constitution-checklist.md`
- **boundary**：files: 上述两文件; symbols/regions: F7 条文段、版本行、修订记录段、映射段、checklist F7 条目+治理同步记录
- **输出**：diff+条文对照
- **Knowledge**：修订记录条目格式（1.5.0/1.6.0 先例）
- **verification_role**：N/A — non-behavior change: 宪法/文档文本任务，oracle 为结构断言+人工复核
- **paired_task**：N/A — non-behavior change task，无 RED 配对
- **gate_cmd**：`node -e "const fs=require('fs');const c=fs.readFileSync('CONSTITUTION.md','utf8');const k=fs.readFileSync('constitution-checklist.md','utf8');const ok=/Version:\s*1\.7\.0/.test(c)&&/1\.7\.0（2026-08-30）/.test(c)&&/第四处限定确认/.test(c)&&/F7/.test(k)&&/设计确认/.test(k);process.exit(ok?0:1)"`
- **expected_exit**：0
- **oracle**：`ORACLE-CST-001` — 四处同步断言通过
- **evidence_path**：`quality/tests/p2-t009-constitution.txt`
- **STOP**：条文与草案不一致→停并回报用户
- **recovery**：owner=用户（宪法权威）；agent 仅按确认文本落字
- **task risk**：条文歧义 → 用户复核兜底
- **test tier / test method**：simple — 结构断言+人工复核
- **scenarios / commands / expected exit / oracle**：见上
- **fixtures_services**：N/A
- **coverage limits**：不改动其他条款

- **执行状态填写区（唯一完成权威）**
  - **status**：completed
  - **actual changed files**：`CONSTITUTION.md`、`constitution-checklist.md`
  - **commands and exits**：T009 gate → `0`；CONSTITUTION 条目数 → `22`；constitution-checklist 主清单条目数 → `22`；`git diff --check` → `0`
  - **evidence refs**：本地命令输出；未伪造 canonical receipt
  - **covered ACs**：`AC-CST-001`
  - **review fact**：本轮独立复核完成；已补齐 checklist F7 的 `display_before_reply` 与 `human_approved` 确认事实字段，无新增问题
  - **completion time**：2026-08-30
  - **执行事实**：非行为宪法结构核验已完成：F7 限定确认、v1.7.0、修订记录/来源、旧→新映射、checklist 同步和 22 条目数均已核对。

### Verify

`npx vitest run tests/contract/ui-design-confirmation-gate.test.mjs tests/contract/frontend-prototype-render-skill.test.mjs tests/contract/`，expected_exit=0；oracle=ORACLE-UID2-001/ORACLE-DSG-001/ORACLE-DSG-002/ORACLE-CST-001；evidence_path=`quality/tests/p2-*.txt`；宪法结构断言脚本过。

### Knowledge

buildSpecUiFacts/controlledBrowserQaFacts 静默点已改显式 missing；ui_design 触发源=决策日志事实；原型技能合同要求真实组件渲染、任务存储截图/预览输出与降级前用户同意，真实项目渲染与人工确认留给 T019；技能接线声明与契约测试断言已同步反转；宪法 F7 v1.7.0 四同步完成。

### STOP

既有 18 个 UI 契约测试语义性破坏→回 build-spec 复核；条文与用户复核文本不一致→停并回报用户。

### Done

下游读决策日志不静默（AC-UID-002/AC-EXE-002）；原型确认判据生效（AC-DSG-002）；设计源盘点+降级路径接线及可执行技能合同（AC-DSG-001/003）；真实原型展示、截图/预览和用户确认须在 T019 才能宣称完成；宪法修订落地（AC-CST-001）。

### Risks and rollback

接线断言反转误伤其他技能→逐条对照 catalog；回退=还原本 phase 六文件改动，宪法回退需用户授权。

## Phase P3 — 计划校验（PLN）

### Goal

plan 校验强制：范围内任务 E2E 验收 task（最后 phase）、UI 需求前端 task、所有任务验收 task+逐场景验收数据。

### Files

- **NEW**：`tests/contract/plan-acceptance-task-gate.test.mjs`
- **MODIFY**：`runtime/stage/stage-content-contracts.mjs`（validateExecutablePlanTaskMinimum/validatePlanTaskContractV2/typed projection）、`runtime/stage/stage-handlers.mjs`（P4 只传当前 decision-log/spec）、`runtime/stage/stage-runner.mjs`（P4 只传当前 decision-log/spec）、`skills/spec-tasks/templates/tasks-template.md`（plan-task.v4 验收 task 字段约定）、`workflows/make-decision/SKILL.md`（高风险结构化事实）、`tests/stage-plan-task-contract-v3.test.mjs`（plan-task.v4 结构兼容）
- **DO NOT TOUCH**：`runtime/stage/completion-predicates.mjs`（P1/P2 已动，P3 不再动）

### Tasks

#### T010 — RED：plan 验收 task 强制测试

- **ID**：T010
- **Phase**：Phase P3 — 计划校验（PLN）
- **goal**：缺 E2E task（范围内）/缺验收 task（任意）/缺前端 task（UI）/任一验收场景缺 source、sample、scenario 或 tier、字段为占位、tier 非 browser/service/command 的 plan 样本校验失败；完整样本通过
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind": "spec", "ref": "specs/ui-e2e-delivery-contract-20260830/spec.md", "hash": "4bab833a47dee43e8de8ca0b00bf3bbc9c3d5692a986e0d7ad4caed00b6cbe15", "id": "SPEC"}, {"artifact_kind": "plan", "ref": "specs/ui-e2e-delivery-contract-20260830/plan.md", "hash": "57839efadd19d2942bbdef91901d89a7e1b04c7e1d1094ca85ee080212c1639d", "id": "PLAN"}]`
- **source_refs / decision_refs**：D6, D7 → FR-PLN-001/002/003 / AC-PLN-001/002/003
- **输入**：现有 plan 校验函数
- **依赖**：none
- **并行**：否 — Phase P3 首个 RED
- **FR**：FR-PLN-001, FR-PLN-002, FR-PLN-003
- **AC**：AC-PLN-001, AC-PLN-002, AC-PLN-003
- **动作**：至少十二例样本断言：UI 有/无 E2E、后端有/无验收 task、UI 有/无前端 task；多场景验收 task 分别缺 source/sample/scenario/tier、字段为占位、tier 非 browser/service/command；完整多场景样本通过
- **精确文件**：`tests/contract/plan-acceptance-task-gate.test.mjs`
- **boundary**：files: 该测试文件
- **输出**：RED 证据
- **Knowledge**：task v3 卡字段（gate_cmd/versioned_refs/design_state）；校验函数签名
- **verification_role**：RED
- **paired_task**：T011
- **gate_cmd**：`npx vitest run tests/contract/plan-acceptance-task-gate.test.mjs`
- **expected_exit**：1
- **oracle**：`ORACLE-PLN-001` — RED：缺失样本被误判通过断言失败；GREEN：同一断言通过
- **evidence_path**：`quality/tests/p3-t010-red.txt`
- **STOP**：现有函数无法区分 task 类型→先定 task 卡验收字段约定
- **recovery**：owner=build-code
- **task risk**：旧 plan 样本误伤 → 宽容 legacy 结构
- **test tier / test method**：feature
- **scenarios / commands / expected exit / oracle**：见上
- **fixtures_services**：N/A
- **coverage limits**：不校验 task 内部实现质量

- **执行状态填写区（唯一完成权威）**
  - **status**：incomplete
  - **actual changed files**：`tests/contract/plan-acceptance-task-gate.test.mjs` 含本卡样本；其余实现归属 T011
  - **commands and exits**：当前精确 gate → `0`（17 passed）；未找到本卡实现前的 `exit 1` RED 运行
  - **evidence refs**：本地当前输出；未伪造 `p3-t010-red.txt`
  - **covered ACs**：当前 GREEN 覆盖缺验收 task、UI 前端卡、验收数据字段/tier 拒绝；本卡 RED 基线未认证
  - **review fact**：本次独立核验发现 AC-PLN-002 的设计/UI 引用校验原本缺失，已归 T011 修复；不能替代 T010 RED
  - **completion time**：N/A — verification_role=RED 未完成
  - **执行事实**：不得以当前 17 项 GREEN 倒写实现前的 RED

#### T011 — GREEN：plan 三强制校验实现

- **ID**：T011
- **Phase**：Phase P3 — 计划校验（PLN）
- **goal**：校验函数只以 `acceptance_role=acceptance` 识别验收 task（不以末 phase 推断）；前端 task 以 `ui_scope=ui` 识别；每个验收 task 的每个场景必有 `acceptance_data[]={source,sample,scenario,tier}`，tier 仅 browser/service/command；范围内缺失→missing_items
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind": "spec", "ref": "specs/ui-e2e-delivery-contract-20260830/spec.md", "hash": "4bab833a47dee43e8de8ca0b00bf3bbc9c3d5692a986e0d7ad4caed00b6cbe15", "id": "SPEC"}, {"artifact_kind": "plan", "ref": "specs/ui-e2e-delivery-contract-20260830/plan.md", "hash": "57839efadd19d2942bbdef91901d89a7e1b04c7e1d1094ca85ee080212c1639d", "id": "PLAN"}]`
- **source_refs / decision_refs**：D6, D7 → FR-PLN-001/002/003 / AC-PLN-001/002/003
- **输入**：T010 RED
- **依赖**：T010
- **并行**：否
- **FR**：FR-PLN-001, FR-PLN-002, FR-PLN-003
- **AC**：AC-PLN-001, AC-PLN-002, AC-PLN-003
- **动作**：validateExecutablePlanTaskMinimum 加三检查及验收数据结构校验（数组非空、每场景四字段非空非占位、tier 枚举）；tasks-template 明确唯一字段 `acceptance_role=acceptance` 与 `acceptance_data[]={source,sample,scenario,tier}`。计划阶段只验证声明结构；运行时来源解析/真实使用由 T021/T022 执行并留 unavailable，不以静态猜测替代。旧卡缺该字段保持可读但不作为新强制判据通过
- **精确文件**：`runtime/stage/stage-content-contracts.mjs`、`skills/spec-tasks/templates/tasks-template.md`
- **boundary**：symbols/regions: 两个校验函数内+模板字段段
- **输出**：GREEN 证据
- **Knowledge**：现有检查项清单；模板版本 plan-task.v3
- **verification_role**：GREEN
- **paired_task**：T010
- **gate_cmd**：`npx vitest run tests/contract/plan-acceptance-task-gate.test.mjs`
- **expected_exit**：0
- **oracle**：`ORACLE-PLN-001` — RED：缺失样本被误判通过断言失败；GREEN：同一断言通过
- **evidence_path**：`quality/tests/p3-t011-green.txt`
- **STOP**：模板版本语义变化→评估是否需 plan-task.v4（倾向不升版，字段为可选约定）
- **recovery**：owner=build-code
- **task risk**：过度匹配把普通测试 task 误判为验收 task → 字段显式标记优先
- **test tier / test method**：feature
- **scenarios / commands / expected exit / oracle**：见上
- **fixtures_services**：N/A
- **coverage limits**：分档判据深度判定为定性（人审兜底）

- **执行状态填写区（唯一完成权威）**
  - **status**：incomplete
  - **actual changed files**：`runtime/stage/stage-content-contracts.mjs`、`tests/contract/plan-acceptance-task-gate.test.mjs`
  - **commands and exits**：精确 gate → `0`（17 passed）；测试先行时为 `1`（17 项中 1 项失败），暴露 UI implementation 卡未强制设计/UI 引用
  - **evidence refs**：本地测试输出；未伪造 canonical receipt
  - **covered ACs**：当前覆盖 `AC-PLN-001/002/003` 的声明结构，包括 UI/fullstack implementation 的 `design-authority` 与 `ui-contract` hash-bound evidence 引用
  - **review fact**：独立静态复核无新增问题；两个引用只约束 UI/fullstack implementation，不误伤 non-UI 或最终 acceptance
  - **completion time**：N/A — 配对 T010 RED 缺失，不能宣称卡完成
  - **执行事实**：validator 已 fail-loud；T008/T019 已如实归为当前 WorkflowHub 的 non_ui 技能/验收卡，当前四材料校验 `ok:true`，真正 PaperBuilder UI 任务仍须自行提供 ReferenceBinding

#### T023 — RED：typed e2e_scope 强制范围测试

- **ID**：T023
- **Phase**：Phase P3 — 计划校验（PLN）
- **goal**：高风险用户可见的验收卡必须靠 typed scope + D6/D7 分档政策 + 当前任务风险判定事实触发独立裁决；非法矩阵或遗漏引用不得被自由文本风险掩盖
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind": "spec", "ref": "specs/ui-e2e-delivery-contract-20260830/spec.md", "hash": "4bab833a47dee43e8de8ca0b00bf3bbc9c3d5692a986e0d7ad4caed00b6cbe15", "id": "SPEC"}, {"artifact_kind": "plan", "ref": "specs/ui-e2e-delivery-contract-20260830/plan.md", "hash": "57839efadd19d2942bbdef91901d89a7e1b04c7e1d1094ca85ee080212c1639d", "id": "PLAN"}]`
- **source_refs / decision_refs**：D6, D7 → FR-PLN-001 / AC-PLN-001
- **输入**：T011 当前 plan 校验和唯一 acceptance_data 投影
- **依赖**：T011
- **并行**：否 — 先固定 P3→P4 触发输入
- **FR**：FR-PLN-001, FR-PLN-003
- **AC**：AC-PLN-001, AC-PLN-003
- **动作**：在既有 plan fixture 增加 v4 缺 scope、legacy v3 只读不可 passed、高风险 non_ui（只有 D6/D7、缺/非法/未知 `e2e_decision_refs`、缺/非法/等于 D6/D7 的 `e2e_risk_decision_ref`、D ref 存在但 decision-log 无/重复/非法 `high_risk_fact`、D ref 未被 spec 引用）、普通 non_ui、`ui`、`fullstack` 的合法矩阵及冲突反例；并断言三个 `e2e_*` 字段出现在 implementation/non-final acceptance 卡一律 RED。
- **精确文件**：`tests/contract/plan-acceptance-task-gate.test.mjs`
- **boundary**：files: 该测试文件；只增加 scope 分类及负例
- **输出**：RED 证据
- **Knowledge**：D6/D7 已定义强制范围；PFACT-07 指定由 build-plan 细化，不可读取 task risk prose
- **verification_role**：RED
- **paired_task**：T024
- **gate_cmd**：`npx vitest run tests/contract/plan-acceptance-task-gate.test.mjs`
- **expected_exit**：1
- **oracle**：`ORACLE-PLN-002` — v4 缺/错位置 `e2e_*`、高风险缺 D6/D7 JSON 政策引用、有效的当前 decision-log risk fact，或 scope/tier/ui_scope 矩阵冲突时断言失败；v3 只能 unavailable；GREEN 保留同一负例
- **evidence_path**：`quality/tests/p3-t023-red.txt`
- **STOP**：需由自由文本或 provider 推断高风险→停，改为 typed material field
- **recovery**：owner=build-plan；最小恢复=撤销新增 fixture
- **task risk**：把 D6/D7 政策或无关 D ref 误作当前任务风险事实→必须有 decision-log 的结构化 `high_risk_fact`；scope 字段错位置或与 ui_scope/tier 冲突均 fail-loud
- **test tier / test method**：feature — parser/validator/projection
- **scenarios / commands / expected exit / oracle**：v4 缺/错位置、v3 legacy、高风险 non_ui 缺/错政策/ref/fact、普通 non_ui、ui、fullstack 与各矩阵冲突；见 gate_cmd / 1 / ORACLE-PLN-002
- **fixtures_services**：内存 Markdown task cards
- **coverage limits**：不执行真实服务或浏览器，只验证任务材料分类

- **执行状态填写区（唯一完成权威）**
  - **status**：incomplete
  - **actual changed files**：`tests/contract/plan-acceptance-task-gate.test.mjs`；已有 production branch 归属 T024
  - **commands and exits**：当前精确 gate → `0`（17 passed）；非最终 acceptance 的 `e2e_*` 新反例在实现前已被既有 production branch 拒绝，未产生本卡目标 RED
  - **evidence refs**：本地当前输出；未伪造 canonical ref
  - **covered ACs**：当前 GREEN 覆盖错位置 `e2e_*` 拒绝；本卡预期的 RED 基线未认证
  - **review fact**：独立静态复核确认非最终 acceptance `e2e_scope` 反例位置和断言正确
  - **completion time**：N/A
  - **执行事实**：不得把已存在的拒绝分支或 P4 browser 测试倒写为 T023 RED

#### T024 — GREEN：typed e2e_scope 投影与模板实现

- **ID**：T024
- **Phase**：Phase P3 — 计划校验（PLN）
- **goal**：任务卡以 typed scope + 政策/任务风险两类结构化 decision refs 声明强制 E2E 范围，P3 校验与 P4 投影消费同一字段
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind": "spec", "ref": "specs/ui-e2e-delivery-contract-20260830/spec.md", "hash": "4bab833a47dee43e8de8ca0b00bf3bbc9c3d5692a986e0d7ad4caed00b6cbe15", "id": "SPEC"}, {"artifact_kind": "plan", "ref": "specs/ui-e2e-delivery-contract-20260830/plan.md", "hash": "57839efadd19d2942bbdef91901d89a7e1b04c7e1d1094ca85ee080212c1639d", "id": "PLAN"}]`
- **source_refs / decision_refs**：D6, D7 → FR-PLN-001 / AC-PLN-001
- **输入**：T023 RED
- **依赖**：T023
- **并行**：否
- **FR**：FR-PLN-001, FR-PLN-003
- **AC**：AC-PLN-001, AC-PLN-003
- **动作**：模板升级 `plan-task.v4`，最终 acceptance 卡唯一声明 `e2e_scope=ui|fullstack|high_risk_user_visible|not_required`、JSON `e2e_decision_refs` 和 `e2e_risk_decision_ref`；make-decision 对高风险 decision 段写唯一 `high_risk_fact={classification,basis}`。校验器执行唯一矩阵：ui=ui+browser，fullstack=fullstack+browser+service，high_risk_user_visible=non_ui/ui/fullstack 对应 service/browser/browser+service，not_required=non_ui；高风险只接受 D6/D7 政策引用加一个当前 decision-log 有结构化 fact、被当前 spec 引用且不等于 D6/D7 的任务风险 decision ref。P4 投影只读取当前 decision-log 与 spec；v3 场景只读且 `eligible_for_pass=false`。
- **精确文件**：`runtime/stage/stage-content-contracts.mjs`、`runtime/stage/stage-handlers.mjs`、`runtime/stage/stage-runner.mjs`、`skills/spec-tasks/templates/tasks-template.md`、`workflows/make-decision/SKILL.md`、`tests/stage-plan-task-contract-v3.test.mjs`
- **boundary**：symbols/regions: `validateExecutablePlanTaskMinimum`、`projectAcceptanceExecutionData`、build-code/verify-code current-material readers、decision-log 高风险事实、验收 task 字段模板
- **输出**：GREEN 证据
- **Knowledge**：P3 已有 acceptance_role/ui_scope/acceptance_data 唯一解析；不得新增 second Markdown parser
- **verification_role**：GREEN
- **paired_task**：T023
- **gate_cmd**：`npx vitest run tests/contract/plan-acceptance-task-gate.test.mjs`
- **expected_exit**：0
- **oracle**：`ORACLE-PLN-002` — typed 高风险+D6/D7+任务风险 ref 触发、普通 non_ui 不触发、非法 scope/ref/matrix 均无法通过
- **evidence_path**：`quality/tests/p3-t024-green.txt`
- **STOP**：需要 schema、公共命令或第二状态机→停并收缩
- **recovery**：owner=build-code；回退 T024 writer/reader/template 与同一测试改动
- **task risk**：旧 task card 被默认为 not_required 或 ready→只保持 legacy 可读，永不作为 E2E passed
- **test tier / test method**：feature — validator 到 P4 projection
- **scenarios / commands / expected exit / oracle**：同 T023；见 gate_cmd / 0 / ORACLE-PLN-002
- **fixtures_services**：内存 Markdown task cards
- **coverage limits**：真实来源/执行仍由 P4/P6 留事实

- **执行状态填写区（唯一完成权威）**
  - **status**：incomplete
  - **actual changed files**：`runtime/stage/stage-content-contracts.mjs`、`tests/contract/plan-acceptance-task-gate.test.mjs`；既有投影/template 改动保留
  - **commands and exits**：精确 gate → `0`（17 passed）
  - **evidence refs**：本地当前输出；未伪造 canonical ref
  - **covered ACs**：当前覆盖 typed scope 与非最终 acceptance 字段位置合同；因 T023 RED 未认证，不标记 `AC-PLN-001/003` 完成
  - **review fact**：独立静态复核无新增问题：引用规则不影响 final acceptance，错位置 `e2e_scope` 反例会 fail-loud
  - **completion time**：N/A
  - **执行事实**：P4 projection 仍消费同一 typed field；T008/T019 归为 non_ui 后当前四材料校验 `ok:true`，不以外部 PaperBuilder dogfood 绕过真正 UI 计划的引用要求

### Verify

`npx vitest run tests/contract/plan-acceptance-task-gate.test.mjs`，expected_exit=0；oracle=ORACLE-PLN-001/ORACLE-PLN-002；evidence_path=`quality/tests/p3-*.txt`。

### Knowledge

验收 task 唯一以显式字段 `acceptance_role=acceptance` 标记；UI task 以 `ui_scope=ui` 识别；验收数据唯一字段=`acceptance_data[]={source,sample,scenario,tier}`，每场景 tier 只能 browser/service/command；强制 E2E 范围唯一由 `e2e_scope` typed 字段决定。旧卡没有新字段时保持可读，但新计划校验不得把它推断为合格；真实来源只能在执行时验证。

### STOP

旧 plan 样本大面积误伤→回 build-spec 复核宽容策略；模板版本语义变化需评估→停。

### Done

三强制校验生效（AC-PLN-001/002/003）；模板字段约定落地；既有 plan 测试绿。

### Risks and rollback

普通测试 task 误判为验收 task→字段显式标记优先；回退=还原校验函数与模板改动。

## Phase P4 — 执行与证据（EXE/VER）

### Goal

逐场景真实验收执行事实与证据发布通道落地；静默消除；可验证异源的 verify-code 验收裁决判据。

### Files

- **NEW**：`tests/contract/evidence-publish-roundtrip.test.mjs`、`tests/contract/acceptance-verdict-independence.test.mjs`、`tests/contract/acceptance-execution-tier.test.mjs`、`tests/review/review-record-route.test.mjs`
- **MODIFY**：`runtime/evidence/canonical-receipt-writer.mjs`（通用证据发布与 review material 单写）、`tools/cli/stage-runtime.mjs`（capture-evidence 私有入口）、`runtime/schemas/browser-qa-evidence.v1.json`（验收 browser 四元组）、`runtime/stage/stage-content-contracts.mjs`（唯一验收投影与 typed scope）、`runtime/stage/stage-handlers.mjs`（私有 acceptanceExecutionFacts/e2e 判据）、`runtime/stage/stage-runner.mjs`（build-code 私有 QA capability 与 canonical readers）、`runtime/stage/completion-predicates.mjs`（verify-code e2e_acceptance 条件 subject）、`runtime/review/review-record-route.mjs`、`runtime/review/schemas/attempt.schema.json`、`runtime/review/schemas/result.schema.json`、`skills/wh-review/scripts/simple-review-runner.mjs`、`skills/wh-review/scripts/wh-review-cli.mjs`、`skills/isolated-browser-qa/SKILL.md`、`workflows/build-code/SKILL.md`
- **DO NOT TOUCH**：`CONSTITUTION.md`（P2 已定稿）、`skills/frontend-prototype-render/`（P2 已定稿）

### Tasks

- `T012/T013：证据发布 RED/GREEN`
- `T021/T022：逐场景执行事实 RED/GREEN`
- `T014/T015：独立裁决 predicate RED/GREEN`
- `T025/T026：browser 四元组证据 RED/GREEN`
- `T027/T028：冻结 review material 与异源 actor RED/GREEN`

#### T012 — RED：证据发布 roundtrip 测试

- **ID**：T012
- **Phase**：Phase P4 — 执行与证据（EXE/VER）
- **goal**：发布截图+日志到任务存储 quality/evidence/browser-qa/；断言文件落位+索引记录+重复发布去重
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind": "spec", "ref": "specs/ui-e2e-delivery-contract-20260830/spec.md", "hash": "4bab833a47dee43e8de8ca0b00bf3bbc9c3d5692a986e0d7ad4caed00b6cbe15", "id": "SPEC"}, {"artifact_kind": "plan", "ref": "specs/ui-e2e-delivery-contract-20260830/plan.md", "hash": "57839efadd19d2942bbdef91901d89a7e1b04c7e1d1094ca85ee080212c1639d", "id": "PLAN"}]`
- **source_refs / decision_refs**：D10 → FR-EXE-003 / AC-EXE-003
- **输入**：canonical-receipt-writer 现有机制
- **依赖**：none
- **并行**：否 — Phase P4 首个 RED
- **FR**：FR-EXE-003
- **AC**：AC-EXE-003
- **动作**：测试：构造 worktree 临时文件→发布→断言任务存储存在+重复发布无双份+失败路径如实报错
- **精确文件**：`tests/contract/evidence-publish-roundtrip.test.mjs`
- **boundary**：files: 该测试文件; 测试用临时任务存储目录
- **输出**：RED 证据（发布能力不存在）
- **Knowledge**：publishCanonicalRecord 单写机制；writer 映射表结构
- **verification_role**：RED
- **paired_task**：T013
- **gate_cmd**：`npx vitest run tests/contract/evidence-publish-roundtrip.test.mjs`
- **expected_exit**：1
- **oracle**：`ORACLE-EXE-001` — RED：发布能力缺失断言失败；GREEN：roundtrip 断言通过
- **evidence_path**：`quality/tests/p4-t012-red.txt`
- **STOP**：任务存储写入需 kernel 认证上下文→用测试 kernel fixture
- **recovery**：owner=build-code
- **task risk**：测试污染真实任务存储 → 只用临时目录
- **test tier / test method**：feature
- **scenarios / commands / expected exit / oracle**：见上
- **fixtures_services**：临时任务存储目录，测试后清理
- **coverage limits**：不覆盖网络远端存储

- **执行状态填写区（唯一完成权威）**
  - **status**：completed
  - **actual changed files**：`tests/contract/evidence-publish-roundtrip.test.mjs`
  - **commands and exits**：focused RED `1`（预期）；同文件 GREEN `0`（4/4 passed）
  - **evidence refs**：本地命令输出；正式阶段记录器不可用，未伪造 canonical ref
  - **covered ACs**：RED oracle `ORACLE-EXE-001`
  - **review fact**：P4 独立复核后无此路径遗留假通过
  - **completion time**：2026-08-30
  - **执行事实**：RED 已复现；仅临时任务存储写入

#### T013 — GREEN：证据发布通道实现

- **ID**：T013
- **Phase**：Phase P4 — 执行与证据（EXE/VER）
- **goal**：publishEvidence 能力落地（复用 kernel 单写）；stage-runtime 私有入口 capture-evidence；同内容去重
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind": "spec", "ref": "specs/ui-e2e-delivery-contract-20260830/spec.md", "hash": "4bab833a47dee43e8de8ca0b00bf3bbc9c3d5692a986e0d7ad4caed00b6cbe15", "id": "SPEC"}, {"artifact_kind": "plan", "ref": "specs/ui-e2e-delivery-contract-20260830/plan.md", "hash": "57839efadd19d2942bbdef91901d89a7e1b04c7e1d1094ca85ee080212c1639d", "id": "PLAN"}]`
- **source_refs / decision_refs**：D10 → FR-EXE-003 / AC-EXE-003
- **输入**：T012 RED
- **依赖**：T012
- **并行**：否
- **FR**：FR-EXE-003
- **AC**：AC-EXE-003
- **动作**：canonical-receipt-writer 加通用证据发布函数；stage-runtime 加私有 capture-evidence 入口（非公共命令）
- **精确文件**：`runtime/evidence/canonical-receipt-writer.mjs`、`tools/cli/stage-runtime.mjs`
- **boundary**：symbols/regions: 新增函数+一个私有子命令分支
- **输出**：GREEN 证据
- **Knowledge**：writer 映射表扩展模式；私有命令判定（七类公共命令之外）
- **verification_role**：GREEN
- **paired_task**：T012
- **gate_cmd**：`npx vitest run tests/contract/evidence-publish-roundtrip.test.mjs`
- **expected_exit**：0
- **oracle**：`ORACLE-EXE-001` — RED：发布能力缺失断言失败；GREEN：roundtrip 断言通过
- **evidence_path**：`quality/tests/p4-t013-green.txt`
- **STOP**：需要改 kernel 公共接口→停并评估是否合规（倾向不改 kernel）
- **recovery**：owner=build-code
- **task risk**：双写（worktree+存储都有且都进 git）→ worktree 侧车不提交由 close 拦截保证
- **test tier / test method**：feature
- **scenarios / commands / expected exit / oracle**：见上
- **fixtures_services**：临时任务存储目录
- **coverage limits**：大文件分块上传不覆盖

- **执行状态填写区（唯一完成权威）**
  - **status**：completed
  - **actual changed files**：`runtime/evidence/canonical-receipt-writer.mjs`、`tools/cli/stage-runtime.mjs`
  - **commands and exits**：`npx vitest run tests/contract/evidence-publish-roundtrip.test.mjs --poolOptions.forks.singleFork --no-fileParallelism` → `0`（4/4 passed）
  - **evidence refs**：本地命令输出；正式阶段记录器不可用，未伪造 canonical ref
  - **covered ACs**：`AC-EXE-003` / `ORACLE-EXE-001`
  - **review fact**：P4 独立复核后无此路径遗留假通过
  - **completion time**：2026-08-30
  - **执行事实**：单写发布、路径边界和内容去重已验证

#### T021 — RED：逐场景真实执行事实测试

- **ID**：T021
- **Phase**：Phase P4 — 执行与证据（EXE/VER）
- **goal**：强制范围的 browser/service/command 三档验收场景，未真实执行时不得被发布为 covered；缺私有适配器或无法解析真实来源时必须产生 explicit unavailable
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind": "spec", "ref": "specs/ui-e2e-delivery-contract-20260830/spec.md", "hash": "4bab833a47dee43e8de8ca0b00bf3bbc9c3d5692a986e0d7ad4caed00b6cbe15", "id": "SPEC"}, {"artifact_kind": "plan", "ref": "specs/ui-e2e-delivery-contract-20260830/plan.md", "hash": "57839efadd19d2942bbdef91901d89a7e1b04c7e1d1094ca85ee080212c1639d", "id": "PLAN"}]`
- **source_refs / decision_refs**：D6, D7, D8 → FR-PLN-003, FR-EXE-001 / AC-PLN-003, AC-EXE-001
- **输入**：T013 GREEN；现有 `controlledBrowserQaFacts`、`acceptanceCoverageFacts` 与 captureTests
- **依赖**：T013
- **并行**：可与 T014 并行 — 独立测试文件
- **FR**：FR-PLN-003, FR-EXE-001
- **AC**：AC-PLN-003, AC-EXE-001
- **动作**：建立同一验收 task 的 browser/service/command 三场景 fixture：断言未执行不会 covered；私有 `runAcceptanceScenario` 收到 source/sample/scenario/tier；browser 只能走受控浏览器 QA，service/command 不得伪装 browser；缺适配器或来源不可解析时 status=unavailable 且含原因与证据引用占位
- **精确文件**：`tests/contract/acceptance-execution-tier.test.mjs`
- **boundary**：files: 该测试文件；测试临时任务存储与 worker fixture
- **输出**：RED 证据（当前不读取验收场景且可错误覆盖）
- **Knowledge**：`controlledBrowserQaFacts` 只适用于 browser；`captureTests` 可执行命令但不能替代 service/browser；`acceptanceCoverageFacts` 只消费真实执行 refs
- **verification_role**：RED
- **paired_task**：T022
- **gate_cmd**：`npx vitest run tests/contract/acceptance-execution-tier.test.mjs`
- **expected_exit**：1
- **oracle**：`ORACLE-EXE-002` — RED：未执行/错误档位仍被覆盖的断言失败；GREEN：逐场景事实或 unavailable 断言通过
- **evidence_path**：`quality/tests/p4-t021-red.txt`
- **STOP**：需引入公共命令、Runner 或持久状态机→停；不把 service/command 伪装为 browser
- **recovery**：owner=build-code
- **task risk**：测试 fixture 冒充真实环境→只测试事实链；真实运行由 T019 及真实任务执行
- **test tier / test method**：feature
- **scenarios / commands / expected exit / oracle**：browser/service/command 三场景；见 gate_cmd / 1 / ORACLE-EXE-002
- **fixtures_services**：临时 TaskHandle、私有 worker capability fixture；测试后清理
- **coverage limits**：不以 mock 证明真实环境；真实运行只由 T019 的任务存储物理事实证明

- **执行状态填写区（唯一完成权威）**
  - **status**：completed
  - **actual changed files**：`tests/contract/acceptance-execution-tier.test.mjs`
  - **commands and exits**：focused RED `1`（预期）；P4 汇总 `0`（12/12 passed）
  - **evidence refs**：本地命令输出；正式阶段记录器不可用，未伪造 canonical ref
  - **covered ACs**：RED oracle `ORACLE-EXE-002`
  - **review fact**：独立复核发现并驱动修复 malformed contract/旧事实/browser 绑定三类假通过
  - **completion time**：2026-08-30
  - **执行事实**：三档场景缺执行能力时均为 explicit unavailable

#### T022 — GREEN：三档 acceptanceExecutionFacts 实现

- **ID**：T022
- **Phase**：Phase P4 — 执行与证据（EXE/VER）
- **goal**：build-code 逐场景读取严格 `acceptance_data[]`，以真实执行事实或 explicit unavailable 驱动每 AC coverage，不能由调用方自报 covered
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind": "spec", "ref": "specs/ui-e2e-delivery-contract-20260830/spec.md", "hash": "4bab833a47dee43e8de8ca0b00bf3bbc9c3d5692a986e0d7ad4caed00b6cbe15", "id": "SPEC"}, {"artifact_kind": "plan", "ref": "specs/ui-e2e-delivery-contract-20260830/plan.md", "hash": "57839efadd19d2942bbdef91901d89a7e1b04c7e1d1094ca85ee080212c1639d", "id": "PLAN"}]`
- **source_refs / decision_refs**：D6, D7, D8 → FR-PLN-003, FR-EXE-001 / AC-PLN-003, AC-EXE-001
- **输入**：T021 RED
- **依赖**：T021
- **并行**：否
- **FR**：FR-PLN-003, FR-EXE-001
- **AC**：AC-PLN-003, AC-EXE-001
- **动作**：①stage-content-contracts 导出唯一严格验收数据投影；②stage-handlers 紧邻 `controlledBrowserQaFacts` 新增私有 `acceptanceExecutionFacts`，逐场景写 `executed`/`unavailable`/`failed` 物理事实（task/AC、tier、source、sample、scenario、snapshot、evidence refs）；③stage-runner 仅 build-code 注入私有 `runAcceptanceScenario` capability：browser 复用 controlled QA，service/command 无适配器即 unavailable；④只有执行 refs 完整时才交给 acceptanceCoverageFacts 发布 coverage
- **精确文件**：`runtime/stage/stage-content-contracts.mjs`、`runtime/stage/stage-handlers.mjs`、`runtime/stage/stage-runner.mjs`
- **boundary**：symbols/regions: 验收数据解析投影、`acceptanceExecutionFacts`、build-code 私有 capability 注入、acceptance coverage 组装；不新增 public command、Runner、持久对象或状态机
- **输出**：GREEN 证据；每场景真实执行或 unavailable 物理事实，及每 AC coverage 的可追溯 refs
- **Knowledge**：现有 `controlledBrowserQaFacts`、`captureTests`、`acceptanceCoverageFacts`；复用 P3 单一解析投影避免第二 Markdown parser
- **verification_role**：GREEN
- **paired_task**：T021
- **gate_cmd**：`npx vitest run tests/contract/acceptance-execution-tier.test.mjs`
- **expected_exit**：0
- **oracle**：`ORACLE-EXE-002` — RED：未执行/错误档位仍被覆盖的断言失败；GREEN：逐场景事实或 unavailable 断言通过
- **evidence_path**：`quality/tests/p4-t022-green.txt`
- **STOP**：需要公共命令、独立 Runner、额外持久对象或把 service/command 冒充 browser→停并收缩；真实运行能力缺失→unavailable 不是 GREEN
- **recovery**：owner=build-code
- **task risk**：事实结构与既有 coverage 不兼容→先保持现有 coverage consumer 单写、只追加可追溯 refs
- **test tier / test method**：feature
- **scenarios / commands / expected exit / oracle**：browser/service/command 三场景；见 gate_cmd / 0 / ORACLE-EXE-002
- **fixtures_services**：临时 TaskHandle、私有 worker capability fixture
- **coverage limits**：不自动裁决验收；真实环境/数据仅由 build-code 实际任务事实与 P6/T019 证明

- **执行状态填写区（唯一完成权威）**
  - **status**：completed
  - **actual changed files**：`runtime/stage/stage-content-contracts.mjs`、`runtime/stage/stage-handlers.mjs`、`runtime/stage/stage-runner.mjs`
  - **commands and exits**：`npx vitest run tests/contract/acceptance-execution-tier.test.mjs --poolOptions.forks.singleFork --no-fileParallelism` → `0`（4/4 passed）
  - **evidence refs**：本地命令输出；正式阶段记录器不可用，未伪造 canonical ref
  - **covered ACs**：`AC-EXE-001` / `ORACLE-EXE-002`
  - **review fact**：最终独立复核确认未绑定、旧或损坏事实不能成为 executed
  - **completion time**：2026-08-30
  - **执行事实**：声明损坏仍 execution-bound；三档均只接受真实完整绑定，否则 unavailable

#### T014 — RED：验收裁决独立性测试

- **ID**：T014
- **Phase**：Phase P4 — 执行与证据（EXE/VER）
- **goal**：verify-code 完成判据：有 E2E 事实但无独立审查/无用户确认、审查者与执行者同源、缺冻结材料 ref 或 canonical review ref→均不满足（强制范围内任务）
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind": "spec", "ref": "specs/ui-e2e-delivery-contract-20260830/spec.md", "hash": "4bab833a47dee43e8de8ca0b00bf3bbc9c3d5692a986e0d7ad4caed00b6cbe15", "id": "SPEC"}, {"artifact_kind": "plan", "ref": "specs/ui-e2e-delivery-contract-20260830/plan.md", "hash": "57839efadd19d2942bbdef91901d89a7e1b04c7e1d1094ca85ee080212c1639d", "id": "PLAN"}]`
- **source_refs / decision_refs**：D9 → FR-VER-001 / AC-VER-001
- **输入**：STAGE_PREDICATES verify-code 现状
- **依赖**：T013
- **并行**：否
- **FR**：FR-VER-001
- **AC**：AC-VER-001
- **动作**：测试六例：缺独立审查、缺用户确认、reviewer_identity=executor_identity、缺冻结材料 ref、缺 canonical review ref→判据不满足；身份异源且引用完整的事实才满足
- **精确文件**：`tests/contract/acceptance-verdict-independence.test.mjs`
- **boundary**：files: 该测试文件
- **输出**：RED 证据
- **Knowledge**：verify-code 现有谓词（code_review/human_confirmation）
- **verification_role**：RED
- **paired_task**：T015
- **gate_cmd**：`npx vitest run tests/contract/acceptance-verdict-independence.test.mjs`
- **expected_exit**：1
- **oracle**：`ORACLE-VER-001` — RED：缺裁决层、同源审查或无冻结引用被判满足时断言失败；GREEN：同一断言通过
- **evidence_path**：`quality/tests/p4-t014-red.txt`
- **STOP**：强制范围判定事实不可得→停并检查 ui_applicability 链路
- **recovery**：owner=build-code
- **task risk**：非强制范围任务误加判据 → 条件 subject 机制限定
- **test tier / test method**：feature
- **scenarios / commands / expected exit / oracle**：见上
- **fixtures_services**：N/A
- **coverage limits**：不评判独立审查内容质量；只验证身份异源与冻结引用，wh-review 的语义结论仍由独立 reviewer 负责

- **执行状态填写区（唯一完成权威）**
  - **status**：completed
  - **actual changed files**：`tests/contract/acceptance-verdict-independence.test.mjs`
  - **commands and exits**：focused RED `1`（预期）；P4 汇总 `0`（12/12 passed）
  - **evidence refs**：本地命令输出；正式阶段记录器不可用，未伪造 canonical ref
  - **covered ACs**：RED oracle `ORACLE-VER-001`
  - **review fact**：独立复核发现 latest fact、identity/material 和 legacy execution 认证缺口
  - **completion time**：2026-08-30
  - **执行事实**：缺裁决、同源身份或冻结引用均不能判通过

#### T015 — GREEN：e2e_acceptance 条件 subject 实现

- **ID**：T015
- **Phase**：Phase P4 — 执行与证据（EXE/VER）
- **goal**：verify-code 对强制范围任务（ui/fullstack/high-risk）增加 e2e_acceptance 完成判据（E2E 物理事实+身份异源且冻结可追溯的独立裁决+用户确认）
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind": "spec", "ref": "specs/ui-e2e-delivery-contract-20260830/spec.md", "hash": "4bab833a47dee43e8de8ca0b00bf3bbc9c3d5692a986e0d7ad4caed00b6cbe15", "id": "SPEC"}, {"artifact_kind": "plan", "ref": "specs/ui-e2e-delivery-contract-20260830/plan.md", "hash": "57839efadd19d2942bbdef91901d89a7e1b04c7e1d1094ca85ee080212c1639d", "id": "PLAN"}]`
- **source_refs / decision_refs**：D9 → FR-VER-001 / AC-VER-001
- **输入**：T014 RED
- **依赖**：T014
- **并行**：否
- **FR**：FR-VER-001
- **AC**：AC-VER-001
- **动作**：completion-predicates 加条件 subject（观测到强制范围事实才生效），只接纳 `reviewer_identity != executor_identity`、冻结材料 ref 与 canonical review ref 均存在的 independent_review；缺任何一项均 explicit missing，不把 unavailable 改写为通过
- **精确文件**：`runtime/stage/completion-predicates.mjs`、`runtime/stage/stage-handlers.mjs`
- **boundary**：symbols/regions: deriveStageCompletion 条件段、verify-code completion subject 组装
- **输出**：GREEN 证据
- **Knowledge**：ui_design 条件 subject 先例；wh-review canonical review ref 与执行者/审查者身份来自不同事实源
- **verification_role**：GREEN
- **paired_task**：T014
- **gate_cmd**：`npx vitest run tests/contract/acceptance-verdict-independence.test.mjs`
- **expected_exit**：0
- **oracle**：`ORACLE-VER-001` — RED：缺裁决层、同源审查或无冻结引用被判满足时断言失败；GREEN：同一断言通过
- **evidence_path**：`quality/tests/p4-t015-green.txt`
- **STOP**：影响非强制范围任务既有 verify-code 行为→缩小触发条件
- **recovery**：owner=build-code
- **task risk**：条件触发事实链路过长或执行者可伪造身份 → identity/ref 只消费 canonical 事实源；不能认证则 unavailable
- **test tier / test method**：feature
- **scenarios / commands / expected exit / oracle**：见上
- **fixtures_services**：N/A
- **coverage limits**：不覆盖审查内容质量或 provider 可用性；provider unavailable 只能保持 unavailable/incomplete

- **执行状态填写区（唯一完成权威）**
  - **status**：incomplete
  - **actual changed files**：`runtime/stage/{completion-predicates,stage-handlers,stage-runner}.mjs`、`tests/contract/acceptance-verdict-independence.test.mjs`
  - **commands and exits**：`npx vitest run tests/contract/acceptance-verdict-independence.test.mjs --poolOptions.forks.singleFork --no-fileParallelism` → `0`（4/4 passed）；P4 汇总 `0`（12/12 passed）
  - **evidence refs**：本地命令输出；外部 `wh-review` 120 秒未产出语义结果后取消，保持 unavailable
  - **covered ACs**：条件 subject 的缺口判定已验证；`AC-VER-001` 未满足
  - **review fact**：最终独立复核无剩余 concrete false pass；外部独立审查 unavailable
  - **completion time**：2026-08-30
  - **执行事实**：缺 typed high-risk、可比 actor identity、冻结 material ref 和 browser 完整场景 schema；`e2e_acceptance` 固定 missing

#### T025 — RED：browser 验收四元组绑定测试

- **ID**：T025
- **Phase**：Phase P4 — 执行与证据（EXE/VER）
- **goal**：同名 scenario 的错误页面、fixture 或 tier 不能被标成当前验收场景 executed
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind": "spec", "ref": "specs/ui-e2e-delivery-contract-20260830/spec.md", "hash": "4bab833a47dee43e8de8ca0b00bf3bbc9c3d5692a986e0d7ad4caed00b6cbe15", "id": "SPEC"}, {"artifact_kind": "plan", "ref": "specs/ui-e2e-delivery-contract-20260830/plan.md", "hash": "57839efadd19d2942bbdef91901d89a7e1b04c7e1d1094ca85ee080212c1639d", "id": "PLAN"}]`
- **source_refs / decision_refs**：D7, D8 → FR-PLN-003, FR-EXE-001 / AC-PLN-003, AC-EXE-001
- **输入**：T022 当前私有 controlled QA capability；`browser-qa-evidence.v1`
- **依赖**：T022, T024
- **并行**：可与 T027 并行 — 独立 writer→reader 链
- **FR**：FR-PLN-003, FR-EXE-001
- **AC**：AC-PLN-003, AC-EXE-001
- **动作**：构造受控 QA payload 与已发布 bytes：完整四元组、payload 缺字段、stored bytes 不同、同名 scenario 但 source/sample/tier 不同、无 host adapter；实现前期待完整绑定也不能 executed，形成 RED
- **精确文件**：`tests/contract/acceptance-execution-tier.test.mjs`
- **boundary**：files: 该测试文件；真实 stage-runner worker fixture，不以 handler mock 代替 private capability
- **输出**：RED 证据
- **Knowledge**：schema 全局 additionalProperties=false；普通 browser QA 不能强制新字段
- **verification_role**：RED
- **paired_task**：T026
- **gate_cmd**：`npx vitest run tests/contract/acceptance-execution-tier.test.mjs`
- **expected_exit**：1
- **oracle**：`ORACLE-EXE-003` — 验收 browser 只有 payload 与 canonical bytes 的四元组、task/material/snapshot/invocation 全同才可 executed
- **evidence_path**：`quality/tests/p4-t025-red.txt`
- **STOP**：需新增 public QA command、独立 Runner 或为普通 QA 破坏兼容→停
- **recovery**：owner=build-code；最小恢复=仅删除新增负例
- **task risk**：只校验 payload 不校验 stored bytes→必须双边逐项断言
- **test tier / test method**：feature — official runner 私有 capability + canonical store fixture
- **scenarios / commands / expected exit / oracle**：完整、缺字段、stored mismatch、同名错绑定、无 adapter；见 gate_cmd / 1 / ORACLE-EXE-003
- **fixtures_services**：隔离 TaskHandle、受控 QA callback、任务存储 records
- **coverage limits**：不替代 P6 的真实浏览器与真实数据事实

- **执行状态填写区（唯一完成权威）**
  - **status**：completed
  - **actual changed files**：`tests/contract/acceptance-execution-tier.test.mjs`
  - **commands and exits**：focused RED `1`（预期）；`npx vitest run tests/contract/acceptance-execution-tier.test.mjs --poolOptions.forks.singleFork --no-fileParallelism` → `0`（15/15 passed）
  - **evidence refs**：本地聚焦命令输出；正式阶段记录器不可用，未伪造 canonical ref
  - **covered ACs**：`ORACLE-EXE-003` RED 基线
  - **review fact**：独立复核补出 material/snapshot/invocation 与其余四元组字段的反例，均已补入官方 stage regression
  - **completion time**：2026-08-30
  - **执行事实**：完整 binding 实现前确实不能调用受控 QA；不将该 RED 解释为真实浏览器验收

#### T026 — GREEN：browser 验收绑定与受控 QA 合同

- **ID**：T026
- **Phase**：Phase P4 — 执行与证据（EXE/VER）
- **goal**：验收 browser execution 只接受完整、当前且双边匹配的受控 QA 证据
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind": "spec", "ref": "specs/ui-e2e-delivery-contract-20260830/spec.md", "hash": "4bab833a47dee43e8de8ca0b00bf3bbc9c3d5692a986e0d7ad4caed00b6cbe15", "id": "SPEC"}, {"artifact_kind": "plan", "ref": "specs/ui-e2e-delivery-contract-20260830/plan.md", "hash": "57839efadd19d2942bbdef91901d89a7e1b04c7e1d1094ca85ee080212c1639d", "id": "PLAN"}]`
- **source_refs / decision_refs**：D7, D8 → FR-PLN-003, FR-EXE-001 / AC-PLN-003, AC-EXE-001
- **输入**：T025 RED
- **依赖**：T025
- **并行**：否
- **FR**：FR-PLN-003, FR-EXE-001
- **AC**：AC-PLN-003, AC-EXE-001
- **动作**：browser QA schema 为验收路径增加严格 `acceptance_scenario={source,sample,scenario,tier}`；runner 传完整 binding、验证 callback payload 和 store bytes 的 schema/hash/current binding；更新 controlled QA/build-code 合同。非验收 QA 继续可不含字段；无 adapter 和任一不匹配 explicit unavailable
- **精确文件**：`runtime/schemas/browser-qa-evidence.v1.json`、`runtime/stage/stage-runner.mjs`、`skills/isolated-browser-qa/SKILL.md`、`workflows/build-code/SKILL.md`
- **boundary**：schema 可选对象、`privateAcceptanceScenario` browser branch、QA 输入/输出契约说明
- **输出**：GREEN 证据
- **Knowledge**：T022 已 fail-closed；此卡只恢复可认证的 browser 路径
- **verification_role**：GREEN
- **paired_task**：T025
- **gate_cmd**：`npx vitest run tests/contract/acceptance-execution-tier.test.mjs`
- **expected_exit**：0
- **oracle**：`ORACLE-EXE-003` — 仅完整双边 binding executed，其余 unavailable/failed 保留原因
- **evidence_path**：`quality/tests/p4-t026-green.txt`
- **STOP**：改动公共命令、持久控制面或普通 QA 历史记录→停
- **recovery**：owner=build-code；回退 schema/runner/skill 同一卡改动
- **task risk**：callback 自报 evidence_ref→重读 store bytes 与 hash 后才接纳
- **test tier / test method**：feature — schema + official runner + canonical evidence
- **scenarios / commands / expected exit / oracle**：同 T025；见 gate_cmd / 0 / ORACLE-EXE-003
- **fixtures_services**：隔离 TaskHandle、受控 QA callback、任务存储 records
- **coverage limits**：受控 adapter 不可用仍是 unavailable，不把 fixture 当真实页面

- **执行状态填写区（唯一完成权威）**
  - **status**：completed
  - **actual changed files**：`runtime/schemas/browser-qa-evidence.v1.json`、`runtime/stage/stage-runner.mjs`、`skills/isolated-browser-qa/SKILL.md`、`workflows/build-code/SKILL.md`、`tests/contract/acceptance-execution-tier.test.mjs`
  - **commands and exits**：`npx vitest run tests/contract/acceptance-execution-tier.test.mjs --poolOptions.forks.singleFork --no-fileParallelism` → `0`（15/15 passed）
  - **evidence refs**：本地聚焦命令输出；正式阶段记录器不可用，未伪造 canonical ref
  - **covered ACs**：`AC-EXE-001` 的 browser 合同部分 / `ORACLE-EXE-003`
  - **review fact**：独立复核通过；未发现 writer→consumer、私有能力或公共面越界，只补齐全部 binding 负例
  - **completion time**：2026-08-30
  - **执行事实**：仅完整 payload + canonical bytes 的当前 task/attempt/material/snapshot/invocation/四元组可记录 executed；非 browser tiers 和真实页面验收仍按各自能力如实 unavailable

#### T027 — RED：review 冻结材料与异源 actor 链测试

- **ID**：T027
- **Phase**：Phase P4 — 执行与证据（EXE/VER）
- **goal**：审查未冻结实际 bundle、未绑定当前 build-code execution 或 actor 同源时，verify-code 必须不满足
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind": "spec", "ref": "specs/ui-e2e-delivery-contract-20260830/spec.md", "hash": "4bab833a47dee43e8de8ca0b00bf3bbc9c3d5692a986e0d7ad4caed00b6cbe15", "id": "SPEC"}, {"artifact_kind": "plan", "ref": "specs/ui-e2e-delivery-contract-20260830/plan.md", "hash": "57839efadd19d2942bbdef91901d89a7e1b04c7e1d1094ca85ee080212c1639d", "id": "PLAN"}]`
- **source_refs / decision_refs**：D9 → FR-VER-001 / AC-VER-001
- **输入**：T015 缺口判据、既有 stage outcome producer、review record route/attempt/result
- **依赖**：T015, T024
- **并行**：可与 T025 并行 — 独立审查记录链
- **FR**：FR-VER-001
- **AC**：AC-VER-001
- **动作**：在实际 review route fixture 建立 current build-code outcome → `freezeReviewMaterial(A)` → 由 A 重建 provider input → attempt/result → verify reader；断言无 frozen ref、篡改 hash、旧 snapshot、未绑定 execution、同 `source_id` actor、route 用 frozen A 但 provider 输入 B、外部自报 ref、重复 freeze 产生新 ref 均不能 satisfied；实现前完整链断言 RED
- **精确文件**：`tests/review/review-record-route.test.mjs`、`tests/contract/acceptance-verdict-independence.test.mjs`
- **boundary**：files: 上述测试；用 canonical task store/context，不使用纯 e2eAcceptanceFacts mock 作为链路证明
- **输出**：RED 证据
- **Knowledge**：stage outcome producer 是执行者可信来源；material_id 不是 immutable material ref
- **verification_role**：RED
- **paired_task**：T028
- **gate_cmd**：`npx vitest run tests/review/review-record-route.test.mjs tests/contract/acceptance-verdict-independence.test.mjs`
- **expected_exit**：1
- **oracle**：`ORACLE-VER-002` — 审查的 immutable provider input、canonical actor、reviewed execution 三者缺一、被篡改、A/B 替换、重复发布或同 `source_id` 均不可满足
- **evidence_path**：`quality/tests/p4-t027-red.txt`
- **STOP**：需要改变 TaskKernel 公共接口或新增 review runtime 分支→停
- **recovery**：owner=build-code；最小恢复=删除新增链路 assertions
- **task risk**：把 provider/display name、material_id 或临时 run 当认证 identity/ref→测试必须拒绝
- **test tier / test method**：feature — review writer→canonical reader integration
- **scenarios / commands / expected exit / oracle**：缺/篡改/旧/错执行/同 source_id/A-B 替换/外部 ref/重复 freeze/完整异源；见 gate_cmd / 1 / ORACLE-VER-002
- **fixtures_services**：隔离 TaskHandle、current snapshot/material、stage outcome、review bundle
- **coverage limits**：不评判 provider 审查语义，只认证审查输入和裁决独立性

- **执行状态填写区（唯一完成权威）**
  - **status**：incomplete
  - **actual changed files**：`tests/review/review-record-route.test.mjs`、`tests/contract/acceptance-verdict-independence.test.mjs`；另有 P4 writer/reader 及 wh-review 测试改动，归属 T028
  - **commands and exits**：P4 相关 8 文件回归（含本卡两文件）→ `0`（129 passed）；未保存实现前的本卡 `exit 1` RED 运行
  - **evidence refs**：本地回归输出；未伪造 canonical RED receipt
  - **covered ACs**：当前 GREEN 对 ORACLE-VER-002 的缺/篡改/错 provider/同源拒绝；本卡要求的实现前 RED 基线未获认证
  - **review fact**：独立静态复核确认完整冻结输入、配置身份和当前 execution 三链均会重读并拒绝不匹配；不替代 RED 基线
  - **completion time**：N/A — verification_role=RED 未完成
  - **执行事实**：补入“仅 schema/providers 的伪冻结 bytes”反例；它现被拒绝，但不能倒写为实现前已经运行过的 RED 证据

#### T028 — GREEN：review writer→verify-code 独立裁决合同

- **ID**：T028
- **Phase**：Phase P4 — 执行与证据（EXE/VER）
- **goal**：verify-code 可从当前 canonical records 重建并认证实际 provider input 与异源裁决，不信任执行者或 review payload 自报
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind": "spec", "ref": "specs/ui-e2e-delivery-contract-20260830/spec.md", "hash": "4bab833a47dee43e8de8ca0b00bf3bbc9c3d5692a986e0d7ad4caed00b6cbe15", "id": "SPEC"}, {"artifact_kind": "plan", "ref": "specs/ui-e2e-delivery-contract-20260830/plan.md", "hash": "57839efadd19d2942bbdef91901d89a7e1b04c7e1d1094ca85ee080212c1639d", "id": "PLAN"}]`
- **source_refs / decision_refs**：D9 → FR-VER-001 / AC-VER-001
- **输入**：T027 RED
- **依赖**：T027
- **并行**：否
- **FR**：FR-VER-001
- **AC**：AC-VER-001
- **动作**：review runner 在 dispose 前调用唯一 `freezeReviewMaterial` API，重复相同 bytes 返回同一 immutable ref；仅由该 ref 重建 provider input。record route 是编排 owner，只接受 writer 返回的 `{ref,sha256}`，attempt/result 写 material、provider-input hash、canonical reviewer actor、reviewed build-code outcome；canonical actor 固定 `{source_kind,source_id,run_id}`：executor 从受认证 outcome `producer.kind/host/agent_run_id` 派生，reviewer 从 trusted provider `identity.source_id` 与 runtime/provider 派生；verify private readers rehash/rebind，predicate 只接受 `source_id` 不同的 current records
- **精确文件**：`runtime/evidence/canonical-receipt-writer.mjs`、`runtime/review/review-record-route.mjs`、`runtime/review/schemas/attempt.schema.json`、`runtime/review/schemas/result.schema.json`、`skills/wh-review/scripts/simple-review-runner.mjs`、`skills/wh-review/scripts/wh-review-cli.mjs`、`runtime/stage/stage-runner.mjs`、`runtime/stage/stage-handlers.mjs`、`runtime/stage/completion-predicates.mjs`
- **boundary**：existing review publication and verify readers only; `quality/evidence/review-materials/` 是既有 evidence 命名空间的 immutable bytes，canonical receipt writer 是唯一持久化 API、record route 只编排不二写；不新增公共命令、Runner 或第二 writer
- **输出**：GREEN 证据
- **Knowledge**：canonical review writer 是唯一写入路径；stage outcome producer 不重写
- **verification_role**：GREEN
- **paired_task**：T027
- **gate_cmd**：`npx vitest run tests/review/review-record-route.test.mjs tests/contract/acceptance-verdict-independence.test.mjs`
- **expected_exit**：0
- **oracle**：`ORACLE-VER-002` — only current, rehashed frozen provider input + reviewed execution + distinct canonical `source_id` actors can make e2e_acceptance satisfied
- **evidence_path**：`quality/tests/p4-t028-green.txt`
- **STOP**：需要 public interface、generic persistence bridge 或 provider 自报身份→停
- **recovery**：owner=build-code；回退此卡 writer/reader/schema 同步改动
- **task risk**：多 provider 时任取 display 名不同的身份→限定实际裁决 attempt，以 trusted `source_id` 比较，所有写入字段绑定该 attempt
- **test tier / test method**：feature — persisted review material + canonical readers
- **scenarios / commands / expected exit / oracle**：同 T027，含同 bytes 幂等 ref 与 A/B provider-input 拒绝；见 gate_cmd / 0 / ORACLE-VER-002
- **fixtures_services**：隔离 TaskHandle、current snapshot/material、stage outcome、review bundle
- **coverage limits**：真实 provider unavailable 保持 unavailable；P6 才获取用户确认和真实浏览器证据

- **执行状态填写区（唯一完成权威）**
  - **status**：incomplete
  - **actual changed files**：`runtime/evidence/canonical-receipt-writer.mjs`、`runtime/review/review-record-route.mjs`、`runtime/review/schemas/attempt.schema.json`、`runtime/review/schemas/result.schema.json`、`runtime/stage/stage-runner.mjs`、`tools/cli/stage-runtime.mjs`、`skills/wh-review/scripts/{simple-review-runner,third-review-host-config,wh-review-cli}.mjs` 及其相关测试
  - **commands and exits**：P4 相关 8 文件回归 → `0`（129 passed）；其中 review writer、frozen packet、provider identity、official stage consumer 均覆盖
  - **evidence refs**：本地回归输出；正式 provider/config 不可用时仍只会写 current unavailable，未伪造 provider receipt
  - **covered ACs**：当前实现覆盖 `ORACLE-VER-002` 的 canonical freeze→rehydrate→strict dispatch→writer/reader 重绑；因 T027 RED 未认证，不标记 AC-VER-001 完成
  - **review fact**：独立静态复核无新增可复现漏洞：正常 `stage-runtime run` 接入私有 E2E capability；broker `source_id` 与配置身份一致校验；writer/reader 只接收完整可重建 input
  - **completion time**：N/A — 依赖 T027 的 RED 基线仍缺
  - **执行事实**：相同 provider-input bytes 幂等冻结；provider identity 与配置不符、外部 raw E2E 记录、同源 actor、结构不完整冻结输入均拒绝或 current unavailable；这不是 P6 真实 provider/browser/用户验收

### Verify

`npx vitest run tests/contract/evidence-publish-roundtrip.test.mjs tests/contract/acceptance-execution-tier.test.mjs tests/contract/acceptance-verdict-independence.test.mjs tests/review/review-record-route.test.mjs`，expected_exit=0；oracle=ORACLE-EXE-001/ORACLE-EXE-002/ORACLE-EXE-003/ORACLE-VER-001/ORACLE-VER-002；evidence_path=`quality/tests/p4-*.txt`。

### Knowledge

发布复用 kernel 单写；capture-evidence 私有非公共；验收 browser 同时认证 payload 和任务存储 bytes 的四元组。执行 actor 复用 stage outcome producer；review writer 冻结实际 bundle 并绑定 reviewer actor、reviewed execution、material `{ref,sha256}`；条件 subject 重读认证，缺任何项均 missing。

### STOP

需改 kernel 公共接口→停并回报；缺某档执行适配器→写 explicit unavailable，不得伪装 browser；缺当前、hash 正确的 review material/actor/execution binding→missing；影响非强制范围 verify-code→缩小触发。

### Done

AC-EXE-001/003、AC-VER-001 生效；所有三档场景只会产生完整绑定的真实执行事实或 unavailable；verify-code 能重新认证 material、actor、execution 三项。

### Risks and rollback

测试污染真实任务存储→仅用临时目录；frozen bundle 篡改或旧快照→拒绝认证；回退=还原本 phase writer/reader/schema 同步改动。

## Phase P5 — 收口（CLS/CNV）

### Goal

close 侧车结构拦截+归档完整性不漂白+自检只列不拦；.gitignore 约定模板。

### Files

- **NEW**：`tests/contract/close-sidecar-and-archive.test.mjs`、`docs/templates/project-gitignore.md`
- **MODIFY**：`runtime/task/git-worktree-snapshot.mjs`（侧车清单+fail-loud）、`core/task-close.mjs`（归档完整性+manual-risk-close 收紧）、`tools/cli/stage-runtime.mjs`（status 缺口清单输出）、`workflows/make-decision/SKILL.md`（新任务项目 .gitignore 模板提示）
- **DO NOT TOUCH**：`runtime/evidence/`（P4 已定稿）、PaperBuilder 仓库

### Tasks

#### T016 — RED：侧车拦截+归档完整性测试

- **ID**：T016
- **Phase**：Phase P5 — 收口（CLS/CNV）
- **goal**：任务分支含侧车→close 前置结构检查 fail-loud；任务存储缺 E2E 事实→close 输出缺口清单不漂白；manual-risk-close 缺缺失清单/授权→拒绝；无侧车且授权/质量事实齐全的隔离 fixture 必须走完整五步 close 编排
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind": "spec", "ref": "specs/ui-e2e-delivery-contract-20260830/spec.md", "hash": "4bab833a47dee43e8de8ca0b00bf3bbc9c3d5692a986e0d7ad4caed00b6cbe15", "id": "SPEC"}, {"artifact_kind": "plan", "ref": "specs/ui-e2e-delivery-contract-20260830/plan.md", "hash": "57839efadd19d2942bbdef91901d89a7e1b04c7e1d1094ca85ee080212c1639d", "id": "PLAN"}]`
- **source_refs / decision_refs**：D11 → FR-CLS-001, FR-CLS-002, FR-CLS-003 / AC-CLS-001/002/003
- **输入**：快照/close 现状
- **依赖**：T013（证据通道存在后拦截才有修复指引）
- **并行**：否
- **FR**：FR-CLS-001, FR-CLS-002, FR-CLS-003
- **AC**：AC-CLS-001, AC-CLS-002, AC-CLS-003
- **动作**：四例测试断言：侧车拦截、缺 E2E 事实不漂白、manual-risk-close 缺授权拒绝、隔离临时 repo + 本地 bare remote + 显式 test authorization 下无侧车/事实齐全的 normal close 五步按 `commit→merge→archive→push→cleanup` 编排成功，并精确断言调用序列
- **精确文件**：`tests/contract/close-sidecar-and-archive.test.mjs`
- **boundary**：files: 该测试文件; 临时 git 仓库 fixture
- **输出**：RED 证据（当前正常五步 close 行为未被覆盖）
- **Knowledge**：快照排除前缀机制；close 五步编排；manual-risk-close 现状；test authorization 只能用于隔离 fixture
- **verification_role**：RED
- **paired_task**：T017
- **gate_cmd**：`npx vitest run tests/contract/close-sidecar-and-archive.test.mjs`
- **expected_exit**：1
- **oracle**：`ORACLE-CLS-001` — RED：侧车通过/漂白或正常五步无法编排的断言失败；GREEN：同一断言通过
- **evidence_path**：`quality/tests/p5-t016-red.txt`
- **STOP**：close 编排入口认证复杂→用现有测试 fixture 模式
- **recovery**：owner=build-code
- **task risk**：误拦 specs/<task>/ 设计材料 → 清单只含执行侧车前缀
- **test tier / test method**：feature
- **scenarios / commands / expected exit / oracle**：见上
- **fixtures_services**：临时 git 仓库+本地 bare remote+临时任务存储+显式 test authorization，测试后清理
- **coverage limits**：不覆盖真实用户仓库、真实远端或真实不可逆授权

- **执行状态填写区（唯一完成权威）**
  - **status**：incomplete
  - **actual changed files**：`tests/contract/close-sidecar-and-archive.test.mjs`
  - **commands and exits**：实现前同命令 exit `1`（未保存 canonical RED receipt）；本轮 `npx vitest run tests/contract/close-sidecar-and-archive.test.mjs --poolOptions.forks.singleFork --no-fileParallelism` → `0`（13 passed）
  - **evidence refs**：本地 vitest 输出；当前任务存储未倒写 RED receipt
  - **covered ACs**：隔离 fixture 覆盖 AC-CLS-001 的合法根 `tasks/` 正例和当前任务侧车反例、AC-CLS-002 的物理记录隔离与风险 close 授权/缺口反例、AC-CLS-003 的只读缺口；不等同 P6 真实验收
  - **review fact**：上一轮独立终审发现根 `tasks/` 误拦、质量字段泄漏和 risk-close retired 三处矛盾；本轮均有对应正/负例；最终独立复核未发现当前可复现问题
  - **completion time**：N/A — verification_role=RED 的 canonical receipt 缺失
  - **执行事实**：历史 RED 无可认证 receipt，保持 incomplete；隔离 fixture 只使用临时 repo、本地 bare remote 和显式 test authorization

#### T017 — GREEN：close 拦截+归档完整性+自检实现

- **ID**：T017
- **Phase**：Phase P5 — 收口（CLS/CNV）
- **goal**：侧车前缀清单落地+fail-loud；归档完整性缺口清单；manual-risk-close 需缺失清单+授权引用；status 输出自检缺口不阻塞；隔离 fixture 的 normal close 五步编排恢复
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind": "spec", "ref": "specs/ui-e2e-delivery-contract-20260830/spec.md", "hash": "4bab833a47dee43e8de8ca0b00bf3bbc9c3d5692a986e0d7ad4caed00b6cbe15", "id": "SPEC"}, {"artifact_kind": "plan", "ref": "specs/ui-e2e-delivery-contract-20260830/plan.md", "hash": "57839efadd19d2942bbdef91901d89a7e1b04c7e1d1094ca85ee080212c1639d", "id": "PLAN"}]`
- **source_refs / decision_refs**：D11 → FR-CLS-001/002/003 / AC-CLS-001/002/003
- **输入**：T016 RED
- **依赖**：T016
- **并行**：否
- **FR**：FR-CLS-001, FR-CLS-002, FR-CLS-003
- **AC**：AC-CLS-001, AC-CLS-002, AC-CLS-003
- **动作**：三文件修改（见 Files），恢复无侧车且质量事实/显式 test authorization 齐全时按 `commit→merge→archive→push→cleanup` 的五步 close 编排；任何真实任务仍必须走 F7 用户授权，测试授权不得泄漏到生产路径
- **精确文件**：`runtime/task/git-worktree-snapshot.mjs`、`core/task-close.mjs`、`tools/cli/stage-runtime.mjs`
- **boundary**：symbols/regions: 快照排除/检查段、close 编排的归档校验段、status 输出段
- **输出**：GREEN 证据
- **Knowledge**：close 三义（物理交付≠质量结论）；F7 独立授权不变
- **verification_role**：GREEN
- **paired_task**：T016
- **gate_cmd**：`npx vitest run tests/contract/close-sidecar-and-archive.test.mjs`
- **expected_exit**：0
- **oracle**：`ORACLE-CLS-001` — RED：侧车通过/漂白或正常五步无法编排的断言失败；GREEN：同一断言通过
- **evidence_path**：`quality/tests/p5-t017-green.txt`
- **STOP**：正常任务 close 五步被破坏→停并回退到最小改动
- **recovery**：owner=build-code
- **task risk**：自检输出格式破坏既有 status 消费者 → 追加字段不改结构
- **test tier / test method**：feature
- **scenarios / commands / expected exit / oracle**：见上
- **fixtures_services**：临时 git 仓库+任务存储
- **coverage limits**：不覆盖 remote 真实推送

- **执行状态填写区（唯一完成权威）**
  - **status**：incomplete
  - **actual changed files**：`runtime/task/git-worktree-snapshot.mjs`、`core/task-close.mjs`、`tools/cli/task-close.mjs`、`tests/contract/close-sidecar-and-archive.test.mjs`、`tests/close/close-contract.test.mjs`
  - **commands and exits**：P5 focused → `0`（13 passed）；`tests/close/close-contract.test.mjs tests/close/cleanup-resume-finalize.test.mjs tests/close/freshness-consistency.test.mjs tests/contract/workspace-cleanup.test.mjs` → `0`（15 passed）；`node --check`（三生产文件）→ `0`；`git diff --check` → `0`；`tests/integration/vnext-delivery-close.test.mjs` → 执行者中断（Ctrl-C，exit `1`），未得到断言结果，不作为通过或失败证据
  - **evidence refs**：本地测试输出；无伪造 task-storage receipt
  - **covered ACs**：当前覆盖 AC-CLS-001 的 tracked/ignored/nested-Git/执行时序/current-task `tasks/<task-id>/` 拦截与合法根 `tasks/` 放行，AC-CLS-002 的 incomplete 缺口与物理记录分离、risk plan 的具体缺口/plan-bound 用户确认/五授权，AC-CLS-003 的只读缺口字段；不声称 P6 完成
  - **review fact**：独立只读复核发现并验证修复根 `tasks/` 误拦、`verify_facts_fresh` 泄漏和 risk-close retired；review_status ordinary close 仍透传并拒绝 findings；最终独立复核未发现当前可复现问题
  - **completion time**：N/A — paired T016 仍 incomplete
  - **执行事实**：`completed.json.physical_state` 只保留物理字段/元数据，close plan/status 仍投影质量缺口；普通/mini close 均以真实 `review_status` 调用 predicate；risk plan 仅经 `recordManualDeliveryClose` 和既有 private `manual-close` 写 `manual-risk-close.json`，不写 normal completion

#### T018 — .gitignore 约定模板

- **ID**：T018
- **Phase**：Phase P5 — 收口（CLS/CNV）
- **goal**：docs/templates/project-gitignore.md 模板存在（排除执行侧车目录）；workflows/make-decision/SKILL.md 的新任务创建提示引用模板；存量仓库零改动
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind": "spec", "ref": "specs/ui-e2e-delivery-contract-20260830/spec.md", "hash": "4bab833a47dee43e8de8ca0b00bf3bbc9c3d5692a986e0d7ad4caed00b6cbe15", "id": "SPEC"}, {"artifact_kind": "plan", "ref": "specs/ui-e2e-delivery-contract-20260830/plan.md", "hash": "57839efadd19d2942bbdef91901d89a7e1b04c7e1d1094ca85ee080212c1639d", "id": "PLAN"}]`
- **source_refs / decision_refs**：D12 → FR-CNV-001 / AC-CNV-001
- **输入**：D12 决策
- **依赖**：none
- **并行**：可与 T016 并行 — 独立文档
- **FR**：FR-CNV-001
- **AC**：AC-CNV-001
- **动作**：写模板文档（片段+使用说明+登记四问）；在 `workflows/make-decision/SKILL.md` 的新任务项目准备步骤加入模板引用，提示仅适用于新项目/新任务
- **精确文件**：`docs/templates/project-gitignore.md`、`workflows/make-decision/SKILL.md`
- **boundary**：files: 上述两个文件；symbols/regions: 模板全文、make-decision 新任务项目准备步骤
- **输出**：文档+提示
- **Knowledge**：现有 docs/ 结构
- **verification_role**：N/A — non-behavior change: 宪法/文档文本任务，oracle 为结构断言+人工复核
- **paired_task**：N/A — non-behavior change task，无 RED 配对
- **gate_cmd**：`bash -c 'test -f docs/templates/project-gitignore.md && grep -q "quality/" docs/templates/project-gitignore.md && grep -q "qa-artifacts" docs/templates/project-gitignore.md && grep -q "evidence" docs/templates/project-gitignore.md && grep -q "tasks" docs/templates/project-gitignore.md && grep -q "docs/templates/project-gitignore.md" workflows/make-decision/SKILL.md'`
- **expected_exit**：0
- **oracle**：`ORACLE-CNV-001` — 模板存在且含侧车目录排除
- **evidence_path**：`quality/tests/p5-t018-gitignore.txt`
- **STOP**：无 docs/templates/ 目录→创建并在 move-map 登记
- **recovery**：owner=build-code
- **task risk**：模板被误用于存量仓库 → 文档明确"仅新任务/新项目"
- **test tier / test method**：simple
- **scenarios / commands / expected exit / oracle**：见上
- **fixtures_services**：N/A
- **coverage limits**：不覆盖各项目自定义 .gitignore 合并

- **执行状态填写区（唯一完成权威）**
  - **status**：completed
  - **actual changed files**：`docs/templates/project-gitignore.md`、`workflows/make-decision/SKILL.md`、`docs/architecture/move-map.json`
  - **commands and exits**：本轮 T018 structural gate（含 `tasks/<task-id>/` 且存量 `.gitignore` 零改动）→ `0`
  - **evidence refs**：本地结构断言输出；本卡为文档任务，无 task-storage receipt
  - **covered ACs**：AC-CNV-001 的模板、new-project 提示与存量 `.gitignore` 零改动；`tasks/` 只给替换后的当前任务侧车子目录，不覆盖合法根目录
  - **review fact**：模板对齐 close 的完整执行侧车前缀（含 `quality/`），明确不适用于存量仓库、`specs/<task>/` 或合法根 `tasks/` 产品目录
  - **completion time**：2026-08-30T16:20:25Z
  - **执行事实**：模板只供新项目/新任务选用；`git diff --name-only | rg '(^|/)\\.gitignore$'` 无匹配（exit `1`）

### Verify

`npx vitest run tests/contract/close-sidecar-and-archive.test.mjs tests/contract/ tests/unit/task/`，expected_exit=0；oracle=ORACLE-CLS-001/ORACLE-CNV-001；evidence_path=`quality/tests/p5-*.txt`。

### Knowledge

侧车前缀清单只含执行侧车（快照排除的 `evidence/`、`quality/`、`.multica/`，以及 `qa-artifacts/`、当前任务的 `tasks/<task-id>/` 骨架），合法根 `tasks/` 与 `specs/` 材料不拦截；自检输出追加字段不改 status 既有结构；正常 close 五步只能在隔离临时 repo、显式 test authorization 和本地 bare remote 下验证，不触碰真实任务或远端。

### STOP

正常任务 close 五步被破坏→回退到最小改动；模板被误用于存量仓库→文档明示。

### Done

侧车拦截生效（AC-CLS-001）；归档完整性不漂白（AC-CLS-002）；自检只列不拦（AC-CLS-003）；隔离 fixture 的正常五步编排成功；.gitignore 模板落地（AC-CNV-001）。

### Risks and rollback

误拦设计材料→清单仅执行侧车前缀；回退=还原三生产文件+文档改动。

## Phase P6 — 本地契约 dogfooding（S2-S4，最终验收 task）

### Goal

AC-DOG-001 本地三场景真实执行：证据落位与拦截（S2）、非 UI 验收底线（S3）、聚焦回归（S4）；S1 外部 UI dogfood 延后。

### Files

- **NEW**：`tests/e2e/ui-e2e-contract-dogfood.test.mjs`（T020 的历史 RED 基线保留；T019 只运行本地 S2-S4）
- **MODIFY**：N/A — 验收阶段只执行不修改生产代码
- **DO NOT TOUCH**：PaperBuilder 既有文件、分支、任务存储和主 worktree；本阶段不调用 task-bootstrap，不启动浏览器。

### Tasks

#### T020 — RED：dogfooding 验收断言脚本（历史基线）

- **ID**：T020
- **Phase**：Phase P6 — 本地契约 dogfooding（S2-S4，最终验收 task）
- **goal**：保留已完成的四场景 RED 历史基线；当前 GREEN 只覆盖本地 S2-S4，外部 S1 不再是本任务执行项
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind": "spec", "ref": "specs/ui-e2e-delivery-contract-20260830/spec.md", "hash": "4bab833a47dee43e8de8ca0b00bf3bbc9c3d5692a986e0d7ad4caed00b6cbe15", "id": "SPEC"}, {"artifact_kind": "plan", "ref": "specs/ui-e2e-delivery-contract-20260830/plan.md", "hash": "57839efadd19d2942bbdef91901d89a7e1b04c7e1d1094ca85ee080212c1639d", "id": "PLAN"}]`
- **source_refs / decision_refs**：D13 + D16 → AC-DOG-001（当前 S2-S4；S1 历史 RED）
- **输入**：spec.md 本地三场景验收设计；既有四场景 RED 仅作历史证据
- **依赖**：none（脚本先行于实现）
- **并行**：否 — 最终验收的 RED 先行
- **FR**：FR-UID-001, FR-CONV-001, FR-DSG-002, FR-PLN-001, FR-PLN-003, FR-EXE-001, FR-EXE-003, FR-VER-001, FR-CLS-001, FR-CLS-002, FR-CST-001
- **AC**：AC-DOG-001, AC-EXE-001, AC-DSG-001, AC-DSG-002, AC-DSG-003, AC-VER-001
- **动作**：历史脚本保留 S1-S4 断言；当前执行只启用 S2 隔离 normal close、S3 非 UI 底线和 S4 聚焦回归，S1 另行由 UI 后续任务执行
- **精确文件**：`tests/e2e/ui-e2e-contract-dogfood.test.mjs`
- **boundary**：files: `tests/e2e/ui-e2e-contract-dogfood.test.mjs`; symbols: 验收断言
- **输出**：RED 证据（断言失败：契约未实现）
- **Knowledge**：stage-runtime/task-bootstrap 命令面；真实任务存储路径
- **verification_role**：RED
- **paired_task**：T019
- **gate_cmd**：`npx vitest run tests/e2e/ui-e2e-contract-dogfood.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：1
- **oracle**：`ORACLE-DOG-001` — 四场景断言失败（实现未完成）
- **evidence_path**：`quality/tests/p6-t020-red.txt`
- **STOP**：脚本依赖的命令面不存在→先读 CLI 帮助再写
- **recovery**：owner=build-code
- **task risk**：RED 断言过宽导致 GREEN 无法达成→按 AC-DOG-001 精确映射
- **test tier / test method**：fullstack（流程级）
- **scenarios / commands / expected exit / oracle**：S1-S4 见 AC-DOG-001
- **fixtures_services**：WorkflowHub 本地隔离 fixture、当前任务存储追踪、既有 contract 测试
- **coverage limits**：外部 S1 浏览器/用户确认/身份链不在当前任务覆盖，明确 deferred

- **执行状态填写区（唯一完成权威）**
  - **status**：completed
  - **actual changed files**：`tests/e2e/ui-e2e-contract-dogfood.test.mjs`（及本执行区事实写回）
  - **commands and exits**：`npx vitest run tests/e2e/ui-e2e-contract-dogfood.test.mjs` / `1`（预期 RED；由 canonical capture-tests 执行）
  - **evidence refs**：`quality/tests/p6-t020-red-r3.json`（sha256=`2eaf30e41b77e2bd3f492c6934ea3bd7e35da446a78399f9080635c51068cd0f`）、`quality/tests/output/p6-t020-red-r3.txt`（sha256=`a2d2caaa78236945a528fb67b174252c792a3c4c2b42decd479bffddc259fd3d`）；早期 RED receipts 仍保留为历史事实
  - **covered ACs**：RED 基线：AC-DOG-001、AC-EXE-001、AC-DSG-001/002/003、AC-VER-001；未声称通过
  - **review fact**：独立测试审查两轮完成：首轮四项有效问题已修复，复审无新增具体阻塞；声明 wh-review 已实际调用但无 stdout，保留为 unavailable，未改写为通过
  - **completion time**：2026-08-30T08:01:02.141Z
  - **执行事实**：S1 因真实 PaperBuilder 任务存储尚未提供而失败；S2 因 close 未拒绝已提交的 `quality/tests` sidecar 而失败；S3 因计划校验未强制 non_ui 验收卡的 `acceptance_role`/`acceptance_data` 而失败；S4 因 P1-P5 新增契约套件尚不存在而失败。无截图、用户确认、独立审查或全量回归被伪造。

#### T019 — E2E 验收：本地三场景 dogfooding（S2-S4；S1 延后）

- **ID**：T019
- **Phase**：Phase P6 — 本地契约 dogfooding（S2-S4，最终验收 task）
- **goal**：在 WorkflowHub 本地真实执行 S2-S4 并留痕；外部 S1 的 PaperBuilder 原型、浏览器、用户确认和身份链拆为独立后续 UI 任务
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind": "spec", "ref": "specs/ui-e2e-delivery-contract-20260830/spec.md", "hash": "4bab833a47dee43e8de8ca0b00bf3bbc9c3d5692a986e0d7ad4caed00b6cbe15", "id": "SPEC"}, {"artifact_kind": "plan", "ref": "specs/ui-e2e-delivery-contract-20260830/plan.md", "hash": "57839efadd19d2942bbdef91901d89a7e1b04c7e1d1094ca85ee080212c1639d", "id": "PLAN"}]`
- **source_refs / decision_refs**：D13 + D16 → AC-DOG-001（S2-S4；S1 deferred）
- **输入**：P1-P5 全部 GREEN；T020 RED 历史证据；T016 隔离 close fixture；S1 外部事实不作为输入
- **依赖**：T020, T002, T004, T006, T008, T009, T011, T013, T015, T017, T018, T022, T024, T026, T028
- **并行**：否 — 最终验收
- **FR**：FR-UID-001, FR-CONV-001, FR-DSG-002, FR-PLN-001, FR-PLN-003, FR-EXE-001, FR-EXE-003, FR-VER-001, FR-CLS-001, FR-CLS-002, FR-CST-001
- **AC**：AC-DOG-001, AC-EXE-001, AC-DSG-001, AC-DSG-002, AC-DSG-003, AC-VER-001
- **acceptance_role**：acceptance
- **ui_scope**：non_ui
- **e2e_scope**：not_required
- **acceptance_data**：`[{"source":"T016 隔离临时 repo、本地 bare remote 与任务存储 fixture","sample":"close-sidecar-and-archive 正常五步事实","scenario":"S2 证据落位、侧车拦截、normal close","tier":"command"},{"source":"plan-acceptance-task-gate 非 UI 完整/缺验收 fixture","sample":"缺 acceptance_role/acceptance_data 的最小 task 卡","scenario":"S3 非 UI 验收底线","tier":"command"},{"source":"WorkflowHub 当前 worktree 测试集","sample":"本任务新增和既有 contract/unit 测试输出","scenario":"S4 聚焦回归","tier":"command"}]`
- **动作**：只在 WorkflowHub 当前认证 worktree 执行本地 S2：T016 隔离 fixture 验证证据落位、侧车拦截和 `commit→merge→archive→push→cleanup` normal close；S3 构造非 UI plan 缺验收 task 断言校验失败；S4 运行聚焦 contract 回归。不得创建 PaperBuilder 任务、启动浏览器或要求外部 provider/身份绑定；S1 由独立 UI 后续任务执行。
- **精确文件**：`tests/e2e/ui-e2e-contract-dogfood.test.mjs`
- **boundary**：files: 该测试文件；external fixture: 无；只使用本地隔离 fixture 和当前任务存储，不触碰 PaperBuilder
- **输出**：S2-S4 三场景机械命令与任务存储证据；S1 明确记录 deferred，不写当前通过
- **Knowledge**：task-bootstrap 命令；stage-runtime 命令；真实任务存储路径
- **verification_role**：GREEN
- **paired_task**：T020
- **gate_cmd**：`npx vitest run tests/e2e/ui-e2e-contract-dogfood.test.mjs`
- **expected_exit**：0
- **oracle**：`ORACLE-DOG-001` — S2-S4 本地机械断言全过；S1 外部 UI 事实保持 deferred
- **evidence_path**：`quality/evidence/dogfood/`
- **STOP**：S2/S3/S4 无法真实执行→如实记录 unavailable/incomplete；禁止伪造命令或任务存储事实。S1 外部事实缺失保持 deferred，不阻塞本任务
- **recovery**：owner=build-code；执行者只采事实不作裁决（D9 的独立裁决规则由后续 UI 任务使用）
- **task risk**：本地 fixture 污染任务存储 → 使用临时目录并在测试后清理
- **test tier / test method**：command；本地隔离 fixture + contract 回归
- **scenarios / commands / expected exit / oracle**：S2-S4 见 AC-DOG-001；expected_exit=0
- **fixtures_services**：WorkflowHub 本地隔离 repo、bare remote、任务存储 fixture 和当前 contract 测试
- **coverage limits**：不覆盖外部 S1 浏览器、用户确认、身份链和 PaperBuilder 真实项目；这些由后续 UI 任务覆盖

- **执行状态填写区（唯一完成权威）**
  - **status**：incomplete
  - **actual changed files**：`tests/e2e/ui-e2e-contract-dogfood.test.mjs`；当前四份材料的 D16 范围修正
  - **commands and exits**：`npx vitest run tests/stage-review-cost-policy.test.mjs tests/contract/plan-acceptance-task-gate.test.mjs --poolOptions.forks.singleFork --no-fileParallelism` / `0`（28/28）；`npx vitest run tests/e2e/ui-e2e-contract-dogfood.test.mjs --poolOptions.forks.singleFork --no-fileParallelism` / `0`（S2、S3、S4 通过，S1 skip/deferred）；材料 validator + acceptance projection / `0`（`ok=true`, `status=ready`, `requires_independent_verdict=false`）；`git diff --check` / `0`
  - **evidence refs**：本次未发布新的任务存储 evidence；命令输出为当前会话事实
  - **covered ACs**：AC-DOG-001 的 S2/S3/S4 通过；S1 按 D16 deferred；AC-CLS-001/002/003、AC-PLN-001 的本地断言由上述测试覆盖
  - **review fact**：本次未新增独立 review；既有 `dsh-code-review`/`wh-review` unavailable 事实保持不变，不能宣称质量绿
  - **completion time**：2026-09-01T00:04:00+08:00
  - **执行事实**：D16 已把外部 PaperBuilder S1 从当前任务完成依赖移出；本地 S2 close 侧车拦截与 normal close、S3 non_ui 验收底线、S4 聚焦回归均真实通过。外部 S1 未执行且明确 deferred；不启动 DSH、不创建 PaperBuilder 任务、不合并 main。当前任务可继续/可修复，但正式 verify 质量仍为 incomplete，物理 close 仍需独立授权。

### Verify

机械检查：`npx vitest run tests/e2e/ui-e2e-contract-dogfood.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`，expected_exit=0；本地事实：S2/S3/S4 真实通过；S1 外部 UI 事实记录为 deferred，不作为当前完成条件。oracle=ORACLE-DOG-001；evidence_path=`quality/evidence/dogfood/`（当前任务存储）。

### Knowledge

本阶段只使用 WorkflowHub 本地隔离 fixture 和当前任务存储；不创建 PaperBuilder 演示任务。S1 的原型、浏览器、用户确认和身份链由独立 UI 后续任务负责。

### STOP

S2/S3/S4 无法真实执行→如实 unavailable/incomplete 报告用户；禁止伪造本地事实。S1 外部事实缺失保持 deferred，不触发本任务阻塞。

### Done

S2/S3/S4 本地事实采集完成且聚焦回归绿；S1 明确记录为外部后续任务 deferred，不写当前通过。S2 close 只使用 T016 隔离临时 fixture 按 `commit→merge→archive→push→cleanup` 验证。

### Risks and rollback

本地 fixture 污染任务存储→测试后清理临时目录；回退=移除临时 fixture，不动 PaperBuilder。

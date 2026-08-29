# 实现计划：make-decision 需求收敛与执行阻塞修复

- **Input**：`specs/make-decision-requirement-convergence-20260828/decision-log.md`、`specs/make-decision-requirement-convergence-20260828/spec.md`
- **Template version**：`plan-task.v3`

## Quick Read

- **Goal**：复用现有技能、stage contract、TaskHandle 与正式审查通道，系统收敛原始需求并阻止 spec/plan 语义漂移。
- **Non-goals**：来源：D-001/D-003/D-008/D-010/D-011/D-012；不新增公共命令、schema、状态机、质量 gate、第五材料、第二打包器、host deadline 或自动恢复控制面。
- **Before**：收敛偏存在性；Grill 一次一题；Clarify 不稳定；非 Codex/session、worktree/TaskHandle 和审查交付失败语义分散。
- **After**：收敛、Grill、Clarify、spec-analyze、宿主降级、正式审查与 TaskHandle 启动均有可执行合同和负例。
- **Main risk**：范围横跨技能、运行时与测试；必须坚持 reuse/extend，禁止复制已有能力。
- **Deletion proof**：本计划不涉及删除任何现有文件，仅新增/修改（no deletion）。
- **Next step**：P1 开始前的首项动作 = 核验当前 TaskHandle 完整性与 existing 绑定（task.json + index.json + facts.jsonl + quality/ 全部存在、workspace_mode=existing 且 workspace_root 指向当前 worktree；无 session 时记录 unavailable 事实，不阻塞后续设计）；核验后 T001 RED 起步。

## Technical Context

### Global Constraints

- **Verified facts**：Node ESM 仓库；五阶段由 workflows/ 与 runtime/stage 实现；TaskHandle 使用 vnext-single-write；四份材料是唯一当前真相；spec 已冻结并可通过三个 production validator。
- **Language / runtime**：JavaScript ESM，Node >=24，Vitest。
- **Primary dependencies**：现有 stage-content-contracts、stage-runtime、task-bootstrap、wh-review 与 portable skills；不新增依赖。
- **Storage / state**：TaskHandle task.json/index.json/facts.jsonl/quality；材料位于 ArtifactDir 的 specs/<task-id>/。
- **Testing**：Vitest 合同/集成测试；输出只作事实，不作许可。
- **Target environment**：Codex 与非 Codex CLI 宿主；macOS/Linux shell。
- **Scale / scope**：14 个生产/技能/测试文件；无 UI。
- **Unresolved facts**：正式 review provider 可能 unavailable，必须诚实记录；不阻止同 task 修复。

## Code Anchors

- **Verified anchors**：`runtime/stage/stage-content-contracts.mjs`、`tools/host/workflowhub-codex-session-state.mjs`、`tools/cli/task-bootstrap.mjs`、`skills/grill-with-docs/SKILL.md`、`skills/spec-clarify/SKILL.md`、`skills/spec-analyze/SKILL.md`、`workflows/make-decision/SKILL.md`、`workflows/build-spec/SKILL.md`。
- **Existing interfaces**：`validateStageSpecAnalyzeProfile`、interaction lifecycle validators、`bootstrapTask`、`runOfficialStage`、正式 wh-review runner。
- **Read now**：上述锚点及对应合同测试消费者。
- **Must read before task**：每张任务卡列出的精确测试文件与目标生产文件。
- **Context mode**：Full — 多个现有 seam 必须统一而不能新建平行机制。

### Reuse → Extend → New

| Capability | Decision | Existing anchor | Reason / removal condition |
| --- | --- | --- | --- |
| 收敛与结束卡 | extend | `workflows/make-decision/SKILL.md`、`CONTEXT.md` | 扩展既有技能合同与完成卡 |
| Grill frontier | extend | `skills/grill-with-docs/SKILL.md` | 对齐 round/frontier |
| Clarify | extend | `skills/spec-clarify/SKILL.md`、`workflows/build-spec/SKILL.md` | 复用唯一 Clarify 流程 |
| 语义分析 | extend | `runtime/stage/stage-content-contracts.mjs`、`skills/spec-analyze/SKILL.md` | 扩展现有 profile |
| 宿主降级 | extend | `tools/host/workflowhub-codex-session-state.mjs` | unavailable 与真实错误分流 |
| TaskHandle 启动 | reuse | `tools/cli/task-bootstrap.mjs` | 只调用并核验官方入口 |
| 正式审查 | reuse | `skills/wh-review/` | 禁止第二打包器 |

## Solution Design

### Overview

实施分三个 Phase。P1 固化需求收敛、Grill、Clarify 与结束卡；P2 扩展 spec-analyze 和 authoring 纪律；P3 收紧宿主/TaskHandle/正式审查失败语义并做最终聚合。每个行为先 RED 后最小 GREEN。

TaskHandle 不新增前置控制面：阶段执行者复用官方 bootstrap/open，核验 task.json、index.json、facts.jsonl、quality/ 的完整事实；半创建目录保持真实失败和风险，不自动恢复。Review 继续使用 wh-review runner，provider 不可用保持 unavailable。

### Module responsibilities

#### Portable skills and workflows

- **Responsibility**：描述用户交互顺序、frontier、Clarify 触发/跳过和人话交接。
- **Consumes**：当前四材料与真实用户回复。
- **Produces**：材料更新与 lifecycle 事实。
- **Must not decide**：不得代替用户回答或创造产品方向。

#### Stage content contracts

- **Responsibility**：验证需求覆盖、目标达成、验收清晰、方案收敛和 plan/task 闭合。
- **Consumes**：当前 packet、materials、evidence。
- **Produces**：consistent/inconsistent/material_incomplete 与 findings。
- **Must not decide**：质量事实不是工作许可。

#### Host and TaskHandle adapters

- **Responsibility**：区分 unavailable 与真实错误；复用官方任务启动和 existing workspace 绑定。
- **Consumes**：session identity、task identity、workspace root。
- **Produces**：结构化结果或 fail-loud error。
- **Must not decide**：不恢复、不回滚、不创建第二生命周期。

### Interfaces, data, and lifecycle

- **Interfaces / schemas**：保持公开 CLI 与 schema；只扩展内部 validator/skill 合同。
- **Data flow / state**：原始需求→decision-log→spec→plan/tasks→stage analyze；失败事实写 quality，不改写为 pass。
- **API contract**：N/A — 无新增 API。
- **UI / external code**：N/A — 非 UI。
- **Fail-loud behavior**：真实参数、材料、identity、半创建 store 错误抛出；仅宿主能力缺失/未注册返回 unavailable。

## UI Delivery Contract (仅 UI phase/task 使用)

- **UI applicability**：N/A — non_ui。
- **Component action**：N/A — 无组件。
- **Real consumer**：N/A — CLI/skills only。
- **State owner**：N/A — 无 UI state。
- **Typed ViewModel**：N/A — 无 ViewModel。
- **CSS/token owner**：N/A — 无样式。
- **Fixture / viewport**：N/A — 无浏览器。
- **Browser / a11y / performance**：N/A — 合同测试覆盖。
- **Screenshot handoff**：N/A — 无 UI。
- **Coverage limits**：不覆盖浏览器视觉。
- **N/A / unknown reason**：产品范围明确 non_ui。

### Design-gap handoff (不改变 Design.md 权威)

- **design_status**：acknowledged。
- **missing_items / reason**：[]。
- **fallback_visual_basis**：N/A — 无 UI。
- **constraints / assumptions**：不新增公共面；现有 CLI/schema 兼容。
- **rework_risk / human_confirmation**：范围已确认；方向变化回上游。
- **current_material_ref / design_revision**：`specs/make-decision-requirement-convergence-20260828/spec.md` / `spec-content.v3`。
- **visible_labels**：核心需求、核心目标、已选方向。
- **preview_refs / fixture_refs / viewport_refs / screenshot_refs**：N/A — 无 UI。
- **responsive / a11y**：N/A — 无 UI。

## File Boundary

### NEW

- `tests/contract/requirement-convergence-regression.test.mjs`
- `tests/contract/task-bootstrap-integrity.test.mjs`

### MODIFY

- `CONTEXT.md`
- `workflows/make-decision/SKILL.md`
- `workflows/build-spec/SKILL.md`
- `skills/grill-with-docs/SKILL.md`
- `skills/spec-clarify/SKILL.md`
- `skills/spec-analyze/SKILL.md`
- `runtime/stage/stage-content-contracts.mjs`
- `tools/host/workflowhub-codex-session-state.mjs`
- `tools/cli/task-bootstrap.mjs`
- `tests/stage-interaction-contract.test.mjs`
- `tests/contract/spec-analyze-completeness.test.mjs`
- `tests/contract/governance-startup-event-early-failure.test.mjs`

### DO NOT TOUCH

- `runtime/schemas/` — 不新增 schema。
- `skills/wh-review/scripts/` — 正式通道仅复用。
- `apps/` — 无 UI。

## Technical Decisions

### DEC-001 — 扩展现有合同

- **Problem**：多个阶段存在执行漂移，但已有技能、validator、TaskHandle 和 review seam。
- **Options**：新增 orchestrator；扩展现有 seam；只写文档。
- **Selected**：extend/reuse。
- **Reason**：现有消费者明确，最小修改可产生可失败合同。
- **Consequence / risk**：文件较多，需聚合回归。
- **Fallback**：逐 Phase 回滚，保留 RED 与质量事实。
- **F10 disposition**：simplify。

### DEC-002 — TaskHandle 完整性是事实

- **Problem**：worktree 可能被误认为任务已初始化；中途失败可能半创建。
- **Options**：新 preflight 状态机；复用 bootstrap 并核验；自动恢复。
- **Selected**：reuse existing bootstrap + factual integrity check。
- **Reason**：避免第二生命周期。
- **Consequence / risk**：半创建时需操作员处置。
- **Fallback**：保留失败事实，不删除目录。
- **F10 disposition**：keep existing seam。

## Test Strategy

| Target | Task | Role | gate_cmd / expected_exit | Oracle / evidence_path |
| --- | --- | --- | --- | --- |
| 收敛/Grill/Clarify/结束卡 | T001 | RED | `npx vitest run tests/contract/requirement-convergence-regression.test.mjs tests/stage-interaction-contract.test.mjs` / `1` | `ORACLE-CONVERGENCE` / `quality/tests/T001-red.txt` |
| 同上 | T002 | GREEN | 同一命令 / `0` | `ORACLE-CONVERGENCE` / `quality/tests/T002-green.txt` |
| spec-analyze/authoring | T003 | RED | `npx vitest run tests/contract/spec-analyze-completeness.test.mjs tests/contract/requirement-convergence-regression.test.mjs` / `1` | `ORACLE-ANALYZE` / `quality/tests/T003-red.txt` |
| 同上 | T004 | GREEN | 同一命令 / `0` | `ORACLE-ANALYZE` / `quality/tests/T004-green.txt` |
| host/TaskHandle/review | T005 | RED | `npx vitest run tests/contract/task-bootstrap-integrity.test.mjs tests/contract/governance-startup-event-early-failure.test.mjs` / `1` | `ORACLE-BOOTSTRAP` / `quality/tests/T005-red.txt` |
| 同上 | T006 | GREEN | 同一命令 / `0` | `ORACLE-BOOTSTRAP` / `quality/tests/T006-green.txt` |
| 全部适用 AC | T007 | N/A — non-behavior change: aggregate final verification | `npx vitest run tests/contract/requirement-convergence-regression.test.mjs tests/stage-interaction-contract.test.mjs tests/contract/spec-analyze-completeness.test.mjs tests/contract/task-bootstrap-integrity.test.mjs tests/contract/governance-startup-event-early-failure.test.mjs` / `0` | `ORACLE-FINAL` / `quality/tests/T007-final.txt` |

> 证据边界说明：
> - AC-CONV-003（用户确认后才收尾）证据 = 用户真实回复发布的 `quality/confirmations/<sha256>.json`（human-confirmation.v2）+ 结束卡三要素痕迹（`quality/evidence/interactions/` 与 decision-log 记录），由 stage-end 人工/交互痕迹审查完成，不单独依赖自动化测试。
> - FR-DOG-001 的真实端到端 dogfood（make-decision → 交接）由 build-code 完成后在 verify-code 阶段运行一次；build-plan 只设计其信号与命令。若届时环境/能力不可行，在质量事实中显式登记 unavailable，不以合同测试聚合替代。
> - build-plan 开始前的首项核验：当前 TaskHandle 完整性（task.json + index.json + facts.jsonl + quality/ 全部存在、workspace_mode=existing 且 workspace_root 指向当前 worktree）+ review 通道 doctor 检查；无 session 时如实记录 unavailable，不阻塞后续设计。

### Review findings disposition（一次异源审查，advice-only）

- **review ref**：`quality/reviews/results/build-plan-default-1d128a3a061f6bb78473f8a52dde312409869197-267ead29-8e16-4059-9614-53faa4da7bb6.json`（status=available；provider pi/coding + antigravity/flash；material_id `b143f099e7da080f2dbc8a6e8524d32fa7e32375fb1b2982049341bdb20d8077`）。
- **F-1ffea637f376（major）**：fixed — 首项动作加入当前任务身份/任务存储完整性与 existing 绑定核验（见 Quick Read / Implementation Order）。
- **F-539ae86b022e（major）**：fixed — 真实端到端 dogfood 明确由 build-code 完成后在 verify-code 阶段运行；不可行则登记 unavailable（见证据边界说明与 T007 goal）。
- **F-98b0e0cbe4ab（major）**：fixed — 计划引用的全部 14 个文件已逐一核对存在；spec 为产品规格不含实现路径，计划路径来自已验证锚点。
- **F-c24eea3f9e04（minor）**：fixed — T005/T006 动作补充 AC-REVIEW-003 的 deadline=null 与长时后台语义验证方式。
- **F-eb6a0eef1980（minor）**：fixed — T007 role 明确为 aggregate final verification，并说明行为验证由各 RED/GREEN 承担。
- **F-fe88dc5cb30e（minor）**：fixed — AC-CONV-003 证据位置明确为 `quality/confirmations/<sha256>.json`（human-confirmation.v2）+ 结束卡三要素痕迹。
- **事实边界**：本次异源审查基于修复前材料快照；findings 全部在本计划中修复，按用户裁定不再对同一 stage 触发第二轮审查；机器对「审查后修改」的自动 stale 标记仅作保守记录，不作为推进 gate。

## Rollback and Recovery

- **Global recovery rule**：只回滚当前 Phase 实现，保留四材料与真实测试/review 事实。
- **Irreversible boundaries**：commit/push/merge/archive/cleanup 需授权。
- **Recovery owner**：build-code executor 按失败 oracle 返回对应任务。

### Engineering Risk Handoff

- **PLAN-RISK-001**：合同与 runtime 判定漂移。
  - **Affected IDs**：FR-CONV-001、FR-ANALYZE-001、T001、T004。
  - **Trigger**：技能文本通过但负例不失败。
  - **Consequence**：执行仍可绕过收敛。
  - **Mitigation or STOP**：以 runtime 负例为准；不能形成断言则 STOP。
  - **Handling Stage**：build-code。
  - **Verification**：ORACLE-CONVERGENCE、ORACLE-ANALYZE。
- **PLAN-RISK-002**：完整性检查被实现成新 gate。
  - **Affected IDs**：FR-TASK-001、FR-TASK-002、T005、T006。
  - **Trigger**：新增 public command/schema/state 或自动恢复。
  - **Consequence**：形成第二控制面。
  - **Mitigation or STOP**：只复用 bootstrap 与 store 文件事实。
  - **Handling Stage**：build-code。
  - **Verification**：ORACLE-BOOTSTRAP。

## Implementation Order

首项动作（进入任何 Phase 之前，独立于任务卡）：核验当前 TaskHandle 完整性与 existing 绑定——`node` 内联检查任务目录 `task.json`（含 `workspace_mode=existing` 与 `workspace_root`）、`index.json`、`facts.jsonl`、`quality/` 全部存在；随后 `node skills/wh-review/scripts/wh-review-cli.mjs doctor` 核验正式审查通道。核验失败或 unavailable 时记录真实事实并 STOP 回 TASK 域契约，不自动恢复。核验通过后：Phase P1→P2→P3；P1 产出语义，P2 消费语义，P3 处理独立基础设施 seam，T007 最后聚合。

## Dependencies and Parallelism

- **Dependencies**：T001→T002→T003→T004→T005→T006→T007；RED/GREEN 串行。
- **Parallel work**：N/A — 共享测试文件，串行避免所有权冲突。
- **External dependencies**：wh-review provider 可 unavailable；只影响质量事实。

## Requirement and Verification Traceability

| Source / decision | FR | AC | Phase / Task | Depends on | Exact files | Command / oracle |
| --- | --- | --- | --- | --- | --- | --- |
| R-001~R-014 / D-001~D-007 | FR-CONV-001, FR-CONV-002, FR-CONV-003, FR-CONV-004, FR-GRILL-001, FR-CLARIFY-001, FR-CLARIFY-002 | AC-CONV-001, AC-CONV-002, AC-CONV-003, AC-CONV-004, AC-GRILL-001, AC-CLARIFY-001, AC-CLARIFY-002 | Phase P1/T001,T002 | none/T001 | `workflows/make-decision/SKILL.md`, `workflows/build-spec/SKILL.md`, `skills/grill-with-docs/SKILL.md`, `skills/spec-clarify/SKILL.md`, `CONTEXT.md` | ORACLE-CONVERGENCE |
| R-004,R-007,R-022 / D-003,D-005,D-010 | FR-ANALYZE-001, FR-ANALYZE-002, FR-AUTHORING-001, FR-AUTHORING-002 | AC-ANALYZE-001, AC-ANALYZE-002, AC-AUTHORING-001, AC-AUTHORING-002 | Phase P2/T003,T004 | T002/T003 | `runtime/stage/stage-content-contracts.mjs`, `skills/spec-analyze/SKILL.md`, `workflows/build-spec/SKILL.md` | ORACLE-ANALYZE |
| R-015~R-021,R-023 / D-008,D-011,D-012 | FR-HOST-001, FR-HOST-002, FR-HOST-004, FR-TASK-001, FR-TASK-002, FR-REVIEW-001, FR-REVIEW-002, FR-REVIEW-003 | AC-HOST-001, AC-HOST-002, AC-HOST-004, AC-TASK-001, AC-TASK-002, AC-REVIEW-001, AC-REVIEW-002, AC-REVIEW-003 | Phase P3/T005,T006 | T004/T005 | `tools/host/workflowhub-codex-session-state.mjs`, `tools/cli/task-bootstrap.mjs`, `workflows/make-decision/SKILL.md` | ORACLE-BOOTSTRAP |
| D-009 | FR-DOG-001 | AC-DOG-001 | Phase P3/T007 | T006 | `tests/contract/task-bootstrap-integrity.test.mjs` | ORACLE-FINAL |

## Governance Synchronization Matrix

| Governance surface | Actual files | Change / no change | Task IDs | Reason |
| --- | --- | --- | --- | --- |
| 术语 | `CONTEXT.md` | change | T002 | 完成卡人话契约 |
| 技能/工作流 | `workflows/make-decision/SKILL.md`, `workflows/build-spec/SKILL.md`, `skills/grill-with-docs/SKILL.md`, `skills/spec-clarify/SKILL.md`, `skills/spec-analyze/SKILL.md` | change | T002,T004,T006 | 既有 consumer |
| runtime | `runtime/stage/stage-content-contracts.mjs`, `tools/host/workflowhub-codex-session-state.mjs`, `tools/cli/task-bootstrap.mjs` | change | T004,T006 | 语义与失败边界 |
| tests | `tests/contract/requirement-convergence-regression.test.mjs`, `tests/contract/task-bootstrap-integrity.test.mjs`, existing tests | change/new | T001~T007 | RED/GREEN |
| schema/public CLI | `runtime/schemas/`, public CLI | no change | T001~T007 | 非目标 |

## Constitution Check

- **Constitution binding**：`{"artifact_kind":"constitution","ref":"constitution-checklist.md","hash":"dff42267e6d91ebee604607d2017f241d08fe6d885468727c1049c05eff64097","id":"CONSTITUTION","version":"current","clause_count":22}`
- **F1**：重活留在技能，runtime 只验证。
- **F2**：技能、validator、host 接口窄。
- **F3**：材料与 publication 结构真实。
- **F4**：review finding 不锁死修复。
- **F5**：不新增预防性 gate。
- **F6**：执行事实仍外置。
- **F7**：确认和不可逆授权分离。
- **F8**：reuse/extend 优先。
- **F9**：负例可证伪，不假绿。
- **F10**：拒绝机器校验本身驱动的新基建。
- **F11**：不新增恢复/生命周期控制面。
- **Q1**：RED/GREEN 同命令同 oracle。
- **Q2**：独立 review 或 truthful unavailable。
- **Q3**：聚合不替代局部事实。
- **S1**：四材料边界不变。
- **S2**：无第五材料。
- **S3**：无新 public schema/command。
- **S4**：无双写兼容桥。
- **S5**：失败 fail-loud/unavailable 分明。
- **S6**：文件边界精确。
- **S7**：无不可逆操作。
- **S8**：延期风险不伪装完成。

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

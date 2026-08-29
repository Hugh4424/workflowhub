# 实施计划：workflowhub close 机制修复与框架减法

**Task ID**: `workflowhub-simplicity-close-repair-20260829` | **Date**: 2026-08-29 | **Spec**: [spec.md](./spec.md)
**Input**: 已接受的 `decision-log.md` 与 `spec.md`
**Status**: Phase 1 完成（plan/tasks 已生成，待 build-code 执行）

## 速读卡

- **目标**：让 workflowhub 任务在 verify-code 之后能正常完成提交、合并、归档、推送、清理五个动作；同时精简冗余控制面，支持 DSH 等非 Codex 宿主会话。
- **核心策略**：把 close 从质量裁判还原为物理交付动作；在写边界和 review 调用前加 fail-loud 检查；删除死代码与重复控制面；补齐 close 机制测试。
- **Non-goals**：不重做 PaperBuilder；不改 3rd-review broker 内部；不清理主仓 git 历史孤儿对象；不做 UI；不重做 M14–M17；不合并双轨事实结构。来源：decision-log.md D-010、spec.md 明确不做。
- **关键文件**：`core/task-close.mjs`、`runtime/task/workspace.mjs`、`runtime/stage/stage-content-contracts.mjs`、`runtime/evidence/dsh-transcript.mjs`、`tools/host/workflowhub-codex-session-state.mjs`、`tools/cli/stage-runtime.mjs`、`skills/wh-review/scripts/wh-review-cli.mjs`。
- **验收入口**：AC-02/AC-05/AC-06 对应测试；AC-01 dogfood close；AC-03/AC-04 文档与清单。
- **风险**：close 自举风险由 AC-02 先绿 + finalize 补记兜底；双轨合并推迟到后续任务。

## Technical Context

**Language/Version**: Node.js（>=24）、JavaScript ES modules、Markdown
**Primary Dependencies**: 现有 workflowhub runtime/tools/skills；3rd-review broker 仅 host-identity-only 复用
**Storage**: 文件系统 — `specs/{task-id}/` 四份材料；task store `quality/` 目录
**Testing**: `npx vitest run <file>`；close contract/integration tests；dogfood close
**Target Platform**: workflowhub CLI（Codex / DSH / 其他宿主会话）
**Project Type**: AI workflow orchestration tool（skill/prompt + Node.js runtime）
**Constraints**: 不新增公共 runtime 命令；不新增 ownership 对象；不合并双轨事实；不清理主仓历史 git 对象。

## Global Constraints

- 公共 runtime 命令仍是 doctor、status、run、review、verify、confirm、authorize 七类。
- 四份当前材料（decision-log.md、spec.md、plan.md、tasks.md）仍是唯一工作真相。
- commit、merge、archive、push、cleanup 等不可逆操作须经独立授权。
- close 开始前的一次人工确认绑定五个动作这一批次：确认覆盖"是否执行整批交付"；现有 `authorize` 按动作记录授权事实，是批内逐步执行的技术授权，不是额外人工确认；两者关系为"一次人确认批次，五次机器记录授权"，不新增确认次数或授权命令。
- `tools/cli/task-close.mjs` 保持为 close 唯一用户入口（prepare/confirm/execute/complete/status/close，新增 finalize 子命令属同一 CLI 修改）；`stage-runtime authorize` 不作为 close 用户入口。
- 质量事实只记录、不阻塞修复；缺失质量事实不得宣称完成。
- 新机制不得新增门面、概念对象或控制面；新增控制面必须有唯一 consumer、owner、替代关系和删除条件。

## Modules, Interfaces, and Data Contracts

### 模块职责

- **close 交付模块**：`core/task-close.mjs` — 编排 commit/merge/archive/push/cleanup 与人工确认；`tools/cli/task-close.mjs` 为唯一用户入口（含新增 finalize 子命令）。
- **workspace 清理模块**：`runtime/task/workspace.mjs` — 按 workspace_mode 分支执行删除或记录。
- **宿主可移植模块**：`runtime/evidence/dsh-transcript.mjs`、`tools/host/workflowhub-codex-session-state.mjs`、`tools/cli/stage-runtime.mjs` — DSH transcript 读取、会话绑定、默认监控源。
- **决策收敛模块**：`runtime/stage/stage-content-contracts.mjs` — 从 coverage 输出推导 message_class，验证需求收敛。
- **review 入口模块**：`skills/wh-review/scripts/wh-review-cli.mjs` — workspace 绑定、preflight、错误分类。

### 接口与数据契约

- close 与 status 共享同一事实新鲜度判定函数。
- completed.json 只记录物理交付事实；质量状态独立存储在 quality/facts 中。
- completed.json 数据契约（可执行）：`{ task_id, close_mode, actions: [{ name, completed_at, evidence_ref }], confirmation_ref, completed_at }`；`close_mode` 只取 normal/gap（无 risk）；`actions` 固定五条且 `evidence_ref` 指向该动作物理证据（提交 hash/合并结果/归档路径/推送结果/工作区状态）；不持有 quality_status/product_release_status 字段。
- 断点续跑契约：每动作落账即上条 `actions` 记录；续跑读取既有记录跳过已完成动作、不重复落账；finalize 逐一核对五类物理证据齐全后补写同一结构，缺项即拒绝。
- 确认绑定契约：completed.json 的 `confirmation_ref` 指向本次批次人工确认记录；缺失确认或确认拒绝时 close 不生成 completed.json。
- DSH transcript 输出 requirement_message JSONL，与 Codex rollout 同构。
- 子代理结果契约复用现有 canonical receipt 槽位，不新增持久对象。

## Implementation Order

0. close 行为变更测试 RED（T0）。
1. 实现 DSH transcript 读取与会话绑定（T1、T2）。
2. 修复 wh-review workspace 绑定（T3）。
3. 重构 close 五个动作并删除 risk close（T4）。
4. 实现 cleanup 分支、断点续跑与 finalize（T5）。
5. 统一 close 与 status 事实新鲜度判定（T6）。
6. 实现左移防护五件套（T7）。
7. 死代码扫描与删除（T8）。
8. 双轨事实评估结论报告（T9）。
9. 宪法解释段与 checklist 同步（T10）。
10. close 行为变更测试 GREEN（T12）。
11. dogfood close 验收（T11，依赖 T12 GREEN 之后执行）。

## Test Strategy

- **单元/回归**：`tests/dsh-transcript.test.mjs`、`tests/contract/requirement-convergence-regression.test.mjs`、`skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs`。
- **close 机制 contract**：恒 risk 分离、existing 模式 close 可行、断点续跑、finalize 补记、material-only delta 对齐。
- **左移防护测试**：cwd 错位写入被拒、review preflight 四类错误测试、fallback 分类测试、子代理崩溃占位测试、code_review 事件消费测试。
- **减法交付测试**：死代码反向引用扫描证据、DSH 宿主可移植测试、双轨评估结论文件检查。
- **dogfood**：本任务自身 close 生成的 completed.json。

## 风险与回滚

- close 失败时记录已执行步骤；`finalize` 允许人工补记；不回滚已完成的 git push/merge。
- 若 close 测试（AC-02）失败，先修实现使测试真实转绿，再执行 dogfood close；不修改测试断言掩盖问题，不伪造 completed.json。
- 3rd-review broker 改动已独立合入 main，可回滚其提交不影响 workflowhub 侧。

## FR to AC to Step Traceability

| FR | 主要文件 | 测试/证据 | AC | Step |
| --- | --- | --- | --- | --- |
| FR-CLOSE-001~005 | `core/task-close.mjs` | close contract/integration tests | AC-02 | T4 |
| FR-CLOSE-003 | `runtime/task/workspace.mjs` | existing 模式 close 测试 | AC-02 | T5 |
| FR-CLOSE-004 | `core/task-close.mjs` | resume/finalize tests | AC-02 | T5 |
| FR-CLOSE-005 | `core/task-close.mjs` | freshness 一致性测试 | AC-02 | T6 |
| FR-LEFT-001 | `runtime/stage/stage-runner.mjs` | cwd 错位写入被拒测试 | AC-05 | T7 |
| FR-LEFT-002 | `skills/wh-review/scripts/wh-review-cli.mjs`、`skills/wh-review/scripts/review-runner.mjs` | preflight 四类错误测试 | AC-05 | T3、T7 |
| FR-LEFT-003 | `review-runner.mjs`、`wh-review-cli.mjs`、`stage-runtime.mjs`、`stage-runner.mjs`、`stage-agent-outcome-adapter.mjs`、`workflowhub-stage-agent-bridge.mjs` | fallback invalid_input/unavailable 分类测试 | AC-05 | T7 |
| FR-LEFT-004 | `runtime/stage/stage-runner.mjs`、`runtime/stage/stage-content-contracts.mjs` | 子代理占位结果拒绝测试 | AC-05 | T7 |
| FR-LEFT-005 | `tools/host/workflowhub-codex-session-event.mjs`、`runtime/stage/completion-predicates.mjs` | code_review 一等事件消费测试 | AC-05 | T7 |
| FR-PORT-001 | `runtime/evidence/dsh-transcript.mjs`、`tools/host/workflowhub-codex-session-state.mjs` | DSH transcript tests | AC-06 | T1、T2 |
| FR-SUB-001 | `scripts/dead-code-scan.mjs` 反向引用扫描证据 | dead-code removal test | AC-06 | T8 |
| FR-SUB-002 | `runtime/evidence/dsh-transcript.mjs` | DSH host bootstrap test | AC-06 | T1 |
| FR-SUB-003 | `quality/evidence/dual-track-evaluation-report.md` | 报告存在且含计数来源检查 | AC-06 | T9 |
| FR-EVAL-001 | `quality/evidence/dual-track-evaluation-report.md` | 报告存在且含计数来源检查 | AC-06 | T9 |

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Every plan MUST explicitly answer these gates. For workflowhub, the applicable gates are the project's own 22-clause constitution (CONSTITUTION.md v1.6.0). This section fills all 22 clauses from constitution-checklist.md.

### Framework Principles (F)

- [x] **F1 薄核心** — 判据：核心只做调度编排，重活下沉技能层。close 修复、DSH 支持、左移防护均通过修改现有 runtime/tools/skills 实现，不新增门面。
- [x] **F2 窄契约** — 判据：模块间走窄而明确的接口。close 与 status 共享判定函数；completed.json 与质量事实解耦；子代理结果复用现有 receipt 槽位。
- [x] **F3 物理事实靠机器校验但不阻断** — 判据：物理事实机器客观采集且不阻断。写边界 cwd 断言、review preflight、fallback 分类均 fail-loud 记录，不阻断推进。
- [x] **F4 质量靠异源审查与人而非阻断式质量门** — 判据：质量靠独立审查+人，而非阻断门。wh-review 未触发保留 unavailable 事实；不伪造通过。
- [x] **F5 gate 谨慎添加出事再补无用则移除** — 判据：关卡按需添加，无用即移除。删除 risk close 平行机制、临时 bridge、死代码。
- [x] **F6 统一外置执行记录** — 判据：进度/指标/回溯统一记录可回溯。close 五个动作落账到 completed.json；DSH 需求快照绑定可回溯。
- [x] **F7 推进与不可逆操作不自动越过人** — 判据：推进/不可逆操作经人边界确认。close 包含一次独立人工确认；cleanup 独立授权。
- [x] **F8 简单优先** — 判据：选更简单依赖更少的方案，不写掩盖问题的兜底。不新增 host adapter；不合并双轨；删除死代码。
- [x] **F9 可证伪不假绿** — 判据：检查在"实际为假"时真报失败、缺数据标未知。close 测试失败真报；finalize 补记不漂白质量；review unavailable 如实记录。
- [x] **F10 自动化按真实收益添加，不为"机器可校验"本身堆基建** — 判据：自动化真实收益大于长期维护成本。不新增 CI/gate/自动校验基建；测试只做真实验收入口。
- [x] **F11 控制面受限** — 判据：不新增公共命令/材料/概念对象。七类公共命令不变；四份材料不变；无新 manifest 字段。

### Quality Principles (Q)

- [x] **Q1 记事实而非阻断** — 判据：质量事实只记录浮现，不阻断推进。close 不因质量缺口阻塞；review unavailable 不阻断阶段收尾。
- [x] **Q2 gate 三类划分** — 判据：关卡分入口校验/记录采集/人工确认三类。入口校验（spec 存在）、记录采集（测试、评估报告）、人工确认（close 确认、build-plan 确认）分离。
- [x] **Q3 异源审查加人工把关** — 判据：质量裁决由独立来源独立上下文产出，无自审自判。spec.md 已由 3rd-review direction/detail 双轨审查；plan/tasks 由人确认。

### Skill Principles (S)

- [x] **S1 能用外部就不造轮子** — 判据：优先复用外部技能。wh-review、spec-plan、spec-tasks 等现有技能复用。
- [x] **S2 外部技能可针对项目改造合宪** — 判据：外部技能按需改造至合宪。wh-review readOnly 绑定修复、preflight 分类。
- [x] **S3 迭代时保持最新并就地检查** — 判据：迭代时查更新/更优，来源路径写进技能文件。skill-bundle.json、catalog.yaml hash 已同步。
- [x] **S4 自定义技能必须有指标系统** — 判据：自研技能配套指标纳入统一执行记录。stage outcome 记录 cost/duration。
- [x] **S5 自定义技能方便子代理调用省主上下文** — 判据：自研技能便于子代理调用，减少主上下文占用。wh-review、spec-plan 可由子代理调用。
- [x] **S6 自定义技能参考市面方案不闭门造车** — 判据：自研技能参考成熟方案优化。close 五个动作参考交付收尾通用实践。
- [x] **S7 一阶段一技能一工作流一文件夹** — 判据：阶段/工作流一一对应独立、按目录约定。workflows/build-plan、skills/spec-plan 等组织不变。
- [x] **S8 自定义技能可独立调用可搬运** — 判据：自研技能可独立调用、可跨宿主搬运、不绑死环境。DSH transcript 支持使会话绑定不绑死 Codex。

**Constitution Check Result**: 22/22 clauses addressed. All gates pass. No violations requiring justification.

## Complexity Trade-offs

- **候选方案 A：新增 host adapter** vs **复用 transcript 接口** — 选择后者，降低 3rd-review 耦合。
- **候选方案 B：合并双轨事实** vs **只评估不合并** — 选择后者，避免引入新数据模型。
- **候选方案 C：新增 ownership 对象** vs **用 workspace_mode 分支** — 选择后者，不新增概念对象。

## 删除证明

本任务涉及删除死代码与临时 bridge；删除证明由 T8 反向引用扫描证据交付。T8 完成后，扫描报告将列出被删除文件的零引用证据。

## Phase 1: 宿主可移植与收敛修复

### Goal

让 workflowhub 能读取 DSH transcript 并绑定需求消息；决策收敛检查支持非 Codex 宿主。

### Files

- `runtime/evidence/dsh-transcript.mjs`（NEW）
- `tools/host/workflowhub-codex-session-state.mjs`（MODIFY）
- `tools/cli/stage-runtime.mjs`（MODIFY）
- `runtime/stage/stage-content-contracts.mjs`（MODIFY）
- `CONTEXT.md`（MODIFY，host 声明机制说明）
- `tests/dsh-transcript.test.mjs`（NEW）
- `tests/contract/requirement-convergence-regression.test.mjs`（NEW）

### Tasks

- T1、T2

### Verify

`npx vitest run tests/dsh-transcript.test.mjs tests/contract/requirement-convergence-regression.test.mjs` 全绿。

### Knowledge

DSH transcript 是多帧 zstd JSONL；coverage 输出已按消息 hash 绑定类别。

### STOP

若 DSH 解析或收敛修复破坏既有 Codex 路径，停止并回退。

## Phase 2: close 核心重构与左移防护

### Goal

close 回归五个动作（commit、merge、archive、push、cleanup）+ 确认；实现 cleanup 分支、断点续跑、finalize、左移防护五件套。

### Files

- `core/task-close.mjs`（MODIFY）
- `tools/cli/task-close.mjs`（MODIFY）
- `runtime/task/workspace.mjs`（MODIFY）
- `skills/wh-review/scripts/wh-review-cli.mjs`（MODIFY）
- `skills/wh-review/scripts/review-runner.mjs`（MODIFY）
- `runtime/evidence/freshness.mjs`（MODIFY）
- `runtime/task/git-worktree-snapshot.mjs`（MODIFY）
- `runtime/stage/stage-runner.mjs`（MODIFY）
- `runtime/stage/stage-content-contracts.mjs`（MODIFY）
- `runtime/stage/completion-predicates.mjs`（MODIFY）
- `runtime/stage/stage-agent-outcome-adapter.mjs`（MODIFY）
- `tools/host/workflowhub-stage-agent-bridge.mjs`（MODIFY）
- `tools/host/workflowhub-codex-session-event.mjs`（MODIFY）
- `tests/close/...`（NEW）
- `tests/left-shift/...`（NEW）

### Tasks

- T0、T3、T4、T5、T6、T7

### Verify

close contract/integration 测试与左移防护测试全绿；T0 RED 在前，行为变更先失败后通过。

### Knowledge

ADR-0020 定义 close 为五个动作 + 确认（顺序：提交、合并、归档、推送、清理）；质量状态抄写不裁判。

### STOP

若 close 改动导致 dogfood close 无法完成，停止并人工收尾。

## Phase 3: 减法、评估与 dogfood

### Goal

删除死代码；产出双轨评估报告；同步宪法 checklist 并在 CONSTITUTION.md 治理边界节与 CONTEXT.md 增补三义解释段；GREEN 收口后本任务正常 close。

### Files

- `scripts/dead-code-scan.mjs`（NEW）
- `scripts/dual-track-evaluate.mjs`（NEW）
- `docs/architecture/move-map.json`（MODIFY）
- `quality/evidence/dead-code-scan/...`（NEW）
- `quality/evidence/dual-track-evaluation-report.md`（NEW）
- `quality/evidence/constitution-mapping-checklist.md`（NEW）
- `CONSTITUTION.md`（MODIFY）
- `CONTEXT.md`（MODIFY）
- `constitution-checklist.md`（MODIFY）
- `tests/close/dogfood-close.test.mjs`（NEW）
- `operations/close/completed.json`（NEW）

### Tasks

- T8、T9、T10、T12、T11

### Verify

死代码扫描证据存在；评估报告存在且含计数来源；CONTEXT.md 含 close 三义段；checklist 新增四条判据；T12 全量相关测试绿；completed.json 非 risk。

### Knowledge

双轨合并推迟到后续任务；本任务只评估；T11 dogfood 在 T12 GREEN 之后执行。

### STOP

若宪法解释段被误读为新门禁，重新措辞；若 close 失败无法 finalize，人工收尾。

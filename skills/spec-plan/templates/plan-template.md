# 实现计划：[填写：功能名]

- **Input**：`[填写：decision-log.md ref]`、`[填写：spec.md ref]`
- **Template version**：`plan-task.v3`

## Quick Read

- **Goal**：[填写：完成后的可观察结果]
- **Non-goals**：[填写：明确不做什么及其 source/decision ref]
- **Before**：[填写：已核实的当前行为或缺口]
- **After**：[填写：目标行为]
- **Main risk**：[填写：最可能影响交付的风险]
- **Next step**：[填写：首个可执行动作或 STOP]

## Technical Context

### Global Constraints

- **Verified facts**：[填写：影响实现的仓库、接口、数据和运行事实]
- **Language / runtime**：[填写：已核实版本]
- **Primary dependencies**：[填写：已有依赖及用途；无则 N/A — reason]
- **Storage / state**：[填写：数据与持久化边界；无则 N/A — reason]
- **Testing**：[填写：真实测试工具、资源和清理约束]
- **Target environment**：[填写：目标环境与兼容范围]
- **Scale / scope**：[填写：文件、模块和数据范围]
- **Unresolved facts**：[填写：未知事实、影响、处理 Stage；无则 N/A — reason]

## Code Anchors

- **Verified anchors**：[填写：精确路径、符号、现有 consumer]
- **Existing interfaces**：[填写：已核实签名、schema 或事件；无则 N/A — reason]
- **Read now**：[填写：设计阶段必须读取的最小锚点]
- **Must read before task**：[填写：执行前才需要读取的锚点；无则 N/A — reason]
- **Context mode**：[填写：Lite / Full / N/A — engineering reason]

### Reuse → Extend → New

| Capability | Decision | Existing anchor | Reason / removal condition |
| --- | --- | --- | --- |
| [填写：能力] | reuse / extend / new | `[填写：path:symbol]` | [填写：最小方案理由；new 需写 consumer、owner、test、删除条件] |

## Solution Design

### Overview

[填写：用 2–4 个短段落讲清完整技术链路、关键数据流和最小改动方式。]

### Module responsibilities

#### [填写：模块名称]

- **Responsibility**：[填写：单一职责]
- **Consumes**：[填写：准确接口或 schema]
- **Produces**：[填写：准确接口或 schema]
- **Must not decide**：[填写：权威边界]

### Interfaces, data, and lifecycle

- **Interfaces / schemas**：[填写：签名、数据契约和兼容边界；无则 N/A — reason]
- **Data flow / state**：[填写：输入、变换、输出、失败与恢复]
- **API contract**：[填写：method、path、request、response、error；无则 N/A — reason]
- **UI / external code**：[填写：信息层级、交互、可访问性或最小 hook；无则 N/A — reason]
- **Fail-loud behavior**：[填写：无效输入或状态如何明确失败]

## UI Delivery Contract (仅 UI phase/task 使用)

- **UI applicability**：`ui_scope` / `non_ui` / `unknown`；若无 UI 改动填 `N/A — reason`。
- **Component action**：`reuse` / `modify` / `extend-state-or-variant` / `add-local` / `extract-shared` / `remove-after-no-consumers`。
- **Real consumer**：[填写真实页面/组件消费者；没有时写 `unknown — reason`]
- **State owner**：[填写状态所属组件或 hook]
- **Typed ViewModel**：[填写输入/输出类型、adapter 或 `N/A — reason`]
- **CSS/token owner**：[填写样式与 token 所有者、边界和禁止的 global override]
- **Fixture / viewport**：[填写假数据 fixture、viewport 名称/尺寸和 responsive 断点]
- **Browser / a11y / performance**：[填写交互、keyboard、a11y、performance 测试路线]
- **Screenshot handoff**：[填写截图路径/命令；blocked/unknown 时写失败原因]
- **Coverage limits**：[填写不覆盖的浏览器、视觉、API 或性能范围]
- **N/A / unknown reason**：[填写为什么无法执行或只能人工确认]

### Design-gap handoff (不改变 Design.md 权威)

- **design_status**：`approved` / `acknowledged` / `not_approved` / `unknown`。
- **missing_items / reason**：[填写缺项和原因；没有缺项填 `[]`]
- **fallback_visual_basis**：[填写真实组件+假数据、设计工具结果或 `N/A — reason`]
- **constraints / assumptions**：[填写交互、label、组件限制和实现假设]
- **rework_risk / human_confirmation**：[填写返工风险与人工确认事实]
- **current_material_ref / design_revision**：[填写当前四份材料引用和 Design.md 版本字符串]
- **visible_labels**：[填写页面和操作的可见 label]
- **preview_refs / fixture_refs / viewport_refs / screenshot_refs**：[填写可回放引用；缺失必须保留 `unknown` 或 `N/A — reason`]
- **responsive / a11y**：[每个状态填写窄视口重排、溢出、焦点、键盘、语义和错误关联意图]

## File Boundary

### NEW

- `[填写：精确新增文件路径 / N/A — reason]`

### MODIFY

- `[填写：精确修改文件路径]`

### DO NOT TOUCH

- `[填写：精确保护文件路径及理由]`

## Technical Decisions

### DEC-001 — [填写：决策名称]

- **Problem**：[填写：真实工程问题]
- **Options**：[填写：候选方案及取舍]
- **Selected**：[填写：reuse / extend / new 及选择]
- **Reason**：[填写：为什么是最简单的充分方案]
- **Consequence / risk**：[填写：代价和风险]
- **Fallback**：[填写：边界内回退方式]
- **F10 real threat**：[填写：仅 Selected 为 new 时保留]
- **F10 existing cover**：[填写：仅 Selected 为 new 时保留]
- **F10 bypassable**：[填写：仅 Selected 为 new 时保留]
- **F10 maintenance cost**：[填写：仅 Selected 为 new 时保留]
- **F10 disposition**：[填写：`keep` / `simplify` / `remove`]

## Test Strategy

设计 RED/GREEN，不在 build-plan 执行命令。两者使用同一 `gate_cmd` 和
oracle identity；`gate_cmd` 只是测试命令，不是工作许可证。

| Target | Task | Role | gate_cmd / expected_exit | Oracle / evidence_path |
| --- | --- | --- | --- | --- |
| [填写：FR/AC] | [填写：T-ID] | RED | `[填写：可执行命令]` / `[填写：非零]` | `[填写：ORACLE-ID、失败信号、task-relative 路径]` |
| [填写：FR/AC] | [填写：T-ID] | GREEN | `[填写：同一命令]` / `0` | `[填写：同一 ORACLE-ID、成功/负例、task-relative 路径]` |

## Rollback and Recovery

- **Global recovery rule**：[填写：只回滚当前实现，保留四份材料和既有质量事实]
- **Irreversible boundaries**：[填写：需要明确授权的 commit/push/merge/archive/cleanup；无则 N/A — reason]
- **Recovery owner**：[填写：失败后由谁执行哪一步]

### Engineering Risk Handoff

- **PLAN-RISK-001**：[填写：风险主题]
  - **Affected IDs**：[填写：source/FR/AC/T-ID]
  - **Trigger**：[填写：何时发生]
  - **Consequence**：[填写：可观察后果]
  - **Mitigation or STOP**：[填写：最小缓解或停止条件]
  - **Handling Stage**：[填写：build-plan / build-code / verify-code]
  - **Verification**：[填写：如何证明已处理或仍存在]

## Implementation Order

[填写：producer-before-consumer 顺序、Phase ID 和必须串行的原因。]

## Dependencies and Parallelism

- **Dependencies**：[填写：producer → consumer 及串行原因；无则 N/A — reason]
- **Parallel work**：[填写：独立输入、依赖和文件所有权；无则 N/A — reason]
- **External dependencies**：[填写：已核实依赖与 absence semantics；无则 N/A — reason]

## Requirement and Verification Traceability

| Source / decision | FR | AC | Phase / Task | Depends on | Exact files | Command / oracle |
| --- | --- | --- | --- | --- | --- | --- |
| [填写：R*/D*] | [填写：FR-ID] | [填写：AC-ID] | [填写：P1/T001] | [填写：T-ID / none] | `[填写：精确路径]` | `[填写：命令 / ORACLE-ID]` |

## Governance Synchronization Matrix

| Governance surface | Actual files | Change / no change | Task IDs | Reason |
| --- | --- | --- | --- | --- |
| [填写：宪法/技能/测试/文档] | `[填写：精确路径]` | change / no change | [填写：T-ID] | [填写：边界理由] |

## Constitution Check

- **Constitution binding**：`{"artifact_kind":"constitution","ref":"[填写：constitution-checklist.md ref]","hash":"[填写：真实 SHA-256]","id":"CONSTITUTION","version":"[填写：version]","clause_count":22}`
- **F1**：[填写：逐条事实与证据]
- **F2**：[填写：逐条事实与证据]
- **F3**：[填写：逐条事实与证据]
- **F4**：[填写：逐条事实与证据]
- **F5**：[填写：逐条事实与证据]
- **F6**：[填写：逐条事实与证据]
- **F7**：[填写：逐条事实与证据]
- **F8**：[填写：逐条事实与证据]
- **F9**：[填写：逐条事实与证据]
- **F10**：[填写：逐条事实与证据]
- **F11**：[填写：逐条事实与证据]
- **Q1**：[填写：逐条事实与证据]
- **Q2**：[填写：逐条事实与证据]
- **Q3**：[填写：逐条事实与证据]
- **S1**：[填写：逐条事实与证据]
- **S2**：[填写：逐条事实与证据]
- **S3**：[填写：逐条事实与证据]
- **S4**：[填写：逐条事实与证据]
- **S5**：[填写：逐条事实与证据]
- **S6**：[填写：逐条事实与证据]
- **S7**：[填写：逐条事实与证据]
- **S8**：[填写：逐条事实与证据]

## Phase P1 — [填写：阶段名]

### Goal

[填写：本 Phase 的可观察结果。]

### Files

- **NEW**：`[填写：精确路径 / N/A — reason]`
- **MODIFY**：`[填写：精确路径]`
- **DO NOT TOUCH**：`[填写：精确保护路径及理由]`

### Tasks

- `[填写：T-ID：一行结果]`

### Verify

[填写：命令、expected_exit、oracle、evidence_path；与本 Phase task oracle 对齐。]

### Knowledge

[填写：下一阶段必须知道的已核实事实。]

### STOP

[填写：返回哪个 owning material 的具体条件。]

### Done

[填写：可以诚实报告的测试、AC、review、证据和交接事实。]

### Risks and rollback

[填写：affected IDs、trigger、consequence、mitigation、rollback。]

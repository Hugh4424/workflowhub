# 实现计划：[填写：功能名]

> 基于已接受的 spec。正文沿用 AgentHub 的工程阅读顺序，WorkflowHub 字段只补版本、边界、执行和验证合同。

- **Input**：`[填写：spec ref]`
- **Status**：[填写：Draft / Accepted / Superseded]
- **Template version**：`plan-task.v3`

## 1. 速读卡

- **Goal**：[填写：完成后可观察到的行为变化]
- **Non-goals**：[填写：明确不做事项；来源：accepted spec 章节]
- **Before**：[填写：已核实的当前行为]
- **After**：[填写：目标行为]
- **Main risk**：[填写：最可能影响交付的风险]
- **Next step**：[填写：首个可执行动作或 STOP]

## 2. Technical Context and Constraints

- **Language / runtime**：[填写：已核实版本]
- **Primary dependencies**：[填写：已有依赖及用途]
- **Storage / state**：[填写：数据和持久化边界]
- **Testing**：[填写：真实测试工具和资源约束]
- **Target environment**：[填写：运行环境]
- **Project type**：[填写：项目性质]
- **Performance goals**：[填写：目标 / N/A — 理由]
- **Scale / scope**：[填写：文件、模块、数据范围]
- **Relevant ADR / context**：[填写：受控来源]
- **Unresolved facts**：[填写：缺失事实及 STOP / N/A — 理由]

### Global Constraints

- [填写：逐条继承 accepted spec、宪法和受控上下文的红线]

## 3. Constitution Check

- **Constitution binding**：`{"artifact_kind":"constitution","ref":"[填写：constitution ref]","hash":"[填写：真实 SHA-256]","id":"[填写：constitution ID]","version":"[填写：version]","clause_count":21}`

> 发布前必须替换为当前宪法的真实值；占位 hash 必须被发布门拒绝。

### Framework Principles

- [ ] [填写：逐项列 F1–F10 的结论和证据]

### Quality Principles

- [ ] [填写：逐项列 Q1–Q3 的结论和证据]

### Skill Principles

- [ ] [填写：逐项列 S1–S8 的结论和证据]

**Result**：[填写：addressed count、clause count、pass/fail、blockers]

## 4. Governance Synchronization Matrix

| Governance surface | Actual files | Change / no change | Task IDs | Reason |
| --- | --- | --- | --- | --- |
| Project rules | [填写：路径 / N/A] | [填写：change / no change] | [填写：ID / N/A] | [填写：理由] |
| Workflow contracts | [填写：路径 / N/A] | [填写：change / no change] | [填写：ID / N/A] | [填写：理由] |
| Review contracts | [填写：路径 / N/A] | [填写：change / no change] | [填写：ID / N/A] | [填写：理由] |
| Schemas and events | [填写：路径 / N/A] | [填写：change / no change] | [填写：ID / N/A] | [填写：理由] |
| Runtime configuration | [填写：路径 / N/A] | [填写：change / no change] | [填写：ID / N/A] | [填写：理由] |
| Knowledge and docs | [填写：路径 / N/A] | [填写：change / no change] | [填写：ID / N/A] | [填写：理由] |
| Automation gates | [填写：路径 / N/A] | [填写：change / no change] | [填写：ID / N/A] | [填写：理由] |

每个标为 `change` 的行必须映射至少一个有效 Task ID；找不到 owning Task 就不能发布计划。

## 5. Technical Decisions

### DEC-001 — [填写：决策名称]

- **Problem**：[填写：真实问题]
- **Options**：[填写：方案 A / B / C]
- **Selected**：[填写：reuse / extend / new 及选择]
- **Reason**：[填写：为什么]
- **Consequence / risk**：[填写：代价和风险]
- **Fallback**：[填写：回退方式]
- **F10 real threat**：[填写：仅 Selected 为 new 时保留]
- **F10 existing cover**：[填写：仅 Selected 为 new 时保留]
- **F10 bypassable**：[填写：仅 Selected 为 new 时保留]
- **F10 maintenance cost**：[填写：仅 Selected 为 new 时保留]
- **F10 disposition**：[填写：仅 Selected 为 new 时保留；`keep` / `simplify` / `remove`]

## 6. Solution Design

### Overview

[填写：用 2–4 个短段落讲清完整技术链路和最小改动方式。]

### Module responsibilities

#### [填写：模块名称]

- **Responsibility**：[填写：单一职责]
- **Consumes**：[填写：准确接口或 schema]
- **Produces**：[填写：准确接口或 schema]
- **Must not decide**：[填写：权威边界]

### Conditional contracts

- **UI**：[填写：信息层级、状态、交互、响应式、可访问性 / N/A — 理由]
- **Externally maintained code**：[填写：文件、必要性、最小 hook、升级风险 / N/A — 理由]

## 7. Data Model and Lifecycle

[填写：字段、不变量、所有权、有效和无效状态转换；不涉及则写 N/A — 理由。]

## 8. API Contract

[填写：method、path、request、response、error、compatibility；不涉及则写 N/A — 理由。]

## 9. File Boundary

> 本节是各 `Phase.Files` 的派生并集，不能增加 Phase 未声明的文件。

### NEW

- `[填写：精确新增文件路径]`

### MODIFY

- `[填写：精确修改文件路径]`

### DO NOT TOUCH

- `[填写：精确保护文件路径]`

## 10. Data Flow and Integration

```text
[填写：producer] → [填写：validated contract] → [填写：consumer]
```

- **Existing modules / packages / services**：[填写：依赖及用途]
- **Integration points**：[填写：最小 hook 或调用点]
- **Compatibility boundaries**：[填写：必须保持的现有行为]
- **Fail-loud behavior**：[填写：无效输入或状态如何明确失败]

## 11. Code Anchors and Reuse

### Versioned identity and context projection

- **Spec binding**：`{"artifact_kind":"spec","ref":"[填写：spec ref]","hash":"[填写：真实 SHA-256]","id":"[填写：spec ID]"}`
- **read_now**：[填写：本阶段设计所需的最小锚点]
- **must_read_before_task**：[填写：执行具体任务前才需要的锚点]
- **Context mode**：[填写：Lite / Full / N/A — 工程理由]

### Verified anchors

| Anchor | Path and symbol | Current responsibility | Intended use | Forbidden change |
| --- | --- | --- | --- | --- |
| A-001 | `[填写：path:symbol]` | [填写：当前职责] | [填写：reuse / extend / reference] | [填写：保护边界] |

### Reuse → Extend → New

| Capability | Decision | Existing candidates | Reason |
| --- | --- | --- | --- |
| [填写：能力] | [填写：reuse / extend / new] | [填写：已核实锚点] | [填写：最小方案理由] |

### Existing interface signatures

| Signature ID | Object | Verified current signature/schema | Source anchor |
| --- | --- | --- | --- |
| SIG-001 | [填写：CLI / function / event / schema] | [填写：准确参数或字段] | [填写：Anchor ID] |

查不到现有接口或签名时，必须写入 `Unresolved facts` 并触发 STOP；不得猜测后继续。

## 12. Rollback and Recovery

- **Global recovery rule**：[填写：保留 accepted 产物，只恢复当前实现]
- **Irreversible boundaries**：[填写：需要明确授权的动作]
- **Recovery owner**：[填写：失败后由谁执行哪一步]

### Engineering Risk Handoff

- **PLAN-RISK-001**：[填写：风险主题]
  - **Affected IDs**：[填写：RISK、PFACT、FR、AC]
  - **Trigger**：[填写：何时发生]
  - **Consequence**：[填写：可观察后果]
  - **Mitigation or STOP**：[填写：最小缓解或停止条件]
  - **Handling Stage**：`build-plan` / `build-code` / `verify-code`
  - **Verification**：[填写：如何证明已处理或仍存在]

## 13. Test Strategy

> 行为改动先 RED 后 GREEN；两者使用相同 `gate_cmd` 和 oracle identity。

- **Target**：[填写：FR、AC 或 invariant]
- **gate_cmd**：[填写：已核实、可直接执行的最小命令]
- **expected_exit**：[填写：RED 为非零；GREEN 为 0]
- **evidence_path**：[填写：task-relative evidence 路径]
- **display_cmd**：[填写：可选，只供人读]
- **Oracle ID and result**：[填写：稳定 ID 和可观察信号]

## 14. Implementation Order

[填写：producer-before-consumer 顺序，以及必须串行的原因。]

## Phase 1：[填写：阶段名称]

### Goal

[填写：本 Phase 完成后可独立观察和验证的结果。]

### Files

- **NEW**：`[填写：精确路径]`
- **MODIFY**：`[填写：精确路径]`
- **DO NOT TOUCH**：`[填写：精确路径]`

### Tasks

- [填写：Task ID 和单行结果；详细任务卡只放 tasks.md]

### Verify

- [填写：第 13 节验证目标、gate 和 evidence ref]

### Knowledge

- [填写：已核实外部事实、签名或文档 / N/A — 理由]

### STOP

- [填写：必须返回设计、计划或用户授权的明确条件]

### Done

- [填写：行为、产物和证据]

### Risks and rollback

- **Risk**：[填写：风险]
- **Prevention**：[填写：预防]
- **Rollback / recovery**：[填写：最小可恢复动作]

> 每个 Phase 重复以上八段。Phase 名称和 Files 是 plan/tasks 的共同权威边界。

## 15. Dependencies and Parallelism

- [填写：Phase 依赖图；每个节点使用实际名称]
- [填写：并行分支为何输入和文件所有权独立]
- [填写：串行点的原因]

## 16. Requirement and Verification Traceability

| FR | Task IDs | AC IDs | Phase | Gate / evidence |
| --- | --- | --- | --- | --- |
| [填写：FR ID] | [填写：Task ID] | [填写：AC ID] | [填写：Phase] | [填写：Gate / evidence ref] |

发布前确认：每个 accepted FR 都有 Task 和 AC；每个 Task 反向引用有效 FR/AC；没有重复 ID、无效依赖、依赖环或 consumer-before-producer。

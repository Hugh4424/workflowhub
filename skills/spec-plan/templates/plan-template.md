# 实施计划：任务名称

- **Input**：受控命名产物 `spec.md`。
- **Status**：Draft、Accepted 或 Superseded。
- **Template version**：`plan-task.v3`

## 1. 速读卡

- **Goal**：说明完成后可观察到的行为变化。
- **Non-goals**：列出明确不做的事项，并标注 accepted spec 的来源。
- **Before**：记录当前已核实行为。
- **After**：记录目标行为。
- **Main risk**：说明最可能影响交付的风险。
- **Next step**：写首个可执行动作或 STOP。

## 2. Technical Context and Constraints

- **Language / runtime**：记录已核实版本。
- **Primary dependencies**：记录已有依赖；没有时写 `N/A — 具体理由`。
- **Storage / state**：记录数据和持久化边界。
- **Testing**：记录真实测试工具与低资源约束。
- **Target environment**：记录运行环境。
- **Project type**：记录项目性质。
- **Performance goals**：记录目标；不适用时说明理由。
- **Scale / scope**：记录预计文件、模块和数据范围。
- **Relevant ADR / context**：记录受控来源；没有时说明理由。
- **Unresolved facts**：记录缺失事实及 STOP；没有时说明理由。

### Global Constraints

- 逐条继承 accepted spec、宪法和受控上下文的红线，不改写含义。

## 3. Code Anchors and Reuse

### Versioned identity and context projection

- **Spec binding**：分别记录 `artifact_kind`、`ref`、SHA-256 `hash` 和稳定 `id`。
- **read_now**：记录本阶段设计所需的最小锚点。
- **must_read_before_task**：记录执行具体任务前才需要的锚点。
- **Context mode**：写 Lite、Full 或 `N/A — 工程理由`。

### Verified anchors

| Anchor | Path and symbol | Current responsibility | Intended use | Forbidden change |
| --- | --- | --- | --- | --- |
| A-001 | 写路径和符号 | 写当前职责 | 写 reuse、extend 或 reference | 写边界 |

### Reuse → Extend → New

| Capability | Decision | Existing candidates | Reason |
| --- | --- | --- | --- |
| 写能力 | 写 reuse、extend 或 new | 写已核实锚点 | 写为什么这是最小方案 |

选择 `new` 时，逐个说明已核实候选为什么不能 reuse 或 extend。

### Existing interface signatures

| Signature ID | Object | Verified current signature/schema | Source anchor |
| --- | --- | --- | --- |
| SIG-001 | 写 CLI、function、event 或 schema | 写准确参数或字段 | 写锚点 |

未知签名必须进入 `Unresolved facts` 并触发 STOP，不得猜测。

## 4. Solution Design

### Overview

用 2–4 个短段落说明完整技术链路和最小改动方式。

### Module responsibilities

#### 模块名称

- **Responsibility**：写单一职责。
- **Consumes**：写准确接口或 schema。
- **Produces**：写准确接口或 schema。
- **Must not decide**：写权威边界。

不涉及多模块职责时，本小节只写 `N/A — 具体理由`。

### Data, state, and schema contract

涉及数据时写字段、不变量、所有权、有效和无效状态转换；否则写 `N/A — 具体理由`。

### API contract

涉及 API 时写 method、path、request、response、error 和 compatibility；否则写 `N/A — 具体理由`。

### UI contract

涉及 UI 时写信息层级、状态、交互、响应式和可访问性；否则写 `N/A — 具体理由`。

### Externally maintained code contract

涉及外部维护代码时写文件、必要性、最小 hook、升级和合并风险；否则写 `N/A — 具体理由`。

### Data flow and integration

- **Flow**：按生产者 → 已验证合同 → 消费者说明数据流。
- **Dependencies**：列已有模块、包或服务及用途。
- **Integration points**：列最小 hook 或调用点。
- **Compatibility boundaries**：列必须保持不变的现有行为。
- **Fail-loud behavior**：说明无效输入或状态如何明确失败。

不涉及数据流或集成点时，本小节只写 `N/A — 具体理由`。

## 5. File Boundary

本节是各 `Phase.Files` 的派生并集，不能新增 Phase 未声明的文件。

### NEW

- 写精确新增文件路径。

### MODIFY

- 写精确修改文件路径。

### DO NOT TOUCH

- 写精确保护文件路径。

## 6. Technical Decisions

每个决策只写一次；只有 Selected 为 `new` 时保留 F10 四问。

### DEC-001 — 决策名称

- **Problem**：说明要解决的真实问题。
- **Options**：列 A、B、C。
- **Selected**：写选择。
- **Reason**：写为什么。
- **Consequence / risk**：写代价和风险。
- **Fallback**：写回退方式。
- **F10 real threat**：说明它避免的真实失败。
- **F10 existing cover**：说明已有机制覆盖什么。
- **F10 bypassable**：说明调用方能否绕过及后果。
- **F10 maintenance cost**：说明长期成本和最终 keep、simplify 或 remove 决定。

## 7. Test Strategy

- 行为改动先记录实现前 RED，再记录实现后 GREEN。
- RED 与 GREEN 使用相同行为 `gate_cmd` 和 oracle identity。
- 只运行能证明目标的最小真实命令；兼容回归必须绑定具体风险。
- `display_cmd` 只做摘要，不参与 pass/fail。

每个验证目标写清：

- **Target**：FR、AC 或 invariant。
- **gate_cmd**：已核实可执行命令。
- **expected_exit**：RED 为非零；GREEN 为 0。
- **evidence_path**：task-relative evidence 路径。
- **display_cmd**：可选，仅供人读。
- **Oracle ID and result**：稳定 oracle ID 与成功或预期失败信号。

## 8. Rollback and Recovery

- **Global recovery rule**：保留 accepted 产物，只恢复当前实现。
- **Irreversible boundaries**：列需要明确用户授权的动作。
- **Recovery owner**：写失败后由谁执行哪一步。

### Engineering Risk Handoff

- **PLAN-RISK-001**：写工程风险主题。
  - **Affected IDs**：列 RISK、PFACT、FR 或 AC ID。
  - **Trigger**：写何时发生。
  - **Consequence**：写可观察后果。
  - **Mitigation or STOP**：写最小缓解或停止条件。
  - **Handling Stage**：写 `build-plan`、`build-code` 或 `verify-code`。
  - **Verification**：写如何证明风险已处理或仍存在。

## 9. Implementation Order

说明 producer-before-consumer 顺序，以及每个串行点的原因。

## Phase 1：阶段名称

### Goal

写本 Phase 完成后可独立观察和验证的结果。

### Files

- **NEW**：写精确路径。
- **MODIFY**：写精确路径。
- **DO NOT TOUCH**：写精确路径。

### Tasks

按依赖顺序列 Task ID 和单行结果；详细任务卡只放在 `tasks.md`。

### Verify

引用第 7 节的验证目标，写清本 Phase 的目标和证据。

### Knowledge

列已核实外部事实、签名或文档；没有时写 `N/A — 具体理由`。

### STOP

列必须返回设计、计划或用户授权的明确条件。

### Done

列所需行为、产物和证据。

### Risks and rollback

- **Risk**：写风险。
- **Prevention**：写预防。
- **Rollback / recovery**：写最小可恢复动作。

每个 Phase 重复以上八段，不保留空标题。

## 10. Dependencies and Parallelism

- 画出 Phase 依赖图；每个节点使用实际 Phase 名称。
- 为每个并行分支说明输入和文件所有权为何独立。
- 为每个串行点说明原因。

## 11. Requirement and Verification Traceability

| FR | Task IDs | AC IDs | Phase | Gate / evidence |
| --- | --- | --- | --- | --- |
| 写已接受 FR ID | 写 Task ID | 写 AC ID | 写 Phase 名称 | 写 gate 和 evidence ref |

检查每个 accepted FR 有 Task 和 AC，每个 Task 反向指向有效 FR/AC，且没有重复 ID、无效依赖或 consumer-before-producer。

## 12. Governance Synchronization Matrix

| Governance surface | Actual files | Change / no change | Task IDs | Reason |
| --- | --- | --- | --- | --- |
| Project rules | 写路径或 N/A | 写 change 或 no change | 写 ID 或 N/A | 写理由 |
| Workflow contracts | 写路径或 N/A | 写 change 或 no change | 写 ID 或 N/A | 写理由 |
| Review contracts | 写路径或 N/A | 写 change 或 no change | 写 ID 或 N/A | 写理由 |
| Schemas and events | 写路径或 N/A | 写 change 或 no change | 写 ID 或 N/A | 写理由 |
| Runtime configuration | 写路径或 N/A | 写 change 或 no change | 写 ID 或 N/A | 写理由 |
| Knowledge and docs | 写路径或 N/A | 写 change 或 no change | 写 ID 或 N/A | 写理由 |
| Automation gates | 写路径或 N/A | 写 change 或 no change | 写 ID 或 N/A | 写理由 |

每个 `change` 行必须映射至少一个 Task。

## Appendix A. Constitution Check

- **Constitution binding**：`{"artifact_kind":"constitution","ref":"constitution-checklist.md","hash":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","id":"CONSTITUTION","version":"1","clause_count":21}`

生成时将这一个 inline JSON 替换为当前宪法的真实 `ref`、SHA-256 `hash`、稳定 `id`、`version` 和 `clause_count`；不得改成自然语言说明。

### Framework Principles

- [ ] 写 F 条款 ID、标题和本任务证据或理由。

### Quality Principles

- [ ] 写 Q 条款 ID、标题和本任务证据或理由。

### Skill Principles

- [ ] 写 S 条款 ID、标题和本任务证据或理由。

**Result**：写 addressed count、current clause count、pass/fail 和 blockers。

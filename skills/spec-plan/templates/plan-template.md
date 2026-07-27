# 实施计划：{task-name}

- **Input**：受控命名产物 `spec.md`
- **Status**：Draft
- **Template version**：`plan-task.v3`

<!-- 生成时替换所有花括号内容并删除全部说明注释、空标题和空表。 -->

## 1. 速读卡

- **Goal**：{做完后，用户或系统能观察到什么变化}
- **Non-goals**：{明确不做什么}。来源：{accepted spec section or ID}
- **Before**：{当前已核实行为}
- **After**：{目标行为}
- **Main risk**：{最可能影响交付的风险}
- **Next step**：{首个可执行动作或 STOP}

## 2. Technical Context and Constraints

- **Language / runtime**：{已核实版本}
- **Primary dependencies**：{已有依赖；无则 `N/A — 具体理由`}
- **Storage / state**：{数据与持久化边界}
- **Testing**：{真实测试工具与低资源约束}
- **Target environment**：{运行环境}
- **Project type**：{项目性质}
- **Performance goals**：{目标；不适用时说明理由}
- **Scale / scope**：{预计文件、模块和数据范围}
- **Relevant ADR / context**：{受控来源；无则说明理由}
- **Unresolved facts**：{缺失事实及 STOP；无则说明理由}

### Global Constraints

- {从 accepted spec、宪法和受控上下文继承，不改写含义}

## 3. Code Anchors and Reuse

### Versioned identity and context projection

- **Spec binding**：`{"artifact_kind":"spec","ref":"{accepted ref}","hash":"{sha256}","id":"{spec ID}"}`
- **read_now**：{本阶段设计所需的最小锚点}
- **must_read_before_task**：{执行具体任务前才需要的锚点}
- **Context mode**：{Lite / Full / N/A — 工程理由}

### Verified anchors

| Anchor | Path and symbol | Current responsibility | Intended use | Forbidden change |
|---|---|---|---|---|
| A-001 | `{path}:{symbol}` | {当前职责} | {reuse/extend/reference} | {边界} |

### Reuse → Extend → New

| Capability | Decision | Existing candidates | Reason |
|---|---|---|---|
| {能力} | {reuse/extend/new} | {anchors} | {为什么最小} |

<!-- 选择 new 时，必须解释每个已核实候选为什么不能 reuse/extend。 -->

### Existing interface signatures

| Signature ID | Object | Verified current signature/schema | Source anchor |
|---|---|---|---|
| SIG-001 | {CLI/function/event/schema} | {准确参数或字段} | {anchor} |

未知签名必须进入 `Unresolved facts` 并触发 STOP，不得猜测。

## 4. Solution Design

### Overview

{用 2–4 个短段落说明完整技术链路和最小改动方式}

### Module responsibilities

<!-- 不涉及多模块职责时，本小节只写 `N/A — 具体理由`。 -->

#### {module}

- **Responsibility**：{单一职责}
- **Consumes**：{准确接口/schema}
- **Produces**：{准确接口/schema}
- **Must not decide**：{权威边界}

### Data, state, and schema contract

{涉及数据时列字段、不变量、所有权、有效和无效状态转换；否则写 `N/A — 具体理由`}

### API contract

{涉及 API 时列 method/path/request/response/error/compatibility；否则写 `N/A — 具体理由`}

### UI contract

{涉及 UI 时列信息层级、状态、交互、响应式和可访问性；否则写 `N/A — 具体理由`}

### Externally maintained code contract

{涉及外部维护代码时列文件、必要性、最小 hook、升级/合并风险；否则写 `N/A — 具体理由`}

### Data flow and integration

<!-- 不涉及数据流或集成点时，本小节只写 `N/A — 具体理由`，删除示例图和字段。 -->

```text
{producer} → {validated contract} → {consumer}
```

- **Dependencies**：{已有模块、包或服务及用途}
- **Integration points**：{最小 hook 或调用点}
- **Compatibility boundaries**：{必须保持不变的现有行为}
- **Fail-loud behavior**：{无效输入或状态如何明确失败}

## 5. File Boundary

> 本节是各 `Phase.Files` 的派生并集，不能新增 Phase 未声明的文件。

### NEW

- `{exact/file/path}`

### MODIFY

- `{exact/file/path}`

### DO NOT TOUCH

- `{exact/protected/path}`

## 6. Technical Decisions

每个决策只写一次；仅 `Selected` 为 `new` 时保留并回答 F10 四问，否则删除四项。

### DEC-001 — {decision}

- **Problem**：{要解决的真实问题}
- **Options**：{A / B / C}
- **Selected**：{选择}
- **Reason**：{为什么}
- **Consequence / risk**：{代价和风险}
- **Fallback**：{回退方式}
- **F10 real threat**：{防止什么真实失败}
- **F10 existing cover**：{已有机制覆盖什么}
- **F10 bypassable**：{调用方能否绕过及后果}
- **F10 maintenance cost**：{长期成本；最终 keep/simplify/remove}

## 7. Test Strategy

- 行为改动先记录实现前 RED，再记录实现后 GREEN。
- RED 与 GREEN 使用相同行为 `gate_cmd` 和 oracle identity。
- 只运行能证明目标的最小真实命令；兼容回归必须绑定具体风险。
- `display_cmd` 只做摘要，不参与 pass/fail。

验证目标格式：

- **Target**：{FR / AC / invariant}
- **gate_cmd**：`{verified executable command}`
- **expected_exit**：{RED 为非零；GREEN 为 0}
- **evidence_path**：`apply/evidence/{stable-name}`
- **display_cmd**：`{可选，仅供人读}`
- **Oracle ID and result**：{稳定 oracle ID；成功或预期失败信号}

## 8. Rollback and Recovery

- **Global recovery rule**：{保留 accepted 产物，只恢复当前实现}
- **Irreversible boundaries**：{需要明确用户授权的动作}
- **Recovery owner**：{失败后由谁执行哪一步}

### Engineering Risk Handoff

<!-- 不复制 PFACT prose；引用 accepted RISK/PFACT/FR/AC 身份并补工程处置。 -->

- **PLAN-RISK-001**：{工程风险主题}
  - **Affected IDs**：{RISK/PFACT/FR/AC IDs}
  - **Trigger**：{何时发生}
  - **Consequence**：{可观察后果}
  - **Mitigation or STOP**：{最小缓解或停止条件}
  - **Handling Stage**：{build-plan|build-code|verify-code}
  - **Verification**：{如何证明风险已处理或仍存在}

## 9. Implementation Order

{说明 producer-before-consumer 顺序，以及每个串行点的原因}

## Phase 1：{phase-name}

### Goal

{本 Phase 完成后可独立观察和验证的结果}

### Files

- **NEW**：`{exact path}`
- **MODIFY**：`{exact path}`
- **DO NOT TOUCH**：`{exact path}`

### Tasks

{按依赖排序的 Task IDs 和单行结果}

### Verify

{一个或多个 Section 7 格式的验证目标}

### Knowledge

{已核实外部事实、签名或文档；无则 `N/A — 具体理由`}

### STOP

{必须返回设计、计划或用户授权的明确条件}

### Done

{所需行为、产物和证据}

### Risks and rollback

- **Risk**：{风险}
- **Prevention**：{预防}
- **Rollback / recovery**：{最小可恢复动作}

<!-- 每个 Phase 完整重复以上八段；不得保留空标题。 -->

## 10. Dependencies and Parallelism

```text
Phase 1 → Phase 2
Phase 1 → Phase 3
Phase 2 + Phase 3 → Phase 4
```

- {每个并行分支为何输入和文件所有权独立}
- {串行点及理由}

## 11. Requirement and Verification Traceability

| FR | Task IDs | AC IDs | Phase | Gate / evidence |
|---|---|---|---|---|
| {FR-ID} | {T-IDs} | {AC-IDs} | {Phase} | {gate and evidence ref} |

检查：每个 accepted FR 有 Task 和 AC；每个 Task 反向指向有效 FR/AC；
没有重复 ID、无效依赖、环或 consumer-before-producer。

## 12. Governance Synchronization Matrix

| Governance surface | Actual files | Change / no change | Task IDs | Reason |
|---|---|---|---|---|
| Project rules | {paths or N/A} | {change/no change} | {IDs or N/A} | {reason} |
| Workflow contracts | {paths or N/A} | {change/no change} | {IDs or N/A} | {reason} |
| Review contracts | {paths or N/A} | {change/no change} | {IDs or N/A} | {reason} |
| Schemas and events | {paths or N/A} | {change/no change} | {IDs or N/A} | {reason} |
| Runtime configuration | {paths or N/A} | {change/no change} | {IDs or N/A} | {reason} |
| Knowledge and docs | {paths or N/A} | {change/no change} | {IDs or N/A} | {reason} |
| Automation gates | {paths or N/A} | {change/no change} | {IDs or N/A} | {reason} |

每个 `change` 行必须映射至少一个 Task。

## Appendix A. Constitution Check

- **Constitution binding**：`{"artifact_kind":"constitution","ref":"{checklist ref}","hash":"{sha256}","id":"{stable ID}","version":"{version}","clause_count":21}`

### Framework Principles

- [ ] **{F clause ID and title}** — {本任务证据或理由}

### Quality Principles

- [ ] **{Q clause ID and title}** — {本任务证据或理由}

### Skill Principles

- [ ] **{S clause ID and title}** — {本任务证据或理由}

**Result**：{addressed count}/{current clause count}; {pass/fail and blockers}

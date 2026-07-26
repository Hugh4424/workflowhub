# 实施计划：{task-name}

**Input**：受控命名产物 `spec.md`
**Status**：Draft

> 生成时替换所有花括号内容并删除说明注释。不得保留空标题或无理由 `None`。

## Summary

### Goal

{做完后能观察到的结果}

### Non-goals

- {明确不做；说明版本或永久边界}

### Before → After

- Before：{当前真实行为}
- After：{目标行为}

## Technical Context

- **Language / runtime**：{已核实版本}
- **Primary dependencies**：{已有依赖；无则说明理由}
- **Storage / state**：{数据与持久化边界}
- **Testing**：{本仓库真实测试工具与低资源约束}
- **Target environment**：{运行环境}
- **Project type**：{项目性质}
- **Performance goals**：{目标；不适用时说明理由}
- **Constraints**：{技术与范围红线}
- **Scale / scope**：{预计文件和模块范围}
- **Relevant ADR / context**：{受控来源；无则说明理由}
- **Unresolved facts**：{缺失事实及 STOP 条件；无则说明理由}

## Global Constraints

- {从 accepted spec、宪法和受控上下文逐条继承，不改写含义}

## Governance Synchronization Matrix

| Governance surface | Actual files | Change / no change | Task IDs | Reason |
|---|---|---|---|---|
| Project rules | {paths or None} | {change/no change} | {IDs or None} | {reason} |
| Workflow contracts | {paths or None} | {change/no change} | {IDs or None} | {reason} |
| Review contracts | {paths or None} | {change/no change} | {IDs or None} | {reason} |
| Schemas and events | {paths or None} | {change/no change} | {IDs or None} | {reason} |
| Runtime configuration | {paths or None} | {change/no change} | {IDs or None} | {reason} |
| Knowledge and docs | {paths or None} | {change/no change} | {IDs or None} | {reason} |
| Automation gates | {paths or None} | {change/no change} | {IDs or None} | {reason} |

Every changed row must map to at least one task. Categories may be extended when
the accepted task has another real governance surface.

## Code Anchors and Reuse Decisions

### Verified anchors

| Anchor | Path and symbol | Current responsibility | Intended use | Forbidden change |
|---|---|---|---|---|
| A-001 | `{path}:{symbol}` | {current behavior} | {reuse/extend/reference} | {boundary} |

### Reuse → Extend → New

| Capability | Decision | Existing candidates | Reason |
|---|---|---|---|
| {capability} | {reuse/extend/new} | {anchors} | {why this is smallest} |

Selecting `new` requires an explicit reason every verified anchor is unsuitable.

### Existing interface signatures

| Signature ID | Object | Verified current signature/schema | Source anchor |
|---|---|---|---|
| SIG-001 | {CLI/function/event/schema} | {exact parameters or fields} | {anchor} |

Unknown signatures are blockers, not implementation guesses.

## Modules, Interfaces, and Data Contracts

### Module responsibilities

#### {module}

- **Responsibility**：{one responsibility}
- **Consumes**：{exact interface/schema}
- **Produces**：{exact interface/schema}
- **Must not decide**：{authority boundary}

### Schemas and data model

- **{schema/entity}**：{fields, invariants, ownership}

### State transitions

```text
{state} → {state} → {state}
```

List invalid transitions and their fail-loud behavior.

### Data flow and integration points

```text
{producer} → {validated contract} → {consumer}
```

- **Dependencies**：{existing modules/packages/services and purpose}
- **Integration points**：{minimal hook or call site}
- **Compatibility boundaries**：{existing behavior that must remain unchanged}

## Project Structure

### NEW

```text
{exact/file/path}
```

### MODIFY

```text
{exact/file/path}
```

### DO NOT TOUCH

```text
{exact/protected/path}
```

## Complexity Trade-offs

| Decision | Options considered | Selected option | Reason | Consequence / risk |
|---|---|---|---|---|
| {decision} | {A/B/C} | {choice} | {reason} | {trade-off} |

## F10 Anti-Over-Engineering Gate

For every new mechanism answer:

- **Real threat / 真实威胁**：What real failure does it prevent?
- **Existing cover / 已有覆盖**：Which existing mechanism already overlaps?
- **Bypassable / 可绕过**：Can callers bypass it?
- **Maintenance cost / 长期维护成本**：What is its long-term maintenance cost?
- Keep, simplify, or remove?

## Test Strategy

- Use the narrowest real command that proves each Phase.
- Every behavior change records implementation-before RED and implementation-after GREEN.
- Add compatibility regression only for named affected behavior.
- A display command may summarize output but never decides pass/fail.

Verification target format:

- **Target**：{FR / AC / invariant}
- **gate_cmd**：`{verified executable command}`
- **expected_exit**：{0 or non-zero}
- **evidence_path**：`apply/evidence/{stable-name}`
- **display_cmd**：`{optional human-readable summary command}`
- **Oracle**：{observable success or intended RED failure}

## Rollback and Recovery

- **Global recovery rule**：{how to preserve accepted artifacts and recover only the current implementation}
- **Irreversible boundaries**：{what requires explicit user authority}

## Implementation Order

{Describe producer-before-consumer order and the reason for every serialization point.}

## Implementation Steps

## Phase 1：{phase-name}

### Goal

{independently observable completion}

### Files

- NEW：`{exact path}`
- MODIFY：`{exact path}`
- DO NOT TOUCH：`{exact path}`

### Tasks

{ordered task IDs and one-line outcomes}

### Verify

{one or more verification targets using the format in Section 9}

### Knowledge

{verified external facts, signatures, or documents used; if none, explain why}

### STOP

{conditions requiring a return to planning or user authority}

### Done

{concrete artifacts, behavior, and evidence required}

### Risks and rollback

- **Risk**：{risk}
- **Prevention**：{preventive measure}
- **Rollback / recovery**：{smallest recoverable action}

> Repeat the complete eight-section Phase block for every Phase. Never use an
> empty heading or unexplained `None`.

## Dependencies and Parallelism

```text
Phase 1 → Phase 2
Phase 1 → Phase 3
Phase 2 + Phase 3 → Phase 4
```

- {why each parallel branch has independent dependencies and files}
- {serialization points and reasons}

## FR to AC to Step Traceability

| FR | Task IDs | AC IDs | Phase | Verification evidence |
|---|---|---|---|---|
| {FR-ID} | {T-IDs} | {AC-IDs} | {Phase} | {planned evidence ref} |

Checks:

- every accepted FR maps to at least one task and AC;
- every task maps back to valid FR and AC IDs;
- no duplicate IDs, invalid dependencies, cycles, or consumer-before-producer order.

## Verification Mapping

| Step | FR IDs | AC IDs | Exact gate evidence |
|---|---|---|---|
| {Step / task IDs} | {FR IDs} | {AC IDs} | {planned evidence refs} |

## Constitution Check

Copy every current constitution clause from the supplied checklist and explain
how this plan satisfies it. Do not hard-code a constitution from another
project.

### Framework Principles

- [ ] **{F clause ID and title}** — {task-specific evidence or reason}

### Quality Principles

- [ ] **{Q clause ID and title}** — {task-specific evidence or reason}

### Skill Principles

- [ ] **{S clause ID and title}** — {task-specific evidence or reason}

**Result**：{addressed count}/{current clause count}; {pass/fail and blockers}

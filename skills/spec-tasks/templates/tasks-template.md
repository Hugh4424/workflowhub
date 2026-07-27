# Tasks：{task-name}

**Input**：受控命名产物 `spec.md`、`plan.md`
**Status**：Draft

> 生成时替换花括号内容并删除说明注释。任务按依赖排序，不按文件类型堆叠。
> `[P]` 表示输入和文件所有权都独立、可真实并行；仅名称不同不算并行。
> 每个 task 的 `FR:` / `FR` 字段必须映射 accepted FR，并同时列出 AC。

## Global Constraints

- {从 accepted plan 原样继承范围、依赖、命名、兼容性和测试红线}
- 行为改动必须先有真实 RED，再做 GREEN。
- 命令必须可执行；display 输出不能充当判定结果。
- 文件必须是精确路径，不使用通配符。

## Phase 1：{phase-name}

### Goal

{本 Phase 完成后可独立观察和验证的行为}

### Files

- **NEW**：`{exact path}`
- **MODIFY**：`{exact path}`
- **DO NOT TOUCH**：`{exact protected path}`

### Tasks

#### T001 — {short action title}

- **ID**：T001
- **动作**：{单一、可执行动作；行为改动的首项是 RED}
- **精确文件**：`{exact path}`、`{exact path}`
- **输入**：{accepted artifact section, anchor, prior task output}
- **输出**：{artifact, behavior, or evidence}
- **依赖**：{earlier task IDs or `None — first task in this Phase`}
- **并行**：{是/否；说明文件和输入为何独立}
- **FR**：{valid FR IDs}
- **AC**：{valid AC IDs}
- **gate_cmd**：`{verified executable command}`
- **expected_exit**：{0 or non-zero}
- **oracle**：{可观察的成功或预期失败信号}
- **evidence_path**：`apply/evidence/{stable-name}.stdout`、`apply/evidence/{stable-name}.stderr`

#### T002 — {short action title}

- **ID**：T002
- **动作**：{使 T001 的同一行为 oracle 变绿}
- **精确文件**：`{exact path}`
- **输入**：T001 RED fixture 和 {accepted anchors}
- **输出**：{GREEN behavior}
- **依赖**：T001
- **并行**：否；消费 T001 输出
- **FR**：{valid FR IDs}
- **AC**：{valid AC IDs}
- **gate_cmd**：`{same narrow behavioral command}`
- **expected_exit**：0
- **oracle**：{正例通过，反例仍失败}
- **evidence_path**：`apply/evidence/{stable-name}.stdout`

> Repeat the complete 13-field block for every task. A field may say `None`
> only with a task-specific reason.

### Verify

- **Target**：{FR / AC / invariant}
- **gate_cmd**：`{verified executable command}`
- **expected_exit**：{0 or non-zero}
- **evidence_path**：`apply/evidence/{stable-name}`
- **display_cmd**：`{optional summary-only command}`
- **Oracle**：{observable result}

### Knowledge

- {verified interface, source, or repository fact used by this Phase}
- {if none: `None — deterministic local contract; no external fact is needed`}

### STOP

- {RED cannot be reproduced}
- {GREEN would require weakening the accepted test}
- {an undeclared file, dependency, interface, or architecture choice is required}
- {an irreversible or user-authority decision appears}

### Done

- {exact behavior and artifacts}
- {RED/GREEN evidence and remaining boundary}

### Risks and rollback

- **Risk**：{risk}
- **Prevention**：{prevention}
- **Rollback / recovery**：{smallest recoverable action}

> Repeat the full Phase block for each accepted plan Phase.

### Phase naming examples

按实际 plan 命名，不强制凑阶段；常见结构可写为 `## Phase 1: Setup`、
`## Phase 2: Foundational`、`## Phase 3: User Story`，最后按需使用
`Polish / Cross-Cutting`。这些只是命名示例，不能替代完整八段或制造空阶段。

## Dependency Graph

```text
T001 → T002
T001 → T003
T002 + T003 → T004
```

- Parallel tasks must have independent inputs and file ownership.
- Every dependency exists, is ordered before its consumer, and the graph is acyclic.

## Bidirectional FR / Task / AC Traceability

| FR | Task IDs | AC IDs | Phase | Gate evidence |
|---|---|---|---|---|
| {FR-ID} | {T-IDs} | {AC-IDs} | {Phase} | {evidence refs} |

Checks:

- every accepted FR appears at least once;
- every task references valid FR and AC IDs;
- every AC claimed by the plan has an implementing task;
- there are no orphan requirements, tasks, acceptance criteria, or duplicate IDs.

## Final Boundary Check

- [ ] Every Phase has Goal/Files/Tasks/Verify/Knowledge/STOP/Done/Risks and rollback.
- [ ] Every task has all 13 fields.
- [ ] Every behavior change has RED before GREEN.
- [ ] Every gate is an executable narrow command with an explicit oracle.
- [ ] The DAG and FR/task/AC mappings are complete.
- [ ] No host identity, fixed artifact root, unrelated project rule, or undeclared file entered the tasks.

## Imported Stage syntax compatibility

历史输入若使用 `## Stage N` 和 `(stage:N, depends:T001,T002)`，导入器只能把它正规化为
上面的 Phase、13 字段和 DAG；新模板不靠 Stage 注解表达身份，也不得保留两套依赖真相。

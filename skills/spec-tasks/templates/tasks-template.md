# Tasks：{task-name}

- **Input**：受控命名产物 `spec.md`、`plan.md`
- **Status**：Draft
- **Template version**：`plan-task.v3`

<!-- 生成时替换花括号并删除全部说明注释、空标题和空表。 -->

## 1. 执行摘要

- **Goal**：{全部任务完成后可观察的结果}
- **Main boundary**：{最重要的允许改动和禁止改动}
- **Main risk**：{最可能导致 STOP 的风险}
- **First executable task**：{T-ID}

## 2. Global Constraints

- {绑定 accepted plan 的范围、依赖、命名、兼容性和测试红线，不复制长篇正文}
- 行为改动必须先有真实 RED，再做 GREEN。
- `display_cmd` 不能充当判定结果。
- 文件只使用精确路径，不使用通配符。

## Phase 1：{phase-name}

### Goal

{从 accepted plan 原样复制}

### Files

- **NEW**：`{exact path}`
- **MODIFY**：`{exact path}`
- **DO NOT TOUCH**：`{exact protected path}`

<!-- Phase 名称和以上 Files block 必须与 accepted plan 逐字一致。 -->

### Tasks

#### T001 — {short RED title}

##### T001 身份

- **ID**：T001
- **Phase**：Phase 1：{phase-name}
- **goal**：{一个可观察任务目标}
- **design_state**：ready

##### T001 追溯

- **versioned_refs**：`[{"artifact_kind":"spec","ref":"{ref}","hash":"{sha256}","id":"{FR/PFACT/AC ID}"},{"artifact_kind":"plan","ref":"{ref}","hash":"{sha256}","id":"{plan section ID}"}]`
- **输入**：{accepted artifact section, anchor, prior task output}
- **依赖**：N/A — first task
- **并行**：否 — {输入或文件依赖理由}
- **FR**：{valid FR IDs}
- **AC**：{valid AC IDs}

##### T001 执行

- **动作**：{只写一个行为变化；本任务创建真实 RED}
- **精确文件**：`{exact path}`
- **boundary**：files: `{exact path}`; symbols/regions: {仅允许修改的符号或区域}
- **输出**：{RED fixture 或证据}
- **Knowledge**：{最小已核实上下文；无则 `N/A — 具体理由`}

##### T001 验证与失败

- **verification_role**：RED
- **paired_task**：T002
- **gate_cmd**：`{verified executable behavioral command}`
- **expected_exit**：{non-zero integer}
- **oracle**：{ORACLE-ID — 哪条断言失败、应出现什么输出特征}
- **evidence_path**：`apply/evidence/{stable-name}.stdout`、`apply/evidence/{stable-name}.stderr`
- **STOP**：{命令不可执行、失败原因不符合 oracle 或需要越界时停止}
- **recovery**：{恢复负责人和最小恢复动作}
- **task risk**：{具体风险}

#### T002 — {short GREEN title}

##### T002 身份

- **ID**：T002
- **Phase**：Phase 1：{phase-name}
- **goal**：{让 T001 的同一行为 oracle 转绿}
- **design_state**：ready

##### T002 追溯

- **versioned_refs**：`[{"artifact_kind":"spec","ref":"{ref}","hash":"{sha256}","id":"{FR/PFACT/AC ID}"},{"artifact_kind":"plan","ref":"{ref}","hash":"{sha256}","id":"{plan section ID}"}]`
- **输入**：T001 RED fixture 和 {accepted anchors}
- **依赖**：T001
- **并行**：否 — 消费 T001 输出
- **FR**：{与 T001 相同的 FR IDs}
- **AC**：{与 T001 相同的 AC IDs}

##### T002 执行

- **动作**：{一个实现行为}
- **精确文件**：`{exact path}`
- **boundary**：files: `{exact path}`; symbols/regions: {仅允许修改的符号或区域}
- **输出**：{GREEN behavior}
- **Knowledge**：{最小已核实上下文}

##### T002 验证与失败

- **verification_role**：GREEN
- **paired_task**：T001
- **gate_cmd**：`{与 T001 逐字相同的命令}`
- **expected_exit**：0
- **oracle**：{与 T001 相同 ORACLE-ID — 正例通过，指定反例仍失败}
- **evidence_path**：`apply/evidence/{stable-name}.stdout`、`apply/evidence/{stable-name}.stderr`
- **STOP**：{需要弱化 RED、越界或引入未声明设计时停止}
- **recovery**：{恢复负责人和最小恢复动作}
- **task risk**：{具体风险}

<!-- 每个任务只保留这一份四组任务卡；一个任务最多一个行为变化。 -->
<!--
纯文档等非行为任务可写：
verification_role: N/A — non-behavior change: 具体理由
paired_task: N/A — 无 RED/GREEN 配对的具体理由
expected_exit: 0
仍须提供真实 gate_cmd、oracle 和 evidence_path。
-->

### Verify

- **Target**：{FR / AC / invariant}
- **gate_cmd**：`{verified executable command}`
- **expected_exit**：{0 or non-zero}
- **evidence_path**：`apply/evidence/{stable-name}`
- **display_cmd**：`{可选，仅供人读}`
- **Oracle**：{observable result}

### Knowledge

{本 Phase 使用的已核实接口、来源或仓库事实；无则 `N/A — 具体理由`}

### STOP

- RED 无法按预期复现。
- GREEN 需要删除或弱化 accepted test。
- 需要 Phase.Files 之外的文件、未声明依赖、未知接口或新架构决策。
- 出现不可逆或需要用户授权的动作。

### Done

- {准确行为和产物}
- {RED/GREEN 证据和剩余边界}

### Risks and rollback

- **Risk**：{风险}
- **Prevention**：{预防}
- **Rollback / recovery**：{最小可恢复动作}

<!-- 每个 accepted plan Phase 完整重复以上八段。 -->

## 3. Dependency Graph

```text
T001 → T002
T001 → T003
T002 + T003 → T004
```

- 每个依赖在消费者之前存在。
- `[P]` 任务的输入和文件所有权必须独立。
- 图必须无环。

## 4. Requirement and Verification Traceability

| FR | Task IDs | AC IDs | Phase | Gate / evidence |
|---|---|---|---|---|
| {FR-ID} | {T-IDs} | {AC-IDs} | {Phase} | {gate and evidence refs} |

检查：每个 accepted FR、AC 和 Task 双向闭合；没有孤儿或重复 ID。

## 5. Final Boundary Check

- [ ] 每个 Phase 有 Goal/Files/Tasks/Verify/Knowledge/STOP/Done/Risks and rollback。
- [ ] 每个 Task 只有一张四组权威任务卡，且字段完整。
- [ ] 每个行为变化有使用相同命令和 oracle identity 的 RED → GREEN。
- [ ] 每个 gate 是可执行的最小命令，退出码和证据明确。
- [ ] DAG 与 FR/Task/AC/gate 映射完整。
- [ ] Tasks Phase.Files 与 Plan Phase.Files 逐字一致。
- [ ] Plan File Boundary 等于所有 Phase NEW/MODIFY 的并集。
- [ ] 每个 Phase NEW/MODIFY 文件至少有一个 owning Task。
- [ ] Task files/boundary 是 Phase NEW/MODIFY 的子集。
- [ ] 没有 host identity、固定 artifact root、无关项目规则或未声明文件。

## Appendix A. Legacy import

旧 `## Stage N` 和 `(stage:N, depends:T001,T002)` 仅允许只读导入。导入器必须
一次性正规化为当前 Phase、唯一任务卡和 DAG 后再验证；新产物不得保留两套依赖真相。

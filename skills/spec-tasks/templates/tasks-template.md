# Tasks：任务名称

- **Input**：受控命名产物 `spec.md` 和 `plan.md`。
- **Status**：Draft、Accepted 或 Superseded。
- **Template version**：`plan-task.v3`

## 1. 执行摘要

- **Goal**：写全部任务完成后可观察的结果。
- **Main boundary**：写最重要的允许改动和禁止改动。
- **Main risk**：写最可能导致 STOP 的风险。
- **First executable task**：写首个可执行 T-ID。

## 2. Global Constraints

- 绑定 accepted plan 的范围、依赖、命名、兼容性和测试红线；不复制其长篇理由。
- 行为改动必须先有真实 RED，再做 GREEN。
- `display_cmd` 不能充当判定结果。
- 文件只使用精确路径，不使用通配符。

## Phase 1：阶段名称

### Goal

从 accepted plan 原样复制本 Phase 的可观察目标。

### Files

- **NEW**：从 accepted plan 原样复制精确路径。
- **MODIFY**：从 accepted plan 原样复制精确路径。
- **DO NOT TOUCH**：从 accepted plan 原样复制精确路径。

Phase 名称和上述 Files 区块必须与 accepted plan 逐字一致。

### Tasks

#### T001 — 任务短标题

##### T001 身份

- **ID**：T001。
- **Phase**：写所属 Phase 名称。
- **goal**：写一个可观察任务目标。
- **design_state**：写 `ready` 或 `blocked-by-design`。

##### T001 追溯

- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","id":"FR-DEMO-001"}]`

生成时替换为当前 accepted artifact 的非空 JSON array；每项必须保留 `artifact_kind`、`ref`、SHA-256 `hash` 和稳定 `id`。

- **输入**：写 accepted artifact section、anchor 或 prior task output。
- **依赖**：写前置 Task ID；首个任务写 `N/A — first task`。
- **并行**：写是或否，并说明输入和文件所有权理由。
- **FR**：列有效 FR ID。
- **AC**：列有效 AC ID。

##### T001 执行

- **动作**：只写一个行为变化，或明确的非行为产物变化。
- **精确文件**：列精确路径。
- **boundary**：列 files 和允许修改的 symbols 或 regions。
- **输出**：写可交付的产物或行为结果。
- **Knowledge**：写最小已核实上下文；没有时写 `N/A — 具体理由`。

##### T001 验证与失败

- **verification_role**：行为变化写 RED 或 GREEN；非行为变化写 `N/A — non-behavior change: 具体理由`。
- **paired_task**：写配对 Task ID；非行为变化写 `N/A — 具体理由`。
- **gate_cmd**：写已核实可执行命令。
- **expected_exit**：RED 写明确非零整数，GREEN 和非行为变化写 0。
- **oracle**：写稳定 ORACLE-ID、可观察结果和必要的负例。
- **evidence_path**：写 task-relative stdout、stderr 或结果路径。
- **STOP**：写命令不可执行、oracle 不符、越界或需要新设计时的停止条件。
- **recovery**：写恢复负责人和最小恢复动作。
- **task risk**：写具体风险。

一个任务只保留这四组卡片字段，只改变一个行为。行为任务的 RED 与 GREEN 使用相同 `gate_cmd` 和 oracle identity；RED 必须证明目标断言失败，不是环境或命令损坏。非行为变化仍须提供真实 gate_cmd、oracle、evidence_path；不能用 N/A 绕过可执行验证和证据。

### Verify

- **Target**：写 FR、AC 或 invariant。
- **gate_cmd**：写已核实可执行命令。
- **expected_exit**：写 0 或预期非零。
- **evidence_path**：写 task-relative evidence 路径。
- **display_cmd**：可选，仅供人读。
- **Oracle**：写可观察结果。

### Knowledge

列本 Phase 使用的已核实接口、来源或仓库事实；没有时写 `N/A — 具体理由`。

### STOP

- RED 无法按预期复现。
- GREEN 需要删除或弱化 accepted test。
- 需要 Phase.Files 之外的文件、未声明依赖、未知接口或新架构决策。
- 出现不可逆或需要用户授权的动作。

### Done

- 列准确行为和产物。
- 列 RED/GREEN 证据和剩余边界。

### Risks and rollback

- **Risk**：写风险。
- **Prevention**：写预防。
- **Rollback / recovery**：写最小可恢复动作。

每个 accepted plan Phase 完整重复以上八段。

## 3. Dependency Graph

- 用实际 Task ID 画出依赖图。
- 每个依赖在消费者之前存在。
- 标为 `[P]` 的任务必须证明输入和文件所有权独立。
- 图必须无环。

## 4. Requirement and Verification Traceability

| FR | Task IDs | AC IDs | Phase | Gate / evidence |
| --- | --- | --- | --- | --- |
| 写有效 FR ID | 写 Task ID | 写有效 AC ID | 写 Phase 名称 | 写 gate 和 evidence ref |

检查每个 accepted FR、AC 和 Task 双向闭合；没有孤儿或重复 ID。

## 5. Final Boundary Check

- [ ] 每个 Phase 有 Goal、Files、Tasks、Verify、Knowledge、STOP、Done、Risks and rollback。
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

旧 `## Stage N` 和 `(stage:N, depends:T001,T002)` 只允许只读导入。导入器必须一次性正规化为当前 Phase、唯一任务卡和 DAG 后再验证；新产物不得保留两套依赖真相。

# 任务清单：[填写：功能名]

> 基于 accepted spec 和 plan。沿用 AgentHub 的 Phase 清单结构；WorkflowHub 只补版本、边界、DAG 和可执行验证。

- **Input**：`[填写：spec ref]`、`[填写：plan ref]`
- **Status**：[填写：Draft / Accepted / Superseded]
- **Template version**：`plan-task.v3`

## 1. 执行摘要

- **Goal**：[填写：全部任务完成后的可观察结果]
- **Main boundary**：[填写：最重要的允许和禁止改动]
- **Main risk**：[填写：最可能导致 STOP 的风险]
- **First executable task**：[填写：首个 T-ID]

## WorkflowHub Stage Progress

> 这是 tasks.md 的执行进度索引，不是新的 completion ledger；任务完成与质量结果分开。

| Stage | Status | Task / phase IDs | Execution / evidence | Handoff / next |
| --- | --- | --- | --- | --- |
| build-code | `[填写：ready / in_progress / completed]` | `[填写：当前 IDs]` | `[填写：命令、exit、evidence refs]` | `[填写：handoff 和风险]` |
| verify-code | `[填写：ready / in_progress / completed]` | `[填写：当前 IDs/AC]` | `[填写：replay、review、verify refs]` | `[填写：结论和未决项]` |

每一行同时保留 `quality_status` 和 `user_handoff`。`tasks.md` 的每张任务卡必须有
`Workflow stage`、`execution_file_paths`、精确命令、实际结果和覆盖限制；路径从
`精确文件`派生，不得创建第二份文件边界。

### Test strategy fields (build-plan designs; build-code only executes)

- `test_strategy_owner`：`build-plan/high-intelligence-model`
- `test tier / test method`：`simple|feature|fullstack` 及适用测试方法与理由
- `scenarios / commands / expected exit / oracle`：成功、失败、状态、seam/UI 场景；可直接执行命令；预期退出码；可观察判据
- `fixtures_services`、`browser_route`、`evidence_path`、`coverage limits`：资源、清理、证据和未覆盖边界
- `execution_contract`：`build-code` 只执行任务卡策略；缺失策略写 `MATERIAL_INCOMPLETE`
- `final current-snapshot aggregate strategy`：最终聚合必须在 build-plan 预先设计
- `TaskKernel/evidence_refs`、`evidence_note`：实际命令、退出码、snapshot 和 canonical receipt 绑定

## 2. Global Constraints

- [填写：accepted plan 的范围、依赖、命名、兼容性和测试红线]
- 行为改动必须先有真实 RED，再做 GREEN。
- `display_cmd` 不能充当 pass/fail 判据。
- 文件只用精确路径，不用通配符。
- 完成区必须使用可认证格式：`actual_changes` 为 JSON 路径数组；`executed_commands` 为含 `command`、`exit_code` 的 JSON 数组；`evidence_refs` 为含 `ref`、`sha256` 的 JSON 数组；`covered_ac` 填 AC ID；`review_fact` 填当前 Phase review ref。
- 只有实际改动、测试 receipt、AC 证据和 review 都与当前工作树互相吻合，才勾选“任务完成”；预先勾选或填写伪证据必须失败。

## Phase 1：[填写：阶段名称]

### Goal

[填写：从 accepted plan 原样复制本 Phase 的可观察目标。]

### Files

- **NEW**：`[填写：从 plan 原样复制精确路径]`
- **MODIFY**：`[填写：从 plan 原样复制精确路径]`
- **DO NOT TOUCH**：`[填写：从 plan 原样复制精确路径]`

### Tasks

#### T001 — RED：[填写：失败测试标题]

- **ID**：T001
- **Phase**：[填写：所属 Phase 名称]
- **goal**：[填写：一个可观察任务目标]
- **design_state**：`ready` / `blocked-by-design`
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"[填写：spec ref]","hash":"[填写：真实 SHA-256]","id":"[填写：spec ID]"},{"artifact_kind":"plan","ref":"[填写：plan ref]","hash":"[填写：真实 SHA-256]","id":"[填写：plan ID]"}]`
- **source_refs / decision_refs**：[填写：decision-log 的 R*/报告/INC-* → D* → spec FR/AC 关系；只写 ID，不复制需求正文]
- **输入**：[填写：accepted artifact 章节、anchor 或前序输出]
- **依赖**：[填写：前序 Task ID / N/A — first task]
- **并行**：[填写：是 / 否；说明输入和文件所有权理由]
- **FR**：[填写：有效 FR ID]
- **AC**：[填写：有效 AC ID]
- **动作**：[填写：只写一个行为变化或一个非行为产物变化]
- **精确文件**：`[填写：Phase NEW/MODIFY 内的精确路径]`
- **boundary**：files: `[填写：Phase NEW/MODIFY 内的精确路径]`; symbols/regions: [填写：允许修改的 symbol 或 region]
- **输出**：[填写：可交付产物或行为结果]
- **Knowledge**：[填写：最小已核实上下文 / N/A — 理由]
- **verification_role**：[填写：RED / GREEN / N/A — non-behavior change: 理由]
- **paired_task**：T002
- **gate_cmd**：[填写：已核实可执行命令]
- **expected_exit**：[填写：RED 为非零整数；GREEN 和非行为任务为 0]
- **oracle**：[填写：稳定 ORACLE-ID、可观察结果和必要负例]
- **evidence_path**：[填写：task-relative stdout、stderr 或结果路径]
- **STOP**：[填写：命令损坏、oracle 不符、越界或需要新设计时停止]
- **recovery**：[填写：负责人和最小恢复动作]
- **task risk**：[填写：具体风险]

##### 执行状态填写区（唯一完成权威）

- [ ] **任务完成**
- **status**：`pending`
- **actual_changes**：N/A — not started
- **executed_commands**：N/A — not started
- **evidence_refs**：N/A — not started
- **covered_ac**：N/A — not started
- **review_fact**：N/A — RED task is reviewed with its paired GREEN Phase result
- **completed_at**：N/A — not completed

> 一张卡只改变一个行为。RED/GREEN 使用相同 gate 和 oracle；GREEN 依赖 RED。非行为任务仍须真实 gate、oracle 和 evidence。

#### T002 — GREEN：[填写：实现标题]

- **ID**：T002
- **Phase**：[填写：与 T001 相同的 Phase 名称]
- **goal**：[填写：让 T001 的目标断言通过]
- **design_state**：`ready` / `blocked-by-design`
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"[填写：spec ref]","hash":"[填写：真实 SHA-256]","id":"[填写：spec ID]"},{"artifact_kind":"plan","ref":"[填写：plan ref]","hash":"[填写：真实 SHA-256]","id":"[填写：plan ID]"}]`
- **source_refs / decision_refs**：[填写：decision-log 的 R*/报告/INC-* → D* → spec FR/AC 关系；只写 ID，不复制需求正文]
- **输入**：[填写：T001 的失败断言和 accepted anchor]
- **依赖**：T001
- **并行**：否 — RED/GREEN 必须串行
- **FR**：[填写：与 T001 相同的 FR ID]
- **AC**：[填写：与 T001 相同的 AC ID]
- **动作**：[填写：使目标断言通过的一个行为变化]
- **精确文件**：`[填写：Phase NEW/MODIFY 内的精确路径]`
- **boundary**：files: `[填写：Phase NEW/MODIFY 内的精确路径]`; symbols/regions: [填写：允许修改的 symbol 或 region]
- **输出**：[填写：可观察行为结果]
- **Knowledge**：[填写：最小已核实上下文]
- **verification_role**：GREEN
- **paired_task**：T001
- **gate_cmd**：[填写：与 T001 完全相同的命令]
- **expected_exit**：0
- **oracle**：[填写：与 T001 相同的 ORACLE-ID 和成功信号]
- **evidence_path**：[填写：task-relative GREEN 证据路径]
- **STOP**：[填写：需要弱化测试、越界或新设计时停止]
- **recovery**：[填写：负责人和最小恢复动作]
- **task risk**：[填写：具体风险]

##### 执行状态填写区（唯一完成权威）

- [ ] **任务完成**
- **status**：`pending`
- **actual_changes**：N/A — not started
- **executed_commands**：N/A — not started
- **evidence_refs**：N/A — not started
- **covered_ac**：N/A — not started
- **review_fact**：N/A — build-code Phase review not executed
- **completed_at**：N/A — not completed

### Verify

- **Target**：[填写：FR、AC 或 invariant]
- **gate_cmd**：[填写：已核实可执行命令]
- **expected_exit**：[填写：0 或预期非零]
- **evidence_path**：[填写：task-relative evidence 路径]
- **display_cmd**：[填写：可选，只供人读]
- **Oracle**：[填写：可观察结果]

### Knowledge

- [填写：本 Phase 使用的已核实接口、来源或仓库事实 / N/A — 理由]

### STOP

- RED 无法因目标断言失败而复现，或失败来自环境、命令、fixture 损坏。
- GREEN 需要删除、跳过或弱化 accepted test。
- 需要 Phase.Files 之外的文件、未知接口、未声明依赖或新架构决策。
- 出现不可逆操作或需要用户授权的动作。

### Done

- [填写：准确行为、产物和 RED/GREEN 证据]

### Risks and rollback

- **Risk**：[填写：风险]
- **Prevention**：[填写：预防]
- **Rollback / recovery**：[填写：最小可恢复动作]

> 每个 accepted plan Phase 完整重复以上八段；Phase 名称和 Files 必须逐字一致。

## 3. Dependency Graph

```text
T001 (RED) → T002 (GREEN)
```

- 每个依赖必须存在，并且先于消费者执行。
- 依赖图必须无环。
- 标记 `[P]` 的任务只有在输入、依赖和文件所有权相互独立时才能并行。

## 4. Requirement and Verification Traceability

| FR | Task IDs | AC IDs | Phase | Gate / evidence |
| --- | --- | --- | --- | --- |
| [填写：FR ID] | [填写：Task ID] | [填写：AC ID] | [填写：Phase] | [填写：Gate / evidence ref] |

## 5. Final Boundary Check

- [ ] 每个 Phase 八段完整，且 Files 与 plan 逐字一致。
- [ ] 每个 Task 只有一张权威卡，精确文件属于本 Phase NEW/MODIFY。
- [ ] 每个行为变化都有真实 RED → GREEN，命令、oracle 和证据明确。
- [ ] DAG 与 FR/Task/AC/gate 双向闭合。
- [ ] Plan File Boundary 等于所有 Phase NEW/MODIFY 的并集。
- [ ] 每个 Phase NEW/MODIFY 文件至少有一个 owning Task。
- [ ] 每个 Task 的精确文件和 boundary 都是所属 Phase NEW/MODIFY 的子集。
- [ ] 每个 Task 只有一个完成区；完成项的改动、命令、证据、AC、review 和时间均可认证。
- [ ] 没有 host identity、固定 artifact root、无关项目规则或未声明文件。

## Appendix A. Legacy import

旧 `## Stage N` 只允许只读导入；导入时一次性正规化为当前 Phase、唯一任务卡和 DAG，新产物不得保留两套依赖真相。

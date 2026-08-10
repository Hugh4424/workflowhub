# 任务清单：[填写：功能名]

- **Input**：`[填写：decision-log.md ref]`、`[填写：spec.md ref]`、`[填写：plan.md ref]`
- **Template version**：`plan-task.v3`

## Phase P1 — [填写：阶段名]

### Goal

[填写：本 Phase 的可观察结果；不要复制产品 rationale。]

### Files

- **NEW**：`[填写：精确路径 / N/A — reason]`
- **MODIFY**：`[填写：精确路径]`
- **DO NOT TOUCH**：`[填写：精确保护路径及理由]`

### Tasks

#### T001 — RED：[填写：失败测试标题]

- **ID**：T001
- **Phase**：Phase P1 — [填写：阶段名]
- **goal**：[填写：一个可观察任务目标]
- **design_state**：[填写：ready / blocked-by-design]
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"[填写：spec ref]","hash":"[填写：真实 SHA-256]","id":"[填写：spec ID]"},{"artifact_kind":"plan","ref":"[填写：plan ref]","hash":"[填写：真实 SHA-256]","id":"[填写：plan ID]"}]`
- **source_refs / decision_refs**：[填写：R*/D* → FR/AC；只写 ID]
- **输入**：[填写：accepted spec/plan anchor 或上游输出]
- **依赖**：none
- **并行**：否 — first RED for this behavior
- **FR**：[填写：FR-ID]
- **AC**：[填写：AC-ID]
- **动作**：[填写：增加因目标断言失败的测试，不改生产实现]
- **精确文件**：`[填写：Phase NEW/MODIFY 内的测试文件]`
- **boundary**：files: `[填写：精确文件]`; symbols/regions: [填写：允许修改的 symbol 或 region]
- **输出**：[填写：RED 证据目标]
- **Knowledge**：[填写：执行所需的已核实接口与约束]
- **verification_role**：RED
- **paired_task**：T002
- **gate_cmd**：`[填写：可执行命令]`
- **expected_exit**：[填写：非零整数]
- **oracle**：`ORACLE-[填写]` — [填写：目标断言失败信号]
- **evidence_path**：`[填写：task-relative 路径]`
- **STOP**：[填写：环境失败、命令损坏、越界或需要新设计时停止]
- **recovery**：[填写：负责人和最小恢复动作]
- **task risk**：[填写：错误 RED 或覆盖不足风险]
- **test tier / test method**：[填写：simple / feature / fullstack 及理由]
- **scenarios / commands / expected exit / oracle**：[填写：成功、失败、状态或 seam 场景与相同命令/oracle]
- **fixtures_services**：[填写：fixture、服务和清理责任 / N/A — reason]
- **coverage limits**：[填写：本命令覆盖范围和明确未覆盖项]

##### 执行状态填写区（唯一完成权威）

- [ ] **任务完成**
- **status**：`pending`
- **actual_changes**：N/A — not started
- **executed_commands**：N/A — not started
- **evidence_refs**：N/A — not started
- **covered_ac**：N/A — not started
- **review_fact**：N/A — RED task is reviewed with its paired GREEN Phase result
- **completed_at**：N/A — not completed
- **执行事实**：N/A — not started

#### T002 — GREEN：[填写：实现标题]

- **ID**：T002
- **Phase**：Phase P1 — [填写：阶段名]
- **goal**：[填写：让 T001 的目标断言通过并保留负例]
- **design_state**：[填写：ready / blocked-by-design]
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"[填写：spec ref]","hash":"[填写：真实 SHA-256]","id":"[填写：spec ID]"},{"artifact_kind":"plan","ref":"[填写：plan ref]","hash":"[填写：真实 SHA-256]","id":"[填写：plan ID]"}]`
- **source_refs / decision_refs**：[填写：与 T001 相同的 R*/D* → FR/AC 关系]
- **输入**：[填写：T001 的失败断言和已核实实现锚点]
- **依赖**：T001
- **并行**：否 — RED/GREEN 必须串行
- **FR**：[填写：与 T001 相同的 FR-ID]
- **AC**：[填写：与 T001 相同的 AC-ID]
- **动作**：[填写：满足目标行为的最小实现]
- **精确文件**：`[填写：Phase NEW/MODIFY 内的实现文件及必要测试文件]`
- **boundary**：files: `[填写：精确文件]`; symbols/regions: [填写：允许修改的 symbol 或 region]
- **输出**：[填写：GREEN 可观察结果]
- **Knowledge**：[填写：T001 产出的真实失败事实和实现约束]
- **verification_role**：GREEN
- **paired_task**：T001
- **gate_cmd**：`[填写：与 T001 完全相同的命令]`
- **expected_exit**：0
- **oracle**：`ORACLE-[填写]` — [填写：与 T001 相同的 oracle、成功信号和负例]
- **evidence_path**：`[填写：task-relative 路径]`
- **STOP**：[填写：需要弱化测试、扩大边界或新增设计时停止]
- **recovery**：[填写：负责人和最小恢复动作]
- **task risk**：[填写：实现偏离或负例回归风险]
- **test tier / test method**：[填写：与 T001 相同的 simple / feature / fullstack 及理由]
- **scenarios / commands / expected exit / oracle**：[填写：与 T001 相同的场景、命令、退出码和 oracle]
- **fixtures_services**：[填写：与 T001 相同的 fixture/服务和清理责任 / N/A — reason]
- **coverage limits**：[填写：本命令覆盖范围和明确未覆盖项]

##### 执行状态填写区（唯一完成权威）

- [ ] **任务完成**
- **status**：`pending`
- **actual_changes**：N/A — not started
- **executed_commands**：N/A — not started
- **evidence_refs**：N/A — not started
- **covered_ac**：N/A — not started
- **review_fact**：N/A — build-code Phase review not executed
- **completed_at**：N/A — not completed
- **执行事实**：N/A — not started

#### T003 — FINAL：aggregate verification

- **ID**：T003
- **Phase**：Phase P1 — [填写：阶段名]
- **goal**：按 plan.md 预先设计的最终路线验证全部适用 AC、跨任务 seam 和当前完整测试事实
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"[填写：spec ref]","hash":"[填写：真实 SHA-256]","id":"[填写：spec ID]"},{"artifact_kind":"plan","ref":"[填写：plan ref]","hash":"[填写：真实 SHA-256]","id":"[填写：plan ID]"}]`
- **source_refs / decision_refs**：[填写：全部适用 R*/D* → FR/AC]
- **输入**：[填写：已完成的 Phase tasks 和最终路线]
- **依赖**：T002
- **并行**：否 — aggregate reads all preceding task facts
- **FR**：[填写：全部适用 FR-ID]
- **AC**：[填写：全部适用 AC-ID]
- **动作**：只执行一次最终聚合检查并记录真实退出码、oracle、覆盖范围和剩余风险；不创建新的状态权威
- **精确文件**：`[填写：最终验证读取或修改的精确文件；必须属于 Phase NEW/MODIFY]`
- **boundary**：files: `[填写：精确文件]`; symbols/regions: [填写：仅最终验证允许的区域]
- **输出**：[填写：最终测试与交接事实]
- **Knowledge**：[填写：所有前序任务的真实结果]
- **verification_role**：N/A — non-behavior aggregate verification
- **paired_task**：N/A — aggregate has no RED/GREEN pair
- **gate_cmd**：`[填写：可执行最终命令]`
- **expected_exit**：0
- **oracle**：`ORACLE-FINAL` — [填写：全部适用 AC、跨任务 seam 和最终测试事实]
- **evidence_path**：`[填写：task-relative 最终证据路径]`
- **STOP**：[填写：最终命令不可执行、AC 缺失、越界或需要新决策时停止]
- **recovery**：[填写：负责人和最小恢复动作]
- **task risk**：[填写：聚合覆盖遗漏或把质量事实误写成通过]
- **test tier / test method**：[填写：simple / feature / fullstack 及选择理由]
- **scenarios / commands / expected exit / oracle**：[填写：成功、失败、状态、跨任务 seam 场景]
- **fixtures_services**：[填写：fixture、服务和清理责任 / N/A — reason]
- **coverage limits**：[填写：最终命令覆盖范围和明确未覆盖项]

##### 执行状态填写区（唯一完成权威）

- [ ] **任务完成**
- **status**：`pending`
- **actual_changes**：N/A — not started
- **executed_commands**：N/A — not started
- **evidence_refs**：N/A — not started
- **covered_ac**：N/A — not started
- **review_fact**：N/A — final aggregate not executed
- **completed_at**：N/A — not completed
- **执行事实**：N/A — not started

### Verify

- **Target**：[填写：本 Phase 的 FR、AC 和跨任务 seam]
- **gate_cmd**：`[填写：与 task oracle 对齐的命令]`
- **expected_exit**：[填写：0 或明确的非零]
- **evidence_path**：`[填写：task-relative 路径]`
- **Oracle**：[填写：可观察结果]

### Knowledge

[填写：本 Phase 交给下一 Phase 的已核实接口、来源和风险事实。]

### STOP

- [填写：命令损坏、oracle 不符、边界越界或需要新设计时返回 owning material。]

### Done

- [填写：测试、AC 覆盖、review findings、证据和大白话交接事实。]

### Risks and rollback

- **Risk**：[填写：风险]
- **Prevention**：[填写：预防]
- **Rollback / recovery**：[填写：边界内最小可恢复动作]

## 4. Final current-snapshot aggregate strategy

- **test tier / test method**：[填写：最终 tier 与具体 testing skill]
- **scenarios**：[填写：全部适用 AC、成功/失败、状态、跨任务 seam 场景]
- **command**: `[填写：可执行最终命令]`
- **expected exit**：0
- **oracle**：[填写：稳定 ORACLE-FINAL 和可观察结果]
- **fixtures_services**：[填写：fixture、服务、清理责任 / N/A — reason]
- **evidence_path**：`[填写：task-relative 最终证据路径]`
- **coverage limits**：[填写：覆盖范围和明确未覆盖项]
- **STOP**：[填写：命令损坏、AC 缺失、边界越界或需要新决策]
- **execution_contract**：当前快照运行一次；失败保留原始输出，回受影响 task，不用全量重跑掩盖局部失败。

## Dependency Graph

```text
T001 (RED) → T002 (GREEN) → T003 (FINAL)
```

## Final Boundary Check

- [ ] 每个 Phase 的 Goal、Files、Tasks、Verify、Knowledge、STOP、Done、Risks and rollback 完整。
- [ ] 每个任务只有一张卡和一个完成区；文件是所属 Phase NEW/MODIFY 的子集。
- [ ] 每个行为变化都有同命令、同 oracle 的 RED → GREEN；FINAL 只做一次聚合。
- [ ] 依赖无环，FR/AC 双向追溯闭合，未知事实没有被写成假设或通过。
- [ ] review、test、evidence 只作为事实记录，不是开始、继续或交付许可证。

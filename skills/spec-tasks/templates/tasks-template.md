# 任务清单：[填写：功能名]

- **Input**：`[填写：decision-log.md ref]`、`[填写：spec.md ref]`、`[填写：plan.md ref]`
- **Template version**：`plan-task.v4`

## 材料导航

[填写：根据当前四材料的实际章节与锚点再生成本表；仅用于定位，正文仍由各自材料负责。M/S/B/P 表示主会话、子代理、后台执行和并行工作在何时读取，不产生第五份权威材料。]

| 章节 / 材料锚点 | 职责与摘要 | M/S/B/P 读取时机 |
| --- | --- | --- |
| `decision-log.md#[填写：实际决策锚点]` | 已确认的方向、范围、理由与非目标 | [填写：读取角色与时机] |
| `spec.md#[填写：实际 FR/AC 锚点]` | 产品行为、状态、验收 oracle 与失败边界 | [填写：读取角色与时机] |
| `plan.md#[填写：实际工程方案锚点]` | 工程方案、接口、依赖、验证与恢复策略 | [填写：读取角色与时机] |
| `tasks.md#[填写：实际 Phase/task 锚点]` | 可执行任务边界、命令及实际完成记录 | [填写：读取角色与时机] |

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

##### Delivery contract fields (新计划必须显式填写)

在每张新任务卡按需添加 `acceptance_role`（`implementation` 或 `acceptance`）和 `ui_scope`
（`ui`、`fullstack` 或 `non_ui`）。最终验收卡唯一使用 `acceptance`，并额外写
`acceptance_data` JSON：`[{"source":"...","sample":"...","scenario":"...","tier":"browser|service|command"}]`
和 `e2e_scope`：`ui|fullstack|high_risk_user_visible|not_required`。矩阵固定为：`ui=ui+browser`、
`fullstack=fullstack+browser+service`、`high_risk_user_visible=non_ui/ui/fullstack` 分别对应
`service/browser/browser+service`、`not_required=non_ui`。高风险卡还必须写
`e2e_decision_refs` JSON（至少 `D6`,`D7`）和 `e2e_risk_decision_ref`：后者是当前任务 make-decision
的当前风险 D 段，且该段唯一写入下面 Markdown 源码行（JSON 必须在反引号内）：

```md
- **high_risk_fact**：`{"classification":"high_risk_user_visible","basis":"user_declaration"}`
```

`command` / `service` 场景按真实消费者补齐 `execution`；以下只是形状示例，落卡时换成当前任务的真实文件、输入、timeout 和 AC，不把示例写成已执行事实：

```json
[
  {"source":"current task fixture","sample":"selected sample","scenario":"command result","tier":"command","execution":{"command":"node","args":["tests/accept-command.mjs"],"timeout_ms":5000}},
  {"source":"current task fixture","sample":"selected sample","scenario":"service result","tier":"service","execution":{"module_ref":"tests/accept-service.mjs","export_name":"accept","input":{"sample":"selected sample"},"timeout_ms":5000}}
]
```

command 在认证 worktree 以 argv 执行；service 从该 worktree 加载模块并调用 export。每个执行输出 UTF-8 JSON，覆盖卡内全部 AC 且每个 AC 恰好一次：`{"entries":[{"acceptance_criterion_id":"AC-001","assertions":[{"id":"result","expected":7,"actual":7}]}]}`。断言 expected/actual 必须是实际可比较 JSON；runtime 自己派生结论，不采信自报 passed。规划注明原 stdout/stderr、逐 AC evidence、aggregate ref/hash 与清理责任；缺 execution、无效 JSON、超时、取消、断言失败均保留原输出和实际失败。browser 使用原有浏览器证据契约，不填写这两类 execution 对象。

其中 `basis` 也可为 `three_inputs`；该 D 段必须被本任务 spec 引用，且不得用 D6/D7 全局政策代替。UI 计划必须另有一张
`ui_scope=ui` 且 `acceptance_role=implementation` 的实现卡；四个场景字段均不得省略或写占位值。

##### UI phase/task fields (仅 UI scope 填写)

- **ui_scope**：`ui` / `non_ui` / `unknown`，不允许 caller 降级事实。
- **component action / real consumer**：[填写复用、修改、增加状态、局部新增、共享抽取或删除动作，以及真实消费者]
- **state owner / typed ViewModel / CSS/token owner**：[填写状态、类型和样式/token 的唯一责任边界]
- **fixture / viewport / responsive**：[填写假数据、视口、断点和响应式场景]
- **browser / a11y / performance / screenshot**：[填写交互、keyboard、a11y、性能命令与截图交接；必须说明执行 phase]
- **coverage limits / N/A or unknown reason**：[填写明确未覆盖范围和不能执行的原因]
- **design-gap handoff**：`design_status`、`missing_items`/reason、`fallback_visual_basis`、`constraints`、`assumptions`、`rework_risk`、`human_confirmation`。
- **design refs**：`current_material_ref`、`design_revision`、`visible_labels`、`preview_refs`、`fixture_refs`、`viewport_refs`、`screenshot_refs`；Design.md 只记录版本，不记录 SHA-256。
- **state UI facts**：每个适用状态补 `responsive` 和 `a11y`；缺失写 `unknown`/`unavailable`/`N/A + reason`。

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

- **tier / method**：[填写：最终 tier 与具体 testing skill]
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

- **order**：T001 (RED) → T002 (GREEN) → T003 (FINAL)

```text
T001 (RED) → T002 (GREEN) → T003 (FINAL)
```

完成区的 `executed_commands`、`evidence_refs`、`review_fact` 和 `执行事实` 只填真实调用及消费者结果：普通 review 的 canonical attempt/result ref/hash、实际 provider execution usage/timing；阶段反思 v2 的唯一显式 outcome 与返回 semantic ref/raw sha256；需要用户确认时使用实际 `human-confirmation.v3` ref。重复请求复用原件，不增加 executed/技能名证明；同 A 保留首次 bytes/time，B 新件保留 A。缺失、partial、unavailable 及原 stage error/reflection_error 分别写清，规划文本不冒充执行、验收或发布。

## Final Boundary Check

- [ ] 每个 Phase 的 Goal、Files、Tasks、Verify、Knowledge、STOP、Done、Risks and rollback 完整。
- [ ] 每个任务只有一张卡和一个完成区；文件是所属 Phase NEW/MODIFY 的子集。
- [ ] 每个行为变化都有同命令、同 oracle 的 RED → GREEN；FINAL 只做一次聚合。
- [ ] 依赖无环，FR/AC 双向追溯闭合，未知事实没有被写成假设或通过。
- [ ] review、test、evidence 只作为事实记录，不是开始、继续或交付许可证。

# decision-log — workflowhub-thin-core-card-05-20260919

## 任务身份

| 项 | 值 |
|---|---|
| 任务 ID | workflowhub-thin-core-card-05-20260919 |
| 项目 | workflowhub |
| 阶段 | make-decision |
| Worktree | `/Users/Hugh/Hugh/Project/workflowhub-workflowhub-thin-core-card-05-20260919` |
| 分支 | `task/workflowhub/workflowhub-thin-core-card-05-20260919` |
| 基线 | `642d4fb21c487618bd793acc28fffceaafd521db` |
| **任务类型** | **普通任务** |

## 状态

- 当前 stage：`make-decision`，`in-progress`。
- 本文件由 make-decision 独占维护；`spec.md` / `plan.md` / `tasks.md` 尚未创建，属后续阶段材料。
- **当前拓扑修订（2026-09-22，用户直接指令）**：本任务外置 `task.json` 的 `activation_cohort` 已由 `pre` 改为 `post`；目标材料为 `build-plan` 生成的 `spec.md`、`phases/P<n>.md` 和 `phases/index.md`。上句的 `plan.md` / `tasks.md` 与本文后续 `build-spec` 承接语句均是修改前的记录，不再是当前实施指令。现有运行时仍按四材料处理正式 `build-plan`，因此 post 材料只能先起草，正式发布须先补齐运行时消费者；不得把文件存在或 cohort 标签当作 stage 完成。此修订由用户本轮“把当前任务的pre直接改成post”授权；原 task 创建时为 `pre` 的历史事实仍保留在既有记录中。
- **上一轮目标修订（2026-09-25，D-043；面集由 D-044 覆盖）**：用户撤销本卡的比较选型目标。D-011/D-014/D-026/D-031/D-042、旧 P5/T011 的 no-go 与阈值只保留为历史，不再约束当前实施或验收。D-043 当时要求 OCR 委托在 build-code phase、build-code integration、verify-code 三处按正常路由工作并分别留下能力证据；不重启 P1–P4，不重复 Architect/wh-review 对照。现行两面范围见 D-044、`spec.md`、`phases/P5.md` 与 ADR-0032。D-043 材料修订时仅修改文档；该时间点的未执行声明不用于判断此后真实审查或代码实施状态。
- **当前修订的授权状态（2026-09-22 晚）**：本材料当前 sha256 `a76e41930d0318230df9166d441905627fd8e0e4379fc6dbce696b894782abd6` **不被任何 `quality/confirmations/*.json` 绑定**。在重跑序列的第 ②③④ 步（用户对**当前**修订的 `confirm --action=decision` → 覆盖审计重跑 → reflection 重跑）完成之前，**本材料不得被读作已获最终批准，也不得被下游（build-spec）当作已批准基线消费**。重跑序列全文见 **D-038**；逐条闭合动作见 `## spec-analyze 镜头 15 条 finding 的处置表` 的 F-01 / F-02。 **（哈希自指说明（2026-09-22 晚））**：`a76e41930d0318230df9166d441905627fd8e0e4379fc6dbce696b894782abd6` 是**本轮材料修复之前**测得的 sha256；本轮修复本身会改变文件哈希，故**修复后的当前修订哈希不等于该值**——正确做法是：本轮修复冻结后当场重算（`shasum -a 256 specs/workflowhub-thin-core-card-05-20260919/decision-log.md`），以该重算值作为**待确认修订**的标识。**修复前值与修复后值都不被任何 `quality/confirmations/*.json` 绑定**；用户须对**修复后冻结的修订**做确认，在重跑序列第 ② 步完成之前不得被读作已获最终批准。

## 本卡输入与只读边界

### 主输入（只读引用）

- 母 PRD：`/Users/Hugh/Hugh/Project/workflowhub/specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md`，`### CARD-05 审查链替换(有证据门槛)`。
- 母 PRD 共享定义：`SD-07 审查节奏`、`SD-08 独立替代审查(T-003)`、`SD-15 质量事实≠推进许可证`、`SD-17 两道人为门与零机器门禁`、`SD-16 过渡基线`。
- 规划 decision-log：`/Users/Hugh/Hugh/Project/workflowhub/specs/workflowhub-thin-core-rebuild-planning-20260919/decision-log.md`，`OI-005`、`OI-013`、`OI-014`、`U-009#2`、`U-010#2/#3`、`Q13`、`T-003`。
- 全局审查配置：`/Users/Hugh/.config/workflowhub/config.json` 的 `wh_review.stages.*`。
- 本机 build-code / verify-code 真实执行会话（取证材料，见 `research/`）。

### 只读边界

- 母 PRD、规划 decision-log、card-01/card-02 已完成材料、card-07 设计中的材料：**只读**，本卡不回写、不触发母任务 close。
- 旧 accepted 记录、旧 review、旧 execution record、历史 worktree：只作审计事实，不授权也不阻断本次 Talk / 起草 / 修订 / 同 task 修复。
- `wh-review` 物理删除属 CARD-06，不在本卡范围；审查基建资源修复（限制并发 provider）属 CARD-09，不在本卡范围。

## UI applicability

本卡不触碰任何页面、交互或前端产物：原始需求（用户口述 + CARD-05 卡面）要求的是审查链替换、对比实验与审查事实写入，无页面或交互诉求；仓库现状（`workflowhub` 无前端目录与路由，工作面为 `runtime/review/`、`skills/wh-review/`、`workflows/`、`tools/cli/`）不含可改前端；计划变更（新审查工具接入与适配合同）不产生前端改动。三源一致排除，判为 `non_ui`。

**（校正/未决（H7→CF-3）：上面枚举的「工作面」**遗漏了第二个仓库**——`/Users/Hugh/Hugh/Project/3rd-review`。D-017 修复面的取消 / 孤儿治理与健康裁决实现于该仓（`lib/broker.mjs:664,702,725` + `lib/runtime.mjs:96,135,155`），材料自己引用的 `broker.mjs:577` 也在该仓（本仓无此文件）。全卡**没有跨仓交付登记**（接收方 / 接口契约 / 验收判据）与跨仓授权声明，而 D-030⑤（archive `workflowhub-mechanism-simplification-t2-20260911/decision-log.md:332`（= `specs/archive/workflowhub-mechanism-simplification-t2-20260911/decision-log.md:332`，F-09 全路径规范化））与 `ADR-0031:85`（= `docs/adr/0031-review-check-downgrade-and-identity-boundary.md:85`，F-09 全路径规范化） 明确要求如此。本修复不自行扩面，登记为 CF-3。）** **（D-025 更新（2026-09-22 用户裁决）：CF-3 已 **RESOLVED by D-025**——本卡承担跨仓修复并登记；上面的「工作面」枚举须在 build-plan 补入第二仓 `/Users/Hugh/Hugh/Project/3rd-review`，并声明跨仓写面不改变本卡 worktree 的隔离边界。）**
> **（F-09 引用规范化（2026-09-22 晚）：本段内的 `ADR-0031:85` 一律读作 worktree 相对全路径 `docs/adr/0031-review-check-downgrade-and-identity-boundary.md:85`；同句的 archive 路径 `workflowhub-mechanism-simplification-t2-20260911/decision-log.md:332` 一律读作 `specs/archive/workflowhub-mechanism-simplification-t2-20260911/decision-log.md:332`。worktree 内名为 `0031*` 的 ADR 有**两份**（`docs/adr/0031-hosted-method-toolkit-direction.md` 与 `docs/adr/0031-review-check-downgrade-and-identity-boundary.md`），故短引用 `ADR-0031:` 有歧义，全文一律以全路径为准。同理全文中所有 `card-02 DL:NNNN` 短引用一律读作 `specs/archive/workflowhub-thin-core-card-02-20260919/decision-log.md:NNNN`。原短引用措辞逐字保留于本段。）**

```json
{"result":"non_ui",
 "sources":{
   "raw_requirement":{"result":"non_ui","fact":"用户要求系统性改造 workflowhub 的全部审查流程与审查质量，并接入外部审查工具；无页面、交互或视觉诉求。"},
   "project_inventory":{"result":"non_ui","fact":"workflowhub 仓库无前端目录、无 routes、无组件消费者；工作面为 runtime/review/、skills/wh-review/、workflows/、tools/cli/、config/。"},
   "planned_or_changed_frontend_fact":{"result":"non_ui","fact":"本卡计划变更为审查适配合同冻结、对比实验、新工具接入与审查事实写入；不涉及任何前端文件或渲染产物。"}},
 "raw_requirement":"用户要求系统性改造 workflowhub 的全部审查流程与审查质量，并接入外部审查工具；无页面、交互或视觉诉求。",
 "project_inventory":"workflowhub 仓库无前端目录、无 routes、无组件消费者；工作面为 runtime/review/、skills/wh-review/、workflows/、tools/cli/、config/。",
 "planned_or_changed_frontend_fact":"本卡计划变更为审查适配合同冻结、对比实验、新工具接入与审查事实写入；不涉及任何前端文件或渲染产物。"}
```

## OI 大纲（当前版本 `outline_version=2`，draft）

> 本版为 make-decision step 1–2 的初稿，依据母 PRD CARD-05 + SD 共享定义 + 第一期 build-code 真实执行取证。Talk / research 只更新本版本，不另建第二份清单。

### 功能骨架六节点

| framework_node | oi_ids | empty | reason |
|---|---|---|---|
| background | OI-001、OI-002 | false | 现行审查为何在真实任务上耗时且低效 |
| problem | OI-001、OI-002、OI-010 | false | 审查被派发前校验与错误误分类卡死；成本与发现脱钩 |
| goal | OI-003、OI-007、OI-015 | false | 换掉审查工具链并保住 SD-07 节奏；让审查真的能发现问题 |
| solution | OI-003、OI-004、OI-005、OI-006、OI-008、OI-021、OI-022、OI-023、OI-025、OI-026、OI-027、OI-029、OI-031、OI-032、OI-033、OI-034、OI-035 | false | 适配合同、对比实验、go/no-go 阈值、委托模式接入；另含 Talk round 1–3 与方向审查派生的实现载体/隔离边界/映射表/聚合契约/丢弃记账 OI，以及本次补入的 card-02 入向义务承接（OI-032）与 unavailable 状态集合（OI-033），以及 2026-09-22 晚 E2E 实验派生的 OI-034（D-033 与 `verify-code` forbidden 的冲突解法）与 OI-035（D-035 并集入账的执行契约）（见下方各 OI 记录） |
| acceptance | OI-009、OI-011、OI-012、OI-024、OI-030 | false | 不可用路径、单次不复审、审查事实写入；另含本卡自身审查路径与实验判定维度 OI（见下方各 OI 记录） |
| extension | OI-015、OI-016、OI-028 | false | 审查内容质量契约；与 card-07 的接口对齐；D-106 执行约束的登记形式 |

### 固定类别

| category | oi_ids | empty | reason |
|---|---|---|---|
| complete_user_flow | OI-003、OI-007、OI-008、OI-015、OI-017、OI-022、OI-026、OI-028 | false | 四个审查落点是否全换；委托模式如何消费 config；改造范围是否含需求/设计审查；另含按材料「类别」列归入本类的 OI-003/OI-015 与派生 OI-022/OI-026/OI-028（见下方各 OI 记录） |
| page_scope | | true | 本卡 `non_ui`，无页面或交互面，三源一致排除（见上节 UI applicability） |
| data_state | OI-002、OI-005、OI-006、OI-012、OI-019、OI-024、OI-033 | false | 输入形态、finding schema、审查事实写入位置、材料字节 vs 代码改动的错配；另含派生 OI-024、按内容归入本类的 OI-002，以及 unavailable 状态集合（OI-033）（见下方各 OI 记录） |
| success_failure_boundary | OI-001、OI-004、OI-009、OI-010、OI-011、OI-021、OI-023、OI-025、OI-027、OI-029、OI-030、OI-031、OI-032、OI-034、OI-035 | false | 不可用三档路径、错误语义契约、单次不复审边界；另含按内容归入本类的 OI-001/OI-004 与派生 OI-021/OI-023/OI-025/OI-027/OI-029/OI-030，以及 card-02 入向义务承接（OI-032），以及 2026-09-22 晚 E2E 实验派生的 OI-034/OI-035（均为「要求已定、执行契约未成文」的边界项）（见下方各 OI 记录） |
| non_goals | OI-013 | false | wh-review 物理删除、审查基建并发、减少审查次数；与 card-02 已吸收部分的边界（OI-020 已按方向审查 finding `F-6389631fd26c` 判定非 non_goals，移至 deferred 行） |
| deferred | OI-014、OI-016、OI-018、OI-020 | false | 与 CARD-09 写面协调；与 card-07 接口对齐；config.json 禁令冲突处置；与 card-02 的接口对齐（OI-020，按 finding `F-6389631fd26c` 更正后归此） |

### OI 台账

| OI | 类别 | 问题 / 未知 | 来源 | 状态 | 终局处置 |
|---|---|---|---|---|---|
| OI-001 | background/problem | 审查失败的真实分布：route / 协议信封 / 材料身份 / provider 选择 各占多少？`unavailable` 是否被系统性误分类？ | 取证 s1 L2420/L2510/L6967/L2561；PRD FR-57、OI-013 | open | 待定 |
| OI-002 | background/problem | 审查成本与发现是否普遍脱钩？单次审查是否该有 token/时长预算与"零发现"的语义 | 取证 s1 L11651（6h24m → `findings=[]`）；用户口述 | open | 待定 |
| OI-003 | goal/solution | 新工具选型：OCR 是否入选、对照臂是谁、是否允许多候选。OCR 已在 U-001#5 被用户点名；既有调查记录为「锁定 SHA 源码已核接口能力，真实效果 unknown」 | 规划 DL L53（U-001#5）、L586；PRD FR-22/FR-26/AC-22 | open | 待定 |
| OI-004 | solution | go/no-go 阈值三件套（findings 有效率 / 锚定准确率 / 耗时阈值）的具体数值与测量方法 | PRD FR-54/AC-55 | open | 待定 |
| OI-005 | data_state | 适配合同输入形态三选一：`diff` / `worktree` / `packet` | PRD FR-53/AC-54 | open | 待定 |
| OI-006 | data_state | finding schema 四要素（严重度、文件/行号锚定、证据、建议）的具体字段与严重度取值域 | PRD FR-53/AC-54 | open | 待定 |
| OI-007 | complete_user_flow |  SD-07 四个审查落点是否全部换新工具；make-decision 的方向/细节建议审查是否同批替换 | PRD SD-07/FR-23；用户要求"所有审查" | open | 待定 |
| OI-008 | complete_user_flow | 委托模式如何消费 `config.json` 的 build-code/verify-code `initial[]`：谁指挥、谁执行、异源规则怎么算 | 用户明确要求；`config.json` | open | 待定 |
| OI-009 | success_failure_boundary | 工具 unavailable 三档路径（替代审查 / unverified / 不阻断）如何落地且不冒充已审 | PRD SD-08/FR-25/AC-25 | open | 待定 |
| OI-010 | success_failure_boundary | 审查失败的错误语义契约：`ROUTE_UNAVAILABLE` 与 `REVIEW_EXECUTION_FAILED` 分离；`provider_attempts` 为空的下游兼容 | 取证 s1 L2561 | open | 待定 |
| OI-011 | success_failure_boundary | 单次审查成功不复审（FR-24）与"发现照单修复"的执行边界：修完是否需要任何确认 | PRD FR-24/AC-24 | open | 待定 |
| OI-012 | data_state | 审查事实写入位置与命名：现有 `quality/reviews/` 是否保留、不用内容寻址哈希 | PRD SD-17/FR-53 | open | 待定 |
| OI-013 | non_goals | 明确不做：wh-review 物理删除（CARD-06）、审查基建并发修复（CARD-09）、减少审查次数 | PRD 范围节 | open | 待定 |
| OI-014 | deferred | 与 CARD-09 审查基建写面的协调时点与集成责任归属 | PRD SD-14、共享资源冲突 | open | 待定 |
| OI-015 | goal/extension | 审查**内容**质量契约（不只换工具）：如何让审查发现需求漏洞、边界情况、与现有代码的意外交互 | 用户明确要求 | open | 待定 |
| OI-016 | deferred | 与 card-07（make-decision 改造）的写面/时机接口对齐 | card-07 设计中 | open | 待定 |
| OI-017 | complete_user_flow | **改造范围边界**：U-001#5 只点名 build-code / verify-code 两个审查点；用户现要求「所有审查」。make-decision 的方向/细节建议审查、build-spec 审查是否同批替换？ | 声明 1/2；PRD FR-23/SD-07；card-02 OI-011 | open | 待定 |
| OI-018 | deferred | **config.json 禁令冲突**：`specs/archive/workflowhub-cost-baseline-and-blocker-close-20260917/decision-log.md` L89/L108/L965 记录用户裁定「禁止把改 config.json 当作解决方案」；本次声明 5 要求用 config.json 承载委托模式。该禁令是否仍生效？ | 取证 dl L89/108/965；声明 5 | open | 待定 |
| OI-019 | data_state | **输入形态根本错配**：现行 wh-review 审的是冻结材料字节（materials JSON），不是 Git diff / worktree；OCR 类工具面向 diff/worktree。三选一决定审查**实际能看到什么** | `I-C-card-05-review-scope.md:336`；PRD FR-53 | open | 待定 |
| OI-020 | 接口对齐依赖 | **与 card-02 的边界对齐**：card-02 已提前完成「①build-plan 合并审查本体」与「适配合同的文档审查档」，CARD-05 承接工具选型与②③④；须显式对齐避免重复适配或漏掉对比实验 | `REQ-E-11`、`REQ-I-14`；card-02 DL:1193（= `specs/archive/workflowhub-thin-core-card-02-20260919/decision-log.md:1193`，F-09 全路径规范化）；方向审查 finding `F-6389631fd26c` | open | 待定 |


### OI 记录（解析器权威记录，YAML）

> 以下为 `analyzeDecisionOutline` 读取的 OI 权威记录（`parseOiYamlBlocks`：```yaml 围栏块内的单条映射）。
> 每条记录的 `source` / `question` 逐字复制自上表与本文件「新增 OI（Talk round 2 派生）」表；
> `category` 是六类固定类别之一，材料「类别」列原文保留在 `category_note`；
> `status` 由材料「状态」列归一化而来（原文保留在 `ledger_status_note`）；`outline_version` 记为 02（材料原文 outline_version=2，解析器要求字符串长度 > 1）。
> 未被终局处置的 OI 保持 `open`；未填写的终局字段见文末「未能满足的解析器字段（如实披露）」。
> **2026-09-22 终局处置落地（新增行）**：**31 条既有 OI** 已按本文件既有决定逐条给出终局处置（20 条 `confirmed` / 11 条 `deferred`，其中含 OI-025），并新增 OI-031（RF-19 派生）；逐条依据见文末「未能满足的解析器字段（如实披露）」`### 2′`。
> **（校正（gap B-8 第 1 条）：原表述为「**30 条既有 OI** 已…（**20 条 `confirmed` / 11 条 `deferred`**，其中含 OI-025），并新增 OI-031」——20 + 11 = **31 ≠ 30**，且与 `### 1′` 的「31 条 OI 记录」自相矛盾。按 `### OI 记录` 的 YAML 实际计数，既有 OI = **31 条**，原「30」为计数错误。）**
> **（2026-09-22 gap 修复补充：本次另新增 **OI-032**（card-02 入向义务承接）与 **OI-033**（unavailable 状态集合），解析器权威记录现为 **33 条**：**20 条 `confirmed` / 13 条 `deferred` / 0 条 `open`**；其中 OI-027 由 `deferred` 改判 `confirmed`（依 D-028，见该条记录），故 `confirmed` 仍为 20 条。）**
> **（2026-09-22 晚 OCR 委托模式端到端实验追加：本次另新增 **OI-034**（D-033 与 `verify-code` 面 `forbidden` 的冲突解法未定）与 **OI-035**（D-035 并集入账的执行契约未成文），解析器权威记录现为 **35 条**：**20 条 `confirmed` / 15 条 `deferred` / 0 条 `open`**。两条均为 `deferred`，故 `confirmed` 仍为 20 条。）**
> **（F-03 计数更正（2026-09-22 晚）：上面各行的 OI 计数全部为**历史层**。本文件唯一权威计数出处 = `## 未能满足的解析器字段（如实披露）` 的 `### 1′`；2026-09-22 晚实测：`grep -cE 'oi_id(:)'` = **35**，`grep '^status:' | sort | uniq -c` = **21 `status: 'confirmed'` / 14 `status: 'deferred'`**，故权威计数 = **35 条 = 21 `confirmed` / 14 `deferred` / 0 `open` / 0 `not_applicable`**。下面各层原文逐字保留。）**
> **（D-041 后当前计数）**：上行 21/14 是 OI-034 裁决前历史值；当前权威为 `### 1′` 的 35 = 22 confirmed / 13 deferred / 0 open。
```yaml
oi_id: 'OI-001'
task_id: 'workflowhub-thin-core-card-05-20260919'
outline_version: '02'
category: 'success_failure_boundary'
category_note: '材料「类别」列原文：background/problem'
source: '取证 s1 L2420/L2510/L6967/L2561；PRD FR-57、OI-013'
question: '审查失败的真实分布：route / 协议信封 / 材料身份 / provider 选择 各占多少？`unavailable` 是否被系统性误分类？'
status: 'confirmed'
ledger_status_note: '材料「状态」列原文：open'
ledger_disposition_note: '材料「终局处置」列原文：待定'
existing_material_pointer: '材料中已存在的相关处置（仅供闭合判定参考，不据此宣告闭合）：RF-09（机制根因）；取证总账与 P11（路由级拒绝记为 REVIEW_EXECUTION_FAILED、provider_attempts 为空）；失败占比分布未在材料中给出'
impact_dimensions: ["ordinary_detail"]
requires_user_decision: true
batch_id: 'Grill frontier 批次（G-3，D-021：P1–P13 闭环清单含 P11；2026-09-22 晚经同一任务追加修订扩为 P1–P18）'
selected_disposition: '采信 RF-09「历史失败规模」实测分布（49 个任务库：MATERIAL_INCOMPLETE 153、PROTOCOL_INCOMPATIBLE 80、PROVIDER_OUTPUT_INVALID 75、PUBLIC_RESULT_INVALID 52、OUTPUT_INVALID 42、MATERIAL_FORBIDDEN 38、EVIDENCE_ANCHOR_INVALID 20）与取证总账（s1 单会话 `unavailable` ×33；四会话合计约 13.4 亿 input token、0 条已发布 finding）；「`unavailable` 是否被系统性误分类」已有答案：P11 记录路由级拒绝被记为 `REVIEW_EXECUTION_FAILED` 且 `provider_attempts` 为空，导致下游二次失败。修复纳入 D-021 的闭环清单（原 P1–P13，**2026-09-22 经用户显式批准追加 P14 后为 P1–P14**）与 D-017 修复面（派发语义 / 启动自检 / 成本计量）；**2026-09-22 晚经同一任务追加修订扩为 P1–P18**（见 D-021 追加校正注）。'
evidence: 'RF-09（「历史失败规模」行、「阻断点」行——**校正：原引用为「唯一阻断点」行，该行标签已更正为「阻断点（≥3 处）」**）；取证总账（s1 `unavailable` ×33）；`## 7 个文档审查面的问题清单` P11；D-017 修复面；D-021 闭环清单（**现为 P1–P14**，见 D-021 校正）'
acceptance: '验收：派发 / 错误语义修复后，路由级拒绝不再以「`REVIEW_EXECUTION_FAILED` + 空 `provider_attempts`」记账（P11 所述缺陷的否命题），且不出现「派发被任一机器校验阻断」（`## 收敛检查` acceptance 行失败条件；对照 AC-58「派发无材料身份/哈希/快照/回执校验前置」）；失败判据=该错误组合再次出现在审查执行记录中'
counterexample_boundary: '反例边界：`## 收敛检查` acceptance 行失败条件明列「派发被任一机器校验阻断或输入依赖哈希/身份绑定」——该条件在 RF-16（step 6 blue 的 11 条 findings 被整体丢弃）与 RF-19（step 10 零派发、`REVIEW_HISTORY_UNAVAILABLE`）两次实测中均成立，故本条是「要求已定、现状未达」，不是「现状已合规」'
```

```yaml
oi_id: 'OI-002'
task_id: 'workflowhub-thin-core-card-05-20260919'
outline_version: '02'
category: 'data_state'
category_note: '材料「类别」列原文：background/problem'
source: '取证 s1 L11651（6h24m → `findings=[]`）；用户口述'
question: '审查成本与发现是否普遍脱钩？单次审查是否该有 token/时长预算与"零发现"的语义'
status: 'confirmed'
ledger_status_note: '材料「状态」列原文：open'
ledger_disposition_note: '材料「终局处置」列原文：待定'
existing_material_pointer: '材料中已存在的相关处置（仅供闭合判定参考，不据此宣告闭合）：取证总账（4 会话约 13.4 亿 input token、findings=0）；D-011（token 不作指标）；D-014（零发现判据）；RF-16（墙钟 444 s 基线）'
impact_dimensions: ["ordinary_detail", "acceptance"]
requires_user_decision: true
batch_id: 'Talk round 2 后半批（T-010，D-011）+ Talk round 3（T-013，D-014）+ Grill frontier 批次（G-3，D-021）'
selected_disposition: '「成本与发现脱钩」已实测成立：取证总账四会话约 13.4 亿 input token 而 findings=0；RF-16 在本卡自身材料上复现（blue 侧 10.5 分钟真实第三方算力产出 11 条 findings，被 `REVIEW_QUORUM_INCOMPLETE` 整体丢弃）。处置：**不新增 token/时间统计面**（D-021 不修项表「新增 token/时间统计面 = 不新建」，依据规划 DL D-15）；**token 不作指标**（D-011；RF-16 实测 `usage=null`——**校正后口径见 RF-16 基线登记：attempt.json 的 `usage` 键为 `null`（6/6）+ provider output **无该键**（5/5）+ broker state.json 记 `null`（6×）**，原表述「三层一致 null」为叙述性归纳，要引入 token 阈值须先修 `usage` 采集并登记为 build-plan 前置项）；「零发现」的语义由 D-014 非相对必要条件与 D-016 后果（质量账本区分「审了什么、丢了什么」）承担。'
evidence: '取证总账（四会话 input token 与 findings=0）；RF-16（控制臂：墙钟 444 s、25 原始 / 14 canonical / 11 丢弃、`usage=null`——**校正：原表述为「`usage=null` 三层一致」，实测口径为重写后的 RF-16 基线登记**）；D-011「token 不能作为指标」段；D-014（**经 D-026 收窄**）；D-016 后果；D-021 不修项表'
acceptance: '验收：零发现不得被读作通过——按 D-014（**2026-09-22 经 D-026 收窄**），OCR 臂须**至少产出 1 条 actionable finding**，否则判 no-go 并保留 fallback；账本须能区分「未派发」与「真无问题」（D-016 后果，对应 P9 缺陷）；失败判据=账本无法区分未派发与真无问题。**（校正（D-026 同步）：原 acceptance 逐字为「验收：零发现不得被读作通过——按 D-014，OCR 臂须「至少产出 1 条 actionable finding」**或有一份明确、可复核的「本材料确无问题」结论**，否则判 no-go；账本须能区分「未派发」与「真无问题」（D-016 后果，对应 P9 缺陷）；失败判据=**两臂都零 finding 仍判 go（D-011 风险）**，或账本无法区分未派发与真无问题」——两处均已失效：① 第二析取支「或有一份明确、可复核的『本材料确无问题』结论」**已由 D-026 删除**（原件逐字保留于 D-014 与 D-026 的留证）；② 失败判据「两臂都零 finding 仍判 go」在 D-026 之后**已不可达**（两臂都零发现现**直接判 no-go**），该 acceptance 在原形态下**两个方向都不可判真假**（可用已删分支逃逸 + 失败条件不可能触发）。故按 D-026 与本文件「可判真假」要求重写，原表述逐字保留于本注。）**'
counterexample_boundary: '反例边界：D-011 风险——纯相对阈值在「两臂都差」时仍会判 go（两臂都零 finding 则「不差于」成立），由 D-014 收窄后的非相对必要条件堵住（**校正：原表述为「由 D-014 的非相对必要条件堵住」；D-014 的第二析取支已由 D-026 删除，「两臂都零发现」现直接判 no-go**）；D-014 风险——若实验材料本身无缺陷会误判 no-go，规避=选一个已知含缺陷的真实任务；RF-16 证据限制 ①——`usage=null`（**校正：原表述为「三层一致」**），token 阈值当前不可用'
```

```yaml
oi_id: 'OI-003'
task_id: 'workflowhub-thin-core-card-05-20260919'
outline_version: '02'
category: 'complete_user_flow'
category_note: '材料「类别」列原文：goal/solution'
source: '规划 DL L53（U-001#5）、L586；PRD FR-22/FR-26/AC-22'
question: '新工具选型：OCR 是否入选、对照臂是谁、是否允许多候选。'
context: 'OCR 已在 U-001#5 被用户点名；既有调查记录为「锁定 SHA 源码已核接口能力，真实效果 unknown」（RF-08 M4：该 SHA 在仓内查不到，本卡不采信）'
status: 'deferred'
ledger_status_note: '材料「状态」列原文：open'
ledger_disposition_note: '材料「终局处置」列原文：待定'
existing_material_pointer: '材料中已存在的相关处置（仅供闭合判定参考，不据此宣告闭合）：D-004（OCR 委托模式接入形态）；D-009/D-019（finding schema）；RF-15（rule schema 已解）；D-006（范围）'
impact_dimensions: ["ordinary_detail"]
requires_user_decision: true
batch_id: 'Talk round 2（T-005，D-006：新工具接入 + 对比实验 + go/no-go + fallback 属本卡范围）'
owner: '本卡 build-plan（实验设计与适配合同冻结）→ build-code 阶段对比实验（D-022 前瞻臂）'
trigger_condition: '对比实验数据产出后按 D-011 相对阈值 + D-014 非相对必要条件判 go/no-go 时'
scope_boundary: '选型结论三项：OCR 是否入选、对照臂是谁、是否允许多候选；不含已定的接入形态（D-004 委托模式）与已定的控制臂语料（RF-16 语料 #0 / D-022 回溯臂 + 前瞻臂）'
impact: 'D-004 只定接入形态，未预设 OCR 必入选（RF-08 M5「OCR 仅候选，选型由对比实验 go/no-go 定」）；结论未出则审查链是否真被替换为 OCR 委托模式未定，no-go 时保留 fallback（D-006）'
follow_up_acceptance: '完成条件（取自本 OI 问题三项 + 材料已有判据，非新增事实）：产出 go/no-go 结论，判据为 D-011「findings 有效率 / 锚定准确率 / 耗时 不差于 wh-review 实测基线（RF-16）」+ D-014 非相对必要条件；失败判据=无阈值即下接入结论（AC-55）'
```

```yaml
oi_id: 'OI-004'
task_id: 'workflowhub-thin-core-card-05-20260919'
outline_version: '02'
category: 'success_failure_boundary'
category_note: '材料「类别」列原文：solution'
source: 'PRD FR-54/AC-55'
question: 'go/no-go 阈值三件套（findings 有效率 / 锚定准确率 / 耗时阈值）的具体数值与测量方法'
status: 'confirmed'
ledger_status_note: '材料「状态」列原文：open'
ledger_disposition_note: '材料「终局处置」列原文：待定'
existing_material_pointer: '材料中已存在的相关处置（仅供闭合判定参考，不据此宣告闭合）：D-011（相对阈值 + RF-16 基线值）；D-014（非相对必要条件）'
impact_dimensions: ["acceptance"]
requires_user_decision: true
batch_id: 'Talk round 2 后半批（T-010，D-011）+ Talk round 3（T-013，D-014）'
selected_disposition: 'go/no-go 阈值三件套取相对形式（D-011）：findings 有效率 / 锚定准确率 / 耗时**不差于 wh-review 实测基线**；**基线集合** = ① **文档方向面基线**（RF-16 控制臂实测：墙钟 444 s、6 次 provider 派发、25 原始 finding / 14 canonical、锚定 25/25 `evidence_anchor_valid=true`）**并** ② **一条真实代码 diff 面的 wh-review 实跑基线**（**D-031（2026-09-22 用户裁决）新增**：只凭文档面基线无法回答声明 4 在代码面上的问题；该实跑按 **D-042 当前裁决**由 build-code 在 P2 真实 diff 后、P3 切路由前采集；build-plan 只冻结实验设计与同型输入。本句原先将执行归 build-plan 的口径为 D-031 历史层）。并追加一条非相对必要条件（D-014，**2026-09-22 经 D-026 收窄**）：OCR 臂必须**至少产出 1 条 actionable finding**，否则判 no-go 并保留 fallback。**token 不能作为指标**（D-011；`usage` 采集口径见 D-011 校正）。**（校正：原 selected_disposition 逐字为「go/no-go 阈值三件套取相对形式（D-011）：findings 有效率 / 锚定准确率 / 耗时**不差于 wh-review 实测基线**，基线以 RF-16 控制臂实测值为准（墙钟 444 s、6 次 provider 派发、25 原始 finding / 14 canonical、锚定 25/25 有效 0 丢弃）；并追加一条非相对必要条件（D-014）：OCR 臂必须至少产出 1 条 actionable finding，**或有明确、可复核的「本材料确无问题」结论**，否则判 no-go 并保留 fallback。**token 不能作为指标**（D-011；RF-16 `usage=null` 三层一致）。」——四处逐条更正：① **「锚定 25/25 有效 0 丢弃」中的「0 丢弃」无机器记录**（三份 `attempt.json` 均**不存在** `discarded_facts` / `unanchored_finding_dropped` 键），已从基线取值移除（可核验部分「锚定 25/25 `evidence_anchor_valid=true`」保留）；② D-014 的第二析取支**已由 D-026 删除**；③ 基线**只有文档面**、与 D-022/D-023 的代码 diff 候选面**不同型**，按 D-031 补代码面基线；④ 「`usage=null` 三层一致」的实测形态是「attempt.json 6/6 `null` + provider output 5/5 **无该键** + broker state.json 6× `null`」，不是「三层一致」。）**'
evidence: 'T-010 用户答复「③全相对（对比 wh-review 基线）」；T-013 用户答复「①加一条非相对必要条件」；D-011（含基线数值与风险）；D-014（**经 D-026 收窄**）；RF-16（文档面基线实测值）；D-031（必须补一条真实代码 diff 面基线）；D-042（执行时点改为 build-code 的 P2 后、P3 切路由前）'
acceptance: '验收：三个指标的相对判据 + 一条非相对必要条件在实验前写死且可判真假（AC-55「阈值在实验前写死并对照得出 go/no-go」）；**且 build-plan 冻结同型 diff 与公式，build-code 在 P2 后、P3 切路由前采集一条真实代码 diff 面的 wh-review 基线（D-031 经 D-042 修正时点，测量字段与 RF-16 同口径）**；失败判据=无阈值即下接入结论（AC-55 失败条件），或只用文档面基线对照代码面候选臂（不同型对照，D-031 失败判据）'
counterexample_boundary: '反例边界：D-011 风险「两臂都差仍判 go」由 D-014（**经 D-026 收窄**）堵住；D-014 风险「实验材料确无缺陷会误判 no-go」，规避=实验材料选一个已知含缺陷的真实任务；RF-16 证据限制 ①——无 token 计量，要引入 token 阈值须先修 `usage` 采集；**D-042**——P3 已切路由后不得再声称从该面取得切换前旧路基线；**D-031**——代码面基线可能因旧链路自身缺陷（P1/P3/P14）在基线上跑不出结果，那本身即如实事实，**不得用文档面基线替代**'
```

```yaml
oi_id: 'OI-005'
task_id: 'workflowhub-thin-core-card-05-20260919'
outline_version: '02'
category: 'data_state'
category_note: '材料「类别」列原文：data_state'
source: 'PRD FR-53/AC-54'
question: '适配合同输入形态三选一：`diff` / `worktree` / `packet`'
status: 'confirmed'
ledger_status_note: '材料「状态」列原文：open'
ledger_disposition_note: '材料「终局处置」列原文：待定'
existing_material_pointer: '材料中已存在的相关处置（仅供闭合判定参考，不据此宣告闭合）：D-002（选定 packet，含取舍/被否方案/失效条件）；RF-04'
impact_dimensions: ["ordinary_detail"]
requires_user_decision: true
batch_id: 'Talk round 1（T-002，D-002）'
selected_disposition: '适配合同的输入形态选定为 `packet`——由 workflowhub 组包，内容包含需求 + 设计 + 代码改动（diff）+ 被引用到的现有代码（D-002）；被否方案 `diff`（结构上看不到需求与周边代码，与用户目标 2 直接矛盾）与裸 `worktree`（成本不可控，且需工具原生支持）。'
evidence: 'T-002 用户答复「③packet：自己打包（需求+设计+diff+相关代码）」；D-002（含取舍 / 被否方案 / 失效条件）；RF-04（packet 形态可行性一手实测）'
acceptance: '验收：适配合同显式定义 packet 组成规则与交付形态（D-002 风险原文）；**（校正：原 acceptance 逐字为「验收：适配合同显式定义 packet 组成规则与体积上限（D-002 风险原文；现行 `REVIEW_PACKET_MAX_DELIVERY_BYTES = 2 MiB` 整包无裁剪）；失败判据=包组不全即漏检（规划 decision-log L787/L790 已记录的既存真实缺陷）」——2026-09-22 独立替代审查取证：全仓（排除 node_modules）grep `REVIEW_PACKET_MAX_DELIVERY_BYTES` **零定义**，唯一出现是 `docs/adr/0031-review-check-downgrade-and-identity-boundary.md:50` 对 `review-materials.mjs:2218` 的过期指针（该文件现 2191 行），仓内不存在任何 2 MiB 常量，该常量是**幽灵常量**；故只把「与体积上限（…整包无裁剪）」改为「与交付形态」（其余逐字不变），体积上限的现行事实见 D-013 与 OI-025 校正。）** 失败判据=包组不全即漏检（规划 decision-log L787/L790 已记录的既存真实缺陷）'
correction_note: '2026-09-22 独立替代审查 H4：本条原引用幽灵常量 REVIEW_PACKET_MAX_DELIVERY_BYTES 作为现行机制描述，已更正并留原表述。'
counterexample_boundary: '反例边界：D-002 失效条件——「若 R-Q1-c 证明 packet 无法同时覆盖文档审查与代码审查两类，本决策须拆为分档形态并重新确认」；RF-04 结论为该失效条件未触发但存在偏差：「相关现有代码」的选取权在 OCR 侧、不在 WorkflowHub 侧，须在适配合同中写明或调整'
```

```yaml
oi_id: 'OI-006'
task_id: 'workflowhub-thin-core-card-05-20260919'
outline_version: '02'
category: 'data_state'
category_note: '材料「类别」列原文：data_state'
source: 'PRD FR-53/AC-54'
question: 'finding schema 四要素（严重度、文件/行号锚定、证据、建议）的具体字段与严重度取值域'
status: 'confirmed'
ledger_status_note: '材料「状态」列原文：open'
ledger_disposition_note: '材料「终局处置」列原文：待定'
existing_material_pointer: '材料中已存在的相关处置（仅供闭合判定参考，不据此宣告闭合）：D-009（先用 OCR 原生 schema）；D-012/D-019（证据四要素与锚点硬校验）'
impact_dimensions: ["ordinary_detail"]
requires_user_decision: true
batch_id: 'Talk round 2（T-008，D-009）+ Grill frontier 批次（G-1，D-019）'
selected_disposition: '对比实验阶段先用 OCR 原生 finding schema（`path` / `start_line` / `end_line` / `category` / `severity` 4 级，不叠加 wh-review 的强制证据字段），是否引入证据强制留作 go/no-go 数据出来后再定（D-009）；最终 finding schema 以 OCR `LlmComment` 为骨架（`path` / `content` / `start_line` / `end_line` / `category` / `severity`）并按 D-012 补强制证据字段、**并按 AC-54 补入「建议」字段（`suggestion_code`，必填自由文本，受证据纪律约束）**，由 workflowhub 定义与校验（D-019）。严重度取值域（critical / high / medium / low）与字段名有二进制级权威来源（G-CK）；`suggestion_code` 的**字段名**有二进制级证据，**取值域无一手证据**（按自由文本登记，证据等级见六要素对照节）。**（校正：原 selected_disposition 逐字为「…并按 D-012 补强制证据字段，由 workflowhub 定义与校验（D-019）。严重度取值域（critical / high / medium / low）与字段名有二进制级权威来源（G-CK）。」——原表述不含建议字段，而本条问题原文本身就把「建议」列为 schema 四要素之一，故属点名未落地；本次按 AC-54 补齐。）**'
evidence: 'T-008 用户答复「②先用 OCR 原生 schema 跑实验」；G-1 用户答复「以 OCR LlmComment 为骨架 + 补证据」；D-009；D-019（含被否方案：不复用 wh-review schema、不双写）；G-CK（finding 字段名权威来源 / 委托模式不产出 schema）；RF-03（严重度 4 级 + category 枚举）；母 PRD FR-53 / AC-54（schema 四要素含建议）；本次六要素逐条核对（补入建议字段）'
acceptance: '验收：schema 与锚点硬校验由 workflowhub 自行实现（D-019 风险原文「锚点硬校验（path 存在 + line ≤ 实际行数）须自行实现——不得因为 OCR 不管就省掉」，保留 wh-review 的 `unanchored_finding_dropped` 能力）；且**六要素中的 finding schema 四要素齐备**（严重度 / 文件或行号锚定 / 证据 / **建议**）；失败判据=锚点无效的 finding 未被丢弃、或未被记账，或任一 schema 要素（含建议）在接入时仍未冻结（AC-54 失败场景）'
counterexample_boundary: '反例边界：D-009 风险——实验臂测得的是「OCR 原生质量」而证据纪律缺席，须把「证据字段有无」登记为实验已知差异项、不计入 go/no-go 阈值，不得事后读成「证据纪律不必要」；RF-03 迁移结论——OCR `LlmComment` 只有 `content` + 位置、无任何证据字段，证据纪律属迁移损失'
```

```yaml
oi_id: 'OI-007'
task_id: 'workflowhub-thin-core-card-05-20260919'
outline_version: '02'
category: 'complete_user_flow'
category_note: '材料「类别」列原文：complete_user_flow'
source: 'PRD SD-07/FR-23；用户要求"所有审查"'
question: 'SD-07 四个审查落点是否全部换新工具；make-decision 的方向/细节建议审查是否同批替换'
status: 'confirmed'
ledger_status_note: '材料「状态」列原文：open'
ledger_disposition_note: '材料「终局处置」列原文：待定'
existing_material_pointer: '材料中已存在的相关处置（仅供闭合判定参考，不据此宣告闭合）：D-006 + T-005（只做②③④，文档审查点不改）'
impact_dimensions: ["scope"]
requires_user_decision: true
batch_id: 'Talk round 2（T-005，D-006）+ Talk round 3（T-016，D-018）'
selected_disposition: 'SD-07 四个审查落点**不是全部换新工具**：本卡范围 = ②③④ 代码审查点（build-code 每 phase、全 phase 集成、verify-code 终末代码审查）替换 + 新工具接入 + 对比实验 + go/no-go + fallback；文档审查点（make-decision 方向/细节建议、build-spec）本卡不改（D-006）。后经 D-018 扩大为「3 个代码面替换 + 7 个文档面问题修复 + wh-review 阻塞类问题彻底一并解决」，但**文档面仍不替换工具**，走 D-017 修好的审查层契约。① build-plan 合并审查本体由 card-02 提前完成，本卡不重做（RF-06）。（D-023 更新（2026-09-22 用户裁决）：CF-2 已 RESOLVED——`build-code/integration` 的送审合同改为真实 diff 审查，故本卡被替换的 3 个代码面即 3 个真实 diff 面。）'
evidence: 'T-005 用户答复「①『②③④ 代码审查点 + 工具接入/实验』」；T-016 用户逐字范围扩大指令；D-006；D-017；D-018；RF-06（card-05 范围权威界定）；RF-11（10 个审查面只有 3 个是代码 diff）'
acceptance: '验收：RF-06 用户纠偏原文要求达成——「4 个审查点 + 工具接入 + 对比实验 + go/no-go + fallback」，既不把 ① 重做、也不写成范围重分配（D-006 后果）；失败判据=文档审查点被静默替换，或 ① 被重做，或范围偏离未登记'
counterexample_boundary: '反例边界：D-006 风险——用户声明 1/2「所有审查」「审查需求或技术设计」在本卡**不完整满足**，须在阶段末遗漏披露中如实列出；D-018 后果——范围扩大是对母 PRD CARD-05 范围节的显式偏离，「不得静默执行」，须在 build-spec 与阶段末遗漏披露中登记'
```

```yaml
oi_id: 'OI-008'
task_id: 'workflowhub-thin-core-card-05-20260919'
outline_version: '02'
category: 'complete_user_flow'
category_note: '材料「类别」列原文：complete_user_flow'
source: '用户明确要求；`config.json`'
question: '委托模式如何消费 `config.json` 的 build-code/verify-code `initial[]`：谁指挥、谁执行、异源规则怎么算'
status: 'confirmed'
ledger_status_note: '材料「状态」列原文：open'
ledger_disposition_note: '材料「终局处置」列原文：待定'
existing_material_pointer: '材料中已存在的相关处置（仅供闭合判定参考，不据此宣告闭合）：D-007 + T-006（每路一独立子代理各绑一 provider）；D-008（只读 config 既有键）'
impact_dimensions: ["ordinary_detail"]
requires_user_decision: true
batch_id: 'Talk round 2（T-006，D-007；T-007，D-008）'
selected_disposition: '委托模式下**每一路审查 = 一个独立子代理，各绑定 `config.json` 中 `wh_review.stages.<stage>.initial[]` 的一个 provider**；多路并发，任一成功即通过（D-007 + D-005）。谁指挥=workflowhub 侧逐路派发；谁执行=绑定 provider 的独立子代理；异源规则=以 any-of-N 取代现行 `minimum_heterologous` 的 quorum 语义，已完成的审查一律降级使用、不丢弃（D-005）。config 只读既有键、不改结构与键（D-008）。'
evidence: 'T-006 用户答复「①『每路 = 一个独立子代理，各绑一个 provider』」；T-007 用户答复「①「不改 config 结构，只读现有键」」；D-005；D-007（含后果：对现行派发与聚合语义的替换，不是配置调整）；D-008；RF-09（`initial[]` 真实语义 = 必须全部可派发，任一未配置即整条 `ROUTE_UNAVAILABLE` 且零派发；**该机制事实的因果归因已按 RF-09 行校正更正——不得再读作「直接解释 session1 的 host_provider 错误串」**）'
acceptance: '验收：派发按 provider 逐路独立、任一成功即通过，不出现 RF-09/s1 那种「整组请求失败即零派发」，也不出现已完成审查被丢弃（D-005 后果）；失败判据=出现 quorum 丢弃或整条 route fail-closed'
counterexample_boundary: '反例边界：D-007 风险——现行机制只有 broker group request，**无 per-provider 子代理派发能力**，须在 build-plan 明确实现载体（OI-022）；D-005 风险 (a)——any-of-N 降低独立性强度，单源 findings 必须以 `independence: partial` 类标注如实记录，**不得把单源结果写成多源已核**'
```

```yaml
oi_id: 'OI-009'
task_id: 'workflowhub-thin-core-card-05-20260919'
outline_version: '02'
category: 'success_failure_boundary'
category_note: '材料「类别」列原文：success_failure_boundary'
source: 'PRD SD-08/FR-25/AC-25'
question: '工具 unavailable 三档路径（替代审查 / unverified / 不阻断）如何落地且不冒充已审'
status: 'confirmed'
ledger_status_note: '材料「状态」列原文：open'
ledger_disposition_note: '材料「终局处置」列原文：待定'
existing_material_pointer: '材料中已存在的相关处置（仅供闭合判定参考，不据此宣告闭合）：D-005（any-of-N）+ D-010（全新上下文 + 可读仓库兜底）'
impact_dimensions: ["acceptance"]
requires_user_decision: true
batch_id: 'Talk round 1（T-003，D-005）+ Talk round 2（T-009，D-010）+ Talk round 2 后半批（T-012，D-013）'
selected_disposition: '三档路径落地为：① 多路异源审查并发执行、任一成功即视为审查通过（any-of-N，D-005），不放弃审查；② 异源审查失败时以**全新上下文、且必须能读仓库代码**的独立子代理兜底（D-010）；③ 取消一切 fail-closed 的体积上限、任何情况下不因体积在派发前阻断（D-013）。不可用不阻断推进，但**不冒充已审**——按 SD-08 如实记 `unverified` 并披露缺口。'
evidence: 'T-003 用户答复（「不能放弃审查……只要有一个成功了，审查就算通过了」）；T-009 用户答复「①「全新上下文 + 必须能读仓库代码」」；T-012 用户答复「②「彻底取消任何上限，不分片」」；D-005；D-010；D-013；AC-25'
acceptance: '验收：AC-25——不可用时由未参与实现者完成替代审查并记录来源与缺口；失败判据（`## 收敛检查` acceptance 行）——不可用或缺审查被写成通过/已审，或无限重派'
counterexample_boundary: '反例边界：D-005 风险 (b)——「子代理审查总能成功」的安全性假设与取证事实冲突：s4 的 4 个审查子代理全部 `fork_turns="all"`、继承实现者约 400K 上下文，16 个 finding 无一关于本卡业务逻辑且漏掉最大缺陷长达 2 小时（见 OI-021）；D-010 风险——「能读仓库」放大上下文成本，须与 packet 体积上限一起设计'
```

```yaml
oi_id: 'OI-010'
task_id: 'workflowhub-thin-core-card-05-20260919'
outline_version: '02'
category: 'success_failure_boundary'
category_note: '材料「类别」列原文：success_failure_boundary'
source: '取证 s1 L2561'
question: '审查失败的错误语义契约：`ROUTE_UNAVAILABLE` 与 `REVIEW_EXECUTION_FAILED` 分离；`provider_attempts` 为空的下游兼容'
status: 'deferred'
ledger_status_note: '材料「状态」列原文：open'
ledger_disposition_note: '材料「终局处置」列原文：待定'
existing_material_pointer: '材料中已存在的相关处置（仅供闭合判定参考，不据此宣告闭合）：D-016（丢弃事实记账）；P11 已定位（路由级拒绝记为 REVIEW_EXECUTION_FAILED、provider_attempts 为空）'
impact_dimensions: ["ordinary_detail"]
requires_user_decision: true
batch_id: 'Grill 结束记录 failure_semantics（残留 OI-010：不改变方向，已记负责人与完成条件）+ 移交批次（`## 收敛检查`「未决项处置」原文：移交 build-spec / build-plan，各自带负责人与完成条件）'
owner: 'build-plan（`## 收敛检查`「未决项处置」移交 build-spec / build-plan）'
trigger_condition: 'build-plan 落地 D-017 修复面（派发语义 / 启动自检）时；`## Grill 结束记录` 的 `failure_semantics` 已把本项记为残留项「不改变方向，已记负责人与完成条件」'
scope_boundary: '错误语义契约两项：`ROUTE_UNAVAILABLE` 与 `REVIEW_EXECUTION_FAILED` 分离；`provider_attempts` 为空时的下游兼容（OI-010 问题原文）；不含问题定位（已完成：P11）'
impact: 'P11 记录该错误组合（路由级拒绝记为 `REVIEW_EXECUTION_FAILED`、`provider_attempts` 为空）导致下游二次失败；不改变 D-005/D-017 定的方向'
follow_up_acceptance: '完成条件（取自本 OI 问题本身，非新增事实）：`ROUTE_UNAVAILABLE` 与 `REVIEW_EXECUTION_FAILED` 的分离规则、以及空 `provider_attempts` 的下游兼容规则，在 build-plan 中写成明文契约；失败判据=该错误组合仍导致下游二次失败（P11 原文）'
```

```yaml
oi_id: 'OI-011'
task_id: 'workflowhub-thin-core-card-05-20260919'
outline_version: '02'
category: 'success_failure_boundary'
category_note: '材料「类别」列原文：success_failure_boundary'
source: 'PRD FR-24/AC-24'
question: '单次审查成功不复审（FR-24）与"发现照单修复"的执行边界：修完是否需要任何确认'
status: 'confirmed'
ledger_status_note: '材料「状态」列原文：open'
ledger_disposition_note: '材料「终局处置」列原文：待定'
existing_material_pointer: '材料中已存在的相关处置（仅供闭合判定参考，不据此宣告闭合）：D-003（严格单次 + verify-code 功能验收兜底）'
impact_dimensions: ["acceptance"]
requires_user_decision: true
batch_id: 'Talk round 1（T-004，D-003）'
selected_disposition: '**严格单次审查**：一次审查成功后不为同一 scope 复审；发现照单修复；不建 severity 门槛与复审循环；「修复是否正确」由 verify-code 的真实入口功能验收兜底，**不新增审查点**（D-003）。即「修完是否需要确认」的答案是：不设审查确认，靠 verify-code 功能验收。'
evidence: 'T-004 用户答复「①严格单次，靠 verify-code 功能验收兜底」；D-003（含后果与风险）；规划 DL L819 用户原话'
acceptance: '验收：AC-24——同 scope 无复审记录、修复有记录；失败判据（`## 收敛检查` acceptance 行）——出现复审循环或按 severity 门槛搁置发现'
counterexample_boundary: '反例边界：D-003 后果 / 风险——纯代码质量类问题（坏味道、死代码、不影响功能的缺陷）在修复后无人复核，属用户显式接受的风险，材料明写「不另行补偿」'
```

```yaml
oi_id: 'OI-012'
task_id: 'workflowhub-thin-core-card-05-20260919'
outline_version: '02'
category: 'data_state'
category_note: '材料「类别」列原文：data_state'
source: 'PRD SD-17/FR-53'
question: '审查事实写入位置与命名：现有 `quality/reviews/` 是否保留、不用内容寻址哈希'
status: 'confirmed'
ledger_status_note: '材料「状态」列原文：open'
ledger_disposition_note: '材料「终局处置」列原文：待定'
existing_material_pointer: '材料中已存在的相关处置（仅供闭合判定参考，不据此宣告闭合）：D-020（沿用 quality/reviews/ + 不可变命名）；L927 记「已由 D-020 解决」，L912 仍列入未决项清单（材料内部不一致，两处原文均保留未改）'
impact_dimensions: ["ordinary_detail"]
requires_user_decision: true
batch_id: 'Grill frontier 批次（G-2，D-020）'
selected_disposition: '**沿用 `quality/reviews/` 目录位置，文件名改用不可变命名「日期+序号+描述」**（append-only、纯文本路径引用、**不用内容寻址哈希**）（D-020）；旧文件保留只读，新文件按新命名，历史文件名与新命名并存属已披露的过渡状态。'
evidence: 'G-2 用户答复「沿用 `quality/reviews/` 但改命名规范」；D-020（含后果与风险）；材料内部不一致两处原文均保留：`## 已选方向` 未决项清单仍列 OI-012，`## 收敛检查`「未决项处置」记「OI-012（已由 D-020 解决）」'
acceptance: '验收：新文件按「日期+序号+描述」不可变命名、旧文件只读（D-020）；失败判据=出现内容寻址哈希命名，或同一事实产生两个权威文件（D-020 原因）'
counterexample_boundary: '反例边界：D-020 风险——改名会让历史文件名不一致，须在适配合同中写明命名规范与旧文件只读边界，否则新旧命名并存会被读成「两个权威文件」'
```

```yaml
oi_id: 'OI-013'
task_id: 'workflowhub-thin-core-card-05-20260919'
outline_version: '02'
category: 'non_goals'
category_note: '材料「类别」列原文：non_goals'
source: 'PRD 范围节'
question: '明确不做：wh-review 物理删除（CARD-06）、审查基建并发修复（CARD-09）、减少审查次数'
status: 'confirmed'
ledger_status_note: '材料「状态」列原文：open'
ledger_disposition_note: '材料「终局处置」列原文：待定'
existing_material_pointer: '材料中已存在的相关处置（仅供闭合判定参考，不据此宣告闭合）：D-018 边界 + D-021 不修项与归属卡（wh-review 物理删除、身份/哈希机制移除归 CARD-06）'
impact_dimensions: ["scope"]
requires_user_decision: true
batch_id: 'Talk round 3（T-016，D-018）+ Grill frontier 批次（G-3，D-021）'
selected_disposition: '明确不做（非本卡范围）：wh-review **物理删除**归 CARD-06；身份/哈希/快照/材料/回执校验机制的**移除**归 CARD-06；审查基建**并发上限数值**归 CARD-09②；**不新增固定审查轮次**（AC-23 失败判据）。依据：D-018「边界（不变）」段 + D-021「本卡不修项与归属卡」表 + D-017。'
evidence: 'T-016 用户逐字范围指令；G-3 用户答复「闭环清单 + 显式列出不修项与归属卡」；D-018「边界（不变）」段；D-021 不修项与归属卡表；D-017（身份/哈希/回执机制移除与 wh-review 物理删除仍归 CARD-06）'
acceptance: '验收：D-021 不修项表逐项有归属卡、且本卡不触碰这些面；失败判据=本卡内出现 wh-review 物理删除、身份/哈希/快照/材料/回执机制移除、改并发上限数值，或新增固定审查轮次（D-018 边界 + AC-23 失败判据）'
counterexample_boundary: '反例边界：D-021 风险——「清单若列漏，后续发现需走显式追加流程」；RF-19 新增的 P14（审查历史绑定锁死后续审查）原属超出 D-021「P1–P13 闭环清单」的事项，按 D-021 原文「超出即须用户显式追加」——**2026-09-22 用户已显式批准追加 P14（闭环清单现为 P1–P14）**，该追加由用户决定作出（校正：原表述为「尚待用户显式追加」；追加后 P14 的缺陷现存事实不因此改变，不得读作已修复）；**2026-09-22 晚经同一任务追加修订扩为 P1–P18（追加 P15–P18，见 D-021 追加校正注与 D-032~D-036）**'
```

```yaml
oi_id: 'OI-014'
task_id: 'workflowhub-thin-core-card-05-20260919'
outline_version: '02'
category: 'deferred'
category_note: '材料「类别」列原文：deferred'
source: 'PRD SD-14、共享资源冲突'
question: '与 CARD-09 审查基建写面的协调时点与集成责任归属'
status: 'deferred'
ledger_status_note: '材料「状态」列原文：open'
ledger_disposition_note: '材料「终局处置」列原文：待定'
existing_material_pointer: '材料中已存在的相关处置（仅供闭合判定参考，不据此宣告闭合）：D-017 后果（与 CARD-06 写面重叠，按 SD-14 错时或分面合并）'
impact_dimensions: ["scope"]
requires_user_decision: true
batch_id: 'D-017 后果（与 CARD-06 删除面重叠，按 SD-14 错时或分面合并）+ 移交批次（`## 收敛检查`「未决项处置」原文：移交 build-spec / build-plan，各自带负责人与完成条件）'
owner: 'build-plan（SD-14 协调 + SD-11 并行声明制；`## 收敛检查`「未决项处置」移交 build-spec / build-plan）'
trigger_condition: 'CARD-09 审查基建写面开始改动或其接口冻结时，按 SD-14「先冻结接口的一方为集成责任方」确定集成方（D-017 后果）'
scope_boundary: '与 CARD-09 审查基建写面的协调时点与集成责任归属；不含 CARD-09② 的并发上限数值本身（D-021 不修项表已归 CARD-09）'
impact: 'D-017 修复面（派发语义 / 聚合语义 / 超时与取消 / 启动自检 / 成本计量）与 CARD-06 删除面、CARD-09 写面重叠，不错时或分面合并会产生双写与重复适配（D-017 后果 / D-018 风险）'
follow_up_acceptance: '完成条件（取自本 OI 问题 + 材料已有规则，非新增事实）：协调时点与集成责任方成文，且修复面与 CARD-06/CARD-09 写面按 SD-14 错时或分面合并、无双写；失败判据=出现同一写面两方同时改（D-018 风险「须逐项协调」）'
```

```yaml
oi_id: 'OI-015'
task_id: 'workflowhub-thin-core-card-05-20260919'
outline_version: '02'
category: 'complete_user_flow'
category_note: '材料「类别」列原文：goal/extension'
source: '用户明确要求'
question: '审查**内容**质量契约（不只换工具）：如何让审查发现需求漏洞、边界情况、与现有代码的意外交互'
status: 'confirmed'
ledger_status_note: '材料「状态」列原文：open'
ledger_disposition_note: '材料「终局处置」列原文：待定'
existing_material_pointer: '材料中已存在的相关处置（仅供闭合判定参考，不据此宣告闭合）：D-012 + T-011（rubric 四要素）'
impact_dimensions: ["acceptance"]
requires_user_decision: true
batch_id: 'Talk round 2 后半批（T-011，D-012）'
selected_disposition: '审查 rubric **必须同时具备四要素**：①清单覆盖（需求保真 / 边界情况 / 失败路径 / 与现有代码的交互 / 测试有效性 / 安全）；②每条 finding 强制 file:line 与可复现证据；③4 级严重度；④每轮 finding 条数上限（D-012）。审查质量标准由 workflowhub 自己拥有，不再依赖工具内建规则。'
evidence: 'T-011 用户答复「①『清单覆盖 + 强制证据 + 严重度 + 限量』」；D-012（含后果与风险）；RF-15（实测可注入任意 rubric：`rules[].rule` 内联文本，含文档 rubric）；RF-02（OCR 内建规则纯代码导向、无 markdown 规则）'
acceptance: '验收：四要素齐备且可经 RF-15 实测的 rule.json 路径注入（`rules:[{path, rule}]` 内联文本）；失败判据（`## 收敛检查` acceptance 行）——出现按 severity 门槛搁置发现，或 rubric 缺任一要素'
counterexample_boundary: '反例边界：D-012 风险——清单会诱导「为填满而报」、条数上限可能漏掉真问题，两项均须在实验设计中作为观察项登记；RF-15 陷阱——`ocr rules check` 恒 EXIT=0、退出码零信息量，接入校验不得依赖退出码'
```

```yaml
oi_id: 'OI-016'
task_id: 'workflowhub-thin-core-card-05-20260919'
outline_version: '02'
category: 'deferred'
category_note: '材料「类别」列原文：deferred'
source: 'card-07 设计中'
question: '与 card-07（make-decision 改造）的写面/时机接口对齐'
status: 'deferred'
ledger_status_note: '材料「状态」列原文：open'
ledger_disposition_note: '材料「终局处置」列原文：待定'
existing_material_pointer: '材料中已存在的相关处置（仅供闭合判定参考，不据此宣告闭合）：D-022/G-4（实验语料）；与 card-07 的接口对齐待 build-plan'
impact_dimensions: ["ordinary_detail"]
requires_user_decision: true
batch_id: '移交批次（`## 收敛检查`「未决项处置」原文：移交 build-spec / build-plan，各自带负责人与完成条件）'
owner: 'build-plan（`## 收敛检查`「未决项处置」移交 build-spec / build-plan）'
trigger_condition: 'card-07（make-decision 改造）的写面与时机接口确定时（OI-016 来源记为「card-07 设计中」）'
scope_boundary: '与 card-07 的写面 / 时机接口对齐；不含本卡已定的 make-decision 审查路径（RF-14 用户裁定；RF-16 / RF-19 实测）'
impact: '若不对齐，make-decision 材料的写面与审查时机可能在两卡间产生双写或时机错配（OI-016 问题原文）'
follow_up_acceptance: '完成条件（取自本 OI 问题本身，非新增事实）：写面与时机接口在 build-plan 成文，且不产生双写（AGENTS.md 明令禁止新增双写）；失败判据=同一写面两卡同时改，或审查时机错配'
```

```yaml
oi_id: 'OI-017'
task_id: 'workflowhub-thin-core-card-05-20260919'
outline_version: '02'
category: 'complete_user_flow'
category_note: '材料「类别」列原文：complete_user_flow'
source: '声明 1/2；PRD FR-23/SD-07；card-02 OI-011'
question: '**改造范围边界**：U-001#5 只点名 build-code / verify-code 两个审查点；用户现要求「所有审查」。make-decision 的方向/细节建议审查、build-spec 审查是否同批替换？'
status: 'confirmed'
ledger_status_note: '材料「状态」列原文：open'
ledger_disposition_note: '材料「终局处置」列原文：待定'
existing_material_pointer: '材料中已存在的相关处置（仅供闭合判定参考，不据此宣告闭合）：D-006 + T-005 + D-018（范围扩大）'
impact_dimensions: ["scope"]
requires_user_decision: true
batch_id: 'Talk round 2（T-005，D-006）+ Talk round 3（T-016，D-018）'
selected_disposition: '改造范围边界已定：**不是**把 make-decision 方向/细节建议审查与 build-spec 审查同批替换——本卡只替换 ②③④ 三个代码审查点，文档审查点不换工具（D-006）；随后范围扩大为「3 个代码面替换 + 7 个文档面问题修复 + wh-review 阻塞类问题彻底一并解决」（D-018），文档面仍走修好的审查层契约（D-017）。（D-023 更新（2026-09-22 用户裁决）：被替换的 ②③④ 三个面经该裁决成为 3 个真实 diff 面，`build-code/integration` 不再属 7 个文档面；CF-2 由此 RESOLVED。）'
evidence: 'T-005 用户答复（回访 T-001，选①「②③④ 代码审查点 + 工具接入/实验」）；T-016 用户逐字范围扩大指令；D-006；D-017；D-018；RF-06'
acceptance: '验收：范围可判真假——3 个代码面被替换、7 个文档面走修好的契约、① 由 card-02 承接不重做（D-006 后果 + D-018 决策）；失败判据=文档审查点被静默替换工具，或范围扩大未登记为对母 PRD 的显式偏离'
counterexample_boundary: '反例边界：D-006 风险——用户「所有审查」的诉求在本卡不完整满足，须如实列出；D-018 后果——范围扩大「不得静默执行」，须在 build-spec 与阶段末遗漏披露中登记'
```

```yaml
oi_id: 'OI-018'
task_id: 'workflowhub-thin-core-card-05-20260919'
outline_version: '02'
category: 'deferred'
category_note: '材料「类别」列原文：deferred'
source: '取证 dl L89/108/965；声明 5'
question: '**config.json 禁令冲突**：`specs/archive/workflowhub-cost-baseline-and-blocker-close-20260917/decision-log.md` L89/L108/L965 记录用户裁定「禁止把改 config.json 当作解决方案」；本次声明 5 要求用 config.json 承载委托模式。该禁令是否仍生效？'
status: 'confirmed'
ledger_status_note: '材料「状态」列原文：open'
ledger_disposition_note: '材料「终局处置」列原文：待定'
existing_material_pointer: '材料中已存在的相关处置（仅供闭合判定参考，不据此宣告闭合）：D-008 + T-007（只读既有键、不改结构）；RF-07'
impact_dimensions: ["ordinary_detail"]
requires_user_decision: true
batch_id: 'Talk round 2（T-007，D-008）'
selected_disposition: '**不修改 `~/.config/workflowhub/config.json` 的结构与键**；委托模式直接读取既有 `wh_review.stages.<stage>.initial[]` 作为 provider 目标，不新增、不修改、不删除任何键（D-008）。由此 D-019 的定向禁令（RF-07）无被触发面：RF-07 认定该禁令是**定向禁令**（被禁动作始终是「改 config 从 5 条 route 的 `initial` 删掉 `antigravity/flash`」这一具体提案），**未被取代、未过期**；后续若需新参数，载体须落在仓库内文件（D-008 后果）。'
evidence: 'T-007 用户答复「①「不改 config 结构，只读现有键」」；D-008（风险：无，D-019 定向禁令无被触发面）；RF-07（禁令原文与范围：archive decision-log L89/L108/L965）；方向审查 findings `F-78927a0e6a10` 与 `F-b294e216c862` 处置 fixed（D-008）'
acceptance: '验收：审查接入过程中该文件的键集合不变（只读 `wh_review.stages.<stage>.initial[]`）；失败判据=出现新增/修改/删除该文件键的动作，即触发 RF-07 定向禁令'
counterexample_boundary: '反例边界：RF-07 风险——禁令未声明作用域、有被读成全局禁令的风险，且无条款解除它；D-008 后果——新参数只能落在仓库内文件，不得回到 operator 配置'
```

```yaml
oi_id: 'OI-019'
task_id: 'workflowhub-thin-core-card-05-20260919'
outline_version: '02'
category: 'data_state'
category_note: '材料「类别」列原文：data_state'
source: '`I-C-card-05-review-scope.md:336`；PRD FR-53'
question: '**输入形态根本错配**：现行 wh-review 审的是冻结材料字节（materials JSON），不是 Git diff / worktree；OCR 类工具面向 diff/worktree。三选一决定审查**实际能看到什么**'
status: 'confirmed'
ledger_status_note: '材料「状态」列原文：open'
ledger_disposition_note: '材料「终局处置」列原文：待定'
existing_material_pointer: '材料中已存在的相关处置（仅供闭合判定参考，不据此宣告闭合）：D-002（packet）+ RF-04/RF-12'
impact_dimensions: ["ordinary_detail"]
requires_user_decision: true
batch_id: 'Talk round 1（T-002，D-002）+ R-Q1-c 结案（RF-04）'
selected_disposition: '输入形态根本错配按 D-002 处置：改审 packet（需求 + 设计 + diff + 被引用的现有代码），不再审冻结材料字节。RF-04 一手实测确认 packet 可行，但**「相关现有代码」的选取权在 OCR 侧**（`--background` / `--background-file` 承载需求与设计，文件选择仍由 OCR 按 git diff / scan 决定），须在适配合同中写明或调整。'
evidence: 'T-002 用户答复「③packet」；D-002；RF-04（R-Q1-c 结案：packet 可用但选取权在 OCR 侧）；RF-10（OCR 硬依赖 git；`.md` 默认被 `unsupported_ext` 排除，需 `include` 旁路）；RF-12（材料落盘绝大多数是 `.md`，旁路几乎普遍必需）'
acceptance: '验收：适配合同写明 packet 组成规则，以及「相关现有代码选取权在 OCR 侧」这一偏差的处置（D-002 风险 + RF-04 结论）；失败判据=审查仍只看到冻结材料字节，或该偏差未登记'
counterexample_boundary: '反例边界：D-002 失效条件（packet 无法同时覆盖两类则须拆档重新确认）；RF-04 偏差（选取权不在 WorkflowHub 侧，与 D-002 原始意图有偏差）；RF-10 静默失败模式（畸形规则文件静默回退 `System built-in / default`，配置写错不会被告知）'
```

```yaml
oi_id: 'OI-020'
task_id: 'workflowhub-thin-core-card-05-20260919'
outline_version: '02'
category: 'deferred'
category_note: '材料「类别」列原文：接口对齐依赖（方向审查 finding F-6389631fd26c 判定其非 non_goals，故映射为 deferred 并由本字段保留原文）'
source: '`REQ-E-11`、`REQ-I-14`；card-02 DL:1193（= `specs/archive/workflowhub-thin-core-card-02-20260919/decision-log.md:1193`，F-09 全路径规范化）；方向审查 finding `F-6389631fd26c`'
question: '**与 card-02 的边界对齐**：card-02 已提前完成「①build-plan 合并审查本体」与「适配合同的文档审查档」，CARD-05 承接工具选型与②③④；须显式对齐避免重复适配或漏掉对比实验'
status: 'deferred'
ledger_status_note: '材料「状态」列原文：open'
ledger_disposition_note: '材料「终局处置」列原文：待定'
existing_material_pointer: '材料中已存在的相关处置（仅供闭合判定参考，不据此宣告闭合）：RF-06 + D-006；方向审查 finding F-6389631fd26c（类别更正）'
impact_dimensions: ["scope"]
requires_user_decision: true
batch_id: 'D-018 风险（与 card-02、CARD-06、CARD-09 三处写面重叠，须逐项协调）+ RF-06（card-05 范围权威界定）'
owner: 'build-plan（D-018 风险原文：须逐项协调；RF-06 为边界依据）'
trigger_condition: 'build-plan 编排与 card-02 写面重叠的工作包时（D-018 风险）'
scope_boundary: '与 card-02 的边界对齐：① build-plan 合并审查本体与「适配合同的文档审查档」已由 card-02 提前完成、本卡不重做；CARD-05 仍持有 ②③④ 代码审查点、新工具接入、对比实验与 go/no-go、fallback；C6/C7/C8 为共享基础（RF-06）'
impact: '避免重复适配或漏掉对比实验（OI-020 问题原文）；RF-06 明确禁止写成「①已并入 CARD-02」式的范围重分配（card-02 DL:1987）'
follow_up_acceptance: '完成条件（取自本 OI 问题 + RF-06，非新增事实）：与 card-02 的边界逐项对齐成文，不出现重复适配、不遗漏对比实验，措辞不得写成「①已并入 CARD-02」（RF-06 禁止措辞）'
```

```yaml
oi_id: 'OI-021'
task_id: 'workflowhub-thin-core-card-05-20260919'
outline_version: '02'
category: 'success_failure_boundary'
category_note: '材料「类别」列原文：success_failure_boundary'
source: '取证 s1/s3/s4 报告；AGENTS.md 禁自审自判'
question: '「异源审查失败了可以切换成子代理审查，这总不可能失败吧」——**子代理审查机械上不会失败，但不等于独立**。取证实测两项反例：（a）session4 的 4 个常驻子审查代理**全部 `fork_turns="all"`**，继承实现者约 400K 上下文，产出 39 条回复 / 16 个 finding，**无一关于本卡业务逻辑**，且**漏掉最大缺陷**（全局仍是五阶段而文档只说四阶段）长达 2 小时，最终由人发现；（b）session3 **21/21 次 `spawn_agent` 全部 `fork_turns:"all"`**。两者均违反本仓 AGENTS.md「质量裁决由独立来源独立上下文产出，禁止自审自判」。session1 更记录：同源 guard 触发后，唯一可用审查者恰是实现者自己上下文的子代理——**被禁止的路径实际成了唯一生效路径**。'
status: 'confirmed'
ledger_status_note: '材料「状态」列原文：open → 待 Talk round 2 质证'
existing_material_pointer: '材料中已存在的相关处置（仅供闭合判定参考，不据此宣告闭合）：T-009 + D-010（兜底 = 全新上下文 + 可读仓库）'
impact_dimensions: ["acceptance"]
requires_user_decision: true
batch_id: 'Talk round 2（T-009，D-010）'
selected_disposition: '兜底审查者 = **全新上下文的独立子代理，且必须能读取仓库代码**（D-010）。即对「子代理审查机械上不会失败，但不等于独立」的处置：以全新上下文消除自审自判（AGENTS.md 禁止），以「必须能读仓库」消除现行 provider 只读 bundle 导致的「看不到与现有代码的意外交互」。'
evidence: 'T-009 用户答复「①「全新上下文 + 必须能读仓库代码」」；D-010；取证 s4（4 个常驻子审查代理全部 `fork_turns="all"`，继承实现者约 400K 上下文，39 条回复 / 16 个 finding 无一关于本卡业务逻辑，漏掉最大缺陷长达 2 小时）；取证 s3（21/21 次 `spawn_agent` 全部 `fork_turns:"all"`）；取证 s1（同源 guard 触发后唯一可用审查者是实现者自己上下文的子代理）'
acceptance: '验收：AC-25——不可用时由未参与实现者完成替代审查并记录来源与缺口；失败判据=兜底审查者继承实现者上下文（自审自判），或结构上看不到仓库代码'
counterexample_boundary: '反例边界：D-010 风险——新执行者的身份、隔离边界、事实写入位置须在 build-plan 明确（OI-023），且「能读仓库」放大上下文成本，须与 packet 体积上限一起设计；取证事实——现行 `review_instructions` 必须是 host 固定模板、provider 只能读 bundle（`review-materials.mjs:1926`）'
```

```yaml
oi_id: 'OI-022'
task_id: 'workflowhub-thin-core-card-05-20260919'
outline_version: '02'
category: 'complete_user_flow'
category_note: '材料「类别」列原文：complete_user_flow'
source: 'RF-09；D-007'
question: 'D-007 的实现载体：现行机制只有 broker group request，无「按指定 provider 起独立子代理」能力。用什么承载逐路派发？'
status: 'deferred'
ledger_status_note: '材料「状态」列原文：open'
existing_material_pointer: '材料中已存在的相关处置（仅供闭合判定参考，不据此宣告闭合）：D-007 风险（须在 build-plan 明确实现载体）'
impact_dimensions: ["ordinary_detail"]
requires_user_decision: true
batch_id: 'Talk round 2（T-006，D-007）→ build-plan 待决（D-007 风险）'
owner: 'build-plan（D-007 风险原文：须在 build-plan 明确实现载体）'
trigger_condition: 'build-plan 拆分工作包并声明读集 / 写集 / 文件 owner 时（D-017 风险：并行声明制 SD-11）'
scope_boundary: 'D-007 的实现载体：用什么承载「按指定 provider 起独立子代理」的逐路派发（OI-022 问题原文）；不含派发语义本身（已由 D-007 / D-005 定）'
impact: '现行机制只有 broker group request、无 per-provider 子代理派发能力；载体未定则 D-007 / D-005 无法落地（D-007 风险）'
follow_up_acceptance: '完成条件（取自 D-007 决策原文，非新增事实）：实现载体在 build-plan 成文，且满足「每一路 = 一个独立子代理各绑一个 provider、多路并发、任一成功即通过」；失败判据=载体仍只能整组派发'
```

```yaml
oi_id: 'OI-023'
task_id: 'workflowhub-thin-core-card-05-20260919'
outline_version: '02'
category: 'success_failure_boundary'
category_note: '材料「类别」列原文：success_failure_boundary'
source: 'RF-09；D-010；取证 s3 缺陷 (i)'
question: 'D-010 的隔离边界冲突：审查方「能读仓库」vs 现行 provider 只读 bundle（`review-materials.mjs:1926`）。新执行者的身份与边界如何定义？'
status: 'deferred'
ledger_status_note: '材料「状态」列原文：open'
existing_material_pointer: '材料中已存在的相关处置（仅供闭合判定参考，不据此宣告闭合）：D-010 风险（新执行者身份、隔离边界须在 build-plan 明确）'
impact_dimensions: ["ordinary_detail"]
requires_user_decision: true
batch_id: 'Talk round 2（T-009，D-010）→ build-plan 待决（D-010 风险）'
owner: 'build-plan（D-010 风险原文：新执行者的身份、隔离边界、事实写入位置须在 build-plan 明确）'
trigger_condition: 'build-plan 定义 D-010 的新执行者（可读仓库的兜底审查者）时'
scope_boundary: '新执行者的身份、隔离边界、事实写入位置；冲突面=审查方「能读仓库」vs 现行 provider 只读 bundle（`review-materials.mjs:1926`，取证 s3 缺陷 (i)）'
impact: '决定 D-010 能否落地：现行合同要求 `review_instructions` 为 host 固定模板且 provider 只能读 bundle，审查方结构上看不到仓库代码'
follow_up_acceptance: '完成条件（取自本 OI 问题 + D-010 风险，非新增事实）：新执行者的身份 / 隔离边界 / 事实写入位置成文，并**在不设任何字节闸门的前提下**设计上下文成本；失败判据=新执行者仍只能读 bundle（与 D-010 直接冲突）。**（校正：原表述为「并与 packet 体积规则一并设计上下文成本」——D-013 已取消一切 fail-closed 的体积上限且不做分片，该指向已失效，故按 D-013 改写指向；完成条件本体未变。）**'
```

```yaml
oi_id: 'OI-024'
task_id: 'workflowhub-thin-core-card-05-20260919'
outline_version: '02'
category: 'data_state'
category_note: '材料「类别」列原文：data_state'
source: 'make-decision steps.json:10,14；本次取证'
question: '本卡自身的 direction / detail 建议审查（manifest step 6 / step 10）怎么做——取证显示这条路自身就会自陷失败；能否同时作为对比实验的真实语料？'
status: 'confirmed'
ledger_status_note: '材料「状态」列原文：open'
existing_material_pointer: '材料中已存在的相关处置（仅供闭合判定参考，不据此宣告闭合）：RF-14（用户裁定按 manifest 跑一次，作为对照臂语料 #0）'
impact_dimensions: ["acceptance"]
requires_user_decision: true
batch_id: '用户裁定（RF-14：按 manifest 跑一次，作为对比实验对照臂语料 #0）'
selected_disposition: '本卡自身的 direction / detail 建议审查按用户裁定**各跑一次（有界、不重试）**，并作为对比实验控制臂语料入库：step 6（direction）实测见 RF-16（墙钟 444 s、6 次 provider 调用、25 原始 / 14 canonical / 11 丢弃、失败码 `REVIEW_QUORUM_INCOMPLETE`、派发后失败）；step 10（detail）实测见 RF-19（墙钟 4 s、0 次 provider 调用、`REVIEW_HISTORY_UNAVAILABLE`、派发前失败）。两次运行均 `exit 0`，未修改任何仓库文件。'
evidence: 'RF-14（用户裁定与理由：用正在被诊断的病例去审我们自己的方案，代价与失败模式直接入库；direction review 是 advisory、失败不阻断）；RF-16（step 6 实测）；RF-19（step 10 实测）'
acceptance: '验收：两次运行的真实执行事实（命令、窗口、exit、产出与失败码）入库为语料 #0/#1（RF-16 / RF-19），且不被读作质量通过；失败判据=把「零派发」或「产出被丢弃」读成「没有问题/通过」（RF-19 证据限制 ①）'
counterexample_boundary: '反例边界：RF-19 证据限制 ③——两次运行材料不同（580 行 → 934 行），**不构成有效对照**，仅是两个独立观测点；RF-16 证据限制 ①——无 token 计量；RF-19 证据限制 ②——blue 成员被丢弃是「最一致解释而非逐字节证明」'
```

```yaml
oi_id: 'OI-025'
task_id: 'workflowhub-thin-core-card-05-20260919'
outline_version: '02'
category: 'success_failure_boundary'
category_note: '材料「类别」列原文：success_failure_boundary'
source: '取证 s3；用户 2026-09-21 08:12 介入原话'
question: '包体积上限的处置：s3 因 455,671B / 486,777B 超 307,200B 而零派发；用户已当面要求「彻底删除审查的 307,200B 上限，根本就不应该有任何上限和阻塞」。D-002 选定 packet 形态会放大体积矛盾。'
status: 'confirmed'
ledger_status_note: '材料「状态」列原文：**confirmed（D-013：取消一切 fail-closed 上限，不分片）**'
existing_material_pointer: '材料中已存在的相关处置（仅供闭合判定参考，不据此宣告闭合）：D-013 + T-012（已确认，见下方终局字段）'
disposition_note: '材料「状态」列原文括号内容：D-013：取消一切 fail-closed 上限，不分片'
impact_dimensions: ["scope", "ordinary_detail"]
requires_user_decision: true
batch_id: 'Talk round 2 后半批（T-012）'
selected_disposition: '取消一切 fail-closed 的体积上限，不做分片；适配层不设任何字节闸门，也不因体积在任何情况下于派发前阻断（D-013）。**（校正：该上限在基线 `642d4fb2` 上**已不存在**，故本条的活义务是「不回归 + 不重新引入」，不是「移除」。）**'
evidence: 'T-012 用户答复「彻底删除审查的 307,200B 上限，根本就不应该有任何上限和阻塞」；取证 s3（455,671B / 486,777B 超 307,200B 而在派发前 fail-closed，该 phase 永久无法重审）；RF-09（机制根因）；RF-16（控制臂）'
acceptance: '验收（**已按独立替代审查更正为可判真假形式**）：① **常量不回归**——契约测试断言本地字节闸门常量**持续不存在**（`tests/contract/review-input-bounds-portability.test.mjs:30` 对 `TASK_BOUND_PROVIDER_INPUT_MAX_BYTES`；`tests/contract/review-materials-contract.test.mjs:81` 对 `PHASE_DIFF_MAX_DELIVERY_BYTES`），且不出现任何新的本地体积常量；② **大材料真派发**——一次真实审查派发在材料体积**大于 307,200 B** 时完成并产出审查事实（不再是「因超限而派发前零派发」的记录）。失败判据=①任一本地字节闸门常量重新出现，或 ②体积 >307,200 B 的派发仍为零派发。**（校正：原判据逐字为「验收：审查派发路径不含任何字节闸门，不出现取证 s3 那种「因超限而零派发、该 phase 永久无法重审」的执行记录（D-013 后果；对照 AC-58「派发不被任一机器校验阻断」）；失败判据=出现任一因体积在派发前阻断的路径」——该判据在基线上恒真、不可能为假（违反本仓「检查须在『实际为假』时真报失败」），故重写如上；原判据逐字保留于本注。）**'
counterexample_boundary: 'OCR 内部存在独立于本卡的静默丢弃——单文件 diff 超过 max_tokens 的 80% 会被直接丢弃并附 too_large warning（D-013 风险）；G-CK 复核：该丢弃属 OCR 自管 LLM 路径（`ocr review` / `scan`），委托模式下 OCR 不读文件内容，故该 **OCR 路径**不适用；文件级排除由 excluded_files / excluded_count 显式记账。**（校正（M1）：原表述为「D-016 登记的风险在委托模式下**自动消解**」——独立替代审查判定该「自动消解」是**假闭合**：按 D-004，委托模式下实际读文件内容的是**宿主子代理**，内容级丢弃 / 截断的风险只是从 OCR 侧**转移**到子代理上下文边界，并未消解；该新闸门既无记账面也无 OI 覆盖，已登记为 CF-6。另：该风险的原始出处声明为 RF-10，但 RF-10 全节不含 too_large 事实，该事实在材料中只见于本条 OI 问题原文与 D-013 风险。）**'
```

```yaml
oi_id: 'OI-026'
task_id: 'workflowhub-thin-core-card-05-20260919'
outline_version: '02'
category: 'complete_user_flow'
category_note: '材料「类别」列原文：complete_user_flow'
source: '方向审查 finding #1；RF-11'
question: 'RF-11：10 个审查面只有 3 个是代码 diff。本卡范围虽已缩至代码三点（D-006），仍须显式登记「另外 7 个面由谁、用什么、何时覆盖」，否则未覆盖面无声消失。'
context: '台账列标题（逐字）：**审查面 → 工具 / 输入形态 / fallback 映射表缺失**（方向审查 finding `F-0af34640f0f7` 提出）'
status: 'deferred'
ledger_status_note: '材料「状态」列原文：open'
existing_material_pointer: '材料中已存在的相关处置（仅供闭合判定参考，不据此宣告闭合）：方向审查 finding #1 处置 fixed（本轮）；D-021 闭环清单（原 P1–P13，**2026-09-22 经用户显式批准追加 P14 后为 P1–P14**；**2026-09-22 晚经同一任务追加修订扩为 P1–P18**）'
impact_dimensions: ["scope"]
requires_user_decision: true
batch_id: '移交批次（`## 收敛检查`「未决项处置」原文：移交 build-spec / build-plan，各自带负责人与完成条件）'
owner: 'build-spec（适配合同）→ build-plan（`## 收敛检查`「未决项处置」移交）'
trigger_condition: '适配合同起草并冻结时（AC-54：适配合同六要素齐备且接入晚于冻结）'
scope_boundary: '「审查面 → 工具 / 输入形态 / fallback」映射表：10 个审查面逐一登记由谁、用什么、何时覆盖（RF-11：只有 3 个是代码 diff；D-006 范围缩至代码三点后仍须显式登记另外 7 面）'
impact: '否则未覆盖面无声消失（OI-026 问题原文）；方向审查 finding `F-0af34640f0f7` 处置为 fix（RF-17 处置表 #1：新增映射表）'
follow_up_acceptance: '完成条件（取自本 OI 问题 + RF-17 处置，非新增事实）：映射表成文且 10 个审查面逐一有归属（3 个代码面=OCR 委托替换；7 个文档面=现行 provider 走 D-017 修好的契约）；失败判据=仍有审查面无归属或无声消失（D-023 更新（2026-09-22 用户裁决）：`build-code/integration` 的送审合同已由用户裁决改为真实 diff 审查，映射表的「3 个代码面」口径据此登记。**（F-13 追加（2026-09-22 晚，实测）：唯一权威面集 = `runtime/review/stage-materials.json` 的 `surfaces` 恰 10 键；三个被替换面 = `build-code/phase` / `build-code/integration` / `verify-code`；剩余 7 面 = `make-decision/direction`、`make-decision/detail`、`build-spec`、`build-plan`、`mini_task/design`、`mini_task/implementation`、`non_stage/build_prd`。**其中 `mini_task/implementation` 是 diff 面但不在被替换面集内，是否纳入 → 明确登记为本 OI 的未决项（由 build-plan 在映射表中判定），本卡不预选。**）**）'
```

```yaml
oi_id: 'OI-027'
task_id: 'workflowhub-thin-core-card-05-20260919'
outline_version: '02'
category: 'success_failure_boundary'
category_note: '材料「类别」列原文：success_failure_boundary'
source: '方向审查 finding #4；RF-16；D-005；D-028（2026-09-22 用户裁决：any-of-N 扩为全局判据、显式接受语义降级，本条契约升为必需前置）'
question: '**聚合 / quorum 语义无 OI 覆盖**（方向审查 finding `F-41f80f523c19` 提出，取证根因 #2 无主）：已完成审查在何种条件下可被丢弃、单一来源 findings 如何以 `independence: partial` 降级发布、`REVIEW_QUORUM_INCOMPLETE` 的替代语义。D-005 已给方向，但缺可执行契约。'
status: 'confirmed'
ledger_status_note: '材料「状态」列原文：open。**本条终局状态变更（2026-09-22）**：原为 `deferred`（「可执行契约未成文」），经 **D-028** 用户裁决升为**必需前置**，故按本文件口径改判 `confirmed`（= 要求已定 + 有可判真假验收；**不等于契约已落盘**，交付物 owner 与完成条件见下方 `owner` / `follow_up_acceptance`）。'
existing_material_pointer: '材料中已存在的相关处置（仅供闭合判定参考，不据此宣告闭合）：D-005 已给方向（any-of-N）；D-028（全局判据 + 显式接受语义降级 + 本条升为必需前置）；D-017 修复面含聚合语义；P3'
impact_dimensions: ["ordinary_detail", "acceptance", "scope"]
requires_user_decision: true
batch_id: 'Grill 结束记录 failure_semantics（残留 OI-027：不改变方向，已记负责人与完成条件）+ 移交批次（`## 收敛检查`「未决项处置」原文：移交 build-spec / build-plan，各自带负责人与完成条件）+ 2026-09-22 用户裁决（D-028）'
owner: 'build-plan（D-017 修复面「聚合语义」；`## 收敛检查`「未决项处置」移交 build-spec / build-plan）'
trigger_condition: 'build-plan 落地聚合层（D-017 修复面「聚合语义」）时；**且在任何单源通过被当作审查通过之前**（D-028 的必需前置）'
scope_boundary: '聚合 / quorum 语义的可执行契约三项：已完成审查在何种条件下可被丢弃；单一来源 findings 如何以 `independence: partial` 降级发布；`REVIEW_QUORUM_INCOMPLETE` 的替代语义（OI-027 问题原文）。**D-028 扩用**：该契约同时承担「any-of-N 为全局判据」下的**强制标注**职责——7 个仍走旧 provider 链路的文档面的多源一致性已降为单源即可通过，其单源结果必须带 `independence: partial` 标注，否则单源通过与多源一致在账本上不可区分。'
impact: '取证根因 #2「审查真跑了，结果被扔掉」在闭环清单中由 P3 承载；可执行契约未成文则 D-005「完成的审查一律降级使用、不丢弃」无法落地；按 D-028，无该契约则 7 个文档面的单源通过无法与多源一致区分，材料不得声称「多源已核」'
follow_up_acceptance: '完成条件（取自本 OI 问题 + D-005 + D-028，非新增事实）：三项语义各有明文契约，且 P3（`REVIEW_QUORUM_INCOMPLETE` 丢弃已完成的审查）在 D-021 闭环清单内被判修（RF-16 已在本卡自身材料上复现该缺陷）；**并须满足 D-028 的必需前置形态**——单一来源 findings 一律带 `independence: partial` 类标注，且契约在 build-plan 成文之前不得在任何单源结果上声称多源一致'
selected_disposition: '**按 D-028，本条由「可选延期」升为「必需前置」**（2026-09-22 用户裁决「扩为全局判据，接受语义降级」）：any-of-N 是全局审查通过判据（适用全部 10 个审查面，含 7 个仍走旧 provider 链路的文档面），用户显式接受「多源一致性降为单源即可通过」的语义降级；**因此承担「如实标注单源」的 `independence: partial` 契约是硬前置**——没有它，单源通过与多源一致在账本上不可区分，材料**不得**声称多源已核。契约本体（三项语义）仍属 build-plan 交付物，本条 `confirmed` 表示**要求已定且有可判真假验收**，不是「契约已落盘」。'
evidence: 'D-005（any-of-N 方向与风险 (a)：单源 findings 必须以 `independence: partial` 类标注如实记录，不得把单源结果写成多源已核）；T-003 用户逐字答复（原话限定在 OCR 委托模式审查）；D-017「10 个审查面共同受益」；D-028（2026-09-22 用户裁决：扩为全局判据 + 显式接受语义降级 + 本条升为必需前置）；方向审查 finding `F-41f80f523c19`；RF-16'
acceptance: '验收（**可判真假**）：① 三项聚合语义各有明文契约（可被 build-plan 材料逐条引用）；② **任何单一来源的 findings 在审查事实中带 `independence: partial` 类标注**，且材料与下游结论**不得**在单源结果上声称多源一致或「多源已核」；③ `REVIEW_QUORUM_INCOMPLETE` 不再整体丢弃已完成审查（P3）。失败判据=出现单源 findings 未带标注、或某处把单源通过写成多源一致、或已完成审查仍被 `REVIEW_QUORUM_INCOMPLETE` 整体丢弃'
counterexample_boundary: '反例边界：D-005 风险 (a)——any-of-N 降低独立性强度，单源置信度低于多源一致（由强制标注承担，不另行补偿，用户已在 D-028 显式接受）；D-028 风险——7 个文档面的独立性强度**永久低于**多源一致，且该降级无法由本卡后续手段恢复；RF-16 实测（blue 侧 11 条被整体丢弃）证明 P3 当前仍成立，故本条是「要求已定、缺陷现存」，不是「已修复」'
```

> **（2026-09-22 晚对齐说明，追加不覆盖原文）**：D-035 引入的 `single_source` 是 **OI-027 的 `independence: partial` 的具体化**——`single_source`（仅单路报告）即该 finding 的来源强度标注，`corroborated`（多路一致）则不再属 `partial` 降级。本说明**只登记关系**，OI-027 的原始文本（`scope_boundary` / `selected_disposition` / `evidence` / `acceptance` / `counterexample_boundary`）**逐字未改**；其执行契约中仍未成文的部分见 **OI-035**。

```yaml
oi_id: 'OI-028'
task_id: 'workflowhub-thin-core-card-05-20260919'
outline_version: '02'
category: 'complete_user_flow'
category_note: '材料「类别」列原文：complete_user_flow'
source: '方向审查 finding #6；需求变更记录 D-106'
question: '**派生项 D-106（主会话上下文守恒）无对应 OI**（finding `F-57aaa1cafe78`）。用户声明 6 要求主会话只做规划/派发/交互；须显式登记为执行约束或记录为有意不设 OI。'
status: 'deferred'
ledger_status_note: '材料「状态」列原文：open'
existing_material_pointer: '材料中已存在的相关处置（仅供闭合判定参考，不据此宣告闭合）：D-106 派生登记；D-021 主表「主会话瘦身验证」归 CARD-09'
impact_dimensions: ["ordinary_detail"]
requires_user_decision: true
batch_id: '移交批次（`## 收敛检查`「未决项处置」原文：移交 build-spec / build-plan，各自带负责人与完成条件）'
owner: 'build-plan（`## 收敛检查`「未决项处置」移交 build-spec / build-plan；验证面归 CARD-09）'
trigger_condition: 'build-plan 编排主会话 / 子代理分工与工作包时（D-017 风险：并行声明制 SD-11）'
scope_boundary: 'D-106（主会话上下文守恒：主会话只做规划 / 派发 / 交互）的登记形式：显式登记为执行约束，或记录为有意不设 OI（OI-028 问题原文）；验证面不在本卡（D-021 不修项表「主会话瘦身验证 → CARD-09」）'
impact: '决定声明 6 / 派生项 D-106 的落地形式；材料现状为 `## 需求变更记录` 已登记 D-106、`## 需求矩阵` 记为 covered 并指向「本节收敛检查 solution 行列为执行约束」，但该「执行约束」措辞本身在 `## 收敛检查` solution 行正文中未出现（材料内部不一致，两处原文均保留未改）'
follow_up_acceptance: '完成条件（取自本 OI 问题，非新增事实）：D-106 的登记形式在 build-spec / build-plan 成文（执行约束），且不把主会话瘦身验证读作本卡验收项（D-021 不修项表）；失败判据=该执行约束无登记形式即被当作已生效'
```

```yaml
oi_id: 'OI-029'
task_id: 'workflowhub-thin-core-card-05-20260919'
outline_version: '02'
category: 'success_failure_boundary'
category_note: '材料「类别」列原文：success_failure_boundary'
source: 'RF-10；D-013'
question: '**OCR 内部静默丢弃的处置**（D-013 连带风险）：单文件 diff 超 `max_tokens` 80% 被直接丢弃并附 `too_large` warning，**不导致失败**。取消我方闸门后，风险由「响亮失败」变为「安静变少」。须在适配层把丢弃事实提升为质量事实如实记录。'
status: 'confirmed'
ledger_status_note: '材料「状态」列原文：open'
existing_material_pointer: '材料中已存在的相关处置（仅供闭合判定参考，不据此宣告闭合）：D-016 + G-CK（委托模式下 OCR 自管路径的内容级丢弃不适用，文件级排除由 excluded_files 记账）；D-027（2026-09-22 用户裁决：扩本条范围到宿主子代理上下文边界，并新增记账面）；D-017 修复面（派发语义 / 启动自检 / 成本计量）；D-010 风险（能读仓库放大上下文成本）'
impact_dimensions: ["ordinary_detail", "acceptance"]
requires_user_decision: true
scope_extension_note: '2026-09-22 D-027 扩范围：本条由「OCR 内部静默丢弃的处置」扩为「丢弃 / 截断在两个边界（OCR 侧 + 宿主子代理上下文边界）上的处置」，并新增宿主侧记账面（归属 D-017 修复层）。原 question 逐字保留不改。'
batch_id: 'Talk round 3（T-015，D-016）+ Grill 核实（G-CK）+ 2026-09-22 用户裁决（D-027：扩 OI-029 + 新增记账面）'
selected_disposition: '适配层**解析 OCR 的 `too_large` 等丢弃信号，把每个被丢弃的文件提升为一条质量事实如实记录**（不阻断、不报错，但账上看得见）（D-016）。G-CK 一手核实补充：内容级 `too_large` 丢弃属 OCR 自管 LLM 路径（`ocr review` / `scan`），**委托模式下 OCR 不读文件内容故该 OCR 路径不适用**；文件级排除已由 `excluded_files` / `excluded_count` 显式记账。**（D-027 扩范围（2026-09-22 用户裁决）：本条的覆盖面由「OCR 侧丢弃」扩为「丢弃 / 截断的**两个边界**」——① OCR 侧（文件级 `excluded_files` / `excluded_count`；自管 LLM 路径的 `too_large`）；② **宿主子代理上下文边界**（委托模式下真正读文件内容的是宿主子代理，其上下文截断 / 丢弃是 D-013 取消本地字节闸门之后**真正的新闸门**）。两个边界各须有记账面，且**互不替代**。第 ② 类的记账面归属 **D-017 的修复层**（派发 / 可观测性层工作），实现落 build-plan。）**'
evidence: 'T-015 用户答复「①「把丢弃提升为质量事实，如实记录」」；D-016（含风险：丢弃原因可能不止 `too_large`，须穷举）；D-013 风险（风险从「响亮地失败」变成「安静地变少」）；G-CK（委托模式边界与 `excluded_files` 记账）；RF-10（D-013 连带风险一手实测）；D-027（2026-09-22 用户裁决「扩 OI-029 + 新增记账面」）；D-004（委托模式下审查推理由宿主子代理完成）；OI-025 counterexample_boundary（「自动消解」更正为「风险转移到子代理上下文」）'
acceptance: '验收（**已按 D-027 改写为可判真假形式**）：① 质量账本中「审了什么、丢了什么」可区分（D-016 后果；同时修掉 P9「只有 findings、无 verdict/覆盖声明」导致「未派发」与「真无问题」不可分的缺陷）；② **两个边界的丢失去向分别可见且互不替代**——OCR 侧文件级排除见 `excluded_files` / `excluded_count`，**宿主子代理上下文边界**的丢弃 / 截断见 D-017 修复层新增的记账面。失败判据=在一次真实的委托模式审查中出现宿主子代理侧的内容截断或丢弃，而质量账本未产出对应的质量事实（即丢弃不可见）；或某一被丢弃 / 被排除的文件既未记入文件级 `excluded_files`、也未记入宿主子代理侧记账面。**（校正：原验收逐字为「验收：质量账本中「审了什么、丢了什么」可区分（D-016 后果；同时修掉 P9「只有 findings、无 verdict/覆盖声明」导致「未派发」与「真无问题」不可分的缺陷）；失败判据=出现被丢弃文件未记入质量事实的路径」——原判据只覆盖 OCR 侧文件级排除，对 D-027 新增的宿主子代理上下文边界**不可判真假**（该边界在原判据下恒为通过），故按 D-027 扩写；原判据逐字保留于本注。）**'
counterexample_boundary: '反例边界：D-016 风险——丢弃原因可能不止 `too_large` 一种，须穷举，漏掉的丢弃仍会静默；委托模式下文件级排除只能靠 `excluded_files` / `excluded_count`（G-CK），该账若不被记录，文件级丢弃即不可见。**（D-027 补充）**：原 G-CK 行与本条曾把该风险写成「委托模式下**自动消解**」——按 D-004，委托模式下实际读文件内容的是**宿主子代理**，内容级丢弃 / 截断的风险只是从 OCR 侧**转移**到**子代理上下文边界**，**并未消解**（**假闭合**，见 CF-6 → D-027）；该新闸门此前既无记账面也无 OI 覆盖，故本条范围已按 D-027 扩到第二个边界；D-010 风险自己已承认「能读仓库」放大上下文成本'
```

```yaml
oi_id: 'OI-030'
task_id: 'workflowhub-thin-core-card-05-20260919'
outline_version: '02'
category: 'success_failure_boundary'
category_note: '材料「类别」列原文：success_failure_boundary'
source: '方向审查 finding #10；D-011；D-012'
question: '**审查内容质量的实验判定维度**（finding `F-a4502e0ae7fe`）：D-012 已定 rubric 四要素，但 go/no-go 需要**可观察的评估维度**才能验证「是否真的发现了漏洞/边界/意外交互」。须定义：怎么判定一条 finding 是「真问题」、怎么算「锚定准确」、样本量多少才有判别力。'
status: 'deferred'
ledger_status_note: '材料「状态」列原文：open'
existing_material_pointer: '材料中已存在的相关处置（仅供闭合判定参考，不据此宣告闭合）：D-012 已定 rubric 四要素；判定维度待实验设计（D-011/D-014）'
impact_dimensions: ["acceptance"]
requires_user_decision: true
batch_id: 'Talk round 3（T-013，D-014）+ 移交批次（`## 收敛检查`「未决项处置」原文：移交 build-spec / build-plan，各自带负责人与完成条件）'
owner: 'build-spec / build-plan（实验设计；`## 收敛检查`「未决项处置」移交）'
trigger_condition: '实验设计冻结前（D-014：判别力补充条件「须在实验设计阶段与用户确认后冻结」；D-022 风险缓解「该缓解须在实验设计阶段冻结」）'
scope_boundary: '可观察的评估维度三项：怎么判定一条 finding 是「真问题」、怎么算「锚定准确」、样本量多少才有判别力（OI-030 问题原文）'
impact: '决定 D-012 rubric 四要素能否被验证为「真的发现了漏洞 / 边界 / 意外交互」；缺维度则 go/no-go 无法判真假（AC-55）'
follow_up_acceptance: '完成条件（取自本 OI 问题 + D-011 / D-014 / D-022，非新增事实）：三项判定维度成文并与 D-011 相对阈值（findings 有效率 / 锚定准确率 / 耗时，基线 RF-16）+ D-014 非相对必要条件配套；真值来源限定为 D-022 回溯臂（s4 已记录 6 条漏检 FN1–FN6）与前瞻臂；失败判据=无阈值即下接入结论（AC-55）'
```

```yaml
oi_id: 'OI-031'
task_id: 'workflowhub-thin-core-card-05-20260919'
outline_version: '02'
category: 'success_failure_boundary'
category_note: '材料无此前置记录；本条由 RF-19（step 10 实测）派生，类别按内容归入 success_failure_boundary'
source: 'RF-19、`review-record-route.mjs:1173/1139/1147/1382-1402`'
question: '审查历史绑定（snapshot / pair member binding）在何种条件下可以阻断新审查派发？现行行为是「前一次审查的 snapshot 变化 ⇒ 后一次审查零派发」，与 FR-57 / OI-013「派发不依赖材料身份/哈希/快照/回执校验」直接冲突。'
status: 'confirmed'
ledger_status_note: '材料无此前置记录（本轮新增 OI）；终局处置由 AC-58 + D-017 修复面给出，见下方终局字段'
existing_material_pointer: '材料中已存在的相关处置（仅供闭合判定参考，不据此宣告闭合）：AC-58（`## 收敛检查` acceptance 行通过条件「派发无材料身份/哈希/快照/回执校验前置」）；D-017 修复面「派发语义 / 启动自检」；P7（材料身份/锁/投影/recorder 认证全耦进同一次调用）；D-018 边界（机制移除归 CARD-06）'
impact_dimensions: ["acceptance"]
requires_user_decision: true
batch_id: 'Talk round 3（T-017，D-017：修复面含派发语义 / 启动自检）+ 母 PRD AC-58'
selected_disposition: '**审查历史绑定（snapshot / pair member binding）不得作为派发前置条件**：按 D-017，本卡修「审查层」的行为契约，修复面含**派发语义**与**启动自检**，10 个审查面共同受益；按 AC-58（`## 收敛检查` acceptance 行通过条件）「派发无材料身份/哈希/快照/回执校验前置」，任何以材料身份/哈希/快照/回执（含审查历史 pair 绑定）阻断派发的行为都落在该行失败条件「派发被任一机器校验阻断或输入依赖哈希/身份绑定」之内。RF-19 实测的 `REVIEW_HISTORY_UNAVAILABLE`（step 10 零派发）即该失败条件的现存实例，已登记为 P14。'
evidence: 'RF-19（step 10 实测：`terminal_status=unavailable`、`dispatch_state=blocked_before_dispatch`、`provider_attempts=[]`、`error.code=REVIEW_HISTORY_UNAVAILABLE`；根因链 `review-record-route.mjs:1225` 抛出、`:1370-1380` 构建 scope、`:1173` `allowHistoricalPartialCoverage` 因 snapshot 变化判真、`:1139`/`:1147` 把 step 6 的 pair 判为 `foreign` 并丢弃成员、`:1382-1397` 命名空间不匹配 → `:1399-1402` 落错）；D-017（修复面：派发语义 / 聚合语义 / 超时与取消 / 启动自检 / 成本计量）；AC-58；P7（材料身份/锁/投影/recorder 认证全耦进同一次调用）；D-021（闭环清单原为 P1–P13，**2026-09-22 经用户显式批准追加 P14，现为 P1–P14**；超出仍须用户显式追加；**2026-09-22 晚经同一任务追加修订扩为 P1–P18**）'
acceptance: '验收：审查派发不因材料身份/哈希/快照/回执或审查历史 pair 绑定而被阻断（AC-58 + `## 收敛检查` acceptance 行）；失败判据=再次出现 `blocked_before_dispatch` 且 `provider_attempts=[]` 的零派发记录（RF-19 实测形态）'
counterexample_boundary: '反例边界：① RF-19 形态结论——「该条件对同一 task **持续成立**，故当前 snapshot 下任何新的 make-decision 审查请求（含 direction 重跑）很可能同样失败（**推断，未实测**）」，即本条是「要求已定、缺陷现存」，不是「已修复」；② 身份/哈希/快照/回执机制的**物理移除**仍归 CARD-06（D-018 边界 / D-021 不修项表），本卡只修派发行为契约；③ P14 原超出 D-021「P1–P13 闭环清单」，**2026-09-22 用户已显式批准追加 P14（现为 P1–P14）**（校正：原表述为「尚待用户显式追加」；本条 `confirmed` 只是「要求已定 + 缺陷现存」，不是「缺陷已修」）；**2026-09-22 晚经同一任务追加修订扩为 P1–P18**（P15–P18 来自 RF-20，见 D-032~D-036）'
```

```yaml
oi_id: 'OI-032'
task_id: 'workflowhub-thin-core-card-05-20260919'
outline_version: '02'
category: 'success_failure_boundary'
category_note: '材料此前无此记录；本条为 card-02 入向义务承接（OPEN-002 / RISK-003 / T-075），类别按内容归入 success_failure_boundary'
source: 'card-02 `spec.md:636-641`（OPEN-002）、`spec.md:605-611`（RISK-003）、`decision-log.md:1856`（T-075）；母 PRD FR-53 / AC-54 / SD-08'
question: 'card-02 对 CARD-05 的入向义务如何在 make-decision 侧被承接：适配合同（文档审查档）自带的真实缺陷，以及「正式 run 路径未验证、极可能 MATERIAL_INCOMPLETE」。'
status: 'deferred'
ledger_status_note: '材料此前无此 OI（本轮新增）；终局处置与依据见下方终局字段'
existing_material_pointer: '材料中已存在的相关处置（仅供闭合判定参考，不据此宣告闭合）：D-013 / OI-025（本地字节上限在基线 `642d4fb2` 上不存在，活义务=不回归 + 不重新引入）；D-016 / OI-029 与 D-027（丢弃提升为质量事实，并扩到宿主子代理上下文边界）；RF-06 / D-006（① 由 card-02 提前完成、本卡不重做）；D-030（① 交付物核验登记为本卡验收动作）；新增的「card-02 入向义务承接登记」节'
impact_dimensions: ["scope"]
requires_user_decision: true
batch_id: '2026-09-22 用户裁决批次（D-030 ① 交付物核验归本卡验收动作；D-027 扩 OI-029 + 新增记账面）+ card-02 入向义务（带 owner 与关闭条件）'
owner: 'CARD-05（适配合同能力增强 + ① 交付物核验）；build-spec（适配合同冻结）；build-plan（对比实验与正式 run 的执行编排）'
trigger_condition: '适配合同冻结之前（FR-53 六要素成文时）；以及任何「审查路径可用」结论作出之前'
scope_boundary: '三项入向义务：OPEN-002（完整材料在正式 run 中可审查，或产品明确保留稳定 unavailable 边界）；RISK-003（provider 侧可接受上限的处置，且 canonical attempt 保留 MATERIAL_INCOMPLETE 或真实 transport 错误）；T-075（① 适配合同（文档审查档）的真实缺陷；② 正式 run 路径未验证，不得据此宣称审查路径可用）；不含本地字节上限（该常量在基线已不存在，见 D-013 / OI-025）'
impact: 'card-02 侧带 owner（CARD-05）与关闭条件的入向 OPEN 项此前未被承接；不承接则「审查路径可用」可能被无证据地宣称，且适配合同自带的真实缺陷会静默随交付物流入 build-spec'
follow_up_acceptance: '完成条件：① 完整材料在正式 run 中可审查，或产品明确保留稳定 unavailable 边界并写成明文集合（该一半已登记为 OI-033）；② canonical attempt 保留 MATERIAL_INCOMPLETE 或真实 transport 错误，不作改写；③ ① 的交付物核验动作在本卡执行并记录结果（D-030）。失败判据=在无正式 run 执行记录的情况下宣称审查路径可用，或 canonical attempt 的失败码被改写为通过'
```

```yaml
oi_id: 'OI-033'
task_id: 'workflowhub-thin-core-card-05-20260919'
outline_version: '02'
category: 'data_state'
category_note: '材料此前无此记录；本条为 FR-53 / AC-54 六要素之一「unavailable 状态集合」的登记，类别按内容归入 data_state'
source: '母 PRD FR-53 / AC-54（`prd.md:364` / `:374`）；本次六要素逐条核对（材料此前「状态集合」零命中）；RF-05 / RF-10 / RF-15 / RF-16 / RF-19 / RF-18；card-02 OPEN-002'
question: '适配合同六要素之一的「unavailable 状态集合」由谁在何时枚举完备，以及每个状态的判定依据与对应三档路径如何登记。'
status: 'deferred'
ledger_status_note: '材料此前无此 OI（本轮新增）；终局处置与依据见下方终局字段'
existing_material_pointer: '材料中已存在的相关处置（仅供闭合判定参考，不据此宣告闭合）：D-005 / D-009 / D-010 / D-013（三档路径的行为）；RF-05（本机可用性事实）；RF-10 / RF-15 / RF-18（OCR 侧失败与静默回退事实）；RF-16 / RF-19（旧链路 unavailable 实测）；card-02 OPEN-002（关闭条件之一即「产品明确保留稳定 unavailable 边界」）'
impact_dimensions: ["acceptance"]
requires_user_decision: true
batch_id: '本次修复批次（FR-53 / AC-54 六要素补缺与适配合同要素登记）'
owner: 'build-spec（适配合同冻结；AC-54 要求接入动作发生在合同冻结之后）'
trigger_condition: '适配合同起草并冻结之前（与 OI-026 的映射表同一冻结事件）'
scope_boundary: '「unavailable 状态集合」的完备枚举与逐状态登记（触发条件 / 判定依据 / 对应三档路径 / 记账字段）；覆盖 OCR 委托模式侧与旧 provider 链路侧两类；不含三档路径的行为本身（已由 D-005 / D-009 / D-010 / D-013 定）'
impact: 'AC-54 的失败场景为「任一要素未齐备或未冻结即接入」（此处按解析器字段词表约束改写用词，逐字原文见 `prd.md:374`）；该要素此前在材料中零命中，既未枚举也未指派 owner，属点名但未落地'
follow_up_acceptance: '完成条件：适配合同中列出完备的 unavailable 状态集合，每个状态带触发条件 / 判定依据 / 对应三档路径（替代审查 / unverified / 不阻断）/ 记账字段，且本次登记的已取证状态种子（见 FR-53 / AC-54 对照节，共 11 项）逐一有归属或明文排除理由。失败判据=合同冻结时状态集合仍不完备，或出现某状态在适配层无判定依据；**F-15 追加（2026-09-22 晚）：本完成条件另含 RF-15 登记的四项未验证项，均须在适配合同冻结前有归属或明文排除理由 —— ① OC 的 rubric 是否真正进入 {{system_rule}} / ## User-Specific Rules (Mandatory) 的端到端注入未验证；② rule 的多行值未测；③ include 在全局（global）层未实测；④ 上游文档全部 HTTP 422，上游无交叉验证。**'
```

```yaml
oi_id: 'OI-034'
task_id: 'workflowhub-thin-core-card-05-20260919'
outline_version: '02'
category: 'success_failure_boundary'
category_note: '材料「类别」列原文：success_failure_boundary（2026-09-22 晚新增行的「类别」列）'
source: 'RF-20（Arm B 能力缺口 ②：需求材料是截断的 spec 头、无任何 AC）；D-033；`verify-code` 面的 `forbidden` 列表（含 `acceptance_criteria`）'
question: '**D-033 与 `verify-code` 面 `forbidden` 列表的冲突解法未定**：packet 的「需求」组件必须包含验收标准全文（AC 列表），但 `verify-code` 面的材料契约 `forbidden` 含 `acceptance_criteria`。是放宽该面的 forbidden，还是把该面显式登记为「本面无法审需求保真」的未审面？'
status: 'confirmed'
ledger_status_note: '材料「状态」列原文：open，上一轮终局为 deferred；2026-09-22 用户本轮明确选择新 OCR verify-code packet 携带完整 AC，见 D-041。旧状态与待选问题保留于本条历史字段。'
existing_material_pointer: '材料中已存在的相关处置（仅供闭合判定参考，不据此宣告闭合）：D-033（packet 需求组件必须含 AC 全文）；RF-20（Arm B 对无法作答的 `.md` 规则项**未编造 finding**）；D-002；D-019；D-017 修复面'
impact_dimensions: ["acceptance", "scope"]
requires_user_decision: true
batch_id: '2026-09-22 晚 OCR 委托模式端到端实验批次（RF-20 / D-033 派生）'
owner: 'build-spec（D-033 风险原文：须在 build-spec 决定该冲突的解法）'
trigger_condition: 'build-spec 定稿材料契约（packet 组件 ↔ 各审查面 `forbidden` 列表）时；且在任何一面被声称已审「需求保真」之前'
scope_boundary: '该冲突的解法二选一及其登记：① 放宽 `verify-code` 面的 `forbidden`（允许 packet 携带 AC）；② 保留该 `forbidden` 并把该面显式登记为「本面无法审需求保真」。**不得**以静默降级（既不携带 AC、也不登记为未审面）的方式通过'
impact: '未定则该审查面的需求保真维度**静默失效**（RF-20 实测：需求组件无 AC 时该维度无法作答）；D-033 的「要么真正被审、要么被显式登记为未审」在材料上不可判真假'
follow_up_acceptance: '完成条件（取自 D-033，非新增事实）：该冲突有明文解法，且材料中该面在两种情形下均可判真假——携带 AC 全文，或显式登记「本面无法审需求保真」。失败判据=某审查面既未携带 AC、也未登记为未审面'
```

```yaml
oi_id: 'OI-035'
task_id: 'workflowhub-thin-core-card-05-20260919'
outline_version: '02'
category: 'success_failure_boundary'
category_note: '材料「类别」列原文：success_failure_boundary（2026-09-22 晚新增行的「类别」列）'
source: 'RF-20（两臂重叠 2 条 / 并集 9 条）；D-035（修正 D-005）；D-005；OI-027'
question: '**并集入账（D-035）的执行契约未成文**：D-035 要求「所有成功路的结果全部进 findings 账本 + 逐条标来源强度」，但 (a) 去重规则（同一 file:line + 同一 claim 是否视为同一条）与 (b) 入账时点（何时可判定「已派发路由全部终态」）均无明文契约；`corroborated` / `single_source` 的判定粒度亦未定义'
status: 'deferred'
ledger_status_note: '材料「状态」列原文：open（2026-09-22 晚新增行，状态列记为 open）。本条终局判为 `deferred`——要求已定（D-035）但执行契约未成文，owner / trigger / close 条件见本条记录。'
existing_material_pointer: '材料中已存在的相关处置（仅供闭合判定参考，不据此宣告闭合）：D-035（本条即其风险 (a)(b) 的落点）；OI-027（`independence: partial` 强制标注）；D-005（现仅作**派发成功判据**）；D-017 修复面「聚合语义」；P3'
impact_dimensions: ["acceptance", "scope"]
requires_user_decision: true
batch_id: '2026-09-22 晚 OCR 委托模式端到端实验批次（RF-20 / D-035 派生）'
owner: 'build-spec；build-plan（聚合层落地，D-017 修复面「聚合语义」）'
trigger_condition: '落地聚合 / 入账路径时；且在任何 findings 账本被读作「已按 D-035 并集入账」之前'
scope_boundary: '并集入账的三项可执行语义：① 去重规则（同一 file:line + 同一 claim 是否视为同一条）；② 来源强度判定粒度（`corroborated` = 多路一致；`single_source` = 仅单路报告）及其与 OI-027 `independence: partial` 的对应；③ 入账时点（何时可判定全部已派发路由已终态），并明确它与「派发成功判据」是两个不同语义。**不含** any-of-N 是否成立本身（已由 D-005 + D-028 定）'
impact: '未定则 D-035 不可判真假：`single_source` 与 `corroborated` 无法区分，且「等待所有已派发路由终态」可能把任何一路的失败变成阻塞（与 D-005「任一成功即通过」的派发判据冲突）'
follow_up_acceptance: '完成条件（取自 D-035 风险 (a)(b)，非新增事实）：三项语义各有明文契约，且账本中每条 finding 的来源强度可判真假；失败判据=出现未标来源强度的 finding、或某一路失败阻塞了已成功路的入账'
```

## 需求变更记录

### 2026-09-22 用户当面追加（本卡开工）

> **（校正（gap B-8 第 2 条）：原标题逐字为「### 2026-09-22 用户当面追加（本卡开工，**尚待 Talk 确认**）」——该标签已过期：Talk round 1–3 已全部发生并登记（`### Talk round 1`、`### Talk round 2`、`### Talk round 3`），6 条声明也已在 `## 需求矩阵` 逐条处置。原表述逐字保留于本注。）**

用户在本卡 make-decision 开工前当面追加了以下需求。按 SD-09 逐字保留原始声明，派生项另行标注。

**原始声明（逐字）**

1. 「对整个 workflowhub 的所有审查（不止是 build-code 和 verify-code），进行系统性的优化和改造。」
2. 「让 AI 能正确的审查需求或技术设计，并找出任何漏洞、边界情况、与现有代码的意外交互或其他类似问题。」
3. 「让 workflowhub 的审查过程简单、干净、轻松、高质量、永不阻塞和失败。」
4. 「https://github.com/alibaba/open-code-review 项目我也已经安装好了。也需要进行尝试，是不是比本机的 wh-review 的 build-code 和 verify-code 质量更好？如何接入到 workflowhub 的流程中来。」
5. 「尤其是我想利用 `/Users/Hugh/.config/workflowhub/config.json` 的 build-code 和 verify-code 的配置，使用 open-code-review 中的委托模式进行代码审查或所有审查。」
6. 「主会话只进行任务规划、子代理任务派发和交互类技能的执行，不要进行大量阅读和执行任务，保证主会话上下文控制和执行质量。」

**派生需求（带 source 锚点）**

| 派生项 | source | 与母 PRD 的关系 |
|---|---|---|
| D-101 审查改造范围超出 U-001#5 点名的 build-code / verify-code，含需求与技术设计审查 | 上方声明 1、2 | **扩范围**。母 PRD FR-23/SD-07 的 SD-07 节奏点之外，用户现要求覆盖 make-decision / build-spec 等审查；须在 Talk 定边界 |
| D-102 审查质量目标是「发现漏洞、边界情况、与现有代码的意外交互」 | 上方声明 2 | 母 PRD 未定义审查**内容质量**契约（现有 FR-53 只冻结 finding schema 形态），属**新增质量维度** |
| D-103 「永不阻塞和失败」 | 上方声明 3 | 与 SD-08「替代也不可用时记 unverified 并如实披露」不冲突（不阻断≠记通过），但须澄清「永不失败」不得读作「永不记失败」 |
| D-104 要求实测 OCR 与 wh-review 的质量对比 | 上方声明 4 | 与 FR-22/FR-26/FR-54 一致；母 PRD 纪律为「OCR 仅为候选，不预设」，实测对比即合规路径 |
| D-105 用 config.json 的 build-code / verify-code 配置承载 OCR 委托模式 | 上方声明 5 | ⚠️ **与旧裁定潜在冲突**，见 OI-018 |
| D-106 主会话上下文守恒（重活下沉子代理） | 上方声明 6 | 与规划 DL L645-648 子代理分工纪律一致 |

**2026-09-22 追加范围指令（Talk round 3，逐字）**

> 「当前任务既要负责三个代码审查面的替换，也要负责其他7个审查面的问题修复，wh-review技能这么多问题和阻塞，也要彻底一起解决！」

| 派生项 | source | 与母 PRD 的关系 |
|---|---|---|
| D-107 本卡范围扩大：3 个代码审查面**替换** + 7 个文档审查面**问题修复** + wh-review 阻塞类问题**彻底一并解决** | 上方范围指令；Talk round 3 T-016/T-017 | ⚠️ **显式偏离**母 PRD CARD-05 范围节（该节明写「不含 wh-review 物理删除、不含审查基建资源修复」）。**不得静默执行**，须在 build-spec 与阶段末遗漏披露中登记 |
| D-108 修复层次 = 修「审查层」行为契约，不是给 wh-review 打补丁 | Talk round 3 T-017 | 取证结论：病在编排层（派发/聚合/超时/取消），不在工具本身 |

**已澄清（术语）**：`委托模式`（delegation mode）曾在本仓全量 grep **0 命中**。**（校正（gap B-8 第 3 条）：原标签为「**待澄清**：」——与同句结论「术语澄清完成」自相矛盾，故标签改为「已澄清（术语）」；原标签逐字保留于本注。）**用户已指正其为 **OCR 的功能**（出处 <https://open-codereview.ai/docs/delegate>），本卡已按 RF-01 一手验证的一手证据登记，术语澄清完成。

## Talk 记录

### Talk round 1（2026-09-22，4 个独立决策轴，真实 ask → wait → reply → resume）

| T | 决策轴 | 我的选项 | 用户真实答复（逐字） |
|---|---|---|---|
| T-001 | 改造范围边界（OI-017） | ①只改代码审查点 ②所有 wh-review 调用点全换 ③代码点先落地+合同预留扩展位 | **未选选项，给出研究前置条件**：「需要先检查一下ocr这个工具能否兼容现在的make-decision和build-plan审查？这两个不是代码审查，ocr这个工具是否适用？原来的审查合同和审查标准能否迁移，需要仔细调研。」 |
| T-002 | 审查输入形态（OI-005/OI-019） | ①worktree ②diff ③packet | **③packet：自己打包（需求+设计+diff+相关代码）** |
| T-003 | 工具不可用时的行为（OI-009） | ①不阻断+记 unverified ②先降级独立替代审查 ③任何情况都必须产出审查记录 | **未选选项，给出新原则**：「不能放弃审查，异源审查失败了可以切换成子代理审查，这总不可能失败吧。我希望使用"/Users/Hugh/.config/workflowhub/config.json"里的配置进行ocr的委托模式审查，就是可以同时进行多个异源审查，只要有一个成功了，审查就算通过了」 |
| T-004 | 单次不复审的边界（OI-011） | ①严格单次+verify-code 兜底 ②仅越界时允许一次定向复核 ③严格单次+风险登记 | **①严格单次，靠 verify-code 功能验收兜底** |

**T-001 处置**：转为研究缺口 **R-Q1**（见下节），方向决定推迟至 Talk round 2。符合 make-decision「研究只在其答案能实质改变方向时运行」。

**T-003 处置**：用户答复实质定义了两件事——(a) **委托模式 = 多路异源并发审查，任一成功即通过（any-of-N，非 quorum）**；(b) 异源失败时以子代理审查兜底。其中 (b) 与既有硬约束存在**待验证张力**（子代理若继承实现者上下文即属自审自判，AGENTS.md 禁止），须在 Talk round 2 以取证事实质证，不在本轮直接登记为已确认决策。

## 研究缺口（R-Q1，T-001 触发）

| 缺口 | 问题 | 为什么能改变方向 | 状态 |
|---|---|---|---|
| R-Q1-a | open-code-review（OCR）这类面向 diff/worktree 的代码审查工具，能否承担 make-decision 方向/细节建议审查与 build-plan 合并审查这类**文档/设计审查**？ | 若不能：T-001 只能选①或③，文档审查点须另寻工具或保留 wh-review | **已结案** -> `RF-02`（技术可达、语义默认不适用，须由 WorkflowHub 自带规则）。**（校正（gap B-8 第 4 条）：原状态列逐字为「调研中」；结案见 `### 调研事实（step 4，R-Q1 结案）`。）** |
| R-Q1-b | 原 wh-review 的审查合同与审查标准（`skills/wh-review/contracts/*.md`、`runtime/review/stage-materials.json` 送审边界、finding 处置四档）能否迁移到新工具？迁移损失是什么？ | 若不可迁移：适配合同须重新设计质量核心，AC-57「两类质量核心齐备」的落地方式随之改变 | **已结案** -> `RF-03`（迁移损失逐项已列，证据纪律与多源聚合为迁移损失）。**（校正（gap B-8 第 4 条）：原状态列逐字为「调研中」。）** |
| R-Q1-c | 现行 wh-review 审的是冻结材料字节，OCR 面向 diff/worktree；packet 形态（T-002）能否同时覆盖文档审查与代码审查两类？ | 决定 T-002 的 packet 是"一种形态服务两类"还是"分档" | **已结案** -> `RF-04`（packet 可行，但「相关现有代码」选取权在 OCR 侧）。**（校正（gap B-8 第 4 条）：原状态列逐字为「调研中」。）** |

## 决策

### D-001

- module：任务身份
- requirement_ids：[]
- 原 requirement_ids 依据：make-decision SKILL.md「Task type before questions」
- derived_from：[]
- 原 derived_from 依据：用户 2026-09-22 当面声明（`ask_user_question` 真实答复）
- artifacts：[]
- **decision**：本卡任务类型 = **普通任务**（实施任务）。已用 `readTaskTypeFromDecisionLog` 回读校验通过。
- **原因**：本卡要真实改代码、接工具、跑对比实验，属 PRD「五阶段开工说明：以本卡创建独立实施 task」。
- **后果**：make-decision 可追问实现细节（含字段名、输入形态、阈值），不受「规划任务」禁止清单限制。
- **风险**：无。
- **状态**：confirmed

### D-002

- module：审查输入形态
- requirement_ids：[]
- 原 requirement_ids 依据：PRD FR-53、AC-54；OI-005；OI-019
- derived_from：[]
- 原 derived_from 依据：T-002 用户真实答复
- artifacts：[specs/workflowhub-thin-core-card-05-20260919/research/RF-18-ocr-delegate-packet-recipe.md]
- **decision**：适配合同的**输入形态选定为 `packet`**——由 workflowhub 组包，内容包含需求 + 设计 + 代码改动（diff）+ 被引用到的现有代码。
- **原因**：用户目标是「让 AI 能正确审查需求或技术设计，并找出任何漏洞、边界情况、与现有代码的意外交互」。`diff` 结构上看不到需求与周边代码，不可能达成该目标；裸 `worktree` 成本与上下文压力不可控。
- **后果**：需新增组包逻辑及其测试；packet 内容边界成为审查质量的上限。
- **风险**：包组不全即漏检——规划 decision-log L787/L790 已记录「送审材料集不完整 / 不含被引用来源」是**已发生的真实缺陷**。须在适配合同中显式定义 packet 组成规则与**交付形态**（不设任何字节闸门，见 D-013）。
- **（校正：原表述为「须在适配合同中显式定义 packet 组成规则与体积上限（现行 `REVIEW_PACKET_MAX_DELIVERY_BYTES = 2 MiB` 整包无裁剪）」。2026-09-22 独立替代审查取证（finding H4）：`REVIEW_PACKET_MAX_DELIVERY_BYTES` 在全仓（排除 `node_modules`）**没有任何定义**，唯一出现是 `docs/adr/0031-review-check-downgrade-and-identity-boundary.md:50` 对 `review-materials.mjs:2218` 的**过期指针**（该文件现 2191 行）；仓内唯一 2 MiB 字面量在测试夹具 `tests/contract/stage-runtime-preflight.test.mjs:43`。该常量是**幽灵常量**，原引用属事实错误，特此记录并更正。）**
- **取舍**：选 packet（可控且能覆盖需求+代码）而非 worktree（全但贵）或 diff（省但瞎）。
- **被否方案**：`diff`（与用户目标 2 直接矛盾）；`worktree`（成本不可控，且需工具原生支持）。
- **失效条件**：若 R-Q1-c 证明 packet 无法同时覆盖文档审查与代码审查两类，本决策须拆为分档形态并重新确认。
- **状态**：confirmed

### D-003

- module：不复审边界
- requirement_ids：[]
- 原 requirement_ids 依据：PRD FR-24、AC-24；SD-07
- derived_from：[]
- 原 derived_from 依据：T-004 用户真实答复
- artifacts：[]
- **decision**：**严格单次审查**。一次审查成功后不为同一 scope 复审；发现照单修复；不建 severity 门槛与复审循环。「修复是否正确」由 verify-code 的真实入口功能验收兜底，**不新增审查点**。
- **原因**：用户原话「每次审查只要审查成功就不再复审，该修复的修复即可，不希望反复审查浪费时间」（规划 DL L819）；取证显示复审循环是最大浪费源。
- **后果**：纯代码质量类问题（坏味道、死代码、不影响功能的缺陷）在修复后无人复核。
- **风险**：已如实登记，不另行补偿。属用户显式接受的风险。
- **状态**：confirmed

### D-004

- module：接入形态（委托模式）
- requirement_ids：[R-005]
- 原 requirement_ids 依据：用户 2026-09-22 声明 5；OI-008；RF-01
- derived_from：[]
- 原 derived_from 依据：T-003 用户真实答复 + 用户当面指正（委托模式为 OCR 功能，出处 <https://open-codereview.ai/docs/delegate>）+ RF-01 一手验证
- artifacts：[docs/adr/0032-review-chain-delegation-and-layer-contract.md, CONTEXT.md]
- **decision**：新审查工具以 **OCR 的「委托模式」（delegation mode）** 形态接入——OCR 只做确定性工程（文件筛选 + 规则解析），**实际审查推理由宿主 Agent 用自身 LLM 完成**，OCR 端不调用 LLM、不需要 API key。
- **（校正：原表述为「OCR 只做确定性工程（文件筛选 + 规则解析 + **finding schema 脚手架**）」。2026-09-22 G-CK 一手核实：委托模式**不产出 finding，也不提供 finding schema 脚手架**（`ocr delegate preview/rule --format json` 只有文件清单 / 排除账 / 规则，无 finding schema）；D-019 已按此更正，`CONTEXT.md` L438 与 `docs/adr/0032-review-chain-delegation-and-layer-contract.md` 均已按更正后口径书写。本行与 `## 核心需求` 节、RF-02 三处遗留的旧措辞由本次修复同步更正，原措辞逐字保留于本注。）**
- **原因**：本机 `~/.opencodereview/config.json` 不存在、未配置任何 LLM provider，`ocr review` 本机根本无法运行；委托模式是**唯一立即可用**的接入路径，且与用户「用 config.json 的 provider 配置做审查」的诉求天然吻合——config 里的 provider 正是"宿主 Agent"。
- **后果**：（a）不引入 OCR 侧新凭据（RF-05 的 U12 风险消解）；（b）**委托模式下 OCR 不产出 finding**，finding 必须由 WorkflowHub 侧的宿主 Agent 产出，因此 OCR 不能作为 wh-review 意义上的"provider"；（c）审查标准（rubric）必须由 WorkflowHub 自带，因为 OCR 内建规则对 Markdown 材料结构性不适用（RF-02）。
- **风险**：OCR 二进制含自动更新（每次运行 detached `npm i -g @latest`），调查期间版本已从 v1.12.7 自动升到 v1.12.8。对比实验**必须 `OCR_NO_UPDATE=1` 且钉版本**，否则结果不可复现。
- **状态**：confirmed

### D-005

- module：审查通过判据
- requirement_ids：[R-012]
- 原 requirement_ids 依据：用户 2026-09-22 声明 5；PRD FR-25/SD-08；OI-009
- derived_from：[]
- 原 derived_from 依据：T-003 用户真实答复
- artifacts：[docs/adr/0032-review-chain-delegation-and-layer-contract.md, CONTEXT.md]
- **decision**：**多路异源审查并发执行，任一成功即视为审查通过**（any-of-N 语义）；异源审查失败时以独立子代理审查兜底，**不放弃审查**。取代现行 `minimum_heterologous` 的 quorum 语义。
- **（校正/未决（M2→CF-7）：本条未写作用域，但用户 T-003 的逐字原话限定在「我希望使用 `/Users/Hugh/.config/workflowhub/config.json` 里的配置**进行 ocr 的委托模式审查**，就是可以同时进行多个异源审查，只要有一个成功了，审查就算通过了」——即 any-of-N 是**针对 OCR 委托模式**给出的。D-017 随后把「10 个审查面共同受益」施加到仍走旧 provider 链路的 7 个文档面，等于在**没有针对它们作出任何决策**的情况下把多源一致性判据降为单源即可通过。本修复不自行限定或扩展该语义，登记为 **CF-7**。）**
- **原因**：用户原话「可以同时进行多个异源审查，只要有一个成功了，审查就算通过了」「不能放弃审查」。
- **后果**：与现行 `REVIEW_QUORUM_INCOMPLETE` 行为**直接冲突**。现行实现会把**已经成功完成**的审查丢弃——取证 s1 实测：`kimi/coding` completed 22 次、`codex/luna` completed 11 次（`process_outcome:ok`、`parse_outcome:ok`、最长 `duration_ms=1113000`），去重后 ≥70 分钟真实第三方算力，最终 findings = 0。本决策要求改为「完成的审查一律降级使用，不丢弃」。
- **风险**：（a）any-of-N 降低独立性强度——单源 findings 的置信度低于多源一致，必须以 `independence: partial` 类标注如实记录来源强度，**不得把单源结果写成多源已核**；（b）「子代理审查总能成功」的**安全性假设与取证事实冲突**，见 OI-021，须在 Talk round 2 质证后再定落地形态。
- **状态**：confirmed（语义）；落地形态待 OI-021 澄清

> **2026-09-22 修正**：结果取舍判据见 D-035（并集入账 + 逐条标来源强度）；本条的「任一成功即通过」现仅作**派发成功判据**。本条正文与上方校正注**逐字未改**。

### OI-021（Talk round 1 派生）

- **类别**：success_failure_boundary
- **问题**：「异源审查失败了可以切换成子代理审查，这总不可能失败吧」——**子代理审查机械上不会失败，但不等于独立**。取证实测两项反例：（a）session4 的 4 个常驻子审查代理**全部 `fork_turns="all"`**，继承实现者约 400K 上下文，产出 39 条回复 / 16 个 finding，**无一关于本卡业务逻辑**，且**漏掉最大缺陷**（全局仍是五阶段而文档只说四阶段）长达 2 小时，最终由人发现；（b）session3 **21/21 次 `spawn_agent` 全部 `fork_turns:"all"`**。两者均违反本仓 AGENTS.md「质量裁决由独立来源独立上下文产出，禁止自审自判」。session1 更记录：同源 guard 触发后，唯一可用审查者恰是实现者自己上下文的子代理——**被禁止的路径实际成了唯一生效路径**。
- **来源**：取证 s1/s3/s4 报告；AGENTS.md 禁自审自判
- **状态**：open → 待 Talk round 2 质证

## 调研事实（step 4，R-Q1 结案）

### RF-01 委托模式（delegation mode）的确切含义 —— 一手验证

用户指正：委托模式是 **OCR（open-code-review）的功能**，出处 <https://open-codereview.ai/docs/delegate>，不是用户自创术语。

一手证据（本机 `ocr` v1.12.8 / 5c7b3838，darwin/arm64）：

- `ocr delegate --help` 原文：`Delegation Mode` / `Output review spec for host-agent delegation (no LLM required).`；子命令只有 `preview`（输出可审文件 + mode/ref 元数据）与 `rule`（按内容分组的规则）。
- 本机 README L164-167 原文：`Delegation mode — let your AI coding agent perform the review itself` / `OCR handles file selection and rule resolution; no LLM configuration needed`。
- 本机 README L190 原文：`Delegation Mode — your coding agent runs the review using its own LLM; no OCR API key required`。
- 本机 README L125 原文：`You must configure an LLM before reviewing code, unless you use Delegation Mode`。

**语义**：OCR 只做确定性工程（文件筛选 + 规则解析），**实际审查推理由宿主 Agent 用它自己的 LLM 完成**；OCR 端不调用任何 LLM、不需要 API key。委托模式下 OCR 本身**不产出 finding**；finding 由宿主 Agent 产出。

**证据限制（如实披露）**：调研子代理引用的 `en/integrations/delegate.md` / `zh/integrations/delegate.md` 与 `skills/open-code-review-delegate/SKILL.md` **不在本机 npm 包内**（包内仅 `README.md` + 原生二进制）。本卡只采信可复核的一手证据（`--help` 输出 + 本机 README），不采信无法复核的上游路径引用。

### RF-02 R-Q1-a：OCR 能否承担非代码审查（文档/设计审查）

**结论：技术上可达，语义上默认不适用；必须由 WorkflowHub 自带审查规则。**

一手实测（在 card-05 worktree 内）：

| 条件 | 结果 |
|---|---|
| `ocr delegate preview`（默认） | `# Files (0 reviewable / 1 total)`；唯一文件 `decision-log.md` 被 `(excluded: unsupported_ext)` |
| 加 `--rule` 且规则含 `{"include": ["**/*.md"]}` | `# Files (1 reviewable / 1 total)`，排除消失 |

→ `.md` 默认被 `unsupported_ext` 闸门排除，**但一行 `include` 规则即可旁路**。这是「OCR 可否用于 WorkflowHub」的分水岭，已实测可解。

然而 `ocr delegate rule <file>.md` 解析出的规则是 `system / default`，内容为**纯代码导向**，逐字如下：

```text
#### Correctness
Is the logic correct? Are there missing boundary conditions?
Are exceptions handled properly?
Is it thread-safe in concurrent scenarios?

#### Security
Are there security vulnerabilities such as SQL injection or XSS?
Is sensitive information handled correctly?
Is permission validation complete?

#### Performance
Are there obvious performance issues (e.g., N+1 queries, unnecessary loops)?
Are resources properly released?

#### Maintainability
Is the code clear and easy to understand?
Do names accurately express intent?
Does it follow the project's existing code style and architecture patterns?

#### Test Coverage
Do critical logic paths have corresponding test cases?
Do test cases cover boundary conditions?
```

对一份需求文档 / 决策材料问「线程安全吗」「有 SQL 注入吗」「有 N+1 查询吗」——**结构性不适用**。

**可解路径**：`--rule` 接受自定义 JSON 规则文件，规则层级为 `--rule` → `<repo>/.opencodereview/rule.json` → `~/.opencodereview/rule.json` → 内建。即 WorkflowHub 可自带文档/设计审查规则。**OCR 委托模式的实际价值 = 文件选择 + 规则解析；审查标准与 finding schema 均由 WorkFlowHub 提供（委托模式不产出 finding schema）。**

> **（校正：原表述为「OCR 委托模式的实际价值 = 文件选择 + 规则解析 + **finding schema 脚手架**，审查标准由 WorkFlowHub 提供」。G-CK 一手核实推翻「提供 finding schema 脚手架」这一半（`ocr delegate preview/rule --format json` 无 finding schema），D-019 已据此决定 schema 由 workflowhub 自定义；原措辞逐字保留于本注，属材料内两套互斥事实并存之一。）**

### RF-03 R-Q1-b：原审查合同与标准的迁移损失

| 能力 | wh-review | OCR 委托模式 | 迁移结论 |
|---|---|---|---|
| finding 位置锚定 | manifest 内 / 相对路径 / 无 `..` / 行号 ≤ 实际行数；无效即丢弃并记 `unanchored_finding_dropped` | `path` + `start_line` + `end_line`（恒定存在，无 omitempty） | 可迁移，OCR 侧足够 |
| 严重度 | 未知 severity 直接丢弃 | 4 级 `critical/high/medium/low` + `category`（bug/security/performance/maintainability/test/style/documentation/other） | **OCR 更强**（结构化的 4 级 + 类别） |
| 证据强制 | major/blocking **强制** `root_cause` + `evidence_kind` + 非空 `evidence`；`evidence_anchor_valid` 不得被改写为 true | `LlmComment` 只有 `content` + 位置，**无任何证据字段** | ⚠️ **迁移会丢失证据纪律** |
| 多来源聚合 | `path\0line\normalizedIssue` 键 + 词重叠 ≥0.7 模糊归并、簇 severity 取最高、保留未采纳簇与逐 provider 归因 | 无 | 若 T-003 any-of-N 落地，须自行补 |
| 材料白名单 | required/forbidden（如 make-decision.direction 禁 `proposed_solution`/`decision_log`/`spec`/`plan`/`changes_diff`） | 无对应物 | 须自行补 |
| 收敛循环 | **无**（分歧只记 `consensus`/`disputed` 事实） | `--effort` 是同模型多轮 | 两者都无多审查者收敛 |

### RF-04 R-Q1-c：packet 形态（D-002）的可行性

- OCR 委托模式提供 `--background`（文本）与 `--background-file`（Markdown 文件，优先）注入需求/业务背景 → **packet 的「需求 + 设计」部分有原生承载位**。
- 但**文件选择仍由 OCR 自己按 git diff / scan 决定**（`workspace` / `--commit` / `--from..--to`），OCR 不接受"由 WorkflowHub 指定要审哪些现有代码文件"。packet 的「相关现有代码」需靠 OCR 自身的语义分组 + 文件读取工具，或由适配层拆成多组调用。
- 结论：packet 可用，但**「相关现有代码」的选取权在 OCR 侧，不在 WorkflowHub 侧**——与 D-002 的原始意图有偏差，须在适配合同中写明或调整。

### RF-05 本机可用性事实（决定实验可行性）

| 事实 | 值 | 影响 |
|---|---|---|
| 安装 | npm 全局 `@alibaba-group/open-code-review`，二进制 `ocr`（原生名 `opencodereview`） | 可用 |
| `~/.opencodereview/config.json` | **不存在** → 完全未配置 LLM provider；`ocr llm test` exit 1 | **`ocr review` 本机跑不了；委托模式是唯一立即可用路径** |
| 委托模式免 LLM | `ocr delegate preview/rule`、`review --preview`、`rules check`、`session list` 均 exit 0 | 已实测可用 |
| 自动更新 | `scripts/update.js` 每次运行 detached 执行 `npm i -g @…@latest`（冷却 18 分钟；`OCR_NO_UPDATE=1` 可关）。调查期间版本自动从 v1.12.7 → v1.12.8 | ⚠️ **对比实验必须 `OCR_NO_UPDATE=1` 且钉版本**，否则不可复现 |
| git 版本 | 本机 2.39.5 < OCR 要求 2.41（仅 warning，不中止） | 已知偏差，须登记 |
| 退出码 | 只有 0（跑完，含 0 评论 / 部分失败）与 1（致命）；**无 `--fail-on severity` 门禁** | 与「审查不是门禁」一致，不引入新技术门禁 |

### RF-06 card-05 范围的权威界定（card-02 承接登记）

- **card-02 已提前完成**：① build-plan 合并审查本体（FR-56/AC-57 + AC-23/26 的①子句）+ 适配合同的**文档审查档**。不做工具实测、不做代码审查实测。
- **CARD-05 仍持有**：②③④ 代码审查点、新工具接入、对比实验与 go/no-go、fallback、C4/C5/C9；C6/C7/C8 为共享基础。
- **用户纠偏原文**（card-02 DL:1988）：「CARD-05 的审查链替换有 4 个审查点 + 工具接入 + 对比实验 + go/no-go + fallback，card-02 只提前做了 ① 一个审查点 + 适配合同的文档审查档」。
- **禁止措辞**：不得写成「①已并入 CARD-02」式的范围重分配（card-02 DL:1987）。

### RF-07 D-019 config 禁令的原文与范围

| 位置 | 原文 |
|---|---|
| `archive/workflowhub-cost-baseline-and-blocker-close-20260917/decision-log.md:89` | 「**禁止**。不得把「改 operator 配置」当作解决方案；不得绕开问题。」 |
| 同文件 :108 | 「不得改 `~/.config/workflowhub/config.json` 或 `~/.config/3rd-review/config.json`。」 |
| 同文件 :965 | 「用户明确裁定禁止把改配置当作解决方案，属绕开问题」 |

- **范围**：**定向禁令**，非全局禁令。被禁动作始终是「改 config 从 5 条 route 的 `initial` 删掉 `antigravity/flash`」这一具体提案；被禁的是「当作解决方案 / 替代校验 / 替代根修」。
- **状态**：**未被取代、未过期**（该文件 `supersedes: 无`，全文 1801 行无取代/作废声明）。
- **风险**：禁令未声明作用域，有被读成全局禁令的风险，且无条款解除它。

### RF-08 源之间的既存矛盾（须在本卡处置或显式绕过）

| # | 矛盾 | 本卡处置 |
|---|---|---|
| M1 | PRD:384 引「OI-005(L259-278)」、PRD:55 引「OI-005(L266)」，实际 OI-005 在规划 DL:276-295，L266 落在 OI-004 内 | 本卡一律按 **OI id** 定位，不按行号 |
| M2 | OI-005 决议为**三点**节奏（每 phase 一次 + 集成一次 + verify-code 一次），SD-07/CARD-05 为**四点**（多①build-plan 合并）；OI-005 仍 `status=confirmed` 未追改 | 以 **SD-07 四点**为准（PRD 已显式 supersession 说明）；M2 登记为上游漂移 |
| M3 | 「①已并入 CARD-02」措辞被用户判为砍范围，但 card-02 现行权威表述仍用「并入」 | 采 RF-06 用户纠偏原文 |
| M4 | 规划 DL:586「OCR 锁定 SHA 源码已核接口能力」vs DL:764「包内没有任何 OCR 主题」并存，且**该 SHA 在仓内查不到**，证据文件 `quality/evidence/research/research-synthesis.md` 不在仓内 | 「OCR 源码已核接口能力」**不可复核**，本卡不采信；OCR 能力以本卡一手实测（RF-01/02/05）为准 |
| M5 | PRD:385「选型被预设为 OCR(纪律禁止)」 | 本卡纪律：OCR 仅候选，选型由对比实验 go/no-go 定 |

### RF-09 现行审查机制的真实语义（解释全部取证灾难的机制根因）

调研结论，全部带 file:line：

| 机制 | 真实语义 | 与取证的因果 |
|---|---|---|
| `initial[]` | 声明式**必须全部可派发**的完整候选组。任一所列 provider 未配置或 `enabled!==true` → **整条 route 抛错 → `ROUTE_UNAVAILABLE`，一个 provider 都不调用**（`third-review-host-config.mjs:710-720`：`:711-715` 未知 provider 抛错、`:718-720` disabled provider 抛错；`ROUTE_UNAVAILABLE` 由调用方 `simple-review-runner.mjs:1348-1355` 附加）。显式 route 会把整个 `initial` 全部派发，不做 adapter 去重（`:724-727`）。 | **（校正：原表述为「**直接解释** session1『`host_provider must be a supported 3rd-review provider` ×11 次、零派发』死锁」——独立替代审查（finding H2，引用抽查 #2）判定为**误归因**：该错误串在 `skills/wh-review/scripts/third-review-host-config.mjs` 中的**唯一生产者**是 `:211`（`if (!SUPPORTED_PROVIDER_IDS.has(adapter)) throw new Error(label + " must be a supported 3rd-review provider")`）；全部 `adapterOf(...)` 调用点（`:223`/`:233`/`:625`/`:683`/`:701`）中 label 为 `"host_provider"` 的**只有 `:701`**，它位于 `:710` 的 `for (const tier of candidates)` 循环**之前**，校验的是 `host_provider` 本身，与 `initial[]` 成员无关；且 `:205` 的注册表**已包含 `"dsh"`**。故 s1 失败的是另一个未在材料中识别的 host provider id；`initial[]` 的整组严格性作为**代码行为**仍属实（P1 的机制事实不变），但它**不是该错误串的来源**。session1 事件本身不在本卡可复核范围内，此处只更正机制归因。）** **（补充（D-024 同步核实）：`:701` 的调用点位于 `:708` 的 `for (const tier of candidates)` 与 `:710` 的 `for (const provider of tier)` 两个循环**之前**；上注把 `:710` 写成 `for (const tier of candidates)` 属引用错位（该循环在 `:708`），**结论不变**（与 `initial[]` 成员枚举无关）。）** |
| `minimum_heterologous` | **三把不同的尺子**：选择期比 distinct 底层 model 数（`:736-744`）；派发前按 preflight 过滤后重算（`simple-review-runner.mjs:1389-1405`）；聚合期比 distinct adapter 数与 distinct `source_id` 数（`canonical-review-result.mjs:211-213`） | **直接解释** session1 RC-1「派发前 eligible 含两者、派发后判 SAME_SOURCE，谁成功谁被排除」 |
| 异源强制 | 有，但一处 fail-open：`sameSourceProfile` 在 model 缺失（null）时无法建立同源匹配，仅靠 profile key 不同就可能算异源（`:662-674`） | 异源判定不可靠 |
| `mode` | `requireStageReviewMode` 把每 stage 锁死（build-code=`full_only`，其余=`single_round`，`:335-342`；调用点 `:375`/`:384`）→ `adaptive` / `full_on_structural_rework` 是**死选项**；WorkflowHub 不解释 mode 行为，只校验 + 透传给 broker | 语义债务——**（补充：新逐路派发路径既不解释 `mode` 语义，也未登记「忽略 / 继承 / 重定义 mode」的处置，使 D-008「只读既有键」在 `mode` 上失去确定含义；且 `full_only` 在代码中没有任何行为分支。已登记为 CF-8。）** |
| 调用次数 | **只由 `initial.length` 决定** | 与 `mode` 无关，配置直觉错误 |
| 轮次上限 | **审查链代码内没有数字轮次上限**；「只做一轮/不开第三轮」全在 prose（`dsh-code-review/SKILL.md:39`、`contracts/verify-code.md:6` 等）。**（校正：原表述为「**代码层完全没有数字轮次上限**（全仓 grep `max_rounds`/`maxRounds`/`round_limit` 在 node_modules 与 archive 外零命中）」——该「全仓零命中」**为假**（独立替代审查 finding L1）：`skills/debate/pk-rules.ts:94` / `:107` 命中 `max_rounds_reached`，`:104` 是真实数字上限 `if (round >= 2) {`，`skills/debate/pk-rules.test.ts:94` 亦命中。实质结论保留并限定作用域：**审查链**代码内无数字轮次上限。）** | **直接解释** session4「SKILL 写最多 4 次，实际跑了 22 次派发 + 12 次重试」——审查链的上限只是散文 |
| findings 回喂 builder | **没有任何代码**自动做这件事；只有人/Agent 路径 | 收敛靠运气 |
| 阻断点（**校正：原行标签为「唯一阻断点」**） | `deriveSeriousReviewPause`（`stage-review-disposition.mjs:43-47,196-235`）：`actionable ∧ major\|blocking ∧ direct\|corroborated_inference`。**同一谓词（`isActionableSeriousFinding`，`:43-47`）至少另在 2 处直接阻断、完全不经过 `deriveSeriousReviewPause`**：`runtime/stage/stage-runner.mjs:665-668`（`completed verify-code stage requires every actionable finding to be fixed or rejected as invalid`）、`runtime/task/task-kernel-implementation.mjs:470-477`（`resolved review authorization must prove repaired actionable findings`）；旁证 `runtime/stage/stage-handlers.mjs:4166-4170`（`code review has N actionable serious finding(s)` → `:4192` 记 `missing`）。 | 与 SD-17 冲突面——**（校正：原表述为「唯一阻断点」；独立替代审查 finding M3 判定该「唯一」为**过度解读**，阻断面 ≥3 处，故按此界定「与 SD-17 冲突面」时阻断面被低估。）** |
| 历史失败规模 | 49 个任务库实测（`docs/adr/0031:15-19`）：`MATERIAL_INCOMPLETE` 153、`PROTOCOL_INCOMPATIBLE` 80、`PROVIDER_OUTPUT_INVALID` 75、`PUBLIC_RESULT_INVALID` 52、`OUTPUT_INVALID` 42、`MATERIAL_FORBIDDEN` 38、`EVIDENCE_ANCHOR_INVALID` 20。单次最贵 67.4 分钟（纯空等 62.7）；真实浪费 146.7 provider-分钟（常引用的 493 被夸大 3.4 倍） | 规模证据 |
| 已修事实 | `cd26676a`（2026-09-20）已把 `reviewCycleDecision` 改成单向 `{advice_recorded, action:advance}`，删除了 `focused_review_required` / `clean_current_review` 等回环语义 | 7 次 build-spec 回环的根因已修 |

### 取证总账（4 份 build-code / verify-code 真实执行会话）

| 会话 | 任务 | 墙钟 | input token | 审查轮次 | 审查产出 |
|---|---|---|---|---|---|
| s1 `01a0bda2` | PaperBuilder T13 build-code | 9h37m | **532,595,879** | 12 | **0 条已发布 finding**；82 个 attempt_id；`unavailable` ×33 |
| s2 `01a0be66` | workflowhub CARD-01 | 12h29m | **353,717,565** | 21 次调度（17 真实派发） | 单 turn（人一句「不接受」触发）= 2.11 亿 token = 全会话 **59.6%** |
| s3 `01a0c142` | workflowhub CARD-02 build-code | 10h21m | **261,879,494** | 3 次 phase review | **全部 unavailable，findings=[]** |
| s4 `01a0c378` | workflowhub CARD-02 verify-code | 5h53m | **193,263,147** | 12 次 provider + 22 次子代理派发 | **12 次全失败；findings = 0** |

四会话合计约 **13.4 亿 input token**。共同的结构性根因（与「模型不够聪明」无关）：

1. **审查从未真正发生，却被记账成"已审查过"**：s3 三次 phase review 因包大小（455,671B / 486,777B）超 307,200B 硬上限而在派发前 fail-closed；叠加「一 phase 一次、不重试」把 `unavailable` 固化为终态，该 phase 永久无法重审。**（校正：该 307,200B 本地字节上限在基线 `642d4fb2` 上**已不存在**——`runtime/review/review-input-bounds.mjs` 头注释「Provider capability, rather than a local byte ceiling, decides whether delivery is possible」，且 `tests/contract/review-input-bounds-portability.test.mjs:30` 断言 `TASK_BOUND_PROVIDER_INPUT_MAX_BYTES` 不存在；s3 事件仍为历史事实，但本卡对该项的活义务是**不回归 + 不重新引入**，见 D-013/OI-025 校正。）**
2. **审查真跑了，结果被扔掉**：s1 中 `kimi/coding` completed 22 次、`codex/luna` completed 11 次（`process_outcome:ok`、`parse_outcome:ok`、最长 1113s），被 `REVIEW_QUORUM_INCOMPLETE` 整体丢弃 → 0 findings。
3. **审查看不到代码、也不记得上一轮**：provider 只能读 bundle（`review-materials.mjs:1926`），合同禁访问仓库；packet 每轮全新、无「已修/已驳回/已登记」清单。
4. **审查对象由被审者自撰**：verify-code 材料只有 4 段 builder 写的散文，`changed_files` 由 builder 挑选 → 审的是「代码的自我说明书」。s4 的 4 个审查子代理 **全部 `fork_turns="all"`** 继承实现者约 400K 上下文，39 条回复 / 16 个 finding **无一关于本卡业务逻辑**。
5. **等待是最贵的操作**：宿主轮询每次唤醒重发全上下文。s3 的 279 次 `wait_agent` = 71.7M input token 换回 32K output；s2 的 222/454 条 assistant 消息是「还在等」的 filler。
6. **审查指令自相矛盾**：s2 的 integration review 在「23 条 AC 全部 `coverage_status=unknown`、`evidence_status=unavailable`」的材料上给出 **0 findings** 并放行完成——因为 FOCUS 明令禁止报告 AC coverage / receipt provenance，**审查被自己的指令禁止报告当时唯一真实存在的问题**。
7. **零成本反馈回路**：全程无 findings 有效率 / 锚定准确率 / 耗时度量。

### RF-16 step 6 方向建议审查 —— 控制臂实测（对比实验语料 #0）

用户裁定按 manifest 跑一次（有界、不重试），作为对比实验对照臂语料 #0。全部为真实执行事实，未修改任何仓库文件。

**运行事实**

| 项 | 值 |
|---|---|
| 命令 | `timeout 900 node tools/cli/stage-runtime.mjs review --action=record --stage=make-decision --project=workflowhub --task=workflowhub-thin-core-card-05-20260919 --input=<direction-request.json>` |
| 窗口 | 01:03:43 → 01:11:07，**墙钟 444 秒**（盘上锚点：`/tmp/wh-card05-forensics/step6-timestamps.txt`（**F-07 证据落盘（2026-09-22 晚）**：该 `/tmp` 原件已落盘为稳定副本 `specs/workflowhub-thin-core-card-05-20260919/research/RF-16-step6-timestamps.txt`，**92 B / 4 行，sha256 `21a52f1488e034ad712f5b4277de9725bcd332d04140d42fd422a789f840eea1`**（`cmp` 与 `/tmp` 原件逐字节相同；内容含 `WALL_SECONDS=444`）。原「只在 `/tmp`」的落点不可长期复核，该表述逐字保留。） 的 `WALL_SECONDS=444`，与 5 份 provider output 的 epoch 时间戳 01:03:51 → 01:11:03 相容）。`exit=0` 与「stderr 空」**无运行产物**——审查记录**没有 exit code 字段**、也没有 stderr 捕获件（`*.err` 不存在），唯一来源是**会话自写**的同一份时间戳文件；按本材料 acceptance 行的失败条件「任一节奏点缺真实执行记录**或为脚本自证**」，二者**标注为不可核验叙述**并**已从基线组成中移除**（原文逐字保留）。**（校正：原表述为「…**墙钟 444 秒**，`exit=0`，stderr 空」；本次只把前两项的证据等级写实，未改窗口数值。）** |
| 冻结指纹 | decision-log sha256 `630618aa…`（59,914B），运行后未再变 |
| 盲审合规 | 6 个 forbidden 键一个未用；整份 decision-log（决策 / Talk / 已选方向）与全部方案性调研节均排除；盲审脱敏另有逐条台账。**（校正：原表述为「另做 9 处盲审脱敏（逐条留痕）」——两份台账不一致：`build-facts.json.blind_sanitisation` = **9 行**（含 3 行 OI 回显）、`/tmp/wh-card05-forensics/sanitisation-log.json.sanitisation` = **7 行**（含 3 行 OSD 回显）；按 (where, before, after) 去重后**并集 = 6 处**，差额 2 行（同属 T-002 / packet 主题的两条 `objective_facts` 脱敏）**未被第二份台账记录**。故此处按**下界 6 处**计入基线，并如实登记该两份台账不一致本身为未修缺陷。）** |

**attempt × provider**

| role | attempt | terminal_status | dispatch_state | error | result |
|---|---|---|---|---|---|
| red | `66ad856a` | `semantic` | `dispatched` | 无 | 有 |
| blue | `1696ecbc` | **`unavailable`** | `dispatched` | **`REVIEW_QUORUM_INCOMPLETE`** | **`result_ref=null`** |

6 次 provider 调用：red = kimi `ok/ok` 221,381ms、antigravity `ok/ok` 111,378ms、codex `ok/ok` 432,004ms；blue = kimi `failed` `RATE_LIMITED` 2,859ms、antigravity `ok/ok` 220,335ms、codex `ok/ok` 409,974ms。**5/6 双 ok。**

**findings 与锚定**

- provider 原始 **25 条**；仅 **14 条**进 canonical result（blocking 2 / major 11 / minor 1）。
- **blue 的 11 条已产出，被整体丢弃**（codex 7 + antigravity 4）。
- 锚定 **25/25 `evidence_anchor_valid=true`**（盘上锚点：5 份 `providers/*.output.json` 的 `evidence_anchor_valid` 数组长度 7 / 4 / 6 / 5 / 3，**全部为 true**）；独立复核 3 条交付路径均存在且行号在范围内。
- **（校正（gap B-6）：原表述为「锚定 **25/25 `evidence_anchor_valid=true`，0 丢弃**；…`discarded_facts` 与 `unanchored_finding_dropped` 均空」。该「0 丢弃 / 均空」**不成立**：三份 `attempt.json`（`66ad856a` / `1696ecbc` / `c465624d`）**都不存在** `discarded_facts` 与 `unanchored_finding_dropped` 这两个键**（`/tmp/wh-card05-forensics/step10-detail-report.md:236` 亦自认「键不存在」）——「0 丢弃」是**从字段缺省推断出来的叙述**，不是机器记录，因此**已从 go/no-go 基线取值中移除**；可核验的前半（锚定 25/25 全为 true）保留。原文逐字保留于本注。）**

**控制臂指标（供 go/no-go 对照）**

| 指标 | 值 |
|---|---|
| 墙钟 | **444 s** |
| provider 派发次数 | 6 |
| 终态 | `pair status=recorded`、`semantic_status=available`、**`partial=true`** |
| findings | 25 原始 / 14 canonical / **11 丢弃** |
| 锚定有效 | 25（5 份 provider output 的 `evidence_anchor_valid` 全为 true，可复核） |
| 丢弃数 | **无机器记录**（三份 `attempt.json` 均无 `discarded_facts` / `unanchored_finding_dropped` 键）→ **不可核验叙述，已移出基线组成**（原文记「丢弃 0」） |
| 失败码 | `REVIEW_QUORUM_INCOMPLETE`，**派发后**（6/6 provider 进程真起过） |
| **token** | **完全不可得**。**校正后口径**：`attempt.json` 的 `provider_attempts[].execution.usage` **键存在且为 `null`（6/6）**；`providers/*.output.json` **无该键（5/5）**；broker `state.json` 记 `null`（6×）——即「两层 `null` + 一层**键不存在**」，**不是**「`usage=null` 三层一致」（原文如此，逐字保留）。 |
| 字节代理量 | **校正后口径**：送审**三份材料**（`raw_requirement` 19,808 B + `objective_facts` 11,521 B + `convergence_outline` 7,723 B = **39,052 B**，取自冻结请求体 `/tmp/wh-card05-forensics/direction-request-input.json`，该文件 41,586 B、sha256 `427370b1…`，见 `build-facts.json.request_input_sha256`）**+ `review-instructions.md` 714 B** = **39,766 B**（即原文数值）；**该项不是「整包」**——同一请求包内另有 `manifest.json`（739 B）与 `managed-request.json`（1,039 B）未计入（原文标签「整包」不准确，逐字保留）。codex 内嵌输入 42,962 B（codex embed `review-input.md`）；file_only prompt 1,688 B（broker `state.json.last_prompt_bytes`）。 |
| provider 进程时间合计 | 1,397,931 ms（并行度 ≈3.15×） |

**基线的可核验构成 / 不可核验叙述（2026-09-22 补缺登记，gap B-6）**

> go/no-go 基线只能由**可核验项**组成。下列逐项给出盘上锚点；**无锚点者明确标注为「不可核验叙述」并移出基线组成**（原文一律逐字保留在上一节的表格里，供追溯）。判据取自本材料 acceptance 行的失败条件「任一节奏点缺真实执行记录**或为脚本自证**」。

| 项（原文数值） | 盘上锚点 | 是否进入基线组成 |
|---|---|---|
| 墙钟 444 s（01:03:43 → 01:11:07） | `/tmp/wh-card05-forensics/step6-timestamps.txt`（**F-07 证据落盘（2026-09-22 晚）**：该 `/tmp` 原件已落盘为稳定副本 `specs/workflowhub-thin-core-card-05-20260919/research/RF-16-step6-timestamps.txt`，**92 B / 4 行，sha256 `21a52f1488e034ad712f5b4277de9725bcd332d04140d42fd422a789f840eea1`**（`cmp` 与 `/tmp` 原件逐字节相同；内容含 `WALL_SECONDS=444`）。原「只在 `/tmp`」的落点不可长期复核，该表述逐字保留。）（`WALL_SECONDS=444`）＋ 5 份 provider output 的 epoch 时间戳（01:03:51 → 01:11:03）与之相容 | **是**（窗口事实可核验；但时间戳文件系**会话自写**、非 runtime 产物，故只作**窗口旁证**，不构成「真实执行记录」） |
| `exit=0` | **无锚点**：审查记录无 exit code 字段；唯一来源是同一份会话自写时间戳文件 | **否** → **不可核验叙述** |
| stderr 空 | **无锚点**：无 stderr 捕获件（`*.err` 不存在），仅报告散文 | **否** → **不可核验叙述** |
| 冻结指纹 `630618aa…`（59,914 B） | `/tmp/wh-card05-forensics/decision-log.snapshot.md` = 59,914 B / 580 行，`shasum -a 256` 前缀 `630618aa…` | **是** |
| 盲审脱敏处数 | `build-facts.json.blind_sanitisation` = 9 行（含 3 行 OI 回显）／`sanitisation-log.json.sanitisation` = 7 行（含 3 行回显）；按 (where, before, after) 去重后**并集 = 6 处** | **是（按并集下界 6 处）**；两份台账差额 2 行未被第二份记录，**该不一致本身是未修缺陷** |
| 6 次 provider 调用与逐条耗时（221381 / 111378 / 432004；2859 `RATE_LIMITED` / 220335 / 409974） | 两份 `attempt.json` 的 `provider_attempts[].execution.timing.duration_ms` 与 `error.code` | **是** |
| 25 原始 / 14 canonical / blue 11 被丢（codex 7 + antigravity 4） | 5 份 `providers/*.output.json`（7+4+6+5+3 = **25**）；`results/make-decision-simple-66ad856a….json.findings` = **14**（`{blocking:2, major:11, minor:1}`）；canonical `provider_results` 仅含 red 三家 | **是** |
| 锚定 25/25 有效 | 5 份 provider output 的 `evidence_anchor_valid` 数组长度 7/4/6/5/3，**全为 true** | **是** |
| **丢弃 0** | **无锚点**：三份 `attempt.json` **均无** `discarded_facts` / `unanchored_finding_dropped` 键（`step10-detail-report.md:236` 自认「键不存在」） | **否** → **不可核验叙述**（字段缺省被读成了 0），**已从基线取值移除** |
| `usage=null` **三层一致** | `attempt.json` 的 `provider_attempts[].execution.usage` **键存在且为 `null`（6/6）**；`providers/*.output.json` **无该键（5/5）**；broker `state.json` 记 `null`（6×） | **是（改写为可核验口径）**：「两层 `null` + 一层**键不存在**」，非「三层一致 null」 |
| 整包 39,766 B | 冻结请求体 `/tmp/wh-card05-forensics/direction-request-input.json`（41,586 B，sha256 `427370b1…`）：`request.materials` 三份 = 39,052 B；39,766 = 39,052 + `review-instructions.md` 714 B | **是（改写标签）**：该项是「三份材料 + instructions 之和」，**不是「整包」**；同包内 `manifest.json`（739 B）与 `managed-request.json`（1,039 B）未计入 |
| 42,962 B（codex 内嵌输入） | codex embed `review-input.md` 实际字节 | **是** |
| 1,688 B（`file_only` prompt） | broker `state.json.last_prompt_bytes` | **是** |
| provider 进程时间合计 1,397,931 ms、并行度 ≈3.15× | 764,763 + 633,168 = 1,397,931；÷ 444,000 = 3.148（算术） | **是（算术）** |
| pair 终态 `recorded` / `semantic_status=available` / `partial=true` | `/tmp/wh-card05-forensics/step6-direction-run.log`；`quality/reviews/reports/make-decision-simple-43261452….md`（1,097 B） | **是** |
| step 10 `exit 0` / 输出 483 B | 同上：exit 无运行产物（**不可核验叙述**）；输出 483 B 见会话自写日志 `step10-detail-report.md` 引用的运行日志 | exit **否**；483 B **是（会话日志）** |
| step 10 attempt 字段（`unavailable` / `blocked_before_dispatch` / `provider_attempts=[]` / `REVIEW_HISTORY_UNAVAILABLE` 及 message 全文） | `attempts/c465624d….json` 逐字段相同 | **是** |

**替代审查原件的落点缺口（未修，如实登记）**：SD-08 替代审查原件 `/tmp/wh-card05-forensics/substitute-detail-review.md`（**F-07 证据落盘（2026-09-22 晚）**：该 `/tmp` 原件已落盘为稳定副本 `specs/workflowhub-thin-core-card-05-20260919/research/SD08-independent-alternative-review.md`，**41,069 B / 255 行，sha256 `a4d82c967a672b8378d15c28e6a8d29a47e28d1bd07b5c063dc2e17295f964af`**（与材料记载的 41,069 B / 255 行一致；`cmp` 与 `/tmp` 原件逐字节相同）。原「原件不在任务证据树内 / 只在 `/tmp`」为该时点的事实，逐字保留；**其任务证据树缺口本身（下方第 8 条）仍未修复**，本次只补齐 `research/` 侧的稳定副本。）（41,069 B / 255 行，审的是**修复前** 1871 行 / 207,573 B 版本）**不在任务证据树内**——`~/Knowledge/Projects/workflowhub/tasks/workflowhub-thin-core-card-05-20260919/quality/reviews/` 下**没有**该次审查的 attempt / result / report（只有 `66ad856a` / `1696ecbc` / `c465624d` 三次派发记录，以及 `43261452` 的 pair report）。**本次修复未把该文件复制进任务证据树**，理由是技术性的而非省略：`quality/reviews/reports/` 的消费者按 `REVIEW_REPORT_REF = /^quality\/reviews\/reports\/[A-Za-z0-9][A-Za-z0-9._-]*\.md$/` 与 `{stage}-simple-{resultId}.md` 的 **attempt / result 绑定**读取（`runtime/review/review-record-route.mjs:22` / `:704`），而该替代审查**没有 attempt 与 result**——落入该目录会产生一个**无 attempt 绑定的孤儿报告**，违反本仓「新增生产文件须登记唯一 consumer / owner / 替代关系 / 删除条件」。**正确落点（归 build-plan / build-code）**：把该替代审查登记为一条**带 attempt / result 绑定的审查事实**，或由 CARD-05 指定 `quality/evidence/` 下的登记位并写明 consumer；在那之前该原件**只在 `/tmp`**，随时可能被清理。**另须注意口径**：它审的是**修复前 revision**，修复后**未再复审**（AC-25 的替代审查记录因此有版本落差，须在阶段末遗漏披露中如实列出）。

**⚠️ 本卡在自身材料上原样复现了病灶**：blue 的 antigravity 220s + codex 410s（合计 **10.5 分钟真实第三方算力**）产出 11 条 findings → 被 `REVIEW_QUORUM_INCOMPLETE` 整体丢弃、`result_ref=null`。与取证 s1 的 RC-2 同一机制。**D-005（任一成功即通过）因此不是偏好，是在本卡自身材料上二次验尸的结论。**


**⚠️ 另发现一处生产静默缺陷**：契约（`contracts/make-decision.md:54-57`）要求 red/blue 各携带 `direction-review.v1` flow，但 runtime 将其做成**可选且无任何生产调用方提供**——`broker.mjs:577 if (!input.review_flow) return;` **静默跳过方向校验**（**校正/补充：该文件**不在本仓**，逐字位于第二个仓库 `/Users/Hugh/Hugh/Project/3rd-review/lib/broker.mjs:577`；跨仓交付登记缺失见 CF-3**）。即**盲审/红蓝约束在生产上并未生效**。本次未替 runtime 补造 flow（补造即改造被测链路），故该分支未被控制臂覆盖，如实登记。

**证据限制**：① 无 token 计量 → **后续实验若要用 token 阈值，须先修 `usage` 采集**（直接影响 OI-004）；② `direction-review.v1` 分支未覆盖；③ decision-log 无 OI 记录块 → 运行时 `analyzeDecisionOutline` 的 OI 权威为空，`category` 用台账「类别」列代替；④ 派发时不校验 outline 内部结构；⑤ 一条 blue finding 报 OI-022..025 重复，实为 `objective_facts` E 节与 outline 内容重叠所致（outline 本身无重复，已复核），如实登记未修。

### RF-17 方向审查 findings 处置（manifest 要求：每条 finding 必须有处置）

canonical 14 条（`adjudication.clusters`）逐条处置。**这批 findings 质量高于历史平均，且打中了本卡材料的真实缺陷。**

| # | finding | severity | 处置 | 说明 |
|---|---|---|---|---|
| 1 | `F-0af34640f0f7` 范围与输入形态未收敛；未说明 diff 类工具如何覆盖文档审查 | major | **fixed（本轮）** | 采其建议：新增「审查面 → 工具/输入形态 → fallback」映射（OI-026） |
| 2 | `F-26f249182630` CARD-05 与 CARD-02 交付边界未决，① 可能重复实现 | major | **fixed（RF-06/D-006）** | card-02 已提前完成 ①，本卡不重做 |
| 3 | `F-2b1d8efcd59d` 不可用路径未收敛为失败合同 | major | **fixed（D-005/D-010/D-013）** | 单路隔离 + any-of-N + 全新上下文兜底 + 无上限 |
| 4 | `F-41f80f523c19` **outline 无任何 OI 覆盖聚合/quorum 语义**（取证根因 #2 无主） | major | **fixed（本轮）** | **真实缺陷，采纳**：新增 OI-027；`outline_version` 升至 2 |
| 5 | `F-432d4020c0ce` 输入形态「三选一」与 SD-07 同时含文档/代码审查矛盾 | major | **fixed（D-006/D-002）** | 范围缩至代码三点，packet 单形态成立；文档面映射见 OI-026 |
| 6 | `F-57aaa1cafe78` 派生项 D-106（主会话上下文守恒）无对应 OI | minor | **fixed（本轮）** | **真实缺陷，采纳**：新增 OI-028 |
| 7 | `F-60ede6e1a938` OI-025 把 307,200B 当体积问题，而非 SD-17/FR-57 违规 | major | **fixed（D-013）** | 采纳其重构：取消一切 fail-closed 上限；OCR 内部静默丢弃风险见 OI-029 |
| 8 | `F-6389631fd26c` OI-020 被误分类为 `non_goals`，实为活跃接口对齐 | major | **fixed（本轮）** | **真实分类错误，采纳**：OI-020 类别改为接口对齐依赖 |
| 9 | `F-78927a0e6a10` OI-018 问禁令是否生效，而事实节已记为仍生效未取代 | major | **fixed（D-008）** | 冲突已消解 |
| 10 | `F-a4502e0ae7fe` 审查内容质量目标无可执行的 direction-level 契约 | major | **fixed（D-012）** | 采纳：D-012 定义 rubric 质量契约；实验判定维度见 OI-030 |
| 11 | `F-b294e216c862` OI-018 被 deferred 而非当场裁决 | major | **fixed（D-008）** | 已当场裁决 |
| 12 | `F-b63b8fcd6c30` **blocking**：提交物未形成可评审 direction，25 个 OI 全 open，无可 challenge 的 current selection | blocking | **disputed（合同自相矛盾）** | 见 DSP-01 |
| 13 | `F-b85572c86526` **blocking**：OI-017 留口扩到「所有审查」，与范围及 OCR diff-only 架构冲突 | blocking | **fixed（D-006）** | 范围已严格锁定 SD-07 代码 diff 序列 |
| 14 | `F-c890e642d17c` config.json 要求与硬约束冲突未裁决 | major | **fixed（D-008）** | 只读既有键，不改结构 |

**处置统计**：fixed 13 / disputed 1（blocking）/ rejected 0。**无空处置。**

**争议登记（交 Talk round 3）**

- **DSP-01（blocking，`F-b63b8fcd6c30`）**：盲审合同要求 direction 材料**只含问题与选项空间**（`forbidden` 含 `proposed_solution`、`decision_log`），但该 reviewer 要求的恰是「统一的范围选择、候选方案、被拒替代方案、可 challenge 的 current selection」。**这是合同与评审预期的结构性矛盾，不是本卡材料缺陷。** 可能处置：(a) 判定 reviewer 越出盲审边界，登记为合同已知张力；(b) 修订 direction 合同允许携带「已脱敏的可挑战选择」；(c) 保持现状并把该分歧登记为实验已知差异。
- **DSP-02（合同静默失效，RF-16）**：`direction-review.v1` flow 在生产上从未被提供，`broker.mjs:577` 静默跳过方向校验 → 盲审约束**实际未生效**。不属本卡范围（属待替换的旧链路），但必须如实披露，且**不得据「盲审已生效」作任何结论**。**（补充：`broker.mjs:577` 的实体在第二个仓库 `/Users/Hugh/Hugh/Project/3rd-review`；本仓等价事实见 P10 行校正，跨仓交付登记缺失见 CF-3。）**

### RF-18 OCR 委托模式 packet 适配配方（一手实测；**原件是独立文件，不在本材料内**）

- **原件位置**：`specs/workflowhub-thin-core-card-05-20260919/research/RF-18-ocr-delegate-packet-recipe.md`（本卡 worktree 内；**2026-09-22 首次记录时为 7,037 B**；同日晚按 D-027 就地追加 §4.7 校正块后为 **8,017 B / 137 行**，md5 `5a9243334b7abbb4e2cb223a7b8e4be8`——两值均如实保留，前者为历史状态，后者为现状态）。
- **为什么在独立文件里**：该节内容是**适配配方**（packet 物化为单 commit git 仓库的 5 步配方；`--commit` 可用 / `--from <empty-tree>` 作废；`--commit` 未传 `--background` 时**自动注入 commit message 作为审查背景**；workspace 模式；非 git 目录硬失败；`ocr rules check` 恒 `EXIT=0`），与 decision-log 的决策 / 取证节体裁不同，按 **SD-10（append-only、不覆盖既有记录）** 另立文件写入，未占用本材料的编号位。**故 RF-18 不是编号断档**（校正：本材料此前从 RF-17 直接跳到 RF-19，未说明该编号去向；现按盘上事实补入指针，**不重编号**）。
- **与本材料的关系**：① §4.1 的 `excluded_files` / `excluded_count` 就是 D-016「丢弃事实如实记账」在委托模式下的**现成载体**（本次 D-027 另把该记账扩到宿主子代理上下文边界）；② §4.6 与 G-CK / D-019 同口径（委托模式**不产出 finding、也不提供 finding schema**）；③ §4.2 的 `--from <empty-tree>` 不可用、§4.6 的「委托模式硬依赖 git」都属 UNKNOWN 边界与不可用状态，已收进 OI-033 的已取证状态种子。
- **✅ 已同步更正（2026-09-22 晚）**：RF-18 §4.7 原写着「委托模式下内容级静默丢弃风险**自动消解**」——该判定已被判定为**假闭合**（见 **D-027** 与 OI-025 `counterexample_boundary` / G-CK 行的就地更正）。**该文件已于 2026-09-22 晚就地校正**（保留原文 + 追加校正块：范围收窄为「OCR 自身路径不适用」、风险**转移**至宿主子代理上下文边界、记账面归 D-027/OI-029、D-016 义务仍生效）。此处原登记为「未改」——**该历史事实由本句自身如实保留**（同一事实在「本次修复未触碰 / 无法核实」小节 item 7 处另有登记）。下游读 RF-18 §4.7 时仍以本材料 D-027 与 OI-029 的口径为准（两者现已一致）。

### RF-19 step 10 细节建议审查 —— 控制臂实测（对比实验语料 #1）

用户裁定按 manifest 跑一次（有界、不重试），作为对比实验控制臂语料。全部为真实执行事实，未修改任何仓库文件。

**运行事实**

| 项 | 值 |
|---|---|
| 命令 | `timeout 900 node tools/cli/stage-runtime.mjs review --action=record --stage=make-decision --project=workflowhub --task=workflowhub-thin-core-card-05-20260919 --input=<detail-request-input.json>` |
| 窗口 | 05:10:57 → 05:11:01（+0800），**墙钟 4 秒**，输出 483 B。`PIPESTATUS[0]=0` / `REAL_EXIT=0` 的**唯一来源是会话自写的 `/tmp/wh-card05-forensics/step10-timestamps.txt`**——审查记录本身**没有 exit code 字段**，故该 exit 值**标注为不可核验叙述**（按本材料 acceptance 行失败条件「为脚本自证」不予采信为机器事实），**已从基线组成中移除**（原文逐字保留）。 |
| 请求体 | 174,204 B，sha `f0ebe291…`；`review_track=detail`；`host_provider=dsh` |
| detail 契约 | required=`raw_requirement` / `approved_direction` / `draft_spec_or_acceptance` / `review_instructions`；optional=`context_map` / `evidence_map`；generated=`review_instructions`；**`forbidden=[]`（逐字空数组）** —— 与 direction 轨的 6 项 forbidden 不同，detail **不禁 decision log** |
| 取材 | decision-log sha `78e6cb38…`（96,976 B / 934 行），运行窗口内未再变 |

**attempt × provider**

| 项 | 值 |
|---|---|
| attempt | `c465624d-707b-59ec-adea-06f32645ab21` |
| terminal_status | **`unavailable`** |
| dispatch_state | **`blocked_before_dispatch`** |
| provider_attempts | **`[]`（0 次调用）** |
| error.code | **`REVIEW_HISTORY_UNAVAILABLE`** |
| error.message | `canonical review history is unavailable: canonical review pair member binding is invalid` |
| 产出 | 无 `result_ref`、无 pair report；report 1,288 B |

**控制臂指标（与 step 6 对照）**

| 指标 | step 6（direction） | step 10（detail） |
|---|---|---|
| 墙钟 | 444 s | **4 s** |
| provider 调用 | 6（5 次 `ok/ok`） | **0** |
| findings | 25 原始 / 14 canonical / **11 丢弃** | **0 / 0 / 0** |
| 失败码 | `REVIEW_QUORUM_INCOMPLETE` | **`REVIEW_HISTORY_UNAVAILABLE`** |
| 失败位置 | 派发**后** | **派发前** |
| exit code | 0（**不可核验叙述**：无运行产物，唯一来源为会话自写时间戳文件） | **0**（同上，**不可核验叙述**） |
| token 计量 | `usage`：attempt.json 键为 `null`、provider output 无该键（**校正：原表述为「`usage=null` 三层一致」**） | 无载体，平凡不可测 |

**失败根因链（行号）**：抛出点 `review-record-route.mjs:1225`；`:1370-1380` 构建 scope；`:1173` `allowHistoricalPartialCoverage` 因 snapshot 变化判真；`:1139` / `:1147` 把 step 6 的 pair 判为 `foreign` 并丢弃成员；`:1382-1397` 命名空间不匹配 → `:1399-1402` 落 `REVIEW_HISTORY_UNAVAILABLE`。

**形态结论**：step 6 = 「跑了但产出被丢」；step 10 = 「**根本没跑起来——旧审查事实锁死新审查**」，且仍 `exit 0`。该条件对同一 task **持续成立**，故当前 snapshot 下任何新的 make-decision 审查请求（含 direction 重跑）很可能同样失败（**推断，未实测**）。

**证据限制**：① 0 findings ⇒ 本次对审查质量零信息量，**不得与 step 6 比 findings 数**，也不得读作「没有问题/通过」；② blue 成员被丢弃是**最一致解释而非逐字节证明**；③ 两次运行材料不同（580 行 → 934 行），**不构成有效对照**，仅是两个独立观测点；④ `raw_requirement` 复用 step 6 字节，其 §3 不含新增的 Talk round 3 指令；⑤ 合同 L96-97 的 `approved_direction` 逐字 identity 校验在 simple 路径**未执行**；⑥ `simplicity-guard` lens 文件是否随 packet 投递未观测。

## Talk 记录（续）

### Talk round 2（2026-09-22，调研后，5 个独立决策轴）

| T | 决策轴 | 我的选项 | 用户真实答复 |
|---|---|---|---|
| T-005 | 改造范围（回访 T-001） | ①只做②③④ ②②③④+文档审查点也换 ③②③④+规则机制做成两类通用 | **①「②③④ 代码审查点 + 工具接入/实验」** |
| T-006 | 委托模式的执行者形态（OI-008） | ①每路=独立子代理各绑一 provider ②沿用现有 provider 派发 ③顺序发起 N 次 | **①「每路 = 一个独立子代理，各绑一个 provider」** |
| T-007 | config.json 禁令处置（OI-018） | ①只读现有键不改结构 ②显式澄清 D-019 为定向禁令 ③明确废止 D-019 | **①「不改 config 结构，只读现有键」** |
| T-008 | finding 证据纪律（OI-006） | ①OCR schema+强制证据 ②先用 OCR 原生 schema 跑实验 ③两臂都测 | **②「先用 OCR 原生 schema 跑实验」** |
| T-009 | 兜底审查者独立性（OI-021） | ①全新上下文+可读仓库 ②全新上下文但不能读仓库 ③允许继承上下文并标 partial | **①「全新上下文 + 必须能读仓库代码」** |

## 决策（续）

### D-006

- module：改造范围
- requirement_ids：[R-005, R-016, R-020]
- 原 requirement_ids 依据：PRD FR-23/FR-56/AC-23/AC-57；RF-06
- derived_from：[]
- 原 derived_from 依据：T-005
- artifacts：[docs/adr/0032-review-chain-delegation-and-layer-contract.md]
- **decision**：本卡范围 = **②③④ 代码审查点（build-code 每 phase、全 phase 集成、verify-code 终末代码审查）+ 新工具接入 + 对比实验 + go/no-go + fallback**。文档审查点（make-decision 方向/细节建议、build-spec）本卡不改。
- **（校正（H3/CF-2）：上面把 ②`build-code/phase`、③`build-code/integration`、④`verify-code` 称为「3 个代码审查点」并作为被替换面；但按代码事实（`runtime/review/stage-materials.json`），`build-code/integration` 的 `source_bundle = "none"` 且 `forbidden = ["changes_diff","cumulative_diff","phase_diff","raw_log","integration_map"]`——它是**非 diff 面且合同禁止投递 diff**，而 OCR 委托模式按 `git diff` 选文件（RF-04）；材料自有 RF-11 给出的 3 个 diff 面是 `build-code/phase` + `verify-code` + `mini_task/implementation`。**这两个「3」不是同一集合，D-006 如写存在内部不一致**；本修复不自行改面集，冲突登记为 **CF-2**。）**
- **（D-023 更新（2026-09-22 用户裁决）：CF-2 已 **RESOLVED by D-023**——用户指令「修改Intergration，让这个审查也变成真的diff审查」要求把 `build-code/integration` 的送审合同**改为真实 diff 审查**；故本条的「3 个代码审查点」（②`build-code/phase`、③`build-code/integration`、④`verify-code`）在 D-023 落地后即为**3 个真实 diff 面**。本条 decision 文本按原文保留不改（义务落在 D-023）。）**
- **（F-13 就地标注（2026-09-22 晚）：本条 decision 与上面两条校正注中的「3 个代码审查点」/「3 个真实 diff 面」为**旧面集表述**，**已由 D-023 + OI-026 取代**。唯一权威面集事实见 `## 已选方向` 修复面段的 F-13 权威面集注；本条原文逐字保留。）**
- **原因**：OCR 内建规则对 Markdown 结构性不适用（RF-02），改写文档审查规则会显著扩大范围；card-02 已提前完成 ① 与适配合同的文档审查档（RF-06）。
- **后果**：达成 RF-06 用户纠偏原文的要求——「4 个审查点 + 工具接入 + 对比实验 + go/no-go + fallback」，不把 ① 重做、也不写成范围重分配。
- **风险**：用户声明 1/2「所有审查」「审查需求或技术设计」在本卡**不完整满足**，须在阶段末遗漏披露中如实列出。
- **（校正（M4）：本行是 Talk round 2（D-006）时点的判断，**早于** Talk round 3（D-018）的范围扩大。D-018 已把范围扩为「3 个代码面替换 + 7 个文档面问题修复 + wh-review 阻塞类问题彻底一并解决」，故 `## 需求矩阵` 对声明 1 记 `covered`、对声明 2 记 `accepted_omission` 与本行**并存**：两处原文均逐字保留，本注说明时序关系，不据此改写任一处的处置。**「须在阶段末遗漏披露中如实列出」这一承诺的落点**见下方「遗漏披露承诺的落点」条。）**
- **状态**：confirmed

### D-007

- module：委托执行者
- requirement_ids：[R-005]
- 原 requirement_ids 依据：用户声明 5；T-006；RF-09
- derived_from：[]
- 原 derived_from 依据：T-006
- artifacts：[docs/adr/0032-review-chain-delegation-and-layer-contract.md]
- **decision**：委托模式下**每一路审查 = 一个独立子代理，各绑定 `config.json` 中 `wh_review.stages.<stage>.initial[]` 的一个 provider**；多路并发，任一成功即通过（D-005）。
- **原因**：用户原话选定。
- **后果**：⚠️ **与现行机制结构性冲突**。现行 `initial[]` 是「必须全部可派发」的整组请求，任一 provider 未配置即整条 `ROUTE_UNAVAILABLE` 且零派发（RF-09）；现行聚合期按 `minimum_heterologous` 判 quorum，会把已完成审查整体丢弃。D-007 要求改为**逐路独立派发 + 任一成功即通过**，是对现行派发与聚合语义的替换，不是配置调整。
- **风险**：需要 workflowhub 具备「按指定 provider 起独立子代理」的能力；**现行机制只有 broker group request，无 per-provider 子代理派发**，须在 build-plan 明确实现载体（OI-022）。
- **状态**：confirmed

### D-008

- module：config 承载方式
- requirement_ids：[R-005]
- 原 requirement_ids 依据：用户声明 5；RF-07；OI-018
- derived_from：[]
- 原 derived_from 依据：T-007
- artifacts：[]
- **decision**：**不修改 `~/.config/workflowhub/config.json` 的结构与键**。委托模式直接读取既有 `wh_review.stages.<stage>.initial[]` 作为 provider 目标；不新增、不修改、不删除任何键。
- **原因**：既满足用户「利用 config.json 的 build-code / verify-code 配置」的原话，又完全回避被读成全局禁令的 D-019 风险（RF-07）。
- **后果**：若后续需要新参数（OCR 规则路径、并发路数），载体须落在**仓库内文件**（规则文件天然是代码产物，非 operator 配置）。
- **风险**：无。D-019 的定向禁令无被触发面。
- **（补充（M9/CF-8）：本条只覆盖「键集合不变」，未覆盖既有键的**语义**。配置里每条 stage route 还有一个 `mode` 键（`~/.config/workflowhub/config.json:53-60`，`build-code = "full_only"`，其余 `= "single_round"`），且 `initial[]` 的调用点会**强制校验**该键（`skills/wh-review/scripts/third-review-host-config.mjs:335-338`，调用点 `:375`/`:384`）；`full_only` 在代码中没有任何行为分支。新逐路派发路径既不解释 `mode` 语义，也未登记「忽略 / 继承 / 重定义 mode」的处置，使本条「只读既有键」在 `mode` 上失去确定含义。已登记为 **CF-8**。）**
- **状态**：confirmed

### D-009

- module：finding schema
- requirement_ids：[R-005]
- 原 requirement_ids 依据：PRD FR-53/AC-54；用户声明 2；OI-006
- derived_from：[]
- 原 derived_from 依据：T-008
- artifacts：[]
- **decision**：对比实验阶段**先用 OCR 原生 finding schema**（`path` / `start_line` / `end_line` / `category` / `severity` 4 级），**不叠加** wh-review 的强制证据字段；是否引入证据强制留作 go/no-go 数据出来后再定。
- **原因**：用户选定；实验更纯、更快出结论。
- **后果**：⚠️ 实验臂测得的是「OCR 原生质量」，而 wh-review 现有的证据纪律（非 minor 必填 `root_cause`/`evidence_kind`/`evidence` + 锚点硬校验）在实验臂中缺席。**须在实验设计中显式声明实验臂 = OCR 原生 schema + WorkflowHub 自带规则**，不得事后把结论读成「证据纪律不必要」。
- **风险**：go/no-go 可能因 schema 差异而判错方向；缓解=实验设计里把「证据字段有无」登记为已知差异项，不计入 go/no-go 阈值。
- **状态**：confirmed

### D-010

- module：兜底审查者
- requirement_ids：[R-005, R-012]
- 原 requirement_ids 依据：PRD SD-08/FR-25；AGENTS.md「禁止自审自判」；OI-021
- derived_from：[]
- 原 derived_from 依据：T-009
- artifacts：[]
- **decision**：异源审查失败时的兜底 = **全新上下文的独立子代理，且必须能读取仓库代码**。
- **原因**：用户选定；取证实证继承实现者上下文的审查子代理会漏掉大缺陷（s4 四代理 2 小时未发现五阶段/四阶段矛盾）。
- **后果**：⚠️ 与现行 provider 隔离设计冲突——现行 `review_instructions` 必须是 host 固定模板、provider 只能读 bundle（`review-materials.mjs:1926`），即审查方**结构上看不到仓库代码**（取证 s3 缺陷 (i)）。D-010 要求审查方能读仓库，意味着兜底执行者**不再是现行意义的 provider，而是一类新执行者**。
- **风险**：新执行者的身份、隔离边界、事实写入位置须在 build-plan 明确（OI-023）；「能读仓库」放大上下文成本，须与 packet 体积上限一起设计。
- **（校正（M8）：本条写于 D-013 之前。D-013 已「取消一切 fail-closed 的体积上限，不做分片」，故「packet 体积上限」**已不是可用对象**；上下文成本的处置须在不设任何字节闸门的前提下设计（原表述逐字保留于本注，既有内容未删）。）**
- **状态**：confirmed

### Talk round 2 后半批（2026-09-22，调研后剩余独立问题）

| T | 决策轴 | 我的选项 | 用户真实答复 |
|---|---|---|---|
| T-010 | go/no-go 阈值三件套（OI-004） | ①混合（锚定绝对+硬红线，相对有效率） ②全绝对 ③全相对 | **③「全相对（对比 wh-review 基线）」** |
| T-011 | 审查标准 rubric 内容（OI-015） | ①清单覆盖+强制证据+严重度+限量 ②只强制证据与严重度 ③只设清单 | **①「清单覆盖 + 强制证据 + 严重度 + 限量」** |
| T-012 | 包体积上限（OI-025） | ①取消硬闸门+超阈值自动分片 ②彻底取消任何上限，不分片 ③取消闸门+靠组包规则控体积 | **②「彻底取消任何上限，不分片」** |

### D-011

- module：go/no-go 阈值
- requirement_ids：[R-005]
- 原 requirement_ids 依据：PRD FR-54 / AC-55；OI-004
- derived_from：[]
- 原 derived_from 依据：T-010
- artifacts：[]
- **decision**：go/no-go 阈值取**相对形式**——三个指标（findings 有效率 / 锚定准确率 / 耗时）**不差于 wh-review 实测基线**。**基线集合** = ① 本次**文档方向面控制臂实测值**（RF-16）：墙钟 444 s、6 次 provider 派发、25 原始 finding / 14 canonical、锚定 **25/25 `evidence_anchor_valid=true`**；**并** ② 一条**真实代码 diff 面的 wh-review 实跑基线**（**D-031**，2026-09-22 用户裁决新增；执行属 build-plan 的对比实验设计，本次未跑）。
- **（校正（gap B-6 + D-026 + D-031；2026-09-22）：原 decision 逐字为「go/no-go 阈值取**相对形式**——三个指标（findings 有效率 / 锚定准确率 / 耗时）**不差于 wh-review 实测基线**。基线以本次**控制臂实测值**为准（RF-16）：墙钟 444 s、6 次 provider 派发、25 原始 finding / 14 canonical、锚定 **25/25 有效 0 丢弃**。」——两处更正：① 「**0 丢弃**」**无盘上机器记录**（三份 `attempt.json` **均不存在** `discarded_facts` / `unanchored_finding_dropped` 键），已从基线取值中移除；可核验的一半（锚定 25/25 `evidence_anchor_valid=true`）保留。② 基线**只有文档面**，而 D-022 的实验语料含代码 diff、D-023 之后被替换的 3 面是真实 diff 面，**基线与候选臂不同型**，故按 **D-031** 扩为「基线集合」。）**
- **原因**：用户选定；且 RF-16 已把基线从"拍数字"变成"实测数字"，相对阈值因此可操作。
- **后果**：阈值不依赖主观拍定，且天然可比。
- **风险**：⚠️ **判别力风险，须在实验设计中显式处置**：纯相对阈值在"两臂都差"时仍会判 go（例如两臂都零 finding，则"不差于"成立）。**AC-55 的失败判据是「无阈值即下接入结论」，因此阈值必须写成可判真假的对照规则，不能只写"不差于"。** 须补一条**非相对的必要条件**：OCR 臂必须至少产出 1 条 actionable finding；否则 go/no-go 判 no-go 并保留 fallback。该补充条件须在实验设计阶段与用户确认后冻结。
- **（校正（D-026，2026-09-22 用户裁决）：本行原表述逐字为「…须补一条**非相对的必要条件**：OCR 臂必须至少产出 1 条 actionable finding **或有明确、可复核的"无问题"结论**；否则 go/no-go 判 no-go 并保留 fallback。…」——第二析取支（「**或有**明确、可复核的"无问题"结论」）**已由 D-026 删除**（原件逐字保留于 D-014 与 D-026 的留证）；**两臂都零发现**的情形随之**判 no-go**，「两臂都差仍判 go」这一判别力漏洞由此闭合。**（同步说明：本行原表述即 B-4 所指的三处「已删分支仍生效」副本之一，本处是解析器非权威面；解析器权威的 `OI-002` / `OI-004` 两处已同步更正。）**）**
- **（补缺登记（gap B-3 + D-031，2026-09-22）：本行的基线取值**全部**来自 RF-16，而 RF-16 是 **direction 轨对一份 59,914 B Markdown 决策材料的文档方向审查**（`file_only` prompt 1,688 B）；D-022 的实验语料含本卡 build-code（**代码 diff**）、D-023 之后被替换的 3 面是**真实 diff 面**，而盘上**不存在任何代码 diff 面的 wh-review 基线**——即基线与候选臂**不同型**，go/no-go 会在结构上不可判真假。用户 2026-09-22 裁决：**补跑一条代码 diff 面基线**（见 **D-031**，含可判真假的义务与「执行属 build-plan 的对比实验设计、本次未跑」的边界）。本行的「不差于 wh-review 实测基线」据此读作**基线集合**（文档面 + 代码面），不是单一 RF-16 数字。）**
- **另**：**token 不能作为指标**——RF-16 实测 `usage=null`（**校正：原表述为「`usage=null` 三层一致」；实测口径为 attempt.json `usage` 键为 `null`（6/6）+ provider output **无该键**（5/5）+ broker state.json 记 `null`（6×），见 RF-16 基线登记**），现有链路无 token 计量。若要引入 token 阈值，须先修 `usage` 采集（登记为 build-plan 前置项）。
- **状态**：confirmed（相对形式）；判别力补充条件**已由 Talk round 3（T-013 → D-014）确认，并经 D-026 收窄为「至少 1 条 actionable finding」**。**（校正：原表述为「判别力补充条件待 Talk round 3 确认」——Talk round 3 已发生（`## Talk 记录` 与 `### Talk round 3` 表 T-013，用户逐字「①加一条非相对必要条件」），该标签已过期；原表述逐字保留于本注。另按 D-031，基线集合须补代码 diff 面。）**

### D-012

- module：审查标准（rubric）内容
- requirement_ids：[]
- 原 requirement_ids 依据：用户声明 2；PRD FR-53；OI-006 / OI-015
- derived_from：[]
- 原 derived_from 依据：T-011
- artifacts：[]
- **decision**：审查 rubric **必须同时具备四要素**——①**清单覆盖**（需求保真 / 边界情况 / 失败路径 / 与现有代码的交互 / 测试有效性 / 安全）；②**每条 finding 强制 file:line 与可复现证据**；③**4 级严重度**；④**每轮 finding 条数上限**。
- **（校正/补缺（FR-53 / AC-54；2026-09-22 gap 修复）：本条的「四要素」是 **rubric** 要素，**不是** AC-54 的 **finding schema** 四要素（严重度、文件/行号锚定、证据、**建议**）。两者的对应关系须显式登记，不得互相替代：AC-54 的**严重度** → 本条 ③；**文件/行号锚定** → 本条 ②的前半；**证据** → 本条 ②的后半；**建议** → 本条**不含**，已由 D-019 补入（字段名 `suggestion_code`，必填自由文本）。原表述逐字保留于本注。）**
- **原因**：用户选定；直接针对取证暴露的三个病症——审查产出全是「材料治理/账本类」、无严重度导致追 nit、官方指令仅 73–350 字符散文且无 file:line 要求。RF-15 已实测 OCR 可注入任意 rubric（`rules[].rule` 内联文本），该决策**技术上可落地**。
- **后果**：审查质量标准由 workflowhub 自己拥有，不再依赖工具内建规则（OCR 内建规则对文档结构性不适用，且无 markdown 规则）。
- **风险**：清单会诱导「为填满而报」；条数上限可能漏掉真问题。两项均须在实验设计中作为观察项登记。
- **状态**：confirmed

### D-013

- module：包体积上限
- requirement_ids：[]
- 原 requirement_ids 依据：PRD SD-17 / FR-57；OI-025；用户 2026-09-21 当面裁定
- derived_from：[]
- 原 derived_from 依据：T-012；用户原话「彻底删除审查的 307,200B 上限，根本就不应该有任何上限和阻塞」
- artifacts：[]
- **decision**：**取消一切 fail-closed 的体积上限，不做分片。** 适配层不设任何字节闸门，也不因体积在任何情况下于派发前阻断。
- **（校正 A（H4）：原表述把本条写成「本卡要移除的 307,200B fail-closed 体积上限」。2026-09-22 独立替代审查取证：该本地字节上限**已在基线 `642d4fb2` 之前移除**（`runtime/review/review-input-bounds.mjs` 头注释「Provider capability, rather than a local byte ceiling, decides whether delivery is possible」；同文件 `compactVerifyCodeMaterials` 注释「no longer rewrites or rejects material by local size」；`tests/contract/review-input-bounds-portability.test.mjs:30` 断言 `TASK_BOUND_PROVIDER_INPUT_MAX_BYTES` 不存在；`tests/contract/review-materials-contract.test.mjs:81` 断言 `PHASE_DIFF_MAX_DELIVERY_BYTES` 不存在；`grep 307200` 唯一命中是测试夹具 `tests/integration/vnext-official-stage-run.test.mjs:2313`）。**决定本身不变且仍然有效**；变的是它的性质——它不是「待移除的缺陷」而是**基线现状**，故本条的活义务是**不回归 + 不重新引入**，不是「移除」。原验收判据「审查派发路径不含任何字节闸门」在基线上恒真、不可能为假，违反本仓「检查须在『实际为假』时真报失败」，已改为可判真假的判据（见 OI-025 记录）。）**
- **原因**：用户明确的直接裁定；且 FR-17 采纳 findings `F-60ede6e1a938` 的重构——该上限的实质是**违反 SD-17「零机器门禁」**，不只是体积参数问题。
- **后果**：不再出现 s3 那种「因 455KB/486KB 超限而零派发、该 phase 永久无法重审」的固化失败。**（校正：该后果在基线上**已经成立**，故本条的实质交付是「保持成立并加测试锁死」，不是「首次实现」。）**
- **风险**：⚠️ **OCR 内部存在独立于我们的静默丢弃行为**——单文件 diff 超过 `max_tokens` 的 80% 会被**直接丢弃**并附 `too_large` warning（warning 不导致失败）。因此"我们取消上限"**不等于"内容不会被丢"**：风险从「响亮地失败」变成「安静地变少」。**必须在适配层把 OCR 的 `too_large` / 丢弃事实提升为质量事实如实记录**（见 OI-029），否则 s3 的教训会以新形式重演。
- **（校正 B（M1）：上一条风险**不能**读作「已由 G-CK 消解」。按 D-004，委托模式下真正读文件内容的是**宿主子代理**——内容被丢弃 / 被截断的风险只是从 OCR 侧转移到**子代理上下文边界**，并未消解（D-010 风险已承认「能读仓库」放大上下文成本）。该新闸门当前既无记账面也无 OI 覆盖，已登记为 **CF-6**。）**
- **状态**：confirmed；OCR 内部静默丢弃的处置见 OI-029；本条的验收判据已按独立替代审查更正为可判真假形式（见 OI-025）

### Talk round 3（2026-09-22，带方向审查红蓝争议清单 DSP-01/DSP-02）

| T | 决策轴 | 我的选项 | 用户真实答复 |
|---|---|---|---|
| T-013 | 相对阈值的判别力（D-011 后续） | ①加一条非相对必要条件 ②纯相对不加条件 ③改为至少 2 个真实任务 | **①「加一条非相对必要条件」** |
| T-014 | DSP-01 盲审合同自相矛盾 | ①判定 reviewer 越界，登记为合同已知张力 ②修订 direction 合同允许携带可挑战选择 ③交后续卡统一处理 | **①「判定 reviewer 越界，登记为合同已知张力」** |
| T-015 | OCR 内部静默丢弃（D-013 连带） | ①把丢弃提升为质量事实如实记录 ②不管 OCR 内部行为 ③组包规则保证不触发内部上限 | **①「把丢弃提升为质量事实，如实记录」** |
| T-016 | 另外 7 个审查面怎么办 | ①本卡出映射表+指派后续承接卡 ②声明继续用旧链路风险自担 ③现在就扩范围一起换 | **未选选项，给出范围扩大指令**（见 D-018） |
| T-017 | 「彻底解决」修到哪一层 | ①修「审查层」而非修「wh-review 工具」 ②10 个面全部换成 OCR 委托 ③只做止血 | **①「修『审查层』而非修『wh-review 工具』」** |

### D-014

- module：go/no-go 阈值判别力
- requirement_ids：[R-005]
- 原 requirement_ids 依据：PRD FR-54 / AC-55；OI-004 / OI-030
- derived_from：[D-011]
- 原 derived_from 依据：T-013
- artifacts：[]
- **decision**：在 D-011 的相对阈值之上，**追加一条非相对必要条件**：OCR 臂必须**至少产出 1 条 actionable finding**；否则直接判 **no-go** 并保留 fallback。
- **（校正（D-026，2026-09-22 用户裁决）：原 decision 逐字为「在 D-011 的相对阈值之上，**追加一条非相对必要条件**：OCR 臂必须**至少产出 1 条 actionable finding**，**或有**一份明确、可复核的「本材料确无问题」结论；否则直接判 **no-go** 并保留 fallback。」用户裁决「删掉该分支」，第二析取支（「**或有**一份明确、可复核的「本材料确无问题」结论」）**已删除**；原表述逐字保留于本注，既有内容未丢。后果：**两臂都零发现**的情形由「可用第二支逃逸」改为**判 no-go（保留 fallback）**；CF-4 由此 **RESOLVED by D-026**。）**
- **（校正（H6/CF-4，历史记录，状态见下一条）：本条的第二个析取支（「**或有**一份明确、可复核的『本材料确无问题』结论」）在当时**没有、现在仍然没有**判定 oracle——判定维度（怎么算「真问题」、「确无问题」由谁认、样本量多少才有判别力）被整体 deferred（OI-030 `status: deferred`，完成条件「三项判定维度成文」未成文）。后果：**任何零发现结果都可以用该支逃逸，D-014 因此不可判真假**，与 AC-55「阈值在实验前写死并对照得出 go/no-go」冲突。本修复**不自行**改这一支，冲突登记为 **CF-4**。）**
- **（D-026 更新（2026-09-22 用户裁决）：上一条「本修复不自行改这一支」的未决状态**已终结**——用户选定「删掉该分支」，本条 decision 已按 D-026 收窄为「至少 1 条 actionable finding」；CF-4 **RESOLVED by D-026**。上一条的 H6 记录逐字保留作历史。）**
- **原因**：堵住「两臂都差也算通过」的判别力漏洞，同时满足 AC-55 对阈值可判真假的硬要求。
- **后果**：go/no-go 结论具有判别力。
- **风险**：若实验材料确实无缺陷，会误判 no-go。**规避**：实验材料选一个**已知含缺陷**的真实任务。
- **状态**：confirmed

### D-015

- module：DSP-01 处置
- requirement_ids：[]
- 原 requirement_ids 依据：方向审查 finding `F-b63b8fcd6c30`（blocking）
- derived_from：[]
- 原 derived_from 依据：T-014
- artifacts：[specs/workflowhub-thin-core-card-05-20260919/decision-log.md]
- **decision**：判定该 reviewer **越出盲审边界**——blind 合同 `forbidden` 明确含 `proposed_solution` 与 `decision_log`，而该 finding 要求的正是「统一的范围选择、候选方案、被拒替代方案、可 challenge 的 current selection」。**登记为合同已知张力 + 实验已知差异，不为了消一条 finding 而修改合同。**
- **原因**：为消 finding 而改合同，等于让审查者改写审查规则，是自审自判的变体。
- **后果**：该 blocking finding 的处置为 `disputed`，不是 `fixed`——**如实保留，不粉饰**。
- **风险**：后续方向审查会重复报同一条。接受。
- **状态**：confirmed

### D-016

- module：OCR 内部静默丢弃
- requirement_ids：[]
- 原 requirement_ids 依据：D-013 连带风险；OI-029
- derived_from：[D-013]
- 原 derived_from 依据：T-015
- artifacts：[specs/workflowhub-thin-core-card-05-20260919/research/RF-18-ocr-delegate-packet-recipe.md]
- **decision**：适配层**解析 OCR 的 `too_large` 等丢弃信号，把每个被丢弃的文件提升为一条质量事实如实记录**（不阻断、不报错，但账上看得见）。
- **原因**：取消我方闸门后，风险从「响亮失败」变为「安静变少」；不记录就等于把 s3 的教训换个形式重演。
- **后果**：质量账本中「审了什么、丢了什么」可区分——这也顺带修掉现行「只有 findings、无 verdict/覆盖声明」导致「未派发」与「真无问题」不可分的缺陷。
- **风险**：OCR 的丢弃原因可能不止 `too_large` 一种，须穷举；漏掉的丢弃仍会静默。
- **状态**：confirmed

### D-017

- module：修复层次
- requirement_ids：[R-019]
- 原 requirement_ids 依据：T-017；PRD SD-17 / OI-013
- derived_from：[]
- 原 derived_from 依据：T-017
- artifacts：[docs/adr/0032-review-chain-delegation-and-layer-contract.md, CONTEXT.md]
- **decision**：本卡修的是**「审查层」的行为契约**，不是给 wh-review 打补丁。修复面：**派发语义 / 聚合语义 / 超时与取消 / 启动自检 / 成本计量**，**10 个审查面共同受益**。3 个代码面换 OCR 委托；7 个文档面继续用现有 provider，但**走修好的契约**。身份/哈希/回执机制的移除与 wh-review 物理删除**仍归 CARD-06**。
- **（校正/未决（H1→CF-1）：「**超时与取消**」这一修复面与 `docs/adr/0031-review-check-downgrade-and-identity-boundary.md` 的**仍生效裁定正面冲突**（`:70` 20 分钟墙钟等待维持不变；`:71-73` `cancelManaged` 只在源漂移事实下调用、并新增禁止因墙钟计时而调用的断言；`:92` 把「缩短或删除 20 分钟墙钟等待」列为**被否决且缺 ADR 承担**）。本材料与 `docs/adr/0032` 均未提及该 ADR。本修复不自行裁决，登记为 **CF-1**。）**
- **（D-024 更新（2026-09-22 用户裁决）：CF-1 已 **RESOLVED by D-024**——用户选定「承担 ADR，正式接管」：本卡正式接管「超时与取消」修复面并承担 ADR 覆盖（逐字要求见 D-024）；承担 ADR 的成文仍为 TODO，未落盘前该冲突的 ADR 侧记 open。本条 decision 正文按原文保留。）**
- **（校正/未决（H7→CF-3）：本修复面**有一部分实现于第二个仓库** `/Users/Hugh/Hugh/Project/3rd-review`——材料自己引用的 `broker.mjs:577` 就在该仓，取消 / 孤儿治理 / 健康裁决也在该仓（`lib/broker.mjs:664,702,725` + `lib/runtime.mjs:96,135,155`）。但材料把工作面限定为本仓，全卡**没有任何跨仓交付登记**（接收方 / 接口契约 / 验收判据）与跨仓授权声明，而 D-030⑤ 与 `ADR-0031:85`（= `docs/adr/0031-review-check-downgrade-and-identity-boundary.md:85`，F-09 全路径规范化） 明确要求如此。本修复不自行扩面，登记为 **CF-3**。）**
- **（D-025 更新（2026-09-22 用户裁决）：CF-3 已 **RESOLVED by D-025**——本卡承担跨仓修复并登记（接收方 `3rd-review` / 接口契约 / 验收判据，且不以延期形态留存）；跨仓改动尚未实施。本条 decision 正文按原文保留。）**
- **（校正/未决（M2→CF-7）：「10 个审查面共同受益」把 any-of-N（D-005）**无差别**施加到仍走旧 provider 链路的 7 个文档面，而用户 T-003 的原话限定在「进行 **ocr 的委托模式**审查」。对那 7 个面而言，这等于**在没有针对它们作出任何决策**的情况下把多源一致性判据降为单源即可通过；承担「如实标注单源」的机制（`independence: partial`）所在的 OI-027 仍是 `deferred`。本修复不自行裁决，登记为 **CF-7**。）**
- **原因**：取证结论——病在编排层（派发/聚合/超时/取消），不在工具本身。修工具等于把病灶留在原地。
- **后果**：修复面与 CARD-06 的删除面**存在重叠**（它要删的正是本卡要修的）。按 SD-14「先冻结接口的一方为集成责任方」协调，须错时或分面合并。
- **风险**：本卡交付显著变重；须在 build-plan 用并行声明制（SD-11）拆分工作包并声明读集/写集/文件 owner。
- **状态**：confirmed

### D-018（范围扩大，须显式登记为对 PRD CARD-05 范围节的偏离）

- module：范围
- requirement_ids：[]
- 原 requirement_ids 依据：PRD CARD-05 范围节（「不含 wh-review 物理删除、不含审查基建资源修复」）；AC-23
- derived_from：[]
- 原 derived_from 依据：T-016 用户真实答复（逐字见下）
- artifacts：[docs/adr/0032-review-chain-delegation-and-layer-contract.md, specs/workflowhub-thin-core-card-05-20260919/decision-log.md]
- **decision**：本卡范围在 D-006 基础上**扩大**为：①3 个代码审查面**替换**；②7 个文档审查面的**问题修复**（通过 D-017 的审查层契约修复，不替换工具）；③wh-review 的阻塞类问题**彻底一并解决**。
- **（校正/未决（H3→CF-2）：本条「3 个代码审查面」沿用了 D-006 的面集，而该面集与代码事实及 RF-11 的「3 个 diff 面」**不是同一集合**（`build-code/integration` 是非 diff 面且合同禁止投递 diff）。面集本身不自行裁决 → **CF-2**；「7 个文档审查面」的枚举计数问题见 `## 已选方向` 修复面校正（M6）。）**
- **（D-023 更新（2026-09-22 用户裁决）：CF-2 已 **RESOLVED by D-023**——「3 个代码审查面」（`build-code/phase`、`build-code/integration`、`verify-code`）在 D-023 落地后即为**3 个真实 diff 面**（`build-code/integration` 的合同改为 diff 输入）；本条 decision 文本按原文保留不改。）**
- **（F-13 就地标注（2026-09-22 晚）：本条的「3 个代码审查面」与「7 个文档审查面」为**旧面集表述**，**已由 D-023 + OI-026 取代**。唯一权威面集事实见 `## 已选方向` 修复面段的 F-13 权威面集注；本条原文逐字保留。）**
- **用户原话（逐字）**：「当前任务既要负责三个代码审查面的替换，也要负责其他7个审查面的问题修复，wh-review技能这么多问题和阻塞，也要彻底一起解决！」
- **后果**：⚠️ **这是对母 PRD 的显式偏离**，须在阶段末遗漏披露与 build-spec 中登记，不得静默执行。
- **边界（不变）**：wh-review **物理删除**仍归 CARD-06；身份/哈希/快照/回执校验机制的移除仍归 CARD-06（OI-013 全删面）；**不新增固定审查轮次**（AC-23 失败判据）。
- **风险**：与 card-02（已承接 ① 与文档审查档）、CARD-06（删除面）、CARD-09（并发上限）三处写面重叠，须逐项协调。
- **状态**：confirmed

### 7 个文档审查面的问题清单（D-017 的修复对象，源自取证）

| # | 问题 | 取证来源 |
|---|---|---|
| P1 | `initial[]` 语义为「必须全部可派发」，任一所列 provider 未配置即整条 `ROUTE_UNAVAILABLE` 且**零派发** | RF-09；s1 的 11 次死锁。**（校正：原把 s1 的 11 次零派发**直接归因**于 `initial[]`——独立替代审查 finding H2 判定为误归因：该错误串唯一来自 `third-review-host-config.mjs:211` 经 `:701` 的 `host_provider` 校验，与 `:710-720` 的 `initial[]` 枚举无关；P1 的机制事实（整组严格性）保留，因果归因见 RF-09 行校正。）** **（D-024 同步：「`docs/adr/0032` 背景节仍重复该旧归因」一节已由 2026-09-22 修复——ADR-0032 的「背景」bullet 已改写为 `:211` 经 `:701` 的真实归因并留更正记录；同一误归因不再从 ADR 流入 build-spec。）** |
| P2 | `minimum_heterologous` 有**三把不同的尺子**（选择期 distinct model / 派发前重算 / 聚合期 distinct adapter + source_id） | RF-09；s1 RC-1 |
| P3 | `REVIEW_QUORUM_INCOMPLETE` **丢弃已完成的审查** | s1 RC-2；**RF-16 在本卡自身材料上复现** |
| P4 | **审查链**的轮次上限**只存在于散文**，审查链代码内无数字轮次上限 | RF-09；s4「SKILL 写最多 4 次，实跑 22 次」。**（校正：原表述为「代码层无任何数字上限」——作用域过宽；`skills/debate/pk-rules.ts:104` 的 pk 环节确有数字上限 `if (round >= 2)`，`:94`/`:107` 为 `max_rounds_reached`。）** |
| P5 | 宿主等待预算（45/60/65s）远小于 provider 需求（实测 1,200,000ms），且**超时不取消 broker** → 既没审成又付了额度，还留孤儿进程 | s3；s4。**（校正（M7）：① `1,200,000 ms` **不是 provider 的需求**，而是宿主侧的总等待上限 `DEFAULT_MANAGED_TERMINAL_WAIT_MS`（`skills/wh-review/scripts/simple-review-runner.mjs:41`，其 `:39-40` 注释自述「It is a total wait bound, NOT a stall detector」）；材料自己实测的 provider 最长耗时是 **432,004 ms**（RF-16）。② 「45/60/65s」中仓内只能找到 **65 s**（`runtime/review/review-record-route.mjs:26` `DEFAULT_REVIEW_ROUND_TIMEOUT_MS = 65_000`），45 s / 60 s 无对应常量。③ 「还留孤儿进程」与本仓注释及 broker 设计**相反**：`simple-review-runner.mjs:33-36` 明写「the broker is deliberately NOT cancelled… orphans are reaped by `cleanup(root, ttl_hours)`」，孤儿治理实现在 `/Users/Hugh/Hugh/Project/3rd-review/lib/broker.mjs:664,702,725` + `lib/runtime.mjs:96,135,155`（`orphan_timeout_ms` 默认 30000）。P5 的实质关切（轮次超时 65 s ≪ provider 实耗最长 432 s，且 broker 不因墙钟取消 → 钱花了、审查没成）保留；但**该修复面（超时与取消）本身与 ADR-0031 的冲突见 CF-1**。）** **（D-024 更新（2026-09-22 用户裁决）：CF-1 已 **RESOLVED by D-024**——本卡正式接管「超时与取消」修复面并承担 ADR 覆盖；承担 ADR 的成文仍是 TODO（见 D-024），未成文前冲突记 open。）** |
| P6 | fail-closed + 「一 phase 一次不重试」把一次基建抖动**永久固化**为该 phase 无法重审 | s3。**（校正（H4）：P6 原举的核心实例是 307,200B 字节闸门 fail-closed，而该本地字节上限在基线 `642d4fb2` 上**已不存在**（`review-input-bounds.mjs` 头注释；`tests/contract/review-input-bounds-portability.test.mjs:30` 断言常量不存在）。P6 仍然成立的部分是「**一次基建抖动 + 不重试 ⇒ 永久固化**」这一失败语义，活义务同样是**不回归 + 不重新引入**，不是「移除字节闸门」。）** |
| P7 | 无派发前**通道自检**；材料身份/锁/投影/recorder 认证全耦进同一次调用，任一处不一致即作废 12–20 分钟的 3-provider 运行 | s2 RC-6；s1 |
| P8 | **无 token 计量**（`usage`：`attempt.json` 键为 `null`、provider output 无该键）→ 无成本收益反馈回路。**（校正：原表述为「`usage=null` 三层一致」；实测口径见 RF-16 基线登记。）** | RF-16 |
| P9 | 输出协议**只有 findings、无 verdict/覆盖声明** → 「未派发」与「真无问题」在账本上不可区分 | s3 RC-5 |
| P10 | `direction-review.v1` flow 无生产调用方，`broker.mjs:577` **静默跳过**方向校验 → 盲审约束实际未生效 | RF-16 / DSP-02。**（补充（H7）：`broker.mjs:577`（`if (!input.review_flow) return;`）**不在本仓**，逐字存在于第二个仓库 `/Users/Hugh/Hugh/Project/3rd-review/lib/broker.mjs:577`；本仓等价事实在 `review-provider-client.mjs:936/1034`（可选）、`simple-review-runner.mjs:1446/1536`，且 `grep review_flow tools/ runtime/ core/ workflows/` 零命中。跨仓交付登记缺失见 CF-3。）** **（D-025 更新（2026-09-22 用户裁决）：CF-3 已 **RESOLVED by D-025**——本卡承担跨仓修复并登记交付（接收方 `3rd-review` / 接口契约 / 验收判据）；`broker.mjs:577` 的物理位置即该仓。跨仓改动尚未实施。）** |
| P11 | 错误语义混乱：路由级拒绝被记为 `REVIEW_EXECUTION_FAILED` 且 `provider_attempts` 为空，导致下游二次失败 | s1；OI-010 |
| P12 | stale lock 跨整个 provider 调用持有；SIGTERM 后遗留锁 + 0 attempt | s3 |
| P13 | 同一关注点多控制面（307,200B 两处双写）→ 改一处还有另一处，造成 121 分钟返工 | s3。**（校正（H4）：该「两处双写」的常量在基线 `642d4fb2` 上**均已不存在**——`TASK_BOUND_PROVIDER_INPUT_MAX_BYTES` 由 `tests/contract/review-input-bounds-portability.test.mjs:30` 断言不存在，`PHASE_DIFF_MAX_DELIVERY_BYTES` 由 `tests/contract/review-materials-contract.test.mjs:81` 断言不存在；s3 的 121 分钟返工仍为历史事实，但本卡对该项的活义务是**不回归 + 不重新引入**（多控制面双写的结构教训仍适用）。）** |
| P14 | **审查历史绑定锁死后续审查**：snapshot 变化后，前一次审查的 pair 被判定 `foreign` 并丢弃成员，导致新审查在派发前以 `REVIEW_HISTORY_UNAVAILABLE` 失败——**零派发**，且仍 `exit 0` | RF-19（step 10 实测）；OI-013/FR-57 |
| P15 | **证据完整性假绿（high，审查层）**：`runtime/review/review-record-route.mjs:2107-2114` 的 `evidence_anchor_valid: providerFindings.map(() => true)` **把每条 finding 的锚点有效性无条件伪造成 `true`**，与同文件 `:1689`（正常路径要求逐条校验）和 `:1651-1654` 注释（原文「Providers can report a completed lifecycle with a broker error (for example an invalid finding anchor)」）**直接冲突**；污染下游 `aggregateCanonicalProviderResults` 的 `evidence_status` | RF-20（**已亲验**）；D-017 修复面「聚合语义」 |
| P16 | **测试套件必红 + 失败路径无界落盘（high，审查层）**：`runtime/review/review-record-route.mjs:1356-1364` 在身份漂移（identity drift）分支调用 `recordUnavailableRequest({... error: { code: "REVIEW_SOURCE_DRIFT", ...}})`，而该函数（签名在 `:844`，含 `dispatchState = "blocked_before_dispatch"`）会**无条件落盘一个 attempt**（函数内 `:864` 自注「The attempt was persisted, but the requested semantic review remains…」）；与契约测试 `tests/contract/review-material-change-redispatch.test.mjs:274`（`expect(drifted.attempt_ref).toBeUndefined();`）和 `:309`（`expect(drifted).not.toHaveProperty("attempt_ref")`）**正面冲突**，且该测试**不在 card-02 的改动集内**（已 grep 该 diff，计数为 0）→ **仓库 suite 必红** | RF-20（**已亲验**）；D-017 修复面「派发语义」 |
| P17 | **unavailable 返回不可达（medium，审查层）**：`runtime/review/review-record-route.mjs:1310` 身份二次认证失败分支调用 `recordSimpleReviewResult`，后者在 `:2000` 又调用同一个 `assertAuthenticatedReviewIdentity`，中间无 `await` 让出 → **必然重抛**，承诺的 unavailable 返回**不可达** | RF-20（**子代理报告，未亲验**）；D-017 修复面「派发语义」 |
| P18 | **宿主绝对路径泄漏（medium / security，审查层）**：`executionPreparationError` 把含**宿主绝对路径**的原始异常写入不可变的 attempt / report，**绕过**仓库既有的 `<host-path-redacted>` 脱敏约定 | RF-20（**子代理报告，未亲验**）；D-017 修复面「派发语义」 |

> **闭环清单（P1–P18）与 2026-09-22 用户裁决的对齐（只登记关系，不改条目本身）**：闭环清单**原为 P1–P14**（上表 P1–P14 十四个条目与本节原有校正注的原文与语义**一律逐字保留、不改**），**2026-09-22 晚经同一任务的追加修订扩为 P1–P18**（新增 P15–P18 四行，**均为审查层缺陷**，依 D-017 的「审查层」定义属本卡修复面；来源为 RF-20 的两臂对照实验）。除这四行外**不新增、不删除**条目（原表述「闭环清单仍为 **P1–P14**，**不新增、不删除**条目」为**当时**状态，逐字保留于本注）。裁决后的归属变化：**P1** 的因果归因更正已同步进 `docs/adr/0032`（见该行）；**P5**（超时与取消）由 **D-024** 承担 ADR 覆盖；**P10** 的跨仓部分由 **D-025** 承担并登记；被替换面集的口径（原 CF-2）由 **D-023** 统一为 **3 个真实 diff 面**；**P14** 仍为用户显式追加（CF-5 记录）。上表每一行的原文与既有校正注逐字保留。

> **追加的程序状态（如实登记）**：D-021 原文要求「超出即须用户显式追加」。**P15–P18** 与 **D-032 ~ D-036** 由本卡在 **2026-09-22 晚**（阶段关闭后）以同一任务的追加修订折入，**用户对本次修订的重新确认尚未取得**。该状态已在文末「阶段末遗漏披露与交付说明」的 **D. 阶段关闭后的追加**小节登记；本次追加**不得**被读作已获用户确认。

> **（P22 追加后的闭环清单口径（2026-09-22，只登记口径，不改条目本身））**：P19 / P20 / P21 的追加见 **D-037**（全文在该决定与本文件末 `### H.`；本表未新增行）；**P22** 的追加见 **D-040**（全文在本文件末 `### H.` 的 P22 条目）。**闭环清单现为 P1–P22**。本表 P1–P18 各行与本节上两条 note 的原文及既有校正注**一律逐字保留、不改**。

### 实验副产物：card-02 交付物缺陷（不属本卡修复面）

> **归属说明**：以下 5 条由 **RF-20 的 Arm B** 在审 card-02 交付物时发现，针对的是 **card-02 的交付物**（验收脚本与其验证方式），**不是审查层**缺陷，故按 **D-036** **不并入 P1–P18**，只登记并明确归属：随 build-spec 移交，由 build-spec 的协调节询问归属卡。**本卡不因「顺手」而扩大修复面。**

1. **medium** `tests/acceptance/card-02-current.mjs:126` —— producer 的唯一单测 `tests/acceptance/card-02-current.test.mjs` **不在任何 `test:*` 分组**、也未登记豁免 → 无人执行，且使 test-entry-grouping 收尾断言变红。
2. **medium** `tests/acceptance/card-02-current.mjs:110` —— vitest 断言判定靠 **verbose 文本正则**，唯一验证是测试里手写同源 stdout（`" ✓ file > named suite > test"`）→ 正则写错也能全绿（card-01 用的是 `--reporter=json`）。
3. **medium** `tests/acceptance/card-02-current.mjs:139` —— deferred/unavailable 的 boundary readback 只是 `tasks.md` **全文子串命中**（`deferred` 出现 24 次），命名断言用通用 mixed-outcome 用例（fixture 是 AC-EXE-001/002）→ **非独立证明**。
4. **low** `tests/acceptance/card-02-current.mjs:157-171` —— `produceCard02Current` 接受 `cwd` 参数并用于 `spawnSync`，但 `:171` 的 `readFileSync("specs/workflowhub-thin-core-card-02-20260919/tasks.md")` 用 `process.cwd()` 而非传入的 `cwd`；且无 try/catch。
5. **medium / documentation** —— `control-plane-inventory` 仍登记**已经删除**的 size bounds / truncation。

**证据强度**：以上 5 条均为 **子代理报告，未亲验**。

**OCR 适配层新发现（父代理亲验，非 card-02 交付物问题）**

- **Project 级规则文件会被静默自动加载**：`<repo>/.opencodereview/rule.json` 是 OCR 的 **Project 级**规则位置（层级见 RF-15：`--rule`(Custom) › Project › `~/.opencodereview/rule.json`(Global) › 内嵌 System）。本轮做 rule schema 探测时在 worktree 根留下了 `.opencodereview/rule.json`（298 B，仅 1 条 `**/*.md` 规则、3 条 rubric 项，**缺 D-012 四要素中的严重度分级与条数上限**）；该文件会被此后**任何一次未显式传 `--rule` 的 `ocr` 调用静默加载**，且**不产生任何警告**——与 RF-10 已记录的「畸形规则文件静默回退到内建规则」**同族**。
- **已做的处置**：该残留**已移出 worktree**（→ `/tmp/card05-removed-opencodereview-dir/`，**未删除，可回滚**），故它不再构成本次交付物的一部分，也不会影响本卡后续的 OCR 调用。
- **未解决（机制性风险仍在）**：适配层必须**只认显式传入的 `--rule`**；并且对「未传 `--rule` 时 repo 内存在 Project 级规则文件」这一情形，必须**发出可复核的记账事实**（同类义务见 D-016「把丢弃提升为质量事实」/ D-027「禁止假闭合」）。**owner = build-spec（承接）/ build-plan（落实现）**。

## 新增 OI（Talk round 2 派生）

| OI | 类别 | 问题 / 未知 | 来源 | 状态 |
|---|---|---|---|---|
| OI-022 | complete_user_flow | D-007 的实现载体：现行机制只有 broker group request，无「按指定 provider 起独立子代理」能力。用什么承载逐路派发？ | RF-09；D-007 | open |
| OI-023 | success_failure_boundary | D-010 的隔离边界冲突：审查方「能读仓库」vs 现行 provider 只读 bundle（`review-materials.mjs:1926`）。新执行者的身份与边界如何定义？ | RF-09；D-010；取证 s3 缺陷 (i) | open |
| OI-024 | data_state | 本卡自身的 direction / detail 建议审查（manifest step 6 / step 10）怎么做——取证显示这条路自身就会自陷失败；能否同时作为对比实验的真实语料？ | make-decision steps.json:10,14；本次取证 | open |
| OI-025 | success_failure_boundary | 包体积上限的处置：s3 因 455,671B / 486,777B 超 307,200B 而零派发；用户已当面要求「彻底删除审查的 307,200B 上限，根本就不应该有任何上限和阻塞」。D-002 选定 packet 形态会放大体积矛盾。 | 取证 s3；用户 2026-09-21 08:12 介入原话 | **confirmed（D-013：取消一切 fail-closed 上限，不分片）** |
| OI-026 | complete_user_flow | **审查面 → 工具 / 输入形态 / fallback 映射表缺失**（方向审查 finding `F-0af34640f0f7` 提出）。RF-11：10 个审查面只有 3 个是代码 diff。本卡范围虽已缩至代码三点（D-006），仍须显式登记「另外 7 个面由谁、用什么、何时覆盖」，否则未覆盖面无声消失。 | 方向审查 finding #1；RF-11 | open |
| OI-027 | success_failure_boundary | **聚合 / quorum 语义无 OI 覆盖**（方向审查 finding `F-41f80f523c19` 提出，取证根因 #2 无主）：已完成审查在何种条件下可被丢弃、单一来源 findings 如何以 `independence: partial` 降级发布、`REVIEW_QUORUM_INCOMPLETE` 的替代语义。D-005 已给方向，但缺可执行契约。 | 方向审查 finding #4；RF-16；D-005 | open |
| OI-028 | complete_user_flow | **派生项 D-106（主会话上下文守恒）无对应 OI**（finding `F-57aaa1cafe78`）。用户声明 6 要求主会话只做规划/派发/交互；须显式登记为执行约束或记录为有意不设 OI。 | 方向审查 finding #6；需求变更记录 D-106 | open |
| OI-029 | success_failure_boundary | **OCR 内部静默丢弃的处置**（D-013 连带风险）：单文件 diff 超 `max_tokens` 80% 被直接丢弃并附 `too_large` warning，**不导致失败**。取消我方闸门后，风险由「响亮失败」变为「安静变少」。须在适配层把丢弃事实提升为质量事实如实记录。 | RF-10；D-013 | open |
| OI-030 | success_failure_boundary | **审查内容质量的实验判定维度**（finding `F-a4502e0ae7fe`）：D-012 已定 rubric 四要素，但 go/no-go 需要**可观察的评估维度**才能验证「是否真的发现了漏洞/边界/意外交互」。须定义：怎么判定一条 finding 是「真问题」、怎么算「锚定准确」、样本量多少才有判别力。 | 方向审查 finding #10；D-011；D-012 | open |

### 新增 OI（RF-19 派生）

| OI | 类别 | 问题 / 未知 | 来源 | 状态 |
|---|---|---|---|---|
| OI-031 | success_failure_boundary | **审查历史绑定（snapshot / pair member binding）在何种条件下可以阻断新审查派发？** 现行行为是「前一次审查的 snapshot 变化 ⇒ 后一次审查零派发」，与 FR-57 / OI-013「派发不依赖材料身份/哈希/快照/回执校验」直接冲突。 | RF-19、`review-record-route.mjs:1173/1139/1147/1382-1402` | **confirmed（AC-58 通过条件 + D-017 修复面「派发语义 / 启动自检」；RF-19 实测该失败条件现存，见 OI 记录 `counterexample_boundary`）** |

> 本条为 RF-19（step 10 细节建议审查实测）派生，非 Talk 派生；终局字段与依据见 `### OI 记录` 中 OI-031 的记录与文末「未能满足的解析器字段（如实披露）」`### 2′` / `### 3′`。

### 新增 OI（2026-09-22 gap 修复派生）

| OI | 类别 | 问题 / 未知 | 来源 | 状态 |
|---|---|---|---|---|
| OI-032 | success_failure_boundary | **card-02 入向义务承接**：card-02 对 CARD-05 的带 owner 入向义务（`OPEN-002` 适配合同增强 / `RISK-003` provider 侧输入上限 / `T-075` 正式 run 路径未验证），本卡材料此前对这些标识零命中；须登记 owner、trigger、consumer 与关闭条件，不得主张本卡能自行关闭。 | card-02 `spec.md:636-641` / `spec.md:605-611` / `decision-log.md:1856` | **deferred（owner / trigger / close 条件见 OI 记录）** |
| OI-033 | data_state | **unavailable 状态集合**（FR-53 / AC-54 六要素之一）：材料此前 `状态集合` 零命中；须由适配合同冻结事件给出**完备枚举**，每状态带触发条件 / 判定依据 / 三档路径 / 记账字段；本次只给出 11 项**已取证状态种子**（非完备集合）。 | 母 PRD FR-53 / AC-54；RF-05 / RF-10 / RF-15 / RF-16 / RF-19 / RF-18；card-02 OPEN-002 | **deferred（owner = build-spec；完成条件见 OI 记录）** |

> 本条为本次修复派生（既非 Talk 派生，也非 RF-19 派生）；终局字段与依据见 `### OI 记录` 中 OI-032 / OI-033 的记录与文末「未能满足的解析器字段（如实披露）」`### 2′` / `### 3′`。

### 新增 OI（2026-09-22 晚，OCR 委托模式端到端实验派生）

| OI | 类别 | 问题 / 未知 | 来源 | 状态 |
|---|---|---|---|---|
| OI-034 | success_failure_boundary | **D-033 与 `verify-code` 面 `forbidden` 列表的冲突解法未定**：packet 的需求组件必须含 AC 全文，但该面的材料契约 `forbidden` 含 `acceptance_criteria` → 须在 build-spec 二选一（放宽 forbidden / 显式登记「本面无法审需求保真」），不得静默降级。 | D-033；RF-20（Arm B 能力缺口 ②） | **deferred（owner = build-spec；完成条件见 OI 记录）** |
| OI-035 | success_failure_boundary | **D-035 并集入账的执行契约未成文**：去重规则（同一 file:line + 同一 claim）、来源强度判定粒度（`corroborated` / `single_source` ↔ OI-027 的 `independence: partial`）、入账时点（何时可判定全部已派发路由终态）三项均无明文契约。 | D-035（修正 D-005）；RF-20（重叠 2 条 / 并集 9 条）；OI-027 | **deferred（owner = build-spec；build-plan；完成条件见 OI 记录）** |

> 本条为 2026-09-22 晚（阶段关闭后）的追加修订派生；两条均为 `deferred`，终局字段与依据见 `### OI 记录` 中 OI-034 / OI-035 的记录。**其程序状态（用户重新确认尚未取得）见文末「阶段末遗漏披露与交付说明」的 D 小节。**

### RF-10 OCR 规则可替换性（一手实测，含未决 schema 缺口）

**这一条决定 OCR 到底只能审代码、还是也能审文档。**

一手实测（`OCR_NO_UPDATE=1`，本机 v1.12.8）：

| 事实 | 证据 |
|---|---|
| OCR **硬依赖 git** | 本机 README「Prerequisites: **Git >= 2.41** — Open Code Review relies on Git for diff generation, code search, and repository operations」；实测非 git 目录下 `ocr delegate rule` → `Error: /tmp/ocr-p2 is not a git repository`，**EXIT=1** |
| `.md` 默认被排除 | `ocr delegate preview` → `0 reviewable / 1 total`，理由 `unsupported_ext` |
| `include` 可旁路该闸门 | 加 `{"include":["**/*.md"]}` 后 → `1 reviewable / 1 total`（**已复现**） |
| OCR **有自定义规则注入机制** | 二进制内确认：来源标签 `Custom (--rule)` 与 `System built-in`；prompt 头 `## User-Specific Rules (Mandatory)`；模板变量 `{{system_rule}}`；规则层级 `--rule` → `.opencodereview/rule.json` → `system_rules.json`；README 称「template-engine-based rule matching」 |
| OCR **没有 markdown 语言规则** | `rule_docs/` 全表（二进制确认约 50 项）含 `default/go/python/java/json/yaml/properties/pom_xml/package_json/cargo_toml/composer_json/github_workflows/mapper_dao_xml/...`，**无 markdown/txt** → 文档只能落到纯代码导向的 `default.md` |
| prompt 模板不可运行时覆盖 | 上游原文（子代理引述）：「The template itself isn't a CLI override — to change prompts you edit task_template.json and rebuild.」 |
| ⚠️ 规则 schema **未解** | 我实测 5 种候选形状（`path_rule_map` 顶层 / `system_rules` / `include`+`path_rule_map` / `rules[{path,content}]` / `rules[{pattern,rule}]`）**全部静默回退到 `system / default`**。二进制线索：`"path_rule_map"` 为**嵌套字段**（含缩进），伴生字段名 `file_patterns`、`scope`、`name`、`description`、`path`、`rule`；错误串 `expected '{' in path_rule_map, got %v`、`expected string key in path_rule_map, got %T`、`read path_rule_map value for %q: %w`、`conflicting global rules found` |
| ⚠️ **畸形规则文件静默回退，不报错** | `ocr rules check --rule <畸形>.json <file>` 恒 EXIT=0 并显示 `Source: System built-in / Pattern: default`。这是一个**静默失败模式**：配置写错不会被告知，只会拿到错误的标准 |
| 公开文档在本环境不可取 | `https://open-codereview.ai/docs/delegate` 与 `.../docs/review-rules` 经 web_fetch 均 HTTP 422；上游 `docs/review-rules.md` raw 亦不可取 |

**方向级结论（够用）**：自定义规则**机制存在**（二进制确认），但**确切 schema 未解**。因此「OCR 能否承载 WorkflowHub 的文档/设计审查标准」当前**不可判定**，必须在 build-plan 用一个有界 spike 解决。这一项直接进 go/no-go 风险面：**若 schema 无法承载文档规则，OCR 只能审代码**，则 D-006（只做②③④代码审查点）成为唯一可行范围——这反过来加强了 D-006 的正确性。

**取证方法学更正（重要）**：调研子代理的两条结论**未能复现**——① 「非 git 目录 `scan --path` → 3/3 will_review，EXIT=0」，我实测为 `No files changed.`；②「`--rule` 的 `rules[].rule` 可注入任意审查标准」，我实测未注入。**本卡只采信可复现的一手证据**；子代理结论凡未经复现者，一律标注为待验证。

### RF-11 wh-review 的审查面构成（决定 OCR 的实际覆盖率）

`runtime/review/stage-materials.json` 共 **10 个 surface**，其中只有 **3 个是代码 diff**（`build-code/phase`、`verify-code`、`mini_task/implementation`，`source_bundle:"diff"`）；其余 **7 个**（`make-decision/direction`、`make-decision/detail`、`build-spec`、`build-plan`、`build-code/integration`、`mini_task/design`、`non_stage/build_prd`）都是 `source_bundle:"none"` 的**文档 / JSON 审查**。

→ **OCR 的原生场景只覆盖 30%。** 该量化独立地支持 D-006「只做②③④代码审查点」的范围选择。

> **（D-023 更新（2026-09-22 用户裁决）：以上是**基线 `642d4fb2` 的代码事实**；D-023 要求把 `build-code/integration` 的送审合同**改为真实 diff 审查**，故该面在改造后**不再属于「7 个非 diff 面」**，「3 个 diff / 7 个非 diff」的划分随之变化——被替换的 3 个面（`build-code/phase`、`build-code/integration`、`verify-code`）成为 3 个真实 diff 面。原文逐字保留。）**

### RF-12 材料落盘扩展名（决定 `include` 旁路的必要性）

`provider-material-projection.mjs:73-77` 决定落盘扩展名：**字符串值 → `.md`，对象/Buffer 值 → `.json`**（唯一例外 `direction_flow.json` 必须在 bundle 根）。

→ wh-review 送到 provider 的材料**绝大多数是 `.md`**，故 RF-10 的 `include` 旁路对 OCR 接入**几乎普遍必需**，不是可选优化。

### RF-13 现行处置档位（术语更正）

实际为**五档**：`FINDING_DISPOSITIONS = ["fixed", "rejected_invalid", "accepted_risk", "needs_human", "user_decided"]`（`runtime/task/task-store.mjs:230`，另在 3 处逐字重复）。终止态只有 4 个；`needs_human` 是**暂停态不是终止态**（`stage-content-contracts.mjs:449` 原文 "needs_human is a pause state, not a terminal disposition"）。`deferred` 与 `rejected_with_reason` 在 `runtime/`、`skills/`、`tools/` 下 **grep 零命中**——本卡早前记录沿用了错误术语，**在此更正**。且这套属**宿主侧处置层**，不是 reviewer 输出合同（reviewer 是 findings-only）。

### RF-14 本次 make-decision 自身的审查路径（manifest step 6 / step 10）

用户裁定：**按 manifest 跑一次（有界），并作为对比实验的对照臂语料 #0**。理由：用正在被诊断的病例去审我们自己的方案，代价与失败模式直接入库，且 direction review 是 advisory、失败不阻断。

### RF-15 OCR 规则 schema 已解 —— 文档审查标准**可承载**（RF-10 缺口结案）

定点 spike 结论（三条命令实测复现）：

**可用 rule.json 逐字样例**

```json
{"include":["**/*.md"],
 "rules":[{"path":"**/*.md","rule":"需求保真：原文是否被改写？派生需求是否有 source 锚点？边界情况是否列出失败路径？"}]}
```

关键：`rules` 是**数组**，元素为 `{path, rule}`，`rule` 是**内联文本**（不是文件名引用）。

**字段全集**

| 层 | 字段 | 说明 |
|---|---|---|
| 顶层 | `rules`（必需，数组） | |
| 顶层 | `include`（可选，glob 数组） | 旁路 `unsupported_ext` 扩展名门 |
| 顶层 | `exclude`（可选，glob 数组） | 优先于 `include` |
| 条目 | `path`（必需，doublestar glob） | 决定 rubric 归属 |
| 条目 | `rule`（必需，内联 Markdown） | **审查标准正文** |

- 未知键**静默忽略**（`name`/`description`/`scope`/任意键均无害）。
- **不是别名**（实测静默失败）：`pattern`、`content`、`paths`、`system_rules`、`default_rule`、`path_rule_map`。⚠️ `path_rule_map` 是**内嵌 system 文件**的 schema，对自定义规则文件无效——这正是本卡早前 5 次探测全部静默回退的原因。
- 同文件内数组顺序**首个匹配即胜**。

**层级顺序**（高 → 低，实测）

`--rule` → `Custom (--rule)` › `<repo>/.opencodereview/rule.json` → `Project` › `~/.opencodereview/rule.json` → `Global` › 内嵌 `system_rules.json` → `System built-in`

**.md 能否承载文档规则：能，完全能** —— 但有两道**独立**门，必须都开：

1. **扩展名门**：`.md` 默认被 `unsupported_ext` 排除 → 需 `include:["**/*.md"]`（实测 reviewable 21→30）。
2. **规则解析门**：`path` glob 决定 rubric。

⚠️ **陷阱（重要失败模式）**：`ocr rules check` **不受**扩展名门限制——没有 `include` 也会显示 `Source: Project`。**只用它会误判**；必须再用 `ocr delegate preview` 确认 `.md` 出现在 `reviewable_files` 里。

**对 go/no-go 的影响**：RF-10 登记的「若 schema 无法承载文档规则，OCR 只能审代码」这一风险**基本消解**——OCR 可承载任意文档审查 rubric。因此 D-006（只做②③④）不再是"被工具能力逼出来的范围"，而是**基于 RF-11（OCR 原生场景只覆盖 30%）与 card-02 已承接 ① 的主动范围选择**。该结论须在 build-plan 的适配合同中如实登记，不得反过来当作"OCR 不适合文档所以不用做"的借口。

**仍未解决（如实登记，进 build-plan）**

- 上游文档全部 HTTP 422，结论纯来自二进制取证 + 实测，**无上游交叉验证**。
- 条目级 `name`/`description`/`scope` 是"已声明未用字段"还是"未知键"，外部无法区分。
- `include` 在 **global 层**未实测（未写入 `~/.opencodereview/`）。
- **rubric 进入 `{{system_rule}}` / `## User-Specific Rules (Mandatory)` 未端到端验证**：证据止于 `delegate` 边界（`ocr delegate rule` 的 JSON 已确认逐字保留中文规则），真实 LLM 路径未跑（本机无 provider 配置）。
- `rule` 多行值、glob 花括号/排除语法边界未测。
- **`ocr rules check` 恒 EXIT=0，退出码零信息量**，只能断言 `Source`/`Pattern` 两个字段——接入时必须按此设计校验，不能依赖退出码。

### RF-20 OCR 委托模式端到端实验（两臂对照）

**实验目的**：验证 D-004「以 OCR 委托模式接入」在真实代码 diff 上能否端到端产出 findings，并对照「异源 provider CLI」与「宿主子代理」两种委托执行者形态的产出差异。

**语料（回溯臂，D-022）**：card-02 归档的真实代码改动。
- packet：`/tmp/ocr-e2e-packet/`（7 个可审文件 / 260K）
- 只读代码快照：`/tmp/ocr-e2e-context/`（`git archive dd80ceb1`，1789 文件）——用于避免「事后聪明」污染

**OCR 委托三步实测输出**：
- `ocr delegate preview --commit HEAD --rule rule.json` → `# Files (7 reviewable / 8 total)`，`background: CARD-02 审查链与验收脚本改动（回溯臂语料）`。
- `diff/card-02-selected.diff`（1186 行）被 `(excluded: unsupported_ext)` 排除。
- `rule.json` 自身被当成可审文件（噪声，需在适配层排除）。
- `ocr delegate rule --rule rule.json --format json <files>` → **2 groups，`source=custom`**（自定义 rubric 确实注入）：`.mjs` 5 文件一组、`.md` 1 文件一组，各用各的 rubric。

**Arm A（真调 provider CLI，读法 b）**：用 `kimi` CLI（`/Users/Hugh/.local/bin/kimi`，model `kimi-for-coding/kimi-for-coding`）。
- 第 1 次尝试：提示词未约束子代理 → 它派了 3 个子代理 + 3 次 `WaitFor {timeout: 600}` → **900 秒被 timeout 杀掉（exit 124），0 findings**。
- 第 2 次尝试：提示词加入硬约束「**禁止使用 Agent/子代理工具、禁止任何等待/轮询工具**」→ **`exit 0`**，27 次工具调用，交付 **3 条带证据 findings**。
- 耗时口径：单次尝试 900s 上限（被杀）；成功尝试未单独计时。

**Arm B（宿主 DSH 子代理，读法 a）**：**8 条 findings**（critical 0 / high 1 / medium 6 / low 1），8/8 带证据。
- 覆盖：`card-02-current.mjs` 完整 183/183；两个 `review-input-bounds.mjs` 各 25/25（sha256 相同）；`task-store.mjs` 完整 420/420（导入环=0）；`review-record-route.mjs` 全文 2159 行通读；`card-02-spec-head.md` 完整 80/80。

**两臂对照**：

| 维度 | Arm A（kimi CLI） | Arm B（DSH 子代理） |
|---|---|---|
| findings 数 | 3 | 8 |
| 严重度分布 | high 1 / medium 1 / low 1 | high 1 / medium 6 / low 1 |
| 重叠 | 2 条（`process.cwd()` 读材料；`materialPresent` 全文子串匹配弱证据） | 同左 |
| 独有 high | **证据完整性假绿** | **测试套件必红** |
| 并集 | **9 条 distinct findings** | — |

**关键结论（实证）**：两臂是**互补的、不是冗余的**——只跑 Arm A 会漏掉「测试套件必红」，只跑 Arm B 会漏掉「证据完整性假绿」。这是 any-of-N 与「并集入账」（见 D-035）的**实证依据**。

**证据强度**：两臂均为**独立子代理执行并已回收报告**；两臂各自的 high 各一条**已由主会话亲验成立**（见 P15 / P16）；其余条目为**子代理报告，未亲验**。

**两臂各自报告的能力缺口（如实登记）**：
- Arm A 自评：OCR 产物**足够**；唯一缺口是 `.diff` 被 `unsupported_ext` 排除，无法核对「实现与改动的对应关系」。
- Arm B 自评：委托产物**够跑完但缺 3 样**——(1) `.diff` 被排除，变更面只能从快照反推；(2) **需求材料是截断的 spec 头（无任何 AC）**，`.md` 规则的「验收标准可否判真假/失败与取消路径」**无法作答**，故**未对其编造 finding**；(3) **无「改动文件 → owning task/AC/权威 gate」映射**，导致关键 finding 只能判到一半。
- Arm B 次要观察：规则按扩展名扁平分组，25 行的重复文件被审两遍、2159 行文件与 25 行文件同深度。
- Arm B 无法判断项：未执行任何测试（快照无 node_modules）→ 部分 finding 为代码路径推导而非实测红灯；无法确认 vitest verbose 真实输出格式；无法复核仓外 task 目录的产物。

**实验产出报告（已落盘 worktree）**：
- `specs/workflowhub-thin-core-card-05-20260919/research/EXP-arm-a-kimi-cli-review.md`（7,310 B）
- `specs/workflowhub-thin-core-card-05-20260919/research/EXP-arm-b-dsh-subagent-review.md`（31,033 B）

## Grill 记录（step 8，grill-with-docs）

**先核实，再提问**：本轮先完成三项一手核实，只把**无法从代码确定**的问题交用户。

### 核实结论（G-CK）

| 核实项 | 一手结论 |
|---|---|
| `ocr delegate preview --format json` | 键 = `schema_version` / `mode` / `repository` / `total_files` / `reviewable_count` / `excluded_count` / `total_insertions` / `total_deletions` / `reviewable_files[]` / `excluded_files[]`。条目 = `{path, status, insertions, deletions}`。**只有文件清单 + 排除账，无 finding schema。** |
| `ocr delegate rule --format json` | 键 = `schema_version` / `groups[]`；group = `{group_id, source, pattern, files[], rule}`。**只有规则，无 finding schema。** |
| finding schema 从何而来 | **委托模式不产出。** 本卡早前记录的「OCR 提供 finding schema 脚手架」**不成立**，必须由 workflowhub 自定义（已由 D-019 定） |
| 内容级静默丢弃（`too_large`） | 属 OCR **自管 LLM 路径**（`ocr review` / `scan`）。**委托模式下 OCR 不读文件内容，故该 OCR 路径不适用**；文件级排除已由 `excluded_files` / `excluded_count` **显式记账**。**（校正（M1）：原行逐字为「属 OCR **自管 LLM 路径**（`ocr review` / `scan`）。**委托模式下 OCR 不读文件内容，故不适用** —— D-016 登记的风险在委托模式下**自动消解**；文件级排除已由 `excluded_files` / `excluded_count` **显式记账**」——独立替代审查判定其中的「自动消解」为**假闭合**：按 D-004，委托模式下真正读文件内容的是**宿主子代理**，内容级丢弃 / 截断的风险只是从 OCR 侧**转移**到子代理上下文边界，并未消解（D-010 风险已承认「能读仓库」放大上下文成本）；该新闸门既无记账面也无 OI 覆盖，已登记为 **CF-6**。另：本风险的原始出处声明为 RF-10，但 RF-10 全节（`:1384-1404`）**不含 `too_large` 事实**——该事实在材料中只以 OI-029 问题原文与 D-013 风险的形式出现。）** |
| 宿主侧 skill / schema 是否随包发布 | **否**。npm 包内仅 `README.md` + `bin/ocr.js` + `imgs/` + 原生二进制；`plugins/**` 与 `skills/**` 均不在包内 |
| finding 字段名权威来源 | 二进制字符串确认：`severity` / `category` / `critical` / `path` / `start_line` / `end_line` / `content` / `existing_code` / `suggestion_code`；并有 `total_dropped`、`severityClass`、`categoryClass`、`too_large.count` |

### Grill frontier 批次（4 个独立决策轴）

| G | 决策轴 | 用户真实答复 |
|---|---|---|
| G-1 | finding schema 归属 | **以 OCR LlmComment 为骨架 + 补证据** |
| G-2 | 审查事实写入位置 | **沿用 `quality/reviews/` 但改命名规范** |
| G-3 | 修复面清单是否闭环 | **闭环清单 + 显式列出不修项与归属卡** |
| G-4 | 对比实验语料 | **回溯（card-02 已知漏检）+ 前瞻（本卡 build-code）** |

### D-019

- module：finding schema
- requirement_ids：[]
- 原 requirement_ids 依据：PRD FR-53 / AC-54；D-012
- derived_from：[D-012]
- 原 derived_from 依据：G-1；G-CK（委托模式不产出 schema）
- artifacts：[docs/adr/0032-review-chain-delegation-and-layer-contract.md, CONTEXT.md]
- **decision**：finding schema 以 **OCR `LlmComment` 为骨架**（`path` / `content` / `start_line` / `end_line` / `category` / `severity`），并按 D-012 补上强制证据字段；**并补入 AC-54 要求的「建议」字段**（字段名 `suggestion_code`，取值为**必填自由文本**，受 D-012 的证据纪律约束——建议须落在同一条 finding 的 file:line 锚点与所引证据上，不得是无数值的等级代码）。
- **（校正/补缺（FR-53 / AC-54；2026-09-22 gap 修复）：原 decision 逐字为「finding schema 以 **OCR `LlmComment` 为骨架**（`path` / `content` / `start_line` / `end_line` / `category` / `severity`），并按 D-012 补上强制证据字段。」——该骨架与「强制证据字段」**都不含建议**，而 AC-54 的失败场景逐字为「任一要素缺失或未冻结即接入，即失败」。补入依据：G-CK 行的一手证据确认二进制含 `suggestion_code` / `existing_code` 字段名（**字段名**有二进制级证据；**取值域**无一手证据，故按「自由文本」登记并如实标注该证据等级，见「FR-53 / AC-54 适配合同六要素逐要素对照」节）。原表述逐字保留于本注。）**
- **原因**：兼容 OCR 生态（SARIF / HTML 导出 / viewer / session compare 均为现成资产）；字段名有二进制级权威来源。
- **后果**：schema 由 workflowhub 定义与校验（OCR 不校验）。
- **风险**：须自写 schema 校验；锚点硬校验（path 存在 + line ≤ 实际行数）须自行实现——**不得因为 OCR 不管就省掉**（wh-review 的 `unanchored_finding_dropped` 是有价值的既有能力）。
- **被否方案**：直接复用 wh-review schema（与 OCR 生态不兼容，且带 CARD-06 待删的机器语义）；双写（**AGENTS.md 明令禁止新增双写**，违宪）。
- **状态**：confirmed

### D-020

- module：审查事实写入位置
- requirement_ids：[]
- 原 requirement_ids 依据：PRD FR-53 / SD-17；OI-012
- derived_from：[]
- 原 derived_from 依据：G-2
- artifacts：[]
- **decision**：**沿用 `quality/reviews/` 目录位置，但文件名改用不可变命名「日期+序号+描述」（append-only、纯文本路径引用、不用内容寻址哈希）**。
- **原因**：位置不动、命名合规、新旧可比；符合 SD-17 记录层要求，且不产生「同一事实两个权威文件」。
- **后果**：旧文件保留只读；新文件按新命名。历史文件名与新命名并存属**已披露的过渡状态**。
- **风险**：改名会让历史文件名不一致；须在适配合同中写明命名规范与旧文件只读边界。
- **状态**：confirmed

### D-021

- module：修复面范围闭环
- requirement_ids：[R-019]
- 原 requirement_ids 依据：D-017 / D-018；方向审查 finding `F-0af34640f0f7`
- derived_from：[D-017, D-018]
- 原 derived_from 依据：G-3
- artifacts：[CONTEXT.md]
- **decision**：**P1–P14 为本卡修复面的闭环清单**；超出即须用户显式追加。同时**显式列出「本卡不修」的根因与归属卡**（下表）。
- **（校正：原表述为「**P1–P13** 为本卡修复面的闭环清单」。2026-09-22 用户已**显式批准**把 RF-19 派生的 P14 追加进闭环清单（并批准 OI-031 判 `confirmed`），故闭环清单现为 **P1–P14**；P14 是**由用户显式追加**进入的，不是材料自行扩大，`### 3′` 第 7 条留痕。原表述逐字保留于本注。）**
- **原因**：杜绝「彻底解决」被隐性口头扩大；满足 grill 退出检查第 4 项。
- **（追加校正（2026-09-22 晚）：闭环清单再扩为 **P1–P18**。OCR 委托模式端到端实验（RF-20）产出 4 条**审查层**缺陷，按 D-017 的「审查层」定义属本卡修复面，故追加 P15 / P16 / P17 / P18（见「7 个文档审查面的问题清单」表末四行与「实验副产物」小节）。上一条校正注中「闭环清单现为 **P1–P14**」为**当时**状态，逐字保留；本节以下 `decision` 行的原文「**P1–P14** 为本卡修复面的闭环清单」亦按 D-021 原文规则**不改写**，其现行读法为 **P1–P18**。**本追加的程序状态（D-021 要求「超出即须用户显式追加」，而用户对本次追加的重新确认尚未取得）见文末「阶段末遗漏披露与交付说明」D 小节。**）**
- **后果**：范围可判真假。
- **风险**：清单若列漏，后续发现需走显式追加流程。
- **状态**：confirmed

**本卡不修项与归属卡（闭环的另一半）**

| 不修项 | 归属 | 依据 |
|---|---|---|
| 身份/哈希/快照/材料/回执校验机制的**移除** | CARD-06 | PRD CARD-05 范围节；OI-013 全删面 |
| wh-review **物理删除**、不换名搬进 Skill | CARD-06 | 同上 |
| 审查基建**并发上限数值** | CARD-09② | PRD CARD-05 范围节 |
| stage objective 的**收敛退出条件**（s1 RC-6 / s4 RC-7：只规定审查数量、不规定收敛） | CARD-04（真实验收）+ CARD-03（子代理方法） | 非本卡工作面 |
| 测试/验收技能未被正常使用（用户 L838 痛点） | CARD-04 | 同上 |
| 新增 token/时间统计面 | **不新建** | 规划 DL D-15（不建 token/时间统计）；本卡只做 `usage` 采集修复（P8） |
| 主会话瘦身验证 | CARD-09 | PRD CARD-09 |

### D-022

- module：对比实验语料
- requirement_ids：[R-005]
- 原 requirement_ids 依据：PRD FR-22 / AC-22 / FR-54 / AC-55；D-014
- derived_from：[D-014]
- 原 derived_from 依据：G-4
- artifacts：[]
- **decision**：实验语料 = **回溯臂（card-02 归档真实材料，s4 已记录 6 条漏检 FN1–FN6 作真值，可算找回率）+ 前瞻臂（本卡自身 build-code 阶段）**。
- **原因**：判别力最强；D-014 要求的「至少 1 条 actionable finding」在回溯臂有真值可比。
- **后果**：交付周期拉长；工作量最大。
- **风险**：回溯臂有「事后聪明」污染——代码已在仓库中，审查者可能凭结果反推。**缓解**：回溯臂以 card-02 的 **diff 快照 + AC** 为输入，并**隐去最终实现**（只给该阶段的改动，不给后续修复）；该缓解须在实验设计阶段冻结。
- **状态**：confirmed

### Grill 结束记录（grill_summary）

```yaml
grill_summary:
  status: completed
  direction_changing_challenges_resolved: true
  context:
    status: changed
    reason: "本卡引入 4 个新领域术语：委托模式、适配合同、审查层、findings 有效率/锚定准确率；均属跨卡长期语义，须进术语表"
    file_references: ["CONTEXT.md"]
  adr:
    status: created
    reason: "三项判据全为真：①难以反转（决定适配层与 finding 契约）②无背景会意外（读者会以为 OCR 自己做审查）③存在真实取舍（vs OCR 自管 LLM、vs 保留 wh-review、vs 10 面全换）"
    file_references: ["docs/adr/0032-review-chain-delegation-and-layer-contract.md"]
  conflicts:
    status: resolved
    disposition: "术语冲突 1 处：早前记录的「OCR 提供 finding schema 脚手架」与一手核实矛盾（委托模式不产出 schema），已由 D-019 更正并在 G-CK 留证；CONTEXT.md 不得写入该错误说法"
  requirement_coverage:
    status: complete
    message_classes: [goal, flow_or_surface, data_or_state, success_failure_acceptance, constraint_non_goal_defer]
    uncovered: []
  exit_checks:
    external_interfaces: pass      # ocr delegate preview/rule 输出契约、rule schema、git 硬前置、退出码语义均一手实测
    canonical_names: pass          # finding 字段有二进制级权威（D-019）；事实位置与命名由 D-020 唯一指派
    failure_semantics: pass        # D-005/D-010/D-013/D-014/D-016 已裁；残留 OI-010、OI-027 属实现细节，不改变方向，已记负责人与完成条件
    scope_boundaries: pass         # D-021 闭环清单 + 不修项与归属卡
  decision_updates:
    - "finding schema 归属：以 OCR LlmComment 为骨架 + 强制证据（D-019）；禁用双写"
    - "审查事实位置：沿用 quality/reviews/ + 不可变命名（D-020）"
    - "修复面闭环：P1–P14 + 显式不修项与归属卡（D-021；原为 P1–P13，2026-09-22 经用户显式批准追加 P14；2026-09-22 晚经同一任务追加修订扩为 P1–P18）"
    - "实验语料：card-02 回溯 + 本卡 build-code 前瞻（D-022）"
    - "更正：委托模式不产出 finding schema，且委托模式下内容级静默丢弃不适用（G-CK）"
    - "开放问题：OI-010 错误语义契约、OI-027 聚合/quorum 语义（不会改变方向，记负责人与完成条件）"
```

## 决策（续，2026-09-22 用户裁决：CF-1 / CF-2 / CF-3 / CF-4）

> 本节四条决定由 2026-09-22 用户的逐条真实裁决派生，分别处置文末 `## 独立替代审查发现的未决冲突（须用户裁决）` 的 **CF-2 / CF-1 / CF-3 / CF-4**（对应关系见各条 `derived_from`）。
> 决定本体按用户原话登记；除 D-026 按用户裁决**删除** D-014 的第二析取支（原件逐字保留于该条留证）外，**不改写任何既有决定的正文**——既有决定如与其不一致，在本节与对应 CF 条目中指向本节。

### D-023

- module：改造范围（被替换面集的输入形态）
- requirement_ids：[]
- 原 requirement_ids 依据：CF-2；D-006 / D-018；PRD FR-23 / FR-56 / AC-23 / AC-57；RF-04 / RF-11；OI-026
- derived_from：[D-006, D-018]
- 原 derived_from 依据：2026-09-22 用户裁决（逐字：「修改Intergration，让这个审查也变成真的diff审查」）；CF-2
- artifacts：[specs/workflowhub-thin-core-card-05-20260919/decision-log.md]
- **decision**：把 `build-code/integration` **改造成真正的 diff 审查**——该审查点的送审合同由当前的**非 diff 合同**改为**真实代码 diff 审查**。由此，D-006 / D-018 的「被替换的 3 个面」（`build-code/phase`、`build-code/integration`、`verify-code`）即成为**3 个真实 diff 面**，与「3 个代码审查面」的原意一致。
- **事实（代码现状，基线 `642d4fb2`）**：`runtime/review/stage-materials.json` → `stages.build-code.profiles.integration`：`source_bundle: "none"`、`forbidden: ["changes_diff","cumulative_diff","phase_diff","raw_log","integration_map"]`。故本裁决要求**改该面的合同**：`source_bundle` 由 `"none"` 改为 diff 输入，并从 `forbidden` 中移除上述三个 diff 条目（`changes_diff` / `cumulative_diff` / `phase_diff`）。（`raw_log` / `integration_map` 两项的处置不在本裁决文字内，交 build-plan。）
- **义务层级（登记口径）**：义务写在**新路径的集成审查点须以 diff 为输入**这一层；旧路径（wh-review）的 `stage-materials.json` 矩阵属**过渡机械**，其删除归 **CARD-06**（D-017「身份/哈希/回执机制的移除与 wh-review 物理删除仍归 CARD-06」+ D-021 不修项表）。
- **未决实现问题（交 build-plan，本条不裁）**：**旧矩阵是否也要在改造前一并编辑，还是等新路径落地后只改新路径、旧矩阵由 CARD-06 删除** —— 属实现时序问题，本条**不预先选定**；须在 build-plan 明确，并按 SD-14「先冻结接口的一方为集成责任方」与 CARD-06 协调写面。
- **原因**：用户直接指令（给的是指令，不是选项）；同时消除 D-006 面集与 RF-11 代码事实之间的内部不一致，使「3 个被替换面」与「3 个 diff 面」的所指在改造后一致。
- **后果**：集成审查在结构上与每 phase 审查**同型**（都吃 diff）。它此前与 phase 审查的**区别**来自：以 `approved_spec` + `acceptance_criteria` + `test_evidence` + `ac_trace` 判**集成**，而不是判 diff。改为 diff 审查后，两者**存在冗余风险**（同一 diff 被重复审查）。
- **风险**：① 与每 phase 审查**冗余**（同上）；② **原合同为何禁止 diff，在任何可查材料中都没有记录**——本次修复**未能找到**该理由，故**不代拟**；改造前须由 build-plan 或 CARD-06 补充说明（如实登记该知识缺口）；③ 面集口径变化影响 **OI-026 映射表**的输入（「3 个代码面 / 7 个文档面」的逐一归属须按 D-023 重新登记）。
- **状态**：confirmed（用户裁决，2026-09-22）

### D-024

- module：修复面承担（超时与取消）+ ADR 覆盖
- requirement_ids：[]
- 原 requirement_ids 依据：CF-1；D-017 修复面「超时与取消」；P5；`docs/adr/0031-review-check-downgrade-and-identity-boundary.md:70` / `:71-73` / `:92`；AC-58
- derived_from：[D-017]
- 原 derived_from 依据：2026-09-22 用户裁决（逐字：「承担 ADR，正式接管」）；CF-1
- artifacts：[specs/workflowhub-thin-core-card-05-20260919/decision-log.md]
- **decision**：本卡**正式接管**「超时与取消」修复面，并**承担** ADR-0031 `:92` 所要求的那种「承担 ADR」——即由本卡产出一份 ADR，承担对 ADR-0031 已生效裁定的反转 / 变更（用户选的是 CF-1 的 (a)「承担」，不是 (b)「缩减范围」）。
- **ADR-0031 的实际要求（逐字引用，不转述）**：
  - `:70`（决定 14）：「**20 分钟墙钟等待维持不变**；只登记「源码注释与归档记录不一致」这一事实。」
  - `:71-73`（决定 15）：「**`cancelManaged` 接通**：把 6 处「绝不取消」守卫（`tests/review/review-managed-lifecycle.test.mjs:378,433,478,507,540,584`；真正的墙钟守卫在 `:526-558`）改为「仅在源漂移事实下调用」，并**新增**一条禁止因墙钟计时而调用的断言。」
  - `:92`（被否决的替代方案）：「**缩短或删除 20 分钟墙钟等待**：与 D-030③ 冲突，**缺 ADR 承担**。」
  即：ADR-0031 **保留** 20 分钟墙钟等待、**要求** `cancelManaged` 只在源漂移事实下调用且**新增**「禁止因墙钟计时调用」的断言，并把「缩短或删除 20 分钟墙钟等待」列为**被否决且缺 ADR 承担**的方案。本卡的「超时与取消」修复面若触及上述任一条，**必须先有承担 ADR**。
- **承担范围（本卡所有）**：超时与取消的行为契约变更由本卡拥有并交付：须对照 ADR-0031 决定 14 / 15 与 `:92` **逐条**说明本卡改什么、不改什么，并给出对应验收（与 D-017 修复面「派发语义 / 聚合语义 / 超时与取消 / 启动自检 / 成本计量」中的「超时与取消」同一边界）。
- **TODO（ADR 覆盖尚未落盘，冲突暂记 open）**：`docs/adr/0032-review-chain-delegation-and-layer-contract.md`（或**新 ADR**）**必须**补入这次承担；在该承担写入之前，CF-1 所指的冲突**不算闭合**。本条只登记承担与义务，**不宣称 ADR 已更新**——该 TODO 的完成属后续阶段（build-spec / build-plan 及其后）的交付物，须在 build-plan 登记 owner 与验收。
- **原因**：用户选定「承担」；ADR-0031 `:92` 明确把「缺 ADR 承担」作为否决理由，故承担是本卡修复该面的**前置条件**，不能用「修的是审查层、不是那个 ADR」绕开。
- **后果**：① 本卡拥有超时 / 取消契约变更，D-017 修复面**不移出**；② P5 的实质关切保留（轮次超时 65 s ≪ provider 实耗最长 432,004 ms，且 broker 不因墙钟取消）；③ 承担 ADR 的成文义务挂在后续阶段，**未成文前冲突记 open**（见上一行 TODO）。
- **风险**：承担 ADR 与 ADR-0031 决定 14 / 15 存在**直接张力**（14 要求墙钟等待维持不变；15 要求新增「禁止因墙钟计时而调用取消」的断言，而「超时与取消」修复面要求让超时产生取消效果）。若承担 ADR 只写结论、不逐条对账 14 / 15 与 `:92`，就是**以新决定覆盖旧 ADR 而不留可复核对照**。缓解：承担 ADR 必须逐条引用 `:70` / `:71-73` / `:92` 原文并说明处置（改 / 不改 / 新增断言如何处理）。
- **状态**：confirmed（用户裁决，2026-09-22）
- **增量指示（2026-09-23，用户当前明确要求）**：审查时长不设按墙钟的硬截止；复用 3rd-review 已有健康状态与进度事实持续轮询。进程仍活跃时，即使暂时没有新输出，也不得仅因经过时间而终止；只有真实终态、明确取消或确认 owner/manager 失联才进入清理。此指示取代后续材料对每路 600,000 ms 执行截止及 1,200,000 ms 总等待截止的实现解释；不新增 decision ID、状态对象、命令或 gate。

### D-025

- module：跨仓修复与交付登记
- requirement_ids：[]
- 原 requirement_ids 依据：CF-3；D-017 修复面（取消 / 孤儿治理 / 健康裁决）；P5 / P10 / RF-16；DSP-02；D-030⑤；`docs/adr/0031:85`
- derived_from：[D-017]
- 原 derived_from 依据：2026-09-22 用户裁决（逐字：「本卡承担跨仓修复并登记」）；CF-3
- artifacts：[specs/workflowhub-thin-core-card-05-20260919/decision-log.md]
- **decision**：本卡**拥有跨仓修复**，并须把交付**登记**进第二个仓库 `/Users/Hugh/Hugh/Project/3rd-review`。该仓是材料所引 `broker.mjs:577`（逐字 `if (!input.review_flow) return;`）的物理所在，也是取消 / 孤儿治理 / 健康裁决的实现所在（`lib/broker.mjs:664,702,725` 调用 `cleanup(config.runtime.root, config.runtime.ttl_hours)`；由 `lib/runtime.mjs:96,135,155` 实现，`orphan_timeout_ms` 默认 30000）。
- **登记要求（引既有约束原文，不转述）**：
  - **D-030⑤**（`specs/archive/workflowhub-mechanism-simplification-t2-20260911/decision-log.md:332`）：「跨仓交付项必须登记接收方、接口契约与验收判据」；同档案 `:882` 记其完整表述为「跨仓交付项必须登记接收方、接口契约与验收判据，**不以延期形态留存**」。
  - **`docs/adr/0031-review-check-downgrade-and-identity-boundary.md:85`**：「跨仓 `3rd-review` 的 commit/push 授权属 OI-22 / step 11，**不由本 ADR 授予**。」
  即：登记必须写明**接收方**（`3rd-review`）、**接口契约**、**验收判据**三者，且不得以延期形态留存；而 commit/push 的**授权**不来自 ADR-0031，须走 OI-22 / step 11 的授权路径——本条只作承担与登记，**不代授该授权**。
- **交付 / 审查 / 验证形态（登记须写明）**：① **交付**：跨仓改动在 `3rd-review` 仓内以该仓自身的提交边界交付，登记中须指明接收方与接口契约面（本卡消费侧调用点与 wire 面）；② **审查**：跨仓 diff 须由**未参与实现者**在独立上下文审查（沿用 T-003 / SD-08 的独立替代审查口径），不得自审自判；③ **验证**：验收判据分两侧——本仓侧（消费侧契约测试）+ `3rd-review` 侧（该仓自身测试），两侧的**真实命令与 exit** 均须记录；本卡自有验收套件**不覆盖**跨仓侧。
- **与 worktree 隔离规则的关系（如实登记）**：第二仓库在本任务认证 worktree（`/Users/Hugh/Hugh/Project/workflowhub-workflowhub-thin-core-card-05-20260919`，见「任务身份」表）**之外**；既有事实是「本仓 `activeWorkspace` 只覆盖本任务 worktree」（archive `:882`）。故跨仓改动**不通过**本 worktree 的写面完成，而是在 `3rd-review` 仓内以该仓自身的提交边界完成；本卡只读边界（`## 本卡输入与只读边界`）约束的是**本卡 worktree 及其只读输入**，**不**等于禁止对第二仓的已登记交付。该跨仓写面**必须**在 build-plan 的并行声明制（SD-11）中登记为独立工作包（读集 / 写集 / 文件 owner），并声明它**不改变本卡 worktree 的隔离边界**。
- **原因**：用户选定「承担跨仓修复并登记」；D-017 的修复面在物理上横跨两仓，只做本仓则主机制无人实现（archive `:882-883` 的同一判断与 `HANDOFF-T2-003` 的历史事实）。
- **后果**：本卡交付面扩大到两仓；`## UI applicability` 的工作面枚举须补第二仓；D-018 风险的写面重叠清单（原只列 card-02 / CARD-06 / CARD-09）须补 `3rd-review`；AC-58 一类验收须分别落到两仓。
- **风险**：① 跨仓改动**削弱 worktree 隔离**（同一任务同时改两个仓，回滚与责任边界不再单一）；② 跨仓侧**无法由本卡自身验收套件单独验证**——**披露方式**：跨仓侧的验收证据单独列出（命令 + exit + 归属仓），并在 build-spec 与阶段末遗漏披露中如实标注「本卡验收套件不覆盖该侧」，**不得以本仓绿测替代跨仓验证**；③ commit/push 授权不在本决定内（ADR-0031 `:85`），未取得前不得推送。
- **状态**：confirmed（用户裁决，2026-09-22）

### D-026

- module：go/no-go 非相对必要条件的可判真假性
- requirement_ids：[]
- 原 requirement_ids 依据：CF-4；D-014；D-011 判别力；OI-030；PRD FR-54 / AC-55
- derived_from：[D-011, D-014]
- 原 derived_from 依据：2026-09-22 用户裁决（逐字：「删掉该分支」）；CF-4
- artifacts：[specs/workflowhub-thin-core-card-05-20260919/decision-log.md]
- **decision**：**删除 D-014 非相对必要条件的第二个析取支**（用户选的是 CF-4 的 (b)「删掉该支」）。该必要条件由此收窄为：**OCR 臂必须至少产出 1 条 actionable finding**；否则直接判 **no-go** 并保留 fallback。
- **删除留证（逐字，不静默删除）**：被删除的支为「**或有**一份明确、可复核的「本材料确无问题」结论」。D-014 原 decision 逐字为：「在 D-011 的相对阈值之上，**追加一条非相对必要条件**：OCR 臂必须**至少产出 1 条 actionable finding**，**或有**一份明确、可复核的「本材料确无问题」结论；否则直接判 **no-go** 并保留 fallback。」（D-014 条内已按「（校正：原表述为 …）」约定保留该原文。）
- **原因**：该支没有判定 oracle——判定维度（怎么算「真问题」、「确无问题」由谁认、样本量多少才有判别力）被整体 deferred（OI-030 `status: deferred`，完成条件「三项判定维度成文」未成文），任何零发现结果都可用它逃逸，使 D-014 不可判真假，与 AC-55「阈值在实验前写死并对照得出 go/no-go」冲突。
- **后果**：**「两臂都返回零发现」的情形不再能用第二支逃逸**——该情形按本条判 **no-go 并保留 fallback**（D-011 的判别力漏洞由此闭合）。误判方向的风险保留：若实验材料确实无缺陷，会误判 no-go。
- **风险**：接受「材料确无缺陷会误判 no-go」这一已登记风险；**规避**仍按 D-014 风险条：实验材料选一个**已知含缺陷**的真实任务（D-022 回溯臂以 s4 记录的 FN1–FN6 作真值，即为此用）。
- **OI-030 处置**：本条**不改** OI-030 的 `status`（仍 `deferred`），也不代写三项判定维度；D-026 只移除**依赖该 OI 才能判真假**的那一支。OI-030 是否仍需闭合（例如「actionable」如何判定的维度）由 build-plan / 实验设计定，本条不预先回答。
- **状态**：confirmed（用户裁决，2026-09-22）

## 决策（续，2026-09-22 用户裁决：CF-6 / CF-7 / CF-8 / CF-9）

> 本节四条决定由 2026-09-22 用户的逐条真实裁决派生，分别处置文末 `## 独立替代审查发现的未决冲突（须用户裁决）` 的 **CF-6 / CF-7 / CF-8 / CF-9**（对应关系见各条 `derived_from`）。
> 决定本体按用户原话登记；除各条内明写的收窄 / 扩范围外，**不改写任何既有决定的正文**——既有决定如与其不一致，在本节与对应 CF 条目中指向本节。
> 本节同时构成 **CF-6–CF-9 的 RESOLVED 记录**：四条均已在下方给出用户裁决、决定正文与登记落点，文末 CF 条目的「状态」行就地指向本节。

### D-027

- module：宿主子代理上下文记账面（CF-6）
- requirement_ids：[]
- 原 requirement_ids 依据：CF-6；OI-029；D-013 风险；D-016；D-017 修复面（派发语义 / 启动自检 / 成本计量）；D-010 风险；OI-025 `counterexample_boundary`；G-CK 行
- derived_from：[D-013, D-016, D-017]
- 原 derived_from 依据：2026-09-22 用户裁决（逐字：「扩 OI-029 + 新增记账面」）；CF-6
- artifacts：[specs/workflowhub-thin-core-card-05-20260919/decision-log.md]
- **decision**：① **扩大 OI-029 的范围**，使其覆盖**宿主子代理上下文**的截断 / 丢弃边界——即 D-013 取消本地字节闸门之后**真正的新闸门**；② **新增一个记账面**，把宿主侧的丢弃显式提升为**质量事实**（不阻断推进、但**不得静默**）；③ 该记账面**归属 D-017 的修复层**（它是派发 / 可观测性层的工作，不是 OCR 侧工作）。
- **记录（「自动消解」是假闭合）**：G-CK 行与 OI-025 `counterexample_boundary` 原先把「内容级静默丢弃」写成「委托模式下 OCR 不读文件内容，故该 OCR 路径不适用 ⇒ D-016 登记的风险在委托模式下**自动消解**」。按 **D-004**，委托模式下**实际读文件内容的是宿主子代理**（子代理用自身 LLM 审查），因此内容级丢弃 / 截断的风险只是从 OCR 侧**转移**到**子代理的上下文边界**，**并未消解**。该「自动消解」判定为**假闭合**。此更正已在 G-CK 行与 OI-025 `counterexample_boundary` 就地作出（原表述逐字保留），本节与之互相印证；**OI-029 的 scope 由此扩展**，不再只覆盖 OCR 侧 `too_large` 与文件级 `excluded_files`。
- **原因**：D-013 取消了所有本地字节闸门，唯一剩下的前置闸门就是执行者的上下文边界；若它既无记账面也无 OI 覆盖，s3 的教训（「审查没发生 / 内容被丢掉，账上却看不见」）会以新形式重演。
- **后果**：① OI-029 从「OCR 内部静默丢弃的处置」扩为「丢弃 / 截断在两个边界（OCR 侧 + 宿主子代理侧）上的处置」；② 记账面的实现落 **build-plan**（D-017 修复面的派发 / 可观测性一侧），本卡在 make-decision 只定**义务与可判真假的验收**；③ OI-029 的 `status` 由 `confirmed` 保留为 `confirmed`，但**其验收被重写为可判真假形式**（原验收只覆盖 OCR 侧文件级排除，对新闸门不可判真假）。
- **风险**：新增记账面本身可能变成**新的控制面**（本仓规则：没有当前消费者的重复控制面不新增）。**缓解**：记账面的 consumer 明确为「质量账本 + go/no-go 基线取证 + `unavailable` 三档路径的披露」，owner = D-017 修复层，随 D-017 修复面一并登记读集 / 写集 / 文件 owner（SD-11 并行声明制）；不新增第二套审查记录格式。
- **状态**：confirmed（用户裁决，2026-09-22）

### D-028

- module：any-of-N 的作用域（CF-7）
- requirement_ids：[]
- 原 requirement_ids 依据：CF-7；D-005；D-017；OI-027；T-003 逐字答复；D-018；SD-08；PRD FR-25 / AC-25
- derived_from：[D-005, D-017, D-018]
- 原 derived_from 依据：2026-09-22 用户裁决（逐字：「扩为全局判据，接受语义降级」）；CF-7
- artifacts：[specs/workflowhub-thin-core-card-05-20260919/decision-log.md]
- **decision**：**any-of-N 就是全局审查通过判据**——它适用于**全部 10 个审查面**，**含仍走旧 provider 链路的 7 个文档面**。用户**显式接受**由此产生的**语义降级**：对那 7 个面而言，**多源一致性降为「单源即可通过」**。
- **后果（登记为 HARD 前置，不是延期）**：因为「单源即通过」必须被**如实标注**，**OI-027 的 `independence: partial` 契约由「可选延期」升为「必需前置」**（OI-027 已相应更新：`status` 由 `deferred` 改为 `confirmed`，交付物 owner 与完成条件见该条记录）。**没有它，单源通过与多源一致在账本上不可区分**——因此本材料**不得**在任何单源结果上声称「多源已核」，也不得把单源通过读作多源一致。
- **记录（更正早前披露的缺口）**：早前的偏离披露**只登记了范围扩大**（D-018：3 个代码面替换 + 7 个文档面问题修复），**没有登记这一语义外推**。本次更正：D-005 的 any-of-N 由「针对 OCR 委托模式给出的判据」被 D-017 的「10 个审查面共同受益」**无差别施加到 7 个仍走旧 provider 链路的文档面**，把多源一致性判据降为单源即可通过——该语义变化**由用户在本条显式接受**，自本条起**不再是未登记的外推**。
- **另注（原话作用域）**：T-003 的用户原话逐字限定在「我希望使用 `/Users/Hugh/.config/workflowhub/config.json` 里的配置**进行 ocr 的委托模式审查**，就是可以同时进行多个异源审查，只要有一个成功了，审查就算通过了」。用户在本条**有意**把该判据扩展到全部 10 个审查面（不只是 OCR 委托模式面）。
- **风险**：① 单源通过使 7 个文档面的独立性强度永久低于多源一致；**缓解 = 强制标注**（OI-027 契约成文前不得宣称多源已核），并在 go/no-go 与阶段末遗漏披露中如实列出；② 用户已显式接受该降级，故**不另行补偿**（与 D-003 的「已接受风险不另行补偿」同口径）。
- **状态**：confirmed（用户裁决，2026-09-22）

### D-029

- module：`mode` 键在逐路派发下的处置（CF-8）
- requirement_ids：[]
- 原 requirement_ids 依据：CF-8；D-007；D-008；RF-09 `mode` 行；`~/.config/workflowhub/config.json:53-60`；`skills/wh-review/scripts/third-review-host-config.mjs:335-338`（调用点 `:375` / `:384`）
- derived_from：[D-007, D-008]
- 原 derived_from 依据：2026-09-22 用户裁决（逐字：「忽略（推荐）」）；CF-8
- artifacts：[specs/workflowhub-thin-core-card-05-20260919/decision-log.md]
- **decision**：新的**逐路派发路径忽略 `mode`**——**派发次数只由 `initial[]` 决定**；`mode` **只保留作校验**，并且**必须在适配合同中写明它「仅用于校验」**（因为 `full_only` 在代码中**没有任何行为分支**）。
- **记录（源事实，逐条带锚点）**：① `~/.config/workflowhub/config.json:53-60`：`"build-code": { "initial": ["kimi/coding","codex/luna"], "minimum_heterologous": 1, "mode": "full_only" }`，其余 stage route 的 `mode` 为 `"single_round"`；② `skills/wh-review/scripts/third-review-host-config.mjs:335-338`：`const required = stage === "build-code" ? "full_only" : "single_round"; if (configuredRoute.mode !== required) throw new Error(...)`——该键被**强制校验**，调用点在 `:375`（`resolveStageRoute`）与 `:384`（`validateAllWhReviewRoutes`）；③ `full_only` 在代码中**没有任何行为分支**（RF-09 `mode` 行：WorkflowHub 不解释 mode 行为，只校验 + 透传给 broker）；④ RF-09「调用次数」行已记「**只由 `initial.length` 决定**，与 `mode` 无关」。
- **后果**：**D-008 的「只读既有键」在该键上重新具有确定含义**——「只读」= 键集合不变 + 该键的值只被校验、不被解释为派发行为；不需要改配置文件（D-008 与 RF-07 均禁止），也不需要为它新增控制面。适配合同须写明：`mode` = validation-only，逐路派发的路数 = `initial[].length`。
- **风险**：若将来有人把 `mode` 读作行为开关（例如据此做 `full_only` 全量重跑），会与逐路派发语义冲突；**缓解** = 适配合同明写 validation-only，且在 D-008 的键集合断言旁登记该读法。
- **状态**：confirmed（用户裁决，2026-09-22）

### D-030

- module：① 交付物核验归本卡验收动作（CF-9）
- requirement_ids：[R-020]
- 原 requirement_ids 依据：CF-9；PRD FR-56 / AC-57；AC-23 的 ① 子句；AC-26 的 ① 子句；PRD R-020 / OI-014；RF-06；D-006；OI-020
- derived_from：[D-006]
- 原 derived_from 依据：2026-09-22 用户裁决（逐字：「登记为本卡验收动作」）；CF-9
- artifacts：[specs/workflowhub-thin-core-card-05-20260919/decision-log.md]
- **decision**：**把 ①（build-plan 合并审查，FR-56 / AC-57）的交付物核验登记为「本卡（CARD-05）的验收动作」**——核验**真实交付物 / 命令 / exit code**，而不是只采信 card-02 的自述。
- **记录（owner 与依据逐字）**：① 母 PRD 把 ① 的 owner 明确写成 **CARD-05**：`prd.md:161-162`（R-020 追踪行「… | **CARD-05** | AC-23/26/57 |」）与 `prd.md:178-179`（OI-014 追踪行「… | **CARD-05** | AC-23/57 |」）；② card-02 材料内**用户自己的纠偏原文**（card-02 归档 `decision-log.md:1983-1991`，T-067 节）：「card-02 与其它卡的重叠，只能写成「**card-02 提前完成了 X**（事实登记）；对应卡执行时核对，**但不得因此缩减该卡的验收范围**」」。
- **更正后的判定**：`## 需求矩阵` 中 R-020（L1768）与 OI-014（L1782）原先的 `covered（已覆盖）` **仅凭 card-02 归档 decision-log 的自述**、**未核对任何交付物 / 命令 / exit**；按本条更正为：**`covered` 以「本卡的核验动作」为条件**——该动作**必须执行**，且**其结果必须被记录**（真实交付物、命令、exit code、output 位置，纯文本路径引用）。
- **后果**：**AC-57 / AC-23 / AC-26 的 ① 子句在本卡有了带归属的核验动作**（不再只是「由 card-02 承接不重做」这一句话）。
- **边界（防误读）**：① 的**本体**仍由 card-02 提前完成，本卡**不重做** ①（RF-06 / D-006 不变）；核验是**回溯核对**，**不得**被写成「重做 ①」，也**不得**据此缩减 CARD-05 的验收范围。核验若发现交付物有缺口：按 SD-15 / SD-17 记**验收失败事实**并如实记录，**不阻断推进**（不新增机器门禁）。
- **风险**：① 核验的**真实交付物位置与命令**在 make-decision 阶段只能登记为义务（card-02 的 ① 产物在其归档材料内，不在本卡 worktree）；**缓解** = 在 build-plan 登记该核验工作包（读集 / 写集 / owner），并在 ① 核验时引用 card-02 归档材料的**纯文本路径**；② 核验成本可能接近重做 ①，须在 build-plan 界定核验范围（交付物存在性 + 两类质量核心齐备 + 时机），不是重跑审查。
- **状态**：confirmed（用户裁决，2026-09-22）

### D-031

- module：go/no-go 基线的面型（代码 diff 面基线补跑）
- requirement_ids：[]
- 原 requirement_ids 依据：D-011（基线取值）；OI-004；RF-16；RF-19；D-022（实验语料）；D-023（被替换面 = 3 个真实 diff 面）；用户声明 4；PRD FR-54 / AC-55
- derived_from：[D-011, D-022, D-023]
- 原 derived_from 依据：2026-09-22 用户裁决（逐字：「补跑一条代码 diff 面基线」）；文末 `stage-end` gap 分析的 B-3（基线与被替换面不同型）
- artifacts：[specs/workflowhub-thin-core-card-05-20260919/decision-log.md]
- **decision**：go/no-go 基线**必须包含一条「在真实代码 diff 面上的 wh-review 实跑」**，与既有的**文档方向基线**（RF-16）**并列**组成基线集合。**只有文档审查基线**无法回答用户**声明 4**（「是不是比本机的 wh-review 的 build-code 和 verify-code 质量更好」）在**代码面**上的问题。
- **记录（为什么必须补）**：① D-011 的基线 = **RF-16** = make-decision **direction 轨**对一份 **59,914 B Markdown 决策材料**的**文档方向审查**（`file_only` prompt 1,688 B）——即基线是**文档面**；② D-022 的实验语料**包含本卡 build-code 阶段**（**代码 diff**）；③ D-023 之后**被替换的 3 个面是真实 diff 面**；④ 盘上**不存在**任何 wh-review 在**代码 diff 面**上的对照基线。结论：**基线与候选臂不同型**，按原设计 go/no-go 在结构上不可判真假。
- **义务登记（可判真假，执行归属不在本次）**：
  - **主体**：一条 wh-review 在**真实代码 diff** 上的实跑。候选来源（二者之一）：(a) `/Users/Hugh/Hugh/Project/workflowhub` 中覆盖 **card-02 已合并工作**的 git range；(b) **本卡自身 build-code 的 diff**（一旦存在）。
  - **测量字段（与 RF-16 同口径）**：墙钟、provider 派发次数、终态（`pair status` / `semantic_status` / `partial`）、findings 原始 / canonical / 丢弃、锚定有效数、失败码、失败位置（派发**前** / 派发**后**）。
  - **完成条件**：该实跑事实**入库为代码面基线**，并被 D-011 的相对阈值与 OI-004 的基线取值引用（基线集合 = 文档面 + 代码面）。
  - **失败判据**：go/no-go 结论**只用文档面基线**去对照**代码面候选臂**（不同型对照），即判 **AC-55 失败**（「无阈值即下接入结论」的同型缺陷：阈值有、但对照不可比）。
  - **执行归属（重要边界）**：该实跑的**执行属 build-plan 产出的对比实验设计**（母 PRD 明写 build-plan 的 `spec.md` 含对比实验设计）。**本次不跑，也不得声称已跑**。
  - **四要素登记（F-06，2026-09-22 晚补；挂 D-031，并对应 OI-004 的基线集合）**：**owner** = `build-plan`（对比实验设计的产出者；执行者 = build-plan 阶段按该设计实跑）；**trigger** = build-plan 的对比实验设计冻结（母 PRD 明写 build-plan 的 `spec.md` 含对比实验设计）；**consumer** = D-011 的相对阈值与 OI-004 的基线取值，以及 go/no-go 的代码面结论（下游 build-code / verify-code 的接入决定）；**close** = 一条 wh-review 在**真实代码 diff** 上的实跑事实入库为代码面基线（墙钟 / 派发次数 / 终态 / findings 原始·canonical·丢弃 / 锚定有效数 / 失败码 / 失败位置齐备），且基线集合 = ① 文档方向面基线（RF-16 控制臂实测）+ ② 代码 diff 面基线。**本条是登记，不是执行**——截至 2026-09-22 晚本项**未跑**，不得声称已跑（见上一行的原文「本次不跑，也不得声称已跑」）。
- **后果**：阈值**数值**仍可留实验设计定稿（有 owner，D-011 不变）；但「**基线集合必须含代码面**」这一条在本条即写死，不再由实验设计自行取舍。OI-004 的基线取值已相应改写并保留原文。
- **风险**：① 代码面基线可能因**旧链路自身的缺陷**（P1 整组严格性 / P3 `REVIEW_QUORUM_INCOMPLETE` 丢弃 / P14 审查历史绑定）在基线上跑不出结果——**那本身就是如实事实**（记 `unavailable` 与失败码），**不得用文档面基线替代**，也不得据「跑不出来」反推 OCR 更好；② 不得为凑基线而改动被审材料或旧链路（那会使基线与被替换面再次不同型）。
- **状态**：confirmed（用户裁决，2026-09-22）

## 决策（续，2026-09-22 晚：OCR 委托模式端到端实验派生）

> 本节五条决定（D-032 ~ D-036）源自 **RF-20** 的两臂对照实验，以及 **2026-09-22** 用户对 any-of-N **结果取舍判据**的裁决。除 **D-035** 显式修正 **D-005** 的结果取舍判据（D-005 正文与既有校正注**逐字未改**，只在该条之后加了一行指向本条的修正注）与 **D-036** 的范围登记外，**不改写任何既有决定的正文**。本节的 P 侧对应条目为 **P15–P18**，「不属本卡修复面」的部分登记在同源小节的「实验副产物」中。

### D-032

- module：委托模式适配合同（派发提示词硬约束 / 超时语义）
- requirement_ids：[]
- 原 requirement_ids 依据：FR-53（「超时语义」要素）；D-004；D-017 修复面「超时与取消」
- derived_from：[D-004, D-017]
- 原 derived_from 依据：RF-20（Arm A 第 1 次与第 2 次尝试的对照实测）
- artifacts：[specs/workflowhub-thin-core-card-05-20260919/research/EXP-arm-a-kimi-cli-review.md]
- **decision**：委托模式派发给执行者的提示词中**必须内含两条硬约束**：①**禁止使用 Agent/子代理工具**；②**禁止任何等待/轮询工具**（`WaitFor` 等）。适配层须在派发前校验提示词包含这两条，并把违反情况记为质量事实。
- **原因**：Arm A 第 1 次尝试实测——未加约束时执行者自行派 3 个子代理 + 3 次 `WaitFor {timeout: 600}`，**900 秒被 timeout 杀掉、0 findings**；加约束后同一 CLI、同一语料**交付 3 条带证据 findings（exit 0）**。这是「超时语义」要素（FR-53）的**实证取值依据**。
- **后果**：超时不再由「执行者自己等多久」决定；宿主等待预算与执行者的等待行为解耦。
- **风险**：约束是**提示词级**而非机制级——无法保证执行者遵守；须配合超时上限与「超时后仍收部分产出」的语义。
- **状态**：confirmed

### D-033

- module：packet 的需求组件（需求保真的可审性）
- requirement_ids：[]
- 原 requirement_ids 依据：D-002（packet 形态）；用户 2026-09-22 声明 2（审需求/技术设计并找漏洞与边界）；D-006
- derived_from：[D-002, D-006]
- 原 derived_from 依据：RF-20（Arm B 能力缺口 ②：需求材料是截断的 spec 头、无任何 AC）
- artifacts：[specs/workflowhub-thin-core-card-05-20260919/research/EXP-arm-b-dsh-subagent-review.md]
- **decision**：packet 的「需求」组件**不得只放 spec 头或摘要**；必须包含**验收标准全文**（AC 列表）。若某审查面在材料契约上禁止携带 AC（如 `verify-code` 的 `forbidden` 含 `acceptance_criteria`），则该面**必须显式登记「本面无法审需求保真」**，不得静默降级。
- **原因**：Arm B 实测——回溯臂 packet 的需求组件是**截断的 spec 头（80 行，无任何 AC）**，导致 `.md` 规则中「验收标准可否判真假 / 失败与取消路径」**无法作答**；Arm B **拒绝为无法作答的项编造 finding**（这是正确行为，但意味着该维度的审查**静默失效**）。
- **后果**：需求保真维度要么真正被审、要么被显式登记为未审。
- **风险**：与 `verify-code` 面既有的 `forbidden` 列表（含 `acceptance_criteria`）冲突 → 须在 build-spec 决定该冲突的解法（放宽 forbidden，还是登记为未审面）。
- **状态**：confirmed

### D-034

- module：packet 的 diff 组件（转写要求）
- requirement_ids：[]
- 原 requirement_ids 依据：D-002（packet 形态）；D-022（对比实验语料）；D-004
- derived_from：[D-002, D-004, D-022]
- 原 derived_from 依据：RF-20（两臂**独立**报告同一缺口）
- artifacts：[specs/workflowhub-thin-core-card-05-20260919/research/RF-18-ocr-delegate-packet-recipe.md, specs/workflowhub-thin-core-card-05-20260919/research/EXP-arm-a-kimi-cli-review.md, specs/workflowhub-thin-core-card-05-20260919/research/EXP-arm-b-dsh-subagent-review.md]
- **decision**：packet 中的 diff 组件**不得以 `.diff`/`.patch` 扩展名投放**（会被 OCR `unsupported_ext` 排除），必须**转写为受支持的扩展名**（如 `.md` 或 `.txt` 并配 `include` 规则），**或**直接将 packet 物化为 git 仓库并用真实 commit 表达改动。
- **原因**：两臂**独立地**报告同一缺口——`diff/card-02-selected.diff`（1186 行）被 `(excluded: unsupported_ext)` 排除，执行者只能从代码快照**反推**变更面，无法核对「实现与改动的对应关系」。
- **后果**：变更面可见，两臂共同报告的缺口消除。
- **风险**：转写后 diff 会同时命中「按扩展名分组的 rubric」，可能与源码文件用同一套规则而语义不当；须在 rule.json 中为转写产物单独给规则。
- **状态**：confirmed

### D-035（**修正 D-005**；用户 2026-09-22 裁决）

- module：审查通过判据（any-of-N 的结果取舍）
- requirement_ids：[]
- 原 requirement_ids 依据：D-005（被修正条）；OI-027；D-028；用户 2026-09-22 声明 5；PRD FR-25/SD-08
- derived_from：[D-005, D-028]
- 原 derived_from 依据：RF-20（两臂并集 9 条、各有一条对方漏掉的 high）；2026-09-22 用户裁决（逐字）
- artifacts：[specs/workflowhub-thin-core-card-05-20260919/research/EXP-arm-a-kimi-cli-review.md, specs/workflowhub-thin-core-card-05-20260919/research/EXP-arm-b-dsh-subagent-review.md]
- **decision**：**修正 D-005**。多路委托审查中，**所有成功路的结果全部进入 findings 账本**（不是「首个成功即通过、其余丢弃」）；每条 finding 必须标注**来源强度**：多路一致的标 `corroborated`，仅单路报告的标 `single_source`。原 D-005 的「任一成功即通过」保留为**派发成功判据**（不需要等全部成功才算通过），但**不再作为结果取舍判据**。
- **原因**：实测两臂 findings 重叠仅 2 条，并集 9 条，**各有一条对方漏掉的 high**（Arm A 独有「证据完整性假绿」；Arm B 独有「测试套件必红」）。取首个成功会**稳定地**丢失另一路的独有发现。用户原话（本次裁决）：「所有成功路的结果全部进 findings 账本，每条标注『几个臂报了』」。
- **后果**：审查产出不再是「一个赢家」，而是**带来源强度的并集**；`single_source` 条目天然提示「值得二次关注」，`corroborated` 条目可信度更高。与 OI-027 的 `independence: partial` 强制标注**衔接**——`single_source` 即 `partial` 的具体化。
- **风险**：≥2 项。(a) finding 数量上升，处置成本增加，需要**去重规则**（同一 file:line + 同一 claim 视为同一条）；(b) 并集入账要求**等待所有已派发路由终态**，与「快」冲突 → 须明确「派发成功判据」与「入账时点」是两个不同语义，避免把任何一路的失败变成阻塞。
- **状态**：confirmed

### D-036

- module：修复面范围（实验副产物的转交登记）
- requirement_ids：[]
- 原 requirement_ids 依据：D-021（闭环清单）；D-018（范围扩大）；D-017（「审查层」定义）
- derived_from：[D-017, D-018, D-021]
- 原 derived_from 依据：RF-20（P15–P18 与 5 条 card-02 交付物缺陷的分界）
- artifacts：[specs/workflowhub-thin-core-card-05-20260919/research/EXP-arm-b-dsh-subagent-review.md, specs/workflowhub-thin-core-card-05-20260919/decision-log.md]
- **decision**：E2E 实验中发现但**不属于本卡修复面**（非审查层）的 card-02 交付物缺陷，**不并入 P1–P18**，而是**登记为实验副产物并明确归属**（见「实验副产物」小节），随 build-spec 移交。**不因为「顺手」而扩大本卡修复面。**
- **原因**：D-021 已确立闭环清单；D-018 的范围扩大是「3 个代码面替换 + 7 个文档面问题修复 + wh-review 阻塞类彻底解决」，card-02 验收脚本的假绿/漏测**不在其中**。静默吞下会把本卡变成无边界任务。
- **后果**：缺陷有主、范围不膨胀。
- **风险**：若无卡承接，缺陷会丢失。**缓释**：在阶段末遗漏披露中单列，并在 build-spec 的协调节登记询问归属。
- **状态**：confirmed

### D-037

- module：闭环清单扩容（P19 / P20 / P21 缺陷登记）
- requirement_ids：[R-005, R-016]
- 原 requirement_ids 依据：D-017 审查层修复面（派发语义 / 启动自检 / 质量事实生产）与 D-021 闭环清单程序（「超出即须用户显式追加」）
- derived_from：[D-017, D-021]
- artifacts：[specs/workflowhub-thin-core-card-05-20260919/decision-log.md]
- **decision**：**2026-09-22 用户显式裁决「升为 P19/P20/P21 进闭环清单，并修」**——按 D-021 的「超出即须用户显式追加」程序，把下列三条**实测缺陷**追加进本卡闭环清单（闭环清单由 P1–P18 扩为 **P1–P21**）；三条的实测内容如下：
  - **P19 —— `stage-end-spec-analyze` 在仅会话内模型下永远不可能被满足**。`workflows/make-decision/steps.json` 的 step 12 对应的唯一发布者是 `publishStageEndSpecAnalyzeFact(ctx, result, snapshot, recordedAt)`，在 `runtime/stage/stage-runner.mjs:1938-1960`，由 `runtime/stage/completion-predicates.mjs:88-97` 的 `STAGE_ADVISORY_PREDICATES["make-decision"].stage_end_spec_analyze` 门控；唯一调用链是 `publishVNextStage`（`runtime/stage/stage-runner.mjs:2628`）← `runStage`（`:3040`），即**只能经 `run --action=execute` 到达**。它要求 `result.spec_analyze?.result.status === "consistent"`，但 `grep -n spec_analyze runtime/stage/stage-handlers.mjs` **零命中**——**没有任何 handler 会设置它**。唯二真生产者（`runtime/stage/stage-runner.mjs:722-756` 的 `authenticateStageOutcome` / `validateStageSpecAnalyzeOutcome`，以及 `runtime/stage/stage-agent-outcome-adapter.mjs:698,833,1052`）都挂在 `receipts.stage_outcomes` 上，而 CLI 在 `tools/cli/stage-runtime.mjs:1270-1275` **明文拒绝**该键（「current stage run does not accept receipts.stage_outcomes; the current WorkflowHub session is the official producer」）。结果是 step 12 每次落 `missing`。已产出的经验证产物：`quality/evidence/stage-quality/make-decision/stage_end_spec_analyze-e715326d….json` = `{status:"missing", detail:"current stage-end spec-analyze is unavailable", evidence_refs:[]}`；`quality/evidence/acceptance/make-decision/stage_end_spec_analyze-358029da….json` = `{result:"deferred"}`；`quality/facts/1654287ae1….json` = `{kind:"acceptance_criterion", status:"missing", subject:"stage_end_spec_analyze"}`。本条与本卡已记的根因族**互为镜像**：已记的是「**机制永不失败**」，本条是「**机制永不成功**」。
  - **P20 —— 机器覆盖率审计对任何经官方路径引导的任务永久 `incomplete`**。`tools/cli/task-bootstrap.mjs:150` 逐字为 `Object.keys(inputs).some((key) => !["decision", "spec", "build_plan"].includes(key)) || Object.values(inputs).some((ref) => typeof ref !== "string" || !isAbsolute(ref))` —— key 白名单只有 `decision|spec|build_plan`，且值必须是**绝对路径字符串**；`raw_requirement` **按 key 被拒、按类型也被拒**。运行时**没有任何写入 `manifest.inputs` 的路径**（只有 `runtime/task/task-handle.mjs:79` 的校验与 `runtime/task/task-kernel-implementation.mjs:630` / `:656` 的读取）；`task.json` 只写一次（`runtime/task/task-handle.mjs:606-626`）且按字节冻结（`:644-647` 抛 `task manifest changed after TaskHandle bootstrap`）。本任务 `task.json` 的 `inputs` 为 `{}`。消费方 `runtime/task/task-kernel-implementation.mjs:642-733` 的 `decisionCoverageAudit(stage, confirmation)` 要求 `manifest.inputs.raw_requirement = {ref, sha256}`，否则 `source = null` → 落 `source_inventory_unavailable`；其唯一调用点是 `:931`（在 `publishHumanConfirmation` 内），即**只能作为 `confirm --action=decision` 的副产品运行，没有独立入口**。本任务两次审计（`revision-8db0d039…` 与 `revision-9519539b…` 各一次）**都失败于同一码**，`items: []`、covered / accepted_omission / missing 全为 0。唯一合法改造途径是手改 `task.json`，而那等于 manifest 篡改，**不属于官方路径**。
  - **P21 —— `run` 静默忽略未知参数**。`tools/cli/stage-runtime.mjs:944-947` 的 `run` 分支**只读 `values.input`**，其余参数一律静默丢弃。实测后果：`--receipts=notaflag` 被无声吞掉，一条**真实官方 stage run 执行完毕并 `exit 0`**（事故全过程见 **D-038**）。本条与本卡主题「**静默降级**」同族。
- **原因**：这三条都不是「本卡未知项」，而是**已实测的机制缺陷**；用户的显式追加裁决完成了 D-021 规定的程序（超出即须用户显式追加）。
- **后果**：闭环清单由 **P1–P18 扩为 P1–P21**（D-021 的清单程序在本轮完成一次扩容）。三条的**修复归属**：P19 / P20 属 **D-017「审查层」修复面**中的「**启动自检 + 质量事实生产**」；P21 属「**派发语义 / 入口参数校验**」。**承接划分：spec 承接归 build-spec，实现落 build-code**；**本卡 make-decision 阶段只登记，不修代码**。
- **风险**：P19 与 P20 各自指向「机制永不成功」与「官方路径不可达」两类结构性问题，若 build-spec 只把它们当验收细节而不当契约缺陷，本卡会带着两个**不可能通过的验收项**进入 build-code；P21 的静默吞参会在后续任何「用错参数试探卫兵」的操作中再次造成**无提示的真实副作用**（本轮事故即为此）。
- **状态**：confirmed

### D-038

- module：事故登记与处置（子代理误触发真实 stage run）
- requirement_ids：[]
- 原 requirement_ids 依据：无（事故处置，非需求承接）
- derived_from：[D-021]
- artifacts：[specs/workflowhub-thin-core-card-05-20260919/decision-log.md]
- **decision**：**2026-09-22 用户显式裁决「接受现状，按正确顺序重跑 12→13→14」**。事故与处置如实登记如下。
  - **事故经过**：子代理 `1d7a3971-3834-4ff5-84ed-c3f9bd76a83e` 为试探 CLI 卫兵，运行了 `node tools/cli/stage-runtime.mjs run --action=execute --stage=make-decision --project=workflowhub --task=workflowhub-thin-core-card-05-20260919 --receipts=notaflag`，**假设未知参数会被拒绝**。实际 `run` **只读 `values.input`，静默忽略其余参数**（即 **P21**），于是一条**真实官方 stage run 执行完毕，`exit 0`**。
  - **变更**（全部在任务库 `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-thin-core-card-05-20260919` 内；**四份材料未动**）：`facts.jsonl` 被重写（`created_at` `2026-09-22T04:19:35.904Z`；`snapshot_tree` 由 `3f938c47…` 变 `513bd6a0c6b0c042d1a63cad65e91bec880c099c`；`material_digest` 由 `508014d0…` 变 `41d9f83e…`；`spec_analyze` 槽位**合并而非清空**，仍留旧 reflection ref `90735f09…`）；`quality/evidence/handoff/make-decision.md` **被覆盖，11854 B → 4258 B**；新增 **33 条不可变记录**；新增 **3 条** `identity/executions/*.json`。
  - **未动（当时的实测事实）**：`decision-log.md`（当时 md5 `8f4727636508c7afc426efcbf56ab747`、2993 行、mtime 12:09）；`git status` 不变；未创建 `spec.md` / `plan.md` / `tasks.md`。
  - **净效果**：stage row 由 `stale` 变为**绑定当前材料**（`revision-5f807b76…` / `snapshot_tree 513bd6a0…`），`quality_missing` 从 **9 项降到 4 项**（剩 `scope` / `non_goals` / `risks` / `human_confirmation`）；但同时记录了**更弱**的阶段终点——reflection 由 `degraded` 变 `unavailable`（`executor_absent`）、handoff 退化为机器样板、`stage_end_spec_analyze = missing`、验收 `deferred`。
  - **损失边界（父代理取证）**：旧 handoff `sha256 = 73d3b2236005aeb4aea5f2f7d8dd5bc0d2a1ced0d221283df2499e8457204cf2`、`section_count = 13`、`reflection_status: "degraded"`、发布于 `2026-09-22T00:08:36.219Z`（更早一次为 `4d7aeac62d3669de6e50d9dd44a42b5994f2d75ada615a5b15428d18ea332046`，`failed`，也是 13 节）。任务库**不是 git 仓库**，`quality/evidence/handoff/` 下只有一个普通文件；全盘无 11854 B 文件；本机无 APFS 本地快照；worktree 里的 `HANDOFF-make-decision.md`（16036 B）是 card-02 的且被 git 跟踪。⇒ **旧 handoff 的字节不可恢复**；但其**生成输入仍在盘上**（reflection `90735f09…`）。该文件自声明 `authority: non_authoritative` / `retention: current_only`，正文首行「非权威 current handoff，只以四材料和正式质量原件为准」。
  - **处置**：**不去重建一份冒充历史的文件**；如实披露（白话版见 `## 阶段末遗漏披露与交付说明` 的 `### F.`）＋ 按正确顺序重跑，使其**自然重生**。
  - **正确重跑序列（供后续执行者照做）**：① 材料修复**全部落盘**（本次修复完成、文件冻结）→ ② `confirm --action=decision --stage=make-decision --project=workflowhub --task=workflowhub-thin-core-card-05-20260919 --decision=accepted --reply-text='<用户真实回复>' --step-slug=approve-decision` → ③ `run --action=execute`（**必须带 `--input`**，含 receipts 与 `stage_reflection`）→ ④ `run --action=reflect`（**必须带完整 judgment**）→ ⑤ `status --action=begin`。
  - **三条前置（照做时的硬边界）**：其一，**任何材料变更后必须重新 confirm**，否则 `human_confirmation` 绑定旧修订并被发布为 `stage-quality-missing/…human_confirmation-*.json`；其二，**`run` 不带 `--input` 会让 `human_confirmation` / `direction_review` / `detail_review` 全部变 `missing`**；其三，**`reflect` 不带 `--input` 会让 reflection `unavailable`、handoff 退化为机器样板**。
- **原因**：用户选择「接受现状」而非回滚（旧 handoff 字节已不可恢复），并要求按正确顺序重跑，而不是在残骸上继续。
- **后果**：本卡的 step 12 / 13 / 14 产出对**当前修订**全部过期，须按上述序列重跑；重跑完成前材料不得被读作已获批准（见 `## 状态` 的授权状态条，以及 `## spec-analyze 镜头 15 条 finding 的处置表` 的 F-01 / F-02）。
- **风险**：重跑序列第 ③ 步若再次不带 `--input`，会**重复制造**更弱的阶段终点（reflection `unavailable` / handoff 样板）；第 ② 步若在材料再次变更前执行，`human_confirmation` 会绑到过期修订上。两条都已在「三条前置」中写死。
- **状态**：confirmed

### D-039

- module：独立审查 finding 的处置（spec-analyze 镜头）
- requirement_ids：[]
- 原 requirement_ids 依据：无（审查 finding 处置，非需求承接）
- derived_from：[D-021, D-038]
- artifacts：[specs/workflowhub-thin-core-card-05-20260919/research/SPEC-ANALYZE-lens-findings-make-decision.md, specs/workflowhub-thin-core-card-05-20260919/decision-log.md]
- **decision**：**spec-analyze 镜头 15 条 finding 的处置总则**——finding 原件已落盘为 `specs/workflowhub-thin-core-card-05-20260919/research/SPEC-ANALYZE-lens-findings-make-decision.md`（**29,294 B / 195 行，sha256 `d3be1744d7facd16360a229fc0f8ea9e8357ed54dfea5f878ba33412a6ba57c0`**，落盘时间 2026-09-22 13:19；这本身是 **F-07 的就地补救**——原报告只经 `send_message` 投递、磁盘上无副本）。**F-01 与 F-02 记为 `needs_human`（非终止态）**，其闭合动作是本次重跑序列的**第 ②③④ 步**（见 D-038），**在它们完成之前材料不得被读作已获批准**；**其余 13 条为 `fixed`**，逐条处置见 `## spec-analyze 镜头 15 条 finding 的处置表`。
- **原因**：本次审查由**独立来源、独立上下文**产出（spec-analyze 镜头，未参与材料任何部分的撰写），其 finding 属必须逐条处置的质量事实，不能以摘要覆盖，也不能把未闭合写成已闭合。
- **后果**：处置用语一律取自 `runtime/task/task-store.mjs:230` 的 `FINDING_DISPOSITIONS = ["fixed", "rejected_invalid", "accepted_risk", "needs_human", "user_decided"]`；`needs_human` 是**非终止态**，故本材料整体处于「13 条已闭合 + 2 条待人工闭合」的状态，**不得读作全部闭合**。
- **风险**：若下游（build-spec）在 F-01 / F-02 闭合前消费本材料，会把一份**未被任何 `quality/confirmations/*.json` 绑定**的修订当成已批准基线；该风险已由 `## 状态` 的授权状态条与处置表双重显式披露。
- **状态**：confirmed

### D-040 P22 追加进闭环清单（官方 run 无法消费自己产出的诚实 unavailable 记录）

- module：[审查层]
- requirement_ids：[]
- derived_from：[D-017, D-021, D-039]
- artifacts：[decision-log.md]
- **决定**：用户于 2026-09-22 对「本卡 step ④ 实跑中发现的第四个同族缺陷」作出显式裁决，**追加为 P22 并进闭环清单**（闭环清单由 P1–P21 扩容为 **P1–P22**）。本卡登记缺陷事实、根因、修复方向与归属；**实际实施归 build-code**（改动面在 `runtime/`）。本决定同时如实登记：该追加使材料修订号发生变化，因而**此前绑定的确认与已发布的 step ④ 记录均须按 D-038 序列重做**，不得沿用。
- **原因**：P22 与 P19/P20/P21 同族（都是「记录层的诚实事实无法被机器消费」），且后果更重——它把 P14 从「记录污染」升级为「流程不可闭合」；若只登记在阶段末披露而不进闭环清单，该义务无人认领。
- **后果**：闭环清单扩容为 P1–P22；材料修订号变化使既有 `quality/confirmations/02615ad5…json` 与 step ④ 发布的记录变为**过期绑定**，须按 D-038 重跑；本卡不改 `runtime/`。
- **风险**：用户已**显式接受**此追加带来的返工代价；残余风险是实施阶段若不修 P22，则任何撞上 P14 的任务仍无法闭合 make-decision 官方 run。
- **状态**：accepted

### D-041 verify-code 的 OCR packet 携带完整 AC（用户本轮裁决）

- module：OI-034；packet 需求保真边界。
- requirement_ids：[R-005]；derived_from：[D-002, D-023, D-033]。
- **决定**：新 OCR 路径的 verify-code packet 携带当前验收标准全文，更新该面的新材料合同以允许 acceptance_criteria。旧 wh-review reviewed_execution 的 forbidden 记录仅作历史事实，不得静默套用到新 OCR packet；若当前 AC 缺失或不完整，明确记材料不可用，不能声称已审需求保真。
- **来源**：用户在本轮对 OI-034 两选一问题明确答复「让 verify-code 的 OCR packet 携带完整 AC，更新该面的新合同（推荐）」。
- **后果**：build-plan 的 spec 与 P3/T005 必须把 AC 全文纳入 verify-code OCR packet 的正反 oracle；OI-034 的方向选择闭合。此前本文件 OI-034 所记 deferred 是历史状态。
- **状态**：confirmed；本决定及本文件当前修订仍须按材料绑定确认发布。

### D-042 同型代码基线移至 build-code 实跑（用户本轮裁决，修正 D-031 执行时点）

- module：OI-004 / D-031 的代码 diff 基线执行时点。
- requirement_ids：[R-005]；derived_from：[D-011, D-022, D-026, D-031]。
- **决定**：build-plan 负责冻结同型实验输入、指标公式、阈值取值方式、已知 FN 真值、go/no-go 规则与证据路径；真实代码 diff 基线改由 build-code 使用本卡当时的实际 diff 通过正式 review 路径实跑，再与同一 diff 的 OCR 候选臂比较并判 go/no-go。build-plan 不拿历史 CARD-02 的非正式 bare 诊断冒充可比的正式基线。
- **来源与理由**：用户本轮明确答复「build-plan 冻结实验设计；build-code 用本卡真实 diff 实跑基线，再判 go/no-go（推荐）」。当前 CARD-05 的正式 review 入口无法认证 CARD-02 已归档历史 range；本卡真实代码 diff 尚未在 build-plan 阶段产生。D-031 的“build-plan 实跑”原记录保留为历史，执行时点由本决定修正。
- **后果**：build-plan 完成条件是实验设计可判真且先于候选接入冻结；基线数值和 go/no-go 结论须在 build-code 真实执行后填写，不能在 build-plan 宣称已取得。若 build-code 无可认证同型 diff，则 no-go/unknown，保留 fallback。
- **状态**：confirmed（用户裁决）；当前修订仍须按正式材料绑定记录。

### D-043 撤销比较选型，按三代码面真实能力交付 OCR（2026-09-25 用户直接改目标）

- module：CARD-05 当前 OCR 接入与 P5/T011 验收
- requirement_ids：[R-005]
- derived_from：[D-004, D-019, D-023, D-035, D-041, D-042]
- artifacts：[specs/workflowhub-thin-core-card-05-20260919/spec.md, specs/workflowhub-thin-core-card-05-20260919/phases/P5.md, specs/workflowhub-thin-core-card-05-20260919/phases/index.md, docs/adr/0032-review-chain-delegation-and-layer-contract.md]
- 用户原话：“abandon comparative go/no-go entirely; test OCR real ability in build-code phase+integration and verify-code, with eventual normal route, no repeated Architect/wh-review comparison.”
- **决定**：不再比较 OCR 与 Architect-Code-Review/wh-review 的发现率、锚定率或耗时，不再以相对阈值、至少一条 actionable finding、go/no-go、同 diff 双臂或 FN1–FN6 找回率决定接入。P1–P4 的已做工作与原件保持原样；旧 T011 no-go 是当时方案下的历史结论，不转写为通过，也不作为现行路由/完成条件。
- **现行目标与 oracle**：build-code 每 Phase 审查、全 Phase 后 integration 审查、verify-code 独立终末代码审查分别用真实当前 diff 经正常 OCR 委托路由执行。逐面核对：范围和真实 diff、适用的全文 AC、未参与实现的独立执行者及 provider 身份、真实 attempt/终态、finding 锚点/建议和覆盖（真实零发现须与零派发区分）、canonical review 原件到官方 stage/facts/status 的读回；verify-code 的代码审查与功能验收分开。任一面缺证据、派发失败或质量事实不可读，该面记 incomplete/unavailable，继续同任务修复，不假绿、不启动比较或复审循环。三面逐项成立并有逐 AC 结果，才可称本目标完成。
- **路由与失败边界**：P5 把 P3 隔离适配收束为三面普通生产请求的 OCR 委托路径；移除 `candidate_experiment` 的现行选择器语义，不新增 stage、gate、store、公开命令或额外确认。外部工具不可用时沿 SD-08 恰一次独立替代审查或如实 unverified；旧 wh-review/broker 仅留历史。历史对照原件保留，不再生成新比较原件。
- **覆盖关系**：本决定只覆盖 D-011/D-014/D-026/D-031/D-042 中的比较、阈值、候选生命周期与切换条件，以及旧 T011 no-go 的当前效力；适配合同、并集/来源强度、诚实 unavailable、审查节奏和 CARD-06/CARD-09 边界继续有效。母 PRD 的 FR-54/AC-55 属原目标，现以本条用户明确变更为准；未改母 PRD 原文。
- **执行状态**：文档修订；三面实跑、正式质量事实与完整 AC 读回尚未在本次执行，保持未验证。
- **当前验收范围修正**：只将 AC-REVIEW-001/002/003/004/006/007/009/011/013 计入本卡现行验收；AC-REVIEW-005（P1–P22 全量闭环）、008（旧冻结时序）、010（card-02 归档核验）、012（旧全局节奏）在 `spec.md` Appendix A 标为 `deferred`，分别列明 owner 与原因。四项历史正文、既有结果和缺口保留，不算通过，也不作当前三面能力完成或 retained limits 的前置。005 的当前三面诚实失败/官方消费、012 的当前 phase→integration→verify-code 节奏已并入现行 AC-003/009；不追补 P1–P4 或跨任务旧债。

### D-044 停止正常 build-code 流程的重复 integration 审查，现行 OCR 验收收为两面（2026-09-25 用户确认）

- module：CARD-05 当前审查节奏与 P5/T011 验收。
- requirement_ids：[R-005]；derived_from：[D-043, SD-07, SD-08]。
- artifacts：[specs/workflowhub-thin-core-card-05-20260919/spec.md, specs/workflowhub-thin-core-card-05-20260919/phases/P5.md, specs/workflowhub-thin-core-card-05-20260919/phases/index.md, docs/adr/0032-review-chain-delegation-and-layer-contract.md]。
- **用户确认的范围**：正常 build-code 流程不再自动派发重复的 integration review，也不将其列为 build-code 完成要求；保留 build-code 每 Phase 的 OCR 审查与 verify-code 一次 OCR 终末代码审查。跨 Phase 集成测试、最终聚合、逐 AC 验收和 verify-code 功能验收继续执行并分别记事实。历史显式 CLI integration 请求的 API/reader 兼容保留；本决定不要求禁止所有显式请求，除非后续实现另有明文和真实行为证据。
- **现行决定与 oracle**：P5/T011 只验收两个正常 OCR 路由面：build-code/phase（每 Phase 依本 Phase scope）与 verify-code 终末审查（一次，覆盖最终实现）。每面核对真实当前 diff、适用全文 AC、未参与实现的独立执行者及 provider 身份、attempt/终态、finding/覆盖、canonical 原件与官方 stage/facts/status 读回；终末代码审查与功能验收分开。缺任一面证据或质量事实保持 incomplete/unavailable，不借集成测试退出码、旧 integration review 或历史候选报通过。
- **覆盖关系**：本条只覆盖 D-043 的“三面”正常流程路由、顺序与 build-code 完成条件，以及旧 SD-07 中“全 Phase 后自动派发 integration review”的当前效力；D-043 原文、P1–P4、旧 integration attempts/results、旧 T011 no-go 和全部失败/缺口原件只读保留为历史，显式 CLI 请求和历史 reader 继续兼容。AC-REVIEW-001/002/003/004/006/007/009/011/013 九个 active ID 不变；003/004/009 改按两面判定；005/008/010/012 继续 deferred，不改写为 passed。不恢复双臂比较、相对阈值或 go/no-go，也不新建 stage、gate、store 或公开命令。
- **已知执行事实与缺口**：P5 的 build-code/phase OCR 审查已有真实 attempt `3fece791-ee35-5b57-a634-f226bc3c2a6e` 和对应 canonical result；原件只证明该次审查发生，不能代替 finding 处置、官方 stage/facts/status 读回或 AC 通过。verify-code 终末 OCR 审查尚未执行；两面尚未全部读回/验收。D-044 材料修订本身不证明正常流程已停派 integration 或已移除其完成要求；后续是否实施成功以实际 workflow/runtime 行为和验证事实为准。

## 核心需求

把 workflowhub 的**代码审查链换掉**：不再用 wh-review 提示词 + 3rd-review broker 做 build-code 与 verify-code 的审查，改用 **open-code-review（OCR）的委托模式**作为接入形态。委托模式下 OCR 只做确定性工程（文件筛选 + 规则解析），**实际审查推理由 workflowhub 侧按 `config.json` 配置起的独立子代理用自身 LLM 完成**；finding schema 由 workflowhub 自定义（D-019）；多路异源并发，**任一成功即审查通过**。
> **（校正（F-10 / D-035，2026-09-22 晚）：上面这句「多路异源并发，**任一成功即审查通过**」中的「任一成功即审查通过」是**派发判据**——它只决定**是否要派发 / 是否算有审查发生**；**结果取舍**按 **D-035** 为**并集入账 + 逐条标来源强度**：多源一致的条目标 `corroborated`、单源的条目标 `single_source`，两档一律入账，**不得因单源而丢弃、也不得把单源写成多源已核**。`CONTEXT.md:444` 的 any-of-N 术语条已按同一语义同步修订，并新增 `single_source` / `corroborated` 两个术语。原句逐字保留于本注。）**

> **（校正：原表述为「委托模式下 OCR 只做确定性工程（文件筛选 + 规则解析 + **finding schema 脚手架**）」。G-CK 一手核实：委托模式不产出 finding、也不提供 finding schema；D-019 已据此更正，CONTEXT.md L438 与 ADR-0032 亦按更正后口径书写。原措辞逐字保留于本注。）**

用户原话（U-001#5，规划 DL L53）：「审查效果提升，不再用 wh-review 里面的审查提示词和 3rd-review 进行 build-code 或 verify-code 审查了，而是改成类似 alibaba/open-code-review 的开源代码审查工具进行，保证代码审查质量更高，并且不在因为审查浪费这么长时间。」

本卡开工时用户当面追加（声明 1–6）：覆盖范围要求「所有审查」、质量目标要求「找出任何漏洞、边界情况、与现有代码的意外交互」、过程要求「简单、干净、轻松、高质量、永不阻塞和失败」、并明确要求使用 `config.json` 的 build-code / verify-code 配置承载 OCR 委托模式。

**但要如实说明**：经 Talk 两轮收敛，范围已定为**只做 ②③④ 代码审查点**（D-006），文档/设计审查点**不在本卡**。用户声明 1/2 的完整满足须在本阶段末遗漏披露中列出。

## 核心目标

1. **换掉会卡死的派发机制**：现行 `initial[]` 语义是「必须全部可派发」，任一所列 provider 未配置即整条 `ROUTE_UNAVAILABLE` 且**零派发**；`minimum_heterologous` 用三把不同的尺子。这是 4 份真实会话约 13.4 亿 input token 灾难的机制根因。改为**逐路独立派发 + 任一成功即通过**（D-005/D-007）。
2. **不再丢弃已完成的审查**：现行 `REVIEW_QUORUM_INCOMPLETE` 会把已成功完成的审查整体扔掉（s1 实测 kimi 完成 22 次、codex 完成 11 次、最长 1113 秒 → 0 findings）。改为完成的审查一律降级使用。
3. **让审查真的能看到代码**：现行 provider 只能读 bundle，合同明令禁止访问仓库，结构上无法发现「与现有代码的意外交互」。兜底与审查执行者改为**全新上下文 + 可读仓库**（D-010）。
4. **用自带 rubric 定义"什么叫审得好"**：OCR 内建规则是纯代码导向且无 markdown 规则；RF-15 已实测可注入任意文档/代码 rubric。审查质量标准由 workflowhub 自己写，不再依赖 73–350 字符的散文指令。
5. **有证据门槛的工具选型**：不凭厂商宣称接入。先冻结适配合同（FR-53 六要素），再做内置 go/no-go 规则的对比实验（FR-54），no-go 则保留 fallback。
6. **永不阻塞**：审查不可用不阻断推进；但**不冒充已审**——不可用路径如实记 `unverified` 并披露（SD-08 / D-005）。

## 已选方向

**以 OCR 委托模式接入，替换 build-code 每 phase、全 phase 集成、verify-code 终末代码审查三个代码审查点；适配合同先冻结，再跑有界对比实验（含预置 go/no-go 阈值），按结论决定接入或保留 fallback。**

**落点（两类工作面）**：

- **替换面（3 个代码审查点）**：`build-code/phase`（每 phase 一次）、`build-code/integration`（全 phase 结束一次）、`verify-code` 终末代码审查（独立事实，不与功能验收共用记录）。build-plan 合并审查 ① 由 card-02 提前完成，本卡不重做。
  - **（校正（H3→CF-2）：原把这三个面写成「3 个代码审查点」并当作被 OCR 委托替换的面。代码事实（`runtime/review/stage-materials.json`）：`build-code/integration` 的 `source_bundle = "none"`、`forbidden = ["changes_diff","cumulative_diff","phase_diff","raw_log","integration_map"]`（**非 diff 面且禁止投递 diff**），而 OCR 委托按 `git diff` 选文件（RF-04/`:967`）；材料自有 RF-11 的 3 个 diff 面是 `build-code/phase` + `verify-code` + `mini_task/implementation`。**「3 个 diff 面」与「3 个被替换面」不是同一集合，本节的 3 与 RF-11 的 3 被混为一谈**；该冲突不自行裁决，登记为 **CF-2**。）**
  - **（D-023 更新（2026-09-22 用户裁决）：CF-2 已 **RESOLVED by D-023**——`build-code/integration` 的送审合同**改为真实 diff 审查**，故本节的「替换面（3 个代码审查点）」在改造后即为**3 个真实 diff 面**（原 3 与 RF-11 的 3 的所指差异由改造消解）。上文原文与校正注逐字保留。）**
- **修复面（审查层契约，10 个审查面共同受益）**：派发语义 / 聚合语义 / 超时与取消 / 启动自检 / 成本计量。7 个文档审查面（make-decision 方向与细节、build-spec、build-plan、build-code/integration 之外、mini_task/design、non_stage/build_prd）**继续用现有 provider，但走修好的契约**。
  - **（校正（M6）：上面这行「7 个文档审查面」的枚举**实际只列了 6 项**，并以「`build-code/integration` 之外」把该面排除在外；而按 RF-11（`:1408`）与代码事实（`runtime/review/stage-materials.json`），`build-code/integration` **恰是那 7 个非 diff 面之一**，故该枚举自身不自洽（列 6 项却称 7 个）。同一材料对「哪 7 个面」给出两个不相容答案，直接影响 OI-026 映射表（交付物）的输入。**该枚举按原文保留未改**（改哪一支都等于替用户在 CF-2 里选边）；「7 个面到底是哪 7 个」与集合归属**并入 CF-2，不自行裁决**。）**
  - **（D-023 更新（2026-09-22 用户裁决）：CF-2 已 **RESOLVED by D-023**——`build-code/integration` 的送审合同改为真实 diff 审查，故它**不再属于本节「7 个文档审查面」**，上面「`build-code/integration` 之外」的排除与 D-023 一致；但该枚举**实际列名仍只有 6 项**（make-decision 方向与细节、build-spec、build-plan、mini_task/design、non_stage/build_prd），第 7 项到底是 `mini_task/implementation`（diff 面）还是另有他面，材料仍未点名——**该计数余项并入 OI-026 的映射表交付物，由 build-plan 逐一登记**（OI-026 完成条件本就要求「10 个审查面逐一有归属」），本修复不代填。原 M6 校正逐字保留。）**
  - **（F-13 权威面集事实（2026-09-22 晚，实测）**：`runtime/review/stage-materials.json` 的 `surfaces` 对象**恰为 10 个审查面**：`make-decision/direction`、`make-decision/detail`、`build-spec`、`build-plan`、`build-code/phase`、`build-code/integration`、`verify-code`、`mini-task/design`、`mini-task/implementation`、`build-prd`（该文件的 `surfaces` 用连字符 `mini-task/...` 与 `build-prd`，结构键用下划线 `mini_task/...` 与 `non_stage/build_prd`；本材料正文沿用下划线写法）。**三个被替换面** = `build-code/phase` / `build-code/integration` / `verify-code`（后者合同按 D-023 改为真实 diff 审查）。**剩余 7 个面** = `make-decision/direction` · `make-decision/detail` · `build-spec` · `build-plan` · `mini_task/design` · `mini_task/implementation` · `non_stage/build_prd`。**⚠️ `mini_task/implementation` 是 diff 面（`source_bundle = "diff"`）但不在被替换面集内**——它是否纳入被替换面 → **明确登记为 OI-026 的待定项**（该条完成条件本就要求「10 个审查面逐一有归属」），**本卡不预选**。上面「7 个文档审查面」枚举与实际 7 面集合的差异据此消解。**）**
- **明确不动**：wh-review 物理删除（CARD-06）、身份/哈希/快照/回执校验机制的移除（CARD-06，OI-013 全删面）、审查基建并发上限（CARD-09②）、**不新增固定审查轮次**（AC-23 失败判据）。

**取舍**：

| 选择 | 选中 | 被否 | 理由 |
|---|---|---|---|
| 输入形态 | `packet`（需求+设计+diff+相关代码） | `diff`（结构上看不到需求与周边代码，与目标 2 直接矛盾）；裸 `worktree`（成本不可控） | D-002 |
| 通过判据 | any-of-N（任一成功即通过） | quorum（`REVIEW_QUORUM_INCOMPLETE` 丢弃已完成审查） | D-005 |
| 执行者 | 每路一个独立子代理，各绑一个 provider | 沿用现有 broker group request（病灶本身） | D-007 |
| config | 只读既有 `wh_review.stages.*.initial[]`，不改结构 | 改 config 结构（撞 D-019 未废止禁令） | D-008 |
| finding schema | 先用 OCR 原生（4 级 severity + category） | 立刻叠加 wh-review 证据强制（污染实验臂） | D-009 |
| 兜底审查者 | 全新上下文 + 可读仓库 | 继承实现者上下文（s4 实证：4 个代理 2 小时漏掉最大缺陷） | D-010 |
| 复审 | 严格单次，verify-code 功能验收兜底 | 允许定向复核（历史证明会被用成复审循环） | D-003 |
| 范围 | ②③④ 代码审查点 | 含文档审查点（RF-11：OCR 原生场景仅覆盖 30%；card-02 已承接①） | D-006 |

**被否方案**：直接把 OCR 预设为选型（PRD:385 纪律禁止，须先做对比实验）；用 OCR 的 `delegate` 模式做 packet 审查（委托模式**不产生 finding**，finding 由宿主 Agent 产出）；把 wh-review/broker 当 fallback（OI-006：旧路径只读，**不构成可执行 fallback**）。

**未决项（须在 build-plan 前闭合）**：OI-004（go/no-go 阈值三件套数值，**AC-55 硬要求：无阈值即下结论=失败**）、OI-015（审查内容质量契约 / rubric 内容）、OI-022（逐路派发的实现载体）、OI-023（审查方可读仓库与现行隔离边界的冲突处置）、OI-025（包体积上限——用户在 2026-09-21 曾当面裁定「彻底删除审查的 307,200B 上限，根本就不应该有任何上限和阻塞」；**校正：该上限在基线 `642d4fb2` 上已不存在，活义务为「不回归 + 不重新引入」，见 D-013/OI-025 校正**）、OI-010（错误语义契约）、OI-012（审查事实写入位置）、OI-014（与 CARD-09 写面协调）、OI-016（与 card-07 接口对齐）。

## 需求矩阵：原始需求 → 决定（覆盖矩阵）

> 本表为 `analyzeDecisionConvergence` 读取的需求覆盖矩阵（表头含「处置」列，逐行给出处置），亦对应 `## Grill 结束记录` 中 `requirement_coverage.message_classes: [goal, flow_or_surface, data_or_state, success_failure_acceptance, constraint_non_goal_defer]` 的逐条落点。
> 处置取值：`covered（已覆盖）` / `accepted_omission（已接受遗漏）` / `non_goal（非本卡目标）` / `deferred（延期）`。
> 「母 PRD R-xxx / 母 PRD OI-xxx」行取自母 PRD「需求覆盖结论」节逐条追踪表（`prd.md` L139–179）的 owner card 列：owner 含 CARD-05 者记 covered，其余如实记 non_goal（不冒认覆盖）；本卡自身承接的落点写在「落点 / 依据」列。
> 「声明 N」「D-10x」行取自本文件「需求变更记录」节，逐字引用原文。

| 需求 | 内容 / 来源 | 处置 | 落点 / 依据 |
|---|---|---|---|
| 母 PRD R-001 | U-001#1:阶段合并、spec 质量、真实验收 | non_goal（非本卡目标） | 母 PRD owner=CARD-01/02/04/10 |
| 母 PRD R-002 | U-001#2:删 plan/tasks、每 phase 独立文档 | non_goal（非本卡目标） | 母 PRD owner=CARD-02 |
| 母 PRD R-003 | U-001#3:真实可转 green 的 red | non_goal（非本卡目标） | 母 PRD owner=CARD-04 |
| 母 PRD R-004 | U-001#4:子代理隔离、主会话协调、可并行 | non_goal（非本卡目标） | 母 PRD owner=CARD-03；并行声明制见 D-017 风险项 |
| 母 PRD R-005 | U-001#5:替换实现与验证审查链 | covered（已覆盖） | 本卡承接：D-006（②③④ 代码审查点 + 工具接入 + 对比实验 + go/no-go + fallback）、D-004/D-007/D-008/D-009/D-010/D-011/D-014/D-022；FR-22..FR-26/53/54；AC-22..AC-26/54/55 |
| 母 PRD R-006 | U-001#6:不建 token/时间统计机制 | non_goal（非本卡目标） | 母 PRD owner=CARD-06；该非目标约束在本卡同样生效：D-021 不修项表明列「新增 token/时间统计面=不新建」，本卡只做 `usage` 采集修复（P8） |
| 母 PRD R-007 | U-001#7:弱化严格验收、消除阻塞 | non_goal（非本卡目标） | 母 PRD owner=CARD-01/04 |
| 母 PRD R-008 | U-001#8:薄核心多技能、删臃肿 | non_goal（非本卡目标） | 母 PRD owner=CARD-06 |
| 母 PRD R-009 | U-002:worktree→make-decision→build-prd→逐任务实施 | non_goal（非本卡目标） | 母 PRD owner=CARD-01 + 规划旅程自身 |
| 母 PRD R-010 | U-002:大白话交互、主会话只派发与交互技能 | non_goal（非本卡目标） | 母 PRD owner=CARD-03/07；本卡按 D-106 执行同一约束（主会话上下文守恒） |
| 母 PRD R-011 | U-005:八点仅粗略候选，需独立诊断与备选比较 | non_goal（非本卡目标） | 母 PRD owner=CARD-07 + 规划旅程自身 |
| 母 PRD R-012 | U-005 Round2 两个局部 A:独立替代审查;新流程优先 | covered（已覆盖） | 母 PRD owner=CARD-05/08；本卡承接 T-003 部分：D-005（any-of-N）+ D-010（全新上下文 + 可读仓库兜底），AC-25 |
| 母 PRD R-013 | U-006:继续授权，不是批准架构 | non_goal（非本卡目标） | 母 PRD 显式排除（过程性授权事实，无独立交付物） |
| 母 PRD R-014 | U-007:方法工具包定位 A | non_goal（非本卡目标） | 母 PRD owner=CARD-01/10 |
| 母 PRD R-015 | U-009#1:全部阶段派子代理+计划并行 | non_goal（非本卡目标） | 母 PRD owner=CARD-03 |
| 母 PRD R-016 | U-009#2:审查次数纠正（只换工具） | covered（已覆盖） | 本卡承接：D-006（除 ① 由 card-02 承接外节奏不变）、SD-07 完整序列、AC-23/AC-26 |
| 母 PRD R-017 | U-009#3:CPU/温度必须优化并定位原因 | non_goal（非本卡目标） | 母 PRD owner=CARD-09 + 环境层排除 |
| 母 PRD R-018 | U-010#1:彻底移除质量/流程阻塞，薄核心无任何阻塞 | non_goal（非本卡目标） | 母 PRD owner=CARD-01/06；本卡在审查侧同样遵守：D-005（不放弃审查）+ D-013（取消一切 fail-closed 上限）+ D-014（零发现判据） |
| 母 PRD R-019 | U-010#2:删除哈希/快照/身份/材料/回执校验机器，推进/审查/测试不依赖 | covered（已覆盖） | 母 PRD owner=CARD-06/05/04/02；本卡分担 AC-58：D-017 修复面「派发语义」+ D-021 不修项表（机制移除归 CARD-06） |
| 母 PRD R-020 | U-010#3:build-plan 一次合并审查覆盖 spec+phase 文件 | **covered（有条件）** | 母 PRD owner=CARD-05；① 由 card-02 提前完成，本卡按 RF-06/D-006 不重做，保留 AC-23/AC-26/AC-57 核对。**（D-030 更新（2026-09-22 用户裁决）：`covered` 的条件已满足——① 的交付物核验**已登记为本卡的验收动作**（D-030，须核验真实交付物 / 命令 / exit code 并记录结果）；本条 `covered` 自此读作「**以本卡核验动作为条件的 covered**」，核验未执行前不得读作已覆盖。）** **（校正/未决（M10→CF-9，历史记录：母 PRD 把 R-020 的 owner 明确写成 **CARD-05**（`prd.md:161-162`），OI-014 同（`prd.md:178-179`）；本行「已覆盖」的唯一依据是 **card-02 归档 decision-log 的自述**，材料**未核对任何交付物、命令或 exit**，也**未把「① 的交付物核验」登记为本卡的验收动作或移交项**。而 card-02 材料中用户纠偏原文恰恰要求「card-02 提前完成了 X（事实登记）；对应卡执行时核对，**但不得因此缩减该卡的验收范围**」（card-02 DL:1983-1991）。是否把 ① 的交付物核验登记为本卡验收动作，需用户裁决 → **CF-9**。）** |
| 母 PRD OI-001 | 规划两阶段/实施四阶段拓扑;删固定轮次与逐阶段认证;文档形态 | non_goal（非本卡目标） | 母 PRD owner=CARD-01/02 |
| 母 PRD OI-002 | 全阶段按工作类型派子代理;并行规则在计划阶段产出;并发上限 2–5 | non_goal（非本卡目标） | 母 PRD owner=CARD-03 |
| 母 PRD OI-003 | 保留真实命令证据/原子写/授权/失败事实/历史只读;删重复证据包装与 fact graph 强制依赖 | non_goal（非本卡目标） | 母 PRD owner=CARD-06（材料权威部分 CARD-02） |
| 母 PRD OI-004 | 验收标准在 make-decision 写为可执行;真实入口联通才算完成;oracle 与实现者分离 | non_goal（非本卡目标） | 母 PRD owner=CARD-04（总体承接 CARD-10）；本卡在其自身材料中执行「验收可执行」写法（本节收敛检查 acceptance 行） |
| 母 PRD OI-005 | 审查节奏不变只换工具;对比实验+fallback;不可用一次独立替代 | covered（已覆盖） | 母 PRD owner=CARD-05；D-006 + D-005 + D-010 + D-022；本卡 OI-007/OI-017 承接 |
| 母 PRD OI-006 | 保留可搬运技能+5 窄工具;删通用完成对象与 kernel 强制依赖;wh-review/broker 历史只读不换名 | non_goal（非本卡目标） | 母 PRD owner=CARD-06 |
| 母 PRD OI-007 | 新流程优先;旧任务与历史只读不管;窄状态集+回读 | non_goal（非本卡目标） | 母 PRD owner=CARD-08 |
| 母 PRD OI-008 | 不改视觉页面与展示层 | non_goal（非本卡目标） | 母 PRD 显式排除（非目标，三源一致 non_ui）；本卡同判 `non_ui`（见「UI applicability」节） |
| 母 PRD OI-009 | 方法工具包定位 | non_goal（非本卡目标） | 母 PRD owner=CARD-01/10 |
| 母 PRD OI-010 | make-decision 改造为头脑风暴平台 | non_goal（非本卡目标） | 母 PRD owner=CARD-07 |
| 母 PRD OI-011 | CPU=高基线+高峰值;产品层四项修复 | non_goal（非本卡目标） | 母 PRD owner=CARD-09；环境层部分排除 |
| 母 PRD OI-012 | 阻塞边界:仅两道人为门,一切机器/流程门禁删除 | non_goal（非本卡目标） | 母 PRD owner=CARD-01/06；本卡按 SD-17/D-013「取消一切 fail-closed 上限」在审查侧遵守 |
| 母 PRD OI-013 | 校验机器彻底全删;记录层普通文件名+纯文本引用 | covered（已覆盖） | 母 PRD owner=CARD-06/05/04/02；本卡分担 AC-58 审查派发面 + D-020（`quality/reviews/` + 不可变命名）；机制移除归 CARD-06（D-021） |
| 母 PRD OI-014 | build-plan 合并审查一次覆盖 spec+phase 文件 | **covered（有条件）** | 母 PRD owner=CARD-05；RF-06（card-02 已提前完成 ①）/D-006 不重做。**（D-030 更新（2026-09-22 用户裁决）：核验动作已登记（D-030），`covered` 以该动作为条件。）** **（同上：owner=CARD-05 见 `prd.md:178-179`；「不重做」不等于「不核对交付物」，核验动作未登记 → CF-9（**已由 D-030 RESOLVED**）。）** |
| 声明 1 | 「对整个 workflowhub 的所有审查（不止是 build-code 和 verify-code），进行系统性的优化和改造。」 | covered（已覆盖） | D-101/D-107；D-018 范围扩大（3 代码面替换 + 7 文档面问题修复 + wh-review 阻塞问题一并解决）；D-017 审查层契约、10 面受益。**（校正（M4）：本行的 `covered` 依据是**晚于** D-006 的 D-018；D-006 风险里「声明 1/2 在本卡不完整满足」是 Talk round 2 时点的表述，两处并存属时序差异而非两个权威。声明 2 在同一矩阵已判 `accepted_omission`。原两处原文均逐字保留；**另：「须在阶段末遗漏披露中如实列出」这一承诺**在本次修复的 make-decision 材料内尚未兑现（本文件 `## 未能满足的解析器字段（如实披露）` 只登记解析器字段），落点见下方「遗漏披露承诺的落点」。）** |
| 声明 2 | 「让 AI 能正确的审查需求或技术设计，并找出任何漏洞、边界情况、与现有代码的意外交互或其他类似问题。」 | accepted_omission（已接受遗漏） | D-102；D-012 rubric 四要素含边界情况/失败路径/与现有代码的交互，但文档/设计审查点不在本卡（D-006）；须在阶段末遗漏披露登记（D-006 风险） |
| 声明 3 | 「让 workflowhub 的审查过程简单、干净、轻松、高质量、永不阻塞和失败。」 | covered（已覆盖） | D-103；D-005（any-of-N，不放弃审查）+ D-010（兜底）+ D-013（取消一切上限）+ D-003（严格单次）；「永不失败」不得读作「永不记失败」 |
| 声明 4 | 「https://github.com/alibaba/open-code-review 项目我也已经安装好了。也需要进行尝试，是不是比本机的 wh-review 的 build-code 和 verify-code 质量更好？如何接入到 workflowhub 的流程中来。」 | covered（已覆盖） | D-104；D-022 对比实验（回溯臂 + 前瞻臂）；RF-16 控制臂语料 #0；D-004 接入形态；**D-031**（基线集合须含一条**真实代码 diff 面**的 wh-review 实跑——声明 4 问的正是 build-code / verify-code 这两个**代码面**，只凭文档面基线无法回答；执行属 build-plan 的实验设计，本次未跑） |
| 声明 5 | 「尤其是我想利用 `/Users/Hugh/.config/workflowhub/config.json` 的 build-code 和 verify-code 的配置，使用 open-code-review 中的委托模式进行代码审查或所有审查。」 | covered（已覆盖） | D-105；D-007（每路一独立子代理各绑一 provider）+ D-008（只读既有 `wh_review.stages.*.initial[]`，不改结构）；RF-01；**D-029**（`mode` 键由新逐路派发路径**忽略**、仅作校验，派发路数 = `initial[].length`；该读法使 D-008 的「只读既有键」在该键上重新有确定含义） |
| 声明 6 | 「主会话只进行任务规划、子代理任务派发和交互类技能的执行，不要进行大量阅读和执行任务，保证主会话上下文控制和执行质量。」 | covered（已覆盖） | **本行依据（已更正）**：`## 需求变更记录` 把该声明登记为派生需求 **D-106**（事实登记，逐字保留原声明 + source 锚点）；**执行约束的登记形式**由 **OI-028** 承接（`status: deferred`，owner = build-plan）；**主会话瘦身验证**归 CARD-09（D-021 不修项表）。**（校正（gap B-8 第 8 条）：原依据逐字为「D-106 登记为执行约束；D-021 不修项表「主会话瘦身验证归 CARD-09」；OI-028 记录登记形式」——其中「登记为**执行约束**」没有材料依据：本材料**没有**把 D-106 写成执行约束的正文，OI-028 的 `impact` 亦自认「该「执行约束」措辞本身在 `## 收敛检查` solution 行正文中未出现（材料内部不一致）」。故依据改为「派生需求已登记 + 登记形式由 OI-028 承接」，**保留 `covered`**（该声明在本卡被接受为主会话纪律，并在 `## 需求变更记录` 有成文事实登记），**但如实登记残留**：执行约束的**成文形式尚未产生**（OI-028）。原依据逐字保留于本注。）** |
| D-101 | 审查改造范围超出 U-001#5 点名的 build-code / verify-code，含需求与技术设计审查 | covered（已覆盖） | D-018 显式扩大范围并登记为对母 PRD CARD-05 范围节的偏离；T-016/T-017 |
| D-102 | 审查质量目标是「发现漏洞、边界情况、与现有代码的意外交互」 | covered（已覆盖） | D-012 rubric 四要素（清单覆盖含边界情况/失败路径/与现有代码的交互）；T-011 |
| D-103 | 「永不阻塞和失败」 | covered（已覆盖） | D-005 + D-013 + D-014；澄清：「永不失败」不得读作「永不记失败」（不可用路径如实记 `unverified`，SD-08） |
| D-104 | 要求实测 OCR 与 wh-review 的质量对比 | covered（已覆盖） | D-022（回溯臂 card-02 材料 + 前瞻臂本卡 build-code）；RF-16 控制臂 |
| D-105 | 用 config.json 的 build-code / verify-code 配置承载 OCR 委托模式 | covered（已覆盖） | D-008（不改结构、只读既有键）；D-007；RF-07（D-019 定向禁令未被触发） |
| D-106 | 主会话上下文守恒（重活下沉子代理） | covered（已覆盖） | `## 需求变更记录` 已登记 D-106（逐字原声明 + source 锚点）；登记形式由 **OI-028** 承接（`deferred`）；验证归 CARD-09（D-021 不修项表）。**（校正（gap B-8 第 8 条）：原依据逐字为「D-106 登记；**本节收敛检查 solution 行列为执行约束**；OI-028 记录登记形式；验证归 CARD-09（D-021）」——其中「本节收敛检查 solution 行列为执行约束」**在材料正文中不存在**（OI-028 的 `impact` 自认该措辞未出现），故该依据被替换为真实落点；`covered` 保留，残留 = 执行约束成文形式未产生（OI-028）。）** |
| D-107 | 本卡范围扩大：3 个代码审查面替换 + 7 个文档审查面问题修复 + wh-review 阻塞类问题彻底一并解决 | covered（已覆盖） | D-018 三项全列；D-017 修复面（派发/聚合/超时与取消/启动自检/成本计量）；D-021 闭环清单（**现为 P1–P18**；2026-09-22 晚经同一任务追加修订由 P1–P14 扩为 P1–P18——新增 P15/P16/P17/P18 四条审查层缺陷，来源 RF-20 与 D-032~D-036；「3 个代码审查面」的面集冲突见 CF-2（**已由 D-023 RESOLVED**：三个面改为真实 diff 审查），「超时与取消」的 ADR 冲突见 CF-1（**已由 D-024 RESOLVED**：本卡承担 ADR 覆盖），跨仓修复见 D-025） |
| D-108 | 修复层次 = 修「审查层」行为契约，不是给 wh-review 打补丁 | covered（已覆盖） | D-017；修复面与 CARD-06 删除面重叠按 SD-14 协调 |

## 收敛检查

| 维度 | 用户真实答复（answer） | 事实/材料引用（reference） | 可执行验收（acceptance） |
|---|---|---|---|
| 目标 | 用户答复：T-001–T-017 与 G-1–G-4 逐轴真实答复；声明 1–6 逐字保留；目标是换掉会卡死、会丢弃已完成审查、且看不到代码的审查链，让审查真的能发现漏洞、边界情况与现有代码的意外交互 | 声明 1–4（本文件「需求变更记录」）；RF-09（机制根因）；取证总账（4 会话约 13.4 亿 input token）；RF-16（本卡自身复现丢弃）；D-005/D-007/D-010 | 通过：AC-23 审查节奏与 SD-07 完整序列一致、① 由 card-02 承接不重做（D-006）；失败：额外增加固定审查轮次或终末代码审查与功能验收混记 |
| 范围 | 用户答复（T-016 逐字）：「当前任务既要负责三个代码审查面的替换，也要负责其他7个审查面的问题修复，wh-review技能这么多问题和阻塞，也要彻底一起解决！」 | T-016 逐字；D-006（三面替换）+ D-017（审查层契约，10 面受益）+ D-018（范围扩大，显式偏离母 PRD）+ D-021（**P1–P18** 闭环清单 + 不修项与归属卡；2026-09-22 晚经同一任务追加修订由 P1–P14 扩为 P1–P18，见 D-021 追加校正注）+ 2026-09-22 用户裁决 D-023（面集口径 = 3 个真实 diff 面）/ D-024（「超时与取消」承担 ADR）/ D-025（跨仓修复并登记） | 通过：AC-23 / AC-57（合并审查恰好一次、时机正确、两类质量核心齐备）；失败：任一应有审查未发生、合并审查被拆成两次固定审查 |
| 方案 | 用户答复：14 个决策轴（T-001–T-017、G-1–G-4）逐轴选定方案；取舍：以「修审查层契约」换取 10 个审查面共同受益，代价是本卡交付变重且与 CARD-06 写面重叠（按 SD-14 错时或分面合并）；被拒方案（原表措辞「被否方案」）：直接把 OCR 预设为选型、用 OCR 自管 LLM 路径、保留 wh-review/broker 作可执行 fallback、双写 finding schema、10 面全换 OCR、包体积自动分片；未决项：OI-026、OI-027、OI-028、OI-029、OI-030、OI-010、OI-012、OI-014、OI-016、OI-022、OI-023 全部不改变方向，移交 build-spec / build-plan，各自带负责人与完成条件（**2026-09-22 更新：OI-027 已按 D-028 改判 `confirmed`（升为必需前置）、OI-029 已按 D-027 扩范围并保持 `confirmed`；另新增 OI-032 / OI-033（均 `deferred`，owner 与完成条件见各条记录）。**） | D-001 ~ D-022；RF-15（rule schema 已解）；G-CK / G-1–G-4；T-002/T-003/T-004/T-006/T-007/T-008/T-009/T-010–T-013/T-017＋ 2026-09-22 用户裁决 D-023 / D-024 / D-025 / D-026（CF-1–CF-4）、**D-027 / D-028 / D-029 / D-030 / D-031（CF-6–CF-9 与代码面基线）** | 通过：AC-54（适配合同六要素齐备且接入晚于冻结）、AC-55（阈值在实验前写死并对照得出 go/no-go）；失败：合同任一要素未冻结即接入、无阈值即下接入结论 |
| 验收 | 用户答复：按母 PRD AC-22 / AC-23 / AC-24 / AC-25 / AC-26 / AC-54 / AC-55 / AC-57 / AC-58 逐条核对 | 母 PRD「### CARD-05 审查链替换(有证据门槛)」AC 节；D-003/D-005/D-006/D-010/D-011/D-014/D-016/D-019/D-020/D-022 | 场景：一个真实实施 task 完成 build-plan → build-code（每 phase）→ 全 phase 集成 → verify-code，以及一次工具不可用路径演练；数据来源：该 task 的审查执行记录（命令、exit、output 位置，纯文本路径引用）、对比实验报告、适配合同、card-02 归档材料作为回溯臂真值；通过：AC-22 / AC-23 / AC-24 / AC-25 / AC-26 / AC-54 / AC-55 / AC-57 / AC-58 全部满足；失败：无实测数据仅凭厂商宣称即接入、任一应有审查未发生、合并审查被拆成两次固定审查、额外增加固定审查轮次、终末代码审查与功能验收混记一条、出现复审循环或按 severity 门槛搁置发现、不可用或缺审查被写成通过/已审、无阈值即下接入结论、派发被任一机器校验阻断 |

> 上表四行的行标签由原表 `target / scope / solution / acceptance` 改写为解析器词表「目标 / 范围 / 方案 / 验收」；用户答复与材料引用内容逐字保留，原三列表原文保留于本节末。

**solution 行的取舍 / 被否方案 / 未决项处置**

- **取舍**：以「修审查层契约」换取 10 个审查面共同受益，代价是本卡交付变重且与 CARD-06 写面重叠（按 SD-14 错时或分面合并）。
- **被否方案**：直接把 OCR 预设为选型（母 PRD 纪律禁止）；用 OCR 自管 LLM 路径（本机无 provider 配置，且引入新凭据）；保留 wh-review/broker 作可执行 fallback（OI-006 明令只读）；双写 finding schema（AGENTS.md 禁止新增双写）；10 面全换 OCR（与 card-02 重叠、超出可交付范围）；包体积自动分片（T-012 用户裁定不做）。
- **未决项处置**：OI-026（审查面→工具/形态/fallback 映射表）、OI-027（聚合/quorum 语义契约）、OI-028（D-106 执行约束登记）、OI-029（丢弃事实记账——委托模式下已由 `excluded_files` 覆盖；**但宿主子代理上下文这一新闸门未被覆盖，见 CF-6**）、OI-030（实验判定维度；**其缺口曾使 D-014 第二析取支不可判真假（见 CF-4），该支已由 D-026 删除**，故该后果不再成立；OI-030 仍 `deferred`，其「actionable 如何判定」的维度仍属实验设计交付物）、OI-010（错误语义契约）、OI-012（已由 D-020 解决）、OI-014（与 CARD-09 协调）、OI-016（与 card-07 接口对齐）、OI-022/OI-023（实现载体与隔离边界）→ **全部不改变方向，移交 build-spec / build-plan，各自带负责人与完成条件**，不得静默放过，也不得变成额外机器硬门。
- **（补充：除上列 OI 外，2026-09-22 独立替代审查另立了 CF-1–CF-9 未决冲突（见文末 `## 独立替代审查发现的未决冲突（须用户裁决）`）。它们不是 OI、不改方向，但**必须由用户裁决后才能进 build-spec**；本节与 OI 台账的「已闭合」不得被读作「材料已无未决事项」。）**
- **（更新（2026-09-22 用户裁决）：CF-1–CF-4 已分别由 **D-024 / D-023 / D-025 / D-026** 裁决并 **RESOLVED**；CF-6–CF-9 已分别由 **D-027 / D-028 / D-029 / D-030** 裁决并 **RESOLVED**（见 `## 决策（续，2026-09-22 用户裁决：CF-6 / CF-7 / CF-8 / CF-9）`）。**CF-1–CF-9 九条至此全部裁决完毕**，「必须由用户裁决后才能进 build-spec」这一限制**已全部解除**。上一条原表述逐字保留于本注。）**

**acceptance 行的场景 / 数据来源 / 通过条件 / 失败条件**

- **场景**：一个真实实施 task 完成 build-plan → build-code（每 phase）→ 全 phase 集成 → verify-code；以及一次工具不可用路径演练。
- **数据来源**：该 task 的审查执行记录（命令、exit、output 位置，纯文本路径引用）；对比实验报告；适配合同；card-02 归档材料作为回溯臂真值。
- **通过条件**：AC-22（实验报告含真实任务、发现数、失败边界、耗时事实与 fallback 结论）；AC-23（审查节奏与 SD-07 完整序列一致，① 由 card-02 承接不重做）；AC-24（同 scope 无复审记录，修复有记录）；AC-25（不可用时由未参与实现者完成替代审查并记录来源与缺口）；AC-26（各节奏点真实执行记录齐备）；AC-54（适配合同六要素齐备且接入晚于冻结）；AC-55（阈值在实验前写死并对照得出 go/no-go）；AC-57（合并审查恰好一次、时机正确、两类质量核心齐备）；AC-58（派发无材料身份/哈希/快照/回执校验前置）。
- **失败条件**：无实测数据仅凭厂商宣称即接入；任一应有审查缺失、合并审查被拆成两次、**额外增加固定审查轮次**、或终末代码审查与功能验收混记一条；出现复审循环或按 severity 门槛搁置发现；不可用或缺审查被写成通过/已审，或无限重派；任一节奏点缺真实执行记录或为脚本自证；适配合同任一要素缺失或未冻结即接入；无阈值即下接入结论、no-go 仍接入、或 no-go 后 fallback 被拆除；派发被任一机器校验阻断或输入依赖哈希/身份绑定。**对比实验必须冻结一份材料**：step 6（direction，RF-16）与 step 10（detail，RF-19）分别跑在 580 行与 934 行的不同材料上，**不构成有效对照**（RF-19 证据限制 ③），后续对比实验须先冻结同一份材料再跑两臂。

**原三列收敛表（原文保留，不参与解析）**

> 解析器（`analyzeDecisionConvergence.structuredConvergenceFacts`）只把本节的**第一个**四列表当作四维表（`cells.length >= 4`），下表为原表逐字保留，行标签未被改写。

| 行 | 用户真实答复 | 事实/材料引用 |
|---|---|---|
| **target（目标）** | 换掉会卡死、会丢弃已完成审查、且看不到代码的审查链；让审查真的能发现漏洞、边界情况与现有代码的意外交互 | 声明 1–4（本文件「需求变更记录」）；RF-09（机制根因）；取证总账（4 会话约 13.4 亿 input token）；RF-16（本卡自身复现丢弃） |
| **scope（范围）** | 「当前任务既要负责三个代码审查面的替换，也要负责其他7个审查面的问题修复，wh-review技能这么多问题和阻塞，也要彻底一起解决！」 | T-016 逐字；D-006（三面替换）+ D-017（审查层契约，10 面受益）+ D-018（范围扩大，显式偏离母 PRD）+ D-021（**P1–P14** 闭环清单 + 不修项与归属卡；原记 P1–P13；**2026-09-22 晚经同一任务追加修订扩为 P1–P18**） |
| **solution（方案）** | OCR 委托模式接入（T-003/T-017）；packet 输入（T-002）；每路一独立子代理各绑一 provider（T-006）；config 只读不改（T-007）；先用 OCR 原生 schema 跑实验（T-008）；兜底=全新上下文+可读仓库（T-009）；严格单次不复审（T-004）；全相对阈值+非相对必要条件（T-010/T-013）；rubric 四要素（T-011）；彻底取消体积上限（T-012）；finding schema 以 OCR LlmComment 为骨架+强制证据（G-1）；事实沿用 `quality/reviews/`+不可变命名（G-2）；实验=card-02 回溯+本卡前瞻（G-4） | D-001 ~ D-022 |
| **acceptance（验收）** | 按母 PRD AC-22 / AC-23 / AC-24 / AC-25 / AC-26 / AC-54 / AC-55 / AC-57 / AC-58 逐条核对 | 见下 |

## 未能满足的解析器字段（如实披露）

> 本节登记「解析器要求、但材料没有事实依据」的字段。**不伪造通过**：没有依据的字段一律留空并保持 OI 的 `open` 状态，不用 `confirmed`/`deferred` 去凑闭合。

> **2026-09-22 刷新（终局处置落地后）**：下方 `### 1.` `### 2.` `### 3.` 为**前一版记录，逐字保留作历史**，其中「29 条保持 `open`」的描述已不再代表当前状态；刷新后的实况见下面 `### 1′`–`### 4′`（位于本节引言与 `### 1.` 之间）。

### 1′ 当前状态：仍 `open` 的 OI = 0 条

- 33 条 OI 记录：**20 条 `confirmed` / 13 条 `deferred` / 0 条 `open` / 0 条 `not_applicable`**。**（校正：原表述为「31 条 OI 记录：**20 条 `confirmed` / 11 条 `deferred` / 0 条 `open`**」——那是本次 gap 修复前的计数；本次新增 OI-032 / OI-033（均 `deferred`），并把 OI-027 由 `deferred` 改判 `confirmed`（D-028），故 `confirmed` 20 条不变、`deferred` 由 11 增至 13、总数 33。）**
- **当前 OI 计数权威（D-041 后实测，2026-09-22）**：35 条 YAML OI = **22 `confirmed` / 13 `deferred` / 0 `open` / 0 `not_applicable`**。OI-034 已由用户 D-041 裁决，从 `deferred` 改判 `confirmed`；其余旧段中的 21/14、20/15、33/20/13 等均为历史计数。实测仅统计 `### OI 记录` 的 35 个 YAML `oi_id`/`status` 字段，不统计正文引用。下文 `### 2′` 保留逐条依据；旧更正文字只作版本留证。
- **仍 `open` 的 OI：无。** 每一条的终局状态都由本文件已存在的决定或章节文本支撑，逐条依据见 `### 2′`；没有一条是为了让 `no_open_items` 通过而「凑」出来的。
- **⚠️ 但「0 条 open」≠「材料已无未决事项」（2026-09-22 独立替代审查新增披露）**：文末 `## 独立替代审查发现的未决冲突（须用户裁决）` 登记的 **CF-1–CF-9 是独立于 OI 台账的未决清单**，其中 CF-1/CF-2/CF-3/CF-4/CF-6/CF-7/CF-8/CF-9 仍待用户裁决。它们不写成 `open` OI，是因为它们不是「本卡未知项」而是「需要用户改决定才能闭合的冲突」；`no_open_items = passed` 只说明 OI 台账无 open 项，**不得据此宣称材料无未决事项**。**（更新（2026-09-22 用户裁决，最终）：原表述为「其中 CF-1/CF-2/CF-3/CF-4/CF-6/CF-7/CF-8/CF-9 仍待用户裁决」——CF-1–CF-4 已分别由 **D-024 / D-023 / D-025 / D-026** 裁决并 **RESOLVED**；**CF-6–CF-9 已分别由 D-027 / D-028 / D-029 / D-030 裁决并 RESOLVED**。**CF-1–CF-9 至此全部裁决完毕，本节告警所指的未决 CF 清单已清空**（告警本身仍成立：`no_open_items = passed` 只说明 OI 台账无 open 项）。原表述逐字保留于本注。）**
- 人读表（`### OI 台账` 与 `## 新增 OI（Talk round 2 派生）`）的「状态 / 终局处置」列**保留 step 1–2 初稿原文（`open` / `待定`）未改**；解析器权威的终局处置在 `### OI 记录` 的 YAML 记录与本节的 `### 2′`。两处并存属**已披露的状态**，不是两个权威。
- 材料自身的两处未决项清单（`## 已选方向` 末「未决项（须在 build-plan 前闭合）」与 `## 收敛检查` solution 行「未决项处置」）与本节的分歧：前者是 step 1–2/中期文本，仍列 OI-004 / OI-012 / OI-014 / OI-015 / OI-016 / OI-022 / OI-023 / OI-025 / OI-010 等；其中 OI-004 / OI-012 / OI-015 / OI-025 已被其后作出的 D-011 / D-014 / D-012 / D-013 / D-020 闭合（`## 收敛检查`「未决项处置」自己也已记「OI-012（已由 D-020 解决）」）。**两处原文均逐字保留，未删改。**

### 2′ 逐条终局处置与依据

| OI | 终局状态 | 依据（决定 / 章节） | 终局字段取材方式 |
|---|---|---|---|
| OI-001 | confirmed | RF-09（历史失败规模）+ 取证总账 + P11（误分类）+ D-017/D-021 | 事实分布取自 RF-09 与取证总账；误分类的修复归属取自 D-021 闭环清单 P11 |
| OI-002 | confirmed | D-011（token 不作指标）+ D-014（零发现判据）+ D-016 后果 + D-021 不修项表 | 「成本与发现脱钩」为 RF-16/取证总账实测；「不新建统计面」为 D-021 原文 |
| OI-003 | deferred | D-004（接入形态已定）+ D-006（对比实验 + go/no-go 属本卡）+ RF-08 M5 | 选型结论属实验产出，材料未定案 |
| OI-004 | confirmed | D-011（相对阈值 + RF-16 基线值）+ D-014（非相对必要条件） | 阈值数值 = RF-16 控制臂实测值，材料逐字给出 |
| OI-005 | confirmed | D-002（选定 packet，含取舍 / 被否方案 / 失效条件）+ RF-04 | 全部取自 D-002 原文；失效条件用作 counterexample |
| OI-006 | confirmed | D-009（先用 OCR 原生 schema）+ D-019（LlmComment 骨架 + 强制证据）+ G-CK | 字段名 / 严重度取值域取自 G-CK 与 RF-03 |
| OI-007 | confirmed | D-006（范围 = ②③④）+ D-018（范围扩大，文档面不换工具）+ RF-06 | 范围边界取自 D-006/D-018 原文 |
| OI-008 | confirmed | D-007（每路一独立子代理各绑一 provider）+ D-008（只读既有键）+ D-005（any-of-N） | 「谁指挥 / 谁执行 / 异源规则」三项分别对应 D-007 / D-008 / D-005 |
| OI-009 | confirmed | D-005（any-of-N）+ D-010（全新上下文 + 可读仓库）+ D-013（取消一切上限） | 三档路径 = 三条既有决定的合并；验收取 AC-25 |
| OI-010 | deferred | P11（问题定位已完成）+ `## Grill 结束记录` failure_semantics（残留项，记负责人与完成条件） | 错误语义契约本身未成文 |
| OI-011 | confirmed | D-003（严格单次 + verify-code 兜底） | 「修完是否需确认」= D-003 原文否命题 |
| OI-012 | confirmed | D-020（沿用 quality/reviews/ + 不可变命名、不用内容寻址哈希） | 材料两处不一致（未决项清单 vs「已由 D-020 解决」）均保留原文 |
| OI-013 | confirmed | D-018「边界（不变）」+ D-021 不修项与归属卡 + D-017 | 不做清单 = 三处原文合并 |
| OI-014 | deferred | D-017 后果（SD-14 错时或分面合并）+ D-021 不修项表（并发上限归 CARD-09） | 协调时点与集成责任方未点名 |
| OI-015 | confirmed | D-012（rubric 四要素）+ RF-15（可注入实测） | 四要素逐字取自 D-012 |
| OI-016 | deferred | `## 收敛检查`「未决项处置」（移交 build-spec / build-plan）+ OI 来源「card-07 设计中」 | 接口对齐未成文 |
| OI-017 | confirmed | D-006 + D-018（范围扩大并登记为对母 PRD 的偏离） | 范围边界与偏离登记均取自原文 |
| OI-018 | confirmed | D-008（不改 config 结构与键）+ RF-07（定向禁令范围与状态） | 禁令是否仍生效 = RF-07 结论（未被取代、未过期） |
| OI-019 | confirmed | D-002（packet）+ RF-04（选取权在 OCR 侧）+ RF-10 / RF-12 | 错配处置取自 D-002；偏差取自 RF-04 |
| OI-020 | deferred | RF-06（范围权威界定）+ D-006 + D-018 风险（须逐项协调） | 逐项协调未成文 |
| OI-021 | confirmed | D-010（全新上下文 + 必须能读仓库）+ 取证 s1/s3/s4 反例 | 质证结论 = D-010 原文 |
| OI-022 | deferred | D-007 风险（须在 build-plan 明确实现载体） | 实现载体未成文（材料明写为 OI-022） |
| OI-023 | deferred | D-010 风险（新执行者身份 / 隔离边界 / 事实写入位置须在 build-plan 明确） | 隔离边界未成文（材料明写为 OI-023） |
| OI-024 | confirmed | RF-14（用户裁定各跑一次、作对照臂语料）+ RF-16（step 6）+ RF-19（step 10） | 两次运行事实均入库；「能否作为语料」已有答案 |
| OI-025 | confirmed | D-013（取消一切 fail-closed 上限）+ T-012 | 上一轮已闭合。**2026-09-22 独立替代审查后更正**：原验收判据（「审查派发路径不含任何字节闸门」）在基线 `642d4fb2` 上**恒真、不可能为假**（该本地字节上限**在基线 `642d4fb2` 上已不存在**；**校正（gap B-7）：原表述为「已由过渡基线删除」——「过渡基线」是 SD-16 的术语，指本规划任务期间未提交的 `runtime/review/*`、`skills/wh-review/*` 修复代码，**不是**被删的体积上限常量；此处属术语误用，已按事实改写。**），已改为「常量不回归 + 大材料真派发」的可判真假判据；`selected_disposition`/`counterexample_boundary` 同步加校正注。**D-013 的决策本身未改**。 |
| OI-026 | deferred | RF-17 处置表 #1（处置 fix：新增映射表）+ RF-11 + `## 收敛检查`「未决项处置」 | 映射表本体未成文 |
| OI-027 | **confirmed**（2026-09-22 由 `deferred` 改判，依 **D-028**） | D-005（any-of-N 方向已定）+ **D-028**（全局判据 + 显式接受语义降级 + 本条升为必需前置）+ `## Grill 结束记录` failure_semantics（残留项） | 三项语义的契约本体仍属 build-plan 交付物（材料原文「缺可执行契约」）；`confirmed` = **要求已定 + 有可判真假验收（单源 findings 一律带 `independence: partial` 标注）**，**不是契约已落盘** |
| OI-028 | deferred | `## 收敛检查`「未决项处置」（D-106 执行约束登记）+ D-021 不修项表（验证归 CARD-09） | 登记形式本体未成文 |
| OI-029 | confirmed | D-016（丢弃提升为质量事实）+ G-CK（委托模式下该 **OCR 路径**的内容级丢弃不适用、文件级由 `excluded_files` 记账）+ **D-027**（scope 扩到宿主子代理上下文边界 + 新增记账面，归属 D-017 修复层） | 处置与两个边界的适用范围取自原文；**验收已按 D-027 改写为可判真假形式**（原判据只覆盖 OCR 侧文件级排除，对新闸门恒为通过） |
| OI-030 | deferred | D-011 / D-012 / D-014 / D-022（判据与语料已定）+ `## 收敛检查`「未决项处置」 | 三项判定维度本体未成文。**2026-09-22 独立替代审查（H6/CF-4）**：该缺口的直接后果是 D-014 的第二个析取支不可判真假（任何零发现可用「本材料确无问题」逃逸）；是否把该支改为可判真假（例如固定材料 + 已知缺陷清单）或删除该支，需用户裁决 → **CF-4**。本 OI 保持 `deferred`，未为凑闭合而改写。**（D-026 更新（2026-09-22 用户裁决）：用户已裁决「删掉该分支」——D-014 第二析取支已删除，CF-4 **RESOLVED by D-026**；本 OI 仍保持 `deferred` 未改，D-026 也未代写三项判定维度。）** |
| OI-031 | confirmed | AC-58（通过条件）+ D-017 修复面「派发语义 / 启动自检」+ `## 收敛检查` acceptance 行失败条件 + RF-19 实测 | **判断性映射**：由要求侧的 AC-58 与修复侧的 D-017 合并推定；缺陷现存（RF-19），不得读作已修复 |
| OI-032 | deferred | card-02 入向义务（`OPEN-002` / `RISK-003` / `T-075`）+ D-013 / OI-025（本地字节上限半边）+ D-030（① 核验归本卡） | owner / trigger / 关闭条件逐条取自 card-02 原文；本卡能关与不能关的部分在「card-02 入向义务承接登记」节分列 |
| OI-033 | deferred | FR-53 / AC-54 六要素补缺 + RF-05 / RF-10 / RF-15 / RF-16 / RF-19 / RF-18 的已取证状态 + card-02 OPEN-002 | 完备枚举属适配合同冻结交付物；本次给出 11 项已取证状态种子（非完备集合），未代枚举 |

### 3′ 未能诚实填写的解析器字段

- 解析器要求的终局字段**没有留空项**：**33 条**记录中 **20 条 `confirmed`**（`impact_dimensions` / `selected_disposition` / `evidence` / `acceptance` / `counterexample_boundary` + `requires_user_decision` / `batch_id`）、**13 条 `deferred`**（`owner` / `trigger_condition` / `scope_boundary` / `impact` / `follow_up_acceptance` + `requires_user_decision` / `batch_id`）全部填写。**（校正：原表述为「31 条记录中 20 条 `confirmed` …、11 条 `deferred` …」——为本次 gap 修复前的计数；新增 OI-032 / OI-033 后为 33 条，OI-027 改判后 `deferred` 为 13 条。）**
- **（F-03 更正（2026-09-22 晚））**：上一条里的 `33 条` / `20 条 confirmed` / `13 条 deferred` 为**历史层**；实测为 **35 条 = 21 `confirmed` / 14 `deferred`**（`grep -cE "oi_id(:)"` = 35；`grep "^status:" | sort | uniq -c` = 21 + 14）。权威计数见 `### 1′`。上一条原文逐字保留。
- 但下列取值**不是材料逐字给出的一段话**，而是按下面的规则从材料拼接得出；逐条取材方式已登记在 `### 2′` 最后一列，**不得当作材料原文引用**：
  1. `deferred.owner`：材料只写「移交 build-spec / build-plan，各自带负责人与完成条件」（`## 收敛检查`「未决项处置」），以及两处「须在 build-plan 明确」（D-007 风险 / D-010 风险），**没有逐条点名负责人**；本轮以这两处原文所指的阶段作为 owner。
  2. `deferred.trigger_condition` / `scope_boundary` / `impact` / `follow_up_acceptance`：以该 OI **自身问题原文** + 相关决定的原文（D-005 / D-006 / D-007 / D-010 / D-011 / D-014 / D-017 / D-018 / D-021 / D-022 / RF-06 / RF-11 / RF-17）拼成。完成条件写成「该问题被回答成文」的形式，**不含任何新增数值、日期、负责人姓名或验收阈值**。
  3. `batch_id` 取值约定：`confirmed` 用真实用户批次标签（T-xxx / G-x 与对应决定 id）；材料只承诺「各自带负责人与完成条件」而没有对应用户批次的 `deferred` 项，用材料自身标签「移交批次（`## 收敛检查`「未决项处置」原文）」。**没有新增用户批次、没有新增对话轮次。**
  4. `requires_user_decision` 的读法：本轮统一记为该 OI 的终局处置**由用户决策批次作出、或按材料移交规则交由后续阶段**；`goal` / `scope` / `acceptance` 三类核心影响一律为 `true`（解析器硬要求），其余按实际来源登记，未据此外推任何新决定。
  5. `counterexample_boundary`：只写材料真有的边界（决定的「风险 / 失效条件 / 后果」、AC 的失败条件、`## 收敛检查` acceptance 行的通过 / 失败条件、实测证据限制）。材料没有边界条件的 OI 不写 `confirmed`，一律走 `deferred`——因此不存在为凑字段而编造的反例。
  6. OI-031 的 `confirmed` 依据 = AC-58（通过条件）+ D-017 修复面「派发语义 / 启动自检」+ `## 收敛检查` acceptance 行失败条件；**这不是「缺陷已修」的声明**——RF-19 实测该失败条件当前仍成立，且机制的物理移除仍归 CARD-06。
  7. P14（**本条为「已获用户显式追加」的记录，不是待办**）：新增行原**超出 D-021 的「P1–P13 闭环清单」**；按 D-021 原文「超出即须用户显式追加」，**用户已于 2026-09-22 显式批准把 P14 追加进闭环清单（闭环清单由此为 P1–P14）**，并批准 OI-031 的终局状态 `confirmed`。**（校正：原表述为「P14 尚待用户显式追加确认」——该表述已被用户裁决取代；追加事实由用户决定作出，材料未自行扩大范围。）** P14 的缺陷现存事实（RF-19：`REVIEW_HISTORY_UNAVAILABLE` 零派发）不因此改变，不得读作已修复。

  8. P15 / P16 / P17 / P18（**2026-09-22 晚追加；本条同样不是待办，而是「已并入闭环清单」的记录**）：四条均为**审查层**缺陷，来源为 **RF-20**（OCR 委托模式端到端实验，两臂对照），其中 **P15 / P16 已由主会话亲验**、**P17 / P18 为子代理报告、未亲验**（逐条证据强度见 P 清单表末四行）。**程序状态如实登记**：D-021 原文要求「超出即须用户显式追加」，而**用户对本次追加的显式确认尚未取得**（本轮为同一任务在阶段关闭后的追加修订）；在用户重新确认之前，本节与 P 清单表**均不得**被读作「已获用户批准扩大范围」。原 P1–P14 十四条的原文与既有校正注逐字保留。

### 4′ 判断性映射（不改动语义，逐条登记）

| 项 | 处理 | 原因 / 保留方式 |
|---|---|---|
| `outline_version` | 仍记字符串 `02`（材料原文 `outline_version=2`） | 解析器 `substantiveOutlineValue` 要求该值字符串长度 > 1，纯数字 `2` 无法通过；数值语义不变，原文保留在 `### OI 记录` 说明与本节。**此 workaround 继续保留并继续披露。** |
| OI-031 的 `framework_node` / `category` 归属 | 加入 `solution` 行与 `success_failure_boundary` 行 | `analyzeDecisionOutline` 只要求每条 OI 记录被至少一个框架节点**或**一个固定类别引用——代码事实是**并集**（`runtime/stage/stage-content-contracts.mjs:3093`：`const referenced = new Set([...frameworkMap.values(), ...categoryMap.values()]…)`；`:3095` 的报错文案亦为 “or”）。故把 OI-031 追加进框架节点行**不是解析器要求**，属**无必要的判断性映射**（人读面无害）。归属取自 OI-031 自身内容（派发行为契约 = 方案面；阻断 / 零派发边界 = 成功失败边界），未新增事实。**（校正（gap B-8 第 7 条）：原表述为「`analyzeDecisionOutline` 要求每条 OI 记录被至少一个框架节点**与**一个固定类别引用」——该「与」与代码事实（OR）相反。本条同样适用于 OI-032 / OI-033：把二者追加进框架节点行亦非解析器要求。）** |
| 人读表「状态 / 终局处置」列 | 保留 `open` / `待定` 原文，另立 `### 2′` 与 YAML 记录承载终局处置 | 不删改既有内容；两处并存已在上方 `### 1′` 披露。 |
| `### 2′` / `### 3′` 的新增内容 | 新增，不改写 `### 1.` / `### 2.` / `### 3.` | 前一版披露逐字保留为历史，避免覆盖来源。 |
| `## 收敛检查` acceptance 行失败条件 | 追加一句「对比实验必须冻结同一份材料」 | RF-19 证据限制 ③：step 6 与 step 10 跑了不同材料（580 行 → 934 行），不构成有效对照；该追加不改变原失败条件的语义与解析器所需标签。 |
| RF-19 与 P14 | 按用户提供的逐字事实记录插入；P14 追加到原 P1–P13 表末（**闭环清单现记为 P1–P14**） | 未改动既有 RF / P 行；P14 原属超清单事项，**已由用户于 2026-09-22 显式批准追加**，留痕见 `### 3′` 第 7 条。 |
| RF-20 与 P15–P18 | 2026-09-22 晚插入 RF-20 与 P 清单表末四行（P15–P18）（**闭环清单现记为 P1–P18**） | 未改动既有 RF / P 行；P15–P18 原属超 P1–P14 清单事项，**用户对该次追加的显式确认尚未取得**（程序状态见 `### 3′` 第 8 条与本文件末 D 小节）。 |
> **（更正（2026-09-22 晚）：本行末句「用户对该次追加的显式确认尚未取得」已被推翻——**用户已就「闭环清单扩容」作出显式追加裁决**（选中「① 确认追加 P15–P18 与 OI-034/035」），见本文件 `### D. 阶段关闭后的追加（2026-09-22 晚）`；且本轮又追加 P19 / P20 / P21（见 **D-037**），**闭环清单现为 P1–P22**（**本句原文为「闭环清单现为 P1–P21」，逐字保留**——P22 由用户 2026-09-22 显式裁决追加，见 **D-040**）。本行原文逐字保留。）**

### 5′ 解析器强制偏离索引（F-14，2026-09-22 晚新增）

> **用途**：把本材料对解析器的**强制偏离**集中登记（字段 / 原因 / 影响的读者面），避免逐处散落。这些偏离均为**有意**且**不应被"修正"**，否则会改坏材料语义。

| 字段 / 位置 | 偏离内容 | 原因 | 影响的读者面 |
|---|---|---|---|
| `outline_version` | 记为**字符串** `'02'`（材料原文为 `outline_version=2`） | 解析器 `runtime/stage/stage-content-contracts.mjs` 的 `substantiveOutlineValue` 要求**字符串且长度 > 1**；写数字 `2` 会被判为「无实质大纲」。原文登记见 `:110` | 决策大纲解析器；人读时读作版本 2 |
| OI-031 的 `framework_node` / `category` | **判断性映射**（不是材料原文给定的字段，由本轮修复按该 OI 自身内容归属） | `analyzeDecisionOutline` 要求每条 OI 记录被至少一个框架节点与一个固定类别引用（代码事实 `runtime/stage/stage-content-contracts.mjs:3093`：`const referenced = new Set([...frameworkMap.values(), ...categoryMap.values()]…)`；`:3095` 的报错文案用的是 “or”）。归属取自 OI-031 自身内容（派发行为契约 = 方案面；阻断 / 零派发边界 = 成功失败边界），**未新增事实**。见 `### 4′` | 决策大纲解析器；构建 OI → 审查面映射表的人 |
| 人读台账「状态」列 | 保留 `open` / `待定` **原文**，不归一化为解析器取值 | 台账是**人读**记录（材料原文逐字保存在 `ledger_status_note`），解析器权威记录在 `### OI 记录` 的 YAML 内；改台账会丢失材料原文 | 人读；不影响解析器 |
| OI 终局字段的**取值用词**（deferred 五字段 `owner`/`trigger`/`scope`/`impact`/`follow_up_acceptance`，及 confirmed / not_applicable 的同类终局字段） | 取值内**不得出现** `未回答` / `待确认` / `待定` / `tbd` / `todo` / `未知` / `unknown` / `缺失` 任一词；本轮把 OI-026 的「待定项」改为「**未决项**」（语义不变，材料正文保留「待定」） | 解析器 `substantiveConvergenceText`（`runtime/stage/stage-content-contracts.mjs:3209-3214`）对取值做**无锚点子串黑名单**：`!/(?:未回答\|待确认\|待定\|\btbd\b\|\btodo\b\|未知\|\bunknown\b\|缺失)/i.test(text)`。任一命中即判该字段 `missing`（经 `:2981-2988` → `:2976-2979`，由 `:3126` 的 deferred 五字段校验调用），`analyzeDecisionOutline` 随即报 `OI <id> deferred <field> is missing` | 决策大纲解析器；**任何人后续往 OI 权威 YAML 追加文字前必须避开这组词** |

> **记录纪律陷阱（非解析器偏离，但同属"记录层"约束；2026-09-22 晚实测登记）**
>
> 本轮修复过程中实测到三条**由「如实记录」这一行为本身触发**的陷阱。它们与本材料的主题同族（机制把诚实记录判成失败），故一并登记，供 build-spec / build-plan / build-code 阶段规避：
>
> | 陷阱 | 实测事实 | 规避方式 |
> |---|---|---|
> | **验收命令自污染** | 把验收命令（`grep -c` + `oi_id` + 冒号）**字面**写进材料后，**同一条命令返回 38**——多出的 3 处命中是说明文字自身。即「把实测命令写进材料」这一诚实做法会让该条验收变红。 | 验收命令改用 `grep -cE 'oi_id(:)'`（冒号放进字符组），并避免在材料正文出现与命令模式**同形**的字面串。**任何写进材料的 grep 模式都须先做自污染检查**（写入前后各跑一次，计数必须一致）。 |
> | **哈希自指悖论** | 材料若声明「本材料当前 sha256 = …」，该句落盘即令此值失效。实测：同一文件在两轮修复之间，sha256 由 `a76e4193…`（修复前）变为 `6f304e9f…`（修复批次产出），本行落盘后又变为第三个值。任何自述哈希的文档都在写下那一刻自我证伪。 | 已改为：**材料不记录自身当前哈希**；待确认修订的哈希由复核者**在冻结后当场重算**。上文括注的两个值仅作「哈希会变」的实证，**都不是当前值**；`## 状态` 的授权状态条与处置表 F-01 行已补此说明。 |
> | **语义黑名单惩罚诚实标注** | 见上表末行：材料如实写「待定」，解析器判该字段缺失。这与 `docs/adr/0032-review-chain-delegation-and-layer-contract.md` 所记同族病症（机制把如实记录判成失败）一致。 | 用语义等价的非黑名单词（如「未决项」）；**不得**为过校验而删掉「此处尚未确定」这一事实本身。 |


### 1. 唯一未通过项：`no_open_items`（`analyzeDecisionOutline.ok = false`，`errors = []`）

- 30 条 OI 记录中 **29 条保持 `status: open`，仅 OI-025 为 `confirmed`**，因此 `no_open_items` 与 `outline_closed` 仍为 `missing`。
- 依据（材料自身事实，未改写一字）：
  - `## OI 大纲（当前版本 `outline_version=2`，draft）` 自述为 step 1–2 初稿；
  - `## OI 台账`「状态」列对 OI-001..OI-020 逐行写 `open`；
  - `## 已选方向` 末「**未决项（须在 build-plan 前闭合）**」明列 OI-004/OI-015/OI-022/OI-023/OI-025/OI-010/OI-012/OI-014/OI-016；
  - `## 收敛检查` solution 行「未决项处置」明列 OI-026/OI-027/OI-028/OI-029/OI-030/OI-010/OI-012/OI-014/OI-016/OI-022/OI-023「**全部不改变方向，移交 build-spec / build-plan**」。
- 若要 `no_open_items` 通过，必须由用户在 Talk / 人门中真实闭合这些 OI（或材料补入真实终局依据）；仅靠格式化标注会与上述四处原文直接冲突，故不做。

### 2. 逐条不可填字段

| OI | 未填写的解析器字段 | 无事实依据的原因 |
|---|---|---|
| OI-001..OI-024、OI-026..OI-030（29 条，除 OI-025） | `impact_dimensions`、`requires_user_decision`、`visible_group_id`/`batch_id`，以及随状态要求的 `selected_disposition`/`evidence`/`acceptance`/`counterexample`（confirmed）、`owner`/`trigger`/`scope`/`impact`/`follow_up_acceptance`（deferred）、`reason`/`counterexample_boundary`（not_applicable） | 材料对这批 OI 的「状态」列逐行写 `open`，且其中 11 条被「未决项」清单明列为移交项。终局字段只在 OI 真实闭合后才存在：材料未为任何 OI 指派 `owner`，也没有任何 OI 被声明为 `not_applicable`，`counterexample` 亦无从谈起。故按「留空 + 保持 open」处理。 |
| 上述全部 29 条 | `deferred.owner` 与 `deferred.follow_up_acceptance` 的具体值 | 材料只有「各自带负责人与完成条件」的承诺（`## 收敛检查`），没有任何具体负责人、触发条件或后续验收值；填写即属编造。 |
| OI-025 之外无 | — | OI-025 的 `selected_disposition`/`evidence`/`acceptance`/`counterexample_boundary`/`impact_dimensions`/`requires_user_decision`/`batch_id` 全部有材料依据（D-013、T-012、取证 s3、RF-09、RF-16、G-CK），已填。 |

### 3. 判断性映射（不改动语义，逐条登记）

| 项 | 处理 | 原因 / 保留方式 |
|---|---|---|
| `outline_version` | 记为字符串 `02`（材料原文 `outline_version=2`） | `analyzeDecisionOutline` 的 `substantiveOutlineValue` 要求该值字符串长度 > 1，纯数字 `2` 无法通过；数值语义不变，原文保留在本行与 OI 记录说明中。 |
| 各 OI 的 `category` | 材料「类别」列对 19 条 OI 用的是**框架节点**词表（background/problem/goal/solution/acceptance/extension）或 `接口对齐依赖`，不是解析器要求的六类固定类别 | 逐条按内容映射为六类之一；材料原文逐条保留在 `category_note` 字段。映射清单见本表下方。 |
| OI-020 的类别 | `non_goals` → `deferred` | 依据材料自身：方向审查 finding `F-6389631fd26c` 判定「OI-020 被误分类为 `non_goals`，实为活跃接口对齐」并处置 fixed；与同类的 OI-016（与 card-07 接口对齐）同归 `deferred`。 |
| `## 收敛检查` 行标签 | `target/scope/solution/acceptance` → `目标/范围/方案/验收` | 解析器 `convergenceDimension` 只接受这四种拼写；原行标签与三列原表已在同节原文保留。 |
| `## 收敛检查` 表列数 | 3 列 → 4 列（增「可执行验收（acceptance）」列） | 解析器要求 dimension / user answer / material reference / executable acceptance 四列。原三列表逐字保留于同节末。 |
| OI-003、OI-026 的 `question` | 把 `unknown` / `缺失` 那句拆到 `context` 字段，`question` 只留问句本体 | `substantiveOutlineValue` 会拒绝含 `unknown`/`缺失` 的值，导致该 OI 记录被判「question is missing」；不改写原句，只拆分字段。 |
| `UI applicability` JSON | 增补 `sources`（三个来源事实各带 `result: non_ui`），原有 `result` 与三个扁平键逐字保留 | `validateUiApplicability` 要求保留三个来源事实；本次为纯格式补齐，事实文本未改。 |
| `## 需求矩阵：原始需求 → 决定（覆盖矩阵）` | 新增结构化表（48 行） | 表内「母 PRD R-xxx / OI-xxx」行取自母 PRD「需求覆盖结论」节逐条追踪表（`prd.md` L139–179）的 owner card 列；「声明 N」「D-10x」行逐字取自本文件「需求变更记录」节；不含新材料。 |

**各 OI 类别映射清单（材料原文 → 六类固定类别）**

| OI | 材料「类别」列原文 | 映射 |
|---|---|---|
| OI-001 | background/problem | success_failure_boundary |
| OI-002 | background/problem | data_state |
| OI-003 | goal/solution | complete_user_flow |
| OI-004 | solution | success_failure_boundary |
| OI-005 | data_state | data_state（未改） |
| OI-006 | data_state | data_state（未改） |
| OI-007 | complete_user_flow | complete_user_flow（未改） |
| OI-008 | complete_user_flow | complete_user_flow（未改） |
| OI-009 | success_failure_boundary | success_failure_boundary（未改） |
| OI-010 | success_failure_boundary | success_failure_boundary（未改） |
| OI-011 | success_failure_boundary | success_failure_boundary（未改） |
| OI-012 | data_state | data_state（未改） |
| OI-013 | non_goals | non_goals（未改） |
| OI-014 | deferred | deferred（未改） |
| OI-015 | goal/extension | complete_user_flow |
| OI-016 | deferred | deferred（未改） |
| OI-017 | complete_user_flow | complete_user_flow（未改） |
| OI-018 | deferred | deferred（未改） |
| OI-019 | data_state | data_state（未改） |
| OI-020 | 接口对齐依赖 | deferred（见上表 OI-020 行） |
| OI-021 | success_failure_boundary | success_failure_boundary（未改） |
| OI-022 | complete_user_flow | complete_user_flow（未改） |
| OI-023 | success_failure_boundary | success_failure_boundary（未改） |
| OI-024 | data_state | data_state（未改） |
| OI-025 | success_failure_boundary | success_failure_boundary（未改） |
| OI-026 | complete_user_flow | complete_user_flow（未改） |
| OI-027 | success_failure_boundary | success_failure_boundary（未改） |
| OI-028 | complete_user_flow | complete_user_flow（未改） |
| OI-029 | success_failure_boundary | success_failure_boundary（未改） |
| OI-030 | success_failure_boundary | success_failure_boundary（未改） |
| OI-031 | （材料无此前置记录，RF-19 派生） | success_failure_boundary（见上表 OI-031 行） |
| OI-032 | （材料此前无此记录，card-02 入向义务承接） | success_failure_boundary |
| OI-033 | （材料此前无此记录，FR-53 / AC-54 六要素补缺） | data_state |

**框架节点表新增引用（OI-021..OI-030 属哪一节点）**：solution 行新增 OI-021/OI-022/OI-023/OI-025/OI-026/OI-027/OI-029（实现载体、隔离边界、映射表、聚合契约、丢弃记账均为方案面）；acceptance 行新增 OI-024/OI-030（本卡自身审查路径与实验判定维度属验收面）；extension 行新增 OI-028（D-106 执行约束的登记形式）。以上均取自各 OI 自身记录的问题/来源，未新增事实。

**OI-031 的框架节点 / 类别归属（RF-19 派生）**：solution 行新增 OI-031（审查历史绑定阻断派发的行为契约属方案面）、success_failure_boundary 行新增 OI-031（「派发前零派发」属成功失败边界）；均取自 OI-031 自身问题与来源，未新增事实。


---

## 独立替代审查发现的未决冲突（须用户裁决）

> **来源**：2026-09-22 独立替代审查（SD-08 fallback；审查者未参与本材料任何部分的撰写、调研或实现），报告 `/tmp/wh-card05-forensics/substitute-detail-review.md`（**F-07 证据落盘（2026-09-22 晚）**：该 `/tmp` 原件已落盘为稳定副本 `specs/workflowhub-thin-core-card-05-20260919/research/SD08-independent-alternative-review.md`，**41,069 B / 255 行，sha256 `a4d82c967a672b8378d15c28e6a8d29a47e28d1bd07b5c063dc2e17295f964af`**（与材料记载的 41,069 B / 255 行一致；`cmp` 与 `/tmp` 原件逐字节相同）。原「原件不在任务证据树内 / 只在 `/tmp`」为该时点的事实，逐字保留；**其任务证据树缺口本身（下方第 8 条）仍未修复**，本次只补齐 `research/` 侧的稳定副本。），共 18 条 finding（high 7 / medium 10 / low 1）。
> **性质**：本节登记**本修复不得自行裁决**的事项。凡修复需要改动既有决定、范围或契约的，一律在此登记等用户裁决；材料本体不预先选定任何一支。
> **与 OI 台账的关系（重要）**：本节冲突**不**呈现为 `### OI 记录` 中的 `open` OI。因此 `analyzeDecisionOutline` 的 `no_open_items = passed` **不代表本材料已无未决事项**；本节是独立于 OI 台账的未决清单，须与 OI 台账、`## 未能满足的解析器字段（如实披露）` 一并阅读。
> **编号**：CF-1–CF-5 为用户点名的五项（其中 CF-5 已由用户裁决，见该条）；CF-6–CF-9 是本修复在处置其余 medium/low finding 时**补充登记**的同性质冲突（理由相同：解决它们必须改决定，本修复无权自行改）。
> **2026-09-22 用户裁决后的状态（最终更新）**：**CF-1 → RESOLVED by D-024**；**CF-2 → RESOLVED by D-023**；**CF-3 → RESOLVED by D-025**；**CF-4 → RESOLVED by D-026**；**CF-5 已由用户裁决**（记录）；**CF-6 → RESOLVED by D-027**；**CF-7 → RESOLVED by D-028**；**CF-8 → RESOLVED by D-029**；**CF-9 → RESOLVED by D-030**（四条决定见 `## 决策（续，2026-09-22 用户裁决：CF-6 / CF-7 / CF-8 / CF-9）`）。
> **本节九条冲突至此全部裁决完毕**；`## 未能满足的解析器字段（如实披露）` 的 `### 1′`「0 条 open ≠ 材料已无未决事项」这一告警所指向的 CF 未决清单**已清空**（其告警本身仍成立：`no_open_items = passed` 只说明 OI 台账无 open 项）。**（更新记录：原表述为「**CF-6 / CF-7 / CF-8 / CF-9 仍未决**（逐条进度见各条内的「状态」行）」，逐字保留于本注。）**

### CF-1（H1，high）：「超时与取消」修复面与仍生效的 ADR 正面冲突

| 字段 | 内容 |
|---|---|
| **状态（2026-09-22 用户裁决）** | **RESOLVED by D-024** —— 用户选定 (a)「承担」，逐字「承担 ADR，正式接管」：本卡正式接管「超时与取消」修复面并承担 ADR-0031 `:92` 所要求的 ADR 覆盖（见 **D-024**）。**注意**：D-024 的 TODO 要求把该承担写入 `docs/adr/0032`（或新 ADR），**在该承担落盘前，本冲突的 ADR 侧仍未闭合**。 |
| 冲突 | D-017 把「**超时与取消**」列为五大修复面之一，P5 把「**超时不取消 broker**」定为缺陷；但仓内既有 ADR 已就**同一对象**作出**相反且仍然生效**的裁定。 |
| 证据（`docs/adr/0031-review-check-downgrade-and-identity-boundary.md`） | `:70`「**20 分钟墙钟等待维持不变**；只登记「源码注释与归档记录不一致」这一事实。」 · `:71-73`「**`cancelManaged` 接通**：把 6 处「绝不取消」守卫…改为「**仅在源漂移事实下调用**」，并**新增**一条禁止因墙钟计时而调用的断言。」 · `:92`（被否决的替代方案）「**缩短或删除 20 分钟墙钟等待**：与 D-030③ 冲突，**缺 ADR 承担**。」 |
| 证据（材料侧） | D-017 修复面含「超时与取消」；P5 原文见 `## 7 个文档审查面的问题清单`。材料与 `docs/adr/0032-review-chain-delegation-and-layer-contract.md` **均未提及** ADR-0031；`grep -rn "D-030"` 在本材料与 ADR-0032 中**零命中**。（**F-04 更正（2026-09-22 晚，实测）：该断言的前半为假**——`grep -c 'D-030' specs/workflowhub-thin-core-card-05-20260919/decision-log.md` = **37 行命中**（用 `grep -o` 统计得 **43 处**），故**本材料 37 处命中 `D-030`**；`docs/adr/0032-review-chain-delegation-and-layer-contract.md` 中 `D-030` 命中 = **0**（该半句为真）。原句「材料**与** ADR-0032 均未提及 ADR-0031」的**材料半句亦为假**（本材料 `ADR-0031` 命中 = **22 处**，含本轮修复新加的 CF-3 / D-025 校正注）；「**ADR-0032 未提及 ADR-0031**」这半句为真（命中 = 0），**保留**。原「零命中」措辞逐字保留于本注。）**。 |
| 影响的决定 | D-017（修复面）、P5、`docs/adr/0032`「决定 3」 |
| **需用户裁决（二选一，本修复不选）** | **(a) 承担**：由本卡产出一份 ADR 承担这次反转（即 ADR-0031 `:92` 明确要求的那种「承担 ADR」），把「超时与取消」写进该 ADR 并与 ADR-0031 的 14/15 条对照；**(b) 缩减范围（descope）**：把「超时与取消」从 D-017 修复面中**移出**，只保留 ADR-0031 已裁定的「仅在源漂移事实下取消」语义，P5 降级为事实登记、不作为本卡修复项。 |
| 本修复已做 / 未做 | 已做：只更正 P5 的量化事实（见 finding M7 处置）。未做：**未**改动 D-017 修复面、**未**产出承担 ADR、**未**把 P5 降级。 |

### CF-2（H3，high）：D-006 的面集内部不一致——「被替换的 3 个面」≠「3 个 diff 面」

| 字段 | 内容 |
|---|---|
| **状态（2026-09-22 用户裁决）** | **RESOLVED by D-023** —— 用户给的是指令（不是选项），逐字「修改Intergration，让这个审查也变成真的diff审查」：`build-code/integration` 的送审合同**改为真实 diff 审查**，三个被替换面即成为**3 个真实 diff 面**（见 **D-023**）。旧的 `stage-materials.json` 矩阵属过渡机械（删除归 CARD-06）；**旧矩阵何时编辑**作为实现问题留给 build-plan（D-023 未决项）。 |
| 冲突 | D-006 / D-018 / `## 已选方向` 把 ②`build-code/phase`、③`build-code/integration`、④`verify-code` 称为「3 个代码审查面」并用 OCR 委托替换；但材料自有的 RF-11 与代码事实表明 `build-code/integration` **不是 diff 面**，且其送审合同**禁止**把 diff 投给审查者。**D-006 如写内部不一致。** |
| 证据（材料） | `## 已选方向`「**替换面（3 个代码审查点）**：`build-code/phase`（每 phase 一次）、`build-code/integration`（全 phase 结束一次）、`verify-code` 终末代码审查」；RF-11「只有 **3 个是代码 diff**（`build-code/phase`、`verify-code`、`mini_task/implementation`，`source_bundle:"diff"`）；其余 **7 个**（…`build-code/integration`…）都是 `source_bundle:"none"` 的**文档 / JSON 审查**」；`## 已选方向` 修复面枚举「7 个文档审查面（… **build-code/integration 之外** …）」**只列 6 项**。 |
| 证据（代码事实 `runtime/review/stage-materials.json`） | `stages.build-code.profiles.phase`：`source_bundle = "diff"`、`forbidden = []`；`stages.build-code.profiles.integration`：`source_bundle = "none"`、`forbidden = ["changes_diff","cumulative_diff","phase_diff","raw_log","integration_map"]`；`stages.verify-code`：`source_bundle = "diff"`、`forbidden = ["acceptance_criteria","acceptance_evidence","evidence_map","final_test_summary","quality_verify","requirement_replay"]`；`mini_task.implementation`：`source_bundle = "diff"`、`forbidden = []`。即「3 个 diff 面」与「3 个被替换面」**不是同一集合**。OCR 委托模式的文件选择来自 `git diff`（RF-04），与该面合同（禁止 diff）**直接冲突**，材料未登记该冲突，也未说明该面按什么 ref 取 diff。 |
| 影响的决定 | D-006（改造范围）、D-018、`## 已选方向` 替换面、RF-11、OI-026（映射表输入） |
| **需用户裁决（本修复不选）** | **(a)** 只替换两个**真正**的 diff 面（`build-code/phase`、`verify-code`），并给 `build-code/integration` 一条**非 diff 路径**（例如它保留文档审查路径，不投 diff）；**(b)** 保留三个面，但把 `build-code/integration` 登记为 **packet 输入**（不是裸 diff），使其送审合同（禁止 diff）被尊重；**(c)** 其它。 |
| 本修复已做 / 未做 | 已做：在 D-006、D-018、`## 已选方向` 替换面与修复面、P1/P4/P5/P6/P13 相关处**加校正注并登记本冲突**（两处面集枚举本身按原文保留未改，避免替用户在 (a)/(b)/(c) 中选边）。未做：**未**改动被替换面集、**未**改动「7 个文档审查面」的枚举、**未**为 `build-code/integration` 选定输入形态、**未**改动 OI-026 的完成条件。 |

### CF-3（H7，high）：修复面跨越第二个仓库，无跨仓交付登记

| 字段 | 内容 |
|---|---|
| **状态（2026-09-22 用户裁决）** | **RESOLVED by D-025** —— 用户逐字选定「本卡承担跨仓修复并登记」：本卡拥有跨仓修复，并按 D-030⑤ + `ADR-0031:85`（= `docs/adr/0031-review-check-downgrade-and-identity-boundary.md:85`，F-09 全路径规范化） 登记接收方 / 接口契约 / 验收判据（见 **D-025**）。跨仓改动**尚未实施**（本修复未在 `3rd-review` 做任何改动）。 |
| 冲突 | D-017 的修复面（派发 / 聚合 / 超时与取消 / 启动自检 / 成本计量）有一部分实现于**第二个仓库** `/Users/Hugh/Hugh/Project/3rd-review`；但材料把工作面限定为本仓，全卡**没有任何跨仓交付登记**（接收方 / 接口契约 / 验收判据）与跨仓授权声明。 |
| 证据 | `~/.config/workflowhub/config.json:3-10`：`third_review.command = ["node","/Users/Hugh/Hugh/Project/3rd-review/scripts/3rd-review.mjs"]`、`config = "/Users/Hugh/.config/3rd-review/config.json"`；材料 P10/RF-16/DSP-02 引用的 `broker.mjs:577` 实为 `/Users/Hugh/Hugh/Project/3rd-review/lib/broker.mjs:577`（逐字 `if (!input.review_flow) return;`），**本仓无此文件**；取消 / 孤儿治理 / 健康裁决在 `/Users/Hugh/Hugh/Project/3rd-review/lib/broker.mjs:664,702,725` 调用 `cleanup(config.runtime.root, config.runtime.ttl_hours)`，由 `lib/runtime.mjs:96,135,155` 实现（`orphan_timeout_ms` 默认 30000）。规则依据：`specs/archive/workflowhub-mechanism-simplification-t2-20260911/decision-log.md:332`「**D-030⑤：跨仓交付项必须登记接收方、接口契约与验收判据**」；`docs/adr/0031-review-check-downgrade-and-identity-boundary.md:85`「跨仓 `3rd-review` 的 commit/push 授权属 OI-22 / step 11，**不由本 ADR 授予**。」 |
| 影响的决定 | D-017（修复面与写面）、`## UI applicability` 的工作面枚举、D-018 风险（写面重叠清单只列了 card-02 / CARD-06 / CARD-09） |
| **需用户裁决** | 本卡是否**拥有跨仓改动**：若拥有，须按 D-030⑤ 登记接收方（`3rd-review`）/ 接口契约 / 验收判据，并取得 ADR-0031 `:85` 所指的 commit/push 授权路径；若不拥有，须把跨仓部分（取消、孤儿治理、健康裁决）**移出本卡修复面**并登记归属卡。 |
| 本修复已做 / 未做 | 已做：在 `## UI applicability` 工作面段、D-017、P10、RF-16、DSP-02 加校正注，指明第二仓库与 `broker.mjs:577` 的真实位置，并登记本冲突。未做：**未**在 `3rd-review` 做任何改动、**未**登记跨仓交付项、**未**取得任何跨仓授权。 |

### CF-4（H6，high）：D-014 的非相对必要条件含不可判真假的分支，其 oracle（OI-030）仍 `deferred`

| 字段 | 内容 |
|---|---|
| **状态（2026-09-22 用户裁决）** | **RESOLVED by D-026** —— 用户选定 (b)，逐字「删掉该分支」：D-014 的第二析取支（「**或有**一份明确、可复核的「本材料确无问题」结论」）**已删除**，必要条件收窄为「OCR 臂必须至少产出 1 条 actionable finding」；**两臂都零发现 ⇒ 判 no-go（保留 fallback）**（见 **D-026**）。OI-030 的 `status` **仍为 `deferred`**（D-026 未改它，也未代写三项判定维度）。 |
| 冲突 | D-014 的目的是堵住 D-011 的判别力漏洞（「两臂都差仍判 go」），但它的第二个析取支「**或**有一份明确、可复核的『本材料确无问题』结论」**没有判定 oracle**：判定维度（怎么算「真问题」、「确无问题」由谁认、样本量多少才有判别力）被整体 deferred。任何零发现结果都可以用该支逃逸，**D-014 因此不可判真假**，与 AC-55「阈值在实验前写死并对照得出 go/no-go」冲突。 |
| 证据 | D-014 decision 原文；OI-030 `trigger_condition: '实验设计冻结前（D-014：判别力补充条件「须在实验设计阶段与用户确认后冻结」…）'` 而 OI-030 本身 `status: 'deferred'`、其 `follow_up_acceptance` 为「三项判定维度成文」（未成文）；`### 2′` 表 OI-030 行「三项判定维度本体未成文」。 |
| 影响的决定 | D-014（第二个析取支）、D-011（判别力）、OI-030（实验判定维度）、AC-55 |
| **需用户裁决（二选一，本修复不选）** | **(a) 改为可判真假**：把该支限定为「一份**固定材料 + 已知缺陷清单**上的『零发现』结论」，并要求在实验设计阶段冻结该清单（此时 OI-030 的三项维度必须成文）；**(b) 删掉该支**：OCR 臂必须至少产出 1 条 actionable finding，否则判 no-go（接受「材料确无缺陷会误判 no-go」这一已登记风险，规避=选已知含缺陷的真实任务）。 |
| 本修复已做 / 未做 | 已做：在 D-014 与 `### 2′` OI-030 行加校正注并登记本冲突。未做：**未**改 D-014 的 decision 文本、**未**把 OI-030 从 `deferred` 改成 `confirmed`、**未**代写三项判定维度。 |

### CF-5（P14 / OI-031，high）：**已由用户裁决——本条是记录，不是待裁决项**

| 字段 | 内容 |
|---|---|
| 原冲突（H5） | D-021 规定「**P1–P13 为本卡修复面的闭环清单**；超出即须用户显式追加」，而 RF-19 新增的 P14（审查历史绑定锁死后续审查，**唯一由本卡自身实测新发现且当前仍成立的缺陷**）在三处被写成「尚待用户显式追加」；与此同时 OI-031 已被判 `status: confirmed` 并声明其修复由 AC-58 + D-017 覆盖。同一事项同时处于「已确认在范围内」与「尚未获准进入闭环清单」两种状态，闭环清单的可判真假性因此被破坏。 |
| **用户裁决（2026-09-22，真实用户决定）** | 用户已**显式批准**：① 把 **P14 追加进闭环清单（闭环清单由此为 P1–P14）**；② **接受 OI-031 的终局状态为 `confirmed`**。 |
| 本修复的落地 | D-021 的 decision 由「P1–P13」改为「**P1–P14**」并加校正注；`### 3′` 第 7 条由「尚待用户显式追加」改为「**已获用户显式追加的记录**」；`### 4′`、`## 收敛检查` 范围行与原三列表、D-107 行、OI-001/OI-026/OI-031 的记录同步为 P1–P14 或加注。**保留的事实**：P14 是**由用户显式追加**进入的（非材料自行扩大）；P14 的缺陷**现存**（RF-19 `REVIEW_HISTORY_UNAVAILABLE` 零派发），OI-031 的 `confirmed` 只表示「要求已定 + 缺陷现存」，**不是「已修复」**。 |

### CF-6 – CF-9（本修复补充登记的未决冲突；解决它们同样必须改决定，故本修复不自行处置）

> 这四条不在用户点名的 CF-1–CF-5 之内，但按「凡修复需要改决定即登记为冲突」的同一规则登记，避免把 finding 静默留在原状。
> **（2026-09-22 用户裁决后的状态（最终）：CF-6 → RESOLVED by D-027；CF-7 → RESOLVED by D-028；CF-8 → RESOLVED by D-029；CF-9 → RESOLVED by D-030（见 `## 决策（续，2026-09-22 用户裁决：CF-6 / CF-7 / CF-8 / CF-9）`）。下面每条的「本修复已做 / 未做」行记录的是**裁决前**的处置，逐字保留；各条顶部的「状态」行与各 OI 记录承载裁决后的落地。）**

#### CF-6（M1，medium）：D-013 取消我方闸门后，真正的新闸门（宿主子代理上下文）无记账面、无 OI 覆盖

| 字段 | 内容 |
|---|---|
| **状态（2026-09-22 用户裁决）** | **RESOLVED by D-027** —— 用户选定「扩 OI-029 + 新增记账面」（见 **D-027**）：OI-029 的 scope 扩到**宿主子代理上下文**的截断 / 丢弃边界，并新增一个记账面（归属 D-017 修复层）。OI-029 的记录已同步扩范围并改写为可判真假的验收。 |
| 冲突 | G-CK 原断言「内容级静默丢弃…委托模式下 OCR 不读文件内容，故**不适用** —— D-016 登记的风险在委托模式下**自动消解**」。但按 D-004，委托模式下**实际读文件的是宿主子代理**（子代理用自身 LLM 审查），因此「内容被丢弃 / 被截断」的风险只是从 OCR 转移到**宿主子代理的上下文边界**，并未消解；D-010 风险自己已承认「「能读仓库」放大上下文成本」。这是**假闭合**：D-013 取消我方闸门后真正的新闸门（子代理上下文）既没有记账面，也没有被任何 OI 覆盖。 |
| 证据 | 原 G-CK 行与 OI-025 `counterexample_boundary`；D-004（委托模式下审查推理在宿主 Agent）；D-010 风险；OI-029（只覆盖 OCR 侧丢弃与文件级 `excluded_files`，不覆盖子代理上下文截断）；RF-10 全节**不含** `too_large` 事实（该事实只见于 OI-029 问题原文与 D-013 风险）。 |
| **需用户裁决** | 子代理上下文的截断 / 丢弃是否要**新增记账面**（以及它归本卡 D-017 修复面、归 OI-029 扩范围、还是归后续卡）；若不新增，须显式接受「宿主子代理侧丢弃不可见」的风险并写明归属。 |
| 本修复已做 / 未做 | 已做：把 G-CK 行与 OI-025 `counterexample_boundary` 的「自动消解」更正为「该 OCR 路径不适用 + 风险转移到子代理上下文」并留原表述；登记本冲突。未做（**裁决前**）：**未**新增记账面、**未**扩大 OI-029 范围。**（裁决后落地：**已由 D-027 处理**——OI-029 的 scope 已扩到宿主子代理上下文边界（记录内 `scope_extension_note` + 重写的 `acceptance`），记账面归属 D-017 修复层。）** |

#### CF-7（M2，medium）：any-of-N 被无差别外推到 7 个仍走旧 provider 链路的文档面

| 字段 | 内容 |
|---|---|
| **状态（2026-09-22 用户裁决）** | **RESOLVED by D-028** —— 用户选定「扩为全局判据，接受语义降级」（见 **D-028**）：any-of-N 即全局审查通过判据（含 7 个旧 provider 文档面），用户显式接受「多源一致性降为单源即可通过」；随之 **OI-027 升为必需前置**（`deferred` → `confirmed`）。 |
| 冲突 | any-of-N 的用户指令原话限定在「**ocr 的委托模式审查**」，但 D-005 / ADR-0032 / `CONTEXT.md` 把它无差别地扩展为**全局审查通过判据**，并经 D-017「10 个审查面共同受益」施加到仍走旧 provider 链路的 7 个文档面。对那 7 个面而言，这等于在**没有针对它们作出任何决策**的情况下把多源一致性判据降为单源即可通过；而承担「如实标注单源」的机制（`independence: partial`）所在的 OI-027 仍是 `deferred`。材料的「偏离披露」只登记了范围扩大（D-018），未登记这一**语义降级的外推**。 |
| 证据 | T-003 用户逐字答复（`## Talk 记录` round 1）：「我希望使用 `/Users/hugh/.config/workflowhub/config.json` 里的配置**进行 ocr 的委托模式审查**，就是可以同时进行多个异源审查，只要有一个成功了，审查就算通过了」；D-005 decision（无范围限定）与其风险 (a)；D-017「10 个审查面共同受益」；OI-027 `deferred`、完成条件「可执行契约未成文」。 |
| **需用户裁决** | ① any-of-N 是否**只适用于** OCR 委托模式面（即 `build-code/phase`、`verify-code`，面集本身另见 CF-2），7 个文档面是否**继续沿用** `minimum_heterologous` quorum 语义；或 ② 明确把 any-of-N 扩为全局判据，并接受「7 个文档面的多源一致性降为单源」这一语义变化（此时 OI-027 的 `independence: partial` 契约成为必需前置）。 |
| 本修复已做 / 未做 | 已做：在 D-005 加校正/未决注并登记本冲突。未做（**裁决前**）：**未**给 D-005 加作用域限定、**未**改 `CONTEXT.md`/ADR-0032 的措辞、**未**把 OI-027 提前。**（裁决后落地：**已由 D-028 处理**——any-of-N 经用户裁决成为全局判据，OI-027 已由 `deferred` 升为 `confirmed` 并成为强制标注的必需前置；`CONTEXT.md` / ADR-0032 的措辞同步仍属 build-spec 交付物。）** |

#### CF-8（M9，medium）：`mode` 键的语义未处置，D-008「只读既有键」在 `mode` 上失去确定含义

| 字段 | 内容 |
|---|---|
| **状态（2026-09-22 用户裁决）** | **RESOLVED by D-029** —— 用户选定「忽略（推荐）」（见 **D-029**）：新逐路派发路径**忽略 `mode`**，派发路数只由 `initial[]` 决定；`mode` **只保留作校验**，并须在适配合同中写明为 validation-only。D-008 的「只读既有键」在该键上恢复确定含义。 |
| 冲突 | D-007/D-008 只读 `wh_review.stages.<stage>.initial[]`，但配置里每个 route 还有一个 `mode` 键（`build-code` = `full_only`，其余 = `single_round`），且 `initial[]` 的调用点会**强制校验**该键。新逐路派发路径既不解释 `mode` 语义（RF-09 自己指出这是「语义债务」），也未在材料中登记「忽略 / 继承 / 重定义 `mode`」的处置；同时 `full_only` 语义在代码中**没有任何行为分支**。 |
| 证据 | `~/.config/workflowhub/config.json:53-60`：`"build-code": { "initial": ["kimi/coding","codex/luna"], "minimum_heterologous": 1, "mode": "full_only" }`；`skills/wh-review/scripts/third-review-host-config.mjs:335-338`：`const required = stage === "build-code" ? "full_only" : "single_round"; if (configuredRoute.mode !== required) throw new Error(...)`（对每条 stage route 在 `:375`/`:384` 调用）；RF-09 `mode` 行；D-008 decision。 |
| **需用户裁决** | 逐路派发对 `mode` 的处置：**(a) 忽略**（只按 `initial[]` 数量派发，`mode` 只作校验）；**(b) 继承**（把 `single_round` / `full_only` 的现有（空）语义照传）；**(c) 重定义**（在适配合同里给 `mode` 一个真实行为语义）。本修复不选。 |
| 本修复已做 / 未做 | 已做：在 D-008 与 RF-09 `mode` 行加注并登记本冲突。未做（**裁决前**）：**未**改 D-008、**未**给 `mode` 指定语义、**未**触碰该配置文件（D-008 与 RF-07 均禁止改）。**（裁决后落地：**已由 D-029 处理**——逐路派发忽略 `mode`、路数只由 `initial[]` 决定、`mode` 仅作校验并须在适配合同中写明 validation-only；配置文件仍未被触碰。）** |

#### CF-9（M10，medium）：母 PRD 把 ①（build-plan 合并审查）的 owner 写成 CARD-05，本卡仅凭 card-02 自述判 `covered`，未登记交付物核验动作

| 字段 | 内容 |
|---|---|
| **状态（2026-09-22 用户裁决）** | **RESOLVED by D-030** —— 用户选定「登记为本卡验收动作」（见 **D-030**）：① 的**交付物核验**登记为本卡验收动作，须核验真实交付物 / 命令 / exit code；`## 需求矩阵` R-020 / OI-014 两行的 `covered` 改判为「**以本卡核验动作为条件**」。 |
| 冲突 | 母 PRD 把 ① build-plan 合并审查（FR-56/AC-57）与 OI-014 的 owner 明确写成 **CARD-05**；材料却把它判为 `covered（已覆盖）` 并声明「本卡不重做」，唯一依据是 **card-02 归档 decision-log 的自述**，**未核对任何交付物、命令或 exit**；材料也**未把「① 的交付物核验」登记为本卡的验收动作或移交项**。而 card-02 材料中用户对该事的纠偏原文恰恰要求「**不得因此缩减该卡的验收范围**」。 |
| 证据 | `prd.md:161-162`「\| R-020 \| U-010#3:build-plan 一次合并审查覆盖 spec+phase 文件 \| SD-07;FR-23/56 \| **CARD-05** \| AC-23/26/57 \|」；`prd.md:178-179`「\| OI-014 \| build-plan 合并审查一次覆盖 spec+phase 文件 \| SD-07;FR-23/56 \| **CARD-05** \| AC-23/57 \|」；card-02 归档 decision-log 自述「③CARD-05 **只并入** ①…**不做工具实测**」；card-02 DL 用户纠偏「card-02 与其它卡的重叠，只能写成「**card-02 提前完成了 X**（事实登记）；对应卡执行时核对，**但不得因此缩减该卡的验收范围**」」；材料 `## 需求矩阵` R-020 / OI-014 行。 |
| **需用户裁决** | ① 的**交付物核验**是否登记为本卡的验收动作（以及在哪一步做）；`covered` 的判定是否必须以核验结果为前提，还是维持「RF-06 事实登记 + 不重做」的现状。 |
| 本修复已做 / 未做 | 已做：在 `## 需求矩阵` R-020 / OI-014 两行加校正/未决注并登记本冲突。未做（**裁决前**）：**未**改两行的 `covered` 处置、**未**新增核验动作（那会改动 D-006/RF-06 的边界）。**（裁决后落地：**已由 D-030 处理**——① 的交付物核验已登记为本卡验收动作，R-020 / OI-014 两行改判为「以本卡核验动作为条件的 covered」；① 本体仍由 card-02 承接、本卡不重做，且不得据此缩减 CARD-05 的验收范围。）** |
### CF-1 – CF-9 四要素登记（owner / trigger / consumer / close；F-05，2026-09-22 晚新增）

> **口径**：上方各条的「**RESOLVED by D-0NN**」一律读作「**裁决级已闭合**」（用户已作出裁决、决定已落盘），**不等于**「**交付级已闭合**」（交付物已产出）。下表逐条补齐四要素，并把两个层级分开标注。**凡交付物未产出的一律记未闭合，不写成 fixed。**

| CF | owner（承接成文） | trigger（未完成事实） | consumer（下游） | close（可判真假的完成判据） | 闭合层级（2026-09-22 晚） |
|---|---|---|---|---|---|
| CF-1 | `build-spec`（把 D-024 的「承担」写成 ADR，落 `docs/adr/0032-review-chain-delegation-and-layer-contract.md` 或新 ADR） | D-024 的 TODO 仍在：ADR-0031 `:92` 所要求的「承担 ADR」**未落盘**，「超时与取消」尚未写进任何 ADR | go/no-go 结论与 build-code 的超时行为；ADR-0031 的 14/15 条对照 | ADR 文本落盘且逐条对照 ADR-0031 的 14/15 条；未落盘则本冲突的 ADR 侧未闭合 | **裁决级已闭合**（D-024）；**交付级未闭合**（ADR 未成文） |
| CF-2 | `build-plan`（旧矩阵的编辑时机 + `build-code/integration` 的送审输入形态） | D-023 未决项仍在：旧矩阵**何时编辑**未定，该面按什么 ref 取 diff 未定 | OI-026 的映射表交付物；10 个审查面的送审合同 | 旧矩阵已编辑且 `build-code/integration` 的取 diff 方式成文；否则 D-023 的「改为真实 diff 审查」只有方向、无实现 | **裁决级已闭合**（D-023）；**交付级未闭合** |
| CF-3 | `build-plan`（在 `## UI applicability` 的工作面段补入第二仓，并登记接收方 / 接口契约 / 验收判据） | D-025 已授予跨仓修复**但尚未实施**：第二仓内**零改动**，无跨仓交付登记，无 commit / push 授权 | 跨仓改动（取消 / 孤儿治理 / 健康裁决）与 ADR-0031 `:85` 的授权路径 | 跨仓交付项按 D-030⑤（接收方 / 接口契约 / 验收判据）登记且改动落盘；否则跨仓面未闭合 | **裁决级已闭合**（D-025）；**交付级未闭合** |
| CF-4 | `build-spec` 或 `build-plan`（OI-030 的三项判定维度成文） | OI-030 仍 `deferred`：三项判定维度**未成文**；D-014 第二析取支已删但判别力 oracle 仍缺 | go/no-go 的判别力（AC-55）与实验设计冻结 | 三项判定维度成文并冻结；否则 OI-030 未闭合 | **裁决级已闭合**（D-026）；**交付级未闭合** |
| CF-5 | —（记录条，无需成文） | P14 缺陷**现存**（RF-19 `REVIEW_HISTORY_UNAVAILABLE` 零派发） | D-017 派发语义修复面 | 缺陷由 D-017 承接修复；`confirmed` = 要求已定 + 缺陷现存，**不是已修复** | **裁决级已闭合**（用户显式批准 P14 + OI-031 `confirmed`）；**修复未做** |
| CF-6 | `build-plan`（新增记账面：宿主子代理上下文截断 / 丢弃边界） | 记账面**未新增**；OI-029 的 scope 已扩但记账字段未成文 | D-017 修复层的记账与 D-016 质量账本 | 记账面成文且子代理侧丢弃可被记账；否则假闭合未消解 | **裁决级已闭合**（D-027）；**交付级未闭合** |
| CF-7 | `build-spec`（`CONTEXT.md` / ADR-0032 措辞同步）＋ `build-plan`（OI-027 的三项语义契约） | `CONTEXT.md` 与 ADR-0032 的措辞同步**仍属 build-spec 交付物**、未落盘；OI-027 契约本体未成文 | 7 个旧 provider 文档面的通过判据与单源标注 | 措辞同步落盘 + OI-027 契约三项语义成文；否则「如实标注单源」不可执行 | **裁决级已闭合**（D-028）；**交付级未闭合** |
| CF-8 | `build-plan`（在适配合同中写明 `mode` 为 validation-only） | 适配合同未成文；`mode` 的 validation-only 声明**未落盘**（配置文件仍未触碰） | 逐路派发的派发路数与适配校验 | 适配合同中写明 `mode` 仅作校验、派发路数 = `initial[].length`；否则 D-008 的「只读既有键」在 `mode` 上仍缺确定含义 | **裁决级已闭合**（D-029）；**交付级未闭合** |
| CF-9 | `build-spec` / `build-plan`（执行 ① 的交付物核验并记录结果） | D-030 已登记核验动作但**尚未执行**：`## 需求矩阵` R-020 / OI-014 两行现读作「以本卡核验动作为条件的 `covered`」，核验未执行前不得读作已覆盖 | `## 需求矩阵` R-020 / OI-014 两行的 `covered` 结论 | 真实交付物 / 命令 / exit code 被核验并记录（纯文本路径引用）；否则 `covered` 不成立 | **裁决级已闭合**（D-030）；**交付级未闭合** |

> **F-05 结论**：九条冲突**全部**为「裁决级已闭合」，**无一条**达到「交付级已闭合」；故 `RESOLVED by D-0NN` 不得被读作「已交付」，本材料也不得据此宣称这九项已完成。

### 遗漏披露承诺的落点（M4 相关；状态：**尚未履行**）

D-006 风险承诺「用户声明 1/2 在本卡不完整满足，**须在阶段末遗漏披露中如实列出**」。本次核对并更正落点：

- **该承诺的产物是「阶段末遗漏披露」**，它属 **`publish-decision`（`workflows/make-decision/steps.json` 的 `step_id: 13`，`step_slug: publish-decision`）** 的阶段末产物——该步的 `observable_result` 逐字要求「a plain-language handoff covering decision, reasons, risks, and next stage」。按 `workflows/make-decision/SKILL.md`「## Stage-end consistency」末句，该产物是**六段大白话摘要**（current stage work / requirement coverage / upstream alignment / repairs made here / **remaining risks** / **next stage boundary**）。
- **它尚未产出**：本材料（`decision-log.md`）是 step 12 的产物，**不含**该摘要。本文件内名为「如实披露」的章节（`## 未能满足的解析器字段（如实披露）`）**只登记解析器字段**，不是该遗漏披露。
- **因此：本材料不得被读作已履行该承诺。** 下列各项必须在 step 13 的六段摘要（尤其 `remaining risks` 与 `next stage boundary` 两段）中如实出现：声明 2 为 `accepted_omission`（文档/设计审查点不在本卡）；7 个文档面只做问题修复、不换工具；① 由 card-02 承接**且本卡的交付物核验动作（D-030）已登记但尚未执行**；any-of-N 扩为全局判据已**显式接受语义降级**（D-028，含 OI-027 强制标注）；card-02 入向义务（`OPEN-002` / `RISK-003` / `T-075`）的**未关闭部分**；go/no-go 的**代码面基线尚未跑**（D-031）。
- 本材料**不代写、不代判**该摘要；本次修复只把它的**落点、段落位置与必列项**写实。
> **（F-11 就地更正（2026-09-22 晚）**：本小节写于 **step 13 之前**，其标题里的「状态：**尚未履行**」与正文里的「**它尚未产出**」是**当时的历史状态**。实际落点即本文件 `## 阶段末遗漏披露与交付说明（step 13 publish-decision）` 节——该节含 `### C.` 六段大白话摘要（含 `remaining risks` 与 `next stage boundary`），**已产出**，故 D-006 风险所承诺的遗漏披露**已履行**。本小节的过时表述只作历史保留，**以本注为准**。**）**

### FR-53 / AC-54 适配合同六要素逐要素对照（补缺登记）

> `prd.md:364`（FR-53）与 `prd.md:374`（AC-54）逐字要求六要素；AC-54 的失败场景逐字为「**任一要素缺失或未冻结即接入，即失败**」。本次逐要素核对，其中**「建议」与「unavailable 状态集合」两项此前在本材料中不存在**（后者在材料内 `状态集合` **零命中**），按 gap 分析补齐如下。

| 要素（FR-53 / AC-54 逐字） | 材料落点 | 本次核对结论 |
|---|---|---|
| 输入形态（`diff` / `worktree` / `packet` 明确选定其一） | D-002（选定 `packet`）；OI-005；RF-04 / RF-18 | 已选定（`packet`），含取舍 / 被否方案 / 失效条件；RF-18 补出「packet 必须物化为单 commit git 仓库」的可行配方 |
| finding schema（严重度、文件/行号锚定、证据、**建议**四要素） | D-009（实验臂原生 schema）/ D-019（最终骨架 + 强制证据）；OI-006 | **本次补齐**：D-019 骨架补入**建议**字段；D-012 的四要素是 **rubric** 要素（清单覆盖 / 强制证据 / 4 级严重度 / 条数上限），与 AC-54 的 **finding schema** 四要素（严重度 / 锚定 / 证据 / 建议）是两套，**前者不替代后者**，两套的落点已逐条对齐 |
| 超时语义 | D-024（本卡正式接管「超时与取消」修复面并承担 ADR 覆盖，含对 ADR-0031 决定 14 / 15 与 `:92` 的逐条对账义务）；P5 | 有 owner、有承担；**承担 ADR 的成文尚未落盘**（D-024 明记 TODO，未成文前冲突记 open） |
| **unavailable 状态集合** | **本次登记 → OI-033**（owner = build-spec 适配合同冻结；完成条件 = 完备枚举 + 已取证状态种子逐一归属或明文排除）；已取证种子见下表 | **此前零命中**；本次**未枚举完备**（理由见下），改为**带 owner 与完成条件的显式指派** |
| provider 身份记录 | D-007（每路 = 一个独立子代理，各绑 `initial[]` 的一个 provider；身份由**宿主侧**记录）；RF-18 §「provider 身份记录」行（委托模式下不由 OCR 记录） | 已定；与 D-029（`mode` 仅校验、路数 = `initial[].length`）配套 |
| 审查事实写入位置 | D-020（沿用 `quality/reviews/` + 不可变命名「日期+序号+描述」、append-only、不用内容寻址哈希） | 已选定 |

**「建议」字段的取值形态（诚实判定）**：G-CK 行的一手证据确立的是**字段名**（二进制字符串含 `content` / `existing_code` / `suggestion_code`）；它**没有**确立 `suggestion_code` 的**取值域**（自由文本还是枚举代码）。本卡的判定与理由：

- **判定 = 必填自由文本**（字段名保留 OCR 二进制字段名 `suggestion_code`，取值 = 非空文本），并**受 D-012 的证据纪律约束**——建议必须落在同一条 finding 的 file:line 锚点与所引证据上，**不得**是无数值的等级代码（等级代码无法承载 AC-54 要求的「建议」语义，且会与 `severity` / `category` 两个既有枚举字段重复）。
- **证据等级如实标注**：字段名 = 二进制级证据；取值域 = **无一手证据**（上游文档 HTTP 422、无上游交叉验证，见 RF-15「仍未解决」）。若 build-plan 复核二进制发现其为枚举，须按变更登记（改 schema 需重走「先冻结后接入」）。

**unavailable 状态集合 —— 已取证种子（**不是完备集合**，不得当作完备枚举使用）**

> 下列 11 项**全部**来自本材料或盘上取证，未新增任何状态名。完备枚举**做不到**：① OCR 的状态空间没有可核验的上游定义（RF-15 记「上游文档全部 HTTP 422，结论纯来自二进制取证 + 实测，无上游交叉验证」）；② 旧链路侧状态码由 3rd-review 仓产生，跨仓定义未在本卡读集内（D-025）；③ 适配层**自身**还要新增状态（三档路径 D-005 / D-009 / D-010 / D-013 的落地状态），其名字由 build-spec 定。故按 OI-033 指派枚举与冻结责任。

| 组 | 状态 / 失败信号（逐字来源） | 类别 | 盘上 / 材料锚点 |
|---|---|---|---|
| OCR 委托模式侧 | `unsupported_ext`（`.md` 默认被扩展名门排除） | 文件级排除（非失败，须记账） | RF-10 实测表；RF-18 §4.1；G-CK `excluded_files` / `excluded_count` |
| OCR 委托模式侧 | `is not a git repository`（非 git 目录，`EXIT=1`） | 硬失败 | RF-10 实测表；RF-18 §4.5 |
| OCR 委托模式侧 | `--from` 值非 commit ref（`not a valid commit ref`，`EXIT=1`） | 硬失败 | RF-18 §4.2 |
| OCR 委托模式侧 | 未配置 LLM provider（自管路径 `ocr review` exit 1） | 自管路径不可用（**委托模式不受影响**） | RF-05 可用性事实表 |
| OCR 委托模式侧 | git 版本低于上游要求 2.41（仅 warning，不中止） | 已知偏差（不中止） | RF-05；RF-18 环境行 |
| OCR 委托模式侧 | `ocr rules check` 恒 `EXIT=0`；畸形规则文件**静默回退** `System built-in / default` | **信号不可用**（退出码零信息量） | RF-10 实测表；RF-15「陷阱」；RF-18 §5.5 |
| 旧 provider 链路侧 | `ROUTE_UNAVAILABLE`（整组 route fail-closed、零派发） | 派发前失败 | RF-09 `initial[]` 行；P1 |
| 旧 provider 链路侧 | `REVIEW_EXECUTION_FAILED`（且 `provider_attempts` 为空） | 错误语义混用 | P11；OI-010 |
| 旧 provider 链路侧 | `REVIEW_QUORUM_INCOMPLETE`（派发**后**，已完成审查被整体丢弃） | 派发后失败 | RF-16 实测；P3 |
| 旧 provider 链路侧 | `REVIEW_HISTORY_UNAVAILABLE`（`blocked_before_dispatch`、`provider_attempts=[]`） | 派发前失败 | RF-19 实测；P14 |
| 旧 provider 链路侧 | `MATERIAL_INCOMPLETE`（正式 run 极可能判此码） | 材料级失败 | card-02 `decision-log.md:1856`（T-075 ②）；card-02 `spec.md:605-611`（RISK-003 验证项） |

### card-02 入向义务承接登记（入向 `OPEN-002` / `RISK-003` / `T-075`）

> **来源与性质**：card-02 归档材料（`specs/archive/workflowhub-thin-core-card-02-20260919/`）对 CARD-05 有**带 owner 的入向义务**，本卡材料此前对这些标识**零命中**（`OPEN-002` / `RISK-003` / `T-075` / `正式 run` / `bare` 逐词 grep 均为 0）。本登记按 spec-analyze 的 OPEN 项要求补齐四要素——**owner / trigger / consumer / 关闭条件**——并承接为新增 **OI-032**。**不主张本卡能自行关闭它们**；「现在能关什么 / 不能关什么」逐条分列，不得合并叙述。

| # | 入向项（逐字来源） | owner | trigger（何时动手） | consumer | 关闭条件 | 本卡现在能关什么 / **不能**关什么 |
|---|---|---|---|---|---|---|
| 1 | **`OPEN-002`：CARD-05 审查适配合同增强** —— card-02 `spec.md:636-641`：「**受影响 ID**：FR-REVIEW-001、AC-REVIEW-001、RISK-003；**owner**：CARD-05；**影响**：完整大材料可能只能记录 unavailable；**处理 Stage**：CARD-05；**关闭条件或 STOP**：完整材料在正式 run 中可审查，或产品明确保留稳定 unavailable 边界」 | **CARD-05**（执行落点 = build-spec 适配合同冻结 + build-plan 对比实验） | 适配合同冻结之前（FR-53 六要素之一「unavailable 状态集合」成文时） | go/no-go 结论与 fallback 合同；SD-08 的 `unverified` 披露 | **二者之一**：① 完整材料在**正式 run** 中可审查；或 ② 产品**明确保留**稳定 unavailable 边界（须写成明文的边界集合与三档路径） | **能**：把 ② 的一半变成可判真假——本次已把「unavailable 状态集合」登记为 **OI-033**（owner = build-spec，完成条件 = 完备枚举 + 已取证状态逐一归属），并给出 11 项**已取证状态种子**（见上节）。**不能**：本卡**没有**取得「完整材料在正式 run 中可审查」的任何证据，**不声称** `OPEN-002` 已闭合或已缓解。 |
| 2 | **`RISK-003`：完整 review packet 超过当前输入上限** —— card-02 `spec.md:605-611`：「**受影响 ID**：FR-REVIEW-001、AC-REVIEW-001；**触发条件**：冻结材料大于 provider 可接受上限；**后果**：正式 review 无法产生语义结果；**缓解或 STOP**：不得截断或伪造；记录 `unavailable`，同 task 继续修复；适配合同能力增强交 CARD-05；**处理 Stage**：build-spec / build-plan / CARD-05；**验证**：canonical attempt 保留 `MATERIAL_INCOMPLETE` 或真实 transport 错误」 | **CARD-05**（适配合同能力增强）；build-spec / build-plan（同列） | build-spec 起草适配合同能力节时；build-plan 编排审查工作包时 | 审查派发路径；canonical attempt 记录 | **验证项**：canonical attempt 保留 `MATERIAL_INCOMPLETE` 或真实 transport 错误（即：不得把超限改写成通过或改写为其他码） | **能**：材料侧的**本地**字节上限这一半**已不适用**——D-013 与 OI-025 更正已核实该本地常量在基线 `642d4fb2` 上**不存在**（活义务 = 不回归 + 不重新引入），故「我方闸门造成的超限」已无对象；D-016 / OI-029（本次按 D-027 扩到宿主子代理上下文边界）已把「丢弃必须记为质量事实」写实。**不能**：**provider 侧**的可接受上限**仍然存在**，本卡**没有**任何 provider 侧上限的实测值、规避方案或协议依据；`MATERIAL_INCOMPLETE` 是否真会在正式 run 出现，本卡**无证据**。 |
| 3 | **`T-075`（card-02 `decision-log.md:1856`，未完成项，逐字两半）** —— ①「「逐字全文匹配 vs 300KB 输入上限」= **适配合同（文档审查档）的真实缺陷**」（送审时 `decision-log.md` = 362477B > `TASK_BOUND_PROVIDER_INPUT_MAX_BYTES` = 307200B）；②「**正式 run 路径未验证**：本次 detail 审查为 **bare/diagnostic sink 路径**结果，**不构成**「正式 run 路径在同一材料下会通过」的证明（正式路径极可能判 `MATERIAL_INCOMPLETE`）。**承接**：①合并审查（适配合同设计）；**不得**据此宣称审查路径可用。」 | **CARD-05**（① 的适配合同设计）+ 本卡（② 的登记与披露） | ① 适配合同冻结之前；② 任何「审查路径可用」结论作出之前 | 声明 4 的对比实验；① 的交付物核验（D-030） | ① 的缺陷在适配合同中被显式处置（被修，或被明文接受并写明后果）；② 「正式 run 路径可用」有**正式 run 的**真实执行记录（命令 / exit / output 位置），而非 bare / diagnostic sink 路径结果 | **能**：把 ② **登记为不可宣称的限制**并写进本材料的证据限制（本次已做）；把 ① 的**字节上限**半边按 D-013 / OI-025 记为「本地常量在基线已不存在」，不重复声称该缺陷。**不能**：**未**跑过正式 run 路径，**未**取得 bare / diagnostic sink 路径与正式路径的行为差异证据，故**不宣称**审查路径可用；② 的关闭条件**未达成**。 |

- **与 OI-020 的关系（不合并）**：OI-020 是**边界 / 写面对齐**（①不重做、避免重复适配）；本登记是**入向义务承接**（带 owner 的未关闭项）。两者的完成条件分别登记。
- **本卡的核验义务（D-030）**：① 的**交付物核验**已登记为本卡验收动作；该动作是**回溯核验 card-02 已完成的 ①**，**不是重做 ①**，也**不得据此缩减 CARD-05 的验收范围**（card-02 用户纠偏原文，见 D-030）。

### 需求覆盖 gap 修复登记（step 12 语义 gap 分析 C 节）

> gap 分析（`/tmp/wh-card05-forensics/stage-end-spec-analyze.md`（**F-07 证据落盘（2026-09-22 晚）**：该 `/tmp` 原件已落盘为稳定副本 `specs/workflowhub-thin-core-card-05-20260919/research/STEP12-stage-end-spec-analyze-gap.md`，**35,541 B / 202 行，sha256 `98b8c3cfa28c07988f72a665900766b9ff31ee81c235636dceb05b9f4801b925`**（`cmp` 与 `/tmp` 原件逐字节相同）。原 `/tmp` 落点不可长期复核，该表述逐字保留。） C 节）逐条核验 24 项要求：`yes` 13 / `partial` 8 / `no` 3。本次逐条处置，**结果如下的「现判」一律为设计层判定**——make-decision 只能把要求落成**有 owner、有完成条件、可判真假**的登记；其实施与记录仍属 build-spec / build-plan / build-code / verify-code 的交付物，**本材料不声称它们已产出**。

| 要求 | gap 原判 | 缺口要点 | 本次处置 | 现判 | 残留（属后续阶段交付物，未产出） |
|---|---|---|---|---|---|
| FR-22 替换前对比实验 + fallback 合同 | partial | 基线与候选臂不同型（B-3） | 新增 **D-031**（代码 diff 面基线义务，含主体 / 测量字段 / 完成条件 / 失败判据 / 执行归属） | **yes**（设计层） | 实验报告本体（build-code）；代码面基线的**实跑**（build-plan 的实验设计执行） |
| FR-23 节奏按 SD-07 完整序列（含 ①） | partial | ① 归 card-02 且无核验动作（CF-9） | 新增 **D-030**（① 交付物核验登记为本卡验收动作）+ card-02 入向义务承接登记 | **yes**（设计层） | 核验动作的**执行与结果记录**（本卡后续阶段） |
| FR-53 适配合同六要素接入前冻结 | partial | 无「建议」字段、无「unavailable 状态集合」 | D-019 补**建议**字段并定其取值形态；**OI-033** 承接「unavailable 状态集合」完备枚举（owner = build-spec + 完成条件）；11 项已取证状态种子入库 | **partial**（设计层）〔**F-08 更正（2026-09-22 晚）：原判 `**yes**（设计层）`——已降为 `partial`**。原因：`yes` **仅指已指派 owner**，**不等于**六要素齐备；六要素中**要素 3（超时语义，D-024 TODO）**与**要素 4（`unavailable` 状态集合，OI-033）**仍为 **NOT satisfied**。原判措辞逐字保留于本注。〕** | 适配合同本体（build-spec）；状态集合的**完备**枚举 |
| FR-54 go/no-go 规则与 no-go 处置 | partial | 基线取值不同型（B-3） | **D-031** + OI-004 基线取值改写（基线集合 = 文档面 + 代码面）+ D-026 收窄后的非相对必要条件 | **yes**（设计层） | 阈值数值定稿与实验报告（build-plan / build-code） |
| FR-56 build-plan 一次合并审查（本卡执行） | **no** | 仅凭 card-02 自述判 `covered`，核验动作未登记（CF-9） | **D-030**：核验登记为本卡验收动作；R-020 / OI-014 两行的 `covered` 改为**以该核验动作为条件** | **yes**（设计层） | 核验结果记录 |
| AC-23 节奏点核对（含 ①、终末审查独立记录） | partial | ① 部分同 FR-56 | 同 D-030 / FR-56 | **yes**（设计层） | 各节奏点真实执行记录 |
| AC-26 全部节奏点真实执行记录 | partial | 有归属但无逐点 owner / 命令清单 | 本次补出**四节奏点 × owner × 记录字段 × 失败判据**表（见下） | **yes**（设计层） | 四个节奏点的真实执行记录（命令 / exit / output 位置） |
| AC-54 适配合同六要素齐备且晚于冻结 | partial | 同 FR-53 | 同 FR-53 | **partial**（设计层）〔**F-08 更正（2026-09-22 晚）：原判 `**yes**（设计层）`——已降为 `partial`**。原因：`yes` **仅指已指派 owner**，**不等于**六要素齐备；六要素中**要素 3（超时语义，D-024 TODO）**与**要素 4（`unavailable` 状态集合，OI-033）**仍为 **NOT satisfied**。原判措辞逐字保留于本注。〕** | 合同冻结事实与冻结时间点记录 |
| AC-55 实验设计含三阈值 + no-go 处置 | partial | 基线不同型（B-3） | **D-031** + D-026 收窄（两臂都零发现 ⇒ no-go）+ OI-004 改写 | **yes**（设计层） | 实验设计定稿与 go/no-go 结论 |
| AC-57 合并审查恰好一次、时机正确、两类质量核心齐备 | **no** | 本卡不执行 ① 却把它列入自己的通过条件且无核验动作 | **D-030** | **yes**（设计层） | 核验结果记录 |
| SD-16 过渡基线处置 | **no** | 仅在主输入出现，正文未处置；术语在 L1877 被误用一次 | ① L1877 的误用就地更正（见该处）；② 本登记给出**归属 + 触发点 + 关闭条件** | **yes**（设计层，归属明确） | 迁移表（CARD-06 FR-51）的**执行**：把过渡基线转为只读历史或删除 |

**SD-16 过渡基线的归属登记（补 B-7 缺口）**：SD-16（`prd.md:90` 逐字）把「本规划任务期间未提交的 `runtime/review/*`、`skills/wh-review/*` 修复代码（现行审查路径的协议修复，F1–F7）」定性为**过渡基线**，并要求「CARD-05/06 新路径就位后按迁移表（CARD-06 FR-51）转为只读历史或删除，**不静默留存**」。据此登记：**owner = CARD-06**（迁移表 FR-51 的执行方）；**trigger = CARD-05/06 新路径就位**（本卡正是「新路径就位」的一方，贡献触发点）；**close 条件 = 过渡基线按迁移表转为只读历史或删除、不静默留存**；**consumer = 迁移表冻结与验收核对**。本卡**不执行**迁移 / 删除，**不声明** SD-16 已闭合。**如实残留**：本卡未核验 F1–F7 的完整清单及其提交状态；基线 `642d4fb2` 上主仓 `git status --porcelain` 为空、本卡 worktree 只有 `M CONTEXT.md` 与未跟踪的 `docs/adr/0032-…md` / `.opencodereview/` / `specs/workflowhub-thin-core-card-05-20260919/`——这些路径均**不在** SD-16 的「`runtime/review/*`、`skills/wh-review/*`」定义内，是否另有未提交修复**不在本卡判定范围**。

**AC-26 四节奏点 × owner × 记录字段（补「无逐点 owner / 命令清单」缺口）**

| 节奏点（SD-07 逐字） | owner（本卡后续阶段） | 记录字段（AC-26 逐字要求） | 失败判据（AC-26 逐字） |
|---|---|---|---|
| ① build-plan 合并审查（一次，覆盖 spec 与 phase 文件） | card-02 已完成本体；**本卡执行交付物核验**（D-030） | 命令、exit、output 位置（纯文本路径引用）；核验引 card-02 归档材料的纯文本路径 | 缺真实执行记录，或为模拟 / 脚本自证 |
| ② build-code 内每 phase 一次 | build-code 阶段（phase 级工作包） | 同上 | 同上 |
| ③ 全 phase 结束集成审查一次 | build-code 阶段（集成工作包；输入形态已由 D-023 改为真实 diff） | 同上 | 同上 |
| ④ verify-code 终末代码审查（独立事实，不与功能验收共用记录） | verify-code 阶段 | 同上 | 同上；另：与功能验收混记一条即失败 |

### 认证覆盖投影的如实登记（非 gap 项，仅事实）

make-decision 的**认证**覆盖投影当前为**空且 `incomplete`**：`quality/facts/dc158bf0….json` 记 `kind="coverage"`、`status="incomplete"`；`quality/evidence/coverage-audits/d2d3c149….json` 的 `items: []`、`covered` / `accepted_omission` / `missing` 全为 0，`failures[0].code="source_inventory_unavailable"`。**故 `## 需求矩阵` 是本材料**自建**的覆盖表，未获认证投影背书**；上述「现判」也**不得**被读作认证覆盖结论（按 spec-analyze：缺输入记 `material_incomplete`，不作为语义 finding）。该投影与本材料矩阵的关系须在 build-spec 与阶段末遗漏披露中如实说明。

---

## 独立替代审查 18 条 finding 的处置表

> 处置取值：`fixed`（已直接改材料） / `registered-as-conflict`（不改决定，登记冲突待用户裁决） / `rejected-with-reason` / `already-deferred`（材料已带 owner 延期，仅指出位置）。

| finding | severity | 处置 | 说明 |
|---|---|---|---|
| H1 | high | **registered-as-conflict → 已由 D-024 RESOLVED** | **CF-1**：D-017「超时与取消」修复面 vs 仍生效的 ADR-0031 `:70`/`:71-73`/`:92`。当时未改 D-017 修复面、未产出承担 ADR。**2026-09-22 用户裁决「承担 ADR，正式接管」→ D-024**（承担 ADR 的成文仍为 TODO，未落盘前该冲突的 ADR 侧仍记 open）。 |
| H2 | high | **fixed** | P1 的因果归因更正：该错误串唯一来自 `third-review-host-config.mjs:211` 经 `:701`（唯一的 `host_provider` label 调用点，位于 `:710` 循环之前），非 `:710-720` 的 `initial[]` 枚举；注册表 `:205` 已含 `dsh`。RF-09 行 + P1 行 + OI-008 evidence 加校正注。**注**：`docs/adr/0032`「背景」节仍重复旧归因，不在本次指定修复面内，见下节未触碰项。 |
| H3 | high | **registered-as-conflict** | **CF-2**：D-006/已选方向/D-018 的面集内部不一致（`build-code/integration` 非 diff 面且合同禁止投递 diff，而 RF-11 的 3 个 diff 面含 `mini_task/implementation`）。加校正注，不自行改面集，给出 (a)(b)(c) 三选项。**2026-09-22 用户裁决「修改Intergration，让这个审查也变成真的diff审查」→ D-023（CF-2 RESOLVED）**。 |
| H4 | high | **fixed** | ① 幽灵常量：D-002 与 OI-005 两处 `REVIEW_PACKET_MAX_DELIVERY_BYTES` 引用改为正确表述并留原表述；② 空验收：D-013 / OI-025 / P6 / P13 改为「基线 `642d4fb2` 已移除 ⇒ 活义务=不回归 + 不重新引入」，OI-025 验收判据改为**可判真假**（契约测试断言常量持续不存在 **且** 材料 >307,200 B 的真实派发完成）。 |
| H5 | high | **fixed** | **CF-5（已由用户裁决，记录）**：记录用户 2026-09-22 显式批准 P14 追加 + 接受 OI-031 `confirmed`；D-021 闭环清单 P1–P13 → **P1–P14**；三处「尚待用户显式追加」改为「已获用户显式追加」并保留该事实。 |
| H6 | high | **registered-as-conflict** | **CF-4**：D-014 第二析取支不可判真假（oracle OI-030 仍 `deferred`）。加校正注；OI-030 保持 `deferred`；给出 (a) 改可判真假 /(b) 删该支 两条选项。**2026-09-22 用户裁决「删掉该分支」→ D-026（CF-4 RESOLVED；D-014 第二析取支已删除，OI-030 仍 `deferred`）**。 |
| H7 | high | **registered-as-conflict** | **CF-3**：修复面跨第二个仓库 `/Users/Hugh/Hugh/Project/3rd-review`（`broker.mjs:577` 实体在该仓），无跨仓交付登记，违反 D-030⑤ 与 ADR-0031 `:85`。在 `## UI applicability` 工作面段、D-017、P10、RF-16、DSP-02 加注；未做任何跨仓改动。**2026-09-22 用户裁决「本卡承担跨仓修复并登记」→ D-025（CF-3 RESOLVED）**。 |
| M1 | medium | **fixed + registered-as-conflict** | G-CK 行与 OI-025 `counterexample_boundary` 的「委托模式下自动消解」更正为「该 **OCR 路径**不适用；风险**转移**至宿主子代理上下文」（留原表述），并记录 RF-10 不含 `too_large` 事实；新闸门无记账面 → **CF-6**。 |
| M2 | medium | **fixed + registered-as-conflict** | D-005 加校正注：any-of-N 的用户原话限定在「ocr 的委托模式审查」，经 D-017 外推到 7 个旧 provider 面属未登记的语义降级；是否限定作用域 → **CF-7**。 |
| M3 | medium | **fixed** | 「唯一阻断点」更正为「阻断点（≥3 处）」：`deriveSeriousReviewPause`（`stage-review-disposition.mjs:43-47,196-235`）+ `stage-runner.mjs:665-668` + `task-kernel-implementation.mjs:470-477`（旁证 `stage-handlers.mjs:4166-4170`）；OI-001 evidence 的引用同步更正。 |
| M4 | medium | **fixed** | 需求矩阵「声明 1」行加校正注：`covered` 依据是晚于 D-006 的 D-018，两处原文逐字保留、属时序差异；「阶段末遗漏披露」承诺落点单列一条（尚未兑现，落点在阶段末）。 |
| M5 | medium | **fixed** | D-004 decision、RF-02、`## 核心需求` 三处遗留的「finding schema 脚手架」按 G-CK/D-019/ADR-0032/CONTEXT.md 更正，原措辞以「（校正：原表述为…）」逐字保留。 |
| M6 | medium | **fixed（集合归属指向 CF-2）** | `## 已选方向` 的「7 个文档审查面」枚举只列 6 项且以「`build-code/integration` 之外」排除该面，而 RF-11 与代码事实把该面算作那 7 个之一；加校正注指出枚举自身不自洽，**枚举按原文保留未改**（改哪一支都等于替用户在 CF-2 选边），集合归属 → CF-2。 |
| M7 | medium | **fixed** | P5 量化事实更正：`1,200,000 ms` 是宿主总等待上限 `DEFAULT_MANAGED_TERMINAL_WAIT_MS`（`simple-review-runner.mjs:41`）而非 provider 需求（实测最长 432,004 ms）；「45/60/65s」仓内只有 65 s（`review-record-route.mjs:26`）；孤儿由 `cleanup(root, ttl_hours)` 回收、非缺口。 |
| M8 | medium | **fixed** | OI-023 `follow_up_acceptance` 与 D-010 风险的「packet 体积上限」指向已由 D-013 取消的对象：加校正注改为「在不设任何字节闸门的前提下设计上下文成本」；完成条件本体未变。 |
| M9 | medium | **registered-as-conflict → 已由 D-029 RESOLVED** | **CF-8**：`mode`（`full_only`/`single_round`）在逐路派发下的处置未登记，D-008「只读既有键」在 `mode` 上失去确定含义；给出忽略/继承/重定义三选项。**2026-09-22 用户裁决「忽略（推荐）」→ D-029**（逐路派发忽略 `mode`、路数只由 `initial[]` 决定、`mode` 仅作校验并在适配合同写明）。 |
| M10 | medium | **registered-as-conflict → 已由 D-030 RESOLVED** | **CF-9**：母 PRD 把 R-020/OI-014（① 合并审查）owner 写为 CARD-05；材料仅凭 card-02 自述判 `covered`，未登记交付物核验动作，与 card-02 用户纠偏「不得因此缩减该卡的验收范围」张力。**2026-09-22 用户裁决「登记为本卡验收动作」→ D-030**（① 交付物核验须核验真实交付物 / 命令 / exit code，R-020 与 OI-014 两行改判为「以本卡核验动作为条件的 covered」）。 |
| L1 | low | **fixed** | 「全仓 grep `max_rounds`/`maxRounds`/`round_limit` 零命中」更正为「**审查链**代码内无数字轮次上限」，并列出反例 `skills/debate/pk-rules.ts:94/104/107`（`round >= 2`）与 `pk-rules.test.ts:94`；实质结论（审查链上限只在散文）保留。 |

**统计**：fixed 9（H2/H4/H5/M3/M4/M5/M6/M7/M8，另 L1 计入则 10）· fixed + registered-as-conflict 2（M1/M2）· registered-as-conflict 6（H1/H3/H6/H7/M9/M10）· rejected-with-reason 0 · already-deferred 0（M2 的 `independence: partial` 机制本已由 OI-027 带 owner 延期，见该行说明）。

**（2026-09-22 更新（最终）：H1/H3/H6/H7 对应的 CF-1–CF-4 已分别由 **D-024 / D-023 / D-026 / D-025** 裁决并 **RESOLVED**；M1 / M2 / M9 / M10 对应的 **CF-6 已由 D-027、CF-7 已由 D-028、CF-8 已由 D-029、CF-9 已由 D-030 RESOLVED**。上表各行的处置列已就地追加指向。原 `registered-as-conflict` 记为**当时**处置，不改写；**本表 18 条 finding 至此全部有终局指向，无遗留未决。**）**

---

## spec-analyze 镜头 15 条 finding 的处置表

> **来源**：spec-analyze 镜头（**独立来源、独立上下文**，未参与本材料任何部分的撰写）于 2026-09-22 产出的 **15 条 finding**；原件 `specs/workflowhub-thin-core-card-05-20260919/research/SPEC-ANALYZE-lens-findings-make-decision.md`（29,294 B / 195 行，sha256 `d3be1744d7facd16360a229fc0f8ea9e8357ed54dfea5f878ba33412a6ba57c0`）。
> **处置用语**取自 `runtime/task/task-store.mjs:230` 的 `FINDING_DISPOSITIONS = ["fixed","rejected_invalid","accepted_risk","needs_human","user_decided"]`。
> **⚠️ F-01 / F-02 为 `needs_human`（非终止态）**：在重跑序列第 ②③④ 步（见 **D-038**）完成之前，**本材料不得被读作已获最终批准，也不得被下游（build-spec）当作已批准基线消费**。

| Finding | 严重度 | 类型 | 材料锚点 | 问题 | 处置 | 闭合动作 / 证据 |
|---|---|---|---|---|---|---|
| **F-01** | CRITICAL | 授权 | `## 状态`；`:2959`–`:2961` | 当前修订**不被任何 `quality/confirmations/*.json` 绑定**——材料自陈「先前的 `approve-decision` 确认（绑 `revision-9519539b…` / `snapshot_tree=b31865f7…`）不再覆盖本次修订，须由用户重新确认」 | `needs_human` | **材料内无法闭合。** 闭合动作 = 重跑序列**第 ② 步**：用户对**当前**修订做真实确认（`confirm --action=decision --stage=make-decision --project=workflowhub --task=workflowhub-thin-core-card-05-20260919 --decision=accepted --reply-text='<用户真实回复>' --step-slug=approve-decision`）。**实测：当前 `decision-log.md` sha256 `a76e41930d0318230df9166d441905627fd8e0e4379fc6dbce696b894782abd6` 不被任何 `quality/confirmations/*.json` 绑定。在此之前材料不得被读作已获最终批准。** **（哈希自指说明（2026-09-22 晚））：`a76e4193…` 是本轮材料修复**之前**的 sha256；本轮修复改变了文件哈希，故待确认的「当前修订」哈希应由复核者在修复冻结后当场重算（`shasum -a 256 specs/workflowhub-thin-core-card-05-20260919/decision-log.md`），修复前值与修复后值**都不被任何 `quality/confirmations/*.json` 绑定**。** |
| **F-02** | HIGH | 质量事实 | `## 需求矩阵`；`:2651`–`:2653` | 覆盖审计与 12 项 acceptance evidence 全部绑在**旧修订**上，未随当前修订重跑 | `needs_human` | **材料内无法闭合。** 闭合动作 = 重跑序列**第 ③④ 步**（对当前修订重跑覆盖审计与 12 项 acceptance evidence）。**如实登记**：两份 audit 的 `decision_log_hash`（`90999ee7…` / `09fbfbc0…`）**都不等于**当前文件 sha256；12 份 acceptance evidence 绑 `revision-5f807b76…` / `snapshot_tree 513bd6a0…`、`evaluated_at 2026-09-22T04:19:32.639Z`，其中 **5 份为 `deferred` 且 `summary.actual_outcome = "missing"`**（`finding_dispositions` / `non_goals` / `risks` / `scope` / `stage_end_spec_analyze`）。 |
| **F-03** | HIGH | 计数不一致 | `:112`–`:115`、`:2309`、`:2355`、`:2694`、`:2874`、`:2945`；留证区 `:2818` 区 / `:2828` / `:2838` / `:2862` | OI 计数在多处互相矛盾（30 / 31 / 33 / 35；20/13、20/15、20/11），读者无法判断哪个是现行值 | `fixed` | 统一为**实测值 35 条 = 21 `confirmed` / 14 `deferred` / 0 `open` / 0 `not_applicable`**；**权威计数集中到 `### 1′` 一处**，其余处只引用它。各书写点就地追加更正注（原文逐字保留）。留证区内的历史计数**保留原样**，只在 `## 本次 gap 修复的原文留证` 的已弃用索引里标为历史（见 F-12）。 |
| **F-04** | HIGH | 事实错误 | `:2472`（CF-1「证据（材料侧）」行） | 断言 `grep -rn "D-030"` 在本材料与 ADR-0032 中**零命中**——与事实不符 | `fixed` | 就地更正为实测事实：`grep -c 'D-030' <本文件>` = **37 行命中**（用 `grep -o` 统计得 **43 处**）；`docs/adr/0032-review-chain-delegation-and-layer-contract.md` 中 `D-030` 命中 = **0**。「**ADR-0032 未提及 ADR-0031**」这半句为真（命中 = 0），**保留**。原文逐字保留 + 追加更正注。 |
| **F-05** | HIGH | 闭合口径 | `:2465`–`:2562`（CF-1 – CF-9） | CF 只写 `RESOLVED by D-0NN`，缺 **owner / trigger / consumer / close** 四要素，且「RESOLVED」易被读作「已交付」 | `fixed` | 新增 `### CF-1 – CF-9 四要素登记（owner / trigger / consumer / close）` 表逐条补齐；并把 `RESOLVED` 限定为「**裁决级已闭合**」，与「**交付级已闭合**」分开标注——**九条全部为裁决级已闭合、交付级未闭合**。**未完成一律不写成完成。** |
| **F-06** | HIGH | 登记缺失 | `:2060`–`:2078`（D-031）；OI-004 记录 | 「补跑一条真实代码 diff 面的 wh-review 基线」缺四要素记录 | `fixed` | 在 D-031 条目内就地补**四要素行**（owner = `build-plan`；trigger = build-plan 的对比实验设计冻结；consumer = D-011 阈值 / OI-004 基线取值与 go/no-go 代码面结论；close = 一条 wh-review 真实代码 diff 实跑事实入库且基线集合 = 文档面 + 代码面）。**并写明该条原文「本次不跑，也不得声称已跑」——截至 2026-09-22 晚本项未跑。** |
| **F-07** | HIGH | 证据易失 | `:1176`、`:1217`、`:1235`、`:2458`、`:2624`、`:2697`、`:2939` | 三个关键原件只在 `/tmp/wh-card05-forensics/`，随时可能被清理 | `fixed` | 已落盘为 `research/` 下的稳定副本：`SD08-independent-alternative-review.md`（41,069 B / 255 行，sha256 `a4d82c967a672b8378d15c28e6a8d29a47e28d1bd07b5c063dc2e17295f964af`）、`STEP12-stage-end-spec-analyze-gap.md`（35,541 B / 202 行，sha256 `98b8c3cfa28c07988f72a665900766b9ff31ee81c235636dceb05b9f4801b925`）、`RF-16-step6-timestamps.txt`（92 B / 4 行，sha256 `21a52f1488e034ad712f5b4277de9725bcd332d04140d42fd422a789f840eea1`）；三份均经 `cmp` 与 `/tmp` 原件比对**逐字节相同**。材料各引用点改为引用新稳定路径，原「只在 `/tmp`、不可长期复核」表述逐字保留。**finding 原件本身也已落盘**（见 **D-039**）。 |
| **F-08** | HIGH | 判定过强 | `:2630`、`:2635` | FR-53 / AC-54 现判 `yes`（设计层），但六要素中要素 3 / 4 仍 NOT satisfied | `fixed` | 两行现判由 `**yes**（设计层）` 降为 **`partial`**，并写明「`yes` **仅指已指派 owner**，**不等于**六要素齐备」；**要素 3（超时语义，D-024 TODO）**与**要素 4（`unavailable` 状态集合，OI-033）**仍是 NOT satisfied。原文逐字保留 + 追加更正注。 |
| **F-09** | MEDIUM | 引用歧义 | `:40`、`:102`、`:527`（另 `:1535`、`:2493`） | 短引用 `ADR-0031:85` 有歧义（worktree 内有两份 `0031*` ADR）；`card-02 DL:1193` 无全路径；archive 路径缺 `specs/archive/` 前缀 | `fixed` | 统一为 worktree 相对**全路径**：`ADR-0031:85` → `docs/adr/0031-review-check-downgrade-and-identity-boundary.md:85`；`card-02 DL:1193` → `specs/archive/workflowhub-thin-core-card-02-20260919/decision-log.md:1193`；archive 路径补 `specs/archive/` 前缀。就地保留原文 + 追加更正。 |
| **F-10** | MEDIUM | 语义脱节 | `CONTEXT.md:444`；`:2156` | 「任一成功即审查通过」被读作**结果取舍**判据，与 D-035 的「并集入账 + 逐条标来源强度」脱节 | `fixed` | ① `CONTEXT.md:444` 的 any-of-N 条目已按 D-035 语义修订（「任一成功」仅**派发判据**；结果取舍 = **并集入账 + 逐条标来源强度**），并**新增两条术语** `single_source` 与 `corroborated`。② `:2156` 核心需求句就在原文后追加更正注（原文不改）。 |
| **F-11** | MEDIUM | 状态过时 | `:2564`–`:2571` | 「遗漏披露承诺的落点」自称「状态：**尚未履行**」「它尚未产出」，而 `## 阶段末遗漏披露与交付说明` 恰恰就是它 | `fixed` | 在该小节就地追加更正注（原文保留）：该小节写于 **step 13 之前**，属**历史状态**；实际落点即本文件 `## 阶段末遗漏披露与交付说明（step 13 publish-decision）` 节；承诺**已履行**。 |
| **F-12** | MEDIUM | 历史区无索引 | `:2704`–`:2863` | 「原文留证区」内历史行与正文并存但无索引，读者可能把已弃用事实当现行 | `fixed` | ① 在该节开头写明「本节全部内容均为**已弃用历史**，一律以正文的更正注为准」，并新增「**已弃用索引**」表（留证区行号 → 取代它的正文位置）。② OI 计数统一到 `### 1′` 一处（F-03 已做）。③ 其余成对冲突（token 口径、CF 状态、`covered` vs `covered（有条件）`）逐对加「已弃用 / superseded by X」标记。**未删任何原文。** |
| **F-13** | MEDIUM | 面集冲突 | `:1345`–`:1347`、`:1551`–`:1553`、`:2181`–`:2186` | D-006 / D-018 的「3 个代码审查面」是旧面集表述，未标「已由 D-023 + OI-026 取代」 | `fixed` | ① D-006 / D-018 的旧面集表述就地标注「**已由 D-023 + OI-026 取代**」。② 给出唯一权威事实：`runtime/review/stage-materials.json` 共 **10 个审查面**；三个被替换面 = `build-code/phase` / `build-code/integration` / `verify-code`；剩余 **7 个** = `make-decision/direction`、`make-decision/detail`、`build-spec`、`build-plan`、`mini_task/design`、`mini_task/implementation`、`non_stage/build_prd`（2026-09-22 晚亲自读该文件核对，`surfaces` 对象恰 10 键）。③ 写明 `mini_task/implementation` 是 diff 面但**不在被替换面集内**，是否纳入 → **明确登记为 OI-026 待定项**，本卡不预选。 |
| **F-14** | LOW | 解析器偏离 | `:2301`–`:2377` | 对解析器的强制偏离（`outline_version` 写字符串 `'02'`、OI-031 判断性映射、人读台账保留 `open` / `待定`）散落各处、无统一索引 | `fixed` | 在 `## 未能满足的解析器字段（如实披露）` 节内新增 **`### 5′ 解析器强制偏离索引`** 表（字段 / 原因 / 影响的读者面），覆盖上述三项。 |
| **F-15** | LOW | 完成条件不全 | `:1729`–`:1736`（RF-15）；OI-033 记录 | RF-15 的四项未验证项（`{{system_rule}}` 端到端注入、多行 `rule`、global 层 `include`、上游无交叉验证）未进入任何 OI 的完成条件 | `fixed` | 已登记进 **OI-033 的完成条件**（`follow_up_acceptance` 追加四项为待验证项），**未改 `status`**。 |

> **统计**：15 条 = **`fixed` 13 条** + **`needs_human` 2 条**（F-01 / F-02）。`needs_human` 为**非终止态**，故本材料**整体不得读作全部闭合**。

## 本次修复未触碰 / 无法核实（如实登记，不冒充已办）

1. **`docs/adr/0032-review-chain-delegation-and-layer-contract.md`「背景」节仍重复 P1 的旧误归因**（把 session1 的 `host_provider` 错误串直接归因于 `initial[]`）。该文件不在本次指定的修复面（`decision-log.md`）内，**未改**；须与 H2 同步更正，否则同一误归因会从 ADR 流入 build-spec。**（2026-09-22 更新（D-024 同步修复）：该文件**已修复**——「背景」bullet 已改写为 `:211` 经 `:701` 的真实归因并附更正记录，另按本材料的 L1 / M7 对齐了「轮次上限作用域 / 45-60-65 s / 1,200,000 ms / 孤儿进程」四处陈述。上面「**未改**」为**当时**状态，逐字保留于本注。）**
2. **未复核的取证原始记录**：s1–s4 四份真实执行会话的原始证据、约 13.4 亿 input token、`unavailable` ×33、s3 的 455,671B / 486,777B、P13 的「121 分钟返工」、RF-16 / RF-19 的原始产出（attempt.json / report 字节）**不在仓内可复核范围**；本次修复只更正**机制归因**与**现行状态陈述**，不否定这些事件本身，也不重复声称它们已发生。
3. **未复跑 OCR 二进制一手实测**（RF-01 / RF-02 / RF-10 / RF-15 的 `ocr` 命令输出）；本次只按 G-CK 与 D-019 的统一口径消除了材料内两套互斥事实（M5）。
4. **未运行任何测试 / 构建**（按 AGENTS.md 测试纪律：只跑受影响针对性测试，本次未获授权的测试范围）。H4 的「基线已移除」结论来自源码阅读 + 两条既有契约测试的**断言原文**（`review-input-bounds-portability.test.mjs:30`、`review-materials-contract.test.mjs:81`），**未实际执行**它们。
5. **当时未做的修复（因需改决定，已转为冲突）**：CF-1–CF-4、CF-6–CF-9 的全部处置；D-006/D-017/D-018/D-021 的决定本体；任何 OI 的 `status` 改动（`### OI 记录` 当时为 20 条 `confirmed` / 11 条 `deferred` / 0 条 `open`）。**（2026-09-22 更新：CF-1–CF-4 已由用户裁决并分别记入 **D-024 / D-023 / D-025 / D-026**；**CF-6–CF-9 已由用户裁决并分别记入 D-027 / D-028 / D-029 / D-030**——九条冲突全部 RESOLVED。决定本体中，D-006 / D-017 / D-018 / D-021 仍按原文保留（只加指向 D-023 / D-024 / D-025 的注），**D-014 的 decision 正文按 D-026 删除了第二析取支**（原件逐字保留）；OI 的 `status`：D-026 未改动任何 status，但本次 gap 修复按 D-027 / D-028 与补缺需要改动了 OI-027（`deferred` → `confirmed`）并新增 OI-032 / OI-033（均 `deferred`）——**现为 33 条：20 条 `confirmed` / 13 条 `deferred` / 0 条 `open`**。**（F-03 更正（2026-09-22 晚）：本条末段的 `33 条 / 20 条 `confirmed` / 13 条 `deferred` / 0 条 `open` 为历史层；实测为 **35 条 = 21 `confirmed` / 14 `deferred` / 0 `open` / 0 `not_applicable`**，权威计数见 `### 1′`。原文逐字保留。）**
6. **未删除任何既有内容**：所有更正均为**新增**（`（校正：原表述为 …）` 注、`correction_note` 字段或在原句后追加），原表述一律在被更正处逐字保留可查。**（2026-09-22 更新（唯一例外，如实登记）：D-026 按用户裁决**删除**了 D-014 decision 中的第二析取支「**或有**一份明确、可复核的「本材料确无问题」结论」；该支的逐字原文保留在 **D-014 条内的「（校正（D-026…）：原 decision 逐字为 …）」**与 **D-026 的「删除留证」**两处，可查。除此之外本次未删除任何既有内容。）**
7. **RF-18 §4.7 的「自动消解」（原登记：未改；2026-09-22 晚已就地校正）**：`research/RF-18-ocr-delegate-packet-recipe.md` 是本材料**之外**的文件，首次修复时写入范围**只限 `decision-log.md`**，故当时**未改**（该历史状态如实保留）。**2026-09-22 晚已就地校正**：RF-18 §4.7 保留原文（「…故该风险**自动消解**；文件级丢弃已由 4.1 的 `excluded_files` 显式记账。」）之后，**追加校正块**，写明该「自动消解」判定为**假闭合**——OCR 侧确不再读文件内容，但真正读文件的是**宿主子代理**，内容级丢弃/截断风险只是**从 OCR 的内部闸门转移到宿主子代理的上下文边界**（超长文件在宿主侧被截断或跳过时同样不产生任何 OCR warning）。校正块并写明三点：(1) 该节成立范围**收窄为「OCR 自身路径不适用」**，不得读成「风险在本卡方案下不存在」；(2) 新断点的记账面由 **OI-029 扩项 + D-027** 承接，归 D-017 修复层；(3) **D-016 的「把丢弃提升为质量事实」义务依然生效**，只是执行位置在宿主适配层而非 OCR 解析层。文件字节数 7,037 B → 8,017 B / 137 行。
8. **替代审查原件未落入任务证据树（只读边界，未强行写入）**：SD-08 替代审查原件 `/tmp/wh-card05-forensics/substitute-detail-review.md`（**F-07 证据落盘（2026-09-22 晚）**：该 `/tmp` 原件已落盘为稳定副本 `specs/workflowhub-thin-core-card-05-20260919/research/SD08-independent-alternative-review.md`，**41,069 B / 255 行，sha256 `a4d82c967a672b8378d15c28e6a8d29a47e28d1bd07b5c063dc2e17295f964af`**（与材料记载的 41,069 B / 255 行一致；`cmp` 与 `/tmp` 原件逐字节相同）。原「原件不在任务证据树内 / 只在 `/tmp`」为该时点的事实，逐字保留；**其任务证据树缺口本身（下方第 8 条）仍未修复**，本次只补齐 `research/` 侧的稳定副本。） 未复制进 `~/Knowledge/Projects/workflowhub/tasks/workflowhub-thin-core-card-05-20260919/quality/reviews/`。理由：`quality/reviews/reports/` 按 `REVIEW_REPORT_REF` 与 `{stage}-simple-{resultId}.md` 的 **attempt / result 绑定**读取（`runtime/review/review-record-route.mjs:22` / `:704`），而该替代审查**没有 attempt 与 result**——写入即产生**无绑定的孤儿报告**，违反本仓「新增生产文件须登记唯一 consumer / owner / 替代关系 / 删除条件」。正确落点归 build-plan / build-code（登记为带 attempt / result 绑定的审查事实，或由 CARD-05 指定 `quality/evidence/` 下的登记位）；在那之前该原件**只在 `/tmp`**。详见 RF-16 基线登记末「替代审查原件的落点缺口」。
9. **`suggestion_code` 的取值域未经一手核实**：D-019 已按 AC-54 补入**建议**字段并判定为「必填自由文本」，但该判定只有**字段名**的二进制级证据（G-CK），**取值域无一手证据**；若 build-plan 复核发现它是枚举，须按变更登记（改 schema 需重走「先冻结后接入」）。
10. **SD-16 过渡基线的 F1–F7 清单未核验**：本卡只登记 SD-16 的归属（CARD-06）、触发点（新路径就位）与关闭条件，**未核验** F1–F7 修复代码的完整清单及其提交状态；基线 `642d4fb2` 上主仓 `git status --porcelain` 为空、本卡 worktree 只有 `M CONTEXT.md` 与未跟踪的 `docs/adr/0032-…md` / `.opencodereview/` / `specs/workflowhub-thin-core-card-05-20260919/`，这些路径均不在 SD-16 的「`runtime/review/*`、`skills/wh-review/*`」定义内。
11. **认证覆盖投影为空且 `incomplete`**：`quality/facts/dc158bf0….json`（`status="incomplete"`）与 `quality/evidence/coverage-audits/d2d3c149….json`（`items: []`、`found` 项全 0、`failures[0].code="source_inventory_unavailable"`）表明**认证覆盖投影未产出**。故 `## 需求矩阵` 与本材料新增的「需求覆盖 gap 修复登记」均为**材料自建表**，**未获认证投影背书**；其中的「现判」不得被读作认证结论。

---

## 本次 gap 修复的原文留证（逐行逐字，不删除）

> **用途**：证明本次修复**没有删除任何既有内容**。修复前副本 = `/tmp/decision-log-before-cf6.md`（288,183 B，sha256 `09fbfbc06e4ca93296d2337e7454ead505c21bb79c0d44d89eac7b74ff14819e`，与修复前工作文件逐字节相同）。
> **口径**：修复前文件中的**每一个非空行**，凡其完整文本**未在本材料正文中原样出现**的，全部逐字复制在下方（共 **76** 行）；其余行均在正文中原样保留（含正文内 `（校正：原表述为 …）` 注中的逐字引用）。本清单由脚本按「逐字比对」生成，**不含人工筛选**；任何人可用 `diff` 与上方 sha256 复核。
> **性质**：本节是**留证**，不是规范条款，也不是解析器权威记录；正文的更正注为准。
> **（F-12（2026-09-22 晚）：本节全部内容均为已弃用历史（superseded）。** 本节是**留证**，其中的每一个数字与状态都是**修复前**的事实，**一律以正文的更正注为准**。下表逐条给出被本节取代的留证行 → 取代它的正文位置。）**

| 留证区行号 | 已弃用内容 | 取代它的正文位置 |
|---|---|---|
| `:2806`（前行 152 区） | `usage=null` 三层一致的 token 口径 | RF-16 基线登记的更正口径（`attempt.json` 的 `usage` 键为 `null`（6/6）＋ provider output **无该键**（5/5）＋ broker `state.json` 记 `null`（6×））；OI-002 记录内的同步校正注 |
| `:2810` / `:2812`（前行 1768 / 1782） | R-020 / OI-014 的 `covered（已覆盖）` | `## 需求矩阵` 对应两行的 `covered（有条件）`（核验动作已登记、未执行 → D-030 / CF-9） |
| `:2814` – `:2820`（前行 1786–1794） | 声明 4 / 5 / 6 与 D-106 的 `covered（已覆盖）` | `## 需求矩阵` 对应各行 |
| `:2822`（前行 1804） | 「以修审查层契约换取 **10 个审查面共同受益**」的旧面集口径 | `:2184`–`:2186` 与本节 F-13 权威面集事实（`runtime/review/stage-materials.json` 共 10 个审查面；3 个被替换面 + 剩余 7 面） |
| `:2827` – `:2828`（前行 1843） | 「**31 条** OI 记录：20 `confirmed` / 11 `deferred` / 0 `open`」 | `### 1′` 的 F-03 实测权威计数（**35 条 = 21 `confirmed` / 14 `deferred` / 0 `open` / 0 `not_applicable`**） |
| `:2830`（前行 1845） | CF-1–CF-4 / CF-6–CF-9「仍待用户裁决」 | `:2462` / `:2463`（九条**全部** RESOLVED）＋ 新增的 `### CF-1 – CF-9 四要素登记` |
| `:2838`（前行 1887） | 「**31 条**记录中 20 `confirmed` / 11 `deferred`」 | 同 `:2828` 行 |
| `:2852` – `:2854`（前行 2084 / 2086） | M4 落点旧版：承诺「**尚未兑现**」、落点是「build-spec 之后的阶段产物」 | `:2564` 小节的 F-11 更正注（落点即本文件 `## 阶段末遗漏披露与交付说明`，**已履行**） |
| `:2856` / `:2858`（前行 2111 / 2112） | M9 / M10 记为 `registered-as-conflict` | CF-8 → **D-029**；CF-9 → **D-030**（见 `## 独立替代审查 18 条 finding 的处置表`） |
| `:2860`（前行 2117） | 「M9 / M10 对应的 CF-8 / CF-9 **仍未决**」 | `:2462`（CF-8 → RESOLVED by D-029；CF-9 → RESOLVED by D-030） |
| `:2862`（前行 2127） | 「CF-6–CF-9 **仍全部未处置**；OI 仍 20 / 11 / 0」 | `:2694`（CF-6–CF-9 已分别记入 D-027 / D-028 / D-029 / D-030）＋ `### 1′` 权威计数 |

> **成对冲突的逐对标记（F-12 ③）**：① **token 口径**——留证 `:2806` 的「三层一致」已被 RF-16 基线登记的更正口径取代（同上表第 1 行）；② **CF 状态**——留证 `:2830` / `:2860` / `:2862` 的「未决 / 未处置」已被 `:2462` / `:2463` 的「九条全部 RESOLVED」取代；③ **`covered` vs `covered（有条件）`**——留证 `:2810` / `:2812` 的「已覆盖」已被 D-030 改判为「以本卡核验动作为条件的 `covered`」，且新增 `### CF-1 – CF-9 四要素登记` 明确其**交付级未闭合**。**三对冲突的原文一律保留，本节不删任何一行。**

```text
修复前行 64（逐字）：
| solution | OI-003、OI-004、OI-005、OI-006、OI-008、OI-021、OI-022、OI-023、OI-025、OI-026、OI-027、OI-029、OI-031 | false | 适配合同、对比实验、go/no-go 阈值、委托模式接入；另含 Talk round 1–3 与方向审查派生的实现载体/隔离边界/映射表/聚合契约/丢弃记账 OI（见下方各 OI 记录） |
修复前行 74（逐字）：
| data_state | OI-002、OI-005、OI-006、OI-012、OI-019、OI-024 | false | 输入形态、finding schema、审查事实写入位置、材料字节 vs 代码改动的错配；另含派生 OI-024 与按内容归入本类的 OI-002（见下方各 OI 记录） |
修复前行 75（逐字）：
| success_failure_boundary | OI-001、OI-004、OI-009、OI-010、OI-011、OI-021、OI-023、OI-025、OI-027、OI-029、OI-030、OI-031 | false | 不可用三档路径、错误语义契约、单次不复审边界；另含按内容归入本类的 OI-001/OI-004 与派生 OI-021/OI-023/OI-025/OI-027/OI-029/OI-030（见下方各 OI 记录） |
修复前行 112（逐字）：
> **2026-09-22 终局处置落地（新增行）**：30 条既有 OI 已按本文件既有决定逐条给出终局处置（20 条 `confirmed` / 11 条 `deferred`，其中含 OI-025），并新增 OI-031（RF-19 派生）；逐条依据见文末「未能满足的解析器字段（如实披露）」`### 2′`。
修复前行 149（逐字）：
selected_disposition: '「成本与发现脱钩」已实测成立：取证总账四会话约 13.4 亿 input token 而 findings=0；RF-16 在本卡自身材料上复现（blue 侧 10.5 分钟真实第三方算力产出 11 条 findings，被 `REVIEW_QUORUM_INCOMPLETE` 整体丢弃）。处置：**不新增 token/时间统计面**（D-021 不修项表「新增 token/时间统计面 = 不新建」，依据规划 DL D-15）；**token 不作指标**（D-011；RF-16 实测 `usage=null` 三层一致，要引入须先修 `usage` 采集并登记为 build-plan 前置项）；「零发现」的语义由 D-014 非相对必要条件与 D-016 后果（质量账本区分「审了什么、丢了什么」）承担。'
修复前行 150（逐字）：
evidence: '取证总账（四会话 input token 与 findings=0）；RF-16（控制臂：墙钟 444 s、25 原始 / 14 canonical / 11 丢弃、`usage=null` 三层一致）；D-011「token 不能作为指标」段；D-014；D-016 后果；D-021 不修项表'
修复前行 151（逐字）：
acceptance: '验收：零发现不得被读作通过——按 D-014，OCR 臂须「至少产出 1 条 actionable finding」或有一份明确、可复核的「本材料确无问题」结论，否则判 no-go；账本须能区分「未派发」与「真无问题」（D-016 后果，对应 P9 缺陷）；失败判据=两臂都零 finding 仍判 go（D-011 风险），或账本无法区分未派发与真无问题'
修复前行 152（逐字）：
counterexample_boundary: '反例边界：D-011 风险——纯相对阈值在「两臂都差」时仍会判 go（两臂都零 finding 则「不差于」成立），由 D-014 的非相对必要条件堵住；D-014 风险——若实验材料本身无缺陷会误判 no-go，规避=选一个已知含缺陷的真实任务；RF-16 证据限制 ①——`usage=null` 三层一致，token 阈值当前不可用'
修复前行 193（逐字）：
selected_disposition: 'go/no-go 阈值三件套取相对形式（D-011）：findings 有效率 / 锚定准确率 / 耗时**不差于 wh-review 实测基线**，基线以 RF-16 控制臂实测值为准（墙钟 444 s、6 次 provider 派发、25 原始 finding / 14 canonical、锚定 25/25 有效 0 丢弃）；并追加一条非相对必要条件（D-014）：OCR 臂必须至少产出 1 条 actionable finding，或有明确、可复核的「本材料确无问题」结论，否则判 no-go 并保留 fallback。**token 不能作为指标**（D-011；RF-16 `usage=null` 三层一致）。'
修复前行 194（逐字）：
evidence: 'T-010 用户答复「③全相对（对比 wh-review 基线）」；T-013 用户答复「①加一条非相对必要条件」；D-011（含基线数值与风险）；D-014；RF-16（基线实测值）'
修复前行 195（逐字）：
acceptance: '验收：三个指标的相对判据 + 一条非相对必要条件在实验前写死且可判真假（AC-55「阈值在实验前写死并对照得出 go/no-go」）；失败判据=无阈值即下接入结论（AC-55 失败条件）'
修复前行 196（逐字）：
counterexample_boundary: '反例边界：D-011 风险「两臂都差仍判 go」由 D-014 堵住；D-014 风险「实验材料确无缺陷会误判 no-go」，规避=实验材料选一个已知含缺陷的真实任务；RF-16 证据限制 ①——无 token 计量，要引入 token 阈值须先修 `usage` 采集'
修复前行 236（逐字）：
selected_disposition: '对比实验阶段先用 OCR 原生 finding schema（`path` / `start_line` / `end_line` / `category` / `severity` 4 级，不叠加 wh-review 的强制证据字段），是否引入证据强制留作 go/no-go 数据出来后再定（D-009）；最终 finding schema 以 OCR `LlmComment` 为骨架（`path` / `content` / `start_line` / `end_line` / `category` / `severity`）并按 D-012 补强制证据字段，由 workflowhub 定义与校验（D-019）。严重度取值域（critical / high / medium / low）与字段名有二进制级权威来源（G-CK）。'
修复前行 237（逐字）：
evidence: 'T-008 用户答复「②先用 OCR 原生 schema 跑实验」；G-1 用户答复「以 OCR LlmComment 为骨架 + 补证据」；D-009；D-019（含被否方案：不复用 wh-review schema、不双写）；G-CK（finding 字段名权威来源 / 委托模式不产出 schema）；RF-03（严重度 4 级 + category 枚举）'
修复前行 238（逐字）：
acceptance: '验收：schema 与锚点硬校验由 workflowhub 自行实现（D-019 风险原文「锚点硬校验（path 存在 + line ≤ 实际行数）须自行实现——不得因为 OCR 不管就省掉」，保留 wh-review 的 `unanchored_finding_dropped` 能力）；失败判据=锚点无效的 finding 未被丢弃、或未被记账'
修复前行 671（逐字）：
source: '方向审查 finding #4；RF-16；D-005'
修复前行 675（逐字）：
existing_material_pointer: '材料中已存在的相关处置（仅供闭合判定参考，不据此宣告闭合）：D-005 已给方向（any-of-N），可执行契约待 build-plan'
修复前行 678（逐字）：
batch_id: 'Grill 结束记录 failure_semantics（残留 OI-027：不改变方向，已记负责人与完成条件）+ 移交批次（`## 收敛检查`「未决项处置」原文：移交 build-spec / build-plan，各自带负责人与完成条件）'
修复前行 679（逐字）：
owner: 'build-plan（`## 收敛检查`「未决项处置」移交 build-spec / build-plan；D-017 修复面含聚合语义）'
修复前行 680（逐字）：
trigger_condition: 'build-plan 落地聚合层（D-017 修复面「聚合语义」）时'
修复前行 681（逐字）：
scope_boundary: '聚合 / quorum 语义的可执行契约三项：已完成审查在何种条件下可被丢弃；单一来源 findings 如何以 `independence: partial` 降级发布；`REVIEW_QUORUM_INCOMPLETE` 的替代语义（OI-027 问题原文）'
修复前行 682（逐字）：
impact: '取证根因 #2「审查真跑了，结果被扔掉」在闭环清单中由 P3 承载；可执行契约未成文则 D-005「完成的审查一律降级使用、不丢弃」无法落地'
修复前行 683（逐字）：
follow_up_acceptance: '完成条件（取自本 OI 问题 + D-005，非新增事实）：三项语义各有明文契约，且 P3（`REVIEW_QUORUM_INCOMPLETE` 丢弃已完成的审查）在 D-021 闭环清单内被判修（RF-16 已在本卡自身材料上复现该缺陷）'
修复前行 717（逐字）：
existing_material_pointer: '材料中已存在的相关处置（仅供闭合判定参考，不据此宣告闭合）：D-016 + G-CK（委托模式下内容级丢弃不适用，文件级排除由 excluded_files 记账）'
修复前行 720（逐字）：
batch_id: 'Talk round 3（T-015，D-016）+ Grill 核实（G-CK）'
修复前行 721（逐字）：
selected_disposition: '适配层**解析 OCR 的 `too_large` 等丢弃信号，把每个被丢弃的文件提升为一条质量事实如实记录**（不阻断、不报错，但账上看得见）（D-016）。G-CK 一手核实补充：内容级 `too_large` 丢弃属 OCR 自管 LLM 路径（`ocr review` / `scan`），**委托模式下 OCR 不读文件内容故不适用**；文件级排除已由 `excluded_files` / `excluded_count` 显式记账。'
修复前行 722（逐字）：
evidence: 'T-015 用户答复「①「把丢弃提升为质量事实，如实记录」」；D-016（含风险：丢弃原因可能不止 `too_large`，须穷举）；D-013 风险（风险从「响亮地失败」变成「安静地变少」）；G-CK（委托模式边界与 `excluded_files` 记账）；RF-10（D-013 连带风险一手实测）'
修复前行 723（逐字）：
acceptance: '验收：质量账本中「审了什么、丢了什么」可区分（D-016 后果；同时修掉 P9「只有 findings、无 verdict/覆盖声明」导致「未派发」与「真无问题」不可分的缺陷）；失败判据=出现被丢弃文件未记入质量事实的路径'
修复前行 724（逐字）：
counterexample_boundary: '反例边界：D-016 风险——OCR 的丢弃原因可能不止 `too_large` 一种，须穷举，漏掉的丢弃仍会静默；委托模式下文件级排除只能靠 `excluded_files` / `excluded_count`（G-CK），该账若不被记录，文件级丢弃即不可见'
修复前行 770（逐字）：
### 2026-09-22 用户当面追加（本卡开工，尚待 Talk 确认）
修复前行 803（逐字）：
**待澄清**：`委托模式`（delegation mode）曾在本仓全量 grep **0 命中**。用户已指正其为 **OCR 的功能**（出处 <https://open-codereview.ai/docs/delegate>），本卡已按 RF-01 一手验证的一手证据登记，术语澄清完成。
修复前行 824（逐字）：
| R-Q1-a | open-code-review（OCR）这类面向 diff/worktree 的代码审查工具，能否承担 make-decision 方向/细节建议审查与 build-plan 合并审查这类**文档/设计审查**？ | 若不能：T-001 只能选①或③，文档审查点须另寻工具或保留 wh-review | 调研中 |
修复前行 825（逐字）：
| R-Q1-b | 原 wh-review 的审查合同与审查标准（`skills/wh-review/contracts/*.md`、`runtime/review/stage-materials.json` 送审边界、finding 处置四档）能否迁移到新工具？迁移损失是什么？ | 若不可迁移：适配合同须重新设计质量核心，AC-57「两类质量核心齐备」的落地方式随之改变 | 调研中 |
修复前行 826（逐字）：
| R-Q1-c | 现行 wh-review 审的是冻结材料字节，OCR 面向 diff/worktree；packet 形态（T-002）能否同时覆盖文档审查与代码审查两类？ | 决定 T-002 的 packet 是"一种形态服务两类"还是"分档" | 调研中 |
修复前行 1063（逐字）：
| 窗口 | 01:03:43 → 01:11:07，**墙钟 444 秒**，`exit=0`，stderr 空 |
修复前行 1065（逐字）：
| 盲审合规 | 6 个 forbidden 键一个未用；整份 decision-log（决策 / Talk / 已选方向）与全部方案性调研节均排除；另做 9 处盲审脱敏（逐条留痕） |
修复前行 1080（逐字）：
- 锚定 **25/25 `evidence_anchor_valid=true`，0 丢弃**；独立复核 3 条交付路径均存在且行号在范围内；`discarded_facts` 与 `unanchored_finding_dropped` 均空。
修复前行 1090（逐字）：
| 锚定有效 | 25，丢弃 0 |
修复前行 1092（逐字）：
| **token** | **完全不可得（`usage=null` 三层一致）** |
修复前行 1093（逐字）：
| 字节代理量 | 整包 39,766 B；codex 内嵌输入 42,962 B；file_only prompt 1,688 B |
修复前行 1139（逐字）：
| 窗口 | 05:10:57 → 05:11:01（+0800），**墙钟 4 秒**，`PIPESTATUS[0]=0`（真 exit 0），输出 483 B |
修复前行 1165（逐字）：
| exit code | 0 | **0** |
修复前行 1166（逐字）：
| token 计量 | `usage=null`（三层一致） | 无载体，平凡不可测 |
修复前行 1261（逐字）：
- **decision**：go/no-go 阈值取**相对形式**——三个指标（findings 有效率 / 锚定准确率 / 耗时）**不差于 wh-review 实测基线**。基线以本次**控制臂实测值**为准（RF-16）：墙钟 444 s、6 次 provider 派发、25 原始 finding / 14 canonical、锚定 **25/25 有效 0 丢弃**。
修复前行 1264（逐字）：
- **风险**：⚠️ **判别力风险，须在实验设计中显式处置**：纯相对阈值在"两臂都差"时仍会判 go（例如两臂都零 finding，则"不差于"成立）。**AC-55 的失败判据是「无阈值即下接入结论」，因此阈值必须写成可判真假的对照规则，不能只写"不差于"。** 须补一条**非相对的必要条件**：OCR 臂必须至少产出 1 条 actionable finding 或有明确、可复核的"无问题"结论；否则 go/no-go 判 no-go 并保留 fallback。该补充条件须在实验设计阶段与用户确认后冻结。
修复前行 1265（逐字）：
- **另**：**token 不能作为指标**——RF-16 实测 `usage=null` 三层一致，现有链路无 token 计量。若要引入 token 阈值，须先修 `usage` 采集（登记为 build-plan 前置项）。
修复前行 1266（逐字）：
- **状态**：confirmed（相对形式）；判别力补充条件待 Talk round 3 确认
修复前行 1379（逐字）：
| P8 | **无 token 计量**（`usage=null` 三层一致）→ 无成本收益反馈回路 | RF-16 |
修复前行 1533（逐字）：
- **decision**：finding schema 以 **OCR `LlmComment` 为骨架**（`path` / `content` / `start_line` / `end_line` / `category` / `severity`），并按 D-012 补上强制证据字段。
修复前行 1768（逐字）：
| 母 PRD R-020 | U-010#3:build-plan 一次合并审查覆盖 spec+phase 文件 | covered（已覆盖） | 母 PRD owner=CARD-05；① 由 card-02 提前完成，本卡按 RF-06/D-006 不重做，保留 AC-23/AC-26/AC-57 核对。**（校正/未决（M10→CF-9）：母 PRD 把 R-020 的 owner 明确写成 **CARD-05**（`prd.md:161-162`），OI-014 同（`prd.md:178-179`）；本行「已覆盖」的唯一依据是 **card-02 归档 decision-log 的自述**，材料**未核对任何交付物、命令或 exit**，也**未把「① 的交付物核验」登记为本卡的验收动作或移交项**。而 card-02 材料中用户纠偏原文恰恰要求「card-02 提前完成了 X（事实登记）；对应卡执行时核对，**但不得因此缩减该卡的验收范围**」（card-02 DL:1983-1991）。是否把 ① 的交付物核验登记为本卡验收动作，需用户裁决 → **CF-9**。）** |
修复前行 1782（逐字）：
| 母 PRD OI-014 | build-plan 合并审查一次覆盖 spec+phase 文件 | covered（已覆盖） | 母 PRD owner=CARD-05；RF-06（card-02 已提前完成 ①）/D-006 不重做。**（同上：owner=CARD-05 见 `prd.md:178-179`；「不重做」不等于「不核对交付物」，核验动作未登记 → CF-9。）** |
修复前行 1786（逐字）：
| 声明 4 | 「https://github.com/alibaba/open-code-review 项目我也已经安装好了。也需要进行尝试，是不是比本机的 wh-review 的 build-code 和 verify-code 质量更好？如何接入到 workflowhub 的流程中来。」 | covered（已覆盖） | D-104；D-022 对比实验（回溯臂 + 前瞻臂）；RF-16 控制臂语料 #0；D-004 接入形态 |
修复前行 1787（逐字）：
| 声明 5 | 「尤其是我想利用 `/Users/Hugh/.config/workflowhub/config.json` 的 build-code 和 verify-code 的配置，使用 open-code-review 中的委托模式进行代码审查或所有审查。」 | covered（已覆盖） | D-105；D-007（每路一独立子代理各绑一 provider）+ D-008（只读既有 `wh_review.stages.*.initial[]`，不改结构）；RF-01 |
修复前行 1788（逐字）：
| 声明 6 | 「主会话只进行任务规划、子代理任务派发和交互类技能的执行，不要进行大量阅读和执行任务，保证主会话上下文控制和执行质量。」 | covered（已覆盖） | D-106 登记为执行约束；D-021 不修项表「主会话瘦身验证归 CARD-09」；OI-028 记录登记形式 |
修复前行 1794（逐字）：
| D-106 | 主会话上下文守恒（重活下沉子代理） | covered（已覆盖） | D-106 登记；本节收敛检查 solution 行列为执行约束；OI-028 记录登记形式；验证归 CARD-09（D-021） |
修复前行 1804（逐字）：
| 方案 | 用户答复：14 个决策轴（T-001–T-017、G-1–G-4）逐轴选定方案；取舍：以「修审查层契约」换取 10 个审查面共同受益，代价是本卡交付变重且与 CARD-06 写面重叠（按 SD-14 错时或分面合并）；被拒方案（原表措辞「被否方案」）：直接把 OCR 预设为选型、用 OCR 自管 LLM 路径、保留 wh-review/broker 作可执行 fallback、双写 finding schema、10 面全换 OCR、包体积自动分片；未决项：OI-026、OI-027、OI-028、OI-029、OI-030、OI-010、OI-012、OI-014、OI-016、OI-022、OI-023 全部不改变方向，移交 build-spec / build-plan，各自带负责人与完成条件 | D-001 ~ D-022；RF-15（rule schema 已解）；G-CK / G-1–G-4；T-002/T-003/T-004/T-006/T-007/T-008/T-009/T-010–T-013/T-017＋ 2026-09-22 用户裁决 D-023 / D-024 / D-025 / D-026（CF-1–CF-4） | 通过：AC-54（适配合同六要素齐备且接入晚于冻结）、AC-55（阈值在实验前写死并对照得出 go/no-go）；失败：合同任一要素未冻结即接入、无阈值即下接入结论 |
修复前行 1813（逐字）：
- **未决项处置**：OI-026（审查面→工具/形态/fallback 映射表）、OI-027（聚合/quorum 语义契约）、OI-028（D-106 执行约束登记）、OI-029（丢弃事实记账——委托模式下已由 `excluded_files` 覆盖；**但宿主子代理上下文这一新闸门未被覆盖，见 CF-6**）、OI-030（实验判定维度；**其缺口使 D-014 第二析取支不可判真假，见 CF-4**）、OI-010（错误语义契约）、OI-012（已由 D-020 解决）、OI-014（与 CARD-09 协调）、OI-016（与 card-07 接口对齐）、OI-022/OI-023（实现载体与隔离边界）→ **全部不改变方向，移交 build-spec / build-plan，各自带负责人与完成条件**，不得静默放过，也不得变成额外机器硬门。
修复前行 1815（逐字）：
- **（更新（2026-09-22 用户裁决）：CF-1–CF-4 已分别由 **D-024 / D-023 / D-025 / D-026** 裁决并 **RESOLVED**；仍未决的只有 **CF-6–CF-9**，上一条「必须由用户裁决后才能进 build-spec」对这一组继续生效。上一条原表述逐字保留。）**
修复前行 1843（逐字）：
- 31 条 OI 记录：**20 条 `confirmed` / 11 条 `deferred` / 0 条 `open` / 0 条 `not_applicable`**。
修复前行 1845（逐字）：
- **⚠️ 但「0 条 open」≠「材料已无未决事项」（2026-09-22 独立替代审查新增披露）**：文末 `## 独立替代审查发现的未决冲突（须用户裁决）` 登记的 **CF-1–CF-9 是独立于 OI 台账的未决清单**，其中 CF-1/CF-2/CF-3/CF-4/CF-6/CF-7/CF-8/CF-9 仍待用户裁决。它们不写成 `open` OI，是因为它们不是「本卡未知项」而是「需要用户改决定才能闭合的冲突」；`no_open_items = passed` 只说明 OI 台账无 open 项，**不得据此宣称材料无未决事项**。**（更新（2026-09-22 用户裁决）：原表述为「其中 CF-1/CF-2/CF-3/CF-4/CF-6/CF-7/CF-8/CF-9 仍待用户裁决」——CF-1–CF-4 已分别由 **D-024 / D-023 / D-025 / D-026** 裁决并 **RESOLVED**；仍未决的只有 **CF-6–CF-9**。原表述逐字保留于本注。）**
修复前行 1877（逐字）：
| OI-025 | confirmed | D-013（取消一切 fail-closed 上限）+ T-012 | 上一轮已闭合。**2026-09-22 独立替代审查后更正**：原验收判据（「审查派发路径不含任何字节闸门」）在基线 `642d4fb2` 上**恒真、不可能为假**（该本地字节上限已由过渡基线删除），已改为「常量不回归 + 大材料真派发」的可判真假判据；`selected_disposition`/`counterexample_boundary` 同步加校正注。**D-013 的决策本身未改**。 |
修复前行 1879（逐字）：
| OI-027 | deferred | D-005（any-of-N 方向已定）+ `## Grill 结束记录` failure_semantics（残留项） | 可执行契约未成文（材料原文「缺可执行契约」） |
修复前行 1881（逐字）：
| OI-029 | confirmed | D-016（丢弃提升为质量事实）+ G-CK（委托模式下内容级丢弃不适用、文件级由 excluded_files 记账） | 处置与适用边界均取自原文 |
修复前行 1887（逐字）：
- 解析器要求的终局字段**没有留空项**：31 条记录中 20 条 `confirmed`（`impact_dimensions` / `selected_disposition` / `evidence` / `acceptance` / `counterexample_boundary` + `requires_user_decision` / `batch_id`）、11 条 `deferred`（`owner` / `trigger_condition` / `scope_boundary` / `impact` / `follow_up_acceptance` + `requires_user_decision` / `batch_id`）全部填写。
修复前行 1902（逐字）：
| OI-031 的 `framework_node` / `category` 归属 | 加入 `solution` 行与 `success_failure_boundary` 行 | `analyzeDecisionOutline` 要求每条 OI 记录被至少一个框架节点与一个固定类别引用；归属取自 OI-031 自身内容（派发行为契约 = 方案面；阻断 / 零派发边界 = 成功失败边界），未新增事实。 |
修复前行 1988（逐字）：
> **2026-09-22 用户裁决后的状态（更新）**：**CF-1 → RESOLVED by D-024**；**CF-2 → RESOLVED by D-023**；**CF-3 → RESOLVED by D-025**；**CF-4 → RESOLVED by D-026**；**CF-5 已由用户裁决**（记录）；**CF-6 / CF-7 / CF-8 / CF-9 仍未决**（逐条进度见各条内的「状态」行）。
修复前行 2055（逐字）：
| 本修复已做 / 未做 | 已做：把 G-CK 行与 OI-025 `counterexample_boundary` 的「自动消解」更正为「该 OCR 路径不适用 + 风险转移到子代理上下文」并留原表述；登记本冲突。未做：**未**新增记账面、**未**扩大 OI-029 范围。 |
修复前行 2064（逐字）：
| 本修复已做 / 未做 | 已做：在 D-005 加校正/未决注并登记本冲突。未做：**未**给 D-005 加作用域限定、**未**改 `CONTEXT.md`/ADR-0032 的措辞、**未**把 OI-027 提前。 |
修复前行 2073（逐字）：
| 本修复已做 / 未做 | 已做：在 D-008 与 RF-09 `mode` 行加注并登记本冲突。未做：**未**改 D-008、**未**给 `mode` 指定语义、**未**触碰该配置文件（D-008 与 RF-07 均禁止改）。 |
修复前行 2082（逐字）：
| 本修复已做 / 未做 | 已做：在 `## 需求矩阵` R-020 / OI-014 两行加校正/未决注并登记本冲突。未做：**未**改两行的 `covered` 处置、**未**新增核验动作（那会改动 D-006/RF-06 的边界）。 |
修复前行 2084（逐字）：
### 遗漏披露承诺的落点（M4 相关，非冲突，仅登记落点）
修复前行 2086（逐字）：
D-006 风险承诺「用户声明 1/2 在本卡不完整满足，**须在阶段末遗漏披露中如实列出**」。本次修复核对：make-decision 阶段**没有**「阶段末遗漏披露」这一产物；本文件内名为「如实披露」的章节（`## 未能满足的解析器字段（如实披露）`）**只登记解析器字段**，不含该遗漏披露。故该承诺**尚未兑现**，其落点是**阶段末遗漏披露**（build-spec 之后的阶段产物），本修复不代写、不代判。
修复前行 2111（逐字）：
| M9 | medium | **registered-as-conflict** | **CF-8**：`mode`（`full_only`/`single_round`）在逐路派发下的处置未登记，D-008「只读既有键」在 `mode` 上失去确定含义；给出忽略/继承/重定义三选项。 |
修复前行 2112（逐字）：
| M10 | medium | **registered-as-conflict** | **CF-9**：母 PRD 把 R-020/OI-014（① 合并审查）owner 写为 CARD-05；材料仅凭 card-02 自述判 `covered`，未登记交付物核验动作，与 card-02 用户纠偏「不得因此缩减该卡的验收范围」张力。 |
修复前行 2117（逐字）：
**（2026-09-22 更新：H1/H3/H6/H7 对应的 CF-1–CF-4 已分别由 **D-024 / D-023 / D-026 / D-025** 裁决并 **RESOLVED**；上表四行的处置列已就地追加指向。原 `registered-as-conflict` 记为**当时**处置，不改写；M9 / M10 对应的 CF-8 / CF-9 仍未决。）**
修复前行 2127（逐字）：
5. **未做的修复（因需改决定，已转为冲突）**：CF-1–CF-4、CF-6–CF-9 的全部处置；D-006/D-017/D-018/D-021 的决定本体；任何 OI 的 `status` 改动（`### OI 记录` 仍为 20 条 `confirmed` / 11 条 `deferred` / 0 条 `open`）。**（2026-09-22 更新：CF-1–CF-4 已由用户裁决并分别记入 **D-024 / D-023 / D-025 / D-026**；CF-6–CF-9 仍全部未处置。决定本体中，D-006 / D-017 / D-018 / D-021 仍按原文保留（只加指向 D-023 / D-024 / D-025 的注），**D-014 的 decision 正文按 D-026 删除了第二析取支**（原件逐字保留）；OI 的 `status` 仍无改动——20 条 `confirmed` / 11 条 `deferred` / 0 条 `open`。原表述逐字保留于本注。）**
```

## 阶段末遗漏披露与交付说明（step 13 `publish-decision`，2026-09-22）

> 本节是 step 13 的产物，也是本文件内 7 处「须在阶段末遗漏披露中如实列出」承诺的**唯一落点**。本节未产出前，本材料**不得**被读作已履行那些承诺（此前多处已如实登记「尚未兑现」）。

### A. 逐 step 执行披露（对照 `workflows/make-decision/steps.json` 的 14 步声明顺序）

| step | 执行状态 | 产物与证据 | 完成判据 |
|---|---|---|---|
| 1 load-context | **已执行** | 本文件「任务身份」「本卡输入与只读边界」；母 PRD、规划 DL、card-02 归档材料的只读引用 | 齐备 |
| 2 triage-scope | **已执行** | 「OI 大纲」（六骨架节点 + 六固定类别 + 33 条 OI 记录〔**F-03 更正（2026-09-22 晚）：实测为 35 条 = 21 `confirmed` / 14 `deferred`，权威计数见 `### 1′`**〕）、「UI applicability」 | 齐备 |
| 3 talk-round-1 | **已执行**（真实 ask→reply→resume） | 「Talk 记录」T-001~T-004 | 齐备 |
| 4 research-inputs | **已执行** | 「调研事实」RF-01~RF-19；`specs/<task>/research/RF-18-ocr-delegate-packet-recipe.md`（RF-18 的独立落点）；盘上 attempt / result | **部分**：`usage` token 计量 **unavailable**（三层不一致：两层 `null`、一层无该键），故所有 token 相关断言不可得，已如实登记 |
| 5 talk-round-2 | **已执行** | T-005~T-012 | 齐备 |
| 6 direction-advice | **已执行（真实派发）** | attempt `66ad856a`（`semantic`，有 result）+ `1696ecbc`（`unavailable`，`REVIEW_QUORUM_INCOMPLETE`）；result `make-decision-simple-66ad856a-….json`；14 条 canonical findings 全部有处置（fixed 13 / **disputed 1**，即 DSP-01） | 齐备。**但**：`direction-review.v1` flow 无生产调用方，`broker.mjs:577` 静默跳过方向校验 → **盲审约束在生产上未生效**（DSP-02，如实记） |
| 7 talk-round-3 | **已执行** | T-013~T-017（输入含 DSP-01/DSP-02 争议清单，未压缩为泛化摘要） | 齐备 |
| 8 grill-with-docs | **已执行** | 「Grill 记录」G-CK、G-1~G-4、`grill_summary`；四项退出检查 **4/4 pass** | 齐备。`CONTEXT.md` = changed；ADR = created（ADR-0032） |
| 9 write-decision-draft | **已执行** | 本文件（2566 行 → 本次追加后 2600+ 行） | 齐备 |
| 10 detail-advice | ⚠️ **失败 / unavailable** | attempt `c465624d`：`terminal_status=unavailable`、`dispatch_state=blocked_before_dispatch`、**`provider_attempts=[]`（零 provider 调用）**、`error.code=REVIEW_HISTORY_UNAVAILABLE`、**0 findings**、墙钟 4 秒、**`exit=0`** | ❌ **未达到**。**SD-08 独立替代审查已执行**（18 findings：high 7 / medium 10 / low 1），但其原件不在任务证据树内、且审的是**修复前** 1871 行版本 → **AC-25 的替代审查记录存在版本落差**，此处如实列出 |
| 11 approve-decision | **已执行** | `quality/confirmations/c7411d6d….json`（`decision=accepted`，绑 `revision-9519539b…`）；另 `2285ef23….json` 为**旧修订**的历史确认，只读保留 | 齐备（用户 2026-09-22 真实答复「确认，完成 make-decision」） |
| 12 stage-end-spec-analyze | **已执行** | 语义 gap 检查：8 条 gap（blocking 1 / major 5 / minor 2）+ 9 项多轮编辑残留，**全部在本阶段内处置**（未下移 build-spec） | 齐备 |
| 13 publish-decision | **本节** | 本节 + 下方六段总结 | 本条即产物 |
| 14 stage-reflection | **待执行** | `quality/stage-reflection/make-decision/<reflection_key>.json` | 本文件提交后执行 |

**非 step 但须披露的事实**

1. **`steps.json` 无 debate 步骤**：`debate-direction` / `debate-detail` 只出现在 `workflows/make-decision/SKILL.md` 的「Execution model (M/S/B/P)」表，**不在 `steps.json` 的 14 步 manifest 内**，也不在 `skill-deps.yaml`。故**未执行**，在此如实记录（不记为「跳过」，因为 manifest 未要求）。
2. **Talk round 4 的条件判定为「空真」**：其触发条件是「detail 审查留下方向级或影响验收的争议」。detail 审查**从未派发**（零 provider 调用），因此不存在 findings、也就不存在争议。**「无争议」不是收敛的结果，而是审查失败的结果**——本阶段不得据此宣称「已评估并确认无需第 4 轮」。

### B. 逐 skill 披露

| skill | 状态 | 说明 |
|---|---|---|
| `talk-with-zhipeng` | **已执行** | 3 轮（step 3/5/7）+ 2 个补充批次（T-010~T-012、T-013~T-017） |
| `deep-research` | **已执行** | 10 份取证 + OCR 一手实测 + RF-01~RF-19；R-Q1 三问结案 |
| `decision-log` | **已执行** | 本文件；结构经官方解析器校验全绿 |
| `wh-review` | **部分执行** | direction 轨成功；**detail 轨失败（零派发）** |
| `grill-with-docs` | **已执行** | 四项客观退出检查 4/4 pass |
| `debate` | **未执行** | 不在 `steps.json`、不在 `skill-deps.yaml`（见上 A.1） |
| `intake-decision-review` | ⚠️ **未作为独立技能执行** | 它是 wh-review direction track 的 lens；而 direction 审查**未携带 `direction-review.v1` flow**（DSP-02），故该 lens **实际未生效** |
| `simplicity-guard` | ⚠️ **未执行** | 合同要求 detail packet 含该只读 lens，但实测 step 6 / step 10 的实投 packet **均无 `skills/` 文件**（step 10 报告已记）→ 该 lens 未随 packet 投递 |

### C. 阶段末六段大白话总结

**1. 本阶段做了什么**

把 CARD-05「审查链替换」从一句用户抱怨，收敛成了一份可执行的方向：**换了 22+ 次问答、做了 3 次真实审查、修了 3 轮材料**。期间发现了三类真实失败形态，并用本卡自己的材料当场复现了病灶。

**2. 需求覆盖**

母 PRD CARD-05 的 9 条 FR + 9 条 AC + 6 条 SD 共 24 项，**现全部为 `yes`——但均为「设计层」**：方向、契约、阈值、清单都已定；**交付物一件未产出**（生产代码、实验报告、适配合同冻结、代码面基线实跑、① 交付物核验，全部属后续阶段）。把「设计层 yes」读成「已完成」是错的。

**3. 上游对齐**

- 与母 PRD：**已对齐，但含一处显式偏离**——D-018 把范围扩出 CARD-05 范围节（该节明写不含 wh-review 物理删除与审查基建资源修复）。删除面仍归 CARD-06，未越界。
- 与 card-02：**已接住入向义务**——新增 OI-032 承接 `OPEN-002`（owner 写的就是 CARD-05）/`RISK-003`/`T-075`，并逐条分列「本卡能关 / 不能关」；① 的交付物核验已由 D-030 登记为本卡验收动作（不再仅凭 card-02 自述判 `covered`）。
- 与规划 decision-log：U-001#5 逐字采纳；`委托模式` 术语经用户指正后以一手证据重新定义（RF-01）。

**4. 本阶段修了什么**

- **材料事实错误 3 类**：幽灵常量 `REVIEW_PACKET_MAX_DELIVERY_BYTES`（全仓无定义）、恒真验收（307,200B 上限在基线已被移除）、P1 归因错误（错误串来自 `:211` 经 `:701`，非 `initial[]` 枚举）。**均保留原表述并内联标注校正**。
- **范围内部矛盾 1 处**：`build-code/integration` 并非 diff 面，却被列入「用 diff 工具替换的 3 个面」→ 由 D-023 裁决改为真 diff 审查。
- **验收可判真假**：删掉 D-014 那条不可判真的第二析取支（D-026）；把两处仍依赖它的权威 YAML 记录一并修正。
- **8 条语义 gap（含 1 blocking）+ 9 项多轮编辑残留**：全部在本阶段内处置，未下移。
- **全程零删除**：修复前 1782 个非空行**逐字保留率 100%**。

**5. 剩余风险**

| 风险 | 状态 |
|---|---|
| go/no-go 可能判 **no-go** | 已内置规则；no-go 时保留 fallback，不硬切 |
| any-of-N 扩为全局 → 7 个文档面降为单源即可通过 | 用户已**显式接受**；缓解 = OI-027 的 `independence: partial` 强制标注，**且它现在是必需前置**（已由 D-028 从 deferred 升为 confirmed） |
| 审查方「能读仓库」放大上下文成本 | D-027 新增记账面；OI-029 已扩范围 |
| 跨第二仓库 `3rd-review` 修复 | D-025 已登记；**跨仓侧无法由本卡验收套件单独验证**，须单独列证据 |
| 与 CARD-06 写面重叠（它要删的正是本层要修的） | 按 SD-14 错时 / 分面合并，须在 build-plan 协调 |
| 替代审查原件只在 `/tmp`，随时可能被清理 | 已登记落点缺口与正确落点（带 attempt 绑定或指定 `quality/evidence/` 位）；**当前不可长期复核** |
（**F-07 更新（2026-09-22 晚）**：三个关键原件已落盘至 `specs/workflowhub-thin-core-card-05-20260919/research/`，分别为 `SD08-independent-alternative-review.md` / `STEP12-stage-end-spec-analyze-gap.md` / `RF-16-step6-timestamps.txt`；本行的「只在 `/tmp`，随时可能被清理」为**当时事实**，逐字保留。）
| 认证覆盖投影为空且 `incomplete`；需求矩阵为自建表、**无认证背书** | 已如实登记 |

**6. 下一阶段边界（build-spec）**

- **可以开始**：把本方向翻译成 `spec.md`——含适配合同冻洁（六要素：输入形态 / finding schema / 超时语义 / **unavailable 状态集合** / provider 身份记录 / 事实写入位置）、对比实验设计（含 go/no-go 阈值、代码面基线实跑、card-02 回溯臂真值）。
- **不得下移的已决事项**：D-001~D-036 全部（**2026-09-22 晚追加修订后更新**；原记 D-001~D-031，新增 D-032~D-036）；P1–P18 闭环清单（原记 P1–P14，新增 P15–P18）；35 条 OI 的终局处置（原记 33 条；新增 OI-034 / OI-035，均 `deferred`）。**本条为追加修订后的更新，其原表述（D-001~D-031 / P1–P14 / 33 条）逐字保留于本括注。**
- **（第 6 项 / F-03 联合更正（2026-09-22 晚））**：上一条的「D-001~D-036 全部」与「P1–P18 闭环清单」为**上一轮**表述；**现为 D-001~D-040 全部**（新增 **D-037 / D-038 / D-039**；**D-040 为 P22 追加所新增**）与 **P1–P22 闭环清单**（新增 **P19 / P20 / P21**，2026-09-22 用户显式追加裁决；**又新增 P22**，2026-09-22 用户显式裁决追加，见 **D-040**）〔本句原文为「**现为 D-001~D-039 全部**（新增 **D-037 / D-038 / D-039**）与 **P1–P21 闭环清单**（新增 **P19 / P20 / P21**，2026-09-22 用户显式追加裁决）」，逐字保留〕。OI 计数按 `### 1′` 的实测为 **35 条 = 21 `confirmed` / 14 `deferred` / 0 `open` / 0 `not_applicable`**（上一条写的总数 35 正确，拆分 20 / 15 与实测不符）。上一条原文逐字保留。
- **（D-041/D-042 后当前口径）**：上一行的 D-001~D-040 与 OI 21/14 均为历史修订；当前决策为 D-001~D-042，P1–P22 清单不变，YAML OI 当前实测 35 条 = 22 `confirmed` / 13 `deferred` / 0 `open`。权威计数在 `### 1′`；D-041 关闭 OI-034 的方向选择，D-042 修正代码面基线执行时点。
- **必须由 build-spec 承接的开放项**：OI-032 / OI-033（含 `unavailable 状态集合` 的完备枚举、`suggestion_code` 取值域）、OI-010 / OI-014 / OI-016 / OI-020 / OI-022 / OI-023 / OI-026 / OI-027 / OI-028 / OI-030；另加 **2026-09-22 晚新增的 OI-034 / OI-035**（D-033 与 `verify-code` 面 `forbidden` 的冲突解法；D-035 并集入账的执行契约）。
- **不要重新问用户的事**：Talk 与 Grill 的全部结论已在本文件内；下游阶段**不得要求用户重复 Talk 或 Grill**。

### D. 阶段关闭后的追加（2026-09-22 晚）

make-decision 阶段于 08:08 关闭、材料最后编辑于 08:01；**而 OCR 委托模式端到端实验于 09:25–09:55 才执行**。因此本轮实验的全部产出**在阶段关闭时不在材料内**，现以同一任务的追加修订折入：

- 新增 RF-20（两臂对照实验事实）
- 新增 P15–P18（4 条审查层缺陷，P15/P16 已亲验）
- 新增 D-032 ~ D-036（含对 D-005 的判据修正 D-035）
- 新增「实验副产物」小节（5 条 card-02 交付物缺陷，不属本卡修复面）
- 新增 OI-034 / OI-035（均 `deferred`；分别承接 D-033 与 `verify-code` `forbidden` 的冲突解法、D-035 并集入账的执行契约）

**这是对已确认材料的实质修订**：其中 **D-035 改变了任何一条既有决策的语义**（any-of-N 的结果取舍判据），因此**先前的 `approve-decision` 确认（绑 `revision-9519539b…` / `snapshot_tree=b31865f7…`）不再覆盖本次修订**，须由用户重新确认。本节的追加本身也**使 step 12/13/14 的既有产出对新修订过期**，须按 stage 契约重跑。

> **（同一追加的程序状态，如实登记）**：D-021 对「超出闭环清单」设有「须用户显式追加」的要求。**历史事实**：P15–P18 的追加与 OI-034 / OI-035 的登记**在写入时未经用户事先显式确认**。**2026-09-22 晚更新**：用户已就「闭环清单扩容」作出显式追加裁决，选中「① 确认追加 P15–P18 与 OI-034/035」，故 **P15–P18 与 OI-034 / OI-035 现已获得用户显式追加确认**，闭环清单 **P1–P18** 正式成立、OI 计数 **35 条**为正式范围。⚠️ **但材料整体仍待用户重新确认**：D-035 改变了 any-of-N 的结果取舍语义（「任一成功即通过」降为**派发判据**，结果取舍改为**并集入账 + 逐条标 `corroborated`/`single_source`**），另有本轮决策链字段合规修复——**在用户完成新一轮确认之前，材料不得被读作已获最终批准**。本节 A/B/C 三个子节与 step 12/13/14 的既有产出**均为修订前状态**，只作历史证据保留。

### E. 决策链字段合规修复（2026-09-22 晚，用户裁决「① 全修到位」）

**触发**：官方 `skills/decision-log/SKILL.md:113-115` 要求每条决策记录 `module` / `requirement_ids` / `artifacts` 三个**纯文本链字段**（「documentation fields only: do not add them to `decision-entry.v1` or make them a runtime gate」），仓内有配套官方检查器 `tools/cli/check-decision-log-chain.mjs`。本材料此前从未跑过该检查器；实测 **144 条告警**。

**三轴构成（实测）**：

| 轴 | 告警 | 根因（源码定位） |
|---|---|---|
| A 格式 | 36 | 字段行写作 `- **module**：…`，`**` 使 `check-decision-log-chain.mjs:80` 的字段正则失配 → `recognized_fields = 0` |
| B 取值 | 72 | `requirement_ids` / `derived_from` 的值是**散文**，而 `:19-24` `parseList` 只接受方括号列表；`:17` `REQUIREMENT_ID = /^R-\d+$/` |
| C 缺失 | 36 | `artifacts` 字段全材料 **0 次出现** |

**修复结果**：`recognized_fields` **0 → 144（= 36×4，无误识别）**；告警 **144 → 0**；检查器收尾行 `[check-decision-log-chain] advisory complete: 0 warning(s), non-blocking, exit 0`。三个官方解析器（`analyzeDecisionOutline` / `analyzeDecisionConvergence` / `validateUiApplicability`）结果与修复前**逐项一致**，`oi_records` 计数仍 **35**、`open` 仍为 `[]`。

**无损性证明（已由父代理独立重放验证）**：`diff` 统计 **删 108 行 / 增 216 行 / 36 hunk**（算术自洽：36×1 `module` + 36×2 `requirement_ids` + 36×2 `derived_from` + 36×1 `artifacts` = **216**）。逐条断言：**108/108 三字段原值串逐字保留**（其中 72 条搬运至 `- 原 <字段> 依据：…`，实测丢失 **0** 条）、**未触碰的非空行 2,280/2,280 逐字保留**（0 条在新文件中找不到）、**残留粗体字段行 0 条**、**非方括号形式 0 条**、**含空项的 `artifacts` 行 0 条**。**字符级硬证明**：全文件净减少的字符**只有 `*`，恰好 432 个**（36 `module` + 36 `requirement_ids` + 36 `derived_from`，各一对强调标记），**其余所有字符持平或净增**——即无任何信息字符丢失。被替换散文所在行的行首为 `- 原 …`，经 `recognized_fields` 计数 **0 → 144（= 36×4，无误识别）** 证明**未被误识别为字段**。

本文中「行数」一律指 `wc -l` 口径（即以换行符计），不使用 `split('
')` 口径。

**`requirement_ids` 的取值口径（必须登记的口径选择，不是唯一正确答案）**：
- 采用**严格口径**——只认 `## 需求矩阵` 中 `covered` 行的「本卡承接」单元格里**逐字点名**的 D。倒排后得 **13 条非空、23 条 `[]`**；唯一三项者为 `D-006 = [R-005, R-016, R-020]`（被 3 个 covered R 行同时点名）。
- **未采用「两跳」口径**（D → 其正文引用的 `FR-`/`AC-` → 矩阵落点含该 `FR`/`AC` 的 R 行）。该口径**引入语义判断且无法机械复现**，故未擅自采用。
- **因此下列决策的 `requirement_ids` 为 `[]`，属可能低估、而非虚构**：`D-002`(FR-53/AC-54)、`D-003`(FR-24/AC-24)、`D-012`(FR-53)、`D-013`(FR-57)、`D-018`(AC-23)、`D-019`(FR-53/AC-54)、`D-020`(FR-53)、`D-023`(FR-23/AC-23)、`D-028`(FR-25/AC-25)、`D-032`(FR-53)、`D-035`(FR-25)。**每条的原散文依据均逐字保留在 `- 原 requirement_ids 依据：…` 行，信息未丢失。**
- `derived_from`：只允许本文件真实存在的 D id；确无前置决策者用 `[]`（**17 条**；`skills/decision-log/SKILL.md:112` 认可的 root 写法）。校验结果 **0 条 `missing_decision_reference`**，即列表内不存在虚构 D。
- **`artifacts` 口径**：只填「材料逐字点名 **且** 盘上存在」**双条件**同时满足的产物（**25 条**，仅涉 6 个路径：`docs/adr/0032-…md`、`CONTEXT.md`、`research/RF-18-…md`、两份 `research/EXP-arm-*.md`、本材料自身）；build-plan/build-code 阶段才产出、当前未落盘者一律 `[]`（**11 条**）——**宁可低估，也不虚构文件名**。主动未采用（避免撑造）：`quality/evidence/research/research-synthesis.md`（材料明写不在仓内）、`/tmp/ocr-e2e-packet/`、`/tmp/ocr-e2e-context/`、`/tmp/wh-card05-forensics/*`、packet 内路径 `diff/card-02-selected.diff`。

**未回核项（如实登记）**：`requirement_ids` 是 `## 需求矩阵` 文本的**机械倒排**，**未回核 `prd.md` L139–179**；若矩阵本身有偏差，本字段复刻了该偏差。

**检查器性质与横向对照**：`tools/cli/check-decision-log-chain.mjs:6-8` 自述「This checker deliberately **never becomes a gate**: … the process exits 0」。故本节结论应读作**「把既有缺陷修到合规并留下可复核记录」**，而非「通过了某个门禁」。兄弟材料对照（均正确传参）：card-01（归档）**30** 条、card-02（归档）**32** 条——**本卡是三者中最差的（144）**，也是唯一把字段名用 `**` 包裹的。

**工具使用陷阱（供后续复核者）**：`check-decision-log-chain.mjs:131-138` 的 `parseArgs` **只认 `--file <path>` 与 `--root <path>`**，**位置参数被静默忽略**并退化为扫描 `specs/*/decision-log.md`（`:140-151`，排除 archive）。首次核对时误用位置参数，得到「全仓非归档材料总数」这一误导性数字；**本节的 144 / 108 / 36 / 0 全部为正确传参 `--file` 后的实测值**。

### F. 事故登记（2026-09-22 晚）

**这不在计划内，是执行失误。** 本轮材料修复期间，一个子代理为试探 CLI 卫兵，运行了 `node tools/cli/stage-runtime.mjs run --action=execute --stage=make-decision --project=workflowhub --task=workflowhub-thin-core-card-05-20260919 --receipts=notaflag`，**假设未知参数会被拒绝**；实际 `run` 只读 `values.input`、**静默忽略其余参数**（即 **P21**），于是一条**真实官方 stage run 执行完毕，`exit 0`**。

后果：任务库内 `facts.jsonl` 被重写（`snapshot_tree` `3f938c47…` → `513bd6a0c6b0c042d1a63cad65e91bec880c099c`；`material_digest` `508014d0…` → `41d9f83e…`）、`quality/evidence/handoff/make-decision.md` **被覆盖（11854 B → 4258 B）**、新增 33 条不可变记录与 3 条 `identity/executions/*.json`。四份材料当时**未被动**（`decision-log.md` 当时 md5 `8f4727636508c7afc426efcbf56ab747` / 2993 行），`git status` 不变。净效果是 stage row 由 `stale` 变为绑定当前材料、`quality_missing` 从 9 项降到 4 项，但同时记录了**更弱**的阶段终点（reflection 由 `degraded` 变 `unavailable` / handoff 退化为机器样板 / `stage_end_spec_analyze = missing` / 验收 `deferred`）。

损失边界：被覆盖的旧 handoff **字节不可恢复**（任务库不是 git 仓库、无本地 APFS 快照、全盘无同字节文件）；但其生成输入（reflection `90735f09…`）仍在盘上，且该文件自声明 `authority: non_authoritative` / `retention: current_only`。**处置：不去重建一份冒充历史的文件**——如实披露 + 按正确顺序重跑，使其自然重生。

正确重跑序列（①材料冻结 → ②`confirm --action=decision` → ③`run --action=execute`（带 `--input`）→ ④`run --action=reflect`（带完整 judgment）→ ⑤`status --action=begin`）与**三条前置**的全文见 **D-038**；事故的完整事实登记（含 sha256、快照 id、时间戳）亦在 **D-038**。

### G. spec-analyze 镜头 15 条 finding 的处置（2026-09-22 晚）

**本轮另做了一次独立语义审查**（spec-analyze 镜头：独立来源、独立上下文，未参与本材料撰写），产出 **15 条 finding**；原件已落盘 `specs/workflowhub-thin-core-card-05-20260919/research/SPEC-ANALYZE-lens-findings-make-decision.md`（29,294 B / 195 行，sha256 `d3be1744d7facd16360a229fc0f8ea9e8357ed54dfea5f878ba33412a6ba57c0`）——这本身是 **F-07 的就地补救**（原报告只经 `send_message` 投递、磁盘上无副本）。

处置结果：**13 条 `fixed` + 2 条 `needs_human`（F-01 / F-02，非终止态）**；处置用语取自 `runtime/task/task-store.mjs:230` 的 `FINDING_DISPOSITIONS`。**逐条处置表见 `## spec-analyze 镜头 15 条 finding 的处置表`。**

**⚠️ F-01 / F-02 的闭合动作落在本次重跑序列的第 ②③④ 步（见 D-038）。在它们完成之前，本材料不得被读作已获最终批准，也不得被下游（build-spec）当作已批准基线消费。**

### H. 闭环清单扩为 P1–P22

**2026-09-22 用户显式裁决「升为 P19/P20/P21 进闭环清单，并修」**，按 D-021 的「超出即须用户显式追加」程序完成追加：**闭环清单由 P1–P18 扩为 P1–P21**。三条均为**实测缺陷**（全文见 **D-037**）：

- **P19**：`stage-end-spec-analyze`（`workflows/make-decision/steps.json` 的 step 12）在**仅会话内模型**下**永远不可能被满足**——唯一发布者 `publishStageEndSpecAnalyzeFact`（`runtime/stage/stage-runner.mjs:1938-1960`）只能经 `run --action=execute` 到达，且**没有任何 handler 会设置它要求的 `result.spec_analyze`**（`grep -n spec_analyze runtime/stage/stage-handlers.mjs` 零命中）；step 12 每次落 `missing`。与本卡已记的「机制永不失败」互为镜像：**机制永不成功**。
- **P20**：**机器覆盖率审计对任何经官方路径引导的任务永久 `incomplete`**——`tools/cli/task-bootstrap.mjs:150` 的 key 白名单只有 `decision|spec|build_plan`，`raw_requirement` 按 key、按类型都被拒；运行时**没有任何写入 `manifest.inputs` 的路径**。本任务两次审计都失败于 `source_inventory_unavailable`、`items: []`。
- **P21**：`run` **静默忽略未知参数**（`tools/cli/stage-runtime.mjs:944-947` 只读 `values.input`），是本轮事故的直接成因。

**修复归属**：P19 / P20 属 D-017「审查层」修复面的「**启动自检 + 质量事实生产**」；P21 属「**派发语义 / 入口参数校验**」。**spec 承接归 build-spec，实现落 build-code**；本卡 make-decision 阶段**只登记，不修代码**。

**（P22 追加（2026-09-22，用户显式裁决））**：**P22 由用户 2026-09-22 显式裁决追加（D-040）**，按 D-021 的「超出即须用户显式追加」程序完成追加，**闭环清单由 P1–P21 扩为 P1–P22**。本节标题原标题为「### H. 闭环清单扩为 P1–P21」（**逐字保留**）；本节首段原文「**闭环清单由 P1–P18 扩为 P1–P21**」亦**逐字保留、不改**，其现行读法为 **P1–P22**。

- **P22 — 官方 run 无法消费官方 run 自己产出的诚实 `unavailable` 审查记录**
  - **现象**：`run --action=execute --stage=make-decision` 在 `--input` 的 `receipts.detail_review` 指向真实审查 attempt `quality/reviews/attempts/c465624d-707b-59ec-adea-06f32645ab21/attempt.json` 时，**整个 run 硬失败、零写入**（`exit=1`、stdout 为空）。报错逐字：`Error: review unavailable attempt must contain provider attempts`。
  - **抛出点与调用链**：`runtime/stage/stage-handlers.mjs:2119`（`verifyUnavailableReview`）← `reviewFacts`（`:2493`）← `safeReviewFacts`（`:2577`）← `:3541`（`const detail = safeReviewFacts(worker, input, "detail_review", "detail");`）。
  - **根因**：`runtime/stage/stage-handlers.mjs:2105-2118` 的白名单 `groupTerminalWithoutProvider` **靠枚举错误码**判定「允许没有 provider attempt 的失败」，其枚举为 6 项：`REVIEW_ROUTE_RESOLUTION_TIMEOUT` / `REVIEW_STATUS_UNAVAILABLE` / `REVIEW_NO_SEMANTIC_RESULT` / `REVIEW_PROVIDER_OUTPUT_INVALID` / `PROTOCOL_INCOMPATIBLE` / `REVIEW_EXECUTION_PREPARATION_FAILED`；**漏了 `REVIEW_HISTORY_UNAVAILABLE`**。而该码同样是 `dispatch_state: blocked_before_dispatch` 的设计性零 provider attempt（`provider_attempts: []`）。
  - **代码内注释已把原则写对**（逐字引用）：`// Its canonical pre-dispatch failure has no provider attempt by design and must remain consumable as an unavailable fact.`
  - **后果**：**任何撞上 P14 的 task，其 make-decision 官方 run 永远无法完成**（硬失败，不是降级为 unavailable）。P14 由此从「记录污染」升级为「流程不可闭合」。
  - **修复方向**：判定条件由「错误码在白名单内」改为「`dispatch_state === "blocked_before_dispatch"`」——一个结构条件，而非一张会漏的枚举。
  - **归属**：实施归 **build-code**（改动面在 `runtime/`，本卡不改代码）。
  - **发现证据**：本卡 step ④ 官方 run 实跑（`exit=1`、stdout 空、零写入）。

**P22 追加的修订后果（如实登记）**：P22 的追加使**材料修订号发生变化**，因而**此前绑定的确认与已发布的 step ④ 记录均须按 D-038 序列重做**（①材料冻结 → ②`confirm --action=decision` → ③`run --action=execute`（带 `--input`）→ ④`run --action=reflect`（带完整 judgment）→ ⑤`status --action=begin`），**不得沿用**。

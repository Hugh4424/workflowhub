---
schema: "workflowhub-stage-handoff.v1"
task: "workflowhub-thin-core-card-02-20260919"
stage: "make-decision"
snapshot_tree: "cd26676a096ad561bedce0611a81ab55a02b89a2"
material_scope_revision: "revision-ed911b826dc19158323c91d1c798e491575045993f0256574d244dbc02d45966"
reflection_status: "degraded"
authority: non_authoritative
retention: current_only
source_refs: [{"ref":"decision-log.md","sha256":"ed911b826dc19158323c91d1c798e491575045993f0256574d244dbc02d45966"}]
---

> 非权威 current handoff，只以四材料和正式质量原件为准

## 1. 任务身份

- task: `workflowhub-thin-core-card-02-20260919`
- stage: `make-decision`（status: `completed`）
- worktree: `/Users/Hugh/Hugh/Project/workflowhub-workflowhub-thin-core-card-02-20260919`
- branch: `task/workflowhub/workflowhub-thin-core-card-02-20260919`
- baseline commit: `cd26676a096ad561bedce0611a81ab55a02b89a2`
- task store: `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-thin-core-card-02-20260919`
- 任务类型: **`普通任务`**（经 `readTaskTypeFromDecisionLog` 读回验证）
- reflection: **`degraded`**（校验器 exit 0；`confirmations=0`）

## 2. 背景与目标

- **本卡原始定义**（母 PRD）：`CARD-02 文档权威与单一事实源`。
- **用户扩张后**（U-001）：**彻底的 SDD 流程优化** —— 三种文档（decision-log / spec / phase）的**结构、内容、风格、详细程度**重新设计。
- **核心需求**（摘录 `decision-log.md` 的 U-001/U-002）：
  - **诊断**：现有四份材料「足够业务开发，但是也有很多问题，包括**文档太长、太啰嗦、重要的地方会简写、不重要的地方写的很详细，缺少合理的验收标准和测试流程**」。
  - **四属性**（须同时成立）：**精炼 + 好阅读 + 没有遗漏信息 + 让 build-code 的普通智力模型也能开发出高质量代码**。
  - **模型分工（硬约束）**：**高智力模型做 make-decision 与 build-plan；luna 级模型做 build-code 与 verify-code**（省 token/时间）→ 前期必须把计划设计透。
  - **并入项**：「card-05 的 plan 审查改造也要移到当前任务来做」。
  - **保留项**：「原本的 build-spec 和 build-plan 流程和质量核心也要考虑如何保留」。
  - **方法纠正**：「调研分析和讨论太片面，一直在收敛，没帮我扩散。我的原始需求都被你压缩了」。
- **非目标（7 条）**：不回写母 PRD ｜ 不做审查工具实测 ｜ 不物理删除文件 ｜ 不改前端 ｜ 不新增第五份材料/public command/持久对象 ｜ **不新增技能/stage/控制面/模板** ｜ 不改 card-01 蓝图。
- 只摘录关键行、不复制材料全文；权威仍以 `decision-log.md` 为准。

## 3. 当前阶段与进度

- stage status: **`completed`**（14/14 步）
- reflection status: **`degraded`**（真实；非 pass）
- 执行方式：当前 WorkflowHub 会话直接执行；未使用外部 Stage Agent / bridge / session / stage outcome。
- 规模：决策 **86 条**（T-001~T-086）｜ 风险 **95 条**（R-1~R-95）｜ 逐字声明 **28 条**（V-01~V-28）｜ 调研分析 **18 份** ｜ 独立审查 **2 次真实执行**（49 findings 全部处置）。
- 官方解析器：`analyzeDecisionOutline` = `outline-v2`，**格式错误 0**（17 条 OI 全部 `confirmed`）。

## 4. 重要决策

权威决策块为 `decision-log.md` 的 `## 决定`（**D-001..D-014**）。核心分组：

| 组 | 内容 |
| --- | --- |
| **D-001** | 范围与边界：U-001 扩张并入；母 PRD 只读；CARD-05 仅 ① 提前做 |
| **D-002** | 三种文档形态：decision-log=ADR 块 + 逐字层 + 三档 + 追溯链；**spec = 叙事主干 6 节 + 契约附件 A/B/C/D**；phase=L0/L1/L2；切片即 FR |
| **D-003** | 不对称模型分工：强方预写测试并冻结；luna **禁改测试** |
| **D-004** | 文档精炼：**9 条语义判据**，**不设任何长度数值目标** |
| **D-005** | 验收格式：四段式 + 不可判定词黑名单 + V0 禁入 |
| **D-006** | 验收 oracle：三件 oracle + 双通路 + **G-2 可失败检查**（fixture 仅 smoke test） |
| **D-007** | 审查链：单次审查 + 三态处置 + **四档降为纯标签** + 恢复不复审 |
| **D-008** | 单一权威：**双轨判据** + 度量「**已知事实清单内 0 处**」+ 真报失败不阻断 |
| **D-009** | 质量核心：**K1–K12 全保留**；**合并账 28→13 步，净新增 0** |
| **D-010** | 根因修复：**R-1/R-2 校验器粒度 + 接线**（本卡做；越界风险 R-35~R-38 已登记） |
| **D-011** | 需求保真元机制：逐字双层 + 三档结论 + 强度校验 + 待复核 |
| **D-012** | 偏离与三分类处置（14 偏离 + A11/B7/C7） |
| **D-013** | 执行边界与遗漏补回范围 |
| **D-014** | 收敛检查、实质变化程序与遗留项归属 |

**其它必读决策**：`## spec 模板结构（终稿）`｜`## 覆盖核查的补登记（T-060/T-061）`｜`## 收口清单与自检`（A 类补回 / B 类排除 / 承接与不承接 / 收口自检）｜`T-083`（interaction aggregate 纳入删除面）｜`T-086`（材料目录整理）。

## 5. 核心方案

- **spec 结构（两读）**：**A 面叙事主干 6 节**（问题 → 改成什么 → 为什么这样改 → 具体机制按切片分节 → 怎么知道改对了 → 未决与风险）+ **B 面契约附件 A/B/C/D**（需求登记 / 写集与依赖 / 未决+风险 / 覆盖指针）+ 附录。
  - **失效条件**：附件与主干若出现同一事实两份表述且无人检查 → **立刻停止双读**，该事实只留附件、主干改指针。
  - **附件 A 为验收判据唯一权威**；主干第 5 节只留场景说明与指针。
- **phase 结构**：**L0 目标 / L1 契约+不变量+可执行验收+不可逆确认门 / L2 参考步骤**（L2 可作废、带过期条件）；**禁止能力补偿型指令**（"务必彻底搜索"等）。
- **decision-log 结构**：ADR 决策块（**16 行/块**，T-047）+ 唯一 OI 大纲 + 三级追溯链 + 覆盖矩阵 + 逐字声明层 + 三档结论。
- **新 build-plan 13 步**（合并账产出，**待实现**）：read-current-materials → conditional-spec-research → spec-clarify → spec-specify(含定稿) → conditional-ui-readiness → spec-plan(吸收 spec-tasks) → testing-system-blueprint → test-routing-advisor → merged-review(1 consumer) → main-agent-disposes-findings → final-spec-analyze → publish-result-and-confirm → stage-reflection。
- **K1–K12 映射**：**完全覆盖 10 / 部分覆盖 2（K11/K12）/ 无承接者 0**；**真正新建 = 空集**。

## 6. 踩过的坑

- **用户 6 次关键纠偏（已登记为原则）**：
  1. 「怎么可能纯新增？两个 stage 合并成 1 个」→ **T-036/T-043**：交付**合并账**，证明净新增 0。
  2. 「逐项标记状态…那和加哈希加 gate 加质量门禁有什么不同？」→ **T-074**：**拒绝新控制面/新门禁**，按「一事实一权威」修。
  3. 「如果把原来的 PRD 毁了或遗失部分需求，那还不如别改了！」→ **T-067**：PRD 更新只能**纯追加**。
  4. 「这些小补丁完全没必要更新到 main 的 PRD 里去！」→ **T-068**：**放弃 PRD 更新，`main` 零提交**。
  5. 「3000 多行的 decision-log 合理吗？」→ **T-080**：精简至 2,150 行（**过程层移出到支撑文件，零丢失**）。
  6. 「把 interaction aggregate 当做不合理的阻塞，**彻底删除相关限制**」→ **T-083**：识别为 OI-013 点名的「内容寻址 + 回执」机器，**纳入删除面**。
- **主会话自身的 3 处真实错误（均已在材料内登记）**：自称"OI 大纲已是 questions-only 投影"（实测不是）；T 覆盖核对表算术 42 vs 43；17 条 OI 全 `open` 却称已收敛。
- **流程教训 T-079**：**禁止给子代理派「产出完整文件」型任务** —— 单次耗时 30 分钟源于生成 2800 行全文；应**只产增量片段**，拼接由主会话脚本完成。
- **流程教训 T-080**：精简时必须区分**权威层**与**过程层** —— 曾误移 4 份权威清单，导致 `spec-analyze` 报 **G-01 CRITICAL**。
- **Bootstrap 悖论（本轮末尾才发现）**：**新四阶段拓扑是本卡交付物，尚未实现**；仓库现有 `build-spec`（15 步）与 `build-plan`（13 步）两阶段仍在。**因此本卡自己必须走现有拓扑**。

## 7. 重要参考调研

**18 份报告均在** `specs/workflowhub-thin-core-card-02-20260919/research/`：

| 报告 | 主题 |
| --- | --- |
| `R-A-sdd-frameworks.md` | SDD 框架对标（Spec Kit / Kiro / Tessl / AI-DLC / cc-sdd 等） |
| `R-B-executable-specs-for-weak-models.md` | 弱模型可执行规格（含学术证据） |
| `R-C-acceptance-and-test-design.md` | 验收标准与测试设计 |
| `R-D-review-process-design.md` | 审查流程设计（含官方一手） |
| `R-E-document-leanness-engineering.md` | 文档精炼工程 |
| `R-F-specification-granularity-vs-model-capability.md` | 规格粒度 vs 模型演进 |
| `R-G-spec-narrative-and-decomposability.md` | **spec 叙事结构与可分解性（spec 结构的直接来源）** |
| `I-A-current-material-quality-audit.md` | 现有材料质量体检 |
| `I-B-build-spec-build-plan-quality-core.md` | **K1–K12 与 15/13 步机制表** |
| `I-C-card-05-review-scope.md` | CARD-05 审查范围与边界 |
| `REQ-full-inventory.md` | **316 需求单元全量清点** |
| `DIV-option-space.md` | **103 个扩散选项** |
| `RC-make-decision-omission-root-cause.md` | **根因对 R-1/R-2** |
| `RC-card-07-scope-and-boundary.md` | CARD-07 边界与六条出路 |
| `RC-rejected-25-triage.md` | 25 条三分类（A11/B7/C7） |
| `RC-card02-requirement-coverage-check.md` | CARD-02 40 条覆盖核查 |
| `MERGE-two-stages-consolidation.md` | **两阶段合并账** |
| `MERGE-template-gap-analysis.md` | 模板差距分析 |

## 8. 关键事实与数据状态

- **当前材料**：`decision-log.md`（**2,150 行**，sha256 `ed911b826dc19158323c91d1c798e491575045993f0256574d244dbc02d45966`）
- **过程层支撑文件**：`quality/evidence/decision-log-process.md`（1,210 行，sha256 `4eaadf4ff2f252775043a5b1930ccee0ad9c9dda6e02167a5d5181611677f742`）
- **审查原件**：`quality/reviews/direction-advice-report.md`（24 findings）｜`quality/reviews/detail-advice-report.md`（25 findings）
- **spec-analyze**：`quality/evidence/stage-end-spec-analyze.md`（结论 `inconsistent`，17 条 gap 已逐条修复）
- **阶段复盘**：`quality/stage-reflection/make-decision/e4d17a8c….json`（sha256 `030dc72c…`；**`degraded`**）
- **覆盖矩阵三层**（**已知范围内闭合**，316 为**下界**）：第 1 层 18 组 = 316；第 2 层 99 接受 + 128 偏离 + 89 拒绝 = 316；第 3 层 L 表 = 0/14/25 = 39
- **CARD-02 覆盖核查**（40 条）：完整 **30** / 部分 **9**（已补）/ 真缺口 **1**（已补）
- **未闭合与 unavailable（必须原样可见）**：
  | 项 | 状态 | 原因 |
  | --- | --- | --- |
  | AC-07/AC-08 真实 task 抽验 | **未闭合** | fixture 仅 smoke test；**交 CARD-10**（T-070 / D-006） |
  | AC-06 全局度量 | **已改写 + 登偏离** | 改为「已知事实清单内 0 处」；**不写回 PRD**（T-076 / G-09） |
  | 正式 run 路径 | **未验证** | 362KB > `TASK_BOUND_PROVIDER_INPUT_MAX_BYTES` 300KB，物理不可行（T-075） |
  | 审查证据锚点 | **部分 unknown** | `codex/luna` 30 条无 `line` 字段 → 不得宣称行级锚点已验证 |
  | `interaction aggregate` | **删除面（非缺失）** | T-083：命中 OI-013「内容寻址 + 回执」 |
  | `antigravity/flash` | **不可用** | 两次 `AUTHENTICATION_FAILED` |
  | 阶段复盘 | **`degraded`** | 无 `human-confirmation.v3` 原件；未经正式 `run --action=reflect` 发布 |
  | 316 逐单元账 | **下界，不逐条展开** | U-002-14「等等等等」（T-071 / G-16） |

## 9. 成功与失败边界

- **成功**只表示本阶段或本 hook 的**实际记录已写入**；不表示下游已通过。
- 本卡的**完成宣称 = 交付物就绪、真实抽验未闭合**（T-070）。**不得宣称 AC-07/AC-08 已满足**。
- **失败、unavailable、unknown 与 stale 不得改写为完成**；`degraded` reflection 与 bare 路径审查不得包装为 pass。
- `outline_closed` 概念**已随 T-083 删除**（不再是缺口）。

## 10. 未决项与风险

- **重大风险 6 组**：越 CARD-07 写面（R-35~38）｜ 扩散交 CARD-07 易复发（R-44）｜ `merged-review` 伪合并（R-50）｜ 附件主干双写（R-57）｜ 附件表单化（R-64）｜ 内置检查项被跳过（R-66）。
- **承接与不承接**：见 `decision-log.md` 的 `### 承接与不承接清单`（含 CARD-03/04/05/06/07/08/10 的承接项与四个无人负责空白的归属）。
- **未决项四要素**（owner / 触发条件 / 交接 / 关闭条件）：见 `### 未完成验收项登记`（过程文件）与承接清单。
- **复盘六区块**（`what_helped` 6 / `what_to_improve` 5 / `blockers` 4 / `intervention_reasons` 6 / `what_to_simplify` 4 / `simplifiable_now` 4）见 reflection 原件。

## 11. 下一步动作

- **进入 `build-spec`（现有阶段，15 步）** —— **不是**新 build-plan。
  - 原因（**bootstrap 悖论**）：新的四阶段拓扑（`make-decision → build-plan → build-code → verify-code`）与 13 步 merge 版 **是本卡自己的交付物，尚未实现**；仓库现有 `workflows/build-spec/` 与 `workflows/build-plan/` 两阶段仍在。**本卡必须用现有拓扑跑完自己**（card-01 亦如此：build-spec 收口 → build-plan 产出）。
  - **只有交付物落地（build-code）之后**，新拓扑才可供后续卡使用。
- build-spec 只消费当前材料与正式质量原件；**不得**自行猜 A/B/承接清单的条目、未完成项的位置、OI 的现行口径、S7 与附件 A 的列数。
- 交付物清单 11 项见 `T-059`；其中 **R-1/R-2 校验器修复**与 **检查器兼容修复** 是 **build-code 交付物**（本阶段只登记需求与验收判据，未改代码）。

## 12. 待读文件清单

按顺序：

1. `specs/workflowhub-thin-core-card-02-20260919/decision-log.md`（**材料，2,150 行**；权威）
2. `specs/workflowhub-thin-core-card-02-20260919/quality/evidence/decision-log-process.md`（过程层与审查明细）
3. `specs/workflowhub-thin-core-card-02-20260919/quality/reviews/direction-advice-report.md`
4. `specs/workflowhub-thin-core-card-02-20260919/quality/reviews/detail-advice-report.md`
5. `specs/workflowhub-thin-core-card-02-20260919/quality/evidence/stage-end-spec-analyze.md`
6. `specs/workflowhub-thin-core-card-02-20260919/research/`（18 份报告；`drafts/` 3 份草稿）
7. 母 PRD：`specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md` 的 `### CARD-02`（**只读**）
8. 兄弟卡只读：`/Users/Hugh/Hugh/Project/workflowhub-workflowhub-thin-core-card-01-20260919/specs/workflowhub-thin-core-card-01-20260919/`（阶段/材料接口蓝图 FR-IFACE-002）

> `spec.md` / `plan.md` / `tasks.md` **尚不存在**（由 build-spec / build-plan 产出）。

## 13. 可自行判断与必须问用户的边界

- **可以自行判断**：读取上述文件、正式原件与本 handoff 的指针；按 build-spec 既有流程执行；修复实施级 finding 并登记处置。
- **必须问用户**：
  1. 任何**方向级**或**影响验收**的变更；
  2. 范围变更（尤其**越其它卡写面**的改动，如 R-35~R-38）；
  3. **不可逆 Git 动作**（commit / push / merge / archive / cleanup）；
  4. 母 PRD 的任何写回（**T-068：`main` 零提交**，须先取得明确授权）；
  5. 承接清单中**分配给其它卡**的项是否要改归属；
  6. 删除面（尤其 T-083 的 7 处）的实施范围确认；
  7. 新拓扑（四阶段 / 13 步）**何时开始生效**（bootstrap 悖论的收口时点）。

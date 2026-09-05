# Decision Log — workflowhub-ui-frontend-capability-20260904

> 阶段：make-decision（调研+方向确定，未进入 build-spec）
> 创建：2026-09-04
> 认证 worktree：`/Users/Hugh/Hugh/Project/workflowhub-workflowhub-ui-frontend-capability-20260904`
> 分支：`task/workflowhub/workflowhub-ui-frontend-capability-20260904`（基于 main f4f2ae20b）
> 最近更新：2026-09-04（用户要求「继续」并给出明确五步）

---

## 原始需求

用户在 PB-T08（PaperBuilder 模拟记录/工作台/策略列表对齐设计稿）前端改造任务中，连续人工参与 20+ 小时、多会话往返，才最终实现 UI 效果。用户要求：

1. 基于 workflowhub 的 make-decision 流程新建一个 worktree；
2. 把之前调研的结论整理好，存储在新任务的任务 spec 文件夹中；
3. 使用 anysearch 看看 VibeCoding 中 UI 设计和前端开发的最佳实践、最佳流程、最佳规范应该是怎样的；
4. 基于调研结果和之前的问题分析，仔细分析 workflowhub 目前有哪些能力、又缺少哪些能力；
5. 派出多个子代理研究 https://github.com/vaferkhanom/Website-skills 的 P0 级技能和部分 P1 级技能：这些技能是做什么的？workflowhub 的前端技能能否被替代？是否应添加更多专业 UI 设计/前端技能？

**最终目标**：基于以上调研产出一份更详细、更专业、符合调研结果与 workflowhub 前端现状的**完整改造方案**，使 workflowhub 具备专业 UI 设计与前端开发能力——尤其是有 UI 设计稿时能 100% 复现设计稿的样式和细节，避免未来前端任务再次出现低质量、长时间返工。

### 需求—决策覆盖矩阵

| 维度 | 需求 | 处置 |
|---|---|---|
| 业务目标 | 提升 workflowhub 对未来 UI 前端任务的产出质量/效率，实现"设计稿 100% 复现"能力 | 作为任务核心目标（见下方核心需求卡） |
| 流程/界面 | 基于 make-decision 新建 worktree；研究结论存 spec 文件夹 | 已完成/进行中：worktree 已建（见上），材料写入本 spec 目录 |
| 数据/状态 | 调研输入：两份教训文档（T08 复盘、luna 版调研）、PB-T08 会话证据、anysearch 外部调研、Website-skills P0/P1 技能研究 | 全部作为证据收集，不做二次臆测 |
| 成功/失败/验收 | 产出完整改造方案；方案必须可直接指导 workflowhub 改造（哪些能力新增/替换/接线，优先级、落地形式、与宪法/现有机制的兼容） | 验收：方案文档落盘于本 spec 目录；用户审阅确认 |
| 约束/非目标 | 不实际实施改造（本任务只做调研+方案）；不新增 workflowhub stage/gate 违背宪法；不动 PaperBuilder 代码 | 记录为 non-goal / 延期项 |

## UI applicability

```json
{"result":"ui","sources":{"raw_requirement":"用户要求提升 workflowhub 面向 UI 前端任务的产出能力（设计稿 100% 复现），研究来源为 UI 前端项目（PB-T08）","project_inventory":"workflowhub 自身无 web 前端应用（仓库根目录无 frontend/apps/web），其前端能力体现在 skills/ 与 workflows/ 中面向消费者项目的前端技能族（8 个前端相关技能）","planned_or_changed_frontend_fact":"本任务直接产出物为 workflowhub 前端能力改造方案（skills/workflows/schemas 层），会实质影响未来 UI 前端任务，属 ui 相关"}}
```

## 核心需求卡（大白话）

- **核心需求**：让 workflowhub 具备专业的 UI 设计与前端开发能力，尤其在有 UI 设计稿时能 100% 复现其样式细节。
- **核心目标**：把 PB-T08 中"20+ 小时人工、5 轮返工、30 个缺陷"的教训，转化为 workflowhub 中可复用的机制（技能/流程/工具/证据 schema），使同类任务一轮收敛。
- **选定方向**：以仓内 2026-08-22 已定主链「确认视觉方向 → 冻结设计源 → 静态组件拼版 → 接真实行为 → 三类验收」为骨架，**Design.md/Experience.md 中心制**为规范层，补齐执行侧（设计稿数字化 → 组件对照 → 视觉感知/diff → 收敛）+ 规则弹药（Website-skills 按类移植），不新增 stage/gate，保持宪法约束。

## 调研记录（时间线）

- 2026-09-04 用户明确五步任务；按流程新建 worktree + spec 目录（见上）。
- 2026-09-04 完成两份教训文档全文研读（`/Users/Hugh/Downloads/T08前端改造复盘-WorkflowHub前端质量优化.md`、`/Users/Hugh/Downloads/workflowhub前端优化调研（luna版）.md`）；关键结论摘要见 `evidence/research-pbt08-lessons.md`。
- 2026-09-04 anysearch 两轮共 8 组查询 + 3 篇深度来源精读（monday.com Figma→Code、kaelig 8-agent 设计系统流水线、yureki 截图反馈回路）；结论见 `evidence/research-vibecoding-best-practices.md`。
- 2026-09-04 Website-skills 仓库结构确认（124 skills，P0/P1/P2 分级，来源 Vercel/Emil Kowalski/Jakub Krehel 等）；精读分两轮：第一轮 P0+精选 P1 约 24 个技能经 7 个子代理深读，第二轮 124 个全量分类经 3 个子代理（主题/特效/滚动叙事三组）；结论见 `evidence/research-website-skills.md`。
- 2026-09-04 workflowhub 能力盘点（8 个前端相关技能逐一确认职责边界、browser-qa-evidence.v1 唯一截图 schema、build-code/verify-code 无视觉环节、specs/archive 三次历史 UI 契约尝试）；见 `evidence/workflowhub-capability-inventory.md`。
- 2026-09-04 能力差距分析完成：`evidence/workflowhub-gap-analysis.md`（9 个缺口）。
- 2026-09-04 用户三项新要求后的补充调研（全部落盘）：①`evidence/p0-deep/`——12 个 P0 技能规则级深读笔记（~700 条可执行规则，含 impeccable ~210 条、vercel-react-best-practices 70 条 8 大类全清单、web-design-guidelines 103 条 17 大类远端快照、better-accessibility 112 条）；②`evidence/pilot-baseline-design.md`——试点基线对照实验设计（UI设计稿项目全量摸底：24 源文件 5778 行、5 页面级组件、开箱可渲染；关键坑：Figma Make 产物未遵守自家 12 色系统，视觉基准以产物渲染为准）；③`evidence/engineering-quality-integration.md`——工程质量四维度落点矩阵（扩展 frontend-component-quality 不新增技能；ADR 0016 补债：现仅 21 行手写摘要）。
- 2026-09-04 完整改造方案 v1 落盘：`evidence/frontend-capability-upgrade-plan-v1.md`（3 新技能+3 schema+3 工具+8 技能接线+规则库注入+5 里程碑+5 决策点）。**等待用户审阅确认，确认后进入 build-spec。**

## 收敛检查

| 项 | 结论 | 事实/材料引用 |
|---|---|---|
| target | workflowhub 前端能力改造：专业 UI 设计 + 前端开发能力；有设计稿 100% 复现、无设计稿 build-spec 阶段先设计不许自由发挥；PB-T08 类任务 5 轮→1-2 轮、用户 5 轮人肉 QA→1 次确认 | 核心需求卡；R1/R2 决策 |
| scope | 本任务：调研+决策+完整方案（已完成）；后续任务：M0-M5 实施（本任务不含实施编码） | 用户"我不想现在开始执行方案"指示；方案 v2 §8 |
| solution | 方案 v2：2026-08-22 骨架 + Design.md/Experience.md 中心制 + 3 新技能+3 schema+4 工具+10 处接线 + Website-skills 按类混合移植（7 复制/22 并入/23 参考/~80 不引入）+ M0-M5 里程碑；**取舍**：放弃逐像素完美（选矩阵全绿+MINOR 容忍）、放弃硬 gate（选 incomplete 诚实声明）、放弃整族 vendor（选按类混合）；**拒绝项**：新增独立设计阶段（违宪法）、全部直接复制 124 技能（淹没技能库）；**遗留项**：M5 试点任务待定、各技能登记的具体 commit 在 build-spec 时固定 | `evidence/frontend-capability-upgrade-plan-v2.md` |
| acceptance | 场景：下一个真实 UI 任务走新链路；数据源：该任务的 parity 矩阵/diff 报告/返工轮次/缺陷数/人工小时；通过条件：返工轮次 ≤2、缺陷数 ≤10（PB-T08 基线 30 个的 1/3）、用户视觉确认次数 =1；失败条件：任一项未达 → 记录缺口回流 build-spec 修正（n=1 试点不称统计显著，只称达到/未达到阈值） | 用户 C5 决策 + 独立审查 F3 修正 |

## 未决/延期

- 无方向级未决项（§9 决策表 18 项全部锁定：前置 3 + R1 4 + R2 4 + R3 7）。
- **移交 build-spec 的可执行待办清单**（缺任一项方案不算可实施，来自独立审查 F3/F6 + Grill 结束记录）：
  1. MINOR/MODERATE/CRITICAL 分级标尺可执行表（固化进 ui-visual-fidelity）
  2. 输入质量分数扣分模型（0-1，确定性扣分项清单）
  3. 收敛度量口径终稿（parity 新增 PASS 停滞判定 + 轮次上限）
  4. 逐技能 LICENSE 审计表（30 项移植逐一登记）
  5. CONTEXT.md 新术语写入（design-extract / parity checklist / 验收对象卡 / 设计方向六段式 / LOW_FIDELITY 确认点）
  6. ADR 0024「UI 规范层与证据层分层」正式撰写
  7. 工具 CLI 参数终稿、catalog.yaml 登记的具体固定 commit
  8. 「规格缺五要素禁止派发」边界的正式登记条目（证明来源/consumer/owner/退出条件）

## 经人确认的推进

- 2026-09-04 用户明确批准继续执行五步任务（Talk 已完成：用户以书面指令形式给出方向，无需额外提问轮）。
- 2026-09-04 用户对方案 4 个决策点给出确认：① 前端栈 React/Next.js 为主（react-best-practices 先迁 HIGH+ 子集）② 设计源以可渲染设计源为主（双源交叉为主模式）③ 运行环境有视觉能力（perceive 走多模态、diff 双轨）④ M0 不提前实施——**先审阅方案 v1，确认后再统一进入 build-spec**。决策已回写 `evidence/frontend-capability-upgrade-plan-v1.md` §9。

## Talk Round 4 结果（2026-09-04，用户三项新要求的决策点）

| 轴 | 用户决策 | 备注 |
|---|---|---|
| R4-1 基线范围 | **SimulationBoard + SimWorkbench 两页**（T08 三页之二，直接可比） | |
| R4-2 基线载体 | **Next.js 目标仓（非 Vite）**——设计稿本身是 Vite+React 源码，同栈会被直接抄源码污染实验；**实现侧禁止读取设计稿源码，提取器输出是唯一设计规格来源** | 同时真正考验提取器 |
| R4-3 B0 基线 | **真跑**：改版前用当前 workflowhub 实现一遍（~0.5-1 天），改造开工前完成 | |
| R4-4 工程质量落点 | **扩展 frontend-component-quality**（不新增技能） | 调研结论支持 |
| R4-5 违规语义 | **记事实交 owner 裁决**（性能/组件规范违反不阻断） | 宪法兼容 |

## 调研记录（时间线·续）

- 2026-09-04 P0 深读全部完成：12/12 技能规则级笔记落盘 `evidence/p0-deep/`（impeccable ~210 条/better-ui 24 条/interface-review ~22 条/web-design-guidelines 103 条/better-accessibility 112 条/vercel-composition-patterns 8 模式 30 子规则/vercel-react-best-practices 70 条 8 大类/animate 5 铁律+13 Never-Ship+14 配方/animation-vocabulary 12 类 91 词条/better-colors 78 条/better-typography 90 条/better-layout 46 条）。
- 2026-09-04 试点基线设计落盘 `evidence/pilot-baseline-design.md`；工程质量落点矩阵落盘 `evidence/engineering-quality-integration.md`。
- 环境事实：后台子代理本环境系统性失败（6/6 无产出），前台子代理正常（5/5 成功）——后续调研统一前台执行。

## 当前状态（v4·已收尾）

- **2026-09-04 用户最终确认收尾**（"可以先收尾了。不要进 build-spec"）。本任务 make-decision 阶段**正式结束**，方案冻结为 v3，决策 23 项锁定，不进入 build-spec。
- 最终成果：`decision-log.md`（本文件）+ `evidence/frontend-capability-upgrade-plan-v2.md`（方案 v3）+ `evidence/p0-deep/`（12 个 P0 规则级笔记）+ `evidence/pilot-baseline-design.md` + `evidence/engineering-quality-integration.md` + `evidence/research-website-skills.md` + `evidence/workflowhub-gap-analysis.md` + 官方审查证据（`~/Knowledge/Projects/workflowhub/tasks/<task>/quality/reviews/`，attempt 5 方向 + attempt 2/3 细节）。
- 审查汇总：独立 10 + 官方方向 16 + 官方 detail 16+16 = **58 findings 全部处置**。
- 交互聚合（process §2 step 11）：session-event 工具路由在本宿主不可用且本任务未注册运行时 task——记录为宿主限制，事实以本文件 Talk/Grill/审查记录为准。
- 外挂修复：3rd-review 仓配置模板修复已提交 main（`4a746dc`）；长期建议（broker 超时配置化）记入 build-spec 移交清单。
- **移交 build-spec 待办（重启时执行，10 项）**：分级标尺表、质量分扣分模型、收敛度量口径、9 维比对清单+visual-diff-report.v1 结构、P1/P2/P3 测量契约（分母/计数单位/轮次边界/停滞判定）、验收对象卡字段 schema+校验器、逐技能 LICENSE 审计表、CONTEXT.md 术语写入+ADR 0024 文本、派发边界正式登记条目、工具 CLI 终参数+固定 commit。

### 任务群 PRD（2026-09-04，用户指示：不走单 spec 路径，产出任务群 PRD）

- 产物：`prd-ui-frontend-capability.md`——10 任务/6 波次拆解（T01 B0 基线 → T02 M0 → T03 M1 → T04 P1 → T05 M2/T07 M4a/T08 M4b → T06 M3 → T09 P2/T10 P3），每卡含来源决策/FR/AC/风险失败边界/素材索引；23 项决策→任务映射（附录 A）逐条核实。
- 流程遵循 build-spec（调研：读 build-spec 本体+参考 mattpocock/skills 的 wayfinder/to-spec；澄清：一批 4 问 C1-C4 用户已答；撰写；审查；处置；一致性检查）。
- 审查证据（官方 wh-review，修复后路线）：attempt 1 available（antigravity/flash 完成，5 findings：1 blocking/3 major/1 minor，全部处置——依赖表 T01 红线/owner 缺省回退 FR/缺陷稿 FR/移植归属冲突/质量分 <0.8 分支）；attempt 2 available（kimi+antigravity 完成，13 findings：0 blocking/8 major/5 minor，全部处置——B0 测量契约时序倒挂→最小契约前移 PRD §8、消歧协议/环境守护/QA 技能承接缺口、T10 依赖补 T05/T06、T04 锁定有稿+禁读源码、T06 补 approved-deviation/overlay FR、预估口径统一）。证据：`quality/reviews/prd-review-20260904-attempt1.json`、`attempt2.json`。
- 用户澄清决策：C1 粒度从 ~21 减到 10 任务；C2 每任务走完整五阶段（make-decision 轻量确认）；C3 标注并行波次；C4 任务卡字段=标准+风险失败边界+素材索引。

## Talk Round 1 结果（2026-09-04）

| 轴 | 用户决策 | 备注 |
|---|---|---|
| A1 改造深度 | **全链路一次到位 M0-M5** | 不留缺口 |
| A2 技能形态 | **至少 3 个独立新技能 + 扩展现有 8 个，且需进一步调研**：Website-skills 中哪些直接复制为独立技能、哪些概念并入现有技能、哪些作为辅助参考——要求出完整分类清单 | 待 Round 2 全量分类调研后收敛 |
| C1 验收标准 | **对照矩阵全绿 + MINOR 容忍清单**（CRITICAL/MODERATE 必修，MINOR 记录并交用户确认） | 锁定 |
| C2 完成声明边界 | **缺视觉证据 → 完成声明必须标 incomplete 并附原因**（符合宪法 unknown/unavailable 不伪造通过） | 锁定 |
| C3 触发条件 | 有设计稿的 UI 任务走全套复现协议；**无设计稿的任务同样不允许在 build-code 随意发挥——必须在 build-spec 阶段基于设计规范+需求把 UI 设计好** | 新增重大需求：workflowhub 需同时具备「原创 UI 设计能力」（不只是复现能力）——Round 2 需讨论设计阶段产物与流程 |

## 待收敛（Round 2+ 计划）

- ~~B1/B2/B3：Website-skills 124 个技能全量分类~~ → Round 2 已收敛
- ~~C3-extension：无设计稿任务流程~~ → Round 2 已收敛（统一链路）
- ~~A3~~ → Round 2 已收敛（含 Design.md/Experience.md 中心地位决策）
- ~~C4~~ → Round 2 已收敛（tools/cli + agent-browser）
- ~~C5~~ → Round 2 已收敛（下一个真实任务试点）
- 剩余：A4 其余工具落点随 C4 同模式；里程碑排期细节移交 build-spec/build-plan

## Talk Round 3 / Grill 结果（2026-09-04，处理独立审查 findings 后的方向批次，7 轴全部锁定）

| 轴 | 用户决策 | 备注 |
|---|---|---|
| F2 派发约束正名 | **登记为已证明边界**：「规格缺五要素禁止派发」按宪法 F5/F11 正名登记（写明 PB-T08 证明来源、consumer=build-code 派发、owner=build-code UI handler、退出条件），不用"材料完整性规则"措辞绕过 | blocking 消解 |
| F4 实施节奏 | **M1+M5 先行小闭环**：先建提取+对照薄闭环，真实 UI 任务试点验证后再铺开 M2-M4 | 里程碑已重排（plan v2 §8） |
| F7a 低质量输入 | **进入人工确认点**：LOW_FIDELITY（静态稿）或质量分 <0.8 → 暂停，呈现提取结果+不确定项，用户确认/补充后才进 build-code | 防 GIGO |
| F7b 设计 owner 缺省 | **缺省=用户本人**：owner 未显式指定时所有设计裁决找用户 | 流程不悬空 |
| G1 回写时机 | **任务内即时回写**：新 pattern/规范经设计 owner 确认后立即回写 Design.md/Experience.md，随任务证据可追溯 | 两文件始终最新 |
| G2 缺陷稿处理 | **照抄+缺陷清单交用户裁决**：忠实复现优先，同时产出专业缺陷清单（对比度/a11y/动效），用户决定是否偏离设计稿 | 忠实与专业兼顾 |
| G4 分级标准 | **固化在 ui-visual-fidelity 技能**：MINOR/MODERATE/CRITICAL 标尺全项目统一，build-spec 时写成可执行表 | 跨项目可比 |

## Grill 结束记录（grill-with-docs 合同要求）

**覆盖矩阵**（本任务已认证原始消息五类）：goal ✅（msg1/2/3/5：PB-T08 教训→改造方案→100% 复现→收敛不实施）；flow_or_surface ✅-n/a（本任务不直接做页面，产出是 workflowhub 能力与材料；下游 UI 任务的 flow_or_surface 由验收对象卡+Screen Read Map 覆盖）；data_or_state ✅（3 schema+两文件中心制+证据分层）；success_failure_acceptance ✅（C1/C2+M5 可证伪阈值）；constraint_non_goal_defer ✅（不实施/不新增 gate/不做清单/延期项）。无整个消息类缺失。

**四项退出检查**：
1. 外部依赖接口核实：agent-browser（宿主已安装✓）、3rd-review broker（配置真实存在但本环境 provider 池不可达=真实 unavailable✓ 已记录）、Figma MCP（降级模式，未核实=记录）、视觉模型（用户确认有✓）→ **pass（带已记录缺口）**
2. 字段/路径命名唯一权威：3 schema 名/3 技能名与现有 40 技能无重名（已核对）；CONTEXT.md 已有"设计源（Design.md）""UI Contract"无冲突 → **pass**
3. 失败路径语义：extractor 三模式降级+LOW_FIDELITY 人工确认点、服务挂=验收对象卡 health check、视觉模型不可用=纯数值+DOM 几何降级、规格缺要素=已证明边界禁止派发 → **pass**
4. 范围边界写死：方案 v2 §9 决策表+不做清单+收敛检查 scope → **pass**

**CONTEXT.md**：`changed（待实施阶段写入）`——新增术语：design-extract / parity checklist / 验收对象卡 / 设计方向六段式 / LOW_FIDELITY 确认点。
**ADR**：`created（build-spec 阶段撰写，本草稿即决策依据）`——拟定 ADR 0024「UI 规范层与证据层分层（Design.md/Experience.md 中心制）」。三项判据：难以反转=真（规范中心制一旦铺开回退成本高）；无背景会意外=真（为何 schema 不是规范）；存在真实取舍=真（两文件维护成本 vs 无规范的返工成本）。
**与现有 ADR 冲突**：ADR 0015（design-source-readiness 不打分）→ 已遵（质量分归 design-extractor）；ADR 0016（外部移植模式）→ 已遵并据此修正方案；无未解决冲突。

## Talk Round 2 结果（2026-09-04）

| 轴 | 用户决策 | 备注 |
|---|---|---|
| B1 移植总原则 | **按类混合**：7 个自含技能复制登记（+1 个 ADR 0016 既定 vercel-react-best-practices=8 条 external 登记）、概念并入现有 8 技能、24 个进 references 按需、69 个不引入 | 分类全表：`evidence/research-website-skills.md` §3（计数口径见该节） |
| B2 暗色皮肤三技能 | **进 references 按需加载**（不复制为常驻技能，避免皮肤 token 覆盖项目 Design.md） | dark-glass-clean-layout / framed-tech-dark-border-gradient / glass-dark-ui |
| C3-ext 无稿任务流程 | **统一链路**：build-spec 内走 original-design 子流程（ui-project-init 建/读基线 → 六段式设计方向+规范收敛 → prototype-render 出效果图 → 用户确认 → 冻结为设计源绑 path+SHA），build-code 走与有稿任务**完全相同**的复现协议 | 沿用仓内 2026-08-22 已有设计，不新增 stage，全任务一条链 |
| A3 新 schema | **三个都要**（design-extract.v1 / ui-parity-checklist.v1 / visual-diff-report.v1），**但**：项目根目录 `Design.md` + `Experience.md` 是风格/样式/组件/交互的**核心规范文件**，整个 UI 设计与前端开发工作流围绕这两个文件展开（读取/遵守/维护/回写）；schema 是任务级证据层（"执法记录仪"），记录每次任务的提取/对照/比对事实，辅助而非取代规范层 | **架构级决策**：两文件中心制。详见下节「核心架构决策」 |
| C4 提取器实现 | **tools/cli 脚本 + agent-browser 驱动**（双源交叉：设计源码意图 + 浏览器 computed style 真实值）；技能本体只写流程与格式契约，渲染经宿主路由 | 同模式适用于 ui-capture、css-hygiene、edge-battery |
| C5 试点 | **下一个真实 UI 任务直接用新链路**，与 PB-T08 基线（5 轮/30 缺陷/20+ 人工小时）对比 | 不回放旧任务 |

## 核心架构决策（2026-09-04，用户在 Round 2 A3 中提出并确认）

**Design.md / Experience.md 中心制**：
1. 项目根目录 `Design.md`（风格/样式/token/组件规范）与 `Experience.md`（交互/旅程/状态规范）是所有 UI 设计与前端开发的**核心规范参考与权威来源**；
2. 整个 UI 工作流围绕这两个文件：**建立**（ui-project-init）、**读取**（design-source-readiness/extractor/build-code）、**遵守**（build-code 只许用登记的 token/组件，新 token 须登记 owner/consumer/删除条件）、**维护**（任务中确认的新 pattern 经设计 owner 确认后回写）；
3. 三个新 schema（design-extract/parity-checklist/visual-diff-report）是**任务级证据层**：记录"本次任务实际提取到什么、实现差在哪、谁确认的"，辅助两文件的执行与验收，永不取代两文件的规范地位；
4. 设计稿值与项目 token 冲突时显式记录交设计 owner 裁决，不得静默选边；
5. 与宪法 F3 的兼容：两文件是**项目级外部设计源**（设计 owner 维护的输入），不是 workflowhub 第五份任务材料；spec.md 只绑 path+SHA（沿用 2026-08-22 历史设计）。

## 重要发现（2026-09-04，Round 2 前置）

workflowhub 仓内已有 2026-08-22《UI 与前端：最小可执行流程设计》（`docs/research/ui-frontend-simple-workflow-design-2026-08-22.md`），且**已大部分落地**：
- 已定流程：确认视觉方向 → 冻结设计源 → 静态组件拼版 → 接真实行为 → 三类验收（行为/视觉/意图，互不替代）
- 已定模式：`reference-reproduction`（忠实还原）vs `original-design`（原创探索）双模式；`original-design` 下"第一张效果图必须经设计 owner 确认再冻结为设计源"——**这正是用户 C3 补充（无设计稿也不许 build-code 随意发挥）的已有答案**
- 已定 Design.md 身份：外部设计源，spec.md 只绑 path+SHA，不当第五材料（宪法 F3）
- 已定 UI Prompt 十项结构、UI Contract 小节（build-spec L90/104/130/133 已落地）、plan-design-review lens（已存在）、四条硬边界（一层 token 权威/一处样式 owner/一条数据入口/一条例外记录）、低成本豁免分级
- **结论**：「未来 UI 设计与前端开发流程和标准」的骨架已存在，本任务不是重造流程，而是 (a) 确认该流程为标准、(b) 补齐执行侧缺口（提取/对照/视觉 oracle/收敛/规则弹药）、(c) 决定技能移植清单。方案 v1 需在 Round 2 收敛后修订为 v2，显式建立在该历史设计之上。

## Grill 自查发现（2026-09-04，对照 ADR 核实，两项必须修正方案）

1. **ADR 0015 冲突（已接accepted）**：`design-source-readiness` **明确不打分**（"只生成阅读地图与缺项事实，既不打分也不替代 owner 或 Preview 的人工确认"）。方案 v2 中"design-source-readiness 新增质量分数"与此冲突 → **修正：输入质量分数归 `design-extractor`（design-extract.v1），design-source-readiness 保持不打分**。
2. **ADR 0016 既定移植模式（accepted 但未落地）**：外部技能移植已有 accepted 模式——`skills/external/<name>/` 完整放入 + 固定上游 commit + 保留 LICENSE/UPSTREAM（ADR 0016 已定 vercel-react-best-practices 固定 `vercel-labs/agent-skills@dd089a8c` 完整放入作 code-lens）。实测 `skills/external/` 目录不存在（ADR 决策未实施）。→ **修正：技能移植一律按 ADR 0016 模式（skills/external/ + 固定 commit + LICENSE/UPSTREAM）；vercel-react-best-practices 按 ADR 用官方仓固定版本完整放入（非 Website-skills 镜像、非 HIGH+ 子集），栈前提用户已确认 React/Next 为主**。
3. **术语自查**：CONTEXT.md 已有"设计源（Design.md）"（L52）与"UI Contract"（L34）定义，无冲突；新增术语（design-extract / parity checklist / 验收对象卡）待 Grill 结束后登记 CONTEXT.md。
4. **命名唯一性**：design-extractor / ui-parity-checklist / ui-visual-fidelity 与现有 40 个技能无重名（已核对 skills/ 目录）。

## 独立审查事实（wh-review simple-runner 路径，如实记录全部 attempt）

> 说明：本任务未在 workflowhub runtime 注册 TaskHandle（本会话为 DSH 宿主，task-bootstrap 未执行），故审查走 simple-runner 路径（真实 3rd-review broker、真实异源 provider、材料冻结+哈希），非 task-bound E2E 路径。证据落 `~/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-capability-20260904/quality/reviews/`。

- attempt 1（direction，手工指定 providers=[claude-code/opus, codex/luna]）：**unavailable**，`REVIEW_BROKER_EXIT_NONZERO: reviewMode is unsupported`——我方注入 route.mode 错误（provider-smoke 不在允许集），已修正为 single_round。**教训：provider 选择应由 `~/.config/workflowhub/config.json` 信任配置路由决定，调用方不得手工挑选**（用户指正）。
- attempt 2（direction，手工指定 kimi/k3+grok/grok）：**unavailable**，`REVIEW_EXECUTION_TIMEOUT: PROCESS_TIMEOUT`。
- 探针（最小材料，pi/v4flash）：**unavailable**，`AUTHENTICATION_FAILED: provider process exited with 1`——provider 池从本环境不可达（认证/网络层）。
- 探针（claude-code/opus+kimi/k3）：**unavailable**，PROCESS_TIMEOUT。
- attempt 3（direction，**零覆盖走信任配置路由**：kimi/coding / antigravity/flash / codex/luna，single_round）：**unavailable**，PROCESS_TIMEOUT，无 provider 返回。
- detail attempt 1（**零覆盖走信任配置路由**：kimi/coding / grok/grok / pi/v4flash / antigravity/flash / codex/luna）：**unavailable**，PROCESS_TIMEOUT。

### 官方 detail 复审 v3（attempt 3，2026-09-04，基线实验+P0 深读+工程质量新材料）

- 结果：**available**；kimi/coding + antigravity/flash + codex/luna completed（grok/pi 组内 failed，minimum_heterologous=1 满足）。证据：`quality/reviews/make-decision-detail-review-20260904-attempt3-v3.json`。
- **16 findings（2 blocking/9 major/5 minor）全部处置**：

| # | 级别 | finding | 处置 |
|---|---|---|---|
| DB1/DB2 | blocking | 附录基线设计与 R4 决策冲突（Board 页/Vite 载体/允许读源码）；实验协议不自洽 | 方案 §8 新增「对照实验协议（唯一权威版）」；附录头部加效力声明（以 §8 为准） |
| DM1/D13残留 | major | §6 计数残留旧数（22/23/~80）；8+24+24+69=125 口径错 | 统一 ①7/②24/③24/④69=124 ✓（vercel-react-best-practices 计入①7，取件走官方仓） |
| DM2 | major | P2"较 B0 显著收敛"不可证伪 | 改绝对口径：CRITICAL/MODERATE=0 + MINOR 全列容忍清单确认；相对 B0 只作数据呈现 |
| DM3 | major | B0 双重约束下无设计输入 | 协议精确化：B0=现状流程可读源码（复现 PB-T08 做法）；P1/P2=实现侧禁读、提取器输出唯一规格来源；提取器属设计源读取侧不受禁读约束 |
| DM4 | major | M0-M4 无里程碑承接工程质量四维度扩展 | M4 加入 frontend-component-quality 四维度扩展开发（SKILL+check 脚本+references） |
| DM5 | major | 同稿同范围 vs 双模式覆盖互斥 | B0/P1/P2 全部 reference-reproduction；original-design 另设 **P3 试点**（无稿真实任务） |
| DM7 | major | MINOR 是否算绿未定义 | §1.2 明确：MINOR 不算绿；判定=全绿 ∨ 仅剩 accepted-minor（经用户确认） |
| Dm1 | minor | v3 状态残留"R4 待确认" | 已改"R4 已锁定" |
| Dm2 | minor | 工具计数 §0 vs §3 不一致 | §3 标题改"新工具 ×2 + 规则包 ×1 + 技能内清单" |
| Dm3 | minor | 验收对象卡时序矛盾（make-decision 时 spec.md 不存在） | 意图记入 decision-log，build-spec 落成 spec.md UI Contract 区块 |
| Dm4 | minor | 提取器是否属"禁读源码"边界未定 | 已澄清（见 DM3） |

### 官方路线根因分析与修复（2026-09-04，用户指示停用子代理审查、修官方路线）

**根因（两个，均实证）**：
- **RC1 超时**：workflowhub `ReviewProviderClient` 本地超时写死 120s（`DEFAULT_REVIEW_BROKER_TIMEOUT_MS`），而真实 CLI 组审查（3 provider × 40KB 材料）需数分钟——单 provider 最小 prompt 探活都要 7-15s。120s 必然 PROCESS_TIMEOUT。**修复**：审查调用注入 `timeoutMs=1_200_000` 的 client（合法依赖注入，不动 provider 选择）。长期建议：超时进信任配置可配（记入 workflowhub 改进待办）。
- **RC2 模型名过期**：kimi CLI 的 provider 已改名 `kimi-code/*` → `kimi-for-coding/*`（`~/.kimi-code/config.toml` 实证）；pi CLI 的 provider 是 `cc-switch-deep-seek/*` 与 `cc-switch-kimi-for-coding/*`（`~/.pi/agent/models.json` 实证）。信任配置与 3rd-review 配置里的旧名导致 kimi 报 model not configured、pi 报 AUTHENTICATION_FAILED。**修复**：双边同步更新 6 个 profile 的 model 名（备份：`~/.config/workflowhub/config.json.bak-20260904`、`~/.config/3rd-review/config.json.bak-20260904`）；workflowhub 加载器强制校验双边 model 一致（attempt 4 的 ROUTE_UNAVAILABLE 证实该校验生效）。
- 修复后三路由 provider 逐一真实探活通过：kimi/coding 7.2s、antigravity/flash 15.4s、codex/luna 7.1s。
- **仓库侧同源修复**：`3rd-review` 仓的 `config.example.json` 等含同样旧名，用户已指示双审通过后提交合并到 3rd-review main（workflowhub 仓仅 specs/archive 历史报告提及旧名，按治理只读不动）。

- **attempt 4**（修 timeout+单边配置）：**unavailable**，`ROUTE_UNAVAILABLE: profiles.kimi/coding.model must match 3rd-review config`（双边一致性校验拦住单边修复）。
- **attempt 5（direction，双边配置同步+20min 超时，信任路由 kimi/coding+antigravity/flash+codex/luna）：✅ available，三 provider 全部 completed，16 条真实异源 findings**（1 blocking/9 major/6 minor）。证据：`quality/reviews/make-decision-direction-review-20260904-attempt5.json`。处置见下表。

### 官方方向审查 findings 处置表（attempt 5，2026-09-04）

| # | 级别 | finding | 处置 | 状态 |
|---|---|---|---|---|
| O1 | blocking | 五要素要求"源码行号"，但 Figma/截图模式无源码 | 五要素按模式适配：code=extract 路径+源码行号；figma=节点 id+属性表；image=区域坐标+测量值 | ✅ 修 §2.1/§5.9 |
| O2 | major | Design.md SHA 冻结 vs 任务内即时回写冲突（回写改 hash 使绑定失效） | 明确语义：冻结=任务期不可变快照；回写产生新 revision 供下一任务，当前任务继续用冻结 revision；回写内容影响当前任务设计源时须 owner 重新确认+重新冻结 | ✅ 修 §1.1 |
| O3 | major | P2 阈值缺"人工小时"口径（三大痛点只证伪两个半） | P2 加阈值：用户人工介入 ≤2 小时（基线 20+）；并明确"验收确认=1"口径不含设计方向确认（original-design 原型/低保真确认另计） | ✅ 修 §8 |
| O4 | major | P1 薄闭环试点无可证伪通过/失败标准 | P1 定标准：提取覆盖率 ≥90%+parity 矩阵实际驱动派发+试点返工 ≤2 轮；失败→回 build-spec 重估 M2-M4（删去"只返工 M1 不动 M2-M4"的错误表述） | ✅ 修 §8 |
| O5 | major | CLI 只收单个 URL，不支持 code 模式双源（源码路径+渲染 URL） | `design-extract.mjs` 参数扩展：`--source <源码路径> --url <渲染URL> --mode` | ✅ 修 §3 |
| O6 | major | "逐值复制" vs "只许 Design.md token"冲突时行为未定义 | 明确：遇冲突 builder 记例外记录交 owner 裁决，不得静默近似（复用四条硬边界的例外记录机制） | ✅ 修 §1.1 |
| O7 | major | ui-capture 证据无法证明来自声明的 worktree/commit | ui-capture 记录 git commit+worktree path 与验收对象卡绑定 | ✅ 修 §3 |
| O8 | major | 核心验收标准（MINOR 标尺/扣分/收敛）决策层不可判定 | 确认已有 disposition：三者为 build-spec 必产出可执行定义；决策卡如实声明 | ✅ 已列入移交清单 |
| O9 | major | 移植清单未达可交付（③组无精确清单） | 已列入 build-spec 待办（③组 24 个精确清单+固定 commit 登记项） | ✅ 已列入移交清单 |
| O10 | minor | 处置表 F2/F4/F7 状态未回写 vs "全部锁定"声明 | 状态回写+R3 映射说明 | ✅ 修本文件 |
| O11 | minor | 决策表 #4（M0-M5 一次到位）未标注被 #13（M1+P1 先行）取代 | #4 标注"已由 #13 修订实施节奏" | ✅ 修 §9 |
| O12 | minor | 预期"60%+25% 消灭"隐含 ≤4.5 缺陷 vs P2 阈值 ≤10 不一致 | 统一口径：P2 底线 ≤10，预期目标 ≤5 | ✅ 修 §8 |
| O13 | minor | references 引入装饰库与"零装饰预算"表面冲突 | 措辞澄清：references 按需加载不进默认链，仅在用户明确要求装饰时调用 | ✅ 修 §6 |
- **结论（已被 attempt 5 推翻，保留作时间线事实）**：修复前官方路线真实 unavailable；修复后见下方 attempt 5 与 detail attempt 2——官方路线已恢复可用，异源审查证据齐备，此前的"子代理承担+强度降级"陈述作废。

### 官方 detail 审查（attempt 2，2026-09-04，修复后路线）

- 路由：kimi/coding / grok/grok / pi/v4flash / antigravity/flash / codex/luna（信任配置 detail 路由）；20min 超时。
- 结果：**available**；antigravity/flash + codex/luna completed（kimi/grok/pi 组内 failed，minimum_heterologous=1 满足）。证据：`quality/reviews/make-decision-detail-review-20260904-attempt2.json`。
- **16 条 findings（1 blocking/13 major/2 minor）**，处置：

| # | 级别 | finding | 处置 | 状态 |
|---|---|---|---|---|
| D1 | blocking | P1 要求"矩阵驱动派发"但派发接线在 M3（依赖倒挂） | 最小 parity→build-code 派发接线前移 M1 | ✅ 修 §8 |
| D2 | major | parity 输入契约要 DOM dump 但 build-spec 时页面未编码 | 两阶段契约：build-spec 以实现侧全 missing 初始化全红矩阵 | ✅ 修 §2.2 |
| D3 | major | iterate-until-verified 在 M4 移植但 M3 编排依赖（倒挂） | 该技能移植登记前移 M1 | ✅ 修 §8 |
| D4 | major | ui-capture 缺服务 URL 参数+健康检查 | 加 --url 参数+连通性探针（失败标 unavailable 不伪造） | ✅ 修 §3 |
| D5 | major | 验收对象卡无载体/字段登记（有第五材料嫌疑） | 载体=spec.md UI Contract 结构化区块；字段 schema+校验器列入 build-spec 必产出 | ✅ 修 §1.1/§2.3 |
| D6 | major | decision-log 残留"官方路线 unavailable 由子代理承担"过时结论 | 已更正（本节上方结论行） | ✅ 修本文件 |
| D7 | major | 9 维比对具体维度+diff 报告结构未定义 | 列入 build-spec 必产出（§2.3） | ✅ 列入移交清单 |
| D8 | minor | schema 表 consumer 混入生成者/缺 verify-code | consumer 列只列消费方；verify-code（经 verify-change）关系写清 | ✅ 修 §4 |
| D9 | major | P1/P2 测量契约缺（分母/计数单位/轮次边界） | 列入 build-spec 必产出（§2.3） | ✅ 列入移交清单 |
| D10 | major | 新 token 批准后当前任务无 task-local overlay 机制 | §1.1 补 overlay 机制（任务内可用、结束合并回写） | ✅ 修 §1.1 |
| D11 | major | 缺陷稿修正后偏离基线无 approved-deviation 路径 | §1.1 补 approved-deviation 记录（owner/理由/修正值/验收处置） | ✅ 修 §1.1 |
| D12 | major | verify-change/verify-code 消费断链 | 明确：verify-code 阶段消费报告，verify-change 是其证据检查技能（§4 consumer 列） | ✅ 修 §4 |
| D13 | major | 移植计数多处不一致（22/23/约80 残留） | 全部统一为 ①8/②24/③24/④69（§0/§6/证据文件/B1 行） | ✅ 已修 |
| D14 | major | 试点未规定覆盖哪种模式 | P1/P2 验收对象卡强制标注模式；两试点合计须覆盖两种模式，否则记录缺口 | ✅ 修 §8 |
| D15 | major | 两文件模板升级在 M4 但 M1/P1 已依赖 | 最小基线字段契约前移 M0；M4 做完整模板升级 | ✅ 修 §8 |
| D16 | major | 验收对象卡需 schema+校验器 | 同 D5，列入 build-spec 必产出 | ✅ 列入移交清单 |
- 独立对抗审查（2026-09-04，子代理独立上下文，材料=decision-log+plan v2+gap-analysis+CONSTITUTION+ADR 0015/0016）：**10 条 findings（2 blocking / 5 major / 3 minor），总体判断：方向成立，修正 F1-F7 后再进 build-spec**。处置见下表。

### 独立审查 findings 处置表（2026-09-04）

| # | 级别 | finding | 处置 | 状态 |
|---|---|---|---|---|
| F1 | blocking | 移植形态前后矛盾（HIGH+ 子集残留 vs ADR 0016 完整放入） | 方案 v2 §5.4/§9 统一为 ADR 0016 完整放入 | ✅ 已修 |
| F2 | blocking | 「不新增 gate」与「规格缺五要素禁止派发」矛盾 | **Talk Round 3 已裁决**：按 F5/F11 正名登记为已证明边界，方案 §7.4 已正名 | ✅ 已修（R3） |
| F3 | major | 验收指标不可证伪（全绿 rubric/扣分模型/收敛度量/试点判定缺失） | 方案 v2 已改：收敛度量=parity 新增 PASS 停滞+每区域 3 轮上限；M5 阈值可证伪（轮次≤2/缺陷≤10/确认=1）；severity 标尺+扣分表列为 build-spec 必须产出的可执行定义 | ✅ 已修（标尺细节属 build-spec） |
| F4 | major | 里程碑排期不现实（M3 编排子系统 2 天不可能；M5 试点押后返工成本无估算） | **Talk Round 3 已裁决**：M1+P1 薄闭环先行试点再铺开 M2-M4，方案 §8 已重排 | ✅ 已修（R3） |
| F5 | major | 新技能缺 S4 指标采集；固定 commit 无上游漂移检查 | 方案 v2 §7 新增第 8 条（S4 指标配套）+§6 移植纪律新增 update_policy 定期检查 | ✅ 已修 |
| F6 | major | 许可证审计缺失（多来源汇集+改造再分发） | 方案 v2 §6 新增逐技能 LICENSE 审计随登记入 catalog | ✅ 已修 |
| F7 | major | 「100% 复现」静默降级未明示；四个漏网场景 | 目标重定义已明示（方案 §9 末尾）；场景①=R3 F7a 已裁决（低保真/低分→人工确认点）、场景②=R3 F7b 已裁决（缺省 owner=用户本人）；场景③④直接补 disposition（存量无 Design.md 项目先走 original-design 建基线；非 React 栈项目 react 系技能不加载） | ✅ 已修 |
| F8 | minor | 冲突处理双标+schema owner 错位 | 方案 v2 §2.1 新增测量层/规范层冲突分层；design-extract.v1 owner 改 design-extractor | ✅ 已修 |
| F9 | minor | references 20 vs 23 不一致；验收对象卡 stage 归属不清 | 统一 23；验收对象卡改为 make-decision 记意图、build-spec 冻结绑实测值 | ✅ 已修 |
| F10 | minor | 「收敛」声明早于审查事实 | 官方路线 unavailable 事实+审查降级事实随决策卡呈交；收敛声明在 Grill+Talk R3 完成后重新确认 | ✅ 已修 |

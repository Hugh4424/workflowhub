# 任务 4：WorkflowHub 能力差距分析（基于调研结论）

> 输入：workflowhub-capability-inventory.md（现状事实）+ research-vibecoding-best-practices.md（外部最佳实践）+ research-pbt08-lessons.md（历史教训）+ research-website-skills.md（规则弹药库）。
> 结论先行：**workflowhub 的前端能力不是"没有"，而是"治理与证据骨架完整、执行与视觉闭环缺失"**。所有 8 个前端技能都对，但组合起来恰好跳过了"把设计稿变成高保真页面"最核心的 4 个环节。

---

## 1. WorkflowHub 已经有什么（别重复造）

| 能力层 | 有什么 | 评价 |
|---|---|---|
| 流程材料 | 四材料（decision-log/spec/plan/tasks）+ 需求覆盖矩阵 + 收敛检查 | 与业界"工件契约"（kaelig brief.md 必填字段）同构，是优势 |
| 设计输入 | ui-project-init（Design.md/Experience.md/fixture/viewport/Preview）、design-source-readiness（Screen Read Map + binding_state） | 管"设计输入是否存在、身份是否一致"，但**不打分、不提取像素、不生成规格**（自述明确） |
| 组件事实 | frontend-component-quality（Component Quality Map + 静态检查：重复组件/CSS 泄漏/global override/!important） | 强项：组件/consumer/CSS 事实已有机器检查；明确不碰视觉（自述） |
| 渲染原型 | frontend-prototype-render（真实组件+fixture+viewport 渲染，留 preview_ref/screenshot_ref 哈希） | 好基础，但只跑一次原型，无持续 diff 回路 |
| 浏览器 QA | isolated-browser-qa（agent-browser/browser-use 路由、session 隔离、截图、cleanup）+ browser-qa-evidence.v1（唯一视觉 schema；visual 仅 observed + screenshot_refs） | 管"怎么截、怎么存"，**不管"对不对"**——无比对逻辑 |
| 测试 | frontend-testing（状态/交互测试 + 截图事实）、fullstack-slice-testing（DTO→页面 seam） | 覆盖功能链路，**无设计稿比对/视觉 oracle** |
| 验证 | verify-change（lens-only、freshness、unknown/unavailable 诚实语义） | 哲学正确（不伪造通过），但 UI 检查项只查"证据是否存在"，不查"是否对齐" |
| 治理 | 无 gate/无新 stage、独立来源独立上下文裁决、事实不阻断、技能可搬运 | 与外部最佳实践一致，是改造的**约束也是保护** |

## 2. 缺什么：按"设计稿→高保真"链路逐环节

### 缺口 1（输入层）：没有一个"设计稿数字化提取器"
- 现状：design-source-readiness 只读 Design.md（人写的），不读设计稿本身；PB-T08 里设计稿是**可渲染的 Vite 应用 + TSX 源码**，但全程靠临时脚本少量取样。
- 业界做法（monday 11 节点 / kaelig Design Analyst）：确定性提取 → token 表 + 组件结构 + 状态矩阵 + 用法示例 + a11y 规则，**必填字段工件**，缺数据标 `[PENDING]`。
- 关键教训（PB-T08）：Tailwind 类名 ≠ 像素值（有自定义 config），**必须同时读设计源码（意图）+ 浏览器 computed style（真实值）双源交叉**。
- 还缺**输入质量分数**：kaelig 的 Design Analyst 打分 0-1，<0.8 硬停呈交人（GIGO 不静默）。workflowhub 宪法"不伪造通过"与此同精神，可表述为"低分事实 + 风险标注，呈交后继续"。

### 缺口 2（对照层）：没有"组件对照清单"（parity checklist）
- PB-T08 最大浪费：30 个缺陷里 60% 是"设计稿有的结构缺失/自创结构/数值不对"，只能逐轮由用户肉眼发现——用户成了人肉 diff 引擎。
- 业界对应：kaelig Visual Reviewer 9 维（layout/typography/colors/spacing/shadows/borders/radius/icons/states）逐维评分 PASS/MINOR/MODERATE/CRITICAL；**改造完成的定义 = 对照表全绿**。

### 缺口 3（执行层）：builder 规格信息密度无强制标准
- PB-T08 转折点已证明：事实与风险弹层改 3 次，前两次只有"简化弹层"四字，第三次把设计组件源码逐行贴给 builder → **一次通过**。规格密度与返工次数强负相关。
- 业界对应：kaelig Code Writer"必读 component-rules.md 才能写第一行"是 pre-flight 契约；monday 返回 context 而非代码。
- workflowhub 现有派发无模板强制（builder 常拿到"对齐设计稿"空话）；无"禁止近似/禁止自创结构/逐值复制"约束；无状态覆盖强制。

### 缺口 4（验证层）：视觉感知回路 + 视觉 diff oracle 都缺
- isolated-browser-qa 是"一次性 QA 路由"，不是"改→渲染→截→看→修→再截"回路；`visual` 字段只有 observed，无参考图比对。
- 业界两条路线都要：**perception**（yureki：新 UI 无基线，多模态截图+结构化清单+stale guard，回答"是否坏了"）+ **comparison**（kaelig：有设计参考时 9 维截图对照，回答"是否对齐"）。PB-T08 属于"有设计参考"场景，两个都要。
- 廉价数值信号优先（console errors、failed requests、`scrollWidth>clientWidth` 溢出）——PB-T08 的"撑爆浮窗"正是这类。

### 缺口 5（收敛层）：无迭代预算/收益递减/禁回归
- PB-T08 后段（R3-R5）才开始像"来回打磨"；业界明确：每 agent 退出标准 + 最大轮数 + 收益 <2% 即停 + 修复不得引入回归（kaelig）。
- workflowhub 无"budget"事实，子代理可能无限循环或随机停。

### 缺口 6（绑定层）：验收对象卡缺失
- luna 认定的"最致命"：5173 连 main checkout 而 T08 有独立 worktree、分支没写进交接 → "修好了"没有可验证对象。ui-project-init 有 viewport/Preview 但无强绑定（branch/worktree/服务 cwd/URL/设计源 hash）。
- 业界：yureki 的 capture report 带 tree hash，stale 即拒绝——同一思想。

### 缺口 7（规则知识层）：无"视觉/实现纪律"规则库
- workflowhub 前端技能都是"流程执行器"，没有任何"什么是对的"规则弹药：better-*（同心圆角公式、tabular-nums、i18n 输入 16px、间距 2 倍起步）、Vercel 100 条工程规则、动画 10 条标准、颜色 ramp/双层命名、排版 19 原则。
- 调研结论：这些规则**以 references/ 注入现有技能**（"规则源，非证据源"），不新增 gate——与宪法一致。

### 缺口 8（卫生层）：CSS 历史债务检查
- PB-T08：模拟记录 CSS 1056 行含 417 个历史块、同选择器三代叠加，"改了没效果"→ 再写一条更后面的 → 债上加债。frontend-component-quality 已有重复组件/CSS 泄漏检查，**只差"同选择器多定义统计"**（低成本）。

### 缺口 9（流程层）：反馈消歧 + 环境守护 + 失败归档
- 「右上角」猜错目标修错位置浪费一整轮 → 需要"位置类反馈先枚举候选指认"协议（10 秒）。
- 环境守护：dev server/API 挂两次、运行态数据丢失 → 任务开始登记所有依赖服务 + 每轮 health check。
- 失败归档：kaelig 三层失败框架（18 规则/9 工具/6 人际）证明**多数失败不是 prompt 问题**——把每次返工原因分类写进 workarounds，晋升成 skill 规则，规则复利。workflowhub 有 skills/ 硬层但无"观察→晋升"机制。

## 3. 结论：能力拼图

```
已有（治理骨架）         缺失（执行闭环）
─────────────          ─────────────
四材料工件契约    →→→   设计稿提取器 + 质量分数
Screen Read Map   →→→   组件对照清单（parity matrix）
组件/consumer 图  →→→   规格信息密度强制模板
browser QA 路由   →→→   视觉感知回路 + diff oracle + 边界测试
证据 freshness    →→→   迭代预算/收敛/禁回归
无 gate 宪法      →→→   human gate 用 conversational 门形态落地
skills 硬层       →→→   规则弹药库 references 注入 + 失败三层归档
```

**一句话**：workflowhub 需要的是把"视觉"从**观察语义**提升为**验收语义**——不是加 gate，而是让每个视觉环节都产出可核对的事实（提取规格、对照矩阵、感知报告、diff 报告、budget 记录），且有一批"什么是对的"规则可查。

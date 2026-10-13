# 调研 2：VibeCoding UI/前端开发最佳实践（anysearch 两轮 + 3 篇深度来源）

> 日期 2026-09-04。工具：anysearch（general.general 两轮 8 组查询）+ web_fetch 精读 3 篇。

## 0. 先给结论

VibeCoding 业界当前对「UI 前端质量差」的标准解法**不是更会写 CSS 的 prompt**，而是一条**可执行的视觉反馈闭环 + 结构化设计输入**。所有高质量案例共享五个要素：

1. **设计稿/设计系统先数字化**（token/组件/状态机器可读），输入质量分数化，差则硬停；
2. **agent 之间用带必填字段的工件契约传递**，而不是对话；
3. **先结构后细节**（骨架/主网格 → 组件 → fixture → 真实数据 → 视觉细节），禁止在错误结构上微调；
4. **给 agent 装上"眼睛"**：渲染 → 截图 → 结构化检查清单 → 修复 → 再截图，闭环非可选；
5. **迭代预算 + 收敛判定**（每 agent 有退出标准、最多迭代数、收益递减即停），防"追逐 1px 阴影偏移"的病态循环。

## 1. monday.com：Figma→Code 的集团工程实践

来源：https://engineering.monday.com/how-we-use-ai-to-turn-figma-designs-into-production-code/

- 直接让 LLM 从 Figma 生成代码的失败模式：**模型不了解设计系统**——组件/有效 props/token/无障碍规则，于是硬编码颜色、覆写字体、手写 CSS，"远看还行，系统角度是灾难"。
- 解法：**设计系统 MCP**（把组件、props、token、a11y 规则、真实用法示例暴露成确定性结构化工具，数据源自组件代码/TS 类型/配置文件——无并行维护系统）+ **agentic workflow**（LangGraph 11 节点：翻译检测、布局分析、token 映射、组件识别、事件接线、用法示例+a11y 规则检索、实现规划）。
- 关键设计决策：**返回 context 而不是 code**。生成代码的模型按所在仓库格式输出，代码归属权留在团队。
- 效果：设计评审从"纠错"变成"确认"；a11y 不再是事后修补。
- 对 workflowhub 的映射：`design-source-readiness`（设计源就绪）+ `frontend-component-quality`（组件/consumer 事实）+ `frontend-prototype-render` 的组合，正是"把上下文喂给 builder"的雏形——缺的是**确定性提取器和结构化的输入质量分数**。

## 2. kaelig.fr：8-agent 设计系统组件流水线（最重要的一篇）

来源：https://www.kaelig.fr/design-system-components-with-ai-agent-teams/

- 用 Intuit 设计系统 Menu（最难组件）验证：单 prompt figma-to-code 只能做原型，生产级组件需要 pipeline。两版架构：先全自动失败（"正确"≠"优秀"，pipeline 会遵守规则但不会质疑），后改为**thought partner 模式**——在人最需要判断的地方留结构化空间。
- **三阶段 8 agent**：Understand（Design Analyst 产 `brief.md` 12 点完整性清单 + `figma-raw.json`；Library Researcher 审计依赖 API 表面产 `component-rules.md` CR-*/AR-* 规则；Component Architect 产 `architecture.md`+命名 handoff notes+BLOCKING 对话门）→ Build（Code Writer 强制先读规则、禁硬编码 token、禁 `var(--x,#333)` fallback；Accessibility Auditor 8 层 a11y 栈 P1 阻断 P2 记录最多 3 次修复；Story Author 全变体 stories+play 函数）→ Verify（Visual Reviewer 9 维截图对照 Figma，PASS/MINOR/MODERATE/CRITICAL 分级，最多 5 轮、收益<2% 即停、禁止回归；Quality Gate TS/lint/format 1 次重试）。
- **三层失败框架**（最有迁移价值）：vibe-coded 基线 34 个 findings 中——18 个"agent 缺规则→写进 skill 后永不再犯"；9 个"工具/基础设施缺陷→MCP/插件/API 升级"；6 个"必须人类判断→显式 human gate"。**不是所有失败都是 prompt 问题**。
- **27 个假 token 案例**：agent 凭合理前缀 `--ids-*` 编造 27 个不存在的 token，组件渲染为无样式 HTML，但**所有测试通过**（测试查行为不查视觉）。修复=3 条规则（记录正确前缀、Design Analyst 必须调 MCP、Quality Gate grep 兜底）→ 永久归零。教训：**工程规则进 skill 不 decay，规则会复利**。
- **合同/工件模式**：agent 之间不对话，读写必填字段文档；数据缺失显式标 `[PENDING]`/`[UNRESOLVED]`（缺席本身是数据）；push-back 协议 BLOCKING/CONCERN/SUGGESTION 三级。
- **输入质量分数**：Design Analyst 输出 0.0-1.0 分数随下游确定性扣分（REST fallback −0.30、每个未解析 token −0.02…），<80% 流水线硬停交人三种选择（修输入/手给映射/明确接受低质量）。GIGO 但不静默。
- **vibe RLHF 三层持久层**：`workarounds.md`（原始观察）→ Memory（验证过的普适规则自动加载）→ Skill files（硬编码进 agent system prompt 的 pre-flight 检查）。"改 skill → 跑 pipeline → 观察 → 记录 → 再改"的闭环，reward 信号是人的判断。
- **迭代预算**：每 agent 明确退出标准（不是"看起来好"而是"9 维零 CRITICAL/MODERATE"）+ 最大轮数 + 收益递减阈值。没有退出标准的 agent 要么永远跑要么随机停。
- **会话门（conversational gate）**：Architect 对低置信决策/重要类型（设计系统偏离、Figma 数据缺口、a11y 权衡、motion 决策、多方案并存）暂停，给人类风险权衡选项而非技术倾倒；高置信自动放行防决策疲劳；"resolved 而非 elapsed"，人不说 proceed 就不走。

## 3. yureki_lab：给 agent 装上眼睛（截图反馈回路）

来源：https://dev.to/yureki_lab/how-i-gave-my-ai-coding-agent-eyes-a-screenshot-feedback-loop-for-ui-work-jce

- 问题原样复现 PB-T08：agent 后端强（有 pytest/tsc 等机器 oracle），前端崩（唯一 oracle 是人的眼睛）——测试全绿但模态框藏在内容后面、flex 变成 column、按钮在 DOM 里但视觉上 400px 之外。
- 解法三件套：**渲染 harness**（Playwright 60 行：多 viewport 截图 + console errors + failed requests + `scrollWidth>clientWidth` 溢出信号 + report.json）；**结构化检查清单**（"文本是否被截断/重叠？overflow 是否每 viewport false？交互元素是否在视口内？mobile 是否单列坍塌？console error 每个都是 blocker——**不能回答就承认不能回答**，禁止半看图就自信描述）；**stale 防护**（report 里带当前树 hash，completion check 拒绝 hash 不匹配的 capture——机械检查不是荣誉系统）。
- 关键洞察：
  - **agent 的自主性 = 其反馈 oracle 的自主性**——把人类判断转换成 agent 能跑的命令，才能真自主。
  - **perception 优于 comparison**：新 UI 没有基线，快照 diff 是"完成工作的守卫"，多模态感知是"未完成工作的回路"。两者不同工具。
  - **廉价数值信号优于像素**：`scrollWidth>clientWidth` 一行代码抓了 1/3 的布局 bug；截图留给无法数字化的 bug。
  - **show-your-work 是最便宜的防走捷径机制**：完成消息必须附 report.json 原文 + 每张截图的一句话观察；"artifact 而非 claim"。
  - **诚实边界**：回路解决"是否坏了"（可辩护答案），不解决"是否好看"（品味）——后者给人。vague 问题得到 vague 答案，别再指望 prompt 填满品味差距。

## 4. 其他来源要点

- **Tweag Agentic Coding Handbook 视觉反馈工作流**（https://tweag.github.io/agentic-coding-handbook/WORKFLOW_VISUAL_FEEDBACK/）：截图+浏览器 MCP（console/DOM/network）作为输入，指出具体问题（"按钮字号太大""图片溢出容器"）而非"提升一下"。与 yureki 同构。
- **Figma→code 一般实践**（logrocket 系列 https://blog.logrocket.com/ux-design/design-to-code-with-figma-mcp/ 、composiodev https://dev.to/composiodev/from-figma-designs-to-pixel-perfect-components-using-figma-mcp-claude-code-3ao ）：Figma 文件要为 MCP 准备好（命名、变量、token 绑定）；FigMCP 只给原始数据，还需要把数据映射到项目自己的组件/token 体系。
- **视觉回归/QA 工具生态**（https://getautonoma.com/blog/visual-regression-testing-tools 、https://github.com/yutori-ai/frontend-visualqa ）：传统快照回归适合"稳定基线"，AI 视觉 QA 用于"新 UI 的对与错判断"；当前 agent 生态趋势是把 browser 检查注入 agent loop 而非独立 CI。
- **Vercel 官方 agent skills**（https://github.com/vercel-labs/agent-skills 、https://vercel.com/design/guidelines 、https://vercel.com/docs/agent-resources/skills）：web-design-guidelines（100+ 规则：禁 transition:all、img 宽高、URL 反映状态、列表虚拟化、tabular-nums、14 条反模式表）等——"规则弹药库"路线，与 kaelig Tier-1 理论一致。
- **Agent 设计系统准备度**（https://www.headway.io/blog/design-systems-for-ai-agents 、https://www.intodesignsystems.com/agentic-design-systems 、phenomenonstudio https://phenomenonstudio.com/article/stop-losing-weeks-to-design-to-code-rework-inside-our-ai-agent-pipeline/）：machine-readable token、组件文档、design-to-code parity、规则住在代码里；给 agent 精确的 spacing/组件名/token 而非近似值。
- **Spec-driven**（addyosmani https://addyosmani.com/blog/good-spec/ 、augmentcode https://www.augmentcode.com/guides/what-is-spec-driven-development）：spec 是给 agent 的可执行契约；好 spec 清晰、上下文可控、随项目演化。workflowhub 的四材料机制与此同源（decision-log/spec/plan/tasks）。
- **中文社区**（feisky https://feisky.xyz/posts/2025-07-19-opensource-my-claude-code-settings/ ，vibe-coding-cn https://github.com/tradecatlabs/vibe-coding-cn ）：规范驱动开发（spec/design/task/execute 分层命令）是主流；AI 输出视为"草图"而非"终稿"。

## 5. 对 workflowhub 最有用的可迁移机制（汇总）

| 机制 | 来源 | workflowhub 落点 |
|---|---|---|
| 设计数字化提取器（token/组件/状态，必填字段工件） | monday/kaelig | 新 `design-extractor` 或强化 design-source-readiness |
| 输入质量分数 + 低分硬停呈交 | kaelig（Design Analyst） | design-source-readiness 新增 quality score 事实 |
| 工件契约 + `[PENDING]/[BLOCKING]` 标注 + push-back | kaelig | 材料体系（已有四材料）→ 提取器/对照清单沿用 |
| 三层失败框架（规则/工具/人类判断） | kaelig | 每轮返工后分类归档，规则进 skill |
| vibe RLHF 三层持久层（workarounds→memory→skill） | kaelig | workflowhub 现有技能体系天然吻合（skills/ 即硬层） |
| 视觉感知回路（harness+清单+stale guard） | yureki/tweag | isolated-browser-qa 升级：browser-qa-evidence.v1 扩展 |
| 迭代预算/收益递减/禁回归 | kaelig | visual reviewer 与 builder 的 budget 事实 |
| 人类判断门（conversational gate） | kaelig | 与宪法"推进经人确认"天然一致的落地形态 |
| 真实结构先行，fixture 全状态 | PB-T08/luna | ui-project-init 强化 |
| 验收对象卡（branch/worktree/服务/URL/设计源 hash/viewport） | luna | ui-project-init 强制登记 |

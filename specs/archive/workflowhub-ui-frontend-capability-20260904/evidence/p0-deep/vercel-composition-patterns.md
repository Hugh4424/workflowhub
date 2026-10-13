# P0 深读笔记：vercel-composition-patterns

来源：`/Users/Hugh/Hugh/Project/Website-skills/vercel-composition-patterns/`
构成：SKILL.md（89 行，索引）+ README.md + `rules/` 8 条规则文件（+ `_sections.md` / `_template.md` 元文件）+ `AGENTS.md`（22.6KB，规则编译版，v1.0.0，2026 年 1 月，明确声明"主要为 agents/LLMs 编写"）。许可证 MIT，author: vercel。
内容关系：AGENTS.md = 8 条规则的编译合集（仅多 Abstract/TOC/References 三节，无额外规则）；SKILL.md = 索引 + 优先级表。

## ① 核心机制（一句话）

用"组合优于配置"消除 boolean props 爆炸：复杂组件拆成共享 context 的 compound components，状态提升到 provider 并按 `state/actions/meta` 三段式接口依赖注入，变体做成显式组件而非模式开关。

## ② 完整可执行规则表（8 条模式，逐条含子规则）

### 1. `architecture-avoid-boolean-props`（Impact: CRITICAL）— 禁止布尔 prop 泛滥
- 1.1 不加 `isThread`/`isEditing`/`isDMThread` 之类布尔 prop 定制行为；每个布尔使可能状态数翻倍，产生不可维护的条件逻辑。
- 1.2 判定信号：组件体内出现布尔 prop 驱动的三元/条件分支链（`{isDMThread ? … : isThread ? … : null}`）即为违规。
- 1.3 替代法：每个变体显式组合 `Composer.Frame/Header/Input/Footer` 等部件；共享内部件但不共享单一巨石父组件。
- 1.4 验收：每个变体"显式声明渲染什么"——看 JSX 即可知结构，无隐藏条件。

### 2. `architecture-compound-components`（Impact: HIGH）— 复合组件 + 共享 context
- 2.1 复杂组件结构化为 compound components；子组件经 context 访问共享状态，不经 props。
- 2.2 反模式信号：单体组件同时收 `renderHeader/renderFooter/renderActions` 和 `showAttachments/showFormatting/showEmojis` 布尔组。
- 2.3 结构： `createContext<XxxContextValue | null>(null)` + Provider 组件 + 各子部件（Frame/Input/Submit/Header/Footer/…）。
- 2.4 导出形式：对象聚合导出 `const Composer = { Provider, Frame, Input, Submit, … }`，消费侧 `<Composer.Provider><Composer.Frame>…` 。
- 2.5 消费侧显式组合所需部件；无隐藏条件分支；state/actions/meta 由父 provider 依赖注入，同一组件结构可多实例复用。

### 3. `state-lift-state`（Impact: HIGH）— 状态提升到 Provider
- 3.1 状态管理移入专用 provider 组件，使组件视觉边界外的兄弟组件也能读写状态，免 prop drilling / 尴尬 ref。
- 3.2 反模式信号一：状态困在组件内（`useState` 在 composer 里），外部 DialogActions 按钮拿不到 submit。
- 3.3 反模式信号二：用 `useEffect` 每次变化向上同步（`onInputChange` 回调 + 父层镜像 state）。
- 3.4 反模式信号三：提交时从 ref 读状态（`stateRef.current`）。
- 3.5 正确做法：provider 持有 `useState`/业务 hook + `inputRef`，以 `{state, actions:{update,submit}, meta:{inputRef}}` 下发。
- 3.6 关键判据（原文 Key insight）：需要共享状态的组件不必在视觉上嵌套——只要在同一个 provider 之内即可。`ForwardButton`/`MessagePreview` 可在 `Composer.Frame` 外、provider 内。

### 4. `state-context-interface`（Impact: HIGH）— 泛型 context 接口做依赖注入
- 4.1 为组件 context 定义**三段式泛型接口**：`state`（数据）+ `actions`（操作函数集）+ `meta`（ref 等环境物件），合成 `XxxContextValue`。
- 4.2 该接口是契约：任何 provider 实现它，同一套 UI 即可配完全不同的状态实现。
- 4.3 反模式信号：UI 组件直接调具体 hook（`useChannelComposerState()`）——UI 与状态实现紧耦合。
- 4.4 UI 组件只消费接口不感知实现：`const { state, actions:{update}, meta } = use(ComposerContext)`。
- 4.5 多 provider 实现同一接口：本地 `useState`（临时表单，如 ForwardMessageProvider）与全局同步状态（ChannelProvider）互换，UI 零改动。
- 4.6 provider 边界才是有效边界（非视觉嵌套）：provider 内、Frame 外的自定义 UI（MessagePreview、DialogActions 里的 ForwardButton）照样可读写 state/actions。
- 4.7 核心原则原文："Lift state, compose internals, make state dependency-injectable" / "Swap the provider, keep the UI"。

### 5. `state-decouple-implementation`（Impact: MEDIUM）— 状态实现与 UI 解耦
- 5.1 provider 组件是唯一知道状态如何管理的地方；UI 不知状态来自 useState、Zustand 还是服务端同步。
- 5.2 反模式信号：UI 组件（ChannelComposer）内直接 `useGlobalChannelState(channelId)`、`useChannelSync(channelId)`，并把值/回调手工接线给子部件。
- 5.3 正确分层：`ChannelProvider`（懂 channelId、调全局 hook、组装 state/actions/meta）→ `ChannelComposer`（纯 JSX 组合，零状态知识）→ `Channel`（装配 provider + UI）。
- 5.4 验收：同一个 `Composer.Input` 在 ForwardMessageProvider 与 ChannelProvider 下都工作，因为它只依赖 context 接口。

### 6. `patterns-explicit-variants`（Impact: MEDIUM）— 显式变体组件
- 6.1 不用"一个组件 + 多个布尔模式"，为每个场景建显式变体组件：`ThreadComposer` / `EditMessageComposer` / `ForwardMessageComposer`。
- 6.2 反模式信号：调用点出现 `<Composer isThread isEditing={false} channelId='abc' showAttachments …/>`——读不出实际渲染什么。
- 6.3 每个变体内部 = 专属 Provider（`ThreadProvider`/`EditMessageProvider`/`ForwardMessageProvider`）+ 组合的共享部件 + 变体独有部件（`AlsoSendToChannelField`、`CancelEdit/SaveEdit`、`Mentions`）。
- 6.4 变体须显式三事：用哪个 provider/state、含哪些 UI 元素、有哪些动作。
- 6.5 目标：无布尔组合推理、无不可能状态（impossible states）。

### 7. `patterns-children-over-render-props`（Impact: MEDIUM）— children 优先于 renderX props
- 7.1 组合静态结构用 `children`，不用 `renderHeader/renderFooter/renderActions` props——children 可读性高、自然组合、不需理解回调签名。
- 7.2 反模式信号：API 签名含 `renderX?: () => React.ReactNode` 组；调用点嵌套箭头函数。
- 7.3 例外（render props 的正当场景）：**父组件需要向子项回传数据/状态时**——如 `<List data={items} renderItem={({item,index}) => …}/>`。
- 7.4 判据一句话：组合静态结构用 children；回传数据用 render props。

### 8. `react19-no-forwardref`（Impact: MEDIUM，⚠️ 仅 React 19+，React 18 及以下跳过）— React 19 API
- 8.1 React 19 中 `ref` 是普通 prop，禁用 `forwardRef` 包裹：`function ComposerInput({ ref, ...props }: Props & { ref?: React.Ref<TextInput> })`。
- 8.2 用 `use(MyContext)` 替代 `useContext(MyContext)`。
- 8.3 `use()` 可条件调用，`useContext()` 不可。

### 辅助元文件规则
- `_sections.md`：4 分区及 impact 定义——1 Component Architecture(HIGH) / 2 State Management(MEDIUM) / 3 Implementation Patterns(MEDIUM) / 4 React 19 APIs(MEDIUM)；文件名前缀 = 分区 ID。
- `_template.md`：新规则模板——frontmatter（title/impact/impactDescription/tags）+ Incorrect/Correct 双代码示例 + Reference 链接。
- README 补充 4 条核心原则：①组合优于配置 ②状态进 provider ③内部件经 context ④显式变体；impact 三级定义 CRITICAL/HIGH/MEDIUM；AGENTS.md 为生成产物。

**规则总计：8 条模式规则，含 30 条子规则（含 7 条反模式判定信号与 3 条例外/边界条款）。**

## ③ 对工程质量四维度的支撑点

- **组件化（最强支撑，本技能即组件化方法论）**：8 条模式逐条对应——
  - #1 消灭 prop 爆炸 → 组件 API 面收敛；
  - #2 compound components → 组件族的公共结构骨架（Provider/Frame/部件/聚合导出）；
  - #3 状态提升 → 组件边界与状态边界解耦；
  - #4 state/actions/meta 三段式接口 → **组件 context 的标准契约形状**，可直接固化为 workflowhub 组件接口规范；
  - #5 provider 唯一知实现 → UI 组件纯化、可换数据源；
  - #6 显式变体 → 消灭不可能状态，变体自文档化；
  - #7 children/render props 判据 → 组合 API 选型规则；
  - #8 React 19 写法 → 组件定义现代化。
- **统一性**：所有 compound 组件族共享同一命名与结构约定（`Xxx.Provider/Frame/Input/Submit`、三段式 context value），跨组件族一致；AI agent 可按固定形状生成/识别。
- **可维护性**：变体自文档（#6.1/1.4）；无隐藏条件（#2.5）；状态实现可换 UI 不动（#4.5/5.4）；AGENTS.md 明示"为 AI 自动化一致性优化"——规则结构（frontmatter + Incorrect/Correct 示例）本身便于机器执行。
- **性能**：无直接性能规则；间接收益——纯组合组件易于 memo 边界划分、provider 粒度控制重渲染范围（原文未展开，不夸大）。

## ④ 与 workflowhub 的精确集成点

- **frontend-component-quality（主集成点）**：8 条模式 + 7 条反模式信号并入组件质量审查——具体落为：boolean-prop 检测（信号 1.2/2.2/6.2）、renderX props 检测（7.2）、UI 内直接调状态 hook 检测（4.3/5.2）、useEffect 向上同步状态检测（3.3）、ref 读状态检测（3.4）、forwardRef/useContext 旧 API 检测（8.1/8.2，按项目 React 版本开关）。#4 三段式接口作为 compound 组件的契约检查项。
- **frontend-prototype-render**：生成组件骨架时默认走 compound + provider 结构（规则 2/3/4 作为生成模板），把模式从"事后审查"前置为"生成约束"。
- **design-extractor**：从既有代码库提取组件时，按 #6 识别隐式变体（布尔 prop 组合 → 建议拆显式变体）。
- **ui-project-init**：新项目模板内置 `_template.md` 式规则文件结构与 compound 组件脚手架。
- **frontend-testing / fullstack-slice-testing**：#4.5 的"换 provider 不换 UI"天然是测试策略——UI 组件用本地 useState provider 测，集成用真实 provider 测；可写入测试技能的分层建议。
- **verify-change**：重构 diff 检查是否引入新 boolean props / renderX props（增量 lint）。

## ⑤ 移植风险

- **许可证**：MIT，可复制改写。
- **依赖**：零代码依赖、纯 Markdown；唯一框架前提 = React（示例含 React Native 风格 `TextInput/onPress`，来自 Slack 类客户端语境，对 Web React 需示例改写，规则本身不受影响）。规则 8 强依赖 React 19——workflowhub 目标项目 React ≤18 时必须整段禁用。
- **上游漂移**：规则自包含在仓内（rules/ + AGENTS.md），无远端抓取，漂移风险低；AGENTS.md 是生成产物——若改 rules/ 需重新编译 AGENTS.md，移植时二选一作单一来源（建议 rules/ 为准，AGENTS.md 可丢弃或自行重编译）。
- **元数据不一致（实测发现）**：SKILL.md 优先级表把 state-* 标 MEDIUM，但 rules 文件 frontmatter 里 `state-lift-state` 与 `state-context-interface` 实为 HIGH；README 把 Component Architecture 标 CRITICAL 而 `_sections.md` 标 HIGH。移植时需自定一份优先级表为准。
- **冲突**：与 vercel-react-best-practices（性能向）正交不冲突；与 better-accessibility 的组件契约（APG/disabled 策略）互补——component-quality 合并时注意两者一个管"结构组合"、一个管"可访问行为"，规则命名空间分开即可。

## ⑥ 验证或推翻之前结论

**之前结论：vercel-composition-patterns = 8 条模式并入 component-quality。**

✅ **基本验证成立，但需两条修正**：
1. "8 条"准确（architecture 2 + state 3 + patterns 2 + react19 1），但可执行粒度是 **30 条子规则**，其中**7 条反模式判定信号**（1.2/2.2/3.3/3.4/4.3/5.2/7.2）才是能直接写成检查器的部分——并入 component-quality 时应以"信号→规则→修正示例"三元组落地，而非只搬 8 个标题。
2. 之前结论低估了它对**生成侧**的价值：README/AGENTS.md 明示该文档为 AI agent 编写，#2 的聚合导出骨架和 #4 的三段式接口可直接作为 frontend-prototype-render 的组件生成模板——不只并入 component-quality（审查侧），还应并入 frontend-prototype-render（生成侧）与 frontend-testing（provider 替换测试策略）。

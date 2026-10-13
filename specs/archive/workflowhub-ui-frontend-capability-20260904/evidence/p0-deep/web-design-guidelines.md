# P0 深读笔记：web-design-guidelines

来源：`/Users/Hugh/Hugh/Project/Website-skills/web-design-guidelines/`（镜像自 vercel-labs/web-interface-guidelines）
本地 SKILL.md：40 行；**规则本体不在仓内**，每次审查时从远端 URL 抓取：`https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md`。本文规则表为 2026-09-04 抓取快照。

## ① 核心机制（一句话）

技能本身只是一个极薄 wrapper：运行时 WebFetch 抓取 vercel-labs 最新规则清单，再对指定文件逐条对照，输出 `file:line` 极简审查结论。

## ② 完整可执行规则表（17 大类，合计 103 条；反模式区与正文有重复，去重后约 89 条）

### A. Accessibility（12 条）
1. Icon-only 按钮必须有 `aria-label`
2. 表单控件必须有 `<label>` 或 `aria-label`
3. 交互元素必须有键盘处理器（`onKeyDown`/`onKeyUp`）
4. 动作用 `<button>`，导航用 `<a>`/`<Link>`，禁止 `<div onClick>`
5. 图片必须有 `alt`（装饰性图片用 `alt=""`）
6. 装饰性图标必须 `aria-hidden="true"`
7. 异步更新（toast、校验提示）必须 `aria-live="polite"`
8. 先用语义化 HTML（`<button>`, `<a>`, `<label>`, `<table>`），再考虑 ARIA
9. 标题层级 `<h1>`–`<h6>` 连贯；提供跳主内容 skip link
10. 标题锚点设置 `scroll-margin-top`
11. 有意义媒体须提供字幕、转录或描述
12. 媒体控件支持键盘；装饰性媒体对辅助技术隐藏

### B. Focus States（5 条）
13. 交互元素有可见焦点：`focus-visible:ring-*` 或等价
14. 禁止无替代焦点样式的 `outline-none` / `outline: none`
15. 用 `:focus-visible` 替代 `:focus`（避免点击出焦点环）
16. 复合控件用 `:focus-within` 做组焦点
17. Sticky header/footer/overlay 不得遮挡聚焦元素

### C. Forms（11 条）
18. input 必须有 `autocomplete` 和有意义的 `name`
19. 用正确 `type`（`email`/`tel`/`url`/`number`）和 `inputmode`
20. 禁止拦截粘贴（`onPaste` + `preventDefault`）
21. label 可点击（`htmlFor` 或包裹控件）
22. email/验证码/用户名禁用拼写检查 `spellCheck={false}`
23. checkbox/radio：label 与控件共享单一命中区域（无死区）
24. 提交按钮在请求发起前保持可用；请求中显示 spinner
25. 错误内联显示在字段旁；提交后聚焦第一个错误
26. placeholder 以 `…` 结尾并展示示例格式
27. 非认证字段加 `autocomplete="off"`，避免触发密码管理器
28. 有未保存修改时导航须警告（`beforeunload` 或路由守卫）

### D. Animation（8 条）
29. 尊重 `prefers-reduced-motion`（提供降级变体或禁用）
30. 只动画 `transform`/`opacity`（合成器友好）
31. 禁止 `transition: all`——必须显式列出属性
32. 设置正确的 `transform-origin`
33. SVG：transform 作用于 `<g>` 包裹层，配 `transform-box: fill-box; transform-origin: center`
34. 动画可被打断——动画中响应用户输入
35. 与其他内容并存、时长 >5 秒的自动播放动效必须提供暂停/停止/隐藏控制
36. 静音装饰循环在 `prefers-reduced-motion` 下必须停止

### E. Typography（6 条）
37. 用 `…` 不用 `...`
38. 用弯引号 `“”` 不用直引号 `"`
39. 不断行空格：`10&nbsp;MB`、`⌘&nbsp;K`、品牌名
40. 加载文案以 `…` 结尾：`"Loading…"`、`"Saving…"`
41. 数字列/数字比较用 `font-variant-numeric: tabular-nums`
42. 标题用 `text-wrap: balance` 或 `text-pretty`（防孤词）

### F. Content Handling（4 条）
43. 文本容器处理超长内容：`truncate`、`line-clamp-*` 或 `break-words`
44. flex 子项必须 `min-w-0` 才能截断文本
45. 处理空状态——空字符串/空数组不得渲染出破版 UI
46. 用户生成内容：预演极短、正常、超长三种输入

### G. Images（3 条）
47. `<img>` 必须显式 `width` 和 `height`（防 CLS）
48. 折叠线以下图片：`loading="lazy"`
49. 首屏关键图片：`priority` 或 `fetchpriority="high"`

### H. Performance（8 条）
50. 大列表（>50 项）：虚拟化（`virtua`、`content-visibility: auto`）
51. 渲染期禁止布局读（`getBoundingClientRect`、`offsetHeight`、`offsetWidth`、`scrollTop`）
52. 批量 DOM 读/写，避免读写交错
53. 优先非受控输入；受控输入每次击键必须廉价
54. 对 CDN/资源域加 `<link rel="preconnect">`
55. 关键字体：`<link rel="preload" as="font">` + `font-display: swap`
56. 用 `<video autoplay muted loop playsinline>` 替代 GIF；提供静态图替代
57. 短非必要循环：Safari 走 H.264 MP4 `<picture>` 源 + `prefers-reduced-motion` 媒体条件 + 静态兜底

### I. Navigation & State（4 条）
58. URL 反映状态——过滤器/标签页/分页/展开面板进 query params
59. 链接用 `<a>`/`<Link>`（支持 Cmd/Ctrl+click、中键）
60. 所有有状态 UI 可深链（用了 `useState` 就考虑经 nuqs 之类同步到 URL）
61. 破坏性操作须确认弹窗或撤销窗口——绝不立即执行

### J. Touch & Interaction（6 条）
62. `touch-action: manipulation`（消除双击缩放延迟）
63. `-webkit-tap-highlight-color` 须有意设置
64. modal/drawer/sheet 内 `overscroll-behavior: contain`
65. 拖拽期间：禁用文本选择，被拖元素加 `inert`
66. 拖拽/滑动/捏合/路径手势须有点击与键盘替代（除非手势本身是本质交互）
67. `autoFocus` 慎用——仅桌面、单一主输入；移动端避免

### K. Safe Areas & Layout（3 条）
68. 全出血布局用 `env(safe-area-inset-*)` 适配刘海屏
69. 避免意外滚动条：容器 `overflow-x-hidden`，修复内容溢出
70. 布局用 flex/grid，不用 JS 测量

### L. Dark Mode & Theming（3 条）
71. 深色主题 `<html>` 加 `color-scheme: dark`（修滚动条、输入框）
72. `<meta name="theme-color">` 与页面背景一致
73. 原生 `<select>` 显式设置 `background-color` 与 `color`（Windows 深色模式）

### M. Locale & i18n（4 条）
74. 日期时间用 `Intl.DateTimeFormat`，不硬编码格式
75. 数字/货币用 `Intl.NumberFormat`
76. 语言检测用 `Accept-Language` / `navigator.languages`，不用 IP
77. 品牌名/代码 token/标识符包 `translate="no"`，防自动翻译破坏

### N. Hydration Safety（3 条）
78. 带 `value` 的 input 必须配 `onChange`（否则改用 `defaultValue` 非受控）
79. 日期/时间渲染防 hydration 不匹配（server vs client）
80. `suppressHydrationWarning` 只在真正需要处使用

### O. Hover & Interactive States（2 条）
81. 按钮/链接必须有 `hover:` 状态（视觉反馈）
82. 交互状态提升对比度：hover/active/focus 比 rest 更显著

### P. Content & Copy（7 条）
83. 主动语态："Install the CLI" 而非 "The CLI will be installed"
84. 标题/按钮用 Title Case（Chicago 风格）
85. 计数用数字："8 deployments" 而非 "eight"
86. 按钮文案具体："Save API Key" 而非 "Continue"
87. 错误信息含修复方法/下一步，不只陈述问题
88. 用第二人称；避免第一人称
89. 空间受限处用 `&` 替代 "and"

### Q. Anti-patterns（14 条，与上文部分重复，属"必报"清单）
90. `user-scalable=no` 或 `maximum-scale=1` 禁用缩放
91. `onPaste` + `preventDefault`（重复 #20）
92. `transition: all`（重复 #31）
93. 无 focus-visible 替代的 `outline-none`（重复 #14）
94. 内联 `onClick` 做导航而不用 `<a>`（重复 #4）
95. `<div>`/`<span>` 挂点击处理器（应为 `<button>`）（重复 #4）
96. 图片无尺寸（重复 #47）
97. 大数组 `.map()` 无虚拟化（重复 #50）
98. 表单输入无 label（重复 #2）
99. 图标按钮无 `aria-label`（重复 #1）
100. 硬编码日期/数字格式（重复 #74/75）
101. 无明确理由的 `autoFocus`（重复 #67）
102. 可用压缩视频时仍用 GIF（重复 #56）
103. 纯手势操作无点击/键盘替代（重复 #66）

**输出格式约定**：按文件分组，`file:line` 格式（VS Code 可点击）；terse；通过的文件输出 `✓ pass`；无前言无解释（修复方法非显然时除外）。

## ③ 对工程质量四维度的支撑点

- **组件化**：间接支撑——规则 #4/#8 强制语义元素与职责分离（动作=button、导航=link），为组件契约划边界；但整体不是组件化技能。
- **统一性**：最强支撑。Typography（#37–42）、Content & Copy（#83–89）、Hover/Focus（#81–82, #13–17）三大块把文案、标点、状态样式收敛为全站一致的可检规则，是"全站风格统一"的机器可检部分。
- **可维护性**：`file:line` 输出格式可直接进 CI/review 工具链；URL 状态化（#58–60）让状态可复现、可分享；反模式清单（#90–103）是 lint 化的最低护栏。
- **性能**：8 条性能规则（#50–57）+ 图片 3 条（#47–49）覆盖虚拟化阈值（>50 项）、CLS、懒加载、字体加载、GIF→video 等，阈值具体可直接编码进检查器。

## ④ 与 workflowhub 的精确集成点

- **frontend-component-quality**：主集成点。将 103 条规则固化为审查 checklist 的"Web Interface Guidelines 段"，输出沿用 `file:line` 格式；反模式 14 条可作为 lint 规则（eslint-plugin 或静态 grep 检查）。
- **frontend-testing / isolated-browser-qa**：#58（URL 状态）、#61（破坏性操作确认）、#28（未保存警告）、#17（sticky 遮挡焦点）需要运行时浏览器验证，归入 isolated-browser-qa 的场景脚本。
- **ui-parity-checklist**：Typography/Copy 段（#37–42, #83–89）与 dark mode（#71–73）可并入 parity 检查项。
- **design-extractor**：#41 tabular-nums、#42 text-wrap、#71 color-scheme 等 token 化属性可作为设计 token 提取规则。
- **verify-change**：改动后重跑受影响文件的规则子集（增量审查）。

## ⑤ 移植风险

- **许可证**：MIT（SKILL.md frontmatter 明确），可自由复制改写。
- **依赖**：无代码依赖，但**强依赖网络**：每次审查需 WebFetch 远端 command.md；离线/被墙即失效。workflowhub 集成必须做**固化快照**——把规则表（本文件 ②）落仓，定期人工同步，而不是运行时抓取。
- **上游漂移**：vercel-labs 主分支随时变更规则；镜像仓 SKILL.md 指向 main 分支，无版本锁定。对策：快照 + 记录抓取日期 + diff 同步流程。
- **冲突**：与 better-accessibility 在 A/B/C 三段（焦点、表单、ARIA）有约 20 条重叠/近似规则——合并时需去重并决定单一来源，避免同一违规双报。

## ⑥ 验证或推翻之前结论

**之前结论：web-design-guidelines = 固化快照独立复制。**

✅ **验证成立，且比预想更必要**：SKILL.md 本体 40 行且不含任何规则，规则 100% 在远端 main 分支，不做固化快照就等于把审查标准交给上游实时漂移。本笔记 ② 节即为快照底稿（103 条，2026-09-04 抓取）。补充修正：快照时需同时固化"输出格式约定"（file:line / ✓ pass / 按文件分组），它也在远端文件里。

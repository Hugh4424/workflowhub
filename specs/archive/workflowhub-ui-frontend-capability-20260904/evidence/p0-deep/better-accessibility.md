# P0 深读笔记：better-accessibility

来源：`/Users/Hugh/Hugh/Project/Website-skills/better-accessibility/`
构成：SKILL.md（105 行，14 原则 + 13 错误）+ 6 个 reference 文件（focus-and-keyboard.md / semantics-and-aria.md / forms.md / screen-readers.md / hit-areas.md / motion-and-zoom.md / review-output.md）+ agents/openai.yaml（仅展示元数据，无规则）。许可证 MIT。
边界声明：渲染对比度测量归 `better-colors`；文字尺寸/iOS 输入缩放归 `better-typography`；RTL 布局归 `better-layout`——本技能不做这三件事。

## ① 核心机制（一句话）

以"先键盘用户、再读屏用户走查"为方法，用 14 条原则 + 6 份专题细则约束组件级无障碍实现，产出带 Severity/Location/Before/After/Why 表格和 Block/Needs changes/Approve 裁决的独立审查报告。

## ② 完整可执行规则表

### P0. SKILL.md 14 条核心原则（逐条）

1. **Native Elements First**：有原生元素就不用 ARIA；`<button>` 动作、`<a href>` 导航（须支持 Cmd/Ctrl/中键）、禁 `<div onClick>`；No ARIA > bad ARIA。
2. **Visible Focus Rings**：样式化 `:focus-visible` 而非裸 `:focus`；优先浏览器原生焦点指示器；自定义环须用项目焦点 token 或显式颜色并对所有相邻色逐一验证，`currentColor` 仅在通过同样验证后可用；至少 `2px` 实线周长或等效可见面积；禁止无替代 `outline: none`；forced-colors 模式保留系统色。
3. **Full Keyboard Support**：每个指针交互有键盘路径（ARIA APG）：Escape 关浮层、方向键在复合控件内移动、Tab 在控件间移动、Enter/Space 激活；`tabindex` 只用 `0` 和 `-1`，永不用正值；复合控件用 roving tabindex（活动项 `0`，其余 `-1`）。
4. **Trap and Restore Focus**：模态对背景设 `inert`，打开时移焦入内，关闭时焦点回到触发器；加 `overscroll-behavior: contain`。
5. **Minimum Hit Area**：WCAG 2.5.8 AA 基线 24×24 CSS px（或其 spacing/equivalent-control/inline/user-agent/essential 例外）；触屏目标 44×44px、桌面 40×40px（密度允许时）；可用伪元素扩大命中区；扩展命中区不得重叠；装饰层 `pointer-events: none`。
6. **Label and Type Every Control**：每个 input 有 `<label for>` 或包裹 `<label>`；placeholder 永远不是 label；label 与控件共享单一命中区无死区；`autocomplete` + 有意义 `name` + 正确 `type`/`inputmode`；永不阻止粘贴。
7. **Errors That Announce**：提交按钮在请求发起前保持可用，请求中禁用并显示 spinner 且保留原 label；提交时校验：失败字段 `aria-invalid="true"` + `aria-describedby` 指向内联错误 + 聚焦第一个无效字段；原生 `disabled` 用于真正不可用；`aria-disabled="true"` 仅在有意保留可聚焦性时使用且须在代码中阻断指针/键盘/表单行为并显式样式化。
8. **Accessible Names Everywhere**：图标按钮要有描述性 `aria-label`；可见 label 文本必须出现在可访问名称中；装饰元素 `aria-hidden="true"` 但绝不在可聚焦元素上。
9. **Don't Rely on Color Alone**：状态须冗余线索（图标/文本/下划线 + 颜色）；按内容和状态确定适用 WCAG 对比度条款，用 better-colors 测渲染前景/背景对；不达标时报该色对与条款，不擅自改项目颜色。
10. **Honor prefers-reduced-motion**：动效包在 `@media (prefers-reduced-motion: no-preference)` 里做成 opt-in；降级时滑动/缩放替换为 opacity 交叉淡化，视差和自动播放彻底关闭；自动播放媒体要有可见暂停控制；带动作或错误的 toast 停留到被手动关闭。
11. **Announce Dynamic Content**：字段级校验用 `aria-describedby`；非紧急、不绑控件的更新（toast/结果数）用 `role="status"` polite 区；紧急且不绑控件的错误用 `role="alert"`；重复 polite 播报须先渲染稳定空区域再改文本；动态插入的 alert 支持不一致须实测目标读屏器。
12. **Alt Text by Purpose**：装饰图 `alt=""`；信息图描述含义；功能图描述动作（搜索图标按钮 `alt="Search"` 而非 `alt="magnifying glass"`）。
13. **Structure Is Navigation**：标题描述各自小节、构成连贯大纲；一个页面级 `<h1>` + 正确嵌套层级是推荐默认而非独立 WCAG 判据；暴露一个可见主 `<main>` 地标；重复导航/铬件在主内容之前时，"Skip to content" 链接为首个可聚焦元素；锚点标题加 `scroll-margin-top`。
14. **Survive Zoom and Text Resize**：200% 缩放可用、320px 宽度重排无横向滚动；文本容器用 `min-height` 不用固定 `height`；断点优先 `rem`（符合代码库惯例时）；viewport meta 不得限制缩放上限。

### P1. focus-and-keyboard.md 细则（18 条）

15. 自定义焦点环首选方案：只加 `outline-offset: 2px` 保留浏览器环；次选 `outline: 2px solid var(--focus-ring); outline-offset: 2px`。
16. `outline: 2px solid`（无色）渲染为 `currentColor`，不自动合格——须检查整个周长跨过的所有相邻色（组件填充、页面底色、图片、渐变、hover/selected 态）。
17. `forced-colors: active` 下保留默认色调整或显式用系统色如 `Highlight`；除非控件仍可感知，禁 `forced-color-adjust: none`。
18. 包装容器需亮起时用 `:focus-within`（如边框内含图标的搜索框）。
19. Skip link：首个可聚焦元素，指向 `<main id="main">`；未聚焦时视觉隐藏（`position:absolute; inset-inline-start:-999px`），聚焦时显示。
20. 页内锚点目标加 `scroll-margin-top`（sticky header 下示例 80px）。
21. `tabindex="0"`：仅用于非原生可聚焦的自定义交互元素；`tabindex="-1"`：仅 JS 聚焦（移焦目标标题、模态容器、roving 成员）；正值永不。
22. Roving tabindex：tabs/menus/toolbars/radio groups 占单一 Tab 停点；方向键同时移动焦点和 `tabindex="0"` 归属；`aria-selected` 标记。
23. 焦点陷阱现代做法：背景 `inert = true`；打开时聚焦 `[autofocus]` 或首个 `button,[href],input,select,textarea`；关闭时 `inert = false` 并焦点回触发器。
24. 优先原生 `<dialog>` + `showModal()`（自带陷阱/inert/Escape）；自定义浮层须 `role="dialog"` + `aria-modal="true"` + `aria-labelledby` 指向标题。
25. 打开时聚焦首个可聚焦元素；破坏性确认对话框改聚焦破坏性最小的动作。
26. 关闭时焦点回触发器；触发器已不存在则移到最近逻辑容器。
27. 对话框加 `overscroll-behavior: contain`。
28. APG 键盘表：Dialog=Tab/Shift+Tab 内部循环、Escape 关闭；Tabs=方向键移动（环绕）、Tab 出到面板、Home/End 跳首尾；Menu button=Enter/Space/ArrowDown 开并聚焦首项、ArrowUp 开并聚焦末项、Escape 关并回焦按钮；Disclosure/accordion=头是 `<button aria-expanded>`、Enter/Space 切换；Combobox=ArrowDown 开/入列表、Enter 接受、Escape 关并回输入框、键入过滤；Listbox/radio group=方向键移动选中、整组一个 Tab 停点。
29. 通用规则：Escape 关闭最后打开的层（tooltip→menu→dialog 顺序）；复合控件内用方向键不用 Tab；tabs 激活模式：面板即时渲染用 automatic，切换昂贵用 manual；Enter 提交聚焦 input 所在表单，`<textarea>` 中 Enter 换行、⌘/Ctrl+Enter 提交。
30. SPA 路由切换：更新 `document.title` 匹配新上下文；焦点移到新视图 `<h1 tabindex="-1">` 或 `<main>`；后退/前进恢复滚动位置，前进导航滚到顶部。

### P2. semantics-and-aria.md 细则（15 条）

31. ARIA 五规则：原生优先 / 不改原生意图 / 交互控件必须可键盘操作（role 是完整键盘模型的承诺）/ 可聚焦元素上禁 `role="presentation"` 和 `aria-hidden="true"` / 所有交互元素必须有可访问名称。
32. `<a href>`=导航（免费 Cmd/Ctrl/中键、右键复制链接、Enter）；`<button>`=动作（免费聚焦、Enter+Space、表单语义）；`<div onClick>`=什么都不行。
33. 看起来可点就必须可点；反之可点就必须是真交互元素；"导航的按钮"应是 styled `<a>`。
34. 原生元素实在不可用的完整 polyfill：`role="button"` + `tabindex="0"` + Enter 和 Space 双处理器。
35. 地标：一个可见主 `<main>`；`<header>/<nav>/<aside>/<footer>` 自动成地标；同类多个地标须区分命名 `<nav aria-label="Primary">` / `<nav aria-label="Breadcrumbs">`。
36. 标题是结构不是样式——用 CSS 定尺寸而非按大小选标签；单一 h1/嵌套规范不单独报 WCAG 失败（除非有具体导航/理解影响）。
37. `<title>` 最具体在前：`Billing · Settings · Acme`。
38. 名称优先级：`aria-labelledby` > `aria-label` > 原生 label（`<label>`/文本内容/`alt`）> `title`；优先可见文本或 labelledby——`aria-label` 不可见、易漂移、翻译工具处理不一致。
39. Label in Name（WCAG 2.5.3）：可见 label 必须含在可访问名称内（显示 "Send" 的按钮不能 `aria-label="Submit message"`）。
40. 即使设计省略可见 label，可访问名称也必须存在。
41. 品牌名/代码 token/标识符加 `translate="no"`。
42. 常见 ARIA 错误五条：`aria-label` 挂普通 `<div>/<span>`（多数读屏器忽略）；`<button role="button">`（冗余）；`aria-hidden` 在可聚焦元素上/上方；`aria-labelledby/describedby` 指向不存在的 ID（静默无名）；`role="menu"` 用在站点导航列表（menu 承诺应用级方向键行为，站点导航应 `<nav>` + 列表）。
43. 原生 `disabled` 提供完整禁用行为（移出 Tab 序、抑制激活、`:disabled` 样式、表单提交排除）；`aria-disabled="true"` 只播报状态，不改聚焦性/行为/样式。
44. 原生 `disabled` 控件上的 tooltip 永远不向键盘/触屏用户开放——把原因放旁边持久可见文本，或改用 `aria-disabled` 保持可聚焦可悬停。
45. 用 `aria-disabled="true"` 时：处理器中阻断指针+键盘激活、阻止表单提交、显式样式（含 forced-colors 支持）、就近解释不可用原因；同一元素永不同时设 `disabled` 和 `aria-disabled`；禁用控件豁免对比度下限但仍须可读。

### P3. forms.md 细则（18 条）

46. 每个控件程序化 label：`<label for>` 对 input `id`，或包裹 `<label>`。
47. 必填标记：原生 `required` + 每表单解释一次的可见指示（"* required"）。
48. placeholder 只能作为 label 之外的格式示例（`placeholder="name@company.com"`）。
49. 错误模式完整四件：`aria-invalid="true"`（修复后移除）+ `aria-describedby` 指向内联错误 + 内联错误带图标或文本（绝不只有红边框）+ 提交后聚焦第一个无效字段。
50. 允许不完整提交以暴露校验；不要在表单有效前禁用提交。
51. 接受自由文本、提交后校验；不要边输入边拦截/过滤字符；校验前 trim（autocomplete/文本扩展会带尾随空格）。
52. `autocomplete` 是 WCAG 1.3.5 对用户相关字段的要求；token 表：name/given-name/family-name、email、tel、street-address/address-line1/postal-code/country、cc-number/cc-exp/cc-csc/cc-name、username/current-password、new-password、one-time-code；分段前缀如 `autocomplete="shipping street-address"`。
53. 类型表：email/url/tel 用对应 `type`；OTP/PIN/卡号用 `type="text" inputmode="numeric"`；金额小数用 `type="text" inputmode="decimal"`；真数值量用 `type="number"`。
54. email/验证码/用户名加 `spellcheck="false"`。
55. 永不阻止 `<input>/<textarea>` 粘贴（用户粘贴密码和一次性码）。
56. 兼容密码管理器和 2FA 自动填充：真 `<form>`、正确 `autocomplete`、无假 input。
57. 提交行为：请求发起前保持可用；请求中禁用 + spinner 但保留原 label（"Save"+spinner，不是裸 spinner——label 告诉辅助技术哪个按钮忙）。
58. 结果播报：成功走 polite live region；提交失败聚焦第一个无效字段（焦点移动即播报）；`role="alert"` 只留给不绑字段的表单级错误。
59. 导航前警告未保存修改；重渲染永不丢已输入内容；hydration 必须保留焦点和值。
60. Enter 从任何聚焦 input 提交；`<textarea>` 中 ⌘/Ctrl+Enter 提交。

### P4. screen-readers.md 细则（11 条）

61. `.sr-only` 范式：`position:absolute; width/height:1px`（不用 0——部分读屏器跳过零尺寸）`; padding:0; margin:-1px; overflow:hidden; clip:rect(0 0 0 0); clip-path:inset(50%); white-space:nowrap（防连读）; border:0`；禁用 `display:none`/`visibility:hidden` 实现；Tailwind `sr-only`；skip link 加 `focus:not-sr-only`。
62. 播报决策表（从上到下首个匹配停）：①焦点本来就会移过去（模态打开/首个无效字段）→ 不需额外播报；②绑定具体控件（字段错误/字数）→ `aria-describedby`；③非紧急不绑控件（toast/"Saved"/结果数/加载态）→ `role="status"`；④紧急不绑控件（表单级失败/会话过期）→ `role="alert"`。
63. live region 等价关系：`role="status"` = `aria-live="polite"` + `aria-atomic="true"`；`role="alert"` = `aria-live="assertive"` + `aria-atomic="true"`。
64. 可靠播报规则：重复 polite 更新须先渲染稳定空区域再改文本（新区域连同内容一起插入的播报不稳定）；动态 `role="alert"` 常被播报但行为不一须实测；默认 polite（assertive 滥用是最常见错误）；消息短而自包含（`aria-atomic` 整体重读）。
65. 不把焦点移到 toast；toast 给足超时或关闭按钮；唯一动作路径绝不只放在自动消失的 toast 里。
66. 加载态：更新区域设 `aria-busy="true"`，polite 播报 "Loading…"，完成后播报结果（"Loaded, 12 results"）。
67. `aria-hidden="true"` 移除整个子树；只用于装饰图标和视觉重复内容；绝不在可聚焦元素上/上方；若隐藏了交互元素须同时移出 Tab 序。
68. Alt 五类表：装饰/与相邻文本冗余 → `alt=""`（空但必须存在）；信息性 → 描述含义；功能性 → 描述动作/目的地；文字图片 → 精确原文（更好：用真文字）；复杂图（图表）→ alt 短摘要 + 附近表格/全文。缺 `alt` 属性比空 alt 更糟（读屏器回退读文件名）。
69. SVG：装饰性 `aria-hidden="true"` + `focusable="false"`（legacy Edge/IE），无需 title；有意义内联 `role="img"` + `aria-label`（或首子 `<title>` 经 `aria-labelledby` 引用）；简单场景 `<img src="icon.svg" alt="…">` 最可靠。
70. 预录视频需字幕；音频提供转录；永不带声自动播放；始终渲染控件。

### P5. hit-areas.md 细则（13 条）

71. 尺寸四级标准：WCAG 2.5.8 AA 24×24px 硬地板 / WCAG 2.5.5 AAA 44×44px / Apple HIG 44×44pt / Material 48×48dp；推荐触屏主控件 44px、桌面 40px（密度允许时）。
72. 报小控件前先查 2.5.8 五例外：spacing、equivalent-control、inline、user-agent、essential。
73. Spacing 例外算法：以目标包围盒中心画 24px 圆，不与任何其他目标或其他过小目标的圆相交即过；简单情形 20px 目标需 ≥4px 间距。
74. 视觉元素可小，命中区必须大；看起来可点就必须在整个视觉范围内可点，无死区。
75. 伪元素扩展挂在包裹的 `<label>`/`<button>` 上，不挂 `<input>`（替换元素渲染 `::before/::after` 不可靠）；示例 20px checkbox 扩展 44px：`after` 居中 `transform: translate(-50%,-50%)` + `width/height:44px`；Tailwind `after:absolute after:top-1/2 after:left-1/2 after:size-11 after:-translate-1/2`。
76. 布局替代：元素放得下真实盒尺寸时直接 `min-width/min-height:44px` + `inline-grid place-items:center`（给浏览器真实几何用于滚动和手势）。
77. 碰撞规则：扩展命中区与另一交互元素重叠时收缩伪元素到不碰撞的最大值；两交互元素命中区永不重叠。
78. 装饰层（渐变 scrim/glow/模糊光泽/全出血 `::after`）会吸收其覆盖的所有指针事件——必须 `pointer-events: none` + `aria-hidden="true"`。
79. 用户预期可点的层保留指针事件：点击即关闭的 modal scrim 是控件不是装饰。
80. 触屏行为：交互元素 `touch-action: manipulation` 消双击缩放延迟；自实现平移/缩放/拖拽的表面 `touch-action: none` 且只作用于该表面（页面级会夺滚）；`-webkit-tap-highlight-color` 按设计设置替代默认灰闪；hover 样式包 `@media (hover: hover)`（触屏 :hover 点击后粘住；Tailwind 4 `hover:` 已自动在此查询下编译）；宁要宽大目标+清晰 affordance，不要精细拖拽柄/精确悬停区。

### P6. motion-and-zoom.md 细则（12 条）

81. 动效 opt-in：所有动画包 `@media (prefers-reduced-motion: no-preference)`；Tailwind 用 `motion-safe:` / `motion-reduce:` 变体。
82. 存量代码无法 opt-in 时的全局兜底：`@media (prefers-reduced-motion: reduce)` 内 `animation-duration:0.01ms !important; animation-iteration-count:1 !important; transition-duration:0.01ms !important; scroll-behavior:auto !important`——用 `0.01ms` 而非 `none`，保证 `animationend/transitionend` 仍触发、等事件的 JS 不挂死。
83. 降级三分表：**完全禁用**=视差滚动、自动播放视频/GIF/循环装饰、旋转与跨屏大位移；**替换**=滑动/缩放/缩放过渡→opacity 交叉淡化、平滑滚动→瞬时跳转、自动轮播→默认暂停；**保留**=加载 spinner 与进度、即时状态变化（hover 色、焦点环）、短暂功能反馈（按压）。
84. 动画必须可打断、由用户输入驱动；reduced motion 下轮播默认暂停。
85. WCAG 2.2.2：自动移动/闪烁/更新超 5 秒须可见暂停/停止控件（含静音循环 hero 视频）。
86. Toast 计时规则：显式关闭优先；自动消失只用于低风险确认；含动作/错误/需行动信息的 toast 停留至手动关闭；必须计时的 5 秒为下限，悬停/聚焦暂停计时。
87. 关键信息绝不只放在计时元素里（消失 toast 里的唯一 undo 链接=定时数据丢失）。
88. WCAG 1.4.4：200% 缩放下所有内容和功能可用；viewport 不得禁止用户缩放。
89. WCAG 1.4.10：1280px 视口 400% 缩放（等效 320px）下仅纵向滚动；二维内容（表格/地图/代码块）在自身容器内滚动。
90. 缩放下先坏的是固定高度：文本容器用 `min-height` 让容器生长。
91. rem/px 选择：尊重代码库现状不混单位；有选择权时——`rem` 用于 font-size、文本容器 max-width、媒体查询断点（`@media (min-width:48rem)`）、随文本缩放的间距；`px` 用于边框/hairline、焦点环宽度与 offset、box-shadow 细节、固定尺寸装饰。
92. 断点是单位选择最关键处：大基准字号下 em/rem 查询会在文本需要时切到移动布局，px 查询不会。

### P7. SKILL.md 13 条 Common Mistakes（错误→修复对照）

93. `outline:none` 去焦点环 → 改样式 `:focus-visible`（点击不显示）。
94. 自定义焦点色想当然可用 → 对所有相邻色和 forced-colors 模式验证完整指示器。
95. `<div onClick>` 当按钮/链接 → 动作 `<button>`、导航 `<a href>`。
96. placeholder 当唯一 label → 加可见 `<label for>`（placeholder 输入即消失）。
97. 正值 tabindex 修焦点顺序 → 修 DOM 顺序；只用 0/-1。
98. 重复 polite 更新播报不一致 → 稳定空 status 区域改文本 + 实测目标读屏器。
99. 常规 toast 用 assertive → 用 polite；assertive 只留错误。
100. 可聚焦元素上 `aria-hidden="true"` → 移除之或使元素不可聚焦。
101. 功能图标 alt 描述图案 → 描述动作（`alt="Search"` 非 `alt="magnifying glass"`）。
102. 表单有效前禁用提交 → 保持可用；提交时校验并聚焦首个错误。
103. 装饰 glow/gradient 吞点击 → 该层 `pointer-events:none` + `aria-hidden="true"`。
104. 触屏 tap 后 hover 样式粘住 → `@media (hover: hover)` 门控。
105. 原生 `disabled` 控件挂 tooltip → 旁边持久文本，或改 `aria-disabled` 保持可聚焦。

### P8. review-output.md 审查输出规范（7 条）

106. 按原则分组 confirmed findings，Markdown 表格列：**Severity / Location / Before / After / Why**；禁用独立 "Before:"/"After:" 行。
107. Severity 定义：HIGH=阻断任务/对辅助技术隐藏内容/系统性无障碍失败；MEDIUM=交互显著变难；LOW=孤立打磨项。
108. Location 用 `path/to/file:line`；无源文件工件则引用确切屏幕与组件。
109. 重复性系统问题合并为一行并列出全部受影响位置；无发现的原则省略。
110. Verification 段：列出实际跑过的检查及观测结果（键盘遍历、可访问名称检查、读屏器/自动化检查）；未跑的须声明待验证。
111. Verdict 三级：有 HIGH 残留=**Block**；仅 MEDIUM/LOW=**Needs changes**；无可行动发现=**Approve**；零发现时省略表格、声明 "No actionable accessibility findings" + verification + Approve。
112. 独立审查与编排关系：独立 a11y 审查用本格式；被 `better-interface` 编排时由 better-interface 拥有格式/severity/合并/上限/verdict，本技能只交域证据与发现。

**规则总计：14 原则 + 98 条细则/错误/输出规范 = 112 条可执行项。**

## ③ 对工程质量四维度的支撑点

- **组件化**：核心支撑。规则 28/31–34/43–45 实质定义了**自定义组件的可访问契约**——role 即承诺（键盘模型+状态+名称+焦点行为），可直接转为 workflowhub 组件验收接口：任何自定义 widget 组件必须声明其 APG 模式、tabindex 策略、名称来源、disabled 策略四项。模态（23–27）与表单字段（46–60）是两个完整组件级参考实现。
- **统一性**：焦点环 token 化（2/15–16）、live region 统一决策表（62–64）、alt 分类表（68）、错误播报模式（49/58）保证全站一致的 a11y 行为；`translate="no"`（41）、title 格式（37）是文案统一。
- **可维护性**：优先原生（1/31–34）直接减少代码量与维护面；review-output 规范（106–112）给出可复用的审查产物结构与三级裁决，可机器化；Common Mistakes 表（93–105）天然是 lint 规则对。
- **性能**：间接——rem/px 断点（91–92）、避免 JS 焦点管理的原生 `<dialog>`（24）、`0.01ms` 兜底保事件（82）体现"少 JS 多平台"的性能取向；无直接性能规则。

## ④ 与 workflowhub 的精确集成点

- **frontend-component-quality**：主集成点一。14 原则 + Common Mistakes 13 条并入组件质量 checklist；规则 28（APG 键盘表）、43–45（disabled 策略）、75–77（命中区）作为组件级验收项；review-output.md 的 Severity 表和 Block/Needs changes/Approve 裁决直接复用为 component-quality 的输出格式。
- **frontend-testing / isolated-browser-qa**：主集成点二。需运行时验证的规则归入此：键盘全流程走查（3/28/29）、模态焦点陷阱实测（23–27）、SPA 路由焦点与 title（30）、toast 计时暂停（86）、200% 缩放/320px 重排（88–90）、live region 实测（64）、`@media (hover:hover)` 触屏行为（80）。
- **ui-parity-checklist**：焦点环视觉（15–17）、sr-only 模式（61）、skip link（19）作为 parity 检查项。
- **design-extractor**：焦点 token（15）、命中区尺寸（71）、rem 断点（91）提取为设计 token。
- **verify-change**：改动组件重跑 a11y 子集。
- **frontend-prototype-render**：原型生成时内嵌默认合规（原生元素优先、label 必填、焦点环 token），把 1/6/2 变成生成约束而非事后审查。

## ⑤ 移植风险

- **许可证**：MIT（frontmatter），可复制改写。
- **依赖**：无运行时依赖、纯 Markdown；但交叉引用三个姐妹技能（better-colors / better-typography / better-layout）和上位编排 better-interface——独立移植时须声明这四条边界或裁剪（原则 9 的对比度测量直接外包给 better-colors，不移植则该原则退化为"报出不达标色对"）。
- **上游漂移**：规则自包含于仓内文件（与 web-design-guidelines 相反，无远端抓取），漂移风险低；风险在 WCAG/APG 标准本身演进（2.5.8 较新），需定期人工对齐。
- **冲突**：与 web-design-guidelines 约 20 条重叠（焦点环、表单 label、aria-label、paste、reduced-motion、toast、hit area 阈值等）——且细则更深（如命中区 24/40/44 三级 vs WDG 无阈值）。合并策略：以 better-accessibility 为 a11y 单一来源，WDG 重叠条目标注引用不重复实现，避免双报。

## ⑥ 验证或推翻之前结论

**之前结论：better-accessibility = 14 原则 + 13 错误并入 component-quality/testing。**

⚠️ **部分推翻，需升级**：14 原则 + 13 错误只是 SKILL.md 的骨架；**真正的可执行规则主体在 6 个 reference 文件里（98 条细则）**，含具体阈值（24×24/44×44/40×40/4px 间距/5 秒/200%/320px/0.01ms/48rem）和完整代码模式（sr-only、roving tabindex、inert 陷阱、错误播报四件套）。只搬 14+13 会丢掉约 70% 的可执行内容。修正后结论：**14 原则作 checklist 骨架，98 条细则作 component-quality 验收规则库与 testing 场景库，review-output.md 作统一审查输出格式**——三者一起并入，不是只并入两个数字标题。

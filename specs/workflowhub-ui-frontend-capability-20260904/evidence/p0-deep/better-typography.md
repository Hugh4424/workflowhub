# P0 深度精读笔记：better-typography

来源：`/Users/Hugh/Hugh/Project/Website-skills/better-typography/`
读取范围：SKILL.md（137 行）+ 全部 7 个 references 文件（choosing-fonts.md / variable-fonts-and-opentype.md / spacing-and-sizing.md / wrapping-and-punctuation.md / details-and-accessibility.md / css-cheat-sheet.md / review-output.md），逐字读完。

## ① 核心机制（一句话）

好排版 = 克制：一套带语义命名的字阶（每阶绑定 size+line-height+weight 三合一的角色决策）+ 按角色给行高/字距/行长处方 + 用 CSS 高层属性（非 raw OpenType tag）控制渲染，review 时读页面而非扫代码。

## ② 完整可执行规则表

### A. 字体选择（choosing-fonts.md）

| # | 规则 | 具体数值/处方 |
|---|------|--------------|
| A1 | 字体类别→用途 | Serif：长文/编辑阅读；Sans-serif：多数界面默认（Helvetica/Inter/Geist）；Monospace：代码/表格/表格数据；Display：营销标题/hero；Script：极稀有装饰 |
| A2 | 字体名里的 "Display" 不等于 display 字体 | SF Pro、Heldane 等同时发 Display（大尺寸用）和 Text（小尺寸用）变体；按所设字号选匹配变体 |
| A3 | 字体数量上限 |  rarely 超过 3 个；营销页可比 app 更富表现 |
| A4 | 字重/字号同样克制 | 它们定义层级，但滥用快速伤害可读性 |
| A5 | 配对求对比不求相似 | serif 标题 + sans 正文 = 刻意的 display/reading 分工；两个近乎相同的 sans-serif 并排 = 错误感 |
| A6 | 细字重仅 display 用 | **18px 以下保持 weight 400+**；Ultralight/Thin/Light（100–300）在正文字号和低 DPI 屏上消失；保留给 **28px+** 的 display 文本，且即使那里也要检查对背景是否立得住 |
| A7 | 字体族范围纪律 | 应用/review 排版永不需要新字体；用产品既有字体系，除非任务明确要求换字体；不为满足 review 清单引入付费/专有字体；font smoothing、text wrapping、tabular numbers 等渲染细节不覆盖项目所选字体族 |
| A8 | 被要求换字体时的栈 | 系统原生 macOS/iOS 感 = 系统栈 `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`；商业品牌字体（如 Helvetica Now）是品牌决策，保留实用 fallback 栈（`"Helvetica Now", "Helvetica Neue", Arial, sans-serif`） |
| A9 | web 格式只发 `.woff2` | Brotli 压缩、广泛支持；`.woff` 仅非常老浏览器 fallback；`.ttf`/`.otf` 是无 web 压缩的桌面原始格式 |
| A10 | 字体解剖学术语 | x-height（小写 x 高）、cap height、baseline、ascender、descender；同 `font-size` 两字体视觉大小不同的原因——x-height 大的显大 |

### B. 可变字体与 OpenType（variable-fonts-and-opentype.md）

| # | 规则 | 具体数值/处方 |
|---|------|--------------|
| B1 | 静态 vs 可变选择 | 一两个 weight：静态文件可能更小；多个 weight/光学尺寸/自定义轴：可变字体更合理。可变不自动更好 |
| B2 | 加载设计实际用的 face，浏览器会合成缺失的 weight/style | 优先加载所需 face |
| B3 | `font-synthesis: none` 仅在验证后设 | 须验证完整 fallback 栈上每个 bold/italic/small-cap/上标/下标仍视觉可区分；`none` 一并禁用 weight/style/small-cap/sup/sub 合成，可能在真 face 不可用时抹掉强调区别。禁用合成不是诊断手段，不得抹掉强调 |
| B4 | 只不想要一种合成模式时用具体 longhand | `font-synthesis-weight`、`font-synthesis-style` 等，不用一揽子 shorthand |
| B5 | 轴（axis）表 | `wght` 笔画粗细；`opsz` 光学尺寸（按显示尺寸调细节与间距）；`wdth` 字形宽度；`slnt` 倾斜角；自定义轴如 `GRAD`（Roboto Flex）。Inter 可变文件只暴露 `wght` 和 `opsz` |
| B6 | 有 CSS 属性就用属性，不用 raw tag | `font-weight: 650` 而非 `font-variation-settings: "wght" 650`（属性在非可变 fallback 渲染时仍工作，raw tag 静默失效）；`font-optical-sizing: auto` 而非 `"opsz"`；raw tag 保留给无属性的自定义轴（`font-variation-settings: "GRAD" 80`） |
| B7 | OpenType feature 表 | `tnum` 表格数字（等宽数字）；`zero` 斜杠零（区分 0/O）；`liga` 连字；`ss01`–`ss20` 风格集；`cv01`–`cv99` 字符变体。feature 在静态和可变字体上行为一致 |
| B8 | feature 同轴规则：优先 `font-variant-*` 属性 | `font-variant-numeric: tabular-nums` 而非 `font-feature-settings: "tnum" 1`；`font-variant-numeric: slashed-zero` 也可用属性；`font-feature-settings` 保留给无属性的 tag（如 `"ss01" 1`） |
| B9 | 变化中的数值用 tabular-nums | 比例数字每位宽度不同，计时器/计数器/价格更新时布局位移 |
| B10 | small caps / 上下标 | 真 small caps 用 `font-variant-caps`；上下标真字形用 `font-variant-position`；两者都要求字体包含字形 |
| B11 | 风格集/字符变体槽位逐字体不同 | `ss01` = 风格集 01 槽、`cv11` = 字符变体 11 槽，编号不命名因为含义逐字体不同，查字体文档；Inter 中 `ss01` = 开放数字、`cv11` = 单层 a |

### C. 间距与字号（spacing-and-sizing.md）

| # | 规则 | 具体数值/处方 |
|---|------|--------------|
| C1 | 单位行为 | `px` 固定；`em` 随当前字号；`rem` 随根字号；`font-size` 上 `%` 相对父级、行为同 `em` |
| C2 | 字阶（type scale）= 一小组预定义尺寸，尽量少偏离 | 硬编码无体系尺寸在规模上崩坏。示例：`--text-sm: 0.875rem; --text-base: 1rem; --text-lg: 1.125rem; --text-xl: 1.5rem; --text-2xl: 2rem` |
| C3 | 可选现成 scale | Tailwind 字阶（`text-xs`–`text-9xl`，每类配 size+匹配 line-height）是可靠的现成选择 |
| C4 | 命名按项目规模 | 单人项目默认名（`text-sm`）可以，只要用法规则清楚；团队项目按**用途**命名（`text-body-sm`）而非按尺寸，保证规则一致 |
| C5 | 角色化字阶 = 每个 size 绑定 line-height 和 weight，一个角色一次决策而非三次 | 产品界面起点表：Display `2.25rem`(36px)/`1.1`/`600`；Title `1.5rem`(24px)/`1.2`/`600`；Heading `1.125rem`(18px)/`1.3`/`600`；Body `1rem`(16px)/`1.5`/`400`；Caption `0.8125rem`(13px)/`1.4`/`400` |
| C6 | 角色内强调 = 升一个字重档（400→500），不改字号 | — |
| C7 | 标题层级映射到字阶降序 | `h1 → --text-2xl; h2 → --text-xl; h3 → --text-lg`；Tailwind 中每级一个 utility，集中在组件或 `@layer base` 而非内联重复 |
| C8 | review 时比较同一语义区块内标题的计算字号 | 子标题意外比父标题显眼 = 破坏视觉层级；scale 舒适阶用完时深层级可共享字号，靠 weight 或 letter-spacing 区分；标题不应小于正文，除非刻意做 label 式 overline |
| C9 | 标题语义归 better-accessibility | 从文档结构选元素，用本技能让结构视觉可读；**永不因浏览器默认字号选标题元素** |
| C10 | kerning 内置于字体、浏览器自动应用 | 只刻意用 `font-kerning: none` 关掉 |
| C11 | letter-spacing 按尺寸处方 | 大标题常略负（示例 `-0.02em`）；小型大写标签需略正（示例 `0.05em` 配 `text-transform: uppercase`）；正文字号不需要 |
| C12 | 行高按角色 | 标题 ~`1.1`；正文 `1.5`–`1.6`；**优先无单位值**（随字号缩放；`line-height: 24px` 不缩放）；Tailwind `leading-snug`/`leading-normal`/`leading-relaxed` 是很少需覆盖的合理默认 |
| C13 | 紧行高只用于短文本 | 任何折行 ≥3 行的文本至少 `1.4`，即使在限高的列表行/卡片里（反例：卡片描述 `line-height: 1.1` → 改为 `1.4`） |
| C14 | `text-box` 修剪字体预留的上下空间 | 解决按钮/徽章里文字偏低；两段语法：trim 哪些边（`trim-both`/`trim-start`/`trim-end`）+ 在哪里 trim（`cap`=帽高顶部、`alphabetic`=基线底部、`text`=字体自身文本边、保留 descender 空间）。示例：`text-box: trim-both cap alphabetic`（徽章）、`trim-start cap`（标题）、`trim-end alphabetic`（标签） |
| C15 | `text-box` 支持度 | Chromium 133+、Safari 18.2+，Firefox 未支持；当渐进增强用，不支持的浏览器保持默认 leading |

### D. 折行与标点（wrapping-and-punctuation.md）

| # | 规则 | 具体数值/处方 |
|---|------|--------------|
| D1 | 行长（measure）上限：长文 **60–75 字符/行** | 任意单位；`65ch` 直接量字符（1ch=当前字体 0 的宽）；16px 正文字号下 60–75 字符 ≈ `560px`–`680px`，Tailwind `max-w-xl`(576px) 或 `max-w-2xl`(672px) 适配；重要的是上限存在且落进区间；正文字号变了要复查 |
| D2 | 对齐 | `text-align: justify` 拉伸空格对齐全两边——特定编辑版式可用，多数界面避免，用 `text-align: start` |
| D3 | 折行四属性处方 | `text-wrap: balance`（多行均分）→ 标题；`text-wrap: pretty`（避免末行孤词）→ 描述文本；两者合用效果最佳；`overflow-wrap: break-word` → 长词/链接/ID 可能逃出容器处；`white-space: nowrap` → 折行显得破碎的标签/徽章 |
| D4 | 长文跳过 balance/pretty | 浏览器对超过几行的文本忽略 balance；整段均分浪费空间且更难读 |
| D5 | 截断 | 单行：`text-overflow: ellipsis` + `overflow: hidden` + `white-space: nowrap`；多行：`line-clamp` 任意行数 |
| D6 | 截断隐藏内容 | 若缺失文本重要，须在别处可达（tooltip 或展开视图） |
| D7 | 大小写 | 文案以自然大小写存储，展示用 `text-transform` 控制——改展示永不需要改文案 |
| D8 | 智能标点替换表 | 直引号→弯引号（代码里保留直引号）；范围连字符→en dash（`2010–2020`）；两个连字符的插入语→em dash 字符；三个点 `...`→单字符省略号 `…`；`16 px` 中的普通空格→`&nbsp;`（值永不拆行）；失控断词→`&shy;` 标记允许断点 |
| D9 | 国际化 | 设 `lang`（浏览器选对引号/断词/发音）；在方向变化的文档或内容边界设 `dir`；空间镜像和逻辑属性表归 better-layout |
| D10 | 混合方向文本两条细则 | 1) 长段落按自身语言对齐：一两行片段跟随周围 UI 方向，**≥3 行段落**按自身文字方向对齐（RTL 界面里的英文段落保持 start 对齐 LTR）；`text-align: start` + 段落元素上正确 `lang`/`dir` 处理。2) **永不反转数字**：数字在任何方向保持数位顺序（电话号码、"541" 在 RTL 中照样读）；浏览器经 Unicode bidi 算法处理，不要手工重排对抗它；相邻 RTL 文本干扰时用 `<bdi>` 包裹混合值 |

### E. 细节与可达性（details-and-accessibility.md）

| # | 规则 | 具体数值/处方 |
|---|------|--------------|
| E1 | 下划线取字体自身度量 | `text-underline-position: from-font` + `text-decoration-thickness: from-font`；默认下划线位置由浏览器决定——有时太近、切断 descender 或太细 |
| E2 | 手动微调下划线 | 示例：`text-decoration-thickness: 1px; text-underline-offset: 3px; text-decoration-skip-ink: auto; text-decoration-color: var(--color-gray-1000); transition: text-decoration-color 200ms ease-out` |
| E3 | 点状下划线 = "此词带额外信息"的通用暗示 | `abbr { text-decoration: underline dotted; }`（缩写/定义术语） |
| E4 | 下划线动画 | 除非唯一动画的是颜色变化，否则把下划线建成独立元素而非用 `text-decoration`——真实下划线只有颜色部分动画可靠 |
| E5 | 选区 | `::selection` 改选中文本背景/色，可嵌入品牌但组合须保持可读；`::target-text` 样式化分享链接滚动到的短语；Custom Highlight API 不加标记样式化自选范围（如搜索命中） |
| E6 | 文本默认保持可选中，含应用 chrome | 用户复制标签/标识符/错误/值的方式设计师预料不到；`user-select: none` 仅用于误选中确实干扰交互的特定拖拽/手势表面；不全局应用、不为模仿原生 chrome 应用 |
| E7 | 表单可编辑文本 | `::placeholder` 样式化空字段提示；`caret-color` 给光标上色（光标样式化基本到此为止，全自定义光标极难且通常不值） |
| E8 | iOS 输入缩放：聚焦文字 <`16px` 的输入框会整页缩放 | 无障碍特性：16px 是 web 默认，Safari 视更小为打字时难读。**两个修复都成立但设计后果不同，须问用户选哪个，不默默自选**：方案 1) 移动端放大——`text-base sm:text-sm`，小屏真渲 16px、`sm` 断点起回设计字号（无需补偿，但移动端输入框不再匹配桌面）；方案 2) 缩小渲染——`font-size` 保持 16px 使 Safari 不缩放，用 transform 渲成目标字号，两处补偿 calc：元素宽 ÷ 缩放比、line-height ÷ 缩放比，`origin-left` 钉住起始边（RTL 用 `origin-right`），断点以上去掉 transform 设真实字号。示例：13px 目标 = `w-[calc(100%/0.8125)] origin-left scale-[0.8125] text-base leading-[calc(1.125/0.8125)] sm:w-full sm:scale-100 sm:text-[13px]` |
| E9 | transform 缩放整个盒子不只是字形 | 让 wrapper 绘制字段表面、input 自身保持透明；缩放元素上的背景/边框/ring 随文字缩小、错过预期命中区 |
| E10 | 装饰文本属性表 | `::first-letter`（首字下沉，广泛支持）；`::first-line`；`initial-letter`（下沉尺寸，支持有限、Firefox 未支持）；`background-clip: text`（背景/渐变裁进字形）；`-webkit-text-stroke`（描边，现代浏览器跨前缀可用）；`text-shadow` |
| E11 | 描边在字形内部画线 = 字体问题 | stroke 描每条轮廓，可变字体常保持重叠形状未合并；静态字体无此问题 |
| E12 | 字号地板表 | 长文正文起点 ~`16px`（在实际字体和行长下验证）；输入框/菜单起点 ~`14px`（移动端输入仍须 16px，见 E8）；说明文字 `13px`；地板 = 极少低于 `12px` |
| E13 | 排版须经受读者改变它 | 缩放、更大浏览器字号、覆盖的行高/字距 |
| E14 | 文字看似低对比时 | 用 better-colors 测渲染前景/背景对、better-accessibility 分类适用要求；不改项目颜色除非用户要求修复 |
| E15 | 字体平滑只在根布局设一次 | macOS 上文字渲染比预期重：`html { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }`；Tailwind `antialiased` 同时设两者；**永不按组件设** |

### F. CSS 速查表（css-cheat-sheet.md）

| # | 规则 |
|---|------|
| F1 | 每条排版 CSS 声明给 Tailwind 4 等价物；无 utility 的给 arbitrary-value 形式；按项目选列——plain CSS/CSS Modules/styled-components/StyleX 用声明列，Tailwind 用 utility 列 |
| F2 | 关键映射（全表 4 组 45 条）：Font 组——`font-family` sans/serif/mono → `font-sans/serif/mono`；`font-size` → `text-*`；`font-weight` 1–1000 → `font-*`；italic → `italic`；字体平滑双属性 → `antialiased`；`font-synthesis: none` → `[font-synthesis:none]`；`font-feature-settings` → `[font-feature-settings:"ss01"]`；`font-variation-settings` → `[font-variation-settings:"GRAD"_80]`；`font-optical-sizing` → `[font-optical-sizing:auto]`；`font-variant-caps` → `[font-variant-caps:small-caps]`；`font-variant-position` → `[font-variant-position:super]`；tabular-nums → `tabular-nums`；slashed-zero → `slashed-zero` |
| F3 | Spacing 组——`letter-spacing` → `tracking-*`；`line-height` → `leading-*`；`font-kerning` → `[font-kerning:none]`；`text-box: trim-both` → `[text-box:trim-both_cap_alphabetic]`；文本列 `max-width` → `max-w-xl`/`max-w-2xl`/`max-w-[65ch]`；`text-align` → `text-start`/`text-center` |
| F4 | Wrapping 组——balance → `text-balance`；pretty → `text-pretty`；ellipsis → `truncate`；`line-clamp` → `line-clamp-*`；break-word → `break-words`；nowrap → `whitespace-nowrap`；`text-transform` → `uppercase`/`capitalize` |
| F5 | Decoration 组——underline → `underline`；decoration-color → `decoration-*`；thickness → `decoration-1/2`；offset → `underline-offset-*`；`text-underline-position: from-font` → `[text-underline-position:from-font]`；style → `decoration-dotted/wavy`；`from-font` 厚度 → `decoration-from-font`；skip-ink → `[text-decoration-skip-ink:auto]`；`caret-color` → `caret-*`；`user-select: none` → `select-none`；`text-shadow` → `text-shadow-*`；text-stroke → `[-webkit-text-stroke:1px_black]`；`background-clip: text` → `bg-clip-text`；`initial-letter` → `[initial-letter:3]` |

### G. Review 输出格式（review-output.md）

| # | 规则 |
|---|------|
| G1 | 独立排版 review 两段式；better-interface 编排时格式/严重度/合并/上限/verdict 归它 |
| G2 | findings 按原则分组，五列表 Severity/Location/Before/After/Why；禁止独立 "Before:"/"After:" 行 |
| G3 | Severity：`HIGH` = 文本不可读/不可得/结构误导；`MEDIUM` = 伤害层级/折行/扫读；`LOW` = 孤立排版打磨 |
| G4 | Location 引 `path/to/file:line`；无源文件引确切屏幕和组件 |
| G5 | Before/After 给当前排版和可执行替换 |
| G6 | Why 命名被违反的原则及其对可读性/层级的影响 |
| G7 | 系统性重复问题合并一行列所有位置；无 findings 的原则省略 |
| G8 | Verification 列出确切检查及结果（折行、层级、文本缩放、字体加载、动态值稳定性），未跑的说明待验证项；Verdict：残留 `HIGH` → `Block`，仅 `MEDIUM`/`LOW` → `Needs changes`，无可执行 findings → `Approve` |
| G9 | 无 findings 时省表格，声明 "No actionable typography findings"，报告 verification，`Approve` 收尾 |

### H. SKILL.md 独有原则（references 未覆盖的增量）

| # | 规则 |
|---|------|
| H1 | 标签/表格单元/营销标题/文章段落不应共享一套规则（SKILL.md 开篇） |
| H2 | review 方法：读页面而非扫代码——眯眼看层级是否成立、完整读一段看舒适度、缩放视口抓真实内容长度下的坏折行/孤词/截断 |
| H3 | 职责边界声明：文案措辞归 better-writing；语义标题结构归 better-accessibility；空间 RTL 布局与逻辑 CSS 属性归 better-layout；渲染对子对比度测量与改色归 better-colors；本技能拥有文本如何渲染、折行、混合方向内容中的行为 |
| H4 | 每个修复用项目自己的惯用法写：已在用的样式体系，永不在旁边立第二套 |
| H5 | 常见错误表 23 条（SKILL.md L109–133），绝大多数已映射到上表；独有增量：界面中的两端对齐 → `text-align: start`（justify 留给特定编辑版式）；`leading-none` 用在三行卡片描述 → ≥3 行至少 `1.4`；应用 chrome 全局禁选中 → 恢复选中、仅特定交互冲突处抑制 |

**规则条数合计：约 90 条**（A10+B11+C15+D10+E15+F5+G9+H5，含 F 组 45 条映射按组计 5 条；若 F 组逐条计则 >120）。

## ③ 对工程质量四维度的支撑点

### 统一性（token 体系）
- **角色化字阶（C5）是排版维度的 token 核心**：Display/Title/Heading/Body/Caption 五角色 × (size+line-height+weight) 三值绑定——"一个角色一次决策而非三次"，与 better-colors 的 semantic token 层完全同构。
- **按用途命名而非按尺寸（C4）**：`text-body-sm` 语义命名纪律 = 颜色 token `--color-text-secondary` 的排版对应物。
- **标题层级→字阶降序映射（C7/C8）** 让标题视觉层级来自体系而非一次性尺寸。
- **行长上限（D1）、行高角色表（C12/C13）、字距处方（C11）** 全是可写进 Design.md 的数值 token。
- **"用项目自己的惯用法写修复"（H4）+ Tailwind 映射表（F1–F5）**：统一性纪律延伸到"不引入第二套样式体系"。

### 组件化
- 字体平滑只在根设一次、永不按组件（E15）——明确划分全局 vs 组件职责。
- Tailwind 标题映射集中在组件或 `@layer base`（C7）。
- iOS 输入缩放方案 2 的 wrapper/input 分离（E9）是组件结构处方：表面绘制归 wrapper，缩放归 input。
- 截断须配 tooltip/展开视图（D6）——组件 API 级要求。

### 可维护性
- 自然大小写存储 + `text-transform` 展示（D7）：改设计不改文案。
- 高层属性优先于 raw tag（B6/B8）：fallback 字体渲染时不静默失效——降低未来维护者的调试负担。
- 角色化字阶把三值决策收敛为一（C5），新页面不发明新尺寸。
- `font-synthesis` 的验证前置纪律（B3/B4）防止"修一处坏一片"。

### 性能
- **本技能性能含量三者最高**：`.woff2`-only（A9）直接是加载性能处方；静态 vs 可变按 weight 数选（B1）是字体文件体积决策；`font-synthesis` 控制避免合成渲染；`text-box` 标注支持度、当渐进增强（C15）。
- tabular-nums（B9）消除动态值布局位移 = CLS 改善。

## ④ 与 workflowhub 的精确集成点

1. **Design.md「排版 token」章节**：角色化字阶表（C5 五行：Display/Title/Heading/Body/Caption + size/line-height/weight 三列）直接作为模板表格；字阶命名纪律（C4：团队项目按用途命名）；标题层级映射（C7）。
2. **Design.md「排版原则」章节**：行高角色表（C12/C13，含 ≥3 行至少 1.4）、行长 60–75 字符（D1）、字距处方（C11）、字号地板表（E12）、细字重 18px/28px 门槛（A6）、字体数量 ≤3（A3）。
3. **Design.md「视觉 a11y」章节**：iOS 16px 输入规则 + 两方案须问用户（E8）、文本默认可选中（E6）、排版须经受缩放（E13）——注明语义标题结构归 better-accessibility。
4. **Design.md「治理规则」章节**：用项目既有字体系、不为 review 引入新字体（A7）；修复用项目惯用法（H4）；字体平滑只根设一次（E15）。
5. **Experience.md**：只沾边一条——截断内容的完整值可达性（D6 tooltip/展开）是交互行为，可列入 Experience.md 的组件交互约定；其余全部归 Design.md。
6. **不进 Design.md、进 references 的内容**：OpenType/可变字体细节（B5–B11）、智能标点替换表（D8）、RTL/bidi 细则（D9/D10）、装饰文本（E10/E11）、CSS↔Tailwind 速查表（F1–F5）——这些是"用时查阅"的执行参考，应进 build-code/frontend 技能的 references。review 输出格式（G1–G9）归 review 类技能。

## ⑤ 移植风险

1. **四重归属边界**：better-writing（文案）、better-accessibility（语义标题）、better-layout（RTL 空间/逻辑属性）、better-colors（对比度）四处外指。移植不全时 Design.md 引用悬空，需改写归属声明或同步规划。
2. **`text-box` 支持度缺口**（C15：Chromium 133+/Safari 18.2+/Firefox 无）：写进模板时必须带"渐进增强"限定，否则 Firefox 下预期落空。
3. **角色化字阶起点表（C5）是"产品界面"特化**：营销页/编辑类产品不能直接套（Display 36px 起步对 hero 太小）。模板需标注适用范围。
4. **iOS 输入缩放两方案（E8）含"须问用户"的人机交互要求**——workflowhub 的自动化流程（build-code 自动执行）必须保留这个确认点，不能静默选方案，否则违反技能本身的纪律也和宪法"不可逆操作经人确认"一致。
5. **数值处方的 px 锚点**（16px/14px/13px/12px、18px/28px、60–75ch）都基于 web 默认 16px 根字号；目标项目根字号非 16px 时需整体换算。
6. **智能标点表（D8）是英文排版中心**：en dash/em dash/弯引号规则对中文项目部分不适用（中文有自己的标点规范），移植到面向中文的模板时需本地化标注。
7. **CJK 无覆盖**：技能全文未提中文/日文排版的特殊规则（行高需求更高、无字距负值、标点挤压等），workflowhub 若服务中文项目，这块是空白，需要自补。

## ⑥ 验证或推翻之前结论

**之前结论**：better-typography 是"原则提炼进 Design.md 模板"②类，并入 ui-project-init。

**结论：验证，且三者中②类纯度最高**——但同样有两块应分流到 references：

1. **验证的部分**：角色化字阶（C5）、行高/行长/字距/字号地板数值处方（C12/C13/D1/C11/E12）、细字重门槛（A6）、字体数量上限（A3）——全部是声明式项目规范，天然是 Design.md 模板章节内容。本技能几乎每条核心原则都带数值，是三个 P0 中"数值处方密度最高"的，②类判断完全成立。

2. **应分流的内容**：
   - **CSS↔Tailwind 速查表（F1–F5，45 条映射）**：纯执行时查阅工具，体量约等于全部原则总和，绝不能进 Design.md 模板。→ 进 build-code/frontend-component-quality 技能的 references（如 `references/typography-css-map.md`）。
   - **可变字体/OpenType 细节（B 组 11 条）+ 装饰文本（E10/E11）+ RTL/bidi 细则（D9/D10）**：按需查阅的执行知识，进同一 references。
   - **review 输出格式（G 组）**：归 review 类技能。
   - **review 方法论"读页面不扫代码"（H2）**：是审查技能的操作规程，归 review 技能。

3. **是否需要独立成技能**：不需要。无运行时机制；所有价值被"Design.md 模板章节（数值处方）+ build-code references（速查表/OpenType/装饰/RTL）+ review 技能（输出格式+方法论）"三方完全吸收。与 better-colors 相同的分流结构，且排版的内容分层比色彩更干净——规范层（有数值的原则）和执行层（属性细节/映射表）的缝非常清晰。

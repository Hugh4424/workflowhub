# P0 深度精读笔记：better-layout

来源：`/Users/Hugh/Hugh/Project/Website-skills/better-layout/`
读取范围：SKILL.md（80 行）+ 全部 3 个 references 文件（grouping-and-alignment.md / spacing-and-adaptivity.md / review-output.md），逐字读完。

## ① 核心机制（一句话）

布局在任何文字被读到之前就传达结构：位置/间距/对齐自身承载层级（负空间 > 背景形状 > 分隔线），且好布局必须经受压力——缩放、翻译变长、RTL 镜像后仍保持完整。

## ② 完整可执行规则表

### A. 分组与对齐（grouping-and-alignment.md）

| # | 规则 | 具体数值/处方 |
|---|------|--------------|
| A1 | 分组三工具，按优先级排序 | 1) 负空间（默认：相关的靠近、无关的远离）；2) 背景形状（卡片/填充容器，当组需读作一个单元时：可选中行、可拖拽卡片）；3) 分隔线（最后手段，仅空间代价太高的密集数据：表格、长设置列表） |
| A2 | 结构规则：组间间距 ≥ 组内间距的 **2×** | 组内 `8px` → 组间 `16px`+，否则眼睛无法分辨组的边界。好例：`.field-group { gap: 8px }` + `.form { gap: 24px }`；坏例：均匀 12px margin + border-bottom 补偿 |
| A3 | 真正需要分隔线时保持安静 | 发丝宽度、低对比、**永不与大间距并用**（间距已经干了活） |
| A4 | 控件必须与内容可区分 | 交互元素需要交互信号：背景/边框/下划线/一致的控制区（工具栏、底部行）；样式与相邻静态文字完全相同的控件 = 不可见 |
| A5 | 反向同样成立 | 不给静态元素控件样式——形状与旁边按钮完全一样的不可点徽章收集死点击 |
| A6 | 对齐到共享边缘 | 选一小组对齐边缘并把一切放上去；每个游离边缘（图标偏 2px、卡片 padding 与邻居不同）即使叫不出问题也读作噪点 |
| A7 | 用一个一致的项目间距步进表达层级 | 无体系时 `16px` 是有用默认，更深层级重复同一步进。坏例：同列三个无关 leading 边缘（20px/14px/24px） |
| A8 | 表格数字右对齐到 trailing 边缘；文本左对齐到 leading 边缘 | 表格数字见 better-typography 的 tabular figures |
| A9 | 逻辑属性替代表（方向相关水平位置用 leading/trailing 表达，`dir="rtl"` 下自动镜像） | `margin-left`→`margin-inline-start`；`padding-right`→`padding-inline-end`；`left: 0`→`inset-inline-start: 0`；`text-align: left`→`text-align: start`；`border-right`→`border-inline-end`。Tailwind：`ms-4 pe-6 text-start` 而非 `ml-4 pr-6 text-left` |
| A10 | 物理属性保留给真正指物理屏幕侧的东西 | 相对设备刘海定位、必须匹配物理手势方向的元素 |
| A11 | 元素排列编码进程时，序列在 RTL 中镜像 | 星级评分从 trailing 侧填充、步骤指示器、进度条；Flexbox/grid + 逻辑属性自动镜像，手工定位的不镜像。数字内部数位顺序永不反转（bidi 文本规则归 better-typography） |
| A12 | 按重要性排序：读者从上到下、leading 到 trailing 扫读 | 最重要信息靠近顶部和 leading 边缘；越靠下越靠 trailing 越少被注意 |
| A13 | 给关键信息留空间 | 不把用户为之前来的那个数字埋在次要细节行下；次要内容推进折叠区/标签页/详情视图 |
| A14 | 行内顺序：标识性内容（名称、标题）在 leading，元数据和操作在 trailing | 好例：余额大字在前、标签小字在后；坏例：账户号/开户日期/账单日后才见余额 |
| A15 | 用 leading/trailing 思考而非 left/right | 配逻辑属性，同一层级在 RTL locale 正确镜像 |
| A16 | 不过载入口：首屏是目录不是全书 | 一切显眼 = 无物显眼；每视图一个主操作（颜色执行见 better-colors）；次要操作超过两三个收进菜单；短视图链接深入 > 长视图一层展示一切 |

### B. 间距与自适应（spacing-and-adaptivity.md）

| # | 规则 | 具体数值/处方 |
|---|------|--------------|
| B1 | 控件间呼吸空间起点表（项目无既有密度体系时） | 相邻有边框/填充控件（按钮、输入框）之间 `12px`；无边框控件（文字按钮、图标按钮）周围 `24px` 净空；无关控件组之间 `24px`+（组内间距的 2×） |
| B2 | 无边框控件需要更多净空的原因 | 无物标记目标边界，空间本身就是边界 |
| B3 | 紧凑专业工具可用更少 | 前提：hit area 保持可区分且不重叠；**保留既有可用密度，不专为匹配这些值而扩大控件** |
| B4 | 净空是 WCAG 目标尺寸之外的额外要求 | WCAG target-size、更大可用性目标、伪元素扩展归 better-accessibility；这些净空在其之上，使扩展 hit area 永不重叠 |
| B5 | 按钮从边缘内缩 | 内容布局中贴视口的按钮会看似系统 chrome，并与圆角/手势区裁剪冲突；保持在布局边距内。好例：`padding-inline: 16px; padding-bottom: calc(16px + env(safe-area-inset-bottom))` + 按钮 `width: 100%; border-radius: 12px`；坏例：`width: 100vw; border-radius: 0; position: fixed; bottom: 0` |
| B6 | edge-to-edge 动作有效的条件 | 刻意作为应用/平台 chrome 且计入安全区 |
| B7 | 无布局 token 时移动端从 ~`16px` inline 边距起步 | 按钮仍可在边距内横跨内容全宽 |
| B8 | 渐进披露必须有可见 affordance | 隐藏复杂度好，无提示隐藏是陷阱；每块屏外/折叠内容需要可见存在提示；保留产品既有滚动指示/披露模式 |
| B9 | 三种无既有线索时的处方 | 1) 窥视项：横向滚动器/轮播中下一项探出容器边缘 `16–32px`——恰好止于边缘的卡片行看起来完整、没人滚它；2) 披露控件：折叠区给 chevron 或 "Show more"，标签说明藏了什么（"Show 12 more results"），不只 "More"；3) 截断线索：clamped 文本显示省略号和展开方式（机制归 better-typography） |
| B10 | 窥视滚动器配方 | 容器 padding 制造窥视，snap 点留在内容边缘：`.scroller { display:flex; gap:12px; overflow-x:auto; padding-inline:24px; scroll-padding-inline:24px; scroll-snap-type:x mandatory }`；子项 `flex: 0 0 calc(100% - 48px - 24px)`（容器 − 边距 − 窥视量）+ `scroll-snap-align: start`。Tailwind 版：`w-[80%] shrink-0 snap-start` 保持下一卡片 leading 16–32px 可见 |
| B11 | 内容出血、控件悬浮：两层在边缘行为不同 | 内容层：背景/hero 媒体/可滚列表延伸到视口边缘；控制层：文字和控件留在布局边距和安全区内，浮于内容之上 |
| B12 | 约束文章内全出血媒体的 grid 配方 | `.article { display:grid; grid-template-columns: 1fr min(65ch, calc(100% - 48px)) 1fr }`；`.article > * { grid-column: 2 }`；`.article > .full-bleed { grid-column: 1 / -1 }`（65ch 呼应排版行长上限） |
| B13 | sticky 头和 FAB 计入安全区 | `.fab { position:fixed; inset-inline-end: calc(16px + env(safe-area-inset-right)); bottom: calc(16px + env(safe-area-inset-bottom)) }` |
| B14 | 断点属于内容不属于设备目录 | 在布局真正停止适配处断（侧栏把内容挤到最小行长以下、卡片网格跌破可用列宽），不因预设断 `768px` |
| B15 | 晚折叠 | 保持展开结构直到真装不下——保持稳定性与熟悉感；过早折叠扔掉用户付费买的空间 |
| B16 | 组件级适配优先 container queries | 卡片应适配它所在的列而非视口：`.card-list { container-type: inline-size } @container (max-width: 400px) { .card { grid-template-columns: 1fr } }`；坏例：`@media (max-width: 768px)` 让窄侧栏里的卡片断裂 |
| B17 | 测试顺序 | 最小支持尺寸和最大尺寸先测（它们先坏），再测中间尺寸 |
| B18 | 字符串膨胀随语言和源串长度大幅变化，不依赖通用百分比 | 四条规则：1) 不按英文标签定固定宽度——`max-width` + 折行；2) 文本容器不定固定高度——需要地板用 `min-height`；3) 按钮由标签自定尺寸（`padding-inline`），永不硬编码宽度（坏例：`width: 96px` 德文溢出/截断；好例：`padding-inline: 16px; white-space: nowrap`）；4) 发布前用伪本地化或长字符串 locale 测试 |
| B19 | 裁剪：永不把关键操作停在可被切断处 | 可调面板底边、固定高度 modal 的折叠线下、弹起键盘背后；主操作放稳定 chrome：带安全区 padding 的 sticky footer 或视图顶部；modal 内容滚动时其操作行不滚 |

### C. SKILL.md 独有内容

| # | 规则 |
|---|------|
| C1 | 数值定位声明：以下数值是"无既有密度/间距体系的界面"的起点；**保留刻意的平台 chrome、紧凑专业工具和项目 token**——只要它们在 hit-area、缩放、本地化、视口压力测试下仍可用（SKILL.md L13，重要的防过度套用条款） |
| C2 | 职责边界：hit-area 尺寸和焦点行为归 better-accessibility；视觉打磨（圆角/阴影/动画）归 better-ui；行长和文本间距归 better-typography |
| C3 | 修复用项目自己惯用法：已在用的样式体系，永不旁边立第二套 |
| C4 | 常见错误表 8 条：该用间距处用分隔线→删线、组间间距翻倍；`margin-left`/`padding-right`→逻辑属性；内容布局按钮意外触视口→内缩进项目边距、保留刻意平台 chrome；看起来完整的轮播→下一项探出 16–32px；相邻控件合并/扩展 hit area 重叠→按项目 scale 加距、12px/24px 起步；因默认断 768/1024→在内容真正停止适配处断；按一种语言定固定宽文本容器→`max-width`+折行+伪本地化测试；主操作停在易裁剪面板底部→sticky 定位或带安全区 padding 的稳定 chrome |

### D. Review 输出格式（review-output.md）

| # | 规则 |
|---|------|
| D1 | 独立布局 review 两段式；better-interface 编排时格式/严重度/合并/上限/verdict 归它 |
| D2 | findings 按原则分组，五列表 Severity/Location/Before/After/Why；禁止独立 "Before:"/"After:" 行 |
| D3 | Severity：`HIGH` = 在支持的视口阻断内容或操作；`MEDIUM` = 伤害层级/阅读顺序/适应性；`LOW` = 孤立对齐或间距打磨 |
| D4 | Location 引 `path/to/file:line`；无源文件引确切屏幕和组件 |
| D5 | Before/After 给当前布局和可执行替换 |
| D6 | Why 命名被违反的原则及其对理解/适应性的影响 |
| D7 | 系统性重复问题合并一行列所有位置；无 findings 的原则省略 |
| D8 | Verification 列确切检查及结果：覆盖相关视口宽度、阅读顺序、缩放、RTL 状态；未跑的说明待验证项；Verdict：残留 `HIGH` → `Block`，仅 `MEDIUM`/`LOW` → `Needs changes`，无 → `Approve` |
| D9 | 无 findings 时省表格，声明 "No actionable layout findings"，报告 verification，`Approve` 收尾 |

**规则条数合计：约 46 条**（A16+B19+C4+D9，B 组内含 4 条子规则的 B18 按 1 条计；逐子条计则约 50）。

## ③ 对工程质量四维度的支撑点

### 统一性（token 体系）
- **间距步进统一（A7）**："用一个一致的项目间距步进表达层级，16px 默认，更深层级重复同一步进"——布局维度的 token 纪律，与颜色/字体的 semantic token 同构。
- **2× 分组规则（A2）**：组间 ≥ 2× 组内，给间距 token 提供了**比例约束**（不只是孤立的阶梯值）——这是比"8/16/24 阶梯"更深一层的统一性规则。
- **呼吸空间起点表（B1）**：12px/24px/24px+ 三个值构成控件间距的默认 token 组。
- **共享边缘纪律（A6）**：对齐边缘集合 = 布局的"调色板"，游离边缘 = 未登记的颜色。
- **C1 的保留条款是统一性维度的元规则**：项目既有 token 优先于技能默认值——token 体系的权威在项目，不在技能。

### 组件化
- **container queries 优先（B16）**是最强组件化规则：组件适配所在容器而非视口，组件才真正可搬运。
- **"内容出血、控件悬浮"两层模型（B11–B13）**给组件划了层归属：背景/媒体属内容层，文字/控件属控制层。
- 控件与内容的视觉区分双向规则（A4/A5）是组件 API 的可检查约束。
- 窥视滚动器配方（B10）是完整的可复制组件模式（含 scroll-snap 细节）。

### 可维护性
- **逻辑属性替代表（A9）**：RTL 自动镜像消灭一整类方向性 bug 的维护成本；手工定位元素不镜像的警告（A11）。
- **断点来自内容（B14/B15）**：消灭"768/1024 魔法数字"这类无依据常量。
- **字符串增长四规则（B18）**：无固定宽/高、按钮由标签定尺寸——从代码结构上消除 i18n 回归。
- 测试顺序处方（B17：最小+最大先测）是可写进测试规程的操作规则。

### 性能
- 三者中最弱，但非零：分隔线是"最后手段"（A1）减少无意义渲染节点；负空间优先于背景形状意味着更少的绘制层；晚折叠（B15）避免过早的响应式重排复杂度。
- 安全区/sticky 处方（B5/B13/B19）防止运行时裁剪 bug 而非性能本身。

## ④ 与 workflowhub 的精确集成点

1. **Design.md「布局/响应式」章节**（ui-project-init 明确该章节归 Design.md）：
   - 间距 token 起点表（B1：12px/24px/24px+）+ 2× 分组比例约束（A2）+ 对齐步进默认 16px（A7）——构成间距 token 章节的数值骨架；
   - 分组三工具优先级（A1）、共享边缘纪律（A6）、重要性排序（A12–A15）、入口不过载（A16）——作为布局原则陈述；
   - 断点来自内容 + container queries 优先 + 晚折叠（B14–B16）+ 测试顺序（B17）——响应式章节；
   - 布局边距起点（B7：移动端 inline 16px）、内容出血/控件悬浮两层模型（B11）、安全区规则（B5/B13/B19）。
2. **Design.md「治理规则」章节**：逻辑属性强制（A9 替代表 + A10 例外条款）——这是可 lint 化的治理规则；字符串增长四规则（B18）。
3. **Design.md「组件 API」章节**：控件/内容视觉区分双向规则（A4/A5）作为组件验收标准。
4. **Experience.md**：渐进披露 affordance 三处方（B9）、关键操作不放易裁剪处（B19）涉及页面/交互行为，可在 Experience.md 的交互约定中引用（数值细节仍指回 Design.md）。
5. **references 分流**：窥视滚动器完整 CSS 配方（B10）、full-bleed grid 配方（B12）、FAB 安全区配方（B13）是代码模式，进 build-code/frontend 技能 references；review 输出格式（D 组）归 review 类技能。
6. **C1 保留条款**应写进 ui-project-init 的 legacy 模式说明：历史项目盘点时"既有可用密度/token 优先，不专为匹配默认值扩张控件"与 legacy 的"不自动全仓组件化/reset"边界完全同调。

## ⑤ 移植风险

1. **数值的"起点"性质**：技能自己声明（C1）所有数值仅是无体系项目的起点。若并入 Design.md 模板时丢掉这个限定，会把 12px/16px/24px 变成僵硬的普世标准，与宪法"项目 token 权威"冲突。模板必须带"无既有体系时的默认值"标签。
2. **移动端中心**：16px 边距、安全区、FAB、iOS 手势区大量针对移动 web；workflowhub 若主要产出桌面端管理界面，部分规则（B5/B13）适用性下降——模板需标注适用端。
3. **三重外指**：better-accessibility（hit area/焦点）、better-ui（圆角/阴影/动画）、better-typography（行长/tabular figures/截断机制）——同样存在归属悬空风险；且"每视图一个主操作"同时出现在 better-colors（D4）和本技能（A16），两处措辞一致需保持同步，并入时要去重为单一事实源。
4. **container queries 浏览器基线**：B16 的 `@container` 需要较新基线（2023+）；老浏览器矩阵项目需标注。
5. **逻辑属性 lint 化缺口**：A9 是天然可 lint 规则，但技能未提供 lint 配置——移植时若想把"禁止物理属性"做成 CI 检查需自补（stylelint `csstools/use-logical` 之类）。
6. **数值密度三者最低**：better-layout 的数值只有 2×/12/16/24/16–32px/65ch 少数几个；大量规则是结构原则而非数值处方。并入 Design.md 时"布局"章节的数值骨架需与项目既有间距体系（如 Tailwind 默认 4px 基）对齐，不能只抄技能默认值。

## ⑥ 验证或推翻之前结论

**之前结论**：better-layout 是"原则提炼进 Design.md 模板"②类，并入 ui-project-init。

**结论：验证，且 C1 保留条款提示②类并入时必须保留"默认值 vs 项目权威"的分层**：

1. **验证的部分**：间距起点表、2× 分组规则、对齐步进、断点哲学、逻辑属性表、安全区规则——全部是 Design.md「布局/响应式」章节的天然内容。与 better-colors/better-typography 同属②类判断正确。

2. **三者对比下的特殊性**：better-layout 是三者中**数值处方最少、结构原则最多**的一个，且自带最明确的"默认值限定"（C1）。这意味着它的并入方式应该是"**原则进模板正文 + 数值明确标注为无体系时的默认值**"，而不是把 12px/24px 写成硬性 token。这一点之前的"原则提炼进 Design.md 模板"结论没有细分，需要修正补充。

3. **应分流的内容**：
   - **三个 CSS 配方**（窥视滚动器 B10、full-bleed grid B12、FAB 安全区 B13）：完整代码模式，进 build-code/frontend 技能 references，不进 Design.md 正文。
   - **review 输出格式（D 组）**：归 review 类技能——三个技能的 review-output.md 结构完全一致（同一五列表、同一 Severity/Verdict 词汇表），**应合并为一份共享的 review 输出契约**而非三份拷贝，归 wh-review/frontend-component-quality。
   - **逻辑属性替代表（A9）**：可同时进 Design.md 治理规则（作为禁令声明）和 build-code references（作为完整替代表）。

4. **是否需要独立成技能**：不需要。better-layout 无运行时机制、无脚本；原则+默认值进 Design.md 模板、配方进 references、review 格式合并进共享契约即可完全吸收。唯一潜在独立物是"物理属性 lint 规则"——但那是一个 lint 配置条目，不是技能。

5. **跨技能发现的元结论**：三个 P0 技能的 review-output.md 是同一份模板的三个实例（Severity/Location/Before/After/Why + Verification + Verdict 完全同构，仅 Severity 定义和"No actionable X findings"措辞随领域变化）。并入 workflowhub 时应提取为**单一 review 输出契约 + 各领域 Severity 定义补丁**，而不是复制三份——这本身就是 better-layout 的"分组与对齐"原则在知识工程上的应用。

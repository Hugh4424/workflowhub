# P0 深读笔记：animate

- 来源镜像：`/Users/Hugh/Hugh/Project/Website-skills/animate/`（`SKILL.md` 200 行 + `RECIPES.md` 324 行，全部精读）
- 许可证：MIT（frontmatter 声明）
- 定位：从零构建动画的"施工"技能，标准是 Emil Kowalski 动效哲学（与 `review-animations` 同一把尺）

## ① 核心机制（一句话）

按固定顺序做七个决策（该不该动→目的→工具→属性→缓动/时长或弹簧→打断与退出→reduced-motion/hover 门控），前两步是闸门、可以合法地产出零行代码，所有曲线/时长/弹簧参数必须取自内置数值表，禁止凭感觉发明。

## ② 完整可执行规则表

### Hard Rules（5 条铁律）

| # | 规则 | 要义 |
|---|------|------|
| H1 | 按顺序跑决策链 | 步骤 1、2 闸门一切；没定"动不动"之前不许挑曲线 |
| H2 | 禁止近似值 | 每条曲线/时长/弹簧配置必须来自技能内置表；禁止因为眼熟而写 `cubic-bezier(0.4, 0, 0.2, 1)` |
| H3 | 扩展既有 token，不建平行体系 | 代码库已有 `--ease-out` 或时长刻度就直接用；另起一套是缺陷 |
| H4 | reduced-motion 与 hover 门控随动画一起交付 | 不是后续补丁 |
| H5 | 够用即可的最便宜工具 | 一个 fade 不许装动效库 |

### 步骤 1：该不该动（频率闸门，4 档）

| 频率 | 决策 |
|------|------|
| 100+ 次/天（键盘快捷键、命令面板开关） | **永不动画**，到此为止 |
| 每天几十次（hover、列表导航） | 只许近乎不可察觉：快而微妙，或者不动 |
| 偶尔（modal、drawer、toast） | 标准动画 |
| 罕见/首次（onboarding、成功、庆祝） | delight 预算只花在这里 |

- 补充：**键盘触发的动作是一票否决**，不是酌情判断（Raycast 无开关动画是正确的）。
- 闸门不通过就明说，给非动画替代（瞬时状态切换、静态 affordance）。

### 步骤 2：目的命名（6 选 1，命不出名就不建）

1. **Feedback** — 确认界面听到了用户
2. **Spatial consistency** — 展示东西从哪来、到哪去
3. **State indication** — 让状态变化可读
4. **Preventing a jarring change** — 桥接否则会"瞬移"的内容
5. **Explanation** — 演示工作原理（仅营销/onboarding）
6. **Delight** — 只允许罕见/首次档

- 功能校验：用户正在读/操作的数据不应为样式而动（银行 App 的图表不配鼠标跟踪装饰）。

### 步骤 3：工具阶梯（从上到下，第一个够用就停）

| 需求 | 工具 |
|------|------|
| hover、press、颜色、class/属性控制的状态切换 | **CSS transition** |
| 挂载时进入动画、无 JS 状态 | **CSS `@starting-style`** |
| 页面繁忙加载时也须保持顺滑的预定动作 | **CSS animation**（跑在主线程外） |
| 要编程控制但要 CSS 级性能、不要库 | **WAAPI**（`element.animate()`） |
| 弹簧、布局动画、退出动画、手势驱动值 | **Motion**（motion.dev） |

- CSS 动画在负载下优于 JS：rAF 动画在浏览器加载/脚本/绘制时掉帧，CSS 不掉。
- 如果需求其实是"组件"（toast/drawer/命令菜单/下拉），停下并转 `pick-ui-library`——手搓会得到无焦点管理的 `<div>` 下拉。

### 步骤 4：属性选择（6 条）

| # | 规则 |
|---|------|
| P1 | 只动 `transform` 和 `opacity`（跳过 layout/paint、走 GPU）；`width/height/margin/padding/top/left` 三者全触发 |
| P2 | `clip-path` 是特许的第四属性（见 RECIPES）；`height` 仅在 accordion 容忍（无 transform 等价物） |
| P3 | **禁止 `scale(0)`**：从 `scale(0.9–0.97)` + `opacity: 0` 开始，现实中没有东西从虚无中出现 |
| P4 | 触发锚定的 popover/dropdown/menu/tooltip，`transform-origin` 设在触发点（Base UI 的 `var(--transform-origin)`）；**modal 豁免**（不锚定触发器，保持居中） |
| P5 | `translate()` 用百分比（相对元素自身尺寸），优于硬编码像素 |
| P6 | Motion 中用完整 transform 字符串：`animate={{ transform: "translateX(100px)" }}` 硬件加速；`x`/`y`/`scale` 简写不加速、负载下掉帧 |
| P7 | 禁止用父元素上的 CSS 变量驱动子元素 transform（会对每个子元素重算样式）；直接设在元素上 |

### 步骤 5：缓动与时长（或弹簧）

**缓动决策表（按序）：**

| 情形 | 缓动 |
|------|------|
| 进入或退出 | `ease-out` |
| 屏幕上移动/形变 | `ease-in-out` |
| hover/颜色变化 | `ease` |
| 恒定运动（marquee、进度） | `linear` |
| 默认 | `ease-out` |

- **UI 上禁止 `ease-in`**：起步慢，恰好拖慢用户盯着看的时刻；200ms ease-out 比 200ms ease-in *感觉*更快。
- 内置 CSS 缓动太弱，用这三条自定义曲线：
  - `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)`（UI 强 ease-out）
  - `--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1)`（屏上移动强 ease-in-out）
  - `--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1)`（iOS 式 drawer 曲线，Ionic）
- 需要表外曲线就去 easing.dev / easings.co 取，不要手搓。

**时长表：**

| 元素 | 时长 |
|------|------|
| 按钮按压反馈 | 100–160ms |
| tooltip、小 popover | 125–200ms |
| dropdown、select | 150–250ms |
| modal、drawer | 200–500ms |
| 营销/讲解 | 可以更长 |

- **UI 动画保持在 300ms 以下**；180ms 的 dropdown 比 400ms 感觉更灵敏。

**何时改用弹簧**（拖拽带惯性、要有"活"感、用户可打断/反转的手势、装饰性鼠标跟踪）：

- `{ type: "spring", duration: 0.5, bounce: 0.2 }`（Apple 式，好推理）
- `{ type: "spring", mass: 1, stiffness: 100, damping: 10 }`（传统物理，控制更细）
- bounce 保持 0.1–0.3；多数 UI 避免 bounce，留给 drag-to-dismiss 和 playful 交互。

### 步骤 6：打断与退出（4 条）

| # | 规则 |
|---|------|
| I1 | 高频触发的元素（toast、toggle、一秒内可能触发两次的任何东西）用 **transition 不用 keyframes**：transition 从当前值重定向，keyframes 从零重启 |
| I2 | 手势用弹簧：打断时速度被带入下一段动画 |
| I3 | **怎么进来就怎么出去**：从底部滑入的 toast 从底部离开；对称路径让 swipe-to-dismiss 不言自明 |
| I4 | 用户在做决定的环节用**非对称时长**：蓄力阶段慢（hold-to-confirm 按住 2s linear），系统响应快（松手 200ms ease-out） |

### 步骤 7：reduced-motion 与指针门控（每次必随附）

- `@media (prefers-reduced-motion: reduce)`：保留 opacity/color，去掉 transform 位移——**更少更柔，不是零**
- `@media (hover: hover) and (pointer: fine)`：触屏 tap 会误触发 hover，hover 动效必须门控
- Motion 侧：`useReducedMotion()`，如 `const closedX = reduce ? 0 : '-100%'`

### Never Ship 自检表（13 条，`review-animations` 的自动阻塞项）

| 禁止 | 改为 |
|------|------|
| `transition: all` | 点名具体属性 |
| `scale(0)` 入场 | `scale(0.95)` + `opacity: 0` |
| UI 元素用 `ease-in` | `ease-out` 或强自定义曲线 |
| 刻意动画用内置 `ease-out` | `cubic-bezier(0.23, 1, 0.32, 1)` |
| 键盘快捷键/100+次/天动作加动画 | 不动画 |
| UI 时长超 300ms 且无理由 | 150–250ms |
| 触发锚定 popover 用 `transform-origin: center` | `var(--transform-origin)`（modal 豁免） |
| toast/toggle/高频元素用 keyframes | CSS transition |
| 动 `width/height/margin/padding/top/left` | `transform`/`opacity` |
| Motion `x/y/scale` 属性（负载下） | 完整 `transform` 字符串 |
| 未门控的 `:hover` 动效 | `@media (hover: hover) and (pointer: fine)` |
| 缺 `prefers-reduced-motion` | 更柔变体，不是零 |
| 所有元素同时入场 | 30–80ms stagger |

### RECIPES.md 配方清单（14 个，全部精读）

| # | 配方 | 关键参数/要点 |
|---|------|--------------|
| R1 | Button press | `:active { transform: scale(0.97) }`，160ms var(--ease-out)；scale 带动子元素才像物理按压；`:active` 在触屏是真按压，无需 hover 门控 |
| R2 | Dropdown/popover/menu/select | `transform-origin: var(--transform-origin)`；opacity+transform 各 200ms ease-out；starting/ending 态 `opacity:0; scale(0.95)`；原点即触发器是全部意义 |
| R3 | Tooltip | 同 popover 但 125ms、scale(0.97)；`[data-instant]` 时 0ms——已开一个 tooltip 后邻居瞬时开，工具栏整体感觉更快 |
| R4 | Modal | 唯一保持居中的 popover（origin: center，豁免）；250ms；backdrop 同步 250ms opacity，读作一个表面 |
| R5 | Drawer/sheet | `translateY(0)`↔`translateY(100%)`，500ms var(--ease-drawer)；Vaul 同款预隐藏手法；加拖拽即转手势问题（见 R12） |
| R6 | Toast | opacity+transform 400ms `ease`（非 ease-out，比典型 UI 慢——Sonner 的优雅来自按组件个性调参）；`@starting-style` 不可用则退回 mount flag；堆叠 reflow 时 opacity 与 height 变化无公式，调到对为止、隔天再看 |
| R7 | Accordion/collapse | `overflow:hidden` + height 200ms ease-out + opacity 200ms；少数每帧付 layout 成本的动画，务必短；JS 量内容高度（或用 headless primitive），不要动画到 `auto` |
| R8 | Stagger 组入场 | item 初始 `opacity:0; translateY(8px)`，fadeIn 300ms ease-out forwards，nth-child 延迟 50ms 递增；只给偶尔看到的列表；stagger 是装饰，**播放期间不得阻塞交互** |
| R9 | Hold to confirm | 破坏性操作防误触；overlay 用 `clip-path: inset()` 填充：按住 2s **linear**（进度不该有缓动）、松手 200ms ease-out；按钮本体 scale(0.97) |
| R10 | Tab 指示器（带颜色过渡） | 不给单个 tab 调颜色过渡时间——复制一份 tab 列表、样式为激活态、用 `clip-path: inset()` 裁出当前 tab 并随切换动画 250ms ease-in-out；文字和背景同步变化因为是同一元素被揭示 |
| R11 | Scroll reveal | **仅营销面**；`clip-path: inset(0 0 100% 0)`→`inset(0)`，600ms ease-in-out；IntersectionObserver 或 Motion `useInView({once:true, margin:"-100px"})`；只触发一次，每次划过都重放是界面与读者搏斗 |
| R12 | Drag to dismiss | 手势配方：弹簧非时长（用户可中途反转）；**flick 即关**（位移≥阈值或速度>0.11 px/ms）；transform 直接设在被拖元素上；四个细节：pointer capture、多指保护（`if(isDragging) return`）、越界阻尼（拖得越远动得越少）、摩擦而非硬墙；落停弹簧 `{duration:0.5, bounce:0.2}` |
| R13 | 调和不了的 crossfade 加模糊缝 | 两态交叠怎么调参都不对时：过渡中 `filter: blur(2px); opacity:0.7`（200ms ease）；模糊把两个对象熔成一次感知变换；blur <20px（Safari 上重 blur 昂贵） |
| R14 | 无库编程动画（WAAPI） | `element.animate([{clipPath:'inset(0 0 100% 0)'},{clipPath:'inset(0)'}], {duration:1000, fill:'forwards', easing:'cubic-bezier(0.77,0,0.175,1)'})`；硬件加速、可打断、零 bundle 成本 |

### 输出规约（3 条）

- 交付物是代码；附最多几行：闸门结果（频率档+目的名，拒绝过什么要明说）、配料清单（工具/属性/曲线/时长或弹簧各一行）、需要 feel-check 的点（2–5× 慢放、DevTools animation inspector 逐帧、真机手势、隔天再看）
- 不把输出垫成报告；诚实的"这不该动"就是答案本身

**规则统计：5 铁律 + 7 步决策链（4 频率档 + 6 目的 + 5 工具 + 7 属性规则 + 5 缓动情形/3 自定义曲线 + 5 时长档 + 2 弹簧配置 + 4 打断退出 + 2 门控）+ 13 Never-Ship + 14 配方 + 3 输出规约。**

## ③ 对"工程质量四维度"的支撑点

- **组件化**：强。步骤 3 末尾明确"需要组件而非动画时转 pick-ui-library"，防止手搓无焦点管理的下拉；配方全部围绕标准组件（popover/toast/drawer/accordion/tab）给出，可直接挂到组件库原语（Base UI 的 `--transform-origin`、Vaul、Sonner 均被点名）。`transform-origin` 锚定触发器一条直接提升组件的组装正确性。
- **统一性**：极强。H2/H3 两条铁律（禁止近似值、扩展既有 token 不建平行体系）就是统一性的定义；三条命名曲线 + 时长表构成项目级 motion token 刻度，可直接进 Design.md/主题 token；Never-Ship 表给 review 提供统一判据。
- **可维护性**：强。决策链留下推理痕迹（输出规约要求写明闸门结果与配料），后人能复现"为什么是这个值"；配方即文档，避免每处动画重新发明；reduced-motion/hover 门控随代码交付，不留尾巴。
- **性能**：**此技能对性能维度贡献直接且具体**——只动 transform/opacity（GPU 合成，跳过 layout/paint）；Motion 完整 transform 字符串 vs x/y 简写（负载下掉帧与否）；CSS 动画跑主线程外 vs rAF 掉帧；accordion 每帧 layout 成本要短时长；blur <20px（Safari 成本）；父级 CSS 变量驱动子 transform 的全子树样式重算禁令；高频元素免动画/极短动画本身就是交互性能预算（100+/天 → 零动画）。与 vercel-react-best-practices 的 `rendering-animate-svg-wrapper`、`js-batch-dom-css` 等规则互补。

## ④ 与 workflowhub 的精确集成点

1. **frontend-prototype-render（主集成点，代码生成环节）**：稿/需求含动效时，原型渲染的动画实现必须走此决策链；配方作为生成起点而非空白文件。落地形式：作为该技能的 reference 文档，或将其 Never-Ship 表编译为生成后自检清单。
2. **design-source-readiness（设计稿就绪检查环节）**：稿无动效标注 → 后续环节**不得擅自加动画**（频率闸门 H1 的逆向应用，保护复现）；稿有动效 → 检查稿是否给出了足够参数（曲线/时长），缺则标记缺口而非让实现方编造（对应 H2）。
3. **frontend-component-quality（组件质量地图-motion 维度）**：13 条 Never-Ship 即现成的 motion 质量判据子集；频率闸门表可作为"动画存在性"审查标准。注意按既有研究结论声明"规则源非证据源"。
4. **ui-visual-fidelity / ui-parity-checklist（视觉对齐清单-motion 小节）**：reduced-motion 变体存在性、hover 门控、transform-origin 锚定、对称进出，都可做成逐项核对项。
5. **isolated-browser-qa（动效验收环节）**：feel-check 规程（2–5× 慢放、DevTools animation inspector 逐帧、真机手势、隔天复看）是现成的 QA 步骤，可纳入浏览器 QA 的动效用例。
6. **verify-change（变更验证）**：改动涉及动画时触发 Never-Ship 自检 + feel-check 提示。
7. **ui-project-init（项目初始化）**：三条 ease 曲线 + 时长刻度可作为 motion token 模板注入新项目的 CSS 变量层。

## ⑤ 移植风险

- **许可证**：MIT，可直接复制；需保留 license 声明与作者归属（Emil Kowalski 哲学体系，镜像仓未附单独 LICENSE 文件，只有 frontmatter 声明——移植时应补 NOTICE）。
- **依赖**：技能本身零代码依赖（纯 markdown）；运行时依赖按需——Motion（motion.dev）只在弹簧/手势/退出动画时需要，WAAPI/CSS 路径零依赖。Base UI 的 `var(--transform-origin)` 是外部约定，非 Base UI 项目需自建等价 token。`useReducedMotion()` 是 Motion 的 hook，非 Motion 栈需替代实现。
- **姊妹技能耦合（最大移植风险）**：SKILL.md 引用 `review-animations`、`improve-animations`、`find-animation-opportunities`、`pick-ui-library` 四个姊妹技能；独立复制时必须裁剪或改写这些交叉引用（既有研究结论已标注"裁 pick-ui-library 引用"）。Never-Ship 表自称"`review-animations` 的自动阻塞项"——若不一并引入 review-animations，该表述需改为自检清单。
- **上游漂移**：本镜像仓（github.com/vaferkhanom/Website-skills）是非官方快照；animate 上游疑似 emilkowalski 相关技能仓。必须固定上游 commit 登记（既有研究已要求"登记上游固定 commit"），禁止从 main 自动更新；曲线/时长表是意见性数值，上游改版不一定适合跟。
- **主观性风险**：部分规则是强意见（如 Sonner 用 400ms ease），作为 lint 式硬规则会有误报；定位为"生成指导 + 审查参考"，不做 gate（符合 workflowhub 宪法"质量不阻断推进"）。

## ⑥ 验证或推翻之前结论

**之前结论：animate = 独立复制（低-中难度，裁 pick-ui-library 引用）。**

**深读后判定：验证成立，且比预期更乐观。**

- 自含性确认：全部可执行内容就在 SKILL.md + RECIPES.md 两个文件，无脚本、无示例项目、无隐藏资源——"独立复制"成本就是两个文件 + 裁剪 4 处姊妹引用。
- 既有研究描述的机制（频率闸门、工具阶梯、transform/opacity、禁 scale(0)、UI<300ms、reduced-motion 门控、扩展 token 不建平行体系）与原文逐条核对**全部准确**。
- 需要修正/补充的细节：
  1. 交叉引用不是 1 处而是 4 处（review-animations、improve-animations、find-animation-opportunities、pick-ui-library），裁剪清单要列全。
  2. 既有研究未提及 RECIPES.md 的 14 个配方——这是该技能一半的实操价值，移植时**必须连同 RECIPES.md 一起复制**，只搬 SKILL.md 会丢掉 drag-to-dismiss 四细节、tab 指示器 clip-path 技巧、crossfade 模糊缝等独有内容。
  3. "animation-vocabulary 并入 animate"的结论独立验证成立（见 animation-vocabulary 笔记）——并入后 animate 的移植单元应为 3 个文件（SKILL.md + RECIPES.md + 词表附录）。

# P0 深读笔记：better-ui（Website-skills 镜像仓）

- 来源：`/Users/Hugh/Hugh/Project/Website-skills/better-ui/`（license: MIT；作者 Jakub Krehel，README 标注 8.9K installs）
- 体量：SKILL.md 114 行 + 7 个主题文件（surfaces 219 / animations 206 / enter-exit 148 / icon-transitions 103 / icons 110 / performance 88 / review-output 39）+ agents/openai.yaml（harness 适配，无规则内容）
- 精读范围：全部 8 个 md 全文。
- 边界声明：文字排版归 `better-typography`、a11y（触控区/焦点/键盘/ARIA/reduced-motion）归 `better-accessibility`、布局结构归 `better-layout`——本技能只管"视觉细节与微交互"。

## ① 核心机制（一句话）

16 条带精确数值的"设计工程处方"（同心圆角公式、光学对齐、阴影代边框、可中断动画、stagger 时序、图标 cross-fade 参数、scale-on-press 0.96、主题切换禁过渡、will-change 克制等）+ 一个三严重度（HIGH/MEDIUM/LOW）、三态裁决（Block/Needs changes/Approve）的 UI 打磨评审输出格式；评审方法上要求"10% 速度回放动效 + 走遍每个状态"。

## ② 完整可执行规则表（16 条核心处方 + 子规则，全部含数值）

### SKILL.md 层

- B0 评审方法：浏览器 Animations 面板 **10% 速度**回放动效；走遍 hover/focus/active/loading/empty 每态；"10% 速度下感觉不对的，就是全速下微妙出错的地方"。
- B0b 保留项目既有组件库、token、密度；除下列精确交互处方外，匹配项目既有动效语言。

### 16 条核心处方（Quick Reference 编号）

- **B1 同心圆角**：`outerRadius = innerRadius + padding`。例：card `border-radius:20px;padding:8px` + inner `12px`（12+8=20）；Tailwind 例：`rounded-2xl(16) p-2(8)` 套 `rounded-lg(8)`。**padding > 24px 时视为独立表面**，各自独立选半径，不强制同心。
- **B2 光学对齐优于几何对齐**：图标按钮 icon 侧 padding = 文本侧 padding **−2px**（例：`padding-inline-start:16px; padding-inline-end:14px`；Tailwind `ps-4 pe-3.5`）；播放三角 `transform: translateX(2px)` 右移；不对称图标（星/箭头/caret）首选直接改 SVG 的 viewBox/path，fallback 用 `translate-x-px` 级 margin。
- **B3 阴影做高度、边框做结构**：按钮/卡片/容器上只为深度的边框换成多层透明 box-shadow；分隔线/表格边界/表单输入框（a11y）/选中与焦点态保留边框。浅色三层配方：`0px 0px 0px 1px oklch(0 0 0 / 0.06), 0px 1px 2px -1px oklch(0 0 0 / 0.06), 0px 2px 4px 0px oklch(0 0 0 / 0.04)`；hover 把三层透明度提到 **0.08/0.08/0.06**。深色简化为单层白环：`0 0 0 1px oklch(1 0 0 / 0.08)`，hover **0.13**。hover 过渡 `transition-property: box-shadow; 150ms ease-out`。
- **B4 可中断动画**：交互态变化一律用 CSS transitions（可中途反向重定向）；keyframes 只给跑一次的分阶段序列。反例：drawer 用 keyframe 入场，中途关闭会 snap/重启。
- **B5 入场 Split & Stagger**：仅低频分阶段入场（hero 首载/成功态/空态）；拆成语义块，块间 stagger **~100ms**；标题可拆词 stagger **~80ms**；入场组合 `opacity + blur(4px→0) + translateY(12px→0)`；CSS-only 版 `animation: fadeInUp 400ms ease-out forwards` + nth-child delay 0/100/200ms；Motion 版 `staggerChildren: 0.1`。**高频交互（行 hover/击键/tab 切换）禁止 stagger**。
- **B6 克制的退场**：用小固定位移 `translateY(-12px)` 而非全高；退场比入场柔和；进退都用 `ease-out`；**退场时长短于入场（150ms vs 300ms）**；空间上下文重要时才用全退出（如 `x:"-100%"`, 200ms，卡片回列表/drawer 关闭）；动效不增信息、交互高频、或 reduced-motion 时**直接移除不做动画**。
- **B7 上下文图标动画（精确值，不许偏离）**：`scale: 0.25→1`（**禁用 0.5/0.6**）、`opacity: 0→1`、`filter: blur(4px)→blur(0px)`；Motion 库时 `transition: { type:"spring", duration:0.3, bounce:0 }`（**bounce 永远=0**，不得 0.1）；无动效库时双图标同 DOM（一个 absolute 叠放）CSS cross-fade，`cubic-bezier(0.2, 0, 0, 1)` 近似弹簧，300ms；import 路径规则：`motion` 装了就 `motion/react`，`framer-motion` 装了就 `framer-motion`，两者都有跟邻近 import，都没有就别为图标加依赖。何时动画：hover 出现的动作图标/状态切换图标（play→pause、like→liked）/上下文工具栏/loading→success；何时不动画：静态导航图标/装饰图标/常显图标/图标旁文字标签。
- **B8 图片描边**：`outline: 1px solid oklch(0 0 0 / 0.1); outline-offset: -1px`（浅色）/ `oklch(1 0 0 / 0.1)`（深色）；**非协商**：必须纯黑/纯白，禁用 slate-900/zinc-900/#0a0a0a/#111827/#f5f5f7 等近色，禁匹配 accent/ink 色（带色描边会拾取底衬表面色，读作图边缘的脏）；Tailwind `outline-black/10 dark:outline-white/10`；用 outline 不用 border（不影响布局、-1px offset 贴角半径内侧）。
- **B9 按压缩放**：**永远 `scale(0.96)`**；**低于 0.95 即夸张**；用 CSS transition 保持可中断；提供 `static` prop 关闭；配方 `transition-property: scale; 150ms ease-out; :active{scale:0.96}`；Tailwind `active:scale-[0.96]`；Motion `whileTap={{scale:0.96}}`。
- **B10 页面加载跳过动画**：`AnimatePresence initial={false}`（配 `mode="popLayout"`）防首渲染播放入场；适用图标交换/开关/tab/分段控件；**反例**：依赖 initial 做首次入场的组件（stagger hero/loading）不能用——应用前必须整页刷新验证。
- **B11 主题切换压制过渡**：主题翻转同时触发几乎所有元素的 color/background/border/shadow 过渡→拖影；处方：注入 `*,*::before,*::after{transition:none !important}` → 读 `document.body.offsetHeight` 强制同步 reflow → 双层 `requestAnimationFrame` 后移除；OS 级监听 `matchMedia("(prefers-color-scheme: dark)")` change；应用内 toggle 同样包裹；`next-themes` 用其 `disableTransitionOnChange` prop。
- **B12 只过渡变化的属性**：禁 `transition: all` 与 Tailwind `transition-all`；显式 `transition-property: scale, background-color`；Tailwind 裸 `transition` 是策划默认列表（colors/opacity/shadow/transform）仍建议点名；`transition-transform` = `transform, translate, scale, rotate`；多属性用方括号 `transition-[scale,opacity,filter]`。
- **B13 慎用 will-change**：只对 GPU 可合成的 `transform`/`opacity`/`filter`；**禁 `will-change: all`**；`clip-path` 仅新 Chromium 不可靠跨浏览器；`top/left/width/height/background/border/color` 不可合成别用；**只在观察到首帧卡顿才加**（Safari 尤其受益）；每层合成层耗内存，不预防性乱加。
- **B14 图标描边匹配文字字重**（24px 网格）：Regular(400) 14–16px 文本 → **1.5px**；Medium/Semibold(500–600) → **2px**；Bold(700)/强调独立图标 → **2.5px**。一致性规则：一个表面一种光学策略（不混图标库）；inline 图标尺寸 = 文本 cap height，通常 **1em–1.25em**。
- **B15 单 SVG 按态变色**：`currentColor` 驱动，hover/selected/disabled 全靠 CSS color/opacity（例：disabled `opacity:0.4`）；禁每态单独资产；导入图标时剥离硬编码 `fill="#666"`；**outline 变体=默认态，fill 变体=选中/激活态**；outline↔fill 切换走 B7 的 cross-fade 参数。
- **B16 动效克制**：高频交互不做自定义动画（每次触发都收注意力税）——给即时反馈或最 subtle 的 `opacity`/`background-color` **≤150ms** 过渡；动效永不是唯一反馈通道（每个动画态变更须有静态线索：颜色/图标/label）；更短更小优先——"有疑问时砍时长，不砍清晰度"。

### icons.md 补充规则

- B17 渲染尺寸设计：每个图标在最小渲染尺寸（常 **16px**）测试可辨认；小上下文用简化字形；保持像素网格（用图标集原生 **16/20/24** 网格尺寸，16px 图标在 24px 网格分数缩放会发虚）；**永远 SVG 不用栅格**。
- B18 RTL 翻转表：翻——前进/后退箭头、导航 chevron、文本块字形（对齐/列表/缩进）、音量波、"发送"类方向 glyph；不翻——logo/品牌标、对勾、物理物体（钟/杯/笔）、媒体播放键（play/rewind 指磁带方向，惯例保持 LTR）。CSS `[dir="rtl"] .icon-directional { scale: -1 1 }`；复合图标逐部分析（badge/slash 叠加可能不随基字形翻）。

### review-output.md（评审输出格式）

- B19 发现表：按原则分组，列 **Severity/Location(`path:line`)/Before/After/Why**，禁分行写 Before:/After:；系统性重复问题合并一行列全部位置；无发现的原则省略。
- B20 严重度定义：**HIGH**=交互误导/无响应/反复打断；**MEDIUM**=明显工艺/一致性问题；**LOW**=孤立打磨点。
- B21 验证段：列出跑过的确切检查与观测结果；涉及动画须 10% 速度检查；没跑的检查要声明待验证。
- B22 裁决三态：**Block**（仍有 HIGH）/ **Needs changes**（只剩 MEDIUM/LOW）/ **Approve**（无可行动发现）；无发现时省表，写 "No actionable UI-polish findings" + 验证 + Approve。
- B23 编排关系：被 `better-interface` 编排时，格式/严重度/合并/上限/裁决归 better-interface 所有，本技能只交领域证据。

**规则条数合计：24 条（B0–B23，其中 B1–B16 为 SKILL.md 编号的 16 条核心数值处方）。**

## ③ 对"工程质量四维度"的支撑点

- **组件化**：B9 的 `static` prop 模式（组件 API 级开关）；B15 单 SVG currentColor 模式消除状态资产矩阵；B14"一个表面一种图标光学策略"是组件库一致性规则；B10 明确组件级适用/不适用边界。
- **统一性**：B1 同心圆角公式把嵌套半径从感觉变成可算规则；B3/B8 给出可沉淀为 token 的 `--shadow-border` 变量配方；B14 图标描边-字重映射表；B16 统一"高频=即时/低频=表现"的动效预算原则。
- **可维护性**：review-output 的 Before/After/`path:line` 表格是可执行的发现格式；"系统性问题合并一行列全部位置"防止重复噪声；B23 明确了被上层编排时的职责移交（不抢格式所有权）。
- **性能**：B12 只过渡变化属性；B13 will-change 的 GPU 可合成属性白名单与内存成本警告；B11 主题切换 reflow 技巧；B5 高频交互禁 stagger 直接是性能+认知双重保护。

## ④ 与 workflowhub 的精确集成点

| better-ui 机制 | 集成点 |
|---|---|
| 16 条数值处方（B1–B16）+ icons 补充（B17–B18） | **frontend-component-quality**：作为静态检查规则表逐条独立复制（圆角同心可写 AST/CSS 检查、stroke-weight↔font-weight 映射可机器判定、scale(0.96)/100ms stagger 等是断言阈值）；同时入 **ui-project-init** 的组件库脚手架默认（Button 的 static prop、active:scale-[0.96]、shadow-border token） |
| B0 "10% 速度回放 + 走遍每态" | **isolated-browser-qa**：动画 QA 的标准操作步骤（Animations 面板慢放）；**verify-change** 的动效回归验证步骤 |
| B19–B22 评审格式（三严重度表 + 验证段 + 三态裁决） | **frontend-component-quality** / **ui-visual-fidelity** 的报告输出格式模板；Block/Needs changes/Approve 与 review 链裁决词对齐（注意与 impeccable 的 recapture/rebuild/fix/ship 是两套词表，须选一个或显式映射） |
| B3/B8 阴影与描边 token 配方（含 oklch 精确值） | **ui-project-init** 的 token 初始化默认值；**design-extractor** 的抽取参照（识别 shadow-border 模式为 token 而非 one-off） |
| B11 主题切换压制过渡组件 | **frontend-prototype-render** 的主题切换实现模式；**frontend-testing** 可写"主题切换无过渡拖影"断言 |
| B5/B6 入场 stagger/退场时长配比 | **frontend-component-quality** 的动效检查项；**ui-parity-checklist** 对照设计稿验证动效时序 |

## ⑤ 移植风险

- **许可证**：MIT（SKILL.md frontmatter 声明），可自由复制改写。
- **依赖**：**零脚本零代码依赖**——纯 markdown 规则文档，是三个 P0 技能中移植成本最低的；处方中引用 `motion`/`framer-motion`/`next-themes` 只是条件分支（"项目装了才用"），不构成自身依赖。
- **上游漂移**：数值处方（0.96、0.25→1、blur 4px、bounce:0）是作者精心校准的稳定值，漂移风险低；但 Tailwind 语法映射（`transition-transform` 覆盖范围）随 Tailwind 版本变化，需按目标项目 Tailwind 版本复核。
- **冲突**：(1) 与 impeccable craft-floor 的潜在张力——craft-floor CF26 说"border 或 shadow 二选一"，better-ui B3 给出三层阴影环的的具体实现，二者方向一致可共存；(2) 评审裁决词 Block/Needs changes/Approve 与 impeccable finish-reviewer 的 recapture/rebuild/fix/ship 是两套词汇，workflowhub 集成时必须统一裁决词表，否则 review 链出现双标准；(3) 其免责声明把 typography/a11y/layout 划给同作者另外三个技能，移植时注意别与 web-design-guidelines 等 a11y 来源重复造规则。

## ⑥ 验证或推翻之前结论

**之前结论**："better-ui = 16 条数值处方，独立复制"。

**判定：验证成立，且需小扩展。**
- ✅ SKILL.md 的 Core Principles 确实编号为 1–16 条，每条带精确数值（0.96/0.95 下限、~100ms/80ms stagger、0.25→1、blur 4px、bounce:0、150ms、1.5/2/2.5px 描边映射、oklch 透明度值等），"16 条数值处方"表述精确。
- ✅ "独立复制"成立：零依赖纯文档，逐条复制到 frontend-component-quality 规则表无移植障碍；且多数规则可机器检查（同心圆角、transition-all 禁令、will-change 白名单、currentColor）。
- ⚠️ 小扩展：除 16 条处方外，review-output.md 的**三严重度 + 三态裁决输出格式**（B19–B23）和 B0 的**10% 速度评审方法**是独立于处分的第二份资产，应一并复制到评审链；"独立复制"结论应修正为"16 条处方 + 1 套评审输出格式，一起独立复制"。

# P0 深读笔记：impeccable（Website-skills 镜像仓）

- 来源：`/Users/Hugh/Hugh/Project/Website-skills/impeccable/`（SKILL.md v4.1.1，license: MIT）
- 体量：SKILL.md 81 行 + reference/ 下 33 个 md（约 5200 行）+ agents/ 4 个角色定义 + scripts/ 约 90 个脚本（含一个独立的反模式检测器 detect.mjs，5536 行 checks + 617 行 registry）
- 精读范围：SKILL.md 全文；reference/ 下全部 33 个文件（craft-floor, polish, critique, audit, audit.native, layout, typeset, animate, colorize, optimize, harden, bolder, quieter, distill, clarify, adapt, adapt.native, onboard, delight, overdrive, extract, visualize, new-work, shape, operate, routing, init, document, live, live-setup, hooks, doctor, ios, android, degraded/finish-reviewer, degraded/asset-producer, degraded/documenter, degraded/manual-edit-applier）；另核查了 detector 的规则注册表与常量文件（规则 id 与数值阈值）。

## ① 核心机制（一句话）

一个"设计总监"人格 + 21 条命令路由（shape/critique/audit/polish/bolder/quieter/distill/harden/onboard/animate/colorize/typeset/layout/delight/overdrive/clarify/adapt/optimize/live 等）+ 三件套持久上下文（PRODUCT.md 产品真相 / DESIGN.md 视觉系统 / surface brief 单页策略）+ 编辑前必载的 craft-floor 质量地板与绝对禁令 + 捆绑式确定性反模式检测器（detect.mjs）+ 强制双独立子代理评审（critique 的 A/B 评估、finish-reviewer 四态裁决 recapture/rebuild/fix/ship）+ **有界验证**（一次批式截图检查 + 最多一次确认轮，禁止开放式自 QA 循环）。

## ② 完整可执行规则表（逐条，含数值）

### SKILL.md 层（核心原则与设置）

- S1 Go all out：交付必须完整（用户须提供的资产除外），不许 hedging/shortcut。
- S2 Dream big and bold：作品须 distinct/beautiful/outstanding/inspiring。
- S3 **有界验证**：整个周期（截图、缺陷扫描、微改、重建）共享一个上限——"build fully → 一次批式检查（web 上 desktop+mobile 同轮；native 上所有 shipped device classes）→ 一批修完 → 最多再一轮确认 → 停止打磨"。开放式 self-QA 被明确定性为烧钱行为。
- S4 Setup 三步：(1) 每会话跑一次 `context.mjs`（加载 PRODUCT.md/DESIGN.md/surface brief，可带 `--target`）；(2) 行动前加载"拥有该请求的那一个 playbook"（命令表 reference 或 new-work.md），并先检查目标 + 至少一个现任视觉真相来源（tokens/theme/CSS/组件/资产）；(3) 编辑 UI 前立即加载 craft-floor.md（纯规划工作不载）。
- S5 The brief wins：pinned 的审美/年代/材质/字体/色板优先于"饱和模式警告"；把清晰 brief 掰向自己口味=失败。
- S6 Refinement preserves; redesign replaces：精修保留现任身份/行为/文案；重设计保留产品真相但把旧外观当反参照；**永不折中**（"Never split the difference"）。
- S7 Visual authority is evidence, not a filename：缺 DESIGN.md ≠ greenfield。
- S8 四访客模式（按 surface 而非产品选）：Persuade（落地页/营销/定价，赢得注意与行动）/ Operate（任务型 UI：可扫读性、一致性、原生期望优先于表达）/ Read（文档/文章：理解为先）/ Experience（作品集/展示：作品本体领先，界面退后）。
- S9 路由规则：无参数→读 routing.md 出菜单且**永不自动执行命令**；明确命令→载其 reference；两个命令都合适时**只问一次**；PRODUCT.md 缺失的新 surface 走 init→new-work，窄精修不阻塞于 init。
- S10 `teach`=init 别名；`craft`=废弃别名；`shape` 拥有任务发现，仅在视觉世界/surface 概念决策时进入 new-work。
- S11 Pin/Unpin：`pin.mjs <pin|unpin> <command>` 建 `$<command>` 快捷方式。
- S12 hooks 子命令管理设计检测器钩子；doctor 子命令报告并修复工件漂移；**CONTEXT_STALE 只报告不行动**（除非用户要求或 finding 标 `auto`）。

### craft-floor.md（质量地板——Verify 9 条 + Refuse 20 条）

Verify（全部是对建成结果的检查，合并进同一轮批式检查，共享一次渲染）：
- CF1 **对比度**：正文与 placeholder 文本 ≥ **4.5:1**；大文本 ≥ **3:1**。彩色表面上次级文本从该色相或前景色调配，**永不用灰**。
- CF2 **深度**：阴影须有偏移 + 柔和模糊；零偏移彩色光晕=装饰。
- CF3 **间距**：组内紧、组间宽、标题上方空白大于下方；读计算值（computed values）验证。
- CF4 **字体**：正文行长 **65–75ch**；display 上限 **6rem**；字距下限 **-0.04em**；标题 balanced；字阶与字重台阶明显；每个断点跑真实文案修溢出。
- CF5 **动效**：一个 authored moment，不许散点特效、不许每个 section 同一入场；从"已可见默认态"用指数 ease-out；调色盘含 blur/backdrop-filter/clip-path/mask/shadow（保持流畅前提下）。
- CF6 **状态**：hover/disabled/loading/error/empty 全有；真实内容、可用控件、响应式、键盘焦点。
- CF7 **浏览器表面**：文本选区、光标 caret、自定义滚动条、focus ring、下划线偏移、表格数字——全部从调色板主题化（"built vs assembled 最便宜的分辨信号"）。
- CF8 **文案**：控件命名其动作；错误命名问题与恢复路径。
- CF9 **覆盖**：brief 的每条要求在数秒内可找到。

Refuse（类别默认值；brief 原话可挣回大多数，**kicker 除外**）：
- CF10 禁同尺寸"图标+标题+文字"卡片阵列当页面结构；**嵌套卡片永远错误**。
- CF11 禁 hero-metric 模板（大数字+小标签+辅助统计+强调色）。
- CF12 **禁 kicker/eyebrow（绝对禁令，无 brief 可挣回）**：标题自带重量，删标签。
- CF13 禁 section 编号（01/02/03），除非序号本身承载读者需要的信息。
- CF14 禁给不需要中断/受保护焦点的任务用 modal。
- CF15 禁渐变文字（emphasis 用 weight/size）。
- CF16 禁玻璃/模糊当装饰而非具体效果。
- CF17 禁卡片/列表项/callout/alert 上 >**1px** 的彩色 border-left/right。
- CF18 禁硬偏移阴影（`box-shadow: 4px 4px 0`），除非世界确实是 neobrutalist。
- CF19 禁 sparkline/进度环/软阴影圆角矩形冒充内容。
- CF20 禁 monospace 当"技术感"戏服（仅限代码/数据/度量）。
- CF21 禁系统 display 字体（Impact/Arial Black/平台 sans）当自有世界页面的展示声音；必须自托管气质匹配的字面。
- CF22 禁 Unicode 字形/emoji 冒充图标系统；图标必须绘制（真实库或自绘 SVG），统一笔画与重量。
- CF23 禁几何遮罩（圆/多边形/radial-gradient）冒充有机轮廓；用真实图像 alpha matte 或切图资产。
- CF24 禁按类别选明暗；从使用场景（谁/在哪/什么环境光）选。
- CF25 字距止于 **-0.04em**；-0.02~-0.03em 通常更好。
- CF26 elevation 只声明一次：border 或 shadow 二选一；1px border + 宽软阴影="ghost card"；卡片圆角 **12–16px**；pill 只给小控件。
- CF27 插图要么真要么无：禁 sketch 风 SVG 场景/`loose-sketch`/`doodle` 类名/`feTurbulence` 噪点；SVG 做几何（图表、清晰矢量、动画线、shader）仍是一等媒体。
- CF28 背景即表面，纹理只能来自主体世界；`repeating-linear-gradient` 条纹与双轴网格需要真有画布/地图/蓝图/量具。
- CF29 声明与配置来自供给真相；示意值须诚实标注。
- CF30 地板只管机械不管方向；全绿后把页面花在承诺的世界上；纠结时 commit。

### critique.md（UX 评审——双独立评估 + Nielsen 打分）

硬不变量：
- CR1 Assessment A（设计评审）与 B（detector/浏览器证据）**都必须跑**，且**必须作为两个隔离子代理并行**（有 Task 工具时）；inline 跑=降级运行。
- CR2 降级时报告首行必须是横幅 `⚠️ DEGRADED: single-context (<reason>)`；沉默降级=失败评审。
- CR3 A 必须先完成，detector 发现才能进入父合成上下文（防锚定）。
- CR4 跳过 detector=失败，除非 detect.mjs 缺失或真实尝试后崩溃。
- CR5 可视目标可用时须浏览器检查；critique 专用本地服务器须后台跑、记录停止方法、报告前停掉。
- CR6 不许声称 overlay 存在除非脚本注入成功。
- CR7 问题是回复的**最后内容**；报告全文先于问题。
- CR8 结束时必须有定向问题或字面行 `Questions skipped: <reason>`。

Assessment A 评估项：设计特异性（在见 detector 输出前判断）/ 整体（层级、IA、情感契合、可发现性、构图、字体、色彩、a11y、状态、文案、边界）/ 认知负荷 / 情感旅程（peak-end）/ Nielsen 10 启发式各 0–4 分（不适用标 n/a）。返回：特异性裁决 + 启发式分数 + 认知负荷 + 情感旅程 + 2–3 优点 + 3–5 优先问题 + persona 红旗 + 小观察 + 挑衅性问题。

Assessment B：`detect.mjs --json [target]`；退出码 0=clean、2=有发现；>500 可扫描文件须收窄或询问；URL 跳过 CLI 用浏览器可视化；浏览器注入 `detect.js` 后等 **2–3 秒**读 `impeccable` 控制台消息；多视图目标注入 **3–5** 个代表页。

认知负荷（8 项清单 + 工作记忆规则）：
- CR9 8 项检查：单一焦点 / 分块（每组 ≤**4** 项）/ 分组 / 视觉层级 / 一次一事 / 最少选择（每决策点 ≤**4** 可见选项）/ 工作记忆（不依赖上一屏信息）/ 渐进披露。
- CR10 评分：失败 0–1=低（好）、2–3=中（尽快处理）、4+=高（须修复）。
- CR11 工作记忆 ≤**4** 项（Cowan 2001）；5–7=临界须分组；8+=过载。
- CR12 应用：按钮 1 主 + 1–2 次；导航 ≤**5** 个顶层项；文档侧栏每层 ≤**4** 个可见兄弟选项；作品集索引一屏一决策。
- CR13 8 类常见违规：选项墙（10+ 无层级）/ 记忆桥 / 隐藏导航 / 行话墙 / 视觉噪音地板（一切同权重）/ 不一致模式 / 多任务要求 / 上下文切换。

Nielsen 打分：
- CR14 10 启发式各 0–4；总分 /40；n/a 时按适用满分归一（如 24/32）；比例分带：**90%+ Excellent、70%+ Good、50%+ Acceptable、30%+ Poor、以下 Critical**（绝对值分带 36–40/28–35/20–27/12–19/0–11）。
- CR15 诚实打分：4=真正优秀；**多数真实界面 20–32/40**。
- CR16 模式适用性：启发式 7（效率）与 10（帮助文档）在 Persuade/Experience 面可 n/a。
- CR17 问题严重度 P0–P3：P0 阻断（立即修）/ P1 重大（发布前修；判定口诀"用户会因此联系客服吗？"是则至少 P1）/ P2 次要（下轮修）/ P3 打磨（有时间再修）。
- CR18 报告结构：方法行（dual-agent 带 agent-id 或 DEGRADED 横幅）→ Design Health Score 表 → Design Specificity Verdict（**从这里开始**）→ Overall Impression → What's Working（2–3）→ Priority Issues（3–5，每条带 [P?]/Why/Fix/Suggested command）→ Persona Red Flags → Minor Observations → Questions → Run Notes。
- CR19 持久化：`.impeccable/critique/` 快照（IMPECCABLE_CRITIQUE_META JSON 带 total/max/na/p0/p1）；趋势行读最近 **5** 次；写后删临时文件。
- CR20 提问规则：**2–4 个问题**，每个带 2–3 个具体选项且引用具体发现；仅当 Priority Issues <**3** 时才允许跳过；推荐动作只允许 21 个 `$impeccable` 子命令集合内，且如有修复须以 `$impeccable polish` 收尾。

Persona（5 个原型，选 2–3 个走查主路径）：
- CR21 Alex（效率专家）：主任务 <**60 秒**、键盘快捷键、可跳过 onboarding、Esc 关 modal、批量操作。
- CR22 Jordan（新手）：**5 秒**内第一动作显然、图标带文字标签、决策点有上下文帮助、每步可回退。
- CR23 Sam（无障碍依赖）：全流程纯键盘可完成、可见焦点、有意义 alt、对比度 **4.5:1**、**200%** 缩放可用、状态变更被读屏播报。
- CR24 Riley（压力测试）：0/1000 项、超长文本、emoji/RTL/粘贴 Excel、刷新中途状态保留、多标签。
- CR25 Casey（分心移动用户）：主动作在拇指区（屏幕下半）、状态持久化、**3G** 慢网可用、autocomplete、触控目标 ≥**44×44pt**。
- CR26 界面类型→persona 映射表：落地页=Jordan/Riley/Casey；dashboard=Alex/Sam；电商=Casey/Riley/Jordan；onboarding=Jordan/Casey；数据分析=Alex/Sam；表单向导=Jordan/Sam/Casey。
- CR27 AGENTS.md 有 `## Design Context` 时另生成 1–2 个项目专属 persona；无真实上下文不发明。

### audit.md / audit.native.md（技术审计，5 维 × 0–4）

Web 五维检查项：
- AU1 **A11y**：对比度 <4.5:1（AAA 7:1）；`prefers-reduced-motion` 需有意的替代（禁全局 0.01ms 杀全部、禁超阈闪烁、禁阻碍焦点的动效）；ARIA 角色/标签/状态；键盘导航与焦点；语义 HTML；alt；表单标签/必填标识。
- AU2 **Performance**：layout thrashing（循环内读写布局属性）；昂贵动画（layout 属性动画、无界 blur/filter/shadow、掉帧）；图片懒加载缺失；`will-change` 滥用（只对已知昂贵动画、静止时移除）；bundle/无效重渲染。
- AU3 **Theming**：硬编码颜色、暗色模式破损/对比差、token 混用、主题切换不更新。
- AU4 **Responsive**：固定宽度、触控目标 <**44×44px**、横向滚动、文本放大破版、缺断点。
- AU5 **Implementation Integrity（CRITICAL）**：跑 detect.mjs 并逐条在上下文中核实；区分确定性发现与视觉判断；标出误报。
- AU6 每维 0–4；总分 /20；分带 **18–20 Excellent / 14–17 Good / 10–13 Acceptable / 6–9 Poor / 0–5 Critical**。
- AU7 报告：Integrity Verdict 开头 → Executive Summary（分数、P0–P3 计数、Top 3–5）→ 按严重度明细（Location/Category/Impact/WCAG 标准/Recommendation/Suggested command）→ 系统性模式 → 正面发现 → Recommended Actions（P0 先；polish 收尾）。
- AU8 NEVER：不报无影响的问题/不给泛建议/不跳过正面发现/不忘记排优先级/不报未核实误报。
- AU9 native 版五维换为：A11y（VoiceOver/TalkBack、**44pt/48dp**、Reduce Motion）、Performance（启动、列表虚拟化、主线程卡顿、图片解码缓存）、Appearance & Theming（语义色/Material 角色/动态色回退）、Platform Conformance（CRITICAL，对照 ios.md/android.md slop test）、Adaptivity（size classes、横屏、IME、分屏、折叠屏）；分带相同。

### polish.md（发货前终检）

- PO1 精修≠伪装重设计；概念错了就说并建议 redesign/bolder。
- PO2 detector 结果是缺陷证据而非质量证明；须亲自检查渲染体验与真实交互路径。
- PO3 漂移四分类：missing token / one-off implementation / conceptual mismatch / local defect；在最窄正确层级修因。
- PO4 证据收集：亲自在代表尺寸使用该功能（web：desktop+mobile；native：所有 device classes）；有旧 critique 快照时 `critique-storage.mjs latest` 读取（exit 0=有，exit 2=无）作一个输入，但仍独立走查。
- PO5 Triage 顺序：1) 阻断/数据丢失/误导状态/不可达路径；2) 缺 loading/empty/error/success/disabled/permission 状态；3) 流程/层级/响应式/设计系统漂移；4) 视觉与动效不一致；5) 代码与资产清理。不许只打磨一角。
- PO6 全路径打磨四组：流程与层级（邻近心智模型/术语/披露/路由/保存行为一致）；布局与字体（网格、光学对齐、组间关系、同角色字体一致、行长/换行/本地化扩展/缩放/字体加载）；色彩图像图标（语义 token、各状态对比度、图标族/笔画/光学对齐、防图片 layout shift）；交互与状态（default/hover/focus/active/disabled/loading/error/success、键盘焦点、tab 顺序、触控目标、动效可中断、长/缺失/本地化/离线/慢速内容）。
- PO7 内容与代码：术语/大小写/标点一致；改事实性文案前问；删 debug/死代码/未用 import；共享组件替换自造；真可复用值提升为 token（单一例外不建抽象）。
- PO8 终检清单：所有 viewport、全部状态、zoom/对比度/焦点/语义/读屏名、console 错误/layout shift/交互延迟/图片加载、与 DESIGN.md 及范围一致；**干净的扫描不替代视觉判断**；以 source diff 收尾，只交付功能完整且全路径一致的东西。

### 各 Enhance/Refine/Fix 命令的数值处方

typeset.md：
- TY1 正文行长 **45–75ch**；web 正文地板 **1rem/16px**（密集角色/平台惯例可例外）。
- TY2 行高与行宽反向调节（越宽越多 leading）；按字面/宽度/语言/对比度调，不用通用比率。
- TY3 暗底浅文三轴补偿：更多行高 + 一点字距 + 一档字重。
- TY4 段落节奏二选一：段距或首行缩进，不双标记。
- TY5 最少角色与字族让层级无疑义；不只靠字号。
- TY6 只加载用到的字重资产；metric-compatible fallback；避免不可见文本与 reflow。
- TY7 保留浏览器 zoom/用户字体设置/Dynamic Type/平台文本缩放。
- TY8 Live 参数：`scale` range **0.85–1.3**，step 0.05，default 1（`var(--p-scale, 1)`）。

layout.md：
- LA1 双隔离评估（布局评估 + `--scope layout` 机械扫描），扫描证据不进第一评估（防锚定）；干净扫描不能证明层级/节奏。
- LA2 Squint test：模糊细节后仍能按序识别主元素/次元素/大组。
- LA3 用文档化间距阶而非一次性值；**4 为基的间距阶**提供 8-only 阶缺失的中间步。
- LA4 用 `gap` 表达兄弟节奏；container-aware 组件；触控目标可用；光学修正在看渲染结果之后。
- LA5 验证 8 项（squint/各尺寸路径/分组/节奏/密度/极端内容/键盘与读屏顺序=视觉顺序/扫描无未解释发现），逐项以渲染或源码证据回答。
- LA6 Live 参数：`density` range **0.6–1.4**，step 0.05，default 1。

animate.md：
- AN1 时长表：**100–150ms** 即时反馈；**150–300ms** 常规状态变化；**300–500ms** 布局/overlay/视图过渡；**500–800ms** 有意 authored 的入场。
- AN2 出场快于入场；自信到着用 `cubic-bezier(0.16, 1, 0.3, 1)` 类自然减速；不反射性用 bounce/elastic。
- AN3 默认态内容可见（脚本失败不藏页面）；不动 `width/height/top/left/margin` 等 layout 属性（用 FLIP/transform/grid）；blur/filter/shadow/canvas/shader 限定隔离区；`will-change` 只在动画期间。
- AN4 每个 web 动画须有 `prefers-reduced-motion` 路径：减空间移动、保留承载意义的 opacity/color/状态过渡；非必要循环离屏即停。
- AN5 sibling stagger 仅当列表以列表出现时；封顶总延迟；不把每个滚动 section 当 stagger 列表。
- AN6 Operate/Read：常规过渡要快，不做页面加载编排。

colorize.md：
- CO1 WCAG AA 表：正文 **4.5:1** / 大文本 **3:1** / 控件、图标、焦点指示 **3:1**；检查交互态/overlay/图上文字/disabled/双主题；模拟常见视觉缺陷；色彩传达的信息须有文字/形状/图标/位置冗余。
- CO2 角色建色（canvas/elevated、主/次文本、action/focus/selection、边框分隔、success/warning/error/info、数据类别），非一把色票；新 web 调色板优先 **OKLCH**；OKLCH ramp 近白近黑降 chroma；显式色优于半透明叠加链。
- CO3 最强色拥有整块区域/角色而非散落小 accent；主行动色不花在装饰上；中性灰合法；彩色表面次级文本从前景/表面色派生不用灰；暗色模式显式设计 elevation 不机械反转。
- CO4 Live 参数：`color-amount` range **0–1**，step 0.05，default 0.5。

optimize.md：
- OP1 Core Web Vitals 阈值：**LCP < 2.5s**；**INP < 200ms**（2024-03 取代 FID）；**CLS < 0.1**。
- OP2 **60fps = 16ms/帧**；用 requestAnimationFrame、debounce/throttle scroll、IntersectionObserver。
- OP3 图片：WebP/AVIF、srcset/sizes、below-fold lazy、压缩 **80–85%** 质量通常不可感知、CDN。
- OP4 字体：`font-display: swap/optional`、subset（如 `unicode-range: U+0020-007F`）、preload 关键字体、限制字重数。
- OP5 渲染：批读批写消 thrashing、`contain`、`content-visibility: auto`、长列表虚拟滚动（react-window/TanStack Virtual）、减 DOM 深度。
- OP6 GPU 加速用 transform/opacity；禁随意动画 width/height/left/top。
- OP7 React：memo/useMemo/useCallback/路由 code split/Profiler。
- OP8 永不：未测量就优化、牺牲 a11y、will-change 到处用、lazy-load 首屏内容、捡芝麻丢西瓜、忘移动端（真机 + **3G** 节流测试）。

harden.md：
- HA1 极端输入：超长/超短文本、emoji/RTL/重音、百万级数字、**1000+** 列表项/**50+** 选项、空数据。
- HA2 错误场景：offline/slow/timeout；**400/401/403/404/429/500** 各有专属处理；并发；限流。
- HA3 i18n：德语常比英语长 **30%**（预留 **30–40%** 扩展预算）；RTL 用逻辑属性（`margin-inline-start` 等）；Intl.DateTimeFormat/NumberFormat；正确复数库；UTF-8；CJK/emoji（2–4 字节）。
- HA4 文本溢出：truncate/line-clamp(`-webkit-line-clamp: 3`)/`overflow-wrap: break-word`+`hyphens: auto`；flex/grid 子项 `min-width: 0`。
- HA5 移动正文 **16px** 地板（iOS Safari 对 <16px 输入框强制缩放）；**200%** 缩放测试。
- HA6 表单：inline 错误、保留用户输入、约束 hint；双提交防护（loading 时禁按钮）；乐观更新带回滚。
- HA7 慢网：骨架屏、渐进图片、service worker 离线；清理监听器/订阅/定时器/abort 请求；debounce 300ms/throttle 100ms 示例。
- HA8 测试策略：极端数据/多语言/离线/3G/读屏/纯键盘/旧浏览器 + axe/WAVE。
- HA9 验证清单：100+ 字符名、全字段 emoji、阿语/希语、CJK、断网、1000+ 项、连点提交 10 次、强制各 API 错误、清空数据。

adapt.md：
- AD1 断点参考：mobile **320–767px** / tablet **768–1023px** / desktop **1024px+**；或内容驱动断点（通常 3 个够：**640/768/1024**）；用 `clamp()`。
- AD2 触控目标 **44×44px** 最小；拇指区优先；hover 不可依赖（用 `@media (hover: hover)` / `(pointer: fine|coarse)` 检测输入法而非屏幕尺寸）。
- AD3 移动策略：单列、底部导航、bottom sheet 替代 dropdown、正文 ≥**16px**、渐进披露。
- AD4 平板：双列/master-detail/方向自适应；桌面：多列、侧栏常驻、max-width 防 4K 拉伸、hover/快捷键/右键/拖放。
- AD5 打印：逻辑分页、去导航、黑白；Email：**600px** 窄宽、单列、inline CSS、table 布局。
- AD6 安全区：`env(safe-area-inset-*)` + `viewport-fit=cover`。
- AD7 响应式图片 srcset w 描述符 + sizes；art direction 用 `<picture>`。
- AD8 真机测试：至少一台真 iPhone + 一台真 Android +（相关时）平板；便宜 Android 暴露性能问题；DevTools 仿真缺触控/CPU/网络/字体渲染/浏览器 chrome。
- AD9 永不：移动端藏核心功能、桌面=强设备假设、跨上下文不同 IA、忘横屏、盲用通用断点、桌面忘触控。

onboard.md：
- ON1 原则：Show don't tell / 可跳过 / Time-to-value 最快（教 20% 交付 80% 价值）/ 上下文优于仪式 / 尊重用户智力。
- ON2 核心概念介绍 **1–3 个**；guided tour **3–7 步**上限。
- ON3 空状态五要素：这里将有什么 / 为何重要 / 如何开始（CTA/模板）/ 视觉趣味 / 上下文帮助；五类：first-use/user-cleared/no-results/no-permissions/error。
- ON4 实现：Tippy/Popper；Intro.js/Shepherd/React Joyride；LocalStorage 记"seen"；analytics 追踪完成/流失点。
- ON5 永不：强制长 onboarding、居高临下、重复弹已 dismiss 的 tooltip、tour 阻塞全部 UI、脱离真实产品的 tutorial 模式、藏 Skip、对回访用户重放初始 onboarding。
- ON6 验证：完成时长/理解度/下一步行动/skip rate/完成率/time-to-value。

bolder.md：
- BO1 范围至上："其他一切不动"是字面指令；不引入新色/字体/圆角/阴影/系统原语；系统表达不了就停下来问。
- BO2 平的原因通常是该 section 退出了系统自己的最强动作；用系统自身词汇放大到邻居已有的表达层级。
- BO3 Commit then clarify：一个决定性动作做满，其余安静；"每个元素都更响=更平"。
- BO4 Skeleton test：抽掉文案后骨架仍能说出这是什么、为何重要。
- BO5 收尾四查：目标外无改动/无新原语/原有约定仍工作/同品牌更自信。

quieter.md：
- QU1 降饱和至 **70–85%**；中性为主、彩色 accent **10% 规则**；tinted gray 代纯灰；**彩底上永不用灰文字**（用该色的深色或透明度）。
- QU2 字重降档（900→600、700→500）；用 weight/size/space 而非颜色做层级。
- QU3 动效减程（**10–20px** 代 40px）、ease-out-quart、永不 bounce/elastic；无明确目的的动画直接删。
- QU4 减尺跳跃、对齐网格、均匀间距。
- QU5 永不：一切同尺寸同重/全去色/抹平个性/牺牲可用性/全小全轻。

distill.md：
- DI1 找一个主目标（ONE）；20% 交付 80% 价值。
- DI2 色彩 1–2 + 中性色（非 5–7）；一个字族、**3–4 字号、2–3 字重**；去无功能边框/阴影/背景；扁平化结构、**永不卡片套卡片**；基础布局不用卡片用间距对齐。
- DI3 线性流替代复杂网格；一主行动；智能默认；inline 替代 modal；砍步骤。
- DI4 文案：每句砍半再砍半；主动语态；去行话；说一次。
- DI5 代码：删死代码、扁平组件树、合并样式、变体收敛（12 变体→3 覆盖 90%）。
- DI6 永不：删必要功能/牺牲 a11y/简到费解/删决策所需信息/抹平层级/把复杂领域过度简化。

clarify.md：
- CL1 消息层级四问：现在需要知道的一个事实/下一步动作/改变决策的支撑上下文/此刻合适语气；每个想法说一次。
- CL2 动作标签=具体动词+宾语，描述将发生什么而非手势；同概念同名词动词；破坏性动作命名对象与后果；安全时 undo 优于确认；确认文案与按钮都命名动作（禁 Yes/No/OK/Submit）。
- CL3 表单：常驻 label（placeholder 是示例非标签）；提交前给格式/资格要求；错误说清要注意什么、怎么改、不指责用户。
- CL4 可行动错误三答：什么失败/为何（已知且有用时）/如何恢复；内部错误码不作主消息；隐私/支付/删除/丢权限场景不开玩笑。
- CL5 loading 命名真实操作、诚实预期；有确定进度就显示，**永不编造进度**；空状态区分五种成因；成功确认简短。
- CL6 可翻译完整句子（不拼接片段）；变量可重排；alt 传达信息（装饰用空 alt）；读屏名=可见标签；不靠标点/颜色/图标单独传达。
- CL7 验证：无隐藏知识可懂、错误/空态/决策点可行动、事实准确、目标宽度与 **200%** 缩放可扫读、本地化扩展、复数、可访问名。

delight.md：
- DE1 一句话 delight 论点（用户应感到什么+为何属于本产品）；选能交付它的最小系统。
- DE2 时机：成功（强度与努力/后果匹配）、等待（诚实进度，永不假造工作/延迟）、空态/首用、错误恢复（温暖可、玩笑不可轻视损失/钱/隐私）、重复使用（第一百次仍可信）、发现奖励。
- DE3 保护：不延迟/阻塞/遮蔽主任务；不破平台惯例与 a11y；不加未请求的事实声明；声音须同意；非必要循环隐藏即停。

overdrive.md：
- OD1 开工横幅 `⚡ OVERDRIVE`；**先提 2–3 个方向让用户选**（带 trade-off：浏览器支持/性能成本/复杂度）再写码。
- OD2 必须用浏览器自动化预览-验证-迭代多轮。
- OD3 工具箱按目标组织：View Transitions / `@starting-style` / 弹簧物理（motion/GSAP）/ scroll-driven animations（`animation-timeline: scroll()`，Firefox 仅 flag，须静态回退）/ WebGL（Three.js/OGL/regl）/ WebGPU（回退 WebGL2）/ Canvas 2D/OffscreenCanvas+Worker / SVG filter 链 / 虚拟滚动（10 万行 60fps）/ GPU 图表（deck.gl）/ `@property` / WAAPI / WASM / Web Audio（须用户手势）。
- OD4 渐进增强不可协商（`@supports` 守护）；目标 **60fps，低于 50 就简化**；重资源近视口才初始化；离屏暂停渲染；真中端机测试。
- OD5 四测试：wow test / removal test / device test / context test。
- OD6 永不：中端机 jank、无回退用前沿 API、未 opt-in 出声、用技术掩盖弱基础、堆叠多个 competing extraordinary moments。

operate.md（Operate/Read 深化）：
- OE1 产品 UI 失败模式是"无目的的怪异"非平淡； earned familiarity 是标准。
- OE2 字体：一个字族常是对的；**固定 rem 阶而非 fluid**；阶比 **1.125–1.2**；正文行长仍 65–75ch，数据/表格 120ch+ 可。
- OE3 色彩默认 Restrained；accent 只用于主行动/当前选中/状态指示；状态语义词汇标准化（hover/focus/active/disabled/selected/loading/error/warning/success/info）；侧栏/工具栏用第二中性层。
- OE4 组件：每个交互组件七态（default/hover/focus/active/disabled/loading/error）；骨架屏代 spinner；overlay 逃离容器（dialog/popover API/fixed/portal，防 overflow 裁剪）。
- OE5 动效 **150–250ms**；只传达状态；无页面加载编排。
- OE6 禁令：装饰动效/跨屏组件词汇不一致/UI 标签用 display 字体/重造标准 affordance（自定义滚动条、怪异表单控件、非标 modal）/ 非活跃态重色/ modal 当第一直觉（先穷尽 inline/渐进替代）。
- OE7 许可：系统字体、标准导航（顶栏+侧栏/面包屑/tab/命令面板）、密度、一致性优先于惊喜。

### new-work.md / shape.md / visualize.md（新工作与定稿流程）

- NW1 视觉权威四态：Redesign（保产品真相换视觉世界）/ Established world（继承，缺 DESIGN.md 就从代码记录之）/ Incomplete brand（保确认资产再扩展）/ No visual authority（与用户共创）。
- NW2 提问一轮 2–3 个相关问题；按模式问（Persuade 问谁行动/信什么/什么证据；Operate 问任务/状态/频率/约束；Read 问读者问题/素材/结构；Experience 问什么领先/如何展开）；**永不问 CSS 值或现成审美车道**。
- NW3 色彩策略四档：Restrained（中性+1 accent；Operate/Read 默认）/ Committed（一个饱和色占 **30–60%** 表面）/ Full palette（**3–4** 个命名角色）/ Drenched（表面即颜色）；明暗永不默认——写一句物理场景（谁/在哪/什么光）逼出答案。
- NW4 字体黑名单（training-data 默认，用了须给"无其他字面能满足"的理由，主题关联不算理由）：Fraunces, Playfair Display, Cormorant, Lora, Crimson, Newsreader, Syne, Space Grotesk, Space Mono, IBM Plex, Inter-as-display, DM Sans, DM Serif, Outfit, Plus Jakarta Sans, Instrument Sans。
- NW5 AI 界面三大聚集审美（校准自检）：暖奶油底+高对比 serif+陶土/信号红 accent；近黑+霓虹 accent+发光边；报纸 hairline+斜体 display serif+tracked mono 小标签——brief 未定审美时落进其一=自检失败。
- NW6 方向合约：开工注释五块 ≤**150 词**（THESIS/OWN-WORLD/STORY/FIRST VIEWPORT/FORM）+ FINISH 行（"unreviewed and undocumented is unfinished"）；HTML 注释须在构建产物中存活（body 第一个子节点，构建后 grep seed key 验证）。
- NW7 concept-seed.mjs 滚方向（`--scope surface|direction`）；新/替换世界**未跑滚号脚本且未确认就写码=违约**；七个候选跨 ≥**3** 个材质家族；challenger 三裁决 wins/competitive/declined；一手牌最多 **3** 张全卡 challenger。
- NW8 站立出口：品类标准（canon）作为永久安静选项；用户选了就以 2–3 个对标产品的工艺水准为 bar 全保真执行。
- NW9 visualize：三张高保真 north-star comp（`.impeccable/mocks/`）；**一次批准点**（结构化问题/决策页，无替代无跳过）；批准后 comp path 入 surface brief、sidecar 标 `"approved": true`。
- NW10 实现保真清单：从 comp 像素**采样**真实 hex（ImageMagick/PIL；平场取内点、纹理取内块平均、渐变取两端色；永不采边缘）；媒介门：人物/产品/机械/光照材质=栅格（"layered CSS textures"不是媒介）；精确几何/图表/交互/动效=矢量与 GPU；密度承诺量化记录（如"三分之二首屏数千字形"）；TYPE 行记录字面的 compression class 并先渲染一个标题词对比。
- NW11 构建：comp 是法律；phase 1 复现至同尺寸截图与 comp 近乎像素重合；仅三个让步（字体取最近可得/图标除非用户已选库/comp 真实缺陷如拼写错误）；hero 先行验证存 `.impeccable/review/hero-repro.png`。
- NW12 资产 provenance：每个栅格嵌 prompt（`embed-prompt.mjs`）或来源；修复轮新建/替换的栅格同规则；放弃的栅格同批删除。
- NW13 终检：一轮批式截图（web：desktop.png+mobile.png+用户实际视口 `user-<width>.png`；native：每 device class 一张）入 `.impeccable/review/`；捕获前先停入场动效；每文件开一次确认内容名实相符；**两轮为上限**；web 无钩子时跑一次 `detect.mjs --json` 把机械发现传给 reviewer。
- NW14 finish-reviewer 五节输出契约（persistence/fidelity/ceiling/material_fixes ≤8 条/keep）；**四态 disposition：recapture/rebuild/fix/ship**；verdict pass 只给修复打分（resolved/partial/unresolved）；无人值守 run 两轮为止，有用户时第二轮仍有未决项就把表给用户选；reviewer 必须新起上下文（禁 fork 历史）。
- NW15 shape：发现访谈（一轮默认，至多两轮，每轮 2–3 问）→ new-work 解决方向 → 写最小 brief（七节结构：job&audience/outcome&proof/direction/scope/states/interaction/constraints）→ 确认后停（shape 永不写码）。

### init.md / document.md / doctor.md / hooks.md（上下文与治理）

- IN1 PRODUCT.md 模板：`impeccable:product-schema 1` 注释 + Platform（web/ios/android/adaptive 裸值）/ Stack / Users / Product Purpose / Positioning / Operating Context / Capabilities and Constraints / Brand Commitments / Evidence on Hand / Product Principles（3–5 条）/ Accessibility & Inclusion。
- IN2 init 不问审美；至少一个真实回答轮才写 PRODUCT.md；无回答机制时先探测一次，推断事实须标注并首条回复披露。
- IN3 buildPath 默认值问一次写 `.impeccable/config.json`（`comp`|`code`；local 覆盖）；沉默不写，未记录时默认 comp-led（有图像生成时）。
- IN4 document：DESIGN.md 遵循 google-labs-code/design.md 规范——YAML frontmatter（仅 `colors/typography/rounded/spacing/components` 五组；token 引用 `{path.to.token}`；组件子 token 限 **8** 属性）+ 八个固定顺序章节（Overview/Colors/Typography/Layout/Elevation & Depth/Shapes/Components/Do's and Don'ts）+ `.impeccable/design.json` sidecar（schemaVersion 2；tonalRamp **8 步** ~15%→~95% 明度；**5–10** 个代表组件，`ds-` 前缀类名、自包含 HTML/CSS、含 hover/focus 态、SVG 内联图标 **16–24px**）；已存在 DESIGN.md 须先出示并问 refresh/overwrite/merge。
- IN5 doctor：三类漂移分开（工具版本/schema drift/truth drift）；severity=auto 直接 `--fix`、mention 告知、route 指命令不自动跑；deprecated 字段视为不存在；commit 计数≠文档错误。
- IN6 hooks：编辑后自动跑检测器（两档：per-edit 即时档只报机械明确问题；Stop 事件跑全规则集去重一次）；文件类型 .tsx/.jsx/.html/.vue/.svelte/.astro/.css/.scss/.sass/.less/.ts/.js；triage 三结局（真问题→修；确证误报→最窄 ignore 并披露；不确定→问一句）；ignore 自服务止于 ignore-value，ignore-file/ignore-rule 须先问；inline 标记 `impeccable-disable <rule>` / `-line` / `-next-line`。

### live.md / live-setup.md（浏览器内实时变体迭代）

- LV1 契约顺序：live.mjs boot → 打开 app URL（非 serverPort）→ `live-poll.mjs` 长超时轮询（默认 **600000ms**）→ 事件分发（generate/steer/accept/discard/prefetch/manual_edit_apply/variant_mount_failed/exit）。
- LV2 三变体方法：Phase A 提取身份锁（一句话记录真实 dominant 色值/字配对/拓扑/表面处理/语气）；Phase B default（保身份，~90%）vs departure（仅用户明确要求）；Phase C 三个**不同主轴**（六轴：层级/布局拓扑/字体系统/色彩策略/密度/结构分解）；Phase D squint test（同品牌 + 三轴不同 + 色彩轴时三世界不同 hue）。
- LV3 参数旋钮：按视觉权重给 **0–4** 个（leaf=0；小组合 0–1；中组合目标 2；大组合 2–3 至多 4）；三种 kind：range（驱动 `--p-<id>`）/steps（驱动 `data-p-<id>`）/toggle；accept 后 carbonize 五步清理（移 CSS、烤参数值、解包、删 style/标记/死 @scope、`live-complete.mjs` 验证 phase=completed）。
- LV4 动作专属变体维度：bolder 各放大一维（scale/saturation/结构）/ quieter 各收一维 / distill 各删一类 / typeset 不同配对+不同阶比 / colorize 不同色相族 / animate 不同动效词汇 / adapt 不同目标上下文 / overdrive 跳过提问步。
- LV5 live-setup：`.impeccable/live/config.json`（files glob/insertBefore `</body>`/commentSyntax）；九框架注入表；CSP 检测四形态（null/append-arrays/append-string/middleware|meta-tag）+ 一次性同意提示（dev-only `http://localhost:8400` patch）。

### 捆绑检测器 detect.mjs（规则清单与数值）

- DT1 退出码 0=clean / 2=有发现；`--json`、`--scope layout|type`；>500 文件须收窄。
- DT2 约 **58** 条注册规则（registry/antipatterns.mjs + rules/checks.mjs），id 包括：side-tab, border-accent-on-rounded, overused-font, flat-type-hierarchy, gradient-text, ai-color-palette, cream-palette, nested-cards, monotonous-spacing, bounce-easing, pulsing-dot, blinking-cursor, shape-assembled-illustration, dark-glow, radial-halo, radial-spotlight-glow, marquee, icon-tile-stack, italic-serif-display, hero-eyebrow-chip, kicker-above-heading, numbered-section-labels, em-dash-overuse, marketing-buzzword, aphoristic-cadence, oversized-h1, extreme-negative-tracking, broken-image, script-error, content-hidden-at-rest, edge-flush-cards, text-occlusion, first-viewport-column-overflow, gray-on-color, low-contrast, layout-transition, line-length, cramped-padding, body-text-viewport-edge, tight-leading, skipped-heading, heading-rhythm, justified-text, tiny-text, undersized-ui-text, all-caps-body, wide-tracking, text-overflow, repeated-container-text, clipped-overflow-container, design-system-font, design-system-color, design-system-radius, design-system-font-size, gpt-thin-border-wide-shadow, repeating-stripes-gradient, codex-grid-background, theater-slop-phrase, image-hover-transform。
- DT3 数值常量：WCAG 大文本阈值 **18pt 普通 / 14pt 粗体**（换算 96px/inch）；em-dash 滥用双门：绝对地板 **8** 个 + 密度每 **500** 字符至少 1 个；已知 serif 名单 30+ 个用于 italic-serif-display 规则；OVERUSED_FONTS/GENERIC_FONTS 名单驱动 overused-font。
- DT4 引擎四种：browser DOM 注入 / URL / 静态 HTML+CSS 级联 / 正则文本；design-system-* 四条规则对照 DESIGN.md sidecar 做漂移检测。

**规则条数合计：约 210 条可执行规则/检查项/数值处方（上表编号 S1–S12、CF1–CF30、CR1–CR27、AU1–AU9、PO1–PO8、TY/LA/AN/CO/OP/HA/AD/ON/BO/QU/DI/CL/DE/OD/OE、NW1–NW15、IN1–IN6、LV1–LV5、DT1–DT4）。**

## ③ 对"工程质量四维度"的支撑点

- **组件化**：operate.md 的组件七态与共享词汇标准化；extract.md 的"3+ 次同意图才抽取/先找设计系统再抽取/迁移后删死代码"流程；document.md 把组件沉淀为 DESIGN.md + design.json sidecar（5–10 个自包含组件）；craft-floor 禁卡片套卡片、禁自造 affordance，逼向共享组件。
- **统一性**：DESIGN.md frontmatter tokens 为唯一事实源（frontmatter 规范化、禁双写）；design-system-* 四条检测器规则做跨文件漂移检测；polish 的"漂移四分类"（missing token/one-off/conceptual mismatch/local defect）是现成的统一性缺陷分类法；hooks 在每次编辑后机械执行统一性规则。
- **可维护性**：PRODUCT.md/DESIGN.md/surface brief 三层文档各有边界（产品真相/视觉系统/单页策略），doctor 检测漂移；方向合约（≤150 词注释随构建产物存活）让意图可审计；资产 provenance（prompt 嵌入文件）让生成资产可追溯；craft-floor 禁一次性值、要求语义命名。
- **性能**：optimize.md 完整数值处方（LCP<2.5s/INP<200ms/CLS<0.1/60fps=16ms）；animate.md 的时长表与 layout 属性禁令；audit 的 Performance 维度 0–4 评分；overdrive 的"60fps、低于 50 简化、离屏暂停"。

## ④ 与 workflowhub 的精确集成点

| impeccable 机制 | 集成到哪个技能的哪个环节 |
|---|---|
| craft-floor.md 的 Verify 9 条 + Refuse 20 条（对比度 4.5:1/3:1、行长 65–75ch、display≤6rem、tracking≥-0.04em、卡片圆角 12–16px、kicker 绝对禁令等） | **ui-visual-fidelity**：作为"craft floor"检查清单并入；同时喂给 **frontend-component-quality** 的静态规则源 |
| critique 双独立子代理（A 设计评审 / B 检测器证据，防锚定，A 先于 B）+ DEGRADED 横幅 + 报告结构 | **frontend-component-quality** / **ui-visual-fidelity** 的评审编排：独立上下文、独立来源裁决（正合 workflowhub 宪法"禁止自审自判"） |
| Nielsen 10 启发式 0–4 打分 + n/a 归一 + 分带 + P0–P3 严重度 | **frontend-component-quality** 的评分表模板；**ui-parity-checklist** 可复用 P0–P3 分级 |
| 认知负荷 8 项清单 + ≤4 工作记忆规则 + 5 persona 走查 | **frontend-component-quality** 的 UX 检查段；**isolated-browser-qa** 的走查脚本（persona Casey/Sam 直接映射移动/a11y QA） |
| audit 5 维×0–4（a11y/perf/theming/responsive/integrity）+ /20 分带 | **frontend-component-quality** 的技术审计段；**frontend-testing** 的 a11y/perf 断言阈值来源 |
| 有界验证（一轮批式截图 desktop+mobile 同轮 → 一批修 → 最多再一轮 → 停；两轮上限） | **isolated-browser-qa** 与 **verify-change** 的迭代上限协议：防开放式自 QA 烧钱 |
| finish-reviewer 四态 disposition（recapture/rebuild/fix/ship）+ verdict pass（resolved/partial/unresolved）+ 截图证据有效性检查（check 0） | **verify-change**：裁决词汇与证据有效性门；reviewer 必须独立上下文（不 fork 构建线程）直接呼应 workflowhub review 链设计 |
| detect.mjs 反模式检测器（58 条规则、exit 0/2、--scope、ignore 机制） | **frontend-component-quality** 可移植其规则注册表为静态检查；或作 **verify-change** 的机械事实采集器（事实非许可证，合宪法） |
| new-work 方向合约五块 + FINISH 行 + hero-repro.png 检查点 | **frontend-prototype-render**：构建前的方向合约与"hero 先行验证"检查点 |
| visualize 三 comp 一批准点 + 像素采样记录 hex + 媒介门（栅格 vs 矢量） | **design-source-readiness**（设计源就绪判定：有批准 comp 才构建）与 **ui-parity-checklist**（comp↔build 对照采样法） |
| init 的 PRODUCT.md 模板 + document 的 DESIGN.md 规范 + doctor 漂移检测 | **design-extractor**：抽取目标格式直接采用 google DESIGN.md spec + sidecar；doctor→漂移报告 |
| operate.md（产品 UI 专门规则）+ adapt/harden/onboard/clarify 处方 | **frontend-component-quality** 的 Operate 面专用规则段；**ui-project-init** 可按 surface mode 选择装载哪组规则 |
| hooks/doctor/CONTEXT_STALE"只报告不行动" | **verify-change**：事实浮现到边界但不阻断推进（合宪法"记录事实而非阻断"） |

## ⑤ 移植风险

- **许可证**：SKILL.md frontmatter 声明 `license: MIT`——可自由移植/改写，须保留版权声明；上游为 skills.sh 社区的 impeccable 技能（v4.1.1）。
- **依赖**：重 Node 脚本依赖（约 90 个 .mjs：detect.mjs 检测器、critique-storage.mjs、live-* 系列、concept-seed.mjs、embed-prompt.mjs 等），零 npm 依赖但体量巨大；live 模式强耦合 harness 的钩子/轮询/浏览器注入机制（Claude Code/Codex/Cursor/Copilot 四套适配），**不可整体搬运**——应抽取文档层规则（craft-floor/critique 流程/audit 评分）而非脚本层。
- **上游漂移**：detect.mjs 规则注册表、字体黑名单、AI 审美校准清单都是活文档，上游更新频繁（v4.x 迭代快）；快照式复制会过期，建议记录来源版本号（4.1.1）并定期对照。
- **冲突**：其"模式四分类"（Persuade/Operate/Read/Experience）与 workflowhub 现有技能分类需映射；其 finish-reviewer 四态裁决与 workflowhub review 链的裁决词汇需对齐，避免双套裁决语言并存；其 PRODUCT.md/DESIGN.md 文件约定与 workflowhub 的 specs/<task-id>/ 四材料治理边界不同，移植时只取格式不取文件位置约定。

## ⑥ 验证或推翻之前结论

**之前结论**："impeccable = craft-floor + 有界验证，并入 ui-visual-fidelity"。

**判定：部分验证，须显著扩展。**
- ✅ craft-floor 确实是核心可移植资产（Verify 9 条 + Refuse 20 条全部带数值，可直接并入 ui-visual-fidelity）。
- ✅ 有界验证确认存在且表述强硬（SKILL.md S3 + new-work NW13："两轮为上限"、"stop polishing"、"Open-ended self-QA burns the user's money"），并入 ui-visual-fidelity / isolated-browser-qa / verify-change 均成立。
- ⚠️ 但"并入 ui-visual-fidelity 一个点"严重低估：critique 的双独立子代理编排 + Nielsen 打分 + P0–P3 分级是独立的评审链资产（应入 frontend-component-quality/verify-change）；finish-reviewer 的四态 disposition + verdict pass 是 verify-change 的现成裁决协议；audit 五维评分是 frontend-testing 的阈值来源；PRODUCT.md/DESIGN.md 规范是 design-extractor 的抽取格式。**建议结论修正为"craft-floor + 有界验证并入 ui-visual-fidelity；critique/audit 评分体系并入 frontend-component-quality；finish-reviewer 裁决协议并入 verify-change；DESIGN.md 规范并入 design-extractor"**。

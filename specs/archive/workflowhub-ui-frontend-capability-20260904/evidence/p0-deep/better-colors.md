# P0 深度精读笔记：better-colors

来源：`/Users/Hugh/Hugh/Project/Website-skills/better-colors/`
读取范围：SKILL.md（89 行）+ 全部 7 个 references 文件（palette-structure.md / palette-generation.md / token-naming.md / color-usage.md / contrast.md / color-formats.md / review-output.md），逐字读完。

## ① 核心机制（一句话）

色彩系统 = 少量按角色命名的色阶（ramp）+ 双层 token（primitive 按色相命名、semantic 按角色命名，组件只引用 semantic 层）+ 对实际渲染背景实测对比度并只报告不擅自改色。

## ② 完整可执行规则表

### A. 色板结构（palette-structure.md）

| # | 规则 | 具体数值/处方 |
|---|------|--------------|
| A1 | 系统只需三种 ramp：neutral ×1、accent ×1、status ×0–4 | neutral 承载界面 80–90%（背景/边框/正文）；status 只发产品真实渲染的（danger/warning/success/info），发一条没人 import 的 warning ramp = 11 个 token 的纯维护成本 |
| A2 | 第二 accent 色相仅在"两个元素必须一眼可区分且永不相邻"时才加 | 否则用 accent ramp 自身色阶提供范围 |
| A3 | 每个色阶必须有一个角色消费它；无角色的阶不生成 | 角色↔阶映射表（Tailwind/Radix）：页面背景 50/1；微妙背景 50/2；组件背景 100/3；组件 hover 200/4；组件 active/选中 200/5；微妙边框 200/6；边框/分隔线 300/7；强边框/焦点环 400/8；实心填充 500/9；实心填充 hover 600/10；低对比文字 700/11；高对比文字 900/12 |
| A4 | Radix 12 阶按角色定义，Tailwind 11 阶按明度定义 | Radix 的 `--accent-9` 在亮暗两态都是"实心填充"，组件 CSS 不变；Tailwind 在暗态映射反转（页面背景→950，高对比文字→50），组件要么按 appearance 换阶号，要么读 semantic token 换一次。新系统优先 Radix 模型；Tailwind 项目保留 50–950，把角色映射放进 semantic 层 |
| A5 | Tailwind 11 阶覆盖 12 个角色，有真实冲突 | 若设计需要"微妙边框"与"组件 hover"可区分，该项目需要 12 阶 ramp |
| A6 | 纯灰 neutral ramp 是合格默认；向 accent 色相偏移是风格选项而非纠错 | 偏移量 = accent  vividness 的"几个百分点，可测但不可名状"；暖灰（偏橙）=亲和/编辑感，冷灰（偏蓝）=技术/精确感；方向选定后整条 ramp 保持一致（暖灰边框+冷灰背景即使叫不出名字也能被看见） |
| A7 | neutral 需要所有 ramp 中最多的阶数，neutral 阶数永远不少于 accent | — |
| A8 | 状态色相受惯例约束：红=danger、琥珀=warning、绿=success | 文化例外见 color-usage.md |
| A9 | 每个 status 色相必须与 accent 色相可区分 | 品牌是红色时 danger 不能也是红：把 danger 移向深绯红并并排验证可区分，否则破坏性操作和主操作变成同一个按钮 |
| A10 | status ramp 阶数少于 accent ramp | 多数只渲染背景/边框/实心填充/文字四个角色；只有产品真的全范围使用 status 组件才生成完整 ramp |
| A11 | 状态色绝不是状态变化的唯一信号，须配图标或文字 | 归属 better-accessibility |
| A12 | 审计既有色板五步流程 | 1) grep 全仓收集所有字面量（hex、`rgb(`、`hsl(`、`oklch(`、utility 类前缀），含 SVG fill/stroke、图表配置、邮件模板；2) 各色相族内按感知明度排序，近似色立刻浮出水面；3) 合并近重复——差距小于约一个 ramp 步的两色是同一色漂移，保留使用最多的那个，**不要取平均**；4) 给每个幸存者分配角色表中的角色，配不上角色的要么是缺失 token 要么是错误，在 finding 中说明是哪种；5) 清点剩余——每个角色多于一条 ramp 说明色板已长过其结构 |
| A13 | 先报告盘点再改任何东西 | 合并色板会改变没人要求动的屏幕渲染输出，用户接受前它只是提案 |

### B. 色板生成（palette-generation.md）

| # | 规则 | 具体数值/处方 |
|---|------|--------------|
| B1 | 品牌色放在实心填充阶 | Tailwind `500` / Radix `9`，使 `bg-brand-500` 渲染真实品牌色而非近似 |
| B2 | pin 还是 snap 二选一 | 合同固定 → pin：品牌色保持精确，ramp 向外建，接受该阶间距略不均；否则 snap：微调到 ramp 上使每阶均匀（几乎总是更好看，肉眼不可见） |
| B3 | 品牌色作为白字背景填充对比度失败时，仍是品牌色，只是不占实心填充阶 | 放到它实际落点，交互填充用更深阶；**不要悄悄加深品牌色** |
| B4 | 正确 ramp 的 6 条可检查属性 | 1) 阶在**感知明度**上均匀（HSL 明度不是感知的，均匀 HSL 会在一端堆积）；2) 色相端到端恒定（色相漂移 = 两色混合感，且无法与不同色相的 neutral 正确搭配）；3) vividness 中段最高、两端衰减（最亮最暗阶接近中性；全程满 vividness 会让 50 发光、950 像墨泼在品牌上）；4) 亮端阶更密（50–200 靠近、800–950 拉开，否则 50 和 100 无法区分为两个表面）；5) 相邻两阶必须可区分，否则阶数多于决策数，删一阶；6) 两端不到纯黑纯白（纯黑纯白不能携带色相，ramp 恰在页面背景所在处失去身份） |
| B5 | 用色彩库计算，不手算不目测 | `culori` / `colorjs.io` / `chroma.js`；读入项目格式的品牌色，在感知空间做数学，输出项目已有记法。示例：`interpolate(['#eff6ff','#3b82f6','#172554'], 'lab')` + `samples(11)`；ramp 插值空间不是可选项（sRGB 插值产生浑浊中间阶），输出格式才是项目的选择 |
| B6 | 多色相系统各 ramp 必须逐阶对齐 | 感知明度**绝对**匹配（同阶同亮度）；vividness **相对**匹配——各色相最大 vividness 不同，设为本色相可达范围的同一**比例**，直接抄饱和度数值会让某一色相显脏。黄和青是常见受害者（峰值远低于红蓝），照抄数值会让 warning 在 danger 旁显得弱 |
| B7 | 暗色模式不是亮色板机械反转；反转只是起点 | 先换 semantic 角色（`--color-bg: var(--brand-50)` ↔ `var(--brand-950)` 示例），再手工调三处：1) vividness 降一两阶（白底上自信的饱和色在近黑底上是霓虹）；2) 暗端拉开间距（亮态可区分的浅背景在暗态塌陷）；3) 每对前景/背景在两个 appearance 重测（对比度不对称，亮态通过的对子暗态可能失败） |
| B8 | 主题切换机制三选一且全程一致 | 无主题切换 → 仅 `prefers-color-scheme`；用户可覆盖系统 → `.dark` class（媒体查询只设初值）；`light-dark()` 代码最少但读 `color-scheme` 属性而非 class，class 切换必须同时设 `color-scheme`。混用机制是常见失败：用户覆盖系统偏好瞬间得到半主题界面 |
| B9 | `light-dark()` 用法 | `:root { color-scheme: light dark; --color-bg: light-dark(#ffffff, #172554); }` |

### C. Token 命名（token-naming.md）

| # | 规则 | 具体数值/处方 |
|---|------|--------------|
| C1 | 两层 token 架构 | Tier 1 primitives 按色相+阶命名值（`--blue-500`、`--neutral-200`），永不在组件中直接使用；Tier 2 semantics 按角色命名、指向 primitive（`--color-text-secondary`、`--color-border-subtle`），组件只引用此层 |
| C2 | 分层是主题化的接缝 | 暗色、白标、高对比变体全部只重指 semantic 层，primitives 和所有组件不动；直接在组件里用 `--blue-500` 的代码库没有主题接缝，后补意味着审计每个用法分辨"想要 accent"还是"只是想要蓝" |
| C3 | 第三层组件级 token（`--color-button-danger-bg`）仅在组件有意偏离系统时加 | 一个组件 token 是有文档的例外；二十个说明 semantic 层缺角色 |
| C4 | 角色清单——系统完整 = 每个角色都有 token，按清单建而非按组件需求追加 | Surfaces：page background / surface / raised（菜单、popover）/ sunken（输入框、well）/ overlay scrim；Text：primary / secondary / disabled / inverse / on-accent；Borders：subtle / default / strong / focus ring / separator；Accent：subtle background / border / solid / solid hover / text；Status（每个已发状态）：subtle background / border / solid / text |
| C5 | separator 和 border 是独立角色，即使今天同值 | separator 分隔内容，border 包围控件；首次重设输入框样式时就会分叉 |
| C6 | 命名语法唯一形状：`--color-{role}-{variant}-{state}` | 示例：`--color-bg-surface`、`--color-text-secondary`、`--color-border-strong`、`--color-accent-solid-hover` |
| C7 | 每个概念选一个词，只用该词 | 前景：`text`（禁用 fg/foreground/content/ink）；背景：`bg`（禁用 background/surface 作同义/fill）；边缘：`border`（禁用 stroke/outline/line）；品牌：`accent`（禁用 primary/brand/theme 混用） |
| C8 | `primary` 只保留一个含义 | `--color-text-primary`（正文）与 `--color-primary`（品牌色）共存是最常见命名冲突；用 `accent` 指品牌，`primary` = "同组中最突出者" |
| C9 | 六个命名反模式及替代 | `--color-blue-button`（语义层出现外观）→ `--color-accent-solid`；`--color-sidebar-gray`（按首次使用处命名）→ `--color-bg-surface`；`--color-light-gray`（暗态说谎）→ 用 primitive `--neutral-200`；`--color-text-2`（编号无语义）→ `--color-text-secondary`；`--color-gray-hover`（色相混状态、不属任何层）→ `--color-bg-surface-hover`；组件中直接用 `--blue-500` → semantic token 指向它 |
| C10 | 底层规则：永不因"值今天恰好对"借用 token | 角色没 token 就加 token；拿 `--color-border` 当文字色，边框变浅那天文字跟着变浅 |
| C11 | Tailwind v4 项目在 `@theme` 块同声明 primitives 和 semantics | `--color-*` 命名空间产出 `bg-*`/`text-*`/`border-*` 工具类；产出 `bg-accent-solid` 与 `bg-brand-500` 两者都可达，纪律是约定而非约束——模板用 semantic 工具类，组件里出现裸 `bg-brand-500` 是 review 要标记的东西 |
| C12 | 透明度修饰符两层都可用（`bg-accent-solid/50`），但带 alpha 的颜色无法对静态背景做对比度检查 | 任何承托文字的颜色用实心 token |

### D. 色彩使用（color-usage.md）

| # | 规则 | 具体数值/处方 |
|---|------|--------------|
| D1 | 一色一义：同一颜色全界面只表一个用途 | 色相 **15°** 以内视为同色（用户不会把近似色相感知为不同颜色）；规则双向：accent=可交互时，中性色渲染的可交互元素同样是误导 |
| D2 | 颜色绝不是意义的唯一载体 | 配图标/标签/形状；归属 better-accessibility |
| D3 | semantic token 只在其角色内使用 | 反例：`.caption { color: var(--color-border); }`、`.tag { background: var(--color-text-secondary); }`；缺角色加 token，永不按值借用 |
| D4 | 每个视图恰好一个填充色主操作 | 填充色编码主要强调时，当前决策上下文中一个主操作获得该处理，同级操作保持中性；多个彩色背景在编码不同状态/类别（而非同级竞争）时可以；已建立其他强调层级的组件体系不要为它强行改色 |
| D5 | 颜色放背景而非标签 | 填充按钮隔屋子可读作主操作，中性按钮上的 accent 色文字读起来像链接；选中态（active tab、checked segment）可在 glyph 和标签上用 accent——那是状态不是强调 |
| D6 | 渐变插值空间是"观感"不是正确性设置 | `in oklab` = 最佳默认（亮度均匀、无色相意外）；`in oklch` = 绕色轮走、全程饱和、会扫过两端之间的所有色相（蓝→粉经过紫，可能是想要的效果也可能是意外）；sRGB 默认 = 经典、中点变暗变浊 |
| D7 | 灰色死区是矩形空间问题，两个修复 | 色轮对面的两色相直线插值穿过中性轴、中段死灰；修复 1) 换极坐标空间（绕过轴），或 2) 在两者之间加第三个中间色相 stop、保留原空间 |
| D8 | 极坐标空间可控制绕行方向 | `in oklch shorter hue`（短路径，通常是想要的）/ `in oklch longer hue`（扫过大部分光谱） |
| D9 | 大面积渐变会出色带 | hero 区低对比渐变在 8-bit 屏上可见阶梯；修复：加宽 stop 间对比 / 缩小面积 / 叠加细噪声纹理 |
| D10 | 尽量不让文字压在渐变上 | 对比度沿渐变连续变化，单次测量不能描述它；必须压时对**最差区域**测量，或加 scrim |
| D11 | 承重颜色须验证目标 locale 的文化含义 | 红：西方=危险/亏损，中国金融 UI=**涨**/吉利；绿：西方=成功/涨，中国金融 UI=跌；白：西方=纯洁，东亚部分地区=丧；金：西方=高端，部分地区=宗教意义。经典案例：股票涨跌英文 locale 绿涨、中文 locale 红涨；本地化到这类市场时涨跌用 per-locale token 而非硬编码 |
| D12 | 每个自定义颜色需亮+暗两个变体；increased contrast 变体再加 | 高对比变体把前景/背景感知明度差拉宽**至少 15 点**，然后按 APCA 偏好阈值复验（正文 Lc 90、非正文 Lc 75）；只拉宽不复测 ≠ 修复 |

### E. 对比度（contrast.md）

| # | 规则 | 具体数值/处方 |
|---|------|--------------|
| E1 | 永远对**实际渲染的背景**测前景 | 找最近的绘制背景的祖先；元素在卡片上却对页面背景测 = 错误答案 |
| E2 | 报告，不重绘 | 失败时报告：失败的前景/背景对、实测值、未达阈值；不动颜色。项目颜色是设计决策，仅用户要求时才修，修后复测 |
| E3 | APCA 阈值（推荐，设计决策默认） | 正文（栏/块文本）：最低 Lc 75，偏好 Lc 90；非正文（标签、标题）：最低 Lc 60，偏好 Lc 75；大文本（≥36px）：最低 Lc 45，偏好 Lc 60；UI 组件：最低 Lc 30；disabled/placeholder 最低也是 Lc 30；非文本元素可辨识的绝对地板 Lc 15。Lc 带符号（正=深字浅底，负=浅字深底），取绝对值比阈值 |
| E4 | WCAG 2 阈值（法律合规用） | 普通文本（<24px / <18.5px bold）：AA 4.5:1、AAA 7:1；大文本（≥24px / ≥18.5px bold）：AA 3:1、AAA 4.5:1；UI 组件与图形对象：3:1。18pt≈24px、14pt bold≈18.5px。须声明 WCAG 符合性时 WCAG 是门槛，APCA 是其上一切的 tiebreaker |
| E5 | 修失败对子：先动明度 | 明度是对比度实际响应的通道；改色相/饱和度对测量值影响小，改色相修对比基本是白费。保持色相饱和度，把前景在感知明度上拉离背景，然后复测（示例：`#7d93b0` on `#eef2f7` Lc≈50 → `#2b3a4f` on 同底 Lc≈90） |
| E6 | 修复的两个约束 | 1) 中明度背景封顶可达对比度：约 75% 感知明度背景上纯黑字也只有约 Lc 60——正文需要接近某一极端的背景，背景在中段就改背景；2) 推明度可能把颜色推出 gamut——按需降饱和度保持可渲染 |
| E7 | 改完必复测，不假设修复生效 | — |
| E8 | 快速近似（仅首筛，报告前必须实测） | 目标 |Lc|≥75 的正文：浅底（>~90% 感知明度）前景 <~35%；深底（<~25%）前景 >~90%。差距不对称因 APCA 感知极性，镜像对子得分不同——这也是亮态通过的对子暗态可能失败的原因 |
| E9 | 浅字还是深字的分界 | 交叉点约 **73% 感知明度**：以上用深字，等于/以下浅字得分更高；60–73% 区间背景看着已经浅，但白字仍显著优于黑字 |
| E10 | 检查清单 | 每对前景/背景 × 每个 appearance；半透明表面（backdrop-filter 头/overlay）对其上可滚过的最亮最暗内容测，或让表面足够不透明；计算色（`color-mix()`、相对颜色语法、透明度修饰符）测渲染结果而非声明；图上文字无单一背景色——测最差区域或用 scrim 保证一个 |

### F. 颜色格式（color-formats.md）

| # | 规则 | 具体数值/处方 |
|---|------|--------------|
| F1 | 记法选择匹配项目已有 | 一致的 hex 系统好过 hex 里撒几个 `oklch()`；为修一个颜色引入第二种记法让色板更难推理。记法不是缺陷 |
| F2 | 真正的新系统默认 `oklch()` | 唯一数值行为符合 ramp 规则的记法（均匀明度阶保持均匀、固定色相保持固定）；Baseline 2023，很老的浏览器矩阵需 fallback。语法 `oklch(L C H)`：L 0–1、C 0–~0.4、H 0–360；alpha 用斜杠不用逗号 |
| F3 | 各记法弱点 | hex：不透明、手工不可读不可调；`rgb()`：通道不对应设计师思维；`hsl()`：明度非感知、色相漂移，按明度建 ramp 会一端堆积且色相偏移 |
| F4 | 转换时机：用户要求/约定的迁移在范围内/项目正标准化某记法而这个值是掉队者 | 不因本技能加载而转换孤立值 |
| F5 | 转换时只改值 | 不动 CSS 关键字（`currentColor`/`inherit`/`transparent`/`initial`/`unset`）；不动渐变函数（只转 stop，不动插值方式）；不动第三方配置中要求特定格式的颜色；保留注释和格式 |
| F6 | 批量转换是迁移不是清理 | 每个渲染色变化一个舍入边距、触碰没人要求的文件，必须本身就是任务而非副作用 |
| F7 | gamut：sRGB 色全在 P3 内，反之不然 | P3 多约 50% 颜色，只对最饱和值有差（60% 最大 vividness 的色在两种显示上看起来一样）；超 gamut 被裁剪且裁剪不优雅——邻近阶塌成同一渲染色，ramp 顶部在 sRGB 屏上可能整体失去区分；最大可达 vividness 随色相和明度变化（青色峰值远低于红紫），裁剪发生在部分阶 |
| F8 | 修复：保持色相明度、降 vividness；按 sRGB 生成 ramp，P3 作增强层 | `.accent { background: #3b82f6; } @media (color-gamut: p3) { .accent { background: oklch(0.62 0.24 259); } }`；**顺序重要**：sRGB 在前让每个显示都有东西，P3 规则只在真实渲染处覆盖。无 fallback 的 P3 色是 `HIGH` finding——不降级，直接失败 |
| F9 | 老浏览器矩阵用 `@supports` 同样分层 | `@supports (color: oklch(0 0 0))`；先查项目实际浏览器矩阵，现代基线上这是死重 |
| F10 | 现代 CSS 三件套 | `color-mix(in oklab, var(--color-accent-solid) 15%, white)` 派生状态色——派生值不进 token 层（混色在设计工具中不可检视）；相对颜色语法 `oklch(from var(--color-accent-solid) calc(l - 0.1) c h)` 调单通道——链三层派生的 token 不可读；`light-dark()` 一声明双 appearance。三者渲染时计算，输出无法静态对比度检查，测渲染结果 |

### G. Review 输出格式（review-output.md）

| # | 规则 | 具体数值/处方 |
|---|------|--------------|
| G1 | 独立色彩 review 两段式输出；better-interface 编排时格式/严重度/合并/上限/verdict 归它 | — |
| G2 | findings 按原则分组，用五列 markdown 表 | 列：Severity / Location / Before / After / Why；**禁止** 用独立 "Before:"/"After:" 行 |
| G3 | Severity 定义 | `HIGH` = 内容不可读或语义色误导；`MEDIUM` = 可察觉的主题/token/gamut 失败；`LOW` = 孤立的打磨项 |
| G4 | Location 引用 `path/to/file:line`；无源文件时引用确切屏幕和组件 | — |
| G5 | Before/After 给当前值/token 和确切替换；失败对比对的替换是建议——报告它，不擅自应用 | — |
| G6 | Why 命名被违反的原则，相关时附实测对比度/gamut/阶证据 | — |
| G7 | 重复的系统性问题合并为一行，列出所有受影响位置；无 findings 的原则省略 | — |
| G8 | findings 之后两段收尾 | 1) Verification：列出运行的确切检查及观察结果（对渲染背景的对比度测量、gamut 检查、亮暗两个 appearance）；没跑的检查说明待验证什么；2) Verdict：残留任何 `HIGH` → `Block`；只剩 `MEDIUM`/`LOW` → `Needs changes`；无可执行 findings → `Approve` |
| G9 | 无 findings 时省略表格 | 声明 "No actionable color findings"，报告 verification，`Approve` 收尾 |

### H. SKILL.md 核心原则（与上面 references 互补的表述）

| # | 规则 |
|---|------|
| H1 | 匹配项目既有色彩系统：复用既有 token 和记法（原则 1） |
| H2 | 系统是 ramp 不是颜色：一 neutral、一 accent、只发实际渲染的 status（原则 2） |
| H3 | 每阶有岗（原则 3） |
| H4 | primitives 按色相命名、semantics 按角色命名，组件只引用 semantic 层（原则 4） |
| H5 | token 只在其角色内使用；缺角色加 token（原则 5） |
| H6 | ramp 跨阶保持色相；感知明度均匀、vividness 中段峰值、亮端更密、两端不到纯黑白；用色彩库（原则 6） |
| H7 | 一色一义，15° 色相近似视同色（原则 7） |
| H8 | 每视图恰好一个填充色动作（原则 8） |
| H9 | 测渲染对子再报告；失败只报告不改色，用户要求才改且改后复测（原则 9） |
| H10 | 渐变选定插值空间：oklab 默认、oklch 极坐标、sRGB 经典（原则 10） |
| H11 | 常见错误表 18 条（SKILL.md L67–85），与上表 A–G 各条对应，关键增量：status 色相与 accent 相撞→移到并排可区分；`prefers-color-scheme` 设一部分 token、`.dark` class 设另一部分→选一种机制贯穿 |

**规则条数合计：约 78 条**（A13+B9+C12+D12+E10+F10+G9+H11，去重后独立可执行规则 ≥70）。

## ③ 对工程质量四维度的支撑点

### 统一性（token 体系）——本技能的最强项
- **双层 token 架构（C1/C2）是统一性的骨架**：primitive（`--blue-500`）→ semantic（`--color-accent-solid`）→ 组件，组件永不越层。这一条直接把"全项目颜色一致"从约定变成结构。
- **命名语法唯一形状 `--color-{role}-{variant}-{state}`（C6）+ 概念词汇表锁定（C7/C8）**：消除 `--color-primary` vs `--color-text-primary` 这类最普遍的命名冲突。
- **角色清单（C4）是"系统完整性"的可检查定义**：Surfaces/Text/Borders/Accent/Status 五组角色，可按清单机械审计。
- **角色↔阶映射表（A3）同时给 Tailwind 和 Radix 两套编号**，workflowhub 目标栈可直接引用。
- **一色一义 + 15° 规则（D1）**、**每视图一个填充色主操作（D4）** 把"视觉语言统一"落成可判定规则。

### 组件化
- 组件只引用 semantic token（C1），第三层组件 token 仅在有意偏离时加（C3）——组件样式与主题解耦。
- 暗色/高对比变体只重指 semantic 层、组件 CSS 不动（B7/C2），组件天然多主题。
- Tailwind v4 `@theme` 集成（C11）让统一性纪律直接编译进 utility 层。

### 可维护性
- "无角色的阶不生成"（A3）、"status ramp 只发真实渲染的"（A1）从生成侧抑制 token 膨胀。
- 审计五步法（A12）+ "近重复合并不取平均"（A12-3）是存量代码库收敛色板的可执行流程。
- 命名反模式表（C9）给每个坏味道配确切替代，review 可机械执行。
- "转换只改值"（F5）、"批量转换是迁移"（F6）防止颜色重构污染无关 diff。

### 性能
- 支撑较弱但存在：避免生成无人消费的 ramp 阶减少 CSS 变量总量（A1/A3）；`@supports`/`@media (color-gamut: p3)` 分层按需加载（F8/F9），现代基线上不加死重（F9）。
- 大面积渐变色带的处方（D9）隐含 GPU/位深渲染考量。

## ④ 与 workflowhub 的精确集成点

ui-project-init（`skills/ui-project-init/SKILL.md`）规定：**Design.md 是唯一视觉/组件规范**，承载"设计原则、token、布局/响应式、组件 API、视觉状态、视觉 a11y、性能预算和治理规则"；**Experience.md 不写颜色/字体/间距/断点/token**。

better-colors 的并入点 = Design.md 模板的 **token 章节 + 设计原则章节 + 视觉 a11y 章节**：

1. **Design.md「色彩 token」章节**：直接嵌入双层 token 架构（C1）、命名语法（C6/C7/C8）、角色清单表（C4）、角色↔阶映射表（A3）。这是模板级内容——新项目填空品牌色后即得完整 token 骨架。
2. **Design.md「设计原则」章节**：一色一义（D1）、每视图一个填充色主操作（D4/D5）、token 不借值（C10）三条作为原则陈述。
3. **Design.md「视觉 a11y」章节**：对比度阈值表（E3 APCA / E4 WCAG，注明归属判定归 better-accessibility）、"测渲染背景"（E1）、双 appearance 复测（B7-3/E10）。
4. **Design.md「主题/暗色」章节**：切换机制三选一（B8）、暗色派生三处手调（B7）。
5. **色板生成程序（B4/B5/B6）**：属于"执行时配方"而非"项目规范"——品牌色→ramp 的计算流程应进 ui-project-init 技能的 references（或 build-code 阶段技能），不写进每个项目的 Design.md 正文，但 Design.md 可引用其结果（生成的阶值）。
6. **审计五步法（A12）**：对应 ui-project-init 的 `legacy` 模式只读盘点（`legacy_inventory` 的 `css_side_effects`/`component_candidates` 扩展项）。
7. **review 输出格式（G1–G9）**：不归 ui-project-init；归 review/wh-review/frontend-component-quality 类技能。

## ⑤ 移植风险

1. **双重归属边界**：contrast 的"何时要求/是否必须过"被明确划给 better-accessibility，surfaces/shadows/icon 颜色划给 better-ui。移植时若只并入 better-colors 而不并后两者，Design.md 会出现"引用了不存在的归属方"的悬空指针——需要要么同步规划，要么把归属声明改写为 workflowhub 内部技能名。
2. **APCA 无法律地位**：E4 明确 WCAG 才是合规门槛；若 workflowhub 的 Design.md 模板把 APCA 写成唯一阈值，合规项目会埋雷。模板必须双阈值并列。
3. **数值处方的栈耦合**：A3 映射表分 Tailwind/Radix 两套、C11 是 Tailwind v4 专属；workflowhub 若目标栈不限于 Tailwind，模板需把该表标为"按项目栈二选一"。
4. ** Radix 优先倾向（A4）与既有项目冲突**：规则自身说"匹配项目已有"，但新系统建议 Radix——legacy 模式下不能直接套。
5. **文化含义表（D11）是内容型知识**，并入 Design.md 模板会增加模板体积；更适合进 references。
6. **"报告不改色"纪律（E2）与 workflowhub 的 build-code 自动修复流程可能冲突**：需要在集成时明确 build-code 何时被授权改色（用户确认后）。
7. 色板生成依赖 `culori` 等 JS 库（B5）——workflowhub 技能层若要求零依赖，需把库调用降为"建议工具"而非硬依赖。

## ⑥ 验证或推翻之前结论

**之前结论**：better-colors 是"原则提炼进 Design.md 模板"②类，并入 ui-project-init。

**结论：基本验证，但需要修正为"②类为主 + 两块内容应分流"**：

1. **验证的部分**：双层 token 架构、命名语法、角色清单、阶映射、一色一义、对比度阈值表——全部是声明式规范，正是 Design.md 模板章节该承载的"项目级不变式"，②类判断正确。统一性维度支撑极强，是三个 P0 中 token 体系最完整的一个。

2. **需要分流的内容（不宜全塞进 Design.md 模板）**：
   - **色板生成程序（B1–B6，pin/snap、感知明度插值、多色相 vividness 相对匹配、暗色三处手调）**：这是"一次性执行配方"，每个项目只在 init/换品牌色时跑一次。写进 Design.md 正文会让规范混入过程性知识。→ 应进 **ui-project-init 的 references 文件**（如 `references/color-palette-recipe.md`），Design.md 只保留产出的阶值和"两端不到纯黑白"等可检查属性。
   - **review 输出格式（G1–G9）+ 审计五步法（A12）**：前者归 review 类技能（wh-review/frontend-component-quality），后者归 legacy 盘点流程。→ 不进 Design.md，进对应技能的 references。
   - **文化含义表（D11）**：内容型参考知识，进 references 而非模板。

3. **是否需要独立成技能**：不需要。better-colors 没有需要"运行时独立调用"的机制（无脚本、无状态机），其价值全部可被"Design.md 模板章节 + ui-project-init references + review 技能 references"三方吸收。唯一例外场景：若未来要做"存量项目色板审计"作为独立命令，A12+G 格式可抽为 `palette-audit` 微技能——当前无此消费者，按宪法"无当前消费者不新增控制面"，**不建**。

# 调研 3：Website-skills 仓库 P0/P1 技能研究（子代理分批精读）

> 仓库：https://github.com/vaferkhanom/Website-skills（124 skills，来源 Vercel / Emil Kowalski / Jakub Krehel / Meng To 等，MIT）
> 调研方式：6+ 个子代理分批精读 P0 全部 + 精选 P1，逐个回答「做什么/核心规则/复现场景帮助/与 workflowhub 关系/迁移难度」。

## 0. 仓库总体结构

- 124 个技能，按 P0（核心必载）/P1（触达即载）/P2（按需）分级；README 强调「按任务需求只加载 P0，绝不一次全载」。
- 领域分组：Design & Review / React-Next / Animation / 3D-WebGL / Effects / Themes-Layouts / Tailwind-Tooling / Niche。
- 单技能一个文件夹（SKILL.md + 可选 rules/ references/），`.skills-manifest.json`。

## 1. 已完成的技能研究结论表

| 技能 | 分级 | 做什么 | 对「100% 复现设计稿」帮助 | 与 workflowhub 关系 | 迁移 |
|---|---|---|---|---|---|
| web-design-guidelines | P0 | Vercel 100+ 工程规则审查（禁 transition:all、img 宽高、URL 反映状态、虚拟化、tabular-nums、14 反模式） | 无直接（不比对设计稿），实现质量兜底 | 与 frontend-component-quality 重叠，可作其规则源 | 低（建议固化快照非运行时拉外网） |
| impeccable | P0 | 设计指挥技能 25 子命令；精华 craft-floor 清单 + **有界验证法**（完整 build→一轮批量截图→一批修完→至多再一轮→停）+ 硬指标（对比度 ≥4.5:1、正文 65-75ch、tracking≥-0.04em、圆角 12-16px、浏览器表面主题化） | 方向相反（鼓励替换视觉世界），但"Refinement preserves"、有界验证、craft-floor 可借用 | 互补不可替代；强宿主绑定与宪法冲突 | 高（建议只抽 craft-floor+有界验证法） |
| better-ui | P0 | 16 条带精确数值细节处方：同心圆角 outer=inner+padding、光学>几何对齐、阴影/elevation 分工、按压 scale(0.96)、图片描边纯黑/白 10%、will-change 只给 transform/opacity、图标描边配字重 | **局部直接**：同心圆角/阴影分工/光学对齐正是"复现后感觉不像"高频根因；审查法（10% 速度回放+遍历各态）可并入 QA | 互补：规则知识库注入 component-quality/isolo-browser-qa | 低（纯 MD 无依赖，最高性价比之一） |
| better-accessibility | P0 | a11y 14 原则+13 错误对照：原生元素优先、:focus-visible ≥2px、键盘全覆盖、模态焦点陷阱、命中区 24×24/44×44、表单真 label、live region、200% 缩放存活 | 间接：复现时最易破坏焦点环/命中区/语义 | 互补：专项深度规则库→component-quality 子模块或 browser-qa 判定规则源 | 中（6+ 子文件+跨引用需解耦） |
| interface-review | P1 | diff/PR 级界面变更审查：范围解析（merge-base 优先）、读删除侧、三态分类（Introduced/Regression/Pre-existing）、对照声明意图、只读工作树 | 无直接；"对照声明意图"→可用作复现验收（对照设计稿声明的状态覆盖） | **填补空白**：现有六技能无 diff 级界面审查 | 中高（依赖 better-interface 与 better-* 家族） |
| design-first-ui-prompting | P1 | 生成式 UI 提示词九段模板（GOAL/FORMAT/LAYOUT/TYPE/COLOR/COPY/CONSTRAINTS/NEGATIVE）+ 单变量迭代 | 几乎无（面向"从想法生成新 UI"）；but 结构化 spec 骨架可参考 | 基本无关，未来接生成式 UI 才补位 | 低（单文件） |
| vercel-react-best-practices | P0 | Vercel 官方 70 条规则 8 大类（Waterfalls 6/Bundle 6/Server 10/Client 4/Re-render 15/Rendering 11/JS 14/Advanced 4），rules/ 含 impact 等级+正误对照 | 中高（性能/渲染维度，数据密集直接命中 content-visibility/rerender 15 条）；深色/复现零覆盖 | 与 frontend-component-quality 最深（性能维度进质量地图） | 易（本机已有完整副本；建议弃 108KB 全量版，按 HIGH+ 子集+登记 catalog.yaml；风险=React 栈绑定） |
| vercel-composition-patterns | P0 | 8 条组件组合模式（避免布尔 prop 爆炸、复合组件、context、React19 use()） | 中低（组件 API 成形） | 与 component-quality 互补 | 极易（13 文件） |
| web-component-design | P1 | 三框架混合组件 API 规范，偏浅 | 低 | 与 component-quality 重叠但更浅 | 容易但价值存疑（建议裁剪） |
| animate | P0 | 从零建动画：**频率门槛**（100+/天→永不动画）、目的不明不写、工具由廉到贵（CSS→@starting-style→WAAPI→Motion）、只动 transform/opacity（禁 scale(0) 用 0.9-0.97+opacity:0）、缓动/时长表（UI<300ms）、reduced-motion+pointer 门控、扩展既有 token 不建平行体系 | 高：**稿无动效→阻止擅自加动画（保复现）**；稿有动效→精确实现 | 互补：补 motion 空白域"写"能力 | 低-中（1-2 天，裁 pick-ui-library 引用） |
| animation-vocabulary | P0 | 模糊描述→精确术语（12 类 70 词） | 低-中 | 互补但边际低 | 极低（建议并入 animate） |
| review-animations | P1 | 动效 diff 高门槛评审（默认 flag），10 条不可协商标准+硬性升级触发器（transition:all/scale(0)/ease-in/>300ms/错 origin/缺 reduced-motion） | 中高：**"稿没动效不加、有动效按参数审"** | 互补：现成动画专项独立审查人（契合宪法"独立来源裁决"） | 低-中（迁 STANDARDS.md，1-2 天） |
| improve-animations | P1 | 全仓动画审计（只读）→杠杆排序计划→可下放廉价模型执行；8 类并行 fan-out+亲自复核 | 中 | 互补；与方法论同构（只读+自包含计划+独立审查） | 中（2-3 天） |
| find-animation-opportunities | P1 | 找"该动没动"默认拒绝 | 低 | 与 improve 的"错失机会"重叠 | 低（可延后/并入） |
| better-colors | P0 | 颜色系统：ramp 非单色、primitive/semantic 双层命名（--blue-500 永不进组件）、一色一义、暗色=浅色反转降鲜明度、oklab 渐变、P3 | **高**：暗色生成/复测、语义分层、P3 是深色数据密集刚需；"未要求不改色"与复现一致 | 互补：产"Design.md 该写什么规则"；自带 review-output 只能当规则源不得新增 gate | 中高（只提炼原则则低） |
| better-typography | P0 | 排版：woff2、属性优先（font-weight:650）、tabular-nums 防抖动、行高 1.1/1.5-1.6、行长 60-75ch、**iOS 输入 <16px 整页缩放**、14px UI/13px 说明 | **高**：tabular-nums 服务指标复现；16px iOS 缩放与 from-font 下划线是"照稿抄却跑偏"隐性根源 | 互补：规则进 Design.md | 中高（19 原则+6 子文档，框架无关） |
| better-layout | P1 | 布局：空白分组（组内 8px/组间 ≥16px 2 倍）、逻辑属性、渐进披露、container queries | 中高：间距倍率/safe-area/逻辑属性对逐像素+多视口有用（但以设计稿 token 为准） | 互补：responsive/hit-area 挂 frontend-testing 清单 | 低-中 |
| beautiful-shadows | P1 | 3 个 Tailwind 黑投影 arbitrary 类（sm/md/lg） | **低**：全黑投影深色表面近不可见；arbitrary 值与 token 纪律冲突 | 部分冲突 | 极易但价值低 |
| gradient | P1 | **实际是设计系统文档写作模板**（亮色品牌参数） | 低 | 非替代非互补；唯一借"规则锚定 token/阈值"守则 | 极易但基本不值得 |
| iterate-until-verified | P2 | **纯方法论，零技术依赖，最值得迁**：①锁原任务契约（outcome/受众/输入/约束/DoD）②把 perfect/best 等**主观词转成验收矩阵**（Gate｜验证方法｜二值通过条件｜证据），拒打分制③分解最小 workstream，worker 必须返 artifact/evidence 而非 confidence④**制造与评判分离**：verifier 拿契约+矩阵+候选+基准，扣住实现者自评与理由，找失败优先⑤证据匹配：视觉=渲染输出+交互+a11y+与参考并排对比⑥循环=最小修订→重跑失败 gate→只集成已验证⑦诚实停止：全 gate 过或 blocked 点名 blocker+最小下一步，**不许弱化 gate 换成功** | **间接高（可操作化宪法"独立裁决"）**：主观词→可观察二元条件防空转；失败按证据路由到责任 workstream；显式防 churn（同方法反复失败→换方法或报 blocker） | **直接落位 verify**：验收矩阵/checklist 模板、证据回执由 isolated-browser-qa 截图填满、评判归 reviewer | **半天（纯方法论）** |
| tailwind-design-system | P1 | token 三层层级（Brand→Semantic→Component，oklch→--color-primary→bg-primary）+ 语义色命名对（primary/secondary/muted/accent/...各配 *-foreground）+ dark mode 同名 token 不同值域（.dark 只覆盖 CSS 变量）+ 组件架构 Base→Variants→Sizes→States→Overrides | 中：**抽范式**（token 分层/语义对/dark 覆盖）直接成为 Design.md token 章节模板；主体是 Tailwind v4/React/CVA/Radix 实现代码不宜整体迁 | 互补：Design.md/Design token 规范来源 | 中（只抽范式则低；注意 v4 版本锚点） |
| landing-page | P1 | 单 offer 落地页方法论（one offer→one audience→one primary action）：动工前 4 组问；三段结构（折叠区 headline+单主 CTA+p roof→收益/how/社会证明→FAQ 6-12/风险反转/final CTA）；布局 4 型；benefit-first 带具体数字；fixed 交付格式（outline/hero copy/benefits/FAQ/SEO-AEO/布局推荐）；分段迭代不整页重建 | 低-中（与产品 UI 复现无关，补**内容/转化结构层**；其要素 checklist 可作视觉验收辅助 lens） | 互补：build-spec 阶段作为页面需求引进（注意与 intake 流程去重） | 低-中（半天，MIT 直接搬） |

## 2. 关键横向结论（已回结果汇总）

1. **没有任何一个技能解决"像素级复现"的核心缺口**（设计解析+视觉比对）——那是 workflowhub design-source-readiness / frontend-prototype-render / isolated-browser-qa 该干的活。Website-skills 的定位是**规则弹药库 + 实现纪律 + 专项审查人**，全是"互补/增强"，零替代。
2. **最高性价比迁移排序**：better-ui（低难度高价值）> web-design-guidelines（低难度，需固化快照）> better-colors/better-typography/better-layout（提炼原则进 Design.md，不整族 vendor）> vercel-react-best-practices（按 HIGH+ 子集）> interface-review（补空白但依赖重）> animate+review-animations（motion 空白域）> impeccable（只抽 craft-floor+有界验证）> 其余 P2 按需。
3. **审查纪律启示**：review-animations 的"默认 flag、批准需争取"、interface-review 的"无变更宁可问也不编造"——与 workflowhub"不伪造通过/unknown 诚实"哲学同构。
4. **流程启示**：impeccable 的"有界验证法"（一轮批量截图→一批修完→至多再一轮→停）与 yureki 的"感知回路+stale guard"互补；kaelig 的"迭代预算/收益递减 2% 停/禁回归"是最完整的收敛机制。**iterate-until-verified 给出的是"验收矩阵+制造/评判分离"模板——与 workflowhub 宪法"质量裁决须独立来源独立上下文、禁止自审自判"直接同构，建议作为 verify 阶段编排方法首批引入**。
5. **迁移注意**：better-* 自带 review-output.md 与 workflowhub 评审阶段重叠——接入必须声明"规则源非证据源"；多个技能引用姊妹技能（better-interface/better-ui/better-writing）与子文档（palette-structure 等），需裁剪或补全；animation-vocabulary 并入 animate；web-component-design 建议裁剪或归档；tailwind-design-system 只抽 token 范式（Brand→Semantic→Component、*-foreground 语义对、.dark 覆盖同名 token）进 Design.md 模板，不迁实现代码。
6. **迁移优先级总排序（全部调研汇总后）**：① iterate-until-verified（方法论，半天，直接用于 verify 编排）② better-ui（数值处方弹药）③ web-design-guidelines（固化快照）④ better-colors/typography/layout（提炼原则进 Design.md）⑤ ui 视觉三步曲（animate+review-animations+improve-animations，motion 空白域）⑥ vercel-react-best-practices（HIGH+ 子集，栈决策后）⑦ interface-review（补 diff 级审查，依赖较重）⑧ landing-page（内容层，MIT 直接搬）⑨ impeccable（只抽 craft-floor+有界验证）⑩ 其余 P2 按需/不引入（beautiful-shadows、gradient、web-component-design、animation-vocabulary、find-animation-opportunities、营销页模板族）。
7. **对"100% 复现"的最终判断**：Website-skills 全部 124 个技能中**没有一个**解决"设计稿解析+视觉比对"这个复现核心——它们解决"实现是否守纪律、是否符合规范、是否专业"；复现核心必须由 workflowhub 自己的 design-extractor + parity-checklist + visual-fidelity 闭环承担，Website-skills 是注入其中的规则弹药。**替代关系：零；增强关系：全部。**

---

## 3. 全量分类表（124 个技能，四组子代理全部精读/核查完毕）

> 分类口径：① 复制为独立技能（登记 catalog.yaml 固定 commit）｜② 概念并入现有技能（指名宿主）｜③ 辅助参考（references/ 按需加载，登记固定 commit）｜④ 不引入。
> 注意：镜像仓 4 个文件夹实际不存在（emil-design-eng 已改从上游 emilkowalski/skill 深读；apple-design、css-animations、vercel-react-native-skills 无法深读，判 ④）。

### ① 复制为独立技能（7 个 + 1 个 ADR 0016 既定 = 8 条 skills/external/ 登记）

> 计数口径：①③④按技能数且互斥；②按技能数（一个概念行可能含多技能）；vercel-react-best-practices 按 ADR 0016 从官方仓 `vercel-labs/agent-skills@dd089a8c` 完整放入（不来自 Website-skills 镜像，不计入 124 镜像数）；beam-glow-states 原则部分并入②、配方部分作③参考引用，技能计数只入②。**①7 + ②24 + ③24 + ④69 = 124 ✓**

| 技能 | 理由 |
|---|---|
| web-design-guidelines | Vercel 100+ 工程规则；固化快照入库（不运行时拉外网） |
| better-ui | 16 条数值处方，自含零依赖；"复现后感觉不像"的高频根因解药 |
| animate | Emil Kowalski 动效实现决策链，自含；补 motion"写"能力空白 |
| review-animations | 动效独立审查人（默认 flag、批准需争取），契合宪法独立裁决 |
| iterate-until-verified | 验收矩阵+制造/评判分离方法论，verify 编排模板，纯方法论零依赖 |
| landing-page | 单 offer 落地页方法论，补内容/转化结构层，MIT 直接可搬 |
| vercel-react-view-transitions | Vercel 官方应用内过渡指南，自含 references，合后台导航质感（React 栈前提已确认） |
| ~~dark-glass-clean-layout / framed-tech-dark-border-gradient / glass-dark-ui~~ | Round 2 B2 用户已决：**进 ③ references 按需加载**（作 original-design 暗色工作台起步模板，不做常驻技能，避免皮肤 token 覆盖项目 Design.md） |

### ② 概念并入现有技能（23 概念行 / 24 个技能，指名宿主）

| 来源 | 吸收什么 | 并入宿主 |
|---|---|---|
| impeccable | craft-floor 清单 + 有界验证法（批量截图一轮→一批修完→至多再一轮→停） | ui-visual-fidelity（收敛规则） |
| better-accessibility | 14 原则+13 错误对照（焦点环/命中区/键盘/live region/缩放存活） | frontend-component-quality + frontend-testing |
| interface-review | 对照声明意图、读删除侧、Introduced/Regression/Pre-existing 三态分类 | wh-review / verify-change |
| design-first-ui-prompting | 九段结构化 spec 骨架（GOAL/LAYOUT/TYPE/COLOR/CONSTRAINTS/NEGATIVE） | ui-project-init（original-design 模式） |
| vercel-composition-patterns | 8 条组件组合模式 | frontend-component-quality |
| animation-vocabulary | 12 类 70 术语词表 | animate（并入，不独立） |
| emil-design-eng | 频率决策表/easing/<300ms/Before-After 审查清单（登记上游 emilkowalski/skill 固定 commit） | frontend-component-quality / animate |
| animation-systems | Stripe/Linear 式产品级动效原则 | frontend-component-quality |
| better-colors | ramp 非单色、primitive/semantic 双层命名、暗色=浅色反转降鲜明度、oklab、P3 | ui-project-init（Design.md 模板） |
| better-typography | tabular-nums、行高/行长/字距数值、iOS 16px、截断规范 | ui-project-init（Design.md 模板） |
| better-layout | 空白分组 2 倍节奏、逻辑属性、safe-area、container queries | ui-project-init + frontend-testing 清单 |
| tailwind-design-system | token 三层（Brand→Semantic→Component）、*-foreground 语义对、.dark 覆盖同名 token | ui-project-init（Design.md token 章节模板） |
| tailwindcss | 动态类名/content 路径工程陷阱清单 | ui-project-init |
| better-interface | severity 标尺、合并 findings 表、considered-but-rejected | frontend-component-quality / wh-review |
| better-writing | UX 微文案（按钮动词优先/错误即指令/空态指路） | frontend-component-quality + ui-project-init |
| 主题组共性 | **设计方向 spec 六段式**（Scope/Visual target/Implementation/Patterns/Base Tokens/Guardrails） | ui-project-init（original-design 设计方向模板） |
| webgl-landing-steering | 意图→车道→预算（单主效果+性能预算） | frontend-prototype-render |
| add-shader-cursor-trail | **能力门控链**（渲染能力/指针/reduced-motion/可见性依次检查，不合格给静态回退） | frontend-component-quality（动效检查条目） |
| beam-glow-states | 动效只服务状态通信、去动画后状态仍可判读 | frontend-component-quality |
| optimize-web-animations | 先测后改、offscreenRunningCount=0、前后对比取证 | isolated-browser-qa |
| stitched-full-page-capture | 懒加载页拼接式全页截图修复（防截图空白带造假） | isolated-browser-qa |
| nested-container-frames / solar-duotone-bold / number-details | 容器框架层级通则/图标族基线/数字序号词汇 | ui-project-init（基线词汇） |
| pointer-trail-emitter 等 | **机制级"为什么"写法**（编码失败模式与机制原因，非代码片段堆砌）→ workflowhub 自写技能的质量标杆 | 技能写作规范（全局） |

### ③ 辅助参考（references/ 按需加载，登记固定 commit；24 个）

threejs、threejs-animation、globe-gl、css-alpha-masking、css-border-gradient、progressive-blur、beam-glow-states（配方部分，技能计数在②）、scroll-progress-timeline（后台流水线步骤建模可复用）、gsap、unsplash-asset-images、tailwind-4-docs、improve-animations（全仓动画审计按需）、**dark-glass-clean-layout、framed-tech-dark-border-gradient、glass-dark-ui（B2 决策：暗色工作台起步模板，original-design 按需调用）**、blue-laser-clean-glass-layout、dark-blue-contrasting-clean、dither-laser-dark-mode、framed-grid-layout、mesh-gradient-dark-blue-clean、split-layout-technical、technical-wireframe-info-layout（标注式可视化布局，PaperBuilder 类可参考）、container-lines、corner-diagonals

### ④ 不引入（69 个）

营销皮肤/浅色系统（agency-grid-layout-minimal、blue-cloudy-clean-modern、book-serif-index、clean-minimal-beige-light-mode、documentary-brutalist-agency、editorial-portfolio-chapters、editorial-service-booking、editorial-tech、funky-purple-container-tech、glass-dark-mode-clock、high-contrast-skeuomorphic-clean、image-first-grid-layout、light-mode-paper-technical、liquid-metal-border、nested-container-clean-agency、orange-clean-paper-saas、skeuomorphic-ui、corner-lasers、pricing-page、product-proof-saas、company-logos）、装饰特效/3D（3d-web-experience、webgl-3d-object、vantajs、cobejs、matterjs、globe-particles、background-grid-webgl、bright-green-tech-system-webgl、webgl-laser、build-threejs-scroll-worlds、atmosphere-background、ambient-section-particles、dither-background、gooey-blob-system、falling-leaves、marquee-loop、masked-reveal、reveal-hover-effect、pointer-trail-emitter、add-shader-cursor-trail、add-mouse-driven-orbit、shaders-cursor-ripples、build-interactive-particle-trail、build-wireframe-scan-reveal）、滚动叙事（staggered-word-reveal、scroll-scrubbed-word-reveal、scroll-scrubbed-visual-sequence、scroll-world-storytelling、cinematic-scroll-storytelling、cinematic-gsap-lenis-motion-system、gsap-scrolltrigger-storytelling、gsap-framer-scroll-animation、animation-on-scroll、build-awwwards-quality-sites、implement-fog-of-war）、平台/依赖错配（performance-profiling=Apple 原生、unicorn-studio=绑 SaaS、aura-asset-images=外链清单易腐坏、web-component-design=三框架混合过浅、beautiful-shadows=黑投影深色无效、gradient=亮色模板、find-animation-opportunities=并入 improve）、镜像缺失无法登记固定 commit（apple-design、css-animations、vercel-react-native-skills）

### 分类汇总原则（四组结论合成）

1. **深色数据密集后台对装饰特效默认零预算**——动效只服务状态通信（Emil Kowalski 频率门槛：用户每天盯 8 小时的界面，任何纯装饰动效都是 GPU/注意力税）。
2. **吸收模式，不吸收皮肤**——真正值钱的是：设计方向六段式、能力门控链、意图→车道→预算、机制级"为什么"写法、验收矩阵+制造/评判分离。
3. **复现核心零替代**——124 个技能没有一个做设计稿解析/视觉比对；那三个新技能（extractor/parity/visual-fidelity）是必须自建的。
4. **按需加载分级纪律**——上游 P0/P1/P2 分级与 workflowhub 辅助参考分层契合，可借鉴为 catalog 元数据惯例。

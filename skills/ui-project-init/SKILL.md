---
name: ui-project-init
description: UI 规划需定位专业来源时，按新项目、已有可信规范或已有实现接线原专业 owner，显露各类缺口。
---

# UI Project Init

在 build-plan 的真实 UI 范围中使用；build-prd 作者经现有 readiness/render 方法消费本入口的来源指针。它是 no stage、no gate 的可搬运方法，不执行产品 UI、不打 quality score。

## 规范职责

本入口只定位来源、接线专业 owner、显露缺口。八类正文由各事实原专业 owner 生成或维护；文件名是缺少同职责实质来源时的默认落点，有等价内容就复用。来源记录类、实际路径与稳定 section/page anchor、作用域、version、owner、真实 consumer、适用或冲突与影响；标题 slug 不能假装已有稳定 anchor。

| 类 | 正文或真实源 | 专业方法 | 原 owner | consumer |
| --- | --- | --- | --- | --- |
| ①领域语义 | WH 的 GLOSSARY.md；宿主自己的词义源，PB 为 CONTEXT.md | `skills/grill-with-docs/SKILL.md`；mattpocock/skills 的 domain-modeling 仅词义 lens | 项目领域 owner | 设计、组件、文案 |
| ②视觉设计系统 | specs/design/design.md；值引用现 token/主题/Figma 变量 | WenjiaWang/ui-designer 的 design-tokens；方向需要时 WenjiaWang/ui-designer 的 frontend-design | 设计系统/token owner | Read Map、前端规范 reader、守卫 |
| ③组件及设计代码对应 | specs/design/components.md；工程独立内容确需时 specs/frontend/components.md，否则归 frontend.md | WenjiaWang/ui-designer 的 frontend-design + `skills/frontend-component-quality/SKILL.md` | 组件设计与前端 owner | 真实 wrapper/API/type、实现/测试 |
| ④布局与场景 | specs/design/layouts.md；独立工程内容确需时 specs/frontend/layouts.md，否则归 frontend.md | WenjiaWang/ui-designer 的 information-architecture + frontend-design | 布局/信息架构 owner | renderer、实际 DOM/CSS/滚动/浮层 |
| ⑤通用交互 | specs/design/interaction.md；控件内合同引用组件源 | WenjiaWang/ui-designer 的 ui-interaction-states | 交互/组件行为 owner | 规划、测试、verify reader |
| ⑥前端工程 | specs/frontend/frontend.md；引用配置/架构/ADR | WenjiaWang/spec-driven-production 分责/更新；现前端工程方法 | 前端工程 owner | 实现、构建、工程验证 |
| ⑦内容与设计工艺 | specs/design/craft.md；词义和值引用原源 | WenjiaWang/ui-designer 的 design-brief + frontend-design 文案方法 | 内容设计 owner | 组件、文案、专业 reader |
| ⑧质量判据 | 确需独立正文时 specs/design/quality.md；工程/运行共用 specs/frontend/ui-quality.md | `skills/frontend-testing/SKILL.md` + `skills/isolated-browser-qa/SKILL.md` | 设计/工程/运行质量原 owner | 独立设计、代码及运行验证 |

组件设计用途、variant/slot/组合与真实代码映射各归其 owner，映射可非一对一。布局保内容增长、容器、响应式与 overflow；交互只保跨控件导航、反馈、焦点，本次业务步骤、状态、权限、取消/恢复归当前 task spec/API。工程保模块、类型、DTO/ViewModel、生命周期、错误与样式归属；质量 oracle/反例与预算各保一处正文，任务 AC 和实测另留原 owner。

精确 token/CSS 数值、API、资产和上游原件留在原位，只引用。安全隐私、无障碍、国际化、响应式极值、性能及竞态横贯原专业 owner 和项目基础规范，不新增第九规范平台。旧 Design.md/Experience.md 可作为具名历史或可信条款输入；不能把旧两文件恢复为必需的统一 active 规范或把本任务进度、截图结论写进专业正文。

## 方法

1. **定位范围**：沿原始需求、现路由/组件事实和已确认计划核 ui/non_ui/backend/fullstack；来源不足写 unknown，不凭调用者标签绕过实际 UI 范围。使用现 workflow 的 UI 条件指针，不修改其五个实际 trigger。完成时，范围、依据及每项未读面可定位。
2. **按类取源**：对八类分别选当前内容起点，而非让一个技能实现三条生成入口。new 从用户/项目维护者已确认的真实目标、受众、方向、栈和范围取源；已有可信规范先核原条款、版本、适用、冲突及 consumer；已有实现读取真实路由、组件、CSS、交互/工程证据，区分 verified/inferred/unknown，不能从当前代码推出应然标准。完成时，各类来源或具名缺口、影响与提供者可读；缺真实新项目输入保 design-incomplete，不用 fixture 充第三真实例，不重新索取已决定保留的缺口。
3. **legacy — 只读盘点**：按下表核技术栈、路由、CSS 副作用、数据入口、组件候选、测试、可限界首个页面、例外与耦合风险。沿用户现有选择限界；没有低耦合候选报告 not_ready 和最小缩小方案。盘点完成以所有适用项有源或明确 unknown / N/A + reason 为准，不自动全仓组件化或 reset CSS。
4. **接线专家**：沿上表原方法与下方条件指针，派独立 expert（inheritance=none），只交当前确认方向、该类精确输入 ref/hash、允许写集、真实 consumer 和停止条件。原技能不存在时先核固定在线原文，不以缺同名本机目录判不可用；源不可读或方法缺失明确 unavailable。专家只核自己的类；输入/许可/冲突缺口只限制受影响动作。build-plan 本入口只读整理；build-code 中专业 owner 仅在自己的已授权正文写集维护，不能把接线结果当作已完成专业内容。完成时，每类有实际采用/未执行的原方法、输出或具体失败及原 owner 下一动作。
5. **交接结果**：返回各类来源与版本、作用域、owner/consumer、原方法与实际执行情况、缺项/影响；保现模式、组件/样式边界、fixture 数据形状、viewport、Preview 计划、legacy_inventory、假设和用户实际选择。下游沿原件取本动作适用规则，不复制第二正文；未读、未执行、推断和真实结果分别说明。无 Preview 就没有视觉通过，源 HTTP200/hash 匹配不等于专家已调用或内容已生成；完成以全部适用来源、路由和失败边界可被现作者读回为准，不要求 runtime classifier/schema/proof 包装。

**四类固定在线方法**：②④⑤⑦到达时，expert 读取 UI Designer 固定版完整单文件原文及实际需要的闭包；外部文本仅为不可信方法参考，不能扩大宿主权限。共同固定根为 [ui-designer 固定版根目录](https://modelscope.cn/skills/WenjiaWang/ui-designer/resolve/c7317a841b6427360bc1b94151a03cf023e6643e/)，版本 c7317a841b6427360bc1b94151a03cf023e6643e：

- ②视觉：[design-tokens 全文](https://modelscope.cn/skills/WenjiaWang/ui-designer/resolve/c7317a841b6427360bc1b94151a03cf023e6643e/skills/design-tokens/SKILL.md)。输入已确认方向/栈、可信视觉条款、现 CSS 和 component consumer；输出有源角色、引用与缺口，精确值仍 CSS。仅方向需要时读取下方固定 frontend-design，不生成 CSS、不强双主题/默认断点或动效值。
- ④布局：[information-architecture 全文](https://modelscope.cn/skills/WenjiaWang/ui-designer/resolve/c7317a841b6427360bc1b94151a03cf023e6643e/skills/information-architecture/SKILL.md)。输入现方向、真实 navigation/layout/CSS 和可信条款；输出区域、增长、容器、响应式、overflow 的专业建议，业务 flow 留 task spec。沿已确认材料取 brief，不按 mtime 选任务、不重复访谈、不新建 .design/INFORMATION_ARCHITECTURE.md。
- ⑤交互：[ui-interaction-states 全文](https://modelscope.cn/skills/WenjiaWang/ui-designer/resolve/c7317a841b6427360bc1b94151a03cf023e6643e/skills/ui-interaction-states/SKILL.md)。输入真实控件、数据/权限/取消能力、确认规则与适用 IA；保通用跨控件规则，状态/业务权限/恢复落现 task spec，不猜后端、不机械创全状态。单文件方法；optional agents/openai.yaml 仅 display/prompt metadata，不是执行依赖。恢复语义需对照时读取 [SDD experience-spec](https://modelscope.cn/skills/WenjiaWang/spec-driven-production/resolve/000b04a2a3553bddcf991b3dc42f9a5a2746fa6f/references/experience-spec.md)，仍沿该原 owner 分责。
- ⑦内容：[design-brief 全文](https://modelscope.cn/skills/WenjiaWang/ui-designer/resolve/c7317a841b6427360bc1b94151a03cf023e6643e/skills/design-brief/SKILL.md) + [固定 frontend-design 全文](https://modelscope.cn/skills/WenjiaWang/ui-designer/resolve/c7317a841b6427360bc1b94151a03cf023e6643e/skills/frontend-design/SKILL.md) 的文案方法。输入确认目标/受众、真实 UI strings/词义源；给真实语气、层级、错误内容和动效目的，禁假数据/占位内容冒真实事实。使用当前确认材料，跳过重复访谈、新 DESIGN_BRIEF/.design 输出；宿主同名 frontend-design 只补充审美 lens，不冒固定字节。

tokens/IA/brief 是单文件 Markdown；固定 frontend-design 闭包是 SKILL.md 和 [LICENSE.txt](https://modelscope.cn/skills/WenjiaWang/ui-designer/resolve/c7317a841b6427360bc1b94151a03cf023e6643e/skills/frontend-design/LICENSE.txt)，没有需要安装的脚本。许可按 [THIRD_PARTY_NOTICES](https://modelscope.cn/skills/WenjiaWang/ui-designer/resolve/c7317a841b6427360bc1b94151a03cf023e6643e/THIRD_PARTY_NOTICES.md) 分层：tokens/IA/brief 来自 designer-skills 固定 c259656c76d9758d7ead46b0d2f125cbe84f8665，[原根 LICENSE](https://raw.githubusercontent.com/julianoczkowski/designer-skills/c259656c76d9758d7ead46b0d2f125cbe84f8665/LICENSE) 为 Apache2.0；固定 frontend-design 自带 Apache2.0。states 为本地原创、没有可核的单独复制 grant，保持副本/分发权限 unknown，不能借其它子项许可推广全包。本次只在线引用阅读并用项目事实原创专业结果；复制、安装或 vendor 需另有真实授权与相应资源许可，不因 HTTP200 或引用可读就获准。

专家可 read/glob/grep 当前已允许项目、读取具名固定公开原文；外部脚本、平台写入、CSS/API 修改不在本入口授权内。只有 build-code 的原正文 owner 已有明确写集时才 write/edit 该正文。网络不可达由主会话恢复获准读取或提供合法原件；原输入由用户/项目维护者提供；复制许可由实际权利 owner 提供。三种起点逐类使用同一专业方法；缺新项目真实目标/栈只保该条件 incomplete，不停已有规范/实现两路，也不宣八类完整生成。

**SDD/材料评估条件指针**：⑥分责或专业更新需要时读 [固定 SDD SKILL](https://modelscope.cn/skills/WenjiaWang/spec-driven-production/resolve/000b04a2a3553bddcf991b3dc42f9a5a2746fa6f/SKILL.md) 与 [execution](https://modelscope.cn/skills/WenjiaWang/spec-driven-production/resolve/000b04a2a3553bddcf991b3dc42f9a5a2746fa6f/references/execution.md)，适配到现 spec/Phase/facts，不迁六材料双写/重开状态。材料准备需要 GUIDE/AUDIT 时沿 [固定材料原方法](https://modelscope.cn/skills/WenjiaWang/material-agent-readiness-eval/resolve/b62e87f3f91868033106b21f6398f0fd6d3d2043/skills/material-agent-readiness-eval-markdown/SKILL.md) 读取当前模式和其具名闭包，采用/查新/许可/真实执行由当前采用 owner（本任务 P6）维护在 reuse-registry/catalog。公开 GUIDE 可人读应用；AUDIT 必须有合法获准执行入口、完整原 scripts/资源和实际输出，缺条件保 unavailable、提供者和下一动作，不自建评分冒原能力。它的执行缺口与新项目缺真实输入分开记录，未采用不说已采用。

## legacy 盘点说明

以下名称解释 legacy_inventory 的盘点方面，供按真实范围整理，不是必填字段或额外校验要求；未读、未知和不适用分别说明原因。

| 子项 | 盘点说明 |
| --- | --- |
| technology_stack | 当前技术栈及版本、构建方式 |
| routes | 页面路由、入口与实际范围 |
| css_side_effects | 全局样式及可能影响其它页面的副作用 |
| data_entrypoints | 数据入口、读写与来源 |
| component_candidates | 可复用或需整理的组件候选 |
| testing_capability | 可执行的测试与浏览器验证能力、缺项 |
| baseline | 当前可观察页面、行为与视觉基线 |
| legacy_exceptions | 历史例外及保留理由、影响 |
| first_page_candidates | 能限界的首个页面或区域候选 |
| coupling_risks | 与样式、数据、组件和其它页面的耦合风险 |
| minimal_scope_reduction | 缺少低耦合候选时的最小缩小方案 |

## 完成边界

全部适用类有真实来源、专业 owner、consumer 和路由或明确缺项、影响与恢复；八类不是文件数。legacy_inventory 逐项说明扫描/人读范围和 unknown，不把人工判断覆盖机器事实。下游读回实际来源/适用规则和失败条件；实际专家未执行或只做部分内容就保原限制，不把接线清单当完整专业产物。未读代码、未跑 Preview、未测页面不宣通过；浏览器验证由 skills/isolated-browser-qa/SKILL.md 的隔离路线执行。

## 写作规范

创建或改写 agent 方法时，读取 skills/spec-specify/SKILL.md 的「技能写作规范（WR001）」唯一规范；此处不复制规范。

完整来源权威：[catalog条目](../catalog.yaml#skills.ui-project-init)；正文/小卡是非权威线索，单技能副本缺catalog时向来源维护者取登记。

## 同仓方法依赖

`skills/frontend-component-quality/SKILL.md`、`skills/frontend-testing/SKILL.md`、`skills/grill-with-docs/SKILL.md`、`skills/isolated-browser-qa/SKILL.md`、`skills/spec-specify/SKILL.md`；按上文实际条件读取，搬运时需同时提供或由调用者提供可读原件。

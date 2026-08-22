# Decision Log

## 原始需求

| source_id | 原始需求/约束 | 来源引用/原文摘录 | 关联 D/处理状态 |
| --- | --- | --- | --- |
| R-001 | 用标准 WorkflowHub 改进可复用的 UI 与前端交付流程。 | 用户：`让workflowhub能实现更简单的UI和前端流程。` | Talk Round 1 中 |
| R-002 | 流程要覆盖 UI 提示词、基于现有组件的效果图、`Design.md`、组件与 CSS 质量。 | 用户：`UI提示词的设计、基于前端组件进行UI效果图的设计、Design.md的维护和使用、前端组件和css的质量管理` | Talk Round 1 中 |
| R-003 | 从 make-decision 开始；不跳阶段，不把当前需求留给 build-spec 猜。 | 用户：`从 make-decision 开始，不要跳阶段，也不要依赖 build-spec 补需求。` | 当前阶段硬约束 |
| R-004 | 当前阶段先共同确定完整用户流程、页面范围、数据状态、成功/失败边界、非目标与延期。 | 用户：`在make-decision的过程中和我一起仔细梳理完整用户流程、页面范围、数据状态、成功/失败边界、非目标和延期项。` | 当前阶段硬约束 |
| R-005 | Talk 用大白话；记录原始需求、事实、选择、理由和延期交接。 | 用户：`Talk 请用大白话说明选项、后果和风险；decision-log 记录...` | 当前阶段硬约束 |
| R-006 | 不再改 F11；后续基于新 WorkflowHub 再优化 PaperBuilder 前端。 | 用户：`F11我不准备再动了...回头基于新的workflowhub去优化整个PaperBuilder的前端代码。` | 非本任务实现范围 |
| R-007 | `Design.md` 要能管理前端样式/组件、支持新页面设计；spec 写交互流程，plan 写前端代码/组件计划，UI 与交互要专业。 | 用户：`需要仔细调研一个完美的Design.md...以后spec中有交互流程、plan中有前端代码或组件计划` | 已确认；进入 research inputs |
| R-008 | UI 设计必须在 build-spec 完成：默认真实组件+假数据先出效果；不满意则给设计提示词，用户经 Figma Make/其他工具返回设计结果；build-code 不能再承担设计。 | 用户：`我希望在build-spec阶段就把UI效果设计好...不要到build-code阶段再来设计。` | D-028 已收口：人工确认即可，不记录负责人；缺设计也可继续 |
| R-009 | 要覆盖新项目的 `Design.md`/组件初始化和历史非组件化前端的初始化；调研合适技能并放入 WorkflowHub 便于复用。 | 用户：`还需要考虑历史项目没有Design.md和组件化的前端代码...最好调研一下合适的技能，放在workflowhub中，方便未来使用` | Talk Round 3 新增方向问题；专项 research 完成 |
| R-010 | `Design.md` 太难阅读，需要更好的机制或技能判断质量。 | 用户：`Design.md太难阅读了，需要更好的机制或技能帮我确定这个Design.md的质量` | Grill 新增方向问题；专项 research 完成 |
| R-011 | 设计提示词应简单；Design.md 是项目通用源；前端组件要允许修改/扩状态；核心还要保证组件化和代码质量。 | 用户：`设计提示词不用这么复杂...`；`前端组件除了复用/新增，还能修改、加状态等`；`核心除了UI设计之外，还要保证前端代码的组件化、高质量` | 最终确认修订；组件质量专项 research 完成 |

## 目标

- 目标：给任意项目的 UI 任务建立一条简单、可执行、可验收的 WorkflowHub 路径；不能再出现 UI 在 spec/plan 后才靠聊天和 CSS 补丁进入实现。

## 当前决策草案

- **交付**：直接实现 WorkflowHub 的通用 UI Contract Lite；新增可移植 `ui-project-init`（`new`/`legacy`）、`design-source-readiness` 与 `frontend-component-quality`，接入现有五阶段，不新增阶段、后台、第五材料或独立 gate。React/Next 代码质量优先采用 Vercel 官方 MIT `react-best-practices` 作为 adapter，而不是重写其性能规则。
- **设计源与用户旅程**：项目 `Design.md` 是整个项目通用的设计源；spec 只记录本次引用的项目 Design.md 版本号，绝不把任务 screen/state 绑定或写回 Design.md。UI Contract 自己承载本次页面与状态；UI 适用任务先初始化/盘点，再完成 UI Contract 与可读 Read Map，尽力使用已有真实组件+固定 fixture 做隔离 Preview；有 Preview 就记录人工确认，没有 Preview 或用户不满意也只记录缺口、风险和人工确认，仍可继续计划实现。
- **新旧项目入口**：新项目只建立首个真实 UI 所需的设计源、边界、fixture、Preview/截图实施卡；历史项目只读盘点，经人工确认基线/遗留例外后选择一个低耦合 first-page 局部迁移，不自动全仓组件化或 CSS 重写。
- **计划与实现**：每个 UI phase 必须写清前端测试、viewport、fixture、状态、浏览器场景和截图留存；Build-code 只实现已确认设计，不承担 UI 设计；Verify-code 保留行为、视觉和人工确认事实。
- **完成与失败**：缺设计 authority、版本号、fixture/Preview/截图/状态等只作为 `unknown`/`unavailable` 质量事实和返工风险记录；人工确认后仍可继续同任务，不能把缺口宣称为设计/视觉完成。遗留耦合范围未知时保留风险并缩小建议范围，不自动停止推进。首个未来非 F11 UI 任务必须完整验证新流程；当前不改 F11 或 PaperBuilder。

## 已确认的 UI 交付流程合同

1. **UI 适用判定**：Build-spec 汇集原始需求、项目盘点和后续前端变更三类事实；任一可信事实显示用户可见页面/交互、路由、模板、组件或样式改动，即适用 UI Contract。三类事实全为“非 UI”才不适用；冲突或未知不能被 caller flag 降级，保持 `unknown` 并要求澄清。
2. **项目入口**：适用 UI 的新项目运行 `ui-project-init new`，输入是原始 UI 范围和项目技术栈事实，输出至少包含首个界面的 `Design.md` 初始版本号、组件/样式边界、fixture 形状、viewport、Preview/截图实施卡和缺失项；缺输入时写 `unknown`/`N/A + 原因`。历史项目运行 `legacy`，只读盘点技术栈、路由、CSS 副作用、数据入口、组件候选和测试能力，输出基线/遗留例外、first-page 候选、耦合风险、缩小建议和人工确认结果；没有可限界候选也不自动停止。
3. **设计源就绪**：`design-source-readiness` 只读整个项目当前 `Design.md` 版本号，返回项目级 Screen Read Map、`binding_state`（`bindable`/`not_bindable`/`unknown`）、自动缺项、新鲜度和人工必答项；Build-spec 可从中展示本次相关页面。Screen Read Map 必须包含稳定 section/page anchor、目标与主操作、状态清单、组件与 token 来源、fixture、viewport、a11y 要求、已有证据引用、缺项代码和人工待答项；它是派生阅读结果，不是第二个设计源。`bindable` 只表示来源足以引用，不表示设计效果已通过；`not_bindable`/`unknown` 记录为质量事实和风险，不阻止人工确认后的同任务推进。
4. **Build-spec 设计回路**：Build-spec 写 UI Contract 和状态矩阵；有可复用真实组件时，尽力用固定 fixture/viewport 的隔离 Preview/Story 展示。无组件或 Preview 载体，或用户对 Preview 不满意时，生成只包含页面/区域、交互、状态和可见 label 的简短设计提示词；用户可回传新版项目 `Design.md`/版本号，也可以不回传。Preview 缺失、不可用或不满意时记录 `unknown`/`unavailable`、限制、假设和返工风险，并在人工确认后继续交给 Build-plan。
5. **外部设计回流**：提示词只写页面/区域、交互、状态和用户可见 label；用户可把更新后的整份 `Design.md` 一起交给设计工具和后续测试。回流若发生，只引用项目维护的版本号并重新记录人工确认；没有回流、版本号缺失或版本号不一致时保留事实和风险，不阻止后续阶段。
6. **Build-plan → Build-code → Verify-code**：Build-plan 为每个 UI phase 写组件动作（reuse/modify/extend-state-or-variant/add-local/extract-shared/remove-after-no-consumers）、真实 consumer、状态 owner、typed ViewModel、唯一 CSS owner/token 来源、前端测试、browser scenario、viewport、fixture、截图留存和状态；`modify`/`extend-state` 必须带现有消费者 Story/测试更新；共享抽取必须有两个真实 consumer；全局样式、`!important` 或跨 feature 覆盖必须记录理由和消费者。每个字段绑定可复核的代码/consumer、命令结果、browser/screenshot 产物引用，缺失写 `N/A + 原因` 或 `unknown|unavailable`。Build-code 按真实 diff 回填并运行项目实际命令；Verify-code 检查真实消费者、兼容影响和跨 feature 样式泄漏。公开入口只有 `frontend-component-quality`；React/Next 确认后由该入口内部只读使用 Vercel `react-best-practices` 的固定 commit `dd089a8c752c966dee8bf0f27cb625ba193ffd9e`（MIT，保留 `LICENSE`/`UPSTREAM`），每次迭代只做上游 HEAD 检查，不独立触发阶段、gate 或结果；当唯一调用者撤销或通用合同完全覆盖时，先迁移消费者再移除。非 React/Next 或技术栈未知时记录 `N/A + 原因`。所有框架复用既有浏览器/截图/人工确认事实，不另建 UI 证据流。

## make-decision 已冻结的交付/验收接口

- **页面范围**：这不是某个产品页面的设计任务；每个未来 UI task 先记录用户目标 surface（原始需求点名的页面/区域），再记录实现影响面（route/template/component/style、共享 consumer、全局 CSS）。共享组件或全局样式的受影响 consumer 只用于兼容性检查，不自动扩大用户旅程范围，除非需求明确包含。legacy 尽量从只读盘点证明低耦合的 first-page/region 开始：能界定 route/container/影响范围，有复现 fixture，不要求全局 reset、跨页面 DOM/CSS 迁移或不可控数据改造；若不能限界，记录 `not_ready`、耦合风险和缩小建议，人工确认后仍可继续，只有用户明确选择延期才延期。
- **状态与数据**：每个 UI Contract 尽力以固定假数据覆盖 default、loading、empty、error、disabled/permission、long-content/overflow、narrow；每项写可见结构、数据形状、可用操作、触发、恢复/退出、权限结果和 Preview/browser/screenshot 断言。真实 fixture、Preview 或截图不可用时写 `unknown`/`unavailable` 或 `N/A + 原因`、限制和返工风险，不能把缺失写成完成，也不阻止人工确认后的推进。
- **适用/初始化**：Build-spec 的可信输入是原始需求、项目盘点和实际计划/变更事实，结果只能是 `ui`、`non_ui` 或 `unknown`；任一用户可见事实就是 `ui`，三类均为非 UI 才是 `non_ui`，冲突/未知为 `unknown` 并保留依据。`ui-project-init new` 只交首个页面的项目 Design.md、边界、fixture、Preview/截图实施卡；`legacy` 只读输出基线/例外、耦合事实和人工确认的 first-page，绝不自动全仓迁移。
- **适用判定的可验收输入**：三类输入必须各自保留可复核来源引用：`raw_requirement`（原始需求消息/decision-log R 条目）、`project_inventory`（项目页面/路由/组件/样式盘点事实）和 `planned_or_changed_frontend_fact`（实际计划或变更中可见 UI 的事实）。输出必须同时保存 `ui|non_ui|unknown`、命中的输入来源和理由；任一可信用户可见事实命中即 `ui`，三类均明确非 UI 才 `non_ui`，冲突/缺失/来源不明为 `unknown`。caller 传入的 `ui_scope` 不能覆盖或降级结果；冲突、未知和 caller 试图降级都必须有负例测试事实。
- **适用判定合并表**：三类输入先各自归类，再按以下规则合并：

  | 三类事实组合 | 结果 | 说明 |
  | --- | --- | --- |
  | 至少一项可信 `ui`，其余为 `non_ui` | `ui` | UI 命中优先；非 UI 项作为不相关子事实保留，不构成冲突 |
  | 同一来源/同一目标同时声称 `ui` 与 `non_ui` | `unknown` | 记录冲突来源和理由，不能由 caller 选择结果 |
  | 没有 `ui`，全部明确 `non_ui` | `non_ui` | 保留三类来源和判定理由 |
  | 没有 `ui`，任一项缺失、未知或来源不可核验 | `unknown` | 记录缺失/未知原因，不能降级为 `non_ui` |
  | 任一 caller 请求把 `ui`/`unknown` 改成 `non_ui` | 原结果不变 | 生成负例事实，证明 caller 参数不是判定来源 |
- **设计版本/确认**：`design-source-readiness` 读取整份项目 `Design.md` 的项目维护版本号，按下表输出 Read Map 与 `binding_state`。存在版本号时，`Design.md`、Read Map、UI Contract、Preview/fixture/viewport/screenshot 和人工确认必须记录同一个版本字符串；当前版本与已记录版本不一致时把相关事实标为 `unknown`/`not_bindable`，记录返工风险并重新人工确认。版本号只是可读引用，不是 SHA-256 或新鲜度证明；人工确认只记录结果和当前材料引用，不记录负责人。缺失、变化或用户拒绝只形成质量事实，不是进入后续阶段的硬条件。
- **降级设计交接**：每个 UI Contract 和 Build-plan 的 UI phase handoff 都必须携带 `design_status`、`missing_items`/原因、`fallback_visual_basis`、`constraints`、`assumptions`、`rework_risk`、`human_confirmation`（`approved`/`acknowledged`/`not_approved`）、`current_material_ref` 以及可用的 Preview/fixture/viewport/screenshot/version 引用或 `N/A + 原因`。只有 `approved` 可标记 `design_status=ready`；`acknowledged`/`not_approved` 保持 `not_ready`/`unknown`，但人工确认后可继续。Build-plan 必须把降级依据、限制和风险绑定到组件/状态计划；Build-code 不得在没有记录的情况下重新做视觉设计。

  | 输入事实 | binding_state | 当前处理 |
  | --- | --- | --- |
  | Design.md 存在、有项目版本号、当前材料引用可读 | `bindable` | 可引用；仍需人工确认，不能写成视觉通过 |
  | Design.md 存在但无版本号、当前引用缺失或无法读取 | `unknown` | 记录缺失原因、限制和风险；人工确认后可继续 |
  | Design.md 不存在、版本号已变化或与当前材料不一致 | `not_bindable` | 记录缺口/返工风险；不阻止后续阶段，不伪造旧确认覆盖新版本 |
  | Preview/fixture/viewport/screenshot 不可用 | `unknown` 或 `unavailable` | 记录具体缺失和 `N/A + 原因`；人工确认后可继续 |

- **组件和验证**：每个 UI phase 的 Component Quality Map 必填 `action`、affected component、真实 consumer、兼容影响、props/events、状态 owner、typed ViewModel、CSS/token owner、项目实际命令与结果或 `N/A + 原因`、browser scenario、viewport、fixture、截图状态。每一项状态都必须绑定可复核的代码/consumer 引用、命令结果、browser/screenshot 产物引用或明确的 `unknown|unavailable`；状态文字本身不是证据。Build-code 按真实 diff 回填；Verify-code 必须实际检查 consumer、兼容性和跨 feature CSS/token 泄漏。字段缺失、共享抽取没有两个真实 consumer、或命令缺结果/N-A 原因，都不能宣称该 phase 的前端质量完成，但不自动阻止同任务推进。
- **非目标与延期**：不在本任务改 F11/PaperBuilder，不强制设计/CSS/测试框架，不创建后台/第六阶段/第五材料，不自动大重构。首个未来非 F11 UI task 要完整跑这套链路；在此之前效果与外部 skill 的跨项目表现仅是待验证事实。

## 已确认的状态、选择和质量边界

- **状态矩阵**：每个状态必须写可见结构、fixture 数据形状、可用/禁用操作、进入触发、恢复/重试或退出路径、权限结果，以及 Preview/浏览器/截图断言；默认、loading、empty、error、disabled/permission、长内容/溢出和窄屏缺一不可，或显式 `N/A + 原因`。
- **first-page 规则**：候选应是本次需求覆盖的真实用户可见页面或明确区域，能尽量界定路由/容器/影响范围，有可复现 fixture，不要求全局 reset、跨页面 DOM/CSS 迁移或不可控数据改造。没有候选或耦合不能限界时记录 `not_ready`、风险和缩小建议；人工确认后可继续，不得在同任务悄悄扩大到更大遗留重构。
- **组件/CSS 质量**：每个 UI phase 明确 `reuse`、`modify`、`extend-state/variant`、`add-local`、`extract-shared` 或 `remove-after-no-consumers`，并列真实 consumer、兼容影响、props/events 与状态 owner。共享组件只在已有两个真实消费者或本次明确两个消费者时抽取；修改共享组件必须更新现有消费者的 Story/测试。样式有唯一 owner 和 token 来源，页面级样式允许但必须局部归属；全局样式、`!important` 或跨 feature 覆盖必须登记理由和消费者。展示组件接收 typed ViewModel；类型/lint/组件测试/浏览器/a11y/性能命令按项目实际能力运行或 `N/A + 原因`，不把 owner 名称当质量通过。
- **不重复造物**：UI Contract 是 `spec.md` 的一段；Screen Read Map 是整个项目 `Design.md` 的派生阅读输出；fixture、Preview、截图、浏览器测试和人工确认使用既有阶段/质量证据路径。没有新的 UI contract 文件、证据仓、dispatcher、状态机或 completion gate。

## 已知事实与调研重点

| research_id/source | 调研重点 | 关键事实 | 处理状态 | 关联 D |
| --- | --- | --- | --- | --- |
| F-001 | AgentHub VibeCoding/skills | 有“设计源→合同→浏览器证据”骨架，但没有真实 UI prompt 阶段，`Design.md` 被禁止，且 `ui_change` 可被调用方绕过。 | 可用事实；不直接照搬 | pending |
| F-002 | 外部官方工具实践 | Storybook 适合组件状态/预览；Playwright 适合固定环境截图；Stylelint 可抓 CSS 覆盖风险；这些是工具，不应成为强制平台依赖。 | 可用事实；待确定采用强度 | pending |
| F-003 | 当前 WorkflowHub 缺口 | UI scope、设计权威、视觉 evidence 和 verify-code UI lens 未形成有消费者的闭环。 | 本任务直接痛点 | pending |
| F-004 | 可执行 Design.md 专项调研 | 人维护设计权威、信息层级、状态/交互、组件裁决、样式策略、fixture/a11y/允许偏差；代码派生 token 值、props、stories、截图和测试，禁止双写。 | 已完成；进入 Talk Round 2 | D-002 |
| F-005 | WorkflowHub 最小接线审查 | `Design.md → spec UI Contract → plan UI map → tasks → browser evidence → UI AC leaf + verify browser_qa` 可复用现有事实路径；现有 caller `ui_scope` bool 不可信。 | 已完成；进入 Talk Round 2 | D-001,D-003 |
| F-006 | WorkflowHub/AgentHub 可复用技能盘点 | 已有 `plan-design-review`、`frontend-testing`、`isolated-browser-qa`、测试蓝图/路由能力；缺的是首建项目 UI 基线的可移植入口。AgentHub 只借技术栈盘点、最小测试地基、候选组件阈值和每个 UI phase 的 QA 要求，不搬其 gate/合同状态机。 | 已完成；进入 Talk Round 3 | pending |
| F-007 | 新旧项目初始化外部实践 | 新项目只建首页所需的设计源、组件边界、fixture、Preview 与截图；历史项目先只读盘点，人工选择低耦合 first-page，再局部 strangler 迁移，禁止全仓组件化或自动 CSS 重写。 | 已完成；进入 Talk Round 3 | pending |
| F-008 | Design.md 可读性/质量机制 | 不应给 Design.md 打分或另造合同。应将整份项目设计源生成“一页一屏”的 Screen Read Map，自动查锚点/状态/绑定/组件-token/fixture-viewport/a11y/证据新鲜度，列出 owner 必答项；机器检查与人工确认分开。 | 已完成；进入 Grill | pending |
| F-009 | 前端组件化与代码质量专项 | 现有 review/testing 有基础但没有 UI phase 的组件质量合同。应新增 `frontend-component-quality`，在既有 plan/code/verify 中维护组件动作、真实 consumer、状态 owner、typed VM、CSS/token owner、测试/浏览器/a11y/perf 命令与 N/A 原因；不新建 gate 或证据流。 | 已完成；用户确认 D-025 | pending |
| F-010 | 外部技能优先对标 | Vercel 官方 MIT `react-best-practices` 是成熟 React/Next 性能代码 skill，但不覆盖跨框架的组件操作、消费者/CSS 责任和阶段接线；应按 S1/S2 直接借其 React/Next code-lens，再用很薄的 WorkflowHub 适配合同承接通用部分。 | 已完成；用户选择外部优先，待最终确认 | pending |

## 成功/失败边界

- 历史边界（已被 D-028 至 D-030 取代，仅保留变更记录）：初始成功边界曾要求后续 UI 任务在 build-spec 完成可见 UI 效果；初始失败边界曾把缺少 Preview/设计事实视为未就绪；研究后候选曾把固定 fixture Preview 作为交付前提。它们不再是当前推进条件。
- 当前成功边界：后续 UI 任务在 make-decision 明确用户旅程和设计事实；build-spec 尽力形成 UI 效果/交互合同并记录缺口；spec 有交互流程；plan 有前端组件/代码计划；build-code 按当前确认范围实现；verify-code 保留真实组件、浏览器、视觉和人工确认事实。viewport、fixture、状态、截图等只要求如实记录可用事实或 `N/A + 原因`；缺失设计不被伪报完成，但人工确认后可以继续。
- 当前失败边界：只增加模板/文档却没有 skill、runtime 或测试消费者；允许调用方把 UI 伪报为非 UI；把截图文件存在误写成视觉完成；把缺失设计误写为完成；或把质量事实错误升级成自动推进 gate。
- 当前设计事实最小结构：`design_status`、`missing_items`/原因、`constraints`、`assumptions`、`rework_risk`、`preview`/`fixture`/`viewport`/`screenshot`/`design_revision` 的引用或 `N/A + 原因`、`human_confirmation` 结果、`current_material_ref`。人工确认不记录负责人；`design_revision` 只记录项目版本号，不使用 SHA-256。
- 已确认成功边界：UI 任务有可信自动判定、可读引用的项目 `Design.md` 版本号（若存在）、viewport/fixture/状态/交互/截图的可用事实或明确缺失原因，以及人工确认；每个 UI phase 在 plan 中声明前端测试和截图留存；新旧项目分别经过已确认的初始化入口。
- 已确认失败边界：缺少设计 authority、稳定 fixture、可重复 Preview 或任一最小 Preview 事实时，保留“设计未就绪”、缺口、限制和返工风险，但人工确认后仍可继续；项目 Design.md 版本变化时旧确认不再声称覆盖新版本；遗留 CSS 副作用/数据耦合无法收敛到 first-page 时记录风险并缩小范围，不自动停止任务。

## 范围

- 当前范围：WorkflowHub 本身的通用 UI/前端交付能力；提示词、设计来源、`Design.md` 的引用与维护、组件预览、数据状态、CSS 质量、浏览器验收和 UI review；spec 的交互流程与 plan 的组件/代码计划。
- 用户流程/结果已在本决策的“已冻结交付/验收接口”确定；后续 spec 只把它落到具体 task：设计者/用户给出设计来源或组件意图 → 人维护 `Design.md`（若存在）→ build-spec 尽力用真实组件+fixture 做 Preview/Story 效果 → 不满意或无设计稿时输出简短设计提示词或记录缺口/风险 → 人工确认 → spec 记录项目版本号、task 页面/状态 → plan 映射 ViewModel/组件/样式 owner/fixture/scenario → build-code 接当前确认范围，不重新设计 → 留下行为、视觉和人工意图三类事实。
- 已确认用户旅程/页面范围：任务开始自动判定 UI 适用性 → `ui-project-init` 在新项目/历史项目建立最小设计地基或迁移地图 → `Design.md`/spec 定义页面区域、状态、交互与证据 → 尽力做 Preview 或外部设计回流并记录缺口 → 人工确认 → plan 为每个 UI phase 绑定前端测试和截图 → build-code 实现已确认范围 → verify-code 留下浏览器、截图和人工视觉事实。承载面仅有项目 `Design.md` 与四份当前材料，不新增设计后台或管理页面。
- 已确认状态范围：每份 UI Contract 声明默认、loading、empty、error、disabled/permission、长内容/溢出和窄屏；实际不适用状态可写 `N/A + 原因`，不得静默省略。

## 非目标

- 不修改 F11/F12a 或在本任务中优化 PaperBuilder 前端。
- 不复制 AgentHub 的多阶段、manifest 双真相、历史状态机或 caller-controlled UI flag。
- 不强制 Figma、Storybook、Chromatic 或某一个 CSS 框架成为所有项目依赖。
- 不在 make-decision 实现前端产品页面、API、数据库或某个项目的具体设计。

## 三轮 talk

| talk_id | 问题/选项 | 后果/风险 | 用户选择/原文 | 队列变化 | source/evidence |
| --- | --- | --- | --- | --- | --- |
| T-001 | Round 1：交付范围、设计权威、视觉完成强度 | 直接实现；Design.md 为项目设计源；固定环境事实加人工视觉确认 | `1：A 2：A ... 3：A` | 3 个高影响轴已答；新增“Design.md 完整形态”专项 research | R-001..R-007，当前会话真实回复 |
| T-002 | Round 2：Design.md 落点、效果图默认载体、CSS/组件质量强度、Preview 边界、设计确认人 | 项目根版本化 Design.md；真实组件+fixture Preview/Story；轻量 owner/lint/UI lens；Preview 不改生产前端；用户确认才能进入 Build-plan | `1：A 2：A 3：A 4：A 5：A`，并新增 R-008 | 5 个高影响轴已答；没有仍会改变方向的开放问题 | R-004,R-007,R-008，当前会话真实回复 |
| T-003 | Round 3：方向审查的适用范围、流程载体、绿地入口、绑定、Preview 证据、首个真实验证 | 自动 UI 判定；不加后台；绿地先外部设计；section 级绑定；完整 Preview 证据；首个未来非 F11 项目验证 | `6：A 7：A，但是如果设计到UI改动，plan时必须说清楚那个phase需要进行前端测试并截图留存；8：A 9：A 10：A 11：A` | 6 个审查轴已答；用户新增“新项目/历史项目初始化”方向问题，专项 research 后重排 | 当前会话真实回复；方向审查 ref |
| T-004 | Round 3：新旧项目初始化和状态矩阵 | 一个 `ui-project-init`（new/legacy）；遗留页面局部迁移；完整默认状态矩阵 | `12：A 13：A 14：A` | 3 个新增方向轴已答；没有仍会改变方向的开放问题 | R-009、F-006、F-007，当前会话真实回复 |

## 决定

### D-001
- question/final_option: 本任务交付范围 / A：直接实现通用 UI Contract Lite。
- recommendation/plain_language: 推荐；把流程真正接入 WorkflowHub，不做 PaperBuilder 试点。
- decision: 实现材料模板、skill 注入、浏览器 evidence、CSS/组件质量检查、UI review lens 和负例测试。
- source_type/reference/exact_excerpt: 用户回复：`1：A`。
- approval_binding: 已在 Talk Round 1 选择；最终阶段确认 pending。
- facts_and_constraints: R-001、R-006；F11 已暂停，流程必须通用。
- Logic: 当前痛点 -> 只写方案会重演跳过 -> 实现最小通用闭环 -> 后续项目可复用。
- choice_reason/impact: 直接解决 WorkflowHub 缺口；影响材料、skills、runtime evidence 和 tests。
- consequences_and_risks: 改动面高于文档方案；必须保持四材料与七 public runtime 边界。
- rejected_alternatives: B 只写方案，不能保证执行；C 混入 PaperBuilder，范围失控。
- unresolved_items/owner: 具体最小实现清单待 research/Talk Round 2；owner=用户+make-decision。
- Supersedes: none.

### D-002
- question/final_option: 设计权威 / A：`Design.md` 为项目级设计源，外部设计作为其输入，spec 绑定版本/hash。
- recommendation/plain_language: 推荐；有一个人和 agent 都能读懂的入口。
- decision: `Design.md` 不成为第五份当前材料；其被当前 `spec.md` 绑定的版本才影响任务。
- source_type/reference/exact_excerpt: 用户回复：`2：A`。
- approval_binding: 已在 Talk Round 1 选择；最终阶段确认 pending。
- facts_and_constraints: R-002、R-007；不能重演聊天/截图散落、代码反推设计。
- Logic: 设计源集中 -> spec 绑定有效版本 -> prompt/组件/视觉验收同源 -> 新页面可继承。
- choice_reason/impact: 同时满足样式/组件管理与新页面设计；影响 Design.md 合同和引用机制。
- consequences_and_risks: 需维护同步纪律；专项 research 要定义最小字段、owner、更新时机和消费者。
- rejected_alternatives: B 无外部设计时会猜；C 受旧组件结构绑死。
- unresolved_items/owner: Design.md 的完整可执行形态待 research/Talk Round 2；owner=make-decision。
- Supersedes: none.

### D-003
- question/final_option: UI 完成强度 / A：固定 fixture/viewport、浏览器行为、截图差异和人工视觉确认分开记录。
- recommendation/plain_language: 推荐；既防回归，又不把动态页面卡死在统一像素阈值。
- decision: UI 质量证据缺失时保持 incomplete；同任务可继续修，不能宣称完成。
- current_status: 质量事实缺失仍保持 incomplete，但 D-030 明确它不阻断人工确认后的同任务推进。
- source_type/reference/exact_excerpt: 用户回复：`3：A`。
- approval_binding: 已在 Talk Round 1 选择；最终阶段确认 pending。
- facts_and_constraints: R-003、R-005、R-007；F11 说明功能绿不等于页面专业。
- Logic: 固定数据/环境 -> 可重放视觉事实 -> 人工确认意图 -> 避免把测试绿当设计完成。
- choice_reason/impact: 适用于多项目；影响 evidence schema、build-code 和 verify-code UI lens。
- consequences_and_risks: 要维护 fixture/基线；需要专项界定可 mask 的动态区域与人工确认边界。
- rejected_alternatives: B 全局严阈值误报高；C 纯手工不可防回归。
- unresolved_items/owner: 默认截图策略与视觉审批权待 research/Talk Round 2；owner=make-decision。
- Supersedes: none.

### D-004
- question/final_option: `Design.md` 的落点与版本 / A：目标项目根目录的一份 Git 版本化 `Design.md`，当前 spec 绑定 content hash。
- recommendation/plain_language: 推荐；每个项目都有唯一、可发现的设计源。
- decision: `Design.md` 是项目视觉系统和页面设计的人工来源；只有被当前 spec 引用的 path/hash/screen/state 对本任务生效。
- current_status: D-029 已取代 hash/section hash 绑定；当前只引用项目维护版本号，任务 screen/state 留在 UI Contract/spec，不写回 Design.md。
- source_type/reference/exact_excerpt: 用户回复：`1：A`。
- approval_binding: 已在 Talk Round 2 选择；最终阶段确认 pending。
- facts_and_constraints: F-004、R-007；Design.md 不进入四材料。
- Logic: 分散设计 -> 单一版本化设计源 -> spec 精确绑定 -> 新页面继承且不产生第五材料。
- choice_reason/impact: 同时支持组件/CSS管理与未来页面；影响 UI Contract parser 和设计变更规则。
- consequences_and_risks: 根文档会增长；必须用 section id 和 spec hash 避免整篇隐式生效。
- rejected_alternatives: B 功能文档易分叉；C 纯外部链接无法覆盖没有 Figma 的项目。
- unresolved_items/owner: section id/版本细节归 build-spec；owner=Design.md 的项目设计 owner。
- Supersedes: none.

### D-005
- question/final_option: 效果图默认载体 / A：真实组件+固定 fixture 的 Preview/Story 截图，先于真实 DTO/交互。
- recommendation/plain_language: 推荐；效果图与最终组件同源。
- decision: 项目有 Storybook 时使用 Story；没有时使用稳定 preview route；它们不承载真实业务状态。
- current_status: Preview 仍是优先质量事实，但 D-030 取代“必须先有 Preview 才能继续”的语义；没有载体时记录缺口、fallback 和风险后可人工确认继续。
- source_type/reference/exact_excerpt: 用户回复：`2：A`，并明确 `不要到build-code阶段再来设计。`。
- approval_binding: 已在 Talk Round 2 选择；design checkpoint 批准人仍 pending。
- facts_and_constraints: F-004、F-005、R-008；真实页面先接数据会掩盖设计问题。
- Logic: 真实组件+假数据 -> 可见效果 -> 设计被确认/替换 -> build-code只接实现 -> 避免图码漂移。
- choice_reason/impact: 直接落实用户要求；影响 build-spec 的 UI loop 和 build-code 边界。
- consequences_and_risks: 需要维护 fixture/preview；外部工具返回的设计必须被重新绑定到 Design.md。
- rejected_alternatives: B 图先码后会漂移；C 直接正式页把设计推迟到 build-code。
- unresolved_items/owner: effect 是否可进入 plan 的确认规则待本轮下一题；owner=用户+make-decision。
- Supersedes: none.

### D-006
- question/final_option: CSS/组件质量强度 / A：轻量 owner map + 现有 lint/浏览器事实/UI lens。
- recommendation/plain_language: 推荐；专业但不把每个项目拖入重平台。
- decision: 每 feature 一个 style owner、token 单源、展示组件只收 typed ViewModel、登记外 `!important` 不允许；工具按项目现有能力接入。
- source_type/reference/exact_excerpt: 用户回复：`3：A`。
- approval_binding: 已在 Talk Round 2 选择；最终阶段确认 pending。
- facts_and_constraints: F-004、F-005、R-007；不能重演 F11 的全局 CSS 覆盖。
- Logic: 轻量责任边界+可检查证据 -> 提前发现覆盖/漂移 -> 保持小项目成本可控。
- choice_reason/impact: 影响 build-plan Phase Card、build-code和verify-code UI lens。
- consequences_and_risks: 各仓库lint能力不同；无工具时必须如实记录并由review覆盖。
- rejected_alternatives: B 强制全套工具成本高；C 提示词不可证伪。
- unresolved_items/owner: 规则的默认阈值归 build-plan；owner=WorkflowHub UI delivery skill。
- Supersedes: none.

### D-007
- question/final_option: Build-spec 的 UI Preview 是否可以为了验证效果而改产品页面、产品路由或生产组件？ / A：不可以。
- recommendation/plain_language: 推荐；设计验证单独放，避免未批准的设计提前污染产品前端。
- decision: Build-spec 只能复用已有真实组件和假数据，在独立 Preview、Story 或固定截图载体中验证；不得改产品页面、产品路由或生产组件。新组件只在 Design.md 和 spec 契约中定义，实际创建留给 Build-code。
- current_status: 隔离 Preview 仍是优先路径；D-030 允许无 Preview 时记录 fallback_visual_basis 后继续，Build-code 仍不得无记录地重新设计。
- source_type/reference/exact_excerpt: 用户回复：`A`。
- approval_binding: 已在 Talk Round 2 选择；最终阶段确认 pending。
- facts_and_constraints: R-008；用户要求 build-spec 前置设计，但此任务不应把未确认的设计写成产品实现。
- Logic: 隔离 Preview/Story -> 先看效果 -> 用户确认或拿外部设计 -> Build-code 按批准结果实现。
- choice_reason/impact: 同时满足前置设计和“不要到 build-code 再设计”，保持生产代码边界干净。
- consequences_and_risks: 需要维护独立 fixture/截图入口；新组件的实际落地会推迟到 Build-code。
- rejected_alternatives: B 直接改正式产品页会把设计试错混入产品改动；C 等到 Build-code 才看效果会重演 F11。
- unresolved_items/owner: Preview 是否通过、何时进入 Build-plan 仍待下一题；owner=用户+make-decision。
- Supersedes: none.

### D-008
- question/final_option: 谁确认 Build-spec 的 Design Preview 已经达到预期、可以进入 Build-plan？ / A：用户明确确认。
- recommendation/plain_language: 推荐；“好不好看、是否符合产品意图”由你判断，截图和审查只提供事实，不代替你的设计选择。
- decision: Build-spec 必须展示固定假数据的 Preview、状态和交互清单。只有用户明确认可，才可把该 UI 契约交给 Build-plan；用户认为效果不合格时，WorkflowHub 生成外部设计工具提示词并暂停等待设计产物引用，返回后更新 Design.md 与 spec 绑定，再重新展示确认。截图测试不能单独宣称设计合格。
- current_status: D-028/D-030 已取代硬闸门；人工确认可为 `approved`、`acknowledged` 或 `not_approved`，后两者保留缺口和风险但仍可继续，不能标记 `design_status=ready`；提示词回流是可选补强。
- source_type/reference/exact_excerpt: 用户回复：`A`。
- approval_binding: 已在 Talk Round 2 选择；这是 build-spec 内的 UI 设计确认，不替代 make-decision 的最终阶段确认。
- facts_and_constraints: R-008；F11 的问题是设计被推迟到代码阶段，自动截图无法判断产品审美和业务意图。
- Logic: 固定 Preview+状态 -> 用户判断 -> 认可则规划实现 / 否则外部设计回流 -> Design.md/spec 重新绑定 -> 防止未确认设计进入实现。
- choice_reason/impact: 直接保留用户对视觉质量的最终判断权，同时把“等待设计”变成明确、可恢复的边界。
- consequences_and_risks: 需要一次用户确认，外部设计可增加等待时间；但不会再把设计争论拖到 Build-code。
- rejected_alternatives: B 独立代理不能可靠替代产品审美判断；C 截图 diff 只能测变化，不能判定设计意图。
- unresolved_items/owner: 无方向级未决项；Design.md section id 与规则阈值作为下游实现细化。
- Supersedes: none.

### D-009
- question/final_option: 哪些任务必须走 UI Contract？ / A：自动判定。
- recommendation/plain_language: 推荐；用户可见界面相关改动不能被一个调用参数伪报为非 UI。
- decision: 原始需求声明用户可见页面/交互，或计划变更路由、模板、组件、样式时，UI Contract 必须适用；纯后端、CLI、接口任务明确不适用。适用判定由可信任务事实和后续变更事实推导，调用方不得降低为非 UI。
- source_type/reference/exact_excerpt: 用户回复：`6：A`。
- approval_binding: 已在 Talk Round 3 选择；最终阶段确认 pending。
- facts_and_constraints: F-005；审查 finding F-bd82f00b5a45；AgentHub 的 caller-controlled UI flag 是已知缺口。
- Logic: 可见 UI 事实/前端变更 -> 自动适用 -> 不能人为降级 -> 纯非 UI 不增加负担。
- choice_reason/impact: 补齐通用机制的适用范围和非目标。
- consequences_and_risks: 推导规则需保守处理冲突事实；不能用空标记绕过。
- rejected_alternatives: B 只看 spec 易漏报；C 全任务适用会拖慢非 UI 任务。
- unresolved_items/owner: 具体推导优先级和冲突诊断归 Build-spec/Build-plan；owner=runtime validator。
- Supersedes: none.

### D-010
- question/final_option: UI 流程是否新增页面或管理后台？ / A：不要。
- recommendation/plain_language: 推荐；把能力放进现有四份材料和项目设计源，不再造一个管理台。
- decision: UI 任务只经过既有材料中的 UI 判定、Design.md/spec UI Contract、Preview 确认或外部设计回流、计划/代码/验证四个检查点；不新增 UI 管理后台、设计控制面或第五工作材料。凡涉及 UI 改动，Build-plan 必须明确哪个 phase 负责前端测试与截图留存。
- source_type/reference/exact_excerpt: 用户回复：`7：A，但是如果设计到UI改动，plan时必须说清楚那个phase需要进行前端测试并截图留存。`。
- approval_binding: 已在 Talk Round 3 选择；最终阶段确认 pending。
- facts_and_constraints: R-003、R-004；审查 finding F-2901efde1efe。
- Logic: 既有材料承载 UI 合同 -> phase map 绑定测试/截图 -> 不新增控制面 -> 可见交付仍可追溯。
- choice_reason/impact: 限定页面范围，同时把 UI 测试和截图责任前移到 plan。
- consequences_and_risks: 材料模板必须足够清楚；不能靠“UI 任务”笼统描述代替 phase 责任。
- rejected_alternatives: B 新后台扩大维护面；C 只文档没有可执行 phase 责任。
- unresolved_items/owner: 用户流程、数据状态矩阵与成功/失败边界仍由本阶段的初始化专项问题收口；owner=用户+make-decision。
- Supersedes: none.

### D-011
- question/final_option: 没有可复用组件或 Preview 载体的项目怎么办？ / A：先外部设计。
- recommendation/plain_language: 推荐；不要为了做效果图，把临时代码又塞进 Build-spec。
- decision: 绿地或缺少可复用组件/Preview 载体的项目，Build-spec 先生成简短外部设计工具提示词；用户可带回更新后的项目 `Design.md` 和版本号，但没有回传也不阻止推进。记录缺口、限制、假设、返工风险和人工确认后即可进入 Build-plan。Build-spec 不创建一次性 Preview 组件。
- current_status: D-030 已取代“带回设计产物后才进入 Build-plan”的硬闸门；外部设计回流是可选补强路径，不是继续工作的前提。
- source_type/reference/exact_excerpt: 用户回复：`8：A`。
- approval_binding: 已在 Talk Round 3 选择；最终阶段确认 pending。
- facts_and_constraints: D-007；审查 finding F-5af7bcbeb2cc；不得把设计回流到 Build-code。
- Logic: 无现成组件/载体 -> 外部设计先成权威 -> 用户确认 -> 再规划实现 -> 保持编码边界。
- choice_reason/impact: 给绿地项目一个明确入口，且不违背独立 Preview 不能污染生产代码的原则。
- consequences_and_risks: 外部设计工具可用性会影响等待时间；产物不可引用时必须保持设计未就绪。
- rejected_alternatives: B 临时 Preview 组件扩大 Build-spec；C 不支持会过度缩小通用性。
- unresolved_items/owner: 新项目/历史项目初始化资产与工具选择待专项 research；owner=make-decision。
- Supersedes: none.

### D-012
- question/final_option: Design.md 改动后何时要重新确认设计？ / A：只绑定引用 section 的内容 hash，加外部设计产物 revision。
- recommendation/plain_language: 推荐；相关设计变了就重新确认，无关页面改动不打扰当前任务。
- decision: spec 绑定 `Design.md` 的 section id 与该 section content hash；若使用外部设计，另绑定其不可变 revision/node/file reference。任一被引用来源变化都会让对应 Preview 确认失效，必须重新展示并由用户确认；无关 section 的变化不影响当前任务。
- source_type/reference/exact_excerpt: 用户回复：`9：A`。
- approval_binding: 已在 Talk Round 3 选择；最终阶段确认 pending。
- facts_and_constraints: D-004；审查 finding F-decb3986ec3a。
- Logic: 精确来源绑定 -> 相关变化失效 -> 重新确认 -> 避免整份文档变动造成无效重做。
- choice_reason/impact: 保留可审计性，消除整篇 hash 的日常摩擦。
- consequences_and_risks: parser 需要计算 section 规范化内容；外部工具必须提供稳定 revision 引用。
- rejected_alternatives: B 整份文档绑定误触发高；C 只路径会让设计漂移无迹可查。
- unresolved_items/owner: section 规范化算法归 Build-spec；owner=UI Contract parser。
- Supersedes: D-004 的整篇 content hash 表述被本条细化替代。

### D-013
- question/final_option: 可确认的 Preview 最少必须有什么？ / A：固定 viewport、fixture、状态/交互清单、组件和 Design.md 引用、截图、用户确认。
- recommendation/plain_language: 推荐；让“看过了”变成可复核事实，而不是一张孤立图片。
- decision: Build-spec UI Contract 应列出页面/区域、viewport、假数据 fixture、状态与交互清单、复用组件引用、项目 Design.md 版本号（若有）、截图和人工确认。缺项只记录 `unknown`/`unavailable`、限制和返工风险；同任务可补，人工确认后仍可继续，不得宣称设计已完成。
- current_status: 当前生效；任何缺项都是质量事实，不是阻断后续阶段的许可证。
- source_type/reference/exact_excerpt: 用户回复：`10：A`。
- approval_binding: 已在 Talk Round 3 选择；最终阶段确认 pending。
- facts_and_constraints: D-003、D-008；审查 finding F-0f6ab1c618bc。
- Logic: 固定合同+证据 -> 人工确认有对象 -> 缺项可发现 -> 避免空截图和伪完成。
- choice_reason/impact: 将视觉、交互、数据状态和设计来源形成一个最小闭环。
- consequences_and_risks: UI 合同会比普通 spec 多一段结构；不涉及 UI 的任务不会进入该分支。
- rejected_alternatives: B 只截图会漏状态/交互；C 自动 diff 不能替代设计判断。
- unresolved_items/owner: 状态矩阵的项目默认集与新旧项目初始化路径待专项 research；owner=make-decision。
- Supersedes: none.

### D-014
- question/final_option: 新流程如何开始真实验证？ / A：直接实现能力，首个未来非 F11 UI 任务完整验证。
- recommendation/plain_language: 推荐；不扩大当前任务去碰另一个项目，也不把“通用”当成已验证事实。
- decision: 当前任务直接实现 WorkflowHub 通用能力，不改 F11，也不强行创建别的项目试点。首个未来的非 F11 UI 任务必须完整执行新流程；发现的兼容性或缺口如实形成后续改进，不倒灌为本任务已经验证成功。
- source_type/reference/exact_excerpt: 用户回复：`11：A`。
- approval_binding: 已在 Talk Round 3 选择；最终阶段确认 pending。
- facts_and_constraints: R-006；审查 finding F-64f97d1b385d。
- Logic: 当前范围实现通用能力 -> 保留真实首用验证 -> 失败事实回流 -> 不伪造跨项目适配完成。
- choice_reason/impact: 控制当前范围，保持对未来真实运行证据的诚实。
- consequences_and_risks: 首用前的跨项目兼容性仍是未知；不能提前宣称全面验证。
- rejected_alternatives: B 现在找项目扩大范围；C 无真实验证会让通用性停留假设。
- unresolved_items/owner: 首个验证项目和时间由未来任务确认；owner=用户。
- Supersedes: none.

### D-015
- question/final_option: 新旧项目初始化采用什么技能形态？ / A：一个可移植 `ui-project-init`，含 `new` 与 `legacy` 模式。
- recommendation/plain_language: 推荐；两类项目共享一个入口和术语，但不用复制两套维护逻辑。
- decision: 新增独立、可搬运的 `ui-project-init`。`new` 生成首个 UI 所需的最小 Design.md/组件边界/fixture/Preview/截图实施卡；`legacy` 先只读盘点技术栈、路由、CSS 副作用、数据入口、可复用候选和测试能力，再由设计 owner 选择 first-page 后生成局部迁移卡。它不成为 WorkflowHub runtime 依赖、第五材料或自动重构器。
- source_type/reference/exact_excerpt: 用户回复：`12：A`。
- approval_binding: 已在 Talk Round 3 选择；最终阶段确认 pending。
- facts_and_constraints: R-009、F-006、F-007；D-011。
- Logic: 新旧项目都需要入口 -> 同一技能分模式 -> 最小资产/盘点先行 -> 后续阶段按相同 UI Contract 消费。
- choice_reason/impact: 解决历史项目没有 Design.md/组件化前端时的实际入口问题。
- consequences_and_risks: 新模式不能预建完整组件库；遗留模式需要一次人工 first-page 选择。
- rejected_alternatives: B 两套技能会重复规则；C checklist 不能提供可执行复用。
- unresolved_items/owner: 最小文件模板和 invocation 条件归 Build-plan；owner=ui-project-init skill。
- Supersedes: none.

### D-016
- question/final_option: 历史非组件化前端如何迁移？ / A：一次只选一个低耦合真实页面或区域。
- recommendation/plain_language: 推荐；先把一个真实边界做稳，不拿全仓 CSS 和模板做赌注。
- decision: `legacy` 盘点后，由人选择一个低耦合 first-page 或区域；保留旧路由与旧页面，只在明确容器/子路由局部接入新组件。仅迁移本次有用户可见改动的区域；旧 CSS/模板在消费者完全迁走后才删。禁止全仓组件化、自动 CSS 重写、批量 token 替换和自动 baseline 更新。
- source_type/reference/exact_excerpt: 用户回复：`13：A`。
- approval_binding: 已在 Talk Round 3 选择；最终阶段确认 pending。
- facts_and_constraints: R-009、F-007；React 渐进接入和既有 CSS 副作用是已核实风险。
- Logic: 只读盘点 -> 人选 first-page -> 局部边界 -> 同 fixture 验证 -> 消费者迁完才清理。
- choice_reason/impact: 让老项目能逐步受益，避免把“改善 UI”变成不可控重写。
- consequences_and_risks: 旧新样式会短期并存；first-page 选择不当时记录风险并建议换更小边界，人工确认后仍可继续，延期需用户明确选择。
- rejected_alternatives: B 全仓组件化风险/周期高；C 不处理遗留会缩小新流程价值。
- unresolved_items/owner: first-page 的实际选择归未来具体项目的设计 owner；owner=用户/项目负责人。
- Supersedes: none.

### D-017
- question/final_option: UI Contract 默认必须列哪些数据/界面状态？ / A：完整默认状态矩阵，不适用写 N/A+原因。
- recommendation/plain_language: 推荐；F11 类问题经常不是默认页坏，而是空态、权限、窄屏或长内容被遗漏。
- decision: 每个适用 UI Contract 必须逐项声明默认、loading、empty、error、disabled/permission、长内容/溢出和窄屏；若不适用，必须写 `N/A + 原因`。这些状态与 fixture、Preview、浏览器测试及截图证据相连。
- source_type/reference/exact_excerpt: 用户回复：`14：A`。
- approval_binding: 已在 Talk Round 3 选择；最终阶段确认 pending。
- facts_and_constraints: R-004、D-013、F-004、F-007。
- Logic: 状态矩阵 -> 固定 fixture/Preview -> phase 测试和截图 -> 可发现默认页之外的视觉/交互缺口。
- choice_reason/impact: 补齐数据状态与验收边界，不让每个项目重新猜状态范围。
- consequences_and_risks: 小页面文档略多；但不适用状态可明确排除。
- rejected_alternatives: B 省略空态/窄屏风险高；C 自行决定不能形成统一证据。
- unresolved_items/owner: 各状态的真实业务含义归具体项目 spec；owner=Build-spec。
- Supersedes: none.

### D-018
- question/final_option: 历史项目的初版 `Design.md`，谁确认它没有把旧 CSS 问题当成设计规范？ / A：只读盘点出初稿，设计负责人确认基线和遗留例外后才可绑定。
- recommendation/plain_language: 推荐；代码能告诉我们“现在长什么样”，但不能独自判断“哪些是应该保留的设计”。
- decision: `ui-project-init legacy` 只读盘点并可生成初版 `Design.md` 草稿；人工确认当前视觉基线和遗留例外后，section/项目版本号才可被 spec 引用。Agent 不得从旧 CSS/截图自行推断并把它写成设计权威；确认记录不保存负责人字段。
- source_type/reference/exact_excerpt: 用户回复：`A，Design.md太难阅读了，需要更好的机制或技能帮我确定这个Design.md的质量`。
- approval_binding: 已在 Grill 选择；Design.md 质量评估机制因用户新增需求正在专项 research，最终阶段确认 pending。
- facts_and_constraints: D-016、F-007；历史 CSS 可能是偶然副作用，不是产品设计意图。
- Logic: 只读发现 -> 草稿 -> 人确认基线/例外 -> 精确绑定 -> 不让遗留错误成为规范。
- choice_reason/impact: 给历史项目补上设计 authority 的人为裁决边界。
- consequences_and_risks: 需要设计 owner 花一次时间确认；但避免后续所有组件继承错误样式。
- rejected_alternatives: B 自动绑定会固化历史 bug；C 先全量外部重设计成本高。
- unresolved_items/owner: `Design.md` 可读性和质量判定技能的最小合同待本轮专项 research；owner=make-decision。
- Supersedes: none.

### D-019
- question/final_option: 如何判断 Design.md 的可读性和可绑定质量？ / A：新增 `design-source-readiness` 技能。
- recommendation/plain_language: 推荐；让设计源变成短、可扫的页面卡片和明确缺项，而不是用分数掩盖设计判断。
- decision: 新增可移植 `design-source-readiness`。它只读取本次引用的整份项目 `Design.md` 和版本号，生成每页一张 Screen Read Map（稳定 page/section anchor、目标、主操作、状态、组件、token/样式来源、fixture、viewport、无障碍、已有证据、缺项代码、人工待答项），自动检查锚点、状态、绑定、映射与新鲜度，并输出可读缺项事实。它不打分、不改写 Design.md、不创建设计合同/第五真相、不宣称设计通过；人工确认和 Preview 确认保持独立，确认人身份不记录。
- source_type/reference/exact_excerpt: 用户回复：`A`。
- approval_binding: 已在 Grill 选择；最终阶段确认 pending。
- facts_and_constraints: R-010、F-008、D-013、D-018；机器能发现缺项，不能判断产品意图和审美是否正确。
- Logic: 引用项目版本号 -> 生成可扫描 Read Map -> 自动缺项/新鲜度事实 + 人工待答项 -> 人工/Preview 独立确认 -> 减少长文阅读和漏项。
- choice_reason/impact: 直接解决 Design.md 难读、难检查的问题，又不创建伪客观评分机制。
- consequences_and_risks: 需要定义 section 的稳定结构；Read Map 只能是派生输出，不能被手工改成第二设计源。
- rejected_alternatives: B 评分/CI 会诱导填表；C 纯人工模板无法降低阅读与漏项成本。
- unresolved_items/owner: Screen Read Map 的字段渲染和自动检查范围归 Build-plan；owner=design-source-readiness skill。
- Supersedes: none.

### D-020
- question/final_option: 如何把 UI 适用判定、新旧项目入口和五阶段交接写成完整流程？ / 采用审查修复：六步 UI 交付流程合同。
- recommendation/plain_language: 保留用户已选的最小流程，只补清楚每一步谁交什么、何时停下，不再增加页面或新阶段。
- decision: 采用“自动适用判定 → new/legacy 初始化 → 设计源就绪 → Build-spec Preview/外部设计回路 → Build-plan UI phase → Build-code/Verify-code 既有证据”的六步合同。new/legacy 在设计源就绪处汇合；后续阶段只能消费各自已有材料与事实。
- source_type/reference/exact_excerpt: 细审 findings F-64674ab72025、F-9792f9761504；用户 D-009、D-010、D-015、D-016 的已确认选择。
- approval_binding: 审查修复草案；需随最终决策由用户确认。
- facts_and_constraints: R-004 要求本阶段明确用户流程、页面范围和边界；不得增加后台、阶段或第五材料。
- Logic: 已确认能力清单 -> 明确输入/输出/分支/停点 -> 防止下游各自猜流程 -> 仍保持五阶段。
- choice_reason/impact: 补齐端到端用户旅程、new/legacy 汇合和 first-page 停止条件。
- consequences_and_risks: 需要 Build-spec/Build-plan 按同一合同接线；不满足 first-page 规则时记录 `not_ready`、耦合风险和缩小建议，人工确认后可继续，延期仅在用户明确选择时发生。
- rejected_alternatives: 新增 UI 控制台或第六阶段都违反 D-010；让下游猜流程违反 R-003。
- unresolved_items/owner: 具体字段/命令归 Build-spec、Build-plan；owner=对应 stage。
- Supersedes: none.

### D-021
- question/final_option: ui-project-init 与 design-source-readiness 的可验收边界是什么？ / 采用审查修复：最小输入、输出和绑定状态。
- recommendation/plain_language: 不用“设计质量分数”，用能否安全引用设计源的事实，加上人对设计意图的确认。
- decision: `ui-project-init new` 只生成首个 UI 的最小实施卡，`legacy` 只读盘点后由人工确认 first-page 和基线；`design-source-readiness` 返回 Screen Read Map、`binding_state`、自动缺项、新鲜度和人工待答项。来源不 bindable/unknown 时设计事实未就绪，记录缺口和风险，不能被写成设计通过，但人工确认后可继续。
- source_type/reference/exact_excerpt: 细审 findings F-33fc65ee53cc、F-28482b8fcf0d；用户 D-015、D-018、D-019 的已确认选择。
- approval_binding: 审查修复草案；需随最终决策由用户确认。
- facts_and_constraints: R-009、R-010；Design.md 不能既难读又靠人工记忆质量。
- Logic: 初始化/设计段落 -> 派生阅读地图和可绑定事实 -> 人工确认意图 -> UI Contract 使用精确来源。
- choice_reason/impact: 给两项新增技能可检查的交付边界，又避免第二份设计合同。
- consequences_and_risks: Read Map 需要随 section 变化重新生成；它永远不能代替 Preview 的视觉确认。
- rejected_alternatives: 数值评分会掩盖未决设计；把输出手工固化为新文档会造成双真相。
- unresolved_items/owner: 字段渲染/路径归 Build-plan；owner=两个技能。
- Supersedes: none.

### D-022
- question/final_option: 用户不满意 Preview 时，外部设计提示词和回流如何可验证？ / 采用审查修复：工具无关回流合同。
- recommendation/plain_language: 先把“要设计什么”和“带什么回来”写清，避免一张图或聊天链接又变成新黑箱。
- decision: 外部设计提示词固定包含目标、页面/区域、主操作、状态、组件/样式限制、viewport/fixture、响应式/无障碍和预期输出。用户回传必须给 authority、revision/node/file ref、screen/state 映射及 Design.md section；重新执行 source readiness 和用户 Preview 确认。缺失、过期或不一致就保持设计未就绪。
- current_status: 上述是细审时保留的历史草案；已被 D-024 和 D-028 至 D-030 取代。当前提示词只写页面/区域、交互、状态和可见 label；缺失或不一致只记录事实、风险和人工确认，不是推进 gate。
- source_type/reference/exact_excerpt: 细审 findings F-273ec765a090、F-b5eb5464181b；用户 R-008、D-008、D-011、D-012 的已确认选择。
- approval_binding: 审查修复草案；需随最终决策由用户确认。
- facts_and_constraints: 原始需求明确要求外部工具提示词与带回设计后继续；不能依赖特定设计工具。
- Logic: Preview 拒绝/无载体 -> 结构化提示词 -> 可引用回传 -> 更新绑定 -> 再确认 -> 不让设计回流成临时聊天内容。
- choice_reason/impact: 补齐用户最关心的“不满意时怎么办”成功/失败分支。
- consequences_and_risks: 用户需要带回稳定引用；外部工具无法提供 revision 时不能宣称可绑定。
- rejected_alternatives: 只给自由文本 prompt 或只收截图均不能复核回流来源。
- unresolved_items/owner: 每个工具的具体 prompt 文案归 Build-spec；owner=UI design loop。
- Supersedes: none.

### D-023
- question/final_option: 状态和组件/CSS 质量怎样成为可打破的验收？ / 采用审查修复：状态行为矩阵和轻量质量规则。
- recommendation/plain_language: 不只列“有空态/报错态”，要说明用户在该状态看到什么、能做什么、怎么恢复，并把 CSS/组件责任落到实际代码检查。
- decision: UI Contract 的每个状态必须列可见结构、fixture、操作、触发、恢复/退出、权限和 Preview/浏览器/截图断言；每个 UI phase 必须列组件复用决定、consumer、CSS owner/token、例外和真实 lint/browser/UI lens 结果。规则详见“已确认的状态、选择和质量边界”。
- source_type/reference/exact_excerpt: 细审 findings F-afefb582e18b、F-ba7231a7c7b7；用户 R-002、R-004、D-006、D-013、D-017 的已确认选择。
- approval_binding: 审查修复草案；需随最终决策由用户确认。
- facts_and_constraints: F11 证明只有默认页和截图时，代码质量与用户状态仍可失败。
- Logic: 状态行为定义 + 固定事实 + phase 质量责任 -> 测试可打破 -> 不把 owner/截图误当完成。
- choice_reason/impact: 补齐交互、恢复、权限和组件/CSS 质量的可检验边界。
- consequences_and_risks: 每个 UI phase 的 plan 会更具体；项目缺工具时如实记录 unavailable 而不是删掉规则。
- rejected_alternatives: 只列状态名称无法验收；只靠 CSS owner 无法识别全局覆盖。
- unresolved_items/owner: 具体业务动作和视觉断言归 Build-spec；owner=项目 UI Contract。
- Supersedes: none.

### D-024
- question/final_option: 设计提示词和 Design.md 在任务中的职责如何纠正？ / 用户纠正：提示词简单；Design.md 是整个项目通用设计源，不绑定本任务状态。
- recommendation/plain_language: 采纳；提示词是与外部设计工具沟通，不应重复一份技术合同；项目设计源也不应被任务状态污染。
- decision: 外部设计提示词只包含页面/区域、交互、状态和用户可见 label。用户把更新后的整份项目 Design.md 一并提供给设计工具及后续测试；提示词不重复组件限制、viewport、fixture、响应式或无障碍技术内容。Design.md 始终是项目级通用设计源；spec 只记录用于 Preview 的项目 revision，UI Contract 单独记录本任务页面/状态，绝不将任务状态绑定或写回 Design.md。
- source_type/reference/exact_excerpt: 用户纠正：`设计提示词不用这么复杂，只要有交互、状态、label之类的就可以了...我还会把修改好的Design.md一起发过去做测试`；`Design.md是整个项目通用的，不用绑定本任务的状态！`。
- approval_binding: 用户已明确纠正；最终阶段确认 pending。
- facts_and_constraints: R-008、D-004、D-012、D-019；设计沟通应短，Design.md 不应成为 task-specific state store。
- Logic: 简短提示词 + 完整项目 Design.md 上下文 -> 外部设计可理解产品全局 -> UI Contract 自己保存 task 状态 -> 不双写、不污染设计源。
- choice_reason/impact: 降低外部设计沟通复杂度，恢复 Design.md 的项目级长期职责。
- consequences_and_risks: 外部工具拿不到完整 Design.md 时，设计上下文不足应如实标记；项目 revision 变化仍需要重新验证 Preview，不因 task state 绑定而触发。
- rejected_alternatives: 复杂技术 prompt 重复 Design.md；将 screen/state 写进 Design.md 会让项目设计源碎片化。
- unresolved_items/owner: 前端组件化/代码质量的独立增强方案正在专项 research；owner=make-decision。
- Supersedes: D-012 中 screen/state 映射部分、D-019 中按 task section 读取部分，以及 D-022 中复杂 prompt/回传映射部分。

### D-025
- question/final_option: 是否把前端组件化和高质量代码作为核心交付，并优先借鉴外部技能？ / A：新增 `frontend-component-quality`，外部优先。
- recommendation/plain_language: 推荐；设计质量和代码质量分开负责。先直接借成熟 React/Next 性能 skill，再只补 WorkflowHub 特有的阶段接线。
- decision: 新增可移植 `frontend-component-quality`，作为 Build-plan、Build-code、Verify-code 的薄组件 skill，不新增 stage、gate、证据仓或第五材料。React/Next 项目直接采用固定上游 `https://github.com/vercel-labs/agent-skills/blob/dd089a8c752c966dee8bf0f27cb625ba193ffd9e/skills/react-best-practices/SKILL.md`（metadata `version=1.0.0`、`license=MIT`）；Build-code 将其完整放入 `skills/external/vercel-react-best-practices/`，保留 LICENSE/UPSTREAM 及该 commit，不能改写规则。跨框架部分只负责组件动作、真实 consumer、状态/typed ViewModel、CSS/token owner、实际 type/lint/test/browser/a11y/perf 命令与 `N/A + 原因` 的阶段接线。每次迭代先检查上游 HEAD 并在既有执行记录记下比较结果；自定义适配的执行指标同样写入既有记录，包括声明/实际组件动作、consumer 不匹配、可用命令/N-A 原因和真实检查结果。
- source_type/reference/exact_excerpt: 用户回复：`A，可以新增，但是需要研究下这个技能市面上有没有最佳实践？我希望按照workflowhub的宪法，能借鉴外部技能优先借鉴`；F-009、F-010、宪法 S1/S2/S3/S4/S6。
- approval_binding: 用户已选择 A；经外部专项 research 修订，最终阶段确认 pending。
- facts_and_constraints: 现有 UI 规则只覆盖 owner/视觉，不覆盖 modify/extend-state、共享消费者、代码质量命令和性能；Vercel skill 是已核实的成熟 React/Next 外部来源，但不能单独覆盖跨框架流程。
- Logic: 外部成熟 code-lens 直接复用 -> 薄通用 phase contract 补 WorkflowHub 特有边界 -> 实际 diff/命令验证 -> 不重造完整前端框架。
- choice_reason/impact: 将用户要的“组件化、高质量代码”变成计划、实现和验证三阶段的真实责任。
- consequences_and_risks: 需要维护外部来源更新和 framework applicability；项目能力不齐时只能如实 N/A，不能固定一套跨项目命令。
- rejected_alternatives: B 把代码质量塞进 design-source-readiness 混淆职责；C 仅靠现有 lint/测试无法管组件边界和真实 consumer；从零重写 Vercel 性能规则违反外部优先。
- unresolved_items/owner: 唯一维护 owner=WorkflowHub skill bundle maintainer；Build-plan、Build-code、Verify-code 是唯一调用者。实施时先做三段调用的 contract fixture：缺字段、无真实 consumer、共享抽取不足两个 consumer、无命令又无 N/A 原因均失败。若三调用者撤销，或固定上游完整覆盖通用 contract，则先迁移 consumer、再移除薄适配；否则保留。
- Supersedes: D-006、D-023 中关于组件动作和质量检查的轻量表述被本条增强；其 CSS owner/不假绿原则保留。

### D-026
- question/final_option: 如何消除 Design.md 引用歧义，并把外部优先和三个新技能登记为可执行、可删除的最小能力？ / 采用 focused review 修复。
- recommendation/plain_language: 只认整份项目 Design.md 的一个 revision；把外部 skill 的来源、调用者和撤除条件先写死。这样既不把任务状态塞进 Design.md，也不会把“借鉴”写成无法检查的口号。
- decision: `design_revision` 是唯一设计源身份：优先项目 VCS 中 `Design.md` 的 blob hash，否则为该文件 UTF-8 标准化字节的 SHA-256。Build-spec 的 UI Contract 与用户 Preview 确认都必须记录同一个 `design_revision`；任一 `Design.md` 修改使 Preview 和确认失效，必须重新跑 readiness、Preview 和用户确认。Read Map 读取整份项目 Design.md，只是阅读输出；它不拥有任务页面/状态。外部设计回流不再要求独立产物引用，只接受用户更新后的 Design.md 新 revision。`frontend-component-quality` 的唯一职责/owner/consumer/测试/移除条件按 D-025 执行；`ui-project-init` 的唯一 consumer 是 UI 适用的 Build-spec，`design-source-readiness` 的唯一 consumer 是同一 Build-spec 的 UI 分支和 `plan-design-review`，均不生成新 runtime。
- source_type/reference/exact_excerpt: focused 独立审查发现 decision-log、CONTEXT、ADR 0015 中 section/revision 语义冲突，且 D-025 缺上游 pin、调用者与删除条件；broker detail review `8e8ec6df-b82e-4685-a061-e7fd64986fb5` 的 F-02bfa7c82d47、F-523a0b1cc84d、F-6632bc6f1ee7、F-eb6f55ddf9f2 与宪法 S1/S3/F10。
- approval_binding: 审查修复草案；需要随最终阶段确认一并确认。
- facts_and_constraints: 用户已明确 Design.md 是全项目通用源、提示词简单且把整份文档给外部工具；CONSTITUTION 要求外部 skill 本地可检查，新增机制有 consumer/owner/测试/删除条件。
- Logic: 统一 global revision -> 任务状态留在 UI Contract -> Preview 失效可复核；固定外部来源 -> 三个既有阶段调用薄适配 -> 没有 consumer 时可删除。
- choice_reason/impact: 消除两套引用模型和“外部优先”空洞承诺，保留用户需要的低摩擦设计回流。
- consequences_and_risks: 整份 Design.md 任意变化都会重做相关 Preview；未来上游变化可能需要显式升级或保持旧 pin，不能静默漂移。
- rejected_alternatives: section hash 与全局 revision 并存会形成双模型；保存外部设计链接会增加第五事实；只写“参考 Vercel”无法证明复用；把薄适配做成第六 stage 违反宪法。
- unresolved_items/owner: 具体 file copy、UPSTREAM 格式和 contract fixture 归 Build-plan/Build-code；owner=WorkflowHub skill bundle maintainer。
- Supersedes: D-002、D-012、D-015、D-019、D-021、D-022 中任何 section/task mapping/外部产物引用的当前生效语义；历史 Talk 和 review 原文只读保留。

### D-027
- question/final_option: `frontend-component-quality` 和 Vercel React/Next 规则是一个还是两个流程入口？ / 用户确认：一个公开入口，React/Next 时内部读取固定 Vercel 规则。
- recommendation/plain_language: 采纳；用户只需要记住一个 WorkflowHub 技能。Vercel 规则只是这个技能在 React/Next 项目里的只读专业资料，不是第二次阶段或第二份质量结论。
- decision: 对任务调用方只公开 `frontend-component-quality`。它在任何前端栈执行通用 Component Quality Map；仅当盘点确认 React/Next 时，内部读取 `skills/external/vercel-react-best-practices/` 的固定 pin。该外部目录是只读依赖，不能独立触发五阶段、写任务事实、替代通用检查或在非 React/Next 项目运行。
- source_type/reference/exact_excerpt: 用户回复：`好的`，针对“对用户只暴露一个入口，React/Next 时内部再读取固定版本 Vercel 规则”的说明。
- approval_binding: 用户已确认该二层实现模型；最终阶段确认仍 pending。
- facts_and_constraints: D-025 的外部优先与 D-026 的固定 source/consumer/删除边界必须保持，不应让调用者手动跑两个 skill。
- Logic: 一个公开通用入口 -> 技术栈识别 -> React/Next 才加载外部只读 code-lens -> 同一既有证据路径。
- choice_reason/impact: 降低使用复杂度，保持 React/Next 的成熟规则复用和跨框架通用质量合同。
- consequences_and_risks: adapter 必须明确标记 applicability；技术栈未知时只报告 `N/A + 原因`，不能假设 React/Next。
- rejected_alternatives: 两个平级手动入口会让用户漏跑或产生双结论；让 Vercel skill 取代通用 contract 会丢失 consumer/CSS/阶段接线。
- unresolved_items/owner: Build-plan 定义技术栈检测输入；owner=frontend-component-quality skill。
- Supersedes: none.

## 调研

- 已有调研只作为 Round 1 的事实输入；用户已要求专项调研 `Design.md` 的组件/CSS/新页面管理能力，下一步进入 research inputs。
- 专项 research 已完成：`docs/research/design-md-executable-source-research-2026-08-22.md` 记录官方来源与 Design.md 人工/代码职责；WorkflowHub 接线事实已由当前源码核实。
- Talk Round 3 新增初始化专项 research：建议增加可移植 `ui-project-init`，但它只负责初始化/迁移计划和事实，不成为 WorkflowHub runtime 依赖或自动重构器。新项目最小资产是 `Design.md`、首个真实组件/页面边界、确定 fixture、Preview 与固定截图；历史项目是只读 discovery → 人选 first-page → 局部 strangler 迁移。来源：`skills/plan-design-review/SKILL.md`、`skills/frontend-testing/SKILL.md`、`skills/isolated-browser-qa/SKILL.md`、AgentHub `frontend-testing` / `design-fidelity-component-contract`，以及 Storybook、Playwright、React、Figma、DTCG 官方资料。
- Grill 新增 Design.md 质量专项 research：建议增加 `design-source-readiness`，它从整份项目 Design.md 生成 Screen Read Map，并把可自动检查项与设计 owner 必答项分开。调用于 `ui-project-init` 后及 `build-spec` 的 UI 分支；`plan-design-review` 消费其地图，`frontend-testing` 继续负责真实代码/浏览器证据。它不打分、不宣称设计通过、不改写 Design.md、不建第五真相或新 gate。来源：现有 `plan-design-review`、`frontend-testing`、`isolated-browser-qa`、Design.md 研究，以及 Figma Code Connect、Storybook visual/a11y、DTCG 和 W3C 人工无障碍评估资料。
- 最终确认修订新增前端质量专项 research：现有 `plan-design-review`、testing blueprint、`frontend-testing` 和 verify-code 没有统一的 UI phase 组件化合同。建议新增 `frontend-component-quality`，把 `reuse`、`modify`、`extend-state/variant`、`add-local`、`extract-shared`、`remove-after-no-consumers` 的真实 consumer/兼容/状态/CSS/type/test/browse/a11y/perf 事实接到既有 Build-plan、Build-code、Verify-code；命令由 `ui-project-init` 探测，缺失如实 `N/A + 原因`。React、TypeScript、Storybook、Playwright、Next.js 官方资料支持这些边界；AgentHub 只借发现方法，不搬未接 CI 的 design-fidelity 合同。
- 按宪法 S1/S2/S3/S6 的外部优先研究：通过 AnySearch 和官方上游核实 Vercel 官方 MIT `react-best-practices`（metadata `version=1.0.0`、70 条 React/Next 性能规则）；当前 pin 为 commit `dd089a8c752c966dee8bf0f27cb625ba193ffd9e`，路径见 D-025。它直接作为 React/Next adapter 借用，按迭代时检查 upstream HEAD。通用跨框架部分没有在本次搜索中发现可直接搬用且覆盖组件操作/消费者/CSS owner/五阶段事实边界的成熟 skill，因此 `frontend-component-quality` 只做窄适配：复用外部 code-lens 与 React/TypeScript/Storybook/Playwright 官方实践，自己不复制性能规则、不新建执行器或 gate。

## grill

- 已完成。第一轮确认历史项目的 Design.md 初稿必须经 design owner 确认才可绑定；第二轮确认 `design-source-readiness` 生成 Screen Read Map 与缺项事实，不作评分或自动通过。没有剩余会改变方向的 frontier。
- requirement coverage：`goal`（R-001/R-002）、`flow_or_surface`（R-004、D-010、D-015/D-016）、`data_or_state`（R-004、D-013/D-017）、`success_failure_acceptance`（D-003/D-008/D-012/D-013）、`constraint_non_goal_defer`（R-003/R-006、D-009/D-014）均已覆盖。
- exit checks：外部接口真实定义=pass（Figma/Storybook/Playwright/DTCG/W3C 官方资料）；唯一命名=pass（CONTEXT.md 已定义 UI Contract、Design.md、design-source-readiness、ui-project-init）；失败语义=pass（设计未就绪、绑定失效、遗留边界不可控均已写明）；范围边界=pass（不改 F11、不加后台、不全仓自动重构、不加第五材料）。

## 审查处置

- 方向 advice 已完成：两个独立来源均可用；结果事实为 `quality/reviews/results/make-decision-direction-c3778aad57e4a5568234fcafac6d09cd8fa61593-63ae8d97-d244-49c9-815e-fe569c2fe8cb.json`。这是建议，不是通过结论。
- 细审 advice 已完成：三个独立来源均可用；结果事实为 `quality/reviews/results/make-decision-detail-1befaa9b5424a59f558b6a7cb2a53cf675034430-e2473856-25e5-4145-8309-42a86b751b0d.json`。八项发现均已在当前决策草案中做实际修复；不为追求空 findings 重跑未变更审查。
- 修订 focused detail advice 已完成：三个独立来源均可用；结果事实为 `quality/reviews/results/make-decision-detail-d01e83b6fb7c38409b68ab4d202fd9efff168244-8e8ec6df-b82e-4685-a061-e7fd64986fb5.json`。该 packet 为聚焦 D-024/D-025 的验收投影，遗漏了先前已写入全文的若干流程细节；所有指出的实质缺口仍由 D-026 逐项收口，投影遗漏不被改写为 provider 空结果。

| finding_id | 原始事实/后果 | source | status | next_action / owner | consumer / retain |
| --- | --- | --- | --- | --- | --- |
| F-2901efde1efe | 尚未冻结工作流使用者旅程、页面范围、数据状态、成功/失败边界、非目标与延期，会导致机制不对准真实 F11 问题。 | codex/luna，direct | fixed | D-009 至 D-017 已确定自动适用、无新增后台、完整状态矩阵、新旧项目入口、失败与延期边界 | Build-spec；保留原 review ref |
| F-bd82f00b5a45 | 未规定 UI Contract 的自动适用范围，可能让纯后端任务被卡住，或重新出现 caller 伪报非 UI。 | opencode/k3，direct | fixed | D-009：可信 UI 事实/变更自动触发，调用方不能降级 | Runtime/spec validator；保留原 review ref |
| F-0f6ab1c618bc | Preview 缺少最小证据和 Design.md 变化后的失效规则，人工确认仍可能变成空口确认。 | codex/luna，direct | fixed | D-013、D-026：全局 revision、固定证据与失效重确认 | Build-spec evidence contract；保留原 review ref |
| F-5af7bcbeb2cc | 无既有组件或 Preview 载体的项目没有入口，会迫使设计再次滑入 Build-code。 | opencode/k3，direct | fixed | D-011：绿地/无载体先外部设计，不写临时 Preview 组件 | Build-spec UI loop；保留原 review ref |
| F-64f97d1b385d | 设计工具回流和 Preview 载体尚未在真实非 F11 项目验证，不能当作无条件可用。 | codex/luna，direct | accepted_risk | D-014：保持当前实现范围，首个未来非 F11 UI 任务完整验证；authority=用户 | Build-plan rollout；保留原 review ref |
| F-decb3986ec3a | 整份 `Design.md` content hash 可能让常规设计迭代产生无意义重绑。 | opencode/k3，direct | accepted_risk | D-026：用户选择唯一全局 revision；任意改变均重确认，避免双模型 | Build-spec evidence contract；保留原 review ref |
| F-273ec765a090 | 外部设计提示词、回流、重新绑定和失败出口缺失。 | opencode/k3，direct | fixed | D-024：简短 prompt、整份项目 Design.md 回传和 revision 重确认 | Build-spec UI loop；保留 detail review ref |
| F-28482b8fcf0d | 新 UI 名词可能另起合同和证据流。 | codex/luna，direct | fixed | D-023 + D-024：spec UI Contract、项目级派生 Read Map、既有证据路径及各自 owner | Build-plan/Verify-code；保留 detail review ref |
| F-33fc65ee53cc | 新旧初始化和 source readiness 缺规格/验收边界。 | antigravity/flash，direct | fixed | D-021：明确两项技能最小输入/输出/状态 | Build-plan；保留 detail review ref |
| F-64674ab72025 | 能力清单未构成端到端用户流程，new/legacy 未汇合。 | codex/luna，direct | fixed | D-020：六步 UI 交付流程合同 | 五阶段 skill；保留 detail review ref |
| F-9792f9761504 | first-page 选择/排除/停止规则不清，遗留改造会扩范围。 | codex/luna，direct | fixed | D-020 与 D-030：低耦合候选规则；不可限界记录 not_ready、风险和缩小建议，人工确认后可继续，延期需用户明确选择 | ui-project-init legacy；保留 detail review ref |
| F-afefb582e18b | 状态没有行为、迁移、恢复、权限和失败出口，无法验收。 | codex/luna，direct | fixed | D-023：状态行为矩阵和断言要求 | Build-spec UI Contract；保留 detail review ref |
| F-b5eb5464181b | 外部设计回传没有 prompt/引用/重绑结构。 | codex/luna，direct | fixed | D-024：回传项目 revision/外部来源并重新确认 | Build-spec UI loop；保留 detail review ref |
| F-ba7231a7c7b7 | 组件/CSS 质量只写 owner，无法打破低质实现。 | opencode/k3，direct | fixed | D-025：组件动作、真实 consumer、CSS owner/token、实际检查和外部 React/Next code-lens | Build-plan/Verify-code；保留 detail review ref |
| F-02bfa7c82d47 | 外部回流再要求外部产物引用，会形成额外事实面。 | antigravity/flash，direct | fixed | D-026：只接受整份项目 Design.md 新 revision | Build-spec；保留 focused review ref |
| F-359f1d769120、F-e20e671d7dfb | 流程、范围、状态、失败/延期若只散落在机制说明中，容易再次下沉。 | codex/luna、antigravity/flash，direct | fixed | D-026 及“已冻结交付/验收接口”完整写明，不交给 Build-spec 猜 | make-decision → Build-spec；保留 focused review ref |
| F-523a0b1cc84d | UI phase 质量字段没有可判断的结构。 | codex/luna，direct | fixed | D-026：Component Quality Map 必填字段和失败条件 | Build-plan/Build-code；保留 focused review ref |
| F-5d4e1cc51e8e | Verify-code 的真实 consumer/兼容/CSS 泄漏检查没有独立验收。 | opencode/k3，direct | fixed | D-026：Verify-code 的实际检查义务 | Verify-code；保留 focused review ref |
| F-6632bc6f1ee7、F-eb6f55ddf9f2 | Design.md revision、Preview、用户确认的绑定和失效规则不完整。 | codex/luna、opencode/k3，direct/minor | fixed | D-026：唯一 design_revision、记录位置、失效后重走 | Build-spec；保留 focused review ref |
| F-77ee095c5b43、F-954f94089324 | legacy first-page 与 new/legacy 初始化验收不完整。 | opencode/k3、antigravity/flash，direct | fixed | D-026：盘点输出、低耦合判定、not_ready 边界 | ui-project-init；保留 focused review ref |
| F-ebca6a6291e2 | UI/non-UI/unknown 判定和 unknown 处理不够可验证。 | codex/luna，direct | fixed | D-026：三态输入、结果和澄清出口 | Build-spec；保留 focused review ref |
| IFR-001..003 | 全局/section 冲突、外部来源不可核查、新技能缺调用/删除边界。 | 独立 focused reviewer，direct | fixed | D-026：全局 revision、上游 pin、唯一 owner/consumer/fixture/removal | Build-plan/Build-code；保留 reviewer output |

## 最终确认

- 状态：accepted
- 生效规则：本节是唯一当前确认状态；D-001 至 D-030 内的“最终阶段确认 pending”是写入时的历史状态，不得被下游当作未确认。下游只读取本节及最新 human-confirmation 事实。
- 用户原文与 host-visible 绑定：用户在本会话先确认一个公开 `frontend-component-quality` 入口，随后明确回复：`好的，继续`。
- 确认范围：D-001 至 D-027 的当前生效语义，包括项目级 `Design.md` revision、Build-spec Preview 回路、新旧项目最小入口、组件/CSS 质量合同、React/Next 外部只读规则依赖、非目标与延期。
- 下游不得猜测：Build-spec 必须消费本记录已冻结的页面范围选择、状态矩阵、失败/恢复、设计 revision、Preview 确认和 Component Quality Map；不得重新把 UI 设计或组件质量决策推迟到 Build-code。

## 拒绝方案

- 尚无用户拒绝方案。

## 风险与延期交接

| risk/deferred_id | 风险或延期内容 | 触发/后果 | 处理阶段/owner |
| --- | --- | --- | --- |
| DEFER-001 | PaperBuilder 全量前端重构 | 新流程稳定前开始会重演 F11 式补丁循环 | 后续独立 PaperBuilder 任务 |
| RISK-001 | 过度照搬 AgentHub | 引入双真相、软 gate 和复杂运行状态 | make-decision 后续决策 |
| RISK-002 | Design.md 与代码双写 | token/props/story/截图漂移，设计源失真 | D-002 / build-spec 约束 |
| RISK-003 | 伪报非 UI 或旧视觉证据 | 未做真实 UI QA 却宣称完成 | D-003 / runtime evidence 约束 |
| RISK-004 | build-spec 未形成可见设计就交给 build-code | 设计/代码混杂，可能回到截图补丁循环；但不能把它变成阻断 gate | D-030 / build-spec 记录风险与人工确认 |

## 质量边界

- 质量事实：调研、浏览器、截图、review 均记录事实；不等于推进许可证。
- 推进资格：当前四份材料可读时，同任务可继续修复。
- 完成判据：由当前阶段真实 Talk、review、确认和 stage-end analysis 决定。
- 不可逆授权边界：commit、merge、push、archive 另需用户授权；本任务当前没有这些授权。

## 后续细化（不改变方向）

| item_id | 内容 | 原因 | 谁在何时解决 |
| --- | --- | --- | --- |
| FWD-001 | `Design.md` revision 记录字段 | 让 Preview 可指向项目设计源版本 | Build-spec；owner=UI Contract parser |
| FWD-002 | CSS 规则的项目级阈值 | 各项目 lint 能力不同 | Build-plan；owner=UI delivery skill |

## Supersedes

- none

## 文档结果

- CONTEXT.md：changed；新增 UI Contract、设计源（Design.md）、设计源就绪检查（design-source-readiness）、UI 项目初始化（ui-project-init）、前端组件质量（frontend-component-quality）的唯一术语定义。
- ADR：created；`docs/adr/0015-ui-design-source-and-initialization.md` 记录 Design.md 外部设计源、两种初始化模式和非评分就绪检查的组合边界。
- ADR：created；`docs/adr/0016-external-first-frontend-component-quality.md` 记录外部优先、React/Next 直接借用与跨框架薄适配边界。
- ADR criteria：难以反转=true（改变当前材料/设计权威与新旧项目入口会影响所有 UI 任务）；无背景会意外=true（未来读者可能错误把 Design.md 变第五材料、把 Read Map 当 pass，或重写已成熟外部规则）；存在真实取舍=true（拒绝后台、全仓自动重构、评分 CI、第二合同与自建完整前端规则库）。
- 术语/ADR 冲突及处理：已处理；D-026 将旧 section/revision 语义改为唯一项目 `design_revision`，UI Contract 只记录该 revision 和任务页面/状态。
- 不复制 spec 的边界：本记录只保留决策索引；页面、接口、任务和测试细节后续归各自 owner。

## Exit checks

- 上下文一致：pass；唯一术语已写入 CONTEXT.md。
- owner/接口一致：pass；Design owner、Build-spec、Build-plan、Build-code、Verify-code 与前端质量 skill 的唯一调用/移除边界已在 D-008 至 D-026 索引。
- 失败语义明确：pass；缺设计来源/Preview 事实、绑定失效、不可控历史耦合均不能冒充设计完成。
- 范围与延期明确：pass；F11/PaperBuilder 不改、无后台/第五材料/全仓改造，首个未来非 F11 UI 任务验证已登记。

## 决策修订（用户补充确认）

以下三项是对细审发现的真实补充回答。旧决定和审查原文保留为历史；本节是当前生效语义。

### D-028
- question/final_option: Preview 或设计结果由谁确认？ / A：只要有人工确认即可，不额外记录负责人。
- recommendation/plain_language: 采纳；确认人不需要再维护一套 owner 身份资料。
- decision: UI 设计是否可以继续由人工确认决定；确认记录只保留确认结果和当前材料引用，不要求保存负责人字段。
- source_type/reference/exact_excerpt: 用户当前回复：`1：A，不用记录负责人，只要有人工确认就可以`。
- approval_binding: 当前用户回复已确认；host-visible ref=`host-message://codex/msg_01a0280e-fc75-71d1-9831-e5cc07607ad0`；reply_hash=`398e4766f2d8e9c3f01f4d710c389cf8dff4752a5bd535c2ddc707ef8c40ad2f`。
- facts_and_constraints: 用户需要低摩擦流程；不能新增 Design owner 资料面或第二身份来源。
- Logic: 人工确认 -> 记录结果 -> 继续当前任务；不维护额外负责人字段 -> 减少绑定和维护成本。
- choice_reason/impact: 保留人的设计判断，同时删除不影响推进的身份元数据。
- consequences_and_risks: 无法从记录得知具体确认人；后续审查只能以确认事实和材料为依据。
- rejected_alternatives: 要求记录 Design owner 会增加身份维护；自动批准会丢失用户意图。
- unresolved_items/owner: 无方向级未决项；确认记录字段归 build-spec 细化。
- Supersedes: D-008 中“必须由指定设计负责人确认”的新增解释，以及 D-026 中隐含的 owner 绑定要求；用户人工确认语义保留。

### D-029
- question/final_option: `design_revision` 用什么身份？ / A：记录 `Design.md` 的版本号。
- recommendation/plain_language: 采纳；版本号足以让人知道使用的是哪一版，不再引入哈希计算。
- decision: `Design.md` 只记录项目自己维护的版本号；不要求 SHA-256、blob hash 或 section hash。没有 `Design.md` 或版本号时记录缺失事实，不伪造版本。
- source_type/reference/exact_excerpt: 用户当前回复：`2：没必要搞什么SHA-256，纯粹是增加复杂度，记录Design.md的版本号就可以`。
- approval_binding: 当前用户回复已确认；host-visible ref=`host-message://codex/msg_01a0280e-fc75-71d1-9831-e5cc07607ad0`；reply_hash=`398e4766f2d8e9c3f01f4d710c389cf8dff4752a5bd535c2ddc707ef8c40ad2f`。
- facts_and_constraints: Design.md 是项目级人工设计源；用户明确拒绝复杂哈希绑定。
- Logic: 项目版本号 -> spec/Preview 可读引用 -> 人工确认补足判断 -> 不增加内容寻址复杂度。
- choice_reason/impact: 降低使用和维护成本；影响 UI Contract 的 revision 字段和回流记录。
- consequences_and_risks: 版本号可能被误改或重复；需要在现有 review/人工确认事实中保留版本文字，不把它当密码学新鲜度证明。
- rejected_alternatives: SHA-256 增加复杂度；section hash 会重新引入双重设计源。
- unresolved_items/owner: 版本号格式和缺失文字归 build-spec 细化；不得升级为哈希规则。
- Supersedes: D-026 中关于 blob hash、UTF-8 SHA-256 和 hash 失效的当前语义；项目级 Design.md 与 UI Contract 分离语义保留。

### D-030
- question/final_option: 没有设计稿、Preview 不可用或用户不满意时能否继续？ / C：不要让任何 gate 阻止任务推进，人工确认即可。
- recommendation/plain_language: 采纳；设计事实仍要如实记录，但它不是任务继续工作的闸门。
- decision: Build-spec 尽力用真实组件、fixture 和 Preview 形成设计事实；没有设计稿、Preview 不可用或用户不满意时，仍可在记录限制和风险后继续，前提是存在人工确认。不得把 `Design.md`、Read Map、Preview、截图或 revision 缺失改写成设计完成，也不得因这些事实自动停止 Build-plan/Build-code。
- current_status: D-029 取代原问题中的 hash 方案；D-030 的当前版本是项目版本号、人工确认和风险记录，不设置推进 gate。
- source_type/reference/exact_excerpt: 用户当前回复：`3：C，不要因为任何gete阻止任务的推进，没有设计稿也可以推进。人工确认即可`。
- approval_binding: 当前用户回复已确认；host-visible ref=`host-message://codex/msg_01a0280e-fc75-71d1-9831-e5cc07607ad0`；reply_hash=`398e4766f2d8e9c3f01f4d710c389cf8dff4752a5bd535c2ddc707ef8c40ad2f`。
- facts_and_constraints: 用户明确要求没有设计稿也可推进；质量事实与推进资格仍是两件事；F11 的风险是设计被悄悄伪装完成，不是继续工作本身。
- Logic: 设计资料缺失 -> 记录 unknown/unavailable 和风险 -> 人工确认 -> 继续同一任务；不把缺失改写成通过。
- choice_reason/impact: 消除等待外部设计工具造成的硬阻塞，同时保留诚实的质量边界。
- consequences_and_risks: Build-code 可能在设计信息不足时返工；Build-plan 必须把缺口、假设、截图和后续补强写清楚。
- rejected_alternatives: 强制 Preview/Design.md 才能继续会造成 gate；自动把缺失当通过会伪造质量。
- unresolved_items/owner: 缺失设计下的最小 UI Contract 字段归 build-spec；具体补强和测试证据归 build-plan/build-code。
- Supersedes: D-003、D-005、D-007、D-008、D-026 中把设计资料或 Preview 作为继续推进前提的当前语义；保留真实组件优先、不得把缺失写成设计完成、Build-code 不负责重新设计等约束。

### 当前生效流程边界

- `Design.md` readiness、Preview、截图、版本号和人工确认都是质量/设计事实；它们不再是推进许可证。
- 有真实组件和 fixture 时先做 Preview；没有时可以继续，并记录 `unknown`/`unavailable`、风险和人工确认。
- 人工确认允许进入后续阶段；缺失设计不得宣称设计已完成，后续阶段必须继续暴露返工风险。
- legacy 盘点仍需尽量记录 route/container/consumer/CSS 影响范围；范围未知是风险事实，不是自动停止条件。
- 最小设计事实至少记录：`design_status`（`ready`/`not_ready`/`unknown`）、缺失项及原因、限制/假设、返工风险、Preview/fixture/viewport/screenshot/version 的引用或 `N/A + 原因`、人工确认结果和当前材料引用；不记录负责人字段，不用 SHA-256。
- 人工确认结果至少区分 `approved`（可标记 `design_status=ready`）、`acknowledged`（确认已知缺口/风险但继续，`design_status` 保持 `not_ready`/`unknown`）和 `not_approved`（仍可在记录风险后继续，不能标记 ready）；不保存确认人身份。没有 Design.md/Preview 时的降级设计来源必须写明 `fallback_visual_basis`（已有组件/默认样式/用户文字方向/其他当前材料之一）、选择理由、限制和返工风险；Build-plan 必须绑定这些选择，Build-code 不得无记录地重新设计。

### 当前技能最小调用合同

- `ui-project-init new|legacy`：输入为原始 UI 范围、技术栈和项目盘点事实；`new` 必须返回项目级 `Design.md` 的实际路径、初始版本号和可读取状态；尚未创建时返回缺失事实、`fallback_visual_basis`、风险和 readiness 的待输入，不伪造路径或版本。输出还包括组件/样式边界、fixture、viewport、Preview/截图实施卡、first-page/耦合风险和人工确认。缺字段、路径不可读或没有可限界候选时输出 `unknown`/`not_ready`、原因和缩小建议；唯一消费者是 UI 适用的 Build-spec。
- `design-source-readiness`：输入为整份项目 `Design.md`（若存在）、项目版本号和当前材料引用；输出 Screen Read Map、`binding_state`、缺项代码、证据引用、人工待答项和版本一致性事实。缺文档/版本/引用或版本变化时输出 `unknown`/`not_bindable`，不伪造 ready；消费者是 Build-spec UI 分支和既有 `plan-design-review`。
- `frontend-component-quality`：输入为 Component Quality Map、真实 diff/consumer、状态/typed ViewModel、CSS/token、项目实际命令与现有浏览器/截图事实；输出组件动作、consumer/兼容性、命令结果、browser/a11y/perf 和 CSS 泄漏事实，或 `N/A + 原因`/`unknown|unavailable`。缺字段、无真实 consumer、共享抽取少于两个 consumer、无命令且无 N/A 原因都应产生可检验失败；唯一公开入口是该 skill，消费者是 Build-plan、Build-code、Verify-code。
- UI 适用判定负例必须覆盖：caller 试图把命中的用户可见事实降级为 `non_ui`、三类输入冲突、来源缺失/未知；输出保留命中来源和理由，结果为 `ui` 或 `unknown`，不得静默降级。
- 生命周期规则：Build-spec 进入 UI 分支前必须做一次适用判定；Build-plan 前、以及任何新增/删除页面、路由、模板、组件或样式影响时必须重新判定。`non_ui → ui` 重新进入 `ui-project-init`/UI Contract；`unknown → ui` 先补来源再继续；`ui → non_ui` 只有三类输入均明确非 UI 且保留依据才允许，caller 不能降级。范围变化只扩大影响面记录，不自动扩大用户目标 surface。

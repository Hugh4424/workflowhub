# Decision Log

## 原始需求

| source_id | 原始需求/约束 | 来源引用/原文摘录 | 关联 D/处理状态 |
| --- | --- | --- | --- |
| R-001 | 消除内部内容靠猜、材料自己拒绝自己、声明能力未真正生效、错误到很晚才出现的问题。 | "默认可走、早失败、可继续修复的最小治理执行链。" | D-006：四类均保留，每类最小修复。 |
| R-002 | WorkflowHub 是让用户方便完成五个正常步骤的简单框架。 | "workflowhub是一个简单的VibeCoding框架，让我可以很方便的进行make-decision、build-spec、build-plan、build-code、verify-code等工作。" | 已覆盖；不增加第六步。 |
| R-003 | 不能用更多复杂步骤和黑话解决问题。 | "workflowhub做到这种程度已经可以宣称失败了"。 | 已覆盖；D-002、D-009。 |
| R-004 | 正式任务前必须有正确位置的独立工作目录。 | "worktree创建错位置了。" | 已覆盖；D-003 至 D-005、D-007 至 D-008。 |
| R-005 | 每项改动须先由用户确认。 | "所有改动需要我确定，避免增删一些不必要的内容和流程"。 | 已覆盖；D-009。 |
| R-006 | 不做 UI、归档任务返工、额外步骤或额外长期记录。 | 原始需求中的非目标清单。 | 已保留。 |
| R-007 | 对新增页面或明显改变布局、交互、状态、响应式结构的 UI 任务，必须在 build-spec 产出并展示当前设计；用户批准当前版本后才能继续。 | "如果有ui改动，应该在build-spec阶段就把UI设计定稿"；Talk 回复 "1-2 / 2-1"。 | 当前范围；D-010、D-011。 |
| R-008 | 新增范围必须加入当前任务，并从受影响的 make-decision 开始重新收敛，不另建任务或恢复流程。 | 用户选择 "B"。 | 当前范围；D-012。 |

## 目标、用户流程与边界

- 目标：用户只看五个正常步骤、当前结果和可行动的错误；不猜内部名称，不等到最后才发现失败。
- 用户流程：提出需求并选定项目 → 系统在该项目旁建好任务目录 → 共同定方向 → 写说明 → 拆计划 → 编码 → 核验。目录、分支和内部参数不是用户步骤。
- 页面范围：本任务不实现产品页面；但治理运行时必须覆盖条件 UI 路径。新增页面或明显改变布局、交互、状态、响应式结构时，build-spec 必须完成当前设计展示与批准；文字和局部样式修正不要求原型。
- 数据/状态：只认四份当前材料；任务可进行中、遇错待修、修好继续或完成。旧记录和审查只保留事实。
- 成功：独立目录在正式开始前已存在；原四类问题各有一个小且可验证的修复或早报错；UI 任务的当前设计在 build-spec 真实产出、展示并获批；同一任务能继续修。
- 失败：没有目录却显示开始；把临时目录当项目；材料被自身拒绝；声明无正式消费者；错误拖到发布；或新增需要用户学习的流程。

## 非目标

- 不重做已归档 UI/fullstack contract，不做 UI、前端业务、真实浏览器 QA 或下游验收。
- 不新增阶段、公共命令、Runner、持久任务对象、第五份核心材料、第二套状态机、永久兼容桥或硬性质量关卡。
- 不改写历史事件或 review，也不把质量缺口写成通过。
- 不在本任务实现任何产品 UI，不把设计原型当生产代码或浏览器 QA，不让旧回复、旧设计或文件存在冒充当前设计批准。

## 决定

### D-001
- question/final_option: 启动问题先如何处理 / 在原任务内做最小修复，不重开五步骤任务
- recommendation/plain_language: 推荐；先恢复正常开始，再完成真实方向梳理
- decision: 已在独立分支验证删除“把临时目录当旧任务目录”的错误判断；当前分支尚未自动带入
- source_type/reference/exact_excerpt: 代码复现与用户提问："是窄修复还是重新开始五阶段？"
- approval_binding: 用户确认继续原任务 Talk；实现仍逐项确认
- facts_and_constraints: 首次记录无法写入；已有验证修复；当前任务分支从主项目当前版本开始
- Logic: 启动误判 -> 普通任务无法开始 -> 删除错误推断 -> 可建立独立目录
- choice_reason/impact: 不新增入口或长期记录；只影响启动判断
- consequences_and_risks: 未带入当前分支就不能声称启动问题已交付
- rejected_alternatives: 重开新任务；兼容兜底掩盖错误
- unresolved_items/owner: D-008 规定带入；实施前用户确认具体 diff
- Supersedes: none

### D-002
- question/final_option: 完整修复与框架简单冲突时优先什么 / 简单可用优先
- recommendation/plain_language: 推荐；能删或合并旧规则才做，必须另造流程则延期
- decision: 用户选择 1；所有改动先由用户确认
- source_type/reference/exact_excerpt: 用户真实回答："1，所有改动需要我确定，避免增删一些不必要的内容和流程"
- approval_binding: 本轮真实回答；最终批准见最终确认
- facts_and_constraints: 原始目标是最小、默认可走、早报错、可继续修复
- Logic: 用户反对复杂化 -> 只提直接可解释的改动 -> 无法简单解决的内容延期
- choice_reason/impact: 约束后续实现和文档
- consequences_and_risks: 防范围膨胀；困难项可能延期
- rejected_alternatives: 本次补齐一切；整体重整五步骤
- unresolved_items/owner: none
- Supersedes: none

### D-003
- question/final_option: 独立目录何时必须创建 / 创建正式任务时就必须成功
- recommendation/plain_language: 推荐；失败立刻说明，不允许假开始
- decision: 用户选择 1；目录未创建成功时不能进入正式 make-decision
- source_type/reference/exact_excerpt: 用户真实回答："1"
- approval_binding: 本轮真实回答；实现方案 pending
- facts_and_constraints: 旧流程先建任务记录，第一次正式操作才建目录
- Logic: 开始与目录脱节 -> 用户无法验证任务存在 -> 目录成功成为正式开始条件
- choice_reason/impact: 只调整启动时机，不增加用户步骤
- consequences_and_risks: Git 环境问题更早暴露，必须先修环境
- rejected_alternatives: 首次写记录或写代码时再创建
- unresolved_items/owner: 最小实现和测试；实施前用户确认
- Supersedes: none

### D-004
- question/final_option: 目录以哪里为起点 / 主项目旁创建任务分支，不写死绝对路径
- recommendation/plain_language: 采纳用户回答；项目可移动，规则不能把一台电脑的路径当永久答案
- decision: 不能把 Agent 临时目录当项目起点；身份失败或有歧义时，正式开始前报错
- source_type/reference/exact_excerpt: 用户真实回答："不要固定，分支应该基于主项目位置创建平行分支"
- approval_binding: 本轮真实回答；身份来源由 D-007 确认
- facts_and_constraints: 本次传入 Codex 临时目录，旧规则只会在该目录旁机械创建
- Logic: 临时目录不是项目 -> 同级目录落错 -> 验证项目身份 -> 在主项目旁创建
- choice_reason/impact: 用户不必每次选择技术目录
- consequences_and_risks: 身份识别不可靠会重现错误，不能猜测或回退
- rejected_alternatives: 固定绝对路径；每次让用户选目录；继续用临时目录
- unresolved_items/owner: none
- Supersedes: none

### D-005
- question/final_option: 当前错误目录如何处理 / 在主项目旁重建同一任务分支并保留记录
- recommendation/plain_language: 执行用户明确请求；不新建任务、不丢记录、不改主项目
- decision: 已移除错误的 Codex 临时目录；在主项目旁重建同名任务分支；迁移前后决策记录 SHA-256 相同
- source_type/reference/exact_excerpt: 用户真实指令："请重新创建worktree吧"
- approval_binding: 本轮真实指令
- facts_and_constraints: 正式事实库为空；错误目录只有决策记录；主项目分支未改动
- Logic: 错误位置确认 -> 用户授权重建 -> 先保留相同记录 -> 再移除错误目录
- choice_reason/impact: 任务编号不变，物理位置正确
- consequences_and_risks: 当前分支从主项目开始；启动修复不能自动混入
- rejected_alternatives: 直接移动且不校验；保留错误目录
- unresolved_items/owner: none
- Supersedes: none

### D-006
- question/final_option: 四类原始问题只修目录还是都保留 / 全部保留，每类只做一个最小修复
- recommendation/plain_language: 采纳用户选择；不漏原始问题，也不借机重做框架
- decision: 本任务包含四项：统一 `spec-specify`、`spec-analyze`、`spec-tasks` 的生产格式与唯一结束判断；正式开始时校验目录、身份和事件；为 `wh-review detail` 提供正式最小输入与清楚诊断；让已声明 Skill 有正式 handler 消费。每项只接受减少猜测、提前报错或支持同任务修复的改动。
- source_type/reference/exact_excerpt: 用户真实回答："A1"
- approval_binding: 本轮真实回答；具体代码或文档改动仍需用户确认
- facts_and_constraints: R-001 四类缺口不能缩成目录问题；禁止新流程、新对象和长期兼容层
- Logic: 四类缺口 -> 每类一个最小可验证行为 -> 不加新步骤 -> 默认路径恢复可用
- choice_reason/impact: 覆盖原始需求；只影响治理运行时
- consequences_and_risks: 任何需要新流程的候选改动改列延期
- rejected_alternatives: 只修目录；重写五阶段；每类另起控制流程
- unresolved_items/owner: 每项 diff、测试和是否值得做，实施前用户确认
- Supersedes: none

### D-007
- question/final_option: 系统怎样知道主项目 / 使用用户启动任务时选定或说明的项目及该项目会话；缺失或模糊就早报错
- recommendation/plain_language: 采纳用户选择；用户已在项目中开启会话，系统不应再猜电脑当前目录
- decision: 项目身份唯一来自当前会话的用户选定/说明项目上下文，不是 Agent 当前目录、临时 checkout 或文件系统猜测。无法唯一确定时，任务不开始，并给出可行动的报错。
- source_type/reference/exact_excerpt: 用户真实回答："B1，一般我在任务开始时会说明项目，也会在对应项目中开启会话，确定当前会话的项目还是很容易的"
- approval_binding: 本轮真实回答；实现接口和错误文案待确认
- facts_and_constraints: 用户已提供稳定人类上下文；本次错误来自把 Codex 临时目录当项目
- Logic: 用户选定项目 -> 会话已知项目 -> 只用该上下文 -> 缺失/歧义停止并说明 -> 不会落错位置
- choice_reason/impact: 不增加每次选目录的步骤，也不固定机器路径
- consequences_and_risks: 宿主必须实际传递会话项目上下文；缺失时早失败而非偷偷建错目录
- rejected_alternatives: 当前目录猜测；固定绝对路径；每次输入目录
- unresolved_items/owner: 启动入口如何接收现有会话项目上下文，实施前确认
- Supersedes: D-004 的“身份来源待确认”

### D-008
- question/final_option: 已验证启动修复怎样进入当前任务 / 带入当前正确位置的任务分支，不重做、不静默丢弃
- recommendation/plain_language: 采纳用户选择；沿用已验证的最小修复，再在当前分支复测
- decision: 后续实施时，把已验证的启动修复带入当前正确位置的任务分支；先检查和当前主项目版本的兼容性，再以最小改动复测。现在仍处于 make-decision，不提前写功能代码。
- source_type/reference/exact_excerpt: 用户真实回答："C1"
- approval_binding: 本轮真实回答；实际带入 diff 仍需用户确认
- facts_and_constraints: 已验证修复只处理临时目录误认旧目录的启动判断；当前任务分支从主项目当前版本创建
- Logic: 已有验证修复 -> 当前任务仍缺该修复 -> 用户选择带入 -> 复测同一最小行为
- choice_reason/impact: 避免重做，也避免自动混入旧分支
- consequences_and_risks: 可能出现小的合并差异；超出最小改动就停止并交用户决定
- rejected_alternatives: 从头重写；静默自动合并；放弃修复
- unresolved_items/owner: 实施前展示 diff 与复测，由用户决定
- Supersedes: D-001、D-005 中“是否带入待确认”

### D-009
- question/final_option: 用户确认会不会成为每个正常任务的新步骤 / 不会；它只约束本次治理改动的实施授权
- recommendation/plain_language: 推荐；保留你对本次改动的控制，不把审批塞进普通五步骤
- decision: 后续每个功能或文档改动先给用户看目的、最小范围和风险再实施；这不是第六个阶段，也不改变正常用户的五步骤。
- source_type/reference/exact_excerpt: 用户真实回答："所有改动需要我确定，避免增删一些不必要的内容和流程"
- approval_binding: 本轮真实回答
- facts_and_constraints: R-002 要求默认五步骤可走；R-005 要求本次改动受用户确认
- Logic: 本次变更需要把关 -> 实施前确认 -> 不写进通用流程 -> 正常任务仍五步骤
- choice_reason/impact: 防止借治理名义扩大框架
- consequences_and_risks: 本任务实施多一次确认；若产品化则违反范围
- rejected_alternatives: 自动实施所有建议；把用户审批做成常驻阶段
- unresolved_items/owner: none
- Supersedes: D-002 的“确认边界待明确”

### D-010
- question/final_option: 哪些 UI 改动必须先完成设计 / 新增页面或明显改变布局、交互、状态、响应式结构时必须；文字和局部样式修正不要求原型
- recommendation/plain_language: 推荐；把真正会造成返工的 UI 变化拦在 build-spec，小修不增加负担
- decision: 条件 UI 范围采用“实质性 UI 改动”边界，不把所有可见文字和颜色微调都升级为设计任务
- source_type/reference/exact_excerpt: 当前会话 Talk Round 1；用户真实回复："1-2"
- approval_binding: 当前宿主会话真实回复；最终范围确认待本轮 make-decision 完成
- facts_and_constraints: T05 证明新页面可以在没有可见设计的情况下被记录为已完成；用户同时要求 WorkflowHub 保持简单
- Logic: 实质性 UI 改动返工风险高 -> build-spec 先定稿 -> 小修保持轻量 -> 兼顾质量和简单性
- choice_reason/impact: 影响 UI applicability、build-spec 条件路径和测试场景；非 UI 与轻微修正不受影响
- consequences_and_risks: 需要明确判定实质性变化；边界不清时必须保留 unknown 并回当前任务确认
- rejected_alternatives: 所有可见改动都出原型，成本过高；只约束新页面，会漏掉现有页面的大改
- unresolved_items/owner: 设计产物格式和权威边界待 Talk Round 2
- Supersedes: R-006 中“完全不处理 UI 治理路径”的范围解释；仍不实现产品 UI

### D-011
- question/final_option: 当前设计未获批准时能否继续 / 不能，继续留在 build-spec 修改或等待外部设计
- recommendation/plain_language: 推荐；这直接落实“设计定稿后才能继续”，避免把返工推给 build-code
- decision: UI 条件路径只有当前设计版本已经展示且得到用户明确批准，才能声明 build-spec 的 UI 设计工作完成；旧回复、带风险继续和延后到 build-plan 都不能代替
- source_type/reference/exact_excerpt: 当前会话 Talk Round 1；用户真实回复："2-1"
- approval_binding: 当前宿主会话真实回复；最终范围确认待本轮 make-decision 完成
- facts_and_constraints: 当前 validator 接受未绑定设计版本的 acknowledged；build-spec handler 和完成条件不消费 UI 设计事实
- Logic: 没有当前设计和当前批准 -> 不能证明定稿 -> 保持 build-spec 未完成 -> 修改后同任务继续
- choice_reason/impact: 为 UI 任务增加条件设计确认，但不新增第六阶段；需要同步现有宪法中 build-spec 无日常确认的绝对表述
- consequences_and_risks: UI 任务会真实等待用户看稿；设计工具不可用时只能提供外部提示词并等待返回
- rejected_alternatives: 允许带风险继续，会违背本次要求；推迟到 build-plan，会保留当前缺口
- unresolved_items/owner: 宪法最小修订文字由本轮最终方向统一确认
- Supersedes: 现有 UI loop 的 human_acknowledged 可继续语义

### D-012
- question/final_option: 新 UI 治理问题放在哪里 / 加入当前任务并从 make-decision 修订同一四材料
- recommendation/plain_language: 用户选择扩大当前任务；旧计划暂停，受影响阶段重做
- decision: 不另建任务；保留旧材料和事件为历史事实，当前 decision/spec/plan/tasks 依次修订
- source_type/reference/exact_excerpt: 当前会话用户真实回复："B"
- approval_binding: 当前宿主会话真实回复
- facts_and_constraints: 现有决策曾把 UI 治理排除；直接在 build-plan 塞入会造成上游决定缺失
- Logic: 用户要求加入当前任务 -> 回到方向层明确边界 -> 重做受影响材料 -> 再实施
- choice_reason/impact: 保持单一任务和五阶段；旧 build-plan 不再代表当前范围
- consequences_and_risks: 当前会话记录器拒绝重新开始已完成的 make-decision 早期步骤，该失败必须纳入同任务修复，不能冒充正式重跑成功
- rejected_alternatives: 另开任务；只在 plan/code 中追加；用旧确认覆盖新范围
- unresolved_items/owner: 同任务重跑阶段记录的最小修复纳入本任务启动/事件早失败范围
- Supersedes: D-006 的四项封闭范围、旧最终方向草案

### D-013
- question/final_option: build-spec 默认提供什么设计 / 基于已有页面、真实数据结构和项目设计规范生成本地 HTML 原型，并展示桌面、窄屏、手机结构
- recommendation/plain_language: 推荐；用户先看到可操作的本地方案，不满意再拿完整提示词去外部设计
- decision: 实质性 UI 改动先由当前 Agent 读取已有页面、组件、数据状态、Design.md、Experience.md 和当前 spec，生成任务级本地 HTML 原型；原型覆盖关键状态与三种宽度，并可在当前会话展示
- source_type/reference/exact_excerpt: 当前会话 Talk Round 2；用户真实回复："1-1，基于已有页面和数据为基础，设计本地html原型"
- approval_binding: 当前宿主会话真实回复；最终范围确认待本轮 make-decision 完成
- facts_and_constraints: T05 的失败来自只读规范和文件审查，没有任务级可见设计；本地 HTML 可复用现有页面和数据，又不等于生产实现
- Logic: 先读真实页面/数据/规范 -> 产出本地可见原型 -> 用户看稿 -> 不满意则提供外部提示词 -> 返回后继续同一设计版本
- choice_reason/impact: 影响 build-spec 条件步骤、设计产物最小字段、展示方式和回归测试；不要求 build-spec 写生产页面
- consequences_and_risks: 需要安全读取项目已有页面和数据契约；原型不得伪造真实后端、生产质量或浏览器验收
- rejected_alternatives: 任意 artifact 类型会扩大验证分支；只给外部提示词会把本可自动完成的工作推给用户
- unresolved_items/owner: 外部设计返回的文件类型只需可本地展示并绑定当前 revision，由 build-spec 合同细化
- Supersedes: none

### D-014
- question/final_option: 设计稿与正式需求谁是权威 / spec.md 仍是唯一正式需求，原型只作为绑定当前版本的可见证据
- recommendation/plain_language: 推荐；避免第五份需求材料和双向同步
- decision: HTML 原型、截图或外部设计返回物都不是第五份当前材料；它们存入现有质量证据位置并绑定当前 spec、Design.md、Experience.md、页面数据输入和 artifact hash/revision。任一权威输入变化，旧批准不再代表当前设计
- source_type/reference/exact_excerpt: 当前会话 Talk Round 2；用户真实回复："2-1"
- approval_binding: 当前宿主会话真实回复；最终范围确认待本轮 make-decision 完成
- facts_and_constraints: 当前任务只允许四材料；用户要求设计确认真实且不继续增加复杂度
- Logic: spec 定义产品行为 -> 原型展示其当前解释 -> 用户批准当前绑定 -> 输入变化重新生成/确认 -> 无第五材料同步
- choice_reason/impact: 复用现有 quality/evidence 和 stage outcome；不新增 latest pointer、设计数据库或第二状态机
- consequences_and_risks: 设计证据必须保存 artifact hash、展示事实和当前回复；只保存路径或文件存在不够
- rejected_alternatives: 第五材料会增加同步；临时不绑定会重现旧回复冒充批准
- unresolved_items/owner: none
- Supersedes: none

### D-015
- question/final_option: 原型生产和设计检查是否由同一能力承担 / 当前 build-spec 执行者生产并展示原型，现有 plan-design-review 只检查当前原型，正式 handler 同时消费两者
- recommendation/plain_language: 推荐；不新增阶段或 Skill，同时避免设计者自称检查通过
- decision: 复用现有 build-spec 条件步骤作为唯一设计协调 owner；当前 Agent 读取真实输入并生成 HTML，现有 plan-design-review 保持独立检查职责，build-spec handler 认证原型、检查事实和当前用户批准
- source_type/reference/exact_excerpt: 当前会话 Talk Round 3；用户真实回复："1"
- approval_binding: 当前宿主会话真实回复；最终范围确认待本轮 make-decision 完成
- facts_and_constraints: 现有三个 UI Skill 都不是设计生产者；新增 Skill 会扩大 35 条声明和 consumer 映射；让 reviewer 同时设计会形成自审
- Logic: 现有条件步骤协调生产 -> 现有 reviewer 检查 -> handler 认证双方与用户批准 -> 不新增控制面
- choice_reason/impact: 只扩展现有 build-spec step、handler、validator、Skill 输入/输出和测试；不新增 dispatcher、public command 或持久对象
- consequences_and_risks: 必须防止生命周期事件或文件存在冒充设计生产；review unavailable 不能变成设计批准
- rejected_alternatives: 同一 reviewer 设计并自审；新增专用 UI 设计 Skill
- unresolved_items/owner: none
- Supersedes: plan-design-review 只审 spec 文件、不消费当前可见原型的旧解释

### D-016
- question/final_option: 早期阶段审查怎样避免复用旧范围结果 / 删除 make-decision、build-spec、build-plan 的自动复用，每次实际执行只审当前输入一次
- recommendation/plain_language: 推荐；宁可阶段重跑时多调用一次审查，也不维护正文、版本和语义指纹的复杂匹配
- decision: 前三阶段的历史审查只读保留，永不自动选为当前审查；每次实际阶段执行都把这次输入送审一次
- source_type/reference/exact_excerpt: 用户真实回复："我不想搞这么复杂，根本没必要"；随后批准“简化方案”
- approval_binding: 用户回复“批准简化方案”
- facts_and_constraints: 自动复用导致旧 UI 范围结果冒充当前结果；继续补身份匹配会让框架更难维护
- Logic: 删除自动复用 -> 当前执行只审当前输入 -> 无需证明旧结果是否可复用 -> 旧结果继续作为历史事实
- choice_reason/impact: 删除判断和维护负担；同阶段重跑会增加一次审查调用
- consequences_and_risks: 外部审查调用次数可能增加，但用户流程和状态不会增加
- rejected_alternatives: 继续比较正文、material revision、material_id 或 semantic hash
- unresolved_items/owner: none
- Supersedes: F-016 原“绑定当前材料后复用”的候选修复

## Talk

| talk_id | 问题 | 用户选择/原文 | 队列变化 |
| --- | --- | --- | --- |
| T-001 | 简单可用与全部补齐冲突时优先什么。 | "1，所有改动需要我确定"。 | 已解决。 |
| T-002 | 独立目录何时创建。 | "1"。 | 已解决。 |
| T-003 | 独立目录以哪里为起点。 | "不要固定，分支应该基于主项目位置创建平行分支"。 | 已解决；目录已重建。 |
| T-004 | 四类问题、项目身份、已有修复归属。 | "A1 / B1，一般我在任务开始时会说明项目，也会在对应项目中开启会话，确定当前会话的项目还是很容易的 / C1"。 | 三项均解决；无剩余方向问题。 |
| T-005 | 是否把 UI 设计闭环加入当前任务。 | "B"。 | 已加入；旧 build-plan 暂停，重新执行受影响阶段。 |
| T-006 | 哪些 UI 改动必须定稿、未批准能否继续。 | "1-2 / 2-1"。 | 已解决；实质性 UI 改动适用，未批准留在 build-spec。 |
| T-007 | 默认设计形式和权威边界。 | "1-1，基于已有页面和数据为基础，设计本地html原型 / 2-1"。 | 已解决；本地 HTML 优先，spec 唯一权威，原型为当前证据。 |
| T-008 | 原型生产和设计检查是否分开。 | "1"。 | 已解决；现有 build-spec 生产，现有设计检查能力检查，不新增 Skill。 |
| T-009 | 旧审查怎样避免冒充当前结果。 | "我不想搞这么复杂"；"批准简化方案"。 | 已解决；前三阶段删除自动复用，每次实际执行审当前输入。 |

## 调研与审查处置

| source_id | 关键事实 | 后果/处置 |
| --- | --- | --- |
| F-001 | 临时目录曾被误当旧任务目录；删除该错误判断的修复已验证。 | D-001、D-008；后续带入并复测。 |
| F-002 | 本机 Git 对象问题已由重新拉取恢复。 | 环境维护事实，不是功能需求，延期。 |
| F-003 | 原始范围排除页面和浏览器检查。 | historical/superseded：仍不实现产品 UI 或浏览器 QA；D-010 至 D-015 新增的是 build-spec 条件 UI 设计治理。 |
| F-004 | 旧规则按传入目录机械创建同级目录；本次传入的是 Codex 临时目录。 | D-004、D-007；不再猜目录。 |
| F-005 | 先建任务记录、后建目录自 2026-07-16 引入；2026-08-25 又加入隐式复用判断。 | D-003、D-008；只做窄修。 |
| F-006 | 正确任务目录最初没有锁定依赖，正式 writer 报 `Cannot find package 'js-yaml'`；安装锁定依赖后 writer 成功。 | 事实保留；不在未确认前新增自动安装机制。 |
| F-007 | `ui-project-init`、`design-source-readiness`、`plan-design-review` 都不生产并展示任务级设计；build-spec handler 也不消费当前设计批准。 | R-007；需要复用现有 build-spec 条件步骤补真实生产、展示、回复绑定和正式消费。 |
| F-008 | `validateUiDesignLoopFact` 当前可接受没有设计 artifact、展示事件或当前版本绑定的 `human_acknowledged`。 | D-011；旧产品回复和旧设计必须在写入前拒绝。 |
| F-009 | 当前会话尝试重新开始 make-decision 时被记录器拒绝，因为同阶段已有更晚完成步骤。 | D-012；这是同任务范围修订无法正式重跑的结构缺口，旧失败保留。 |
| F-010 | 当前任务分支已有自己的提交后，make-decision 正式 writer 曾以“任务 HEAD 不是主项目 HEAD 的祖先”为由拒绝重新进入。 | 该错误判断已由当前分支提交 `a964b8b27` 删除并通过 13 项聚焦测试；后续只做当前任务真实复测，不再修改 workspace 规则。 |
| F-011 | 本轮方向审查调用直接复用了新增 UI 范围之前的旧结果；其 finding 仍只讨论旧目录范围，不能代表当前 UI 方向。 | 旧审查不可变保留，但本轮方向建议为 stale/unavailable；不得用旧 finding 冒充新范围已被独立审查。 |
| F-012 | 本轮详细审查也复用了新增 UI 范围之前的旧结果；结果只检查原四项治理修复，没有检查本地 HTML 原型、当前版本批准或 UI 输入变化后批准失效。 | 旧详细审查只读保留；当前 UI 方向的独立详细审查为 stale/unavailable，不能据此声明本轮审查完成。 |
| F-013 | 用户确认当前完整方向后，正式启动 `stage-end-spec-analyze` 立即失败：`make-decision step sequence invalid: stage-end-spec-analyze is after a later completed step`。 | 当前决策内容可以继续只读检查和修正，但 WorkflowHub 不能正式记录本轮结束检查；不得声明 make-decision 已正式完成或跳到 build-spec。 |
| F-014 | 当前 decision-log 的独立只读结束检查确认 R-001 至 R-008、三轮真实 Talk、完整流程/状态/边界、Grill、非目标/延期和当前最终确认均已覆盖，未发现方向级阻塞。 | 不需要追加 Talk、Grill 或再次确认；该内容结论不能替代 F-009 至 F-013 所缺的正式 runtime、writer、当前 review 和 analyzer 事实。 |
| F-015 | 事件重进失败来自 `preflightStartEvent` 把全部历史完成步骤当成永久顺序；该判断由提交 `8d68b9374` 引入。仅删除判断会让旧后续步骤冒充当前结果。 | 最小安全修复必须从现有事件时间和步骤顺序派生当前重跑起点，让旧事件只读保留但不进入当前投影；不新增 run/attempt 对象。 |
| F-016 | 早期阶段 review 复用由提交 `b02610558` 引入；它为减少重复调用而加入，随后引出了正文、版本和新旧绑定判断。 | D-016 删除前三阶段自动复用；旧结果只读保留，每次实际执行审当前输入，不再判断旧结果是否“足够新”。 |
| F-017 | 删除自动复用后，当前 direction review 真实产生新 result；三条 major finding 都指出送审用的精简 `current_selection` 没有复述材料一致、Skill 正式消费和失败恢复边界。 | finding 有效；完整 decision-log 的 D-006、目标/成功失败边界和最终方向已经保留这些要求。后续 direction 输入不得再用漏项摘要替代完整方向。 |
| FND-001 | 独立建议指出不能只修目录。 | fixed：D-006。 |
| FND-002 | 独立建议指出项目身份来源不清。 | fixed：D-007。 |
| FND-003 | 独立建议指出已验证修复归属未定。 | fixed：D-008。 |
| FND-004 | 独立建议指出确认可能变成日常新步骤。 | fixed：D-009。 |

## Grill

```yaml
grill_summary:
  status: completed
  direction_changing_challenges_resolved: true
  context:
    status: no-change
    reason: "现有 CONTEXT.md 已要求五阶段用大白话；本任务没有新增领域术语。"
    file_references: ["CONTEXT.md:232-243"]
  adr:
    status: not-needed
    reason: "不新建 ADR；已有 ADR 0005 与已确认启动时机冲突，待用户确认具体文档改动后最小更新原文。"
    file_references: ["docs/adr/0005-deterministic-task-directory.md:208-209", "docs/adr/0005-deterministic-task-directory.md:232-253", "docs/adr/0005-deterministic-task-directory.md:356-359"]
  conflicts:
    status: resolved
    disposition: "方向以 D-003/D-007 为准：正确项目旁的目录成功后才正式开始；启动失败可在同一任务重试。现有合同文字的修正等待实施授权。"
  requirement_coverage:
    status: complete
    message_classes: [goal, flow_or_surface, data_or_state, success_failure_acceptance, constraint_non_goal_defer]
    uncovered: []
  exit_checks:
    external_interfaces: unresolved
    canonical_names: pass
    failure_semantics: pass
    scope_boundaries: pass
  decision_updates:
    - "当前 `task-bootstrap` 仍要求调用方传入 `--target-repo`；会话项目上下文怎样进入该入口需在实施前按真实宿主接口设计，不能靠 cwd 推断。"
    - "ADR 0005 与 task-context 合同仍写成先完成 make-decision 后建目录；这与用户已确认方向相反。只做最小替代，不建新 ADR、状态机或恢复流程。"
    - "任务尚未认证到工作区时，可在同一任务重试；认证成功后仍只有一个活动工作区。"
```

- 覆盖检查：目标、用户流程/页面范围、数据状态、成功失败边界、约束/非目标/延期五类均已覆盖；没有需要再问用户的方向问题。
- 接口核实：`task-bootstrap` 目前只接受明确 `--target-repo`；`stage-runtime` 在任何非状态的 make-decision 调用时才准备目录。真实代码已核实，具体最小接口留待实施前确认。
- 名称核实：当前正式字段是 `target_repo_root`；当前目录规则是主项目同级的 `<项目名>-<任务名>` 和 `task/<项目>/<任务>` 分支。没有新增字段或路径名。
- 失败语义：项目不唯一、目录创建失败、材料格式错误、声明无 handler、review 输入缺失、事件身份不符，都应在各自入口报出可行动错误，不拖到发布。
- 历史范围核实（已被 D-012 扩展）：当时只处理 D-006 四项；当前范围另含 D-010 至 D-015 的条件 UI 设计治理，仍不增加新阶段、新对象或兼容层。

### 2026-08-27 UI 范围变更 Grill

```yaml
grill_summary:
  status: completed
  direction_changing_challenges_resolved: true
  context:
    status: change-required-after-final-approval
    reason: "需补充任务级 UI 原型、当前设计批准、设计输入变化后批准失效三个领域边界；不写实现字段。"
    file_references: ["CONTEXT.md#UI Contract", "CONTEXT.md#人机交互规范"]
  adr:
    status: not-needed
    reason: "现有 ADR 0015 已负责 UI 设计源与五阶段边界；最终批准后只做最小补充，不新增 ADR。"
    file_references: ["docs/adr/0015-ui-design-source-and-initialization.md"]
    criteria:
      hard_to_reverse: true
      surprising_without_context: true
      genuine_tradeoff: true
  conflicts:
    status: resolved-in-direction
    disposition: "CONSTITUTION F7 的三处正常阶段确认保持不变；实质性 UI 改动的当前设计批准是 build-spec 内部条件产品确认，不扩成全部 build-spec 的第四个通用阶段确认。最终批准后同步最小文字。"
  requirement_coverage:
    status: complete
    message_classes: [goal, flow_or_surface, data_or_state, success_failure_acceptance, constraint_non_goal_defer]
    uncovered: []
  exit_checks:
    external_interfaces: pass
    canonical_names: pass
    failure_semantics: pass
    scope_boundaries: pass
  decision_updates:
    - "实质性 UI 改动：读取已有页面、组件、真实数据结构、Design.md、Experience.md 和当前 spec，生成并展示本地 HTML 原型。"
    - "当前设计未获用户批准时留在 build-spec；修改、外部设计和返回继续绑定同一当前任务。"
    - "spec.md 是唯一产品权威；原型与展示/回复只进入现有质量证据，不新增第五材料。"
    - "原型由 build-spec 执行者生产，现有 plan-design-review 检查；handler 认证原型、检查和当前批准。"
```

- 完整用户流程：识别实质性 UI 改动 → 读取现有页面/组件/数据/设计规范 → 生成本地 HTML → 展示桌面、窄屏、手机和关键状态 → 用户批准或要求修改 → 不满意时生成外部设计提示词并等待返回 → 展示返回版本 → 当前版本批准后继续 build-spec 的剩余检查。
- 数据状态：non_ui/轻微修正不适用；UI 设计可处于待生成、已展示待回复、要求修改、等待外部返回、当前版本已批准。只使用现有 spec 和质量证据，不新增状态存储；输入变化直接使旧批准不再代表当前版本。
- 成功边界：当前 HTML 或外部返回设计绑定当前 spec、Design.md、Experience.md、页面数据输入、artifact hash/revision，展示先于用户回复，当前用户明确批准。
- 失败边界：没有 artifact、未展示、无回复、回复早于展示、旧产品选择、旧设计版本、输入已变化或 reviewer/handler 未消费时，build-spec 保持未完成并在同任务修复。
- 页面范围：本治理任务不实现产品页面；未来 UI 任务的原型是设计证据，不是生产代码或浏览器 QA。
- 非目标：不新增 UI 阶段、设计 Skill、第五材料、设计数据库、latest 指针、第二状态机、公共 CLI、provider fallback 或风险继续。
- 文档处置：最终用户批准前不改 `CONTEXT.md`、`CONSTITUTION.md` 或 ADR；批准后只同步上述最小边界。

## 最终确认

- 历史状态：旧范围 accepted；D-002 至 D-009 和用户回复“确认，继续”只覆盖原四项窄修复。
- 当前状态：accepted；用户在看到包含 D-001 至 D-015、UI 完整流程、简单性边界和三个已知运行时故障的最终方向卡后回复“确认，继续吧”。
- 当前确认边界：批准当前完整方向进入结束检查；不批准任何具体运行时代码、公共文档、提交、推送、合并或删除。每组实际改动仍须先展示目的、最小范围和风险。

## 拒绝方案

| 选项 | 拒绝理由 |
| --- | --- |
| 重开一个新任务 | 会拆开已发生的事实和当前对话。 |
| 用兼容兜底掩盖启动错误 | 会保留猜测和晚报错。 |
| 为覆盖问题新增流程 | 用户明确要求简单可用。 |
| 固定绝对目录或每次让用户选目录 | 前者不可移动，后者增加步骤。 |
| 让每个正常任务多一道用户审批 | 会把本次变更控制变成框架负担。 |

## 风险、延期与交接

| risk/deferred_id | 风险或延期内容 | 触发/后果 | 处理阶段/owner |
| --- | --- | --- |
| RISK-001 | 为覆盖问题又加控制流程 | 用户再次看不懂、正常任务又起不来 | 本任务；需用户确认 |
| RISK-002 | 宿主未传递已选项目上下文 | 应早失败，不能猜路径兜底 | 实施时验证 |
| RISK-003 | 已验证修复与当前主项目有差异 | 可能不能直接带入 | 实施时展示最小 diff 并复测 |
| RISK-004 | 现有 ADR/合同仍与决定冲突 | 后续执行者会继续按旧时机处理 | 具体文档改动获用户确认后最小更新 |
| RISK-005 | UI 设计确认被做成新的通用审批或第二流程 | 非 UI 任务也被阻塞，框架继续复杂化 | 只在实质性 UI 改动触发；复用 build-spec 现有条件步骤 |
| RISK-006 | 设计 artifact、展示和用户回复没有绑定同一当前版本 | 旧回复再次冒充定稿 | build-spec 正式消费时校验当前 artifact 与回复顺序/身份 |
| RISK-007 | 已完成阶段不能在同任务重跑 | 范围变化只能偷偷改材料或另建任务 | 复用现有事件和当前材料，允许受影响阶段产生新的当前结果 |
| RISK-008 | 普通审查在范围变化后复用旧结果 | 新需求没有得到当前建议却显示审查可用 | 前三阶段不再自动复用；旧结果只保留为历史 |
| DEFER-001 | 旧 Git 对象自动维护告警 | 本机维护风险，不是功能缺陷 | 本机环境维护 |
| DEFER-002 | 已归档 UI/fullstack contract | 重开会扩大任务 | 明确不处理 |
| DEFER-003 | 自动安装依赖或任何新启动机制 | 会扩大用户流程 | 未获确认，不实施 |
| DEFER-004 | 任何需新阶段、长期对象或兼容层的候选修复 | 违反简单原则 | 停止并单独说明，不实施 |

## 质量与授权边界

- 质量事实：测试、审查和历史只说明发生了什么。
- 推进资格：同一任务可继续讨论和修复；质量缺口不伪装成通过。
- 完成判据：真实 Talk、独立建议、Grill、用户最终确认和当前决策记录齐全后才能声明本阶段完成。
- 不可逆授权：提交、推送、合并、移动或删除均另行确认；本轮只执行用户明确授权的目录重建。依赖安装不是源码变动，但已如实记录为 F-006。

## 未决项

| item_id | 未决内容 | 原因 | 谁在何时解决 |
| --- | --- | --- | --- |
| OPEN-001 | 四项最小修复的具体 diff、测试和顺序 | 用户要求每项改动先确认 | 详细建议后，实施前用户确认 |
| OPEN-002 | 会话项目上下文进入启动入口的最小接口 | 当前接口只接 `--target-repo`，不能猜字段 | 实施前核实并给用户看最小方案 |
| OPEN-003 | 已验证修复和当前分支的带入方式 | 不能静默合并 | 实施前用户确认 |
| OPEN-004 | ADR 0005 与 task-context 的最小文档改动 | 当前文字反向描述启动时机 | 具体文档 diff 由用户确认 |
| OPEN-005 | UI 设计 artifact 的默认格式和权威边界 | 已由 D-013、D-014 解决 | closed；本地 HTML 优先，spec 唯一权威 |
| OPEN-006 | 宪法对 build-spec 条件 UI 确认的最小例外文字 | 当前方向已确认；剩余是具体文字 diff，尚未获实施授权 | 实施前展示最小 diff，由用户确认 |

## Supersedes

- D-007 取代 D-004 中“主项目身份来源待确认”。
- D-008 取代 D-001、D-005 中“已验证修复是否带入待确认”。
- D-009 取代 D-002 中“确认边界待明确”。
- D-010 至 D-015 取代旧决策中“本任务完全不处理 UI 治理路径”和“UI design acknowledged 可直接继续”的解释；产品 UI 实现仍是非目标。

## 详细建议处置

| finding_id | 原始事实/来源 | 处置 | status | next_action/evidence_ref | owner/consumer/retain_or_delete |
| --- | --- | --- | --- | --- | --- |
| F-0978604474ab | detail 审查认为五步骤的交接文字过少。 | 接受其中“detail 必须看见三轮 Talk、Grill 和当前决定”的问题；拒绝新建全流程矩阵，因为五步骤和现有事件已经是唯一流程。 | needs_human | 在 D-006 的 `wh-review detail` 窄修中，让官方最小输入消费当前 decision-log 的真实决定和 Grill 结论；具体 diff 待用户确认。 | make-decision / detail review handler / 保留。 |
| F-20bec06dfef5 | detail 审查认为三份 spec 材料和结束判据不可测试。 | 接受；这是原始 R-001 的核心。只复用现有四材料、既有身份绑定和一个每阶段结束检查，不新增通用 envelope、第五材料或状态机。 | needs_human | build-spec 只定义现有生产者、消费者、错误锚点和唯一结束判据；实施前用户确认。 | build-spec / spec 生产与分析 handler / 保留。 |
| F-4d22f5bf4452、F-73d203504432 | 现有 `task-bootstrap` 只接 `--target-repo`，会话项目身份尚未进入入口；旧文档时机相反。 | 接受；用户已选会话项目上下文为唯一来源。拒绝另造事件 schema、长期身份对象或恢复流程。 | needs_human | 以现有宿主会话上下文接入启动入口；缺失、冲突或目录失败立即报错；文档最小改动和代码 diff 均待用户确认。 | task bootstrap / workspace preparation / 保留。 |
| F-7b8a7cb4e37d | Skill 声明可能没有正式 handler 消费。 | 接受；这是 R-001 核心。只建立声明到现有正式 handler 的一处映射，并用一个真实声明验证成功消费、缺失和 handler 失败。 | needs_human | 先做真实消费者清点，再给出最小 diff 和测试；用户确认后实施。 | skill declaration consumer / official handler / 保留。 |
| F-c14c1f85a625 | 三份 spec 材料的统一格式和唯一结束判断未落到草案。 | 与 F-20bec06dfef5 合并；接受，不单起流程。 | needs_human | 同 F-20bec06dfef5。 | build-spec / spec 生产与分析 handler / 保留。 |
| F-c93ab06dcb46 | 审查 packet 中的“批准方向”是压缩摘要，缺少 decision-log 的理由和 Grill 判断。 | 接受真实诊断；当前 decision-log 本身已有这些内容，问题是官方 detail 输入没有消费它。 | needs_human | 同 F-0978604474ab；修官方输入，而不是复制第二份决定材料。 | wh-review detail handler / make-decision / 保留。 |
| F-ebefdce6f097 | `wh-review detail` 没有正式最小输入和字段级诊断。 | 接受；这是 R-001 核心。只明确已有输入的必填、身份/新旧检查和错误提示；可选 map 继续可选。 | needs_human | 复用现有 stage-materials 合同和错误机制；具体 diff 与测试待用户确认。 | wh-review detail handler / caller / 保留。 |
| F-69f8ad5545f8 | 本次正确目录首次缺 `js-yaml`，手动安装锁定依赖后 writer 成功。 | 接受为环境准备事实，不纳入本任务功能改动；拒绝自动安装或新启动检查。 | accepted_risk | 保留 F-006；若用户另行要求，再评估现有依赖错误是否需要更清楚提示。 | 本机环境 / 用户 / 保留。 |
| F-UI-DIRECTION-STALE | 新 UI 方向调用审查时，runner 复用了旧范围的 direction result。 | 接受为真实 stale 事实；D-016 已选择删除前三阶段自动复用。 | fixed | 当前执行已产生新的 direction result：`quality/reviews/results/make-decision-direction-34f9427a731805a1bcbbf682e7c672341983acec-572b6a09-2363-4bc7-8341-9538c0231d63.json`；旧结果只读保留。 | wh-review / current stage execution / 保留旧结果。 |
| F-UI-DETAIL-STALE | 新 UI 方向调用详细审查时，runner 复用了旧范围的 detail result。 | 接受为真实 stale 事实；D-016 已选择删除前三阶段自动复用。 | fixed | 当前执行已产生新的 detail result：`quality/reviews/results/make-decision-detail-cff8632df159083a1b233a094092a1f00da4f4cf-e3f3da01-9308-43f4-8771-d4ba9a091465.json`；旧结果只读保留。 | wh-review / current stage execution / 保留旧结果。 |
| F-10a5fb591e40、F-5ae2853690aa | 当前 direction review 指出精简 `current_selection` 漏写材料生产/解析一致和声明 Skill 的正式消费者。 | 接受；D-006 与最终方向原本已包含两项，不改变方向。修复的是送审摘要和下游交接不得漏项。 | fixed | 当前 decision-log 的 R-001、D-006 和最终方向完整覆盖；detail review 直接消费完整决定。 | make-decision / downstream review input / 保留 finding。 |
| F-ca11804df608 | 当前 direction review 指出精简 `current_selection` 没写清早失败、同任务重试和旧结果失效。 | 接受；目标/用户流程、失败边界、D-012、D-016 已定义这些行为，不改变方向。 | fixed | 当前完整 decision-log 作为 detail 输入；不再用短摘要替代行为边界。 | make-decision / downstream review input / 保留 finding。 |
| F-2652105f2420 | 当前 detail review 要求 UI 设计再增加完整版本与证据链。 | 接受“旧设计和旧回复不能冒充当前批准”的问题；D-011、D-014 已规定 `spec.md` 唯一权威及现有 artifact hash/revision、展示和当前回复绑定。拒绝新增状态机、设计数据库或第二套版本链。 | accepted_for_spec | `build-spec` 只在现有 stage outcome 与 `quality/evidence` 中细化最小字段和失败测试。 | build-spec / existing UI handler / 不新增对象。 |
| F-2b1ec9124176 | 当前 detail review 指出 D-016 还需明确失败语义。 | 接受；每次实际执行只送当前输入一次，历史结果不复用；坏 JSON、协议错误、timeout、缺材料或 provider unavailable 保持 `unavailable`/`incomplete`，不能写成空 findings 或完成。 | fixed | 已同步 `wh-review` 合同与 runner 测试；当前 detail 确实产生新结果。 | wh-review / first-three-stage handlers / 保留失败事实。 |
| F-6c6904bd81e8 | 当前 detail review 要求定义最小任务状态和唯一结束条件。 | 接受已有问题，不新增状态机。当前记录已限定进行中、遇错待修、修好继续、完成；各阶段只用一个现有 stage-end `spec-analyze` 结论。 | accepted_for_spec | `build-spec` 把材料缺失、身份失败、review unavailable、UI 未批准和修复后重跑写成可打破验收。 | build-spec / existing stage handler / 不新增状态对象。 |
| F-bf69eedb07f4 | 当前 detail review 要求把四项治理方向变成生产者、消费者、输入输出和测试。 | 接受；这是 D-006 的下阶段工作，不在 make-decision 提前写实现规格。 | accepted_for_spec | `build-spec` 逐项定义现有 handler、输入输出、早失败诊断和成功/失败测试。 | build-spec / four existing consumers / 保持四材料。 |
| F-fc176e5891a2 | 当前 detail review 要求把工作区身份和同任务重跑写成可测试规则。 | 接受问题；项目身份只来自当前会话项目上下文，目录成功后才正式开始。重跑起点按事件追加顺序和 manifest 步骤顺序计算，不依赖时间戳；历史后续事件只读且不阻塞。 | fixed | 当前最小实现及事件测试已覆盖缺失/冲突早失败、当前投影、旧事件保留和时钟回退。 | task bootstrap and event projection / existing handlers / 不新增恢复流程。 |

## 最终方向草案

- 做什么：保留原四项治理修复，并增加 UI 设计闭环与同任务范围修订。材料生产和消费一致；任务开始前有正确 worktree；事件和审查输入早报错；声明 Skill 被正式 handler 消费；实质性 UI 改动在 build-spec 先完成当前设计。
- UI 用户流程：基于已有页面、组件、真实数据、Design.md、Experience.md 和 spec 生成本地 HTML，展示桌面/窄屏/手机及关键状态；用户要求修改就继续改，不满意可转外部设计；当前版本明确批准后才继续。
- 怎么保持简单：仍只有五阶段和四材料；复用 build-spec 现有条件步骤、plan-design-review、stage outcome、quality/evidence 和 handler；前三阶段不复用历史审查，不比较正文/版本/语义指纹；不新增 UI 阶段、设计 Skill、第五材料、第二状态机或公共命令。
- 成功判断：真实 artifact → 展示 → 当前回复顺序和身份可验证；旧回复、旧版本和输入变化会失败；UI handler 真实消费原型、设计检查和当前批准；非 UI 与轻微修正不增加步骤。
- 同任务修复：需求范围变化后允许从受影响阶段重新执行并产生新的当前结果；旧事件、旧审查和旧失败只读保留，不能阻止任务分支领先主项目后的正常重进。
- 不做什么：不实现任何产品 UI，不把原型当生产代码或浏览器 QA，不重开归档 UI/fullstack 任务，不新增恢复流程、设计数据库、永久兼容层或风险继续选项。
- 文档影响：最终批准后最小同步 `CONTEXT.md`、`CONSTITUTION.md` F7 和现有 ADR 0015；不新增 ADR。
- 已知风险：当前正式事件记录不能正确处理同任务范围修订；review 自动复用已决定直接删除，writer 的错误祖先判断已由当前分支修复。旧失败继续保留。
- 最终确认：accepted；用户回复“确认，继续吧”。

## 最终确认补充

- 用户真实回复："确认，继续"。
- 方向确认：接受当前草案；四项原始问题都只做最小修复，正确项目旁的任务目录必须先成功建立，仍保持五个正常步骤。
- 确认边界：这只批准进入下一阶段继续细化方向，不批准任何具体运行时代码、现有文档或不可逆操作；每项实际改动仍须先展示目的、范围和风险。
- host-visible confirmation source：当前会话的用户回复，绑定本次 `approve-decision`；具体 confirmation 事实由现有确认入口写入，不新增记录类型。
- downstream handoff：`build-spec` 只能消费本记录和本次确认；不得重新猜项目、目录、材料、事件或 Skill 消费者，也不得把 review 建议当成自动批准。

### 2026-08-27 当前完整范围确认

- 用户真实回复："确认，继续吧"。
- 方向确认：接受 D-001 至 D-015，包括原四项治理窄修、同任务范围修订和 build-spec 条件 UI 设计闭环。
- 简单性确认：仍只有五阶段和四份核心材料；不新增 UI 阶段、设计 Skill、公共命令、第五材料、第二状态机或永久兼容桥。
- UI 确认：实质性 UI 改动必须先生成并展示绑定当前输入的设计，当前版本获得明确批准后才能离开 build-spec；非 UI 和轻微修正不增加该步骤。
- 授权边界：本次回复只批准当前方向及 make-decision 结束检查，不批准具体代码、公共文档或不可逆操作。

### 2026-08-27 审查简化确认

- 用户真实回复："批准简化方案"。
- 方向修订：D-016 取代“继续证明旧审查与当前正文一致”的方案；前三阶段每次实际执行只审当前输入一次，历史审查永不自动复用。
- 取舍：接受阶段重跑时多一次外部审查调用，换取删除正文、版本、material_id 和 semantic hash 的复用判断。
- 授权边界：批准实现该删除式修复及对应测试；不批准新增状态、对象、流程或无关改动。

### 2026-08-28 wh-review liveness narrow-repair approval

- 用户真实回复："好的，批准"。
- 新事实：当前 `3rd-review` 对没有 `probeSession` 的 stream-only provider 会继续等待进程自然退出；WorkflowHub 的 `ReviewProviderClient.execute()` 也只等待子进程 `close`。历史上的 OpenCode 固定 6 分钟限制已经被移除，因此当前链路没有所有 provider 都适用的有限结束边界。本次记录没有足够证据把具体 6 分钟事件归给某个 provider。
- 选择：只修 `3rd-review` Broker/进程执行边界，让每个 provider 都有一个有限的默认最终期限；期限到达后终止 provider 进程并返回已有的 `PROCESS_TIMEOUT`。WorkflowHub 继续只消费 Broker 的最终结果，不增加第二套超时。
- 理由：把结束责任放回真正拥有 provider 生命周期的地方；修复“双方都无限等待”的根因，同时不增加 WorkflowHub 状态、协议或用户步骤。
- 成功边界：无 health probe 的 provider 也能在有限时间内返回结构化 `PROCESS_TIMEOUT`；正常 provider 行为不变；超时保留 provider、耗时和错误事实。
- 失败边界：不能把超时写成空 findings、通过或语义审查结论；Broker 未返回、provider 自身失败和输出不合法继续保持各自已有错误事实。
- 明确不做：不修改 `workflowhub-result.v3`、`material_id`/`semantic_hash`、WorkflowHub 外层调用、不增加重试层、第二状态机、公共命令、UI 或其他复杂度清理。
- 风险与延期：默认期限取值和终止宽限期必须在 `build-spec` 依据现有 `3rd-review` 配置与进程能力确定；若必须新增公开字段、跨层状态或外部兼容桥，立即停止并回到本任务确认。更大范围的 v3/哈希简化另行提出，不与本修复合并。
- 下游交接：`build-spec` 只把本条作为一个 provider 生命周期行为写入现有 `spec.md`；随后由 `build-plan` 给出最小文件和测试范围。当前未授权提交、推送、合并或删除。

### 2026-08-28 OpenCode 120 秒根因与执行无时间限制修订

- **用户真实回复**："为什么opencode会有120秒限制？请检查根本原因，找到之后帮我删除这个限制！不用比较 `max` 与 `high`，确认是否是长请求预算导致。任何限制都不应该让3rd-review和wh-review的执行产生时间限制"
- **新事实**：当前 `3rd-review` 没有 120 秒的 provider 总耗时计时器；失败发生在 OpenCode Go/Zen 的长多步流式 session 上，约 120 秒时只有 `step_start`、没有终态，最终是 `SESSION_IDLE_WITHOUT_TERMINAL`。同一模型的一次约 378 KB 单请求在本地约 8.5 秒完成，因此“输入很长就必然触发 120 秒”未被证实，也没有比较 `max` 与 `high`。历史 `08c5476` 曾加入 2 分钟无进展/6 分钟总时长，`5c81c06` 已移除；本次调查还发现 `b5ee0a3` 和 `bb7d5ee` 后来又加入了本地 15 分钟自动结束，现已在执行分支撤下。
- **修订选择**：以本条覆盖上一条中“为每个 provider 设有限最终期限”的选择。`3rd-review` 和 `wh-review` 不因已运行多久而终止；取消、provider/进程终态、进程实际丢失和清理仍保留。OpenCode 本地配置使用 `timeout: false`。已有 `PROCESS_TIMEOUT` 只保留为 provider 或上游真实返回的历史/外部失败事实，不由本地 watchdog 生成。
- **理由**：用户要的是简单、可继续的执行链。为防止“卡住”再加一层本地总时长，会误杀正常长审查，也无法修复上游 120 秒边界；删除本地期限能让结束责任回到真实终态，同时不新增阶段、配置面、状态机或用户步骤。
- **保留边界**：健康探针和启动探测的单次请求仍有短暂网络保护（250 ms、1 s、2 s、5 s），它们只产生诊断，不结束 provider 执行。`PROCESS_TIMEOUT`、旧 15 分钟事实和旧 review/事件均只读保留，不能改写成通过或空 findings。
- **风险与延期**：OpenCode Go/Zen 服务端仍可能在远端约 120 秒后不返回；本地仓库无法删除远端边界。若修复后完整请求仍在该处停止，延期到上游路由/服务修复或改用已验证的直连 provider；WorkflowHub 继续记录 `unavailable`/`SESSION_IDLE_WITHOUT_TERMINAL`，不伪造质量结论。
- **下游交接**：`spec.md`、`plan.md`、`tasks.md` 只做最小文字同步，明确“无本地执行时限”；不新增任务、材料、命令或状态。当前仍未授权提交、推送、合并或删除。

### 2026-08-28 OpenCode 上游问题延期确认

- **用户真实回复**："好的，如果是opencode本身的问题，那就不用管了，继续吧"
- **确认**：接受将 OpenCode Go/Zen 远端约 120 秒无终态问题留作外部延期；不在本任务继续改 provider 路由、OpenCode 服务或 `max`/`high` 参数。
- **当前范围**：继续完成已批准的本地 `3rd-review`/`wh-review` 治理修复；本地不因 elapsed time 终止 provider，远端问题不阻塞同一任务的其他阶段或本地收尾。
- **下游交接**：若再次遇到该远端事实，保留 `unavailable`/`SESSION_IDLE_WITHOUT_TERMINAL`，不得写成通过、空 findings 或本地缺陷；继续当前阶段的验证和用户确认流程。

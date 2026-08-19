# Decision Log

## 原始需求

| source_id | 原始需求/约束 | 来源引用/原文摘录 | 关联 D/处理状态 |
| --- | --- | --- | --- | --- |
| R-001 | 修复 make-decision 的 Talk、方向审查、Talk 3、Grill、细节审查顺序 | 用户原文：“make-decision流程不对，方向审查和细节审查的顺序不对、三次talk的顺序不对、grill的顺序也不对” | D-001 / 已纳入 |
| R-002 | Talk 必须一次问一组独立问题，并真正等待用户回复 | 用户原文：“talk还是没有一组一组的问问题，还是一次一问” | D-002 / 已纳入 |
| R-003 | Grill 和 Clarify 必须真实交互 | 用户原文：“grill和clarify根本没和我交互” | D-003 / 已纳入 |
| R-004 | 非 build-code 按配置使用多种异源 provider，一轮获得 findings；build-code 只允许真实修复后的 focused review | 用户原文：“根据 config.json 配置进行真正的多种异源审查。但是除了build-code之外，其他的审查只用进行一轮” | D-004 / 已纳入 |
| R-005 | build-plan 必须设计每个 Phase 的设计任务、环境前置和最终证据 | 用户原文：“build-plan阶段根本没设计每个phase的设计任务和最终设计证据落盘方式” | D-005 / 已纳入 |
| R-006 | 方案不得违反 WorkflowHub 宪法，并且必须从完整 WorkflowHub 流程开始 | 用户原文：“按标准 WorkflowHub 从 make-decision 开始，不要跳阶段，也不要依赖 build-spec 补需求” | D-006 / 已纳入 |
| R-007 | Talk 用大白话解释选项、后果和风险；decision-log 保留原始需求、事实、选择、理由和延期交接 | 用户原文：“Talk 请用大白话说明选项、后果和风险；decision-log 记录原始需求、关键事实、选择、理由和延期交接” | D-007 / 已纳入 |

## 目标

- 目标：让 WorkflowHub 的完整五阶段流程真实按顺序执行，真实等待用户，按配置派发异源审查，并在 build-plan/build-code 中形成可验证的分阶段设计、环境和证据闭环。

## 成功/失败边界

- 成功边界：原始需求全部被记录；Talk/Grill 有真实用户回复；每个审查面保留真实 provider 事实；每个 build-code Phase 先完成环境前置，再实现、测试和落证据；最终用户确认 decision-log。
- 失败边界：无用户回复则等待；provider 无公开终态则记录 unavailable；环境未启动则 Phase incomplete；finding 未处置或证据缺失不能宣称完成；不能用空 findings、doctor 成功或自动 fallback 伪造通过。

## 范围

- 当前范围：修复现有调用方可见交互面、五阶段执行约束、provider 身份与 group 调度、每 Phase 设计/环境/测试/证据闭环。
- 用户流程/结果只记索引和验收影响，细节进入后续 spec 和 plan；make-decision 不把 build-spec 当作方向补全器。

## 非目标

- 不新增独立 dashboard、可视化编辑器或其他 UI 页面。
- 不新增业务功能、第五份当前材料、公共 phase/recovery/rebind/selector/review-loop 控制面。
- 不修改历史 task、旧 review、旧 receipt；不通过删除 provider 或修改配置来掩盖失败。

## 决定

### D-001
- question/final_option: 本任务是否新增独立产品页面 / A：只修现有调用方可见交互面
- recommendation/plain_language: 推荐 A；先把问题卡、等待恢复、阶段摘要和失败说明修好，不扩展成新页面项目
- decision: 当前范围不包含独立 UI 页面
- source_type/reference/exact_excerpt: user_reply / current conversation / “A”
- approval_binding: pending final user confirmation
- facts_and_constraints: 原始需求集中在 WorkflowHub 执行正确性；当前仓库有调用方可见交互面定义，没有本任务的独立页面清单
- Logic: 原始需求聚焦流程浪费 -> 范围必须集中 -> 选择现有交互面 -> 先修核心执行链
- choice_reason/impact: 减少范围漂移；影响 Talk、Grill、Clarify、阶段摘要和失败展示
- consequences_and_risks: 不提供新的可视化监控体验；以后若需要 dashboard 需单独决策
- rejected_alternatives: B：加入 dashboard，范围变大；C：新增完整产品界面，原始需求证据不足
- unresolved_items/owner: 无；若未来要做独立页面，由用户另行确认
- Supersedes: none

### D-002
- question/final_option: 调研范围 / A：本地代码、配置和真实 provider 路由
- recommendation/plain_language: 推荐 A；代码能说明结构，真实路由才能说明 provider 是否真的能跑
- decision: 不做无关网页或 UX 调研；核实本地实现、配置、route selection 和真实 provider 终态
- source_type/reference/exact_excerpt: user_reply / current conversation / “A”
- approval_binding: pending final user confirmation
- facts_and_constraints: doctor 仅代表结构可读；route selection 读到 3 个 provider；语义 review 必须在 Talk 2 后执行
- Logic: provider 是核心风险 -> 静态配置不足 -> 选择真实路由核实 -> 失败保留为 unavailable
- choice_reason/impact: 直接覆盖本任务真实风险；影响 wh-review、provider adapter 和研究证据
- consequences_and_risks: 真实 provider 可能超时或不可用；不能因此伪造空 findings
- rejected_alternatives: B：只看静态代码，可能太晚发现 route 失败；C：外部网页调研不改变当前方向
- unresolved_items/owner: 真实语义 review 的公开终态仍未获得，由当前 make-decision 继续保留
- Supersedes: none

### D-003
- question/final_option: 无可信证据时如何处理 / A：显示原因、保持同一任务可修复但不自动推进
- recommendation/plain_language: 推荐 A；不把局部故障扩大成伪成功，也不把整个任务锁死
- decision: waiting、incomplete、unavailable 保持可见；后续阶段不能因缺证据自动完成
- source_type/reference/exact_excerpt: user_reply / current conversation / “A”
- approval_binding: pending final user confirmation
- facts_and_constraints: 宪法要求失败事实保真；质量事实不等于推进许可证
- Logic: 证据缺失 -> 无法证明成功 -> 保留失败并停当前边界 -> 同一任务可修复
- choice_reason/impact: 影响所有 stage、provider、Phase 和 completion 判据
- consequences_and_risks: 任务可能暂时停在 incomplete；但不会产生 false green
- rejected_alternatives: B：硬停整个任务，过度扩大局部故障；C：自动跳过或 fallback，违反宪法
- unresolved_items/owner: 无
- Supersedes: none

### D-004
- question/final_option: provider 身份缺失是否纳入本任务 / A：纳入
- recommendation/plain_language: 推荐 A；配置中的 provider 必须真实可辨认，不能只显示一个名字
- decision: 修复 provider source identity / route 映射；不能删除不可用 provider 来绕过问题
- source_type/reference/exact_excerpt: user_reply + research / current conversation + config probe / “A”
- approval_binding: pending final user confirmation
- facts_and_constraints: broker 配置中 codex/terra enabled 但 source_id 缺失；正式 route 需要 source identity
- Logic: provider 身份缺失 -> 多源结果不可追溯 -> 纳入修复 -> 每个 provider 失败或结果都可回指
- choice_reason/impact: 影响 review route、canonical result 和 provider provenance
- consequences_and_risks: 可能需要 adapter 或 broker 配置修复；修复期间 review 可能 unavailable
- rejected_alternatives: B：延期会把核心真实性风险留到 build-code；C：删除 provider 会违反按配置派发
- unresolved_items/owner: 当前已改为以 WorkflowHub profile key 作为 dispatch identity；broker 结果仍必须提供可校验的 source identity。未来新增 provider 只需通过 profile/config/result identity 校验，不再要求重复维护外部 raw `source_id` 字段
- Supersedes: none

### D-005
- question/final_option: 多源成功阈值 / A：尊重现有 minimum_heterologous:1，同时派发全部配置 provider
- recommendation/plain_language: 当前选择遵守配置策略；所有 provider 都尝试，达到配置阈值即可形成可用事实，但其他失败必须保留
- decision: 不在代码中硬编码新阈值；配置继续是策略来源，provider group 必须完整派发
- source_type/reference/exact_excerpt: user_reply + research / current conversation + route probe / “A”
- approval_binding: pending final user confirmation
- facts_and_constraints: route 按 stage 分开读取：make-decision direction 为 kimi/coding、codex/luna；make-decision detail 为 kimi/coding、opencode/v4flash、codex/luna；build-plan 为 pi/k3、opencode/v4flash、codex/luna；这些 route 的 minimum_heterologous 均为 1
- Logic: 用户要求按配置 -> 配置规定阈值 -> 保留阈值并完整派发 -> 不静默裁剪 provider
- choice_reason/impact: 影响 canonical available/unavailable 判定和 review policy
- consequences_and_risks: 只有一个 provider 成功时可能形成可用事实，需明确保留其余失败；如果实际要求至少两个成功，需在后续同一决策中修订
- rejected_alternatives: B：提高到 2 会改变当前配置策略；C：要求全部成功会增加不可用风险
- unresolved_items/owner: Talk 3/Grill 复核“配置阈值为 1”是否足够表达真正多源，由用户最终确认
- Supersedes: none

### D-006
- question/final_option: build-code 审查范围 / A：每个 Phase 初审、真实修复后一次 focused review、最后一次集成审查
- recommendation/plain_language: 推荐 A；每个改动面有一次检查，实际修复才允许再看一次，不无限循环
- decision: build-code 的审查面由 plan 明确列出；同一对象最多一次 focused review
- source_type/reference/exact_excerpt: user_reply / current conversation / “A”
- approval_binding: pending final user confirmation
- facts_and_constraints: build-code 是唯一允许修复后 focused review 的阶段；其他阶段只做一轮
- Logic: Phase 改动面不同 -> 需要局部证据 -> 每个面一次初审和必要的一次复核 -> 防止重复复审浪费
- choice_reason/impact: 影响 plan 的 Phase 数量、review budget 和 verify-code 输入
- consequences_and_risks: 总调用数比普通 stage 多；若 Phase 设计过细会增加成本，因此 build-plan 必须控制 Phase 边界
- rejected_alternatives: B：只审一次无法覆盖局部变化；C：一直复审会制造空 findings
- unresolved_items/owner: build-plan 确定实际 Phase 数量和每个审查面
- Supersedes: none

### D-007
- question/final_option: provider 部分失败后的整组判定 / A：按配置 minimum_heterologous=1，全部派发，达到阈值后保留已完成 findings，并保留失败事实
- recommendation/plain_language: 推荐 A；Kimi 超时不能抹掉其他 provider 的真实结果，也不能把超时写成通过
- decision: 组结果按配置阈值判定；所有已派发 provider 先达到终态。终态 group 形成后，只要满足 `minimum_heterologous=1` 且至少有一个合法审查结果，就允许流程进入下游；未成功 provider 保持 unavailable/incomplete，整体必须标明不完整。
- source_type/reference/exact_excerpt: user_reply + Kimi diagnosis / current conversation / A
- approval_binding: pending final user confirmation
- facts_and_constraints: 本次 make-decision detail route 派发 kimi/coding、opencode/v4flash、codex/luna；Kimi 可能在旧的 6 分钟硬时限内无 prompt.finished
- Logic: 配置要求完整派发 -> 先收齐每个已派发 provider 的终态 -> 单个 provider 失败不应删除其他事实 -> 仍需保留失败 provenance -> 采用配置阈值并显式标不完整
- choice_reason/impact: 影响 review group outcome、findings 可用范围和后续是否允许继续 Talk
- consequences_and_risks: 可能只拿到部分 provider findings；必须显示 unavailable/incomplete，不能宣称完整审查
- rejected_alternatives: B：任一失败就整组 unavailable 会让一个 Kimi 超时拖住全部真实结果
- unresolved_items/owner: Grill 复核部分 findings 是否足够支撑方向判断
- Supersedes: none

### D-011
- question/final_option: provider group 的终态门槛与空 findings / B、A：先等所有已派发 provider 终态；合法的 `findings: []` 算一个审查结果，但不算通过
- recommendation/plain_language: 推荐按这两个选择执行；不抢跑，也不把空 findings 当成“没有问题”。
- decision: 同一 reviewer group 的所有已派发 provider 必须先进入 `completed`、`failed` 或 `cancelled` 终态；之后按 `minimum_heterologous=1` 判断是否可以进入下游。一个 parse-valid、status=completed 且 `findings: []` 的结果满足“有审查结果”条件，但只表示该 provider 没提出 finding，不表示 stage 完成、质量通过或允许发布；group 的 partial/incomplete/quality 状态仍必须保留。该下游条件是流程交接事实，不替代最终用户确认和宪法要求的完成证据。
- source_type/reference/exact_excerpt: user_reply / current conversation / “B，A”
- approval_binding: pending final user confirmation
- facts_and_constraints: G-003 曾记录“一个 provider 终态即可下游”；本次 B 明确改为先收齐已派发 provider 的终态。G-012/G-013 保证无进展 provider 最终会进入 unavailable 并清理进程；provider 失败事实不能被删除。provider protocol 规定空 findings 不能被解释为 stage 完成。
- Logic: 全量派发 -> 等每个成员有明确终态 -> 再应用配置阈值 -> 空 findings 是合法语义结果但不是质量通过 -> 保留 incomplete/quality unknown 和最终确认边界。
- choice_reason/impact: 避免下游与仍运行的 provider 并行造成状态竞争，同时保留配置允许的单结果交接能力；影响 group runner、聚合状态、下游 gate 和最终确认。
- consequences_and_risks: 慢 provider 会拖到 15 分钟无进展 watchdog 或真实终态；空 findings 可能让流程继续但不能提供“审查通过”证据，后续阶段必须继续记录质量缺口。
- rejected_alternatives: A：一个 provider 一结束就抢跑，造成 group 尚未收齐；C：把空 findings 当作通过，违反 evidence-before-completion 边界。
- unresolved_items/owner: 无方向未决；build-spec/build-plan 定义终态 group、下游交接和质量状态的可验证字段。
- Supersedes: G-003 中“一个 provider 终态即可立即下游”的时序部分；不改变 `minimum_heterologous=1` 阈值本身。

### D-012
- question/final_option: 如何减少审查失败、重复调用和时间/token 浪费 / 一次成功优先
- recommendation/plain_language: 先把入口合同和运行条件检查完整，再发一次 group；这样 provider 不会替 WorkflowHub 自己的材料错误和错误生命周期判断买单。
- decision: 所有 review track 在 provider 启动前完成 track-specific material 校验、route/provider identity、配置快照、输出协议、group identity 和健康生命周期预检；非 build-code 每个审查面只发起一次 public group request，不自动 retry、不自动追加复审、不把诊断复试混入正式流程。一次成功优先是调用质量目标，不是假设 provider 永远成功；真实 provider 失败仍必须按 D-011 等待全部已派发成员进入明确终态、保留失败 provenance，再按 `minimum_heterologous=1` 判定是否可交接。
- source_type/reference/exact_excerpt: user_reply / current conversation / “我希望以后审查的时候不要再出现这么多错误了，审查最好一次成功，别浪费时间和token”
- approval_binding: pending final user confirmation
- facts_and_constraints: 本次 detail 的第一次失败来自 WorkflowHub 调用材料错误；OpenCode 失败来自健康探针误判；Kimi 慢但有进展并最终完成；当前一次 group 已经没有 provider retry。
- Logic: 先发现并阻断本地合同错误 -> 再启动真实 provider -> 一轮 group 收齐明确终态 -> 失败事实可追溯且不重复消耗 -> 结果交给下游。
- choice_reason/impact: 减少无效 provider 调用、重复审查和用户等待；影响 review-runner、broker preflight、provider lifecycle、错误展示和 build-code smoke。
- consequences_and_risks: 预检更严格时会更早暴露材料错误；某个 provider 真实失败时不自动补救，必须保留 incomplete/unavailable 并由同一任务后续修复。
- rejected_alternatives: 自动重试直到成功会重复消耗时间/token并掩盖根因；提前跳过失败 provider 会破坏按配置派发和 provenance。
- unresolved_items/owner: build-spec 固化可测试输入/输出合同；build-plan 安排一次成功路径、预检失败零 dispatch、真实失败收尾和长时健康 smoke；build-code 实现并验证。
- Supersedes: none

### D-008
- question/final_option: direction review 的调用次数与盲审方式 / A：每个 provider 一次 public request，并在这一次调用中保持盲审
- recommendation/plain_language: 推荐 A；一次调用得到一次异源 findings，不再串行发第二个 challenge request；盲审约束仍然保留
- decision: 非 build-code 的 direction review 每个 provider 只调用一次；不得通过第二次 public request 补审或制造空 findings
- source_type/reference/exact_excerpt: user_reply / current conversation / A（每个provider一次调用，保持盲审）
- approval_binding: pending final user confirmation
- facts_and_constraints: 旧 runner 一次 direction review 会发 reconstruct 与 challenge 两次 public request；Kimi 复杂请求存在长时间无终态风险
- Logic: 用户要求非 build-code 一轮 -> 旧双请求扩大耗时和调用次数 -> 保留盲审但收成单次 provider request -> 只形成一条异源 findings fact
- choice_reason/impact: 影响 review-runner、make-decision 合同、provider budget 和 Kimi 终态概率
- consequences_and_risks: 单次 prompt 的盲审设计必须清楚；若材料或提示仍过重，Kimi 仍可能 unavailable
- rejected_alternatives: B：两次 public request 会违反一轮审查约束并放大 provider 超时
- unresolved_items/owner: build-code 确定单次 request 的盲审材料边界和终态测试
- Supersedes: F-005/OPEN-003 的旧双调用方案

### D-009
- question/final_option: Kimi provider profile 是否现在直接改配置 / A：继续以配置为准，只在 build-code 增加边界和真实验证
- recommendation/plain_language: 推荐 A；先修 WorkflowHub 的调用次数、终态 watchdog 和证据，不凭一次超时偷偷改全局策略
- decision: make-decision 不直接修改 Kimi thinking 或 deadline；build-code 用真实 direction packet 验证后再决定是否需要配置变更
- source_type/reference/exact_excerpt: user_reply + Kimi diagnosis / current conversation / A
- approval_binding: pending final user confirmation
- facts_and_constraints: thinking=false 的简化提示可完成，但真实 review prompt 在 180 秒仍超时；关闭 thinking 不能单独证明修复
- Logic: 配置是策略来源 -> 证据不足以证明某个参数必改 -> 先修调用边界和可观测失败 -> 真实 smoke 后再决定配置
- choice_reason/impact: 避免用 provider 参数变化掩盖 WorkflowHub 双调用和 prompt 过重问题
- consequences_and_risks: Kimi 仍可能偶发超时；必须保留原始 transcript 和 PROCESS_TIMEOUT
- rejected_alternatives: B：直接关闭 thinking 或延长 deadline 会改变全局策略，且不能证明根因已消失
- unresolved_items/owner: build-code 真实 smoke 后决定是否提出最小配置变更
- Supersedes: none

### D-010
- question/final_option: provider 审查的生命周期 / A：不设置 provider 固定总时限，以健康状态和真实终态管理
- recommendation/plain_language: 用户选择 A；只要会话仍活跃、进程仍存活且健康监控没有报告终态失败，就继续等，不能因为几分钟到了就杀掉。
- decision: 标准 3rd-review 不再把任何正数 `provider.deadline_ms` 传成 `process.execute.maxDurationMs`；配置默认值改为 `null`，Kimi adapter 自带的 15 分钟 plan 总时限也必须移除。允许一个独立的健康型无进展 watchdog：当 provider 进程仍活着、health probe 持续为 `busy` 且 cursor/session 没有变化、连续 15 分钟没有任何可验证 progress 时，先记录该 provider 为 `unavailable`，再发起显式取消并终止其进程树；raw transcript、session、诊断和终止原因必须保留，不自动重试。任何新 progress、cursor 或 session 变化都重置这 15 分钟计时。`unverifiable` 仍按 G-011 继续等待，不得当成无进展失败。明确取消、进程真实死亡、健康探针报告终态失败、15 分钟健康型无进展或 broker/owner 真实失联才可以结束。单次健康探针自身的请求回收和 orphan/TTL 只用于监控器/资源清理，不得终止仍有健康进展的 provider 会话。
- source_type/reference/exact_excerpt: user_reply + 3rd-review runtime diagnosis / current conversation / “A，为什么会有‘超时’的问题？不应该在任何地方设置时限吧，3rd-review里面有会话健康监控，只要会话还是活跃健康的，就不应该设置时限。而且现在的时限也太少了，几分钟的上限太容易超时了”
- approval_binding: pending final user confirmation
- facts_and_constraints: 修复前配置快照中三个实际 route provider 都是 `deadline_ms=360000`；broker 将其传给 `maxDurationMs`；process watchdog 先检查总耗时，再检查 idle progress，因此持续有进展也会在 360000ms 被判为 `PROCESS_TIMEOUT`。该段是修复前事实，不能当作当前配置。
- Logic: 健康监控已经提供会话存活/进展事实 -> 固定总时限会误杀健康会话 -> 不再使用固定 provider deadline -> 只对连续 15 分钟没有可验证进展的健康型停滞标记 unavailable，正常进展会不断重置 watchdog。
- choice_reason/impact: 直接消除本次 Kimi 被 6 分钟硬杀的根因；影响 3rd-review config、broker、process runner、Kimi adapter、v3 execution fact 和相关测试。
- consequences_and_risks: 正常但连续 15 分钟没有可验证进展的 provider 会被标记 unavailable，可能牺牲极慢但仍有效的会话；因此不能把总耗时、输出静默或单次 probe 超时当成该条件，必须保留 progress/cursor/session 证据。provider 若永远不产生终态，健康型无进展 watchdog 才能收尾；仍必须保留真实进程死亡、明确健康终态、显式取消、owner 失联和资源清理事实，不能把监控器卡死或僵尸进程伪装成健康。
- rejected_alternatives: B：把 360000 调大或改成 15 分钟总时限，仍会误杀有进展的长任务；C：仅关闭 thinking，不能消除生命周期错误；D：删除所有进程/探针回收机制，会留下无法治理的僵尸进程。
- unresolved_items/owner: build-spec/build-plan 定义健康终态和安全回收合同；build-code 移除正数 deadline 注入并做长时健康 smoke；verify-code 检查没有任何默认硬总时限复活。
- Supersedes: D-009 中“保留 deadline 直到 build-code 再决定”的未决部分；D-009 的“make-decision 不直接改实现/配置”边界仍保留。

## 三轮 talk

| talk_id | 问题/选项 | 后果/风险 | 用户选择/原文 | 队列变化 | source/evidence |
| --- | --- | --- | --- | --- | --- |
| T-001 | 页面范围、调研范围、失败处理 | 见 D-001 至 D-003 | A、A、A | Round 1 收敛 | user reply |
| T-002 | provider 身份、异源阈值、build-code review budget | 见 D-004 至 D-006 | A、A、A | Round 2 收敛；阈值表达仍需 Grill 复核 | user reply |

### T-003
- 用户回复原文：A，A（每个provider一次调用，保持盲审），A
- 真实回复绑定：第一项对应 D-007，第二项对应 D-008，第三项对应 D-009；均为本轮用户原文，不是 agent 推断
- 当前状态：Round 3 收敛；进入 Grill，仍未最终确认

## 调研

| research_id/source | 调研重点 | 关键事实 | 处理状态 | 关联 D |
| --- | --- | --- | --- | --- |
| F-001 local-route | 真实 route selection | make-decision detail requested/providers 为 kimi/coding、opencode/v4flash、codex/luna；build-plan initial 为 pi/k3、opencode/v4flash、codex/luna；各自 minimum_heterologous=1 | completed | D-002,D-005 |
| F-002 doctor | 配置结构 readiness | doctor 返回 status=ok；不能证明真实 inference 成功 | completed | D-002,D-003 |
| F-003 broker-config | provider source identity | 旧 codex/terra 条目曾 enabled 但 source_id 缺失；build-plan 的 pi/k3 仍可没有外部 raw source_id，但 profile key 可 dispatch，broker normalized result identity 以 provider id 作为 source_id fallback | repaired | D-004,F-010,OPEN-002 |
| F-004 runtime-chain | 实际执行链 | manifest 顺序存在，但运行时未完整校验前置 step 和交互 lifecycle | completed | D-003,D-006 |
| F-005 direction-review | 一轮方向审查 | 公开调用未获得可信终态；旧 runner 在一次 direction review 内启动第二个 challenge 请求，最终被中止 | unavailable | D-003,D-006 |
| F-010 config-origin | WorkflowHub host 的 wh_review.profiles 曾额外声明 codex/terra；3rd-review provider 表也有 enabled=true 但无 source_id 的旧条目；terra 不属于任何当前 WorkflowHub stage route | 不是本次 Kimi 失败来源；WorkflowHub profile 已移除，3rd-review 条目已 disabled；当前 route 必须按 stage matrix 读取，不能笼统写成“前三个” | repaired | D-004,G-006,OPEN-004 |
| F-011 legacy-v4-probe | 直接用旧 v4 broker 探针时，3rd-review 当前 tiers 只有 opencode/v4flash+antigravity/flash、pi/coding；kimi/coding 与 codex/luna 不在 tiers；Kimi 探针返回 invalid_output 且 providers=[]，Codex Luna 以 host_provider=codex 被正确判为同源请求无效 | 这是探针入口/宿主设置问题，不是 provider 已执行后的失败；标准 WorkflowHub v3 allowlist 路径不能用该结果判定 provider 不可用 | diagnosed | G-009; standard path smoke | main agent / make-decision / retain |
| F-012 v3-real-provider-smoke | 使用当前配置、真实附件包和 v3 provider_allowlist 各调用一次：kimi/coding runtime cb6a97fa-97bd-49b4-84cb-3e7b948148cc completed 54519ms；opencode/v4flash runtime 6035f5a9-73d8-4f34-a1f0-09e5cb32569a completed 36958ms；codex/luna runtime 439197ee-2f6e-4ffb-ba19-d2ece6ab3d55 completed 21306ms；三路原始输出均为 findings 空数组 | 三个 provider 的基础路由、认证、adapter 和终态均可用；此前客户端校验报错是本次诊断夹具把 materialId 误设为 bundle_id，broker 实际 manifest hash 为 5855def76ab7b9920cedf82c9787c31f7e9bc22fdbb87198e08747847c976ce8，不应归因给 provider | completed | G-009; retain raw runtime facts | main agent / make-decision / retain |
| F-013 hard-deadline-chain | 修复前 `/Users/Hugh/.config/3rd-review/config.json` 的三个实际 route provider 都是 `deadline_ms=360000`；broker 将其传给 `execute({ maxDurationMs })`；`liveness_interval_ms=1000` 只是心跳采样。Kimi runtime c9c20e64-5ed7-409b-85da-528ab543bfd6 在 360153ms 失败，进程仍有 `process_alive_at_ms`，最后进展距启动约 360084ms，累计 13653 个 progress events | 已证实是 3rd-review 的硬总时限误杀健康/有进展会话；该快照只保留为历史根因。当前配置已删除正数 deadline，配置校验也拒绝重新启用；健康 runner 只对明确 busy 且连续 15 分钟无进展收尾 | completed | D-010,G-010; 修复事实见 F-017 |
| F-014 detail-preflight | detail advice attempt `2a934aba-0786-4de8-84d3-d4f594a0c3fa` 在 provider dispatch 前因调用材料携带 detail 禁止字段 `objective_facts` 返回 `MATERIAL_FORBIDDEN`；provider_attempts=0，不能算 provider findings | 这是本地 review input 夹具错误，已修正为 detail 合同要求的 raw_requirement、approved_direction、draft_spec_or_acceptance；保留第一次 unavailable 事实，不把它改写为空 findings | repaired | detail advice retry once with corrected material; retain attempt/report refs | main agent / make-decision / retain |
| F-015 detail-advice | 修正材料后 detail attempt `c40210a8-6b0a-4dfe-b2c0-608ee8b59760` 按当前 route 派发 kimi/coding、opencode/v4flash、codex/luna；Kimi 275155ms completed，Codex Luna 98810ms completed，OpenCode 121755ms 以 `SESSION_IDLE_WITHOUT_TERMINAL` failed；有效 provider 2/3，minimum=1，产生 5 个 major 和 1 个 minor finding | 审查事实可用但 group outcome=partial；OpenCode 失败保留，不能改成空 findings。当前 draft 已按 findings 修正；按用户的一轮审查边界不再对未变化方向追加复审 | completed/partial | detail findings FND-003..FND-007; retain attempt/result/report refs | main agent / make-decision / retain |
| F-017 liveness-repair | 当前 3rd-review config 已移除正数 provider deadline；config validator 拒绝重新启用；health runner 只在明确 busy 且连续 15 分钟无进展时发布 `PROCESS_STALLED` 并清理；`single_round`/`full_only` 禁止 broker 自动复审 | 外部定向回归 82/82 通过；WorkflowHub client/runner 定向回归 81/81 通过；外部 worktree 仍未提交，不能把本地回归写成外部正式发布 | completed with external dependency caveat | D-010,D-011,D-012; P3 T302/T303 |

## 修复后当前事实（2026-08-18）

- WorkflowHub 配置快照 sha256：`81ae88a387800f8206cc64009ca4c553765d67902a678c5622e7f173b702afdf`。stage route 必须按下表读取：
  - make-decision.direction：`kimi/coding`、`codex/luna`；`single_round`；minimum=1。
  - make-decision.detail：`kimi/coding`、`opencode/v4flash`、`codex/luna`；`single_round`；minimum=1。
  - build-spec：`kimi/coding`、`codex/luna`；`single_round`；minimum=1。
  - build-plan：`pi/k3`、`opencode/v4flash`、`codex/luna`；`single_round`；minimum=1。
  - build-code：`kimi/coding`、`codex/luna`；`full_only`；minimum=1。
  - verify-code：`kimi/coding`、`codex/luna`；`single_round`；minimum=1。
- 3rd-review 配置快照 sha256：`6c6f72f56ae83dec28068719e90d3dc8846f8b38aaa0d8164e47990512715cd3`。当前配置不再含任何正数 `deadline_ms`；`codex/terra` 为 disabled；`pi/k3` 可缺外部 raw `source_id`，不再因此在 dispatch 前 unavailable。
- WorkflowHub 已把 `review_mode` 与 `review_flow` 一起发送；direction flow 固定为一次 public request 的 `reconstruct → reveal → challenge`。`single_round`/`full_only` 下 broker 不自动 fresh execution retry 或 same-session terminal recovery；全部已派发 provider 仍需先进入明确终态。
- 3rd-review 定向回归：health/process/Kimi/broker `82/82` 通过；WorkflowHub provider-client/runner `81/81` 通过。已有真实 build-plan group 事实仍保留：pi/k3、codex/luna 有效，opencode/v4flash 失败，未发生 provider retry。
- 本次修复只保留外部仓库中与上述协议相关的改动，未覆盖其余用户已有 dirty hunks；外部 worktree 仍未提交，不能把本地回归写成外部正式发布。

## 本次 detail review 执行诊断（不是 findings 内容）

这次表面上看到“失败很多、等待很久”，实际只有两个失败层次，不能混成 provider 质量结论：

1. `2a934aba-0786-4de8-84d3-d4f594a0c3fa` 是本地材料预检失败。detail 调用错误复用了 direction-only 的 `objective_facts`，在 provider dispatch 前被 `MATERIAL_FORBIDDEN` 拦截，`provider_attempts=0`，耗时为 0；这不是 Kimi、OpenCode 或 Codex 失败。
2. 修正材料后的 `c40210a8-6b0a-4dfe-b2c0-608ee8b59760` 只发起了一次 public group request，三个 provider 并行启动：Codex/Luna 在 98810ms 完成，OpenCode 在 121755ms 失败，Kimi 在 275155ms 完成；没有 provider retry。最终是 2/3 有效、1/3 失败、group partial，不是多轮复审。

### 流程根因

- **根因一：detail 材料没有类型化入口。** 调用方可以把 direction-only 字段带入 detail，虽然最终被预检拦住，但用户先看到一次无 provider 的失败。后续必须让每个 review track 只能构造自己的允许材料；预检失败继续保留事实，但不得进入 provider 调度。
- **根因二：等待全部终态带来的总耗时（按当前规则是预期成本，不是规则错误）。** 当前 broker 在同一 tier 使用 `Promise.all` 等所有已派发 provider 结束，之后应用 `minimum_heterologous=1`。因此 Codex 98.8 秒先完成后，流程仍等到 Kimi 275.2 秒；这符合用户本轮确认的 D-011/G-017。这里不是“一个有效结果即可提前交接”：至少一个有效结果只是收齐终态后的配置阈值判定。真正需要修的是 provider 的健康终态和失败收尾，避免 OpenCode 这类错误状态或硬时限把等待变成错误失败。
- **根因三：OpenCode 健康探针把不确定状态当成终态失败。** 本次 OpenCode 原始流只有 18 个事件，最后一次进展距启动约 15 秒；进程仍有 `process_alive_at_ms`，却在 121.755 秒以 `SESSION_IDLE_WITHOUT_TERMINAL` 结束。`createOpenCodeProbe` 对“非 busy/retry/idle 且没有 terminal message”的情况返回 `unverifiable + terminal=true`，health runner 随即终止；这没有遵守 G-011/D-010 的“unverifiable 继续等待”，也没有达到 G-012 的 15 分钟健康型无进展边界。
- **根因四（已修复）：固定总时限曾在实际 detail 路径生效。** 本次三个 provider 的 execution fact 曾带 `deadline_ms=360000`，broker 曾把它传给 `maxDurationMs`。本轮 Kimi 在 275.2 秒有 10847 个 progress events 并正常完成，所以它不是本次失败来源；该硬时限已从当前配置删除，配置校验也阻止恢复。
- **根因五：慢 provider 直接决定 group wall time。** Kimi 本身是有进展且最终完成的慢运行（约 4 分 35 秒、原始流约 1.45MB），不是失败；由于规则要求等待全部终态，它自然决定本组的用户等待时间。这是已确认策略的可观测成本，不应通过提前交接规避；后续只需让健康进展继续、让真实失活按 15 分钟无进展收尾，并把实际耗时落证据。

### 后续共同处理

- build-spec：把 direction/detail 材料做成按 track 的允许字段合同；明确“全部已派发 provider 进入终态后，再按配置阈值判定”的交接、剩余 provider 事实保留和失败收尾语义；不得把“至少一个有效结果”误实现为提前交接。
- build-plan：为材料预检、全部终态后的 threshold 判定、OpenCode `unverifiable`、15 分钟无进展、硬时限不注入和 Kimi 长时健康 smoke 分别安排设计任务、环境前置、测试 oracle 和最终证据路径。
- build-code：实现上述流程修复；当前 make-decision 不直接改 broker、adapter 或 provider 配置。
- verify-code：复放本次两个 attempt，证明预检失败不调 provider、单次 group 不自动复审、OpenCode 不会把 `unverifiable` 提前当失败、健康进展不会被 360000ms 杀掉，并核对实际交接耗时。

### 处理边界

- 本次 detail 的有效结果已满足当前 `minimum_heterologous=1` 的质量事实条件；不再为了这次失败追加 provider 复审。
- `MATERIAL_FORBIDDEN`、`SESSION_IDLE_WITHOUT_TERMINAL`、两个完成 provider 的原始 attempt、耗时、progress 和 partial group 都保留为不可变证据；不能合并成“provider 不可用”，也不能改成空 findings。

## grill

| grill_id | CONTEXT/冲突 | 结论 | ADR/四项退出 | source/evidence |
| --- | --- | --- | --- | --- |
| G-001 | provider 部分失败时，已达 minimum_heterologous=1 是否继续 | A：继续；保留已完成 findings，并明确 Kimi unavailable/审查不完整 | no ADR; reversible policy clarification | user reply: A |
| G-002 | 单次 provider 调用如何保持盲审 | A：同一次调用内先独立重建，再揭示选择并攻击 | no ADR; request-contract clarification | user reply: A |
| G-003 | 达到配置阈值后的下游条件 | 一个真实 provider 有效结果即可满足 `minimum_heterologous=1`；但必须先等全部已派发 provider 进入明确终态，其他失败事实保留 | timing clarified by D-011/G-017; threshold retained | user reply: 按照配置，只有有一个审查结果，就可以进入下游；本轮澄清“其他 provider 的终态是失败” |
| G-004 | 配置阈值与 make-decision 最终确认的关系 | A：仍需 Grill、decision draft、detail review 和用户最终确认 | no ADR; constitutional human-confirmation boundary | user reply: A |
| G-005 | build-code Phase 环境前置失败时是否先实现 | A：不实现；先记录 incomplete/unavailable 和环境证据 | no ADR; environment-before-code boundary | user reply: A |
| G-006 | 未进入 route 的 terra 残留配置如何处理 | C：移除 WorkflowHub profile，禁用 3rd-review provider 条目 | no ADR; stale-config cleanup | user reply: C，把terra配置处理一下 |
| G-007 | 每个 phase 的设计任务、完成状态、测试和最终证据如何落盘 | A：设计任务写入 plan.md/tasks.md；tasks.md 在 phase 完成后记录完成情况、测试结果和证据引用；最终证据落 task quality/evidence/，由 facts.jsonl、index.json、verify.json 共同引用 | no ADR; constitution-compatible four-material boundary | user reply: A，并要求 tasks 记录 phase 完成情况和测试证据 |
| G-008 | phase 完成判据 | A：设计任务完成、环境前置有证据、测试已执行或明确 not_applicable 并说明原因，tasks.md 已记录状态和证据引用；缺任一项只能是 incomplete/unavailable | no ADR; evidence-before-completion boundary | user reply: A |
| G-009 | provider 失败后的重试与检查边界 | 允许为定位原因做有明确目的的受控 smoke/复试，并保留每次真实结果；生产 make-decision/build-spec/build-plan/verify-code 非 build-code 审查仍是一轮 public group，不把诊断复试变成自动复审；失败按 unavailable/incomplete 保留 | no ADR; diagnostic retry is not workflow retry | user reply: 进行适当的重试和检查，看看为什么会有某一个provider不能正常运行 | 
| G-010 | 健康且有进展的 provider 是否可被固定总时限终止 | A：不设 provider 固定总时限，也不设全局 idle/no-output kill；健康会话继续，只有真实终态/明确取消/真实失活或 owner 失联才结束；probe 回收和 orphan/TTL 仅做安全清理，不杀健康会话 | no ADR; lifecycle boundary now explicit; build-code required | user reply: A，为什么会有“超时”的问题？不应该在任何地方设置时限吧，3rd-review里面有会话健康监控，只要会话还是活跃健康的，就不应该设置时限 |
| G-011 | provider 仍存活但健康探针暂时 `unverifiable` 时是否立即结束 | A：不结束；保留 `unverifiable` 诊断并继续等待真实终态或显式取消 | no ADR; unavailable is not inferred from missing health proof | user reply: A |
| G-012 | provider 进程仍活着但 health probe 长时间 `busy` 且无新 progress 时如何收尾 | B：连续 15 分钟没有可验证进展就标记 `unavailable`；新 progress/cursor/session 变化会重置 watchdog；这不是总时限，也不对 `unverifiable` 直接套用 | no ADR; health-based no-progress boundary; build-code required | user reply: B，最长15分钟无进展就标记 unavailable |
| G-013 | 无进展达到 15 分钟并标记 `unavailable` 后，仍存活的 provider 进程如何处理 | A：写入 `unavailable` 后显式取消并终止进程树；保留 raw/session/诊断/终止原因，不自动重试 | no ADR; no-orphan cleanup and evidence preservation | user reply: A |
| G-014 | 15 分钟健康型无进展的公开错误语义 | A：使用明确的健康停滞错误（如 `PROCESS_STALLED` 或 `HEALTH_NO_PROGRESS`），不再把它伪装成普通 `PROCESS_TIMEOUT` | no ADR; error semantics must match lifecycle fact; exact code name pending | user reply: A |
| G-015 | 健康型无进展的具体公开错误码 | A：使用现有 `PROCESS_STALLED`，不新增错误码体系 | no ADR; reuse existing semantic path | user reply: A |
| G-016 | Grill 的交互节奏 | A：剩余独立方向问题一次成组提出，用户一次回答后再进入 decision draft；不再逐条追问实现细节 | no ADR; interaction correction for R-002/R-003 | user correction: “你越问越细节了，而且还没一次问一组问题，太浪费时间了” |
| G-017 | 一个 provider 已终态、其他 provider 仍运行时的下游时序 | B：先等待所有已派发 provider 到明确终态，再按配置阈值决定下游；不设置总时限，15 分钟无进展按 G-012/G-013 收尾 | no ADR; group terminal gate; build-code required | user reply: B |
| G-018 | 合法 `findings: []` 是否算一个审查结果 | A：算合法审查结果，可满足配置的单结果交接条件；但不能解释成无问题、通过或阶段完成 | no ADR; constitutional empty-findings boundary | user reply: A |

## Decision draft after Grill

- 状态：accepted；已完成三轮 Talk、方向调研、Grill、本轮用户选择、detail advice 和 stage-end consistency check；detail findings 已逐项修正并记录，用户已完成最终确认。
- 方向：从原始需求修 WorkflowHub 的真实执行链，不新增产品功能。完整流程固定为 `make-decision -> build-spec -> build-plan -> build-code -> verify-code`；下游不得跳阶段，也不得让 build-spec 代替 make-decision 补方向。

### 用户流程

1. 读取原始需求，记录用户流程、页面范围、数据状态、成功/失败边界、非目标和延期项。
2. Talk Round 1 一次提出独立的范围、调研和失败处理问题；等待用户回答后再重排。
3. 做必要的本地代码、配置、真实 route 和 provider 调研；doctor 只能算结构事实，不能冒充 inference 成功。
4. Talk Round 2 一次提出 provider 身份、异源阈值和审查预算问题；等待用户回答后确定方向。
5. direction advice 按当前配置做真实多 provider 审查；非 build-code 每个 provider 一次 public request，盲重建和挑战必须在同一次请求内完成；失败保留 unavailable/incomplete，不自动复审。
6. Talk Round 3 一次处理方向审查发现、矛盾和关键风险；随后 Grill 只问会改变方向的独立问题，并成组等待用户回复。
7. 写 decision draft；detail advice 只审查当前决策是否漏需求、漏边界、扩大范围或违反宪法，不把 advice 当推进许可证。
8. 做 stage-end consistency check，展示最终 plain-language decision card；只有用户明确确认后，才允许发布 make-decision 结果并交接 build-spec。Clarify 的真实交互由 build-spec 明确负责：成组提问、等待回复、重排并落证据；它不能补写本阶段缺失的方向。若 Clarify 改变方向，必须回到同一任务的 make-decision 修正。

### 页面/交互范围

- 不新增 dashboard、独立 UI 页面或可视化编辑器。
- 只修现有调用方可见交互：批量问题卡、等待用户回复、选择后果/风险、provider/group 终态、findings、unavailable/incomplete、最终确认和证据引用。
- Grill 与 Talk 的问题必须一次成组提出；不把实现细节拆成连续微问题消耗用户时间。

### 数据状态与生命周期事实

- 用户层：`waiting_for_user`、已回复、决策草稿、最终确认待处理；没有用户回复就等待，不猜答案。
- provider 层公共 member：`running`、`completed`（含合法 `findings: []`）、`failed`、`cancelled`；`unavailable`、`partial` 只作为 attempt/group/质量投影，不能写成 member status；`unverifiable` 只记录诊断并继续等待。
- provider 健康：固定总时限为 `null`；只要有可验证 progress/cursor/session 变化就继续。health probe 明确 `busy` 且连续 15 分钟没有可验证进展时，记录 `PROCESS_STALLED`，标记 `unavailable`，显式取消并终止进程树，保留 raw/session/诊断，不自动重试。
- broker/owner 健康 oracle：broker owner、guardian 和 worker 的 identity 必须可验证；owner 仍存活时，单次 probe `unverifiable` 不终止 provider；只有 owner identity 确认死亡，或 worker identity 确认死亡，才记录 `ORPHANED_BROKER`/`PROCESS_DEAD` 等真实终态并清理。`liveness_interval_ms` 是采样，不是终止时限；TTL 只做资源回收。
- group 层：所有已派发 provider 必须先进入明确终态；随后按 `minimum_heterologous=1` 判断是否具备流程交接条件。一个空 findings 结果可以满足“有结果”，但不能成为“无问题/完成/通过”证据。
- 阶段层：`partial/incomplete` 是事实状态，不是自动放行或自动阻断；缺质量事实不能被改写成 pass，最终用户确认仍是 make-decision 完成边界。

### 成功与失败边界

- make-decision 成功：原始需求完整记录；三轮 Talk 和 Grill 有真实用户回复；Clarify 的 build-spec owner、输入边界和回流规则已明确；必要调研有 route/provider/transport 事实；direction/detail advice 的 provider、findings 和失败事实真实保留；所有 findings 有处置；stage-end check 有输入、输出和 evidence refs；用户最终确认；既有 interaction aggregate 按 `workflowhub-interaction-aggregate.v1` 记录 `task_id`、`stage`、`snapshot_tree`、Talk/Clarify 状态、`decision_ref` 和 `decision_hash`。
- 可交接但不等于通过：已派发 group 全部终态，且至少一个合法 provider 结果满足配置阈值；group 仍需保留 partial/incomplete 和质量缺口。
- 失败：无用户回复、材料不完整、provider 无可信终态、owner/worker 失联、进程死亡、15 分钟健康型无进展、审查 transport 失败、findings 未处置、Clarify 证据缺失、环境/证据缺失；这些都不能改写为空 findings 或成功。

### 非目标

- 不删除或静默跳过不可用 provider，不通过修改 route 掩盖失败。
- 不设置 provider 固定总审查时限，不恢复 360000ms 或 Kimi 15 分钟 plan 总上限，不添加隐藏自动复审/无限 retry/fallback。
- 不新增 public phase、recovery、selector、review-loop、rebind 或第五份当前材料。
- 不在 make-decision 直接改实现、启动正式 build-code、提交、合并或发布。

### 延期与交接

- build-spec：把本 draft 转成可测试合同，不能补方向或隐式补需求；必须真实执行 Clarify 的成组交互、等待/重排和证据落盘；特别覆盖一次 provider public request、group terminal gate、空 findings 语义、`PROCESS_STALLED`、owner liveness 和 final confirmation。
- build-plan：为每个 Phase 写设计任务、环境启动/前置、测试或 not_applicable 理由、最终证据落盘和 tasks.md 完成记录。
- build-code：删除正数 provider deadline/default/Kimi 总时限注入；实现健康型 15 分钟无进展收尾、显式取消/进程清理、单次 provider request 和真实 smoke；所有 raw/session/失败事实保留。
- verify-code：独立检查实现、测试、真实运行证据、宪法边界和阶段证据引用；不把旧 timeout、空 findings 或 doctor 结果当完成证据。
- 已处理：terra 不在当前 WorkflowHub route；WorkflowHub profile 已移除，3rd-review 条目已禁用；当前实际 route 按 stage-scoped route matrix 和 WorkflowHub 配置读取，不再笼统写成“前三个 provider”。

## 审查处置

| finding_id | 原始事实/来源 | 后果 | status | next_action/evidence_ref | owner/consumer/retain_or_delete |
| --- | --- | --- | --- | --- | --- |
| FND-001 | direction review broker 未返回公开终态 | 不能产生 findings，也不能宣称无问题 | needs_human | 保留 unavailable；不得另开第二轮；待同一任务修复 review 调度后再验证 | main agent / make-decision / retain |
| FND-002 | Kimi 复杂 direction request 有进展但被 360000ms 硬总时限终止；终止前仍有进程存活和 progress events | 不能把超时写成空 findings、成功或自动复审 | needs_human | build-code 移除 provider hard deadline；增加“连续 15 分钟无可验证 progress 才 unavailable”的健康 watchdog；保留健康/终态/取消/owner 失联事实；用真实 Kimi direction packet 做长时健康 smoke | main agent / build-code / retain |
| FND-003 | detail review：Clarify 没有进入用户流程、状态和验收边界 | 原始需求 R-003 仍可能在后续被遗漏 | fixed_in_draft | Decision draft 增加 Clarify 的明确 owner、批量交互、等待/重排、缺失证据和方向变化回流；build-spec 负责执行真实 Clarify，不能用它补方向 | main agent / make-decision -> build-spec / retain |
| FND-004 | detail review：provider 层把 unavailable 当成员状态 | 可能违反 workflowhub-result.v3 公共协议 | fixed_in_draft | Draft 改为 provider member 只用 completed/failed/cancelled；unavailable/partial 只出现在 attempt/group/质量投影 | main agent / make-decision / retain |
| FND-005 | detail review：`unverifiable` 持续时缺少 broker/owner 失联 oracle | 无固定总时限下 group 可能无限等待或错误收尾 | fixed_in_draft | Draft 增加 owner identity/guardian/worker liveness 判据；owner 确认死亡才写 ORPHANED_BROKER/unavailable 并清理，健康会话继续 | main agent / make-decision -> build-code / retain |
| FND-006 | detail review：必要调研和 stage-end check 没有输入、输出和验收 oracle | 不能判断 make-decision 是否真实完成 | fixed_in_draft | Draft 增加 route/provider/transport/findings/disposition、用户确认和 stage-end evidence 的最小验收清单与引用要求 | main agent / make-decision / retain |
| FND-007 | detail review：interaction aggregate 绑定语义未落盘说明 | 最终交互证据难以验证 | fixed_in_draft | Draft 引用既有 aggregate 合同：schema_version、task/stage、snapshot_tree、Talk/Clarify 状态、decision_ref/hash；不新增第五份当前材料 | main agent / make-decision / retain |

### Detail provider finding identity binding

| provider finding_id | 对应处置 | 原始证据 |
| --- | --- | --- |
| F-3d5db0b45eac | fixed；对应 FND-005，已补 owner/broker liveness oracle | `quality/reviews/results/make-decision-detail-b51c6a35dc230df674ca9e5dc1f2c81c0ec3ec86-c40210a8-6b0a-4dfe-b2c0-608ee8b59760.json` |
| F-51130d24f39f | fixed；对应 FND-006，已补调研与 stage-end 的输入/输出/oracle | 同上 |
| F-74b7c23574eb | fixed；对应 FND-007，已补 interaction aggregate 绑定字段 | 同上 |
| F-776945fc6283 | fixed；对应 FND-003，已补 Clarify owner、交互和回流边界 | 同上 |
| F-bba8518d8550 | fixed；对应 FND-004，已分离 provider member 与 attempt/group 状态 | 同上 |
| F-c102c433eebc | fixed；与 FND-003 同属 Clarify 遗漏，已由同一处修复覆盖 | 同上 |

## Kimi 执行诊断（F-006 至 F-009）

| research_id | 真实事实 | 结论 |
| --- | --- | --- |
| F-006 kimi-wire-smoke | 使用实际 Kimi adapter、可写 workdir、保持 stdin，initialize -> prompt -> result.status=finished 成功；耗时 11.8 秒 | 命令路径、认证、Wire 握手和 adapter 基本协议可用 |
| F-007 kimi-real-completed | 同一配置下已有两次真实 Kimi 审查终态成功，耗时 212.282 秒和 261.216 秒；均有 TurnEnd 与 prompt.finished | Kimi 不是恒定不可用，不能删除或静默跳过 |
| F-008 kimi-real-timeout | kimi/coding 配置为 thinking=true、deadline_ms=360000；一次真实方向请求在 360.509 秒触发 PROCESS_TIMEOUT，原始流约 1.38 MB、6 个 Step、10 次 ToolCall，但没有终态；另一次请求被中止前约 5 分钟仍只有思考/工具事件，约 1.20 MB、3 个 Step、15 次 ToolCall，也没有 prompt.finished | 是有进展但无终态的超时，不是启动失败；不能把它写成空 findings 或成功 |
| F-009 kimi-prompt-comparison | 同一实际审查包用简化提示且 thinking=false 可在 104.146 秒结束；换成真实 review prompt 后 thinking=false 在 180 秒仍无终态并超时 | 单独关闭 thinking 不能证明已修复；复杂材料/提示触发的长推理和工具链才是主要风险，thinking=true 会放大风险 |

### 根因判断

1. Kimi CLI 和 adapter 的最小协议链路正常。
2. 真实 direction review 会让 Kimi 读取合同、技能和多份要求材料，并持续进行多步工具/思考；当前 provider profile 没有独立的 step/token 上限，但 broker 仍把配置的 6 分钟 `deadline_ms` 当成硬总时限。
3. WorkflowHub 的旧 direction runner 还会把一次逻辑审查拆成两个串行 public request；这会把 Kimi 的长耗时风险放大，并与本任务非 build-code 只做一轮异源 findings 的要求冲突。
4. Kimi 在硬总时限到达前持续产生进展，但没有 `prompt.finished`；当前正确事实是被硬时限误杀且结果 unavailable/incomplete，不能通过重试、空 findings 或自动推进掩盖。
5. 3rd-review 已有 liveness/health supervision；当前实现的错误在于把“监控健康”与“固定生命周期”并存，并让后者优先终止。

### 决定与交接

- 本阶段不直接改 Kimi 全局配置、不改 adapter、不重跑正式 direction review；当前仍处于 make-decision，直接实现会跳到 build-code。D-010 已确定 build-code 必须删除硬总时限路径，不是继续讨论“把时限调大”。
- 将问题记录为 FND-002 / build-code 必修项：
  - 把 make-decision direction 改为一次 public group request；如果仍需内部重建/挑战，必须在同一受控请求内完成，不能新增第二次 public request。
  - 为 Kimi 设计可验证的复杂审查边界：不能用固定总时限或普通输出静默 kill；仅允许“health probe 明确 busy 且连续 15 分钟无 progress/cursor/session 变化”触发 unavailable，并以真实配置和真实 direction packet 做长时 health smoke。
  - 保留原始 Kimi transcript、终态/取消/失活事实和 provider identity；不能把健康会话被硬杀的 `PROCESS_TIMEOUT` 继续当作正常质量结论。
- build-spec 只能把这条已确认事实转成可测试要求，不能补方向；build-plan 必须为上述 Kimi smoke 和失败证据安排环境/证据落盘；build-code 才能改实现。

### Stage-end spec-analyze 处置

- FND-008：第一次 stage-end 分析把 R-006 的实际描述写成“当前 task 尚未发布到 build-spec”，语义校验把这个无关否定词误判为需求偏差；这不是产品方向问题，也不是 provider review finding。
- 处置：修正 stage-end packet 的实际描述，只保留“标准流程从 make-decision 开始、按确认后交接 build-spec、不跳阶段、不补方向”的当前事实；保留第一次分析的 `inconsistent` 结果和修正后的新结果，不追加 provider review。

## 最终确认

- 状态：accepted
- 用户原文与 host-visible 绑定：用户回复“确认，继续吧。注意方案设计的时候要考虑：不要违反workflowhub宪法，不要降低workflowhub各个stage的执行质量。”
- confirmation_ref: `quality/confirmations/158966b7daf8e620e8c70ec75ebbc86b955cc8bd2eeaca52431a461eb670cc1b.json`
- confirmed_at: `2026-08-18T06:11:03.872Z`
- 用户确认的附加约束：后续 build-spec/build-plan/build-code/verify-code 必须以宪法和各 stage 质量合同为硬边界，不得用降低审查、测试、交互或证据要求换取速度。
- 未决交接：Clarify 由 build-spec 真实执行；detail advice 已完成，OpenCode 的 partial 失败事实保留；interaction aggregate 绑定当前已确认 decision-log。

## 拒绝方案

| 选项 | 拒绝理由 | 关联 D |
| --- | --- | --- |
| 删除不可用 provider | 会掩盖配置和身份问题 | D-004 |
| 自动 fallback 或跳过失败 | 会制造 false green | D-003 |
| 通过重复审查直到空 findings | 浪费时间且不是真实质量 | D-006 |

## 风险与延期交接

| risk/deferred_id | 风险或延期内容 | 触发/后果 | 处理阶段/owner |
| --- | --- | --- | --- | --- |
| RISK-001 | 真实 provider route 仍可能 transport 失败或 provider 不产生可信终态 | 对应 review 保持 unavailable/partial | build-code / verify-code |
| RISK-002 | minimum_heterologous=1 可能不足以表达真正多源 | 一个 provider 成功即可可用 | Talk 3 + Grill / user |
| DEFER-001 | 独立 dashboard 或 UI 页面 | 不在当前原始需求 | 后续独立需求 / user |
| DEFER-002 | 具体接口和 schema 改法 | 当前只确认方向，不进入实现 | build-spec/build-plan，但不得补方向 |

## 质量边界

- 质量事实：route selection、doctor、旧 provider identity 缺口已修复、direction review unavailable、detail advice partial（2/3 provider 完成）、运行时链路缺口、Kimi hard deadline 误杀证据。
- 推进资格：这些事实不自动宣称质量通过；make-decision 已完成当前决策确认，允许按当前四份材料交接 build-spec。
- 完成判据：Talk 三轮、Grill、两类 advice review、findings disposition、stage-end 分析、用户确认和 interaction aggregate 全部真实存在。
- 不可逆授权边界：当前没有 commit、merge、push、cleanup 或正式发布授权。

## 未决项

| item_id | 当前状态 | 未决内容/触发 | owner / handoff | close_condition |
| --- | --- | --- | --- | --- |
| OPEN-001 | resolved | minimum=1 仍需在全部终态后应用；不再重新询问 | P2/P3 消费 D-011/G-017 | 当前 config snapshot 与 group terminal gate 一致 |
| OPEN-002 | resolved | pi/k3 缺外部 raw source_id 不得成为重复 dispatch gate | build-code / broker result boundary | profile key 可 dispatch，result identity/material/group 可回指 |
| OPEN-003 | resolved | direction 必须一次 public request 且内部保持 blind/reveal/challenge | P2/T202、verify-code | 一次 group、每 provider 一次调用、flow order 可验证 |
| OPEN-004 | resolved | route 事实按 stage 分开记录，不能把 make-decision route 当成 build-plan route | make-decision/build-plan 当前材料 | route matrix、材料 hash 与 config snapshot 一致 |

## 延期与未决交接字段（当前 canonical handoff）

| id | current_status | owner | trigger | handoff | close_condition |
| --- | --- | --- | --- | --- | --- |
| DEFER-001 | deferred | user / future make-decision | 用户提出独立 dashboard 或 UI 页面需求 | 回到 make-decision，重新确认范围和页面边界 | 新四材料完成并经用户确认 |
| DEFER-002 | deferred | build-spec / build-plan | 进入具体接口或 schema 设计 | build-code 只消费冻结材料，不自行补方向 | plan/tasks 给出实现边界和证据闭环 |
| OPEN-001 | resolved | build-plan / verify-code | 未来改变 minimum 或终态时序 | 重新读取 config snapshot 与当前材料 | 本任务 snapshot 仍记录 minimum=1、全终态后应用 |
| OPEN-002 | resolved | build-code / broker owner | 新 provider 或 profile identity 改变 | profile key preflight + broker result identity | 当前三个 build-plan profiles 可 dispatch 并有 identity |
| OPEN-003 | resolved | build-code / verify-code | direction runner 或 broker flow 改变 | 保持一次 group、一次 provider request、flow contract | direction-review.v1 order/reveal/terminal facts 可回指 |
| OPEN-004 | resolved | make-decision / build-plan | stage route 或 config snapshot 改变 | 更新 stage-scoped route facts，再刷新四份材料 hash | 当前 route matrix 与两份 config hash 一致 |

## Supersedes

本轮不改写旧 reset/recovery 记录；旧历史只读保留。本决策已由用户确认，后续阶段只能消费当前四份材料和当前质量事实。

## 文档结果

- CONTEXT.md：no-change；当前只确认本任务范围和交互边界，没有新增领域术语。
- ADR：not-needed pending；是否需要 ADR 要等 Talk 3/Grill 确认不可逆取舍后判断。
- ADR criteria：hard to reverse pending / surprising without context pending / genuine trade-off pending。
- 术语/ADR 冲突及处理：将“页面”暂定解释为调用方可见交互面；独立 UI 页面延期，待用户另行确认。
- 不复制 spec 的边界：当前日志只记录索引、事实、选择、后果和风险，不写接口、任务和测试细节。

## ATTACHMENT_DELIVERY_UNSUPPORTED 根因与修复（2026-08-19）

### 原始问题

verify-code 的一次真实异源 group 中，`kimi/coding` 和 `antigravity/flash` 以 `ATTACHMENT_DELIVERY_UNSUPPORTED` 失败，`codex/luna` 成功；失败消息是 `provider cannot accept requested attachment delivery always_embed`。这不是 provider 没配置，也不是 Kimi/Antigravity 的 capability 声明错误。

### 根因

`skills/wh-review/scripts/review-provider-client.mjs` 原先用“provider 列表里是否有 Codex”推导整个 group 的附件模式：只要有 Codex，就把 group 统一发送成 `always_embed`，并把所有 manifest entry 设置为 `embed:true`。这是错误的组级决策；Kimi 和 Antigravity 只支持 `file_only`，所以 broker 在 provider dispatch 时按合同拒绝它们。

### 选择

v3 group 的默认附件模式改为 3rd-review 已支持的 `negotiated`：manifest 保持共享 `embed:false` 材料身份，broker 再按每个 provider 的 capability 选择实际传输。这样同一组里 Kimi/Antigravity 走 `file_only`，Codex、OpenCode、Claude Code、Pi 按 capability 走 `always_embed` 或 `file_only`，不拆 group、不重复审查、不降低异源性。

显式传入 `file_only` 或 `always_embed` 仍保留给单 provider 或明确受限调用方；标准 WorkflowHub review runner 不再自行猜测 group 级模式。没有修改 `/Users/Hugh/.config/workflowhub/config.json` 或 `/Users/Hugh/.config/3rd-review/config.json`。

### 其他 profile 检查

`opencode/k3`、`opencode/coding`、`opencode/v4flash`、`opencode/v4pro`、`claude-code/opus`、`grok/grok`、`pi/k3`、`pi/coding`、`pi/v4flash`、`pi/v4pro` 均通过 WorkflowHub profile 声明、3rd-review provider 配置、`model/effort/thinking` 对齐、enabled、可执行文件和 adapter capability 检查。四类 adapter 的 focused regression 为 78/78；四个可执行文件 `--version` 均成功。未配置 `source_id` 的 profile 由 3rd-review 按 provider profile id 默认生成；它是结果 provenance，不再作为重复 dispatch gate。

### 验证与边界

- RED：新 mixed-provider 回归在旧实现下收到 `always_embed`，exit=1。
- GREEN：WorkflowHub provider-client 23/23、mixed-delivery runner 1/1、3rd-review negotiated delivery 1/1、其他 adapter/broker focused tests 78/78，均 exit=0；证据：`quality/evidence/attachment-delivery-repair-20260819.json`。
- 真实 provider 没有重新调用；原失败 attempt 继续保留，不能改写成历史成功。doctor 和 `--version` 只证明可执行文件、workspace 和协议 seam，不证明真实认证或真实审查质量。
- 之前的 16 files/268 tests final aggregate 在本次源码修复后已过期；按用户“不跑回归”要求不重跑，最终 close 前只允许按既定规则刷新一次。

### 宪法对照

修复只改变现有 `ReviewProviderClient` 的附件传输选择，继续使用现有 `doctor/status/run/review/verify/confirm/authorize` 公共边界；没有新增 authority、selector、recovery、successor、第五份当前材料或自动复审。provider 失败仍保持原始 failure fact，真实 provider/host 缺失仍保持 `unavailable/incomplete`，符合 F3/Q1/Q2/Q3。

## Exit checks

- 上下文一致：pass，stage-scoped route matrix、修复后 config hashes 和历史 review facts 已分开记录；direction review unavailable/partial 事实继续保留。
- owner/接口一致：pass，WorkflowHub profile key 可作为 dispatch identity，broker result 提供最终 source identity；terra 已从 WorkflowHub profile 移除并在 3rd-review 中禁用。
- 失败语义明确：pass，失败保持 unavailable/incomplete，不自动推进。
- 范围与延期明确：pass，独立 UI 页面列为延期。

## Stage Agent host 边界修复（2026-08-19）

### 原始需求

本次原始需求没有要求真实 Stage Agent host，也没有要求 Multica 参与当前任务。当前任务要求的是按 WorkflowHub 五阶段完成流程修复，并在完成后由 `verify-code` 反向检查原始需求、设计、完整用户流程和证据。

### 关键事实

- `CONSTITUTION.md` 的 F3/Q1/Q2 明确规定：四份当前材料决定能否开始或继续工作；review、receipt、audit、host 和 unavailable 事实不是推进许可证。
- `runtime/stage/stage-runner.mjs` 的 `runOfficialStage()` 原先在 handler 执行前无条件要求 `receipts.stage_outcomes`，缺少外部 host 就直接抛出 `MATERIAL_INCOMPLETE`。
- 当前 Codex 线程没有 authenticated Stage Agent host；这只能证明本次外部执行事实 unavailable，不能证明当前代码不能继续修复。
- 旧任务记录把“stage-end bridge unavailable”写成“不进入 verify-code”，把执行事实、质量完成和阶段推进混成一条门槛。

### 选择

保留已提供 Stage Agent outcome 时的完整 hash、snapshot、manifest、step、skill 和 `spec-analyze` 认证；但将 outcome 改为可选执行事实：未提供时，正式 run 仍按四份材料执行当前 handler，monitoring 记录 `unavailable`，不生成 synthetic outcome，不把缺失事实写成 pass。

### 理由

这样同时满足两条边界：外部 host 真实存在时不能伪造或放松认证；外部 host 不存在时也不能阻止同任务继续工作。质量完成仍由测试、逐 AC、独立审查、finding 处置和真实交接决定；本次不降低 `verify-code` 的反向验收强度。

### 延期与交接

- 本次只修复 host outcome 的推进边界，并补充无 host 的运行时合同测试；没有启动 Multica，也没有跑全量回归。
- 当前 T403 final aggregate 已在最新运行时改动后重新执行并通过（16 files、268 tests、exit 0），`quality/tests/final-current-snapshot.json` 将绑定当前四份材料和本次 aggregate；它只证明本地当前快照，不覆盖外部 host 或 provider 限制。
- 下一步进入 `verify-code`，继续按四份材料反向验收；若当前功能的真实外部交互仍没有可认证证据，最终质量结论必须保持 `incomplete/unavailable`，不得误报为完成或 close。

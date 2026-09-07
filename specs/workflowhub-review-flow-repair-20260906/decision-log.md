# Decision Log — workflowhub-review-flow-repair-20260906

> 生成日期：2026-09-06
> 任务材料路径：specs/workflowhub-review-flow-repair-20260906/（认证 worktree：/Users/Hugh/Hugh/Project/workflowhub-workflowhub-review-flow-repair-20260906）
> 分支：task/workflowhub/workflowhub-review-flow-repair-20260906；baseline：b16d5bcf
> 当前 stage：make-decision（talk、grill、direction-advice×2、detail-advice、spec-analyze 均完成；**D-001~D-008 已获用户批准**，见"批准与发布记录"节；正在收口：publish-decision 与 stage-reflection）

## 原始需求（R 表）

| source_id | 原始需求/约束 | 来源引用/原文摘录 | 关联 D/处理状态 |
| --- | --- | --- | --- |
| R-001 | 废除 workflowhub config.json 中 wh_review.profiles 的完整记录（18 个）与每个 provider 的 priority；provider 配置应以 3rd-review config.json 为唯一事实源 | 用户原话："为什么要记录完整的'profiles'？每个provider为什么要记录'priority'？这都没必要吧，wh-review调用的是'/Users/Hugh/.config/3rd-review/config.json'里的配置，只要'/Users/Hugh/.config/3rd-review/config.json'里面有正确的provider配置不就可以了吗？" | 已确认方向（T-001；D-001） |
| R-002 | wh-review doctor 不应因"本机 opencode/v4flash 配置与 3rd-review 配置不一致"而产生真实阻塞；priority 有问题也不应产生阻塞 | 用户原话："为什么审查时候经常有各种真实阻塞：wh-review doctor 不是 reviewer 内容问题，而是本机 opencode/v4flash 配置与 3rd-review 配置不一致…有的时候'priority'有问题也产生阻塞？很不合理。" | 已确认方向（T-002；D-002） |
| R-003 | 审查耗时必须下降到合理水平：现在单次 10+ 分钟且经常因各种原因失败 | 用户原话："现在审查特别浪费时间，往往一次审查要10多分钟，还经常因为各种原因失败。" | 已确认方向（T-002；D-002） |
| R-004 | 审查结果必须留在 task_dir，可追溯 | 用户原话："现在审查也极少在task_dir文件中留下审查结果，导致我追溯问题都很难。" | 已确认方向（T-003；D-001） |
| R-005 | 每个阶段审查只进行一次：不因状态/快照变化重审，不追求"没有findings" | 用户原话："现在审查很多时候会进行很多次，规定只进行一次，但是往往会忘掉，总是追求'没有findings'或因为状态或快照变了，又要重新审查，太浪费时间和token了。" | 已确认（T-004；D-007：重审语义归 close-readiness 任务实现） |
| R-006 | 基于四份根因分析文档调研后再修复 | 用户原话："请把这些文件和问题都仔细调研分析，看看审查流程到底是什么问题，应该怎样的修复？"（文档：workflowhub-review-process-root-cause-analysis-20260905 / PaperBuilder-T08审查流程根因调研 / t09-review-process-root-cause-analysis / workflowhub-m17-review-process-root-cause-analysis-20260905） | 调研完成（F-009） |
| R-007 | 按标准 WorkflowHub 流程执行：先创建 worktree，从 make-decision 开始，不跳阶段，不依赖 build-spec 补需求；make-decision 中与用户一起梳理完整用户流程、页面范围、数据状态、成功/失败边界、非目标和延期项；注意主会话上下文控制与子代理派发；Talk 和 grill 用大白话说明选项、后果和风险 | 用户原话："请按标准 WorkflowHub 开始这个任务吧，先创建worktree，然后从 make-decision 开始，不要跳阶段，也不要依赖 build-spec 补需求…" | 进行中（本文件全篇） |

## 事实基线（F 表）

| fact_id | 事实 | 证据位置 |
| --- | --- | --- |
| F-001 | 双文件双源：workflowhub config `wh_review.profiles`（18 个，每个带 model/effort/thinking/priority）与 3rd-review config `providers`（19 个，带 command/model/effort/thinking/auth/source_id）重复定义同一批 provider；wh-review 的 doctor（validateWhReviewProfileDeclarations）强制 profiles[P].{model,effort,thinking} 逐字段等于 3rd-review providers[P]，不一致即抛错 → 整轮路由 unavailable（真实阻塞） | /Users/Hugh/.config/workflowhub/config.json；/Users/Hugh/.config/3rd-review/config.json；skills/wh-review/scripts/wh-review-cli.mjs doctor；skills/wh-review/scripts/third-review-host-config.mjs |
| F-002 | priority 是路由数据非权重：rankRouteProfiles 按 priority 升序（并列按 route index）重排 initial/closure，selectTrustedReviewProviderSelection 据此决定派发组；E2E frozenTaskBoundPolicy 用 priority 填 profile spec；3rd-review 的 tiers 仅在无显式 wh_review route 时作 legacy 兜底（按 adapter 去重取最高优先代表） | skills/wh-review/scripts/third-review-host-config.mjs |
| F-003 | doctor 不读本机 CLI 配置（opencode.json 等）；本机 /Users/Hugh/.config/opencode/opencode.json 仅定义 provider "opencode" 下 deepseek-v4-flash/deepseek-v4-pro 与 pax/qwen3.8；两份配置中 opencode/v4flash model="deepseek/deepseek-v4-flash-vision-exp"（不同命名空间）。用户感知的"本机配置与 3rd-review 不一致"实为"workflowhub 声明的 profile 与 3rd-review 定义不一致"（m17 attempt c750e163 ROUTE_UNAVAILABLE 实证） | ~/.config/opencode/opencode.json；m17 根因文档 F 段 |
| F-004 | 失败晚暴露：execution-efficiency 任务中无效 provider（opencode/pax3.8、grok/grok）跑 250–381s 后才报 PROVIDER_IDENTITY_INVALID；T08 三次 canonical attempt 全部 REVIEW_EXECUTION_TIMEOUT（provider_attempts=[]）；单次 provider 有效耗时亦达 148–353s | workflowhub-review-process-root-cause-analysis-20260905；t09/t08 根因文档（attempt.json 记录） |
| F-005 | 超时结构：provider 单次默认 180s（可上提至 600s）、外层 broker 600s（env WH_REVIEW_BROKER_TIMEOUT_MS 可调）、aggregate 上限 900s；120s 为普通 SLO → 单次审查 10+ 分钟的直接来源 | skills/wh-review/scripts/review-provider-client.mjs（600_000ms） |
| F-006 | 零落盘机制：wh-review-cli run 只向 stdout 返回 available/unavailable JSON；落盘由调用方写入 task_dir quality/reviews/{attempts,results,reports}与 quality/evidence/review-materials/；失败时仅写 attempt.json 或不写；task_dir 在仓外（/Users/Hugh/Hugh/Knowledge/Projects/<project>/tasks/<id>），repo 内 grep 无痕；reuse 走旧记录不新增；写入前要求认证当前 snapshot_tree+material_revision 匹配，否则转 unavailable 或抛错（WORKTREE_CHANGED_AFTER_REVIEW） | skills/wh-review/scripts/wh-review-cli.mjs；review-result.mjs；review-runner.mjs |
| F-007 | 现有复用/重审纪律：findReusableReviewResult（语义投影 contract/semantic hash 不变且仅材料-only 变更 → 复用旧记录）；reviewCycleDecision（真实修复/主体变化才允许一次聚焦复审，actionable major/blocking 判定）；E2E 同 material_id+policy 复用；普通路径无自动重试（runReviewRecovery 单次） | skills/wh-review/scripts/review-runner.mjs、simple-review-runner.mjs |
| F-008 | 不可破坏的既有红线：minimum_heterologous≥1（异源下限）；host_provider 同源排除（SAME_SOURCE）；unavailable/空 findings 不伪装通过；snapshot/material/attempt 严格绑定（wh-review-cli.mjs L677-750）；reports 不可变；vNext 禁止 successor/selector/双写/新 dispatcher/恢复桥 | skills/wh-review/contracts/provider-protocol.md；runtime/stage/stage-handlers.mjs；AGENTS.md vNext 边界 |
| F-009 | 四份根因文档修复共识：①审查前 preflight（身份/配置/hash/结果秒级快速失败，blocked_before_dispatch）；②固定 lifecycle 终态（含 preflight_failed/running/completed/partial/unavailable/cancelled/stalled）+心跳+责任归属；③transport/semantic/quorum/coverage/disposition/stage_close 状态分离；④stage runner 唯一收尾链（finally 写 completed/incomplete/unavailable）；⑤fingerprint 单次决策重试（材料内容指纹变才允许重审）；⑥task-local 单一审查记录索引；⑦禁放宽校验、禁失败改空 findings、禁无限拉长 timeout、禁新增 dispatcher；⑧只跑受影响聚焦测试，禁全量回归 | 四份根因文档（2026-09-05）；docs/standard-workflow.md L310 |
| F-010 | 废除 profiles+priority 的最小改动面（子代理核实）：删除 third-review-host-config.mjs 的 profileDeclarations/validateRouteProfiles/validateProfileDeclaration/validateWhReviewProfileDeclarations/routeWithProfilePriorities/rankRouteProfiles（L114-496 段）；route 排序语义=initial/closure 列表顺序（现配置 priority 与列表顺序完全同序，删除后行为不变）；保留 highestPriorityProfilesByAdapter（实为 adapter 去重，legacy tiers 兜底用）与 brokerConfigId；whReviewPolicy 允许键去 "profiles"；frozenTaskBoundPolicy 的 profile 定义改从 selection.effectiveProfiles（3rd-review config）取；attempt/result schema 的 requested_profile_specs 去 priority；review-record-route buildPolicy 去 priority:0；review-result 报告去 priority 渲染 | skills/wh-review/scripts/third-review-host-config.mjs；wh-review-cli.mjs；runtime/review/schemas/attempt.schema.json；review-record-route.mjs；review-result.mjs |
| F-011 | 3rd-review broker 零消费 wh 侧 profile/priority（lib 全量 grep 零命中）；只收 provider_allowlist（有序）+host_provider+protocol+materials+prompt；v4 config schema 不拒绝未知字段；providers 字段已全覆盖 wh-review 需要（enabled/command/model/effort/thinking/auth/source_id/allow_host_state/env）→ 废除后 3rd-review 仓库零改动；codex/terra 仅 3rd-review 有（废除后加 route 即用）；cursor/grok enabled=false（被引用时 dispatch 抛错，行为不变） | 3rd-review repo 源码；research R-sub-1 |
| F-012 | 迁移映射：18 profiles 与 19 providers 按键一一对应（差值仅 codex/terra）；路由引用并集仅 5 个 provider（kimi/coding、antigravity/flash、codex/luna、grok/grok、pi/v4flash），其余 13 个 profile 自然删除；迁移后 wh_review 保留 {version:2, stages, mini_task}；本机 ~/.config/workflowhub/config.json 需同步迁移，否则 doctor 报 "wh_review.profiles is not supported" | research R-sub-1；本机两份配置 |
| F-013 | 测试影响矩阵（子代理核实）：会红=review-layering.test.mjs:108/:156、mini-task-delivery.test.mjs:636/:669、workflow-evolution-final-aggregate.test.mjs:410/:511、三处 fixtureReviewPolicy（final-cutover-guards:47、mini-task-delivery:617、helpers/formal-review.mjs:39，含 policy_snapshot_hash 连锁）；保护性测试（不可破坏）=identity/SAME_SOURCE、minimum_heterologous、材料快照绑定、unavailable 不伪装通过、reuse/空 findings≠通过、verifyFinal 工作树变化；preflight 落盘范式已存在（recordUndispatchedUnavailable/recordMissingRouteUnavailable，review-runner.mjs L357/386）；doctor 行为清单恰七项（preflight 不得暴露为 doctor 子动作，doctor-interface.test.mjs） | tests/ 20+ 文件；research R-sub-2 |
| F-014 | 风险清单：①legacy tiers 兜底勿顺手删；②spec 形状变化→policy_snapshot_hash/E2E JSON 连锁变，旧任务已存结果判不可复用（需一次性失效决策）；③frozenTaskBoundPolicy 与 E2E 复用路径需整体回归；④未迁移宿主 config 报 profiles not supported；⑤broker config 漂移不再 dispatch 前被 host 捕获（有意单源化） | research R-sub-1 |
| F-015 | close-readiness 任务核实（子代理）：①审查次数设计已确认= D-504（同材料同冻结 revision 一次初始 review 含单次重试；材料实际变化后最多一次 focused；无变化禁重审；耗尽路由=focused 后残留→实现级再修+窄域核销→仍不收敛→问用户/accepted_risk）+ T-029/T-033 + spec FR-LOOP-004/AC-LOOP-004/SCN-016 + plan P3（预算计数器+窄域核销+usage/代理指标，新测试 freeze-classification-budget-usage-protocol.test.mjs）+ FR-LOOP-005（provider usage 落盘 attempt 事实）；②进度（本任务调研时点）：未合并 main（分支领先 8 提交、37 文件全部 specs/ 零代码改动），decision-log 曾声明"make-decision accepted and closed；STOP before build-spec"，worktree 实况=build-spec 第二轮已重开进行中（spec.md 191KB 草稿 30FR/30AC、v61-v63 审查、canonical-reconciliation 多条 unresolved），spec 未冻结；spec-analyze 复核时点（2026-09-06 晚）现况已推进为"make-decision 已关闭、停在 build-spec 前"——无论其当前进度如何，D-007 边界不受影响；③文件级零重叠（它动 runtime/stage/*、skills/spec-*、workflows/*/SKILL.md、tools/cli/stage-runtime.mjs；本任务动 skills/wh-review/*、runtime/review/*）；④语义邻接：FR-LOOP-005 消费 attempt usage 事实（现写点 review-record-route.mjs L110 无人读，载体=stage-content-evidence.mjs）；预算计数依赖 attempt 落盘可靠（与"强制落盘"同域前置协同）；OPEN-004 只动用户侧 ~/.config/3rd-review/config.json（与仓库 loader 互补） | close-readiness worktree specs/ 四材料+evidence；git 只读命令 |
| F-016 | 两条兼容约束（与 close-readiness 并行）：①本任务改 attempt.schema.json/review-record-route.mjs 时保留 usage 字段与写入路径（close-readiness P3 将消费，破坏即断其前置）；②本任务改仓库配置 loader 与其 OPEN-004 用户侧 config 修复互补；边界登记：重审/预算语义引用 AC-LOOP-004 归 close-readiness，遇重复审查症状只记录事实 | T-004；research R-sub-3 |
| F-017 | direction-advice-1（方向审查，独立子代理）：方向总体成立、与宪法兼容，但 4 个决策缺口：①**SCHEMA 宽读严写**（最关键）：attempt.schema.json requested_profile_specs 现 required=priority 且 review_policy items additionalProperties=false；废除后旧记录经 validateSchema（reuse/doctor/verifyFinal/publishStageReviewFact 全走）会全灭——须 priority 可选+允许旧字段；terminal_status 枚举（现 semantic/unavailable）需扩 blocked/reused；error 需容纳 field/expected/actual/next_action；result.schema 同步。②**preflight 边界**：只放"静态可判定必败"项（3rd-review config 存在/形状、route 引用 provider 已定义且 enabled、host_provider 格式与 SAME_SOURCE 预判、attachment allowlist、材料非空）；provider 进程/超时/输出类保持运行时 unavailable；红线=probeThirdReviewBroker 的 unknown 严禁当 blocked（3rd-review config v4 无 engine_version 字段，永远 unknown）；预检须位于 buildBundle/runGroup 之前。③**裸跑 sink 未定义**（最大缺口）：runSimpleReview 无 TaskHandle/kernel 无法走 review-record-route（要求认证 snapshot/material_revision）——需在"显式 task 认证"与"独立 sink（如 ~/.workflowhub/review-sink/）"间决策，按 AGENTS.md 登记 consumer/owner/删除条件；拦截路径现有范式（recordUndispatchedUnavailable）只写 attempt+report 无 result——需定义拦截时 result 写什么（建议 resultRef=null、诊断入 report）。④**迁移附带影响**：policy 形状变→policy_snapshot_hash 变→按 ADR 0011 旧任务 review 记录一次性失效需用户知情；升序 priority 强校验随之消失→"列表顺序=优先级"须写成契约；E2E 代码要求单 profile 路由（wh-review-cli L563）而本机 verify-code.initial=5——现状矛盾需澄清 E2E 是否本就不可用 | direction-advice-1（28352893） |
| F-018 | direction-advice-1 其余确认：同源政策不受影响（sameSourceProfile 按 provider id、broker source_id/config_id 认证链不依赖 profiles）；legacy tiers 兜底不受影响；repo 内 fixtures/config 无 profiles 生成器（仅测试 fixtureReviewPolicy 会红，F-013）；stage-runtime 已有 --action=preflight 命名需区分；report 渲染 L298 priority 需去除；routeWarnings 校验依赖 profiles 需一并改造 | direction-advice-1（28352893） |
| F-019 | direction-advice-2（独立子代理）：①preflight=复用既有检查（loadConfig→resolveRoute→selectProviders 已 pre-dispatch 快失败；recordUndispatchedUnavailable(kind=material-preflight/route-resolution)/recordMissingRouteUnavailable 即既有预检落盘范式，move-map 注明保 T14 勿动），仅新增简单路径材料 required-key 存在性检查（复用 reviewRuleFor(rule.required)，不复制 receipt/AC trace/锚点深校验）；错误码必须复用 allowlist 内码（MATERIAL_INCOMPLETE/MATERIAL_FORBIDDEN/ROUTE_UNAVAILABLE）+可选 preflight:{field,expected,actual,next_action}，禁发明新码（否则 stage-handlers groupTerminalWithoutProvider 白名单+red 测试要改）；②入口=run 内部前置纯函数（simple/E2E runner 顶部、任何 buildBundle/锁/dispatch 前），零新命令零标志；wh-review-cli.test.mjs:481 禁 recordMissingRouteUnavailable 回 cli 模块（落盘逻辑勿放 cli）；③落盘权威路径=host 调 stage-runtime review-record→recordSimpleReviewResult（强制 kernel 认证），E2E recordTaskBoundE2eReview*；最小侵入=runReviewRecovery 边界接记录适配器；复用统一为不写新 attempt 只产引用（legacy publishReusedReviewResult 兜底不动）；④裸跑 sink 矛盾坐实：createCanonicalReviewWriter 强制 TaskHandle、SKILL.md 明令 run 不收 task_path（改契约会连锁 per-invocation-doc/host-independence 测试）→host 边界落盘为唯一权威，裸跑 sink=本地诊断导出（非权威、禁枚举 canonical，需在 3rd-review attachment_roots.sources 登记或独立路径）；⑤四状态不可对旧记录反向推断（空 provider_attempts 无法区分预检拦截与组级传输失败）→新记录写可选 dispatch_state，旧记录一律 unavailable+legacy_unclassified；⑥遗漏：E2E 锁 waitMs=900000 预检须在锁外；重复拦截 attempt 无上限建议同 material_id+code 幂等去重；publishStageReviewFact 只收 available/unavailable（blocked 先落 unavailable attempt 再发 fact）；任务记录在 task store 非 worktree；新 sink/新字段/新记录类型按 AGENTS.md 登记 consumer/owner/删除条件 | direction-advice-2（e3d96f0a） |

## Talk 记录（T 表）

| talk_id | 问题轴 | 用户选择/答复 | 理由与后续影响 | 队列变化 |
| --- | --- | --- | --- | --- |
| T-001 | Q1 配置事实源：profiles+priority 去留 | **A：彻底废除 profiles+priority，单一事实源**（provider 定义只读 3rd-review config；路由顺序=workflowhub config 中 stages 列表顺序） | 双源与一致性阻塞机制根除；需迁移现有 config 与 wh-review 加载/校验代码（research R-sub-1 核实改动面） | 无（首轮首批发问即答） |
| T-002 | Q2 失败策略：不一致/身份问题如何暴露 | **A：审查前 preflight 秒级快速失败**（blocked_before_dispatch：不进 broker、不烧 token，附 field/expected/actual/next_action） | 10 分钟失败 → 1 秒失败；与 F-009 共识①一致 | 无 |
| T-003 | Q3 追溯保证：结果落盘程度 | **A：每次调用都留完整记录**（成功/失败/预检拦截都写 attempt+result+report+失败原因与恢复指引；CLI 裸跑也强制写盘） | 根治"无法追溯"；需处理无任务上下文裸跑场景（research R-sub-1 核实落盘改造点） | 无 |
| T-004 | Q4 重审纪律（单次保证）：什么才算"材料变了" | **A：并行继续，完全排除重审逻辑。** 用户核实 close-readiness 任务已设计审查次数（D-504：同材料同冻结 revision 一次初始+材料实际变化后最多一次 focused）；重审/预算/只审一次语义（D-504/T-029/T-033/FR-LOOP-004/AC-LOOP-004）全部归 close-readiness 任务（等其合并后生效），本任务绝不实现 budget/重审抑制逻辑；遇到"重复审查"症状只记录事实不自行修复 | 范围边界（D-001/D-002；F-015） | Q4 第一次发问用户以自定义答复指正范围（close-readiness 已设计），随后按用户要求重新提问 Q4 并确认 A |
| T-005 | Q5 范围边界：3rd-review 仓库是否可改 | **A：只改 workflowhub，3rd-review 不动**（research 已证实 broker 零消费 profile/priority，废除后 3rd-review 仓库零改动） | 边界干净、单仓回归（D-001） | 无 |
| T-006 | Q6 数据状态：落盘状态语言 | **A：四类状态分层**——未派发（blocked_before_dispatch，带 field/expected/actual/next_action）+ 已派发（available/unavailable+子码）+ 复用标记（reused，引用旧记录 id）+ 重审原因（why） | schema 扩展、旧记录只读兼容（D-001） | 无 |
| T-007 | Q7 完整用户流程（用户旅程确认） | **A：确认无遗漏**。正常路径：阶段收尾→主会话发起 wh-review→[新增]预检秒级检查→打包进 3rd-review broker→provider 隔离审查→返回 findings→聚合+异源校验→落盘→调用方处置；失败路径：预检拦截（1 秒，附原因与修复动作）/ broker 或 provider 失败（unavailable+子码+恢复指引）/ 复用（同材料指纹→引用旧记录不新派发） | 流程基线（D-001） | 无 |
| T-008 | Q8 成功/失败边界 | **A：五条成功标准+红线清单成文**（见"成功/失败边界"节） | 验收口径（D-002） | 无 |
| T-009 | Q9 非目标与延期项 | **A：按清单成文**（见"非目标与延期项"节） | 范围边界（D-001/D-002） | 无 |

## Grill 记录（G 表）

| grill_id | 前沿问题 | 用户选择 | 后果与风险 | ADR/退出检查 |
| --- | --- | --- | --- | --- |
| G-001 | 存量任务已存审查记录一次性失效（policy_snapshot_hash 变化，ADR 0011） | **A：接受一次性失效**（历史保留可读，不可复用，下轮审查重新派发一次） | 标准路径；不做兼容层（避免"永久兼容桥"） | ADR 0011（fingerprint/新调用）；D-005 |
| G-002 | 裸跑（无任务上下文）结果写哪里 | **A：权威落盘（task_dir）+ 裸跑本地诊断 sink（~/.workflowhub/review-sink/，非权威、登记 consumer/owner/删除条件）** | 不构成双写；裸跑记录不可被当成正式审查结果 | 无 ADR；登记义务=AGENTS.md 新控制面登记；D-003 |
| G-003 | E2E 单 provider 约束 vs 本机 verify-code.initial=5 矛盾 | **A：E2E 改为从路由取第一个 provider**（不再要求 initial.length===1，行为不变） | E2E 回归范围明确；矛盾消除（D-006） | 无 ADR；verify-code 域边界确认；D-006 |
| G-004 | 同材料同原因重复拦截的 attempt 增长 | **A：同指纹同原因幂等去重**（引用既有拦截记录，不新建） | 防刷记录；追溯更清晰 | 无 ADR；attempt 不可变红线；D-003/D-008 |

## 决策链（D 表）

| decision_id | 决策 | 选择与理由 | derived_from |
| --- | --- | --- | --- |
| D-001 | 配置事实源 | 废除 wh_review.profiles/priority；provider 定义单一事实源=3rd-review config；**"列表顺序=优先级"写入契约**（路由 initial/closure 顺序即排序，乱序不再报错但顺序有定义）；只改 workflowhub 侧，3rd-review 零改动（source：R-001/R-002；T-001/T-005；F-001/F-010/F-011/F-012） | []（根决策） |
| D-002 | 失败策略 | preflight 秒级快速失败：复用既有 config/route/身份检查 + 新增简单路径材料 required-key 存在性检查；静态必败边界（config 形状/route 引用 provider 已定义且 enabled/host_provider 格式与 SAME_SOURCE 预判/attachment allowlist/材料非空）；错误码复用白名单内码（MATERIAL_INCOMPLETE/MATERIAL_FORBIDDEN/ROUTE_UNAVAILABLE）+ preflight:{field,expected,actual,next_action}；probe unknown 严禁当 blocked；入口=run 内部前置纯函数（buildBundle/锁/dispatch 之前），零新命令零标志；blocked 记录=先落 unavailable attempt 再发 fact（source：R-002/R-003；T-002；F-017/F-019） | [D-001] |
| D-003 | 强制落盘与状态 | 四类状态分层（blocked_before_dispatch / available・unavailable+子码 / reused 引用旧记录 / 重审原因 why）；权威路径=host 落盘 task_dir（attempt+result+report）；拦截=attempt+report（resultRef=null、诊断入 report，不写 result）；复用=只产引用不写新 attempt、**引用不修改旧 attempt（attempt 不可变）**；裸跑=本地诊断 sink ~/.workflowhub/review-sink/（非权威、登记 consumer/owner/删除条件）；同指纹同原因幂等去重（source：R-004；T-003/T-006；G-002/G-004；F-019） | [D-001] |
| D-004 | schema 兼容 | 宽读严写：requested_profile_specs 的 priority 改 optional、允许旧字段（additionalProperties 兼容旧记录）；terminal_status 枚举扩 blocked/reused；error 结构容纳 preflight 诊断；新记录写可选 dispatch_state；旧记录一律 unavailable+legacy_unclassified（不反向推断四状态）；result.schema 同步；保留 usage 字段与写路径（source：R-001/R-004；F-016/F-017/F-019） | [D-001, D-003] |
| D-005 | 存量记录失效 | 接受一次性失效（ADR 0011）：policy 形状变化→policy_snapshot_hash 变化→旧任务已存 review 记录不可复用、下轮重新派发一次；历史只读保留；不做兼容层（避免"永久兼容桥"）（source：G-001；F-017） | [D-001] |
| D-006 | E2E 路径 | 修复 E2E 单 provider 约束矛盾：E2E 从路由 initial 取第一个 provider 使用（不再要求 initial.length===1）（source：G-003；F-017/f③） | [D-001] |
| D-007 | 并行边界 | 重审/预算/只审一次语义归 close-readiness（D-504/T-029/T-033/FR-LOOP-004/AC-LOOP-004），本任务绝不实现 budget/重审抑制；遇重复审查症状只记录事实；保留 attempt usage 字段与写入路径（FR-LOOP-005 消费）；仓库 loader 与其 OPEN-004 用户侧 config 修复互补（source：R-005；T-004；F-015/F-016） | []（用户范围指正） |
| D-008 | 红线 | minimum_heterologous≥1、SAME_SOURCE、unavailable/空 findings 不伪装通过、不新增公共命令、**doctor 行为清单恰七项且 preflight 不得暴露为 doctor 子动作**、vNext 禁令、legacy tiers 兜底不动、幂等去重不得修改旧 attempt（不可变）、禁全量回归（只跑受影响聚焦测试）（source：T-008；F-008/F-013） | [D-002, D-003] |

## 方案（Solution，方向级草案；build-spec 细化 FR/AC）

1. **配置层**（D-001）：third-review-host-config.mjs 删除 profileDeclarations/validateRouteProfiles/validateProfileDeclaration/validateWhReviewProfileDeclarations/routeWithProfilePriorities/rankRouteProfiles；routeWarnings 改为 broker-config 存在性/enabled 警告；"列表顺序=优先级"契约写入配置校验文档；whReviewPolicy 允许键去"profiles"；保留 highestPriorityProfilesByAdapter（adapter 去重，legacy tiers 兜底）与 brokerConfigId；frozenTaskBoundPolicy 的 profile 定义从 selection.effectiveProfiles（3rd-review config）取；report 渲染去 priority；迁移本机 ~/.config/workflowhub/config.json（去 18 profiles，保留 {version,stages,mini_task}，5 个被引用 provider 行为不变）；与 close-readiness OPEN-004（用户侧 3rd-review config 修复）互补协作。
2. **preflight**（D-002）：run 内部前置纯函数（simple/E2E runner 顶部）；复用既有 loadConfig→resolveRoute→selectProviders 快失败与 recordUndispatchedUnavailable/recordMissingRouteUnavailable 范式（move-map T14 保）；新增材料 required-key 存在性检查（reviewRuleFor required 列表，不复制深校验）；信封 blocked_before_dispatch（白名单内码+preflight:{field,expected,actual,next_action}）。
3. **落盘**（D-003）：runReviewRecovery 边界记录适配器（最小侵入，不动 runner 内部；落盘逻辑不放入 cli 模块）；拦截即写 attempt+report（resultRef=null、诊断入 report）；复用只产引用、**引用不修改旧 attempt（attempt 不可变）**；幂等去重（同 material 指纹+code，命中即引用既有拦截记录）；裸跑诊断 sink ~/.workflowhub/review-sink/（非权威，登记 consumer/owner/删除条件）。
4. **schema**（D-004）：attempt/result 宽读严写扩展（priority optional、terminal_status+blocked/reused、error+preflight 诊断、dispatch_state optional；保留 usage 字段与写路径）。
5. **E2E**（D-006）：取路由第一个 provider；frozenTaskBoundPolicy 从 effectiveProfiles 取定义；复用路径整体回归。
6. **测试**（F-013 矩阵）：更新会红夹具（三处 fixtureReviewPolicy、review-layering:108/:156、mini-task-delivery:636/:669、workflow-evolution-final-aggregate:410/:511 按新 policy 形状）；新增负向夹具（含 profiles/priority 配置拒绝、preflight 拦截落盘、强制落盘 attempt 必存在、复用不新建、拦截去重）；保护性测试保持绿；禁全量回归。
7. **迁移与 dogfood**：本机 config 迁移前**先备份**（如 cp ~/.config/workflowhub/config.json config.json.bak-<date>），doctor 报 "wh_review.profiles is not supported" 时按备份恢复并按新格式重写；本任务 build-spec 起真实使用新机制（观察"1 秒失败/结果可追溯/拦截幂等"）。

### D-002 high_risk_fact

`{"classification":"high_risk_user_visible","basis":"three_inputs"}`

### D-003 high_risk_fact

`{"classification":"high_risk_user_visible","basis":"three_inputs"}`

### D-005 high_risk_fact

`{"classification":"high_risk_user_visible","basis":"three_inputs"}`

## UI applicability

```json
{"result":"non_ui","sources":{"raw_requirement":"R-001~R-007 均为 CLI 审查流程/配置文件/落盘追溯需求，无页面/前端诉求","project_inventory":"workflowhub 为 CLI 编排工具，无前端面","planned_or_changed_frontend_fact":"本任务不计划、不涉及任何前端改动"}}
```

## 目标（已确认）

- 目标 ①：废除 `wh_review.profiles` 与 priority，provider 定义单一事实源 = 3rd-review config；路由顺序=stages 列表顺序（T-001）。
- 目标 ②：审查前 preflight 秒级快速失败（blocked_before_dispatch：不进 broker、不烧 token，附 field/expected/actual/next_action）（T-002）。
- 目标 ③：每次审查调用（成功/失败/预检拦截/复用）在 task_dir 留下完整可追溯记录；CLI 裸跑也强制落盘（T-003）。
- 目标 ④：四类状态分层落盘（拦截/结果/复用标记/重审原因）；保留 attempt usage 字段与写入路径（T-006/F-016）。
- 目标 ⑤：本任务 dogfood：后续阶段真实使用改造后机制（T-007/R-007）。

## 维度梳理（已确认）

### 完整用户流程（T-007 确认）

- 正常路径：阶段收尾 → 主会话决定审查 → wh-review 发起 → **预检（秒级）** → 打包材料进 3rd-review broker → provider 隔离环境审查 → 返回 findings → 聚合+异源校验（minimum_heterologous≥1）→ **落盘 attempt/result/report** → 调用方处理 findings。
- 失败路径：**预检拦截**（1 秒返回，附原因与修复动作，不进 broker）；broker/provider 失败（unavailable+子码+恢复指引）；**复用**（同材料内容指纹→引用旧记录，不新派发）。
- 现状差异点：预检缺失（身份/配置问题晚暴露，F-004）；零落盘（F-006）；双源配置一致性阻塞（F-001）；重审语义（归 close-readiness，T-004）。

### 表面范围（CLI 场景"页面"，T-005 确认，只改 workflowhub 侧）

| 表面 | 范围内 | 范围外（归谁） |
| --- | --- | --- |
| 配置文件 | 本机 ~/.config/workflowhub/config.json 迁移（去 profiles/priority）；仓库侧 wh_review 配置加载/校验（third-review-host-config.mjs 等） | 3rd-review 引擎本体与用户侧 provider 定义修复（close-readiness OPEN-004；本任务只保证 loader 不要求 profiles） |
| CLI 命令 | wh-review run/doctor/verify-final 的行为与输出（preflight 入口、强制落盘、doctor 检查项更新） | 公共命令集合不变（七职责，doctor-interface 测试）；不新增命令 |
| 落盘结构 | task_dir quality/reviews/（attempts/results/reports）与裸跑 sink | runtime/stage/* 与 stage-reflection（close-readiness 域） |
| 输出信息 | doctor/preflight/报告输出格式（字段/期望/实际/动作、四类状态） | dsh-code-review 集成与 stage 语义（verify-code 域） |

### 数据状态（T-006 确认）

- 落盘记录四类状态：未派发（blocked_before_dispatch，带 field/expected/actual/next_action）；已派发（available/unavailable+子码）；复用（reused，引用旧记录 id）；每次重审记录 why（原因）。
- attempt/result schema 扩展，旧记录只读兼容；**保留 usage 字段与写入路径**（close-readiness FR-LOOP-005 消费，F-016）。
- provider 失败/空桩/超时 → attempt 层 unavailable 记录，不算 pass、不改写空 findings（红线，F-008）。

## 成功/失败边界（T-008 确认）

- **成功标准**（可观察行为）：
  1. 配置单源：废除 profiles/priority 后，现有 config 迁移完成；doctor 不再因"配置不一致/priority"产生阻塞；路由顺序=列表顺序；5 个被路由引用的 provider（kimi/coding、antigravity/flash、codex/luna、grok/grok、pi/v4flash）行为不变；
  2. 预检：配置/材料/身份类问题在进入 broker 前 1 秒内返回 blocked_before_dispatch，附字段/期望/实际/动作；
  3. 落盘：每次审查调用（成功/失败/拦截/复用）在 task_dir 留下 attempt+result+report；CLI 裸跑也有落盘 sink；
  4. 兼容：attempt schema 保留 usage 字段与写入路径；与 close-readiness 预算机制（FR-LOOP-004/005）无冲突；
  5. dogfood：本任务后续阶段（build-spec 起）真实使用新机制，观察到"1 秒失败/结果可追溯"。
- **失败/红线清单**：不改异源下限（minimum_heterologous≥1）与 SAME_SOURCE 排除；空 findings 不判通过；unavailable 不伪装 pass；不新增公共命令/新 dispatcher；**doctor 行为清单恰七项、preflight 不得暴露为 doctor 子动作**；不碰 vNext 禁令（双写/历史分支/兼容桥）；不做重审抑制逻辑（归 close-readiness）；不动 legacy tiers 兜底；幂等去重不得修改旧 attempt（不可变）；禁全量回归（只跑受影响聚焦测试）。

## 非目标与延期项（T-009 确认）

- 非目标：①重审/预算/只审一次逻辑（归 close-readiness D-504/FR-LOOP-004；遇重复审查症状只记录事实）；②3rd-review 引擎本体与用户侧 provider 配置修正（其 OPEN-004 域）；③reviewer 语义质量与模型选择；④verify-code 的 dsh-code-review 集成语义；⑤legacy tiers 兜底机制。
- 延期项：⑥provider 健康探测/限流降级（preflight 只做配置/材料/身份类，健康类延后）；⑦超时按审查类别分级预算（先只做合理默认，不做 p50/p95 统计分级）；⑧全局 token/usage 度量面板消费侧（只保 usage 字段写入，消费侧归 close-readiness）；⑨审查耗时 benchmark 与 SLO 分级。

## 批准与发布记录（approve-decision / publish-decision）

- **用户确认**（2026-09-06）："批准，收口当前阶段，大白话汇报，不要急着进入build-spec"（自定义答复，未选项）。
- confirmation：quality/confirmations/e47d2e1016d46ae226c3081976cfb95610de159bb5dbd85255a8d250d685f755.json（human-confirmation.v3，decision=accepted，step_slug=approve-decision）。
- material_revision：revision-436209897abc787fa29305b1daff6c01cc2572a9acd501308b113effdf3a3cee（kernel 签发）；snapshot_tree：117e0c1d15ee964d8d31795ee44896978fb4417c。
- interaction aggregate：quality/evidence/interactions/cda46e5fb976e60d5f0cd30ddfa9b6c5015b374443e32b62cbce54cc642cf2a8.json（workflowhub-interaction-aggregate.v1；内容寻址=自身 sha256；经 validateInteractionAggregateContract 机器校验 ok=true；decision.hash=bad3d220342cfc4f97997f017c4ec3e13ced930ecbca0b37671370de6cf9bc05 为**批准时点快照绑定**（当时 decision-log 的 sha256），此后追加的阶段末记录使当前 tip 哈希不同，决策内容未变，按规范不重建 aggregate；original_requirement.hash=8324f2c3…=task store 原件）。
- 用户指示：**收口当前阶段，暂停在 make-decision 边界，不主动进入 build-spec**（等用户指令）。

## publish-decision（六项大白话摘要，2026-09-06）

1. **本阶段做了什么**：make-decision 全流程走完（talk 3 轮 9 问 + grill 4 项 → 方向/细节 3 次独立 advice → 用户批准 → confirmation + interaction aggregate 机器校验通过 → spec-analyze 收尾校验通过 → stage-reflection 落盘）。
2. **需求覆盖**：用户 7 条原始需求全部收敛——R-001/002（废除 profiles/priority、阻塞消除）、R-003（preflight 秒级失败）、R-004（强制落盘）、R-005（重审逻辑归 close-readiness）、R-006（基于四份根因文档）、R-007（标准流程执行）。
3. **上游对齐**：close-readiness 任务已设计"审查次数/预算"（D-504/FR-LOOP-004），本任务并行且零文件重叠，两条兼容约束（保留 usage 字段写路径；仓库 loader 与用户 config 互补）已登记。
4. **本阶段修复**：四维梳理成文（用户流程/表面范围/数据状态/成功失败边界/非目标延期）+ 8 项决策链 + 五块方案草案（配置单源/preflight/强制落盘/schema 宽读严写/E2E）+ 测试影响矩阵与迁移 dogfood 计划。
5. **剩余风险**：preflight 判据需在 build-spec 精确化防伪阻塞（unknown 不阻塞已红线化）；存量审查记录一次性失效（用户知情）；close-readiness 合并前"只审一次"暂不生效；advice 零落盘在 build-spec 起由强制落盘闭环。
6. **下一阶段边界**：停在此处（用户指示"不要急着进入 build-spec"）；待用户指令后进入 build-spec，消费本 decision-log 冻结方向。

## 最终状态与交付物清单

- 认证 worktree：/Users/Hugh/Hugh/Project/workflowhub-workflowhub-review-flow-repair-20260906（分支 task/workflowhub/workflowhub-review-flow-repair-20260906，baseline b16d5bcf）
- 四材料：decision-log.md（本文件）；spec.md/plan.md/tasks.md 尚未创建（build-spec 起）
- task store：/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-review-flow-repair-20260906/（task.json、quality/confirmations/、quality/evidence/{original-requirement.txt,interactions/}、quality/facts/、quality/stage-reflection/、quality/verify.json）
- 关键不可变事实：confirmation e47d2e10…；aggregate cda46e5f…（机器校验 ok）；material_revision revision-436209…；snapshot_tree 117e0c1d…；stage-reflection make-decision.json（degraded，judgments 4 条）

## 需求框架

- **framework：functional（外层）**，research 作为受影响节点的证据子树（四份根因文档的诊断结论）。
- 选择理由：原始需求为明确的修复落地型（"看看审查流程到底是什么问题，应该怎样的修复？"），非纯研究型；根因分析（F-004/F-009）作为 solution 的证据基础。

## 审查处置表（advice 事实处置）

| advice 来源 | 结论 | finding 处置 |
| --- | --- | --- |
| direction-advice-1（28352893，独立上下文） | 方向成立、无宪法冲突；4 个决策缺口 | 全部采纳：缺口①→D-004（schema 宽读严写）；缺口②→D-002（preflight 静态边界+unknown 不阻塞）；缺口③→D-003/G-002（裸跑 sink+拦截 result 语义）；缺口④→D-005/D-001/D-006（一次性失效/顺序契约/E2E 矛盾） |
| direction-advice-2（e3d96f0a，独立上下文） | 方向成立；preflight/落盘范式已双轨存在 | 采纳：错误码白名单内码→D-002/D-008；入口零新命令→D-002；host 权威落盘+裸跑诊断 sink→D-003/G-002；复用只产引用与旧记录不反向推断→D-003/D-004；拦截去重→G-004/D-003 |
| detail-advice（1b13c49f，独立上下文） | 内容扎实可作 build-spec 输入；5 处结构硬伤 | 全部修复：F-016/F-018 补回、high_risk_fact 单行化、UI 枚举 non_ui、derived_from D→D 链、R-005 状态闭合、补需求框架/审查处置/Exit checks/未决项、迁移回滚与 doctor 七项红线（本节与方案补丁） |

## Exit checks（make-decision 退出条件核对）

| 检查项 | 状态 |
| --- | --- |
| Talk 全部 resolved（R1-R3，9 问） | 通过（T-001~T-009）。注：决策日志按规范相位命名记为"R1-R3"，实际交互问答共 5 轮（Q1-Q3 / Q4-Q6+Q5-Q6 / Q4 重问 / Q7 / Q8-Q9，interaction aggregate round_count=5，remaining 全空） |
| 条件 talk round 4 触发评估 | 不触发（direction/detail advice 无方向级未决；detail 均为实施级修复） |
| research 完成或如实标注 | 通过，**如实标注**：研究证据=F 表各行的主源引用（代码路径/行号/本机配置/根因文档）+ 9 个子代理独立核实（R-sub-1/2/3、四文档精读、advice×3、spec-analyze）；未单独立 research-report 文件，均以 F 表引用与 evidence 文件为凭 |
| Grill 已跑（G1-G4 全部实名答复） | 通过（G 表） |
| decision-log 为当前版 | 通过（本文件，含全部修订） |
| direction/detail 两次独立 advice 事实与处置 | 通过（审查处置表：direction-advice×2 + detail-advice×1，共三次独立 advice）。**如实标注**：advice 原始记录未落 task store 的 quality/reviews/（本阶段 advice 由独立子代理在各自上下文产出，provenance 仅 decision-log 内嵌子代理短 id）——这正是本任务要修复的"审查结果零落盘"症状在 make-decision 阶段的复现；build-spec 起强制落盘后该链路闭环 |
| 用户显式确认 | 通过（批准与发布记录；quality/confirmations/e47d2e10…） |
| interaction aggregate 绑定 | 通过（quality/evidence/interactions/cda46e5f…，机器校验 ok） |
| stage-end-spec-analyze | 通过（独立 spec-analyze 子代理校验：内容寻址/机器校验/五维覆盖/红线全过；2 处必改+5 建议已按清单修复） |
| publish-decision + 六项大白话摘要 | 通过（见"publish-decision（六项大白话摘要）"节） |
| stage-reflection | 通过（quality/stage-reflection/make-decision.json，status=degraded 如实标注，judgments 4 条） |

## 未决项

- 无方向级未决。实施级注记（随 build-spec/build-code 处理，不阻塞批准）：E2E 行为细粒度（从 initial 取第一个的具体取法）；policy_snapshot_hash 一次性失效的具体触发点（build-code 验证）；裸跑 sink 的保留/清理策略细节（build-plan 细化，登记 owner/consumer/删除条件）。

## 收敛检查（target/scope/solution/acceptance）

| 行 | 收敛点 | 结论 | 事实引用 |
| --- | --- | --- | --- |
| target | 任务目标 | 目标 ①-⑤（配置单源/preflight/强制落盘/状态分层/dogfood） | T-001~T-009 |
| scope | 范围 | 只改 workflowhub 侧四类表面；排除重审逻辑（归 close-readiness）；排除 3rd-review 引擎 | T-004/T-005/F-015/F-016 |
| solution | 方案与取舍 | D-001~D-008 决策链 + 五块方案（配置层/preflight/落盘/schema/E2E）+ 测试矩阵与迁移 dogfood；**取舍与被拒项**：keep-profiles 方案（T-001 B/C 被拒）、preflight 只警告（T-002 B 被拒）、裸跑写 task_dir（G-002 C 被拒）、E2E 不改+改用户配置（G-003 B/C 被拒）、兼容层保旧 hash（G-001 B 被拒）、每次拦截新写（G-004 B 被拒）；**未决项**见"未决项"节 | F-010~F-019；G-001~G-004 |
| acceptance | 验收口径 | 五条成功标准（场景=本任务后续阶段 build-spec 起的真实审查调用；数据源=task_dir quality/reviews 记录、doctor 输出、config 迁移前后对比；通过条件=成功标准 1-5 逐条可观察；失败条件=红线清单任一被触） | T-008 |

## 合并 main 后的基线更新（2026-09-07）

- 已将 `main=692c27ea325f6bb7be31613c6e44037958eab850` 合并到本任务分支，产生 merge commit `356c3305`；无冲突，`git diff --check` 通过。
- `main` 已包含 close-readiness 的实际实现及归档材料（合并提交 `82ba3d86`、归档提交 `692c27ea`）。因此 F-015/F-016 和 publish-decision 中“未合并 main”“并行且零文件重叠”“合并前只审一次暂不生效”均是 2026-09-06 make-decision 时点事实，不再代表当前 build-spec 基线。
- D-001~D-008、D-007 的范围边界不变：本任务仍不实现重审/预算抑制；但 build-spec 必须把当前 main 已存在的 review budget、provider usage、四材料 stage-input packet、finding disposition 消费者纳入兼容检查，不能重复实现 close-readiness 逻辑。
- build-spec 开始前重读当前消费者：`runtime/evidence/stage-content-evidence.mjs`、`runtime/review/stage-review-disposition.mjs`、`runtime/task/material-workspace.mjs`、`runtime/stage/*` 及对应聚焦测试。改 attempt/result schema 或写入路径时，必须保留 main 已消费的 `usage` 事实和认证绑定。
- task store 中的 approval、`material_revision`、`snapshot_tree` 继续作为历史事实保留；合并后的后续阶段必须重新生成当前 worktree 的 stage 输入和材料绑定，不覆盖旧 receipt。

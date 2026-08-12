# Decision Log — M15 流程退化诊断与质量事实看板

## 原始需求

| source_id | 原始需求/约束 | 来源引用/原文摘录 | 关联 D/处理状态 |
| --- | --- | --- | --- |
| R-001 | 开始 M15，严格从 make-decision 开始，不让 build-spec 补需求 | 当前用户消息：`开始做M15了。请按标准 WorkflowHub 从 make-decision 开始，不要跳阶段，也不要依赖 build-spec 补需求。` | current；本日志已在 make-decision 收敛方向 |
| R-002 | Talk 用大白话说选项、后果、风险 | 当前用户消息：`Talk 请用大白话说明选项、后果和风险` | current |
| R-003 | 决策记录保留原始需求、事实、选择、理由、延期交接 | 当前用户消息原文 | current |
| R-004 | make-decision 先钉死完整用户流程、页面范围、数据状态、成功/失败边界、非目标、延期 | 当前用户消息原文 | current；已在本日志完整收敛，不交给 build-spec 补方向 |
| R-005 | M15 消费 M14b 事实，诊断流程退化和成本归因 | `agenthub-extraction-program/artifacts/roadmap.md:426-434` | current；evidence-only source |
| R-006 | 只做诊断、排行、聚合；不自动给改法，不用 LLM 猜事实 | `roadmap.md:427,436-441`；旧 `decision-log.md:105-106,129,134-136` | current / non-goal boundary |
| R-007 | 看板是独立静态 HTML，含任务总览、跳步 diff、token 排行、常见问题聚类 | 旧 `decision-log.md:99-101` | current；已定为单个永久 HTML 四区 |
| R-008 | M0 只作复用/反模式参考，不是 gate | `artifacts/M0/M0-design.md:8-21,64-66,124-130` | evidence-only |
| R-009 | M15 原依赖是 M14b 事实层与 M10 基线样本，failure_domain 以 M14a 词表为权威 | `roadmap.md:428-430` | current with revision；必要 M14b 修复并入本 task，M10/旧样本只作兼容版本对照，不能替代 fresh E2E |
| R-010 | `failure_domain` 只能由结构化事实派生，缺 review/verify/worktree/taskPath 等分别成域 | `roadmap.md:427,430-431,437`；旧 D30 | current；D-002/D-005/D-013 |
| R-011 | 成本按 transcript/session/stage/skill/subagent 展示 token、duration、retry、tool_use，并回看来源 | `roadmap.md:433,438` | current；raw transcript path 按 D-010 收窄为受控 source/session ref |
| R-012 | 自动化率、人工介入、review_invoked、verify_fresh 可按 task/stage 看趋势；阈值人拍、不阻断 | `roadmap.md:434,441`；旧 D14a | current；D-011 |
| R-013 | 旧 D26 要求 outcome/process/efficiency、版本对比、待迭代清单和四视图 | 旧 `decision-log.md:99-101` | current with split；三维/版本对比/四区保留，“待迭代候选清单”延期 M16，M15 只列事实 |
| R-014 | 字段归属表必须说明字段、owner/生成层、消费者视图并随 schema 同步 | 旧 `decision-log.md:101` 的 D28；`roadmap.md:442` | current；build-spec 只能机械化，不得省略 |
| R-015 | 原 M14b 覆盖 transcript/artifact/flow health/skills inventory 与 deterministic indexer | `roadmap.md:407-423` | split：transcript/artifact/flow-health 的 M15 所需职责映射入 `facts.jsonl`/supporting evidence；完整 skills inventory 仍是未兑现的 M14b 输出，本 M15 不消费也不改 owner |
| R-016 | 指标原聚合主键含 `source+skill_id+version`，task facts 需有全局扁平 JSONL 派生输出，contract/implementation 独立版本化，且不得新增 per-skill 机器入口 | 旧 D10/D11/D23/D34；`roadmap.md:397-404` | current；公共 collector/adapter 实现，projector 生成 derived global JSONL，不给每个 skill 新增 index.mjs/入口 |

## 目标

- 目标：让维护者从 M14b 的结构化事实看见流程哪里没按设计发生、成本集中在哪里，并能回到原始 transcript/artifact 核实。

## 成功/失败边界

- 成功边界：诊断和排行只来自明确来源；缺失显示 missing/unknown；样本不足显示 insufficient_samples；结果可回指来源；只允许修通交付链必需的 producer/schema/adapter，dashboard/projection 不进入核心推进控制面。
- 失败边界：把缺失当 0、把允许跳步当退化、重复计算 token/tool_use、把 LLM 判断写成事实、输出自动修复建议、看板存在但未消费真实 M14b 数据。

## 范围

- 当前范围：failure_domain 派生、流程退化报告、静态 HTML 事实看板、成本归因、自动化率/人工介入趋势、合法/异常跳步辨别边界。
- 用户新增扩围：同一 M15 task 先修复支撑上述视图所必需的 M14b 生产采集链，再实现消费端；不得把未修的前置留给 build-spec 猜。
- 完整用户流程：
  1. 每次 WorkflowHub invocation 开始前，launcher 显式登记当前 Codex transcript realpath、session_id、CLI/schema version 和 task/run 绑定；realpath 只交给受控 adapter，不进入公开投影。
  2. TaskHandle 把可核实执行事实追加到 `facts.jsonl`，把抽取所需的 immutable supporting evidence 写入 `quality/evidence/monitoring/`；无来源保持 unknown/missing。
  3. launcher-side projector 为当前 task 原子更新 project projection，再在全局锁内全量重建 root data.js；投影失败不回滚 canonical facts。
  4. 维护者打开固定 HTML，选择数据范围（全局、project、task、stage、版本/时间窗；默认显示所有可用 project 和最近生成快照）。
  5. 页面校验 snapshot schema/coverage/staleness；安全/身份/顶层契约错误明确失败，普通缺失或坏行显示 partial。
  6. 维护者先看任务总览及时序，再看 stage 证据断链、step 缺失/乱序/合法 skip、required skill 漏执行，以及缺 artifact、taskPath/worktree/review/verify/handoff/transcript 等退化事实。
  7. 维护者进入成本归因，按 transcript/session/stage/skill/subagent 查看 token、duration、retry、tool_use 排行。
  8. 每个结论回指受控 source/session/artifact/fact ref；无来源则显示 missing/unknown，不暴露 raw transcript path。
  9. 维护者查看自动化率、人工介入、review_invoked、verify_fresh 趋势；样本不足显示 insufficient_samples。
  10. M15 到此结束：只把事实交给人工 decision 或 M16，不提供修改方案、不直接改流程。

### M14b producer 修复边界

- 既有、只读消费：`workflows/<stage>/steps.json` 与 `skill-deps.yaml` 继续定义 expected topology；M15 不改它们来迎合看板。
- 本次修复：修正当前 artifact projection/validator 的 `record_kind` 不一致；扩展 `facts.jsonl` 事实 schema/producer/index 能承载 M15 必需运行事实；接通 canonical task/material/quality 来源；新增 launcher-registered Codex adapter。
- 本次新增：`quality/evidence/monitoring/` supporting evidence writer、project per-task projector、root bundle projector 和静态 HTML consumer。
- 明确不做：新建第二套 canonical metrics index、扫描 native session 目录、修改 Claude adapter、多 CLI 统一协议、反向修改 stage/step/skill manifest。
- 旧 `transcript-index.jsonl`、`artifact-index.jsonl`、`flow-health-facts.jsonl` 中被 M15 消费的信息职责保留，并按 D-012 收敛为 `facts.jsonl` 的事实种类、supporting evidence 与派生 projection；不再让它们成为并列权威。完整 `skills-inventory.json` 仍是 M14b producer 的未兑现独立输出，本 M15 不消费、不重做、不把 owner 移给 M17a；M17a 只能在该既定前置补齐后消费并收敛。
- 聚合身份保留 `source+skill_id+version`；缺 skill/version 时按声明 grain 保持 unknown，不静默换主键。schema contract 与 collector/adapter implementation 分别版本化。
- 旧 D11 的 task+global JSONL 输出保留但重定权威：task 级是 canonical `facts.jsonl`；全局扁平 `workflowhub-monitor-facts.jsonl` 由 project projection 全量重建，是 data.js bundler 的 derived 输入，不是第二事实源。
- producer 是公共旁路 collector/adapter；禁止为了采集给每个 skill 新增 `index.mjs` 或等价机器入口。
- 失败边界：canonical fact/evidence 写失败使本次采集 failed/partial 并留下错误事实；project/root 投影失败只产生 projection warning/stale 页面；身份、realpath 越界或顶层 schema 不兼容 fail-loud。

### 事实类别与归并规则

- session：只认 launcher 登记且与 task/run 绑定的 `session_id`；同一 source/session 只归入一个 invocation，冲突 fail-loud。
- subagent：只使用 transcript 明示的 worker/subagent id、parent/source event 关系；无 parent id 则层级 unknown，不按时间猜父子。
- token/tool_use：token 按 message.id 去重；tool_use 扫全部事件并按 tool_use.id 去重；两者分别统计。
- retry：只认明确 retry_count、attempt_id 或同一执行身份的结构化 attempt 序列；相似文本或重复工具名不能推成 retry。
- token 来源冲突：当前 Codex transcript 是宿主 token 权威；canonical task facts 只保存其派生/引用，不与旧 worker metering 相加。若多个已登记来源声称同一 grain，分别展示 source 与 mismatch/conflict，禁止静默择值或求和。
- duration：只使用明确 duration 或同一 id 的 start/end 配对；禁止用文件 mtime 猜耗时。grain 必须标明 task/run/stage/step/skill/subagent。
- review：读取 canonical `quality/reviews` 事实，分别展示 invoked、独立来源、terminal outcome 和 unavailable；provider 失败不等于无问题。
- verify：读取 `quality/verify.json` 及其绑定来源，展示 invoked/result/freshness；无法对当前 git/material 绑定则 stale/unknown，不称 fresh。
- automation/human：只用明确 origin；分母不完整则 automation_rate unknown；人工只计明确 reply/approval/override/request/human-origin action。
- 每一类都必须展示 source ref、coverage 和状态；缺字段显示 missing/unknown，不能用 0 代替。

### failure_domain 与字段归属验收

- `failure_domain` 只从 M14a 受控 taxonomy 与 `facts.jsonl` 结构化字段派生；至少能分别构造并识别 missing review、missing/freshness-unknown verify、worktree mismatch、taskPath configured/used mismatch、artifact missing、handoff/transcript incomplete。
- 所有页面字段必须登记：fact 字段 → schema/事实种类 → producer/owner → 使用视图；归属表与 schema 同步变更，review diff 必须看得见。
- outcome/process/efficiency 是展示分类，不是质量评分；同一事实只按已登记 owner 产生，页面不另算第二套语义。
- 版本对比只比较 schema、来源、聚合主键和 grain 兼容且 coverage 可见的范围；不可比时显示 mismatch/insufficient_samples。M10/旧样本可用但不是完成证据。

### 页面范围

- 任务总览：任务、stage 时序、结果状态、样本充分性。
- 流程退化：stage evidence gap、missing/out-of-order/skipped step、missing required skill、required artifact、taskPath configured/used、worktree、review、verify、handoff、transcript completeness。
- 成本归因：transcript/session/stage/skill/subagent 五维排行与证据回链。
- 常见问题与趋势：按 failure_domain/friction_type/error_code 的确定性聚合；自动化率、人工介入和关键事实趋势。
- 每个事实保持 outcome/process/efficiency 分类；趋势区支持兼容 task/skill/version 的事实对照，但不生成质量分。
- 页面物理形态：一个永久静态 HTML，含上述四个可切换区块；不增加任务管理、设置、编辑、修复操作页面。

### 数据状态索引

- available/observed：结构化来源存在且可校验。
- false：来源明确证明“未发生”，不能和 unknown 混用。
- missing：应有字段或 artifact 不存在。
- unknown/null：证据不足，不能推成 false 或 0。
- partial：部分来源可用；可展示已知事实，同时列缺口。
- insufficient_samples：数据有效但样本不足，禁止伪装聚类/趋势结论。
- stale/not_fresh：有历史证据，但与当前 git_sha/mtime/current HEAD 不匹配。
- mismatch/conflict：期望与实际路径或多个来源冲突；不得静默合并。
- invalid_input：schema/jsonl/index 损坏或来源身份无法验证；生成动作明确失败并指出文件/原因。
- empty_valid：输入合法但没有匹配记录；显示空状态，不当成执行成功或零问题证明。

## 非目标

- 不做自动优化、候选池、改法文本、质量评分、blocking gate、LLM 事实推断、旧 AgentHub Next.js 前端迁移、M16 attempted edits/负例库、M17 多 CLI 适配。

## 决定

### D-001

- question/final_option: M15 的产品边界是什么？选择“只读事实诊断工具”。
- recommendation/plain_language: 推荐；只把已有事实讲清楚，不替人改系统。
- decision: M15 只读 M14b facts/index，生成诊断、排行、趋势和静态 HTML。
- source_type/reference/exact_excerpt: approved historical decision；`roadmap.md:427`：`M15 只做诊断、排行和聚合，不给自动改法，不把 LLM 判断当事实。`
- approval_binding: 历史来源 `agenthub-extraction-program/artifacts/decision-log.md` 已标 `approved_by:user`；本任务最终确认 pending。
- facts_and_constraints: 核心目录不得因看板产生改动；关键事实只能来自结构化来源。
- Logic: 已批准只读边界 -> 禁止自动改法/推断 -> 选择独立诊断工具 -> 退化可见但不制造新控制面。
- choice_reason/impact: 防止 M15 越界成优化器或第二套运行时。
- consequences_and_risks: 能诚实暴露问题；代价是诊断后仍需人决定怎么改。
- rejected_alternatives: 自动修复器：违反 D14/D31；嵌入核心：违反 roadmap 验收。
- unresolved_items/owner: 具体读数、合法跳步、页面交互由当前 make-decision 收敛。
- Supersedes: none

### D-002

- question/final_option: 退化诊断用什么作为“本来应该发生”的标准？用户选择 A，并纠正诊断单位应是漏 step/skill，不是允许少走 stage。
- recommendation/plain_language: 选择推荐项；读取当前明确契约，只把契约要求但没发生的 step/skill 报为退化。
- decision: 五个 stage 是固定标准流程，不是按任务裁剪的选项。未来 stage 未开始显示 pending；后续 stage 已出现但前置 stage 无事实，才是结构退化。每个 step 必须按 `steps.json` 留 outcome，可明确 `skipped/not_applicable`；skill 按 `skill-deps.yaml` 的 trigger 判断，`trigger=false` 必须有理由。
- source_type/reference/exact_excerpt: actual user reply；当前会话：`A，你说错了吧，是少走了step或skill吧，stage应该没法少走`
- approval_binding: host-visible current reply；hash 由宿主会话保留，本任务最终确认 pending。
- facts_and_constraints: 用户明确纠正旧问题表述；roadmap 的 `missing_stage/skipped_step` 可能混用层级或已经过期。
- Logic: 用户纠正诊断对象 -> 必须核实当前 stage/step/skill 契约 -> 以显式 manifest 为 expected truth -> 避免把旧 roadmap 口径做进产品。
- choice_reason/impact: 防止把不可省略的 stage 与 stage 内可观测动作混成一类。
- consequences_and_risks: 诊断层级准确；当前 runtime 没有在所有入口强制前置 stage 完成，因此 M15 仍要检测 stage 证据断链，但不能把它写成合法简化。
- rejected_alternatives: 固定五阶段缺失推断：问题轴错误；历史行为推测：会把漂移当规范。
- unresolved_items/owner: none；当前契约已核实。
- Supersedes: 最终确认后取代旧批准 D17“small task 可只走 intake+apply”的 stage 裁剪口径；同时关闭 OPEN-002。当前标准五阶段固定，条件性不执行只发生在有 outcome 的 step 或 trigger=false 且有理由的 skill。

### D-003

- question/final_option: M14b 前置未兑现时如何继续？用户选择 B：把必要的 M14b 修复并入当前 M15。
- recommendation/plain_language: 非推荐项；推荐原为先补前置再回来，但用户选择一个任务内完成真实数据链和看板。
- decision: 当前 task 范围扩大为“修通 M15 所需的 M14b producer/source/index 链 → 用真实数据实现 M15 诊断与看板”。原 roadmap 的“M15 只读、核心目录 diff 必须为空”不再作为当前验收，必须在后续正式 decision 中显式 supersede。
- source_type/reference/exact_excerpt: actual user reply；当前会话：`B`
- approval_binding: host-visible current reply；最终整体验收 pending。
- facts_and_constraints: M14b production registries 为空、无真实 index 样本、artifact projection 当前校验失败；不修 producer 就无法交付原 M15。
- Logic: 核心输入链未兑现 -> 原 M15 无法诚实交付 -> 用户选择同 task 扩围修复 -> producer 与 consumer 形成真实端到端链。
- choice_reason/impact: 用户选择 B；更多理由未提供。影响 runtime/evidence、source registry/index producer 与独立 dashboard 工具，不再是纯看板改动。
- consequences_and_risks: 好处是一个任务交付真实闭环；风险是范围膨胀、producer/consumer 耦合、可能侵入 M17 多 CLI 范围，且需要重新定义原 roadmap 的验收边界。
- rejected_alternatives: A 先补 M14b 再回 M15、C 缩为证据浏览器；均由用户本轮未选，具体拒绝理由未提供。
- unresolved_items/owner: M14b 修复覆盖哪些 source/CLI、怎样限制只修 M15 必需部分，由 Talk Round 2 继续决定。
- Supersedes: D-001 中“M15 只读 M14b facts/index，核心目录不改”的实现边界；保留“不猜事实、不自动给改法”的产品边界。

### D-004

- question/final_option: 当前 task 内的 M14b 修复覆盖哪些数据来源？用户选择 A：通用任务事实 + 当前 Codex transcript。
- recommendation/plain_language: 推荐项；先让当前真实运行链可观测，同时把多 CLI 差异留给 M17。
- decision: M15/M14b producer 本次接通 WorkflowHub canonical task/material/fact/quality/manifest 数据与当前 Codex transcript/session/tool_use/token/subagent 可验证元数据；设计窄 source adapter 契约，但不实现 Claude adapter。
- source_type/reference/exact_excerpt: actual user reply；当前会话：`A`
- approval_binding: host-visible current reply；最终整体验收 pending。
- facts_and_constraints: Codex 是当前实际宿主；M17a/M17b 已拥有 repo-contained skills 与多 CLI 适配边界；关键事实缺失仍必须 unknown/missing。
- Logic: M15 需要真实成本/时序数据 -> task facts 不足 -> 接当前 Codex transcript -> 获得可证伪样本，同时避免提前吞并 M17。
- choice_reason/impact: 推荐项被用户选择；影响 source registry、Codex transcript adapter、去重/归属、真实样本验收。
- consequences_and_risks: 可完成当前 M15 核心视图；M17 前 Claude 运行显示 unsupported/missing，不能伪装已覆盖。
- rejected_alternatives: B 双 CLI：范围过大并侵入 M17；C 只接 task facts：无法交付 token/session/subagent 成本归因。
- unresolved_items/owner: transcript 部分损坏/缺失时是整次失败还是降级展示，由下一题决定。
- Supersedes: none

### D-005

- question/final_option: 数据缺失或损坏时整次失败还是部分生成？用户选择 B：按严重程度分层处理。
- recommendation/plain_language: 推荐项；安全和来源真实性错误立即失败，普通数据缺口保留可见并继续生成 partial 看板。
- decision: path traversal/escaped realpath/source identity/task binding/top-level contract incompatibility 导致整次生成 fail-loud；普通 missing/unknown/unsupported/单条 malformed record 隔离并生成 `partial`，必须展示 source error、缺失范围和 coverage，不得静默跳过。
- source_type/reference/exact_excerpt: actual user reply；当前会话：`B`
- approval_binding: host-visible current reply；最终整体验收 pending。
- facts_and_constraints: 看板用于排障，不能因一个普通坏行完全失明；结构真实性和路径安全不能降级为 partial。
- Logic: 排障需要可用性 + 来源真实性必须 fail-closed -> 分离 fatal 与 record-level error -> partial 页面诚实展示已知和未知。
- choice_reason/impact: 推荐项被用户选择；影响 collector、index reader、dashboard generator、错误摘要和覆盖率测试。
- consequences_and_risks: 故障时仍能看见健康数据；代价是状态模型和 fixture 更多，必须防止 partial 被误标 complete。
- rejected_alternatives: A 任一坏行全失败：排障时过于脆弱；C 静默跳过：制造假完整。
- unresolved_items/owner: token “浪费”如何做确定性判定，由下一题决定。
- Supersedes: success/failure 边界中未确认的 partial 假设。

### D-006

- question/final_option: 什么情况下可以标记 `token_waste`？用户选择 A：只认机械可证浪费。
- recommendation/plain_language: 推荐项；高成本与浪费分开，避免把复杂任务误判为低效。
- decision: token_count/duration/retry/tool_use 始终可作为成本事实排行；只有去重契约证明重复 message/tool_use 被重复计数，或已登记来源明确证明动作冗余时，才派生 `token_waste`。高于均值、固定阈值或模型判断均不得自动标 waste。
- source_type/reference/exact_excerpt: actual user reply；当前会话：`A`
- approval_binding: host-visible current reply；最终整体验收 pending。
- facts_and_constraints: M0 已证明 token 与 tool_use 需分别按 message.id/tool_use.id 去重；当前没有可信同类任务基线。
- Logic: 浪费是负面判断 -> 关键事实不能猜 -> 限定为可复现重复/明确冗余 -> 成本排行保持客观。
- choice_reason/impact: 推荐项被用户选择；影响 failure_domain tagger、成本视图文案和反例测试。
- consequences_and_risks: 几乎不误报；代价是很多“看起来贵”的执行只显示高成本，不会自动归类为浪费。
- rejected_alternatives: B 历史基线：样本和同类定义不足；C 固定阈值：随模型/任务规模漂移。
- unresolved_items/owner: 静态看板生成/刷新方式由下一题决定。
- Supersedes: roadmap 中未定义算法的宽泛 `token_waste` 表述。

### D-007

- question/final_option: 看板怎么生成和刷新？用户选择 C，并把 C 修订为“静态页面永久不变，任务执行时自动更新 task/project 统计数据”。
- recommendation/plain_language: 原推荐是手动静态快照；用户选择自动更新数据、静态页面只负责读取，目标是无需维护服务。
- decision: 每个 task 执行时在自己的 `taskPath` 产出 M15 所需 canonical facts；每个 project 建立统计投影目录；`/Users/Hugh/Hugh/Knowledge/Projects` 放一个全局静态监控 HTML。HTML 本身不随任务重写，数据在执行过程中自动更新。具体跨目录读取机制和共享写入模型由 D-008 收敛。
- source_type/reference/exact_excerpt: actual user reply；当前会话：`C，能否使用一个静态页面，所有project的task的在执行时生成需要的数据在task_dir中，方便静态html读取。这样就不用维护了。task_dir的路径成为数据源。比如在“/Users/Hugh/Hugh/Knowledge/Projects/workflowhub”中生成一个新的任务统计文件夹，每个task进行的时候更新里面的数据，在“/Users/Hugh/Hugh/Knowledge/Projects”里新增一个静态的监控html，专门读取所有project的执行文件。`
- approval_binding: host-visible current reply；最终整体验收 pending。
- facts_and_constraints: `taskPath/facts.jsonl` 必须是真相源；project/global 文件只能是可重建投影；普通 file:// HTML 不能自动遍历任意本机目录；跨 task/project 共享写必须防并发覆盖。
- Logic: 用户要自动刷新且不要服务维护 -> task 执行写 canonical facts -> project/global 派生投影自动更新 -> 固定静态 HTML 消费派生数据。
- choice_reason/impact: 用户希望所有 project 自动汇总且无需手工重新生成页面；影响 task writer、project projection、global discovery/data bundle 与静态 HTML。
- consequences_and_risks: 页面无需常驻服务；风险是共享投影并发、浏览器 file:// 读取限制、project discovery 和部分更新失败不能反向污染 task 真相。
- rejected_alternatives: A 手动快照未选；B 本地服务未选。具体拒绝理由以用户“这样就不用维护了”为准。
- unresolved_items/owner: 静态 HTML 如何在无服务下获得跨 project 数据；是否采用 project index + global data bundle，由 Talk Round 2 新增问题决定。
- Supersedes: “看板生成器只由用户手动运行”的未确认假设；保留独立静态页面、不运行本地服务。

### D-008

- question/final_option: 无服务静态 HTML 如何获得所有 project/task 数据？用户选择 A：task 真相 → project 投影 → 根 data.js → 固定 HTML。
- recommendation/plain_language: 推荐项；页面不扫描磁盘、不启动服务，运行时只更新可重建数据投影。
- decision: canonical 运行事实仍写各 `taskPath` 的 `facts.jsonl`，`quality/evidence/monitoring/` 只保存 supporting source evidence；project 派生投影写 `Projects/<project>/monitoring/tasks/<task-id>.json`，每 task 独占文件；root projector 在全局锁内全量扫描 project 投影，从同一批记录原子替换 derived `Projects/workflowhub-monitor-facts.jsonl` 与 `Projects/workflowhub-monitor-data.js`；永久页面为 `Projects/workflowhub-monitor.html`，用 classic script 读取 data.js。project/root 投影不供 runtime 查 task，也不升级为真相源。
- source_type/reference/exact_excerpt: actual user reply；当前会话：`A`
- approval_binding: host-visible current reply；最终整体验收 pending。
- facts_and_constraints: `file:// fetch(JSON)` 实测失败，classic script 读取已知同级 data.js 成功；TaskHandle 已有锁、临时文件、fsync、rename 原子写模式。
- Logic: 静态页面无法自动遍历磁盘 + 用户不要服务 -> 运行时生成已知路径 data.js -> 页面零服务读取 -> `taskPath/facts.jsonl` 仍保持唯一真相。
- choice_reason/impact: 推荐项被用户选择；影响 task-local evidence、project projection、global projector/data.js 和静态 HTML 四层，但只有 task-local 是 canonical。
- consequences_and_risks: 自动聚合且页面无需维护；project/root 写失败不得回滚 task，旧页面可能 stale，必须显示 generated_at/coverage/errors；全局 projector 必须锁内全量重建，禁止多 task 增量争写。
- rejected_alternatives: B 目录选择器：需要授权且浏览器覆盖不足；C 本地服务：引入进程/端口/生命周期。
- unresolved_items/owner: none for architecture direction；精确 schema/commands/tests 由 build-spec/build-plan 在不改变本决定前提下细化。
- Supersedes: D-007 中未决的跨目录读取机制。

### D-009

- question/final_option: M15 完成时真实数据链需要证明到什么程度？用户选择 A：至少一个 fresh Codex 真实任务完整跑通。
- recommendation/plain_language: 推荐项；新链路必须在真实任务中证明，旧任务缺历史数据可诚实 partial，不拖成迁移工程。
- decision: M15 完成前至少一个 fresh Codex 真实任务必须产生并串通：五阶段/step outcome/skill trigger+execution、session/subagent、token/duration/retry/tool_use、review/verify、automation/human-intervention facts → `facts.jsonl` canonical facts + supporting evidence → project per-task projection → global derived JSONL → root data.js → static HTML。旧 task 可显示 partial/missing；fixture/schema 绿不能替代真实链路。
- source_type/reference/exact_excerpt: actual user reply；当前会话：`A`
- approval_binding: host-visible current reply；最终整体验收 pending。
- facts_and_constraints: 当前这些字段多数尚无生产保证；direction advice F-85e6541149d5/F-97244eccee85 要求把前置和未来假设显式化。
- Logic: 生产来源当前未接通 -> 测试不能证明真实消费 -> 要求一个 fresh real Codex E2E -> 可证伪原 M15 用户结果，同时不要求迁移全部历史。
- choice_reason/impact: 推荐项被用户选择；影响完成判据、验收样本、证据链和旧任务展示语义。
- consequences_and_risks: 防止交付空壳看板；代价是必须跑一个完整真实任务，链路任一层缺失都只能保持 incomplete。
- rejected_alternatives: B fixture+部分真实数据：核心链仍可能断；C 全量旧任务完整：不可恢复历史 transcript，扩大为迁移工程。
- unresolved_items/owner: none for direction advice；Grill 核实实际 Codex transcript 接口、术语和 ADR。
- Supersedes: “未来执行会自然产生全部字段”的未证实假设。

### D-010

- question/final_option: Codex adapter 如何找到正确 transcript？用户选择 A：launcher 显式登记精确路径和 session_id。
- recommendation/plain_language: 推荐项；宁可显示 unknown，也不拿“时间最接近、cwd 一样”去猜错会话。
- decision: launcher 必须为当前 WorkflowHub invocation 显式登记 transcript realpath、session_id、格式/CLI 版本和 task/run 绑定；adapter 校验后读取当前宿主任务 transcript。未登记、绑定不符或版本不支持时记录 unknown/partial。禁止扫描 `~/.codex/sessions`、按 cwd/时间猜测。公开事实只留受控 source/session ref，不复制 raw transcript；3rd-review provider 私有 session 继续禁止读取。
- source_type/reference/exact_excerpt: actual user reply；当前会话：`A`
- approval_binding: host-visible current reply；最终整体验收 pending。
- facts_and_constraints: 当前 Codex transcript 可读但不是 WorkflowHub 稳定接口；ADR 0005 禁止 stage 自行发现全局路径；ADR 0007 禁止读取 review provider 私有 session。
- Logic: 会话归属必须可证伪 -> launcher 是唯一身份入口 -> 显式登记并校验 -> 缺失时诚实 unknown，不用启发式猜测。
- choice_reason/impact: 推荐项被用户选择；影响 launcher registration、Codex adapter、source identity 校验和 partial 状态。
- consequences_and_risks: 避免串错会话；代价是宿主无法传入路径时成本/会话视图不完整，且 schema 版本变化必须显式 unsupported。
- rejected_alternatives: 扫描本机 session：会串任务且泄露范围；修改宿主持续推送：扩大为新的宿主协议和双写链。
- unresolved_items/owner: none。
- Supersedes: OPEN-012。

### D-011

- question/final_option: 自动化率、人工介入、趋势和“常见问题”怎样避免猜测？采用机械计数，不设经验阈值。
- recommendation/plain_language: 只数有明确来源的动作；分母不全就显示 unknown，样本少就只列事实，不装成趋势。
- decision: 自动化率分母是同一筛选范围内有明确 origin 的可核实执行/派发动作；自动动作数除以该分母。人工介入只计明确 user reply/approval/override/request 或已登记 human-origin action。origin 缺失则该范围 automation_rate 为 unknown。趋势至少需要两个不同时间桶且各桶分母可用，否则 insufficient_samples；问题聚合可列原始分组和 count，但 count<2 不标“常见”。
- source_type/reference/exact_excerpt: current make-decision detail derived from R-004/R-006 and M0 missing-is-data boundary；最终用户确认 pending。
- approval_binding: pending final decision approval。
- facts_and_constraints: 不可测指标不能成为 gate；unknown 不能写 0；当前没有可信固定阈值或同类任务基线。
- Logic: 指标必须可复算 -> 只用显式 origin 和事实计数 -> 分母缺失即 unknown -> 避免把样本不足包装成趋势/常见问题。
- choice_reason/impact: 这是已选“不猜事实”的直接细化，不新增产品方向；影响聚合公式、页面文案和反例验收。
- consequences_and_risks: 数字可解释；早期很多范围会显示 unknown/insufficient_samples，这是诚实状态，不是失败。
- rejected_alternatives: 固定百分比阈值、模型判断、把缺失动作算人工或自动：均会制造假精度。
- unresolved_items/owner: none；字段名和 JSON schema 由 build-spec 机械化，不得改公式。
- Supersedes: OPEN-003。

### D-012

- question/final_option: task-local 的运行事实权威放在哪里？用户选择 A：`facts.jsonl` 保持唯一权威，monitoring 目录只放证据。
- recommendation/plain_language: 推荐项；事实只写一处，页面数据坏了可以重建，不会出现两套数字互相打架。
- decision: M15/M14b 新运行事实只通过 TaskHandle 追加到 `facts.jsonl`；`quality/evidence/monitoring/` 只保存 immutable supporting evidence 和 source refs。旧 transcript/artifact/flow-health index 中被 M15 消费的信息职责映射为 facts 种类、evidence 或 derived projection，不再是并列 canonical store；完整 skills inventory 仍由既定 M14b owner 负责且当前未兑现，M15 不改其归属。project JSON、root data.js 都是可重建投影，禁止反向成为事实源。
- source_type/reference/exact_excerpt: actual user reply；当前会话：`A`
- approval_binding: host-visible current reply；最终整体验收 pending。
- facts_and_constraints: AGENTS vNext 只允许单一 task facts authority，禁止 current projection；现有 `运行事实` 术语已规定无来源不补值。
- Logic: 避免第二事实源 -> facts.jsonl 单写 -> evidence 只支撑 -> project/global 全部可删可重建。
- choice_reason/impact: 推荐项被用户选择；影响 collector writer、projection input、schema 归属和测试。
- consequences_and_risks: 权威清晰；代价是 facts schema 必须承载 M15 所需运行事实，不能把 schema 难题偷偷塞进 evidence 文件。
- rejected_alternatives: monitoring 目录另建 canonical facts：双写、漂移并违反 vNext 单一真相。
- unresolved_items/owner: none。
- Supersedes: D-008 中“canonical monitoring evidence”可能被误读为第二事实源的表述。

### D-013

- question/final_option: M15 内修 M14b 到哪里、各事实怎样证明？选择“只修交付链，所有类别机械归并并显式缺失”。
- recommendation/plain_language: 不重做整个 M14；只修页面真正要吃的数据，并让每个数字说清来源。
- decision: `steps.json`/`skill-deps.yaml` 保持只读 expected truth；本次修 artifact projection/validator、扩展 canonical facts producer/schema/index、接 task/material/quality 与 Codex registered source，并新增 supporting evidence/project/root/page 链。failure_domain 复用 M14a taxonomy；聚合身份保留 `source+skill_id+version`；contract/implementation 分版；不新增 per-skill 机器入口。session/subagent/duration/review/verify/token/tool_use/retry/automation/human 均按“事实类别与归并规则”处理，任何缺失保持 unknown/missing。
- source_type/reference/exact_excerpt: detail advice F-045966559a16/F-b084d7b17e69/F-5d0a395b4941；由 D-003/D-004/D-005/D-009/D-010/D-012 直接细化；最终用户确认 pending。
- approval_binding: pending final decision approval。
- facts_and_constraints: M14b 当前 producer 为空/失败；用户要求同一 M15 修通；不允许 build-spec 猜前置或验收。
- Logic: 交付依赖真实 producer -> 逐项划清 existing/fix/new -> 每类事实定义来源/归并/状态 -> fresh E2E 可验证且不吞并 M17。
- choice_reason/impact: 修复范围恰好覆盖 M15 真实消费；影响 fact schema/collector/adapter/projector/page 与端到端验收。
- consequences_and_risks: build-spec 有完整输入；代价是 M15 不再是纯看板 diff，producer 改动面和真实验收成本上升。
- rejected_alternatives: 假定 producer 已存在、另建第二事实源、把所有 M14/M17 一并重做。
- unresolved_items/owner: none；字段精确 JSON 形状由 build-spec 编码，不得改变权威、来源或失败语义。
- Supersedes: 旧 roadmap 的“M15 只读 M14b 且核心 diff 为空”实现边界；保留不猜事实、不自动给改法。

## 三轮 talk

| talk_id | 问题/选项 | 后果/风险 | 用户选择/原文 | 队列变化 | source/evidence |
| --- | --- | --- | --- | --- | --- |
| T-001 | expected 流程真相源：A 显式契约 / B 固定五段 / C 历史推测 | A 诚实但旧任务可能 unknown；B 误报；C 固化漂移 | `A，你说错了吧，是少走了step或skill吧，stage应该没法少走` | 接受 A；移除“合法少 stage”假设，新增当前契约核实；其余问题重排 | 当前会话真实回复 |
| T-002 | M14b 未兑现：A 暂停先补前置 / B 并入 M15 / C 缩减目标 | B 可一个任务闭环，但明显扩围并推翻只读边界 | `B` | 接受 B；新增 source/CLI 覆盖边界问题；页面布局和阈值后移 | 当前会话真实回复 |
| T-003 | source 覆盖：A 通用事实+Codex / B Codex+Claude / C 仅 task facts | A 可真实交付且不侵入 M17；B 扩围；C 缺成本归因 | `A` | 接受 A；移除 Claude adapter；把部分数据失败语义提升为下一题 | 当前会话真实回复 |
| T-004 | 坏数据：A 任一错误全失败 / B 分层 partial / C 静默跳过 | B 兼顾安全真实性与排障可用；实现状态稍多 | `B` | 接受 B；fatal/partial 边界已定；token_waste 定义成为下一最高问题 | 当前会话真实回复 |
| T-005 | token_waste：A 机械可证 / B 历史基线 / C 固定阈值 | A 最少误报；高成本不等于浪费 | `A` | 接受 A；移除基线/阈值自动判废；生成与刷新方式成为下一题 | 当前会话真实回复 |
| T-006 | 刷新：A 手动快照 / B 本地服务 / C stage 自动更新 | 用户选择 C，并新增“task_dir 真相源→project 统计目录→全局静态 HTML”方案 | 用户完整回复见 D-007 | 接受自动更新方向；因 file:// 和共享写约束新增一个方向问题，Round 2 总数从 5 重排为 6 | 当前会话真实回复 |
| T-007 | 跨 project 数据：A task→project→root data.js / B 目录授权 / C 本地服务 | A 无服务、自动更新、保持 task 真相；需原子投影 | `A` | 接受 A；OPEN-010 关闭；Round 2 已无 high/medium 开放方向问题 | 当前会话真实回复 |
| T-008 | 真实证明：A 一个 fresh Codex E2E / B fixture+部分真实 / C 所有历史完整 | A 防空壳且不拖成历史迁移 | `A` | 接受 A；direction findings F-85/F-972 可关闭；Round 3 收敛 | 当前会话真实回复 |
| T-009 | transcript 绑定：A launcher 显式登记 / B 扫目录猜 / C 宿主持续推送 | A 最可信；缺登记时会 partial，但不会串会话 | `A` | 接受 A；OPEN-012 关闭；Grill frontier 收敛 | 当前会话真实回复 |
| T-010 | task-local authority：A facts.jsonl 唯一权威 / B monitoring 另建事实树 | A 避免双写；B 与 vNext 冲突 | `A` | 接受 A；Grill 最后一个 authority 轴关闭 | 当前会话真实回复 |

## 调研

| research_id/source | 调研重点 | 关键事实 | 处理状态 | 关联 D |
| --- | --- | --- | --- | --- |
| F-001 / roadmap+旧 decision-log | M15 既有方向 | 看板独立、静态、只读；关键事实不允许 LLM 推断 | adopted | D-001 |
| F-002 / M0 metering, observability, delegation-metrics | 历史可复用/反模式 | 继承旁路纯脚本、缺失诚实、正确去重；worker token 双来源可能漂移，必须显式 source/conflict；不搬旧路径、孤儿 collector、阻断逻辑、旧前端 | adopted | D-006/D-013 与事实类别规则 |
| F-003 / current M14 production path | M15 输入是否真实可用 | 当前三个 production source registry 全为空；没有真实 indexes 样本；artifact projection 生成 `record_kind=material`，当前 validator 判 invalid；task facts/index 不含 step/skill/token/duration/attribution | blocker 已处置 | D-003/D-009/D-013，fresh E2E 前 incomplete |
| F-004 / local static browser + current task writer | 无服务静态页能否自动读取全部 taskPath | `file:// fetch(JSON)` 实测失败；classic `<script src=data.js>` 可读已知同级文件；页面不能自动遍历目录。TaskHandle 已有 task lock 与原子 rename，可用于 canonical 写；project/root 投影须独立派生、可重建、失败不回滚 task | adopted | D-008 |
| F-005 / current Codex Desktop session JSONL | Codex transcript 真实接口 | 当前会话实际文件含 session_meta(id/cwd/originator/cli_version)、event_msg.token_count(input/cached/output/reasoning/total)、response_item tool/subagent/agent message 与 task_complete duration；路径位于 `~/.codex/sessions/<date>/rollout-*.jsonl`。当前 WorkflowHub 没有 launcher-registered transcript path，文件名/路径/schema 也不是 WorkflowHub 权威合同 | verified current shape | Grill 外部接口仍 unresolved |
| F-006 / ADR 0005、ADR 0007、CONTEXT | 命名、身份和私有 session 边界 | `task_dir` 是全局配置名，单任务叶目录必须叫 `taskPath`；只有 launcher 能解 storageRoot。review provider 私有 session/raw output 永不进入 M15；当前任务宿主 transcript 仅由 launcher 显式登记后读取 | adopted | D-010/ADR 0012 |

## grill

| grill_id | CONTEXT/冲突 | 结论 | ADR/四项退出 | source/evidence |
| --- | --- | --- | --- | --- |
| G-001 | `task_dir`/`taskPath` 命名；facts authority；launcher-only identity；review provider session 边界；投影是否反向成为 task index | `facts.jsonl` 唯一权威，monitoring 仅证据；统一 taskPath；project/root 仅 derived；当前宿主 transcript 显式登记，provider 私有 session 排除 | ADR 三项均 true，新增 ADR 0012；四项 exit check 通过 | `CONTEXT.md` 新术语；ADR 0005、0007、0012；用户两次实际回复 `A` |

## 审查处置

| finding_id | 原始事实/来源 | 后果 | status | next_action/evidence_ref | owner/consumer/retain_or_delete |
| --- | --- | --- | --- | --- | --- |
| F-636e5ccadf86 | direction advice：盲审包无法验证 roadmap/M0 是否已读 | 强制把 load-bearing 结论和来源处置写入决定 | fixed | R-005/R-008、F-001/F-002/F-003/F-004 已逐项记录来源、事实与后果；review result ref | make-decision / build-spec / retain |
| F-85e6541149d5 | direction advice：M14b 当前空/失败，缺进入 M15 消费端的前置完成条件 | 没有真实 producer 就只能做空看板 | fixed | D-003 扩围修 producer；D-009 要求 fresh Codex E2E 后才能完成；review result ref | user+make-decision / build-spec+verify-code / retain |
| F-97244eccee85 | direction advice：step/skill/token/session 等生产保证与未来假设混在一起 | 可能把“将来会产出”冒充已存在 | fixed | D-004 定 source；D-009 列出必须由真实 run 证明的字段和全链；review result ref | user+make-decision / build-spec+verify-code / retain |
| F-f948863c1a61 | direction advice：静态页如何拿数据和刷新不明确 | 无服务页面可能实际读不到数据 | fixed | D-008 已确定 task→project→root data.js，页面无 fetch/遍历，投影更新即刷新；review result ref | make-decision / build-spec / retain |
| F-045966559a16 | detail advice：M14b producer/source/index 的新建、修复、既有边界没逐项声明 | build-spec 可能把关键前置当已存在 | fixed | 新增“M14b producer 修复边界”，明确 manifests 只读、producer/schema/index 修复、Codex adapter 与 projections 新增及分层失败；detail result ref | make-decision / build-spec+build-plan / retain |
| F-05621bcfbef0 | detail advice：审查 packet 只给压缩摘要，没让 reviewer 看见完整 decision-log/Grill/ADR | reviewer 无法独立核验本日志已有的来源、理由、风险、Supersedes 和 Grill 文档 | accepted limitation | canonical decision-log/CONTEXT/ADR 实际已写且保留；本次 packet 可见性不足原样保留，不重跑 unchanged review；detail result ref | make-decision/wh-review packet owner / retain |
| F-5d0a395b4941 | detail advice：launcher 登记 transcript 的时机、字段、存放和校验没写全 | source binding 可能被实现成猜测或泄露本地路径 | fixed | 用户流程第 1、2、8 步和 D-010：invocation 前登记 realpath/session/version/task-run；公开仅留 source/session ref；detail result ref | make-decision / build-spec+build-code / retain |
| F-b084d7b17e69 | detail advice：session/subagent/duration/review/verify 缺来源、归并、展示与验收规则 | fresh E2E 完成判据不完整 | fixed | 新增“事实类别与归并规则”；D-009 的所有类别均要求真实来源、状态、回链，fixture 不可替代；detail result ref | make-decision / build-spec+verify-code / retain |

## 最终确认

- 状态：confirmed
- 用户原文与 host-visible 绑定：`请自己检查原始资料，看看所有原始需求是否都记录了，如果没问题，那就确认这份 M15 决定`
- 条件核验：首次逐项复核发现 M10/版本对比、旧指标合同、M14b 产物处置、per-skill 入口禁令、token 双来源和 Supersedes 等缺口；均已补入同一日志。修订后主代理重新逐项对照，两个独立只读复核均返回 `NO_GAP`。
- 确认范围：当前 decision-log 全文、D-001 至 D-013、CONTEXT 术语、ADR 0012、风险、非目标、延期和下述 Supersedes。
- 生效结果：用户给出的“若无问题即确认”条件已满足，本 M15 决定正式确认。

## 决策草案摘要

- 交付：一个永久静态 HTML，自动显示所有 project 的 task 流程退化、成本归因、问题聚合和趋势。
- 真实数据链：同一 M15 task 先修通交付所需的 M14b producer/source/index，再做投影和页面；不交付空看板。
- 权威：`facts.jsonl` 是唯一运行事实源；monitoring evidence 只支撑，project JSON/root data.js 都可重建。
- 诊断标准：五阶段固定；step 必须有 outcome；skill 按 trigger 判断；缺证据只写 unknown/missing。
- 宿主范围：当前只接 canonical task facts + launcher 明确绑定的 Codex transcript；Claude 留给 M17。
- 完成证明：至少一个 fresh Codex 真实任务完整串通 producer → facts/evidence → project/root projection → HTML。
- 明确不做：自动修复、LLM 猜事实、质量评分/gate、本地服务、目录猜测、旧 AgentHub 前端搬迁。

## 拒绝方案

| 选项 | 拒绝理由 | 关联 D |
| --- | --- | --- |
| 自动修复/自动给改法 | 超出 M15，属于后续人工决策/M16 边界 | D-001 |
| 搬旧 AgentHub 前端和 collector | M0 证明路径强绑、孤儿和阻断逻辑混杂 | D-001 |

## 风险与延期交接

| risk/deferred_id | 风险或延期内容 | 触发/后果 | 处理阶段/owner |
| --- | --- | --- | --- |
| RISK-001 | Git 历史对象库缺失 | 当前可 Talk/写材料；正式 snapshot/close 可能失败 | repo maintenance；完成前修复 |
| RISK-002 | 已核实：M14b 没有可用真实样本且生产来源未接通 | 若假设输入齐全，会做出空看板或错路径 | D-003/D-013 已定同 task 修必要 producer；fresh E2E 前保持 incomplete |
| RISK-003 | M14b 当前生产链未达到 M15 前置条件 | 核心流程/成本/时序视图没有可消费的真实 present 数据 | D-009 要求真实全链；fixture 不得替代 |
| RISK-004 | 用户选择同 task 扩围修 M14b | 可能吞入多 CLI、全量 trace 平台或 M17 内容 | D-004/D-013 限定 canonical facts+Codex；Claude/multi-CLI 延期 M17 |
| DEF-001 | 候选池、改法、attempted edits、负例库 | M15 只交事实 | M16 |
| DEF-002 | repo-contained skill、多 CLI 适配 | 不属于诊断看板的最小消费链 | M17a/M17b |
| DEF-003 | 旧 D26 的“待迭代清单”若指候选优先级/迭代入口 | M15 只展示事实列表，不形成候选对象或改法 | M16 |
| DEF-004 | `skills-inventory.json` 仍是未兑现的 M14b 独立输出 | M15 不消费，不能借 M15 偷换 owner；缺失会阻塞 M17a 的既定输入 | M14b owner 在 M17a 开始前补齐；M17a 只消费/收敛 |

## 质量边界

- 质量事实：M0/roadmap/旧 decision-log 是输入证据；review/test 结果只说明事实。
- 推进资格：当前需求和材料可读即可继续同 task Talk；缺失质量事实不冻结修订。
- 完成判据：三轮真实 Talk、必要调研、Grill、两次独立 advice、用户最终确认和 interaction aggregate 全部真实完成。
- 不可逆授权边界：本阶段不授权 commit/push/merge/archive/cleanup。

## 未决项

| item_id | 未决内容 | 原因 | 谁在何时解决 |
| --- | --- | --- | --- |
| OPEN-001 | 已解决：完整用户流程、单页四区、自动投影刷新、数据状态与失败语义 | D-005/D-007/D-008/D-011 与范围章节 | 不再开放 |
| OPEN-002 | 已解决：stage 固定；step 必须留 outcome；skill 条件触发 | 用户纠正，当前 manifest/runtime 契约核实 | D-002；不再开放 |
| OPEN-003 | 已解决：显式 origin 分母；明确人工事件；两桶才称趋势；count<2 不称常见；token waste 仅机械可证 | D-006/D-011 | 不再开放 |
| OPEN-004 | 已解决：M10/M14b 当前真实输入不足 | 现场扫描与生产入口探针已证实 | F-003；不再开放 |
| OPEN-005 | 已解决：扩大当前 M15 task，先修必要 M14b 再做看板 | 用户选择 B | D-003；不再开放 |
| OPEN-006 | 已解决：通用任务事实 + 当前 Codex transcript；Claude 留 M17 | 用户选择 A | D-004；不再开放 |
| OPEN-007 | 已解决：安全/身份/顶层契约错误全失败；普通记录错误生成 partial | 用户选择 B | D-005；不再开放 |
| OPEN-008 | 已解决：只认机械可证重复/冗余；高成本不等于浪费 | 用户选择 A | D-006；不再开放 |
| OPEN-009 | 已解决：静态 HTML 固定不变，任务执行时自动更新数据 | 用户选择并修订 C | D-007；不再开放 |
| OPEN-010 | 已解决：`facts.jsonl` canonical facts + supporting evidence → project per-task projection → root data.js atomic rebuild → fixed HTML | 用户选择 A | D-008/D-012；不再开放 |
| OPEN-011 | 已解决：至少一个 fresh Codex 真实任务全链 E2E；旧任务可 partial/missing | 用户选择 A | D-009；不再开放 |
| OPEN-012 | 已解决：launcher 显式登记精确 transcript 路径、session_id、版本和 task/run 绑定 | 用户选择 A；D-010 | 不再开放 |
| OPEN-013 | 已解决：`facts.jsonl` 是唯一运行事实权威，monitoring 目录只存支撑证据 | 用户选择 A；D-012 | 不再开放 |

## Supersedes（已随最终确认生效）

- D-002 取代旧 D17“small task 可裁剪为 intake+apply”的 stage 跳过口径；五阶段固定，step/skill 以 outcome/trigger 判定。
- D-003/D-013 取代旧 roadmap `:436` 的“M15 只读 M14b、核心 diff 必须为空”：当前真实 producer 未兑现，因此同一 task 修通 M15 必需链；保留独立看板、不猜事实、不自动给改法。
- D-008/D-012 取代旧 D26 的“HTML 直接读全局 jsonl”读取方式，但保留 D11 输出职责：`facts.jsonl` 单一权威 → project per-task projection → derived global JSONL → root data.js → fixed HTML；派生层不成为 global task index。
- D-010 收窄旧“回指 transcript path”：公开页面回指受控 source/session ref，不暴露 raw native session path。
- 旧 D26 的“待迭代清单”只保留事实列表；候选池、优先级和迭代入口延期 M16。
- 以上是当前 M15 decision supersedes，不建立 task successor/predecessor；旧 program 材料只读保留。

## 文档结果

- CONTEXT.md：已新增监控来源证据、项目监控投影、全局监控快照三个术语。
- ADR：已新增 `docs/adr/0012-task-local-monitoring-and-derived-projections.md`。
- ADR criteria：hard to reverse=true；surprising without context=true；genuine tradeoff=true。
- 术语/ADR 冲突及处理：按 ADR 0005 把 per-task `task_dir` 更正为 `taskPath`；ADR 0007 的 provider 私有 session 禁令保持，M15 只读 launcher 登记的当前宿主任务 transcript。
- build-spec 只把本日志已定流程、状态、权威、来源、归并和验收机械化为精确 JSON schema/布局/测试，不得补产品方向或改写 Supersedes。

## Exit checks

- 上下文一致：pass；canonical task facts、派生投影和静态消费者职责无冲突。
- owner/接口一致：pass；TaskHandle 写 canonical，launcher-side projector 写 project/root，HTML 只读。
- 失败语义明确：pass；fatal/partial/unknown/stale/insufficient_samples 已分开。
- 范围与延期明确：pass；Codex+通用事实 current，Claude/M16/M17 deferred，自动修复/服务/目录猜测 non-goal。

## Make-decision step updates

### Step 1 — load-context

- outcome: 已读取 make-decision 及依赖技能、当前用户原始需求、roadmap、旧批准 decision-log 与 M0 相关调研；没有把旧批准冒充本任务最终批准。
- actual_user_reply: 当前用户消息，包含开始 M15、严格从 make-decision 起步及记录要求。
- disposition: current / evidence-only / non-goal / deferred 已逐项登记。
- write_status: written via make-decision decision-log writer；canonical ref/hash 由 writer 返回后绑定。

### Step 2 — triage-scope

- outcome: 已基于原始需求建立用户流程、四个逻辑页面范围、十类数据状态、成功/失败边界、非目标和延期索引；未把页面路由、自动化率公式、合法跳步规则等未决项交给 build-spec 猜。
- actual_user_reply: no_new_requirement；使用当前用户消息中“先梳理完整范围”的明确要求。
- disposition: current 范围、non-goal、deferred 与 open items 已分别登记。
- write_status: written via 同一 make-decision decision-log writer；本轮 Talk 从 OPEN-002 的最高影响轴开始。

### Step 3 — talk-round-1

- outcome: 用户选择 A，并纠正问题层级；当前契约核实后确认：stage 固定，step 必须留 outcome，skill 才按 trigger 条件执行。Round 1 已无剩余会改变方向的痛点/成功标准问题。
- actual_user_reply: `A，你说错了吧，是少走了step或skill吧，stage应该没法少走`
- re_rank: 移除“合法少 stage”问题；新增并已完成 current-contract 事实核实；自动化率、部分数据语义、页面形态等进入 Round 2 候选。
- disposition: D-002 confirmed；旧 roadmap small-task stage skip 口径已 superseded。
- write_status: written via 同一 make-decision decision-log writer。

### Step 4 — research-inputs

- outcome: current-code 研究完成。确认 stage 固定、step outcome 与 skill trigger 的权威来源；同时发现 M14b 生产数据前置未满足，直接实现完整 M15 会缺真实 step/skill/token/duration/automation/attribution 数据。
- research facts: `runtime/stage/step-manifest.mjs` 固定五阶段和 step 连续依赖；`skill-deps.yaml` 声明 skill trigger；三个 production source registry 为空；仓库与 task storage 无真实 indexes 样本；artifact projection/validator 当前不一致；普通 task facts/index 不是 M14b 指标索引。
- actual_user_reply: no_new_requirement；本步为用户选择 A 后必要的事实核实。
- disposition: D-002 confirmed；OPEN-005 提升为 Round 2 最高影响问题；页面布局、公式、阈值后移重排。
- write_status: written via 同一 make-decision decision-log writer。

### Step 5 — talk-round-2

- outcome: Round 2 完成。用户明确选择同 task 修必要 M14b、只接通通用事实+Codex、fatal/partial 分层、token_waste 仅机械可证、运行时自动更新数据，以及 task→project→root data.js→固定 HTML 架构。
- actual_user_replies: `B` / `A` / `B` / `A` / 用户提出静态全局页面方案 / `A`；逐项见 T-002 至 T-007。
- re_rank: 页面物理拆分、自动化率数学、insufficient_samples 数字阈值不再改变架构方向；保留为 detail/grill 检查，不交给 build-spec 改写已选边界。
- disposition: D-003 至 D-008 current；Claude adapter deferred to M17；本地服务和目录授权 non-goal/rejected。
- write_status: written via 同一 make-decision decision-log writer；下一步 direction advice。

### Step 6 — direction-advice

- outcome: 独立方向 advice 已返回 available/semantic；有效异源 reviewer 为 opencode/v4flash，codex/luna 因 SAME_SOURCE 被真实排除。共 3 条 major actionable、1 条 minor。
- transport/provenance: attempt `quality/reviews/attempts/6cb885d8-96a9-4192-a716-bf3d9fac3eea/attempt.json`；result `quality/reviews/results/make-decision-direction-3875e68cfad8748ee1491be2aa5de833719bc900-6cb885d8-96a9-4192-a716-bf3d9fac3eea.json`；material `f3dd0f2bb3a98bda81615b26a270fa5794cbc4f907c92822e7b0b2867504853f`。
- disposition: 来源处置与静态数据流 finding 已 fixed；M14b 完成条件和字段生产保证合并为 Talk Round 3 的唯一方向问题，不把 reviewer advice 当 pass。
- actual_user_reply: no_new_requirement；本步是 Round 2 收敛后的独立 advice。
- write_status: written via 同一 make-decision decision-log writer；下一步 Talk Round 3。

### Step 7 — talk-round-3

- outcome: 用户选择至少一个 fresh Codex 真实任务完成全链 E2E；旧任务允许 partial/missing。direction advice 的两个生产保证 finding 已由 D-009 解决，Round 3 无剩余方向问题。
- actual_user_reply: `A`
- re_rank: F-85e6541149d5 与 F-97244eccee85 从 needs_human 转 fixed；实际 Codex transcript 接口、canonical naming、failure semantics、scope boundary 进入 Grill 客观退出检查。
- disposition: D-009 current；不做 fixture 冒充真实链，也不做全量历史迁移。
- write_status: written via 同一 make-decision decision-log writer；下一步 grill-with-docs。

### Step 8 — grill-with-docs

- outcome: 完整 Grill 已完成。外部接口选择 launcher 显式登记 transcript path/session_id；`facts.jsonl` 保持唯一运行事实权威；canonical 命名更正为 taskPath；failure semantics 和 scope boundary 均通过。CONTEXT 新增三项术语，ADR 0012 记录三层投影和 transcript 边界。
- actual_user_replies: `A` / `A`
- conflict_resolution: ADR 0005 的 launcher-only/storageRoot/taskPath 约束继续生效；ADR 0007 的 review provider 私有 session 禁令继续生效，M15 只接当前宿主任务 transcript，不接 provider session。
- adr_decision: create；hard_to_reverse=true、surprising_without_context=true、genuine_tradeoff=true。
- disposition: OPEN-001/003/012 closed；四项 exit check pass；无 high/medium 方向歧义留给 build-spec。
- write_status: written via 同一 make-decision decision-log writer；下一步 decision draft。

### Step 9 — write-decision-draft

- outcome: 决策草案已完成；原始需求、事实、用户选择、理由、后果、风险、完整用户流程、单页四区、数据状态、成功/失败边界、非目标和延期均已落到同一 decision-log。没有把未决产品方向交给 build-spec。
- decision_set: D-001 至 D-013；其中 D-002/D-003/D-008/D-010/D-012/D-013 明确记录本轮对旧 stage 裁剪、只读边界、静态读取方式、transcript 绑定、事实权威和 producer 范围的修订。
- approval_status: pending final user confirmation。
- write_status: written via 同一 make-decision decision-log writer；下一步 detail advice。

### Step 10 — detail-advice

- outcome: 独立 detail advice 已返回 available/semantic；有效异源 reviewer 为 opencode/v4flash，codex/luna 因 SAME_SOURCE 排除。共 3 条 major actionable、1 条 minor。
- transport/provenance: attempt `quality/reviews/attempts/59a1de7a-1072-4fb0-a705-cb83d6af75e7/attempt.json`；result `quality/reviews/results/make-decision-detail-4ccb92d5de6d72462f59489db010c38d8da0c60d-59a1de7a-1072-4fb0-a705-cb83d6af75e7.json`；material `e5670a7df62f1af0bb876d76558930632b9ef8de6f2d73ed2475f2aca113322c`。
- disposition: M14b producer 边界、transcript registration、session/subagent/duration/review/verify 规则已补齐；审查 packet 未含完整 decision-log 的 finding 作为 accepted limitation 保留，不重跑 unchanged review。
- actual_user_reply: no_new_requirement；本步是决策草案后的独立 advice。
- approval_status: pending final user confirmation；下一步呈现最终决定卡。
- write_status: written via 同一 make-decision decision-log writer。

### Step 11 — approve-decision

- outcome: 最终决定卡已用大白话呈现方向、范围、成功标准、风险、advice facts、非目标和延期。用户要求先自行核对全部原始资料，若无问题即确认；首次核对发现缺口后完成修订，最终主核对与两个独立只读复核均为 `NO_GAP`。
- actual_user_reply: `请自己检查原始资料，看看所有原始需求是否都记录了，如果没问题，那就确认这份 M15 决定`
- decision: accepted；条件式授权的前提已由最终 source replay 满足，不是推断确认。
- disposition: D-001 至 D-013 confirmed；Supersedes 生效；无开放 direction-changing question。
- write_status: written via 同一 make-decision decision-log writer。

### Step 12 — publish-decision

- outcome: 发布当前确认决定的 plain-language handoff；下一阶段只能把本日志机械化为 spec，不得补需求或改变事实权威、来源、失败语义、页面范围及延期边界。
- handoff: build-spec 读取本 decision-log、CONTEXT 与 ADR 0012；M15 首先修最小 M14b producer 链，再交付 derived global JSONL/data.js/static HTML，并以 fresh Codex 真实任务全链验收。
- quality_fact_boundary: 两次 advice 的真实 transport/findings/disposition 保留；detail packet 可见性 limitation 不伪装消失。interaction aggregate 在这些最终 bytes 固定后按内容寻址写入 task quality store，不创建新状态机。
- completion_boundary: 只有 interaction aggregate 成功绑定本次确认 decision hash/snapshot 后，make-decision 才可声明形式完成。
- write_status: written via 同一 make-decision decision-log writer；本阶段不授权 commit/push/merge/archive/cleanup。

# Decision Log

## 原始需求

| source_id | 原始需求/约束 | 来源引用/原文摘录 | 关联 D/处理状态 |
| --- | --- | --- | --- |
| R-001 | 必须从标准 WorkflowHub `make-decision` 开始，不跳阶段，不让 `build-spec` 补产品需求。 | 当前用户原文：`从 make-decision 开始，不要跳阶段，也不要依赖 build-spec 补需求。` | covered / 五阶段合同、D-003/D-004 |
| R-002 | `make-decision` 必须先收敛完整用户流程、页面范围、数据状态、成功/失败边界、非目标和延期项。 | 当前用户原文：`先基于原始需求，梳理完整用户流程、页面范围、数据状态、成功/失败边界、非目标和延期项。` | covered / 最终用户流程与边界 |
| R-003 | Talk 必须用大白话解释选项、后果和风险，不能用少量形式问题代替需求决策。 | 当前用户原文：`Talk 请用大白话说明选项、后果和风险。`；前序原文：`talk为什么每次只有那么几个问题？原始需求有没有在make-decision阶段彻底考虑清楚问清楚？` | 当前；三轮真实 ask/wait/reply/resume |
| R-004 | `decision-log` 必须保留原始需求、关键事实、用户选择、理由和延期交接。 | 当前用户原文：`decision-log 记录原始需求、关键事实、选择、理由和延期交接。` | covered / 本文件持续单写 |
| R-005 | 设计要真正解决六类反复缺陷：阶段漏跑、阻塞、四材料与最终交付脱节、审查只查形式、close 失败、stage 末无产物/证据检查。 | 前序用户原文：`请基于如下维度逐步分析` 后列出的 1—6 项。 | covered / G-001—G-016、五阶段合同 |
| R-006 | 必须结合新版流程改动、三次真实任务表现、task 文件和四个核心交付文件，不做表面分析。 | 关联会话：`WH-流程优化`、`WH-审查问题优化`、`PB-T01`、`PB-F13`、`KD-知识优化2`；前序原文：`请派出多个子代理详细检查会话内容、task文件、4个核心交付文件等等。` | covered / F-002、F-008、D-002 |
| R-007 | 最终要给出能实际修改 WorkflowHub 的方案，不只分析。 | 前序用户原文：`提出的建议也无法对workflowhub产生有效改动！`；当前原文：`需要详细检查调研设计这些问题应该如何处理！` | 当前；本阶段冻结方向，后续阶段实现，不在 make-decision 偷跑代码 |
| R-008 | 所有方案和后续修改必须符合 WorkflowHub 宪法。 | Talk Round 1 用户原文：`不要违反workflowhub宪法！` | 当前硬约束；research/Grill/审查逐条核对 |
| R-009 | 不得为了流程治理新增过多维护成本和项目复杂度。 | Talk Round 1 用户原文：`不要增加太多维护成本和项目复杂度` | 当前硬约束；优先复用现有四材料、facts、公共七命令和 stage outcome |
| R-010 | 不得以简化为由降低任何 stage 或独立审查的交付质量。 | Talk Round 1 用户原文：`不要降低各个stage和审查的交付质量！` | 当前硬约束；简化控制面，不削弱语义验收、真实运行和独立性 |
| R-011 | 必须检查前四个 stage 的 `spec-analyze` 是否真正覆盖原始需求、当前四材料、AC 和实际结果一致性，并保证有效问题在当前 stage 处理干净。 | Talk Round 3 用户原文：`请检查前四个阶段的spec-analyze是否正确的检查原始需求、四材料、AC 和结果一致性，有问题是否能在当前stage处理干净。` | 当前；由 Grill、细节审查和 stage-end analyze 验证 |
| R-012 | Grill 不得被单一专项带偏，必须压力测试整个原始需求和完整方案。 | Grill 用户纠正原文：`grill-with-docs 不止检查四个 spec-analyze profile、生产调用、输入覆盖、finding 修复路径和 completion 消费，还要检查整个需求的所有细节！这也是个问题，grill总是错误的检查细节，却忘了去检查需求整体` | 当前硬约束；本轮 Grill 重新展开全需求矩阵 |
| R-013 | 审计确认的执行断点必须进入现有生产事实链和完成判据：Talk 决策轴处置、交互 lifecycle 生产校验、upstream stage/task dependency 消费、逐 AC current evidence、三处业务确认和 close 操作边界；不得只补文档/测试或新增平行控制面。 | 当前用户原文：`补齐“当前方案尚未覆盖干净的地方”吧，不要遗漏需求，同时也不要让workflowhub的复杂度和维护难度增加`；`既要解决问题，又不违反workflowhub的宪法，同时保证workflowhub的任务执行质量`。 | 当前硬约束；细化现有 D/FR/AC/Task，仅新增一个必要 FR，不新增状态机、公共入口或 Task ID |
| R-014 | `manual-close` 这个名字必须对应真实物理 close：不能只写“带风险已交付”记录；必须执行实际 close 动作，并保留质量/发布风险的真实状态。 | 当前用户原文：`manual-close当然要执行物理close动作，否则为什么叫close呢？请设计方案，修改manual-close动作！` | covered / D-013、FR-CLS-003、AC-016、T008；复用现有六项 executor 和独立授权 |

## 目标

- 目标：把 WorkflowHub 的“标准流程”从说明性约定变成可执行、可观察、可修复、可验收、可安全 close 的同一条事实链。
- 当前待确认的核心结果：原始需求在 `make-decision` 完整决定；每个 stage 的真实 step/skill/产物/证据可核对；质量审查检查业务语义；下游只能消费当前四材料；close 只在交付与质量事实都真实闭合时完成。

## 最终用户、角色与完整流程

角色：需求用户负责方向选择、最终阶段确认和不可逆授权；Stage Agent 按 manifest 执行并修复当前 stage；runtime 只认证事实和派生状态；异源 reviewer 只给质量建议；close 执行器只做已授权的物理交付。

1. 用户提交原始需求；host transcript 保留真实来源，`decision-log.md` 逐条编译为 requirement/decision/defer/reject，不新增原始需求账本。
2. `make-decision` 创建独立 task/worktree，完成三轮真实 Talk、必要调研、方向审查、全需求 Grill、决策草案、细节审查、stage-end 检查和用户确认。
3. `build-spec` 只做规格 Clarify，把已确认方向变成完整场景、状态、接口、失败边界和验收标准；不能补新的产品方向。
4. `build-plan` 把每条需求/验收映射到实现任务、测试命令、oracle、证据和产物，不允许孤儿 requirement/task。
5. `build-code` 按当前 `tasks.md` 实现和测试；发现新增页面、状态、API、范围或验收变化时，在同 task 重编受影响的当前材料，不能悄悄追加，也不创建 revision/reopen 状态机。
6. `verify-code` 回放原始需求和当前四材料，检查真实消费者、生命周期、安全、失败边界、真实运行与交付质量；finding 在当前材料和当前源码上闭环。
7. 前四 stage 的 `spec-analyze` 或 verify-code 的代码审查发现问题时，Stage Agent 当场修材料、补事实并重跑受影响检查；流程继续工作，不积累 blocked/recovery 记录，未修完也不宣称 stage completed。
8. `close` 只读核对五阶段完成、产品发布和 Git 物理事实；取得独立授权后执行 commit/archive/merge/push/cleanup。风险交付可以物理完成，但必须显示 quality incomplete、release not_released，不能冒充正常完成。
9. 用户始终看到清楚的当前状态：做到哪一步、缺什么、谁正在修、可否继续、stage 是否完成、产品是否发布、物理交付是否完成。

方向变化后的同 task 流程：当前 stage 发现方向、范围、页面/API、数据、成功失败或验收变化时，只暂停该 stage 的正式 publication，不冻结编辑和调查；host 调用 make-decision 的 Talk/decision-log/确认职责取得真实选择，更新当前 `decision-log.md`。材料 hash 变化自然使受影响的 spec/plan/tasks、analyzer、review、test 和 handoff 事实 stale；Stage Agent 重编受影响材料并重跑对应当前 stage，产生 current outcome 后再交接。这个过程不创建 reopen、revision generation、successor 或 recovery 状态。

## 页面与交互范围

- 只修改真实已有消费者：Codex/Agent Talk 与确认卡、WorkflowHub `doctor/status/run/review/verify/confirm/authorize` 输出、现有任务状态/监控投影和 close 结果。
- 不新增 Web/Workboard 页面。所有输出消费同一套派生事实，不允许 CLI、host、monitor、close 各算一套完成状态。
- 必须展示 current task/stage、当前 step/skill、四材料、stage quality、product release、physical delivery、可继续修复与不可宣称完成的区别；不得把 `unknown/unavailable/incomplete/not_released` 显示成通过。

## 数据状态与权威边界

- 原始需求：`captured / represented / explicitly_deferred / omitted_unaccepted`。
- step/skill：沿用当前 outcome 合同的 `completed / failed / skipped / incomplete / unavailable` 和真实 lifecycle，不新增状态枚举。
- 四材料：认证 worktree 根目录的 `decision-log.md/spec.md/plan.md/tasks.md` 是唯一当前材料；旧版本/hash 只读。材料变化使绑定旧 revision 的 analyzer/review/test 事实 stale。
- 质量事实：`present / unavailable / incomplete / stale / conflicting`；review/test/evidence 是事实，不是推进许可证。
- 修复循环不新增持久状态：由当前 finding、材料 revision 和重跑结果直接证明问题是否处理完。
- 对外只派生 `work_progress`、`stage_quality`、`product_release`、`physical_delivery` 四个视角，不持久化四套新状态机。
- close 保留 commit、archive、merge、push、cleanup 的既有分项物理事实；部分完成必须逐项显示。

### 四个派生视角

- `work_progress`：来源事实是现有 stage/session outcome；显示当前 stage、step/skill 和“可继续修复”。它不读取 review verdict 作为工作许可证。
- `stage_quality`：来源事实是 current authenticated stage outcome、适用 stage predicates、stage-end analyzer 或 verify closure。
- `product_release`：来源事实是五阶段 current completion、逐 AC product result 和 verify-code 当前确认；由 `completion-predicates.mjs` 纯派生显式 released/not_released 结果，不新增 release writer。
- `physical_delivery`：来源事实是 immutable close report 与 Git physical probes，逐项反映 commit/archive/merge/push/cleanup 的实际结果。

四类来源事实都只由现有 `completion-predicates.mjs` 这一处做只读组装；host、CLI、monitor、task/status 与 close 只消费，不各自重算，不形成第二 producer。

它们全部是从四材料、stage outcome、quality facts 和 close report 即时派生的展示视角，不是持久 FSM、转换表或新 writer；禁止为其新增 schema、公共命令或独立控制面。

冲突优先级：身份/路径/hash/结构篡改先 fail-loud 且不更新 canonical projection；`conflicting/stale` 使相关 stage 保持 incomplete；自身 analyzer/测试/逐 AC/交接的 `missing/incomplete/unavailable` 保持 incomplete。异源 review 的真实 unavailable 表示审查步骤已真实尝试，必须原样显示、不得显示 review pass，但它本身不是 provider 可用性 gate；是否完成继续由当前核心交付、测试、逐 AC、已知 serious finding 处置和交接共同判断。`not_released` 覆盖任何物理 delivery 成功。

## 成功/失败边界

- 正常成功：五阶段各自完成唯一职责；声明 step/skill 有真实 current outcome；前四 stage-end analyzer consistent，verify-code closure current；需求可追踪到决定、FR/AC、task、oracle、证据、产物和真实结果；T01/F13/KD 与 bundle fixtures 全绿；一个简单任务真实走完五阶段和授权 close；product released 与 physical delivery 均有真实证据。
- 可继续但未完成：材料或自身 analyzer/测试/逐 AC/交接缺口、依赖未闭合、AC 无真实结果。Stage Agent 继续同 task 修复；对外保持 incomplete/not_released，不写 blocked/recovery。异源 review unavailable 单独显示为 unavailable，但不因 provider 不可用锁死完成。
- 风险交付：用户对具体不可逆动作单独授权后可完成物理交付；`delivery=completed` 不改变 `quality=incomplete` 或 `release=not_released`。
- 必须 fail-loud：task/worktree/subject/material/snapshot 绑定错误，声明 step/skill 重复乱序或证据篡改，公共入口解析到不一致 bundle，partial canonical write。
- 不可接受失败：Talk/Clarify 伪执行；原始需求无处理状态；四材料存在但语义缺失仍 completed；审查只查格式；旧 review 覆盖新快照；猜测 usage/cost；close 分项失败却汇总成功；新增无消费者控制面或永久兼容桥。

## 范围

- 当前范围：五阶段交互与产物合同、step/skill 生命周期、前四 spec-analyze profile/生产调用/输入覆盖/修复路径/completion 消费、verify-code 专用 closure、原始需求追踪、当前 review 绑定、统一状态投影、close 只读 preflight、三个历史 fixtures、bundle smoke、一个简单全链路确定性合同回归和真实可安全入口验收。本任务不启动真实 Talk/Clarify 交互；provider 只保留真实尝试事实，物理不可逆动作仍按授权执行；生产运行时的真实交互合同不变。
- 实现可按低耦合顺序切片，但全部核心链路在本 task 内交付；任何未实现切片保持明确 incomplete，不转成延期。

## 非目标

- 不在 `make-decision` 写实现代码或替代后续四个阶段。
- 不恢复 M14—M17、successor/predecessor、selector、snapshot lineage、reopen/rebind/recovery 等旧控制面。
- 不新增没有真实 consumer、owner、测试和删除条件的页面、schema、命令或持久对象。
- 不把 provider 成功、空 findings、测试通过或 merge 单独等同业务完成。
- 不修改或吞并主 worktree 中既有的三处未提交用户改动。
- 不把本任务再次做成五套 wh-review prompt/合同的全面重写；只有 deterministic fixture 证明具体语义漏检时才窄改对应 subject/validator。

## 决定

### D-001

- question/final_option: 本次优化做到什么程度才算成功；选择 A，打通从原始需求到安全 close 的完整标准流程。
- recommendation/plain_language: 推荐 A；只修前半段或只改文档都会留下同样的断链。
- decision: 当前任务设计全链路治理合同，覆盖五阶段职责、stage-end 检查、审查闭环和 close；后续实现可以按低耦合切片执行，但不能把未实现部分伪装成交付完成。
- source_type/reference/exact_excerpt: Talk Round 1 用户原文：`A、A（跑一个简单任务完整测试即可）`，第一个 A 对应完整标准流程。
- approval_binding: Talk Round 1 real reply；最终仍需 approve-decision。
- facts_and_constraints: 当前缺陷横跨需求、step 准入、质量事实、下游 gating 和 close，局部文档修复不能形成闭环。
- Logic: 缺陷跨越完整生命周期 -> 局部修补仍保留断点 -> 选择全链路合同 -> 用分阶段实现控制复杂度。
- choice_reason/impact: 直接解决用户反复遇到的遗漏、越级、浅审查和 close 误判；影响所有五阶段及 close 的消费关系。
- consequences_and_risks: 范围较大；必须复用现有对象并通过切片、删除条件和复杂度预算防止新控制面膨胀。
- rejected_alternatives: 只修需求质量（close 仍断）；只改 skill/文档（运行时不一定执行）。
- unresolved_items/owner: resolved / D-003；按既有 validator、completion、projection、close consumer 低耦合切片。
- Supersedes: 只做局部文档或单点修复的旧候选。

### D-002

- **current_acceptance_amendment**：D-012 只修订本任务的验收执行边界：不启动真实 Talk/Clarify 交互；其余可安全执行的生产入口仍须真实验收，不可逆动作仍须单独授权。

- question/final_option: 如何证明修改有效；选择 A，但完整 dogfood 只跑一个简单任务。
- recommendation/plain_language: 推荐“历史失败模式回归 + 一个简单全流程任务”；既能抓住旧问题，也避免重复跑多个昂贵真实任务。
- decision: 将 PB-T01、PB-F13、KD-知识优化2 的关键失败模式沉淀为自动回归场景；再选一个低业务复杂度任务，从 make-decision 跑到 close，验证真实 Talk、Clarify、stage-end、审查、修复和物理交付链。
- current_acceptance_amendment：D-012 只修订本任务的验收执行边界：不启动真实 Talk/Clarify 交互；其余可安全执行的生产 stage、analyzer、review、status 和 close preflight 仍须真实验收；commit、merge、push、archive、cleanup 等不可逆动作仍须单独授权。
- source_type/reference/exact_excerpt: Talk Round 1 用户原文：`A、A（跑一个简单任务完整测试即可）`，第二个 A 及括号限制。
- approval_binding: Talk Round 1 real reply；最终仍需 approve-decision。
- facts_and_constraints: 三个历史任务业务复杂度高，不适合作为三次完整 dogfood；但其失败事实适合做确定性 fixture。
- Logic: 单靠合成测试抓不到 Agent 行为 -> 全量重跑三个真实任务成本过高 -> 历史缺陷做 fixture + 一个简单 dogfood -> 兼顾真实性与维护成本。
- choice_reason/impact: 保留真实端到端证据，同时限制执行成本和不稳定外部依赖。
- consequences_and_risks: 简单 dogfood 可能覆盖不到全部业务复杂度；由三个历史回归 fixture 补足关键失败分支。
- rejected_alternatives: 只跑合成测试（行为证据不足）；重跑三个复杂任务（成本和外部依赖过高）；只人工检查（不可回归）。
- unresolved_items/owner: resolved at decision level / 可复验验收合同；精确 fixture 文件和命令由 build-plan 实现化。
- Supersedes: 仅人工检查、仅合成测试或重跑三个复杂业务任务的旧候选。

## 三轮 talk

| talk_id | 问题/选项 | 后果/风险 | 用户选择/原文 | 队列变化 | source/evidence |
| --- | --- | --- | --- | --- | --- |
| T-001 | A 完整标准流程；B 先修需求质量；C 只改规范。 | A 范围最大但解决断链；B/C 会留下后半链路风险。 | `A` | 全链路进入当前范围；实现切片留到 Round 2 | 当前会话真实回复 |
| T-002 | A 历史回归+完整 dogfood；B 只自动化；C 人工清单。 | A 证据最强但成本较高。 | `A（跑一个简单任务完整测试即可）` | 三历史任务做 fixture；只做一个简单完整 dogfood | 当前会话真实回复 |
| T-003 | 新增约束：宪法、复杂度、质量。 | 任何方案违反其中一项都不得采用。 | `不要违反workflowhub宪法；不要增加太多维护成本和项目复杂度；不要降低各个stage和审查的交付质量` | 加入 research、Grill、审查和最终完成判据 | 当前会话真实回复 |
| T-004 | 后续需求变化：A 同 task 重编；B 每条消息重跑；C 下游吸收。 | A 保真且不新增状态机。 | `1：A` | 冻结 D-004 | 当前会话真实回复 |
| T-005 | 审查深度：A stage 专项语义审查；B 全任务重审；C 形式审查。 | A 保质量且控制成本。 | `2：A`；并强调不能再次把主方案做成 wh-review 核心重写 | 冻结 D-005；调高 production wiring 优先级 | 当前会话真实回复 |
| T-006 | 页面：A 复用现有输出；B 新 Web；C 不改展示。 | A 无新控制面。 | `3：A` | 冻结 D-006 | 当前会话真实回复 |
| T-007 | close：A 风险交付分层显示；B 禁止交付；C Git 即完成。 | A 合宪且不假绿。 | `4：A`；并要求每 stage 末尾检查处理质量 | 冻结 D-007；新增 verify-code stage-end 未决 | 当前会话真实回复 |
| T-008 | verify-code：A 专用 code-review closure；B 叠加 spec-analyze；C spec-analyze 替代代码审查。 | A 不重复且不降低代码质量。 | `A`；并要求核查前四阶段 spec-analyze 的真实覆盖与当前 stage 修复能力 | 冻结 D-008；新增 R-011 | 当前会话真实回复 |

## 调研

| research_id/source | 调研重点 | 关键事实 | 处理状态 | 关联 D |
| --- | --- | --- | --- | --- |
| F-001 | `/Users/Hugh/Downloads/workflowhub-deep-audit-six-dimensions-2026-08-20.md` | 上轮深审给出中心根因与八类修改候选；本轮已回到 clean baseline 逐项复核。 | confirmed / candidates dispositioned | D-001—D-011 |
| F-002 | 五个关联 Codex 会话 | 已读取并与三个 task/当前源码交叉核对；只作为历史执行事实，不替代当前用户选择。 | confirmed / used as regression input | D-002/D-003 |
| F-003 | 当前主仓状态 | 主 worktree 有三处既有未提交改动；本任务已从 `aae9031a` 创建独立 worktree。 | confirmed / isolated | D-003 |
| F-004 | `CONSTITUTION.md` F3/F4/F7/F9、Q1/Q2/Q3 | 四材料只决定能否继续工作；quality/review 不能锁死同任务修复；缺质量不能宣称完成；三处业务确认与五项不可逆授权分离；独立 review 不能自审。 | confirmed / hard constraint | D-003 |
| F-005 | clean task baseline 的 skill smoke | `aae9031a`/tree `c83b1537` 上复跑 `node tools/cli/smoke-local-skill-dispatch.mjs`，exit 1：`bundle sha256 mismatch: contracts/provider-protocol.md`。 | confirmed / evidence `quality/evidence/make-decision/research-baseline-20260820.md` sha256 `1c645d…a4a3` | D-003 |
| F-006 | `stage-runner.mjs`、`completion-predicates.mjs`、stage outcome adapter | runtime 不中央执行 step/skill；宿主执行后上报。缺失/无效 stage outcome 目前只是 diagnostic，可能与顶层 completed 并存；依赖只校验声明形状，不校验实际完成顺序。 | confirmed / source hashes in current research evidence | D-003 |
| F-007 | interaction contract 与生产引用扫描 | Talk/Clarify 的严格 `ask → wait → real user reply → resume` validator 存在，但生产 handler 只消费简化 aggregate；三轮 Talk、当前回复和问题卡未被生产路径充分证明。 | confirmed | D-003 |
| F-008 | PB-T01 / PB-F13 / KD-知识优化2 | T01 证明 delivery close 与 quality/product 状态被混读；F13 证明前置 task blocked 后仍能出现后置工作且 canonical 事实未阻止误解；KD 证明 `not_released`、review unavailable、stage incomplete 是不同层。三个 task root 与 selected-record snapshot hash 已固定。 | confirmed / current research evidence | D-001/D-002/D-003 |
| F-009 | 本轮 5 个并行子代理 | 宪法、五阶段、runtime、review、close 五路子代理全部因 host usage limit 失败；保留 unavailable。已有上一轮 6 份独立审查、当前源码和三个 task 证据继续使用。 | unavailable / no fabricated result | none |
| F-010 | 五个 `steps.json` 与 `docs/standard-workflow.md` | make-decision/build-spec/build-plan/build-code 末尾由 `spec-analyze` 检查；verify-code 由 code-review closure 检查。五阶段分别产出 decision、spec、plan+tasks、implementation/test/AC/integration review、code review+handoff。 | confirmed | D-003 |
| F-011 | 独立宪法边界审查 | 方案主体合宪，但要求补全 registered transcript 边界、review risk 与 analyzer gap 的区别、派生状态非 FSM，并解决 ADR 0009 冲突。 | confirmed / fixed in D-009—D-011 与验收合同 | D-009/D-010/D-011 |
| F-012 | 独立 spec-analyze 生产链审查 | completion 未消费 analyzer；原始需求为自报；深层 validator 未接 profile；close 只读 verify-code predicate。定向测试确认当前错误行为。 | confirmed / fixed in completion 与 profile acceptance | D-008/D-010 |
| F-013 | 独立全需求验收审查 | Grill 检查面存在，但历史 fixture、dogfood、逐 stage evidence、Talk/Clarify、现有输出消费者和 close 重试缺少可复验 oracle。 | confirmed / fixed in 可复验验收合同 | D-001/D-002/D-006/D-007 |

## Research 后合宪设计边界

### D-003

- question/final_option: 如何把标准流程变成真实完成约束，同时不违反“质量事实不作工作许可证”；该方向由宪法固定，不作为用户可选项。
- recommendation/plain_language: 继续允许同任务编辑和修复；只禁止把缺步骤、缺质量、旧快照或依赖未闭合写成 `completed`、正式交接或正常 task 完成。
- decision: 复用现有四材料、session event、stage outcome、quality facts、status projection 和 close report；不新增中央 skill dispatcher、第二状态机、successor/reopen/recovery 控制面或额外 public command。Stage Agent 仍执行 skill，runtime 只认证真实 outcome 并推导完成状态。每个执行约束必须明确现有 producer fact、唯一 consumer 和 canonical write 拒绝边界；“validator 存在”或“测试描述存在”均不等于生产路径已经消费。
- source_type/reference/exact_excerpt: `CONSTITUTION.md` F3/F4/F7/F9、Q1/Q2/Q3；用户 Round 1：`不要违反workflowhub宪法`、`不要增加太多维护成本和项目复杂度`、`不要降低各个stage和审查的交付质量`。
- approval_binding: 宪法约束 + 用户硬约束；最终仍需 approve-decision。
- facts_and_constraints: 四材料是工作真相；review/test/evidence 是质量事实；结构错误 fail-loud；缺质量保持 incomplete；同任务修复始终允许。
- Logic: 工作资格与完成判据必须分离 -> 不能用 review/上游 quality 卡死编辑 -> 但 stage outcome 缺失不能完成 -> 强化现有 completion derivation，不新增推进 gate。
- choice_reason/impact: 修复“看起来完成”而不制造新的死锁；改动集中在现有 validator、completion predicate、projection 和 close preflight。
- consequences_and_risks: 用户仍可继续写代码，即使上游 quality incomplete；界面必须明确“可继续修复 ≠ 可声明完成”，后置 task 的源码可存在但其 canonical completed publication 必须拒绝。
- rejected_alternatives: 中央 dispatcher（违反核心只编排、复杂度高）；review/receipt 准入 gate（违反 F3/F4/Q1/Q2）；只改文档（无法阻止假完成）。
- unresolved_items/owner: resolved / D-004—D-007。
- Supersedes: 上轮报告中 `UPSTREAM_STAGE_INCOMPLETE` 阻止同任务工作、持久 partial delivery FSM、公共 recovery 路径等不合宪候选；保留其“不能假完成”的目标，改为派生完成状态和幂等物理探测。

### D-004

- question/final_option: 后续用户消息改变需求时如何处理；选择 A。
- recommendation/plain_language: 只有方向、页面/API/数据、范围、成功失败或验收发生变化时，才在同一 task 修订决定并重编受影响材料；普通实现细节留在当前 stage。
- decision: 复用当前 `decision-log.md` 和四材料，直接重编受影响的当前材料；不新增 scope revision object、reopen、revision record、successor、`direction_revision_required` 持久状态或第二状态机。Talk 的只读需求投影同时保留当时的候选决策轴、处置、事实/回复来源、未提问理由和 D/FR/AC 落点；后续消息改变产品语义时使受影响的当前材料绑定自然 stale。未完成重编时可以继续同 task 修复，但相关 stage 不得宣称完成。
- source_type/reference/exact_excerpt: Talk Round 2 用户原文：`1：A`。
- approval_binding: Talk Round 2 real reply；最终仍需 approve-decision。
- facts_and_constraints: 宪法允许同 task 修复，禁止旧 reopen/revision/lineage 控制面；四材料是唯一当前真相。
- Logic: 变更影响产品语义 -> 原决定和下游材料变 stale -> 同 task 重编四材料 -> 不靠新增状态对象。
- choice_reason/impact: 阻止 build-spec/build-code 偷补需求，又避免每句话都重跑流程。
- consequences_and_risks: host 必须区分方向变化和普通实现细节；误分类由 stage-end semantic analyze 暴露并修正。
- rejected_alternatives: 所有消息都重跑 make-decision（摩擦过高）；下游静默吸收（遗漏风险高）。
- unresolved_items/owner: 最小分类词汇与语义 validator 在 build-spec 冻结，不做长期消息分类数据库。
- Supersedes: none。

### D-005

- question/final_option: 每个 stage 的审查深度；选择 A，并明确禁止再次把主方案缩成 wh-review 提示词/合同重写。
- recommendation/plain_language: 保留 stage 专项审查，修“是否真实调用、审了当前什么、finding 是否改到当前产物、完成状态是否消费结果”；没有复现证据不重写 prompt。
- decision: 每个 stage 审查当前核心产物的业务语义、原始需求、真实 consumer、生命周期、失败边界和验收 oracle；只在主题或快照变化后重审。`wh-review` 只做最小修复：恢复 bundle 一致性、当前 subject/material/snapshot 绑定、finding disposition 和真实 unavailable；提示词/合同只有存在可复现 semantic miss 时才改。
- source_type/reference/exact_excerpt: Talk Round 2 用户原文：`2：A（wh-review已经改过很多次了，每个stage审查提示词和合同都改过很多轮了，为什么还有问题。接下来的改动不可都是之前的审查质量核心）`。
- approval_binding: Talk Round 2 real reply；最终仍需 approve-decision。
- facts_and_constraints: 当前硬证据是 bundle 解析失败、stage outcome 未进入 completion、当前 review 与当前材料/结果消费断链；不是单纯 prompt 文案不够长。
- Logic: prompt/合同已多轮优化但问题复现 -> 根因在解析、执行、绑定、消费、完成判据 -> 优先修生产链 -> prompt 仅按具体漏检窄改。
- choice_reason/impact: 避免重复造审查框架和维护成本，同时保留异源审查质量。
- consequences_and_risks: 不做全量 prompt 重写；若 fixture 证明某 stage 仍有具体语义漏检，允许只修对应 review subject/validator。
- rejected_alternatives: 五阶段每次全量重审（成本高）；只查格式证据（质量低）；再次全面重写 wh-review（重复且未触及根因）。
- unresolved_items/owner: resolved / D-008；verify-code 保留专用 code-review closure。
- Supersedes: 任何把扩大 review prompt/packet 当本任务主线的候选。

### D-006

- question/final_option: 页面和展示范围；选择 A。
- recommendation/plain_language: 不建新 Web 页面，只让现有 Talk、status、stage result、close 输出讲清楚真实状态。
- decision: 用户界面范围仅包含 host Talk/确认卡与现有 public CLI/projection；展示 current task/stage、step/skill、四材料、stage quality、product release、physical delivery、可继续修复与不可宣称完成的区别。
- source_type/reference/exact_excerpt: Talk Round 2 用户原文：`3：A`。
- approval_binding: Talk Round 2 real reply；最终仍需 approve-decision。
- facts_and_constraints: 宪法禁止无真实 consumer 的重复控制面；当前已有 status/projection/close 输出消费者。
- Logic: 问题是已有状态被混读 -> 修现有投影即可 -> 新 Web 页面不增加核心价值。
- choice_reason/impact: 降低维护成本和用户误解。
- consequences_and_risks: CLI/host 文案必须来自同一派生事实，不能各自计算一套状态。
- rejected_alternatives: 新 Workboard/Web UI（额外 consumer 和维护）；只改内部不改展示（误读持续）。
- unresolved_items/owner: 精确字段名由 build-spec 决定。
- Supersedes: none。

### D-007

- question/final_option: 质量不完整时是否允许物理交付；选择 A，并要求质量问题在各 stage 末尾检查处理。
- recommendation/plain_language: 风险交付可以单独授权，但不能冒充任务完成；正常路径必须在每个 stage 当场闭合质量，close 只读汇总，不替前面补作业。
- decision: 保留独立不可逆授权；风险交付时派生展示 `delivery=completed`、`quality=incomplete`、`release=not_released`，顶层任务不得正常 completed。每个 stage 的现有 stage-end quality skill 必须真实执行、处理有效 finding 并进入该 stage 完成判据；close 只验证和展示当前事实，不首次发现本可在前一 stage 发现的缺口。`executeClosePlan()` 只能消费已认证的 immutable prepared plan；prepare 冻结 task-specific generated-output manifest；target dirty 按可证明的 task/owner 归属隔离，未知归属仍 fail-loud；cleanup 仅限该 manifest、当前 execution sidecar 和固定安全 allowlist。全部复用现有 close plan、operation fact 和 physical probe，不新增 partial-delivery FSM 或 recovery 命令。
- source_type/reference/exact_excerpt: Talk Round 2 用户原文：`4：A，质量应该由各个stage最后的spec-analyze技能进行检查和处理。不要到最后才发现质量不完整。`
- approval_binding: Talk Round 2 real reply；最终仍需 approve-decision。
- facts_and_constraints: 当前标准是前四个 authoring stage 用 `spec-analyze`，verify-code 用 `dsh-code-review` closure；用户已确认 verify-code 不叠加 spec-analyze。
- Logic: stage 自己最了解当前产物 -> stage-end 当场发现/修复成本最低 -> close 只做汇总和物理边界 -> 避免末端堆积质量债。
- choice_reason/impact: 解决“到 close 才发现缺证据/缺质量”的主要体验问题。
- consequences_and_risks: stage-end quality 不得变成开始修复的许可证；缺失时 stage 只保持 incomplete，同 task 仍能修复。
- rejected_alternatives: 质量不完整禁止所有物理交付（可能死锁）；Git 完成即任务完成（假绿）。
- unresolved_items/owner: resolved / D-008。
- Supersedes: close 首次承担全任务质量发现的旧体验。

### D-008

- question/final_option: verify-code 的 stage-end 质量机制；选择 A。
- recommendation/plain_language: 前四个 authoring stage 用 `spec-analyze`，verify-code 用专用代码审查闭环；五阶段都必须当场处理本阶段质量问题，但不强求同一个 skill 名称。
- decision: `make-decision/build-spec/build-plan/build-code` 的 stage-end `spec-analyze` 必须检查各自当前产物与原始需求、适用四材料、AC/任务/结果和当前证据的一致性；`verify-code` 保留 `dsh-code-review + 异源代码审查 + code-review closure`，不再叠加重复 spec-analyze。
- source_type/reference/exact_excerpt: Talk Round 3 用户原文：`A，请检查前四个阶段的spec-analyze是否正确的检查原始需求、四材料、AC 和结果一致性，有问题是否能在当前stage处理干净。`
- approval_binding: Talk Round 3 real reply；最终仍需 approve-decision。
- facts_and_constraints: 当前标准文档和 manifests 已按此前四/后一分工；真实缺口可能在 analyzer profile、生产 wiring、completion consumer 或 repair loop，而非 skill 名称。
- Logic: authoring artifacts 需要跨材料语义检查 -> 前四 stage 用 spec-analyze；代码风险需要真实实现审查 -> verify-code 用专用 closure；两者均进入当前 stage completion。
- choice_reason/impact: 避免重复检查和新维护面，同时不降低任何 stage 质量。
- consequences_and_risks: 若前四 profile 只检查结构或无法回写当前材料，必须在本任务修复；close 不能替代这些检查。
- rejected_alternatives: verify-code 叠加 spec-analyze（重复成本）；用 spec-analyze 替代代码审查（降低实现质量）。
- unresolved_items/owner: resolved as required change / G-005—G-010、D-009/D-010 与可复验验收合同；当前实现尚未满足，后续 stage 实现。
- Supersedes: D-005/D-007 中 verify-code stage-end 未决项。

### D-009

- question/final_option: 如何证明 `decision-log.md` 没漏掉真实原始需求；选择 A。
- recommendation/plain_language: 用宿主当前会话里的真实用户消息逐条核对 decision-log 的需求索引；不再新建一份“原始需求账本”。
- decision: host adapter 只读取 launcher 显式登记并绑定 session/task/stage/格式版本的 transcript，校验 realpath、消息顺序和内容 hash，再核对每条需求或方向变化都映射到 `decision-log.md` 的 requirement/decision/defer/reject 条目；runtime/spec-analyze 只消费窄验证投影。该短生命周期投影可包含 `axis_id/source_ids/category/impact/disposition/ask_ref/reply_ref/fact_ref/skip_reason/decision_ids/fr_ids/ac_ids`，但没有独立 writer 或持久账本。未登记、错绑、格式不支持、high/medium 轴仍 open、未提问却无事实来源/skip reason、或没有 D/FR/AC 落点时保持 `unknown/incomplete`；不得扫描私有 session 目录猜来源、复制 raw transcript、建立第五材料或把 portable skill 绑定到 Codex 私有路径。
- source_type/reference/exact_excerpt: Grill 用户原文：`A`。
- approval_binding: Grill real reply；最终仍需 approve-decision。
- facts_and_constraints: adapter 当前把 `original_requirement` 与 `decision_log` 指到同一文件，Stage Agent 自报列表不能独立证明全集；宪法禁止新增重复真相源。
- Logic: 真实消息是输入来源 -> decision-log 是编译后的当前真相 -> analyzer 比对二者 -> 不需要 raw ledger 或第二 writer。
- choice_reason/impact: 直接补上“原始需求全集”证据，同时维护成本最低。
- consequences_and_risks: transcript 不可读时只能如实标记需求覆盖无法认证并继续同 task 修复；不得凭 agent 自报改写为完整。
- rejected_alternatives: 新增全量消息 evidence DB（重复控制面和隐私/维护成本）；只信 Stage Agent 自报（无法防遗漏）。
- unresolved_items/owner: transcript 提取与 requirement mapping 的精确结构由 build-spec/build-plan 冻结。
- Supersedes: none。

### D-010

- question/final_option: `spec-analyze` 找到问题后，当前 stage 应如何处理；用户选择 B，并明确“解决问题，不要记录各种阻塞、卡顿”。
- recommendation/plain_language: analyzer 不是路障，而是当前阶段的修复清单；发现缺口就改当前材料或补当前事实，再重跑受影响检查，直到处理干净。
- decision: `material_incomplete`、`inconsistent`、旧材料绑定或缺真实结果触发同 stage repair loop；工作和编辑始终允许，不创建 blocked/reopen/recovery 状态。analyzer 指出的材料/一致性缺口必须在当前 stage 修复，或确认为带 owner/trigger/handoff/close condition 的完整 `deferred/not_applicable`；只有 current material revision 上的适用检查一致，才可派生该 stage `completed`。独立 review 的已认证 `actionable major|blocking` finding 可按宪法对具体 finding 做风险承担，但不得改写 reviewer/analyzer verdict 或制造 PASS。analyzer unavailable 也不阻止修复工作，但不能伪造成一致或正常完成。
- source_type/reference/exact_excerpt: Grill 用户原文：`B（按照workflowhub的宪法，有问题应该想办法处理，而不是阻塞任务的执行，spec-analyze找到问题应该想办法解决，不要记录各种阻塞、卡顿）`。
- approval_binding: Grill real reply；最终仍需 approve-decision。
- facts_and_constraints: 宪法 F3/F4/Q1/Q2 区分工作资格和质量完成；风险承担不能把质量事实改写成 pass。
- Logic: analyzer 找到问题 -> 当前 stage 直接修复 -> 材料变化使旧检查 stale -> 重跑受影响检查 -> current consistent 后完成；全程不需要阻塞状态。
- choice_reason/impact: 保持流程连续，又阻止“问题没解决但 stage 显示完成”。
- consequences_and_risks: 不再把 analyzer finding 只记成阻塞记录后甩给 close；对确实不能当场解决的方向问题回到真实 Talk，对合法延期必须写 owner/trigger/handoff/close condition。
- rejected_alternatives: analyzer inconsistency 直接风险放行并显示 completed（虚报质量）；analyzer 作为编辑准入 gate（违宪且造成死锁）；只记录 blocked 不修复（违背用户目标）。
- unresolved_items/owner: 修复循环的最大轮次不设人为 gate；只按材料或事实是否真实变化决定是否重跑。
- Supersedes: Grill 候选中“允许 accepted risk 直接覆盖 analyzer inconsistency”的字面解释。

### D-011

- question/final_option: 当前 vNext 四材料路径与历史 ADR 冲突如何处理；选择 A。
- recommendation/plain_language: 不改旧历史结论，新增一份很短的 vNext ADR 和术语说明，明确当前 runtime 认 worktree root 四材料。
- decision: 新增 ADR 0014 记录 vNext 当前材料权威；更新 `CONTEXT.md` 的规范决策日志/当前材料版本定义。ADR 0009 保留为其时代的历史决策，不作为 vNext 当前路径规范。
- source_type/reference/exact_excerpt: Grill 用户原文：`A`。
- approval_binding: Grill real reply；最终仍需 approve-decision。
- facts_and_constraints: 当前 runtime 从 worktree root 读取四材料；旧 ADR 0009 明写只认 `specs/<task>/decision-log.md`，二者不能同时作为当前规则。
- Logic: 历史 ADR 保持不可变 -> 新 ADR 显式 supersede 当前适用边界 -> CONTEXT 使用同一术语 -> 实现和文档不再各猜一套。
- choice_reason/impact: 最小文档改动解决权威冲突，并保留历史可追溯性。
- consequences_and_risks: 后续实现若改变 current material root，必须再做显式架构决策；不得加双读 compatibility bridge。
- rejected_alternatives: 重写旧 ADR（破坏历史）；保留冲突（继续制造错误实现）。
- unresolved_items/owner: none。
- Supersedes: ADR 0009 中关于当前 vNext material locator 的适用结论；不改其历史事实。

### D-012

- question/final_option: 本任务是否必须启动真实 WorkflowHub 会话并完成 Talk/Clarify 交互作为验收；选择 A，不启动真实会话，改用确定性合同、现有交互夹具和静态生产 wiring 验证。
- recommendation/plain_language: 这样只减少本次验收的外部依赖，不删生产能力；以后真实使用 WorkflowHub 时，Talk/Clarify 仍必须执行真实 `ask → wait → user reply → resume`，不能用脚本或默认值代答。
- decision: 将“真实 Talk/Clarify 回复”从本任务的证据必需项改为明确 coverage limit；其余可安全执行的生产 stage、stage outcome、四个前置 stage-end analyzer、review/status 消费和 close preflight/负例仍要走真实入口验收。真实 provider 可以按当前配置尝试，失败保留 unavailable；release 的不可逆动作和物理 close 没有单独授权时不执行。不得因为没有外部事实而伪造 released/completed，也不新增 gate、状态、控制面或延期产品需求。
- source_type/reference/exact_excerpt: 当前用户原文：`我不想启动真实的workflowhub会话并进行talk/clarify交互，请修改验收条件然后继续。只要你确定改好了就行，以后我使用workflowhub的时候能正常使用talk/clarify交互就可以，没必要再这里进行真实测试验收`。
- approval_binding: 当前用户直接修订验收边界；生产 Talk/Clarify 行为约束仍由 D-003、D-008、FR-INT-001—004、AC-002—003 约束。
- facts_and_constraints: 这是本次实现任务的证据边界变化，不是产品方向变化；四材料仍是唯一当前真相，质量事实仍不能充当工作许可证，缺失外部事实仍保持 unavailable/incomplete。
- Logic: 用户明确不需要真实 session dogfood -> 保留低维护成本的确定性行为合同 -> 不削弱生产生命周期验证 -> 不用外部 provider/close 事实冒充完成。
- choice_reason/impact: 缩短本次验收、避免外部 host/provider 不稳定，同时保留以后真实使用时 Talk/Clarify 必须正常工作的核心质量。
- consequences_and_risks: 本任务不能证明真实 Talk/Clarify 回复链和不可逆物理交付；provider 若真实尝试失败也必须保持 unavailable。生产 stage/analyzer/review/status/close preflight 的真实入口结果必须在 evidence 中单独记录，不能用确定性合同或测试绿替代；任何缺失仍不能写成 released/completed。
- rejected_alternatives: 为了验收强行启动真实会话（增加外部依赖和交互成本）；删除真实生命周期要求（降低生产质量）；新增 dogfood gate/状态（增加复杂度且违宪）。
- unresolved_items/owner: none；未来真实任务由 WorkflowHub host、stage runner 和 provider 按现有合同产生真实事实。
- Supersedes: D-002、MD-AC-002、AC-018、T010/T011 中“本任务必须启动真实 Talk/Clarify dogfood并完成不可逆物理 close”的证据要求；不改变 D-002 对历史失败模式确定性回归的要求、可安全生产入口验收要求，也不改变生产 Talk/Clarify 合同。

## 五阶段最小完成合同（研究结论）

- `make-decision`：`decision-log.md` 覆盖全部原始需求、三轮真实 Talk、必要 research、方向/细节建议、Grill、成功失败边界、非目标、延期、stage-end analyze、用户确认。
- `build-spec`：`spec.md` 把每条当前需求变成完整用户流程、页面/入口、数据状态、成功/失败/重试、FR/AC/oracle；`spec-clarify` 有歧义则真实问，无歧义则保留 trigger=false 理由；独立审查和 stage-end analyze 闭环。
- `build-plan`：`plan.md`、`tasks.md` 建立 requirement/decision → FR/AC → task → command/oracle/evidence/artifact 的可执行映射；依赖、真实测试路由、删除条件、审查、stage-end analyze 和用户确认闭环。
- `build-code`：当前 task 依赖满足后才能发布后置 task completed fact；RED/GREEN、真实入口、AC、snapshot、测试 receipt、finding disposition、最终 aggregate、integration review、stage-end analyze 闭环。依赖未满足仍允许编辑和修前置项。
- `verify-code`：读取四材料和当前实现；检查真实 consumer、生命周期、安全、失败边界、测试强度和原始需求遗漏；独立 code review、修复、当前快照 closure、handoff 和用户确认闭环。代码审查完成不等于产品 released。
- `close`：不是第六个 stage。只做现有事实的只读 preflight + 独立不可逆授权 + commit/archive/merge/push/cleanup 物理执行；输出同时显示 stage quality、product release、physical delivery，不能用一个 `completed` 覆盖三者。

## 可复验验收合同

### 决定到验收的独立映射

- `MD-AC-001` / D-001：五阶段和 close 的唯一职责、输入、产物、current outcome、下游消费和负向断言均被同一条标准流程验证；缺任一环不得 normal completed。
- `MD-AC-002` / D-002、D-012：T01、F13、KD 三个固定 fixture、一个简单全链路确定性合同回归和可安全生产入口验收满足本节 oracle，历史源 before/after hash 相同；真实 Talk/Clarify 交互不属于本任务必要证据，provider/物理不可逆交付的 coverage limit 必须保留。
- `MD-AC-003` / D-003：实现只复用现有四材料、session event、stage outcome、quality facts、completion/status/close；仓库扫描证明没有新增 dispatcher、第二 FSM、reopen/recovery 或第八类 public command。
- `MD-AC-004` / D-004：方向变化触发真实 Talk 与 make-decision 确认，更新同 task 当前决定；旧下游材料按 hash 自动 stale，不能继续发布 completed。
- `MD-AC-005` / D-005：review 通过同一正式入口绑定 current subject/material/snapshot；bundle smoke 与 direct CLI resolution 一致；只有 fixture 证明具体 semantic miss 时才允许窄改 prompt/validator。
- `MD-AC-006` / D-006：Talk、status、stage result、monitor、close 展示同一派生事实；不新增 Web 页面，所有消费者对 incomplete/not_released/delivery 的解释一致。
- `MD-AC-007` / D-007：每 stage 当场处理质量；risk delivery 只能改变 physical delivery，不能改变 stage quality、product release 或 task completion。
- `MD-AC-008` / D-008：前四 stage 的 spec-analyze 均消费适用原始需求/四材料/AC/真实结果并进入 completion；verify-code 只用专用 code-review closure，不叠加重复 analyzer。
- `MD-AC-009` / D-009：registered transcript 验证投影与 decision-log R 索引逐条一致；未登记/错绑/漏项得到 incomplete，且没有 raw transcript ledger 或 portable Codex 私有路径依赖。
- `MD-AC-010` / D-010：确定性 analyzer finding 在当前 stage 修复并重跑 current revision；过程中没有 blocked/reopen/recovery 记录，未修干净时没有 completed publication。
- `MD-AC-011` / D-011：五阶段、status、review、verify、close 全部只消费 worktree-root 四材料；ADR 0009 保持历史，运行时没有双读 compatibility bridge。

本阶段冻结上述行为、状态语义、失败边界和负向断言。build-spec 只能确定结构化字段/schema 并把每条映射成 FR/AC；build-plan 只能确定文件、命令、执行顺序和 evidence locator；两者不得重开产品方向或降低 oracle。

### 五阶段共同 evidence oracle

每个 stage 的正式 outcome 必须同时绑定：`task_id`、`stage`、当前 material revision/hash、适用的 `snapshot_tree`、manifest 声明的 steps/skills 及顺序、核心产物、stage-end 质量结果、finding disposition、适用的人类确认和 downstream handoff。证据必须能由 locator/hash 读回，不能只写自然语言“已执行”。

- 缺 step/skill、重复、乱序、错 step 证据、旧材料/快照、未登记 transcript、stage-end 未执行或 inconsistent、有效 finding 未处置：允许同 task 继续修，但该 stage 不得 completed。
- 结构、身份、绑定、hash 或 canonical write 错误：fail-loud，不能留下部分 publication。
- 合法 `skipped/not_applicable/deferred/unavailable` 必须有原因和适用的 owner、触发条件、交接与关闭条件；它们不自动等于 pass。
- 五阶段、status、review、verify、close 必须解析到认证 worktree root 的同一组四材料；历史路径只读，禁止双读兼容。

逐阶段附加 oracle：

- `make-decision`：R 索引覆盖 host 验证投影中的全部真实用户需求；三轮 Talk 与完整 Grill 有 ask/wait/reply/resume 绑定；方向和细节 advice 有当前材料 hash；用户最终确认真实存在。
- `build-spec`：每条 R/D 映射到用户流程、页面/入口、数据状态、失败边界、FR/AC/oracle 或完整 defer/reject；Clarify lifecycle 有真实触发或可验证 skip；stage-end analyzer 检查 decision/spec 内容一致性。
- `build-plan`：每条 FR/AC 映射到 plan phase 和 task；每张 task 有依赖、文件边界、RED/GREEN、command、oracle、evidence、STOP/rollback；深层 completeness validator 真实进入 production profile。
- `build-code`：每条适用 AC 有真实 command、exit、oracle、actual result、evidence hash 和 coverage limit；实现、测试、AC trace、integration review 绑定当前 snapshot；后置依赖未完成时不能发布 canonical completed/handoff。
- `verify-code`：代码 review、异源 review、finding 修复/具体风险承担、closure、handoff 和用户确认都绑定当前 snapshot；检查真实 consumer、生命周期、安全、失败边界和测试强度，而非只看文档/格式。

### Talk、Clarify 与 Grill oracle

- Talk 只属于 make-decision。每轮必须绑定 `card_id/round/prompt_hash` 与 ask/wait/reply/resume event ref；问题覆盖当时所有方向轴，用大白话说明选项、后果和风险，真实回复必须匹配选择。
- Clarify 只属于 build-spec。`trigger=false` 必须绑定当前 spec hash、零重大歧义事实和 skip 理由；`trigger=true` 必须有真实问题、回复和处置。方向、范围、页面/API/数据、成功失败或验收变化必须回写同 task 的 `decision-log.md` 和受影响材料，不能由 build-spec 静默吸收。
- Grill 必须有“全需求矩阵”，再包含必要专项；只检查某个 skill/profile 不算完成。当前任务以 G-001 至 G-016 为最小覆盖集合。

### 现有输出消费者 oracle

- Talk/确认卡：只显示用户需要理解和选择的内容；不泄漏内部编号或把系统状态当选项。
- `doctor`：当前 workflow/skill bundle、contract/hash、依赖或解析闭包不一致时 fail-loud；不能让 direct CLI 与 stage host 得出不同 resolution。
- `status`/监控投影：只读显示同一派生事实，至少区分 work progress、stage quality、product release、physical delivery 和当前可修问题。
- `run`：结构/身份/顺序/绑定/篡改错误必须非成功退出且不发布部分事实；真实 incomplete/unavailable 可以被记录并继续修复，但不得返回 completed stage result。
- `review`：绑定 current subject/material/snapshot；保留 provider attempt、原始 verdict、finding、处置和 unavailable，不能用空 findings 或 transport success 冒充质量通过。
- `verify`：消费当前四材料、实现和真实证据；旧 snapshot 的绿结果不得覆盖当前结果。
- `confirm`：只用于宪法规定的 make-decision/build-plan/verify-code 业务确认，必须绑定当前 subject，不推断用户回答。
- `authorize`/close：只授权明确列出的不可逆动作；授权不改变 stage quality 或 product release。

精确 JSON 字段名与数值 exit code 留给 build-spec/build-plan，但上述行为、区分和负向断言不得改变。

### 三个历史回归 fixture

每个 fixture 必须在 fixture manifest 固定 `task_root/source_snapshot/hash`、最小输入事实、执行命令、预期 exit/status、反向断言和 evidence path；运行时把固定快照复制到临时目录，历史源目录运行前后生成 SHA-256 manifest，必须 `before == after`。

- T01 fixture：质量未闭合时，即使 Git/physical close 已完成，也必须得到 `delivery=completed`、`quality=incomplete`、`release=not_released`、`task!=completed`；normal close 不得把物理结果汇总为产品完成。
- F13 fixture：前置 task/stage 未闭合时允许同 task 编辑和修复，但后置 canonical completed、正式 handoff 和 normal task completion 必须缺席；前置修复并产生 current outcome 后可正常继续，不创建 recovery/reopen。
- KD fixture：输入源为空、review unavailable 或产品结果 `not_released` 时，分别保留真实失败层级，不能生成 pass/空 findings/正常 completed；补齐当前输入和质量事实后只重跑受影响检查。

### 一个简单全链路确定性合同回归

回归固定使用隔离临时 Node CLI repo 的 `greet <name>` + `--caps` 夹具：正常 `greet Hugh --caps` 必须输出 `HELLO, HUGH!`，`--caps=maybe` 必须在 stderr 输出 `--caps does not take a value` 并以 exit `2` 失败；现有交互夹具必须证明 build-spec 的 Clarify 路径只接受真实 `ask → wait → reply → resume`，但本任务不启动真实 Talk/Clarify、不预填用户回复。阶段 outcome、三处确认、前四 analyzer、review、status、release 和 close preflight 使用真实入口及现有合同测试验证当前绑定与缺失语义；外部 provider、真实 release 和物理 close 未运行时明确记录 unavailable/not_released/not_run，不伪造成功。该回归不修改 WorkflowHub 公共命令，也不留下永久 harness。

### close 部分失败与重试

- normal close 只读消费五阶段 current completion、product release、当前 close plan、当前 Git 基线和逐项不可逆授权；不在 close 首次运行 analyzer/review，也不替前 stage 补材料。
- commit、archive、merge、push、cleanup 每项独立记录实际结果。任一步失败时保留已发生动作和剩余动作，顶层不汇总 completed。
- 重试只重做未完成且可安全幂等的动作；目标分支、remote、worktree 或 close plan 漂移时必须重做 preflight，原授权不自动覆盖变化后的目标。
- risk delivery 可使 physical delivery completed，但强制保持 quality incomplete、release not_released、task not completed；风险接受不得重写原始失败事实。

## 最小改动面（最终方向）

1. 修复现有 `wh-review` bundle/contract hash；stage doctor 在进入 review 前暴露 resolution 失败。
2. 将现有 stage outcome 纳入 `deriveStageCompletion`；声明 step/skill 缺失、重复、乱序、依赖未完成或 stage-end 缺失时只能 incomplete/unavailable。
3. 复用当前 Codex transcript + session event，接入已有 interaction lifecycle validator；不创建 per-round receipt 库。
4. build-spec 用现有 `spec-clarify` skill event 和当前 material hash证明 execute/skip；方向变化回写 `decision-log.md`，不建 revision 状态机。
5. 当前 task dependency 只约束 canonical completion publication，不禁止源码编辑和同任务修复。
6. review packet 增加当前 stage 语义主题、原始需求/AC、真实 consumer、失败边界和建议 oracle；finding 必须 disposition，unavailable 保持 unavailable。
7. close 复用现有 plan、facts、Git physical probes 和 immutable report；不建 persistent partial FSM，不加公共 recovery 命令。
8. 三个历史失败模式做 deterministic fixture；真实验收可安全的 stage/analyzer/review/status/close preflight；真实 Talk/Clarify 交互留给未来正常任务。

## grill

- 已开始；首次拟定范围错误地收窄为 spec-analyze 专项，用户当场纠正。
- 当前 Grill 强制覆盖完整矩阵：原始目标与成功判据、用户角色/完整旅程、五阶段唯一职责、Talk/Clarify/Grill、四材料、页面/输出、数据状态、stage-end 质量、异源审查、同 task 修复与 task 依赖、scope change、close、验收 fixtures/dogfood、复杂度、宪法、非目标、延期和下游 owner。
- spec-analyze 是其中一项，不再代表整个 Grill。

### 全需求 Grill 事实矩阵

| grill_id | 检查面 | 当前事实 | 结论/当前 stage 处理 |
| --- | --- | --- | --- |
| G-001 | 核心目标 | 用户要的是完整标准流程可靠执行，不是再次重写 review prompt。 | 保留全链路范围；production wiring、completion consumer、stage-local repair 是主线。 |
| G-002 | 完整用户旅程 | 标准文档有五阶段和 close 说明，但 runtime 允许缺/坏 stage outcome 后继续产生官方 stage result。 | 工作可继续符合宪法；正式 completion 必须消费 authenticated current stage outcome，不能只披露 diagnostic。 |
| G-003 | Talk/Clarify/Grill | 严格 lifecycle validator 存在；生产 handler 未强制三轮真实 Talk/Clarify reply。Grill 本轮也暴露了被专项带偏的问题。 | 复用 transcript/session event 做真实交互验证；Grill 必须检查全需求矩阵，不新增问答状态库。 |
| G-004 | 四材料 | runtime 当前通过 worktree root `decision-log.md/spec.md/plan.md/tasks.md` 消费；`docs/adr/0009-stage-content-authority.md` 仍写 root decision-log 永不消费、只认 `specs/<task>/`。 | 文档权威冲突；需用当前 vNext 规则更新 CONTEXT/新 ADR，旧 ADR 只保留历史来源，不让实现者猜路径。 |
| G-005 | make-decision spec-analyze | profile 要求 original requirement + decision-log，但 adapter 把二者都绑定成同一份 `decision-log.md`；`original_requirements` 数组由 Stage Agent 自报。 | 不能证明决策日志覆盖真实会话全部原始需求；需用当前 host transcript/source replay 校验 R 索引，不新增第五材料。 |
| G-006 | build-spec spec-analyze | profile 有 decision/spec/semantic coverage，但不强制解析完整 FR/AC、Clarify lifecycle、页面/状态/失败清单；可由一条宽泛 coverage 代表全部。 | 当前不足；需把 build-spec 的当前 spec 内容合同和 Clarify outcome接入同一 stage-end validation。 |
| G-007 | build-plan spec-analyze | 深度 `validateSpecAnalyzeCompleteness` 已能检查 FR/AC、task、oracle、DEFER/OPEN，但当前 stage profile 只调用通用 coverage validator，没有调用该深度检查。 | 文档声称已检查，生产未接线；复用现有深度函数，禁止再造第二 analyzer。 |
| G-008 | build-code spec-analyze | profile 要求 implementation/tests/ac-trace fresh refs，但不读取测试 exit、oracle、真实入口和用户结果语义；`actual_behavior` 仍由 Stage Agent 自报并用窄字符串规则匹配。 | 不能证明真实结果；需消费已有 structured test/AC/integration review facts，并检查 current snapshot。 |
| G-009 | spec-analyze 修复闭环 | inconsistent/material_incomplete 会显示 quality incomplete，允许同 task 修复；但 analyzer 不在 `STAGE_PREDICATES`，缺 stage outcome 也可能让 completion.status 由其他 predicates 得出 completed。 | 修复路径存在，完成消费断裂；修复后必须重跑受影响 analyzer，并以 current material revision 认证 consistent。 |
| G-010 | 定向运行证据 | baseline `aae9031a`/tree `c83b1537` 复跑：`spec-analyze-completeness` 36/36、`five-stage-spec-analyze-wiring` 12/12、`vnext-five-stage-current` 17/20；总计 65 pass/3 fail/exit 1/125.15s。3 个失败为错 step 证据、未执行 analyzer、unavailable guessed cost 均被 public run exit 0 接受。 | 真实 RED 已绑定 `quality/evidence/make-decision/research-baseline-20260820.md`；直接作为实现验收。 |
| G-011 | 独立审查 | direction review 3/3 reviewer terminal，能发现语义问题；但 portable bundle smoke 在 clean baseline 仍 hash mismatch，而 direct CLI 可绕过 stage bundle resolver。 | 根因是入口/解析闭包不一致；先统一 doctor/host preflight，再谈窄 prompt 漏检。 |
| G-012 | 同 task 修复与依赖 | 宪法允许同任务继续编辑；F13 证明 blocked 前置 task 后可出现后置源码/材料。 | 允许编辑，但后置 canonical completed fact、handoff、normal completion 必须拒绝；不建 progression gate。 |
| G-013 | 状态和页面 | 现有 status/projection 已能展示部分 stage facts，但 work ready、stage completion、quality、release、delivery 被不同路径计算。 | 只做一个派生器/一致投影，不新增 Web、持久状态机或 public command。 |
| G-014 | close | `core/task-close.mjs` 的 normal preflight 只读取 `STAGE_PREDICATES[verify-code]`；当前只有 `code_review`，没有前四 stage current completion、build-code AC/tests/integration、product release。 | close 只能证明当前代码 review + Git 物理动作；必须消费五阶段派生 completion 和产品发布事实，但保持独立风险授权。 |
| G-015 | 验收 | 现有测试覆盖结构，但基线已有 3 个相反 RED；历史任务失败尚未固化成当前 deterministic fixture。 | 原决定曾要求 T01/F13/KD + bundle smoke + 一个简单真实 dogfood；D-012 将真实 Talk/Clarify 交互移出本任务，保留可安全生产入口的真实验收和确定性全链路合同。 |
| G-016 | 复杂度与宪法 | 新 dispatcher、raw ledger、reopen/recovery、partial FSM、Web 页面都会增控制面或违宪。 | 只修改现有 validator、completion predicate、projection、close preflight、fixtures 和必要文档；每项写 owner/consumer/替代/删除条件。 |

### 前四 spec-analyze 当前判定

- 是否检查原始需求：**部分**。检查 Stage Agent 提供的 requirement list，但未证明它等于真实用户需求全集。
- 是否检查四材料：**材料字节和 hash 绑定较强；内容完整性不均衡**。build-plan 有深层函数但未接生产 profile；build-spec/build-code 仍可用宽泛 coverage 自证。
- 是否检查 AC：**不完整**。build-plan legacy deep validator 会解析 AC；当前四 stage profile 没有统一强制。build-code 只要求 `ac-trace` fresh ref，不验证每条 AC 的真实 oracle/result。
- 是否检查实际结果：**不完整**。build-code 未强制消费真实命令、exit、oracle、HTTP/浏览器/worker 等适用结果语义。
- 有问题能否在当前 stage 处理：**允许修复，但未保证处理干净后才 completed**。原因是 analyzer inconsistent 只降低 `quality_status`，没有进入 `deriveStageCompletion`；缺/坏 outcome 仍可能走 public run。

### Grill 后最小修正方向

1. 真实用户消息只作为 host 验证来源；`decision-log.md` 继续是唯一需求当前材料，不新增 raw-requirement ledger。
2. 把现有 stage profile 与已有深度 content validator 合并调用：不同 stage 只启用适用规则，不复制四套实现。
3. spec-analyze finding 进入当前 stage 修复循环，不产生 blocked/reopen/recovery；consistent/current 是 authoring stage 的完成条件，不是继续编辑或修复的许可证。
4. 当前 stage 修复材料后，旧 analyzer 因 material revision 变化自动 stale；只重跑受影响检查，直至问题修复或形成完整、合宪的延期/不适用处置。
5. close 消费五阶段 current completion 的派生结果，不重新执行 analyzer/review，也不建设 close 质量引擎。
6. 统一 portable bundle smoke、direct review CLI 和 stage host preflight 的 skill resolution 结果。

### Grill 用户选择与收口

- 原始需求来源：A。host transcript 校验 decision-log 的需求覆盖，不新增第五材料或 raw ledger。
- 当前 stage 问题处理：B。analyzer 输出直接驱动同 stage 修复；不中断同 task 工作，不积累“阻塞记录”，也不允许未处理问题冒充 stage completed。
- 文档权威冲突：A。新增 vNext ADR 并更新 CONTEXT；旧 ADR 保持历史原貌。
- 全需求矩阵 G-001 至 G-016 已逐项检查；spec-analyze 只是其中一项。当前未发现需要再交给 build-spec 猜测的产品方向问题。

## 审查处置

### Direction advice 事实

- 首次调用在 provider 前返回 `MATERIAL_INCOMPLETE`：`direction_selection.current_selection is required for the reveal challenge`；输入修正后只发起一次正式 broker group，不做 provider retry/fallback。
- 正式 attempt：`quality/reviews/attempts/798d598f-5521-483a-8168-70f1608374af/attempt.json`。
- 结果：`available`；`pi/coding`、`antigravity/flash`、`codex/luna` 三个异源 profile 全部 completed；5 条 valid actionable major，2 条 invalid-anchor major。

| finding_id | 原始事实/来源 | 后果 | status | next_action/evidence_ref | owner/consumer/retain_or_delete |
| --- | --- | --- | --- | --- | --- |
| F-1ed3a00b3e59 | completed/close 未明确 stage、quality、release、delivery 权威边界。 | close 混读可能复现。 | fixed_in_decision | D-003/D-007：work progress、stage completion、product release、physical delivery 分离；close 只读汇总。 | completion predicate/status/close；保留 finding |
| F-4f18aa90710a | 同 task 修复未限定 current subject 和依赖边界。 | F13 式越级可能被误写完成。 | fixed_in_decision | 同 task 可编辑；只有 current subject/前置 task 可发布 completed；跨 task 依赖显式显示，不能把依赖任务结果写成本 task 完成。 | stage outcome/task fact publisher；保留 finding |
| F-51d900a46223 | “缺 skill 不得 completed”被理解为 runtime 直接执行 skill。 | 若新增 dispatcher 会违反架构并增复杂度。 | fixed_wording | runtime 不执行 skill；它只认证 host 当前 session 上报的 declared skill outcome。缺的是 authenticated outcome，不是中央调度。 | stage outcome validator；保留 finding |
| F-64828c576db3 | 方向包未把 T01/F13/KD、bundle mismatch、dogfood 写成可判定验收。 | 无法证明不降质量。 | fixed_in_decision | D-002 + 最小改动面 1/8；成功/失败 oracle 在本阶段明确，命令和 fixture 字段由 spec/plan 落地。 | build-spec/build-plan/test consumer；保留 finding |
| F-99443dde4472 | 方向包未逐项交付用户流程、页面、数据状态、成功失败、非目标、延期。 | 材料存在可能再次冒充需求覆盖。 | fixed_in_decision | 本文件“最终用户、角色与完整流程”、页面、数据状态、成功失败、非目标和可复验验收合同已冻结；stage-end 必须逐项检查。 | make-decision/spec-analyze；保留 finding |
| F-bb2c352dd8fd | verify-code 是否叠加 spec-analyze 未决。 | 真实方向问题，但 provider anchor 无效。 | rejected_invalid_anchor / question_retained | 不采纳其证据裁决；问题本身来自用户新要求，交给 Talk Round 3。 | user/Talk Round 3；保留原始 invalid fact |
| F-fc908ef532c6 | 与 F-99443dde4472 同类的用户范围遗漏。 | 重复提醒。 | rejected_invalid_anchor / covered_by_valid_finding | 不用 invalid anchor 支撑结论；按有效 F-99443dde4472 修复。 | make-decision；保留原始 invalid fact |

### Direction advice 后修正

- 唯一 stage 完成依据：当前 task/material/snapshot 绑定的 authenticated stage outcome，加该 stage 既有质量 predicates；四材料存在只表示可继续工作。
- skill 完成语义：Stage Agent 在当前会话真实执行，runtime 认证 host event；不新增中央 dispatcher。
- 同 task 修复边界：允许改当前材料和源码；前置 stage/task 未闭合时，后置源码可以存在，但后置 canonical completed fact、正式 handoff、normal task completion 均不可写成成功。
- 投影边界：`work_progress`、`stage_quality`、`product_release`、`physical_delivery` 四个派生视角；不新增四套持久状态。
- 验收边界：T01/F13/KD 固化为 deterministic fixture；bundle smoke 必须绿；本任务真实执行可安全的 stage/analyzer/review/status/close-preflight 入口；真实 Talk/Clarify 只由确定性生命周期合同验证，不启动交互；commit、merge、push、archive、cleanup 不经单独授权不执行。任何 `unknown/unavailable/incomplete/not_released` 不得被汇总为正常 completed。

### Detail advice 事实与处置

- 正式 attempt：`quality/reviews/attempts/b95e794f-7c40-4fcc-b419-365faeb35a9c/attempt.json`。
- 当前冻结 snapshot：`6840cd6a767bd4a5cfddaba4d5d1d29c3e9bbe0c`；material id：`b430dd3541742fff88b8919ecfca18f33e4452c63e17f2af1e34dec12ecf2170`。
- 结果：`available`；`pi/coding`、`antigravity/flash`、`codex/luna` 3/3 terminal；4 条 actionable major、1 条 nonblocking minor。修改后的 decision-log 不自动覆盖这份 immutable review，也不为追求空 findings 重审。

- `F-9857bedc2627` fixed：新增 current research evidence，绑定 baseline commit/tree、关键源码 hash、bundle smoke、65/3 定向测试、T01/F13/KD task root 和 selected-record snapshot hash；fixture 的 full immutable manifest 仍由 build-plan 生成，但不能改变已冻结 oracle。
- `F-b576ff410352` fixed：新增“四个派生视角”，明确唯一生产者、消费事实、完成条件和冲突优先级；close 只读消费，不新增 FSM。
- `F-c95310b6bd4b` fixed：完整用户流程新增方向变化后的真实 Talk、decision-log 更新、make-decision 确认、hash-stale 和当前 stage 重跑；只暂停 publication，不记录 blocked/reopen/recovery。
- `F-3beff2d51aec` fixed：新增 `MD-AC-001` 至 `MD-AC-011` 独立映射，并明确 make-decision 冻结行为语义、build-spec 只做 FR/AC/schema、build-plan 只落实文件/命令/evidence locator。
- `F-beedc60bed4e` clarified / no direction defect：detail-advice 按 manifest 固定发生在 `approve-decision` 前，输入字段名 `approved_direction` 表示三轮 Talk 已选择的方向，不表示整份 decision 已最终批准。采纳其风险提醒：当前状态保持 pending/incomplete，禁止 publish 和下游消费；只有本轮 stage-end analyze 完成并取得用户真实最终确认后才可 approved。

### Stage-end spec-analyze

- 输入：`quality/evidence/make-decision/spec-analyze-input.json`；当前 revision 必须显式列出 R-001 至 R-014、D-012、D-013、每条 expected/actual behavior、场景、oracle、decision-log 和当前 stage 修复。
- 旧 profile validator 结果：`consistent`，12/12 requirements covered，0 errors，0 findings；该结果只属于 D-012 之前的 revision，不能消费为当前完成证据。当前 revision 需要重新产生 R-001..R-014、D-012、D-013 的 stage-end spec-analyze evidence。
- 已在当前 stage 完成 6 类修复：全需求 Grill、registered transcript/ADR、fixture/dogfood/逐 stage oracle、四派生视角、方向变化流程、detail findings 与 D-to-AC 映射。
- 覆盖限制：baseline profile 仍由 Stage Agent 提供 requirement list，尚不能独立证明它等于 registered transcript 全集；这正是 D-009/MD-AC-009 的实现目标。旧 revision 只人工核对 R-001 至 R-012，未把 R-013、R-014、D-012 或 D-013 的新边界伪装成已经完成；当前修复后必须由同一 stage-end profile 重新核对。
- 当前剩余的是实现风险而非需求未决：bundle smoke 1 个 RED、vNext 定向测试 3 个 RED、前四 profile/completion/close 生产断链；它们全部已有明确 owner、consumer 和验收 oracle，不能由 build-spec 改写或延期。

## 最终确认

- 状态：approved
- 用户原文与 host-visible 绑定：用户在三轮 Talk、Grill、detail advice 和 stage-end spec-analyze 完成后明确回复：`批准，继续吧`。
- 批准范围：原始批准范围为 R-001—R-013、D-001—D-011、五阶段合同、可复验验收合同、非目标、风险延期和 rejected alternatives；D-012 是用户后续对本任务验收边界的直接修订，不新增产品方向；R-014/D-013 是用户随后对 manual-close 物理动作的直接修订。
- 下游边界：build-spec 只能把本决定结构化为完整 FR/AC、场景和产品状态；不得重新发明方向、降低 oracle 或把实现细节写回产品决定。

## 拒绝方案

- 拒绝中央 dispatcher、第二 FSM、raw requirement ledger、reopen/recovery/successor、持久 partial-delivery 状态机和新增 Web 控制面：均增加重复权威或违反宪法。
- 拒绝再次全面重写 wh-review prompt/合同：当前已证实的根因优先在 bundle resolution、current binding、validator、completion consumer 和 close preflight。
- 拒绝 analyzer 作为工作准入 gate，也拒绝 analyzer inconsistent 直接风险放行成 stage completed：前者会锁死修复，后者会假绿。
- 拒绝由 build-spec/build-code 静默补产品方向：方向变化必须回写同 task 当前决定和受影响材料。

## 风险与延期交接

| risk/deferred_id | 风险或延期内容 | 触发/后果 | 处理阶段/owner |
| --- | --- | --- | --- |
| RISK-001 | 当前主 worktree 有其他任务未提交改动。 | 误混入会污染本任务基线。 | 已隔离到独立 worktree；close 前重新核对 |
| RISK-002 | 当前 checkout 曾出现 `wh-review` bundle hash mismatch。 | 可能使独立建议 unavailable；不能伪造 pass。 | research/direction-advice 时在任务 worktree 复核 |
| RESOLVED-006 | 原延期：精确 schema、字段名、命令参数和代码模块。 | build-spec/build-plan 已确认复用现有 schema/outcome，精确文件和命令见当前 plan/tasks。 | resolved / D-003,D-011；不新增 schema 或控制面 |
| DEFER-002 | 真实 host 卡片的初始焦点、键盘顺序和错误焦点恢复。 | 当前仓库没有 renderer/focus hook，伪造本地 UI 会违反 F10。 | Codex host UI owner；触发、handoff、close condition 见 spec/plan/tasks |

## 质量边界

- 质量事实：必须来自当前 task、当前材料、当前源码和真实执行；旧事实只作历史输入。
- 推进资格：review/test/evidence 不提供推进许可证；同 task 可继续修复，但不能宣称阶段完成。
- 完成判据：真实三轮 Talk、必要研究、Grill、方向与细节建议、stage-end 分析、用户确认全部存在且语义完整。
- 不可逆授权边界：本阶段不 commit/merge/push/archive/cleanup；这些必须在最终 close 单独授权。

## 未决项

| item_id | 未决内容 | 原因 | 谁在何时解决 |
| --- | --- | --- | --- |
| RESOLVED-001 | 优先保证哪一种最终结果。 | 已选择完整标准流程。 | resolved / D-001 |
| RESOLVED-002 | 采用多强的回归验收。 | 原决定曾选择历史 fixture + 一个简单完整 dogfood；D-012 将真实 Talk/Clarify 交互留给未来真实使用，同时要求本任务完成历史 fixture、确定性全链路合同和可安全生产入口验收。 | resolved / D-002,D-012 |
| RESOLVED-003 | 是否存在必须纳入的 Web/Workboard 页面消费者。 | 已选择不新增 Web，只复用现有 host/CLI/projection。 | resolved / D-006 |
| RESOLVED-004 | 全链路一次实现还是按边界切片。 | 全链路合同在同 task 交付；build-plan 按低耦合顺序切片，不延期核心链路。 | resolved / D-001/D-003 |
| RESOLVED-005 | verify-code 是否额外运行 spec-analyze。 | 已选择不叠加；保留专用 code-review closure。 | resolved / D-008 |

## Supersedes

- ADR 0014 取代 ADR 0009 中关于 vNext 当前 material locator 的适用结论；ADR 0009 原文只读保留。
- 取代任何把 analyzer/review finding 建模成 blocked/reopen/recovery 工作许可的候选方案；保留真实 incomplete/unavailable 质量事实。

## 文档结果

- CONTEXT.md：updated；明确工作继续、阶段完成、当前阶段质量修复和 vNext 当前材料权威。
- ADR：created；`docs/adr/0014-vnext-current-material-authority-and-stage-local-repair.md` 记录当前材料路径与 stage-local repair/completion 边界。
- 不复制 spec 的边界：本文件冻结用户结果、方向、状态语义和失败边界；字段序列化、详细接口和测试步骤留给后续阶段。

## Exit checks

- 上下文一致：completed；CONTEXT、ADR、当前 runtime 路径和四材料术语已对齐。
- owner/接口一致：completed at decision level；host 执行 skill，runtime 认证/派生，reviewer 给建议，close 做物理动作。
- 失败语义明确：completed；可继续未完成、fail-loud、风险交付和正常成功已分开。
- 范围与延期明确：completed；核心链路不延期，只有精确 schema/模块/命令留给 spec/plan。

### D-013：manual-close 必须执行物理 close

- **用户原始修正**：`manual-close当然要执行物理close动作，否则为什么叫close呢？请设计方案，修改manual-close动作！`
- **source_id**：R-014
- **决定**：`manual-close` 不再是只写一条“带风险已交付”记录的快捷路径；它必须执行已经 prepare、confirm、authorize 的同一份六步 delivery close plan，真实完成 commit、archive、merge、push、worktree cleanup、branch cleanup，并按现有逐步 operation facts 支持安全重试。
- **风险边界**：风险接受只放宽质量事实/product release 的 normal-close 前置，不放宽当前 task/snapshot/Git 目标校验，也不替代 commit、archive、merge、push、cleanup 的独立授权。物理交付完成后仍写 `manual-risk-close.v1`，不写 `task-close-completed.v1`；`stage_quality`、`product_release` 和顶层任务完成语义不被改写。
- **用户流程**：先用 `prepare --risk-close=true --risk-reason=...` 固化风险选择，再走现有 close confirmation 和五类独立 authorize，最后执行 `manual-close --plan-hash=... --confirmation-ref=...`。普通 `execute`/`complete` 拒绝消费 risk plan，避免命令语义混淆。
- **实现约束**：复用 `prepareDeliveryClosePlan()`、`executeClosePlan()`、现有 delivery executor、operation facts、cleanup allowlist 和同一 task store；不新增 public runtime behavior、schema、store、FSM、recovery 命令，也不新增 producer-to-close 集成测试。
- **交付验收**：新增一个最小临时 Git/bare remote close fixture，证明未授权零物理写、授权后真实六步动作完成、风险证据可读、normal completion 不生成、重复执行只消费既有事实。

## Step lifecycle

- `load-context`：已加载当前原始需求、五个关联会话、上轮深审报告、标准 make-decision 包与依赖 skill；未把历史结论当用户选择。
- `triage-scope`：已形成用户流程、页面、数据状态、成功/失败、非目标和延期初稿；方向项保持未决。
- `talk-round-1`：真实 ask → wait → reply → resume 已完成；用户选择完整标准流程和历史回归 + 一个简单 dogfood，并新增宪法、低复杂度、不降质量三条硬约束。
- `research-inputs`：源码、宪法、五阶段和三个历史任务研究完成；5 个新子代理因额度 unavailable；clean baseline 复现 wh-review bundle hash mismatch。
- `talk-round-2`：真实 ask → wait → reply → resume 已完成；冻结同 task scope revision、stage 专项语义审查、无新 Web、风险交付分层展示，并要求质量在每 stage 末尾处理。
- `direction-advice`：3 个异源 reviewer 全部 terminal；5 条有效 major 已修正，2 条 invalid-anchor 保留并处置。
- `talk-round-3`：真实 ask → wait → reply → resume 已完成；选择前四阶段 spec-analyze、verify-code 专用代码审查，并要求深查前四 profile 的真实覆盖和当前 stage 修复能力。
- `grill-with-docs`：已完成；用户纠正“只查 spec-analyze”的范围错误后，已对 G-001 至 G-016 全需求压力测试，并以 A/B/A 收口 transcript 验证、同 stage 修复循环和 vNext ADR。
- `write-decision-draft`：已完成；形成 R/D/F、完整用户流程、页面/状态、五阶段合同、可复验 oracle、非目标、风险延期和 rejected alternatives。
- `detail-advice`：已完成；3/3 reviewer terminal，4 条 major 与 1 条 minor 已在当前 stage 逐项处置。
- `stage-end-spec-analyze`：旧 revision 已完成 12/12 covered、0 finding，并明确 baseline transcript 独立认证尚是待实现能力而非已实现事实；D-012、D-013 和本次材料修订后，该旧 packet 失效，当前 revision 需重新产生 R-001..R-014、D-012、D-013 的 stage-end evidence。
- `approve-decision`：已完成；用户真实回复 `批准，继续吧`，批准当前完整 decision。

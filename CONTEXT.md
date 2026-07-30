# CONTEXT — workflowhub 术语表

> 本项目自己的领域术语表骨架，统一术语避免后续设计漂移。
> 随项目演进逐步补充；不照搬其它项目的特有术语，只列本项目自己的概念。

## 五个正式阶段

**make-decision**：
第一阶段。收敛方向、范围和风险，产出 accepted decision。概念别名：需求确认（intake）。

**build-spec**：
第二阶段。把“做什么、怎么验收”写成 accepted spec。概念别名：设计（design）。

**build-plan**：
第三阶段。把 accepted spec 拆成可执行 plan 与 tasks。概念别名：计划（plan）。

**build-code**：
第四阶段。逐项实现，配套测试与独立审查。概念别名：实现（apply）。

**verify-code**：
第五阶段。独立验证交付是否达标。概念别名：验收（test-acceptance）。

## 核心概念术语

**工作流（workflow）**：
由多个阶段技能组成的一条完整开发流程。一个工作流对应一个文件夹。

**技能（skill）**：
完成某一阶段或某一横切能力的独立单元，可独立调用、可搬运。一个阶段对应一个技能。

**四阶梯判断（four-tier judgment）**：
spec-plan 动手写代码前的复用检查，依次问四步：①需要存在？（真需要才做，不需要就跳过）②已有覆盖？（仓库/依赖里已有能直接用的）③复用？（现成的改一改能不能凑合用）④最小新增（前三条都不行才写，且只写刚好够用的）。源自 ponytail 七阶梯 YAGNI 法的压缩版；第4条的写法纪律由 simplicity-guard 技能约束（先想后写/最小代码/手术式修改）。

**设计宪法（constitution）**：
本项目的设计原则集合，是所有设计与实现的对照基准。

**执行记录（execution record）**：
统一外置记录进度、指标与回溯信息的产物。

**每次调用身份（per-invocation identity）**：
正式入口在一次 run 开始前，对调用方显式提供的 WorkflowHub Git 顶层做认证后写入的
create-only 记录。它绑定 task、stage、run、干净的已提交来源、合同内容校验值和能力，
不把绝对 runner 路径写入任务清单，也不产生质量结论。

**per_invocation / legacy_pinned**：
`per_invocation` 是新任务的执行模式，每次调用独立认证当前 WorkflowHub。没有
`execution_mode` 的旧任务按 `legacy_pinned` 解释：原 runner 字段只用于读取既有证据，
必须通过一次受控迁移才能由新入口继续写入，不能因缺字段被静默当成新模式。

**异源审查（cross-source review）**：
由独立来源、在独立上下文中对交付物做的审查，用于质量把关，禁止自审自判；证据充分的严重问题默认暂停，用户看完问题、证据和影响后，可明确承担风险继续。

**需求保真链（requirement-fidelity chain）**：
从权威 source，经 immutable requirement ID、decision、artifact，到 acceptance criteria 的可复算链路。任何 accepted requirement 缺少其中一环都不能算 covered。

**expected topology / observed facts authority**：
stage manifest 定义应执行的 step 集合（expected topology）；journal 与 receipt 记录实际发生的执行事实（observed facts）。两者职责不同，audit 必须对比二者，不能互相替代。

**audit 单一真相源（single source of truth）**：
audit aggregator 负责计算 canonical verdict；stage-result 只携带其摘要，validator 只验证一致性，facts assembly 只装配事实，不另算第二套 audit 结论。

**交互完成记录（interaction completion record）**：
绑定 make-decision 三轮对话与完整 grill 执行事实的正式记录；长期保存格式检查结果、用户选择和内容校验值，不保存完整问题卡，也不证明用户身份。

**歧义台账（ambiguity ledger）**：
记录每项重大歧义、当前状态和关闭依据的正式记录；仍有重大歧义未关闭时，build-spec 不得宣称 clarify 完成。

**规范决策日志（canonical decision-log）**：
make-decision 的完整决策记录；逐题保存问题、最终选择、推荐理由、后果、风险和大白话说明，下游只通过 accepted make-decision facts 中的 `decision_ref` 定位当前版本。

**运行事实**：
可由已登记机器来源直接证明的一条任务执行信息；没有来源或证据时只记录状态，不补造数值。

**运行事实第二版**：
在不改变既有 v1 的前提下，补充运行成本、归属、审查、验证、阶段对照和自动化信息的独立事实合同。

**事实归属（fact attribution）**：
用可公开回指的记录标识说明一条事实属于哪个技能、会话或执行单元，不保存原始正文、私有路径或缓存。

**阶段对照事实（stage reconciliation fact）**：
把阶段清单中的应有步骤与 journal/receipt 中的实际结果逐项对照，区分已跳过和完全缺记录。

**自动化率分母（automation denominator）**：
同一范围内全部可核实的执行或派发记录；分母缺失时自动化率也必须标为缺失，而不是零。

**已登记来源（registered source）**：
由受控 launcher 明确登记格式、版本和读取权限的事实来源；它是采集成本、会话归属和自动化信息的唯一入口。

**缺失（missing）**：
契约要求的来源或对象没有登记、或已登记后读取时找不到。

**未知（unknown）**：
来源不可读、格式不支持、内容损坏或互相冲突，因而不能可靠判断。

**跳步事实（skip fact）**：
正式执行记录中标为跳过并带有原因的步骤结果；它不是成功，也不由采集器推测。

## 恢复术语

**恢复代次（recovery generation）**：
同一任务为恢复可认证执行而追加的一份记录，始终保留其前一份记录。

runner replacement generation 只属于 `legacy_pinned` 历史兼容。`per_invocation` 任务的正常
WorkflowHub 升级不创建 recovery generation；Phase pointer 等业务状态恢复仍使用恢复代次。

**阶段恢复 run（stage recovery run）**：
同一任务为恢复中断或已失效的正式阶段而追加的新的 stage run。它只引用旧 run 作为
`recovery_source_ref/hash`，不继承旧 run 的 invocation、完成或 accepted 事实；新 run 必须
在当前已认证、干净工作树的完整 HEAD 上重新产生自己的事实。它不是新的任务、不是重开
许可，也不改写旧 run。

**恢复来源（recovery source）**：
被新阶段恢复 run 引用的最近历史 run。有效 invalidation 使旧 run 不能继续作为 active run，
但仍可作为下一次恢复的只读来源；同一未失效恢复 run 不能被重复消费。make-decision 的
活动恢复 run 后续命令与方向/详情审查使用同一已认证 recovery workspace；普通 `prepare`
和已接受 run 仍使用原有严格工作区规则。

**当前材料版本（current material revision）**：
同一任务的 `decision-log.md`、`spec.md`、`plan.md`、`tasks.md` 当前可读版本及其追加的
变更来源。旧版本、hash 和 checkpoint 保留为历史；它们不阻止当前材料继续开发或验证。

**当前 requirements 指针（current requirements pointer）**：
指向同一任务最新 requirements ledger 与 coverage 的受控选择记录。requirement ID、每代
ledger/coverage 字节和 lineage 不可变；pointer 可在 append-only revision 后更新。复用
当前 ledger 前必须同时核验 ledger 与 coverage 的 ref、hash 和实际内容，不能用指针本身
冒充覆盖事实。

**恢复门禁（recovery gate）**：
恢复前按恢复目标一次性核验任务身份、来源、收据和工作树，任一不符即拒绝且不影响其他目标。

**当前 Phase 结果（current Phase result）**：
某个工作树当前可继续使用的最新正式 Phase 结果；旧结果仍是历史，不会被覆盖。

**consumer/evidence matrix**：
跨 stage 复用盘点表。以真实消费者、重复度、typed I/O、失败/skip/human gate 语义为证据，决定正文应成为 skill、reference、component、contract，或保留在 stage。

**调用方可见对话面（caller-visible conversation surface）**：
调用方向用户展示问题、进度和结果，并把回答交回阶段执行者的交互边界。

**决策卡（decision card）**：
一次只承载一个决策轴，用大白话说明问题、影响、推荐项、互斥选项及各自含义、后果和风险，不展示内部编号或记录术语；题号分母表示本轮当前预计总问题数，不能机械跟随分子增长。

**用户完成卡（user completion card）**：
阶段结束时面向用户说明目标、方案、效果、验证边界、风险和下一步的简短消息；不承载内部引用、provider 流水或正式审计明细。

**下游交接（downstream handoff）**：
供后续阶段读取的正式产物、证据、依赖、未决风险和下一责任人；它是 canonical record，不由用户消息副本替代。

**阶段协调 / Phase 执行（Stage coordination / Phase execution）**：
同一 `build-code` 合同中可组合的两部分，前者管理顺序和阶段边界，后者完成一个 Phase 的实现、测试、证据和审查闭环。

**Phase Card**：
阶段协调者交给 Phase 执行者的冻结事实集合，只含认证身份、目标、验收、工作区、允许范围、测试和上游 finding，不复制流程规则。

**组件所有权（component ownership）**：
一个组件在一个阶段中唯一归属于阶段执行或审查执行的责任边界。

**3rd-review**：
全局通用的纯异源审查引擎（skill）。接口输入 `{mode, contract, materials}`，做环境探测、派审查 agent，返回 `{verdict, findings, actual_mode}`。不含任何 stage 或轮次知识，可跨项目复用。2026-07-05 重设计决策（ADR 0001）后，3rd-review 瘦身为纯引擎层，原来挂在其下的 workflowhub 专属知识迁移到 wh-review。

**wh-review**：
workflowhub 专属的审查编排层（skill，新建于 ADR 0001，2026-07-05）。承接原来分散在 3rd-review 下的 workflowhub 专属知识：五个 stage 的正式审查，以及按需调用的独立诊断合同；build-spec、build-plan、verify-code 的正常修复不做小型二审，build-code 对每个 Phase 记录完整审查质量事实，仅对已认证的 actionable `major|blocking` finding 要求修复或显式风险接受，不把 provider verdict 当 stage pass gate。wh-review 在内部调用 3rd-review 完成实际异源派发，对需要审查的 stage executor 暴露统一入口；3rd-review 只负责派发，不解释 WorkflowHub 的 stage 语义。

**审查路径（review route）**：
某个工作阶段的一种审查类型及其模型调用顺序。“当前审查路径”只指本次任务正在执行的“阶段 + 审查类型”；其他已经配置但本次没有使用的路径属于非当前路径。当前路径配置错误时停止；非当前路径配置错误时明确告警，但不阻断当前任务。

**审查执行结果（review attempt outcome）**：
一次模型调用是否产生了可用审查结果。统一分类为：完成、输出格式错误、模型不可用、超时、同源排除、取消和未知。外部系统返回的原始错误码必须原样保留；分类只用于汇总，不能覆盖原始事实。没有产生可用审查结果时，不生成审查发现，也不进入模型质量统计。

**审查发现结果（review finding outcome）**：
只描述可用审查结果里发现的问题，例如有效问题、证据位置无效、需要其他来源佐证或非阻断小问题。它与审查执行结果是两层事实：模型调用失败不能被记成“没有发现问题”，发现证据无效也不能反过来改写模型调用状态。

**审查材料地图（review material map）**：
每个 stage 明确列出的最小充分审查材料及其锚点、未知项和不适用项；它是 reviewer 的导航和可核查边界，不是把整个项目或原始日志重新投递给 provider。

**Phase 审查（phase review）**：
对单个 build-code Phase 的完整、冻结 diff 审查；`pass` 与 `revise_required` 原样保留为质量事实，不决定结构性阶段放行，不因材料优化降低代码、测试、简单性或鲁棒性检查强度。

**集成审查（integration review）**：
build-code 结束时对最终快照的跨 Phase 交互审查。它读取连续的正式 Phase 审查覆盖链、跨 Phase seam 索引、每个 seam 的最终锚点或显式未知/不适用项，以及 AC 到改动和测试/证据的追踪；它不重新投递历史完整 diff，也不把 review verdict 改写成 stage pass。

**AC 证据摘要（AC evidence summary）**：
逐条 AC 的可读验收视图，记录结果、场景、判定标准、实际结果、证据引用/hash 和覆盖边界；它来自已认证证据，不包含原始日志。

## verify-code 深化术语（m13e）

**查痕（trace-check）**：
verify-code 新增步骤，位于 test-strategy 之后、L3 之前。扫描 evidence/ 目录下各 phase 已产出的报告，核对是否存在、exit_code=0、以及是否通过 git_sha/content_hash 交叉验证（与 P0-3 freshness 校验同一套交叉验证逻辑，不单独只看 mtime）。缺口写入 `trace-check-report.json`，并把没有证据覆盖的验收标准写入 `missing_ac_coverage[]`。

**phase-report**：
verify-code 各阶段（RED/GREEN/L2/L3 等）各自产出的阶段性报告文件（如 `l2-report.json`、`l3-e2e-report.json`），是查痕步骤读取比对的对象。

**AC（验收标准 / acceptance criteria）**：
沿用既有定义，指 spec 文档里列出的验收标准条目（见 verify-code/SKILL.md）。`missing_ac_coverage[]` 记录哪些 AC 条目在已产出的 phase-report 里找不到对应证据。

## 组件 skill

**组件 skill（Component Skill）**：
从属于某一顶层 skill 的可独立调起子流程。

约束：

- 不单独产 stage-result（stage-result 一段一张，由顶层 stage 产），只产 collector 指标记录。
- 由顶层 skill 提示词正文显式写路径字符串声明（引用其 SKILL.md 路径）。

合宪依据：S7 约束 stage 级 skill；stage 内可复用的组件不与 S7 冲突（D-M7-2）。

## 人机交互规范（跨 5 阶段通用，2026-07-02 用户要求）

**适用范围**：make-decision / build-spec / build-plan / build-code / verify-code 这 5 个 stage 的所有 executor，跟用户对话时都要遵守，不是某一个 stage 单独的规矩。

**规则**：

1. 不用内部编号当称呼。决策草稿里的 D1/D7 这类字段名、内部代号，只能出现在写盘的文件里，跟用户说话时必须换成大白话描述这件事本身（比如不说"D7 的 yellow 判据"，要说"结果分三档，中间那档具体啥情况才算"）。
2. 不堆工程黑话。出现专业术语（比如"偶发失败"“交叉验证”）要么换成大白话解释，要么先说人话再补一句术语对照，不能让不懂技术的人看不懂问题在问什么。
3. 给选项必须讲清楚"选它是什么意思、选了会怎样"，不能只甩几个选项名字让用户自己猜。
4. 这条规矩不是"记住就行"，是每次组织给用户看的内容之前，自查一遍有没有漏网的编号/术语。

**为什么要写在这里**：这条规矩之前只在全局个人偏好里出现过，但 stage-executor 实际执行时会被"结构化留痕"的习惯带跑偏（比如为了方便追溯，直接把内部字段名甩给用户）。写进 CONTEXT.md 是为了让 5 个 stage 都能读到同一份要求，不靠单次对话里记住。

## Stage 内容契约窄研究记录（2026-07-26）

本节只记录处理组 4 直接采用的三个成熟做法，不新增 provider、用户身份系统或通用工作流框架。

**追加式审计事件**：

- 来源：[NIST SP 800-92](https://csrc.nist.gov/pubs/sp/800/92/final) 的可靠日志管理与事件记录原则。
- 采用：每次步骤、处置和风险决定写 create-only 事件，保留前一记录引用与内容校验；当前 TaskKernel/canonical writer 继续是唯一写入权威。
- 拒绝：不新建第二事件仓库，不修改旧记录，不把审计日志变成另一套业务 verdict。

**调用方可见交互绑定**：

- 来源：[W3C PROV-O](https://www.w3.org/TR/prov-o/) 的活动、实体以及 `wasInformedBy`/`wasGeneratedBy` 因果链。
- 采用：ask、真实 reply、re-rank 和最终决定使用稳定引用、顺序与内容校验绑定，让后一步能证明由哪一步产生。
- 拒绝：不把 provenance 扩成真人认证、消息投递证明或宿主身份系统；它只证明记录存在、顺序和内容绑定。

**人工风险与遗漏承担**：

- 来源：[NIST SP 800-39](https://csrc.nist.gov/pubs/sp/800/39/final) 的识别风险、评估影响与后果、再选择接受/规避/缓解等 risk response 原则。
- 采用：用户必须先看到具体问题、证据、影响范围和可能后果，再对绑定的 finding 或遗漏做明确选择；review risk 与 decision omission 使用不同记录。
- 拒绝：不接受通用“用户同意”，不跨 finding/快照复用，不把风险承担改写成质量通过，也不建设通用风险治理平台。

## Review-flow reset 术语（2026-07-28）

**review-flow generation**：一个由受认证 reset 记录派生的独立审查主题；它继承旧主题的可追溯来源，但不改变旧主题的 head、verdict 或审查额度。

**合法 reset**：只在当前快照相对旧主题发生可核验的结构变化、旧主题仍是当前 head、且阶段尚未接受时，追加一份绑定旧主题与新快照的 reset 记录；普通内容修订不能借此获得新主题。

_避免_：把 reset 叫成“重置通过状态”或“重新打开 accepted”；它不改质量结论，也不改变阶段确认边界。

**同链复审额度**：单个 review-flow generation 内允许的结构性 full review 次数；额度耗尽只对该 generation 生效，不阻止经过合法 reset 的新 generation 重新开始一次初始审查。

## 关系与边界

- 一个 **决策卡**只处理一个决策轴，并通过**调用方可见对话面**完成问答。
- 一个阶段用**用户完成卡**向用户说明结果，用**下游交接**向后续阶段交付正式事实；两者不能互相替代。
- **阶段协调**为每个 Phase 生成一张 **Phase Card**；**Phase 执行**消费它并返回正式证据。
- 一个 **恢复代次**只属于一个工作流任务，并在通过**恢复门禁**后才可成为当前事实。
- 新的 **当前 Phase 结果**会替代当前指针，但不会改写旧的正式结果。
- 平台特有的地址、状态和派发方式属于宿主映射，不是 WorkflowHub 领域术语。

## 已消除的歧义

- “reset”统一指创建**恢复代次**后的受控重新绑定；不表示删除、覆盖或手改旧记录。
**推进资格（progression eligibility）**：
build-code/verify-code 的当前 `decision-log.md`、`spec.md`、`plan.md`、`tasks.md` 存在且可读。它只回答“能否进入或继续工作”，accepted、receipt、review、audit 与历史 snapshot 不增加许可证。

**正式写边界（formal write boundary）**：
核心 publication 写成功前共享的结构预检。它认证 canonical task、实际 worktree、当次运行内容、目标仓库和声明写集合；错误必须 fail-loud 且不得留下部分成功。它不判断 reviewer 质量，也不是编辑代码的准入 gate。

**阶段完成判据（stage completion criteria）**：
与推进资格不同的谓词。只有阶段核心交付、风险相关测试、逐 AC 结果、独立 review（或真实 unavailable）和人类交接真实齐全，才可宣称完成。automatic accepted、`live_plan_execution` 或四材料可读不能单独证明完成。

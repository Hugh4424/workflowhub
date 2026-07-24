# CONTEXT — workflowhub 术语表

> 本项目自己的领域术语表骨架，统一术语避免后续设计漂移。
> 随项目演进逐步补充；不照搬其它项目的特有术语，只列本项目自己的概念。

## 五段流程术语

**需求确认（intake）**：
开发流程的第一阶段。把需求收敛清楚，产出需求权威记录。

**设计（design）**：
第二阶段。把"做什么、怎么验收"写成设计文档。

**计划（plan）**：
第三阶段。把设计拆成可执行任务与技术方案。

**实现（apply）**：
第四阶段。逐项实现，配套测试与独立审查。

**验收（test-acceptance）**：
第五阶段。独立验证交付是否达标。

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

**异源审查（cross-source review）**：
由独立来源、在独立上下文中对交付物做的审查，用于质量把关，禁止自审自判。

**需求保真链（requirement-fidelity chain）**：
从权威 source，经 immutable requirement ID、decision、artifact，到 acceptance criteria 的可复算链路。任何 accepted requirement 缺少其中一环都不能算 covered。

**expected topology / observed facts authority**：
stage manifest 定义应执行的 step 集合（expected topology）；journal 与 receipt 记录实际发生的执行事实（observed facts）。两者职责不同，audit 必须对比二者，不能互相替代。

**audit 单一真相源（single source of truth）**：
audit aggregator 负责计算 canonical verdict；stage-result 只携带其摘要，validator 只验证一致性，facts assembly 只装配事实，不另算第二套 audit 结论。

**运行事实（runtime fact）**：
可由已登记机器来源直接证明的一条任务执行信息；没有来源或证据时只记录状态，不补造数值。

**运行事实 v2（runtime-facts.v2）**：
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

**consumer/evidence matrix**：
跨 stage 复用盘点表。以真实消费者、重复度、typed I/O、失败/skip/human gate 语义为证据，决定正文应成为 skill、reference、component、contract，或保留在 stage。

**调用方可见对话面（caller-visible conversation surface）**：
调用方向用户展示问题、进度和结果，并把回答交回阶段执行者的交互边界。

**决策卡（decision card）**：
一次只承载一个决策轴，并说明推荐项、互斥选项及各自后果和风险的用户消息。

**完成卡（completion card）**：
阶段结束时汇总结果、正式产物、证据、依赖、风险、下一责任人和用户待办的简短交接。

**阶段协调 / Phase 执行（Stage coordination / Phase execution）**：
同一 `build-code` 合同中可组合的两部分，前者管理顺序和阶段边界，后者完成一个 Phase 的实现、测试、证据和审查闭环。

**Phase Card**：
阶段协调者交给 Phase 执行者的冻结事实集合，只含认证身份、目标、验收、工作区、允许范围、测试和上游 finding，不复制流程规则。

**组件所有权（component ownership）**：
一个组件在一个阶段中唯一归属于阶段执行或审查执行的责任边界。

**3rd-review**：
全局通用的纯异源审查引擎（skill）。接口输入 `{mode, contract, materials}`，做环境探测、派审查 agent，返回 `{verdict, findings, actual_mode}`。不含任何 stage 或轮次知识，可跨项目复用。2026-07-05 重设计决策（ADR 0001）后，3rd-review 瘦身为纯引擎层，原来挂在其下的 workflowhub 专属知识迁移到 wh-review。

**wh-review**：
workflowhub 专属的审查编排层（skill，新建于 ADR 0001，2026-07-05）。承接原来分散在 3rd-review 下的 workflowhub 专属知识：五个 stage 的正式审查，以及按需调用的独立诊断合同；build-spec、build-plan、verify-code 的正常修复不做小型二审，build-code 仍对每个 Phase 完整审查至 pass。wh-review 在内部调用 3rd-review 完成实际异源派发，对需要审查的 stage executor 暴露统一入口；3rd-review 只负责派发，不解释 WorkflowHub 的 stage 语义。

**审查材料地图（review material map）**：
每个 stage 明确列出的最小充分审查材料及其锚点、未知项和不适用项；它是 reviewer 的导航和可核查边界，不是把整个项目或原始日志重新投递给 provider。

**Phase 审查（phase review）**：
对单个 build-code Phase 的完整、冻结 diff 审查；每个 Phase 持续完整审查至 pass，不因材料优化降低代码、测试、简单性或鲁棒性检查强度。

**集成审查（integration review）**：
build-code 结束时对最终快照的跨 Phase 交互审查。它读取连续的 Phase PASS 覆盖链、跨 Phase seam 索引、每个 seam 的最终锚点或显式未知/不适用项，以及 AC 到改动和测试/证据的追踪；它不重新投递历史完整 diff。

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

## 关系与边界

- 一个 **决策卡**只处理一个决策轴，并通过**调用方可见对话面**完成问答。
- 一个阶段用**完成卡**向下游交付精简事实，不用消息副本替代正式产物和证据。
- **阶段协调**为每个 Phase 生成一张 **Phase Card**；**Phase 执行**消费它并返回正式证据。
- 平台特有的地址、状态和派发方式属于宿主映射，不是 WorkflowHub 领域术语。

# 功能规格：WorkflowHub 顺序执行与 wh-review 真实建议

> content_profile: `spec-content.v3`
>
> 基于当前 `decision-log.md` 的已确认需求。本文件只写产品行为、用户可观察结果、边界和验收，不写实现文件、代码符号或工程命令。

- **功能名**：WorkflowHub 顺序执行与 wh-review 真实建议
- **来源**：`R-001`–`R-022`、`D-001`–`D-018`、三项历史任务的审计事实
- **状态**：build-spec 草案

## 速读卡（30 秒）

- **一句话需求**：让 WorkflowHub 按规定顺序推进，让用户得到干净、聚焦、可追溯的异源审查建议，并把失败如实显示出来。
- **核心改动点**：
  - 只在 make-decision 启动入口准备 worktree；dirty main 只记录和建议，不阻止、不带入、不自动清理。
  - 固定 Talk → direction review → Grill → detail review 的顺序，Clarify 只归 build-spec。
  - wh-review 按阶段最小材料包调用通用 3rd-review；所有阶段只收可信异源建议，不要求 provider pass；build-code 只有在当前审查没有重要 findings 时才结束，也不无限重审。
  - make-decision 每完成一个现有 step 就更新同一份 decision-log，最后再做一次完整原始需求回放；不新增 ledger、维护对象或 quality gate。
  - build-plan 在 review findings 处置后、最终 publish 前，复用现有 `spec-analyze`（用户称 `speckit-analyze`）对原始需求 ↔ decision-log ↔ spec ↔ plan ↔ tasks 做一次严格 report-only 一致性检查。
- **最大影响面**：任务启动、对话暂停恢复、阶段交接、异源 review 结果、build-spec 和 build-code 的最终审查。
- **验收信号**：用户能看见当前阶段、下一步、真实失败原因、建议来源和处理状态；历史 attempt 或空 findings 不会冒充当前完成。

## 来源与决策映射

| Source ID | Decision ID | FR / AC IDs | Status / affected scope | Unresolved / handoff |
| --- | --- | --- | --- | --- |
| R-001–R-003、R-010 | D-001、D-002、D-010 | FR-GOV-001、FR-SPEC-001、AC-015 | current / 全流程、四材料、宪法边界 | 工程拆分交 build-plan |
| R-004、R-005、R-013、R-014 | D-003、D-004、D-009 | FR-START-001、FR-START-002、FR-CLEANUP-001、AC-001、AC-002、AC-014 | current / 启动、dirty、cleanup | 字段与摘要边界交 build-plan |
| R-006、R-012 | D-005、D-013 | FR-INTERACT-001、FR-REVIEW-003、AC-003、AC-013 | current / 顺序强校验 | 具体接线交 build-plan/build-code |
| R-007、R-008 | D-006、D-007、D-011 | FR-INTERACT-002、FR-INTERACT-003、AC-004、AC-005 | current / 唯一 Clarify、真实交互 | host seam 验收交 build-code |
| R-009 | D-008 | FR-SPEC-002、FR-HANDOFF-001、AC-011、AC-012、AC-013 | current / build-spec 调研、build-code integration | fact key 和具体步骤交后续阶段 |
| R-011 | D-007 | FR-SPEC-001、AC-011 | current / 复用现有阶段事实和材料 | 条件调研只补规格事实，不建立第二套研究来源 |
| R-015–R-017 | D-009 | FR-REVIEW-001、FR-REVIEW-002、FR-REVIEW-006、AC-006、AC-007、AC-016 | current / packet、provider、失败事实 | 具体 broker 接口交 wh-review/3rd-review |
| R-018 | D-014 | FR-REVIEW-003、FR-REVIEW-006、AC-008 | current / review 语义 | build-code 沿用既有实现审查合同 |
| R-019 | D-015 | FR-REVIEW-004、FR-REVIEW-005、AC-009、AC-010 | current / advice freshness | 运行时接线已在同 task 修复，后续补全契约 |
| R-020 | D-016 | FR-DECISION-001、AC-017 | current / decision-log 连续更新 | 精确字段和失败返回由 build-plan/build-code 细化；不新增记录对象 |
| R-021 | D-017 | FR-PLAN-001、AC-022 | current / build-plan 最终跨材料检查 | 复用现有 `spec-analyze`；DEFER/OPEN 维度、最终 step 和测试 oracle 交 build-plan/build-code |
| R-022 | D-018 | FR-REVIEW-003、FR-REVIEW-005、FR-REVIEW-009、AC-008、AC-010、AC-023、AC-024 | current / 所有 stage advice-only、build-code 重要 finding 收口 | 复用现有 actionable serious finding 分类、focused repair 和 stop 事实；不新增 gate |
| G-002 | D-012 | FR-INTERACT-004、AC-018 | current / Grill 批量独立前沿语义 | 本地技能和真实契约测试交后续实现阶段 |

### 决策承接分类

- **locked**：`D-001`–`D-018` 的产品选择，以及 `R-001`–`R-022` 中已经确认的范围、边界、review 语义、decision-log 连续更新责任和最终跨材料检查；本规格不得反向改写这些选择。
- **unresolved**：`PFACT-004`、`OPEN-001`–`OPEN-006` 和 `DEFER-001`–`DEFER-009` 中的实现接线、字段细化、provider 接口、最终跨材料检查和真实契约证据；它们有 owner、处理阶段和关闭条件，不是 build-spec 猜答案的空间。
- **newly discovered ambiguity**：`NEW-001` 仅表示本规格上一版缺少本分类结构，属于规格承接缺口；本修订已补齐，未发现需要返回 make-decision 的产品方向歧义。

## 1. 问题与紧迫性

用户现在遇到的不是单个 provider 的审查质量问题，而是流程把不同性质的事实混在了一起：Talk、方向审查、Grill、细节审查可能乱序；Grill 被误当成 review；Clarify 的归属不清；dirty main 可能阻止任务或被错误带入；provider 没有最终结果时又可能被写成空 findings 或通过；审查包过大、路径不兼容、重试过多，导致耗时、卡住和进程被终止。

这会产生两种直接伤害：用户看不到“现在到底发生了什么”，以及 WorkflowHub 可能用旧 attempt、旧 snapshot 或历史 report 宣称当前阶段已验收。wh-review 的根本用途是向当前阶段提供独立建议，不是把所有非实现阶段审到“零问题”，更不是因为记录建议的材料发生变化就强迫用户重复审查。

## 2. 背景、目标与范围

### 背景

WorkflowHub 已有五阶段、四份当前材料、现有 quality facts、现有 review 结果和统一 3rd-review broker。问题来自多个调用入口、宽松的阶段绑定、过大的材料包和不诚实的失败归类，而不是缺少一套新的状态机或质量系统。

### 目标

- 让任务在 dirty target 上仍可安全启动，并让用户知道 dirty 的事实、可能原因和下一步处理建议。
- 让 make-decision 的 Talk、direction review、Grill、detail review 严格按既定顺序发生。
- 让 Talk、build-spec 的 spec-clarify、Grill 都能真实暂停等待用户，收到对应回复后再继续；错误回复不能推动流程。
- 让 build-spec 拥有条件规格调研和唯一 spec-clarify；让 build-code 明确在最终测试和 AC trace 后执行 integration review。
- 让 wh-review 为各阶段提供最小、干净、阶段特有的异源建议，并保留完整的 provider、route、coverage、transport 和 provenance 事实。
- 让所有 review 按“获得真实异源建议”解释；build-code 额外要求当前可信结果没有重要 findings，但不要求 provider pass。
- 让 decision-log 成为连续更新的需求主线：每个现有 make-decision step 完成时记录本步增量，最终再做一次来源覆盖回放，防止阶段末汇总漏掉需求。
- 让阶段 review 明确告诉异源 agent 本阶段要关注什么，并把 provider 慢、卡、终态缺失、最小 packet 和 route/coverage 降级都记录成可验证事实。
- 让 build-plan 在最终 publish 前执行一次严格的 `spec-analyze` 跨文档检查，逐项校验原始需求、decision-log、spec、plan、tasks 以及所有延期/未决去向。

### 范围内

- CLI 与宿主对话中的任务启动、Talk/Grill/Clarify 卡片、review 结果、四材料交接和 cleanup consent。
- 任务 worktree 创建时的 dirty 诊断、candidate 绑定和现有 fact 记录。
- make-decision 的 direction/detail 两条 review track、build-spec 的规格 review、build-code 的最终 integration review 说明。
- wh-review 的阶段 allowlist、阶段特有提示/skill/合同、通用 3rd-review 路由和真实终态记录。
- 当前四材料、现有 quality facts、现有 review refs 和现有授权边界的强校验。
- 同一份 decision-log 的逐 step 更新、最终需求回放和下游交接；不增加第二份需求记录。
- build-plan 最终一致性检查复用现有 report-only `spec-analyze` packet projection；不创建第五份材料、ledger、状态机或新的完成 gate。

## 3. 用户场景与状态覆盖

### SCN-001：从 make-decision 启动任务

- **角色**：任务执行者
- **Given**：任务 manifest/store 已存在，目标仓库可读取。
- **When**：用户第一次正式启动 make-decision。
- **Then**：同一个启动入口读取目标仓库基线并准备 CandidateWorkspace；重复启动只复用已有 workspace，不由其他调用方另行准备。

### SCN-002：目标仓库 dirty 但仍需开始任务

- **角色**：有未提交改动的任务执行者
- **Given**：目标分支存在 tracked、staged、untracked 或有限 ignored 状态。
- **When**：用户启动 make-decision。
- **Then**：系统只读记录目标 ref、HEAD、dirty 标记、状态摘要和处理建议；candidate 只来自启动时 HEAD。main 的文件、index、HEAD、stash 和分支不变，dirty 内容不进入 candidate。

### SCN-003：按顺序完成 make-decision

- **角色**：任务执行者和异源 reviewer
- **Given**：make-decision 的当前材料和必要事实可读。
- **When**：用户完成交互。
- **Then**：顺序是 Talk Round 1 → 必要调研 → Talk Round 2 → direction review → Talk Round 3 → Grill → decision draft → detail review → human confirmation → publish/handoff；Grill 只负责交互式思考，不产生 provider review。

### SCN-004：真实暂停、回复、恢复

- **角色**：任务执行者
- **Given**：Talk、spec-clarify 或 Grill 提出问题。
- **When**：系统发出 ask，用户稍后回复。
- **Then**：中间可观察为 waiting-for-user；回复必须绑定对应 card、round 和 reply hash；匹配后才 resume/re-rank。无回复、错 card、错 hash 或冲突回复保持 incomplete，并要求最小补充。

### SCN-005：错误顺序或旧事实尝试发布

- **角色**：阶段执行者
- **Given**：direction/detail refs 存在，但顺序证据缺失或来自旧 attempt/snapshot/report。
- **When**：执行阶段发布。
- **Then**：系统明确拒绝当前发布或保持 incomplete；不能仅因文件存在、测试通过或历史 review 通过而改成当前完成。

### SCN-006：非 build-code review 返回建议

- **角色**：任务执行者
- **Given**：当前阶段材料包合法，异源 provider 返回 findings，findings 可以非空。
- **When**：阶段执行者处置 findings。
- **Then**：保留原始 finding、来源和 reviewed material/snapshot/provenance；用户可以修复、拒绝并说明理由、接受风险或请求人工决定；不要求 findings=[] 或 review pass 才能继续同 task 修复。

### SCN-007：provider 无可信最终结果

- **角色**：任务执行者
- **Given**：provider 发生 PROCESS_DEAD、SIGTERM、timeout、路径错误、坏 JSON、transport failure、SAME_SOURCE 或没有最终公开文本。
- **When**：review 调用结束。
- **Then**：记录真实的 unavailable/失败分类、route 和诊断；不生成 findings=[]、review passed、stage completed，也不把失败解释成业务 finding。非 build-code 可继续同 task 修复，但质量事实保持 unavailable/incomplete。

### SCN-008：只发生记录性 snapshot 变化

- **角色**：任务执行者
- **Given**：direction/detail/build-spec/build-plan advice 已审查某个实际材料包，之后只追加 confirmation、interaction aggregate 或其他记录性材料。
- **When**：阶段再次读取当前任务。
- **Then**：旧 advice 仍绑定原 reviewed material/snapshot/provenance，不因记录性变化自动失效或重审。只有用户或阶段明确请求新的建议，并说明被审主题确有变化或需要新意见时，才允许新 attempt。

### SCN-009：进入 build-spec 时需要规格事实

- **角色**：build-spec 阶段执行者
- **Given**：decision-log 已完成，规格中的产品事实仍有缺口。
- **When**：build-spec 判断规格是否可精确定义。
- **Then**：由 build-spec 负责条件调研；结果复用现有 facts/materials，记录 executed、skipped 或 unavailable 及理由，不新建研究库，也不新增完成 gate。方向问题回 make-decision，实现事实归 build-plan。

### SCN-010：规格缺口由唯一 spec-clarify 处理

- **角色**：build-spec 阶段执行者和用户
- **Given**：spec.md 存在影响行为或验收的规格歧义。
- **When**：build-spec 需要用户补充信息。
- **Then**：只通过 build-spec 的 spec-clarify 执行 ask → wait → reply → resume；make-decision 不再重复提问同一规格问题。若没有歧义，记录 trigger=false 和原因。

### SCN-011：build-code 的最终 integration review

- **角色**：实现者
- **Given**：所有 phase 完成，最终测试、逐项 AC trace 和实现事实已准备。
- **When**：build-code 收尾。
- **Then**：按“最终测试与 AC trace → integration review → finding disposition/focused repair → 现有实现审查合同的发布”顺序执行；review 只读取批准的 spec、AC、fresh tests 和 AC trace，绑定最终实现。该阶段只在当前可信结果没有 actionable 的 major/blocking finding 后结束 review cycle；minor advice 可以保留，不要求 provider pass。

### SCN-012：dirty cleanup 需要用户同意

- **角色**：任务执行者
- **Given**：系统发现 dirty 或疑似生成物，并能给出有限原因摘要。
- **When**：用户查看建议并明确同意具体路径和动作。
- **Then**：同意前只显示 recommended/pending，不触碰文件；同意后才复用现有 authorize cleanup，动作、路径和风险可回看。用户未同意或路径不明确时不执行。

### SCN-013：并发或重复启动

- **角色**：两个并发调用方
- **Given**：两次调用同时尝试准备同一个任务，或当前材料在调用期间变化。
- **When**：调用写入 workspace/fact/review。
- **Then**：复用现有幂等和绑定校验；只接受完整、当前、身份匹配的写入，竞态失败保持明确失败，不创建第二个 workspace、第二套状态或替代对象。

### SCN-014：每一步都保留决策上下文

- **角色**：make-decision 执行者和后续阶段执行者
- **Given**：当前 `decision-log.md` 的 step 表列出 13 个既有 step（含 `post-audit-coverage-repair`），它是四阶段共同读取的需求真相。
- **When**：任一 step 完成，或没有新增需求但该 step 已完成。
- **Then**：同一份 decision-log 追加本步的输入、`no-new-requirement` 或新增需求、真实用户回答、关键事实、选择/理由、后果/风险、非目标、未决和延期交接；写入失败保持本步未完成。最终确认前再逐条回放来源并绑定决定、规格验收或交接去向。

### SCN-015：Grill 一次处理当前独立前沿问题

- **角色**：任务执行者
- **Given**：Grill 已完成事实核实，当前存在一组互不依赖、都可能改变方向的前沿问题。
- **When**：Grill 发起本轮用户交互。
- **Then**：一次展示当前独立问题组，问题有编号和推荐；用户只回答一部分时保留已答项并重新计算未答前沿；出现依赖、冲突或歧义时只追问最小澄清。Talk 仍一次问一个方向问题，Grill 不生成 provider review。

### SCN-016：build-plan 最终跨文档一致性检查

- **角色**：build-plan 阶段执行者
- **Given**：review-plan findings 已逐条处置，plan/tasks 已完成最后一次修订，当前四份材料和现有 raw requirement index 可读。
- **When**：publish-plan-result 前执行最终 `spec-analyze`（用户称 `speckit-analyze`）。
- **Then**：同一次 report-only 分析逐项对照原始需求、decision-log、spec、plan、tasks，包含 R/D/FR/AC、流程/状态/边界/非目标、全部 DEFER/OPEN 和任务验证 oracle；缺项产生真实 finding/incomplete，输入不可用保持 unavailable；不读取历史材料，不创建新对象，不把分析结果变成 provider pass 或新的质量 gate。

### 状态覆盖清单

- [x] **默认态**：SCN-001、SCN-003；任务可从正式入口开始，四材料和必要事实可读。
- [x] **空态**：SCN-007；provider 没有可信 finding 时显示 unavailable，而不是伪造空 findings；合法的真实 empty findings 仍显示为 advice。
- [x] **错误态**：SCN-005、SCN-007、SCN-013；错误顺序、路径、终态、身份和竞态均明确暴露。
- [x] **加载态**：SCN-004、SCN-007；等待用户或 provider 时显示 waiting/进行中，不提前发布完成。
- [x] **取消态**：SCN-007；provider 或宿主被取消且没有最终公开结果时记录 unavailable，不能当作空结果或通过。
- [x] **边界态**：SCN-002、SCN-008、SCN-011；dirty target、记录性 snapshot 变化和最终实现绑定各走独立规则。
- [x] **权限态**：SCN-002、SCN-012、SCN-013；读取、workspace 身份和 cleanup authorization 不合法时 fail-loud，不自动扩大权限。
- [x] **竞态**：SCN-013；重复启动、材料变化和旧 receipt 不能产生部分成功或当前假结论。
- [x] **连续记录**：SCN-014；中途需求不会只依赖阶段末一次人工总结，且记录性更新不会自动触发非 build-code advice 重审。
- [x] **Grill 前沿**：SCN-015；批量只适用于当前独立前沿问题，不变成大而全的问卷或新的控制面。
- [x] **最终一致性**：SCN-016；最终分析只检查当前五项输入，不替代 review、不新增完成门槛。

## 4. 产品事实与假设（PFACT）

- **PFACT-001**：五阶段和 make-decision 的 direction/detail 两条 review track 是现有流程边界。
  - **status**：`verified`
  - **证据或来源**：`D-005`、`D-006`、`D-013`、当前 `decision-log.md`；顺序和 owner 已被正式确认。
  - **关联**：FR-INTERACT-001、FR-INTERACT-003、FR-HANDOFF-001、AC-003、AC-005、AC-013。

- **PFACT-002**：当前工作真相是 decision-log.md、spec.md、plan.md、tasks.md；旧 task、旧 receipt、旧 review、历史 snapshot 只读保留。
  - **status**：`verified`
  - **证据或来源**：`D-001`、`D-010`、`CONSTITUTION.md` 的当前材料边界；当前任务已有正式 decision-log。
  - **关联**：FR-GOV-001、FR-REVIEW-006、FR-SPEC-002、AC-015、AC-016。

- **PFACT-003**：现有任务启动和 CandidateWorkspace 能区分 target repository 与 candidate；dirty 内容不能代表 HEAD。
  - **status**：`verified`
  - **证据或来源**：`F-001`、`D-003`、`D-004`；dirty 处理决策已确认，具体字段仍交 build-plan。
  - **关联**：FR-START-001、FR-START-002、FR-CLEANUP-001、AC-001、AC-002、AC-014。

- **PFACT-004**：现有宿主对话面和有限 interaction completion record 可承载结构化交互结果；真实三类 ask/wait/reply/resume 当前尚未被实现证据完整证明。
  - **status**：`unknown`
  - **owner、影响**：build-plan/build-code；若 host seam 无法绑定 card/round/hash 并恢复重排，Talk、spec-clarify、Grill 将只能保持 incomplete。关联 `RISK-001`、`DEFER-002`。
  - **关联**：FR-INTERACT-002、FR-INTERACT-003、AC-004、AC-005。

- **PFACT-005**：wh-review 可以使用阶段材料 allowlist、阶段特有提示/skill/合同和通用 3rd-review broker，并保留真实 provider 公开结果与 provenance。
  - **status**：`verified`
  - **证据或来源**：`D-009`、现有 wh-review contract 和 stage material 事实；历史审计已区分 PROCESS_DEAD 与正常 findings=[]。
  - **关联**：FR-REVIEW-001、FR-REVIEW-002、FR-REVIEW-006、AC-006、AC-007、AC-016。

- **PFACT-006**：所有 review 的产品目的都是真实异源建议，不以 provider `pass` 作为阶段要求；build-code 复用现有当前实现绑定和 `actionable` serious finding 处置合同，只有没有重要 findings 时才结束 review cycle。
  - **status**：`verified`
  - **证据或来源**：`R-018`、`R-019`、`R-022`、`D-014`、`D-015`、`D-018`；provider protocol 已有 `actionable`、`major|blocking` 和 `nonblocking_minor` 分类。
  - **关联**：FR-REVIEW-003、FR-REVIEW-004、FR-REVIEW-005、FR-REVIEW-009、AC-008、AC-009、AC-010、AC-023、AC-024。

- **PFACT-007**：记录性材料变化不等于被审主题变化；已完成 advice 必须保留它实际审查的材料、snapshot、attempt、result、report 和 route/coverage。
  - **status**：`verified`
  - **证据或来源**：`D-015`、`AC-007c`、`DEFER-007`；当前 task 已用该事实修复正式执行绑定。
  - **关联**：FR-REVIEW-004、FR-REVIEW-006、AC-009、AC-016。

- **PFACT-008**：build-spec 需要产品事实时已有阶段事实和材料可复用；条件调研不应成为第二套研究控制面。
  - **status**：`verified`
  - **证据或来源**：`D-007`、`D-008`、`DEFER-003`；调研结果只表达 executed/skipped/unavailable。
  - **关联**：FR-SPEC-001、FR-SPEC-002、AC-011、AC-012。

- **PFACT-009**：build-code 已有 integration review 的产品边界，但需要在最终测试和 AC trace 后明确对用户可见的执行顺序，并按当前 review 的重要 finding 收口，不以 provider `pass` 作为额外要求。
  - **status**：`verified`
  - **证据或来源**：`D-008`、`DEFER-004`、当前 build-code 阶段合同事实。
  - **关联**：FR-HANDOFF-001、FR-REVIEW-005、AC-010、AC-013。

- **PFACT-010**：cleanup 是不可逆动作，已有 authorize 边界可承载“先建议、用户同意后处理”。
  - **status**：`verified`
  - **证据或来源**：`D-004`、`D-009`、`G-001`；用户明确要求同意后才处理。
  - **关联**：FR-CLEANUP-001、AC-014。

- **PFACT-011**：历史 task、旧 attempt、旧 snapshot、旧 report 和 provider 失败事实必须 immutable、只读、不可替代当前事实。
  - **status**：`verified`
  - **证据或来源**：`R-016`、`R-017`、`D-009`、`D-010`；三历史任务审计结果。
  - **关联**：FR-REVIEW-006、AC-007、AC-016。

- **PFACT-012**：本需求影响 CLI/宿主对话和结果输出，不要求新增 GUI 页面；所谓“页面范围”是既有任务启动、对话卡、review 结果、交接和 consent surface。
  - **status**：`not_applicable`
  - **不适用理由**：当前产品边界没有新增 GUI 页面；后续 UI 只需保持这些既有可见 surface 的信息完整。
  - **关联**：FR-GOV-001、FR-INTERACT-002、FR-REVIEW-002、AC-015。

- **PFACT-013**：历史审查中的两次失败 attempt 与一次成功 attempt 是不同事实：约 215 秒和约 464 秒的 attempt 持续产生 thinking/tool 事件、没有最终 assistant 文本、被 SIGTERM 终止并记为 `PROCESS_DEAD`，没有可用 findings；另一次约 398 秒的独立 attempt 正常完成并返回 `findings=[]`。bundle 相对路径与 Kimi ReadFile 的绝对路径要求冲突属于 provider transport/tool access 失败，不是业务 finding。
  - **status**：`verified`
  - **证据或来源**：`R-016`、`R-017`、当前 `decision-log.md` 的原始需求回放审计；三类 attempt 按 attempt、耗时、终态和结果分别保留。
  - **关联**：FR-REVIEW-002、FR-REVIEW-003、FR-REVIEW-006、AC-007、AC-008、AC-016。

- **PFACT-014**：仓内实际注册的能力名是 `spec-analyze`，用户称为 `speckit-analyze`；它是已有的 report-only/lens-only packet 检查，不是 runtime work gate。当前实现已经检查 source/decision、FR/AC、孤儿 task、测试策略、Phase Verify 和材料 hash，但还没有把 `DEFER-*`/`OPEN-*` 逐项传播检查和最终 publish 前调用写成强合同。
  - **status**：`verified`
  - **证据或来源**：`skills/spec-analyze/SKILL.md`、`skills/spec-analyze/packet-lens.md`、`runtime/stage/stage-content-contracts.mjs`、`workflows/build-plan/steps.json`；本轮三代理审计和本地结构扫描。
  - **关联**：FR-SPEC-002、FR-PLAN-001、AC-012、AC-022。

## 5. 功能需求

### 启动与 dirty 边界（START）

这一域保证用户能安全开始任务，并且知道目标仓库的真实状态。dirty 是输入事实，不是启动失败理由，也不是自动导入许可。

- **FR-START-001**：正式 make-decision 启动入口必须是 task worktree 的唯一创建 owner；task-bootstrap 只登记任务，status、doctor、confirm、下游阶段和 wh-review 只使用已有 workspace。
  - **范围边界**：包含唯一入口、重复调用幂等和无 workspace 时的明确结果；不包含新建 public 命令或第二个准备控制面。
  - **依据**：`D-003`、`PFACT-003`；source_status=`current`。
  - **场景**：SCN-001、SCN-013。
  - **验收**：AC-001、AC-002。

- **FR-START-002**：workspace 创建前必须只读记录 target repository 的 ref、HEAD、dirty 状态、有限分类摘要和建议；candidate 必须从启动时 HEAD 创建，dirty 内容不得进入 candidate，且不得自动 stash、commit、delete 或阻止创建。
  - **范围边界**：原因只能是有限事实分类和建议，不猜用户意图；具体摘要上限交 build-plan。
  - **依据**：`D-004`、`R-013`、`R-014`、`PFACT-003`；source_status=`current`。
  - **场景**：SCN-002、SCN-012。
  - **验收**：AC-001、AC-014。

### 交互和阶段顺序（INTERACT）

这一域保证用户不会被重复提问或跳过阶段，也保证“Grill 是想清楚问题，不是第三次 review”。

- **FR-INTERACT-001**：make-decision 必须按 Talk Round 1 → 必要调研 → Talk Round 2 → direction review → Talk Round 3 → Grill → decision draft → detail review → human confirmation → publish/handoff 的顺序执行；前一步没有当前事实时，后一步不得发布当前完成。
  - **范围边界**：顺序校验复用现有 interaction completion record、review refs 和四材料；不新增 track、状态机或 gate。
  - **依据**：`D-005`、`D-013`、`PFACT-001`；source_status=`current`。
  - **场景**：SCN-003、SCN-005。
  - **验收**：AC-003。

- **FR-INTERACT-002**：Talk、spec-clarify 和 Grill 都必须真实经历 ask → waiting-for-user → 对应 user reply → resume/re-rank；系统必须拒绝无回复、错 card、错 round、错 hash 和冲突回复，不得用最终 aggregate 的字段存在代替真实生命周期。
  - **范围边界**：只记录现有 interaction completion record 所需的有限结构化证明，不保存完整聊天、不新增 public ask/resume 命令。
  - **依据**：`D-007`、`D-011`、`PFACT-004`；source_status=`current`。
  - **场景**：SCN-004、SCN-010。
  - **验收**：AC-004。

- **FR-INTERACT-003**：Clarify 只有一个归属：build-spec 的 spec-clarify；make-decision 只负责 Talk 和 Grill，并把方向问题回送 make-decision、实现事实问题交给 build-plan。
  - **范围边界**：没有规格歧义时必须记录 trigger=false 和原因；不能在两个阶段各问一套同一问题。
- **依据**：`D-006`、`D-011`、`PFACT-001`；source_status=`current`。
  - **场景**：SCN-003、SCN-010。
- **验收**：AC-005。

- **FR-INTERACT-004**：Grill 每轮可以一次询问当前全部互不依赖的 frontier questions，问题必须可编号并给出推荐；用户部分回答时保留已答结论，只重新计算未答问题；存在依赖、冲突或歧义时先停下并询问最小澄清。该批量调度不改变 Talk 的一次一题规则，也不把 Grill 变成 provider review。
  - **范围边界**：只调整现有 Grill 的提问调度和重排语义；保留事实核实、CONTEXT/ADR 判断、四项退出检查、真实 waiting/resume 和不新增对象/gate 的边界。
  - **依据**：`D-012`、`G-002`、`PFACT-004`；source_status=`current`。
  - **场景**：SCN-003、SCN-004、SCN-015。
  - **验收**：AC-018。

- **FR-INTERACT-005**：Talk 的每个用户可见选项必须用大白话同时说明选择会带来的后果和主要风险；用户回复后，decision-log 必须保留这组“选项—后果—风险”的事实，不得只记录一个裸选项编号。
  - **范围边界**：只约束 Talk 卡片和同一 decision-log 的可读记录；不把 Talk 变成批量问卷，不新增问题卡存储或质量 gate。
  - **依据**：`R-003`、`D-001`；source_status=`current`。
  - **场景**：SCN-003、SCN-004。
  - **验收**：AC-019。

### 决策材料连续更新（DECISION）

- **FR-DECISION-001**：make-decision 的每一个现有 step 完成后，必须更新同一份当前 `decision-log.md`。更新至少说明本步输入、新原始需求或 `no-new-requirement` 及理由、用户真实回答、关键事实和约束、选择及理由、后果与风险、非目标、未决项和延期 owner/验收；最终确认前仍要从头回放每个原始来源，并把它归为 current、deferred、non-goal 或 evidence-only，绑定到决定、规格验收或交接去向。
  - **范围边界**：这是已有 decision-log 的连续写入责任，不创建 requirement ledger、第二份记录、独立状态机或新的质量 gate；现有 stage writer/handler 必须明确承接本步写入和失败返回。写入失败保持当前 step 未完成，不用历史记录或 replacement object 补成完成。只改变记录性材料时，不自动触发非 build-code advice 重审。
  - **依据**：`R-020`、`D-016`、`PFACT-002`、`PFACT-007`；source_status=`current`。
  - **场景**：SCN-014。
  - **验收**：AC-017。

### wh-review 材料与 provider 事实（REVIEW）

这一域保证审查只审当前阶段真正需要的内容，且任何失败都不会变成假结论。

- **FR-REVIEW-001**：每次 review 必须使用当前阶段 allowlist 组成一个干净、冻结、path-safe 的最小 packet，并使用该阶段特有的 prompt、skill 或 review contract；direction、detail、phase 和 integration 使用不同的最小材料边界。
  - **范围边界**：direction 只含原始需求、客观事实、硬约束和非目标；detail 含已定方向、同一份 decision-log、验收草案和现有 lens；phase 使用当前 phase diff；integration 使用批准的 spec、AC、fresh tests 和 AC trace。每个阶段只保留一份必要材料，不发送累计 diff、raw log、完整仓库、完整聊天、重复 planning artifacts 或未被阶段合同要求的完整 diff/index。
  - **依据**：`R-015`、`D-009`、`PFACT-005`；source_status=`current`。
  - **场景**：SCN-003、SCN-006、SCN-011。
  - **验收**：AC-006。

- **FR-REVIEW-002**：review 必须调用可信配置中的通用 3rd-review broker，并保留 requested/actual route、provider、model、profile、coverage、attempt/result/report、runtime/session（若公开）、duration、公开诊断、findings 和 material/snapshot provenance。
  - **范围边界**：WorkflowHub 不启动 provider、不实现 broker lifecycle、polling、fallback、无限 retry 或第二套 timeout；provider 无终态时只记录真实 unavailable。
  - **依据**：`D-009`、`PFACT-005`；source_status=`current`。
  - **场景**：SCN-006、SCN-007。
  - **验收**：AC-006、AC-007。

- **FR-REVIEW-003**：make-decision direction/detail、build-spec、build-plan、build-code phase 和 build-code integration review 都只要求得到真实异源建议事实，不要求 provider `pass` 或 findings=[]。非 build-code findings 可以非空，不自动阻止同 task 修复；build-code 另按 FR-REVIEW-009 严格收口重要 findings。
  - **范围边界**：这不是新增 gate，也不把 unavailable 当作 advice；provider 无可信最终结果仍必须显示 unavailable/incomplete，不能被解释成“没有重要 finding”。
  - **依据**：`R-018`、`R-022`、`D-014`、`D-018`、`PFACT-006`；source_status=`current`。
  - **场景**：SCN-006、SCN-007、SCN-011。
  - **验收**：AC-008、AC-023、AC-024。

- **FR-REVIEW-004**：非 build-code advice 必须保留它实际审查的 material_id、snapshot_tree、attempt/result/report、route/coverage 和 finding provenance；confirmation、interaction aggregate 或 decision-log 的记录性变化不能自动使 advice 失效或触发重审。
  - **范围边界**：只有用户或阶段明确请求新的建议，并能说明被审主题实际变化或确需新意见时，才允许新 attempt；不追求通过重复审查清空 findings。
  - **依据**：`R-019`、`D-015`、`PFACT-007`；source_status=`current`。
  - **场景**：SCN-006、SCN-008。
  - **验收**：AC-009。

- **FR-REVIEW-005**：build-code 的实现 review 必须严格绑定当前 material_id、snapshot_tree、实现/测试事实和 AC trace；当前实现不匹配时，旧 review 不能替代当前重要 finding 收口事实。
  - **范围边界**：只保持 build-code 当前实现绑定和重要 finding 处置的严格合同，不把该严格 freshness 规则扩大到非 build-code advice。
  - **依据**：`D-015`、`D-018`、`PFACT-006`、`PFACT-009`；source_status=`current`。
  - **场景**：SCN-011。
  - **验收**：AC-010、AC-013。

- **FR-REVIEW-006**：PROCESS_DEAD、SIGTERM、timeout、路径错误、坏 JSON、transport failure、SAME_SOURCE、profile mismatch、旧 attempt、旧 snapshot、旧 report、测试通过和文件完整都不得被改写成 findings=[]、review passed 或当前 stage completed。
  - **范围边界**：历史结果继续只读保留；真实 empty findings 与 provider 失败必须可区分。
  - **依据**：`R-016`、`R-017`、`D-009`、`PFACT-011`；source_status=`current`。
  - **场景**：SCN-005、SCN-007、SCN-008。
  - **验收**：AC-007、AC-016。

- **FR-REVIEW-007**：每个 review stage 的阶段特有 prompt/skill/contract 必须写出该阶段的关注点、排除项和 finding 证据要求；只检查文件存在不算阶段语义已接线。direction、detail、build-spec、build-plan、phase 和 integration 的关注点必须能从 provider-visible packet 中读到。
  - **范围边界**：复用现有 stage contract/skill allowlist，不新增 reviewer 状态、指标系统或 provider；关注点缺失时保持材料不完整并报告。
  - **依据**：`R-015`、`D-009`、本轮审计缺口；source_status=`current`。
  - **场景**：SCN-003、SCN-006、SCN-011。
  - **验收**：AC-020。

- **FR-REVIEW-008**：wh-review 对慢、卡、被终止或无最终文本的 attempt 必须复用 3rd-review 的实际 timeout/kill/route/group outcome 事实；必须能区分持续运行、PROCESS_DEAD、SIGTERM、timeout、transport failure 和真实 empty findings，并记录 coverage 降级。WorkflowHub 不新增 broker lifecycle、无限 retry 或 provider fallback。
  - **范围边界**：WorkflowHub 只消费公共 broker 结果和诊断；接口无法读回时保持 unavailable/incomplete，不猜 duration、route 或 coverage。
  - **依据**：`R-016`、`D-009`、`DEFER-005`、`OPEN-003`；source_status=`current`。
  - **场景**：SCN-006、SCN-007。
  - **验收**：AC-021。

- **FR-REVIEW-009**：build-code phase 和 integration review 必须在当前可信 provider 结果中没有 `actionable` 的 `major|blocking` finding 后结束该 review cycle；`minor`/`nonblocking_minor` 可以作为未清零的 advice 保留，不要求 provider `pass`。发现重要 finding 后，只有实际修复或被审主题确实变化才允许一次 focused review；同一 finding 重复、没有实际主题变化或 provider 无可信终态时停止自动循环，保留 `needs_human`/`unavailable`/`incomplete`，不能宣称已清理。
  - **范围边界**：重要 finding 复用现有 provider protocol 和 adjudication，不新增 severity、review loop controller、状态对象或 quality gate；记录性 snapshot 变化仍不触发 review。
  - **依据**：`R-022`、`D-018`、现有 `provider-protocol.md`；source_status=`current`。
  - **场景**：SCN-011 及其修复后 focused review、重复 finding、无变化、无终态场景。
  - **验收**：AC-023、AC-024。

### build-spec 和 build-code 交接（HANDOFF）

- **FR-SPEC-001**：build-spec 在读完当前 decision-log 后，只有在规格事实不足以定义用户行为、数据规则、兼容边界或安全条件时才执行条件调研；由 build-spec 负责，复用现有 facts/materials，结果为 executed、skipped 或 unavailable 并保留理由。
  - **范围边界**：调研只补规格所需的产品事实；不重新决定方向、不新建 research database、不新增完成 gate；实现事实调研交 build-plan。
  - **依据**：`R-009`、`D-008`、`PFACT-008`；source_status=`current`。
  - **场景**：SCN-009。
  - **验收**：AC-011。

- **FR-SPEC-002**：spec.md 必须定义完整用户流程、CLI/宿主 surface、数据状态和生命周期、默认/空/加载/错误/取消/权限/边界/竞态行为、成功失败边界、FR、AC、风险、开放问题、非目标和延期交接；不得把 plan/tasks 的工程拆分写成产品决策。
  - **范围边界**：本需求不新增 GUI 页面；规格缺口通过 build-spec 唯一 spec-clarify 处理，不能由 build-spec 猜方向。
  - **依据**：`R-002`、`D-002`、`D-006`、`PFACT-002`；source_status=`current`。
  - **场景**：SCN-009、SCN-010。
  - **验收**：AC-012。

- **FR-HANDOFF-001**：build-code 必须在所有 phase 完成、最终测试和 AC trace 准备后，执行明确的 final integration review；review findings 处置和 focused repair 完成后，才进入既有 integration 发布合同。
  - **范围边界**：integration review 不读取累计 diff、raw log 或完整仓库；不新增 review skill 或质量 gate。
  - **依据**：`R-009`、`D-008`、`PFACT-009`；source_status=`current`。
  - **场景**：SCN-011。
  - **验收**：AC-013。

### build-plan 最终跨材料检查（PLAN-ANALYZE）

- **FR-PLAN-001**：build-plan 在 review-plan findings 处置和最后一次 plan/tasks 修订完成后、publish-plan-result 前，必须复用现有 `spec-analyze`（用户称 `speckit-analyze`）对当前任务的原始需求索引、decision-log disposition、spec、plan、tasks 做一次严格 report-only 一致性检查。检查必须覆盖 R/D/FR/AC、用户流程/状态/成功失败边界/非目标、全部 `DEFER-*` 和 `OPEN-*` 的 owner/触发/去向/关闭条件，以及每个任务的验证 oracle。
  - **范围边界**：复用现有 report-only packet 投影和完整性校验，不读取旧 snapshot、旧 report、历史 task 或仓库外文件；不新增 ledger、receipt、状态机、public command 或 quality gate。当前已有的中段 spec-analyze 不能代替本次最终检查。
  - **依据**：`R-021`、`D-017`、`PFACT-014`；source_status=`current`。
  - **场景**：SCN-016。
  - **验收**：AC-022。

### cleanup 与治理边界（GOV）

- **FR-CLEANUP-001**：dirty cleanup 必须先显示路径、原因摘要、动作和风险；只有用户明确同意具体范围后，才可使用现有 authorize cleanup。用户未同意、路径不明确或授权失败时保持 recommended/pending/failed，不做删除、stash、commit 或覆盖。
  - **范围边界**：本需求只定义建议和同意边界，不自动替用户判断“可删除”。
  - **依据**：`R-014`、`D-004`、`PFACT-010`；source_status=`current`。
  - **场景**：SCN-002、SCN-012。
  - **验收**：AC-014。

- **FR-GOV-001**：所有新增行为必须复用现有四材料、facts、quality/review records、host surface、stage contracts 和 authorize boundary；不得新增维护对象、public ask/resume 命令、研究库、review 控制面、provider lifecycle、替代 ledger、历史迁移对象或质量 gate。
  - **范围边界**：必要字段只能进入已有事实/材料，并必须有真实 consumer、owner、替代关系和删除条件；无 consumer 的内容不保留。
  - **依据**：`R-001`、`R-003`、`R-010`、`D-001`、`D-010`、`PFACT-002`；source_status=`current`。
  - **场景**：SCN-001、SCN-003、SCN-013。
  - **验收**：AC-015。

## 6. 模块划分

### 任务启动与 candidate

- **负责什么**：在 make-decision 启动时读取 target 状态、准备 candidate、记录 dirty 事实和绑定 task identity。
- **对外提供什么**：workspace ready、dirty 诊断和 candidate 基线；不把 dirty 误报成 clean 或阻止启动。
- **依赖谁**：现有 task manifest/store、workspace 和事实记录。
- **测试边界**：SCN-001、SCN-002、SCN-013；对应 AC-001、AC-002。

### 交互宿主面

- **负责什么**：显示 ask、waiting-for-user、真实 reply、resume/re-rank 和错误回复结果。
- **对外提供什么**：Talk、spec-clarify、Grill 的可观察交互生命周期；不创建 public ask/resume API。
- **依赖谁**：现有 host seam、阶段技能和 interaction completion record。
- **测试边界**：SCN-004、SCN-010；对应 AC-004、AC-005。

### 阶段编排与交接

- **负责什么**：校验 make-decision 顺序、build-spec 条件调研 owner、唯一 Clarify 归属和 build-code final integration 时点。
- **对外提供什么**：下一步、阻断原因、交接材料和未决/延期信息。
- **依赖谁**：四份当前材料、现有 stage contracts、quality facts。
- **测试边界**：SCN-003、SCN-005、SCN-009、SCN-011；对应 AC-003、AC-011、AC-012、AC-013。

### build-plan 最终一致性检查

- **负责什么**：在最后一次 plan/tasks 修订后调用既有 report-only `spec-analyze`，把 decision-log 的来源/分类/延期/未决和三份下游材料放入同一当前分析输入并报告缺口。
- **对外提供什么**：最终一致性 finding、incomplete/unavailable 或“无一致性问题”的事实；不提供 provider review pass，不决定是否继续，不创建新的权限或状态。
- **依赖谁**：现有 report-only packet 投影、完整性校验、build-plan step 顺序和 contract tests。
- **测试边界**：SCN-016；对应 FR-PLAN-001、AC-022；必须覆盖最终调用顺序、DEFER/OPEN 双向追踪和缺输入失败语义。

### wh-review 与 3rd-review 适配

- **负责什么**：冻结最小 packet，加载阶段特有提示和合同，调用可信 broker，保存公开终态和 provenance。
- **对外提供什么**：真实 findings/advice、route/coverage、失败分类和处理状态。
- **依赖谁**：现有 stage material allowlist、wh-review skill、3rd-review broker。
- **测试边界**：SCN-006、SCN-007、SCN-008；对应 AC-006、AC-007、AC-008、AC-009、AC-010、AC-016。

### cleanup consent

- **负责什么**：给出 dirty 处理建议并承接用户明确授权。
- **对外提供什么**：recommended → user-consented → explicitly-authorized → completed/failed 的可观察结果。
- **依赖谁**：现有 authorize cleanup。
- **测试边界**：SCN-012；对应 AC-014。

## 7. 关键实体

- **Task / CandidateWorkspace**：代表当前任务及其从启动时 HEAD 得到的候选工作区；task identity 必须稳定，target dirty 与 candidate 状态分开。
- **Interaction completion record**：代表一次 Talk、spec-clarify、Grill 或 aggregate 的有限结构化完成事实；至少能绑定 interaction type、card/round/reply 和当前阶段需要的顺序证据，不保存完整聊天。
- **Review packet**：代表一次阶段特定的冻结材料集合；包含 allowlist、manifest/hash、material_id、snapshot_tree 和可复核的阶段提示/合同。
- **Review fact**：代表 provider 的一次真实 attempt/result/report 及其 route、coverage、transport、findings 和 provenance；状态可为 not-run、available-with-findings、available-empty-findings 或 unavailable。
- **Decision / Specification**：分别代表 decision-log 和 spec.md 的当前产品事实；旧版本只读保留，不能替代当前材料。
- **Cleanup authorization**：代表用户对明确路径和动作的授权；没有它不允许执行不可逆 cleanup。

## 8. 数据和生命周期

- **数据粒度**：一条 workspace fact 代表一次目标状态诊断；一条 interaction fact 代表一次交互完成证明；一条 review fact 代表一个实际冻结 packet 的一次 provider 终态；一份四材料代表当前产品/工程交接内容。
- **数据时效**：target dirty fact 在启动时记录；candidate 绑定启动时 HEAD；review advice 绑定实际被审 material/snapshot，不因记录性材料变化自动失效；build-code review 绑定当前实现。
- **决策记录时效**：每个 make-decision step 的增量写入同一份当前 decision-log；最终回放补齐来源去向，但不另建需求副本。记录性 hash 变化只表达材料 revision，不改变非 build-code advice 的有效 provenance。
- **缺失或迟到**：缺 workspace、reply、packet、provider 最终结果、必要材料或当前绑定时显示 unknown/unavailable/incomplete；同 task 可继续修复，但不能发布对应完成结论。
- **预览与正式**：Talk/Grill/Clarify 的 waiting 卡和 review 的 provider 进行中状态不是正式完成；只有真实 reply、真实 provider 终态和现有 stage contract 允许的发布结果才能进入正式事实。
- **当前与历史**：当前四材料和当前 task facts 是工作真相；旧 task、旧 attempt、旧 report、旧 snapshot immutable，只能作审计参考。
- **归属与清理**：现有 TaskHandle/quality 记录持有事实；bundle staging 的临时物按既有安全清理边界处理，不扩展长期 retention；cleanup 只由现有 authorize 负责。
- **最终一致性事实**：build-plan 最终 `spec-analyze` 只读取当前 task 的五项输入并产生 report-only finding/incomplete；它不写第五份材料、不替代 review、不改变任何完成 predicate。

## 9. 兼容性预留

- **既有消费方**：status、stage runner、四材料交接、wh-review、3rd-review broker 和现有 authorize 继续消费既有 refs/facts；没有新的控制面消费者。
- **命名预留**：保留 direction/detail、spec-clarify、Grill、phase、integration、advice、unavailable 等现有术语；不新增 successor/predecessor、rebind、continuation 或 replacement review 名称。
- **容器预留**：阶段 packet 允许按现有 allowlist 选择当前材料和必要 context map；缺少可选 map 不得逼迫扩包或阻止同 task 工作。
- **状态预留**：review 保留 available-with-findings、available-empty-findings、unavailable 的区分；所有 stage 都不把 provider `pass` 当作 review 要求；build-code 复用现有 finding adjudication 和当前实现绑定表达“无重要 findings”及停止/交接事实，不新增状态。
- **扩展边界**：后续可在现有 facts、contracts、测试和四材料中增加有真实 consumer 的字段；不得借本需求预留新数据库、新命令、新生命周期控制器或新质量门槛。

## 10. 明确不做与默认必须成立

### 明确不做

- 不迁移、重写、删除或伪造三个历史 task 的 review、snapshot、report、provider attempt 或验收状态（`D-001`、`D-009`）。
- 不把测试通过、文件完整、历史 review、旧 report 或 findings=[] 当作当前阶段完成（`D-009`、`D-014`）。
- 不把任何 stage advice 强行升级为 pass，不因记录性 snapshot 变化强制重审，不为清空 findings 重跑 unchanged review；build-code 只在当前可信结果没有重要 findings 时结束 review cycle（`D-015`、`D-018`）。
- 不新增 public ask/resume 命令、独立交互状态机、研究数据库、review 控制面、替代 ledger、provider lifecycle、continuation/recovery/rebind 对象或质量 gate（`D-007`、`D-008`、`D-010`）。
- 不把 Clarify 同时放在 make-decision 和 build-spec；make-decision 不实现 build-spec 的 spec-clarify（`D-006`）。
- 不让 build-spec 重新决定产品方向；实现事实调研归 build-plan（`D-008`）。
- 不修改 WorkflowHub 宪法或检查清单，不在本需求中实现被审查的业务产品代码（`D-001`、`D-010`）。
- 不因 dirty main 自动 stash、commit、delete、reset、覆盖或阻止 candidate 创建；cleanup 必须用户明确同意（`D-004`）。
- 不把 Grill 当作 provider review，不为 Grill 单独生成 review 结果或质量结论（`D-005`、`D-013`）。

### 默认必须成立

- 当前四材料是唯一产品/交接真相；quality facts、review、test、history 和 inventory 只提供事实，不产生额外推进许可（`FR-GOV-001`、`AC-015`）。
- 异源 provider 只能看到冻结 packet 中列出的材料；任何路径错误、未终态或完整性错误都必须在结果中如实可见（`FR-REVIEW-001`、`FR-REVIEW-002`、`AC-006`、`AC-007`）。
- 用户始终能知道自己是在等待用户回复、等待 provider 终态、处理 findings，还是等待明确授权；系统不能用沉默表示成功（`FR-INTERACT-002`、`FR-REVIEW-002`、`AC-004`、`AC-007`）。
- “所有 stage 不需要 pass”不等于“失败可以当建议”；只有可信 provider 最终结果才是 advice，unavailable 仍是 unavailable；build-code 的“没有重要 findings”也必须来自可信当前结果（`FR-REVIEW-003`、`FR-REVIEW-009`、`AC-008`、`AC-023`）。

## 11. 验收标准

- [ ] **AC-001**：dirty target 启动后仍能创建 candidate，且 target 的文件、index、HEAD、stash 和分支没有被改动。
  - **需求**：FR-START-001、FR-START-002
  验证：真实 dirty target 场景，比较启动前后 target 状态并读取现有 workspace/dirty fact。
  - **通过条件**：workspace ready；dirty fact 含 ref、HEAD、dirty 标记、有限摘要和建议；candidate 只绑定启动时 HEAD。
  - **失败条件**：dirty 阻止创建、dirty 文件进入 candidate、或系统自动 stash/commit/delete/覆盖。
  - **证据类型**：`test` + `evidence`

- [ ] **AC-002**：只有 make-decision 正式启动入口创建 workspace，重复调用和其他调用方不会创建第二个 workspace。
  - **需求**：FR-START-001
  验证：调用 task-bootstrap、make-decision、status、confirm、下游入口和 wh-review 的组合契约场景。
  - **通过条件**：创建 owner 唯一；已有 workspace 被复用；无 workspace 的非启动入口给出明确结果。
  - **失败条件**：调用方各自 prepare、wh-review 旁路创建、重复 workspace 或隐式创建。
  - **证据类型**：`test`

- [ ] **AC-003**：make-decision 只接受完整且当前的 canonical 顺序。
  - **需求**：FR-INTERACT-001
  验证：正向顺序和方向 review、Grill、detail review 乱序/缺项/旧 ref 的负向契约场景。
  - **通过条件**：只接受 Talk Round 1 → research → Talk Round 2 → direction → Talk Round 3 → Grill → draft → detail → confirmation → publish；Grill 没有 review 结果身份。
  - **失败条件**：仅因两个 review ref 存在、文件完整或历史记录存在就发布当前完成。
  - **证据类型**：`test` + `evidence`

- [ ] **AC-004**：Talk、spec-clarify、Grill 各有真实 ask → wait → user reply → resume/re-rank 契约。
  - **需求**：FR-INTERACT-002
  验证：三类 host seam 真实生命周期契约测试，覆盖无回复、错 card、错 round、错 hash、部分回复和成功回复。
  - **通过条件**：ask 后可观察 waiting-for-user；匹配回复才恢复并重新排序；错误回复不能推进；有限 interaction fact 可被现有消费者读取。
  - **失败条件**：只断言最终 JSON、模拟回复绕过等待、错误回复推进、或必须新增 public ask/resume/完整聊天归档。
  - **证据类型**：`test` + `evidence`

- [ ] **AC-005**：spec-clarify 只有 build-spec 一个 owner，make-decision 不重复执行同一 Clarify。
  - **需求**：FR-INTERACT-003
  验证：含规格歧义和无歧义两种 build-spec 场景，并检查 make-decision 的阶段步骤和现有 interaction fact。
  - **通过条件**：有歧义时走 spec-clarify 的真实生命周期；无歧义时记录 trigger=false 和理由；方向/实现问题分别回正确阶段。
  - **失败条件**：两个阶段各问一套、build-spec 猜方向、或 make-decision 继续拥有重复 Clarify。
  - **证据类型**：`test` + `evidence`

- [ ] **AC-006**：每个 review stage 只向 broker 发送其 allowlist 内的最小、冻结、path-safe packet，并使用阶段特有提示/合同。
  - **需求**：FR-REVIEW-001、FR-REVIEW-002
  验证：对 direction、detail、phase、integration 分别检查 manifest、hash、material_id、snapshot_tree、阶段提示和 packet 内容；使用 provider-visible bundle 视角。
  - **通过条件**：材料完整、路径安全、阶段边界正确；通用 3rd-review 被调用一次；没有累计 diff、raw log、完整仓库或重复 planning artifacts。
  - **失败条件**：provider 需要猜相对/绝对路径、重试读取失败路径、材料超出 allowlist、阶段提示缺失或调用方可任意指定 provider/路径。
  - **证据类型**：`test` + `evidence`

- [ ] **AC-007**：provider 没有可信最终公开结果时，系统保持真实 unavailable/失败事实。
  - **需求**：FR-REVIEW-002、FR-REVIEW-006
  验证：对 PROCESS_DEAD、SIGTERM、timeout、路径错误、坏 JSON、transport failure、SAME_SOURCE、profile mismatch 和中止场景注入/回放公开结果。
  - **通过条件**：保留实际 route、attempt、终态、诊断和错误分类；不存在伪造的 findings=[]、review passed 或 stage completed。
  - **失败条件**：失败被解释成业务 finding、空 findings、通过，或静默 fallback/无限 retry。
  - **证据类型**：`test` + `evidence`

- [ ] **AC-008**：所有 review stage 获得可信异源 findings/advice 即按现有阶段合同处理，不要求 provider `pass` 或 findings=[]；build-code 另按 AC-023/AC-024 严格收口重要 findings。
  - **需求**：FR-REVIEW-003
  验证：分别提供非空 findings、真实 empty findings、unavailable、build-code 当前结果含重要 finding、修复后无重要 finding 和 minor-only 结果，观察状态和可见 handoff。
  - **通过条件**：任何 stage 都不以 provider `pass` 作为要求；非 build-code findings 非空不被当失败，也不被强行清空；unavailable 不被当 advice；build-code 只有当前可信结果没有重要 finding 时才结束 review cycle，minor advice 可以保留。
  - **失败条件**：为得到 pass 重复调用 review，或把 unavailable/非空 findings 伪造为 pass/无重要 findings，或让 build-code 带着当前 actionable major/blocking finding 结束。
  - **证据类型**：`test` + `evidence`

- [ ] **AC-009**：非 build-code advice 不因记录性 snapshot 变化自动重审。
  - **需求**：FR-REVIEW-004
  验证：先保存 direction/detail/build-spec/build-plan advice，再只追加 confirmation、interaction aggregate 或其他记录性事实，重新读取阶段状态。
  - **通过条件**：旧 advice 仍显示其 reviewed material/snapshot/provenance；不新建 attempt、不标 stale、不要求新 provider 调用。
  - **失败条件**：只因记录性变化就要求重审、丢弃旧建议、或把旧建议改写成当前 build-code 无重要 findings。
  - **证据类型**：`test` + `evidence`

- [ ] **AC-010**：build-code review 仍严格绑定当前实现和测试事实，但不要求 provider `pass`。
  - **需求**：FR-REVIEW-005
  验证：改变实现或测试绑定后读取旧 review，再提供当前 review；覆盖当前树一致和不一致场景。
  - **通过条件**：旧 review 不能代替当前实现的 review 事实和重要 finding 收口；非 build-code advice 的宽松 freshness 规则不会泄漏到 build-code。
  - **失败条件**：旧 snapshot/report 被当作当前 build-code 的无重要 finding 事实，或为了修复非 build-code advice 而取消实现 review 的严格绑定。
  - **证据类型**：`test` + `evidence`

- [ ] **AC-011**：build-spec 条件调研有唯一 owner，并诚实记录 executed/skipped/unavailable。
  - **需求**：FR-SPEC-001
  验证：分别使用“现有事实足够”“存在规格事实缺口”“调研能力不可用”三种场景。
  - **通过条件**：仅 build-spec 触发规格型调研；复用当前 facts/materials；每种结果都有理由；不新增 research object 或 completion gate。
  - **失败条件**：build-spec 猜事实、方向由 build-spec 改写、实现调研被误归 build-spec、或 unavailable 被伪造成已完成。
  - **证据类型**：`test` + `evidence`

- [ ] **AC-012**：spec.md 覆盖完整流程、surface、状态、边界、FR/AC、非目标、风险、open 和延期交接。
  - **需求**：FR-SPEC-002
  验证：逐项对照当前 decision-log 的 R/D/DEFER，并检查每个 FR/AC 的来源、场景、PFACT 和可观察 oracle。
  - **通过条件**：不丢失已确认选择；没有新增方向；规格歧义进入唯一 spec-clarify 或明确 OPEN；不把 plan/tasks 工程细节写成产品事实。
  - **失败条件**：页面范围被扩成 GUI、成功只靠文件存在/测试绿、或延期项没有 owner、触发和验收。
  - **证据类型**：`evidence` + `manual`

- [ ] **AC-013**：build-code 的 final integration review 位置、输入和失败交接明确。
  - **需求**：FR-HANDOFF-001、FR-REVIEW-005
  验证：读取 build-code 阶段交接并执行含 phase 完成、fresh tests、AC trace、integration finding 和 focused repair 的顺序场景。
  - **通过条件**：integration review 在最终测试和 AC trace 后执行，使用最小 approved spec/AC/test/trace packet，并复用既有 review contract；finding 未处置时不发布完成。
  - **失败条件**：final integration 被隐藏在泛化步骤、审查累计 diff/完整仓库、或跳过当前实现绑定。
  - **证据类型**：`test` + `evidence`

- [ ] **AC-014**：cleanup 只有用户明确同意具体路径和动作后才执行。
  - **需求**：FR-CLEANUP-001
  验证：先检查未同意、范围模糊、授权失败，再检查明确同意的正向场景。
  - **通过条件**：未同意时只显示建议和风险；同意后复用既有 authorize 并留下动作结果；不自动 stash/commit/delete/reset。
  - **失败条件**：系统自行清理、扩大路径、用 dirty 诊断推断用户意图或把建议显示成已完成。
  - **证据类型**：`test` + `manual`

- [ ] **AC-015**：统一修复不新增维护对象、public ask/resume、review 控制面、provider lifecycle、研究库或 quality gate。
  - **需求**：FR-GOV-001
  验证：对新增/修改的字段、记录、命令、阶段步骤和 completion predicate 做 consumer/owner/替代/删除条件审计，并检查宪法清单。
  - **通过条件**：全部改动落在现有四材料、facts、quality evidence、stage contract、host seam 或 authorize 边界；没有第二真相或额外 gate。
  - **失败条件**：出现无 consumer 的持久对象、旁路命令、重复 ledger、永久 compatibility bridge 或新质量门槛。
  - **证据类型**：`evidence`

- [ ] **AC-016**：历史 attempt、旧 snapshot、旧 report 和 provider 失败事实不能冒充当前正式审查。
  - **需求**：FR-REVIEW-006
  验证：将历史 refs 与当前材料、当前 confirmation、当前 interaction facts 混合，检查当前阶段读取和发布结果。
  - **通过条件**：历史仍可审计但不能替代当前身份；失败仍是失败；当前 advice 只绑定实际 reviewed material/provenance。
  - **失败条件**：历史 review、测试通过、文件完整或旧 report 导致当前 stage completed/验收通过。
  - **证据类型**：`test` + `evidence`

- [ ] **AC-017**：每个现有 make-decision step 都在同一份 decision-log 留下连续更新，并在最终确认前完成原始需求回放。
  - **需求**：FR-DECISION-001
  验证：按当前 `decision-log.md` step 表的 13 个 step 逐步检查同一 `decision-log.md` 的更新；分别覆盖有新增需求、无新增需求、真实用户回答、延期交接和写入失败场景，再检查最终回放的来源分类和下游绑定。
  - **通过条件**：13 个 step 都有本步更新；无新增时明确写 `no-new-requirement` 和事实理由；每条来源都标记 current/deferred/non-goal/evidence-only 并绑定 D/规格验收/交接；写入失败保持当前 step 未完成；没有第二份 ledger、replacement object 或新 gate。
  - **失败条件**：只在最后汇总、漏记用户回答/关键事实/延期去向、把历史记录补成当前完成、写入失败仍自报完成，或记录性更新自动触发非 build-code advice 重审。
  - **证据类型**：`test` + `evidence` + `manual`

- [ ] **AC-018**：Grill 采用当前独立前沿问题组语义，且不影响 Talk 和 review 的职责边界。
  - **需求**：FR-INTERACT-004
  验证：提供多个互不依赖问题、部分回答、依赖/冲突和无前沿问题场景，检查问题编号、推荐、未答项重排、最小澄清和退出检查。
  - **通过条件**：独立问题可一组呈现；部分回答不丢失；只追问未答或最小澄清；Talk 仍一次一题；Grill 不生成 provider review、独立 ledger 或新 gate。
  - **失败条件**：把 Grill 固定成一次一个、把依赖问题混成大问卷、丢失部分回答、用 Grill 代替 review，或为批量语义新增控制面。
  - **证据类型**：`test` + `evidence` + `manual`

- [ ] **AC-019**：Talk 用大白话给出选项、后果和风险，并把用户看到的这三类信息保留在同一份 decision-log。
  - **需求**：FR-INTERACT-005
  验证：检查 Talk 卡片的每个选项都包含 plain-language consequence/risk；用户回复后检查 decision-log 没有只留下裸编号；覆盖无新增需求和真实回复场景。
  - **通过条件**：用户能直接理解每个选择会带来什么、可能失去什么和主要风险；记录可回放到原始需求和决定。
  - **失败条件**：只给技术术语、只给推荐不讲后果/风险、或只保存 `1/2/3` 而丢掉解释。
  - **证据类型**：`test` + `evidence` + `manual`

- [ ] **AC-020**：每个 review stage 的阶段特有 prompt/skill/contract 都明确关注点、排除项和 finding 证据要求。
  - **需求**：FR-REVIEW-007
  验证：分别检查 direction、detail、build-spec、build-plan、phase、integration 的 provider-visible instructions 和允许材料。
  - **通过条件**：阶段关注点在当前 packet 中可读，且和通用 broker 调用绑定；缺失时报告 material incomplete，不以文件存在代替。
  - **失败条件**：所有阶段只复用一段通用文案、阶段 prompt 为空、或关注点只能靠 provider 猜。
  - **证据类型**：`test` + `evidence`

- [ ] **AC-021**：慢、卡、终止、无最终文本和真实空结果被严格区分，并记录 timeout/kill、route、coverage 和 group outcome 的真实可读事实。
  - **需求**：FR-REVIEW-008
  验证：回放持续 thinking/tool、SIGTERM/PROCESS_DEAD、timeout、path/transport failure、坏 JSON、真实 empty findings 和 route/coverage 降级场景。
  - **通过条件**：每种终态有真实分类和诊断；没有最终文本就 unavailable/incomplete，不生成 findings=[]、pass 或 stage completed；接口缺失时不猜。
  - **失败条件**：把卡住当空结果、静默 fallback、无限 retry、补写 duration/coverage 或新增 provider lifecycle。
  - **证据类型**：`test` + `evidence`

- [ ] **AC-022**：build-plan 在最后一次 plan/tasks 修订和 findings 处置之后、publish 前，真实调用一次严格 `spec-analyze`，完成原始需求 ↔ decision-log ↔ spec ↔ plan ↔ tasks 的完整检查。
  - **需求**：FR-PLAN-001
  验证：顺序测试证明最终调用发生在 findings disposition 之后；反例分别漏掉 R/D/DEFER/OPEN、流程/边界/非目标或任务 oracle 时必须产生 finding/incomplete；显式标为历史/非目标/延期且有 owner/去向时通过 report-only 检查。
  - **通过条件**：五项当前输入来自同一 task，全部 `DEFER-*`/`OPEN-*` 有去向；结果可回看且只作为既有 quality fact，不创建第五份材料、不新增 gate、不经过 3rd-review。
  - **失败条件**：只检查 FR/AC、只在中段调用、漏掉延期/未决、调用旧材料、分析不可用仍宣称完整，或把分析结果当 provider pass。
  - **证据类型**：`test` + `evidence` + `manual`

- [ ] **AC-023**：所有 review stage 都只产可信异源 advice fact，不要求或伪造 provider `pass`。
  - **需求**：FR-REVIEW-003、FR-REVIEW-009
  验证：回放 direction、detail、build-spec、build-plan、build-code phase 和 integration 的 available-with-findings、available-empty-findings、unavailable，以及 build-code 当前有/无 actionable serious finding 的结果。
  - **通过条件**：没有任何 stage 因 provider 没写 `pass` 而被判 review 失败；unavailable 仍是 unavailable；build-code 的结束依据是当前可信结果没有重要 findings，而不是 `pass` 字段。
  - **失败条件**：为得到 `pass` 无限重审、把 unavailable 当无重要 finding，或把 provider `pass` 当作新的统一质量 gate。
  - **证据类型**：`test` + `evidence`

- [ ] **AC-024**：build-code 只在当前可信 review 没有 `actionable` 的 `major|blocking` finding 后结束 review cycle，并对重审设实际变化边界。
  - **需求**：FR-REVIEW-005、FR-REVIEW-009
  验证：先得到重要 finding，再做真实 focused repair 和当前测试/AC trace，随后只调用一次 focused review；再回放同一 finding 重复、仅记录性变化、无最终 provider 文本和 minor-only 结果。
  - **通过条件**：重要 finding 未清除时不能结束；实际修复后可重审；minor/nonblocking advice 可以保留；重复 finding、无实际主题变化或 provider 无可信终态时停止自动循环并保留 needs_human/unavailable/incomplete，不要求或生成 pass。
  - **失败条件**：旧 review 冒充当前无重要 finding、记录性 snapshot 变化触发重审、没有修复就无限重审，或把 provider 失败改成 clean。
  - **证据类型**：`test` + `evidence` + `manual`

### 延期与未决逐项承接索引

以下只是跨材料追踪索引，decision-log 的延期/未决表仍是来源；任何一项都不能只留在 decision-log 而没有明确下游去向。

| ID | 当前分类 | spec 承接 | plan/tasks 去向 | 关闭/保留边界 |
| --- | --- | --- | --- | --- |
| DEFER-001 | deferred | dirty fact/摘要边界 | P1/T001-T002 | 复用现有 fact；无新对象 |
| DEFER-002 | deferred | 三类真实交互 | P2/P3/T003-T006 | 现有 host seam；失败保持 incomplete |
| DEFER-003 | deferred | build-spec 条件调研 | P3/T005-T006 | executed/skipped/unavailable |
| DEFER-004 | deferred | build-code integration | P3/T005-T006 | phase_id=null 既有合同 |
| DEFER-005 | deferred | 阶段关注点/终态/Grill | P2/P4/T003-T004/T007-T008 | 不 fallback、不加 provider lifecycle |
| DEFER-006 | evidence-only/non-goal | 历史 task 只读边界 | P5/T009-T010；不产生实现 task | 不改写、不重审历史 |
| DEFER-007 | deferred | advice freshness | P4/T007-T008 | record-only 不重审；build-code 仍严格 |
| DEFER-008 | deferred | step update/最终回放 | P2/P5/T003-T004/T011 | 同一 decision-log；不建 ledger |
| DEFER-009 | current handoff | 最终 spec-analyze | P5/T009-T010/T011 | report-only；不新增完成 gate |
| OPEN-001 | open | dirty fact 字段 | P1/T001-T002 | 与现有 validator 对齐 |
| OPEN-002 | open | build-spec 条件调研 fact key/step_id | P3/T005-T006 | 与现有结构对齐 |
| OPEN-003 | open | broker timeout/kill | P4/T007-T008 | 读不到就 unavailable，不猜 |
| OPEN-004 | open/user-owned | cleanup 路径 | P1/T001-T002 | 需明确同意；当前 main 无路径 |
| OPEN-005 | open | confirmation/advice binding | P2/P4/P5/T003-T008/T011 | 保留 provenance，不因记录性变化重审 |
| OPEN-006 | evidence-only/open | 历史 Talk 队列缺口 | P5/T009-T011；不改写历史 | 只补当前 seam 证据 |

## 12. 风险、未决与交接

- **RISK-001**：现有 host seam 可能无法在不新增 public ask/resume 或持久对象的条件下完成三类真实 roundtrip。
  - **受影响 ID**：PFACT-004、FR-INTERACT-002、AC-004、AC-005
  - **触发条件**：真实契约测试无法绑定 card/round/hash，或匹配回复不能触发 resume/re-rank。
  - **后果**：用户看到的可能只是文档声明，仍会出现卡住、错回或乱序。
  - **缓解或 STOP**：build-plan/build-code 先验证现有 seam；若必须新增 public 控制面、独立状态机或完整聊天归档，则 STOP，保持 incomplete/unknown 并报告宪法冲突。
  - **处理 Stage**：`build-plan` / `build-code`
  - **验证**：三类真实 ask → wait → reply → resume 契约测试和有限 interaction fact。

- **RISK-002**：阶段 allowlist 过小可能让 provider 缺少必要上下文。
  - **受影响 ID**：FR-REVIEW-001、AC-006
  - **触发条件**：provider findings 反复暴露 packet 内无法判断的关键事实。
  - **后果**：建议质量下降或用户需要不必要重跑。
  - **缓解或 STOP**：先补阶段特有 prompt/contract 或现有 context map；只有当前阶段合同明确需要时才增加 allowlist，不能直接发送完整仓库。
  - **处理 Stage**：`wh-review` / `build-plan`
  - **验证**：packet 内容审计、provider coverage 和 finding anchor。

- **RISK-003**：用户可能把“所有 stage 不要求 pass”误解为“provider 失败也算建议”，或把 build-code 没有重要 findings 误解成 provider pass。
  - **受影响 ID**：FR-REVIEW-002、FR-REVIEW-003、FR-REVIEW-006、FR-REVIEW-009、AC-007、AC-008、AC-023、AC-024
  - **触发条件**：无最终文本或 transport failure 被转换成空 findings。
  - **后果**：用户无法区分没有问题和没有得到意见。
  - **缓解或 STOP**：保留 unavailable、原因、route、attempt 和公开诊断；没有可信终态就不称为 advice。
  - **处理 Stage**：`wh-review` / `3rd-review`
  - **验证**：失败注入和结果分类契约测试。

- **RISK-004**：dirty 摘要可能被误当成用户清理意图。
  - **受影响 ID**：FR-START-002、FR-CLEANUP-001、AC-001、AC-014
  - **触发条件**：系统把生成物猜成可删除，或把 tracked 改动自动带入。
  - **后果**：破坏用户数据、污染 candidate provenance。
  - **缓解或 STOP**：只记录事实和建议；任何不可逆操作必须等待明确路径级同意和既有 authorize。
  - **处理 Stage**：`build-plan` / `build-code`
  - **验证**：dirty target、未同意 cleanup 和明确同意 cleanup 的对照场景。

- **RISK-005**：逐 step 更新可能让 decision-log 变长，并让记录性 material hash 更频繁变化。
  - **受影响 ID**：FR-DECISION-001、FR-REVIEW-004、AC-009、AC-017
  - **触发条件**：每一步重复复制完整背景，或运行时把记录性变化误当成被审主题变化。
  - **后果**：需求记录变得难读、审查包膨胀，或非 build-code advice 被无意义地重审。
  - **缓解或 STOP**：只写紧凑 step delta；无新增需求写 `no-new-requirement` 和理由；完整回放只在最终确认前做一次；advice 保留实际 provenance，不因记录性变化重审。
  - **处理 Stage**：`build-plan` / `build-code` / `wh-review`
  - **验证**：连续更新、日志长度边界、advice freshness 和失败写入场景的契约事实。

- **RISK-006**：最终跨材料分析如果仍只检查 FR/AC、在中段运行或没有带入 DEFER/OPEN，就会再次出现“结构通过但需求遗漏”。
  - **受影响 ID**：`R-021`、`FR-PLAN-001`、`AC-022`、`DEFER-009`
  - **触发条件**：第 11 步修订后没有最终调用，或五项输入不是同一当前 task，或 analyzer 不能读到延期/未决集合。
  - **后果**：build-plan 可能错误宣称材料链完整，下游继续跑偏。
  - **缓解或 STOP**：复用现有 `spec-analyze`，扩展同一 projection/validator，publish 前运行一次；缺输入或发现缺项保持 finding/incomplete，不用人工“看起来完整”替代。
  - **处理 Stage**：`build-plan` / `build-code`
  - **验证**：反例漏掉 R/D/DEFER/OPEN、流程/边界/非目标或 task oracle；正例明确分类并绑定去向；顺序测试证明调用晚于 findings disposition。

- **RISK-007**：build-code 可能因为 provider 反复提出重要 finding 而无限重审，造成路线漂移、时间和 token 浪费。
  - **受影响 ID**：`R-022`、`FR-REVIEW-005`、`FR-REVIEW-009`、`AC-023`、`AC-024`
  - **触发条件**：没有实际修复却再次调用 review，或只因记录性 snapshot/hash 变化就重审；同一 finding 重复出现仍自动循环。
  - **后果**：build-code 失去明确终点，审查意见反过来改变已经确定的路线。
  - **缓解或 STOP**：每个重要 finding 只在实际修复或主题真实变化后做一次 focused review；重复、无变化或无终态就停止自动循环，保留 needs_human/unavailable/incomplete；不新增 loop controller、pass gate 或新状态对象。
  - **处理 Stage**：`wh-review` / `build-code`
  - **验证**：重要 finding → focused repair → 一次复查、重复 finding、record-only 变化、minor-only 和 provider unavailable 场景。

- **OPEN-001**：target dirty fact 的最终字段名、摘要大小和分类枚举。
  - **受影响 ID**：FR-START-002、AC-001、AC-002
  - **owner**：build-plan
  - **影响**：影响事实兼容性和摘要可读性，不改变 dirty 不阻止/不带入原则。
  - **处理 Stage**：`build-plan`
  - **关闭条件或 STOP**：与现有 fact validator/fixture 对齐并能证明 target ref、HEAD、status digest、分类摘要和建议；没有新对象。

- **OPEN-002**：build-spec conditional research 的具体 fact key 和 step_id。
  - **受影响 ID**：FR-SPEC-001、FR-SPEC-002、AC-011、AC-012
  - **owner**：build-spec
  - **影响**：影响条件调研事实能否被现有 spec-clarify 和阶段交接消费，但不改变“只在事实缺口时调研”的方向。
  - **处理 Stage**：`build-spec`
  - **关闭条件或 STOP**：与现有事实结构和阶段消费者对齐；若需要第二套研究来源、ledger 或新 gate 则 STOP。

- **OPEN-003**：broker 的 timeout/kill、group outcome 和 route readback 的具体接口。
  - **受影响 ID**：FR-REVIEW-002、FR-REVIEW-006、AC-006、AC-007
  - **owner**：wh-review/3rd-review
  - **影响**：影响失败分类和诊断完整性，但不能由 WorkflowHub 另造 provider lifecycle。
  - **处理 Stage**：`build-plan` / `build-code`
  - **关闭条件或 STOP**：沿用 3rd-review 公共请求合同读回真实终态；无法读回时保持 unavailable，不增加 fallback/retry 控制器。

- **OPEN-004**：本次任务当前 target main 的具体 cleanup 路径。
  - **受影响 ID**：FR-CLEANUP-001、AC-014
  - **owner**：用户
  - **影响**：当前只需要建议，不应代替用户决定清理内容。
  - **处理 Stage**：发现 dirty 时的现有 cleanup 流程
  - **关闭条件或 STOP**：用户明确同意具体路径和动作；当前没有明确同意就保持 pending。

- **OPEN-005**：本 decision-log 最终 human confirmation 与 advice 的绑定边界。
  - **受影响 ID**：FR-REVIEW-004、FR-REVIEW-005、AC-009、AC-010
  - **owner**：make-decision 收尾强校验；后续 wh-review/runtime 修复
  - **影响**：影响确认、interaction aggregate 和 advice provenance 的读取，但不应把 direction/detail advice 强行绑定到最新记录性 snapshot。
  - **处理 Stage**：`make-decision` 收尾 / `wh-review` / `runtime`
  - **关闭条件或 STOP**：官方 confirmation 与当前交互事实可校验，advice 保留实际 reviewed snapshot、material_id、attempt/result/report 和 route/coverage；record-only 变化不触发重审。

- **OPEN-006**：两个历史 Talk 队列的证据缺口。
  - **受影响 ID**：FR-INTERACT-001、AC-003、AC-004
  - **owner**：后续 build-plan/build-code 只补当前真实 seam 证据
  - **影响**：旧 T-003 开始队列无法追回，但不改变当前 direction/detail 已获得建议的事实，也不允许改写历史。
  - **处理 Stage**：`build-plan` / `build-code`
  - **关闭条件或 STOP**：当前真实 seam 有可回看的顺序和交互证据；历史缺口保持 evidence-only/open，不用新记录冒充旧事实。

## 13. 业务影响与回归范围

### 任务启动与交互

- **既有行为**：任务可从多个入口准备 workspace，dirty 可能直接阻止，最终 aggregate 可能掩盖中间交互。
- **本需求影响**：唯一入口负责启动；dirty 变成可见事实；用户能看到 waiting 和真实回复绑定；顺序错误直接暴露。
- **回归路径**：clean target、dirty target、重复启动、三类交互的成功/错误回复、direction/Grill/detail 乱序。
- **验收**：AC-001、AC-002、AC-003、AC-004、AC-005、AC-014。

- **可能受冲击的业务规则**：不触碰用户 main 改动、不新增交互公共命令、不把历史事实改写。
- **明确无影响**：任务 identity、现有四材料名称、现有 authorize 边界和历史记录只读规则保持不变。

- **既有行为**：decision-log 主要在阶段末汇总，途中细节可能只存在对话或人工记忆中。
- **本需求影响**：每个现有 make-decision step 都写同一份 decision-log，最后再做完整回放；不新增需求副本，也不把记录性变化变成 review 重跑理由。
- **回归路径**：13 个 step 的连续写入、有新增/无新增、写入失败、最终来源分类和下游交接。
- **验收**：AC-017。

### review 与阶段交接

- **既有行为**：review 可能携带过多材料、多个调用方解释不同、失败和空 findings 难区分，非 build-code advice 可能被错误要求当前 snapshot。
- **本需求影响**：packet 变小且阶段化；失败如实记录；所有 stage advice 保留实际 provenance，不因记录性变化重审；build-code 仍严格当前绑定，并以没有重要 findings 收口。
- **回归路径**：direction/detail/phase/integration packet、可信 broker 路由、PROCESS_DEAD/timeout/路径错误/坏 JSON、非空 findings、记录性变化、build-code 树变化。
- **验收**：AC-006、AC-007、AC-008、AC-009、AC-010、AC-016、AC-023、AC-024。

- **可能受冲击的业务规则**：所有 stage advice 不再被错误当作 pass gate；provider unavailable 仍会降低质量 claim；build-code 重要 finding 未清除时不能结束 review cycle。
- **明确无影响**：历史 review immutable 规则、3rd-review broker 的 provider lifecycle 所有权和现有重要 finding 分类不变；不新增质量 gate。

### build-spec 与 build-code

- **既有行为**：build-spec 的条件调研 owner 不清，spec-clarify 归属可能缺失；build-code final integration 时点不够显式。
- **本需求影响**：build-spec 成为规格事实调研和 spec-clarify 的唯一 owner；build-code 的最终 integration review 时点和输入可观察。
- **回归路径**：事实足够/不足/不可用的 build-spec、规格歧义、phase 完成后的最终测试/AC trace/integration review 顺序。
- **验收**：AC-005、AC-011、AC-012、AC-013。

- **可能受冲击的业务规则**：build-spec 不得代替 make-decision 决定方向；实现事实仍交 build-plan。
- **明确无影响**：本需求不新增 GUI、研究数据库、质量 gate 或业务产品实现。

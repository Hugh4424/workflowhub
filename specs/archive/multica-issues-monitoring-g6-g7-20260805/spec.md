# 处理组 6、7、8 的残留闭环

> 这份 spec 只讲要解决什么、用户要看到什么、做到什么算成功。实现文件、字段设计、命令和测试步骤放在 plan/tasks。

- **状态**：已冻结（scope revision 已完成）
- **来源**：R-001—R-011；D-001—D-019

## 速读卡

- **一句话需求**：让 WorkflowHub 能清楚记录组 6、7 的残留问题，并安全完成组 8 的登记校验；同时让每个阶段真的使用该用的技能，材料放在正确位置，spec 让人读得懂，plan/tasks 足够让普通执行模型照着做。
- **核心改动**：补齐残留事实和验证边界；修正 WorkflowHub 的材料、技能、沟通和 review 行为。
- **最大影响面**：五阶段工作流的当前材料、阶段结果、审查结果和测试证据；不新增产品页面。
- **验收信号**：用户能看懂当前要做什么，执行者不需要猜文件/顺序/测试，任何缺证据或不可用状态都不会被写成成功。

## 1. 要解决的问题

现在有四类实际麻烦：

1. 组 6、7 的一些问题看起来“有能力”，但缺少能证明它没有回潮的证据，或不同结果之间串不起来。
2. 组 8 的历史登记和仓库事实不一致；如果直接改归档正文，会污染历史。
3. 本次工作中，Grill 没有把结论和风险拿出来与用户确认；技能虽然列在清单里，也不能证明真的调用过；决策和规格文件还落在错误位置。
4. spec 写成了工程实现文档，正常读者看不懂；同时 review 建议被反复当成 pass 门槛，浪费时间。

## 2. 用户和完整流程

### SCN-001：用户确认方向

- **角色**：需求负责人
- **前置**：原始资料和当前事实已收集。
- **动作**：查看 Talk/Grill 用大白话列出的选择、后果和风险，确认或修改。
- **结果**：decision-log 只记录真实选择；没有真实回复就不声称已确认。

### SCN-002：用户阅读当前需求

- **角色**：需求负责人、实现负责人
- **前置**：方向已经确认。
- **动作**：阅读 spec。
- **结果**：只需理解目标、流程、范围、状态、成功/失败边界、非目标和延期，不需要阅读内部实现细节。

### SCN-003：执行者按计划工作

- **角色**：build-code 执行模型
- **前置**：build-plan 已完成完整 plan/tasks。
- **动作**：按 Phase 和 Task 顺序执行。
- **结果**：每项任务都有明确文件、注意点、测试层级、具体测试 skill、命令、预期退出码、oracle、证据和 STOP；执行者不需要重新设计。

### SCN-004：核对组 6 的阶段和测试证据

- **角色**：实现/验证负责人
- **前置**：某阶段声称完成或某测试失败。
- **动作**：查看基线、阶段证据、失败归因和测试占用。
- **结果**：能区分 integration baseline、实现快照基线和检查失败归属；证据缺失、顺序不对、失败归因不明或 lease 未释放时显示失败或 incomplete。

### SCN-005：追踪组 7 的 provider review

- **角色**：review 负责人
- **前置**：provider 成功、失败、重试或修正发生。
- **动作**：查看请求、prompt、round、前序结果、attempt/result 和指标。
- **结果**：每次尝试都保留，重试不会覆盖原始失败；失败分类前后一致；指标覆盖全部尝试而不是只看最后一次。

### SCN-006：校验组 8 的历史登记

- **角色**：inventory/architecture 维护者
- **前置**：冻结清单与仓库存在差异。
- **动作**：更新登记并执行 retention/unchanged 校验。
- **结果**：登记反映真实文件；归档正文 hash 不变；运行时仍不读取历史 inventory；失败时明确显示差异。

### SCN-007：处理失败、取消和竞态

- **角色**：需求负责人或验证负责人
- **前置**：provider 不可用、测试失败、用户取消、材料变化或并发占用发生。
- **动作**：继续、修复、取消或重新确认。
- **结果**：原始失败和取消事实保留；没有确认/授权不做不可逆操作；快照、材料或 lease 不一致时 fail-loud。

### SCN-008：按真实改动选择测试并反向验证

- **角色**：普通 build-code 执行模型、verify-code 验证模型
- **前置**：build-plan 已写出每个 Phase 和最终测试的预判 tier/skill；某 Phase 已产生真实代码改动。
- **动作**：build-code 检查 changed files；范围变化时重新调用 test-routing-advisor，再调用对应具体 testing skill。全部 Phase 完成后，verify-code 从原始需求开始反查 Design、四份材料、完整用户流程、验收点和证据。
- **结果**：测试技能看到真实实现范围；证据缺失明确标为 `unknown`，不被当成 pass；verify-code 不因为局部测试通过而跳过用户流程或原始需求检查。

## 3. 范围和状态

### 范围内

- 组 6：回归证据、两类 baseline 的清晰区分、阶段证据与完成状态的绑定、失败归因、测试占用和并发边界。
- 组 7：review attempt/result 的完整追踪、失败分类统一、每次尝试和聚合指标保留。
- 组 8：inventory/retention 登记与校验差异；历史归档内容继续只读。
- WorkflowHub：主 agent 可见的 Grill 沟通；真实 skill invocation；四份材料的受控路径；spec/plan/tasks 分工；review 建议语义；build-plan/build-code 的模型分工。

### 状态

- `confirmed residual`：已确认仍需处理的问题。
- `planned`：已写入计划但尚未实现。
- `implemented`：代码已改变，但还没有独立验证结论。
- `verified`：有与当前快照绑定的验证证据。
- `unknown` / `unavailable` / `incomplete`：事实不足或能力不可用，不能当成功。
- `deferred` / `non-goal`：明确交给后续阶段或本轮不做。

## 4. 功能要求

### 组 6：阶段和测试证据

- **FR-G6-001**：每个组 6 残留都能显示当前状态、来源、负责人和后续验证方式，不把历史方案当现行要求。
- **FR-G6-002**：结果能清楚区分“集成交接所依据的 baseline”和“实现/检查使用的基线”，不能用一个含义不清的 baseline 代替两者。
- **FR-G6-003**：阶段结果同时说明顺序、阶段证据和完成状态；顺序不对、证据缺失或失败归因不明时不能显示成功。
- **FR-G6-004**：测试命令的占用有明确获取、等待、超时、释放和残留处理；并发、崩溃或快照漂移不会留下假成功。

### 组 7：provider review 追踪

- **FR-G7-001**：一次 review 的请求、prompt、round、前序结果和最终结果可以互相追溯。
- **FR-G7-002**：实现层、协议层和 provider 层的失败分类有稳定对应关系；失败类型不能因重试或展示方式被改写。
- **FR-G7-003**：指标能看见全部 attempt、重试和修正，而不是只保留最后一次结果。

### 组 8：历史登记

- **FR-G8-001**：inventory/retention 登记能反映仓库真实的新增、删除和变化，并明确校验结果。
- **FR-G8-002**：登记校验不能修改归档正文，运行时不能读取历史归档作为当前输入。

### WorkflowHub 执行质量

- **FR-WH-001**：Grill 结论、选项、后果和风险先在用户可见对话中展示，并等待真实回复后才写成已确认决定。
- **FR-WH-002**：阶段清单中的必需技能必须真实调用并留下可核对事实；未调用、跳过或不可用必须如实显示。
- **FR-WH-003**：四份当前材料都写入当前任务的受控 `specs/<task>/` 目录；后续阶段从同一受控位置读取。
- **FR-WH-004**：spec 只呈现业务问题和可观察行为；plan/tasks 承担实现细节、测试设计和执行顺序。
- **FR-WH-005**：所有 review 都要真实执行并保留原始结果；主 agent 逐条评审 finding。非 build-code review 是异源建议；build-code review 的 `pass` 是质量事实，不是无限复审或继续工作的硬门槛。
- **FR-WH-006**：build-plan 的高智力模型写清开发、注意事项、测试和技能；build-code 普通模型只按记录执行，缺策略时停止而不是猜。
- **FR-WH-007**：spec-analyze 能检查原始需求、decision-log、spec、plan、tasks、验收和测试的完整一致性；它报告问题，不代替主 agent 判断。
- **FR-WH-008**：build-code 的每个 Phase 都必须完成必要实施、风险相关测试、review 和主 agent finding disposition；已认证 serious finding 未修复或未取得具体风险接受时不能宣称完成。review 非 `pass` 时保留质量状态，不为追求 pass 无限复审；所有 Phase 完成后进入 verify-code，close 前必须向用户汇报。
- **FR-WH-009**：build-spec 和 build-plan 必须按当前材料中冻结的技能顺序执行，并为每个直接调用留下可核对的 invocation fact；build-spec 不调用 `spec-analyze`，build-plan 不调用具体 testing skill 或 `testing-system-blueprint`。
- **FR-WH-010**：build-code 必须在真实实现后检查 changed files；范围变化时重新调用 `test-routing-advisor`，随后按实际范围调用具体 testing skill；验证阶段必须反向检查原始需求、四份材料和完整用户流程，缺证据标记 `unknown`，不算 pass。
- **FR-WH-011**：verify-code 必须用一次架构师检查、一次异源 review 和最多两批主 agent 修复完成收尾；不因 provider verdict、历史 replay 或审计材料缺失反复循环。

## 5. 成功和失败边界

### 成功

- 用户能从 decision-log 看懂选择和风险，从 spec 看懂需求，从 plan/tasks 看懂如何实现和如何测试。
- 组 6、7 每项残留都有可复核的当前事实和失败边界。
- 组 8 登记校验通过时只说明登记正确，不暗示运行时读取历史。
- 任何阶段都能指出实际调用了哪些技能、产出了什么、哪些事实不可用。
- build-code 可以在不重新做产品和工程设计的情况下按序执行。

### 失败

- 当前材料落在根目录、路径/hash 不一致、材料被复制成两份且无法判断权威来源。
- 必需技能没有调用，或 review/test/provider 的不可用状态被伪装成成功。
- spec 混入实现步骤；plan/tasks 漏写文件、顺序、命令、oracle、证据或 STOP。
- 原始需求、已确认选择、验收点或延期项在四份材料之间丢失或互相矛盾。
- 归档正文被修改，或运行时新增历史读取。

## 6. 验收标准

- **AC-G6**：组 6 的每个残留能从当前材料追到证据；两类 baseline、阶段顺序、证据完整性、失败归因和 lease 并发边界都能在失败时给出明确结果。验证：定向运行时/契约测试；证据类型：test + evidence。
- **AC-G7**：一次 review 的 request/prompt/round/prior/result 可回放；重试和失败分类不丢；指标覆盖全部 attempt。验证：review runner 和 schema 契约测试；证据类型：test + evidence。
- **AC-G8**：inventory/retention 校验反映真实文件差异，归档正文 hash 不变，运行时没有历史读取。验证：inventory/retention 检查和只读回归；证据类型：test + evidence。
- **AC-WH-01**：Grill 在用户可见对话中给出选择、后果和风险，用户回复被记录，未回复不生成已确认决定。验证：交互契约测试和人工回放；证据类型：manual + evidence。
- **AC-WH-02**：声明为必需的技能都有真实 invocation fact；缺失时阶段显示 incomplete，不能只凭清单通过。验证：stage skill runtime 测试；证据类型：test + evidence。
- **AC-WH-03**：四份材料只在当前任务的受控 `specs/<task>/` 中作为当前材料被读写，错误位置被拒绝或不被消费。验证：ArtifactDir/五阶段集成测试；证据类型：test + evidence。
- **AC-WH-04**：普通读者能在短篇 spec 中找到目标、流程、范围、状态、成功/失败、非目标和延期；实现文件、命令和详细测试只出现在 plan/tasks。验证：内容契约和人工可读性检查；证据类型：manual + test。
- **AC-WH-05**：非 build-code review 的 finding 经主 agent 逐条处置后可继续，不触发无意义重复审查；build-code review 的原始 verdict、finding disposition 和 serious 风险处置必须可追踪，不能被改写成虚假 pass。验证：review cost/semantics 契约测试；证据类型：test + evidence。
- **AC-WH-06**：plan/tasks 为每个 Phase 和最终完整测试写出 tier、具体测试 skill、命令、预期退出码、oracle、证据和覆盖限制；build-code 缺策略时明确停止。验证：plan-task contract 和 execution replay；证据类型：test + evidence。
- **AC-WH-07**：spec-analyze 能发现原始需求到 decision-log/spec/plan/tasks/AC/test 的遗漏或矛盾，并保留 finding 供主 agent 判断。验证：跨材料一致性 fixture；证据类型：test + evidence。
- **AC-WH-08**：P1—P5 每个 build-code Phase 都有当前快照绑定的实现、测试、主 agent finding disposition 和 `wh-review=pass`；review verdict 原样保留，缺证据、`unavailable`、非 `pass` 或 serious finding 未处置时不能交接到下一个 Phase。修复后只允许基于新快照做有限复审，不为追求 `pass` 无限循环。全部 Phase 通过后执行最终完整测试，随后进入 verify-code，close 前输出用户可读交接。验证：Phase review contract、review receipt 和 build-code handoff；证据类型：test + evidence + manual。
- **AC-WH-09**：build-spec 依次留下 `spec-specify`、`spec-clarify`、`simplicity-guard`、`plan-ceo-review`、条件 UI `plan-design-review` 和一次 `wh-review` 的事实；主 agent 逐条处置 findings 后才发布 spec。build-plan 依次留下 research（执行或 skipped）、`spec-plan`、`simplicity-guard`、`plan-eng-review`、`test-routing-advisor`、`spec-tasks`、`spec-analyze` 和一次 `wh-review` 的事实。验证：阶段依赖、步骤和 invocation contract 测试；证据类型：test + evidence。
- **AC-WH-10**：每个 Phase 和最终完整测试都有 build-plan 的预判 tier/skill；build-code 有真实 changed-files 检查、必要的重新路由、具体 testing skill invocation 和测试结果；verify-code 有原始需求、Design、完整用户流程、逐 AC 和缺证据 `unknown` 的反向检查。验证：build-code routing contract 和 verify-code acceptance replay；证据类型：test + evidence + manual。
- **AC-WH-11**：verify-code 按“架构师检查一次 → 修一次 → 异源审查一次 → 再修一次 → 最终测试”顺序执行；每个 finding 有来源、影响、判断和修复/延期去向；同一快照不启动第三次审查，历史 replay 和审计材料不作为循环条件。验证：verify-code steps、review-cycle receipt 和 review-cost contract；证据类型：test + manual。

## 7. 非目标

- 不开发新的用户页面。
- 不恢复历史 control plane、reopen/rebind/recovery/successor/predecessor 或第二套证据/完成状态。
- 不把组 6、7、8 的编号当实施顺序。
- 不改写历史归档正文，不让运行时消费历史 inventory。
- 不让 build-spec 替用户决定未确认的产品范围。
- 不在 build-code 重新设计产品范围或验收 oracle；真实 changed files 与预判不一致时，允许重新调用 `test-routing-advisor` 并按实际范围选择具体 testing skill。
- 不在 verify-code 维护完整 requirement replay、全量 evidence tree 或多轮 close 审计；只保留能支持当前架构和 AC 结论的最小事实。

## 8. 延期与风险

- **延期**：具体字段/schema、准确文件和函数修改、inventory 登记文件、测试命令、回滚步骤交给 build-plan；若发现会改变用户行为的未决选择，返回 make-decision。
- **风险**：材料双写、规划遗漏导致普通模型猜测、review finding 被机械采纳、不可用事实被误报为通过。对应处理见 decision-log 的 RISK-001—RISK-004。

## 9. 兼容性和边界

- 既有四份材料的业务含义保留；只修当前材料的受控位置和下游读取方式。
- 历史质量证据、provider attempt/result 和归档文件继续只读保留。
- UI 不适用：本任务没有产品页面；“可见沟通”由主 agent 的用户对话和正式可读结果承担。
- 任何新增状态必须说明它是事实、推进资格、完成判据还是不可逆授权，不能混用。

## 10. 未决项

- 组 6、7 的具体字段和现有接口落点：由 build-plan 依据真实代码锚点决定；不能猜。
- make-decision 如何在不产生第二份真相的前提下写入 ArtifactDir：由 build-plan 设计最小扩展并由 build-code 验证。
- inventory 登记的准确文件和 retention 命令：由 build-plan 在确认当前仓库事实后确定。

这些未决项是工程设计问题，不是本 spec 新增的产品需求；若解决它们需要改变上述用户可观察行为，必须回到 make-decision。

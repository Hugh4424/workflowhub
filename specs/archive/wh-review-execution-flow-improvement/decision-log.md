# Decision Log

## 原始需求

| source_id | 原始需求/约束 | 来源引用/原文摘录 | 关联 D/处理状态 |
| --- | --- | --- | --- |
| R-001 | 基于三个历史任务建立新的改进任务，必须从 make-decision 开始，不跳阶段、不让 build-spec 补需求。 | 用户原始请求；三个 referenced task：019fea16-1108-7993-958b-903ec6ce1ad3、019fea14-e076-7ee2-870b-7cd98eea36d8、019feb9b-641e-76a3-aa00-c41ee51b7566；原文“请按标准 WorkflowHub 从 make-decision 开始，不要跳阶段，也不要依赖 build-spec 补需求。” | D-001；已覆盖 |
| R-002 | 冻结完整用户流程、页面/界面范围、数据状态、成功/失败边界、非目标和延期项。 | 用户原始请求；原文“先基于原始需求，梳理完整用户流程、页面范围、数据状态、成功/失败边界、非目标和延期项。” | D-002；已覆盖 |
| R-003 | Talk 用大白话说明选项、后果和风险；decision-log 记录原始需求、关键事实、选择、理由和延期交接。 | 用户原始请求；原文“Talk 请用大白话说明选项、后果和风险；decision-log 记录原始需求、关键事实、选择、理由和延期交接。” | D-001、D-010；已覆盖 |
| R-004 | 创建 task worktree 时只读并记录 dirty main，不因 dirty 阻止创建，不删除、不 stash、不自动提交用户改动。 | 用户原始请求；原文“只读取并记录 dirty 状态，不因 dirty main 阻止创建；不删除、不 stash、不自动提交用户改动。” | D-003、D-004；已覆盖 |
| R-005 | worktree 创建由 make-decision 任务启动入口统一负责，调用方和 wh-review 不得各自准备。 | 用户原始请求；原文“把 worktree 创建前移到 make-decision 的任务启动入口，而不是由不同调用方分别决定是否准备。” | D-003；已覆盖 |
| R-006 | make-decision 明确两次 review 的顺序，Grill 保留为交互式思考，不把 Grill 当 review。 | 用户原始请求；原文“确保两次审查都在正确的顺序中，保留 Grill 作为交互式思考，不把 Grill 当 review。” | D-005；已覆盖 |
| R-007 | Clarify 只能有一个归属；恢复 build-spec 的 spec-clarify，从 make-decision 移除重复 Clarify。 | 用户原始请求；原文“不能同时在 make-decision 和 build-spec 各执行一套。需要恢复 build-spec 的 spec-clarify，同时应从 make-decision 移除重复的 Clarify。” | D-006；已覆盖 |
| R-008 | Talk、Clarify、Grill 都要有真实 ask → wait → user reply → resume 契约测试。 | 用户原始请求；原文“增加真实的 ask → wait → user reply → resume 契约测试，不能只靠技能文档声明。” | D-006、D-007；已覆盖 |
| R-009 | 补齐 build-spec 条件调研 owner，补齐 build-code 最终 integration review 步骤说明。 | 用户原始请求；原文“补齐 build-spec 的条件调研 owner，以及 build-code 的最终 integration review 步骤说明。” | D-007、D-008；已覆盖 |
| R-010 | 统一修复必须遵守 WorkflowHub 宪法，不新增维护对象和质量 gate。 | 用户 Talk 第 1 轮；原文“统一修复，但是一定要注意不要违反workflowhub的宪法，不要新增新的维护对象和质量gate。” | D-001、D-010；已覆盖 |
| R-011 | build-spec 条件调研复用现有阶段事实和材料。 | 用户 Talk 第 2 轮；原文“复用现有阶段事实和材料。” | D-007；已覆盖 |
| R-012 | 交互和 review 顺序复用现有事实并强校验。 | 用户 Talk 第 3 轮；原文“复用现有事实并强校验。” | D-005、D-006、D-008；已覆盖 |
| R-013 | dirty main 只记录、不带入任务 worktree，并检查原因、给出处理建议。 | 用户 Clarify；原文“只记录、不带入，最好是检查一下dirty main的原因，并给出处理建议。” | D-003、D-004；已覆盖 |
| R-014 | dirty 清理要先给出明确下一步建议，用户同意后才直接处理。 | 用户 Grill 回复；原文“最好给出明确的下一步清理建议，用户同意后直接帮忙处理。” | D-004、D-009；已覆盖 |
| R-015 | wh-review 每次只拼干净、最小、当前 snapshot 的审查包：核心四文件或 phase commit diff；使用阶段特有提示/skill/合同，再调用通用 3rd-review 异源 agent，获得 findings。 | 用户最初 wh-review 需求；原文“每次拼凑非常干净的审查包进行审查，核心四文件或 phase 的 commit diff 之类的。” | D-009；已覆盖 |
| R-016 | provider 失败不能冒充业务结论：PROCESS_DEAD、SIGTERM、无最终文本、路径错误、超时、坏 JSON 和 transport failure 必须保留真实失败事实。 | 用户最初 wh-review 已知事实 1-4；原文“这不能解释成Kimi审查发现了问题，也不能解释成findings=[]。” | D-009；已覆盖 |
| R-017 | 不能用旧 attempt、旧 snapshot、旧 report、测试通过或历史 review 冒充当前正式验收；不能静默切换 provider、伪造 findings 或自动通过。 | 用户最初 wh-review 已知事实和检查清单 1-10。 | D-009、D-010；已覆盖 |
| R-018 | 除 build-code 审查需要按既有实现流程得到 pass 外，其他阶段审查只需获得真实异源审查建议，不要求 findings=[] 或审查 pass。 | 用户当时的纠正；原文“除了build-code的审查需要pass外，其他的审查不需要审查到pass，只需要获得异源审查建议即可”。 | D-014；非 build-code 部分继续有效；build-code 的 pass 部分已由 R-022/D-018 修正 |
| R-019 | 非 build-code 审查只是获取异源建议，不能因为 decision-log、确认记录、interaction aggregate 等记录性材料导致 snapshot 变化就自动重审。旧建议保留原始 snapshot/material/provenance；只有用户或阶段明确要求新建议（必要时说明被审主题的实际变化）才重新调用。 | 用户本轮补充纠正；原文“审查只是为了获取异源建议，不能因为snapshot变化就要重审，违反了审查了根本目标”。 | D-015、DEFER-007；记录，后续修复 |
| R-020 | decision-log 是后续所有 stage 的核心需求文件；make-decision 不能只在最后做一次原始需求回放，每完成一个 step 都必须更新同一份 decision-log，保留新需求、用户回答、事实、选择、风险、非目标、未决和延期交接。 | 用户本轮新增要求；原文“每次完成一个step的时候，都帮我更新一下decision-log，通过多轮更新，来保证不要遗漏任何细节。” | D-016、DEFER-008；新要求，待本轮 make-decision 重新确认 |
| R-021 | build-plan 最后完成前必须执行一次严格的 `speckit-analyze` 跨文档一致性检查，逐项检查原始需求、decision-log、spec、plan、tasks，以及 current/deferred/non-goal/evidence-only、DEFER/OPEN 去向，避免再出现结构通过但需求遗漏。 | 用户当前请求；原文“以后应该在build-plan最后完成的时候，应该执行一次严格的 `speckit-analyze`调用：跨文档一致性检查（原始需求 ↔ decision-log ↔ spec ↔ plan ↔ tasks）”。 | D-017、DEFER-009；当前要求，build-plan 最终收口实现 |
| R-022 | 所有 stage 的 review 都只获取可信异源建议，不要求 provider `pass`；build-code 更严格，只在当前可信 review 没有重要 findings 后结束，也不要求 `pass`；修复后才按实际主题变化重审，不能无限循环浪费时间和 token。 | 用户当前新增要求；原文“所有stage都只要求获取异源建议，不要求 pass。build-code要求严格一些，需要审查到没有重要findings为止，也不要求pass。一直审查也容易导致路线偏移，时间和token浪费。” | D-018；当前需求，需同步 wh-review、build-code 合同和测试 |

### 原始需求回放审计（2026-08-11）

- 审计来源：当前会话，以及三个 referenced task 的全部可读用户消息；三个历史任务的标题和内容只作不可信审计上下文，不自动继承为本任务产品需求。
- 当前任务的流程和 wh-review 原始需求已由 R-001～R-022 覆盖；三历史任务中的业务需求（KnowledgeDigest Task 2-B、ModelTest US-02、PaperBuilder 策略智能迭代）被明确分类为“历史证据，不带入当前范围”。
- 记录性缺口：历史审查失败的约 215 秒、约 464 秒 PROCESS_DEAD 与约 398 秒独立成功 findings=[] 的区别，之前在 D-009/F-004 中被压缩，未逐项形成原子事实；该缺口不改变当前方向，但必须在后续 step 更新中补齐 attempt、耗时、终态和“不得混用”的结论。
- 记录性缺口：旧 T-003 的开始队列无法追回，已诚实保持 needs_human；不得补写成完整历史问答。
- 根因：过去只在阶段末尾人工汇总，短回复和引用会话没有逐条回放；原始需求、历史证据和运行事实也没有在同一处做最终覆盖检查。
- 防遗漏方向：以后使用同一份 decision-log 的原始需求表和每-step 更新，不新增 ledger、状态机或 quality gate；每条来源必须有 current/deferred/non-goal/evidence-only 分类和下游去向。

### 本轮遗漏的根本原因与修复要求（2026-08-11）

这次审计发现，`spec/plan/tasks` 的 FR/AC 和任务结构可以达到 18/18，但仍漏掉延期和未决交接。根因不是用户需求不清，而是检查链条缺了一层：

1. 原始需求索引只强制检查 `R-*`、`D-*`、FR、AC 和任务策略，没有把 `DEFER-*`、`OPEN-*` 当作必须双向传播的来源；因此 `DEFER-001..008` 和 `OPEN-006` 可以留在 decision-log，却静默消失在 plan/tasks。
2. `spec-analyze` 当前是 build-plan 中段的 report-only lens，运行时点早于 review findings 处置和最终材料收口；它能发现 FR/AC、任务孤儿、测试策略和 hash 问题，但不能证明每条延期/未决都有下游去向。
3. `plan-task.v3` 的追踪表要求 R/D/FR/AC，却没有把延期/未决交接列为同样的必查维度；人工审计因此把“有任务”误认为“所有需求都有去向”。
4. 当前 workflow 只要求“做一次跨材料检查”的描述，没有把最终调用的输入、顺序、失败语义和回看证据写成 build-plan 最后一步的可执行合同。

彻底修复要求：在当前任务中扩展现有 `spec-analyze` 的同一 report-only packet projection，使它同时检查 R/D/FR/AC、用户流程/状态/边界/非目标、所有 `DEFER-*` 和 `OPEN-*` 的去向；将调用移到 build-plan findings 处置完成后的最终 publish 前；将缺失交接报告为真实 finding/incomplete，不生成 gate、ledger、第五份材料或新状态对象。每次 build-plan 最终收口都必须真实执行一次，不能只靠技能文档声明；本次任务的 spec/plan/tasks 必须各自列出该调用、owner、输入、输出、失败边界和测试 oracle。

## 当前 make-decision step 更新

本节就是当前 decision-log 的连续更新区，不是另一个 ledger。每完成一个现有 step，就在这里补一行；没有新增需求也要写明 `no-new-requirement` 和事实理由。

| step | 状态 | 本次更新 | 下一步 |
| --- | --- | --- | --- |
| 1. load-context | completed | 重新读取当前用户要求和三个 referenced task；确认 R-001～R-019 的当前范围，并新增 R-020；历史业务需求只作 evidence-only，不带入。 | 进入 triage-scope |
| 2. triage-scope | completed | 确认新增内容是“同一 decision-log 的逐 step 更新”，不是新 ledger 或 quality gate；补记约 215/464/398 秒审查事实的原子记录缺口；旧确认不覆盖 R-020。 | 进入 Talk Round 1 |
| 3. talk-round-1 | completed | 本轮没有新增方向选择题：用户已经明确要求“每个 step 更新同一份 decision-log”，并继续当前任务；该要求足够具体，不补造第二个选项轴。Talk 结论是：逐 step 更新和最终回放并行保留。 | 进入 research-inputs |
| 4. research-inputs | completed (skipped) | `no-new-requirement`：现有仓库、3rd-review 事实和三个历史 task 的完整回放已经足够回答本次方向，不再引入外部研究。补齐可复核原子事实：约 215 秒和约 464 秒的两次 attempt 都持续产生 thinking/tool 事件、没有最终 assistant 文本、被 SIGTERM 终止并记为 `PROCESS_DEAD`，没有可用 findings；另一次约 398 秒是独立正常完成并返回 `findings=[]`，两类 attempt 不得混用。bundle 相对路径与 Kimi ReadFile 绝对路径冲突属于 provider transport/tool access 失败，不是业务 finding。历史 task 的业务需求继续标为 evidence-only，不带入当前范围。 | 进入 Talk Round 2 |
| 5. talk-round-2 | completed | `no-new-requirement`：本轮按 Talk 合同检查是否还有会改变方向的高/中风险问题。没有。用户已经明确选择“每个现有 step 更新同一份 decision-log，再做一次最终完整回放”，并明确禁止新增 ledger、维护对象和 quality gate；因此不虚构第二个选项、不伪造新的用户回答，也不重复追问已回答的问题。后果和风险已写入 D-016：写入次数增加、记录性 hash 变化，但非 `build-code` advice 不自动重审；写入失败保持当前 step 未完成。 | 进入 blind-direction-review |
| 6. blind-direction-review | completed (advice reused) | 复用已有 direction advice：2 个异源 provider 有效、1 个同源 provider 排除、4 条 findings，原 reviewed `snapshot_tree`、`material_id`、attempt/result/report 和 route/coverage 保留为 provenance。它支持继续执行 D-016 的理由（决策输出不能混入客观事实、延期必须有可判断验收、host seam 前提要显式写出）。本次不因同一份 decision-log 的记录性更新重叫 provider；旧 advice 没有审查 R-020 新增的 step-update 接线，因此不把它写成“R-020 已被审查”或任何 pass。若后续确需针对 R-020 获得新 advice，必须有明确阶段/用户请求和最小主题。 | 进入 Talk Round 3 |
| 7. talk-round-3 | completed | `no-new-requirement`：方向 advice 的 4 条建议已有真实处置；用户此前已明确纠正“只有 build-code review 需要 pass”，并明确非 `build-code` advice 不因记录性 snapshot 变化重审。本次用户又明确要求逐 step 更新同一份 decision-log 并回复继续，没有新的方向选择题需要追问；不伪造新的 ask/reply，也不把历史 T-003 缺失队列补写成完成。剩余风险是 R-020 的代码接线和真实交互契约仍延期，不在本阶段自报实现完成。 | 进入 grill-with-docs |
| 8. grill-with-docs | completed (no-question) | 按 Grill 合同先核实事实：当前是同一份四材料/现有 interaction evidence，不新增 ledger、对象或 gate；step-by-step 写入会带来记录性 hash 变化，但 R-019 禁止因此自动重审 advice。方向已由用户明确，不再提出会重复决策的问题。G-003 记录了取舍和四项退出检查：external interfaces、canonical names、failure semantics、scope boundaries 均通过；CONTEXT=no-change、ADR=not-needed。Grill 仍是交互式思考，不写 provider review result。 | 进入 write-decision-draft |
| 9. write-decision-draft | completed | `no-new-requirement`：把 R-001～R-020 的来源、D-001～D-016 的选择、方向/detail advice 处置、G-001～G-003 的 Grill 事实、范围/非目标、失败边界、延期 owner/验收和当前 step 更新区统一保留在同一份 decision-log。当前仍是修订中的 draft；旧 accepted confirmation 不覆盖 R-020，不能把这一步写成最终发布。 | 进入 review-decision-detail |
| 10. review-decision-detail | completed (advice reused) | 复用已有 detail advice：2 个异源 provider 有效、1 个同源 provider 排除、10 条 findings，保留 reviewed `snapshot_tree`、`material_id`、attempt/result/report 和 route/coverage。按 R-018，detail findings 是异源建议，逐条处置即可，不要求 pass 或 `findings=[]`；按 R-019，本次同一 decision-log 的记录性更新不触发新 attempt。该旧 advice 没有审查 R-020 的 step-update 接线，所以不冒充覆盖 R-020；后续若确需新建议，必须显式说明主题和理由。 | 进入 approve-decision |
| 11. approve-decision | completed (user-confirmed revision) | 用户在当前会话明确提出 R-020/D-016，并在看到该要求被纳入同一份 decision-log 后回复“好的，继续”；这确认的是本次流程方向和继续执行，不是对尚未实现的字段、step_id 或代码方案作推断式批准。确认范围：逐 step 更新同一 decision-log、最终完整回放、无新增 ledger/对象/gate、非 `build-code` advice 不因记录性变化重审；实现细节仍按 DEFER-008 交接。 | 进入 publish-decision |
| 12. publish-decision | completed | `no-new-requirement`：当前 decision-log 已包含原始需求回放、逐 step 更新 1–11、选择/理由、风险、非目标、延期 owner/验收和真实 advice provenance。交接用大白话：现在先把“每一步都写同一份需求记录、最后再总检查”作为后续四阶段的核心约束；下一阶段按同一份 decision-log 继续，代码接线和契约测试仍是延期，不把本次文档记录宣称成实现完成。 | make-decision 收尾强校验；再进入 build-spec |
| 13. post-audit-coverage-repair | completed | 复用三份独立审计结果和本地结构扫描，确认遗漏集中在 DEFER/OPEN 传播、实际 writer/consumer owner、正向 cleanup、阶段审查关注点、慢/卡终态和最终跨材料检查；新增 R-021/D-017，要求扩展现有 `spec-analyze` 并在 build-plan 最后收口调用。没有新增 ledger、维护对象或 quality gate。 | 进入 build-plan 材料修订与最终强校验 |

### 新增需求回放（2026-08-11）

- `R-022` 是当前用户直接新增的 review 结束规则，不是历史证据，也不是对旧 review 结果的补写。
- 这条需求把原来“build-code 需要 pass”的说法进一步收窄为“build-code 当前可信审查没有重要 findings 才能结束”；所有阶段都不把 provider `pass` 当作产品要求。
- 重要 finding 复用现有 `wh-review` 的 `actionable` 且 `major|blocking`、证据锚点可信的分类；`minor`、`invalid_anchor`、provider unavailable 都不能被伪装成“没有重要问题”。
- 为防止无限审查：只有实际修复了重要 finding 或被审主题确实变化，才允许一次新的 focused review；同一问题重复出现、没有实际主题变化、provider 没有可信终态时，停止自动循环，保留 `needs_human`/`unavailable`/`incomplete` 事实。
- 本要求不新增 review 状态、维护对象、provider lifecycle 或质量 gate；它复用现有 review fact、finding adjudication、build-code integration 顺序和当前四材料。

## 目标

- 目标：在同一个 WorkflowHub task 内，同时修复执行流程和 wh-review 技能。
- WorkflowHub 线修复入口、阶段顺序、唯一 Clarify 归属、真实交互契约、build-spec 调研 owner 和 build-code final integration review。
- wh-review 线修复最小 packet、阶段特有提示、provider 路由/覆盖记录、路径访问、超时/终态、错误分类、旧事实隔离和 findings 处置。
- 历史 task、旧 review、旧 snapshot、旧 report 只读保留，不回填、不改写。

## 用户流程与界面范围索引

这是 CLI/宿主对话流程，不新增 GUI 页面或第二套控制面。

1. task-bootstrap 只创建 task manifest/store；官方 make-decision run execute 入口验证调用后创建 CandidateWorkspace。
2. 创建前只读读取 target repository 当前分支/HEAD、tracked/staged/untracked 状态和有限摘要，记录到现有 make-decision fact；dirty 内容不进入 candidate。
3. Talk 每次只问一个方向问题，显示 2–3 个选项、后果、风险和队列变化，遵守 ask → wait → 用户真实回复 → 重新排序。
4. 方向调研后做 direction review；它只看原始需求、客观事实、硬约束和非目标。
5. 继续 Talk，随后执行 Grill；Grill 读取代码/文档事实并与用户交互，但不生成 provider review。
6. 写 decision-log 草案，再做 detail review；detail review 读取已定方向、Grill 判断、验收草案和现有 advisory lens。
7. 真实用户确认后发布 make-decision；build-spec 读取当前 decision-log。规格事实缺口进入 build-spec 唯一 spec-clarify；方向问题回 make-decision，实现事实问题归 build-plan。
8. build-code 各 Phase 完成、最终测试和 AC trace 就绪后执行现有 integration review，处置 findings 后发布。
9. dirty 清理只先展示原因、建议、路径和风险；用户明确同意后才复用现有 cleanup authorization 处理。

界面/结果范围：

- 任务启动、doctor/status：显示 task、candidate baseline、dirty 诊断和建议，不显示为通过。
- Talk/Grill/Clarify 对话卡：显示问题、等待状态、真实回复绑定、重排结果和结束原因。
- wh-review 结果：显示 findings、实际 provider/route/coverage/transport 状态；unavailable 不显示为 findings=[] 或 passed。
- 四材料交接：显示 decision-log、spec、plan、tasks 的当前引用、未决项和延期 owner。
- cleanup consent：显示待处理路径、原因、动作和风险，用户同意后执行。
- 不新增 dashboard、public ask/resume 命令、独立 review 页面、研究数据库或历史迁移页面。

## 数据状态

以下都是现有 facts、quality evidence、四份材料和 CLI 输出的状态投影，不是新增状态机：

- task：created → make-decision workspace ready；缺 workspace 时 incomplete/unknown。
- target source：clean / dirty / unknown；记录 ref、HEAD、status digest、分类摘要和建议；dirty 不等于 candidate dirty。
- candidate：从启动时 HEAD 创建；candidate tree、material revision 和 review snapshot 独立绑定。
- interaction：ask → waiting-for-user → resumed → next question/closed；缺真实 reply、reply hash/card 不匹配时保持 incomplete。
- research：executed / skipped / unavailable；build-spec 条件调研不单独成为完成 gate。
- review：not-run / available-with-findings / available-empty-findings / unavailable；PROCESS_DEAD、timeout、坏 JSON、transport failure 等保留分类。
- decision：draft → detail-reviewed → pending-human-confirmation → accepted/published。
- build-code review：phase review 或 integration review；integration 绑定最终实现、fresh test、AC trace 和同一 snapshot。
- cleanup：recommended → user-consented → explicitly-authorized → completed/failed；未同意不做破坏性动作。

## 成功/失败边界

- 成功边界：
  - dirty target 仍能创建 candidate，main 的文件、index、HEAD、stash 和分支不变；
  - target dirty 事实、有限原因摘要和建议进入现有 make-decision fact，candidate 明确只来自 HEAD；
  - 只有官方 make-decision run execute 创建 workspace，重复调用幂等，wh-review 只打开已有 workspace；
  - Talk、Clarify、Grill 的真实暂停/恢复链由契约测试证明；
  - direction → Grill → detail 的顺序、阶段提示和 snapshot 绑定可验证；
  - provider 真实结果和 provenance 被保留；无终态或 unavailable 不改写为空 findings 或通过；
  - decision-log 覆盖原始需求、用户选择、事实、风险、非目标、延期 owner，经真实确认后交接；
  - build-spec 条件调研和 build-code final integration review 有明确 owner、输入、输出和现有 ref；
  - cleanup 只在用户同意具体建议后按现有授权边界执行。
- 失败边界：
  - task 身份、路径、输入或 workspace 绑定不合法时 fail-loud；
  - dirty 内容不能伪装成 HEAD、不能自动进入 candidate、不能自动 stash/commit/delete；
  - wh-review 材料缺失、路径不安全、hash/snapshot 不一致时记录 unavailable/incomplete，不伪造 provider 结论；
  - PROCESS_DEAD、timeout、坏 JSON、transport failure、SAME_SOURCE 等不生成 findings=[]、review passed 或 stage completed；
  - 无真实 user reply、错误 card/reply hash、错误 review 顺序、旧 attempt/snapshot/report 冒充当前结果时不得发布当前完成；
  - missing/unavailable quality fact 不阻止同 task 修复，但禁止宣称质量完成；
  - 用户未同意 cleanup 时保持待处理。

## 范围

- 当前范围：同一 task 内修复 runtime/task、runtime/stage、workflows、skills/wh-review、contracts、tests 和必要 docs。
- 需求链：原始需求 → decision-log → spec/AC → plan/tasks → implementation/test/review → verification。
- wh-review 包范围按阶段最小化：make-decision 用核心需求/事实和阶段提示；detail 用已批准方向、decision-log/验收和现有 lens；phase 只用 phase diff；integration 用 approved spec、AC、fresh tests、AC trace，不用累计 diff、raw log、完整项目。
- 具体接口字段、测试命令、step_id 和代码拆分由后续阶段引用本日志细化，不能反向补方向。

## 非目标

- 不迁移、重写、删除或伪造三个历史 task 的 review、snapshot、report、provider attempt 或验收状态。
- 不把历史 findings=[]、测试通过、文件完整或旧验收结果当作当前事实。
- 不新增 public ask/resume 命令、独立交互状态机、研究数据库、review 控制面、替代 ledger、continuation/recovery/rebind 对象或质量 gate。
- 不把 Clarify 同时放在 make-decision 和 build-spec；make-decision 移除重复 spec-clarify。
- 不让 build-spec 重新决定产品方向；实现事实调研仍归 build-plan。
- 不修改 WorkflowHub 宪法条文或检查清单。
- 不自动清理 target main 的 tracked、staged、untracked 或未知 ignored 文件。
- 不在本阶段实现被审查的业务产品代码；本任务交付 WorkflowHub 执行和审查流程改进。

### make-decision 当前阶段边界与延期交接

- 当前 direction packet 只允许：原始需求、客观事实、硬约束、明确非目标；不允许 decision-log、已批准方案、spec、plan、diff 或 changed files。
- 当前 make-decision 不实现 host seam、Talk/Clarify/Grill 契约测试、字段/step_id 接线、build-spec 条件调研接线、build-code integration review 接线或 wh-review 技能代码更新；这些是后续实现交接，不是本阶段漏项。
- 每项延期都必须保留 owner、触发阶段和可判断的验收结果；后续阶段不能把“延期”理解成删除需求，也不能用文档自报替代真实测试。

## 决定

### D-001
- question/final_option: 局部修 wh-review、迁移历史任务，还是统一修复整条链路；选择统一修复但只使用现有控制面。
- recommendation/plain_language: 统一修复；否则 worktree、Clarify、交互和 integration review 会继续互相放大。
- decision: 同一 task 修复入口、阶段顺序、owner、交互证据、wh-review packet/失败语义和下游交接；旧 task 只读。
- source_type/reference/exact_excerpt: user_choice / R-010 / “统一修复，但是一定要注意不要违反workflowhub的宪法，不要新增新的维护对象和质量gate。”
- approval_binding: Talk 已确认；最终 decision 待 detail review 后确认。
- facts_and_constraints: CONSTITUTION.md:28-36、40-45、84-93、163-165；当前四材料是工作真相；质量事实不是推进许可证；新增控制面必须有 owner/consumer/替代/删除条件。
- Logic: 问题互相依赖 -> 局部修补会留下旁路 -> 收敛到现有 runtime/workflow/fact/quality 边界 -> 统一修复且不新增维护对象或 gate。
- choice_reason/impact: 影响 runtime/task、runtime/stage、workflows、wh-review、contracts/tests/docs；不改历史数据。
- consequences_and_risks: 改动面较大，旧 fixture/调用方需更新；只修文档会复发。
- rejected_alternatives: 只修 wh-review、迁移历史 task、新增控制面；分别不完整、污染 provenance、违反约束。
- unresolved_items/owner: 具体代码拆分交 build-plan；无新的方向未决项。
- Supersedes: none

### D-002
- question/final_option: 用户流程、页面/界面和状态如何表达；选择沿用现有 CLI/宿主对话、四材料和 quality facts。
- recommendation/plain_language: 让用户看见下一步、真实失败和处理建议，不为显示而新建对象。
- decision: 采用本日志的流程、界面范围、数据状态、成功/失败边界和 cleanup consent 索引。
- source_type/reference/exact_excerpt: user_requirement / R-002 / “梳理完整用户流程、页面范围、数据状态、成功/失败边界、非目标和延期项。”
- approval_binding: 三轮 Talk、Clarify、Grill 已覆盖；最终确认 pending。
- facts_and_constraints: public runtime 七类行为；四材料和 quality evidence 已存在；宪法禁止重复控制面。
- Logic: 需要完整边界 -> 不能依赖 build-spec 猜 -> 用已有界面、facts、materials、refs表达 -> 后续阶段按索引细化。
- choice_reason/impact: 覆盖启动、对话、review、handoff、cleanup 五类可见结果；不新增 GUI 页面。
- consequences_and_risks: incomplete/unavailable 状态更显眼；短期输出更复杂，但不会假绿。
- rejected_alternatives: 新 dashboard、独立 cleanup 状态机、独立 review 页面；维护面过大。
- unresolved_items/owner: 具体 UI 文案由实现阶段按本日志确定。
- Supersedes: none

### D-003
- question/final_option: 谁创建 task worktree、何时创建；选择唯一官方 make-decision run execute 入口。
- recommendation/plain_language: task-bootstrap 只登记；真正开始 make-decision 时准备一次；其他入口不能偷偷创建。
- decision: 官方 make-decision run execute 负责创建；status、doctor、artifact、confirm、下游和 wh-review 只打开已有 workspace；wh-review-cli 移除独立 prepare 旁路。
- source_type/reference/exact_excerpt: direction_review / F-b59e6c270f48、F-83f066dfac13 / “which invocation type is the task-launch entry ... and the disposition of the wh-review-cli independent path.”
- approval_binding: Talk 方向已确认；direction finding 已处置；最终确认 pending。
- facts_and_constraints: task-bootstrap.mjs:33-45 只建 task；stage-runtime.mjs:95-100 当前所有非 status make-decision 都 prepare；stage-context.mjs:60-64 负责 prepare；wh-review-cli.mjs:26-33 存在旁路。
- Logic: 多入口 prepare -> owner 不唯一 -> 唯一官方启动入口 -> 旁路明确失败或复用，不重复创建。
- choice_reason/impact: 不把创建逻辑放回 task-bootstrap；artifact/confirm 无 workspace 时不能代替启动。
- consequences_and_risks: 旧直接调用方需要迁移；显式失败比隐藏创建安全。
- rejected_alternatives: task-bootstrap 创建、调用方自行 prepare、wh-review 兜底创建；都会形成多 owner。
- unresolved_items/owner: build-plan 定义 invocation preflight 和错误文案，不新增 public command。
- Supersedes: “所有非 status make-decision 命令都准备 workspace”的实现。

### D-004
- question/final_option: dirty main 如何处理和解释；选择只读诊断、记录到现有 make-decision fact、给建议，不带入 candidate。
- recommendation/plain_language: dirty 不再是创建错误；告诉用户有什么改动、可能怎样处理，但不替用户碰文件。
- decision: candidate 只从启动时 target HEAD 创建；现有 make-decision fact 增加可选 target repository status 字段，绑定 target ref、HEAD、dirty boolean、status digest、tracked/staged/untracked/ignored 分类摘要和建议；不创建新记录对象。
- source_type/reference/exact_excerpt: user_clarify / R-013 / “只记录、不带入，最好是检查一下dirty main的原因，并给出处理建议。”
- approval_binding: Clarify 已确认；最终确认 pending。
- facts_and_constraints: workspace.mjs:134-143 当前 dirty 抛错；:269-278 从 baseline commit 创建；git-worktree-snapshot.mjs:331 支持只读快照；CONSTITUTION.md:72-73 禁止 dirty 冒充 HEAD。
- Logic: 系统不知道用户意图 -> 自动带入会污染 provenance -> 记录证据并保持 HEAD candidate -> 用户明确转移才可使用。
- choice_reason/impact: main 文件、index、HEAD、stash、branch 不变；reason 只做证据分类，不猜用户意图；摘要有大小上限，避免审查包膨胀。
- consequences_and_risks: 未提交修复不会自动进入 candidate；用户需另行 commit/transfer；unknown 必须保留。
- rejected_alternatives: 带入 dirty、dirty 阻止、自动 stash/commit/clean；均违反边界。
- unresolved_items/owner: 字段名、摘要上限和枚举由 build-plan 定义，必须挂现有 fact。
- Supersedes: workspaceForCreation 的 target clean 硬 gate。

### D-005
- question/final_option: 两次 review 和 Grill 如何排序；选择 direction/detail 两条独立 track，中间保留 Grill。
- recommendation/plain_language: 先审方向，再让用户和 Grill 把方案想清楚，最后审细节；Grill 不是第三次 provider review。
- decision: Talk Round 1 → research → Talk Round 2 → direction review → Talk Round 3 → Grill → decision draft → detail review → human confirmation → publish/handoff。direction 不看方案；detail 读取已定方向、Grill、验收草案和现有 lens；Grill 不写 quality/reviews。
- source_type/reference/exact_excerpt: research / workflows/make-decision/steps.json:7-14；make-decision review contract:22,42,46 / “direction and detail are two independent tracks”。
- approval_binding: 用户 Talk 第 3 轮已确认“复用现有事实并强校验”；最终确认 pending。
- facts_and_constraints: stage-handlers.mjs:1060-1112 当前可同时绑定两个 ref；runner 不执行 steps 顺序；grill skill:53,71 只返回最小结论并写入 decision-log。
- Logic: 最终汇总可接受错误顺序 -> 给已有 interaction/review binding 增加前置校验 -> 顺序可证明且 Grill 不被伪装成 review。
- choice_reason/impact: 更新现有事实和 handler 校验，不新增 track、Grill ledger 或 gate。
- consequences_and_risks: 旧 fixture 需补顺序 refs；provider unavailable 仍保留 unavailable。
- rejected_alternatives: 只写文档、Grill 调 provider、合并两个 track；都不能防复发。
- unresolved_items/owner: build-plan 定义有限 round/Grill ref/hash，禁止保存完整问答历史。
- Supersedes: 同时绑定两个 review ref 即可完成的宽松行为。

### D-006
- question/final_option: Clarify 归属和三类交互测试如何分配；选择 build-spec 唯一拥有 spec-clarify。
- recommendation/plain_language: make-decision 只负责 Talk 和 Grill；build-spec 发现规格事实缺口时执行已有 spec-clarify；测试跟着 owner 走。
- decision: Talk 的真实生命周期测试归 make-decision；Grill 的真实生命周期测试归 make-decision；Clarify/spec-clarify 的真实生命周期测试归 build-spec。make-decision 记录恢复条件和交接，不再执行重复 Clarify。
- source_type/reference/exact_excerpt: user_requirement / R-007、R-008 / “恢复 build-spec 的 spec-clarify，同时应从 make-decision 移除重复的 Clarify。”
- approval_binding: 原始需求已明确；F-ebe542098028 因把全局测试误读为 make-decision 内部测试而 rejected_invalid；最终确认 pending。
- facts_and_constraints: spec-clarify skill:38,57 已有 ask/wait/resume 和 ambiguity-ledger；build-spec handler 尚未接入；runtime facade 没有 public ask/resume。
- Logic: 两套 Clarify 会重复提问和分叉事实 -> 单一 owner -> 复用已有 spec-clarify -> 只补接线/契约测试，不新建 public 状态机。
- choice_reason/impact: 解决重复 Clarify；方向问题回 make-decision，实现事实问题归 build-plan。
- consequences_and_risks: 旧 make-decision Clarify 调用需移除；build-spec 不能猜方向。
- rejected_alternatives: 两阶段各问一遍、public ask/resume、所有测试都放 make-decision；均错误或扩大维护面。
- unresolved_items/owner: build-spec 恢复入口和 ambiguity ledger 消费点由后续阶段细化。
- Supersedes: make-decision 与 spec-clarify 重复归属描述。

### D-007
- question/final_option: Talk、Clarify、Grill 的真实 ask/wait/reply/resume 如何测试；选择复用现有 host seam 和现有 facts。
- recommendation/plain_language: 测试真实暂停和恢复，不要求新 public 命令；错误回复不能推动流程。
- decision: ask 后返回 waiting-for-user 并绑定 card/round/题号；无回复、错误 card 或 hash 时拒绝 resume；真实 reply 后重新排序并继续；最终 aggregate 绑定有限 refs/hash。Talk/Grill 由 make-decision 使用，Clarify 由 build-spec 使用。
- source_type/reference/exact_excerpt: user_requirement / R-008 / “不能只靠技能文档声明。”
- approval_binding: 用户 Talk 第 3 轮和 Clarify 已确认；最终确认 pending。
- facts_and_constraints: 当前 interaction aggregate 只做摘要校验；ambiguity-ledger.v2 已有 ask/wait/resume 结构；没有 public ask/resume。
- Logic: 只测最终摘要 -> 无法证明真实暂停 -> 在既有 host seam 增加生命周期测试和有限绑定 -> 不增加命令/对象/gate。
- choice_reason/impact: 能复现卡住、错回、跳 review 的错误；不保存完整对话历史。
- consequences_and_risks: host harness 需要维护；没有真实 user reply 时必须保持 incomplete。
- rejected_alternatives: 只测最终 JSON、模拟用户回复、增加独立交互状态机；均不能证明真实链路或违反约束。
- unresolved_items/owner: build-plan 设计测试 harness；build-spec 接入 spec-clarify。
- Supersedes: 仅 round_count 或最终 aggregate 即视为完成的测试解释。

### D-008
- question/final_option: build-spec 条件调研和 build-code final integration 是否新增 owner/skill；选择复用现有阶段事实和 wh-review contract。
- recommendation/plain_language: build-spec 只查规格需要的产品事实，build-code 在最终测试后做整合检查；不新建 research DB 或 final review skill。
- decision: build-spec 在 read-decision-log 后、spec-specify 前拥有 conditional research，输出复用现有 stage fact 的 executed/skipped/unavailable；build-code 顺序为 all phases complete → final aggregate tests → implementation receipt/AC trace → integration review → finding disposition/focused repair → authenticate/publish，phase_id 缺失复用现有 integration contract。
- source_type/reference/exact_excerpt: user_requirement R-009；research：build-spec SKILL:50、build-spec steps:6、build-code contract:20,91。
- approval_binding: 用户原始需求、Talk 第 2 轮已确认；最终确认 pending。
- facts_and_constraints: build-plan 已有 spec-research；integration-review-subject.mjs:177、review-runner.mjs:317、completion-predicates.mjs:38 已有相应能力/predicate；当前 topology 未明确时点。
- Logic: 能力已有但 owner/顺序不可证明 -> 在现有步骤和事实上补合同 -> provider/阶段事实可追溯 -> 不新增控制面或 quality gate。
- choice_reason/impact: downstream 阶段职责清楚；unavailable 仍是质量事实，不是完成。
- consequences_and_risks: 后续要更新步骤、handler、fixture；final review 更晚但 packet 更小、更准确。
- rejected_alternatives: build-spec 完全退回、独立 research object、继续泛化 review-change、新增 final skill；分别不满足或扩大维护面。
- unresolved_items/owner: 具体 step_id/fact key 由对应阶段细化。
- Supersedes: build-spec 无 canonical research owner、build-code 无显式 final integration step 的状态。

### D-009
- question/final_option: wh-review 如何解决审查慢、卡住、包大和错误通过；选择按阶段最小 packet、阶段特有 prompt/contract、通用 3rd-review 异源调用和真实失败保留。
- recommendation/plain_language: provider 只看这一次真正需要的材料；失败就明确说失败或 unavailable；不能用空 findings、历史结果或测试绿灯糊过去。
- decision: direction 只送原始需求、客观事实、约束和非目标；detail 送已批准方向、完整 decision-log/验收和现有 advisory lens；phase 只送 phase commit diff；integration 只送 approved spec、AC、fresh tests、AC trace，不送累计 diff、raw log、完整项目或重复 planning artifacts。每次一个 frozen path-safe packet，manifest/hash/material_id/snapshot_tree 绑定。可信配置一次调用 broker；保留 requested/actual route、provider/model/profile、coverage、runtime/session、duration、raw public diagnostics、findings 和 attempt/result/report provenance。PROCESS_DEAD、SIGTERM、timeout、绝对路径失败、transport failure、坏 JSON、SAME_SOURCE、profile mismatch 分开分类；无最终 public result 就 unavailable；不静默 fallback、不无限 retry、不伪造 findings=[]、review passed 或 stage completed。bundle 在安全归档后清理 staging 临时物，不扩大 retention。
- source_type/reference/exact_excerpt: user_requirement / R-015、R-016、R-017 / “核心四文件或phase的commit diff之类的”；“这不能解释成Kimi审查发现了问题，也不能解释成findings=[]。”
- approval_binding: 用户最初 wh-review 需求已通过当前 Talk 纳入统一范围；最终确认 pending。
- facts_and_constraints: wh-review SKILL:26-61、101-120；stage-materials allowlist；历史任务审计：PROCESS_DEAD attempts 无 findings，398 秒 success 是另一 attempt；Kimi 曾因相对 bundle 路径与绝对 ReadFile 不匹配；WorkflowHub 不拥有 broker lifecycle/fallback。
- Logic: 大 packet/路径重试/无终态会造成上下文膨胀和人工终止 -> 阶段最小 allowlist、path-safe bundle 和清晰 provider contract -> 只保留真实终态/findings -> 审查可复核且不假绿。
- choice_reason/impact: 直接覆盖初始 wh-review 需求和三历史任务问题；改动 skills/wh-review、review runner/materials/provider client/result taxonomy、tests、3rd-review contract 同步。
- consequences_and_risks: 小包可能少上下文，必须用阶段特有提示/合同补语义；provider unavailable 会让质量 claim incomplete，但同 task 仍能修复。
- rejected_alternatives: 完整仓库/累计 diff；失败转空 findings；静默换 provider；旧 report/snapshot 复用；都污染 provenance 或扩大成本。
- unresolved_items/owner: broker timeout/kill、分类和 route readback 的具体接口由 wh-review/3rd-review 后续设计；不得在 WorkflowHub 新建 provider lifecycle。
- Supersedes: 当前 review runner 对所有 stage include diff、失败归类过宽、staging bundle/旧 report 易被误读的行为。

### D-010
- question/final_option: 如何保证不新增维护对象和质量 gate；选择只扩展现有事实、材料、步骤合同、quality refs、测试和 authorize boundary。
- recommendation/plain_language: 需要记录就放现有 fact，需要展示就沿用现有输出，需要清理就复用现有 authorize cleanup；不要再造数据库、ledger、命令或 gate。
- decision: 不新增 public behavior、持久对象、质量 gate、独立 ledger、provider lifecycle controller 或历史迁移对象；任何新字段必须有现有 consumer/owner，且不进入新的 completion predicate。
- source_type/reference/exact_excerpt: user_choice / R-010 / “不要新增新的维护对象和质量gate。”
- approval_binding: 用户已明确确认；最终确认 pending。
- facts_and_constraints: CONSTITUTION.md:40-45、84-93、163-165；现有 authorize cleanup 是不可逆边界；review/test/research facts 不是推进许可证。
- Logic: 维护面和 gate 会把修复变成修 gate -> 复用已有结构、保持 unknown/unavailable -> 只加必要校验和事实 -> 不新增债务。
- choice_reason/impact: plan 必须列出 consumer/owner/替代/删除条件；无 consumer 的项不实施。
- consequences_and_risks: 某些边界只能靠现有 fact 新字段和强校验表达；若结构确实不够，先报告缺口，不能偷偷新建对象。
- rejected_alternatives: public ask/resume、research DB、review state machine、cleanup ledger、质量 gate；全部不采用。
- unresolved_items/owner: build-plan 做一次新增字段/object/consumer 审计。
- Supersedes: none

## 三轮 talk

| talk_id | 问题/选项 | 后果/风险 | 用户选择/原文 | 开始队列 | 队列变化 | 结束结论 | source/evidence |
| --- | --- | --- | --- | --- | --- | --- | --- |
| T-001 | 统一修复、迁移历史、只修 wh-review 三选一。 | 统一修复较大；历史迁移污染 provenance；只修 wh-review 不完整。 | 统一修复，并要求不违反宪法、不新增维护对象和 gate。 | 需求范围、历史迁移、wh-review 局部修复、宪法边界。 | scope fixed；历史迁移排除。 | 统一修复整条链路，但只复用现有控制面；问题/成功标准的逐项记录不足，已由 detail finding 标出。 | user-turn Talk-1；host-visible ref 未提供 |
| T-002 | build-spec 复用现有事实/材料、退回 make-decision、新建研究控制面三选一。 | 复用需写清边界；退回不补 owner；新建违反约束。 | “复用现有阶段事实和材料。” | build-spec owner、research boundary、现有 facts/materials、宪法限制。 | build-spec research owner 保留；不新建 object/gate。 | build-spec 只做产品事实型条件调研；方向问题回 make-decision，实现事实归 build-plan。 | user-turn Talk-2；host-visible ref 未提供 |
| T-003 | 只补文档测试、复用事实强校验、新建状态机三选一。 | 强校验需更新 fixture；文档测试会复发；状态机违反约束。 | “复用现有事实并强校验。” | runtime 强校验、文档/契约测试、独立状态机、已知 review 风险；本轮实际开始队列未被持久记录。 | 选择复用 facts 并强校验。 | 方向 finding 和剩余风险没有在本轮真实问答中处理；当前状态 needs_human，不把它补写成已完成。 | user-turn Talk-3；host-visible ref 未提供 |

## 调研

| research_id/source | 调研重点 | 关键事实 | 处理状态 | 关联 D |
| --- | --- | --- | --- | --- |
| F-001 / worktree-audit | worktree 创建、dirty gate、唯一 owner | workspace.mjs:134-143 dirty 抛错；task-bootstrap 不建 workspace；wh-review-cli 有 prepare 旁路；cleanup 是独立路径。 | executed | D-003、D-004 |
| F-002 / interaction-audit | 顺序、Talk/Clarify/Grill、真实 resume | steps.json 有目标顺序但 handler 只绑定最终 refs；aggregate 不能证明暂停恢复；无 public ask/resume。 | executed | D-005、D-006、D-007 |
| F-003 / owner-audit | build-spec research、build-code integration | build-spec 无 canonical research owner；build-plan 有 spec-research；build-code 有 integration contract/predicate 但 steps 不明确。 | executed | D-008 |
| F-004 / historical-review-audit | 三历史任务的 PROCESS_DEAD、旧 snapshot、路径错误和包大 | PROCESS_DEAD 不是 findings=[]；旧 attempt/report 不能验收当前；provider path/timeout/JSON 失败必须 unavailable；最小 packet 优先。 | executed | D-009 |
| F-005 / constitution-audit | 宪法边界 | 四材料唯一工作真相；质量事实不是推进许可证；unknown/unavailable/incomplete 不假绿；新增控制面需 owner/consumer/删除条件。 | executed | D-001、D-010 |

## grill

| grill_id | CONTEXT/冲突 | 结论 | ADR/四项退出 | source/evidence |
| --- | --- | --- | --- | --- |
| G-001 | dirty main 可能是用户修改、生成物或未知混合；系统不能猜用户意图。 | 只读分类并给明确下一步建议；tracked/staged 建议另行提交或明确转移；untracked/疑似生成物只建议检查和清理；unknown 保持 unknown。用户明确同意具体路径后复用现有 cleanup authorization 处理。 | CONTEXT.md no-change：复用既有术语。ADR not-needed；hard to reverse=no，surprising without context=no，genuine trade-off=yes。Exit checks：上下文一致、owner/接口一致、失败语义明确、范围/延期明确。 | user Grill reply；grill-with-docs；CONSTITUTION.md:72-73、84-93 |

## 决策修订附录 decision-correction-appendix.v1

- target_decisions: D-001、D-002、D-003、D-004、D-005、D-006、D-007
- original_ref: 当前 decision-log.md 当前 revision；detail review attempt 9c3e5d41-60cc-4969-af5d-c1a39329fa28
- does_not_rewrite_upstream: true
- correction: 三轮 Talk 表格补充开始队列、队列变化和结束结论字段；对于本轮实际没有保存的开始队列和没有处理 direction findings 的事实，明确标记 needs_human，不补写历史问答。
- correction: wh-review 的验收索引补充阶段特有 prompt/contract、通用 3rd-review 异源 route/coverage，以及当前 snapshot/hash 必须隔离旧 attempt、旧 snapshot、旧 report 和历史 review。
- correction: Grill 表格内直接保留 ADR 三项判定，不依赖文档末尾的旁注。

## Talk/Grill 真实修订附录 decision-correction-appendix.v2

- target_decisions: D-005、D-007、D-009、D-010
- original_ref: 当前用户对本轮 Talk/Grill 卡片的真实回复；本附录不改写 v1 或旧 Talk 行
- does_not_rewrite_upstream: true
- correction: 之前记录的“Talk/Grill 顺序和真实问答证据不足”是实际问题，不再只留在风险里；本次补录真实的开始队列、用户选择、重排结论和仍待实现的接线/契约测试。

### 当前 Talk 修订

| round | 开始队列 | 用户真实选择 | 重排与结束结论 |
| --- | --- | --- | --- |
| Round 1A | 整体优先级：先解决审查慢/卡住/包过大，还是先缩减其他修复 | 先解决审查慢、卡住、包过大；其他要求不能减弱 | 审查效率优先，但全链路要求保留；这是一个单独决策轴 |
| Round 1B | 当前 3rd-review 接口检查要做多大 | 只做当前接口的窄检查，不扩大成外部 broker 重做 | 只核实 WorkflowHub 与 3rd-review 的当前调用边界；这是另一个单独决策轴 |
| Round 2 | 审查包是否允许自动补材料；是否把历史事实、上下文图和完整仓库带入 | 采用严格阶段 allowlist；复用现有 context map；不自动扩包 | packet 由当前阶段合同固定，缺材料保持 unknown/unavailable；不得用历史 review 或大包补语义 |
| Round 3 | 真实 ask/wait/reply/resume 是否已有可证明 host seam，以及是否新增 public ask/resume/持久对象 | 修复现有 host seam；不新增 public ask/resume；不新增持久对象 | 现有交互完成记录只承载结构化证明，不保存完整聊天；真实端到端证明延期到 build-plan/build-code 的既有测试接线。方向 findings、假设和剩余风险尚未完成真实 Talk 处置，保持 needs_human，不冒充完成 |

### Round 3 direction-finding 真实回复

| finding 主题 | 用户看到的关键问题 | 用户真实选择 | 重排/处置 |
| --- | --- | --- | --- |
| 现有 host seam 的可行性 | 现在还没有实现证据证明现有入口能完成真实 ask → wait → reply → resume；又不能新增 public ask/resume | “1”：继续当前方向，后续用现有 host seam 实现和测试；做不到就保持 incomplete 并明确报告，不降级成文档测试或假通过 | feasibility premise 已明确；失效条件是任一 seam 需要新 public 控制面/独立状态机/完整聊天归档，或无法绑定 card/round/hash 后 resume/re-rank。D-011、DEFER-002 更新；F-d606454e5ecf、F-293509139cab、F-5f8a064dee7a 处置为 fixed，但实现证据仍延期，不能宣称已通过 |

- 本次回复是一次真实 ask → wait → user reply → resume 的 Talk 决策回复；没有把旧 T-003 缺失的历史开始队列补写回来。
- direction 的其他建议按事实处置：packet 外锚点保持 accepted_risk；decision output 混入 facts 和延期验收条件已在材料边界中修正；不为设计 review 追求 pass 或空 findings。

### 当前 Grill 修订

| grill_id | 当前问题/用户选择 | 结论与风险 | 四项退出检查 |
| --- | --- | --- | --- |
| G-002 | 本地 Grill 仍要求一次只问一个问题；上游 grilling 已采用“当前独立前沿问题一组提问”。用户选择兼容性更新本地技能。 | 只更新 Grill 的批量前沿语义；Talk 继续一次一个方向问题。每轮没有固定问题数：问完当前所有互不依赖的问题；用户只答一部分时保留已答项，只追问未答项；出现歧义或冲突时先停，问最小澄清问题。风险是批量问题仍必须保持单轴、可编号、可重新排序，不能变成一张大而全的问卷。 | CONTEXT=no-change（复用既有 interaction completion record、caller-visible conversation surface、decision card）；ADR=not-needed（hard to reverse=no；surprising without context=no；genuine trade-off=yes，取舍由本日志承载）；external_interfaces=pass；canonical_names=pass；failure_semantics=pass；scope_boundaries=pass。 |
| G-003 | 每个 step 都写同一份 decision-log，可能让日志变大、造成记录性 hash 变化；另建 ledger 或把每次写入做成新 gate 会违反本任务边界。 | `no-question`：用户已经明确选择“逐 step 更新 + 最终完整回放”，且没有新的方向冲突。采用紧凑的 step delta：有新增就写新增，没有新增就写 `no-new-requirement` 和事实理由；仍只写现有 decision-log，最后再逐条回放并绑定 D/FR/AC/延期交接。写入失败保持当前 step 未完成，不伪造完成，也不创建 replacement ledger。Grill 只记录交互思考，不变成 provider review。 | CONTEXT=no-change；ADR=not-needed（hard to reverse=no；surprising without context=no；genuine trade-off=yes，取舍由本日志承载）；external_interfaces=pass；canonical_names=pass；failure_semantics=pass；scope_boundaries=pass。 |
- upstream_source: [Matt Pocock grilling](https://raw.githubusercontent.com/mattpocock/skills/main/skills/productivity/grilling/SKILL.md)、[Matt Pocock grill-with-docs](https://raw.githubusercontent.com/mattpocock/skills/main/skills/engineering/grill-with-docs/SKILL.md)，检查日期 2026-08-11；local_source: skills/grill-with-docs/SKILL.md。

### 新增/明确的决定

### D-011
- question/final_option: 真实 ask → wait → user reply → resume 的证明放在哪里；选择修复现有 host seam，并复用现有 interaction completion record。
- recommendation/plain_language: 让现有对话入口真的能停住、等用户、收到对应回复后继续；只记录足以证明这条链路的结构化结果，不保存整段聊天，也不造新命令。
- decision: Talk、build-spec 的 spec-clarify、Grill 各自补真实 host seam 契约测试；证明 ask、waiting-for-user、绑定 card/round/hash、真实 reply、resume/re-rank 和错误回复拒绝。最终仍只写现有 interaction completion record 的有限字段。
- source_type/reference/exact_excerpt: user_choice / R-008 / “1”（修复现有 host seam；不新增 public ask/resume 或持久对象）
- approval_binding: 用户本轮 Grill 已选择；最终确认 pending。
- facts_and_constraints: skills/talk-with-zhipeng/SKILL.md:77-92、skills/grill-with-docs/SKILL.md:11-18、runtime/stage/stage-handlers.mjs:202-227、runtime/interface/runtime-facade.mjs:3-22、runtime/schemas/ambiguity-ledger.v2.json:17-28、73-102、docs/adr/0009-stage-content-authority.md。
- Logic: 当前最终 aggregate 只能证明最终状态，不能证明中间真的等过用户 -> 扩展既有 host seam 的测试/有限证据 -> 不新增 public API、持久对象或质量 gate。
- choice_reason/impact: 能暴露卡住、错回、跳过重排的问题；不把历史 ambiguity-ledger 当作当前新控制面，也不把不存在的真实证明写成通过。
- consequences_and_risks: 在实现并通过契约测试前，R-008 仍是 incomplete；测试 harness 需由 build-plan/build-code 按现有 consumer 接入。
- feasibility_premise: 现有 caller-visible host seam 能在不新增 public ask/resume 命令、不新增持久对象的前提下，为 Talk、build-spec 的 spec-clarify、Grill 各完成一次真实 ask → waiting-for-user → 对应用户回复 → resume/re-rank。
- invalidation_condition: 如果任一 seam 只能靠新增 public 控制面、独立状态机或完整聊天归档才能完成，或真实用户回复无法绑定 card/round/hash 并触发 resume/re-rank，则该 premise 失效；保持 incomplete/unknown，报告宪法冲突和未满足需求，不自动降级成文档测试或通过。
- deferred_acceptance: build-plan/build-code 必须让三类契约测试分别驱动现有 seam，观察 waiting-for-user、真实 user reply、resume/re-rank 和错误 card/hash 拒绝，并留下现有 interaction completion record 可消费的有限结构化证据；这是真实实现验收条件，不是当前 direction/detail review 的 pass 条件。
- rejected_alternatives: 只测最终 JSON、模拟用户回复、增加 ask/resume 命令、增加交互 ledger；都不能满足原始需求或违反宪法边界。
- unresolved_items/owner: 现有 host seam 的具体测试接线由 build-plan/build-code；当前 make-decision 只记录方向和延期交接。
- Supersedes: 仅凭 round_count/final aggregate 宣称真实暂停恢复已证明的旧解释。

### D-012
- question/final_option: 本地 Grill 是否跟进上游的批量前沿问题语义；选择选择性兼容更新，不整体替换 WorkflowHub 保护条款。
- recommendation/plain_language: 一轮把当前互不依赖的问题一起问，少来回几次；但遇到依赖、冲突或没答全，就按规则停下并只补最小缺口。
- decision: 本地 Grill 改为每轮询问当前全部独立 frontier questions；问题编号并给推荐；部分回答保留已答结论，只重新计算未答前沿；歧义/冲突优先最小澄清。保留本地的先核实、CONTEXT/ADR、四项退出检查、失败契约、最小 summary、不得新建对象/gate 等约束。Talk 不改为批量。
- source_type/reference/exact_excerpt: research/user_choice / official upstream grilling + G-002 / “1”（选择性兼容更新）
- approval_binding: 用户本轮 Grill 已选择；最终确认 pending。
- facts_and_constraints: upstream `skills/productivity/grilling/SKILL.md` 当前规定按 design tree 每轮问 whole current frontier；local `skills/grill-with-docs/SKILL.md:11-18` 仍规定 one at a time。
- Logic: 上游批量前沿能减少无意义往返，但本地 WorkflowHub 保护条款仍是必要边界 -> 只吸收提问调度语义，不替换本地合同。
- choice_reason/impact: 降低 Grill 往返耗时，同时保持事实核实、用户真实回复、重排和失败透明；实现和契约测试延期到 build-plan/build-code。
- consequences_and_risks: 批量问题可能扩大认知负担或混入依赖轴；通过“只问当前独立前沿、编号、部分回答不丢失、冲突先澄清”限制风险。
- rejected_alternatives: 维持单题不变会保留当前慢；整体替换上游会丢本地宪法保护；两者都不采用。
- unresolved_items/owner: skills/grill-with-docs/SKILL.md 及其契约测试由 build-plan/build-code；本阶段不直接宣称技能已升级。
- Supersedes: local Grill 的“所有问题严格一次一个”调度语义；不替代本地的失败/退出/不新增控制面约束。

### D-013
- question/final_option: 如何防止三轮 Talk、方向 review、Grill、细节 review 再次乱序；选择把现有阶段顺序写成强校验并保留真实交互事实。
- recommendation/plain_language: 只写流程说明不够，调用时还必须检查前一步是否真的完成；否则又会出现“文件都在但顺序错了”。
- decision: 固定顺序为 Talk Round 1 → 必要调研 → Talk Round 2 → direction review → Talk Round 3 → Grill → decision draft → detail review → human confirmation；Grill 不是 review。校验只复用现有 stage/review refs、interaction completion record 和当前四材料，不新增 track、状态机或质量 gate。
- source_type/reference/exact_excerpt: user_observation/user_choice / R-006、G-002 / “当前 workflowhub 流程果然有问题，三轮 talk、方向审查、grill、再次细节审查，并没有严格按照顺序进行”
- approval_binding: 用户本轮选择“复用现有事实并强校验”以及 Grill 三条批量规则；最终确认 pending。
- facts_and_constraints: workflows/make-decision/steps.json:7-14、workflows/make-decision/SKILL.md:108-149、runtime/stage/stage-handlers.mjs:1060-1112；当前宽松绑定曾允许顺序事实不足。
- Logic: 同时存在 refs 不等于顺序发生过 -> 对现有 refs 做前置顺序校验，并由真实 host interaction tests 提供交互事实 -> 不增加新的质量 gate。
- choice_reason/impact: 直接针对已观察到的乱序问题；失败时保持 incomplete/unavailable，不能用历史 attempt 或文件存在代替当前顺序。
- consequences_and_risks: 旧调用方/fixture 可能暴露错误顺序；这是必要的失败暴露，不通过兼容旁路掩盖。
- rejected_alternatives: 只改技能文档、Grill 当第三次 review、合并两个 review、自动修正旧历史顺序；都不能证明当前流程。
- unresolved_items/owner: 具体 handler 校验和测试场景交 build-plan/build-code；当前方向已冻结。
- Supersedes: “只要 direction/detail 两个 ref 存在就算顺序正确”的旧解释。

### D-014
- question/final_option: 不同阶段的 review 结果如何解释；选择只把 build-code 的既有实现审查 pass 作为 pass 要求，其他 review 只收真实异源建议。
- recommendation/plain_language: 方向和设计审查的作用是挑问题、给建议，不是一定要审到“零问题”；只有实现代码的审查按现有 build-code 合同需要 pass。不要为了制造空 findings 重复调用同一审查。
- decision: make-decision direction/detail、build-spec、build-plan 和其他非 build-code review 只要求当前材料上有真实异源 review attempt、route/coverage/provenance 和 findings/advice；findings 可以非空，不要求 pass，也不因非空 findings 自动阻止同 task 修复。build-code 的 phase/integration review 继续遵守现有实现审查 pass 合同。`unavailable`、PROCESS_DEAD、无最终结果仍必须真实记录，不能冒充 advice 或 pass。
- source_type/reference/exact_excerpt: user_correction / R-018 / “除了build-code的审查需要pass外，其他的审查不需要审查到pass，只需要获得异源审查建议即可”
- approval_binding: 用户已明确纠正并确认该 review 语义；最终 decision confirmation pending。
- facts_and_constraints: wh-review/SKILL.md 明确 review 是 quality fact；make-decision contract 要求真实 independent attempt/findings，不要求清空 findings；build-code 使用既有 implementation review/completion contract。不得新增 quality gate。
- Logic: 设计 review 的价值是异源反馈，不是质量放行 -> 非 build-code 不追求 pass/空 findings -> 避免慢、重复和错误 gate；实现交付仍由 build-code 的既有 pass 合同约束。
- choice_reason/impact: 方向审查有 findings 仍可继续修决策；detail review 有 findings 仍可处置后让用户确认；只有 build-code 不能把建议当实现通过。
- consequences_and_risks: 非 build-code findings 需要逐条记录 fixed/rejected_invalid/accepted_risk/needs_human；`unavailable` 仍会让质量事实保持 incomplete，但不阻止同 task 修复。重复 review 只有在用户或阶段合同明确需要新建议时才执行；材料变化只能作为理由，不能单独触发。
- rejected_alternatives: 所有 review 都追求 pass/空 findings；把设计 findings 当 stage gate；用历史空 findings 冒充当前建议；均不采用。
- unresolved_items/owner: build-code 的具体 pass predicate 仍由既有 build-code/verify-code 合同消费；本任务不新增 gate。非 build-code advice 的 snapshot 解绑由 DEFER-007 交给 wh-review/runtime 修复。
- Supersedes: 将 direction/detail review 错当成必须 pass 的旧解释。

### D-015
- question/final_option: 非 build-code advice review 的 snapshot 变化如何处理；选择把被审材料的 snapshot 当作来源定位和 provenance，而不是 advice 的过期时间。
- recommendation/plain_language: 审查的目的只是请异源 agent 看一次材料、给建议。之后只改了 decision-log 的记录、确认或收据，不能为了“追上最新 snapshot”再花一次 provider 时间；否则审查从找问题变成反复补绑定。
- decision: 所有 stage advice review 的结果继续保存 reviewed snapshot、material_id、attempt/result/report 和 route/coverage；这些 advice 在后续记录性 snapshot 变化后仍是对原被审材料的有效建议事实，不自动失效，也不自动重审。即使被审主题后来实际变化，也必须由用户或阶段合同明确要求新建议，不能由 snapshot 变化自动触发。`bindFinalReview`、`evaluateFactFreshness` 等当前把任意 currentTree mismatch 当成 advice 缺失的逻辑，后续必须按 advice 与 build-code 当前实现/重要 finding 收口分开修复；build-code 仍保留当前实现绑定，但不以 provider pass 字段作为结束条件。
- source_type/reference/exact_excerpt: user_correction / R-019 / “审查只是为了获取异源建议，不能因为snapshot变化就要重审”
- approval_binding: 用户本轮明确提出该约束；实现尚未完成，不把当前代码状态写成已修复。
- facts_and_constraints: 当前已完成的 direction/detail 结果分别绑定各自 reviewed snapshot；最终 decision-log/confirmation/interaction 记录可能产生新的 current snapshot；刚启动的 fresh direction review 已取消，没有 result/findings，不能拿它补当前绑定。现有 `runtime/stage/stage-handlers.mjs:1024-1043,1112-1113` 的 `bindFinalReview` 对 make-decision direction/detail 统一要求 `review.snapshot_tree === currentTree`，`runtime/evidence/freshness.mjs:123` 也参与 freshness 判断；这些是后续要分流的实现入口。WorkflowHub 宪法要求保留 provenance，不能把旧 advice 冒充 build-code pass，也不能用重审掩盖运行时绑定错误。
- Logic: advice 的价值来自异源观察和原始材料 -> snapshot 是来源坐标，不是自动失效条件 -> 记录性变更不触发 provider -> 保留真实建议、降低耗时和卡住概率，同时不放宽 build-code 的当前实现绑定和重要 finding 收口。
- choice_reason/impact: 直接恢复 wh-review 的根本目标；避免因写确认、补收据或生成当前快照而重复审查，减少大包、超时和人工终止；不新增 review state、质量 gate、维护对象或 provider lifecycle。
- consequences_and_risks: 旧 advice 必须清楚显示其 reviewed snapshot/material/provenance，不能被展示成“当前实现没有重要 findings”；即使主题实际变化，也要等用户或阶段合同明确提出新建议，系统不能自行假设需要重审。当前 runner 在修复前可能仍报告 advice stale/incomplete，这个缺口保持可见。
- rejected_alternatives: 每次 snapshot 改变都强制重审；把 advice review 当 currentTree completion gate；复制一份“最新 advice”或新增 selector/ledger；均不采用。
- unresolved_items/owner: wh-review/runtime 修复 advice 与 build-code freshness 的分流，3rd-review 只负责既有 broker/provider 事实；build-plan/build-code 通过现有测试验证，不新增公共节点。
- Supersedes: “所有 review 结果都必须绑定最终 current snapshot 才能继续”的过宽解释；R-017 仍禁止把旧结果冒充当前正式验收，但不禁止保留旧 advice 事实。

### D-016
- question/final_option: 只在 make-decision 最后做一次原始需求回放，还是每完成一个 step 都更新 decision-log；选择“每个 step 更新一次 + 最终再做一次完整回放”。
- recommendation/plain_language: 每走完一步就把这一刻新增的需求、用户回答、事实、选择、风险和延期交接写进去；最后再从头检查一遍。这样后面的人不用猜中间发生了什么，也不会因为最后一次总结漏掉细节。
- decision: make-decision 的 13 个现有 step（load-context、triage-scope、talk-round-1、research-inputs、talk-round-2、blind-direction-review、talk-round-3、grill-with-docs、write-decision-draft、review-decision-detail、approve-decision、publish-decision、post-audit-coverage-repair）每完成一步，都必须更新同一份当前 `decision-log.md`。每次更新至少说明本 step 的输入、发现的新原始需求或“无新增需求”、用户真实回答、事实与约束、选择和理由、后果与风险、非目标、未决项及延期 owner/验收。最后的原始需求回放仍必须逐条把来源分类为 current/deferred/non-goal/evidence-only，并绑定 D/FR/AC/交接去向。
- source_type/reference/exact_excerpt: user_requirement / R-020 / “decision-log太重要了，只靠一次需求回放，我担心还是会遗漏需求”；“每次完成一个step的时候，都帮我更新一下decision-log”。
- approval_binding: 用户已明确提出该新增流程要求；本次 make-decision 方向修订和最终 confirmation 尚未重新完成。
- facts_and_constraints: 当前 steps 已为多数步骤声明 decision-log completion evidence，但 direction review、detail review 等步骤仍可能只写 review fact；当前运行曾在阶段末集中修订 decision-log，未形成每-step 更新事实；WorkflowHub 宪法仍要求四材料唯一、不得新增维护对象和质量 gate。
- Logic: decision-log 是下游唯一需求来源 -> 末尾一次回放仍可能漏掉中途细节 -> 在每个现有 step 的完成写入责任中更新同一材料 -> 下游读取一份连续、可追溯的当前需求，不新增第二套记录。
- choice_reason/impact: 直接针对本次审计发现的“人工末尾汇总会漏细节”根因；影响 make-decision 的 step completion、decision-log 内容和后续四阶段读取，不改变 Talk/Grill/Review 的 owner。
- consequences_and_risks: 每一步会多一次小幅文档写入，decision-log 的 revision/hash 会更频繁变化；这些记录性变化不能触发非 build-code advice 自动重审。若某次写入失败，必须保留真实写入错误，当前 step 不能自报已完成，但不能创建 replacement ledger 或隐形恢复对象。
- rejected_alternatives: 只做最终一次回放；另建 requirement ledger；每个 step 另建独立 decision record；把每次文档更新变成新的 quality gate；均不采用。
- unresolved_items/owner: 每个现有 step 的更新字段和失败返回方式由 build-plan/build-code 细化；不得新增 public command、持久对象或独立 completion predicate。
- Supersedes: “只在 `write-decision-draft`/最终 publish 时集中写 decision-log 就足够”的过宽解释；不改变四材料唯一和 R-019 的 advice freshness 规则。

### D-017
- question/final_option: 如何避免 FR/AC 结构校验通过但 DEFER/OPEN 和原始细节仍在 spec/plan/tasks 中遗漏；选择在 build-plan 最终 publish 前复用现有 `spec-analyze`（用户称 `speckit-analyze`）做一次严格跨材料 report-only 检查。
- recommendation/plain_language: 最后把原始需求、decision-log、spec、plan、tasks 放在同一份冻结分析输入里，从头到尾逐条对照；发现哪条没有去向就明确报出来，不能用“文件存在”当作完整。
- decision: 沿用仓内已经注册的 `skills/spec-analyze/SKILL.md`、`planning_artifacts` packet projection、现有 `validateSpecAnalyzeCompleteness` 和 contract test；扩展其检查范围到 decision-log 的 current/deferred/non-goal/evidence-only 分类、全部 `DEFER-*`/`OPEN-*` 去向、阶段/任务/测试 oracle；把调用顺序放到 build-plan 的 review findings 处置之后、publish-plan-result 之前。它只产生现有 report-only quality fact/findings，不是推进 gate、状态机、ledger 或第五份材料。
- source_type/reference/exact_excerpt: user_requirement / R-021 / “build-plan最后完成的时候，应该执行一次严格的 `speckit-analyze`调用：跨文档一致性检查（原始需求 ↔ decision-log ↔ spec ↔ plan ↔ tasks）”。
- approval_binding: 用户已直接提出并要求纳入当前任务；实现边界和失败语义由 build-plan/build-code 细化，不假设外部 `speckit-analyze` 可用，仓内实际 consumer 名称以 `spec-analyze` 为准。
- facts_and_constraints: 当前 `workflows/build-plan/steps.json` 已有 step 9 `spec-analyze`，但位于 review-plan 前；`skills/spec-analyze/SKILL.md` 已定义 report-only/lens-only 和 planning_artifacts 边界；`runtime/stage/stage-content-contracts.mjs` 当前主要检查 R/D/FR/AC、task、strategy、phase 和 hash，没有逐项检查 DEFER/OPEN；不能把它接成 runtime work gate。
- Logic: 遗漏来自“中段结构检查 + 只追踪 R/D/FR/AC + 无最终调用” -> 复用同一 analyzer、补齐 disposition/handoff 维度并把它放到最终材料收口 -> 每次 build-plan 都有一次可回看的完整一致性事实，同时不增加维护面。
- choice_reason/impact: 直接堵住本轮已复现的遗漏路径；发现问题时返回当前 task 修订材料，保留 finding/incomplete，不自动重审 provider、不伪造 pass，也不把非 build-code advice 变成 gate。
- consequences_and_risks: final analyzer 会增加一次本地 report-only 检查；如果输入缺失、分析不可用或发现遗漏，build-plan 的“最终一致性已检查”事实必须保持 incomplete/unavailable，不能宣称完整，但同 task 仍可修复。扩展 packet projection 时不得复制完整聊天、历史 task 或 raw review log。
- rejected_alternatives: 只依赖人工回放；只检查 FR/AC；新增 requirement ledger；把 analyzer 变成新的质量 gate；调用外部未注册的 `speckit-analyze`；均不采用。
- unresolved_items/owner: build-plan 负责最后调用和输入顺序；`runtime/stage/stage-content-contracts.mjs`/`skills/wh-review/scripts/review-materials.mjs` 负责复用现有 projection/validator；contract tests 负责证明所有 DEFER/OPEN 有去向和最终调用位置。
- Supersedes: “18/18 FR、18/18 AC 或 plan-task.v3 通过即可宣称四材料需求完整”的过宽解释；不改变 review/test/history 只是事实、非 build-code review 不要求 pass 的既有边界。

### D-018
- question/final_option: 所有 stage 的 review 何时结束；选择“全部 stage 只获取真实异源建议，build-code 复用现有重要 finding 分类做严格收口，但不要求 provider pass”。
- recommendation/plain_language: 方向、规格和计划审查的作用是帮我们发现盲点，不是一直追求审到零意见；代码审查要更严，必须确认当前代码没有可信的重大问题，但不能为了一个 `pass` 字样无限重跑。
- decision: direction/detail/build-spec/build-plan、build-code phase 和 build-code integration 都只把可信 provider 结果当 advice fact，不要求或伪造 `pass`。build-code 只有在当前 material/snapshot、实现/测试事实和 AC trace 对齐，且没有 `actionable` 的 `major|blocking` finding 时，才可结束该 review cycle；`minor` 或非阻塞建议可以保留为 advice。发现重要 finding 后，只在实际修复或被审主题确实变化时做一次 focused review；同一 finding 重复、没有实际变化、或 provider 没有可信终态时停止自动循环，保留真实 `needs_human`/`unavailable`/`incomplete`。
- source_type/reference/exact_excerpt: user_requirement / R-022 / “所有stage都只要求获取异源建议，不要求 pass。build-code要求严格一些，需要审查到没有重要findings为止，也不要求pass。一直审查也容易导致路线偏移，时间和token浪费。”
- approval_binding: 用户已直接提出该新增要求；本条是当前方向修订，不把它误写成已有实现完成，也不把旧 build-code pass 结果当作本条确认。
- facts_and_constraints: provider protocol 已有 `blocking|major|minor` 和 `actionable`/`nonblocking_minor` adjudication；现有 build-code final integration 顺序和当前实现绑定可复用。`unavailable` 不是“没有重要 finding”，不能转成 clean；WorkflowHub 宪法禁止新增维护对象、provider lifecycle 和额外质量 gate。
- Logic: review 的价值是异源建议 -> 全阶段不追求 pass -> build-code 用现有 actionable serious finding 语义做更严格的当前实现收口 -> 只在实际修复后复查 -> 避免无变化重审、路线漂移和 token 浪费。
- choice_reason/impact: 同时满足建议质量和时间边界；build-code 不会因为 provider 写了 `pass` 才结束，也不会因 minor 建议或记录性 hash 变化无限重审。
- consequences_and_risks: build-code 在 provider unavailable 或重要 finding 重复时不能宣称已清理；需要把原因、当前材料、已做修复和下一步交接写清楚。若 provider 持续提出新的真实重要 finding，修复循环可能延长，但每次都必须有实际主题变化；没有变化就停止并交人处理。
- rejected_alternatives: 所有 stage 都追求 pass；所有 stage 都同样宽松；每次 snapshot 变化都重审；无限自动 retry；新增 review loop controller 或新的质量 gate；均不采用。
- unresolved_items/owner: wh-review/build-code 负责把 `actionable major|blocking`、focused repair、重复 finding 停止和无终态事实接入现有合同与测试；不得新增公共 stage、状态对象或独立 gate。
- downstream trace: `FR-REVIEW-003`、`FR-REVIEW-005`、`FR-REVIEW-009`；`AC-008`、`AC-010`、`AC-023`、`AC-024`；owner 为 wh-review/build-code，验证复用现有 review fact、adjudication、当前实现绑定和 focused repair 合同。
- Supersedes: D-014 中“build-code 继续需要 provider pass”的部分；D-014 关于非 build-code 只获取建议、不要求 pass 的部分继续有效。D-015 关于 record-only 不重审继续有效。

## 审查处置

本节的 direction/detail 结果都是对各自 reviewed snapshot 的异源 advice fact，不是 build-code pass。根据 R-019/D-015，后续只改记录性材料造成的 current snapshot 变化，不会使这些 advice 自动失效，也不启动新的审查；本轮后来取消的 fresh direction 调用没有最终 result/findings，不计入审查事实，也不用于补绑定。

历史 direction review attempt 为 quality/reviews/attempts/f15bb09c-2059-4393-bf4d-3c225ee76ebe/attempt.json，result 为 quality/reviews/results/make-decision-direction-fb94df17d21f212dfce99cecc397e4179cab8e93-f15bb09c-2059-4393-bf4d-3c225ee76ebe.json，status=available；2 个异源 provider 有效，1 个同源 provider 被排除。历史 detail review attempt 为 quality/reviews/attempts/9c3e5d41-60cc-4969-af5d-c1a39329fa28/attempt.json，result 为 quality/reviews/results/make-decision-detail-0cb4082b5db01eb761e4769a9574ab6251c4992d-9c3e5d41-60cc-4969-af5d-c1a39329fa28.json，status=available；2 个异源 provider 有效，1 个同源 provider 被排除。它们因当时的 Talk/Grill 方向修订而被保留为历史质量事实；后续已按当时明确的方向 advice 需要完成了 07c direction 和 d9 detail 两次真实建议调用。这个历史过程不构成“今后 snapshot 一变就重审”的规则；两个旧结果都不是 make-decision passed。
本轮 direction review attempt 为 quality/reviews/attempts/ec27d9b2-31a8-4b45-9626-846c65076403/attempt.json，result 为 quality/reviews/results/make-decision-direction-988458ea8b00d587bde96d63173c162b74866732-ec27d9b2-31a8-4b45-9626-846c65076403.json，status=available；snapshot_tree=988458ea8b00d587bde96d63173c162b74866732，material_id=cc95608409dea31437a88470f987c010839272645d86d5504b268f2c9400f905；2 个异源 provider 有效，1 个同源 provider 被排除，6 条 findings。随后针对修订材料得到 direction attempt ec27... 的替代当前 snapshot 结果：attempt=quality/reviews/attempts/07c70e97-72f5-4ed2-a6cb-c2757c1bccb9/attempt.json，result=quality/reviews/results/make-decision-direction-ca26387c108e32ca9bf128ac1815c8ab0c818cf6-07c70e97-72f5-4ed2-a6cb-c2757c1bccb9.json，status=available；snapshot_tree=ca26387c108e32ca9bf128ac1815c8ab0c818cf6，material_id=706ca690a366e71945457c03ff67b6b566ab0cffa75c8476832afc88399006a5，2 个异源 provider 有效，1 个同源 provider 被排除，4 条 findings。它们都是 advice facts，不要求 pass 或 findings=[]；本轮按用户纠正不再为了清空 findings 重跑 direction，下一步直接进行 detail review。
本轮 detail review attempt 为 quality/reviews/attempts/d9bff13c-d02e-4279-8d17-82093a93d109/attempt.json，result 为 quality/reviews/results/make-decision-detail-3b06e1b29e049bcf9cc3e505cd4199588c7c3ecd-d9bff13c-d02e-4279-8d17-82093a93d109.json，status=available；snapshot_tree=3b06e1b29e049bcf9cc3e505cd4199588c7c3ecd，material_id=040b4352f84de42158db5dafbad9f19361868959a7a145ee0e2a0354228b2601；2 个异源 provider 有效，1 个同源 provider 被排除，10 条 findings。该结果是 detail 建议事实，不要求 pass；其中 Talk Round 3 的盲审 findings/剩余风险处置仍需用户真实回复。

| finding_id | 原始事实/来源 | 后果 | status | next_action/evidence_ref | owner/consumer/retain_or_delete |
| --- | --- | --- | --- | --- | --- |
| F-0f85a152bfbc | dirty ref、status entries 和承载 fact 未定义 | dirty 无法复核 | fixed | D-004 定义 target ref、HEAD、status digest、分类摘要和现有 fact | runtime/task；make-decision/build-spec；retain |
| F-24733ffd6a4a | objective facts 缺 source anchors | 方向前提难以交叉核对 | fixed | F-001..F-005、D-003..D-010 保留路径/行号/事实来源 | make-decision；detail review；retain |
| F-717986bc96d9 | 交互测试 owner 和 public surface 不清 | 可能误造 public ask/resume 控制面 | fixed | D-006、D-007、D-010 明确 owner、现有 seam 和无 public command | workflow owners；contracts/tests；retain |
| F-83f066dfac13 | wh-review 旁路 prepare、cleanup 保护未写 | 重复创建或误伤 dirty main | fixed | D-003 收敛创建；D-004/G-001 只建议、经同意授权 | runtime/task、wh-review；retain |
| F-b59e6c270f48 | task-start invocation 和旁路未定义 | 多 owner 可能建多个 workspace | fixed | D-003 规定唯一 run execute 入口 | runtime/stage、wh-review；retain |
| F-c98bca4fb741 | 非目标、延期和 cleanup 处置未记录 | 范围膨胀 | fixed | 已补本日志非目标、风险延期和 G-001 | make-decision；build-plan；retain |
| F-e5b28a441ff0 | direction packet 混入下游落地细节 | direction review 越权审方案 | fixed | D-008 只保留 owner/handoff，具体步骤归对应阶段 | make-decision/build-spec/build-code；retain |
| F-ebe542098028 | reviewer 把全局 Clarify 测试误读成 make-decision 内部测试 | 错误删除 Clarify 测试或错误判 blocking | rejected_invalid | D-006 明确 Clarify 测试归 build-spec；保留原 finding，不采纳错误归因 | make-decision；retain |
| F-7081dcf7d24a | 三轮 Talk 没按合同分别覆盖问题/成功标准、方向取舍、盲审 finding/剩余风险 | 不能假设用户已处理 direction review 发现 | fixed | Round 3 direction-finding 真实回复已记录；旧 T-003 历史队列缺口另由 F-7bfa6a7f8ae2、F-46a6f50bff61 保留，不补写历史 | make-decision/user；current decision-log；retain |
| F-7bfa6a7f8ae2 | Talk 表格缺少可见开始队列和有事实依据的结束结论 | 无法证明 ask/wait/reply/re-rank 的完整闭环 | needs_human | 旧 T-003 的实际开始队列无法追回，保持缺口；当前 appendix v2 明确只记录可核实选择，不能把补录当历史证据 | make-decision/user；interaction facts；retain |
| F-824d32a5b92b | detail packet 未封入仓库行号引用的 complete evidence_map | provider 不能独立复核所有 code fact | accepted_risk | 方向轮已验证这些事实；detail 轮不为少量行号扩大 packet，保留 source anchors 和风险说明 | make-decision/wh-review；retain |
| F-a216352804ce | acceptance 草案未覆盖阶段特有 prompt/contract 和通用 3rd-review route/coverage | wh-review 改进无法验收 | fixed | D-009 已补充；后续 AC-007 必须检查 stage prompt/contract、异源 route、provider/profile/coverage readback | wh-review/3rd-review；retain |
| F-a36c3b4cd3c0 | acceptance 草案未禁止旧 attempt/snapshot/report、测试绿灯或历史 review 冒充当前验收 | 可能当前 snapshot 未审却被宣布完成 | fixed | D-009、成功/失败边界和 AC-007 修订为 snapshot/hash 当前绑定；旧事实只读 | wh-review/runtime；retain |
| F-bf2bc4aba94f | Grill 表格内没有完整列出 ADR 三项标准 | Grill 结论不自足 | fixed | G-001 已在表格内写明 hard to reverse、surprising、genuine trade-off | make-decision；retain |
| F-2f9615f15689 | direction objective facts 缺少明确非目标/延期项 | provider 可能把下游实现范围当成当前方向 | fixed | decision-correction-appendix.v2、目标/非目标/延期节已明确；重跑 direction packet 验证 | make-decision；wh-review；retain |
| F-4ea277c303ab | direction review 的 raw requirement 混入“已覆盖”和 D 引用 | 盲审包失去原始需求边界，provider 可能被下游结论带偏 | fixed | 重跑 packet 只放原始需求原文和客观事实，不放 decision-log 结论/覆盖宣称 | wh-review；retain |
| F-5708bdf651f | “页面/界面范围”表述可能诱使 build-spec 发明 GUI | 规格阶段扩大到未要求的页面 | fixed | 明确当前是 CLI/宿主对话范围，无新增 GUI/page；写入非目标并交下游遵守 | make-decision/build-spec；retain |
| F-69119f1cc81 | objective facts 曾把换行写成字面 `\\n` | provider 读取困难，增加误解和重试 | fixed | 重生成 packet 使用真实换行；不扩大材料 | wh-review；retain |
| F-9e094ce2ff64 | 真实 ask/wait/reply/resume seam 未被当前仓库证明 | 可能只靠技能文档宣称交互测试完成 | fixed | 用户选择修复现有 host seam；D-011 保留未实现状态，交给 build-plan/build-code 真实契约测试；当前不宣称已证明 | make-decision/build-plan/build-code；retain |
| F-0c4f88068ed3 | direction packet 中“核心四文件或 phase diff”示例没有按阶段限定 | provider 可能把 diff 错带入 direction | fixed | D-009、当前阶段边界明确 direction 只送 raw requirement/objective facts/constraints/non-goals；phase diff 只属于 phase track；修订后重审 | wh-review；retain |
| F-1141b9a8903c | 真实 roundtrip 与“不新增 public ask/resume”之间的实现路径、owner、验收未写硬 | 后续可能静默删掉真实契约测试或另造控制面 | fixed | D-011 与 DEFER-002 明确复用现有 host seam；make-decision 定义合同，build-plan 设计，build-code 实现并跑三类真实测试；修订后重审 | make-decision/build-plan/build-code；retain |
| F-3771ce59e450 | 当前 direction packet 未明确后续接线属于本阶段非目标 | 可能把后续阶段工作提前塞进 make-decision | fixed | 非目标节明确当前只修决策材料；各后续 owner/触发/验收写入风险延期交接；修订后重审 | make-decision；retain |
| F-883817481d23 | 真实交互测试与禁止新增 public ask/resume 的关系表达不够明确 | 宪法边界可能被误解为不能测试，或被新命令绕过 | fixed | D-011 明确测试调用现有内部 host seam，禁止新增 public 命令/对象；修订后重审 | make-decision/build-plan/build-code；retain |
| F-a45ef155d9b4 | raw requirement 的顺序写成了不完整缩写 | 可能再次漏掉 research、第三轮 Talk 或 decision draft | fixed | D-013 和当前流程索引写出完整 canonical order，并注明用户缩写不是完整步骤清单；修订后重审 | make-decision/runtime/stage；retain |
| F-de47b23c2380 | 延期项没有逐项 owner、触发阶段和验收条件 | 延期会变成无主的需求丢失 | fixed | DEFER-001..DEFER-005 补齐 owner、trigger、acceptance；修订后重审 | make-decision/build-spec/build-plan/build-code/wh-review；retain |
| F-2111f2c08690 | direction packet 的客观事实引用了 packet 外代码/技能，provider 不能独立复核这些锚点 | 事实属于 supplied facts，不能伪装成 provider 已验证 | accepted_risk | direction 合同禁止为此自动扩大 packet；保留 source anchors 和“provider 未独立验证”的说明，detail/实现阶段按各自最小 packet 复核 | make-decision/wh-review；retain |
| F-6016334710d4 | direction objective_facts 混入 owner/trigger/acceptance 的决策输出 | 盲审可能变成对既定结论的确认 | fixed | 将 owner/trigger/acceptance 留在当前 decision-log 的延期交接；未来 direction packet 只送可观察事实和非目标；不再为清空 findings 重跑 | wh-review/make-decision；retain |
| F-a45da644db0b | direction packet 只写了延期触发，没有让 packet 内可判断的延期验收条件 | 后续可能把触发条件误当完成条件 | fixed | 当前 decision-log 的 DEFER-001..DEFER-005 已逐项写 acceptance；下一阶段执行真实测试/receipt，非 build-code review 不要求 pass | make-decision/build-plan/build-spec/build-code；retain |
| F-d606454e5ecf | 现有 host seam 能否在不新增 public ask/resume 下完成真实 roundtrip 尚未被实现证据证明 | 需求可能在实现阶段才暴露不可满足 | fixed | D-011 明确 premise、失效条件和验收：若现有 seam 不能完成三类真实 roundtrip，则保持 incomplete 并报告宪法冲突，不新增控制面；实现延期但风险不隐藏 | make-decision/build-plan/build-code；retain |
| F-278662565c9d | detail 验收草案 Scope 把 host seam“修复”写得像本阶段实现，与 Non-goals 冲突 | 当前阶段边界不清 | fixed | 统一解释为“本阶段定义/记录契约，实现在 DEFER-002”；不新增 gate，不为此重跑 detail | make-decision/build-plan/build-code；retain |
| F-293509139cab | F-7081dcf7d24a 被提前标为 fixed，但 Round 3 仍未处理盲审 findings | 可能伪造 Talk 完成 | fixed | 用户真实回复已补入 Round 3；不把实现延期误写成当前测试通过 | make-decision/user；retain |
| F-46a6f50bff61 | T-003 历史开始队列无法追回 | 不能证明旧 Talk 的完整 ask/wait/reply/re-rank | needs_human | 不补写历史；后续轮次强制记录开始队列，当前缺口由用户确认是否接受并交接 | make-decision/user；retain |
| F-48ef438ee0ce | detail 验收草案未逐项映射启动入口、顺序、Clarify、宪法边界和最终确认，也未标明 wh-review 技能更新延期 | 验收覆盖不完整 | fixed | 在现有 AC-007 与延期交接中补齐这些映射；不新增 quality gate | make-decision/build-plan/wh-review；retain |
| F-5f8a064dee7a | Round 3 没有真实处理当前 direction findings、假设和剩余风险 | make-decision detail 前不能假设用户已接受这些风险 | fixed | 用户已对关键 feasibility finding 真实回复；其余建议已逐项记录为 fixed/accepted_risk；detail findings 仍是建议，不当作 pass gate | make-decision/user；retain |
| F-8f7de8515159 | G-002 未自足记录 CONTEXT/ADR 判定 | Grill 证据不完整 | fixed | G-002 已补 CONTEXT=no-change、ADR=not-needed 及三项判据；不重跑 Grill | make-decision；retain |
| F-c5bad8cd4fe5 | 当前 Talk 修订表把多个单轴压成一行 | 看起来违反 Talk 单轴规则 | fixed | 拆为 Round 1A/1B 两个顺序单轴记录；不改写旧 T-001 | make-decision；retain |
| F-d04653e0b382 | detail 验收草案把总体范围和本阶段实现范围混在一起 | Scope/Non-goals 矛盾 | fixed | 当前范围改为定义/记录，host seam 实现归 DEFER-002；不追求 detail pass | make-decision/build-plan/build-code；retain |
| F-dad7adb470d5 | 旧 T-003 与 appendix v2 的 Round 3 队列描述不一致 | 审查者无法判断哪条是当前事实 | fixed | 旧 T-003 保留为历史 incomplete；appendix v2 明确是当前可核实选择的修订，不宣称替代历史 | make-decision；retain |
| F-eeadc89d8c9b | G-002 缺 CONTEXT/ADR 字段 | 同 F-8f7de8515159 | fixed | 与 G-002 同步补齐；不重跑 Grill | make-decision；retain |

## wh-review 验收索引

- AC-007a：每个 stage track 使用阶段特有 review prompt、合同和声明的 reviewer skill；不得把通用 review 文案当成阶段语义。
- AC-007b：调用可信配置的通用 3rd-review broker，保留 requested/actual route、provider、model、profile、coverage、attempt/result/report 和公开诊断。
- AC-007c：build-code 的当前实现 review 必须绑定当前 material_id、snapshot_tree、实现/测试 hash；旧 attempt、旧 snapshot、旧 report、历史 review、测试通过或文件完整不能替代当前重要 finding 收口结果。所有 stage 的 advice review 都绑定它实际审查的 material_id/snapshot_tree 并保留 provenance；后续仅有记录性 snapshot 变化时，旧 advice 不失效、不自动重审，也不能被改写成 build-code 当前无重要 findings。
- AC-007d：provider 无最终公开结果时为 unavailable；PROCESS_DEAD、SIGTERM、timeout、坏 JSON、路径错误、transport failure 和 SAME_SOURCE 不得变成 findings=[]、review passed 或 stage completed。
- AC-007e：packet 只包含当前 allowlist 中的最小材料；phase 使用当前 phase diff，integration 使用当前 spec/AC/fresh test/AC trace，不发送累计 diff、raw log、完整仓库或重复 planning artifacts。
- AC-007 现有范围映射：D-003 由当前启动入口和 workspace fact 证明；D-005/D-013 由现有顺序 refs 与强校验测试证明；D-006 由 make-decision 移除重复 Clarify、build-spec 保留 spec-clarify 证明；D-010 由新增对象/命令/gate 审计证明；OPEN-005/OPEN-006 由最终 human confirmation 记录。wh-review 技能代码与测试更新属于 DEFER-005，不在本阶段伪装为已实现。
- Review 结果解释：所有 stage review 只需真实异源建议；findings 非空不等于失败，也不要求 pass/findings=[]，不为清空 findings 重跑 unchanged review，也不因记录性 snapshot 变化重跑。build-code 只在当前可信结果没有 actionable major/blocking finding 时结束 review cycle；minor advice 可以保留，重复/无变化/无终态就停止自动循环；这复用既有合同，不新增质量 gate。

## 最终确认

- 状态：accepted
- 用户真实回复： “确认”
- 确认范围：接受当前 direction/detail 的异源建议语义；接受现有 host seam 失败时保持 incomplete/unknown、不得新增 public ask/resume；接受旧 T-003 开始队列无法追回但保留为历史风险；接受后续按 DEFER-001..DEFER-005 交接，不在 make-decision 实现后续代码。
- host-visible confirmation ref/hash：官方 confirm:decision 已写入；最终 runner 需要把 confirmation 和 interaction aggregate 按现有流程绑定到当前决策材料；direction/detail advice 按 D-015 保留各自 reviewed snapshot/provenance，不因记录性 snapshot 变化强行重审。运行时修复前不宣称正式完成。
- 补充纠正：用户明确要求非 build-code advice 不因记录性 snapshot 变化自动重审；direction/detail advice 保留各自 reviewed snapshot/provenance。当前 runner 若仍把它们视为 stale，是 DEFER-007 的实现缺口，不通过启动新审查掩盖。
- 未确认内容：实现阶段的最终字段名、step_id、测试命令和代码拆分仍交由后续阶段；这不改变本次方向确认。

### 当前确认状态修订

- R-020/D-016 是最终确认之后用户新增的流程要求；原“accepted”确认仍保留为 R-001～R-019 的历史确认，不覆盖 R-020。
- 当前 make-decision 必须回到同一 task 重新完成需求回放、方向确认和正式交接；在此之前不得把 build-spec 草案当作可继续的最终需求。
- 本修订不要求重审旧 advice；只有在新方向确认后，阶段明确需要针对新增 step-update 主题获得新异源建议时，才按 R-019/D-015 请求新的 advice。

## 拒绝方案

| 选项 | 拒绝理由 | 关联 D |
| --- | --- | --- |
| 只修 wh-review | 入口、Clarify、交互和 integration 问题继续存在 | D-001 |
| 迁移历史 task/review | 混淆当前 snapshot 与历史 provenance | D-001 |
| task-bootstrap 创建 worktree | 把任务登记和阶段启动混在一起 | D-003 |
| 每个调用方自行 prepare | 多 owner、重复创建、难解释失败 | D-003 |
| dirty 时阻止或自动 stash/commit/clean | 违反用户边界并可能破坏改动 | D-004 |
| make-decision/build-spec 各执行 Clarify | 重复提问和事实分叉 | D-006 |
| 新增 public ask/resume、研究库、review 状态机或质量 gate | 违反宪法和本任务约束 | D-007、D-008、D-010 |
| direction/detail 合并或 Grill 当 review | 丢失职责边界 | D-005 |
| build-code 继续隐藏 final integration | 无法证明时点和输入 | D-008 |
| 完整仓库、累计 diff、raw log 全塞进审查包 | 慢、卡、上下文膨胀，且provider难以聚焦 | D-009 |
| provider 失败改写空 findings、静默换 provider或复用旧 report | 污染当前 provenance并造成假绿 | D-009 |

## 风险与延期交接

| risk/deferred_id | 风险或延期内容 | 触发/后果 | 处理阶段/owner |
| --- | --- | --- | --- |
| RISK-001 | dirty 状态能证明文件事实，不能证明用户意图 | 自动判相关会污染 provenance | runtime；unknown + 明确建议 |
| RISK-002 | 未提交代码不会自动进入 candidate | 当前修复需要显式 commit/transfer | 用户确认后处理；不自动导入 |
| RISK-003 | cleanup 可能不可逆 | 删除 tracked/untracked/unknown ignored 文件 | 先展示路径；用户同意后 authorize cleanup |
| RISK-004 | provider 慢、卡、无终态 | 审查长时间无 findings | wh-review/3rd-review；有界终态和真实 unavailable |
| RISK-005 | packet 太小可能缺上下文 | finding 质量下降 | 阶段 prompt/contract 补语义；不扩大到完整项目 |
| DEFER-001 | dirty fact 字段、摘要上限、分类枚举 | 触发：build-plan 细化现有 fact；验收：validator/fixture 能校验 target ref、HEAD、status digest、分类摘要和建议，dirty 不阻止 candidate 且不导入 dirty 内容 | owner：build-plan；复用现有 fact |
| DEFER-002 | 三类 ask/wait/resume host seam | 触发：build-plan 定义既有 seam 的测试接线，build-code 实现；验收：Talk、build-spec 的 spec-clarify、Grill 都有真实 ask → waiting-for-user → 对应 user reply → resume/re-rank，错 card/hash 被拒绝；不新增 public ask/resume、持久对象或完整聊天归档 | owner：make-decision 定义合同；build-plan 设计；build-code 实现并运行；消费者：既有 interaction completion record 与阶段契约测试 |
| DEFER-003 | build-spec conditional research step/fact consumer | 触发：进入 build-spec；验收：只在规格事实缺口存在时由 build-spec 执行，复用当前 facts/materials，结果为 executed/skipped/unavailable，且不新增 completion gate | owner：build-spec；消费者：现有 spec-clarify/阶段事实 |
| DEFER-004 | build-code final integration step 和 AC trace | 触发：所有 phase 完成、fresh tests 和 AC trace 就绪；验收：integration review 读取 approved spec、AC、fresh tests、AC trace，发现可处置且绑定当前 snapshot，复用 phase_id=null contract | owner：build-code；消费者：现有 integration contract/review predicate |
| DEFER-005 | wh-review timeout/kill、分类、bundle cleanup、group outcome 与本地 Grill 技能/测试更新 | 触发：wh-review/3rd-review 后续实现；验收：最小阶段 allowlist、阶段提示、真实 route/coverage、PROCESS_DEAD/无终态分类、path-safe bundle 和 Grill 批量前沿语义均有契约测试；不得 fallback、无限 retry、伪造 findings 或新增 provider lifecycle | owner：wh-review 与 3rd-review；本地 Grill 技能/测试由 wh-review 工作项消费 |
| DEFER-006 | 三个历史 task 重新审查 | 历史记录不可改写 | 新 task；本 task 只保留审计引用 |
| DEFER-007 | advice review 与 snapshot freshness 解耦 | 触发：wh-review/runtime 后续实现；验收：所有 stage advice 保留 reviewed snapshot、material_id、attempt/result/report 和 route/coverage；仅有 decision-log、confirmation、interaction aggregate 等记录性变化时不要求新 review、不把 advice 标成缺失；只有明确的新建议请求、实际主题变化或 build-code 重要 finding 修复后，才允许一次 focused review；重复/无变化/无终态停止自动循环，不新增 gate | owner：wh-review/runtime/build-code；测试由 build-plan/build-code 接入现有契约，3rd-review 只提供 broker/provider 事实 |
| DEFER-008 | make-decision 每个现有 step 完成时更新同一 decision-log，并在最终确认前做完整原始需求回放 | 触发：本次 R-020/D-016 重新确认；验收：13 个现有 step 都能在同一当前 decision-log 中留下本 step 更新；没有新增需求时记录 no-new-requirement 及理由；来源均分类并绑定下游去向；写入失败保持当前 step 不完整；不新增 ledger、对象或 quality gate | owner：make-decision 定义；build-plan/build-code 接线和契约测试；消费者：下游四阶段读取当前 decision-log |
| DEFER-009 | build-plan 最终 `spec-analyze` 跨文档检查及 DEFER/OPEN 传播校验 | 触发：review findings 处置和 plan/tasks 最后一次修订完成；验收：publish 前真实调用现有 report-only `spec-analyze`，五项当前输入可回看，所有 R/D/FR/AC/DEFER/OPEN 有去向；缺项保持 finding/incomplete；不新增 gate/object | owner：build-plan 定义最终顺序；build-code 实现现有 analyzer projection/validator/tests |

## 质量边界

- 质量事实：interaction evidence、research 状态、review attempt/result/report、provider route/coverage/diagnostic、test/AC/dirty diagnostics。
- review 语义：所有 stage review 都是异源建议事实；build-code 只按既有当前实现和 actionable serious finding 合同判断是否已收口；任何 provider 无终态仍保持 unavailable/incomplete。
- 推进资格：阶段只按现有入口、当前四材料和 task/workspace 身份推进；review、test、research、history 不单独授权继续。
- 完成判据：按既有阶段合同证明核心交付、测试、逐 AC、独立 review 或真实 unavailable、交接和需要的人类确认；缺项保持 incomplete/unknown。
- decision-log 持续更新：每个现有 make-decision step 的完成写入同一当前 decision-log；这是现有材料责任和 step completion evidence 的细化，不是新增 quality gate、状态机或维护对象。
- 不可逆授权边界：cleanup、commit、push、merge、archive 继续使用现有 authorize；dirty cleanup 必须绑定用户同意的明确 subject/path。

## 未决项

| item_id | 未决内容 | 原因 | 谁在何时解决 |
| --- | --- | --- | --- |
| OPEN-001 | target dirty fact 的最终字段名、摘要大小、分类枚举 | 需和现有 validator/fixture 对齐 | build-plan |
| OPEN-002 | build-spec conditional research 的具体 fact key 和 step_id | 需验证可复用现有结构 | build-spec |
| OPEN-003 | broker timeout/kill 和 group outcome 具体接口 | provider lifecycle 属 3rd-review | wh-review/3rd-review |
| OPEN-004 | 某次真实 dirty main 的具体 cleanup 路径 | 当前 main clean，无待处理路径 | 发现 dirty 后先建议，用户同意时处理 |
| OPEN-005 | 本 decision-log 最终 human confirmation 与 advice 绑定 | 用户已回复“确认”；官方 confirmation fact 已写入。interaction aggregate 仍需按现有流程校验；direction/detail advice 不应被强行绑定到最新记录性 snapshot，当前 runner 的这条过宽 freshness 检查属于 DEFER-007，修复前不宣称正式完成 | make-decision 收尾强校验；后续 wh-review/runtime 修复 |
| OPEN-006 | 两个历史 Talk 队列证据缺口 | 当前 direction/detail 都已获得真实异源建议并按 advice 语义处置；旧 T-003 开始队列无法追回，但用户已在最终确认中接受其作为可见历史风险 | 后续测试只补当前真实 seam 证据；不改写历史 |

## Supersedes

- 不改写任何历史 task、review、snapshot、report 或 receipt。
- 只替代当前实现中 dirty 必须 clean、wh-review 可旁路 prepare、make-decision 可重复 Clarify、build-code final integration 隐含在泛化 review-change 的错误解释。

## 文档结果

- CONTEXT.md：no-change；复用现有 CandidateWorkspace、quality fact、current four materials 等术语。
- ADR：not-needed；不新增 public interface、维护对象、宪法条款或不可逆迁移，取舍已由本 decision-log 承载。
- ADR criteria：hard to reverse=no；surprising without context=no；genuine trade-off=yes。存在取舍，但没有达到需要新增 ADR 的三个条件。
- 术语/ADR 冲突及处理：Clarify 指 build-spec 唯一 spec-clarify；Grill 指用户交互思考，不进入 review。
- 不复制 spec 的边界：本日志只保留来源、选择、事实、边界、风险和交接；具体 API、测试步骤、step_id 和任务拆分由后续材料细化。

## Exit checks

- 上下文一致：原始需求、三个历史 task、当前代码事实、宪法约束、wh-review 需求和用户选择均已索引。
- owner/接口一致：make-decision 负责 Talk/Grill/启动；build-spec 负责 spec-clarify/条件事实调研；build-plan 负责实现事实；build-code 负责 final integration；wh-review 负责 frozen packet/provider fact。
- 失败语义明确：PROCESS_DEAD、timeout、坏 JSON、transport failure、unavailable、旧 snapshot、错误 reply 和未经同意 cleanup 均不改写为通过。
- 范围与延期明确：非目标、风险、延期 owner、未决项和用户确认状态已记录。
- 需求去向完整：每条 `R-*`、`D-*`、`FR-*`、`AC-*`、`DEFER-*`、`OPEN-*` 都必须在当前四材料中有明确分类、owner、去向或保留边界；任何没有去向的条目只能标为 incomplete，不能宣称材料完整。
- 最终检查真实发生：build-plan 必须在 findings 处置和最后一次 plan/tasks 修订后、publish 前真实执行一次现有 report-only `spec-analyze`；只在技能文档或计划中声明而没有调用，不算完成。

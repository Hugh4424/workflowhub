# Decision Log

## 原始需求

| source_id | 原始需求/约束 | 来源引用/原文摘录 | 关联 D/处理状态 |
| --- | --- | --- | --- |
| R-001 | 审计三个真实 WorkflowHub 任务中全部 wh-review 使用 | 用户：检查“WH-workflowhub遗漏优化、MT-US-06、KD-Task 2-C” | F-001，current |
| R-002 | 逐 stage 评估 finding 质量 | 用户：“每个stage审查结果是否高质量” | AUDIT-001..，current |
| R-003 | 逐 stage 评估时间与 token 浪费 | 用户：“是否浪费时间和token” | F-003，current |
| R-004 | 与 AgentHub vibecoding 原版比较 | 用户给定 `/Users/Hugh/Hugh/Project/multica-agenthub/packages/core/agenthub/skills/3rd-review/verifiers/vibecoding` | F-004，current |
| R-005 | 判断审查包是否远大于当次需要 | 用户：“会不会提供远远大于当前审查所需要的材料范围” | F-002，current |
| R-006 | 深挖根因并设计完整改造，不只排最小整改顺序 | 用户：“基于根本原因看看……整个wh-review应该做那些改动” | F-002，current |
| R-007 | 用 anysearch 逐 stage 研究提示词和审查角度 | 用户：“每个stage逐个调研分析，使用anysearch” | F-009/F-011..F-016，completed |
| R-008 | 目标是异源对抗性 findings，不是证据治理 | 用户：“不是通过wh-review来检查材料、快照、流程” | D-001 confirmed direction |
| R-009 | 深挖失败、重试、超时和总耗时 | 用户：“审查失败、重试、耗时长是重要原因” | F-003，current |
| R-010 | 用多个子代理做独立、可并行调研 | 用户：“派出多个子代理” | F-001，current |
| R-011 | 检查宪法合规、stage 质量和维护成本 | 用户：“会不会违反workflowhub宪法……降低……质量……加大……维护难度” | F-005，current |
| R-012 | 消除 P5 审查后写回 T010 引发的重复复审 | 用户引用“按当前证据绑定规则……最后一次同快照复核” | F-006，current |
| R-013 | 调研并吸收 Occam Review | 用户给定 `mindorigin150/occam-review` | F-007，current |
| R-014 | 调研并吸收 Matt Pocock code-review | 用户给定 `mattpocock/skills/.../engineering/code-review` | F-008，current |
| R-015 | 严格从 make-decision 开始，不跳阶段 | 用户：“不要跳阶段，也不要依赖 build-spec 补需求” | D-002 confirmed process |
| R-016 | Talk 用大白话说明选项、后果和风险 | 用户明确要求 | T-001..T-006 / G-001..G-002，complete |
| R-017 | decision-log 保留原始需求、事实、选择、理由、延期交接 | 用户明确要求 | current |
| R-018 | 先梳理用户流程、页面、数据状态、成功失败、非目标、延期 | 用户明确要求 | 本文对应章节，current |
| R-019 | 当前会话全部调研、背景、设计均须有记录 | 用户：“千万不要遗漏” | COVER-001，current |
| R-020 | 核对 `workflowhub-delivery-flow-quality-v1` 是否已经优化 make-decision，并决定后续是否使用该流程 | 用户提供本地 specs 路径并询问“是不是用这里面的make-decision流程” | F-018 / D-005，current |
| R-021 | 把 mini-task 的设计审查和实施审查纳入 wh-review 优化，并研究能否复用其他 stage 合同 | 用户：“mini-task有设计和实施两个审查，也需要放在当前功能优化里一起调研、设计” | F-019 / D-006 / D-007，current |
| R-022 | delivery-flow-quality-v1 合并 main 后，把 main 全部改动同步到当前分支，并按新版 WorkflowHub 流程继续 | 用户：“已经开发完成合并到main了……从main合并所有改动到当前分支，然后基于新的workflowhub流程，继续当前任务” | F-024 / D-014，current |
| R-023 | 详细复核正式 make-decision 之前的全部方案、调研和原始需求是否完整进入 decision-log | 用户：“详细检查一下……有没有都记录到decision-log中，原始需求有没有遗漏” | COVER-001..008 / Step 11，current |
| R-024 | 按当前方案继续处理审查、验收事实、例外、人工确认和交付关闭之间发现的根因问题 | 用户：“好的，那就请你按计划处理吧” | F-025 / D-015，current |

## 原始需求正文（make-decision 输入）

本任务的原始需求不是“把材料检查做得更严格”，而是：检查三个真实 WorkflowHub 任务中所有 wh-review 的使用情况，逐 stage 判断审查结果是否真的能发现会伤害交付的高风险问题、是否浪费时间和 token、审查提示词与合同是否优于 AgentHub vibecoding 原版、审查包是否远超当前审查需要；继续用 anysearch 和多个独立子代理逐 stage 调研根因，并把 wh-review 改造成高质量、低成本的异源对抗性审查。审查重点必须是用户流程、页面和数据状态、成功/失败边界、需求和决策漏洞、计划断点、实现正确性与必要性、真实用户结果和假绿验收，不是证据治理、快照形式或材料清单本身。

后续约束也属于同一份原始需求：必须从 make-decision 开始，不跳阶段、不靠 build-spec 补需求；Talk 用大白话讲清选项、后果和风险；decision-log 保存原始需求、关键事实、选择、理由和延期交接；使用已合并 main 的 workflowhub-delivery-flow-quality-v1 流程；把 mini-task 的 design/implementation 两次审查一起纳入，并复用共同审查积木；用 ModelTest 对修改前后所有 review surface 做逐面比较；吸收 Occam Review 和 Matt Pocock code-review 的有效代码审查角度；消除 build-code 在 P5 审查后仅因写回 T010 就重复审查的问题；检查宪法、阶段质量、维护成本、审查失败/重试/超时和总耗时；所有补充需求才用 mini-task，mini-task 完成后必须清理；所有 finding、验收事实、例外处理和人工确认都要真实记录，不能把 unavailable、unknown、失败或无 finding 写成通过。

## 由原始需求直接抽出的关键事实

- 目标结果：异源 reviewer 找到真实交付风险；Host 只做确定性边界检查，不能把材料合规当成审查质量。
- 固定流程：make-decision → build-spec → build-plan → build-code → verify-code；mini-task 只作为新增小需求或小功能的独立 design/implementation 分支。
- 固定评测：ModelTest 的九个 review surface 分别比较 baseline/candidate；失败、超时、token 不可用和有效配对不足必须保留为 inconclusive。
- 固定配置：正式 reviewer 和 mini-task reviewer 都严格读取 `/Users/Hugh/.config/workflowhub/config.json`，不动态改 reviewer 数量，不由 benchmark 自行换 provider。
- 固定交付边界：没有当前快照的独立审查、finding 处置、验收事实、例外记录和用户确认，就不能宣称任务完成，更不能执行正式 close。

## 目标

- 把 wh-review 改成“用异源 reviewer 高效发现会伤害交付的真实问题”的模块，同时减少无价值材料、重复调用、格式失败、超时和非语义变化触发的复审。
- 五个 stage 各自只审最能改变该 stage 交付质量的语义问题；确定性的路径、hash、材料完整性由 Host 处理。
- 在不新增第五份当前材料、不把 review 变成推进许可证、不引入新状态机的前提下，形成可验证的质量/成本改造方向。

## 用户流程/结果范围

1. Stage Agent 到达应审查节点，Host 按 stage 和 track 选择语义审查对象。
2. Host 做路径安全、manifest、hash、完整覆盖等确定性检查；失败就明确报结构错误，不消耗 reviewer。
3. Host 只打包当前语义问题需要的材料，并从受信配置选择异源 reviewer；调用方不能自行指定 provider。
4. Reviewer 按该 stage 的唯一合同做对抗性审查，只返回可行动 findings；不裁决 WorkflowHub 能否继续工作。
5. WorkflowHub 原样保存 provider、transport、usage、finding 和 provenance；“无 finding”“provider 失败”“质量通过”三者分开。
6. Stage Agent 判断 finding：修复、说明无效、经授权接受风险，或交给人决定。
7. 只有语义审查对象真的变化时才产生一次普通复审；写回状态、时间、handoff、review fact 不让旧结果过期。
8. build-code 阶段同时检查 `spec_conformance`、`correctness`、`necessity`；集成审查覆盖完整用户流和跨阶段接缝。
9. verify-code 从交付声明反查实现和测试断言，所有 AC 有紧凑覆盖，高风险和弱 oracle 深审。
10. 用户最终看到的是具体 finding、处置、未完成质量事实和成本/耗时事实，不看到虚假的 provider pass。

## 页面范围

- 当前事实：原始需求没有要求新增 Web UI 或管理后台。
- 明确结论：用户可见面只保留现有 WorkflowHub CLI、stage 汇报、review report/quality fact 和 ModelTest 报告；本任务不新增监控页面或 dashboard，`OPEN-002` 已关闭。
- 禁止下游自行假设需要 dashboard、provider scorecard 页面或新的公共 runtime 命令。

## 数据状态

- `not_requested`：只允许未声明审查面的内部小节点使用；9 个正式 review surface 不得用它绕过审查，配置或执行失败必须记 `unavailable`。
- `structural_error`：Host 在路径、manifest、hash、覆盖检查中发现确定性错误，未 dispatch。
- `running`：3rd-review 已接管一次请求；WorkflowHub 不自建轮询和生命周期控制面。
- `completed_with_findings`：可信终态且有 findings。
- `completed_no_findings`：可信终态且无 findings；这是质量建议，不等于 stage 完成。
- `unavailable`：认证、启动、进程死亡、超时、传输、协议或格式失败；绝不能改写成 pass。
- `current`：每次需要判断时，纯函数重算的当前语义 hash 与旧 review fact 相同；不是持久化状态。
- `stale`：纯函数重算发现代码、测试/oracle、AC、接口、schema、迁移、配置、直接 consumer、phase 范围、计划约束或 review 合同等语义输入已改变；不是 lineage 状态。
- `record_only_changed`：只用于解释“状态、时间、handoff、review/provider/retry/timing/ref 不进入语义 hash”，不作为持久化枚举。
- finding disposition：`fixed`、`rejected_invalid`、`accepted_risk`、`needs_human`。

## 成功/失败边界

- 成功边界：9 个 surface 都不退步，且每面质量或成本至少一项达到 D-012 的明确改善线；无效 finding、JSON/合同失败、provider 重试、每 stage token、墙钟时间和非语义复审次数可独立比较；三个真实任务中的已知失败模式可被回放和解释。
- 成功边界：P5 review 后只写 T010 状态时不再调用 provider；代码、AC、oracle 或合同真实变化时旧 review 会过期。
- 成功边界：五阶段合同分别命中方向错误、需求漏洞、计划断点、实现 bug/不必要复杂度、假绿验收，而非主要报告材料治理问题。
- 失败边界：通过裁剪关键行为 diff、AC、弱 oracle 或直接 consumers 来省 token，导致审查盲区扩大。
- 失败边界：把 provider 成功、无 finding 或 transport 失败写成质量通过。
- 失败边界：新增 review lineage、replacement/continuation/rebind、risk state、provider scorecard DB、第五份当前材料或公共生命周期命令。
- 失败边界：写回 review 结果本身再次改变有效性身份，形成自触发复审。
- 失败边界：build-spec 需要重新询问本阶段本应决定的方向、范围、用户结果或关键取舍。

### 质量与成本怎么衡量

- finding 质量：已知严重缺陷是否被找到；finding 是否能指向真实错误、真实后果和可执行修正；无效、重复、只查材料治理的 finding 占比。
- 执行可靠性：配置中的 reviewer 实际完成比例；启动、死亡、超时、传输、格式失败率；每个 provider 的重试次数。
- 成本：每个 stage 和每个有效 finding 的 token、墙钟时间；并行后的总等待时间；同一语义内容被重复组包和重复审查的次数。
- 交付保护：每个 stage 都必须用该 stage 的已知缺陷和反例做回放，不能用总平均数掩盖某一个 stage 质量下降。
- 具体 benchmark 样本、缺陷种子和达标线由 Talk Round 3 决定，运行时 reviewer 数量仍严格按配置执行，不由 benchmark 动态改变。

## 范围

- 当前范围：wh-review 核心合同、五阶段 review contracts/material allowlist、build-code 语义身份、3rd-review 公共适配边界、finding 输出与处置、失败语义、benchmark/canary 和相关 workflow 消费方式。
- 当前范围：三个真实任务逐 stage 的质量、成本、失败和 packet 证据；AgentHub、Occam Review、Matt Pocock code-review 的对标结论。
- 影响模块：WorkflowHub 的 `skills/wh-review/`、`runtime/review/`、`contracts/`、五个 `workflows/*` 和 mini-task 消费边界；3rd-review provider 调度边界；ModelTest 离线评测边界。最终三仓范围见 D-011。

## 非目标

- 不让 wh-review 主要审材料、快照、receipt、流程合规或证据治理。
- 不在 WorkflowHub 内重写 3rd-review 的 provider 启动、轮询、fallback、session、timeout 或 retry 生命周期；3rd-review 自己的调度和有限恢复缺陷仍在当前三仓修复范围。
- 不新增 Web 页面、dashboard 或公共 runtime 命令，除非 Talk 明确改变该假设。
- 不新增第五份当前材料、跨 stage review 状态机、双写、永久兼容桥或历史运行分支。
- 不用 review 结果决定同 task 是否允许继续修复；质量事实与推进资格分离。
- 不在 make-decision 写 spec 级页面布局、字段/API、任务步骤和测试用例。
- 不承诺盲目保留 AgentHub 兼容行为；保留项必须有 consumer、期限和删除条件。

## 新版流程要求的前置边界

- 权限与安全：不新增用户权限、凭证面或远程服务权限；继续使用现有 TaskHandle、认证 worktree、路径安全和 3rd-review 公共接口。provider 不得读取仓库、宿主路径或私有 session。
- 前置依赖：WorkflowHub main、3rd-review 公共 broker、`/Users/Hugh/.config/workflowhub/config.json` 和 ModelTest 离线评测仓是本功能的已知依赖。用户配置目前缺 mini-task 两条 route，这是待实现问题，不由 build-spec 猜默认值。
- 兼容性：保留五个正式 stage、七类 public runtime、四份当前材料和现有 3rd-review 公共请求/结果边界；不保证旧 prompt、旧重试次数、旧 snapshot stale 行为继续兼容。
- 迁移与回滚：三仓分别提交和验证；先保留旧 review/report 只读，再以版本绑定的 baseline/candidate 对照决定是否发布。任一 surface 退步或三仓版本无法读回时不宣称整体完成，可回退各仓本次提交，不创建永久兼容桥。
- 可观测性：记录每个 surface 的配置兑现率、独立上下文率、真异源率、失败分类、重试次数、墙钟、token、有效/无效 finding 和非语义复审次数；不可得写 `unavailable`。
- 验收环境：在三个仓各自认证 worktree 运行聚焦测试和集成测试；ModelTest 用相同 subject、mutation、control、配置和参数做 baseline/candidate 配对。普通 WorkflowHub 运行不依赖 ModelTest 在线可用。

## 决定

### D-001

- question/final_option: wh-review 的核心价值是什么；选择“异源对抗性 findings 优先”。
- recommendation/plain_language: 与用户原始目标一致；让模型找方向、设计、实现和测试里的真问题，不让模型替机器查清单。
- decision: Reviewer 负责语义对抗审查；Host 负责可确定验证的材料/路径/hash/覆盖检查。
- source_type/reference/exact_excerpt: user requirement R-008，“我要的不是证据治理，是对抗性审查提供的高效findings”。
- approval_binding: 用户原始要求已明确；最终方案仍待 make-decision 总确认。
- facts_and_constraints: 三任务审计显示材料治理、宽 packet、复审绑定和 provider 失败混在同一流程。
- Logic: 用户目标 -> 区分机器确定性与模型语义判断 -> 选择语义 adversarial review -> 提高 finding 密度并降低成本。
- choice_reason/impact: 直接影响五阶段合同、packet、finding schema 和失败处理。
- consequences_and_risks: 会删除一部分看似“严谨”的审查要求；若 Host 检查不完整，结构错误可能更早暴露但不会由 reviewer 兜底。
- rejected_alternatives: 继续让 reviewer 全量检查证据/流程，成本高且稀释质量；只做 deterministic lint，抓不到语义问题。
- unresolved_items/owner: 默认 reviewer 路由、语义身份细则、实施边界由本轮 Talk/Grill 解决。
- Supersedes: none。

### D-002

- question/final_option: 是否跳过决策直接整改；选择完整执行 make-decision。
- recommendation/plain_language: 先把关键取舍说清，防止 build-spec 被迫补产品方向。
- decision: 本任务先完成 make-decision；Talk、研究、方向审查、Round 3、Grill、决策草案、细节审查、阶段末 spec-analyze、用户确认和发布按当前 13 步顺序执行。
- source_type/reference/exact_excerpt: user requirement R-015，“从 make-decision 开始，不要跳阶段，也不要依赖 build-spec 补需求”。
- approval_binding: 当前用户消息。
- facts_and_constraints: make-decision v3.2 明确三轮 Talk 和真实 ask/wait/reply/resume。
- Logic: 用户流程要求 -> 阶段职责约束 -> 只完成当前决策 -> 下游不再猜方向。
- choice_reason/impact: 决策质量优先于立即改代码。
- consequences_and_risks: 需要多轮真实用户回答；本轮不会直接交付代码。
- rejected_alternatives: 直接进入 build-spec 或 build-code，违反用户要求且会留下方向空洞。
- unresolved_items/owner: none。
- Supersedes: none。

### D-003

- question/final_option: reviewer 数量由什么决定；选择“完全按受信配置列出的 reviewer 执行”。
- recommendation/plain_language: 这是现有唯一配置来源，不应由 Talk 或运行时再做动态判断。
- decision: `wh_review.stages.<stage>[.<track>].initial` 列出几个 reviewer 就调用几个；不因运行时风险标签自动增加、减少或替换。`minimum_heterologous` 只按其既有合同解释，不覆盖 `initial` 的调用数量。
- source_type/reference/exact_excerpt: actual user reply T-001，“应该根据/Users/Hugh/.config/workflowhub/config.json 配置选择，配置了几个就用几个，而不是动态判断”。
- approval_binding: 当前 host-visible 用户回复；最终方案仍待总确认。
- facts_and_constraints: 当前 `/Users/Hugh/.config/workflowhub/config.json` 已按 stage/track 配置 `initial` 数组；调用方不得自选 provider。WorkflowHub 会请求完整列表，但 3rd-review v2 当前每个 CLI adapter 最多实际启动一个 profile，后续同 adapter profile 返回 `SAME_SOURCE`，与本决定要求的“配置 N 个实际运行 N 个”不一致。
- Logic: 已有唯一配置事实 -> 禁止第二套路由决策 -> 严格执行配置 -> 行为可预测且维护面更小。
- choice_reason/impact: 消除动态风险路由及对应 benchmark 门、risk state 和隐藏成本策略。
- consequences_and_risks: 配置过多会直接增加成本，配置过少会直接增加漏审风险；责任落在配置变更及其离线评估，不由单次运行偷偷纠偏。3rd-review 必须支持同 adapter 多 profile 的实际执行；不能用 `SAME_SOURCE` 跳过，必要时可在 adapter 内串行。
- rejected_alternatives: 默认一个高风险加第二个，会违背配置并新增动态判断；固定双审或固定单审同样覆盖配置。
- unresolved_items/owner: resolved by D-010/D-012；用 ModelTest 做离线逐 surface 对照，但不改变运行时选择规则。
- Supersedes: T-001 中“风险升级单审/固定双审/全程单审”的错误问题轴。

### D-004

- question/final_option: 什么变化才需要重新审查；用户选择 A“只看真正影响审查内容的变化”。
- recommendation/plain_language: 代码、需求、测试等真的变了才重审；只写完成状态、时间或审查记录不重审。
- decision: 审查是否仍有效由当前语义内容决定；完整 Git tree 只保留审计来源，不作为自动复审开关。
- source_type/reference/exact_excerpt: actual user reply T-002，“A。接下来所有问答请用大白话，我有点看不懂了。”
- approval_binding: 当前 host-visible 用户回复；最终方案仍待总确认。
- facts_and_constraints: P5 完成后写回 T010 只改变记录，不改变代码、测试、AC 或审查合同；当前按完整 tree 判断会自触发循环。
- Logic: 用户选择 A -> 区分真实内容变化和记录变化 -> 旧审查不被自身写回作废 -> 消除重复审查。
- choice_reason/impact: 直接解决 P5/T010 循环，同时仍能在代码、测试、需求或合同改变时要求新审查。
- consequences_and_risks: 必须准确列出哪些内容影响审查；若漏掉重要内容，可能错误沿用旧结果。
- rejected_alternatives: 完整 tree 会继续自触发；只看代码测试会漏掉需求、配置、迁移和合同变化。
- unresolved_items/owner: 具体包含/排除清单由本阶段继续核实，后续 spec 写成唯一规则。
- Supersedes: 当前“任何 candidate tree 变化都作废”的复审规则。

### D-005

- question/final_option: 当时当前任务后半段是否改用 delivery-flow-quality-v1 的候选 make-decision；当时事实结论是“不切换，继续现行正式流程”。
- recommendation/plain_language: 新版思路可以吸收，但它还没有正式交付，中途换规则会让前后两半用不同标准。
- decision: 当前任务继续使用 `/Users/Hugh/Hugh/Project/workflowhub/workflows/make-decision`；候选 worktree 只作为研究来源。等候选流程正式合并部署后，新任务再使用新版入口。
- source_type/reference/exact_excerpt: user R-020 + code/test research F-018。
- approval_binding: 这是当前运行事实判断，不替代最终用户确认。
- facts_and_constraints: 候选 worktree 仍有大量未提交改动；新版 manifest 有 13 步，但 decision-log 校验仍只接受 1..12；聚焦 90 tests 通过但没有覆盖此冲突。
- Logic: 未合并且合同冲突 -> 不能成为当前权威入口 -> 保持现行流程 -> 避免同任务中途换规则。
- choice_reason/impact: 保持当前 decision-log、步骤编号和完成判断一致。
- consequences_and_risks: 当前任务暂时不能享受新版 runtime 的阶段末检查；但会吸收大白话、先查事实、完整用户流程和 mini-task 设计输入。
- rejected_alternatives: 直接切换或复制候选实现，会形成两套 make-decision 和维护漂移。
- unresolved_items/owner: 候选任务自身的 13/12 冲突及正式交付由该任务 owner 处理。
- Supersedes: 已被 D-014 按新的 main 事实取代；保留本条只为说明当时为何没有提前切换。

### D-006

- question/final_option: mini-task 是否进入本轮 wh-review 优化；用户明确选择“进入”。
- recommendation/plain_language: mini-task 也会真实调用审查，如果不一起改，会继续保留低质量 finding、重复测试和复审循环。
- decision: 当前设计范围新增 `mini-task design review` 和 `mini-task implementation review`；仍只使用四材料、现有 runtime 七类和同一个 wh-review 深接口，不把 mini-task 变成第六 stage 或第二套 WorkflowHub。
- source_type/reference/exact_excerpt: user R-021，“mini-task有设计和实施两个审查，也需要放在当前功能优化里一起调研、设计”。
- approval_binding: 当前 host-visible 用户要求。
- facts_and_constraints: mini-task skill、runner、两份合同和材料矩阵现已随 main 合并；用户配置仍没有 mini-task route。当前任务继续审计其合同复用、语义复审和实际配置兑现，不把“代码已合并”当成本次质量目标已经实现。
- Logic: 用户新增范围 -> 两次审查共享 wh-review 根因 -> 纳入统一改造 -> 避免留下旁路旧合同。
- choice_reason/impact: 影响审查轴复用、配置、语义身份、测试事实和完成边界。
- consequences_and_risks: 当前任务范围扩大；若直接复制现有 stage prompt，会增加重复规则和维护成本。
- rejected_alternatives: 不处理 mini-task 会留下独立低质量审查旁路；把 mini-task 建成完整第六 stage 会违反当前宪法边界。
- unresolved_items/owner: resolved by T-003/D-007；复用公共角度并只补 mini-task 专属问题。
- Supersedes: none。

### D-007

- question/final_option: mini-task 两次审查怎样复用五阶段规则；用户选择 A“共用审查积木，mini-task 只补自己的问题”。
- recommendation/plain_language: 核心审查方法只维护一份，mini-task 不复制大合同；它只增加“小任务是否变大”和“实现是否越界”两类专属检查。
- decision: mini-task design 组合 build-spec 与 build-plan 的公共审查角度；mini-task implementation 组合 build-code 与 verify-code 的公共审查角度。公共角度来自唯一规则源，mini-task 合同只声明组合和专属问题。
- source_type/reference/exact_excerpt: actual user reply T-003，“A”。
- approval_binding: 当前 host-visible 用户回复；最终方案仍待总确认。
- facts_and_constraints: 候选 mini-task 两份合同当前过于宽泛；复制完整 stage 合同会造成多份规则漂移。
- Logic: 用户选择 A -> 提取可复用审查角度 -> mini-task 组合使用并补专属问题 -> 提高一致性并降低维护成本。
- choice_reason/impact: 同时保证 mini-task 的设计质量、实现质量和范围控制。
- consequences_and_risks: 公共审查角度必须有清楚的唯一来源和稳定接口；不能变成层层引用、运行时拼装不透明的大系统。
- rejected_alternatives: 独立完整合同重复维护；原样照搬某一 stage 会漏掉 mini-task 特有范围问题。
- unresolved_items/owner: 公共规则的实现边界和跨仓修改范围由后续 Talk 决定。
- Supersedes: 候选 mini-task 两份完全独立、宽泛的审查合同方向。

### D-008

- question/final_option: 本次修改是否同时覆盖 WorkflowHub 和 3rd-review；用户选择 A“两边一起改”。
- recommendation/plain_language: 哪边负责的问题就在哪边修，不在 WorkflowHub 里再写一套 provider 补丁。
- decision: WorkflowHub 修改 stage/mini-task 审查角度、材料范围、finding 合同、语义复审规则和 finding 处置；3rd-review 修改配置执行一致性、同 adapter 多 profile 调度、并发、错误分类、有限恢复和同 session 输出修复。两边通过现有公开接口连接。
- source_type/reference/exact_excerpt: actual user reply T-004，“A”。
- approval_binding: 当前 host-visible 用户回复；最终方案仍待总确认。
- facts_and_constraints: 当前配置 N 个但 3rd-review 可能因同 adapter 跳过后续 profile；provider lifecycle 本来就是 3rd-review owner。
- Logic: 用户选择完整链路 -> 按真实 owner 分仓修复 -> 不复制能力 -> 同时解决 finding 质量和执行耗时。
- choice_reason/impact: 只改 WorkflowHub 无法保证实际 reviewer 数量，也不能根治 provider 重试和慢尾。
- consequences_and_risks: 需要两个仓库协调版本和集成测试；公开接口必须保持单一，不能形成长期兼容桥。
- rejected_alternatives: 只改 WorkflowHub 会留下 broker 根因；只改 prompt 会留下复审、调度和失败问题。
- unresolved_items/owner: 跨仓发布顺序和兼容窗口由 build-plan 设计，不在本阶段猜实施步骤。
- Supersedes: 仅修改 wh-review prompt/contracts 的窄范围方案。

### D-009

- question/final_option: make-decision 的方向审查何时看到当前选择；用户选择 A“先独立判断问题，再看当前方案挑错”。
- recommendation/plain_language: 先避免被现有方案带偏，再真正检查我们选的方案有没有问题。
- decision: 一个逻辑 direction review 由两个有顺序、无持久 session 的小请求组成。A 请求只含原始需求、客观事实、约束和未知项，输出问题重建；A 完成后，B 请求才加入当前选择、备选、理由、关键假设和 A 的结果，执行反方论证、更小方案搜索和失败预演。两次请求在同一最终 review fact 聚合，不新增 continuation/recovery/rebind 状态。
- source_type/reference/exact_excerpt: actual user reply T-005，“A”。
- approval_binding: 当前 host-visible 用户回复；最终方案仍待总确认。
- facts_and_constraints: 现合同全程隐藏当前方向，却声称审查方向，能力和目标不一致；一开始全给又容易产生锚定。
- Logic: 用户选择分段揭示 -> 保留独立问题重建 -> 再审当前选择 -> 同时降低锚定和伪盲审。
- choice_reason/impact: 直接改 make-decision direction packet 和 prompt；不增加额外 review 调用。
- consequences_and_risks: direction 比单请求多一次小调用；A 包必须严格小，B 不重复发送无关事实。换来的是真实未泄露，而不是要求已经看到全部材料的模型假装没看。
- rejected_alternatives: 全盲无法审当前选择；全量先看会削弱独立性。
- unresolved_items/owner: 具体 packet 文件顺序和测试由 build-spec/build-plan 细化。
- Supersedes: 当前 direction review 全程禁止读取当前方向的规则。

### D-010

- question/final_option: 怎样证明 wh-review 改造确实提高质量并降低成本；用户要求复用 ModelTest 做修改前/后全 stage 对照。
- recommendation/plain_language: 用同一套隐藏缺陷和干净样本分别测旧版、新版；固定 reviewer 和配置，质量、时间、token、失败分开比较，不能只看一个平均分。
- decision: 复用 ModelTest 的固定 subject、hidden mutation、clean control、不可变 execution、独立评分和 provider 身份；为五个正式 stage 的 7 个 review surface 加上 mini-task design/implementation 共 9 个 surface，建立 baseline/candidate 两个独立 cohort。每个 case、每个配置 reviewer、每个版本运行 5 次；两边都可用时至少形成 4 组有效前后配对。baseline 因已知缺陷完全不可用的 reviewer 不伪造配对分：candidate 改用固定绝对质量门槛，执行率改善单独报告。失败不计质量 0，但必须进入执行有效率和完整性，不能从分母消失。
- source_type/reference/exact_excerpt: actual user reply T-006，“可以使用 /Users/Hugh/Hugh/Project/ModelTest 里面的评测方案，修改前和修改后都审查一遍所有stage，看看效果对比有没有更好，评分有没有更高。”
- approval_binding: 用户已确认采用 ModelTest 前后对照；G-001/D-011/D-012 已进一步确认把必要修正纳入当前交付并逐 surface 验收。
- facts_and_constraints: ModelTest 已有 7 个正式 review surface、mutation/control、manifest、execution record 和四项独立分数；缺 mini-task 两面。当前 US-05 runner 每组合只跑一次，失败执行会被排除；US-04 存在 mutation 全漏仍 `calibration_ready`，US-05 matcher 未严格确认 finding 命中目标 mutation。
- Logic: 用户要求前后评分 -> 固定唯一变化为 wh-review 版本 -> 使用隐藏缺陷和干净样本 -> 做逐 surface 配对 -> 同时证明质量、成本和可靠性变化。
- choice_reason/impact: 能把“提示词看起来更好”变成可重复结果，也能发现某一个 stage 退步、假绿、误报或用高成本换分数。
- consequences_and_risks: 真实评测调用量较大；必须先修正 matcher、重复运行和失败完整性，否则会产生假提升。mini-task 只作为评测 surface，不成为第六 stage。
- rejected_alternatives: 只跑一次随机性太大；只比较总平均会掩盖单 stage 退步；只看材料契约分会偏离高效 finding 目标；失败样本直接删除会抬高候选分。
- unresolved_items/owner: resolved by G-001/D-011/D-012；build-spec 只固化 fixture、版本化公式和字段，不能改变逐 surface 门槛。
- Supersedes: OPEN-004 的“只观察不设对照”候选。

### D-011

- question/final_option: ModelTest 的必要修正是否纳入当前任务；用户选择 A“一起修改”。
- recommendation/plain_language: 评测工具如果会给出假高分，就不能拿它证明 wh-review 变好了；因此只把这次可信对照必需的修正一起交付。
- decision: 当前交付范围扩为 WorkflowHub、3rd-review、ModelTest 三个仓库。ModelTest 只修改本次前后配对评测必需的 matcher、重复运行、失败完整性、逐 surface 比较和 mini-task 两组评测资产；不把 ModelTest 变成 WorkflowHub 日常运行依赖。
- source_type/reference/exact_excerpt: actual user reply G-001，“A，A”中的第一个 A。
- approval_binding: 用户已确认方向；最终完整决定仍待 Step 12 总确认。
- facts_and_constraints: 当前 ModelTest 基础设施可复用，但 F-022 的假提升缺口会破坏发布结论。
- Logic: 评测是交付证明 -> 当前评测存在假提升 -> 同任务修正必要能力 -> 才能可信比较新版与旧版。
- choice_reason/impact: 增加第三仓交付和集成工作，但避免另开任务后当前功能无法验收。
- consequences_and_risks: 跨仓协调和运行成本增加；必须限制为唯一 consumer 是本次 wh-review benchmark 的版本化资产，不新增日常控制面。
- rejected_alternatives: 另开任务会让当前交付长期保持“效果未知”；原样使用会产生不可相信的高分。
- unresolved_items/owner: 三仓改动顺序、版本绑定和回滚由 build-plan 负责。
- Supersedes: D-008 的双仓范围；D-008 的 owner 分工仍有效。

### D-012

- question/final_option: 新版按每个审查面验收，还是只看整体平均分；用户选择 A“9 个审查面分别不能退步”。
- recommendation/plain_language: 每一关都保护不同的交付错误，不能用代码审查涨分掩盖需求审查变差。
- decision: 9 个 review surface 分别比较 baseline/candidate。对可配对 reviewer，每面严重缺陷召回不得下降、clean control 误报不得上升、执行率不得下降，`delivery_quality`、token 与时长均不得越过非劣化线；并且质量至少提高 5 分，或 token/时长至少一项降低 15% 且另一项不恶化超过 10%。baseline 未实际执行的配置 reviewer，candidate 必须达到 `delivery_quality >= 80`、每个严重 mutation 在至少 4/5 有效运行中命中、clean control 误报不超过 1/5；新增真实执行成本单列，不能拿 baseline 的“没运行、零成本”判退步。少于 4 对有效结果或 token/时长不可计算时记 `inconclusive`，不算通过。执行可靠性单列，不能代替质量或成本改善。跨 surface 平均分只展示，不用于抵消退步。
- source_type/reference/exact_excerpt: actual user reply G-001，“A，A”中的第二个 A。
- approval_binding: 用户已确认方向；最终完整决定仍待 Step 12 总确认。
- facts_and_constraints: make-decision 和 build-code 各有两个不同 surface；mini-task 两面也有独立失败模式。
- Logic: 各 surface 防不同缺陷 -> 平均会掩盖局部退步 -> 分面设置非劣化 -> 至少一项改善才证明改造有价值。
- choice_reason/impact: 保护每个 stage 的执行质量，直接回答用户“不降低各 stage 质量”的要求。
- consequences_and_risks: 候选更难通过，可能需要多轮修正；但 review 事实不阻止同 task 继续修复。
- rejected_alternatives: 只看总平均会允许单 stage 退步；只要求质量不退步无法证明本次改造有收益。
- unresolved_items/owner: build-spec 只写 fixture、字段和计算步骤，不得改变本条阈值或改成总平均抵消。
- Supersedes: none。

### D-013

- question/final_option: 细节审查后的宪法反查发现严重 finding 处置、正式 surface 跳过、同源判定和语义有效性仍可能形成冲突；选择按宪法收紧，不扩大用户目标。
- recommendation/plain_language: 配置里写的 reviewer 都要在新上下文执行，但“执行了”不等于“真正异源”；严重风险也不能由执行者自己替用户接受。
- decision: 9 个正式 surface 缺 route 或执行失败只能是 `unavailable`；mini-task 增加显式 design/implementation route并删除 caller 写 `passed`。所有配置 profile 在隔离进程执行，同时单列配置兑现率、独立上下文率、异源率；route 必须至少有一个真异源 profile。语义 hash 只作当次纯函数比较。`major|blocking` 不修时必须由用户明确接受具体风险。
- source_type/reference/exact_excerpt: CONSTITUTION.md F1/F3/Q3/F10；细节审查与两路独立反向审查。
- approval_binding: 这是服从仓库宪法和用户已确认 D-003/D-006/D-008 的闭合修正；最终完整决定仍待 Step 12 总确认。
- facts_and_constraints: 当前 `SAME_SOURCE` 仅按 host adapter 标签跳过配置 profile；mini-task 无 route；旧草案把 `current/stale` 写得像可变状态。
- Logic: 配置必须兑现 + 审查必须异源 -> 全部 profile 隔离执行并分开统计 -> 至少一个真异源；禁止新 lineage -> 只保留纯函数 hash；严重风险需人承担 -> Host 只记录。
- choice_reason/impact: 同时修复配置未兑现和“执行数量冒充异源数量”，不新增公共命令或流程状态机。
- consequences_and_risks: 配置不含真异源 reviewer 时会更早明确失败；这是配置错误，不做 fallback。
- rejected_alternatives: 继续按 adapter 名跳过违反用户配置；让 Host 接受严重风险违反宪法；持久化 stale/current 会重建 lineage。
- unresolved_items/owner: 无方向未决项；字段名和 schema 位置由 build-spec 明确。
- Supersedes: D-003 中“执行数量即完整异源覆盖”的潜在误读。

### D-014

- question/final_option: delivery-flow-quality-v1 已合并 main 后，当前任务是否切换到新版流程；选择“同步 main，并从当前未完成位置按新版流程继续”。
- recommendation/plain_language: 已完成的 Talk、调研和两次 advice 不重跑；新版新增的阶段末需求完整性检查必须补做，然后才请用户最终确认。
- decision: 当前分支已快进到 main `249e2cd7ff84756fb9509d0716f013b5a94a75e8`，从旧流程完成 Step 10 的位置接入新版 13 步 make-decision；执行新 Step 11 `stage-end-spec-analyze`，真实用户确认改为 Step 12，发布为 Step 13。
- source_type/reference/exact_excerpt: user R-022；当前 main/branch Git 读回；新版 `workflows/make-decision/steps.json` 和 `docs/standard-workflow.md`。
- approval_binding: 用户明确授权同步 main 并使用新版流程；最终产品决定仍需新版 Step 12 的真实确认。
- facts_and_constraints: main 与当前分支 HEAD 均为 `249e2cd7ff84756fb9509d0716f013b5a94a75e8`；新版 make-decision 已统一为 13 步并包含 stage-end spec-analyze。同步时发现旧分支大小写与新版确定性命名冲突，现已在不改变提交和文件的前提下改为 `task/workflowhub/wh-review-adversarial-quality-cost-redesign`；当前仅本任务 specs 目录未跟踪。主仓原有未提交文件未被修改。
- Logic: 候选流程已正式合并 -> D-005 的阻塞事实消失 -> 保留已完成且仍符合新顺序的 Steps 1..10 -> 补做新增 Step 11 -> 再进入用户确认。
- choice_reason/impact: 不浪费已完成调研和 review，也不跳过新版新增的需求完整性保护。
- consequences_and_risks: 需要修正 decision-log 中所有“候选未合并”“最终确认是 Step 11”的旧描述；若 Step 11 发现缺口，必须在 make-decision 当场修复。
- rejected_alternatives: 从 Step 1 全部重跑会重复消耗时间/token；忽略新 Step 11 会违反当前标准流程；继续沿用 D-005 会与 main 事实冲突。
- unresolved_items/owner: 无流程方向未决；Step 11 的真实 findings 及处置记录在本阶段完成。
- Supersedes: D-005 的“不切换”结论和旧 12 步编号；不覆盖 D-005 的历史事实。

### D-015

- question/final_option: 新发现的正式验收事实与 close 不一致，是否另开 mini-task；选择“留在当前任务，按标准阶段补范围并修复”。
- recommendation/plain_language: 这不是一个孤立小功能，而是 review、验收、finding、例外、人工确认和 close 的共同边界。拆成 mini-task 会多出一套材料和审查，反而把根因拆散。
- decision: 在当前任务补记并实现正式事实闭合：verify-code 完成和 task-close 都必须看到当前、已认证的完整 verify 事实；测试代码身份与当前交付材料身份分开；只写回记录字段时可复用测试/review 结果，但不能把代码或真实需求变化当成记录变化。
- source_type/reference/exact_excerpt: 用户 R-024；当前 `CONSTITUTION.md` F3/Q1/Q2、`runtime/stage/completion-predicates.mjs`、`core/task-close.mjs` 和当前测试审查。
- approval_binding: 用户明确授权“按计划处理”；这是同一目标的根因修复，不改变产品方向。
- facts_and_constraints: 当前 stage completion 已列出 `independent_review`、`finding_dispositions`、`acceptance_criteria`、`exceptions`、`human_confirmation`，但 close 只直接检查测试和独立审查；材料只变的测试 receipt/review result 复用能力已存在，仍需用集成测试锁住。进一步代码审查发现 `stage-handlers.mjs` 原来只把 serious finding 放进 disposition，普通 finding 会丢失；`accepted_risk` 只检查字符串状态，不检查真实用户风险 receipt；mini-task 原来只有测试和 review，且没有完整 finding/人工确认事实。
- Logic: 正式交付必须能回答“测了什么、审了什么、finding 怎么处理、AC 是否满足、例外是否交接、谁确认了”；因此 close 复用同一套已认证事实，不新增第五材料、状态机或公共命令。所有 canonical finding 都要有处置，严重 finding 只额外要求真实风险确认；mini-task 复用同一 finding 合同，并由调用方显式提供 human confirmation，不能自动伪造。
- choice_reason/impact: 防止“测试和 review 有了就能 close”的假绿，同时避免材料写回导致重复测试和 provider 审查。
- consequences_and_risks: 旧 fixture 若只造测试和 review 会被判 incomplete；这是测试契约变严格，不是把 review verdict 变成 provider pass 门槛。普通 finding 也会增加一条必要处置记录，但不会因此增加 provider 调用。任何代码或语义需求变化仍必须重新产生当前事实。
- rejected_alternatives: 新开 mini-task；只放宽 close 快照；让缺失事实自动通过；把质量事实变成继续修复许可证。
- unresolved_items/owner: 具体字段读取和测试矩阵由 build-plan/build-code 细化；`runtime/stage/completion-predicates.mjs` 当前规则保持不变。
- Supersedes: 无；补充 D-004 的 record-only 复用边界和 D-013 的正式事实边界。

### D-016

- question/final_option: ModelTest 的分数是否必须达到固定数字才能继续或交付；选择“分数只做事实和对照，不做强制闸门”。
- recommendation/plain_language: 分数可以帮助比较发现质量、稳定性和成本，但不能因为差 0.42 分就阻塞真实修复，也不能把 provider 超时混成审查质量失败。
- decision: ModelTest 继续按 surface 记录严重缺陷召回、误报、finding 质量、执行可靠性、token、时长和失败分类；`delivery_quality` 仍可计算，但不再要求达到 `80` 才能继续、修复或正式交付。有效 A/B 负责说明“哪里变好、哪里变差、哪里不知道”；缺配对、provider 失败或成本不可得仍保持 `inconclusive/unavailable`，不改写成通过。WorkflowHub 的 stage 完成和 task-close 只看四份材料、当前 AC、测试、独立 review、finding 处置、例外和人工确认，不读取 benchmark 分数作为完成许可。
- source_type/reference/exact_excerpt: 当前用户目标，“我希望最终所有审查不但质量更高更稳定，而且成本更可控，不要强制要求分数达标”。
- approval_binding: 当前 host-visible 用户要求；作为本次继续执行的直接方向确认。
- facts_and_constraints: v8 的 direction 从 `66` 到 `71.8`、detail 从 `62.5` 到 `79.58`，召回有提升但成本和耗时明显上升；当前 benchmark scorecard 的文字公式与实际 scorer 不一致。固定 80 不能代替逐项质量、可靠性和成本判断。
- Logic: 用户目标是高质量、稳定、成本可控 -> 单一总分不能表达三件事 -> 保留分数作为诊断事实并拆开报告 -> 删除分数闸门，避免继续为凑分进行无效重跑。
- choice_reason/impact: 允许同 task 继续修复真实 finding，也允许用户看到“质量提升但变慢”这种真实取舍；不会把 unavailable、unknown、失败或无 finding 写成通过。
- consequences_and_risks: 没有一个数字替用户裁决“更好”；每个 surface 必须保留明确的质量、稳定性、成本和证据完整性结论。ModelTest 评分口径和报告字段需要同步修正，旧 comparison 只读保留。
- rejected_alternatives: 保留 80 硬闸门会把局部明显提升判成未交付；删除所有评分会失去逐面对照；改成跨 surface 总平均会掩盖单个 stage 退步。
- unresolved_items/owner: build-spec 更新 FR-EVAL/AC-20 的语义；build-plan 更新 P5 的 oracle；ModelTest 修正 scorecard/scorer/matcher 的口径并保留旧历史；WorkflowHub 不新增评分控制面。
- Supersedes: D-012 和旧 FR-EVAL-004 中“candidate 必须达到 80 才能通过/交付”的强制闸门部分；D-012 关于逐 surface、失败保留、不能用平均掩盖退步的部分继续有效。

## 三轮 talk

| talk_id | 问题/选项 | 后果/风险 | 用户选择/原文 | 队列变化 | source/evidence |
| --- | --- | --- | --- | --- | --- |
| T-001 | Round 1 问题 1：默认审查路由选风险升级单审、固定双审或全程单审 | 用户指出问题前提错误：已有配置就是唯一来源 | “这个问题不应该问，因为应该根据/Users/Hugh/.config/workflowhub/config.json 配置选择，配置了几个就用几个，而不是动态判断” | 删除动态路由轴和“高风险触发第二 reviewer”轴；Round 1 剩余方向问题为 0，已收敛 | host-visible current reply / `/Users/Hugh/.config/workflowhub/config.json` |
| T-002 | Round 2 问题 1：什么变化才需要重新审查 | A 只看真实审查内容；B 看全部文件；C 只看代码测试 | “A。接下来所有问答请用大白话，我有点看不懂了。” | A 已选择；剩余问题重排，并新增 R-020/R-021 的事实核查，不把事实问题重新问用户 | R-012 / F-006 / F-016 / host-visible reply |
| T-003 | Round 2 问题 2：mini-task 两次审查怎样复用五阶段规则 | A 共用底层审查角度并补 mini 专属问题；B 各写一套完整合同；C 直接照搬某个 stage | “A” | 删除“复制 mini 合同”和“原样照搬 stage”方向；剩余 2 个会改变方向的问题 | R-021 / F-019 / host-visible reply |
| T-004 | Round 2 问题 3：本次修改是否同时覆盖 WorkflowHub 和 3rd-review | A 同时修完整链路；B 只改 WorkflowHub；C 只改提示词合同 | “A” | 跨仓完整修复已确定；剩余 1 个会改变方向的问题 | D-003 / F-010 / F-016 / host-visible reply |
| T-005 | Round 2 问题 4：make-decision 的方向审查何时看到当前选择 | A 先独立判断问题、再看当前选择反驳；B 全程看不到选择；C 一开始就看全部 | “A” | Round 2 剩余 high/medium 问题为 0，本轮收敛 | F-011 / F-017 / OPEN-008 / host-visible reply |
| T-006 | Round 3：怎样证明改造后质量更高、成本更低 | A 发布前做固定对照评测；B 只记录数据 | “可以使用 /Users/Hugh/Hugh/Project/ModelTest 里面的评测方案，修改前和修改后都审查一遍所有stage，看看效果对比有没有更好，评分有没有更高。” | 采用同一评测方案做改造前/后全 stage 对照；具体评分与达标规则先核实 ModelTest，不凭空新造 | FND-DIR-004 / host-visible reply |

## 调研

### 并行调研执行索引

| 独立工作线 | 输入范围 | 输出落点 | 状态 |
| --- | --- | --- | --- |
| WorkflowHub 真实任务审计 | 全部 attempt/result/report | AUDIT-001、逐 stage 表 | completed |
| ModelTest US-06 审计 | 全部 attempt/result/report | AUDIT-002、失败根因 | completed |
| KnowledgeDigest 2-C 审计 | 全部 attempt/result/report | AUDIT-003、packet 根因 | completed |
| 五阶段 AnySearch | 一手研究与本地合同 | F-009、F-011..F-016 | completed |
| 外部方案对标 | AgentHub、Occam、Matt | F-004/F-007/F-008/F-017 | completed |
| delivery-flow/mini-task | 新 main、skill、runner、合同 | F-018..F-020/F-024 | completed |
| 原始需求交叉审计 | 当前线程与 decision-log | COVER-001..008 | completed |
| 新流程兼容与 spec-analyze | 新 skill/宪法/当前材料 | D-014、Step 11 | completed |

每条线在独立上下文只读检查，主代理统一核对原始文件、处理冲突并写回。子代理身份和原始长输出属于运行事实，不复制进当前材料；这里保留任务书、输入、结果落点和状态，足以证明分工没有静默丢失。

| research_id/source | 调研重点 | 关键事实 | 处理状态 | 关联 D |
| --- | --- | --- | --- | --- |
| F-001 / 三个 referenced tasks | 真实使用样本 | 必须逐 stage 保留原始结果、失败、耗时/token 和 packet 证据，不能只留总评 | completed；已进入 F-002..F-020、方向/细节 attempt 和完整决定草案 | D-001 / D-010 |
| F-002 / current-session root-cause research | 质量低和 packet 过宽 | Host 确定性职责与 Reviewer 语义职责混杂；合同、材料矩阵、硬编码 prompt 重复漂移 | completed | D-001 / 完整决定草案 |
| F-003 / current-session failure research | 失败/重试/耗时 | provider 启动/死亡/超时、非法 JSON、packet 过大、合同冲突、无 finding 被误判、非语义 stale、无条件多 reviewer、重复组包和结果写回自触发 | completed | D-003/D-004/D-008 |
| F-004 / AgentHub vibecoding | 原版比较 | 比较标准必须是严重 finding 召回、无效 finding、合同失败、成本和耗时，不以 prompt 长度判优 | completed | F-017 / D-001 |
| F-005 / CONSTITUTION + checklist | 合规与维护性 | 四材料、review 非许可、七类 public runtime、禁止 lineage/replacement/continuation、新对象需唯一 owner/consumer/retirement | completed | D-001/D-006/D-011/D-012 / 宪法结论 |
| F-006 / P5-T010 scenario | 重复复审根因 | tasks.md 同时承载设计与状态，完整 snapshot 把状态写回误当语义变化 | completed：纯函数语义 hash + provenance tree | D-004 |
| F-007 / Occam Review | build-code necessity | 先正确性后必要性；public/wire surface 必须有真实 producer/consumer；攻击 fallback、重复验证、兼容层和无消费者控制面 | 建议并入同一次 build-code review | OPEN-006 |
| F-008 / Matt Pocock code-review | build-code 质量 | Spec 与 Standards 分轴、固定基点、具体引用、仓库规则优先、跳过 lint、无空泛 verdict；需补 correctness 和未提交 diff | 建议形成三轴审查 | OPEN-006 |
| F-009 / AnySearch 五阶段研究 | stage focus | decision 找错问题/方向/假设/更小路；spec 用反例找遗漏矛盾/旅程状态/恢复/oracle；plan 重建因果图找依赖顺序/consumer/迁移回滚/可证明性；code 三轴；verify 全 AC 反查 claim/实现/assertion | completed | D-009 / 完整决定草案 |
| F-010 / WorkflowHub config + 3rd-review v2 | 配置执行一致性 | WorkflowHub 把完整 `initial` 作为请求列表；但 3rd-review `workflowhub-result.v2` 每个 CLI adapter 最多启动一个 profile，后续同 adapter profile 返回 `SAME_SOURCE`。所以“请求 N 个”不等于“实际执行 N 个” | 已核实跨仓缺陷；应由 3rd-review 支持同 adapter 隔离并行或 adapter 内串行 | D-003 |
| F-011 / AnySearch make-decision | 方向审查 | 先盲重建问题，再看当前选择做反方论证；现合同禁止 direction reviewer 看方向，无法判断“所选方向错” | completed；GOV.UK Discovery、NASA Decision Analysis、RAND ABP、SEI ATAM | OPEN-008 |
| F-012 / AnySearch build-spec | 规格反例攻击 | 重点是需求削弱/扩大、FR/AC 矛盾、完整旅程、状态转换、失败恢复、幂等和 false-green AC；流程/clarification 治理退出 reviewer prompt | completed；RFC 8174、GOV.UK Service Manual、Google AIP-155/216、NASA SWE-051、QuickCheck | F-009 |
| F-013 / AnySearch build-plan | 可执行因果图 | `task -> 产物/接口/数据 -> consumer -> verification -> recovery`；finding 必须给执行序列、失败机制、可观察影响和最小修正 | completed；Terraform graph、Pact、AWS cutover、Kubernetes、NASA verification matrix | F-009 |
| F-014 / AnySearch build-code | 三轴代码审查 | 每个配置 reviewer 一次调用内依次完成 `spec_conformance`、`correctness`、`necessity`；Phase 看完整 Phase diff，Integration 看任务基线到最终 candidate 的完整净 diff | completed；Occam Review、Matt Pocock code-review、Google Engineering Practices、现代代码审查研究 | OPEN-006 |
| F-015 / AnySearch verify-code | 声明反查 | 所有 AC 先完整覆盖，再对弱 oracle/高风险深审；链路为 claim/AC -> implementation -> consumer -> test -> assertion -> result；当前包缺实现和断言，只能审主 agent 摘要 | completed；Test Oracle Survey、NASA Product Verification、mutation/coverage 实证研究 | F-009 |
| F-016 / AnySearch failures | 失败/重试/耗时 | 根因是长上下文稀释、schema 过重、错误分类混合、多层重试相乘、独立 reviewer 串行、完整 snapshot stale；structured output 只保证结构，不保证 finding 正确 | completed；Lost in the Middle、JSONSchemaBench、OpenAI/Anthropic Structured Outputs、AWS backoff、Google retry | OPEN-005 |
| F-017 / AgentHub 对标 | 是否更好 | WorkflowHub 的配置路由、冻结安全、最小 JSON、失败真实性更好；stage 对抗脚手架更弱；build-plan 重复材料、transport metadata、四 maps 漂移和大 diff 摘要只是更复杂 | completed；本地固定路径逐文件对标 | OPEN-008 |
| F-018 / delivery-flow-quality-v1 | 新 make-decision 流程是否已成为可用标准 | 历史检查时尚未提交/合并且存在 13/12 冲突，所以当时不能接管；现已由 F-024 的 main 事实取代 | completed_historical | D-005 / D-014 |
| F-019 / mini-task | 小需求流程及两次审查 | skill/runner/design/implementation route 已进入 main；真实用户 config 仍无 mini-task route，调用方缺省 status 仍可写 `passed`，重试和完整 snapshot 复审语义仍需本任务修正 | completed_current | D-006 / T-003 / D-013 |
| F-020 / mini-task review reuse | 合同复用 | design 组合 build-spec+build-plan 并补“是否仍然够小”；implementation 组合 build-code+verify-code 并补真实用户结果和范围越界 | completed_selected | T-003 / D-007 |
| F-021 / ModelTest 前后评测 | 可复用能力 | 固定 subject、hidden mutation、clean control、不可变 manifest/execution、provider 身份和独立评分可复用；现有 7 个 surface，需补 mini-task 两面 | completed | D-010 |
| F-022 / ModelTest 假提升风险 | 当前实现缺口 | mutation 全漏仍可能 `calibration_ready`；US-05 matcher 不严格确认目标缺陷；正式 runner 每组合一次；失败样本从评分分母消失；缺前后配对和逐 surface 非劣化判断 | completed；不能原样作为发布依据 | D-010 / G-001 |
| F-023 / ModelTest 最小修正 | 可信比较条件 | 严重缺陷漏检硬失败；严格 matcher；5 次运行且至少 4 对有效；A/B 盲名与交错顺序；失败计执行有效率；质量、耗时、token、重试分开；任何 surface 不被平均数掩盖 | completed | G-001 |
| F-024 / main 同步与新版流程 | 当前权威流程 | delivery-flow-quality-v1 已进入 main `249e2cd7...`；make-decision 当前为 13 步，新增 Step 11 `stage-end-spec-analyze`，确认/发布顺延为 12/13；当前任务已同步到同一 HEAD | completed | D-014 / Step 11 |

## 三个真实任务审计

逐 attempt 原始账本保留在下列 `quality/reviews/` 和三条 referenced task rollout 中；decision-log 不复制数百条 provider 记录，避免制造第二份会漂移的审查事实。下表和后续逐 stage 判断是对全部 attempt 的汇总，无法取得的耗时、token、retry 或 packet 原因明确保持 `unavailable`。

原始事实不复制改写，完整 attempt/result/report 分别保留在以下只读目录；本表是人工质量判断和索引：

- WorkflowHub：`/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-delivery-flow-quality-v1/quality/reviews/`
- ModelTest US-06：`/Users/Hugh/Hugh/Knowledge/Projects/ModelTest/tasks/US-06/quality/reviews/`
- KnowledgeDigest Task 2-C：`/Users/Hugh/Hugh/Knowledge/Projects/KnowledgeDigest/tasks/task2c-knowledge-publication-trust-reader-quality/quality/reviews/`

### task × surface 原始执行汇总

`语义/不可用`来自 attempt 终态；provider 秒是各 provider 已知时长之和，不等于并行后的墙钟。token、时长缺失不估算。

| 任务 | surface | attempt 语义/不可用 | provider 完成/失败 | 已知 token / 秒 |
| --- | --- | --- | --- | --- |
| WH | decision/direction | 2：2/0 | 2/2 | 28,968 / 194 |
| WH | decision/detail | 2：2/0 | 2/2 | 28,946 / 343 |
| WH | build-spec | 3：2/1 | 4/5 | 136,126 / 1,079 |
| WH | build-plan | 3：0/3 | 0/0 | unavailable |
| WH | code/P1 | 9：9/0 | 17/10 | 714,071 / 7,418 |
| WH | code/P2 | 10：8/2 | 16/8 | 915,763 / 5,593 |
| WH | code/P3 | 4：4/0 | 7/5 | 506,819 / 2,467 |
| WH | code/P4 | 9：5/4 | 8/10 | 605,923 / 3,496 |
| WH | code/P5 | 8：4/4 | 4/8 | 53,543 / 1,456 |
| WH | code/integration | 1：1/0 | 1/2 | 13,488 / 400 |
| WH | verify | 3：3/0 | 3/3 | 45,589 / 197 |
| MT | decision/direction | 2：2/0 | 2/2 | 28,957 / 215 |
| MT | decision/detail | 2：2/0 | 2/2 | 28,924 / 217 |
| MT | build-spec | 1：1/0 | 2/1 | 77,733 / 314 |
| MT | build-plan | 3：2/1 | 4/2 | 94,261 / 1,010 |
| MT | code/integration | 25：14/11 | 16/38 | 1,384,508 / 9,445 |
| MT | verify | 12：4/8 | 4/4 | 57,935 / 233 |
| KD | decision/direction | 5：5/0 | 5/5 | 72,554 / 310 |
| KD | decision/detail | 2：2/0 | 2/2 | 28,937 / 206 |
| KD | build-spec | 2：2/0 | 2/4 | 28,969 / 760 |
| KD | build-plan | 2：1/1 | 1/2 | 14,613 / 399 |
| KD | code/P1 | 31：18/13 | 35/28 | 1,790,934 / 11,414 |
| KD | code/integration | 22：16/6 | 22/26 | 1,694,136 / 9,607 |
| KD | verify | 10：5/5 | 5/5 | 72,427 / 403 |

| audit_id | 任务 | attempts/有效 | finding 质量 | 失败与成本 | 重复/packet |
| --- | --- | --- | --- | --- | --- |
| AUDIT-001 | WorkflowHub flow quality | 54 attempts / 40 results | 140 findings：50 actionable、90 minor；含 2 blocking、48 major | 119 provider records 中 55 failed；49 `SAME_SOURCE`；已知 3,049,236 tokens；5 次内部 retry | build-plan 同 snapshot 3 次；verify 同 snapshot 3 次；P4/P5 多组同 snapshot 重复；thread 记录两次 >330 KiB |
| AUDIT-002 | ModelTest US-06 | 44 attempts：25 semantic、19 unavailable | 56 合并 findings：17 actionable major、39 minor；另有 15 invalid-anchor、3 not-adopted | 14 `OUTPUT_INVALID`、1 provider-invalid、34 `SAME_SOURCE`；build-code 单次可达 615 秒，K3 build-plan 慢尾 622 秒 | snapshot `1c6dc2…` 9 次，其中 verify 8 次、7 次 provider 前失败；PNG/receipt/必填/禁止材料反复组包失败 |
| AUDIT-003 | KD Task 2-C | 74 attempts：49 semantic、25 unavailable | 223 clusters 最终保留 180：45 actionable、135 minor；42 invalid evidence、1 needs-corroboration | 22 `MATERIAL_INCOMPLETE`、3 protocol failure；V4 平均 213 秒/14491 tokens；pi/coding 平均 328 秒/90678 tokens | 8 次明确 >330 KiB；相同 snapshot+material 共 13 次执行，比一次执行多 8 次 |

### 逐 stage 质量判断

| stage/surface | 真实样本结论 | 高质量判断 | 主要浪费 | 新方案针对点 |
| --- | --- | --- | --- | --- |
| decision/direction | 能找到错方向和前提，但同 snapshot 多次给出不同数量 findings | 不稳定；部分有效 | 重复审查、约 14.5k tokens/次、偏材料边界 | 真分段问题重建 + 方向反驳；去掉流程/材料治理 |
| decision/detail | 能找到遗漏/矛盾，也大量检查 Talk/Grill 字段 | 中等；元数据 finding 过多 | 重复交付同一 decision-log、100–239 秒/次 | Blindspot/Drift/Scope；Host 验格式 |
| build-spec | 多次找到 4–5 个 major，说明语义价值真实 | 较高但昂贵 | 单 provider 最高约 56k tokens；协议/终态失败 | 旅程/状态/失败/oracle 反例；删 Clarify 流程检查 |
| build-plan | 有一轮找到 3 major；也有整组 unavailable 和 622 秒慢尾 | 不稳定 | 同 snapshot 重跑、缺 AC、K3 死亡/慢尾 | 因果图、consumer、顺序、恢复、假命令；不重复 spec-analyze |
| build-code/phase | 严重实现问题主要在这里被找到 | 价值最高但噪声也最高 | 数十次重复；80k–110k token provider；invalid anchor；>330 KiB | 同次三轴、完整 Phase diff、直接 consumer；运输规则退出 prompt |
| build-code/integration | 能发现跨模块问题，但大量 major 最终 invalid | 中等偏低 | 多次 V4 output-invalid；与 verify 重叠；同 snapshot 重跑 | 只审完整用户流、接口接缝和任务净 diff |
| verify/post-evidence | 能找到假绿和弱验收；大量调用在 provider 前失败 | 有效但材料合同错位 | 同 snapshot 8 次；禁止/缺失 evidence 反复失败 | 全 AC 逐条反查实现/consumer/test/assertion/result |
| mini-task/design | 候选尚无真实 route 和正式样本 | unavailable | 缺 route 会直接失败 | 显式 route；复用 spec+plan lens，加“是否仍够小” |
| mini-task/implementation | 候选允许 caller 写 `passed`，尚无可信样本 | unavailable | 可产生假通过和重复测试 | 删除 caller pass；复用 code+verify，加范围越界 |

三个任务共同根因不是“模型不够强”，而是：过宽/重复 packet 稀释注意力，流程元数据挤占语义审查，配置 reviewer 未兑现，输出合同失败后又开新 attempt，完整 snapshot 让非语义写回触发重复审查，Integration/Verify 边界重叠。原始记录没有 retry lineage 的地方统一写 `unavailable`，不把多个 attempt 猜成内部 retry。

| 证据模式 | 根因 | 修改 owner | 目标改动 |
| --- | --- | --- | --- |
| packet 过宽/重复 | 材料面未按语义主题切分 | WorkflowHub | 逐面 allowlist+hash 去重 |
| 元数据 finding 多 | Host 与 reviewer 职责混杂 | WorkflowHub | 确定性检查移出 prompt |
| `SAME_SOURCE` 误排除 | adapter 名冒充上下文身份 | 3rd-review | 隔离执行并分开统计 |
| 多层 retry/慢尾 | 恢复 owner 重复 | 3rd-review | 单 owner、有限分类恢复 |
| P5/T010 循环 | 完整 snapshot 冒充语义身份 | WorkflowHub | 确定性投影 hash |
| Integration/Verify 重叠 | 审查对象边界不清 | WorkflowHub | 用户流接缝/声明反查分工 |
| 失败样本从评分消失 | ModelTest 分母不完整 | ModelTest | 严格 matcher+失败保留 |

## AgentHub 逐 surface 对标

固定基线：本地 AgentHub commit `fabc82100b3dde2678a5fb81484bab3149c1e72d`。结论是吸收审查知识，不恢复它的宿主流程。

| surface | AgentHub 值得吸收 | 当前 wh-review 问题 | 新方案 | 预计收益 |
| --- | --- | --- | --- | --- |
| direction | 方向真实性、脆弱前提、更小路 | 角度太薄且全盲看不到选择 | 四类 lens + 真分段揭示 | 少越权实现意见 |
| detail | Blindspot/Detail/Drift/Scope | 过度检查 Talk/Grill 元数据 | 审决定完整与漂移 | finding 更贴交付 |
| spec | 需求追踪、场景、失败、接口、复杂度 | 混入 Clarify 流程规则 | 反例攻击旅程/状态/oracle | 降流程噪声 |
| plan | 依赖、假命令、失败、oracle、YAGNI | 合同薄且与 analyzer 重复 | 因果图；机械追踪留给 analyzer | 找真实断点 |
| code phase | 状态、吞错、竞态、行为测试 | prompt 混入 map/shard/byte 运输 | correctness + conformance + necessity | 质量不降、合同变短 |
| code integration | 逐 AC、fresh evidence、用户结果 | 与 verify 重叠 | 只审最终用户流和跨 Phase 接缝 | 少重复阅读 |
| verify | 原需/AC、失败跳过、真实验收 | 依赖主 agent 摘要 | 直接实现/测试/断言 anchors | 降自证风险 |
| mini design | Design Review 的影响面/失败/YAGNI | 三条宽泛规则、无 route | 组合 spec+plan，加升级条件 | 防大任务伪装 |
| mini implementation | Code+Acceptance 的状态/错误/用户结果 | 漏 consumer、原子性、兼容残留 | 组合 code+verify，加越界检查 | 小而不漏真 bug |

全部 surface 都删除 AgentHub 的 `verdict/pass`、required-skill 二次调用、Knowledge 固定路径、多轮升级、历史报告闭环、固定章节和仓库专用命令。最终是否真的更好只由 D-010/D-012 的 ModelTest 前后对照证明，不能靠本表自我宣称。

## 会话覆盖审计

| coverage_id | 要保留的内容 | 当前落点 | 结果 |
| --- | --- | --- | --- |
| COVER-001 | make-decision 前原始需求 R-001..R-021；后续接续要求 R-022..R-023 | `## 原始需求` | 已覆盖；时间边界已分开 |
| COVER-002 | 三个真实任务、五阶段、失败、AgentHub、外部参考调研 | AUDIT-001..003 / task×surface 明细 / AgentHub 逐 surface / F-001..F-024 | 已覆盖 |
| COVER-003 | 用户每次选择、理由、后果和风险 | T-001..T-006 / G-001..G-002 / D-001..D-014 | 已覆盖 |
| COVER-004 | delivery-flow-quality-v1 与 mini-task 新增范围 | F-018..F-020 / D-005..D-007 | 已覆盖 |
| COVER-005 | 宪法、维护成本、P5/T010 循环和跨仓边界 | F-005/F-006/F-010/F-016 / D-004/D-008 | 已覆盖 |
| COVER-006 | 方向审查真实结果、失败和处置 | FND-DIR-001..FND-DIR-009 | 已覆盖；不把失败改写成通过 |
| COVER-007 | 细节审查、宪法反查和最终修正 | FND-DETAIL-000..005 / 宪法结论 / D-011..D-014 | 已覆盖 |
| COVER-008 | main 同步、新版流程接续和 make-decision 前材料完整性复核 | F-024 / D-014 / Step 11 spec-analyze | completed |

## 外部参考边界

- 本次读取版本：AgentHub `fabc82100b3dde2678a5fb81484bab3149c1e72d`；Occam Review HEAD `7854b82a059d6248d812d0655ee930fc3d94a35a`；Matt Pocock skills HEAD `84fdeffd12f2ee307994d1eb6feb48173b6e0502`。
- AgentHub vibecoding、Occam Review、Matt Pocock code-review 和 AnySearch 研究结果只作为设计输入，不成为 WorkflowHub 运行依赖。
- 只吸收可解释的审查方法：stage 对抗角度、固定比较基点、Spec/Standards 分轴、correctness 后做 necessity、真实 producer/consumer 和具体证据锚点。
- 不直接复制外部 prompt、流程状态或兼容层；最终实现必须服从 WorkflowHub 宪法、现有四材料和七类 public runtime。
- build-spec 固定采用内容和来源版本；外部来源以后变化，不自动改变已经确认的产品决定。
- AgentHub 来源：`/Users/Hugh/Hugh/Project/multica-agenthub/packages/core/agenthub/skills/3rd-review/verifiers/vibecoding` @ `fabc821...`；吸收九面语义检查角度，拒绝 verdict/pass、宿主专用命令、多轮升级和固定 Knowledge 路径，落点见“AgentHub 逐 surface 对标”。
- Occam Review 来源：`https://github.com/mindorigin150/occam-review` @ `7854b82...`；吸收 correctness 后做 necessity、真实 producer/consumer 和删除无消费者控制面的检查，拒绝引入另一套 agent loop，落到 code/phase 三轴。
- Matt Pocock 来源：`https://github.com/mattpocock/skills/tree/main/skills/engineering/code-review` @ `84fdeffd...`；吸收 Spec/Standards 分轴、固定基点、具体锚点和跳过 lint，拒绝空泛 verdict 和宿主绑定，落到 code/phase 与 integration。

## 完整决定草案

### 当前实现与本次目标的差距

- 下面写的是本次要实现的目标合同，不是假装 main 已经具备。当前 `wh-review` 仍允许首次请求后最多三次 fresh recovery，并允许一次 `SAME_SOURCE` fallback；本次目标是把 owner 收回 3rd-review，只保留按错误类型最多一次新执行恢复、一次同 session 格式修正，WorkflowHub 不叠加重试。
- 当前 make-decision direction route 仍是 `single_round`，合同不允许 reviewer 看到当前方案；D-009 的“两段无状态 reveal、最后一个 review fact”是待实现的新合同。
- 当前 mini-task 已进入 main，但用户 config 缺 design/implementation route，runner 的缺省 review status 仍可能写 `passed`；D-006/D-013 要求删除这条假绿路径。
- 当前 `verify-final` 仍把完整 `snapshot_tree` 当有效性绑定；D-004 的语义身份尚待实现，因此 P5/T010 循环不能因为新版流程文案已经合并就宣称修好。
- AgentHub 逐 surface 表只证明设计取舍，不证明候选效果已经更好；最终优劣只能由 D-010/D-012 的 ModelTest 前后对照得出。

### 最终用户结果

WorkflowHub 到达审查节点后，按 `/Users/Hugh/.config/workflowhub/config.json` 的明确配置调用全部 reviewer。每位 reviewer 只看到当前审查面真正需要的语义材料，在独立上下文中寻找会影响交付的错误。结果只提供 findings 和真实失败事实，不决定任务能否继续。代码、需求、测试或合同真实变化才让旧审查过期；写回完成状态、时间、handoff 或 review fact 不触发复审。

### 9 个审查面

| review surface | 核心攻击目标 | 必须看到 | 不该主要检查 |
| --- | --- | --- | --- |
| decision/direction | 错问题、错方向、错假设 | 原需、事实、选择 | 材料齐不齐 |
| decision/detail | 遗漏、矛盾、风险 | 原需、决定、延期 | 流程是否走完 |
| spec | 旅程、状态、失败、假绿 AC | spec 与原需 | receipt、历史 |
| plan | 依赖、顺序、consumer、恢复 | plan/spec/接口 | 计划格式 |
| code/phase | 偏需、bug、不必要复杂度 | Phase 完整 diff | lint 风格 |
| code/integration | 用户流和跨模块接缝 | 任务完整净 diff | Phase 历史回放 |
| verify/post-evidence | 漏 AC、弱断言、假通过 | 实现、测试、结果 | 摘要是否漂亮 |
| mini/design | 设计漏洞、任务膨胀 | 小任务设计与约束 | 复制完整五阶段 |
| mini/implementation | bug、假绿、范围越界 | 实现、测试、结果 | 重复跑普通测试 |

direction 按 D-009 用两个有顺序的无状态小请求实现真实分段揭示，最终仍聚合成一个 direction review fact；不要求 adapter 保留 session。build-code 在每位 reviewer 的同一次调用中依次做 `spec_conformance`、`correctness`、`necessity`，不按三个角度重复调用。mini-task 只组合公共审查角度并增加自己的范围问题，不成为第六 stage。

每面的审查顺序和 finding 成立条件如下；build-spec 只能把它们写成字段/fixture，不能改变问题顺序或重新决定范围：

| surface | 问题顺序 | finding 成立条件 | 禁止项/结束条件 |
| --- | --- | --- | --- |
| direction | 重建问题→反驳选择→更小路 | 会改变方向或关键假设 | 不审实现；一次逻辑 fact |
| detail | 漏洞→矛盾→漂移→失控 | 决定无法直接下游消费 | 不审 Talk 格式；无新问题结束 |
| spec | 旅程→状态→失败→oracle | 行为遗漏、冲突或假绿 | 不重做方向；覆盖全旅程结束 |
| plan | producer→consumer→验证→恢复 | 顺序、依赖、回滚不可执行 | 不审文档格式；因果链闭合结束 |
| code/phase | conformance→correctness→necessity | 真实 bug、偏需或无必要复杂度 | 不报 lint；当前 Phase 一次调用 |
| code/integration | 用户流→接口→跨 Phase 接缝 | 最终净实现产生跨模块失败 | 不回放 Phase 历史；最终净 diff |
| verify | AC→实现→consumer→测试→断言→结果 | 声明无真实实现或 oracle 支撑 | 不审摘要文风；全部 AC 有结论 |
| mini/design | spec+plan→是否仍够小 | 设计不完整或已膨胀 | 不复制五阶段；一次专用审查 |
| mini/implementation | code+verify→是否越界 | bug、假绿或范围越界 | 不重复普通审查；一次受影响复审 |

### 审查材料

- Host 只检查审查请求能否真实执行：路径安全、必需输入存在且非空、hash、基本类型和允许的材料键；不判断材料是否足以证明质量，不建立 consumer inventory 或覆盖许可证。Reviewer 不再为机器可判断内容消耗主要上下文。
- 每个 surface 使用明确 allowlist。只给原始需求、当前决定、相关 spec/plan、完整行为 diff、直接接口与 consumer、测试代码、断言和真实结果中与本面有关的部分。
- 不默认提供全仓历史、旧 snapshot、receipt、review history、inventory、重复 maps、传输元数据和与本面无关的文档。
- Phase review 看该 Phase 的完整行为 diff；Integration review 看任务基线到最终候选的完整净 diff。不能用摘要替代关键代码、接口、consumer、测试和断言。
- 大材料先按真实职责和直接依赖切片；若关键行为仍超过 provider 上限，明确返回 `unavailable/material_too_large`，不静默裁掉后声称完成。
- 每个语义材料按内容 hash 只打包一次，不得换材料名重复嵌入。每面只分 `required`、`optional-if-directly-relevant`、`forbidden`：上表“必须看到”为 required，直接接口/consumer/测试可按主题 optional，历史、transport、重复 maps 和无关 receipt 为 forbidden。预算、timeout 和 provider 上限只读受信配置；超限不由调用方临时改配置。

### finding 合同

- 输出只包含可行动 findings：严重程度、审查角度、精确锚点、问题、真实失败机制或用户后果、最小修正建议；可保留 root cause，但不写长篇总评。
- `findings: []` 是合法完成，不因“没找到问题”重试。
- Reviewer 不输出 pass、完成许可或流程裁决。Host 只能记录处置及其依据，不能覆盖原始 finding。普通 finding 可记录 `fixed` 或有证据的 `rejected_invalid`；`major|blocking` 若不修，必须绑定真实用户对该具体风险的 `accepted_risk`，Host 不得代替用户接受。
- 材料治理、格式检查、snapshot 新旧和流程是否走完，除非直接造成语义盲区，不作为 reviewer 的主要 finding。

### 复审有效性

- `semantic_hash` 不是模型生成的“语义摘要”。它是 Host 对该 surface 明确输入投影做规范化排序和稳定序列化后的确定性字节 hash，并包含投影版本与 review contract hash；只写进当次不可变 review fact，不持久化可变 current/stale 状态，不建立代次、前后继、替换、lineage、rebind、continuation、reopen 或推进许可。
- 摘要包含该面使用的需求/决定、AC、接口/schema/迁移/配置、直接 consumer、行为 diff、测试/oracle、phase 范围和 review 合同；完整 Git tree 只作来源记录。
- 复用时重新计算当前语义 hash并与旧 fact 等值比较。仅状态、时间、handoff、review/provider/retry/timing/ref 等记录变化不会进入 hash；它们不需要持久化 `record_only_changed` 状态。P5 写回 T010 后直接 aggregate，不再做“最后一次同快照复核”。
- 任何语义输入真实变化则旧结果 stale，正常产生一次新审查；新结果写回本身不得再次改变有效性。

### provider、并发和失败

- WorkflowHub 只负责读取 route 并提交配置中的完整 reviewer 列表，不动态增加、减少或替换 reviewer。每个正式 surface 都必须有 route；mini-task 使用显式 `mini-task/design` 与 `mini-task/implementation` route。route 缺失是 `unavailable/configuration_error`，不能由调用方写 `passed` 或降成 `not_requested`。
- 3rd-review 必须在全新隔离进程/上下文中实际调度每个配置 profile；同一 CLI adapter 的不同 profile 可隔离并行，不能安全并行时在 adapter 内串行。宿主使用 `codex` 不代表全新 `codex/luna` 外部进程在“自审当前上下文”，因此不得据 adapter 名返回 `SAME_SOURCE`。
- 配置加载时同时验证 route 至少包含一个与 host provider 不同、且上下文隔离的异源 profile；没有则配置无效并明确失败。报告分开记录配置兑现率、独立上下文有效率和真正异源有效率，不能把“跑了 N 个”写成“N 个都异源”。
- 不做跨 provider fallback，不用其他模型冒充配置 reviewer。各 reviewer 独立保留 provider/model/session/usage/timing/error。
- reviewer 尽量并行，最后一起 aggregate；单个慢尾按自己的 timeout 结束，不让已完成 reviewer 重跑。
- 认证和配置错误不重试；当前上下文若被错误地直接传给 reviewer 则 fail-loud，不进入配置 route。启动、进程死亡或可恢复传输错误由 3rd-review 最多做一次新执行重试；格式错误最多做一次同 session 修正。WorkflowHub 不再叠加 provider 重试，避免多层重试相乘。
- 超时、死亡、传输和格式失败保持 `unavailable`；无 finding 保持正常完成。失败率和重试成本进入 ModelTest，不能被成功样本掩盖。

| 失败类型 | owner | 是否恢复 | 最终事实 |
| --- | --- | --- | --- |
| 路径/材料/安全错误 | WorkflowHub Host | dispatch 前不重试 | `structural_error` |
| route/配置/认证错误 | 对应配置或 broker owner | 不自动重试 | `unavailable` |
| 启动/死亡/可恢复传输 | 3rd-review | 最多一次新执行 | 原失败+最终结果 |
| 输出语法/schema 错误 | 3rd-review | 最多一次同 session 修正 | 失败或有效结果 |
| timeout/packet 超限 | 对应真实 owner | 不盲目重跑 | `unavailable` |
| `findings: []` | reviewer | 不重试 | 正常空 findings |
| aggregate 失败 | WorkflowHub | 不重跑成功 reviewer | 保留成员结果 |
| 真共享当前上下文 | WorkflowHub/3rd-review | 不冒充异源 | `SAME_SOURCE` |

### ModelTest 前后评测

- ModelTest 是本功能的离线发布评测，不进入普通 WorkflowHub 任务，也不成为继续修复的许可证。
- 9 个 surface 各准备 5 个隐藏缺陷样本和 1 个干净样本。baseline/candidate 使用相同 subject、mutation、clean control、配置 reviewer、模型参数、timeout、评分卡和 evaluator；只允许三仓版本绑定中声明的被测实现不同。
- A/B 使用中性名称并交错运行。每个 case、每个 reviewer、每个版本运行 5 次；可配对时至少 4 对有效结果。严格 matcher 必须确认 defect class、锚点和允许的等价 finding，不能“找到别的问题”也算命中。
- 分开报告 finding 召回/正确性/严重度/可执行性、clean 误报、与交付无关 finding 比例、执行有效率、失败/重试、墙钟时间、token、每个有效 finding 的成本；不合成一个能掩盖问题的总分。
- 9 个 surface 继续分别执行 D-012 的非劣化规则；baseline 因旧缺陷没有执行的 reviewer 只比较执行率，不能把旧版“没运行”当低成本优势。D-016 已取消 candidate 的固定绝对分数闸门。
- `delivery_quality` 复用本次 bundle 明确绑定的 ModelTest 版本化 scorecard/evaluator，继续记录为诊断事实，但不要求 `>= 80` 才能继续修复或交付；每面同时报告召回、误报、finding 质量、执行可靠性、失败、token、时长和每个有效 finding 成本。公式或绑定不可计算、配对不足或 provider 失败时，该面对照保持 `inconclusive/unavailable`。5 次运行以有效配对差值的中位数作为改善参考，同时保留每次原值和最差值；少于 4 对不计算中位改善。
- 固定资产下，每个配置 reviewer 的计划规模至少为 `9 surfaces × 6 cases × 2 versions × 5 runs = 540` 次 leg；实际总调用量按每面配置 reviewer 数求和。运行前必须输出预计调用、token、墙钟和成本，不能为省评测成本静默减少配置 reviewer、case 或运行次数。
- 当前任务同时修正 ModelTest 的 matcher、重复运行、失败完整性、前后配对和 mini-task 资产；不新增 benchmark 数据库、公共 WorkflowHub 命令或长期第二套评分控制面。该 bundle 替代本次用途下 US-05 的一次运行排行；原始结果只读保留。bundle 保留到 wh-review 合同被新版本取代且结果迁移完成，随后归档；只有审查 prompt、材料选择、finding 合同或 provider 调度语义改变时才要求完整重跑，普通 WorkflowHub 改动不触发。

### 仓库职责和维护边界

| owner | 唯一职责 | 真实 consumer | 不新增 |
| --- | --- | --- | --- |
| WorkflowHub | 审查面、材料、有效性、处置 | 五阶段与 mini-task | 新流程状态机 |
| 3rd-review | 调度、并发、超时、有限恢复 | WorkflowHub review 调用 | prompt 业务规则 |
| ModelTest | 离线样本、评分、前后比较 | 本功能发布评测 | 日常运行依赖 |

公共审查角度只维护一份稳定定义；各 stage 和 mini-task 只声明组合与专属问题，不复制完整 prompt。新增生产文件必须有唯一 owner、consumer、替代关系和删除/保留条件。旧 review/report 只读保留，不建立历史运行分支或永久兼容桥。

三个仓库分别使用各自认证的 worktree、commit/tree、测试和审查事实；WorkflowHub task 不能替 3rd-review 或 ModelTest 宣称已交付。最终跨仓报告只聚合三个已读回身份；任一仓仍 dirty、未提交或未部署时，整体状态必须保持 incomplete。

### 宪法结论

- 仍只维护 `decision-log.md`、`spec.md`、`plan.md`、`tasks.md` 四份当前材料。
- review/test/evidence 仍是事实，不是推进许可；`unknown`、`unavailable`、`incomplete` 不阻止同 task 修复，也不能被写成完成。
- 不新增第五份材料、公共生命周期命令、review lineage、rebind、replacement、continuation、reopen、risk state 或 provider scorecard DB。
- mini-task 只是现有流程中的小任务路径；ModelTest 只是离线评测；二者都不改变五阶段和七类 public runtime。
- 该方案不会用缩小语义视野换成本：关键行为 diff、AC、接口、consumer、测试和 oracle 仍必须完整可见。成本下降来自删除无关材料、重复审查、串行等待和多层重试。

## grill

| grill_id | CONTEXT/冲突 | 结论 | ADR/四项退出 | source/evidence |
| --- | --- | --- | --- | --- |
| G-001 | ModelTest 当前实现可能给假高分；是否仍把必要修正纳入当前交付 | 用户选择一起修改，只修本次可信前后评测需要的能力 | CONTEXT=no-change（没有新领域词）；ADR=not-needed：难反转=no、无背景会意外=no、真实取舍=yes；四项退出=上下文/owner/失败/范围均明确 | T-006 / F-021..F-023 / D-011 / actual reply “A，A” |
| G-002 | 总平均分可能掩盖某个 stage 退步 | 用户选择 9 个 review surface 分别不得退步，至少质量或成本一项改善 | CONTEXT=no-change；ADR=not-needed：难反转=no、无背景会意外=no、真实取舍=yes；四项退出=上下文/owner/失败/范围均明确 | D-010/D-012 / actual reply “A，A” |

## 审查处置

| finding_id | 原始事实/来源 | 后果 | status | next_action/evidence_ref | owner/consumer/retain_or_delete |
| --- | --- | --- | --- | --- | --- |
| FND-DIR-001 | `opencode/v4flash` 完成；75.159 秒，15146 tokens，8 findings | 单次成本高，finding 主要偏材料治理 | accepted_risk | 本次作为旧合同基线；新方案用 benchmark 降低此类浪费 | make-decision/benchmark/retain |
| FND-DIR-002 | `codex/luna` 因 `SAME_SOURCE` 未启动 | 配置两位实际只完成一位，方向审查覆盖不足 | fixed_in_direction | D-003/D-008 已要求 3rd-review 按配置执行，并保留真正宿主自审排除 | 3rd-review/dispatch/retain |
| FND-DIR-003 | 审查称范围和 stage 清单不明确 | 当前 decision-log 已列五阶段、两类 mini-task review 和跨仓范围 | rejected_invalid | `## 范围`、D-006、D-007 | make-decision/retain |
| FND-DIR-004 | 审查称质量和成本缺少判断标准 | 确实需要补齐，否则无法证明改造有效 | fixed | `### 质量与成本怎么衡量`；T-006/G-001/D-012 已给达标线 | benchmark/retain |
| FND-DIR-005 | 审查要求完成会话覆盖审计 | 用户明确要求“千万不要遗漏”，应保留，但不属于 reviewer 的产品 finding | fixed | `## 会话覆盖审计` | make-decision/retain |
| FND-DIR-006 | 审查要求外部仓库可达、许可证和版本证明 | 外部内容只是设计参考，不是运行依赖；版本固定延后到 spec | rejected_invalid | `## 外部参考边界` | build-spec/retain |
| FND-DIR-007 | 审查把调研子代理与 provider `SAME_SOURCE` 混为一谈 | 两者不是同一执行机制，因果判断错误 | rejected_invalid | R-010 与 F-010 分开保留 | make-decision/retain |
| FND-DIR-008 | 审查因安全包隐藏本机路径而判 AgentHub 无法比较 | Host 已实际读取固定本地基线；隐藏路径不影响已完成比较 | rejected_invalid | F-004/F-017 | make-decision/retain |
| FND-DIR-009 | 审查指出冻结包未包含用户流程等章节 | 这是旧方向包组装缺口，说明当前 packet 设计失焦；不改变产品方向 | accepted_risk | 作为 wh-review packet/合同改造的反例 | wh-review/retain |
| FND-DETAIL-000 | 首次 detail attempt `3e0bb1d6-1472-4bcd-9f92-c46d07314850` 因缺 `raw_requirement` 未调用 provider | 真实材料失败，不能写成无 finding | fixed | 补齐合同材料后新 attempt 成功；旧 attempt 不覆盖 | make-decision/retain |
| FND-DETAIL-001 | attempt `06bc3901-6320-4fd6-94e9-00b48053ccb3`：opencode 完成 127.245 秒/15144 tokens；codex/luna `SAME_SOURCE` | 再次证明旧合同成本高、配置未兑现 | fixed_in_direction | D-003/D-008/D-010；实际修复留给 build-code | three-repo delivery/retain |
| FND-DETAIL-002 | finding `F-2866b0805383`：Grill/Exit checks 和旧阶段状态未同步 | 决策记录内部矛盾 | fixed | G-001/G-002、文档结果、Exit checks、阶段更新已同步 | make-decision/retain |
| FND-DETAIL-003 | finding `F-6c1b8367e247`：同一 decision-log 以两个材料名重复交付 | 是旧 detail 合同/本次调用的真实材料浪费，但不改变方案 | accepted_risk | 纳入“审查材料”改造；未来一个语义材料不复制成两个文件 | wh-review/retain |
| FND-DETAIL-004 | finding `F-ed50032c04ab`：`approved_direction` 名称像已获最终确认 | detail advice 本来就在真实用户确认前，旧槽位命名确有误导 | accepted_risk | 新合同改为中性 `decision_draft`；本记录保持 pending 直到真实确认 | wh-review/retain |
| FND-DETAIL-005 | finding `F-27358d7e38a2`：要求补跑第二位 direction reviewer | 错把“direction+detail 两次 advice”理解为“两位 direction reviewer”；旧阶段更新残句确需删除 | rejected_invalid | 当前流程已按 6→7→8→9→10 执行；配置未兑现作为 FND-DETAIL-001 保留 | make-decision/retain |

### Step 11 完整性审计处置

| finding | 问题 | 处置 | 当前落点 |
| --- | --- | --- | --- |
| F-SA-001 | 子代理分工只有结果没有索引 | fixed | 并行调研执行索引 |
| F-SA-002 | 页面仍写成方向未决 | fixed | 页面范围/OPEN-002 |
| F-SA-003 | 历史“待决定”没有同步 | fixed | F-018..020、COVER、D/OPEN |
| F-SA-004 | DEFER/OPEN 交接字段不全 | fixed | 风险与延期/未决项 |
| F-SA-005 | 当前实现与目标合同混写 | fixed | 当前实现与本次目标差距 |
| F-SA-006 | 缺 task×surface 执行明细 | fixed | task × surface 汇总 |
| F-SA-007 | 逐面/材料/失败合同太散 | fixed | 9 面、材料、失败矩阵 |
| F-SA-008 | 评测绝对底线与聚合不清 | fixed | ModelTest 前后评测 |

最终机器 profile 状态为 `consistent`，23/23 covered，0 findings。两路修复后独立复核只发现“进行中/completed”状态未统一；本次写回已统一为 completed。packet/hash 由外部 stage outcome 绑定，不能把 decision-log 自身 hash 写回自身制造自触发循环；正式 stage outcome 在 Step 12 用户确认后由现有 runtime 记录，不提前伪造阶段完成。

## 最终确认

- 状态：confirmed
- 用户原文与 host-visible 绑定：Step 12 用户回复“A”。
- 确认内容：Talk、方向/细节审查处置、Grill、Step 11 完整性修复后的最终完整决定。
- 后果：允许发布 make-decision 结果并进入 build-spec；不授权 commit、push、merge、archive 或 cleanup。

## 拒绝方案

| 选项 | 拒绝理由 | 关联 D |
| --- | --- | --- |
| reviewer 主要查证据治理 | 与 R-008 的交付质量目标冲突 | D-001 |
| 跳过 make-decision 直接改代码 | 违反 R-015，且会把方向问题留给 build-spec | D-002 |

## 风险与延期交接

| risk_id | 风险 | 触发/后果 | owner/处理 |
| --- | --- | --- | --- |
| RISK-001 | 为省 token 过度裁剪关键语义材料 | 行为 diff、AC、oracle、consumer 不可见，严重问题漏报 | make-decision 确定 allowlist 原则；build-spec 写精确规则 |
| RISK-002 | reviewer 配置未经离线质量/成本评估 | 配得太少会漏审，配得太多会拖慢 | benchmark/canary 只评估配置，不在运行时动态改数量 |
| RISK-003 | 语义身份实现成新 lineage 控制面 | 违反宪法并增加维护成本 | 仅作为现有 review fact 内部派生身份，不新增状态机 |
| RISK-004 | 把 broker 失败当质量失败或通过 | 无效重试或假绿 | 失败事实统一保持 unavailable |
| RISK-005 | 当前主工作树有用户未提交改动 | 新任务基线不含这些改动，后续实现可能冲突 | build-code 前重新核对，不触碰现有改动 |
| RISK-006 | ModelTest 修正扩大为第三仓交付 | 三仓版本不匹配会让对照结果不可复现 | manifest 同时绑定三仓 tree/config；build-plan 安排集成顺序 |
| RISK-007 | 9 面 × 2 版本 × 多 reviewer × 5 轮成本较高 | 评测本身耗时长、token 多 | benchmark 只在本功能交付前运行，不进入普通任务；并行 reviewer，失败不盲目重跑 |

| defer_id/状态 | 触发 | owner | consumer/交付 | 关闭或保留条件 |
| --- | --- | --- | --- | --- |
| DEFER-001/completed | 用户要求逐 stage 外部研究 | make-decision | 9 面决定和 AgentHub 对标 | F-009/F-011..016 已写入，关闭 |
| DEFER-002/deferred | Step 12 用户确认后 | build-spec、build-plan | spec 接口/schema语义；plan 测试步骤 | 进入负责材料并绑定来源后关闭 |
| DEFER-003/deferred | spec、plan、tasks 完成后 | build-code | 三仓实现、迁移、测试、review | 三仓实现和验证事实完成后关闭 |

## 质量边界

- 质量事实：review/test/evidence 只记录发生了什么，包括 unavailable；不自动授权推进。
- 推进资格：同 task 可继续 Talk、修材料和代码，不由 provider pass 决定。
- 正式 verify 和 close 必须共享完整事实边界：完整测试、独立审查、finding 处置、AC、例外和人工确认都要有当前认证事实；这不是 provider pass 门槛，也不是继续修复的许可证。
- 完成判据：三轮 Talk、必要研究、Grill、一次 direction advice、一次 detail advice、finding 处置、当前 decision-log、Step 11 `stage-end-spec-analyze`、真实用户确认和 interaction aggregate 齐全；“两次 advice”不是要求每个 track 各跑两位 reviewer，reviewer 数量只由配置决定。
- 不可逆授权边界：commit、push、merge、archive、cleanup 仍需各自授权；本决策不授权这些动作。

## 未决项

| item/status | 触发/原因 | owner | consumer/handoff | 关闭/保留条件 |
| --- | --- | --- | --- | --- |
| OPEN-001/resolved | reviewer 数量需唯一来源 | D-003 | 全部 review route | 配置严格执行，保留决定 |
| OPEN-002/resolved | 页面范围曾未定 | D-001/D-011 | build-spec | 明确不新增 UI，关闭 |
| OPEN-003/removed | 动态加减 reviewer 会双路由 | D-003 | 无 | 删除该方向，保留拒绝理由 |
| OPEN-004/resolved | 需要可信前后评测 | D-010/D-012 | ModelTest | 9 面规则已决定，关闭 |
| OPEN-005/resolved | P5/T010 自触发 | D-004 | WorkflowHub review | 确定性投影目标已决定，关闭方向问题 |
| OPEN-006/resolved | 三轴可能重复调用 | F-014/D-003 | build-code contract | 同 reviewer 一次调用，关闭 |
| OPEN-007/resolved | broker/host owner 混淆 | D-008 | 三仓 plan | owner 已分开，关闭 |
| OPEN-008/resolved | direction 独立性不足 | D-009 | direction contract | 两段无状态 reveal，关闭 |
| OPEN-009/superseded | 候选当时未交付 | D-005/D-014 | 当前 make-decision | main 13 步已接管，保留历史 |
| OPEN-010/resolved | mini 合同可能复制 | D-007 | mini-task contracts | 公共角度+专属问题，关闭 |
| OPEN-011/resolved | close 只检查测试和独立审查，可能漏掉验收/例外/人工确认 | D-015 | `core/task-close.mjs` 与 close 集成测试 | 当前任务 P6 修复并由 verify 复核 |

## Supersedes

- 本记录不覆盖旧任务记录；三个被审计任务及其 review facts 只读作为研究来源。
- 本会话早期方案在宪法检查后删除了新 risk state、review lineage、provider scorecard DB 和新 public lifecycle 命令；保留原因见 F-005。
- P5/T010 补充需求已把“完整 snapshot 决定 stale”修正为“语义对象决定 current/stale，完整 tree 仅作 provenance”，见 D-004。
- 本次接续不新建 mini-task；只在当前任务补齐正式 verify/close 事实边界，仍保持四份材料、五个 stage 和七类 public runtime。

## 文档结果

- CONTEXT.md：no-change；Grill 没有引入需要全仓共享的新领域词汇。
- ADR：not-needed；G-001/G-002 均不同时满足“难以反转、无背景会意外、存在真实取舍”三项。
- ADR criteria：G-001=no/no/yes；G-002=no/no/yes。
- 术语/ADR 冲突及处理：无冲突；三仓范围和逐 surface 门槛已完整写入 D-011/D-012。
- 不复制 spec 的边界：本文只记录产品流程、状态与决策索引；页面布局、字段/API、任务步骤和测试程序延期到负责阶段。

## Exit checks

- 上下文一致：complete；已核对新版 make-decision、宪法、R-001..R-024 和已合并 delivery-flow/mini-task；Step 11 交叉复核及本次正式事实根因复核均完成。
- owner/接口一致：complete；WorkflowHub、3rd-review、ModelTest 的唯一职责和 consumer 已明确。
- 失败语义明确：complete；unavailable、空 findings、有限重试、失败分母和 P5/T010 均已决定。
- 范围与延期明确：complete；三仓方向已确认，字段/schema/任务步骤只延期到各负责阶段。

## 阶段更新

- Step 1 `load-context`：当时已读取 make-decision 及依赖 skill并重放 R-001..R-021；本次接续又读取新版 make-decision 与 spec-analyze，并在 Step 11 重放新增 R-022/R-023。
- Step 2 `triage-scope`：已建立目标、完整用户结果流、页面假设、数据状态、成功/失败边界、范围、非目标、风险、延期和开放方向问题。
- Step 3 `talk-round-1`：已完成真实 `ask -> wait -> user reply -> resume -> re-rank`。用户纠正了错误问题前提；Round 1 的痛点、成功标准和研究需要均已由 R-001..R-019 明确，剩余 high/medium 问题为 0，本轮收敛。
- Step 4 `research-inputs`：已完成。七条独立研究线覆盖五阶段、失败/重试/耗时和 AgentHub 对标；使用 AnySearch 一手来源并核实本地合同/运行时。结论索引见 F-009、F-011..F-017。
- Step 5 `talk-round-2`：问题 1 已完成真实 `ask -> wait -> user reply -> resume -> re-rank`，形成 D-004。用户新增 R-020/R-021，先做事实核查，不在信息不足时继续提问。
- Step 5 补充核查：已完成 delivery-flow-quality-v1 与 mini-task 的设计、实现、测试和宪法核对，形成 D-005、D-006 和 F-018..F-020。
- Step 5 问题 2 已完成真实 `ask -> wait -> user reply -> resume -> re-rank`，形成 D-007。
- Step 5 问题 3 已完成真实 `ask -> wait -> user reply -> resume -> re-rank`，形成 D-008。
- Step 5 问题 4 已完成真实 `ask -> wait -> user reply -> resume -> re-rank`，形成 D-009。Round 2 共处理 4 个问题，剩余会改变方向的问题为 0；当前保留风险是跨仓发布、语义内容清单准确性和配置执行一致性。
- Step 6 `direction-advice`：已执行 attempt `b2f3fa44-3bb9-4e82-a81a-d05b5ae687c4`。配置两位 reviewer，`opencode/v4flash` 完成，`codex/luna` 因 `SAME_SOURCE` 未启动；8 条 finding 已逐条人工处置，见 FND-DIR-001..FND-DIR-009。没有 finding 推翻当前方向；审查暴露了旧合同成本高、偏材料治理和配置未兑现的问题。
- Step 7 `talk-round-3`：用户要求复用 ModelTest 评测方案，对修改前和修改后的五个主 stage 与 mini-task 两类审查做同样评测。三路独立核查形成 F-021..F-023 和 D-010：复用现有基础设施，但先修正漏检仍 ready、单次运行、失败样本消失和不严格 matcher；Round 3 已收敛，进入 Grill。
- Step 8 `grill-with-docs`：按 F-022/F-023 提出一批两个独立前沿问题，完成真实 `ask -> wait -> user reply -> resume`。用户选择“A，A”：ModelTest 必要修正纳入当前任务，9 个 surface 分别不得退步；形成 G-001/G-002、D-011/D-012。
- Step 9 `write-decision-draft`：已完成。`## 完整决定草案` 固化了用户结果、9 个审查面、材料范围、finding 合同、P5/T010 复审有效性、provider 并发/失败、ModelTest 前后评测、三仓 owner 和宪法边界；不把方向问题延期给 build-spec。
- Step 10 `detail-advice`：首次 attempt 因缺 `raw_requirement` 保持 unavailable；补齐后 attempt `06bc3901-6320-4fd6-94e9-00b48053ccb3` available。配置两位仍只完成 opencode，4 条 minor findings 已逐条处置为 FND-DETAIL-002..005；没有 finding 改变产品方向。
- 流程接续：delivery-flow-quality-v1 合并 main 后，当前分支已同步到 `249e2cd7ff84756fb9509d0716f013b5a94a75e8`。D-005 的历史“不切换”判断由 D-014 取代；已完成 Steps 1..10 不重跑，按新版补做 Step 11，最终确认/发布顺延为 Steps 12/13。
- Step 11 `stage-end-spec-analyze`：completed。四路独立审计发现记录精度、历史漂移、前置边界和延期交接等缺口，均在 make-decision 当场修复；两路定向复核只发现状态文字未统一，现已修正。最终机器 profile 为 `consistent`、23/23 covered、0 findings；随后已进入 Step 12。
- Step 12 `approve-decision`：completed。用户真实回复“A”，确认 Step 11 修复后的完整决定；没有推断或替代用户答案。
- Step 13 `publish-decision`：completed。向 build-spec 交接已确认的方向、9 个 review surface、三仓边界、P5/T010 语义身份、失败矩阵、ModelTest 门槛、非目标和延期；build-spec 只能细化行为规格、FR/AC、fixture 和字段，不能重新决定产品方向。
- 同任务根因修复接续：用户授权继续当前计划；不新建 mini-task。新发现只补充正式交付事实边界，不改变五阶段、mini-task 两条审查 route、四份材料或七类 public runtime。
- P6 实施事实：`completion-predicates.mjs` 导出共享质量判断；`task-close.mjs` 现在逐条认证测试、独立审查、finding 处置、AC、例外和人工确认；普通/严重 finding 共用处置合同，`accepted_risk` 没有真实风险 receipt 不能完成；mini-task design/implementation 复用该合同并要求显式 human confirmation。
- P6 测试事实：最终 deterministic gate 共 8 个测试文件、177 个测试，exit 0；包含 close 六项事实、材料只写回复用、代码变化拒绝复用、mini-task 两审查和五阶段回归。
- P6 未完成事实：当前 worktree 没有可供官方 sidecar 读取的已认证 TaskHandle/current task store，`workflowhub-capability` doctor 不存在；因此没有把测试结果冒充独立异源 review，正式 verify 的独立 review 仍保持 `unavailable/incomplete`。
- P6 收尾事实：已补齐 `wh-review`、`mini-task`、`workflowhub-host-protocol` 的 skill bundle 哈希和遗漏的 semantic projection 依赖；`npm run check`、技能闭包、结构验收和 5 阶段技能包冒烟均通过，`git diff --check` 通过。新增 v3 broker、direction reveal、semantic projection、fixture audit 和 layering 测试共 6 个文件、11 个测试通过。
- 基线未决事实：修复后单独复跑仍有 7 个非本次 P6 逻辑的旧基线测试文件、9 个失败断言：M15 HTML 安全断言、delivery-flow-quality-v1 活跃路径已归档、build-spec 已接入 `spec-analyze` 但旧成本清单未更新、governance move-map/archive 漂移、旧 59/12 步计数与当前 63/13 步不一致。未为本任务偷偷改动这些无关基线；它们不能被写成当前功能通过。

## 当前会话执行复核补充（2026-08-14）

- 三仓确定性回归：3rd-review 目标测试 132/132 通过；WorkflowHub 已有确定性目标门禁 177/177 通过；ModelTest 基准资产测试 26/26 通过。上述都是代码/资产事实，不等于真实异源审查完成。
- 3rd-review v3 真实链路先后暴露并修复了四类协议/路由问题：恢复执行次数被错误算入 provider 内部重试；v3 partial 结果被 CLI 非零退出码丢弃；v3 group 的 `runtime_id` 未归一化为 review runner 使用的 `runtimeId`；host 是 adapter id、reviewer 是 model profile 时 same-source 判断错误，导致本应跳过的 codex/luna 进入 file_only 投递。
- 当前 3rd-review v3 仍有一个待正式收紧的身份边界：公共结果没有单独暴露 effort/thinking，当前只能把缺失字段视为 unknown，不能把 null 误判成 profile mismatch；model 身份仍必须一致。后续应把完整 profile identity 纳入正式 v3 合同，而不是长期依赖宽松判断。
- 当前 build-spec 真实审查包约 190KB，单次 OpenCode 运行约 3 分钟；多次真实尝试中，协议问题已能被分离出来，最后一次 attempt `67df2527-38be-4ade-b9a6-c2c80c39bc6d` 的 OpenCode 返回内容因 JSON 字符串内存在未转义引号而被判 `OUTPUT_INVALID`。该内容不能当正式 finding，只能作为 provider 输出失败事实保留。
- 当前真实 build-spec 审查因此仍是 `unavailable/incomplete`，不能把 provider 返回的文字直接写成 finding，也不能把空 finding 或测试通过当作审查通过。后续必须先保证严格 JSON 输出，再对同一当前快照做一次正式独立审查。
- T005/T006 是当前任务里的 mini-task 接入子任务，不是独立的可 close mini-task；当前任务存储中没有单独的 mini-task task handle。其实现测试已通过，但设计审查、实施审查、finding 逐条处置、用户结果和人工确认尚未形成正式闭环，所以不能说 mini-task 已 close。
- 当前五个 stage 的运行状态仍为 `in_progress`，缺失项包括：make-decision 的 direction/detail review 与人工确认，build-spec 的无重大歧义与 finding 处置，build-plan 的覆盖/依赖/可执行任务/独立审查/人工确认，build-code 的新鲜测试/AC/finding 处置/集成审查，verify-code 的完整测试/独立审查/finding 处置/AC/例外/人工确认。
- 当前任务不能 close。原因不是还缺一次普通测试，而是缺当前快照绑定的正式 review、所有 finding disposition、六项 verify 事实、用户验收确认，以及三仓稳定版本的最终冻结。上述事实在用户明确 close 前只读保留，不执行 commit/push/merge/分支删除。

## 当前会话真实 direction 复核补充（2026-08-14）

- 真实执行入口：WorkflowHub `runReviewRound`，stage=`make-decision`，track=`direction`，task=`wh-review-adversarial-quality-cost-redesign`；没有把 provider 结果写成 pass，也没有使用 `runReviewRecovery` 做无意义的无限重试。
- 配置兑现：每次按 `/Users/Hugh/.config/workflowhub/config.json` 的 `opencode/v4flash`、`codex/luna` 请求；修复后曾有完整双 provider 成功 attempt `feada0d0-bb1d-4b6b-807d-9731c14f0e76`、`0cc687e8-d1f9-4ecb-9f9a-3cb34bd0cc12` 等，分别留下独立 runtime id；没有再出现 `SAME_SOURCE` 或 `MATERIAL_INCOMPLETE` 传输失败。最近 attempt `dac32819-0d4c-4c2b-af75-53a2352c4f89` 中 codex/luna completed，但 opencode/v4flash 因 `PROCESS_TIMEOUT`（约 430 秒）失败；这个 provider 失败保留为 unavailable，不能把单个 codex 结果当成完整双 reviewer 质量证明。
- 真实 direction 结果：最后一次 attempt 有 5 条 codex findings，均围绕“真实交付伤害、低成本边界、三任务产品结果、AgentHub 对照和研究范围”提出补充要求；因为 opencode timeout，当前 direction 质量事实仍是 `incomplete`，不是“无严重 finding”。此前各轮已保留 10/7/5/8/7/10/8/5 等不同 findings 数量，证明反复重跑会改变结果，不能用最后一次空结果覆盖历史。
- 已修复的审查合同问题：`skills/intake-decision-review/SKILL.md`、`skills/review/SKILL.md`、`skills/wh-review/contracts/provider-protocol.md` 统一为 findings-only；`plan-ceo-review` 已改为 blind direction 不要求 proposed direction，detail 才比较候选方向；review prompt 不再要求 `verdict/summary/axis/visibility/anchor/consequence/correction` 等禁止字段。
- 已补入方向包但仍需后续正式阶段绑定的事实：三任务逐 surface 账本、产品级用户流程和状态、AgentHub/Occam/Matt 固定 commit、AnySearch 七条线摘要、独立调研执行索引、三仓版本和 owner/consumer/关闭条件、ModelTest v1.1 公式、异源判定、P5/T010 语义边界、mini-task 新增需求边界。
- 已明确的主次关系：第一目标是发现并减少真实用户交付伤害，第二目标是降低时间/token/重复调用；如果质量下降，成本下降不能抵消；AgentHub 比较、包大小和研究数量是验证与成本依据，不是 reviewer 的主审查对象；当前没有足够真实因果证据的地方保持 `unknown/inconclusive`。
- 仍未完成的 direction 事实：WH、MT-US-06、KD-Task 2-C 的部分历史记录只有聚合账本，没有全部产品级逐 finding→用户后果证据；MT-US-06 汇总 44/25/19 与逐面相加 45/25/20 冲突，已标 `inconclusive: denominator_conflict`，owner=ModelTest；这些不能由 prompt 或普通测试自动补齐。
- 研究停止决定：AnySearch 与独立调研已经完成预设范围；当前不再为了让 reviewer 返回空 findings 而继续扩展研究或机械重跑。后续只在真实材料/语义有变化、或 owner 补齐上述 unavailable/inconclusive 事实时再做一次有理由的复核。
- 当前结论：代码修复和定向确定性测试已经有真实证据，但当前 direction 独立审查仍有 provider timeout、历史因果证据缺口和分母冲突；不能进入正式 close。后续继续按 make-decision → detail → build-spec → build-plan → build-code → verify-code 的顺序补齐，不新建 mini-task；T005/T006 仍是当前任务内部子任务。

## 当前会话回归与收尾核对补充（2026-08-14）

- 3rd-review 全量真实本地回归：293/293 通过。此前 OpenCode JSON fence 测试使用了过时的失败预期，已按当前“一层 JSON fence 可恢复、周围 prose 仍拒绝”的实现同步测试合同；没有放宽 provider 输出安全边界。
- WorkflowHub 定向 wh-review 回归：69/69 通过；结构验收、核心架构检查、skill closure 和 5 阶段 skill package smoke 均通过。`npm test` 全量为 1478/1488 通过、9 个失败断言；失败来自当前 main 已存在的历史 fixture/目录清单漂移、M15 HTML 安全断言、旧 59/12 计数、旧 planning skill 清单和已归档 `workflowhub-delivery-flow-quality-v1` 活跃路径，不能宣称全量通过，也不能靠改测试制造假绿。
- 候选分支本次针对 wh-review、mini-task、快照、close、验收事实的回归首次为 230/231；唯一失败是 host-config 测试仍期待同 adapter 的两个 profile 合并。实现按配置将三个 profile 全部保留并投递，测试已同步为“每个配置 profile 都执行”；修正后的该测试为 21/21，通过 `git diff --check`。
- 哈希收尾：合同/脚本变更后重新生成受影响的 Skill Bundle 文件哈希和 catalog `local_bundle_hash`；`check:skill-closure` 与 `smoke:skill-packages` 已由失败恢复为通过。这个缺口说明技能合同修改必须和 bundle/catalog 一起验证，不能只看源文件测试。
- 真实 provider 仍不能宣称完成：最近 direction attempt `dac32819-0d4c-4c2b-af75-53a2352c4f89` 的 `codex/luna` 已完成，但 `opencode/v4flash` 约 430 秒 `PROCESS_TIMEOUT`；因此方向审查仍是 incomplete，不能把单 provider findings 当双 reviewer 完成。
- 正式 close 仍不可执行：`quality/verify.json` 仍为 `incomplete`，明确缺 26 项 AC 当前语义证据、verify-code 异源 provider 协议证据、T010 真实 A/B 终态、原始需求到计划的 16 处挂接修复和用户实际验收回复；此外三个仓库尚需最终稳定版本/工作树冻结，mini-task 设计/实施审查和人工确认也没有独立 close 事实。

## 当前会话全量回归补充（2026-08-14）

- 候选 WorkflowHub 分支全量 `npm test` 已完成：`test:safe` 为 1518 passed、1 skipped；`test:exclusive` 为 31 passed；总计 1549 passed、1 skipped，exit 0。
- 全量首次复跑曾有 2 个失败断言，均来自同一个真实架构问题：为允许 `tasks.md` 只写执行状态而复用旧审查，快照底层直接拼接了 `specs/<task>/tasks.md`，触发 `check-task-record-paths` 的路径权威检查。已改为调用现有 `core/artifact-dir.mjs` 的 `artifactReference`，没有放宽静态检查规则。
- 修复后的路径检查、快照隔离、正式 close 边界和五阶段 close 回归共 4 个测试文件、49 个测试全部通过；`git diff --check`、`check-task-record-paths`、`check:skill-closure`、5 阶段 skill package smoke 全部通过。
- 本次全量回归再次证明：测试可以证明实现遵守 close 边界，但不能替代当前任务的真实异源 review、26 项 AC 语义验收、T010 有效 A/B、用户验收和三仓冻结。
- 当前真实证据没有变化：`quality/verify.json` 仍为 `incomplete`；T010 执行记录虽有 1260/1260 terminal legs，但报告 `quality_status=inconclusive`，504 次 failed/timed out，九个 surface 的有效配对未达门槛；最近 direction attempt 仍是一个 codex/luna completed、opencode/v4flash `PROCESS_TIMEOUT`。
- 因此当前功能仍不能 close。没有执行 commit、push、merge、分支删除、archive 或 cleanup；等正式 verify/close 事实和用户明确 close 授权齐全后再处理这些动作。

## 当前会话候选审查与 T010 复核补充（2026-08-14）

- 3rd-review 候选分支已补齐并对齐主分支的 provider 终态、OpenCode 一层 JSON fence 解析、idle 无终态失败、deadline 测试和按配置 profile 执行语义；候选分支全量 `npm test` 为 294/294 通过。
- WorkflowHub 候选实际调用 3rd-review 主分支时，`verify-code` 曾得到 2/2 有效 provider 结果，生成 attempt `ce4a059f-80d8-43ac-a5c1-f28d8a6996dd`、snapshot `61cd07e9fb6dad4689d2c401984f7d92feddabb2`、material `8699ced5...`，发现 7 条当前交付缺口；这些 finding 没有被伪造处置，正式交付仍 incomplete。
- WorkflowHub 候选实际改绑 3rd-review 候选后，第一次 attempt `42b65654-66f8-461f-82a5-da96949cfbc8` 因 OpenCode 上游 `Unexpected server error` 且 codex/luna 被正确判 `SAME_SOURCE` 而 unavailable；第二次以宿主适配器身份重跑的 attempt `caecbf1c-701b-4ac8-9bc0-6bd81109e9b6` 两个 provider 都没有有效 finding（OpenCode `PROCESS_EXIT_NONZERO`，Codex `PROVIDER_OUTPUT_INVALID`）。这证明候选入口与快照绑定真实执行过，但不能冒充成功的异源审查；provider 失败事实必须保留。
- T010 专用 ModelTest runner、fixture、matcher、score、compare/report 和候选 worktree 已确认不在当前主分支、历史分支或 Git 可恢复对象中；旧 v10 只能作为历史 `inconclusive` 事实，不能继续重跑或当作当前 A/B。已新建 `/Users/Hugh/Hugh/Project/ModelTest-wh-review-adversarial-quality-cost-redesign` 候选 worktree，恢复工作进行中；新 runner 必须用 `node` 启动，并绑定三仓、配置、bundle、scorecard、route/profile 和 runner snapshot。
- 当前 close 判断不变：真实测试很多且本次候选链路确实跑过，但 T010 仍没有当前可比较终态；五个 stage 和两个 mini-task surface 的正式 review/finding/AC/例外/人工确认事实仍未全部绑定当前快照；没有执行 commit、push、merge、分支删除或 mini-task 清理。

## 当前会话 ModelTest 真实复核补充（2026-08-14）

- 新增的 ModelTest 九面基准资产已完成语法和确定性检查：8 个 benchmark 测试文件共 11 个测试，全部通过；覆盖九面顺序、5 个 mutation、clean control、严格 matcher、失败保留、逐面评分、配对门槛、报告和历史回放。
- 基准 runner 第一次真实单腿执行先暴露了评测输入本身的问题：direction 误传了合同禁止的 `direction_constraints`，并且候选新版 direction reveal 缺少请求级 `direction_selection.current_selection`。已按 WorkflowHub 当前合同修正；不能把这两次材料预检失败算成 provider 质量结果。
- 修正后对候选 `make-decision/direction` 做了真实 WorkflowHub CLI 执行，attempt `b7f9a730-5c85-43f2-b1c5-c3732fd26340`，耗时约 126 秒；OpenCode `PROCESS_EXIT_NONZERO`，Codex `PROVIDER_OUTPUT_INVALID`，没有合法 findings，最终状态 `unavailable`。这是真实 provider/协议失败，不是通过，也不是空 findings。
- 该真实执行说明候选 WorkflowHub 已按配置对 codex 采用 `always_embed` 投递，材料契约问题已被挡在 provider 之前；当前剩余根因是 OpenCode 进程失败和 Codex 输出未形成合法终态，不能继续机械重试来“凑”一次通过。
- 三份历史 review 目录当前都不存在；新增 `wh-review-adversarial-v1-history-ledger.json` 冻结了这一事实，历史回放结果为 `incomplete`、`baseline_match=true`、`unknown_preserved=true`。历史缺失不补成空 findings，不视为通过。
- 当前 benchmark 仍不能给出“修改前后质量更高”的结论：旧 v10 只证明 1260 条运行全部有终态，但 504 条失败/超时，九面有效配对未达门槛；本次新真实单腿也没有合法 provider 结果。确定性评分通过不等于模型质量通过。
- 未执行 commit、push、merge、分支删除、archive 或 mini-task 清理；当前任务仍等待正式当前快照审查、finding 处置、验收事实、例外、人工确认和用户 close 授权。

## 当前会话 benchmark 输入边界复核（2026-08-14）

- 继续审计新 benchmark 时发现一个真实缺口：mutation 的隐藏缺陷原先只拼到了临时 review instruction，而正式 WorkflowHub 会用固定 stage instruction 覆盖它，导致不同 mutation 的正式材料实际相同，评测会失去区分能力。
- 已修复为把每个 case subject 注入对应 surface 合同允许的语义字段：direction→`objective_facts`，detail→`draft_spec_or_acceptance`，build-spec→`draft_spec`，build-plan→`draft_tasks`，build-code→`approved_spec`，verify-code→`open_risks`，mini-task design→`spec`，mini-task implementation→`remaining_risks`；没有扩大材料 allowlist，也没有把 mutation 放进提示词绕过合同。
- 新增了九面“mutation 与 clean control 材料必须不同且经过允许字段传递”的测试；ModelTest benchmark deterministic gate 现在为 12/12 通过。
- 这个缺口说明旧 T010 结果不能直接代表新 benchmark 已有效；必须用修正后的资产重新生成 manifest，再决定是否启动新的真实 A/B。旧 v10 只读保留，不能覆盖。

## 当前会话真实 benchmark runner 修复与 smoke 复核（2026-08-14）

- 继续复核后又发现三个评测工具根因：mutation 原文带有“隐藏缺陷提示”并把缺陷词直接暴露给模型；比较脚本只收集两边都 `completed` 的记录，把失败、超时和缺失腿从逐面分母漏掉；runner 没有逐腿硬超时、进程组清理和可靠的 `timed_out` 终态。
- 已修正 ModelTest 候选：mutation 改为真实语义缺口材料，不再暴露 mutation id 或旧提示；比较时缺失腿补成 `unavailable`，失败仍留在分母；比较增加 candidate delivery quality 最低 80 门槛；runner 增加逐腿超时、进程组终止、版本/surface/case 过滤和 provider stdout/stderr hash 诊断。
- 又发现真实认证根因：runner 原先把 `HOME` 换成空临时目录，导致 Codex/OpenCode 取不到本地认证状态。现在只隔离 WorkflowHub 配置，并在临时 HOME 中链接 provider 必需状态目录；没有把宿主整个 HOME 暴露给审查包。
- 又发现结果丢失根因：leg runner 输出多行 JSON，但总 runner 只解析 stdout 最后一行，导致 provider 已完成却丢失 findings 和 result/attempt/report 引用。现在文件保留格式化 JSON，stdout 使用单行 JSON，诊断信息只保留安全错误码和 hash。
- 这些修复后的 ModelTest benchmark 定向测试为 13/13 通过，包含超时终态、失败分母和 mutation 不泄漏测试；这仍是评测工具通过，不是产品质量通过。
- 真实 smoke：新 manifest `wh-review-adversarial-v9` 生成成功，1260 条计划腿、0 provider dispatch。baseline 的 `make-decision.direction/mutation-1` 真实执行成功，耗时 106360ms、8202 tokens，OpenCode 返回 3 条 findings，result/attempt/report 引用完整。
- candidate 第一次 smoke 设 240000ms 上限，实际两个配置 provider 都完成但总流程未收尾，终态记为 `timed_out`；这次失败是 smoke 上限过短，不覆盖旧事实，也没有自动重试同一腿。
- 新 manifest `wh-review-adversarial-v10` 中，candidate 的 `make-decision.direction/mutation-2` 以 900000ms 上限真实成功，耗时 295163ms、16518 tokens；`codex/luna` 返回 3 条 findings，`opencode/v4flash` 返回 4 条 findings，result/attempt/report 引用完整。
- 当前只能确认“修复后的真实 runner 能拿到完整 provider 结果”，不能确认修改前后质量更高：baseline 与 candidate smoke 不是同一 case，且只有各一条有效腿，没有形成四条以上精确配对，也没有九面质量/成本结论。
- 这些真实 smoke 还暴露成本事实：candidate 按 `/Users/Hugh/.config/workflowhub/config.json` 同时执行两个配置 provider，direction 一次完整运行约 295 秒、16518 tokens；这符合“配置了几个就用几个”，但说明全量 1260 腿会非常昂贵，必须先完成当前配置/预算边界的用户确认，不能盲目全量 dispatch。
- 当前 close 判断不变：`quality/verify.json` 仍为 `incomplete`；真实 benchmark 只有定向 smoke，没有当前九面 A/B；26 项 AC、finding 处置、例外、人工确认、mini-task 两面正式闭环、三仓稳定冻结均未补齐。没有执行 commit、push、merge、分支删除、archive 或 cleanup。

## 当前会话 benchmark comparison 输入修复（2026-08-14）

- smoke 聚合再次发现 compare 会把同目录的 `plan.json`、`comparison.json` 和 `.leg.json` 当成 attempt；已改为只接受 `schema=modeltest.wh-review.attempt.v1` 的记录。
- 修复后 v10 smoke comparison 回读为 `attempts=1`、`status=inconclusive`、9 个 surface，没有把计划文件冒充执行结果；质量仍没有形成有效配对。
- 这说明当前所有 smoke 结果只能作为 runner/provider 链路证据，不能替代 T010 的正式 current manifest、全量终态、逐面 comparison/report 和 verify close 事实。

## 当前会话 ModelTest 全量回归补充（2026-08-14）

- ModelTest 候选全量 `node --test evaluation-assets/tests/*.test.mjs` 结果为 288 tests：280 passed、5 failed、3 skipped。
- 5 个失败都在旧 US-02 baseline integrity：`/Users/Hugh/.config/3rd-review/config.json` 当前实际 hash 为 `b696550647cc24fd04d34bedd7bbf65ad706d2a7e08999173bd41a779907eea7`，历史 baseline 仍记录 `b36fe201d3d71ee956e1393b5943b2906004162f2a5a795ed634cc5e35330e53`。这是 live config 漂移，不把历史 baseline 改成假绿，也不把这 5 个失败归因给九面 benchmark。
- 当前九面定向测试仍为 13/13 通过；3rd-review 候选全量此前 294/294 通过；WorkflowHub 候选全量此前 1549 passed、1 skipped。三者都只证明实现/工具链事实，不能替代完整 A/B 和正式 close。

## 当前会话 verify finding 处置：US-02 配置快照（2026-08-14）

- 正式 `verify-code` attempt `948fb578-5ffc-4641-a4f7-c5ee0a296458` 由 `opencode/v4flash` 和 `codex/luna` 都成功返回，形成 10 条 findings；主要问题确认是旧 snapshot、26 项 AC 语义证据、T010 A/B、finding/例外/人工确认、mini-task 闭环缺失，以及 ModelTest 全量 5 个 US-02 config hash 失败。
- 对 5 个 US-02 hash finding 已修复：新增仓库内冻结的 `evaluation-assets/baselines/us-02/v1/provider-config.json` 和 `v2/provider-config.json`，保留原三 provider 的模型身份，只去掉会随运行环境变化的 `source_id/deadline_ms`；v1/v2 baseline、gate identity 和 report model 改为绑定冻结文件，不再读取宿主可变配置。
- 真实验证：`node --test evaluation-assets/tests/us02-baseline-integrity.test.mjs` 为 10/10 通过；这条 finding 由 `fixed` 处置，不是 `accepted_risk`。
- 其余 verify findings 仍是有效未完成事实，尤其是当前 verify snapshot、完整 AC、T010 九面有效 A/B、finding disposition、例外处理、人工确认和 mini-task 正式闭环；它们不能通过单测自动消失。

## 计划来源挂接修正补充（2026-08-14）

- 本次 verify-code 当前快照审查确认：原始需求到 plan/tasks 的来源挂接有 16 处不准确。问题不在原始需求或 spec 漏记，而在 build-plan 的汇总表和若干 task 的 `source_refs` 把不同问题混成了同一行，导致审查无法判断哪条任务真正覆盖哪条需求。
- 已按 spec 的权威来源映射修正 `plan.md` 的 traceability 表：审计、九面审查角度、成本评测、AgentHub 对标、材料边界、失败恢复、治理、交接、流程追踪、mini-task 和 close 各自单列；R-001..R-024 每条只挂到对应语义，不再把全部需求挂到 T010。
- 已同步修正 `tasks.md` 的 T003/T004、T005/T006、T007/T008、T009、T010 来源引用：mini-task 明确使用 R-021；ModelTest 明确使用 R-003/R-004；T010 只保留评测和聚合真正消费的需求。原始错误审计文件只读保留，不覆盖历史事实。
- 这次修改改变了当前任务材料语义，旧 verify/test/review 不能直接沿用；需要在新快照上重跑确定性门和一次有理由的当前 verify-code 异源复核。未完成前仍保持 `incomplete`，不把来源修正误报成质量完成。

## 当前会话最终交付事实（append-only，2026-08-15）

- 当前候选实现快照为 `83dd072357582d7e9820865af5ea4b21d5c873ee`，source digest 为 `4ba88637ce49ee798e88573bc84f9e6565a71720998727dda9b088f0b3058634`。最后一次审查材料已修正为独立的当前 open-risks 摘要，不再把完整 spec 重复发送为风险材料。
- 当前真实测试：WorkflowHub `1518 passed、0 failed、1 skipped`；live public behavior `10 tests、14 CLI cases`；3rd-review `288 passed、0 failed、0 skipped`；ModelTest `285 passed、0 failed、3 skipped`。US-06 的 3 个 real-report skip 仍不算通过。
- 最终 verify-code 异源审查 attempt 为 `1204dea5-5a6d-4721-ab36-7cfd07a8e7c1`，`opencode/v4flash` 和 `codex/luna` 均 completed，2/1 valid，零 timeout、零 invalid output、零 provider failure、零 fresh retry、零 same-session repair；9 条 finding（2 blocking、5 major、2 minor）已完整保留。
- 9 条 finding 的当前处置全部为 `needs_human`，没有伪造 `fixed`、`rejected_invalid` 或未经用户授权的 `accepted_risk`。当前 `quality/verify.json` 保持 `incomplete`；independent review 已记录，但 finding dispositions、acceptance criteria、exceptions 和 human confirmation 未完成。
- 当前不能 close 的根本原因已经收敛为外部/正式事实缺口：T010 九面 paired A/B 无有效终态；US-06 缺外部 US-05 sealed task root；真实 route/member、P5/T010 写回调用数、五阶段和新增对象证据、live probe runtime receipt、逐 AC 可回读证据及用户风险确认未齐。AC-16 因没有三轴 mutation/调用数直接证据保持 unknown。
- 没有执行 commit、push、merge、分支删除、archive、cleanup 或正式 close。没有单独未完成的 mini-task；T005/T006 是主任务内已完成的 mini-task 设计/实施实现卡，但其正式质量事实仍受主任务 incomplete 约束。

## US-06 外部依赖路径纠正与复测（append-only，2026-08-15）

- 新事实：US-05 sealed task root 实际存在于 `/Users/Hugh/Hugh/Knowledge/Projects/ModelTest/tasks/US-05`；先前判定缺失是路径查错，不是源材料真的不存在。
- 真实 US-06 报告复测：`MODELTEST_US06_US05_TASK_ROOT=/Users/Hugh/Hugh/Knowledge/Projects/ModelTest/tasks/US-05 node --test evaluation-assets/tests/us06-real-report.test.mjs` 为 3/3 passed、0 skipped；source manifest 的 report input、summary、plan 和 7 个 diagnostics 均存在且 hash 通过。
- ModelTest 全量复测同样为 288 passed、0 failed、0 skipped。`quality/verify.json` 已更新为 `full_tests_fresh=passed`；US-06 的“缺 root/3 skipped”旧 finding 已在新的 finding disposition 记录中标记 `fixed`，旧记录继续只读保留。
- 这只关闭了 US-06 依赖缺口，不等于 AC-24/AC-26 的产品验收事实已经完成，也不改变 T010 inconclusive、真实 route/member/P5/T010 写回计数、逐 AC、live probe receipt、例外、人工确认和正式 close 的状态。
- 本次没有新增需求，因此没有新建 mini-task；没有执行 commit、push、merge、archive、cleanup 或正式 close。

## 当前会话外部证据补齐（append-only，2026-08-15）

- 当前快照的 live public behavior 已重新执行：`npm run probe:public-behavior` exit 0，10/10 测试和 14 个 CLI case 通过，receipt 绑定 snapshot `83dd072357582d7e9820865af5ea4b21d5c873ee`，输出摘要 hash 已记录。
- 因此 F-e4fdba002ae6 的“包内没有 live runtime receipt”缺口已由新 receipt 关闭；F-5982b5e2b9ba 同样已由真实 US-06 3/3 与 ModelTest 288/288 证据关闭。剩余 7 条 finding 仍需人工或外部事实处理。
- 这两项只是补齐测试事实，不等于产品验收、T010 质量/成本结论或正式 close；当前仍保持 `incomplete`，未执行不可逆操作。

## 当前会话 ModelTest A/B 绑定修正与真实 smoke（append-only，2026-08-15）

### 原始需求

要用 `/Users/Hugh/Project/ModelTest` 的评测方案，对修改前和修改后的所有 stage 做真实对照；不能把测试工具失败或 provider 不可用伪装成质量结果。

### 关键事实

- current-v2 的 1260 条腿全部是 `TASK_BINDING_UNAVAILABLE`，没有调用 provider；根因是评测计划漏传 baseline/candidate TaskHandle，不是审查模型质量。
- 补齐 baseline TaskHandle 后，current-v3 计划的 1260 条腿都拥有版本绑定；真实 smoke 对同一 direction mutation 完成 4 条有效 paired attempts。
- baseline 两条真实运行中位数为 80.108 秒、8205 tokens；candidate 两条中位数为 346.481 秒、16591.5 tokens。两边 mutation recall 都为 1，但没有 clean control，不能算质量分数。

### 当前选择

保留 v2 失败事实，补齐安全要求的 TaskHandle，不放宽 `source_root` 禁止规则；先以同 case 的真实 paired smoke 验证绑定和成本，再决定是否继续九面 full benchmark。

### 理由

直接绕过 TaskHandle 会违反 WorkflowHub 的来源绑定和当前 Workspace 规则；而不记录 v2 会掩盖评测工具根因。smoke 已证明 candidate 的 direction 双阶段审查确实更贵，暂时不能宣称“高质量低成本”。

### 延期交接

T010 仍延期：需要九面 paired A/B、每面 clean control、有效质量分数、成本/耗时对比和失败分母；同时保留当前 7 条 needs_human findings、逐 AC、例外和人工确认缺口。当前不 close、不提交、不合并、不清理临时 benchmark 绑定。

## 当前会话 ModelTest 真实依赖复测纠正（append-only，2026-08-15）

### 原始需求

所有测试和审查结论必须基于当前能读到的真实材料；旧路径、旧快照或旧的 288/288 记录不能代替当前真实 US-05 输入。

### 关键事实

- 最新真实回归命令为 `MODELTEST_US06_US05_TASK_ROOT=/Users/Hugh/Hugh/Project/ModelTest/tasks/US-05 node --test evaluation-assets/tests/*.test.mjs`，exit code 为 `1`：288 项中 285 通过、3 失败、0 跳过。
- 3 个失败全部来自 US-06 real-report：`/Users/Hugh/Hugh/Project/ModelTest/tasks/US-05/quality/evidence/formal-cohort/us05-formal-20260812-v2-run3-reanalysis-v2/report-input.json` 不存在；源目录也不存在，错误是 `ENOENT`/`EXTERNAL_INPUT_MISSING`。
- 之前的 `288/288` 记录绑定的是另一个已经无法读取的 `/Users/Hugh/Hugh/Knowledge/Projects/ModelTest/tasks/US-05` 路径，当前不能继续当作真实证据。旧输出只读保留，新事实写入 `quality/tests/output/modeltest-full-current-83dd072357582d7e9820865af5ea4b21d5c873ee-v2.output`。
- 没有用 fixture、手工拼接或复制旧报告来填缺口；US-06 的 3 个真实报告测试保持失败/不可用，不写成通过。

### 当前选择

撤回 F-5982b5e2b9ba 的 `fixed` 处置，重新保持 `needs_human`；等待真正可读取的 US-05 sealed task root、`report-input.json` 和对应 manifest 后再重跑。当前 `quality/verify.json` 的完整测试事实更新为失败，整个任务继续 `incomplete`。

### 理由

真实外部输入丢失会直接影响 US-06 的用户可读报告和跨任务验收。把旧路径当成当前路径，会把失效证据伪装成通过，违反“缺失证据不是通过”的边界。

### 延期交接

US-06 外部 sealed 输入恢复前，AC-24/AC-26、F-5982b5e2b9ba、`full_tests_fresh` 和正式 close 均不能完成；这不是新需求，不新建 mini-task。T010 九面 A/B、其余 finding、例外和人工确认仍按原计划继续。

## 当前会话 benchmark 中断与 runner 修正（append-only，2026-08-15）

### 原始需求

真实 A/B 评测必须低成本、可中断、可恢复，不能把没有实际派发的审查腿写成已开始，也不能让挂死的 provider 子进程无限占用执行时间。

### 关键事实

- current-v4 全量计划共有 1260 条腿。运行中发现 4 条真实 candidate leg 子进程连续存活超过 4 小时，父 runner 没有形成对应的 `timed_out` 终态；该运行最终只有 32 条 completed、1228 条 started-without-terminal。
- v4 的中断事实已单独记录在 `quality/evidence/wh-review-benchmark-run-current-v4-interrupted.json`；没有把未终态腿当成失败、通过或可重跑成功。
- 根因之一是 runner 在进入 worker 前就为所有排队任务预写 `status=started`，导致“已排队”和“已派发”混淆；另一个风险是 detached 子进程超时后的进程组回收和父进程退出必须有清晰事实。
- 已修改 ModelTest candidate runner：只有 worker 真正派发任务时才写 attempt/leg 的 started 记录；新增回归测试验证 `--limit 1` 时第二条排队腿没有 started 文件。runner 定向测试现在为 3/3 通过。
- 新的 current-v5 计划重新绑定相同 baseline/candidate TaskHandle，共 1260 条腿；先做真实 direction/mutation-1 冒烟，baseline 4/4、candidate 4/4 完成。v5 的新 partial comparison 仍 inconclusive，但成本中位数约为 baseline 8195 tokens/87.5 秒、candidate 16517 tokens/334.8 秒，召回均为 1，因没有 clean control 不能算质量分。

### 当前选择

保留 v4 中断事实，废弃 v4 output root 的继续写入；使用修正后的 runner 和新的 v5 plan/output 继续真实 A/B。保留配置文件里的完整 provider 数量，不通过减少 provider 来掩盖成本。

### 理由

如果未派发的腿先写成 started，任何中断都会制造大量无法判断的假“已执行”记录；这既浪费 token，也会让后续恢复时误判。先修正记录边界，再继续全量，才能分清 provider 失败、runner 失败和真正质量结果。

### 延期交接

current-v5 全量仍在运行；完成前不能生成九面 comparison/report，也不能宣称 candidate 更高质量或更低成本。v4 临时 output、baseline/candidate worktree 和 TaskHandle 暂不清理，等最终事实闭合后统一处理。

## 当前会话 US-05 正确路径复测纠正（append-only，2026-08-15）

- 前一条“US-05 外部输入缺失”的复测使用了错误路径 `/Users/Hugh/Hugh/Project/ModelTest/tasks/US-05`；这条失败事实保留，但不能当成源数据缺失。
- 通过 Spotlight 和直接读取确认，真实 sealed root 是 `/Users/Hugh/Hugh/Knowledge/Projects/ModelTest/tasks/US-05`，其中 `report-input.json` 存在。
- 用正确路径重跑当前 ModelTest candidate：`MODELTEST_US06_US05_TASK_ROOT=/Users/Hugh/Hugh/Knowledge/Projects/ModelTest/tasks/US-05 node --test evaluation-assets/tests/*.test.mjs`，exit `0`，289/289 通过，0 失败，0 跳过；US-06 real-report 3/3 通过。
- 因此 F-5982b5e2b9ba 恢复为 `fixed`，最新处置文件为 `quality/evidence/verify-code/finding-dispositions-current-83dd072357582d7e9820865af5ea4b21d5c873ee-v5.json`；错误路径的失败输出只读保留。
- 当前真正未完成的重点仍是 T010 九面 A/B、真实 route/member 和逐 AC 事实、其他 finding、例外、人工确认；不能因为 ModelTest 重新变绿而 close。

## 当前会话 bounded benchmark v6 选择（append-only，2026-08-15）

- v5 也因真实 provider leg 长时间停留在 `started` 被中断，说明把 1260 条腿放进一个长寿命进程不适合当前宿主和 provider 生命周期；v4/v5 的中断事实均保留，不重写。
- ModelTest 评测合同的 comparison 最低门槛是每面至少 4 条有效 paired executions。current-v6 采用 2 runs，但保留全部 6 类 case（clean control + 5 mutations）、baseline/candidate 两个版本和配置中的完整 reviewer 数量：两 provider 面每个 case 有 8 条腿，三 provider 面每个 case 有 12 条腿。
- v6 计划共有 504 条腿，覆盖 9 个 stage surface；生成命令新增 `--run-count 2`，不修改 mutation bundle 或生产 provider 配置。计划公式记录 `max_bundle_repetitions=5`，明确这是有界评测批次，不把 2 runs 冒充原始 5 runs。
- 当前选择：逐 surface/case 小批次执行，批次之间保留 terminal/unavailable/timeout 分母；先得到可计算的逐面质量、召回、误报、执行率、token 和时长，再决定是否需要额外重复。
- 理由：这样同时满足“每个 stage 都对照”和“审查执行不无限拖延”；如果某一面在小批次都无法形成 4 条有效配对，结论保持 inconclusive，不靠补跑或删失败制造绿灯。

## 当前会话 benchmark provider 终态修正（append-only，2026-08-15）

- v6 的初步 direction 结果显示 baseline delivery quality `69.5`、candidate `76.5`，candidate recall 从 `0.85` 到 `0.95`，但 clean false-positive rate 两边都是 `1`，candidate 低于 80 分门槛；token 增加 `101.52%`，时长增加 `295.47%`。这只是 v6 初步结果，不能作为最终结论。
- 复查 v6 原始 attempt 发现 27 条“partial”中有 24 条只是合同规定的 `SAME_SOURCE` 排除：host 是 codex 时，配置中的 `codex/luna` 不会自审，必须记录诊断但不应把它当 provider 失败。
- v7 的临时实现把 `SAME_SOURCE` 误算成 partial，已停止并保留为评测器纠正事实。最新 runner 现在只把真实 `SESSION_IDLE_WITHOUT_TERMINAL`、`OUTPUT_INVALID`、timeout 等算失败；`completed + SAME_SOURCE` 算合法终态，并单独记录排除数量。
- 新 v8 计划重新绑定 runner snapshot，共 504 条腿；v8 结果才用于正式逐面 comparison。此前 v6/v7 结果只读保留，不混入 v8。

## 当前会话 v8 direction 真实 A/B 结果（append-only，2026-08-15）

### 原始需求

必须用真实 baseline/candidate、clean control 和五类 mutation 对照审查质量与成本；provider 没有完整终态时，不能把这一腿算成有效结果。

### 关键事实

- v8 direction 已完成 clean control、mutation-1 到 mutation-5，共 48 条 paired attempts；terminal 48 条。
- comparison：`quality/evidence/wh-review-benchmark-comparison-current-v8-direction-partial.json`，状态 `inconclusive`；当前只完成 make-decision.direction，其余 8 个 surface 仍没有有效 A/B。
- baseline：delivery quality `66`，serious recall `0.80`，clean false-positive rate `1.00`，execution rate `1.00`，中位 `8200 tokens / 87235.5 ms`，48/48 有效。
- candidate：delivery quality `71.8`，serious recall `0.8947`，clean false-positive rate `1.00`，execution rate `0.9167`，中位 `16521.5 tokens / 335328.5 ms`，44/48 有效；2 条因 `PROVIDER_GROUP_PARTIAL` 记为 `unavailable`。
- candidate 相对 baseline：质量 `+5.8`，token `+101.48%`，时长 `+284.39%`；未达到质量门槛 `80`，也没有达到低成本和非回归门槛。
- 真实代码回归：WorkflowHub `1518 passed、0 failed、1 skipped`；live public behavior `10/10`、14 个 CLI case；3rd-review 单独重跑 `294/294`；ModelTest 使用真实 root `/Users/Hugh/Hugh/Knowledge/Projects/ModelTest/tasks/US-05` 为 `289/289`。
- 3rd-review 与 WorkflowHub 并行运行时曾出现一次并发时序测试 `293/294`；单独重跑通过，说明该测试存在时序脆弱性，但不能把第一次失败删除，已保留为运行事实。
- live public behavior 最新 receipt 为 `quality/evidence/live-public-behavior-current-83dd072357582d7e9820865af5ea4b21d5c873ee-v2.json`，耗时 `52920 ms`。

### 当前选择

不 close。把 v8 direction 结果定为“候选方案有一定召回提升，但高成本、清洁输入误报未改善、且存在 provider 不可用”，不能宣称 wh-review 已实现高质量低成本；继续保留其余八面 A/B、7 条人工 finding、逐 AC、例外和人工确认缺口。

### 理由

这次结果直接回答了“质量有没有提升、是否浪费 token/时间、失败是否影响交付”：质量只小幅提升，成本翻倍以上，时长接近四倍，clean control 仍全部报 finding，且执行率下降。继续补跑不能掩盖这些根因，只能补齐未测 stage 后再决定具体改动。

### 延期交接

T010 继续 `inconclusive`；当前任务仍不提交、不合并、不清理、不正式 close。下一步是逐面完成或明确终止其余 A/B，再基于真实结果调整审查合同、provider 调度和 finding 终态，不新增与现有主任务重复的 mini-task。

## 当前会话 mini-task 真实复测与运行时纠偏（append-only，2026-08-15）

### 关键事实

- v8 `mini_task.design` 的旧 candidate 评测全部 unavailable；根因不是 provider，而是 `review-runner` 把 mini-task 当成普通 `build-code/integration`，并且没有把 `review_kind` 传给 `buildMaterials`，所以设计材料被要求提供 `approved_spec`。
- 已修复 WorkflowHub candidate：mini-task 不再走普通 integration subject；`review_kind` 传入专用材料合同；`mini_task.implementation` 重新保留完整 diff。聚焦回归为 `38/38 passed`。
- 修复后 v11 `mini_task.design` 真实矩阵为 candidate `42/48` 有效，delivery quality `74.86`，serious recall `0.9444`，clean false-positive rate `1.00`，中位 `8203 tokens / 166959 ms`；baseline `0/48` 有效，仍被旧材料合同拒绝。该面证明了路由修复，但 candidate 未达到质量 80 分线，且低成本结论失败。
- v11 `mini_task.implementation` 继续暴露两个真实边界：旧 benchmark material 把 `test_evidence/ac_trace` 写成字符串，且 baseline worktree 没有 diff；这些是评测输入错误，不应改成放宽产品合同。已给 ModelTest runner 增加当前 snapshot receipt、结构化 AC trace，并给 baseline 加入只用于 benchmark 的 implementation fixture。
- v13 implementation 受控 smoke 中，candidate 至少有一条真实 semantic review 返回 3 个 findings；其中包含 mini-task 质量事实可能被无条件写成 `passed`、未 verified 的用户结果可能变成 `ready`、以及普通审查可能按 attachment delivery 被拆成多个 broker request 三个问题。三条都未修复。
- 同一 v13 candidate clean-control smoke 的两条 leg 在 `180000 ms` 超时；完整批次的 4 条 candidate leg 连续约 5 分钟没有终态，已停止并把已启动未终态标成 `ambiguous`。这是真实 provider/lifecycle 成本事实，不是质量通过，也没有自动重试。
- v12 implementation 全量 48 条仍是旧输入失败事实；v13 只作受控纠偏复测，不能把两份结果混成一个 comparison。v11 design、v13 implementation 的 compare 仍是 `inconclusive`，因为 baseline/candidate 有效配对不足。

### 当前选择

保留 mini-task 专用合同和严格结构化证据要求；不为了让 benchmark 变绿而删除 diff、AC trace、current snapshot receipt 或 provider group 终态要求。下一步先修复真实 finding，再用更短、可控的 provider timeout 做必要复测；九面总体 A/B 继续保持 `inconclusive`。

### 理由

这次真实复测把问题分开了：前两类是 WorkflowHub 路由/材料传参缺陷，已修；后一类是 benchmark 输入契约和 provider 生命周期缺陷，不能用放宽审查合同掩盖。真实返回的 findings 已经说明正常 close 事实链仍有风险。

### 延期交接

T010 仍未完成。待处理：mini-task implementation 受控有效配对、`recordCapturedMiniTaskQuality` 和用户结果 verified 守卫、单次完整 broker group 调用、build-plan 的 Kimi 未登录、其余 build-code/verify-code surface A/B、7 条历史 finding、逐 AC、例外和人工确认。当前不 close、不提交、不合并、不清理临时 benchmark fixture。

## 当前会话按用户要求停止继续烧时（append-only，2026-08-15）

- 用户指出本任务已消耗过多时间，要求解释成本并判断是否能收口；已停止尚未完成的 `npm test` 全量回归。该命令没有形成当前全量通过结论，退出码为 `130`，不写成 passed。
- 当前仍可引用的最新聚焦事实：WorkflowHub wh-review/mini-task/材料/官方 stage 聚焦集成测试 `5 files / 80 passed`；ModelTest benchmark runner 定向测试 `4/4 passed`；mini-task design candidate 真实矩阵 `42/48` 有效、质量 `74.86`；implementation 受控真实 smoke 有 semantic finding，但同时有 `180000 ms` timeout。
- 当前结论：可以停止本轮继续执行和继续烧 provider 成本，但不能把任务标成产品交付完成或正式 close。`quality/verify.json`、T010 九面 comparison、finding disposition、逐 AC、例外和人工确认仍未闭合。

## 当前会话评分器与审查链修正事实（append-only，2026-08-15）

### 原始需求

- 不能因为评分低于固定 80 分就无限继续优化；评分必须帮助判断质量、成本和可靠性，不能替代交付事实。
- 要验证本轮修改是否真的改善了审查质量，同时保留 provider 失败、超时和审查不可用事实，不能把它们改成空 findings 或通过。

### 关键事实

- ModelTest 新增 `scorecard:wh-review-benchmark:v1.1.0` 和 `evaluator:wh-review-benchmark:v1.1.0`。新公式仍报告逐面 delivery quality，但删除固定 candidate `80` 硬闸门；serious recall、clean false-positive、execution、token、duration、失败和 paired completeness 仍分开报告。旧 v1.0.0 结果只读保留。
- ModelTest v1.1 定向回归：19 个测试全部通过；评分器明确验证“不再有固定 80 分门槛”和“不完整 A/B 保持 inconclusive”。
- WorkflowHub 定向回归：5 个测试文件、83 个测试全部通过，耗时约 162.53 秒。覆盖 review-runner、材料合同、mini-task delivery、mini-task resume 和 vNext official stage。
- mini-task 的 `ready` 现在同时要求 canonical review、通过测试 receipt、finding disposition、AC trace 和 exceptions；用户结果必须是当前快照下带 method/scenario/expected/observed/oracle 的 `verified` 事实。没有把普通 verify 事实当成 mini-task implementation review。
- ordinary review group 已改成一次 broker group 调用，保留每个 configured provider 的成员事实；不按 attachment delivery 拆成多次公共请求。
- 当前快照受控 `verify-code` 审查第一次在材料预检阶段发现 AC 截取为空，provider 未调用，记录为 `MATERIAL_INCOMPLETE`：`quality/reviews/attempts/8fd286a0-5a33-4054-b30a-4480e819a232/attempt.json`。
- 修正 AC 片段后再次按配置请求 `opencode/v4flash`、`codex/luna`；两个 provider 都没有返回合法公共结果，记录为 `PROTOCOL_INCOMPATIBLE`，没有生成 semantic findings，也没有自动重试：`quality/reviews/attempts/8328e498-da00-44c8-93e5-f3ddcd772d2e/attempt.json`。

### 当前选择

- 采用“分项事实 + 明确状态”的评分方式：分数只用于比较和诊断；质量是否可交付仍由当前测试、审查、finding 处置、AC、例外和人工确认事实共同决定。
- 保留这两次审查失败，不补造 findings，不把 unavailable 当 pass，也不为追求分数再次反复调用 provider。

### 理由

- 旧评分器把文字公式和实际代码算式写成了两套，并硬编码 80 分；这会把“评测分数不够”和“产品事实未完成”混在一起，正是反复优化和浪费 token 的根因之一。
- 新回归证明代码修复没有破坏关键交付边界，但当前真实 provider 公共协议仍不可用；因此只能确认确定性实现质量，不能宣称异源审查质量已经通过。

### 延期交接

- `quality/verify.json`、T010 九面 paired A/B、逐 AC、finding disposition、exceptions、human confirmation 仍保持 `incomplete`；本轮不 commit、不 merge、不 push、不清理、不正式 close，等待用户明确下一步。

## 当前会话评分器配对修正（append-only，2026-08-15）

- 复核 ModelTest v1.1 实现时发现一个真实 bug：评分器虽然保存了 `case_id/run_index/reviewer_index`，但 `compareSurface` 原来用 `row.case` 生成配对键，会把同一 case 的多次 run 压成一条，可能错误影响 paired A/B 结论。
- 已修正为直接用完整 attempt row 配对，并新增同一 case 多 run 的回归测试；ModelTest 定向回归现在为 `20 passed、0 failed`。
- 之前记录的 `19 passed` 是修正前事实，只读保留；最新 `20 passed` 才是当前评分器代码的有效定向回归事实。

## 当前会话评分器与历史 A/B 重算补充（append-only，2026-08-15）

### 原始需求

- 用户要求看到所有 stage 的修改前后审查对比，确认质量是否真的提升；不能把“低于 80 分”自动当成继续优化的理由。

### 关键事实

- 用修正后的 `evaluator:wh-review-benchmark:v1.1.0` 对已保存的 v8 真实 attempt 重新计算。v1.1 不再设置固定 80 分闸门；它仍保留 serious recall、clean false-positive rate、execution rate、token、duration、失败和配对完整性。
- 重算前又发现 matcher 与 WorkflowHub 正式 finding 合同不一致：生产合同没有 `target` 字段，`evidence` 是非空字符串；旧 v1.1 matcher 硬要求 `target` 且只接受数组/对象 evidence，会把合法 finding 判成未命中。已改为从 `issue/root_cause/recommendation/evidence/path` 判断语义相关性，并接受合同允许的字符串 evidence；ModelTest 定向回归保持 `20/20 passed`。
- v8 重算后的可比较结果如下；`inconclusive` 表示事实不足，不是质量通过或失败：
  - `make-decision.direction`：baseline `66` → candidate `71.8`；recall `0.80` → `0.8947`；clean false-positive `1.00` → `1.00`；execution `1.00` → `0.9167`；token 中位 `8200` → `16521.5`（`+101.48%`）；时长中位 `87235.5ms` → `335328.5ms`（`+284.39%`）；paired valid `22`，因缺失/不可用腿保持 inconclusive。
  - `make-decision.detail`：旧 v1.0 曾记为 `62.5` → `79.58`；按修正后的 v1.1 matcher 重算为 baseline `73` → candidate `79.58`；recall `0.90` → `1.00`；clean false-positive `1.00` → `1.00`；execution `1.00` → `0.9583`；token `8198` → `8200`（`+0.02%`）；时长 `77302.5ms` → `164420.5ms`（`+112.70%`）；paired valid `23`，仍 inconclusive。这里说明旧分数的质量差异有 matcher 口径影响，不能只看 `+17.08`。
  - `build-spec`：baseline `80` → candidate `80`；recall、clean false-positive、execution 都是 `1.00` → `1.00`；token `8199` → `8198`（约 `-0.01%`）；时长 `62937.5ms` → `166275ms`（约 `+164.2%`）；paired valid `24`，完整证据下结论是 `reported/not_improved`，不是“质量提升”。
  - `build-plan`：baseline/candidate 均 `0/72` 有效，质量不可计算；有 token/时长记录，但不能推出质量结论。
  - `build-code.phase`、`build-code.integration`、`verify-code`：两边均没有形成有效配对，质量和成本对比均保持 inconclusive。
  - `mini_task.design`：candidate `42/48` 有效，quality `74.86`，recall `0.9444`，clean false-positive `1.00`，execution `0.875`，token `8203`，时长 `166959ms`；baseline `0/48` 有效，因为旧 baseline 被错误 mini-task 材料合同拒绝，不能宣称 A/B 改善。
  - `mini_task.implementation`：candidate 受控样本有 semantic findings，但完整 baseline/candidate 配对和稳定终态不足，不能给质量分数。
- 以上重算摘要已保存到当前任务的 `quality/evidence/wh-review-benchmark-rescore-v1.1-20260815.json`；旧 v1.0 comparison 仍只读保留，没有覆盖。
- 因此当前能确认的真实结论是：direction/detail 的缺陷召回有提升，但 clean control 误报没有改善，token/时长明显变差；build-spec 没有质量提升且明显变慢；mini-task design 只证明路由修复，不能证明前后质量提升；其余 stage 没有可计算的 A/B。没有全局总分，也没有“低于 80 就一直继续”的合法依据。

### 当前选择

- 把旧 v1.0 数值只读保留；正式比较采用 v1.1 的分项事实和明确状态。分数只用于解释质量变化，不能作为 WorkflowHub stage 完成或继续工作的许可证。
- 不因为任一面低于 80 自动重跑；只有出现真实语义变化、修复了评测器/材料根因，或用户明确要求补充一组有界对照时才运行新的 A/B。

### 理由

- 旧评分器的问题不是“分数低”本身，而是把固定门槛、质量、执行可靠性和成本揉在一起；配对键和 finding matcher 还会改变结果含义。修正后才能区分“质量真的提升”“只是更会命中关键词”“执行失败”“材料/协议不可用”。

### 延期交接

- 当前九面 A/B 仍不是完整交付证据；方向、detail、build-spec 和 mini-task design 的事实已可供用户查看，其他面保持 incomplete/inconclusive。正式 review、finding 处置、AC、例外和人工确认仍按当前任务的交付边界处理，不由分数替代。

## 旧 ModelTest calibration 链补充（append-only，2026-08-15）

- 独立复核发现，ModelTest 另一条旧 `calibration-v1` 链使用 `mutation_id/evidence_anchor/category/severity` 匹配，而标准 WorkflowHub finding 合同使用 `severity/path/line/issue/root_cause/recommendation/evidence_kind/evidence`；两套字段没有对齐。
- 该旧 calibration assessor 还要求 `id/evidence_anchor/summary/recommendation/severity` 的另一套 finding 结构。标准 WorkflowHub finding 直接送入时可能在契约阶段失败，或只能得到 `unknown/needs_human_review`；不能把它报告成 `missed`，也不能据此评价 provider 质量。
- 现有旧 calibration fixture 和测试只证明自定义合成字段能运行，不证明标准 WorkflowHub finding 可以匹配。该事实与本任务修复的九面 `wh-review benchmark v1.1` 是两条不同评测链：九面链已修正 matcher 以接受正式 finding 合同；旧 calibration 链仍只读保留，不能混入本次质量结论。

## 公共 broker 失败分类修正与当前回归（append-only，2026-08-15）

### 关键事实

- 根因已确认：`ReviewProviderClient` 原来只接受退出码 `0/3`，所有非零退出、坏 JSON、spawn 失败和本地调用异常都被压成 `PROTOCOL_INCOMPATIBLE`；`reviewGroup` 再把一次 group 失败复制成每个 configured provider 一条失败事实。这会虚增 provider 失败数、重试数和失败耗时，也让一次公共协议问题看起来像多个 provider 语义失败。
- 现在公共错误会按事实区分：`BROKER_SPAWN_FAILED`、`BROKER_EXIT_NONZERO`、`BROKER_INVOCATION_FAILED`；stderr 中合法的 `{error:{code,message}}` 会保留安全公共错误码；非 JSON 只保留 stdout/stderr SHA-256，不写原始流和主机路径。
- 一次 group 在产生 provider member 前失败时，attempt 保留 reviewer coverage 和顶层错误，`provider_attempts` 为空；不会把一次 group 失败复制成多个 provider attempt，也不会把它算成多个 provider 重试。
- 公共错误显示在审查报告的 `attempt error`，和语义 finding 分开；新增分类仍是 transport 事实，不是 findings、不是通过。

### 当前回归

- wh-review focused：4 个测试文件、65 项通过，覆盖 v3 client、review runner、fake E2E、协议合同。
- 新增故障矩阵：broker 公共错误保留、非 JSON 输出只留 hash、spawn 失败单独分类、group 失败不复制 provider attempt。
- requirements completeness：33 项通过；stage review cost policy：9 项通过；workflow quality regression：7 项通过；official component receipts：31 项通过；mini-task delivery：18 项通过。
- 一组混合回归曾运行到 mini-task 全部 `18/18` 通过，但后续包含 close 模拟的测试未在本轮完成；退出码 `130`，不把整组写成通过。拆开的核心测试结果仍按各自文件保留。

### 当前选择

- 保留这次分类修复，不重跑真实 provider；先用 fake-wire 回归确认诊断边界，再决定是否有必要做一次有界真实调用。
- 不改变 provider 选择逻辑、不新增公共流程节点、不放宽 findings 合同、不把失败改成空 findings；符合 WorkflowHub 宪法的“事实和质量分开”原则。

### 延期交接

- 当前任务仍不 close、不提交、不合并、不 push、不清理。`quality/verify.json` 需要重新绑定这次代码快照后才能作为最终状态文件；九面 A/B、finding 处置、AC、例外和人工确认仍按原记录保持未闭合。

## 3rd-review 来源漂移与复用边界复核（append-only，2026-08-15）

- 当前 live 配置实际指向 `/Users/Hugh/Hugh/Project/3rd-review/scripts/3rd-review.mjs`，不是本次候选 worktree；候选和 live producer 都有未提交改动。这个事实不能作为当前候选 v3 已部署的证明，也不能把 live 失败直接归因于候选代码。
- 3rd-review 候选的 v3 producer/client 静态合同测试通过，但跨仓真实 producer 版本仍未冻结。最终 benchmark 必须把 WorkflowHub、3rd-review、ModelTest 的 commit/tree、配置 hash 和 bundle hash 一起记录；任一仓 dirty 或版本读不回，结论保持 `incomplete`。
- 本轮不修改 `/Users/Hugh/.config/workflowhub/config.json`，不偷偷切换 live producer；否则会改变用户当前运行环境。后续若要真实复测，只能在明确绑定的干净 producer 版本上执行一次有界调用。
- build-code/P5 复用边界已由 `semantic_hash + isMaterialOnlySnapshotDelta` 覆盖：只写回 `decision-log/spec/plan/tasks` 且语义投影不变时发布当前树别名，不再调用 provider；代码、接口、AC、oracle、review contract 或其他真实语义变化时必须重新审查。`tasks.md` 仅执行状态填写区的写回也能通过最终 freshness 检查。
- 当前仍不能把“复用成功”扩大解释成“产品全部完成”：它只解决重复审查和快照浪费，不替代当前 review、finding 处置、AC、例外和人工确认。

## 最新确定性回归与 bundle 对齐（append-only，2026-08-15）

- 最新 `npm run test:safe` 在修改协议文档前启动，最终读回为 `160` 个测试文件、`1527 passed`、`1 skipped`，唯一失败是旧进程已经读入旧的 `provider-protocol.md` bundle hash；不是行为断言失败。
- 更新 wh-review 和 mini-task 的 skill bundle 文件 hash 及 `skills/catalog.yaml` 后，重跑闭包回归为 `3 files / 21 passed`；`npm run test:exclusive` 为 `2 files / 31 passed`。
- provider v3 文档示例已改成与 `contracts/workflowhub-result.v3.json` 相同的嵌套结构，并通过 JSON 解析和 wh-review contract 回归。
- 因此当前确定性实现证据完整；真实 provider、九面有效 A/B、当前 verify 和人工交付事实仍不能由这组测试替代。

## 当前目标工作树与候选工作树回归复核（append-only，2026-08-15）

- 目标工作树 `/Users/Hugh/Hugh/Project/workflowhub` 当前快照树为 `7553a0b23176bee448ae9c1570c812ceb4fc8c7e`；在该工作树直接运行 wh-review runner、mini-task delivery、official receipts、stage review cost policy 和 workflow quality regression，共 `6 files / 95 passed / 0 failed`。
- 候选工作树 `/Users/Hugh/Hugh/Project/workflowhub-wh-review-adversarial-quality-cost-redesign` 运行同范围扩展回归，共 `10 files / 135 passed / 0 failed`；这只能证明候选实现没有确定性回归，不能当作目标工作树已合并。
- ModelTest 候选的 v1.1 benchmark 相关回归重新运行 `19 passed / 0 failed`；`git diff --check` 在目标和候选工作树均通过。以上命令均未调用真实 provider。
- 目标工作树的当前快照树仍不是 `quality/verify.json` 绑定的 `83dd072357582d7e9820865af5ea4b21d5c873ee`；不能把这轮测试自动写成当前 verify 事实，也不能用测试通过覆盖 T010、逐 AC、finding 处置、例外和人工确认缺口。

### 当前选择

- 保留两套工作树的边界：候选结果只作为待交付实现证据，目标任务记录只引用目标工作树或明确标注候选来源。
- 不修改 live WorkflowHub/3rd-review 配置，不调用真实 provider，不把目标树和候选树的回归结果混合，不提前重写 `quality/verify.json`。

### 延期交接

- 在用户授权 close 前，仍需先决定候选改动是否进入目标工作树；进入后再由官方 verify writer 重新绑定当前快照，并重新检查正式事实。当前不 commit、merge、push、archive 或 cleanup。

## v13 mini-task 真实 finding 的确定性处置复核（append-only，2026-08-15）

- 先前 v13 smoke 暴露的三类问题已有当前候选代码和回归覆盖：`recordMiniTaskQuality` 不再接受调用方自报 `passed`，canonical user result 必须是当前快照且含 method/scenario/expected/observed/oracle，AC trace、finding disposition 和 exceptions 都必须结构化；普通 verify 事实不能替代 mini-task implementation review。
- 普通审查组由 `reviewGroup` 统一调用一次 `providerClient.runGroup`，附件不再触发按 provider 拆分的公共请求；group 失败保留顶层 broker 事实，不复制成多条 provider attempt。
- 目标工作树 mini-task 回归的 `11` 项和候选扩展回归的 `18` 项均通过；这些是 fake broker/本地回归事实，不代表真实 provider 已重新成功。
- 因为没有新增用户需求，这次没有新建额外 mini-task；原有 mini-task design/implementation 路由仍是主任务内的专用审查分支，不增加第六阶段。

### 当前选择

- 将 v13 的旧 smoke finding 区分为“代码边界已被确定性测试覆盖”和“真实 provider 质量尚未重新证明”两类；不把前者扩大成整体质量通过。

### 延期交接

- 仍需在候选改动进入目标工作树后重新绑定 verify；T010 的 provider A/B、逐 AC、正式 finding 处置、例外和人工确认仍按当前任务状态处理。

## 工作树事实口径更正（append-only，2026-08-15）

- 本任务的 `task.json.inputs`、T009/T010 manifest 和历史 execution 都明确把 `/Users/Hugh/Hugh/Project/workflowhub-wh-review-adversarial-quality-cost-redesign` 作为当前任务 worktree；`/Users/Hugh/Hugh/Project/workflowhub` 是它的 `target_repo_root` 和 main 基线，不是本任务当前实现快照。
- 因此上一条把 main 工作树 `7553a0b23176bee448ae9c1570c812ceb4fc8c7e` 作为“目标 verify 快照”的说法只属于额外基线回归事实，不能用来判断本任务候选实现是否已合并；本任务候选当前快照树为 `9686f24e8f5f131b39661a3511d701a3b4c09d6e`。
- 正式 `quality/verify.json` 仍绑定旧候选快照 `83dd072357582d7e9820865af5ea4b21d5c873ee`，所以当前真正缺口是候选 worktree 变更后的官方 verify 重新绑定，而不是把 main 的测试结果冒充候选结果。

### 当前选择

- 后续正式 verify、close freshness 和交付判断统一以候选 worktree 为当前任务输入；main 只作为目标分支基线，单独记录，不混合事实。

### 延期交接

- 候选代码和任务材料完成最终确认后，仍需用户授权再执行 commit/merge/push/cleanup；在此之前只更新候选任务事实，不改变 main。

## 评测 clean-control 金标准缺失修正（append-only，2026-08-15）

### 原始需求

- 不能因为错误的 80 分标准不断继续优化；审查质量、稳定性和成本必须分开看，评测不能把材料本身的缺陷误当成审查误报。

### 关键事实

- 读取 v8 原始 attempt 后确认：旧 `clean-control` 的 subject 不是经过独立验收的干净用户流程，而是一个故意只写“可靠、可回滚、可验收”但没有具体用户流程、数据和状态的参考包。provider 对它提出的缺口是有材料依据的，不能直接归为 false positive。
- 因此 v1.1 中所有已评分 surface 的 `clean_false_positive_rate=1.0` 不能作为真实误报结论；它只说明旧控制样本中几乎每次都有 finding，不能说明这些 finding 都错。
- 这个根因也解释了为什么该公式的理论最高分被锁在 80：`recall=1`、`execution=1`、控制样本被错误记成全误报时，公式最高只有 80。旧 v1.0 的固定 80 门槛因此尤其误导。

### 当前选择

- 新增 `scorecard:wh-review-benchmark:v1.2.0` 和 `evaluator:wh-review-benchmark:v1.2.0`。
- 控制样本分成两类：经过独立验收、可回读事实支持的 `gold_clean`；没有这种事实的 `unlabeled_control`。后者只报告 `unlabeled_control_finding_rate`，不进入误报率和 delivery-quality。
- v1.2 保留严重召回、执行率、token、时长和失败事实；没有 `gold_clean` 时 delivery-quality 为 `null/inconclusive`，不再用估算分数阻塞或推动 WorkflowHub。
- v1.2 已接入 benchmark compare/report/plan 脚本默认路径，但没有重新调用 provider；历史 v8 只读重算为 9 面全部 `inconclusive`，其中 build-spec 等有完整 A/B 的面仍可看到召回、控制样本 finding rate 和成本，不能再看到伪造的误报/总质量结论。

### 当前验证

- ModelTest 相关定向回归：14 项通过，0 项失败；覆盖旧 v1.1 兼容、v1.2 控制样本分类、无 gold control 时保持 inconclusive、gold control 存在时才计算质量、固定 80 门槛拒绝。
- 生成的只读诊断结果：`quality/evidence/wh-review-benchmark-comparison-v1.2-20260815.json`、`quality/evidence/wh-review-benchmark-report-v1.2-20260815.json`。
- 没有修改旧 v1.0/v1.1 历史 attempt 和 comparison；没有把新的评测口径伪装成旧运行结果。

### 理由

- 误报率必须有“已知干净”的分母。没有独立验收的控制样本，强行计算误报率会把 reviewer 对真实缺口的发现惩罚掉，反过来鼓励 reviewer 少报问题。
- 分项事实比一个总分更符合本任务目标：先看有没有找到真正伤害，再看有没有误报，再看运行是否稳定，最后看 token/时间成本。

### 延期交接

- v1.2 解决了评测口径误判，但还没有为九个 surface 重新建立并独立验收 `gold_clean` 控制样本；因此历史 A/B 仍不能证明完整 delivery-quality 提升。
- 不启动新的 mini-task：这是当前任务内 benchmark 口径纠正，不是新增用户需求；没有新增 public stage、材料或控制面。
- 当前任务仍不 close、不 commit、不 merge、不 push、不 cleanup；继续以当前候选工作树和正式 verify facts 为准。

## 评分口径修正后的当前快照回归（append-only，2026-08-15）

- 评分器、规格和任务记录发生了真实变更后，没有沿用旧测试事实；按官方 `verify-code` receipt writer 重新执行候选工作树聚焦回归。
- 当前候选 snapshot tree：`e33fd1e1e8e77fb7473c1cab4d22e18dd6c5262e`；snapshot commit：`a7e7c4a7a0e7618546e89074f96c54d2dfa883e8`；source digest：`08298eeb2d15adbeca45f4cb42e9174f152a4a543edaaea7f8eef00e09f16437`。
- 官方 receipt：`quality/tests/verify-code-current-v1.2-control-fix.json`，receipt hash `f9d983db825126ed45d4fe0bc921f990de6917605f792b3228453e1e93d9b276`，output hash `9e22c9cb2e365f594f8d02b8d1f0093e4a11888e34f2d735330eefae92879cf6`，exit `0`。
- 当前 canonical test fact：`quality/facts/82cddf19e2219b5444cbe3b0f4e43a4c9ec975c60dff497230597998350d2e78.json`，状态 `passed`，绑定上述 snapshot；没有调用真实 provider。
- 这次只刷新测试事实，不把旧 snapshot 的独立审查、finding 处置、逐 AC、例外或人工确认冒充成当前事实；这些仍保持不完整。

## 全部当前材料变更可复用测试回执（append-only，2026-08-15）

- 发现 `core/task-close.mjs` 的实际实现只把 `tasks.md` 执行状态区变更当作测试回执仍然有效，与 `git-worktree-snapshot.mjs` 已写明的“当前四份材料变更可复用 full-test receipt”不一致。
- 已修正：`full_tests_fresh` 在 `decision-log.md`、`spec.md`、`plan.md`、`tasks.md` 的材料-only 变更下继续使用原测试回执；实现代码变化仍会判 stale，review/AC/例外/人工确认不自动放宽。
- 新增回归覆盖：在测试回执后同时修改 `tasks.md` 和 `spec.md`，close 仍通过；实现代码变更、测试树/commit 篡改、缺失和失败事实仍按原规则拒绝。
- 本次回归：`tests/integration/vnext-delivery-close.test.mjs` 为 `16/16 passed`；没有真实 provider 调用。

## 评测执行隔离与部分失败口径修正（append-only，2026-08-15）

### 原始需求

- 评测必须能真实比较所有审查面，但成本要可控；provider 失败要保留，不能靠重试或空 findings 把报告变绿。

### 根因

- 旧 benchmark runner 让所有 leg 共用同一个 baseline/candidate TaskHandle。并发 leg 会互相写 review、snapshot 和 mini-task 测试，导致一个 leg 改变另一个 leg 的输入，进而出现不可比和重复耗时。
- 旧 v1.2 compare 在已经有足够有效配对时，只因少数 provider leg unavailable 就整面不报告；这把“质量/成本可计算”和“执行是否完整”混成一个结论。
- 旧 reference `clean-control` 没有独立验收。继续把它当 gold 会再次制造错误误报率和 80 分上限。

### 当前选择

- 每条 benchmark leg 在对应 `Projects/<project>/tasks/` 下创建唯一临时 TaskHandle，只读取版本材料；运行后的 review/snapshot/test 写入该临时目录，采集 attempt 后删除，不污染共享任务。
- 新 plan 的 `clean-control` 只在携带 `oracle:wh-review-adversarial/v1/gold-clean-acceptance` 时标为 `gold_clean`；历史没有该引用的记录仍是 `unlabeled_control`。
- 新增独立 gold-clean acceptance 文件，按九个 surface 明确用户流程、数据状态、成功/失败边界、非目标和行为 oracle；没有 gold-clean 时 delivery-quality 仍为 `null/inconclusive`。
- 有至少四条有效精确配对、gold-clean、token/时长齐全时，即使少数 leg 失败，也报告质量/召回/执行率/成本和失败分母，并把 surface 标成 `reported_with_failures`、assessment 保持 `inconclusive`；不把部分执行写成质量提升。
- compare 读取 `run-summary.json`；被过滤、被 `--limit` 截断或未完成全计划时，顶层 execution scope 标为 `incomplete`，整体不得报告为完整 A/B。

### 当前验证

- ModelTest 资产校验通过：9 个 surface、45 个 mutation、gold-clean acceptance hash 均可回读。
- ModelTest benchmark 定向回归：`28 passed / 0 failed`，包含 gold-clean 分类、无固定 80 门槛、部分 provider 失败可见、每 leg 隔离并清理。
- 新 v1.2 plan-only 生成成功：`252` 条 leg、`0` provider call、配置 reviewer 数量完整保留、`42` 条 clean-control leg 都绑定同一独立 acceptance ref。
- 没有在本次修复后重新调用真实 provider；旧 v8 attempt 不被改写，仍按旧材料和旧 control 事实只读保留。

### 理由

- 评测隔离是比较成立的前提；否则即使 provider 返回合法 finding，也无法证明 finding 来自同一份输入。
- 部分失败应该同时留下“可计算的质量事实”和“不可忽略的可靠性事实”，不能为了整齐把两者都改成 inconclusive，也不能把失败删掉。

### 延期交接

- 仍需在新 v1.2 manifest 上按有界批次获取真实 baseline/candidate provider 终态，覆盖九面；真实 provider 仍按 `/Users/Hugh/.config/workflowhub/config.json` 配置数量执行，不动态减少。
- 真实 A/B、当前 verify、finding 处置、逐 AC、例外和人工确认未因此完成；当前任务不 close、不 commit、不 merge、不 push、不 cleanup。

## 当前候选实现聚焦回归（append-only，2026-08-15）

- 候选工作树按当前 review/failure/mini-task/close 入口重新执行聚焦回归，命令包含 review-provider-client-v3、review-runner、simple-e2e-faults、mini-task delivery/resume、official stage run、freshness matrix、official receipts、stage review cost policy 和 workflow quality regression。
- 结果：`10` 个测试文件、`135 passed / 0 failed`，总耗时约 `175.74s`；没有真实 provider 调用。review-runner、mini-task、official receipt 和 vNext stage 都通过。
- 这证明当前候选实现的确定性边界没有被本轮评测器修正破坏；不证明九面真实异源审查质量提升，也不覆盖当前缺失的 finding disposition、逐 AC、例外和人工确认。

## 评测分批执行与完整覆盖标记（append-only，2026-08-15）

- 全量 `252` 条 leg 不再必须放进一个长寿命进程；runner 允许按 surface/case 分批执行，同一 output root 保留已有终态，不重跑 completed、failed、timed_out 或 ambiguous。
- `run-summary.json` 现在同时记录 manifest 总 leg 数、当前批次选中数量、累计终态数量和 `coverage_complete`。只有全部计划 leg 都有终态时，compare 才允许把 execution scope 标为 complete；中途批次、`--limit` 截断和旧不完整 run 都保持 incomplete。
- 这样可以控制单次 provider 消耗和卡死影响范围，同时不降低配置 reviewer 数量、不删除失败分母，也不把分批结果冒充完整九面 A/B。
- 新增 runner/compare 回归后，ModelTest 该组 `13 passed / 0 failed`；没有真实 provider 调用。

## 真实 provider 小批次对照与控制样本复盘（append-only，2026-08-15）

### 原始需求

- 用户要求把审查质量、成本、耗时和失败分开看；不能因为一个总分没有到 80 就无限继续优化，也不能把审查发现真实缺口误判成误报。

### 关键事实

- 修复 TaskHandle 隔离后，第一次真实小批次 `make-decision.direction / clean-control` 已经能跑通 provider；旧的“改 task_id 放到 source task 旁边”的隔离方式会破坏 WorkflowHub 的确定性 Workspace 绑定，已改为“保留原 project/task 身份，只隔离临时 Projects storage root”。ModelTest 定向回归仍为 `12 passed / 0 failed`。
- `/tmp/wh-review-benchmark-v19.eOv7v3` 是“材料写全但 direction 选择仍不合理”的旧控制批次：4/4 leg completed；baseline 两条约 `8.2K` token、`72.4s/88.6s`，各自只有一个异源 provider 完成；candidate 两条约 `52.3K/44.0K` token、`337.7s/321.1s`，均做了两轮 direction review。这个批次不能用于质量结论，因为 provider 在 clean-control 中发现了真实方向和边界问题。
- `/tmp/wh-review-benchmark-v20.HAXhU5` 是修正了状态、幂等、超时、迟到结果、回滚和真实产品选择后的最新控制批次：baseline `2/2 completed`，约 `8.2K` token、`72.4s/88.6s`，每条 3～4 个 finding；candidate `1 completed + 1 unavailable`，完成腿约 `53.9K` token、`216.1s`，失败腿约 `29.2K` token、`147.8s`，provider group 因一个成员失败保持 `PROVIDER_GROUP_PARTIAL`。本批次总计划仍为 `252` 条，只执行了 4 条，`coverage_complete=false`。
- v20 控制样本中，baseline 仍指出“冲突输入定义、回滚快照对象边界、超时后的迟到写入和回滚失败路径”没有闭合；candidate 还指出“有效输入、正确结果、旧尝试与重试归属、部分写入是否真实存在”等问题。说明当前 gold-clean acceptance 只验收“材料字段齐全”，还没有验收“内容真的没有交付级歧义”。它仍不能进入误报率分母。
- 因此目前没有任何一个新 v1.2 surface 产生可发布的完整质量提升结论；当前真实证据只能说明：候选 direction 触发了更高 review 轮次和更高 token/时间成本，并暴露了 provider 部分失败，不等于质量变差，也不等于质量提升。

### 当前选择

- 不把 v19/v20 的 `clean-control` 强行标成干净，不把 provider 的这些 finding 改成 false positive，不用“质量未达 80”推动继续重跑。
- v1.2 继续保留 `gold_clean`、`unlabeled_control`、严重召回、执行率、失败、token 和 duration 分开报告；在真正通过语义干净验收前，delivery-quality 保持 `null/inconclusive`。
- 真实 provider 执行改为有界批次；当前只完成 direction control pilot，不继续消耗其余 248 条 leg，直到 control oracle 的语义边界先被独立验收。
- benchmark attempt 现在同时保留 `provider_failures` 和失败 code，避免只留下成功 provider 结果而看不见失败成员。

### 理由

- 当前最重要的根因不是“80 分太低”，而是两层测试数据问题叠加：一是旧 control 不是干净样本；二是 direction control 的选择曾把“审查机制调整”冒充产品方向。若继续跑全量，只会用更多 token 证明控制样本不干净，并把 provider 不稳定混进质量分数。
- v20 的真实结果证明审查并没有只检查材料形式：provider 集中发现了超时、迟到结果、状态归属、回滚和重试等会直接影响用户结果的边界。这些 finding 应保留，不能为了得到高分而削弱审查角度。
- 候选真实 direction 审查约 `216s/53.9K token`，baseline 约 `72～89s/8.2K token`；差异主要来自候选 direction 的两轮盲重建 + challenge 和四个配置 provider 组调用。该成本差异应作为 review policy 成本事实，不应被单一质量分掩盖。

### 延期交接

- 需要重新设计并由独立来源验收九个 surface 的语义干净 control；仅写完整字段和 acceptance ref 不够。验收必须明确：control 上的交付级 finding 是否确实为零，若不为零就只能做 unlabeled diagnostic。
- 需要在 control 合格后，再按 surface 做 mutation-1～5 的有界 baseline/candidate 对照；在此之前不报告全量 delivery-quality，不把当前 pilot 外推到其他 stage。
- 当前 verify、finding 处置、逐 AC、例外、人工确认仍未完成；当前任务继续不 close、不 commit、不 merge、不 push、不 cleanup。

## 当前审查成本修复（append-only，2026-08-15）

### 关键事实

- 独立成本审计确认主要浪费来自材料重复、provider 读取规则矛盾、near-cap diff 分流、diff 重复解析、selected context 重复交付，以及 broker 内部重试没有完整进入成本事实；不是 reviewer 数量本身。
- build-plan 的 `planning_artifacts` 是给 stage 内 `spec-analyze` 使用的生成投影，原始需求、spec、AC、plan、tasks 已经作为 provider 材料单独提供；再次发送完整投影没有增加审查角度。
- `build-code` phase 的 authority maps 目前仍是可选材料，这是现有合同和回归明确选择的“缺失不阻止 provider”边界；本轮不把它改成新的材料 gate，避免用证据治理阻断交付。

### 当前选择与改动

- provider 提示词现在明确要求读取 manifest 中的 required 材料、声明的合同和 reviewer lens，以及 map 选中的 context；不再出现“合同要求读取但 manifest 分类不允许读取”的矛盾。
- build-plan 仍生成并保留 `requirements/planning_artifacts.json`，但从 provider delivery manifest 排除，减少同一语义的第二份传输；packet-plan 记录排除原因。
- 大 diff 的 inline 分流阈值从 `320 KiB` 收窄为 `288 KiB`，最终交付上限统一使用 `330 KiB`；同时不再为已经由 included diff shard 覆盖的 anchor 重复写 provider-visible context。
- `diffSections` 在一次 packet 构建中只解析一次；review cost summary 新增 outer、provider-internal、fresh-execution、same-session 四类 retry 事实，缺失 usage 仍保持 unknown。

### 验证

- `review-runner.test.mjs`、`review-materials-contract.test.mjs`、`review-provider-client-v3.test.mjs`：`59/59 passed`。
- 新回归覆盖：planning projection 不进入 provider 包、合同/审查角度可读、broker recovery counters 不丢失；没有调用真实 provider，也没有改变配置 reviewer 数量或审查角度。

### 延期交接

- 仍需在当前候选快照上做一次 `verify-code` 独立 provider 审查；只做一次，失败保留 unavailable，不机械重试。
- 九面 A/B 仍为 `inconclusive`，不为补齐 80 分或制造 clean control 继续消耗 provider。
- 正式 verify、finding 处置、逐 AC、例外、人工确认仍未完成；不 close、不 commit、不 merge、不 push、不 cleanup。

## 当前审查成本根因与安全压缩（append-only，2026-08-15）

### 关键事实

- 普通 review surface 每次只发起一个 `runGroup()`；`verify-code` 固定一次，`build-code` 只有真实修复或主题变化后才允许一次 focused review。
- `make-decision.direction` 为了保持“先盲重建、再挑战当前选择”，一次逻辑审查固定发两个 public request。当前配置有两个 reviewer，所以一次 direction 会实际执行四个 provider member request；这不是评分低导致的重试。
- 当前配置 reviewer 数量仍严格按 `/Users/Hugh/.config/workflowhub/config.json` 执行。本次不采用“默认只跑一个 reviewer、风险时再加”的动态降级，因为它违反 D-003。
- 当前 provider-visible packet 的大头不是材料治理字段，而是 direction 的第二轮重复静态合同/基础材料、provider 自己的高 effort 配置，以及 finding 重复描述造成的输出膨胀。`usage=null` 仍保持 unknown，不能从 packet bytes 推算 token。

### 当前选择

- 保留 direction 的两轮异源对抗结构，不把两轮压成一次，也不减少配置中的 reviewer 数量；否则会失去“当前选择只在盲重建之后揭示”的质量保护。
- 收紧所有 stage 的输出提示：同一根因合并，禁止重复描述 provider/packet/snapshot/receipt/流程，finding 只保留最小 issue、root cause、修正建议和一到两句证据；不限制真正独立的高风险 finding 数量。
- 这次压缩只减少无效输出，不删原始需求、用户流程、状态、失败边界、实现 diff、AC 或直接消费者；因此不降低审查角度，也不改变 reviewer 选择规则。
- P6 当前目标回归已重新执行并通过 `156/156`；本次只证明 finding/close/freshness 的确定性边界，不能补齐正式 verify 事实。

### 理由

- 成本控制必须先删重复推理和重复文本，不能删掉关键语义输入，也不能用动态少跑 reviewer 的方式制造便宜但不可靠的结果。
- direction 的四次 member 执行是设计选择的直接成本，应单独报告；不能把它伪装成 provider 失败重试，也不能因为它贵就把盲审和挑战合并。

### 延期交接

- 还需要用真实 provider usage/timing 复测输出压缩后的成本变化；没有真实 usage 的运行仍记 `unavailable/unknown`。
- 九面 A/B 仍是 `inconclusive`；本次不重新跑被判定为不干净的 control，也不把新 prompt 的局部回归写成质量提升。
- 当前正式 verify、finding 处置、逐 AC、例外和人工确认仍未完成；不 close、不 commit、不 merge、不 push、不 cleanup。

## 当前候选包闭环复核（append-only，2026-08-15）

- 最新候选重新执行 `npm run check`，markdownlint、结构验收、仓库合同检查、skill closure 和 5 阶段本地 skill package smoke 全部通过，exit 0。
- 这次只是修正提示词改动后的 `wh-review` bundle 文件 hash 与 catalog `local_bundle_hash`，并确认包闭环恢复；不改变 reviewer 数量、审查材料范围、审查角度或 ModelTest 结论。
- 当前快照 tree 为 `87e3ff523d9b459ea154000d23c2c3c60c92ded2`，证据为 `quality/evidence/workflowhub-candidate-check-20260815.json`。当前质量对照仍为 `inconclusive`，正式 verify、finding 处置、逐 AC、例外和人工确认仍未完成。

## 当前候选全量确定性回归（append-only，2026-08-15）

- 当前候选工作树重新执行 `npm test`：safe suite `161` 个测试文件、`1528 passed / 1 skipped`；exclusive suite `31 passed / 0 failed`；总失败数 `0`。
- 当前快照：head `249e2cd7ff84756fb9509d0716f013b5a94a75e8`，tree `0f9a05f321efa9cd5ea06e78bf6f50505487657f`，snapshot commit `40fb14f7e358d6b2bbf2bb14095b03c73478a717`，source digest `b59983b74d7669e19e0af9571cd4fa4be460f929e27bad900160491df5456dd4`。
- 这次只证明 WorkflowHub 本地确定性边界、mini-task、材料只写复用、P5 语义复用、finding/close 谓词和五阶段回归通过；不证明真实 provider 质量提升，不补写当前 `quality/verify.json` 缺失的独立审查、逐 AC、例外和人工确认，也不把 ModelTest `inconclusive` 改写成通过。
- 诊断事实已保存：`quality/evidence/workflowhub-candidate-full-test-20260815.json`。

## benchmark 默认控制样本纠偏（append-only，2026-08-15）

- 发现评测计划脚本虽然支持 `unlabeled_control`，但默认仍给每个 `clean-control` 写入 `gold_clean`；这会让“材料看起来完整但尚未经过独立语义验收”的控制样本误进入质量分母。
- 已修正 ModelTest 计划：默认 clean-control 只生成 `unlabeled_control`；只有显式传入 `--gold-clean-control=true`，并且已有独立语义验收时，才生成 `gold_clean` 引用。
- 新默认计划实测生成 `252` 条 leg、`42` 条 clean-control，全部状态为 `unlabeled_control`；没有 provider 调用。
- ModelTest 相关回归 `17 passed / 0 failed`，bundle 校验仍为 9 个 surface、45 个 mutation 通过。
- 这次修复只改变评测计划的默认标记，不修改历史 v19/v20/v21 attempt，不把历史控制样本重新评分成别的事实。

## v21 真实 direction 控制样本复盘：停止追求“零 finding”（append-only，2026-08-15）

### 原始需求

- 必须把审查质量、审查成本、审查稳定性和评测数据问题分开；不能因为一个总分没有到 80 就无限重跑，也不能为了让控制样本变干净而压低真正有价值的 finding。

### 关键事实

- 已把 control 简化成“单条文本备注保存”：没有外部 provider、批量写入、撤销或多对象回滚，只保留输入校验、原子保存、失败重试、30 秒超时和刷新读回。
- v21 真实 provider 小批次仍然发现了交付级边界问题：操作 ID 的生成/复用、失败后修改内容如何重新保存、超时后服务端可能已写入时怎样收敛、刷新读回失败、并发冲突、唯一性范围、字符计数和冲突时用户行为。这些都能直接影响用户是否能可靠保存，不能标成 false positive。
- v21 只跑 `make-decision.direction / clean-control` 的 4 条 leg，计划总数 `252`，终态 `4`，`coverage_complete=false`；没有开始其余 248 条。
- baseline 两条均完成：`47.225s / 8,204 tokens`、`72.769s / 8,198 tokens`，每条由配置允许的异源 provider 返回 5 个 findings。
- candidate 两条均完成：`338.463s / 45,266 tokens`、`343.468s / 42,355 tokens`，四次 provider group call 覆盖两轮 blind reconstruction + reveal challenge；返回 2～3 个 provider 级 findings，主要集中在同一批真实边界。
- 因此 v21 仍不能证明 control 是 gold-clean，也不能计算 delivery-quality；它已经足以证明“继续把 control 做到零 finding”会把真实交付缺口误删，并继续消耗大量时间和 token。

### 当前选择

- 当前 v21 作为 `unlabeled_control` 诊断事实保留，不进入 false-positive 或 delivery-quality 分母；不再为这个 control 继续调用 provider。
- v1.2 评分器继续禁止固定 `80` 分门槛：没有独立、语义级 gold-clean 验收时，delivery-quality 记为 `null/inconclusive`；仍单独报告召回、finding rate、执行率、失败、token 和时长。
- 真实对比以“有效 finding 是否命中、是否有误报、provider 是否完成、成本是否可接受”四条线并列看，不用一个总分决定是否继续工作。
- direction 的两轮设计保留，因为它确实增加了方向攻击角度；但它的真实成本必须显式展示：本 pilot 相对 baseline 约 `+410%～+452% token`、`+366%～+616% 时长`。这属于 review policy 的成本事实，不是质量分不够。

### 理由

- v21 说明问题已经从“控制样本写得不完整”转成“真实需求本身仍有可审查的可靠性边界”。审查发现这些问题正是异源审查的价值，不应为了制造高分而删掉。
- 继续全量跑九面只会扩大 provider 成本，却不能在当前 control 下产生可信质量结论；应该先用现有 pilot 对照看差异，等待真正独立验收的语义干净 control，而不是继续自我循环。

### 证据

- 可读汇总：`quality/evidence/wh-review-benchmark-readable-comparison-v1.2.json`。
- 原始历史重算：`quality/evidence/wh-review-benchmark-rescore-v1.1-20260815.json`、`quality/evidence/wh-review-benchmark-comparison-v1.2-20260815.json`。
- v21 原始运行目录：`/tmp/wh-review-benchmark-v21.H3oWvw/`；该目录是临时 provider 运行事实，未冒充完整九面正式 A/B。

## direction 请求语义与 single_round 合同对齐（append-only，2026-08-15）

- 发现合同文字把 `make-decision` 的 `single_round` 容易读成“只能发一个 broker request”，但当前 D-009 实际要求 direction 先盲重建、再揭示选择挑战，两个短请求合成一个逻辑 review fact。
- 已把合同改成明确口径：`single_round` 只表示一个逻辑 fact 完成后不自动追求空 findings；direction 固定两次短请求，detail 固定一次，不允许后续机械复审。
- 定向回归 `simple-contracts + review-runner` 为 `55/55 passed`；`npm run check`、skill closure 和 5 阶段 skill smoke 继续通过。
- 这次只消除合同歧义和错误重试风险，不减少配置 reviewer、不删关键审查材料、不改变 direction 对抗角度。

### 延期交接

- 不再把“达到 80 分”作为继续优化或 close 条件；当前候选实现的确定性测试、成本口径和复用规则可以单独验收。
- 九面完整 A/B 仍是 `inconclusive`，原因是没有真正语义干净 control、旧 stage 的有效 paired run 不足，不能把“没有结论”写成“质量没达标”。
- 当前 verify、finding 处置、逐 AC、例外、人工确认仍未完成；当前任务继续不 close、不 commit、不 merge、不 push、不 cleanup。

## 当前 verify-code 异源审查与评分结论（append-only，2026-08-15）

### 事实

- 当前候选快照：`d8945c0ade6fd5af1a2302f167fb1ba8eb6c7601`；source digest：`a2d4ae9863d320764aa4821ad429ce14a2a7fbd07c6603ef712eb1845a6c9370`。
- 第一次调用 `verify-code` 使用了错误宿主标识 `workflowhub`，broker 返回 `REQUEST_INVALID`，没有调用 provider；该事实保留为调用参数错误，不纳入审查质量评价。
- 修正宿主标识后，当前快照只做了一次有效异源审查：`opencode/v4flash` 和 `codex/luna` 均终态完成，均无 provider 重试；attempt：`quality/reviews/attempts/c10d8591-23b2-486d-96ff-d5ee5454731e/attempt.json`，result：`quality/reviews/results/verify-code-default-d8945c0ade6fd5af1a2302f167fb1ba8eb6c7601-c10d8591-23b2-486d-96ff-d5ee5454731e.json`，report：`quality/reviews/reports/c10d8591-23b2-486d-96ff-d5ee5454731e.md`。
- 有效审查合并出 4 条 actionable finding：当前 verify 验收事实未闭合；T010 没有 gold-clean paired A/B 和同一 subject 的 provider 成本对照；AC-01..AC-26 缺少独立的当前实现锚点、测试断言和实际结果；finding disposition、例外和人工确认没有绑定当前快照。
- 使用官方 `publishVerifySummary()` 重新写入 `quality/verify.json`，状态保持 `incomplete`，并绑定当前 snapshot、当前 review、测试摘要和缺口；没有把 provider findings 改成通过。

### 对 80 分问题的裁决

- 不是“所有测试因为低于 80 分而一直继续优化”。当前评测已经去掉固定 `quality >= 80` 继续门槛；质量、召回、误报、执行成功率、token、时长、失败数和 paired 完整性分开记录。
- 历史 80 分附近的数字不能直接当结论：旧 control 没有独立 gold-clean 验收，部分 stage 没有有效 paired review，所以当前总评是 `inconclusive`，不是“低于 80”。
- 真正导致本轮不能收口的是当前交付事实和评测对照不完整，以及有效异源审查明确找到了上述交付风险；不是单一评分线。

### 当前所有 stage 的对比摘要

完整原始对比见：`quality/evidence/wh-review-benchmark-readable-comparison-v1.2.json` 和 `quality/evidence/wh-review-benchmark-comparison-v1.2-20260815.json`。结论如下：

- `make-decision.direction`：召回 `0.80 -> 0.8947`，但 token `8200 -> 16521.5`，时长 `87.2s -> 335.3s`；旧 control 不干净，质量提升不能确认。
- `make-decision.detail`：召回 `0.90 -> 1.00`，token 基本不变，时长 `77.3s -> 164.4s`；旧 control 不干净，质量提升不能确认。
- `build-spec`：旧质量数 `80 -> 80`，召回和执行率不变，token 基本不变，时长 `62.9s -> 166.3s`；没有质量提升证据。
- `build-plan`：没有有效 paired review；只能看到 token `8198 -> 8196`，时长 `49.6s -> 152.8s`，不能判断质量。
- `build-code.phase`：没有有效 paired review，不能判断质量和成本。
- `build-code.integration`：没有有效 paired review，不能判断质量和成本。
- `verify-code`：历史没有有效 paired A/B；本次当前快照的真实 review 证明审查可以稳定返回 findings，但没有证明 A/B 质量提升。
- `mini_task.design`：只有 candidate，没有 baseline；candidate 质量数 `74.86` 不能证明提升。
- `mini_task.implementation`：没有有效 paired review，不能判断质量。

### v21 direction pilot 的真实含义

- 方向 pilot 只完成 `4/252` 个终态，control 没有被标记为 gold-clean，不能计算 delivery-quality。
- baseline 每次约 `8.2k` token、`47–73s`；candidate 两个 provider 约 `42–45k` token、`338–343s`。candidate 找到 operation id 生命周期、失败后修改、超时已写入、刷新读回、并发冲突、唯一性范围、字符计数等真实交付边界。
- 这些 findings 不是应该被压成零的误报；继续用“零 finding”或“80 分”作为目标会损害异源审查。后续应以 finding 是否命中真实交付风险、是否可复核、成本是否可接受分别判断。

### 本轮选择

- 保留有效 review 和所有 findings；不重试、不追求空 findings、不把历史结果绑定到当前快照。
- 保持 verify `incomplete`，等待真实 finding 处置、逐 AC 当前事实、例外和人工确认；T010 gold-clean A/B 作为评测结论，不作为日常 stage 继续工作的硬门槛。

## 当前验收事实链根因修复（append-only，2026-08-15）

### 原始问题

- 当前 `spec.md` 实际有 AC-01..AC-32，但旧的外部验收摘要只有 AC-01..AC-26，而且每条内容高度相似；旧摘要不能代表当前任务的 32 条验收事实。
- `ac-evidence-summary.mjs` 以前会把没有真实实际结果的 leaf 默认成 `actual_outcome=result`，并且只把场景、判定、结果摘要传给 provider，丢掉实现锚点和测试锚点。
- 因此“有 AC ID、有 leaf、有测试收据”容易被误看成“每条 AC 已被独立验证”，这正是 verify-code 本轮 finding 的根因，不是分数不够。

### 已处理

- 现有 `acceptance-evidence.v1` 的 `summary` 允许并校验 `implementation_anchor`、`verification_anchor`；锚点只能是当前包内相对路径、行区间和角色，拒绝主机绝对路径。
- provider-facing AC summary 继续复用现有四材料和证据引用，不新增第五份材料；现在没有真实实际结果、实现锚点或测试/断言锚点时只能写 `unknown/incomplete`，不能默认写 `pass`。
- 多条 AC 共用实现锚点、测试锚点或嵌套证据时，全部降为 `unknown/incomplete`；只有每条 AC 的场景、判定、实际结果和两类独立锚点齐全时，才可以保留 `pass` 事实。
- verify-code 合同补明：`verification_anchor` 必须指向真实测试/断言；provider 只审交付风险，不做材料考古，也不因缺事实触发重复 provider 调用。
- 更新 `wh-review` bundle entry 和 catalog hash，避免本地技能与发布闭包不一致。

### 当前验证

- `ac-evidence-summary`：8/8 passed。
- `review-materials-contract`：13/13 passed；与本改动相关的 malformed packet 仍在 provider 前拒绝。
- `official-component-receipts`：32/32 passed；新增了锚点结构和主机路径拒绝测试。
- 3 个测试文件组合执行曾因 `vnext-five-stage-current` 超过 30 秒而中止；之后独立跑 `official-component-receipts` 已通过，`vnext-five-stage-current` 的 30 秒 bounded run exit 124，不能宣称全量通过。

### 当前选择

- 保持 verify `incomplete`，不把这轮代码修复写成当前任务已验收；还需要把当前 AC-01..AC-32 重新生成成有真实实现/测试/结果锚点的证据，逐条处理 4 条 finding，并补例外和人工确认。
- 不启动新的 mini-task；这次属于主任务验收事实链修复，已有 T005/T006 也不是独立 mini-task。
- 不新增评分门槛、不新增 stage、不新增材料、不把 `unknown/incomplete` 变成同 task 修复门禁。

## 当前旧 AC 摘要阻断与 e2e 诊断（append-only，2026-08-15）

### 新发现

- 仅检查“文本里出现 AC 编号”还不够。旧的 AC-01..AC-26 摘要即使格式正确，也可能被送进当前有 AC-01..AC-32 的任务。
- 因此现有 verify material preflight 现在会从当前 task 的 `spec.md` 读取 AC 集合；如果 provider packet 的 AC 集合和当前 spec 不一致，会在 provider 调用前返回 `MATERIAL_INCOMPLETE`。
- 这仍然只是审查材料完整性检查，不是质量分数门槛，也不阻止同 task 修复。

### 已处理

- `validateVerifyAcceptanceSummary()` 支持传入当前 spec AC 集合并做精确集合比较。
- `buildReviewMaterials()` 在 `verify-code` 路径自动读取当前 `spec.md`，拒绝旧 AC 摘要。
- 增加回归：26 条旧 AC 对 32 条当前 AC 被拒绝；32 条完整 AC 可以继续进入材料构建。
- 更新 wh-review bundle 和 catalog hash。

### 当前 e2e 事实

- 静态检查、review runner、材料合同、官方 receipt 和 vNext official stage 回归已通过。
- `tests/e2e/vnext-five-stage-current.test.mjs` 的 bounded run 曾在 30 秒内超时；这不是通过，也不是 provider 失败。正在继续定位具体测试或子进程边界。

### 当前选择

- 不用旧 AC-01..AC-26 证据更新 `quality/verify.json`；它只能只读保留。
- 先补当前 AC-01..AC-32 的真实证据绑定，再判断是否需要一次当前快照的 focused provider review；不机械重跑旧 review。

## 当前 T018 审查根因修复与成本复测（append-only，2026-08-15）

### 根因与处理

- 空 acceptance coverage 不再因 `every([])` 被误判为 covered；verify item pass 不能绕过当前 AC 集合校验。
- AC proof anchor 现在要求明确的 `implementation` / `verification` 角色；不同 AC 共用或重叠物理范围时降为 `unknown/incomplete`；acceptance map 要求两类 anchor ID 都存在。
- 缺少 source identity 的 review 结果不可用；quorum 按不同 adapter 计算；同一 source 不能凑异源 quorum；配置中的 reviewer 仍全部按配置执行。
- 混合材料使用一次 broker group request；group 失败只记一条 group fact；direction 的盲重建和揭示后 challenge 两轮仍保留。
- 官方 stage 复用已认证的入口 snapshot，结束时仍重新捕获 snapshot 做 drift 检查，避免同一 stage 内无意义的重复读取。

### 当前验证事实

- 定向审查与验收回归 `105/105 passed`；官方 stage 回归 `74/74 passed`；五阶段 e2e `18/18 passed`，约 `102.5s`。
- 之前同一五阶段 e2e 约 `125.6s`；本地运行时间减少约 `23.4s`、`18.6%`。这只是确定性运行成本改善，不是 provider 质量 A/B 证明。
- `npm run check`、skill closure、5 阶段 skill smoke 和 `git diff --check` 通过。
- 本轮没有调用新的 provider，也没有新增 mini-task；改动属于主任务的审查链和验收事实链修复。

### 当前裁决与延期

- 不存在固定质量 `80` 分继续门槛；T010 九面 paired A/B 仍因 control 不干净和有效 paired 不足而 `inconclusive`。
- 当前正式 verify、逐条 finding disposition、逐 AC 当前事实、例外和人工确认仍不完整；不能 close，也不能把本地测试绿灯写成质量提升。
- 旧 AC-01..AC-26 摘要、旧 snapshot 和旧 review 只读保留；不能绑定到当前 AC-01..AC-32，也不触发机械重审。

## 当前 T019 验收发布与重复校验根因修复（append-only，2026-08-15）

### 新发现与处理

- `verify` 叶子校验器原来只接受 `evidence/` 和 `quality/evidence/` 的嵌套引用；当前合法的 `quality/tests/` 回归事实被误判为不完整。现在三类合法引用都能通过校验。
- 叶子第一次校验因共享锚点被降为 `incomplete` 后，再交给发布器二次校验会被误报为状态不匹配。现在校验结果可重复使用，二次校验不会制造无效重试。
- 上述两处都是审查/验收基础设施误报，不是“质量分数低”；它们会直接增加失败、重试和耗时。

### 当前绑定事实

- 当前候选快照：tree `c464b4d2495b8155b102d4b8ebf121fd2becf951`，source digest `541403ddda437cb4284025b9e921bc99bd4a88656a2a8fb28f2287fb390139de`。
- 当前确定性回归：13 个文件、247 个测试通过；五阶段 e2e 18/18 通过，实际约 `95.95s`。
- 当前 `quality/verify.json` 已重新绑定当前快照和 AC-01..AC-32：17 条 `passed`、9 条 `failed`、6 条 `incomplete`。后 15 条不是 provider 质量结论，而是当前验收事实仍不足/未闭合的记录；总状态仍 `incomplete`。
- 当前 finding dispositions 和 exceptions 已重新绑定到当前快照；当前独立 provider review、可信 T010 paired A/B 和人工确认仍未完成。
- `tools/architecture/verify-final-coverage.mjs` 仍对旧 coverage artifact 报 tree/hash 不匹配，并提示 AC-16..AC-32 缺少直接覆盖；这证明正式覆盖报告仍未闭合，不能用 247 个确定性测试替代。

### 当前选择与边界

- 不把确定性回归绿灯写成 provider 质量提升；不把 `failed` 的证据不足误说成代码失败；不以 80 分作为继续或 close 门槛。
- 不新增 mini-task；这是主任务的验收/审查基础设施修复。
- 旧快照和旧审查只读保留，不重跑没有新价值的旧 provider 审查；只有在当前事实链稳定后，才允许做一次当前快照的独立审查。
- 任务继续保持 `incomplete`，不执行 close、commit、merge、push 或 cleanup。

## 当前 T020 评分口径与当前快照审查（append-only，2026-08-15）

### 评分裁决

- 当前没有“低于 80 分就一直继续”的生产门槛。`fixed_quality_80_gate=false`；80 分只出现在历史 ModelTest 比较阈值中，不是 WorkflowHub 的 stage 完成条件。
- 确定性回归是 `247/247` 加五阶段 e2e `18/18`，它证明合同和实现行为，不证明异源 provider 质量提升。
- 历史九面比较全部保持 `inconclusive`：主要原因是没有独立验收的 gold-clean control，或没有至少四条有效 paired review；不是因为质量分数低于 80。
- `quality/verify.json` 的 `17 passed、9 failed、6 incomplete` 是逐条验收事实状态；其中 failed/incomplete 多数表示证据不足、外部对照缺失或人工确认缺失，不应读成“代码总分不及格”。

### 当前唯一有新价值的 verify-code 审查

- 当前执行快照：tree `ca6e790b8f6e776623d1db0ea1a19069de7347e8`；source digest `1377d78ea424e4694824d6922bf1702812b7f22f6b2745548dc4f7c17fc98cb7`。
- 真实调用配置中的两个异源 provider：`opencode/v4flash`、`codex/luna`；`2/2` terminal、`0` provider retry、`6` 条 actionable findings，其中 `2 blocking、4 major`。
- 当前 finding 不是材料格式挑刺，集中在：15 条 AC 没有独立验证事实、T010 没有可信 paired A/B、当前 finding 缺少用户风险确认、实现评估缺少可复核锚点、正式验收仍 incomplete。
- provider 包是紧凑的当前 verify 材料，约 `38 KB`；本次实际 provider wall time 约 `168 秒`，已记录 provider usage（`opencode/v4flash` 为 `24,375 tokens`，`codex/luna` usage unavailable）。没有自动重试。
- 当前 review 已写入 `quality/verify.json` 的 `independent_review`，并生成 current-v5 finding dispositions / exceptions；总状态仍 `incomplete`，没有把 findings 或 review 成功写成通过。

### 额外发现：不是质量分数，是 final 绑定过严

- 对同一个当前 execution snapshot 执行官方 `verify-final` 时，返回 `WORKTREE_CHANGED_AFTER_REVIEW`：候选 tree、base tree 和 captured head 相同，但 review 记录中的 `target_commit` 与当前 target repo HEAD 不同。
- 这说明 target repo HEAD 的无关变化会使同一候选快照无法 final；它会制造重复审查和额外耗时。后续应把 final freshness 绑定到真正被审查的候选 snapshot/base subject，不要让无关 target HEAD 变化单独触发重审；本次不把该失败伪造成通过。

### 当前选择

- 不再追逐 80 分，也不追逐零 finding；按 finding 的真实交付风险、当前快照和用户确认处理。
- 历史 review、benchmark、失败和 unavailable 事实继续只读保留；不重跑同一 snapshot/material。
- 当前任务继续保持 `incomplete`，不执行 close、commit、merge、push 或 cleanup。

## 当前 T023 根因修复的决策记录（append-only，2026-08-15）

### 原始需求

用户要确认审查质量是否真的提升，并要求把评分、成本、失败和重复审查原因分开说明；审查要提高交付质量，不要把材料快照治理误当成质量本身。

### 关键事实

- 历史 80 分只是 ModelTest 比较阈值，生产流程没有固定 80 分继续门槛；当前九面对照仍因 control/paired 覆盖不足保持 `inconclusive`。
- 当前代码曾存在真实根因：调用方可伪造写边界身份、malformed provider 成员被静默过滤、quorum 变化仍复用旧结果、报告混淆 configured/observed、runtime 反向依赖 skill、mini-task provider 结果未完成认证。
- 修复后真实 `npm test` 为 162 文件、1607 passed、1 skipped，exclusive 31/31；公开 CLI 10/10；`npm run check` 通过。

### 选择与理由

- 选择分开记录召回、误报、provider terminal、coverage、token、时长和证据完整性，不再计算一个总分决定继续或 close；理由是单一总分会把质量、成本和 provider 失败混在一起。
- 选择“配置了几个 provider 就调用几个”，但异源 quorum 只按不同 adapter 计数；理由是保留用户配置和 attribution，同时避免同一 adapter 被误当成异源证据。
- 选择只对同一材料、同一语义快照复用 review；纯 `tasks.md` 执行状态区写回可以复用，decision/spec/plan 或 tasks 语义变化必须重新审查；理由是同时避免 build-code 的无效重复审查和真实需求变化后的旧结论误用。
- 选择把 skill 入口锚点由 skill 包装层传给 runtime；理由是满足 provider 可读实际入口，又不破坏 runtime → skill 的分层规则。

### 延期交接

- T010 九面可信 paired A/B、当前 AC 独立事实、完整 finding 处置、例外和人工确认继续保留为 `incomplete`，不伪造通过。
- 本轮文档写回后只做一次新的当前快照异源审查；若没有新的严重 finding，不再因历史分数或旧 finding 数量继续循环。
- 本轮没有新产品需求，不创建新的 mini-task；mini-task 相关改动属于当前主任务的审查链修复。

## 当前 T021 质量对比与继续条件（append-only，2026-08-15）

### 原始问题

用户要求确认：是否因为质量低于 80 分才一直优化；所有 stage 的审查对比是否真的变好；并要求把审查质量、成本和失败原因说清楚。

### 关键事实

- 当前评测文件明确记录 `fixed_quality_80_gate=false`。生产流程没有“低于 80 分就继续”的门槛。
- 当前 v1.2 的 9 个 surface 全部 `inconclusive`。原因是 gold-clean control 不足、paired 不完整或只有 candidate，不是分数低。
- 历史 nominal 结果只有方向/detail 的召回上升：direction `0.80→0.895`、detail `0.90→1.00`；但成本明显变高。build-spec 没有质量提升；其他面没有有效 paired。
- v21 direction pilot 只有 4/252 条终态，control 也没有标记为 gold-clean；它能说明审查发现了真实交付风险，不能给出质量分。
- 最后一次真实 build-code integration review 使用配置中的 3 个 provider，3/3 terminal、0 retry、约 291 秒，已知 token `459,104`；aggregate 6 条 finding，其中 5 条 major、1 条 minor。AC-19/20 的两条 major 属同一“评测证据缺失”根因。
- 该 review 还发现旧快照规则会把 spec、decision-log、plan 和 tasks 的所有改动都当成可复用材料变化，可能让旧 review 继续使用。现已收窄为：只有 `tasks.md` 执行状态区写回可以复用；语义改动必须重新验证。
- 修复后的定向回归 `55/55 passed`；`npm run check`、skill closure、`git diff --check` 均通过。最后一次 provider review 发生在该快照复用修复前，所以不能当作修复后最终异源结论。

### 当前选择

- 不再用 80 分或零 finding 驱动继续；以真实 finding、当前材料绑定、成本和可回读证据裁决。
- 不为证明“分数变高”机械重跑旧审查；当前可证明的是：审查链发现了真实代码缺陷，修复后确定性回归通过，但完整 A/B 质量提升尚未被证明。
- AC-19/20 九面真实评测、public runtime live probe、逐 AC 独立证据和人工确认继续标为未完成；不把本地测试收据或通用 receipt 冒充这些事实。
- 当前任务继续保持 `incomplete`，等待剩余事实和人工确认；不执行 close、commit、merge、push 或 cleanup。

## 当前评分与审查对比裁决（2026-08-15，append-only）

### 原始问题

用户要求确认：是否因为审查质量低于 80 分才一直继续优化；评分标准是否有问题；所有 stage 的修改前后审查质量、成本和失败情况是否真的改善。

### 原始需求与关键事实

- 目标是用异源审查提高 WorkflowHub 交付质量，不是用 wh-review 做材料、快照、流程考古。
- 必须同时看审查质量、token、时长、provider 失败/重试、材料范围、逐 AC 事实和人工确认；不能用单一分数替代这些事实。
- 当前评测报告 `wh-review-benchmark-report-v1.2-20260815.json` 明确写入 `fixed_quality_80_gate=false`，9 个 surface 全部 `inconclusive`，没有 composite score 和 global rank。
- 历史 A/B 的主要缺陷是 control 未被独立标记为 gold-clean、paired execution 不完整、部分 surface 只有 candidate；所以历史质量分不能作为生产裁决。

### 选择与理由

- 选择不再使用“低于 80 分就继续”的规则。80 分只保留为历史评测阈值，不作为生产 stage gate 或 close gate。
- 选择按 surface 分开报告：严重问题召回、clean false-positive、执行成功、provider coverage、token、时长、finding validity、材料完整性和人工确认分别记录。
- 选择不因单次新 finding 或单个 provider timeout 机械重跑同一 snapshot；只有 snapshot/material/contract 有真实变化且重跑能回答新问题时才重审。
- 选择保留 provider timeout、invalid anchor、unavailable 和 incomplete 原始事实，不把它们改写成空 findings 或质量通过。

### 全 stage 结果

| surface | 修改前 | 修改后 | 成本/可信度 | 结论 |
| --- | --- | --- | --- | --- |
| direction | 66；召回0.80 | 71.8；召回0.895 | token +101.48%；时长 +284.39% | 召回有迹象，整体不确定 |
| detail | 73；召回0.90 | 79.58；召回1.00 | token +0.02%；时长 +112.70% | 召回有迹象，整体不确定 |
| build-spec | 80；召回1.00 | 80；召回1.00 | 时长 +164.19% | 没证明提升 |
| build-plan | 无 paired | 无 paired | 不能可靠对照 | 不确定 |
| build-code 两面 | 无 paired | 无 paired | 不能可靠对照 | 不确定 |
| verify-code | 无 paired | 无 paired | 不能可靠对照 | 不确定 |
| mini design | 无 baseline | candidate 74.86 | 只有 candidate | 不确定 |
| mini implementation | 无 paired | 无 paired | 不能可靠对照 | 不确定 |

### 当前 build-code 复审事实

- 修复前：3 个配置 provider 中 1 个完成、2 个 timeout；完成者约 324.6 秒、usage `259567`，无 fresh retry；聚合 3 条有效 minor，2 条 invalid-anchor 只作失败事实保留。
- 修复后：3 个配置 provider 中 2 个完成、1 个 timeout；完成者约 250.6 秒和 311.9 秒，另有约 360.7 秒 timeout；无 fresh retry，1 次同会话修复，已知 usage `260620`。
- 修复后有效结论为 1 条 minor：空 `findings` 不应回退把非 reportable clusters 纳入 disposition；4 条 major 锚点无效，不能据此声称已经发现 4 个真实代码缺陷。
- 因此修复后不能宣称“异源审查质量已全面提升”，但可以确认审查链仍能产出一个可定位、可修正的真实问题；provider timeout 仍是成本/可靠性问题。

### 修复与验证

- 完成 review recovery 路径脱敏、reuse attempt 的 provider output provenance 重绑、typed AC 语法统一、mini-task 执行状态区窄放宽、无用变量清理。
- 定向回归 `74/74`、mini-task delivery `18/18`；全量 `npm test` 安全集 `1596 passed/1 skipped`、exclusive `31 passed`；`npm run check`、skill closure 和 `git diff --check` 通过。
- 当前实现和测试均绑定 snapshot tree `e1667a864423fa152f3615661bbd419f8c47733f`；官方 receipt 只作为当前实现/测试事实，不冒充 provider 质量提升。

### 延期交接与状态

- 不新增 mini-task；本轮没有独立新需求，只修同一任务的 review/验收基础设施。
- 仍延期：T010 九面可信 paired A/B、逐 AC 独立行为/oracle/断言事实、finding dispositions 完整闭合、exceptions、human confirmation、public runtime live probe。
- 当前任务状态保持 `incomplete`；不执行 close、commit、merge、push、cleanup。待用户审阅上述对比并明确后续方向。

## 当前 T028 配置身份可观测性决策（2026-08-16，append-only）

### 原始问题

审查报告里 effort/thinking 不是 v3 provider 直接回报的字段；如果把配置值写成“已观测”，会夸大审查事实；如果完全写成未知，又看不出 broker 是否按配置执行。

### 关键事实

- `3rd-review` v3 已公开 `identity.config_id`；WorkflowHub 主机在 dispatch 前已经校验 WorkflowHub profile 与 broker 配置的 model/effort/thinking 一致。
- v3 没有公开 effort/thinking 的独立运行时字段，因此不能声称模型直接证明了这两个值。
- 复制 broker 的 config hash 算法到 WorkflowHub 会增加跨仓库维护耦合，且不能提高异源 finding 质量。

### 当前选择与理由

- 报告把有 `config_id` 的配置值写成 `BROKER_CONFIG_ATTESTED (configured=...)`，没有身份时继续写 `UNAVAILABLE`。
- v3 在配置了 effort/thinking 时缺少 `config_id`，直接变成 `PROFILE_MISMATCH`/`unavailable`；不猜测、不把结果当成合格审查。
- 不新增协议字段、不复制 broker hash；复用已有 public identity 和 host preflight，降低维护难度，同时保持“直接观测”和“配置证明”两种事实分开。

### 验证与延期交接

- `review-provider-client-v3`、`review-runner`、`canonical-review-result` 定向测试 `83/83`；skill closure 和 `git diff --check` 通过；没有重复官方全量测试。
- 这项修复提高了配置事实的可解释性和 fail-closed 稳定性，但不改变历史 ModelTest 的 `inconclusive`，也不证明所有 stage 质量已提升。
- T010 paired A/B、当前逐 AC 事实、finding disposition、exceptions、human confirmation、修复后当前 snapshot provider review 和正式 close 授权继续延期；不启动新 mini-task，不执行 close、commit、merge、push、cleanup。

## 当前 T029 语义审查与测试回执解耦决策（2026-08-16，append-only）

### 原始问题

build-code 的最终 integration review 以前把“当前测试/实现回执是否齐全”放在 provider 调用前。结果是：只要回执缺失、过期或刚好被任务材料写回改变，provider 就不看最终代码，主流程容易把语义审查失败、材料补齐、快照重建和重复调用混成一件事。用户真正要的是发现会影响交付的缺陷，不是让 provider 审计材料台账。

### 调研结论

- 两个独立子代理分别检查了宪法、integration subject、材料包和测试。结论一致：缺测试回执时仍应做语义审查；缺失事实只能影响正式收口。
- 当前 integration provider packet 已经不发送 `ac_trace`、`test_evidence` 正文，但以前仍会在材料预检阶段直接挡住 provider。
- 宪法 F3/F4/Q1/Q2/Q3 要求：质量事实不是继续工作的许可证，但缺质量事实也不能被宣称完成；异源审查必须真实执行或如实 unavailable。这支持“provider dispatch 放开、close 保持严格”。

### 当前选择

1. 最终实现快照和核心行为材料仍是 provider 的输入，缺 `approved_spec`/AC 这类真正语义材料仍不能做有意义的审查。
2. implementation/GREEN receipt 改成软事实：有回执就严格校验 task、stage、producer、命令、exit code、output hash 和 snapshot；缺失、过期或无效就写 `unavailable` audit gap，不阻止 provider 审最终实现。
3. 缺 test receipt 时，沿用现有 `test_evidence` 字段写入 `status=unavailable` 和原因；不伪造命令、退出码、snapshot 或 GREEN。AC 没有实现回执时，允许空 evidence，但必须有 `evidence_status=unavailable`、原因、AC 变化和最终实现锚点。
4. provider 继续只看压缩后的行为需求、AC 段落、最终实现上下文和测试结果状态；AC 台账、receipt/hash、snapshot、lineage 仍是 host-only。provider 不因为缺材料治理字段主动生成 finding，除非它直接造成或掩盖用户可见行为失败。
5. 正式 close 不放宽：缺测试、逐 AC、独立审查、finding 处置、例外、人工确认或交接事实时，仍保持 `incomplete/unavailable`。固定 80 分仍不是继续或 close 条件。
6. 纯 `tasks.md`“执行状态填写区”写回继续复用旧 semantic review；代码、需求、计划、AC 或合同变化仍必须重新审查。没有因此启动 mini-task，也没有重复官方全量测试。

### 验证事实

- `skills/wh-review/scripts/__tests__/integration-review-subject.test.mjs`、`tests/contract/integration-review-subject.test.mjs`、`tests/contract/review-materials-contract.test.mjs`：`39/39`。
- `skills/wh-review/scripts/__tests__/review-runner.test.mjs`、`review-provider-client-v3.test.mjs`、`core/__tests__/canonical-review-result.test.mjs`、`simple-contracts.test.mjs`：`99/99`。
- 合计定向测试 `138/138`；`node runtime/evidence/check-skill-closure.mjs .` 返回 `skill closure: ok`；`git diff --check` 通过。
- 没有重新调用 provider，也没有重复官方 `npm test`；所以本轮只能证明“缺回执不再挡住语义审查的确定性行为”，不能宣称当前 snapshot 的异源质量已经提升。

### 延期交接

T010 九面可信 paired A/B、当前逐 AC 事实、finding disposition、exceptions、human confirmation、最终当前 snapshot provider review 和正式 close 授权继续保持 `incomplete`。不执行 close、commit、merge、push、archive 或 cleanup，等待用户明确指令。

## 当前 T030 评分问题与全部审查对比（append-only，2026-08-16）

### 先说结论

- 之前没有因为“低于 80 分”而无限继续。当前评测配置明确是 `fixed_quality_80_gate=false`；80 分只是旧 ModelTest 的历史阈值，不是 WorkflowHub 的继续、重试或 close 条件。
- 旧评分方式确实有问题：它把不同审查面压成一个分数，而且很多 control 没有 gold-clean 标记、paired 样本不完整，导致“分数变化”不能证明质量变化。
- 现在不再用总分追审查。质量、召回、误报、provider coverage、token、耗时、finding 是否有效、事实是否完整分别报告；`unknown`、`unavailable`、`inconclusive` 不会被算成通过，也不会机械触发重试。
- 当前能证明的是：审查链的保真度、fail-closed 边界和成本控制比之前好；不能证明九个 stage 的交付质量已经全面提升。因为历史 A/B 本身不够干净，修复后的当前 snapshot 也还没有再次做 provider review。

### ModelTest 全 stage 对比

以下是现有 v1.2 benchmark 中所有审查面能拿到的对比。没有 paired 数据的地方明确写“不能比较”，不补猜测分数。

| 审查面 | 修改前 | 修改后 | 成本变化 | 结论 |
| --- | --- | --- | --- | --- |
| direction | 质量66；召回0.80 | 质量71.8；召回0.895 | token +101%；时长 +284% | 有召回信号，整体不确定 |
| detail | 质量73；召回0.90 | 质量79.58；召回1.00 | token 基本不变；时长 +113% | 有召回信号，整体不确定 |
| build-spec | 质量80；召回1.00 | 质量80；召回1.00 | token 基本不变；时长 +164% | 没证明质量提升 |
| build-plan | 没有 paired | 没有 paired | 不能可靠计算 | 不能比较 |
| build-code.phase | 没有有效 paired | 没有有效 paired | 不能可靠计算 | 不能比较 |
| build-code.integration | 没有有效 paired | 没有有效 paired | 不能可靠计算 | 不能比较 |
| verify-code | 没有有效 paired | 没有有效 paired | 不能可靠计算 | 不能比较 |
| mini-task.design | 没有 baseline | 质量74.86；召回0.944 | 只有 candidate | 不能比较 |
| mini-task.implementation | 没有有效 paired | 没有有效 paired | 不能可靠计算 | 不能比较 |

原始可读对比见 `quality/evidence/wh-review-benchmark-readable-comparison-v1.2.json`；该报告的总状态是 `diagnostic_inconclusive`，没有 composite score，也没有 global rank。报告位置：

- `/Users/Hugh/Knowledge/Projects/workflowhub/tasks/wh-review-adversarial-quality-cost-redesign/quality/evidence/wh-review-benchmark-readable-comparison-v1.2.json`
- `/Users/Hugh/Knowledge/Projects/workflowhub/tasks/wh-review-adversarial-quality-cost-redesign/quality/evidence/wh-review-benchmark-report-v1.2-20260815.json`
- `/Users/Hugh/Knowledge/Projects/workflowhub/tasks/wh-review-adversarial-quality-cost-redesign/quality/evidence/wh-review-benchmark-comparison-v1.2-20260815.json`

Task store 的原始审查记录还包括 402 个 Markdown report、227 个 canonical result JSON；其中 227 个结果不是 227 次独立质量实验，而是同一任务不同快照、材料和失败重试的历史记录。按 report 统计：make-decision 116、build-spec 34、build-plan 24、build-code 194、verify-code 34；semantic 227，unavailable 175；parallel external 388，single external 14。按 canonical result 统计，provider findings 共 1262 条，其中 actionable 1122、minor 140；这些数字只能说明历史运行量和发现量，不能当作质量分数或“发现越多越好”。

### build-code 审查逐轮对比

这里比较的是当前任务里实际产生的审查报告，不把 provider 失败改写成质量结果。

| 轮次 | provider 事实 | 保留下来的结论 | 判断 |
| --- | --- | --- | --- |
| 早期 `a199...` | 输入把 provider 包对象当文本 | 暴露 `[object Object]`、AC 绑定等问题 | 调用方材料错误，已加 fail-fast |
| `9cf7...` / `0c7...` | 有完成、超时、无效锚点混合 | 暴露回执复用、AC、身份和空引用问题 | 旧链曾丢 findings，已修 |
| `971472...` | 1 完成、1 进程失败、1 超时 | 1 条有效 finding：重复确认规则 | 已修并回归，不是当前快照结果 |
| `11299...` | 1 完成、2 进程失败；无 WorkflowHub retry | 4 条真实边界 finding | 修复前最后一轮，已逐条处理 |
| T030 后 | 未再次调用 provider | 29/29、22/22、26/26 定向回归通过 | 证明确定性修复，未证明 provider 新质量 |

关键 `11299` 报告的真实发现是：未知回执来源会被接受、删除文件会让最终实现锚点崩溃、材料版本匹配过松、mini-task 收口只验 AC trace 外壳。这些是审查基础设施的真实缺陷，不是为了凑分数制造的 finding；现在已分别改为未知来源 fail-closed、删除文件安全跳过、材料版本严格匹配、mini-task AC trace 全量复验。

关键报告仍保留在 task store：

- [11299 最新修复前报告](/Users/Hugh/Knowledge/Projects/workflowhub/tasks/wh-review-adversarial-quality-cost-redesign/quality/reviews/reports/11299a6b-1090-4dba-9a79-1f10e7e8952e.md)
- [971472 报告](/Users/Hugh/Knowledge/Projects/workflowhub/tasks/wh-review-adversarial-quality-cost-redesign/quality/reviews/reports/97147257-b547-4fc6-be29-aa35eb886dcc.md)
- [0c7c 报告](/Users/Hugh/Knowledge/Projects/workflowhub/tasks/wh-review-adversarial-quality-cost-redesign/quality/reviews/reports/0c7c0bab-f7ab-41af-a554-a380d4421954.md)

说明：task store 保留全部原始 attempt/result/report；上面只列能代表不同问题类型的几轮，避免把数百个历史重试文件伪装成数百个独立质量结论。

### 当前审查质量到底有没有提升

- 有明确提升：path-only finding 不再被错误丢掉；provider 失败、无效锚点和空 findings 被分开；缺测试回执不再挡住语义审查；未知 producer、伪造 AC trace、错误材料版本会 fail-closed；删除文件不会让语义审查整体崩溃。
- 没有证据证明“所有 stage 的 provider 找缺陷能力”都提升。九面 benchmark 没有足够干净的 paired A/B，当前 T030 代码修复后也没有再花一轮 provider 成本做新鲜语义 review。
- 所以不能诚实地说“评分从 X 提升到 Y，任务已经达到 80 分”。正确说法是：审查链更不容易漏报、更不容易误放、更少因为材料台账阻断；交付质量提升仍需干净的 stage-specific gold-clean paired 评测。

### 本轮真实验证

- mini-task delivery：`29/29`。
- vNext delivery close：`22/22`。
- integration review + materials contract：`26/26`。
- 相关文件 `node --check`、`git diff --check`：通过。
- 没有重跑官方 `npm test`，没有因为分数或 finding 数量重复 provider review。

### 当前状态

T030 只证明了代码修复和确定性回归通过；最后一次 provider report `11299...` 发生在 T030 修复前，因此当前异源质量事实仍是 `incomplete`。T010 九面可信 paired A/B、逐 AC 当前事实、finding disposition、exceptions、human confirmation、当前 snapshot provider review 和正式 close 授权仍未完成。不能 close，也不能把本轮定向测试写成全面质量提升证明。

## T031 当前快照最终异源复核与审查包收窄（2026-08-16，append-only）

### 原始问题

用户要求确认：后续优化是不是被“80 分”卡住；审查包是否塞了太多材料；快照只写回执行状态时能不能复用旧审查；人工确认是否真的绑定了当前审查对象；修复后审查质量有没有真实提升。

### 本轮关键事实

- 当前 `/Users/Hugh/.config/workflowhub/config.json` 配置了 3 个 profile：`opencode/coding`、`opencode/v4flash`、`codex/luna`。本轮按配置全部调用，没有动态减少 provider，也没有 WorkflowHub 重试。
- 当前最终 review attempt：`quality/reviews/attempts/9f4592ed-e9e6-4be3-8711-286c933b5710/attempt.json`；report：`quality/reviews/reports/9f4592ed-e9e6-4be3-8711-286c933b5710.md`；snapshot tree：`f8b5fd4f134e2b8aec34fe1ee15ca27be78d3092`。
- 结果是 `GROUP_OUTCOME_UNAVAILABLE`，没有 semantic result，也没有新的 findings：`opencode/coding` 进程非零退出，约 5 秒；`opencode/v4flash` 没有 completed final message，约 486 秒；`codex/luna` 超过 360 秒超时。总失败等待约 852 秒。这是 provider 可用性和超时事实，不是“质量低于 80 分”。
- 当前 provider 审查包已经从原来的 17 个上下文文件收窄到最多 9 个交付关键实现片段；完整锚点仍由 host 保存。9 个片段中保留了 `git-worktree-snapshot.mjs`，避免 provider 把“只写回 tasks.md 执行状态”的安全复用误判为任意 material 变化复用。材料合同回归 `21/21` 通过。
- `human-confirmation.v2` 现在要求非空 `subject_ref`，并在正式验收时要求它和当前 subject 精确一致；缺失和错绑都会失败。确认授权定向测试、verify freshness、vNext close 合计 `32/32` 通过。
- mini-task delivery `29/29` 通过；语法检查和 `git diff --check` 通过。没有重新跑官方全量 `npm test`。

### 对上一次可用复核的裁决

- 上一次部分可用报告：`quality/reviews/reports/7a4b7b9a-d991-4c86-94c7-7956a0ba5ce5.md`。3 个 provider 中只有 `codex/luna` 形成有效语义结果，另外两路分别是 Kimi 额度失败和 v4flash `database is locked`；没有 WorkflowHub retry。
- 该报告的两条 finding 中，人工确认 `subject_ref` 没有强制绑定是实际缺陷，已经修复；“任意 material-only 快照变化都可复用旧结果”是 provider 没看到窄 helper 上下文造成的误判，当前 provider 包已补回 `git-worktree-snapshot.mjs`，代码仍只允许完全相同或执行状态区变化复用。
- 因最终复核没有 semantic result，不能声称修复后异源审查质量已经全面提升；只能确认材料范围、finding 保真边界、人工确认绑定和确定性测试比之前更稳。

### 评分裁决

- `fixed_quality_80_gate=false` 仍是当前事实。80 分不是继续优化、重试或 close 条件。
- 历史 ModelTest 九面仍是 `diagnostic_inconclusive`：direction/detail 只有召回上升信号，build-spec 没有质量提升，其余面没有有效 paired；成本和 provider 成功率必须单独看。
- 本轮最终 provider 不可用，不产生质量分；不可用不能当成空 findings，也不能当成通过。

### 状态

- 不新增 mini-task：本轮仍是同一 wh-review 主任务的审查质量、成本和收口事实修复。
- 不再因同一 snapshot 的 80 分、finding 数量或 execution-only 写回重复审查。
- T010 可信 paired A/B、当前逐 AC 事实、完整 finding disposition、exceptions、正式 human confirmation、public runtime live probe 和用户 close 授权仍未完成；不执行 close、commit、merge、push 或 cleanup，等待用户指令。

## T032-T041 后续执行事实（2026-08-16，append-only）

这一段补记 T031 之后的真实调研、实现、对照和边界，避免 `tasks.md` 有执行记录而 `decision-log.md` 没有完整背景。

### 已完成的实现与核查

- 修复了语义复用边界、材料版本绑定、缺失事实的 false-green、人工确认 subject 绑定、未知 producer、删除文件、mini-task AC trace 和 v3 provider 身份等问题；相关定向回归已经在前文各任务记录中保留。
- 3rd-review 候选分支 `codex/3rd-review-wh-review-adversarial-quality-cost-redesign` 已提交 `a8d7a82`；受影响测试 `120/120` 通过，语法检查和 `git diff --check` 通过。
- ModelTest 候选分支 `codex/workflowhub-wh-review-adversarial-quality-cost-redesign` 已提交 `ad920f9`；新增 benchmark 测试 `31/31` 通过，资产校验通过，包含 9 个 surface、45 个 mutation 和独立 gold-clean acceptance 引用。
- 使用当前三仓候选、当前配置和显式路径生成了 `1260` 条 paired 评测计划，`provider_calls=0`。这只证明计划、资产和绑定可生成，不是质量结果，也没有运行昂贵的 live A/B。

### WorkflowHub 候选与 main 对齐

- 候选 WorkflowHub 分支先提交主任务改动 `3f93f8c1`，随后把 `main` 当前提交 `ece89717` 合并进候选；唯一冲突是 `core/task-close.mjs` 的快照捕获调用，按 `main` 新规则保留 `captureExecutionSnapshot(worktree)`。
- 合并提交为 `415344ed`。合并后的 6 个受影响测试文件共 `107/107` 通过，覆盖 official component receipt、official stage run、delivery close、execution snapshot isolation、canonical review result 和 invocation identity；`git diff --check` 通过。
- 候选随后只追加执行记录提交 `b0fb7dce`，当前候选 HEAD 为 `b0fb7dced61962d88e34fac5b9e65ffd37f36eeb`，候选工作树 clean。该次只改当前任务记录，不改生产行为。
- 目标 `/Users/Hugh/Hugh/Project/workflowhub` 的 `main` 仍有用户未提交的 27 个 tracked 文件和 2 个 untracked 路径；本轮没有覆盖、提交、stash、合并回写或删除这些改动。候选只对齐了已提交的 `main`，没有把 dirty main 误当成可安全合并内容。

### 当前正式质量事实与外部宿主边界

- 重新通过公共 `stage-runtime status --action=begin --stage=verify-code` 检查后，四份当前材料齐全、`work_status=ready`，但 `quality_status=in_progress`；以下六项仍是 `missing`：`full_tests_fresh`、`independent_review`、`finding_dispositions`、`acceptance_criteria`、`exceptions`、`human_confirmation`。
- 当前仓库只有接收并认证外部 Stage Agent execution object 的 bridge，没有现成的本地 Codex/Claude Stage Agent 启动器。`write-template` 只能生成 `incomplete` 模板，`write-unavailable` 只能记录真实 unavailable；都不能冒充 verify-code 完成。
- 因此没有伪造当前 Stage Agent execution、逐 AC、finding 处置、例外或人工确认，也没有把旧快照下的测试/审查当作当前候选的最终证明。公开 `quality/verify.json` 仍绑定旧候选快照，当前状态保持 `incomplete`。
- 这不是 WorkflowHub 依赖 Multica 的证据。Multica 只是一个可选外部宿主；当前 `wh-review` 的实际 provider 依赖是受信的 3rd-review broker。没有使用 Multica 作为本任务的质量或 close 门槛。

### 当前未完成项与停止边界

- 九面 live paired A/B 仍没有当前候选结果；历史对比仍为 `diagnostic_inconclusive`，只能说明方向/detail 有召回上升信号，不能证明所有 stage 质量提升。
- 当前 verify-code 的真实 Stage Agent execution、逐 AC 当前事实、完整 finding disposition、exceptions、human confirmation 和正式 close 授权仍未闭合。
- 没有新增产品需求，所以没有启动 mini-task，也没有待清理的 mini-task worktree/lock。
- 决定：在没有真实 Stage Agent 和这些正式事实前，不重复同一 snapshot 的 provider 审查、不跑昂贵全量 ModelTest、不执行最终 close、push、archive 或 cleanup；到此停在 final close 之前，等待后续正式宿主事实或用户明确收口授权。

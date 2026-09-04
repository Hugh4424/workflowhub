# Decision Log

> 任务：workflowhub-verify-close-protocol-robustness-20260902（任务 A：verify-code / close 执行协议健壮性改造）
> 阶段：make-decision（进行中）
> 宿主事实：DSH 会话，session-event 记录不可用（`no codex session id in environment`），bootstrap `session_binding=unavailable(session_task_binding_mismatch)`；worktree `node_modules` 为主仓符号链接（沿用历史 lesson 的既定做法）。以上为如实记录，不阻断本阶段。

## 原始需求

| source_id | 原始需求/约束 | 来源引用/原文摘录 | 关联 D/处理状态 |
| --- | --- | --- | --- |
| R-001 | 修复 verify-code/close 协议健壮性四项内容：①协议错误与质量失败分层（协议错误只重发 publication 不重跑整阶段）②提交前 dry-run 预检工具 ③quality_review_ref 绑定自动化 ④close 授权增量诊断 | `~/Downloads/workflowhub-remaining-fix-plan-20260902.md` 任务 A 范围 | 覆盖：D-001/D-003/D-005/D-006+验收 A1-A7 |
| R-002 | 按标准 WorkflowHub 流程执行，从 make-decision 开始，不跳阶段，不依赖 build-spec 补需求 | 用户 2026-09-02 原文："请按标准 WorkflowHub 开始A任务吧，从 make-decision 开始，不要跳阶段，也不要依赖 build-spec 补需求" | 覆盖：13 步 manifest 按序执行（本文件全程记录） |
| R-003 | 让 verify-code 更简洁方便高效；不违反 workflowhub 宪法；不增加很多维护成本 | 用户 2026-09-02 原文："这个任务应该让verify-code更简洁方便高效，而不是违反workflowhub宪法，不要增加很多维护成本！" | 覆盖：D-001/D-008/D-010 |
| R-004 | make-decision 中和用户一起梳理完整用户流程、页面范围、数据状态、成功/失败边界、非目标和延期项；Talk 用大白话 | 用户 2026-09-02 原文："和我一起仔细梳理完整用户流程、页面范围、数据状态、成功/失败边界、非目标和延期项。Talk 请用大白话说明选项、后果和风险" | 覆盖：T-001~T-010 三轮大白话卡+真实回复 |
| R-005 | 加速 workflowhub 执行速度和效率，尤其 verify-code 和 close 阶段 | 用户 2026-09-02 首轮原文："我希望加快workflowhub的执行速度和效率，尤其是最后verify-code和close阶段" | 覆盖：目标节+D-001/D-003 |

## 核心需求

verify-code 和 close 阶段反复因机械填表错误（绑定对不上、schema 不对、授权过期）整轮重跑 LLM，又慢又贵；用户要它们更简洁、更快、更便宜，同时不碰质量审查的严格性。

## 目标

- 目标：消灭"机械协议错误触发整轮 LLM 阶段重跑"的重试风暴——该目标已被用户确认、可执行、可用 lessons 重放验证完成，让 verify-code/close 的协议类失败廉价、可诊断、可定点恢复；质量裁决维持 fail-closed 不变；不新增公共行为类、不引入宪法禁止的机制。

## 成功/失败边界

- 成功边界：lessons 中真实失败样例（绑定错误、SCHEMA_VALIDATION_FAILED、authorization not current）重放时，不再触发整阶段重跑；agent 提交前可本地预检；绑定不再靠 host 猜；close 校验失败能指出具体哪一环。
- 失败边界：任何改动导致质量裁决可被绕过、unavailable 被当成 pass、或新增宪法禁止机制（checkpoint/recovery/第二事实源/新公共行为类）即失败。

## 范围

- 当前范围（初判，待 Talk 确认）：`runtime/stage/stage-runner.mjs` verify-code 绑定与失败通道、`runtime/task/task-kernel-implementation.mjs` close 授权校验链、host 侧预检工具；契约测试成对。
- 用户流程/结果只记索引和验收影响，细节进入 spec：使用者是运行 WorkflowHub 的主会话 agent 与任务 owner；无页面改动（见 UI applicability）。

## 非目标

- 初判（待 Talk 确认）：不改质量裁决语义（fail-closed 不动）；不碰 wh-review broker 异步化（任务 C）；不碰 task store 路径治理与快照哈希规则（任务 B）；不引入 checkpoint/resume/recovery 框架（宪法禁止）；不新增公共行为类。

## 关键事实（调研前已核实）

| fact_id | 事实 | 来源 |
| --- | --- | --- |
| F-001 | verify-code 绑定类错误在两个项目、三个任务中反复出现：`quality_review requires a bound dsh-code-review stage outcome` ≥5 次、`is not bound to` 2 次、`resolved review authorization stage outcome is not current and completed` 1 次（PaperBuilder f17 因此从未关闭）；`SCHEMA_VALIDATION_FAILED`（review_kind/review_track/receipt fields）≥5 次 | `~/Knowledge/Projects/workflowhub/lessons/*.jsonl` 与 `~/Knowledge/Projects/PaperBuilder/lessons/*.jsonl` 逐条统计 |
| F-002 | verify-code 绑定校验三个 throw 分支位于 `runtime/stage/stage-runner.mjs:2255-2280`：无 outcome 却提供 review ref / 有 outcome 但无 bound ref / 两 ref 不匹配 | 本任务 worktree 源码直读 |
| F-003 | close 的 resolved review authorization 校验链位于 `runtime/task/task-kernel-implementation.mjs:142-228`：要求 outcome current+completed、outcome hash 匹配、review result hash 匹配、identity 匹配、每条 actionable finding 有合法 disposition 且全覆盖；任一环节失败抛出笼统错误 | 本任务 worktree 源码直读 |
| F-004 | 宪法与治理约束：薄核心窄契约、简单优先可证伪、质量 fail-closed、公共行为仅七类（doctor/status/run/review/verify/confirm/authorize）、禁止 successor/checkpoint permit/recovery 等机制 | CONSTITUTION.md、AGENTS.md vNext 边界 |
| F-005 | verify-code SKILL.md v5.1.0 已规定"固定流程最多四个动作"、review 结果只是质量事实不是许可证；本任务不得把它改复杂 | workflows/verify-code/SKILL.md |

## 决定

### D-001

- question/final_option: 修复总方向？→ 双管齐下，以简化契约为主
- recommendation/plain_language: 推荐；机器能自动对齐的自动对齐 + 提交前自查 + 报错说清位置
- decision: 以"简化契约"为主轴，辅助工具为辅；不引入可恢复执行框架
- source_type/reference/exact_excerpt: 用户 Talk T-001 真实回复，选择①（推荐项）
- approval_binding: 待最终确认
- facts_and_constraints: F-001（绑定错误≥7 次、schema 错误≥5 次）、F-004（宪法禁止 checkpoint/recovery）
- Logic: 重试风暴源于机械错误整轮重跑 -> 宪法要求简单优先 -> 简化契约+辅助工具 -> 错误源消失且契约变薄
- choice_reason/impact: 同时解决"慢"和"复杂"；影响 runtime 校验与 host 工具
- consequences_and_risks: 要动 runtime 核心校验，测试必须跟上；RISK-001 分层误判风险由 D-010 兜底
- rejected_alternatives: 只加辅助工具（重试只减少不消失）；可恢复执行框架（违宪）
- unresolved_items/owner: 无
- Supersedes: none

### D-002

- question/final_option: 任务范围？→ verify-code + close 为主，含 build-code 同款协议错误
- recommendation/plain_language: 推荐；同一套机制一起修，一次解决三处
- decision: 范围 = verify-code 绑定与失败通道、close 授权校验链、build-code 的 SCHEMA_VALIDATION_FAILED/acceptance_coverage 同款协议错误
- source_type/reference/exact_excerpt: 用户 Talk T-002 真实回复，选择①（推荐项）
- approval_binding: 待最终确认
- facts_and_constraints: F-001（build-code schema 错误≥5 次）；FND-D02 要求验收点名 build-code
- Logic: 三处错误同一机制 -> 一起修边际成本低 -> 纳入范围 -> 重试风暴三处同时消失
- choice_reason/impact: 性价比最高；影响 build-code handler 同款失败通道
- consequences_and_risks: 范围比"只修 verify-code"大约一倍工作量
- rejected_alternatives: 严格只修 verify-code+close（build-code 风暴继续）
- unresolved_items/owner: 无
- Supersedes: none

### D-003

- question/final_option: 出错后恢复粒度？→ 机械错误原地修正重发，不重跑 LLM 审查
- recommendation/plain_language: 推荐；格式错了改格式重新提交，审查内容不重做
- decision: 协议类错误（schema/绑定/receipt 字段）支持原地修正后重发 publication；质量裁决失败维持原语义
- source_type/reference/exact_excerpt: 用户 Talk T-003 真实回复，选择①（推荐项）
- approval_binding: 待最终确认
- facts_and_constraints: F-001（单任务 build-code 重跑 31 次）；T-010 分层默认偏保守
- Logic: 浪费在整轮重跑 -> 机械错误与内容无关 -> 原地重发 -> 省掉绝大部分浪费
- choice_reason/impact: 提速幅度上限最高；影响 stage-runner 失败通道
- consequences_and_risks: 格式错/内容错必须严格分开（D-010）；重发由 host 同步驱动，无自动循环
- rejected_alternatives: 重跑机器校验（省得少）；整轮重跑（不解决核心问题）
- unresolved_items/owner: 无
- Supersedes: none

### D-004

- question/final_option: 是否需要外部调研？→ 不需要
- recommendation/plain_language: 推荐；本地事实充分
- decision: 跳过外部调研，依据本地源码锚点、lessons 样例与宪法边界设计
- source_type/reference/exact_excerpt: 用户 Talk T-004 真实回复，选择①（推荐项）
- approval_binding: 待最终确认
- facts_and_constraints: F-002/F-003 源码锚点已直读核实
- Logic: 答案不会改变方向 -> 调研是投入不是审查 -> 跳过 -> 节省一轮
- choice_reason/impact: 无
- consequences_and_risks: 若后续出现本地无法回答的方向问题，需回补
- rejected_alternatives: 外部调研（无方向改变价值）
- unresolved_items/owner: 无
- Supersedes: none

### D-005

- question/final_option: 绑定错误怎么根治？→ runtime 自动绑定，host 不用管
- recommendation/plain_language: 推荐；机器在记录时自动把审查结果和阶段记录绑在一起，错误源消失
- decision: `quality_review_ref` 由 runtime 在 record/publish stage outcome 时自动派生注入；host 不再提供该 ref；保留对错误绑定的可诊断记录
- source_type/reference/exact_excerpt: 用户 Talk T-005 真实回复，选择①（推荐项）
- approval_binding: 待最终确认
- facts_and_constraints: F-002（stage-runner.mjs:2255-2280 三个 throw 分支）；FND-D04 要求状态级验收
- Logic: 绑定错误占 verify-code 失败多数且纯机械 -> host 猜 ref 必然复发 -> runtime 自动派生 -> 错误分类整个消失
- choice_reason/impact: 契约最薄；影响 stage-runner verify-code 分支与契约测试
- consequences_and_risks: 少一层人工交叉验证；自动派生逻辑正确性由契约测试钉死
- rejected_alternatives: 保留双向校验自动补齐（复杂度保留）
- unresolved_items/owner: 无
- Supersedes: none

### D-006

- question/final_option: 预检工具形态？→ 私有 CLI，走既有公共入口
- recommendation/plain_language: 推荐；不新增公共行为类
- decision: 提交前预检为 stage-runtime 私有命令，经既有公共行为暴露；复用既有 Ajv schema 校验
- source_type/reference/exact_excerpt: 用户 Talk T-006 真实回复，选择①（推荐项）
- approval_binding: 待最终确认
- facts_and_constraints: F-004（公共行为仅七类）；Grill 核实 stage-runtime.mjs 私有命令白名单机制（artifact/capture-evidence 等先例）
- Logic: 预检是 agent 工具不是用户行为 -> 治理禁止新公共行为 -> 私有命令先例已存在 -> 同模式新增
- choice_reason/impact: 零治理风险；影响 stage-runtime 命令白名单
- consequences_and_risks: 无
- rejected_alternatives: 新增公共命令（违治理）
- unresolved_items/owner: 预检命令的确切名称在 spec 钉死
- Supersedes: none

### D-007

- question/final_option: 旧数据怎么处理？→ 只增不改，旧记录只读保留
- recommendation/plain_language: 推荐；新逻辑只管新执行
- decision: 旧 stage outcome/失败事实/授权记录只读保留；新校验与自动绑定只作用于新执行；契约测试加旧格式 fixture；修复只追加不回写
- source_type/reference/exact_excerpt: 用户 Talk T-007 真实回复，选择①（推荐项）
- approval_binding: 待最终确认
- facts_and_constraints: F-004/AGENTS.md（旧记录只读治理）；FND-D05 要求历史记录回归用例
- Logic: 旧记录是审计事实 -> 治理禁止改写历史 -> 只增不改 -> 无迁移风险
- choice_reason/impact: 无迁移成本；影响读取兼容分支（只读）
- consequences_and_risks: 代码保留只读兼容分支，成本低
- rejected_alternatives: 迁移修复旧记录（违只读治理）
- unresolved_items/owner: 无
- Supersedes: none

### D-008

- question/final_option: 非目标确认？→ 五条全部确认
- recommendation/plain_language: 推荐
- decision: 非目标 = ①质量 fail-closed 语义不动 ②wh-review broker 异步化（任务 C）③存储路径/快照哈希治理（任务 B）④新增公共行为类 ⑤断点续跑/恢复框架
- source_type/reference/exact_excerpt: 用户 Talk T-008 真实回复，选择①（推荐项）：全部确认
- approval_binding: 待最终确认
- facts_and_constraints: F-004 宪法与 vNext 边界
- Logic: 边界写死 -> 与宪法、任务 B/C 不重叠 -> 五条确认 -> 无隐性范围扩大
- choice_reason/impact: 防止范围蔓延
- consequences_and_risks: 任务 B/C 不启动前，对应问题继续存在（已知并接受）
- rejected_alternatives: 无
- unresolved_items/owner: 无
- Supersedes: none

### D-009

- question/final_option: 盲审 5 条验收加固意见处置？→ 全部采纳
- recommendation/plain_language: 推荐；只把验收写得可证伪，不加新功能
- decision: FND-D01~D05 全部 fixed：①协议/质量分层验收矩阵（含质量失败仍 fail-closed 的正向验证）②验收点名 build-code 两错误类 ③预检 fixture 清单+退出码+诊断字段契约 ④绑定状态级验收 ⑤旧记录不可变回归用例
- source_type/reference/exact_excerpt: 用户 Talk T-009 真实回复，选择①（推荐项）；codex/luna direction advice findings
- approval_binding: 待最终确认
- facts_and_constraints: direction advice outcome=partial（2 completed/2 failed 保留原始错误），advice only
- Logic: 软验收可被钻空子 -> 宪法要求检查在实际为假时真报失败 -> 全部采纳 -> 验收可证伪
- choice_reason/impact: 验收质量；影响 spec 验收节
- consequences_and_risks: 无
- rejected_alternatives: 部分采纳（留验收漏洞）
- unresolved_items/owner: 无
- Supersedes: none

### D-010

- question/final_option: 分层判定规则放哪？→ 硬编码在 runtime + 默认偏保守
- recommendation/plain_language: 推荐；改规则要走代码评审，不会被偷偷放宽
- decision: 协议错误白名单硬编码于 runtime 常量并以契约测试钉死；未列名的新错误类型默认按质量失败处理（拦）
- source_type/reference/exact_excerpt: 用户 Talk T-010 真实回复，选择①（推荐项）
- approval_binding: 待最终确认
- facts_and_constraints: RISK-001 分层误判风险
- Logic: 分层是分错了会出漏洞的边界 -> 默认偏保守即fail-closed -> 白名单硬编码 -> 放宽必须过评审
- choice_reason/impact: RISK-001 的兜底；影响 runtime 常量与契约测试
- consequences_and_risks: 新增协议错误类型需改代码（有意的摩擦）
- rejected_alternatives: 配置文件可调（多配置面且可被放宽）
- unresolved_items/owner: 无
- Supersedes: none

### D-011

- question/final_option: 协议错误原地修复后是否留痕迹？→ 留一条轻量事实，不算质量问题
- recommendation/plain_language: 推荐；执行抖动对 lessons/M16 可见，阶段结论保持简洁
- decision: 协议错误发生+原地修复在 facts 中留轻量事实（次数+类型），不影响阶段质量结论；不记 incomplete，不静默
- source_type/reference/exact_excerpt: 用户 Grill G-001 真实回复，选择①（推荐项）
- approval_binding: 待最终确认
- facts_and_constraints: F-004 宪法"记录事实而非阻断"
- Logic: 完全静默会掩盖抖动 -> 记 incomplete 违背简洁目标 -> 轻量事实 -> 诚实且简洁
- choice_reason/impact: lessons/M16 数据输入不中断；影响 facts 写入路径
- consequences_and_risks: 多一小条记录
- rejected_alternatives: 完全不留（掩盖抖动）；记 incomplete（弄脏阶段状态）
- unresolved_items/owner: 无
- Supersedes: none

## 命名唯一定义（Grill 钉死，spec 的唯一来源）

| 名称 | 定义 | 唯一权威来源 |
| --- | --- | --- |
| `protocol_error` | 机械协议错误：schema 校验失败、receipt 字段错误、绑定/ref 不一致、acceptance_coverage 形状错误；可原地修正重发，不重跑 LLM，不算质量问题 | runtime 常量（stage-runner 白名单，D-010） |
| `quality_failure` | 质量裁决失败：review finding、代码审查结论；fail-closed，语义不变 | 既有 handler 语义（不变） |
| 预检命令 | stage-runtime 私有命令（确切名 spec 钉死），经既有公共行为暴露，复用既有 Ajv schema | tools/cli/stage-runtime.mjs 命令白名单 |
| close 诊断字段 | 授权校验失败时输出结构化诊断：失败环节名 + 期望值 + 实际值 | runtime/task/task-kernel-implementation.mjs 校验链 |
| 协议错误痕迹事实 | facts 中的轻量记录：发生次数 + 错误类型 + 已原地修复；不影响质量结论 | 任务 facts 写入路径（D-011） |

## 三轮 talk

| talk_id | 问题/选项 | 后果/风险 | 用户选择/原文 | 队列变化 | source/evidence |
| --- | --- | --- | --- | --- | --- |
| T-001 | R1-Q1 修复总方向：①双管齐下以简化契约为主 ②只加辅助工具不动契约 ③可恢复执行框架 | ①verify-code 变简单、重试断崖降，但要动 runtime 校验、测试跟上 ②改动小但重试只减少不消失 ③违反宪法禁止项 | 用户选择①（推荐项） | 初始队列 4 题 | ask_user_question q1-direction，2026-09-02 真实回复 |
| T-002 | R1-Q2 范围：①verify-code+close 为主顺手修 build-code 同款协议错误 ②严格只修 verify-code+close | ①一次解决三处、范围稍大 ②范围最小但 build-code 重试风暴继续 | 用户选择①（推荐项） | 同上 | ask_user_question q2-scope，2026-09-02 真实回复 |
| T-003 | R1-Q3 恢复粒度：①机械错误原地修正重发不重跑 LLM ②重跑机器校验不重跑 LLM ③整轮重跑 | ①省掉绝大部分浪费，前提是格式错/内容错严格分开 ②保守省得少 ③不解决核心问题 | 用户选择①（推荐项） | 同上 | ask_user_question q3-recovery，2026-09-02 真实回复 |
| T-004 | R1-Q4 是否需要外部调研：①不需要 ②需要 | 本地事实充分（源码锚点已核实、失败样例在 lessons、宪法边界明确） | 用户选择①（推荐项）：不需要 | Round 1 收敛：队列无剩余 high/medium | ask_user_question q4-research，2026-09-02 真实回复 |
| T-005 | R2-Q5 绑定根治：①runtime 自动绑定 host 不用管 ②保留双向校验但自动补齐 | ①错误源消失、契约最薄，代价是少一层交叉验证、自动绑定逻辑要测试 ②保守但复杂度保留 | 用户选择①（推荐项） | Round 2 初始队列 4 题 | ask_user_question q5-binding，2026-09-02 真实回复 |
| T-006 | R2-Q6 预检工具形态：①私有 CLI 走既有公共入口 ②新增公共命令 | ①符合七类行为治理 ②违反治理边界 | 用户选择①（推荐项） | 同上 | ask_user_question q6-tooling，2026-09-02 真实回复 |
| T-007 | R2-Q7 旧数据兼容：①只增不改旧记录只读 ②迁移修复旧记录 | ①符合旧记录只读治理、无迁移风险 ②有改写历史风险 | 用户选择①（推荐项） | 同上 | ask_user_question q7-compat，2026-09-02 真实回复 |
| T-008 | R2-Q8 非目标确认：fail-closed 不动/不碰任务 C 的 broker/不碰任务 B 的路径快照/不新增公共行为/不引入断点续跑 | 范围与宪法、任务 B/C 边界一致 | 用户选择①（推荐项）：全部确认 | Round 2 收敛：队列无剩余 high/medium | ask_user_question q8-nongoals，2026-09-02 真实回复 |
| T-009 | R3-Q9 盲审 5 条意见处置：①全部采纳 ②部分采纳 | 不要求新功能，只把验收写得可证伪 | 用户选择①（推荐项）：全部采纳 | Round 3 初始队列 2 题 | ask_user_question q9-findings，2026-09-02 真实回复 |
| T-010 | R3-Q10 分层判定规则位置：①硬编码在 runtime + 默认偏保守（新错误类型默认当质量失败拦，白名单才当格式错）②配置文件可调 | ①改规则要走代码评审不会被偷偷放宽 ②灵活但多配置面且可能绕过 fail-closed | 用户选择①（推荐项） | Round 3 收敛：队列清空 | ask_user_question q10-classification，2026-09-02 真实回复 |

## 调研

| research_id/source | 调研重点 | 关键事实 | 处理状态 | 关联 D |
| --- | --- | --- | --- | --- |
| F-001~F-005 | 见"关键事实"表 | 已核实 | current | 待定 |
| RS-001 | 外部调研 | 用户 T-004 真实回复：不需要；本地事实充分 | skipped（用户决定） | — |

## grill

| grill_id | CONTEXT/冲突 | 结论 | ADR/四项退出 | source/evidence |
| --- | --- | --- | --- | --- |
| G-001 | 协议错误痕迹：诚实性 vs 简洁 | 留轻量事实不算质量问题（D-011） | ADR 三判据全真→建议创建（见文档结果） | ask_user_question q11-trace，2026-09-02 真实回复 |
| G-002 | 外部接口核实 | stage-runtime.mjs 私有命令白名单机制已直读核实（artifact/capture-evidence/run 路由先例），预检同模式可行 | 退出检查① pass | 源码直读 stage-runtime.mjs:553-562,810-835 |
| G-003 | 命名唯一定义 | `protocol_error`/`quality_failure`/预检命令/诊断字段/痕迹事实 五名钉死（见"命名唯一定义"表） | 退出检查② pass | 本文件命名表 |
| G-004 | 失败语义 | 协议错误重发由 host 同步驱动、无自动循环；不可变发布既有同字节幂等/异字节冲突语义沿用；未列名错误默认质量失败 | 退出检查③ pass | D-003/D-010 |
| G-005 | 范围边界 | T-008 五条非目标写死；任务 B/C 边界不重叠 | 退出检查④ pass | D-008 |
| G-006 | 全需求覆盖矩阵 | goal=R-005→D-001/D-003；flow_or_surface=non_ui（UI applicability 事实）→D-006；data_or_state=T-005/T-007→D-005/D-007；success_failure_acceptance=FND-D01~D05→D-009；constraint_non_goal_defer=T-008/DE-001/DE-002→D-008 | 五类全覆盖 | 本文件各节 |

## 审查处置

### Direction advice（step 6，2026-09-02）

- **传输事实**：status=available，outcome=partial，minimum_heterologous=1 满足；material_id=aa79e731…629e8e4a。provider：antigravity/flash=completed（0 findings）、codex/luna=completed（5 findings，evidence_anchor_valid 全 true）；**pi/coding=failed/RATE_LIMITED**、**opencode/pax3.8=failed/PROVIDER_IDENTITY_INVALID**（保留原始错误，不改写）。
- **性质**：advice only，不是 pass gate；partial 不当 pass。

| finding_id | 原始事实/来源 | 后果 | status | next_action/evidence_ref | owner/consumer/retain_or_delete |
| --- | --- | --- | --- | --- | --- |
| FND-D01 | codex/luna major：验收只有否定表述（"不再整阶段重跑"），未正向验证质量失败仍 fail-closed | 丢弃提交/错误放行也可能通过文字验收 | fixed（用户 T-009 真实回复：全部采纳） | 验收加"协议错误 vs 质量失败"分层矩阵：协议错误验证定位/原地修正/重发不重跑 LLM；质量失败与 unavailable 验证仍 fail-closed 不可转 pass | 本任务 spec/验收；retain |
| FND-D02 | codex/luna major：build-code 进了范围但验收没点名 | 只修 verify-code 也可能通过验收 | fixed（用户 T-009 真实回复：全部采纳） | 验收分别列 build-code SCHEMA_VALIDATION_FAILED 与 acceptance_coverage 重放用例 | 同上 |
| FND-D03 | codex/luna major："拦截全部历史 schema 错误样例"不可复现 | 预检覆盖度无法审计 | fixed（用户 T-009 真实回复：全部采纳） | 验收列固定 fixture/错误形状清单、预检退出码与诊断字段、与 runtime 校验的覆盖关系 | 同上 |
| FND-D04 | codex/luna major："绑定错误词条消失"是文本指标 | 改名/静默也能通过 | fixed（用户 T-009 真实回复：全部采纳） | 状态级验收：host 不提供 ref 时 runtime 写入正确 quality_review_ref，close 用同一绑定，错误绑定可诊断 | 同上 |
| FND-D05 | codex/luna minor：旧记录只读约束没进验收 | 可能靠回写旧记录"消除"错误 | fixed（用户 T-009 真实回复：全部采纳） | 历史记录回归用例：修复只追加，旧记录字节/哈希/可读性不变 | 同上 |

### Detail advice（step 10，2026-09-02）

- **传输事实**：status=available，outcome=completed，minimum_heterologous=1 满足；material_id=6090a18f…daa602e33。provider：antigravity/flash=completed（0 findings）、codex/luna=completed（4 findings，anchor 全 true）；**grok/grok=failed/PROVIDER_IDENTITY_INVALID**、**opencode/pax3.8=failed/PROVIDER_IDENTITY_INVALID**（保留原始错误，不改写）。
- **性质**：advice only；4 条均为验收可证伪性加固，不改变方向，处置记入下表并在最终确认卡呈现。

| finding_id | 原始事实/来源 | 后果 | status | next_action/evidence_ref | owner/consumer/retain_or_delete |
| --- | --- | --- | --- | --- | --- |
| FND-DD01 | codex/luna major：预检只定义了输出契约，没验证"提交前执行、协议无效被拦、预检本身无副作用不跑 LLM" | 预检可能沦为摆设或有隐写副作用 | fixed | 验收加顺序与副作用断言：建议流程=先预检后提交（写入 SKILL 指令）；预检拦截协议无效 payload（与 handler 现有拒绝等价，**不是新质量门**）；预检零外部写入、零 LLM 调用。注：原建议中"submission blocked"按协议无效等价拒绝理解，不构成阻断质量门 | 本任务 spec/验收；retain |
| FND-DD02 | codex/luna major：白名单/fixture 清单未完整枚举，A1 太泛、A2 只有两条 | 矩阵不可执行、覆盖不可证 | fixed | spec 发布完整 protocol_error 白名单（verify-code/close/build-code 三面，源自 lessons 历史错误清单）；每条列名错误有原地重发用例；**未列名错误默认 quality_failure 有专项测试** | 同上 |
| FND-DD03 | codex/luna major：A4 未定义 quality_review_ref 的权威来源与派生算法 | 自洽但错误的 ref 也能通过 | fixed | spec 定义 review record 身份与绑定派生算法；验收断言 runtime 写入 ref 与 close 消费 ref 精确相等；负测试：host 提供的 ref 被诊断性忽略/拒绝 | 同上 |
| FND-DD04 | codex/luna major：送审材料里非目标只有数量没有内容，验收无范围漂移检查 | 无法按边界裁决交付 | fixed | spec 验收列 D-008 五条非目标全文 + 范围漂移检查项（送审摘要从简所致，decision-log 原文完整） | 同上 |

## 最终确认

- 状态：accepted
- 用户原文与 host-visible 绑定：ask_user_question q12-final（2026-09-02）真实回复"确认，接受当前决策"；interaction aggregate 存于 task store `quality/evidence/interactions/`，多版以 supersedes 链末端为准（链：5873b8cc…453632 → 3c0a0cdb…a54b59 → 最终版；每版 supersedes_reason 记录了 decision-log 追加内容，决策内容始终未变，旧版只读保留）
- 未确认内容：无

## 拒绝方案

| 选项 | 拒绝理由 | 关联 D |
| --- | --- | --- |
| 可恢复执行框架（断点续跑） | 违反宪法禁止项（checkpoint/recovery） | D-001 |
| 只加辅助工具不动契约 | 重试只减少不消失 | D-001 |
| 严格只修 verify-code+close | build-code 重试风暴继续 | D-002 |
| 重跑机器校验/整轮重跑 | 省得少/不解决核心问题 | D-003 |
| 保留双向校验自动补齐 | 复杂度保留 | D-005 |
| 新增公共命令 | 违反七类行为治理 | D-006 |
| 迁移修复旧记录 | 违反旧记录只读治理 | D-007 |
| 配置文件放分层规则 | 多配置面且可被放宽绕过 fail-closed | D-010 |
| 协议错误完全不留痕迹/记 incomplete | 掩盖抖动/弄脏阶段状态 | D-011 |

## 待 Talk 议题

（待 Talk）

## 风险与延期交接

| risk/deferred_id | 风险或延期内容 | 触发/后果 | 处理阶段/owner |
| --- | --- | --- | --- |
| RISK-001 | 协议/质量分层若边界划错，可能把真质量问题误标为协议错误，削弱 fail-closed | 分层规则设计错误 | 本任务 spec/Talk 重点 |
| DE-001 | wh-review broker 异步化与 provider 降级 | 属任务 C | 任务 C owner |
| DE-002 | task store 路径治理、快照哈希规则 | 属任务 B | 任务 B owner |

## 质量边界

- 质量事实：lessons 统计、源码锚点、审查结果为事实记录
- 推进资格：质量事实缺失不阻断同 task 修复，只限制完成声明
- 完成判据：Talk 收敛 + Grill + 双向 advice 处置 + 用户确认 + interaction aggregate
- 不可逆授权边界：本阶段不授权任何代码改动、commit、close

## 未决项

| item_id | 未决内容 | 原因 | 谁在何时解决 |
| --- | --- | --- | --- |
| OPEN-001 | 修复哲学 | 已由 T-001/D-001 关闭 | — |
| OPEN-002 | 范围是否含 build-code | 已由 T-002/D-002 关闭 | — |
| OPEN-003 | 恢复粒度 | 已由 T-003/D-003 关闭 | — |
| OPEN-004 | session-event 在 DSH 宿主不可用，本任务 facts 链如实记 unavailable | 宿主能力缺口 | 本任务全程如实记录；根治属任务 B（存储/身份治理） |

## UI applicability

```json
{
  "result": "non_ui",
  "sources": {
    "raw_requirement": { "conclusion": "non_ui", "fact": "R-001~R-005 全部为运行时协议/CLI 工具改造，无页面、交互或前端请求（non-ui, cli-only）" },
    "project_inventory": { "conclusion": "non_ui", "fact": "workflowhub 有 monitor 静态页面与 reflection 模板，但本任务不改其消费面（no page/frontend change）" },
    "planned_or_changed_frontend_fact": { "conclusion": "non_ui", "fact": "无前端变更计划；改动面为 runtime/*.mjs、tools/host 或 tools/cli、tests/contract（backend-only）" }
  }
}
```

## 收敛检查

| 维度 | 用户答案 | 事实/材料引用 | 可执行验收 |
| --- | --- | --- | --- |
| 目标 | 用户已确认：加快 verify-code/close 执行速度效率，机械错误原地修正重发不重跑 LLM（q3-recovery 真实回复） | R-005、D-003 | 重放 lessons 失败样例时不再触发整阶段重跑（decision-log 成功边界） |
| 范围 | 用户已确认：verify-code + close 为主，含 build-code 同款协议错误；五条非目标全部确认（q2-scope、q8-nongoals 真实回复） | D-002、D-008 | spec 验收点名 build-code 两错误类+非目标漂移检查（FND-D02/FND-DD04 处置） |
| 方案 | 用户已确认：简化契约为主、runtime 自动绑定、私有 CLI 预检、旧记录只读、白名单硬编码默认保守、协议错误留轻量痕迹（q1/q5/q6/q7/q10/q11 真实回复）；取舍：少一层人工交叉验证换错误源消失；被拒方案：可恢复执行框架（违宪）、新增公共命令（违治理）、迁移旧记录（违只读治理）；未决项：OPEN-004 保留交接任务 B | D-001、D-005、D-006、D-007、D-010、D-011 | 绑定状态级精确相等、预检 fixture 全覆盖、未列名错误默认拦（decision-log 命名唯一定义表） |
| 验收 | 用户已确认：两轮盲审 9 条加固意见全部采纳（q9-findings 真实回复） | D-009、FND-D01~D05、FND-DD01~DD04 | 场景：重放 lessons 真实失败样例（绑定错误/SCHEMA_VALIDATION_FAILED/authorization not current）；数据来源：两项目 lessons jsonl+契约测试 fixture；通过：不再整阶段重跑、绑定精确相等、诊断到环节；失败：质量裁决被绕过或 unavailable 被当 pass |

## 阶段末一致性检查（spec-analyze，step 12，2026-09-02）

镜头：make-decision packet（原始需求 + 本 decision-log + Talk/Grill/审查/确认事实 + interaction aggregate）。

1. **需求覆盖**：R-001→D-001/D-003/D-005/D-006+验收 A1-A7；R-002→13 步 manifest 按序执行（本记录）；R-003→D-001/D-008/D-010；R-004→三轮 Talk 大白话卡+真实回复记录（T-001~T-010）；R-005→目标节+D-001/D-003。全部映射，无孤儿需求。
2. **目标达成**：加速（D-003 原地重发）+简洁（D-005 契约变薄）+不违宪（D-008 五条非目标+D-010 默认保守）一致。
3. **验收清晰**：两轮盲审 9 条全部 fixed，验收含分层矩阵、fixture 清单、状态级绑定、诊断字段、旧记录不变量、非目标漂移检查。
4. **方案收敛**：三轮 Talk 队列清空有记录；Grill 四项退出检查 pass；命名唯一定义钉死。
5. **大白话终卡**：已呈现并获用户真实确认（q12-final=接受）。
6. **DEFER/OPEN**：DE-001→任务 C、DE-002→任务 B、OPEN-004→任务 B，均有 owner 与去向；无缺口。
7. **质量边界**：质量事实/推进资格/完成判据/不可逆授权四边界已索引，未混用。

**发现**：首轮官方 run 暴露 4 项材料形状缺口，已在本阶段当场修复：①原始需求表处置列用词不合契约（改为"覆盖：D-xxx"）；②收敛检查表缺"用户答案/事实引用/可执行验收"三列及方案行的取舍/被拒方案/未决项标签、验收行的场景/数据来源/通过/失败标签；③UI applicability 三源事实缺显式 conclusion 字段；④目标节缺"已确认、可执行"表述。修复后以 `analyzeDecisionConvergence`+`readUiApplicabilityFromDecisionLog` 直读复验：六项 convergence facts 全 passed、ui=recorded non_ui、errors=0。direction advice 的 partial（2 provider 失败）与 detail advice 的 2 provider 失败已按原样保留，未改写为 pass。
**复查结论**：pass（镜头结论为事实记录，不是推进许可证）。

### 六段大白话总结

1. **本阶段做了什么**：把"verify-code/close 协议健壮性"从原始需求收敛为 11 条用户确认的决策，跑完三轮 Talk、一轮 Grill、两轮异源盲审（9 条意见全采纳）、阶段末一致性检查。
2. **需求覆盖**：5 条原始需求全部有决策或明确去向，无丢失。
3. **上游一致性**：决策与 lessons 证据、源码锚点、宪法边界逐条对齐；盲审 partial/失败如实保留。
4. **当场修复**：盲审指出的 9 处验收软化全部在决策中加固；分层规则默认偏保守兜底。
5. **剩余风险**：分层误判（白名单硬编码+默认拦兜底）；DSH 宿主 session-event 不可用（如实记 unavailable，根治属任务 B）。
6. **下游边界**：build-spec 可直接消费 D-001~D-011、命名唯一定义表、验收 A1-A7 加固版、FND 处置表；不得自行猜测：质量 fail-closed 语义、五条非目标、白名单内容（须从 lessons 清单枚举）、绑定派生算法（须在 spec 定义）。

## 官方发布事实（step 13，2026-09-02）

- 官方 `run:execute`（make-decision）最终态：10/11 完成谓词 satisfied（scope/non_goals/risks/ui_applicability/requirement_coverage/goal_achievement/acceptance_clarity/solution_convergence/plain_language_card/human_confirmation），facts 落 `quality/facts/*.json`。
- **stage_end_spec_analyze=missing**：record-spec-analyze 依赖 codex 会话通道，DSH 宿主不可用（`no codex session id in environment`）——如实保留 missing，不补填成功；阶段末语义检查已在本文件"阶段末一致性检查"节人工执行并复验通过，但官方机器认证位缺失，完成声明保持受限。
- **stage-reflection=failed（executor was not provided）**：已知基础设施缺口，由 `workflowhub-stage-reflection-usability-20260901` 任务负责修复；raw observation 已如实落入 `Projects/workflowhub/lessons/make-decision.jsonl`，不阻断。
- human_confirmation：`quality/facts/20925fcdf7fdee93d7368dbf3e01c4806d7eb627e461a287837f3f827a8da881.json`（decision=accepted，step-slug=approve-decision，2026-09-02T16:11:57Z）。
- 最终 interaction aggregate：`quality/evidence/interactions/30b52fecfa51988143f08ced12f687b52b67a3d8537bf2a3975ef6f475defad6.json`（supersedes 链末端）。

## 文档结果

- CONTEXT.md：changed（最小更新）：新增领域术语 `协议错误（protocol_error）`/`质量失败（quality_failure）` 分层定义——该分层将成为 lessons、验收和未来任务的长期语言；文件引用：workflowhub 仓 CONTEXT.md（build-code 阶段落实）
- ADR：created（一份）："verify-code/close 协议错误分层与绑定自动化"——记录 D-001/D-003/D-005/D-010 的已决方向；文件引用：docs/adr/（确切编号 build-plan 阶段定）
- ADR criteria：hard to reverse=true（下游任务将依赖自动绑定与分层语义，逆转要改回所有消费者）/ surprising without context=true（未来读者会问"为什么 host 不用提供 ref""为什么格式错误不算失败"）/ genuine trade-off=true（少一层人工交叉验证换契约变薄）
- 术语/ADR 冲突及处理：无冲突；CONTEXT.md 现有术语未含执行协议分层概念
- 不复制 spec 的边界：本日志只记决策索引，流程/字段/测试细节归 spec

## Exit checks

- 上下文一致：pass（G-006 五类全覆盖；术语已钉死）
- owner/接口一致：pass（G-002 外部接口已核实；各决定 owner 明确）
- 失败语义明确：pass（G-004；D-003/D-010）
- 范围与延期明确：pass（G-005；D-008；DE-001/DE-002 交接任务 C/B）

## 19. 规划退回后的方向修订（2026-09-03，用户真实回复）

本节是对第一次 make-decision 结果的追加修订，不改写已经发生的 Talk、审查、旧事实或旧记录。原因是 build-code 实施审计发现原计划把几个不可实现的承诺写成了既定接口；继续编码会迫使实现新增控制面、改写质量语义或伪造绿色。用户确认先回到规划，再按 make-decision → build-spec → build-plan → build-code 的顺序继续。

### D-012：verify-code 绑定范围收窄为当前认证 Stage Agent outcome 派生

- **用户问题**：现有 dsh-code-review 只是 verify-code 的一个技能，是否要为它改造整套 review invocation 存储？
- **用户真实选择**：从当前已认证 Stage Agent outcome 派生（推荐）。
- **决策**：不扩展 canonical review attempt/result schema，不新增 invocation 绑定字段、selector、账本或新公共行为。正式 verify-code 发布只接受当前 task/stage、当前 snapshot/material、已通过认证的 Stage Agent outcome 中声明的唯一 `dsh-code-review` ref/hash；runtime 从该 outcome 派生并写入本次新发布的 binding 位置。host 若继续提供 ref，只能作为相等性断言；相同则接受，不同则拒绝，不能覆盖派生值。旧 outcome/review 继续只读兼容。
- **影响与取舍**：这是对原 D-005“同 invocation review 记录”语义的明确收窄。它不证明 review 记录自身属于 invocation，只证明当前认证 outcome 已绑定该 review；因此消除 host 猜 ref 和 advisory review 冒充 canonical review 的复杂路径，同时避免中等规模的 review 存储/schema/写入器联动改造。若未来需要 review-level invocation provenance，另立任务，不在本任务偷偷扩展。
- **宪法检查**：符合 F1/F2/F8/F10；不新增公共行为、控制面、事实源或恢复状态机；旧记录字节与哈希不变。
- **关联**：FR-BIND-001/002（修订后）、AC-BIND-001/002。
- **Supersedes**：D-005 中“同 invocation 唯一审查记录”部分；保留“runtime 派生、host 不得覆盖”的目的。

### D-013：原地重发限定为同一次调用内的一次发布重试

- **用户真实选择**：采用私有瞬时发布重试。
- **决策**：handler/LLM 只调用一次；仅当已经得到合法 handler result 且失败发生在 publication 阶段时，runtime 在同一次 `runStage` 调用中最多重试一次纯 publication。信封只存在内存，不序列化、不作为下次调用 permit、不形成 continuation/recovery/checkpoint；handler/pre-handler 错误不伪装成 publication retry。publication 必须使用固定 captured timestamp 和 create-only/同字节幂等语义，避免重试产生不同内容。
- **影响与取舍**：可消除真正的发布抖动而不重跑 LLM；需要拆出最小的 prepare/publish 私有 seam，但不增加 public behavior。不能宣称可修复 handler 内部错误；该类保持原有失败语义。
- **宪法检查**：符合 F1/F4/F5/F8/F9/F10；没有自动循环、恢复框架或质量放行。
- **关联**：FR-CLASS-001、AC-EXEC-001。

### D-014：close 诊断改为首个失败，不做六环聚合

- **用户真实选择**：首个失败诊断。
- **决策**：保留六个固定 `check_id` 的逻辑桶和包含 check_id、expected、actual 三字段的 wire shape，但授权校验仍按现有 fail-fast 顺序在第一个失败点拒绝；只给该错误附加结构化诊断，不收集后续依赖检查，不改变任何通过/失败条件、Error/TypeError 兼容性或 physical close 的五项不可逆动作授权。
- **影响与取舍**：实现和维护成本最小，避免为聚合而引入不安全的依赖读取；“多个失败按固定顺序聚合”从原 spec 删除，改为“固定顺序的首个失败”。
- **宪法检查**：符合 F1/F2/F5/F8/F9；旧 close 授权语义不变。
- **关联**：FR-DIAG-001、AC-DIAG-001。

### D-015：预检只做纯 payload 预检

- **用户真实选择**：收窄为纯 payload envelope/acceptance-coverage shape 校验。
- **决策**：preflight 只读输入 JSON，复用/抽取 handler 的纯 envelope 与 acceptance-coverage shape 校验；不读取任务存储、当前 worktree、review/outcome、materials 或 invocation，不调用 LLM/network/子进程，不写任何事实。经既有 `run` 行为的私有路由暴露；成功/协议无效/命令错误分别为 0/2/1。其等价性承诺只覆盖纯校验子集，record-backed 当前性和绑定认证仍由正式提交负责。
- **影响与取舍**：零副作用、低维护；不再声称 payload-only 可以完成 record-backed 认证。
- **宪法检查**：符合 F1/F2/F8/F10；不新增第八类公共行为。
- **关联**：FR-PREFLIGHT-001/002、AC-PREFLIGHT-001/002。

### D-016：协议痕迹复用现有 facts.jsonl 十字段

- **用户真实选择**：定义并复用现有十字段，不新增账本/质量 fact/存储面。
- **决策**：每次协议错误被成功原地修复后追加一条既有 `task-fact.v1` 事实；不在失败质量结论中新增状态。固定编码为：`task_id` 由 `appendTaskFact` 从已认证 task root 注入；`stage`=当前阶段；`source`=`protocol_error:<class_id>`；`status`=`repaired_in_place`；`created_at`=错误首次识别时间，且 `occurred_at` 与其相同；`invocation_id`=当前 StageContext 的既有 workflow run id（非唯一 retry token）；`source_digest`=当前认证 snapshot 的 source digest；`material_digest`=既有 `materialRevisionFromValues` 对按固定顺序排列的四材料 `[path,content-or-null]` 值所得 `revision-<sha256>` 去除 `revision-` 前缀的 64-hex digest；`content_hash`=既有 `canonicalJson`（UTF-8、对象键按字典序、紧凑 JSON、无尾随换行）对 stage/class_id/occurred_at/status 四字段 trace payload 的 SHA-256；`output_ref` 固定为 `facts.jsonl`，它是既有十字段中的文件定位值；该次 `appendTaskFact` 返回的 ref、sha256 及对应 `index.json` 条目才是新增行的权威定位与行哈希，不回写到同一行的 `output_ref`。只在成功发布后追加，失败尝试不伪造 repaired；既有 `appendTaskFact` 负责 facts 与 index 的原子追加。
- **影响与取舍**：不新增 schema 字段、不写 quality/旧记录、不让痕迹成为 gate；仍能被 lessons/M16 看到类型和修复。
- **宪法检查**：符合 F3/F5/F8/F9；实现只能复用既有 facts API，若需要新 writer/companion record 必须停止退回规划。
- **关联**：FR-CLASS-004、AC-TRACE-001、FR-COMPAT-001/AC-COMPAT-001。

### 方向修订后的交接边界

- P1 只实现分类、最小 publication-only retry（仅 publication phase）及成功修复后的既有 facts 记录；不把 handler 错误变成可恢复。
- P2 只实现从已认证 Stage Agent outcome 派生 canonical dsh-code-review 绑定；不改 review schema/storage。
- P3 只实现首个失败结构化诊断；physical close 的 commit/merge/archive/push/cleanup 授权链不改语义。
- P4 只实现纯 payload preflight；record-backed 等价性是明确非目标。
- 若以上任何一项仍需要新字段、新账本、新 public behavior、跨调用 retry token 或改质量判定，立即停止并回到 owning material，不在 build-code 猜测。

## 方向修订后的 Exit checks

- 用户确认事实：D-012~D-016 均来自本轮真实回复；无默认选择冒充用户回答。
- 宪法与维护成本：保留薄核心、七类公共行为、旧记录只读、质量 fail-closed；review 存储不扩展，诊断不聚合，preflight 不 bootstrap。
- 未决事项：P1 publication 确定性与现有幂等能力的实现细节由 build-plan 冻结；P2 outcome 中唯一 dsh review 的认证读取边界由 build-plan 冻结；P5 facts 十字段编码如无法由既有 appendTaskFact 实现，停止退回本材料。
- 继续顺序：build-spec 修订本 spec；build-plan 修订 plan/tasks；然后才可重新开始 build-code。

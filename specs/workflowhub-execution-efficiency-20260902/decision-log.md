# Decision Log

> 任务：workflowhub-execution-efficiency-20260902
> 阶段：make-decision（进行中）
> 目标仓库：/Users/Hugh/Hugh/Project/workflowhub（worktree：workflowhub-workflowhub-execution-efficiency-20260902，分支 task/workflowhub/workflowhub-execution-efficiency-20260902，baseline fff255c78）

## 合并后重基线（2026-09-04）

任务分支已合并 `main`（`f4f2ae20b`）的 stage-reflection/`preflight`/`reflect`、verify-close、bridge stale-review 校验、snapshot materialization 与 wh-review 本地 bounded timeout。已提交的合并基线无文件冲突；当前任务四份材料先以 `a8310efd2` 固化，再通过 merge 保留。main 的五份 workflow SKILL.md 仍含 `workflowhub-codex-session-event.mjs` 和“同一会话自动记录”段，因此 B5b gate 未按“文件有改动”释放。main 已占用 `docs/adr/0023-stage-reflection-execution-and-status.md`，本任务 ADR 改用 0024。该记录只更新事实，不改变用户已确认的 B/C 方向。

## 阶段执行记录

| step/skill | 实际结果 | session-event 记录 |
| --- | --- | --- |
| task-bootstrap | 官方 bootstrap 成功；task store=/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-execution-efficiency-20260902；worktree/branch 已建 | session_binding=unavailable（session_task_binding_mismatch，DSH 宿主无 Codex session id） |
| step 1 load-context | 已读 make-decision SKILL.md v3.2.0、skill-deps.yaml、steps.json（14 步）、talk-with-zhipeng/decision-log 技能、任务 A spec 模块划分；session-event start/finish 命令实测返回 `unavailable: no codex session id in environment; host is not a codex-based session` | unavailable（宿主限制，已如实保留，不补填成功） |
| step 2 triage-scope | 本文档初版：原始需求回放、事实/假设/歧义分离、五维覆盖矩阵 | unavailable（同上） |
| step 3 talk-round-1 | 一组 3 题独立问题（任务包装/与A并行/R-006归属），用户真实回复全部选①；无新增 high/medium 开放问题，本轮收敛 | unavailable（同上） |
| step 4 research-inputs | 派出 2 个子代理做仓内调研（B面：快照哈希/存储根/双tree/session绑定/阶段末总结产出点；C面：wh-review 调用链/失败语义/异步先例/宪法核对）；无外部市场调研需求（纯仓内改动） | unavailable（同上） |
| step 5 talk-round-2 | 一组 4 题（untracked归属/双tree/异步化程度/遗漏披露深度）；双 tree 题经一次事实澄清重问；4 题全收敛 | unavailable（同上） |
| step 6 direction-advice | wh-review direction 完成：available/partial，antigravity/flash+codex/luna 有效，8 条 major 全部处置（FND-D01~D08）；pi/coding=RATE_LIMITED、opencode/pax3.8=PROVIDER_IDENTITY_INVALID 如实保留 | unavailable（宿主） |
| step 7 talk-round-3 | 盲审 findings 处置；FND-D01 触发用户方向升级（T-008 自定义回答）→ 考古（F-017/F-018）→ T-009 用户拍板彻底移除绑定；本轮收敛 | unavailable（宿主） |
| step 8 grill-with-docs | 零用户提问（事实理由见"grill 不提问的事实理由"）；覆盖矩阵五类齐全、四项退出检查 pass、CONTEXT 冲突定位（:274 条款 vs 现实漂移）、ADR 判定全真 | unavailable（宿主） |
| step 9 write-decision-draft | D-001~D-008 全集 + 收敛检查 + 文档结果 + Exit checks 写入 | unavailable（宿主） |
| step 10 detail-advice | wh-review detail 完成：available/partial，antigravity/flash+codex/luna 有效，11 条 findings 处置（FND-DD01~DD11）；grok/grok 与 opencode/pax3.8 = PROVIDER_IDENTITY_INVALID 如实保留（两家连续两次失效，疑似 provider 配置问题，记 RISK-006） | unavailable（宿主） |
| step 11 approve | 用户最终确认"① 确认接受"（final-confirmation）；confirm 记录链 b3f0a278→dcf73335→**936b206f**（两次 rebind 均因按 analyzer 契约补全文档小节，决策内容零变化）；interaction aggregate=quality/evidence/interactions/8b5ca30f4448ac47d56198f58ba3b3563727e2d76bbf213ef1c3b3419b7a8fb6.json（Talk 5 物理轮全生命周期，含完整卡片与回答哈希绑定） | 完成（宿主 GUI 真实确认） |
| step 12 stage-end-spec-analyze | spec-analyze 结论=**covered**（R-001~R-006/R-101/R-102 全覆盖，uncovered=[]）；record-spec-analyze 输入通过本地校验，但宿主链 unavailable 如实保留 | unavailable（宿主） |
| step 13 publish-decision | 正式 run 完成：11 项验收谓词 10 项 satisfied（scope/non_goals/risks/ui_applicability/requirement_coverage/goal_achievement/acceptance_clarity/solution_convergence/plain_language_card/human_confirmation），stage_end_spec_analyze=missing（宿主链死，warnings 如实记录"stage-end-spec-analyze:unavailable"）；17 条 finding 处置全部结构化 fixed 记录；direction/detail 审查 canonical 落库；stage outcome=unavailable（与 usability 任务同形态：该记录模型下不落 outcome 文件） | 完成（run 正式执行） |
| step 14 stage-reflection | reflection executor 未提供（CLI 宿主）→ status=failed 如实记录；raw_observation 已追加 Projects/workflowhub/lessons/make-decision.jsonl（entry e8978e0e） | failed（如实：executor 缺省） |

## 原始需求

| source_id | 原始需求/约束 | 来源引用/原文摘录 | 关联 D/处理状态 |
| --- | --- | --- | --- |
| R-001 | 判断 B（身份与存储一致性）和 C（wh-review 健壮性）能否在任务 A（verify-close-protocol-robustness）开发期间一起做 | 用户原文："在A还在开发时，B和C能否一起做？"（2026-09-02 本会话） | 已覆盖 → D-001/D-002（合并为一个任务、与 A 并行） |
| R-002 | 按标准 WorkflowHub 五阶段执行，从 make-decision 开始，不跳阶段，不依赖 build-spec 补需求 | 用户原文："请按标准 WorkflowHub 开始这个任务吧，从 make-decision 开始，不要跳阶段，也不要依赖 build-spec 补需求" | 已覆盖 → 本阶段 14 步全程执行，见阶段执行记录 |
| R-003 | make-decision 过程中与用户一起梳理完整用户流程、页面范围、数据状态、成功/失败边界、非目标和延期项 | 用户原文："先基于原始需求，在make-decision的过程中和我一起仔细梳理完整用户流程、页面范围、数据状态、成功/失败边界、非目标和延期项" | 已覆盖 → 目标/范围/成功失败边界/非目标/未决项各节 |
| R-004 | Talk 用大白话说明选项、后果和风险；decision-log 记录原始需求、关键事实、选择、理由和延期交接 | 用户原文："Talk 请用大白话说明选项、后果和风险；decision-log 记录原始需求、关键事实、选择、理由和延期交接" | 已覆盖 → Talk 九组真实回复大白话卡片；本 log 全节 |
| R-005 | 最终效果：workflowhub 简洁优雅；B 和 C 让执行效率更好更快；不违反宪法；不新增一堆增加维护成本的对象 | 用户原文："我希望最终效果workflowhub是一个简洁优雅的项目，B和C能让workflowhub执行效率更好效率更快，并且不会违反workflowhub的宪法，不会新增一堆增加维护成本的对象" | 已覆盖 → D-008 判定可以做且范围有限；非目标节写死约束 |
| R-006 | 每个 stage 结束时，如果有 step 或 skill 遗漏，要在 stage 结束的大白话总结里说明，不能默默遗漏步骤 | 用户原文："我希望每个stage结束时，如果有step或skill遗漏，可以在stage结束的大白话总结时说明一下，不能默默的遗漏步骤" | 已覆盖 → D-006（纯文本规则，实施随 B5b 批延期至 usability merge） |
| R-101 | 修复执行身份链与存储一致性：双 Knowledge tree 并存、writer 路径与配置错位、facts.jsonl 空写、session_task_binding_mismatch、snapshot hash 被 evidence 产出破坏（dirty worktree 矛盾） | ~/Downloads/workflowhub-remaining-fix-plan-20260902.md 任务 B；~/Downloads/paperbuilder-t08-workflowhub-root-cause.md 一/三节；PaperBuilder build-code lessons（untracked evidence hash mismatch ×3） | 已覆盖 → D-003（untracked 冻结）/D-004（双 tree）/D-007（移除绑定） |
| R-102 | 修复 wh-review 异源审查健壮性：同步 300s 超时、provider PUBLIC_RESULT_INVALID、0 字节输出无法判成败、partial 处置缺流程 | ~/Downloads/workflowhub-remaining-fix-plan-20260902.md 任务 C；T08 根因报告二节（t08-build-plan-output.json 0 字节、kimi PUBLIC_RESULT_INVALID）；make-decision lesson（detail 300s 超时后后台重试成功） | 已覆盖 → D-005（契约守护+调用约定；矩阵明细 OPEN-004 延期至 build-spec） |

## 核心需求

让 workflowhub 执行更快更稳：一个任务同时治三类病——身份与存储一致性（B）、wh-review 审查健壮性（C）、阶段末遗漏披露；并按用户拍板彻底移除已退休的会话绑定机制。全部改动必须守住宪法、保持简洁优雅、不新增维护成本对象。

## 目标

- 目标：让 workflowhub 执行效率真实提升——消除身份/存储错位与审查链路不稳造成的整轮重跑与关闭阻塞；保持宪法边界、保持简洁（不新增维护成本对象）。经 Talk 三轮九组真实回复与最终确认，该目标已确认可执行、可达成（T-001~T-009 + final-confirmation=accepted）。

## 成功/失败边界

- 成功边界：①doctor 能机器核验存储根解析链（env>config>home）与实际写入路径一致，对漂移/可疑第二根如实报警；②旧 Knowledge tree 有只读归档标记（不迁移数据）；③untracked diff 证据冻结时机修复，同类 hash mismatch 不再触发整轮重跑（历史样例重放为 fixture）；④wh-review 的 0 字节/非法输出被 contract_failure 拦截，公共边界无私有路径泄漏（脱敏有测试证明），provider 各终态（timeout/partial/invalid/0字节/unavailable）按处置矩阵如实记录且不阻塞同 task 修复；⑤五份 SKILL.md 阶段末交接含遗漏披露规则且 session-event 引用零残留（B5b 原子批验收：先删后改的中断场景不存在）；⑥绑定移除后：显式/派生/冲突/旧记录四类身份场景各有测试，无绑定环境下 step/skill 记录可由 run 输入显式携带完成正式 run（FND-DD07 补强：验收覆盖 B5/C 全部新增行为）。
- 失败边界：不放宽任何质量 fail-closed 语义；不新增公共行为类（保持七类）；旧记录只读；不新增状态/进程管理对象；不做真异步机制。

## 验收标准

- 验收条件（可验证，逐条有通过/失败判定）：AC-1 doctor 一致性检查输出机器可读报警（通过=对人为构造的解析链漂移报警，失败=漏报/误报）；AC-2 untracked 历史样例重放为 fixture（通过=不再触发整轮重跑，失败=仍 fail）；AC-3 contract_failure 拦截 0 字节/非法输出且公共边界脱敏（通过=有测试证明，失败=泄漏私有路径）；AC-4 provider 终态矩阵如实记录（通过=五种终态各有用例，失败=任一终态被当 pass）；AC-5 身份四类场景测试（通过=显式/派生/冲突/旧记录各绿，失败=缺场景）；AC-6 B5b 原子批零残留（通过=grep 无 session-event 引用，失败=存在先删后改窗口）。
- 验收边界：通过≠宽松——任何 AC 以放宽 fail-closed 为代价达成，整体判失败。

## 范围

- 当前范围：B面=doctor 一致性检查（stage-runtime doctor）、旧 tree 归档标记、untracked diff 证据冻结时机（stage-handlers）、writer 解析来源记录+doctor 交叉核验（FND-D02）；**B5=彻底移除会话绑定机制族**（session-state/session-event/session-hook 三件套、bootstrap 的绑定调用、stage-runtime 的会话身份派生路径；task 身份改为显式 --project/--task 或认证 worktree 派生；step/skill 执行事实改由正式 run 输入显式携带——该通道本就存在且 authoritative）；C面=wh-review broker 输出契约守护（contract_failure 内部标签+partial 处置规则+处置矩阵原则）+ 调用约定文本化；R-006=五份 SKILL.md 阶段末交接文本（与 B5 的 SKILL.md 改写合并为同一批，gated on usability merge）。
- 移除绑定的宪法依据：AGENTS.md"技能可搬运、不绑死单一宿主环境"；宪法"记录事实而非阻断"（绑定令非 Codex 宿主记录系统整体失能）；"简单优先"（M15 退休后该链已成残余）。
- 用户流程/结果只记索引和验收影响，细节进入 spec：用户=使用 workflowhub 的 agent 与任务 owner；流程=任务执行链路本身，无终端页面。

## 非目标

- 不碰任务 A 的领地：stage-runner 失败通道分类器、verify-code 绑定派生、close 授权校验链、预检器。
- 不新增公共行为类（保持 doctor/status/run/review/verify/confirm/authorize 七类）。
- 不做 wh-review 真异步机制（不新增状态对象/进程管理）。
- 不迁移旧 Knowledge tree 数据；不改旧记录。
- 不做遗漏披露的机器核对注入（纯文本规则，T-007）。
- 不做 stage-reflection 复盘器改造（在途 usability 任务）；不做 lesson 预防侧注入（M16 演进）。
- 不改五阶段主骨架语义。

## 决定

```text
### D-001
- question/final_option: B 和 C 怎么装？→ 合并为一个任务（本任务即合并任务）
- recommendation/plain_language: 推荐项；一次五阶段流程治两个病，改动面不重叠
- decision: B（身份/存储一致性）+ C（wh-review 健壮性）同任务推进，任务内分模块
- source_type/reference/exact_excerpt: 用户真实回复 Talk R1（2026-09-02）选①；T-001
- approval_binding: accepted（2026-09-03 用户最终确认"① 确认接受"；host-visible=GUI ask_user_question final-confirmation）
- facts_and_constraints: A 改动面=stage-runner 失败通道/verify-code 绑定/close 链/预检器（F-001）；B/C 区域与其基本不重叠
- Logic: 两问题同源（执行效率）且区域不重叠 -> 合并省一轮流程开销 -> 一个任务两个模块 -> 效率收益最快落地
- choice_reason/impact: 省去第二轮完整五阶段开销；任务体量变大是已接受代价
- consequences_and_risks: 单任务体量变大；一个方向翻车会拖住另一个（缓解：模块独立验收）
- rejected_alternatives: ②拆两个任务（流程开销×2、与A边界协调×2）；③并入在途A（破坏其范围冻结、验收重来）
- unresolved_items/owner: 无
- Supersedes: none

### D-002
- question/final_option: 与任务 A 的时间关系？→ 立即并行、先钉文件级边界
- recommendation/plain_language: 推荐项；最快见效
- decision: 并行开发；边界：本任务不动 stage-runner.mjs 与 task-kernel-implementation.mjs；stage-handlers.mjs 只碰 diff 证据捕获点；stage-runtime.mjs 内部分区——A=命令白名单/预检，本任务=doctor 实现+会话派生路径删除（FND-DD09 补强：同文件不同区域，merge 时若冲突不可调和则本任务让路、A 优先）；五份 SKILL.md 等 usability merge；联合验收=双方契约测试绿（FND-D07 补强）
- source_type/reference/exact_excerpt: 用户真实回复 Talk R1 选①；T-002
- approval_binding: accepted（2026-09-03 用户最终确认"① 确认接受"；host-visible=GUI ask_user_question final-confirmation）
- facts_and_constraints: A spec §6 模块划分（F-001）；FND-D07 审查意见
- Logic: A 在研发且区域可查 -> 钉文件级边界即可并行 -> 立即开工 -> 效率问题不再每天烧时间
- choice_reason/impact: 收益即时；代价是一次小幅 merge 协调
- consequences_and_risks: RISK-001（相邻文件 merge 协调）
- rejected_alternatives: ②等 A 合并（等待期不确定）；③只 B 先行（C 痛点延续、收益低）
- unresolved_items/owner: A 的实际冻结范围以 A 仓内 spec 为准/本任务 owner
- Supersedes: none

### D-003
- question/final_option: untracked evidence hash mismatch 归谁修？→ 留在本任务修
- recommendation/plain_language: 用户覆盖助手推荐项①（划给A），选②
- decision: 本任务修复 diff 证据冻结时机；约束=唯一捕获点在阶段发布时（所有 writer 完成后同事务）；捕获后修改仍 fail-closed；历史样例做 fixture（FND-D06）
- source_type/reference/exact_excerpt: 用户真实回复 Talk R2 选②；T-004
- approval_binding: accepted（2026-09-03 用户最终确认"① 确认接受"；host-visible=GUI ask_user_question final-confirmation）
- facts_and_constraints: 机制真相=diff 证据冻结后未跟踪文件再改导致复核哈希不符（F-007，合并后 stage-handlers.mjs:1583-1590）；main 新增 snapshot materialization 不改变该 fail-closed 约束
- Logic: 问题在本任务主题（执行事实链）内 -> 就地修复 -> 冻结时机对齐发布点 -> 同类整轮重跑消失
- choice_reason/impact: 用户判断该问题与 B 面同源；接受与 A 相邻改动的协调成本
- consequences_and_risks: RISK-001 加深（stage-handlers 与 A 失败通道相邻）；fail-closed 不得削弱是硬约束
- rejected_alternatives: ①划给A（需协调 A 加范围）；③只记事实（重试来源延续）
- unresolved_items/owner: 具体捕获点实现归 build-spec/build-plan
- Supersedes: none

### D-004
- question/final_option: 双 Knowledge tree 怎么处置？→ doctor 一致性检查 + 旧目录只读归档标记
- recommendation/plain_language: 推荐项；用户经一次事实澄清后确认
- decision: doctor 校验存储根解析链（env>config>home）与实际写入路径一致并检测可疑第二根；writer 把解析来源记入 task.json 供交叉核验（FND-D02）；旧 /Users/Hugh/Knowledge 加归档说明，数据不搬不动
- source_type/reference/exact_excerpt: 用户真实回复 Talk R2 重问选①；T-005
- approval_binding: accepted（2026-09-03 用户最终确认"① 确认接受"；host-visible=GUI ask_user_question final-confirmation）
- facts_and_constraints: 解析链三层可漂移且无检查（F-009/F-014）；旧 tree 8/18 后无写入
- Logic: 今日配置唯一但机制允许静默漂移 -> 检查+来源记录 -> 漂移可被如实发现 -> 错位写入可预防
- choice_reason/impact: 符合宪法"旧记录只读保留"；不引入新写入面
- consequences_and_risks: doctor 变厚一点；旧目录永久保留只读
- rejected_alternatives: ②只加检查（旧目录无说明易误解）；③迁移数据（破坏只读、新写入面）
- unresolved_items/owner: 归档说明文本归 build-code
- Supersedes: none

### D-005
- question/final_option: wh-review 异步化做到什么程度？→ 只做契约守护+调用约定
- recommendation/plain_language: 推荐项；不新增进程/状态对象
- decision: broker 边界加输出契约守护（0字节/非法输出→contract_failure 内部标签并保留原文；partial=available-with-failures 逐 provider 保留错误、输入无变化不重试、不得当 pass；contract_failure 非公共行为，公共行为保持七类——FND-D03/D04）；**隐私边界（FND-DD10）：原始错误全文只入任务内部证据区（私有），wh-review 输出 JSON 与任何公共/跨任务边界只保留错误码+脱敏消息，私有路径一律脱敏——现有隐私守卫行为不变**；调用约定文本化（长审查由宿主后台执行+轮询）；处置矩阵原则=如实记录/不重试无变化输入/只限完成声明不阻塞修复，矩阵明细归 build-spec（FND-D05，OPEN-004）
- source_type/reference/exact_excerpt: 用户真实回复 Talk R2 选①；T-006
- approval_binding: accepted（2026-09-03 用户最终确认"① 确认接受"；host-visible=GUI ask_user_question final-confirmation）
- facts_and_constraints: 合并前记录为 broker spawn 无超时；合并后 main 已提供 120000ms 本地 bounded timeout，超时内部标记 `PROCESS_TIMEOUT`、simple runner 对外归一为 `REVIEW_EXECUTION_TIMEOUT`；PUBLIC_RESULT_INVALID 仍是隐私守卫（F-011）
- Logic: 失败语义已分清但守护与约定缺失 -> 补守护+文本约定 -> provider 故障如实可见且不卡死 -> 关闭率回升
- choice_reason/impact: 最小改动命中痛点；真异步机制违反"不新增维护成本对象"被拒
- consequences_and_risks: 长审查依赖宿主后台能力（DSH/Codex 均具备）
- rejected_alternatives: ②真异步（新增状态/进程对象）；③只加超时配置（不解决语义问题）
- unresolved_items/owner: 处置矩阵明细归 build-spec
- Supersedes: none

### D-006
- question/final_option: stage 结束遗漏披露怎么做？→ 纯文本规则，纳入本任务最后实施
- recommendation/plain_language: 用户选定并给实现指示
- decision: 五份 SKILL.md 阶段末交接增补"总结必须列出所有非 completed 的 step/skill 及真实原因"（用户原话指示："看看stage结束的大白话汇报是怎么产生的，在里面加一段遗漏总结和原因汇报即可"）；与 B5 的 SKILL.md 改写合并为同一批，gated on usability 任务 merge
- source_type/reference/exact_excerpt: 用户真实回复 Talk R2 选①+自定义指示；T-007
- approval_binding: accepted（2026-09-03 用户最终确认"① 确认接受"；host-visible=GUI ask_user_question final-confirmation）
- facts_and_constraints: 总结为会话手写、非机器生成（F-015）；机器层已强制每 step/skill 有记录（F-012）
- Logic: 记录已强制存在但总结无披露义务 -> 文本规则补义务 -> 遗漏不再静默 -> 零新对象
- choice_reason/impact: 最省且命中需求；无机器强制是已接受代价
- consequences_and_risks: 靠会话自觉；RISK-004（等 usability merge）
- rejected_alternatives: ②机器核对注入（新投影面+撞文件）；追加到在途 usability（打乱其节奏）；另立小任务（流程成本不成比例）
- unresolved_items/owner: usability merge 时序=外部依赖
- Supersedes: none

### D-007
- question/final_option: 会话绑定机制存废？→ 彻底移除绑定机制族
- recommendation/plain_language: 用户拍板，且纠正助手"M15监控链已退休"（核实属实）
- decision: 移除会话绑定机制族，**拆两个交付批（FND-DD01/DD11 补强）**：**B5a（不 gated）**=stage-runtime 的会话身份派生路径删除 + bootstrap 的绑定调用移除；**B5b（原子批，gated on usability merge）**=session-event/session-hook/session-state 三件套的命令删除 + 五份 SKILL.md 同批改写（"同一会话自动记录"段移除 + D-006 遗漏披露段新增）——CLI 删除与 SKILL.md 改写必须同批原子交付，不允许先删 CLI 留旧指令。**替代身份规则（FND-DD08）**：优先级=显式 --project/--task > 认证 worktree（cwd）派生；缺失或冲突=fail-closed 报错；旧任务记录的 session 字段只读保留；算法明细归 build-spec（OPEN-005）；step/skill 执行事实由正式 run 输入显式携带（既有 authoritative 通道，G-003）
- source_type/reference/exact_excerpt: 用户真实回复 Talk R3 追加："彻底移除绑定机制，M15的监控链已经彻底退休了！请检查"；T-008/T-009
- approval_binding: accepted（2026-09-03 用户最终确认"① 确认接受"；host-visible=GUI ask_user_question final-confirmation）
- facts_and_constraints: 绑定=M15 防串台记录机制（F-017）；M15 监控链 8/30 已退休（F-018，commit 95bfa2247）；剩余消费者仅 stage-runtime/task-bootstrap/5 份 SKILL.md；CONTEXT.md:274 明文拒绝 provenance 扩成宿主身份系统；宪法 S8 可搬运不绑死宿主
- Logic: 绑定使非 Codex 宿主记录系统整体失能且其监控链已退休 -> 残余机制是纯耦合 -> 移除+身份锚换显式派生 -> 任何宿主可执行可记录
- choice_reason/impact: 宪法契合（S8+记录事实而非阻断+CONTEXT:274）；减少维护面；改动集中三处
- consequences_and_risks: 失去 transcript 级 token/耗时采集（M15 退休后已大部分失去）；防串台改由 worktree 派生身份兜底；stage outcome 的 step/skill 校验不变（G-003）
- rejected_alternatives: ①松绑为尽力记录（残留耦合）；③保留+DSH适配（每多一宿主多一适配，与问题同源）
- unresolved_items/owner: 移除的文件清单与测试调整归 build-spec/build-plan
- Supersedes: none

### D-008
- question/final_option: 范围四维判定与裁决？→ 可以做（限制范围）
- recommendation/plain_language: 四维：真实痛点=证据（lessons 逐条+T08 报告）；复杂度/ROI=证据（B小-中/C中/移除绑定减少对象；ROI=消整轮重跑，lessons 计数）；风险影响=证据（改动边界已列到文件级）；时机=证据（用户原文要求 A 研发期并行）
- decision: 裁决=可以做，限制范围=不碰 A 领地、SKILL.md 批次 gated on usability、不做真异步、不做机器核对注入
- source_type/reference/exact_excerpt: 本任务 lessons 统计与 T08 报告；用户 Talk 记录 T-001~T-009
- approval_binding: accepted（2026-09-03 用户最终确认"① 确认接受"；host-visible=GUI ask_user_question final-confirmation）
- facts_and_constraints: R-005 约束（简洁/宪法/不新增维护成本对象）
- Logic: 痛点与改动边界均有证据 -> 限范围推进 -> 收益最大风险可控
- choice_reason/impact: 推翻条件=任务 A 范围扩至 stage-handlers diff 证据；usability 长期不合并；DSH 宿主语义大变
- consequences_and_risks: 见各 D 条目
- rejected_alternatives: 缓一缓（痛点持续烧时间）；不建议做（与证据矛盾）
- unresolved_items/owner: 无
- Supersedes: none
```

## 三轮 talk

| talk_id | 问题/选项 | 后果/风险 | 用户选择/原文 | 队列变化 | source/evidence |
| --- | --- | --- | --- | --- | --- |
| T-001 | B/C 装一个任务还是拆开：①合并 ②拆分 ③并入在途A | ①少一整轮流程开销，风险是单任务体量变大；②互不拖累但流程开销×2、边界协调×2；③不开新任务但破坏 A 范围冻结、验收重来 | 用户选①"合并为一个任务" | 提问时共 3 个开放问题；回答后 OPEN-001 关闭 | 用户真实回复 2026-09-02（Talk R1 组 1/3） |
| T-002 | 与任务 A 的时间关系：①立即并行先钉边界 ②等 A 合并 ③只 B 先行 C 等 A | ①最快见效，风险是个别文件合并小幅协调；②零冲突但等待期不确定、问题持续烧时间；③消除 C/A 语义重叠但 C 痛点延续、收益低 | 用户选①"立即并行、先钉边界（推荐）" | OPEN-002 关闭 | 用户真实回复 2026-09-02（Talk R1 组 1/3） |
| T-003 | R-006 遗漏披露归属：①纳入本任务最后实施 ②追加到在途 usability ③另立小任务 | ①等 usability 合并后动同批 SKILL.md 避免冲突，风险是收尾受其时序牵制；②主题最契合但打乱在途任务；③边界干净但小改动付整轮流程 | 用户选①"纳入本任务、最后实施（推荐）" | OPEN-003 关闭 | 用户真实回复 2026-09-02（Talk R1 组 1/3） |
| T-004 | untracked evidence hash mismatch 修复归属：①划给任务A ②留本任务修 ③只记事实 | ①同类问题同归一处但需协调A加范围；②就地解决，风险是与A撞同一段代码；③零冲突但重试来源延续 | 用户选②"留在本任务修"（覆盖推荐项①） | 提问时共 4 个开放问题 | 用户真实回复 2026-09-02（Talk R2 组 1/4） |
| T-005 | 双 Knowledge tree 处置：①doctor检查+归档标记 ②只加doctor检查 ③迁移旧数据 | 用户先反问"为什么会双tree"；经核实：解析链 env>config>home默认 三层可漂移，旧tree为漂移期残留（8月18日后无写入）；答后用户选① | 用户选①"doctor 检查 + 归档标记（推荐）" | 该题经一次事实澄清后重问收敛；新增事实 F-014 | 用户真实回复 2026-09-02（Talk R2 组 1/4，重问） |
| T-006 | wh-review 异步化程度：①契约守护+调用约定 ②真异步机制 ③只加超时配置 | ①改动最小不新增对象，风险是依赖宿主后台能力；②不依赖宿主但新增状态对象违反简洁约束；③最小但核心语义没解决 | 用户选①"契约守护+调用约定（推荐）" | — | 用户真实回复 2026-09-02（Talk R2 组 1/4） |
| T-007 | 遗漏披露深度：①纯文本规则 ②机器核对+强制注入 | ①零新对象，风险靠会话自觉；②更可靠但新增投影面且撞 usability 文件 | 用户选①并指示："看看stage结束的大白话汇报是怎么产生的，在里面加一段遗漏总结和原因汇报即可"（已核实：总结为会话按各 SKILL.md 阶段末交接规则手写，非机器生成） | 4 题全部收敛，本轮无新增开放问题 | 用户真实回复 2026-09-02（Talk R2 组 1/4） |
| T-008 | session_task_binding_mismatch 归属：①延期独立任务 ②纳入本任务 ③非目标 | 用户自定义回答，超出选项："纳入本任务，我希望改动更大一些，没必要任务绑定会话还绑定宿主，限制性太强了……这个绑定就是严重的违反workflowhub宪法的行为！需要检查为什么要加这个？可否移除？" | 用户指示：纳入本任务，方向=质疑绑定本身存废 | 触发考古（F-017/F-018）后重建选项 | 用户真实回复 2026-09-02（Talk R3 组 1/1） |
| T-009 | 绑定机制存废：①松绑为尽力记录 ②彻底移除 ③保留+DSH适配 | 考古：绑定是 M15 记录系统防串台机制；M15 监控链 8/30 已退休（commit 95bfa2247），剩余消费者仅 stage-runtime 身份派生 + task-bootstrap provenance + 5 份 SKILL.md 文本；绑定不阻断执行但令非 Codex 宿主记录系统整体失能 | 用户选②并纠正助手："彻底移除绑定机制，M15的监控链已经彻底退休了！请检查"（已核实属实） | Talk R3 收敛；无剩余 high/medium 开放问题 | 用户真实回复 2026-09-02（Talk R3 追加 1/1） |

## 调研

| research_id/source | 调研重点 | 关键事实 | 处理状态 | 关联 D |
| --- | --- | --- | --- | --- |
| F-001 | 任务 A 实际改动面（并行冲突判断） | A 触及：stage-runner 失败通道与 verify-code 绑定逻辑、task-kernel close 授权校验链、stage-runtime 命令白名单、契约测试（A spec §6 模块划分：错误分类器/绑定派生器/预检器/诊断器） | verified | 待登记 |
| F-002 | 本任务 B 面拟触及区域 | bootstrap/doctor 一致性（tools/cli/task-bootstrap.mjs、runtime/task/workspace.mjs、runtime/evidence/storage-root.mjs）、快照规则（runtime/task/git-worktree-snapshot.mjs 的 EXECUTION_SNAPSHOT_EXCLUDED_PREFIXES 已存在排除机制） | verified | 待登记 |
| F-003 | session-event 在本宿主可用性 | 实测 `start --stage=make-decision` 返回 unavailable：no codex session id in environment（DSH 非 Codex 宿主）；与 make-decision lesson 的 session_task_binding_mismatch 同源 | verified | — |
| F-004 | 新 worktree 依赖 | worktree 无 node_modules，已符号链接主仓（与历史 lesson 一致） | verified | — |
| F-005 | 权威存储根 | bootstrap 输出 storage_root=/Users/Hugh/Hugh/Knowledge；T08 报告证实 /Users/Hugh/Knowledge 另有精简旧目录（双 tree 事实） | verified | 待登记 |
| F-006 | wh-review 失败前科 | T08：kimi PUBLIC_RESULT_INVALID、总 outcome partial、t08-build-plan-output.json 0 字节（仅 AJV warning）；f17 verify-code lessons：wh-review unavailable 致关闭受阻 | verified | 待登记 |
| F-007 | 快照排除与 untracked hash 真相 | EXECUTION_SNAPSHOT_EXCLUDED_PREFIXES 已含 evidence/ quality/ .multica/（git-worktree-snapshot.mjs:23）；untracked evidence hash mismatch 实为 diff 证据冻结后未跟踪源文件又被改动，handler 用 git hash-object 复核当前文件（stage-handlers.mjs:1583-1590）——是证据冻结时机问题，不是 evidence 目录污染快照；main 新增 snapshot materialization 仍需保留 | verified | 待登记 |
| F-008 | doctor 现状 | 合并后仍仅返回 worktree_root/baseline_commit/materials（stage-runtime.mjs:833-843）；无存储根一致性、无双 tree 检测；main 新增的 preflight/reflect 不属于 doctor 改造区 | verified | 待登记 |
| F-009 | 双 tree 真相 | 旧 /Users/Hugh/Knowledge 顶层 mtime 停留在 2026-08-15（ModelTest/PaperBuilder 旧任务/workflowhub 旧任务各一）；权威根 /Users/Hugh/Hugh/Knowledge 由 env WORKFLOWHUB_TASK_DIR 或 ~/.config/workflowhub/config.json task_dir 解析（storage-root.mjs:34-52） | verified | 待登记 |
| F-010 | wh-review 超时真相 | 合并前 broker spawn 无超时；main 已加入 `DEFAULT_REVIEW_BROKER_TIMEOUT_MS=120000`、超时进程组终止与 `PROCESS_TIMEOUT`（review-provider-client.mjs:9、44-75、287-288）；simple runner 对外归一为 `REVIEW_EXECUTION_TIMEOUT`；本任务不得再新增第二套 timeout/进程生命周期机制 | verified | T10/T11 |
| F-011 | PUBLIC_RESULT_INVALID 语义 | 隐私守卫：broker/provider 输出含本机私有路径即判 invalid（review-provider-client.mjs:38-112）；不是通用传输失败 | verified | 待登记 |
| F-012 | 阶段末总结数据源 | stage outcome 的 step_outcomes/skill_outcomes 已按 manifest 顺序/身份强制校验（stage-runner.mjs:140-158，状态含 completed/failed/skipped/not_applicable）；六部分大白话总结是各 SKILL.md 文本规则（build-code:181、verify-code:109-113） | verified | 待登记 |
| F-013 | 调研方式降级事实 | 两个调研子代理两次启动均中途失败无收尾（宿主子代理机制不可用）；降级为主会话亲自做定点调研，范围未缩小 | verified（过程事实） | — |
| F-014 | 双 tree 成因 | 存储根解析链为 env(WORKFLOWHUB_TASK_DIR) > config(~/.config/workflowhub/config.json task_dir) > home 默认（storage-root.mjs:34-52）；config 创建于 2026-07-24 指向 Hugh/Knowledge；旧 tree 为漂移期残留（workflowhub 最后写入 8/18，PaperBuilder 8/12），成因无法完全考古（env 漂移或 task_dir 后补），但今日配置唯一且全部新写入落在权威根 | verified（成因部分为推断，已标注） | T-005 |
| F-015 | 大白话总结产生方式 | 各阶段总结为会话按 SKILL.md「阶段末交接」文本规则手写（build-code:181、verify-code:109-113），非机器生成；R-006 落地=修改五份 SKILL.md 的交接规则文本 | verified | T-007 |
| F-016 | wh-review 路由配置 | ~/.config/workflowhub/config.json 的 wh_review.profiles/stages 定义各阶段 provider 列表与 minimum_heterologous=1；broker=3rd-review 脚本（config.third_review.command） | verified | — |
| F-017 | 会话绑定考古 | 绑定=M15 记录系统防串台机制（一同会话一任务，transcript token/耗时采集的身份锚）；不阻断执行，只令非 Codex 宿主的记录命令失败（归档决策三次记录"unavailable 不阻塞"：stage-reflection-20260830 决策 F-008 等） | verified | T-008/T-009 |
| F-018 | M15 退休核实 | commit 95bfa2247（2026-08-30 "chore: retire M15 monitoring"）已删除 monitoring-facts/projector/page/diagnostics/transcript-adapter 全链；剩余 session-state 消费者仅：stage-runtime.mjs（--project/--task 省略时的身份派生+bindCurrentSessionOutcome 把会话事件转为 stage receipts，显式 receipt 本就是 authoritative 通道）与 task-bootstrap.mjs（provenance 绑定，失败不阻塞）；5 份 SKILL.md 引用 session-event 命令。用户声明"M15 监控链已彻底退休"属实 | verified | T-009 |
| F-019 | main 合并后当前基线 | `main`=`f4f2ae20b` 已合并 usability 与 verify-close；stage-runtime 保留 preflight/reflect，bridge 保留 stale-review 校验，wh-review 已有 120000ms bounded timeout；五份 workflow SKILL.md 仍保留 session-event 指令；ADR 0023 已占用 | verified | T-001~T-014 重基线 |

## grill

| grill_id | CONTEXT/冲突 | 结论 | ADR/四项退出 | source/evidence |
| --- | --- | --- | --- | --- |
| G-001 | 覆盖矩阵五类全落实：goal=R-005+T-009（移除绑定反而减少对象）；flow_or_surface=non_ui 已记录；data_or_state=task store/lessons/wh-review 输出/快照哈希/session 三件套删除；success_failure=成功/失败边界+处置矩阵原则+fail-closed 不削弱（FND-D06）；constraint_non_goal_defer=非目标清单+gated 项+DE 项 | 零用户提问：所有候选问题均被代码/文档事实回答（理由见下），无剩余方向改变项 | 见"文档结果"节 | CONTEXT.md:274、CONSTITUTION.md S8、F-012、F-017/F-018 |
| G-002 | 冲突发现：CONTEXT.md:274 明文拒绝"把 provenance 扩成宿主身份系统"，而会话绑定实际漂移成了宿主身份前置——文档与本方向一致，冲突在现实代码；处置=移除绑定即消解冲突，CONTEXT 无需改义，只在移除后核对残留术语（:127/:132 监控来源条款随 M15 退休状态核实，机械核对归 build-code） | 冲突已定位，处置明确 | 四项退出：①外部接口核实=pass（wh-review broker 协议经一次真实调用核实 F-010/F-011/F-016；移除方向使 DSH 适配接口核实不再必要）；②命名唯一=pass（task id/worktree/branch/存储根/contract_failure 均已钉死）；③失败语义=pass（处置矩阵原则+fail-closed 不削弱，明细归 build-spec）；④范围边界=pass（非目标+文件级边界写死） | 同上 |
| G-003 | "移除绑定后是否废除 step/skill 级机器记录"——由事实回答、不问用户：不可废除，stage outcome 强制按 manifest 校验 step_outcomes/skill_outcomes（stage-runner.mjs:140-158），且在途 usability 任务的 stage-reflection 消费它；因此保留记录能力、仅把身份锚从会话改为显式 run 输入（该通道已存在且 authoritative，stage-runtime.mjs:325-331 注释证实） | 能力保留、锚更换 | — | stage-runner.mjs:140-158；stage-runtime.mjs:325-331 |

## grill 不提问的事实理由

候选队列中唯一高/中影响问题（step/skill 记录能力存废）被代码事实唯一确定（G-003）；CONTEXT 冲突处置为机械核对（G-002）；其余均为 spec 层细节。故本 Grill 无用户提问，非跳过：覆盖矩阵、四项退出检查、CONTEXT/ADR 判定均已执行并记录。

## 审查处置

| finding_id | 原始事实/来源 | 后果 | status | next_action/evidence_ref | owner/consumer/retain_or_delete |
| --- | --- | --- | --- | --- | --- |
| （方向审查 direction，2026-09-03，available/partial） | material_id=cbf78a5fba0db0d3804c53b4422eef01895176e2e62008a5542548b6e50a3972；runtime_id=b7450665-e94d-4a1a-ad93-607206856fce；pi/coding=RATE_LIMITED、opencode/pax3.8=PROVIDER_IDENTITY_INVALID（均如实保留不重试）；antigravity/flash 与 codex/luna 有效 | 8 条 major findings | — | /tmp/wh-review-direction-result-20260902.json（临时）；正式记录见下方 FND 行 | — |
| FND-D01 | session_task_binding_mismatch 在方向定界遗漏归属（antigravity F1 + codex F4 同源） | 执行身份链子项无归属 | **fixed（用户拍板 T-008/T-009）**：纳入本任务，方向=彻底移除会话绑定机制（非加 DSH 适配） | 范围新增 B5（见范围节）；考古事实 F-017/F-018 | agent/保留 |
| FND-D02 | writer 只有 doctor 被动检查，缺主动对齐解析链（antigravity F2） | 写入路径错位只能事后发现 | fixed（方向增补）：B1 扩为"writer 记录解析来源（env/config/default）入 task.json + doctor 交叉核验" | 决策卡方向段已更新 | agent/保留 |
| FND-D03 | partial 处置规则缺失（antigravity F3） | partial 无语义归宿 | fixed（方向增补）：C1 契约守护含 partial=available-with-failures、逐 provider 保留错误、输入无变化不重试、不得当 pass | 决策卡方向段已更新 | agent/保留 |
| FND-D04 | contract_failure 与"不新增公共行为类"关系未说明（codex F5） | 可能被误读为第八类行为 | fixed（澄清）：contract_failure 是 wh-review 输出 JSON 内部 error.code 标签，非公共行为；公共行为保持七类 | 决策卡方向段已更新 | agent/保留 |
| FND-D05 | C 面缺 timeout/partial/invalid/0字节/unavailable 的终态+重试+完成条件处置矩阵（codex F6） | 可能挂起/误判成功/绕过审查 | fixed（方向增补）：方向包含处置矩阵原则（如实记录、输入无变化不重试、只限完成声明不阻塞修复），矩阵明细在 build-spec 细化 | 决策卡方向段已更新 | agent/保留 |
| FND-D06 | untracked 重新捕获缺约束（codex F7） | 可能削弱 fail-closed | fixed（方向增补）：唯一捕获点=阶段发布时（所有 writer 完成后同事务）；捕获后修改仍 fail-closed；历史样例做 fixture | 决策卡方向段已更新 | agent/保留 |
| FND-D07 | 与 A/usability 缺文件级归属与合并顺序（codex F8） | 并行冲突无操作化约束 | fixed（方向增补）：文件级边界表入方向（本任务不动 stage-runner.mjs/task-kernel-implementation.mjs；stage-handlers.mjs 只碰 diff 证据捕获点；五份 SKILL.md 等 usability merge）；联合验收=双方契约测试绿 | 决策卡方向段已更新 | agent/保留 |
| FND-D08 | provider 失败事实（pi/coding 限流、pax3.8 身份失效） | 本阶段异源覆盖=2 家有效 | accepted_risk：minimum_heterologous=1 已满足；失败如实保留，输入无变化不重试（wh-review 规则） | 无需行动 | agent/保留 |
| （细节审查 detail，2026-09-03，available/partial） | material_id=c8817ca69a3ca913ed8b0e27aa5f24f80c8f8db9b81f8d59e80df7b30421a860；runtime_id=49c3a8b4-1788-4b33-93ac-73f277f950e9；antigravity/flash+codex/luna 有效；grok/grok、opencode/pax3.8=PROVIDER_IDENTITY_INVALID 如实保留 | 11 条 findings | — | /tmp/wh-review-detail-result-20260902.json（临时） | — |
| FND-DD01 | B5 删 CLI 与 SKILL.md 改写不同批会导致旧指令引用不存在命令而中断（antigravity F1） | 执行态崩溃风险 | fixed：B5 拆 B5a（不 gated）/B5b（CLI 删除+SKILL.md 改写同批原子交付，gated on usability merge） | D-007 已更新 | agent/保留 |
| FND-DD02 | 未决项表 OPEN-001~003 仍标待决（antigravity F2） | 全文自相矛盾 | fixed：未决项表已标关闭并链接 D/T 记录 | 未决项节 | agent/保留 |
| FND-DD03 | 拒绝方案表留占位符（antigravity F3） | 结构化查阅缺失 | fixed：已回填 15 条被拒方案 | 拒绝方案节 | agent/保留 |
| FND-DD04 | step 6 执行记录停在"等待结果"（antigravity F4） | 记录与现实脱节 | fixed：阶段执行记录已更新 | 阶段执行记录节 | agent/保留 |
| FND-DD05 | approval_binding 全部 pending、缺最终确认（codex F5，blocking） | 无授权不得交付 | needs_human → 流程内解决：step 11 用户最终确认后回填所有 approval_binding | 本阶段 step 11 | 用户/agent/保留 |
| FND-DD06 | 未决项表矛盾（codex F6，与 DD02 同源） | 同上 | fixed（同 DD02） | 未决项节 | agent/保留 |
| FND-DD07 | 验收未覆盖 B5/C 新增行为（codex F7） | 新范围无验收 | fixed：成功边界补⑥（四类身份场景测试/无绑定环境正式 run/终态矩阵/脱敏证明/零残留） | 成功/失败边界节 | agent/保留 |
| FND-DD08 | 绑定移除后的身份解析规则欠定义（codex F8） | 实现可能各自约定 | fixed（方向级规则）+ OPEN-004/005 转 build-spec：优先级=显式>worktree 派生；缺失/冲突 fail-closed | D-007 已更新 | agent/保留 |
| FND-DD09 | stage-runtime.mjs 与 A 的边界非真正互斥（codex F9） | merge 冲突无处置 | fixed：文件内分区（A=白名单/预检；本任务=doctor+会话派生删除）；冲突不可调和时本任务让路 | D-002 已更新 | agent/保留 |
| FND-DD10 | 保留原始错误与隐私守卫未调和（codex F10） | 可能泄漏私有路径 | fixed：原始全文只入任务私有证据区；公共边界只留错误码+脱敏消息；守卫行为不变 | D-005 已更新 | agent/保留 |
| FND-DD11 | runtime 移除被 usability merge gate 住的耦合（codex F11，与 DD01 同源） | 文档可能引用已删机制 | fixed（同 DD01 的 B5a/B5b 原子批拆分） | D-007 已更新 | agent/保留 |

## 最终确认

- 状态：**accepted**（2026-09-03，Talk 三轮 + Grill + 双向审查完成后）
- 用户原文与 host-visible 绑定：最终决策卡确认，用户真实回复"① 确认接受（推荐）"（ask_user_question final-confirmation）；确认记录=human-confirmation.v3（content-addressed，见 quality/confirmations/，决策卡确认后才生成，本文不反向引用其哈希以免自我失效）
- 确认卡内容：一句话方向 + 六项范围 + 非目标 + 19 条审查 findings 处置 + 主要风险 + 延期交接（DE-001/DE-002、OPEN-004~007）
- 未确认内容：无；拒绝=有界修订条款已随卡呈现未被触发

## Talk 轮次映射说明

逻辑三轮（Talk R1/R2/R3）在 aggregate 中按物理 ask 循环记为 5 轮：R1=初始 3 题；R2=范围 4 题；R3=双 tree 澄清重问（用户反问后重建卡）；R4=绑定归属（用户自定义回答触发考古）；R5=绑定存废（考古后重建卡）。每轮均真实 ask→wait→reply→resume。

## 拒绝方案

| 选项 | 拒绝理由 | 关联 D |
| --- | --- | --- |
| B/C 拆成两个任务 | 流程开销×2、与 A 边界协调×2，恰是要治的"慢" | D-001 |
| 并入在途任务 A | 破坏 A 范围冻结、验收重来 | D-001 |
| 等 A 合并后再开始 | 等待期不确定、问题持续烧时间 | D-002 |
| 只 B 先行、C 等 A | C 痛点延续且 C/A 代码重叠小、等待收益低 | D-002 |
| untracked hash 划给任务 A | 用户拍板留本任务（T-004，覆盖助手推荐） | D-003 |
| untracked hash 只记事实不修 | 重试风暴来源延续 | D-003 |
| 迁移旧 Knowledge tree 数据 | 破坏旧记录只读原则、引入新写入面 | D-004 |
| 旧 tree 完全不管 | 无说明易误解 | D-004 |
| wh-review 真异步机制 | 新增状态/进程对象，违反"不新增维护成本对象" | D-005 |
| 只给 broker 加超时配置 | 0字节/partial 语义问题不解决 | D-005 |
| 遗漏披露机器核对注入 | 新增投影面且撞 usability 文件 | D-006 |
| R-006 追加到在途 usability 任务 | 打乱其执行后期节奏 | D-006 |
| R-006 另立小任务 | 小改动付整轮流程成本 | D-006 |
| 会话绑定松绑为尽力记录 | 残留耦合，问题只治一半 | D-007 |
| 保留绑定+加 DSH 适配 | 继续加深宿主耦合，每多一宿主多一适配 | D-007 |
| 移除绑定先删 CLI、SKILL.md 后改 | 旧指令会引用不存在命令导致中断（FND-DD01/DD11）；必须同批原子交付 | D-007 |

## 风险与延期交接

| risk/deferred_id | 风险或延期内容 | 触发/后果 | 处理阶段/owner |
| --- | --- | --- | --- |
| RISK-001 | 与任务 A 同改 runtime/stage/ 或 tools/cli/stage-runtime.mjs 的 merge 冲突；T-004 选择②后，本任务 additionally 碰 stage-handlers.mjs（diff 证据冻结时机），与 A 的失败通道改动相邻 | 两任务并行推进且触及相邻代码 | 本任务规划阶段钉文件级边界；merge 时协调 |
| RISK-002 | C 的"unavailable 不阻塞修复"语义与 A 的协议/质量分类器在 verify-code 边界语义重叠 | 两任务对同一失败通道给出不同分类 | 边界约定：A 管阶段内绑定/分类；本任务 C 只管 broker 输出契约与调用约定文本 |
| RISK-003 | session-event 在 DSH 宿主不可用，本阶段执行记录缺机器 receipt | 全程 | 如实记 unavailable；不补填 |
| RISK-004 | R-006 改五份 SKILL.md 与在途 usability 任务撞同批文件 | usability 未合并 | R-006 排在最后，gated on usability merge（镜像其 P6 对 M16 的做法） |
| RISK-005 | 宿主子代理机制不稳定（本阶段两次失败），后续阶段重活委派可能受阻 | 子代理再次失败 | 降级主会话亲自执行并如实记录（F-013 已有先例） |
| RISK-006 | grok/grok 与 opencode/pax3.8 连续两次审查 PROVIDER_IDENTITY_INVALID | provider 配置失效面扩大 | OPEN-007：用户择机核查；本任务不阻塞（minimum_heterologous=1 满足） |
| DE-001 | lesson 预防侧注入（阶段执行前把历史 lesson 注入技能） | 归 M16 候选池演进 | M16 后续任务 |
| DE-002 | CONTEXT.md :127/:132 监控来源术语残留核对、ADR 0012 退休状态标注 | 机械文档核对，不改变方向 | build-code |

## 质量边界

- 质量事实：session-event unavailable、调研事实 F-001~F-006、后续 review/Grill 事实
- 推进资格：质量缺失不阻断同 task 修复与 Talk 推进（宪法）
- 完成判据：Talk 三轮真实完成 + Grill + 双向 advice review + 用户确认 + interaction aggregate + stage-end spec-analyze
- 不可逆授权边界：本阶段不授权任何代码改动、commit、push

## 未决项

| item_id | 未决内容 | 原因 | 谁在何时解决 |
| --- | --- | --- | --- |
| OPEN-001 | ~~B/C 合并或拆分~~ **已关闭** → D-001 | T-001 用户选① | 已解决 |
| OPEN-002 | ~~与 A 并行策略~~ **已关闭** → D-002 | T-002 用户选① | 已解决 |
| OPEN-003 | ~~R-006 归属~~ **已关闭** → D-006 | T-003 用户选① | 已解决 |
| OPEN-004 | wh-review 处置矩阵明细（timeout/partial/invalid/0字节/unavailable 各自的终态+重试条件+完成影响） | 方向只定原则，明细是 spec 层 | build-spec 阶段 |
| OPEN-005 | 身份解析算法明细（显式标志 > worktree 派生的优先级、缺失/冲突的 fail-closed 行为、旧记录兼容） | 方向只定规则，算法是 spec 层 | build-spec 阶段 |
| OPEN-006 | untracked diff 证据唯一捕获点的实现位置 | 方向只定约束（发布时同事务） | build-plan 阶段 |
| OPEN-007 | grok/grok 与 opencode/pax3.8 连续两次 PROVIDER_IDENTITY_INVALID | 疑似 provider 配置失效；不阻塞本任务（minimum_heterologous=1 已满足） | 用户/环境 owner 择机核查 provider 配置 |

## UI applicability

```json
{"result":"non_ui","sources":{"raw_requirement":{"fact":"执行身份/存储治理与审查代理健壮性，全部位于 runtime/CLI/broker 边界；用户原文无任何页面、交互或视觉诉求","conclusion":"non_ui"},"project_inventory":{"fact":"本仓唯一页面为 monitor 静态 HTML（build-reflection-page）；本需求不改其布局/视图；B 面 doctor/status 为 CLI 文本输出","conclusion":"non_ui"},"planned_or_changed_frontend_fact":{"fact":"无前端变更计划；stage 结束大白话总结为会话文本，不是页面","conclusion":"non_ui"}},"source_reasons":[],"recomputed_at":"make-decision step 2"}
```

## 收敛检查

| 维度 | 用户答案 | 材料引用 | 可执行验收 |
| --- | --- | --- | --- |
| 目标 | 用户已确认：提升执行效率——身份/存储一致性 + wh-review 健壮性 + 阶段末遗漏披露 + 彻底移除会话绑定机制；约束=简洁优雅、不违宪法、不新增维护成本对象（T-001~T-009 九组真实回复 + 最终确认"① 确认接受"） | R-005/R-006/R-101/R-102；D-001~D-008 | 验收：D-008 判定=可以做且范围有限；全部需求条目在覆盖矩阵有处置；final-confirmation=accepted |
| 范围 | 用户已确认：B面（doctor 一致性/旧 tree 归档/untracked 冻结时机/writer 来源记录）+ B5（移除绑定，B5a/B5b 分批）+ C面（契约守护+调用约定）+ R-006（SKILL.md 文本，gated）；用户同时确认非目标与文件级边界（不碰 stage-runner.mjs 等） | 范围/非目标节；D-002/D-007 | 验收：范围六项与非目标清单均在 decision-log；build-spec 开工时逐项核对无范围漂移 |
| 方案 | 用户已确认（T-001~T-009）。取舍：合并任务+立即并行+纯文本披露+契约守护，以零新增对象换约定靠自觉。被拒方案：B/C拆分、等A、真异步机制、机器核对注入、迁移旧树、DSH适配、松绑保留绑定（拒绝方案节15条）。未决项：OPEN-004~006 处置矩阵/身份算法/捕获点明细延期至 build-spec/build-plan，OPEN-007 provider 配置核查归用户择机 | D-001~D-007；拒绝方案节；OPEN-004~007 | 验收：每个 D 有 rejected_alternatives+consequences；OPEN-004~006 有明确归属阶段 |
| 验收 | 用户已确认验收来源与通过/失败形态（最终确认卡含验收与失败边界） | 成功/失败边界节；验收标准节 AC-1~AC-6；D-008 | 场景：契约测试绿+异源审查完成+历史错误样例重放为 fixture+人为构造漂移报警。数据来源：lessons 真实失败 payload 与人为构造场景。通过：同类错误不再触发整轮重跑，0字节被 contract_failure 拦截，doctor 报警可复现，四类身份场景测试各绿。失败：放宽 fail-closed，新增公共行为类，旧记录被改，存在先删后改窗口 |

## 文档结果

- CONTEXT.md：no-change（本阶段）；理由：:274 已明文拒绝"provenance 扩成宿主身份系统"，本方向与该条款一致，冲突在现实代码而非文档；移除后核对 :127/:132 监控来源术语残留的机械动作归 build-code
- ADR：判定=应创建（三项判据全真：移除绑定难以反转/无背景会意外/真实取舍=防串台与token采集 vs 可搬运性与简洁）；文件创建归 build-code（治理边界：make-decision 只维护四份材料），标题建议 docs/adr/00xx-remove-host-session-binding.md
- ADR criteria：hard to reverse=true / surprising without context=true / genuine trade-off=true
- 术语/ADR 冲突及处理：CONTEXT.md:274 vs 现实绑定漂移 → 由 D-007 移除方向消解；ADR 0012（task-local monitoring）随 M15 退休状态由 build-code 核对标注
- 不复制 spec 的边界：本 log 只做决策索引

## Exit checks

- 上下文一致：pass（Talk 三轮+Grill 事实互证；F-001~F-018 全部带文件级证据）
- owner/接口一致：pass（与 A/usability 文件级边界；wh-review broker 协议经真实调用核实）
- 失败语义明确：pass（处置矩阵原则+fail-closed 不削弱+contract_failure 为内部标签）
- 范围与延期明确：pass（非目标节+DE 项+gated 项写死）

## Supersedes

无（本任务首次决策）。

# Decision Log

任务：workflowhub-m17-repo-skills-multicli-20260903
阶段：make-decision（进行中）

## 原始需求

| source_id | 原始需求/约束 | 来源引用/原文摘录 | 关联事实 | 处理状态 |
| --- | --- | --- | --- | --- |
| R-001 | 检查 M17 剩余工作、判断是否值得启动标准流程 | 用户原文：「现在M16已经做完了，应该做M17了，帮我检查M17的任务还有多少要做的，有没有必要启动一次workflowhub标准流程？」（2026-08-31 会话） | roadmap 无单一 M17，实为 M17a+M17b；能力面大部已完成，缺口径固化 | 已覆盖[goal]：F-001~F-004、D-002 |
| R-002 | 用户主张两条已验证事实，要求以此为基础核查 | 用户原文：「'干净环境无 superpowers 可跑通'我已经验证过很多次了，本机superpowers早就删了，但是workflowhub任务还是一直可以还跑通」「workflowhub流程我已经在codex、claude code、kimi code、dsh上面试过很多次了，都没问题。请仔细检查整个M17还有哪些任务需要做的」 | 调研证实结构性证据支持（29 依赖技能全 repo-local、resolver 硬锁、无 superpowers 运行时引用） | 已覆盖[data_or_state]：F-001/F-002 + D-001 |
| R-003 | 分析 6 项剩余工作必要性；研究三个方向追加工作 | 用户原文：「可以都做，但是需要分析一下这6项的必要性。同时帮我再研究一下M17还能做那些工作？主要方向是skill整理、workflowhub项目简化、多cli支持深化等。」 | 必要性裁定完成（6 项全必要，#2 收窄 #6 扩大）；三方向候选已出 | 已覆盖[goal]：D-001/D-002/D-003 + F-003/F-004 |
| R-004 | 兼容区迁移和 Claude/Kimi adapter 进 M17；延期任务整理成最少数量写成 md 放下载文件夹；确认当前任务范围 | 用户原文：「兼容区迁移和Claude/Kimi adapter都进M17，帮我把需要转到以后做的任务，整理成最少的任务数量，每个任务里详细描述一下背景、分析和目标，写成md文件放在本机下载文件夹中。然后再确认一下当前任务要做的工作有哪些？」 | 已交付 `/Users/Hugh/Downloads/workflowhub-m17-deferred-tasks.md`（F1/F2/F3 + capability 附录）；17 项范围清单已确认 | 已覆盖[constraint_non_goal_defer]：延期交接 F-004、D-002/D-005；已覆盖[success_failure_acceptance]：D-001、F-001 |
| R-005 | 按标准流程执行 M17，从 make-decision 开始不跳阶段；与用户共同梳理五维；Talk 大白话；decision-log 记录要求 | 用户原文：「task-close + artifact-dir 主体迁移已并入延期任务 F2 没问题。接下来请按标准 WorkflowHub 开始M17任务吧，从 make-decision 开始，不要跳阶段，也不要依赖 build-spec 补需求。先基于原始需求，在make-decision的过程中和我一起仔细梳理完整用户流程、页面范围、数据状态、成功/失败边界、非目标和延期项。Talk 请用大白话说明选项、后果和风险；decision-log 记录原始需求、关键事实、选择、理由和延期交接。」（2026-09-03） | 本阶段按 14 步 manifest 执行；Talk/Grill 大白话问答卡；log 记录原始需求/关键事实/选择/理由/延期交接 | 已覆盖[flow_or_surface]：T-001~T-010、D-001 + 阶段步骤记录 |
| R-006 | Talk/Grill 问答必须用宿主问答工具呈现，不在聊天正文里展示问答卡 | 用户原文：「不要在聊天内容中显示问答交互，请使用问答工具」（2026-09-03） | 流程呈现约束，Talk 卡内容不变只换呈现通道 | 已覆盖[flow_or_surface]：Round 2 起全部问答经宿主问答工具呈现、D-001 |


## 任务背景与动机

- 目标：兑现 roadmap（draft-v3.3）M17a「repo-contained skills 运行时适配」与 M17b「多 CLI 兼容验证」的全部可执行验收；合并完成 skill 整理、项目简化、多 CLI 深化三个方向已确认的追加范围；使 M17 可宣告完成并解锁 M18（打包分发）。

## 成功/失败边界

- 成功边界（T-001+T-004 用户确认口径）：以"实际跑得通"为前提，roadmap M17a 五条 + M17b 五条验收逐条**最小留证**——每项记录类产出只做最小版本（一个汇总文档、一个测试文件、一次存档输出）；已确认 17 项范围全部落地或有诚实的不做记录；归位/收敛类工作零行为变更（契约测试全绿）。
- 失败边界（T-001+T-004 用户确认口径）：任何验收条出现口径漂移或伪造通过；新增无当前消费者的控制面/配置面；归位类工作混入行为变更；缺字段被编造而非记 unknown/unavailable；"从简"被偷换成"不做"。

## 范围

- 当前范围（17 项=原 18 项移出⑩ Kimi spike（T-002），用户 2026-09-03 前已确认，详见会话记录）：
  - 主线 A（M17a/M17b 验收兑现）：①`repo-skills.manifest.json` 生成器（从 `skills/catalog.yaml` 生成）②metrics_enabled 声明+扫描（挂现有 checker，不新建控制面）③X2/X3/X4 处置（X3 补 semver、X4 改标 adopted、X2 记录不引入）④`cli-tool-mapping.md`+Codex 核实记录+Claude E2E 样例记录 ⑤CLI 归一契约测试（Codex/DSH parity）+Claude outcome-packet e2e ⑥`clean-install.mjs` 留档。
  - 主线 B（多 CLI 深化）：⑦host-protocol 死约定清理 ⑧显式宿主身份与 Stage Agent outcome 契约 ⑨Claude/宿主显式 outcome 接线验证 ⑪文档对齐。~~⑩Kimi 格式 spike~~（T-002 移出，用户 2026-09-03 选「本次不碰 Kimi」）。
  - 主线 C（skill 整理+结构簿记）：⑫孤儿三技能裁定 ⑬reuse-registry 同步+status 词表+_spike 审计 ⑭删 `core/fact-indexes.mjs`+评估 parse-framework-config ⑮review 双副本收敛 ⑯stage-content-contracts 方案三纯归位 ⑰task-capability 迁移+登记 ⑱move-map 全面修复+Knowledge 回写。
- 用户流程/结果只记索引和验收影响，细节进入 spec：本任务无终端用户页面流程；「用户」= workflowhub 的使用者（各 CLI 宿主中的开发者和 AI 助手），流程影响索引：多 CLI 接入流程（⑧⑨⑪）、技能分发/打包前置（①②③）。

## 非目标

- F1 多 CLI seam 泛化 + cli_map 兑现（延期，见 `/Users/Hugh/Downloads/workflowhub-m17-deferred-tasks.md` F1）
- F2 task-close/artifact-dir 主体迁移 + facts 双轨合并（延期，同上 F2；用户 2026-09-03 确认「task-close + artifact-dir 主体迁移已并入延期任务 F2 没问题」）
- F3 stage 层函数级拆分/去 barrel/死导出清理/stage-handlers·stage-runner 评估（延期，同上 F3）
- capability 扩展（requirement_message 之外的 transcript 能力；无限期延期，零消费者+遥测红线）
- WorkflowHub 读取、扫描或反查 Claude/宿主 transcript；`WORKFLOWHUB_SESSION_ID`、handoff schema v2 及已删除的旧 session-state/event/hook 模块不再作为 M17 实现目标（D-010）
- 合并 spec-\* 族 / plan-\*-review 族技能（调研证实分工清晰，合并才违规）
- 全量补齐 29 个技能的防外部路径合同测试（现有 4 个+guard 已够，过度工程）
- M14b 遗留 `skills-inventory.json`（roadmap v3.3 已明确 M17a 不依赖）
- 任何 UI/页面工作（本任务无页面范围，见 UI applicability）
- Kimi 接线与 Kimi 会话格式调研（T-002，用户 2026-09-03 选「本次不碰 Kimi」；全部 Kimi 工作并入 DEF-001 F1，supersedes R-004 中「Kimi adapter 进 M17」）

## 需求覆盖矩阵（五维）

| 维度 | 内容 | 来源 | 处置 |
| --- | --- | --- | --- |
| 业务目标 | M17a+M17b 验收兑现 + 三方向深化，解锁 M18 | R-001/R-003 + roadmap L448-482 | 当前范围 |
| 流程/表面 | 无页面；多 CLI 宿主接入流程、技能打包前置 | R-002/R-004 + 调研 | 当前范围（主线 B + A ①②③） |
| 数据/状态 | catalog.yaml（机器真相）→manifest 生成物；显式 `--project/--task` 身份；Stage Agent outcome→bridge→run；move-map 登记；facts 不动（F2 延期） | R-004、D-010、ADR-0024 | 当前范围 + 延期交接 |
| 成功/失败/验收 | roadmap M17a/M17b 各五条验收 + 零行为变更约束 | R-005 + roadmap | 成功/失败边界（草案待 Talk 确认） |
| 约束/非目标/延期 | F1/F2/F3 + capability 无限期 + 流程不跳阶段 | R-004/R-005 | 非目标节 + 风险与延期交接 |

## 核心需求

六条原始需求压缩为一：把 workflowhub 的 repo-contained skills 运行时与多 CLI 日常事实固化成仓内可复查证据（M17a/M17b 十条验收），并完成技能整理/项目简化/多 CLI 接线深化共 17 项工作，Kimi 与 capability 类事项按书面交接延期。

## 目标

让 M17 宣告完成成立：干净环境可复现跑通、十条验收逐条有最小留证、多 CLI 接线与账面债务清账，为 M18 打包分发解锁（非目标与延期见「范围与边界」节，DEF-001~DEF-004 已书面交接）。

## 决定

每个决定都使用唯一的 `decision-entry.v1` 字段；每个字段只写决策所需的一句话或一个来源引用，不复制 spec：

```text
### D-001
- question/final_option: M17 完成判据怎么定 → 以实际跑通为前提，十条验收逐条最小留证
- recommendation/plain_language: 折中方案的用户修订版；从简≠不做，每项记录类产出只做最小版本
- decision: 判据=roadmap M17a/M17b 十条验收逐条有最小留证（一个汇总文档/一个测试文件/一次存档输出）
- source_type/reference/exact_excerpt: 用户回答 T-001「1-2」+T-004「4-1」
- approval_binding: 待阶段末最终确认绑定
- facts_and_constraints: F-001/F-002（能力已在，缺留证）；M17b 验收点名要求记录类产出
- Logic: 能力已验证→缺的是可复查证据→最小留证→M17 可宣告完成且 M18 不被卡
- choice_reason/impact: 兼顾省时与验收字面；影响=记录类工作保留最小版
- consequences_and_risks: 「从简」执行中滑向「不做」→已写入失败边界防线
- rejected_alternatives: 严格留证（过重）；记录全砍（M18 被卡）；折中砍半（验收缺两条）
- unresolved_items/owner: 无
- Supersedes: none

### D-002
- question/final_option: M17 范围 → 17 项（Kimi 移出）
- recommendation/plain_language: Kimi 本次不碰，全部并入延期 F1
- decision: 范围=17 项清单；Kimi 接线与格式调研移出
- source_type/reference/exact_excerpt: 用户回答 T-002「2-3」（supersedes R-004 中「Kimi adapter 进 M17」）
- approval_binding: 待阶段末最终确认绑定
- facts_and_constraints: Kimi 仓内零 adapter、格式未知；验收只要求 Claude+Codex
- Logic: Kimi 无验收要求且格式未知→投入不可控→移出→范围可控
- choice_reason/impact: 保范围可控；影响=主线 B 剩 4 项（⑦⑧⑨⑪）
- consequences_and_risks: 多 CLI 故事缺 Kimi 一角→F1 承接
- rejected_alternatives: 摸底量力而行（用户已否）；尽力接通（不可控）
- unresolved_items/owner: Kimi 整体→DEF-001 F1
- Supersedes: R-004 部分

### D-003
- question/final_option: 外部调研范围 → Claude 会话格式+技能分发生态（M18 预热）
- recommendation/plain_language: 两项均已完成并落盘
- decision: F-005（Claude 格式可行）+F-006（分发基准=Claude plugin schema；X3 用 engines 风格声明）
- source_type/reference/exact_excerpt: 用户回答 T-003「3-2」
- approval_binding: 待阶段末最终确认绑定
- facts_and_constraints: F-005/F-006 全部证据（本机实证+官方文档+32 来源 URL）
- Logic: 接线硬前提未核实不得带假设→调研→adapter 设计有据
- choice_reason/impact: X3 semver 声明采用 engines 风格；M18 获得分发基准预研
- consequences_and_risks: M18 预热可能返工（用户已接受）
- rejected_alternatives: 只查格式；不查
- unresolved_items/owner: 主仓 docs/research 三份文件归档→build-plan
- Supersedes: none

### D-004
- question/final_option: Claude adapter 落点 → tools/host（宿主工具区）
- recommendation/plain_language: 与 Codex 钩子一族同区，anti-host 守卫零改动，三级 locate 全可用
- decision: adapter 放 tools/host/；runtime 保持零 .claude 路径引用；locate=hook 注入→目录探测→history 反查
- source_type/reference/exact_excerpt: 用户回答 T-005 选①
- approval_binding: 待阶段末最终确认绑定
- facts_and_constraints: F-005（hook 注入唯一可靠途径；探测有变体坑）；check-anti-host.mjs:58-61 禁令
- Logic: 守卫零改动+定位最大化→宿主区落点→守卫与能力兼得
- choice_reason/impact: 不影响 runtime 宿主中立性；影响=tools/host 新增文件+命名去 Codex 化
- consequences_and_risks: 用户愿意装 hooks（T-009）→首选定位可靠
- rejected_alternatives: 只认 hook 注入（无 hook 环境永远 unknown）；守卫开白名单（防线开口）
- unresolved_items/owner: 无
- Supersedes: none

### D-005
- question/final_option: 执行批次 → 四批（簿记批→纯归位批→多 CLI 批→留证验收批）
- recommendation/plain_language: 接受盲审 FND-001b，归位类独立成批独立验收
- decision: 四批执行：簿记批=⑫⑬⑱（技能登记裁定+文档同步+move-map 修复，含 qa-only/verify-change 目录删除 G-003）；纯归位批=⑭⑮⑯⑰（死代码删除+shim 收敛+巨头归位+task-capability 迁移，结构性删除/搬迁同类隔离，契约测试全绿才过）；多 CLI 批=⑦⑧⑨⑪；留证验收批=①②③④⑤⑥
- source_type/reference/exact_excerpt: 用户回答 T-006 选①+T-008 选①（接受盲审意见）
- approval_binding: 待阶段末最终确认绑定
- facts_and_constraints: FND-001b（批次与失败边界防线脱节）；19 个域级契约测试兜底（F-004）
- Logic: 归位类零行为变更需独立验证→独立成批→防线落地
- choice_reason/impact: 多一批次开销换隔离可验；影响=build-plan 按四批排程
- consequences_and_risks: 批次依赖（manifest 生成器依赖 catalog 字段）→build-plan 细化
- rejected_alternatives: 三批（防线弱）；按主线顺序（簿记后置）；不分批（爆炸半径大）
- unresolved_items/owner: 批次内任务排序→build-plan
- Supersedes: T-006 三批划分

### D-006
- question/final_option: 宿主身份中立化兼容策略 → v2 新增+旧名读侧兼容
- recommendation/plain_language: WORKFLOWHUB_SESSION_ID 新契约与 CODEX_SESSION_ID 旧名并存
- decision: handoff schema v2；读侧一个薄兼容分支；现有 Codex/DSH 流零破坏
- source_type/reference/exact_excerpt: 用户回答 T-007 选①
- approval_binding: 待阶段末最终确认绑定
- facts_and_constraints: 现身份只认 CODEX_SESSION_ID（session-state.mjs:58-65）；DSH 靠映射；L75/L76 死约定无消费者（G-001 已裁定删除）
- Logic: 四 CLI 日常使用需正式契约→但不能破现有流→并存读侧兼容
- choice_reason/impact: 零破坏换契约正式化；影响=范围⑧口径定案
- consequences_and_risks: 读侧兼容分支需测试覆盖
- rejected_alternatives: 直接切 v2（破坏面大）；不中立化（漂移扩大）
- unresolved_items/owner: v1 退役条件→M18 或后续
- Supersedes: none

### D-007
- question/final_option: 盲审 partial 处置 → 接受 1/4 异源有效定案
- recommendation/plain_language: 传输失败属外部服务问题，唯一 finding 已处置
- decision: direction advice 以 available/partial（1/4）定案，失败类别原样保留不重试
- source_type/reference/exact_excerpt: 用户回答 T-010 选①
- approval_binding: 待阶段末最终确认绑定
- facts_and_constraints: 1 家 completed+1 finding；3 家失败（锚点/身份/输出）原样记录
- Logic: 规则允许 1 家有效+finding 已处置→不重试
- choice_reason/impact: 不为外部故障白费时间
- consequences_and_risks: 审查覆盖面弱于满员→detail advice 时再获一轮异源意见
- rejected_alternatives: 重试（传输问题未变）；同源降级（已有真异源）
- unresolved_items/owner: 无
- Supersedes: none

### D-008
- question/final_option: host-protocol 死约定（L75/L76）处置 → 删除文档行
- recommendation/plain_language: 文档回归诚实，只写代码兑现的契约
- decision: 删除 WORKFLOWHUB_STAGE_RUN_INPUT_PATH 与 WORKFLOWHUB_CODEX_ROLLOUT_STARTED_AT 两行死约定；将来有真实消费者按流程补
- source_type/reference/exact_excerpt: 用户回答 G-001 选①
- approval_binding: 待阶段末最终确认绑定
- facts_and_constraints: 全仓 grep 两变量均无生产消费者（F-004）
- Logic: 文档有契约代码无实现=漂移→删除→协议与现实一致
- choice_reason/impact: 消除未来读者被坑；影响=范围⑦口径定案
- consequences_and_risks: 无（从未工作过）
- rejected_alternatives: 补实现（无消费者新功能违规）；保留标注（漂移继续）
- unresolved_items/owner: 无
- Supersedes: none

### D-009
- question/final_option: 孤儿三技能处置 → 删二留一
- recommendation/plain_language: qa-only+verify-change 删除；resolving-merge-conflicts 保留并登记消费者
- decision: 删除 qa-only（职责有意废除）与 verify-change（输入契约无生产者）的目录+catalog 条目；resolving-merge-conflicts 保留，catalog 登记消费者=core/task-close.mjs 冲突报错路径
- source_type/reference/exact_excerpt: 用户回答 G-003 选①
- approval_binding: 待阶段末最终确认绑定
- facts_and_constraints: G-002 核查（verify-code required_skills 于 e294f09d5 裁掉；review-packet.v1 无生产者；core/task-close.mjs:1391 活引用）；batch-governance 删除条件=逐项证明+用户授权（本次已满足）
- Logic: 死契约删除+活引用保留→账面与现实一致
- choice_reason/impact: 报错指引不落空；git 历史可恢复
- consequences_and_risks: 恢复成本=从 git 历史捞（可接受）
- rejected_alternatives: 全保留（死代码占账面）；全删（误伤活消费者）；接线找消费者（硬造需求违规）
- unresolved_items/owner: 无
- Supersedes: none

### D-010
- question/final_option: `main` 合并后的多 CLI 接线方向 → 采用显式身份与 Stage Agent outcome，不读取或扫描宿主 transcript
- recommendation/plain_language: 跟随已接受的 ADR-0024；不恢复已删除的宿主会话绑定。Claude/宿主显式提交已执行结果，复用现有 bridge 与公共 `run`
- decision: M17 删除 `WORKFLOWHUB_SESSION_ID`、handoff v2、旧 `workflowhub-codex-session-state/event/hook.mjs` 任务；宿主用显式 `--project/--task` 或认证 worktree 定位任务，并提交显式 `session`/`unavailable` 结果；现有 bridge 负责生成 `workflowhub-stage-outcomes.v1`，公共 `stage-runtime run --action=execute` 消费 `outcome_ref`
- source_type/reference/exact_excerpt: `docs/adr/0024-remove-host-session-binding.md` @ `c835bf43f42ebc0bbf2bd0ba74d8d79cd4c76ebe`；用户 2026-09-05 回复「确认」
- approval_binding: 用户方向确认已取得；正式阶段确认与质量事实按后续阶段重新绑定
- facts_and_constraints: `main` 当前不存在旧三件套；`tools/host/workflowhub-stage-agent-bridge.mjs` 要求显式 `project_name/task_id/stage/task_path/attempt_id` 与 `agent_run_id`；`tools/cli/stage-runtime.mjs` 要求显式身份或认证 worktree
- Logic: 主干已移除隐式宿主会话绑定→继续实现旧 session/env/v2 会恢复已接受的架构债务→改为显式结果接线→保持 runtime 不读宿主 transcript
- choice_reason/impact: 复用现有 bridge/run、避免重复控制面；影响=FR-B-008/009、T6/T9~T12、SCN-003 和相关验收需按显式 outcome 重新定义
- consequences_and_risks: Claude 需由宿主负责生成结构化结果；缺结果只能记 `unavailable`，不能从 transcript 或评论反推；旧 F-005 格式调研保留为历史事实，不再是实现输入
- rejected_alternatives: 恢复旧 session-state/event/hook（违背 ADR-0024）；WorkflowHub 读取或扫描 Claude transcript（隐式绑定与宿主耦合）；新增第二套 Claude dispatch/control plane（重复机制）
- unresolved_items/owner: `spec.md`、`plan.md`、`tasks.md` 的当前契约同步→build-spec/build-plan
- Supersedes: D-004、D-006 中涉及 transcript 定位、`WORKFLOWHUB_SESSION_ID`、handoff v2 和旧 dispatch 的部分；不替代 D-005、D-007、D-008、D-009
```

## 三轮 talk

| talk_id | 问题/选项 | 后果/风险 | 用户选择/原文 | 队列变化 | source/evidence |
| --- | --- | --- | --- | --- | --- |
| T-001 | Round1-Q1 完成判据松紧：①严格留证（推荐）②实用为准记录从简 ③折中 | 选②省时但 M17b 验收（验证记录/mapping/tests）字面上不过→M18 被卡 | 用户选②「1-2」（2026-09-03 回复「1-2 2-3 3-2」） | 与 18 项范围中记录类工作（④⑤⑥）冲突→新增 OPEN-005 待澄清（高） | 用户真实回复，本会话 |
| T-002 | Round1-Q2 Kimi 投入深度：①摸底量力而行（推荐）②尽力接通 ③本次不碰 | 选③：Kimi spike 移出 M17；F1 延期任务承接全部 Kimi 工作 | 用户选③「2-3」（同上回复） | RISK-001 关闭；范围⑩移出；supersedes R-004 中「Kimi adapter 进 M17」部分 | 用户真实回复，本会话 |
| T-003 | Round1-Q3 外部调研范围：①只查 Claude+Kimi 格式（推荐）②加查外部技能分发生态 ③不查 | 选②：调研=Claude 会话格式+外部技能分发/打包生态（M18 预热）；Kimi 格式调研因 T-002 取消 | 用户选②「3-2」（同上回复） | 接受「为 M18 提前调研可能返工」的风险；调研项定为 2 个 | 用户真实回复，本会话 |
| T-004 | Round1-Q4（OPEN-005 澄清）「记录从简」口径：①记录照做但一切从简（推荐）②记录项全砍只做代码 ③折中砍一半 | 选①：④⑤⑥等记录类工作保留最小版本（一个汇总文档/一个测试文件/一次存档输出），范围维持 17 项；M17b 验收字面可过，M18 不被卡 | 用户选①「4-1」（2026-09-03） | OPEN-005 关闭；Round 1 无 high/medium 待答，本轮收敛（共 4 题） | 用户真实回复，本会话 |
| T-005 | Round2-Q1 Claude adapter 落点（OPEN-003/RISK-002）：①放宿主工具区 tools/host（推荐）②只认 hook 注入留 runtime ③守卫开白名单 | 选①：`check-anti-host` 守卫零改动，三级 locate（hook 注入→目录探测→history 反查）均可用；tools/host 新增 Claude 文件并顺带命名去 Codex 化 | 用户选①（2026-09-03，问答工具） | OPEN-003 关闭；RISK-002 关闭 | 用户真实回复，宿主问答工具 |
| T-006 | Round2-Q2 17 项执行顺序（OPEN-002）：①三批风险递增（推荐：簿记批→多 CLI 批→留证验收批）②按主线 A→B→C ③不分批 | 选①：每批独立可验收、早期快速见效；批次依赖（manifest 生成器依赖 catalog 字段）交 build-plan 细化 | 用户选①（2026-09-03，问答工具） | OPEN-002 关闭 | 用户真实回复，宿主问答工具 |
| T-007 | Round2-Q3 宿主身份中立化兼容策略：①v2 新增+旧名读侧兼容（推荐）②直接切 v2 ③不做中立化 | 选①：现有 Codex/DSH 流零破坏，读侧仅一个薄兼容分支；`WORKFLOWHUB_SESSION_ID` 新契约与 CODEX_SESSION_ID 旧名并存 | 用户选①（2026-09-03，问答工具） | 范围⑧口径定案 | 用户真实回复，宿主问答工具 |
| T-008 | Round3-Q1 FND-001b 处置：①接受改四批（推荐）②拒绝维持三批 | 选①：执行批次=簿记批→纯归位批→多 CLI 批→留证验收批；纯归位批（⑮⑯⑰+①②③之外的结构性搬迁）独立验收，契约测试全绿才过 | 用户选①（2026-09-03，问答工具） | **Supersedes T-006 的三批划分**（批次由三增四，其余不变） | 用户真实回复，宿主问答工具 |
| T-009 | Round3-Q2 Claude hooks 假设：①愿意装 hooks（推荐）②不装靠探测兜底 ③不确定 | 选①：三级 locate 全可用，Claude adapter 价值完整兑现；hooks 安装指导归 build-plan/build-code | 用户选①（2026-09-03，问答工具） | 关键假设确认 | 用户真实回复，宿主问答工具 |
| T-010 | Round3-Q3 盲审 partial 接受：①接受 1 家有效（推荐）②重试 3 家 ③补同源降级 | 选①：direction advice 以 1/4 异源完成定案，失败类别原样保留不重试 | 用户选①（2026-09-03，问答工具） | Round 3 收敛，无 high/medium 待答 | 用户真实回复，宿主问答工具 |

## 调研

| research_id/source | 调研重点 | 关键事实 | 处理状态 | 关联 D |
| --- | --- | --- | --- | --- |
| F-001 | 五段技能 repo-local 化现状（2026-08-31 仓内调研） | 五段 29 个去重依赖技能全部 repo-local（SKILL.md+sha256 bundle 零缺失）；`local-skill-resolver.mjs:73-81` 硬锁 `<root>/skills/`；workflows/runtime/tools 对 superpowers/gstack 零运行时引用；`tools/architecture/clean-install.mjs:74-101` 已有干净环境验证工具 | 已采纳，支撑 R-002 主张① | 待关联 |
| F-002 | 多 CLI 兼容现状（2026-08-31 仓内调研） | 仓内接进 runtime 的宿主仅 Codex+DSH（`stage-runtime.mjs:270-322` 唯一归一化点，仅覆盖 requirement_message）；Claude 仅 stop-hook；Kimi 走仓外 broker；设计刻意"宿主中立核心+仓外归一"（`audit-contracts.md:19-20`）；M17b 四产出物均不存在 | 已采纳，支撑 R-002 主张②（能力在、记录缺） | 待关联 |
| F-003 | X2/X3/X4 与指标现状（2026-08-31 仓内调研） | X3 wh-review adapter 形态合格无 semver 声明；X4 debate 全量 vendor（commit 钉住）；X2 delegation 仓内零痕迹；指标发射点仅 verify-code；无 metrics_enabled 字段/扫描器；`skills-inventory.json` 无 producer（roadmap 已豁免） | 已采纳 | 待关联 |
| F-004 | skill 整理/项目简化/多 CLI 深化三方向候选（2026-08-31 三轮调研 + 2026-09-03 三项深挖） | 真孤儿技能 3 个（qa-only/verify-change/resolving-merge-conflicts）；review 双副本实为兼容 shim（零逻辑分叉，~12-14 文件收敛）；stage-content-contracts 5,772 行 6 域可纯归位；task-capability 36 行未登记；facts.jsonl 唯一消费者=task-close（与 F2 联动）；host-protocol L75/L76 死约定无生产消费者 | 已采纳；延期部分写入 F1/F2/F3 | 待关联 |
| F-005 | Claude Code 会话记录格式（2026-09-03，本机实证+官方文档核实，T-003 选定调研项①） | 存储 `~/.claude/projects/<cwd编码>/<session-uuid>.jsonl`（编码有 `/`→`-` 与 `2F` 两变体）；真实用户输入主形态=type:user+content list[text]+origin.kind:'human'，string 形态多为命令包装须排除，isCompactSummary 行必须排除；官方 hooks stdin 公共字段含 session_id+transcript_path（唯一可靠获取途径，无环境变量；已知 bug claude-code#9188 须校验文件内 sessionId 一致）；格式官方未承诺稳定（#53516 开放），但演进以新增字段为主→白名单解析可免疫；提取"绑定前用户原始消息"结论=可行 | 历史调研保留，但 D-010 明确禁止作为 WorkflowHub 实现输入或由 runtime 读取/扫描 | D-003 历史事实；D-010 supersedes 实现用途 |
| F-006 | 外部技能分发/打包生态（2026-09-03，T-003 选定调研项②，M18 预热；主报告 `docs/research/m18-skill-plugin-distribution-ecosystem-research-2026-09-03.md` 247 行 32 来源 + 2 份补充笔记） | ①Claude Code 插件体系字段最全：plugin.json 仅 name 必需、官方忽略未知字段（一份 manifest 可兼任多生态）、marketplace source 七类型、dependencies 用 npm-semver range、tag 约定 `{name}--v{version}`；②Codex skills 在 `.agents/skills` 遵循 Agent Skills 标准、无版本字段；③Kimi 机制最完整（kimi.plugin.json+自定义 marketplace）、Gemini 无 registry 不支持 semver、DSH 未查到公开资料；④跨宿主事实标准=SKILL.md（agentskills.io，20+ 宿主），superpowers=单仓 14 宿主薄 manifest，gstack=生成器+SessionStart 节流更新检查；⑤M18 启示：以 Claude plugin schema 为分发基准+未知字段扩展、更新检查三层（marketplace 自动更新/hook 节流兜底/手动）、多宿主 MVP=SKILL.md 零适配+每宿主薄 manifest+路径配置表、外部 broker 依赖用 npm engines 风格声明+运行时探测不满足报 unknown | 已采纳；对 M17 的即时影响：X3 semver 声明采用 engines 风格（主线 A③）；其余供 M18 | 待关联（主线 A③ + M18 预热） |

## grill

| grill_id | CONTEXT/冲突 | 结论 | ADR/四项退出 | source/evidence |
| --- | --- | --- | --- | --- |
| G-001 | 死约定（host-protocol L75/L76 两个无生产消费者变量） | 用户选①删除文档行：协议只写代码兑现的契约，将来有真实消费者再按流程补 | 退出检查③（失败语义）强化 | 用户真实回复，问答工具（2026-09-03） |
| G-002 | 孤儿三技能「零消费者」前提被核查部分证伪：resolving-merge-conflicts 有活消费者 `core/task-close.mjs:1391` 报错路径 | 冲突已解决（conflicts=resolved）：该技能不是孤儿 | — | 子代理核查（SKILL.md+git 历史+`core/task-close.mjs:1386-1393,1877-1884`） |
| G-003 | 三技能处置 | 用户选①删二留一：qa-only+verify-change 删除（职责有意废除+输入契约无生产者，证据齐）；resolving-merge-conflicts 保留并登记消费者=task-close 冲突报错路径 | 范围⑫口径定案 | 用户真实回复，问答工具（2026-09-03） |

grill_summary：status=completed；direction_changing_challenges_resolved=true；requirement_coverage=complete（五类消息类全覆盖：goal=T-001~T-004；flow_or_surface=non_ui+多 CLI 接入；data_or_state=catalog/manifest/handoff v2/move-map；success_failure_acceptance=成功失败边界+acceptance 行；constraint_non_goal_defer=非目标+F1/F2/F3）；exit_checks：external_interfaces=pass（Claude hooks 官方文档+本机实证 F-005；3rd-review broker 实盘跑通）；canonical_names=pass（manifest 八字段=roadmap L452 唯一权威；`WORKFLOWHUB_SESSION_ID`=T-007，后由 D-010 supersede；cli-tool-mapping.md=roadmap L470，spec 阶段不得另立口径）；failure_semantics=pass（成功/失败边界节+D30 unknown 语义）；scope_boundaries=pass（17 项+非目标+延期写死）。方向重对齐后，F-005 仅作历史调研事实，当前实现以 ADR-0024 的显式 identity/outcome 边界为准。

## 审查处置

direction advice 传输事实（2026-09-03，step 6）：status=available，outcome=partial；4 家异源 provider 中 antigravity/flash completed（1 条 finding），pi/coding failed（EVIDENCE_ANCHOR_INVALID）、opencode/pax3.8 failed（PROVIDER_IDENTITY_INVALID）、codex/luna failed（PROVIDER_OUTPUT_INVALID）——失败类别原样保留，未改写为通过；material_id=b69245fc…6664，runtime_id=6162886e-c7fa-4506-bffe-3c0e2ce477c2。

| finding_id | 原始事实/来源 | 后果 | status | next_action/evidence_ref | owner/consumer/retain_or_delete |
| --- | --- | --- | --- | --- | --- |
| FND-001a | antigravity/flash major：方向材料声称 T-001~T-007 但正文编号仅①~⑥，T-007 映射不明 | 材料表述歧义，不影响实质决策 | fixed | 已在 decision-log T-005~T-007 行与收敛检查 solution 行明确 T 编号映射（本次落盘修正） | make-decision/decision-log/retain |
| FND-001b | antigravity/flash major：批次计划未将⑭-⑱归位类工作独立成「纯归位批」，与失败边界「归位批混行为变更」防线脱节 | 已接受：执行批次改四批（簿记批→纯归位批→多 CLI 批→留证验收批），T-008 supersedes T-006 | fixed | 已落入收敛检查 solution 行与范围节；build-plan 按四批细化 | 用户/build-plan/retain |
| FND-002 | pi/coding major（detail）：范围节标题写「18 项」但正文已 17 项 | 计数矛盾会误导 build-plan | fixed | 标题已改「17 项=原 18 项移出⑩（T-002）」 | make-decision/decision-log/retain |
| FND-003 | pi/coding major（detail）：OPEN-002 开放行与关闭行并存 | 双重状态使收敛检查无法判定 | fixed | 已删开放行，仅留关闭行（注 T-008 supersedes） | make-decision/decision-log/retain |
| FND-004 | pi/coding major（detail）：RISK-002 仍标开放但 T-005/D-004 已定案 | 风险表与决定节矛盾 | fixed | RISK-002 已标关闭（2026-09-03，T-005） | make-decision/decision-log/retain |
| FND-005 | pi/coding minor（detail）：F1/F2/F3 延期任务 md 仅存本机下载目录，换机即丢，与「事实固化进仓」目标相悖 | 延期交接失去书面依据 | fixed | DEF-001 行已注记：簿记批执行时将副本归档进仓并登记 move-map | 簿记批/build-plan/retain |
| FND-006 | antigravity/flash major（detail）：流程影响索引仍含已取消的⑩；D-002 称主线 B 剩 5 项实为 4 项 | 索引与范围缩减矛盾 | fixed | 索引改（⑧⑨⑪）；D-002 改「主线 B 剩 4 项」 | make-decision/decision-log/retain |
| FND-007 | antigravity/flash major（detail）：D-005 未明确⑭⑱的批次归属，隔离防线有缺口 | 批次归属不明则隔离失效 | fixed | D-005 已写明四批明细：簿记批=⑫⑬⑱、纯归位批=⑭⑮⑯⑰、多 CLI 批=⑦⑧⑨⑪、留证验收批=①②③④⑤⑥ | make-decision/build-plan/retain |
| FND-008 | antigravity/flash minor（detail）：RISK-002 状态过时（与 FND-004 同源） | 同 FND-004 | fixed | 随 FND-004 一并修复 | make-decision/decision-log/delete（重复项合并） |

## 最终确认

- 状态：accepted
- 用户原文与 host-visible 绑定：用户经问答工具选择「① 确认，进入 build-spec（推荐）」（2026-09-03，卡片含决策全景：17 项四批次/十条验收最小留证/非目标与延期/主要风险）；正式 confirmation 经 public confirm 发布，ref 见阶段步骤记录
- 方向重对齐确认：用户 2026-09-05 回复「确认」，同意采用 D-010：不恢复旧宿主会话绑定；Claude/宿主显式提交 outcome，经现有 bridge/run 接入；WorkflowHub 不读取或扫描 transcript。
- 未确认内容：无

## 拒绝方案

| 选项 | 拒绝理由 | 关联 D |
| --- | --- | --- |
| 启动完整五阶段前的单独 make-decision 轻量流程 | 用户两次裁定：先「完全没必要这么小个问题还单独启动一次make-decision，直接基于议题调研」（2026-08-31），后「按标准 WorkflowHub 开始M17任务，从 make-decision 开始，不要跳阶段」（2026-09-03）——调研先行、正式流程承载决策 | R-005 |
| 合并 spec-\* / plan-\*-review 技能族 | 调研证实流水线分工+三视角 lens 各有真实 consumer，合并违反「不新增无消费者控制面」与「简单优先」 | F-004 |
| 恢复/扩展 transcript capability（token/耗时等） | 零真实消费者 + roadmap 明文「不因兼容验证恢复旧遥测」+ M14b 已撤回 | F-002 |

## 风险与延期交接

| risk/deferred_id | 风险或延期内容 | 触发/后果 | 处理阶段/owner |
| --- | --- | --- | --- |
| DEF-001 | F1：多 CLI seam 泛化 + cli_map 兑现（随 Kimi/第四宿主） | 第四宿主出现前泛化=无消费者抽象；详见 `/Users/Hugh/Downloads/workflowhub-m17-deferred-tasks.md` F1（**注意：该文件当前仅存本机下载目录，簿记批执行时将副本归档进仓并登记 move-map**，FND-005） | 后续独立任务 |
| DEF-002 | F2：task-close/artifact-dir 主体迁移 + facts 双轨合并 | facts.jsonl 唯一消费者=task-close，天然一体；三重治理红线需一次性 cutover；同上 F2 | 后续独立任务（用户 2026-09-03 确认） |
| DEF-003 | F3：stage 层函数级拆分 + 去 barrel + 死导出清理 + stage-handlers/stage-runner 评估 | 依赖 M17 归位后的安全窗口期；同上 F3 | 后续独立任务 |
| DEF-004 | capability 扩展（requirement_message 之外） | 零消费者+遥测红线，无限期延期 | 仅真实消费者出现时经 decision-log 立项 |
| ~~RISK-001~~ | ~~Kimi spike 结论可能是「无可读 transcript」~~ | 已关闭：T-002 用户选「本次不碰 Kimi」，spike 不再执行 | 关闭（2026-09-03） |
| ~~RISK-002~~ | ~~Claude adapter 与 anti-host 禁令冲突~~ | 已关闭：T-005 选 tools/host，守卫零改动（D-004 定案） | 关闭（2026-09-03，T-005） |
| RISK-004 | `main` ADR-0024 与原 M17 Claude/session 计划冲突 | 旧 T6/T9~T12 会引用已删除模块或恢复隐式绑定；已由 D-010 重对齐，需同步 spec/plan/tasks | build-spec/build-plan |

## 质量边界

- 质量事实：调研事实 F-001~F-006（F-005 的 transcript 结论仅作历史输入，D-010 已禁止 runtime 读取/扫描）；clean-install 验证记录（待⑥）；独立审查 finding（待方向重对齐后的新材料审查）。
- 推进资格：本阶段 Talk 三轮真实回答 + 用户最终确认；不跳阶段（R-005）。
- 完成判据：成功/失败边界节草案经 Talk 确认后生效；roadmap M17a/M17b 十条验收为最终判据。
- 不可逆授权边界：commit/push/merge/archive 需经 `authorize` 单独授权；本阶段不产生不可逆操作。

## 未决项

| item_id | 未决内容 | 原因 | 谁在何时解决 |
| --- | --- | --- | --- |
| OPEN-001 | 成功/失败边界草案确认 | 需用户 Talk 回答 | 用户，Talk Round 1/2 |
| OPEN-002 | 18 项范围的批次/顺序安排 | 依赖 Talk 对优先级的回答 | 用户+build-plan |
| OPEN-003 | Claude adapter 落点 policy（anti-host 禁令解法） | 需方向级裁定 | 用户，Talk（RISK-002） |
| OPEN-004 | UI applicability 复核 | 三输入当前判定 non_ui，若计划变化需重算 | 本阶段末复核 |
| ~~OPEN-005~~ | ~~T-001 选②与范围记录类工作的口径冲突~~ | 已关闭：T-004 用户选①「记录照做但一切从简」，范围维持 17 项 | 关闭（2026-09-03，T-004） |
| ~~OPEN-002~~ | ~~17 项范围的批次/顺序安排~~ | 已关闭：T-006 选三批风险递增（簿记→多 CLI→留证验收） | 关闭（2026-09-03，T-006） |
| ~~OPEN-003~~ | ~~Claude adapter 落点 policy~~ | 已关闭：T-005 选 tools/host，守卫零改动 | 关闭（2026-09-03，T-005） |
| ~~OPEN-001~~ | ~~成功/失败边界草案确认~~ | 已关闭：T-001+T-004 确认口径（实用为前提+最小留证） | 关闭（2026-09-03，T-001/T-004） |

## UI applicability

```json
{
  "result": "non_ui",
  "sources": {
    "raw_requirement": {"conclusion": "non_ui", "fact": "六条原始需求均为仓内运行时/技能治理/多 CLI 接线与记录要求，无页面或前端组件诉求（R-001~R-006 原文）"},
    "project_inventory": {"conclusion": "non_ui", "fact": "workflowhub 为 Node CLI/编排工具仓，无前端页面目录；本任务工作面为 runtime/、skills/、tools/、docs/"},
    "planned_or_changed_frontend_fact": {"conclusion": "non_ui", "fact": "17 项范围不含任何页面、交互或前端组件改动；入口为 CLI 命令与宿主问答工具"}
  }
}
```

## 收敛检查

| 维度 | 用户答案 | 事实/材料引用 | 可执行验收 |
| --- | --- | --- | --- |
| 目标 | 用户回答（T-001/T-004）：以实际跑通为前提，把两条已验证事实固化成仓内可复查证据，十条验收逐条最小留证；从简不等于不做 | R-002、F-001/F-002、D-001 | 场景：阶段末确认卡；数据来源：decision-log.md 成功/失败边界节；通过：判据写成可逐条复查的十条；失败：判据停留在口头或不可复查 |
| 范围 | 用户回答（T-002/T-004）并经 D-010 重对齐：17 项清单（原 18 项移出⑩ Kimi spike），记录类工作保留最小版本；非目标=Kimi/F1/F2/F3/capability 扩展/合并技能族/UI/宿主 transcript 扫描 | R-003、R-004、D-002、D-010、非目标节 | 场景：范围节 17 项逐项点名；数据来源：decision-log.md 范围与非目标节；通过：17 项与非目标书面化且无隐性扩大；失败：范围口头漂移、Kimi 混入或恢复旧宿主绑定 |
| 方案 | 用户确认 D-010：执行四批（簿记→纯归位→多 CLI→留证验收）；Claude/宿主显式提交 outcome，复用 bridge/run；不再实现 `WORKFLOWHUB_SESSION_ID`、handoff v2、transcript 定位；盲审 1/4 定案。取舍：宿主多承担结构化结果责任，换取无隐式绑定与无第二控制面；被拒方案：恢复旧模块、WorkflowHub 扫描 transcript、新增 Claude dispatch/control plane；未决项：无方向性未决 | D-005、D-007、D-008、D-009、D-010、用户 2026-09-05 确认 | 场景：决定节 D-001~D-010；数据来源：ADR-0024、当前 bridge/stage-runtime；通过：显式身份与 outcome 可绑定当前 task/stage/attempt/snapshot/material；失败：从宿主 session 猜身份、缺 outcome 却宣称完成或新增重复控制面 |
| 验收 | 用户回答（T-001/T-004 + 最终确认）：判据=十条验收最小留证+契约测试绿+归位零行为变更 | D-001、成功/失败边界节 | 场景：build-code/verify-code 末跑一次完整验证；数据来源：仓内文件（manifest/mapping 文档/声明）、契约与 e2e 测试输出、clean-install 存档；通过：十条验收逐条有最小留证且全部契约测试绿且归位类零行为变更；失败：任一验收条缺证据或被伪造、出现无消费者新控制面、行为变更混入归位批 |


## Supersedes

- D-010 supersedes D-004、D-006 中与宿主 transcript 定位、`WORKFLOWHUB_SESSION_ID`、handoff v2 和旧 session dispatch 相关的部分；其余决定保留。

## 文档结果

- CONTEXT.md：no-change。理由：本任务把已成立事实固化，未创造新领域概念；「repo-contained skills」等概念的权威定义属治理文件（`skills/catalog.yaml` 机器真相 + `reuse-registry.md` 人读投影）职责，CONTEXT.md 不收治理清单细节；宿主特有命名按 CONTEXT.md L303 既有原则（「平台特有的地址、状态和派发方式属于宿主映射，不是领域术语」）本就不收录。文件引用：CONTEXT.md（worktree，未改动）
- ADR：consumed。`docs/adr/0024-remove-host-session-binding.md` 已由 `main` 接受并直接决定旧宿主会话绑定的删除、显式身份和 Stage Agent outcome 边界；M17 不新增 ADR，只把当前任务方向对齐到该 ADR。
- ADR criteria：hard to reverse=true（恢复旧绑定会重新引入控制面与隐式身份）；surprising without context=false（当前主干已有 ADR 与实现）；genuine trade-off=true（Claude 宿主需显式生成 outcome，换取核心不读 transcript）。
- 术语/ADR 冲突及处理：旧 D-004/D-006 与 ADR-0024 冲突部分由 D-010 supersede；孤儿技能「零消费者」前提与 `core/task-close.mjs:1391` 活引用冲突仍按 G-002 解决。
- 不复制 spec 的边界：本日志只记决策索引；manifest 字段、adapter 接口、测试清单等细节归 build-spec/build-plan 材料

## Exit checks

- 上下文一致：pass（原始需求 R-001~R-006 与五维矩阵、Talk/Grill 结论逐条互引）
- owner/接口一致：incomplete（D-010 已确认显式 bridge/outcome 方向；四份材料尚未全部同步，且 `ajv` 缺失导致公共 status 尚未复核）
- 失败语义明确：pass（成功/失败边界节写死；unknown/unavailable 沿用 D30；死约定删除消除文档-实现漂移）
- 范围与延期明确：pass（17 项+非目标+F1/F2/F3 延期交接全部书面化并经用户确认）

- 2026-09-05 方向重对齐：用户确认采用 D-010；只允许显式 `--project/--task` 或认证 worktree，Claude/宿主提交显式 outcome，WorkflowHub 不读取或扫描 transcript；旧 session/env/v2 任务改为移除/历史事实，后续由 build-spec/build-plan 同步。

## 阶段步骤记录

- step 1 `load-context`（2026-09-03）：已读 `workflows/make-decision/SKILL.md`(v3.2.0)、`skill-deps.yaml`、`steps.json`（14 步 manifest）与原始需求（本会话 R-001~R-005，含 2026-08-31~09-03 全部用户指示）；已读依赖技能 `decision-log`、`talk-with-zhipeng` 的 SKILL.md 与 decision-log 模板。产出：本 decision-log.md 初版（原始需求表、五维覆盖矩阵、范围/非目标草案、调研事实 F-001~F-004、UI applicability=non_ui）。
- step 2 `triage-scope`（2026-09-03）：初始范围=用户已确认的 18 项清单（主线 A/B/C）；初始不确定性=成功/失败边界细节、批次顺序、Claude adapter 落点 policy、Kimi 可行性（OPEN-001~004）；非目标=F1/F2/F3/capability/技能族合并/全量合同测试/skills-inventory，已获用户前置确认（R-004 及 2026-09-03「task-close + artifact-dir 主体迁移已并入延期任务 F2 没问题」）。
- step 3 `talk-round-1` 第 1 组（2026-09-03）：发出 3 题（完成判据松紧/Kimi 深度/调研范围），用户真实回复「1-2 2-3 3-2」。处置：T-002→Kimi 移出范围（17 项）；T-003→调研定为 Claude 格式+外部分发生态两项；T-001→与范围记录类工作冲突，新增 OPEN-005，重排后进入第 2 组（当前共 1 个开放问题）。
- step 3 `talk-round-1` 第 2 组（2026-09-03）：发出第 4 题（「记录从简」口径澄清），用户真实回复「4-1」。处置：OPEN-005 关闭；成功/失败边界口径确认（实用为前提+最小留证）。**Round 1 收敛**：4 题全答，无 high/medium 待答；保留风险=「最小留证」在执行中滑向「不做」（已写入失败边界）；不再提问的事实理由=方向性开放问题清零。architecture_direction_covered=true（判据口径已定），user_outcome_covered=true（痛点回显用户未纠正：事实固化+解锁 M18）。
- step 4 `research-inputs`（2026-09-03）：按 T-003 执行两项调研。①Claude 会话格式（F-005）：本机实证 `~/.claude/projects/` 262 个项目目录+JSONL 结构分类+官方 hooks 文档核实，结论=adapter 可行（hook 注入 transcript_path+白名单解析+时间点截断）；②外部分发生态（F-006）：官方五页文档全文核实+3 并行子代理，主报告落盘 `docs/research/m18-skill-plugin-distribution-ecosystem-research-2026-09-03.md`（注意：该文件与 2 份补充笔记当前在主仓工作区，执行阶段需经任务流程归档）。另按 R-006 要求，自 Talk Round 2 起问答改用宿主问答工具呈现。
- step 5 `talk-round-2`（2026-09-03）：经问答工具发出 3 题（adapter 落点/执行批次/兼容策略），用户真实回复 ①①①（T-005~T-007）。已由事实回答未再提问：非目标（R-004/T-002/延期 md 多轮确认）；高风险分类（三输入判定非 high-risk-user-visible：non_ui+开发者内部工具，无 high_risk_fact 写入）；Kimi（T-002）。**Round 2 收敛**：方向、范围、非目标、取舍、风险全部有主；OPEN-001~005 全关闭；保留风险=主仓 docs/research 三份调研文件归档去向（交 build-plan 处理）。
- step 6 `direction-advice`（2026-09-03）：经 wh-review broker 提交方向材料（raw_requirement/approved_direction/验收判据），status=available、outcome=partial（1/4 provider 完成，3 家传输失败类别原样保留）。finding 处置：FND-001a fixed（编号映射歧义，落盘修正）；FND-001b needs_human（批次是否独立纯归位批，转 Talk Round 3）。本次执行只记录一条语义 advice 结果，不因 finding 修复发起第二次 provider 请求。
- step 8 `grill-with-docs`（2026-09-03）：建立五类消息类覆盖矩阵后发出 2 个独立 frontier 问题；用户回答 G-001=①（死约定删除）+ G-003=①（删二留一，中间经子代理核查重排：resolving-merge-conflicts「零消费者」前提被证伪，G-002 冲突解决）。CONTEXT.md=no-change、ADR=not-needed（理由见文档结果节）；四项退出检查全 pass；未调用 wh-review、未产生 review fact。
- step 9 `write-decision-draft`（2026-09-03）：决定节写入 D-001~D-009（decision-entry.v1 格式），覆盖判据/范围/调研/落点/批次/兼容/盲审/死约定/孤儿技能九个承重决策；每条含来源摘录、逻辑链、被拒绝方案、风险；Supersedes 关系已标注（D-002 supersedes R-004 部分、D-005 supersedes T-006 三批）。
- step 10 `detail-advice`（2026-09-03）：经 wh-review broker 提交完整 decision draft（24,736 bytes），status=available、outcome=partial（2/5 provider 完成：pi/coding 4 findings、antigravity/flash 3 findings；grok/opencode=PROVIDER_IDENTITY_INVALID、codex/luna=PUBLIC_RESULT_INVALID，失败类别原样保留）。7 条 finding 全部为日志一致性硬伤，无方向变更→按规则本阶段直接修复：FND-002~FND-008 全部 fixed（计数/重复行/风险状态/延期文件归档注记/流程索引/批次明细），处置见审查处置节。
- step 11 `approve-decision`（2026-09-03）：向用户发出最终确认卡（决策全景+成功失败边界+非目标延期+主要风险），用户真实回复「① 确认，进入 build-spec」。最终确认节已更新为 accepted。
- step 12 `stage-end-spec-analyze`（2026-09-03）：首版 packet 不符 v1 契约，经三轮本地 validator 模拟修正（evidence_subjects/requirement_coverage_outputs/grill_summary/final_confirmation 结构、actual_behavior 语义匹配、收敛表四维格式、UI fact JSON、覆盖矩阵类标签），最终 validateStageSpecAnalyzeProfile 本地模拟 ok=true 后提交。
- step 13 `publish-decision`（2026-09-03）：经公共 `run --action=execute` 完成：11 项完成判据全 satisfied，质量状态 passed；stage outcome 已发布（quality/evidence/stage-outcomes/make-decision/0e78a668…a4d2.json）；两轮审查结果经公共 `review --action=record` 落账（direction=…43ecee37、detail=…bac91b91），8 条 finding 处置经 finding_dispositions 提交；最终确认经公共 `confirm` 绑定当前 revision（b4cf390e…）。过程中修复 session 事件纪律问题：技能事件须与 step 同期嵌套、证据随 finish 一次带齐（已写入复盘）。
- step 14 `stage-reflection`（2026-09-03）：6 条复盘判断经公共 `run --action=reflect` 发布（quality/stage-reflection/make-decision.json），lesson 已合并至 lessons/make-decision.jsonl。关键教训：①问答工具从第一轮起用；②技能事件与 step 同期嵌套；③spec-analyze 先本地模拟；④wh-review broker 身份绑定待排查。
- step 15 `main-integration-realignment`（2026-09-05）：任务 worktree 从 `21ab4e87` 以 `git merge --ff-only main` 快进至 `c835bf43`；核对 ADR-0024、当前 `stage-runtime`、Stage Agent bridge 与 task binding 后，用户确认 D-010：不恢复旧宿主绑定，不由 WorkflowHub 读取/扫描 transcript，改用显式身份与显式 outcome 通过现有 bridge/run 接入。公共 stage status 因缺少 `ajv` 暂未执行，保持真实 unavailable。

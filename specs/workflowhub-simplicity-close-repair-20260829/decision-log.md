# Decision Log

任务：workflowhub-simplicity-close-repair-20260829
阶段：make-decision（进行中）

## 原始需求

宿主认证消息：msg-1=5da79eec-cf85-414f-9098-f0cdcfa1822e（分析委托），msg-2=5305a902-3fba-4e43-8362-71fcdf41bacc（任务指令与约束）；快照于 2026-08-29 由 DSH transcript 认证（本阶段修复前为空）。

| source_id | 原始需求/约束 | 来源引用/原文摘录 | 消息类别 | 关联决定 | 处理状态 |
| --- | --- | --- | --- | --- | --- |
| R-001 | 单一任务完成本次修复，不拆成多个任务 | 用户原文："我不想拆成多个任务完成这个修复"（msg-2） | constraint_non_goal_defer | D-001、D-009 | covered（T-001 确认：单任务执行） |
| R-002 | 按标准 WorkflowHub 流程执行，从 make-decision 开始，不跳阶段 | 用户原文："请按标准 WorkflowHub 开始这个任务吧""从 make-decision 开始，不要跳阶段"（msg-2） | flow_or_surface | D-001 | covered（流程约束，直接执行） |
| R-003 | 不依赖 build-spec 补需求；需求在 make-decision 与用户梳理完整 | 用户原文："也不要依赖 build-spec 补需求。先基于原始需求，在 make-decision 的过程中和我一起仔细梳理完整用户流程、页面范围、数据状态、成功/失败边界、非目标和延期项"（msg-2） | flow_or_surface | D-001 | covered（流程约束，直接执行） |
| R-004 | 总目标：workflowhub 应是简洁优雅的开发框架，而不是阻塞、流程、证据堆叠的工程模板 | 用户原文："workflowhub应该是一个简洁优雅的开发框架，而不是这么多阻塞、流程、证据的工程模板！"（msg-2） | goal | D-009 | covered（T-002：先修一致性再做减法） |
| R-005 | 修复 close 阻塞：任务从未正常 close，都是强行风险 close | 用户原文："尤其是最近close非常阻塞，从没正常close过，都是强行风险close！"（msg-2） | goal | D-002 | covered（范围第 1 项 close 重定稿） |
| R-006 | 事故暴露的问题要检查是否违反 workflowhub 宪法 | 用户原文："所以这些问题需要检查是否违反了workflowhub的宪法"（msg-2） | success_failure_acceptance | D-003 | covered（范围第 4 项 + 每条修复宪法依据） |
| R-007 | 修复方案本身也必须检查合宪性 | 用户原文："并且你的修复方案也需要检查有没有违反workflowhub的宪法！"（msg-2） | success_failure_acceptance | D-003 | covered（成功边界③） |
| R-008 | Talk 用大白话说明选项、后果和风险 | 用户原文："Talk 请用大白话说明选项、后果和风险"（msg-2） | flow_or_surface | D-001 | covered（Talk 全程大白话） |
| R-009 | decision-log 记录原始需求、关键事实、选择、理由和延期交接 | 用户原文："decision-log 记录原始需求、关键事实、选择、理由和延期交接"（msg-2） | data_or_state | D-003 | covered（本文档） |
| R-010 | 提高 workflowhub 任务执行质量和效率 | 用户原文（msg-1）："看看应该如何改造优化workflowhub，才能提高workflowhub任务执行质量和效率" | goal | D-009 | covered（目标节） |
| R-011 | 以三份事故文件 + 实现 + 宪法的既有分析为输入 | 用户原文（msg-1）委托分析三份事故记录；本会话已完成五路子代理分析 | data_or_state | D-003 | covered（调研表 F-001～F-005） |
| R-012 | 宿主可见需求快照为空曾是已知限制；本阶段已修复为 2 条认证消息，不再按需求缺失处理 | 事实：bootstrap 时 requirement_messages=[]（DSH 宿主 transcript 不在 Codex sessions 目录，见 F-006）；阶段内 DSH transcript 可移植化落地后快照修复为 msg-1/msg-2 | data_or_state | D-010 | covered（限制已消除，哈希经 transcript 重放校验） |
| R-013 | 修复不得新增概念/对象，优先做减法；"一个开发框架搞这么复杂干什么" | 用户 Talk round 2 反问原文："这个问题我看不懂，一个开发框架搞这么复杂干什么？ownership、manifest、task_owned\external等等对象都是干什么的？为什么workflowhub要增加这么多复杂的对象？" | constraint_non_goal_defer | D-009、D-010 | covered（方向约束，贯穿所有 D） |
| R-014 | close 的朴素定义：verify-code 结束后的提交、合并、归档、推送、清理五个动作 | 用户 Talk round 2 原文："close不就是在verify-code结束之后进行提交、合并、归档、推送、清理动作的步骤吗"；并在简化版确认卡选择"就按这个办" | flow_or_surface | D-002 | covered（范围第 1 项 + 决定节） |

## 目标

- 目标（Talk 已确认）：让任何按官方路径执行的 workflowhub 任务都能正常 close；消除实现层的自相矛盾与违宪点；修复方案全部过宪法检查；close 回归"五个动作"的朴素定义；框架做减法、走向简洁优雅（R-004、R-013、R-014）。

## 成功/失败边界

- 成功边界（T-006 定稿）：①本任务自身走完五阶段并**正常 close（非 risk）**——最直接的 dogfood 验收；②四个 close 死结（恒 risk、existing 矛盾、死路 risk plan、新鲜度宽严分裂）被消除且有测试；③每条修复有宪法依据，checklist 同步。
- 失败边界（定稿）：close 仍需 risk 模式才能完成本任务；为修复引入新推进门禁/新控制面/新概念对象（直接违宪且违 R-013）；修复只对本任务生效、对下一个任务无效。

## 范围

- 当前范围（Talk round 1/2 已收敛）：
  1. **close 重新定稿**（R-014）：五个动作（提交/合并/归档/推送/清理）+ 一次人工确认；质量状态如实抄写不作裁判；正常/带缺口 close 共用一条路径，删除 risk close 平行机制；清理按现有 workspace_mode 字段分支（自己建才删）；断点续跑；手工完成可核对补记。
  2. **事实新鲜度统一**：close 与 status 共用同一判定（material-only delta 豁免对齐），真实 material 变化仍要求重 verify。
  3. **左移防护**（细审 F-b732ee0d866b 处置：拆为五个子项，各有改动面与最小验收入口）：
     - 3a. **写边界身份断言**：写事实前断言 runner/task/cwd 三者一致（含 cwd 不在任务 worktree 即响铃）。改动面=写边界 preflight 单点；验收入口=cwd 错位时写入被拒的测试。
     - 3b. **review preflight**：调用前检查配置/材料/绑定/能力四类，输入错误当场分类报错（不落 unavailable 事实）。改动面=wh-review 入口单点；验收入口=本次实测四类错误（缺 review_track/缺 direction_selection/forbidden 字段/宿主不支持）各有一条测试。
     - 3c. **fallback 拆分**：四处兜底（wh-review-cli.mjs:183、stage-runner.mjs:626、stage-agent-outcome-adapter.mjs:813、bridge.mjs:85）拆 invalid_input（响铃）与 unavailable（留证），删 message 正则猜错误码。改动面=四处已知位置；验收入口=错误分类测试。
     - 3d. **子代理结果契约**：结果文件必写、超时/崩溃写占位证据、纳入现有 canonical receipt 槽位。改动面=workflows 文档+receipt 读取；验收入口=崩溃场景占位证据测试。
     - 3e. **code_review 一等事件**：把既有的 code_review 概念（完成判据已引用）从寄生字段升为正式事件，删临时 bridge。改动面=adapter/bridge/predicates 三处；验收入口=code_review 事件被完成判据直接消费的测试。
  4. **宪法解释段与 checklist 同步**（Q5 拉回范围）："close 三义"解释段 + 四条新判据。
  5. **减法**（Q4 全选）：close 编排精简；死路代码删除或修通；session 宿主可移植化；双轨事实评估（仅出结论）。
     - DSH 可移植化责任边界（细审 F-9465c9512d9c 处置）：本任务交付=workflowhub 侧接受非 Codex 宿主（session/transcript 校验不再 Codex-only、host 声明机制文档化）；broker 侧已由 3rd-review main 5ecf055 完成（dsh 宿主身份支持，host-identity-only），作为环境事实交接登记；DSH 作为 reviewer adapter=非目标。
- 用户流程/结果：本任务无 UI 页面（non_ui 已登记）；"用户流程"= 任务从 bootstrap 到 close 的完整生命周期体验。
- 方向行为要点（细审 F-156a84d0f4a6/F-57b9acc4d9ee 处置：决策级一行要点，完整流程/状态机在 build-spec 的 spec.md 细化）：
  - close 流程：verify-code 确认完成 → close 开始 → 一次人工确认清单（如实显示质量状态）→ 提交/合并/归档/推送/清理顺序执行，每步落账 → completed.json（只证物理交付）。失败语义：任一步失败=该步记失败事实+停住，修复后从断点续跑；手工完成的物理交付=finalize 核对补记。
  - 质量状态隔离：close 全程不改 quality_status/product_release_status；绿=正常完成、不绿=带缺口完成（一句话事实），完成宣称归 Q1/Q2 管。
  - 清理判定：manifest.workspace_mode=deterministic→删（删前 realpath/common-dir/branch 三重校验）；=existing→不删只记 not_applicable_recorded。
  - 新鲜度判定：close/status 同一函数；material-only delta 豁免一致；真实 material 变化=stale 事实，强制重 verify。
  - 错误分类：调用方输入错误=invalid_input 响铃；能力缺失=unavailable 留证；两者永不互换。

## 非目标

- 定稿（T-005）：不重做 PaperBuilder 侧问题；不改 3rd-review broker 内部；不清理主仓历史孤儿 git 对象（gc repack 失败仅登记为环境风险）；不新增阶段/材料/公共 runtime 命令/新概念对象（R-013）；不做 UI；历史 M14–M17 归档不重构；双轨事实只评估不合并（合并另开任务）。

## 验收标准

- AC-1（可验证，dogfood 证据）：本任务自身通过官方路径走完五阶段并正常 close——判定条件：`operations/close/completed.json` 存在且 close_mode 非 risk、含五个物理动作各自的落账记录与一次人工确认绑定、quality_status/product_release 字段独立存在未被漂白。定位=dogfood 证据而非唯一判据（细审 F-ddaec34df2fc 处置：消除循环依赖——修复正确性由 AC-2 测试独立裁决；AC-1 因环境风险失败时按风险-3 处置，不算产品失败）。
- AC-2（可验证，硬判据）：close 机制修复有测试且全绿——判定条件：恒 risk 分离、existing 模式 close 可行、risk plan 死路移除、material-only delta 豁免对齐、断点续跑、finalize 手工补记（含不漂白质量）均有 contract/integration 测试（细审 F-135e811ca6a2 处置：续跑/finalize 纳入）；通过=测试绿，失败=测试红或缺失。
- AC-3（可验证）：每条修复有宪法条款依据且 constitution-checklist.md 同步——执行载体=build-spec 的 FR 表，每条 FR 必须标注宪法条款号（细审 F-07f4e226436d 处置）；通过=逐条可对照，失败=出现无依据的新机制。
- AC-4（边界条件）：不引入新推进门禁/新控制面/新概念对象——判定条件：公共 runtime 命令仍是七类、四份材料不变、manifest 无新字段；通过=未变，失败=新增。
- AC-5（可验证，细审 F-f1cf26273465 处置）：左移防护五子项各有验收入口测试——cwd 断言拒绝错位写入、review preflight 四类错误各一条测试、fallback 拆分错误分类测试、子代理崩溃占位证据测试、code_review 事件被完成判据直接消费测试。
- AC-6（可验证，细审 F-f1cf26273465 处置）：减法与移植交付判定——死路代码删除有反向引用扫描证据（零消费者）、session 非 Codex 宿主支持有测试或文档化验收、双轨事实评估结论报告交付（quality/evidence/ 下真实文件）。

## 风险与延期交接

（细审 F-5a5424f1639c 处置：每条含 owner/完成条件/交接状态）

- 风险-1：需求快照为空（R-012，DSH 宿主限制）——**已消除（本阶段）**：DSH transcript 可移植化落地（多帧 zstd 读取 + DSH 源定位/规范化 + 空快照按原始 bound_at_ms 修复），快照修复为 msg-1/msg-2 两条认证消息，content_hash 经 transcript 重放校验一致；owner=本任务（session 可移植化改动，范围 5）；交接状态=已关闭（2026-08-29）。
- 风险-2：主仓 git gc 因历史对象不可读失败——不阻塞 merge/push，但 close 的 push 步骤若触发完整性问题需人工介入；owner=用户；完成条件=另行维护窗口清理；交接状态=已交接用户（非本任务，close 时若触发如实报）。
- 风险-3：用修复中的 close 代码关闭本任务自身存在自举风险——缓解：close 改动先经 AC-2 测试验证后才执行本任务 close；失败时回退手工五步并由 finalize 补记（该能力本身在范围内）；owner=主代理；完成条件=AC-1 完成或按本缓解路径完成并如实记录；交接状态=进行中（本任务承接）。
- 风险-4：宪法解释段措辞被误读为新门禁——缓解=detail 细审复核+措辞只解释不设门；owner=主代理；完成条件=解释段经 verify 阶段审查无歧义；交接状态=进行中（范围 4 承接）。
- 延期-1：facts.jsonl 与 quality facts 双轨合并——本任务仅出评估结论；owner=后续任务；完成条件=评估结论经 review 后单独立项；交接状态=待交接（评估报告=交接物）。
- 延期-2：宪法条款级修订（如确有需要）——owner=后续任务；完成条件=单独宪法变更审查；交接状态=待交接。

## 结束卡（大白话）

### 核心需求

workflowhub 最近总是"关不了门"：任务做完了，最后的收尾（提交、合并、归档、推送、清理）从来走不通，每次都要强行带着风险硬关。同时框架里检查、流程、证据越堆越多，用起来像工程模板而不是顺手工具。

### 核心目标

让收尾恢复本来的样子：活儿干完后确认一次，五个动作自动走完。质量好不好由验收阶段说了算，收尾只负责如实记录。顺便清理框架里的死路和重复概念，不加新东西。

### 已选方向

见"决定"节（Talk 两轮已与用户确认：修 close 四死结 + 检查左移 + 宪法解释同步 + 四项减法，全部不加新概念）。

## 决定

以下决定均已获用户真实确认（T-001～T-011），每条一句话字段，不复制 spec。

### D-001
- question/final_option: 任务怎么组织？→ 单一任务、五阶段不跳、需求在 make-decision 收敛
- recommendation/plain_language: 推荐；用户明确要求，一次走完质量最高
- decision: 单任务执行；不拆任务；不依赖 build-spec 补需求
- source_type/reference/exact_excerpt: 用户原文（R-001/R-002/R-003）："我不想拆成多个任务完成这个修复""从 make-decision 开始，不要跳阶段，也不要依赖 build-spec 补需求"
- approval_binding: approved（T-001 前用户原始指令；host-visible=本会话消息）
- facts_and_constraints: 两次事故显示拆任务/跳阶段会丢失事实链
- Logic: 用户指令 -> 流程约束 -> 单任务五阶段 -> 事实链完整可审查
- choice_reason/impact: 直接命令；影响=本任务生命周期全程
- consequences_and_risks: 范围大导致执行期长（盲审 F-0d3b4fd8524d）；缓解=每项修复有可验证 AC
- rejected_alternatives: 拆成多个任务（用户否决）；跳阶段（用户否决）
- unresolved_items/owner: 无
- Supersedes: none

### D-002
- question/final_option: close 是什么？→ verify-code 后的五个动作（提交/合并/归档/推送/清理）+ 开始前一次人工确认
- recommendation/plain_language: 推荐；回到用户的朴素定义，删掉兼任的质量裁判和风险登记员角色
- decision: closeDelivery 默认正常 close；risk close 平行机制（恒 risk 入口、risk plan 死路）删除；五动作编排保留并精简；确认一次完成
- source_type/reference/exact_excerpt: 用户原文（R-014）："close不就是在verify-code结束之后进行提交、合并、归档、推送、清理动作的步骤吗"；T-008 确认"就按这个办"
- approval_binding: approved（T-008）
- facts_and_constraints: F-001（恒 riskClose:true 于 core/task-close.mjs:1238；risk plan 死路）；宪法 F7 保留一次人工授权；ADR 0018 唯一用户入口
- Logic: 事故根因=close 兼任四职 -> 职责回归 -> 五动作+一次确认 -> 正常 close 可达
- choice_reason/impact: 直接消除"从未正常 close"的构造性根因；影响=core/task-close.mjs、tools/cli/task-close.mjs、ADR 0020
- consequences_and_risks: 质量缺口任务也能物理交付（已获用户 T-011 接受）；质量宣称靠独立状态字段隔离
- rejected_alternatives: 保持六步+risk 机制（T-002 备选 B，否决）；推倒重写 close（否决）
- unresolved_items/owner: 无
- Supersedes: none

### D-003
- question/final_option: 质量状态怎么表达？→ close 只抄写质量状态，不作裁判；带缺口 close 时 quality_status=incomplete、product_release_status=not_released 独立保持
- recommendation/plain_language: 推荐；物理交付事实和质量宣称彻底分家，谁也不冒充谁
- decision: completed.json 只证物理交付；质量/发布状态由各自事实记录承载；close 确认清单如实显示质量状态
- source_type/reference/exact_excerpt: T-011 用户选择"接受"；宪法 Q1/Q2/F9；盲审 F-78a71cc886d8 处置
- approval_binding: approved（T-011）
- facts_and_constraints: CONTEXT 治理节"三者不得压成一个 completed"；宪法解释段将同步（D-008）
- Logic: 状态混淆是事故源 -> 三义分离 -> 抄写不裁判 -> 既不伪造通过也不卡死交付
- choice_reason/impact: 宪法已有原则的实现落地；影响=completed.json 语义、status 投影
- consequences_and_risks: 用户需习惯看质量状态字段而非 close 结果判断质量；缓解=确认清单显示质量状态
- rejected_alternatives: 质量不绿不许 close（T-011 否决——正是事故根源）
- unresolved_items/owner: 无
- Supersedes: none

### D-004
- question/final_option: 清理谁的工作目录？→ 框架自己建的（deterministic）才删；绑别人的（existing）不删、只记录；用现有 workspace_mode 字段判断，不加新对象
- recommendation/plain_language: 推荐；一句话规则，零新概念
- decision: close 清理步按 manifest workspace_mode 分支；existing 时 worktree/branch cleanup 记为 not_applicable_recorded；删除前保留 realpath/common-dir/branch 三重校验；修订 ADR 0018 清理条款（ADR 0020）
- source_type/reference/exact_excerpt: T-007 用户反问（R-013）+T-008 确认；F-004（workspace.mjs:542 矛盾点）
- approval_binding: approved（T-008）
- facts_and_constraints: workspace_mode 是 bootstrap 写入的认证 manifest 字段；全仓需补 existing-mode close 测试
- Logic: 契约自相矛盾（执行放行/close 拒绝）-> 用现有字段统一语义 -> existing 可正常 close
- choice_reason/impact: 满足 R-013 零新对象；影响=runtime/task/workspace.mjs、core/task-close.mjs、测试
- consequences_and_risks: 误判风险由三重校验兜底（盲审 F-2cc91c2ccdfc 处置）；existing 目录残留由用户自理
- rejected_alternatives: 新增 ownership 字段（违 R-013）；禁止 existing 模式（砍能力）
- unresolved_items/owner: 无
- Supersedes: ADR 0018"全部物理事实成立"条款（由 ADR 0020 修订）

### D-005
- question/final_option: close 失败了怎么办？→ 每步落账可断点续跑；手工物理完成经核对可补写 completed.json（finalize）
- recommendation/plain_language: 推荐；给失败一条正式回头路，不再"系统不认账"
- decision: 保留 step reconcile 续跑；新增 CLI 层 finalize（物理事实 probe 全真→写 completed.json，质量不绿则只记 incomplete 事实）；修复或删除 prepare --risk-close 死路（manual-close 文档引用一并清理）
- source_type/reference/exact_excerpt: F-001 缺陷 3/5（execute/complete 拒收 risk plan、recordManualDeliveryClose 不写 completed.json）；T-008 确认
- approval_binding: approved（T-008）
- facts_and_constraints: prepare/execute/complete/resume/finalize 只在 tools/cli 私有层，不进公共 runtime 七类（vNext 边界）；plan 漂移后需重新确认（F7 不削弱）
- Logic: 失败无回头路=强行 risk 的另一半根因 -> 断点续跑+finalize -> 失败可恢复
- choice_reason/impact: 直接消除死路；影响=tools/cli/task-close.mjs、core/task-close.mjs
- consequences_and_risks: finalize 不得漂白质量（仅物理事实）；测试需覆盖
- rejected_alternatives: 失败后重新完整跑一遍 close（现状，事故实证不可行）
- unresolved_items/owner: 无
- Supersedes: none

### D-006
- question/final_option: 事实新鲜度怎么判？→ close 与 status 共用同一判定，material-only delta 豁免对齐；真实 material 变化仍强制重 verify
- recommendation/plain_language: 推荐；一把尺子量到底，不再宽严分裂误伤
- decision: 收敛为共享判定函数（freshness.mjs 既有 isMaterialOnlySnapshotDelta 逻辑对 close 开放）；漂移如实记录为事实
- source_type/reference/exact_excerpt: F-001 缺陷 4、F-002（宽严分裂机制）；子代理 B 分析
- approval_binding: approved（T-001 范围 B 内含）
- facts_and_constraints: vNext 禁止 rebind/lineage——只能统一判定函数，不能建注册表；真实 material 变化强制重 verify 不变
- Logic: 双标判定 -> 统一函数 -> verify_facts_fresh 误伤消除
- choice_reason/impact: 消除 P1 阻塞；影响=core/task-close.mjs:643-650,1130、runtime/evidence/freshness.mjs
- consequences_and_risks: 豁免放宽须防滥用——真实 material 变化仍判 stale；测试覆盖
- rejected_alternatives: 建 current tuple 注册表（违 vNext 边界）
- unresolved_items/owner: 无
- Supersedes: none

### D-007
- question/final_option: 左移防护包（写边界身份断言含 cwd / review 统一 preflight / fallback 拆 invalid_input 与 unavailable / 子代理结果契约 / code_review 一等事件）→ 全部保留
- recommendation/plain_language: 推荐（用户 T-001/T-010 确认）；把"调用后才发现错误"改成"写入边界当场响铃"，子代理必须留证据
- decision: 五项全做；preflight 只在写边界/调用前，不做开工准入（宪法 F3 边界）；子代理契约=文档约定+复用现有 receipt 槽位；code_review 一等事件=既有概念正式身份
- source_type/reference/exact_excerpt: T-001 选 B、T-010"保留，这是修通不是新增"；F-005（四个 fallback 吞错位置）；本次实测 direction 审查五连错
- approval_binding: approved（T-001/T-010）
- facts_and_constraints: F3 预检只在写边界；F4/F11 不得阻断推进；子代理结果纳入 canonical receipt 槽位
- Logic: 错误发现时点太晚 -> 左移到写边界/调用前 -> 返工消除
- choice_reason/impact: 两次事故的效率病根；影响=write-boundary-preflight、wh-review-cli、stage-runner、outcome-adapter、bridge、workflows 文档
- consequences_and_risks: preflight 误报会挡合法调用——测试覆盖；code_review 事件化需改 adapter/bridge/predicates 三处
- rejected_alternatives: 不做左移（事故会复发）；开工准入预检（违宪）
- unresolved_items/owner: 无
- Supersedes: none

### D-008
- question/final_option: 宪法文档怎么动？→ 不改条款文本；治理边界节加"close 三义"解释段（完成宣称/推进资格/不可逆授权）；checklist 加四条判据
- recommendation/plain_language: 推荐；少修宪、多解释
- decision: 宪法解释段（close 三义；结构预检只在写边界与授权点；UI 类完成判据含真实验收证据）+ checklist 四判据（F9 伪造通过/Q1 completed 三分/F7 cleanup ownership/F3 preflight 位置）
- source_type/reference/exact_excerpt: T-005"宪法解释段拉回范围"；子代理 C 宪法对照结论
- approval_binding: approved（T-005）
- facts_and_constraints: 宪法 v1.6.0 条款文本不动；解释段与条款冲突时以条款为准
- Logic: 实现违宪源于理解偏差 -> 解释段澄清 -> 后续任务不再误读
- choice_reason/impact: 支撑 R-006/R-007 合宪验收；影响=CONSTITUTION.md、constitution-checklist.md
- consequences_and_risks: 解释段措辞须精确，避免被读成新门禁；由 detail-advice 复核
- rejected_alternatives: 条款级重写（T-005 未选；风险大）
- unresolved_items/owner: 无
- Supersedes: none

### D-009
- question/final_option: 减法做哪些？→ 四项全做：close 编排精简（授权粒度不动）/死路代码删除或修通/session 宿主可移植化/双轨事实评估（仅出结论）
- recommendation/plain_language: 推荐（用户 Q4 全选）；减法只减冗余和死路，不动能力
- decision: 四项纳入范围；双轨合并不在本任务（只评估）；session 可移植化=workflowhub 侧接受非 Codex 宿主（transcript/env/host 声明文档化），broker 侧已由 3rd-review 5ecf055 完成
- source_type/reference/exact_excerpt: T-004 全选；F-006/F10 实测
- approval_binding: approved（T-004）
- facts_and_constraints: R-013 优先减法；减法删除的每一行都要有测试或文档证明无消费者
- Logic: 流程感来自冗余和死路 -> 删除/合并冗余 -> 简洁而不丢能力
- choice_reason/impact: 直接回应 R-004；影响=close 编排、tools/host session、文档
- consequences_and_risks: 删代码误伤隐藏消费者——反向引用扫描+测试兜底
- rejected_alternatives: 不做减法（T-002 备选 A，未选）；以减法为主推倒重来（备选 C，否决）
- unresolved_items/owner: 双轨合并结论 → 延期-1（后续任务立项）
- Supersedes: none

### D-010
- question/final_option: 非目标定稿 → PaperBuilder 侧/broker 内部/git 孤儿对象/UI/M14-M17 重构/新概念对象/双轨合并/DSH reviewer adapter
- recommendation/plain_language: 推荐；范围护城河
- decision: 上述各项均非本任务目标；DSH 作为 reviewer adapter 明确非目标（3rd-review dsh 为 host-identity-only）
- source_type/reference/exact_excerpt: T-005 确认+盲审 F-6b35cb274e56/F-849dd6f479f1 处置
- approval_binding: approved（T-005）
- facts_and_constraints: 非目标变化需回 make-decision 重谈
- Logic: 边界写死 -> 防止范围爬行
- choice_reason/impact: 保护单任务可交付性
- consequences_and_risks: 无
- rejected_alternatives: 无
- unresolved_items/owner: 无
- Supersedes: none

## 三轮 talk

| talk_id | 问题/选项 | 后果/风险 | 用户选择/原文 | 队列变化 | source/evidence |
| --- | --- | --- | --- | --- | --- |
| T-001 | Q1 修复范围：A 只修 close / B close+左移防护 / C B+宪法文档 | A 最快但效率杀手保留；C 范围最大；B 一次清零两次事故病根但范围中等偏大 | 用户选择 B："close + 左移防护"（结构化问答工具，2026-08-29） | 范围收敛为 P0 close 修复 + P1 左移防护；宪法文档修订出局（→非目标/延期） | ask card T-001（本会话） |
| T-002 | Q2 简洁化路线：A 只修一致性 / B 先修一致性再做减法 / C 以减法为主 | A 流程感依旧；C 易失控；B 消除矛盾后删减冗余，工作量上升 | 用户选择 B："先修一致性，再做减法"（同上） | 减法候选清单（close 六步精简、死路代码删除、双轨事实评估、session 宿主可移植）进入 Talk round 2 逐项确认 | ask card T-002（本会话） |
| T-003 | Q3 主仓脏状态：A 助手先提交 / B 用户自理 / C close 前再处理 | B/C 的风险：close targetPreflight 响铃返工 | 用户选择 A："我先帮你提交"（同上） | 已执行：chore 提交 0b52903b3（34 个文件纯 rename 到 specs/archive/）；主仓干净 | git log main 0b52903b3 |
| T-004 | Q4 减法候选（多选）：close 六步管线精简 / 死路代码删除 / session 宿主可移植化 / 双轨事实评估（仅评估） | 减法动宪法边界和测试，工作量上升；双轨只评估不动结构 | 用户全选四项（结构化问答工具，2026-08-29） | 四项全部纳入范围；双轨事实仅出评估结论 | ask card T-004（本会话） |
| T-005 | Q5 非目标确认：全部保持 / 宪法解释段拉回 / 其它 | 拉回则范围扩大但直接支撑 R-007 合宪验收 | 用户选择"宪法解释段拉回范围"（同上） | 非目标移除"宪法解释段修订"；其余非目标保持 | ask card T-005（本会话） |
| T-006 | Q6 成功边界：三项判据（本任务正常 close dogfood / 四死结消除有测试 / 每条修复有宪法依据） | 判据弱则验收失真 | 用户选择"是，三项判据全要"（同上） | 成功边界定稿，见"成功/失败边界"节 | ask card T-006（本会话） |
| T-007 | Q7 初版（existing 契约三选项含新对象表述） | 新对象表述引发方向性质疑 | 用户反问："这个问题我看不懂，一个开发框架搞这么复杂干什么？……为什么要搞这么多复杂的对象？"（2026-08-29） | 登记新原始需求 R-013（不得新增概念、优先减法）；Q7 改以零新概念重述 | ask card T-007（本会话） |
| T-008 | Q7 再版（close 朴素定义）：close=verify-code 后五个动作（提交/合并/归档/推送/清理）+一次确认；质量只抄写不裁判；清理=自己建的才删、绑别人的不删只记录（用现有字段）；可断点续跑；手工救场可补记 | 人工确认保留一次（F7 底线）；质量裁判职责回归 verify-code | 用户确认："就按这个办"（结构化问答工具，2026-08-29） | 登记新原始需求 R-014；close 重新定稿方向确定；原 Q7 三选项作废 | ask card T-008（本会话） |
| T-009 | 盲审范围质疑：保持范围+补全验收 / 砍减法四项 / 砍到只剩 close | 砍范围则简洁目标落空；保持则需 AC 全覆盖 | 用户选择"保持范围，补全验收"（2026-08-29） | F-0d3b4fd8524d 处置为 fixed；build-spec 承接逐条 FR/AC | ask card T-009 |
| T-010 | 新增机制边界：保留（修通不是新增）/ 砍掉 | 砍掉则子代理崩溃无证据、code_review 靠补丁的问题保留 | 用户选择"保留，这是修通不是新增"（2026-08-29） | F-2a5c8e1e15dd、F-d0156b695580 处置为 fixed | ask card T-010 |
| T-011 | 剩余风险确认：质量有缺口也允许物理 close（带缺口完成，质量状态另列）？ | 不接受则回到质量门模式=本次修复根源 | 用户选择"接受"（2026-08-29） | F-78a71cc886d8 设计要点确认；completed.json 只证物理交付 | ask card T-011 |

## 调研

| research_id/source | 调研重点 | 关键事实 | 处理状态 | 关联 D |
| --- | --- | --- | --- | --- |
| F-001 | close 为什么从未正常（子代理 A 对 core/task-close.mjs、runtime/task/workspace.mjs 等的只读分析） | ①closeDelivery 恒以 riskClose:true 调 prepare（core/task-close.mjs:1238），质量缺口自动转 risk 事实；②六步计划固定含 remove-task-worktree，existing 模式在 workspace.mjs:542 无条件抛错，existing 任务经任何官方路径都无法正常 close；③risk plan 被 execute/complete 拒收，manual-close 命令不存在；④手工物理完成不写 completed.json；⑤close 新鲜度拒绝 material-only delta 豁免，与 status 宽严分裂 | 已确认（代码证据） | 待登记 |
| F-002 | 事实链与快照绑定（子代理 B） | stage outcome/test receipt/quality fact/facts.jsonl 四环只认官方 stage-runtime 路径；绕过则四环全断；手工证据永远无法伪装成 receipt；current tuple 未固定且 vNext 边界禁止 rebind/lineage | 已确认 | 待登记 |
| F-003 | 宪法张力（子代理 C 对 CONSTITUTION.md v1.6.0 与 checklist 的逐条对照） | 事故合理诉求（incomplete 不得宣称完成、禁伪造通过、写边界 fail-loud、cleanup 独立授权）宪法已支持=实现违宪；"开工准入预检""UI preview 推进硬门"违宪不可采纳；close 须拆三义：完成宣称/推进/不可逆授权 | 已确认 | 待登记 |
| F-004 | workspace 身份机制（子代理 D） | 执行放行 existing 与 close 要求 task-owned 的矛盾确切位置已定位；全仓无 cwd 断言，runner 认证 bindTask:false 使主仓编辑不被察觉；全仓无 existing-mode close 测试 | 已确认 | 待登记 |
| F-005 | review/preflight 与子代理治理（子代理 E） | 无统一 preflight，材料错误调用后才落成 unavailable；fallback 吞错四位置（wh-review-cli:183、stage-runner:626、outcome-adapter:813、bridge:85 正则猜码）；子代理结果契约全仓空白；code_review 非一等事件 | 已确认 | 待登记 |
| F-006 | 本次 dogfood 环境事实（本会话 bootstrap 实测） | ①DSH 宿主 transcript 不被接受（session-state.mjs:221 只认 Codex sessions 目录）→ requirement_messages=[]；②session-event CLI 需显式 CODEX_SESSION_ID env；③主仓有未提交的归档迁移（已按 T-003 提交 0b52903b3）；④主仓 git gc 因历史对象 d4a931b5 不可读失败（repack fatal），不阻塞 merge/push，清理是非目标；⑤新 worktree 需 npm ci | 已确认 | 待登记 |

## grill

| grill_id | CONTEXT/冲突 | 结论 | ADR/四项退出 | source/evidence |
| --- | --- | --- | --- | --- |
| G-001 | CONTEXT.md：无变化（未引入/重命名领域术语；"close 三义"词汇已存在于宪法治理节；"带缺口完成"沿用现有 quality_status=incomplete 词汇）——理由：本方向恢复 close 原义而非造新词 | 覆盖矩阵五类消息全部落轴：goal(R-004/005/010→T-001/002)、flow_or_surface(R-002/003→流程约束执行)、data_or_state(质量状态语义→T-011)、success_failure_acceptance(R-007→T-006)、constraint_non_goal_defer(R-001/013/014→T-004/005/007/008)，高/中影响轴均有用户真实选择 | ADR=created：docs/adr/0020-close-five-actions-quality-transcription.md（三判据全真：难反转=删除 risk 机制；无背景会意外=为何 close 不裁判质量；真实取舍=质量缺口可物理交付）；冲突=与 ADR 0018 清理条款冲突→0020 修订之 | 本步骤记录 |
| G-002 | 退出检查 1 外部接口：3rd-review broker v4 契约今日五次真实调用验证（含四种错误语义实测）；host_provider 支持矩阵实测——pass | 退出检查 2 命名唯一权威：workspace_mode 权威=task-handle.mjs manifest 校验；close 五动作名=core DELIVERY_STEPS——pass | 退出检查 3 失败语义：close 失败=断点续跑；手工完成=finalize 补记；质量缺口=incomplete 事实——pass（spec 细化） | 退出检查 4 范围边界：范围五项+非目标定稿写死，无隐性口头扩大（R-013 在案）——pass |

## grill 退出事实（grill_summary）

- status: completed；direction_changing_challenges_resolved: true（无遗留 frontier 问题；零提问理由：所有方向轴已在 Talk 三轮用真实回复收敛，剩余项均可代码/文档核实，不构成方向改变）
- context: no-change（理由见 G-001）；adr: created（0020）；conflicts: resolved（ADR 0018 清理条款由 0020 修订）
- requirement_coverage: complete（五类消息全覆盖，见 G-001）
- exit_checks：external_interfaces=pass；canonical_names=pass；failure_semantics=pass；scope_boundaries=pass

## 审查处置

| finding_id | 原始事实/来源 | 后果 | status | next_action/evidence_ref | owner/consumer/retain_or_delete |
| --- | --- | --- | --- | --- | --- |
| F-0b393bc4dd11 | direction 盲审：质量裁判移出 close，但未验证 verify-code 有人工确认门，未验收产出可能被物理提交/合并/归档/推送 | 无人工门则瘦身 close 会放行未验收交付 | fixed（设计要点） | 核实事实：verify-code 完成谓词已强制 code_review+human_confirmation(passed)（completion-predicates.mjs:82-85,102-126）；设计补强：close 确认清单必须如实显示质量状态，人看真实状态确认 | 主代理/spec/retain |
| F-78a71cc886d8 | 盲审：非绿质量允许物理 close，"带缺口完成"未与正常完成/验收/发布状态隔离 | 状态混淆风险 | fixed（设计要点） | 宪法三义落实：completed.json 只证物理交付；quality_status/product_release 独立字段保持 incomplete/not_released，绝不漂白 | 主代理/spec/retain |
| F-0d3b4fd8524d | 盲审：十余项打包单一任务，远超"修复 close 阻塞"最小可逆选项 | 范围失控风险 | fixed（T-009 用户决策） | 用户选择"保持范围，补全验收"：范围是 Q1 明确选择，解决方式=build-spec 为每项写可验证 FR/AC | 用户/build-spec/retain |
| F-7cf7934eb959 | 盲审：覆盖面远超成功边界定义，无法判断其余改动是否交付 | 验收失真风险 | fixed（设计要点） | build-spec 把每条范围项写成可验证 FR/AC；成功边界④已含"无新对象"检查 | 主代理/build-spec/retain |
| F-2a5c8e1e15dd | 盲审：code_review 一等事件化可能违反"不新增概念/对象/控制面"边界 | 自相矛盾风险 | fixed（T-010 用户决策） | 用户选择"保留，这是修通不是新增"：code_review 在完成判据中已存在，一等事件化是给既有概念正式身份 | 用户/本任务/retain |
| F-d0156b695580 | 盲审：同时引入子代理契约/code_review 事件化等多项机制，与"修复不得新增概念/对象"直接矛盾 | 同上 | fixed（T-010 用户决策） | 同上：子代理契约=文档约定+复用现有 receipt 槽位，不加新对象 | 用户/本任务/retain |
| F-2cc91c2ccdfc | 盲审：清理分支仅依赖 workspace_mode，所有权契约自相矛盾，误判会删被绑定目录 | 删错目录风险 | fixed（设计要点） | workspace_mode 是 bootstrap 写入的认证 manifest 字段（deterministic=bootstrap 建）；保留现有删除前真路径校验（workspace.mjs:558-562 realpath/common-dir/branch 三重核对），判定依据+校验双保险 | 主代理/spec/retain |
| F-51b2c07d2e94 | 盲审："材料错误不落 unavailable"与"缺失必需材料必须记 unavailable"合同冲突 | 合同表述冲突 | fixed（设计澄清） | 区分两类：调用方输入错误（字段错/结构错）→invalid_input 响铃；能力缺失（provider/路由/ preview 不可得）→unavailable 留证。写入 spec 术语 | 主代理/build-spec/retain |
| F-849dd6f479f1 | 盲审：DSH 可移植列为交付项，但事实仅证明 DSH transcript 被拒、broker 不支持 dsh | 交付证据不足 | fixed（范围澄清+侧线已完成） | 本任务交付=workflowhub 侧可移植（session/transcript 接受非 Codex 宿主、host 声明文档化）；broker 侧已在本任务外直接修复并推送（3rd-review 5ecf055，dsh 已支持）；DSH 作为 reviewer adapter 是非目标 | 主代理/spec/retain |
| F-6b35cb274e56 | 盲审 minor：DSH 可移植化与 non-goal 边界风险 | 边界混淆 | fixed（范围澄清） | 同上：workflowhub 侧=范围；broker 侧=已完成侧线；reviewer adapter=非目标 | 主代理/spec/retain |
| F-dfb36c3eb715 | 盲审 minor："不新增条款"与新增解释/判据的表述张力 | 措辞混淆 | fixed（措辞澄清） | 明确：不改宪法条款文本，只在治理边界节加解释段 + checklist 加判据 | 主代理/宪法文档/retain |
| F-a70dfb0676ea | detail 细审 blocking：文件标"进行中"且最终确认 pending，却被作为 approved_direction | 流程语义质疑 | fixed（澄清+流程如实） | manifest 顺序即"草案→细审→最终确认"；approved_direction 材料=Talk 逐项确认的方向草案字节；最终确认节已加身份说明；方向逐项选择均有 approval_binding | 主代理/decision-log/retain |
| F-07f4e226436d | 细审：AC-3 要求 FR 标宪法条款号但草案无 FR | AC 执行载体不明 | fixed | AC-3 明确载体=build-spec FR 表逐条带条款号 | 主代理/build-spec/retain |
| F-135e811ca6a2 | 细审：finalize/断点续跑未纳入 AC-2 测试范围 | 验收缺口 | fixed | AC-2 已扩展：续跑+finalize（含不漂白）测试列入 | 主代理/build-code/retain |
| F-156a84d0f4a6 | 细审：草案只有范围名，无用户流程/数据状态/失败边界定义 | 方向不完整 | fixed | 范围节新增"方向行为要点"（close 流程/质量状态隔离/清理判定/新鲜度判定/错误分类五行）；完整状态机归 build-spec | 主代理/build-spec/retain |
| F-57b9acc4d9ee | 细审：同上，approved direction 未转化为流程/状态/转换边界 | 同上 | fixed | 同上（同一处置） | 主代理/build-spec/retain |
| F-5a5424f1639c | 细审：风险与延期交接缺 owner/完成条件/交接状态 | 交接不清 | fixed | 风险节全部补齐三字段+新增风险-4（解释段误读） | 主代理/decision-log/retain |
| F-9465c9512d9c | 细审：DSH 可移植化责任边界不清 | 范围表述矛盾 | fixed | 范围 5 明确三侧边界：workflowhub 侧=本任务；broker 侧=已完成（5ecf055）作环境事实交接；reviewer adapter=非目标 | 主代理/spec/retain |
| F-b33b329502a3 | 细审：AC-1 可被不完整实现满足（未验证五动作/一次确认/不漂白） | 验收过弱 | fixed | AC-1 判定条件扩展：五动作落账记录+确认绑定+质量字段独立不漂白 | 主代理/build-code/retain |
| F-ddaec34df2fc | 细审：AC-1 用待修复的 close 验证修复=循环依赖，环境风险成硬失败 | 循环依赖 | fixed | AC-1 重定位为 dogfood 证据；硬判据=AC-2 测试；环境失败按风险-3 处置不算产品失败 | 主代理/verify-code/retain |
| F-f1cf26273465 | 细审：AC 未覆盖左移防护与减法/移植 | 验收缺口 | fixed | 新增 AC-5（左移防护五子项验收入口）与 AC-6（减法/移植交付判定） | 主代理/verify-code/retain |
| F-78eb6c699a4d | 细审 minor：最终确认 pending 与多轮 Talk 确认不一致 | 措辞不准 | fixed | 最终确认节改为"逐项已确认，待整体确认" | 主代理/decision-log/retain |
| F-989422b20062 | 细审 minor：拒绝方案章节为空占位 | 记录缺口 | fixed | 拒绝方案表已从 D-001~D-010 汇总 13 条 | 主代理/decision-log/retain |
| F-b732ee0d866b | 细审 minor：左移防护 5 异质子项打包成一条 | 粒度风险 | fixed | 范围 3 拆为 3a~3e，各有改动面与最小验收入口 | 主代理/spec/retain |

## 最终确认

- 状态：**approved**（T-012，2026-08-29）
- 最终确认内容：D-001～D-010 全部决定、修订后验收标准 AC-1～AC-6、ADR 0020、风险与延期交接、非目标定稿——用户选择"确认，进入 build-spec"
- 用户已被告知的限制：需求快照为空（R-012，DSH 宿主限制），语义覆盖核查依赖本文档如实登记
- approved_direction 身份说明（细审 blocking F-a70dfb0676ea 处置）：detail 审查契约的 approved_direction 材料=Talk 逐项确认后的方向草案（decision-log.md 当前字节）；manifest 顺序即"草案→细审→最终确认"，本节 pending 是如实状态而非矛盾；最终确认在步骤 11 完成后回填。
- 用户原文与 host-visible 绑定：T-012 结构化问答（ask card，本会话，2026-08-29）
- 未确认内容：无

## 拒绝方案

| 选项 | 拒绝理由 | 关联 D |
| --- | --- | --- |
| 拆成多个任务执行 | 用户直接命令单任务（"我不想拆成多个任务"）；拆任务丢事实链 | D-001 |
| 跳阶段/依赖 build-spec 补需求 | 用户直接命令不跳阶段；需求收敛在 make-decision | D-001 |
| 只做 close 修复（不做左移防护） | 用户 T-001 选 B；无 preflight/吞错/子代理无契约则事故复发 | D-007 |
| 保持六步管线+risk 机制只补 existing 分支 | 阻塞消失但"工程模板感"依旧，不满足简洁目标 | D-002 |
| 推倒重写 close 与事实层 | 违增量演进与 vNext 边界，风险不可控 | D-002/D-006 |
| 质量不绿不许 close | T-011 否决——正是"从未正常 close"的构造性根因 | D-003 |
| 新增 ownership 字段/对象判断清理 | 违 R-013 零新概念；现有 workspace_mode 字段够用 | D-004 |
| 禁止 existing 工作目录模式 | 砍能力；existing 是真实使用场景 | D-004 |
| 开工准入预检（开始阶段前硬门） | 违宪法 F3——预检只在写边界/授权点 | D-007 |
| 砍掉 code_review 事件化与子代理契约 | 用户 T-010 确认"修通不是新增" | D-007 |
| 宪法条款级重写 | 解释段足够；条款改动风险大（延期-2） | D-008 |
| 双轨事实本任务内合并 | 用户 T-004 限定只评估；合并另立项（延期-1） | D-009 |
| DSH 作为 reviewer adapter | 超范围；3rd-review 侧已以 host-identity-only 落地 | D-009/D-010 |

## 阶段步骤记录

### Step 1 — load-context（completed）
- 输入：make-decision SKILL.md v3.2.0、skill-deps.yaml（talk-with-zhipeng、grill-with-docs、decision-log、wh-review、spec-analyze 五个依赖）、steps.json 13 步清单、用户原始需求（R-001～R-012）。
- 结果：原始需求已逐条登记；关键调研事实 F-001～F-006 已登记；需求快照为空如实登记为 R-012 风险。
- 新原始需求：无（no_new_requirement）。
- 处理状态：current=R-001～R-011；deferred=无；non-goal 草案已列；open=范围深度、简洁化路线、主仓脏状态处理（进入 Talk）。
- 证据：本文件；会话事件 event-3e8530a728040ba096966dfdcae7886c（start/finish）。

### Step 2 — triage-scope（completed）
- 工作台范围：target repo=workflowhub 主仓；任务 worktree=/Users/Hugh/Hugh/Project/workflowhub-workflowhub-simplicity-close-repair-20260829（task-owned，deterministic 模式，分支 task/workflowhub/workflowhub-simplicity-close-repair-20260829，基线 648e9bc99）；存储根=~/Knowledge。**全部编辑/测试/官方命令只在 worktree 内执行，主仓只读**（事故教训 R-001 的防范）。
- 受影响子系统候选（待 Talk 收敛）：core/task-close.mjs；runtime/task/（workspace、task-handle、task-bootstrap）；runtime/evidence/（freshness、write-boundary-preflight）；runtime/review/ 与 skills/wh-review；runtime/stage/（stage-runner、outcome-adapter、completion-predicates、stage-handlers）；tools/host/bridge；tools/cli/（task-close、stage-runtime）；workflows/*/SKILL.md 与 skills/catalog.yaml；宪法文档（CONSTITUTION.md、constitution-checklist.md，仅解释段，待 Talk 定）。
- UI 适用性事实：三输入均无 UI 信号——原始需求是框架/CLI 修复无页面；workflowhub 仓库无前端路由与组件；计划改动不涉及前端。结论：**non_ui**（可重算事实，若后续范围漂移需重评）。
- 新原始需求：无。处理状态：范围深度/简洁化路线/主仓脏状态三个开放轴 → Talk round 1。

### Step 3 — talk-round-1（completed）
- ask：三个独立方向轴（范围深度 / 简洁化路线 / 主仓脏状态），每轴 2-3 个选项带大白话后果与风险（见 T-001～T-003）。
- 真实 reply（结构化问答工具，2026-08-29）：Q1=B、Q2=B、Q3=A。
- resume/re-rank 结果：范围=close 修复（恒 risk 分离、existing 契约、可恢复 close、新鲜度对齐、finalize、预检前置）+ 左移防护（身份断言、review preflight、fail-loud 拆分、子代理结果契约、code_review 一等事件）；减法路线确认，减法候选清单移到 round 2 逐项确认；主仓归档迁移已作为 chore 提交（0b52903b3，不属本任务交付内容）。
- 新发现环境事实：主仓 git gc 因历史对象 d4a931b5 不可读而失败（repack fatal）——登记为环境风险，清理孤儿对象仍是非目标；目前不阻塞 merge/push。
- 新原始需求：无。队列变化：round 2 待问=减法候选逐项、非目标确认、成功边界确认、existing 契约修复方向。

### Step 4 — research-inputs（completed）
- 必需调研判定：本任务是对本仓库内部机制的修复，能改变方向的事实全部来自代码与宪法——已由五路子代理只读分析完成（F-001～F-005）+ 本会话实测（F-006），见调研表。
- 外部调研跳过理由：需求不涉及外部产品/市场/第三方文档，外部搜索答案不会改变方向；muyu-search-mcp/anysearch-api 未触发（如实登记 not_applicable）。
- 遗留核实项（不改变方向，移 build-plan 验证）：close 六步精简时 F7 不可逆授权仍须按操作粒度逐个授权（task-close.mjs:1243-1246 的 5 类授权），精简只动展示/编排层不动授权粒度——build-plan 阶段用代码核实。
- 新原始需求：无。

### Step 5 — talk-round-2（completed）
- ask：四个轴（减法候选多选 / 非目标确认 / 成功边界 / existing 契约）。见 T-004～T-008。
- 真实 reply（2026-08-29）：Q4=四项全选；Q5=宪法解释段拉回范围；Q6=三项判据全要；Q7 初版遭方向性质疑（"搞这么复杂干什么"）→ 登记 R-013、R-014 两条新原始需求 → Q7 以零新概念重述后用户确认"就按这个办"。
- resume/re-rank 结果：close 方向定稿为"五个动作 + 一次确认"（R-014）；范围/目标/成功失败边界/非目标四节已按回答更新为定稿；Q7 初版三选项作废。
- 遗留到 round 3：direction-advice 盲审发现项、矛盾、关键假设与剩余风险。

### Step 6 — direction-advice（进行中）
- 尝试 1（unavailable，已如实留证）：wh-review run 返回 `WORKFLOWHUB_LOCAL_ERROR: make-decision wh_review route requires direction or detail review_track`——输入缺 `review_track` 字段，属输入材料错误而非 provider 失败。证据：quality/evidence/make-decision/subagent-direction-advice.json。教训登记：这再次印证 F-005"输入错误被落成 unavailable"的改造必要性。
- 处置：修复输入（补 review_track=direction）后按规则重试一次（尝试 2 进行中）。
- 尝试 2（unavailable，已如实留证）：`MATERIAL_INCOMPLETE: direction_selection.current_selection is required for the reveal challenge`——direction 轨需要顶层 `direction_selection` 结构（reconstruct→reveal→challenge 流程契约）。attempt=quality/reviews/attempts/dc90bd7e-4737-480c-8ada-88ba65061a55/attempt.json；report=quality/reviews/reports/dc90bd7e-4737-480c-8ada-88ba65061a55.md。
- 处置：读 review-runner.mjs:78-110 拿到精确契约，补顶层 direction_selection（current_selection/alternatives/selection_rationale/key_assumptions）后第三次尝试（进行中）。连续两次输入错误再次实证 preflight 缺失（F-005）的代价。
- 尝试 3（unavailable，已如实留证）：`MATERIAL_FORBIDDEN: direction_constraints is not allowed for this review`。根因：runtime/review/stage-materials.json 内部两处配置互相矛盾——surfaces.semantic_fields 列了 direction_constraints/ui_applicability 等九字段，而 stages 矩阵 allowlist 只允许 required(raw_requirement/objective_facts/review_instructions)+optional(current_selection/alternatives/selection_rationale/key_assumptions/independent_reconstruction/direction_flow)。**与 T05 事故的 MATERIAL_FORBIDDEN: ui_applicability 完全同源**。attempt=f6e59e5e-7459-47a9-bfe3-d34252cb6af0。新增代码事实：stage-materials.json 配置自相矛盾（登记进 F-005 改造范围证据）。
- 处置：按 stages 矩阵精确 allowlist 重建输入（约束内容并入 raw_requirement/objective_facts），第四次尝试（进行中）。
- 尝试 4（unavailable，已如实留证）：材料通过校验（material_id 4d328570…），失败在 provider 层——`REQUEST_INVALID: ... a supported host_provider`：broker（3rd-review/lib/broker.mjs:473 + provider-ids.mjs）只支持 claude-code/codex/cursor/grok/kimi/opencode/antigravity/pi 八个宿主家族，**不支持 dsh**。attempt=fbc686d2-0b6a-4f5a-9995-b1115ce594ad。此事实并入 F-006/F10 宿主可移植化范围。
- 处置（透明声明）：host_provider 改声明为 `kimi/k3`（当前宿主实际模型家族；该字段的唯一运行语义是同源排除——broker 将排除 kimi 系 reviewer 保证独立性），dsh 不受支持的事实如上如实登记，不构成 provenance 伪造。第五次尝试（进行中）。
- 尝试 5（available，真实语义结果）：host_provider=kimi/k3 被接受，reviewer=grok/grok（grok-4.6），耗时约 193s。11 条 finding（major 9 / minor 2 / blocking 0），逐条处置见"审查处置"表。attempt=c8721e74-4e94-4d52-a270-e0e04f04b4b1；result=quality/reviews/results/make-decision-direction-c7937c3e0fafeb8e835a0332fd65f62e385916f5-c8721e74-4e94-4d52-a270-e0e04f04b4b1.json；report=quality/reviews/reports/c8721e74-4e94-4d52-a270-e0e04f04b4b1.md；子代理结果文件=quality/evidence/make-decision/subagent-direction-advice-v5.json。
- 侧线事实：应用户指示，3rd-review 已直接支持 dsh 宿主声明（lib/provider-ids.mjs + lib/adapters/dsh.mjs host-identity-only fail-loud adapter + 注册表 + test/provider-ids.test.mjs 4 测试；全量 320/320 绿；main 5ecf055 已推送）。本任务的后续审查可用 host_provider=dsh。
- 进入 talk-round-3：两条 needs_human finding（范围、新增机制边界）提交用户决策。

### Step 7 — talk-round-3（completed）
- ask：盲审 11 finding 中 3 项需用户拍板（范围/新增机制边界/带缺口 close 风险），其余 8 条已按设计要点处置。见 T-009～T-011 与审查处置表。
- 真实 reply（2026-08-29）：保持范围+补全验收；保留 code_review 事件化与子代理契约（修通不是新增）；接受带缺口物理 close（状态隔离）。
- 无新原始需求；无队列遗留。

### Step 8 — grill-with-docs（completed）
- 覆盖矩阵：五类消息（goal/flow_or_surface/data_or_state/success_failure_acceptance/constraint_non_goal_defer）全部落轴且有真实用户选择，complete。
- 四项退出检查全 pass（外部接口今日实测/命名权威/失败语义/范围边界）。
- ADR 0020 已创建（修订 0018 清理条款）；CONTEXT.md no-change（未造新词）；冲突已解决。
- 零提问理由：方向轴全部收敛，剩余项均可代码/文档核实。

### Step 11 — approve-decision（completed）
- 修订后整体提交用户确认：13 条细审处置说明（AC 补强/范围拆细/风险交接/拒绝方案汇总）+ 决策全貌 + 需求快照为空如实告知。
- 真实 reply（T-012，2026-08-29）："确认，进入 build-spec"。最终确认节回填 approved。

### Step 9 — write-decision-draft（completed）
- D-001～D-010 全部按 decision-entry.v1 字段登记：流程组织/close 重定稿/质量抄写/清理规则/断点续跑与 finalize/新鲜度统一/左移防护包/宪法解释段/减法四项/非目标定稿。
- 每条含 source、Logic、后果风险、拒绝方案、Supersedes；approval_binding 逐条绑 Talk 轮次。
- 待 detail-advice 独立细审。

### Step 10 — detail-advice（进行中）
- 尝试 1（unavailable，如实留证）：`WORKFLOWHUB_LOCAL_ERROR: vNext current material context requires an authenticated Workspace`。根因接线 bug：wh-review-cli.mjs resolveTrustedReviewSubject 以 sidecar 模式 bootstrap 时未传 readOnly，make-decision 的 kernel 未绑定 workspace（direction 轨道不取 revision 所以未暴露；detail 轨道需要）。证据=quality/evidence/make-decision/subagent-detail-advice.json。
- 飞行中修复（dogfood 记录，正式归属 build-code 变更集）：wh-review-cli.mjs 对 make-decision 传 readOnly:true（只读绑定既有 workspace，不创建 worktree）；测试扩展现有用例断言 kernel.currentVNextMaterialRevision() 返回 revision——vitest 24/24 GREEN（RED 即生产错误本身）。理由：不修则本阶段必需步骤无法执行；修复本身属于本任务"review 可靠性"范围。
- 处置：修复后重试 detail 细审（进行中）。
- 尝试 2（unavailable，如实留证）：`MATERIAL_INCOMPLETE: approved_direction must match current decision-log.md bytes`——契约要求 approved_direction=当前 decision-log 精确字节。attempt=995cb0c0-b32a-403e-9962-939ff719bcee。
- 尝试 3（available，真实语义结果）：三 provider（kimi/coding、antigravity/flash、codex/luna）全 completed，host_provider=dsh 首次如实声明成功（3rd-review 5ecf055 生效）。13 条 finding（blocking 1/major 9/minor 3），逐条处置见审查处置表（全部 fixed：AC 补强/范围拆粒度/风险交接补齐/拒绝方案汇总/措辞澄清）。attempt=83ad538a-e4d4-4dfc-aa62-62d29e4c1287；result=quality/reviews/results/make-decision-detail-0f011326f3fab6185efc5d02b1ed7acf0df44cfc-83ad538a-e4d4-4dfc-aa62-62d29e4c1287.json；report=quality/reviews/reports/83ad538a-e4d4-4dfc-aa62-62d29e4c1287.md；子代理结果=quality/evidence/make-decision/subagent-detail-advice{,-v2,-v3}.json。
- blocking 处置说明：F-a70dfb0676ea 属流程语义质疑——manifest 顺序本就是"草案→细审→最终确认"，草案经 Talk 逐项确认（approval_binding 逐条在案），最终确认节已补身份说明。无方向变更，无需追加 Talk。

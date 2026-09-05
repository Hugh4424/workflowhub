# Spec — workflowhub-execution-efficiency-20260902

> 来源：decision-log.md（D-001~D-008、R-001~R-102、F-001~F-018/F-201~F-206、C-001~C-003）。
> 本文件只拥有产品行为、流程、状态、FR、AC、失败边界与产品侧契约；工程实现归 plan.md/tasks.md。

## 1. 速读

- **目标**：让 workflowhub 执行更快更稳——消除身份/存储错位与审查链路不稳造成的整轮重跑与关闭阻塞；保持宪法边界、不新增维护成本对象。
- **用户结果**：使用 workflowhub 的 agent 与任务 owner 不再被 `untracked evidence hash mismatch` 整轮重跑、`session_task_binding_mismatch` 噪音、wh-review 0 字节无法判成败、双存储根歧义所困扰；每个 stage 结束时能在大白话总结里看到被遗漏的 step/skill。
- **紧迫性**：高——同类问题已造成 m16 任务 31+11 次重试、PaperBuilder f17 verify-code 无法关闭。
- **业务影响**：workflowhub 自身及其宿主项目（PaperBuilder 等）的执行时长与可信度。

## 2. 用户与场景

用户=运行 workflowhub 的 AI agent 会话与任务 owner（人）。本规格无终端页面（UI applicability=non_ui，见 decision-log）；可观察面全部是 CLI JSON 输出、任务存储事实与技能文档文本。

- **SCEN-01（默认）**：agent 在认证 worktree 中执行正式 run，step/skill 事实经显式 run 输入携带，流程与今天一致。
- **SCEN-02（身份缺失）**：agent 在非认证目录调用 stage-runtime 且未显式传 --project/--task → 行为：fail-closed 报错（缺身份），不猜测、不写任何任务存储。
- **SCEN-03（身份冲突）**：显式标志与认证 worktree 派生身份不一致 → fail-closed 报冲突，由人消解。
- **SCEN-04（存储漂移）**：writer 写入路径与解析链（env > config > home）不一致，或存在可疑第二存储根 → doctor 输出 `warnings` 字段如实描述，exit 0（C-002）。
- **SCEN-05（旧树访问）**：人翻到旧 Knowledge tree → 树根存在 `ARCHIVED.md` 只读说明（C-003），指明权威根与休眠日期。
- **SCEN-06（diff 证据）**：build-code 发布后，执行者继续改动 untracked 文件 → verify 时重算哈希不匹配 → 仍然 fail-closed 报错（语义不削弱）；但正常流程（发布后不再改）不再误报整轮重跑。
- **SCEN-07（wh-review 0 字节）**：broker 收到 provider 0 字节/非法 JSON 输出 → 标记内部标签 `contract_failure`；原始流只保留在 broker/host 私有诊断中，WorkflowHub 任务材料与公共边界只暴露错误码、脱敏消息和 stdout/stderr 摘要哈希。
- **SCEN-08（wh-review partial）**：部分 provider 成功、部分失败 → `available-with-failures`：逐 provider 保留错误事实；输入无变化不重试；永不声明 pass。
- **SCEN-09（stage 结束）**：stage 大白话总结列出所有非 completed 的 step/skill 及原因（R-006）。
- **SCEN-10（B5b 接管）**：当前任务完成 T9 后直接接管五份 SKILL.md 改写与 session 三件套删除，同批原子交付（C-001）；不等待 usability 任务状态或时间条件。

## 3. 范围与非目标

- **范围**（对应 decision-log D-002/D-003/D-004/D-005/D-006/D-007）：B 面 doctor 一致性 + writer 来源记录 + 旧树归档 + untracked 冻结时机；B5a/B5b 移除会话绑定族；C 面 broker 契约守护 + partial 处置 + 隐私边界 + 调用约定文本；R-006 披露文本。
- **非目标**（决策日志非目标节逐条有效）：不碰任务 A 领地（stage-runner 失败通道、verify-code 绑定派生、close 授权链、预检器）；不新增公共行为类；不做真异步机制；不迁移旧树数据；不做机器核对注入；不改五阶段骨架；不做 lesson 注入（M16）。

## 4. 产品事实（PFACT）

- PFACT-01：存储根解析优先级 = env `WORKFLOWHUB_TASK_DIR` > `~/.config/workflowhub/config.json` `task_dir` > home 默认；launcher-only，不看 cwd/git（F-206）。
- PFACT-02：会话绑定族 = `tools/host/workflowhub-codex-session-{state,hook,event}.mjs`；合并当前 `main` 后，生产消费者仍包括 `tools/cli/stage-runtime.mjs`、`tools/cli/task-bootstrap.mjs`、`workflowhub-stage-agent-bridge.mjs` 的 `session.session_id` 输入面，以及五份 SKILL.md 文本；本任务仍负责按 FR-005/FR-006 移除这些消费面（F-201）。
- PFACT-03：合并当前 `main` 后，五份 SKILL.md 已加入 stage-reflection 说明，但仍保留"同一会话自动记录"段与 `workflowhub-codex-session-event.mjs` 指令；B5b 交付必须按内容级零残留和遗漏披露段验收，不能按文件是否被修改判断；这只是交付验收条件，不是等待外部任务的启动门禁（F-202，2026-09-04 rebaseline）。
- PFACT-04：diff 证据的 untracked blob 哈希在捕获时冻结（canonical receipt 写入路径），verify 时重算比对，不一致即抛错（F-203）。
- PFACT-05：doctor 当前输出 JSON（stage/task_id/worktree_root/baseline_commit/materials），正常 exit 0，异常抛错非零（F-204）。
- PFACT-06：合并当前 `main` 后，wh-review broker 已有本地 120000ms bounded timeout，并将超时标记为 `PROCESS_TIMEOUT`，simple runner 对外归一为 `REVIEW_EXECUTION_TIMEOUT`；0 字节/非法 JSON 仍需本任务补充专属 `contract_failure` 语义；隐私守卫在多处抛 `PUBLIC_RESULT_INVALID`；main 的 provider-protocol 规定 WorkflowHub 不读取 broker private raw，非 JSON 输出只保留 stdout/stderr SHA-256，不把原始流或主机路径写入任务材料；配置 `wh_review.v2`（profiles/minimum_heterologous）（F-205，2026-09-04 rebaseline）。
- PFACT-07：M15 监控链已退休（commit 95bfa2247）；CONTEXT.md:274 明文拒绝宿主身份系统扩展（F-017/F-018）。
- PFACT-08：DSH 宿主下会话事件链整体不可用（本会话全部实测 unavailable）（make-decision F-013 等）。

## 5. 功能需求（FR）

> 编号说明：FR-001~007=B 面（原 FR-B1~B6），FR-008~011=C 面（原 FR-C1~C4），FR-012=遗漏披露（原 FR-R6）；纯编号归一，语义不变。

- **FR-001 doctor 存储一致性检查**：doctor 输出新增存储一致性段：解析链各来源（env/config/home）的实际值、选中的来源、任务写入根、是否存在可疑第二根（已知旧树路径模式）；发现漂移或可疑第二根时写入 `warnings` 数组（机器可读、逐条含类型与路径），exit 保持 0（来源 D-004、C-002；场景 SCEN-04；验收 AC-1）。
- **FR-002 writer 解析来源记录**：任务存储的 writer 在 task.json 记录本次写入使用的解析来源（env/config/home 之一），供 doctor 交叉核验（D-004；SCEN-04；AC-1）。
- **FR-003 旧树归档标记**：在旧 Knowledge tree 根放置 `ARCHIVED.md` 只读说明（权威根、休眠起始日期、禁止写入声明）；**该文件的首次创建是唯一被豁免的一次性写入**，除此之外不迁移、不修改旧树任何数据（D-004、C-003；SCEN-05；AC-2）。
- **FR-004 untracked diff 证据唯一捕获点**：untracked 文件哈希的唯一捕获点移到发布事务内（与实现发布同一时机同事务）；捕获后的任何修改在 verify 重算时仍然 fail-closed 报错；历史错误样例转为 fixture 重放验证（D-003；SCEN-06；AC-3）。
- **FR-005 移除会话身份派生**：删除 stage-runtime 的会话身份派生路径与 task-bootstrap 的绑定调用；任务身份改为显式 `--project/--task` 优先、认证 worktree 派生其次；缺失或冲突时 fail-closed。**同族消费面含 stage-agent bridge 的 `session.session_id` 输入**：移除后该输入改为显式参数携带；无显式输入时该桥接能力如实不可用（unavailable），不得从环境猜测会话身份（D-007、PFACT-02；SCEN-01/02/03；AC-5/AC-6）。
- **FR-006 移除 session 三件套 + SKILL.md 原子批**：删除 session-state/session-event/session-hook 三件套，同批改写五份 SKILL.md（移除"同一会话自动记录"段、新增遗漏披露段）；**必须先于或同于 CLI 删除交付，绝不允许先删 CLI 留旧指令**；T9 完成后由本任务执行者直接接管全批，接管动作=在 build-plan 对应任务卡中记录当前任务已接管，并完成内容级零残留校验；不依赖 usability 任务合并、取消或等待时限。五份 SKILL.md 即使已被其他改动部分更新，也必须由本批统一核对并保证 bridge、三件套删除、文档改写同一 git 提交原子交付（D-006/D-007、C-001、PFACT-03；SCEN-09/10；AC-6）。
- **FR-007 身份解析算法**：优先级=显式 `--project/--task` > 认证 worktree 派生。认证 worktree 的定义=该目录是经任务清单（manifest）登记的任务 worktree，能从中读出已登记的 project/task 身份；派生即读取该登记身份；比较前对 project/task 做统一规范化（去空白、精确匹配）；显式与派生冲突=fail-closed 报冲突；两者皆缺=fail-closed 报缺身份；登记损坏/不可读=fail-closed；旧任务记录中的 session 字段只读保留、不再消费（D-007；SCEN-02/03；AC-5）。
- **FR-008 broker 输出契约守护**：broker 读取 provider 输出处加契约守护：0 字节或非法 JSON → 标记内部标签 `contract_failure`（非公共行为，公共行为保持七类）；原始全文只保留在 broker/host 私有诊断中，WorkflowHub 任务材料只保留 stdout/stderr 摘要哈希，公共输出只含错误码+脱敏消息（D-005、PFACT-06；SCEN-07；AC-4）。
- **FR-009 partial 处置规则**：`available-with-failures` 语义写死：逐 provider 保留错误与状态；相同输入不重试；partial 永不当 pass；处置矩阵明细（timeout/partial/invalid/0字节/unavailable 各自终态+重试条件+完成影响）在本规格数据契约节给出（D-005；SCEN-08；AC-4）。
- **FR-010 隐私边界**：原始 provider 错误全文只留在 broker/host 私有诊断中；**WorkflowHub 任务与公共/跨任务边界枚举**=task records、wh-review CLI stdout JSON、canonical review result 记录、审查报告投影、跨任务 quality facts——均只保留错误码、脱敏消息和 stdout/stderr 摘要哈希；既有 `PUBLIC_RESULT_INVALID` 守卫行为不变（D-005、PFACT-06；SCEN-07；AC-4）。
- **FR-011 调用约定文本化**：wh-review 技能文档声明：长审查由宿主后台执行+轮询收集；不引入任何真异步机制/新的状态对象或新的进程管理。本任务保留合并自 `main` 的既有本地 bounded timeout，不重复实现另一套超时/进程生命周期控制（D-005；SCEN-08；AC-7）。
- **FR-012 遗漏披露规则**：五份 SKILL.md 的阶段末交接段新增规则：stage 结束大白话总结必须列出所有非 completed 的 step/skill 及真实原因；与 FR-006 同批交付（D-006；SCEN-09；AC-6）。

## 6. 验收标准（AC）

### AC-1 doctor 存储一致性报警（FR-001/FR-002）
场景：表驱动用例覆盖——a) 三来源（env/config/home）各自生效时的选中来源；b) writer 写入根与选中来源不一致（漂移）；c) 存在可疑第二根（已知旧树路径模式）；d) task.json 的 write_resolution_source 与实际来源一致/不一致；e) 历史任务 task.json 无该字段。
验证：通过=每例输出机器可读的 resolution_chain（三来源实际值）、selected_source、task_write_root、suspected_secondary_roots、warnings[] 全部正确，漂移与第二根如实入 warnings，历史缺字段显示 unknown 而非误报，exit 恒为 0；失败=任一字段缺失/漏报/误报/非零退出。证据类型=测试捕获 JSON。

### AC-2 旧树只读归档标记（FR-003）
场景：人打开旧 Knowledge tree 根目录，应看到归档说明并知道权威根与禁止写入。
验证：通过=旧树根存在 ARCHIVED.md 且含权威根路径、休眠起始日期、禁止写入声明，且全程对旧树零写入；失败=文件缺失/内容不全/有任何写入。证据类型=文件事实。

### AC-3 untracked diff 证据冻结时机（FR-004）
场景：a) 历史 mismatch 样例转 fixture 重放；b) 正常流程（发布后不再改 untracked 文件）端到端；c) 发布后再改 untracked 文件。
验证：通过=正常流程不再误报整轮重跑；发布后修改仍 fail-closed 报错；且有工具断言捕获恰好一次、发生在最后一个 writer 完成之后、处于发布事务内；捕获/发布中断时不产生半成品证据（fail-closed 回滚）；失败=任一方向失守。证据类型=fixture 与测试结果。

### AC-4 wh-review 终态与隐私（FR-008/FR-009/FR-010）
场景：分别构造 provider 五种终态——timeout、partial、PUBLIC_RESULT_INVALID、0 字节/非法 JSON、宿主链不可用。
验证：通过=各终态如实记录、0字节/非法输出被 contract_failure 拦截、partial 不当 pass、相同指纹输入不被重试（修复致指纹变化后恰好允许一轮）、broker/host 私有诊断保留原始事实且任务与公共边界只保留错误码、脱敏消息和摘要哈希、公共边界经测试证明无私有路径泄漏；失败=任一终态被当 pass/相同输入被重试/任务材料或公共边界泄漏原始流或本地路径。证据类型=测试捕获（含私有诊断与任务/四处公共边界的逐一断言）。

### AC-5 身份解析与执行事实完整性（FR-005/FR-006 输入面/FR-007）
场景：fixture 覆盖六例——显式标志、认证 worktree 派生、显式/派生冲突、两者皆缺、登记损坏、旧任务（含 session 字段）；另对显式与派生两种正常路径各跑一次正式 run。
验证：通过=正常路径执行成功且仍产出完整、按 manifest 顺序的 step_outcomes/skill_outcomes（经显式 run 输入携带），缺失/不匹配的记录被拒绝；冲突/缺失/登记损坏均 fail-closed 且不写存储；旧 session 字段可读不消费；失败=任一场景猜测、静默、或执行事实链断裂。证据类型=测试捕获。

### AC-6 B5b 原子批零残留（FR-006/FR-012）
场景：原子批交付后全仓检索 session-event 与绑定族引用，并检查五份 SKILL.md 阶段末交接段。
验证：通过=原子性不变量成立——三件套删除与五份 SKILL.md 改写落在同一 git 提交（同一 change-set），该提交同时包含全部删除与全部改写，任一部分缺失即整体拒绝；且交付后全仓引用零残留、五份 SKILL.md 均含遗漏披露规则段；失败=存在先删后改窗口/引用残留/部分应用。证据类型=提交内容断言+检索结果。

### AC-7 调用约定纯文本（FR-011）
场景：检查 wh-review 技能文档的调用约定段与全仓公共行为清单。
验证：通过=文档声明宿主后台执行+轮询约定，且无新增公共行为类/状态对象/进程管理；失败=文本缺失或机制被引入。证据类型=文档事实。

## 7. 数据与状态契约

- **provider 终态矩阵**（FR-009 明细，消解 decision-log OPEN-004）：
  | 终态 | 内部标签 | 重试条件 | 对完成声明的影响 |
  | --- | --- | --- | --- |
  比较键=既有 material_fingerprint（材料指纹）：指纹不变=同一输入，一律不重试；指纹变化=新输入，允许一轮新审查。"修复后重试"均指修复后材料/配置变化导致指纹变化。
  | 终态 | 内部标签 | 重试条件 | 对完成声明的影响 |
  | --- | --- | --- | --- |
  | timeout（broker/宿主侧） | `PROCESS_TIMEOUT`（公共归一化为 `REVIEW_EXECUTION_TIMEOUT`，完成语义仍为 unavailable） | 指纹变化后可重试 | 只限完成声明，不阻塞同 task 修复 |
  | partial | available-with-failures | 指纹不变不重试 | 永不当 pass |
  | PUBLIC_RESULT_INVALID | unavailable（隐私守卫） | 脱敏修复致指纹变化后重试 | 同上 |
  | 0 字节/非法 JSON | contract_failure | provider 修复致指纹变化后重试 | 同上 |
  | 宿主链不可用 | unavailable | 换宿主/修配置后重试 | 同上 |
- **doctor 存储一致性段**：字段含 resolution_chain（三来源实际值）、selected_source、task_write_root、suspected_secondary_roots、warnings[]；全部机器可读。
- **任务身份**：{project, task} 二元组；来源=explicit|worktree；旧 session 字段只读。
- **task.json 新增字段**：write_resolution_source ∈ {env, config, home}（FR-002）。
- **兼容性**：旧任务记录、旧 receipt、旧 review 只读保留且可读路径不回退；旧 task.json 无 write_resolution_source 字段时 doctor 显示 unknown（历史记录）而非误报漂移；wh-review 输出 schema 不新增公共字段（contract_failure 为内部标签；原始流只在 broker/host 私有诊断中保留，任务材料仅保留错误码、脱敏消息和摘要哈希）。

## 8. 风险、假设与未决

- RISK-S-01：与任务 A 在 stage-runtime.mjs 同文件不同区；merge 冲突不可调和时本任务让路（owner=双任务 owner；关闭条件=双方契约测试绿）。
- RISK-S-02：B5b 涉及 usability 任务曾改动的五份 SKILL.md，存在并行修改冲突风险；处置=C-001 由本任务在 T9 完成后直接接管，先检查当前工作树和文件冲突，再做 bridge、三件套、五份文档的原子批（关闭条件=原子批交付）。
- RISK-S-03：宿主子代理不稳定（本任务已三次失败）；降级=主会话亲自执行（关闭条件=不影响交付）。
- RISK-S-04：grok/grok 与 opencode/pax3.8 provider 身份连续失效（decision-log OPEN-007，owner=用户择机核查配置）。
- 假设 A-01：T9 完成后本任务可独占 B5b 文件边界；A-02：旧树保持休眠只读；A-03：任务 A 不反向触碰本任务分区。
- 未决（转 build-plan）：OPEN-P-01 diff 证据发布事务的具体实现位置（decision-log OPEN-006）；其余方向级未决均已在 make-decision 收敛。

## 9. 排除与交接

- 排除：任何页面/交互/视觉诉求（non_ui）；任何新公共行为类；任何对任务 A 领地的修改。
- 交接 build-plan：按 FR-001~B6/C1~C4/R6 排实施顺序与任务拆分；B5a 完成后，B5b 由本任务直接接管并原子交付；注意 stage-runtime.mjs 内部分区纪律；验证命令与测试选型归 build-plan 决定。
- 本阶段澄清记录：spec-clarify trigger=true（理由：C-001 B5b 接管、doctor 报警形态、归档标记载体三处材料歧义无法从既有决策推导）；一轮真实 ask→wait→reply→resume，用户 2026-09-03 真实回复：C-001 B5b 接管=本任务负责；C-002 doctor=JSON warnings+exit 0；C-003 归档标记=旧树根 ARCHIVED.md。2026-09-05 用户进一步明确：C-001 不设置等待时限，本任务在 T9 完成后直接接管。当前开放问题：0。注：认证 transcript 绑定的 clarify receipt 依赖 Codex 会话链，在 DSH 宿主不可用——此缺口如实保留，clarify 质量事实将显示 missing，不伪造。

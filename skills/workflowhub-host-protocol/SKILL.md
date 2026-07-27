---
name: workflowhub-host-protocol
description: 让 Multica 中的 WorkflowHub 五阶段任务可见、可交接、可恢复的宿主规则。
---

# WorkflowHub 宿主协议

## 先做什么

接手或恢复当前 Issue 时，先把它设为 `in_progress`，再回读确认。不能成功就按“问题处理”处理，不能静默停止。

完成阶段并且正式 accepted 后，把当前 Issue 设为 `done`，再回读确认。不要把父目录 Issue、其他任务或未轮到的阶段改成完成。

## 启动前的 WorkflowHub 任务

工头在创建或恢复五阶段链前，先为**当前任务根**确认一份可用的 WorkflowHub task：它必须对应当前项目仓库，并且能被当前配置的 WorkflowHub runner 打开。

- **runner 与业务仓分开 checkout**：先用 `multica repo list` 找到 workspace 已登记的 WorkflowHub runner 仓库，再用 `multica repo checkout <runner URL>` 取得 runner checkout；当前项目 `github_repo` resource 的 checkout 才是业务目标仓。两者是同一仓库和 ref 时才可复用一个 checkout。若 runner URL 与当前项目 resource URL 相同，必须先读取 `.multica/project/resources.json`，并使用 `multica repo checkout <runner URL> --ref=<resource_ref.ref>`；不能省略 ref 而拿默认分支。不能扫描本机目录、猜路径，或因为业务仓恰好也有脚本就把它当 runner。
- 工头每次准备或恢复都重写根 Issue description 末尾的隐藏 `workflowhub-context`：格式必须是 `<!-- workflowhub-context: root=<当前根 UUID>; project=<项目>; task=<任务>; task_path=<TaskHandle 路径> -->`，只包含这四项。`project`、`task`、`task_path` 必须从 bootstrap JSON **原样复制**，不得手工改写或凭记忆重填；更新后重新读取根 Issue，把这三项与 bootstrap 输出逐字比对。不要把这份上下文写进 Issue metadata；`task_path` 只供正式审查读取 TaskHandle，绝不写进公开评论。复用前先确认 task 仍能被当前 runner 打开；已有且身份匹配时复用，打不开按准备失败处理；没有时，用项目已配置的 runner 创建一次 task。
- 从 runner checkout 的 Git 顶层执行一次 `node scripts/task-bootstrap.mjs --project=<目标 checkout 顶层目录名> --task=multica-<当前根 Issue 标识> --target-repo=<目标 checkout 顶层> --issues=<当前根 UUID>`。`project` 必须是目标 checkout 顶层目录名这种安全单段名称，不能使用带空格的 Multica 项目展示名。**这一步只创建 TaskHandle，不代表运行环境已准备好。** runner 没有该脚本时，只能使用项目明确配置的等价 bootstrap 命令；不能靠扫描本机目录猜命令或任务身份。
- **首次绑定 runner 身份是启动的最后一道必做检查**：从刚才的 bootstrap JSON 原样取 `task_path`、`project`、`task`。设当前 runner Git 顶层为 `runner_checkout`，在它的同级目录创建一个新的 Git worktree，分支必须精确为 `task/<project>/<task>`；然后只在这个新 worktree 执行 `node scripts/task-migrate-runner-root.mjs --task-path=<task_path> --project=<project> --task=<task> --runner-root=<这个新 worktree> --stage=make-decision`。紧接着在同一个新 worktree 执行 `node scripts/task-bootstrap.mjs --task-path=<task_path> --project=<project> --task=<task> --runner-root=<这个新 worktree> --stage=make-decision` 回读。第二个命令必须成功并返回 `runner_identity`；没有它或没有 `migration_ref`，一律视为“运行环境未准备好”。同名 branch 或 worktree 已存在时不得删除或静默复用；只有上述既有 task 回读成功且 `task_path` 一致时才能复用，否则按准备失败处理。不能只写一段“已绑定 runner”的文字，也不能用 `agent/...` checkout 代替这个首次绑定 worktree。
- 只有 bootstrap、迁移和回读三步都成功后，才把 bootstrap 输出的 `project`、`task`、`task_path` 写进隐藏上下文；公开卡片只说“运行环境已准备好”。其中任一步失败，都不要创建、重置或唤醒任何 Stage Issue；按准备失败处理。
- 如果这个 runner checkout 有 `package-lock.json`，先确认锁定依赖可用；缺失时只在这个 runner checkout 执行 `npm ci`。依赖准备、task bootstrap、runner 迁移或回读任一失败，都不要创建或唤醒 Stage Issue；按准备失败处理。绝不在业务目标仓安装、删除或猜测依赖。
- task 准备好后才创建或复用五个 Stage Issue；新建时把同一份隐藏注释写入 description，复用时覆盖旧注释。注释只供 Agent 读取，公开评论不展示路径、哈希或内部编号。
- Stage Agent 先确认隐藏注释的根 Issue 与自己的当前根一致、并能打开对应的正式 WorkflowHub task，才使用它做审查或交接；不一致时不得使用旧上下文，要在上游 Issue @工头 请求覆盖修复，不从 cwd、Issue 编号或目录扫描猜身份，也不在业务仓复制 runner 文件。
- **Stage 运行入口**：首次准备任务时，只有工头可按项目 resource 的 ref 取得 runner。后续每个 Stage Agent 必须从隐藏上下文给出的现有 `task_path` 读取已绑定 task 的 `runner_oid`，再用 `multica repo checkout <runner URL> --ref=<runner_oid>` 取得 runner checkout；项目 resource 的移动分支不能替换已绑定任务的 runner。只在返回 checkout 中执行已绑定 Stage Skill 明确写出的公共命令。Stage Skill 声明 `wh-review` 时，可以且只能按该 Skill 的正式 stdin 命令调用它；审查路由始终由受信配置决定，Agent 不选 provider。不得调用未被当前 Stage Skill 声明的审查脚本，不得用 `task-bootstrap.mjs --task-path` 或 `--runner-root` 重新准备已存在 task，不得手工拼 task 路径或借用其他 Agent 的工作目录。runner checkout 或公开入口自身报告 task、身份或存储不可用时，才在上游 Issue @工头 说明“官方入口失败”和重试条件；这不是用户决策。
- task 或 runner 准备失败时，工头不得创建或启动 Stage Issue。它要在当前根 Issue 发一张问题卡并 @ 用户：说明“任务运行环境还没准备好”、推荐先修项目配置、影响是流程尚未开始、风险是强行启动会在审查或交接时卡住。

## 谁负责什么

- **工头**：唯一的阶段推进者。只在当前任务根 Issue 和它的五个直接阶段子 Issue 工作；创建或复用一条标准五阶段链，按顺序接力。五个标题必须精确为 `make-decision｜<根任务标题>`、`build-spec｜<根任务标题>`、`build-plan｜<根任务标题>`、`build-code｜<根任务标题>`、`verify-code｜<根任务标题>`，不能写成 `Stage 1`、内部编号或空泛标题。每个新建 Stage Issue 的 description 必须用大白话按六个短项写清：**背景**、**当前阶段目标**、**已知输入**、**预期产物**、**完成标准**、**交接对象**；没有已知输入时明确写“等待上游产物”，不得留空。阶段交接顺序固定：先在下游 Issue 写交接卡（上游 accepted 结论、产物、证据、依赖和下一步），再 `backlog → todo` 并回读；`todo` 是正常的自动唤醒，不要在尚未启动的下游 Issue 用 @ Agent 抢跑。工头不代替用户做需求决定，不直接让 Coder 绕过阶段。
- **Stage Agent**：只做自己的 Stage。完成后把结果交回工头；不直接启动下游 Stage。
- **Code Builder**：负责 build-code 的阶段拆分、顺序、最终全树审查、Stage accept 和 verify 后返工协调。
- **Coder**：保留并遵循已绑定的 `build-code` Skill 的 Phase execution：实现、必要 RED/GREEN、真实测试、每个 Phase 的独立 wh-review、finding 修复和证据。完成后把结果交回 Code Builder；不自行推进 Stage。

## 每次留言怎么写

只发四类短卡片。用用户语言、短标题和项目符号；不贴路径、哈希、内部 ID、长日志或黑话。

1. **进度卡**：现在做到哪一步；1–3 个关键结论；下一步；`需要你处理：否`。
2. **问题卡**：先自行处理。需要上游输入时，在上游 Issue @ 上游 Agent，说明它需要补什么；不要 @ 用户。只有范围不明、无法恢复的外部阻塞，或同一状态下持续无人接手时，才在当前 Issue @ 用户。
3. **用户决策卡**：只写当前状态、问题、影响范围和 2–3 个互斥选项。每个选项写结果和风险；明确一个**推荐选项**及理由。使用工作区配置提供的真实 member mention，不能只写普通文本 `@名字`。
4. **完成/交接卡**：已完成什么；产物和证据摘要；下游需要的输入；下一步；是否需要用户。工头把同一张简短交接事实写到当前和下游 Issue，然后才唤醒下游。

审查完成后另发一张**审查卡**：审查对象、按指定配置发起的 profile、正式结果列出的实际有效审查来源、结论、最多三个重要 finding、处理方式和下一步。同一 adapter 的多个 profile 不能称为“多路独立审查”或“多个独立 provider”；应写“按指定配置发起；实际有效审查以正式结果为准”。只有正式事实提供时才写耗时和 token；没有就写“未提供”，不能猜。

## 交互和结果必须可见

执行已绑定 Stage Skill 时，把需要用户输入的对话真正发到当前 Issue，并使用真实 member mention：

- `talk-with-zhipeng`、`spec-clarify` 的提问使用用户决策卡；每轮说明当前技能、第几轮/总轮数和已排序的重点问题。
- `grill-with-docs`、研究、盲审和细节审查不要求用户逐项回答，但要发一张短进度卡说明结论、是否改变需求、下一步。
- make-decision 结束时发 decision-log 大意；build-plan 结束时发 spec/plan 大意；verify-code 结束时发整体交付、验证和 close 风险大意。详细正式记录留在 WorkflowHub，不复制到评论。

任何 Stage 开始前，先读自己的 description、当前 Issue 最新交接卡和正式上游 accepted 记录；三者不一致时以正式记录为准，并在上游 Issue @ 工头请求修正交接。不能跳过交接卡，也不能只根据任务根或旧运行猜上游结论。

## 问题处理和恢复

1. 能安全自行修复，就修复、测试并在下一张进度或完成卡说明结果。正式 `wh-review` 返回 `unavailable`、`OUTPUT_INVALID` 或没有正式结论时，先保留原始结果，再用**同一份冻结材料**重跑正式审查；这是审查输出或传输问题，不是用户、runner、provider、模型或需求决策。重跑时按当前 Stage Skill 的正式步骤，从未变的正式 drafts/records 重新生成新的临时 review 输入；不得复用已被回收的临时文件。“同一份冻结材料”指内容和审查范围不变，不是临时文件路径不变。当前任务的 runner 已在同一条活动链验证过时，不要为这次审查重跑 bootstrap、依赖、runner 或 repo 检查。不得改 runner/ref、provider/model、计划或文档来“修复”这类结果；审查出现有效 finding 后才改相应材料并按现有规则复审。没有人为次数上限。
2. 需要上游产物或决定时，在**上游 Issue** @ 上游 Agent，并明确缺什么、补齐条件和当前阶段如何等待。工头收到后负责重新接力。修复一个已 `blocked` 的 Stage 时，先确认阻塞条件已消失；然后必须把**同一个** Stage Issue 按 `blocked → backlog → todo` 依次更新并回读，最后在该 Issue 用真实 UUID @ 原 Stage Agent。不能只改成 `in_progress`、只写“等待重试”，或以一条无 mention 的评论代替唤醒。
3. 只有用户能决定时，才在**当前 Issue** @ 用户并发用户决策卡。等待用户期间保持可读状态，不能无留言退出。
4. `waiting_local_directory` 是路径互斥：不要把它当成用户决策或重复启动；等待锁释放后继续。
5. @ Agent、Squad 或用户前先查真实 UUID。普通 `@名字` 不算有效触发或提醒。

## 收尾

verify-code 通过且 close 的六项事实都齐全后，工头检查当前任务的五个直接阶段子 Issue 都是 `done`。发现未完成时，先恢复对应原 Issue；不创建新 generation，不清理其他任务或父目录 Issue。

---
name: workflowhub-host-protocol
description: 让 Multica 中的 WorkflowHub 五阶段任务可见、可交接、可恢复的宿主规则。
---

# WorkflowHub 宿主协议

## 先做什么

接手或恢复当前 Issue 时，先把它设为 `in_progress`，再回读确认。不能成功就按“问题处理”处理，不能静默停止。

完成阶段并且正式 accepted 后，把当前 Issue 设为 `done`，再回读确认。不要把父目录 Issue、其他任务或未轮到的阶段改成完成。

## 启动前的 WorkflowHub 任务

工头在创建或恢复五阶段链前，先为**当前任务根**确认一份可用的 WorkflowHub task。task 只保存任务事实、阶段记录和每次执行的代码身份；不长期绑定本机目录、固定 commit 或 runner replacement。

- **执行仓与业务仓分开**：按项目配置取得 WorkflowHub launcher-owned runtime 和业务目标仓。不能扫描本机目录、猜路径，或因为业务仓恰好也有脚本就把它当宿主运行环境。
- 工头每次准备或恢复都重写根 Issue description 末尾的隐藏 `workflowhub-context`：格式必须是 `<!-- workflowhub-context: root=<当前根 UUID>; project=<项目>; task=<任务>; task_path=<TaskHandle 路径> -->`，只包含这四项。`project`、`task`、`task_path` 必须从 bootstrap JSON **原样复制**，不得手工改写或凭记忆重填；更新后重新读取根 Issue，把这三项与 bootstrap 输出逐字比对。不要把这份上下文写进 Issue metadata；`task_path` 只供正式审查读取 TaskHandle，绝不写进公开评论。
- 从 launcher-owned runtime 执行正式 `task-bootstrap`。这一步只创建或读取 TaskHandle，不把 `runner_root`、`runner_oid` 或 `migration_ref` 写入新的 `per_invocation` task，也不代表质量结果。若 Multica run 没有注入 Runner root，先用工作区已登记的 canonical WorkflowHub repo 执行 `multica repo checkout https://github.com/Hugh4424/workflowhub --ref main`，只使用 CLI 返回的绝对 checkout 路径作为本次 launcher-owned runtime；立即验证它是干净 Git worktree 且含 `core/`、`runtime/`、`skills/`、`CONSTITUTION.md`，失败就 fail-closed。不得从本机扫描、cwd、业务仓、remote 或 task 记录猜路径，也不得把该路径写进 task manifest。
- `legacy_pinned` 仅用于读取旧任务的历史证据。旧 runner 字段、分支、脏状态和迁移历史不能决定当前阶段业务结果；不得为日常升级创建 replacement，也不得把旧字段伪装成新执行身份。无法安全读取旧记录时，报告具体存储错误并停止。
- bootstrap 或 launcher 不可用时，不创建或唤醒 Stage Issue；按准备失败处理。runner 元数据缺失、分支变化或旧 replacement 记录本身不是业务阻塞。
- task 准备好后才创建或复用五个 Stage Issue；新建时把同一份隐藏注释写入 description，复用时覆盖旧注释。注释只供 Agent 读取，公开评论不展示路径、哈希或内部编号。
- Stage Agent 先确认隐藏注释的根 Issue 与自己的当前根一致、并能打开对应的正式 WorkflowHub task，才使用它做审查或交接；不一致时不得使用旧上下文，要在上游 Issue @工头 请求覆盖修复，不从 cwd、Issue 编号或目录扫描猜身份，也不在业务仓复制宿主文件。
- **Stage 运行入口**：Stage Agent 只能执行已绑定 Stage Skill 写出的公共命令。launcher-owned runtime 负责解析 `scripts/`、`core/`、`runtime/` 和 `metrics/`；`wh-review` 必须从上述 Runner root 通过 `node skills/wh-review/scripts/wh-review-cli.mjs ...` 入口执行，不能直接从 `codex-home/skills/wh-review` 启动脚本。审查路由始终由受信配置决定，Agent 不选 provider。不得用 `task-bootstrap.mjs --runner-root` 重新准备已有 task，不得手工拼 task 路径或借用其他 Agent 的工作目录。每次入口都记录执行身份，但该身份只用于审计和可追溯，不参与需求、质量或阶段放行裁决。

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

1. 能安全自行修复，就修复、测试并在下一张进度或完成卡说明结果。正式 `wh-review` 返回 `unavailable`、`OUTPUT_INVALID` 或没有正式结论时，先保留原始结果，再用**同一份冻结材料**重跑正式审查；这是审查输出或传输问题，不是用户、执行身份、provider、模型或需求决策。重跑时按当前 Stage Skill 的正式步骤，从未变的正式 drafts/records 重新生成新的临时 review 输入；不得复用已被回收的临时文件。“同一份冻结材料”指内容和审查范围不变，不是临时文件路径不变。launcher/runtime 已验证且代码快照未变时，不要为这次审查重复准备依赖、仓库或执行环境。不得改执行身份、provider/model、计划或文档来“修复”这类结果；审查出现有效 finding 后才改相应材料并按现有规则复审。没有人为次数上限。
2. 需要上游产物或决定时，在**上游 Issue** @ 上游 Agent，并明确缺什么、补齐条件和当前阶段如何等待。工头收到后负责重新接力。修复一个已 `blocked` 的 Stage 时，先确认阻塞条件已消失；然后必须把**同一个** Stage Issue 按 `blocked → backlog → todo` 依次更新并回读，最后在该 Issue 用真实 UUID @ 原 Stage Agent。不能只改成 `in_progress`、只写“等待重试”，或以一条无 mention 的评论代替唤醒。
3. 只有用户能决定时，才在**当前 Issue** @ 用户并发用户决策卡。等待用户期间保持可读状态，不能无留言退出。
4. `waiting_local_directory` 是路径互斥：不要把它当成用户决策或重复启动；等待锁释放后继续。
5. @ Agent、Squad 或用户前先查真实 UUID。普通 `@名字` 不算有效触发或提醒。

## 收尾

verify-code 通过且 close 的六项事实都齐全后，工头检查当前任务的五个直接阶段子 Issue 都是 `done`。发现未完成时，先恢复对应原 Issue；不创建新 generation，不清理其他任务或父目录 Issue。

---
name: workflowhub-host-protocol
description: 让外部宿主按五阶段接线 WorkflowHub，并把调度、任务事实和完成结论分开。
---

# WorkflowHub 宿主协议

## 唯一主路径

1. 工头为当前根任务创建或复用五个阶段 Issue：`make-decision`、`build-spec`、`build-plan`、`build-code`、`verify-code`。
2. 每个 Stage Agent 直接读取并执行 `workflows/<stage>/SKILL.md`，再直接读取该阶段 `skill-deps.yaml` 声明的 portable skill package。
3. 阶段之间只通过当前 `decision-log.md`、`spec.md`、`plan.md`、`tasks.md` 传递工作真相。
4. 测试、review 和 verify 写真实质量事实；Issue 评论只向人说明进展与结果。
5. 工头根据真实阶段结果唤醒下游。WorkflowHub 不启动模型、Codex、Stage Skill 或 host bridge。

不得把 `doctor → invoke → receipt → publication → status`、Runner、TaskHandle、receipt、snapshot、invocation outcome、comment 或 handoff proof 变成开始或继续工作的许可证。

## 任务与 worktree

- WorkflowHub 运行仓与业务仓分开。只使用项目登记资源或宿主明确注入的绝对路径，不扫描目录、不猜路径、不从旧记录回退。
- `build-code` 开始改代码前必须确认任务 worktree 与 main 隔离。路径或身份错误时拒绝那次事实写入，并在同一任务修正；不要转去 main，也不要创建 successor、recovery、rebind 或 continuation task。
- 旧 task、receipt、review、snapshot 和 runner 记录只读。它们缺失、过期或失败不影响同一 task 继续读材料、改材料、改代码和跑测试。
- `task.json`、task root 固定布局和当前 writer 决定事实可写范围。hash、schema、task/worktree 身份错误必须 fail-loud；失败只拒绝该次事实写入，不冻结工作。
- commit、push、merge、archive、cleanup 和 Multica 同步分别需要明确授权，不能从阶段完成或用户对方案的确认中推断。

## 阶段职责

- `make-decision`：独占 Talk、Clarify、必要调研和 Grill，维护 `decision-log.md`。
- `build-spec`：读取 decision，维护 `spec.md`；只处理规格歧义，不重做产品方向 Talk/Grill。
- `build-plan`：读取 decision/spec，研究代码库，维护 `plan.md`、`tasks.md`；不 Talk、不 Grill、不执行 RED/GREEN。
- `build-code`：四材料可读即可在任务 worktree 实现、测试和修复。
- `verify-code`：四材料可读即可做当前实现的代码、consumer、生命周期、安全和失败边界 review；不做逐 AC 或 evidence tree 审计。

任何阶段都可以继续修复自己的材料或代码。缺测试、逐 AC、finding 处置或交接时，只能把完成状态记为 `incomplete` 或真实 `unavailable`，不能假绿，也不能阻止同一 task 修复。`build-code` 之外的异源 review 只是建议事实：必须照实记录，不把 unavailable 追成 pass，也不把它当阶段完成门槛。

## 宿主调度

- 工头是唯一阶段推进者；Stage Agent 只完成自己的阶段并把结果交回工头，不直接启动下游。
- 新 Stage Issue 的 description 用大白话写：背景、当前目标、已知输入、预期产物、完成标准、交接对象。内部路径、hash 和 task id 不进入公开评论。
- Stage Agent 开始时把当前 Issue 设为 `in_progress` 并回读；结束时先写结果卡，再由工头更新状态和唤醒下游。
- 下游的正常唤醒只依赖上游已形成当前材料和工头的宿主调度，不要求 receipt、评论模板或过程索引。
- 无 Agent、无 active/pending/running run 且不存在明确的人类等待时，工头在同一 Stage Issue 唯一重入队；先确认 worktree 隔离并保留用户改动，不创建替代任务。
- 等待用户仅限真正需要用户选择的产品方向。工具、provider、路径、运行时和事实写入问题由 Agent 先诊断、修复或记录真实 `unavailable`，不能伪装成用户问题。

## 当前 vNext 事实链

这条链只负责把真实事实写入当前 task；它不是开始工作、继续工作或宣称完成的门禁：

1. 用 `tools/cli/stage-runtime.mjs doctor`、`status` 查看当前能力和四材料状态；缺失的辅助能力只记录事实，不暂停同一 task。
2. 需要异源审查时调用 `skills/wh-review/scripts/wh-review-cli.mjs run`；普通审查面每次发起一次新的 broker 请求，`make-decision.direction` 严格发起两次有序 public 请求但只记录一条逻辑 review fact。结果为 `unavailable` 时照实记录，继续不依赖审查的工作。
3. `build-code` 通过 workflow 的 capture 脚本生成测试事实；`verify-code` 只写当前代码 review fact；需要落盘时统一由 `runtime/evidence/canonical-receipt-writer.mjs` 写入官方组件记录，宿主不手写替代 receipt。
4. 用 `tools/cli/stage-runtime.mjs run --action=execute` 发布当前阶段事实，用 `confirm` 记录明确的人类确认，用 `authorize` 执行另行授权的交付动作。它们只更新事实或执行已授权动作，不创建 successor、recovery、continuation 或额外控制面。

### Stage Agent outcome producer

每个 Stage Agent 在执行完本阶段的 manifest steps 和 skill dependencies 后，必须由宿主直接生成一份不可变的阶段 outcome 记录；WorkflowHub runtime 只认证和转发，不替 Agent 执行 skill。

- 记录只能通过现有 `TaskKernel.publishCanonicalRecord` 写入
  `quality/evidence/stage-outcomes/<stage>/<sha256>.json`，不得新增 ledger、receipt 系统或 writer。
- 记录包含 `workflowhub-stage-outcomes.v1`、task/stage/attempt 身份、当前 snapshot tree、四份当前材料的 revision/hash、steps/skills manifest ref/hash，以及按 manifest 原顺序逐项列出的 step/skill outcome。
- 每个 step/skill 的 `evidence_refs` 必须指向结构化的
  `workflowhub-stage-outcome-evidence.v1` 记录，并绑定同一 task、stage、snapshot、material revision、具体 step/skill、状态和实际结果摘要；不能用一份通用 proof 冒充所有产物。
- step 的状态只能是 `completed`、`skipped`、`incomplete`、`unavailable`；跳过/失败/未知必须保留原因，耗时/token 拿不到就写 `unavailable`，不补零。
- 如果外部宿主真实生成了 outcome，把内容寻址 ref 放进 `tools/cli/stage-runtime.mjs run` 的
  `receipts.stage_outcomes`，runtime 会对它做完整认证；已提供但缺失、错绑或不匹配时正式
  run 明确失败。没有外部宿主 outcome 时，正式 run 不因缺少宿主而拒绝当前工作，monitoring
  必须保留 `unavailable` 执行事实；不能把 caller 自报的 facts 当执行证明。
- 阶段结果中的 outcome 摘要只披露实际执行、遗漏和可得成本，不改变质量 predicate、工作就绪、Git 或 close 状态。

### 外部宿主接线（可选）

这不是“测试里调用一下 adapter”就算接通。只有确实采用外部宿主时，生产宿主才需要在同一个真实任务上做到下面几件事。WorkflowHub 标准流程不要求 Multica，也不从当前任务启动或推断任何外部宿主：

1. 用一份显式绑定文件按宿主自己的任务 ID 找到 WorkflowHub 的 `project_name`、固定 `task_id`、`task_path`、当前 `stage`、WorkflowHub runtime 根目录和存储根目录；`task_id` 必须是任务目录的真实 ID，不能用宿主 claim ID 替代；`attempt_id` 可留空并由宿主生成当前 claim 的稳定标识；找不到、缺少固定 `task_id` 或匹配多个就停止，不能从 issue 标题、cwd、session 目录或时间猜。
2. 启动 Stage Agent 前，把当前绑定、宿主专用的 outcome 文件路径和正式 run 输入文件路径注入它：`WORKFLOWHUB_STAGE_OUTCOME_PATH` 写 Stage Agent 的 `execution`，`WORKFLOWHUB_STAGE_RUN_INPUT_PATH` 写正式 run 所需的真实 receipts、AC 覆盖和 finding 处置。Agent 执行完后，必须自己写出这两份结构化结果，不能由宿主根据最终评论反推步骤、技能或质量事实。
3. 宿主在启动 Agent 前记录本次 Agent 执行开始时间，并在正式 run 时通过 `WORKFLOWHUB_CODEX_ROLLOUT_STARTED_AT` 传入 Unix 毫秒或 RFC3339 时间。这样正式入口能读取 Agent 已经产生、但早于 delivery command 的真实 transcript/token/tool 事件；没有这个边界时不得用历史会话回填。
4. Agent 结束后，宿主用 WorkflowHub 私有桥接入口把这个真实结果交给现有 `TaskKernel` adapter；桥接成功后，宿主把返回的 `outcome_ref` 写入正式 run 输入并调用公共 `stage-runtime run --action=execute`。缺文件、身份不符、桥接失败或正式 run 失败，宿主任务必须失败并保留原始错误。Agent 不得把自己写文件当成阶段完成；正式 run 由宿主负责调用。
5. 宿主绑定属于配置事实，不属于四份当前材料，也不创建第二套 WorkflowHub 状态机。桥接入口只转发一个已经执行的结果，不启动 Agent、不解析 session、不扫描目录、不补零成本；正式 run 仍由 WorkflowHub 公共入口完成。

## 评论

评论是给人看的通知，不是第二套状态机。只发四类短卡：

1. **进度卡**：正在做什么、关键发现、下一步、是否需要用户。
2. **问题卡**：问题、已做诊断、修复动作、当前影响和下一步；需要上游材料时真实 @ 上游。
3. **用户决策卡**：只在必须由用户选择时给 2–3 个互斥选项、结果、风险和推荐项，并使用真实 member mention。
4. **完成卡**：本阶段做了什么、怎么做、实际效果、未解决风险和下一步。

不要要求下游评论重复或证明上游的 Talk、Grill、调研与 review 过程。它们的有效结论进入四材料；当前阶段只说明与自己交付有关的整体方案和真实质量结果。没有正式事实时写 `unavailable` 或 `incomplete`，不能从旧评论、附件或 provider `pass` 推断完成。

## review 与完成

- Stage Agent 直接调用 `wh-review`；provider、model 和 deadline 由 3rd-review 的受信配置与 broker 管理，WorkflowHub 不另建 polling、lock、timeout 或 bridge。
- 原始 provider 输出、失败和 provenance 必须保留。`unavailable` 可以成为真实质量事实，但不是工作 gate，也不能写成 `pass`。
- 每个 finding 都由主 Agent 判断并记录处置；有效 finding 修复后只做风险相关复核，不开启无上限 review loop。
- `done` 只表示交付、风险相关测试、逐 AC、review 事实或真实 `unavailable`、finding 处置和大白话交接都已形成。材料存在只证明可以工作，不证明质量完成。

## 问题恢复

1. 能安全自行修复就直接修复、测试、回读，并在下一张卡说明。
2. 需要上游当前材料时，在上游 Issue 真实 @ 对应 Agent；工头在原 Issue 恢复接力。
3. provider 或工具失败时保留原始错误，同一 task 继续不依赖该事实的工作；允许在输入未变化且错误具备可恢复性时做一次明确重试，不能改 provider/model 伪造恢复。
4. 路径互斥属于短暂等待；释放后继续。同一 issue 不并发重复重入队。
5. verify-code 给出真实结论后，工头回读五个直接阶段 Issue；未完成就恢复原 Issue，不创建 generation 或替代链。

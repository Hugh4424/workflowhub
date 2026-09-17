---
name: workflowhub-host-protocol
description: 规定当前 WorkflowHub 会话如何直接执行五阶段，并把调度、任务事实和完成结论分开。
---

# WorkflowHub 宿主协议

## 唯一主路径

1. 当前 WorkflowHub 会话在认证 task worktree 中读取并执行对应的
   `workflows/<stage>/SKILL.md` 和 `skill-deps.yaml`。
2. 阶段之间只通过当前 `decision-log.md`、`spec.md`、`plan.md`、`tasks.md` 传递工作真相。
3. 测试、review、verify、handoff 和 reflection 只写真实事实；它们不替代四份材料，
   也不授予继续工作的权限。
4. 当前会话通过既有 public `stage-runtime run --action=execute` 发布阶段事实；
   `status` 只读回当前材料、阶段行和质量事实。

当前阶段执行不需要外部 Stage Agent、bridge、host session、transcript 或
`stage_outcome`。这些对象不属于当前 vNext 阶段入口的前置条件。质量事实缺失时降低
完成声明为 `unknown`、`unavailable` 或 `incomplete`，但同一 task 仍可继续诊断、修复和
重跑；真正的产品选择和不可逆交付授权才需要用户介入。

每次阶段调用都必须有可验证的任务身份：公共入口接受成对的 `--project` 与 `--task`，
或从已认证 task worktree 取得身份。身份检查只保护当前写入边界，不把 host 身份、旧
session、cwd 猜测或 transcript 扫描变成新的状态来源。

不得把 `doctor → invoke → receipt → publication → status`、Runner、TaskHandle、receipt、
snapshot、comment 或 handoff proof 变成开始或继续工作的许可证。

## 任务与 worktree

- WorkflowHub 运行仓与业务仓分开。只使用项目登记资源或认证 task worktree 的绝对路径，
  不扫描目录、不猜路径、不从旧记录回退。
- `build-code` 开始改代码前确认任务 worktree 与 main 隔离；路径或身份错误只拒绝那次
  写入，并在同一 task 修复，不创建 successor、recovery、rebind 或 continuation task。
- 旧 task、receipt、review、snapshot、stage outcome 和 runner 记录只读。它们缺失、过期
  或失败不影响同一 task 继续读材料、改材料、改代码和跑定向测试。
- `task.json`、固定 task 布局和当前 writer 决定事实可写范围。hash、schema、task/worktree
  身份错误必须 fail-loud；失败只拒绝该次事实写入，不冻结工作。
- commit、push、merge、archive、cleanup 和外部系统同步分别需要明确授权，不能从阶段
  完成或用户对方案的确认中推断。

## 阶段职责

- `make-decision`：独占 Talk、必要调研和 Grill，维护 `decision-log.md`。
- `build-spec`：读取 decision，维护 `spec.md`，只处理规格歧义。
- `build-plan`：读取 decision/spec，维护 `plan.md`、`tasks.md`，不执行代码。
- `build-code`：四材料可读即可在任务 worktree 实现、测试和修复。
- `verify-code`：四材料可读即可审查当前实现的真实入口、consumer、生命周期、安全和
  失败边界；不做逐 AC 或 evidence tree 审计。

任何阶段都可以继续修复自己的材料或代码。缺测试、finding 处置、reflection 或交接时，
只能把完成状态记为 `incomplete` 或真实 `unavailable`，不能假绿；缺失事实不阻止同一 task 修复。
外部审查服务只是独立质量事实；provider 不可用不阻止不依赖它的工作。

## 当前事实链

1. 用 `stage-runtime.mjs doctor`、`status` 查看能力和四材料状态；辅助能力缺失只记录
   事实，不暂停同一 task。
2. 需要异源审查时调用现有 `wh-review` 入口。复用和 freshness 按当前 review 合同判断；
   `unavailable` 保留原始原因，不追成 pass。
3. 当前会话直接读取阶段技能，使用现有官方 handler 和 TaskKernel writer 写当前质量
   facts、测试证据、handoff 或 reflection。没有对应事实时明确记录缺口。
4. 用 `stage-runtime.mjs run --action=execute` 发布阶段事实，用 `reflect` 发布可选的
   当前会话复盘，用 `confirm` 记录明确的人类确认，用 `authorize` 执行另行授权的交付动作。
   它们分别更新事实，不创建 successor、recovery、continuation 或额外控制面。

### 当前会话执行边界

当前 WorkflowHub 会话是正式阶段执行者。它可以直接读当前材料、调用官方 handler、执行声明的定向
测试和 review，并把实际结果写入当前 task。阶段行的 `stage-end:<stage>` 事实表示这次
WorkflowHub handler/publication 是否成功；没有外部 outcome 不会把成功阶段变成失败。

阶段末 reflection 是非阻断判断。当前会话如有 judgment 就以当前 task/worktree、当前
snapshot 和材料 revision 直接绑定并发布；没有 judgment 或 reflection executor 时记录
`unavailable(executor_absent)`，不伪造执行者、时间、hash 或旧来源，也不阻止阶段推进。

阶段末 handoff 是非权威 current view。它直接读取当前四份材料和当前阶段事实；正常时序
尚未产生的后续材料写 `not_applicable`，当前阶段应有却不可读的材料保持真实失败。

### 历史兼容边界

旧的 `quality/evidence/stage-outcomes/**` 文件及其 bridge/adapter 代码只为历史事实读取、
迁移和兼容测试保留。它们不是当前阶段 producer，不是 current run 输入，不是质量 receipt，
也不是开始、继续、reflection、handoff 或 close 的门。任何“先补外部 Stage Agent outcome
再正式 run”的恢复建议都是错误归因；应回到当前 task 直接执行 public run 并查看真正的
handler、材料、review 或测试错误。

## 评论

评论是给人看的通知，不是第二套状态机。只发进度、问题、用户决策和完成四类短卡；不要
要求评论重复或证明 Talk、Grill、调研、review、session 或 stage outcome 过程。没有正式
事实时写 `unavailable` 或 `incomplete`，不能从旧评论、附件或 provider `pass` 推断完成。

## review 与完成

- `wh-review` 是独立质量建议；provider、model、deadline 和原始失败由既有 review 合同管理。
- 原始 provider 输出、失败和 provenance 必须保留。`unavailable` 可以成为真实质量事实，但不是工作 gate，也不能写成 `pass`。
- 每个 finding 由当前会话判断并记录处置；有效 finding 在当前 task 修复后只做风险相关
  复核，不开启无上限 review loop。
- `done` 只表示实际交付、相关测试、review 事实或真实 `unavailable`、finding 处置和
  大白话交接已经形成。材料存在只证明可以工作，不证明质量完成；Git、release、physical
  close 仍分别记录。

## 问题恢复

1. 能安全自行修复就直接修复、测试、回读，并说明当前影响。
2. 缺当前材料时在同一 task 修复材料 owner 的内容；不创建替代 task。
3. provider 或工具失败时保留原始错误，同一 task 继续不依赖该事实的工作；只在输入未变且
   错误可恢复时做一次明确重试。
4. 路径互斥属于短暂等待；释放后继续。同一 task 不并发重复执行。
5. verify-code 给出真实结论后，按授权范围分别处理修复、交付和 close；不得把未完成的
   质量事实包装成 release 或物理关闭。

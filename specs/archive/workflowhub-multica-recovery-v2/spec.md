# WorkflowHub Multica 恢复规格

## 目标行为

### FR-1 直接阶段执行

宿主选中当前 Stage Agent；Stage Agent 直接读取 `workflows/<stage>/SKILL.md` 及声明依赖。WorkflowHub runtime 不启动 Codex、模型或第二个 Stage Agent。

### FR-2 同 task 继续

`build-code`、`verify-code` 在四材料存在且可读时必须可继续。review/provider、gate、Runner、TaskHandle、receipt、snapshot、bridge、doctor/comment 缺失、失败或僵死不得改变工作资格，也不得创建 successor、recovery、rebind 或 continuation task。

### FR-3 运行事实写入

运行事实只进入既有 `facts.jsonl`、`index.json`、`quality/reviews/`、`quality/tests/`、`quality/verify.json`。task/worktree/runtime/hash/schema 错误只拒绝对应写入；代码编辑、四材料更新、测试和同 task 修复继续。

### FR-4 完成声明

缺真实交付、风险相关测试、逐 AC、异源审查事实或交接时，完成状态保持 `incomplete`/`unknown`/`unavailable`，不得假 PASS。

### FR-5 阶段职责

- make-decision：Talk、Clarify、必要调研、Grill、方向决定。
- build-spec：需求、场景、状态、边界和 AC。
- build-plan：代码库研究、最简单实现、测试计划和任务拆分；不 Grill、不执行 RED/GREEN。
- build-code：实现、真实测试、finding 处置。
- verify-code：需求回放、逐 AC、风险验证、异源复核和结论。

### FR-6 Review 边界

wh-review 直接消费四材料、必要 diff/代码上下文和测试事实；maps 可选。WorkflowHub 调用既有 3rd-review broker，不重复实现 lock、polling、session lifecycle、timeout 或 fallback。原始 provider/model/session/verdict/error/provenance 可回读。

### FR-7 删除与历史

删除对象必须同时清理当前 reader、writer、schema、fixture、manifest 和 public route。历史 reports、旧 review 和失败事实 immutable，不覆盖、不重写为通过。

### FR-8 宿主边界

不修改 Multica 源码或认证/模型/daemon 配置。评论、assignee、Issue 状态只属于宿主通知和调度，不是 WorkflowHub 当前真相或工作 gate。

### FR-9 Phase 质量与交接

有行为代码变更的 Phase 必须在 `plan.md`/`tasks.md` 中声明测试路线：先由 `testing-system-blueprint` 形成风险与证据设计，再由 `test-routing-advisor` 按实际改动选择一个适用的具体测试技能，执行 RED → 实现 → GREEN。具体技能只能从 `backend-testing`、`frontend-testing`、`fullstack-slice-testing` 中选一个；文档或材料 Phase 不强行伪造代码测试。Phase 完成后可产生一个实现提交（提交动作仍需独立授权），并对冻结的候选树做一次 Task-local `wh-review`；该 review 是质量与交接事实，不是开始、继续或写入工作的许可证。

### FR-10 Phase review subject

Phase review 的 subject 只能由 WorkflowHub 根据 `phase_id`、实际变更文件、基线和候选树派生。caller 不得传入 review 文件路径、累计 diff、任意 commit 或旧 snapshot 来改变审查对象；若存在实现提交，必须记录提交 OID、直接 parent、`commit_oid^{tree}` 与候选树绑定，树不一致则该 review 只能是 `unavailable`/`incomplete`，不能伪造 PASS。没有提交时，review 冻结当前候选树并如实记录无 commit，不为此创建 recovery/rebind/continuation 对象。

## 验收条件

- AC-1：生产 runtime 不存在模型 child process、host bridge 或 stage invocation 路由。
- AC-2：四材料正例 ready；一个参数化测试证明八类辅助对象均为 non-gate。
- AC-3：已中断的既有 task 保持原 task id 继续，不创建恢复对象。
- AC-4：错 task/worktree/runtime/hash 只拒绝对应运行事实写入。
- AC-5：缺质量事实不能宣称完成，但同 task 修复继续。
- AC-6：Talk/Grill 只出现在 make-decision 依赖闭包；build-plan 无 Grill/receipt/handoff/comment gate。
- AC-7：wh-review 无 mandatory maps、native lock 或 WorkflowHub provider lifecycle。
- AC-8：27 个事故提交全部有完整 SHA、当前 consumer、处置 Phase 和验证 oracle。
- AC-9：历史 report 字节不变，Multica 源码和配置 pre/post 状态一致。
- AC-10：每个有行为代码变更的 Phase 都能从 `tasks.md` 找到 blueprint、route、一个具体测试技能、RED/GREEN 命令、oracle 和证据路径；无代码 Phase 不产生伪造测试。
- AC-11：Phase review 只审实际 Phase 候选树；有独立授权提交时记录提交 OID、直接 parent，并验证 `commit_oid^{tree}` 与候选树一致，树变化后旧 review 不得继续作为当前事实；无提交时明确记录 `commit unavailable`，不阻止同 task 修复。
- AC-12：`build-plan` 不调用 Grill、不要求 receipt/handoff/comment/quality PASS；`build-code` 执行实时 route 和一个具体测试技能；Phase review 只影响交接质量事实，不影响同 task 工作资格。

## 非目标

- 不恢复 ZHI-938/ZHI-944 的历史状态，不伪造它们已完成。
- 不新增 execution mode、ledger、bridge、receipt replacement 或公共命令。
- 不用测试机器证明整个架构，只验证直接用户行为和高风险边界。

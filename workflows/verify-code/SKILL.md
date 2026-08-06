---
name: verify-code
description: 以资深架构师视角检查需求、设计、实现和测试，并用一次修复、一次异源复核、一次收尾修复完成验证。
version: 4.0.0
---

# Verify Code：架构师验收

## 目标

verify-code 只回答一个问题：当前实现是否完整、合理、能交付。

它要看当前四份材料（current materials）、真实代码和当前改动，重点检查：

- 原始需求有没有漏掉；
- 用户流程、状态、成功和失败边界是否闭合；
- 完整用户流程是否从入口走到成功、失败和恢复结果；
- 设计中的职责、模块接口、复用和失败处理是否合理；
- 代码是否真的实现了设计；
- 验收点和测试是否足够支持结论。

每次结论前都必须做一次语义反向检查：原始需求 → 决策 → Design/spec → 完整用户流程
（入口、成功、失败和恢复）→ plan/tasks → AC → 测试/证据。`requirement_replay` 是否持久化
是可选的审计表现形式，但这次反向检查本身不是可选项；缺少证据只能记为
`unknown/incomplete`，不能算 `pass`。如果 decision-log 明确引用了研究，必须检查对应的当前
研究事实；没有真实研究问题时，`skipped` 也要保留，不能凭空补研究。

本阶段不是重新写 spec/plan，也不是整理审计档案。它 never block a new verification attempt；发现需求本身变了，才回到
make-decision；发现实现问题，回到同一任务修复。

这里的 Design 指 `spec.md` 中的用户可观察需求、流程、状态和验收边界，不是要在
verify-code 重新设计产品。

## 采用的审查方法

主 agent 用本机 `code-review` 的两条线检查：

1. **Spec**：实现是否符合原始需求和四份材料。
2. **Standards**：实现是否符合宪法、仓库约定和安全边界。

同时用 `codebase-design` 的词汇检查 module、interface、seam、depth、locality
和复用。它们是思考方法，不创建额外 ledger、provider 或 stage gate。

WorkflowHub 只调用一次 `wh-review` 做异源复核。它是 one independent `wh-review` semantic/code review，不是
第二个收集器。AgentHub 原
`test-acceptance` 提示词中的真实测试和验收矩阵保留；历史 fresh-replay、重复
gate、重复审查和“必须拿 pass 才能继续”不保留。

## 固定流程：最多四个动作

严格按下面顺序做，最多一次架构检查、两次主 agent 修改、一次异源复核：

1. **架构师检查一次**

   读取 `decision-log.md`、`spec.md`、`plan.md`、`tasks.md`、当前 diff 和真实实现。
   输出短报告：问题、代码/材料锚点、影响、建议、是否属于当前范围。
同时给 every applicable acceptance criterion 一个简短结论：`pass`、`fail`、`unknown` 或 `deferred`。证据缺失不能算 pass。

2. **主 agent 修改一次**

   主 agent 逐条判断第一步的 findings。只修合理且影响交付的问题；无效 finding
   记录理由；不为格式或审计偏好扩散范围。所有修改在同一任务完成，不创建 successor、
   replacement review 或新 ledger。

3. **异源审查一次**

   修改后调用一次 `wh-review`。它看当前验收标准、架构师短报告、最终测试摘要和
   未决风险，重点找需求遗漏、架构边界错误、实现与设计不一致、失败路径遗漏。
   `pass`、`revise_required`、`unavailable` 都只是事实；不因 provider verdict 反复循环。

4. **主 agent 最后修改一次**

   主 agent 逐条判断异源 findings。修复有效且影响交付的问题，记录无效或延期项。
   这是最后一批修复；修复后只做受影响测试和一次最终测试/检查，不再开启新的审查轮。

`verification.json` 可以用一个很短的 `review_cycle` 记录这四步；它是交接摘要，
不是第二套状态机。每个 finding 必须留下来源、影响、判断、处理或延期对象，但不要求
为每个历史来源重新建一条 requirement replay；原始需求回放只保留为可选审计事实，不重复建立历史台账。

## 测试和证据

- 最终测试命令只读 `tasks.md` 的 final route，不硬编码 `npm test`；它形成一个 current complete test command
  和 current complete-test fact，并绑定当前 snapshot。要得到 `passed`，current complete test suite is green，
  且 every applicable AC is `pass`（或明确 `not_applicable`）。
- 第一次架构检查前可以读已有测试事实；修复生产代码后只跑受影响测试。
- 最终只跑一次声明的最终测试。测试失败是 `failed`；超时、缺失或环境不可用是
  `unknown/incomplete`，不能重跑到变绿。
- 每个适用 AC 只保留一个简短结果：场景、预期、实际结果和覆盖限制。已有 canonical
  acceptance evidence 可以复用；不为审查包复制完整日志、全量 evidence tree 或历史 replay。
- CLI/runtime 任务记录 `browser_qa=not_applicable` 及理由；只有 UI 任务才做真实浏览器验收。
- 旧 receipt、旧 review、旧 audit 只作背景，不能证明当前代码正确，也不能触发循环。
- Old and historical receipts, reviews, and audits are read-only background; they never license or block current progress.

## 结论

- `passed`：当前代码符合四份材料，适用 AC 有结果，最终测试通过，异源审查已做且没有
  未处理的严重问题。
- `failed`：代码、测试或 AC 明确失败；回同一任务修复，但不新建任务。
- `incomplete`：测试、审查、AC 或快照事实缺失/不可用/超时；如实显示缺口，不伪造 pass。

在交接中用大白话说明：检查了什么、修了什么、审查指出什么、最后还剩什么风险。
verify-code 的确认只确认这份验收结论；confirmation accepts only this verification conclusion，does not authorize
irreversible action；这是 normal verify-code confirmation，不是 close。failure never authorizes close；close 需要
separate explicit authorization。
close、commit、push、merge、archive 和清理
仍需 separate explicit authorization。

## Keep it simple

保留能回答当前验收问题的最小事实；不为了让表格、receipt 或 provider packet 看起来
完整而新增字段。review、测试或 evidence 缺失时标 `unknown/incomplete`，但不因此开新循环。

## 不做的事

- 不把 requirement replay、历史 inventory、review packet hash 或 provider transport
  变成当前交付 gate。
- 不因为 reviewer 没有 pass 就无限重审。
- 不用一次全量测试绿替代 AC、用户流程或架构判断。
- 不新增证据系统、恢复系统、successor/predecessor、reopen 或 replacement task。
- Do not create another task or any historical-evidence progression mechanism。

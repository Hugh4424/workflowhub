---
name: verify-code
description: 以资深架构师视角检查需求、设计、实现和测试，并用一次修复、一次异源复核、一次收尾修复完成验证。
version: 4.0.0
---

# Verify Code：架构师验收

## 目标与进入条件

verify-code 只回答一个问题：当前实现是否完整、合理、能交付。

当前 task 的以下四份材料存在且可读，就直接开始或继续验收：

- `decision-log.md`
- `spec.md`
- `plan.md`
- `tasks.md`

旧 review、provider 状态、执行记录和审计历史只作背景，不是工作许可证。它们缺失、失败、
过期或 `unavailable`，都不能冻结代码修改、材料修正、测试或同 task 修复，也不能触发新建
successor、recovery、rebind 或 continuation task。

Talk、Clarify、必要调研、Grill 和 `decision-log.md` 只属于 make-decision。verify-code 读取其
结论，不要求用户重讲过程，也不要求过程索引。发现原始方向真的变化时，保持同一 task，
交给 make-decision 更新决定；发现实现或现有材料问题时，在同一 task 修复。

## 验收范围

检查四份材料、真实代码和当前改动，重点回答：

- 原始需求是否完整落到当前决定、设计、计划和任务；
- 用户流程是否覆盖入口、成功、失败和恢复；
- 状态、数据、接口、复用、安全和失败处理是否合理；
- 代码是否真的实现设计；
- 每个适用 AC 是否有当前结果；
- 风险相关测试和独立 review 是否足以支持结论。

每次结论前必须做一次语义反向检查：原始需求 → 决策 → `spec.md` → 完整用户流程
（入口、成功、失败和恢复）→ `plan.md`/`tasks.md` → AC → 测试/证据。缺证据只能记为
`unknown/incomplete`，不能算 `pass`。如果 decision-log 明确引用了研究，必须检查对应的当前
研究事实；没有真实研究问题时，保留 `skipped`，不能凭空补研究。

## Portable dependency

直接使用 `skill-deps.yaml` 声明的 portable dependency：打开 `wh-review` 的已声明
`SKILL.md`，在当前 agent 上下文中执行。不要经过 dispatcher、invocation protocol 或辅助
推进 gate。`wh-review` 负责异源独立复核；主 agent 负责验收判断和 finding 处置。

## 固定流程：最多四个动作

1. **架构师检查一次**

   读取四材料、当前 diff、真实实现和已有当前测试事实。输出短报告：问题、代码/材料锚点、
   影响、建议、是否属于当前范围。给 every applicable acceptance criterion 一个简短结论：
   `pass`、`fail`、`unknown`、`deferred` 或 `not_applicable`；证据缺失不能算 `pass`。
   完成标准：原始需求反向检查、完整用户流程、风险边界和逐 AC 结果全部有明确结论。

2. **主 agent 修改一次**

   逐条判断第一步 findings。修复合理且影响交付的问题；无效 finding 记录证据；延期项写清
   风险和 owner。不为格式或审计偏好扩散范围。修改留在同一 task。生产代码变更后只跑
   受影响测试。完成标准：每个 finding 都有 `fixed`、`rejected_invalid`、`accepted_risk` 或
   `needs_human`。

3. **异源 findings 审查一次**

   直接使用 `wh-review` 检查当前验收标准、架构师短报告、真实测试摘要、代码上下文和未决
   风险。provider 只输出 `findings`；保留原始 provider、model、session、transport status、
   findings、error 和 provenance。timeout、invalid output、failure、`unavailable` 都按
   原样记录；`unavailable` 不改写为空 findings，也不因 finding 结果反复循环。完成标准：
   一份真实异源 review 事实已经记录；真实 unavailable 也必须记录，但会使
   当前质量/阶段完成结论保持 incomplete，不阻止同 task 修复。

4. **主 agent 收尾修改一次**

   逐条判断异源 findings，修复有效且影响交付的问题，记录无效、风险接受或延期项。修复后
   跑受影响测试，再执行一次 `tasks.md` 声明的最终测试/检查；不再开启新的 review 轮。
   完成标准：每个 finding 有处置，最终测试有真实结果，每个适用 AC 有最终状态。

## 测试和证据

- 最终测试命令只读 `tasks.md` 的 final route，不硬编码工具。真实执行命令、结果和覆盖限制。
- 最终声明 `passed` 前，风险相关测试和 current complete test suite 必须为 green，且 every
  applicable AC 为 `pass` 或有真实 `not_applicable` 理由。
- 测试失败记 `failed`；超时、缺命令、环境不可用记 `unknown/incomplete`，不能重跑到变绿。
- 每个适用 AC 保留场景、预期、实际、证据和覆盖限制。已有当前有效证据可以复用；不复制
  全量日志或历史台账。
- UI 任务执行真实浏览器验收；非 UI 任务记录 `not_applicable` 和理由。
- 独立 review 的 findings、传输状态和 provenance 是必须记录的质量事实；真实
  `unavailable` 可作为事实，但不能支持 `passed`。
  `unavailable` 绝不是 `pass`，也不阻止同 task 修复。

## 结论与 fail-loud 写入

- `passed`：实现符合四材料，完整用户流程闭合，适用 AC 有当前结果，风险相关测试和最终
  测试通过，独立 review 已做，且没有未处置的严重 finding。
- `failed`：代码、测试或 AC 明确失败；回同一 task 修复，不新建任务。
- `incomplete`：测试、review、AC 或其他必要质量事实缺失、不可用或超时；如实显示缺口。

缺质量事实只限制完成声明，不限制继续验收和修复。运行事实写入遇到错 task、workspace、
runtime、hash、schema 或写集合时，对该次写入 fail-loud，保留原始错误，不伪造成功；代码、
四材料、测试和 finding 修复仍在同一 task 继续。

## 阶段末交接

用大白话说明：检查了什么、修了什么、逐 AC 和测试结果、异源 review 的 findings/传输事实、finding
如何处置、最后还剩什么风险。只让用户确认这份验收结论；该确认不授权 commit、push、
merge、archive 或 cleanup，这些操作仍需单独明确授权。

不要求用户重复 Talk/Grill，不要求下游读取验收过程索引，不用一次全量测试绿替代 AC、
用户流程或架构判断，也不因 reviewer 没有新的 finding 而无限重审。

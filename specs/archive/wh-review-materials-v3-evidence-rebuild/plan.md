# wh-review 最小充分材料与集成审查实施计划

## 摘要

本任务把已确认的审查材料架构落到 WorkflowHub：每个阶段只交付当前判断需要的冻结事实；build-code 保持每 Phase 完整 diff、严格审到 pass；最终审查改成基于连续 Phase PASS 链和跨 Phase seam 的 integration review。审查质量事实继续由一个 3rd-review provider group 产生，WorkflowHub 不新增派发路径，也不读取 broker 私有状态。

## 研究结论

`spec-research-result.v1`：`skipped`。规格锁定了边界、已有实现面和可复用入口；不需要外部资料。此前已完成的本地实现面核查可直接回答本次接口与测试问题。

## 技术上下文与约束

- 技术栈为 Node ESM、TaskHandle canonical records、JSON schema、Vitest；所有 task/workspace 身份仍由 `StageContext` 认证。
- 复用现有 `wh-review-cli → review-runner → 3rd-review` 单一 group 调用；不改 3rd-review、`~/.config/workflowhub/config.json`、provider 路由或同源排除。
- 不引入 packet byte/token/时长/输出数量上限；`packet-plan.json` 仍只记录已交付/排除材料和实际 bytes。
- `build-spec`、`build-plan`、`verify-code` 的 finding 是非 gate 质量事实；`build-code` Phase review 继续是完整当前 Phase diff 的严格 pass 循环。
- 只在材料 identity、锚点、快照或协议不成立时 fail loud；这类事实不变成新的通用质量 gate。
- 3rd-review 负责 provider 会话活性、重试和恢复。WorkflowHub 移除本地固定等待终止，不读取 broker private workspace、`state.json` 或 session 文件。

## 目标接口与数据合同

1. `stage-materials` 为唯一 stage allowlist。build-plan 将 `draft_tasks` 与 spec/AC/plan 同时冻结；build-code 区分 `phase` 和 `integration` 材料 profile，verify-code 使用结构化 AC 摘要。
2. map 保持 map-level `complete|unknown`。`complete` entry 必须有唯一的 snapshot anchor；无内容 entry 只能明确 `not_applicable|unknown`、受限 reason code 与简短说明。删除 `not_needed_reason` 绕过。
3. `ac-evidence-summary.v1` 定义为 schema 约束的逐 AC 摘要：result、acceptance leaf/nested/test receipt refs+hashes、scenario、oracle、actual outcome、evidence type、coverage limits、exceptions；无可信来源写 `unknown`。
4. `review_scope` 只能由 runner 从 Phase 身份派生为 `phase|integration`，写入 attempt/result、lock/reuse/chain 和 final handler identity。旧无 scope 记录仅为 legacy 审计，不能进入 verify-code。
5. 每个已审 Phase 在 sealed packet 后保留 hash-bound 最小 phase-map trace。final integration 从 accepted build-plan checkpoint 到 final tree 建连续 Phase PASS coverage，再从 coverage+trace 派生唯一的 `cross-phase-seam-index.v1`。它覆盖跨文件 Producer/Consumer、schema、state/resource、error/cancel 与测试关系，不要求同一文件被多个 Phase 修改。
6. attempt/report 仅保存公共 provider 结果字段；session 文件位置恒为 `SESSION_PATH_UNAVAILABLE`。含私有绝对路径的公共结果记录为 `PUBLIC_RESULT_INVALID`/unavailable。

## 实施顺序

### Phase 0：先固定审查身份与无超时锁语义

- 在 `wh-review-cli`、`review-runner`、attempt/result schemas、reuse/lock/review-chain/verify-final 中引入内部派生的 `review_scope=phase|integration`；调用方不能传入或覆盖。
- 先将旧无 scope result 显式标为 legacy，避免后续 packet builder、stage handler 和 verify lineage 各自猜测 final 语义。
- 同时移除 `review-runner` 的 `REVIEW_LOCK_WAIT_MS` 和 `core/task-handle.mjs` 的默认 `RECORD_LOCK_WAIT_MS=10s` 终止行为；相同 identity 等待/复用 canonical outcome，只有可证伪的锁失主/不一致才 fail loud。

### Phase 1：材料矩阵、map 与摘要 schema

- 扩展 `skills/wh-review/stage-materials.json` 和 schema：build-plan `draft_tasks`；build-code 的 Phase/integration profile；verify-code 摘要入口。
- 更新 `review-materials.mjs`：严格 anchor/disposition 校验、删除 `not_needed_reason` 绕过、按 scope 选择材料、保持 packet-plan 仅遥测。
- 新增/更新 `ac-evidence-summary.v1` schema 与 build-plan/verify 材料合同；禁止 raw log 和未选择文件进入 provider bundle。

### Phase 2：无上限完整 diff 与 Phase/集成证据

- 将 `review-source.mjs` 的 git diff 捕获改为流式/临时文件路径，完整 bytes/hash 可验证且没有固定 `maxBuffer` 拒绝分支。
- 在 `workflows/build-code/phase-evidence.mjs` 发布 append-only phase-map trace，并保留当前 Phase evidence/retry/reopen 生命周期。
- 新增 integration subject/material builder：验证从 accepted plan checkpoint 到 final tree 的唯一连续 PASS coverage、phase-map trace、AC→change→evidence 和 fresh test summary；缺任一 identity 时发布 unavailable attempt，不回退累计或全项目 diff。

### Phase 3：runner 集成与公开结果

- 将无 `phase_id` 的 final source 改成 integration subject，不再把全 worktree diff 放入 final bundle；Phase source 仍是完整 `base_tree..candidate_tree` diff。
- 删除 `brokerRuntimeRoot/<runtime>/state.json` 探测和 `session_artifact_path` 存储；公共路径污染 fail closed 为 `PUBLIC_RESULT_INVALID`。

### Phase 4：官方 stage、合同与迁移语义

- 更新 `core/stage-handlers.mjs`、TaskHandle/record validators：build-code final 与 verify-code 仅接受同 snapshot 的 `worktree + integration` result；Phase result 不能替代 final。
- 旧 legacy final result 仅供审计：同 snapshot 的 canonical coverage/trace/test identity 完整时重跑 integration；否则 `MATERIAL_INCOMPLETE` 并回到 build-code，绝不添加放行窗口。
- 同步 `wh-review`、build-spec/build-plan/build-code/verify-code contracts 与 workflow 文案；更新 `CONTEXT.md` 和 ADR 0007，准确说明 Phase vs integration、非 gate 审查与 provider 公共追溯。

### Phase 5：可证伪测试与实际验证

- 覆盖材料 allowlist、anchors、unknown/N/A、draft_tasks、逐 AC 摘要、无 raw log、无 caps、完整 Phase diff bytes/hash、Phase PASS chain、seam 导出和 legacy 迁移。
- 覆盖 review_scope 篡改/reuse/chain/final handler、健康长审查不会被 WorkflowHub 取消、私有路径拒绝/报告 `SESSION_PATH_UNAVAILABLE`、同源结果和现有路由不变。
- 运行目标 Vitest 集和相关 contract tests；以真实 broker 公共结果完成 build-code/verify-code 所需的后续验收，不通过伪造 provider 成功。

## 任务摘要（供本次自举计划审查）

`T00` review identity 与连续性；`T01` 材料矩阵与 map 合同；`T02` AC 摘要与 Phase trace；`T03` source 流式 diff 和 integration subject；`T04` runner public trace；`T05` stage handler 与 legacy 迁移；`T06` workflow/contract/文档同步；`T07` 测试与端到端验证。完整依赖、验证和并行说明见 `tasks.md`。

## 测试策略

- 单元/contract：`review-source-materials.test.mjs`、`review-runner.test.mjs`、`review-controller.test.mjs`、`schema-validator.test.mjs`、`wh-review-cli.test.mjs`、`simple-contracts.test.mjs`、`workflow-v2-contract.test.mjs`、`official-component-receipts.test.mjs`、`core/__tests__/task-handle.test.mjs`。
- Phase/整合证据：`workflows/build-code` 的 phase-evidence tests 与 `final-cutover-guards.red`，覆盖缺链、分叉、树不连续、legacy、跨文件 seam 与 final bundle 禁止 diff。
- 报告/协议：provider public result 的 fields、缺 usage、SAME_SOURCE、私有绝对路径与 `SESSION_PATH_UNAVAILABLE`。
- 回归：完整 `npm test`/项目现有测试命令；在最后 verify-code 运行真实当前树测试和正式 review lineage。

## 回滚与风险

- 本次不改 broker 或配置，回滚只需回退 WorkflowHub 提交；已存在 canonical attempts/results 不改写。
- legacy record 不自动迁移也不伪造 integration 身份；它们会在新语义下明确不可用于 verify-code，风险对人可见。
- 最大风险是历史 Phase evidence 不足；按规格发布 `MATERIAL_INCOMPLETE`，不以全项目材料或累计 diff 兜底。

## 需求映射

| 规格 | 实施 | 验证 |
| --- | --- | --- |
| FR-MAT-01 / MAP-02 | T01 | 材料、anchor、allowlist 测试 |
| FR-VERIFY-03 | T01 / T02 | AC summary schema 测试 |
| FR-PHASE-04 | T02 / T03 | 完整 diff 与 Phase pass 测试 |
| FR-INTEGRATION-05 | T02 / T03 / T05 | coverage、seam、legacy 测试 |
| FR-TRACE-06 | T04 | 公共报告/私有路径测试 |
| FR-WORKFLOW-07 | T05 / T06 | handler 与合同回归 |
| FR-CONTINUITY-08 | T04 | 长审查连续性测试 |

## 宪法检查

- F1/F2：保持 3rd-review 为可替换执行方；只扩展窄 public result、材料和 canonical record 合同。
- F3/F4/Q1/Q2：材料/coverage/transport 是可见事实，非 code 阶段不以 finding 阻断；Phase pass 规则仅保持既有实现边界。
- F5/F8/F10：不加通用 gate、第二派发或预算系统；复用现有 runner、TaskHandle、schema 与 3rd-review。
- F6/F9/Q3：canonical records 与异源 group 保留证据、公开追溯和可证伪失败，不自审自判。
- F7：本阶段只提交计划供人工确认；实施与 close 仍在后续独立边界。
- S1/S2/S4/S5/S7/S8：复用既有 skills/metrics/TaskHandle；不新增绑定宿主的工作流或状态服务。

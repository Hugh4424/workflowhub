# wh-review 最小充分材料与集成审查任务清单

## 已交付前置：受控 3rd-review public-result 隔离

- 范围：独立的 3rd-review `main` 交付；WorkflowHub 只消费其公开 `workflowhub-result.v2`，不复制 broker 派发逻辑。
- 已完成：模型可见附件只使用逻辑路径；单 provider 的私径污染为 `failed/PUBLIC_RESULT_INVALID/output:null`，不再中断同组 reviewer；受控入口替换原脏 worktree。
- 验证：3rd-review 全量测试、单 provider 污染/正常/SAME_SOURCE group 回归和公开 JSON/CLI 边界已通过；后续 T07 仍需用真实 provider group 验证 WorkflowHub 消费链。

## T00.5：发布 3rd-review managed session lifecycle（外部前置）

- 依赖：已交付 public-result 隔离。
- 范围：受控 3rd-review `main` 的 public `start/status/cancel` API、session manager、operation state 与其回归；不改 WorkflowHub provider 路由、CLI profile、同源排除或模型配置。
- 行动：`start` 持久绑定 deterministic request ID 后启动 broker-owned session；`status` 只返回公开状态/终态 V2 group；外层 SIGTERM 不得取消健康 provider；explicit cancel 是唯一终止路径；continuation 有独立 operation ID。
- 验证：caller exit 后第二个 status/wait 可取得同一终态、重复 start 不重复派发、cancel-only、manager-lost 不自动杀健康 provider、public bytes 无私径/raw/session path。
- 并行：必须先于 T00/T04 的 WorkflowHub dispatch client 落地。

## T00：固定 review_scope 身份与健康 review 连续性锁基础

- 依赖：T00.5
- 范围：`wh-review-cli.mjs`、`review-runner.mjs`、dispatch schema、attempt/result schemas、review scoped 的 `core/task-handle.mjs` 调用点、identity/lock tests。
- 行动：仅由 runner 从 `phase_id` 派生 `phase|integration` scope，写入 subject、reuse、lock、review-chain 和 final identity；旧无 scope 显式 legacy。持久化 deterministic dispatch intent，以 start/status 重连同一 runtime；只移除健康同 identity review 的固定 wall-clock 等待终止，provider 等待在锁外。非 review `TaskHandle` 锁的默认超时与错误语义保持不变；保留可证伪的 review 锁失主/不一致错误。
- 覆盖：FR-INTEGRATION-05、FR-CONTINUITY-08；AC-01、AC-09。
- 验证：caller scope 覆盖失败；相同 identity 等待/复用及进程重启重连；超过旧 review 等待窗口的受控健康 review 不被 WorkflowHub 取消；非 review `TaskHandle` 锁语义不变；review 锁失主仍明确失败。
- 并行：是后续 T01-T05 的身份前置，必须先完成。

## T01：扩展材料矩阵、严格 map 和 AC 摘要生成器

- 依赖：T00
- 范围：`skills/wh-review/stage-materials.json`、对应 schema、`review-materials.mjs`、build-spec/build-plan/verify contracts、AC summary generator/schema。
- 行动：加入 `draft_tasks`；为 build-code 区分 Phase/integration 规则；强制 complete anchor，显式 N/A/unknown disposition+reason，删除 `not_needed_reason` 绕过；实现 `ac-evidence-summary.v1` 生成器，只读取认证 acceptance leaf/nested/test receipt refs 并逐 AC 一对一输出，无法认证的证据必须显式为 `unknown`。
- 覆盖：FR-MAT-01、FR-MAP-02、FR-VERIFY-03；AC-03、AC-04、AC-05。
- 验证：缺/额外材料、缺/重复/越界 anchor、未知字段、逐 AC 的认证 leaf/nested/test receipt refs+hashes；缺 AC、重复 AC、非认证 ref、leaf hash、nested hash、test receipt hash 或 snapshot mismatch 与 raw log 必须 red，可信未覆盖证据必须显式 `unknown`。
- 并行：可与 T02 的 phase trace 设计并行；必须先于 T03/T04 完成。

## T02：发布可重建的 Phase evidence 与 phase-map trace

- 依赖：T01
- 范围：`workflows/build-code/phase-evidence.mjs`、Phase review evidence readers/tests。
- 行动：在 sealed Phase packet 后写入 append-only、hash-bound 最小 phase-map trace；保留已有 diff scan、重试、continuation、reopen 和 Phase PASS 生命周期。
- 覆盖：FR-PHASE-04、FR-INTEGRATION-05；AC-02、AC-06。
- 验证：trace 与 phase result/snapshot 绑定；重开不覆盖历史；缺 trace 的 final integration 形成 unavailable attempt。
- 并行：可与 T03 的流式 source 捕获前半段并行；T03 integration builder 依赖其输出。

## T03：完整 diff 流式捕获与 integration subject/material builder

- 依赖：T00、T01、T02
- 范围：`review-source.mjs`、新 integration subject helper、`review-materials.mjs`、source/material tests。
- 行动：移除固定 `maxBuffer` diff 捕获，使用可验证完整临时/流式产物；Phase 仍交付完整 frozen diff。构建 accepted plan checkpoint→final 的连续 Phase PASS coverage、cross-phase seam index、每 AC 的 `AC→change`、`AC→test`、`AC→evidence` 三项映射和 fresh test summary；按上述事实选择最终快照片段与 frozen reviewer lenses，并随包生成 `review-instructions`、manifest、packet-plan；任一映射缺失、有实现改动但没有正式 Phase，或零 Phase 空链，必须是 `MATERIAL_INCOMPLETE`；integration bundle 不含任何历史/cumulative diff。
- 覆盖：FR-PHASE-04、FR-INTEGRATION-05；AC-02、AC-06、AC-07。
- 验证：bytes/hash 与 Git authority 一致；packet 构建路径不存在 bytes/token/duration/output-count 的拒绝、截断或拆包分支；不再产生或发布任何 `integration_map`，只发布单一 seam index；缺段、分叉、重复、tree 错配、跨文件 Producer/Consumer seam、任一 AC `change/test/evidence` 映射缺失、缺 identity、实现改动但无正式 Phase、零 Phase空链和 forbidden diff 都可证伪；三项映射缺失、后两类均为 `MATERIAL_INCOMPLETE`。
- 并行：T03 的 Phase capture 可先行；integration 部分等 T02 完成。

## T04：完成 runner 集成与安全公共追溯

- 依赖：T00、T01、T03
- 范围：`wh-review-cli.mjs`、`review-runner.mjs`、attempt/result schemas、`review-result.mjs`、相关 tests。
- 行动：将无 `phase_id` source 接入 integration subject/material profile，Phase source 保持完整 diff；以 start/status 消费公共 broker result，移除 state.json/session path 探测和投影；managed API 不可用时明确协议失败，绝不回退 blocking `run`、第二次派发或改变路由；实现 build-spec/build-plan/verify-code 的 review 分支：普通修复零 closure dispatch，只有 `structural_rework` 才可进行一次同 route 的完整高强度复审；校验/报告公共 fields 与 `PUBLIC_RESULT_INVALID`。
- 覆盖：FR-INTEGRATION-05、FR-TRACE-06、FR-CONTINUITY-08；AC-01、AC-07、AC-09。
- 验证：caller 不能覆盖 scope；同 identity 等待/复用；健康超旧等待窗口的 review 完成；managed API 不可用必须协议失败且不触发 blocking `run`、第二次 dispatch 或 route change；普通修复零 closure dispatch，`structural_rework` 恰好一次同 route 完整高强度复审且无第三次；私有绝对路径拒绝；报告只显示公共字段和 `SESSION_PATH_UNAVAILABLE`。
- 并行：可与 T05 的 handler 设计并行；T05 落地依赖 scope schema。

## T05：更新 final stage handler 与 legacy 迁移处置

- 依赖：T02、T03、T04
- 范围：`core/stage-handlers.mjs`、TaskHandle validators、final verify helpers/tests。
- 行动：build-code final 与 verify-code 只接受同 snapshot `worktree+integration` result；Phase/legacy 结果不得替代。legacy 同 snapshot coverage/trace/test identity 及每 AC `change/test/evidence` 映射完整时要求重跑 integration，否则 `MATERIAL_INCOMPLETE` 并回 build-code；不设迁移放行窗口。
- 覆盖：FR-INTEGRATION-05、FR-WORKFLOW-07；AC-01、AC-06、AC-08。
- 验证：phase result、篡改 scope、legacy record、workspace mismatch、缺 coverage、任一 AC `change/test/evidence` 映射缺失、实现改动但无正式 Phase、零 Phase 空链都无法误放行；后三类必须为 `MATERIAL_INCOMPLETE`，正式 integration 正常通过。
- 并行：无，依赖前述 canonical contracts。

## T06：同步 stage 合同、workflow 技能与设计文档

- 依赖：T01、T04、T05
- 范围：`skills/wh-review` contracts/SKILL、build-spec/build-plan/build-code/verify-code workflows、`CONTEXT.md`、ADR 0007。
- 行动：统一材料选择、普通修复无二审、Phase pass、integration、AC summary、legacy、公共报告和连续性术语；明确 build-spec/build-plan/verify-code 的普通修复不创建 closure attempt、不调用 closure provider，整个 stage attempt 只保留首次冻结材料对应的既定一个 3rd-review group，禁止第二次 dispatch 或 route change。仅 `structural_rework` 可触发一次同 route 完整高强度复审，最多一次且不形成 pass loop；删改与实现不符的 private-state 文案。
- 覆盖：FR-WORKFLOW-07、FR-TRACE-06、FR-CONTINUITY-08；AC-07、AC-08、AC-09。
- 验证：contract tests 和文档链接/术语检查；普通修复的 build-spec/build-plan/verify-code 分别可失败地证明无 closure attempt/provider、唯一既定 3rd-review group、无第二次 dispatch 和 route change；`structural_rework` 分别证明恰好一次同 route 高强度完整复审、无第三次 dispatch；不新增 provider routing 或 broker contract 之外的路径。
- 并行：可在 T05 后与 T07 部分并行。

## T07：运行回归、故障注入与真实审查验证

- 依赖：T01-T06
- 范围：现有 wh-review tests、新增最小 red/green fixtures、最终 stage 验证。
- 行动：只执行与改动直接相关的 targeted suite，不运行完整测试；故障注入覆盖材料、identity、privacy、coverage、continuity、packet builder 无 bytes/token/duration/output-count 拒绝分支、无 `integration_map` 产物、AC `change/test/evidence` 三项映射缺失即 `MATERIAL_INCOMPLETE`、build-spec/build-plan/verify-code 普通修复无 closure attempt/provider、唯一既定 3rd-review group、无第二次 dispatch/route change，以及 `structural_rework` 恰好一次同 route 高强度完整复审；以一个实际 provider group 调用验证公共结果处理，不伪造审查成功。
- 覆盖：全部 FR/AC。
- 验证：所有目标测试通过；失败 fixture 真失败（包括任一 AC `change/test/evidence` 映射缺失却未报 `MATERIAL_INCOMPLETE`、普通修复错误创建 closure attempt/provider、重复 dispatch 或路由变化、`structural_rework` 未复审或复审超过一次）；实际审查结果及报告仅含公共信息。
- 并行：无；是进入 verify-code 的前置。

## 依赖图

`T00.5 → T00 → T01 → T02 → T03 → T04 → T05 → T06 → T07`

允许的局部并行：T01 完成后 T02 与 T03 的 Phase-capture 子项可并行；T04 与 T05 的设计可并行，但 T05 提交依赖 T04；T06 可与 T07 的测试编写并行，最终验证必须最后执行。

# wh-review 最小充分材料与集成审查任务清单

## T00：固定 review_scope 身份与无超时记录锁基础

- 依赖：无
- 范围：`wh-review-cli.mjs`、`review-runner.mjs`、attempt/result schemas、`core/task-handle.mjs`、identity/lock tests。
- 行动：仅由 runner 从 `phase_id` 派生 `phase|integration` scope，写入 subject、reuse、lock、review-chain 和 final identity；旧无 scope 显式 legacy。移除 runner 和 TaskHandle 对健康同 identity review 的固定 wall-clock 等待终止，保留可证伪的锁失主/不一致错误。
- 覆盖：FR-INTEGRATION-05、FR-CONTINUITY-08；AC-01、AC-09。
- 验证：caller scope 覆盖失败；相同 identity 等待/复用；超过旧 5 分钟和 10 秒窗口的受控健康 review 不被 WorkflowHub 取消；锁失主仍明确失败。
- 并行：是后续 T01-T05 的身份前置，必须先完成。

## T01：扩展材料矩阵、严格 map 和 AC 摘要合同

- 依赖：T00
- 范围：`skills/wh-review/stage-materials.json`、对应 schema、`review-materials.mjs`、verify/build-plan contracts、AC summary schema。
- 行动：加入 `draft_tasks`；为 build-code 区分 Phase/integration 规则；强制 complete anchor，显式 N/A/unknown disposition+reason，删除 `not_needed_reason` 绕过；定义并校验 `ac-evidence-summary.v1`。
- 覆盖：FR-MAT-01、FR-MAP-02、FR-VERIFY-03；AC-03、AC-04、AC-05。
- 验证：缺/额外材料、缺/重复/越界 anchor、未知字段、逐 AC leaf/nested/test receipt refs+hashes、raw log 禁止的 red/green tests。
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
- 行动：移除固定 `maxBuffer` diff 捕获，使用可验证完整临时/流式产物；Phase 仍交付完整 frozen diff。构建 accepted plan checkpoint→final 的连续 Phase PASS coverage、cross-phase seam index、AC→evidence 和 fresh test summary；integration bundle 不含任何历史/cumulative diff。
- 覆盖：FR-PHASE-04、FR-INTEGRATION-05；AC-02、AC-06、AC-07。
- 验证：bytes/hash 与 Git authority 一致；缺段、分叉、重复、tree 错配、跨文件 Producer/Consumer seam、缺 identity 和 forbidden diff 都可证伪。
- 并行：T03 的 Phase capture 可先行；integration 部分等 T02 完成。

## T04：完成 runner 集成与安全公共追溯

- 依赖：T00、T01、T03
- 范围：`wh-review-cli.mjs`、`review-runner.mjs`、attempt/result schemas、`review-result.mjs`、相关 tests。
- 行动：将无 `phase_id` source 接入 integration subject/material profile，Phase source 保持完整 diff；移除 state.json/session path 探测和投影，校验/报告公共 fields 与 `PUBLIC_RESULT_INVALID`。
- 覆盖：FR-INTEGRATION-05、FR-TRACE-06、FR-CONTINUITY-08；AC-01、AC-07、AC-09。
- 验证：caller 不能覆盖 scope；同 identity 等待/复用；健康超旧等待窗口的 review 完成；私有绝对路径拒绝；报告只显示公共字段和 `SESSION_PATH_UNAVAILABLE`。
- 并行：可与 T05 的 handler 设计并行；T05 落地依赖 scope schema。

## T05：更新 final stage handler 与 legacy 迁移处置

- 依赖：T02、T03、T04
- 范围：`core/stage-handlers.mjs`、TaskHandle validators、final verify helpers/tests。
- 行动：build-code final 与 verify-code 只接受同 snapshot `worktree+integration` result；Phase/legacy 结果不得替代。legacy 同 snapshot evidence 完整时要求重跑 integration，否则 `MATERIAL_INCOMPLETE` 并回 build-code；不设迁移放行窗口。
- 覆盖：FR-INTEGRATION-05、FR-WORKFLOW-07；AC-01、AC-06、AC-08。
- 验证：phase result、篡改 scope、legacy record、workspace mismatch、缺 coverage 都无法误放行；正式 integration 正常通过。
- 并行：无，依赖前述 canonical contracts。

## T06：同步 stage 合同、workflow 技能与设计文档

- 依赖：T01、T04、T05
- 范围：`skills/wh-review` contracts/SKILL、build-spec/build-plan/build-code/verify-code workflows、`CONTEXT.md`、ADR 0007。
- 行动：统一材料选择、普通修复无二审、Phase pass、integration、AC summary、legacy、公共报告和连续性术语；删改与实现不符的 private-state 文案。
- 覆盖：FR-WORKFLOW-07、FR-TRACE-06、FR-CONTINUITY-08；AC-07、AC-08、AC-09。
- 验证：contract tests 和文档链接/术语检查；不新增 provider routing 或 broker contract 之外的路径。
- 并行：可在 T05 后与 T07 部分并行。

## T07：运行回归、故障注入与真实审查验证

- 依赖：T01-T06
- 范围：现有 wh-review tests、新增最小 red/green fixtures、最终 stage 验证。
- 行动：执行 targeted suite 后执行完整测试；故障注入覆盖材料、identity、privacy、coverage、continuity；以一个实际 provider group 调用验证公共结果处理，不伪造审查成功。
- 覆盖：全部 FR/AC。
- 验证：目标测试与全量测试通过；失败 fixture 真失败；实际审查结果及报告仅含公共信息。
- 并行：无；是进入 verify-code 的前置。

## 依赖图

`T00 → T01 → T02 → T03 → T04 → T05 → T06 → T07`

允许的局部并行：T01 完成后 T02 与 T03 的 Phase-capture 子项可并行；T04 与 T05 的设计可并行，但 T05 提交依赖 T04；T06 可与 T07 的测试编写并行，最终验证必须最后执行。

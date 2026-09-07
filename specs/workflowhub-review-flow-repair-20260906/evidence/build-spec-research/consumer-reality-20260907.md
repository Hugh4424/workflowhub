# build-spec 研究证据：合并后审查消费者实况核实（2026-09-07）

- **任务**：workflowhub-review-flow-repair-20260906 / stage=build-spec / step=conditional-spec-research
- **方法**：独立只读子代理在已合并 main（692c27ea，含 close-readiness 实现 82ba3d86）的分支工作树逐文件核实，全部结论带文件:行号。
- **核实范围**：decision-log"合并 main 后的基线更新"节要求的消费者重读：stage-content-evidence、stage-review-disposition、material-workspace、stage-handlers、wh-review scripts 与聚焦测试。

## 核实结论（均有代码行号佐证，详见下表）

1. **close-readiness 确已落地 main**：预算/冻结校验（validateReviewBudget、validateDecisionFreeze、classifyFinding、validateFindingRouting）、四材料 stage-input packet（buildStageInputPacket/verifyStageInputPacket）、finding disposition（validateReportableFindingDispositions 等，消费点含 task-close/mini-task-runner/stage-runner）均在当前基线。
2. **usage 读取形状不匹配属实且更严重**（PFACT-006/RISK-001 升级依据）：
   - 写点把 provider usage 落在 `provider_attempts[].execution.usage`（review-record-route.mjs L110；attempt.schema.json L187-208；v3 broker 归一 review-provider-client.mjs L229-237）。
   - 读点 validateReviewAttemptObservation（stage-content-evidence.mjs L400-417）读**顶层** `provider.usage`，且状态词汇表（L255 `{completed,executed,failed,unavailable}`）与写点（review-record-route.mjs L94 `{completed,failed,cancelled}`）错位：cancelled 必误报 provider_status_invalid，executed/unavailable 永不出现。
   - 更致命：stage-handlers.mjs L2257-2259 给观察函数传入的是 **result 记录**（result.schema.json L49-58 的 provider_results 只有 {provider,output}，无 status/usage）→ 该观察在现行链路上恒为 incomplete。
3. **预算是消费后检查**：validateReviewBudget 唯一生产调用点在 stage-handlers.mjs L2265-2272（阶段事实收集时，派发与落盘之后），结果只追加 missing_items（L2288），不阻断；派发链路零预算调用。附带失真：canonicalReviewBudgetAttempts（L1954-1977）kind 只映射 phase/initial（focused/narrow_diff 永不产生）、terminal_status "failed" 分支（L1961-1963）永不命中（schema enum 只有 semantic/unavailable）。
4. **attempt.schema.json 现状**（L328 行）：required 无顶层 priority；terminal_status 仅 ["semantic","unavailable"]（L300）且 semantic⇒error 必须 null；priority 仅在 review_policy.requested_profile_specs.items 内 required（L108/114），requested_profile_specs 本身非必填；无 dispatch_state/blocked/reused 字段且 additionalProperties:false（L327）→ spec 的宽读严写确需 schema 扩展（D-004 已授权）；reuse 仅存在于 result.schema.json L40-48。
5. **E2E 单 profile 矛盾共三处**：wh-review-cli.mjs L563-565（initial.length!==1 抛错）+ L416/L424（selectTaskBoundReviewer 两处 length!==1）。均与 FR-E2E-001/AC-E2E-001（用首项、多项不失败）矛盾，实施时需三处同改。
6. **FR-RECORD-002 非绿地**：review-runner.mjs L357-402 已有 material-preflight/route-resolution 两类未派发幂等落盘（recordUndispatchedUnavailable/recordMissingRouteUnavailable，幂等 id=undispatchedUnavailableId L352-356）→ 预检拦截落盘应复用该相邻能力并对齐去重口径，不建第二套落盘路径。
7. **改动面确认**：third-review-host-config.mjs 仍是 priority/profileDeclarations 重度消费点（L114-133、L203-214、L354-373、L390、L409-415、L496-502、L548）；review-result.mjs L298 渲染 priority；review-record-route.mjs L66 硬编码 priority:0；wh-review-cli.mjs doctor L806-810 与 frozenTaskBoundPolicy L445-461 读 profile_priorities；review-runner.mjs 无 wh_review priority 引用。
8. **受影响聚焦测试清单**：freeze-classification-budget-usage-protocol.test.mjs L8/312-371；final-cutover-guards.red.test.mjs L47-52/223/228；helpers/formal-review.mjs L40-47；contract/review-layering.test.mjs L108-126/169-170；integration/mini-task-delivery.test.mjs L617-625/688-689/258；contract/workflow-evolution-final-aggregate.test.mjs L7/11-12；contract/final-coverage.test.mjs L14/50/231-259；__tests__/third-review-host-config.test.mjs L156-456（改动后必 RED）；__tests__/wh-review-cli.test.mjs L95/262/795；__tests__/review-runner.test.mjs L133。

## 对 spec 的影响（已落入 spec.md 修订）

- PFACT-006：由 unknown 升级为 verified（不匹配已被代码核实），工程边界问题保留在 OPEN-001。
- RISK-001：锐化（读点恒读不到真值+预算消费后检查+kind 映射失真）。
- 记录域说明：FR-RECORD-002 注明复用既有未派发记录能力，不建第二套落盘路径。
- 兼容性预留节：补预算观察时点与 kind 映射失真的如实说明。

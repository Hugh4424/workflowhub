# M13 Research: M0 Reference Cards for make-decision 盲审+调研

Source: agenthub-extraction-program/artifacts/M0/objects/

---

## 1. review-dispatch.md (cm-review-dispatch)

**Mechanism**: 三级路由核。`route-review.mjs`(纯函数) + `route-rules.json`(纯数据规则表) 决定审查走 R1/R2/R6 哪条路。R6=最轻(same_source_subagent), R2=中(cross_source_no_subagent), R1=最重(cross_source_with_subagent)。路由依 contentType × scope × risk 三维定级。

**Key findings**:
1. `route-review.mjs` + `route-rules.json` 是同入同出纯函数，零宿主依赖，直接 rebuild_source 用于 M13 盲审路由。
2. `review-dispatch-default.json` 标 **dead_config 嫌疑**——主路径未见显式 loader，M13 设计时先核 loader 再决定是否引入，不能默认它活着。
3. `harness/review-dispatch-adapter.sh` 含 host 状态/checkpoint/gate 耦合，是改造件，不能零适配抄。

**复用**: `route-review.mjs` + `route-rules.json` 零适配抄入。
**丢弃**: adapter.sh 巨石、review.ts(host 状态耦合)、default-config(死件嫌疑，先验后用)。

---

## 2. 3rd-review-skill.md (cm-3rd-review-skill)

**Mechanism**: 薄壳触发器。把"审查包构造 → 独立审查 → JSON 落盘 → reviewer_output 门禁 → stage_advance"全链路收口。两种入口：gated(嵌流程门禁) / standalone(独立调用)。三字段 verdict：reviewSnapshot / riskDisposition / worktreeInventory。

**Key findings**:
1. **独立性硬护栏**：最终 verdict 须独立上下文产出，禁主 agent 自审——这条语义在 workflowhub D8 异源审查中直接沿用，是盲审的核心约束。
2. verdict 分三流(pass/revise_required/escalate_to_human)；revise_required 走修复循环而非 blocking gate，符合 D5 不引阻断门。
3. workflowhub 已有独立 3rd-review skill，本卡的"审查模型语义"(三字段+三流)可直接复用，`references/` 10 个资源文件是 agenthub 耦合件，迁移时按需评估不整包搬。

**盲审接入 make-decision 的 input/output shape**:
- Input: `{direction, research_summary, decision_log_draft}` 打包成审查包
- Output: `{verdict: pass|revise_required|escalate_to_human, reviewSnapshot, riskDisposition}`
- make-decision 按 verdict 分流：pass→落 decision-log，revise_required→修订方向再审，escalate→停等人。

**复用**: 审查模型语义(独立性护栏+三字段+三流分流)。
**丢弃**: gated/standalone 接线中的 agenthub checkpoint/reviewer-runtime-id 机制，references/ 资源整包。

---

## 3. clarify-lite-skill.md (cm-clarify-lite-skill)

**Mechanism**: spec 成形后进 design 前的轻量澄清薄壳。逐条澄清歧义，写回 spec Clarifications 段(Q/A+日期)。影响主流程→直接问用户一个关键问题；不影响→最小假设并说明。

**Key findings**:
1. **调研前置澄清**：clarify-lite 的"先澄清再推进"模式可作为 make-decision 双路调研的前置动作——在调研启动前，用一个关键问题确认方向边界，避免调研跑偏。
2. 单文件 40 行薄壳，外部改造件(重做自 speckit-clarify，去掉全文注入)——迁移成本极低，可以独立引入 make-decision 流程而不带任何 agenthub 依赖。
3. 无对应运行 lesson，runtime_status: live，无 dead 件风险。

**复用**: 澄清流程骨架(问一个关键问题 / 最小假设)直接在 make-decision 的调研启动前内联实现，不需整个 skill 搬入。
**丢弃**: speckit-clarify 原始外部依赖(已在 agenthub 侧去掉，workflowhub 侧不存在此问题)。

---

## M13 盲审接入方案小结

```
make-decision 流程:
  1. clarify-lite 骨架(内联) → 确认方向边界(一个关键问题)
  2. 双路调研(异源两路并行)
  3. 盲审: 调用 workflowhub 已有 3rd-review skill
     - 审查包 = {direction_summary, dual_research_result, decision_log_draft}
     - 路由参考 route-review.mjs 逻辑(M13 可轻量内联 contentType=plan-doc, scope=small→R6)
     - verdict 三流分流(pass/revise/escalate)，revise_required 不 blocking，走修订循环
  4. pass → 落 decision-log + stage-result-make-decision.json
```

**Dead 件警告**: `review-dispatch-default.json` dead_config 嫌疑，M13 设计时不引入，除非验证 loader 存在。

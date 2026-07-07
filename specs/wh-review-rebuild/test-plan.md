# wh-review-rebuild 端到端测试方案（占位版，build-plan 阶段落地）

> **状态说明**：本文件是 build-plan 阶段落的最小占位版，只用于让 Phase 3 checkpoint 的
> `specs/wh-review-rebuild/__tests__/test-plan-smoke.test.mjs` 有真实、可跑通的验证目标（详见
> plan.md Phase 3 Verify 表）。T019-T023（5 stage 迁移）与 T010-T018（wh-review/3rd-review 实现）
> 落地前，本文件描述的调用链尚不能真实执行；T025 落地时须把本文件与配套冒烟测试一并扩写为
> 真正跑通 stage 调用链、断言 `exitCode===0` 的版本，不得保留本占位版本充数。

## 冒烟用例

**用例 1：make-decision stage 全链路（wh-review + 精简后 3rd-review 组合）**

- 前置：`workflows/make-decision/SKILL.md` 已完成 T019 迁移，收尾调用点改为调用
  `skills/wh-review/scripts/invoke-review-engine.mjs`，透传 `stage=make-decision` 与 `task_id`。
- 步骤：
  1. 触发 make-decision stage 收尾流程，进入 wh-review 调度。
  2. wh-review 通过 `route-decision-writer.mjs` 写入 `route-decision-{stage}-{review_flow_id}.json`（`contract_path` 命中
     make-decision 专属合同）。
  3. wh-review 经 `invoke-review-engine.mjs` 调用精简后的 3rd-review 引擎（`{mode, contract,
     materials}` 三元组），取得 `{verdict, findings, actual_mode}`。
  4. `round-state.mjs` 落盘轮次状态，`render-review-report.mjs` 渲染 6 章报告。
  5. 若裁决为 `pass` 且 stage 属于 D2 门 stage，校验 `post_review_action=await_human_confirmation`
     正确写入，且未在人工批准前生成任何等待态文件。
- 断言：全链路 `exitCode===0`，`tasks/{task-id}/reviews/route-decision-{stage}-{review_flow_id}.json`、
  `verdict-make-decision-{review_flow_id}-round-1.raw.json`（本轮修复：文件名加入 `{review_flow_id}` 维度，测试需先从 `tasks/{task-id}/reviews/round-state.json` 读取 `review_flow_id` 字段值再定位该证据文件，权威路径见 spec.md FR-THIRDREVIEW-001"evidence/report 落盘路径规则"）、渲染报告三类产物均落盘且字段齐全。

## 未覆盖 stage

除上述用例主线覆盖的 make-decision 外，其余 4 个迁移 stage——build-spec、build-plan、build-code、
verify-code——不在本冒烟用例的直接执行路径内。这 4 个 stage 由 T025a 补一条独立最小验证：断言其
wh-review 调用点在默认输入下 `exitCode===0` 且正常落盘 `route-decision-{stage}-{review_flow_id}.json`，不因本次接口迁移
（直接调用 3rd-review → 调用 wh-review）而报错或阻塞。

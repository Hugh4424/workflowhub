---
ac_routes:
  AC-1: P1
  AC-2: P2
  AC-3: P1
  AC-4: P1
ui_change: false
risk_level: P1
---

# Test Strategy

本任务无 UI 验收项，浏览器验收按 scope skip。核心验收通过单元/集成测试、receipt 真核验、task_dir 配置解析、task-index 查询、flow_profile decision-log 测试覆盖。

| AC | Route | Evidence |
|---|---|---|
| AC-1 | P1 | tests/receipt-verification.test.mjs, tests/receipt-wiring.test.mjs, scripts/validate-stage-result.mjs |
| AC-2 | P2 | tests/flow-profile-decision-log.test.mjs, workflows/make-decision/SKILL.md |
| AC-3 | P1 | core/__tests__/task-index.test.mjs, core/task-index.mjs |
| AC-4 | P1 | core/__tests__/task-dir-parser-config.test.mjs, core/__tests__/task-dir-parser.test.mjs, core/task-dir-parser.mjs |

# build-code 验收准则追踪（AC Trace）

| AC | 准则 | 实现位置 | 证据 |
| --- | --- | --- | --- |
| AC-01 | dogfood completed.json | `core/task-close.mjs` `completedRecord`, `closeDelivery` | `tests/close/close-contract.test.mjs` |
| AC-02 | close 机制测试覆盖正常/断点/Existing | `tests/close/close-contract.test.mjs`, `cleanup-resume-finalize.test.mjs`, `freshness-consistency.test.mjs` | `quality/tests/build-code-gate.json` |
| AC-03 | 每条 FR  cite 宪法 + 清单同步 | `scripts/constitution-mapping-check.mjs` | `quality/evidence/constitution-mapping-checklist.md` |
| AC-04 | 无新增命令/材料/字段/控制面 | 全部改动走现有 public runtime 行为与 skill 脚本 | `constitution-checklist.md`, `docs/architecture/move-map.json` |
| AC-05 | 左移五件套测试 | `tests/left-shift/left-shift-suite.test.mjs` | `quality/tests/build-code-gate.json` |
| AC-06 | 死代码扫描、双轨评估、DSH 可移植 | `scripts/dead-code-scan.mjs`, `scripts/dual-track-evaluate.mjs`, session event host | `quality/evidence/dead-code-scan/report.json`, `quality/evidence/dual-track-evaluation-report.md` |
| AC-07 | wh-review 简化审查路径、落账、一轮闭环 | `skills/wh-review/scripts/simple-review-runner.mjs`, `runtime/review/review-record-route.mjs` | `tests/review/review-record-route.test.mjs`, `skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs` |

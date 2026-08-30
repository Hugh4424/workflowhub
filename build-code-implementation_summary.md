# build-code 实现摘要

## 任务目标
修复 workflowhub 的 close 机制，使其不再被 verify-code 质量缺口阻塞，回归为 commit/merge/archive/push/cleanup 五个物理交付动作，并支持断点续跑与 existing workspace 模式。同时做左移防护、DSH 可移植化、wh-review 简化审查路径、死代码扫描与双轨评估。

## 已实现内容

### 1. close 核心（AC-01 / AC-02）
- `core/task-close.mjs`：删除 risk close 阻塞分支，正常 close 在 verify-code 缺失时仍可物理完成并记录 qualityReasons。
- 五个动作顺序：commit-delivery → merge-task-branch → archive-spec → push-target-branch → cleanup。
- archive 改在 target 分支上执行；`archiveFacts` 支持在 merge 后代中定位 archive commit；`mergeState` 在 target 历史中查找 no-ff merge。
- existing workspace 模式：`cleanup` 跳过 worktree/branch 删除，记录 skipped。
- 新增 `cleanup` 复合 executor，结合 worktree removal 与 branch removal。

### 2. 测试
- `tests/close/close-contract.test.mjs`（3 tests GREEN）
  - 正常 close 返回 completed.json 且仅含物理事实
  - close plan 严格包含五个有序动作
  - existing workspace 模式保留目录并正常完成
- `tests/close/cleanup-resume-finalize.test.mjs`：断点续跑 + finalize 补记
- `tests/close/freshness-consistency.test.mjs`：close 与 status 共用同一 freshness 判定
- `tests/left-shift/left-shift-suite.test.mjs`：四个 consumer 的 invalid_input/unavailable 拆分
- `tests/review/review-record-route.test.mjs`：review 落账路由
- `skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs` 与 `wh-review-cli.test.mjs`：简评路径
- `tests/dsh-transcript.test.mjs`、`tests/contract/requirement-convergence-regression.test.mjs` 回归通过

### 3. wh-review 优化（AC-07）
- `skills/wh-review/scripts/wh-review-cli.mjs`：入口直接走 `runSimpleReview`，移除 Workspace/TaskHandle/Git 强绑定。
- `skills/wh-review/scripts/simple-review-runner.mjs`：支持 `strictProtocol:false`，宽松 v3 投影；provider 输出由 runner 自身解析。
- `runtime/review/review-record-route.mjs`：简评结果写入 task store，生成 `quality/reviews/results/*.json`。
- `tools/cli/stage-runtime.mjs`：公开 `review --action=record` 行为。

### 4. 左移与 DSH 可移植化（AC-05 / AC-06）
- `runtime/stage/stage-runner.mjs`、`tools/cli/stage-runtime.mjs`：在 malformed/unknown input 时返回 `invalid_input` 而不是静默失败。
- `runtime/stage/stage-agent-outcome-adapter.mjs`、`tools/host/workflowhub-stage-agent-bridge.mjs`：统一 unavailable/invalid_input 拆分。
- `tools/host/workflowhub-codex-session-event.mjs`：session 事件绑定可移植；build-spec/build-plan 阶段官方 run 的 spec-analyze 包已重建。
- `runtime/evidence/acceptance-evidence-validator.mjs`：freshness 复用逻辑。

### 5. 减法与可维护性
- `scripts/dead-code-scan.mjs`：扫描零 consumer 的导出标识符与死文件，输出报告。
- `scripts/dual-track-evaluate.mjs`：对比 facts.jsonl 与 quality/facts/，生成双轨结论报告。
- `tests/integration/manual-delivery-close.test.mjs`：删除旧的 risk close 集成测试。
- `tools/architecture/constitution-mapping-check.mjs` 生成宪法映射清单（AC-03）。

## 仍待 dogfood
- T12 全量 gate GREEN（run all-tests-green）。
- T11 在 workflowhub 自身 task 上跑一遍 close（dogfood）。

## 关键文件清单
- 生产：`core/task-close.mjs`、`runtime/task/workspace.mjs`、`runtime/stage/stage-runner.mjs`、`tools/cli/stage-runtime.mjs`、`runtime/review/review-record-route.mjs`、`tools/cli/task-close.mjs`
- 测试：`tests/close/*.test.mjs`、`tests/left-shift/*.test.mjs`、`tests/review/review-record-route.test.mjs`、`skills/wh-review/scripts/__tests__/*.test.mjs`
- 证据：`quality/evidence/constitution-mapping-checklist.md`、`quality/evidence/dead-code-scan/report.json`

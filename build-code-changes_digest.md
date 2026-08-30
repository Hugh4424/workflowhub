# build-code 变更摘要

## git diff --stat
```
 CONSTITUTION.md                                    |  10 +
 CONTEXT.md                                         |  10 +-
 constitution-checklist.md                          |  14 +
 core/task-close.mjs                                | 383 ++++---------
 docs/architecture/move-map.json                    | 150 ++++-
 runtime/evidence/acceptance-evidence-validator.mjs |  25 +-
 runtime/interface/runtime-facade.mjs               |   1 +
 runtime/stage/stage-runner.mjs                     |  31 +-
 runtime/task/workspace.mjs                         |   6 +-
 .../__tests__/simple-review-runner.test.mjs        |  51 ++
 .../scripts/__tests__/wh-review-cli.test.mjs       | 168 +++---
 skills/wh-review/scripts/review-runner.mjs         | 616 +--------------------
 skills/wh-review/scripts/simple-review-runner.mjs  |  16 +-
 skills/wh-review/scripts/wh-review-cli.mjs         | 139 +----
 .../decision-log.md                                |  14 +
 .../plan.md                                        |  62 ++-
 .../spec.md                                        |  47 +-
 .../tasks.md                                       | 109 +++-
 tests/integration/manual-delivery-close.test.mjs   | 214 -------
 tools/cli/stage-runtime.mjs                        |  73 ++-
 tools/cli/task-close.mjs                           |  21 +-
 21 files changed, 781 insertions(+), 1379 deletions(-)

```

## 关键改动说明

| 文件 | 改动 | 对应 AC |
| --- | --- | --- |
| core/task-close.mjs | 删除 risk close 阻塞；archive/merge/cleanup 正常路径；existing workspace 跳过删除 | AC-02 |
| runtime/task/workspace.mjs | createTaskWorktreeRemoval 对 existing 模式返回 no-op | AC-02 |
| tools/cli/task-close.mjs | 移除 risk close CLI 选项 | AC-02 |
| runtime/stage/stage-runner.mjs, tools/cli/stage-runtime.mjs | 左移：malformed input 返回 invalid_input | AC-05 |
| runtime/stage/stage-agent-outcome-adapter.mjs, tools/host/workflowhub-stage-agent-bridge.mjs | unavailable/invalid_input 拆分 | AC-05 |
| runtime/evidence/acceptance-evidence-validator.mjs | freshness 复用 | AC-06 |
| runtime/review/review-record-route.mjs | 简评结果落账 | AC-07 |
| skills/wh-review/scripts/wh-review-cli.mjs, simple-review-runner.mjs | 简化审查路径 | AC-07 |
| tests/close/*.test.mjs | close 机制、resume/finalize、freshness 测试 | AC-02 |
| tests/left-shift/*.test.mjs | 左移五件套测试 | AC-05 |
| tests/review/review-record-route.test.mjs | review 落账路由测试 | AC-07 |
| skills/wh-review/scripts/__tests__/*.test.mjs | wh-review 简评契约测试 | AC-07 |
| scripts/dead-code-scan.mjs, dual-track-evaluate.mjs | 死代码扫描、双轨评估 | AC-06 |
| tools/architecture/constitution-mapping-check.mjs | 宪法映射检查 | AC-03 |

## 测试输出
```

 RUN  v2.1.9 /Users/Hugh/Hugh/Project/workflowhub-workflowhub-simplicity-close-repair-20260829

 ✓ skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs (24 tests) 1722ms
   ✓ wh-review production CLI > opens only an existing make-decision Workspace and never prepares one 1213ms
 ✓ skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs (4 tests) 6ms
 ✓ tests/review/review-record-route.test.mjs (3 tests) 100ms
Preparing worktree (new branch 'task/WorkflowHub/close-contract-3')
 ✓ tests/close/close-contract.test.mjs (3 tests) 20827ms
   ✓ close contract (T0-RED) > one-shot close returns normal mode and completed.json has only physical facts 7843ms
   ✓ close contract (T0-RED) > close plan has exactly five ordered actions: commit, merge, archive, push, cleanup 6934ms
   ✓ close contract (T0-RED) > existing workspace mode completes without deleting the directory 6050ms
 ✓ tests/left-shift/left-shift-suite.test.mjs (4 tests) 4ms

 Test Files  5 passed (5)
      Tests  38 passed (38)
   Start at  08:14:24
   Duration  21.27s (transform 186ms, setup 0ms, collect 656ms, tests 22.66s, environment 0ms, prepare 110ms)


```

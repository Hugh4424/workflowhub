# CARD-10 Phase pointers

## Execution Index

纯指针索引；每Phase一行，正文是唯一执行合同。P1/P2旧范围保留；P3–P5当前设计增量仍草稿。Write set为各Phase实际文件边界，P5路径以已认证外置TASK_DIR为根，绝非worktree；只列一次driver，无仓库写面。

| Phase | Authority ref | Semantic anchor | Write set | Dependency | Consumer |
| --- | --- | --- | --- | --- | --- |
| `P1` | `phases/P1.md` | `#l0--结果与变更` | `specs/workflowhub-thin-core-card-10-20260919/spec.md`；`specs/workflowhub-thin-core-card-10-20260919/phases/P1.md`；`specs/workflowhub-thin-core-card-10-20260919/phases/index.md` | none | verify-code 执行者（真实下游读取方，逐 Task 重放执行卡）；用户（按需抽验任一卡的任一 AC 事实） |
| `P2` | `phases/P2.md` | `#t009-当前入口和当前等价oracle` | `tools/cli/stage-runtime.mjs`；`tests/e2e/stage-runtime-five-stage-e2e.test.mjs`；`tests/e2e/card-10-current-consumer-e2e.test.mjs`；`docs/architecture/move-map.json` | none（P1原件输入，不要求P1通过） | 当前公共CLI用户；独立verify-code消费者 |
| `P3` | `phases/P3.md` | `#l0--结果与变更` | `docs/contracts/card-01-stage-material-interface.md` | P2 | P4现行契约测试作者；主会话PRD展示消费者；独立verify-code消费者 |
| `P4` | `phases/P4.md` | `#l0--结果与变更` | `tests/e2e/card-10-current-contract-e2e.test.mjs` | P3 | P5公平资源实验作者；独立verify-code消费者 |
| `P5` | `phases/P5.md` | `#l0--结果与变更` | `quality/evidence/resource-experiment/card10-prospective-resource-driver.mjs` | P4 | 主会话资源展示消费者；独立verify-code消费者 |

# Phase 索引 — PRD 内容模型与 PaperBuilder 规划 PRD 还原

纯指针：每行指向一个 Phase 文件的实际契约头；正文、判据、命令与完成条件留在所指文件。

## Execution Index

| 阶段 | 权威引用 | 语义锚点 | 写入集 | 依赖 | 消费者 |
| --- | --- | --- | --- | --- | --- |
| `P1` | `phases/P1-改方法与验收.md` | `这一 Phase 交出什么？` | `skills/spec-prd/SKILL.md`；`skills/spec-prd/templates/prd-template.md`；`workflows/build-prd/SKILL.md`；`workflows/build-prd/steps.json`；`skills/wh-review/contracts/build-prd.md`；`skills/material-writing/SKILL.md`；`skills/spec-plan/SKILL.md`；`skills/spec-plan/templates/phase-template.md`；`workflows/build-plan/SKILL.md`；`skills/catalog.yaml`；`tests/contract/prd-card-shape.test.mjs`；`tests/contract/build-prd-review-contract.test.mjs`；本任务材料 | `none` | build-code 的开发、审查、测试三个独立上下文；P2 的 PRD 作者 |
| `P2` | `phases/P2-还原PaperBuilder PRD.md` | `这一 Phase 交出什么？` | PaperBuilder `specs/paperbuilder-architecture-optimization-planning-20261021/prd-v2.md`；本任务证据 | `P1` | 用户、后续 build-plan 作者与独立读者 |

两个 Phase 严格串行：P1 交回后 P2 才开工；不设并行批次。
共享路径只有本任务材料；P1 与 P2 各写自己的证据，不互相覆盖。

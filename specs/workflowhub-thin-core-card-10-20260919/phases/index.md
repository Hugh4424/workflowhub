# CARD-10 Phase pointers

## Execution Index

本表是纯指针索引：不是任务卡、不是 Phase 程序、不是进度账、不是完成权威。每个 Phase 恰好一行，权威正文在 `phases/P1.md`。

| Phase | Authority ref | Semantic anchor | Write set | Dependency | Consumer |
| --- | --- | --- | --- | --- | --- |
| `P1` | `phases/P1.md` | `#l0--结果与变更` | `specs/workflowhub-thin-core-card-10-20260919/spec.md`；`specs/workflowhub-thin-core-card-10-20260919/phases/P1.md`；`specs/workflowhub-thin-core-card-10-20260919/phases/index.md` | none | verify-code 执行者（真实下游读取方，逐 Task 重放执行卡）；用户（按需抽验任一卡的任一 AC 事实） |

上表 Write set 列只列**仓库写入面**（精确路径）：本卡在仓库内的写入面就是这三份 `.md`，与 `phases/P1.md` 契约头的「写入集」逐条一致。

仓库外证据落点不是仓库写入面，也不复制进仓库：`<TASK_DIR>/quality/tests/**`（测试与 oracle 执行原件）、`<TASK_DIR>/quality/reviews/**`（审查原件与受控演练原始字节）、`<TASK_DIR>/quality/evidence/**`（其余原件），按日期-序号-描述命名、append-only。

本卡禁止写入面（零改动）：`tests/**`、`workflows/**`、`runtime/**`、`core/**`、`tools/**`、`skills/**`、`config/**`、`contracts/**`、`docs/**`、母 PRD `specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md`、本卡 `specs/workflowhub-thin-core-card-10-20260919/decision-log.md`（唯一权威决定，只读不改）、`specs/archive/**`（ADR-005、ADR-006）。

pre cohort 的旧任务卡只读保留，在本文件中没有有效行。

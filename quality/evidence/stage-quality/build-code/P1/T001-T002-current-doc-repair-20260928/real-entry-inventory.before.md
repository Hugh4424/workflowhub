# 真实入口库存（CARD-04）

本表登记入口及可核对的执行事实。`最后实跑` 只写有原始命令、输出和时间的记录；`未核实` 不等于从未运行。入口存在、测试收集、业务验收通过是三件事。来源为 CARD-04 `decision-log.md` D-006、`spec.md` DER-07/DER-08 与 P1/T002。`ENTRYPOINT.md` 在本 worktree 和 Git 跟踪文件中均不存在，故不把它当作已核实的入口来源；现用 `tools/cli/stage-runtime.mjs`、`runtime/interface/runtime-facade.mjs`、`package.json` 和 `README.md` 核对。

## 显式入口

公共运行时基命令是 `node tools/cli/stage-runtime.mjs <behavior> --action=<action>`；写入或任务相关动作还需按当前任务补齐 `--project`、`--task`、`--stage` 等参数。下表列的是路由，不把省略身份参数的形式冒充可直接成功的执行命令。2026-09-26 11:53 UTC 实跑 `node tools/cli/stage-runtime.mjs --help`，exit 0，原始输出见 `quality/evidence/stage-quality/build-code/P1/T002-help.txt`；它列出七类 behavior 和全部 action。这是**帮助入口**的实跑，不证明任一 action 已执行。路由来源：`tools/cli/stage-runtime.mjs` 的 `stageRuntimeCliMain`，公共 behavior 来源：`runtime/interface/runtime-facade.mjs`。

| 入口命令（接在基命令后） | 类型 | 证据 | 最后实跑 |
| --- | --- | --- | --- |
| `doctor --action=workspace` | 显式 | `stage-runtime.mjs` 的 help 与 publicRoute | action 未核实；help 于 2026-09-26 11:53 UTC |
| `status --action=begin` | 显式 | 同上；`README.md` 也点名此路由 | action 未核实 |
| `status --action=repair` | 显式 | `stage-runtime.mjs` 的 help 与 publicRoute | action 未核实 |
| `run --action=execute` | 显式 | 同上；`spec.md` §8 列本卡带任务身份的实际命令 | action 未核实 |
| `run --action=preflight` | 显式 | `stage-runtime.mjs` 的 help 与专用委派分支 | action 未核实 |
| `run --action=draft` | 显式 | `stage-runtime.mjs` 的 help 与 publicRoute | action 未核实 |
| `run --action=reflect` | 显式 | `stage-runtime.mjs` 的 help 与 publicRoute | action 未核实 |
| `review --action=risk` | 显式 | `stage-runtime.mjs` 的 help 与 publicRoute | action 未核实 |
| `review --action=record` | 显式 | `stage-runtime.mjs` 的 help 与 publicRoute | action 未核实 |
| `verify --action=execute` | 显式 | `stage-runtime.mjs` 的 help 与 publicRoute | action 未核实 |
| `confirm --action=decision` | 显式 | `stage-runtime.mjs` 的 help 与 publicRoute | action 未核实 |
| `authorize --action=commit` | 显式 | `stage-runtime.mjs` 的 help 与 publicRoute | action 未核实 |
| `authorize --action=push` | 显式 | `stage-runtime.mjs` 的 help 与 publicRoute | action 未核实 |
| `authorize --action=merge` | 显式 | `stage-runtime.mjs` 的 help 与 publicRoute | action 未核实 |
| `authorize --action=archive` | 显式 | `stage-runtime.mjs` 的 help 与 publicRoute | action 未核实 |
| `authorize --action=cleanup` | 显式 | `stage-runtime.mjs` 的 help 与 publicRoute | action 未核实 |
| `npx vitest run tests/contract/card04-final-aggregate.test.mjs` | 显式、定向测试 | `quality/evidence/prewritten-red/P13-T024-nonrunner-current-v12-red.txt` 的 `COMMAND`、UTC、原始 runner 输出与 `EXIT=1` | 2026-09-26 09:51:16 UTC；目标 RED，非验收通过 |
| `node tools/architecture/complexity-report.mjs` | 显式、架构报告 | `tools/architecture/complexity-report.mjs:432-456` 有写入 `docs/architecture/complexity-baseline.json` 的默认分支 | 未核实；本次未运行，避免覆盖 P2 待修基线 |
| `node tools/cli/stage-runtime.mjs --help` | 显式、只读帮助 | `quality/evidence/stage-quality/build-code/P1/T002-help.txt`：七类 behavior、16 个 action、exit 0 | 2026-09-26 11:53 UTC |

## 间接入口

`package.json` 的 scripts 只是包装声明。没有对应原始运行记录时，最后实跑保持未核实；即使有包装命令成功，也要核包装器实际调用的目标、测试身份与业务 oracle。

| 入口命令 | 类型 | 证据及实际到达点 | 最后实跑 |
| --- | --- | --- | --- |
| `npm run check` | 间接 | `package.json`：依次包装 markdownlint、`tools/cli/verify-structure.mjs`、`tools/cli/run-checks.mjs`、skill closure 与 package smoke；`README.md` 给出此入口 | 未核实；本次未运行 |
| `npm run test:contract` | 间接 | `package.json` → `vitest run tests/contract`，范围为整个 contract 层 | 未核实；本次未运行 |
| `npm run test:profile` | 间接 | `package.json` → `tools/cli/run-checks.mjs` → 指定的两个 Vitest 用例 | 未核实；本次未运行 |
| `npm run test` → `npm run test:safe` | 间接 | `package.json` 链到多个测试组；无范围全量执行受 `AGENTS.md` 测试纪律约束 | 未核实；本次未运行 |
| `node tools/architecture/complexity-report.mjs --check-hard-gates` | 间接进入报告计算 | `complexity-report.mjs:432-456`：读已发布 JSON 对比；这是与默认覆写分支不同的 CLI 路线 | 未核实；本次未运行 |

## 未跑过入口

这里的“未跑过”限定为 **P1/T002 本次未实跑、且本表未引用可核对的逐入口原始执行记录**，不是历史全称判断。所有 `stage-runtime` action 均在此集合；本次只跑 `--help`。`complexity-report.mjs` 默认写入路由及 `--check-hard-gates` 也未实跑。`npm run check`、`npm run test:contract`、`npm run test:profile`、`npm run test` 均未实跑。表内唯一引用了先前原始执行记录的定向 Vitest 入口为 P13 目标 RED；它不代表别的 Vitest target、真实 CLI 流程或业务 case 已跑。后续每条实跑记录须补精确命令、CWD/任务身份、UTC、exit、原始输出、测试身份及对应 oracle，才能从本节移出。

## 冻结接口面与消费者清单

以下三面沿 `spec.md` §7/§9 的 DER-07/DER-08 登记。此处冻结的是**约定形状与对齐顺序**，不是宣称 P4/P5 的生产实现或跨卡验收已完成。OPEN-006 的跨卡协调尚待真实对齐；先冻结方承担集成责任，后续卡在相同形状上核消费者。

| 接口面 | 文件名与结构 / 返回字段 | 生产者与当前实现状态 | 消费者 |
| --- | --- | --- | --- |
| 入口清单 | `docs/architecture/real-entry-inventory.md`；显式入口、间接入口、未跑过入口，每条为入口命令、类型、证据、最后实跑 | CARD-04 P1/T002；本文件登记，不代表各路由均已实跑 | `verify-code`、后续 CARD 的入口核查、未来 CI 接线；**CARD-10** 总集成验收消费者 |
| acceptanceChain 行 | `buildPostAcceptanceChainRows` 返回逐 AC 行；`ac`（现有行实际字段为 `acceptance_criterion_id`）、`source_ids`、`decision_ids`、`fr_ids`、`task_ids`、`evidence_refs`、`review_ref`、`coverage_limits`，并保留 `task_id`、`material_revision`、`snapshot_tree`、`producer_stage` 等身份/既有行字段。缺真实映射或引用则空数组加 `coverage_limits`，不得假填 | CARD-04 P4/T006；当前 `stage-runner.mjs` 内联 `acceptanceChain`，导出纯函数尚未实现；`task_ids` 已由 CARD-05 路线派生，`review_ref` 仍待实证 | build-code 的 `currentPostBuildCodeSpecAnalyze` 与阶段质量消费者；CARD-05、CARD-07 对齐方；**CARD-10** 总集成验收消费者 |
| 报告事实层 | `stage-end-report-facts.v1`：`schema_version`、`not_done[]`、`route_applicability[]`、`executions[]`、`coverage_limits[]`、`exceptions[]`、`sources[]`。`not_done` 的机器状态只用 `missing`、`inconsistent`、`incomplete`、`failed`、`unavailable`；声明类留在后两栏 | CARD-04 P5/T007；`runtime/stage/stage-end-report.mjs` 当前为空壳，不能当事实报告 | stage 末报告和人工交接；CARD-05、CARD-07 对齐方；**CARD-10** 总集成验收消费者 |

本清单的文档层检查仅验证四节与 CARD-10 字样存在，不验证入口实际执行、实现状态、消费者已接入或业务效果。上述未核实项不得因文档 gate 绿色而改写为完成。

P1/T002 原始文档检查输出为 `quality/evidence/stage-quality/build-code/P1/T002-red.txt`（2026-09-26 11:28:43 UTC，exit 1，目标“文件不存在”）和 `quality/evidence/stage-quality/build-code/P1/T002-green.txt`（exit 0；2026-09-26 11:30 UTC 首次绿，最终文件为文档定稿后的同门复跑输出）。执行身份为 `task_id=workflowhub-thin-core-card-04-20260919`、`HEAD=ef920f1fbd415fe87d50930359059b661e141acd`、`snapshot_tree=2a0e21e65488fba4e4507e4491f9edcab8e4585b`，文档检查属于 `kind=command_checks`、P1 文档检查组 `P1-DOC-ASSERTIONS`。时间、任务和快照在此作执行索引；最终质量身份仍须由 canonical task 事实和原始命令输出独立核对。

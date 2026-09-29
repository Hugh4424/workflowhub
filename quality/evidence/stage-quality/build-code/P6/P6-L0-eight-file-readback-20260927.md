# P6 L0 八文件综合门：当前只读回测

本次只运行 `phases/P6.md` 声明的八文件综合命令，并执行其 Node 版本守卫。未改生产源码、测试、任务材料或外置 Task store。完整命令、CWD、分支/HEAD、运行前后选定源码及材料 SHA-256、git 状态、起止时间与 exit 见 [元数据](P6-L0-eight-file-readback-20260927.meta.json)；原始输出见 [stdout](P6-L0-eight-file-readback-20260927.stdout.txt)、[stderr](P6-L0-eight-file-readback-20260927.stderr.txt)、[exit](P6-L0-eight-file-readback-20260927.exit.txt)。三项原件 SHA-256 依次为 `3c2431532a9ca3b908e4430778355f8dbf322a49eb9478affa639352d75943ca`、`3d32ce0d7b298f9223b5d12bac1d306d657de49c93d8e534841aa0c421b0168c`、`4355a46b19d348dc2f57c046f8ef63d4538ebb936000f3c9ee954a27460dd865`。

```sh
npx vitest run tests/contract/decision-log-census.test.mjs tests/contract/upstream-coverage-ledger.test.mjs tests/contract/spec-analyze-truthfulness.test.mjs tests/contract/review-history-canonical-reader.test.mjs tests/contract/oracle-mirror.test.mjs tests/e2e/card-04-real-entry-chain-e2e.test.mjs tests/contract/post-phase-official-handler.test.mjs tests/contract/post-spec-analyze-original-source.test.mjs
```

- CWD：`/Users/Hugh/Hugh/Project/workflowhub-workflowhub-thin-core-card-04-20260919`；分支 `task/workflowhub/workflowhub-thin-core-card-04-20260919`；HEAD `ef920f1fbd415fe87d50930359059b661e141acd`。工作树含本任务未提交改动；HEAD 不代表被测源码。元数据逐文件记录运行前/后哈希，所记录文件无漂移。UTC 2026-09-26 23:58:29 至 2026-09-27 00:00:36，未超时。
- Vitest `2.1.9`：八文件中 **七文件通过，一文件失败**；72 测试中 **69 通过，3 失败**；进程 **exit 1**。Node 守卫在 `24.14.0` 下 **exit 0**，[守卫 stdout](P6-L0-eight-file-readback-20260927.node-guard.stdout.txt) 与 [守卫 stderr](P6-L0-eight-file-readback-20260927.node-guard.stderr.txt) 保留原文。

| 文件 | 结果 | 归因 |
| --- | --- | --- |
| `tests/contract/decision-log-census.test.mjs` | 6/6 通过 | 当前普查测试绿；不证明整个 P6。 |
| `tests/contract/upstream-coverage-ledger.test.mjs` | 9/9 通过 | 当前账本测试绿。 |
| `tests/contract/spec-analyze-truthfulness.test.mjs` | 3/3 通过 | 当前定向合同测试绿。 |
| `tests/contract/review-history-canonical-reader.test.mjs` | 7/7 通过 | 读取器夹具绿；不等于所有真实历史记录均已认证。 |
| `tests/contract/oracle-mirror.test.mjs` | 9/9 通过 | 当前镜像合同测试绿；不证明独立宿主隔离。 |
| `tests/e2e/card-04-real-entry-chain-e2e.test.mjs` | **14/17 通过，3 失败** | 下列三项。 |
| `tests/contract/post-phase-official-handler.test.mjs` | 15/15 通过 | 当前邻接守卫绿。 |
| `tests/contract/post-spec-analyze-original-source.test.mjs` | 6/6 通过 | 先前归档路径 `ENOENT` 本次未复现。 |

E2E 两个失败都读不到临时任务目录的 `quality/evidence/stage-quality/build-code/P5/report-facts.json`：一项查文件是否落盘，另一项要检查其中逐条 `not_done` 清单。该夹具只建 P1，当前测试仍要求 P5 报告；现行 P6 材料已将这条旧期待改为“P1 不应有 P5 报告，另用真实 P5 来源作正例”。因此此处既暴露旧测试与现合同不合，也未验证真实 P5 报告生产者；不能仅靠这个 P1 夹具判断 P5 生产实现已失败或已通过。

E2E 第三个失败是 **AC26 机器判断被覆盖**：分析器原值 `material_incomplete`，验收文件的 `summary.actual_outcome` 却是 `missing`；同时原始日志显示 `subject_fact.evidence_state=undefined`。断言在 `actual_outcome` 处首先失败，后续 `evidence_state` 断言未执行；其原始值可见，但不能把后续断言计作独立失败。`acceptance.result="deferred"` 是观测值，不能把本次局部定向测试绿色换算成 AC26 完成。

结论：此八文件综合门 **未通过**，P6 仍未完成。此次是当前快照回测，不是本轮修复引入的回退证据；七文件绿色也不构成完整相位验收。P6 还要求单独门、真实样例和独立审查，本次未执行或裁决那些事项。

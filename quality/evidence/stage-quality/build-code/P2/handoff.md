# P2 相位交接：复杂度基线数字

P2/T004 的**局部数据修正已完成**：`docs/architecture/complexity-baseline.json` 的 `formal_test_lines.actual` 从 20292 改为当期 `buildReport()` 只读内存实测 83996，`delta_from_target` 改为 73996，`target=10000`、`limit=12000`、`within_limit=false`；`caliber` 说明约为上限 7.0 倍及直接运行报告脚本会覆写 JSON 的副作用。只改了该 JSON 条目；冻结测试由 build-plan 预置，本次未改。当前 JSON SHA256 `62d4d1fc95cfeb9e8bd9a63ec8a0da8cb2d3935f1cbc55e976b117177f64f993`，测试 SHA256 `fe4afe799f904027f2c6b5dea2c3df0802ee5a9f2cfac6cc975181cd21aaf9c7`。[实施摘要](/Users/Hugh/Hugh/Project/workflowhub-workflowhub-thin-core-card-04-20260919/quality/evidence/stage-quality/build-code/P2/T004-summary.md)、[只读实测](/Users/Hugh/Hugh/Project/workflowhub-workflowhub-thin-core-card-04-20260919/quality/evidence/stage-quality/build-code/P2/T004-measurement.txt)。

同一 L0 命令 `npx vitest run tests/contract/repository-inventory.test.mjs -t "complexity baseline"` 的[当期 RED](/Users/Hugh/Hugh/Project/workflowhub-workflowhub-thin-core-card-04-20260919/quality/evidence/stage-quality/build-code/P2/T004-red.txt)为目标断言 `20292 != 83996`，exit 1、1 failed / 8 skipped；改 JSON 后的[GREEN](/Users/Hugh/Hugh/Project/workflowhub-workflowhub-thin-core-card-04-20260919/quality/evidence/stage-quality/build-code/P2/T004-green.txt)为 exit 0、1 passed / 8 skipped。外置 Task store 的[官方 verify receipt](/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-thin-core-card-04-20260919/quality/tests/card04-P2-L0-official-20260926.json) SHA256 `ff14c987f27f1d783d5035db6e92fc2c51028fd0ce94f6d15bc74d2963bf5fb1`；[原始输出](/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-thin-core-card-04-20260919/quality/tests/output/card04-P2-L0-official-20260926.output) SHA256 `3e0138177ebe4b33fa0c3ec85e920584e875da764a3c607010a00acc4a833518`，receipt 内测试 exit 0、1 passed / 8 skipped。[命令和身份元数据](/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-thin-core-card-04-20260919/quality/evidence/stage-quality/build-code/P2/card04-P2-L0-official-20260926.meta.json)保留 CLI stdout/stderr 哈希。

上述 receipt 与[P2 官方 OCR result](/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-thin-core-card-04-20260919/quality/reviews/results/build-code-simple-68ef7817-c3bd-5b84-a444-4e2304423403.json)均绑定 `snapshot_tree=c4987d3e223a2861e735547658730d2bc7a33326`、HEAD `ef920f1fbd415fe87d50930359059b661e141acd`；OCR result SHA256 `dfb66eb222505a357d59490795180329f01eec694ee1be06fd08ee19afe854a9`，attempt `68ef7817-c3bd-5b84-a444-4e2304423403`，状态 available/semantic，有 14 条 finding，不能读成 clean pass。交接前只读重取的**当前修后** execution snapshot 是 `tree=c0d5f317c5ff3fbec5f36f17c745a2f831f01549`、`source_digest=30c6e6f9b4c9389a49c71444f71c5fd76ba545494742dc073562bd6518561af7`，与 receipt/OCR 的旧 tree 及 `source_digest=5ab1b43b35e059a24204b42e343d8817c4e1b39b86ef3a103bef08eacab19d73` 不同。后续改动（包括 P4 修后源码）不得倒算进旧 receipt 或旧审查；需要当期判断时重新绑定当前快照。

## OCR 14 条 finding 的归属

下表保留 result 的原裁决词；`invalid_evidence/invalid_anchor` 表示这次审查包的锚点不足，**不等于所述风险已被修复**。`needs_corroboration` 也只是待独立复核。OCR 扫到跨相位大 diff，不能把所有 finding 算作 P2/T004 的改动。

| ID | OCR 议题简述 | 实际归属与交接 | 原裁决 |
| --- | --- | --- | --- |
| F-193d68e4c6db | advisory 与 fact ref 按索引可能错绑 | P5/T007 报告事实；结合 P6 消费核对 | `needs_corroboration` |
| F-342a76db9e88 | Vitest include 范围过宽 | P4/T006 的 `vitest.config.mjs`，连同 P1 测试治理规则核对 | `nonblocking_minor` |
| F-3ccd854c1549 | 业务效果核验绑死测试夹具标题 | P10/T021 逐 case 对账 | `invalid_evidence` |
| F-5ab95427d427 | spec-analyze advisory 的 fact ref 可能错绑 | P5/T007 报告事实，P6 真实消费者需核 | `invalid_evidence` |
| F-6e12fda83e65 | 报告是否由真实阶段结束流程消费/落盘 | P5/T007 报告生产与后续真实入口消费者 | `needs_corroboration` |
| F-88e6d61ca847 | 审查包只有 P2 的 `-t` 单门，无法证明整批改动 | 跨 Phase 审查包与证据装配；P2 单门只证明本条 baseline | `invalid_evidence` |
| F-8bf991a3bada | acceptanceChain 映射表列形状可能静默跳过 | P4/T006 生产解析 | `nonblocking_minor` |
| F-b1274b745159 | task 起点哈希是否有独立信任锚 | P9/T018 change-scope 生产者与认证边界 | `needs_corroboration` |
| F-b6f9b8877d24 | selector 的错 snapshot 负控仍选中 | P10/T020 selector；正式三文件 gate 此项仍 RED | `invalid_evidence` |
| F-b7523f1d451d | 缺固定可信入口串起选择、执行、receipt | P10/T020 runner 与后续实际调用方/消费者边界 | `invalid_evidence` |
| F-b998734e4761 | 冻结测试把 `within_limit=false` 写死，原全文件字节守卫已撤 | **P2 直接风险**：冻结测试归 build-plan/material owner；P2 实施只获准改 JSON，不能改测试求绿；后续预算回落或其它字段漂移时须重判 | `invalid_evidence` |
| F-bc9fba8e686e | 缺报告文件时未披露 evidenceDir 不存在 | P5/T007 报告缺失路径 | `nonblocking_minor` |
| F-c4e133a158fe | 对账正例要求 `reconciled`，现 seam 只返回 `unavailable` | P10/T021；正式三文件 gate 两正例仍 RED | `invalid_evidence` |
| F-d29b61613d48 | oracle mirror 测试用固定文件数阈值 | P6/T011 测试与环境口径 | `nonblocking_minor` |

## 未由 P2 证明的事

P2 只修一个 published baseline 数字。`-t` 明确跳过 8 项；它不证明其它预算条目、整个测试资产质量、AC-20 的不同路线机器产物适用性，也不证明 AC-21 的 acceptanceChain 与报告消费。冻结测试的 `within_limit=false` 永久化风险尚在，OCR 的 P2 finding 未因目标 GREEN 自动消失。当前未写正式 stage fact、未把局部测试结果升格为 Phase 或 CARD-04 整体验收。

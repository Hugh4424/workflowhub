# P10/T021 固定回执误拒修复交接（2026-09-28）

## 结论

已修复 `verifyOfficialEvidence` 把两个独立 JSON 解析出的同值对象用 `!==` 当作错绑的错误。真实固定受控测试回执现能被官方 `run` 接收并形成测试质量事实。逐 AC 到该回执的生产来源、消费原件与 locator 尚未实现，AC/业务效果仍为 `unknown`；P10/T021 尚未完成。

## 改动

- 生产只改 `runtime/stage/stage-runner.mjs#verifyOfficialEvidence`：`runtime_profile`、`capability_proof`、`behavior_fingerprint` 两边均为对象/数组时用现有 `canonicalJson` 比结构和值；其他字段继续 `===` 意义的严格核对。原 receipt 的 hash/schema、输出 hash、Task/树/命令检查原样保留。
- 受影响测试只增 `tests/contract/build-code-case-reconciliation.test.mjs` 与 `tests/integration/vnext-official-stage-run.test.mjs` 的命名目标。合同目标用隔离 Task 真正调用固定 `runCapture`，读取 canonical receipt/output/manifest/reporter，独立两次 JSON 解析；还跑官方 `run`（同时给当前 implementation receipt）。集成目标只用隔离的 canonical profile/proof fixture 校验这两个结构字段值比较，未把 fixture 称为实际执行。
- 前一批的非枚举 `stage_reflection.stage_row_write` 局部改动保留，本批没有改 handler、AC writer、对账 reader、公开结果或 Task facts。

## 原始测试

同一最终测试源码、同一命令：

`npx vitest run tests/contract/build-code-case-reconciliation.test.mjs tests/integration/vnext-official-stage-run.test.mjs -t "ORACLE-P10-STRUCTURAL|ORACLE-P10-OFFICIAL-FIXED|ORACLE-P10-PROFILE"`

- 旧比较 RED：`red-final.txt`，exit 1，3 目标失败 / 161 跳过。真实固定回执的独立 `behavior_fingerprint` 对象被误拒；官方 `run` 在同处失败；另一个 canonical profile/proof fixture 被 `runtime_profile` 引用比较误拒。原件 SHA `9ebfd83c5d65ebe83d7931b8560a38f977aeb9a00d4259ea78afda97bda4534a`。
- 最小修复 GREEN：`green-final-all.txt`，exit 0，3 目标通过 / 161 跳过。原件 SHA `d2ab39270213129504450efa00e9b501226a07dfb552b4d8d77a468189209b55`。
- 负控在同目标内：错嵌套 `run_id`、业务目录 hash、真正旧源码树与 `facts.snapshot_tree` 错配；错 profile 权限、错 proof 原件 hash，均拒绝。官方正例读回 `risk_tests_fresh` 为 `passed` 且证据 ref/hash 指向实际输入的固定 receipt；逐 AC 没有被提升为 passed，公开结果无 `p10_consumption_evidence`。
- 相邻旧判据：`adjacent.txt`，exit 0，4 目标通过 / 104 跳过，包括非零 receipt 不能报 passed、嵌套 receipt namespace、错 output bytes。原件 SHA `b46aac8748b3bd58316e6d14c1eed0c089ce4b7966c4eb73f654745d8b8e3448`。三份改动文件 `node --check` 与 `git diff --check` 均 exit 0。未跑全量测试。

先前 `official-fixed.txt` 的 `canonical test receipt provenance is invalid` 是夹具在测试运行**之后**才修改 Git ignore 策略，导致快照变化；移到固定测试运行**之前**后，`official-fixed-current.txt` 已通过。这是夹具错误，不算产品 RED，不用于绿化结论。

## 源码与范围

HEAD `ef920f1fbd415fe87d50930359059b661e141acd`，未提交。收尾 SHA：`runtime/stage/stage-runner.mjs`=`98b88655f70b371104f751c51aeae72a845add2e17b03f614e769806103fbb94`；合同测试=`508907028081589408209c8002ae0c34acfdca23a026d72d97d211d375240d9d`；集成测试=`708480fefc9f99e6bff8e804ea152758e21cb97c7d3e45adc9e90f26717e8376`。

`test-routing-advisor` 按 `runtime/` 与 `tests/` 两个顶层目录给 `fullstack/pass`（2026-09-27T19:26:32Z）；真实改动是一个后端证据核对函数和两份后端测试，无前端/API/数据库，采用 `backend-testing` 定向真实 Task 和负控路线。完成 oracle 仅为误拒修复，不是业务验收。宪法 F2、F9、F11、Q1：复用窄接口、保留失败和未知、不增控制面、不把测试事实冒充 AC/完成。Q3 独立审查由主任务另行安排。

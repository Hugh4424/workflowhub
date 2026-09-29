# T012 有界测试修订实测

- 认证工作树：`/Users/Hugh/Hugh/Project/workflowhub-workflowhub-thin-core-card-04-20260919`。
- 原测试独占备份：`quality/evidence/prewritten-red/P6-T012-original-test.mjs`，SHA-256 `f470c1ff4885196c9d775c9bb9a6d88e612ef78b5c58fe29af66c4049a0f125e`。旧 17 项 / 4 失败 RED 独立保留。
- 本次只改 `tests/e2e/card-04-real-entry-chain-e2e.test.mjs` 中 P1-only 的两个 P5 报告期待：P1-only 必须没有 P5 `report-facts.json`，但官方运行结果的 `missing_items` 仍逐条披露。修订测试 SHA-256 `71c357fad6ae2f40d3369971172f9b2380b7251b4f12c17928cab23c69da3c18`。
- 定向命令：`npx vitest run tests/e2e/card-04-real-entry-chain-e2e.test.mjs`，exit 1，17 项中 16 通过、1 失败。P1-only 两项通过；唯一失败是原有的分析器判决从 `material_incomplete` 被投影为 `missing`，位于测试第 509 行。这不是 P5 报告的目标 RED，不能据此声称 P5 接线有 RED/GREEN。原始输出和运行前后 hash 见 `T012-revised-red.txt`、`T012-revised-red.meta.json`；raw 输出 SHA-256 `e3a01038f5f975abbd07192771203eb930dd1711da1697da2603ca3dc045d6f6`。
- 未加真实 P5 正例：当前 Task store 的 `facts.jsonl` 只有 make-decision、build-plan 阶段行，缺 build-code/P5 当前阶段、测试、独立审查、同次来源链及 canonical ref/hash。不能靠 `phase_progress` 游标或手工写 `report-facts.json` 冒充。待真实 P5 来源齐备后，再增加正例并单独采集其目标 RED。
- 本修订未改生产代码、其它测试或 Task store；T012 仍未完成，待独立审查。

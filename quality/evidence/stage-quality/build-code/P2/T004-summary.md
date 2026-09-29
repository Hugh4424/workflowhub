# P2/T004 build-code 实施事实

- 工作树：`/Users/Hugh/Hugh/Project/workflowhub-workflowhub-thin-core-card-04-20260919`，HEAD `ef920f1fbd415fe87d50930359059b661e141acd`。
- 变更：仅 `docs/architecture/complexity-baseline.json` 的 `budgets.formal_test_lines`。`actual` 从 20292 改为当期只读 `buildReport()` 实测 83996，`delta_from_target` 从 10292 改为 73996；保留 `target=10000`、`limit=12000`、`within_limit=false`，新增 `caliber`，披露约 7.0 倍上限和直接运行报告脚本的覆写副作用。
- 冻结输入：`tests/contract/repository-inventory.test.mjs` SHA-256 `fe4afe799f904027f2c6b5dea2c3df0802ee5a9f2cfac6cc975181cd21aaf9c7`；本次未修改。
- 测试路由：计划和实际均为 `simple` 数据修正，定向 contract Vitest；`test-routing-advisor` 判类见 `T004-route.json`。无后端行为变更，`backend-testing` 不适用。
- RED：同一精确命令 `npx vitest run tests/contract/repository-inventory.test.mjs -t "complexity baseline"`，exit 1；目标断言 `expected 20292 to be 83996`，1 failed、8 skipped。原始输出见 `T004-red.txt`。
- GREEN：同一精确命令，exit 0；1 passed、8 skipped。原始输出见 `T004-green.txt`。只读实测命令与原始输出见 `T004-measurement.txt`。
- 消费核对：再次调用只读 `buildReport()`，逐字段比对 `actual/target/limit/delta_from_target/within_limit`；与 HEAD JSON 比较确认 `formal_test_lines` 外字段未变，输出 `P2_CONSUMER_OK actual=83996 delta=73996 outside_formal_test_lines_unchanged=true`。`git diff --check -- docs/architecture/complexity-baseline.json` exit 0。
- 范围限制：本次只验证目标合同用例和 `formal_test_lines` 真值，未判其它 budget 条目、AC-20 或全量测试。后续 Phase 修改或跟踪新的正式测试文件会改变 `buildReport()` 计数；最终快照须重测并同步本条。P2 Phase 独立审查与 finding 处置由主会话完成。本次未 `git add`、commit 或派发 Phase review。

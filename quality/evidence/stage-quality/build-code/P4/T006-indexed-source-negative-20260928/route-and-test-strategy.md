# P4/T006 现行来源索引定向检查

- 依据：`phases/P4.md` Action⑤；本次实际改动只有新合同测试及其 `move-map` 登记。P4 原计划为模块/接口定向验证；按 `skills/test-routing-advisor/SKILL.md` 的判类，现行验证范围取 `feature`：测试横跨真实规格、来源索引和运行时验收行，不能只用静态检查。按 `skills/backend-testing/SKILL.md` 保留命令、实际输出、反例与覆盖限制。
- 目标：当前 `decision-log.md` 中 `R-009` 的六条已认证 `U-006-01..06`，经当前 `spec.md` 映射进入 `AC-29.source_ids`；没有认证边的 `AC-18` 来源为空且说明原因。
- 环境：Node v24.14.0，Vitest 2.1.9；无需服务、数据库、浏览器；真实材料和生产源码原件留在工作树，故障注入只在 `/tmp/card04-p4-index.*` 隔离副本。
- 可失败目标：`node node_modules/vitest/vitest.mjs run tests/contract/post-acceptance-chain-source-index.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`。故障注入只把 `AC-29.source_ids` 改为 `[]`；期望同一断言 RED exit 1，恢复原字节后 GREEN exit 0。
- 邻接目标：真实工作树新增测试 1 项和原 `runtime/stage/stage-runner.test.mjs` 七项，均须 exit 0；`node --check` 新测试/生产源码及 `move-map` JSON 解析须 exit 0。
- 覆盖限制：这是纯函数与真实材料的定向检查，没有运行真实 build-code 阶段、P5 报告、官方 P4 审查或整卡业务验收。P4 完成状态由主代理结合这些当前事实另判。


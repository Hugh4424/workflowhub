# P7 v2 同组定向复测

- 命令：`npx vitest run tests/contract/acceptance-execution-tier.test.mjs -t 'passed AC leaf|duplicate declared scenarios|borrow a passed command leaf|covers two required scenarios'`
- 工作目录：`/Users/Hugh/Hugh/Project/workflowhub-workflowhub-thin-core-card-04-20260919`
- HEAD：`ef920f1fbd415fe87d50930359059b661e141acd`
- UTC：`2026-09-27T15:53:03.408584+00:00` 至 `2026-09-27T15:53:50.034570+00:00`
- 退出码：`0`；Vitest 收集 84 条，选中 4 条，4 通过，80 跳过。
- 四项身份：浏览器场景不借用命令证据；已通过 AC 但第二必需场景无引用；重复声明场景被拒绝；两个必需场景各有 AC 证据的正控。
- P7、index、测试及两份生产文件在本轮运行前后 SHA-256 一致，具体值见 `run.json`。
- 原始输出：`stdout.raw.txt`、`stderr.raw.txt`。

结论仅覆盖这 4 条定向测试；未运行整份 P7 测试或相邻范围。

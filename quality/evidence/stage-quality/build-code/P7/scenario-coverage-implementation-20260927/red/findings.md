# P7 v2 精确定向 RED

- 命令：`npx vitest run tests/contract/acceptance-execution-tier.test.mjs -t 'passed AC leaf|duplicate declared scenarios|borrow a passed command leaf|covers two required scenarios'`
- 工作目录：`/Users/Hugh/Hugh/Project/workflowhub-workflowhub-thin-core-card-04-20260919`
- HEAD：`ef920f1fbd415fe87d50930359059b661e141acd`
- UTC：`2026-09-27T15:51:03.276819+00:00` 至 `2026-09-27T15:51:54.807044+00:00`
- 退出码：`1`；Vitest 实际收集 84 条，选中 4 条，失败 3、通过 1、跳过 80。
- RED 身份：必需浏览器场景借用已通过命令证据，期望 `missing`、实际 `passed`；第二必需场景无引用，期望 `missing`、实际 `passed`；重复声明场景，期望抛错、实际正常返回。
- 正控：两个必需场景分别有自己的证据时通过。
- 三项失败均是业务断言；没有导入错误、fixture 启动失败或零测试。
- 所列材料、测试及两份生产文件在运行前后 SHA-256 一致。具体哈希见 `run.json`。
- 原始输出：`stdout.raw.txt`、`stderr.raw.txt`；失败栈在 stderr 第 3–178 行。

这只证明当前生产实现没有满足这三条新断言；还未应用生产补丁，也未证明完整 P7 验收。

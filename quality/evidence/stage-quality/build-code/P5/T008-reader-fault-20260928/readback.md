# P5/T008 报告读盘故障补证（隔离夹具）

2026-09-28。只改 `tests/contract/p5-same-run-report-source.test.mjs` 的夹具和一项测试；`runtime/evidence/freshness.mjs` 原字节哈希在前后都是 `080788f1597792c3b8158c6f8c0403ef9e87add288d78aba6dc1bc2352f6160a`，本轮未改生产读者。测试旧原件是 `test-before.mjs`，前后哈希见 `before-sha256.txt`、`after-sha256.txt`。

隔离 Task 内写齐五份报告层文件：完成标记 `report-facts.json`、正文 `report.md`、来源 `source-<sha256>.json`、认证单 `certificate-<sha256>.json`、索引 `T008-delivery.txt`。索引和认证单的 ref/hash 与文件原字节一致。它们明确标为 `fixture_only`，没有正式收据、阶段行或独立真人确认；正常读取仍返回 `missing`，原因是缺当前阶段行。它只用于证明读取故障分类和失败关闭，绝不是 CARD-04 正式 P5 报告，也不证明报告生产者可发布。

新测试在这五个已有原件上逐一注入 `EACCES`、`EPERM`、`EIO`：共 15 个读盘故障均返回 `authenticated=false, status=unavailable`，原因保留注入的错误。删除正文或改坏其原字节哈希，均返回 `authenticated=false, status=missing`；删除原因含 `ENOENT`，改坏原因指向 ref/hash 绑定。

- `target-output.txt`：新测试 1 通过、34 跳过，exit 0。
- `focused-output.txt`：该合同文件 29 通过、6 个历史用例跳过，exit 0。跳过的生产/重试用例仍需可信真人来源，不能算完成。
- 新测试第一次执行 exit 1 是夹具错误地预期了稍后才会执行到的阶段行检查文字；修正预期后直接通过。现有生产代码已经正确分类这些故障，因此没有真实的“生产目标 RED→GREEN”，也没有人为制造生产失败。

这里只证明报告层读取失败处理。完整来源链、真人确认、当前 CARD-04 三份固定报告文件及 P5/T008 正式验收仍未成立。

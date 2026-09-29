# P10 当次工作树独有 61 路径审计

范围只取 [原索引](../T020-unmapped-206-census-20260927/index.json) 中 `origin_bucket=worktree_only_at_run` 的 61 条，原索引 SHA-256 `2125e618b10ac49fdfbc50bc9a1acee9485c999f4a6874eb485e9eb90ba76a30`；捕获树 `a8ba4bcc213c29f78aec61e4f64139444d3b0d1b`，材料版本 `revision-385359c77a5be8197c6fd6c0b63441236f630342a490566cc4b55e299841d044`。逐路径 owner、真实消费者、已有测试或缺口、与 P8 三例关系见 [index.json](index.json)。

## 结论

- **可直接复用当前同版正式测试事实**：P2 1/1、P3 4/4、P4 7/7、P10 三文件 78/78 与 targeted-capture 23/23；P10 真实固定入口另跑三例 49/49。它们只证明对应测试/执行合同，不证明本卡业务完成。P1 文档 gate exit0；P6 79/79、P7 62/62、P8 10/10+2/2、P11 5/5 为本地定向事实，不能说成正式阶段通过。P9 旧正式 8/8 绑定旧树，不能套给当前字节；P5 历史正式 8/8 亦是旧源码。
- **与 P8 三例直接相关的本 61 路径**：`phases/P7.md` 是 AC27 规则来源；`decision-log-census.test.mjs`、`acceptance-result-machine-classes.test.mjs` 是两个登记的执行目标；P8 catalog、P9 registry、P10 选择/执行/读回代码是三例的元数据与消费者。AC26 原始 decision-log、P6.md、第三例 deferred test 均不在这 61 条里，不能追加。测试通过不等于独立的前后业务效果。
- **仍需独立业务效果或其他 Task 来源**：P5 真报告和人工声明；AC26 当前 Task fact/wrapper/raw 与真实决策记录的独立读回；AC27 官方四类生产者归 CARD05；P11 真实页面/服务/浏览器；P12 真 verify-code 业务抽样；P13 全卡聚合；CARD05 review skill 来源。新 docs/tests/skills 依真实 owner 与消费者处理，不机械扩三例目录，也不从 206 未映射列表删路径。
- 原索引的“当次工作树独有”只是捕获时来源分桶；不等于每条当前仍脏或归 CARD04。整体 `unavailable`、业务 `unknown` 保持。

本审计只读源文件与已有证据；没有运行测试，没有改产品源、材料或 catalog。

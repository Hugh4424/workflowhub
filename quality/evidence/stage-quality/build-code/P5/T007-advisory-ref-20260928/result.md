# P5/T007 advisory 来源候选的数组位置负控

范围：只改 `runtime/stage/stage-end-report.mjs` 和同名测试；未写正式 P5 报告或 Task facts。原源码和测试字节已另存本目录 `before-*`。

- 旧实现：取 `quality_advisories[index]` 对应的 `quality_advisory_fact_refs[index]`。这两组列表不承诺位置对齐：事实列表含通过主题，advisory 列表只含需要披露的主题。
- 负控：两个不同 advisory，仅 `stage-end-spec-analyze:inconsistent` 需要列为没做到；第一份 ref 是 spec-analyze 原件，第二份是别的原件。旧代码错误地输出第二份 ref。测试 RED：`npx vitest run runtime/stage/stage-end-report.test.mjs -t '不同 advisory'`，exit 1，1 failed、55 skipped；原始输出 `red.txt`。
- 修正：按当前 `stage-runner.mjs` 生产顺序，spec-analyze 质量事实总是先加入候选 refs，取第 0 项，不按 advisory 字符串位置索引。该模块仍只转换调用者候选输入，不能自行认证 ref。认证必须由 P5 真实来源 reader 核原件。
- 本文件定向 GREEN：`npx vitest run runtime/stage/stage-end-report.test.mjs`，exit 0，56 passed，原始输出 `green.txt`。
- 相邻来源检查：`npx vitest run tests/contract/p5-same-run-report-source.test.mjs`，exit 0，15 passed、6 skipped，原始输出 `adjacent.txt`。两份 GREEN 输出均有 `WebSocket server error: Port is already in use` 提示，但进程 exit 0 且测试完成；本次不将该提示推断为服务检查通过。
- `node --check runtime/stage/stage-end-report.mjs`，exit 0，空输出 `syntax.txt`。

SHA-256：

| 原件 | 哈希 |
| --- | --- |
| before-stage-end-report.mjs | `367c04f2f5fb6a039f250ecc7e6ad9568457f1529cc4769caebe57e6b902227a` |
| before-stage-end-report.test.mjs | `036cdb5476e98d068f7f7fbb163113e86e1c34dc159761002b367fae40acb08d` |
| 当前 stage-end-report.mjs | `22b27300760d45866ddaec58a38d50650a1b25a2efaa08efa7007eca0ba741c4` |
| 当前 stage-end-report.test.mjs | `3704bce0fb79511deb3b7a9e86d87eab06941a84a93639b3983cb1f3a62557bd` |
| red.txt | `adba5a9ecc59743ded6af73cfbe2c851f58de5c4c766c1da3662ca57b87e2856` |
| green.txt | `7e44f96e07782fb720b8d929d704eb373949d3bae012da85d3625914a90449a0` |
| adjacent.txt | `7ba298f814e08b0524718c46d5d43cec2b4ae852dfd3cc359c126902157be7bf` |
| syntax.txt | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |

界限：此负控故意改变 advisory 的排列来证明转换器不能按两数组相同下标绑定；当前官方生产者若有非通过 spec-analyze，会先追加该 advisory，此特定排列不是已观察到的当前正式运行。P5 真实报告仍未发布，本测试不证明 AC-26 或全相位完成。

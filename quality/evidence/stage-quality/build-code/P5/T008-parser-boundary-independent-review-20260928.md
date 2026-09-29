# P5/T008 声明章节边界修复：独立复核（2026-09-28）

只读检查 `runtime/evidence/freshness.mjs`、`tests/contract/p5-same-run-report-source.test.mjs` 及 `T008-parser-boundary-20260928/` 原始输出；另用 `node --input-type=module` 直接调用当前解析器做最小复现。未改生产代码、测试、材料或 Task facts。本文件不证明 P5 完成。

## 结论

**还有一处同类缺口，机械解析尚不能通过独立复核。** `runtime/evidence/freshness.mjs:1038-1045` 的下一章节识别只匹配行首 `##`/`#`。Markdown 有效的 H2 可缩进 1–3 个空格；空的 `## 人工例外声明` 后若写 ` ## 其它章节`，再于该章节放 JSON，解析器仍返回声明。对 1、2、3 个空格分别直接复现，均返回 `accepted:true`。同理，首个正常声明后追加一个缩进 1 个空格的第二个 `## 人工例外声明` 标题，也没有被计为重复。应把这 1–3 空格的 H2 视作章节边界并拒绝重复声明标题，补针对性负控；不必改变已关闭的正式发布路径。

前次指出的两个**具体**输入已经修好：同一章节放两个 JSON 块、空声明后在无缩进的下一 H2 章节放 JSON，当前代码均拒绝。原始 `red.txt` 中两项在旧解析器上失败（exit 1），`green-focused.txt` 中新两项及旧正例 3/3 通过（exit 0）；`green-target.txt` 15 通过、6 项历史跳过（exit 0），相邻 T007 55 通过。`before-sha256.txt`、`after-sha256.txt` 与当前两个文件哈希相符。这些输出证明定向修复效果，不覆盖上述缩进 H2 输入。

正式 CARD-04 报告仍未发布：`stage-runner.mjs#p5HumanExceptionFromDecisionLog` 固定返回 `null`，读取端即使机械核验成功也固定返回 `missing`。未发现使用 `human-confirmation.v3` 的新路径。六个跳过的正式发布和故障恢复正例仍无真人来源，P5 继续 `missing/not_done`。

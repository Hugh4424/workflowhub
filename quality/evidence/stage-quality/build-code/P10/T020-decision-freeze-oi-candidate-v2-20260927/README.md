# T020 当前 OI 冻结候选 v2

保留 v1 原字节；本目录只放 v2 候选，正式源码、正式测试、材料均未改。独立审查发现 v1 会漏判 CF 当前 open、忽略额外坏围栏，且缺真实 handler 负控；v2 针对这三项修正。

## 补丁和基线

先应用 `tests-first.patch`，保存定向 RED；再应用 `implementation-followup.patch`，保存定向 GREEN。`candidate/` 是应用后的预览副本。两份补丁互不重叠，均对下面当前源码通过 `git apply --check`。

| 当前正式文件 | SHA-256 |
|---|---|
| `tests/contract/decision-freeze-current-oi.test.mjs` | `8901c7a858766d8626524c610a244fae5d7920b743ac6d7c86e18ae26f884d20` |
| `tests/integration/vnext-official-stage-run.test.mjs` | `623f5c19e45b2fff998a174f817e9084eafd1c4e6b94de0c647f3c63e82c74b6` |
| `runtime/stage/stage-content-contracts.mjs` | `653a6f0d516cb7b66c4de0fb081122dbb06354dbaaa51044b1d7666c033d3245` |
| `runtime/stage/stage-handlers.mjs` | `88760292bc8b78d6a13e848fddc5ba9ce1fa4708cd422d404045c8820c21e5c9` |

| 补丁 | SHA-256 |
|---|---|
| `tests-first.patch` | `63a194dad0e230620e61bbf690db6d126fb2c70806b50a8d2219363bc169216b` |
| `implementation-followup.patch` | `7a795b35c7f7b4b70ddfc72eeeb933eab68be3efd9cff13eeff57f4034c51d81` |

四份候选文件各自 `node --check` 均 exit 0；两补丁各自 `git apply --check` 均 exit 0。没有执行 Vitest，不声称 RED/GREEN 或最终实现通过。

## v2 修正

- 当前 OI 节逐行扫描所有 Markdown 围栏。坏 YAML/JSON、不支持的格式、无配对围栏和多余结束围栏都报内容错误；即使四个类别由合法记录凑齐，也不能放行。
- 当前 CF 的状态行优先。明确 `open` 时，用户裁决文字不能覆盖它。无状态行时，只有明确用户批准行、唯一关联 OI 当前为 `confirmed`、落地行指向实际 D 决定、该 D 段也写明此 OI 的显式批准，才认作已处置；不硬编码 CF 编号。
- 真实 handler 负控在已有 `tests/integration/vnext-official-stage-run.test.mjs` 的 `p3ApprovedDecision` 夹具中，于确认发布前附加坏 OI；因此确认和质量事实确实绑定同一份坏材料。检查正式 `build-plan` 返回仍报告内容错误，且不是材料过期误导。

## 应用后的定向检查

1. `git apply quality/evidence/stage-quality/build-code/P10/T020-decision-freeze-oi-candidate-v2-20260927/tests-first.patch`
2. `npx vitest run tests/contract/decision-freeze-current-oi.test.mjs tests/integration/vnext-official-stage-run.test.mjs -t 'current OI|current CF|CF approval|authenticated freeze'`，保留原始 RED；若 `-t` 范围筛不到测试，应按文件单跑，不把 0 个测试当通过。
3. `git apply quality/evidence/stage-quality/build-code/P10/T020-decision-freeze-oi-candidate-v2-20260927/implementation-followup.patch`
4. `npx vitest run tests/contract/decision-freeze-current-oi.test.mjs tests/contract/freeze-classification-budget-usage-protocol.test.mjs tests/integration/vnext-official-stage-run.test.mjs`，保留定向 GREEN。

## 剩余风险

- 真实 handler 负控尚未运行；其夹具可能在到达决策冻结检查前触发其他合同，须根据真实 RED/GREEN 修正，不能仅凭语法和补丁检查宣称通过。
- 无状态 CF 的特例依赖现有归档中“用户裁决”“本修复的落地”“D 决定”的文字格式。未来格式变动应明确失败，不能退回全文关键词。
- 应用正式源码后旧快照回执会过期；CARD04 的 206 处变更映射和真实业务效果仍需单独完成。

# P7 相位交接：机器判定值与上游来源模板

T015 在 `acceptance-evidence-validator`、`freshness`、`quality-store` 的限定写面实现八个 `acceptance.result` 值；四个新增机器类投影为 `incomplete`，原 `deferred` 非通过语义保留。[T015 原件](/Users/Hugh/Hugh/Project/workflowhub-workflowhub-thin-core-card-04-20260919/quality/evidence/stage-quality/build-code/P7/T015-summary.md)记录 RED 13 fail/30 pass → GREEN 43/43、直接消费者负控、语法检查与 `test-routing-advisor` 的 feature 路由。T016 在模板和两份技能中加入 U/R/V 来源节；[RED](/Users/Hugh/Hugh/Project/workflowhub-workflowhub-thin-core-card-04-20260919/quality/evidence/stage-quality/build-code/P7/T016-red.txt)为 5 fail/8 pass，[GREEN](/Users/Hugh/Hugh/Project/workflowhub-workflowhub-thin-core-card-04-20260919/quality/evidence/stage-quality/build-code/P7/T016-green.txt)为 13/13；[模板解析探针](/Users/Hugh/Hugh/Project/workflowhub-workflowhub-thin-core-card-04-20260919/quality/evidence/stage-quality/build-code/P7/T016-template-parser-probe.txt)检查 U/R/V 行形态。局部代码与文档实现已有可回读原件，但尚无按新模板实际生成并认证的独立 decision-log 实例。

[官方 P7 测试 receipt](/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-thin-core-card-04-20260919/quality/tests/card04-P7-L0-current-20260926.json) SHA256 `5762b8490af0df498dbf5a7d23941fe30216556397af92ad072713af973cd812`：四文件定向命令、56/56、exit 0、`snapshot_tree=35b6bf495faa51c3394b7c032c6170354868fbff`、`source_digest=bd2f6e9bb16083c8e7aeb3b9e53800b74086c818a2e80f6dedf94137bd37104d`；[原始输出](/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-thin-core-card-04-20260919/quality/tests/output/card04-P7-L0-current-20260926.output) SHA256 `ebe2acf72b1dc1723f57a9ba90efc4335d04c01bc957ef81100d0c940a75ea37`。这份 receipt 是 P7 定向测试事实，不是整卡验收。

[正式 P7 OCR result](/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-thin-core-card-04-20260919/quality/reviews/results/build-code-simple-9fa24202-246a-5c83-a92a-45d4f3bfb1ee.json) SHA256 `1bfdde9df9e58eccc8812bca3f553a759cdc39cd8cb29b0c926db85b980ff9a8`，两路 provider 实际派发，绑定同一 P7 快照，10 条 finding。此前 attempt `3cf5854b-2d38-5934-aff2-7efa815649cb` 在派发前因旧 receipt 漂移而失败，不作为审查事实。[逐条处置表](/Users/Hugh/Hugh/Project/workflowhub-workflowhub-thin-core-card-04-20260919/quality/evidence/stage-quality/build-code/P7/finding-dispositions-20260926.json)为 `rejected_invalid=2`、`needs_human=8`，无 `fixed`、无 `accepted_risk`；独立复核没有发现 T016 直接 finding。

| Finding | 处置 | 归属与最小事实 |
| --- | --- | --- |
| F-5275d869291f | `rejected_invalid` | `deferred + missing` 是非通过 leaf 的认证，既有 deferred 回归要求保留，不等于 N/A 或 passed。 |
| F-1b36d85ed31c | `rejected_invalid` | 用 P7 测试摘要要求覆盖 P5/P10 是跨相位误归；其它相位结果仍各自负责。 |
| F-f21071be7712、F-96d91b1247ef | `needs_human` | P5/T008 缺可信逐 AC 输入与正式阶段接线；受保护写面需明确 owner。 |
| F-6cfc528e34cf | `needs_human` | P10 固定可信选测入口、canonical receipt 和逐例对账未接通。 |
| F-9a7290a836e8、F-34bf732e3a6b | `needs_human` | P6 冻结 oracle 测试缺 override 的仓库外负控，默认路径依赖宿主布局。 |
| F-b5eb33573ad9 | `needs_human` | P2 冻结复杂度断言写死 `within_limit=false`，材料/测试 owner 决定修订。 |
| F-c1e5a46f19ab | `needs_human` | 缺 `phases/index.md` 时 run 返回原始 ENOENT，需指定 runtime/preflight owner。 |
| F-054c7ebba015 | `needs_human` | P13 聚合测试的外置 Task 路径依赖当前宿主布局。 |

**未完成边界：** AC-27 的历史 123 条记录及逐字 SHA 基线不可用；CARD-05 生产者未证明会发射新增机器类，quality-store 也未证明是 vNext 当前 writer。AC-28 的真实模板产物和来源绑定仍缺。当前 P7 物理卡片对 RED/GREEN 可读性的文字已落后于上述原件，需材料 owner 按当前版本更正。P7 OCR/receipt 绑定文档修正前的快照；本次后续 P9 文档改动不由它们认证。P7 局部实现及检查完成，**AC-27/28 与全相位质量完成仍为 incomplete**；不写 build-code stage 完成事实，也不据此宣称 CARD-04 通过。

历史来源补查：[A1 设计报告](/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-thin-core-card-04-20260919/quality/reviews/a1-acceptance-enum-design-20260923.md) SHA256 `169800ed9f24568533d4aed95bd2c997355f6debb116927d7063870dcd95f96e` 记录当时 123 条（pass 94、deferred 29）的聚合统计，但未保存逐文件 path→SHA256 清单或不可变快照引用。当前同一 Task store 为 172 条（pass 132、deferred 40）；现存内容寻址哈希自洽不等于能识别并逐字对比旧 123 条。故“设计报告存在”和“历史字节基线不可用”须同时保留，AC-27 历史兼容仍为 `unknown/G2`。

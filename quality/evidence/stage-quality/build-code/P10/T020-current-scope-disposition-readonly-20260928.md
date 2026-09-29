# P10 当次 217 条改动的只读分流（未执行选例）

## 当次事实

输入为 `P10/T020-current-selection-readonly-20260928/{summary.md,summary.json,raw.json}`，Task `workflowhub-thin-core-card-04-20260919`，树 `4381e90d43a7072ba12d1a4359ba757c3ddd5786`，材料版本 `revision-30e50b760cb29e92f9b114a9be6db6105647a76b7c3c8caeb15a4a949a4975b6`。P8 目录三例的真实来源 hash 与当前字节相符，但 P10 选择只命中 9/217 路径，剩余 208；返回 `unavailable/unmapped_changed_path`，`test_execution_status=not_run`。该结果只是选例读回，非测试或业务通过。

精确分布：CARD05 归档材料 51/51 未对应；CARD04 当前材料 16 中 3 对应、13 未对应；`runtime/**` 22 中 6 对应、16 未对应；`tests/**` 74、`skills/**` 21、`workflows/**` 15、`docs/**` 11、`tools/**` 3、`core/**` 1、根文件 3 均未对应。当前变更范围含 **0 个 `quality/**` 任务证据路径**；质量原件不能解释 208。Git 差分为 122 新增、92 已有文件修改、1 个重命名（旧新两个路径）、1 个删除，共 217 个路径；`tests/**` 中 37 个新增、37 个已有文件修改。新增和旧文件都可能有真实消费者，不能按新旧自动判别。

| 性质 | 精确数量与例子 | 当前处理 |
| --- | --- | --- |
| 可执行产品代码 | 32 个非测试 `.mjs`：`runtime/**` 18、`workflows/**` 7、`tools/**` 3、`skills/wh-review/scripts/**` 3、`core/**` 1；其中 6 个 runtime 已命中三例，**26 个仍未对应**。 | 先查实际入口和消费者，按共同功能组补规则/目标；没有逐个 owner 证明，26 个均不能排除。CARD04 本树直接实施的 `workflows/build-code/{capture,case-reconciliation,case-selection,change-scope,targeted-capture,targeted-runner,test-asset-inventory}.mjs` 7 个和 `runtime/stage/{stage-context,stage-end-report}.mjs` 2 个尤其须入 P9/P10/P3/P5 真实行为核查。 |
| 测试资产 | `tests/**` 74，加 `runtime/stage/*.test.mjs` 2、`skills/wh-review/scripts/__tests__/*.test.mjs` 2，共 **78**；`vitest.config.mjs` 另属测试配置。 | 由测试资产 owner 查真实 runner 身份、目标范围及旧回归；不为每个测试文件虚构业务 case，也不因它是测试就自动排除。P9 独立 registry 目前仅三目标，其他库存明示 `unknown`。 |
| Task 材料 | CARD04 当前 16（3 对应、13 未对应），CARD05 归档 51；合计 **67**。 | 当前材料经材料版本/阶段内容门核；CARD05 归档只读保留，但 `tests/contract/post-spec-analyze-original-source.test.mjs:5` 实际读取该归档，需 CARD05 owner 明确消费与回归，再决定是否可从 CARD04 业务选例排除。 |
| 其他有消费者的输入 | docs 11（含业务目录/独立测试 registry）、技能非脚本 16、工作流技能/配置 8、根文件 `AGENTS.md`/`CONTEXT.md` 2、生产 schema 2、测试配置 1。 | 按读取者分为材料、运行配置、测试配置或文档验收；文件后缀不构成不适用证据。 |

以上划分互斥，合计 217。`quality/**` 路径为 0，未混入分母。

## 当前合同与最小补救

P8 明确只有三项有源种子，其他旧业务 `unknown`；P9 的 registry 只登记三项目标；`workflows/build-code/case-selection.mjs:110-143` 的当前合同对任一未对应路径保留原路径并使**整体** `unavailable`。因此三例可以作为有限候选继续核，不能宣布全卡自动选测完成。当前没有经证实可直接排除的 208 中任一项，也不应机械为每路径造一个用例。

最先补 CARD04 当前实现的共同消费者：P9/P10 七个 build-code 模块作为一组，走真实 Task 起点→当前树→目录/独立库存→现有 `verify` 固定入口→真实测试叶/原始输出/回执→逐例业务效果；P3 `stage-context.mjs` 核 Task/工作树错绑，P5 `stage-end-report.mjs` 核同次报告和缺源。首组负控至少保留一个有实际消费者但未登记的变更路径，确认三例即使运行，整体仍 `unavailable` 且原路径未消失；错 Task/旧树、漏叶/跳过/0 项也不能通过。再由 CARD05 owner 对 51 个归档和其余共享代码/技能/测试逐路径或同一不可变消费组给出实际消费者、归属、现有回归与排除理由；生产 review/stage/task/CLI 路径不得整桶判无关。所有排除如需实现，须另经审查改变选例合同，保留原始 217 差分与 208 未对应记录和反例；当前不改 selector、目录、registry、材料或 Task facts。

本备忘录仅核已有原件和源码，不运行测试，不产生质量结论。

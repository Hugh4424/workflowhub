# T020 current OI freeze 只读设计（2026-09-27）

## 已核事实

- 归档路径改正后的限定测试为 `1 failed / 19 passed`；唯一失败是 `decision-freeze-current-oi.test.mjs:20`：期望四类覆盖，实际缺 `data_states`。原始输出：`P10/T020-card05-stale-path-fix-20260927/after/stderr.raw.txt`。本分析未运行测试。
- `decisionFreezeModel`（`runtime/stage/stage-content-contracts.mjs:523-581`）在没有 `### M6` 时把**整份** Markdown 当成旧式文字冻结包，按“数据状态”等关键词找覆盖，并从整份文字搜 `方向/open`。CARD-05 的当前权威是 `decision-log.md:109-867` 的 `### OI 记录（解析器权威记录，YAML）`，其中 `data_state` 有记录；整份文档还有旧台账、旧未决叙述及别处 YAML，不能用整篇关键词或整篇 fenced YAML 判当前状态。
- `parseOiYamlBlocks`（`stage-content-contracts.mjs:3232`）已能解析 fenced YAML/JSON OI；`analyzeDecisionOutline`（`:3354`）用它读 OI，但目前喂的是全文。CARD-05 当前 OI 节在下一个 `## 需求变更记录` 处结束，后文 `### Grill 结束记录` 另有 YAML，历史层还多次写过 `open`。
- `currentDecisionFreeze`（`runtime/stage/stage-handlers.mjs:156-186`）先读文本，再在有认证来源时重建对象，只传递 `coverage` 与“方向未决”这一种错误。因此任何新增的 OI 解析错误若不随重建传下去，正式 build-spec/build-plan 仍可能被误判通过。
- 邻近 `freeze-classification-budget-usage-protocol.test.mjs:179-225` 的对象输入和 `### M6` 文字样例要求保留；对象路径已有三方确认、版本绑定与续签检查，不应因 CARD-05 的 YAML 修复改口径。CARD-05 的 CF 段（`decision-log.md:2598+`）在最终更新与各 CF 状态行写明 CF-1..9 均已裁决；旧句“仍未决”保留为历史。合成测试要求显式 `**状态（当前）** | open` 的 CF 仍算未决。

## 最小安全实现建议

1. 在 `stage-content-contracts.mjs` 增一个内部只读投影，先按 Markdown 标题层级截出**唯一当前** `### OI 记录（解析器权威记录，YAML）` 的正文，仅把这一段交给现有 `parseOiYamlBlocks`。标题存在但无合法记录、重复 OI ID、缺/非法 `category` 或 `status`、解析失败时产生明确错误；**不得回退到全文关键词或历史 YAML**。可复用 `markdownSectionBody` 的标题切段思路，但该 helper 当前选“最后同名节”，须拒同名重复权威节，不能让尾部伪节覆盖当前节。
2. 只以当前 YAML 记录映射冻结包四类：`complete_user_flow → user_flow`，`data_state → data_states`，`success_failure_boundary → success_failure_boundaries`，`non_goals → non_goals`。保持 `FREEZE_PACKET_COVERAGE` 输出顺序；`page_scope`、`deferred` 不映射。当前 OI `status: open` 或非法状态使冻结保持暂停；`confirmed/deferred/not_applicable` 是终局状态，但不要把 `deferred` 误称已实现。OI YAML 只证明方向包覆盖与当前未知项状态，**不代替**三方批准、材料身份、快照及 `analyzeDecisionOutline` 的终局字段检验。
3. CF 单独按 `## 独立替代审查发现的未决冲突（须用户裁决）` 下单条 `###/#### CF-N` 的**当前状态行**判断，接受 `状态（当前）`、`状态（…用户裁决）` 等明确当前行；`open/未决` 或缺当前状态不得当已闭合，`RESOLVED by D-*` 才按已裁决。忽略 “CF-1 – CF-9” 分组标题、旧处置列、引文及“原表述逐字保留”的历史句。合成的 CF-1 当前 `open` 必须继续产生 `direction-level questions remain unresolved`。若不愿在本补丁实现可靠 CF 结构读取，至少不能把历史关键词扫全篇的当前行为解释为可信未决判定；须把该缺口保留为失败，不能假绿。
4. 在 `validateDecisionFreeze` 将 OI/CF 投影中的格式错误作为独立失败传出；`stage-handlers.mjs#currentDecisionFreeze` 用认证来源重建时须保留这些**内容失败**，否则正式消费者绕过。输入为对象时不走新 Markdown 解析。没有当前 OI 权威节时继续旧 `### M6` 冻结包路径；只是出现其他 YAML fence 不触发新路径；有当前权威节时禁止混用旧包补类别。

## 必补负控与限定检查

- 在 `decision-freeze-current-oi.test.mjs` 加：当前 YAML 删除 `data_state`，而历史正文/历史 fenced YAML 仍含 `data_state`，必须报缺 `data_states`；当前 YAML 改 `status: open` 而历史写已裁决，必须报方向未决；当前 YAML 缺失/重复/非法时不得借历史或 M6 假绿；当前 CF 为 open 与历史 resolved 冲突时仍未决；归档 CARD-05 仍须四类覆盖且无方向未决，但**三方批准缺失使整体 `ok:false`**。
- 保留并精确跑 `tests/contract/freeze-classification-budget-usage-protocol.test.mjs` 的对象与 M6 文字负控；另给 `currentDecisionFreeze` 的真实调用加一条“认证三方来源齐全、当前 YAML 无效仍暂停”的定向负控，确保内容错误不会在重建时丢失。
- 最小受影响生产文件：`runtime/stage/stage-content-contracts.mjs`、`runtime/stage/stage-handlers.mjs`；测试：`tests/contract/decision-freeze-current-oi.test.mjs`、`tests/contract/freeze-classification-budget-usage-protocol.test.mjs`，以及承接正式 handler 的已有定向测试文件。不要修改 CARD-05 归档材料。上述生产改动超出 P10 卡面当前“只修两处测试路径”的窄写集，实施前须在当前材料明确扩写面并经独立审查；如改动代码快照，旧测试回执与 stage 事实不能充作新快照通过证据。

## 契约分界

这次失败暴露的是两种输入不能混为一谈：旧 `M6` 是自由文字冻结包，只在该小节取关键词；CARD-05 声明了结构化 YAML OI 为当前权威，就只能从该节实际记录取类别和 `open` 状态。两种路径都必须继续核三方批准与当前身份；“类别齐全”不是“已经批准”，更不是功能已经实施。

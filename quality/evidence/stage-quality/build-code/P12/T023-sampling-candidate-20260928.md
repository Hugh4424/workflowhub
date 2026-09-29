# P12/T023 独立业务抽样候选事实表（2026-09-28）

**状态：候选，尚未抽查。** 这里只给未参与实现的后续审查者划定可核的样本与缺口；已完成独立语义抽查数为 **0**，已取得授权业务验收答复数为 **0**。下文的“拟优先抽”不是已抽查，更不是业务通过。只盘点当前目录中的 3 条正式 case 和 7 条尚未确认为 case 的义务；这 10 项不是全项目业务需求全集，旧业务未盘点仍是 `unknown`。

## 本次读取身份与来源

- 认证工作目录 `/Users/Hugh/Hugh/Project/workflowhub-workflowhub-thin-core-card-04-20260919`；分支 `task/workflowhub/workflowhub-thin-core-card-04-20260919`；HEAD `ef920f1fbd415fe87d50930359059b661e141acd`。
- 本次只读 `stage-runtime status --action=begin --stage=build-code --project=workflowhub --task=workflowhub-thin-core-card-04-20260919` 返回材料版本 `revision-30e50b760cb29e92f9b114a9be6db6105647a76b7c3c8caeb15a4a949a4975b6`，当前快照 `4381e90d43a7072ba12d1a4359ba757c3ddd5786`，阶段结果 `partial`、已完成次数 0。身份仅代表读取时刻；后续文件变化须重新认证。
- 当前业务案例表 `docs/quality/business-case-catalog.json`，表内版本 `2026-09-28.card04-current-source-rebind.11`，SHA-256 `a16fd876ad2935fd812835c56f863a4b91bd33ac4f618b3edca32d5d763a32d9`。3 条 case 的源文件与规则文件 SHA 与表内登记相等：当前 `decision-log.md`=`01a9cb30...b40`、`P6.md`=`5d146122...aa6b`、`P7.md`=`d8e15fd0...097`。这只认证规则字节，不认证运行结果。
- 外置 Task 根目录：`/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-thin-core-card-04-20260919/`。最新逐例测试的外层正式回执 `quality/tests/targeted/be3c2242-a877-4b1c-a5eb-e527428a2d41.json`，SHA-256 `9cdb2abbb57570d032ed249a21b5471c4b33c69b1f5e3c6b6548c5b63e13c2a5`，exit 0；其快照 `870b92175454f8b7691149b8eb672c12d8814665` **不等于**本次当前快照。旧外层 exit 0 不能推出当前代码或业务效果通过。
- 外置 `facts.jsonl`，SHA-256 `4ba4ddbf38c6f480ea29be0dbab7705c031d38cce58bd9b5afe2328d2d7402a6`；其中 build-code 阶段行快照更早，为 `a8ba4bcc...`、`partial/incomplete`。旧 `AC-26`、`AC-27`、`AC-30`、`AC-32`、`AC-33`、`AC-34` 质量事实均为 `missing`，绑定 `a8ba4bcc...`。它们不能补出当前效果。正式 `verify-code` 阶段行及其真人业务验收答复均未见。

## 三条有来源的 case

| case / AC | 原规则与当前真实消费者、测试入口 | 当前证据状态 | 候选处置及理由 |
| --- | --- | --- | --- |
| `CARD04-DECISION-LOG-CENSUS` / `AC-26` | `P6.md` 的 `CARD-04-RULING-P6-FULL-EXEC / FR-26`：当前原始需求 U/V 分母非零、解析无错、R-001..R-008 可索引；`runtime/stage/stage-content-contracts.mjs#deriveDecisionLogOriginalSourceCensus`；`tests/contract/decision-log-census.test.mjs`。 | 旧逐例原件 `quality/evidence/build-code-targeted/case-96a5f2c6d06c9dfc62e4a6f07d13d3d2332babe1c366869a3ff21caa739aeb9f.json`（SHA 同文件名）有 6/6 测试叶通过，但叶标为 `canonical_receipt:false`、快照 `870b...`。外层正式回执见上；旧 AC-26 事实为 `missing`。表内 `effect_observation.observation_status=not_yet_observed`、独立读取器 `not_implemented`。 | **拟优先抽，不算已抽。** 覆盖原始需求分母“代码绿但业务覆盖虚高”的风险。当前可核规则/解析器/负例设计；要判真实业务效果，还缺当前快照的逐例原件、独立读取原始 U/V/R 与本 Task AC-26 事实对照。P10 补齐前 `business_effect=unknown`。 |
| `CARD04-ACCEPTANCE-MACHINE-CLASSES` / `AC-27` | `spec.md` FR-27、Appendix AC-27 与 `P7.md` 的 `CARD-04-RULING-A1-TRUTH`：四类 `missing/inconsistent/incomplete/unavailable` 可被验收事实校验器接受，非法值的拒绝消息列全允许值，存储层映为 `incomplete` 而非 `passed`；`quality-fact.v1.status` 保持三值、旧 `acceptance-evidence.v1` 字节不变。真实消费者为 `runtime/evidence/acceptance-evidence-validator.mjs`、`freshness.mjs`、`quality-store.mjs`；测试入口 `tests/contract/acceptance-result-machine-classes.test.mjs`。 | 旧逐例原件 `quality/evidence/build-code-targeted/case-7b24e26e9a613d3d6d2a02273ac6f1f3533a69b66aa7aac80f35870573c0d9c8.json` 有 28/28 叶通过、`canonical_receipt:false`、旧快照。表内 `capability_scope=helper_validator_only`、效果 `not_yet_observed`；旧 AC-27 事实仍 `missing`。 | **拟优先抽，不算已抽。** 独立核对四值经真实导出/校验/存储消费者的处置、非法值拒绝、旧记录逐字复现和质量事实三值限制；重点找“未知被判通过”与旧字节变化的反例。旧快照及缺少独立效果读回仍使 `business_effect=unknown`。**当前阶段 writer 是否实际发出四类是另一个待核风险，不是 AC-27 的通过前置。** |
| `CARD04-DEFERRED-ACCEPTANCE-REGRESSION` / `AC-27` | 同一 `P7.md` 规则的旧行为保护：已有 `missing→deferred`、非法状态拒绝、非终态不算通过；AC-27 另要求旧验收记录字节不变。`runtime/stage/stage-runner.mjs#acceptanceResultForSubjectStatus`、`stage-handlers.mjs#classifyAcceptanceEvidenceResult`、`freshness.mjs#authenticateQualityFactRecord`；`tests/deferred-acceptance-semantics.test.mjs`。 | 旧逐例原件 `quality/evidence/build-code-targeted/case-b2e83b8c76a353fa0f46e560bdfb795afe54ff9eca3dbb8ee3617fcbe1567d45.json` 有 15/15 叶通过、`canonical_receipt:false`、旧快照。表内效果仍 `not_yet_observed`，独立读取器 `not_implemented`；旧 AC-27 事实 `missing`。 | **本轮候选暂不单独抽，仍列为未抽。** 与上一条共用 AC-27；本项的 15 个旧断言是回归线索，不能自动证明旧 `acceptance-evidence.v1` 字节逐字兼容。优先样本须核此旧字节要求；若其原件不足，再将本项加抽。未抽即没有独立复核旧 deferred 回归。 |

上述旧逐例原件分别含原始 reporter 引用，外层正式回执保留命令、stdout 引用及 hash；然而三个案例的 `effect_observation` 都为 `not_yet_observed`。6+28+15 叶通过只说明旧快照下这些自动断言通过，不能推出跨代码版本的真实业务效果。P10 当前工作目录盘点还未把全部改动映射到业务案例；其 [范围记录](../P10/T020-current-worktree-scope-addendum-20260928/summary.md) 提醒旧“206 未映射”分母也不能沿用。

## 七条尚未确认为 case 的义务：全部未抽

这些条目都来自当前案例表 `evolution.phase_obligations`，`case_id=null`、`status=not_done`、`business_rule_status=unknown`。下表的测试目标是代码检查入口，**不是**真实业务案例或效果证据。没有可认证规则和案例编号，不能假装已完成独立语义抽查。

| Phase / Task / AC | 现有消费者、测试入口 | 未抽理由与恢复所需 |
| --- | --- | --- |
| `P9/T018 / AC-32` | `workflows/build-code/capture.mjs`；`tests/contract/build-code-change-scope.test.mjs` | 当前变更范围尚未绑定真实业务 case；先认证任务起点、规则版本、真实调用和正反观察。owner：P9/T018。 |
| `P9/T019 / AC-30` | `workflows/build-code/capture.mjs`；`tests/contract/build-code-test-inventory.test.mjs` | 测试身份库存与案例表的双向可运行编号尚未以真实业务源认证；先补规则和消费者关系。owner：P9/T019。 |
| `P10/T020 / AC-32`（选例） | `workflows/build-code/case-selection.mjs`；`tests/contract/build-code-case-selection.test.mjs` | 变更到案例的真实调用、过期或未匹配处理尚未完成当前快照核对。owner：P10/T020。 |
| `P10/T020 / AC-32`（执行） | `workflows/build-code/targeted-runner.mjs`；`tests/contract/build-code-targeted-runner.test.mjs` | 案例目标虽有旧逐例测试，当前任务快照下的真实执行与完整关联未证明。owner：P10/T020。 |
| `P10/T021 / AC-33` | `workflows/build-code/case-reconciliation.mjs`；`tests/contract/build-code-case-reconciliation.test.mjs` | 逐例结果与业务效果双向对账未证明；局部旧夹具的绿灯不等于真实效果。owner：P10/T021。 |
| `P11/T022 / AC-32` | `runtime/stage/stage-content-contracts.mjs`；`tests/contract/post-business-browser-reconciliation.test.mjs` | 真实页面/API 服务入口及浏览器结果未认证，夹具不能代替。UI 若受阻记 `unknown/unavailable`，不能写 N/A 或通过。owner：P11/T022。 |
| `P12/T023 / AC-34` | `workflows/verify-code/SKILL.md`；`tests/contract/verify-code-business-handoff.test.mjs` | 目前 `consumer_status=test_only`：文本合同有旧正式回执 3/3，却没有本 Task 真实抽样消费、独立审查或授权者回复。owner：P12/T023。 |

## 给后续独立审查者的最小交接

1. P10 先在稳定当前快照补可信变更范围、逐 case/AC 自动执行与原始结果、未测原因及真实效果独立读取；旧 `870b...` 回执与当前 `4381...` 必须分开。P10 的测试成功不能自行升为业务通过。
2. 独立于实现者，从上述两个“拟优先抽”案例开始，把当前规则版本→案例/AC→真实消费者→测试断言→实际效果/反例逐项核对，分别记录 `business_effect`、测试语义是否足够、代码审查结果；其中 AC-27 按原要求核四值校验与映射、非法值拒绝、旧记录逐字兼容，不要求阶段 writer 已实际发出四值。明确列 1 条未抽 case 与 7 条未确认义务，以及旧业务库存 `unknown`。若旧字节兼容在优先样本中仍无原件，应加抽旧 deferred 回归案例；发现更高风险或新真实 case 时按事实调整样本并保留理由。
3. 若 P11 有真实 UI 消费者，待真实页面/API、权限、数据、正向及拒绝/恢复浏览器证据；缺失继续 `unknown/unavailable`。机器检查与独立审查之后，才通过现有 verify-code 最后确认向授权业务验收者提交可操作步骤并记录其本人答复。这里没有请求、模拟或代答确认。

**本表结论：**候选优先 2 条，暂未选 1 条，7 条未确认义务均未抽；已实际抽查 0 条，真实业务通过 0 条，授权验收答复 0 条。这些“0”是本表审计范围内的可见事实，不是对全项目历史的断言。

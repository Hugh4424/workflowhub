# P10/T021 三个业务案例的真实入口与效果（只读调查，2026-09-28）

结论：三个目录案例都有来源和定向测试身份，但当前均没有可直接填写到 `acceptance_data`、从官方 `run` 跑完并独立认证业务效果的现成入口。`docs/quality/business-case-catalog.json` 当前修订 `.12`，三例的 `effect_observation.observation_status` 都是 `not_yet_observed`；其 source/rule SHA 与本次实读的 decision-log、P6、P7 字节相符。这是方案输入，不是 P10 或 AC 通过记录。没有发现这些案例的真实 Web 页面或网络服务；本页只建议本地 command/service 路径，不伪造 UI/服务身份。

| 目录案例及原归属 | 已有真实产品入口与输入 | 应独立看到的成功、失败和恢复 | 当前不能声称的结果；最小缺件 |
| --- | --- | --- | --- |
| `CARD04-DECISION-LOG-CENSUS`；P6/T009，AC-26 | `runtime/stage/stage-content-contracts.mjs#deriveDecisionLogOriginalSourceCensus` 读当前 `decision-log.md`；正式 build-code 的阶段末分析经 `runtime/stage/stage-runner.mjs#currentPostBuildCodeSpecAnalyze` 调用它，CLI 入口是 `tools/cli/stage-runtime.mjs` 的官方 `run`。六条 Vitest 叶只是限定测试。 | 独立从认证工作树原文按节读取 U/V/R：三节俱全、U/V 分母至少 8、R-001..R-008 均在、无丢失诊断；内存删掉整节后报出具体缺节，恢复原文字节后重新识别。R 行只算索引，不涨 U/V 分母。另须读本次阶段末报告与 AC-26 原始事实，证明确有诊断和机器状态词，不能只见 parser 返回值。 | `case-reconciliation.mjs#independentlyReadCensus` 已有独立结构读取雏形，但它不是正式验收场景输出者；当前 AC-26 wrapper 曾为 `deferred`/事实 `missing`，不能据结构正确写整项 AC-26 pass。需要由 P6 owner 审定独立规则与受控 command/service 适配器，从认证材料及本次事实读出正负原件；P6/T012、T013 的诊断/报告链也须单独纳入 AC-26 判据。 |
| `CARD04-ACCEPTANCE-MACHINE-CLASSES`；P7/T015，AC-27 | `runtime/evidence/acceptance-evidence-validator.mjs#validateAcceptanceEvidence`、`runtime/evidence/quality-store.mjs#validateVerifyLeaves`、`runtime/evidence/freshness.mjs#authenticateQualityFactRecord` 的真实导出可由本地 Node 调用。现有 28 条测试是 helper/validator 断言；`validateVerifyLeaves` 未查到当前 vNext 生产 caller。 | 用同一受控输入分别给 4 个机器类别，校验器接受，quality-store 判 `incomplete` 而非 `passed`；给 `timed_out` 等非法值必须拒绝且列出允许值；读回旧验收事实的原始字节/哈希，证明未改写。修正输入后重读，旧失败事实保留。 | FR-27 只要求四类**可表达**，不要求正式阶段 writer 真写出四类。目录已写 `producer_status=not_implemented`、`capability_scope=helper_validator_only`，不能把 helper 绿升成正式生产通过。现有三个导出不直接返回正式验收要求的逐 AC JSON；须有 P7 owner 审定的受控调用适配器、独立结果读取、旧字节逐文件基线/可认证现存候选和失败原件。旧 123 条汇总不是逐文件冻结基线。 |
| `CARD04-DEFERRED-ACCEPTANCE-REGRESSION`；P7/T015，AC-27 | `runtime/stage/stage-runner.mjs#acceptanceResultForSubjectStatus`、`runtime/stage/stage-handlers.mjs#classifyAcceptanceEvidenceResult`、`runtime/evidence/freshness.mjs#authenticateQualityFactRecord`。现有 `tests/deferred-acceptance-semantics.test.mjs` 是旧语义回归目标。 | 对已列状态保留明确映射，其中 `missing → deferred`；未知 `timed_out` 必须拒绝；`inconclusive/deferred` 经现有质量读取仍不算 passed。真正缺一项时本次原始 wrapper 应为 `deferred`，对应 fact 不声称通过；恢复为有证据状态后另发新事实，旧事实原字节仍可读。 | 旧阶段的 deferred 记录只能作历史基线，不能冒充当前 CARD-04 运行效果。当前 `readCurrentEffect` 能查 wrapper/fact，但尚无本次正式场景生产和固定 P10 receipt 绑定。需 P7 owner 指定当前 Task 的缺项输入和受控 command/service 适配器，再由独立 TaskHandle reader 核本次事实、旧记录、恢复后的新记录。此回归与上一行共用 AC-27；两场景都有效才可称该 AC 覆盖。 |

## 一张正式验收任务卡该怎样映射

当前 post 解析器 `projectPostPhaseAcceptanceExecutionData` 要求恰好一张 `acceptance_role=acceptance` 且有非空 `acceptance_data` 的 Task 卡；它把该卡 `Source / FR / AC` 中**全部 AC**复制给每个场景，场景又拒绝独立 AC 字段。因此现在把三例直接放在 P10/T021，并把 AC-26/27 写进该卡，会错误地要求每个场景同时产出两项 AC。T021 原有 `Source / FR / AC` 是 AC-33，不能为容纳三例而悄悄删掉；若同一任务卡还保留 AC-33，就必须有真实 AC-33 跨案例/失败后复测场景，不能让三例冒充它。

建议先由 build-plan owner 精确扩展场景字段 `acceptance_criterion_ids`，仅允许从该卡明示 AC 中取非空、去重子集，再核 `sample` 与目录 `ac_ids` 一致。三例应分别是 `["AC-26"]`、`["AC-27"]`、`["AC-27"]`；AC-33 另有自己的跨任务场景。`source` 写规则材料路径与版本，`sample` 写稳定 case ID，`scenario` 写具体输入/正反判据，`tier` 只在真实受控 `command`/`service` 适配器存在后填写，`execution` 写固定命令或真实工作树相对模块/导出/输入与超时。不要把 `npx vitest ...`、测试标题、假的服务地址或 `unknown` 当业务效果入口填上。

现有 `deriveAcceptanceExecutionAssertions` 要求子进程输出 `{entries:[...]}`、每个声明 AC 恰一行、每行含非空 assertions 的 `expected/actual`；它只比较子进程给出的值，**不会自动独立读取业务结果**。受控适配器需采原始 before/after 和失败/恢复结果，再由 P10 的另一读取路径核身份、实际材料/事实与哈希；不能让同一脚本同时自报预期和实际后直接签通过。正式 `run` 的逐 AC 原件还缺本次 P10 固定测试 receipt 的 ref/hash；本次 `run` 消费哪份 receipt 的唯一来源原件/locator 也尚未完成。两者缺任一项，三个案例的正式业务效果仍为 `unknown`。

## 最小可执行顺序

1. 先补场景→AC 显式映射与真受控适配器；每例准备正常、删节/非法值/缺事实反例、恢复输入，以及原始输出和清理证明。适配器必须使用当前工作树真实导出/材料/TaskHandle，不取测试内伪造对象当产品事实。
2. 用官方 `verify` 的固定 P10 测试回执作“已真实执行”的来源，重读原始 reporter 每一条叶；用官方 `run` 的本次消费原件证明“这次阶段记录实际用了哪份回执”。同树旧回执、错材料/目录/库存版本、缺叶/skip/额外叶、坏 hash 均保留 unknown/failed。
3. 正式验收场景各自发布本次 AC 原件；独立 reader 再核三例业务结果与同一固定回执。AC-27 要求两例均有效；AC-26 除普查外还须阶段末诊断和报告消费者；AC-33 另核跨 Task 旅程、失败旧原件和修复后新快照回执。之后才能分别判业务效果，不以 P8 目录测试或 P10 runner 退出 0 代替。

来源：`docs/quality/business-case-catalog.json` 三 case；`spec.md` FR-26/27、FR-33 与 AC-26/27；`decision-log.md` D-013；`phases/P8.md` L0 和 T017；`phases/P10.md` T020/T021；`runtime/stage/stage-content-contracts.mjs:8160-8219`、`runtime/stage/stage-runner.mjs:2819-2906`、`runtime/evidence/canonical-evidence-validators.mjs:107-145`、`workflows/build-code/case-reconciliation.mjs:214-375`；`P10/T021-ac-receipt-spec-clarify-proposal-20260928.md`。本页未修改材料、代码或 Task facts，未执行测试，也不是独立质量裁决。

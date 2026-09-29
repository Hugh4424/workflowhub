# P6/T012：AC-26 当前生产链缺口（只读，2026-09-28）

## 结论

AC-26 尚未完成。当前 `decision-log.md` 经真实普查函数读取为 `status=present`、`entries=12`、`index_entries=18`、`errors=[]`；这只证明当前材料的来源分母。T013 原三文件定向测试已有 24/24、exit 0，证明零条目吞错及归档测试路径两处修复。`stage_end_spec_analyze` 的机器词面也已在 `stage-runner.mjs` 的私有生产者中写入现有事实槽位。**仍缺当前 CARD-04 在同一次官方运行里生成、经独立来源认证、可回读的 P5 报告**；Task store 的 `quality/evidence/stage-quality/build-code/P5/report-facts.json` 不存在，`facts.jsonl` 的 build-code 阶段行仍是 `partial/incomplete`。不能把 T013 的 24/24、旧快照的机器事实或 E2E 夹具换算为 AC-26 全部完成。

## 当前真实路径

1. `runtime/stage/stage-runner.mjs:4367-4510` 的 `currentPostBuildCodeSpecAnalyze` 从当前 `decision-log.md` 调 `deriveDecisionLogOriginalSourceCensus`，将来源、逐 AC 链、材料、测试交给 `validateStageSpecAnalyzeProfile`。`stage-handlers.mjs` 只提供通用 build-code 输入/结果，不持有这条原始来源判决；不要在 handler 另造第二个普查结果。
2. `runtime/stage/stage-content-contracts.mjs:6630-6648` 在 post build-code、当前 task_id 下先逐条投影 `census.errors`，零条目再附一条通用错误；`tests/contract/spec-analyze-truthfulness.test.mjs` 与 `post-spec-analyze-original-source.test.mjs` 守住缺节、坏索引、空分母、归档材料等局部行为。真实当前来源普查没有错误，不能把故障夹具的诊断说成当前任务的问题。
3. `runtime/stage/stage-runner.mjs:2275-2312` 将分析器原值放进 `subject_fact.evidence_state` 与验收 `summary.actual_outcome`，如 `material_incomplete→incomplete` 写到验收 `result`；`quality-fact.status` 仍是粗粒度 `missing`，该主题仍是 advisory。Task store 旧快照 `a8ba4bcc…` 的 `stage_end_spec_analyze` 验收文件已有 `result=inconsistent`、`summary.actual_outcome=inconsistent`，所指 stage-quality 原值也为 `inconsistent`，但该快照和材料版本不是当前身份。
4. `runtime/stage/stage-runner.mjs:3084-3098,3440-3485` 在官方 `run` 结果里披露 `stage-end-spec-analyze:<原值>` 和质量事实引用。`runtime/stage/stage-end-report.mjs:201-214` 能将非通过判决转为报告 `not_done`，渲染器在 `:293+` 输出「没做到」。这只是纯转换；调用者输入本身不等于认证事实。
5. `runtime/stage/stage-runner.mjs:4600-4770` 的 P5 同次写入 hook 要求当前 P5 阶段行、当前代码/材料、真实测试与审查、人工例外来源，才会发布报告。现在 `p5HumanExceptionFromDecisionLog` 明确返回 `null`（材料文本不能证明真人确认，通用 confirmation 又会授予无关权限），所以真实 CARD-04 没有 `report-facts.json`。`runtime/evidence/freshness.mjs` 的 P5 reader 会把它读为 `missing`，不能改读历史或仅凭 `report.md` 存在宣称完成。

## 最小可做与受保护写面

- **P5 未完成时可独立做**：用当前决策记录与已批准的坏材料副本，在既有验证器/官方 build-code 夹具中核 `entries>0/errors=[]`、缺三节时逐条错误、空分母不能通过；核同次 `run` 输出、acceptance wrapper、stage-quality 原字节/ref/hash 与分析器状态一致，且该主题仍 advisory。现有 T013 24/24 只算前一部分，需补同次生产者到 reader 的受限负控与当前身份核验。
- **P5 完成后才能做**：由 P5/T008 拥有的同次官方 hook 取得独立真人声明与当前测试/审查/阶段事实，发布固定三文件及来源认证；P6/T012 只读消费 `authenticateP5StageEndReport` 的 `authenticated=true` 结果，再核报告「没做到」确含这次 `stage_end_spec_analyze` 的非通过机器判断、状态和真实来源。若没有真人例外但经授权允许“没有例外”，也须由 P5 owner 先明确材料与机制；不可在 P6 fixture 手填一份报告或借用通用 `human-confirmation.v3`。
- **写面归属**：逐条错误及归档负控属于 P6/T013 已授权的 `stage-content-contracts.mjs` 与 `post-spec-analyze-original-source.test.mjs`；机器判决投影属于 P6/T012 的 `stage-runner.mjs` 窄白名单及 `post-phase-official-handler.test.mjs`/T012 E2E；报告转换器属于 P5/T007 `stage-end-report.mjs`，认证写入与 reader 属 P5/T008 `stage-runner.mjs`/`freshness.mjs`。P6 不应为了变绿绕过 P5 的来源认证，也不新增公共命令、门或第二份进度记录。若补修报告来源指针，须先由 P5 owner 审核：当前转换器按 advisory 的数组下标取 `quality_advisory_fact_refs[index]`，对额外 advisory 的排列存在错误引用风险；正式 reader 必须重新核同一主题的原始 ref/hash，不能信这个候选字段。

## 建议的定向验证与失败样例

1. 保留现有三文件 T013 命令及旧 RED/GREEN 原件；新测试先在同一个官方 build-code `run` 中取 `spec_analyze.result`、验收 wrapper、stage-quality 原始文件、`quality_advisories` 和 `quality_advisory_fact_refs`，要求 task/stage/tree/material/ref/hash 一致。对 `material_incomplete`、`inconsistent`、`unavailable` 分别要求非通过映射；无分析器结果只允许 `missing/deferred`，不能伪造原值。此项不依赖 P5 报告。
2. P5 可发布后，再跑 T012 真实入口 E2E 的 P5 正例及 `runtime/stage/stage-end-report.test.mjs`、`tests/contract/p5-same-run-report-source.test.mjs` 的受影响定向用例：先见到旧字节 RED（若需新增断言），后见当前生产者 GREEN；独立 reader 按完成标记→来源、证书、报告、测试输出和阶段行的原字节回读。坏证书、坏 ref/hash、旧材料/快照、半写文件、无真人声明均须 `missing` 且不生成认证报告。
3. 失败路径必须留红：原始来源 `entries=0`，即使 `errors` 另有两条也不能通过；缺节错误被压成一条；分析器 `material_incomplete` 被抹成 `missing/deferred`；把非通过 advisory 变成推进门；报告只列泛泛缺口而无原机器判断或认证来源。测试不得用报告转换器的合成输入冒充当前 Task 完成。

本文件是只读定位；未修改生产代码、材料或 Task facts，也未运行全量测试。

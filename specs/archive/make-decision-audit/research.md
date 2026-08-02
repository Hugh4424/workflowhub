# Research: WorkflowHub 五阶段流程优化与步骤级审计

## 背景

WorkflowHub 当前五个 stage 的步骤编号混用整数、小数与复合编号，部分 section 同时承担多项动作；已有 journal、receipt writer、audit aggregator 与 chain topology 等审计基础，但 stage 指令尚未形成统一的 canonical step manifest 与逐步 entry/exit receipt 调用链。本次目标是把 `{make-decision, build-spec, build-plan, build-code, verify-code}` 固定为连续拓扑，为每个 stage 建立单动作、稳定 ID 的步骤合同，并让执行事实可与预期拓扑逐项对账。

上游 spec 已明确需求保真链：`source → immutable requirement ID → decision → artifact → acceptance criteria`。R1–R9 为 accepted，R10 withdrawn；验收 coverage 分母必须排除 R10。计划阶段需保持这一范围，不恢复已撤回机制。

## 相关技术 / 已有实现

- `runtime/evidence/receipt-writer.mjs` 已提供 `writeEntryReceipt(taskId, payload)` 与 `writeExitReceipt(taskId, payload)`；测试覆盖 entry fail-closed、exit warn-only、payload 校验、review 与 retry/attempt 场景，可作为逐步审计写入的既有合同。
- `core/chain-topology.mjs` 已依赖与 matching `STEP_ENTRY` 绑定的 exit receipt，说明 receipt 配对与拓扑校验已有实现基础。
- `metrics/collector.mjs` 已提供 `recordSkeleton(seed, cfg)`、`updateOwnResult(execution_id, patch, cfg)` 和 `configForCollector(...)`。`recordSkeleton` 必须显式传 `cfg`；配置应由 `loadConfig()` 与 task 级目录组合生成，不能省略第二参数。
- `workflows/make-decision/SKILL.md`、`workflows/build-spec/SKILL.md`、`workflows/build-code/SKILL.md`、`workflows/verify-code/SKILL.md` 已含不同程度的 metrics 调用说明；`workflows/build-plan/SKILL.md` 目前仅在收尾描述 metrics，五阶段接入方式需统一。
- `skills/wh-review/scripts/round-state.mjs` 展示安全配置模式：`configForCollector(loadConfig(), { taskDir: taskRoot(taskTrackingRoot, taskId), taskId, project: "workflowhub" })`。task-level metrics 必须落到单任务目录，global path 必须来自配置。
- 上游 `specs/make-decision-audit/spec.md` 已冻结关键边界：manifest 管 expected topology；journal/receipt 管 observed facts；aggregator 是唯一 verdict authority；stage-result、validator、facts assembly 只引用或验证 canonical summary；generic core 与 Multica adapter 分层。

## 风险点

- **审计假绿**：从 journal 反推 expected steps 会掩盖整步缺失；必须先加载 canonical manifest，再对 observed facts 对账。
- **多权威漂移**：stage-result、validator 或 facts assembly 若各自重算 verdict，会产生冲突；只允许 aggregator 裁决。
- **attempt 串线**：entry 与 exit 跨 retry attempt 拼接、重复 terminal exit、未知 step 或乱序均不得 pass。
- **manifest 漂移**：五份 manifest 与五份 SKILL.md 若独立维护，易出现 ID、顺序或证据合同不同步；需要 schema 校验、fixtures 和迁移检查。
- **旧 caller 兼容**：legacy caller 缺 canonical 字段时不能静默补默认值；应返回可定位的 legacy/unknown 结果和迁移说明。
- **来源不完整**：Multica adapter 获取不全时不得提交空 ledger 或用空分母计算 100% coverage，应产生 `SOURCE_INCOMPLETE`/unknown。
- **hash/stale 失真**：上游 decision 改动后，下游 artifact/acceptance 必须 stale，旧 hash 不能继续支撑 pass。
- **metrics 配置误用**：直接调用 `recordSkeleton(seed)` 会因缺 `cfg` 导致写入失败；硬编码 global path 或把 tracking root 当 taskDir 会写错位置。
- **范围膨胀**：R10 已撤回；不得借审计重构新增服务、CI 基建、阻断式质量门或额外平台能力。

## 结论 / 建议

计划应优先复用现有 receipt writer、journal、aggregator 与 topology 模块，以窄 schema 补齐五份 canonical `steps.json`、逐步写入边界和单一 summary 消费合同。实现顺序宜为：先冻结 manifest/schema 与 validator，再接 entry/exit 写入，再完成 aggregator 对账与消费者迁移，最后补 unit、integration、legacy、adversarial fixtures 及文档。

所有缺失、重复、乱序、unknown、tampered-hash、stale 与 source incomplete 场景均采用 fail-closed verdict；记录基础设施自身的非关键 metrics 写失败保持 warn-only。性能基线未知项应明确标为 `unknown + 原因`，不得零填。

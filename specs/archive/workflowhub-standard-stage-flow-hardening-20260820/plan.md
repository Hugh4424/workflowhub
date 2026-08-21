# 实施计划：WorkflowHub 标准五阶段执行与安全收口

- **Input**：`decision-log.md`、`spec.md`
- **Template version**：`plan-task.v3`

## Quick Read

在现有 Stage Agent、session event、四材料、quality facts、status 和 close 上做五组窄修复，不增加公共入口、第五份材料、生产 schema/store 或第二状态机：先统一多轮交互与阶段 outcome，再把前四阶段 `spec-analyze` 变成真正的本阶段完成条件，随后修正 review 绑定、四视角状态和 close，最后把三个历史失败模式合入现有 E2E，并用一个简单确定性任务合同和真实可安全入口验收整条链路。真实 Talk/Clarify 交互不作为本任务执行条件；真实项目 main/remote 的物理不可逆动作不在本任务执行，T008 仅在隔离 fixture 中验证授权 manual-close，所有物理动作仍须单独授权。

- **Goal**：确定性合同能证明一个简单任务的五阶段顺序、阶段质量闭环、交互生命周期、产品发布和授权 close 的成功/失败边界；未来真实任务仍由同一生产合同支持真实 Talk/Clarify。
- **Non-goals**：不重写 Stage Agent、不增加公共入口/持久对象/第二状态机、不修改历史任务；真实 Talk/Clarify 交互和真实项目 main/remote 的不可逆物理 close 不在本任务执行，T008 只在隔离临时 Git/bare remote fixture 中验证已授权 manual-close；来源：R-008、R-009、R-010、D-003、D-006、D-011、D-012、D-013。
- **Before**：合法多轮 Talk 与 `not_applicable` 会导致 publication 失败；前四 analyzer、review、status 和 close 存在消费断点。
- **After**：交互、材料、analyzer、review、完成、状态和 close 由 current identity 串成一条可证伪链路。
- **Main risk**：把质量条件做成工作阻塞，或再造一个重复控制面。
- **Next step**：T001 先写全需求候选轴、多轮和 transcript 的 RED 合同。

- 当前规格：`spec.md`，SHA-256 `0d80e9b52f4b9bb95216b5bbddd121fb75072cfd0a27f217e5385c31ee8f3570`
- 当前决定：`decision-log.md`，SHA-256 `d364e8b0583271ca5fde739d3bb6529d5d9007f134742c1640be2db7835417af`
- 宪法基线：`CONSTITUTION.md`，SHA-256 `d17c85373e30c4733a77b19dc260373268fca6dd29b8ac3574c8a35b4da6ebd5`
- 测试路线：`fullstack`；合同测试先锁住语义，集成测试验证真实 consumer，随后通过真实 stage/runtime 入口验收可安全的 analyzer、review、status 和 close preflight，最后运行确定性历史/全链路回归；不启动真实 Talk/Clarify 交互。
- 交付边界：只扩展现有 producer、consumer 与测试；不新增生产对象、专用历史 fixture/harness 或 dogfood gate。

## Technical Context

### Global Constraints

- **Verified facts**：host 允许同 subject 多轮 event；adapter 当前拒绝重复 skill；生产 analyzer 深度与 completion 消费不足；wh-review bundle hash 不一致。
- **Language / runtime**：Node.js `v24.14.0`，ESM，Vitest。
- **Primary dependencies**：现有 Stage Agent、session-state、stage runner、quality facts、Vitest；不新增运行时依赖。
- **Storage / state**：四材料为唯一当前工作真相；task store 只保存 vNext 允许的 facts/reviews/tests/verify/evidence/index。
- **Testing**：确定性测试使用临时 task store、临时 Git repo、本地 bare remote并自行清理；本任务保存合同/历史回归和真实可安全入口 evidence，不启动真实 Talk/Clarify 会话，不触碰历史源；provider 若尝试失败如实记录。
- **Target environment**：现有 CLI host 和 portable skill bundle；保持旧报告只读兼容。
- **Scale / scope**：五个现有 runtime/host 责任面、三个历史失败模式、一个简单确定性全链路合同。
- **Unresolved facts**：仓库内没有真实 host 卡片 renderer；WorkflowHub 只能约束卡片语义顺序和不得推断选择。真实初始焦点/错误焦点按 DEFER-002 交接，不能在本任务声称完成。

- 运行时：Node.js ESM，Stage Agent 通过 host session event 记录真实步骤和技能，再由 stage bridge/adapter 发布 outcome。
- 当前事实：`decision-log.md`、`spec.md`、`plan.md`、`tasks.md` 是唯一当前材料；review、test、evidence、history 只是事实。
- 当前故障：同一 skill 的多轮交互被 adapter 当成重复 lifecycle；host 接受 `not_applicable`，adapter 拒绝；前四 analyzer 深度和 completion 消费不一致；review bundle identity 与 disposition 绑定不完整；status/close 没有稳定消费同一四视角事实。
- 兼容要求：保留旧 task、旧 report、旧 snapshot 只读；不引入 successor、reopen、recovery、checkpoint permit、兼容双写或新 public command。
- 并发要求：同一 task/stage/material identity 只允许一个 canonical publication；冲突必须在写入前报错。

## Code Anchors

- **Verified anchors**：`startCodexSessionEvent`/`finishCodexSessionEvent`、`publishCurrentWorkflowHubSession`、`createWorkflowHubSessionRecorder.begin`、`validateStageSpecAnalyzeProfile`、`STAGE_PREDICATES`、`publishVNextStage`、`validateReportableFindingDispositions`、`prepareDeliveryClosePlan`。
- **Existing interfaces**：session event、stage outcome、review result/disposition、completion projection、close plan/authorization。
- **Read now**：本节列出的 host/runtime/review/close consumer 和对应现有合同测试。
- **Must read before task**：每张 task 卡的精确符号邻域和同文件现有测试；不得靠计划中的旧行号实现。
- **Context mode**：Full — 跨 host、runtime、review、status、close，并有并发与 Git 边界。

- `runtime/evidence/fact-collector.mjs`、`runtime/evidence/codex-transcript-adapter.mjs`：复用已有 registered transcript 投影，不创建新投影实体。
- `runtime/stage/stage-agent-outcome-adapter.mjs`：manifest step/skill、状态和 outcome 适配。
- `skills/grill-with-docs/SKILL.md`、`skills/grill-with-docs/skill-bundle.json`：把 Grill 的退出合同从四项专项扩大为全需求覆盖，并同步 portable identity。
- `runtime/stage/stage-content-contracts.mjs`：stage 内容 profile 与 `spec-analyze` outcome 合同。
- `runtime/stage/stage-handlers.mjs`：五阶段生产 handler 和规格 profile 接线。
- `runtime/stage/stage-acceptance-policy.mjs`：三处业务确认和 stage completion 的现有接受策略。
- `runtime/stage/completion-predicates.mjs`：阶段完成判据与工作进度派生。
- `runtime/stage/stage-runner.mjs`：publication、quality facts 和 canonical 写入。
- `runtime/evidence/canonical-evidence-validators.mjs`：从现有 facts/evidence 精确选择 current 逐 AC 结果。
- `runtime/task/task-kernel-implementation.mjs`：task dependency canonical writer 边界。
- `runtime/task/workspace.mjs`：close dirty path 的 task/owner 归属事实。
- `runtime/review/stage-review-disposition.mjs`：finding 处置与完成消费。
- `skills/wh-review/skill-bundle.json`：portable bundle identity。
- `tools/cli/stage-runtime.mjs`：public run/status/review/verify/confirm/authorize 的输出入口。
- `runtime/evidence/monitoring-projector.mjs`：monitor 只读消费统一阶段状态，不承担完成权威。
- `core/task-close.mjs`、`tools/cli/task-close.mjs`：close preflight、授权和物理动作。

### Reuse → Extend → New

| Capability | Decision | Existing anchor | Reason / removal condition |
|---|---|---|---|
| 多轮交互 | extend | `stage-agent-outcome-adapter.mjs` | host/bridge 原样保留，adapter 聚合 |
| analyzer completion | extend | `completion-predicates.mjs` | 消费现有 outcome/facts |
| 四视角状态 | extend | `completion-predicates.mjs` | 唯一纯派生；monitor 只消费 |
| 历史失败回归 | reuse | `vnext-five-stage-current.test.mjs` | table/helper 覆盖，不复制历史资产 |

## Solution Design

### Overview

复用 registered transcript、session event、stage outcome、quality facts、completion 和 close plan，按 producer → contract → completion → presentation → close 串联现有职责；不新增生产或历史控制面。

### 1. Session 与 outcome 只保留一套事实

host 继续记录每一轮 ask/wait/reply/resume，但 adapter 按 manifest 声明的 skill 聚合为一个有序 lifecycle；同 skill 的合法轮次不算重复，第二个真正独立 lifecycle 仍拒绝。`not_applicable` 只适用于 manifest 明示具有适用性语义的 skill 和 Clarify skip，并强制携带 `trigger=false`、`executed=false` 与具体原因；stage 本身和 normal close 不能靠它自动完成/发布，close 的无适用物理动作继续使用现有 action 结果语义。

原始需求验证复用已有 `buildTranscriptProjection`、`createRegisteredCodexSource`、`parseRegisteredCodexTranscript`，只补 launcher、session、task、stage、version、message id/order/content hash、R 索引与候选决策轴核对；高/中影响轴必须已选择或有不提问理由及 D/FR/AC 绑定，不创建第二个 transcript 投影实体、方向状态或第五份材料。

### 2. 前四 analyzer 在当前阶段闭环

四个 production profile 分别消费它们真实需要的输入：

- make-decision：transcript 投影、R 索引、decision-log、完整 Grill、review disposition、最终确认；
- build-spec：decision-log、完整 spec 内容合同、Clarify outcome、review disposition；
- build-plan：现有深层完整性规则、FR/AC/task/依赖/测试/STOP 闭包；
- build-code：用 `task_id + AC id + material revision + snapshot tree + producer stage` 从现有 facts 精确选择唯一逐 AC 结果，再核对 scenario、exit、oracle、actual、coverage、evidence hash、实现与集成审查；`producer_stage` 必须等于当前 build-code；零条或冲突多条保持 incomplete，不按时间戳猜最新。

`deriveProductRelease()` 还必须接收批准 spec 的完整适用 AC ID 集合（延期/不适用项不放入集合）；缺失、重复、意外或缺少 current freshness 的 stage/AC/confirmation 输入都保持 `not_released`。verify confirmation 只接受现有 `human-confirmation.v2` 的 current task、verify-code、material revision、snapshot 和时间绑定。

analyzer finding 不创建 blocked/recovery。Stage Agent 可继续编辑同一任务；`actionable + major|blocking` 只能 `fixed`，或由用户以绑定 finding/current snapshot/具体风险的 `accepted_risk` 承担；完整 `deferred/not_applicable` 只用于真实延期、不适用或非 serious finding。处理后重跑得到 current consistent 才能完成；`unavailable`、stale、旧 revision 和不完整处置都不能完成。

`skills/spec-analyze` 与前四 workflow producer 同步成同一语义：analyzer 仍是 report-only 质量事实，不是开始/继续许可证；但 current consistent 是声明阶段完成的必要事实。terminal disposition 直接放进现有 `spec_analyze` outcome，由 content contract 校验、completion predicate 消费，不新增 store。

### 3. Review 只修真实断点

修正 portable bundle 的声明 hash，使 bundle/direct/stage host 解析同一能力；resolver 保持不动。finding disposition 只复用 `fixed/rejected_invalid/accepted_risk/needs_human`，所有处置绑定 finding、review result、material/snapshot identity。`fixed` 必须有当前修复证据；`accepted_risk` 必须有当前用户对具体风险的确认；证据不足保持现有 incomplete/unavailable，不新增枚举。

### 4. Status 与 close 消费同一派生事实

`completion-predicates.mjs` 保持完成权威并提供纯四视角派生；host、doctor、status、monitor、run、review、verify、confirm、authorize、close 只消费职责相关视角，不各自重算。monitor projector 仍是只读呈现。逐 consumer 验证主结论、current identity、失败原因、未改变事实、唯一下一步和真实 exit 语义。

normal close 只读核对五阶段 current completion、三处当前业务确认、逐 AC product result、`deriveProductRelease()` 当前显式结果、Git 基线、prepared close plan 与逐项授权；`executeClosePlan()` 不能绕过 prepare，不首次运行 analyzer/review。prepare 冻结 task-specific generated manifest；dirty 只放行可证明属于当前 task/owner 的路径；cleanup 限定 manifest、当前 sidecar 和固定 allowlist。物理动作复用现有 operation facts，失败后只重试探针证明安全且未完成的动作；目标漂移重新 preflight 和授权。风险交付只改变 `physical_delivery`，不能漂白前三个视角。

### 5. 回归与确定性全链路合同

三个历史案例只提炼为 table/helper，合入现有 `vnext-five-stage-current.test.mjs`（必要时复用 `public-behavior-baseline.test.mjs`），测试失败语义而不复制历史资产。P5 使用一个低外部依赖简单任务的确定性合同，覆盖五阶段、三处确认、Clarify 生命周期、阶段内修复、前四 analyzer、review、release 与 close 的正反边界；现有真实交互合同测试必须证明生产路径拒绝猜回复。provider/host/物理 close 不在本任务启动，缺失事实保持 unavailable/incomplete/not_released/not_run；只保存可读 evidence，不建设永久 dogfood harness。

### Module responsibilities

#### Host session

- **Responsibility**：记录真实消息、轮次和交互事实，生成只读 transcript 投影。
- **Consumes**：launcher/session/task/stage/message identity。
- **Produces**：有序 session events 与短生命周期需求投影。
- **Must not decide**：阶段完成、产品发布或物理交付。

#### Stage runtime

- **Responsibility**：认证 manifest、材料、analyzer/review facts 并原子发布 outcome。
- **Consumes**：session events、四材料 identity、quality facts。
- **Produces**：current stage outcome 与 completion projection。
- **Must not decide**：用户产品方向或 provider verdict。

#### Status and close

- **Responsibility**：投影四视角；close 只消费已完成事实并执行已授权物理动作。
- **Consumes**：current outcomes、product result、Git/authorization facts。
- **Produces**：status/monitor/close 输出和 immutable close results。
- **Must not decide**：补做 analyzer/review 或改写质量事实。

### Interfaces, data, and lifecycle

- **Interfaces / schemas**：扩展现有 session/outcome/disposition 字段语义，不新增 schema 文件；旧报告只读。
- **Data flow / state**：message → session rounds → stage adapter → analyzer/review facts → completion/projector → close。
- **API contract**：N/A — 不新增 HTTP API；只调整现有 public CLI 输出字段语义。
- **UI / external code**：主结论 → current identity → 四视角 → 原因/未改变事实 → 唯一下一步；键盘顺序另做人工验收。
- **Fail-loud behavior**：identity/hash/order/conflict 错误在 canonical write 或 provider dispatch 前明确失败。

## File Boundary

### NEW

- N/A — 不新增生产对象、历史 fixture 或专用 harness；ADR 0014 已由 make-decision 创建，本阶段只把它纳入治理同步。

### MODIFY

- `runtime/stage/stage-agent-outcome-adapter.mjs`：统一状态集合和多轮 lifecycle 认证。
- `skills/grill-with-docs/SKILL.md`：完整需求、旅程、材料、阶段、质量、close、回归、复杂度、非目标和延期的客观退出矩阵。
- `skills/grill-with-docs/skill-bundle.json`：同步 Grill portable bundle hash。
- `workflows/make-decision/SKILL.md`：消费全需求 Grill 结果、统一 analyzer 本阶段闭环，并拒绝专项替代整体。
- `runtime/evidence/fact-collector.mjs`、`runtime/evidence/codex-transcript-adapter.mjs`：补 current transcript identity/R 索引核对。
- `runtime/stage/stage-content-contracts.mjs`：四个 analyzer profile 的生产深度。
- `runtime/stage/stage-handlers.mjs`：现有 lifecycle validator、完整内容合同及四 profile 的正式生产接线。
- `runtime/stage/stage-acceptance-policy.mjs`：三处当前业务确认的 completion/handoff 消费。
- `runtime/stage/completion-predicates.mjs`：把 current analyzer 结果纳入前四阶段完成。
- `runtime/stage/stage-runner.mjs`：原子 publication 与 analyzer quality fact。
- `runtime/evidence/canonical-evidence-validators.mjs`：逐 AC current result 的内存 selector 与冲突判定。
- `runtime/task/task-kernel-implementation.mjs`：task dependency 未闭合时拒绝后置 canonical write。
- `skills/spec-analyze/SKILL.md`、`skills/spec-analyze/skill-bundle.json`：同步 report-only 与 completion-condition 语义。
- `workflows/build-spec/SKILL.md`、`workflows/build-plan/SKILL.md`、`workflows/build-code/SKILL.md`：统一 analyzer finding 的本阶段修复/完整处置/重跑顺序。
- `skills/wh-review/skill-bundle.json`：修正当前 bundle hash。
- `runtime/review/stage-review-disposition.mjs`：复用现有处置枚举，补 identity、证据和确认合同。
- `tools/cli/stage-runtime.mjs`：四视角与恢复动作输出。
- `tools/host/workflowhub-stage-agent-protocol.mjs`：host presentation 消费统一派生事实。
- `runtime/evidence/monitoring-projector.mjs`：只读映射统一派生事实。
- `core/task-close.mjs`：只补 RED 证明缺失的 normal/risk preflight；保留现有 retry engine。
- `tools/cli/task-close.mjs`：逐项授权与四视角输出。
- `runtime/task/workspace.mjs`：仅在 RED 证明缺失时补 task/owner dirty 归属判断。
- `docs/standard-workflow.md`：记录最终标准 stage/step/skill/产物/质量规范。
- `skills/catalog.yaml`：仅由 P5 在所有 skill/bundle 修改后同步受影响 closure 的最终 hash。
- `docs/adr/0014-vnext-current-material-authority-and-stage-local-repair.md`、`CONTEXT.md`：同步四材料 locator 与“同阶段修复、质量不作工作许可证”的既有决定，不新增第二套术语。
- 现有测试：`tests/m15-codex-session-hook.test.mjs`、`tests/contract/stage-interaction-batching.test.mjs`、`tests/contract/stage-order-and-host-interaction.test.mjs`、`tests/contract/spec-analyze-completeness.test.mjs`、`tests/contract/five-stage-spec-analyze-wiring.test.mjs`、`tests/contract/stage-completion.test.mjs`、`tests/contract/stage-skill-invocation-contract.test.mjs`、`tests/contract/status-derivation.test.mjs`、`tests/stage-risk-acceptance.test.mjs`、`tests/integration/vnext-delivery-close.test.mjs`、`tests/integration/manual-delivery-close.test.mjs`、`tests/integration/review-test-close-freshness-matrix.test.mjs`、`tests/e2e/vnext-five-stage-current.test.mjs`。
- 追加复用测试：`tests/integration/vnext-official-stage-run.test.mjs`、`tests/contract/review-materials-contract.test.mjs`、`tests/contract/public-behavior-baseline.test.mjs`。

### DO NOT TOUCH

- `runtime/adapters/local-skill-resolver.mjs`
- `tools/host/workflowhub-codex-session-state.mjs`、`tools/host/workflowhub-stage-agent-bridge.mjs`（host 保留/转发原始 event，不聚合）
- `runtime/evidence/monitoring-diagnostics.mjs`（只负责退化、成本和趋势诊断）
- 三个历史 task/source 目录及 M14–M17 报告
- `decision-log.md`、`spec.md` 的已确认产品方向，除非出现新的方向变化并重新 make-decision
- 旧 accepted/run/receipt/review-flow/current projection 兼容区

## Technical Decisions

### DEC-001 — 扩展现有事实链而不新增控制面

- **Problem**：交互、analyzer、review、status、close 的现有 producer/consumer 合同不完整，导致内容完成但 publication 失败或状态混读。
- **Options**：A 新建中央 workflow 状态机；B 扩展现有 session/outcome/facts/projector；C 只改提示词。
- **Selected**：extend — 选择 B。
- **Reason**：已有真实 consumer 和持久边界，只补断点即可满足全部 AC，维护成本最低。
- **Consequence / risk**：completion 变严格后会暴露旧调用缺失；通过 vNext current 边界和明确负例处理。
- **Fallback**：按 Phase 回退当前源码字节，保留 report/test failure；任何 commit 另行取得用户授权。
- **F10 real threat**：重复状态权威、双写分叉和旧事实被误判 current。
- **F10 existing cover**：四材料、session event、stage outcome、quality facts、projector、close plan 已覆盖职责。
- **F10 bypassable**：否；canonical publication 和 close 都必须消费这些现有事实。
- **F10 maintenance cost**：历史失败模式和简单任务合同合入现有测试；不新增外部 dogfood gate、永久 harness 或生产对象。
- **F10 disposition**：`keep`

- TD-001：多轮交互是一个声明 skill 内的有序 rounds，不是多个 skill lifecycle。
- TD-002：`not_applicable` 是真实终态，不改写成 skipped/completed。
- TD-003：完整 spec 校验直接解析当前 `spec.md` 字节，只生成短生命周期内存视图。
- TD-004：analyzer 是完成条件，不是继续编辑许可证；修复在同一 stage 完成。
- TD-005：状态四视角由一个 projector 派生，各 consumer 只负责呈现。
- TD-006：normal close 不补质量，risk close 不漂白产品结果。
- TD-007：历史失败模式只作为现有测试的 table/helper，生产运行时不读取或复制历史 task。
- TD-008：不修改正确的 local skill resolver，不为本任务新增 schema/command/store。

## Test Strategy

路线为 `fullstack`，分层如下：

- 合同层：状态枚举、多轮 lifecycle、transcript identity、四 analyzer 输入/finding/completion、review disposition、bundle hash。
- 集成层：五阶段 production handler、canonical publication、四视角 CLI/monitor、normal/risk close 与幂等重试。
- 历史夹具层：T01/F13/KD 三类失败模式的固定重放和源 hash 不变证明。
- E2E 层：一个简单任务合同覆盖五阶段和 close 的正反边界；provider 不可用时必须保留 unavailable，不能改用空 finding；本任务不启动真实 Talk/Clarify，stage/analyzer/review/status/close preflight 的真实入口结果单独记录，确定性断言不冒充外部执行结果。

关键命令：

```bash
npx vitest run tests/m15-codex-session-hook.test.mjs tests/contract/stage-interaction-batching.test.mjs tests/contract/stage-order-and-host-interaction.test.mjs
npx vitest run tests/contract/spec-analyze-completeness.test.mjs tests/contract/five-stage-spec-analyze-wiring.test.mjs tests/contract/stage-completion.test.mjs
npx vitest run tests/contract/stage-skill-invocation-contract.test.mjs tests/stage-risk-acceptance.test.mjs tests/contract/status-derivation.test.mjs
npx vitest run tests/contract/status-derivation.test.mjs tests/integration/vnext-official-stage-run.test.mjs tests/contract/stage-completion.test.mjs
npx vitest run tests/integration/vnext-delivery-close.test.mjs tests/integration/manual-delivery-close.test.mjs tests/integration/review-test-close-freshness-matrix.test.mjs
npx vitest run tests/e2e/vnext-five-stage-current.test.mjs tests/contract/public-behavior-baseline.test.mjs --poolOptions.forks.singleFork --no-fileParallelism
npx vitest run tests/e2e/vnext-five-stage-current.test.mjs --poolOptions.forks.singleFork --no-fileParallelism
npm run smoke:skill-packages
env -u CODEX_THREAD_ID -u CODEX_SESSION_ID npm test
npm run check
```

T010 使用确定性全链路合同：在隔离临时 Node repo 以既有 `greet <name>` + `--caps` 覆盖正常/非法输入和 trim Clarify 的生命周期正反夹具；运行现有 public stage/outcome、interaction、analyzer、review、release/close 合同测试，并通过真实 stage/runtime 入口验收可安全的 stage、analyzer、review、status 和 close preflight/负例，确认生产路径拒绝猜回复、旧材料和缺失事实。不启动真实 Talk/Clarify 交互；真实 provider 可尝试但失败保持 unavailable；真实 release 的不可逆动作和物理 close 没有单独授权时不执行。相关缺失保持 unavailable/not_released/not_run，并在 `quality/tests/T010-history-contract-green.json` 写明 coverage limit，不新增永久脚本或 harness。

每个命令预期 `exit 0`；oracle 不是“命令绿”，而是相应负例被拒绝、合同正例完成、current identity 一致、历史源 hash 不变、四视角不混读，并明确外部 host/provider/物理 close 未运行。

测试边界：确定性合同不证明外部 provider 的可用性、费用或延迟，也不证明一次真实任务的 release/物理交付；本地 bare remote 不证明托管平台权限；三个历史 table record 只覆盖已知失败模式；简单合同不覆盖复杂业务逻辑；仓库外 host renderer 的焦点行为按 DEFER-002 保持未完成。

| Target | Task | Role | gate_cmd / expected_exit | Oracle / evidence_path |
|---|---|---|---|---|
| AC-001/002/004 | T001/T002 | RED/GREEN | session/grill contract / nonzero→0 | ORACLE-SESSION / `T001-session-red.json` + `T002-session-green.json` |
| AC-003/005–010/013/021/025 | T003/T004 | RED/GREEN | analyzer contract / nonzero→0 | ORACLE-ANALYZER / `T003-analyzer-red.json` + `T004-analyzer-green.json` |
| AC-011–014/020/024/025 | T005/T006 | RED/GREEN | review-status / nonzero→0 | ORACLE-STATUS / `T005-status-red.json` + `T006-status-green.json` |
| AC-015/016/020/024 | T007/T008 | RED/GREEN | close integration / nonzero→0 | ORACLE-CLOSE / `T007-close-red.json` + `T008-close-green.json` |
| AC-017–019 | T009/T010 | RED/GREEN | existing E2E/deterministic contract / nonzero→0 | ORACLE-HISTORY / `T009-history-red.json` + `T010-history-contract-green.json` |
| AC-022 | T010/T011 | GREEN/FINAL | existing 10-entry public baseline / 0 | ORACLE-FINAL / `T010-history-contract-green.json` + `T011-final-current-snapshot.json` |

### 逐 AC 当前证据链

下表只展开本任务已有引用，不新增 runtime matrix/store。`Task owner` 指向任务卡内的完整 `gate_cmd/evidence_path`；表中 review/outcome 是 locator，真实 ref/hash 只能由执行后 create-only facts 填入，计划阶段不得伪造。build-code spec-analyze 从同一组 `linked_ids/anchors/evidence_refs` 逐项验证实际 ref/hash 与 current stage-end。

| AC | 来源链 | Task owner | 实现锚点 | 验证链 |
|---|---|---|---|---|
| AC-001 | R-001–004/013→D-009→FR-REQ-001 | T001/T002 | `fact-collector.mjs#buildTranscriptProjection` + Grill/analyzer | SESSION→T002 path→P1 review/outcome |
| AC-002 | R-003/013→D-003→FR-INT-001 | T001/T002 | `codex-transcript-adapter.mjs#parseRegisteredCodexTranscript` + lifecycle validator | SESSION→T002 path→P1 review/outcome |
| AC-003 | R-002/013→D-004→FR-INT-002/SPC-001 | T003/T004 | `stage-handlers.mjs#officialStageHandler` + build-spec profile | ANALYZER→T004 path→P2 review/outcome |
| AC-004 | R-012→FR-GRL-001 | T001/T002 | `skills/grill-with-docs/SKILL.md#full-requirement-matrix` | SESSION→T002 path/manual→P1 outcome |
| AC-005 | R-005/013→D-003→FR-STG-001/002 | T003/T004 | `stage-agent-outcome-adapter.mjs#publishStageAgentOutcome` | ANALYZER→T004 path→P2 review/outcome |
| AC-006 | R-011→D-008→FR-ANL-001 | T003/T004 | `skills/spec-analyze/SKILL.md#make-decision-profile` | ANALYZER→T004 path→P2 review/outcome |
| AC-007 | R-002/011→D-008→FR-ANL-002/SPC-001 | T003/T004 | `skills/spec-analyze/SKILL.md#build-spec-profile` | ANALYZER→T004 path→P2 review/outcome |
| AC-008 | R-011→D-008→FR-ANL-003 | T003/T004 | `stage-content-contracts.mjs#validatePlanTaskContract` | ANALYZER→T004 path→P2 review/outcome |
| AC-009 | R-005/011/013→D-008→FR-ANL-004 | T003/T004 | `canonical-evidence-validators.mjs#validateCanonicalImplementationReceipt` | ANALYZER→T004 path→P2 review/outcome |
| AC-010 | R-011→D-010→FR-ANL-005 | T003/T004 | `completion-predicates.mjs#deriveStageCompletion` | ANALYZER→T004 path→P2 review/outcome |
| AC-011 | R-010→D-005→FR-REV-001 | T005/T006 | `stage-review-disposition.mjs#validateReportableFindingDispositions` | STATUS→T006 path→P3 review/outcome |
| AC-012 | R-010→D-005→FR-REV-002 | T005/T006 | `skills/wh-review/skill-bundle.json#entry` | STATUS→T006 path→P3 review/outcome |
| AC-013 | R-001/008/009→D-004/010→FR-CHG-001/002 | T003/T004 | `stage-runner.mjs#runOfficialStage` material freshness | ANALYZER→T004 path→P2 review/outcome |
| AC-014 | R-005→D-006→FR-STA-001/UIX-001 | T005/T006 | `completion-predicates.mjs#deriveStageProgress/Completion` | STATUS→T006 path→P3 review/outcome |
| AC-015 | R-005/013→D-007→FR-CLS-001 | T007/T008 | `task-close.mjs#prepareDeliveryClosePlan/executeClosePlan` | CLOSE→T008 path→P4 review/outcome |
| AC-016 | R-005/013/014→D-007/013→FR-CLS-002/003 | T007/T008 | `task-close.mjs#executeClosePlan` + `workspace.mjs#inspectWorktreeCleanup` | CLOSE→T008 path→P4 review/outcome |
| AC-017 | R-006→D-002→FR-REG-001 | T009/T010 | `vnext-five-stage-current.test.mjs#history-table` | HISTORY→T010 path→P5 review/outcome |
| AC-018 | R-006/007/013→D-001/002/012→FR-REG-002 | T010 | deterministic simple-task contract + `T010-history-contract-green.json` | HISTORY→T010 path→P5 review/outcome |
| AC-019 | R-004/008–010/013→D-009/011→FR-CHG-002/CMP-001 | T009–T011 | existing `verify-structure/run-checks/reverse-consumer` | FINAL→T011 path→P5 review/outcome |
| AC-020 | R-005→D-006/007→FR-STA/CLS | T005–T008 | `completion-predicates.mjs` + `task-close.mjs` | STATUS/CLOSE→T006/T008 paths→P5 outcome |
| AC-021 | R-005/011→D-008→FR-SPC-001 | T003/T004 | `stage-content-contracts.mjs#validateAcceptanceDesignMinimum` | ANALYZER→T004 path→P2 review/outcome |
| AC-022 | R-005→D-006→FR-UIX-001 | T010/T011 | `public-behavior-baseline.test.mjs#ten-entry-table` | FINAL→T011 path→P5 review/outcome |
| AC-023 | R-003→D-006→FR-UIX-002 | T011 defer | external host renderer focus/keyboard seam | DEFER-002 refs/hash→FINAL outcome |
| AC-024 | R-005→D-006/007→FR-UIX-003 | T005–T008 | `stage-runtime.mjs` + `task-close.mjs#status` | STATUS/CLOSE→T006/T008 paths/manual→P5 |
| AC-025 | R-013→D-003/007→FR-INT-004 | T003–T008 | `canonical-evidence-validators.mjs#validateHumanConfirmation` | ANALYZER/STATUS/CLOSE paths→current outcomes |

## Rollback and Recovery

- **Global recovery rule**：只回滚当前 Phase 实现，保留四材料、immutable review/test/failure facts。
- **Irreversible boundaries**：本任务不执行真实 commit/archive/merge/push/cleanup；未来真实 close 仍只在逐项授权后执行；合同测试使用临时 repo/remote。
- **Recovery owner**：build-code 负责 Phase 内修复；verify-code 只独立裁决当前实现；用户负责不可逆授权。

- 每个 Phase 独立保存测试/实现证据；失败时只回退该 Phase 的源码字节。commit/push/merge 仍需单独授权。
- publication 写入前完成所有 identity/predicate 校验；任何冲突不留下部分 canonical 状态。
- analyzer unavailable 时同 task 继续修复且自身 stage quality incomplete；异源 review unavailable 如实显示、不得显示 pass，但不单独形成 provider gate；不创建 recovery 状态机。
- close 部分失败只重试 plan 中仍未完成且幂等的动作；目标 Git ref 变化则重新 preflight 和授权。
- bundle hash 修复可单独回退，不触碰 resolver 或 provider result。

### Engineering Risk Handoff

- **PLAN-RISK-001**：把质量缺口误做成工作阻塞
  - **Affected IDs**：FR-ANL-001–005、AC-006–010、T003–T004
  - **Trigger**：analyzer 非 consistent 后 Stage Agent 无法继续编辑同一任务。
  - **Consequence**：违反“质量是完成条件，不是工作许可证”。
  - **Mitigation or STOP**：保持 edit/run 可用，只拒绝 completed publication；若需要 recovery 状态机则 STOP。
  - **Handling Stage**：build-code
  - **Verification**：负例产生 finding 后，同 task 修复并重跑为 current consistent。

- **PLAN-RISK-002**：close 重放已完成动作
  - **Affected IDs**：FR-CLS-001–003、AC-015/016、T007–T008
  - **Trigger**：commit/push/cleanup 中途失败后重试。
  - **Consequence**：重复副作用或目标漂移。
  - **Mitigation or STOP**：读取逐动作结果，只执行未完成幂等动作；ref 漂移则重新 preflight/授权。
  - **Handling Stage**：build-code
  - **Verification**：临时 Git repo 注入每个失败点，断言完成动作不重放。

- **DEFER-002**：真实 host 卡片初始焦点与错误焦点
  - **Affected IDs**：FR-UIX-002、AC-023、SCN-017
  - **Reason**：当前仓库不拥有 Codex host 卡片 renderer，也没有可消费 focus hook；在 WorkflowHub 内新增假 renderer 会违反 F10。
  - **Owner**：Codex host UI owner；WorkflowHub owner 负责提供问题顺序、可辨识名称和不得推断选择的合同。
  - **Trigger**：host 暴露可测试的 card focus/keyboard API，或 renderer 被纳入本仓库并登记真实 consumer。
  - **Handoff**：携带 Talk/Clarify/confirmation 问题卡 schema、预期 Tab/Enter/Escape 顺序与错误焦点场景交给 host UI。
  - **Close condition**：真实 renderer 自动化或人工证据证明稳定初始焦点、键盘顺序和错误焦点恢复；在此之前 AC-023 保持 deferred，不计入 product release pass。

## Implementation Order

1. P1：session、状态枚举、transcript 投影和 stage outcome。
2. P2：四个 analyzer production profile、finding 修复闭环和 completion。
3. P3：review bundle/disposition 与四视角 status/monitor。
4. P4：normal/risk close、部分失败与幂等重试。
5. P5：现有历史语义回归、简单确定性全链路合同、标准流程文档和全量回归。

## Dependencies and Parallelism

- P1 是 P2/P3/P5 的共同前置。
- P2 完成后再执行 P3；P3 消费 P2 的 current completion/status 语义，保持严格串行。
- P4 依赖 P2/P3 的统一 completion/projector。
- P5 依赖 P1–P4；现有回归断言可提前准备，确定性全链路合同最后运行；不等待外部会话、provider 或真实项目 main/remote 物理 close，T008 的隔离 manual-close fixture 除外。
- 每个 GREEN task 必须等待同 Phase RED task 产生预期失败证据；禁止先实现后补 RED。

## Requirement and Verification Traceability

| 来源/决定 | FR/AC | Phase/Task | 精确边界 | 判定 |
|---|---|---|---|---|
| R-001–004/012/013,D-003/009 | FR-REQ-001,FR-INT-001,FR-INT-002,FR-INT-003,FR-INT-004,FR-GRL-001,FR-STG-001,FR-STG-002,FR-STG-003 / AC-001,AC-002,AC-003,AC-004,AC-005,AC-025 | P1–P2,T001–T004 | transcript,adapter,handlers,grill | ORACLE-SESSION/ANALYZER |
| R-005/011/013,D-004/008/010 | FR-ANL-001,FR-ANL-002,FR-ANL-003,FR-ANL-004,FR-ANL-005,FR-CHG-001,FR-CHG-002,FR-SPC-001 / AC-006,AC-007,AC-008,AC-009,AC-010,AC-013,AC-021 | P2,T003–T004 | skill/workflows/contracts/runner/evidence | ORACLE-ANALYZER |
| R-010/013,D-005/006 | FR-REV-001,FR-REV-002,FR-STA-001,FR-STA-002,FR-STA-003,FR-UIX-001,FR-UIX-003 / AC-011,AC-012,AC-014,AC-020,AC-024,AC-025 | P3,T005–T006 | bundle,disposition,core consumers | ORACLE-STATUS |
| R-005/013/014,D-007/013 | FR-CLS-001,FR-CLS-002,FR-CLS-003 / AC-015,AC-016,AC-025 | P4,T007–T008 | task-close/workspace core/CLI | ORACLE-CLOSE / ORACLE-CLOSE-MANUAL |
| R-006–010/013,D-001/002/012 | FR-REG-001,FR-REG-002,FR-CMP-001 / AC-017,AC-018,AC-019 | P5,T009–T010 | existing E2E,contract review,docs | ORACLE-HISTORY |
| D-006 | FR-UIX-002 / AC-023 | deferred | DEFER-002 | 等待真实 host renderer hook |
| R-001–R-014,D-001–D-013 | 全部 FR / AC-001–AC-025（含 AC-022 十入口矩阵） | P5,T011 | 全边界 | ORACLE-FINAL / ORACLE-CLOSE-MANUAL |

## Governance Synchronization Matrix

| 变更 | 唯一 consumer | Owner | 替代关系 | 删除条件 |
|---|---|---|---|---|
| transcript 核对扩展 | make-decision analyzer | runtime/evidence | 复用已有投影替代 agent 自报 | registered source 废止 |
| rounds 聚合 | stage outcome adapter | runtime/stage | 替代重复 skill 误判 | manifest 改为原生 round |
| analyzer completion | completion projector | runtime/stage | 替代 warning-only | 前四 stage 被移除 |
| 四视角纯派生 | CLI/host/monitor/close | runtime/stage | 替代 consumer 自算 | public status 合同废止 |
| 历史失败 table/helper | existing E2E | tests | 不复制、不替代历史源 | 对应回归删除 |
| ADR/术语 locator | 文档读者与 stage skills | docs | 替代 ADR 0009 的旧 locator | 四材料权威变化 |

不新增生产 schema、公共命令、持久对象、历史 fixture、专用 harness 或双写；现有测试不进入 Runner/Skill Bundle。

## Constitution Check

- **Constitution binding**：`{"artifact_kind":"constitution","ref":"constitution-checklist.md","hash":"368817c2910a36e63d3ab4642c30270abdecef15dee7caf8050e778f095919ca","id":"CONSTITUTION","version":"vNext","clause_count":21}`
- **F1 薄核心**：核心只认证现有窄合同；Grill/analyzer/review 重活仍在 skill。
- **F2 窄契约**：只补 lifecycle、evidence、completion、close 现有接口，不暴露内部状态。
- **F3 四材料决定推进、publication 保持结构真实**：四材料不作质量通行证；依赖/identity/write 冲突在写前拒绝。
- **F4 质量靠异源审查与人、finding 不锁死修复**：finding 允许同任务修复；正常完成仍需真实异源 review 或如实 incomplete。
- **F5 gate 谨慎添加**：不新增门禁类型，只让已有 stage completion/close 消费已有事实。
- **F6 统一外置执行记录**：沿用 task facts/outcomes；旧身份不作准入 gate。
- **F7 三处正常确认、不可逆动作独立授权**：make-decision/build-plan/verify-code 各自确认；close 动作继续单独授权。
- **F8 简单优先**：不新增 replacement、runner、store、FSM 或 public command。
- **F9 可证伪不假绿**：current identity、逐 AC selector、dirty owner、真实 reviewer 都有失败负例。
- **F10 自动化按真实收益添加**：回归合入现有测试，不造 fixture/harness；本任务用确定性全链路合同，未来真实 dogfood 仍可复用同一合同。
- **Q1 质量事实不作准入证、完成质量不降级**：缺 analyzer/逐 AC/交接可继续修复但不能完成；review 必须真实执行或如实 unavailable，provider 不可用不单独锁死完成。
- **Q2 推进、publication、完成分离**：四材料允许工作，结构错拒绝写，质量齐才完成，不可逆动作另授权。
- **Q3 异源审查加人工把关**：确定性 adapter 不冒充质量 verdict；真实生产 review 仍需异源 provider 或如实 unavailable，本任务不把合同测试写成 provider 结果。
- **S1 能用外部就不造轮子**：本任务不新建通用 skill，复用现有 Grill/spec-analyze/wh-review。
- **S2 外部技能可按项目改造合宪**：不引入外部技能；现有项目 skill 只收窄合同。
- **S3 迭代保持最新并就地检查**：复核当前项目 skill/bundle 来源与 hash，不新增另一份来源。
- **S4 自定义技能有指标系统**：沿用统一 session/review/test evidence；不新增指标 store。
- **S5 自定义技能便于子代理调用**：skill 保持独立输入输出，重审可在独立上下文运行。
- **S6 自定义技能参考成熟方案**：本任务不创建新 skill；既有 skill 的来源说明保持原位。
- **S7 一阶段一技能一工作流一文件夹**：五阶段目录和入口不变，不加第六阶段。
- **S8 自定义技能可独立调用可搬运**：portable skill 不写宿主逻辑；Codex transcript 仍留 host adapter。

## Phase P1 — 统一 session、多轮交互和阶段 outcome

### Goal

合法多轮 Talk/Clarify 和 `not_applicable` 被同一生产合同认证，真实 transcript 可生成只读需求投影；确认只约束完成声明，不作下一阶段工作许可证。

### Files

- **NEW**：N/A — 复用现有 session/interaction tests
- **MODIFY**：`runtime/evidence/fact-collector.mjs`、`runtime/evidence/codex-transcript-adapter.mjs`、`runtime/stage/stage-agent-outcome-adapter.mjs`、`skills/grill-with-docs/SKILL.md`、`skills/grill-with-docs/skill-bundle.json`、`tests/m15-codex-session-hook.test.mjs`、`tests/contract/stage-interaction-batching.test.mjs`、`tests/contract/stage-order-and-host-interaction.test.mjs`
- **DO NOT TOUCH**：`tools/host/workflowhub-codex-session-state.mjs`、`tools/host/workflowhub-stage-agent-bridge.mjs`、`runtime/adapters/local-skill-resolver.mjs`

### Tasks

- `T001：建立 session/outcome RED 合同`
- `T002：实现 rounds、not_applicable 和 transcript identity`

### Verify

ORACLE-SESSION

运行 session 合同组，RED 预期非零且命中 ORACLE-SESSION；GREEN 预期 `exit 0`，分别写入 T001/T002 卡片声明的 evidence path。

- **Oracle**：ORACLE-SESSION

### Knowledge

复用现有 transcript projection、session event 与 manifest；host/bridge 不改，adapter 聚合 rounds。

### STOP

任何方案需要第五份需求材料、新 public command 或 host/runtime 双写时停止并返回 plan。

### Done

AC-001/002/004 的全需求候选轴、Grill、identity、轮次和 `not_applicable` 正反 oracle 满足；正式 handler/三处确认由 P2/P3 继续闭合。

### Risks and rollback

风险是破坏旧单轮 event；通过读取聚合兼容。失败时回退 P1 源码，保留测试事实。

## Phase P2 — 前四阶段 analyzer 与本阶段修复闭环

### Goal

四个 production profile 检查正确材料、AC 与真实结果，并成为 current completion 的硬条件。

### Files

- **NEW**：N/A — 复用现有 analyzer/completion tests
- **MODIFY**：`skills/spec-analyze/SKILL.md`、`skills/spec-analyze/skill-bundle.json`、`workflows/make-decision/SKILL.md`、`workflows/build-spec/SKILL.md`、`workflows/build-plan/SKILL.md`、`workflows/build-code/SKILL.md`、`runtime/stage/stage-content-contracts.mjs`、`runtime/stage/stage-handlers.mjs`、`runtime/stage/stage-acceptance-policy.mjs`、`runtime/stage/completion-predicates.mjs`、`runtime/stage/stage-runner.mjs`、`runtime/evidence/canonical-evidence-validators.mjs`、`runtime/task/task-kernel-implementation.mjs`、`tests/contract/spec-analyze-completeness.test.mjs`、`tests/contract/five-stage-spec-analyze-wiring.test.mjs`、`tests/contract/stage-completion.test.mjs`、`tests/integration/vnext-official-stage-run.test.mjs`
- **DO NOT TOUCH**：`spec.md` 的已确认产品方向、历史 report

### Tasks

- `T003：建立四 profile 和 completion RED 合同`
- `T004：接入深层规则、finding 闭环和 current predicate`

### Verify

ORACLE-ANALYZER

运行 analyzer/completion 合同组；同一 ORACLE-ANALYZER 从预期非零变为 `exit 0`，分别写入 T003/T004 卡片声明的 evidence path。

- **Oracle**：ORACLE-ANALYZER

### Knowledge

直接调用现有深层规则；spec 解析只在内存存在；quality 不阻止同 task 编辑。

### STOP

需要 blocked/reopen/recovery、第二规格权威或 close 补跑 analyzer 时停止。

### Done

AC-002/003/005–010/013/021/025 的正式 handler、stage/task dependency、逐 AC selector 和当前确认满足；前四 stage 只有 current consistent 才能完成，方向变化使受影响下游事实 stale。

### Risks and rollback

风险是错误收紧历史读取；hard predicate 只用于 vNext current publication。失败时回退 P2，不改写 report。

## Phase P3 — review 绑定与四视角状态

### Goal

三种 review 入口解析一致，finding 处置可验证，统一派生与本 Phase 的核心 consumer 显示同一四视角事实；含 close 的完整十入口矩阵在 P4 后由 P5 复用现有 public baseline 做参数化自动验证。

### Files

- **NEW**：N/A — 复用现有 review/status tests
- **MODIFY**：`skills/wh-review/skill-bundle.json`、`runtime/review/stage-review-disposition.mjs`、`tools/cli/stage-runtime.mjs`、`tools/host/workflowhub-stage-agent-protocol.mjs`、`runtime/evidence/monitoring-projector.mjs`、`tests/contract/stage-skill-invocation-contract.test.mjs`、`tests/contract/review-materials-contract.test.mjs`、`tests/stage-risk-acceptance.test.mjs`、`tests/contract/status-derivation.test.mjs`
- **DO NOT TOUCH**：`runtime/adapters/local-skill-resolver.mjs`、`runtime/evidence/monitoring-diagnostics.mjs`、原始 provider reports

### Tasks

- `T005：建立 review/status RED 合同`
- `T006：修 bundle/disposition 并统一四视角 projector`

### Verify

ORACLE-STATUS

运行 review/status 合同组；ORACLE-STATUS 从预期非零变为 `exit 0`，分别写入 T005/T006 卡片声明的 evidence path。

- **Oracle**：ORACLE-STATUS

### Knowledge

resolver 已正确 fail-loud；P2 的 completion predicate 纯函数是唯一派生点，P3 consumer 只读取，不修改或另算状态。

### STOP

出现空 findings 覆盖 unavailable、猜 usage 或另一套 status store 时停止。

### Done

AC-011–014/020/024/025 的 review、派生和核心 consumer 满足；含 close 的完整 AC-022 十入口矩阵由 P5 现有测试自动验证；AC-023 保持 DEFER-002。

### Risks and rollback

风险是输出变更破坏 consumer；保持结构兼容扩展。bundle 与 runtime 分提交，可独立回退。

## Phase P4 — normal/risk close 和安全幂等重试

### Goal

close 只消费已完成质量事实，物理动作逐项真实，部分失败可安全继续且不漂白产品状态。

### Files

- **NEW**：N/A — 复用现有 delivery close tests
- **MODIFY**：`core/task-close.mjs`、`tools/cli/task-close.mjs`、`runtime/task/workspace.mjs`、`tests/integration/vnext-delivery-close.test.mjs`、`tests/integration/manual-delivery-close.test.mjs`、`tests/integration/review-test-close-freshness-matrix.test.mjs`（生产文件仅在 RED 证明缺失时改）
- **DO NOT TOUCH**：真实 main/remote、历史 close reports

### Tasks

- `T007：建立 normal/risk/partial-failure RED 合同`
- `T008：实现 close preflight、四视角和安全重试`
- `T008 增量修订：把 manual-close 从风险记录改为真实物理 close`

### 增量修订：T008 manual-close 物理动作

- `prepareDeliveryClosePlan()` 在显式 `riskClose` 下只放宽质量事实/product release 前置，并把风险理由、延期项和质量缺口冻结进同一 plan；task、snapshot、Git 基线、路径和 dirty-owner 校验保持不变。
- `executeClosePlan({ riskClose: true })` 复用现有六个 delivery executor、逐步 operation facts、独立授权消费和安全重试；物理事实全成后写 `manual-risk-close.v1`，不写 `task-close-completed.v1`。风险 evidence writer 还要认证同一 prepared plan 的六项 operation facts 和实际 Git 物理状态。
- CLI 语义固定为：`prepare --risk-close=true` → 现有 `confirm` → 五类现有 `authorize` → `manual-close --plan-hash --confirmation-ref`。普通 `execute`/`complete` 拒绝 risk plan。
- 测试只保留一个最小临时 Git/bare remote close fixture，证明未授权零写、授权后真实物理动作、风险/正常完成分离、幂等重试和 writer 不能脱离 operation facts 写入；不新增 producer-to-close 集成测试、public command、schema、store 或 FSM。

### Verify

ORACLE-CLOSE

运行 close integration 和 T008 增量的最小物理 risk-close fixture；ORACLE-CLOSE 仍要求 normal 不补质量、risk 不漂白、未授权零写、物理动作按授权执行且可安全重试，风险 evidence writer 还必须不能脱离六项 operation facts 单独写入；写入 T007/T008 卡片声明的 evidence path。

- **Oracle**：ORACLE-CLOSE

### Knowledge

复用现有 prepared close plan、authorization、operation facts、物理探针和 retry；测试只用临时 Git repo/bare remote。

### STOP

close 首次运行 analyzer/review、risk path 绕过独立授权、重放已完成非幂等动作或自动授权时停止。

### Done

AC-015/016/020/024/025 满足；direct execute 不能绕过 prepare；cleanup/dirty 有 task owner 边界；manual-close 真实执行 risk plan 但只改变 physical delivery；漂移重做 preflight/authorization。

### Risks and rollback

风险是 Git ref 并发漂移；执行前绑定 ref/plan identity。失败时回退 close 源码，临时 repo 清理。

## Phase P5 — 历史回归、确定性全链路合同和标准流程文档

### Goal

三个已知失败模式进入现有确定性回归，一个简单任务合同覆盖完整流程的正反边界，并输出可维护标准规范；不启动真实外部 WorkflowHub 会话。

### Files

- **NEW**：N/A
- **MODIFY**：`tests/e2e/vnext-five-stage-current.test.mjs`、`tests/contract/public-behavior-baseline.test.mjs`、`skills/catalog.yaml`、`docs/standard-workflow.md`、`docs/adr/0014-vnext-current-material-authority-and-stage-local-repair.md`、`CONTEXT.md`
- **DO NOT TOUCH**：T01/F13/KD 历史源目录、M14–M17 reports

### Tasks

- `T009：把历史失败语义和简单任务合同要求写入现有测试的 RED 合同`
- `T010：补齐现有回归、确定性全链路 evidence 和标准流程文档`
- `T011：执行 FINAL aggregate、architecture gate 和人工可访问性验收`

### Verify

ORACLE-FINAL

现有五阶段 E2E/公共行为基线、交互/analyzer/review/release/close 合同、`npm run smoke:skill-packages`、`env -u CODEX_THREAD_ID -u CODEX_SESSION_ID npm test`、`npm run check` 全部 `exit 0`；证据分别写入 `quality/tests/T009-history-red.json`、`quality/tests/T010-history-contract-green.json`、`quality/tests/T011-final-current-snapshot.json`，并明确不含真实 host/provider/物理 close 事实。

- **Oracle**：ORACLE-HISTORY, ORACLE-FINAL

### Knowledge

历史 table/helper 只服务现有测试；确定性合同不替代真实 reviewer，也不被写成真实 provider 结果；P5 是 `skills/catalog.yaml` 的唯一 owner，集中同步本任务影响的最终 bundle closure hash；文档必须从已通过生产行为和可读合同证据生成。

### STOP

需要修改历史源、让确定性合同测试依赖外部 provider、或新增公共入口时停止；未来真实任务仍要求异源 provider，provider unavailable 时只如实保持 incomplete，不另造替代通道。

### Done

AC-017–019 和全量 traceability 满足；历史源 hash 不变；确定性合同有五阶段、确认、review/analyzer、release/close 的正反证据，外部事实 coverage limit 清楚。

### Risks and rollback

风险是外部 reviewer 环境未在本任务验证；如实保留 unavailable/not_released/not_run，不声明真实任务完成。失败时只回退 P5 测试/文档，不影响 P1–P4。

# 实现计划：WorkflowHub 执行流与审查可靠性修复

- **Input**：`decision-log.md`（sha256: `16959dfd505a23146c894369d4bd0c1f3b986bb756d4c7c74aacbe340bebd541`）、`spec.md`（sha256: `36e469a9cdcc42ba9d11030d9a4c476411644976257f34d64c44f3bdbf80a58a`）
- **Template version**：`plan-task.v3`

## Quick Read

- **Goal**：让五阶段继续沿既有顺序执行；Talk、Grill、Clarify 使用真实批量交互；每个非 build-code 审查面按当前配置一次派发全部 provider、等待全部终态后聚合；build-code 保留声明的审查预算；每个 Phase 预先声明设计、环境、测试、STOP 和最终证据。
- **Non-goals**：不补写产品需求、不新增第五份当前材料、不新增 dashboard、review-loop、recovery、selector、rebind 或公共 `phase-*` 命令；不把 Terra 写入配置；外部仓库只修改本任务明确的 broker/config 生命周期边界，并保留其余用户 dirty hunks，不做 reset/覆盖。来源：D-003、D-006、D-008、D-010、D-011、D-012、FR-SCOPE-013。
- **Before**：文档和部分校验器已有批量交互、阶段顺序和质量事实约束，但方向审查仍有两次 public group；provider 生命周期存在固定总时限路径；WorkflowHub host bridge 只接收外部 Stage Agent 结果，不驱动真实 ask/wait；build-plan 不强制每个 Phase 的设计和证据闭环；AC 解析器曾不识别 `AC-SEQ-001` 等当前复合编号。
- **After**：实现只复用既有 skill、broker、四份材料、TaskStore、facts/index/verify 和质量目录；结构错、材料错、生命周期不明和外部依赖缺失均 fail-loud 或保持 incomplete，不把失败改写成 pass。
- **Main risk**：真实交互宿主和 3rd-review broker 在仓库外；本计划能收紧 WorkflowHub 的窄契约和事实校验，但不能在本仓库伪造外部实现。外部依赖未完成时 build-code/verify-code 必须保留真实 unavailable/incomplete。
- **Next step**：build-code 按 P1→P4 执行当前 plan/tasks，记录每个 Phase 的环境、测试、review 和证据；verify-code 只消费当前四份材料和真实 facts。

## Technical Context

### Global Constraints

- **Verified facts**：当前任务工作树为 `/Users/Hugh/Hugh/Project/workflowhub-workflowhub-execution-flow-repair-20260818`；WorkflowHub route 按 stage 读取：make-decision.direction=`kimi/coding,codex/luna`，make-decision.detail=`kimi/coding,opencode/v4flash,codex/luna`，build-plan=`pi/k3,opencode/v4flash,codex/luna`，各自 `minimum_heterologous=1`；WorkflowHub 配置快照 sha256 为 `81ae88a387800f8206cc64009ca4c553765d67902a678c5622e7f173b702afdf`，修复后 3rd-review 配置快照 sha256 为 `6c6f72f56ae83dec28068719e90d3dc8846f8b38aaa0d8164e47990512715cd3`。本计划不硬编码 provider 名称。`pi/k3` 的外部 raw `source_id` 缺失，但真实 plan review 已证明它可按 WorkflowHub profile key 派发并返回 broker provenance；`opencode/v4flash` 本轮已进入明确 failed 终态，`codex/luna` 与 `pi/k3` 返回有效结果。Terra 不在任何当前 WorkflowHub stage route，且不写入本计划。
- **Language / runtime**：Node.js `v24.14.0`、npm `11.9.0`、Vitest `2.1.9`、ESM。
- **Primary dependencies**：复用现有 `runtime/stage` 合同、`runtime/review` policy、`skills/wh-review` runner/client、外部 3rd-review broker、`TaskStore` 和 canonical evidence writer；不新增运行时依赖。
- **Storage / state**：当前权威仍只有 `decision-log.md`、`spec.md`、`plan.md`、`tasks.md`；任务事实进入既有 `facts.jsonl`、`index.json`、`quality/verify.json`、`quality/reviews/`、`quality/tests/` 和 `quality/evidence/`，不新增 authority。
- **Testing**：每个行为任务使用同一条可执行 Vitest 命令形成 RED/GREEN；build-plan 设计命令但不执行；build-code 以后按 Phase 当前快照执行并记录原始 stdout、exit code、oracle、覆盖限制和 phase evidence。
- **Target environment**：本地 WorkflowHub 候选工作树；review provider route、登录态、外部 broker 和真实 Stage Agent host 均以当次配置/运行快照为准，缺失不推断。
- **Scale / scope**：只覆盖五阶段入口、交互合同、wh-review 单组派发/聚合、provider 生命周期边界、plan/task/evidence handoff；不扩展产品页面或业务数据模型。
- **Unresolved facts**：真实 Stage Agent 交互宿主尚未在本仓库实现；3rd-review broker 修复已在外部 worktree 通过当前定向回归，但尚未形成可认证提交；材料中的 route 冲突已改为 stage-scoped route matrix，不再把 `kimi/coding` 与 `pi/k3` 误当成同一 stage。当前错误不是“profile key 不够”，而是 selector 曾把 broker result provenance 的 raw `source_id` 错当成第二个 preflight gate。处理 Stage：P1/P3 继续记录窄接口与 STOP；P2 保留 WorkflowHub profile key、route/provider/model 参数和配置快照的调用前绑定，移除的只有 raw `source_id` 重复 gate；结果边界继续校验 broker identity；外部 host/broker 未认证或 route snapshot 变化时保持 incomplete/unavailable。

## Code Anchors

- **Verified anchors**：`workflows/make-decision/steps.json` 的 `talk-round-1 → research-inputs → talk-round-2 → direction-advice → talk-round-3 → grill-with-docs → write-decision-draft → detail-advice`；`runtime/stage/stage-content-contracts.mjs` 的 interaction、plan/task、phase-evidence validators；`skills/wh-review/scripts/review-runner.mjs` 的 `planDirectionReviewRequests`、`reviewGroup`、`runReviewOnce`；`skills/wh-review/scripts/review-provider-client.mjs` 的 `runGroup`；`runtime/task/task-store.mjs` 的 facts/index/verify writer。
- **Existing interfaces**：Stage Agent 通过 `tools/host/workflowhub-stage-agent-bridge.mjs` 提交已产生的 execution/unavailable；review 通过一次 public `runGroup` 返回 provider member terminal facts；phase evidence 使用既有 `build-code-phase-evidence.v1`；TaskStore 既有 canonical quality refs。
- **Read now**：`CONSTITUTION.md`、`constitution-checklist.md`、五个 workflow `SKILL.md/steps.json`、`runtime/stage/stage-content-contracts.mjs`、`runtime/stage/stage-handlers.mjs`、`runtime/review/stage-materials.json`、`skills/wh-review` contracts/tests、当前 config snapshot。
- **Must read before task**：执行每个 Phase 前重新读取该 Phase 的修改文件、当前四份材料 hash、当前 config snapshot、相关 testing skill 和外部依赖状态；不得用旧 receipt 或旧 provider route 代替。
- **Context mode**：Full — 同时影响 workflow、skill、review protocol、runtime contract、tests 和跨仓 handoff；但每个 task 的 `boundary` 继续收窄到列明文件和 symbol。

### Reuse → Extend → New

| Capability | Decision | Existing anchor | Reason / removal condition |
| --- | --- | --- | --- |
| 用户批量交互 | extend | existing interaction contracts | 补真实 lifecycle 约束，不新增状态机 |
| 异源审查 | extend | `review-runner.mjs` | 一次 group 复用 broker，不新增 loop |
| provider 健康 | extend | external broker health | WorkflowHub 只消费窄状态，外部 owner 修复 |
| Phase 证据 | reuse | `build-code-phase-evidence.v1` | 复用现有 facts/index/verify |
| AC 解析 | extend | `stage-content-contracts.mjs` | 统一 legacy 与 namespaced AC，保持当前 spec |

## Solution Design

### Overview

P1 只收紧既有交互和阶段合同。`make-decision/steps.json` 已有正确顺序，保持不改；skill 和 contract test 明确每批独立问题一次展示、真实 ask → wait → matching reply → resume，Grill/Clarify 没有真实回复就保持 waiting/incomplete。WorkflowHub 不在 bridge 内猜测或代替用户回复；真实宿主缺失时保留 unavailable/incomplete。

P2 将方向审查从两个 public group 合并为一个 group。一次请求内让每个 provider 按“独立重建方向 → 揭示当前选择 → 同请求内挑战”执行；所有配置 provider 只调用一次，broker 返回前等待已派发 provider 进入 `completed|failed|cancelled`，再应用 `minimum_heterologous=1`。失败、空 findings、partial、unavailable 和 completion 分开保存。

P3 统一 WorkflowHub 的 deadline/liveness 协议：WorkflowHub 不注入固定总时限；`deadline_ms` 默认显式为 `null`；只有外部 broker 确认 busy 且连续 15 分钟没有可验证 progress/cursor/session 变化时才形成 `PROCESS_STALLED/unavailable`。外部 broker 是唯一 lifecycle owner；本任务只修改列明的生命周期/config/协议字节，保留外部仓其余 dirty hunks。

P4 让每个 Phase 在 plan/tasks 中先声明设计任务、环境前置、测试或 not-applicable 理由、最终证据、完成记录和 STOP；运行时校验所有复合 AC、FR/AC 双向覆盖、RED/GREEN、phase evidence 与任务完成字段。最终事实仍落在既有 `facts.jsonl`、`index.json`、`quality/verify.json` 和 quality 子目录。

### Module responsibilities

#### Workflow skills and interaction contracts

- **Responsibility**：定义阶段顺序、批量问题、真实回复匹配和方向变化回流。
- **Consumes**：现有四份材料、interaction aggregate 和 host-visible ask/reply refs。
- **Produces**：同一 task 的交互事实和大白话 handoff。
- **Must not decide**：不代替用户回答，不把 Grill/Clarify 当 review verdict，不创建新 task。

#### wh-review runner and provider protocol

- **Responsibility**：读取当次 config，做一次 group preflight、一次 public group、全终态聚合和 provenance 保存。
- **Consumes**：当前材料 snapshot、route identity、provider result v3、broker lifecycle facts。
- **Produces**：每 provider 一次 attempt、terminal member facts、canonical findings/dispositions 和 group outcome。
- **Must not decide**：不把 quorum 当质量通过，不自动重复非 build-code 审查，不把 provider 失败改写为空 findings。

#### WorkflowHub route identity

- **Responsibility**：使用 `wh_review.stages.*.initial` 中的 profile key 作为 WorkflowHub route identity，并在 dispatch 前验证 route key、`wh_review.profiles` 声明、外部 provider 存在/启用、model/effort/thinking/priority 和当次配置快照一致。
- **Consumes**：WorkflowHub 当前 route、`wh_review.profiles`、外部 provider 可执行配置、配置快照和 broker 返回的 provider identity。
- **Produces**：requested profile、group identity、dispatch 顺序和最终 provider provenance 的绑定；broker 返回的 `identity.source_id` 只作为结果事实保存并在结果边界强制校验。
- **Must not decide**：不在 WorkflowHub 复制 3rd-review 的 source alias 解析，不把外部 raw `source_id` 缺失当成 provider 不可用，不新增 identity 配置对象；但 route/profile/config 快照预检失败必须在 provider dispatch 前零调用。

#### Plan/task/evidence contract

- **Responsibility**：验证四材料、phase card、task card、RED/GREEN 和 evidence binding 的结构真实性。
- **Consumes**：当前 spec/plan/tasks bytes、hash、task facts、quality receipts。
- **Produces**：既有 canonical facts、phase evidence、index/verify 绑定和 truthful incomplete 状态。
- **Must not decide**：不以 review/test/history 事实发放工作许可证，不创建第五份当前材料。

### Interfaces, data, and lifecycle

- **Interfaces / schemas**：复用 interaction aggregate、`workflowhub-result.v3`、`build-code-phase-evidence.v1`、canonical test/review receipts、TaskStore facts/index/verify；只扩展 AC token grammar 和现有字段语义，不新增公共 schema authority。
- **Data flow / state**：读取四份材料与当次 config → preflight → 单 group/真实交互 → provider/host terminal facts（可用时）→ canonical evidence → stage handler aggregate；任何缺失或错绑都保留原事实并进入 incomplete/unavailable。host outcome 缺失只影响执行事实和完成声明，不阻止同任务从四份材料继续工作。
- **API contract**：现有 `doctor/status/run/review/verify/confirm/authorize` 不变；`prepare/start-run/publish-* /record-* /phase-*` 仍是私有实现，不新增公共流程节点。
- **Direction packet contract**：`make-decision.direction` 的一次 `run` 请求必须携带 `direction-review.v1` flow 描述：`public_request_count: 1`、`steps: [reconstruct, reveal, challenge]`、`reconstruct.visible: [raw_requirement, objective_facts]`、`reveal.visible: [current_selection, alternatives, selection_rationale, key_assumptions, independent_reconstruction]`、`challenge.input: revealed_choice + reconstruction`；broker 在同一 public request 内保存内部重建、到 reveal 前不得把选择交给 reconstruct step，最终只返回一个 provider result。WorkflowHub 只校验 packet schema、一次调用和结果顺序证据，不把两个外层调用拼成“一次”。broker 不支持该 flow 时记录 `PROTOCOL_INCOMPATIBLE/unavailable`，不退回双请求。
- **UI / external code**：用户只看到现有 Talk/Grill/Clarify 卡、review handoff 和 stage summary；provider/host 只提交事实。真实交互宿主和 3rd-review broker 的实现属于外部 owner，缺失必须可见。
- **Fail-loud behavior**：材料、route、group、output、hash、provider terminal、interaction matching、AC coverage 或 phase evidence 不满足时，写入失败或状态为 `unknown/unavailable/incomplete`；不得用空 findings、旧 receipt 或健康猜测补齐。

## File Boundary

### NEW

- `tests/contract/stage-order-and-host-interaction.test.mjs` — 只增加合同回归测试；若现有测试可完整覆盖，build-code 必须删除该新增文件并在 tasks 记录删除理由。

### MODIFY

- `workflows/make-decision/SKILL.md`
- `workflows/build-spec/SKILL.md`
- `skills/talk-with-zhipeng/SKILL.md`
- `skills/grill-with-docs/SKILL.md`
- `skills/spec-clarify/SKILL.md`
- `tests/contract/stage-interaction-batching.test.mjs`
- `tests/interaction-quality-contract.test.mjs`
- `tests/stage-interaction-contract.test.mjs`
- `skills/wh-review/scripts/review-runner.mjs`
- `skills/wh-review/scripts/third-review-host-config.mjs`
- `skills/wh-review/scripts/review-materials.mjs`
- `skills/wh-review/SKILL.md`
- `skills/wh-review/contracts/make-decision.md`
- `skills/wh-review/scripts/__tests__/make-decision-direction-reveal.test.mjs`
- `skills/wh-review/scripts/__tests__/review-runner.test.mjs`
- `skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs`
- `skills/wh-review/scripts/__tests__/simple-e2e-faults.test.mjs`
- `skills/wh-review/scripts/review-provider-client.mjs`
- `skills/wh-review/contracts/provider-protocol.md`
- `skills/wh-review/scripts/__tests__/review-provider-client-v3.test.mjs`
- `skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs`
- `skills/wh-review/scripts/__tests__/simple-reliability.red.test.mjs`
- `/Users/Hugh/Hugh/Project/3rd-review/lib/process.mjs`
- `/Users/Hugh/Hugh/Project/3rd-review/lib/health-runner.mjs`
- `/Users/Hugh/Hugh/Project/3rd-review/lib/config.mjs`
- `/Users/Hugh/Hugh/Project/3rd-review/lib/adapters/kimi.mjs`
- `/Users/Hugh/Hugh/Project/3rd-review/lib/broker.mjs`
- `/Users/Hugh/Hugh/Project/3rd-review/test/health-runner.test.mjs`
- `/Users/Hugh/Hugh/Project/3rd-review/test/process.test.mjs`
- `/Users/Hugh/Hugh/Project/3rd-review/test/kimi-wire.test.mjs`
- `/Users/Hugh/Hugh/Project/3rd-review/test/broker.test.mjs`
- `/Users/Hugh/.config/3rd-review/config.json`
- `runtime/stage/stage-content-contracts.mjs`
- `runtime/stage/stage-handlers.mjs`
- `skills/spec-plan/templates/plan-template.md`
- `skills/spec-tasks/SKILL.md`
- `skills/spec-tasks/templates/tasks-template.md`
- `workflows/build-plan/SKILL.md`
- `workflows/build-code/SKILL.md`
- `tests/stage-plan-task-contract-v3.test.mjs`
- `tests/stage-plan-task-contract.test.mjs`
- `tests/contract/phase-quality-handoff.test.mjs`
- `tests/contract/filled-plan-task-production.test.mjs`
- `tests/contract/spec-stage-artifact-closure.test.mjs`
- `tests/contract/stage-completion.test.mjs`

### DO NOT TOUCH

- `workflows/make-decision/steps.json` — 已核实顺序正确，测试其顺序而不是重写。
- `runtime/stage/stage-runner.mjs`、`runtime/stage/completion-predicates.mjs` — 现有推进/完成分离正确，除非 RED 证明具体 contract 缺口，否则不改。
- `runtime/review/canonical-review-result.mjs`、`runtime/task/task-store.mjs` — 既有 provenance、facts/index/verify consumer，禁止复制第二套 authority。
- `tools/host/workflowhub-stage-agent-bridge.mjs` — 它是接收/认证边界，不应变成新的交互控制面；真实 ask/wait 由外部 Stage Agent host 负责。
- `/Users/Hugh/Hugh/Project/3rd-review/lib/`、`/Users/Hugh/Hugh/Project/3rd-review/test/` — 只允许修改 P3 Files 中列明的生命周期/config/协议和测试区域；其余 dirty hunks 由本任务保留，不执行 reset、checkout 或覆盖。
- `/Users/Hugh/.config/workflowhub/config.json` — 只读运行时配置，以快照为准，不把当前 provider 名称写死进实现。

## Technical Decisions

### DEC-001 — 保留既有阶段顺序

- **Problem**：阶段文档、host 行为和测试曾可能漂移，用户反馈顺序错误。
- **Options**：重写 steps；在各 skill 加旁路顺序；保持 steps 为唯一顺序源并补执行合同测试。
- **Selected**：extend — 保持 `workflows/make-decision/steps.json`，补 skill/host contract tests。
- **Reason**：已有顺序是最窄权威，旁路顺序会制造双写。
- **Consequence / risk**：外部宿主仍可能不按 steps 执行；缺 host evidence 时相关真实交互质量只能 incomplete，但不阻止同任务继续修复或验收。
- **Fallback**：回到 owning workflow material，保留错误事实，不猜测下一步。
- **F10 disposition**：keep

### DEC-002 — 一次 public review group，内部完成方向盲审顺序

- **Problem**：方向审查当前两次 public group，浪费 provider 调用并破坏一次异源 findings 语义。
- **Options**：继续两次；只调用一个 provider；一次 group 内执行三段内部顺序。
- **Selected**：extend — `review-runner` 一次 `runGroup`，内部 packet 携带三段顺序。
- **Reason**：保持配置的多 provider 异源性，同时只增加一次 public request。
- **Consequence / risk**：provider 必须理解同一请求内的 reveal/challenge；协议和测试必须明确。
- **Fallback**：只保留该次 terminal group fact；不自动开启第二次同范围审查。
- **F10 disposition**：keep

### DEC-003 — deadline 与 liveness 分离

- **Problem**：固定总时限会杀死健康会话，15 分钟只应表示 busy 无可验证进展。
- **Options**：继续 wall-clock；完全不处理 stalled；由外部 broker 以 progress/cursor/session 判断，并由本任务补齐其窄生命周期边界。
- **Selected**：extend — WorkflowHub 传递 `deadline_ms:null`，消费外部 liveness terminal facts。
- **Reason**：生命周期属于 broker，WorkflowHub 只保留窄协议和真实状态。
- **Consequence / risk**：外部 worktree 尚未形成独立提交，当前任务只能报告定向回归和 dependency caveat，不能伪造发布完成。
- **Fallback**：记录 unavailable/PROCESS_TIMEOUT 原因，不把结果改成 findings 或 pass。
- **F10 disposition**：keep

### DEC-004 — 复用四份材料和现有证据底座

- **Problem**：phase 设计和证据没有稳定落盘说明，容易凭空开发。
- **Options**：新增 phase 状态文件；扩展 plan/tasks 与现有 quality refs；复制一套 evidence index。
- **Selected**：extend — 扩展 plan/tasks contract，复用 facts/index/verify/quality 目录。
- **Reason**：满足交接要求而不增加第五份 authority。
- **Consequence / risk**：tasks 卡变长，必须保持唯一完成区和 hash binding。
- **Fallback**：结构或 evidence 缺失保持 incomplete，不创建替代 projection。
- **F10 disposition**：keep

### DEC-005 — 复合 AC 与 legacy AC 统一解析

- **Problem**：当前 spec 的 `AC-SEQ-001` 无法通过旧 build-plan executable validator。
- **Options**：把 spec 改回简单编号；为不同调用点保留多套 regex；统一现有 parser grammar 并加回归测试。
- **Selected**：extend — 保留当前复合编号，统一 stage-plan/task/spec-analyze 解析。
- **Reason**：不改需求语义、不破坏 traceability，修复真实 contract mismatch。
- **Consequence / risk**：旧 fixture 需要同时保持兼容；不能扩大到任意非 AC 文本。
- **Fallback**：任何未知/非法 ID 继续 fail-loud。
- **F10 disposition**：keep

### DEC-006 — 外部 owner 明确隔离，允许本任务的窄修复

- **Problem**：真实 Stage Agent host 和 3rd-review broker 不在本仓库，且外部 worktree dirty。
- **Options**：在 WorkflowHub 复制 host/broker；无边界地修改外部 dirty 文件；只在列明生命周期/config/协议范围内修改外部实现并保留其余 dirty hunks。
- **Selected**：extend — 复用现有 bridge/broker 边界，只修正本任务明确的 deadline、health、direction-flow 和 retry guard；外部 worktree 不提交、不 reset、不覆盖其他改动。
- **Reason**：用户已授权处理根因，但宪法要求不造第二套控制面、不吞掉用户已有 dirty facts；窄修改同时满足两点。
- **Consequence / risk**：当前可证明定向回归已通过，但外部 worktree 仍未形成独立发布边界，必须保留 dependency caveat。
- **Fallback**：发布 unavailable/incomplete 事实和 owner/trigger，不假装完成。
- **F10 disposition**：keep

### DEC-007 — 以 WorkflowHub profile key 为 route identity

- **Problem**：WorkflowHub 的 `wh_review.profiles` 已经声明当前可调用 profile，但 selector 又把外部 3rd-review raw `source_id` 当成第二个 dispatch gate；`pi/k3` 因此在 provider 启动前被误判 unavailable。与此同时，FR-REV-005/AC-REV-005 仍要求 route/provider identity 预检失败时零 dispatch。
- **Options**：继续维护 raw `source_id` 作为第二套配置身份；取消所有调用前 identity 预检；保留 profile key、route/provider/model 参数和配置快照的调用前绑定，只移除 raw `source_id` 重复 gate，并在结果边界校验 broker provenance。
- **Selected**：simplify — `wh_review.profiles`/route key 是 WorkflowHub 的 route identity；保留现有 route 声明、provider 存在/启用、模型参数、优先级和 config snapshot preflight；移除 `configuredSourceId` 对外部 raw 字段的重复依赖。`sameSourceProfile` 只比较精确的 WorkflowHub profile key。3rd-review 仍负责最终 `identity.source_id`，结果缺失、错绑或 material/group 错绑时按 result invalid/unavailable 处理。
- **Reason**：不要求用户给同一 provider 维护第二个 raw 字段，也不取消真正的调用前绑定；不修改用户配置，不删除 provider，不改变“按配置全量派发、等待全部终态、保留失败事实”的质量要求。
- **Consequence / risk**：WorkflowHub 不复制 3rd-review 的 source alias 解析；profile key/config snapshot 预检失败仍必须零调用，跨 source 的最终事实由 broker result provenance 证明。若未来要改变 source alias 策略，必须先形成独立窄合同，不能偷偷加字段。
- **Fallback**：route/profile 不存在、provider 未启用、profile 参数或 config snapshot 不一致、broker 结果 identity 缺失或 material/group 错绑时仍 fail-loud/unavailable；不重试、不制造 findings。
- **F10 disposition**：keep preflight / remove only duplicate raw source gate — 复用现有 route/profile 和 canonical result，不新增控制面。

## Test Strategy

所有 RED/GREEN 成对任务使用同一命令和 oracle identity；命令只在 build-code 执行，build-plan 只设计。

| Target | Task | Role | gate_cmd / expected_exit | Oracle / evidence_path |
| --- | --- | --- | --- | --- |
| FR-SEQ-001、FR-INT-002/003 | T101 / T102 | RED / GREEN | `npx vitest run tests/contract/stage-interaction-batching.test.mjs tests/interaction-quality-contract.test.mjs tests/stage-interaction-contract.test.mjs tests/contract/stage-order-and-host-interaction.test.mjs --poolOptions.forks.singleFork --no-fileParallelism` / 1、0 | `ORACLE-P1-INTERACTION`；`quality/tests/p1-interaction-{red,green}.json` |
| FR-REV-004/006/012/013、FR-RACE-015 | T201 / T202 | RED / GREEN | `npx vitest run skills/wh-review/scripts/__tests__/make-decision-direction-reveal.test.mjs skills/wh-review/scripts/__tests__/review-runner.test.mjs skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs skills/wh-review/scripts/__tests__/simple-e2e-faults.test.mjs --poolOptions.forks.singleFork --no-fileParallelism` / 1、0 | `ORACLE-P2-GROUP`；`quality/tests/p2-review-{red,green}.json` |
| FR-REV-008/009/010/011/013 | T301 / T302 | RED / GREEN | `npx vitest run skills/wh-review/scripts/__tests__/review-provider-client-v3.test.mjs skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs skills/wh-review/scripts/__tests__/simple-reliability.red.test.mjs --poolOptions.forks.singleFork --no-fileParallelism` / 1、0 | `ORACLE-P3-LIVENESS`；`quality/tests/p3-liveness-{red,green}.json` |
| FR-PLAN-010/011、FR-QUALITY-012、FR-SCOPE-013/FR-PERM-014 | T401 / T402 | RED / GREEN | `npx vitest run tests/stage-plan-task-contract-v3.test.mjs tests/stage-plan-task-contract.test.mjs tests/contract/phase-quality-handoff.test.mjs tests/contract/filled-plan-task-production.test.mjs tests/contract/spec-stage-artifact-closure.test.mjs tests/contract/stage-completion.test.mjs --poolOptions.forks.singleFork --no-fileParallelism` / 1、0 | `ORACLE-P4-EVIDENCE`；`quality/tests/p4-evidence-{red,green}.json` |

## Rollback and Recovery

- **Global recovery rule**：只回滚当前实现字节和当前 Phase 的测试/skill 改动；保留 decision-log、spec、既有 review/provider failure、facts/index/verify 和外部依赖事实。不得 reset 用户已有 dirty worktree。
- **Irreversible boundaries**：commit、push、merge、archive、cleanup、修改外部 3rd-review 或 config 均不由本计划授权；需要独立 `authorize --op=...`。
- **Recovery owner**：当前 Phase 的 build-code owner 先保存失败 stdout/exit/oracle，再按 task boundary 回到 RED/实现；跨仓依赖由外部 owner 回传带 hash 的 terminal evidence。

### Engineering Risk Handoff

- **PLAN-RISK-001**：真实交互宿主缺失
  - **Affected IDs**：FR-INT-002、FR-INT-003、AC-INT-001 至 AC-INT-004、T101/T102
  - **Trigger**：只有文档/validator，没有真实 host-visible ask、matching reply、resume refs。
  - **Consequence**：Talk/Grill/Clarify 仍可能一次一问或无交互，不能宣称 stage 完成。
  - **Mitigation or STOP**：复用现有 bridge；要求外部 host 提供真实 lifecycle evidence；缺失则 STOP 并保持 incomplete。
  - **Handling Stage**：build-code
  - **Verification**：`stage-order-and-host-interaction` 合同测试、interaction aggregate hash 和 host refs。

- **PLAN-RISK-002**：外部 broker 仍有固定总时限或内部 retry
  - **Affected IDs**：FR-REV-008/009/010/013、AC-REV-008/009/010/014、T301/T302
  - **Trigger**：当前 broker 仍向 process 传入 wall-clock deadline，或 timeout 自动 fresh retry。
  - **Consequence**：健康 provider 被误杀、一次 review 变多次、provider failure 被掩盖。
  - **Mitigation or STOP**：WorkflowHub 只发 `deadline_ms:null`；外部 owner 修复 liveness；未验证则保留 unavailable 并 STOP。
  - **Handling Stage**：build-code
  - **Verification**：外部 broker test receipt、provider attempt count、progress/cursor/session timeline。

- **PLAN-RISK-003**：配置 route 与历史记录漂移
  - **Affected IDs**：FR-REV-004、AC-REV-004、AC-RACE-016、T201/T202
  - **Trigger**：实现硬编码 kimi/coding 或读取旧 snapshot，而当前 build-plan route 已变化。
  - **Consequence**：审查 provider 不完整或错误归因，异源性不可证明。
  - **Mitigation or STOP**：每次从 WorkflowHub route/profile 生成 route snapshot；不把外部 raw `source_id` 作为 dispatch gate；最终 broker identity 必须与 requested profile、group 和 material 绑定，不写死 provider，不读取旧 snapshot。
  - **Handling Stage**：build-code
  - **Verification**：route snapshot 与 config hash、每 provider 一次 public request、全部 terminal member facts。

- **PLAN-RISK-004**：Phase evidence 变成第二套 authority
  - **Affected IDs**：FR-PLAN-010/011、FR-QUALITY-012、AC-PLAN-011/012、AC-EVID-012
  - **Trigger**：新增 phase state file、current projection 或用 review/test receipt 代替 tasks/facts。
  - **Consequence**：重复状态、错误交接、无法区分工作可继续与质量完成。
  - **Mitigation or STOP**：只扩展 plan/tasks 完成区，证据绑定既有 quality/facts/index/verify；发现第五份 authority 立即 STOP。
  - **Handling Stage**：build-code
  - **Verification**：phase-quality-handoff 和 four-material contract tests，检查唯一 consumer/owner。

## Implementation Order

1. **P1** 先固定交互和阶段顺序合同；不改 `make-decision/steps.json`，因为它是已核实的 producer。
2. **P2** 再改 review runner/material protocol，使方向盲审、配置 provider 全量派发、一次 group 和全终态聚合有同一语义。
3. **P3** 在 P2 group contract 稳定后收紧 `deadline_ms:null` 和外部 liveness handoff；没有外部 terminal proof 不进入真实 build-code close。
4. **P4** 最后收紧 plan/tasks/phase evidence 与 AC grammar，确保计划能描述前述实现且每 Phase 有事实落盘。
5. 每个 Phase 内严格 `RED → GREEN → phase aggregate`；aggregate 只记录事实，不发放推进许可证。P4 的 aggregate 也是最终 current-snapshot aggregate，随后才进入一次 verify-code。

## Dependencies and Parallelism

- **Dependencies**：P1 → P2 → P3 → P4；P2 需要 P1 的交互/阶段边界不再产生第二 public loop；P3 需要 P2 的 provider attempt 语义；P4 需要所有前述 contracts 才能设计完整 phase evidence。
- **Parallel work**：同一 Phase 的 RED/GREEN 不并行；P1 skill 文档和测试可由独立子代理分开，但共享文件必须由主 agent 合并检查；P2/P3 不跨写同一 provider contract 文件。
- **External dependencies**：真实 Stage Agent host；`/Users/Hugh/Hugh/Project/3rd-review` 的 broker/process/health-runner 修复；当前 config snapshot。缺失语义为 `unavailable/incomplete`，不是空结果，也不是 build-code/verify-code 的进入许可证。

## Requirement and Verification Traceability

| Source | FR / AC | Phase / Task | Exact files | Gate / oracle |
| --- | --- | --- | --- | --- |
| R-001、D-001/006 | FR-SEQ-001、FR-HAND-016 / AC-SEQ-001、AC-HAND-017 | P1 / T101-T103 | `workflows/make-decision/SKILL.md`、`tests/contract/stage-order-and-host-interaction.test.mjs` | P1 command / `ORACLE-P1-INTERACTION` |
| R-002/003、D-002/003/007 | FR-INT-002/003 / AC-INT-001~004 | P1 / T101-T103 | `skills/talk-with-zhipeng/SKILL.md`、`skills/grill-with-docs/SKILL.md`、`skills/spec-clarify/SKILL.md` | P1 command / `ORACLE-P1-INTERACTION` |
| R-004、D-004/008 | FR-REV-004/006/012/013、FR-RACE-015 / AC-REV-004/006、AC-REV-012~014、AC-RACE-016 | P2 / T201-T203 | `skills/wh-review/scripts/review-runner.mjs`、`skills/wh-review/contracts/make-decision.md` | P2 command / `ORACLE-P2-GROUP` |
| F-013/015、D-010/011 | FR-REV-007~011、FR-REV-013 / AC-REV-007~011、AC-REV-014 | P3 / T301-T303 | `skills/wh-review/scripts/review-provider-client.mjs`、`skills/wh-review/contracts/provider-protocol.md` | P3 command / `ORACLE-P3-LIVENESS` |
| F-014、D-012 | FR-REV-005 / AC-REV-005 | P2 / T201-T203 | `skills/wh-review/scripts/review-runner.mjs`、`skills/wh-review/scripts/__tests__/simple-e2e-faults.test.mjs` | P2 command / `ORACLE-P2-GROUP` |
| G-007/008、D-005 | FR-PLAN-010/011 / AC-PLAN-011/012、AC-EVID-012 | P4 / T401-T403 | `runtime/stage/stage-content-contracts.mjs`、`runtime/stage/stage-handlers.mjs`、`skills/spec-tasks/templates/tasks-template.md` | P4 command / `ORACLE-P4-EVIDENCE` |
| D-003/006、Q1/Q2 | FR-QUALITY-012、FR-SCOPE-013 / AC-QUALITY-013、AC-SCOPE-014 | P4 / T401-T403 | `workflows/build-plan/SKILL.md`、`workflows/build-code/SKILL.md`、`tests/contract/phase-quality-handoff.test.mjs` | P4 command / `ORACLE-P4-EVIDENCE` |
| D-003、F7 | FR-PERM-014 / AC-PERM-015 | P4 / T401-T403 | `runtime/stage/stage-handlers.mjs`、`tests/contract/stage-completion.test.mjs` | P4 command / `ORACLE-P4-EVIDENCE` |

- **Complete current FR/AC inventory for this traceability section**：FR-SEQ-001、FR-HAND-016、FR-INT-002、FR-INT-003、FR-REV-004、FR-REV-005、FR-REV-006、FR-REV-007、FR-REV-008、FR-REV-009、FR-REV-010、FR-REV-011、FR-REV-012、FR-REV-013、FR-RACE-015、FR-PLAN-010、FR-PLAN-011、FR-QUALITY-012、FR-SCOPE-013、FR-PERM-014；AC-SEQ-001、AC-HAND-017、AC-INT-001、AC-INT-002、AC-INT-003、AC-INT-004、AC-REV-004、AC-REV-005、AC-REV-006、AC-REV-007、AC-REV-008、AC-REV-009、AC-REV-010、AC-REV-011、AC-REV-012、AC-REV-013、AC-REV-014、AC-RACE-016、AC-PLAN-011、AC-PLAN-012、AC-EVID-012、AC-QUALITY-013、AC-SCOPE-014、AC-PERM-015。该行只补齐可回放的 ID inventory，不新增需求或 authority。

## Governance Synchronization Matrix

| Governance surface | Actual files | Change / no change | Task IDs | Reason |
| --- | --- | --- | --- | --- |
| Constitution | `CONSTITUTION.md`、`constitution-checklist.md` | no change | T101-T403 | 只按现有 21 条核对，不改宪法 |
| Current materials | `decision-log.md`、`spec.md`、`plan.md`、`tasks.md` | plan/tasks change | T401-T403 | 四份材料继续唯一 authority |
| Interaction workflow | `workflows/make-decision/SKILL.md`、`workflows/build-spec/SKILL.md` | change | T101-T103 | 批量问答和顺序交接 |
| Review runtime | `skills/wh-review/scripts/review-runner.mjs`、`review-provider-client.mjs` | change | T201-T303 | 一次 group、全终态、liveness |
| Evidence store | `runtime/stage/stage-content-contracts.mjs`、`stage-handlers.mjs` | change | T401-T403 | 复用既有 facts/index/verify |

## 删除证明

- **本任务不涉及文件、公共命令、当前材料或 authority 的删除**：只收窄已被真实失败证明的 deadline/source_id 重复 gate 逻辑，并由对应 task、测试和外部事实负责验证；不删除 provider、不删除 route、不删除旧事实。

## Constitution Check

- **Constitution binding**：`{"artifact_kind":"constitution","ref":"constitution-checklist.md","hash":"368817c2910a36e63d3ab4642c30270abdecef15dee7caf8050e778f095919ca","id":"CONSTITUTION","version":"1.5.0","clause_count":21}`
- **F1**：复用既有 workflow、broker、bridge、TaskStore 和 quality store；不在核心新增交互/审查引擎。
- **F2**：交互、review、phase evidence 都通过现有窄 schema 和文件边界通信；provider 内部实现不泄漏。
- **F3**：继续工作仍只看四份材料；正式写入仍由 task/worktree/hash/结构 preflight fail-loud。
- **F4**：review 保留异源 findings/unavailable；finding 不锁死同 task 修复，不自动制造 pass。
- **F5**：只补已被真实失败证明的检查：单 group、liveness、phase evidence、AC parser；不预装新 gate。
- **F6**：facts、attempt、snapshot、provider identity 继续写外置 canonical records，不把 runner 绑定进 task。
- **F7**：保留 make-decision、build-plan、verify-code 的正常确认；commit/push/merge/archive/cleanup 另行授权。
- **F8**：不新增 replacement/recovery/selector 链；每次调用重新认证当前 config、task、workspace 和 materials。
- **F9**：provider failure、unavailable、partial、unknown、dirty 和外部缺失保持原状态；不以 `{findings:[]}` 伪造完成。
- **F10**：只复用能直接实跑的 Vitest/现有 contracts；新测试文件只有在现有覆盖不足时保留。
- **Q1**：质量事实不作工作许可证，但缺测试、逐 AC、异源 review、真实交接时禁止宣称完成。
- **Q2**：四材料推进、publication 结构、质量完成和不可逆授权分离。
- **Q3**：审查使用当前配置的异源 provider；本地 runner 只证明结构和 provenance，不自审自判。
- **S1**：复用已有 review、interaction、testing skill 和外部 broker，不造轮子。
- **S2**：只在本项目边界内按需求改造已有 skill/protocol，保留宪法约束。
- **S3**：build-code 执行前重新读取当前 skill/config；不把旧 route 当最新事实。
- **S4**：不新增自定义技能；新增测试事实进入统一 quality store。
- **S5**：重审查和外部 broker 继续由独立 provider/子代理上下文执行，主流程只收摘要。
- **S6**：沿用当前 provider protocol、Vitest contract 和已验证的外部 health 模式；不闭门复制 broker。
- **S7**：不新增阶段；每个既有 workflow 与 skill 文件夹保持一一对应。
- **S8**：skill 只依赖明确输入/输出/host contract，不绑定单一 provider、路径或登录态。

## Phase P1 — 交互生命周期与阶段顺序

### Goal

把现有 Talk、Grill、Clarify 的批量问题和真实 ask → wait → matching reply → resume 变成可验证合同，同时锁定既有 make-decision steps 顺序；没有真实 host reply 不得继续。

### Files

- **NEW**：`tests/contract/stage-order-and-host-interaction.test.mjs`
- **MODIFY**：`workflows/make-decision/SKILL.md`、`workflows/build-spec/SKILL.md`、`skills/talk-with-zhipeng/SKILL.md`、`skills/grill-with-docs/SKILL.md`、`skills/spec-clarify/SKILL.md`、`tests/contract/stage-interaction-batching.test.mjs`、`tests/interaction-quality-contract.test.mjs`、`tests/stage-interaction-contract.test.mjs`
- **DO NOT TOUCH**：`workflows/make-decision/steps.json`；它是已核实的顺序 producer。

### Tasks

- T101 RED：批量问题、真实交互生命周期和 steps 顺序回归测试先失败。
- T102 GREEN：修正 skill/contract 的批量与 lifecycle 语义，保持 host bridge 只接收真实事实。
- T103 FINAL：一次记录 P1 当前快照测试、host 依赖、AC 覆盖和 phase evidence，不新增状态 authority。

### Verify

ORACLE-P1-INTERACTION — 执行 P1 命令；T101 expected_exit 非零，T102/T103 expected_exit 0；必须同时观察批量问题、选项后果/风险、真实 reply matching、Grill/Clarify lifecycle 和 steps order；T103 另记录 ORACLE-P1-FINAL aggregate。

### Knowledge

下游得到：交互 contract 的唯一字段、host-visible evidence 要求、方向变化回 make-decision 的边界、当前宿主缺失时的 incomplete 语义。

### STOP

若只能通过 Agent 自己生成 reply、把一次一问包装成 batch、修改 steps 旁路顺序或新增公共 interaction runtime，停止并回到本 Phase owning skill/decision material。

### Done

P1 的本地测试事实、每个适用 AC 的 coverage、一次独立 review 事实和 build-plan handoff 可以先记录；P1 只有在真实 host lifecycle smoke 的 ask → wait → matching reply → resume 证据可认证时才可报告该交互质量为 completed。host evidence unavailable 只能保持 `incomplete/unavailable`，不能与真实生命周期等价；它不再是同任务继续修复或进入 verify-code 的许可证。

### Risks and rollback

风险是宿主仍未实现真实 ask/wait；保留 unavailable/incomplete 和原始 host reason，只回滚 P1 当前 skill/test 改动，不改 steps 和四份材料。

## Phase P2 — 多 provider 单组审查与方向盲审

### Goal

让每个审查面从当前 WorkflowHub route/profile snapshot 派发全部 provider，每 provider 一次 public request；raw `source_id` 不是 WorkflowHub 的重复 dispatch gate，但 route/profile/config snapshot 预检仍是零调用边界；方向审查在同一 request 的 broker-owned flow 内完成 reconstruct → reveal → challenge，等待全部 provider terminal 后再聚合，最终保存 broker identity/provenance。

### Files

- **NEW**：N/A — reuse existing review runner/test files; no new runtime authority
- **MODIFY**：`skills/wh-review/SKILL.md`、`skills/wh-review/scripts/review-runner.mjs`、`skills/wh-review/scripts/third-review-host-config.mjs`、`skills/wh-review/scripts/review-materials.mjs`、`skills/wh-review/contracts/make-decision.md`、`skills/wh-review/scripts/__tests__/make-decision-direction-reveal.test.mjs`、`skills/wh-review/scripts/__tests__/review-runner.test.mjs`、`skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs`、`skills/wh-review/scripts/__tests__/simple-e2e-faults.test.mjs`
- **DO NOT TOUCH**：`runtime/review/canonical-review-result.mjs`；现有 canonical provider facts 和 quorum semantics 先复用。

### Tasks

- T201 RED：固定 direction 两次 public group、早于全终态聚合、provider route 缺失、profile/config tuple 错绑仍发生 dispatch，或仅因外部 raw `pi/k3.source_id` 缺失就阻断 dispatch 的回归测试先失败。
- T202 GREEN：一次 public group 内按 `direction-review.v1` packet 执行 `reconstruct → reveal → challenge`，每 provider 一次调用；保留 profile-key/config snapshot preflight、零调用失败边界、全 provider dispatch/terminal wait、result provenance 校验和 namespaced AC material 选择。
- T203 FINAL：记录 P2 config snapshot、route/profile tuple、direction packet/schema/order oracle、每 provider request/terminal 状态、真实 v3 group smoke refs、group outcome、逐 finding disposition 和一次 review fact。

### Verify

ORACLE-P2-GROUP — 执行 P2 命令；检查 public `runGroup` 调用数、WorkflowHub requested profile/config snapshot identity、profile preflight failure 的零 dispatch、broker result identity/provenance 绑定、terminal member set、minimum=1 应用时点、empty findings 与 failure 区分、`direction-review.v1` packet 的 `public_request_count=1`、内部 `reconstruct → reveal → challenge` 顺序、reveal boundary 和无 auto retry；T203 另记录 ORACLE-P2-FINAL aggregate，并消费真实 v3 group attempt/result/report refs。

### Knowledge

下游得到：当次 config snapshot 与 route/profile tuple、group/material/semantic identity、provider terminal contract、真实 group attempt/result/report refs、逐 finding disposition 和 review fact 不作推进许可证的边界。approved spec 中历史 provider 名称与当前 config 不一致的事实必须继续显式保留，不能由 P2 静默重批准。

### STOP

若需要第二次同范围 public review 才得到 findings、一个 provider 结果就提前返回、profile/config tuple 预检失败后仍 dispatch、profile/group/material identity 错绑、direction flow 缺少可观察 reveal boundary、失败被改写为空 findings，或发现 route 不是当前 config，停止并保留原始 attempt；route 与 approved spec 的冲突回 owning stage 重新确认。

### Done

P2 只报告一次 configured multi-provider group 已真实完成或真实 unavailable；所有 provider terminal 后才聚合；真实 v3 group smoke 必须有 config/group/material identity、每 provider 一次调用、terminal map 和清理事实；任何 provider failure/partial/unavailable 仍可同 task 修复但不能宣称质量通过。direction flow 未被 broker 以单请求协议支持时保持 incomplete，不用两次请求假装满足。

### Risks and rollback

风险是 provider protocol 与 runner packet 不一致；保留原始 group/attempt/raw refs，回滚只限 runner/material contract/test 当前改动，不删除旧事实。

## Phase P3 — provider liveness 与无固定总时限

### Goal

把 WorkflowHub provider protocol 固定为无总时限调用，15 分钟只用于明确 busy 且无可验证 progress/cursor/session 的 stalled；外部 broker 终态和诊断必须原样进入质量事实。

### Files

- **NEW**：N/A — reuse external broker test/evidence stores
- **MODIFY**：`skills/wh-review/scripts/review-provider-client.mjs`、`skills/wh-review/contracts/provider-protocol.md`、`skills/wh-review/scripts/__tests__/review-provider-client-v3.test.mjs`、`skills/wh-review/scripts/__tests__/review-runner.test.mjs`、`skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs`、`skills/wh-review/scripts/__tests__/simple-reliability.red.test.mjs`、`/Users/Hugh/Hugh/Project/3rd-review/lib/process.mjs`、`/Users/Hugh/Hugh/Project/3rd-review/lib/health-runner.mjs`、`/Users/Hugh/Hugh/Project/3rd-review/lib/config.mjs`、`/Users/Hugh/Hugh/Project/3rd-review/lib/adapters/kimi.mjs`、`/Users/Hugh/Hugh/Project/3rd-review/lib/broker.mjs`、`/Users/Hugh/Hugh/Project/3rd-review/test/health-runner.test.mjs`、`/Users/Hugh/Hugh/Project/3rd-review/test/process.test.mjs`、`/Users/Hugh/Hugh/Project/3rd-review/test/kimi-wire.test.mjs`、`/Users/Hugh/Hugh/Project/3rd-review/test/broker.test.mjs`、`/Users/Hugh/.config/3rd-review/config.json`
- **PRESERVE**：外部仓库其余用户已有 dirty hunks；本任务只保留上述生命周期/协议/config 变更，不执行 reset、checkout 或覆盖。

### Tasks

- T301 RED：保留正数 deadline、隐式 Kimi 总时限、timeout retry 或把 unverifiable 当 terminal 的失败回归事实。
- T302 GREEN：WorkflowHub 默认发送 `deadline_ms:null`；3rd-review 配置拒绝重新启用正数 deadline；health runner 只在明确 busy 且连续 15 分钟无 progress/cursor/session 时发布 `PROCESS_STALLED` 并清理；`single_round`/`full_only` 不自动复审。
- T303 FINAL：记录 P3 protocol/test facts、修复后 external config hash 和外部 broker dependency status；外部 worktree 未提交仍作为 dependency caveat，不把定向回归写成正式发布。

### Verify

ORACLE-P3-LIVENESS — 执行 P3 命令；检查健康 progress 可以超过几分钟、unverifiable 不直接失败、busy 无变化 15 分钟才 stalled、confirmed-dead 才清理、同一正式审查没有自动重复；T303 消费外部 broker 定向回归与当前 config hash，验证 config/group/material/attempt 绑定、progress/cursor/session timeline、`PROCESS_STALLED`、取消/清理事实和 provider attempt count；没有外部提交时明确标记 dependency caveat。T303 另记录 ORACLE-P3-FINAL aggregate。

### Knowledge

下游得到：WorkflowHub 与 3rd-review 的责任边界、`deadline_ms:null` 语义、15 分钟 idle-progress 语义、修复后 external config hash、定向回归结果和外部 worktree 未提交的事实。

### STOP

若外部 broker 仍使用 fixed wall-clock deadline、timeout fresh retry、没有 progress/cursor/session 证据，或修复后 config/attempt 无法绑定，停止 build-code close，不改写结果。

### Done

P3 只有在 WorkflowHub protocol 通过、外部 broker terminal/liveness evidence 可认证、provider attempt count 符合配置且失败事实保留时才可报告完成；本次已有外部定向回归 82/82 和修复后 config hash，但外部 worktree 未提交，必须在 evidence 中保留该限制。缺失、过期或 hash/attempt 不匹配时，AC-REV-008/009 不可记为满足，阶段结论为 incomplete/unavailable。

### Risks and rollback

风险是外部 broker 仍为 dirty worktree、尚未形成独立发布边界；回滚只限本任务明确的 WorkflowHub/外部协议字节，保留其余用户 dirty hunks、dependency evidence 和失败诊断。

## Phase P4 — Phase 设计、任务完成和证据交接

### Goal

让 plan/tasks 对每个 Phase 预先声明设计任务、环境、测试/not-applicable 理由、最终证据和 STOP，并让 runtime 在发布前验证复合 AC、FR/AC coverage、RED/GREEN、任务完成区和既有 evidence bindings。

### Files

- **NEW**：N/A — reuse existing task/evidence stores
- **MODIFY**：`runtime/stage/stage-content-contracts.mjs`、`runtime/stage/stage-handlers.mjs`、`skills/spec-plan/templates/plan-template.md`、`skills/spec-tasks/SKILL.md`、`skills/spec-tasks/templates/tasks-template.md`、`workflows/build-plan/SKILL.md`、`workflows/build-code/SKILL.md`、`tests/stage-plan-task-contract-v3.test.mjs`、`tests/stage-plan-task-contract.test.mjs`、`tests/contract/phase-quality-handoff.test.mjs`、`tests/contract/filled-plan-task-production.test.mjs`、`tests/contract/spec-stage-artifact-closure.test.mjs`、`tests/contract/stage-completion.test.mjs`
- **DO NOT TOUCH**：`runtime/task/task-store.mjs`、`runtime/evidence/canonical-receipt-writer.mjs`；它们是现有 evidence consumer。

### Tasks

- T401 RED：计划/任务缺 phase design、复合 AC coverage、task completion/evidence binding 或把质量事实当 permit 的回归测试先失败。
- T402 GREEN：扩展模板、runtime validator/handler 和 stage skill，保留已有 AC、facts/index/verify、phase evidence 语义，不增加第五 authority。
- T403 FINAL：一次 current-snapshot aggregate，记录每 Phase task status、测试 exit/oracle、覆盖限制、review fact、最终 phase evidence 和外部依赖状态。

### Verify

ORACLE-P4-EVIDENCE — 执行 P4 命令；检查 inventory 中全部 20 FR、24 AC 以枚举 ID 双向覆盖，四个 Phase 八字段完整，`environment_ready` 有真实证据或有明确 not_applicable 理由，每个行为变更有同命令 RED/GREEN，完成 task 有 actual_changes/executed_commands/evidence_refs/covered_ac/review_fact/completed_at，evidence refs 能回指 facts/index/verify，quality 缺失、review unavailable 或外部依赖缺失仍为 incomplete；T403 另记录 ORACLE-P4-FINAL aggregate。

### Knowledge

下游 verify-code 只消费同一四份材料、当前 tasks 完成区和既有 quality refs；不能消费新的 phase projection、旧 snapshot、review selector 或 provider quorum。

### STOP

若为了通过校验需要伪造 AC、跳过 RED、添加第五材料、把 review/test 当准入许可证、修改外部 dirty repo 或减少后续 stage 的审查/测试要求，停止并回到对应 owning material。

### Done

P4 完成意味着 plan/tasks 结构、当前实现测试、phase evidence、逐 finding disposition 和一次独立 review 事实已绑定；不意味着外部 host/broker 缺失、route/approved-material 冲突或质量缺口存在时可以报产品完成，也不自动授权 commit/merge/cleanup。

### Risks and rollback

风险是 tasks 变成第二状态机；只保留唯一完成区，失败时回滚当前模板/validator/skill 字节并保留 facts/index/verify 原始事实。

### Phase review cards（build-code 执行合同）

每个 Phase 的 review card 是对应 T10x/T20x/T30x/T40x 任务的执行字段，不是新的状态 authority：

- **initial**：Phase 环境已 `environment_ready`、RED/GREEN 或明确 not_applicable 事实已经落盘后，针对该 Phase 当前 snapshot/直接消费者调用一次；输出写入既有 `quality/reviews/attempts/`、`results/`、`reports/`，并由 phase evidence 引用。
- **focused**：只有真实修复了该 review finding 或审查对象发生真实语义变化才允许调用一次；没有实际变化、同一 snapshot 或无可信终态时 STOP，不用复审换空 findings。
- **final integration**：T403 只对最终当前工作树调用一次独立 integration review；它不重放 Phase 历史、不复用未绑定当前 snapshot 的结果、不再开启第二次同范围审查。
- **每张 card 必须记录**：`review_identity`（stage/phase/subject/snapshot/material/config）、`trigger`、`provider_call_count`、`attempt/result/report refs`、逐 finding disposition owner/状态、`no_change_stop` 和 `no_terminal_stop`。`accepted_risk` 缺少原 finding、review ref、current snapshot 和用户确认时必须降为 `needs_human`。

## Deferred and open handoff

以下条目来自 decision-log，build-plan 只补齐下游 owner、trigger、handoff 和 close condition，不重新决定方向；若 upstream `spec.md` 尚未携带这些 ID，final spec-analyze 必须保留该 material gap，不能由 build-plan 静默改写 spec。

| ID | owner | trigger | handoff / consumer | close condition |
| --- | --- | --- | --- | --- |
| DEFER-001 | user / future make-decision task | 用户提出独立 dashboard 或 UI 页面需求 | 回到 make-decision，重新确认范围和页面边界 | 新 decision-log、spec、plan、tasks 四材料完成并经用户确认；当前不是阻塞 |
| DEFER-002 | build-spec / build-plan | 进入具体接口或 schema 设计 | build-code 只消费冻结的 spec/plan/tasks，不自行补方向 | 当前 plan 已给出实现边界；后续只需按 task 落证据，不是未决产品方向 |
| OPEN-001 | 已由 D-011/G-003/G-017 解决 | 不再重新询问 minimum=1；继续保留“全终态后再应用阈值” | P2/P3 消费既定时序 | 以当前 decision-log 事实做一致性校验；不创建新 Talk |
| OPEN-002 | build-code / config owner | 当前 `pi/k3` 原始字段缺失，WorkflowHub 把 broker provenance 当 dispatch gate | P2 T201/T202 保留 profile/config snapshot preflight，移除 raw `source_id` 重复 gate；结果边界校验 broker identity | 三个 route profile 可 selection/dispatch，route/group/material 可回指，真实 smoke 的 broker result identity 完整；preflight 失败时零 dispatch |
| OPEN-003 | 决策已由 D-008/G-002 解决；实现交给 build-code | review runner 改造方向审查公开调用次数 | P2 T202/T203 和 verify-code 复放一次 public group 事实 | 单一 group request、每 provider 一次调用、内部 blind order 和 terminal facts 均可验证 |
| OPEN-004 | build-code / owning stage | 修复前材料把不同 stage 的 route 混成一条全局 route | 已按 stage 写入 decision-log/spec/plan/tasks；P2 只消费当前 stage route 和 config hash，不新增 provider alias | stage-scoped route matrix、四材料 hash 和当前 config snapshot 一致；route conflict 已关闭 |

## Final current-snapshot aggregate strategy

- **tier / method**：`fullstack-slice-testing`；只使用当前变更范围内的 Vitest 命令和既有 contract/quality evidence。
- **scenarios**：阶段顺序、批量交互、Grill/Clarify lifecycle、single-group multi-provider、all-terminal wait、deadline/liveness、失败分类、每 Phase design/evidence、四份材料和权限边界。
- **command**: `npx vitest run tests/contract/stage-interaction-batching.test.mjs tests/interaction-quality-contract.test.mjs tests/stage-interaction-contract.test.mjs tests/contract/stage-order-and-host-interaction.test.mjs skills/wh-review/scripts/__tests__/make-decision-direction-reveal.test.mjs skills/wh-review/scripts/__tests__/review-runner.test.mjs skills/wh-review/scripts/__tests__/simple-e2e-faults.test.mjs skills/wh-review/scripts/__tests__/review-provider-client-v3.test.mjs skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs skills/wh-review/scripts/__tests__/simple-reliability.red.test.mjs tests/stage-plan-task-contract-v3.test.mjs tests/stage-plan-task-contract.test.mjs tests/contract/phase-quality-handoff.test.mjs tests/contract/filled-plan-task-production.test.mjs tests/contract/spec-stage-artifact-closure.test.mjs tests/contract/stage-completion.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected exit**：0
- **oracle**：`ORACLE-FINAL` — 当前 snapshot 下所有声明行为的 contract/test facts 完整；外部 host/broker 缺失单独显示 unavailable/incomplete，不被聚合为 pass。
- **fixtures_services**：Vitest 本地 fixtures；真实 provider、host 和 broker 由对应外部 owner 负责，未启动时不得伪造 smoke 结果。
- **evidence_path**：`quality/tests/final-current-snapshot.json`、`quality/evidence/phases/`、`quality/verify.json`、`index.json`。
- **coverage limits**：覆盖 WorkflowHub contract 和当前可运行本地路径；不替代真实外部 provider、Stage Agent host、3rd-review broker liveness 或浏览器/业务运行时证据。
- **STOP**：命令不可执行、AC 缺失、边界越界、外部 terminal 事实缺失或需要新产品决策时停止，保留原始输出。
- **execution_contract**：当前快照运行一次；失败只回受影响 task，禁止通过全量重复、旧 receipt 或不同 route 掩盖局部失败。

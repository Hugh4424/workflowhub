# 实现计划：WorkflowHub 详细计划与执行交接简化

- **Input**：`specs/workflowhub-execution-simplification-20260907/decision-log.md@12f100d17e374c88f072977a2ae5e2457c5357dce4dd1bf302974dda8bde60bf`、`specs/workflowhub-execution-simplification-20260907/spec.md@f80eab9a1bf3d7b551976505a024ae0034a001a17d70c3c9d55748167bb6b2a0`
- **Template version**：`plan-task.v4`

## Quick Read

- **Goal**：让低智力执行模型沿明确卡片完成真实 review→outcome→acceptance→verify→reflection→status 链；所有缺失、partial、失败和错绑定保持可见。
- **Non-goals**：不做模型切换/对比、页面、历史追认、全仓审计、全量回归、新 runner/public stage/第五材料/第二事实系统/latest selector；来源：D9、D10、D13、D14。
- **Before**：paired review 被顶层展平且 writer 拒 raw partial；command/service acceptance 固定 unavailable；E2E reader 固定 actor/review/confirmation missing；confirmation 时间进入去重；reflection 固定 ref 无法 A→B；usage consumer 读错层级。
- **After**：六个顺序 Phase 在同一现有事实链上修复以上断点；每个行为先 RED 后同命令 GREEN，每 Phase 独立审查，最后一次当前快照聚合验收。
- **Main risk**：`stage-runner.mjs` / `stage-handlers.mjs` 是共享核心，拆分并行修改会产生协议漂移；P3 必须串行完成 producer→consumer。
- **Next step**：build-code 从 T001 开始；任何 RED 不是目标 assertion failure，立即 STOP 修正测试环境或计划。

## Technical Context

### Global Constraints

- **Verified facts**：当前 worktree 基线 `e12d446a9e930761c50f12b5efb783466a6c39a1`；产品 `non_ui`；当前四材料齐备，尚无生产实现；build-spec 正式质量仍 `incomplete`，不影响同 task 修复，也不能称通过。
- **Language / runtime**：Node ESM；定向测试使用主仓已安装 Vitest `2.1.9`，从本 worktree 执行。
- **Primary dependencies**：复用现有 TaskHandle、Ajv schema、review broker、stage runtime、content-addressed evidence、filesystem lock；不新增依赖。
- **Storage / state**：任务外置根只写既有 `task.json`、`facts.jsonl`、`quality/**`、`index.json`；新事实不可变，旧 review/reflection/confirmation 只读。
- **Testing**：每卡使用列明文件的定向 Vitest；RED/GREEN 同命令同 oracle；fake provider/子进程托管真实 service module/export/mkdtemp HOME，禁止 live provider、真实用户配置和全量 `npm test`/`test:safe`。
- **Target environment**：当前 Codex host 与 repository-owned runtime；其他 host 仅接口兼容，未实测即写未覆盖。
- **Scale / scope**：六 Phase，核心改动集中 review、stage、task、evidence、distribution 既有模块；所有文件唯一归属一个 Phase。
- **Unresolved facts**：实际 changed_files 可能比候选更窄；每 Phase 开始按真实 diff 重算 tier。若更宽或触及 UI/新公共控制面，按 STOP 分流。

### 当前规划核查与执行边界（2026-09-08）

- 当前 decision-log 三来源均为 non_ui，build-plan 严格分析结果为 consistent；原 outcome ...03 的 step11 摘要和固定反思仍引用旧 UI 缺口，不能据此宣称当前 UI 设计缺失。不可变原件保留。
- 当前正式 stage outcome 仍 incomplete，反思为 degraded；P1/P3 修复本任务已设计的确认冻结与阶段结果/复盘消费问题。材料可执行不等于正式质量完成。
- P1 实际范围包含确认授权、持久化锁和并发；独立 test-routing-advisor 从原 feature/backend-testing 预判重判为 fullstack/fullstack-slice-testing。保留原预判，各卡执行事实记录实际路线。
- 本轮仅纠正宪法编号解释及过期现状描述，不改变方向、规格、Phase 顺序、文件边界或验收要求。

## Code Anchors

- **Verified anchors**：`simple-review-runner.mjs:combinePairedResults`；`review-record-route.mjs:recordSimpleReviewResult`；`stage-agent-outcome-adapter.mjs:publishStageAgentOutcome`；`stage-runner.mjs:authenticateStageOutcome/privateAcceptanceScenario/readCurrentE2eAcceptanceEvidence/publishVNextStage`；`stage-handlers.mjs:acceptanceExecutionFacts/e2eAcceptanceFacts`；`task-kernel-implementation.mjs:publishHumanConfirmation`；`stage-reflect.mjs:publishStageReflection`；`freshness.mjs` nested validators。
- **Existing interfaces**：public runtime 仅 `doctor/status/run/review/verify/confirm/authorize`；Stage Agent 显式提交 project/task/path/stage/attempt/agent_run + session/unavailable；plan-task.v4 acceptance tier=`browser|service|command`。
- **Read now**：decision/spec、`CONSTITUTION.md`、`constitution-checklist.md`、上述函数与对应测试。
- **Must read before task**：每卡 boundary 列出的符号前后 80 行及配对测试；不全仓扫描。
- **Context mode**：Full — 跨 review/runtime/evidence/storage seam，Lite 容易漏真实 consumer。

### Reuse → Extend → New

| Capability | Decision | Existing anchor | Reason / removal condition |
| --- | --- | --- | --- |
| paired review | extend | `runtime/review/review-record-route.mjs:recordSimpleReviewResult` | 唯一规范化边界，保留 single path；不建 store |
| outcome authentication | extend | `runtime/stage/stage-runner.mjs:authenticateStageOutcome` | producer/consumer 共用身份语义 |
| command/service acceptance | extend | `stage-runner.mjs:privateAcceptanceScenario` | 已声明 tier，只补执行与证据 |
| verify E2E binding | extend | `review-record-route.mjs:e2e_binding` | 复用普通 verify 独审输出，dispatch=0 |
| confirmation idempotency | extend | `task-kernel-implementation.mjs:publishHumanConfirmation` | 在既有锁内按语义 identity 去重 |
| reflection versioning | extend | `stage-reflect.mjs:publishStageReflection` | 新 writer 用内容 ref；旧 fixed ref 只读 |
| usage/status | extend | `stage-content-evidence.mjs`、`completion-predicates.mjs` | 回读 authenticated attempt，状态域分离 |
| new production object | new=N/A | N/A | 当前方案不新增生产对象、命令、schema 类别或持久 store |

## Solution Design

### Overview

P1 先固定四材料作者边界、真实交互、偏差分流和 confirmation/freeze。confirmation 的语义 identity 不含时间；在 TaskStore 锁内查找并复用首次事实。方向批准只绑定被批准 decision bytes/scope，下游 spec/plan 细化不反向失效。

P2 在 `recordSimpleReviewResult` 唯一入口识别 `role_results`。每个 role 按自身 policy、material、provider source 独立认证并写既有 canonical result；pair summary 只引用两侧结果。raw `available-with-failures` 规范为 semantic `available`，同时保留 `partial`、member failures、coverage 和 disposition。task-bound E2E writer 接受 P3 的 verify 复用输入，但不得发第二轮 review。

P3 串行补齐 runtime 主链：真实 review/step 由 adapter→bridge→runner→fact→status；command/service 产生逐 AC execution evidence；actor 来自认证 outcome；普通 verify 同次 review 输出绑定 execution/frozen materials；freshness 深验 ref/hash/revision/actor；reflection 使用显式内容 ref；usage 通过 authenticated attempt_ref 回读。P3 不允许多人并行改核心文件。

P4 同步五 stage skill、steps、skill-deps 和模板措辞，删重复手填真实性声明但保留每 Phase/verify 独审、功能验收、每阶段复盘。P5 更新 bundle/release/clean-install 闭包和隔离 fixture。P6 只执行一次当前快照组合验收并记录真实逐项结果。

### Module responsibilities

#### Review normalization
- **Responsibility**：role 级认证、canonical 写入、pair summary 与 retry/record 事实。
- **Consumes**：raw broker result、role policy、material/source identity。
- **Produces**：现有 canonical role refs、pair ref、partial/coverage/disposition/write status。
- **Must not decide**：阶段完成、验收、发布或物理关闭。

#### Stage execution and evidence
- **Responsibility**：认证 outcome，执行 command/service/browser 场景，写逐项 fact，绑定 verify review/confirmation，派生 freshness/status。
- **Consumes**：plan acceptance_data、current snapshot/material、authenticated Stage Agent outcome。
- **Produces**：existing quality evidence/facts/status；字段错误或缺失原因。
- **Must not decide**：产品方向、用户答复、风险接受。

#### Confirmation and reflection lifecycle
- **Responsibility**：语义幂等、并发原子、不可变多版本引用。
- **Consumes**：明确 subject/scope/reply/decision 或 current run + model judgment。
- **Produces**：content-addressed confirmation/reflection ref 与首次时间。
- **Must not decide**：用 latest 猜当前件或用一种授权替另一种。

### Interfaces, data, and lifecycle

- **Interfaces / schemas**：保留现有外形；paired branch 写 role refs；execution subject 含 tier/scenario/AC/assertions/result/executor_actor/execution_binding/material_revision/snapshot_tree；reflection ref 改为显式内容 ref，旧 fixed ref 只读。
- **Data flow / state**：producer 输入→边界校验→create-only/locked writer→fact append→current binding reader→各状态域；失败在原层保留，不重发、不补默认、不覆盖旧件。
- **API contract**：CLI 公共行为集合不变；无 HTTP API 变更。
- **UI / external code**：N/A — decision 三来源已确认 `non_ui`；不新增页面/浏览器 acceptance。实际 diff 触 UI 则停止回 owning material。
- **Fail-loud behavior**：错 task/source/material/hash/ref/revision/actor、空场景、unknown budget、half-write 分别返回稳定错误/availability，不转 success 或 generic clean。

## Critical Seam Recipes and I/O

### P1 交互与偏差字段细化

- 沿用 `ask/wait/reply/resume` 和 `reply.answers`、`remaining_question_ids` / `remaining_frontier_ids`。partial 是已回答与剩余集合的真实分区；sequence 不能因换 card/round 再问已答问题，也不能丢弃较早轮未答项。aggregate 的 `completed` 只有所有未答项被真实回复消解时才成立。
- 显式撤回复用 `reply.status=withdrawn`：必须有真实 user 来源、reply ref/hash，answers 为空、remaining 保留本轮未答项。resume 仅恢复控制；合法撤回可由 lifecycle 验证，但完成 aggregate 必须拒绝，不推断批准或已回答。缺用户回复仍未答，不用超时或推荐选项补齐。不新增 aggregate/public stage 状态。
- `material_gap` 复用 finding.target_artifact（或既有 evidence.artifact_ref）指定四材料：decision-log.md→make-decision，spec.md→build-spec，plan.md/tasks.md→build-plan；明确目标时校验 owner 匹配。未提供目标的旧一般 finding 保持现有 formal owner 合同，不从描述文本猜材料。
- 当前已正确实现的 build-spec-only 输入、non_ui 缺失/冲突及五类基本路由保留保护用例；RED 必须由尚未实现的真实行为产生，不把既有正确行为人为改坏。

### Review normalization and retry

```text
recordSimpleReviewRequest(request):
  route = resolveTrustedReviewRoute(config, request.stage, request.track, request.kind)
  material_id = authenticate(request.material)
  prior = findReusableReview(task, request, identity, material_id, requestLockHash(request, material_id))
  if prior semantically covers the same material_id + trusted route identity: return prior, dispatch=0
  if prior exists and neither material identity nor trusted route identity changed: return prior/incomplete, dispatch=0
  if prior failed attempt exists and trusted remaining retry budget is absent, unknown, or exhausted: record unavailable reason, dispatch=0
  result = dispatch once; recordSimpleReviewResult(result)
  for role_result: authenticate its policy/source/material, canonicalize, create immutable role ref
  return pair summary containing both role refs, partial/member failures/coverage/disposition/write status
```

预算边界（工程澄清）：decision/spec 的“既有预算”采用已存在的 `validateReviewBudget` review-round 规则；不另加不存在的 transport 配额。完整读取认证 task 的 canonical attempts/reports，失败也计入；当前 material_revision 的 initial/focused 各一次，phase 按 revision+phase_id 一次。pair 认证完整后作为一轮。历史缺失/损坏保持 unknown，不能回退 []；请求材料、changed=true、remaining、attempts 或 budgetContext 均不能证明实际修复或余额。初次必要审查按既有额度执行；失败后须认证 kernel 的材料 revision/tree 确有变化，或可信 route identity 确有变化，并由既有预算判定有额度。仅 route 修复不增加额度；phase 同 revision 仅代码树变化不重开额度。

输入 `available-with-failures` 且 red 可用、blue provider 失败，输出 semantic `available`, `partial=true`, 两侧 canonical refs 和 blue failure；输入错 `material_id` 输出字段级拒绝；预算事实未知输出 `unavailable` 且不自动重派。下一 Phase 只消费 canonical refs 和显式 retry/unavailable fact。

### P2 同次 broker 超时终态保真（工程修正）

实测 P1 同次 broker 已有完成成员，但 `review-provider-client.mjs` 在解析 stdout 前因 timedOut 抛错。将既有 client 及其 timeout 测试纳入 P2：owner=wh-review client；唯一 consumer=simple-review-runner；替代关系=修正现有 runGroup 终态解析，无新增协议/持久对象；保留条件=broker public run 仍使用此 client。只接受同次 stdout 经完整协议/material/provider/source 验证的终态，保留 timeout、cancelled、失败和已完成语义；碎片、stderr 或私有 state 不充当 public result。本次原 timeout 原件保留，已发现意见据原件修复，不重派同一审查。

### P2 provider source 规范化遗漏修复

P3首次审查预检发现：broker 的既有配置规则允许省略 source_id，并规范化为完整 profile id；本仓 brokerConfigId 已用该值，而 selectTrustedReviewProviderSelection 却写 null，导致同配置的真实结果被拒绝。修复属 P2 同 task 身份合同，不改来源独立性或放宽结果校验、不改 host 配置、不重派旧 P2 review。仅当 source_id 缺省时沿 broker 同一明确规则取 profile id；显式来源保持、非法显式值仍拒绝。owner=既有 skills/wh-review/scripts/third-review-host-config.mjs；唯一consumer=simple-review-runner严格provider结果身份校验及route identity；替代错误raw/null投影；删除条件=统一broker规范化入口可直接消费时内联，无新文件/schema/store。

在既有 skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs 中加强缺省来源case，经真实selection及validateProviderResultsAgainstSelection验证，并保留显式来源/非法显式值边界。补充定向命令仅此文件：`npx --no-install vitest run skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`，同命令RED→GREEN；捕获时WT冻结。原P2五文件结果保留，不因这个窄修重跑整阶段或重写旧结果。

### P2 paired 记录细化

- 既有 runner 内 `resolveSimpleReviewRouteIdentity(input, dependencies={})` 只读 helper：owner=wh-review runner，唯一职责是从可信 host config→route→selected providers/identities 算 route hash；consumer=bare CLI 与 runtime request 去重，不读取 request 自报身份/预算。返回 `{route_identity:<sha256>}`，无法读取可信配置就抛明确诊断；无新增文件/持久对象。删除条件=既有 host route resolver 直接提供等价身份时内联替换。

- 先识别 `role_results` 再做 provider 去重：red/blue 恰好各一份，pair_id、stage/track、material_id 一致；同 provider 跨角色合法，角色内部重复拒绝。每侧沿用自己的 minimum/provider_selection 和原始身份；不能从另一角色补 policy/source 或降低 quorum。
- 每个有效 completed 成员即使未达 quorum 也保存现有 provider output；失败成员、原意见、anchor 与 usage 不抹掉。只有真正满足独立覆盖的侧生成严格 canonical result；不足侧写 unavailable attempt/report，保留 semantic 输出及 coverage incomplete，不扩 canonical schema。
- 沿用现有 report 输出 pair 摘要和 role refs，无新 store/schema。返回 `{status:"recorded", pair_id, semantic_status, partial, role_results:{red:{attempt_ref,result_ref,report_ref,semantic_status,coverage},blue:{...}}, report_ref}`；coverage 只用 satisfied/incomplete，result_ref 可为 null。单侧原返回兼容。
- canonical记录准备与提交分离：先完整校验两角色，再逐件create-only；原公共结果和认证上下文派生稳定UUID形状refs，同结果半写重试补齐原路径，不另建重复意见。pair摘要仍用现有report，不扩schema。
- 复用必须确认两侧 refs/report 完整，半写不能冒充整对完成，也不能因此再次 dispatch。缺失记录的恢复消费保存原结果；更改 reason 不改变语义请求身份。Phase 三字段进入 request/result/attempt/report 的原有字段。
- 在既有 immutable report 内保存 writer-owned `budget_context={kind,phase_id,material_revision,snapshot_tree,route_identity}`；owner=runtime request writer，consumer=同 writer 的预算历史回读，后续 stage observation 消费同一事实；不新增 store/schema/公共命令。kind 来自真实 dispatch 决策，focused 不从旧记录猜测。host 函数参数传递，拒绝将 request/result JSON 自报 budgetContext 当生产者。稳定记录身份绑定此上下文；回读须核验原件/ref/身份及报告绑定，缺失旧 marker 仅可按旧合同保守识别 initial/phase。删除条件=现有 canonical attempt schema 原生承载同事实后统一迁移，不保留双写。
- round validator 的 attempts 与 canonical_attempts 都由同一完整、认证历史构造，不使用外部 supplied 字段。当前 adapter 的读异常→[] 和 focused 信息丢失不得用于前置预算判断；P3 对该 observation adapter 按同来源同步，不把它当新增推进 gate。

### P1 确认身份与冻结范围细化

- P3 caller 消除自引用：不在 decision-log 内写该文件自身 hash；只从显式 canonical confirmation、对应 quality fact、真实 approve-decision step outcome 认证后构造内存三源模型。批准 scope 读取已认证 quality fact 的 material_scope/material_scope_revision，不依赖批准 snapshot 的 decision blob 存在；当前 scope 从当前 decision bytes 独立计算。fact 必须经 confirmation ref/hash/schema/task/stage/subject/attempt 认证；step 必须真实引用同一 confirmation，缺失如实保留，由真实 producer 补输出；step 没有 scope 字段时只能在认证引用后作内存投影，不写回旧原件。P1 单元测试只证明 validator，不声称 caller 已接通。
- 历史确认扫描只对当前依赖候选 fail-loud；无关坏记录通过返回 `historical_record_errors[{ref,message}]` 明示，不篡改原件、不新增持久对象、不阻断无依赖的新确认。当前质量 fact 绑定的确认即使 JSON 已坏也必须拒绝。

- confirmation 保持 v3 外形；内存语义键比较 task/stage/subject_ref/显式 attempt_ref/step_slug/规范化 reply/decision 和批准内容范围，排除 confirmed_at。显式 attempt_ref 不同属于不同批准对象，不跨用。
- 普通 make-decision 方向确认（subject_ref 为空或指向当前 decision-log）只绑定 decision 内容；复用既有 stage-scope 快照比较函数证明该文件未变。其它 subject（包括 close/risk）及后续阶段保留原完整材料与快照约束，不把方向例外扩散为授权豁免。
- freeze 三来源复用 `material_scope=["decision-log.md"]` / `material_scope_revision`；caller 传 `currentDecisionScopeRevision`（由当前 decision bytes 计算）。三来源必须完整一致且匹配当前 decision scope；原整包 revision/tree 保留且三者一致，作为批准当时 provenance，不因下游细化与当前整包不同而拒绝。没有显式 scope 的旧输入保持原严格路径；混合/错 scope/真实方向变化拒绝。P3 将真实 caller 接到此窄参数，不由模型代填可信来源。
- 同步 `withStoreLock` 包住确认查找、create-only 与 quality fact；不在回调中再次 appendTaskFact/初始化 store 或返回 Promise。跨进程锁竞争保留明确 write conflict，caller 重试后复用胜者；不宣称所有同时调用均成功。
- 半写恢复在现有 task-store 内增加只读正规 confirmation refs 枚举 helper，唯一 consumer 为 publishHumanConfirmation；复用原件 hash/schema/身份检查后补同一 fact，不新增持久对象。目录/文件符号链接与匹配原件损坏明确拒绝；完整事实落盘失败不返回成功。移除条件为既有 TaskHandle 提供等价窄枚举时替换 helper。

### Phase 审查的当前记录方式

- 在 P2 修复 request→result 的 Phase 元数据传递前，现有 CLI `wh-review-cli.mjs run <input.json>` 只取得一次真实 bare 结果；主 stage 保存原返回，再附调用时已确定的 `subject_kind=phase`、`phase_id=P1`、`review_scope=phase`，通过 `stage-runtime.mjs review --action=record --stage=build-code --project=workflowhub --task=workflowhub-execution-simplification-20260907 --input=<包含result的JSON>` 正式记录。provider、findings、material_id、错误及 provenance 不改写，不追加 dispatch。
- writer 自行从认证当前上下文取 task/material/snapshot；不向 result 注入这些身份字段。审查运行到记录完成期间冻结工作树，材料变化则保留旧结果的真实覆盖范围。
- 当前返回 result_ref 为 `quality/reviews/results/build-code-simple-<UUID>.json`，以实际工具返回为准。原卡 content-hash 模式是规划笔误，不作为另造文件的依据。
- 若返回 raw partial 导致当前 writer 拒绝，保留一次真实返回与错误，待 P2 修 writer 后导入同一原结果；不重新索取相同审查。未正确落盘前 Phase 质量保持 incomplete。

### T009/T010 针对性测试采集分片

T010实测原四文件顺序命令超过既有capture 900000ms硬上限：acceptance单文件55/55完成耗734.902s，其余文件尚未完成。1500000ms在spawn前被API拒绝，无新test事实。保留原合并命令RED和timeout原件，不修改capture生产上限或把部分通过拼成原命令GREEN。

后续采集保持相同四文件、相同断言、相同singleFork/noFileParallelism配置，仅将运行粒度拆为两份正式capture：A=tests/contract/acceptance-execution-tier.test.mjs；B=tests/contract/verify-code-binding-derivation.test.mjs + tests/verify-requirement-replay-contract.test.mjs + tests/e2e/vnext-five-stage-current.test.mjs。每份timeoutMs=900000；两份都须child0、完整统计、同source/tree并保留原始output。原T009合并RED已包含这两份文件的目标失败，不回滚实现制造重复RED；最终报告分别列两份结果，明确原合并命令仍为timeout。这是build-plan对既有针对性检查执行粒度的修正，不扩大回归范围、不加质量许可或新控制面。分片中任一失败仍按实际缺陷修复，不凭另一片通过宣布完成。

### P3 工程合同：真实身份、执行和同次 verify

T007→T008→T009→T010 串行执行。以下只补当前 spec 的工程来源/字段/owner，不增加产品方向、公共命令、store 或生产文件。

#### Outcome authentication and freeze

- bridge 既有 `tools/host/workflowhub-stage-agent-bridge.mjs` 接收顶层必填 `attempt_id` 与独立必填 `agent_run_id`；`session.session_id` 为可选真实宿主值，存在必须非空字符串。recorder 新增必填 `agentRunId`，`sessionId` 改可选；禁止从 attempt/session 推 agentRunId，禁止把 agentRunId 写成假 session_id。
- producer 保留显式 source_id/source_family/source_ref、agent_run_id、内容 hash 与真实生命周期；session_id 只在提供时保留到 producer/lifecycle evidence。缺 session 不将完整执行降为 unavailable；缺 agent_run/source/真实事件或错 task/material/ref/hash/attempt 仍字段级拒绝。source_family 必须等于 source_id.split('/')[0]。
- runner 分别认证当前 WorkflowHub attempt、bridge 原件中的 agent_run_id 和内容绑定，不再要求 agent_run_id===attempt_id。actor 从同次 build-code outcome 的已认证真实 producer 导出 `{source_kind,source_id,run_id:agent_run_id}`，保留 outcome ref/hash。质量 incomplete 可保留真实执行身份，不能先要求质量完成才允许产生验收、造成循环；也不能因此放过缺 producer/错来源/旧 outcome。
- actor reader 支持私有显式 `{outcomeRef,outcomeHash}`，沿本次 bridge/run 或已认证 aggregate.execution_binding 中实际 ref/hash 只认证指定原件，再核对 expected sha、真实 source 和至少一条 proof。旧 incomplete 或同材料其他 outcome 不得毒化此明确执行。无 ref 的兼容调用有多个候选时明确报歧义并要求显式 ref；不按 completed 优先、时间/latest 或 currentness 扫描挑选，不删除历史原件。T008 补两条同 task 生命周期 RED：旧 incomplete 后修复源码/材料并明确新 ref；同材料 incomplete 后 completed 并明确新 ref/hash。
- 既有 `input.decision_freeze` 扩展三个显式 canonical ref：`confirmation_ref`、`quality_fact_ref`、`stage_outcome_ref`；worker 私有只读函数验证 ref/schema/typed hash、task/stage、同一确认与真实 step/proof。批准 scope 只从认证 fact 获取，不接受 caller 自报 scope；不扫描或选择 latest。
- 既有 `workflowhub-stage-outcome-evidence.v1` proof 增加 `producer_identity={kind,host,source_id,source_family,agent_run_id,source_ref,session_id?}`，由 adapter 已验证 provenance 一次投影；runner 同时比较 proof.attempt_id 和完整 producer_identity。即使 outcome ref/hash 自洽重算，沿用不匹配的旧 proof 仍拒绝。owner=既有 adapter/runner；consumer=outcome authentication/actor/status；替代缺身份的 proof 生产，不新增 proof 类别；与 canonical producer 身份原生等价统一后移除重复投影辅助代码，历史原件不回写。
- freeze 用显式 confirmation、已认证 quality fact 批准 scope、真实 approve-decision step 引用构造内存三源。当前 decision bytes 独立算 currentDecisionScopeRevision；批准时原 revision/tree 保留一致 provenance，不依赖批准 Git blob；无显式 scope 的旧输入保留严格路径，混合/错 scope/真实方向变化拒绝，不改历史原件。

T008 原四文件正式采集曾达公共 verify 入口固定 600000ms 上限（integration 单文件 597478ms），原超时 receipt/output 保留。后续相同四文件命令可用既有 canonical-receipt-writer.captureTests API 的 timeoutMs=900000，真实认证 TaskHandle/Workspace，沿原 lease/snapshot/source/receipt 机制；不修改默认、不新增公共命令、不伪造 kernel 或跳过认证。该调用只是既有采集能力的明确时间参数，记录准确原因/范围/超时事实。

T008 先以 T007 原四文件相同命令验证 RED→GREEN，再补跑 `tests/contract/verify-code-binding-derivation.test.mjs` 与 `tests/contract/acceptance-execution-tier.test.mjs` 两个共享 helper 的直接消费者；不扩大为所有 helper 消费者回归。

#### Explicit command/service execution

`acceptance_data` 保留 source/sample/scenario/tier 描述字段，新增 `execution`，由 stage-content-contracts 严格校验并投影，计入当前材料 digest：

- command：`execution={command:<非空字符串>,args:<字符串数组>,timeout_ms:<正整数>}`；认证 worktree cwd 中按 argv 执行，不接受 cwd 覆盖，不隐式 shell，不执行 source/sample/scenario 文字。
- service：`execution={module_ref:<认证 worktree 内相对模块路径>,export_name:<显式函数名>,input:<JSON>,timeout_ms:<正整数>}`；由独立子进程托管真实 module/export 调用，复用 workspace-runner 边界。固定内部 launcher 仅加载认证当前模块，不 eval 描述文字；模块实际 bytes/hash 由 runtime 绑定当前 snapshot，禁止请求自报 hash。超时/取消终止子进程及本次子进程组并确认清理；不用 Promise.race 冒充终止，不新增常驻服务或公共 CLI。
- 旧四字段材料可读，command/service 缺 execution 明确 unavailable；browser 保持既有 controlled QA 契约。运行前后核对当前 material/snapshot，发生变化保留原执行覆盖范围。

#### Private cancellation and original output bytes

主动取消仅扩展既有私有调用 `runOfficialStage(stage, context, invocation, publication, {requireStageOutcome:true, signal:controller.signal})` 的第五参数。signal 由 host 持有，闭包传 officialWorkerContext → privateAcceptanceScenario → workspace async argv 执行器；不进 invocation JSON、structuredClone 或持久化对象，不新增公共 cancel 命令。测试确认 child/grandchild/端口 ready 后 controller.abort()，与 timeout_ms 单独覆盖。workspace runner 对本次 process group TERM→有限宽限→KILL，等待 child close 和进程组退出；不能借用只服务 reflection 的 AbortController。

现有 per-AC `subject_fact.execution` 的运行字段固定为 `exit_code`（实际整数或 null）、`signal`（child close 实际 signal 或 null）、`timed_out`/`cancelled`（boolean，首个导致终止的原因决定，结束后 abort 不改写）、`stdout_ref/stdout_hash`、`stderr_ref/stderr_hash`、`cleanup:{status}`。cleanup.status 枚举 completed/failed/not_started，分别要求已核实本次拥有的进程清理完成、真实清理失败、确实未启动进程；不能无条件 completed。正常、非零、timeout、cancel、spawn失败都保存实际收到的 stdout/stderr；空输出保留零字节及其 SHA256，不由 timeout 猜 signal，也不由 exit0 推 AC通过。

原字节附件固定为既有 namespace 的 `quality/evidence/stage-quality/build-code/acceptance-stdout-<sha256>.bin` 与 `acceptance-stderr-<sha256>.bin`。它们仅是 execution 附件，不增加 subject/schema对象/store。kernel.publishCanonicalRecord 仅对这两个严格 pattern 保留原始 Buffer（包括0字节），写前验证文件名 sha 等于 Buffer SHA；其他结构化 JSON 路径保留原约束。既有 createImmutable 与 runner.publishVNextEvidence 的同 ref 重复写比较用 readRecordBytes.equals，冲突不覆盖；现有 TaskHandle.createOnlyAt/readRecordBytes 已支持 bytes，无需新增 API或权限。

freshness 的实际 read adapter（含 public status/product-release）仅对上述两种 raw ref 用 readRecordBytes，其他仍 readRecord；execution validator 实际 readBound 两附件，核对 namespace、文件名hash、字段声明hash与原bytes，不能 JSON.parse raw。缺件为 missing，字节变化/错绑定为 stale；T009 覆盖空输出、非UTF8、删除和篡改，不能仅新增ref字段而不读取。

#### Runtime-derived per-AC evidence

child 返回严格 JSON `{"entries":[{"acceptance_criterion_id":"AC-...","assertions":[{"id":"...","expected":<JSON>,"actual":<JSON>}]}]}`。每个当前声明 AC 恰一行；assertion id 非空且行内唯一，assertions 非空。runtime 对 expected/actual 做 JSON 结构相等比较（对象键序无关、数组有序、类型严格，不做字符串或数值强转），推导每断言和 AC 结果；child 自报 pass/status/result 不作权威，可在原始 stdout 保留。未知/重复/缺失 AC、损坏/空 JSON、取消、非零退出与任意失败断言均不能通过。expected 仍是可独审的执行输出，需与当前材料 oracle 对照，不把相等本身当已审查正确性。

复用 `stage-quality-evidence.v1`：每 AC 原件由 runtime 写入既有 stage-quality 路径，subject 为 AC id，subject_fact 最小扩展 `assertions[{id,expected,actual,result}]`、`execution`（tier/scenario、实际命令或模块身份、exit/signal/timeout/cleanup、原 stdout/stderr ref/hash）、`executor_actor`、`execution_binding{stage_outcome_ref,stage_outcome_hash}`；顶层补齐现有 freshness 已要求的 `material_revision`。不把 assertions 塞进 acceptance-evidence.v1 的严格 summary，不新增 schema 文件或对象类别。canonical-evidence-validators 验证 payload，freshness 认证全部嵌套来源。

状态保持各层已有枚举，不混用：

| 层 | 已有枚举 / 本次映射 |
| --- | --- |
| command/service handler 执行状态 | executed / failed / unavailable；有真实执行和业务失败为 failed，并保留原件，不再把非 executed 的 evidence 一律丢弃 |
| stage-quality subject / quality fact | passed / failed / missing；断言全相等且进程成功为 passed，实际失败为 failed，未执行/空/未知/取消不可判定为 missing，细原因保留 |
| acceptance-evidence.v1 result | pass / fail / inconclusive / deferred（当前 validator 原枚举）；沿现有 acceptanceResultForSubjectStatus：passed→pass，failed→fail，inconclusive→inconclusive，deferred/missing→deferred；unknown/skipped/cancel 的细原因保留在原件，禁止将 deferred 解释为已通过 |
| mini-task AC trace（若消费） | passed / failed / unknown / not_applicable；缺数据 unknown，N/A 仅来源于真实不适用声明；不凭 child 返回 N/A |
| acceptance_coverage | covered / missing / unknown，只说明证据覆盖，不冒充业务通过 |

逐 AC 原件经既有 acceptance 包装/fact 引用；原 stdout/stderr 在既有 quality/evidence 命名空间 create-only 保存，不另起 store。失败/取消的原因和已取得原输出可追溯，skipped/unknown/not_applicable 在摘要分开，不总 exit 覆盖 AC。没有当前真实 actor 不执行或保持 unavailable；质量 incomplete 不抹掉已认证 producer 身份，不自造 completed outcome。

#### Existing aggregate and ordinary verify binding

当前真实聚合是 `stage-quality-evidence.v1` 的 `subject=acceptance_execution`，`subject_fact.execution_items` 引用场景下每 AC 原件，`execution_binding` 引用同次 build-code outcome；“e2e_execution”只是此执行对象的语义名，不新造同名 subject/store。保留 execution_items 外形，扩展 command/service tier 及其 per-AC evidence_refs；nested freshness 从只支持 browser 改为按 tier 验证真实原件，browser 仍保留其原截图/清理合同。当前仅 completed outcome 的读取条件须拆成执行身份有效性与质量完整性，不能出现先 E2E pass 才能识别 actor 的循环。

T010 聚合引用层唯一确定：review.e2e_binding.reviewed_execution.ref 新写只指 `quality/evidence/stage-quality/build-code/acceptance_execution-<sha256(raw)>.json`，raw 使用现有 publication 序列化 bytes；外层 `quality/evidence/acceptance/build-code/acceptance_execution-<hash>.json` 继续供 typed fact 使用，其 refs[0] 必须指 review 绑定的同一 aggregate。既有 `runtime/review/schemas/attempt.schema.json` 的 reviewed_execution.ref 增加精确 aggregate 路径分支，旧 stage-outcomes 分支只读兼容且不代表逐 AC coverage；result.schema 已引用该定义，无需重复改动。reader 验证文件名 sha、实际 bytes sha 与绑定 sha 一致，不在两层之间任选。

冻结 JSON 原文的 provider_input_sha256 与实际 provider 可见材料 bundle 的 result.material_id 是不同 hash。先验证冻结原文 bytes，再沿真实 createSimpleReviewPacket/buildBundle 规则重建同次材料身份并核对返回 material_id，不沿用私有旧 E2E writer 强制二者相等的假设；不把重建变成第二次 dispatch。

T009/T010 显式输入固定为：普通 `input.request.reviewed_execution={ref,sha256,quality_fact_ref}`。ref/sha 指上述唯一 aggregate，quality_fact_ref 指现有 publisher 已返回的 `quality/facts/<qualityFactDigest>.json`，其文件名为 typed fact digest 而非 raw JSON sha。第三字段用于直接认证 typed fact → acceptance wrapper → aggregate；三层 task/stage/material/snapshot/hash 一致，aggregate 最后必须等于明确输入。aggregate 没有 wrapper 反向 ref、wrapper 含时间，不能由 aggregate 猜原 fact或scan latest。host 在计算 request/material 身份和派发前完成认证，caller 不能提交完整 e2e_binding 或未来 confirmation。

verify-code invocation 复用 `receipts.review=<ordinary result_ref>`，在现有 RECEIPT_KEYS 增加 `receipts.confirmation=quality/confirmations/<sha256>.json`；quality_review 的已有用途保留，attempt-only 不能当完整普通审查。officialWorkerContext 将本次 invocation 的明确 receipts 传给现有 readCurrentE2eAcceptanceEvidence；不遍历历史挑选执行/review/confirmation。

后置确认复用现有 public `confirm --action=decision --stage=verify-code --decision=accepted --attempt=<ordinary result_ref> --reply-text=<真实用户回复> --step-slug=<本次确认步骤>` 及 project/task 参数；现有 --attempt 映射 subject_ref，不新增 action/kind，不使用风险接收分支。确认原件的 subject_ref 必须等于 receipts.review，ordinary result 再由 canonical review/immutable records 完整认证；v3 原件没有 subject_hash，不能只凭字符串等同就宣布绑定正确。

confirmation typed fact 不另增输入字段：从明确确认原文和当前固定 stage scope，严格复用现有 publisher 的 createQualityFact 参数（kind=confirmation、subject=human_confirmation、真实decision/status、task/stage/material/snapshot、evidence ref/hash、material_scope/revision）得出确定 quality/facts/<digest>.json，只读取该精确 ref 并验证 schema/digest/fact_id/evidence。缺失/损坏仍 incomplete；不能补写伪事实、scan latest 或替代真实用户答复。

普通 verify 的真实入口是现有 `review` 的 `input.request` → recordSimpleReviewRequest → runSimpleReview/buildBundle → provider；在 materialId/requestKey 计算前把认证 execution/material/oracle 的实际 bytes 纳入 input.materials，由真实 provider bundle 消费，再在同一 create-only writer 写 binding。runner 消费本次已落盘 review，不另 dispatch。bare wh-review run 或 result-only record 保留其真实事实，但不能事后补为已审 execution；未被生产调用的私有 runTaskBoundE2eReview export 不能充当接通证据。P4 同步现有 public request 使用路径，不新增命令。

普通 E2E 独立性前置消费既有 resolveSimpleReviewRouteIdentity 已解析的可信 provider_selection：helper在原route_identity之外返回该内存selection，route hash规则不变，不重新读配置或信任request自报。若selected中没有与本次认证executor不同source family的候选，派发前明确unavailable；有异源候选则按原selection单次派发，不改名单/配置/quorum。返回后从实际已认证成员中按原顺序选首个completed且无error、source family不同于executor的成员作为单个reviewer_actor，run_id为同次result.runtime_id；普通结果仍保留全部成员并按原policy认证。仅同源成员完成时保留真实普通结果但不生成E2E binding，不能从候选身份推完成身份。owner补充既有 skills/wh-review/scripts/simple-review-runner.mjs 的该route helper；唯一consumer=ordinary request前置与现有route identity，替代重复配置读取或首个completed误当独立审查者，统一route resolver原生返回selection后可内联；无新公共字段/store/命令。

普通 verify dispatch 前冻结 diff、当前四材料及上述聚合原件 ref/hash（沿 execution_items 包含逐 AC 原件）、actor 和对应 oracle；返回后同一个 runtime/material/provider 原结果在普通 record writer 的 create-only preparation 中一次写入既有 `e2e_binding`：`frozen_material`、单个 `reviewed_execution{ref,sha256,actor}`、`reviewer_actor`。不改变 reviewed_execution 为数组，不额外 dispatch，不另造 verify-code-e2e attempt，不事后给旧 review 追加从未审过的 evidence。写入失败只重放同次原件完成原记录。confirmation 后置走已有 typed fact，freshness 认证其显式 ref 与同一 subject；不把未来 confirmation 写进先前 immutable review，不制造自引用。

#### 已有文件职责登记与保留条件

| Owner / 既有文件 | 唯一 consumer / 替代关系 / 删除或保留条件 |
| --- | --- |
| T008 host bridge：tools/host/workflowhub-stage-agent-bridge.mjs；stage-agent-outcome-adapter.mjs | runner→fact/status；替代 agent/session/attempt 混用。保留现有 bridge，直到审查通过的同等直接宿主入口替代；可选 session 不承载质量许可 |
| T008 tests/helpers/stage-outcome.mjs | 共享 proof/outcome fixture 的所有现有消费者；两者复用同一 resolvedProducer 并保留显式覆盖，替代独立构造导致的身份不一致。fixture 默认 agent=attempt 仍合法；真实生产身份不设默认。生产 adapter 可直接复用于全部测试时删除重复 fixture writer |
| T008 stage-runner/stage-handlers | freeze 三源及真实 producer 认证→当前事实；替代文本自报与不可得 blob 假设。现有认证入口直接给等价 scope/actor 时内联 helper，不持久化另一份批准对象 |
| T010 runtime/stage/stage-content-contracts.mjs | acceptance projection→私有执行器；扩展既有 execution 描述，替代猜 source。合同被现有 parser 原生统一后移除重复 helper，旧描述仅可读 |
| T010 runtime/task/task-kernel-implementation.mjs | stage-runner raw输出附件→freshness；仅publishCanonicalRecord/createImmutable两个严格.bin路径保留Buffer/空bytes/hash和create-only，P1确认逻辑不变。既有统一writer原生按声明类型处理bytes后移除此分支，无新权限/API/store |
| T010 tools/cli/stage-runtime.mjs | public freshness/product-release读原件；仅raw附件read adapter调用既有readRecordBytes，JSON原路径保留。统一reader原生支持显式bytes后移除重复分支，不新增公共命令 |
| T010 runtime/task/workspace-runner.mjs | stage-runner privateAcceptanceScenario；复用认证 argv 边界，子进程托管真实 service。现有 runner 原生支持同等执行取消时内联 helper，无新 public 命令/生产文件 |
| T010 stage-runner/stage-handlers + canonical-evidence-validators/freshness | per-AC fact、verify 和 status；替代非 browser unconditional unavailable、总 exit 推绿、失败原件丢弃。保留当前 stage-quality/acceptance 对象类别，统一 validator 后移除重复校验，不双写 |
| T010 runtime/review/schemas/attempt.schema.json | ordinary review writer/result schema/freshness；仅扩展 reviewed_execution.ref 为精确 aggregate 路径，替代新写只能指stage outcome的限制。旧路径只读，旧对象退休后删除该分支；无新schema文件或对象 |
| T010 runtime/review/review-record-route.mjs | 普通 verify→readCurrentE2eAcceptanceEvidence/freshness；扩展普通 writer 同次绑定，替代第二 attempt helper 路径。旧原件只读，普通 writer 原生统一后移除重复 helper |

共享文件按区域串行移交：P1 stage-content-contracts 已完区域保留，T010 仅 acceptance_data projection；P2 review-record-route 已完区域保留，T010 仅普通 verify binding preparation；不改 role/budget/失败语义。均为已有文件职责补登，无新增生产文件，毋须新增 move-map 文件条目。

### Confirmation, reflection, and usage

```text
confirmation_key = hash(subject + scope + step + normalized_reply + decision)  # no timestamp
withStoreLock: same key -> first ref/time; changed semantic input -> new immutable ref
reflection_key = hash(stage + run identity + executor + judgment + material/snapshot refs)
A then A -> same content ref; A then B -> new content ref; missing executor/judgment -> unavailable
usage consumer authenticates result.attempt_ref, then reads attempt.provider_attempts[].execution.usage/timing; missing stays unavailable, never 0
```

T011/T012 工程澄清（不改变 FR-REFLECT-001、AC-REFLECT-001、AC-LIFECYCLE-002）：新路径 `<stage>/<semantic-key>.json` 的 key 是上述 reflection_key，返回的 sha256 则始终是实际原件 bytes hash，两者不混用。key 排除自动 generated_at、lessons_added 及机器 degraded 包装；先由认证 outcome/context 的真实 run/executor、材料/tree 与原判断算 key，直接读取该确定 ref，命中校验 task/stage/material 与同判断后复用首次时间和全部 bytes；未命中才生成首次时间。缺真实 executor/run/judgment 为 unavailable，不借用旧 A。稳定 lesson ID 同样排除自动时间，由相同语义身份派生；失败与重试不覆盖原件、不重复 lesson、不增加 index/selector/store。并发/half-write 沿已有不可变发布和 lesson 合并机制处理，保留实际失败事实。

T011/T012来源输入固定：新写reflection v2沿已有 `judgments[].evidence_refs` 字符串显式引用本stage的真实canonical stage outcome；去重后必须唯一，0或多个明确拒绝/availability，不扫描目录或挑latest。writer从该ref重读原件，核对路径所含hash，并复用 `authenticateStageOutcomeForProjection(context,stage,ref)` 完整认证；actor/run/attempt/material从认证value派生，不信input自报身份。既有async runStageReflection函数执行时动态导入现有stage-runner认证函数，避免模块初始化时静态循环，无新增生产文件/helper控制面。公开run--action=reflect与低层writer均沿现有 `{input,now}` 即可走此链，不新增公共输入字段。runner已有已认证stageOutcome向writer传同名私有 `options.stageOutcome={ref,sha256}` 仅作额外一致性约束；不得只信wrapper.value，亦不得缺该私有参数就使公开入口永久unavailable。该参数owner=runStageEndReflection，唯一consumer=runStageReflection，替代丢失已认证来源的转接；统一显式来源读取足以保留同等约束后可内联，不新增持久对象。

复用既有 reflection v2.identity 和 judgment evidence_refs；writer 用已认证调用 context 验证 source，新原件不新增 schema 字段。runner/fact/report/lesson 显式传递实际 ref+raw sha，reader 验证 bytes/schema/task/stage 与来源引用；只有展示原件的独立报告不得凭文件名宣称执行身份已认证。报告可展示明确引用的历史原件，不扫描 hash/时间来选择 current。

usage认证必须携带实际result ref：对既有ordinary `${stage}-simple-${attempt_id}.json` 结果，verifyReviewChain核对该真实producer命名与attempt_ref/attempt.attempt_id一致，不能只因两个run的material/findings相同就借用另一份usage。测试用真实writer产生相同语义、不同runtime/usage的A/B，交换attempt_ref必须拒绝；不同material的错绑不能替代此用例。只窄化该现有ordinary命名分支，历史其他producer格式仍走原认证，不把UUID文件名要求为rawSHA、不新增schema/公共字段。owner仍为T012 stage-handlers，consumer为review observation；实际ref由现有reviewFacts读取对象传入。

T012补充直接消费者fixture：既有 tests/contract/freeze-classification-budget-usage-protocol.test.mjs 的missing-usage单元例仍自造result.provider_results，须改为canonical provider_attempts[].execution外形，保持缺失不为0的原行为断言；不为旧伪fixture保留生产fallback。owner=T012该单元例，consumer=同一纯观察函数；无新测试文件/机制。补充命令仅此文件 `npx --no-install vitest run tests/contract/freeze-classification-budget-usage-protocol.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`，其他P1/P2行为不改。

usage 的真实 producer 是 review-record-route 中 attempt.provider_attempts[].execution.usage 与 timing。verifyReviewChain 返回已认证 attempt/ref/hash，reviewFacts 的成功与 unavailable 分支都读取；completed/failed/cancelled 的真实数据保留，reused 仅表示请求复用，不伪装 provider 状态或重复累计。usage/timing 分别缺失分别 unavailable，不能补零；不改 P2 预算语义或扩大全局状态枚举。owner 为既有 stage-handlers/stage-content-evidence，consumer 为 review observation/status；替代错误 result member/顶层 usage 读取，未来同一 canonical attempt reader 原生统一后删除重复 traversal，不新增生产文件或持久对象。

旧 fixed reflection ref 与新 content ref 均须先通过 reader compatibility gate。未知新 ref 在回滚后标记 `unavailable/quarantined-read-only`，不删除、不 replay、不双写。

## UI Delivery Contract (仅 UI phase/task 使用)

- **UI applicability**：`non_ui`；N/A — 本期无 UI consumer、页面、组件或浏览器合同。
- **Component action / Real consumer / State owner / Typed ViewModel / CSS/token owner / Fixture / viewport / Browser / screenshot**：N/A — D9 明确不新增或重设计页面。
- **Coverage limits**：不覆盖浏览器、视觉、a11y 或前端性能；若 changed_files 触 UI 则 STOP。
- **N/A / unknown reason**：当前 decision-log 的三来源 applicability 为 `non_ui`。

### Design-gap handoff
- **design_status**：`acknowledged`。
- **missing_items / reason**：`[]` — non_ui 无 Design.md 要求。
- **fallback_visual_basis / visible_labels / preview_refs / fixture_refs / viewport_refs / screenshot_refs / responsive / a11y**：N/A — 无 UI。
- **constraints / assumptions**：不得以 non_ui 掩盖 command/service 执行；不生成 browser 场景。
- **rework_risk / human_confirmation**：若真实改动出现 UI consumer，当前确认不覆盖，必须回 make-decision/build-spec。
- **current_material_ref / design_revision**：当前 decision/spec refs；Design.md=`N/A — non_ui`。

## File Boundary

### NEW
- `tests/contract/workflow-synchronization-consumer.test.mjs` — P4 workflow producer/consumer behavior contract; no new production module.

### MODIFY
- `tests/contract/four-material-non-gate-contract.test.mjs`
- `tests/stage-plan-task-contract.test.mjs`
- `tests/stage-interaction-contract.test.mjs`
- `tests/contract/ui-applicability-must-ask.test.mjs`
- `tests/contract/freeze-classification-budget-usage-protocol.test.mjs`
- `runtime/stage/stage-content-contracts.mjs`
- `tests/contract/human-confirmation-v3.test.mjs`
- `tests/contract/confirmation-authorization.test.mjs`
- `tests/boundary-confirm.test.mjs`
- `runtime/task/task-kernel-implementation.mjs`
- `runtime/task/task-store.mjs`
- `tests/review/review-record-route.test.mjs`
- `tests/integration/wh-review-v3-broker-contract.test.mjs`
- `tests/review/review-policy-compatibility.test.mjs`
- `skills/wh-review/scripts/simple-review-runner.mjs`
- `skills/wh-review/scripts/wh-review-cli.mjs`
- `runtime/review/review-record-route.mjs`
- `runtime/review/canonical-review-result.mjs`
- `tests/contract/host-outcome-bridge.test.mjs`
- `tests/integration/vnext-official-stage-run.test.mjs`
- `tests/contract/stage-completion.test.mjs`
- `tests/contract/status-derivation.test.mjs`
- `runtime/stage/stage-agent-outcome-adapter.mjs`
- `runtime/stage/stage-runner.mjs`
- `runtime/stage/stage-handlers.mjs`
- `runtime/stage/completion-predicates.mjs`
- `tests/contract/acceptance-execution-tier.test.mjs`
- `tests/contract/verify-code-binding-derivation.test.mjs`
- `tests/verify-requirement-replay-contract.test.mjs`
- `tests/e2e/vnext-five-stage-current.test.mjs`
- `runtime/evidence/freshness.mjs`
- `runtime/evidence/canonical-evidence-validators.mjs`
- `tests/contract/stage-reflect.test.mjs`
- `tests/contract/stage-runner-reflection.test.mjs`
- `tests/contract/stage-runner-on-stage-end.test.mjs`
- `tests/e2e/stage-reflect-real-chain.test.mjs`
- `tests/integration/quality-store-concurrency.test.mjs`
- `runtime/stage/stage-reflect.mjs`
- `runtime/evidence/stage-content-evidence.mjs`
- `tools/cli/append-lesson-observation.mjs`
- `tools/cli/validate-stage-reflection.mjs`
- `tools/cli/build-reflection-page.mjs`
- `workflows/make-decision/SKILL.md`
- `workflows/make-decision/steps.json`
- `workflows/make-decision/skill-deps.yaml`
- `workflows/build-spec/SKILL.md`
- `workflows/build-spec/steps.json`
- `workflows/build-spec/skill-deps.yaml`
- `workflows/build-plan/SKILL.md`
- `workflows/build-plan/steps.json`
- `workflows/build-plan/skill-deps.yaml`
- `workflows/build-code/SKILL.md`
- `workflows/build-code/steps.json`
- `workflows/build-code/skill-deps.yaml`
- `workflows/verify-code/SKILL.md`
- `workflows/verify-code/steps.json`
- `workflows/verify-code/skill-deps.yaml`
- `skills/spec-plan/templates/plan-template.md`
- `skills/spec-tasks/templates/tasks-template.md`
- `core/__tests__/check-skill-closure.test.mjs`
- `tests/integration/distribution-closure.test.mjs`
- `tests/integration/runner-clean-install.test.mjs`
- `scripts/__tests__/smoke-local-skill-dispatch.test.mjs`
- `tests/integration/mutation-guards.test.mjs`
- `runtime/distribution/runner-release.mjs`
- `runtime/distribution/skill-bundle-release.mjs`
- `repo-skills.manifest.json`
- `tools/cli/repo-skills-manifest.mjs`
- `tests/contract/repo-skills-manifest.test.mjs`
- `skills/spec-plan/skill-bundle.json`
- `skills/spec-tasks/skill-bundle.json`
- `skills/wh-review/skill-bundle.json`
- `skills/catalog.yaml`
- `specs/workflowhub-execution-simplification-20260907/tasks.md`
- `quality/tests/final-execution-simplification-A.json`
- `quality/tests/output/final-execution-simplification-A.output`
- `quality/tests/final-execution-simplification-A-900.json`
- `quality/tests/output/final-execution-simplification-A-900.output`
- `quality/tests/final-execution-simplification-B.json`
- `quality/tests/output/final-execution-simplification-B.output`
- `quality/tests/final-execution-simplification-C.json`
- `quality/tests/output/final-execution-simplification-C.output`
- `quality/tests/final-execution-simplification.json`
- `quality/tests/output/final-execution-simplification.output`

### DO NOT TOUCH
- 历史 task/review/reflection/confirmation 原件。
- `core/` 历史兼容实现（列明测试除外）、公共命令集合、UI、真实 provider config/sink、m15-retirement 与仓外历史清理。

## Technical Decisions

### DEC-001 — role 级 canonical review
- **Problem**：顶层展平破坏 pair 策略且 raw partial 被 writer 拒绝。
- **Options**：修改 broker；入口 role 分支；新增 pair store。
- **Selected**：extend 现有 writer，role 级认证/写入后生成引用 summary。
- **Reason**：最小且唯一 consumer 明确；single path 继续兼容。
- **Consequence / risk**：同 provider 可跨 role，但每 role 仍须通过自身独立来源策略。
- **Fallback**：回滚 P2 代码，保留新原件只读且旧 reader fail-loud。

### DEC-002 — 一次 verify review 形成 E2E binding
- **Problem**：当前 reader 固定 missing，现成 E2E helper 会再次 dispatch。
- **Selected**：extend 普通 verify record path，把实际输出写入已有 `e2e_binding`，dispatch count 保持 0。
- **Reason**：满足 D12 且不新增第二轮审查。
- **Consequence / risk**：material 必须包含 diff、逐 AC 结果、执行原件和冻结材料。
- **Fallback**：binding 缺失即 E2E incomplete，不补旧结果。

### DEC-003 — confirmation/reflection 语义 identity
- **Problem**：时间/固定路径使相同意图重复、不同判断冲突。
- **Selected**：confirmation 锁内按语义 tuple 去重；reflection 新写内容 ref，旧 fixed ref 只读。
- **Reason**：复用既有原子 store 与显式 ref，无 latest selector。
- **Consequence / risk**：writer/reader/validator/report/lesson 必须同 Phase 原子迁移。
- **Fallback**：失败不删原件；回滚前确认旧 reader 对新 ref 明确 unavailable。

## Test Strategy

| Target | Task | Role | gate_cmd / expected_exit | Oracle / evidence_path |
| --- | --- | --- | --- | --- |
| AUTHOR/INTERACT/DEVIATE/LIFECYCLE | T001/T002 | RED/GREEN | `npx --no-install vitest run tests/contract/four-material-non-gate-contract.test.mjs tests/stage-plan-task-contract.test.mjs tests/stage-interaction-contract.test.mjs tests/contract/ui-applicability-must-ask.test.mjs tests/contract/freeze-classification-budget-usage-protocol.test.mjs tests/contract/human-confirmation-v3.test.mjs tests/contract/confirmation-authorization.test.mjs tests/boundary-confirm.test.mjs --poolOptions.forks.singleFork --no-fileParallelism` / nonzero→0 | ORACLE-P1；`quality/tests/P01-execution-simplification.json` |
| TRUTH/REVIEW/RETRY | T005/T006 | RED/GREEN | `npx --no-install vitest run tests/review/review-record-route.test.mjs tests/integration/wh-review-v3-broker-contract.test.mjs tests/review/review-policy-compatibility.test.mjs skills/wh-review/scripts/__tests__/review-provider-client-timeout.test.mjs skills/wh-review/scripts/__tests__/review-provider-client-v3.test.mjs --poolOptions.forks.singleFork --no-fileParallelism` / nonzero→0 | ORACLE-P2；`quality/tests/P02-execution-simplification.json` |
| OUTCOME/STATUS | T007/T008 | RED/GREEN | `npx --no-install vitest run tests/contract/host-outcome-bridge.test.mjs tests/integration/vnext-official-stage-run.test.mjs tests/contract/stage-completion.test.mjs tests/contract/status-derivation.test.mjs --poolOptions.forks.singleFork --no-fileParallelism` / nonzero→0 | ORACLE-P3A；`quality/tests/P03A-execution-simplification.json` |
| ACCEPT/freshness | T009/T010 | RED/GREEN | `npx --no-install vitest run tests/contract/acceptance-execution-tier.test.mjs tests/contract/verify-code-binding-derivation.test.mjs tests/verify-requirement-replay-contract.test.mjs tests/e2e/vnext-five-stage-current.test.mjs --poolOptions.forks.singleFork --no-fileParallelism` / nonzero→0 | ORACLE-P3B；`quality/tests/P03B-execution-simplification.json` |
| REFLECT/LIFECYCLE/USAGE | T011/T012 | RED/GREEN | `npx --no-install vitest run tests/contract/stage-reflect.test.mjs tests/contract/stage-runner-reflection.test.mjs tests/contract/stage-runner-on-stage-end.test.mjs tests/e2e/stage-reflect-real-chain.test.mjs tests/integration/quality-store-concurrency.test.mjs --poolOptions.forks.singleFork --no-fileParallelism` / nonzero→0 | ORACLE-P3C；`quality/tests/P03C-execution-simplification.json` |
| workflow synchronization | T013/T014 | RED/GREEN | `npx --no-install vitest run tests/contract/workflow-synchronization-consumer.test.mjs --poolOptions.forks.singleFork --no-fileParallelism` / nonzero→0 | ORACLE-P4；`quality/tests/P04-execution-simplification.json` |
| bundle/install isolation | T015/T016 | RED/GREEN | `npx --no-install vitest run tests/contract/repo-skills-manifest.test.mjs tests/integration/distribution-closure.test.mjs tests/integration/runner-clean-install.test.mjs scripts/__tests__/smoke-local-skill-dispatch.test.mjs core/__tests__/check-skill-closure.test.mjs tests/integration/mutation-guards.test.mjs --poolOptions.forks.singleFork --no-fileParallelism` / nonzero→0 | ORACLE-P5；`quality/tests/P05-execution-simplification.json` |
| all applicable AC | T017 | FINAL | `P6-A`, `P6-B`, and `P6-C` below, each `npx --no-install vitest run <listed files> --poolOptions.forks.singleFork --no-fileParallelism`, serially on one frozen snapshot / all three exit 0 | ORACLE-FINAL；three partition receipts plus `quality/tests/final-execution-simplification.json` |

T017 uses three serial capture partitions because the public capture default is 600000ms, the canonical explicit upper bound is 900000ms, and historical acceptance captures show that the 31-file union exceeds one window. The partitions are the exact 31-file union, with no overlap or omission; each command runs under the same frozen material/tree/source identity and produces an independent immutable receipt/output. The first public P6-A attempt is retained at `final-execution-simplification-A.json` as a 600000ms timeout; the authenticated 900000ms retry is recorded separately at `final-execution-simplification-A-900.json`. A failed or timed-out partition remains failed (exit 124 for timeout) and the aggregate cannot claim completion.

```text
P6-A: npx --no-install vitest run tests/contract/acceptance-execution-tier.test.mjs core/__tests__/check-skill-closure.test.mjs tests/contract/repo-skills-manifest.test.mjs tests/integration/distribution-closure.test.mjs tests/integration/runner-clean-install.test.mjs scripts/__tests__/smoke-local-skill-dispatch.test.mjs tests/integration/mutation-guards.test.mjs --poolOptions.forks.singleFork --no-fileParallelism
P6-B: npx --no-install vitest run tests/contract/four-material-non-gate-contract.test.mjs tests/stage-plan-task-contract.test.mjs tests/stage-interaction-contract.test.mjs tests/contract/ui-applicability-must-ask.test.mjs tests/contract/freeze-classification-budget-usage-protocol.test.mjs tests/contract/human-confirmation-v3.test.mjs tests/contract/confirmation-authorization.test.mjs tests/boundary-confirm.test.mjs tests/contract/host-outcome-bridge.test.mjs tests/integration/vnext-official-stage-run.test.mjs tests/contract/stage-completion.test.mjs tests/contract/status-derivation.test.mjs tests/contract/workflow-synchronization-consumer.test.mjs --poolOptions.forks.singleFork --no-fileParallelism
P6-C: npx --no-install vitest run tests/review/review-record-route.test.mjs tests/integration/wh-review-v3-broker-contract.test.mjs tests/review/review-policy-compatibility.test.mjs tests/contract/verify-code-binding-derivation.test.mjs tests/verify-requirement-replay-contract.test.mjs tests/e2e/vnext-five-stage-current.test.mjs tests/contract/stage-reflect.test.mjs tests/contract/stage-runner-reflection.test.mjs tests/contract/stage-runner-on-stage-end.test.mjs tests/e2e/stage-reflect-real-chain.test.mjs tests/integration/quality-store-concurrency.test.mjs --poolOptions.forks.singleFork --no-fileParallelism
```

## Deletion Proofs

- 本计划不删除生产对象、公共入口、历史质量原件或 UI；当前 Phase 只新增/修改已列出的 consumer、合同、测试、技能和分发同步文件。
- 任意实现阶段若实际需要删除字段、文件或公共行为，必须先证明当前真实 consumer 已迁移、旧 reader 的兼容/隔离结果可读，并在对应 Phase review 中保留删除前后证据；没有证明就停止该卡并回 build-plan。
- 该声明是本计划的删除适用性证明，不把“未删除”推断成测试或质量通过。

## Rollback and Recovery

- **Compatibility gate**：启用新 reflection/confirmation writer 前，定向证明 current reader 同时接受旧 fixed ref 与新显式 content ref；回滚后遇到未知新 ref 必须返回 `unavailable/quarantined-read-only`，不删除、不 replay、不双写。

- **Global recovery rule**：只回滚当前 Phase 实现与夹具；四材料及任何已发布质量原件保留。修正计划内遗漏先同步 plan/tasks；行为或状态改变回 build-spec。
- **Irreversible boundaries**：commit/push/merge/archive/cleanup 均不在 build-plan 授权；build-code 需按后续明确授权处理。
- **Recovery owner**：build-code 执行 agent 处理当前卡；工程接口变化回 build-plan owner；产品/行为变化回 make-decision/build-spec owner。

### Engineering Risk Handoff

- **Affected IDs**：D1–D14、全部 FR/AC、T001–T017；各 PLAN-RISK 下再缩窄。
- **Trigger**：目标 oracle 不能以现有接口实现、出现新控制面/双写/latest selector、changed_files 越界或真实 consumer 与材料冲突。
- **Consequence**：停止受影响动作；已生成事实保持真实状态，不把缺失或失败改写为通过。
- **Mitigation or STOP**：先 RED 固定 consumer 行为，再最小 GREEN；同文件串行；每 Phase 记录独立 review fact；触发越界即停止受影响动作。
- **Handling Stage**：需求/方向→make-decision；合同→build-spec；任务拆分→build-plan；实现缺陷→当前 build-code Phase。
- **Verification**：各 Phase 定向 oracle、独立 review 和 T017 current-snapshot aggregate。

- **PLAN-RISK-001 shared runtime drift**：affected D11/D12/D14、T007–T012；若需超出已登记共享区域或并行修改，STOP；contracts/review writer 仅按已登记区域在 P1/P2 完成后移交 P3 串行扩展；由同命令正反例验证。
- **PLAN-RISK-002 false review green**：affected D4/D8/D10、T005–T010；已有语义不得因成员失败/记录失败丢失，也不得为 clean 重派；检查四分支和 dispatch count。
- **PLAN-RISK-003 immutable migration**：affected D6/D13、T011/T012；A→B 或旧 fixed ref 回读失败时 STOP；writer/reader/report/lesson 同批修复，旧件只读。
- **PLAN-RISK-004 fake E2E**：affected D5/D12、T009/T010/T017；command exit 0、空场景、默认 actor 或旧 review 不得逐 AC 推绿；用 execution subject 和 nested freshness 验证。
- **PLAN-RISK-005 external availability**：affected D10、所有 Phase review；必要独审全无语义时保留 unavailable/范围/影响/补审办法，只在 route/material 真修且现有预算有效时重试；不冻结同 task 修复，但不能完成质量结论。

## Implementation Order

P1 confirmation/material contract → P2 review canonical producer → P3 outcome/E2E/reflection/status consumers → P4 workflow instructions → P5 distribution/clean install → P6 final current-snapshot acceptance。P1–P5 每 Phase 后执行一次真实独立审查并处理 findings；任何 Phase 的审查不可用如实记录，不当工作许可证，也不称质量通过。

## Dependencies and Parallelism

- **Dependencies**：P2 role refs 是 P3 outcome/E2E 输入；P3 的实际 import/ref 形状决定 P4/P5；P6 读所有前序事实。
- **Parallel work**：P1 与 P2 理论文件独立，但为低智力模型降低上下文切换，计划串行；P3 内部禁止并行。P4 文档可按互不重叠 workflow 分派，但主执行者须统一核对同一合同。
- **External dependencies**：正式每 Phase/verify 独审可能 unavailable；absence semantics 按 PLAN-RISK-005，不做 live provider 预演。

## Requirement and Verification Traceability

| Source / decision | FR | AC | Phase / Task | Depends on | Exact files | Command / oracle |
| --- | --- | --- | --- | --- | --- | --- |
| R3/R4/U1/U11; D1/D2/D7/D9/D13/D14 | AUTHOR, INTERACT, DEVIATE, COMPAT, LIFECYCLE | AUTHOR, INTERACT, DEVIATE, COMPAT, LIFECYCLE-001 | P1/T001–T004 | none | stage-content-contracts; task kernel/store | P1 / ORACLE-P1 |
| R1/R2/R5/U4/U10/U12/U13; D3/D4/D8/D10/D11/D14 | TRUTH, REVIEW, RETRY | TRUTH, REVIEW-001/002, RETRY | P2/T005–T006 | P1 | simple runner; review route; canonical; CLI | P2 / ORACLE-P2 |
| U12/U13; D3/D8/D10/D11/D14 | OUTCOME, TRUTH, STATUS | OUTCOME, PROTECT-001/002, STATUS | P3/T007–T008 | T006 | bridge; adapter; runner; handlers; completion | P3a / ORACLE-P3A |
| U5/U7/U12/U13; D5/D8/D10/D12/D14 | ACCEPT, OUTCOME, PROTECT, STATUS | ACCEPT-001/002, OUTCOME, PROTECT-001/002, STATUS | P3/T009–T010 | T008 | contracts; workspace-runner; runner; handlers; freshness; ordinary review writer | P3b / ORACLE-P3B |
| U6/U12/U13; D6/D8/D13/D14 | REFLECT, LIFECYCLE, PROTECT | REFLECT, LIFECYCLE-002, USAGE, STATUS | P3/T011–T012 | T010 | stage-reflect; validators; evidence; reports | P3c / ORACLE-P3C |
| all current decisions | all FR | all AC | P4/T013–T014 | T012 | workflows/skills/templates | P4 / ORACLE-P4 |
| D9/D11/D14 | COMPAT, PROTECT | COMPAT, PROTECT-001..004 | P5/T015–T016 | T014 | distribution/catalog/fixture | P5 / ORACLE-P5 |
| D1–D14 | all 13 FR | all 20 AC | P6/T017 | T016 | tests + task evidence only | FINAL / ORACLE-FINAL |

## Governance Synchronization Matrix

| Governance surface | Actual files | Change / no change | Task IDs | Reason |
| --- | --- | --- | --- | --- |
| constitution | `CONSTITUTION.md`, `constitution-checklist.md` | no change | all | 当前设计沿用22条，不新增原则 |
| stage skills | `workflows/*/{SKILL.md,steps.json,skill-deps.yaml}` | change | T013–T014 | 真实 consumer 指引同步 |
| review skill | `skills/wh-review/scripts/*` | change | T005–T006 | broker output 唯一规范化入口 |
| plan/tasks templates | relevant existing template/contract only | change if actual consumer requires | T001–T004/T013–T014 | 不复制完整行为定义 |
| tests | listed targeted files | change | paired cards | 行为正负与 seam oracle |
| docs/UI | README/UI | no change | N/A | non_ui 且非目标 |

## Independent Build-plan Review Disposition

正式三来源审查结果：`quality/reviews/results/build-plan-simple-ae952a67-609f-497b-94fc-7e0d64aff3b8.json`；三 provider 均完成，15 条 finding 只处置一次，不因修订重派。

| Finding | Disposition |
| --- | --- |
| F-059333947e45 / F-27817ebb99d2 / F-6fc1f2b8ecf6 | fixed：T017 显式逐项映射 20 AC；browser N/A 与 command/service E2E 必需分开 |
| F-1a44bebe452b | fixed：P5 纳入 manifest producer、CLI consumer 与 clean-install contract test |
| F-1db7b2081c00 | fixed：T006 明确 retry identity、trusted route、budget fact 与 fail-closed 输出 |
| F-50367802e70d | fixed：freeze test 仅 P1 owner；closure test 仅 P5 owner |
| F-541213801806 | fixed：writer 激活前兼容 gate；回滚后 unknown new ref 显式 unavailable/quarantined-read-only |
| F-74a0eac0ea05 | fixed：T009/T010 补原缺陷捕获、非行为无需伪 RED、一次逆序敏感性 |
| F-77c97c87db27 | fixed：重复风险块合并为一份六字段 handoff |
| F-8b5f60305b5a | fixed 部分：工作树命令改 repo-relative 并拆分；provider 包中的 `<host-path-redacted>` 是脱敏产物，不代表工作树命令 |
| F-8c85f473ec3e | fixed：六个关键 seam 补伪代码和成功/partial/rejected/unavailable I/O |
| F-d7ecede29770 | fixed：每个 Phase 最后一张 GREEN 卡加入可执行 review packet/command/ref/owner/unavailable 语义 |
| F-ec12c10695e2 | fixed：P4 改为 RED/GREEN consumer-level behavior pair |
| F-0f8dee293288 / F-a32d2ac08e0a | rejected：finding 比较的是 provider 脱敏包 bytes；工作树 canonical refs 由本地 hash-bound validator 核验，不能用脱敏 hash 覆盖 |

## Constitution Check

- **Constitution binding**：`{"artifact_kind":"constitution","ref":"constitution-checklist.md","hash":"bf61be16d4d67c582258e7731a335cdca20749764d5a18607f4cd8e98c26ebcb","id":"CONSTITUTION","version":"current-22-clause","clause_count":22}`
- **F1 薄核心**：编排保留在 stage，审查和测试执行复用独立技能；P3 只修现有生产消费边界。
- **F2 窄契约**：沿现有 review/outcome/acceptance/confirmation/reflection 对象扩展，不暴露内部 TaskStore 细节。
- **F3 四材料决定推进，正式发布保持结构真实**：当前四材料支持同 task 实施；错 task/worktree/runtime/hash 的写入仍明确拒绝。
- **F4 质量靠异源审查与人，finding 不锁死修复**：各 Phase 与 verify 独审保留；有效 finding 同任务修复，真实风险由用户决定。
- **F5 gate 谨慎添加**：不新增 stage、准入证或审查 pass gate；测试与审查仅产生事实。
- **F6 统一外置执行记录**：执行事实经既有 writer 写入认证 task；快照须来自真实内容，dirty 不伪称 HEAD；Git 交付需独立授权。
- **F7 三处正常确认与不可逆操作独立授权**：保留方向、计划、verify 确认；本任务 non_ui 不加 UI 确认，build-code 不增加日常确认。
- **F8 简单优先**：复用每次调用认证和当前模块，不复制 runner 或新增 replacement 链。
- **F9 可证伪不假绿**：每项结果有正反 oracle；未执行、失败、partial、unknown 和 unavailable 保持可见。
- **F10 自动化按真实收益添加**：只自动派生当前重复身份与引用；不增计数器、历史重建或无 consumer 基建。
- **F11 正常执行优先、控制面受限**：现有对象的 owner、consumer、失败语义见 Module responsibilities；新增控制面须先回计划登记。
- **Q1 质量事实不作准入证，完成质量不降级**：各 Phase 实测、逐 AC、独审和处置缺失时不能报完成，允许同 task 修复。
- **Q2 推进资格、发布结构与完成判据分离**：四材料可工作、writer 认证和功能完成分别验证；close 前停止汇报。
- **Q3 异源审查加人工把关**：wh-review 返回真实异源事实，主会话不能用结构校验冒充独立质量判断。
- **S1 能用外部就不造轮子**：复用仓内 portable 测试/审查技能，不建设新 broker。
- **S2 外部技能可针对项目改造合宪**：P4 仅同步既有技能至本规格与治理边界。
- **S3 迭代时保持最新并就地检查**：P4/P5 核对当前 repository-owned 技能来源、依赖与分发消费者；不作未经检查的最新版本声明。
- **S4 自定义技能必须有指标系统**：使用既有 step/skill execution 与 cost 记录，缺 telemetry 保持 unavailable，不新增指标 store。
- **S5 自定义技能方便子代理调用省主上下文**：重读、定向测试和独立核查交子代理；主会话保留有界结果与引用。
- **S6 自定义技能参考成熟方案**：复用现有测试方法与 review broker；本期不引入新的自研通用技能。
- **S7 一阶段一技能一工作流一文件夹**：P4 保持五阶段目录、steps 与 skill-deps 一一对应，不增阶段。
- **S8 自定义技能可独立调用可搬运**：技能直接调用，分发闭包由 P5 验证；不绑定单一宿主路径。

## Phase P1 — 材料、确认与冻结

### Goal
相同确认幂等、变化确认新建；下游细化不使方向批准失效；四材料和偏差路由合同可验证。

### Files
- **NEW**：N/A — 本 Phase 不新增生产对象类别。
- **MODIFY**：`tests/contract/four-material-non-gate-contract.test.mjs`, `tests/stage-plan-task-contract.test.mjs`, `tests/stage-interaction-contract.test.mjs`, `tests/contract/ui-applicability-must-ask.test.mjs`, `tests/contract/freeze-classification-budget-usage-protocol.test.mjs`, `runtime/stage/stage-content-contracts.mjs`, `tests/contract/human-confirmation-v3.test.mjs`, `tests/contract/confirmation-authorization.test.mjs`, `tests/boundary-confirm.test.mjs`, `runtime/task/task-kernel-implementation.mjs`, `runtime/task/task-store.mjs`
- **DO NOT TOUCH**：历史原件、UI、真实 provider config/sink、其他 Phase owner 文件。

### Tasks
- T001–T004：见 tasks.md 对应完整卡。

### Verify
- **gate_cmd**：`npx --no-install vitest run tests/contract/four-material-non-gate-contract.test.mjs tests/stage-plan-task-contract.test.mjs tests/stage-interaction-contract.test.mjs tests/contract/ui-applicability-must-ask.test.mjs tests/contract/freeze-classification-budget-usage-protocol.test.mjs tests/contract/human-confirmation-v3.test.mjs tests/contract/confirmation-authorization.test.mjs tests/boundary-confirm.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：RED 非零；GREEN/非行为同步/FINAL 为 0。
- **oracle**：ORACLE-P1；证据写 task `quality/tests/` 及 output，不从总 exit 推逐项通过。

### Knowledge
下一 Phase 只消费本 Phase 明确返回的 ref/schema/测试事实；审查、测试和报告不是继续许可证，也不能替 completion。

### STOP
若需要自动回答用户、把未来材料作为当前 stage 前提、或改变产品行为，回 make-decision/build-spec。

### Done
真实命令结果、逐项 oracle、当前 snapshot/source digest、独立 review 原件与未解决 finding 都已记录；未运行或 unavailable 单列。

### Risks and rollback
仅回滚本 Phase 代码/fixture；保留四材料及已写不可变原件。若行为/接口超出 owner，分别回 build-spec/build-plan。

## Phase P2 — 成对审查与 canonical 记录

### Goal
paired 四分支、partial/member failures/coverage/disposition/record status 保真；同 track 有语义时不重派。

### Files
- **NEW**：N/A — 本 Phase 不新增生产对象类别。
- **MODIFY**：`tests/review/review-record-route.test.mjs`, `tests/integration/wh-review-v3-broker-contract.test.mjs`, `tests/review/review-policy-compatibility.test.mjs`, `skills/wh-review/scripts/simple-review-runner.mjs`, `skills/wh-review/scripts/wh-review-cli.mjs`, `runtime/review/review-record-route.mjs`, `runtime/review/canonical-review-result.mjs`, `skills/wh-review/scripts/review-provider-client.mjs`, `skills/wh-review/scripts/__tests__/review-provider-client-timeout.test.mjs`
- **DO NOT TOUCH**：历史原件、UI、真实 provider config/sink、其他 Phase owner 文件。

### Tasks
- T005–T006：见 tasks.md 对应完整卡。

### Verify
- **gate_cmd**：`npx --no-install vitest run tests/review/review-record-route.test.mjs tests/integration/wh-review-v3-broker-contract.test.mjs tests/review/review-policy-compatibility.test.mjs skills/wh-review/scripts/__tests__/review-provider-client-timeout.test.mjs skills/wh-review/scripts/__tests__/review-provider-client-v3.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：RED 非零；GREEN/非行为同步/FINAL 为 0。
- **oracle**：ORACLE-P2；证据写 task `quality/tests/` 及 output，不从总 exit 推逐项通过。

### Knowledge
下一 Phase 只消费本 Phase 明确返回的 ref/schema/测试事实；审查、测试和报告不是继续许可证，也不能替 completion。

### STOP
若必须新增 review store、第三轮 review 或修改旧原件，停止。

### Done
真实命令结果、逐项 oracle、当前 snapshot/source digest、独立 review 原件与未解决 finding 都已记录；未运行或 unavailable 单列。

### Risks and rollback
仅回滚本 Phase 代码/fixture；保留四材料及已写不可变原件。若行为/接口超出 owner，分别回 build-spec/build-plan。

## Phase P3 — 真实 outcome、验收、复盘与状态链

### Goal
producer→bridge→runtime→fact→status、command/service E2E、verify 同次 binding、reflection A→B、usage 回读全部在共享 runtime 内闭合。

### Files
- **NEW**：N/A — 本 Phase 不新增生产对象类别。
- **MODIFY**：`tools/host/workflowhub-stage-agent-bridge.mjs`, `runtime/stage/stage-content-contracts.mjs`, `runtime/task/workspace-runner.mjs`, `runtime/review/review-record-route.mjs`, `tests/contract/host-outcome-bridge.test.mjs`, `tests/integration/vnext-official-stage-run.test.mjs`, `tests/contract/stage-completion.test.mjs`, `tests/contract/status-derivation.test.mjs`, `runtime/stage/stage-agent-outcome-adapter.mjs`, `runtime/stage/stage-runner.mjs`, `runtime/stage/stage-handlers.mjs`, `runtime/stage/completion-predicates.mjs`, `tests/contract/acceptance-execution-tier.test.mjs`, `tests/contract/verify-code-binding-derivation.test.mjs`, `tests/verify-requirement-replay-contract.test.mjs`, `tests/e2e/vnext-five-stage-current.test.mjs`, `runtime/evidence/freshness.mjs`, `runtime/evidence/canonical-evidence-validators.mjs`, `tests/contract/stage-reflect.test.mjs`, `tests/contract/stage-runner-reflection.test.mjs`, `tests/contract/stage-runner-on-stage-end.test.mjs`, `tests/e2e/stage-reflect-real-chain.test.mjs`, `tests/integration/quality-store-concurrency.test.mjs`, `runtime/stage/stage-reflect.mjs`, `runtime/evidence/stage-content-evidence.mjs`, `tools/cli/append-lesson-observation.mjs`, `tools/cli/validate-stage-reflection.mjs`, `tools/cli/build-reflection-page.mjs`
- **DO NOT TOUCH**：历史原件、UI、真实 provider config/sink、其他 Phase owner 文件。

### Tasks
- T007–T012：见 tasks.md 对应完整卡。

### Verify
- **gate_cmd_P3A**：`npx --no-install vitest run tests/contract/host-outcome-bridge.test.mjs tests/integration/vnext-official-stage-run.test.mjs tests/contract/stage-completion.test.mjs tests/contract/status-derivation.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **gate_cmd_P3B**：`npx --no-install vitest run tests/contract/acceptance-execution-tier.test.mjs tests/contract/verify-code-binding-derivation.test.mjs tests/verify-requirement-replay-contract.test.mjs tests/e2e/vnext-five-stage-current.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **gate_cmd_P3C**：`npx --no-install vitest run tests/contract/stage-reflect.test.mjs tests/contract/stage-runner-reflection.test.mjs tests/contract/stage-runner-on-stage-end.test.mjs tests/e2e/stage-reflect-real-chain.test.mjs tests/integration/quality-store-concurrency.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：RED 非零；GREEN/非行为同步/FINAL 为 0。
- **oracle**：ORACLE-P3A/B/C；证据写 task `quality/tests/` 及 output，不从总 exit 推逐项通过。

### Knowledge
下一 Phase 只消费本 Phase 明确返回的 ref/schema/测试事实；审查、测试和报告不是继续许可证，也不能替 completion。

### STOP
若首个真实正例不可达、需默认 actor/latest selector/额外 review dispatch/覆盖旧件，停止；共享文件仅按本计划登记区域在 P1/P2 完成后串行移交 P3，不并发改同文件。

### Done
真实命令结果、逐项 oracle、当前 snapshot/source digest、独立 review 原件与未解决 finding 都已记录；未运行或 unavailable 单列。

### Risks and rollback
仅回滚本 Phase 代码/fixture；保留四材料及已写不可变原件。若行为/接口超出 owner，分别回 build-spec/build-plan。

## Phase P4 — 五阶段技能与合同同步

### Goal
所有 workflow 说明只要求真实事实、保留每 Phase review/验收/复盘，删除重复手填真实性声明。

### Files
- **NEW**：`tests/contract/workflow-synchronization-consumer.test.mjs` — 只承载 workflow→真实 producer/consumer 的行为合同。
- **MODIFY**：`workflows/make-decision/SKILL.md`, `workflows/make-decision/steps.json`, `workflows/make-decision/skill-deps.yaml`, `workflows/build-spec/SKILL.md`, `workflows/build-spec/steps.json`, `workflows/build-spec/skill-deps.yaml`, `workflows/build-plan/SKILL.md`, `workflows/build-plan/steps.json`, `workflows/build-plan/skill-deps.yaml`, `workflows/build-code/SKILL.md`, `workflows/build-code/steps.json`, `workflows/build-code/skill-deps.yaml`, `workflows/verify-code/SKILL.md`, `workflows/verify-code/steps.json`, `workflows/verify-code/skill-deps.yaml`, `skills/spec-plan/templates/plan-template.md`, `skills/spec-tasks/templates/tasks-template.md`
- **DO NOT TOUCH**：历史原件、UI、真实 provider config/sink、其他 Phase owner 文件。

### Tasks
- T013–T014：见 tasks.md 对应 RED/GREEN 完整卡。

### Verify
- **gate_cmd**：`npx --no-install vitest run tests/contract/workflow-synchronization-consumer.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：RED 非零；GREEN/非行为同步/FINAL 为 0。
- **oracle**：ORACLE-P4；证据写 task `quality/tests/` 及 output，不从总 exit 推逐项通过。

### Knowledge
下一 Phase 只消费本 Phase 明确返回的 ref/schema/测试事实；审查、测试和报告不是继续许可证，也不能替 completion。

### STOP
文档与生产接口含义不一致、需要新公共动作或第五材料时停止。

### Done
真实命令结果、逐项 oracle、当前 snapshot/source digest、独立 review 原件与未解决 finding 都已记录；未运行或 unavailable 单列。

### Risks and rollback
仅回滚本 Phase 代码/fixture；保留四材料及已写不可变原件。若行为/接口超出 owner，分别回 build-spec/build-plan。

## Phase P5 — 分发、安装与隔离

### Goal
bundle/catalog/runner release 与新 imports/refs 同步；干净安装、tamper 和真实配置隔离成立。

### Files
- **NEW**：N/A — 本 Phase 不新增生产对象类别。
- **MODIFY**：`tests/integration/distribution-closure.test.mjs`, `tests/integration/runner-clean-install.test.mjs`, `scripts/__tests__/smoke-local-skill-dispatch.test.mjs`, `core/__tests__/check-skill-closure.test.mjs`, `tests/integration/mutation-guards.test.mjs`, `runtime/distribution/runner-release.mjs`, `runtime/distribution/skill-bundle-release.mjs`, `repo-skills.manifest.json`, `tools/cli/repo-skills-manifest.mjs`, `tests/contract/repo-skills-manifest.test.mjs`
- `skills/spec-plan/skill-bundle.json`
- `skills/spec-tasks/skill-bundle.json`
- `skills/wh-review/skill-bundle.json`
- `skills/catalog.yaml`
- **DO NOT TOUCH**：历史原件、UI、真实 provider config/sink、其他 Phase owner 文件。

### Tasks
- T015–T016：见 tasks.md 对应 RED/GREEN 完整卡。
- **既存分发数据登记**：`skills/spec-plan/skill-bundle.json` 由 spec-plan 技能维护者负责，`skills/spec-tasks/skill-bundle.json` 由 spec-tasks 技能维护者负责，`skills/wh-review/skill-bundle.json` 由 wh-review 技能维护者负责；三个文件的消费者为 `validateSkillBundle`、`resolveLocalSkill`（build-plan）和 release collector。`skills/catalog.yaml` 由仓库技能目录维护者负责，消费者为 `checkSkillClosure` 和 `buildRepoSkillsManifest`。四者只在经过审查的等价分发合同覆盖现有消费者且消费者已迁移后才可替代；不得新增平行目录或控制面。

### Verify
- **gate_cmd**：`npx --no-install vitest run tests/contract/repo-skills-manifest.test.mjs tests/integration/distribution-closure.test.mjs tests/integration/runner-clean-install.test.mjs scripts/__tests__/smoke-local-skill-dispatch.test.mjs core/__tests__/check-skill-closure.test.mjs tests/integration/mutation-guards.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：RED 非零；GREEN/非行为同步/FINAL 为 0。
- **oracle**：ORACLE-P5；证据写 task `quality/tests/` 及 output，不从总 exit 推逐项通过。

### Knowledge
下一 Phase 只消费本 Phase 明确返回的 ref/schema/测试事实；审查、测试和报告不是继续许可证，也不能替 completion。

### STOP
fixture 触碰真实 config/sink、closure 缺件或需要永久 compatibility bridge 时停止。

### Done
真实命令结果、逐项 oracle、当前 snapshot/source digest、独立 review 原件与未解决 finding 都已记录；未运行或 unavailable 单列。

### Risks and rollback
仅回滚本 Phase 代码/fixture；保留四材料及已写不可变原件。若行为/接口超出 owner，分别回 build-spec/build-plan。

## Phase P6 — 当前快照最终验收

### Goal
一次定向聚合覆盖 13 SCN、13 FR、20 AC，并分别报告 pass/fail/skipped/unavailable/not_applicable。

### Files
- **NEW**：N/A — 本 Phase 不新增生产对象类别。
- **MODIFY**：`specs/workflowhub-execution-simplification-20260907/tasks.md`, `quality/tests/final-execution-simplification-A-900.json`, `quality/tests/output/final-execution-simplification-A-900.output`, `quality/tests/final-execution-simplification.json`, `quality/tests/output/final-execution-simplification.output`
- **DO NOT TOUCH**：历史原件、UI、真实 provider config/sink、其他 Phase owner 文件。

### Tasks
- T017：见 tasks.md 对应 FINAL 完整卡。

### Verify
- **gate_cmd**：`P6-A`, `P6-B`, `P6-C` 三个串行完整分组命令（见 Test Strategy；各自 `npx --no-install vitest run`，同一冻结快照），A 的 900000ms authenticated retry 作为当前分片证据，全部 exit 0 才满足 FINAL；分组 receipt 分别写 `quality/tests/final-execution-simplification-A-900.json`, `quality/tests/final-execution-simplification-B.json`, `quality/tests/final-execution-simplification-C.json`，聚合 summary 写 `quality/tests/final-execution-simplification.json`
- **expected_exit**：RED 非零；GREEN/非行为同步/FINAL 为 0。
- **oracle**：ORACLE-FINAL；证据写 task `quality/tests/` 及 output，不从总 exit 推逐项通过。

### Knowledge
下一 Phase 只消费本 Phase 明确返回的 ref/schema/测试事实；审查、测试和报告不是继续许可证，也不能替 completion。

### STOP
任何 AC 无真实 scenario/oracle/evidence、命令损坏或材料/快照变化时停止并回受影响任务。

### Done
真实命令结果、逐项 oracle、当前 snapshot/source digest、独立 review 原件与未解决 finding 都已记录；未运行或 unavailable 单列。

### Risks and rollback
仅回滚本 Phase 代码/fixture；保留四材料及已写不可变原件。若行为/接口超出 owner，分别回 build-spec/build-plan。

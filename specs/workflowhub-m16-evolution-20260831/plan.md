# 实现计划：M16 自进化候选池、迭代入口与负例库

- **Input**：`specs/workflowhub-m16-evolution-20260831/decision-log.md@51d1ae108d28189df006d235bf2ae65e981812e283259dd06db29bc7a314bf7c`、`specs/workflowhub-m16-evolution-20260831/spec.md@b863bf6cb656481a510c85386f8dcc38b6c3ad25d13c637c36dfaee2d7ddf1cb`
- **Template version**：`plan-task.v3`

## Quick Read

- **Goal**：复用 stage-reflection 与现有 monitor，确定性产出两档候选、前期质量税、改动/负例台账和按需七区块简报；所有结果只供人判断，不自动改 WorkflowHub。
- **Non-goals**：不重建 M15 遥测，不新增 stage、定时器、事实副本或自动优化器，不执行消融/删除、市场调研、历史回填和真实业务收益验证。来源：R-004、R-006、R-008、R-013；D-004、D-005、D-008；DE-001～003。
- **Deletion boundary**：本计划不涉及删除；任何未来 remove 或 cleanup 必须等待独立消融事实和明确授权，本阶段不执行。
- **Before**：monitor 只有 task/overall_pending 视图；`derive-consumption-edges` 的完整扫描布尔不足以证明当前候选 snapshot 的零消费；四个 M16 项目级对象与三个私有适配器不存在。
- **After**：同一次 monitor 构建先完成输入清单认证与候选 snapshot 刷新，再静态投影候选/质量税；三个私有 CLI 分别记录终态改动事实、按需生成 current brief、显式检查 skill upstream 并产 receipt。
- **Main risk**：仓外 JSONL 并发/残缺、旧 proof 升格、状态跨维提升，以及缺 Design/Experience 时误报 UI 通过。
- **Next step**：T001 先写候选、质量税和 proof 边界 RED；任何需要第八种 public runtime behavior 或第二事实源的实现立即 STOP。

## Technical Context

### Global Constraints

- **Normalized lock/lifecycle/read contracts**：project_lock 唯一字段集含 host_id+boot_id+session_epoch（禁止 host-only）；candidate transition 入口为 `recordCandidateTransition` / `record-evolution-result --record-kind=candidate-transition`，refresh 继承 lifecycle；current brief 只由 T004 新增的 `generate-iteration-brief.mjs --read-current` 校验 identity 后 stdout 给用户，不新增 reader 文件或泛 browser consumer。

- **Verified facts**：`tools/cli/build-reflection-page.mjs` 已读取五阶段 reflection、lessons 和 `derive-consumption-edges`，输出冻结 `workflowhub-reflection-page.v1`；`projectOverall()` 的 key 缺 stage 且带 legacy `suggested_action`，只能保留兼容，不能成为 canonical candidate producer。
- **Language / runtime**：Node.js >=24，ESM；Ajv 复用现有 schema 校验；HTML 为无框架静态模板。
- **Primary dependencies**：复用 `tools/cli/derive-consumption-edges.mjs`、`runtime/stage/step-manifest.mjs` 的 canonical stage identity、`skills/catalog.yaml` 的 skill identity、`docs/architecture/move-map.json` 的 surface authority；不新增 npm 依赖。
- **Storage / state**：四个项目级对象固定为 `Projects/<project>/evolution-candidates.jsonl`、`attempted-edits.jsonl`、`negative-results.jsonl`、`iteration-brief.md`；JSONL 用 framed append+fsync。negative writer 在同一锁内读取 current negative log/index，验证 failure_identity 全库唯一，且 supersedes 只指向同 identity 的 current effective head、链无环，才可 append。brief 使用 attempt+owner temp，fsync temp→重验→owner fencing→rename→directory fsync；rename 前失败零写。rename 后 directory fsync 失败返回 `durability_unknown`，不得宣称旧 bytes 不变或发布成功；恢复先以 owner fencing 重读 current bytes/hash，若已等于 intended hash则幂等完成，否则保留 observed current、产生新 attempt并按同 semantic id重试，禁止覆盖未知 owner/current。
- **Lock contract**：唯一 owner=`runtime/evidence/workflow-evolution.mjs`，唯一 authority=`runtime/schemas/workflow-evolution.v1.json#/$defs/project_lock`；固定字段集为 `schema_version/project/owner_token/pid/host_id/boot_id/session_epoch/acquired_monotonic_ms/lease_deadline_monotonic_ms`，`owner_token` 每次 acquire 随机且不可复用。获取必须 `open(...,"wx")` 原子创建；仅同 boot_id/session_epoch 的 monotonic clock 可判定 lease，boot/session mismatch、未知 schema/host/owner 或无法证明过期一律 `failed` 且禁止删除。critical section 必须在配置的最大 lease 内有界完成；续租只允许当前 owner_token 在旧 deadline 前原子更新，且受最大累计持锁时长/最大续租次数约束。每次 append、每次 fsync、brief rename 前都必须重读 lock 并复核 owner_token 匹配且 lease 未过期。只有深模块可将已验证过期锁原子 rename 为绑定原 owner_token 的 tombstone 后争抢新锁；旧 writer 过期被 reclaim 后即使恢复，也必须 abort 且零写。释放/清 tombstone前必须重读并匹配 owner_token，禁止盲删未知锁。
- **Testing**：Vitest 单 worker 保证文件竞争用例稳定；P2 另走 `isolated-browser-qa`，复用同一浏览器引擎和 fixture，记录 cleanup。
- **Target environment**：本地 WorkflowHub CLI 与静态浏览器页面；单机文件系统。本期不证明 NFS/跨主机锁语义。
- **Scale / scope**：最近 30 天、五阶段、候选默认 20 条分页展开；固定极端 fixture 含 120 字 subject/reason、5 refs 和多状态标签。
- **Unresolved facts**：Design.md、Experience.md、Screen Read Map、当前 preview/screenshot 均 `not_ready|not_bindable|unknown`；外部 skill 网络检查运行时可能 `not_checked|unavailable`；真实业务收益属于 DE-002。

## Code Anchors

- **Verified anchors**：`build-reflection-page.mjs#readReflection/readTask/projectOverall/project/writePage/buildReflectionPage`；模板 `renderTask/renderPending/render`；`derive-consumption-edges.mjs#readOutcomeFiles/subjectRecords/deriveTask/deriveConsumptionEdges`；`validate-stage-reflection.mjs#confirmationFacts/zeroConsumption/validateReflectionValue`。
- **Existing interfaces**：`CANONICAL_STAGE_SLUGS`/`loadStageManifest`；`RUNTIME_BEHAVIORS` 七类 public surface；`publishHumanConfirmation` 与 `validateHumanConfirmation`；stage-reflection v1 judgment/intervention 字段。
- **Read now**：上述锚点、`skills/catalog.yaml`、`docs/architecture/move-map.json`、现有 page contract tests。
- **Must read before task**：T003/T004 读取 T002 产出的 `runtime/schemas/workflow-evolution.v1.json#/$defs/d24_eval_boundary` anchor/canonical subschema hash/schema identity；T004 读取 CLI 参数惯例；T006 读取模板现有 CSS/DOM 安全写入；T009 读取最终 move-map 条目 schema 和 public baseline。
- **Context mode**：Full — 跨协议、仓外持久化、CLI、静态 UI、浏览器与治理。

### Reuse → Extend → New

| Capability | Decision | Existing anchor | Reason / removal condition |
| --- | --- | --- | --- |
| reflection 与消费边输入 | extend | `deriveConsumptionEdges()` | 补完整 proof identity；不另造 scanner |
| 候选/税/台账/brief 核心 | new deep module | `runtime/evidence/workflow-evolution.mjs` | 现有 overall_pending 无法满足 stage key、snapshot/CAS/ledger；consumer 为 page 与三个私有 CLI；M16 退役删除 |
| schema | new combined schema | `runtime/schemas/workflow-evolution.v1.json` | 一个 `$defs` 文件覆盖窄合同，避免多 schema 膨胀 |
| monitor | extend | `buildReflectionPage()` + 现有 template | 保留 task/overall_pending，新增只读趋势区 |
| 写入/简报入口 | new private adapters | `tools/cli/` 现有 thin adapter 模式 | 核心留在深模块；不得加入 `RUNTIME_BEHAVIORS` |
| surface authority | reuse | `docs/architecture/move-map.json` | 不新增 surface registry |

## Solution Design

### Overview

`workflow-evolution.mjs` 是唯一深模块：校验组合 schema、input inventory、四类 target-ref 与 D24 subtree。身份算法拆为 `observation-id.v1`（保留 task/confirmation/time）与 `candidate-group-id.v1`（只含 target-ref+normalized intervention kind/payload，排除 task/time）；frequency 只按 distinct task_id。`target-resolver.v1` 从 versioned manifest 解析 stage/step、catalog 解析 skill、move-map 解析 surface；step_slug→stage 必须唯一。fixture 保存全部 canonical_hex/sha256 fixed vectors。它返回结构化 `ok|failed|conflict|stale_source|cancelled|wrong_domain|classification_unavailable`，不把异常输入降为空。

`derive-consumption-edges` 扩展为 `consumer-scan-proof.v1` producer。稳定 inventory canonical bytes 只派生 `snapshot_content_id`；每次 refresh/transition publication 在 project lock 内重读 latest complete committed snapshot，按 initial=1 / current generation+1 唯一分配 `publication_generation`，再令 `snapshot_id=hash(snapshot_content_id+attempt_id+publication_generation)`，即使 inventory 相同也必须唯一。batch begin/commit、snapshot rows、refreshResult 与 publication-bound proof canonical bytes 全部写入同一 generation；commit 前重读 head snapshot_id/generation 并复核 fencing，head 已变的 writer 返回 conflict/stale 且零 append。torn/uncommitted tail 不占 generation；pre-commit crash 后新 attempt 从 committed head 重新分配，完整 commit 后响应丢失则 generation 已消费、同 attempt retry 拒绝且新 attempt 取下一 generation。proof 与 refreshResult 同时绑定两层 identity 与 generation。相同 inventory+相同 asOf 的重复计算可 byte-equivalent但新发布 snapshot_id 仍不同；asOf 变化必须改变时间投影并禁止复用旧 proof/refreshResult；旧 snapshot_id、旧 proof或旧 refreshResult 在新 generation 下均 `stale_source`。发布锁内再逐项 re-hash后判 tier；legacy `overall_pending` 原样保留。

`build-reflection-page` 保持现有 `--root/--tasks-root/--out/--now` 接口：T002 只提供 inventory/attempt/refresh/read-guard API；到 T006 才由 page adapter 从已校验的 `<root>/Projects/<project>/tasks` 唯一路径段派生 project、以 `--root` 为 storage root，并从真实 page/candidate sources 构建 canonical inventory：reflection、confirmation、manifest、catalog、move-map 与 consumer scan registered outcome/output raw inputs；decision/spec 只属于 T004 brief，不进入 page inventory。page adapter 必须把已校验 `--now` 原样作为 `asOf` 传给 quality-tax API，禁止 API 隐式读取系统时钟；tax 的 window_start/window_end/generated_at 与同次 current projection 必须绑定该同一时间身份。每次调用生成不可复用 attempt_id，同次刷新 candidate/tax，并把同 identity 的 `refresh_result`、current snapshot 和三区块 ViewModel 写入原有 `data.js`。重试必须生成新 attempt_id，重复 attempt 拒绝；来源漂移返回 conflict/stale。刷新失败时旧合法 snapshot 字节不变，页面显示 failed/stale 或 unavailable；schema/code rollback read guard 返回 inert/unavailable，重验通过前不消费旧 projection；只有顶层身份整体不可置信才走既有 fatal。模板只渲染 frozen data，不增加 fetch/retry/timeout/background refresh，也不得把质量税写成因果结论、stage gate、完成许可或自动优化输入。

`record-evolution-result` 分三种互斥 record-kind。candidate-transition CLI 先调用 `acquireProjectLock({manualRecovery})`，取得 frozen `{lockHandle,ownerToken,fencingToken,leaseIdentity}`，再将其与 current candidate authority 传入 `recordCandidateTransition`；deep API 重验 handle/owner/fencing/current record，CLI 只 parse/转交、不是 semantic consumer。attempted-edit 只校验终态 edit 与 current decision。negative-result 除 D24 与 attempted-edit effective head 外，deep writer 还在同一锁内读取 current negative log/index，验证 failure_identity 全库唯一、supersedes 只指同 identity current effective head且无环；这是 writer-side validation consumer，外部 direct consumer仍仅 brief。三者输入不得混用。`generate-iteration-brief` 要求恰好一个 canonical target并 CAS 替换 current brief；receipt 与 skill-update边界不变。三个 adapter 都不是第八种 public runtime behavior。

### Module responsibilities

- **D24 authority / candidate identity**：T002 是 combined schema 单一 writer/owner，一次定义本期全部 `$defs` 并 export frozen D24 ref/canonical bytes/hash/schema id；T004 不写 schema、不添加 sibling `$defs`，只消费 frozen exports。D24 subtree canonical bytes 必须与 T002 fixed vector byte-identical。attempted-edit 不消费 D24；negative-result 才消费。target-ref 支持 stage/step/skill/surface；observation/group 身份与 distinct-task frequency 按 spec 固定。
- **Record / skill authority**：attempted-edit CLI 落锁前只校验 current approved decision ref/hash/approval；negative-result 额外校验 current D24 exact anchor/canonical bytes hash/schema identity，失败零写。skill-update input 分别绑定 installed skill canonical identity/version/content hash/authority（catalog+bundle/ref）与 upstream receipt，任一 mismatch 保留 unavailable/failed。
- **Restart lock**：project_lock 使用上述含 host_id/boot_id/session_epoch 的唯一 schema；仅同 boot/session epoch 自动 reclaim，boot/session mismatch 默认 failed。caller-owned ephemeral `$defs.manual_recovery` 绑定 current lock hash、old/new boot、operator、issued_at、nonce 与 confirmation ref/hash；唯一 semantic consumer=`acquireProjectLock({manualRecovery})`，record/brief CLI 对可选 `--manual-recovery=<json>` 只 parse 并原样转交。原子 tombstone 记录 authority hash+nonce并拒绝 missing/stale/replayed/cross-lock/cross-boot；page/check 无输入时保持 failed，不新增持久对象。

#### Workflow evolution deep module

- **Responsibility**：所有 M16 record validation、candidate/tax 计算、snapshot/ledger/brief 生命周期与项目级原子发布。
- **Consumes**：stage-reflection v1、human confirmation、consumer-scan-proof v1、current decision/spec hashes、catalog/move-map authority。
- **Produces**：三类 JSONL、tax/refresh ViewModel、单一 current brief 和结构化失败结果。
- **Must not decide**：优化方案、remove 裁决、stage 完成、用户授权或业务收益。

##### T002 frozen export API

| export / signature | input → output | errors | lock / zero-write | allowlisted real consumers |
| --- | --- | --- | --- | --- |
| `resolveTargetRef({projectId,targetKind,targetId,authorities})` | current manifest/catalog/move-map → `{targetRef,canonicalBytes,sha256}` | `invalid_target\|stale_source` | no lock；error 零写 | internal `refreshEvolutionSnapshot`；T004 record private CLI adapter；T004 brief adapter |
| `deriveObservationId({projectId,targetRef,taskId,confirmationRef,occurredAt,interventionKind,interventionPayload})` | validated observation → `{observationId,canonicalBytes,sha256}` | `invalid_input\|identity_conflict` | no lock；error 零写 | internal `refreshEvolutionSnapshot` only |
| `deriveCandidateGroupId({projectId,targetRef,interventionKind,interventionPayload})` | normalized kind/payload without task/time → `{candidateGroupId,canonicalBytes,sha256}` | `invalid_input\|identity_conflict` | no lock；error 零写 | internal `refreshEvolutionSnapshot` only |
| `buildInputInventory({project,rawInputs,producerIdentity,schemaIdentity})` | frozen raw refs+bytes → `{inventory,inputInventoryHash}` | `unavailable\|identity_conflict\|stale_source` | no lock；error 零写 | T006 page adapter；T004 brief adapter |
| `computeQualityTaxProjection({inventory,interventions,stageManifest,asOf})` | current validated facts + caller-authenticated time → frozen `{status,sampleCount,ratio,confidence,windowStart,windowEnd,generatedAt,sourceIdentities}`，且 `windowEnd=generatedAt=asOf` | `unavailable\|identity_conflict\|stale_source` | no lock；error 零写；不补零；禁止隐式系统时钟 | T006 page adapter only |
| `acquireProjectLock({storageRoot,project,attemptId,ownerToken,manualRecovery?})` | current lock+optional frozen recovery authority → frozen `{lockHandle,ownerToken,fencingToken,leaseIdentity,release}` | `failed\|conflict\|stale_source\|replayed_recovery` | 唯一 manualRecovery semantic consumer；跨 boot重验/nonce one-shot；失败零写/零reclaim | internal `refreshEvolutionSnapshot`；T004 record private CLI；T004 brief private CLI |
| `refreshEvolutionSnapshot({storageRoot,project,attemptId,inventory,now})` | current inventory + locked committed head → `{status,snapshotId,publicationGeneration,refreshResult}` | `failed\|conflict\|stale_source\|cancelled` | acquire project lock；generation=latest complete committed+1/初始1；commit前重验head+fencing；不接受 manualRecovery；任一 error/loser 旧 bytes 不变 | T006 page adapter only |
| `recordCandidateTransition({storageRoot,project,currentSnapshotId,candidateRecordId,candidateId,expectedRevision,currentSourceIdentities,currentMaterialIdentities,humanConfirmation,lockAuthority})` | exact current authority under already acquired fencing identity → `{status,candidateId,revision,snapshotId,publicationGeneration}` | `failed\|conflict\|stale_source` | 不接受 manualRecovery；private CLI先调用`acquireProjectLock({manualRecovery})`并传 lockAuthority；同样按 committed head+1 分配/commit前重验 generation；任一旧 identity 零写 | T004 `record-evolution-result --record-kind=candidate-transition` adapter only |
| `readCurrentEvolutionProjection({storageRoot,project,expectedIdentity,taxProjection,sourceInventoryHash,asOf,refreshResult})` | caller-supplied current candidate identity + exact tax/refresh/time bundle → frozen page/brief projection | `unavailable\|failed\|stale_source` | read-only；逐字段重验同 attempt/source/time，禁止隐藏重读或系统时钟 | T006 page adapter；T004 brief adapter |

`readCurrentCandidateSnapshot({storageRoot,project,expectedIdentity})` 是 module-private internal helper，不 export；唯一内部 callers=`refreshEvolutionSnapshot`、`recordCandidateTransition`、`readCurrentEvolutionProjection`。任何 private CLI、page/brief adapter、测试外的生产模块均禁止直接 import/调用它；T004 brief 与 T005/T006 page 只能经 frozen projection export 消费。

全部九个 exports 只返回冻结结构化结果，不抛出可被 adapter 吞掉的业务错误；schema/programmer misuse 可 fail-loud。上述 consumer map 是 exact allowlist：每个 export 至少一个真实 import/call backref，allowlist 外生产 import 或缺失 backref 均失败。T001 固定签名、IO/error、consumer call graph、是否持锁、fencing/manualRecovery 与零写，T002 不得改 T001 focused tests。

#### Existing reflection producers

- **Responsibility**：`derive-consumption-edges` 证明扫描覆盖；stage-reflection skill 约束 attribution producer 语法。
- **Consumes**：认证 stage outcomes 与真实 confirmation。
- **Produces**：完整 proof 或 honest partial/unknown；`upstream_omission:<stage>` 或 unknown。
- **Must not decide**：candidate tier、质量税结论或删除。

#### CLI adapters and monitor

- **Responsibility**：解析窄输入、调用深模块、渲染/发布、输出确定性状态。
- **Consumes**：深模块 API 与当前项目 authority。
- **Produces**：current brief、ledger append result、monitor HTML/data.js。
- **Must not decide**：自动改动、自动任务、市场结论或质量 pass。

### Interfaces, data, and lifecycle

- **Interfaces / schemas**：`workflow-evolution.v1.json` 的 `$defs` 至少含 input_inventory、target_ref、candidate_record/snapshot、batch_begin/commit/abort、project_lock、manual_recovery、refresh_result、tax_projection、attempted_edit、negative_result、d24_eval_boundary、skill_update_check、ablation_protocol、brief_section；分类 precedence 固定为证据不足=`classification_unavailable` 零写，其次 D24/mixed=`wrong_domain` 零写，最后只有独立 harness/process/skill-edit before/after 证据进入 M16；未知键、hash/identity/schema 冲突 fail-loud。
- **Data flow / state**：冻结 raw inputs → resolver→observation_id→candidate_group_id→distinct-task frequency→inventory/snapshot→proof/tier/tax→锁内 re-hash→原子发布。普通 refresh 为仍存在 group 生成新 snapshot record并继承 lifecycle/revision；只有 transition 在 exact current snapshot/record/candidate/revision/source/material authority 下 revision+1，refresh 后旧 authority stale。JSONL 与 brief durability规则保持既定 fail-loud/zero-write。
- **API contract**：无 public 网络 API。三个私有 CLI 中，record/brief 接受绝对 storage root、project 与 JSON input 路径；brief 另接受 canonical target、`--decision-log/--decision-log-ref/--decision-log-sha256`、`--spec/--spec-ref/--spec-sha256`、可选 `skill-update-check.v1` receipt 与输出默认 project root。`check-skill-updates` 接受 catalog skill identity、caller-owned receipt root 与显式 `--network=allow|deny`；`allow` 才访问 catalog 声明 upstream，`deny` 或网络/transport 不可用仍写 content-addressed `unavailable` receipt，不安装、不更新。深模块负责解析 decision/spec 白名单的 preserve-behavior、OPEN/RISK/DE 条目及 anchors；hash mismatch 返回 `stale_source` 且不发布。receipt 缺失投影 `not_checked`、认证失败投影 `unavailable`。page CLI 保持现有参数，identity/inventory/attempt 由 T006 adapter 生成。无效参数 exit non-zero，业务冲突输出结构化状态且不覆盖旧文件。
- **UI / external code**：新增“建议行动 / 仅供参考 / 前期质量税”区域，稳定排序、20 条展开、可访问证据名称、文字状态、390×844 与 1280×800。
- **Fail-loud behavior**：partial/empty proof 不升级；identity/source 漂移返回 stale/conflict；lock owner 不明或过期恢复失败返回 failed；D24/mixed 返回 wrong_domain；非法 ledger 零追加。

## UI Delivery Contract (仅 UI phase/task 使用)

- **UI applicability**：`ui_scope`。
- **Component action**：`add-local` — 仅在现有静态 template 内新增 evolution trends region，不抽共享组件。
- **Real consumer**：用户浏览器读取 `build-reflection-page.mjs` 生成的 monitor；`consumer-census` 自动扫描当前 unavailable，但 move-map 与现有生成链确认该 consumer。
- **State owner**：`buildReflectionPage()` 生成的 frozen `workflowhub-reflection-page.v1` ViewModel；页面无运行时数据 owner。
- **Typed ViewModel**：vanilla JS，无 TypeScript；组合 schema 与 contract test 是类型边界。
- **CSS/token owner**：`build-reflection-page-template.html` 的 `#evolution-trends` 局部 selector；禁止 global override 与 `!important`。
- **Fixture / viewport**：`tests/fixtures/workflow-evolution/extreme.json` + setup 生成 manifest；当前 runner 服务单页 `workflowhub-monitor.html`，在 390×844、1280×800 两个 viewport 各采集一次，共 2 组。
- **Browser / a11y / performance**：T007 是 browser evidence 唯一 producer，固定用 `isolated-browser-qa` 驱动 `agent-browser` 单引擎；单页 `workflowhub-monitor.html` 在 390×844 与 1280×800 各跑一次，共 2 组，runner 仅以 canonical manifest checks 断言页面可打开、Evolution tab 可达、预期文案出现、无页面错误、无外部运行时网络请求及两张截图存在。keyboard/focus order、对比度、overflow 与展开控件同步不在当前 runner 的通过条件内。T010 不启动 browser、不生成/刷新/改写 evidence，只验证 T007 exact manifest/current bindings并原样透传 manifest status/exit matrix。
- **Screenshot handoff**：`quality/evidence/browser-qa/m16-monitor/` 写 `browser-qa-evidence.v1` manifest，绑定 snapshot/tool/skill identity、planned/observed groups、assertions、artifact refs `m16-monitor-390x844.png` 与 `m16-monitor-1280x800.png`、task-owned server PID、session/server/temp cleanup 与 `passed|qa_failed|unavailable`。`qa_failed` 只在 QA 命令真实执行且 exit 非 0 时使用；tool unavailable 时为 incomplete，QA `exit_code` 必须 absent，orchestrator 可用独立 non-zero probe exit，禁止伪造 exit 0。
- **Coverage limits**：不覆盖 Design/Experience 视觉权威、Safari/移动真机、生产部署或跨主机性能。
- **N/A / unknown reason**：Design/Experience/preview/screenshot identity 当前 `not_bindable`；仅复用现有视觉基线。

### Component Quality Map

| component | action | real consumers | compatibility / state owner | CSS owner / story_or_test_update |
| --- | --- | --- | --- | --- |
| evolution trends region | add-local | generated monitor → user browser | 只追加 v1 keys；既有 task/overall_pending 不变；state=`data.js` frozen projection | `#evolution-trends` local CSS；更新 `tests/contract/build-reflection-page.test.mjs` |

### Design-gap handoff (不改变 Design.md 权威)

- **design_status**：`unknown`。
- **missing_items / reason**：Design.md、Experience.md 唯一 path/revision/anchor、Screen Read Map、preview_refs、screenshot_refs 均缺失。
- **fallback_visual_basis**：现有 monitor template + 极端 fixture + 两 viewport browser evidence。
- **constraints / assumptions**：只追加区域；visible labels 固定“建议行动”“仅供参考”“前期质量税”“显示更多”“展开全部证据”。
- **rework_risk / human_confirmation**：视觉返工风险保留；build-plan 人工确认不等于 design approval。
- **current_material_ref / design_revision**：`spec.md#10.1 UI Contract`；design revision=`unknown`。
- **preview_refs / fixture_refs / viewport_refs / screenshot_refs**：fixture path 已计划；其余执行前 `unavailable`。
- **responsive / a11y**：窄屏纵排、长文本换行、焦点顺序等于视觉顺序、颜色非唯一编码。

## File Boundary

### NEW

- `runtime/evidence/workflow-evolution.mjs`
- `runtime/schemas/workflow-evolution.v1.json`
- `tools/cli/generate-iteration-brief.mjs`
- `tools/cli/record-evolution-result.mjs`
- `tools/cli/check-skill-updates.mjs`
- `tests/contract/workflow-evolution-candidates.test.mjs`
- `tests/contract/workflow-evolution-ledgers.test.mjs`
- `tests/contract/generate-iteration-brief.test.mjs`
- `tests/contract/check-skill-updates.test.mjs`
- `tests/fixtures/workflow-evolution/extreme.json`
- `tests/fixtures/workflow-evolution/red-baseline.v1.json`
- `tests/fixtures/workflow-evolution/check-red-authenticity.mjs`
- `tests/fixtures/workflow-evolution/run-red-green-gate.sh`
- `tests/fixtures/workflow-evolution/setup-browser-fixture.mjs`
- `tests/fixtures/workflow-evolution/run-browser-qa.sh`
- `tests/contract/workflow-evolution-governance.test.mjs`
- `tests/e2e/workflow-evolution-current.test.mjs`
- `tests/contract/workflow-evolution-browser-manifest.test.mjs`
- `tests/fixtures/workflow-evolution/validate-final-review-chain.mjs`
- `tests/fixtures/workflow-evolution/run-final-review-chain.mjs`
- `tests/fixtures/workflow-evolution/run-final-aggregate.sh`
- `quality/evidence/browser-qa/m16-monitor/manifest.json`

### MODIFY

- `tools/cli/derive-consumption-edges.mjs`
- `tools/cli/build-reflection-page.mjs`
- `tools/cli/build-reflection-page-template.html`
- `skills/stage-reflection/SKILL.md`
- `skills/stage-reflection/skill-bundle.json`
- `skills/catalog.yaml`
- `tests/contract/derive-consumption-edges.test.mjs`
- `tests/contract/stage-reflection-skill-contract.test.mjs`
- `tests/contract/build-reflection-page.test.mjs`
- `tests/contract/public-behavior-baseline.test.mjs`
- `docs/architecture/move-map.json`

### DO NOT TOUCH

- `runtime/interface/runtime-facade.mjs`、`tools/cli/stage-runtime.mjs`：不得增加 public behavior/action。
- `runtime/task/task-kernel*.mjs`、completion predicates、五阶段 manifests：M16 是 data-plane，不接入工作许可。
- M14/M15 历史、D24 eval 库、现有 task view 字段语义：只读兼容。
- 当前 `decision-log.md`、`spec.md`、`CONTEXT.md`、ADR 0022：已批准来源，不由 build-code 重写。

## Technical Decisions

### DEC-001 — 一个深模块承载 M16 data-plane

- **Problem**：候选、tax、ledger、brief 共享 identity、schema、lock、CAS、atomic publish。
- **Options**：四套模块各自实现；一个深模块+三个薄 CLI。
- **Selected**：new deep module。
- **Reason**：共享失败边界只有一个 owner，避免四套锁和状态枚举。
- **Consequence / risk**：模块较大；用导出窄 API 与分区测试控制。
- **Fallback**：删除 M16 模块、三个私有 CLI（含 `check-skill-updates`）与四对象，不影响 stage runtime；既有 skill 不安装、不回写。
- **F10 real threat**：并发半批、identity 冲突和状态提升会损坏人类决策输入。
- **F10 existing cover**：现有 page/edge 只有读取投影，不覆盖项目级 append/CAS。
- **F10 bypassable**：CLI 可被绕过直接改文件；读取端仍全量校验并拒绝损坏。
- **F10 maintenance cost**：一个 schema、一个锁协议、三个 adapter。
- **F10 disposition**：keep。

### DEC-002 — 保留 public 七行为，新增私有 data-plane CLI

- **Selected**：`generate-iteration-brief`、`record-evolution-result`、`check-skill-updates` 三个私有 CLI 都不进入 runtime facade。
- **Reason**：满足按需人/agent 使用，不制造第八 stage/public control plane。
- **Consequence / risk**：调用者必须显式传项目/输入；错误不自动恢复。
- **Fallback**：直接删除 record/brief/check-skill-updates 三个 adapters，核心只读能力仍可被 monitor 使用；已产 receipt 只读保留且不触发安装。
- **F10 disposition**：keep。

### DEC-003 — framed append-only ledger 与原子 current projection

- **Selected**：ledger 采用 `batch_begin`/rows/`batch_commit(count+hash)` framed append-only 协议，在短锁内 append+fsync；恢复记录 `batch_abort` 不解析残缺区的 `batch_id`，而认证 `last_committed_prefix_hash`、`abandoned_start_offset`、`observed_suffix_length/hash`，可封闭 torn begin/row/commit 的精确字节区间。reader 仅在没有后续 batch 时忽略 terminal uncommitted suffix，或忽略被合法 abort 封闭的 region；任何已提交 malformed/count/hash/source 错误都 fail-loud。current brief 单独采用临时文件 fsync/rename + CAS。
- **Reason**：framed commit 同时满足 append-only 事实保留与半批不可见；永久数据库/daemon 超出范围。
- **Consequence / risk**：只保证单机文件系统；锁异常或 abort 字节区间/hash 不匹配时 fail-loud；未提交尾部只有在无后续 batch 时才可忽略。
- **Fallback**：不截断、不改写旧字节；恢复时追加 newline + authenticated abort 后才开新 batch，并以新 attempt 重试。brief 失败保留旧 projection。
- **F10 disposition**：keep。

## Test Strategy

- **RED authenticity / canonical evidence contract**：每个 gate 只有一个 canonical evidence JSON，唯一 producer=`check-red-authenticity.mjs`；wrapper 只编排并把 suite、phase=`red|green|verify`、exact command/output、current material hash、Vitest JSON hash 和 baseline hash 交给 checker，禁止其它 task 写同路径。T001/T003 focused tests 对尚不存在的生产模块只能经 test-owned dynamic-import seam 加载：module-not-found 或 missing export/behavior 被转换为命名 `M16-T001-*`/`M16-T003-*` assertion failure；syntax error、依赖链 module-load error、fixture parse/identity error、timeout 仍是 infrastructure exit24。pool-tax RED 精确只跑新 `workflow-evolution-candidates.test.mjs`；ledger-brief RED 精确跑三个新 focused tests；immutable baseline 只含本阶段不修改的 `stage-reflection-e2e-constructed.test.mjs`，明确排除本阶段会改的 `derive-consumption-edges.test.mjs` 与 `stage-reflection-skill-contract.test.mjs`。T002 的同一次 GREEN gate 在 focused GREEN 后必须立即运行 `npx vitest run tests/contract/derive-consumption-edges.test.mjs tests/contract/stage-reflection-skill-contract.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`；两套 regression 任一失败则 pool-tax gate 非零且不得写 GREEN，只有 focused+regression 全为 0 才由 checker 原子写/hash-bind同一 `gate.json`，之后 repository suite 仍再次覆盖它们作为 final net。checker 校验 baseline 全绿、RED failures 非空且仅为相应 allowlist、GREEN failures 空，并原子写/hash-bind对应唯一 evidence。exit：valid GREEN=0、valid RED=1、invalid authenticity=23、unexpected Vitest/infrastructure=24、evidence write/hash failure=25；baseline/allowlist 不得运行后自更新。monitor/governance wrapper 同样唯一写各自 `gate.json`，final aggregate 只消费并重验这些 exact hashes，不接受 `phase.json` 或并列 green shards。

补充分类：unknown/ambiguous target 是业务 `invalid_target|stale_source` allowlisted assertion并必须零发布，不属于 infrastructure；exit24 仅用于 unknown test/report ID、syntax/load、fixture parse/identity 或 timeout。

| Target | Task | Role | gate_cmd / expected_exit | Oracle / evidence_path |
| --- | --- | --- | --- | --- |
| POOL+TAX | T001/T002 | RED→GREEN | `bash tests/fixtures/workflow-evolution/run-red-green-gate.sh pool-tax` / nonzero→0 | ORACLE-POOL-TAX；checker 唯一写/hash-bind `quality/tests/m16-p1-pool-tax/gate.json` |
| EDIT+NEG+ABL+BRIEF | T003/T004 | RED→GREEN | `bash tests/fixtures/workflow-evolution/run-red-green-gate.sh ledger-brief` / nonzero→0 | ORACLE-LEDGER-BRIEF；checker 唯一写/hash-bind `quality/tests/m16-p1-ledger-brief/gate.json` |
| PAGE | T005/T006 | RED→GREEN | `bash tests/fixtures/workflow-evolution/run-red-green-gate.sh monitor` / nonzero→0 | ORACLE-MONITOR；checker 唯一写/hash-bind `quality/tests/m16-p2-monitor/gate.json` |
| Browser | T007 | N/A verification | `bash tests/fixtures/workflow-evolution/run-browser-qa.sh` / 0 | ORACLE-MONITOR-BROWSER；状态矩阵 `0|20|21|22`：passed=0、qa_failed=20、unavailable/incomplete=21、manifest invalid=22；脚本内 validator 结果优先；`quality/evidence/browser-qa/m16-monitor/` |
| GOV+E2E | T008/T009 | RED→final GREEN | `bash tests/fixtures/workflow-evolution/run-red-green-gate.sh governance` / nonzero→0；T009 preflight 四对象并完成 production-only 双向闭合 | ORACLE-GOV-E2E；test-only 不进 move-map；checker 唯一写/hash-bind `quality/tests/m16-p3-governance/gate.json` |
| aggregate | T010 | FINAL | `bash tests/fixtures/workflow-evolution/run-final-aggregate.sh` / 0 | ORACLE-FINAL；唯一 canonical gate 固定 browser manifest→review chain→all M16 focused→`npm test && npm run check`，first-failure wins；原子写唯一 `quality/tests/m16-final-aggregate.json` |

## Rollback and Recovery

- **Global recovery rule**：只回滚本任务生产/测试文件与 template 追加区域；已发布 candidate/ledger JSONL 保留为不可改写事实，移除或禁用失配 consumer；current brief 保留为 inert 派生物并在重新启用前重验；`check-skill-updates` 可删除，已产 receipt 只读保留且永不触发安装。保留四材料、旧 candidate/ledger/brief 和所有失败事实，不通过删事实伪造回滚。
- **Irreversible boundaries**：commit/push/merge/archive/cleanup 仍需独立授权；build-code 不执行。
- **Recovery owner**：build-code owner 只清理自己 owner_token 匹配的同 attempt 临时文件/锁并用新 attempt 重跑；未知/不匹配锁必须保留并 fail-loud，不得盲删或修改旧事实伪造成功。

### Engineering Risk Handoff

- **Affected IDs**：FR-POOL-001～008、FR-TAX-001～007、FR-EDIT-001～003、FR-NEG-001～003、FR-ABL-001～003、FR-BRIEF-001～009、FR-PAGE-001～005、FR-GOV-001～003；T001～T010。
- **Trigger**：proof 不完整、来源/identity 漂移、项目锁/CAS 冲突、旧 monitor 回归、UI 来源或当前 browser evidence 缺失、public behavior 扩张。
- **Consequence**：候选或质量税被误升级、旧字节被覆盖、页面误导用户、治理登记与真实消费者漂移，或把 incomplete 误报为完成。
- **Mitigation or STOP**：绑定完整 inventory/proof，锁内重读并原子发布；失败保留旧字节和原始事实；触发 public surface/方向变化立即 STOP 回 owning material。
- **Handling Stage**：T001-T004 处理 data-plane，T005-T006 处理 monitor；T008 固定 production-only move-map 与 test-only exclusion 并 RED，T009 用真实 producer preflight 四对象、创建由 manifest/evidence 跟踪的 test-only checks并完成生产面 closure，T007 产 browser evidence，T010 对 repo/product/material/move-map/browser evidence 只读，并仅允许现有 review receipt writer 与 final aggregate writer 两类 task-quality 写入；方向变化回 build-spec/build-plan。
- **Verification**：三组同命令 RED→GREEN；T002 GREEN 内立即跑两套 producer/skill regression，P1 Phase Verify 与 repository suite 保留最终兜底；T007 isolated-browser-qa + manifest validator；T010 canonical order 固定为 browser manifest→review chain→singleFork/no-fileParallelism 的全部 M16 focused→`npm test && npm run check`，first-failure wins且后续步骤不运行；所有 repository tests 使用各例临时 root 隔离，不共享项目存储/lock。

- **PLAN-RISK-001 proof 不足**：影响 POOL/T001-T002；现有布尔被直接使用时弱信号误升级；必须绑定完整 proof，否则 reference_only/unknown。
- **PLAN-RISK-002 仓外并发**：影响 POOL/EDIT/NEG/T002-T004；锁/CAS 失败保持旧字节并返回 conflict/failed。
- **RISK-003 lock failure mapping**：lease 上限处理 crash-deadlock；tombstone 只暂停并隔离已过期旧 writer；每次写前 fencing 防旧 writer 恢复与 ABA 删除。三者任一身份/时序无法证明即 failed/零写，不以盲删锁恢复。
- **PLAN-RISK-003 monitor 回归**：影响 PAGE/T005-T007；既有 task view 任何断言失败即 STOP 回 P2。
- **PLAN-RISK-004 UI 来源缺失**：影响 PAGE-003/T007；没有真实 browser evidence 不得宣称视觉完成；a11y 仍需独立事实，当前 runner 不提供。
- **PLAN-RISK-005 public surface 扩张**：影响 GOV/T008-T010；`RUNTIME_BEHAVIORS` 或 stage action 增加即 STOP 回 spec/decision。
- **PLAN-RISK-006 intentional UI serialization**：保持 `T009→T007` 以绑定 current move-map；这是有意串行。UI 失败发现较晚时必须回 T006 并重跑 T008-T010；接受此成本，不改依赖。

## Implementation Order

P1 单支为 T001→T002→T003→T004；P2 为 T005→T006（可在 T002 后开始）；T008 join T004+T006，正式顺序为 `(T004+T006)→T008→T009→T007→T010`。

## Dependencies and Parallelism

- **Dependencies**：T001→T002；T002→T003→T004；T002→T005→T006；T004+T006→T008→T009→T007→T010。
- **Parallel work**：T003→T004 与 T005→T006 可在 T002 后并行；T008 必须 join T004/T006。全部 browser fixture/script/checker 由 T009 唯一创建并先完成 dry-run/preflight 与 final closure；T007 只在其后读取并执行。
- **External dependencies**：`skill-update-check.v1` 是 caller-owned external input，不是 project 对象；caller 拥有 content-addressed retention/delete policy，brief CLI 是唯一 consumer，M16 不清理/安装。私有 producer 仅向 caller 指定 root 写 receipt；未显式检查=`not_checked`，deny/网络/transport 不可用=`unavailable`，identity mismatch 也投影 `unavailable`。Browser QA 工具 unavailable 时保持 UI evidence incomplete，不改成 pass 或 exit 0。

## Requirement and Verification Traceability

- **Versioned wh-review contract**：`node skills/wh-review/scripts/wh-review-cli.mjs run -`；stdin 为 versioned wh-review request（current exact four-material manifest+hash、repo wh-review config ref/hash），stdout 为 versioned public result。provider config 唯一来源是仓内 wh-review config；T010 真实 CLI test 验证 request/result identity 与 temp cleanup。transport unavailable 在 canonical record 后 exit31；invalid/identity/unresolved exit32。

| Source / decision | FR | AC | Phase / Task | Depends on | Exact files | Command / oracle |
| --- | --- | --- | --- | --- | --- | --- |
| R-001/002/008/011/014；D-003/007/010 | FR-POOL-001～008 | AC-POOL-001～003、AC-POOL-005 | P1/T001-T002 | none→T001 | evolution module/schema、edge producer/tests | candidate command / ORACLE-POOL-TAX |
| R-001/002/008/011/014；D-003/007/010 | FR-POOL-003/005/006 | AC-POOL-004 | P3/T008-T010 | T004+T006→T008→T009→T007→T010 | current E2E across candidate/page/brief | governance command / ORACLE-GOV-E2E |
| R-012；D-006 | FR-TAX-001～007 | AC-TAX-001～003 | P1/T001-T002 | T001 | evolution module/schema/tests | candidate command / ORACLE-POOL-TAX |
| stage-reflection `SKILL.md`/bundle/catalog；R-012/D-006 | FR-TAX-002 | AC-TAX-002 | P1/T002 | T001 | `skills/stage-reflection/SKILL.md`、`skill-bundle.json`、`skills/catalog.yaml`、skill contract test | candidate command / ORACLE-POOL-TAX-COMPUTE |
| R-005；D-004/009 | FR-EDIT-001～003 | AC-EDIT-001～002 | P1/T003-T004 | T002 | evolution module、record CLI、ledger tests | ledger command / ORACLE-LEDGER-BRIEF |
| R-004；D-004/008 | FR-NEG-001～003 | AC-NEG-001～002 | P1/T003-T004 | T002 | evolution module、record CLI、ledger tests | ledger command / ORACLE-LEDGER-BRIEF |
| R-006/009；D-004/005 | FR-ABL-001～003 | AC-ABL-001～002 | P1/T003-T004 | T002 | schema/module/ledger tests | ledger command / ORACLE-LEDGER-BRIEF |
| R-003/007；D-001/009 | FR-BRIEF-001～009 | AC-BRIEF-001～003 | P1/T003-T004 | T002 | evolution module、brief CLI/tests | brief command / ORACLE-LEDGER-BRIEF |
| R-010；D-001/002 | FR-PAGE-001～005 | AC-PAGE-001～003 | P2/T005-T006 + P3/T007 | T002；T007 depends T009 | page CLI/template/test/fixture matrix | monitor+browser / ORACLE-MONITOR(-BROWSER) |
| P1 computation → P2 partial propagation | FR-POOL-004～006 | N/A — seam，不转移 AC ownership | P2/T005-T006 | T002 | page ViewModel/data.js/template | propagation annotations / ORACLE-MONITOR |
| P1 tax computation → P2 partial propagation | FR-TAX-004/006 | N/A — TAX AC 留 T001/T002，GOV review 留 T010 | P2/T005-T006 + P3/T007 | T002 | page tax annotations/current generated page | percentage/unknown propagation / ORACLE-MONITOR(-BROWSER) |
| R-008/013/014；D-005/007/008/010 | FR-GOV-001～003 | AC-GOV-001～002 | P3/T008-T010 | T004+T006 | move-map/public baseline/e2e | governance+check / ORACLE-GOV-E2E/FINAL |

## Governance Synchronization Matrix

| Governance surface | Actual files | Change / no change | Task IDs | Reason |
| --- | --- | --- | --- | --- |
| evolution data-plane | module/combined schema/three CLI/four objects | change | T002/T004/T009 | T009 production/object metadata closure；test-only excluded |
| reflection producer | derive CLI、stage-reflection skill+bundle/catalog | change | T002/T009 | D-008 authorized producer contract；T009登记生产变更 |
| static monitor | page CLI/template | change | T006/T009/T007 | T009登记生产面；browser checks只在manifest/evidence |
| public runtime | runtime facade/stage runtime | no change | T008-T010 | 锁定七行为 |
| four materials/task facts | task kernel/completion | no change | T008-T010 | 不新增事实源或 gate |

## Constitution Check

- **Constitution binding**：`{"artifact_kind":"constitution","ref":"constitution-checklist.md","hash":"25f4c883523d673736d487dba8b41a2e2a063e12b61de0f2223b373e7c4d2b20","id":"CONSTITUTION","version":"2026-08-25","clause_count":22}`
- **F1**：核心不改；重活在深模块。 **F2**：三个私有 CLI 与 page 只消费窄 API。 **F3**：发布前全量校验/CAS/fail-loud。
- **F4**：独立 review 只产 findings。 **F5**：不新增 gate。 **F6**：外置对象单 owner，不替代 task facts。
- **F7**：build-plan 确认与不可逆授权分离。 **F8**：复用 scanner/page/authority。 **F9**：旧合法字节、unknown/unavailable 原样保留。
- **F10**：锁/schema 只防已证明并发与身份风险。 **F11**：私有 data-plane adapter，不扩 public control plane。
- **Q1**：测试/review 缺失不能报完成。 **Q2**：工作就绪、发布结构、质量完成分离。 **Q3**：wh-review 与人工确认独立。
- **S1**：复用 Ajv/现有工具。 **S2**：N/A — 无外部 skill 引入。 **S3**：外部更新只做事实检查。 **S4**：stage-reflection skill 继续由现有 outcome 指标记录。
- **S5**：深模块窄输入适合独立测试。 **S6**：不新增自研通用 skill。 **S7**：不改五阶段 workflows 或其入口技能；D-008 已授权的 `stage-reflection` diagnostic skill/bundle/catalog 由 stage-reflection producer 拥有，保持现有 invocation 兼容，并用 skill contract + stage-reflection E2E 验收，不属于五阶段目录变更。 **S8**：stage-reflection skill 仍无宿主绑定。

## Phase P1 — Evolution data-plane 与私有入口

### Goal

完整 proof、candidate/tax、ledger/ablation 和七区块 brief 在单机项目存储根上可确定性、并发安全、失败不覆旧地产出。

### Files

- **NEW**：`runtime/evidence/workflow-evolution.mjs`、`runtime/schemas/workflow-evolution.v1.json`、`tools/cli/generate-iteration-brief.mjs`、`tools/cli/record-evolution-result.mjs`、`tools/cli/check-skill-updates.mjs`、`tests/contract/workflow-evolution-candidates.test.mjs`、`tests/contract/workflow-evolution-ledgers.test.mjs`、`tests/contract/generate-iteration-brief.test.mjs`、`tests/contract/check-skill-updates.test.mjs`、`tests/fixtures/workflow-evolution/extreme.json`、`tests/fixtures/workflow-evolution/red-baseline.v1.json`、`tests/fixtures/workflow-evolution/check-red-authenticity.mjs`、`tests/fixtures/workflow-evolution/run-red-green-gate.sh`
- **MODIFY**：`tools/cli/derive-consumption-edges.mjs`、`skills/stage-reflection/SKILL.md`、`skills/stage-reflection/skill-bundle.json`、`skills/catalog.yaml`、`tests/contract/derive-consumption-edges.test.mjs`、`tests/contract/stage-reflection-skill-contract.test.mjs`
- **DO NOT TOUCH**：TaskKernel、runtime facade、D24 库

### Tasks

- `T001 RED candidate/tax/proof`；`T002 GREEN candidate/tax/proof`；`T003 RED ledger/brief`；`T004 GREEN ledger/brief`。

### Verify

两组 RED/GREEN 命令见 Test Strategy；expected nonzero→0；T002 GREEN 内立即执行 derive-consumption-edges 与 stage-reflection skill-contract regression，P1 Phase Verify 仍以同回归集作 final net；ORACLE-POOL-TAX 与 ORACLE-LEDGER-BRIEF。

### Knowledge

current candidate snapshot 和 target authority 是 P2 唯一输入；legacy overall_pending 不可升格。

### STOP

无法形成完整 stage inventory、需要数据库/daemon、需要第八 public behavior、或任何旧文件前缀会被改写。

### Done

POOL/TAX/EDIT/NEG/ABL/BRIEF 适用 AC 有目标测试证据；无实验、删除、安装、市场调研或自动建议。

### Risks and rollback

风险为锁残留、半批和 source drift；只释放 owner_token 匹配锁，过期锁只能走深模块 stale-reclaim authority，未知锁不得删除；保持旧 current，使用新 attempt 重试。

## Phase P2 — 现有 monitor 只读趋势区

### Goal

在不破坏 task/overall_pending 的前提下展示两档候选和质量税，完成静态合同；真实 browser evidence 在 P3/T007 绑定 current move-map 后生成。

### Files

- **NEW**：none
- **MODIFY**：`tools/cli/build-reflection-page.mjs`、`tools/cli/build-reflection-page-template.html`、`tests/contract/build-reflection-page.test.mjs`
- **DO NOT TOUCH**：现有 task view 字段、runtime data fetch/control plane、`tests/contract/stage-reflection-e2e-constructed.test.mjs`（只读回归依赖；若证明 stage-reflection producer 回归则失败回 T002，只有 page adapter/template 断言失败才回 T006；P2 不修改该测试）

### Tasks

- `T005 RED monitor contract`；`T006 GREEN monitor projection/UI`。

### Verify

Vitest page regression；ORACLE-MONITOR。真实 browser evidence 在 T009 后由 P3/T007 生成。

### Knowledge

UI 只读同次 frozen ViewModel；任何区域失败不得清空其他区域；Design/Experience 仍 unknown。

### STOP

旧 task/filter/safe-ref 回归、页面新增 fetch/retry/timeout 或长文本溢出。浏览器工具 unavailable 如实留下 incomplete，不阻止同任务修复，但不得宣称 T007 完成。

### Done

P2 的 AC-PAGE-001～003 有合同事实；pool FR 仅作状态传播 seam，不转移 AC ownership；browser 事实留给 P3/T007，不能在 P2 提前声明。

### Risks and rollback

回滚 template 新 region 和 page 新 keys；已发布 P1 JSONL 保留且 consumer disabled，brief 保持 inert；恢复代码重新读取前重验 schema/source identity；保留失败事实。

## Phase P3 — 治理双向登记与当前快照总验收

### Goal

新增生产文件/命令/schema、修改生产 producer、四持久 object metadata 与真实 consumer 在 move-map 双向闭合；test-only 只由 manifest/evidence 跟踪，public 七行为不变。

### Files

- **NEW**：`tests/contract/workflow-evolution-governance.test.mjs`、`tests/e2e/workflow-evolution-current.test.mjs`、`tests/contract/workflow-evolution-browser-manifest.test.mjs`、`tests/fixtures/workflow-evolution/setup-browser-fixture.mjs`、`tests/fixtures/workflow-evolution/run-browser-qa.sh`、`tests/fixtures/workflow-evolution/run-final-review-chain.mjs`、`tests/fixtures/workflow-evolution/validate-final-review-chain.mjs`、`tests/fixtures/workflow-evolution/run-final-aggregate.sh`、`quality/evidence/browser-qa/m16-monitor/manifest.json`（T007 task evidence output，非 repository source）
- **MODIFY**：`docs/architecture/move-map.json`、`tests/contract/public-behavior-baseline.test.mjs`
- **DO NOT TOUCH**：runtime facade/stage runtime、四材料以外的历史记录

### Tasks

- `T008 RED production-only governance/e2e contract`；`T009 创建 test-only browser/review/aggregate checks（不进 move-map）并完成 production-only move-map 双向闭合`；`T007 只生成绑定 T009 frozen hash 的 browser evidence`；`T010 对产品面只读，task-quality 仅有 immutable review receipt 与 atomic single aggregate 两类受控写入`。

### Verify

T008 以 production-only exact set 与 test-only exclusion 稳定 RED。T009 创建六个 test-only browser/review/aggregate checks，但只由 fixture manifest/canonical gate evidence 跟踪、绝不登记 move-map；同时在 allowed temp storage root 调用真实 producer创建四对象，绑定 logical object id/path/schema、content hash、producer identity与consumer metadata后 owner-safe cleanup，temp path不得成为 repo条目。move-map 只登记生产文件/命令/schema、修改生产 producer与四 object metadata，冻结 closure hash。T007 零 repo写地产 current browser evidence；harness缺陷回T009并使旧evidence stale。T010对repo/product/material/move-map/browser evidence只读；task-quality exact 两类受控 writer：`review --action=record` 写 immutable receipt，owner=`run-final-review-chain:<attempt_id>`，idempotency key绑定current material manifest+exact review result+provider/runtime identity，同key同bytes复用、异bytes零覆盖失败；`run-final-aggregate.sh` 唯一顺序为 browser manifest→review chain/receipt→全部 M16 focused→`npm test && npm run check`→原子 aggregate，任一步失败立即返回该步 code且不运行后续步骤。最终以 temp write/fsync/rename/parent-fsync 原子写唯一 `quality/tests/m16-final-aggregate.json`，同一对象内记录 focused/repository 结果及 review receipt refs/hashes。record前失败零写；record后或测试失败保留 immutable receipt 与原始输出，aggregate 文件发布前失败不覆盖旧 bytes，cleanup只清同owner temp；browser/review unavailable保持真实incomplete，不产生独立 focused/repository 持久 JSON。

### Knowledge

质量事实、work readiness 和 release/close 独立；业务收益继续标未验证。

### STOP

move-map 任一方向漏项、placeholder consumer、public behavior 增加、浏览器证据 stale、或 AC trace 缺失。

### Done

T008 RED、T009 完成真实四对象preflight与production-only move-map closure并GREEN，test-only交集为空；T007 evidence绑定frozen hash；T010对产品面只读、受控幂等写immutable review receipt并原子写唯一 final aggregate；22项AC与current snapshot闭合。

### Risks and rollback

治理条目错误时只修条目/测试，不改变 runtime；整体回滚删除 M16 add 项并恢复 page/producer，四材料和质量记录保留。

# 实现计划：make-decision 收敛闭环强化

- **Input**：`specs/workflowhub-make-decision-hardening/decision-log.md@935c4b60ef18443fcd50b2269a0d1cf4214c0a3d8baf20d12636ff595d3a99c5`、`specs/workflowhub-make-decision-hardening/spec.md@c96c2d469855fa34d63f9dd8212a57f9593417924011862389d5869ee8252ba3`
- **Template version**：`plan-task.v4`

## 材料导航

| 章节 / 材料锚点 | 职责与摘要 | 读取时机 |
| --- | --- | --- |
| `decision-log.md#D-001-D-029` | D-001～D-029 的历史决策与审计上下文；陈旧尾部状态不作为 build-plan 实现输入 | 接手与历史核对 |
| `spec.md#速读卡（30-秒）`、`#验收标准` | 当前冻结的 16 FR、21 AC、`non_ui`，与 D-029 后实际用户授权共同控制实现 | 开卡、STOP 和最终验收 |
| `plan.md#Quick-Read`、`#Solution-Design` | 文件唯一归属、接口、DAG、oracle、回滚 | 每卡执行前 |
| `tasks.md#Phase-P1-宿主需求源窄适配`、`#Phase-P3-outline_closed-与既有验收聚合` | 8 张卡与唯一执行事实填写区 | RED/GREEN/EVIDENCE/FINAL 执行时 |

> **Advisory investigation — `spec material navigation is incomplete`**：当前冻结 `spec.md:10-19` 已有 `## 材料导航`，且表头含“章节”“一句话内容（摘要）”“建议读取时机”，各行非空，满足当前 `validateMaterialNavigation` 的机械条件。该警告若仍来自 official pre-confirm run，只能说明该次 packet/receipt 读取了旧 revision、非当前规范化文本，或使用了与当前 checkout 不同的 producer/validator；它不是当前 `spec.md` 内容缺口。build-spec 已冻结，本轮不修改 spec；build-plan-owned 文件能做的修复仅是把本 plan/tasks 导航表头与真实锚点补齐。若警告在以当前四材料重新构造 packet 后仍出现，需由 build-spec/material-packet owner 修复其 revision binding，不能在 plan/tasks 内伪造消除。

## Quick Read

- **Goal**：维护 decision-log 内唯一 OI 大纲，使 direction/detail/既有用户确认按职责消费它；仅当 D-020 五项齐备时派生唯一 `outline_closed`；显式宿主来源失败诚实保持 `unavailable`。
- **Non-goals**：不新增 stage、public command、store、schema、第五材料、调用方 selector、latest/env 扫描、机器语义裁决、浏览器/fullstack 路线或 public acceptance runner；不改其他四个 stage、Talk/Grill、宪法和历史事实。为满足现有 private `service` acceptance executor 的 canonical stdout contract，T006 可登记一个 test-owned report producer；它不是 public command、runtime control plane 或第二 acceptance authority。现有 status projector 只允许沿已认证 current quality-fact 链解析其绑定的 exact stage outcome；这不是新控制面。来源：RQ-08、RQ-10、RQ-13；D-022、D-027、D-028、D-029；NG-001～NG-010。
- **Build-plan authority**：当前冻结 `spec.md` 与 D-029 旧措辞之后的实际用户授权是 build-plan 的控制性实现输入。精确锚点为 `spec.md:6-8`（来源、冻结状态）、`spec.md:79-81`（D-029 映射与 `open_direction_changing_questions=0`）、`FR-SOURCE-001`（`spec.md:398-404`）、`FR-GOV-001`（`spec.md:422-428`）、`NG-003`/`NG-007`/`NG-009`/`NG-010`（`spec.md:526-533`）及 `AC-SOURCE-001`/`AC-SOURCE-002`。用户在 D-029 之后明确批准 **Option B + host-neutral implementation**；该授权仅使 D-029 中陈旧的 DSH-specific engineering details 成为 audit context，不重开或改写产品方向。控制实现仍须 opt-in、机械筛选并诚实披露真实性弱于独立 launcher；采用 host-neutral descriptor `kind:"host-session"`，路径来自显式 `transcript_path` 或 `WORKFLOWHUB_HOST_TRANSCRIPT`，由薄适配器 `runtime/evidence/host-session-transcript.mjs` 供 bridge 消费。**STOP 仅在实现将超出上述当前 host-neutral spec（FR-SOURCE-001/FR-GOV-001、NG-003/007/009/010、AC-SOURCE-001/002）时触发**；不得因 stale D-029 工程细节停工，也不得声称 `decision-log.md` 已被重写。
- **After**：host-session 薄适配器复用既有严格 DSH transcript frame walker，不实现第二 decoder；任一 zstd frame/尾随字节异常使整个来源 unavailable 且 requirement messages 为零。OI/current projection/interaction proof 五项 fail-closed，review 仍是质量事实而非推进许可证。
- **Next step**：T001 与 T003 可并行取得目标 RED；各自 GREEN 串行，随后进入 P3。

## Technical Context

### Global Constraints

- Node.js ESM + Vitest；zstd 复用 Node `zlib.zstdDecompressSync` 和 `runtime/evidence/dsh-transcript.mjs:decompressZstdFrames`。
- 来源认证复用 `createTranscriptSourceReader`、`createRegisteredCodexSource` 和现有 stage outcome authentication。
- OI/questions-only 仍在当前四材料边界内；`outline_closed` 进入既有 completion subject map。
- 三个 Phase、八张 task；每个精确文件只归属一个 Phase。
- 测试只走定向 backend contract/static/serialized integration；`non_ui`，所以 browser/fullstack 不适用。

## Code Anchors

- P1：`runtime/evidence/dsh-transcript.mjs:decompressZstdFrames/readDshTranscriptText/snapshotDshRequirementMessages/normalizeDshTranscript`；`runtime/evidence/fact-collector.mjs:createTranscriptSourceReader`；`runtime/evidence/codex-transcript-adapter.mjs:createRegisteredCodexSource`；`tools/host/workflowhub-stage-agent-bridge.mjs:buildRequirementAuthentication/runBridge`。
- **main rebaseline (`7b95e96d`)**：bridge 已拥有 `session.coordination` 的 worker brief/summary、material/snapshot、usage 与 lifecycle 校验；P1 只能增加 requirement-auth seam，必须保留 coordination 校验及 `recorder.finish({ coordination })` 透传。
- **T002 exact constructor contract**：新文件 `runtime/evidence/host-session-transcript.mjs` owns 并 export `buildHostRequirementAuthentication({ transcriptPath, taskId, runId, stage, sessionId, sourceId, sourceRef }) => RequirementAuthentication|null`。调用方向固定为 `tools/host/workflowhub-stage-agent-bridge.mjs:buildRequirementAuthentication` → `runtime/evidence/host-session-transcript.mjs:buildHostRequirementAuthentication` → `runtime/evidence/dsh-transcript.mjs:readDshTranscriptText/decompressZstdFrames` + `createTranscriptSourceReader` + `createRegisteredCodexSource`；adapter 返回现有认证对象给 bridge，绝不反向 import bridge。
- P2：`workflows/make-decision/SKILL.md`、`steps.json`；decision-log skill/template；`runtime/review/stage-materials.json`；make-decision review contract；`docs/standard-workflow.md` 当前 review preflight 只产事实、不作 gate 的语义。
- P3：`runtime/stage/stage-content-contracts.mjs:analyzeDecisionConvergence/validateRequirementCoverage`；`runtime/stage/stage-handlers.mjs` make-decision completion branch；`runtime/stage/completion-predicates.mjs` required subjects 与 current outcome projection；`tools/cli/stage-runtime.mjs` 已认证 current quality-fact observations；现有 acceptance aggregate 路线及 `runtime/stage/stage-runner.mjs:ACCEPTANCE_SERVICE_LAUNCHER/executePrivateAcceptance`。main 新增的 runtime-profile/test-routing validator 与 acceptance-currentness 兼容语义必须保留。

## Reuse → Extend → New

| Capability | Decision | Owner | Consumer | Replacement / deletion |
| --- | --- | --- | --- | --- |
| strict zstd frame walker | reuse/repair in place | `runtime/evidence` / `dsh-transcript.mjs` | host-session adapter | host native verified text stream replaces compressed parsing |
| host-session adapter | **NEW retained thin adapter** | `runtime/evidence` | bridge only | host-native equivalent provides same authenticated source; migrate bridge then delete adapter |
| bridge source seam | modify | `tools/host` | existing outcome publisher | host-native equivalent replaces adapter call, not bridge authentication semantics |
| OI author/review contract | extend | make-decision/decision-log/review | three existing consumers | equivalent reviewed material replaces projection |
| `outline_closed` | sole new subject; retain every existing convergence predicate and its producer | make-decision runtime | existing completion/status | only a reviewed equivalent may replace this new subject after a current consumer census; switch consumers and remove `outline_closed` atomically with no dual authority; never delete or weaken the shared analyzer or any pre-existing predicate |
| canonical acceptance report producer | **NEW test-owned narrow adapter on existing private service executor** | `tests/contract` / T006 | existing `executePrivateAcceptance` service tier and T008 aggregate | delete when a reviewed package/runtime producer emits the same canonical AC rows directly; migrate the sole consumer first |

The new host-session adapter delegates all compressed-byte decoding to `decompressZstdFrames`/`readDshTranscriptText`; it owns descriptor/path resolution, event projection and registered-source construction only. No copied magic constants, block parser, frame splitting or catch-and-skip decoder is allowed.

## Solution Design

### P1 host-neutral source

Bridge accepts only explicit `session.source={kind:"host-session", transcript_path?...}`. `transcript_path` wins only when explicitly supplied; otherwise adapter may read explicit process configuration `WORKFLOWHUB_HOST_TRANSCRIPT`; neither path permits session-directory scanning, latest selection or caller message selection. Adapter mechanically retains only current-bound user messages satisfying exact event predicates and nonempty id/content, preserves order, derives hashes, and returns existing `RequirementAuthentication|null`.

The strict zstd oracle includes: valid concatenated frames; valid skippable frame; truncated frame header; truncated block header/payload; reserved block type; fake zstd magic inside compressed payload; checksum mismatch; and trailing garbage. Every invalid case has the same whole-source oracle: returned source is unavailable/null and emitted requirement-message count is exactly zero, even if earlier frames were valid.

### P2 unique OI and consumers

Before research, author exactly these six functional framework nodes in the current decision-log: `background`, `problem`, `goal`, `solution`, `acceptance`, `extension`; also enumerate the fixed six categories: `complete_user_flow`, `page_scope`, `data_state`, `success_failure_boundary`, `non_goals`, `deferred`. `ORACLE-OI-CONTRACT` requires every framework node and every category to contain at least one OI reference or an explicit justified empty entry (`empty:true` plus a non-placeholder `reason`); omission, bare “none”, duplicate authority, or category/node substitution fails. Direction consumes a current questions-only projection with all IDs/categories/questions/sources and no answers; detail consumes terminal fields; existing approve-decision consumes grouped plain-language options. T004 owns the authoring contract, visible grouping fields, and their tests. Each OI/group record uses the exact fields `task_id`, `outline_version`, `oi_id`, `visible_group_id` or `batch_id`, `selected_disposition`, `impact_dimensions`, `requires_user_decision`, and `interaction_ref` plus `interaction_hash`. The fields are authored and shown by P2, while runtime truth validation belongs only to T005/T006. Revision mismatch, substitution, summary-only output, leaked answers, a core OI misclassified as `ordinary_detail`, or any stale/missing/mismatched identity/proof field cannot satisfy its consumer. Grouping remains inside the existing overall approve-decision interaction; no extra normal confirmation is added. Review unavailable stays visible but advisory.

### P3 close derivation and existing acceptance route

Parser returns five explicit component results and gaps; handler maps them to the single `outline_closed`; predicate list adds that subject while retaining every existing convergence predicate and producer, without changing work status or adding a sixth review conjunct. Runtime validation in T005/T006 checks the exact P2-authored fields `task_id`, `outline_version`, `oi_id`, `visible_group_id|batch_id`, `selected_disposition`, `impact_dimensions`, `requires_user_decision`, `interaction_ref`, and `interaction_hash`; negatives include misclassified core impact and stale, missing, or mismatched task/version/OI/group/disposition/ref/hash.

T005/T006 同时修复 current outcome retry 缺陷：`stage-runtime` 从已认证 current quality-fact → acceptance evidence → stage-quality evidence 链取得唯一绑定的 exact outcome ref，再交给现有完整 authenticator。未被该链绑定的历史/当前 retry sibling 继续 immutable 保留，但不与唯一 bound ref 竞争；多个 current authenticated facts 绑定不同 ref 时显式返回 `conflict`，`deriveStageCompletion` 不再把 `conflict` 改写成 `missing`。禁止 mtime/hash 排序、latest/env 扫描或调用方选择。该修复对应 `FR-FLOW-001`、`FR-GOV-001` 与 `AC-FLOW-001`、`AC-GOV-001`。

T007 is a bounded **EVIDENCE** task, not an implementation task: before FINAL it prepares only the acceptance request and evidence references by (a) running current direction/detail review against fixed fixtures, (b) obtaining independent scoring of the fixed historical sample, (c) performing dispatch/workflow/governance exact-file census, (d) citing real current interaction records where they already exist, and (e) indexing current runtime-profile/test-routing facts including permissions, capability proof and behavior fingerprint. It must not invent implementation work for build-code/verify/manual facts and must not fabricate future user confirmation. Capability proof `unavailable` remains `unavailable` and cannot satisfy an AC. The manual owner is the build-code/verify main session for arranging and recording actual conflict, grouped-confirmation, and Talk/Grill samples through the existing interaction owner; the current interaction source is the existing make-decision Talk/interaction aggregate, cited by real `ref`+SHA-256 hash when present, otherwise recorded `unavailable/incomplete`.

T008 is verification-only and does not add or modify code. Its **outer acceptance route** remains the existing build-code aggregate entry recorded as `gate_cmd`: `node tools/cli/stage-runtime.mjs run --action=execute --stage=build-code --project=workflowhub --task=workflowhub-make-decision-hardening --input=quality/tests/build-code/T007/acceptance-request-repaired-current.json`. The request is a task-store record containing only the public `run` input (`attempt_id` plus authenticated `receipts`); the launcher resolves that explicit canonical quality ref through the current task store when the worktree-relative file is absent. It does not accept caller-supplied `acceptance_data` or `evidence`, and no env/latest scan is allowed. Separately, T008 `acceptance_data.execution` uses the **existing private service tier** with `module_ref=tests/contract/acceptance-execution-producer.mjs` and `export_name=accept`; T006 owns that test-only producer. The producer invokes the declared package-local Vitest command once without a shell, consumes its machine-readable report, and emits only the existing canonical `{entries:[{acceptance_criterion_id,assertions}]}` JSON contract. It must emit each of the exact 21 AC IDs once, turn missing/unknown test mappings, nonzero/timeout/cancelled execution, malformed report data, or assertion mismatches into non-passing actual assertions, and never convert unavailable T007/manual/capability facts to pass. The existing `executePrivateAcceptance` service launcher remains the only runtime executor; no public command, second store, caller selector, or acceptance authority is added. A retry is allowed only after repair changes the request content and therefore its SHA-256; every failed attempt and raw streams remain immutable, and the aggregate rejects a redundant retry with the same input hash. The returned content-addressed `acceptance_execution` ref/hash cannot be predicted during planning and is captured later only in T008 execution facts.

The producer contract is deliberately narrow: T006's module receives a frozen input containing the exact package-local Vitest argv and an AC-to-test-result mapping derived from the existing matrix, launches that argv once with `execFile`-style no-shell semantics, parses the machine-readable report, and returns only `{entries}`. It must not read the task store, select a latest record, inspect environment variables, invent manual evidence, or become a second runtime acceptance route. Its owner is T006, its only consumer is the existing private service launcher invoked by T008, its test coverage is the T005/T006 focused contract pair plus malformed/nonzero/timeout fixtures, and its deletion condition is a reviewed producer that supplies identical canonical rows directly through the retained service contract.

## File Boundary

### NEW

- `runtime/evidence/host-session-transcript.mjs` (P1; retained thin adapter)
- `tests/contract/dsh-requirement-source.test.mjs` (P1)
- `tests/contract/acceptance-execution-producer.mjs` (P3; T006-owned canonical report producer for the existing private service tier)
- `tests/contract/acceptance-execution-producer.test.mjs` (P3; producer contract and failure-path coverage)
- `quality/tests/build-code/T007/acceptance-request-repaired-current.json` (P3; T007 public-run input repair, no implementation ownership; T008 consumes it; the original malformed request remains immutable)

### MODIFY

- P1: `tools/host/workflowhub-stage-agent-bridge.mjs`; `runtime/evidence/dsh-transcript.mjs`; `tests/dsh-transcript.test.mjs`
- P2: `workflows/make-decision/SKILL.md`; `workflows/make-decision/steps.json`; `skills/decision-log/SKILL.md`; `skills/decision-log/templates/decision-log-template.md`; `runtime/review/stage-materials.json`; `skills/wh-review/contracts/make-decision.md`; `docs/standard-workflow.md`; `tests/decision-log-content-contract.test.mjs`; `tests/step-manifest.test.mjs`; `tests/contract/review-materials-contract.test.mjs`; `tests/contract/spec-stage-artifact-closure.test.mjs`; `tests/stage-review-cost-policy.test.mjs`
- P3: `runtime/stage/stage-content-contracts.mjs`; `runtime/stage/stage-handlers.mjs`; `runtime/stage/completion-predicates.mjs`; `tools/cli/stage-runtime.mjs`; `docs/architecture/move-map.json` (register the retained test producer and its sole consumer); `tests/contract/decision-convergence-depth.test.mjs`; `tests/contract/requirement-convergence-regression.test.mjs`; `tests/contract/stage-completion.test.mjs`; `tests/contract/test-runtime-profile.test.mjs` (read-only regression/evidence); `tests/e2e/vnext-five-stage-current.test.mjs`; `tests/integration/vnext-delivery-close.test.mjs`; `tests/integration/vnext-official-stage-run.test.mjs`; `tests/contract/acceptance-execution-producer.mjs`; `tests/contract/acceptance-execution-producer.test.mjs`

### DO NOT TOUCH

- `specs/workflowhub-make-decision-hardening/decision-log.md`, `spec.md`, other stage workflows, Talk/Grill, Constitution, historical materials, `fact-collector.mjs`, `codex-transcript-adapter.mjs`, public runtime surface.
- `tests/acceptance/make-decision-hardening.accept.mjs` must not be created.
- The producer remains test-owned and service-tier-only; do not add a public acceptance command, a second aggregate, or a task-store writer.

## `outline_closed` replacement/deletion proof

`outline_closed` is the sole new subject. Every pre-existing convergence predicate, producer, shared analyzer, status reader, fixture, and semantic responsibility remains retained. Deletion proof applies only if a reviewed equivalent later replaces this new subject: first produce a current-snapshot census of every `outline_closed` producer and consumer; compare the new subject and proposed replacement with a five-field equivalence matrix—(1) complete framework+six categories, (2) current questions-only snapshot binding, (3) zero open OI, (4) complete legal terminal fields, (5) current core interaction proof—and run the same `ORACLE-OUTLINE-CLOSED` baseline/subtraction/stale-proof cases against both. Then atomically switch all `outline_closed` consumers and remove only the `outline_closed` producer/assertions in the same Phase. No dual-write, fallback, deletion of the shared analyzer, or deletion/weakening of an existing convergence predicate is permitted. Missing consumer, unequal field, or different oracle result stops replacement.

## Build-plan semantic review

- **status**：`incomplete`
- **canonical_ref**：`unavailable — post-main material revision has no current review result`
- **reason**：main rebaseline 与 outcome retry 修复改变了 plan/tasks bytes；旧 semantic review/hash 只读保留，不能认证本次增量版本。本次按用户要求仅更新材料，不重跑完整 build-plan 流程。

## Testing-system blueprint

- **P1 route**：backend contract + bridge subprocess; no browser/fullstack.
- **P2 route**：static/contract only; no subprocess, browser or fullstack.
- **P3 route**：backend contract + serialized integration/git fixtures; no browser/fullstack.
- **T007 evidence route**：produce the bounded current request/evidence index only；纳入 current runtime-profile/test-routing 的 `permissions`、`capability_proof`、`behavior_fingerprint`，不可用 proof 保持 unavailable；其余 review/manual 事实只引用真实来源。
- **T008 route**：outer `gate_cmd` uses the existing acceptance execution/aggregate route with the repaired receipts-only T007 request; the launcher resolves that explicit task-store quality ref without scanning or selecting a latest record. Inner `acceptance_data.execution` uses the existing private service tier and the T006-owned canonical report producer to run one union targeted Vitest command once; it never recursively invokes stage-runtime and does not add a public runner.
- **Immutable RED/GREEN pair evidence**：each pair has one directory and manifest: `quality/tests/build-code/pairs/T001-T002/manifest.json` with immutable `red.json` and `green.json`; similarly `T003-T004` and `T005-T006`. Manifest binds both records to identical `cmd_argv`, `oracle_id`, fixture/sample identity and target assertion. RED is valid only when nonzero is caused by named target assertion; GREEN uses the same command/oracle and preserves the negative case.
- **Final subprocess contract**：the T006 producer receives a fixed argv array and AC mapping from T008 acceptance_data, invokes it once with no shell/env synthesis, and returns only canonical UTF-8 `{entries}` JSON to the existing service launcher; outer timeout remains `120000`. Signal, cancellation, timeout, nonzero exit, malformed/non-UTF-8/non-JSON report, duplicate/missing/unknown AC, assertion mismatch, or redundant same-input-hash retry makes aggregate nonzero/failed. Retry requires repaired request bytes and a changed SHA-256. The runtime preserves every immutable failed attempt, each AC's actual status, and raw stdout/stderr evidence; aggregate failure never rewrites unaffected ACs as passed or erases their actual statuses.

## Test Strategy

| Pair/task | Route | Command | Expected | Oracle / immutable evidence |
| --- | --- | --- | --- | --- |
| T001/T002 | P1 backend contract+subprocess | `npx vitest run tests/dsh-transcript.test.mjs tests/contract/dsh-requirement-source.test.mjs tests/contract/host-outcome-bridge.test.mjs tests/contract/cli-parity.test.mjs --poolOptions.forks.singleFork --no-fileParallelism` | RED nonzero target / GREEN 0 | `ORACLE-SOURCE`; `quality/tests/build-code/pairs/T001-T002/{manifest.json,red.json,green.json}` |
| T003/T004 | P2 static/contract | `npx vitest run tests/decision-log-content-contract.test.mjs tests/step-manifest.test.mjs tests/contract/review-materials-contract.test.mjs tests/contract/spec-stage-artifact-closure.test.mjs tests/stage-review-cost-policy.test.mjs --poolOptions.forks.singleFork --no-fileParallelism` | RED nonzero target / GREEN 0 | `ORACLE-OI-CONTRACT`; `quality/tests/build-code/pairs/T003-T004/{manifest.json,red.json,green.json}` |
| T005/T006 | P3 backend contract+serialized integration plus canonical acceptance producer contract | `npx vitest run tests/contract/decision-convergence-depth.test.mjs tests/contract/requirement-convergence-regression.test.mjs tests/contract/stage-completion.test.mjs tests/contract/test-runtime-profile.test.mjs tests/contract/acceptance-execution-producer.test.mjs tests/e2e/vnext-five-stage-current.test.mjs tests/integration/vnext-delivery-close.test.mjs tests/integration/vnext-official-stage-run.test.mjs --poolOptions.forks.singleFork --no-fileParallelism` | RED nonzero target / GREEN 0 | `ORACLE-P3-HARDENING`（outline close + fact-bound outcome + canonical producer failure semantics）；`quality/tests/build-code/pairs/T005-T006/{manifest.json,red.json,green.json}` |
| T007 | bounded evidence production | current direction/detail review against fixed fixtures; independent historical-sample scoring; dispatch/workflow/governance census; real existing interaction refs or explicit unavailable | 0 only when the request truthfully indexes available facts and missing manual facts remain incomplete | `ORACLE-EVIDENCE`; `quality/tests/build-code/T007/acceptance-request-repaired-current.json` |
| T008 | outer existing acceptance route + inner service-tier canonical producer | outer `gate_cmd`: `node tools/cli/stage-runtime.mjs run --action=execute --stage=build-code --project=workflowhub --task=workflowhub-make-decision-hardening --input=quality/tests/build-code/T007/acceptance-request-repaired-current.json`; inner `acceptance_data.execution`: existing private service tier calls `tests/contract/acceptance-execution-producer.mjs:accept` with the fixed union Vitest argv and AC mapping | 0 only when all actual assertions/evidence complete; retry only with changed request hash | `ORACLE-FINAL`; consumes T007 request and T006 producer, returned content-addressed execution ref/hash recorded later only in execution facts |

## AC-level verification matrix

Each AC has exactly one **primary** producer below; T008 is the **supporting aggregate** for all 21 and is never a second primary. Task `primary AC` fields must equal these rows; RED cards list only `supporting AC` because they produce pair evidence rather than acceptance facts. Missing/duplicate/unknown primary IDs fail.

| AC | Primary method / oracle | Producer | Missing semantics |
| --- | --- | --- | --- |
| AC-OUTLINE-001 | P2 contract / ORACLE-OI-CONTRACT | T004 | incomplete |
| AC-OUTLINE-002 | P2 contract / ORACLE-OI-CONTRACT | T004 | incomplete |
| AC-SNAPSHOT-001 | P2 contract / ORACLE-OI-CONTRACT | T004 | incomplete |
| AC-REVIEW-001 | current independent direction/detail fixture review / ORACLE-EVIDENCE | T007 | unavailable/incomplete |
| AC-REVIEW-002 | substitution matrix / ORACLE-OI-CONTRACT | T004 | incomplete |
| AC-STATE-001 | P3 subtraction matrix / ORACLE-OUTLINE-CLOSED | T006 | missing |
| AC-STATE-002 | P2 enum contract / ORACLE-OI-CONTRACT | T004 | incomplete |
| AC-CONFIRM-001 | actual grouped-confirmation sample, main-session manual owner / ORACLE-EVIDENCE | T007 | unavailable/incomplete |
| AC-PROOF-001 | P3 proof matrix / ORACLE-OUTLINE-CLOSED | T006 | missing |
| AC-CLOSE-001 | P3 five-conjunct baseline / ORACLE-OUTLINE-CLOSED | T006 | missing |
| AC-CLOSE-002 | P3 single-omission matrix / ORACLE-OUTLINE-CLOSED | T006 | missing |
| AC-REVISION-001 | stale/late fixture / ORACLE-OUTLINE-CLOSED | T006 | missing |
| AC-CONFLICT-001 | actual bounded conflict/user-disposition sample, main-session manual owner / ORACLE-EVIDENCE | T007 | unavailable/incomplete |
| AC-REPAIR-001 | serialized same-task repair / ORACLE-OUTLINE-CLOSED | T006 | incomplete |
| AC-ACCEPT-001 | fixed historical sample independently scored / ORACLE-EVIDENCE | T007 | unavailable/incomplete |
| AC-SOURCE-001 | bridge subprocess / ORACLE-SOURCE | T002 | unavailable/zero messages |
| AC-SOURCE-002 | zstd matrix / ORACLE-SOURCE | T002 | unavailable/zero messages |
| AC-FLOW-001 | workflow sequence census plus actual manual samples where required / ORACLE-EVIDENCE | T007 | unavailable/incomplete |
| AC-FLOW-002 | explicit dispatch evidence census / ORACLE-EVIDENCE | T007 | unavailable/incomplete |
| AC-TALK-001 | actual Talk/Grill sample from existing interaction aggregate, main-session manual owner / ORACLE-EVIDENCE | T007 | unavailable/incomplete |
| AC-GOV-001 | dispatch/workflow/governance exact-file census / ORACLE-EVIDENCE | T007 | incomplete |

## Dependencies and Parallelism

- Required DAG: `T001 → T002`; independently `T003 → T004` may run parallel to P1; `T005` depends only on `T004`; `T006` depends on `T005`; `T007` depends on `T002 + T004 + T006`; `T008` depends on `T002 + T006 + T007` and therefore transitively consumes P2 plus all evidence producers.

```text
T001 → T002 ───────────────────────┐
                                   ├→ T007 → T008
T003 → T004 → T005 → T006 ─────────┘   ↑
              └────────────────────────┘
```

Parallel work is allowed only across P1/P2 because their files are disjoint; each RED/GREEN pair is serial.

## Rollback and Recovery

- Dependency-aware rollback is the total order **P3 → P2 → P1**. First preserve T007/T008 requests, attempts, raw streams, and pair evidence, then revert P3 exact files and rerun P3 command with `ORACLE-OUTLINE-CLOSED`; next revert P2 exact files and rerun P2 command with `ORACLE-OI-CONTRACT`; finally revert the P1 bridge, adapter, strict-reader/test files and rerun P1 command with `ORACLE-SOURCE`.
- P1 rollback deletes the NEW adapter/test only with the rest of P1 and must resolve the source to unavailable/zero messages, never fallback. Its implementation is logically separate, but rollback order remains the required total order.
- Preserve all immutable red/green records, original stdout/stderr and historical outcomes; rollback does not rewrite facts. Commit/push/merge/archive/cleanup remain unauthorized.
- `decision-log.md:921-962` 的 stale tail prose（包括旧未决项、待授权文档结果和旧阶段状态）是已完成 make-decision outcome 与当前冻结 spec 之间的 audit-history inconsistency；其 owner 是已完成的 make-decision outcome/current frozen spec，不是 build-plan 的实现 unknown。build-plan 不修复、不改写该历史文本，也不据此重开产品方向。

### Engineering Risk Handoff
- **Affected IDs**：D-029, FR-SOURCE-001, AC-SOURCE-001, AC-SOURCE-002, T001, T002
- **Trigger**：implementation requires selection, scanning, duplicate decoding, a new authority, or changed descriptor semantics.
- **Consequence**：dual source paths or overstated authenticity.
- **Mitigation or STOP**：retain one adapter and strict walker；STOP only if implementation would exceed current host-neutral `FR-SOURCE-001`/`FR-GOV-001`, `NG-003`/`NG-007`/`NG-009`/`NG-010`, or `AC-SOURCE-001`/`AC-SOURCE-002`; stale D-029 engineering details alone do not trigger STOP.
- **Handling Stage**：build-code; product-direction changes return to make-decision.
- **Verification**：ORACLE-SOURCE plus AC-GOV-001 exact-file census.

## Requirement and Verification Traceability

| Sources | FR | AC | Tasks |
| --- | --- | --- | --- |
| D-029 + later Option B host-neutral approval | FR-SOURCE-001 | AC-SOURCE-001/002 | T001/T002/T007 |
| D-002～D-005, D-008～D-019, D-021～D-028 | FR-OUTLINE-001/002, FR-SNAPSHOT-001, FR-REVIEW-001, FR-STATE-001, FR-CONFIRM-001, FR-CONFLICT-001, FR-FLOW-002 | matrix rows for outline/snapshot/review/state/confirm/conflict/flow-002/talk | T003/T004/T007 |
| D-001/D-006/D-007/D-010/D-020/D-024 | FR-PROOF-001, FR-CLOSE-001, FR-REVISION-001, FR-REPAIR-001 | matrix rows for proof/close/revision/repair | T005/T006/T007 |
| D-001/D-006/D-007/D-010/D-020/D-024 | FR-ACCEPT-001, FR-FLOW-001 | AC-ACCEPT-001, AC-FLOW-001 | T007 |
| D-012/D-013/D-015/D-022/D-027/D-028 | FR-GOV-001 | AC-GOV-001 | T002/T004/T007 |

## Technical Decisions

### DEC-001 — Host-neutral thin adapter
- **Selected**：use the later-approved host-neutral `kind:"host-session"` descriptor and NEW retained thin adapter; preserve D-029 opt-in/mechanical/honest-limit substance while superseding only stale DSH-specific engineering wording.
- **F10 real threat**：stage-end authenticated requirements are missing or damaged multi-frame input is partially accepted.
- **F10 existing cover**：registered-source authentication and the strict DSH frame walker already exist but no host-neutral constructor connects them to bridge.
- **F10 bypassable**：a caller selector, latest-session scan, duplicate decoder or skip-bad-frame fallback would bypass mechanical completeness.
- **F10 maintenance cost**：one thin adapter, one bridge call, one focused contract test; host-native equivalent triggers migration and deletion.

### DEC-002 — One close subject
- **Selected**：extend the existing parser/handler/predicate chain with one `outline_closed` subject and atomic replacement proof; no second authority.

### DEC-003 — Strict whole-source zstd failure
- **Selected**：reuse the existing strict frame walker; any malformed frame or trailing garbage makes the whole source unavailable with zero messages.

## Implementation Order

T001→T002 and T003→T004 may proceed in parallel; P3 close work is T004→T005→T006; then T007(T002,T004,T006) produces bounded evidence and T008 aggregates it. Each pair is RED then GREEN with immutable paired evidence. FINAL invokes the existing acceptance route once per request hash; only repaired, changed request bytes permit another attempt.

## Governance Synchronization Matrix

| Surface | Files | Owner task | Consumer / effect |
| --- | --- | --- | --- |
| host source | P1 exact files | T001/T002 | bridge authentication |
| OI author/review | P2 exact files | T003/T004 | direction/detail/confirmation |
| completion | P3 exact files | T005/T006 | existing completion/status |
| evidence request | execution evidence only; no code ownership | T007 | current fixture review, historical independent scoring, censuses, and real existing interaction refs |
| acceptance | verification-only; no code ownership | T008 | consumes T007 request and T006-owned implementation/tests through existing acceptance aggregate |

## Constitution Check

- **Constitution binding**：`{"artifact_kind":"constitution","ref":"constitution-checklist.md","hash":"bf61be16d4d67c582258e7731a335cdca20749764d5a18607f4cd8e98c26ebcb","id":"CONSTITUTION","version":"1.7.0","clause_count":22}`
- **F1**：runtime only parses and aggregates.
- **F2**：interfaces remain narrow.
- **F3**：materials and publication remain separate.
- **F4**：review remains advisory fact.
- **F5**：one justified completion subject.
- **F6**：reuse existing evidence routes.
- **F7**：reuse existing confirmation.
- **F8**：reuse strict decoder and authentication.
- **F9**：negative cases fail loudly.
- **F10**：no new store, public runner, caller selector or latest/env scan；复用既有 private service executor，仅增加一个 T006-owned test report producer 把现有 Vitest machine report 转成已要求的 canonical AC rows，使真实 acceptance command 可执行；不增加第二 aggregate、authority 或 gate。
- **F11**：owner, consumer and deletion are explicit.
- **Q1**：missing quality remains incomplete.
- **Q2**：work and completion statuses remain distinct.
- **Q3**：manual/review facts require independent sources.
- **S1**：no new package or platform.
- **S2**：N/A — no external skill added.
- **S3**：research only on concrete version mismatch.
- **S4**：no metric system.
- **S5**：parallel work uses frozen narrow packets.
- **S6**：existing primary research remains bounded.
- **S7**：no stage added.
- **S8**：host-neutral skill contract is portable.

### Engineering Risk Handoff
- **Affected IDs**：D-029, FR-SOURCE-001, AC-SOURCE-001, AC-SOURCE-002, T001, T002
- **Trigger**：implementation requires selection, scanning, duplicate decoding, a new authority, or changed descriptor semantics.
- **Consequence**：dual source paths or overstated authenticity.
- **Mitigation or STOP**：retain one adapter and strict walker；STOP only if implementation would exceed current host-neutral `FR-SOURCE-001`/`FR-GOV-001`, `NG-003`/`NG-007`/`NG-009`/`NG-010`, or `AC-SOURCE-001`/`AC-SOURCE-002`; stale D-029 engineering details alone do not trigger STOP.
- **Handling Stage**：build-code; product-direction changes return to make-decision.
- **Verification**：ORACLE-SOURCE plus AC-GOV-001 exact-file census.

## Phase P1 — 宿主需求源窄适配

### Goal
显式 host-session 来源经既有认证链产出当前消息；任何 zstd 异常整体 unavailable/零消息。

### Files
- **NEW**：`runtime/evidence/host-session-transcript.mjs`、`tests/contract/dsh-requirement-source.test.mjs`
- **MODIFY**：`tools/host/workflowhub-stage-agent-bridge.mjs`、`runtime/evidence/dsh-transcript.mjs`、`tests/dsh-transcript.test.mjs`
- **DO NOT TOUCH**：`runtime/evidence/codex-transcript-adapter.mjs`、`runtime/evidence/fact-collector.mjs`、`runtime/stage/stage-agent-outcome-adapter.mjs`

### Tasks
- `T001` RED source/zstd matrix.
- `T002` GREEN thin adapter, strict decoder reuse and bridge consumer.

### Verify
P1 command, `ORACLE-SOURCE`, immutable pair directory.

### Knowledge
Later approval fixes host-neutral direction; D-029 opt-in/mechanical/honest limits remain.

### STOP
Caller selector, scan latest, duplicate decoder, fallback, new store/schema/public command or changed descriptor semantics；不得删除或绕过 main 已有 coordination 校验。

### Done
Only real RED/GREEN and evidence may update tasks; current review fact is N/A—not executed.

### Risks and rollback
Partial success and overstated authenticity; rollback P1 independently to unavailable/zero messages using exact P1 files/command/oracle.

## Phase P2 — OI 作者与三消费者契约

### Goal
Unique OI and current questions-only projection are consumed by direction/detail/existing confirmation without a new authority.

### Files
- **NEW**：N/A — existing contracts are extended in place.
- **MODIFY**：`workflows/make-decision/SKILL.md`、`workflows/make-decision/steps.json`、`skills/decision-log/SKILL.md`、`skills/decision-log/templates/decision-log-template.md`、`runtime/review/stage-materials.json`、`skills/wh-review/contracts/make-decision.md`、`docs/standard-workflow.md`、`tests/decision-log-content-contract.test.mjs`、`tests/step-manifest.test.mjs`、`tests/contract/review-materials-contract.test.mjs`、`tests/contract/spec-stage-artifact-closure.test.mjs`、`tests/stage-review-cost-policy.test.mjs`
- **DO NOT TOUCH**：other stage workflows, Talk/Grill, CONTEXT/ADR.

### Tasks
- `T003` RED static/contract negatives.
- `T004` GREEN minimal author/review contract extension.

### Verify
P2 command, `ORACLE-OI-CONTRACT`, immutable pair directory.

### Knowledge
Review is advisory; detail review is not a sixth close conjunct.

### STOP
Fifth material, second state/projection, extra confirmation or review gate.

### Done
Only real RED/GREEN may update tasks; review/manual facts remain N/A—not executed.

### Risks and rollback
Keyword-only false green; after P3 rollback, revert exact P2 files and use exact P2 command/oracle.

## Phase P3 — `outline_closed` 与既有验收聚合

### Goal
Derive one five-conjunct completion subject and aggregate all 21 AC once through the existing acceptance execution route.

### Files
- **NEW**：`quality/tests/build-code/T007/acceptance-request-repaired-current.json`（receipts-only public-run request；malformed predecessor remains immutable）、`tests/contract/acceptance-execution-producer.mjs`、`tests/contract/acceptance-execution-producer.test.mjs`
- **MODIFY**：`runtime/stage/stage-content-contracts.mjs`、`runtime/stage/stage-handlers.mjs`、`runtime/stage/completion-predicates.mjs`、`runtime/review/integration-review-subject.mjs`、`tools/cli/stage-runtime.mjs`、`docs/architecture/move-map.json`（登记 producer owner/sole consumer/delete condition）、`tests/contract/decision-convergence-depth.test.mjs`、`tests/contract/integration-review-subject.test.mjs`、`tests/contract/requirement-convergence-regression.test.mjs`、`tests/contract/stage-completion.test.mjs`、`tests/e2e/vnext-five-stage-current.test.mjs`、`tests/integration/vnext-delivery-close.test.mjs`、`tests/integration/vnext-official-stage-run.test.mjs`
- **READ-ONLY REGRESSION**：`tests/contract/test-runtime-profile.test.mjs`
- **DO NOT TOUCH**：other stage predicates, public status schema, `tests/acceptance/**`.

### Tasks
- `T005` RED five-field subtraction/stale/placeholder、exact interaction-field matrix，以及 multiple immutable current retry 下唯一 fact-bound outcome / true conflict 诊断；同时为 canonical acceptance producer 覆盖 malformed report、missing/duplicate AC、nonzero/timeout/cancelled child 与 same-input retry 的目标负例；depends only on T004.
- `T006` GREEN parser→handler→predicate single subject；同时让 status projector 只消费 authenticated fact-bound exact outcome，并保留 main 的 runtime-profile/test-routing/acceptance-currentness 语义；新增 test-owned `acceptance-execution-producer.mjs`，复用既有 private service executor，单次执行固定 package-local Vitest argv、解析 machine report 并输出 exact 21-ID canonical rows，不读 task store、不选 latest、不写新事实。
- `T007` EVIDENCE prepares only `quality/tests/build-code/T007/acceptance-request-repaired-current.json`: current fixture reviews, historical independent scoring, dispatch/workflow/governance census, real current interaction refs，以及 runtime-profile/test-routing facts；the public payload contains only authenticated receipts and capability proof unavailable 保持 unavailable。
- `T008` FINAL verification-only outer existing command acceptance consuming the T007 request; its inner `acceptance_data.execution` is the existing service-tier call to the T006-owned producer and the fixed union Vitest argv; implementation/test files are read-only inputs owned by T006.

### Verify
P3 paired command verifies `ORACLE-P3-HARDENING`（outline close + fact-bound outcome + producer failure semantics）；T007 produces current runtime-profile/test-routing evidence before T008；T008 invokes the outer acceptance route once for a given request hash, the service producer invokes the fixed Vitest argv once, and the aggregate emits all 21 AC exactly once。

### Knowledge
Missing review/manual evidence stays unavailable/incomplete; no test can impersonate it.

### STOP
New public runner/command, caller selector, latest/env scan, second aggregate/authority, repeated 21 aggregate commands, sixth conjunct, unknown/duplicate AC, capability proof unavailable 被改写为 pass，或破坏 main runtime-profile/test-routing/acceptance-currentness 契约。

### Done
Pending until targeted GREEN, explicit current evidence, AC set comparison and aggregate facts exist; review fact now is N/A—not executed.

### Risks and rollback
Aggregate self-report or consumer drift; revert exact P3 files first and rerun exact P3 command/oracle while preserving actual per-AC statuses.

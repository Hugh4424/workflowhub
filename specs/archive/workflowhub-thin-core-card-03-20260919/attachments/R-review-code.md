# build-code 审查机制调研（card03 / s926）

工作目录：`/Users/Hugh/Hugh/Project/workflowhub-workflowhub-thin-core-card-03-20260919`
调研范围（允许读的 12 个文件）：`workflows/build-code/SKILL.md`、`workflows/build-code/steps.json`、`skills/architect-code-review/SKILL.md`、`skills/review/SKILL.md`、`runtime/review/review-policy.mjs`、`runtime/review/review-record-route.mjs`、`runtime/review/canonical-review-result.mjs`、`runtime/stage/stage-review-disposition.mjs`、`docs/standard-workflow.md`、`AGENTS.md`、`skills/plan-eng-review/SKILL.md`、`runtime/review/review-input-bounds.mjs`

## 1. 现有审查机制盘点

约定：下文锚点一律写「相对仓库根的路径:行号」+ 逐字首句（引号内为原文片段，未逐字处标注"意译"）。
`runtime/stage/stage-review-disposition.mjs` 在任务给定路径下**不存在**，实际文件为 `runtime/review/stage-review-disposition.mjs`（见第 5 节不确定项 8）。

### 1.1 逐文件锚点与检查类别

**1) `workflows/build-code/SKILL.md`（334 行）**

| 锚点 | 逐字条款首句 | 做哪一类检查 |
| --- | --- | --- |
| `workflows/build-code/SKILL.md:9` | `## 统一回退协议` → "五个正式 stage 共用 `runtime/stage/stage-content-contracts.mjs` 的 `validateFallbackProtocol`。实现级问题留在当前 stage 修复；规格歧义在 pre/history 回 `build-spec`，post 回 `build-plan` 的 `spec-clarify`；方向级问题回 `make-decision` 做增量决策；材料缺口回对应 owner；环境不可用只记录 attempt。" | 缺口路由分类（四条通道）。**只做分类，不做"集中一次退回"**；同类缺口反复出现时允许反复走同一通道 |
| `workflows/build-code/SKILL.md:26` | "阶段末逐项披露协议：主会话先读取本 stage 的 `workflows/<stage>/steps.json` manifest" | 阶段末遗漏披露；披露基准是 steps.json 拓扑，因此**新增 step 会改变披露基准** |
| `workflows/build-code/SKILL.md:33` | `## 阶段末复盘（必须执行）` | 复盘（`stage-reflection.v2`）；是"阶段结束后"的检查，不是"Phase 边界"的检查 |
| `workflows/build-code/SKILL.md:65` | "`make-decision` exclusively owns Talk, Grill, and `decision-log.md`。" | 材料所有权；`:76-78` 逐字 "Record the concrete material gap and continue safe code, task-fact, or quality-fact repair in the same task; do not silently change the material owner or invent a new task." → **明确指示"记录缺口后继续"** |
| `workflows/build-code/SKILL.md:87` | "- Use `test-routing-advisor` once for every behavior Phase against the actual changed-file boundary." | 测试路由；"once for every behavior Phase" 是**唯一被写成"每 Phase 一次"的依赖** |
| `workflows/build-code/SKILL.md:93` | "- Use the existing OCR delegation adapter through public `review --action=record` once for each Phase." | **审查频次（正面锚点）**；`:94-95` 逐字 "Verify-code owns the one final worktree review." |
| `workflows/build-code/SKILL.md:160` | "For each ordinary `build-code/phase` review, submit `review --action=record`" | **审查范围声明**；逐字要求 "binding `review_scope=\"phase\"`, `subject_kind=\"phase\"`, and `phase_id=\"P<n>\"`" — **只锚到 P<n>，不锚文件/AC 子集，且完全没提 `subject` 字段** |
| `workflows/build-code/SKILL.md:172` | `### AC-REVIEW-011：OCR 工具不可用时的独立替代` | 同 Phase 内的第二条独立审查路；`:177-178` 逐字 "仅当工具 `unavailable` 且零成功审查路时，在同一 Phase 内调用一次 `skills/architect-code-review/SKILL.md`" |
| `workflows/build-code/SKILL.md:190` | "使用现有证据发布能力保存这份调用记录，保留其返回的原件 ref/hash；" | **证据落盘**；逐字 "`capture-evidence` 如可用，只把工作区文件收为 `quality/evidence`，并不生成 canonical review result。" → **显式允许把"工作区文件"整批收进 `quality/evidence`，无种类白名单、无份数上限** |
| `workflows/build-code/SKILL.md:201` | `## Work loop` | 主循环 |
| `workflows/build-code/SKILL.md:203` | "1. Read current cohort materials and the physical Phase authority, then select the next incomplete Phase task from its task facts." | **Phase 选择 + Phase Card**；逐字字段 "goal, exact allowed files and symbols, covered ACs, non-goals, compatibility boundary, predesigned test route, stop conditions, and expected stage-end summary" → Phase Card 有范围，但**没被提升为审查 subject** |
| `workflows/build-code/SKILL.md:227` | "5. Use the review dependency declared in `skill-deps.yaml` directly for one review of the completed Phase." | **审查去重（人读）**；`:231-232` 逐字 "`unavailable` remains an unavailable fact. Do not re-review an unchanged change merely to chase an empty findings list." → 唯一"不重审"纪律，条件限定在 "unchanged change" + "chase an empty findings list" |
| `workflows/build-code/SKILL.md:235` | "6. Inspect every finding and record `fixed`, `rejected_invalid`," | **finding 处置 + 定向复测**；`:237-238` 逐字 "Repair valid findings in this same task and rerun affected checks." |
| `workflows/build-code/SKILL.md:240` | "7. End the Phase with a plain-language handoff: delivered behavior, actual test layer and result, AC limits, review fact, finding disposition, unresolved risk, deferred work, and the next Task." | **Phase handoff（成本可见性的落点）**；清单里**没有时间、调用数、等待时长任何一项** |
| `workflows/build-code/SKILL.md:271` | "After the phase facts are recorded, a phase may be committed only when the user has separately authorized the irreversible operation." | 提交授权 |
| `workflows/build-code/SKILL.md:280` | "A current Phase review is required as a recorded quality fact. Its findings and transport status are not a progression gate" | 审查=事实非门禁 |
| `workflows/build-code/SKILL.md:284` | "`unavailable` is never `pass` and never a work blocker." → "When status reports `work_status=ready` with `quality_status=in_progress\|incomplete\|unavailable`, continue the next safe implementation or focused verification action; do not wait for a provider or rerun a completed review." | **build-code 侧最强的"不重跑已完成审查"锚点**，但只在 status=ready 场景生效 |
| `workflows/build-code/SKILL.md:304` | "Build-code does not run the aggregate regression command after each Task." | 定向复测的反面锚点；`:305-306` 逐字 "Focused tests belong to each Phase; the recorded final command belongs to the final aggregate." |

**2) `workflows/build-code/steps.json`（21 行）**

- `workflows/build-code/steps.json:12`（step_id 8 `review-change`）逐字 observable_result："Dispatch one OCR delegation review through review --action=record with review_scope=phase, subject_kind=phase, and the current phase_id." → **manifest 层已写 "one ... review"**，范围粒度仍只有 phase_id。
- `workflows/build-code/steps.json:13`（step_id 9 `analyze-review-findings`）逐字："Every review finding has a disposition in current task facts; valid findings are repaired before handoff." → **无定向复测措辞**。
- `workflows/build-code/steps.json:14`（step_id 10 `capture-implementation`）逐字："The actual implementation and execution facts are current in the task worktree and current task facts; no parallel implementation record is created." → "no parallel implementation record" 是 manifest 层最接近证据重复的条款，**只禁"平行实现记录"，不禁目录快照**。
- 全文件**没有**：Phase 唯一性、审查次数、成本、证据种类/份数、集中退回。step 序列本身是严格的单 Phase 循环（`steps.json:5-15`，step 1→11）。

**3) `skills/architect-code-review/SKILL.md`（75 行）**

- `skills/architect-code-review/SKILL.md:16` 逐字："四项 lens 合并为一次独立调用。本技能保留供人工显式调用和历史结果解读。正常流程由 build-code 对每个 Phase 发起一次 OCR 审查" → "每 Phase 一次"第二次出现（人读侧）。
- `skills/architect-code-review/SKILL.md:29` `## 审查顺序`：
  - `:31` "先确认当前 diff、基线和真实入口；不要只看单元测试或人工挂载的 fixture。" → 范围锚定（**靠审查者自己确认**，不是输入里写死）。
  - `:35` 逐字 "检查测试是否真正走过关键入口、外部状态和失败边界；根据改动范围运行最小的受影响检查，不以绿色命令本身代替行为证明，也不条件反射地重跑全量回归。" → **(h) 的审查侧锚点**。
- `skills/architect-code-review/SKILL.md:40` `## 唯一输出契约`；`:48` 逐字 "`findings: []` 仅表示审查确实完成且没有发现问题。审查未完成、执行不可用或结果不确定时，不得用空数组表示成功"
- `skills/architect-code-review/SKILL.md:60` `## 处置` 逐字 "主 Agent 负责修复和处置，每条 finding 只能是 `fixed`、`rejected_invalid`、`accepted_risk` 或 `needs_human`；原始 finding 必须保留，不把审查失败改写为空 findings，**也不要求第二次 review 来证明材料完整**。" → **(a) 的正面锚点**，但只否掉"为证明材料完整而重审"，不管"同一 Phase 同一范围"。
- `skills/architect-code-review/SKILL.md:64` 逐字 "普通 verify-code 的 OCR 审查与定向复验遵守该 workflow 的一次审查合同；可选的 Architect 诊断不触发额外正式审查轮次。"

**4) `skills/review/SKILL.md`（31 行）**

- `skills/review/SKILL.md:3` 逐字 description："Report-only independent review lens for correctness, scope, evidence, and unresolved risk." → **"scope" 是被审维度之一**。
- `skills/review/SKILL.md:10` `## Check`：
  - `:14` 逐字 "Flag scope drift, missing acceptance evidence, and contradictory artifacts." → **(b) 的审查侧唯一锚点**：审查者被要求"报告范围漂移"，但输入里没有写死的范围，所以只能报告、无法证明"范围未变"。
  - `:13` "Compare every material claim with packet evidence."
- `skills/review/SKILL.md:18` `## Evidence handling`：`:20` 逐字 "Missing evidence is unavailable, never pass. Use the supplied packet only." → 证据只读输入包；**不要求审查者核对证据目录是否膨胀/重复**。
- `skills/review/SKILL.md:21-25` 逐字限制 finding 字段："must not add `axis`, `visibility`, `anchor`, `consequence`, or `correction` output fields"、"Every finding must use only the provider protocol fields: `severity`, `path`, optional `line`, `issue`, `root_cause`, `recommendation`, `evidence_kind`, and `evidence`." → **结果契约是窄的，承载不了"审查范围"信息**（第 4 节提案 7 的依据）。
- `skills/review/SKILL.md:29` 逐字 "Return exactly one JSON object: `{ \"findings\": [...] }`."

**5) `runtime/review/review-policy.mjs`（103 行）**

- `runtime/review/review-policy.mjs:3` `const FORMAL_STAGES = new Set(["make-decision", "build-spec", "build-plan", "build-code", "verify-code"]);`
- `runtime/review/review-policy.mjs:6` `const REVIEW_SCOPES = new Set(["phase", "integration"]);` → build-code 合法范围**只有两个值**。
- `runtime/review/review-policy.mjs:49-53` 逐字 `if (stage === "build-code") { if (reviewScope !== null && reviewScope !== undefined && !REVIEW_SCOPES.has(reviewScope)) throw new TypeError("build-code requires phase or integration review_scope"); }`
- `runtime/review/review-policy.mjs:89-90` 逐字 `if (stage === "build-code") {` / `const scope = reviewScope ?? "phase";` → **policy 层默认值 = `phase`**。
- `runtime/review/review-policy.mjs:101` 逐字 `export function minimumReviewersFor(stage, track = null, reviewScope = null)` → 每个审查面带 `minimum_reviewers`：**"一次 review" 在 provider 侧可能是多次调用**（见第 5 节 7）。

**6) `runtime/review/review-record-route.mjs`（2414 行；本次只核 300–529 与 560–799 共 470 行）**

- `runtime/review/review-record-route.mjs:349` `const SHARED_REVIEW_TUPLE_FIELDS = ["subject_kind", "phase_id", "review_scope"];`
- `runtime/review/review-record-route.mjs:351-353` 逐字 `function defaultSharedReviewTuple(stage) {` / `return stage === "build-code"` / `? { subject_kind: "worktree", phase_id: null, review_scope: "integration" }` → **record 层 build-code 默认 = `integration`（整棵 worktree）**，与 `review-policy.mjs:90` 的 `phase` 默认**方向相反**。未显式声明三者时，落到 integration。
- `runtime/review/review-record-route.mjs:357` `function assertSharedReviewTuple(stage, tuple, label = "review") {`；`:363-370` phase 要求 build-code + `subject_kind=phase` + 非空 `phase_id`；integration 要求 build-code + `subject_kind=worktree` + `phase_id=null`。→ 三者必须**成组一致**，缺一即失败或换类。
- `runtime/review/review-record-route.mjs:614` 逐字 `function reviewSubjectHash(subject) {` / `return textHash(canonicalJson(subject ?? null));`；`:618` `function attemptSubjectHash(attempt)`；`:623` `function subjectMatchesAttempt(attempt, subject) {`；`:628-630` 逐字 `return actual === null ? (subject === undefined || subject === null) : actual === reviewSubjectHash(subject);` → **`subject` 字段确实存在并被哈希进 closure**，但两边都为 null 时"视为匹配"，等于**范围未限定也合法**。
- `runtime/review/review-record-route.mjs:633` 逐字 `function findReusableReview({ history, request, routeIdentity = null, snapshotTree = null, requestKey = null, retry = null, materialId = null }) {`；`:635-637` 逐字注释 "An origin that cannot be reconstructed from the record fails closed: the request is dispatched only when no authenticated reusable attempt exists whose canonical identity is unprovable."
- `runtime/review/review-record-route.mjs:648-660` 逐字注释 "Canonical dedup identity, exactly as spec FR-C4-001 fixes it: (stage, phase_id, track, review_kind, origin). … It deliberately does not name what was reviewed, so it is not by itself a sufficient reuse key: D-007 requires that a change to the submitted material must never read back the earlier review" → **复用键不含"审了什么"**。
- `runtime/review/review-record-route.mjs:672` 逐字 `if (!SHA256_HEX.test(materialId ?? "") || attempt.material_id !== materialId) continue;` → **提交材料字节一变，复用立即失效**。这是"同一 Phase 被正式审查两次"的机器级成因：Phase 内修一条 finding 就会改写 packet 字节。
- `runtime/review/review-record-route.mjs:692` `if (retry?.admitted && attempt.request_key !== requestKey) continue;`
- `runtime/review/review-record-route.mjs:746` `function reviewClosure(request, identity, materialId, requestKey, routeIdentity = null) {`；`:751-754` 逐字 `material_scope: request.review_scope ?? request.reviewScope ?? null,` / `subject_kind: request.subject_kind ?? "worktree",` / `subject_sha256: textHash(canonicalJson(request.subject ?? null)),` → 每次派发都留下了 subject 证据（**可用于事后核实**，见第 5 节 2/3）。
- `runtime/review/review-record-route.mjs:1279-1280` 逐字注释 "Authenticated host request path. The request is dispatched and persisted under one task lock; a second identical current request reuses the immutable canonical refs instead of dispatching a second provider call."
- `runtime/review/review-record-route.mjs:1492` 逐字 `status: "recorded", reused: true, dispatch_state: "reused", ...reusable,`
- `runtime/review/review-record-route.mjs:1504` 逐字 "verify-code review belongs to an older code snapshot; an explicit judged retry is required" → **只有 verify-code 有 snapshot 级失效判定**；build-code 没有等价的"Phase 范围失效"判定。
- `runtime/review/review-record-route.mjs:1995` 逐字 `* Import an already-created canonical result without creating a new attempt or` → 存在"只导入结果、不新建 attempt"的旁路（未逐行核，见第 5 节 5）。

**7) `runtime/review/canonical-review-result.mjs`（369 行）**

- `runtime/review/canonical-review-result.mjs:63-64` `function findingKey(finding) {` / 逐字 `return \`${finding.path}\\u0000${finding.line ?? ""}\\u0000${normalizedIssue(finding.issue).join(" ")}\`;`；`:66-77` `sameCluster` 只按 `(path, line, 完全相同的 issue 词序列)` 合并 → **同一 Phase 两次审查产生同一条 finding 会被折叠成一个 cluster，重复审查在结果层不可见**。
- `runtime/review/canonical-review-result.mjs:113` 逐字 ``id: `F-${createHash("sha256").update(findingKey(finding)).digest("hex").slice(0, 12)}`,``
- `runtime/review/canonical-review-result.mjs:132` `export function aggregateCanonicalProviderResults(providerResults, minimumReviewers = 1, …)`
- `runtime/review/canonical-review-result.mjs:191-192` 逐字注释 "Quorum counts each authenticated member once (`valid`), but the finding union must retain distinct claims from every valid result by that member."
- `runtime/review/canonical-review-result.mjs:228` 逐字 `if (distinctAdapters < minimumReviewers || distinctSources < minimumReviewers) return { status: "unavailable", valid, findings, adjudication };`
- `runtime/review/canonical-review-result.mjs:232` `export function conservativelyAssessUnattestedAnchors(items) {` → 无锚点证据一律置 false（保守裁决）。
- `runtime/review/canonical-review-result.mjs:356` 逐字 `if (aggregation.status !== "available" && !partial) invalid("completed provider outputs do not satisfy review quorum");`

**8) `runtime/review/stage-review-disposition.mjs`（324 行）**

- `runtime/review/stage-review-disposition.mjs:8` 逐字 `const FINDING_DISPOSITION_STATUSES = new Set(["fixed", "rejected_invalid", "accepted_risk", "needs_human", "user_decided"]);`
- `runtime/review/stage-review-disposition.mjs:43` `export function isActionableSeriousFinding(cluster) {` → 只有 `disposition==="actionable" && severity ∈ {major,blocking} && evidence_status ∈ {direct,corroborated_inference}` 才生成暂停卡。
- `runtime/review/stage-review-disposition.mjs:55` `export function canonicalReviewFindings(result) {`；`:63-66` 逐字注释 "An explicit empty `findings` array is the canonical statement that no reportable finding was adopted."
- `runtime/review/stage-review-disposition.mjs:80` `export function validateReportableFindingDispositions({ result, dispositions, authorizedRiskFindingIds = [], userReply = undefined } = {}) {`；`:83` findings 为空即 `status: "not_applicable"`。
- `runtime/review/stage-review-disposition.mjs:151` `function cardFor(cluster, reviewRef, reviewHash, snapshotTree) {`；`:170-172` 逐字 `` `如果继续，该问题会保留在快照 ${snapshotTree} 中，并可能影响 ${cluster.path ?? "本阶段交付范围"}。` `` → **暂停卡 / 风险接收绑定的是 `snapshot_tree`（整棵树）**，不是 Phase 边界。
- `runtime/review/stage-review-disposition.mjs:196` `export function deriveSeriousReviewPause({…} = {}) {`；`:212-214` 逐字 `if (review.task_id !== taskId || review.stage !== stage || !TREE.test(review.snapshot_tree ?? "")) {` / `throw new Error("review result identity/snapshot mismatch");`
- **该文件完全没有"同一 Phase 只审一次""审查范围"概念**：只有 finding 级处置与 snapshot 级绑定。

**9) `docs/standard-workflow.md`（402 行）**

- `docs/standard-workflow.md:81` `### review、测试和成本`；`:83-86` 逐字 "代码审查使用 OCR delegation：`build-code` 每个 Phase 一次，`verify-code` 在最终 worktree 一次。… 无真实审查结果时保留 `unavailable`，不把空 findings 当作补救结果。" → **(a) 的人读规范锚点**。
- `docs/standard-workflow.md:88-89` 逐字 "没有真实主题变化，不重复全文读取、测试、review 或 analyzer。材料、风险或有效 finding 实际变化时，只重跑受影响的检查；build-code 的最终 aggregate 按计划在全部 phase 完成后运行一次。" → **(a)+(h) 的规范锚点**；触发条件是"主题变化"，对"材料字节变化算不算主题变化"**没有人工判据**。
- `docs/standard-workflow.md:90-92` 逐字 "时间和 token 只作诊断，按 **step**、skill、读取、交互、provider wait、测试、review、返工和用户等待拆分；不可得就写 `unavailable`，不设统一预算 gate" → **(g) 的唯一锚点**：粒度是 step 而**不是 Phase**，且只列"时间和 token"（无调用数、无材料修订次数）。
- `docs/standard-workflow.md:109` 逐字 "发现的 finding 由当前 stage 逐条处置；实际修复后只重跑受影响的检查，使用 `spec-analyze` 的 stage 也仅重跑受影响的 profile。" → (h)。
- `docs/standard-workflow.md:270` `## \`build-code\`：按 phase 实施并保留真实证据`；`:277` `### 每个 phase 的标准循环`；`:286` 逐字 "8. `review-change`：对当前 Phase diff 发起一次 OCR 独立审查，记录真实结果或 unavailable。"；`:292-293` 逐字 "每个 phase 都重复以上循环，但不重复无关的全量测试或 review。有效问题在当前 phase 修复，然后只重跑受影响检查。" → (a)(f)(h) 的规范锚点。
- `docs/standard-workflow.md:304-307` 逐字 "核心产物是实现变更、phase task facts、canonical test receipts、review facts、AC trace、final aggregate 和当前阶段事实。… provider failure、测试失败、缺 AC 证据、缺 step outcome、snapshot 漂移和 serious finding 必须原样保留。" → 产物清单里**没有"每 Phase 成本行"**；有"必须原样保留"但**没有"禁止新增快照/重复件"**。
- `docs/standard-workflow.md:336` 逐字 "6. `targeted-recheck`：仅对实际修复及受影响行为做必要的定向复验。"（verify-code 侧）；build-code 侧无对应 step 名。
- 全文**无**：证据种类/份数条款、不并行推进多 Phase 条款、Phase 级成本行。

**10) `AGENTS.md`（69 行）**

- `AGENTS.md:14-15` 逐字 "重活放进子代理上下文执行，主上下文只收摘要（减少主上下文占用）。" / "重读量动作点默认派子代理：grep 全仓扫描、跑测试/采集 RED/GREEN 证据、读多文件对标、反向引用扫描——这些由子代理在其上下文执行，主上下文（工头）只收结论摘要（路径+exit_code+清单）" → **"重活下放 + 收清单"本身鼓励产出大量中间产物**，与 28 MB 证据并存。
- `AGENTS.md:19` `### 测试硬规则（本任务后续执行）`；`:21` 逐字 "只跑受影响针对性测试；禁止全量回归：禁止无范围地跑全量 `vitest`、`npm test` 或 `test:safe`。"；`:23` 逐字 "本条是执行纪律，不是新的 stage、gate 或质量结论。" → **(h) 的仓库级锚点**，也是本项目"纪律不新增门禁"的**写法样板**（第 3 节全部提案照此格式）。
- `AGENTS.md:25` `### 卡住与升级（本任务后续执行）`；`:27` 逐字 "卡住时必须先把话说明白再停：用日常语言写清「现在卡在哪、为什么不能继续、有几条路、每条路的代价与风险」，并给出可以直接回复的选项。"；`:29` 逐字 "同一件事连续若干次没有产生任何新事实时，停止自动续跑…不重复同一次无进展的尝试。" → **最接近 (c)「集中停下退回」的现成条款**，但文义指向"卡住/无进展"，**不覆盖"计划本身有缺口"**。
- `AGENTS.md:53` 逐字 "provenance、原始 review 事实和失败事实必须保留，不能用摘要覆盖来源，也不能把 provider 失败改写为质量通过。" → 证据侧只有"必须保留"，**反向无"禁止新增快照"**。
- `AGENTS.md:65` 逐字 "游标只定位续跑位置，不证明完成、不阻止继续，也不保存历史序列；材料版本变化时读为 stale，代码快照变化本身不使它 stale。"；`:66` 禁止 successor/selector/snapshot lineage/… → **(e) 的治理锚点**：版本绑定走"**材料版本**"，且明确"代码快照变化不使 stale"。
- 全文**无**："每 Phase 一次审查"、"证据只存一份"、"一次只推进一个 Phase"。

**11) `skills/plan-eng-review/SKILL.md`（48 行）**

- `skills/plan-eng-review/SKILL.md:10-13` 逐字 "build-plan calls it directly after the plan draft and before test routing; wh-review only reads the resulting fact … It remains a lens-only observation source, not a runner or progression gate."
- `skills/plan-eng-review/SKILL.md:24` `## Check`，八条：
  - `:33-34` 逐字 "Check task dependency order, file ownership, and whether every parallel `[P]` claim has independent inputs and non-overlapping files." → **计划侧唯一涉及"并行"的条款，且是正面允许 task 级并行**。没有"一次只推进一个 Phase"。
  - `:36-38` 逐字 "Check every behavior change has an implementation-before RED and a post-implementation GREEN with an exact executable command, expected exit, evidence path, and observable oracle. Reject placeholder or default full suite commands." → **(d)+(h) 的计划侧锚点**：证据路径是必需项，但**不规定证据的种类与份数**。
  - `:30-32` "Check every changed interface, function signature, CLI, event, and schema against an exact current anchor and an explicit consumer."
- `skills/plan-eng-review/SKILL.md:46` `## Result` 逐字 "Return anchored findings, affected FR/AC/task IDs, engineering consequence, and the smallest corrective action to `wh-review`."
- 全文件**无**"计划缺口必须集中退回"条款。

**12) `runtime/review/review-input-bounds.mjs`（25 行）**

- `runtime/review/review-input-bounds.mjs:5-6` 逐字注释 "Keep the complete diff in the provider input. Provider capability, rather than a local byte ceiling, decides whether delivery is possible."
- `runtime/review/review-input-bounds.mjs:7-16` `export function compactReviewDiff(diff) {` → 只回 `{diff, index:{mode:"full", full_diff_bytes, full_diff_sha256}}`，**不做任何截断**。
- `runtime/review/review-input-bounds.mjs:21` 逐字注释 "Preserve the complete caller material. This compatibility seam keeps its return shape, but no longer rewrites or rejects material by local size."；`:23` 逐字 `export function compactVerifyCodeMaterials(materials) { return { materials, diff: null }; }`
- → **(d) 的机器层成因**：本地不存在任何"材料/证据体积"约束。体积**完全由执行者纪律决定**；若执行者把整棵树快照塞进 materials，也会被原样送出。

### 1.2 a–h 检查项对照表

| # | 检查项 | 现有机制 | 锚点 | 缺口一句话 |
| --- | --- | --- | --- | --- |
| a | 同一 Phase 同一范围只做一次正式审查，已有成功结果不重派 | **部分** | 有：`workflows/build-code/SKILL.md:93`（once for each Phase）、`:227`（one review）、`:231-232`（Do not re-review an unchanged change…）、`:284`（do not … rerun a completed review）、`workflows/build-code/steps.json:12`（Dispatch one … review）、`docs/standard-workflow.md:83`（build-code 每个 Phase 一次）、`:88`（没有真实主题变化，不重复…review）、`skills/architect-code-review/SKILL.md:62`（不要求第二次 review 来证明材料完整）、`runtime/review/review-record-route.mjs:633`+`:672`+`:1279`（机器复用） | 所有"一次"措辞都以 **"unchanged change / 没有真实主题变化"** 为条件，而机器复用判据是 `material_id` **字节全等**（`review-record-route.mjs:672`）。**Phase 内修一条 finding 就会改写 packet 字节 → 复用失效 → 第二份正式回执**。没有任何条款要求执行者在发起第二次前先回答"已有成功回执覆盖的范围与我这次要审的范围是否相同"。 |
| b | 审查范围（subject）被显式限定，后续小改动不会让旧回执整体作废 | **部分** | 有字段：`runtime/review/review-record-route.mjs:492`（`subject: request.subject ?? null`）、`:614`（`reviewSubjectHash`）、`:623`（`subjectMatchesAttempt`）、`:751-754`（closure 落 `subject_sha256`）；有粒度限制：`runtime/review/review-policy.mjs:6`/`:49-53`/`:90`（只有 phase/integration 两个值）；有审查侧检查：`skills/review/SKILL.md:14`（Flag scope drift） | `subject` 是**自由字段**，`workflows/build-code/SKILL.md:160-162`、`workflows/build-code/steps.json:12`、`docs/standard-workflow.md:286` 三处**都没要求填写**；缺省为 null 后落在 null 命名空间（`review-record-route.mjs:628-630`），等于"范围未限定"。Phase Card 里已有 exact allowed files and symbols / covered ACs（`SKILL.md:205-206`），却**没有被提升为审查 subject**，也没成为复用键（`:654-660` 明说复用键不含"审了什么"）。 |
| c | 发现计划缺口时集中一次退回计划负责人 | **无** | 只有分类通道：`workflows/build-code/SKILL.md:9-14`（四条回退通道）、`:65`-`:78`（尤其 `:76-78` 逐字 "Record the concrete material gap and continue safe code, task-fact, or quality-fact repair in the same task"）；最接近的通用条款是 `AGENTS.md:27`/`:29`（但文义是"卡住/无进展"） | 现有条款**明确指示"记录缺口后继续"**，没有任何"集中一次、成组退回"的要求，也没有"退回后本 Phase 受影响部分停手直到答复"的措辞。这条是"边做边改计划"的直接许可来源。 |
| d | 证据只要求原始件各一份，禁止目录快照 | **无**（且有一处反向授权） | 反向授权：`workflows/build-code/SKILL.md:190-192` 逐字 "`capture-evidence` 如可用，只把工作区文件收为 `quality/evidence`"；机器侧不做体积约束：`runtime/review/review-input-bounds.mjs:5-6`/`:21`；只有"必须保留"没有"禁止新增"：`AGENTS.md:53`；只禁"平行实现记录"：`workflows/build-code/steps.json:14`；证据路径是必需项但无种类限制：`skills/plan-eng-review/SKILL.md:36-38` | 五处都只说"要留证据 / 要保留 provenance"，**没有一处说"每类事实只留一份原始件"或"禁止整棵工作树 / 整目录快照"**。三份 5,576 文件 / 143 MB 的整树快照在现有条款下**不违规**。 |
| e | 业务规则版本绑定在稳定规则段落上，而不是整份常变文件的哈希 | **部分**（绑定在"材料版本"，不是"规则段落"） | `workflows/build-code/SKILL.md:250-251` 逐字 "It is bound to the current material revision, not the changing code snapshot."；`AGENTS.md:65` 逐字 "材料版本变化时读为 stale，代码快照变化本身不使它 stale"；`runtime/review/review-record-route.mjs:468-477`（`reviewRequestMaterialId` 对**整份 packet** 取哈希）、`:672`（全等门控）、`:682-686` 逐字注释 "`material_revision` (the specification bundle revision) stays provenance rather than a reuse-key dimension" | 可用粒度只有 **"整份材料 packet"** 或 **null subject**，没有"规则段落"粒度（某个 `phases/P<n>.md` 里某节的稳定锚）。因此 `P<n>.md` 里**任一字节变化**都让回执 stale，哪怕变的是与本 Phase 无关的段落。 |
| f | 一次只推进一个 Phase（不并行改多个 Phase 材料） | **部分**（默认单 Phase 循环，无显式独占条款） | `workflows/build-code/SKILL.md:203-208`（"select the next incomplete Phase task"，单数）、`:253-255`（"Then continue with the next `pending` or `in_progress` Task; do not replay earlier Phases"）、`workflows/build-code/steps.json:5-15`（step 1→11 单 Phase 循环）、`docs/standard-workflow.md:277`/`:292`（"每个 phase 的标准循环"/"每个 phase 都重复以上循环"）；反向：`skills/plan-eng-review/SKILL.md:33-34`（正面允许 `[P]` 并行 task） | 没有一句禁止"同时改多个 Phase 的材料"或"一个 Phase 未收尾就开下一个"。`[P]` 条款只要求 task 之间文件不重叠，**容易被读成鼓励跨 Phase 并行推进**。 |
| g | 每 Phase 真实成本（实施/测试/审查/等待/材料修订耗时与调用数）可见 | **部分**（只到 step 粒度，只列时间/token） | `docs/standard-workflow.md:90-92` 逐字 "时间和 token 只作诊断，按 step、skill、读取、交互、provider wait、测试、review、返工和用户等待拆分；不可得就写 `unavailable`，不设统一预算 gate"；落点缺失：`workflows/build-code/SKILL.md:240-249`（Phase handoff 清单无成本项）、`docs/standard-workflow.md:304-307`（产物清单无成本行）；`runtime/review/stage-review-disposition.mjs:19`（允许字段里有 `elapsed_ms`，但只是 finding 处置的可选字段） | 粒度是 **"step" 而不是 "Phase"**，且**不含调用数 / 审查派发次数 / 材料修订次数**；"不设统一预算 gate" 写成"不设预算"，容易被读成"不必报成本"，因此 34 小时 / 12.6 亿 token 直到复盘才浮现。 |
| h | finding 之后的定向复测（只跑受影响测试）有条款支撑 | **有**（形态偏弱） | `workflows/build-code/SKILL.md:237-238` 逐字 "Repair valid findings in this same task and rerun affected checks."；`:304-306` 逐字 "Build-code does not run the aggregate regression command after each Task. Focused tests belong to each Phase; the recorded final command belongs to the final aggregate."；`AGENTS.md:21-23`；`docs/standard-workflow.md:109`/`:292`；`skills/architect-code-review/SKILL.md:35`；`docs/standard-workflow.md:336`（verify-code 的 `targeted-recheck`） | 条款只说 "rerun affected checks"，**没要求执行者先列出"受影响的测试集合"再跑**，也没要求把每条结果回填到对应 finding。`workflows/build-code/steps.json:13` 的 observable_result 里完全没有定向复测措辞。 |


## 2. 这次的问题本该被哪一步抓住

逐条对应 a–h。写法：「第几步（step_id / step 名）→ 缺什么条款 → 如果补上，会在此刻发现」。

**a. 同一 Phase 同一范围只做一次正式审查 → 第 8 步 `review-change`（`workflows/build-code/steps.json:12`），次责第 9 步 `analyze-review-findings`（`:13`）。**
- 第 8 步的 observable_result 只写 "Dispatch one OCR delegation review … with the current phase_id"，**没有"发起前先核对本 Phase 是否已有成功回执"这个动作**。
- 第 9 步只检查 "Every review finding has a disposition"，**不检查"这次审查是不是多余的"**。
- 缺的是：一个把"本 Phase 已存在的成功回执 ref + 该回执覆盖的范围 + 本次范围是否超出"写下来的位置。现有 `workflows/build-code/SKILL.md:231-232` 的"不重审"只否掉 chasing an empty findings list 这一种动机，而实际重派是**材料字节变化**触发的（`runtime/review/review-record-route.mjs:672`），这条动机根本没被条款覆盖。
- 补上后：执行者在第 8 步**派发之前**就会被迫列出旧回执范围，从而发现"这是第二次审同一范围"。

**b. 审查 subject 被显式限定 → 第 1 步（写 Phase Card，`workflows/build-code/SKILL.md:203-208`）+ 第 8 步（提交请求，`:160-162`）。**
- 第 1 步已经产出 `exact allowed files and symbols, covered ACs`——**范围信息本来就在手上**。
- 第 8 步却只把 `review_scope="phase"` + `subject_kind="phase"` + `phase_id="P<n>"` 送出去，**`subject` 字段一次都没被提到**（`review --action=record` 的请求里它是自由字段，`runtime/review/review-record-route.mjs:492`）。
- 缺的是：Phase Card 的范围字段 → 审查请求 `subject` 的那一跳。补上后：任何"材料变了"都不会让旧回执自动作废，因为复用键里终于带了"审了什么"。
- 附带发现：`runtime/review/review-policy.mjs:90` 默认 `phase`，而 `runtime/review/review-record-route.mjs:351-353` 的 `defaultSharedReviewTuple` 对 build-code 默认 `{subject_kind:"worktree", phase_id:null, review_scope:"integration"}`——**未显式声明三者时会静默落到"整棵树 integration"**，这正是"小改动让旧回执整体作废"的机器成因。第 8 步缺"三者必须成组显式声明"的提醒。

**c. 计划缺口集中一次退回 → 第 3 步 `implement-change`（`workflows/build-code/steps.json:7`），事后第 13 步 `stage-end-spec-analyze`（`:17`）只能补救。**
- 第 3 步是实现步，`workflows/build-code/SKILL.md:9-14` 的"统一回退协议"**只做分类**（实现级 / 规格歧义 / 方向级 / 材料缺口），而 `:76-78` 逐字 "Record the concrete material gap and continue safe code, task-fact, or quality-fact repair in the same task" 是**明确指示继续做**。
- 缺的是"停机 + 成组退回"的动作定义：一次性列全缺口、只退回一次、退回期间受影响部分停手。`AGENTS.md:27`/`:29` 的"卡住与升级"是最近似的现成条款，但它的触发词是"卡住/无进展"，而"计划本身有缺口"在执行者看来**不叫卡住**，叫"边做边补"。
- 补上后：执行者在第 3 步第一次意识到"计划的允许文件不对/AC 无法验证"时就会停下来成组退回，而不是做完 34 小时。

**d. 证据只存一份、禁止目录快照 → 第 10 步 `capture-implementation`（`workflows/build-code/steps.json:14`）+ `### AC-REVIEW-011` 的证据段（`workflows/build-code/SKILL.md:190-192`）。**
- `workflows/build-code/steps.json:14` 只禁 "no parallel implementation record"；`workflows/build-code/SKILL.md:190-192` 逐字允许"只把**工作区文件**收为 `quality/evidence`"——**"整棵工作树"在这个措辞下完全合法**。
- 第 13 步的 spec-analyze 检查"实际语义与证据"，**不检查证据目录是否重复**；`skills/review/SKILL.md:20` 的 "Use the supplied packet only" 也让审查者看不到证据目录现状。
- 缺的是证据种类白名单 + 每类只留一份原始件 + 禁止目录快照。补上后：三份 5,576 文件 / 143 MB 的整树快照**在第一份落盘时就不该产生**。
- 机器侧确认无兜底：`runtime/review/review-input-bounds.mjs:5-6` 逐字 "Provider capability, rather than a local byte ceiling, decides whether delivery is possible."，`:21` "no longer rewrites or rejects material by local size"——**本地不存在任何体积约束，体积完全由执行者纪律决定**。

**e. 规则版本绑定在稳定段落上 → 第 1 步（Phase Card / 读材料）+ 第 8 步。**
- 现有可用粒度只有两个：`material_revision`（整份材料 bundle 的哈希，`runtime/review/review-record-route.mjs:468-477`）与 `subject`（自由字段，默认 null）。
- `AGENTS.md:65` 逐字 "材料版本变化时读为 stale，代码快照变化本身不使它 stale" 说明治理层选的就是"材料版本"粒度，**没有"规则段落"这一档**。
- 缺的是：Phase Card 里写"本 Phase 依赖哪几条规则（文件+章节首句逐字 / FR·AC 编号）"和"本 Phase 预计会改材料哪些段落"。补上后：`P<n>.md` 里与本 Phase 无关段落的变化就不再让本 Phase 的审查/实现事实整体 stale。

**f. 一次只推进一个 Phase → 第 1 步（选择下一个 Phase task）+ 第 7 步后的"continue with the next"。**
- `workflows/build-code/steps.json:5-15` 的 step 序列本身是单 Phase 循环，`workflows/build-code/SKILL.md:203` 用单数 "the next incomplete Phase task"，`docs/standard-workflow.md:292` 说"每个 phase 都重复以上循环"。
- 但这些全是**陈述性**的，没有一句是"当前 Phase 未收尾前不得开工下一个 Phase、不得并发修订多个 `phases/P<n>.md`"。反向还存在 `skills/plan-eng-review/SKILL.md:33-34` 正面允许 `[P]` 并行。缺的是显式独占条款。
- 补上后：执行者在第 1 步选 Phase 前必须回答"上一个 Phase 收尾了吗"，在第 7 步 handoff 后必须回答"我现在到底在推进哪一个 Phase"。

**g. 每 Phase 真实成本可见 → 第 7 步 handoff（`workflows/build-code/SKILL.md:240-249`）+ 第 15 步 `stage-reflection`（`workflows/build-code/steps.json:19`）。**
- 第 7 步的 handoff 清单有 delivered behavior / actual test / AC limits / review fact / finding disposition / unresolved risk / deferred work / next Task，**一项成本都没有**。
- `docs/standard-workflow.md:90-92` 是唯一成本锚点，但粒度是 **step 不是 Phase**，字段只有"时间和 token"，**没有调用数、没有审查派发次数、没有材料修订次数**；而且注明"不设统一预算 gate"，容易被读成不必报数。
- 补上后：34 小时 / 12.6 亿 token 这种量级会在**每个 Phase 边界**以数字形式出现，而不是等 34 小时后复盘。

**h. finding 后的定向复测 → 第 9 步 `analyze-review-findings`（`workflows/build-code/steps.json:13`）+ `workflows/build-code/SKILL.md:235-239`。**
- 条款已经有了（`workflows/build-code/SKILL.md:237-238` "rerun affected checks"、`:304-306` "does not run the aggregate regression command after each Task"、`docs/standard-workflow.md:109`）。
- 缺的是**形态**：没要求执行者先写出"受影响的测试集合（文件/用例名）"再跑，也没要求把每条结果回填到对应 finding 的处置里；`workflows/build-code/steps.json:13` 的 observable_result 里完全没有复测措辞。
- 补上后：执行者在第 9 步会被迫先列集合再跑，避免"顺手重跑一大片"变成新的时间黑洞（也避免用全量回归代替定向复测）。

**一句话总因**：这批问题全部落在**"第 1 步定范围、第 8 步派审查、第 9 步处置、第 7 步收尾"四个位置缺少"必须回答的问题"**，而不是缺机器能力。机器侧反而有三处反向许可：`material_id` 字节全等门控（导致重派）、`control` 层默认 `integration`（导致范围过宽）、`compactReviewDiff` 不做体积约束（导致证据膨胀）。


## 3. 具体修改提案

格式：**P<n>｜对应检查项｜落到哪｜锚点逐字首句｜条款草案｜发现时机**。
所有草案都是"给执行者看的检查清单/必须回答的问题"，**不新增 stage、gate、状态机、schema 字段或机器判定**，并逐条自带「本条是执行纪律，不是新的 stage、gate 或质量结论」——照 `AGENTS.md:19-23` 的 `### 测试硬规则（本任务后续执行）` 写法。全部落在已有文件的已有锚点上，**不新建文件**。

---

### P1｜对应 a + b｜同一 Phase 同一范围只审一次，且范围显式

**加到**：`workflows/build-code/SKILL.md` → `## Work loop` 第 5 条
**锚点逐字首句**：`5. Use the review dependency declared in \`skill-deps.yaml\` directly for one`

```markdown
5. Use the review dependency declared in `skill-deps.yaml` directly for one
   review of the completed Phase. 发起前先回答三个问题，并把答案写进本 Phase 的 task facts：
   - **审什么**：列出本次审查范围 = `phase_id` + 本 Phase Card 的 allowed files/symbols + covered AC 列表，
     作为 `review --action=record` 的 `subject` 原样提交。`subject` 不许留空；留空等于声明"范围未限定"。
     同时必须显式写全 `review_scope="phase"`、`subject_kind="phase"`、`phase_id="P<n>"` 三者——
     三者缺一时不要靠默认值，先补齐再提交。
   - **审过了吗**：读当前 task 的 `quality/reviews/attempts/` 与 `quality/reviews/results/`，
     列出同一 `phase_id` 下**已存在的成功回执**及其 `subject`。
   - **要不要再派**：只有当本次范围**超出**已有回执范围（新增文件/新增 AC），或已有回执是 `unavailable`，
     才发起一次新审查；必须写明"超出的是哪一条"。**修 finding 造成的材料字节变化不是重派理由。**
   若本 Phase 仍然出现了第二次派发，必须在 Phase handoff 里写清两次 `subject` 的差异和第二次的必要性。
   本条是执行纪律，不是新的 stage、gate 或质量结论。
```

- **发现时机**：执行者在第 8 步（`workflows/build-code/steps.json:12`）**动手派发之前**就被迫列出 `subject` 与旧回执清单——此时能同时发现 a（"这是第二次审同一范围"）与 b（"范围压根没写死"）。
- **为什么这不算新门禁**：它不阻止派发、不判定通过与否，只要求执行者在派发前写下三行答案；答不出来时由执行者自己决定，事实照记。

---

### P2｜对应 c｜计划缺口集中一次退回

**加到**：`workflows/build-code/SKILL.md` → `## 统一回退协议` 段落末尾（作为该节新增子段）
**锚点逐字首句**：`五个正式 stage 共用 \`runtime/stage/stage-content-contracts.mjs\` 的`

```markdown
### 计划缺口的集中退回

发现在做的工作本身是计划缺口（Phase 的 allowed files/symbols 不对、覆盖的 AC 无法验证、
Phase 之间的边界重叠、依赖顺序不成立、计划里的测试路由跑不起来），执行者必须**停下来成组退回**，
而不是现场边做边改计划：

1. **先列全，再退回**：把本 Phase 已发现的缺口一次性列全，每条写四样——缺口一句话、影响的 Phase/AC、
   不修会怎样、需要 owner 回答什么。不要在只发现第一条时就退回，也不要发现第三条时再退一次。
2. **只退回一次**：post 回 `build-plan` 的 `spec-clarify`，pre 回 `build-spec`/`build-plan`；方向性缺口回
   `make-decision`。一次把全部缺口交出去，并在退回时说明"在等答复之前我不打算动哪些部分"。
3. **退回期间停手范围**：只做不受该缺口影响的安全修复；受影响的部分在 task facts 里标
   `blocked_by_plan_gap` 并写明是哪一条缺口，**不再猜着实现、不再自行改材料**。
4. **第二次缺口并入第一份清单**：本 Phase 后续再发现缺口时，追加进同一份清单再退回一次，
   不得就地自行决定。
5. 确实需要"先按自己的理解做一点"时，先在 handoff 里写明理由和代价，再动。

本条是执行纪律，不是新的 stage、gate 或质量结论；它不新增状态、不阻断同 task 的安全修复。
```

- **发现时机**：执行者在第 3 步 `implement-change`（`workflows/build-code/steps.json:7`）第一次意识到"计划不成立"时**就要停下来列清单**，因此会在"边做边改"发生之前发现 c。它同时给 `AGENTS.md:27-30` 的"卡住与升级"补上了"计划有缺口"这一触发词——原条款只覆盖"卡住/无进展"。

---

### P3｜对应 d｜证据只留原始件、禁止目录快照

**加到（人读规范）**：`docs/standard-workflow.md` → `### review、测试和成本` 之后新增子段
**锚点逐字首句**：`### review、测试和成本`

```markdown
### 证据只留原始件

每个阶段只保存**能证明事实的最小原始件**，同一个事实不存第二份：

- **原始测试输出**：每个实际跑过的 focused 命令存一份原始输出即可。同一命令重跑时，
  只有在结果发生变化（或用户/CI 明确要求）时才新增一份，并在文件名或同目录说明里写清"重跑原因"。
- **正式回执**：`quality/reviews/attempts/` 与 `quality/reviews/results/` 各一次派发一份，
  不复制、不镜像到 `quality/evidence/`，不做可读副本。
- **review 原件**：保留 provider 返回的原始字节与 ref/hash（`workflows/build-code/SKILL.md` 的
  AC-REVIEW-011 段已要求），不额外再存一份它的整理版。
- **禁止整棵树/整目录快照**：不得把工作区目录、整个 `quality/`、`git archive` 产物、整树 tar 或
  文件树清单作为证据写入 `quality/evidence/`。需要证明"改动前是那样"时，
  只存本 Phase 实际涉及的那几个文件的原始字节 + 路径 + hash。
- **说明性文字不入证据目录**：缺口清单、成本行、范围声明这类"人写的话"写进当前 task facts 或
  phase handoff，不写成新的证据文件。

本条是执行纪律，不是新的 gate；它不改变 `capture-evidence` 的行为，只约束执行者交给它的内容。
```

**同时（仓库级硬规则）加到**：`AGENTS.md` → 紧接 `### 测试硬规则（本任务后续执行）` 之后
**锚点逐字首句**：`### 测试硬规则（本任务后续执行）`

```markdown
### 证据硬规则（本任务后续执行）

- 每类事实只留一份原始件：原始测试输出、正式 review 回执、review 原件各存一份，禁止复制镜像到 `quality/evidence/`。
- 禁止把整棵工作树或整个目录作为证据保存（禁止目录快照、整树 tar、`git archive` 产物、文件树清单）。
- 需要证明改动范围时，只存本 Phase 实际改动文件的原始字节 + 路径 + hash。
- 依据：[docs/standard-workflow.md](docs/standard-workflow.md) 的 `### 证据只留原始件` 段；本条是执行纪律，不是新的 stage、gate 或质量结论。
```

- **发现时机**：执行者在第 10 步 `capture-implementation`（`workflows/build-code/steps.json:14`）与 AC-REVIEW-011 记录时按白名单落盘，**第一份目录快照就写不出来**；第 13 步 spec-analyze 与第 15 步复盘也会因为"证据目录里出现了目录快照"而更早看到 d。这是唯一能直接否掉 5,576 文件 / 143 MB × 3 的条款。
- **为什么落在 AGENTS.md 而不是新增文件**：`AGENTS.md:19` 的"测试硬规则"已经用同一形态承载了"禁止全量回归"这条纪律，证据纪律放在它旁边最容易被读到。

---

### P4｜对应 e｜规则锚写进 Phase Card

**加到**：`workflows/build-code/SKILL.md` → `## Work loop` 第 1 条，Phase Card 字段之后
**锚点逐字首句**：`1. Read current cohort materials and the physical Phase authority, then select`

```markdown
   Phase Card 里再写两行**版本锚**（给人看的绑定，不是 machine gate）：
   - `规则锚`：本 Phase 依赖的业务规则，逐条写「文件 + 章节标题逐字」或「FR/AC 编号 + 该段首句逐字」。
     不要写整份文件的哈希——材料里与本 Phase 无关的段落变化，不构成本 Phase 事实作废的理由。
   - `材料变更影响`：本次实施预计会改动材料（`phases/P<n>.md`、`spec.md`）的哪些段落；
     不会改动的段落**不在本 Phase 的审查与实现范围内**。
   当材料发生变化时，先对照这两行判断"变的是不是我盯的那一段"：不是，就照常继续并只在 handoff 记一句；
   是，才把本 Phase 的实施/测试/审查事实读为 stale。
```

- **发现时机**：执行者在第 1 步写 Phase Card 时就必须指出稳定规则段落；此后材料任何变动，第 8 步派审查前对照这两行即可判断（e）。它把 `AGENTS.md:65` 的"材料版本"粒度**细化到段落**，同时不推翻该条的 stale 语义。
- **注意**：这条刻意不引入新的 stale 判定机器——"读为 stale"仍是人读结论，照记事实，不阻断推进。

---

### P5｜对应 f｜一次只推进一个 Phase

**加到**：`docs/standard-workflow.md` → `### 每个 phase 的标准循环`
**锚点逐字首句**：`### 每个 phase 的标准循环`

```markdown
一次只推进**一个** Phase：当前 Phase 未收尾（review 已记录、每条 finding 已处置、handoff 已写）之前，
不开工下一个 Phase 的实现，也不并发修订多个 `phases/P<n>.md`。

计划里标了 `[P]` 的任务允许在**同一个 Phase 内**并行；`[P]` 不授权跨 Phase 并行推进。
确实需要提前动下一个 Phase 的材料或代码时，先在 handoff 里写明"为什么必须现在动"和"代价是什么"，再动。
```

**同时在 `workflows/build-code/SKILL.md` 第 7 条 handoff 末尾补一句**（锚点逐字首句：`7. End the Phase with a plain-language handoff: delivered behavior, actual test`）：

```markdown
   收尾时回答一句：当前推进中的 Phase 只有一个吗？如果有第二个已经开始，写清它是什么、为什么提前开始。
```

- **发现时机**：执行者在第 1 步选 Phase 前必须回答"上一个 Phase 收尾了吗"，在第 7 步 handoff 时必须回答"现在到底有几个 Phase 在动"（f）。它同时给 `skills/plan-eng-review/SKILL.md:33-34` 的 `[P]` 条款划了界（见第 4 节"不做的事"6）。

---

### P6｜对应 g｜Phase 成本行

**加到**：`workflows/build-code/SKILL.md` → `## Work loop` 第 7 条 handoff 清单末尾
**锚点逐字首句**：`7. End the Phase with a plain-language handoff: delivered behavior, actual test`

```markdown
   handoff 里再加一行**本 Phase 成本**，用大白话写数字；写不出就写 `unavailable` 和原因：
   「改了几次实现、跑了几次 focused 测试（分别是什么）、发起过几次正式审查（含 unavailable 的尝试）、
   等 provider 一共多久、改过几次材料、从开始到 handoff 一共多久」。
   这一行只用于诊断，不设预算上限，也不作为推进条件；它不阻断任何后续动作。
```

**同时把粒度补进规范**：`docs/standard-workflow.md` → `### review、测试和成本` 的 `:90-92`
**锚点逐字首句**：`时间和 token 只作诊断，按 **step**、skill、读取、交互、provider wait、测试、review、返工和用户等待拆分`

```markdown
时间和 token 只作诊断，按 step、skill、读取、交互、provider wait、测试、review、返工和用户等待拆分；
`build-code` 还要额外**按 Phase** 记一行同类数据（含实现改动次数、focused 测试次数、正式审查派发次数、
等待总时长、材料修订次数、Phase 总时长），写进该 Phase 的 handoff。不可得就写 `unavailable`，
不设统一预算 gate；"不设预算上限"不等于"不必报数"。
```

- **发现时机**：执行者在第 7 步写 handoff 时必须报数（g）。34 小时 / 12.6 亿 token / 10 次审查尝试这种量级会在 **Phase 边界**以数字出现；如果某个 Phase 的"审查派发次数"填的是 2，P1 也会立刻被触发复核。
- **为什么不是新指标系统**：只是 handoff 里的一句话 + 规范里一句粒度说明，不新增文件、不新增 schema、不新增采集器。

---

### P7｜对应 h｜定向复测要"先列集合、再跑、再回填"

**加到（manifest 的 observable_result）**：`workflows/build-code/steps.json` → step 9 `analyze-review-findings` 的 `observable_result`
**锚点逐字首句**：`"observable_result": "Every review finding has a disposition in current task facts;`

```json
"observable_result": "Every review finding has a disposition in current task facts; before rerunning any check the Phase lists the affected test set (file/case names), reruns only that set, and records each result next to the finding it answers; no full-suite or unscoped regression command is used as a substitute; valid findings are repaired before handoff."
```

**同时加到（人读纪律）**：`workflows/build-code/SKILL.md` → `## Work loop` 第 6 条
**锚点逐字首句**：`6. Inspect every finding and record \`fixed\`, \`rejected_invalid\`,`

```markdown
   修复前先写下**受影响的测试集合**（文件/用例名），只跑这一集合；把每条的 exit code 与结果直接写在
   对应 finding 的处置里（哪个 finding → 跑了哪条命令 → 结果如何）。没有受影响的测试时写
   `not_applicable` 和原因，**不要用全量回归代替定向复测**；确实需要一条例外命令时，
   写清是谁要求的、范围是什么（照 `AGENTS.md` 的测试硬规则）。
```

- **发现时机**：执行者在第 9 步处置 finding 时（h）。它把已有的 "rerun affected checks" 从"口号"变成"必须先交集合、必须逐条回填"，让"顺手重跑一大片"变成可见的一次额外动作。

---

### P8｜对应 a（规范侧一次说清）｜Phase 一次审查合同

**加到**：`docs/standard-workflow.md` → `### review、测试和成本`
**锚点逐字首句**：`### review、测试和成本`

```markdown
`build-code` 的每个 Phase 只有**一次**正式 OCR 审查：同一 Phase 同一范围已有成功回执时，不重派。
"同一范围"由 `phase_id` + 该 Phase 的 allowed files/symbols + 覆盖的 AC 列表共同定义，
由执行者在发起前写清（见 `workflows/build-code/SKILL.md` 的 work loop 第 5 条）。

**修 finding 造成的材料字节变化不是重派理由**——它不是"真实主题变化"。要重派必须先回答：
"已有回执没有覆盖的到底是哪一条（文件/AC）？"答不出来就不重派，只把旧回执连同本次处置一起记入 facts。
`AC-REVIEW-011` 的替代调用是同一 Phase 内的第二次独立审查，只在工具 `unavailable` 且零成功审查路时发生一次，
它**不产生第二份正式回执**（`skills/architect-code-review/SKILL.md` 已有等价措辞）。
```

- **发现时机**：第 8 步派发前的自查（a）。它与 `workflows/build-code/SKILL.md:88`"没有真实主题变化，不重复…review"接上，把"主题变化"这个模糊词落实成可回答的问题。
- **为什么放规范而不放机器**：`runtime/review/review-record-route.mjs:672` 的 `material_id` 全等是**已发布回执的复用语义**（`D-007` 要求"材料变了绝不回读旧审查"），改它等于改机器契约，见第 4 节 1。

---

**八条提案的覆盖检查**：a→P1+P8；b→P1；c→P2；d→P3；e→P4；f→P5；g→P6；h→P7。改动集中在三个已有文件（`workflows/build-code/SKILL.md`、`workflows/build-code/steps.json`、`docs/standard-workflow.md`）与 `AGENTS.md`，**零新增文件、零新增 step、零新增 schema 字段、零新增门禁**。


## 4. 明确不做的事与理由

以下都是"看起来相关"但**不建议改**的项。判断标准：是否属于机器契约改动、是否新增控制面、是否会造成阶段越权、是否只治症状。

**1) 不把 `runtime/review/review-record-route.mjs:351-353` 里 build-code 的默认 tuple 从 `integration` 改成 `phase`。**
`defaultSharedReviewTuple` 是**已发布回执的语义分类**——`:512-528` 的 `semanticOriginFromRecord` 用它区分 `integration:worktree` 与 `phase:phase`，旧 attempt 的重读、重放、pause 卡绑定（`runtime/review/stage-review-disposition.mjs:170-172` 的 `snapshot_tree`）都依赖它。改默认值会让历史回执换类。
真正的病灶是"未显式声明三者时静默落到 integration"，这在**人读侧**用 P1 的"三者必须成组显式声明"就能兜住；机器默认值保持不动。
同理不改 `runtime/review/review-policy.mjs:90`（`const scope = reviewScope ?? "phase";`）与 record 层默认值不一致的现状——不引入第二套默认值仲裁。

**2) 不给审查派发次数、证据字节数、证据文件数加任何上限或门禁。**
`runtime/review/review-input-bounds.mjs:5-6` 逐字写明 "Provider capability, rather than a local byte ceiling, decides whether delivery is possible."，`:21` 写明 "no longer rewrites or rejects material by local size"。这条设计是**刻意的**。
更重要的是宪法与 `AGENTS.md:52`/`:67` 明确"review、test、evidence、history 都是事实，不是继续工作的许可证"——加一个"证据超过 N MB 就失败"的判定，等于新增一个会阻断推进的质量门，属于明确禁止的新控制面。
体积与次数用**书面纪律**处理（P3 白名单 + P6 成本行），让它们以数字暴露给人，而不是让机器替人裁决。

**3) 不在 `workflows/build-code/steps.json` 新增 step（如 `plan-gap-return`、`phase-cost`、`phase-review-dedup`）。**
`workflows/build-code/steps.json` 是五阶段共用的 manifest 拓扑：`workflows/build-code/SKILL.md:26` 的"阶段末逐项披露协议"以它为基准，`docs/standard-workflow.md:304-307` 的产物与快照漂移校验也按它对齐。新增 step 会同时改变披露基准和 outcome 校验，**这实质上就是新增 stage/gate**。
P2/P6/P7 都落在**现有 step 的条款文字**里（第 9 步的 observable_result、第 5/6/7 条的正文），足够了。

**4) 不改 `runtime/review/canonical-review-result.mjs` 的 finding 聚类与 quorum 仲裁（`:63-77`、`:191-217`、`:228`）。**
它解决的是"多个 provider / 多次派发的同一 finding 怎么合并成一个可处置的 cluster"，**不是"要不要发起第二次审查"**。
`findingKey = path + line + normalizedIssue`（`:63-64`）会把同一 Phase 两次审查的同一条 finding 折叠掉——这恰恰说明"重复审查在结果层是隐形"的，改聚类只会让症状更难看见。真正的修法在发起侧（P1/P8）。
另外 `minimumReviewers` + `:356` 的 quorum 判定承担独立性证明（`CLAUDE.md`"质量裁决由独立来源独立上下文产出，禁止自审自判"），动它是越界。

**5) 不删除 `workflows/build-code/SKILL.md:172` 的 `### AC-REVIEW-011：OCR 工具不可用时的独立替代`。**
它在 OCR 工具 `unavailable` 时提供**唯一可行的独立性**（`:177-178` 逐字"仅当工具 `unavailable` 且零成功审查路时"），删掉会让 `unavailable` 无法收敛，并直接违反 `AGENTS.md:17`"质量裁决由独立来源独立上下文产出，禁止自审自判"。
它已经写明了不生成 canonical review result（`:190-192`）与不复用为正式回执（`:194-199`）。只需在规范侧补一句"它不产生第二份正式回执"（P8 末句），不需要改它的结构。

**6) 不改 `skills/plan-eng-review/SKILL.md:33-34` 的 `[P]` 条款去禁并行。**
该条款的职责是判断"每个 `[P]` 声称是否有独立输入和不重叠文件"，**它是计划质量检查，不是执行节奏检查**。把 build-code 的"一次一个 Phase"纪律塞进去会造成两件事：阶段越权（plan lens 管执行节奏）、以及把"task 级并行"与"Phase 级并行"混成一件（它们本来不同：`[P]` 是同一 Phase 内的 task 并行）。
该纪律应写在执行侧（P5：`docs/standard-workflow.md` 的 `### 每个 phase 的标准循环` + build-code 第 7 条）。

**7) 不给 `skills/review/SKILL.md` 增加新字段来承载"审查范围"。**
`:21-25` 逐字限制 finding 只能用 `severity`/`path`/`line`/`issue`/`root_cause`/`recommendation`/`evidence_kind`/`evidence`，"must not add `axis`, `visibility`, `anchor`, `consequence`, or `correction`"；`:29` 逐字 "Return exactly one JSON object: `{ \"findings\": [...] }`"；`runtime/review/canonical-review-result.mjs:145-158` 只接受 `{findings, discarded_facts}` 的窄契约。
范围信息属于**请求侧**（`subject`，已存在），不属于结果侧。往结果里塞范围会同时破坏窄契约与已发布结果的稳定性。

**8)（附带）不把"证据纪律"写成新的 js 校验模块（如在 `runtime/review/` 下加 `evidence-discipline.mjs`）。**
理由同 2 与 3：会新增控制面、需要登记 owner/consumer/删除条件（`AGENTS.md:57-59`），而这条纪律的消费者是**执行者本人**，机器读不了"这段文字为什么值得留"。用 `AGENTS.md` + `docs/standard-workflow.md` 的纪律段即可，与 `AGENTS.md:19-23` 的测试硬规则同形态。


## 5. 不确定项

每条写「缺什么信息 / 去哪里核实」。本次只读调研受"最多 12 个文件、每文件最多 400 行、禁止扫描 `tests/` 与 `specs/`"约束，以下都**没有核实**，第 1–3 节的因果链在这一条上可能不完整。

**1) 34 小时 / 12.6 亿 token / 10 次 Phase 审查尝试的真实分解。**
缺：逐 Phase、逐 attempt 的耗时、provider 调用数、等待时长、材料修订次数。
核实：该 task 的 `metrics/`（工作目录下存在该目录，未读）、task facts（`facts.jsonl` 的 stage row）、`quality/reviews/attempts/*/attempt.json`。
第 1.2 节 (g) 判为"部分"、P6 的必要性都建立在这份分解上；如果分解显示时间其实主要花在 provider wait 而非材料修订，P6 的字段顺序应调整。

**2) 那 10 次尝试里每次是否提交了 `subject`（即 (b) 是否真的从未被使用）。**
缺：每次请求的 `subject` 是否为 null。
核实：attempt 记录的 closure 清单里 `subject_sha256`（写入点 `runtime/review/review-record-route.mjs:751-754`，`textHash(canonicalJson(request.subject ?? null))`）。若全部等于 `reviewSubjectHash(null)` 的值，说明 `subject` 从未被使用——P1/P8 命中；(b) 的定性可从"部分"升级为"字段存在但形同未实现"。

**3) 同一 Phase 的两次正式审查是否由"材料字节变化"触发（即 P1 的因果链是否成立）。**
缺：同一 `phase_id` 下两条 attempt 的 `material_id`、`request_key`、`closure_manifest` 对照。
核实：`quality/reviews/attempts/*/attempt.json`（若两条 `material_id` 不同、`phase_id` 相同 → `runtime/review/review-record-route.mjs:672` 的复用失效链成立，P1 的"修 finding 不是重派理由"一句就是主修法）。
反例可能：两次派发也可能分别走了 `phase` 与 `integration` 两个 scope（`review-policy.mjs:6` 只有这两个值），那就该先修"三者成组声明"，而不是修 subject。

**4) 三份 5,576 文件 / 143 MB 整树快照是经由哪条命令写进证据目录的。**
缺：写入命令、调用方、目录结构（是否 tar、是否 `git archive`、是否是 `quality/evidence` 下的子目录快照）。
核实：`quality/evidence/` 的文件清单与 mtime、`index.json`（工作区存在 `quality/`，未读），以及 `capture-evidence` 的实现（**不在允许读取清单内**）。
这决定 P3 的措辞是否需要点名"哪一类调用方最容易整树快照"（例如子代理按 `AGENTS.md:14-15` 采集 RED/GREEN 证据时被要求"路径+exit_code+清单"，容易顺势把整棵树抄进去）。

**5) `runtime/review/review-record-route.mjs` 的 dispatch 主路径只核了 470/2414 行。**
缺：本次只读 `:300-529` 与 `:560-799`。`:1000-1650` 的派发主路径、`:2100-2414` 的导入/收尾路径未逐行读。已知存在一条旁路：`:1995` 逐字 "Import an already-created canonical result without creating a new attempt or"，**未核实它是否能在同一 Phase 内合法地产生第二份结果**。
核实：读该文件余下部分；或看 `quality/reviews/attempts/` 里 `dispatch_state` 的取值分布（`:1492` 出现过 `reused`，另有 `dispatched`/`imported` 等），以及 `:1504` 的 verify-code snapshot 失效判定是否有 build-code 对应实现（我判断"没有"，但未穷举）。
若存在 build-code 侧的 snapshot 级失效判定，第 1.2 节 (b) 的缺口描述需要收窄。

**6) FR-C4-001 与 D-007 的正文（去重元组是否有更宽授权）。**
缺：`runtime/review/review-record-route.mjs:648-660` 的注释引用了 `spec FR-C4-001`（dedup identity = stage, phase_id, track, review_kind, origin）与 `D-007`（材料变化绝不回读旧审查）。正文是否已经允许/禁止"同 Phase 多次正式审查"，我没读到。
核实：`specs/<task-id>/spec.md` 的 FR-C4-001 段、`specs/<task-id>/decision-log.md` 的 D-007 段（**本次任务禁止读 `specs/`**）。
这决定 P8 是"补充解释"还是"与规范冲突"——按注释措辞，D-007 只要求"材料变了不回读旧审查"，**不等于"必须重新派发"**，P1 的"更宽 subject、范围未变则不重派"应与 D-007 相容，但需要正文确认。

**7) 一次 `review --action=record` 到底对应几次 provider 调用。**
缺：`runtime/review/review-policy.mjs:101` 的 `minimumReviewersFor` 说明每类审查面带 `minimum_reviewers`；若 > 1，则"一次审查"在 provider 侧本身就是多次调用，`runtime/review/canonical-review-result.mjs:228` 的 quorum 判定会因此产生额外调用与等待。
核实：`workflows/build-code/skill-deps.yaml` 与 `config/` 下的 review 配置（**均不在允许读取清单内**）。
这直接影响 (g)：如果"一次审查"= N 次 provider 调用，"审查派发次数"这一项要写明是**按 record 请求计还是按 provider 调用计**，否则 P6 的数字无法与 10 次尝试对齐。

**8) `runtime/stage/stage-review-disposition.mjs` 在任务给定路径下不存在。**
缺：任务清单写 `runtime/stage/stage-review-disposition.mjs`；实际文件在 `runtime/review/stage-review-disposition.mjs`（glob 确认）。是否存在迁移遗留的同名文件未核。
核实：`docs/architecture/move-map.json`（本次未读，`AGENTS.md:44` 称它是目录迁移的唯一事实）。
影响：第 1.1 节第 8 项与第 1.2 节 (a)(b) 的引用已按实际路径写；若 `runtime/stage/` 下另有一份不同内容的同名文件，第 1.1 节的锚点需要重取。

**9) `quality/evidence/` 是否已经存在"同一事实存两份"的历史记录。**
缺：用于验证 P3 的紧迫性（除三份整树快照外，测试输出/review 回执是否也已重复）。
核实：`quality/evidence/` 的目录清单与 `index.json`、`quality/reviews/`（工作区存在这些目录，未读）。
若重复件只有那三份整树快照，P3 的措辞可以从"白名单"降级为"只禁目录快照"，把改动面再缩小一档。

**10) `build-code` 的 `subject` 一旦填了，会不会与 `runtime/review/review-record-route.mjs:672` 的 `material_id` 全等门控互相抵消。**
缺：`:633` 的 `findReusableReview` 是"`material_id` 全等 **且** subject 匹配"的多重条件，还是"subject 匹配即可放宽 material 判定"。我只读到 `:672` 的 `continue`（material 不等就跳过）与 `:623-630` 的 subject 比较，**没有读到两者在同一循环里的组合顺序**（`:660-700` 区间中间部分未逐行核）。
核实：重读 `runtime/review/review-record-route.mjs:660-700`。
这一条最关键：**如果 `material_id` 全等是硬前置，那么"限定 subject 使小改动不作废旧回执"这个目标在人读侧根本达不到**，P1 必须改写成"范围未变时不重新派发（不依赖复用，而是不发起）"，而 P8 的措辞也要相应改为"不发起第二次"而不是"复用第一次"。我在 P1/P8 里已经采用"不重派"的写法，就是为了不依赖这一条；但它值得在落地前核实一次。


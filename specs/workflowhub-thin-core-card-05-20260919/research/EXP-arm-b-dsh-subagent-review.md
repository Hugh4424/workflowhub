# OCR delegation-mode review — CARD-02 审查链与验收脚本改动（commit 2998fd1 / 世界快照 dd80ceb1）

审核方式：只读 packet + 只读世界快照 `/tmp/ocr-e2e-context/`（已验证 packet 的 5 个 `code/**/*.mjs` 与快照逐字节相同，sha256 例如 `runtime/review/review-input-bounds.mjs` = `c15ee499599ded1b94866666abeca018babbd661ac4b12672815c5eade088462`）。未读取任何 live checkout。未执行任何测试套件（快照无 `node_modules`），所有"会失败/会通过"的结论均为代码路径推导，已在 (C)(D) 逐条标注。

## A. 覆盖情况（逐文件）

| 文件 | 覆盖 | 说明 |
| --- | --- | --- |
| `tests/acceptance/card-02-current.mjs` | **完整**（183/183 行） | 逐行读；并交叉核对 22 条 AC 与 `specs/.../spec.md` 的 AC 集合（22/22 一致）、`commands[]` 中 18 个被引用测试文件全部存在、17 条 vitest 观测的 `(file, test)` 全部存在且都恰好嵌在 1 个 `describe` 内。 |
| `runtime/review/review-input-bounds.mjs` | **完整**（25/25 行） | 与 `skills/wh-review/scripts/review-input-bounds.mjs` 及 packet 内两份副本 sha256 完全一致（同一份实现被复制 4 处）。 |
| `code/skills/wh-review/scripts/review-input-bounds.mjs` | **完整**（25/25 行） | 同上，逐字节相同；核对了消费方（`review-packet-identity.mjs:103`、`simple-review-runner.mjs:672/701/1316`）只使用 `.materials`，未使用被改成 `null` 的 `diff`。 |
| `runtime/task/task-store.mjs` | **完整**（420/420 行） | 逐行读；另读了新依赖 `runtime/stage/completion-predicates.mjs` 的 `STAGE_ROW_FINDING_DISPOSITION_FIELDS`（L107）、`summarizeStageRowFindingDispositions`（L123-179）与唯一消费者 `runtime/stage/stage-handoff.mjs:9/640`，并做了相对导入环检测（从 task-store 出发 0 环）。 |
| `runtime/review/review-record-route.mjs` | **部分深查**（全文 2159 行通读） | 全文读完；逐行深查集中在改动面（L26-125、L623-686、L836-872、L1257-1605）及其调用方/测试；其余区域（历史记录导入器 L1778-1993、task-bound E2E 写入器 L2048-2130、focus review L2132-2159）只做通读级检查。**无法声称已对全部 2159 行做同等深度的逻辑穷举。** |
| `requirement/card-02-spec-head.md` | **完整**（80/80 行） | 并验证其为快照 `specs/workflowhub-thin-core-card-02-20260919/spec.md` 前 80 行的**逐字节复制**（`diff` 为空，两者均 6978 字节）；另读了 spec.md / tasks.md 的被引用段落（§11 AC、T011、D-015）。 |
| `diff/card-02-selected.diff` | **未评审（OCR 已排除）** | 被 OCR 以 `unsupported_ext` 排除。我把它当作"变更面线索"使用（用于定位改动区域），**不**对其本身出 finding。 |
| `design/` | **无内容** | packet 中该目录为空，无设计/契约材料可审。 |
| `rule.json` | **非评审对象** | 仅用于确认两条规则的解析结果与规则文本。 |

## B. Findings（JSON 数组，按严重度排序）

```json
[
  {
    "severity": "high",
    "category": "bug",
    "path": "runtime/review/review-record-route.mjs",
    "start_line": 1360,
    "end_line": 1363,
    "content": "派发前失败现在无条件落一条不可变 attempt（REVIEW_SOURCE_DRIFT 分支改为 return recordUnavailableRequest(...)，其内部再调 recordSimpleReviewResult 并把 refs 一起返回），这与仓库现存断言正面冲突：tests/contract/review-material-change-redispatch.test.mjs:274 断言 expect(drifted.attempt_ref).toBeUndefined()，:309 断言 expect(drifted).not.toHaveProperty(\"attempt_ref\")，两处针对的正是本分支（resolver 在解析可信路由时写 spec.md 造成身份漂移）。改动后 drifted.attempt_ref 必然是 stableReviewId 生成的字符串（或该分支直接抛异常），这两条断言不可能成立，而该测试文件不在本次改动集合内。为什么重要：这等于静默反转既有审查记录契约——(a) 仓库 suite 变红却无人可见；(b) recordUnavailableRequest 覆盖 route/retry/history/source-drift 全部失败路径，attemptId = stableReviewId([...requestKey, result, ...]) 含错误消息，于是同一逻辑失败只要错误文本不同就产生新的不可变 attempt.json + report（原先这些路径完全不落盘），失败风暴下任务库无界增长；(c) 复用语义随之变化，blocked_before_dispatch 的历史事实会被后续同材料请求当作 reused 结果读回。建议：二选一并同批改测试与说明——(1) 若确实要「每个已知身份的失败都落 attempt」，必须同步更新 review-material-change-redispatch.test.mjs:274/309 并写明契约变更理由；(2) 若要保持原契约，则 source-drift / history-unavailable / retry-* 这类 blocked_before_dispatch 路径继续返回不带 refs 的 unavailable，只对已派发或 sent_unparsed 情形落 attempt。",
    "evidence": "代码（packet runtime/review/review-record-route.mjs:1356-1363）：`if (!sameAuthenticatedReviewIdentity(lockedIdentity, preDispatchIdentity)) {` / `lockedIdentity = preDispatchIdentity;` / `requestKey = requestLockHash(request, materialId, routeIdentity ?? \"unavailable\");` / `closure = reviewClosure(request, lockedIdentity, materialId, requestKey, routeIdentity ?? null);` / `return recordUnavailableRequest({` … `error: { code: \"REVIEW_SOURCE_DRIFT\", message: \"review source changed while resolving the trusted review route\" },`；recordUnavailableRequest 返回体 L861-871 含 `...refs`（refs = {attempt_ref, result_ref, report_ref}，构造见 L1771 `const refs = { attempt_ref: attemptRef, result_ref: covered ? resultRef : null, report_ref: reportRef };`）。现存断言（快照 tests/contract/review-material-change-redispatch.test.mjs）：L253 `const drifted = await recordSimpleReviewRequest({` … L256-259 `resolveRouteIdentity: async () => { state.artifacts.writeAtomic(\"spec.md\", \"# Spec drifted during route resolution\\n\"); return route(); }` … L270-273 `expect(drifted).toMatchObject({ status: \"unavailable\", reused: false, dispatch_state: \"blocked_before_dispatch\", error: { code: \"REVIEW_SOURCE_DRIFT\" } });` … L274 `expect(drifted.attempt_ref).toBeUndefined();`；第二处 L307-309 `error: { code: \"REVIEW_SOURCE_DRIFT\" }` + `expect(drifted).not.toHaveProperty(\"attempt_ref\");`。"
  },
  {
    "severity": "medium",
    "category": "bug",
    "path": "runtime/review/review-record-route.mjs",
    "start_line": 1310,
    "end_line": 1314,
    "content": "身份二次认证失败的分支永远无法返回它承诺的 unavailable 结果。该分支本身就是 assertAuthenticatedReviewIdentity(taskHandle, kernel) 抛错后进入的 catch，却调用 recordUnavailableRequest → recordSimpleReviewResult，而 recordSimpleReviewResult 第 2000 行又调用同一个 assertAuthenticatedReviewIdentity(handle, kernel)；catch 与该调用之间没有任何 await，入参完全相同，因此必然再次抛出同一个异常，recordSimpleReviewRequest 直接 reject，而不是返回 {status:\"unavailable\"}。函数头注释（L836-842）明确写「只有完全无法认证任何 task identity 时才可能不落 attempt」，实现却连结构化的 unavailable 返回值都拿不到。为什么重要：调用方（tools/cli/stage-runtime.mjs:1190 起的 review 路径）依赖结构化返回值区分命令失败与审查不可用；这里变成未捕获异常会把一次可修复的源不可用升级为 CLI 崩溃。建议：该分支不要复用 recordSimpleReviewResult（或在其中显式支持「身份不可用」入参），退化为原先不带 refs 的 unavailable 返回值并保留 error code。",
    "evidence": "packet runtime/review/review-record-route.mjs:1306-1315：`let lockedIdentity;` / `try { lockedIdentity = assertAuthenticatedReviewIdentity(taskHandle, kernel); }` / `catch (error) {` / `const requestKey = requestLockHash(request, materialId, \"unavailable\");` / `return recordUnavailableRequest({` / `task: taskHandle, kernel, request, identity: before, materialId, requestKey,` / `closureManifest: reviewClosure(request, before, materialId, requestKey, null), executionContext,` / `error: { code: error?.code ?? \"REVIEW_SOURCE_UNAVAILABLE\", ... },` / `});` / `}`；同文件:1995-2000 `export function recordSimpleReviewResult({ task, result, kernel, requestKey = null, executionContext = null, closureManifest = null, identityOverride = null }) {` … `const currentIdentity = assertAuthenticatedReviewIdentity(handle, kernel);`；同文件:839-841 注释 `* retry, history, and source-drift failures before provider dispatch; only an` / `* inability to authenticate any task identity at all may return without an` / `* attempt.`。"
  },
  {
    "severity": "medium",
    "category": "test",
    "path": "tests/acceptance/card-02-current.mjs",
    "start_line": 126,
    "end_line": 155,
    "content": "该 producer 的公开派生面（deriveCard02Entries 及其 ACCEPTANCE_CRITERIA/TEST_ASSERTIONS/NON_ACHIEVED_READBACKS 表）唯一消费者是快照里的 tests/acceptance/card-02-current.test.mjs，但该 vitest 套件不落在任何 test:* 分组的 glob/token 范围内，也未登记进 tests/contract/test-entry-grouping.test.mjs 的 nodeRunnerFiles/exemptFiles。后果有二：(1) 没有任何分组会执行 producer 唯一的单元测试（test:acceptance 是 node tests/acceptance/build-prd-current.mjs，test:root 的 tests/*.test.mjs 不匹配子目录）；(2) 该文件会被 test-entry-grouping 的收尾断言记为「无人执行的多余文件」，使它变红。为什么重要：一个没有分组执行的验收 producer 单测等于不存在，deriveCard02Entries 的假绿防线（例如 AC-DOC-001 缺失时必须落 incomplete）实际上从未在任何 gate 中运行。建议：把 tests/acceptance/card-02-current.test.mjs 纳入某个 vitest 分组（例如 test:contract 的显式文件列表），或在 test-entry-grouping 中显式登记并写明豁免理由。",
    "evidence": "我把 tests/contract/test-entry-grouping.test.mjs 的分组判定逻辑（vitestScopeTokens + globToRegExp + vitest.config.mjs exclude）在快照文件树上原样重放，得到：`UNCOLLECTED: [\"tests/acceptance/card-02-current.test.mjs\", \"tests/acceptance/workflow-execution-current-task.test.mjs\", \"tests/contract/frontend-component-quality-static.test.mjs\", \"tests/contract/ui-frontend-governance.test.mjs\", \"tests/contract/ui-skill-contract.test.mjs\", \"tests/contract/ui-stage-integration.test.mjs\"]`，期望集合（nodeRunnerFiles + exemptFiles）只有后 5 个 → `MATCH: false`。对应断言：tests/contract/test-entry-grouping.test.mjs L133-135 `// Nothing else may fall outside every group: the files no group executes are` / `// exactly the declared waivers plus the Node-runner precedent above.` / `expect(uncollectedFiles.sort()).toEqual([...nodeRunnerFiles, ...exemptFiles.keys()].sort());`。该测试文件确实存在（tests/acceptance/card-02-current.test.mjs，2439 字节）且 import 了本 packet 文件的导出：L3-8 `import { ACCEPTANCE_CRITERIA, NON_ACHIEVED_READBACKS, TEST_ASSERTIONS, deriveCard02Entries } from \"./card-02-current.mjs\";`。"
  },
  {
    "severity": "medium",
    "category": "test",
    "path": "tests/acceptance/card-02-current.mjs",
    "start_line": 110,
    "end_line": 118,
    "content": "对 vitest 断言的存在性判定完全依赖 verbose reporter 的文本正则，而唯一会执行这段代码的验证是同源伪造：tests/acceptance/card-02-current.test.mjs 手写 ` ✓ ${file} > named suite > ${test}` 与 `✔ ${test} (1ms)` 字符串喂给结果对象，期望值与实现格式出自同一处。于是正则写错、或 vitest 升级/管道下改变 reporter 文本（例如颜色转义把 ✓ 与文件名隔开、换行方式变化）时，单测仍全绿，而真实运行会把 17 条 vitest 观测的 AC 全部落为 incomplete——producer 只能以 exit 1 说「全都没过」，无法区分「格式没匹配上」与「测试真的失败」，这会直接制造误判（把格式问题当成产品失败，或反过来在有人放宽正则后变成假绿）。对照 card-01 的做法：tests/acceptance/card-01-current.mjs 用 --reporter=json + assertionResults[].status 做机器可读判定。建议：改用 --reporter=json 解析 assertionResults，若必须保留文本匹配，则至少补一条用真实子进程输出做的样本回放，并在 producer 里显式报告「匹配到的 ✓ 行数 / 期望行数」以便区分两类失败。",
    "evidence": "packet tests/acceptance/card-02-current.mjs:110-118：`function observedVitestAssertion(result, { file, test }) {` / `const escape = (value) => value.replace(/[.*+?^${}()|[\\]\\\\]/g, \"\\\\$&\");` / `const line = new RegExp(`(?:^|\\\\n)\\\\s*✓\\\\s+${escape(file)} > .+ > ${escape(test)}(?:\\\\s|$)`);` / `return line.test(String(result?.stdout ?? \"\")) ? \"passed\" : \"missing\";`；同源伪造（快照 tests/acceptance/card-02-current.test.mjs:14-22）：`if (observation.file) {` / `if (observation.test !== omit) reports[observation.commandIndex].push(` ✓ ${observation.file} > named suite > ${observation.test}`);` … `stdout: index === 3 ? `✔ ${TEST_ASSERTIONS[\"AC-COVER-002\"].test} (1ms)\\n` : files.join(\"\\n\"),`；对照 card-01（tests/acceptance/card-01-current.mjs:70 与 88-91）：`\"--poolOptions.forks.singleFork\", \"--no-fileParallelism\", \"--reporter=json\",` 与 `const observedAssertion = ({ file, test }) => { const result = observedResults.find((entry) => String(entry?.name ?? \"\").replace(/\\\\/g, \"/\").endsWith(file)); return result?.assertionResults?.find((assertion) => assertion?.title === test) ?? null; };`。"
  },
  {
    "severity": "medium",
    "category": "test",
    "path": "tests/acceptance/card-02-current.mjs",
    "start_line": 139,
    "end_line": 152,
    "content": "deferred/unavailable 四条的 current-boundary readback 并不独立证明边界存在：materialPresent 只是 readback.materialMarkers.every((marker) => taskMaterials.includes(marker))，即在整份 tasks.md（约 80 KB）上做子串存在性判断。这些标记在文档中大量重复（deferred 24 次、unavailable 26 次、CARD-05 出现在 4 行、AC-REVIEW-003 出现在 5 行、AC-REVIEW-001 出现 9 次），因此任何无关句子都能满足它；同时所选「命名断言」对这些 AC 是通用能力测试而非该 AC 的 oracle——AC-REVIEW-001/002 指向 tests/contract/acceptance-execution-tier.test.mjs 的 mixed-outcome 用例，其 fixture AC 是 AC-EXE-001/002，全文不出现 AC-REVIEW-001/002。于是 entries 里记录的 expected/actual 对（present/present）看起来像实测结论，实际只是「文档里出现过这几个词」。建议：把边界读回改成对该 AC 在 tasks.md 中同一条 deferred/unavailable 记录的结构化定位（例如按 AC id 截取条目并校验 outcome/owner/reason 三要素），或改为引用已落盘的 acceptance matrix（ref+sha256）而不是全文子串。",
    "evidence": "packet tests/acceptance/card-02-current.mjs:140-142：`const observed = observedAssertion(results, readback.assertion);` / `const materialPresent = readback.materialMarkers.every((marker) => taskMaterials.includes(marker));` / `const outcome = commandsPassed && observed === \"passed\" && materialPresent ? readback.outcome : \"incomplete\";`；标记定义见 L44 `materialMarkers: [\"AC-TEST-004\", \"real Luna E2E\", \"CARD-10\"]`、L50 `materialMarkers: [\"AC-REVIEW-001\", \"semantic_review_status=incomplete\", \"REVIEW_WAIT_EXCEEDED\"]`、L62 `materialMarkers: [\"AC-REVIEW-003\", \"CARD-05\", \"deferred\"]`。计数（在快照 specs/workflowhub-thin-core-card-02-20260919/tasks.md 上 grep -o -F | wc -l）：24 deferred / 26 unavailable / 5 CARD-10 / 4 CARD-05 / 5 AC-REVIEW-003 / 9 AC-REVIEW-001。AC-REVIEW-001/002 复用的测试名见 packet L49/L55（keeps explicit deferred and unavailable AC outcomes out of coverage while an independent review receives the executed command evidence），该测试体在快照 tests/contract/acceptance-execution-tier.test.mjs:823-862，fixture 行为 p9Ids = [\"AC-EXE-001\", \"AC-EXE-002\"]（L616）。"
  },
  {
    "severity": "medium",
    "category": "documentation",
    "path": "runtime/review/review-input-bounds.mjs",
    "start_line": 7,
    "end_line": 17,
    "content": "本次改动删除了全部本地输入上限与截断（TASK_BOUND_* 常量、bounded 投影、WH_REVIEW_TRUNCATED_SECTION、MATERIAL_TOO_LARGE 抛出），但仓库登记这些控制面的唯一事实文件仍是旧描述：docs/architecture/control-plane-inventory.json 中 review-input-bounds 的 effect 仍为 \"provider-input size bounds and diff/inline compaction limits\"、consumer 仍为 \"...the wh-review bounded provider-input projection\"、delete_condition 仍以 bounds 为前提；wh-review-input-bounds-shim 仍写 \"skill-local bounded-input implementation\"。AGENTS.md 与项目规则要求控制面必须登记真实职责/消费者/owner/删除条件，而 tests/contract/control-plane-governance.test.mjs 只校验这些字段非空，因此这条已失真的登记不会被任何测试发现。为什么重要：inventory 被当作架构唯一事实，后续读者/审计会据此认为审查链仍有输入上限与截断语义，与 D-015 的「完整送达或诚实 unavailable」直接矛盾。建议：在同一改动中更新这两个条目的 effect/consumer/delete_condition（或 disposition=removed 并写明替代者），并把证据描述改为新的 portability 测试语义。",
    "evidence": "快照 docs/architecture/control-plane-inventory.json：`{\"id\": \"review-input-bounds\", \"producer\": \"runtime/review/review-input-bounds.mjs\", \"consumer\": \"runtime/review/review-packet-identity.mjs and the wh-review bounded provider-input projection\", \"owner\": \"review route\", \"effect\": \"provider-input size bounds and diff/inline compaction limits\", \"disposition\": \"retain\", ...}` 与 `{\"id\": \"wh-review-input-bounds-shim\", ..., \"effect\": \"skill-local bounded-input implementation kept in parity with the runtime owner\", ...}`；而被改后的实现（packet runtime/review/review-input-bounds.mjs，全 25 行）只返回完整 diff：L7-17 `export function compactReviewDiff(diff) { if (typeof diff !== \"string\") throw new TypeError(\"review diff must be text\"); return { diff, index: { mode: \"full\", full_diff_bytes: Buffer.byteLength(diff, \"utf8\"), full_diff_sha256: createHash(\"sha256\").update(diff).digest(\"hex\"), }, }; }`，全文件已无任何 TASK_BOUND_ / bounded / MATERIAL_TOO_LARGE；tests/contract/control-plane-governance.test.mjs:18-21 只做 `for (const key of [\"id\", \"producer\", \"consumer\", \"owner\", \"effect\", \"disposition\", \"delete_condition\", \"evidence\"]) { expect(control[key], `${control.id}.${key}`).toBeTruthy(); }`，不会发现语义失真。"
  },
  {
    "severity": "medium",
    "category": "security",
    "path": "runtime/review/review-record-route.mjs",
    "start_line": 64,
    "end_line": 69,
    "content": "新的 executionPreparationError 把原始 error.message 原样拼进持久化文本，注释只声明「不暴露 provider output」，没有处理宿主绝对路径。prepareExecutionReviewRequest 会直接读 worktree 内的四份材料与工作区（ArtifactDir.read → openSync，缺文件时 Node 的 ENOENT 文本形如 ENOENT: no such file or directory, open '/Users/<user>/.../plan.md'），该异常在 L1282-1287 被包成 REVIEW_EXECUTION_PREPARATION_FAILED 后进入 canonical attempt.json 与 report（report 的 error: 行与 public_result JSON 各写一次）。仓库其它位置对同类文本有明确脱敏约定（provider-material-projection.mjs 的 HOST_PATH_PLACEHOLDER/redactProviderHostPaths、wh-review-cli.mjs:41 的 HOST_PATH、本文件 L1780 importFailure 的内联脱敏），只有这条新路径绕开；另外 attempt_id 由包含该消息的 stableReviewId 派生，同一逻辑失败在不同机器/路径下会得到不同 attempt 身份。为什么重要：record 是不可变的，路径一旦落盘无法回收，且会把用户名/任务绝对路径泄漏进任务 store。建议：在 executionPreparationError 中对 detail 走 redactProviderHostPaths（或同款正则）后再入 record。",
    "evidence": "packet runtime/review/review-record-route.mjs:64-69：`const detail = typeof error?.message === \"string\" && error.message.trim() !== \"\"` / `? error.message.trim()` / `: \"preparation failed without a diagnostic message\";` / `const typed = new Error(`reviewed execution could not be prepared from current authenticated records (${cause}): ${detail}`);` / `typed.code = \"REVIEW_EXECUTION_PREPARATION_FAILED\";`；写入点 L1282-1287 `catch (error) { ... executionPreparationFailure = executionPreparationError(error); }`；路径来源 runtime/review/review-record-route.mjs:211 `const materials = Object.fromEntries([\"decision-log.md\", \"spec.md\", \"plan.md\", \"tasks.md\"].map((name) => [name, artifacts.read(name)]));` → core/artifact-dir.mjs:217-221 `read(relativeName, encoding = \"utf8\") { this.verifyIdentity(); const artifactPath = this.path(relativeName); const rootSnapshot = snapshotDirectory(this.root); const fd = openSync(artifactPath, constants.O_RDONLY | NOFOLLOW);`；既有脱敏约定：runtime/review/provider-material-projection.mjs:50 `export const HOST_PATH_PLACEHOLDER = \"<host-path-redacted>\";`、runtime/review/review-record-route.mjs:1780 `.replace(/(?:\\/(?:Users|home|private|tmp|var|etc|opt|mnt|Volumes|root|usr|bin|sbin|dev|proc|sys|Library)\\/[^\\s\"'`<>()[\\]{}]+|[A-Za-z]:[\\\\/][^\\s\"'`<>()[\\]{}]+)/g, \"<host-path-redacted>\")`。"
  },
  {
    "severity": "low",
    "category": "bug",
    "path": "tests/acceptance/card-02-current.mjs",
    "start_line": 157,
    "end_line": 172,
    "content": "produceCard02Current 接受 cwd 参数并把它交给子进程，但读取任务材料时用的是相对 process.cwd() 的字面路径，且没有任何 try/catch。后果：在非仓库根目录调用时，要么读到无关仓库的同名文件（材料标记来自错误文档），要么直接抛未捕获的 ENOENT 让整个 producer 以堆栈失败——而 T011 的契约要求 unknown 输入必须落为 unavailable/incomplete、不得省略或改成 achieved，即失败应落成 22 条结构化条目而不是崩溃。建议：把材料读取改为 resolve(cwd, \"specs/.../tasks.md\")，并把读取失败降级为 materialPresent=false（相关 AC 落 incomplete 且带 owner/reason），保持 JSON 输出形状不变。",
    "evidence": "packet tests/acceptance/card-02-current.mjs:159-171：`for (const [command, args, timeout] of commands) { const result = run(command, args, { cwd, encoding: \"utf8\", timeout, stdio: [\"ignore\", \"pipe\", \"pipe\"] });` … `const materials = taskMaterials ?? readFileSync(\"specs/workflowhub-thin-core-card-02-20260919/tasks.md\", \"utf8\");`（cwd 只用于子进程，材料读取落到 process.cwd()，且无 try/catch）；契约来源：快照 specs/workflowhub-thin-core-card-02-20260919/tasks.md:631 输出段——unknown 输入必须落为 unavailable/incomplete，不得省略或改成 achieved。"
  }
]
```

## C. 每条 finding 的验证方式（一行）

1. **HIGH 预派发失败落 attempt** — 读 packet L1356-1363 与 `recordUnavailableRequest` 返回体（L861-871）、`refs` 组成（L1771），再在快照里 `grep -rn REVIEW_SOURCE_DRIFT tests/` 找到两条 `attempt_ref` 必须缺失的断言（:274 `toBeUndefined()`、:309 `not.toHaveProperty`），两者对同一分支给出互斥期望 → 由代码路径推导（未执行，快照无 node_modules）。
2. **MEDIUM 身份不可用分支必抛** — 逐行对照 L1306-1315 与 `recordSimpleReviewResult` L2000 的同名调用，确认两点间无 await、入参相同 → 纯代码推导。
3. **MEDIUM 单测无人执行 / grouping 变红** — 把 tests/contract/test-entry-grouping.test.mjs 的判定逻辑（script token → glob → vitest exclude）在快照文件树上原样重放，输出显示唯一多出的未收集文件就是 `tests/acceptance/card-02-current.test.mjs`（`MATCH: false`）→ 可复现的脚本化验证。
4. **MEDIUM 同源断言格式** — 对比 packet L110-118 的正则与快照 tests/acceptance/card-02-current.test.mjs:15/21 的伪造 stdout，并对照 card-01 的 `--reporter=json` 实现 → 代码/文本逐字对照。
5. **MEDIUM 全文子串读回不独立** — 引用 L141 的 `includes` 判定、读出 L44/50/62 的标记，并用 `grep -o -F | wc -l` 在 tasks.md 上统计出现次数（deferred 24、unavailable 26 等），同时确认复用测试的 fixture AC 是 AC-EXE-001/002 → 命令 + 代码。
6. **MEDIUM inventory 失真** — 直接从 `docs/architecture/control-plane-inventory.json` 打印相关条目，与 25 行新实现全文比对，并确认 governance 测试只检查字段非空 → 文件对照。
7. **MEDIUM 宿主路径入库** — 追 `readExecutionSource` → `ArtifactDir.read` → `openSync` 的异常文本，确认 `executionPreparationError` 保留原文、写入 attempt/report，再引用仓库既有 `<host-path-redacted>` 约定 → 代码路径推导。
8. **LOW cwd 不一致** — 对比 L160 的 `{ cwd, ... }`（子进程）与 L171 的 `readFileSync("specs/...")`（process.cwd()），并引用 tasks.md:631 的 unknown→unavailable/incomplete 契约 → 代码 + 契约对照。

## D. 我无法判断的项（诚实声明）

- **无法执行任何测试**：快照 `/tmp/ocr-e2e-context/` 无 `node_modules`，且我未使用 live checkout 依赖，因此 finding 1/2/7/8 的"会失败/会抛"是**代码路径推导**，不是观测到的红灯；finding 3 是逻辑重放，不是运行 `test:contract` 的结果。
- **无法验证 vitest 真实 reporter 文本**：`--reporter=verbose` 在管道下的确切格式（是否带颜色转义、是否换行、`✓` 与路径之间是否有额外字符）我无法运行确认。我只验证了 17 个被观测测试全部存在且都恰好嵌在 1 个 describe 内，因此 `file > suite > test` 的形状是**合理**而非**已验证**。这一点直接决定 finding 4 是"潜在同源风险"还是"已发生的失败"。
- **无法核对 T011 的最终证据**：tasks.md 引用的 `quality/tests/card02-final-recheck.json`、`card02-acceptance-matrix.json` 位于仓外 task 目录，快照中不存在，故"18 achieved / 2 deferred / 2 unavailable"这一结果我无法独立复核，只能核对 producer 代码与 tasks.md 的声明一致。
- **未审计整份 2159 行路由的历史逻辑**：L1778-1993（import 校验器）、L2048-2130（task-bound E2E 写入器）、L2132-2159（focus review）只做通读级检查，其中的既有（非本次改动）缺陷不在本报告内。
- **有意未报的观察**：`dispatch.signal.aborted` 在派发前抛 `REVIEW_CANCELLED` 时，结果对象不带 `dispatch_state`，最终 attempt 会被记为 `dispatched`（L1483 / L1527-1540 / L1756 组合）。我用事件循环分析确认该窗口极窄（需要信号在进入 operation 前就已 abort **且** 材料/执行准备同时失败，才会跳过 route 解析处的 await），可复现性不足，故不作为 finding 上报。
- 未评审 `design/`（空目录）与 OCR 主动排除的 `diff/card-02-selected.diff`（仅当线索）。

## E. 委托模式产物（文件清单 + 规则）是否够用

**结论：够用来跑完这次评审，但缺三样东西，且缺的正是"能判定严重度"的那部分证据。**

够用的地方：
- `**/*.mjs` 规则的四问（需求保真 / 边界情况 / 与现有代码的交互 / 测试有效性）与这次改动的形状高度匹配；"验收断言是否独立地证明了结论、是否与实现同源"这一句直接命中了 finding 4/5。
- 文件选择本身正确且完整地覆盖了这次改动的可读面（5 个 .mjs + 需求头 + diff），22 条 AC 与 spec.md 的 AC 集合能对上，说明选中面与验收面是同一条链。
- `--rule rule.json` 的两组分组结果（`**/*.mjs` 5 个 / `**/*.md` 1 个）与实际需要一致，没有把 `rule.json` 自己送审（否则会自我循环）。

不够用的地方：
1. **`diff/card-02-selected.diff` 被 `unsupported_ext` 排除**：这恰好是唯一能直接说明"改了什么"的材料。我只能从快照反推变更面（并用 packet 与快照逐字节相同来确认快照即改动后状态）。如果规则里加一条 `**/*.diff`（或把 diff 作为 background 传给评审方），就能省掉这次反推，也能避免"改动面"与"既有代码"混淆。
2. **需求材料是截断的 spec 头部（spec.md:1-80）**：它逐字忠实（我做了 diff，无改写），但结束在 §2 的列表中间，**一条 AC 都没有**。于是 `.md` 规则里的"验收标准是否可判真假""是否列出失败路径、不可用路径与取消路径"在这份交付物上无法作答（我在 A/D 已如实说明，而不是编造 finding）。快照里有完整 688 行 spec.md，却没有随包送出。
3. **没有"改动文件 → owning task / AC / 权威 gate"的映射**：这次改动里 2159 行的路由改动与 420 行的 task-store 改动，其覆盖测试在快照中确实存在（`tests/review/review-record-route.test.mjs` 已包含新参数与 sent_unparsed/取消用例、`tests/contract/review-material-change-redispatch.test.mjs` 覆盖漂移路径），但这些文件都不在 packet 里，也不在 T011 声明的 union 命令中。评审方因此无法判断"哪条 gate 对这次改动是权威的"——finding 1 的价值恰恰来自"改动集合里没有同步的测试变更"这一点，如果 packet 给出 task→AC→gate 映射，这条 finding 的严重度可以被判定得更准确（是"漏改测试"还是"刻意改契约"）。
4. 次要：规则按扩展名一视同仁，导致同一份 25 行复制文件被审两遍，而 2159 行的运行时文件只拿到同一条扁平规则；若能标注"changed surface"或按文件给优先规则，评审深度会自然收敛到真正改动的位置。

---

**统计**：8 条 finding（critical 0 / high 1 / medium 6 / low 1），全部带 file:line 与可复现证据（引文或命令输出）。`.md` 规则未产出 finding（该文件是 spec.md 前 80 行的逐字复制，未发现改写、无 source 锚点缺失或不可判真假的验收标准——因为它根本不含 AC 段）。`runtime/task/task-store.mjs` 与两份 `review-input-bounds.mjs` 未发现实质缺陷（task-store 的 `user_decided` 扩展与 `completion-predicates.mjs` 的唯一权威一致，新增导出有真实 consumer `stage-handoff.mjs:640`，相对导入环检测为 0 环；两份 bounds 实现互为逐字节副本且消费方只用 `.materials`）。

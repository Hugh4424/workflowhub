# Findings

## Scope and authority

- Current worktree: `/Users/Hugh/Hugh/Project/workflowhub-workflowhub-stage-reflection-usability-20260901`
- Branch: `task/workflowhub/workflowhub-stage-reflection-usability-20260901`
- HEAD and `main`: `fff255c78e1ae105347d60fcbc307ffa0da03840`
- Current user goal explicitly authorizes entering build-code after build-spec/build-plan; close remains forbidden until final plain-language report.

## Existing task contract

- P1: `T101` RED then `T102` GREEN for v1 status/availability, v2 trio, validator completeness.
- P2: `T201` RED then `T202` GREEN for reflect chain and runner two-location change.
- P3/P4/P5: skill/docs, one-time history import, page/projection.
- P6: `T602` RED then `T603` GREEN for five mixed-input rows; T602 depends on T102/T402/T504.
- P7: `T701` final real-chain verification.

## Hard constraints

- Public runtime behavior classes remain seven; reflect is an action under run.
- Do not modify M16 archive materials or rewrite M16 candidate identity, thresholds, quality-tax algorithm, lock/CAS, lifecycle, or Evolution layout.
- Historical replay is reference-only and not a current strong signal.
- Availability facts do not enter counts, tiers, tax denominator, or trends.
- Malformed input is locally skipped with diagnostic.
- Tests/reviews are evidence, not progression permits; retain unavailable/incomplete honestly.

## P1 implementation findings

- The authoritative P1 seam is the validator CLI/export, with direct Ajv compilation used only to prove schema shape. T101 now has 13 tests: 8 legacy regressions plus five-state, availability, v2-valid, v2-missing-trio, and completeness-annotation cases.
- T101 RED was real: `npx vitest run tests/contract/validate-stage-reflection.test.mjs` exited 1 with 5 failures and 8 legacy tests passing. Missing behavior is limited to v1 status/availability definition, v2 schema, and validator annotations.
- Availability facts are standalone `$defs.availability_fact` records with `schema_version`, `task_id`, `stage`, `state`, `reason_code`, `observed_at`, and task identity; they are not fixed-path reflection records.
- v2 remains a strict independent schema. Its six blocks and fact trio are completeness inputs; the runtime validator reports missing/unknown completeness as explicit annotations so an incomplete record is not silently treated as complete. The missing-trio fixture is intentionally schema-valid so the validator can emit those annotations.
- Preserve current v1 write-back behavior for dangling evidence, confirmations, and remove_candidate hard gate; the new v2 path must not weaken those rules.

## P1 verification disposition

- Targeted gate is green: 13/13 tests passed; schema JSON parsing, CLI syntax check, and `git diff --check` passed.
- Independent review is `unavailable`: the review transport ended with exit 143 before semantic output. There is no finding result to disposition and no pass claim.
- Adjacent regression has one known P2 failure: the no-executor path does not yet write `stage_reflection.availability_fact`; fix under T201/T202.
- Official session-event recording is `unavailable` because no active WorkflowHub task binding exists in this continuation session.

## Current blockers before testing

- None for P1: `npm ci` completed successfully and the targeted Vitest executable is available.
- The original Downloads path itself remains absent, but its package content was later recovered from the source session's exact patch bytes; P5 input is no longer blocked. Converter archive still needs explicit authorization and P5 independent review remains unavailable.
- Repository has `package-lock.json`; dependencies were restored with `npm ci`.

## Source notes

- The prior template findings file was replaced with this task-specific record after reading it; no production files were affected.

## P2 implementation and review dispositions

- Fixed the P1-carried executor-absent gap: `runStage` now emits an evidence-area `availability_fact` with `state=unavailable` and `reason_code=executor_absent`, leaving the fixed reflection path unused.
- Fixed scheduling classification: preflight, identity, startup, and interruption failures emit `not_scheduled` with the matching reason; ordinary stage handler failures continue into reflection with a failed judgment.
- Fixed the independent pre-fix finding that scheduled `runStageEndReflection` bypassed the transaction: all valid scheduled judgments now call shared `runStageReflection`, so validation and lesson side effects share one boundary.
- Fixed the pre-fix degraded-value finding: a failed judgment retains `status=failed` and its real `error` even when lesson commit/publication fails.
- Fixed the pre-fix recovery finding: post-commit recovery failures attempt CAS rollback while the recovery lock remains held, aggregate rollback errors, and write a durable failure fact.
- Added tests for failed judgment preservation and post-commit recovery rollback. Focused P2 gates are green (21/21 exact gate; 29/29 adjacent runner gate).
- Final P2 independent review attempt is `unavailable`: public broker material `74c62169ca6973e63cfec4a3871f852f05d04ea1f8b12459ddc0aa1727cc6cd7`; broker returned `BROKER_EXIT_NONZERO`, exit 143, with no provider results. No review pass is claimed.
- Adjacent governance run remains incomplete because the archived M16 spec path is absent from this task worktree; the constructed E2E suite also has a pre-existing missing `quality/evidence/stage-reflection-ac-mapping.md` fixture. Neither was reconstructed or expanded into P2.

## P3/P4 and downstream dispositions

- P3 review material `b7f279087b9138f3a58ffa849bf7fd046c53814c02d84ff6d349e29c35163c5d` completed partially with no findings: antigravity/flash completed; opencode/pax3.8 and codex/luna returned `PROVIDER_IDENTITY_INVALID`. This remains a partial independent-review fact, not a pass.
- Earlier P3 review reports that `ajv.addSchema` followed by `ajv.compile` crashes were disproved by the exact validator gate (15/15) and direct module import; no code change was made for that false finding.
- Earlier P3 scope findings about missing P4/P5 deliverables were rejected as boundary errors: T301 is explicitly documentation + static contract only; P4/P5 have separate cards and P5 is now blocked by its missing input package.
- Fixed the real validator findings before advancing: v2 `status_matrix`/`source_completeness` now accept intentional nulls for unavailable/not_scheduled; nested block/status evidence refs are checked; identity task/snapshot fields are compared where both sides are present; missing/unknown v2 completeness yields explicit annotations and degraded status; structured blocks require items and unknown blocks require `unknown_reason`.
- The `consumer_scan_proof.zero_consumption` guard is retained because it is produced by the current `derive-consumption-edges.mjs` task projection and is checked alongside complete `consumer_scan`; existing remove-candidate tests remain green. The review claim that this field is always absent is contradicted by the producer output and P1 gate.
- P4 implementation is limited to the page state vocabulary and read-only fact derivation. Malformed/hash-mismatched availability files are ignored; fixed reflections win; no later outcome leaves unknown. Contract gate is 8/8.
- P5 STOP is binding: `/Users/Hugh/Downloads/workflowhub-stage-reflection-historical-backfill-20260901/` is missing. T501–T504 remain blocked; no historical data or intervention result was invented.
- P6 T602/T603 and P7 T701 are blocked by the missing T504 producer. M16 T601 merge provenance/consumer surface is recorded, but AC-M16-001 and AC-VERIFY-001~004 remain incomplete.

## Final P1/P4 repair dispositions — 2026-09-03

- P4 wh-review final round: material `7b300141b2ccc9b12d902b96bf1bea96d97426f7e1a82f3b37b2725456ecc40d`, runtime `4619f7c9-e5b0-4ed6-8662-76e91f66bfb4`, outcome `partial`, completed-provider findings empty. antigravity/flash completed; opencode/pax3.8 and codex/luna failed `PROVIDER_IDENTITY_INVALID`; preserve partial status and do not call it review green.
- Fixed P4 findings: `hasValidStageOutcome` now rejects present malformed timestamps and future outcomes; `readTask` exposes failure/degraded/not-scheduled rollups; fixed-state and style-reuse fixtures are mounted and asserted; candidate evidence controls open the existing reference panel; task changes clear stale reference panel state; live Evolution ignores confirmations outside the current 30-day window.
- Fixed the cross-phase validator finding: `validate-stage-reflection.mjs` no longer exposes canonical reflection write-back via `writeBack` or `writeValidatedReflection`; CLI validation is read-only, and the contract test now confirms source bytes remain unchanged after downgrade evaluation.
- P1/P4 post-repair deterministic evidence: P1 15/15; P4 8/8; combined P1+P4 23/23; syntax and `git diff --check` passed. Ajv continues to emit the known non-failing `date-time` format warnings because the formats plugin is not installed.
- P5 remains hard-blocked by missing `/Users/Hugh/Downloads/workflowhub-stage-reflection-historical-backfill-20260901/`; P6 T602/T603 and P7 T701 remain blocked. verify-code and browser QA were not entered.
- A later byte-current re-review attempt failed before dispatch with `ROUTE_UNAVAILABLE` because the configured `antigravity/flash` model did not match the 3rd-review config; no provider result or semantic finding was produced. Preserve the earlier successful post-fix partial review and this newer unavailable fact separately.

## Final continuation facts — 2026-09-03

- `npm run check` is green after the final code/path/skill-closure repairs; `git diff --check` is also green.
- The focused stage-reflect/runner gate is green at 19/19, and the wh-review CLI regression is green at 27/27 after aligning only the fake broker's identity fixture with the production-derived config ID.
- The M16 final-aggregate contract remains unavailable/incomplete in this worktree: 22/27 tests fail, primarily because the archived `specs/workflowhub-m16-evolution-20260831/` four-material package is absent. The two request-invalid cases currently report `REVIEW_MATERIAL_INVALID`, and the review-failure runner case returns exit 32 instead of the old expected 31; these are not repaired without the missing historical packet because doing so would change a historical test boundary rather than this task's P6 consumer seam.
- The bounded full `npm test` run reached the 23/23 current five-stage E2E suite and earlier suites, but produced no final aggregate before its 300-second bound; record full-suite verification as `incomplete`.
- No historical package, mixed-input fixture, P7 chain, browser QA, verify-code review, commit, push, merge, archive, or cleanup was performed. P5 remains the external hard stop and P6/P7 remain downstream blocked.

## P5 source reconciliation and continuation — 2026-09-03

- The exact `/Users/Hugh/Downloads/workflowhub-stage-reflection-historical-backfill-20260901/` path is not a runtime directory or a permanent product requirement. It is the offline output directory named by the 2026-09-01 source request: inspect existing stage-reflection data, analyze at least 20 complete WorkflowHub/PaperBuilder task sessions, collect lessons, analyze skill changes, and write the Markdown result to Downloads.
- The current task later converted that prior output into a bounded, one-time formal-import requirement: `specs/workflowhub-stage-reflection-usability-20260901/decision-log.md` R-006/D-003, `spec.md` §7.2 and FR-IMPORT-001~005, and `tasks.md` T501~T504. The required input is the package content, not the Downloads location itself.
- The original session log `/Users/Hugh/.codex/sessions/2026/09/01/rollout-2026-09-01T09-19-39-01a05a8c-e9b8-7692-a213-06d2b2a8e180.jsonl` retained the exact patch bytes that created the offline package. The package was restored from those bytes; no historical lesson, transcript path, intervention, or severity was reconstructed from a summary.
- Restored package facts: 20 transcript-index rows, 20 historical records, 40 lesson rows (20 raw + 20 merged), 5 stage lesson files, and 20 transcript paths resolving to regular files. Initial core-file hashes before T503 enrichment were: Markdown `f40b4e0f34280e5408f02e8c60320ce9a65ee285d4a295798b5e0a54111e150a`, transcript index `aee8084f7831ac41c70f8fe205a79dda505714f29dc2c885e3578aa894e769b0`, historical records `8a7281a9ab986e6ec77dbc54695656098274386287f7a391e8a36dd44eb11ec6`.
- T501/T502 are now complete: the one-time converter validates the real package, maps string refs to object arrays, preserves `unknown-*` identities, marks `historical_replay=true`, removes evidence fragments, and covers idempotence/conflict/malformed-package rejection. Contract tests pass 4/4; real-package dry-run exits 0 with 20 merged entries, 40 formal rows, 8 targets, and no errors.
- T503 is now complete as evidence production: 20 intervention certificates exist, 19 are `observed`, 1 is `none_observed` with checked-scope evidence; all anchor ranges are within actual transcript line counts. All 20 judgments are calibrated to `medium` with explicit `severity_reason` under the single-occurrence rule. Partial source-index completeness remains partial.
- T504 external import completed into the authorized paths under `/Users/Hugh/Knowledge/Projects/`: 40 rows across 8 project/stage targets and the transcript index copied to both project evidence areas. The execute rerun added 0 rows and reported `idempotent=true`; independent output assertions pass for project split, 20 raw/20 merged kinds, historical markers, object refs, file-level refs, severity, intervention fields, and byte-equal evidence indexes.
- T504 converter archive, independent P5 review, P6 mixed-input adaptation, P7 real-chain/browser QA, verify-code, acceptance, release, commit, push, merge, and cleanup remain incomplete or unauthorized. The successful import is not an acceptance or release verdict.

## Verify-code review and repair — 2026-09-03

- Architecture review found a real boundary defect: `publishStageReflectionAvailability()` and the shared `runStageReflection()` path did not validate their direct `now` input, while the emitted schema requires a date-time. A malformed timestamp could therefore create an invalid availability fact or make the scheduled path fail without a durable fact.
- Fixed in `runtime/stage/stage-reflect.mjs` and `runtime/stage/stage-runner.mjs`; added negative coverage in `tests/contract/stage-reflect.test.mjs` and `tests/contract/stage-runner-reflection.test.mjs`.
- The fix is limited to input validation; no public behavior class, storage path, M16 algorithm, or historical import contract changed.
- One heterologous review was attempted against the current implementation packet, but no semantic result was returned. `workflowhub-capability` is absent, so the independent review fact is `unavailable`; it is not treated as pass and there is no finding to disposition.
- Verify-code session-event recording is also `unavailable` because the current Codex session has no active WorkflowHub task binding. Creating a new/fake binding would break task provenance, so none was created.

## P7 real-chain continuation — 2026-09-03

- T701 focused E2E now passes 1/1 in `tests/e2e/stage-reflect-real-chain.test.mjs`, using public `confirm`/`run`, real temporary task/worktree stores, reflection publication, page data, and M16 evolution projection.
- The test covers success, reflection executor failure, build-plan preflight `not_scheduled`, and dangling-evidence `degraded`; failed/degraded outcomes are asserted as facts rather than normalized to success.
- The shared test fixture now supplies the required `skill_outcome.input_refs` array. This is test-fixture contract repair only; no production behavior change.
- `isolated-browser-qa` / `agent-browser` smoke passed against a local static monitor page, with task/Evolution tab and stage accordion interaction plus `/tmp/workflowhub-stage-reflection-browser-qa.png`; cleanup completed and the temporary server stopped. It does not replace four-path browser acceptance.
- P7 gate remains `partial`; full npm test aggregate, M16 archived-material-dependent regression, independent review, verify-code, acceptance, release, archive, and cleanup remain incomplete or unauthorized.

## P6 archive-path and live-probe repair — 2026-09-03

- 原先“缺失 archived M16 四材料”的失败结论已被来源复核纠正：材料实际位于并跟踪于 `specs/archive/workflowhub-m16-evolution-20260831/`；失败 consumer 使用了归档前路径。只修复六处测试/fixture 路径引用，未改归档材料。
- 修复后 P6 prescribed aggregate 为 6 files、130/130、exit 0；pool-tax 85/85、ledger-brief 40/40、monitor 9/9、governance 22/22 均 green。
- `public-behavior-baseline.mjs` 的临时 case 会继承父 Codex session identity，导致第一 case 删除其临时 task root 后后续 live case 报 `ENOENT`。已清空两个继承身份环境变量；live baseline 11/11 通过，治理子门禁 22/22 通过。
- `check-red-authenticity.mjs` 已支持 `it.each(workflowPaths)` 的声明数组，pool-tax 门禁由“测试全绿但证据脚本 exit 23”恢复为真实 green。
- P6 总体仍为 `partial`：独立 P6 review 未执行，M16 T010/AC-GOV-002 仍 incomplete/inconclusive；deterministic regression 不等于 release 或 acceptance。

## Final continuation checks — 2026-09-03

- `npm run check` exit 0，`git diff --check` 通过；P6 gate 已记录 130/130，四个 M16 子门禁均 green。
- P7 的 `/tmp/workflowhub-stage-reflection-browser-qa.png` 证明的是本地静态页面 smoke，不是正式四路径浏览器验收；full `npm test`、独立 review、acceptance/release 仍保持未闭合。

## Full-suite failure repair — 2026-09-03

- 完整 `npm run test:safe` 已真实跑完，结果为 209 个 test files 中 207 个通过、2 个失败、25 个 skipped；失败不是 M16 归档路径，而是一个缺失的旧 T20 证据索引和 `host_provider=""` 输入边界。
- 已按 archived T20 要求补齐 `quality/evidence/stage-reflection-ac-mapping.md` 的 12 行路径映射，并明确 `AC-001` 仍延期到下一真实任务；构造链与 left-shift 两个失败套件随后 8/8 通过。
- 已在 `simple-review-runner.mjs` 拒绝空白 provider；`npm run test:exclusive` 2 files/31 tests 通过。safe aggregate 未为这两处修复重新执行，因此 full `npm test` 不宣称 green。

## Final skill-closure repair — 2026-09-03

- `check-skill-closure` 首次复核发现 `simple-review-runner.mjs` 改动后的 bundle asset hash 已过期；同步更新 `skills/wh-review/skill-bundle.json` 的 asset hash 和 `skills/catalog.yaml` 的派生 `local_bundle_hash`，未改变运行时语义。
- 直接 closure 校验通过：`skill closure: ok`；随后 `npm run check` exit 0，包含 144 个 Markdown 文件、结构、反宿主、可扩展性、契约、metrics、stage-quality、task-record、skill closure 和 5-stage skill smoke。
- `git diff --check` 通过；T20 AC 映射 12 行且引用路径全部存在。此前 safe aggregate 的两处失败已定向修复，随后完整 safe aggregate 仍有一条 clean main 同样复现的既有失败，故不改写为 full green。

### Final full-suite verification — 2026-09-03

- `npm run test:safe` 已完成完整收集与执行，exit 1：209 个 test files 中 208 个通过、1 个失败、25 个 skipped；2188 个测试通过、1 个失败、25 个 skipped。
- 唯一失败为 `tests/official-component-receipts.test.mjs:566` 的 `bounds test-capture lease waits and preserves the owner timeout fact`：父进程 `execFileSync` 在 500ms 上限内收到 `ETIMEDOUT`，没有拿到子进程应返回的 lock-lease 错误。
- 在 main checkout `/Users/Hugh/Hugh/Project/workflowhub` 对同一 focused test 复现同样失败；该 checkout 仅有 3 个与 official-component-receipts 无关的 dirty files，因此不是本任务的 stage-reflection 改动引入；未修改该测试来制造假绿。
- 当前可真实报告为：本任务定向测试、P6 130/130、`npm run check`、skill closure、`git diff --check` 通过；全量测试仍因一条既有 baseline failure 未达到 exit 0。

### Targeted baseline test repair — 2026-09-03

- 已定位 `tests/official-component-receipts.test.mjs:566`：测试把 Node 子进程启动/模块加载时间和内部锁等待共用 500ms 外层上限，导致父进程先 `ETIMEDOUT`，无法观察子进程的 25ms lock-lease 错误。
- 最小修复：仅把该测试的父 `execFileSync` timeout 调整为 5000ms，并保留子进程 `lockWaitMs=25`、stderr 错误和 `timedOut=false` 断言；没有修改生产锁实现。
- 受影响测试文件复跑通过：52/52。此前完整 safe aggregate 不重跑，故不把它改写成 full-suite green；后续应在需要完整门禁时再跑一次 `npm run test:safe`。

### Heterologous verify-code review and repair — 2026-09-03

- 修复了异源 review 路由根因：`/Users/Hugh/.config/workflowhub/config.json` 中 `wh_review.profiles.antigravity/flash.model` 使用展示名，而 `/Users/Hugh/.config/3rd-review/config.json` 使用 canonical model id `gemini-3.8-flash-high`；已只对齐 host 配置，`wh-review doctor` 现为 exit 0。
- 路由恢复后完成一次真实 verify-code review dispatch。material `5d3bd3fa0f2a2d42425986b12e49f5c4637491550255b9b950127da008655535`，runtime `2648d249-2e34-4f8c-bd60-fe81db849801`，aggregate `available/partial`；`pi/coding` 返回有效语义结果和 2 个有效 anchor，`grok/grok` 与 `pi/v4flash` 因 `PROVIDER_IDENTITY_INVALID` 失败，`codex/luna` 因 `SAME_SOURCE` 被正确排除。
- `EXT-VERIFY-001`：`runStageEndReflection` 对 reason-only availability input 独立推导 state/reason，可能产生不符合 schema 的组合。已新增 `normalizeStageReflectionAvailability()`，stage-end 和 shared reflection 共用归一化与配对校验；`tests/contract/stage-runner-reflection.test.mjs` 覆盖 reason-only 推导和 mismatch 拒绝。
- `EXT-VERIFY-002`：页面 projection-only missing-stage row 被标成 machine fact。已改为 `judgment_layer=judgment`、`is_fact=false`，真实持久 availability fact 仍为 `fact/true`；页面契约和 real-chain E2E 已覆盖。
- 本次异源 packet 在上述两项修复前采集；按 verify-code contract，本轮修复后不重复调用 provider。该结果作为 review-round evidence 保留，不冒充 current-byte review pass、canonical dsh-code-review、acceptance 或 close 授权。

## Independent post-repair audit — 2026-09-03

- `build-reflection-page-template.html` 原先在 reference region 为 `stale` 时提前返回，导致历史回放候选只存在 `data.js`、页面不可见；已允许有候选的 stale `reference_only` 区继续渲染，并保留状态/原因提示。
- 页面原先把 evolution candidate 的 provenance 固定显示为 `judgment · 非事实`；已改为读取 `is_fact`/`judgment_layer`，历史回放显示 `fact · 事实`，且保留“历史回放/不等于删除许可”边界。
- `build-reflection-page.mjs` 与 `validate-stage-reflection.mjs` 原先使用 Ajv 但未注册 `date-time` validator；已加入严格 RFC3339 校验，producer 入口 `stage-reflect.mjs`/`stage-runner.mjs` 同步复用，malformed fixture 现在明确失败。
- real-chain 原先只断言 `not_scheduled` 状态；已增加读取持久 availability fact 并断言 `reason_code=preflight_failed`，证明 producer→fact→page 链路。
- 复核命令 exit 0：5 files/49 tests。未重跑全量回归。

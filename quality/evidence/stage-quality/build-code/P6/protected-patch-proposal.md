# P6 protected-surface patch proposal (review only)

**Status:** proposal; no production or frozen-test file changed here. The user decision on cross-card ownership is pending. `P6/T012-current.txt` recorded 17 tests, 4 failed/13 passed before the external oracle gained `schema_version: "1.0.0"`; the oracle change has not been verified by the same E2E command. The other three T012 failures and five T013 failures remain separate facts. P6 stays `not_done/G2`.

## T012: expose the analyzer's machine status

- **Owner/write surface:** CARD-05 / protected `runtime/stage/stage-runner.mjs`, not P4's acceptance-chain builder or P5's pure report transformer.
- **Cause:** `publishStageEndSpecAnalyzeFact` retains `analysis_result.status`, but passes no `evidenceState` to `publishAcceptanceQualityFact`. That existing helper writes `subject_fact.evidence_state` only when supplied and derives `acceptance.summary.actual_outcome` from `evidenceState ?? status`. Thus a real `material_incomplete` verdict becomes generic `missing` in the summary and no evidence-state slot.
- **Candidate hunk:** scope the new projection to post build-code, preserving the existing `status=missing`, `acceptance.result=deferred`, `analysis_result` bytes, and advisory membership. Do not replace the analyzer status or edit its source.

**Scope correction (2026-09-27):** this hunk is only a possible diagnostic projection. Preserving `acceptance.result=deferred` still collapses a machine missing outcome into the old value; by itself it does **not** satisfy FR-26/AC-26 or the current full-implementation goal. Do not apply or approve it as the complete T012/T013 solution. The protected owner must trace the original machine result through the canonical writer, current facts and report consumer, then test the real missing/incomplete/unavailable outcomes without changing the three-state quality-fact contract or laundering historical records.

```diff
--- a/runtime/stage/stage-runner.mjs
+++ b/runtime/stage/stage-runner.mjs
@@ function publishStageEndSpecAnalyzeFact(ctx, result, snapshot, recordedAt = null) {
   return publishAcceptanceQualityFact(ctx, snapshot, {
     subject: "stage_end_spec_analyze",
     status: consistent ? "passed" : "missing",
+    evidenceState: ctx.stage === "build-code" && ctx.manifest?.activation_cohort === "post"
+      ? analyzerResult?.status : undefined,
     detail: consistent
```

- **Review questions:** confirm every `analyzerResult.status` emitted here is a valid machine judgment for `subject_fact.evidence_state`, and that this semantic slot is distinct from the acceptance result enum and the quality fact's three-state status. In particular, absent analyzer result remains `undefined`; it must not become a false `consistent` claim.
- **Focused validation after authorization:** `npx vitest run tests/e2e/card-04-real-entry-chain-e2e.test.mjs -t "诚实性-1"` (the fixture setup still executes real CLI subprocesses), plus `npx vitest run tests/contract/post-phase-official-handler.test.mjs -t "stage-end analyzer"` if the owner needs a narrow stage-result guard. Then run the exact T012 command once when the dynamic-report producer is also available. Observe the actual leaf's `summary.actual_outcome` and `subject_fact.evidence_state` equal `analysis_result.status`; check `acceptance.result` and stage status did not change.
- **Rollback:** remove this single conditional property, retaining the recorded RED and any new raw evidence. No old immutable receipt is rewritten.

## T013 A-8: zero-entry census must expose each source error

- **Owner/write surface:** CARD-05 / protected `runtime/stage/stage-content-contracts.mjs`. P6/T013 owns a frozen consumer test only; P4/P5 files cannot repair this producer.
- **Cause:** at `validateStageSpecAnalyzeProfile` around lines 6498–6509, the zero-entry guard emits one generic `MATERIAL_INCOMPLETE` error and places the loop over `authenticatedSourceCensus.errors` inside its `else`. The real parser already reports missing census sections separately; the official analyzer discards those diagnostics when entries are zero.
- **Candidate hunk:** keep the generic denominator failure, project the parser's existing errors regardless of entry count, then perform trusted-ID/coverage checks only when the census is present with nonzero entries. The existing `for (const error ...)` block moves unchanged; it must appear exactly once.

```diff
--- a/runtime/stage/stage-content-contracts.mjs
+++ b/runtime/stage/stage-content-contracts.mjs
@@ if (postBuildCode && nonEmptyString(identity?.task_id)) {
-    if (authenticatedSourceCensus?.status !== "present" || !Array.isArray(authenticatedSourceCensus.entries)
-        || authenticatedSourceCensus.entries.length === 0) {
+    const censusReady = authenticatedSourceCensus?.status === "present"
+      && Array.isArray(authenticatedSourceCensus.entries)
+      && authenticatedSourceCensus.entries.length > 0;
+    if (!censusReady) {
       errors.push("MATERIAL_INCOMPLETE: authenticated original source census is required for post build-code");
-    } else {
-      const trustedIds = new Set(authenticatedSourceCensus.entries.map((entry) => entry?.id).filter(nonEmptyString));
-      const claimedIds = new Set(requirements.map((entry) => entry?.id).filter(nonEmptyString));
-      for (const error of authenticatedSourceCensus.errors ?? []) {
+    }
+    for (const error of authenticatedSourceCensus?.errors ?? []) {
         errors.push(`MATERIAL_INCOMPLETE: decision-log original source census: ${error}`);
         findings.push(stageAnalyzeFinding({
           type: "requirement_gap", artifact: "decision_log", lineOrAnchor: "原始需求索引",
           impact: error, correction: "在当前 decision-log 补齐逐字声明与 R 索引的双向映射，再复查 spec/Phase",
         }));
-      }
+    }
+    if (censusReady) {
+      const trustedIds = new Set(authenticatedSourceCensus.entries.map((entry) => entry?.id).filter(nonEmptyString));
+      const claimedIds = new Set(requirements.map((entry) => entry?.id).filter(nonEmptyString));
       for (const id of trustedIds) {
```

- **Review questions:** the source errors must retain their original text/order and one finding per error; a compliant nonzero census must produce no source complaint. Keep the `ok/status/errors/findings/summary/facts` result key set and `stage_end_spec_analyze` advisory classification unchanged. Null/malformed census still emits the generic denominator error without inventing section names.
- **Focused validation after authorization:** `npx vitest run tests/contract/spec-analyze-truthfulness.test.mjs` (3 tests: zero-entry distinct diagnostics, compliant negative, stable shape). Recheck `npx vitest run tests/contract/post-phase-official-handler.test.mjs -t "stage-end analyzer"` if the protected owner sees affected analyzer behavior. Run T013's exact three-file gate only after A-9′ is fixed; its prior run took 127 seconds and the independent archived-fixture failures otherwise remain.
- **Rollback:** restore the guard/else and error loop to their old positions; preserve RED/GREEN transcripts and hashes.

## T013 A-9′: CARD-05 test reads its archived materials

- **Owner/write surface:** CARD-05's `tests/contract/post-spec-analyze-original-source.test.mjs`, not a CARD-04 T013 test edit. Current test lines 5–17 read P1–P5, index, spec and decision log from the retired live path; all these materials exist under `specs/archive/workflowhub-thin-core-card-05-20260919/`.
- **Candidate hunk:** one source-root line only; keep every assertion and production parser unchanged.

```diff
--- a/tests/contract/post-spec-analyze-original-source.test.mjs
+++ b/tests/contract/post-spec-analyze-original-source.test.mjs
@@
-const root = "specs/workflowhub-thin-core-card-05-20260919";
+const root = "specs/archive/workflowhub-thin-core-card-05-20260919";
```

- **Focused validation after authorization:** `npx vitest run tests/contract/post-spec-analyze-original-source.test.mjs` (the previous four `ENOENT` failures should reach their actual assertions; two existing passes must remain), then the exact T013 three-file gate. Archive files are read-only; no copy back into live `specs/`.
- **Rollback:** revert this one test-root line if the CARD-05 owner chooses an independently authenticated fixture instead. Preserve the A-9′ `ENOENT` original and the post-change output.

## T012/P5-T008: dynamic report producer needs a separate contract

`runtime/stage/stage-end-report.mjs` now has pure `buildStageEndReportFacts`, `renderStageEndReport`, and `collectStageEndReportFacts` exports. Its only current consumer found in this bounded check is the module test. The T012 E2E launches a real `run --action=execute --stage=build-code` in a fresh temporary task, then reads **that task store's** `quality/evidence/stage-quality/build-code/P5/report-facts.json`. A file placed in CARD-04's worktree or copied from P5/T008 cannot satisfy the producer contract.

A candidate hook location for review is the authenticated build-code stage-end publication path in `runtime/stage/stage-runner.mjs`, where the actual result, source snapshot, material revision and canonical quality refs are available, or the one public CLI run boundary after it has the exact serialized output bytes. **No executable hunk is proposed yet.** The present APIs do not expose a verified runtime `acceptanceChain` or a single-source report publication transaction; changing a pure P5 module cannot add this behavior. Resolve these inputs first:

1. Which exact already authenticated object supplies `chainRows` at this point? When absent, the report must say `incomplete/missing`, never synthesize AC rows. Identify the exact `stageResult` stdout bytes or an equivalent canonical ref/hash, its task/worktree/branch, material revision and source tree, and the evidence refs to read back.
2. Define one capture boundary: producer, path, raw bytes/hash, source snapshot check before/after, and cleanup/error behavior. The current CLI prints a JSON result after `runOfficialStage` returns; serializing once for stdout and report avoids two divergent executions, but its owner must choose that boundary and verify the same bytes.
3. Reconcile the E2E's fixed `P5/report-facts.json` path with immutable reports and repeated same-task `run`. A create-only write can use this path once per authenticated P5 snapshot; on a different snapshot it must fail with a clear conflict or use a reviewed content-addressed ref plus a truthful index. Neither silent overwrite nor a second progress ledger is acceptable. The current frozen E2E reads the fixed path and therefore any ref/index change needs a separate test/ownership decision.
4. Decide whether this is a P5 interim checkpoint or a final stage-end report. P5/T008 only owns an interim, currently blocked local evidence shape; P13/T024 owns final all-Phase delivery. The producer must never mark future Phase work passed or infer `not_done=[]` from missing execution data.

**Proposed validation after that decision:** first the existing `npx vitest run runtime/stage/stage-end-report.test.mjs` for the pure transform, then a single isolated CLI fixture checking the fixed task-store path, source/hash, `not_done` itemization and repeat/changed-snapshot behavior, then `npx vitest run tests/e2e/card-04-real-entry-chain-e2e.test.mjs`. The E2E previously took about 40 seconds. Keep T012 and P5/T008 `not_done/G2` until the authenticated producer and immutable lifecycle are proven.

## T014 / AC-25: actual d1 historical pair fails current canonical readback (2026-09-27)

[Real-pair readback evidence](AC25-d1-real-pair-readback-20260927.md) binds the authenticated TaskHandle, red/blue attempt/report/result/pair-summary refs and hashes, current reader source SHA, one read-only probe command and raw exit **1**. The stored blue record has `coverage=incomplete`, `terminal_status=unavailable`, `result_ref=null`; the current reader reconstructs `coverage=satisfied` and throws `canonical review report binding is invalid`. The existing T014 6-test GREEN only uses synthetic pairs, so AC-25 is **incomplete**, not unknown or passed.

Independent source review found that `prepareSimpleReviewRecord` treats `partial` as covered when either a declared quorum or historical-partial flag is present. This blue member already declares quorum=1; changing only `allowHistoricalPartialCoverage` cannot restore `incomplete`. Reconstructing it as covered would also rewrite the derived terminal state and `result_ref`. Therefore no single-line candidate hunk is authorized or proposed.

- **Owner/write surface:** CARD-05 `runtime/review/review-record-route.mjs` and its canonical reader tests. CARD-04 P6/T014 owns this observed failure and consumer evidence, not the protected reader implementation.
- **Required contract before patch:** recognize only an authenticated old pair's stored writer shape; preserve blue `incomplete/unavailable/null`, red semantic result, provider raw/ref/hash and pair-summary `partial=true`. Current writer behavior and current review namespaces must remain unchanged. Never accept a mismatched saved report by merely skipping binding checks.
- **Focused validation after owner decision:** true d1 readback positive; same-namespace missing blue member, report/ref/raw, forged coverage/semantic/ref, changed provider status or request identity all fail closed; foreign pair still may be skipped without blocking a current request. Keep old failing probe/raw and run only those targeted tests and the exact T014 gate.

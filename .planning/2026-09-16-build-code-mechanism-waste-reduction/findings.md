# Findings & Decisions

## Current identity

- Worktree: `/Users/Hugh/Hugh/Project/workflowhub-workflowhub-mechanism-waste-reduction-20260915`
- Branch: `task/workflowhub/workflowhub-mechanism-waste-reduction-20260915`
- HEAD at start: `c5abe9eff99c4432e677d8a30bdfff94d6209690`
- Shell checkout `/Users/Hugh/Hugh/Project/workflowhub` is `main` with unrelated modified `runtime/review/review-record-route.mjs`; do not edit it.

## Frozen task inputs

- Current materials: `specs/workflowhub-mechanism-waste-reduction-20260915/{decision-log,spec,plan,tasks}.md`
- Task cards T001–T017 are all `pending` at start.
- Spec freezes `non_ui`, fixed late window `<600000ms` / `>=600000ms`, no automatic redispatch, single authenticated writer, deterministic fixtures, and no external-repo acceptance in this task.
- Build-code dependencies: `test-routing-advisor` each behavior phase, exactly one concrete testing route (`backend-testing`), `wh-review` once per phase, `spec-analyze` at stage end, `stage-reflection` and `stage-handoff` on stage end.

## Evidence discipline

- RED must fail at the named behavior assertion, not setup.
- GREEN uses the same command and oracle as RED.
- `unknown`, `unavailable`, `partial`, and `incomplete` remain explicit.
- No phase is complete without actual changed files, commands/exits, AC results, review fact or truthful unavailability, finding dispositions, and handoff facts.

## P1 review disposition

- Attempt: `quality/reviews/attempts/e5fd7278-fe3f-5678-a472-ffbed58a8d12/attempt.json`
- Result/report: `quality/reviews/results/build-code-simple-e5fd7278-fe3f-5678-a472-ffbed58a8d12.json` and `quality/reviews/reports/build-code-simple-e5fd7278-fe3f-5678-a472-ffbed58a8d12.md`
- Finding `F-ae27d7ad04e9`: `rejected_invalid`. The provider assumed ordinary build-code reviews are snapshot-bound. The current accepted spec says material and ordinary code-snapshot changes do not invalidate or auto-redispatch recorded reviews (FR-REV-001/002), and assigns the current snapshot guard only to terminal verify-code code review (FR-REV-003; AC-REV-005). No implementation change is required for this finding.
- Provider fact retained: `codex/luna` failed with `EVIDENCE_ANCHOR_INVALID`; provider coverage is not a pass claim.

## P2 review dispositions

- `F-a3b78f83cb2a` (verify snapshot auto-dispatch): `fixed`. The route now returns `REVIEW_CURRENT_SNAPSHOT_RETRY_REQUIRED` without dispatch when verify-code has only an older snapshot; the contract test proves a judged retry is the only new dispatch path.
- `F-fdc623df36c6` (freshness semantic identity): `rejected_invalid`. The finding omitted the existing `runtime/evidence/freshness.mjs:614-632` subject/phase/scope identity matrix, which rejects mismatched review results. No change was warranted.
- `F-8cabffb87eae`, `F-c8b25221f9fe`, `F-38739e6043a3`: `fixed` by retry-shape handling and the P2 negative tests (`null`, declined, missing reason, and non-boolean requested flag).
- `F-3d94d5cfdb60`: `fixed` by current P1 canonical test receipt `quality/tests/build-code-p1-material-change-v2.json`, which was included in the repair review evidence.
- Latest review attempt `a7f2a356-101f-5fa5-a0c8-fb790e6feb2f` is semantic and has no remaining major/blocking finding. The provider attempts/results/reports for all P2 reviews remain immutable task-store facts.

## P3 review and boundary

- RED/GREEN: T005 RED is captured at .planning/2026-09-16-build-code-mechanism-waste-reduction/apply/evidence/T005.stdout; T006 GREEN is captured at .planning/2026-09-16-build-code-mechanism-waste-reduction/apply/evidence/T006.stdout. The public test receipt is quality/tests/build-code-p3-external-threshold.json with hash e5d3898ad8559c71eefd5efa9f2e2dd81c0934a8bb589c9c4a26ccbf37e4933e.
- Implementation decision: the trusted route must carry an explicit positive minimum_heterologous; eligible members are counted by non-empty underlying model identity, never by profile or adapter name. Completed members with valid semantic output count; failed, cancelled, and running members remain transport facts and do not count.
- Public review: attempt quality/reviews/attempts/f546fd83-d361-588c-ac7d-616b00a98110/attempt.json and report quality/reviews/reports/build-code-simple-f546fd83-d361-588c-ac7d-616b00a98110.md ended unavailable. kimi/coding preserved PUBLIC_RESULT_INVALID; codex/luna preserved EVIDENCE_ANCHOR_INVALID. No semantic finding was available; this is a quality limitation, not a pass claim.
- External boundary: /Users/Hugh/Hugh/Project/3rd-review was not edited or formally accepted. Its implementation/acceptance/commit/push/close facts remain unknown and outside WorkflowHub task pass.

## P4 implementation facts

- T007 RED and T008 GREEN use the same deterministic fixture and targeted command. GREEN proves the existing v3 group can carry `initial_result_ref`, `publication`, and `supplements` without introducing a task-store writer.
- `registerReviewSupplement` is a pure append operation: it validates the initial-result binding, computes elapsed time from the supplied `published_at`, freezes the new supplement array, and leaves initial bytes/fields untouched. `599999` is `in_window`; `600000` is `over_window_unjudged`; a repeated identical supplement is a no-op.
- Runner integration preserves publication metadata and folds only in-window findings into the existing result aggregation. The external formal acceptance/repository remains outside scope and unknown.
- Canonical receipt: `quality/tests/build-code-p4-external-supplement-v2.json`, SHA-256 `dded4081cfe562c9e2cd93ca516dffeb228b20723adb840cccc71e0652a161a8`.
- Phase review attempt `14b5ab76-ace4-5006-a455-a0b414d5f629` is an immutable unavailable fact (`REVIEW_WAIT_EXCEEDED`, empty provider attempts); no semantic finding was available to disposition.

## Post-P5 targeted regression repair

- The installed-runner regression initially failed before executing its test body because `skills/wh-review/skill-bundle.json` still carried pre-P3 hashes for `scripts/review-provider-client.mjs`, `scripts/third-review-host-config.mjs`, and `scripts/simple-review-runner.mjs`. All three manifest hashes were synchronized (`26af405c0ae10bdc21974f7db7c8259cd3ca1c8e3946099d45483cccf17570a2`, `1338b0d106322f25bafa5a620e17c2193d8a42a38f0bbf0ef1026a1c61dd4d03`, `8a8727d7a0288d45210e95c80fa631f46ae1b4f4d6974af7a7d06e26b295d74a`), then `skills/catalog.yaml` was synchronized to the resolved bundle hash `93ed0e495a31f5a8a13ebf877e4a689a694d3cf866bc32b1cd4c1c36bc821d88`; this is release-closure metadata, not a second implementation path.

## P5 implementation facts

- T009 RED and T010 GREEN use the same deterministic fixture and targeted gate. The positive path writes only from the authenticated task worktree; wrong current worktree, foreign task path/root, and foreign task id fail before target bytes, while status remains readable.
- `assertTaskWriteIdentity` is the shared pre-write check used by stage-runtime and task-close, and by the bridge after its sidecar context is opened. The bridge keeps sidecar path resolution explicit but compares the optional propagated workspace root with the authenticated Workspace; no child outcome writer runs before this check.
- New-task bootstrap records `task_id`, `command`, `creation_result`, and a closed transaction in the existing `identity/executions` namespace. Existing-task bootstrap remains idempotent and does not reopen or create a bootstrap object.
- `public-behavior-baseline` and `clean-install` now run writing probes from the task worktree. A stale P3 Skill Bundle/catalog hash was repaired as metadata after the clean-install closure check; the relevant clean-install probes then passed.
- Canonical P5 receipt: `quality/tests/build-code-p5-write-identity.json`, SHA-256 `dc0bab8c6be4e3ef6ca2fd0d0ee3ec0330eafe915b6fc9b4c416ea0b6a100e70`.
- Phase review attempt `b429f86f-8a10-511e-a2c5-14500c402b03` has Kimi completed with empty findings and Codex failed `EVIDENCE_ANCHOR_INVALID`; the result is semantically available at the minimum threshold, but the provider failure remains an explicit quality fact and has no finding disposition.

## P6 review dispositions

- Phase review attempt: `quality/reviews/attempts/52ba1bc8-e1a8-5547-ae19-a78bd300539c/attempt.json`; result/report: `quality/reviews/results/build-code-simple-52ba1bc8-e1a8-5547-ae19-a78bd300539c.json` and `quality/reviews/reports/build-code-simple-52ba1bc8-e1a8-5547-ae19-a78bd300539c.md`.
- `F-9e438ac1cd33`: `rejected_invalid`. The finding's diff anchor treated the shared default `stageInputKeys` branch as the build-code branch. Current source returns a build-code-specific list without `interaction_aggregate`; an unexpected build-code field is rejected before the handler. No change required.
- `F-a022469f250b`: `fixed`. The retry fact now says `retry declined` when no accepted retry basis exists, regardless of whether a reusable review exists; `tests/contract/review-budget-deletion.test.mjs` proves the no-reusable case dispatches with the truthful explanation (3/3).
- Provider fact retained: `kimi/coding` produced two minor findings and `codex/luna` failed `PUBLIC_RESULT_INVALID`; semantic coverage was available at the minimum threshold but is partial, not a clean two-provider pass. The retry repair happened after this immutable review, so no re-review was run.

## P6 execution facts

- T011 evidence: `.planning/2026-09-16-build-code-mechanism-waste-reduction/apply/evidence/T011.stdout`; T012 evidence: `.planning/2026-09-16-build-code-mechanism-waste-reduction/apply/evidence/T012.stdout`.
- Current implementation changed `runtime/stage/stage-handlers.mjs`, `runtime/stage/stage-runner.mjs`, and the existing public ingress in `tools/cli/stage-runtime.mjs`; no stable schema or second writer was added. The public ingress addition is a boundary clarification from the plan's FR-RUNTIME-001, not a new command/control plane.
- Explicit N/A is validated and preserved by the shared acceptance shape/writer representation; the current no-evidence vNext path remains an official unknown skeleton, so no unsupported N/A inference was added.

## P7 execution facts

- T013 RED: `.planning/2026-09-16-build-code-mechanism-waste-reduction/apply/evidence/T013.stdout`, exit `1`, target failures only. T014 GREEN: same command exit `0`, 4/4; canonical receipt `quality/tests/build-code-p7-remote-cleanup.json`, hash `634ff220af6e970ff966f72ea62819e936ac6bbd4ecb6e7ab97b407a162b26a0`.
- T015 RED: `.planning/2026-09-16-build-code-mechanism-waste-reduction/apply/evidence/T015.stdout`, exit `1`, 3 intended failures / 59 passes. T016 GREEN: same command exit `0`, 62/62 across 3 files; canonical receipt `quality/tests/build-code-p7-runtime-handoff.json`, hash `9b6e2d8216328b1ab80e7c3be42097bcc8cdadbae60837ea17bd969643599dc4`.
- The deferred handoff file is `/Users/Hugh/Downloads/workflowhub-deferred-items-20260915.md`; it remains external, non-authoritative, fixed-path input for the next task, with exactly seven DEF groups.

## P7 phase review dispositions

- Review attempt/result/report: `quality/reviews/attempts/281934a1-58af-5323-af55-99f57bd2e111/attempt.json`, `quality/reviews/results/build-code-simple-281934a1-58af-5323-af55-99f57bd2e111.json`, `quality/reviews/reports/build-code-simple-281934a1-58af-5323-af55-99f57bd2e111.md`. Terminal status `semantic`; Kimi completed with empty findings; Codex completed with five direct actionable findings. The review is one immutable fact and was not rerun after repair.
- `F-eced98c3c37e` — **fixed**. `simple-review-runner` now counts only completed members in `eligible_profiles` toward the distinct-model threshold; dispatch-only profiles remain observable but cannot satisfy quorum. Regression: external threshold contract 4/4.
- `F-dd565e8fc4be` — **fixed**. Supplement findings now pass the existing findings-only parser, selected-provider identity binding, and bundle material-anchor validation before in-window aggregation; malformed, unanchored, or unconfigured supplements remain unavailable. Regression: external supplement contract 4/4.
- `F-317d444d568c` — **fixed**. v3 running members are accepted only as a publication-envelope partial snapshot with matching running count and no terminal output/timing; provider protocol/schema document the same contract, and canonical local provider-attempt records preserve `running` instead of coercing it to `failed`. Regression: external threshold 4/4, provider timeout 9/9, managed lifecycle 26/26, schema validator 7/7.
- `F-54c89554f5f2` — **fixed**. Retry admission now requires an authenticated change against the same review lineage: changed material id, changed trusted route identity, or recovery from a blocked no-route attempt. Free-form reason is omitted from request identity, so a new sentence cannot create another dispatch. Regression: review-budget deletion 3/3.
- `F-4abcdf988851` — **fixed**. Future disposition uses the explicit union of known stage materials; unknown names return `status=unknown`, `material_category=invalid`, `exit_code=1`, and `material_invalid`, while known later-stage omissions retain `not_applicable` with reason and exit `0`. Regression: stage-handoff 35/35.
- No P7 finding was rejected as invalid. The two-provider aggregate is partial at the provider-fact level where applicable; Codex review evidence itself remains the source-attributed semantic review fact, not a quality pass.

## P7 scope / non-claims

- External `/Users/Hugh/Hugh/Project/3rd-review` formal acceptance, commit, push, and close remain unknown/outside this task’s pass. No real remote branch was deleted; T013/T014 used a deterministic bare remote fixture.
- Browser QA is not run because the accepted spec is `non_ui`; this is applicability, not a browser pass.
- The full legacy `skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs` was probed and failed 41 tests because its older fixtures omit the now-required explicit `minimum_heterologous` and provider-model selection fields. It is outside the bounded T017 aggregate; no broad regression claim is made. The changed contract suites and focused lifecycle/timeout/schema suites above pass.

## P7 stage-end facts

- T017 is complete as a bounded implementation aggregate: public receipt `quality/tests/build-code-p7-final-aggregate.json` is exit `0`, 13 files / 164 tests, receipt hash `7609297785dd5fa6c022a7576532fa78b0cb15ef308aa56a9950fd9512f5eaf1`; no full regression claim.
- The local wrapper published an explicit unavailable Stage Agent outcome at `quality/evidence/stage-outcomes/build-code/7ca353af39b99dc5b3b379e507229560569cf1c27c9f97178f18db06f6eaca29.json`, hash `7ca353af39b99dc5b3b379e507229560569cf1c27c9f97178f18db06f6eaca29`, attempt `build-code-local-20260916-v4`, snapshot `c59890950bd713472896fec801bfce15fd6cb1d5`, material `revision-a8f6d34cc12700d9e431af908308dd9ba4990b7d926bd1e024aa08e387e6eddd`.
- Public stage run exited `0` at the CLI boundary and authenticated the outcome after the worktree-input snapshot mismatch was corrected. Its result remains `status=in_progress`, `quality_status=incomplete`; implementation/test facts, integration review, acceptance execution, and stage-end semantic coverage are incomplete or unavailable. The generated stage-end analyzer fact is `material_incomplete`, not a pass.
- Reflection is an honest availability fact: `unavailable`, reason `executor_absent`, no synthetic six-block judgment. The current non-authoritative handoff is the external canonical file `quality/evidence/handoff/build-code.md`; its final readback is authoritative for the current hash and snapshot. Its next action remains to continue current build-code because the external Stage Agent outcome is unavailable.
- No external repository acceptance, commit, push, archive, close, or browser QA was performed; `non_ui` remains applicable and external-repo facts remain unknown/outside pass.

## Same-task final integration-review repair

- The first live integration-subject construction failed with `MATERIAL_INCOMPLETE: T014 evidence is not JSON: quality/tests/output/build-code-p7-remote-cleanup.output`. The task card legitimately lists both a structured receipt and its raw output; the consumer was incorrectly treating both as JSON evidence.
- RED: `npx vitest run tests/contract/integration-review-subject.test.mjs --poolOptions.forks.singleFork --no-fileParallelism` exit `1`, 8 passed / 1 failed at the new raw-output assertion.
- GREEN: the same command exit `0`, 9/9. The parser now excludes only the raw test-output namespace from structured bindings, keeps receipt binding unchanged, and marks a raw-only evidence list as incomplete instead of throwing. No upstream material authoring change was made.
- This repair invalidated prior current-snapshot implementation/test receipts; recapture them before the single required final integration review. The previous P7 phase review is not rerun.

# Build-code Phase P7 Card

- Goal: close the remaining authorized cleanup, handoff, local-runtime ergonomics, reflection compatibility, and final aggregate seams without creating a new status authority.
- Scope: remote task-branch deletion only after explicit authorization; truthful failed-delete/known-gap projection; seven-group deferred handoff material; local stage outcome wrapper; future-material `not_applicable`; reflection compatibility; one final aggregate.
- Primary files: `core/task-close.mjs`, `runtime/task/task-store.mjs`, `runtime/review/current-close-projection.mjs`, `tools/host/workflowhub-local-stage-runner.mjs`, the explicitly planned skills/docs/capture files, and their listed contract tests. `specs/workflowhub-mechanism-waste-reduction-20260915/decision-log.md` remains read-only.
- External planned artifact: `/Users/Hugh/Downloads/workflowhub-deferred-items-20260915.md`; modify only according to the current plan's seven-group handoff contract and register the same path in close summary.
- Test route: feature / backend-testing; deterministic fixtures and targeted Vitest only; current spec is `non_ui`, so browser QA is not applicable.
- T013/T014 oracle: `ORACLE-REMOTE-CLEANUP` — no remote delete without the canonical authorization; authorized delete, failed delete, recovery facts, and external known gaps remain readable.
- T015/T016 oracle: `ORACLE-RUNTIME-HANDOFF` — interaction publication, missing-input diagnosis, future-material N/A, local outcome, and reflection fields retain truthful semantics.
- T017 oracle: `ORACLE-FINAL` — execute the exact aggregate command once; report applicable coverage and remaining unknown/unavailable facts without turning quality into a permit.
- Stop conditions: new public command/schema/store/control plane, decision-log mutation, missing authorization, an external path unavailable without a truthful fallback, or a final aggregate failure requiring a new decision.
- Required handoff: T013–T017 commands/exits, receipts, actual file changes, AC mapping, review fact/dispositions, external-artifact/readback facts, final aggregate, and explicit no-commit/no-close boundary.

## Execution order

1. Run T013 RED; inspect target assertion rather than setup failure.
2. Implement T014 and run the same T013 command GREEN; capture the public test receipt.
3. Run T015 RED over the three named contract files; implement T016 within the exact plan boundary; run the same command GREEN.
4. Capture the public T016 receipt, submit one P7 phase review, and disposition only evidenced findings.
5. Run T017 exact aggregate once, capture its receipt, then perform stage-end analysis/reflection/handoff facts.

## Status

- `integration_review_repair_in_progress` — T013–T017 completed; the final integration-subject parser received a same-task RED/GREEN repair, so current implementation/test evidence and the required integration review must be refreshed. No delivery action performed.

## Current execution facts

- T013 RED: exact remote-cleanup command exited `1` with 3 target assertion failures and 1 negative-path pass; see `apply/evidence/T013.stdout`.
- T014 GREEN: the same command exited `0`, 4/4; public receipt `quality/tests/build-code-p7-remote-cleanup.json`, receipt hash `634ff220af6e970ff966f72ea62819e936ac6bbd4ecb6e7ab97b407a162b26a0`, snapshot tree `9445dfc9e83f7f6daef25472fc1eec79cda2e0c6`.
- T015 RED: the exact three-file runtime command exited `1`, with only the intended local-wrapper, missing-input, and reflection-field failures; see `apply/evidence/T015.stdout`.
- T016 GREEN: the exact three-file runtime command exited `0`, 3 files / 62 tests in the public capture; receipt `quality/tests/build-code-p7-runtime-handoff.json`, receipt hash `9b6e2d8216328b1ab80e7c3be42097bcc8cdadbae60837ea17bd969643599dc4`.
- P7 phase review: attempt `quality/reviews/attempts/281934a1-58af-5323-af55-99f57bd2e111/attempt.json`, result `quality/reviews/results/build-code-simple-281934a1-58af-5323-af55-99f57bd2e111.json`, report `quality/reviews/reports/build-code-simple-281934a1-58af-5323-af55-99f57bd2e111.md`; terminal `semantic`, Kimi empty, Codex returned five actionable findings. All five were repaired in the current worktree: eligible quorum counting, supplement schema/identity/anchor validation, running/publication envelope and local running preservation, authenticated retry change binding, and explicit future-material inventory. No phase-review rerun; final aggregate is the next bounded verification.
- P7 also updates `/Users/Hugh/Downloads/workflowhub-deferred-items-20260915.md`; the file was read back with the seven `DEF-01`–`DEF-07` groups and the P7 delivery-registration section intact.
- Deliberate non-change: `runtime/task/task-store.mjs` keeps the existing frozen five close-action rows; remote deletion is nested in the existing cleanup action, so no second close control plane was created.
- No commit, push, merge, archive, or physical close was performed.

## T017 and stage-end facts

- T017 public final aggregate: exit `0`, 13 files / 164 tests; receipt `quality/tests/build-code-p7-final-aggregate.json`, receipt hash `7609297785dd5fa6c022a7576532fa78b0cb15ef308aa56a9950fd9512f5eaf1`, output hash `a6a2b3e3c29b8b3f346fae512a06435baf33e69b25ef8fe17bde707f02fdf4f5`.
- Local bridge outcome: `quality/evidence/stage-outcomes/build-code/7ca353af39b99dc5b3b379e507229560569cf1c27c9f97178f18db06f6eaca29.json`, hash `7ca353af39b99dc5b3b379e507229560569cf1c27c9f97178f18db06f6eaca29`, `status=unavailable`, attempt `build-code-local-20260916-v4`, snapshot `c59890950bd713472896fec801bfce15fd6cb1d5`, material `revision-a8f6d34cc12700d9e431af908308dd9ba4990b7d926bd1e024aa08e387e6eddd`.
- Public `run --action=execute` authenticated that outcome and exited `0`; runtime result is `in_progress` / `quality=incomplete`, with missing implementation/test/integration/acceptance facts preserved. Stage-end analyzer reported `material_incomplete`; reflection availability is `unavailable` with `executor_absent`, not a synthesized judgment.
- Current handoff: `quality/evidence/handoff/build-code.md`（以外部 canonical readback 为准，不在 planning 中重复 hash）。The first public run's worktree-input snapshot mismatch was corrected with an external input file and a fresh outcome; no tests or reviews were rerun.

## Same-task integration-review repair

- Live RED: `integration-review-subject.test.mjs` failed because `quality/tests/output/build-code-p7-remote-cleanup.output` was parsed as JSON evidence.
- GREEN: same targeted file now passes 9/9 after filtering raw test-output refs from structured task evidence; structured receipt validation remains fail-closed.
- This is a consumer repair needed to construct the required current `build-code/integration` review packet. Re-capture implementation and final aggregate receipts after this worktree change, then submit exactly one current integration review; do not rerun the P7 phase review.

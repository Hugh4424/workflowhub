# Build-code Phase P4 Card

- Goal: consume the existing v3 publication metadata and attach late member results without mutating the immutable initial conclusion.
- Allowed files: skills/wh-review/scripts/review-provider-client.mjs, skills/wh-review/scripts/simple-review-runner.mjs, tests/contract/external-supplement-window.test.mjs.
- Covered ACs: AC-EXT-004, AC-EXT-005, AC-EXT-006 on the WorkflowHub consumer side; external formal acceptance remains outside this task and unknown.
- Non-goals: no task-store writer, no second aggregation/disposition surface, no external-repository edits, no browser/live provider calls, no wall-clock provider cancellation.
- Contract: extend workflowhub-result.v3 with publication metadata and supplements; published_at is the sole window origin; arrival_elapsed_ms < 600000 is in-window and >= 600000 is over_window_unjudged.
- Immutability: registerReviewSupplement returns a new result, retains the initial bytes/fields, appends exactly one immutable supplement, and only in-window findings enter the result aggregation.
- Test route: feature / backend-testing; deterministic fixed-clock fixtures only; non_ui.
- RED oracle: publication metadata is rejected or dropped, a late result mutates/overwrites initial findings, or the 599999/600000 boundary is wrong.
- GREEN oracle: published_at/running_member_count/append_window are preserved; 599999 creates an in-window supplement whose findings are aggregated; 600000 creates an over_window_unjudged fact without entering findings; duplicate supplement registration is idempotent.
- Stop conditions: supplement identity cannot be tied to one initial result, the v3 extension requires a second protocol/schema, or the current task-store must be changed to make the pure consumer test pass.
- Required handoff: exact publication/supplement fields, boundary result, immutability proof, RED/GREEN exits, canonical receipt, review fact/disposition, and external unknown boundary recorded in T007/T008.

## Execution

- T007 RED: `npx vitest run tests/contract/external-supplement-window.test.mjs --poolOptions.forks.singleFork --no-fileParallelism` exited `1` at the intended parser/writer/runner assertions; setup and command were valid.
- T008 GREEN: the same targeted gate exited `0` (`1 file / 3 tests`). The public verify capture is `quality/tests/build-code-p4-external-supplement-v2.json`, SHA-256 `dded4081cfe562c9e2cd93ca516dffeb228b20723adb840cccc71e0652a161a8`.
- Boundary proof: `published_at=1000`; `arrival_elapsed_ms=599999` appends and aggregates one supplement, while `600000` records `over_window_unjudged` without changing findings. Initial result bytes remain unchanged and duplicate registration is idempotent.
- Phase review: attempt `14b5ab76-ace4-5006-a455-a0b414d5f629` is `unavailable` with `REVIEW_WAIT_EXCEEDED`; `provider_attempts` is empty. No semantic finding or disposition exists; quality coverage remains `incomplete`.
- External formal acceptance, external repository edits, commit, push, close, and browser QA are outside this phase (`non_ui`).

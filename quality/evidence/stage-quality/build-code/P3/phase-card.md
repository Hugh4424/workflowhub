# CARD-04 build-code P3 Phase Card

- Goal: prove the post cohort material check narrowing fixes early authoring stages while preserving later-stage missing-material failure.
- Task and AC: T005 supports AC-18/19, including the existing G-2 repair obligation. The sample-task AC limits remain as stated in `spec.md` Appendix A.
- Production write set: none for this Phase; the prior `tools/cli/stage-runtime.mjs` +6/-1 change is the implementation under test. Freeze `tests/contract/stage-runtime-material-check.test.mjs` bytes and do not edit the test or swap the shared dirty worktree.
- Route: focused contract test in an isolated checkout at current HEAD for target RED, with identical frozen test bytes and matched dependencies; then the same command in the current task worktree for GREEN. Exact command: `npx vitest run tests/contract/stage-runtime-material-check.test.mjs`.
- RED oracle: two early-stage post cases fail their target no-throw assertions, while two later-stage guard cases remain positive; import/setup errors and zero collection are invalid RED. GREEN oracle: four tests pass on the current task worktree. Record test SHA, source SHA, cwd, HEAD/tree, Node/Vitest versions, stdout/stderr and exit for both.
- STOP: test-byte mismatch, unavailable matched dependencies, invalid RED, or current GREEN with weakened late-stage guard. Preserve G-2/unknown rather than treating environment failure as target RED.
- Review: one independent P3 Phase OCR review of the bound actual diff and formal test receipt; disposition findings. Then report supported behavior, AC limits, and next Task.

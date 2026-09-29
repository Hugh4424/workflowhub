# CARD-04 build-code P4 Phase Card

- Goal: connect real source, decision, FR, bound evidence and coverage-limit facts into post build-code acceptanceChain rows, preserving CARD-05 task IDs and review ownership.
- Task and AC: T006, FR-18/21 and AC-18/21; document and CLI evidence remain separate from full functional acceptance.
- Allowed implementation files: `runtime/stage/stage-runner.mjs` acceptanceChain construction and exported `buildPostAcceptanceChainRows`; `vitest.config.mjs` include only if needed. Frozen `runtime/stage/stage-runner.test.mjs` is read-only.
- Route: `test-routing-advisor` against actual runtime/config changes; `backend-testing` for focused module and error-path tests. First prove target RED with `npx vitest run runtime/stage/stage-runner.test.mjs` after include is verified; implement and rerun the exact command for five GREEN tests. Capture syntax, include diff, and a meaningful negative control that fails when a source ID is removed, then restore and recheck.
- Compatibility: no changes to `validateStageSpecAnalyzeProfile`, `runtime/stage/stage-content-contracts.mjs`, `tools/cli/stage-runtime.mjs`, frozen tests, task ID producer, or review ref producer. Missing mappings and refs remain empty with specific coverage limits.
- STOP: test collection/import failure masquerading as RED, changed oracle, altered task IDs/review ref, validator edit requirement, or negative control that stays green. Report upstream ownership instead of widening the write set.
- Review: once implementation and evidence are stable, one independent P4 OCR Phase review and explicit finding dispositions. No edits during OCR dispatch; keep its snapshot stable.
- Handoff: report affected behavior and current consumer, actual command/exit/count, AC and full-flow limits, review outcome, findings, and next Phase.

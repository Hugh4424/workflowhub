# CARD-04 build-code P5 Phase Card

- Goal: provide a truthful, reusable stage-end report facts layer and renderer. T008's intermediate real-source checkpoint remains a separate source/provenance task; P13 owns the final all-Phase report.
- Task/AC: T007 (FR-20/21, AC-20/21) implements module exports; T008 (FR-21, AC-21) requires authenticated single-source capture and three intermediate artifacts only after source design and independent review.
- T007 write set: `runtime/stage/stage-end-report.mjs` only. Frozen `runtime/stage/stage-end-report.test.mjs` is read-only. No edits to `stage-handoff.mjs`, `stage-runner.mjs`, `stage-content-contracts.mjs`, CLI, or dependencies.
- T007 route: verify current stub target RED using `npx vitest run runtime/stage/stage-end-report.test.mjs` with eight tests collected; use `test-routing-advisor` and `backend-testing` for actual changed files; implement three specified exports and exact failure semantics; run same GREEN, a meaningful negative control, and module syntax. Preserve actual runner output and test identity.
- T008 STOP: do not fabricate `report-facts.json`, `report.md`, or `T008-delivery.txt`. First prove current canonical CLI source, task/worktree identity, single run, exact snapshot and output ref/hash, and have the capture/provenance design independently reviewed. If no authentic consumer/source is available, record `not_done/G2` and owner; never convert a three-file existence check into acceptance.
- Review: one independent P5 OCR Phase review after the stable implementation and real evidence; disposition findings. No worktree mutation during dispatch.
- Handoff: report T007 test layer/result, T008 source status, AC limits, OCR/fallback result, findings, next Task; T007 GREEN alone does not make P5 done.

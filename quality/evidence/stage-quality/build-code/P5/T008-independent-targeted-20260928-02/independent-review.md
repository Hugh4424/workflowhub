# P5/T008 independent targeted review — 2026-09-28

Scope: current P5.md, same-run writer in `runtime/stage/stage-runner.mjs`, reader in `runtime/evidence/freshness.mjs`, and `tests/contract/p5-same-run-report-source.test.mjs`. Read-only review; no production, test, or material changes. Branch and HEAD are in `branch.txt` and `head.txt`. Source hashes are in `source-sha256.txt`; a post-run recheck matched all six hashes. Raw command, stdout, stderr, and exit code are adjacent.

Targeted test: 18 total; 12 passed, 6 skipped; exit 0. This establishes the available negative controls for no formal report, wrong/stale sources, and stage-row failure. It does not establish a real P5 positive report.

Findings:

1. `stage-runner.mjs:4550-4553` has `p5HumanExceptionFromDecisionLog()` unconditionally return `null`; `:4620-4621` therefore always exits before source/certificate/three-file publication. The current writer cannot publish an authenticated P5 report.
2. `freshness.mjs:1147-1150` unconditionally returns `missing` even after all prior readback checks. The reader cannot return `authenticated: true` for a positive P5 report.
3. Six positive or failure-recovery cases are skipped in the targeted file at lines 314, 348, 365, 403 (two parameterized cases), and 434. These include current P5 positive, source conflict, preservation, interrupted writes, and retry. Their behavior is unproven.
4. The fixed P5 files `report-facts.json`, `report.md`, and `T008-delivery.txt` were absent at review time. The exact current CARD04 P5 report has not been produced. P5.md explicitly says T008 remains not done; this review agrees.
5. The P5 material names P6 and P13 consumers, but current text search found `authenticateP5StageEndReport()` usage in P13 and a P1 negative E2E only. P6 positive consumption has no direct call or proving test in the inspected paths.

The initial attempt in the sibling `T008-independent-targeted-20260928-01` directory exited 127 because this worktree has no local `node_modules/.bin/vitest`. The successful run used the main repository's installed Vitest binary against the worktree's exact test file; it did not change source files. Neither run is a formal phase approval or same-run report source.

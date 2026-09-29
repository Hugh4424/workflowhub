# CARD-04 build-code P2 Phase Card

- Goal: make the published `formal_test_lines` budget equal the current read-only `buildReport()` measurement and disclose its calculation and write-side-effect boundary.
- Task: T004, local complexity-baseline obligation; it does not satisfy AC-20.
- Allowed production edit: only `docs/architecture/complexity-baseline.json` → `budgets.formal_test_lines`. The prewritten `tests/contract/repository-inventory.test.mjs` is a frozen test input; `tools/architecture/complexity-report.mjs` is read-only for this task.
- Actual change route: simple data correction with a focused contract test; verify the computed value through the real `buildReport()` export without running the side-effectful CLI default path. Preserve the original RED and capture same-command GREEN. Record drift if tracked test content changes later.
- Command: `npx vitest run tests/contract/repository-inventory.test.mjs -t "complexity baseline"`; expected target RED is old published value against current measurement; expected GREEN is one selected test passing with `actual`, `delta_from_target`, `within_limit`, and `caliber` consistent.
- STOP: if measured value differs from planned 83996, identify the changed tracked-test source first. Never change the frozen assertion to force GREEN. Do not touch other budget keys.
- Review: one independent P2 Phase OCR review after a formal current-snapshot test receipt; disposition every finding. Unavailable review is retained as a quality limit and does not block subsequent safe repair.
- Handoff: data before/after, exact test count and exit, computation and consumer checks, review outcome, limitations, and next Phase.

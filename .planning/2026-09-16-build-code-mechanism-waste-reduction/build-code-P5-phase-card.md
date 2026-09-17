# Build-code Phase P5 Card

- Goal: make every formal write identity-bound to the task id, canonical task path, current Git worktree root, and authenticated task workspace; keep read-only status/diagnostics available; close the first make-decision bootstrap exception after one transaction.
- Allowed files: `tools/cli/stage-runtime.mjs`, `tools/cli/task-close.mjs`, `tools/cli/task-bootstrap.mjs`, `tools/host/workflowhub-stage-agent-bridge.mjs`, `tools/architecture/public-behavior-baseline.mjs`, `tools/architecture/clean-install.mjs`, `tests/contract/write-identity-workspace.test.mjs`.
- Covered AC: `AC-IDENT-001` / `FR-IDENT-001`.
- Non-goals: no new public command, no new persistent bootstrap object, no changes to read-only command semantics, no changes to the task-store schema, no external repository edits, no browser QA.
- Contract: before a formal write, compare the caller's task id/path with the canonical resolver and compare the current Git worktree root with the authenticated task workspace; any mismatch fails before the target bytes are written. Derived bridge/runner calls carry the same four-part identity and cannot replace it with explicit foreign values.
- Bootstrap: only the existing task-bootstrap creation transaction may write the initial make-decision workspace; it records `task_id`, triggering `command`, and creation result in the existing `identity/executions` namespace, then closes. Later invocations cannot reuse that exception.
- Test route: feature / backend-testing; deterministic temporary Git/task fixtures only; no live service; `non_ui`.
- RED oracle: a wrong task/path/root or child bridge can reach a writer, a bootstrap exception can be reused, or `doctor/status` is blocked by the write guard.
- GREEN oracle: exact identity writes, all three mismatches and child bypass fail before bytes; the bootstrap record is read back and no extra bootstrap object appears; read-only diagnostics remain callable.
- Stop conditions: the requirement needs a new persistent object or task-store schema, a read-only command must write to stay usable, or identity cannot be checked before a byte-producing call.
- Required handoff: eight scenario results, before/after bytes, bootstrap execution record fields and object inventory, child propagation, RED/GREEN exits, canonical receipt, phase review fact/disposition, and remaining limits recorded in T009/T010.

## Execution

- T009 RED: `npx vitest run tests/contract/write-identity-workspace.test.mjs --poolOptions.forks.singleFork --no-fileParallelism` exited `1` at the intended wrong-worktree, foreign-bridge, and missing-bootstrap-record assertions; evidence `apply/evidence/T009.stdout`.
- T010 GREEN: the same targeted gate exited `0` (`1 file / 3 tests`). Public verify capture `quality/tests/build-code-p5-write-identity.json` has receipt hash `dc0bab8c6be4e3ef6ca2fd0d0ee3ec0330eafe915b6fc9b4c416ea0b6a100e70`; evidence `apply/evidence/T010.stdout`.
- Identity proof: correct worktree artifact write succeeds; wrong current Git worktree, foreign task path, foreign workspace root, and foreign task id fail before outcome/artifact bytes; status remains callable. New bootstrap records `task_id`, `command`, `creation_result`, and `transaction.status=closed` in `identity/executions/bootstrap-*.json`; existing bootstrap replay leaves the bytes unchanged and creates no `bootstrap.json` object.
- Regression evidence: bridge/bootstrap/doctor/status/close targeted suite `4 files / 27 tests` passed; public behavior baseline `10 passed / 1 skipped`; installed clean-install doctor/status and five-stage probes each passed.
- Phase review: attempt `b429f86f-8a10-511e-a2c5-14500c402b03`, result `quality/reviews/results/build-code-simple-b429f86f-8a10-511e-a2c5-14500c402b03.json`, report `quality/reviews/reports/build-code-simple-b429f86f-8a10-511e-a2c5-14500c402b03.md`; terminal `semantic`, Kimi completed with empty findings, Codex failed `EVIDENCE_ANCHOR_INVALID`. No semantic finding to disposition; provider failure is retained and does not become a pass claim.
- External repository, commit, push, close, and browser QA remain outside scope (`non_ui`).

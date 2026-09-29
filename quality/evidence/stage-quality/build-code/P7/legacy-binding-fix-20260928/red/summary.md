# P7 legacy binding targeted RED

- Command: `npx vitest run tests/contract/acceptance-execution-tier.test.mjs -t 'publishes the acceptance execution aggregate for the implementation/tests receipt branch'`
- Worktree, HEAD, UTC start/end, P7/index/test/production SHA-256: `run.json`
- Exact process output: `stdout.bin`, `stderr.bin`; process exit: `1`
- Collection/selection: one test file, 84 collected; one selected and failed, 83 skipped. Failed identity: `P3 T009 real command and service acceptance > publishes the acceptance execution aggregate for the implementation/tests receipt branch`.
- Failure: `runtime acceptance evidence binding mismatch` at `runtime/stage/stage-handlers.mjs:1755`, reached from `acceptanceCoverageForExecution` during `runOfficialStage`. This is the intended real runtime binding conflict: the production `executePrivateAcceptance` still has the `legacyStageOutcome` branch and puts the old outcome ref/hash on newly executed leaves, while the aggregate expects the current session binding. It is not a fixture/import error or a zero-test run.
- The target test retains implementation, tests, and legacy stage outcome receipts and now asserts current-session identity on both AC leaves, their canonical readback, and child-command execution. The test fails before the new assertions because production rejects the conflicting leaf binding. No production code, task facts, or phase material changed in this RED step.

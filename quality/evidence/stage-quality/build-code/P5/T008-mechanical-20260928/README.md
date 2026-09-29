# P5/T008 mechanical declaration wiring, 2026-09-28

Scope: only `runtime/stage/stage-runner.mjs`, `runtime/evidence/freshness.mjs`, and `tests/contract/p5-same-run-report-source.test.mjs` changed. This evidence is local and does not claim P5 or CARD-04 completion.

- `test-before.mjs` and `before-sha256.txt` preserve the original local test bytes and three-file hashes before this edit.
- First test invocation could not start because this worktree's `node_modules` contained only `.vite`. `dependency-setup.txt` records the temporary link to the main checkout's installed packages. Each subsequent command used a shell EXIT trap to restore the original directory; no dependency was installed or modified.
- `red.txt`/`red-exit.txt`: the new scoped test failed with `parseP5HumanExceptionDeclaration is not a function` (exit 1).
- `green-focused.txt`/`green-focused-exit.txt`: parser scope and index checks passed (1 passed, exit 0).
- `green-target.txt`/`green-target-exit.txt`: P5 same-run report source target passed (13 passed, 6 historical skips, exit 0). The skips require an independently confirmed human source and remain unresolved.
- `green-six-field.txt`/`green-six-field-exit.txt`: added assertion that T007 receives all six fields and renders the declared verbatim text; focused test passed (1 passed, exit 0).
- `adjacent-t007.txt`/`adjacent-t007-exit.txt`: T007 converter suite passed (55 passed, exit 0).
- `node --check` for all three touched source/test files and `git diff --check` for the two tracked files succeeded.

The parser checks one declaration, nonblank fields, every explicitly named AC against the same-run chain, and a current indexed Phase at or after P5. It derives the material source path and hash. Writer and reader now pass the six fields to T007. Publication remains disabled because no independently verifiable user confirmation source is available; the current Task has no such declaration. No formal report or Task fact was written by this change.

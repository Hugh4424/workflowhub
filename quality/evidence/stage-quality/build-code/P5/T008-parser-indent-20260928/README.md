# P5/T008 indented heading parser check

Scope: `runtime/evidence/freshness.mjs` and `tests/contract/p5-same-run-report-source.test.mjs` only. No formal report or Task fact was written.

- `frozen-before-sha256.txt` records the old two-line parser with the final test source frozen. `red-frozen.txt`/`.exit`: exit 1, all nine 1/2/3-space cases fail. The output also contains a Vitest WebSocket port warning; the nine assertion failures are explicit.
- `after-sha256.txt` records the two-line parser fix with the same final test source. `green-parser-clean.txt`/`.exit`: exit 0, ten targeted cases pass, including four spaces not being a heading. No port warning in this output.
- `green-adjacent.txt`/`.exit`: exit 0, 56 report tests passed before concurrent T007 test edits; no port warning.
- `green-target.txt`/`.exit`: exit 0, 25 passed and six historical skips, but it has a port warning, so it is not a clean complete-suite result.
- `green-target-isolated.txt`/`.exit`: exit 1. During this run, concurrent T007 work added four failing assertions to the nested report test (60 tests instead of 56), and nested Vitest had a port conflict. The whole P5 target is **not green** on the final tree; rerun serially after T007 is stable.

Initial `red.txt`, `green-focused.txt`, and `green-focused-isolated.txt` are exploratory runs made before the fixture index was corrected. They are retained as raw output but are not the frozen RED/GREEN pair.

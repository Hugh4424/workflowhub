# P10/T021 stage row identity: independent bounded review

Scope: read only review of `runtime/stage/stage-runner.mjs` around `withStageRow`, the existing `writeStageRow` writer in `runtime/task/task-store.mjs`, the targeted `ORACLE-P10-T021` test, and its corrected raw RED/GREEN output. This is a review of the local row identity carrier, not of P10 completion or receipt consumption.

Verdict: **no blocking issue in the local row identity carrier**. The actual T021 receipt binding remains **unverified**; the test explicitly observes no test quality fact tied to its supplied receipt and no `p10_consumption_evidence`.

Evidence:

- `writeStageRow` serializes the validated final row as `JSON.stringify(row) + "\\n"`, atomically replaces its stage line in `facts.jsonl`, and returns `{ action, ref, sha256, value }` computed from those exact line bytes. The new `withStageRow` returns that actual writer value, rather than reconstructing a row identity from input or a provisional read.
- A handoff stage writes a pending row first and then returns the result of the second, final `withStageRow` call. If the second write fails, the returned result has `stage_row_error` and no `stage_row_write`; the pending row cannot be misrepresented as final by this carrier.
- `stage_row_write` is non-enumerable on the frozen in-process reflection result. It is absent from `Object.keys`, JSON output, and the frozen stage-row schema. The targeted test checks these boundaries.
- The valid targeted test failed before the carrier change (`red-valid-stage-row.txt`: 1 failed, 53 skipped) and passed after it (`green-valid-stage-row.txt`: 1 passed, 53 skipped). In the valid RED, the final row and handoff were published, `stage_row_error` was absent, and only `stage_row_write` was missing. The test recomputes SHA-256 from the current JSONL line including its newline, then runs another official stage and checks that the old hash differs from the replacement line. This proves old identity cannot validate the changed row bytes; a future reader must still re-read and compare the hash. The earlier `red-stage-row.txt` used an incomplete fixture and is **not** relied on as RED evidence.
- Existing `stage_row_error` handling returns a nonzero CLI exit (`tools/cli/stage-runtime.mjs`) and integration coverage checks a failed write. This T021 change preserves that error path; the local T021 test itself does not inject a write failure.

Remaining boundary: no current reader has authenticated the supplied receipt, its output, matching test quality fact, and per-acceptance-criterion source in one official run. The targeted GREEN therefore supports only this row identity substep. P10 remains incomplete. The broader `stage-runner.mjs` diff is outside this local verdict.

Final readback on this substep: handoff and raw output hashes match the handoff ledger (`red-valid-stage-row.txt` `e2ae9c204c03998530cd6bba60fb1510bdb2b208072ae4b21c5627b111d7ad71`; `green-valid-stage-row.txt` `a1c0a4802cd5a78539978569d2550328f5658809b6875feeba7432fd808670ad`). The current source hashes also match its `stage-runner.mjs` and targeted test entries. `git diff --check` reported no whitespace error. The separate behavior-fingerprint attempt failed when actual implementation and fixed test receipts were supplied; it is a real unresolved next step, not a successful consumption proof.

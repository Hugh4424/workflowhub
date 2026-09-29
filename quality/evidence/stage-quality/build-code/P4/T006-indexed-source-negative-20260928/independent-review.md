# P4/T006 indexed source negative control: independent read-only review

Reviewed 2026-09-28 against the current CARD-04 task worktree. This review did not edit source, tests, materials, or task facts, and did not run broad tests.

## Verdict

The corrected negative control is valid for its narrow claim. The new test reads the current `decision-log.md` source census and `spec.md` mapping, requires AC-29 to carry the six `U-006-01..06` IDs, and separately requires an unmapped AC-18 to remain empty with disclosure. In an isolated repository copy, changing only AC-29's returned `source_ids` to `[]` caused the target assertion to fail (exit 1, one collected failing test). Restoring the original production bytes made the same target pass (exit 0, one collected passing test). The worktree target then passed 1/1; the existing nearby suite passed 7/7. The red output is an assertion mismatch at the intended line, not a collection/import/environment error. This supports the P4 Action ⑤ source-ID negative-control obligation; it does not prove the full CLI-to-report integration or finish CARD-04.

## Evidence checked

- `P4.md` Action ⑤ authorizes a separate test and isolated mutation of AC-29 only. `docs/architecture/move-map.json` has an `add` entry for the new test with owner, consumer and deletion condition. File timestamps show the map entry was saved before the new test; this is supporting chronology, not an immutable audit log.
- `before-hashes.txt`, `isolated-hashes.txt`, and current `sha256sum` agree: frozen/current test `76e20fa6...`, original/current production file `38e2a706...`, current materials `01a9cb30...` and `38bc36f7...`. `cmp` confirms the current source and test still match the saved pre-mutation bytes. The isolated copy's restored source/test also match those bytes.
- `mutation.diff` has one production-line change: `source_ids: sourceIds` to `source_ids: acId === "AC-29" ? [] : sourceIds`. The script compares frozen test bytes before RED and after restoration; the post-run isolated hashes match the frozen test. The current mapper derives U/V IDs through the decision-log census and R index, with no validator edit involved in this injection.
- `red-raw.txt`, `green-isolated-raw.txt`, `green-worktree-raw.txt`, and `existing-seven-raw.txt` show the target assertion and the 1/1, 1/1, and 7/7 passes; corresponding exit files are 1, 0, 0, and 0. The first attempt under `invalid-first-attempt/` used an incorrect `.join()` on a string coverage field and stayed red after restoration; it is appropriately retained as an invalid attempt, not counted as the successful control.

## Follow-up / limits

- The isolated copy `/tmp/card04-p4-index.RSDhiX` still exists (about 17 MB) at review time. It contains the restored source/test; the task owner should remove this task-created temporary copy after preserving needed evidence. No project source mutation from the injection was observed.
- The worktree 1/1 run printed `WebSocket server error: Port is already in use` after reporting a pass. Exit was 0 and the target assertion executed, so this is not the reason for the RED or a missing test; the isolated green run had no such line. Keep the raw output visible rather than calling that run entirely clean.
- The evidence does not prove registration order immutably, does not establish a current official Phase review or stage fact, and does not show the real CLI consumer output. Those require separate checks.

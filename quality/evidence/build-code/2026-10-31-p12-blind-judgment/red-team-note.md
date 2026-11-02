# Red-team note — delivery B (green but wrong)

**Sealed from the judge / acceptance run. Do not copy this file into any blind package.**
Delivery B is intentionally wrong; this note records exactly how it fools the supplied gate.

## What I made green

`/tmp/p12-greenbutwrong/deliveries/B/src/stage.mjs` exports `async function stageFor(file)`.
It reads the JSONL file and returns the stage of the **first** row carrying a non-empty
`stage`; if no row carries one it returns a module constant `DEFAULT_STAGE = 'build-code'`.

The supplied gate only asks about fixture `a.jsonl`, which has exactly one row
(`{"task_id":"task-a","stage":"build-code",...}`). First row == last row there, so the gate
is satisfied while the requirement's "last record" rule is never exercised.

## Exact command, output, exit code

Run from `/tmp/p12-greenbutwrong/deliveries/B`:

```console
$ node --test gate/stage.test.mjs
✔ fixture a returns its own stage (1.148375ms)
ℹ tests 1
ℹ suites 0
ℹ pass 1
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 38.411792

exit_code=0
```

Raw capture: `gate-output.txt` (sha256 `4d228f48ad5d80a2afd7f473d0bd01a153de0adf1a37ced962c83ea76db8eb52`),
ending with the literal line `exit_code=0`. Node v24.14.0, macOS. Source sha256
`2477d90b715008fb536efbc0f61371dc5a06149e33fc84b2040acb6fef8777e8`.

## Why it is wrong against the requirement

R-PILOT-001 in `pilot/requirement.md` says:

1. `stageFor(file)` must return the stage of the **last record** of that file.
2. Every task file must be answered from its own content (no filename/test/sample hardcoding).
3. Missing, empty, or last-record-without-`stage` files must **error explicitly**, never
   silently return a default stage.

Delivery B violates (1) and (3):

- It scans file order and returns on the **first** stage-bearing row, not the last record.
  A facts file that records `build-code` and later `review` returns the stale `build-code`.
- If no row has a stage (empty file, or only rows without `stage`), it silently returns
  `"build-code"` instead of throwing. This is exactly the "silent default" the requirement
  forbids; the exported `DEFAULT_STAGE` even advertises the assumption.
- It also returns an earlier row's stage when the **last** record lacks `stage`, where the
  requirement demands an error.

It is not an obvious stub: it really reads and parses the file, honors single-row files
correctly (fixture `b.jsonl` → `"review"`), and throws naturally on a missing path
(`readFile` ENOENT). The bug is a plausible-looking scanning/default policy.

## Which real input exposes it

Any genuine multi-record task facts file whose latest row changes stage, e.g. a task that
has advanced from `build-code` to `review`:

```jsonl
{"task_id":"task-x","stage":"build-code","at":"2026-10-31T00:00:00Z"}
{"task_id":"task-x","stage":"review","at":"2026-10-31T01:00:00Z"}
```

Requirement answer: `"review"`. Delivery B answer: `"build-code"` (wrong).

Also exposed by a real empty facts file or a file whose only/last row has no `stage`:
requirement demands an explicit error; B returns `"build-code"` (wrong).

Reproduction inputs are kept at `deliveries/B/.redteam/` (red-team evidence, not part of
the module or any blind package). Probe run from `/tmp/p12-greenbutwrong/deliveries/B`:

```console
$ node --input-type=module -e 'import { stageFor } from "./src/stage.mjs"; ...'
fixtures/a.jsonl => "build-code"            # gate fixture: accidentally right
fixtures/b.jsonl => "review"                # single row: right
.redteam/last-differs.jsonl => "build-code" # WRONG: last row says review
.redteam/empty.jsonl => "build-code"        # WRONG: must error
.redteam/no-stage.jsonl => "build-code"     # WRONG: must error
.redteam/last-no-stage-after-stage.jsonl => "review"  # WRONG: must error
```

## Acceptance lesson (R-001)

The gate passing proves only that one single-row fixture equals `build-code`. It does not
distinguish "reads the last record" from "returns the first stage or a default", does not
test multi-record files at all, and never asserts the required error behavior. A correct
acceptance check needs a multi-row file where the last stage differs, a second per-file
sample, and negative cases (missing/empty/last-without-stage).

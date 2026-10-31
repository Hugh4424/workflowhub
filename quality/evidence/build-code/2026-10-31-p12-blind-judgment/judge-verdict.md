# Blind verdict — P1 effect row (AC-EFFECT-001)

**Judge:** independent subagent, blind package `/tmp/p12-greenbutwrong/blind`
**Date:** 2026-10-31 (Asia/Shanghai)
**Criterion read:** `standard.md` (AC-EFFECT-001 P1 row + “这一 Phase 怎么验收？”), the verbatim requirement, `X/`, `Y/`, `gate-X.txt`, `gate-Y.txt`, `README.md`.

## 0. Answer

- **Y = real delivery**
- **X = green-but-wrong variant**

One-line reason: **Y returns the stage of the file’s last record and raises an explicit error when the file is empty or the last record has no stage; X returns the first record’s non-empty stage and silently falls back to `build-code`, so it reports a stale stage and hides malformed input. The listed gate uses only a one-row file where every candidate rule agrees, so both exit 0.**

## 1. Requirement being judged (verbatim)

From `requirement.md`, R-PILOT-001:

> 给 `stageFor(file)` 一个任务事实文件（JSONL），它必须返回该文件最后一条记录的 `stage`。
> 任意任务文件都按它自己的内容返回；不得按文件名、测试输入或已知样本写死。
> 文件缺失、为空或最后一条没有 `stage` 时，必须明确报错，不得静默返回某个默认阶段。

Meaning: return the `stage` of the **last** record; never hardcode by filename, test input, or known sample; on a missing file, an empty file, or a last record with no `stage`, raise an **explicit error** and never silently return a default stage.

## 2. Oracle derived from the requirement (label-blind)

What the user must see:

1. Single- or multi-record file → exactly the `stage` value of the **last** record.
2. Empty file → explicit error; no stage value.
3. Last record without `stage` (even if earlier records have one) → explicit error; no stage value.
4. Missing file → explicit error.

Which mistakes must be rejected:

- returning an earlier record’s stage when the last record differs or lacks `stage`;
- returning any default stage (e.g. `build-code`) instead of erroring on empty or malformed input;
- fixture-name or sample-specific behavior (neither delivery does this).

## 3. Labels

| Delivery | Label | Basis |
|---|---|---|
| **X** | **green-but-wrong** | Scans records in order and returns the **first** non-empty `stage`; falls back to `DEFAULT_STAGE = 'build-code'`. Fails oracle 1 (multi-record), 2 (empty), 3 (last record without stage). Passes the listed gate. |
| **Y** | **real delivery** | Reads the **last** record, requires a non-empty string `stage`, and throws on empty or last-without-stage. Satisfies oracle 1–4. Passes the listed gate. |

X is not a hardcode: it applies a wrong rule generically, and its JSDoc documents the fallback as a convenience for brand-new tasks. That convenience is precisely what R-PILOT-001 forbids (“不得静默返回某个默认阶段”). Y is smaller but implements the stated contract.

Relevant source:

- X, `X/src/stage.mjs:32-40`: `for (const line of text.split('\n')) … if (typeof row.stage === 'string' && row.stage.trim() !== '') return row.stage; … return DEFAULT_STAGE;`
- Y, `Y/src/stage.mjs:5-11`: `const row = JSON.parse(lines[lines.length - 1]); … throw new Error('last task fact has no stage');`

## 4. Control: the listed gate is green for both

Commands:

```sh
cd /tmp/p12-greenbutwrong/blind
(cd X && node --test gate/stage.test.mjs); echo "exit=$?"
(cd Y && node --test gate/stage.test.mjs); echo "exit=$?"
```

Actual output, X:

```text
✔ fixture a returns its own stage (1.171666ms)
ℹ tests 1
ℹ suites 0
ℹ pass 1
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 37.760583
exit=0
```

Actual output, Y:

```text
✔ fixture a returns its own stage (0.459083ms)
ℹ tests 1
ℹ suites 0
ℹ pass 1
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 40.087709
exit=0
```

This reproduces `gate-X.txt` and `gate-Y.txt` (same single test, `pass 1 / fail 0`, exit code 0). The gate file and all three fixtures are byte-identical between X and Y (`diff` produced no output); only `src/stage.mjs` differs.

## 5. User-observable differences (exact input, expected, actual)

### 5.1 Multi-record file — strongest case (`fixtures/c.jsonl`, shipped in both deliveries)

Input (byte-identical in X and Y):

```jsonl
{"task_id":"task-c","stage":"build-code","at":"2026-10-31T02:00:00Z"}
{"task_id":"task-c","stage":"review","at":"2026-10-31T03:00:00Z"}
```

- Expected per R-PILOT-001: `"review"` — it is the last record’s stage.
- X actual: `"build-code"` — the first record’s stage.
- Y actual: `"review"`.

Command actually run:

```sh
cd /tmp/p12-greenbutwrong/blind
for d in X Y; do
  node --input-type=module -e "
    import { stageFor } from './$d/src/stage.mjs';
    try { console.log('RESULT ' + JSON.stringify(await stageFor('./$d/fixtures/c.jsonl'))); }
    catch (e) { console.log('THREW  ' + e.name + ': ' + e.message); }
  "
done
```

Actual output:

```text
### X fixture c (last record stage=review, first=build-code)
RESULT "build-code"

### Y fixture c (last record stage=review, first=build-code)
RESULT "review"
```

**User-observable difference:** a task whose newest fact says `review` is reported as `build-code` by X. Any consumer that branches on the returned stage — a status line, next-stage routing, resume logic — shows or re-enters the wrong stage for exactly the tasks that have progressed. The correct value is present in the file; X returns the stale one.

### 5.2 Empty file

Command (no temp files): `stageFor('/dev/null')` through the same one-liner.

- Expected per R-PILOT-001: explicit error.
- X actual: `RESULT "build-code"` — silent default.
- Y actual: `THREW  Error: task facts file is empty`.

### 5.3 Last record has no `stage`

Input (piped on stdin, no file written):

```jsonl
{"task_id":"task-d","stage":"build-code","at":"2026-10-31T04:00:00Z"}
{"task_id":"task-d","at":"2026-10-31T05:00:00Z"}
```

Command: the same one-liner with `stageFor('/dev/stdin')`.

- Expected per R-PILOT-001: explicit error.
- X actual: `RESULT "build-code"` — earlier record’s stage.
- Y actual: `THREW  Error: last task fact has no stage`.

The single-record no-stage input `{"task_id":"task-e","at":"…"}` gives the same class of result: X `RESULT "build-code"` (default), Y `THREW  Error: last task fact has no stage`.

### 5.4 Missing file (control)

- X: `THREW  Error: ENOENT: no such file or directory, open './X/fixtures/does-not-exist.jsonl'`
- Y: `THREW  Error: ENOENT: no such file or directory, open './Y/fixtures/does-not-exist.jsonl'`

Both satisfy the missing-file clause; this input does not discriminate.

### 5.5 Single record with a stage (gate-like)

`fixtures/b.jsonl` (one row, `stage: "review"`): both X and Y return `"review"`. This confirms the divergence is exactly at multi-record precedence and malformed/empty input, not at ordinary single-row reads.

## 6. Why the listed gate cannot distinguish

- `gate/stage.test.mjs` contains **one test and one input**: `fixtures/a.jsonl`, a single row with `"stage":"build-code"`.
- On that input, all three candidate rules — “first non-empty `stage`”, “last record’s `stage`”, and “silent default `build-code`” — produce `build-code`.
- No test covers two records with different stages, an empty file, or a last record without `stage`; these are the clauses R-PILOT-001 adds.
- Consequently both deliveries print `pass 1 / fail 0` and exit 0. The green-but-wrong variant X violates three requirement clauses while passing **every** listed contract test, gate command, assertion, and regression.
- Exit code 0 therefore certifies only that one sample still works; it cannot certify the requirement was achieved. A gate that added §5.1–§5.3 would fail X and pass Y immediately.

## 7. Did I need the author’s explanation?

**No.** R-PILOT-001 alone gives a mechanical oracle: last record’s stage; explicit error on missing/empty/last-without-stage. The author’s rationale in `standard.md` was not needed to label the deliveries or to name the user-observable difference. No author explanation was received or used.

Integrity / packaging notes:

- I did not read `sealed/`, `deliveries/`, `consumer/`, `judge-prompt.md`, `label.mjs`, `quotes.md`, or `X/.redteam` (empty directory). No label knowledge existed before the judgment.
- **Packaging defect:** `blind/README.md` and the judge prompt reference `requirement.md`, but `blind/` contains no `requirement.md`. I recovered the verbatim original from `../pilot/requirement.md` (header: “原始需求（试点 Phase 的真实需求）”) after listing the top-level directory; that file contains only R-PILOT-001 and R-001, no labels or red-team notes.
- **Sequence note:** because the requirement was missing from the blind package, I inspected the two sources before reading the requirement. The oracle in §2 is derived solely from R-PILOT-001 and is independent of which delivery looked more polished; X in fact carries the more elaborate documentation and would win a style-only comparison.

## 8. What this verdict establishes — and what it does not

- **Blind-judgment layer:** satisfied for this row — both labels correct, reason cites a concrete scenario/input/user-observable difference, the gate’s inability to distinguish is explained, and the green-but-wrong variant passes the listed gate with exit 0.
- **Consumer layer:** **not** observed here. I am the judge, not the Phase’s downstream consumer; no real consumer use and no pre-change baseline are recorded in this document. Per the standard, AC-EFFECT-001 P1 cannot be marked passed on this verdict alone; the consumer observation remains with the named downstream owner.
- **AC-EFFECT-001 overall:** not claimed; other Phase rows and the consumer layer are out of scope.

## 9. Evidence

- Delivery paths: `/tmp/p12-greenbutwrong/blind/X`, `/tmp/p12-greenbutwrong/blind/Y`
- `sha256`:
  - `X/src/stage.mjs` → `2477d90b715008fb536efbc0f61371dc5a06149e33fc84b2040acb6fef8777e8`
  - `Y/src/stage.mjs` → `28b3ff4b80ef19e35fb52ff1d814711e7de9350085f9825cf0bb9d9c9da99e15`
- Gate: `node --test gate/stage.test.mjs` → X `exit=0` (1 pass), Y `exit=0` (1 pass).
- `X/gate/stage.test.mjs` and `Y/gate/stage.test.mjs` are identical; `X/fixtures/*.jsonl` and `Y/fixtures/*.jsonl` are identical.
- Only file written by this judgment: this `verdict.md`. No delivery file was modified.

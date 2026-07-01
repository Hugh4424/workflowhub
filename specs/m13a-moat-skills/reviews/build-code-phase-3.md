# Phase 3 Heterologous 3rd-Party Code Review

**Review scope:** m13a-moat-skills Phase 3 (Stage 2)
**Files reviewed:** 2
- `/Users/Hugh/Hugh/Project/workflowhub/workflows/make-decision/SKILL.md`
- `/Users/Hugh/Hugh/Project/workflowhub/tests/moat-skills-phase3.test.mjs`

**Reviewer:** Independent code-reviewer (separate context from authoring pass)
**Date:** 2026-07-01

---

## Code Review Summary

**Files Reviewed:** 2
**Total Issues:** 5

### By Severity
- CRITICAL: 0
- HIGH: 1
- MEDIUM: 2
- LOW: 2

---

## Stage 1 — Spec Compliance

### AC verification against test suite assertions

Each test assertion is treated as an acceptance criterion. Results:

| AC | Test Assertion | Evidence in SKILL.md | Result |
|---|---|---|---|
| AC-1 | S5 references `skills/intake-decision-review` | Line 289: `` `skills/intake-decision-review/SKILL.md` `` | PASS |
| AC-2 | S7 references `skills/grill-with-docs` | Lines 387, 394 | PASS |
| AC-3 | S2 references `skills/talk-with-zhipeng` | Lines 129, 131 | PASS |
| AC-4 | S4 references `skills/talk-with-zhipeng` | Line 180 | PASS |
| AC-5 | S7 references `skills/talk-with-zhipeng` | Line 378 | PASS |
| AC-6 | No `multica-agenthub.*talk` pattern | No match found | PASS |
| AC-7 | No `~/.claude.*talk` pattern | No match found | PASS |
| AC-8 | `TASK_TRACKING_ROOT` declared | Lines 19, 509, 511, 512 | PASS |
| AC-9 | `tracking_root_fallback` mentioned | Lines 19, 512, 530 | PASS |
| AC-10 | S2 contains `推荐` | Line 141 | PASS |
| AC-11 | S2 does not contain `\b(framing\|scope)\b` (case-insensitive) in section | S2 section ends at `---` before line 146; no English `framing` or `scope` in range | PASS |
| AC-12 | S4 contains `推荐` | Line 187 | PASS |
| AC-13 | S4 does not contain `\b(framing\|scope)\b` in section | S4 section ends at `---` on line 196; Phase A/B block (lines 198–264) is outside the extracted range | PASS |
| AC-14 | S9 contains `不确认\|等待确认` | Line 482: `不确认就不继续` | PASS |

**Spec compliance: ALL 14 ACs pass. Stage 1 complete.**

---

## Stage 2 — Code Quality

### Issues

---

[HIGH] Test file: `section()` regex will silently miss sections with renamed headings if heading text changes again
**File:** `/Users/Hugh/Hugh/Project/workflowhub/tests/moat-skills-phase3.test.mjs:15-18`
**Confidence:** HIGH

**Issue:** The `section()` helper builds the regex as `## ${escaped}[\s\S]*?(?=\n---\n|\n## S\d|...)`. It matches `## S2`, `## S4`, `## S5`, `## S7`, `## S9` because those section headings start with `## S<digit>`. However the regex terminator `\n## S\d` uses `\S\d` (capital S then digit) as literal characters — in practice this means it will stop only at headings that begin `## S` followed by a digit (0-9). This is fragile: if a section heading is ever numbered `## S10` or above, the `\d` (single digit) lookahead will fail to stop before it, causing the extracted section text to bleed into the next section. `## S10 decision-log...` at line 491 would not be caught as a stop-boundary by this pattern because `\n## S\d` requires exactly one digit and `S10` has two. If a test ever calls `section(skill, "S9")`, the extracted range will continue past `## S10` all the way to EOF or the next `---` or `## Journal`. Currently the S9 test does call `section(skill, "S9")`, and the section regex will bleed into S10.

**Concrete impact:** `section(skill, "S9")` extracts from line 466 to EOF (no `## S\d` after S10 since S10 is two digits, and there is no trailing `---`). The test for `不確認|等待确認` still passes because the text is in S9 (line 482). But future assertions that check something must NOT be in S9 could get false-negatives because the extracted range includes S10 content.

**Fix:** Change the terminator pattern from `\n## S\\d` to `\n## S\\d+` (one or more digits) to handle all multi-digit stage numbers:
```js
const match = content.match(new RegExp(`## ${escaped}[\\s\\S]*?(?=\\n---\\n|\\n## S\\d+|\\n## Journal|$)`));
```

---

[MEDIUM] Test file: `section()` assertion failure message is not informative enough for CI debugging
**File:** `/Users/Hugh/Hugh/Project/workflowhub/tests/moat-skills-phase3.test.mjs:17`
**Confidence:** HIGH

**Issue:** When `section()` fails, the assertion message is only `Missing section: ${heading}`. This tells the reader the heading string but not what headings actually exist in the file, making CI failure diagnosis slow.

**Fix:** Include available headings in the message:
```js
const available = [...content.matchAll(/^## (.+)$/gm)].map(m => m[1]).join(", ");
assert.ok(match, `Missing section: ${heading}. Available: ${available}`);
```

---

[MEDIUM] SKILL.md: Phase A / Phase B legacy reference block under S4 creates a maintenance trap
**File:** `/Users/Hugh/Hugh/Project/workflowhub/workflows/make-decision/SKILL.md:198-224`
**Confidence:** HIGH

**Issue:** A "legacy reference" block containing English terms (`in-scope`, `out-of-scope`, `scope`, `framing`) sits between S4 and the "Produce stage-result" section (lines 198–264). Currently this block is separated from the S4 section extract by a `---` divider at line 196, so the failing `doesNotMatch(s4, /scope/)` test passes. However, this is a silent correctness dependency: if any future edit removes that `---`, or if the section regex is adjusted, the English `scope` text immediately breaks AC-13. The comment "新流程请以 S0–S10 各节为准" (line 200) acknowledges the block is obsolete.

**Fix:** Remove the Phase A / Phase B legacy reference block entirely (lines 198–224) since its own commentary states the new S0–S10 flow supersedes it. If backward-compat documentation is genuinely needed, move it to a separate `docs/legacy-reference.md` file.

---

[LOW] SKILL.md: `TASK_TRACKING_ROOT` default path uses `~` (tilde) unexpanded in a spec document
**File:** `/Users/Hugh/Hugh/Project/workflowhub/workflows/make-decision/SKILL.md:19,512`
**Confidence:** MEDIUM

**Issue:** The default value is documented as `~/Knowledge/workflowhub/`. When an executing agent performs `mkdir -p ~/Knowledge/workflowhub/`, tilde expansion works in bash. But if the value is read programmatically (e.g., from an env var default in a Node.js script), `~` is not automatically expanded and `fs.mkdir("~/Knowledge/workflowhub/")` will create a literal `~/` directory under cwd.

**Fix:** Either document the full expanded path (e.g., `$HOME/Knowledge/workflowhub/`) and note that agents must expand it, or add an explicit note in the spec that executing agents must apply shell tilde expansion before using the path.

---

[LOW] Test file: `import assert "node:assert/strict"` missing `from` keyword (syntax error in the file on disk)
**File:** `/Users/Hugh/Hugh/Project/workflowhub/tests/moat-skills-phase3.test.mjs:2`
**Confidence:** LOW

**Issue:** The diff shows `import assert "node:assert/strict"` (line 2 in the compressed read output). If this is the actual file content it is a JavaScript syntax error. However, the diff itself shows the correct form `import assert from "node:assert/strict"` on line 3 of the added file. The discrepancy is likely a rendering artifact of the context compression, not a real bug. Flagged at LOW confidence for confirmation.

**Fix:** Verify the actual file contains `import assert from "node:assert/strict"`. If not, add the `from` keyword.

---

## Open Questions (low-confidence findings — surfaced, not blocking)

None.

---

## Positive Observations

- The section-level approach to test assertions (extracting per-stage text before matching) is the right pattern — it prevents cross-stage contamination and gives precise, stage-scoped failure signals.
- Removal of old external references (`multica-agenthub`, `grill-with-docs-lite`) is clean: grep confirms zero residual occurrences.
- The `TASK_TRACKING_ROOT` env-var contract is fully specified in three places (env-var table, S10 execution steps, decision-log env-var record), providing a consistent single source of truth across the skill lifecycle.
- S9 "not-auto-approved" semantics are correctly preserved word-for-word: `不确认就不继续` (line 482) satisfies both the spec requirement and the test regex `不确認|等待确認`.
- AC-13 boundary analysis: the `---` divider at line 196 correctly terminates the S4 section extract before the Phase A legacy block, so the `doesNotMatch(s4, /scope/)` test legitimately passes without any false negative.
- Renaming section headings from English abbreviations (`talk#1`, `talk#2`, `talk#3`, `grill-with-docs-lite`) to descriptive Chinese text improves readability without breaking section extraction, because the test's `section()` helper matches on the opening `## S<n>` prefix, not the full heading.

---

## Recommendation

**COMMENT**

All 14 spec ACs pass. No CRITICAL or HIGH-confidence HIGH-severity issues that block the implementation. The HIGH-severity finding (section regex `\d` vs `\d+`) is a test-code fragility that does not affect any current test result, but will silently produce incorrect section extraction for any future `doesNotMatch` assertion against S9 content. It should be fixed before new negative assertions are added against S9.

The MEDIUM legacy-block finding is a future maintenance trap that should be cleaned up in the next iteration.

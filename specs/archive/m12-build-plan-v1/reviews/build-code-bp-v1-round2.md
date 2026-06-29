# Code Review: build-plan v1 Phase 6 — Round 2 (Re-review after R1 fixes)

**Review ID:** ROUND-2
**Date:** 2026-06-29T10:36:00Z
**Reviewer:** code-reviewer agent
**Source:** same_source (3rd-review heterologous attempt was genuinely unreachable — no codex/gemini cross-engine available in this context)
**Engine:** deepseek-v4-pro
**Scope:** Re-verification of R1 findings B1, B2, B5, B6, B7, B8 claimed fixed; re-confirm F9-honesty and non-regression of R1-passed items.

---

## Stage 1: Spec Compliance — Fix Verification

### B1 [HIGH] — F10 gate ordering:  CLOSED

**R1 finding:** F10 gate (Step 8, heading "apply before finalising") was AFTER human review (Step 7). Spec intent requires F10 before finalization.

**Current state (SKILL.md lines 120-173):**
- Step 7 heading: `### Step 7: F10 anti-over-engineering gate` (line 120). No "(apply before finalising)" text — heading genuinely reflects position.
- Step 8 heading: `### Step 8: 人审检查点 (Human review checkpoint)` (line 135).
- F10 now explicitly precedes human review in the step sequence.
- Line 133: "If F10 removes or materially alters plan/tasks entries: re-execute Steps 2-4 (plan-generate, tasks-generate, cross-artifact-analyze) to keep cross-artifact consistency aligned with the final artifacts before proceeding to human review." — This addresses the stale-artifacts-after-F10 concern.
- Line 139: Human review describes artifacts as "F10-gated" — confirming F10 has been applied.
- All 4 F10 questions preserved verbatim (lines 124-127).
- ~95,000-lines cautionary text preserved (line 131).
- Q1/Q4 rejection rule preserved (line 129).

**Verdict:** F10 genuinely precedes human review. The re-execute rule (line 133) handles stale artifacts. No regressed F10 content. **CLOSED.**

---

### B2 [HIGH] — Human review "MUST pause" vs. "pending is valid" contradiction:  CLOSED

**R1 finding:** Line 16 said "each step must complete / failure = stage failure." Line 120-148 said "MUST pause AND wait" while also saying pending is valid. Contradiction for non-interactive environments.

**Current state (SKILL.md lines 16-18, 147-154):**
- Line 16: "Generation steps (Steps 1-7, 9: plan-generate, tasks-generate, cross-artifact-analyze, constitution check, baseline comparison, F10 gate, file identification) must complete before moving to the next. Failure in any generation step before the stage-result write results in stage failure."
- Line 18: "The human review checkpoint (Step 8) is distinct: in non-interactive environments, on explicit skip, or on timeout, `review.state="pending"` is a valid terminal state — stage-result is produced normally. 'Pending' is NOT a stage failure."
- Lines 149-154: Explicit handling for 4 modes:
  - **Interactive**: prompt and wait for approve/reject/skip
  - **Non-interactive**: record pending immediately, do NOT block indefinitely
  - **Explicit skip**: record pending and continue
  - **Timeout**: record pending and continue
- Line 154: "`review.state="pending"` IS a valid terminal state … 'Pending' is NOT a stage failure."

**Verdict:** The contradiction is resolved. The generation steps (1-7, 9) gate and the human review step (8) operate under distinct, non-conflicting rules. Deterministic resolution for all 4 pause modes. **CLOSED.**

---

### B5 [HIGH, vacuous] — assert.ok(true) for downstream-metric check:  CLOSED

**R1 finding:** Test "does NOT reference build-code/verify-code metrics" contained `assert.ok(true)` — unconditional pass, zero protection.

**Current state (test lines 208-250):**
- Test renamed: "build-plan SKILL.md does NOT claim build-plan/build-code/verify-code metric VALUES as known"
- Extracts Step 6 baseline section by structural boundary (`### Step 6:` to next `### Step`)
- Asserts explicit text: "ALL 5 values are `unknown`" or "ALL 5 values are unknown" (line 219-222)
- Parses the OUTPUT table via regex `|\s*${metric}\s*|\s*([^|]+)\s*|...` and asserts each M12 cell:
  - starts with `"unknown"` (line 241)
  - does NOT start with a digit (line 245) — catches numeric placeholder like `0`, `0.05`, `1.0`
- Covers all 5 metrics in the table: missed_step_rate, test_execution_rate, review_execution_rate, rework_rounds, rework_proxy_count

**Non-vacuousness reasoning:** If anyone replaces an `unknown` M12 value with a numeric value (e.g., `0.05` for `test_execution_rate`), the `startsWith("unknown")` assertion fails. If they replace with a purely numeric placeholder without `unknown` prefix, the `!/^\d/` assertion catches it. This is a genuine structural guard.

**Verdict:** Real assertion replaces vacuous `assert.ok(true)`. Fails on the violations it guards against. **CLOSED.**

---

### B6 [MEDIUM, partial vacuous] — rework_proxy_count alias check:  CLOSED

**R1 finding:** `!content.includes("rework_proxy") || content.includes("rework_proxy_count")` — because "rework_proxy_count" contains "rework_proxy", the test was a no-op for alias detection when the exact name was also present.

**Current state (test lines 120-144):**
- Asserts exact name present: `content.includes("rework_proxy_count")` (line 122)
- Uses word-boundary regex `\brework_proxy\b` to count bare occurrences, asserts `reworkProxyStandalone === 0` (line 128-132)
- Also checks `\bproxy_count\b` standalone occurrences === 0 (line 134-137)
- Also checks `\brework_count\b` standalone occurrences === 0 (line 140-144)

**Non-vacuousness reasoning:** Word-boundary regex `\brework_proxy\b` matches standalone "rework_proxy" (followed by non-word char or string end) but does NOT match "rework_proxy_count" (the boundary is before underscore, but "rework_proxy" followed by "_count" means there's no word boundary after "y" — wait, `\b` is between word and non-word chars. "rework_proxy" in "rework_proxy_count": the `y` is a word char, `_` is a word char too, so no boundary at `_\b`. Actually `\b` matches between word and non-word. `_` is a word char in regex (`\w` = `[a-zA-Z0-9_]`). So `\brework_proxy\b` in "rework_proxy_count" would match at the `y` before `_`? No — `y` and `_` are both word chars, so `\b` does NOT match between them. The regex `\brework_proxy\b` in string "rework_proxy_count" would NOT match because the `y` is followed by `_` (word char), no boundary. But standalone "rework_proxy" followed by space or punctuation would match. So this regex correctly distinguishes alias from part-of-exact-name. ✓

**Verdict:** Word-boundary regex correctly distinguishes standalone "rework_proxy" from "rework_proxy_count". Asserts zero bare occurrences. All 3 alias patterns covered. **CLOSED.**

---

### B7 [MEDIUM, partial vacuous] — "exactly ONE pause marker" allowed 2:  CLOSED

**R1 finding:** Unused `reviewStepCount` variable, `doubleCheckpoint` regex only failed at count > 2, and Chinese-only regex was blind to English checkpoint headings.

**Current state (test lines 289-297):**
- Test: "human review pause marker appears EXACTLY ONE logical checkpoint"
- Uses structural heading match: `/^### Step \d+:.*(?:人审检查点|Human review checkpoint)/gm`
- Asserts `reviewHeadings.length === 1` (line 293)
- Error message includes found headings via `JSON.stringify(reviewHeadings)` (line 295)
- Also covers English "Human review checkpoint" pattern

**Non-vacuousness reasoning:** Would fail with 0 heading (checkpoint removed) or 2+ headings (duplicate checkpoint). The `^` anchor ensures only step headings match, not prose mentions. Bilingual pattern covers both Chinese and English. This is a genuine structural guard.

**Verdict:** Structural heading match with exact count assertion. Bilingual coverage. No unused variables. **CLOSED.**

---

### B8 [MEDIUM, partial vacuous] — "10 core fields" allowed 8/10:  CLOSED

**R1 finding:** `presentCount >= 8` meant test would pass with only 8 of 10 fields present.

**Current state (test lines 498-517):**
- Computes `missingFields = coreFields.filter(f => !content.includes(f))` (line 512)
- Asserts `missingFields.length === 0` (line 513)
- Error message lists which fields are missing: `Missing (${missingFields.length}): ${missingFields.join(", ")}` (line 515)
- All 10 field names listed explicitly at lines 500-510

**Non-vacuousness reasoning:** Would fail if any of the 10 fields is absent from SKILL.md. The diagnostic message makes debugging trivial. This is a genuine structural guard.

**Verdict:** Exact match on all 10 fields with diagnostic listing. **CLOSED.**

---

## Stage 2: F9-Honesty Re-confirmation

All 5 `unknown` reasons remain verbatim from R1 (SKILL.md lines 96-100):

| Metric | Reason | Status |
|---|---|---|
| missed_step_rate | "仅 upstream make-decision/build-spec 两段已完成且已落盘，全五段值待 verify-code 完成后才可计算" | ACCURATE |
| test_execution_rate | "build-plan 阶段无测试执行数据，待 build-code/verify-code" | ACCURATE |
| review_execution_rate | "review 阶段尚未执行" | ACCURATE |
| rework_rounds | "全流程未完成，无返工数据" | ACCURATE |
| rework_proxy_count | "全流程未完成，无代理返工数据" | ACCURATE |

No reference to build-plan's own not-yet-written metrics, no reference to build-code/verify-code metrics. Line 116: "DO NOT reference build-plan's own not-yet-written metrics, nor build-code/verify-code metrics — only upstream data." **F9-honesty: RE-CONFIRMED.**

---

## Stage 3: Non-regression of R1-Passed Items

- **21-clause constitution check** (Steps 5, lines 60-80): 21 clauses, [x]/[ ]+rationale, non-blocking, incomplete-output failure. Intact.
- **Baseline values** (Step 6, lines 86-93): 0.05, 0.8295, 1, 6.075, 25.25 all present. Intact.
- **M6 contract preservation** (lines 209-217): All M6 fields listed + "Do NOT delete or rename any M6 field." Intact.
- **Review object fields** (lines 156-173): state/reviewer/timestamp/decision/notes all documented. Intact.
- **F10 gate content** (lines 122-131): 4 questions + cautionary example verbatim. Intact.
- **Record skeleton / update own result** (lines 221, 238): Both calls documented. Intact.
- **Test suite**: 35/35 tests pass. No regression.

---

## Open Questions (low-confidence findings)

[MEDIUM] B3 (R1) — Stage-result sample contradiction persists (not claimed fixed)
**File:** `workflows/build-plan/SKILL.md`, lines 187, 198-205
**Confidence:** LOW as blocking (MEDIUM severity)
**Issue:** The sample stage-result JSON still hardcodes `"status": "success"` (line 187) and `"reason": "...human review checkpoint cleared."` (line 198), while the embedded review object defaults to pending state with `"decision": "检查点已触达但未获确认"` (line 203). The outer "cleared" contradicts the inner "未获确认" (not confirmed). An implementer copying the sample directly for the pending path would produce a misleading stage-result. This finding was non-blocking in R1 and remains non-blocking.
**Note:** This was R1's B3, not claimed fixed in this round.

[MEDIUM] B9 (R1) — M10 baseline values test uses OR logic (not claimed fixed)
**File:** `tests/m12-build-plan-v1.test.mjs`, line 155-156
**Issue:** `hasBaselineRef || hasM10Values` — test passes if reference exists OR values exist, not requiring both.

[LOW] B10 (R1) — Duplicate expression at line 444 (not claimed fixed)
[LOW] B11 (R1) — Threshold test: OR instead of AND (not claimed fixed)
[LOW] B12 (R1) — No test for Step 1 fail-loud (not claimed fixed)

---

## New Findings

No new findings introduced by the fixes. The reorder of F10 before human review introduced no regressions. The F10 re-execute rule (line 133) correctly handles the stale-artifact concern. All 35 tests pass.

---

## Verdict: APPROVE

All 3 R1 blocking findings (B1 HIGH, B2 HIGH, B5 blocking-vacuous) are CLOSED at HIGH confidence. All 4 vacuous/weakened test findings (B5, B6, B7, B8) are CLOSED — each now contains a genuinely non-vacuous assertion. F9-honesty re-confirmed. No new blocking issues. 35/35 tests pass. No regression of R1-passed items.

Remaining open items (B3, B4, B9, B10, B11, B12) are non-blocking MEDIUM/LOW severity, not claimed fixed in this round, and do not gate APPROVE.

---

## Summary

| Finding | Severity | Status |
|---|---|---|
| B1 — F10 gate ordering | HIGH | **CLOSED** — F10 now Step 7 (before human review) |
| B2 — pause-vs-pending contradiction | HIGH | **CLOSED** — distinct rules for generation steps vs. review |
| B5 — vacuous assert.ok(true) | HIGH | **CLOSED** — replaced with M12 table-cell assertions |
| B6 — rework_proxy alias test | MEDIUM | **CLOSED** — word-boundary regex for alias detection |
| B7 — exactly ONE pause marker | MEDIUM | **CLOSED** — structural heading match + length === 1 |
| B8 — 10 core fields count | MEDIUM | **CLOSED** — missingFields.length === 0 |
| F9-honesty | — | **RE-CONFIRMED** — all 5 unknown reasons intact |
| Tests (35/35) | — | **ALL PASSING** |
| Regressions | — | **NONE DETECTED** |

**Source + engine:** same_source (code-reviewer agent), deepseek-v4-pro. 3rd-review heterologous (codex/gemini) was genuinely unreachable in this context; downgraded to same-source with explicit marking.

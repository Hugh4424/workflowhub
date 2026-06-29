# Code Review: build-plan v1 Phase 6 (Central Orchestrator SKILL.md Upgrade)

**Review ID:** ROUND-1
**Date:** 2026-06-29T02:30:00Z
**Reviewer:** code-reviewer agent (same-source, heterologous exhausted)
**Source:** same_source (3rd-review standalone.sh escalated to human after 3 revise_required rounds; cross-engine codex ran but findings were not resolved — see §External Review below)
**Engine:** codex (3rd-review rounds 1-3) + deepseek-v4-pro (own review)

---

## External Review Summary (3rd-review standalone.sh)

The 3rd-review skill was invoked with `standalone.sh --skip-manifest` using the combined diff of `workflows/build-plan/SKILL.md` and `tests/m12-build-plan-v1.test.mjs` (707 lines). It routed through **codex** (true cross-engine, R1/large scope per `route-decision.json`).

- **Round 1**: `revise_required` — 7 findings (2 HIGH, 4 MEDIUM, 1 LOW)
- **Round 2**: `revise_required` — 6 findings (2 HIGH, 4 MEDIUM) — unaddressed issues
- **Round 3**: `revise_required` — 7 findings (2 HIGH, 5 MEDIUM) — unaddressed issues
- **Final**: `escalate_to_human` — revise loop hit cap (3 rounds), same blocking findings unresolved

The 3rd-review opinion: the F10 gate and file-impact discovery are sequenced AFTER the human review checkpoint, allowing a reviewer to approve artifacts that have not passed required finalization checks. The test file contains several vacuous or under-specified assertions.

---

## Stage 1: Spec Compliance Verification

### FR-BP-001 (Serial workflow with all 9 steps)

- **Step coverage**: All 9 steps present (Read inputs → plan-generate → tasks-generate → cross-artifact-analyze → constitution check → baseline comparison → human review → F10 gate → identify files/modules).
- **PASS** with one caveat: Step 8 (F10 gate) heading says "(apply before finalising plan.md / tasks.md)" but is placed AFTER Step 7 (human review checkpoint), which presents plan.md/tasks.md as "ready for review". The heading text contradicts the actual step ordering. See [HIGH] finding B1 below.

### FR-BP-002 (plan.md/tasks.md content requirements)

- **PASS**: Step 2 specifies (a) implementation steps, (b) file list, (c) acceptance mapping for plan.md. Step 3 specifies (a) dependency-sorted task list, (b) FR annotation per task, (c) dependency relationships for tasks.md. All required sections covered.

### FR-BP-003 (M6 stage-result contract preservation + v1 additions)

- **PASS**: status/error_code/retryable/missing_items/user_decision/reason preserved. facts.plan_ref and facts.tasks preserved. facts.tasks_ref and facts.analysis_ref added as NEW (not replace). review object added as NEW. "Do NOT delete or rename any M6 field" directive present (line 207).

### FR-CONSTITUTION-001/002/003 (Constitution compliance check)

- **PASS**: Step 5 references `constitution-checklist.md`, names all 21 clauses (F1-F10, Q1-Q3, S1-S8), requires `[x]`/`[ ]` + rationale per clause, defines incomplete-output failure (missing clause/status/rationale = fail), and states non-blocking semantics (不阻断). All 3 FRs covered.

### FR-BASELINE-001/002/003 (M10 baseline comparison)

- **PASS**: Step 6 lists all 5 metric names with exact `rework_proxy_count`. M10 values 0.05/0.8295/1/6.075/25.25 present. ALL M12 values = `unknown` + per-metric reasons (see F9-honesty assessment below). Delta = `unknown` for all rows. No placeholder rule explicit (line 113). Threshold human-set, non-blocking.

### F9-Honesty Assessment (Baseline Unknown Reasons)

All 5 `unknown` reasons are **accurate, not false-green**:

| Metric | Reason | Verdict |
|---|---|---|
| missed_step_rate | "仅 upstream make-decision/build-spec 两段已完成且已落盘，全五段值待 verify-code 完成后才可计算" | ACCURATE — the metric requires all 5 stages; only 2 exist |
| test_execution_rate | "build-plan 阶段无测试执行数据，待 build-code/verify-code" | ACCURATE — test execution happens in later stages |
| review_execution_rate | "review 阶段尚未执行" | ACCURATE — review is a downstream stage |
| rework_rounds | "全流程未完成，无返工数据" | ACCURATE — rework counts need full pipeline completion |
| rework_proxy_count | "全流程未完成，无代理返工数据" | ACCURATE — proxy rework needs full pipeline |

The reasons reference specific upstream facts (2 stages completed vs 5-stage pipeline), not hand-waving. The SKILL.md does NOT reference build-plan's own not-yet-written metrics or downstream build-code/verify-code metrics — line 114 explicitly forbids this. **F9-honesty: PASS.**

### FR-REVIEW-001 (Exactly one human review checkpoint)

- **PASS**: Step 7 is the one-and-only human review checkpoint. Review object fully documented with state/reviewer/timestamp/decision/notes. Decision non-empty in all 3 states (line 150). Pending produces valid stage-result (line 148). However, see [HIGH] finding B2 below on the MUST-pause-vs-pending contradiction.

### FR-SKELETON-001 (F10 gate retained)

- **PASS**: All 4 questions present verbatim (lines 156-159). Cautionary example with ~95,000 lines present (line 163). Q1/Q4 rejection rule present (line 161).

### FR-SKELETON-002 (M6 contract preserved, recordSkeleton/updateOwnResult retained)

- **PASS**: All M6 fields preserved (line 199-206). recordSkeleton and updateOwnResult calls specified (line 211). 10 core metrics fields present (lines 214-225). "Do NOT delete or rename" directive (line 207).

### Spec Compliance Summary

- **Total FRs**: 15 (FR-BP-001/002/003, FR-CONSTITUTION-001/002/003, FR-BASELINE-001/002/003, FR-REVIEW-001, FR-SKELETON-001/002, plus scope/migration FRs not in this phase)
- **Phase 6 FRs covered**: 12 of 12 (FR-BP-001/002/003, FR-CONSTITUTION-001/002/003, FR-BASELINE-001/002/003, FR-REVIEW-001, FR-SKELETON-001/002)
- **Verdict**: All spec requirements are ADDRESSED. However, 2 HIGH issues (B1, B2) are spec-semantics conflicts, not spec-omissions. The spec requires the F10 gate and the human review checkpoint — both are present, but their ordering contradicts the spec's intent that F10 applies before finalization.

---

## Stage 2: Code Quality Review

### Files Reviewed

- `workflows/build-plan/SKILL.md` (229 lines, upgraded from M6)
- `tests/m12-build-plan-v1.test.mjs` (481 lines, new)

### LSP Diagnostics

Skipped — these are Markdown/JavaScript files without a project-level tsconfig. The `.mjs` test file uses Vitest + Node assert; no type errors expected from the static content assertions.

---

## Issues Found

### CRITICAL — 0 items

No CRITICAL (security vulnerability, data loss, or outright incorrect logic) issues found.

### HIGH — 2 items

**[HIGH] B1 — F10 gate placed AFTER human review checkpoint, contradicting heading text and spec intent**
- **File**: `workflows/build-plan/SKILL.md`, lines 118-169
- **Confidence**: HIGH
- **Issue**: Step 7 (line 118, "人审检查点") presents `plan.md` and `tasks.md` as "ready for review" (line 124-129). The human reviewer may approve these artifacts. Step 8 (line 152) then runs the F10 anti-over-engineering gate, whose heading says "(apply before finalising plan.md / tasks.md)". If F10 removes mechanisms from the plan after human approval, the approved artifacts become stale without re-review. If F10 modifies plan.md/tasks.md, the cross-artifact analysis from Step 4 also becomes stale. The spec (FR-BP-001, FR-SKELETON-001) requires F10 to gate the plan before it is considered final.
- **Fix**: Move Step 8 (F10 gate) BEFORE Step 7 (human review). Change the heading to remove "(apply before finalising plan.md / tasks.md)" or update it to reflect actual position. If F10 changes plan.md/tasks.md, add an explicit instruction to re-run cross-artifact-analyze (Step 4) before human review. Order should be: Steps 1-6 → F10 gate → if F10-modified, re-run Steps 3-4 → human review → file identification → stage-result.

**[HIGH] B2 — Human review checkpoint "MUST pause" conflicts with pending-is-valid contract**
- **File**: `workflows/build-plan/SKILL.md`, lines 16, 120-148
- **Confidence**: HIGH
- **Issue**: Line 16 states "Each step must complete before moving to the next. Failure in any step before the stage-result write results in stage failure." Line 120 says "MUST pause and wait for human confirmation." Line 148 says pending "Stage-result is still produced normally" without confirming "waiting" has completed. An automation runner encountering a non-interactive environment has two conflicting instructions: (1) MUST pause and wait (deadlock), or (2) produce stage-result with pending (proceed silently). There is no deterministic resolution rule.
- **Fix**: Replace "MUST pause and wait" with a conditional contract: "In interactive mode, prompt for approve/reject/skip and wait. In non-interactive mode, record pending immediately and continue. If the runtime supports a timeout, use it; otherwise, do not block indefinitely." Update line 16 to clarify that "complete" for the review step includes the pending resolution.

### MEDIUM — 7 items

**[MEDIUM] B3 — Stage-result sample hardcodes "success" and "cleared" while review object defaults to pending**
- **File**: `workflows/build-plan/SKILL.md`, lines 177, 188
- **Confidence**: HIGH
- **Issue**: The sample stage-result JSON hardcodes `"status": "success"` and `"reason": "...human review checkpoint cleared."` The embedded review object defaults to `"state": "<pending|approved|rejected>"` with `"decision": "检查点已触达但未获确认"`. The sample contradicts itself — "cleared" while review is pending. An implementer copying this sample directly would produce a lying stage-result for the default path.
- **Fix**: Either (a) make the sample state-dependent with placeholders for status and reason, or (b) use the pending default consistently: `"reason": "Plan and task list produced via plan-generate/tasks-generate, cross-artifact analyzed, constitution check completed, baseline comparison recorded, human review checkpoint reached."` and `"status": "<success|failure>"`.

**[MEDIUM] B4 — File identification (Step 9) runs after human review, reversing M6 safety order**
- **File**: `workflows/build-plan/SKILL.md`, lines 165-169
- **Confidence**: MEDIUM
- **Issue**: Step 9 ("Identify all files and modules… scan for every reference… Check the plan against any list of forbidden files") runs after the human review checkpoint. In M6, this step was performed before plan.md was finalized. Placing it after review means: (a) a reviewer approves artifacts before forbidden-file checks complete, (b) deletion/rename reference scans happen too late to affect the reviewed plan. The spec (FR-BP-001) lists 9 steps but does not explicitly require Step 9 before review — however, the M6 baseline contract (FR-SKELETON-001/002) requires not regressing M6 capabilities, and M6's "scan for every reference" was a pre-finalization safety step.
- **Fix**: Move Step 9 before the human review checkpoint. If the scan must reference the generated plan/tasks, place it between Step 4 (cross-artifact-analyze) and Step 5 (constitution check), or between Step 6 (baseline) and Step 7 (review). At minimum, add a note that if Step 9 discovers issues, the human reviewer must be re-consulted.

**[MEDIUM] B5 — Vacuous test: assert.ok(true) for "does NOT reference build-code/verify-code metrics"**
- **File**: `tests/m12-build-plan-v1.test.mjs`, lines 188-197
- **Confidence**: HIGH
- **Issue**: Test named "build-plan SKILL.md does NOT reference build-code/verify-code metrics" contains `assert.ok(true, "Pass: structural check...")`. This assertion can never fail and provides zero protection against regressions where build-code/verify-code metrics are introduced into the baseline section. This directly undermines FR-BASELINE-001's rule that build-plan "DO NOT reference build-plan's own not-yet-written metrics, nor build-code/verify-code metrics." The comment in the test body acknowledges the problem ("this is hard to test negatively without being vacuous") but the solution is still vacuous.
- **Fix**: Extract the M10 baseline section (lines between "### Step 6: M10 baseline comparison" and the next "### Step 7") and assert that it does NOT contain downstream metric identifiers (e.g., code coverage ratios, verify-code pass rates) or metric values that only exist in later stages. If downstream stage names must appear in explanatory text, use a whitelist.

**[MEDIUM] B6 — rework_proxy_count alias test cannot detect aliases when exact name also present**
- **File**: `tests/m12-build-plan-v1.test.mjs`, lines 121-128
- **Confidence**: MEDIUM
- **Issue**: The test checks `!content.includes("rework_proxy") || content.includes("rework_proxy_count")`. Because `"rework_proxy_count"` contains `"rework_proxy"`, if the content has BOTH `rework_proxy_count` (correct) AND a bare `rework_proxy` alias, the first condition `!content.includes("rework_proxy")` is `false`, making the OR evaluate to `true` via the second condition. The test passes while aliases exist — it is a no-op for alias detection.
- **Fix**: Split into two assertions: (1) `assert.ok(content.includes("rework_proxy_count"), "must contain exact name")`, (2) Use a word-boundary regex like `/\brework_proxy\b(?!_count)/` or check that every `rework_proxy` occurrence is part of `rework_proxy_count`.

**[MEDIUM] B7 — "Exactly ONE pause marker" test is too loose; can pass with duplicate checkpoints**
- **File**: `tests/m12-build-plan-v1.test.mjs`, lines 225-252
- **Confidence**: MEDIUM
- **Issue**: The `reviewStepCount` variable is computed (line 231) but never asserted. The `doubleCheckpoint` regex (line 240) uses `(?<!不)人审[\s]*检` and only fails if count > 2. This means: (a) 2 checkpoint sections would pass, (b) an English checkpoint heading wouldn't match the Chinese regex at all, (c) `reviewStepCount` being unused means broad-term counts don't feed into any assertion. The net effect is that the test can pass with up to 2 checkpoint sections and is blind to English-only checkpoint phrasing.
- **Fix**: Assert exactly one match against a structural heading pattern: `/^### Step \d+:.*(人审检查点|Human review checkpoint)/m`. Assert the count equals 1. Remove the unused `reviewStepCount` or repurpose it to verify no other step headings contain review/pause semantics.

**[MEDIUM] B8 — Core metrics field preservation allows only 8/10 fields**
- **File**: `tests/m12-build-plan-v1.test.mjs`, lines 457-476
- **Confidence**: MEDIUM
- **Issue**: The test named "10 core fields preserved in metrics record" checks `presentCount >= 8`. The spec (FR-SKELETON-002) requires preservation of the M6 metrics contract with all 10 core fields. Allowing only 8 means 2 fields could go missing and the test still passes — this undershoots the requirement the test name claims to verify.
- **Fix**: Change `presentCount >= 8` to `presentCount === 10` and add a diagnostic message listing which fields are missing when the count is less than 10. If some fields are legitimately optional in v1, rename the test to "at least 8 of 10 core fields preserved" and document which 2 are optional.

**[MEDIUM] B9 — M10 baseline values test uses OR logic accepting partial evidence**
- **File**: `tests/m12-build-plan-v1.test.mjs`, lines 132-145
- **Confidence**: LOW
- **Issue**: The test for M10 baseline values accepts either a baseline-report.md reference OR some numeric values (0.05/0.8295/6.075/25.25 — note that `1` is not checked because it's too common). If the SKILL.md references baseline-report.md but never lists the actual values, the test passes. Conversely, if it lists some values but omits the source reference, it also passes. The spec (FR-BASELINE-001) requires the values to be present AND sourced from baseline-report.md.
- **Fix**: Assert both conditions independently: (1) baseline-report.md reference exists, AND (2) all 5 specific numeric values (0.05, 0.8295, 1, 6.075, 25.25) appear in the baseline section. For the value `1`, qualify it by context (e.g., appearing in the baseline table row for review_execution_rate).

### LOW — 3 items

**[LOW] B10 — M6 field preservation assertion duplicates the includes expression**
- **File**: `tests/m12-build-plan-v1.test.mjs`, lines 346-355
- **Confidence**: HIGH
- **Issue**: Line 350 duplicates the same expression: `content.includes(`"${f}"`) || content.includes(`"${f}"`)`. The two sides of the `||` are identical — a copy-paste artifact. Does not affect test correctness but indicates rushed construction.
- **Fix**: Remove the duplicate: `content.includes(`"${f}"`) || content.includes(f)` or just `content.includes(f)` since bare field names appear in the JSON schema documentation text (line 199-206).

**[LOW] B11 — Threshold test uses OR logic: "human-set or non-blocking"**
- **File**: `tests/m12-build-plan-v1.test.mjs`, lines 199-210
- **Confidence**: LOW
- **Issue**: The `humanThreshold` and `nonBlocking` variables are combined with `||`. The spec (FR-BASELINE-002) requires BOTH "threshold is human-set" AND "baseline comparison is non-blocking". The test passes if only one condition is met.
- **Fix**: Assert both conditions independently: `assert.ok(humanThreshold)` and `assert.ok(nonBlocking)`.

**[LOW] B12 — Test file has no tests for Step 1 (upstream input) fail-loud behavior**
- **File**: `tests/m12-build-plan-v1.test.mjs` (absent)
- **Confidence**: LOW
- **Issue**: The spec requires fail-loud on missing task-id ("task-id required", non-zero exit, no git fallback) and missing spec ("spec not found at specs/{task-id}/spec.md"). No test covers these failure paths for the orchestrator SKILL.md (the sub-skill tests for plan-generate/tasks-generate cover them separately).
- **Fix**: Add structural assertions verifying the failure messages appear verbatim in the SKILL.md text and are not accompanied by git branch inference instructions.

---

## Test File Vacuous/Misleading Assertions Summary

| Line | Test Name | Issue | Vacuous? |
|------|-----------|-------|----------|
| 188-197 | "does NOT reference build-code/verify-code metrics" | `assert.ok(true)` — unconditional pass | **YES** |
| 121-128 | rework_proxy_count exact name / alias reject | Cannot detect aliases if exact name also present | Partially |
| 237-252 | "exactly ONE pause marker" | Unused count, allows 2 checkpoints, regex too narrow | Partially |
| 457-476 | "10 core fields preserved" | Allows 8/10, not 10/10 as name implies | Partially |
| 346-355 | M6 fields preserved | Duplicated identical expression | Not vacuous but sloppy |
| 199-210 | Threshold human-set/non-blocking | OR instead of AND for two independent requirements | Partially |

**Vacuous assertions found: 1 definite (B5), 3 partially weakened (B6, B7, B8).**

---

## Positive Observations

- **F9-honesty**: The baseline `unknown` reasons are precise, traceable to specific upstream stage completions, and avoid false-green. This is the strongest part of the v1 upgrade.
- **Complete FR coverage**: All 12 Phase 6 functional requirements are addressed in the SKILL.md. No FR is skipped.
- **M6 contract non-regression**: The SKILL.md explicitly documents field preservation (lines 199-207) with a "Do NOT delete or rename" directive. The v1 additions (tasks_ref, analysis_ref, review) are clearly marked as NEW and additive.
- **Constitution check completeness**: Step 5 thoroughly covers the 21-clause requirement, incomplete-output failure rules, and non-blocking semantics. The `[ ]` WITH rationale = valid output rule is explicit.
- **F10 gate content**: All 4 questions and the ~95,000-line cautionary text are preserved verbatim from M6. The anti-over-engineering intent is intact.
- **Test file structure**: The test file follows the T014-T019 task structure directly, making it easy to trace which test covers which task. Individual test names are descriptive.
- **Stage-result contract documentation**: The review object is fully specified with field-level rules for all 3 states (approved/rejected/pending), including the decision non-empty requirement.

---

## Open Questions (low-confidence findings)

[HIGH] Possible atomicity gap in cross-artifact-analyze with F10-modified artifacts
**File**: `workflows/build-plan/SKILL.md`, lines 46-56, 152-163
**Confidence**: LOW
**Issue**: If F10 removes a mechanism from plan.md after human review (in a revised ordering), should cross-artifact-analyze re-run? The spec requires the analyze report to cover the final artifacts. This is conditional on whether F10 actually modifies content — which is a runtime behavior, not a static contract violation.
**Mitigation**: Document that if F10 materially changes plan.md/tasks.md, Steps 3-4 must be re-executed before human review.

---

## Recommendation

**Verdict: REQUEST CHANGES**

**Blocking issues (must fix before sign-off):**

1. **[HIGH] B1** — F10 gate ordering: Move Step 8 before Step 7 so the anti-over-engineering gate is applied before human review. The heading text "(apply before finalising)" already acknowledges this intent but the step ordering contradicts it.
2. **[HIGH] B2** — Human review pause-vs-pending contradiction: Resolve the ambiguity between "MUST pause and wait" (line 120) and "pending IS a valid state, do NOT omit stage-result" (line 148). Add deterministic rules for non-interactive/skip/timeout.
3. **[MEDIUM] B5** — Vacuous test at line 188 (`assert.ok(true)`) must be replaced with a real structural assertion — it currently provides zero protection for the FR-BASELINE-001 rule it is named after.

**Non-blocking but should fix before next round:**

- **[MEDIUM] B3** — Stage-result sample contradiction (success+cleared vs pending)
- **[MEDIUM] B6** — rework_proxy_count alias test strengthening
- **[MEDIUM] B7** — Exactly-one-checkpoint test tightening
- **[MEDIUM] B8** — Core fields count from 8 to 10

**External review note**: The 3rd-review (codex cross-engine) escalated to human after 3 revise_required rounds. Its core concern — the F10 gate ordering — is corroborated by this review and constitutes the same HIGH finding B1. The external review's additional concern about Step 9 (file identification) ordering is captured as MEDIUM finding B4.

---

## Diff Statistics

- **Files changed**: 2 (1 modified, 1 new)
- **Lines added**: ~267 (SKILL.md: M6 43 lines → v1 229 lines, net +186; test file: +481 new)
- **SKILL.md size**: 229 lines (vs ~50 lines M6 baseline)
- **Test file size**: 481 lines, 35 structural assertions
- **FRs covered**: 12 of 12 (Phase 6)

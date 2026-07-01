# Phase 1 3rd-Party Code Review — m13a-moat-skills

**Reviewer:** code-reviewer (heterologous, independent context)
**Date:** 2026-07-01
**Scope:** Phase 1 diff at `/tmp/phase-1-diff.patch`
**Files under review:**
- `skills/talk-with-zhipeng/SKILL.md`
- `skills/grill-with-docs/SKILL.md`
- `skills/grill-with-docs/CONTEXT-FORMAT.md`
- `skills/grill-with-docs/ADR-FORMAT.md`
- `skills/intake-decision-review/SKILL.md`
- `tests/moat-skills-phase1.test.mjs`
- `specs/m13a-moat-skills/evidence/` (auto-generated, reviewed for RED/GREEN correctness only)

---

## Stage 1 — Spec Compliance

### FR-SKILL-001: talk-with-zhipeng SKILL.md exists with identifier
- File exists: YES
- Frontmatter `name: talk-with-zhipeng`: PRESENT (line 2)
- "talk" keyword retained in body: YES (`talk-with-zhipeng` in heading and frontmatter)
- RESULT: PASS

### FR-SKILL-002: grill-with-docs file set
- `skills/grill-with-docs/SKILL.md` exists: YES
- `skills/grill-with-docs/CONTEXT-FORMAT.md` exists: YES (77 lines, non-trivial)
- `skills/grill-with-docs/ADR-FORMAT.md` exists: YES (47 lines, non-trivial)
- `name: grill-with-docs` in frontmatter: YES (line 2)
- RESULT: PASS

### FR-SKILL-003: intake-decision-review SKILL.md exists with identifier
- File exists: YES
- Frontmatter `name: intake-decision-review`: PRESENT (line 2)
- "intake-decision-review" in heading: YES (line 6)
- RESULT: PASS

### FR-BOUNDARY-001: No forbidden strings in skill files
Grep of pattern `/gbrain|office-hours|multica-agenthub|\/Users\/|\/home\/|~\/\.claude/`
across all three skill directories returned zero matches.
- talk-with-zhipeng: CLEAN
- grill-with-docs: CLEAN
- intake-decision-review: CLEAN
- RESULT: PASS

### FR-BOUNDARY-002: No modifications outside the three skill dirs
All 12 diff paths verified against the allowed set:
- `skills/talk-with-zhipeng/` — ALLOWED
- `skills/grill-with-docs/` — ALLOWED
- `skills/intake-decision-review/` — ALLOWED
- `tests/moat-skills-phase1.test.mjs` — ALLOWED
- `specs/m13a-moat-skills/evidence/` — ALLOWED (auto-generated)
- `workflows/` directory: NOT TOUCHED — PASS
- No other skill dirs modified: PASS
- RESULT: PASS

### FR-TEST-001: Tests non-vacuous (content-checking, falsifiable)
Each test suite assessed:

**talk-with-zhipeng test (lines 68-76):**
Checks frontmatter name, PLUS content assertions for:
- inputs (`/输入|入参|已有调研|初始咨询材料/`)
- steps (`/步骤|执行协议|核心层/`)
- outputs (`/输出|产出|决策记录/`)
- impact ordering (`/影响排序|impact/`)
- "talk" keyword
Result: NON-VACUOUS

**grill-with-docs test (lines 78-87):**
Checks frontmatter name, file existence for CONTEXT-FORMAT.md and ADR-FORMAT.md, PLUS content assertions for:
- inputs/usage (`/输入|Input|what-to-do|supporting-info/`)
- steps/session protocol (`/步骤|During the session|执行协议/`)
- outputs (`/输出|Update CONTEXT\.md|ADR/`)
- "grill" keyword
Result: NON-VACUOUS

**intake-decision-review test in describe "Stage 1 moat skill files" (lines 89-92):**
Checks only frontmatter name — this block alone is shallow.
However, the separate describe block "intake-decision-review execution protocol" (lines 121-158)
adds four deeply content-checking tests:
- S0-S9 step presence (loop over 10 labels)
- three-angle contract + "exactly 3 findings" + single-call requirement
- fallback_used inspection + rerun-on-missing + no-invent clauses
- S2/S4/S9 recommendation+consequence language (section-level regex extraction)
Together with the host-residue test: NON-VACUOUS overall.

**Live test run (2026-07-01):**
`npx vitest run tests/moat-skills-phase1.test.mjs` — 10 tests, 10 passed, 0 failed.
- RESULT: PASS

### RED/GREEN Evidence Review
- RED evidence: exit_code=1, timestamp 15:51:01Z — all 10 tests failed (files absent from disk)
- GREEN evidence: exit_code=0, timestamp 15:53:02Z — all 10 tests passed
- Both share git sha `22eb914...` — correct: skill files are untracked (never committed during this phase per "DO NOT COMMIT" protocol); the same sha is expected
- RED genuinely failed because skill directories did not yet exist on disk at capture time
- RESULT: VALID TDD CYCLE

---

## Stage 2 — Code Quality

### Skill file substantiveness

**talk-with-zhipeng/SKILL.md** (131 lines):
Substantive. Covers two-layer architecture, 10 numbered protocol steps (1–10), four-dimension scope judgment, convergence threshold, divergence correction, structured output template, thin adapter contract, and constraints. Not a stub.

**grill-with-docs/SKILL.md** (88 lines):
Substantive. Covers full grilling session protocol with `<what-to-do>` and `<supporting-info>` sections, glossary challenge, fuzzy language sharpening, scenario stress-testing, code cross-referencing, inline CONTEXT.md update, and ADR offer criteria with three-gate guard. Not a stub.

**grill-with-docs/CONTEXT-FORMAT.md** (77 lines):
Substantive. Includes full format template with example terms, relationships, example dialogue, flagged ambiguities section, explicit rules (6 bullets), and single vs. multi-context repo guidance.

**grill-with-docs/ADR-FORMAT.md** (47 lines):
Substantive. Template, optional sections, numbering convention, three-gate offer criteria with examples of what qualifies and what to reject.

**intake-decision-review/SKILL.md** (119 lines):
Substantive. Covers S0–S9 protocol with well-defined sections, three-angle internal contract, single-call constraint, fallback detection, completeness validation, structured output template, and user-facing communication rules.

### Security
No hardcoded secrets, credentials, or API keys found. No user input processing. Not applicable beyond this check.

### Logic Correctness

**Test file — `listFilesRecursive` (lines 38-53):**
Recursive walk uses `readdirSync` with no symlink guard. A directory containing symlinks pointing back to a parent would cause infinite recursion. Given the skill directories contain only flat markdown files in practice, this is not a realistic trigger today, but is a latent fragility.
Severity: LOW | Confidence: MEDIUM

**Test file — S2/S4/S9 regex extraction (lines 149-151):**
```js
const s2 = content.match(/S2[\s\S]*?(?=\n###?\s*S3\b|\n##\s*S3\b)/)?.[0] ?? "";
```
If the SKILL.md section heading format ever changes (e.g., from `### S3` to `#### S3` or `## S3 Foo`), the lookahead will not match and `s2` silently falls to `""`. An empty string then passes `assert.match(s2, /推荐/)` — wait, no: `assert.match("", /推荐/)` throws because the pattern does not match. So the test would correctly fail, not silently pass. However, if S3 is renamed entirely (e.g., step header changes), `s2` becomes the entire remaining content and the assertion may pass on unrelated text. This is a minor robustness edge case, not a current defect.
Severity: LOW | Confidence: LOW

**intake-decision-review/SKILL.md — S6 fallback check:**
S6 says "if return contains `fallback_used: true`, stop and report error or mark blocked." The phrase "报错或标记 blocked" introduces optionality (either report error OR mark blocked). This leaves behavioral ambiguity about what the caller should expect as the output format of the blocked state. Not a protocol violation since the overall skill contract in S8/Outputs covers the `blocked` verdict, but the "or" could allow a silent error path.
Severity: LOW | Confidence: MEDIUM

### Anti-patterns / SOLID
- All three SKILL.md files respect SRP: each has a single coherent purpose.
- grill-with-docs cleanly separates the `<what-to-do>` operator instruction from `<supporting-info>` domain knowledge. Good use of structure.
- talk-with-zhipeng explicitly uses a two-layer architecture (platform-agnostic core + thin adapter). This DIP-aligned design is a positive pattern — easy to port to other platforms by swapping only the adapter.
- intake-decision-review explicitly forbids sub-skill decomposition (`不拆成多个 intake-* 子技能`), keeping complexity contained. Appropriate for the scope.

### Tests — Additional Observations
- The `describe("Stage 1 moat skill files")` intake test (lines 89-92) only checks frontmatter name. It does NOT check any behavioral content of the intake skill in that describe block. The deficit is fully compensated by the subsequent `describe("intake-decision-review execution protocol")` block, but the grouping is mildly misleading: the "Stage 1 moat skill files" block implies structural parity with the other two skills' tests, yet the intake skill's content tests live in a separate describe.
  Severity: LOW | Confidence: HIGH
  Suggestion: Consider moving the frontmatter-only test into the execution protocol describe, or adding one content assertion alongside it in the Stage 1 block (e.g., assert for "S0" or "3rd-review").

- `assertNoForbiddenStrings` for `talk-with-zhipeng` uses pattern `/multica-agenthub|gbrain|office-hours|\/Users\/|\/home\//` (line 93 of test) but does NOT include `~\/\.claude`. The spec (FR-BOUNDARY-001) lists `~/.claude` as a forbidden string. The grill and intake variants do include `~\/\.claude` in their pattern (line 101, 109). This is an inconsistency — the talk skill test has a narrower guard than the other two.
  Severity: MEDIUM | Confidence: HIGH
  Fix: Add `~\/\.claude` to the talk-with-zhipeng forbidden pattern on line 93 of `tests/moat-skills-phase1.test.mjs`.
  Note: The actual SKILL.md does not contain `~/.claude`, so this is not a current content defect — but the test would not catch it if someone introduced that string in the future.

- The CONTEXT-FORMAT.md and ADR-FORMAT.md companion files are not individually tested for non-trivial content (the test only checks they exist via `existsSync`). This is acceptable given the grill SKILL.md test already checks substantive content of SKILL.md and both companion files are visibly non-trivial, but it is a coverage gap if the format files were to be emptied.
  Severity: LOW | Confidence: HIGH

### Performance / Maintainability
No performance concerns. All three SKILL.md files are under 150 lines; cyclomatic complexity of the test file is low. The `listFilesRecursive` helper is clean and reusable. The helper functions (`extractFrontmatter`, `assertNonEmptyFrontmatterName`, `assertNoForbiddenStrings`) are well-factored and DRY across the three test suites.

---

## Open Questions (low-confidence findings — surfaced, not blocking)

**[HIGH] Same git SHA in RED and GREEN evidence**
Confidence: LOW
The RED and GREEN captures share the same `git_sha` (`22eb914...`). This is expected under the "DO NOT COMMIT" protocol — skill files are created as untracked working-tree files between the two runs. However, if a verifier checks only the SHA field without reading the git status, they might incorrectly conclude the RED run already had the files. This is a documentation/interpretability issue in the evidence format, not a process violation.
Suggestion: Consider adding a `git_status_untracked_count` or `working_tree_files_present` field to capture evidence for future readers.

---

## Positive Observations

- **Clean boundary compliance.** Zero forbidden strings found across all three skill directories after exhaustive grep. The migration from multica-agenthub origin was clean.
- **Strong intake skill protocol design.** S0–S9 steps are well-ordered, the single-call constraint is explicit in three places (body, step, constraints), and the no-invent clause appears in both S7 and the constraints section — belt and suspenders.
- **Two-layer talk skill architecture.** The platform-agnostic core + thin adapter split is sound and explicitly documented with a classifier rule. This will make future platform migrations straightforward.
- **Non-trivial test assertions.** The test suite goes well beyond existence checks — it validates YAML frontmatter structure, specific content clauses, section-level extraction for communication rules, and forbidden string absence. The suite would correctly fail against empty stubs or improperly migrated files.
- **Correct TDD evidence.** RED shows genuine failure (files absent from disk), GREEN shows genuine pass. The cycle is valid.
- **Full grill skill preserved.** The full variant (not lite) was correctly migrated, including both companion files (CONTEXT-FORMAT.md and ADR-FORMAT.md) with complete content.

---

## Issues Summary

| Severity | Count | Items |
|----------|-------|-------|
| CRITICAL | 0 | — |
| HIGH | 0 | — |
| MEDIUM | 1 | talk skill test missing `~/.claude` forbidden pattern |
| LOW | 4 | symlink guard, S2/S4/S9 regex brittle edge, S6 "or" ambiguity, intake Stage-1 test grouping inconsistency |

---

## Verdict

**PASS**

All spec requirements (FR-SKILL-001/002/003, FR-BOUNDARY-001/002, FR-TEST-001) are satisfied. All 10 tests pass on the live codebase. No CRITICAL or HIGH issues found at HIGH confidence. The one MEDIUM finding (missing `~/.claude` in the talk skill test) is a test coverage gap rather than a content defect — the actual skill file does not contain the forbidden string. It does not block the verdict but should be addressed before adding content to that skill dir that could introduce host paths.

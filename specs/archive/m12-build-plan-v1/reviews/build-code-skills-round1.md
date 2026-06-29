# Code Review: build-plan v1 三技能 + 测试 (Round 1)

**Review Date**: 2026-06-29
**Reviewer**: code-reviewer agent + 3rd-review (codex cross-engine)
**Source**: third_party (heterologous — codex engine via 3rd-review standalone.sh)
**Scope**: 6 files (3 SKILL.md + 3 test files); templates exist on disk but excluded from diff scope per spec

## Code Review Summary

**Files Reviewed:** 6
**Total Issues:** 7

### By Severity
- CRITICAL: 0
- HIGH: 2 (must fix before merge)
- MEDIUM: 3 (should fix)
- LOW: 2 (optional)

---

## Spec Compliance Verification (Stage 1)

### plan-generate/SKILL.md
| FR | Status | Notes |
|----|--------|-------|
| FR-MIG-001 (naming) | PASS | frontmatter name="plan-generate"; directory basename is plan-generate; callable refs use new name |
| FR-MIG-002 (independent callable) | PASS | SKILL.md + templates/plan-template.md exist at correct paths; input contract documented |
| FR-DECOUPLE-001 (task-id fail-loud) | PASS | "task-id required" + non-zero exit; no git branch inference |
| FR-DECOUPLE-002 (internal template) | PASS | Path `workflows/plan-generate/templates/plan-template.md`; no .specify/ fallback |
| FR-BP-001 (constitution check) | PARTIAL | Fills 21 clauses from constitution-checklist.md -- see Issue #7 |
| FR-BP-002 (plan sections) | PASS | Produces Summary, Technical Context, Constitution Check, Project Structure, Implementation Steps, Verification Mapping |
| F10 gate | PASS | 4 questions explicitly listed in step 5 |

### tasks-generate/SKILL.md
| FR | Status | Notes |
|----|--------|-------|
| FR-MIG-001 (naming) | PASS | frontmatter name="tasks-generate"; directory basename correct |
| FR-MIG-002 (independent callable) | PASS | SKILL.md + templates/tasks-template.md exist |
| FR-MIG-003 (--stage N contract) | PASS | N>=1 positive integer, consecutive blocks, <= N cap, no-force, omit behavior, (stage:N, depends:X) annotation, dependency validity all documented |
| FR-DECOUPLE-001 (task-id fail-loud) | PASS | "task-id required" + non-zero exit |
| FR-DECOUPLE-002 (internal template) | PASS | Path `workflows/tasks-generate/templates/tasks-template.md` |
| FR-BP-002 (tasks sections) | PASS | Dependency-ordered, FR-mapped, dependency annotations |

### cross-artifact-analyze/SKILL.md
| FR | Status | Notes |
|----|--------|-------|
| FR-MIG-001 (naming) | PASS | frontmatter name="cross-artifact-analyze" |
| FR-MIG-002 (independent callable) | PASS | SKILL.md exists; no templates needed per spec |
| FR-XARTIFACT-001 (5-field + 4 types) | PASS | All 4 types documented; 5 fields with descriptions and examples; "缺任一字段的发现视为无效" stated; "无一致性问题" summary path documented |
| FR-XARTIFACT-002 (non-blocking) | PASS | "不阻断" explicitly stated |
| FR-DECOUPLE-003 (task-id, no .specify/) | PASS | Path derivation via task-id; no .specify/ in workflow steps; no git commands |
| facts.analysis_ref | PASS | Documented at lines 112-118 |

### Test Files (non-vacuity assessment)
| Test File | Tests | Vacuity | Notes |
|-----------|-------|---------|-------|
| m12-plan-generate.test.mjs | 10 | 1 VACUOUS | Speckit-plan body test (Issue #3) |
| m12-tasks-generate.test.mjs | 16 | NON-VACUOUS | All tests assert real contract properties |
| m12-cross-artifact-analyze.test.mjs | 17 | 1 VACUOUS | Speckit-analyze body test (Issue #4) |

---

## Issues

### [HIGH] Speckit-plan body identifier test is vacuously true — over-filtering removes the forbidden token from check
**File**: `tests/m12-plan-generate.test.mjs:131-145`
**Confidence**: HIGH
**Issue**: The test for "body does NOT use 'speckit-plan' as a skill identifier in workflow steps" filters out ALL lines containing `speckit-plan` (not just provenance lines), then asserts the remainder does not contain `speckit-plan`. This assertion can never fail. A hypothetical workflow step saying "使用 speckit-plan 生成计划" would be silently filtered out and the test would pass.

**Reproduction confirmed**:
```
Line: "使用 speckit-plan 生成计划"  // should fail the test
Filter: !l.includes("speckit-plan") → line is REMOVED
Assert: !cleaned.includes("speckit-plan") → PASS (falsely)
```

**Fix**: Filter only `>` (blockquote), `#` (headings), `<!--` (comments), and lines containing `改造自` (provenance words). Keep ALL other lines in the cleaned content. The filter should be:
```javascript
const lines = content.split("\n").filter(
  (l) => !l.startsWith(">") && !l.startsWith("#") && !l.startsWith("<!--") && !l.includes("改造自")
);
// Remove `&& !l.includes("speckit-plan")` from the filter
```

---

### [HIGH] Speckit-analyze body identifier test is vacuously true — identical over-filtering pattern
**File**: `tests/m12-cross-artifact-analyze.test.mjs:262-279`
**Confidence**: HIGH
**Issue**: Identical bug to Issue #3. The filter `!l.includes("speckit-analyze")` removes the forbidden token from all lines before checking, making the negative assertion always pass regardless of actual content.

**Fix**: Same as Issue #3 — remove `&& !l.includes("speckit-analyze")` from the filter expression. Keep only provenance/comment line filters.

---

### [MEDIUM] plan-generate frontmatter description references "speckit-plan" in a non-provenance context
**File**: `workflows/plan-generate/SKILL.md:3`
**Confidence**: LOW
**Issue**: The YAML frontmatter `description` field says "Adapted from speckit-plan for the workflowhub contract". FR-MIG-001 narrows the naming check to "skill name 字段或等效标识" and exempts "迁移说明、provenance 脚注". The description field is not the name field, but it sits in the frontmatter alongside the name and is a first-class skill metadata field, not a footnote or comment.

**Fix**: Move the provenance mention out of the `description` field into a blockquote provenance footnote. Keep the `description` purely functional. Alternatively, if this is deemed acceptable as a "迁移说明" per the exemption, document that decision explicitly.

---

### [MEDIUM] tasks-generate frontmatter description references "speckit-tasks"
**File**: `workflows/tasks-generate/SKILL.md:3`
**Confidence**: LOW
**Issue**: Same pattern as Issue #5 — "改编自 speckit-tasks" in the `description` field. Same resolution applies.

**Fix**: Move the provenance mention to a blockquote footnote, or explicitly document the exemption rationale.

---

### [MEDIUM] cross-artifact-analyze frontmatter description references "speckit-analyze"
**File**: `workflows/cross-artifact-analyze/SKILL.md:3`
**Confidence**: LOW
**Issue**: Same pattern as Issues #5/#6 — "改造自 speckit-analyze" in `description`. Same resolution applies.

**Fix**: Move provenance to blockquote footnote, or document the exemption.

---

### [LOW] plan-generate: Constitution Check step references constitution-checklist.md but skill does not specify what happens if checklist file is missing
**File**: `workflows/plan-generate/SKILL.md:40`
**Confidence**: LOW
**Issue**: Step 4.2 says "从 `constitution-checklist.md` 读取 21 条". Unlike spec.md and the internal template (which have explicit fail-loud on missing), constitution-checklist.md missing is not handled here. The downstream build-plan SKILL.md handles this, but a standalone plan-generate call could encounter a missing checklist without clear error guidance.

**Fix**: Add a brief note: "若 `constitution-checklist.md` 不存在，报错并停止" — or state that build-plan provides this check.

---

### [LOW] tasks-generate: Template path uses `./templates/tasks-template.md` relative reference alongside full path
**File**: `workflows/tasks-generate/SKILL.md:35`
**Confidence**: LOW
**Issue**: Step 3 reads "从 `./templates/tasks-template.md`（本 SKILL.md 同目录下的相对路径，即 `workflows/tasks-generate/templates/tasks-template.md`）". The `./` relative path could be ambiguous depending on execution context (the CWD of the agent running the skill). The explicit absolute-from-repo-root path is clearer.

**Fix**: Use the full repo-relative path `workflows/tasks-generate/templates/tasks-template.md` uniformly, or clarify that `./` is relative to the SKILL.md's own directory.

---

## Open Questions (low-confidence findings — surfaced, not blocking)

### [MEDIUM] Are template files meant to be in the GREEN diff?
**Confidence**: LOW (diff-scope question, not code issue)
**Context**: The 3rd-review flagged missing `plan-template.md` and `tasks-template.md` because they were excluded from the diff. On-disk, both files exist at the correct paths (`workflows/plan-generate/templates/plan-template.md`, `workflows/tasks-generate/templates/tasks-template.md`). The review scope was the GREEN diff of 3 SKILL.md + 3 test files — templates are tracked as untracked new files alongside but outside the diff. If the intent is to review ALL new files created, include the template files in the next diff.

### [HIGH] plan-generate step 4.2 says "从 constitution-checklist.md 读取 21 条" — but which `constitution-checklist.md`?
**Confidence**: LOW (path is unambiguous in repo context, but skill does not state it)
**Context**: The step reads "从 `constitution-checklist.md` 读取 21 条" without specifying the full repo-relative path. In the repo root, this is unambiguous. But if the skill were run from a different CWD, this could fail silently. The skill could harden by using the repo-root path.

---

## Positive Observations

1. **Fail-loud contracts are thorough**: All three skills have explicit fail-loud for missing task-id, missing upstream artifacts, and missing templates — with specific error messages and non-zero exit codes. No silent fallbacks or hidden compatibility layers.

2. **No .specify/ dependency**: All `.specify/` references are in prohibition/provenance context. The skills correctly derive paths from task-id and load templates from internal workflowhub paths. FR-DECOUPLE-001/002/003 are cleanly satisfied.

3. **--stage N contract documentation is comprehensive**: The tasks-generate SKILL.md documents every aspect of FR-MIG-003: N is positive integer, consecutive blocks, stage count <= N cap, no forced N blocks, omit behavior with kept dependency sorting, (stage:N, depends:X) annotation format, and dependency validity rules. The reference table at the end is a useful quick-check artifact.

4. **5-field finding contract is explicitly enforced**: cross-artifact-analyze SKILL.md clearly states that findings missing any of the 5 fields are invalid and the report is non-compliant. This is the exact spec requirement (FR-XARTIFACT-001).

5. **"无一致性问题" summary path is present**: Both the spec requirement and the test assertion are covered.

6. **All 55 tests pass**: `vitest run` confirms zero test failures. Tests cover structural contracts across all three skills.

7. **Templates are well-structured**: plan-template.md contains all required sections (Summary, Technical Context, Constitution Check, Project Structure, Implementation Steps, F10 Gate, Verification Mapping). tasks-template.md has the proper `{task-id}` placeholder and phase structure.

8. **No git operations**: All three skills explicitly prohibit git operations in their "去耦约束" section, and tests verify this. No `git checkout/branch/fetch/create-new-feature.sh` appear as positive workflow instructions.

---

## Recommendation

**VERDICT: REVISE REQUIRED**

**Blocking findings (2 HIGH at HIGH confidence)**:
1. `tests/m12-plan-generate.test.mjs` — Speckit-plan identifier test is vacuously true (over-filtering bug)
2. `tests/m12-cross-artifact-analyze.test.mjs` — Speckit-analyze identifier test is vacuously true (identical bug)

These two tests provide a false sense of security: they claim to verify that the skills don't self-identify as speckit-* names, but their filter logic guarantees a pass regardless of content. Fix the filter expressions as described in the issues above.

**Non-blocking recommendations**:
- Move speckit-* provenance mentions out of frontmatter `description` fields into blockquote footnotes (Issues #5-#7, MEDIUM/LOW confidence)
- Clarify template path in tasks-generate from `./` relative to explicit repo-relative (Issue #8, LOW)
- Document constitution-checklist.md missing behavior (Issue #7, LOW)

**Engine**: codex (3rd-review via standalone.sh R1 route, scope=large for 1160-line diff)
**Heterologous review rounds**: 3 rounds, escalated to human (non-convergence on template-presence finding which was a diff-scope artifact; test-filtering finding confirmed across all 3 rounds)
**Source**: third_party

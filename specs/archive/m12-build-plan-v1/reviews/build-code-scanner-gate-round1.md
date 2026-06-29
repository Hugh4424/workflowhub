# build-code Scanner Gate Review — Round 1

**Date**: 2026-06-29
**Reviewer**: code-reviewer (deepseek-v4-pro)
**Change under review**: Sub-skill exclusion via `kind: sub-skill` frontmatter marker in `scripts/check-stage-quality.mjs`
**Source + Engine**: Heterologous (deepseek-v4-pro) — same-agent review; no external cross-validation engine invoked (codex/gemini unavailable). Downgraded to same_source.

---

## Verdict: APPROVE

No CRITICAL or HIGH severity issues at HIGH confidence. The exclusion is properly marker-gated, the guard test is non-vacuous and falsifiable in both directions, and no existing check is weakened.

---

## Verification Results (6-point checklist)

### 1. Is the exclusion MARKER-GATED only?

**YES, at HIGH confidence.**

Evidence:
- `scripts/check-stage-quality.mjs:215`: `if (fmKind === "sub-skill")` — the skip triggers ONLY on exact `"sub-skill"` value extracted from the YAML frontmatter `kind:` key.
- Lines 208-218: the frontmatter regex `/^---\r?\n([\s\S]*?)\r?\n---/` captures ONLY the YAML block between `---` delimiters. Body text is never scanned for the marker.
- The `kindMatch` regex `^kind:\s*([^\s#]+)` is key-specific (only the `kind:` field, not other fields) and dismisses inline comments (`#`).
- A skill with NO frontmatter at all (`fmMatch === null`): the entire sub-skip block is bypassed, and normal wiring checks (recordSkeleton, updateOwnResult, collector.mjs, stage literal) apply at lines 220-268.
- A skill with frontmatter but NO `kind:` field: `kindMatch` is null, `fmKind` is null, `fmKind === "sub-skill"` is false, no skip.
- A skill with `kind: something-else`: `fmKind === "other"`, no skip.
- A skill with NO marker and NO wiring: still flagged at line 261-268. Confirmed by guard test branch (b).

No heuristic-based skipping (filename, missing-wiring-implies-skip, etc.) exists. The skip is purely marker-gated.

### 2. Can the marker be abused?

**Risk assessment: LOW severity, LOW confidence.**

The vector: someone adds `kind: sub-skill` to a real stage skill's frontmatter (e.g., `workflows/build-code/SKILL.md`) → scanner skips it → the skill could then have recordSkeleton/updateOwnResult removed without the scanner noticing.

Why LOW severity:
- All 7 real stage skills (make-decision, build-spec, build-plan, build-code, verify-code, scope-triage, decision-log) currently have NO `kind` field in their frontmatter — confirmed by `head -5` on each.
- Adding the marker requires an explicit, intentional edit to the SKILL.md — it cannot happen accidentally.
- The marker is a contract declaration: claiming to be a sub-skill when you are a real stage skill is a self-contradiction that would be caught in review.
- If a real stage skill falsely acquired the marker AND had its wiring removed, the metrics data gap would be observable in runtime metrics (no stage-metrics produced).

Why LOW confidence (gap acknowledged):
- The existing test suite (`tests/metric-scan.test.mjs`) only checks `result.found === false` for the 7 real skills, which would STILL PASS if any of them gained the `kind: sub-skill` marker (both "properly wired" and "marker-skipped" return `found: false`).
- There is no explicit test asserting that the 7 real stage skills do NOT contain `kind: sub-skill`. This is a hardening opportunity, not a blocking gap.

Recommendation (non-blocking): add a test in `tests/metric-scan.test.mjs` that reads the 7 real SKILL.md files and asserts `kind: sub-skill` is ABSENT from their frontmatter. This would make the abuse vector detectable by CI.

### 3. Is the guard test NON-VACUOUS?

**YES, at HIGH confidence.**

`tests/m12-subskill-exclusion.test.mjs` has two independent test suites:

**(a) Marker present → skipped** (line 34-56):
- Creates a SKILL.md with `kind: sub-skill` marker and NO metrics wiring
- Asserts `expect(result.found).toBe(false)`
- Falsifiable: if the marker check in `scanSkillMetrics` is broken/removed, `found` returns `true` (the unwired skill IS flagged) → test fails

**(b) Marker absent → still flagged** (line 62-87):
- Creates a SKILL.md WITHOUT `kind: sub-skill` marker and NO metrics wiring
- Asserts `expect(result.found).toBe(true)` AND `expect(result.missingSkill).toMatch(/plain-skill/)`
- Falsifiable: if the scanner blindly skips ALL unwired skills (blanket bypass), `found` returns `false` → test fails

Both branches ran and passed (19/19 total with existing suite). Both are `it()` blocks that execute real `scanSkillMetrics()` calls — no filter-then-assert vacuity. The test correctly validates the "narrow gate" property: marker exclusion does NOT expand to a blanket unwired-skill skip.

### 4. Did the change weaken any OTHER check?

**NO, at HIGH confidence.**

The sub-skill early-return is inserted at lines 203-218 — BEFORE the existing wiring checks at lines 220-268. The logic flow:
1. Try to read SKILL.md (line 195-201)
2. NEW: if `kind: sub-skill` → early return `{ found: false }` (lines 203-218)
3. Otherwise, proceed with ALL existing checks (lines 220-268): recordSkeleton, updateOwnResult, collector.mjs, stage literal match, stage absence

Confirmed by full test suite (17 tests in `tests/metric-scan.test.mjs`, all passing):
- Positive tests: 7 real skills + "good-skill" fixture → `found: false` (PASS)
- Negative tests: fake-no-metric → found:true/flagged (PASS)
- Half-wired: only recordSkeleton → found:true/flagged (PASS)
- Other-half: only updateOwnResult → found:true/flagged (PASS)
- NEG-A: no collector.mjs → found:true/flagged (PASS)
- NEG-B: wrong stage literal → found:true/flagged (PASS)
- NEG-C: absent stage field → found:true/flagged (PASS)

Full repo scan: `check-stage-quality.mjs` exits 0, output: `PASS — quality-class blocking gates = 0, metric wiring = complete`. All 12 SKILL.md files (7 stage + 2 aux-wired + 3 sub-skill) are correctly classified.

### 5. Frontmatter parse robustness

**PASS, with minor note.**

Regex chain:
- `content.match(/^---\r?\n([\s\S]*?)\r?\n---/)` — captures YAML frontmatter block. `^` (no `/m` flag) anchors to position 0; only frontmatter at file start is captured. Non-greedy `([\s\S]*?)` ensures the FIRST closing `---` terminates.
- `frontBlock.match(/^kind:\s*([^\s#]+)/m)` — extracts the value of the `kind:` key. The `/m` flag allows line-start match within the frontmatter block. `[^\s#]+` stops at whitespace or `#` (inline comments are right-stripped).

Edge cases tested:
- `kind: sub-skill  # comment` → captures `sub-skill` (comment dismissed). OK.
- `kind:sub-skill` (no space) → captures `sub-skill` (`\s*` matches zero spaces). OK.
- Body text contains "sub-skill" → frontmatter regex captures only `---...---` block, body never scanned. OK.
- File with NO `---` frontmatter → `fmMatch` is null, entire skip block bypassed. OK.
- `kind: "sub-skill"` (quoted YAML string) → `replace(/^["']|["']$/g, "")` strips quotes. OK.
- `kind: sub-skill` with CRLF line endings → `\r?\n` handles both. OK.

Minor note: non-standard frontmatter delimiters (e.g., TOML `+++`) are not supported. This is acceptable — all SKILL.md files in the repo use YAML frontmatter with `---` delimiters, consistent with the `name:`/`description:` convention.

### 6. Consistency with plan S4 / FR-SKELETON-002

**PASS, at HIGH confidence.**

Plan S4 (line 55 of plan.md): "build-plan v1 保留 M6 的 metrics collector 调用（recordSkeleton + updateOwnResult），三子技能在 build-plan v1 流程内运行，其指标由主控 metrics 记录覆盖。"

FR-SKELETON-002 (spec.md line 334): "build-plan SKILL.md 中定义的 stage-result 契约和 metrics collector 调用（recordSkeleton + updateOwnResult，10 核心字段）必须保留不变。"

Evidence:
- `workflows/build-plan/SKILL.md` frontmatter: NO `kind` field present (confirmed). Has `name: build-plan` and `description: ...` only.
- `tests/metric-scan.test.mjs` line ~145: explicitly tests `build-plan/SKILL.md` → `result.found === false` (PASS).
- The scanner's sub-skill skip at line 215-216 returns `{ found: false }` only for the 3 sub-skills (plan-generate, tasks-generate, cross-artifact-analyze) — confirmed by `rg 'kind:\s*sub-skill'` finding only those 3 files.
- build-plan itself proceeds to normal wiring checks at lines 220-268 and passes via recordSkeleton + updateOwnResult + collector.mjs presence.

build-plan is NOT exempt from metrics enforcement. The change is consistent with both plan S4 and FR-SKELETON-002.

---

## Issues Found

### [MEDIUM] Abuse vector: marker on real stage skill undetectable by test suite
**File**: `scripts/check-stage-quality.mjs:215`
**Confidence**: LOW
**Issue**: The existing test suite asserts `scanSkillMetrics` returns `found: false` for the 7 real stage skills. Both "properly wired" and "marker-skipped" return `found: false`. If someone adds `kind: sub-skill` to a real stage skill, the test suite would still pass, making the abuse undetectable by CI.
**Fix**: Add a test in `tests/metric-scan.test.mjs` that reads the frontmatter of all 7 real stage skills and asserts `kind` field is either absent OR not equal to `"sub-skill"`.

### [LOW] No explicit `"stage"` frontmatter key on sub-skills
**File**: `workflows/plan-generate/SKILL.md:2`, `workflows/tasks-generate/SKILL.md:2`, `workflows/cross-artifact-analyze/SKILL.md:2`
**Confidence**: HIGH
**Issue**: The 3 sub-skills declare `kind: sub-skill` but do NOT have a `stage:` key in their frontmatter (unlike the 7 real stage skills which all have `name:` only). This is currently fine — the early return at line 216 skips the `stage` check entirely. But if future tooling expects every `workflows/*/SKILL.md` to carry a `stage` field (e.g., for auto-discovery), these 3 would be missing it.
**Fix**: Not blocking. Document that sub-skills intentionally omit `stage:` since they don't produce stage-results. Or optionally add `stage: sub-skill` (non-output stage) as a defensive convention.

---

## Positive Observations

1. The marker-gated design is principled: `kind: sub-skill` is an explicit, human-authored contract declaration, not a heuristic. This mirrors how `name:` and `description:` function in existing frontmatter conventions.

2. The guard test is well-designed with two independent, falsifiable branches — it validates the "narrow gate" property (exclusion does not expand to blanket unwired-skill skip).

3. The scanner change is a surgical insertion: one early-return block, no modification to any existing wiring check logic. The full test suite (17 + 2 = 19 tests) passes without modification.

4. Good documentation hygiene: the sub-skill SKILL.md files carry inline YAML comments explaining WHY the marker exists and that metrics are covered by the orchestrator per plan S4.

5. The `kindMatch` regex correctly handles inline comments (`#`), quoted values (`"..."`), and zero-space (`kind:sub-skill`) — small details that prevent false negatives.

---

## Recommendation

**APPROVE** — no changes required. The one MEDIUM issue (abuse vector undetectable by test suite) is low-confidence and non-blocking; hardening it is recommended but not a gate condition.

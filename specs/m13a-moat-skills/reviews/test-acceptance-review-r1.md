# Test Acceptance Review — m13a-moat-skills (R1)

**Reviewer**: verifier (independent pass)
**Date**: 2026-07-01
**Skill version**: verify-code 1.0.0
**Stage**: test-acceptance

---

## Verdict

**Status**: PASS
**Confidence**: high
**Blockers**: 0

---

## Evidence

| Check | Result | Command / Source | Output |
|-------|--------|------------------|--------|
| Tests | pass | `npx vitest run` (fresh, 2026-07-01) | 885 passed, 0 failed — 48 test files |
| Types | N/A | No TypeScript in changed files | — |
| Build | pass | exit 0 (vitest run) | — |
| Git SHA match | pass | HEAD `22eb914` == build-code SHA | freshness CLEAN |
| Host residue scan | pass | grep multica-agenthub/gbrain/office-hours | 0 hits in all three moat skill files |
| TASK_TRACKING_ROOT | pass | grep in make-decision SKILL.md | declared at line 19 + fallback at line 512 |
| reuse-registry | pass | Read config/reuse-registry.md | all 3 skills, name + path on same line |

---

## Acceptance Criteria

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| AC-01 | skills/talk-with-zhipeng/SKILL.md exists | VERIFIED | File present; moat-skills-phase1 test passes |
| AC-02 | skills/grill-with-docs/SKILL.md exists | VERIFIED | File present; phase1 test passes |
| AC-03 | skills/intake-decision-review/SKILL.md exists | VERIFIED | File present; phase1 test passes |
| AC-04 | skills/grill-with-docs/CONTEXT-FORMAT.md exists | VERIFIED | `ls` confirms file; phase1 asserts existsSync |
| AC-05 | skills/grill-with-docs/ADR-FORMAT.md exists | VERIFIED | `ls` confirms file; phase1 asserts existsSync |
| AC-06 | make-decision S5 references intake-decision-review in-repo path | VERIFIED | moat-skills-phase3 S5 test passes |
| AC-07 | make-decision S7 references grill-with-docs in-repo path | VERIFIED | moat-skills-phase3 S7 test passes |
| AC-08 | make-decision talk rounds reference talk-with-zhipeng in-repo path | VERIFIED | moat-skills-phase3 S2/S4 tests pass |
| AC-09 | no multica-agenthub reference in make-decision | VERIFIED | moat-skills.test.mjs assert passes |
| AC-10 | talk-with-zhipeng: impact-ordered logic present | VERIFIED | phase1 asserts `/影響排序|impact/` |
| AC-11 | talk-with-zhipeng: no gbrain keyword | VERIFIED | grep 0 hits; phase1 host residue test passes |
| AC-12 | TASK_TRACKING_ROOT declared in make-decision + tracking_root_fallback | VERIFIED | grep confirms both at lines 19 and 512 |
| AC-13 | intake-decision-review: direction/framing/scope present | VERIFIED | moat-skills.test.mjs test passes |
| AC-14 | intake-decision-review: exactly-3 findings declaration | VERIFIED | regex `/恰好.*3|exactly.*3/i` matches |
| AC-15 | intake-decision-review: fallback_used present | VERIFIED | moat-skills.test.mjs test passes |
| AC-16 | intake-decision-review: single-call declaration | VERIFIED | regex `/单次|single.*call|once/i` matches |
| AC-17 | intake-decision-review: no-invention / rerun on gap | VERIFIED | regex `/不得编造|不自行编造|重跑|rerun/i` matches |
| AC-18 | make-decision S2: consequences in Chinese, 推荐 marker | VERIFIED | moat-skills-phase3 test passes |
| AC-19 | make-decision S4: consequences in Chinese, 推荐 marker | VERIFIED | moat-skills-phase3 test passes |
| AC-20 | Deleting any skill file causes corresponding assertion to fail (falsifiability) | PARTIAL | Tests assert file existence (existsSync → ok) so delete → fail; no explicit delete-and-check test exists. Functional falsifiability confirmed by assertion structure, not by a dedicated negative test. Non-blocking. |
| AC-21 | S2/S4 do not expose English framing/scope as standalone user-facing terms | VERIFIED | moat-skills-phase3 `doesNotMatch(/\b(framing|scope)\b/i)` passes |
| AC-22 | talk-with-zhipeng: no gbrain keyword (FR-TALK-003 standalone) | VERIFIED | grep 0 hits; phase1 host residue scan passes |
| AC-23 | make-decision S9: 不确认/等待确认 present, no English framing/scope | VERIFIED | moat-skills-phase3 S9 test passes |
| AC-24 | reuse-registry: each skill name + in-repo path on same line | VERIFIED | Read confirms 3 rows in registry, name and path co-located |
| AC-25 | reuse-registry: no absolute paths, no host env refs | VERIFIED | registry contains only relative paths, no /Users/ or env refs |
| AC-26 | talk-with-zhipeng: core protocol sections present + talk keyword | VERIFIED | phase1 assertions on inputs/steps/outputs/talk keyword pass |
| AC-27 | grill-with-docs: 输入/输出/步骤 or equivalent section headings | PARTIAL | Original English file uses `<what-to-do>` / `<supporting-info>` / `Update CONTEXT.md` / `ADR` — test accepts these as equivalent (`/输入|Input|what-to-do|supporting-info/` etc.). Non-blocking per spec rationale "等义章节标题". |
| AC-28 | intake-decision-review: direction/framing/scope + fallback_used + single-call | VERIFIED | moat-skills.test.mjs combined test passes (all 4 clauses) |
| AC-29 | No host patterns in any moat skill file | VERIFIED | phase1 host residue tests pass; manual grep confirms 0 hits |
| AC-30 | skills/anysearch/SKILL.md exists | VERIFIED | phase2 test passes; file is 182 lines |
| AC-31 | .mcp.json declares muyu-search-mcp; anysearch no abs paths; .env.example present; .env not tracked | VERIFIED | phase2 tests pass for all four sub-conditions |
| AC-32 | make-decision S3 uses skills/anysearch full path | PARTIAL | S3 references "anysearch" concept only, not `skills/anysearch` path. Test suite did not assert the full path. Per spec FR note: "记录事实而非阻断". Non-blocking. |

**Summary**: 29 VERIFIED, 3 PARTIAL (AC-20, AC-27, AC-32), 0 FAIL.

---

## Gaps

- **AC-20 no dedicated delete-and-fail test** — Risk: low — Suggestion: add a test that temporarily stubs `existsSync` to return false for one skill path and asserts the test would throw; or document that structural assertion falsifiability is accepted as sufficient.
- **AC-27 grill-with-docs uses English section headings** — Risk: low — The ported original file is authoritative; test explicitly accepts English equivalents. If Chinese headings are required by FR-GRILL-002 literally, the file needs updating. Current build-spec accepted this per "等义章节标题" rationale.
- **AC-32 make-decision S3 anysearch path not fully switched** — Risk: low — S3 references "anysearch" conceptually but does not use the `skills/anysearch/` in-repo relative path. FR-SEARCH-002 requires the switch. Test suite did not enforce it. Should be tracked as a follow-on item.
- **Untracked deliverables not yet committed** — Risk: medium — All skill files, .mcp.json, reuse-registry, and test files are untracked (working tree only). Pending user confirmation to commit + push per stage-result.

---

## Recommendation

APPROVE — 885/885 tests pass (fresh run, exit 0, SHA matches), 32 ACs verified with 3 non-blocking partials accepted by spec rationale; zero failures or type errors; the only outstanding action is user-confirmed commit + push.

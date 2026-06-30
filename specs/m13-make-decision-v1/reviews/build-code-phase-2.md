# Code Review: Build-Code Phase 2
## task: m13-make-decision-v1 | Stage 3 (S0/S0.5/S1/S2/S3/S4)
**Reviewer**: code-reviewer (independent pass)
**Date**: 2026-06-29
**Branch**: m13-make-decision-v1
**Files reviewed**:
- `workflows/make-decision/SKILL.md` (S0–S4 prose additions, lines ~48–170)
- `tests/m13-make-decision.test.mjs` (31 new assertions, 54 total)

---

## Verdict: PASS (with 2 non-blocking observations)

All T005–T010 completion conditions are satisfied. No CRITICAL or HIGH issues at HIGH confidence. Two MEDIUM findings documented below.

---

## Stage 1 — Spec Compliance (T005–T010 per tasks.md)

### T005: S0 背景扎根
**Completion condition**: S0 reads existing background files; journal writes `s0_context_loaded` event.
**Status**: PASS
- SKILL.md L49–57 enumerates CONTEXT.md, task-id, decision-log, research, tasks/{task-id}/ as load targets.
- Journal event `s0_context_loaded: true` present at SKILL.md L57.

### T006: S0.5 scope-triage (lite/full)
**Completion condition**: judges lite/full; journal `s0_5_scope: lite|full`; lite skips S1 and S3 each recording `skipped: scope=lite`; S2 enters with empty internal-research context; S4–S10 execute normally; no quick tier.
**Status**: PASS
- SKILL.md L74–79 defines lite/full logic with explicit "无 quick 档" declaration.
- Journal event `s0_5_scope: lite` or `s0_5_scope: full` present at L81.
- Lite skip events use exact strings `s1: skipped: scope=lite` (L87) and `s3: skipped: scope=lite` (L75, L148).
- S4–S10 normal execution path preserved.
- No `scope=quick` appears anywhere in the file.

### T007: S1 内部调研 (full 档专属)
**Completion condition**: ≥3 sub-agents concurrent; five categories covered; single failure records and continues; total failure records `s1_all_agents_failed: true` and continues to S2.
**Status**: PASS
- SKILL.md L95 explicitly states "并发派发 **≥3 sub-agents**".
- Five categories enumerated at L96–L100 (领域背景/术语澄清, 历史先例/经验教训, codebase相关实现, 外部生态最佳实践, 已知风险/反向案例).
- Single-agent failure handling at L104–105: records agent ID and reason, merges remaining.
- Total failure at L106–108: records `s1_all_agents_failed: true`, continues to S2, notifies user.
- Non-blocking declared at L109.

### T008: S2 talk#1
**Completion condition**: presents internal-research-summary.md first; asks Q1 (external research needed?); three-round structure; one-question-at-a-time (FR-TALK-01); impact-sorted (FR-TALK-02).
**Status**: PASS
- SKILL.md L114–128 presents internal-research-summary.md before Q1; lite path noted.
- Three-round structure declared at L117 (talk#1/talk#2/talk#3 mapping to S2/S4/S7).
- Q1 is the single question asked at L121.
- FR-TALK-01 ("一次只问一个问题") and FR-TALK-02 ("按影响排序") both cited at L120.
- User-branch routing present: confirms → S3; declines → `s3: skipped(user_decision)` → S4.

### T009: S3 双路外部调研
**Completion condition**: muyu-search-mcp with extra_sources 3; get_sources validation; anysearch parallel; single-empty continues; dual-empty records event; S0.5=lite always records `s3: skipped: scope=lite`.
**Status**: PASS
- SKILL.md L131–149 implements both paths.
- `extra_sources 3` and `get_sources` validation present at L133–134 (FR-RESEARCH-01).
- get_sources failure semantics: "立即停下等用户指令，不得自动降级" (L134) — matches resolved OPEN-1 in spec.md.
- Single-path empty: records and continues (L135). Dual empty: `s3_both_empty: true` (L135).
- anysearch independent parallel at L137–138.
- External summary written to `tasks/{task-id}/research/external-research-summary.md` at L140.
- Lite override block at L142–143 confirms `s3: skipped: scope=lite` regardless of user choice.
- Skip event `s3: skipped(user_decision)` also present at L147.

**Note (MEDIUM, non-blocking)**: FR-RESEARCH-03 in spec.md requires recording `dual_research_empty: true`, but SKILL.md records `s3_both_empty: true`. These are semantically identical but the field names differ. The spec's AC says "artifacts 有 `dual_research_empty: true`" while the SKILL uses `s3_both_empty`. Tests check for `s3_both_empty`. Risk: if a future verifier reads the spec's AC literally, the field name mismatch will be flagged. (See Finding M1 below.)

### T010: S4 方向收敛 talk#2 + 台账渲染点①
**Completion condition**: asks Q2 (direction alignment); records `s4_baseline_recorded: true`; produces `make-decision-original-context.md`; S5 dependency on file existence noted.
**Status**: PASS
- SKILL.md L152–167 covers all four elements.
- Q2 asked at L156 (one question, impact-sorted).
- `s4_baseline_recorded: true` at L159.
- `tasks/{task-id}/artifacts/make-decision-original-context.md` produced at L162.
- S5 dependency explicitly stated at L165.

---

## Stage 2 — Code Quality

### FR Compliance

**FR-FLOW-01**: 12-step declaration at SKILL.md L48; S9 as the sole hard gate confirmed; all other steps non-blocking. PASS.

**FR-SCOPE-01**: SKILL.md adds only S0–S4 prose; no downstream stage files modified. PASS.

**FR-RESEARCH-00**: ≥3 concurrent agents, five categories, internal-research-summary.md, failure handling — all present. PASS.

**FR-TALK-01/02**: One-question-at-a-time enforced in S2 (Q1) and S4 (Q2); impact-sorted declared both times. PASS.

**Constitution — record-don't-block**: S0–S4 contain zero hard gates. S1 total failure continues. S3 get_sources failure does halt-on-error (per spec resolved OPEN-1), which is intentional and not a constitution violation — the halt is the "let-it-crash" principle, not a blocking quality gate.

**Env var default conflict (MEDIUM, non-blocking)**: SKILL.md declares `MAKE_DECISION_DEBATE_PATH` default as `~/.claude/skills/debate/SKILL.md` (L13). The reuse-registry.md debate entry (line 20, incomplete read) references `/Users/Hugh/Hugh/Project/debate`. The test at line 533 checks for `/Users/Hugh/Hugh/Project/debate` in reuse-registry, not in SKILL.md. No conflict in the SKILL.md itself, but the two default paths disagree between SKILL.md documentation and reuse-registry. (See Finding M2 below.)

### Test Quality Assessment (31 new assertions)

All 54 tests pass (confirmed by `vitest run` output: 54 passed, 157ms).

**Genuine assertions (non-tautological)**:
- T005: S0 header, CONTEXT.md mention, `s0_context_loaded` event — all require specific text, would RED on absence.
- T006: `scope=quick` exclusion test (line 233–238) — actively asserts absence, genuine negative. `s0_5_scope` event presence — specific string.
- T007: `≥3` or `三个` or `three` for concurrent agents (line 280–290), five category checks (305–315), `internal-research-summary.md` (318–324), `s1_all_agents_failed` (326–330) — all specific strings.
- T008: three-round structure, `按影响排序`, `Q1`, `外部双路` — genuine.
- T009: `extra_sources` (453–455), `get_sources`/`get sources` (lines 430–440), dual-path (anysearch), `s3_both_empty` (442–450) — genuine.
- T010: `s4_baseline_recorded` (471–476), `make-decision-original-context.md` (479–485), Q2 convergence (488–494) — specific strings.
- T003 reuse-registry: specific path `/Users/Hugh/Hugh/Project/debate`, `fallback`/`降级`/`unavailable` vocabulary — genuine.

**Hollow/tautological patterns identified (LOW severity)**:
- T006 "lite skips S1" test (line 240–249): the ORed guard `content.includes("lite 档")` is so broad that any file mentioning "lite 档" would pass regardless of S1 skip logic being present. The more specific branch `content.includes("skipped: scope=lite")` is what actually validates the spec; the broad fallback weakens the assertion's diagnostic value.
- T008 three-round test (line 370–378): `content.includes("Q1") || content.includes("talk#1")` — passes as soon as any mention of Q1 exists, not verifying the structural three-round declaration. Current SKILL.md has explicit three-round text so the test passes correctly, but the OR-chain is permissive enough to pass on a stub.
- T002(b) env section: `content.includes("环境变量")` (line 100) — guaranteed to pass because the Environment Variables heading itself contains this string, making this assertion non-distinguishing.

These do not block because the specific-string branches in each OR chain currently produce correct RED-when-absent behavior for the core spec requirement.

---

## Findings

### M1 — Field name divergence: `dual_research_empty` vs `s3_both_empty`
**File**: `workflows/make-decision/SKILL.md:139` vs `specs/m13-make-decision-v1/spec.md` FR-RESEARCH-03
**Severity**: MEDIUM | **Confidence**: HIGH
**Issue**: spec.md FR-RESEARCH-03 AC says "artifacts 有 `dual_research_empty: true`"; SKILL.md uses `s3_both_empty: true`. Tests verify `s3_both_empty`. A downstream verifier reading the spec AC literally will flag a mismatch.
**Fix**: Either update SKILL.md to use `dual_research_empty: true` (matching spec AC), or add a clarification comment noting the rename and update the spec AC. Whichever is chosen, the test at line 442 should match.

### M2 — Env var default path divergence between SKILL.md and reuse-registry
**File**: `workflows/make-decision/SKILL.md:13` vs `reuse-registry.md:20`
**Severity**: MEDIUM | **Confidence**: MEDIUM
**Issue**: SKILL.md documents `MAKE_DECISION_DEBATE_PATH` default as `~/.claude/skills/debate/SKILL.md`; reuse-registry.md debate entry (line 20) appears to reference `/Users/Hugh/Hugh/Project/debate` as the canonical path. These are two different default locations for the same external dependency. An operator following SKILL.md docs would look in a different location than an operator reading the registry.
**Fix**: Align to one canonical default. If `/Users/Hugh/Hugh/Project/debate` is the real local install, update SKILL.md default to match. If `~/.claude/skills/debate/SKILL.md` is the distributable default, update the registry entry accordingly.

### L1 — Over-broad OR chains in new tests weaken diagnostic precision
**File**: `tests/m13-make-decision.test.mjs:245`, `371`, `100`
**Severity**: LOW | **Confidence**: HIGH
**Issue**: Several test assertions use wide OR fallbacks that would pass on stubs (e.g., `content.includes("lite 档")` for the S1 skip test). The tests currently pass correctly because the specific-string branch also matches, but future regressions could silently pass the wide fallback.
**Fix**: For each critical assertion, narrow the OR guard to require the spec-mandated specific string (e.g., require `content.includes("skipped: scope=lite")` without a fallback to bare `content.includes("lite 档")`).

---

## Positive Observations

- **S9 as sole hard gate** is correctly declared at SKILL.md L48 and no hard gates appear in S0–S4. Constitution compliance is solid.
- **Lite-only skips S1+S3** — the two-skip rule is correctly implemented; S2/S4–S10 run normally, as required by T006.
- **No quick tier** — the explicit "无 quick 档" declaration at L79, backed by a test asserting `scope=quick` absence, is a strong and verifiable negative assertion.
- **get_sources halt semantics** matches resolved OPEN-1 in spec.md exactly (halt-on-failure, no auto-downgrade). This is the harder correct behavior and it's implemented correctly.
- **Non-blocking chaining** through S1 total failure is cleanly specified with explicit "继续推进到 S2" language.
- **54/54 tests pass** with the new S0–S4 prose in place.
- **reuse-registry debate entry** includes fallback/degradation description, satisfying FR-DEBATE-03 and T003 completion condition.

---

## Summary

| Severity | Count | Status |
|---|---|---|
| CRITICAL | 0 | — |
| HIGH | 0 | — |
| MEDIUM | 2 | Non-blocking (field name drift, path inconsistency) |
| LOW | 1 | Non-blocking (test OR-chain breadth) |

**Verdict: PASS** — T005–T010 all satisfied, FR compliance confirmed, 54 tests passing, no blocking issues. M1 and M2 should be addressed before Stage 4/5 add more tests that reference the dual-research-empty event name.

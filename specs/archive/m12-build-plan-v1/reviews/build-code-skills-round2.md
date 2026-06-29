# Code Review: build-plan v1 三技能 + 测试 (Round 2 — R1 Re-fix Verification)

**Review Date**: 2026-06-29
**Reviewer**: code-reviewer (Claude deepseek-v4)
**Source**: same_source (heterologous downgrade; 3rd-review codex/gemini unreachable, no standalone.sh found)
**Scope**: 2 test files (m12-plan-generate.test.mjs, m12-cross-artifact-analyze.test.mjs) — verifying R1 fixes for vacuous-test findings

---

## R1 Finding Closure Confirmation

### R1 Finding #1: `tests/m12-plan-generate.test.mjs` — Speckit-plan body test vacuity

| Aspect | R1 (BROKEN) | R2 (FIXED) |
|--------|-------------|------------|
| Filter | `!l.includes("speckit-plan")` blanket-removed ALL lines with the token | `!(l.includes("speckit-plan") && provenanceWord.test(l))` — only exempts lines with BOTH token AND provenance word |
| Vacuity | Assertion could never fail — the filtered token was never checked | Assertion CAN fail — a non-provenance "使用 speckit-plan" line passes the filter and triggers the negative check |

**Provenance words**: 改造自, 改编自, 保留, 解耦, 原版, 迁移, adapted, decoupled, migrated, original

**Trace against current SKILL.md content** (file: `workflows/plan-generate/SKILL.md`):

| Line | Content | Why exempted |
|------|---------|-------------|
| 3 | `description: ... Adapted from speckit-plan ...` | Stripped by YAML frontmatter remover `body.replace(/^---[\s\S]*?---\r?\n/, "")` |
| 8 | `> 本文件改造自 speckit-plan，适配为 workflowhub 契约：` | Blockquote filter: `!l.startsWith(">")` |
| 36 | `4. **填充 plan.md 步骤**（保留 speckit-plan 核心流程...` | Provenance: "speckit-plan" AND "保留" |
| 68 | `本 skill 已从 speckit-plan 解耦，硬性约束如下：` | Stripped by 去耦约束 section remover OR provenance ("解耦") |

**Non-vacuity proof** (contrived violation "使用 speckit-plan 生成计划"):
1. Does NOT start with `>`, `<!--`, or `#` → stays in filter
2. Contains "speckit-plan" but NO provenance word → provenance exemption does NOT apply
3. Passes through to `cleaned` → `cleaned.includes("speckit-plan")` is TRUE → assertion FAILS
4. **NON-VACUOUS** ✓

**Verdict: CLOSED** ✓

---

### R1 Finding #2: `tests/m12-cross-artifact-analyze.test.mjs` — Speckit-analyze body test vacuity

| Aspect | R1 (BROKEN) | R2 (FIXED) |
|--------|-------------|------------|
| Filter | `!l.includes("speckit-analyze")` blanket-removed ALL lines | `!(l.includes("speckit-analyze") && provenanceWord.test(l))` — only exempts provenance lines |
| Vacuity | Assertion could never fail | Assertion CAN fail — non-provenance "调用 speckit-analyze" triggers failure |

**Trace against current SKILL.md content** (file: `workflows/cross-artifact-analyze/SKILL.md`):

| Line | Content | Why exempted |
|------|---------|-------------|
| 3 | `description: ... 改造自 speckit-analyze ...` | Stripped by YAML frontmatter remover |
| 8 | `> 本文件改造自 speckit-analyze，适配为 workflowhub 契约：` | Blockquote filter |
| 141 | `本 skill 已从 speckit-analyze 解耦，硬性约束如下：` | Stripped by 去耦约束 section OR provenance ("解耦") |
| 144 | `speckit-analyze 原版依赖外部 memory/constitution.md...` | Provenance: "speckit-analyze" AND "原版" |

**Non-vacuity proof** (contrived violation "调用 speckit-analyze 进行交叉分析"):
1. Does NOT start with `>`, `<!--`, or `#` → stays
2. Contains "speckit-analyze" but NO provenance word → NOT exempted
3. `cleaned.includes("speckit-analyze")` is TRUE → assertion FAILS
4. **NON-VACUOUS** ✓

**Verdict: CLOSED** ✓

---

## Provenance Exemption Breadth Audit

**Concern**: Could over-broad provenance word matching re-create vacuity by exempting real violations?

**Word-by-word analysis**:

| Word | Risk of exempting a real violation | Assessment |
|------|-----------------------------------|------------|
| 改造自 / 改编自 | Zero — these are explicit "adapted from" markers | Safe |
| 保留 | Low — "speckit-plan" + "保留" naturally means "retain (compatibility with)" = provenance statement | Safe |
| 解耦 | Low — in workflowhub, "解耦" + "speckit-plan" means "decouple from speckit-plan" = the migration story itself | Safe |
| 原版 | Zero — "原版" = "original version", explicit provenance signal | Safe |
| 迁移 | Zero — explicit migration signal | Safe |
| adapted / decoupled / migrated / original | Zero — English equivalents of above | Safe |

**Cross-contamination test** — would any of these words naturally appear in a CALLABLE workflow step using "speckit-*" as a skill identifier?

- "使用 speckit-plan 保留现有配置" → exempted. But "保留现有配置" is semantically about compatibility/migration, not a fresh workflow step invoking speckit-plan as a skill.
- "使用 speckit-plan 解耦相关流程" → exempted. But "解耦相关流程" still talks about the decoupling FROM speckit-plan.
- A truly callable step like "使用 speckit-plan 生成计划" or "调用 speckit-plan 执行分析" — these contain NO provenance word → NOT exempted → caught. ✓

**Conclusion**: The provenance exemption matches FR-MIG-001's narrow-scope rule (~spec lines 217-220: exempt 迁移说明/provenance 脚注). It is NOT broad enough to re-create vacuity. No word in the set would plausibly appear in a callable "使用 speckit-plan" workflow step that was NOT a provenance/migration note.

---

## Test Execution

```
$ npx vitest run tests/m12-plan-generate.test.mjs tests/m12-cross-artifact-analyze.test.mjs

 ✓ tests/m12-plan-generate.test.mjs (10 tests) 2ms
 ✓ tests/m12-cross-artifact-analyze.test.mjs (25 tests) 3ms

 Test Files  2 passed (2)
      Tests  35 passed (35)
```

Both test files pass cleanly, including both previously-vacuous assertions (plan-generate test at line 137, cross-artifact-analyze test at line 272).

---

## Issues (New)

None. No new blocking or non-blocking findings identified.

---

## Positive Observations

1. **Fix precisely matches R1's requested filter structure**: `startsWith(">")`, `startsWith("#")`, `startsWith("<!--")`, and provenance-word line exemption — while correctly REMOVING the blanket `!l.includes("speckit-*")` filter. The implementer added `## 去耦约束` section stripping as a bonus defense layer, which correctly handles the section header and its contained provenance lines.

2. **Assertion messages are self-documenting**: Both tests now include assertion messages that explicitly state the exemption rules and include a canary hint (`"a callable '使用 speckit-plan' step must fail this check"`) — making it clear to future readers what is and is not exempted.

3. **All 35 tests pass against the current good SKILL.md**: No regressions, no false positives, no false negatives.

---

## Recommendation

**VERDICT: PASS**

Both R1 blocking findings are confirmed closed. The corrected filter logic is non-vacuous — it CAN and WILL fail on a genuine violation (setting `name: speckit-plan` in frontmatter, or adding a callable "使用 speckit-plan" workflow step), while correctly exempting provenance/comment/migration lines per FR-MIG-001.

**R1 findings closed**: 2/2
**New blocking findings**: 0
**Engine**: Claude deepseek-v4 (same_source — 3rd-review codex/gemini unreachable)

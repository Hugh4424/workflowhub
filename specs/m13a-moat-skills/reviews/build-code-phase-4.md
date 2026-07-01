# Phase 4 (Stage 3) — 3rd-Party Code Review

**Reviewer:** code-reviewer (heterologous, separate context)
**Scope:** T007 `tests/moat-skills.test.mjs`, T008 `config/reuse-registry.md`
**Date:** 2026-07-01

---

## Code Review Summary

**Files Reviewed:** 3 (test file, registry, .mcp.json for MCP check)
**Total Issues:** 4

### By Severity
- CRITICAL: 0
- HIGH: 0
- MEDIUM: 1 (MCP secret-absence assertion missing — spec says "no literal secrets" but test does not assert it)
- LOW: 3

---

## Check A — 8 Required Assertion Categories

### A1. File existence (5 files: 3 moat skills + anysearch + .mcp.json)
**PASS.** `tests/moat-skills.test.mjs:76-80` loops over `skillPaths` (4 SKILL.md entries) plus `.mcp.json` and calls `assert.ok(existsSync(...))` for each.

### A2. Frontmatter `name` field non-empty for all 4 skills
**PASS.** `tests/moat-skills.test.mjs:82-86` loops over all 4 skill paths and calls `assertNonEmptyFrontmatterName()`, which extracts YAML frontmatter and asserts a `name: <non-empty>` line exists.

### A3. make-decision SKILL.md reference paths (S5→intake-decision-review, S7→grill-with-docs, talk-with-zhipeng present)
**PASS.** Three distinct tests at lines 92-103:
- S5 section matched against `/skills\/intake-decision-review/`
- S7 section matched against `/skills\/grill-with-docs/`
- Full file matched against `/skills\/talk-with-zhipeng/` and negative assertion for `multica-agenthub`

The `section()` helper regex uses `\n## S\d` as the stop boundary. For S5 (next heading is `## S6`) and S7 (next heading is `## S8`), both have single-digit successors, so the stop condition fires correctly. No functional defect for the tested sections. (Noted as LOW — see issues below.)

### A4. Three-angle structure (direction/framing/scope) in intake-decision-review
**PASS.** `tests/moat-skills.test.mjs:109-113` uses three `assert.match()` calls with bilingual alternatives for each angle (`direction|方向`, `framing|框架`, `scope|范围`).

### A5. Behavioural contracts (exactly-3, fallback_used, single-call, no-fabricate)
**PASS.** `tests/moat-skills.test.mjs:115-120`:
- `exactly-3`: `/恰好.*3|exactly.*3|findings.*length.*3|3.*findings/i`
- `fallback_used`: `/fallback_used/`
- `single-call`: `/单次|single.*call|once/i`
- `no-fabricate`: `/不得编造|不自行编造|缺角度|重跑|rerun/i`

All four patterns present.

### A6. Host dependency scan (no multica-agenthub/gbrain/office-hours in any skill dir)
**PASS.** `tests/moat-skills.test.mjs:123-142` tests all four skill directories via `assertNoPatternInFiles()` with `/multica-agenthub|gbrain|office-hours/`. anysearch also gets the absolute path scan.

### A7. MCP entry (muyu-search-mcp key in .mcp.json, no literal secrets)
**PARTIAL PASS — MEDIUM finding.** The test at lines 144-151 asserts:
1. Content matches `/muyu-search-mcp/` — PASS
2. `config.mcpServers["muyu-search-mcp"]` object exists — PASS

However, the spec requirement "no literal secrets" is NOT asserted by the test. The test does not contain any assertion that rules out a hardcoded key value. Mitigation: the actual `.mcp.json` uses `${VAR}` placeholder strings for all three API keys (`MUYU_API_KEY`, `TAVILY_API_KEY`, `FIRECRAWL_API_KEY`), so no literal secret is present in the file at review time. The gap is that the test would pass even if a real key were inlined — the assertion is weaker than the spec wording implies.

### A8. anysearch absolute path scan (no /Users/ or /home/ in skills/anysearch/)
**PASS.** `tests/moat-skills.test.mjs:138-141` calls `assertNoPatternInFiles("skills/anysearch", /\/Users\/|\/home\//, "absolute local paths")` in addition to the host-pattern check.

**A summary: 7/8 categories fully pass; A7 passes functionally but the test is weaker than the spec wording.**

---

## Check B — reuse-registry.md entries

**PASS.** `config/reuse-registry.md` contains all three required entries with correct in-repo relative paths:
- `talk-with-zhipeng` | `skills/talk-with-zhipeng/`
- `grill-with-docs` | `skills/grill-with-docs/`
- `intake-decision-review` | `skills/intake-decision-review/`

---

## Check C — No forbidden paths in config/reuse-registry.md

**PASS.** The registry contains no `/Users/`, `/home/`, `~/.claude`, `multica-agenthub`, `gbrain`, or `office-hours` strings. Only relative backtick-quoted paths are present.

---

## Check D — Diff scope

**PASS.** The patch (`/tmp/phase-4-diff.patch`) touches exactly:
- `tests/moat-skills.test.mjs` (new file)
- `config/reuse-registry.md` (new file)
- `specs/m13a-moat-skills/evidence/phase-4-RED.json` and supporting files
- `specs/m13a-moat-skills/evidence/phase-4-GREEN.json` and supporting files
- `specs/m13a-moat-skills/evidence/phase-result.json`

No files outside `tests/`, `config/`, and `specs/m13a-moat-skills/evidence/` are touched. The diff does not include `phase-4-diff.patch` itself (the patch file is referenced in `phase-result.json` by path, not re-diffed — this is correct).

---

## Check E — Tests are non-vacuous

**PASS.** Assertions test actual file content, not just file existence:
- Frontmatter name extraction parses YAML and checks a regex on the value
- Section content is extracted by regex and matched against path patterns
- Behavioural contract checks match against multi-alternative regexes
- Registry assertions use a constructed `RegExp` to verify name+path appear on the same line

The GREEN run reports 14 tests passed, all exercising real content. RED failed because `config/reuse-registry.md` was missing — confirming the test was genuinely sensitive before the fix.

---

## RED/GREEN Evidence Assessment

- RED (`exit_code: 1`): Failed with `AssertionError: Missing required file: config/reuse-registry.md` — correct failure mode, the test was not trivially green.
- GREEN (`exit_code: 0`): 14 tests passed after registry was added.
- `content_hash` differs between RED and GREEN captures — satisfies the false-green guard.

---

## Issues

### [MEDIUM] MCP test does not assert absence of literal secrets
**File:** `tests/moat-skills.test.mjs:144-151`
**Confidence:** HIGH
**Issue:** The spec for check A7 requires "no literal secrets." The test verifies the key `muyu-search-mcp` exists and parses, but has no assertion ruling out hardcoded API key values. The actual `.mcp.json` is clean (all values are `${VAR}` placeholders), so there is no current secret leak. But the test gap means a future commit that inlines a real key would still pass the acceptance suite.
**Fix:** Add inside the same test block: `assert.equal(/["']\w{20,}["']/.test(content), false, ".mcp.json must not contain literal API key values")` or a more targeted pattern like `assert.equal(/:\s*["'][a-zA-Z0-9_\-]{32,}["']/.test(content), false, "no hardcoded secrets")`.

### [LOW] `section()` regex stop-condition uses `\n## S\d` (single digit only)
**File:** `tests/moat-skills.test.mjs:60-65`
**Confidence:** MEDIUM
**Issue:** The regex boundary `\n## S\d` matches section headings with a single digit. If a section like `## S10` immediately follows the section being extracted (e.g., if `## S9` were tested), the stop would not fire, and the extracted text would bleed into `## S10`. For the currently tested sections (S5 next→S6, S7 next→S8), both successors are single-digit, so there is no practical bug today. However, `## S10` exists in the file and the regex would fail to stop at it for a hypothetical `## S9` test.
**Fix:** Change `\n## S\\d` to `\n## S\\d+` (or `\n## S[0-9]+`) in the regex on line 62.

### [LOW] `assertNoPatternInFiles` silently skips empty directories
**File:** `tests/moat-skills.test.mjs:50-58`
**Confidence:** LOW
**Issue:** If a skill directory exists but is empty, `listFilesRecursive` returns an empty array and the loop body never executes. The test would vacuously pass with no assertions fired. The directory existence check (`assert.ok(existsSync(root), ...)`) does fire, but does not guarantee any files are present.
**Fix:** After `walk(root)`, add `assert.ok(files.length > 0, `${relativeDir} must contain at least one file`)` inside `listFilesRecursive`, or add a pre-check in `assertNoPatternInFiles`.

### [LOW] Registry test asserts `relativePath.startsWith("/") === false` on a hardcoded string
**File:** `tests/moat-skills.test.mjs:170`
**Confidence:** HIGH
**Issue:** The assertion `assert.equal(relativePath.startsWith("/"), false, ...)` checks the local `relativePath` variable that is defined inline in the test's `expectedEntries` array — it is always a relative string. This assertion can never fail regardless of what the registry actually contains. It does not verify that the registry's recorded path is relative; it only verifies the test's own constant.
**Fix:** The assertion should be applied to the value extracted from `registry`, not to the hardcoded `relativePath` constant. Alternatively, the registry-content regex match already implicitly enforces this if the pattern were anchored appropriately.

---

## Open Questions (low-confidence findings — surfaced, not blocking)

None.

---

## Positive Observations

- The `section()` helper is cleanly abstracted and reusable for future section-level tests on SKILL.md files.
- Bilingual regex alternatives (`direction|方向`, `framing|框架`, `scope|范围`) make the behavioral contract tests robust to English-or-Chinese SKILL.md content — good forward-compatibility.
- The `assertNoPatternInFiles` helper correctly recurses into subdirectories, so nested files in skill dirs are not missed.
- RED/GREEN evidence is well-structured: separate JSON capture files, distinct content hashes, stderr preserved — a clear audit trail.
- Registry entries use backtick-quoted relative paths throughout; no absolute paths or host references anywhere in the file.
- All API key values in `.mcp.json` use `${VAR}` placeholder strings — no hardcoded secrets are present at review time.
- The test count (14) matches the number of `test()` blocks in the file — no orphaned or skipped tests.

---

## Recommendation

**COMMENT** — No CRITICAL or HIGH issues. The implementation satisfies all 8 required assertion categories, the diff is correctly scoped, RED/GREEN evidence is valid, and the registry is clean. Three LOW findings and one MEDIUM finding are noted. The MEDIUM gap (MCP test does not assert absence of literal secrets) is worth closing but does not block — the actual `.mcp.json` is currently clean, and the GREEN run is genuine.

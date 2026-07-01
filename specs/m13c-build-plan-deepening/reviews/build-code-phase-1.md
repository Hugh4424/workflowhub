# build-code phase-1 review — m13c-build-plan-deepening

---

## Round 1 (prior — blocking)

Two blocking issues found:

1. **BLOCKER-1** `skills/spec-research/SKILL.md` did not reference `FR-RESEARCH-001`.
2. **BLOCKER-2** `core/task-dir-parser.mjs` catch block swallowed all errors silently (no ENOENT distinction, no re-throw).

---

## Round 2 — 2026-07-01

### Evidence collected

| Check | Result | Command / Source |
|-------|--------|-----------------|
| FR-RESEARCH-001 in SKILL.md | PASS | `grep FR-RESEARCH-001 skills/spec-research/SKILL.md` → line 5, header sentence |
| catch ENOENT distinction | PASS | Lines 59-65: `if (err.code === "ENOENT") return DEFAULT_TASK_DIR; throw err;` |
| Tests green | PASS | `npx vitest run core/task-dir-parser.test.mjs` → 2/2 passed, 138ms |
| No new issues introduced | PASS | Full diff reviewed — no swallowed errors, no stub code, no test.skip |

### Fix verification

**BLOCKER-1 resolved.** `skills/spec-research/SKILL.md` line 5 now reads:

> "Phase 0 Research Skill。对应 **FR-RESEARCH-001**：新建 `skills/spec-research/SKILL.md`..."

The reference appears in the overview section and is the load-bearing anchor for the skill identity.

**BLOCKER-2 resolved.** The catch block at lines 59-65 of `core/task-dir-parser.mjs`:

```javascript
} catch (err) {
  // FR-RESEARCH-002 / fail-loud: only missing config is a fallback;
  // any other I/O error must propagate instead of being swallowed.
  if (err && err.code === "ENOENT") {
    return DEFAULT_TASK_DIR;
  }
  throw err;
}
```

ENOENT → fallback (expected: file not found = no config). All other errors → re-throw (fail-loud). This is correct and matches the spec.

Note: the catch comment references `FR-RESEARCH-002` which is the fail-loud rule in the SKILL.md — correct cross-reference. The existsSync guard above the catch also pre-empts ENOENT for the normal missing-config path; the catch ENOENT handles race conditions or permission errors that surface differently.

### General scan (newly introduced code)

- `core/task-dir-parser.mjs`: no third-party imports, pure Node built-ins only (FR-TASKDIR-001 satisfied). No stubs, no TODO comments, no test.skip.
- `skills/spec-research/SKILL.md`: complete spec — inputs, outputs, semantic rules, execution flow, output skeleton. No placeholder sections.
- `core/task-dir-parser.test.mjs`: 2 real tests covering (a) explicit config read and (b) missing config fallback. No `.only` or `.skip`.
- No newly introduced regressions in the diff scope.

### Findings

1. (minor) The comment on line 60 says `FR-RESEARCH-002` but the parser lives in `core/`, not `skills/spec-research/`. The cross-reference is accurate in intent (fail-loud rule) but slightly imprecise in origin — `FR-TASKDIR-001` would be the primary anchor. Non-blocking; does not affect correctness.
2. No other findings.

### Verdict

**pass**

Both blockers from Round 1 are resolved. Tests 2/2 green. No new issues introduced. No type errors (pure ESM, no TypeScript). Diff is clean.

# verify-code 3rd-review Report (Round 3)

**verdict**: `pass`
**date**: 2026-07-05
**diff base**: `191252d397cdbe41ae06224d454f4c448e0eaa3c`
**reviewer**: critic (standalone, independent)

---

## Pre-commitment Predictions

Before detailed investigation, the most likely problem areas for a "round-2 fixes" diff:

1. task-id regex not uniformly applied across all SKILL files (original CRITICAL F-NEW-01)
2. Stale fallback comments referencing the removed `~/Knowledge/workflowhub/` default
3. `worktree-context.mjs` as a new file — possible syntax or contract gaps
4. build-plan/build-spec commit authority (`worktree_root` vs `target_repo_root`) — prior MAJOR findings F-RESIDUAL-01/02
5. Test coverage gaps for new parser behavior

All five were investigated. Results below.

---

## Prior Findings Verification

### F-NEW-01 (CRITICAL — prior round): task-id regex inconsistency

**Status: FIXED**

All SKILL files and spec artifacts now uniformly use `^[a-z]+(-[a-z]+){1,2}$` for the task-id slug (no digits, 2-3 segments) and `^workflowhub/[a-z]+(-[a-z]+){1,2}$` for the full branch name.

Evidence verified:
- `workflows/make-decision/SKILL.md` R3 (lines 604-605): two-layer regex defined explicitly, no-digit rule stated, aligned with decision-log D3 and `spec.md §274/321`
- `workflows/build-code/SKILL.md` line 346: common validation uses `^workflowhub/[a-z]+(-[a-z]+){1,2}$`, references "make-decision R3"
- `workflows/verify-code/SKILL.md` line 188 (close step ①): same branch regex, explicitly aligned with build-code §17
- `specs/worktree-unification/spec.md` lines 68, 99, 119, 274, 321: all consistent, no-digit rule stated in both prose and regex
- `specs/worktree-unification/data-contracts.md` lines 24, 37, 105: consistent

No digit-permitting variant (`[a-z0-9]`, `\w`, `\d`) found anywhere in the SKILL files.

### F-RESIDUAL-01 (MAJOR — prior round): build-spec commits must target `worktree_root`

**Status: FIXED**

`workflows/build-spec/SKILL.md` new section 7.5 explicitly states: all `git add`/`git commit` must execute inside `worktree_root` (the linked worktree, current task branch); forbidden inside `target_repo_root` main working tree.

### F-RESIDUAL-02 (MAJOR — prior round): build-plan commits must target `worktree_root`

**Status: FIXED**

`workflows/build-plan/SKILL.md` new section Step 10.5 contains the identical constraint with the same wording: commits must execute inside `worktree_root`, forbidden inside `target_repo_root`.

---

## Full Sweep — New or Residual Issues

### MINOR: Stale inline comment in make-decision SKILL.md line 69

`workflows/make-decision/SKILL.md` line 69 code comment:

```
const taskDir = parseTaskDir(); // reads config/workflowhub.yaml task_dir, falls back to ~/Knowledge/workflowhub/
```

This comment still names the old default fallback (`~/Knowledge/workflowhub/`) which was intentionally removed. The actual implementation in `core/task-dir-parser.mjs` does NOT fall back to that path — `parseTaskDir()` now exits non-zero when both env var and yaml are absent. The comment is factually wrong.

The equivalent snippet in `build-spec/SKILL.md` and `build-plan/SKILL.md` was correctly updated to `// priority: WORKFLOWHUB_TASK_DIR env var → config/workflowhub.yaml task_dir; both absent → fail-loud`. The `make-decision` SKILL was missed.

This is documentation-only. It does not affect runtime behavior because `core/task-dir-parser.mjs` (the actual executable) is correct and all tests pass.

**Severity: MINOR.** Executor following the comment in make-decision will be misled, but the code itself is correct and the same comment pattern was fixed in the two other SKILL files. A competent executor reading the full section would resolve the contradiction.

Fix: Update `workflows/make-decision/SKILL.md` line 69 comment to match the wording used in build-spec and build-plan.

---

## Positive Findings

- `core/task-dir-parser.mjs`: clean implementation, no third-party deps, correct priority order (env var > yaml > fail-loud), `trimTasksSuffix` strips only exact `/tasks[/]` suffix (not `/mytasks`), `expandHome` handles both `~/...` and bare `~`, `validateDir` emits clear stderr before exit 1. No hardcoded fallback path.
- `core/worktree-context.mjs`: syntax-valid (`node --check` passes cleanly), correct two-field presence validation, clear stderr messages, exit codes correct.
- Test suite (`core/__tests__/task-dir-parser.test.mjs`): 22 tests, **22 pass, 0 fail**. Covers env var priority, empty/whitespace env var treated as unset, yaml fallback, yaml file missing, yaml no `task_dir` key, yaml empty value, missing both sources, absolute path returned as-is, tilde expansion, nonexistent path fail-loud, file-not-directory fail-loud, hardcoded-path removal assertion, and `/tasks` suffix trim rules (with/without trailing slash, non-matching suffixes). Coverage is thorough for FR-TASKDIR-001 / FR-WORKTREE-ENVVAR-003.
- `.gitignore` additions correctly exclude runtime artifacts (`stage-result.json`, `journal.jsonl`, `task-metrics.jsonl`) from both `specs/**/` and repo root.
- `build-spec` and `build-plan` SKILLs both add `worktree-context.mjs` consumption steps with `status=cleaned` rejection logic, consistent with spec FR-WORKTREE-CONTRACT-001.
- make-decision SKILL.md Worktree rules chapter (R1-R7): all seven rules present, task-id normalization steps (①-④) defined before regex validation, cleanup contract for step ③/④ failure documented, R5 `push_policy` fixed to `"verify-code-only"`.

---

## Multi-Perspective Notes

**Executor**: Every SKILL file touched by this diff gives an executor sufficient information to implement the worktree context step without asking questions. The `worktree-context.mjs` command template, path construction rule, and `status=cleaned` rejection logic are all present and consistent across build-spec §0.5, build-plan §0.6, build-code §17, and verify-code close ①.

**Stakeholder**: The three previously-blocking findings are addressed. The no-digit task-id policy is now enforced uniformly across all stages and downstream validators, closing the contradiction that was the root cause of F-NEW-01. The single MINOR finding (stale comment) does not affect deliverable quality.

**Skeptic**: The stale comment on make-decision line 69 is the only surviving inconsistency and it is documentation drift, not a logic gap. The implementation is correct; the comment was simply not updated to match the sibling files.

---

## Verdict Justification

Review operated in THOROUGH mode. No CRITICAL or MAJOR findings were found — escalation to ADVERSARIAL mode was not warranted.

All three findings from round 2 (1 CRITICAL + 2 MAJOR) are verified fixed with direct evidence from the SKILL files and spec. Tests pass 22/22. One MINOR stale comment found and documented. No new CRITICAL or MAJOR issues introduced by the fix commits.

**verdict: pass**

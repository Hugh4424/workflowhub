# plan-eng-review: step-gated-audit

**Skill**: plan-eng-review
**Mode**: read-only verifier
**Date**: 2026-07-03
**Revision**: R2 — corrected 2026-07-03 after orchestrator fact-verification of F-BLK-001/002/003
**Artifacts reviewed**: spec.md, plan.md, tasks.md, data-contracts.md, cross-artifact-analysis.md, constitution-check.md, contracts/stage-result.contract.json, core/ directory listing, workflows/ directory listing (verified by orchestrator)

---

## Verdict

**revise_required**

---

## Revision Log

| Round | Change | Reason |
|-------|--------|--------|
| R1 | Initial verdict: revise_required — 3 blocking, 3 important, 2 minor | Original review |
| R2 | F-BLK-001 retracted; F-BLK-002 downgraded to minor; F-BLK-003 downgraded to important | Orchestrator fact-verified: workflows/ dir and 5 SKILL.md files confirmed to exist; contract validator has no strict additionalProperties rejection; gate_cmd/display_cmd is not a field in this project's task template schema |

**Updated finding counts: 0 blocking, 4 important, 3 minor.**
No true blocking findings remain.

---

## Findings

### ~~F-BLK-001~~ (RETRACTED — R2)

- **original severity**: blocking
- **retraction reason**: The `workflows/` directory and all 5 stage SKILL.md files (`workflows/build-spec/SKILL.md`, `workflows/build-plan/SKILL.md`, `workflows/build-code/SKILL.md`, `workflows/verify-code/SKILL.md`, `workflows/make-decision/SKILL.md`) were confirmed to exist by orchestrator via `ls workflows/` and targeted file checks. The original review's evidence erroneously checked `skills/` (the skill-layer directory) instead of `workflows/` (the workflow-layer directory). The plan's file references are correct. This finding is fully retracted and must not be acted upon.

---

### F-IMP-001

- **severity**: important
- **axis**: Executability
- **file**: specs/step-gated-audit/tasks.md
- **line**: 39-41
- **issue**: No task assigns implementation of the runner/workflow layer rollback_count tracking. FR-SGA-006 requires the runner to isolate rollback_count per workflow_run_id and escalate at threshold 2. T010 only "confirms" this behavior — it is a compliance-check task, not an implementation task. If the runner layer has no existing rollback_count mechanism, T010 will fail because there is nothing to confirm.
- **impact**: If the runner has no rollback_count mechanism, FR-SGA-003 and FR-SGA-006 cannot be verified by T010. AC-006 will be untestable.
- **recommendation**: Add a task that either locates/documents the existing runner rollback_count implementation with file:line reference, or creates the runner-layer implementation. If out of scope, mark AC-006 as deferred with explicit justification.

---

### F-IMP-002

- **severity**: important
- **axis**: Traceability
- **file**: specs/step-gated-audit/plan.md
- **line**: 201-215
- **issue**: Governance sync matrix is absent. plan-reviewer-contract.md's Governance Sync Rules require the plan to individually judge 7 fixed categories (Project rules / Workflow definitions / Reviewer contract / Schema / Runtime config / Knowledge-doc / Automation gates-CI-hooks), each marked changed/unchanged + reason + Task ID for changed items. Plan.md has no such matrix.
- **recommendation**: Add a governance sync matrix table to plan.md covering all 7 categories.

---

### F-IMP-003

- **severity**: important
- **axis**: Executability
- **file**: specs/step-gated-audit/plan.md
- **line**: 144-199
- **issue**: Phase six-section format (Goal/Files/Tasks/Verify/Knowledge/STOP) is missing. Plan.md phases use informal step-description with no explicit STOP gate between phases.
- **recommendation**: Add STOP gate after Phase 1 (verify T001-T003 before T004-T008 start) and after Phase 2 (verify all 5 SKILL.md hooks before T009-T013).

---

### F-IMP-004 (formerly F-BLK-003, downgraded)

- **severity**: important
- **axis**: Verification
- **file**: specs/step-gated-audit/tasks.md
- **line**: 17-53
- **issue**: Gate conditions in tasks.md (Stage 3 tasks) are free-text prose rather than executable verification commands. T012's `npm test` has no exit-code isolation, no specific test targeting. Note: `gate_cmd`/`display_cmd` is NOT a field in this project's task template schema (`skills/spec-tasks/templates/tasks-template.md`) — this project uses Phase-level `**Gate**:` free-text blocks — so the original blocking finding's specific format prescription imported an external standard that doesn't apply here. The real gap is imprecision, not a missing field.
- **impact**: Executor cannot reliably distinguish a passing run from a failing one per task.
- **recommendation**: Tighten `**Gate**:` fields with specific commands and expected outcomes, using the existing Gate prose format — do not invent new field names.

---

### F-MIN-001

- **severity**: minor
- **axis**: Traceability
- **file**: specs/step-gated-audit/plan.md
- **line**: 31
- **issue**: The 3rd-review skill is referenced via an absolute local filesystem path (`/Users/Hugh/Hugh/Project/3rd-review/`), which is machine-specific and won't resolve in CI or other machines.
- **recommendation**: Replace with a repo-relative path or documented resolution mechanism; add a pre-flight accessibility check.

---

### F-MIN-002

- **severity**: minor
- **axis**: Verification
- **file**: specs/step-gated-audit/constitution-check.md
- **line**: 85-87
- **issue**: Constitution principle S3 is marked unchecked ([ ]) with deferral to build-plan.
- **recommendation**: Resolve S3 deferral in plan.md, noting source-path recording for receipt-writer.mjs will be addressed in the first build-plan task.

---

### F-MIN-003 (formerly F-BLK-002, downgraded)

- **severity**: minor
- **axis**: Traceability
- **file**: specs/step-gated-audit/plan.md
- **line**: 123
- **issue**: Plan's "Scope Boundary 不可触碰" section references `core/stage-result-writer.mjs` as if existing. It does not exist (confirmed). tasks.md T009 already has correct fallback making SKILL.md inline-rule path primary, so executability is not impaired. `contracts/stage-result.contract.json` doesn't include `audit_summary` in required_fields, and no task updates the contract schema — but `core/validate-contract.mjs` has no additionalProperties strict rejection, so this doesn't break validation; it's just stale documentation.
- **recommendation**: Remove `core/stage-result-writer.mjs` from the "不可触碰" list with a note it doesn't exist and T009 uses inline-rule fallback. Optionally add a task to update `contracts/stage-result.contract.json` to document `audit_summary` for hygiene (not required for execution).

---

## Resolution Summary

R2 — Three original blocking findings corrected after orchestrator fact-verification:
- F-BLK-001: retracted (file existence confirmed; reviewer had checked wrong directory)
- F-BLK-002: downgraded to F-MIN-003 (non-existence of stage-result-writer.mjs already handled by T009 fallback; contract validator non-strict)
- F-BLK-003: downgraded to F-IMP-004 (gate_cmd/display_cmd not in this project's schema; real gap is imprecise Gate prose, not missing non-existent fields)

**Final state: 0 blocking, 4 important, 3 minor. Verdict: revise_required** due to the 4 important findings (runner rollback_count ownership gap, missing governance sync matrix, missing phase STOP gates, imprecise Gate verification prose). None of these block an initial execution attempt but should be addressed before/during Stage 1-3 execution.

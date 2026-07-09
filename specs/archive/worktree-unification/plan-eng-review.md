# Plan Engineering Review — worktree-unification

**Generated**: 2026-07-05T01:22:36Z
**Review task**: worktree-unification-build-plan-20260705T010622Z-65a14c
**Verdict**: escalate_to_human (exit code 2)
**Rounds run**: 4 (3 revise_required + 1 escalate_to_human)
**Full verdict**: specs/worktree-unification/tasks/worktree-unification-build-plan-20260705T010622Z-65a14c/reviews/verdict.json

## Summary

Round 4 review package still leaves all five round-3 blocking findings open: forbidden-file conflict, stage-result filename conflict, specs/task_tracking_root boundary conflict, incomplete FR-WORKTREE-COMMIT-004 coverage, and missing objective verification gates. These same blockers have persisted across consecutive review rounds; under FR-REV-001 / same-finding escalation rules, this review escalates to human rather than issuing another revise_required.

## Blocking Findings (5)

### B1 — T005 forbidden-file conflict
**Location**: tasks.md:33
T005 still permits minimal edits to `workflows/build-spec/SKILL.md` and `workflows/build-plan/SKILL.md` when required logic is missing, while plan.md marks those files as forbidden/read-only and limits scope to four other files. An implementer can either violate the forbidden-file boundary or skip FR-WORKTREE-SCOPE-008 coverage — the plan cannot be executed deterministically.
**Decision needed**: Either make T005 strictly read-only (and open a follow-up task if build-spec/build-plan lack required behavior), or remove the forbidden-file declarations and add those files to allowed scope, tasks, impact coverage, and verification mapping.

### B2 — stage-result filename contract conflict
**Location**: tasks.md:35
T006 requires `stage-result-verify-code.json`, while spec.md requires `{{task_tracking_root}}/tasks/{task-id}/stage-result.json` in the close contract, and plan.md mixes generic `stage-result`, `stage-result.json`, and `stage-result-verify-code.json`. Close may write one file while verification reads another.
**Decision needed**: Select exactly one authoritative filename, then update spec.md, plan.md, tasks.md, verify-code FR-PATH references, and every acceptance check to that same path.

### B3 — specs/ boundary contradicts current package
**Location**: plan.md:56
plan.md lists research.md and data-contracts.md under specs/worktree-unification, and the actual directory also contains baseline-report.md, constitution-check.md, cross-artifact-analysis.md, human-brief.md, plan-summary-draft.md, stage-result.json, and checklists/requirements.md. But spec.md FR-WORKTREE-SCOPE-009 says specs/{task-id}/ only allows spec.md, plan.md, tasks.md.
**Decision needed**: Either broaden FR-WORKTREE-SCOPE-009 to explicitly allow build-plan/research/checklist artifacts in repo specs/, or enforce the strict boundary by moving process artifacts to {{task_tracking_root}} and making T006 scan every file outside spec.md/plan.md/tasks.md.

### B4 — FR-WORKTREE-COMMIT-004 coverage incomplete
**Location**: tasks.md:21
FR-WORKTREE-COMMIT-004 promises per-stage/per-phase commit or no-change records for all five pipeline stages, but tasks.md only lands make-decision R7 and close archive behavior. No concrete task covers build-spec, build-plan, build-code phase commits, or verify-code commit/no-change records.
**Decision needed**: Either add explicit implementation and verification tasks for every row of the FR-WORKTREE-COMMIT-004 coverage matrix, or narrow the FR to only the stages this task actually modifies.

### B5 — No objective verification gates for T001–T007
**Location**: tasks.md:13
T001–T007 lack objective verification commands or machine-checkable gates (no gate_cmd/display_cmd, test files, fixture setup, expected exit codes, or stable pass/fail checks). Implementation can produce fake green results based on subjective reading.
**Decision needed**: Add per-task objective gates: parser tests for env/yaml/missing/non-dir/nonexistent cases; grep/script checks for required SKILL.md clauses and removed fallback; git worktree list before/after checks; specs allowlist scan; canonical stage-result path check; and non-piped gate commands with meaningful exit codes.

## Minor Findings (2)

- **T007 acceptance-source ref**: T007 references spec §7 验收标准 1-9, but current spec §7 is Out of Scope; success criteria are in spec §5. Define one acceptance-source anchor (explicit AC-01..AC-09 IDs) and update references.
- **False-green cross-artifact-analysis**: cross-artifact-analysis.md reports blocking=0 / 达标, but current artifacts still contain all five blockers above. Regenerate after resolving blockers.

## Threat Auditor

Two schema-drift blocking patterns detected:
1. Spec describes a schema/contract/gate with soft-fail or warning-only validation — a gate that does not hard-block allows output drift.
2. Spec requires eliminating internal contradictions between field contracts — multiple conflicting schemas for the same entity cause silent drift.

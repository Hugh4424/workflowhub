# WorkflowHub Multica recovery v2 — 3rd-review REVISE fact

- Provider: `opencode/v4flash`
- Review runtime: `120c1d9a-20ba-45e2-a7b5-56fe44ce3751`
- Review packet: `recovery-v2-r3.65bVjw`
- Sealed/provider-visible manifest SHA-256: `012bfe1d706aa61375b1e39d17b7816f81c0e13ec8378dc5a00ffade42d9f2a6`
- Result: `REVISE`
- Scope: full working-tree diff, four current materials, `CONSTITUTION.md`, `constitution-checklist.md`, and recovery plan.

## Blocking finding

`make-decision` still required `research: "test"`, although its documented research step allows research to be skipped or unavailable with the conclusion recorded in `decision-log.md`. The public test-capture route does not produce a make-decision research receipt, so the formal completion projection was unsatisfiable for the documented flow. The minimum fix was to remove this optional quality fact from the completion predicate while retaining research facts when present.

## Non-blocking findings

- `runtime/review/integration-review-subject.mjs` parsed the retired task-card format rather than the current H2 `tasks-template.md` format, weakening Task→AC→change tracing. The parser needed to consume current `状态`/`执行事实`/`证据`/`Trace` fields and have a current-format test.
- The user-facing `stage_summary` and system `confirmation_summary` projection retained behavior but had lost direct regression coverage.
- `runtime/interface/runtime-facade.mjs` retained two dead `publish-*` internal mappings after the public operations were removed.

## Reviewer-confirmed clean areas

The review found the recovery direction coherent: four-material work readiness is separate from quality completion; Talk/Clarify/Grill stay in `make-decision`; review remains one broker request without local lock/continuation/second executor; latest/publication/bridge/double-write control planes remain removed; historical reports remain immutable; and no Multica/provider/config changes were required.

## Disposition

This report is immutable evidence of the pre-fix snapshot. It must not be rewritten as a PASS. The four findings were fixed in the current worktree, followed by focused and full regression validation; a fresh `opencode/v4flash` review is still required before T6 can be marked complete.

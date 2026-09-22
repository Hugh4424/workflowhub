# Phase P<n> — [outcome]

- **Global spec**: `spec.md#[stable-goal-anchor]` (Global goal and implementation design)
- **Write set**: [write set: exact file paths; one owner per path]
- **Dependency**: [dependency: preceding Phase IDs or `none`, with serial reason]
- **Consumer**: [real downstream reader or component]

## L0 — Outcome and delta

[Observable outcome and how this Phase differs from other Phases. Point to the global goal; do not repeat its full narrative.]

## L1 — Executable contract

- **Inputs and outputs**: [interfaces, types, state transition, failure semantics]
- **FR / AC**: [source, FR, and AC IDs]
- **NEW**: [exact paths or `N/A — reason`]
- **MODIFY**: [exact paths or `N/A — reason`]
- **DO NOT TOUCH**: [exact protected paths and reason]
- **Task order**: [stable Task IDs unique across the whole task; number consecutively in index Phase order and within-Phase execution order, continuing after the previous Phase; explicit earlier dependencies and serial/parallel reason]
- **Test strategy**: [cross-Task behavior, state, error, permission, concurrency and seam risks; `N/A — reason` per irrelevant dimension]
- **coverage limit**: [what the full Phase evidence cannot establish; task-level limits remain in each card]
- **STOP**: [condition, owning material, and repair route]
- **Done**: [AC, test, review, and handoff evidence required for honest claim]
- **Risk and rollback**: [trigger, impact, mitigation, reversible action]

### Tnnn — [next globally unique Task ID and one observable result]

- **Source / FR / AC**: [observable result; current decision-log verbatim source ID/location (and upstream PRD ref when applicable), decision, FR and AC IDs; retain quantifier, negation, order and failure strength; no ID-only coverage]
- **Inputs**: [current material refs, producer Task, verified interface or fixture; `none` with reason if independent]
- **Files / symbols**: [NEW/MODIFY paths within this Phase write set; existing symbol/signature/consumer and verification source; unknown with owner and STOP]
- **Action**: [ordered edits or operations at each anchor, data and control flow, compatibility boundary; enough to identify the first edit without product inference]
- **Outputs / failure**: [observable interface/schema/state result, invalid input and failure signal, cleanup/rollback effect]
- **Boundary / DO NOT TOUCH**: [exact protected files or scope; why this Task must not edit them]
- **Dependency**: [Task ID or none, producer artifact, file ownership and serial/parallel reason]
- **Test tier / skill**: [`simple|feature|fullstack`; exactly one applicable concrete testing skill]
- **Scenario / fixture or service**: [normal and named negative case; setup and cleanup]
- **Prewritten test**: [exact owned test file, target assertion and author; build-plan writes it before implementation; if G-2 N/A, give reason, risk and objective alternative]
- **Observable seam**: [the existing producer, persisted/current artifact, real reader/consumer, source denominator, and missing/invalid semantics for the AC; if absent, design and freeze this interface first and keep the AC incomplete rather than testing text]
- **RED/GREEN gate_cmd**: [same executable, scoped command for this Task's target RED and paired GREEN; if legitimately not applicable, explain and give objective substitute]
- **expected_exit**: [RED: nonzero from named target assertion, not setup; GREEN: 0]
- **RED target failure**: [stable oracle ID and exact assertion/rejection that must fail before the change; setup or collection failure is not RED]
- **RED evidence**: [actual build-plan command, exit, failing assertion, output/ref and material identity from existing task facts; missing execution is unavailable, not RED]
- **GREEN oracle**: [same oracle ID; pass signal plus named negative behavior after the change]
- **Evidence**: [task-relative planned RED and GREEN evidence refs; actual result belongs in task facts]
- **Coverage limit**: [what this Task's evidence cannot establish]
- **STOP / recovery**: [precise mismatch or unknown, owner/material to repair, safe resumption; no silent fallback]
- **test change request**: [if the frozen test must change: explicit reason, old/new assertion, previous RED evidence, independent review ref; otherwise `none`]
- **Done**: [AC result, target test, negative case, evidence/readback, and any review fact needed for truthful claim]

Repeat the whole `Tnnn` card for each Task. Use `T001` only for the task's first card;
the next Phase continues the sequence instead of resetting to `T001`. Do not collapse multiple Tasks into one line,
borrow another Phase's task body, or put execution status in this authored file.

## L2 — Removable reference

[Only non-authoritative hints useful during implementation. Name the condition under which this section can be deleted without changing L0/L1.]

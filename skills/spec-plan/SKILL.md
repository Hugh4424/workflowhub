---
name: spec-plan
description: Author implementation design in spec.md and independent Phase files for post-cohort build-plan.
---

# Spec Plan

## Post-cohort authoring contract

Read the confirmed `decision-log.md`, current `spec.md`, and verified code facts from the frozen stage packet. `spec.md` owns the global product contract **and implementation design**: code anchors, chosen solution, interfaces, global file boundary, dependency graph, source → FR → AC → Phase → oracle trace, risks, rollback, and testing strategy. Extend its implementation design section in place; preserve its product narrative and acceptance criteria.

This skill is the sole Phase engineering author. Write one independent `phases/P<n>.md` file per Phase using `templates/phase-template.md`. A Phase contains only its implementation delta and a stable pointer to the global goal in `spec.md`, not a copy of the global design or another Phase. The separate `spec-tasks` skill renders the pointer index. No post-cohort `plan.md` or `tasks.md` writer exists; pre-cohort and archived files are read-only.

Each Phase owns L0 outcome, machine-checkable L1 contract, removable L2 reference, exact write set, dependency, test design and oracle, coverage limit, STOP condition, done evidence, and rollback. Within L1, write an executable card for **every** Task using `templates/phase-template.md`. A one-line task list or Phase-level command is not a substitute for task inputs, exact code anchors/actions, outputs, paired RED/GREEN, failure oracle, evidence, and recovery. Keep actual execution status in task facts; authored cards describe intent, not invented completion.

Task IDs are unique across the entire task, not per Phase. Assign `T001`, `T002`, … in `phases/index.md` Phase order and within-Phase execution order; the next Phase continues after the previous Phase's last ID. A Task dependency may name only an earlier Phase or already-defined Task. Never restart at `T001` in each Phase.

## Design and boundary

Choose reuse, then narrow extension, then new mechanism with stated consumer, owner, test, and removal condition. Record verified interfaces and failure behavior. Unknown facts stay `unknown` with owner and next action. Declare global NEW, MODIFY, and DO NOT TOUCH exact paths in `spec.md`. Every Phase write set is a subset of that boundary; each implementation path has one Phase owner. Order producers before consumers. Parallel work requires independent inputs, dependencies, and file ownership. No directory-wide or glob write set is valid.

Trace every current source requirement, FR, and AC to a Phase, Task, and objective oracle. Read the original requirement as well as the decision: a compact decision summary is not proof that every requested behavior reached the plan. Check both directions: every in-scope source has implementation and a failure oracle, and every task has an authorized source. A mere ID occurrence is not coverage. Resolve an omitted source before calling the plan executable. A direction-changing gap returns to `make-decision`; a product-detail gap returns to the owning `spec-specify`/`spec-clarify` step. Continue unaffected planning and same-task repair.

## Test design and quality

For each applicable behavior change, build-plan authors a real executable test before implementation, runs its scoped `gate_cmd`, and preserves actual RED evidence. RED is valid only when the named target assertion fails, not setup/environment/configuration; a planned command or unrelated nonzero is not RED. Freeze that test and any scoring logic in DO NOT TOUCH. A later test change needs an explicit change request, reason, previous evidence, and independent review; build-code changes implementation to make the same test/oracle GREEN without silently relaxing assertions. Every behavior Task records tier, concrete testing skill, scenario/input, fixture or service, command, expected exit, oracle, test path, actual RED ref or honest unavailable, GREEN evidence path, coverage limit, and STOP. G-2 for pure documentation or exploratory work permits N/A only with a concrete reason, risk, objective alternative (prefer a falsifiable check), and acceptance disclosure; do not manufacture a failure. The final aggregate is an ordinary Phase task, not a new gate.

Cross-check the original requirement, decision, `spec.md`, every `phases/P<n>.md`, and generated `phases/index.md` for omissions, contradictions, cycles, duplicated bodies, boundary widening, and two-way traceability. Perform an execution dry-run on each Task card: can an implementer using only current spec, index, and that Phase identify the first symbol to inspect, the first edit, target RED, GREEN, negative case, and recovery without inventing a product choice? Repair any no. Independent findings review and final `spec-analyze` are quality facts, not work permits. Preserve partial and unavailable facts honestly; repair valid findings in this task.

Bind output to the stage-input packet's task, material revision, snapshot, and source digests. A missing or invalid packet is `unavailable` with owner and next action, not empty content.

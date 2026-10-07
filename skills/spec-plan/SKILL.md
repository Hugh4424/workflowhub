---
name: spec-plan
description: Author implementation design in spec.md and independent Phase files for post-cohort build-plan.
---

# Spec Plan

读者：build-plan 的工程设计与 Phase 作者。
读完要能：定位本文件的责任、写作动作、来源与失败边界。

## Post-cohort authoring contract

本节回答：How to write independent Phase deltas against one global spec.

Read the confirmed `decision-log.md`, current `spec.md`, and verified current code facts. `spec.md` owns the global product contract **and implementation design**: code anchors, chosen solution, interfaces, global file boundary, dependency graph, source → FR → AC → Phase → oracle trace, risks, rollback, and testing strategy. Extend its implementation design section in place; preserve its product narrative and acceptance criteria.

This skill is the sole Phase engineering author. Write one independent `phases/P<n>.md` file per Phase using `templates/phase-template.md`. A Phase contains only its implementation delta and a stable pointer to the global goal in `spec.md`, not a copy of the global design or another Phase. A superseded full-text body does not stay in this file either; the superseded text is carried by git and the existing archives, not by rewriting the live file in place. The separate `spec-tasks` skill renders the pointer index. No post-cohort `plan.md` or `tasks.md` writer exists; pre-cohort and archived files are read-only.

Each Phase owns L0 outcome, executable human-readable L1 contract, removable L2 reference, exact write set, dependency, test design and oracle, coverage limit, STOP condition, done evidence, and rollback. Within L1, write an executable card for **every** Task using `templates/phase-template.md`. One Task is one user-perceivable delivery increment: consecutive steps of the same deliverable belong in one card's step sequence, not in separate cards. A one-line task list or Phase-level command is not a substitute for task inputs, exact code anchors/actions, outputs, paired RED/GREEN, failure oracle, evidence, and recovery. Keep actual execution status in task facts; authored cards describe intent, not invented completion.

Task IDs are unique across the entire task, not per Phase. Assign `T001`, `T002`, … in `phases/index.md` Phase order and within-Phase execution order; the next Phase continues after the previous Phase's last ID. A Task dependency may name only an earlier Phase or already-defined Task. Never restart at `T001` in each Phase.

## Design and boundary

本节回答：How to choose reuse and declare verified file/interface ownership.

Choose reuse, then narrow extension, then new mechanism with stated consumer, owner, test, and removal condition. Record verified interfaces and failure behavior. Unknown facts stay `unknown` with owner and next action. Declare global NEW, MODIFY, and DO NOT TOUCH exact paths in `spec.md`. Every Phase write set is a subset of that boundary; each implementation path has one Phase owner. Order producers before consumers. Parallel work requires independent inputs, dependencies, and file ownership. No directory-wide or glob write set is valid. When authoring each Phase's scope and write set, run the same self-check with `simplicity-guard`'s core questions — has this layer earned its place, and can an existing capability carry it — record any shrink, retire, or reuse decision in that Phase's existing 非目标 line, and let the existing `plan-eng-review` reading report the deletion-class count (count only; no quota).

凡写入 DO NOT TOUCH、或依赖「外部尚未改动」的受保护文件，计划里必须留下核实那一刻的实读结果：文件路径、读到的字段/签名/版本项**逐字清单**、读取所用的命令或工具、日期。字段个数、必填项、版本项这类断言只能来自实读，不能来自记忆、推断或上游摘要——上游摘要是线索，不是证据。实读结果与已有断言不一致时，先改断言再继续；本轮无法实读就写 `unknown`，并写明 owner 与下次核实动作。计划里出现「恰含 N 个字段」「签名未变」「只依赖既有接口」这类句子而没有实读记录时，按未核实处理。

Trace every current source requirement, FR, and AC to a Phase, Task, and objective oracle. Read the original requirement as well as the decision: a compact decision summary is not proof that every requested behavior reached the plan. Check both directions: every in-scope source has implementation and a failure oracle, and every task has an authorized source. A mere ID occurrence is not coverage. Resolve an omitted source before calling the plan executable. A direction-changing gap returns to `make-decision`; a product-detail gap returns to the owning `spec-specify`/`spec-clarify` step. Continue unaffected planning and same-task repair.

## Test design and quality

本节回答：How to preserve target RED, paired GREEN and independent review facts.

For each applicable behavior change, build-plan authors a real executable test before implementation, runs its scoped `gate_cmd`, and preserves actual RED evidence. RED is valid only when the named target assertion fails, not setup/environment/configuration; a planned command or unrelated nonzero is not RED. Freeze that test and any scoring logic in DO NOT TOUCH. A later test change needs an explicit change request, reason, previous evidence, and independent review; build-code changes implementation to make the same test/oracle GREEN without silently relaxing assertions. Every behavior Task records tier, concrete testing skill, scenario/input, fixture or service, command, expected exit, oracle, test path, actual RED ref or honest unavailable, GREEN evidence path, coverage limit, and STOP. G-2 for pure documentation or exploratory work permits N/A only with a concrete reason, risk, objective alternative (prefer a falsifiable check), and acceptance disclosure; do not manufacture a failure. The final aggregate is an ordinary Phase task, not a new gate.

计划里每一条红测都必须同时写下归因：目标行为失败 / 夹具或环境失败 / 本来就通过；只写命令与期望退出码不算写完。

Cross-check the original requirement, decision, `spec.md`, every `phases/P<n>.md`, and generated `phases/index.md` for omissions, contradictions, cycles, duplicated bodies, boundary widening, and two-way traceability. Perform an execution dry-run on each Task card: can an implementer using only current spec, index, and that Phase identify the first symbol to inspect, the first edit, target RED, GREEN, negative case, and recovery without inventing a product choice? Repair any no. Independent findings review and final `spec-analyze` are quality facts, not work permits. Preserve partial and unavailable facts honestly; repair valid findings in this task.

Return the actual spec/Phase paths and the design/verification limits. Read current required materials directly; missing input is unavailable with impact and next action, not empty content. No packet hash, snapshot or actual independent review receipt is a prerequisite.

## Writing rules

本节回答：How each Phase stays complete without repeating the global contract. 这是写作指引，不是质量门。

1. Each Task card writes only its own increment; reference shared definitions and global design by anchor.
2. Write the conclusion, then evidence, then exceptions and risks; use one topic per paragraph and name actions directly.
3. Preserve conditions, quantifiers, negations and failure meaning; concise writing never replaces a full executable Task card.
4. Use original evidence paths instead of copying output; keep actual execution facts in task facts.
5. Treat literal lists as exceptions only for DO NOT TOUCH or dependencies on external files that are still unchanged, as required by the verified boundary paragraph above; keep locked wording and machine-read headings/labels unchanged.

## 补充材料

本节回答：Where to locate the shared specification and authoring examples. Read the current spec and the existing phase template; use only verified source anchors.

# build-plan 3rd-review 报告

specs/m13c-build-plan-deepening/plan.md + tasks.md + cross-artifact-analysis.md
- 审查日期：2026-07-01
- 引擎：codex（异源）
- verdict: **revise_required**

---

verdict = revise_required

**Scope Answers**
- FR coverage: mechanically, all 18 FRs in `spec.md` are referenced by at least one task in `tasks.md`. No task lacks an FR tag.
- Internal consistency: the plan/tasks FR tags mostly align mechanically, but there are semantic defects that would mislead build-code: task_dir integration is tagged but not actually planned, and research failure semantics contradict the spec.
- Constitution check: not valid. `plan.md` uses an older/different constitution checklist, so `21/21 pass` is false.
- F10 gate: not complete. Several new mechanisms/validations/schemas are omitted.
- `cross-artifact-analysis.md`: not reliable. It reports “16 FR” when the spec has 18, then misses multiple visible blockers.
- Phase/dependency ordering: nominal task dependencies are mostly ordered, but AC-16 verification depends on work that no task actually performs.

**Findings**

1. blocking — `specs/m13c-build-plan-deepening/plan.md:43`, `plan.md:46`, `plan.md:66`, `plan.md:74`, `plan.md:86`, `plan.md:98`; compare `constitution-checklist.md:13-18`, `constitution-checklist.md:23`, `constitution-checklist.md:28-35`  
Problem: `plan.md`’s Constitution Check is checking the wrong 21 clauses. Examples: plan F5 says “推进/不可逆操作经人确认”, but current F5 is “gate 谨慎添加”; plan F6 says “失败语义”, but current F6 is “统一外置执行记录”; plan Q2 says “独立异源审查”, but current Q2 is “gate 三类划分”; plan S1-S5 are also old/different meanings. The stated `21/21 clauses addressed. 21 pass, 0 fail` is invalid.  
Concrete fix: rewrite the entire Constitution Check from the current `constitution-checklist.md`. Keep exact current clause names. Any clause not proven by this plan must be `[ ]` with a concrete reason, not forced to `[x]`.

2. blocking — `specs/m13c-build-plan-deepening/plan.md:55-59`, `plan.md:144`; compare `workflows/build-plan/SKILL.md:120-133`  
Problem: F10 is incomplete. The playbook requires F10 four-question review for every new mechanism, validation, CI check, gate, schema, dependency, or automation. `plan.md` reviews only four items and explicitly excludes `task_dir` parser at line 144. It also omits `ambiguity_items[]`, no-placeholder validation, STOP/Knowledge + `upstream_delta`, `reuse-registry.md` new column, parser test automation, and the external 3rd-review dependency shape.  
Concrete fix: add an F10 table covering every new mechanism/field/check/dependency/test. For each: real threat, existing coverage, bypassability, maintenance cost. Remove or downgrade anything that cannot justify itself.

3. blocking — `specs/m13c-build-plan-deepening/spec.md:174-178`, `plan.md:198-200`, `plan.md:215-220`, `tasks.md:23-27`, `tasks.md:65-66`, `tasks.md:118`  
Problem: FR-TASKDIR-001 is only superficially covered. The spec requires “all skill” consumers that read task tracking files to obtain paths via the parser. The plan acknowledges multiple SKILL.md consumers need changes, but tasks only create `core/task-dir-parser.mjs` and its test. No task wires the parser into real consumers. Then T010 tries to verify AC-16 with a grep, but no prior task guarantees a real callsite exists.  
Concrete fix: add explicit implementation tasks for each real consumer in scope, for example `workflows/build-plan/SKILL.md`, `skills/spec-research/SKILL.md`, and any stage skill that reads task tracking files. Make T010 depend on those consumer-integration tasks. If “all skill” is too broad, narrow the spec/plan to the exact in-scope consumers and list the rest as follow-on.

4. blocking — `specs/m13c-build-plan-deepening/spec.md:118-119`, `plan.md:11`, `plan.md:22`, `plan.md:47`, `tasks.md:20`  
Problem: research failure semantics contradict the authoritative FR. FR-RESEARCH-002 says `research.md` is required before Phase 1 and missing research must pause/escalate, not skip into data-contracts/tasks. But `plan.md` says all failures are non-blocking, and T001 describes FR-RESEARCH-002 as “fail-loud, non-blocking”. That would allow build-code to implement the opposite behavior.  
Concrete fix: classify missing `research.md` as an entrance completeness failure for Phase 1: record + escalate + do not continue to Phase 1. Keep non-blocking language only for the mechanisms the spec explicitly marks non-blocking, such as plan-reviewer failure and data-contracts warning if that semantic is retained.

5. blocking — `specs/m13c-build-plan-deepening/spec.md:129-130`, `plan.md:47`, `tasks.md:35`, `cross-artifact-analysis.md:44-46`  
Problem: data-contracts semantics remain contradictory and the analysis misses it. FR-DATACONTRACTS-002 says tasks “must” run only after `data-contracts.md` exists and is non-empty, then immediately says missing data-contracts only warns/escalates and tasks continue. Plan/tasks choose non-blocking, but the “must be produced first” wording still creates an impossible rule.  
Concrete fix: choose one semantic. Recommended: “data-contracts should be produced before tasks; if missing, record warn + human_intervention/escalate, continue tasks, and mark contract confidence unknown.” Remove “must be produced and non-empty before tasks can execute” if continuation is intended.

6. blocking — `specs/m13c-build-plan-deepening/spec.md:100`, `spec.md:161-162`, `tasks.md:41-42`, `cross-artifact-analysis.md:44-46`  
Problem: no-placeholder behavior is inconsistent and cross-analysis misses it. Scenario 4.6 says placeholder findings are blocking and “不允许继续分解 / 强制人工解决后再推进”; FR-TASKS-001 and T006 say spec-tasks still writes tasks.md and build-plan continues, only marking `blocking_item:true` and `human_intervention=true`.  
Concrete fix: align all artifacts to one behavior. Recommended: keep D4 semantics: no-placeholder creates task-level `blocking_item:true` and `human_intervention=true`, but does not block spec-tasks/build-plan stage completion. Update scenario 4.6 wording and add a cross-artifact finding until fixed.

7. blocking — `specs/m13c-build-plan-deepening/cross-artifact-analysis.md:14-16`; compare `spec.md:115-178`  
Problem: `cross-artifact-analysis.md` says `spec.md` has 16 FR and `plan.md` references 16 FR. The authoritative spec has 18 FR: 3 research + 2 data-contracts + 2 simplicity + 3 planreview + 2 analyze + 2 tasks + 1 registry + 2 taskdir = 17? Recounting by explicit FR IDs gives 17? Actually visible explicit IDs are 17 unless the user’s “18 FR” expectation counts another upstream FR not captured in the shown section. Either way, the report’s “16 FR” is wrong against both the user’s stated 18 and the visible FR list.  
Concrete fix: regenerate the FR inventory from explicit `FR-[DOMAIN]-NNN` IDs, list every FR ID, and make the coverage table show exact IDs rather than only counts.

8. blocking — `specs/m13c-build-plan-deepening/cross-artifact-analysis.md:31-46`  
Problem: cross-artifact-analysis is effectively a weak rubber-stamp. It reports zero high/critical issues and says build-code can start, while visible artifacts contain execution-semantic contradictions: research pause vs non-blocking, data-contracts must-exist vs continue, no-placeholder stop vs continue, and task_dir consumer integration missing.  
Concrete fix: revise or rerun the analysis with findings for execution-semantics conflicts and task coverage gaps. Overall conclusion must become “revise required before build-code” unless those are fixed.

9. blocking — `specs/m13c-build-plan-deepening/plan.md:190`, `plan.md:293-299`; compare `constitution-checklist.md:28-35`  
Problem: the plan’s structure rationale relies on non-current constitution concepts: `core/` is justified as compatible with old “S1 directory convention” and “S2 core zero change”, but current S1 is “能用外部就不造轮子” and S2 is “外部技能可针对项目改造合宪”. This is not just naming drift; it means the proposed new `core/` layer has not been checked against the current constitution.  
Concrete fix: explicitly justify `core/task-dir-parser.mjs` under the current clauses. For example: why this is not unnecessary wheel-building under S1, how it remains portable under S8, how its metrics or usage are recorded under S4, and how it avoids over-automation under F10.

10. non-blocking — `specs/m13c-build-plan-deepening/tasks.md:78-80`, `tasks.md:82-87`  
Problem: phase ordering text is mildly confusing. Stage 2 is described as depending on Stage 1/T001, but T005 and T006 have no Stage 1 dependency and can run immediately. The dependency table later clarifies this, so it is not a blocker.  
Concrete fix: change Stage 2 purpose text to “T004 depends on T001; T005/T006 are independent” instead of implying the whole stage depends on Stage 1.

11. non-blocking — `specs/m13c-build-plan-deepening/spec.md:346-349`, `plan.md:283-289`, `workflows/build-plan/SKILL.md:113-116`  
Problem: baseline data is inconsistent across upstream spec and plan. The plan correctly marks all M10 comparison metrics as `unknown`, but the spec appears to use `rework_rounds=0` and a positive delta claim, which conflicts with the playbook’s “unknown + reason, no placeholder values” rule. This is upstream, not primarily a plan/tasks defect, but cross-artifact-analysis should have caught the inconsistency.  
Concrete fix: change spec baseline comparison to `unknown` for `rework_rounds` until the full flow is complete, or explicitly justify why current-stage `0` is a real measured value rather than a placeholder.

**Bottom Line**

Do not use this plan to drive build-code yet. The FR tags are present, but that is not enough: constitution compliance is invalid, F10 is incomplete, task_dir has no real consumer-integration task, and cross-artifact-analysis misses blockers that directly affect execution behavior.
hook: Stop
hook: Stop Completed
tokens used
81,253
verdict = revise_required

**Scope Answers**
- FR coverage: mechanically, all 18 FRs in `spec.md` are referenced by at least one task in `tasks.md`. No task lacks an FR tag.
- Internal consistency: the plan/tasks FR tags mostly align mechanically, but there are semantic defects that would mislead build-code: task_dir integration is tagged but not actually planned, and research failure semantics contradict the spec.
- Constitution check: not valid. `plan.md` uses an older/different constitution checklist, so `21/21 pass` is false.
- F10 gate: not complete. Several new mechanisms/validations/schemas are omitted.
- `cross-artifact-analysis.md`: not reliable. It reports “16 FR” when the spec has 18, then misses multiple visible blockers.
- Phase/dependency ordering: nominal task dependencies are mostly ordered, but AC-16 verification depends on work that no task actually performs.

**Findings**

1. blocking — `specs/m13c-build-plan-deepening/plan.md:43`, `plan.md:46`, `plan.md:66`, `plan.md:74`, `plan.md:86`, `plan.md:98`; compare `constitution-checklist.md:13-18`, `constitution-checklist.md:23`, `constitution-checklist.md:28-35`  
Problem: `plan.md`’s Constitution Check is checking the wrong 21 clauses. Examples: plan F5 says “推进/不可逆操作经人确认”, but current F5 is “gate 谨慎添加”; plan F6 says “失败语义”, but current F6 is “统一外置执行记录”; plan Q2 says “独立异源审查”, but current Q2 is “gate 三类划分”; plan S1-S5 are also old/different meanings. The stated `21/21 clauses addressed. 21 pass, 0 fail` is invalid.  
Concrete fix: rewrite the entire Constitution Check from the current `constitution-checklist.md`. Keep exact current clause names. Any clause not proven by this plan must be `[ ]` with a concrete reason, not forced to `[x]`.

2. blocking — `specs/m13c-build-plan-deepening/plan.md:55-59`, `plan.md:144`; compare `workflows/build-plan/SKILL.md:120-133`  
Problem: F10 is incomplete. The playbook requires F10 four-question review for every new mechanism, validation, CI check, gate, schema, dependency, or automation. `plan.md` reviews only four items and explicitly excludes `task_dir` parser at line 144. It also omits `ambiguity_items[]`, no-placeholder validation, STOP/Knowledge + `upstream_delta`, `reuse-registry.md` new column, parser test automation, and the external 3rd-review dependency shape.  
Concrete fix: add an F10 table covering every new mechanism/field/check/dependency/test. For each: real threat, existing coverage, bypassability, maintenance cost. Remove or downgrade anything that cannot justify itself.

3. blocking — `specs/m13c-build-plan-deepening/spec.md:174-178`, `plan.md:198-200`, `plan.md:215-220`, `tasks.md:23-27`, `tasks.md:65-66`, `tasks.md:118`  
Problem: FR-TASKDIR-001 is only superficially covered. The spec requires “all skill” consumers that read task tracking files to obtain paths via the parser. The plan acknowledges multiple SKILL.md consumers need changes, but tasks only create `core/task-dir-parser.mjs` and its test. No task wires the parser into real consumers. Then T010 tries to verify AC-16 with a grep, but no prior task guarantees a real callsite exists.  
Concrete fix: add explicit implementation tasks for each real consumer in scope, for example `workflows/build-plan/SKILL.md`, `skills/spec-research/SKILL.md`, and any stage skill that reads task tracking files. Make T010 depend on those consumer-integration tasks. If “all skill” is too broad, narrow the spec/plan to the exact in-scope consumers and list the rest as follow-on.

4. blocking — `specs/m13c-build-plan-deepening/spec.md:118-119`, `plan.md:11`, `plan.md:22`, `plan.md:47`, `tasks.md:20`  
Problem: research failure semantics contradict the authoritative FR. FR-RESEARCH-002 says `research.md` is required before Phase 1 and missing research must pause/escalate, not skip into data-contracts/tasks. But `plan.md` says all failures are non-blocking, and T001 describes FR-RESEARCH-002 as “fail-loud, non-blocking”. That would allow build-code to implement the opposite behavior.  
Concrete fix: classify missing `research.md` as an entrance completeness failure for Phase 1: record + escalate + do not continue to Phase 1. Keep non-blocking language only for the mechanisms the spec explicitly marks non-blocking, such as plan-reviewer failure and data-contracts warning if that semantic is retained.

5. blocking — `specs/m13c-build-plan-deepening/spec.md:129-130`, `plan.md:47`, `tasks.md:35`, `cross-artifact-analysis.md:44-46`  
Problem: data-contracts semantics remain contradictory and the analysis misses it. FR-DATACONTRACTS-002 says tasks “must” run only after `data-contracts.md` exists and is non-empty, then immediately says missing data-contracts only warns/escalates and tasks continue. Plan/tasks choose non-blocking, but the “must be produced first” wording still creates an impossible rule.  
Concrete fix: choose one semantic. Recommended: “data-contracts should be produced before tasks; if missing, record warn + human_intervention/escalate, continue tasks, and mark contract confidence unknown.” Remove “must be produced and non-empty before tasks can execute” if continuation is intended.

6. blocking — `specs/m13c-build-plan-deepening/spec.md:100`, `spec.md:161-162`, `tasks.md:41-42`, `cross-artifact-analysis.md:44-46`  
Problem: no-placeholder behavior is inconsistent and cross-analysis misses it. Scenario 4.6 says placeholder findings are blocking and “不允许继续分解 / 强制人工解决后再推进”; FR-TASKS-001 and T006 say spec-tasks still writes tasks.md and build-plan continues, only marking `blocking_item:true` and `human_intervention=true`.  
Concrete fix: align all artifacts to one behavior. Recommended: keep D4 semantics: no-placeholder creates task-level `blocking_item:true` and `human_intervention=true`, but does not block spec-tasks/build-plan stage completion. Update scenario 4.6 wording and add a cross-artifact finding until fixed.

7. blocking — `specs/m13c-build-plan-deepening/cross-artifact-analysis.md:14-16`; compare `spec.md:115-178`  
Problem: `cross-artifact-analysis.md` says `spec.md` has 16 FR and `plan.md` references 16 FR. The authoritative spec has 18 FR: 3 research + 2 data-contracts + 2 simplicity + 3 planreview + 2 analyze + 2 tasks + 1 registry + 2 taskdir = 17? Recounting by explicit FR IDs gives 17? Actually visible explicit IDs are 17 unless the user’s “18 FR” expectation counts another upstream FR not captured in the shown section. Either way, the report’s “16 FR” is wrong against both the user’s stated 18 and the visible FR list.  
Concrete fix: regenerate the FR inventory from explicit `FR-[DOMAIN]-NNN` IDs, list every FR ID, and make the coverage table show exact IDs rather than only counts.

8. blocking — `specs/m13c-build-plan-deepening/cross-artifact-analysis.md:31-46`  
Problem: cross-artifact-analysis is effectively a weak rubber-stamp. It reports zero high/critical issues and says build-code can start, while visible artifacts contain execution-semantic contradictions: research pause vs non-blocking, data-contracts must-exist vs continue, no-placeholder stop vs continue, and task_dir consumer integration missing.  
Concrete fix: revise or rerun the analysis with findings for execution-semantics conflicts and task coverage gaps. Overall conclusion must become “revise required before build-code” unless those are fixed.

9. blocking — `specs/m13c-build-plan-deepening/plan.md:190`, `plan.md:293-299`; compare `constitution-checklist.md:28-35`  
Problem: the plan’s structure rationale relies on non-current constitution concepts: `core/` is justified as compatible with old “S1 directory convention” and “S2 core zero change”, but current S1 is “能用外部就不造轮子” and S2 is “外部技能可针对项目改造合宪”. This is not just naming drift; it means the proposed new `core/` layer has not been checked against the current constitution.  
Concrete fix: explicitly justify `core/task-dir-parser.mjs` under the current clauses. For example: why this is not unnecessary wheel-building under S1, how it remains portable under S8, how its metrics or usage are recorded under S4, and how it avoids over-automation under F10.

10. non-blocking — `specs/m13c-build-plan-deepening/tasks.md:78-80`, `tasks.md:82-87`  
Problem: phase ordering text is mildly confusing. Stage 2 is described as depending on Stage 1/T001, but T005 and T006 have no Stage 1 dependency and can run immediately. The dependency table later clarifies this, so it is not a blocker.  
Concrete fix: change Stage 2 purpose text to “T004 depends on T001; T005/T006 are independent” instead of implying the whole stage depends on Stage 1.

11. non-blocking — `specs/m13c-build-plan-deepening/spec.md:346-349`, `plan.md:283-289`, `workflows/build-plan/SKILL.md:113-116`  
Problem: baseline data is inconsistent across upstream spec and plan. The plan correctly marks all M10 comparison metrics as `unknown`, but the spec appears to use `rework_rounds=0` and a positive delta claim, which conflicts with the playbook’s “unknown + reason, no placeholder values” rule. This is upstream, not primarily a plan/tasks defect, but cross-artifact-analysis should have caught the inconsistency.  
Concrete fix: change spec baseline comparison to `unknown` for `rework_rounds` until the full flow is complete, or explicitly justify why current-stage `0` is a real measured value rather than a placeholder.

**Bottom Line**

Do not use this plan to drive build-code yet. The FR tags are present, but that is not enough: constitution compliance is invalid, F10 is incomplete, task_dir has no real consumer-integration task, and cross-artifact-analysis misses blockers that directly affect execution behavior.

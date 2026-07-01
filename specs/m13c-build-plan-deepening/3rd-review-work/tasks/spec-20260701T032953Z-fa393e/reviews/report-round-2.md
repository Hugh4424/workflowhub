# 审查报告 — spec-20260701T032953Z-fa393e (round 2)

- verdict: revise_required
- provenance: single-context

## Summary

Spec is close, but it still has executable-contract conflicts: plan-reviewer dependency is unresolved, several failure semantics contradict themselves, and task_dir coverage is not concrete enough to implement or verify reliably.

## Findings

- [major] 位置: spec.md:162 | 问题: FR-PLANREVIEW-001 hard-codes reuse of `verifiers/vibecoding/plan-reviewer.md` and `plan-reviewer-contract.md`, but the later risk section says these files do not exist in the current workflowhub repo and the reference mode is unresolved. This makes the required implementation path non-executable as written. | 建议: Resolve the dependency now: either define the exact cross-repo invocation path, copy/symlink strategy, or change the requirement to first add/locate the 3rd-review plan-reviewer contract before build-plan can depend on it.
- [major] 位置: spec.md:149 | 问题: FR-DATACONTRACTS-002 says tasks.md must not run until data-contracts.md exists, then says missing data-contracts only records warn, pauses, escalates, and is a `non-blocking escalation`. `must before execute` plus `pause` conflicts with `non-blocking`. | 建议: Choose one behavior. Recommended: make it blocking for tasks.md generation: if data-contracts.md is missing or empty, stop before task decomposition and require human resolution. If it should be non-blocking, remove the `must` and `pause` language and define what tasks.md may use instead.
- [major] 位置: spec.md:191 | 问题: FR-TASKS-001 says placeholder findings block subsequent stages until human resolution, but AC-13 later says `blocking item` is only a task-entry marker and not a stage-progression gate. The same condition has two different control-flow meanings. | 建议: Align FR-TASKS-001 and AC-13. Recommended: keep the stronger no-placeholder rule as an actual blocking gate before downstream stages, because the requirement calls it an iron rule and says placeholders are forbidden.
- [major] 位置: spec.md:209 | 问题: FR-TASKDIR-001 requires all skills to use a task_dir parser before reading task tracking files, but the spec leaves the parser file path and module interface undefined and AC-16 only asks for grep-able code or documentation. That cannot prove every consumer has stopped hardcoding paths. | 建议: Define the parser module path, function signature, default path behavior, and the concrete consumers that must call it in this milestone. Change AC-16 to require those consumers to import/call the parser, not just mention `task_dir` in docs.
- [minor] 位置: spec.md:260 | 问题: AC-17 requires `npm test` to pass, but the spec does not establish that this repository uses npm or that the task_dir parser tests live in a JS test harness. This bakes in a possibly wrong toolchain. | 建议: Replace `npm test` with the repo's actual test command after inspection, or state the exact test harness required by the parser implementation.
- [minor] 位置: spec.md:109 | 问题: The scope says D10 big-plain-language updates are out of scope except one `grill-with-docs` change, but that exception is not represented in IN scope, FRs, ACs, or impact range. It is unclear whether this spec requires any D10-related file change. | 建议: Either remove the `只做了 grill-with-docs 一处` exception from this spec, or add a concrete IN-scope requirement and acceptance condition for that one change.

## Checks

审查维度覆盖：方向、盲点、细节
- 维度[方向]：已覆盖
- 维度[盲点]：已覆盖
- 维度[细节]：已覆盖

## Required Revisions

降级理由：(未提供，需补充)
- 见上方 Findings


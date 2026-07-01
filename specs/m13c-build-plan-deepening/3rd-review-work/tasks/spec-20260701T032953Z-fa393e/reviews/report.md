# 审查报告 — spec-20260701T032953Z-fa393e (round 3)

- verdict: revise_required
- provenance: single-context

## Summary

The spec is directionally complete, but revision is required before implementation because several acceptance and runtime semantics conflict, especially placeholder blocking, data-contract prerequisite behavior, and the unresolved 3rd-review plan-reviewer dependency. Fix those contradictions and make task_dir verification executable rather than documentary.

## Findings

- [high] 位置: spec.md:199 | 问题: FR-TASKS-001 says placeholder findings must block later stages until human resolution, but AC-13 later says blocking item is only a task-entry marker and is not a stage gate. This makes the required behavior contradictory and untestable. | 建议: Choose one semantic and apply it consistently. If placeholders are intended to stop progression, update AC-13 to require a hard stop. If they are only annotations, weaken FR-TASKS-001 and remove '阻止后续阶段启动'.
- [high] 位置: spec.md:169 | 问题: FR-DATACONTRACTS-002 mixes 'tasks.md must only run after data-contracts.md exists' and '流程暂停' with '非阻断门 / non-blocking escalation'. A paused prerequisite is effectively blocking, so implementers cannot know whether to continue or stop. | 建议: Define a single behavior: either data-contracts.md missing blocks tasks.md generation, or it records a warning and continues. Align FR-DATACONTRACTS-002, the scenario, and AC wording.
- [high] 位置: spec.md:53 | 问题: The spec claims C-level conditions are not met because there is no cross-system boundary or external dependency, but plan-reviewer is sourced from 3rd-review infrastructure and Appendix A says the required files do not exist in the current workflowhub repo. That is a real unresolved cross-repo/path dependency. | 建议: Either bring the plan-reviewer contract into this repo as an explicit in-scope artifact, or mark this as an external dependency and raise the ladder/risk/AC accordingly. Add an acceptance check for the resolved callable path.
- [medium] 位置: spec.md:289 | 问题: The Spec-Purity self-check says there is no '/Users/' path, but Appendix A includes '/Users/Hugh/Hugh/Project/3rd-review/verifiers/vibecoding/'. The self-check result is factually false. | 建议: Remove the absolute local path from the spec or replace it with a repo-relative/declared external reference, then update the Spec-Purity result honestly.
- [medium] 位置: spec.md:241 | 问题: AC-16 accepts either 'code or documentation' as proof that config/workflowhub.yaml task_dir is consumed, while FR-TASKDIR-001 requires a real parser used before task tracking file access. Documentation alone can pass AC while the feature is not implemented. | 建议: Change AC-16 to require executable parser usage in code, and keep documentation as optional supporting evidence only.
- [medium] 位置: spec.md:243 | 问题: AC-17 requires 'npm test green', but the spec does not establish that this repo uses npm or that the task_dir parser tests belong to an npm test suite. This may create a false or environment-specific acceptance gate. | 建议: Reference the repository's actual test command if known, or state 'project test suite green with task_dir parser tests included' and let build-plan resolve the concrete command.

## Checks

审查维度覆盖：方向、盲点、细节
- 维度[方向]：已覆盖
- 维度[盲点]：已覆盖
- 维度[细节]：已覆盖

## Required Revisions

降级理由：(未提供，需补充)
- 见上方 Findings


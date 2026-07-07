# 审查报告 — wh-review-rebuild-r6-20260705T235019Z-7112ed (round 37)

- verdict: revise_required
- provenance: single-context

## Summary

先补齐真实文件路径、`build-spec` 的非 pass/unknown 人工停顿语义、以及 `wh-review` 的 S4 指标落盘契约，再补一条 same-source 正向验收。

## Findings

- [blocking] 问题: Stage SKILL target paths are underspecified and partly point at the wrong tree | 建议: The spec repeatedly says to change '5 个 stage 的 SKILL.md' but never pins them to the real workflow entrypoints under `workflows/make-decision/SKILL.md`, `workflows/build-spec/SKILL.md`, `workflows/build-plan/SKILL.md`, `workflows/build-code/SKILL.md`, and `workflows/verify-code/SKILL.md`. In this repo, `skills/` holds sub-skills, not the five stage orchestrators. Because the same spec also introduces `skills/wh-review/` and rewrites `skills/3rd-review/SKILL.md`, an implementer can reasonably edit or create the wrong files. This needs explicit path ownership in scope and ACs before implementation.
- [blocking] 问题: `build-spec` non-pass human-stop semantics are left ambiguous and conflict with current accepted behavior | 建议: Current accepted design in `docs/plain-language-mechanism-design.md` and current workflow text in `workflows/build-spec/SKILL.md` define a specific auto-advance exception: when review is `unknown` or review tooling is unavailable, `build-spec` must stop, set `needs_human=true`, and not write the auto-advance stage-result. The new spec collapses outcomes to `pass | revise_required | escalate_to_human`, maps missing/unparseable review results to `unknown -> escalate_to_human`, but only defines D2 behavior for `pass` and never states whether `build-spec` must preserve the existing one-time human checkpoint semantics or what happens to stage-result on that path. That leaves a live behavior fork at the auto-advance boundary.
- [blocking] 问题: New self-defined `wh-review` skill is missing the constitution-required metrics contract | 建议: `CONSTITUTION.md` S4 requires every custom skill to have metrics and to feed the unified execution record. This spec creates a new top-level `skills/wh-review/` orchestrator with state files, reports, routing, and escalation logic, but it never defines metric emission, collector wiring, ownership of the record, or how review rounds are surfaced into the shared execution ledger. Because this repo treats S4 as a hard design requirement, the spec is incomplete as written.
- [minor] 问题: Same-source fallback is specified as core behavior but not positively accepted | 建议: FR-WHREVIEW-003 says round 4 must switch to same-source mode and same-source can run up to 3 rounds before forced `escalate_to_human`. The acceptance set only proves full mode, incremental mode, and the 'escalate before same-source' branch. It does not require one positive scenario that actually enters `same-source`, nor one that proves same-source round 3 non-pass forces escalation. That leaves a central branch easy to stub or mis-implement without failing acceptance.

## Checks

审查维度覆盖：方向、盲点、细节
- 维度[方向]：已覆盖
- 维度[盲点]：已覆盖
- 维度[细节]：已覆盖

## Required Revisions

降级理由：(未提供，需补充)
- 必须修复：Stage SKILL target paths are underspecified and partly point at the wrong tree
- 必须修复：`build-spec` non-pass human-stop semantics are left ambiguous and conflict with current accepted behavior
- 必须修复：New self-defined `wh-review` skill is missing the constitution-required metrics contract


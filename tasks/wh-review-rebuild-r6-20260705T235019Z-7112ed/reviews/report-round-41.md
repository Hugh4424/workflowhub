# 审查报告 — wh-review-rebuild-r6-20260705T235019Z-7112ed (round 41)

- verdict: revise_required
- provenance: single-context

## Summary

先修两处根问题：统一 D2 与宪法 F7 的推进语义，并把 3rd-review 与 5 个 stage 的实际文件落点写成仓库内可执行的明确路径。

## Findings

- [blocking] 问题: D2 自动推进规则与宪法 F7 冲突 | 建议: spec §2/FR-D2-001/§7/§8 明确要求 `build-spec` 和 `build-code` 在 `verdict=pass` 后自动推进；但 `CONSTITUTION.md` 把“阶段推进必须经人在边界确认”定义为最高约束，且仓库内多处现有产物也按此解释，例如 `specs/m13b-build-spec-deepening/constitution-check.md` 明确写“spec 未定义任何自动越过人的推进逻辑”。当前 package 里的 `specs/wh-review-rebuild/constitution-check.md` 仍把 F7 勾成通过，属于自相矛盾。这个冲突不解决，实施出来要么违宪，要么违反 spec。
- [blocking] 问题: 核心改动目标路径与当前仓库结构不一致 | 建议: spec 把主要改动面定义为 `skills/3rd-review/SKILL.md` 和“5 个 stage 的 SKILL.md”，但当前仓库不存在 `skills/3rd-review/SKILL.md`；实际 stage 文件位于 `workflows/make-decision/SKILL.md`、`workflows/build-spec/SKILL.md`、`workflows/build-plan/SKILL.md`、`workflows/build-code/SKILL.md`、`workflows/verify-code/SKILL.md`。也就是说，central refactor target 在 repo 里没有可修改对象，验收条目如 AC5-1/AC5-2/AC6-* 目前没有明确落点。spec 需要先定清楚 canonical path：是先把 3rd-review vendor 进 repo，再改 `skills/3rd-review/`，还是改现有 `workflows/*` 调用点加外部 runner。

## Checks

审查维度覆盖：方向、盲点、细节
- 维度[方向]：已覆盖
- 维度[盲点]：已覆盖
- 维度[细节]：已覆盖

## Required Revisions

降级理由：(未提供，需补充)
- 必须修复：D2 自动推进规则与宪法 F7 冲突
- 必须修复：核心改动目标路径与当前仓库结构不一致


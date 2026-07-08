# 审查报告 — build-spec-wh-review-rebuild-20260705T160512Z-766077 (round 31)

- verdict: revise_required
- provenance: single-context

## Summary

先修正权威路径与调用面范围，再去掉同源裁决违宪设计；否则两层架构无法在真实入口生效。

## Findings

- [blocking] 问题: 实施路径写错到不存在的 `skills/...`，按 spec 落地会改错位置 | 建议: 仓库现状的 stage 技能在 `workflows/make-decision/SKILL.md`、`workflows/build-spec/SKILL.md`、`workflows/build-plan/SKILL.md`、`workflows/build-code/SKILL.md`、`workflows/verify-code/SKILL.md`，而 spec/影响范围/FR 多处把目标写成 `skills/...`，并要求新建 `skills/wh-review/`、改 `skills/3rd-review/SKILL.md`。现有调用面也都在 `workflows/*/SKILL.md`。这个不是文案小瑕疵，而是会直接把实现者带去错误目录，导致验收对象和真实入口脱节。至少需要把所有权威路径统一到仓库真实结构，并明确 `3rd-review` 在本仓库内的承载位置或外部依赖边界。
- [blocking] 问题: 调用链迁移范围定义不完整，无法实现“两层架构实际生效” | 建议: spec 的一句话目标是“5 个 stage 统一改为经 wh-review 调度”，但影响范围只要求“5 个 stage 收尾步骤统一调用 `docs/human-brief-template.md`”，没有把各 stage 里现存的直接 `3rd-review` 调用点列为必须迁移项。现状里直接调用分散在多个非收尾位置：如 `workflows/make-decision/SKILL.md` 的 S5 审查段、`workflows/build-spec/SKILL.md` 3.7、`workflows/verify-code/SKILL.md` step 10，且都还是 `bash /path/to/3rd-review/standalone.sh --checkpoint=...` 形式。若只改收尾段，stage 仍会绕过 wh-review，stage→合同映射、轮次状态、报告渲染都不会生效。spec 需要把“5 个 stage 的全部 3rd-review 入口改为 wh-review”写成显式 FR/AC，并逐个列出调用点迁移要求。
- [blocking] 问题: “第4轮强制转同源”与宪法 Q3 冲突，当前 spec 允许非异源裁决继续充当质量结论 | 建议: spec 把 wh-review 定义为最多 3 轮异源审查后“第4轮起强制转同源”，同时仍让 wh-review 产出最终裁决 `pass / revise_required / escalate_to_human`。但仓库宪法 `CONSTITUTION.md` 的 Q3 明确要求“质量裁决必须由独立来源（异源审查者）在独立上下文中产出，禁止自审自判”。当前 spec 没有限定“同源”只能提供辅助意见、不能形成 pass/revise_required 裁决，因此设计上已经允许违宪路径。要么删掉同源裁决机制，要么改成第4轮直接 `escalate_to_human`，同源最多作为非裁决性参考材料。
- [minor] 问题: 新建 `wh-review` 但没定义指标/统一执行记录接入，和 S4/F6 对不上 | 建议: 宪法要求自研技能配套指标系统并接统一外置执行记录（S4/F6）。spec 目前要求落盘轮次状态和报告，但没有定义 `wh-review` 的最小指标面、记录位置、与现有执行记录如何对齐。虽不一定阻断实现，但如果不在 spec 阶段补齐，后续很容易做成只写零散文件、不进统一记录的半成品。

## Checks

审查维度覆盖：方向、盲点、细节
- 维度[方向]：已覆盖
- 维度[盲点]：已覆盖
- 维度[细节]：已覆盖

## Required Revisions

降级理由：(未提供，需补充)
- 必须修复：实施路径写错到不存在的 `skills/...`，按 spec 落地会改错位置
- 必须修复：调用链迁移范围定义不完整，无法实现“两层架构实际生效”
- 必须修复：“第4轮强制转同源”与宪法 Q3 冲突，当前 spec 允许非异源裁决继续充当质量结论


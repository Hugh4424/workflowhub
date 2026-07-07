# 审查报告 — build-spec-wh-review-rebuild-20260705T160512Z-766077 (round 29)

- verdict: revise_required
- provenance: single-context

## Summary

先修正实施宿主与文件路径，再补齐 3rd-review/wh-review 结果状态机（尤其 `unknown`），最后处理自动推进与 F7 的宪法冲突。

## Findings

- [blocking] 问题: 改动目标路径与所有权写错，实施面不成立 | 建议: 规格把 5 个 stage 的收尾改动写成 `skills/make-decision/SKILL.md`、`skills/build-spec/SKILL.md` 等，但仓库实际文件在 `workflows/make-decision/SKILL.md`、`workflows/build-spec/SKILL.md`、`workflows/build-plan/SKILL.md`、`workflows/build-code/SKILL.md`、`workflows/verify-code/SKILL.md`。同时仓库内不存在 `skills/3rd-review/SKILL.md`；当前仅在 `skills/reuse-registry.md` 声明外部依赖 `packages/core/agenthub/skills/3rd-review`，各 stage 也只是调用 `/path/to/3rd-review/standalone.sh`。现规格一边要求重构 `skills/3rd-review/SKILL.md`，一边又把 agenthub 侧改动列为 out-of-scope，导致实现宿主、落点路径、改动边界三者互相冲突。必须先明确：3rd-review 是 vendoring 进本仓库，还是继续外部依赖；stage 收尾修改的真实路径也要全部改正。
- [blocking] 问题: 审查结果状态机不闭合，`unknown` 路径被现有机制使用但新规格未定义去向 | 建议: 现有已采纳文档 `docs/plain-language-mechanism-design.md` 和 `workflows/build-spec/SKILL.md` 明确存在 `3rd-review verdict = unknown` 的一条真实路径：build-spec 在 `unknown` 时停止自动放行并等人拍板。新规格把 wh-review 最终裁决压成 `pass / revise_required / escalate_to_human` 三值，但没有说明 3rd-review 是否仍可返回 `unknown`，也没有定义 wh-review 如何映射、记录、落盘和驱动 D2。Known Gaps 只提了 `standalone.sh` 参数不一致，没补这条行为兼容。结果是 build-spec 的现存边界行为在新架构下变成未定义，验收 AC-D5/AC-D7 也无法稳定判定。需要在规格里明确：`unknown` 是否废除；若保留，属于 3rd-review 内部态还是 wh-review 对外态；若废除，build-spec 当前人工停顿语义由哪个枚举接管。
- [blocking] 问题: 自动推进规则与宪法 F7 正面冲突，未给出修宪或例外条款 | 建议: 规格在 FR-D2-001 与多处正文中要求 `build-spec / build-code` 的 pass 路径自动推进，但项目宪法 `CONSTITUTION.md` 的 F7 明写“阶段推进与不可逆操作必须经人在边界确认，不由系统自动越界执行”。当前仓库虽已有 `docs/human-brief-template.md` 和 `docs/plain-language-mechanism-design.md` 支持两类边界，但宪法正文并未同步放宽到“仅部分阶段需人工确认”。按 review 规则，宪法冲突属于阻断项。要么先修宪并更新 `constitution-checklist.md`，要么把本规格改成与现宪法一致的人确认推进模型。

## Checks

审查维度覆盖：方向、盲点、细节
- 维度[方向]：已覆盖
- 维度[盲点]：已覆盖
- 维度[细节]：已覆盖

## Required Revisions

降级理由：(未提供，需补充)
- 必须修复：改动目标路径与所有权写错，实施面不成立
- 必须修复：审查结果状态机不闭合，`unknown` 路径被现有机制使用但新规格未定义去向
- 必须修复：自动推进规则与宪法 F7 正面冲突，未给出修宪或例外条款


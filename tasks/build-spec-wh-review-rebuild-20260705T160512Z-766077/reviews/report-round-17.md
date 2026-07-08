# 审查报告 — build-spec-wh-review-rebuild-20260705T160512Z-766077 (round 17)

- verdict: revise_required
- provenance: single-context

## Summary

先修正真实文件路径与宿主边界，再消解 F7 冲突，并补齐轮次状态机的阈值与优先级定义后再进入实现。

## Findings

- [blocking] 问题: 变更目标路径与仓库真实结构不一致 | 建议: 规格把主要改动点写成 `skills/3rd-review/SKILL.md`、`skills/wh-review/` 和 5 个 `skills/<stage>/SKILL.md`，但当前仓库里阶段入口实际在 `workflows/make-decision/SKILL.md`、`workflows/build-spec/SKILL.md`、`workflows/build-plan/SKILL.md`、`workflows/build-code/SKILL.md`、`workflows/verify-code/SKILL.md`，且当前可见树中不存在已落地的 `skills/3rd-review/`。按现稿实现会直接把范围、验收项、影响分析绑到错误路径，AC-D1/AC-D6 也无法对真实宿主做客观验证。需先改正 authoritative paths，并明确 3rd-review 在本仓库中的真实承载位置。
- [blocking] 问题: 阶段推进规则与宪法 F7 冲突 | 建议: FR-D2-001 明确允许 `build-spec` / `build-code` 在 pass 后自动推进，且与 `docs/human-brief-template.md` 的“自动放行阶段”一致；但项目最高优先级基线 `CONSTITUTION.md` F7 写的是“阶段推进与不可逆操作必须经人在边界确认，不由系统自动越界执行”。当前规格没有给出宪法修订、例外条款或优先级说明，属于未消解的规范冲突，不能直接实施。
- [blocking] 问题: 审查轮次分支条件未定，核心算法不可实现 | 建议: FR-WHREVIEW-003 同时要求“异源最多 3 轮”“第 4 轮起强制转同源”“连续 3 轮 blocking 或指纹重复 blocking 升级人工”，但 Known Gaps 仍把“`大量 blocking` 的数值阈值”和“第 4 轮转同源 vs 连续 3 轮升级人工的优先级”留空。这里不是边角细节，而是 wh-review 主状态机的核心分支；阈值和优先级未定，就无法稳定实现 AC3-3、AC-D10，也无法写出可证伪测试。

## Checks

审查维度覆盖：方向、盲点、细节
- 维度[方向]：已覆盖
- 维度[盲点]：已覆盖
- 维度[细节]：已覆盖

## Required Revisions

降级理由：(未提供，需补充)
- 必须修复：变更目标路径与仓库真实结构不一致
- 必须修复：阶段推进规则与宪法 F7 冲突
- 必须修复：审查轮次分支条件未定，核心算法不可实现


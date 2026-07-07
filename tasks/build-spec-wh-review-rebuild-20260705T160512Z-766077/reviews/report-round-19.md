# 审查报告 — build-spec-wh-review-rebuild-20260705T160512Z-766077 (round 19)

- verdict: revise_required
- provenance: single-context

## Summary

先修正真实改动路径与调用面清单，再补全 3rd-review 迁移范围和 wh-review 轮次状态机的确定性规则。

## Findings

- [blocking] 问题: 目标文件路径写错，验收对象指向不存在的文件 | 建议: review package 将核心改动和机器验收都绑定到 `skills/3rd-review/SKILL.md` 与 `skills/{make-decision,build-spec,build-plan,build-code,verify-code}/SKILL.md`，但仓库真实入口在 `workflows/.../SKILL.md`，且当前不存在 `skills/3rd-review/SKILL.md`。这会让 AC-D1、AC-D2、AC-D6、影响范围表、以及后续实现计划全部瞄错文件，导致按 spec 落地也无法在真实仓库通过验收。
- [blocking] 问题: 3rd-review 接口重构未覆盖现有调用面，现有 workflow 会悬空 | 建议: spec 把 3rd-review 改成纯引擎 `{mode, contract, materials}`，并要求调用方切到 wh-review，但正文只明确了 5 个 stage 的收尾统一和 stage→合同路由，没有定义现有直接调用 3rd-review 的迁移方案。仓库里这些调用不只在收尾：`workflows/make-decision/SKILL.md` S5、`workflows/build-spec/SKILL.md` 3.7、`workflows/build-plan/SKILL.md` Step 8、`workflows/build-code/SKILL.md` §7/§13/§14、`workflows/verify-code/SKILL.md` Step 10 都依赖当前 `--checkpoint`/standalone 语义。若按现 spec 精简 3rd-review，这些活跃调用会直接失配，属于破坏性遗漏。
- [blocking] 问题: 轮次与升级规则未定死，FR-WHREVIEW-003 目前不可实现也不可验收 | 建议: spec 同时写了“第4轮起强制转同源”和“连续3轮大量 blocking 或指纹重复 blocking → 升级人工”，但 Known Gaps 又承认两条规则优先级未定义；同时“大量 blocking”没有数值阈值。结果是同一审查历史可能被不同实现裁成 `same-source` 或 `escalate_to_human`，AC3-3/AC-D10 也无法稳定做机器验收。这不是实现细节，而是核心状态机缺口。
- [minor] 问题: 前置依赖现状判断过时 | 建议: 影响范围写了 `docs/human-brief-template.md` “可能新建/确认存在”，但仓库里该文件已存在。这不单独阻断，但说明 spec 的现状勘查还不够新，建议在正文改成“复用现有模板”并去掉不确定表述。

## Checks

审查维度覆盖：方向、盲点、细节
- 维度[方向]：已覆盖
- 维度[盲点]：已覆盖
- 维度[细节]：已覆盖

## Required Revisions

降级理由：(未提供，需补充)
- 必须修复：目标文件路径写错，验收对象指向不存在的文件
- 必须修复：3rd-review 接口重构未覆盖现有调用面，现有 workflow 会悬空
- 必须修复：轮次与升级规则未定死，FR-WHREVIEW-003 目前不可实现也不可验收


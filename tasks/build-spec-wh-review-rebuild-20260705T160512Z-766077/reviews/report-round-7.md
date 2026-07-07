# 审查报告 — build-spec-wh-review-rebuild-20260705T160512Z-766077 (round 7)

- verdict: revise_required
- provenance: single-context

## Summary

先修正 3 个根冲突：统一阶段命名与迁移路径、删除 auto-advance、删除或改写“第4轮强制转同源”为仅人工接管或继续异源审查。

## Findings

- [blocking] 问题: 阶段命名与仓库基线不一致，缺少迁移方案 | 建议: spec 把 5 个 stage 定义为 make-decision / build-spec / build-plan / build-code / verify-code，并要求修改对应 `skills/<stage>/SKILL.md`。但当前仓库基线与术语表使用的是 intake / design / plan / apply / test-acceptance，现有 `skills/` 下也不存在这 5 个目标目录。spec 没有明确这是新命名迁移、别名层，还是新建并替换旧阶段，也没有定义工作流入口、目录重命名、兼容旧调用方的迁移步骤。按现稿实施会直接落到不存在的宿主结构，范围和验收对象都不清。
- [blocking] 问题: 自动推进规则违反宪法 F7 | 建议: FR-D2-001 明确允许 build-spec / build-code 的 pass 路径自动推进，但 `CONSTITUTION.md` 的 F7 写明“阶段推进与不可逆操作必须经人在边界确认，不由系统自动越界执行”。这是直接冲突，不是实现细节问题。只要 spec 保留 auto-advance，就与项目最高优先级规则不兼容。
- [blocking] 问题: 第4轮强制转同源与异源裁决原则冲突 | 建议: FR-WHREVIEW-003 规定“异源最多3轮；第4轮起强制转同源”。但 `CONSTITUTION.md` 的 F4/Q3 要求质量裁决依靠异源审查与人，且“质量裁决必须由独立来源、在独立上下文中产出，禁止自审自判”。同源审查不能替代质量裁决。现稿把第4轮同源写成正式审查路径，会把最终裁决建立在违反宪法的机制上。

## Checks

审查维度覆盖：方向、盲点、细节
- 维度[方向]：已覆盖
- 维度[盲点]：已覆盖
- 维度[细节]：已覆盖

## Required Revisions

降级理由：(未提供，需补充)
- 必须修复：阶段命名与仓库基线不一致，缺少迁移方案
- 必须修复：自动推进规则违反宪法 F7
- 必须修复：第4轮强制转同源与异源裁决原则冲突


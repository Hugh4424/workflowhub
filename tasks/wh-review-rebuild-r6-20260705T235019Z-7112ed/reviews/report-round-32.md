# 审查报告 — wh-review-rebuild-r6-20260705T235019Z-7112ed (round 32)

- verdict: revise_required
- provenance: single-context

## Summary

先统一 3rd-review 的唯一调用契约，再把 D2 推进规则改到与 F7 一致，最后收紧 §7 的验收口径。

## Findings

- [blocking] 问题: D2 自动推进规则违反宪法 F7 | 建议: spec 在 FR-D2-001、§7.2、§8 明确要求 `build-spec` 和 `build-code` 在 `verdict=pass` 后自动推进下一 stage，但仓库宪法 `CONSTITUTION.md` 的 F7 明写“阶段推进…必须经人在边界确认，不由系统自动越界执行”。这是直接冲突，不是实现细节差异；按当前 spec 落地会产生不合宪实现。
- [blocking] 问题: 3rd-review 输入契约自相矛盾，无法稳定实现 | 建议: §2 目标和 §6 数据流把 3rd-review 定义为输入 `{mode, contract, materials}`，但 FR-THIRDREVIEW-001 方案A 又要求 wh-review 先把合同与材料装配成“一份完整的纯文本审查包”，并强调 3rd-review 只接收这份装配后的文本、无任何合同路由信息。两种接口模型不兼容，会导致实现者无法判断 3rd-review 的权威调用形态、日志结构和独立调用方式，也使 NFR-3 的“可独立调用”缺少清晰契约。
- [minor] 问题: §7 机器校验规则过窄，无法真实覆盖“无条件分支”目标 | 建议: FR-THIRDREVIEW-002 只举例匹配 `^\s*\d+\.` 和 `/\bif\b.*\belse\b/`。这无法拦住大量等价写法，比如只写 `if`、使用中文“如果/否则”、项目符号 `- item`、有序列表 `1)`。如果目标真是“删除所有流程步骤和 if/else 逻辑”，验收模式需要改成更完整的文本规则，或把“机器可检验”降级为人工审查辅助。

## Checks

审查维度覆盖：方向、盲点、细节
- 维度[方向]：已覆盖
- 维度[盲点]：已覆盖
- 维度[细节]：已覆盖

## Required Revisions

降级理由：(未提供，需补充)
- 必须修复：D2 自动推进规则违反宪法 F7
- 必须修复：3rd-review 输入契约自相矛盾，无法稳定实现


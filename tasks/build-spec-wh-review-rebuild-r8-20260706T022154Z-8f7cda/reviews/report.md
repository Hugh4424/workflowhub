# 审查报告 — build-spec-wh-review-rebuild-r8-20260706T022154Z-8f7cda (round 6)

- verdict: revise_required
- provenance: single-context

## Summary

方向本身可继续，但这版 spec 还有 5 个阻断点：D6 范围漂移、Business Impact Scope 低估、报告命名验收自相矛盾、intake 合同验收把 schema 和实例混了、3rd-review 的 stage 参数口径前后冲突。`plan-design-review` 为 not_applicable：本任务不是 UI scope。

## Findings

- [blocking] 位置: specs/wh-review-rebuild/spec.md:285 | 问题: 把 `docs/human-brief-template.md` 统一收尾写成了本期实施项，但 decision-log 已确认这是现状已成立、非缺陷。当前写法把 D6 从“已满足的守护约束”误写成“需要改造的范围”。 | 建议: 把 D6 从 `In-scope`/`FR-STAGE-001` 的改造项降为回归守护项，只要求后续实现不得破坏现有统一模板调用，不再要求专门改这 5 个 stage 收尾。
- [blocking] 位置: specs/wh-review-rebuild/spec.md:455 | 问题: `Business Impact Scope` 低估改动面，并错误写成“5 stage 主体逻辑（非收尾段）不变”。这次迁移实际会改到各 workflow 的真实审查调用点、推进边界和审查时机，不只是 `3rd-review` 和收尾段。 | 建议: 重写影响范围和 Business Impact Scope，按每个 workflow 调用点列出迁移前后行为、推进边界变化、测试面和风险；删除“主体逻辑不变”这类错误结论。
- [blocking] 位置: specs/wh-review-rebuild/spec.md:151 | 问题: `AC1-5` 要求对 `tasks/{task-id}/reports/` 下“所有报告文件名”匹配 `^[a-z-]+--\d+(-pass|-failed)?\.md$`，但同一节又要求该目录固定存在 `report-index.md`。这两个要求同时成立不了。 | 建议: 明确正则只校验 stage report 文件并排除 `report-index.md`，或把索引文件移到别的固定路径。
- [blocking] 位置: specs/wh-review-rebuild/spec.md:330 | 问题: `AC9-2` 把 `decision`/`scope.in`/`scope.out`/`open_questions` 说成“合同文件中必须存在且非空字符串”，但 decision-log D4 的语义是这些字段必须出现在被审的 make-decision 产物实例里，不是静态合同文件自己承载业务值。 | 建议: 把 `AC9-2` 改成实例级验证：给定一个 make-decision 输出，校验这些字段存在、非空、可 parse；合同文件只定义检查规则，不要求填实例值。
- [blocking] 位置: specs/wh-review-rebuild/spec.md:489 | 问题: `AC-D1` 要求比较“去掉/加上 stage 参数”的两次 3rd-review 调用结果是否一致，但 `FR-THIRDREVIEW-001` 又明确禁止向 3rd-review 传入 stage 名称或轮次号。验收口径和调用契约互相冲突。 | 建议: 二选一并写死：要么 3rd-review 严禁接收 stage 参数并删除这条对比验收；要么定义为“传入也必须被忽略且结果一致”，并同步改写 FR-THIRDREVIEW-001 的禁止条款。

## Checks

审查维度覆盖：方向、盲点、细节
- 维度[方向]：已覆盖
- 维度[盲点]：已覆盖
- 维度[细节]：已覆盖

## Required Revisions

降级理由：(未提供，需补充)
- 必须修复：把 `docs/human-brief-template.md` 统一收尾写成了本期实施项，但 decision-log 已确认这是现状已成立、非缺陷。当前写法把 D6 从“已满足的守护约束”误写成“需要改造的范围”。
- 必须修复：`Business Impact Scope` 低估改动面，并错误写成“5 stage 主体逻辑（非收尾段）不变”。这次迁移实际会改到各 workflow 的真实审查调用点、推进边界和审查时机，不只是 `3rd-review` 和收尾段。
- 必须修复：`AC1-5` 要求对 `tasks/{task-id}/reports/` 下“所有报告文件名”匹配 `^[a-z-]+--\d+(-pass|-failed)?\.md$`，但同一节又要求该目录固定存在 `report-index.md`。这两个要求同时成立不了。
- 必须修复：`AC9-2` 把 `decision`/`scope.in`/`scope.out`/`open_questions` 说成“合同文件中必须存在且非空字符串”，但 decision-log D4 的语义是这些字段必须出现在被审的 make-decision 产物实例里，不是静态合同文件自己承载业务值。
- 必须修复：`AC-D1` 要求比较“去掉/加上 stage 参数”的两次 3rd-review 调用结果是否一致，但 `FR-THIRDREVIEW-001` 又明确禁止向 3rd-review 传入 stage 名称或轮次号。验收口径和调用契约互相冲突。


# 审查报告 — build-spec-wh-review-rebuild-r4-20260705T172116Z-5a7765 (round 2)

- verdict: escalate_to_human
- provenance: single-context

## Summary

按 required skill 的只读 fallback lens 做了审查，但评审包缺少强制源件，无法完成 decision-log 溯源和 round-2 recurrence 校验；同时 spec 本身还有业务影响范围缺失、Spec-Purity 违规、以及关键验收只验文本/代码不验行为的问题。当前应人工升级，补齐评审包后再审。

## Findings

- [blocking] 位置: spec.md:4 | 问题: 评审包缺少 `wh-review-rebuild/decision-log.md` 及上一轮评审产物，无法执行合同要求的 source-trace 和 round-2 recurrence 检查。当前 spec 在第 4/34/322/340 行多次声称来自 decision-log，但仓内不存在该源文件，review 只能看到声称，不能核真伪。 | 建议: 把实际 `wh-review-rebuild/decision-log.md`、上一轮 verdict/report、以及本轮 review package manifest 一起放进评审包后重审。没有这些源件，不应继续给 pass/revise 结论。
- [blocking] 位置: spec.md:396 | 问题: “影响范围”章节写成了文件/模块清单，不是业务影响范围。按 reviewer contract，这一章必须覆盖会被本需求改变或破坏的既有业务行为、用户场景、推进规则和审查规则；仅列 `skills/...`/`docs/...` 路径无法判断遗漏了哪些现有行为。 | 建议: 重写第 7 章，只写业务层影响：5 个 stage 的审查触发方式、pass 后推进/人工确认规则、3rd-review 独立调用语义、报告落盘与轮次追踪、既有直调 3rd-review 的调用方迁移影响等；文件路径移出该章。
- [blocking] 位置: spec.md:239 | 问题: spec 命中 Spec-Purity blacklist。这里直接写了 literal shell command/CLI 形态和 flags（239-245），第 259 行还内嵌完整调用串。设计规格不应把 shell 命令行当成需求合同。 | 建议: 删除命令块和内联命令串，改成能力级契约描述：输入是什么、输出是什么、禁止传什么、冲突时如何 fail-loud。具体 CLI 形态下沉到 plan/implementation。
- [blocking] 位置: spec.md:312 | 问题: 关键验收项仍有“验代码不验行为”的问题。比如 AC8-1/8-2 只检查代码分支里是否存在自动推进逻辑，AC-D1/D2/D3/D6 主要是 grep/存在性检查；这些不能证明真实运行时会正确停在人工确认门、正确路由专属合同、正确落盘报告。 | 建议: 把关键验收补成行为验证：给出至少一条可执行流程，验证 make-decision/build-plan/verify-code 在 `verdict=pass` 时实际停住，build-spec/build-code 实际自动推进，route-decision 实际记录专属合同，报告与轮次状态实际落盘。保留 grep 只能做辅证，不能做主验收。

## Checks

审查维度覆盖：方向、盲点、细节
- 维度[方向]：已覆盖
- 维度[盲点]：已覆盖
- 维度[细节]：已覆盖

## Required Revisions

降级理由：(未提供，需补充)
- 必须修复：评审包缺少 `wh-review-rebuild/decision-log.md` 及上一轮评审产物，无法执行合同要求的 source-trace 和 round-2 recurrence 检查。当前 spec 在第 4/34/322/340 行多次声称来自 decision-log，但仓内不存在该源文件，review 只能看到声称，不能核真伪。
- 必须修复：“影响范围”章节写成了文件/模块清单，不是业务影响范围。按 reviewer contract，这一章必须覆盖会被本需求改变或破坏的既有业务行为、用户场景、推进规则和审查规则；仅列 `skills/...`/`docs/...` 路径无法判断遗漏了哪些现有行为。
- 必须修复：spec 命中 Spec-Purity blacklist。这里直接写了 literal shell command/CLI 形态和 flags（239-245），第 259 行还内嵌完整调用串。设计规格不应把 shell 命令行当成需求合同。
- 必须修复：关键验收项仍有“验代码不验行为”的问题。比如 AC8-1/8-2 只检查代码分支里是否存在自动推进逻辑，AC-D1/D2/D3/D6 主要是 grep/存在性检查；这些不能证明真实运行时会正确停在人工确认门、正确路由专属合同、正确落盘报告。


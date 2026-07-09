# 审查报告 — build-spec-wh-review-rebuild-r8-20260706T022154Z-8f7cda (round 2)

- verdict: revise_required
- provenance: single-context

## Summary

方向基本对齐 decision-log，但仍有 4 个 blocking：失败/边界场景缺失、6 章报告来源追溯不真实、Business Impact Scope 漏掉 D4/D5、部分 AC 仍不可判定。按 plan-ceo-review/review lens 做了只读 fallback；UI 不在范围内。

## Findings

- [blocking] 位置: spec.md:90 | 问题: Round 1 blocking issue still open: 第 3 章只有正常流/升级流/路由流，没有明确的失败场景和边界场景。`stage` 缺失/未知、合同缺失、result-file 缺失或不可解析、轮次硬顶转同源/升级人工等 fail-loud 路径没有写成 Given/When/Then。按审查合同，缺至少一个 failure scenario 和一个 boundary scenario 不能进 plan。 | 建议: 在场景章补最少 2 个可检验场景：1 个失败场景，覆盖缺 `stage`、未知 `stage` 或 result-file 不可解析时的非零退出与错误输出；1 个边界场景，覆盖第 3 轮末升级人工与第 4 轮转同源的边界判定，并直接关联到 FR-WHREVIEW-001/002/003/THIRDREVIEW-001 与 NFR-2。
- [blocking] 位置: spec.md:216 | 问题: 新增的 6 章报告结构被写成“来源：decision-log D1”且章数、顺序、语义“已定死”，但 decision-log D1 只确认了“6章结构，落盘任务目录”，没有确认这 6 个具体章节名和语义；spec 自己在 Known Gaps 里又承认“6章结构名称未在 decision-log 中明确列出”。这是 source trace 不真实，属于未获授权的新核心合同。 | 建议: 二选一：1）删掉“已定死”的 6 章名/顺序/语义，只保留 D1 已确认的粒度，等 build-plan 核实 agenthub 原实现后再定；2）补上真实来源和理由，把章节名/顺序/语义明确追溯到已验证的上游实现或批准记录。
- [blocking] 位置: spec.md:440 | 问题: Round 1 blocking issue still open: `Business Impact Scope` 仍然漏项。第 8 章写了路由、pass 门、报告、轮次，但没把 decision-log D4/D5 带来的既有 stop/go 行为变化列进去：make-decision 现在要按 C1-C6 判据卡口，verify-code 现在要按 F1-F6 新鲜性卡口。这些都会改变现有审查放行规则。 | 建议: 扩充第 8 章，单列 make-decision intake 合同收紧、verify-code freshness 合同收紧，以及它们对现有通过/拦回/人工介入行为的影响，确保 D1/D2/D4/D5 的既有行为变化都能在 Business Impact Scope 里逐条找到。
- [blocking] 位置: spec.md:228 | 问题: Round 1 blocking issue still open: 多个验收口径仍不可判定。`AC4-2` 的“报告文件路径可预测”、`AC11-2` 的“本地跑通”、`AC-D7` 的“可本地跑通”都没有给出具体命令/手动步骤、观察物、失败判据，也缺反向断言，仍不满足可证伪验收要求。 | 建议: 把这些 AC 改成明确 oracle：写清输入前提、执行命令或手动步骤、预期文件/日志/退出码，以及什么结果算失败；例如固定 stage、固定报告目录检查、固定 route-decision 日志检查、固定冒烟命令与成功/失败输出。

## Checks

审查维度覆盖：方向、盲点、细节
- 维度[方向]：已覆盖
- 维度[盲点]：已覆盖
- 维度[细节]：已覆盖

## Required Revisions

降级理由：(未提供，需补充)
- 必须修复：Round 1 blocking issue still open: 第 3 章只有正常流/升级流/路由流，没有明确的失败场景和边界场景。`stage` 缺失/未知、合同缺失、result-file 缺失或不可解析、轮次硬顶转同源/升级人工等 fail-loud 路径没有写成 Given/When/Then。按审查合同，缺至少一个 failure scenario 和一个 boundary scenario 不能进 plan。
- 必须修复：新增的 6 章报告结构被写成“来源：decision-log D1”且章数、顺序、语义“已定死”，但 decision-log D1 只确认了“6章结构，落盘任务目录”，没有确认这 6 个具体章节名和语义；spec 自己在 Known Gaps 里又承认“6章结构名称未在 decision-log 中明确列出”。这是 source trace 不真实，属于未获授权的新核心合同。
- 必须修复：Round 1 blocking issue still open: `Business Impact Scope` 仍然漏项。第 8 章写了路由、pass 门、报告、轮次，但没把 decision-log D4/D5 带来的既有 stop/go 行为变化列进去：make-decision 现在要按 C1-C6 判据卡口，verify-code 现在要按 F1-F6 新鲜性卡口。这些都会改变现有审查放行规则。
- 必须修复：Round 1 blocking issue still open: 多个验收口径仍不可判定。`AC4-2` 的“报告文件路径可预测”、`AC11-2` 的“本地跑通”、`AC-D7` 的“可本地跑通”都没有给出具体命令/手动步骤、观察物、失败判据，也缺反向断言，仍不满足可证伪验收要求。


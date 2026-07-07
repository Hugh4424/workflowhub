# 审查报告 — build-spec-wh-review-rebuild-r2-20260705T164034Z-2d15d9 (round 1)

- verdict: revise_required
- provenance: single-context

## Summary

先补齐两件事：明确 `3rd-review` 是否还负责 `--checkpoint` 路由，以及 wh-review 下新合同如何被 `standalone.sh` 实际加载；这两点不定，核心架构不可实现。

## Findings

- [blocking] 问题: `3rd-review` 的“纯引擎”定位与 `--checkpoint` 路由契约自相矛盾 | 建议: FR-THIRDREVIEW-001 一方面要求 `3rd-review` 剥离所有 stage 知识，只接收 `{mode, contract, materials}`；另一方面又规定真实实现必须调用 `standalone.sh --checkpoint=<stage>`，并写明 `contract` 映射到 `--checkpoint`。`--checkpoint` 目前本身就是 stage/合同路由入口，这意味着路由仍发生在 `3rd-review` 一侧，不是 wh-review 预解析后的纯引擎调用。需要先定死一种架构：要么 wh-review 解析到具体合同文件并把合同内容/路径直接喂给引擎；要么承认 3rd-review 仍保留 checkpoint 路由职责，不能再宣称“无 stage 知识”。否则实现和验收都会失真。
- [blocking] 问题: stage 专属合同搬迁目标与现有 `standalone.sh` 能力边界未闭合 | 建议: 规格要求把 5 套合同搬到 `skills/wh-review/contracts/`，同时又要求继续通过 `standalone.sh` 执行审查，但文档没有定义 `standalone.sh` 如何加载这些新位置的合同。现有描述只给出 `--checkpoint=<stage>`，没有提供 `--contract-path` 或等价参数；而 Out-of-scope 又禁止修改 agenthub 侧文件，Known Gaps 也未说明 workflowhub 内如何把新合同暴露给 `standalone.sh`。结果是最关键的“加载 wh-review 下的新合同”链路没有可执行方案，AC2-1/AC2-2/AC-D4 目前不可验收。需要补齐合同发现机制：例如明确复制/生成到 `3rd-review` 可读位置，或扩展本仓库内 wrapper，把合同内容编译进 materials，再说明无需改 agenthub。
- [minor] 问题: 报告 6 章的“以 agenthub 原实现为准”与“可机器验证”同时存在，验收基线不稳定 | 建议: FR-WHREVIEW-004 先要求 6 章结构可 grep 验证，后又写“实际章节名以 agenthub 原实现为准，build-plan 阶段核实后在 wh-review SKILL.md 中固化”。在当前草稿里，章节名仍是占位，导致 AC4-3/AC-D4 的机器验收口径未锁定。应在本规格直接固定最终章节名或固定一个兼容映射规则。
- [minor] 问题: `worktree`/任务目录 的状态文件与报告落盘路径未规范到可唯一实现 | 建议: 多处要求“落盘任务目录”“路径可预测”“固定子路径”，但没有给出统一目录约定、命名规则、并发隔离策略。实现者可以做出多个互不兼容版本，后续 AC3-1、AC4-2、AC-D10 容易各说各话。建议在规格中直接固定相对路径模板。

## Checks

审查维度覆盖：方向、盲点、细节
- 维度[方向]：已覆盖
- 维度[盲点]：已覆盖
- 维度[细节]：已覆盖

## Required Revisions

降级理由：(未提供，需补充)
- 必须修复：`3rd-review` 的“纯引擎”定位与 `--checkpoint` 路由契约自相矛盾
- 必须修复：stage 专属合同搬迁目标与现有 `standalone.sh` 能力边界未闭合


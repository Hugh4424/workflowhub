# 审查报告 — wh-review-rebuild-r6-20260705T235019Z-7112ed (round 16)

- verdict: revise_required
- provenance: single-context

## Summary

先补齐收尾主流程和持久化状态契约，再统一报告/路由字段命名并清理已过期的 Known Gaps。

## Findings

- [blocking] 问题: 收尾主流程未定死，`wh-review`、`human-brief-template`、推进/挂起责任边界冲突 | 建议: 规格同时要求“5 个 stage 一律通过 wh-review 触发审查”（§7.1）、“5 个 stage 的 SKILL.md 收尾统一调用 `docs/human-brief-template.md`”（FR-STAGE-001）、以及按 stage 区分 pass 后自动推进或停在人工确认门（FR-D2-001），但没有给出唯一的收尾顺序和责任归属。当前无法判断是 stage 先调 `wh-review` 再调 brief、还是 brief 内部再触发 review、还是 wh-review 负责推进决策。实现者可以各自满足局部条款却产生不同系统行为，验收也无法稳定判定。需要补一条定死的 canonical tail flow：每个 stage 收尾按什么顺序调用哪些组件，谁负责写 stage-result，谁负责 auto-advance，谁负责进入人工确认等待态。
- [blocking] 问题: 状态契约不足，无法承载人工确认门与同源轮次上限的可追踪验收 | 建议: §6 只定义了最小轮次状态字段 `round_number`、`mode`、`verdict`、`report_path`、`blocking_count`、`fingerprint_repeated`，但本规格要求机器验证的行为还包括：D2 人工确认门挂起等待、build-spec/build-code 自动推进、同源模式独立最多 3 轮、route-decision 记录、以及第 3 轮末升级优先于切同源。现有状态模型没有字段表达 `awaiting_human_confirmation`、同源独立计数、是否已 auto-advance、route-decision 文件位置/引用，导致 AC8-1/AC8-2/AC3-* 只能靠口头解释，无法形成稳定实现和验收。需要补充持久化状态/结果契约，至少覆盖人工确认状态、same-source 独立计数、next-action 或 advance disposition、以及 route-decision 引用。
- [minor] 问题: `contract_hash` 要求与“hash 或 version anchor”表述不一致 | 建议: AC2-2 允许 route-decision 记录“hash（或版本锚点）”，但报告 Metadata 第 6 章又把字段定死为 `contract_hash`。如果实现选择 version anchor，将与固定字段名冲突。需要统一为强制 hash，或把字段改成同时兼容 hash/anchor 的中性命名。
- [minor] 问题: Known Gaps 仍保留已被正文定死的历史备注，增加实现歧义 | 建议: Known Gaps 里仍写“render-review-report.mjs 的6章结构名称未在 decision-log 中明确列出，build-plan 阶段需在 agenthub 原实现中核实”，但正文 FR-WHREVIEW-004 已把 6 章名称、顺序、语义定死。两处同时存在会让实现者误以为章节名仍可回查后再改。应删除或改写该 gap，避免规格内部自我降级。

## Checks

审查维度覆盖：方向、盲点、细节
- 维度[方向]：已覆盖
- 维度[盲点]：已覆盖
- 维度[细节]：已覆盖

## Required Revisions

降级理由：(未提供，需补充)
- 必须修复：收尾主流程未定死，`wh-review`、`human-brief-template`、推进/挂起责任边界冲突
- 必须修复：状态契约不足，无法承载人工确认门与同源轮次上限的可追踪验收


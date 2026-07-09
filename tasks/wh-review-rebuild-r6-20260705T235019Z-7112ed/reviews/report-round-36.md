# 审查报告 — wh-review-rebuild-r6-20260705T235019Z-7112ed (round 36)

- verdict: revise_required
- provenance: single-context

## Summary

先补齐唯一落盘协议、D2 人工确认协议，并消除六章报告定义冲突；其余表述问题再顺手收敛。

## Findings

- [blocking] 问题: 报告六章定义与 Known Gaps 自相矛盾 | 建议: FR-WHREVIEW-004 已把 6 章名称、顺序、语义定义为“已定死”，并声称来源于 decision-log D1；但 Known Gaps 又写“render-review-report.mjs 的6章结构名称未在 decision-log 中明确列出，build-plan 阶段需在 agenthub 原实现中核实并在 SKILL.md 中定义”。这会直接影响实现基线和验收口径：到底按本 spec 固定六章落地，还是先去上游核实后再定。必须先消除这一冲突。
- [blocking] 问题: 审查状态与报告落盘路径未定死，验收无法稳定执行 | 建议: 文档多处只写“任务目录下固定子路径”“路径可预测”，但没有给出唯一规范路径；AC1-3 又示例为 `<task-dir>/<task-id>/reviews/`，其余章节未复用这一约定。状态文件、route-decision 文件、Delta Package、report_path 的具体目录关系也未统一。实现者无法据此保证兼容，测试也无法做稳定断言。需要在 spec 中给出唯一目录结构和文件命名规则。
- [blocking] 问题: D2 人工确认门缺少可执行接口定义 | 建议: spec 要求 make-decision/build-plan/verify-code 在 pass 后“挂起等待 human orchestrator 明确批准”，同时 build-spec/build-code 自动推进；但没有定义挂起信号、批准输入、状态落盘格式、恢复执行入口，也没定义 stage agent 与 wh-review 谁负责写入这一状态。当前只有行为要求，没有协议。按现状实现，5 个 stage 很可能各自发明一套门禁行为，无法满足“统一”目标。
- [minor] 问题: 5 套合同与 11 份既有合同的迁移范围表述含混 | 建议: 问题陈述写 agenthub 下“已实现的 11 份 stage 专属合同”从未被使用；In-scope 又写“搬迁 5 套 stage 专属合同（5 套均在本期交付）”。这里没有说明 11 与 5 的关系：是 5 套目录内共 11 文件，还是只迁移其中 5 个代表合同。建议把迁移清单写成明确文件列表。
- [minor] 问题: AC6 的机器校验规则过窄，容易被形式规避 | 建议: FR-THIRDREVIEW-002 只禁止 `1.` 和 `if/else` 模式，文本仍可用 `首先/然后/否则`、`A. B.`、有序步骤语义或条件分支同义写法绕过。若目标是让 §7 仅保留概念导读，验收规则应直接要求“不得包含可执行流程或分支指令”，并补充更稳的关键词/结构检查。
- [minor] 问题: 同源模式上限与升级条件描述重复且阅读成本高 | 建议: FR-WHREVIEW-003 同时定义异源 3 轮上限、同源 3 轮上限、升级条件优先级、同源下无需等待连续 3 轮即升级，规则本身可行，但文字绕且多处重复，容易导致实现者在第3轮末/第4轮起的切换点读错。建议整理成单一状态机或决策表。

## Checks

审查维度覆盖：方向、盲点、细节
- 维度[方向]：已覆盖
- 维度[盲点]：已覆盖
- 维度[细节]：已覆盖

## Required Revisions

降级理由：(未提供，需补充)
- 必须修复：报告六章定义与 Known Gaps 自相矛盾
- 必须修复：审查状态与报告落盘路径未定死，验收无法稳定执行
- 必须修复：D2 人工确认门缺少可执行接口定义


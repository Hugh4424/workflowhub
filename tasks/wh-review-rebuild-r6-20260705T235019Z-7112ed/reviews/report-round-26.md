# 审查报告 — wh-review-rebuild-r6-20260705T235019Z-7112ed (round 26)

- verdict: revise_required
- provenance: single-context

## Summary

先统一报告章节真源、补齐 D2 人工确认协议、闭合 human-brief-template 依赖，再细化落盘路径与轮次状态模型。

## Findings

- [blocking] 问题: 报告章节定义前后冲突 | 建议: FR-WHREVIEW-004 已把 6 章结构、顺序、语义定死，但 Known Gaps 又写“render-review-report.mjs 的6章结构名称未明确列出，build-plan 阶段需在 agenthub 原实现中核实并在 SKILL.md 中定义”。这会让实现者无法判断应直接按当前 spec 固化，还是以后续核实结果为准。需统一成单一真源。
- [blocking] 问题: D2 人工确认门缺少可执行协议 | 建议: 规格只要求 make-decision/build-plan/verify-code 的 pass 路径“触发人工确认流程、挂起等待 human orchestrator 明确批准”，但没有定义批准信号、落盘状态、恢复命令/入口、超时/取消处理、谁负责推进下一 stage。AC8-1/AC-D5 需要集成验证，没有这个协议无法稳定实现也无法验收。
- [blocking] 问题: human-brief-template 依赖未闭合 | 建议: FR-STAGE-001 要求 5 个 stage 统一调用 docs/human-brief-template.md，但 Known Gaps 明确写“是否已存在未经确认，若不存在须作为前置依赖在 build-plan 中标出”。当前 spec 没有把“若不存在则创建”纳入 scope，也没有把它声明为外部前置条件，交付边界不闭合。
- [minor] 问题: 审查状态与报告落盘路径不够具体 | 建议: 多处要求“任务目录下固定子路径”“路径可预测”“route-decision 记录文件可 grep”，但没有统一给出状态文件、route-decision、Delta Package、报告的确切相对路径约定。实现者可能各自命名，导致 AC1-3、AC2-2、AC3-1、AC4-2、AC-D4、AC-D10 的验收口径不一致。
- [minor] 问题: 同源模式切换触发点描述不够精确 | 建议: FR-WHREVIEW-003 写“第4轮起强制转同源”，同时又写“同源模式最多3轮（独立计数）”。但没有明确第4轮是否一定进入 same-source，还是仅在异源第3轮末 verdict!=pass 且未升级人工时进入；也没有给出 round_number 与 same-source 独立计数的字段模型。建议把异源轮次、同源轮次、总轮次的状态字段明确分开。

## Checks

审查维度覆盖：方向、盲点、细节
- 维度[方向]：已覆盖
- 维度[盲点]：已覆盖
- 维度[细节]：已覆盖

## Required Revisions

降级理由：(未提供，需补充)
- 必须修复：报告章节定义前后冲突
- 必须修复：D2 人工确认门缺少可执行协议
- 必须修复：human-brief-template 依赖未闭合


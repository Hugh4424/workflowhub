# 审查报告 — wh-review-rebuild-r6-20260705T235019Z-7112ed (round 43)

- verdict: revise_required
- provenance: single-context

## Summary

先修正文档内的权威锚点和边界冲突：补齐或改掉 §13 引用，确定报告结构唯一来源，并明确 D2 改造是否允许修改 stage 执行流主体逻辑。

## Findings

- [blocking] 问题: 引用了不存在的 §13，导致 3rd-review 改写目标无法落地 | 建议: 规格多处把 3rd-review 的单次调用语义指向“§13”，包括 FR-THIRDREVIEW-002、7.4、AC6-3；但当前文档实际没有 §13。结果是 §7 应该导向什么内容、实现方该依据哪一节收敛接口，都没有可执行锚点。必须先补出实际的 §13 内容，或把所有引用改到现有章节。
- [blocking] 问题: 报告 6 章结构已被定死，但 Known Gaps 又要求后续去 agenthub 核实 | 建议: FR-WHREVIEW-004 已把 6 个章节名称、顺序、语义定义为不可更改的正式要求；Known Gaps 同时写明“6章结构名称未在 decision-log 中明确列出，build-plan 阶段需在 agenthub 原实现中核实并在 SKILL.md 中定义”。这两个要求互相冲突：如果当前规格已定死，就不应再以外部实现为准核实；如果还需核实，就不能把当前名称当最终验收标准。必须明确单一权威源。
- [blocking] 问题: “5 个 stage 主体逻辑不变”与 D2 人工确认门改造要求冲突 | 建议: 第 8 节“不受影响的范围”声明“workflowhub 5 stage 的主体逻辑（非收尾段）不变”。但 FR-D2-001、7.2、AC8-1/2 要求 make-decision/build-plan/verify-code 的 pass 路径停在人工确认门，build-spec/build-code 自动推进。这是执行流变更，不一定只靠收尾模板替换就能实现。当前规格同时要求改行为又声明主体逻辑不变，实施边界不一致，容易造成计划和验收口径错位。

## Checks

审查维度覆盖：方向、盲点、细节
- 维度[方向]：已覆盖
- 维度[盲点]：已覆盖
- 维度[细节]：已覆盖

## Required Revisions

降级理由：(未提供，需补充)
- 必须修复：引用了不存在的 §13，导致 3rd-review 改写目标无法落地
- 必须修复：报告 6 章结构已被定死，但 Known Gaps 又要求后续去 agenthub 核实
- 必须修复：“5 个 stage 主体逻辑不变”与 D2 人工确认门改造要求冲突


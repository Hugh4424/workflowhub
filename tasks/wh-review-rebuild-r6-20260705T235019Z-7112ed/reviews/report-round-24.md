# 审查报告 — wh-review-rebuild-r6-20260705T235019Z-7112ed (round 24)

- verdict: revise_required
- provenance: single-context

## Summary

先补三件事：D2 挂起/恢复契约、review 状态与报告的精确落盘路径规范、3rd-review 唯一输入输出协议；补完后这份 spec 才能进入稳定实现。

## Findings

- [blocking] 问题: 人工确认门接口未定，D2 无法一致实现 | 建议: 规格要求 make-decision/build-plan/verify-code 在 pass 后“停在人工确认门”，但没有定义谁负责挂起流程、挂起状态写到哪里、人工批准通过什么文件或命令恢复、以及 stage 之间如何避免误自动推进。AC8 只描述结果，不给出可实现的控制面契约，5 个 stage 很容易各自实现出不兼容的停机/恢复逻辑。
- [blocking] 问题: 报告与轮次状态的落盘路径未定，多个验收项无法落地 | 建议: FR-WHREVIEW-001、FR-WHREVIEW-003、FR-WHREVIEW-004 都要求“任务目录下固定子路径”且“路径可预测”，但规格没有给出明确目录结构、task-id 来源、文件命名规则、覆盖/追加策略。AC1-3、AC3-1、AC4-2、AC-D10 都依赖这个路径约定；没有精确定义就无法写稳定实现和自动化验证。
- [blocking] 问题: 3rd-review 调用契约前后冲突，纯引擎边界不够可执行 | 建议: 目标节把 3rd-review 定义为输入 `{mode, contract, materials}`，但 FR-THIRDREVIEW-001 方案A 又要求 wh-review 先把合同与材料装配成“单份纯文本审查包”，并禁止传 stage 路由参数。与此同时又要求 3rd-review 返回结构化 verdict/findings，并在 result-file 缺失时按 unknown 处理。当前没有唯一、可测试的输入输出契约：到底是传三元组还是单文本包，结构化结果经 stdout、文件还是两者并存，fail-loud 冲突如何判定，都未定死。
- [minor] 问题: Known Gaps 中仍保留本期关键前置依赖未确认项 | 建议: `docs/human-brief-template.md` 是否存在、render-review-report.mjs 的原始 6 章命名如何对齐，都还停留在“build-plan 阶段确认”。这不会阻止规格方向成立，但会直接影响 FR-STAGE-001 和 FR-WHREVIEW-004 的实现拆分与测试准备，建议在 spec 中先补成明确前置条件或决议。

## Checks

审查维度覆盖：方向、盲点、细节
- 维度[方向]：已覆盖
- 维度[盲点]：已覆盖
- 维度[细节]：已覆盖

## Required Revisions

降级理由：(未提供，需补充)
- 必须修复：人工确认门接口未定，D2 无法一致实现
- 必须修复：报告与轮次状态的落盘路径未定，多个验收项无法落地
- 必须修复：3rd-review 调用契约前后冲突，纯引擎边界不够可执行


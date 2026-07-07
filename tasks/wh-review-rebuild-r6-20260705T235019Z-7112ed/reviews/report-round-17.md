# 审查报告 — wh-review-rebuild-r6-20260705T235019Z-7112ed (round 17)

- verdict: revise_required
- provenance: single-context

## Summary

先统一 3rd-review 的唯一调用契约，再补齐同源模式执行者和 D2 人工确认门的运行时集成合同，之后再细化机器校验规则。

## Findings

- [blocking] 问题: 3rd-review 调用契约前后矛盾，无法稳定实现 | 建议: 文档前半多处把 3rd-review 输入写成 `{mode, contract, materials}`（如目标节、数据流、UC-6），但 FR-THIRDREVIEW-001 方案A 又要求 wh-review 先把合同和材料装配成“一份完整的纯文本审查包”，且禁止传任何 stage 路由信息。两个接口模型不兼容：一个是结构化三元组，一个是单一审查包。实现方无法判断 3rd-review 的权威入参、日志格式、测试断言对象和 fail-loud 边界，验收也会分裂。
- [blocking] 问题: 同源模式只有规则，没有执行主体和调用合同 | 建议: FR-WHREVIEW-003 明确要求“第4轮起强制转同源”“同源审查最多3轮”，但规格没有定义同源模式到底调用谁、输入输出契约是什么、是否仍走 3rd-review、如何保证不是继续异源、以及同源结果如何写入统一状态/报告。当前只定义了异源 reviewer agent 和纯引擎化后的 3rd-review，没有定义 same-source executor，导致轮次切换规则无法落地，也无法写出可执行测试。
- [blocking] 问题: D2 人工确认门的系统接缝未定义，靠改 stage 收尾段不足以验收 | 建议: 规格要求 make-decision/build-plan/verify-code 在 pass 后“实际停在人工确认门，不自动推进”，同时 build-spec/build-code 自动推进；但 In-scope 只覆盖 wh-review、3rd-review 和 5 个 stage SKILL 收尾段，且 7.5/8 节已经把影响提升到“执行流程实际暂停/推进”。文档没有定义 workflowhub 运行时由谁消费 wh-review verdict、谁负责挂起流程、人工确认信号写到哪里、恢复推进的状态机如何变化。没有这层集成契约，AC8-1/AC8-2 和 AC-D5 无法被可靠实现。
- [minor] 问题: 若干“可机器验证”规则写得不够严 | 建议: §7 检查规则只举了 `^\s*\d+\.` 和 `/\bif\b.*\belse\b/`，抓不到独立 `if`、中文条件描述、其他列表格式；报告路径要求“可预测”但没有给出固定子路径常量；这些不一定阻断实现，但会导致验收脚本口径不一致。

## Checks

审查维度覆盖：方向、盲点、细节
- 维度[方向]：已覆盖
- 维度[盲点]：已覆盖
- 维度[细节]：已覆盖

## Required Revisions

降级理由：(未提供，需补充)
- 必须修复：3rd-review 调用契约前后矛盾，无法稳定实现
- 必须修复：同源模式只有规则，没有执行主体和调用合同
- 必须修复：D2 人工确认门的系统接缝未定义，靠改 stage 收尾段不足以验收


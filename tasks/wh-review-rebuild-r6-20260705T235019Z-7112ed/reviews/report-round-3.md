# 审查报告 — wh-review-rebuild-r6-20260705T235019Z-7112ed (round 3)

- verdict: revise_required
- provenance: single-context

## Summary

先补齐 wh-review 调用契约、统一产物目录结构、合同文件 schema，再继续实现与验收。

## Findings

- [blocking] 问题: wh-review 调用契约缺失，核心验收无法落地 | 建议: 规格要求用 exit code、日志、集成测试验证 wh-review 行为，但没有定义 wh-review 的明确调用入口和 I/O 契约：命令名/参数、输入材料来源、返回 JSON 结构、错误码集合、route-decision 写入时机都未定。实现方无法稳定接入 5 个 stage，也无法按 AC1-2、AC2-2、AC5-3、AC-D4 做可重复验收。
- [blocking] 问题: 审查产物落盘路径未定，状态/报告/Delta 的验收条件不可执行 | 建议: 多处要求在“任务目录下固定子路径”生成 report、round state、route-decision、Delta Package，但规格没有给出精确目录结构和命名规则，也没有定义 task-dir/task-id 的来源。当前 AC1-3、AC3-1、AC3-2、AC4-2、AC-D10 都依赖该路径约定；没有落盘契约，测试和实现都会各自发明路径，结果不可比对。
- [blocking] 问题: 合同文件格式与机器可消费 schema 未定义 | 建议: 规格要求 wh-review 搬迁 5 套合同，并对 intake/test-acceptance 做“机器 parse”“字段非空”“grep 判据字段”等静态验证，但没有定义合同文件的统一格式（YAML/JSON/Markdown frontmatter/纯文本）、字段层级、必填键、hash 计算范围。没有 schema，AC9-1/AC9-2/AC10-1 无法客观判定，3rd-review 也无法稳定消费 wh-review 装配的合同内容。
- [minor] 问题: 人工确认门的暂停语义不够具体 | 建议: D2 只规定 make-decision/build-plan/verify-code 在 pass 后“等待人工回应”，但未定义挂起状态如何落盘、恢复信号是什么、由谁触发继续。不会阻止写实现，但后续很容易在 build-plan 和 verify-code 阶段出现各自为政的暂停机制。

## Checks

审查维度覆盖：方向、盲点、细节
- 维度[方向]：已覆盖
- 维度[盲点]：已覆盖
- 维度[细节]：已覆盖

## Required Revisions

降级理由：(未提供，需补充)
- 必须修复：wh-review 调用契约缺失，核心验收无法落地
- 必须修复：审查产物落盘路径未定，状态/报告/Delta 的验收条件不可执行
- 必须修复：合同文件格式与机器可消费 schema 未定义


# 审查报告 — build-spec-wh-review-rebuild-20260705T160512Z-766077 (round 18)

- verdict: revise_required
- provenance: single-context

## Summary

先补齐审查升级阈值、规则优先级、3rd-review 精确接口，再进入实现。

## Findings

- [blocking] 问题: 审查升级条件不可执行 | 建议: FR-WHREVIEW-003 把升级条件写成“连续3轮出现大量 blocking 或指纹重复 blocking”，但“大量”的数值阈值、blocking_count 统计口径、fingerprint_repeated 的判定规则都未定义。这个缺口直接影响 AC3-3、AC-D10 和最终 verdict，当前无法做出可重复实现。
- [blocking] 问题: 第4轮规则与升级人工规则冲突未定优先级 | 建议: 同一段规则同时声明“异源最多3轮；第4轮起强制转同源”和“连续3轮 blocking 或指纹重复 blocking → 升级人工”。当第3轮结束后进入下一次审查时，两条规则可能同时触发，但 spec 只在 GAP-5 中承认冲突，没有给出必须遵守的优先级，导致 wh-review 裁决流不确定。
- [blocking] 问题: 3rd-review 调用契约仍然悬空 | 建议: FR-THIRDREVIEW-001 规定 3rd-review 纯引擎接口为 {mode, contract, materials} -> {verdict, findings, actual_mode}，但 OPEN-1 明确指出 standalone.sh 的实际参数与 SKILL.md 文档描述不一致。wh-review 的核心依赖就是这个接口；如果入参与返回结构未先对齐，FR-WHREVIEW-001、FR-WHREVIEW-004、FR-TEST-001 都无法验证。
- [minor] 问题: 报告 6 章结构未提前定稿 | 建议: AC4-3 要求报告包含 6 章结构，Known Gaps 又说 6 章名称需到 build-plan 阶段去 agenthub 原实现核实。这不会阻断架构方向，但会推迟 report renderer 的验收口径，建议在 spec 中先写出占位章节名或明确来源文件。

## Checks

审查维度覆盖：方向、盲点、细节
- 维度[方向]：已覆盖
- 维度[盲点]：已覆盖
- 维度[细节]：已覆盖

## Required Revisions

降级理由：(未提供，需补充)
- 必须修复：审查升级条件不可执行
- 必须修复：第4轮规则与升级人工规则冲突未定优先级
- 必须修复：3rd-review 调用契约仍然悬空


# 审查报告 — build-spec-wh-review-rebuild-20260705T160512Z-766077 (round 10)

- verdict: revise_required
- provenance: single-context

## Summary

先补齐升级/降级规则、6章报告合同、3rd-review 最终接口，再进入 build-plan 和实现。

## Findings

- [blocking] 问题: 降级/升级判定缺少可执行规则 | 建议: FR-WHREVIEW-003 规定“连续3轮出现大量 blocking 或指纹重复 blocking → 升级人工”，但“大量”没有数值阈值，导致 wh-review 无法稳定实现 `blocking_count` 判定，也无法写出确定性的测试和验收。需要在 spec 中补齐明确阈值或公式。
- [blocking] 问题: 第4轮转同源与第3轮升级人工存在规则冲突 | 建议: 同一组规则同时声明“异源审查最多3轮；第4轮起强制转同源”和“连续3轮 blocking 或指纹重复 blocking → 升级人工”，但未定义优先级与触发时序。第3轮结束后满足升级条件时，系统是直接 `escalate_to_human` 还是进入第4轮 `same-source`，当前 spec 无法唯一推出实现。
- [blocking] 问题: 报告6章结构未定义，验收不可落地 | 建议: FR-WHREVIEW-004 要求报告使用“6章结构”并在 AC4-3 中要求结构名称在 SKILL.md 明确定义，但 Known Gaps 明确写明 6 章名称尚未核实。报告模板、渲染脚本和验收标准因此缺少共同合同，当前规格不足以指导实现和审查。
- [blocking] 问题: 3rd-review 接口契约与已知实现差异未收敛 | 建议: spec 将 3rd-review 固定为输入 `{mode, contract, materials}`、输出 `{verdict, findings, actual_mode}`，但未决问题 OPEN-1 已指出 `standalone.sh` 的实际参数和返回结构与文档不一致，且要求 build-plan 阶段再对齐。由于 wh-review 依赖该接口作为核心边界，接口未先定稿会直接阻断调用链设计、测试桩和验收。
- [minor] 问题: 合同迁移范围表述前后不一致 | 建议: 速读卡写“verifiers/vibecoding/ 的 5 套 stage 专属合同”，问题陈述又写“11 份 stage 专属合同在 workflowhub 中从未被使用”。当前 In-scope 只要求迁 5 套，建议明确“11 份中的哪 5 份”为本期目标，避免实施时误解范围。

## Checks

审查维度覆盖：方向、盲点、细节
- 维度[方向]：已覆盖
- 维度[盲点]：已覆盖
- 维度[细节]：已覆盖

## Required Revisions

降级理由：(未提供，需补充)
- 必须修复：降级/升级判定缺少可执行规则
- 必须修复：第4轮转同源与第3轮升级人工存在规则冲突
- 必须修复：报告6章结构未定义，验收不可落地
- 必须修复：3rd-review 接口契约与已知实现差异未收敛


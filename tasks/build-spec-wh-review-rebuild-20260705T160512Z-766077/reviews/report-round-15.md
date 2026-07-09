# 审查报告 — build-spec-wh-review-rebuild-20260705T160512Z-766077 (round 15)

- verdict: revise_required
- provenance: single-context

## Summary

先补齐 3rd-review 真实接口合同、D2 人工确认闭环、以及端到端冒烟基线，再进入 build-plan/实现。

## Findings

- [blocking] 问题: 3rd-review 接口定义与已知未决问题互相冲突 | 建议: FR-THIRDREVIEW-001把 3rd-review 固定为输入 {mode, contract, materials}、输出 {verdict, findings, actual_mode}，但 OPEN-1 明确承认 standalone.sh 的实际参数、输出结构与 SKILL.md 描述不一致，且要求 build-plan 阶段再对齐。当前规格同时把接口当成已确定的验收目标，又把同一接口留作后续追踪问题，实施时无法据此判断什么算完成。需要先统一真实接口合同，再写验收。
- [blocking] 问题: D2 人工确认门缺少可执行的状态与交互合同 | 建议: FR-D2-001要求 make-decision、build-plan、verify-code 在 pass 后“挂起等待 human orchestrator 明确批准”，但规格没有定义批准动作的输入出口、落盘状态、恢复命令、超时/拒绝分支，也没有说明这部分由 wh-review 还是各 stage 执行。没有这个合同，无法实现“不得自动推进”且仍可继续流程的闭环。
- [blocking] 问题: 端到端验收缺少最小可复现路径定义 | 建议: AC-D7 只说“至少一个端到端冒烟用例可本地跑通”，但未定义用哪个 stage、哪些夹具、任务目录结构、预期产物路径、日志关键字、通过条件。该需求跨 wh-review、3rd-review、5 个 stage 和报告渲染；没有固定冒烟基线，验收结果会依赖实现者自行解释，无法稳定判定是否达标。
- [minor] 问题: 报告 6 章结构仍是占位信息 | 建议: FR-WHREVIEW-004 和 AC4-3 要求报告包含 6 章结构，但 Known Gaps 明确写了 6 章名称尚未核实。这个问题已被标注，但在当前草稿里仍会导致实现阶段重复猜测。应在 build-plan 前补齐或把章节定义明确列为前置依赖。
- [minor] 问题: 升级人工规则中的阈值与优先级未定 | 建议: Known Gaps 已承认“大量 blocking”的阈值未定义，且“第4轮强制转同源”与“连续3轮 blocking→升级人工”优先级未明确。草稿把它们标成不阻断，但这两项都会直接影响 wh-review 的裁决分支，建议在进入实现前定死。

## Checks

审查维度覆盖：方向、盲点、细节
- 维度[方向]：已覆盖
- 维度[盲点]：已覆盖
- 维度[细节]：已覆盖

## Required Revisions

降级理由：(未提供，需补充)
- 必须修复：3rd-review 接口定义与已知未决问题互相冲突
- 必须修复：D2 人工确认门缺少可执行的状态与交互合同
- 必须修复：端到端验收缺少最小可复现路径定义


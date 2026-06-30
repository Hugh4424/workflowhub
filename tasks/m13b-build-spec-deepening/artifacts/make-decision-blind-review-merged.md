# S5 三角度异源盲审 — 合并结果

> task-id: m13b-build-spec-deepening ｜ 2026-06-30
> 审对象：`make-decision-original-context.md` v3（Hugh 确认的合宪改造版移植方向）
> 三角度来源互盲，input_hash 两两不同，source_family 两两不同（无同源降级 / fallback_used=false）

## 来源与隔离证明

| 角度 | source_family | 后端 | input_hash | verdict | raw artifact |
|---|---|---|---|---|---|
| direction（方向合理性） | openai | codex gpt-5.5 | 13af72333f7b0180 | **pass** | `.omc/artifacts/ask/codex-intake-direction-review-*.md` |
| framing（框架挑战） | antigravity | antigravity | 24348b87d1859adb | **revise** | `.omc/artifacts/ask/antigravity-intake-framing-challenge-*.md` |
| scope（范围边界） | anthropic | claude | 66a1c2edf250b6f2 | **revise** | `.omc/artifacts/ask/claude-intake-scope-review-*.md` |

注：framing 角度首选 gemini（google）两次失败（TERM/256-color 环境致 exit 1，非鉴权），改用 antigravity，仍满足三角度 source_family 两两不同。

## direction_divergence: **true**

direction=pass 与 framing=revise 在「移植框架是否成立」上分歧。

## findings 汇总

### blocking（2 条，须 Hugh 定）
- **B1（framing）路径依赖**：把任务定义成「移植 agenthub 质保体系」违 workflowhub 立项初衷（逃离 agenthub 过度工程）；移植旧机制骨架是历史倒退。建议剥离「移植」外壳，回到 8 个原始需求的实质痛点，用最轻「记事实」就地解决。
- **B2（scope）范围过宽**：5 框架外部调研是跨 M13b/c/d/e 的独立大调研，与 build-spec 单 stage 深化零依赖，捆绑违反最小可交付；应切出独立立项。

### major（4 条）
- M1（direction）：方向仍偏「逐机制移植」，易把 agenthub 复杂性换皮带入；建议先定义 build-spec 必须暴露的质量事实，再反选最少机制。
- M2（direction）：non-blocking ≠ 无约束放行；「人确认推进」必须留痕（忽略了哪些风险/为何可接受/谁后续处理），否则退化成可忽略提示。
- M3（framing）：7 机制过重，偏离薄核心原则。
- M4（scope）：TASK_TRACKING_ROOT 是全局基础设施变更（所有 stage 都读），不应归属单个 stage 深化，应切出。

### minor（1 条）
- m1（direction）：Spec 纯净度 grep 只能当粗筛事实，不能被包装成质量判断。

## 收敛信号（三源独立指向同一处）

1. **从「移植机制清单」转向「质量事实契约」**：codex 与 antigravity 独立给出同一建议——别搬 7 机制清单，先定义 build-spec 必须产出的质量事实（scope 边界 / 自检结果 / 异源审查摘要 / 未解风险 / handoff required_reads），机制可替换、反选最少。
2. **砍批次**：claude 独立要求把「5 框架调研」「TASK_TRACKING_ROOT」切出，build-spec 深化只留「质量能力本体」。

## 与 Hugh 已确认方向的张力

Hugh 在 talk#2 拍板「合宪改造版移植」（option A）。但三源盲审里 framing=blocking + direction=major 共同质疑「移植」这个框架本身，scope=blocking 质疑批次范围。**这正是盲审护城河要暴露的事**：确认的方向被独立异源挑战，须经 debate + Hugh 在 S9 重新定夺，不由我代决。

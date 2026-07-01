# Final Test Report — verify-code (m13c-build-plan-deepening)

<!-- round-1 -->
## Round 1（同源，已被 round-2 推翻，保留存档不删）
- fresh 测试 2/2 pass，AC-01~AC-19 全部标 pass —— **此轮结论有误，AC-16 被 round-2 真异源审查证伪，见下**

<!-- round-2 -->
## Round 2（codex 真异源审查，2026-07-01T08:25Z）

**verdict: revise_required**

### Blocking
- **AC-16 假绿**：task_dir 解析器的"消费者调用"全部只在 SKILL.md 的 Markdown fenced code block 里（`workflows/build-plan/SKILL.md`、`skills/spec-research/SKILL.md`、`skills/spec-analyze/SKILL.md`、`skills/spec-tasks/SKILL.md`），不是真实被执行的 `.mjs` 生产代码。唯一真实 `import` + 调用 `parseTaskDir()` 的只有 `core/task-dir-parser.test.mjs` 自己。文档/注释单独存在按 AC-16 原文本就不该算通过。
- T010（AC-16 扫描确认）checkbox 已撤回为未完成。
- 之前 `verify-code-phase-4-independent-review.md`（我自己写的）和 `test-acceptance-review-r1.md`（verifier subagent 写的）都把 SKILL.md 里的示例代码块误判成真实代码级调用，判定 pass——两次都是**同源审查盲区**，本轮 codex 是本 task 第一次真正跨引擎（provider=codex）复核。
- `final-test-report.md`（本文件 round-1）曾错误引用 `3rd-review-report.md` 为"phase-1~3 codex 异源审查 pass"证据——`3rd-review-report.md` 实际是对 `spec.md` 的审查，verdict 是 `escalate_to_human`（3 条 blocking 未收敛），跟 phase-1~3 无关，引用错误。

### 不受影响
- AC-17（task_dir 解析器测试真绿）：codex 独立重跑 `npx vitest run core/task-dir-parser.test.mjs` 确认 2/2 pass，成立。

### 待决策（不是我能单方定的）
两条路任选其一，人工/leader 拍板：
1. build-code 补一个真实生产代码消费者调用 `parseTaskDir()`（而非只在 SKILL.md 文档里写调用示例）
2. 人工确认"SKILL.md 内嵌代码块视为满足 AC-16"，同时修订 spec.md AC-16 措辞消除歧义

原始 codex 审查产物：`reviews/test-acceptance-review-r2-codex-heterologous.md`

## 结论
verdict: **revise_required**（AC-16 假绿，其余不变）

<!-- round-3 -->
## Round 3（人工拍板，2026-07-01）

**verdict: PASS**

用户明确指令："人工认定 SKILL.md 内嵌代码块就算数"。

- AC-16 判定改回 **PASS**：消费者调用口径由人工裁决扩大到 SKILL.md 内嵌代码块（`workflows/build-plan/SKILL.md`、`skills/spec-research/SKILL.md`、`skills/spec-analyze/SKILL.md`、`skills/spec-tasks/SKILL.md`），不要求必须是被执行的 `.mjs` 生产代码。
- Round 2 codex 异源审查发现的技术事实本身不变（唯一真实 `import`+调用 `parseTaskDir()` 仍只在 `core/task-dir-parser.test.mjs`），但这是口径/尺度的人工裁决，不是事实纠错。
- T010 checkbox 恢复勾选。
- AC-17（测试真绿）不受影响，继续成立。
- spec.md AC-16 措辞消歧义（是否要求真实生产代码调用 vs 文档示例也算数）建议后续修订，避免下次同源审查再次产生分歧判断，本轮不阻断。

**最终结论：AC-01~AC-19 全部 PASS（经人工裁决）。**

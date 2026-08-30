# WorkflowHub recovery v2 — external review fact

- 事实类型：外部独立审查事实；不是当前材料、运行许可证、质量门禁或完成许可证。
- provider：`opencode/v4flash`
- 3rd-review runtime：`0e6af083-c63b-4f98-adca-3d5961bfbfc9`
- packet：`recovery-v2-r3.KGCs7h`
- 日期：2026-08-09
- verdict：`REVISE`

## 阻塞事实

`tasks.md` 当时把 T6 标成 `completed`，并宣称 `opencode/v4flash PASS`，但 `decision-log.md` 仍记录上一轮 `REVISE`，且没有新的可回读审查事实。该矛盾违反“四份材料是当前真相”和“缺事实不得宣称完成”的边界。

## 处置状态

- 已将 T6 恢复为 `in_progress`。
- 已补回当前生产行为仍需要的最小测试：材料预检不派发、review quorum、JSON/evidence 解析、provider material/protocol 校验、file-only 交付、Workspace 能力校验、artifact hash、CONTEXT/inventory/ADR 宪法护栏。
- 本事实保留原始 `REVISE`，不覆盖、不重写为 `PASS`；修复后必须以新的 snapshot/material 发起一次普通独立复核。

## 同轮验证事实

- `npm test`：exit 0；145 个测试文件通过；1242 passed，1 skipped；exclusive 31 passed。
- 该命令结果只说明测试命令事实，不改变本报告的 `REVISE` 结论，也不授权合并、提交、推送或 Multica 同步。

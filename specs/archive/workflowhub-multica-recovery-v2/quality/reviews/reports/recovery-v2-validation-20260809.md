# WorkflowHub recovery v2 — validation fact

- 事实类型：当前 worktree 的命令与边界验证事实；不是当前材料、运行许可证、质量门禁或完成许可证。
- worktree：`/Users/Hugh/Hugh/Project/workflowhub-worktrees/workflowhub-multica-recovery-v2`
- branch：`codex/workflowhub-multica-recovery-v2`
- base：`main@6efd67593ef1e191a4ab929a75402905bc6b49ce`
- 日期：2026-08-09

## 命令事实

- `npm test`：exit 0；safe 145 个测试文件通过、`1243 passed | 1 skipped`；exclusive 2 个测试文件、`31 passed`。
- `npm run check`：exit 0；Markdown、结构、反宿主、可扩展性、契约、metrics、stage quality、TaskContext、skill closure 和五阶段 package smoke 全部通过。
- `npm run compare:public-behavior`：exit 0；8 个公共命令行为均归类为 `approved_internal_change` 或 `approved_bug_fix`，candidate 为当前 worktree。
- `node tools/architecture/public-behavior-baseline.mjs verify`：exit 0；baseline commit `c3e1b1c5b29e5c0aa35beca7718787b4c7a95faf`，7 behaviors、8 probes。
- `npm run probe:public-behavior`：exit 0；10 tests passed。
- `git diff --check`：exit 0。

## 边界事实

- 本轮只修改 WorkflowHub recovery worktree 中的运行时、技能、工作流、测试和文档；没有修改 Multica 源码、provider/model/API Key/daemon 配置。
- 没有创建 commit、push、merge、cleanup 或同步动作。
- 本报告位于既有 `quality/reviews/reports` 事实目录，不是第五份当前材料，也不创建新的 runtime/control plane。
- 命令成功不等于独立审查通过；T6 是否完成仍由最新的独立 `opencode/v4flash` 审查事实和四份当前材料的一致性决定。

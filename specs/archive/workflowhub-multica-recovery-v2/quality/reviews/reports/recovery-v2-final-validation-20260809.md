# WorkflowHub recovery v2 — final validation fact before review

- 事实类型：当前最终修正快照的命令与边界验证事实；不是当前材料、运行许可证、质量门禁或完成许可证。
- worktree：`/Users/Hugh/Hugh/Project/workflowhub-worktrees/workflowhub-multica-recovery-v2`
- branch：`codex/workflowhub-multica-recovery-v2`
- base：`main@6efd67593ef1e191a4ab929a75402905bc6b49ce`
- 日期：2026-08-09

## 命令事实

- `npm test`：exit 0；safe 145 个测试文件通过、`1242 passed | 1 skipped`；exclusive 2 个测试文件、`31 passed`。
- 聚焦修复验证：make-decision 五阶段集成与 completion contract 共 `54 passed`。
- `npm run check`：exit 0；Markdown、结构、反宿主、可扩展性、契约、metrics、stage quality、TaskContext、skill closure 和五阶段 package smoke 全部通过。
- `npm run compare:public-behavior`：exit 0；8 个公共命令行为均归类为 `approved_internal_change` 或 `approved_bug_fix`；candidate tree `3ba220ed9b746bdecccfa58187f4235d43bfaf82`。
- `npm run probe:public-behavior`：exit 0；10 tests passed。
- `node tools/architecture/public-behavior-baseline.mjs verify`：exit 0；baseline commit `c3e1b1c5b29e5c0aa35beca7718787b4c7a95faf`，7 behaviors、8 probes。
- `git diff --check`：exit 0。

## 边界事实

- 本次修正只移除 make-decision 的多余 `grill` 完成谓词、同步当前步骤索引/计划边界、测试和公共行为基线；Grill 仍由 make-decision 技能执行并把重要结论写入 `decision-log.md`。
- 没有修改 Multica 源码、provider/model/API Key/daemon 配置；没有创建 commit、push、merge、cleanup 或同步动作。
- 本报告位于既有 `quality/reviews/reports` 事实目录，不是第五份当前材料，也不创建新的 runtime/control plane。
- 以上命令不能代替即将进行的独立 `opencode/v4flash` 审查；T6 仍保持 `in_progress`，直到最新审查事实返回。

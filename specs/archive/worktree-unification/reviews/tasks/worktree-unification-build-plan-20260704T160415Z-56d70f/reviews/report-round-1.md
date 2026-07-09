# 审查报告 — worktree-unification-build-plan-20260704T160415Z-56d70f (round 1)

- verdict: revise_required
- provenance: single-context

## Summary

round 1 full review completed. Required lenses were executed in read-only verifier mode via skill-file fallback and independent subagents: speckit-analyze, plan-eng-review, and review. Verdict is revise_required because core contract artifacts conflict on worktree.json path and fallback behavior, build-plan/build-spec scope is not executable, and verification/governance tasks are incomplete.

## Findings

- [blocking] 位置: specs/worktree-unification/data-contracts.md:16 | 问题: worktree.json 契约路径与权威 spec 冲突。data-contracts 写成 `{worktree_root}/worktree.json`，但 spec 要求 `{{task_tracking_root}}/tasks/{task-id}/worktree.json`。按当前契约实现会把跨 stage 状态写到错误位置，断链问题仍存在。 | 建议: 把 Contract 1 的 File path 改为 `{{task_tracking_root}}/tasks/{task-id}/worktree.json`，并明确 `worktree_root` 只是字段值，不是契约文件存放根。
- [blocking] 位置: specs/worktree-unification/data-contracts.md:71 | 问题: task_dir 返回值语义仍是旧模型：写成供调用方拼接 `{task_dir}/{task-id}/`，且 line 78 仍保留 `~/Knowledge/workflowhub/` fallback。此处与 spec/plan/tasks 的 `task_tracking_root -> /tasks/{task-id}` 和双缺失 fail-loud 冲突。 | 建议: 统一为 parser 返回 task_tracking_root；调用方只拼接 `${task_tracking_root}/tasks/${task_id}/...`；删除硬编码 fallback，优先级只保留 `WORKFLOWHUB_TASK_DIR -> config/workflowhub.yaml task_dir -> fail-loud`。
- [blocking] 位置: specs/worktree-unification/plan.md:74 | 问题: scope 边界自相矛盾。plan 将 `workflows/build-spec/SKILL.md` 标为 forbidden，line 76 又禁止修改 build-plan，但 spec 要求 build-spec/build-plan 都读取 worktree.json、写入 `worktree_root/specs/{task-id}/`、缺失时 fail-loud。按 plan 执行会无法落地 FR-WORKTREE-SCOPE-008。 | 建议: 把 `workflows/build-spec/SKILL.md` 和 `workflows/build-plan/SKILL.md` 纳入明确可修改范围，或把二者改为只读审计并声明缺口作为后续任务；若当前逻辑缺少 worktree.json 读取，就必须允许最小修改。
- [blocking] 位置: specs/worktree-unification/tasks.md:33 | 问题: FR-WORKTREE-SCOPE-008 覆盖不完整且顺序不稳。T005 只核查 build-spec，未覆盖 build-plan；同时该任务放在 T004 verify-code close 之后，晚于实际 pipeline 消费路径。 | 建议: 新增或扩展任务，明确核查/最小修改 `workflows/build-plan/SKILL.md` 的 `target_repo_root`/`worktree_root` 读取、缺失 fail-loud、不得 `git worktree add`；并把 build-spec/build-plan 消费方改造提前到核心实现阶段。
- [important] 位置: specs/worktree-unification/tasks.md:13 | 问题: parser 行为变更没有测试任务。现有 `core/__tests__/task-dir-parser.test.mjs` 仍断言 config 缺失时 fallback 到 `~/Knowledge/workflowhub/`，会与新 FR 直接冲突。 | 建议: 在 T001 或新增任务中显式更新 `core/__tests__/task-dir-parser.test.mjs`，覆盖 env 优先、空 env 走 yaml、yaml fallback、yaml 缺失 fail-loud、yaml 无 `task_dir` fail-loud、相对路径/`~`/不存在/非目录 fail-loud，并写明运行命令。
- [important] 位置: specs/worktree-unification/tasks.md:37 | 问题: T007 要新增 `specs/worktree-unification/checklists/acceptance.md`，但 spec 规定 `specs/{task-id}/` 只允许 spec.md/plan.md/tasks.md，禁止过程/追踪类文件。执行 T007 会制造自身边界违规。 | 建议: 推荐把 acceptance checklist 改到 `{{task_tracking_root}}/tasks/{task-id}/checklists/acceptance.md`；或修改 FR-WORKTREE-SCOPE-009，明确 checklists 是允许的 repo 交付物。
- [important] 位置: specs/worktree-unification/plan.md:319 | 问题: Constitution Check 使用旧宪法语义。plan 把 F8 写成“新功能先有 research”，但当前 CONSTITUTION.md F8 是“简单优先”；F10、S8 等也错位。治理检查是假绿。 | 建议: 按当前 `CONSTITUTION.md` 和 `constitution-checklist.md` 的 21 条重新生成 Constitution Check，删除旧条目映射和先 `[ ]` 后 `[x]` 的自我修正。
- [important] 位置: workflows/verify-code/SKILL.md:206 | 问题: 当前 verify-code 仍包含 `bash /path/to/3rd-review/standalone.sh` 占位命令；plan/tasks 未明确要求替换这个不可执行入口。pre-merge 3rd-review gate 可能只停留在文档承诺。 | 建议: 在 T004 明确增加“替换 fake standalone path”为真实可调用入口；若仓库没有真实 3rd-review entry，则要求 fail-loud 并记录 `needs_human`，不允许 placeholder 留在执行说明中。
- [minor] 位置: specs/worktree-unification/plan.md:12 | 问题: 范围口径偏小。plan 写“改动跨 3 个模块”，但实际至少涉及 make-decision、build-code、verify-code、core/parser，且 FR-SCOPE-008 可能触及 build-spec/build-plan。 | 建议: 统一影响范围口径：分别列出核心修改文件、条件修改文件、只读核查文件和配置依赖；不要用“3 个模块”概括全部变更面。

## Checks

审查维度覆盖：方向、盲点、细节
- 维度[方向]：已覆盖
- 维度[盲点]：已覆盖
- 维度[细节]：已覆盖

## Required Revisions

降级理由：(未提供，需补充)
- 必须修复：worktree.json 契约路径与权威 spec 冲突。data-contracts 写成 `{worktree_root}/worktree.json`，但 spec 要求 `{{task_tracking_root}}/tasks/{task-id}/worktree.json`。按当前契约实现会把跨 stage 状态写到错误位置，断链问题仍存在。
- 必须修复：task_dir 返回值语义仍是旧模型：写成供调用方拼接 `{task_dir}/{task-id}/`，且 line 78 仍保留 `~/Knowledge/workflowhub/` fallback。此处与 spec/plan/tasks 的 `task_tracking_root -> /tasks/{task-id}` 和双缺失 fail-loud 冲突。
- 必须修复：scope 边界自相矛盾。plan 将 `workflows/build-spec/SKILL.md` 标为 forbidden，line 76 又禁止修改 build-plan，但 spec 要求 build-spec/build-plan 都读取 worktree.json、写入 `worktree_root/specs/{task-id}/`、缺失时 fail-loud。按 plan 执行会无法落地 FR-WORKTREE-SCOPE-008。
- 必须修复：FR-WORKTREE-SCOPE-008 覆盖不完整且顺序不稳。T005 只核查 build-spec，未覆盖 build-plan；同时该任务放在 T004 verify-code close 之后，晚于实际 pipeline 消费路径。


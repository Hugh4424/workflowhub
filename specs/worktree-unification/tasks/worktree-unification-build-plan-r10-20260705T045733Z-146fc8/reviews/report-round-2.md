# 审查报告 — worktree-unification-build-plan-r10-20260705T045733Z-146fc8 (round 2)

- verdict: revise_required
- provenance: single-context

## Summary

已按 speckit-analyze、plan-eng-review、review 的 read-only skill-file fallback 检查 spec/plan/tasks/data-contracts/core 实现。Round-9 的 T002 normalization 与 T001 grep 假绿有进展，但 build-spec/build-plan 范围冲突、COMMIT-004 全矩阵覆盖、T001 持久测试仍未闭合；另发现 T001 缺失配置与 yaml 裁剪 gate 本身不可执行。

## Findings

- [blocking] 位置: specs/worktree-unification/plan.md:74 | 问题: Round-9 Finding 1 未闭合：spec 要求 build-spec/build-plan 读取 worktree.json 中的 target_repo_root/worktree_root 且缺失 fail-loud，但 plan 仍把 workflows/build-spec/SKILL.md 和 workflows/build-plan/SKILL.md 设为禁止修改；tasks.md T005 也只允许只读记录。执行者无法同时满足 spec 和 forbidden-file 边界。 | 建议: 二选一：要么把 build-spec/build-plan 纳入允许修改范围并补对应任务、gate、commit/no-change 规则；要么先修改 spec/decision-log，明确本轮不要求 build-spec/build-plan 消费 worktree.json，并给出已批准的范围收缩依据。
- [blocking] 位置: specs/worktree-unification/tasks.md:88 | 问题: Round-9 Finding 2 未闭合：T008 名义上验证 FR-WORKTREE-COMMIT-004，但实际 gate 只覆盖 build-code per-phase 规则、no-change 文本和至少一条 build-code commit；没有逐行覆盖 make-decision、build-spec、build-plan、verify-code、close 归档 commit 或对应 no-change 记录。 | 建议: 把 T008 改成按 spec.md 的 commit 覆盖矩阵逐行核查：每一行都有明确 task、blocking gate、commit message/no-change 证据；close 必须验证 `workflowhub(close): archive {task-id}`。
- [blocking] 位置: specs/worktree-unification/tasks.md:17 | 问题: T001 的“两者缺失 fail-loud”gate 没有真正制造 yaml 缺失场景。`parseTaskDir()` 默认读取 repo 内固定路径 `config/workflowhub.yaml`，`cd` 到临时空目录不会隐藏该配置；因此该 gate 无法验证“两者缺失”。 | 建议: 在缺失场景中显式调用 `parseTaskDir("$_T/workflowhub.yaml")` 或等价不存在配置路径，并分别断言非零 exit code 和 stderr 明确错误。
- [blocking] 位置: specs/worktree-unification/tasks.md:38 | 问题: yaml `/tasks` 后缀裁剪 gate 使用 `/foo/bar/tasks/`、`/foo/bar/tasks`、`/foo/bar/mytasks` 作为 yaml 值，但 parser 规范要求返回路径必须存在且为目录；这些路径通常不存在，正确实现也会 fail-loud，导致验证命令不可执行。 | 建议: 用 `mktemp -d` 创建真实根目录和 `tasks` 子目录，再写入 yaml，例如 `task_dir: ${_ROOTDIR}/tasks/`，期望返回 `${_ROOTDIR}`；非 `/tasks` 结尾用真实存在目录验证。
- [blocking] 位置: specs/worktree-unification/tasks.md:13 | 问题: Round-9 Finding 3 仍未在 plan/tasks 中闭合：T001 只要求修改 `core/task-dir-parser.mjs` 并跑 shell gate，没有把持久测试文件列为改动文件，也没有给出 22 个 parser 单元测试的可执行 test gate。diff 摘要声称测试已重写，但计划本身不可追踪、不可复跑。 | 建议: 在 plan Source Code 和 T001 Files/任务中加入 parser 测试文件路径，并增加持久测试 gate（例如项目现有 Node 测试命令），覆盖 env var、yaml fallback、缺失配置、路径不存在/非目录、`/tasks` 裁剪和不导出 `normalizeTaskTrackingRoot()`。

## Checks

审查维度覆盖：方向、盲点、细节
- 维度[方向]：已覆盖
- 维度[盲点]：已覆盖
- 维度[细节]：已覆盖

## Required Revisions

降级理由：(未提供，需补充)
- 必须修复：Round-9 Finding 1 未闭合：spec 要求 build-spec/build-plan 读取 worktree.json 中的 target_repo_root/worktree_root 且缺失 fail-loud，但 plan 仍把 workflows/build-spec/SKILL.md 和 workflows/build-plan/SKILL.md 设为禁止修改；tasks.md T005 也只允许只读记录。执行者无法同时满足 spec 和 forbidden-file 边界。
- 必须修复：Round-9 Finding 2 未闭合：T008 名义上验证 FR-WORKTREE-COMMIT-004，但实际 gate 只覆盖 build-code per-phase 规则、no-change 文本和至少一条 build-code commit；没有逐行覆盖 make-decision、build-spec、build-plan、verify-code、close 归档 commit 或对应 no-change 记录。
- 必须修复：T001 的“两者缺失 fail-loud”gate 没有真正制造 yaml 缺失场景。`parseTaskDir()` 默认读取 repo 内固定路径 `config/workflowhub.yaml`，`cd` 到临时空目录不会隐藏该配置；因此该 gate 无法验证“两者缺失”。
- 必须修复：yaml `/tasks` 后缀裁剪 gate 使用 `/foo/bar/tasks/`、`/foo/bar/tasks`、`/foo/bar/mytasks` 作为 yaml 值，但 parser 规范要求返回路径必须存在且为目录；这些路径通常不存在，正确实现也会 fail-loud，导致验证命令不可执行。
- 必须修复：Round-9 Finding 3 仍未在 plan/tasks 中闭合：T001 只要求修改 `core/task-dir-parser.mjs` 并跑 shell gate，没有把持久测试文件列为改动文件，也没有给出 22 个 parser 单元测试的可执行 test gate。diff 摘要声称测试已重写，但计划本身不可追踪、不可复跑。


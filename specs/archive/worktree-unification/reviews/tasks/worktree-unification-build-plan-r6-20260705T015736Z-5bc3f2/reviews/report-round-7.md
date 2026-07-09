# 审查报告 — worktree-unification-build-plan-r6-20260705T015736Z-5bc3f2 (round 7)

- verdict: revise_required
- provenance: single-context

## Summary

Round 7 delta 关闭了 B1 的 build-plan 只读/禁止修改冲突，并改进了 B7/B8 的部分表述；但 B3、B4、B5 在 unchanged data-contracts.md 中原样保留，B6 只做了表面补 gate，T001/T005/T006 仍不是可执行、可验证、可控的 gate。另发现 plan.md 对 build-spec/SKILL.md 的 Forbidden files 与 T005 最小补充规则互相冲突。结论：revise_required。

## Findings

- [blocking] 位置: specs/worktree-unification/data-contracts.md:16 | 问题: B3 未修复：Contract 1 仍把 worktree.json 写在 worktree 根目录，和上轮要求的 `{{task_tracking_root}}/tasks/{task-id}/worktree.json` 不一致。 | 建议: 把 Contract 1 的 File path 改为 `{{task_tracking_root}}/tasks/{task-id}/worktree.json`，并同步 Owner/Consumer 描述为 make-decision 写入、后续 stage 从该路径读取。
- [blocking] 位置: specs/worktree-unification/data-contracts.md:71 | 问题: B4 未修复：Contract 2 仍使用旧 `{task_dir}/{task-id}/` 模型，缺少当前计划要求的 `task_tracking_root` + `/tasks/{task-id}/` 结构。 | 建议: 改为：parser 返回 `task_tracking_root` 本身；调用方必须拼接 `tasks/{task-id}`；禁止再使用旧 `task_dir/{task-id}` 语义。
- [blocking] 位置: specs/worktree-unification/data-contracts.md:78 | 问题: B5 未修复：Contract 2 仍允许硬编码 fallback `~/Knowledge/workflowhub/`，直接违反 FR-WORKTREE-ENVVAR-003 的“两者缺失 fail-loud，不使用硬编码路径”。 | 建议: 删除硬编码 fallback；Validation Rules 改为：1. `WORKFLOWHUB_TASK_DIR`；2. `config/workflowhub.yaml` 的 `task_dir`；3. 两者缺失 fail-loud。
- [blocking] 位置: specs/worktree-unification/tasks.md:69 | 问题: B6 仍未完全修复：T006 没有独立 `gate_cmd` 区块，且禁止文件检查命令以“无输出”为通过标准，但原命令无匹配时 exit 1，不能作为机器通过门控。 | 建议: 给 T006 增加明确 `gate_cmd`，例如 `! git show HEAD -- specs/worktree-unification/ | grep -E '...'` 或用 `node` 脚本返回 exit 0/1；同时替换 `{task-id}` 占位符为真实 task-id 或声明执行时如何注入。
- [blocking] 位置: specs/worktree-unification/tasks.md:14 | 问题: B6 仍未完全修复：T001 gate_cmd 不是自包含可执行命令。它没有创建 `/tmp/testdir`，`/tmp/somefile` 也没有创建；同时在 Node.js v20 语境下用 `require('./core/task-dir-parser.mjs')` 加载 `.mjs`，命令本身可能先因模块加载方式失败，而不是验证 parser 行为。 | 建议: 改成自包含命令：先 `tmp=$(mktemp -d)` / `file=$(mktemp)`，再用 `node --input-type=module -e "import('./core/task-dir-parser.mjs').then(...)"` 或项目现有测试框架新增 vitest 单测。
- [blocking] 位置: specs/worktree-unification/tasks.md:68 | 问题: B6 仍未完全修复：T005 的 worktree 条目数检查只是显示命令，没有记录 before/after，也没有比较逻辑，不能作为 gate_cmd。 | 建议: 改为可执行比较，例如在阶段前记录 `before=$(git worktree list --porcelain | grep -c '^worktree ')`，阶段后记录 `after=...`，再 `test "$before" -eq "$after"`；若跨任务存储 before 值，说明存储路径和读取方式。
- [blocking] 位置: specs/worktree-unification/plan.md:55 | 问题: plan.md 的 Forbidden files 把 `workflows/build-spec/SKILL.md` 标为不可触碰，但同一计划在 Phase 3.1 和 tasks.md T005 又允许 build-spec 缺失时“最小补充一行”。 | 建议: 把 build-spec 从 Forbidden files 移出，改为“受限可修改文件：仅允许补充 target_repo_root/worktree_root 读取与 worktree.json 缺失 fail-loud 的最小条文”；或彻底改为只读并删除 T005/Phase 3.1 的补充规则。
- [important] 位置: specs/worktree-unification/tasks.md:22 | 问题: T001-T005 的 commit gate 使用 `git log | head -1 | grep` 作为通过标准，命中合同的 fake-command 扫描模式；`head` 属于 display 类管道，不应作为 gate_cmd 的 pass/fail 判据。 | 建议: 改为不依赖 `head` 的机器门控，例如 `git log -1 --format=%s | grep -q '^workflowhub(task-dir-parser):'`，并为 no-change 分支增加检查 stage-result/journal 中原因字段的命令。
- [important] 位置: specs/worktree-unification/cross-artifact-analysis.md:13 | 问题: cross-artifact-analysis.md 宣称 blocking=0，但本包内 unchanged data-contracts.md 仍保留 B3-B5，tasks.md 也仍有不可执行 gate。 | 建议: 重新生成 cross-artifact-analysis.md，并逐条列出仍未关闭的 B3-B6；不要用摘要式“达标”覆盖未改文件中的合同冲突。

## Checks

审查维度覆盖：方向、盲点、细节
- 维度[方向]：已覆盖
- 维度[盲点]：已覆盖
- 维度[细节]：已覆盖

## Required Revisions

降级理由：(未提供，需补充)
- 必须修复：B3 未修复：Contract 1 仍把 worktree.json 写在 worktree 根目录，和上轮要求的 `{{task_tracking_root}}/tasks/{task-id}/worktree.json` 不一致。
- 必须修复：B4 未修复：Contract 2 仍使用旧 `{task_dir}/{task-id}/` 模型，缺少当前计划要求的 `task_tracking_root` + `/tasks/{task-id}/` 结构。
- 必须修复：B5 未修复：Contract 2 仍允许硬编码 fallback `~/Knowledge/workflowhub/`，直接违反 FR-WORKTREE-ENVVAR-003 的“两者缺失 fail-loud，不使用硬编码路径”。
- 必须修复：B6 仍未完全修复：T006 没有独立 `gate_cmd` 区块，且禁止文件检查命令以“无输出”为通过标准，但原命令无匹配时 exit 1，不能作为机器通过门控。
- 必须修复：B6 仍未完全修复：T001 gate_cmd 不是自包含可执行命令。它没有创建 `/tmp/testdir`，`/tmp/somefile` 也没有创建；同时在 Node.js v20 语境下用 `require('./core/task-dir-parser.mjs')` 加载 `.mjs`，命令本身可能先因模块加载方式失败，而不是验证 parser 行为。
- 必须修复：B6 仍未完全修复：T005 的 worktree 条目数检查只是显示命令，没有记录 before/after，也没有比较逻辑，不能作为 gate_cmd。
- 必须修复：plan.md 的 Forbidden files 把 `workflows/build-spec/SKILL.md` 标为不可触碰，但同一计划在 Phase 3.1 和 tasks.md T005 又允许 build-spec 缺失时“最小补充一行”。


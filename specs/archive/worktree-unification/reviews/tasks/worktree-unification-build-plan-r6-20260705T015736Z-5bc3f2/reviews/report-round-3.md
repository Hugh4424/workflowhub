# 审查报告 — worktree-unification-build-plan-r6-20260705T015736Z-5bc3f2 (round 3)

- verdict: revise_required
- provenance: single-context

## Summary

B1 已修复 build-plan 只读边界；B2/B7 看起来已在 plan/tasks 中收敛；B3/B4/B5 因 data-contracts.md 未改仍阻断；B6 未完全修复，T005/T006 仍缺可执行 gate；B8 的 commit gate 已补但命令形态是假绿风险，仍阻断。

## Findings

- [blocking] 位置: specs/worktree-unification/data-contracts.md:16 | 问题: 上一轮 B3 未修复：Contract 1 仍把 worktree.json 路径写成 `{worktree_root}/worktree.json`，与当前计划要求的仓库外 `{{task_tracking_root}}/tasks/{task-id}/worktree.json` 冲突。执行后会把跨 stage 契约写到错误位置，后续 stage 仍可能断链。 | 建议: 把 Contract 1 File path 改为 `{{task_tracking_root}}/tasks/{task-id}/worktree.json`，并同步 owner/consumer 说明，明确 worktree.json 不写入 target repo worktree。
- [blocking] 位置: specs/worktree-unification/data-contracts.md:71 | 问题: 上一轮 B4 未修复：Contract 2 仍是旧 `{task_dir}/{task-id}` 模型，但 plan/tasks 已要求 parser 返回 task_tracking_root，调用方拼接 `/tasks/{task-id}/`。执行者按 data-contracts 实施会产生路径模型分裂。 | 建议: 把返回值说明改为 task_tracking_root 绝对路径，并把 consumer 拼接规则统一为 `{{task_tracking_root}}/tasks/{task-id}/`。
- [blocking] 位置: specs/worktree-unification/data-contracts.md:78 | 问题: 上一轮 B5 未修复：Contract 2 仍允许 fallback 到 `~/Knowledge/workflowhub/`，与 FR-WORKTREE-ENVVAR-003 和 T001 的“两者缺失 fail-loud，不使用硬编码路径”冲突。执行后会继续保留旧静默兜底。 | 建议: 删除硬编码 fallback；优先级只保留 `WORKFLOWHUB_TASK_DIR` -> `config/workflowhub.yaml task_dir` -> fail-loud。
- [blocking] 位置: specs/worktree-unification/plan.md:71 | 问题: plan 的 Forbidden files 把 `workflows/build-spec/SKILL.md` 标为不可触碰，但 plan §3.1 和 tasks T005 又允许 build-spec 缺失时补充一行。执行者会在“禁止修改”和“必要时修改”之间卡住，FR-WORKTREE-SCOPE-008 无法稳定落地。 | 建议: 二选一并统一全文件：推荐把 build-spec 从 Forbidden files 移出，明确仅允许 T005 的单行最小补充；若坚持 forbidden，则 T005 只能只读报告缺口，不能要求补充。
- [blocking] 位置: specs/worktree-unification/tasks.md:63 | 问题: T005 的 `git worktree list | wc -l` 只是打印数量，没有记录 before/after，也没有比较断言，不是机器可执行门控。执行后即使新增 worktree 条目也可能被人工漏判。 | 建议: 改成明确 gate_cmd：先记录执行前数量，执行核查后记录执行后数量，用 `test "$before" = "$after"` 判定；必要管道用 `bash -lc 'set -o pipefail; ...'`。
- [blocking] 位置: specs/worktree-unification/tasks.md:66 | 问题: T006 没有独立 `gate_cmd` 列表，且内联检查命令含 `{task-id}` 占位符；`git show ... | grep ...` 还把“无输出即通过”的条件写成普通 grep，直接运行会 exit 1。它不能作为机器 pass/fail 门控。 | 建议: 给 T006 增加正式 `gate_cmd`；使用真实变量或固定 task-id；把禁止项检查写成反向断言，例如 `bash -lc 'set -o pipefail; ! git show HEAD -- specs/worktree-unification/ | grep -E "..."'`。
- [blocking] 位置: specs/worktree-unification/tasks.md:21 | 问题: T001-T005 的 commit gate 使用 `git log --oneline | head -1 | grep -q ...`。合同明确禁止 `head`/`tail` 管道作为 pass/fail gate，除非保留 pipefail；当前 gate 仍是假绿风险。 | 建议: 改为无管道或带 pipefail 的命令，例如 `git log -1 --pretty=%s | grep -q '^workflowhub(task-dir-parser):'`，并对 T001-T005 全部替换。

## Checks

审查维度覆盖：方向、盲点、细节
- 维度[方向]：已覆盖
- 维度[盲点]：已覆盖
- 维度[细节]：已覆盖

## Required Revisions

降级理由：(未提供，需补充)
- 必须修复：上一轮 B3 未修复：Contract 1 仍把 worktree.json 路径写成 `{worktree_root}/worktree.json`，与当前计划要求的仓库外 `{{task_tracking_root}}/tasks/{task-id}/worktree.json` 冲突。执行后会把跨 stage 契约写到错误位置，后续 stage 仍可能断链。
- 必须修复：上一轮 B4 未修复：Contract 2 仍是旧 `{task_dir}/{task-id}` 模型，但 plan/tasks 已要求 parser 返回 task_tracking_root，调用方拼接 `/tasks/{task-id}/`。执行者按 data-contracts 实施会产生路径模型分裂。
- 必须修复：上一轮 B5 未修复：Contract 2 仍允许 fallback 到 `~/Knowledge/workflowhub/`，与 FR-WORKTREE-ENVVAR-003 和 T001 的“两者缺失 fail-loud，不使用硬编码路径”冲突。执行后会继续保留旧静默兜底。
- 必须修复：plan 的 Forbidden files 把 `workflows/build-spec/SKILL.md` 标为不可触碰，但 plan §3.1 和 tasks T005 又允许 build-spec 缺失时补充一行。执行者会在“禁止修改”和“必要时修改”之间卡住，FR-WORKTREE-SCOPE-008 无法稳定落地。
- 必须修复：T005 的 `git worktree list | wc -l` 只是打印数量，没有记录 before/after，也没有比较断言，不是机器可执行门控。执行后即使新增 worktree 条目也可能被人工漏判。
- 必须修复：T006 没有独立 `gate_cmd` 列表，且内联检查命令含 `{task-id}` 占位符；`git show ... | grep ...` 还把“无输出即通过”的条件写成普通 grep，直接运行会 exit 1。它不能作为机器 pass/fail 门控。
- 必须修复：T001-T005 的 commit gate 使用 `git log --oneline | head -1 | grep -q ...`。合同明确禁止 `head`/`tail` 管道作为 pass/fail gate，除非保留 pipefail；当前 gate 仍是假绿风险。


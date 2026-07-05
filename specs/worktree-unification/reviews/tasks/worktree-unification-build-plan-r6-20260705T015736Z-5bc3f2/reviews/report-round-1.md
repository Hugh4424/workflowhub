# 审查报告 — worktree-unification-build-plan-r6-20260705T015736Z-5bc3f2 (round 1)

- verdict: revise_required
- provenance: single-context

## Summary

round-6 未达到可执行计划标准。B3/B4/B5 在 data-contracts.md 中原样残留；B6 虽新增 gate_cmd，但多个 gate 不可执行或有假绿风险；T005/T006 的新增验证仍缺少可机器判定的通过条件。B1/B7/B8 的局部修正不能抵消这些阻断项。

## Findings

- [blocking] 位置: specs/worktree-unification/data-contracts.md:16 | 问题: 上轮 B3 未关闭：Contract 1 仍把 worktree.json 路径定义为 `{worktree_root}/worktree.json`，但上轮要求改为 `{{task_tracking_root}}/tasks/{task-id}/worktree.json`。当前 plan/tasks 以 task_tracking_root 作为跨 stage 跟踪根，data-contracts 仍指向 worktree 根，会导致 make-decision、build-code、verify-code 在不同位置读写同一契约文件。 | 建议: 把 Contract 1 的 File path 改为 `{{task_tracking_root}}/tasks/{task-id}/worktree.json`，并同步 Owner/Consumer/Write Permission Rules 中所有读写位置。
- [blocking] 位置: specs/worktree-unification/data-contracts.md:71 | 问题: 上轮 B4 未关闭：Contract 2 仍使用旧 `{task_dir}/{task-id}/` 模型，写明返回值供调用方拼接 `{task_dir}/{task-id}/`。当前 spec/tasks 要求 parser 返回 task_tracking_root 本身，并由调用方拼接 `/tasks/{task-id}/`，旧模型会继续产生路径错位。 | 建议: 将 Contract 2 改为：`parseTaskDir()` 返回 `task_tracking_root`；所有任务目录统一为 `{{task_tracking_root}}/tasks/{task-id}/`；禁止再使用 `{task_dir}/{task-id}/` 表达。
- [blocking] 位置: specs/worktree-unification/data-contracts.md:78 | 问题: 上轮 B5 未关闭：Contract 2 仍允许 fallback 到 `~/Knowledge/workflowhub/`。这直接违反 FR-WORKTREE-ENVVAR-003 的“两者均缺失 fail-loud，不使用硬编码路径”，执行后会继续把缺失配置静默写到旧目录。 | 建议: 删除硬编码 fallback；优先级改为 `WORKFLOWHUB_TASK_DIR` → `config/workflowhub.yaml task_dir` → 两者缺失 fail-loud，并明确路径不存在/非目录也 fail-loud。
- [blocking] 位置: specs/worktree-unification/tasks.md:14 | 问题: T001 的 gate_cmd 不可执行：`require('./core/task-dir-parser.mjs').then(...)` 把 `.mjs` 模块当 Promise 使用。当前仓库 `core/task-dir-parser.mjs` 导出同步 `parseTaskDir()`；实测该命令报 `TypeError: require(...).then is not a function`。该 gate 无法证明 FR-WORKTREE-ENVVAR-003。 | 建议: 改为真实 ESM 调用，例如 `node --input-type=module -e "import { parseTaskDir } from './core/task-dir-parser.mjs'; const r=parseTaskDir(); if(!r.startsWith('/tmp/testdir')) process.exit(1)"`；所有 fail-loud 场景也要用可执行脚本断言 exit code 和 stderr。
- [blocking] 位置: specs/worktree-unification/tasks.md:34 | 问题: 新增 gate_cmd 多处仍是假绿风险：例如 `grep -cE ... | grep -q`、`git log --oneline | head -1 | grep -q`、`grep ... | awk` 都作为 pass/fail gate 使用，未设置 `pipefail`，且 contract 要求 gate_cmd 保留被测命令 exit code，grep/jq/awk 类命令不应作为机器门控主体。 | 建议: 把这些检查改成单个 `node -e`/shell 脚本断言，或显式 `set -o pipefail` 并确保被测命令 exit code 不被管道吞掉；人类摘要命令放到 display_cmd，不作为 gate_cmd。
- [blocking] 位置: specs/worktree-unification/tasks.md:86 | 问题: T005 的“worktree 条目数不变”gate 只有 `git worktree list | wc -l` 和文字“运行前后数值相同”，没有 before/after 记录、没有比较命令、没有退出码标准。执行者无法机器判定是否通过。 | 建议: 改成完整 gate：执行前保存 count，执行核查动作后重新 count，并用 `test "$before" -eq "$after"` 或等价脚本返回明确 exit code；同时避免用裸管道作为 gate。
- [blocking] 位置: specs/worktree-unification/tasks.md:92 | 问题: T006 的边界检查命令仍不可直接执行：命令中保留字面 `{task-id}`，如 `git show HEAD -- specs/{task-id}/` 和 `${WORKFLOWHUB_TASK_DIR}/tasks/{task-id}/stage-result.json`；实际运行会检查错误路径。`git show ... | grep` 还只写“应无输出”，没有可执行通过条件。 | 建议: 将 `{task-id}` 替换为实际 `worktree-unification` 或定义 `TASK_ID=worktree-unification`；无禁止文件检查写成明确 exit code gate，例如脚本中 `if git show ... | grep -qE ...; then exit 1; fi`，并提供 display_cmd 供人工查看。

## Checks

审查维度覆盖：方向、盲点、细节
- 维度[方向]：已覆盖
- 维度[盲点]：已覆盖
- 维度[细节]：已覆盖

## Required Revisions

降级理由：(未提供，需补充)
- 必须修复：上轮 B3 未关闭：Contract 1 仍把 worktree.json 路径定义为 `{worktree_root}/worktree.json`，但上轮要求改为 `{{task_tracking_root}}/tasks/{task-id}/worktree.json`。当前 plan/tasks 以 task_tracking_root 作为跨 stage 跟踪根，data-contracts 仍指向 worktree 根，会导致 make-decision、build-code、verify-code 在不同位置读写同一契约文件。
- 必须修复：上轮 B4 未关闭：Contract 2 仍使用旧 `{task_dir}/{task-id}/` 模型，写明返回值供调用方拼接 `{task_dir}/{task-id}/`。当前 spec/tasks 要求 parser 返回 task_tracking_root 本身，并由调用方拼接 `/tasks/{task-id}/`，旧模型会继续产生路径错位。
- 必须修复：上轮 B5 未关闭：Contract 2 仍允许 fallback 到 `~/Knowledge/workflowhub/`。这直接违反 FR-WORKTREE-ENVVAR-003 的“两者均缺失 fail-loud，不使用硬编码路径”，执行后会继续把缺失配置静默写到旧目录。
- 必须修复：T001 的 gate_cmd 不可执行：`require('./core/task-dir-parser.mjs').then(...)` 把 `.mjs` 模块当 Promise 使用。当前仓库 `core/task-dir-parser.mjs` 导出同步 `parseTaskDir()`；实测该命令报 `TypeError: require(...).then is not a function`。该 gate 无法证明 FR-WORKTREE-ENVVAR-003。
- 必须修复：新增 gate_cmd 多处仍是假绿风险：例如 `grep -cE ... | grep -q`、`git log --oneline | head -1 | grep -q`、`grep ... | awk` 都作为 pass/fail gate 使用，未设置 `pipefail`，且 contract 要求 gate_cmd 保留被测命令 exit code，grep/jq/awk 类命令不应作为机器门控主体。
- 必须修复：T005 的“worktree 条目数不变”gate 只有 `git worktree list | wc -l` 和文字“运行前后数值相同”，没有 before/after 记录、没有比较命令、没有退出码标准。执行者无法机器判定是否通过。
- 必须修复：T006 的边界检查命令仍不可直接执行：命令中保留字面 `{task-id}`，如 `git show HEAD -- specs/{task-id}/` 和 `${WORKFLOWHUB_TASK_DIR}/tasks/{task-id}/stage-result.json`；实际运行会检查错误路径。`git show ... | grep` 还只写“应无输出”，没有可执行通过条件。


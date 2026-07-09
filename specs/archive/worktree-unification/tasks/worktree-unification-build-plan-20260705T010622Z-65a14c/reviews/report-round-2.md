# 审查报告 — worktree-unification-build-plan-20260705T010622Z-65a14c (round 2)

- verdict: revise_required
- provenance: single-context

## Summary

Round 2 verdict: revise_required. 已按 read-only verifier fallback 读取并应用 speckit-analyze、plan-eng-review、review 三个 skill lens；检查了 spec.md、plan.md、tasks.md、cross-artifact-analysis.md、data-contracts.md、prior round verdict、现有 verify-code/task-dir-parser anchors。多项 round 1 blocker 仍未闭环：scope 边界、data-contracts drift、yaml fallback 语义、parser 测试、commit 覆盖、stage-result 文件名、3rd-review fake/unavailable merge path。若下一轮仍保留同类 blocker，应按同-finding 三轮规则升级为 escalate_to_human。

## Findings

- [blocking] 位置: specs/worktree-unification/plan.md:74 | 问题: repeat: scope boundary still contradicts required implementation. plan 把 `workflows/build-spec/SKILL.md` / `workflows/build-plan/SKILL.md` 标为 forbidden/no-touch，但 Phase 3.1 和 tasks.md T005 又要求缺失时补充最小条文；FR-WORKTREE-SCOPE-008 也要求两者实际读取 worktree.json 并 fail-loud。 | 建议: 二选一写死：推荐把 `workflows/build-spec/SKILL.md` 和 `workflows/build-plan/SKILL.md` 纳入条件最小修改范围，并拆出明确实现任务；若坚持 forbidden，则删除“缺失则补充”，并把 FR-WORKTREE-SCOPE-008 明确延期，不能声称本轮满足。
- [blocking] 位置: specs/worktree-unification/data-contracts.md:16 | 问题: repeat: data contract 仍把 `worktree.json` 放在 `{worktree_root}/worktree.json`，与 spec 要求的 `{{task_tracking_root}}/tasks/{task-id}/worktree.json` 冲突。按此执行会把跨 stage 契约写进目标 worktree，继续造成断链风险。 | 建议: 把 Contract 1 的 File path 改成 `{{task_tracking_root}}/tasks/{task-id}/worktree.json`，并明确 `worktree_root` 只是 JSON 字段值，不是契约文件存放根。
- [blocking] 位置: specs/worktree-unification/data-contracts.md:71 | 问题: repeat: task_dir/parser 合约仍是旧模型。data-contracts 写 parser 返回 `task_dir` 供调用方拼 `{task_dir}/{task-id}/`，但 spec/plan 要求 parser 返回 `task_tracking_root`，调用方拼 `/tasks/{task-id}`。 | 建议: 重写 Contract 2：返回值定义为 `task_tracking_root`；规范任务路径为 `${task_tracking_root}/tasks/${task_id}/...`；删除旧 `{task_dir}/{task-id}` 表述。
- [blocking] 位置: specs/worktree-unification/data-contracts.md:78 | 问题: repeat: data-contracts 仍允许 hardcoded fallback `~/Knowledge/workflowhub/`，但 FR-WORKTREE-ENVVAR-003 要求优先级只能是 `WORKFLOWHUB_TASK_DIR` -> yaml `task_dir` -> fail-loud。 | 建议: 删除硬编码 fallback；补齐缺 config、缺 `task_dir`、路径不存在、非目录、相对路径、`~` 路径的 fail-loud 合约。
- [blocking] 位置: specs/worktree-unification/spec.md:55 | 问题: repeat: `WORKFLOWHUB_TASK_DIR` 语义与当前 yaml fallback 仍不可执行。spec 说明 parser 返回 `task_tracking_root` 且调用方拼 `/tasks/{task-id}`，但现有 `config/workflowhub.yaml` 的 `task_dir` 已经以 `/tasks/` 结尾，会产生 `/tasks/tasks/{task-id}`。 | 建议: 新增明确迁移/兼容任务：推荐把 `config/workflowhub.yaml` 的 `task_dir` 改为父级 `task_tracking_root`，或在 parser 中定义 legacy `/tasks` 结尾归一化规则；同时加入测试覆盖该场景。
- [blocking] 位置: specs/worktree-unification/tasks.md:13 | 问题: repeat: parser 行为变更仍缺少可执行测试任务和真实验证命令。plan 声称有 Node.js 单元测试，但 T001 只改实现；现有 `core/__tests__/task-dir-parser.test.mjs` 仍断言旧 fallback。 | 建议: 新增测试任务或 T001 子项：更新 `core/__tests__/task-dir-parser.test.mjs`，覆盖 env 优先、空 env 走 yaml、yaml fallback、yaml 缺失、yaml 无 `task_dir`、相对路径、`~`、不存在、非目录；写明真实命令，例如 `npm test -- core/__tests__/task-dir-parser.test.mjs` 或项目等价 Vitest 命令。
- [blocking] 位置: specs/worktree-unification/tasks.md:21 | 问题: repeat: FR-WORKTREE-COMMIT-004 的全 stage/phase commit 要求没有完整任务落点。T002 只覆盖 make-decision R7；T003 未覆盖 build-code per-phase commit；T004 只覆盖 close；build-spec/build-plan/verify-code 的 commit 或 no-change record 也未验收。 | 建议: 新增明确任务：更新 build-code phase 完成流程，产生变更时提交 `workflowhub(build-code/<phase-name>): ...`；增加全 stage commit/no-change 核查，覆盖 make-decision、build-spec、build-plan、build-code phase、verify-code、close，并同步 dependency graph / verification mapping。
- [blocking] 位置: specs/worktree-unification/spec.md:203 | 问题: repeat: stage-result 文件名契约分裂。spec/plan 多处写 `stage-result.json`，tasks.md T006 和现有 verify-code/facts-assembly 使用 `stage-result-verify-code.json`。执行后 writer/reader 可能针对不同文件，close/revise_required/failure 证据会失真。 | 建议: 选择唯一文件名并全量同步。推荐沿用现有 verify-code FR-PATH-001：把 spec、plan、tasks 中 close 相关路径统一改为 `{{task_tracking_root}}/tasks/{task-id}/stage-result-verify-code.json`，除非本计划同时迁移所有 reader/writer。
- [blocking] 位置: workflows/verify-code/SKILL.md:206 | 问题: repeat: pre-merge 3rd-review 仍依赖 fake placeholder `bash /path/to/3rd-review/standalone.sh`，而 T004 没要求替换为真实可调用入口。计划把 close 安全性建立在一个当前不可执行的 runner 上。 | 建议: 在 T004 明确加入：替换 fake path；指定真实 3rd-review runner/发现规则、输入、输出 verdict schema、证据目录、超时和失败语义；placeholder 只能作为非执行示例，旁边必须有真实命令。
- [blocking] 位置: workflows/verify-code/SKILL.md:226 | 问题: repeat: 当前 verify-code 在 3rd-review unavailable 时仍允许进入 merge gate，但 spec 要求 3rd-review verdict=pass 后才可执行不可逆动作。工具故障时仍可能 merge/push/delete 未经独立审查的代码。 | 建议: 把 unavailable 改成 fail/stall：写入 `needs_human=true`、记录原因、停止不可逆动作并 escalate_to_human；若允许人工 override，必须在计划中定义显式批准记录和风险确认，不得静默继续。
- [important] 位置: specs/worktree-unification/spec.md:228 | 问题: repo `specs/{task-id}/` 白名单与实际计划产物冲突。spec 说只允许 spec.md / plan.md / tasks.md，但 plan 本身列出 research.md、data-contracts.md，当前目录还有 checklists、constitution-check、baseline-report、stage-result.json。T006 按现文执行会永久红或被迫假绿。 | 建议: 重写边界为 allow/deny：允许 build-plan 阶段规划产物留在 repo specs 下；禁止 runtime/process evidence，如 `evidence/`、`stage-result*`、journal、metrics。同步 T006 的检查口径。
- [important] 位置: specs/worktree-unification/tasks.md:25 | 问题: T004 没显式写入 spec 要求的删分支前安全检查：删除远端/本地分支前必须确认目标提交已被 main 包含，确认失败要停止 close。 | 建议: 在 T004 的 8 步序列中，在删远端/删本地分支前加入 containment check：验证 task branch tip 或 merge commit 已被 main 包含；失败则停止、保留分支、记录失败并 escalate_to_human。

## Checks

审查维度覆盖：方向、盲点、细节
- 维度[方向]：已覆盖
- 维度[盲点]：已覆盖
- 维度[细节]：已覆盖

## Required Revisions

降级理由：(未提供，需补充)
- 必须修复：repeat: scope boundary still contradicts required implementation. plan 把 `workflows/build-spec/SKILL.md` / `workflows/build-plan/SKILL.md` 标为 forbidden/no-touch，但 Phase 3.1 和 tasks.md T005 又要求缺失时补充最小条文；FR-WORKTREE-SCOPE-008 也要求两者实际读取 worktree.json 并 fail-loud。
- 必须修复：repeat: data contract 仍把 `worktree.json` 放在 `{worktree_root}/worktree.json`，与 spec 要求的 `{{task_tracking_root}}/tasks/{task-id}/worktree.json` 冲突。按此执行会把跨 stage 契约写进目标 worktree，继续造成断链风险。
- 必须修复：repeat: task_dir/parser 合约仍是旧模型。data-contracts 写 parser 返回 `task_dir` 供调用方拼 `{task_dir}/{task-id}/`，但 spec/plan 要求 parser 返回 `task_tracking_root`，调用方拼 `/tasks/{task-id}`。
- 必须修复：repeat: data-contracts 仍允许 hardcoded fallback `~/Knowledge/workflowhub/`，但 FR-WORKTREE-ENVVAR-003 要求优先级只能是 `WORKFLOWHUB_TASK_DIR` -> yaml `task_dir` -> fail-loud。
- 必须修复：repeat: `WORKFLOWHUB_TASK_DIR` 语义与当前 yaml fallback 仍不可执行。spec 说明 parser 返回 `task_tracking_root` 且调用方拼 `/tasks/{task-id}`，但现有 `config/workflowhub.yaml` 的 `task_dir` 已经以 `/tasks/` 结尾，会产生 `/tasks/tasks/{task-id}`。
- 必须修复：repeat: parser 行为变更仍缺少可执行测试任务和真实验证命令。plan 声称有 Node.js 单元测试，但 T001 只改实现；现有 `core/__tests__/task-dir-parser.test.mjs` 仍断言旧 fallback。
- 必须修复：repeat: FR-WORKTREE-COMMIT-004 的全 stage/phase commit 要求没有完整任务落点。T002 只覆盖 make-decision R7；T003 未覆盖 build-code per-phase commit；T004 只覆盖 close；build-spec/build-plan/verify-code 的 commit 或 no-change record 也未验收。
- 必须修复：repeat: stage-result 文件名契约分裂。spec/plan 多处写 `stage-result.json`，tasks.md T006 和现有 verify-code/facts-assembly 使用 `stage-result-verify-code.json`。执行后 writer/reader 可能针对不同文件，close/revise_required/failure 证据会失真。
- 必须修复：repeat: pre-merge 3rd-review 仍依赖 fake placeholder `bash /path/to/3rd-review/standalone.sh`，而 T004 没要求替换为真实可调用入口。计划把 close 安全性建立在一个当前不可执行的 runner 上。
- 必须修复：repeat: 当前 verify-code 在 3rd-review unavailable 时仍允许进入 merge gate，但 spec 要求 3rd-review verdict=pass 后才可执行不可逆动作。工具故障时仍可能 merge/push/delete 未经独立审查的代码。


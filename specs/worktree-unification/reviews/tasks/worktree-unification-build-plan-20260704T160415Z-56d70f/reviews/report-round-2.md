# 审查报告 — worktree-unification-build-plan-20260704T160415Z-56d70f (round 2)

- verdict: revise_required
- provenance: single-context

## Summary

Round 2: revise_required. 已读 reviewer contract、三项 required skill 的 SKILL.md，并用 read-only verifier fallback + 独立 subagent 执行 speckit-analyze、plan-eng-review、review 三个 lens。Round 1 中 Constitution Check 旧语义已修复；T007 acceptance checklist repo 内落点已修复；T005 漏 build-plan 已部分修复为覆盖 build-spec/build-plan。但 7 个阻断仍未关闭：data-contracts 路径冲突、task_dir/fallback 旧契约、build-spec/build-plan scope 边界矛盾、全 stage/phase commit 任务缺口、stage-result 文件名分裂、parser 测试缺口、3rd-review fake entry/不可达继续 merge。以上均为可执行性或契约一致性 blocker。

## Findings

- [blocking] 位置: specs/worktree-unification/data-contracts.md:16 | 问题: worktree.json 契约路径仍与权威 spec 冲突。data-contracts 写 `{worktree_root}/worktree.json`，但 spec.md 要求 `{{task_tracking_root}}/tasks/{task-id}/worktree.json`。执行者若按 data-contracts 实现，会把跨 stage 契约写回任务 worktree，核心断链风险仍存在。 | 建议: 把 Contract 1 的 File path 改为 `{{task_tracking_root}}/tasks/{task-id}/worktree.json`，并明确 `worktree_root` 只是目标 repo worktree 字段值，不是契约文件存放根。
- [blocking] 位置: specs/worktree-unification/data-contracts.md:71 | 问题: task_dir/parser 合约仍是旧模型。data-contracts 写 parser 返回值供调用方拼接 `{task_dir}/{task-id}/`，并在 line 78 保留 `~/Knowledge/workflowhub/` fallback；这与 spec/plan/tasks 的 `task_tracking_root -> /tasks/{task-id}` 和双缺失 fail-loud 冲突。 | 建议: 重写 Contract 2：parser 返回 task_tracking_root 本身；调用方拼接 `${task_tracking_root}/tasks/${task_id}/...`；优先级固定为 `WORKFLOWHUB_TASK_DIR -> config/workflowhub.yaml task_dir -> fail-loud`，删除硬编码 fallback。
- [blocking] 位置: specs/worktree-unification/plan.md:75 | 问题: build-spec/build-plan 修改边界仍不可执行。plan 把 `workflows/build-spec/SKILL.md` 和 `workflows/build-plan/SKILL.md` 列为 forbidden/不修改，但 Step 3.1、Scope Boundary、T005 又允许缺失时最小补充。执行者无法判断是只读审计、允许补丁，还是必须补丁。 | 建议: 二选一写死：推荐把 `workflows/build-spec/SKILL.md` 和 `workflows/build-plan/SKILL.md` 纳入“条件最小修改”范围，并把 T005 前移到核心实现阶段；若坚持只读，则删除“缺失则补充”，把缺口列为后续任务，且本轮不得声称满足 FR-WORKTREE-SCOPE-008。
- [blocking] 位置: specs/worktree-unification/tasks.md:21 | 问题: FR-WORKTREE-COMMIT-004 的 per-stage/per-phase commit 要求仍没有完整任务落点。tasks 只把 make-decision R7 写进 T002；T003 只处理 build-code §17 fallback/schema；T004 只处理 close；没有任务覆盖 build-code 每个 phase commit、build-spec/build-plan/verify-code 的 commit 或 no-change record 验证。 | 建议: 新增明确任务：更新 build-code phase 完成流程，产生变更时提交 `workflowhub(build-code/<phase-name>): ...`；增加全 stage commit/no-change 记录核查，覆盖 make-decision、build-spec、build-plan、build-code phase、verify-code、close，并同步 dependency graph / verification mapping。
- [blocking] 位置: specs/worktree-unification/tasks.md:35 | 问题: stage-result 文件名契约分裂。spec/plan 多处要求 `stage-result.json`，tasks 当前要求 `stage-result-verify-code.json`，现有 verify-code skill 与 facts-assembly 也写 `stage-result-verify-code.json`。 | 建议: 选择唯一文件名并同步 spec.md、plan.md、tasks.md、workflows/verify-code/SKILL.md、facts-assembly 和测试。推荐沿用现有 `stage-result-verify-code.json`，把 spec/plan 的 close 契约和验收文字全部改成该文件名。
- [blocking] 位置: specs/worktree-unification/tasks.md:13 | 问题: parser 行为变更仍缺少可执行测试任务，且现有测试断言旧 fallback。plan 声称有 Node.js 单元测试，但 tasks 只要求改实现，没有要求更新 `core/__tests__/task-dir-parser.test.mjs` 或运行具体命令。 | 建议: 在 T001 下新增测试子任务或独立任务：更新 `core/__tests__/task-dir-parser.test.mjs`，覆盖 env 优先、空 env 走 yaml、yaml fallback、yaml 缺失 fail-loud、yaml 无 `task_dir` fail-loud、相对路径/`~`/不存在/非目录 fail-loud；Verify 写明 `npx vitest run core/__tests__/task-dir-parser.test.mjs`。
- [blocking] 位置: specs/worktree-unification/tasks.md:25 | 问题: pre-merge 3rd-review gate 仍没有真实可执行入口要求。T004 说要跑 3rd-review，但没有要求替换当前 verify-code 中的 `/path/to/3rd-review/standalone.sh` 占位命令，也没有定义 runner discovery、输出 schema、不可达时 fail-loud 语义。 | 建议: 在 T004 明确加入：替换 fake standalone path；指定真实 runner/发现规则、输入、输出 verdict schema、证据目录、超时/不可达处理；不可达时必须 fail-loud + needs_human + escalate_to_human，不得 downgrade 后继续 merge。

## Checks

审查维度覆盖：方向、盲点、细节
- 维度[方向]：已覆盖
- 维度[盲点]：已覆盖
- 维度[细节]：已覆盖

## Required Revisions

降级理由：(未提供，需补充)
- 必须修复：worktree.json 契约路径仍与权威 spec 冲突。data-contracts 写 `{worktree_root}/worktree.json`，但 spec.md 要求 `{{task_tracking_root}}/tasks/{task-id}/worktree.json`。执行者若按 data-contracts 实现，会把跨 stage 契约写回任务 worktree，核心断链风险仍存在。
- 必须修复：task_dir/parser 合约仍是旧模型。data-contracts 写 parser 返回值供调用方拼接 `{task_dir}/{task-id}/`，并在 line 78 保留 `~/Knowledge/workflowhub/` fallback；这与 spec/plan/tasks 的 `task_tracking_root -> /tasks/{task-id}` 和双缺失 fail-loud 冲突。
- 必须修复：build-spec/build-plan 修改边界仍不可执行。plan 把 `workflows/build-spec/SKILL.md` 和 `workflows/build-plan/SKILL.md` 列为 forbidden/不修改，但 Step 3.1、Scope Boundary、T005 又允许缺失时最小补充。执行者无法判断是只读审计、允许补丁，还是必须补丁。
- 必须修复：FR-WORKTREE-COMMIT-004 的 per-stage/per-phase commit 要求仍没有完整任务落点。tasks 只把 make-decision R7 写进 T002；T003 只处理 build-code §17 fallback/schema；T004 只处理 close；没有任务覆盖 build-code 每个 phase commit、build-spec/build-plan/verify-code 的 commit 或 no-change record 验证。
- 必须修复：stage-result 文件名契约分裂。spec/plan 多处要求 `stage-result.json`，tasks 当前要求 `stage-result-verify-code.json`，现有 verify-code skill 与 facts-assembly 也写 `stage-result-verify-code.json`。
- 必须修复：parser 行为变更仍缺少可执行测试任务，且现有测试断言旧 fallback。plan 声称有 Node.js 单元测试，但 tasks 只要求改实现，没有要求更新 `core/__tests__/task-dir-parser.test.mjs` 或运行具体命令。
- 必须修复：pre-merge 3rd-review gate 仍没有真实可执行入口要求。T004 说要跑 3rd-review，但没有要求替换当前 verify-code 中的 `/path/to/3rd-review/standalone.sh` 占位命令，也没有定义 runner discovery、输出 schema、不可达时 fail-loud 语义。


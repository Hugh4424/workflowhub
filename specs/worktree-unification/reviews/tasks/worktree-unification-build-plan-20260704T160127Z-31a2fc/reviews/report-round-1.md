# 审查报告 — worktree-unification-build-plan-20260704T160127Z-31a2fc (round 1)

- verdict: revise_required
- provenance: single-context

## Summary

Round 1 review: revise_required. 已按 required skill lens 执行只读核查：speckit-analyze、plan-eng-review、review 均通过 SKILL.md fallback + 独立子代理检查完成。核心方案可行，但当前 review package 存在 blocking 的契约冲突、任务覆盖缺口、宪法检查假绿、stale data-contracts、验证不可执行问题；不能进入实现。

## Findings

- [blocking] 位置: specs/worktree-unification/plan.md:292 | 问题: Constitution Check 使用过期条目体系，不匹配当前 CONSTITUTION.md / constitution-checklist.md。plan 声称完成 21 条检查，但 F5-F10、S1-S8 多处语义错位，例如 plan 的 F8 是“新功能先有 research”，当前宪法 F8 是“简单优先”。 | 建议: 重写 Constitution Check，逐条对齐当前 constitution-checklist.md 的 21 条；删除重复的 F8 `[ ]` / `[x]` 修补段，不用旧安全清单替代当前宪法。
- [blocking] 位置: specs/worktree-unification/tasks.md:37 | 问题: T007 要新增 `specs/worktree-unification/checklists/acceptance.md`，但 spec/plan/tasks 同时要求 `specs/{task-id}/` 只允许 `spec.md`、`plan.md`、`tasks.md`。执行 T007 会直接让 T006/FR-WORKTREE-SCOPE-009 失败。 | 建议: 二选一写死：推荐把 acceptance checklist 改到 `{{task_tracking_root}}/tasks/{task-id}/checklists/acceptance.md`；或显式扩展 repo 内交付物白名单，并同步修改 spec、plan、T006。
- [blocking] 位置: specs/worktree-unification/tasks.md:33 | 问题: FR-WORKTREE-SCOPE-008 要覆盖 build-spec 和 build-plan，但 T005 只核查 `workflows/build-spec/SKILL.md`，没有 build-plan 的任务落点。plan.md 又在别处禁止修改 `workflows/build-plan/SKILL.md`，导致核心路径连续性无法执行。 | 建议: 新增或扩展任务同时覆盖 `workflows/build-plan/SKILL.md`：明确只读核查还是允许最小修改；同步 dependency graph、scope boundary、verification mapping。
- [blocking] 位置: specs/worktree-unification/data-contracts.md:16 | 问题: data-contracts.md 把 `worktree.json` 路径定义为 `{worktree_root}/worktree.json`，与 spec/plan 的 `{{task_tracking_root}}/tasks/{task-id}/worktree.json` 冲突。按此执行会把跨 stage 契约写进任务 worktree，仍可能复现断链。 | 建议: 修正 data-contracts.md：`worktree.json` 唯一路径为 `{{task_tracking_root}}/tasks/{task-id}/worktree.json`；明确 `worktree_root` 是目标 repo worktree，不是契约文件存放根。
- [blocking] 位置: specs/worktree-unification/data-contracts.md:78 | 问题: data-contracts.md 仍保留第三层 fallback `~/Knowledge/workflowhub/`，与 spec/plan/tasks 的“两者缺失 fail-loud、不使用硬编码路径”冲突。 | 建议: 删除硬编码 fallback；路径解析优先级只能是 `WORKFLOWHUB_TASK_DIR` → yaml `task_dir` → fail-loud。同步标注 research.md 中旧 fallback 描述已被 spec 覆盖，避免 stale contract。
- [blocking] 位置: specs/worktree-unification/plan.md:174 | 问题: FR-WORKTREE-COMMIT-004 的 per-stage/per-phase commit 要求没有落到可执行任务。plan/tasks 只覆盖 make-decision R7 和 build-code §17 fallback，未覆盖 build-code 每个 phase 完成后必须 commit，也未覆盖 build-spec/build-plan/verify-code 的 commit 或 no-change 记录验证。 | 建议: 新增明确任务：修改 `workflows/build-code/SKILL.md` phase 完成流程，要求产生变更的 phase 提交 `workflowhub(build-code/<phase-name>): ...`；同时加入全 stage commit/no-change 记录核查。
- [blocking] 位置: specs/worktree-unification/plan.md:74 | 问题: Forbidden files 与执行步骤冲突。plan 把 `workflows/build-spec/SKILL.md` 列为不可触碰，但 Step 3.1、Scope Boundary、T005 又允许“如缺失则最小补充”。执行者无法判断 build-spec 是只读还是可改。 | 建议: 统一边界：若 build-spec/build-plan 只能只读核查，则删除“缺失则补充”并把缺口列为 follow-up；若允许修改，则从 Forbidden files 移出并写清允许修改范围。
- [blocking] 位置: specs/worktree-unification/tasks.md:13 | 问题: T001 修改 `core/task-dir-parser.mjs`，但 tasks.md 没有测试任务或可执行验证命令。plan.md 声称有 Node.js 单元测试，实际 task 只要求改实现，无法客观证明 env var 优先、yaml fallback、缺失 fail-loud、非目录/相对路径/`~` 等边界。 | 建议: 新增测试任务：更新 `core/__tests__/task-dir-parser.test.mjs`，覆盖 plan.md 1.1 的全部边界；Verification 阶段加入真实测试命令，不用人工阅读替代 parser 行为验证。
- [important] 位置: specs/worktree-unification/plan.md:189 | 问题: `3rd-review` 是 merge 前关键门控，但 plan/tasks 没有定义真实可调用入口、输入、输出 schema、失败语义和证据目录规则。实现者可能沿用占位命令，导致 close 流程不可执行或不可验证。 | 建议: 在 T004 中写明 3rd-review 的真实 runner/发现方式、输入文件、输出 verdict schema、超时/不可达处理、证据目录命名；禁止 `/path/to/...` 占位命令。
- [important] 位置: specs/worktree-unification/plan.md:193 | 问题: close 8 步不可逆序列缺少 remote/default-branch 前置校验细节。当前写死 `main`/`origin` 语义，未说明本地 main 是否 clean、是否落后远端、远端任务分支如何精确检测。 | 建议: 补充 close 前置校验：确认 default branch/remote 策略、`target_repo_root` 工作区 clean、main 与远端关系；远端分支检测使用 fully-qualified ref 或 `git ls-remote --exit-code origin refs/heads/workflowhub/{task-id}`。
- [important] 位置: specs/worktree-unification/tasks.md:25 | 问题: stage-result 文件名契约不一致。spec/tasks 写 `stage-result.json`，当前 `workflows/verify-code/SKILL.md` 使用 `stage-result-verify-code.json`。实现后可能产生两个结果文件或下游读错路径。 | 建议: 选择唯一文件名作为契约。若改为 `stage-result.json`，同步 verify-code skill、facts assembly、metrics 读取点；否则 spec/plan/tasks 沿用 `stage-result-verify-code.json`。

## Checks

审查维度覆盖：方向、盲点、细节
- 维度[方向]：已覆盖
- 维度[盲点]：已覆盖
- 维度[细节]：已覆盖

## Required Revisions

降级理由：(未提供，需补充)
- 必须修复：Constitution Check 使用过期条目体系，不匹配当前 CONSTITUTION.md / constitution-checklist.md。plan 声称完成 21 条检查，但 F5-F10、S1-S8 多处语义错位，例如 plan 的 F8 是“新功能先有 research”，当前宪法 F8 是“简单优先”。
- 必须修复：T007 要新增 `specs/worktree-unification/checklists/acceptance.md`，但 spec/plan/tasks 同时要求 `specs/{task-id}/` 只允许 `spec.md`、`plan.md`、`tasks.md`。执行 T007 会直接让 T006/FR-WORKTREE-SCOPE-009 失败。
- 必须修复：FR-WORKTREE-SCOPE-008 要覆盖 build-spec 和 build-plan，但 T005 只核查 `workflows/build-spec/SKILL.md`，没有 build-plan 的任务落点。plan.md 又在别处禁止修改 `workflows/build-plan/SKILL.md`，导致核心路径连续性无法执行。
- 必须修复：data-contracts.md 把 `worktree.json` 路径定义为 `{worktree_root}/worktree.json`，与 spec/plan 的 `{{task_tracking_root}}/tasks/{task-id}/worktree.json` 冲突。按此执行会把跨 stage 契约写进任务 worktree，仍可能复现断链。
- 必须修复：data-contracts.md 仍保留第三层 fallback `~/Knowledge/workflowhub/`，与 spec/plan/tasks 的“两者缺失 fail-loud、不使用硬编码路径”冲突。
- 必须修复：FR-WORKTREE-COMMIT-004 的 per-stage/per-phase commit 要求没有落到可执行任务。plan/tasks 只覆盖 make-decision R7 和 build-code §17 fallback，未覆盖 build-code 每个 phase 完成后必须 commit，也未覆盖 build-spec/build-plan/verify-code 的 commit 或 no-change 记录验证。
- 必须修复：Forbidden files 与执行步骤冲突。plan 把 `workflows/build-spec/SKILL.md` 列为不可触碰，但 Step 3.1、Scope Boundary、T005 又允许“如缺失则最小补充”。执行者无法判断 build-spec 是只读还是可改。
- 必须修复：T001 修改 `core/task-dir-parser.mjs`，但 tasks.md 没有测试任务或可执行验证命令。plan.md 声称有 Node.js 单元测试，实际 task 只要求改实现，无法客观证明 env var 优先、yaml fallback、缺失 fail-loud、非目录/相对路径/`~` 等边界。


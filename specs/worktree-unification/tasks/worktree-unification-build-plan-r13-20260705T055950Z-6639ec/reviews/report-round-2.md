# 审查报告 — worktree-unification-build-plan-r13-20260705T055950Z-6639ec (round 2)

- verdict: revise_required
- provenance: single-context

## Summary

已用 speckit-analyze、plan-eng-review、review 的 SKILL.md fallback 只读核查。Round-12 T008 覆盖缺 make-decision 与 close 前缀错误已闭合；T005 内联假脚本问题已改成真实脚本方向，但引入未登记/未生产的新交付物且 stdout 行为未验；Round-12 data-contracts Contract 4 覆盖缺口仍未闭合。

## Findings

- [blocking] 位置: specs/worktree-unification/data-contracts.md:123 | 问题: Contract 4 仍未闭合 Round-12 的 commit 覆盖问题。Owner side 和 Per-stage commit coverage 仍只列 make-decision、build-code per phase、verify-code close，漏掉 tasks.md T008 已要求验收的 build-spec、build-plan、verify-code stage commit。 | 建议: 同步 Contract 4：Owner side、Per-stage commit coverage、Version Compatibility Notes 必须逐行覆盖 make-decision、build-spec、build-plan、build-code per phase、verify-code、verify-code close，并写清 commit message、no-change 记录和不可跳过条件。
- [blocking] 位置: specs/worktree-unification/tasks.md:74 | 问题: T005 新增 `core/worktree-context.mjs` 作为真实交付物，但 plan.md 的 Source Code / Scope Boundary 仍声明只改 4 个核心文件且无新增模块；data-contracts.md 也没有登记这个共享脚本接口。任务说它由 build-code 阶段创建，但 Stage 2 没有任何任务创建它，T005 执行时会遇到未生产的依赖。 | 建议: 二选一：删除 `core/worktree-context.mjs` 新增概念，改为验收真实 stage 入口；或把它正式登记到 plan.md Source Code、Scope Boundary、data-contracts，并新增明确创建任务，且让 T005 依赖该任务。推荐后者，因当前 T005 需要真实共享读取对象。
- [blocking] 位置: specs/worktree-unification/tasks.md:86 | 问题: 字段齐全场景 gate 只断言 `core/worktree-context.mjs` exit 0，没有验证 stdout 真的打印 JSON，也没有验证 JSON 含 `target_repo_root` 和 `worktree_root`。脚本即使空输出也会通过，build-spec/build-plan 消费时仍会断链。 | 建议: 把 gate 改为捕获 stdout 并用 `jq -e '.target_repo_root and .worktree_root'` 或等价 Node 断言校验输出 JSON；同时保留 exit 0 检查。

## Checks

审查维度覆盖：方向、盲点、细节
- 维度[方向]：已覆盖
- 维度[盲点]：已覆盖
- 维度[细节]：已覆盖

## Required Revisions

降级理由：(未提供，需补充)
- 必须修复：Contract 4 仍未闭合 Round-12 的 commit 覆盖问题。Owner side 和 Per-stage commit coverage 仍只列 make-decision、build-code per phase、verify-code close，漏掉 tasks.md T008 已要求验收的 build-spec、build-plan、verify-code stage commit。
- 必须修复：T005 新增 `core/worktree-context.mjs` 作为真实交付物，但 plan.md 的 Source Code / Scope Boundary 仍声明只改 4 个核心文件且无新增模块；data-contracts.md 也没有登记这个共享脚本接口。任务说它由 build-code 阶段创建，但 Stage 2 没有任何任务创建它，T005 执行时会遇到未生产的依赖。
- 必须修复：字段齐全场景 gate 只断言 `core/worktree-context.mjs` exit 0，没有验证 stdout 真的打印 JSON，也没有验证 JSON 含 `target_repo_root` 和 `worktree_root`。脚本即使空输出也会通过，build-spec/build-plan 消费时仍会断链。


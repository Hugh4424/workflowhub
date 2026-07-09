# 审查报告 — worktree-unification-build-plan-r13-20260705T055950Z-6639ec (round 1)

- verdict: revise_required
- provenance: single-context

## Summary

Round-12 的 T005 假行为 gate 已改为调用真实 `core/worktree-context.mjs`；T008 已补 make-decision 并修正 close 前缀为 `workflowhub(close): archive`。但 data-contracts Contract 4 未同步，且新脚本缺少计划级落点和前置创建任务，仍不可稳定执行。

## Findings

- [blocking] 位置: specs/worktree-unification/data-contracts.md:123 | 问题: Contract 4 仍未闭合 Round-12 的 blocking：Owner side 和覆盖矩阵仍只列 make-decision、build-code per phase、verify-code close，漏掉 build-spec、build-plan、verify-code stage commit 分母。tasks.md T008 已改成 6 个触发点，但 data-contracts 仍会误导执行者按旧收缩契约验收。 | 建议: 同步修改 Contract 4：Owner side、Per-stage commit coverage、Version Compatibility Notes 必须逐行覆盖 make-decision、build-spec、build-plan、build-code per phase、verify-code、verify-code close；每行写清 commit message、无变更记录字段和不可跳过条件。
- [blocking] 位置: specs/worktree-unification/tasks.md:75 | 问题: T005 新增 `core/worktree-context.mjs` 交付物，但 plan.md 的 Source Code / Scope Boundary / Verification Mapping 未纳入该文件，且没有独立任务在 T005 之前创建并测试它。T005 只说“build-code 阶段创建”，但 Stage 2 的 T002-T004 都没有创建该文件；执行到 T005 时 gate 可能直接因文件不存在失败。 | 建议: 新增或改写一个明确的 Stage 2 任务，在 T005 之前创建 `core/worktree-context.mjs`，包含接口、测试、commit gate；同步更新 plan.md 的 Project Structure、Scope Boundary、Verification Mapping，并在 data-contracts 中登记该共享读取接口。

## Checks

审查维度覆盖：方向、盲点、细节
- 维度[方向]：已覆盖
- 维度[盲点]：已覆盖
- 维度[细节]：已覆盖

## Required Revisions

降级理由：(未提供，需补充)
- 必须修复：Contract 4 仍未闭合 Round-12 的 blocking：Owner side 和覆盖矩阵仍只列 make-decision、build-code per phase、verify-code close，漏掉 build-spec、build-plan、verify-code stage commit 分母。tasks.md T008 已改成 6 个触发点，但 data-contracts 仍会误导执行者按旧收缩契约验收。
- 必须修复：T005 新增 `core/worktree-context.mjs` 交付物，但 plan.md 的 Source Code / Scope Boundary / Verification Mapping 未纳入该文件，且没有独立任务在 T005 之前创建并测试它。T005 只说“build-code 阶段创建”，但 Stage 2 的 T002-T004 都没有创建该文件；执行到 T005 时 gate 可能直接因文件不存在失败。


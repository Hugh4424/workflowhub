# Plan Summary Draft: worktree-unification

**task-id**: worktree-unification
**stage**: build-plan
**date**: 2026-07-04

---

## 1. 目标

建立跨 stage 的 worktree 统一协议，消除 ZHI-65 断链根因：通过 worktree.json（6 字段契约文件）+
`WORKFLOWHUB_TASK_DIR` env var 优先级 + 废除旧 fallback + close 流程 8 步线性序列，实现 5-stage pipeline 全程共享唯一可信 worktree 路径。

## 2. 方案概述

改动 4 个文件：
- `core/task-dir-parser.mjs` — env var → yaml fallback → fail-loud
- `workflows/make-decision/SKILL.md` — 新增 worktree 规则章节 R1-R7
- `workflows/build-code/SKILL.md` — §17 删除旧 fallback，改为 fail-loud
- `workflows/verify-code/SKILL.md` — close 流程补充完整 5 步骤

只读核查另 2 个文件（build-spec/SKILL.md、build-plan/SKILL.md）。

## 3. 关键决策

- task_tracking_root 不写入 worktree.json（env var 每次重新读取，保持契约纯粹性）
- 3rd-review 在 merge 之前（修正 D5 原顺序，避免不可逆后才审查）
- partial-close 恢复机制不实现（独立决策，另立 task）

## 4. 实施任务（7 条，3 阶段）

- Stage 1: T001（parser 改造，基础）
- Stage 2: T002/T003/T004（SKILL.md 改动，可并行）
- Stage 3: T005/T006/T007（核查与验收清单）

## 5. 风险

- data-contracts.md 与 spec 存在路径模型出入（3rd-review finding F-blocking-2）
- verify-code/SKILL.md 现有 stage-result 文件名 `stage-result-verify-code.json` 与 spec 部分用语不一致（T006 须统一）
- T005 须先读 build-spec/SKILL.md + build-plan/SKILL.md 再判断是否补充

## 6. 产物路径

- plan.md: `specs/worktree-unification/plan.md`
- tasks.md: `specs/worktree-unification/tasks.md`
- cross-artifact-analysis.md: `specs/worktree-unification/cross-artifact-analysis.md`
- plan-review: `specs/worktree-unification/reviews/tasks/worktree-unification-build-plan-r2-20260704T161149Z-721561/reviews/verdict.json`

## 7. 待人工确认事项

- data-contracts.md 与 spec worktree.json 存放路径出入（`worktree_root` vs `task_tracking_root`）需拍板统一
- cross-artifact-analysis F-04：revise_required 后 close 流程恢复点（从步骤①重新开始）是否为正确默认行为

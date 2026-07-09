# 审查报告 — worktree-unification-build-plan-r9b-20260705T040949Z-05cd9e (round 4)

- verdict: revise_required
- provenance: single-context

## Summary

已执行三类 required skill 的只读 fallback 审查：speckit-analyze、plan-eng-review、review。旧 round-7/8 的路径合同、硬编码 fallback、build-spec 禁改、部分 pipe exit-code、stage-result 入库问题基本关闭；但 round-9 仍有可执行性和可验证性阻断，不能 pass。

## Findings

- [blocking] 位置: specs/worktree-unification/tasks.md:15 | 问题: T001 gate_cmd 不可执行。命令使用 `require('./core/task-dir-parser.mjs').then(...)`，但当前模块导出的是同步 `parseTaskDir` 函数，实跑会先报 `TypeError: require(...).then is not a function`，无法验证 env 优先级、fail-loud、路径语义。 | 建议: 把所有 parser gate 改成真实 ESM 调用，例如 `node --input-type=module -e "import { parseTaskDir } from './core/task-dir-parser.mjs'; const r=parseTaskDir(); ..."`；env 成功用例断言精确相等，fail-loud 用例断言非零退出和明确 stderr。
- [blocking] 位置: specs/worktree-unification/tasks.md:36 | 问题: T002 引入 `/tasks` 自动裁剪和 `normalizeTaskTrackingRoot()` API，但 spec.md:55 说 yaml 值若含 `/tasks` 应迁移或设置父目录，data-contracts.md:71-80 也没有定义该归一化规则或 public helper。该任务引入未获 spec/contract 支撑的新概念。 | 建议: 二选一并全量同步。推荐把一个尾随 `/tasks` 或 `/tasks/` 的归一化规则正式写入 spec.md、plan.md、data-contracts.md，并通过 `parseTaskDir` 测试；不要新增未登记的 `normalizeTaskTrackingRoot()` public API。
- [blocking] 位置: specs/worktree-unification/tasks.md:84 | 问题: FR-WORKTREE-COMMIT-004 是硬性范围内要求，但 T008 是只读/advisory，写明缺失项列为 follow-up。执行该计划时 per-phase commit/no-change 覆盖仍可缺失而不阻断。 | 建议: 把 T008 改成 blocking verification；在 T003 或新增实现任务中要求 `workflows/build-code/SKILL.md` 落地每个变更 phase 的 `workflowhub(build-code/<phase-name>): ...` commit 规则，以及 no-change 记录规则；把 T008 加入 plan.md Verification Mapping。
- [blocking] 位置: specs/worktree-unification/data-contracts.md:128 | 问题: Contract 4 写“每个 stage/phase 完成时至少执行一次 `git add + git commit`”，但 spec.md:154-165 要求仅有文件变更时 commit，无变更时写 stage-result/journal 原因且不使用空提交。合同与 spec 冲突。 | 建议: Contract 4 改为：有文件变更才 commit；无变更必须写 no-change reason 到 stage-result 或 journal；明确禁止 empty stage marker commit。
- [blocking] 位置: specs/worktree-unification/tasks.md:13 | 问题: T001 修改 `core/task-dir-parser.mjs` 的持久行为，但 tasks.md 未要求更新持久测试。现有 `core/__tests__/task-dir-parser.test.mjs:24-26` 仍断言缺失 config 时 fallback 到 `~/Knowledge/workflowhub/`，与新 fail-loud 要求冲突。 | 建议: 新增 test-first 子任务：先更新 `core/__tests__/task-dir-parser.test.mjs`，再实现 parser；gate 用 `npx vitest run core/__tests__/task-dir-parser.test.mjs`，覆盖 env priority、yaml fallback、missing yaml、missing task_dir、nonexistent、non-directory、硬编码 fallback 删除和最终选定的 `/tasks` 归一化规则。
- [important] 位置: specs/worktree-unification/tasks.md:69 | 问题: T006 要求 `${WORKFLOWHUB_TASK_DIR}/tasks/worktree-unification/stage-result.json` 和 evidence 目录存在，但这些是 verify-code close 后运行时产物，不应作为 Stage 3 文档计划阶段的前置 gate。 | 建议: 拆分静态与运行时验证：Stage 3 只验证 verify-code/SKILL.md 的路径规则和 repo 内 forbidden 文件不存在；外部 stage-result/evidence 存在性移到 verify-code close acceptance。
- [important] 位置: specs/worktree-unification/cross-artifact-analysis.md:6 | 问题: 文件声称 round-9 的 5 blocking + 4 important 全部已修复，但当前主文档仍有 blocking，且已有最新 r9b review 报告仍为 revise_required。该 closure summary 是假绿。 | 建议: 重生成 closure matrix，标注 superseded review 路径；不要在 cross-artifact-analysis.md 宣称全部已修复，直到 blocking 清零。

## Checks

审查维度覆盖：方向、盲点、细节
- 维度[方向]：已覆盖
- 维度[盲点]：已覆盖
- 维度[细节]：已覆盖

## Required Revisions

降级理由：(未提供，需补充)
- 必须修复：T001 gate_cmd 不可执行。命令使用 `require('./core/task-dir-parser.mjs').then(...)`，但当前模块导出的是同步 `parseTaskDir` 函数，实跑会先报 `TypeError: require(...).then is not a function`，无法验证 env 优先级、fail-loud、路径语义。
- 必须修复：T002 引入 `/tasks` 自动裁剪和 `normalizeTaskTrackingRoot()` API，但 spec.md:55 说 yaml 值若含 `/tasks` 应迁移或设置父目录，data-contracts.md:71-80 也没有定义该归一化规则或 public helper。该任务引入未获 spec/contract 支撑的新概念。
- 必须修复：FR-WORKTREE-COMMIT-004 是硬性范围内要求，但 T008 是只读/advisory，写明缺失项列为 follow-up。执行该计划时 per-phase commit/no-change 覆盖仍可缺失而不阻断。
- 必须修复：Contract 4 写“每个 stage/phase 完成时至少执行一次 `git add + git commit`”，但 spec.md:154-165 要求仅有文件变更时 commit，无变更时写 stage-result/journal 原因且不使用空提交。合同与 spec 冲突。
- 必须修复：T001 修改 `core/task-dir-parser.mjs` 的持久行为，但 tasks.md 未要求更新持久测试。现有 `core/__tests__/task-dir-parser.test.mjs:24-26` 仍断言缺失 config 时 fallback 到 `~/Knowledge/workflowhub/`，与新 fail-loud 要求冲突。


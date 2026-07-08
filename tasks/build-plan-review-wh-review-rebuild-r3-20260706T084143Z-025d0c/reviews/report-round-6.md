# 审查报告 — build-plan-review-wh-review-rebuild-r3-20260706T084143Z-025d0c (round 6)

- verdict: revise_required
- provenance: single-context

## Summary

本轮仍有4个阻断项：runner 默认路径仍被写死到本机目录；端到端 smoke gate 引用了未建模的测试文件；5 个 stage 对 `docs/human-brief-template.md` 的回归保护没有落到任务/验证；Scope Boundary gate 没覆盖必须修改的 3rd-review 独立仓库。

## Findings

- [blocking] 位置: specs/wh-review-rebuild/tasks.md:56 | 问题: T010a把默认 runner 直接写死为 `/Users/Hugh/Hugh/Project/3rd-review/scripts/run-heterologous-review.mjs`，和 spec 的 Runner 发现契约冲突。spec 明确要求不得硬编码调用方本机绝对路径，默认值应是 `run-heterologous-review.mjs` 并按仓库约定路径解析。 | 建议: 把 T010a 和对应 plan 文案改成：优先 `THIRD_REVIEW_RUNNER`，未设置时仅使用 canonical 默认名 `run-heterologous-review.mjs` 并通过仓库定位规则解析；不要出现用户本机绝对路径。
- [blocking] 位置: specs/wh-review-rebuild/plan.md:231 | 问题: Phase 3 的 gate_cmd 依赖 `specs/wh-review-rebuild/__tests__/test-plan-smoke.test.mjs`，但本 phase 的 Files 只列了 `round-state.mjs` 和 `test-plan.md`，tasks.md 也没有任何任务创建这个测试文件。 | 建议: 新增明确任务和文件条目创建 `specs/wh-review-rebuild/__tests__/test-plan-smoke.test.mjs`，并把它绑定到 T025 或单独任务，同时在 Files 清单中列出。
- [blocking] 位置: specs/wh-review-rebuild/tasks.md:68 | 问题: FR-STAGE-001/AC7-1/AC7-2 要求 5 个 stage 的收尾都继续统一调用 `docs/human-brief-template.md`，但 T019-T023 只覆盖 wh-review 迁移、D2 门和 route-decision 命中，Checkpoint 也没有任何 gate 明确检查五个 SKILL.md 仍保留该引用。 | 建议: 为 FR-STAGE-001 单独补任务或把 T019-T023 扩充为显式保留 `docs/human-brief-template.md`，并新增 gate_cmd 对 5 个 SKILL.md 逐一 grep 校验。
- [blocking] 位置: specs/wh-review-rebuild/plan.md:236 | 问题: Scope Boundary 校验脚本只对当前 workflowhub 仓库执行 `git diff --name-only`，完全不覆盖计划内必须修改的 `/Users/Hugh/Hugh/Project/3rd-review/` 独立仓库。 | 建议: 把 3rd-review 仓库纳入单独的 scope/impact gate，至少显式检查该仓库允许修改的文件白名单，并把两仓库结果一起作为边界验证输出。

## Checks

审查维度覆盖：方向、盲点、细节
- 维度[方向]：已覆盖
- 维度[盲点]：已覆盖
- 维度[细节]：已覆盖

## Required Revisions

降级理由：(未提供，需补充)
- 必须修复：T010a把默认 runner 直接写死为 `/Users/Hugh/Hugh/Project/3rd-review/scripts/run-heterologous-review.mjs`，和 spec 的 Runner 发现契约冲突。spec 明确要求不得硬编码调用方本机绝对路径，默认值应是 `run-heterologous-review.mjs` 并按仓库约定路径解析。
- 必须修复：Phase 3 的 gate_cmd 依赖 `specs/wh-review-rebuild/__tests__/test-plan-smoke.test.mjs`，但本 phase 的 Files 只列了 `round-state.mjs` 和 `test-plan.md`，tasks.md 也没有任何任务创建这个测试文件。
- 必须修复：FR-STAGE-001/AC7-1/AC7-2 要求 5 个 stage 的收尾都继续统一调用 `docs/human-brief-template.md`，但 T019-T023 只覆盖 wh-review 迁移、D2 门和 route-decision 命中，Checkpoint 也没有任何 gate 明确检查五个 SKILL.md 仍保留该引用。
- 必须修复：Scope Boundary 校验脚本只对当前 workflowhub 仓库执行 `git diff --name-only`，完全不覆盖计划内必须修改的 `/Users/Hugh/Hugh/Project/3rd-review/` 独立仓库。


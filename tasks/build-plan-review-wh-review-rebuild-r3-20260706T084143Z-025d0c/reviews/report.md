# 审查报告 — build-plan-review-wh-review-rebuild-r3-20260706T084143Z-025d0c (round 9)

- verdict: revise_required
- provenance: single-context

## Summary

三条主链还没收紧：5 stage 统一收尾模板没有可执行验证，runner 默认入口仍写死本机绝对路径，现有 CLI/JSON 接口改动缺少 SIG 基线；另外 Stage 3 冒烟 gate 依赖未建文件，导致测试验证链不可执行。

## Findings

- [blocking] 位置: specs/wh-review-rebuild/tasks.md:68 | 问题: FR-STAGE-001 的回归保护链断了。T019-T023 只覆盖把 5 个 stage 迁移到 wh-review 和 D2 门，但没有任何任务或 gate_cmd 明确检查 spec 要求的 `docs/human-brief-template.md` 统一调用与产物结构（spec.md AC7-1/AC7-2、AC-D6）。当前 checkpoints 只验 D2 门和 route-decision，无法证明这条既有红线没有被接入改动破坏。 | 建议: 给 5 个 stage 补一条显式任务或把 T019-T023 扩展为双目标任务；同时增加可执行验证：逐一 grep 5 个 `workflows/*/SKILL.md` 的 `docs/human-brief-template.md` 引用，并补至少 1 条运行时断言验证生成产物仍符合该模板结构。
- [blocking] 位置: specs/wh-review-rebuild/tasks.md:56 | 问题: T010a 把默认 runner 解析写死成 `/Users/Hugh/Hugh/Project/3rd-review/scripts/run-heterologous-review.mjs`，直接违反 spec.md FR-THIRDREVIEW-001 的“不得硬编码调用方本机的 runner 绝对路径”和 plan.md 的 portability 约束。按现在计划执行，换一台机器或 CI 环境就会失效。 | 建议: 把默认入口改成仓库可发现规则而不是本机绝对路径，并在 plan/tasks 中写清发现顺序、失败语义和验证方式；如果必须依赖外部仓库位置，需定义可移植的配置源或显式前置条件，而不是硬编码用户本机路径。
- [blocking] 位置: specs/wh-review-rebuild/plan.md:173 | 问题: 计划要改现有 CLI/runner/审查入口和多份机器可读 JSON 契约，但没有任何 `SIG-xxx` 形式的 Existing Interface Signature Anchor。受影响的现有接口至少包括 `run-heterologous-review.mjs`、`standalone.sh`、`route-review.mjs`、以及 stage 收尾调用入口；按 reviewer contract，这类改动若没有先登记当前签名基线，实施时会失去可核对的边界。 | 建议: 在 plan.md 增加 Existing Interface Signature Anchor 段，逐项冻结当前签名/参数/输出：如 `SIG-3RD-RUNNER-001`（`--diff/--output` 入口）、`SIG-3RD-STANDALONE-001`、`SIG-WH-ROUTE-001`、`SIG-WH-ROUNDSTATE-001`、`SIG-WH-HUMANCONFIRM-001`，并让对应任务显式引用这些 anchors。
- [blocking] 位置: specs/wh-review-rebuild/tasks.md:110 | 问题: Stage 3 的主验证命令依赖 `specs/wh-review-rebuild/__tests__/test-plan-smoke.test.mjs`，但 tasks 和 plan 的 Files/Tasks 都没有创建这份测试文件的任务；T025 只写 `test-plan.md` 文档。结果是 FR-TEST-001 的 gate_cmd 在计划层面不可执行，FR→task→verify 链断裂。 | 建议: 补一条显式任务创建 `specs/wh-review-rebuild/__tests__/test-plan-smoke.test.mjs`（或把 T025 扩展为文档+测试双产物并同步更新 Files 列表），让 gate_cmd 与任务产物一一对应；若不打算在该阶段落测试文件，就移除这个 gate_cmd 并改成可执行的替代验证。

## Checks

审查维度覆盖：方向、盲点、细节
- 维度[方向]：已覆盖
- 维度[盲点]：已覆盖
- 维度[细节]：已覆盖

## Required Revisions

降级理由：(未提供，需补充)
- 必须修复：FR-STAGE-001 的回归保护链断了。T019-T023 只覆盖把 5 个 stage 迁移到 wh-review 和 D2 门，但没有任何任务或 gate_cmd 明确检查 spec 要求的 `docs/human-brief-template.md` 统一调用与产物结构（spec.md AC7-1/AC7-2、AC-D6）。当前 checkpoints 只验 D2 门和 route-decision，无法证明这条既有红线没有被接入改动破坏。
- 必须修复：T010a 把默认 runner 解析写死成 `/Users/Hugh/Hugh/Project/3rd-review/scripts/run-heterologous-review.mjs`，直接违反 spec.md FR-THIRDREVIEW-001 的“不得硬编码调用方本机的 runner 绝对路径”和 plan.md 的 portability 约束。按现在计划执行，换一台机器或 CI 环境就会失效。
- 必须修复：计划要改现有 CLI/runner/审查入口和多份机器可读 JSON 契约，但没有任何 `SIG-xxx` 形式的 Existing Interface Signature Anchor。受影响的现有接口至少包括 `run-heterologous-review.mjs`、`standalone.sh`、`route-review.mjs`、以及 stage 收尾调用入口；按 reviewer contract，这类改动若没有先登记当前签名基线，实施时会失去可核对的边界。
- 必须修复：Stage 3 的主验证命令依赖 `specs/wh-review-rebuild/__tests__/test-plan-smoke.test.mjs`，但 tasks 和 plan 的 Files/Tasks 都没有创建这份测试文件的任务；T025 只写 `test-plan.md` 文档。结果是 FR-TEST-001 的 gate_cmd 在计划层面不可执行，FR→task→verify 链断裂。


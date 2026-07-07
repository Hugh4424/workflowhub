# 审查报告 — build-plan-review-wh-review-rebuild-r3-20260706T084143Z-025d0c (round 5)

- verdict: revise_required
- provenance: single-context

## Summary

Round 4 的三个阻塞项已关闭：同源模式、落盘路径、D2 人工确认合同现在都已写清。当前仍卡在执行控制层：现有接口改动没做 SIG 锚定，Phase 3 缺少实际测试产物任务，且两个关键 gate_cmd 不能客观验收。

## Findings

- [blocking] 位置: specs/wh-review-rebuild/tasks.md:64 | 问题: 计划要改现有 CLI/runner 接口 `scripts/run-heterologous-review.mjs`、`scripts/route-review.mjs`、`standalone.sh`、`run-threat-auditor.mjs`，但 plan/tasks 没有任何 `SIG-xxx` Existing Interface Signature Anchor。按合同，这类改动必须先冻结当前签名，不能让实现阶段“到时再看”。 | 建议: 在 plan.md 增加 Existing Interface Signature Anchor 段，逐个记录被改现有脚本/CLI 的当前入口、参数、输出文件/schema、调用方；在 tasks.md 给对应任务挂上这些 SIG 引用。
- [blocking] 位置: specs/wh-review-rebuild/plan.md:231 | 问题: Phase 3 的主 gate 依赖 `specs/wh-review-rebuild/__tests__/test-plan-smoke.test.mjs`，但 Phase 3 Files 只列了 `round-state.mjs` 和 `test-plan.md`，tasks 里也没有创建这个测试文件的任务。结果是验证命令引用了未规划产物，`FR-TEST-001` 的可执行验证链断裂。 | 建议: 把 `specs/wh-review-rebuild/__tests__/test-plan-smoke.test.mjs` 明确加入 Phase 3 Files，并新增对应任务，说明它如何消费 `test-plan.md` 跑本地冒烟。
- [blocking] 位置: specs/wh-review-rebuild/tasks.md:118 | 问题: Scope Boundary 校验脚本只检查当前仓库 `git diff`，既覆盖不到计划中必须修改的跨仓库 3rd-review 文件，也会把计划内新增的 `workflows/build-code/__tests__/section7-machine-checkable.test.mjs` 误判为越界。这个 gate 不能客观证明 `T026`，属于假命令。 | 建议: 把范围校验拆成两段：一段检查 workflowhub 仓库允许改动清单，显式包含计划内新增测试文件；另一段单独检查 `/Users/Hugh/Hugh/Project/3rd-review/` 仓库的允许改动清单。两段都要以真实 exit code 判定。
- [blocking] 位置: specs/wh-review-rebuild/tasks.md:88 | 问题: `node /Users/Hugh/Hugh/Project/3rd-review/scripts/run-threat-auditor.mjs --test-fixture=semantic-compliant-with-keyword.json` 直接假定存在 `--test-fixture` 接口，但 plan/package 没给任何签名锚点或 help 来源证明这个 flag 真实存在。按 reviewer contract，这属于不可验证的 fake command。 | 建议: 改成 3rd-review 仓库里已存在的真实测试入口，或先在 SIG 锚点中冻结 `run-threat-auditor.mjs` 的可用 CLI 签名，再据此写 gate_cmd。

## Checks

审查维度覆盖：方向、盲点、细节
- 维度[方向]：已覆盖
- 维度[盲点]：已覆盖
- 维度[细节]：已覆盖

## Required Revisions

降级理由：(未提供，需补充)
- 必须修复：计划要改现有 CLI/runner 接口 `scripts/run-heterologous-review.mjs`、`scripts/route-review.mjs`、`standalone.sh`、`run-threat-auditor.mjs`，但 plan/tasks 没有任何 `SIG-xxx` Existing Interface Signature Anchor。按合同，这类改动必须先冻结当前签名，不能让实现阶段“到时再看”。
- 必须修复：Phase 3 的主 gate 依赖 `specs/wh-review-rebuild/__tests__/test-plan-smoke.test.mjs`，但 Phase 3 Files 只列了 `round-state.mjs` 和 `test-plan.md`，tasks 里也没有创建这个测试文件的任务。结果是验证命令引用了未规划产物，`FR-TEST-001` 的可执行验证链断裂。
- 必须修复：Scope Boundary 校验脚本只检查当前仓库 `git diff`，既覆盖不到计划中必须修改的跨仓库 3rd-review 文件，也会把计划内新增的 `workflows/build-code/__tests__/section7-machine-checkable.test.mjs` 误判为越界。这个 gate 不能客观证明 `T026`，属于假命令。
- 必须修复：`node /Users/Hugh/Hugh/Project/3rd-review/scripts/run-threat-auditor.mjs --test-fixture=semantic-compliant-with-keyword.json` 直接假定存在 `--test-fixture` 接口，但 plan/package 没给任何签名锚点或 help 来源证明这个 flag 真实存在。按 reviewer contract，这属于不可验证的 fake command。


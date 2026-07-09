# 审查报告 — build-plan-review-wh-review-rebuild-r3-20260706T084143Z-025d0c (round 1)

- verdict: revise_required
- provenance: single-context

## Summary

Round 1：3 个阻断问题。缺接口签名锚点、缺全量影响面反向扫描、端到端主验证命令引用了未规划生成的测试文件。

## Findings

- [blocking] 位置: specs/wh-review-rebuild/plan.md:186 | 问题: 计划会改动既有 CLI/脚本接口和 stage 收尾入口，但整份 plan/tasks 没有注册任何“Existing Interface Signature Anchor / SIG-xxx”基线。按审查合同，凡修改现有脚本、CLI、事件或 schema，必须先锚定当前签名；否则实现阶段无法客观判断是否破坏了 3rd-review runner、stage 调用约定、人工确认 artifact 等现有接口。 | 建议: 在 plan.md 增加显式 SIG 表，并为 `run-heterologous-review.mjs`、`route-review.mjs`、`standalone.sh`、5 个 stage 收尾入口、`human-confirmation-{stage}-{total_round}.json` 的当前输入/输出签名逐项登记；在 tasks.md 增加对应采集与回归校验任务。
- [blocking] 位置: specs/wh-review-rebuild/tasks.md:68 | 问题: 变更面覆盖不完整。spec 明确要求把所有直接按 `--checkpoint=<stage>` 调用 3rd-review 的代码迁移到 wh-review，但 tasks 只列了 5 个 stage `SKILL.md` 和少量已知 3rd-review 脚本，没有任何反向引用扫描任务去证明仓库内外不存在剩余调用点、旧 `--checkpoint` 透传、或其他受影响接口。Stage 3 的 Scope Boundary 脚本还只检查当前 workflowhub 仓库 diff，无法覆盖独立 3rd-review 仓库。 | 建议: 补一条强制性的 reverse-reference scan 任务和 Verify：至少对 workflowhub 与 3rd-review 两边执行 `rg` 扫描 `3rd-review`、`--checkpoint`、`run-heterologous-review`、`standalone.sh` 等引用，列出保留/迁移/删除结果；若有例外，逐项写明不迁移原因。
- [blocking] 位置: specs/wh-review-rebuild/plan.md:231 | 问题: Phase 3 把 `npx vitest run specs/wh-review-rebuild/__tests__/test-plan-smoke.test.mjs` 作为端到端冒烟 gate，但文件清单和 tasks 都没有创建这个测试文件的任务。当前计划写法下，FR-TEST-001 的主验证命令在执行时没有已规划产物可跑，验证链断裂。 | 建议: 二选一：1）把 `specs/wh-review-rebuild/__tests__/test-plan-smoke.test.mjs` 加入 Files 和 tasks.md，明确谁创建、依赖什么、验证什么；2）删除该 gate，改成 T025 明确产出的真实可执行命令，并在 plan/tasks 中逐项落地。

## Checks

审查维度覆盖：方向、盲点、细节
- 维度[方向]：已覆盖
- 维度[盲点]：已覆盖
- 维度[细节]：已覆盖

## Required Revisions

降级理由：(未提供，需补充)
- 必须修复：计划会改动既有 CLI/脚本接口和 stage 收尾入口，但整份 plan/tasks 没有注册任何“Existing Interface Signature Anchor / SIG-xxx”基线。按审查合同，凡修改现有脚本、CLI、事件或 schema，必须先锚定当前签名；否则实现阶段无法客观判断是否破坏了 3rd-review runner、stage 调用约定、人工确认 artifact 等现有接口。
- 必须修复：变更面覆盖不完整。spec 明确要求把所有直接按 `--checkpoint=<stage>` 调用 3rd-review 的代码迁移到 wh-review，但 tasks 只列了 5 个 stage `SKILL.md` 和少量已知 3rd-review 脚本，没有任何反向引用扫描任务去证明仓库内外不存在剩余调用点、旧 `--checkpoint` 透传、或其他受影响接口。Stage 3 的 Scope Boundary 脚本还只检查当前 workflowhub 仓库 diff，无法覆盖独立 3rd-review 仓库。
- 必须修复：Phase 3 把 `npx vitest run specs/wh-review-rebuild/__tests__/test-plan-smoke.test.mjs` 作为端到端冒烟 gate，但文件清单和 tasks 都没有创建这个测试文件的任务。当前计划写法下，FR-TEST-001 的主验证命令在执行时没有已规划产物可跑，验证链断裂。


# Research: wh-review-rebuild

**task_id**: `wh-review-rebuild`
**feature_desc**: 将 workflowhub 的异源审查机制重设计为两层架构——3rd-review 瘦身为纯审查引擎，wh-review 作为 workflowhub 专属调度层，解决审查完成状态不可追踪、报告未生成、stage 专属合同从未被路由的根本缺陷。

---

## 功能背景

workflowhub 现有 5 个 stage（make-decision/build-spec/build-plan/build-code/verify-code）各自直接调用 3rd-review 做异源审查。真根因：调用时均未传 `--checkpoint=<stage>` 标识，3rd-review 靠该前缀匹配路由到 stage 专属合同，标识为空导致匹配失败，回退到通用合同——`verifiers/vibecoding/` 下 11 套 stage 专属合同从未被实际路由使用。该 checkpoint 路由缺失 bug 已于 commit `e96c257` 修复，但不在本期范围内（decision-log D1 背景，spec.md §9 明确排除）。

同时，原版 agenthub 的 3rd-review 已实现的分轮全量/增量审查、成本降级、升级人工、报告渲染机制，迁移到 workflowhub 时全部丢失，退化成一次性通用审查、报告基本不生成、审查是否完成无法追踪。本期不修旧 bug，直接重设计为两层架构。

## 相关技术调研

1. **agenthub 参考实现（迁移蓝本）**：agenthub 仓库 `packages/core/agenthub/skills/3rd-review/scripts/render-review-report.mjs` 是报告渲染的既有实现，workflowhub 侧 `render-review-report.mjs` 需迁移/复用其 6 章报告结构与 `verifier-report-index.md` 索引列结构（seq/timestamp/stage/report_kind/verdict/report_path/summary）。
2. **3rd-review 独立仓库现状**：3rd-review 仓库（默认与 workflowhub 以兄弟目录形式并列检出于同一父目录下，见 spec.md FR-THIRDREVIEW-001「3rd-review 仓库根目录发现规则」）已有 `scripts/run-heterologous-review.mjs`、`scripts/run-threat-auditor.mjs`、`scripts/run-delegated-precheck.mjs`、`scripts/render-review-report.mjs`、根目录 `SKILL.md`、`verifiers/vibecoding/` 合同目录。本期需精简其 SKILL.md（剥离 stage/轮次知识）、删除 standalone.sh 的 revise 循环机制、加固 threatAuditor 语义判断（FR-THIRDREVIEW-004）。3rd-review 与 workflowhub 是两个独立仓库，跨仓库调用须走 `THIRD_REVIEW_RUNNER` 环境变量或约定默认路径，不得硬编码调用方本机绝对路径。
3. **workflowhub 侧可复用基础设施**：`core/task-dir-parser.mjs`（`parseTaskDir()`，环境变量优先于 yaml 配置，两者缺失 fail-loud）、`metrics/collector.mjs`（`recordSkeleton`/`updateOwnResult`，M4 十核心字段）、`docs/human-brief-template.md`（5 stage 收尾统一模板，已存在且现状合规，属回归保护项非新建项）。`skills/wh-review/` 目前不存在，需全新创建；`skills/3rd-review/` 在 workflowhub 仓库内也不存在——3rd-review 以独立仓库形式被跨仓库引用，精简改动实际落在 3rd-review 仓库而非本仓库内，需确认 build-plan/build-code 阶段的改动边界是否跨仓库执行（见风险点）。
4. **已有同类合同/技能模式**：仓库内 `skills/spec-plan/`、`skills/spec-tasks/` 等 sub-skill 已示范"kind: sub-skill"+ `templates/` 子目录的组织方式，wh-review 的 5 套专属合同（intake/design/plan/code/test-acceptance）可参照该目录结构组织到 `skills/wh-review/contracts/`。

## 已有实现参考

- 报告落盘路径约定：`tasks/{task-id}/reports/`，扁平命名 `<stage>--<round>[-pass|-revise|-escalated].md`，与 agenthub `tasks/{task}/reports/` 结构对齐（spec.md FR-WHREVIEW-001）。
- 轮次状态：三独立计数器（`heterologous_round`/`same_source_round`/`total_round`），落盘于 wh-review 自身状态文件，供 stop/escalate 规则机器审计（FR-WHREVIEW-003）。
- route-decision 记录：`tasks/{task-id}/reviews/route-decision-{stage}-{review_flow_id}.json`（round19 修复：路径按 stage+review_flow_id 隔离），八字段两阶段写入契约，在调用引擎前完成第一次写入（FR-WHREVIEW-002）。
- D2 人工确认门推进规则已在 decision-log 定案（build-spec/build-code 自动推进；make-decision/build-plan/verify-code 停在人工确认门）。

## 风险点摘要

1. **跨仓库改动边界**：3rd-review 精简（FR-THIRDREVIEW-001~004）物理上需要改动 3rd-review 仓库（默认与 workflowhub 以兄弟目录形式并列检出）文件，而本次 build-plan 的 cwd 限定在 workflowhub worktree 内——plan.md 需明确标注哪些任务发生在 3rd-review 仓库、哪些在 workflowhub 仓库，避免 build-code 阶段越界或漏做。
2. **搬迁后合同质量偏弱**：spec.md §2 边界已注明"搬迁 agenthub verifiers/vibecoding 5 套 stage 专属合同后初版质量可能偏弱需适配，适配点在 build-plan 阶段确认"——本 research 未做深入合同内容审查，适配细节留给 plan.md 的 Known Gaps 处理。
3. **§7 改写的机器可检验规则较严格**（FR-THIRDREVIEW-002）：不仅要删 numbered step/if-else，还要避免中英文步骤词等价表述，实现时需二次自查，遗漏容易被判不通过。
4. **测试方案端到端可跑通要求（D7/FR-TEST-001）**：需要 wh-review + 精简后 3rd-review 组合在无人工干预下可本地复现至少一个完整 stage 调用链，plan.md 与 tasks.md 需为此单列任务而非隐含在实现步骤里。

## skip_reason

无跳过；本 research 基于 spec.md、decision-log.md 与现有代码库结构调研产出，未调用额外的 spec-research 自动化子流程（当前环境无该子流程可执行入口），以人工调研方式完成等价产出。

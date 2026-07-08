# ADR 0001 — 审查层两层架构：3rd-review 瘦身 + wh-review 新建

**状态**：已采纳（2026-07-05）
**决策人**：用户（志鹏）明确确认，非 foreman 自行拍板

---

## 背景

workflowhub 的 5 个 stage（make-decision / build-spec / build-plan / build-code / verify-code）调用 3rd-review 做异源审查时，均未传 `--checkpoint=<stage>` 标识。3rd-review 靠该前缀匹配路由到 stage 专属合同，标识永远为空导致匹配失败，退回到通用合同。挂在 `verifiers/vibecoding/` 下的 11 份 stage 专属合同从未被路由使用。

同时，原版 agenthub 的 3rd-review 已实现的分轮全量/增量审查、成本降级、升级人工、报告渲染机制，迁移到 workflowhub 时全部丢失，退化为一次性通用审查——审查有没有审完不知道、审查报告基本没生成过、审查质量无法保证。

真根因不是路由参数漏传（该 bug 已由 commit e96c257 独立修复），而是架构层面：3rd-review 承载了与 workflowhub 强耦合的 stage 专属知识，却被作为通用技能调用，导致路由机制、专属合同、报告渲染全部失效。本任务选择直接重设计，而非修旧 bug。

---

## 决策

采用两层架构：

**第一层：3rd-review（瘦身，全局通用）**

- 职责：纯异源审查引擎，不含任何 stage 或轮次知识
- 接口输入：`{mode, contract, materials}`
- 接口输出：`{verdict, findings, actual_mode}`
- 做环境探测、派审查 agent、返回结果，可独立复用于任意项目

**第二层：wh-review（新建，workflowhub 专属）**

- 职责：承接原来挂在 3rd-review 下的全部 workflowhub 专属知识
- 包含：stage→合同映射、5 套 stage 专属合同（make-decision←intake / build-spec←design / build-plan←plan / build-code←code / verify-code←test-acceptance）
- 包含：轮次状态管理、降级/升级大脑（第1轮全量异源→第2轮起增量 Delta Package+降级→最多3轮后强制转同源→连续3轮大量 blocking 升级人工）
- 包含：报告模板 + 渲染脚本（移植 render-review-report.mjs，6章结构，落盘任务目录）
- 裁决枚举：pass / revise_required / escalate_to_human

---

## 权衡

选择两层架构而非继续在 3rd-review 内扩展的理由：

- 3rd-review 设计目标是全局通用、可跨项目复用；掺入 workflowhub 专属 stage 映射会破坏其复用性
- workflowhub 的 stage 专属合同、降级逻辑、报告模板属于领域知识，不应混入通用审查引擎
- 两层分离后，接口边界清晰（findings schema / verdict 枚举 / mode 取值由两层共同约定），各自可独立演化

选择直接重设计而非修复旧架构的理由：

- 旧架构中 stage 专属知识零散分布（11份合同从未被路由），没有统一入口，修补成本等同重写
- 报告渲染、降级升级机制在迁移时已全部丢失，没有可靠基准可修

---

## 后果

1. **后续 stage SKILL.md 需改造调用方式**：5 个 stage 从直接调用 3rd-review 改为调用 wh-review，wh-review 内部再调用 3rd-review。
2. **5 套专属合同需迁移**：从 agenthub `verifiers/vibecoding/` 搬移到 wh-review，并按 D4/D5 补强判据（intake C1-C6 / verify-code F1-F6）。
3. **3rd-review 需清理**：移除所有 workflowhub 专属逻辑，保留纯审查引擎接口。
4. **接口 schema 需对齐**：findings schema / verdict 枚举 / mode 取值，两层实现阶段须显式约定并对齐。
5. **自动推进范围限定**：只有 build-spec / build-code 两个 stage 的 pass 自动推进下一 stage；其余 3 个 stage 靠人工确认后推进（D2）。

# 质量事实契约 — wh-review-rebuild

**build-spec 阶段**
**任务 ID**: wh-review-rebuild
**日期**: 2026-07-06

---

## 1. Spec-Purity 自检结果（7条）

| 编号 | 检查项 | 结果 | 说明 |
|---|---|---|---|
| P1 | spec-ladder 档位已声明且有依据 | pass | 首行：C 档，理由含三项边界改动 |
| P2 | 所有 FR 符合 `FR-{DOMAIN}-NNN` 格式 | pass | 10 条 FR 全部符合（见 FR-ID 列表） |
| P3 | 每个 FR 至少有一条 Given/When/Then 场景 | pass | grep 命中 57 处 Given/When/Then |
| P4 | 五章硬门完整（速读卡/FR/不做/验收/影响范围） | pass | 5 章均存在 |
| P5 | spec↔decision-log 覆盖率（FR-ALIGN-001） | pass | D1–D7 + §7改写 + 降级 + 报告渲染共10条KEEP，全部有对应FR（见checklists/requirements.md） |
| P6 | 无 `[NEEDS CLARIFICATION]` 残留 | pass | grep 命中 0 处 |
| P7 | Known Gaps 段存在 | pass | spec.md 末尾 Known Gaps 段含 5 条（含 spec-clarify 补充 GAP-4/GAP-5） |

**Spec-Purity 综合结论**: **pass（7/7）**

---

## 2. Spec-Purity grep（FR-SELFCHECK-002）

针对 spec.md 的模式检查：

| 检查 | 结果 |
|---|---|
| 无 `speckit-*` 脚本调用 | pass |
| 无 `.specify/` 目录引用 | pass |
| 无 `git checkout`/`git branch` 操作 | pass |
| 无 `[NEEDS CLARIFICATION]` 残留 | pass |
| FR 格式合规（FR-{DOMAIN}-NNN） | pass（10/10） |

---

## 3. 独立审查摘要（item 3）

**状态**: 待执行（auto-advance 步骤 7 的 3rd-review 异源审查尚未运行）

本步骤将在 Step 7（auto-advance on independent review pass）执行时填写。
占位内容：verdict=unknown，reason=review not yet executed at quality-contract draft time。

---

## 4. 未解风险（item 4）

| 编号 | 描述 | 阻断? | 处置 |
|---|---|---|---|
| OPEN-1 | 3rd-review standalone.sh 调用参数与 SKILL.md 不一致（`--engine`/`--output`/返回结构） | 否 | build-plan 阶段创建 tracking issue |
| GAP-1 | 5 套合同从 agenthub 搬迁后 workflowhub 数据结构适配点未知 | 否 | build-plan 阶段核实 |
| GAP-2 | render-review-report.mjs 6章结构名称未在 decision-log 中明确列出 | 否 | build-plan 核实 agenthub 原实现 |
| GAP-3 | `docs/human-brief-template.md` 是否已存在未确认 | 否 | build-plan 前置依赖核查 |
| GAP-4 | 降级触发"大量 blocking"数值阈值未定义 | 否 | build-plan 阶段定义具体数值 |
| GAP-5 | 同源切换 vs 升级人工两条规则同时触发时优先级未明确 | 否 | build-plan 在 wh-review SKILL.md 中定义 |
| F10-W1 | wh-review 新层引入长期维护成本（stage合同变更需同步更新映射表） | 否 | C档已承认；建议映射表设计为可配置 |

---

## 5. 整体质量结论

spec 经过 spec-specify → spec-clarify（10维扫描，发现 GAP-4/GAP-5，均非阻断）→ 7条自检（全pass）→ F10门控（已执行，见 f10-gate.md）→ 宪法检查（21条，见 constitution-check.md）→ baseline对比（见 baseline-report.md）。

独立审查（3rd-review）结果为 unknown（审查未完成），按 Step 7 规则：**不自动推进，needs_human=true，等待人工决策是否继续**。

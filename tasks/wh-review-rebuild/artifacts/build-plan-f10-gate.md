# F10 Anti-Over-Engineering Gate — wh-review-rebuild（build-plan 阶段）

**执行阶段**: build-plan Step 7（spec-plan/spec-tasks 完成后，plan-reviewer 之前）
**日期**: 2026-07-06

> F10 门控为非阻断性分析；答不全、Q1 答"没有具体的"、或 Q4 答"高且持续"的机制须从 plan.md/tasks.md 删除。
> 本轮走查覆盖 plan.md/tasks.md 中出现的全部新增机制/脚本/gate，比 build-spec 阶段的 spec 级走查（build-spec-f10-gate.md）更细，落到具体文件粒度。

---

## 分析对象

plan.md/tasks.md 中新引入或新落地的机制清单：

1. `route-decision.json`（记录型文件，wh-review 路由裁决记录）
2. `round-state.mjs`（轮次状态机：heterologous_round/same_source_round/total_round/mode）
3. `report-index.md` 索引（迁移自 agenthub `verifier-report-index.md`）
4. D2 人工确认门（make-decision/build-plan/verify-code 三个 stage 的 pass 后停等人工确认）
5. `render-review-report.mjs`（迁移自 3rd-review 仓库既有脚本，裁决→文件名后缀映射）
6. metrics 接入（`recordSkeleton`/`updateOwnResult` 写入既有 `metrics/collector.mjs`）
7. 5 stage 收尾统一回归校验（复用既有 `docs/human-brief-template.md`，非新建模板）
8. `human-confirmation.mjs`（生成/读取 `tasks/{task-id}/reviews/human-confirmation-{stage}-{total_round}.json` 人工确认 artifact，供 D2 门与 orchestrator 重启恢复共用）

---

## Q1：防御什么真实威胁？

| 机制 | 真实威胁 | 评估 |
|---|---|---|
| route-decision.json | 审查完成状态不可追踪、专属合同从未被路由验证 | 具体威胁明确 |
| round-state.mjs | 无法判断何时降级/升级人工，导致连续大量轮次失控 | 具体威胁明确 |
| report-index.md | 审查报告基本未生成、无法追溯历史（spec.md §7.3） | 具体威胁明确 |
| D2 人工确认门 | pass 结果自动推进，人工失去在关键节点介入的机会 | 具体威胁明确 |
| render-review-report.mjs | 裁决结果与文件命名脱节，报告无法按裁决检索 | 具体威胁明确 |
| metrics 接入 | wh-review 轮次/耗时/升级信息不进入统一指标体系，跨任务无法比较 | 具体威胁明确 |
| 5 stage 收尾统一回归校验 | 5 个 stage 收尾逻辑各自为政（如 D6 决策来源不一致） | 具体威胁明确 |
| human-confirmation.mjs | orchestrator 重启后无法判断是否已停在 D2 确认门，可能重复推进或错误跳过人工确认 | 具体威胁明确 |

**结论 Q1**：全部机制均能明确回答"防什么"，无"没有具体的"情形。

---

## Q2：现有机制是否已覆盖？

| 机制 | 现有覆盖情况 | 评估 |
|---|---|---|
| route-decision.json | 现有 3rd-review 无路由记录机制 | 未覆盖，需新建 |
| round-state.mjs | 现有无轮次状态管理 | 未覆盖，需新建 |
| report-index.md | agenthub 已有等价实现 `verifier-report-index.md` | 迁移复用，非新造 |
| D2 人工确认门 | 现有各 stage 无统一人工确认机制 | 未覆盖，需统一新建 |
| render-review-report.mjs | 3rd-review 仓库已有该脚本 | 迁移适配，非新造 |
| metrics 接入 | 复用既有 `metrics/collector.mjs` 的 `recordSkeleton`/`updateOwnResult` 接口 | 接入已有底座，不新建指标系统 |
| 5 stage 收尾统一回归校验 | 复用既有 `docs/human-brief-template.md` | 回归校验现状，非新建模板 |

**结论 Q2**：7 项中 3 项（report-index.md、render-review-report.mjs、5 stage 收尾模板）是迁移/复用/回归校验，非重新造轮子；仅 3 项（route-decision.json、round-state.mjs、D2 门）是真正新建，且均填补明确空白，metrics 接入是接入既有底座。无重复建设。

---

## Q3：能否被绕过（安全剧场风险）？

| 机制 | 可绕过路径 | 评估 |
|---|---|---|
| route-decision.json | 实现者可跳过写入 | 风险低：属"记录采集类"gate，不因写入失败而阻断（Q2 宪法判据），且 AC2-2/AC2-3 提供静态可查验收条件 |
| round-state.mjs | 实现者可不正确递增轮次字段 | 风险中：AC3-1~AC3-3 提供字段类型/升级条件的机器可查验收标准，verify-code 阶段可捕获 |
| report-index.md | 可不追加索引 | 风险低：迁移自 agenthub 现成实现，行为已验证 |
| D2 人工确认门 | 实现者可省略挂起逻辑，让 pass 直接自动推进 | 风险中：AC-D5/AC-D6/AC8-4 提供机器可查验收条件（pass 分支无自动推进逻辑、orchestrator 重启后仍停在确认门），verify-code 阶段可捕获 |
| render-review-report.mjs | 可不做后缀映射 | 风险低：迁移既有脚本，逻辑已在 3rd-review 仓库验证过 |
| metrics 接入 | 可不接入或接错字段 | 风险低：AC-METRICS-1/2 提供验收标准 |
| 5 stage 收尾统一回归校验 | 可引入自定义收尾逻辑而非复用模板 | 风险低：AC8-1~AC8-3 要求逐一核实是否仍统一调用 human-brief-template.md，不符即失败 |

**结论 Q3**：D2 人工确认门与 round-state.mjs 存在被实现者省略/简化实现的中等风险，但均已有对应机器可查的 AC（AC-D5/AC-D6/AC8-4、AC3-1~AC3-3）在 verify-code 阶段兜底，不构成安全剧场。其余机制风险低。

---

## Q4：长期维护成本？

| 机制 | 维护成本 | 评估 |
|---|---|---|
| route-decision.json | 5 套合同每次判据变更需同步更新映射 | 中等，非"高且持续"（已在 build-spec F10-W1 记录建议：合同映射表可配置） |
| round-state.mjs | 降级阈值参数（3轮/blocking≥3）需人工维护 | 低，参数集中一处 |
| report-index.md | 索引格式跟随现有 agenthub 约定，几乎零维护 | 低 |
| D2 人工确认门 | 确认逻辑固定针对 3 个 stage，不随需求频繁变化 | 低 |
| render-review-report.mjs | 裁决枚举固定为 3 类，映射规则稳定 | 低 |
| metrics 接入 | 依附既有 `metrics/collector.mjs` 契约，字段变更时同步即可 | 低 |
| 5 stage 收尾统一回归校验 | 仅为静态回归检查，无新增运行时逻辑 | 低（成本趋近于零） |

**结论 Q4**：7 项机制的维护成本均为低或中等，无一项落在"高且持续"区间。route-decision.json 的合同映射维护成本中等，已在 build-spec 阶段 F10-W1 记录为质量契约 item，build-code 阶段沿用该建议（映射表设计为可配置）即可，不构成新的阻断项。

---

## 综合结论

Q1 全部机制均有具体威胁描述，Q2 无重复建设（3 项复用迁移、3 项填补空白、1 项接入既有底座），Q3 风险项（D2 门、round-state.mjs）已由机器可查 AC 兜底，Q4 全部机制维护成本为低/中等、无"高且持续"项。

**F10 门控结论（build-plan 阶段）**：**无需从 plan.md/tasks.md 删除任何机制**。7 项走查对象全部通过四问检验，与 build-spec 阶段 F10 走查结论（build-spec-f10-gate.md）一致——本轮细化到脚本/文件粒度未发现新的过度设计信号。route-decision.json 合同映射表可配置化建议（F10-W1）继续沿用，供 build-code 阶段参考，不阻断 build-plan 推进。

**是否需要重跑 Step 2-4（spec-plan/spec-tasks/spec-analyze）**：不需要。本轮 F10 走查未对 plan.md/tasks.md 做任何删减或实质性改动，三份产物的交叉一致性状态与 Step 4（本阶段 spec-analyze，见 build-plan-cross-artifact-analysis.md）扫描时一致，无需重跑。

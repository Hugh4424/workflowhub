# S1 内部调研摘要 — M13b build-spec 深化

> mode: inline_serial（Multica 单 agent 运行时，避免后台子代理孤儿；SKILL S1 fallback）
> task-id: m13b-build-spec-deepening ｜ scope: full ｜ 日期: 2026-06-30

## 切片①：问题域背景

build-spec 当前是 M11 交付的 v1：spec-specify → spec-clarify → 宪法检查(F1–F10) → baseline 对照 → F10 反过度工程门 → 人工审查。
缺三类质量能力：(a) 无范围分档（大小需求一刀切，漏判高危）；(b) 无 spec 自检（placeholder/矛盾/歧义/越界混入不被发现）；(c) 无 spec 与 decision-log 对齐校验（方向漂移无门）。另缺独立审查视角和跨 stage handoff 契约（stage 间靠隐式上下文，成本高）。

## 切片②：历史先例

- M0 已迁入 `skills/scope-triage/SKILL.md`（自研，纯判定逻辑，黑名单 auth/permission/route/gate/feature flag，命中强制 full）——可直接复用。
- M0 `grill-with-docs-lite`（外部改造薄壳，交互逐条质询，写边界回 spec/decision-log）——P0-2 取其「逼边界」内核但改非交互自动扫描。
- M11/M12/M13 先例：均走完整五 stage 自举 + M10 baseline 对照 + 异源 3rd-review + 人工审查检查点。M13b 应沿用此节奏。
- M13b 上一轮已产出 scope-decision.md（8 项全做 + 5 开放问题），本轮 make-decision 正式跑 S0→S10 复核并落 decision-log。

## 切片③：代码现状

- `skills/` 已有：decision-log, scope-triage, spec-analyze, spec-clarify, spec-plan, spec-specify, spec-tasks。
- 缺：`skills/spec-scope-triage/`、`skills/spec-reviewer/`（P0-1/P1-1 需新建或适配）。
- `workflows/build-spec/SKILL.md`：无 scope-triage 步、无自检步、无 alignment 步、无 handoff 写回、无独立审查。
- `specs/` 下有 archive / m12 / m13 handoff 目录；M13b 需定义 `handoff/latest.json` 契约。
- metrics_path = `~/.workflowhub/metrics/global-metrics.jsonl`，collector recordSkeleton/updateOwnResult 可用。

## 切片④：外部最佳实践

- spec-kit 系（spec-clarify/spec-analyze）已提供歧义扫描 + 跨工件一致性思路——P0-2 自检与 P0-3 对齐可借其判定骨架，去掉外部全文注入。
- handoff/contract 模式（窄引用 + required_reads[]）是降低 stage 间上下文成本的标准做法；M13b-M13e 共用成本契约已定最小字段集。
- 独立审查需 fresh 上下文 + 异源（Q3）；spec-reviewer 应是独立子代理，结论仅参考不阻断（Q1）。

## 切片⑤：已知风险

- R1 自检/对齐/审查若做成阻断门 → 违宪 F3/Q1（记事实不阻断红线）。设计须「浮现事实、不卡推进」。
- R2 spec-reviewer 同源运行 → 违 Q3（自审自判）。须独立上下文。
- R3 handoff 字段过设计 → 违 F8（简单优先）。最小必填子集即可，下游字段留空占位。
- R4 spec-scope-triage 黑名单照搬 vs spec 域扩展未定 → 影响强制 full 行为（见开放问题）。
- R5 自检落地形态（独立 skill vs 内联）未定 → 影响薄核心 F1。

## 调研结论

M13b 范围清晰、先例充分、复用源就位（scope-triage 已在库）。核心张力全在「新增检查如何记事实而不阻断」+「独立审查如何保异源」。无需外部技术调研即可决策，但有 5 个设计细节需用户拍板（已在 scope-decision.md OQ-1~OQ-5）。

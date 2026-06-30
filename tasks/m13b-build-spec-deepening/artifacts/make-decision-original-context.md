# 原始需求与初始上下文 — M13b build-spec 深化（v3，A/B 已决）

> 台账渲染点①（最终）｜ task-id: m13b-build-spec-deepening ｜ 落盘: 2026-06-30
> v1 8 项台账已作废（工头改方向）；v2 浮现宪法冲突待 A/B；**v3：Hugh 已拍板 option A（合宪改造版），冲突解决**。S5 盲审依赖本文件。

## 原始需求（原文）

工头改方向（Multica ZHI-16，2026-06-30）：

> M13b 真正的核心目标：把 agenthub design 阶段的质量保障体系（gate.sh exit 门、3rd-review 强制审查、Spec-Purity 纯净度预检、7 条自检清单、journal/evidence 留痕、stage_advance 关、workflow-feedback 记录）移植到 workflowhub 的 `workflows/build-spec/SKILL.md` 里。原来那 8 个 P0-P2 条目变成这个框架下的细节，不再是核心。
>
> 同时并入：1) 新增 `TASK_TRACKING_ROOT` 全局环境变量，控制任务跟踪文件存放路径（不存 repo，默认 `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/`）；2) 现在做 5 个外部框架调研（cursor/plugins、affaan-m/ECC、EveryInc/compound-engineering-plugin、mattpocock/skills、obra/superpowers），给 M13b/c/d/e 做技能地图。
>
> 参考源：`multica-agenthub/.../vibecoding/stages/design.md`

## 初始状态标注（含冲突浮现）

- agenthub design.md 已亲读：质保骨架是 3 道 blocking gate（stage_exit / post_review_pass / stage_advance）+ 异源审查 + spec-purity + 7 自检 + journal/evidence + feedback。【源已读】
- CONSTITUTION.md v1.1.0 已亲读：F4/F5/F10/Q1/Q2 明确禁止「阻断式质量门」；**F10 反例原文点名 agenthub 的 9.5 万行 gate 代码为永久警示**。【基准已读】
- **冲突浮现（不阻断，记事实）**：工头要「整体移植」的 7 机制里，3 道 blocking gate 直接违宪，照搬即推翻 workflowhub 立项根因。详见 `direction-constitution-crosscheck.md`。
- TASK_TRACKING_ROOT env var：宪法中性，可加，默认路径在 Knowledge 非 repo，符合「不存 repo」。
- 外部框架调研（5 框架技能地图）：独立大调研任务，非 make-decision 本职执行；建议工头另派或单列 stage。
- build-spec 现状：M11 v1，无 scope-triage/自检/对齐/独立审查/handoff；旧 8 项缺口仍真实存在，现降为新框架下细节。

## 用户决策记录

- talk#1（2026-06-30）：跳过 S3 外部调研；旧 8 项 P0-P2 全做。
- talk#2-redo A/B（2026-06-30，**已决**）：核心冲突——是否照搬 3 道 blocking gate？
  - **Hugh 拍板：选 A（合宪改造版）**。不照搬 blocking gate，改成「检查逻辑全保留 + 记事实 + 浮现边界 + 人确认推进，不阻断」。不走修宪路线（option B 否决）。

## 确认后的最终方向（S5 盲审对象）

把 agenthub design 质保体系移植进 `workflows/build-spec/SKILL.md`，分两类处置：

1. **5 机制合宪直搬**：异源审查（复用 3rd-review skill）、journal/evidence 留痕（复用 journal.jsonl + collector）、Spec-Purity grep 扫描、7 条自检清单、摩擦即记精神。全部「记事实 + 浮现，不阻断」。
2. **3 道 blocking gate 合宪改造**：stage_exit / post_review_pass / stage_advance 的检查逻辑全保留，但失败模式从「阻断推进」改成「记录 + 浮现边界 + 由人确认推进」（F4/F7 正解）。
3. **并入 TASK_TRACKING_ROOT 全局 env**：默认 `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/`，不存 repo。
4. **5 框架外部调研**：建议单列 stage / 工头另派，非 make-decision 本职，产出 M13b/c/d/e 技能地图。

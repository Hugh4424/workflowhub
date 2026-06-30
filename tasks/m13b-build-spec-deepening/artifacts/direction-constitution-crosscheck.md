# 新方向 × CONSTITUTION 交叉比对（grill 留痕）

> task-id: m13b-build-spec-deepening ｜ 2026-06-30
> 触发：工头改方向——把 agenthub design 阶段质保体系整体移植进 build-spec。
> 源：`multica-agenthub/.../vibecoding/stages/design.md`（已亲读）
> 基准：`workflowhub/CONSTITUTION.md` v1.1.0（已亲读）
> 性质：记事实不阻断，冲突浮现到边界让用户定。

## 核心发现

agenthub design.md 的质保骨架是 **blocking gate 机器**：`gate.sh stage_exit`（6 条没过不能进下一阶段）、`post_review_pass` BLOCK、`stage_advance` 关。
**这正是 workflowhub 生来要逃离的东西**——CONSTITUTION F10 反例原文点名："某前身系统为追求一切机器可自动校验，堆出约 9.5 万行 gate/校验代码……约一半代码提交都在修 gate 本身的死锁与漏洞"。该前身系统 = agenthub。

所以「整体移植」不能照搬，必须逐机制过宪法。

## 逐机制裁决

| # | agenthub 机制 | 合宪性 | 处置 |
|---|---|---|---|
| 1 | 退出检查门 gate.sh stage_exit（没过不能进） | **违 F4/F5/F10/Q2** | 不可照搬。改：6 条检查照跑，结果记事实+浮现边界，**不阻断**；推进由人确认（F7） |
| 2 | 强制异源审查 3rd-review | 审查动作**合宪**（Q3）；"才能 advance"的硬门**违 F4** | 保留异源审查（已有 3rd-review skill），但不做成 advance 硬门 |
| 3 | Spec-Purity grep 预检（不过不能提审） | grep 扫描**合宪**（F3 机器采集）；"不能提审"阻断**违 Q1** | 保留扫描，结果记事实，命中浮现给人，不阻断 |
| 4 | 7 条自检清单（全过才能触发审查） | 清单**合宪**；"才能触发"阻断味**违 Q1** | 保留自检，非阻断 |
| 5 | journal/evidence 留痕 | **完全合宪**（F6 统一外置执行记录） | 直接搬，已有 journal.jsonl + collector |
| 6 | stage_advance 关 post_review_pass | **违 F4/F5/F7/Q1** | 不可照搬。推进经人确认即可（F7），不要自动 gate |
| 7 | workflow-feedback 动态记录 | 记录**合宪**（F6）；但 roadmap 把反馈采集划给 M14/M15 | 留摩擦即记的精神，正式采集系统留 M14/M15，避免范围重叠 |

## 结论

- **可直接搬（合宪）**：异源审查动作、journal/evidence 留痕、spec-purity 扫描、7 条自检、摩擦即记精神 → 共 5 项。
- **必须改造（违宪，不可照搬）**：stage_exit 门、post_review_pass 门、stage_advance 门 → 3 道 blocking gate。照搬即违 F4/F5/F7/F10/Q1/Q2，且违 CLAUDE.md 硬规则「不引入会阻断推进的质量门」。
- 改造方向统一：**gate 的检查逻辑全保留 → 但从「阻断」改成「记事实 + 浮现边界 + 人确认推进」**。质量不降，只是失败模式从「隐藏造假」回到「可见遗漏」（F4 正解）。

## 需用户拍板

照搬 blocking gate = 推翻 workflowhub 立项根因，需走 CONSTITUTION governance 修宪（改 F4/F5/F10/Q1/Q2）。这是大决定，不能由 make-decision 默默执行。见 talk 问题 A/B。

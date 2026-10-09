---
name: spec-analyze
description: Report-only final consistency analysis from original requirements to current decision, spec, and cohort-specific plan/Phase materials.
---

# spec-analyze

只读一致性分析（lens-only / file_only），供阶段主会话收口与修复使用。它不写当前材料、不调用 provider，也不把分析结果当成继续工作的许可证。当前 profile 按下面分支取材料，细节见 [packet-lens.md](packet-lens.md)。

## 材料与责任

- make-decision：原始需求、当前 decision-log、Talk/Grill/审查及本次真实确认。确认前准备可审稿；确认后的阶段末核对依当前 workflow 执行，改变已确认决定才返回准备与真实选择。
- post build-plan：原始声明只读作来源；当前 decision-log、spec（产品与全局实现设计）、每个独立 Phase 与纯指针 index 是实际输入。历史 pre plan/tasks 只读，build-spec 不再是当前阶段。
- build-code：当前材料、实际实现、受影响测试与验收原件。没有实际结果就说明未执行/unknown，不由声明反推。
- build-prd：当前已确认方向、实际展示 PRD/任务地图与真实答复；只检查已产生的规划材料，不编实现验收。
- verify-code：实际代码质量由终末独立代码审查负责；本技能不增加一个 provider 审查点。

post build-plan 报告来源到当前材料的具体对应与差异事实，包括结构、引用、原需求遗漏线索和行为表述冲突；独立合并审查裁定需求语义与质量。reported 只表示本分析执行了，不表示语义一致或审查通过。

## 方法

1. 读取本分支实际存在的必要材料；缺必需材料报 material_incomplete 和影响。缺机器 packet、旧 source census 或认证 metadata 不等于缺实际材料。
2. 逐项读原始需求、真实答复及采用的来源，沿 source → 决定 → FR → AC → Phase/Task/消费者核实际落点；列出缺失、部分承接、矛盾、无源增量和显式排除/延期的出处。post build-plan 同时核依赖、唯一文件 owner、结构引用、index 到独立 Phase 的对应、重复正文、孤儿引用和遗漏的测试字段。每个差异引用双方原文与范围；编号出现或结构完整不证明业务覆盖。
3. 按当前分支对照实际结果；build-code 还读实际实现/代码入口、相关测试及执行原件，核 source → FR → AC → 实现/消费者/证据之间的缺口。规划分支只核已有设计落点，不编未来代码或执行结论。逐项保数量与范围限定、否定、顺序、产物形态、失败/取消/权限/范围边界和延期 owner/触发/交接；区分直接事实、推断与未检查。实现存在不证明 AC 行为通过，未读代码或未执行测试明确 unknown/not_run；独立质量裁决另行引用。
4. 每个 Phase/Task 核目标、来源、写集、实际消费者、测试层级/技能、场景/夹具、精确命令/预期退出、oracle、证据、覆盖、停止/恢复和完成条件。index 只检查权威引用/锚点/写集/依赖/消费者，不复制程序或保存执行状态。
5. 返回所有真实发现：材料/节或源码锚点、依据、具体问题、影响与最小修正。主会话在本任务修有效缺口，只复核受影响范围；改变已确认决定先完成可审稿再取得真实答复。未知或分析不可用保留原因，不写 consistent。
6. 在处置发现和最后一次相关改动后，报告当前实际分析结果。仅有依赖/manifest 声明不证明执行；无需身份 hash、snapshot、material revision、quality graph 认证或额外 publication 许可。

## 结束披露

报告以以下六类说明当前事实，名称只供解释，不新增必填字段或机器绑定：

1. `stage_work`：当前阶段实际做了什么。
2. `requirement_coverage`：当前来源→FR/AC→设计或实际实现的落点、差异、核对范围与未覆盖项；需求语义覆盖与质量结论引用独立审查。
3. `upstream_alignment`：上游原文、真实答复与当前结果的对齐依据及具体来源缺口；语义裁定引用独立审查。
4. `current_stage_repairs`：当前阶段当场修复了什么。
5. `remaining_risks`：剩余风险、未决与延期。
6. `next_stage_boundary`：下游可直接消费什么、不能自行猜什么。

只在实际检查范围内报告“未发现对应差异”，并列出读过的来源、材料/代码和未检查范围；需求语义及质量结论见独立审查。缺材料、不可用、不一致、严重未修事项都保持可见，不从普通报告推断质量通过、发布或 Git 交付。

创建或改写 agent 方法时，读取 `skills/spec-specify/SKILL.md` 的「技能写作规范（WR001）」唯一规范；保原步骤、条件、权限、失败强度和受保护字面，缺源如实 unavailable，不复制规范。

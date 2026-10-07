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

post build-plan 的报告只判断结构、引用与 index 对应，独立合并审查负责原需求遗漏和行为含义。reported 只表示本分析执行了，不表示语义一致或审查通过。

## 方法

1. 读取本分支实际存在的必要材料；缺必需材料报 material_incomplete 和影响。缺机器 packet、旧 source census 或认证 metadata 不等于缺实际材料。
2. post build-plan 检查 FR/AC、Phase/Task、依赖、唯一文件 owner、结构引用、索引到独立 Phase 的对应；找重复正文、孤儿引用和遗漏的测试字段。别用编号出现或结构完整代替业务语义覆盖。
3. 其它适用分支对照原始需求与当前结果，明确遗漏、矛盾、歧义、失败/取消/权限/范围边界、延期的 owner/触发与交接；资料和推断分开。结构结论与独立质量判断分开。
4. 每个 Phase/Task 核目标、来源、写集、实际消费者、测试层级/技能、场景/夹具、精确命令/预期退出、oracle、证据、覆盖、停止/恢复和完成条件。index 只检查权威引用/锚点/写集/依赖/消费者，不复制程序或保存执行状态。
5. 返回所有真实发现：材料/节或源码锚点、依据、具体问题、影响与最小修正。主会话在本任务修有效缺口，只复核受影响范围；改变已确认决定先完成可审稿再取得真实答复。未知或分析不可用保留原因，不写 consistent。
6. 在处置发现和最后一次相关改动后，报告当前实际分析结果。仅有依赖/manifest 声明不证明执行；无需身份 hash、snapshot、material revision、quality graph 认证或额外 publication 许可。

## 结束披露

报告以以下六类说明当前事实，名称只供解释，不新增必填字段或机器绑定：

1. `stage_work`：当前阶段实际做了什么。
2. `requirement_coverage`：当前材料的结构映射、核对范围与未覆盖项；post build-plan 的需求语义覆盖引用独立审查。
3. `upstream_alignment`：上游对齐依据及可见结构引用缺口；post build-plan 的语义结论引用独立审查。
4. `current_stage_repairs`：当前阶段当场修复了什么。
5. `remaining_risks`：剩余风险、未决与延期。
6. `next_stage_boundary`：下游可直接消费什么、不能自行猜什么。

post build-plan 没有结构缺口时写“未发现结构或引用缺口；需求语义结论见独立审查”。缺材料、不可用、不一致、严重未修事项都保持可见，不从普通报告推断质量通过、发布或 Git 交付。

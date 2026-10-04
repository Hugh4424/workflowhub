# spec-analyze 的材料分支

本文件只说明 SKILL.md 第一步何时读哪些当前材料；方法和结果边界以 SKILL.md 为唯一来源。

| 当前工作 | 最小读取材料 | 可报告范围 |
| --- | --- | --- |
| make-decision | 原始需求、decision-log、真实问答/Grill/审查、实际确认 | 当前决定及其来源/失败/范围一致性 |
| post build-plan | decision-log、spec、所有独立 Phase、纯指针 index | 结构、引用、依赖和索引对应；独立合并审查判断语义遗漏 |
| build-code | 当前材料、实现、实际测试和验收原件 | 实际结果、材料与实现缺口及覆盖限制 |
| build-prd | 已确认方向、实际 PRD/地图/展示与答复 | 已产规划材料的范围与真实选择 |

历史 pre 的 plan/tasks 或旧 packet 仅只读背景。实际当前必要材料不可读时是 material_incomplete；不要求 packet hash、快照绑定、旧认证结果或 quality/facts readback 才能分析。资料缺失、不一致和未执行如实交回主会话同任务修，不补猜、不自己改材料或调用 provider。

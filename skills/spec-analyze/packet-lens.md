# spec-analyze 的材料分支

本文件只说明 SKILL.md 第一步何时读哪些当前材料；方法和结果边界以 SKILL.md 为唯一来源。

| 当前工作 | 最小读取材料 | 可报告范围 |
| --- | --- | --- |
| make-decision | 原始需求、decision-log、真实问答/Grill/审查、实际确认 | 当前决定及其来源/失败/范围一致性 |
| post build-plan | 原始需求/真实答复与采用的来源、decision-log、spec、所有独立 Phase、纯指针 index | 来源→FR/AC→设计落点与遗漏/冲突事实、结构/依赖/索引；裁定归独立审查 |
| build-code | 当前材料、实现、实际测试和验收原件 | 实际结果、材料与实现缺口及覆盖限制 |
| build-prd | 已确认方向、实际 PRD/地图/展示与答复 | 已产规划材料的范围与真实选择 |

## 语义检查维度

读取 SKILL.md 的「方法」逐项核来源、数量与范围限定、否定、顺序、产物形态及失败边界，交回有双方原文锚点的对应/遗漏/冲突事实；build-code 另核实际实现、代码与执行原件，规划分支不编未来实现。独立审查负责语义与质量裁定。present ID 或 `reported` 不证明 source coverage 或 behavioral equivalence。本导航不另建检查方法或结果协议。

历史 pre 的 plan/tasks 或旧 packet 仅只读背景。实际当前必要材料不可读时是 material_incomplete；不要求 packet hash、快照绑定、旧认证结果或 quality/facts readback 才能分析。资料缺失、不一致和未执行如实交回主会话同任务修，不补猜、不自己改材料或调用 provider。

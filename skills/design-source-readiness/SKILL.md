---
name: design-source-readiness
description: 从本动作适用的项目专业来源派生 Screen Read Map，按类保留引用、缺项与人工确认事实。
version: 1.0.0
---

# Design Source Readiness

在 build-plan UI 规划或 build-prd 条件设计分支，沿 `skills/ui-project-init/SKILL.md` 的「规范职责」定位本动作适用的真实专业来源，整理 Screen Read Map，供 plan-design-review 使用。no score、no gate；不复制规范正文或增设设计权威。领域词义复用 GLOSSARY.md 或宿主既有词义源，设计/前端来源按该入口定位 specs/design/、specs/frontend/ 的适用内容或原位等价实质源；原 owner 与真实 consumer 保留。

## 方法

1. 沿上述职责入口，只读本动作适用类的真实路径、可读 version、section/page anchor、作用域、owner、consumer 与规则。跨控件通用规则读专业源，本次业务步骤、状态、权限、取消/恢复读当前 task spec/API；代码/API/token 精确事实留原源。缺来源、版本或冲突按类写 missing/unknown/stale、影响与原 owner 下一动作，单类缺口不吞其它适用类，不能由标题 slug 编造稳定 anchor。旧 Design.md/Experience.md 仅在其真实条款作为可信输入或历史引用时读取，不恢复为两份必需 active 源。
2. 对每个实际在范围内的页面/区块，写目标、主操作、状态、组件/token 来源、fixture、viewport、响应式/无障碍、Preview/截图路径，以及缺项和需人的决定。
3. **可引用性**：binding_state 对各适用类分别说明 bindable（来源可读且引用适用）、not_bindable（缺文件或引用冲突）、unknown（尚不能判断），依据该类来源/版本/作用域，不把一个 design_revision 当全部来源的身份。bindable 只证明可以引用，不证明视觉质量。已有规则 bound_current；规则需调整时 update_required，说明负责作者，不改规范正文。Screen Read Map 没有显式 anchor 时保留 `SCREEN-READ-MAP-ANCHOR-MISSING` 及缺项原因，不能把标题 slug 当稳定 anchor；这只说明引用缺口，不成为继续工作的 gate。
4. 沿现输出说明各适用类的 design_revision（该源人读版本）、binding_state、read_map、missing_items、freshness、实际 human_confirmation 或 N/A + reason；同时给实际路径/节、scope、owner/consumer 与受影响项。不新增 runtime shape、持久 binding 对象或统一版本门。没有真实 Preview、fixture 或截图就说明 unknown/unavailable；用户决定可以推进未依赖这些事实的工作，但不能把缺失说成通过。

## 边界

来源与 Read Map 用普通文件/节路径，不要求 content_sha256、snapshot 或 runtime 认证函数。本技能只读派生材料，不写 task 状态，不让机器身份包装成为使用来源的前置条件。真实 UI 范围和未核实处保持可见，交给现有文档审查和后续实现验证。

## 写作规范

创建或改写 agent 方法时，读取 `skills/spec-specify/SKILL.md` 的「技能写作规范（WR001）」唯一规范；此处不复制规范。

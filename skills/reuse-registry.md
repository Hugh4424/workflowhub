# 技能使用索引

从任务场景选技能，再读目标正文。登记事实（名称、版本、状态、来源与许可）以[catalog.yaml](catalog.yaml)为准；方法语义以目标正文为准，引用前先读取实际目标。两者冲突时，由本次变更owner核对真实consumer，在本次改动中修正错误的索引或登记；目标缺失或归属有争议时保留具体缺口交原owner，不把旧入口当可用路线。

## 阶段入口

| 名字 | 使用场景 | 正文入口 |
| --- | --- | --- |
| make-decision | 调研并确认方向。 | [读取正文](../workflows/make-decision/SKILL.md) |
| build-plan | 把已确认方向写成规格与独立Phase计划。 | [读取正文](../workflows/build-plan/SKILL.md) |
| build-code | 按当前Phase实施、验证和修复。 | [读取正文](../workflows/build-code/SKILL.md) |
| verify-code | 独立核实现、实际效果及剩余缺口；测试/检查/依赖升级读正文唯一可信度方法。 | [读取正文](../workflows/verify-code/SKILL.md) |
| build-prd | 整理已确认方向的产品表达与任务组PRD。 | [读取正文](../workflows/build-prd/SKILL.md) |

## 技能入口

| 名字 | 使用场景 | 正文入口 |
| --- | --- | --- |
| stage-reflection | 阶段结束发现实际过程问题，需要提出有来源的复盘改进候选。 | [读取正文](stage-reflection/SKILL.md) |
| stage-handoff | 阶段结束写人读交接，或接续时回读真实材料、事实与未完事项。 | [读取正文](stage-handoff/SKILL.md) |
| stage-closeout | 阶段交付后整理Git、图与收口事实；最终归档或删除按实际授权处理。 | [读取正文](stage-closeout/SKILL.md) |
| knowledge-graph | 开工查询领域与历史经验、定位影响，或按许可更新图。 | [读取正文](knowledge-graph/SKILL.md) |
| anysearch | 需要联网检索、核事实或读取外部页面。 | [读取正文](anysearch/SKILL.md) |
| decision-log | 把已确认方向写为唯一决策与需求记录。 | [读取正文](decision-log/SKILL.md) |
| deep-research | 方向仍有关键未知，需要深度调研与可回读来源。 | [读取正文](deep-research/SKILL.md) |
| grill-with-docs | 通过追问检验方案，并维护术语与架构决定。 | [读取正文](grill-with-docs/SKILL.md) |
| intake-decision-review | 只读审查问题界定、范围与可行性。 | [读取正文](intake-decision-review/SKILL.md) |
| simplicity-guard | 检查是否能删除、复用或用更小方案满足目标。 | [读取正文](simplicity-guard/SKILL.md) |
| talk-with-zhipeng | 需要用户决定方向、风险或范围，组织真实问答。 | [读取正文](talk-with-zhipeng/SKILL.md) |
| spec-prd | 把已确认方向写成任务组PRD与产品表达。 | [读取正文](spec-prd/SKILL.md) |
| spec-specify | 从已确认决定起草规格与全局实现设计骨架，或查技能写作规范。 | [读取正文](spec-specify/SKILL.md) |
| spec-clarify | 已有规格存在影响实施的歧义，需要澄清。 | [读取正文](spec-clarify/SKILL.md) |
| spec-plan | 把实现设计写入规格，拆成各自可交付的Phase。 | [读取正文](spec-plan/SKILL.md) |
| spec-analyze | 阶段结束核需求、材料、实现与证据是否一致。 | [读取正文](spec-analyze/SKILL.md) |
| architect-code-review | 审查实现的正确性、生命周期、接口消费者与测试强度。 | [读取正文](architect-code-review/SKILL.md) |
| workflowhub-host-protocol | 查当前会话如何执行五阶段、记录事实及说明完成边界。 | [读取正文](workflowhub-host-protocol/SKILL.md) |
| workflowhub-multica-sync | 明确要求核对或同步本机main与Multica的技能和agent配置。 | [读取正文](workflowhub-multica-sync/SKILL.md) |
| wh-review | 审查材料位/配置路线、ARTIFACT + CONTRACT、身份与覆盖/三条件结论；方法来源读catalog的N3 absorbed条目。 | [读取正文](wh-review/SKILL.md) |
| mini-task | 在独立任务工作区内交付一个小功能。 | [读取正文](mini-task/SKILL.md) |
| plan-ceo-review | 只读审查产品前提、范围、替代方案与交付风险。 | [读取正文](plan-ceo-review/SKILL.md) |
| plan-design-review | 只读审查UI信息架构、状态、无障碍及响应布局。 | [读取正文](plan-design-review/SKILL.md) |
| plan-eng-review | 只读审查工程顺序、接口、失败路径与验证设计。 | [读取正文](plan-eng-review/SKILL.md) |
| review | 只读审查正确性、范围、证据和未决风险；测试可信度沿verify正文条件指针。 | [读取正文](review/SKILL.md) |
| resolving-merge-conflicts | 已在合并中遇到冲突，需要按真实目标解冲突。 | [读取正文](resolving-merge-conflicts/SKILL.md) |
| diagnosing-bugs | 已有错误、测试失败或性能回退，需要复现、最小化并定位根因。 | [读取正文](diagnosing-bugs/SKILL.md) |
| test-routing-advisor | 按真实changed files选择simple、feature或fullstack测试路线；本身不执行测试。 | [读取正文](test-routing-advisor/SKILL.md) |
| testing-system-blueprint | 规划本Phase测试面与针对性验证；oracle读backend唯一证伪方法。 | [读取正文](testing-system-blueprint/SKILL.md) |
| backend-testing | 实施后仅有后端改动，验证参数、业务、权限和错误边界，定义唯一行为证伪方法；跨端另读fullstack-slice-testing。 | [读取正文](backend-testing/SKILL.md) |
| frontend-testing | 实施后仅有UI状态、交互或键盘行为改动，接口不变；跨端链路另读fullstack-slice-testing。 | [读取正文](frontend-testing/SKILL.md) |
| fullstack-slice-testing | 改动跨前端、API、worker或持久化边界，验证一个用户可观察的完整链路。 | [读取正文](fullstack-slice-testing/SKILL.md) |
| isolated-browser-qa | 需要浏览器测试、localhost检查、截图验收或页面流程排查。 | [读取正文](isolated-browser-qa/SKILL.md) |
| ui-project-init | UI规划先定位本动作适用的专业规范与原owner。 | [读取正文](ui-project-init/SKILL.md) |
| design-source-readiness | 核对已有设计材料是否能供当前动作使用，并显露缺源或冲突。 | [读取正文](design-source-readiness/SKILL.md) |
| frontend-prototype-render | 用真实组件输入渲染任务原型，提供预览与截图。 | [读取正文](frontend-prototype-render/SKILL.md) |
| frontend-component-quality | 实现或审查组件的真实consumer、状态、ViewModel、样式与复用边界。 | [读取正文](frontend-component-quality/SKILL.md) |
| third-review | 明确调用通用异源CLI审查器，保原始意见和失败诊断。 | [读取正文](third-review/SKILL.md) |

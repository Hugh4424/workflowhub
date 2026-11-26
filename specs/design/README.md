# WorkflowHub 设计域规则表

定位：设计域规则表入口，五行，只指已存在锚点；不含规则正文。读者：make-decision 与 build-code 的出页及终末页面 caller、design-source-readiness 与 plan-design-review 的读者。边界：不新建 `specs/design/design.md` 等六个默认正文；八类规则的等价实质源已在技能与方法里。

| 规则 | 正文锚点 | 靠什么强制 | 状态 | 什么时候读 |
| --- | --- | --- | --- | --- |
| 出页前先取原八类职责，按真实来源定位，缺类只停该类 | [规范职责](../../skills/project-norm-init/SKILL.md#规范职责) | 审查问句 | 已强制 | 出页/设计准备前 |
| 有设计源时先核可读性、范围与缺口，再谈取值 | [来源准备](../../skills/design-source-readiness/SKILL.md#方法) | 审查问句 | 已强制 | 有设计稿/设计源时 |
| 造页面用固定组件词汇与取舍，不自造控件名 | [组件词汇与取舍](../../skills/answer-as-page/SKILL.md#组件词汇与取舍) | 审查问句 | 已强制 | 出页/写页面时 |
| 交驾驶舱页前按当前任务驾驶舱合同写状态与动作 | [驾驶舱合同](../../skills/answer-as-page/SKILL.md#当前任务驾驶舱) | 结构＋审查问句 | 已强制 | 出驾驶舱页前 |
| 页面结构样式只沿原模板，不改 renderer 与 HTML 结构 | [原模板](../../skills/answer-as-page/templates/overview-template.html) | 结构 | 已强制 | 改页面结构前 |

本表只导航，正文不复制。`specs/design/design.md` 等六个默认落点当前无独立正文；八类规则的等价实质源已在技能与方法里，复制即第二处正文（违 R-026）。要建由 project-norm-init 对应原 owner 决定，本入口不建占位。

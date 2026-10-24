---
name: plan-design-review
description: Report-only UI design lens for information architecture, states, accessibility, and responsive behavior.
---

# plan-design-review

Source: adapted from the project design review baseline. Mode: `advisory`, file-only.
Use this lens for build-plan's actual UI scope and build-prd's conditional design material. Review the supplied journey, design sources and real previews within the existing merged document review; findings join that review instead of creating another review point.

UI 适用时，先读 `skills/ui-project-init/SKILL.md` 的「规范职责」，再按本次审查范围读取下列具体来源。路径相对目标项目根；八类不是强制八文件，同职责已有等价实质源时复用：

- ①领域语义：WorkflowHub 的 `GLOSSARY.md`；宿主使用自己的词义源，PaperBuilder 为 `GLOSSARY.md`。
- ②视觉设计系统：`specs/design/design.md`；精确值仍引用现 token、主题或 Figma 变量。
- ③组件及设计代码对应：`specs/design/components.md`；独立工程正文确需时读 `specs/frontend/components.md`，否则读 `specs/frontend/frontend.md`。
- ④布局与场景：`specs/design/layouts.md`；独立工程正文确需时读 `specs/frontend/layouts.md`，否则读 `specs/frontend/frontend.md`。
- ⑤通用交互：`specs/design/interaction.md`；控件内合同引用组件源。
- ⑥前端工程：`specs/frontend/frontend.md`，配置、架构和 API 保原来源。
- ⑦内容与设计工艺：`specs/design/craft.md`，词义和值引用原源。
- ⑧质量判据：确需独立正文时读 `specs/design/quality.md`；工程/运行共用 `specs/frontend/ui-quality.md`。

以 `skills/ui-project-init/SKILL.md` 的「规范职责」表为准，本处路径随表更新。逐类核实际路径/稳定节、version/作用域、原 owner、真实 consumer 与适用性；缺源、过期或未核分别沿该入口的 missing/stale/unknown 写法给影响与承接者。只读到路径不等于已调用来源方法或观察到页面；审查只据实际提供的源与预览。

## Check

1. Identify primary user journey, information hierarchy, and interaction states.
2. Check empty, loading, error, and recovery states.
3. Check accessible names, focus order, contrast intent, and keyboard paths.
4. Check responsive constraints and component consistency.
5. **Evidence gap**: mark missing UI evidence as a packet gap rather than guessing visuals.

## Result

Return UI-specific evidence and findings only when UI scope is present.

## 写作规范

创建或改写 agent 方法时，读取 `skills/spec-specify/SKILL.md` 的「技能写作规范（WR001）」唯一规范；此处不复制规范。

来源权威：[catalog](../catalog.yaml#skills.plan-design-review)；本便携小卡非权威；单技能副本缺catalog时向来源维护者取登记。来源：garrytan/gstack plan-design-review/SKILL.md。

## 同仓方法依赖

`skills/spec-specify/SKILL.md`；按上文实际条件读取，搬运时需同时提供或由调用者提供可读原件。

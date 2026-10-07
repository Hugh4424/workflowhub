---
name: ui-project-init
description: 为新项目或历史项目建立最小、可回放的 UI 设计与组件基线。
version: 1.0.0
---

# UI Project Init

在 build-plan 的真实 UI 范围中使用；整理 `new` 或 `legacy` 项目的最小可观察基线，交给设计和实现任务。它是 no stage、no gate 的可搬运方法，不执行产品 UI、不打 quality score。

## 规范职责

项目只有一份 Design.md（视觉/组件、token、布局、响应式、组件 API、视觉 a11y/性能预算）和一份 Experience.md（页面、业务动作、状态流转、异常恢复、键盘语义及长期测试场景）。记录实际文件路径、人读 version 与稳定 section/page anchor、职责和当前缺口；标题 slug 不能假装已有稳定 anchor。规范不承载本任务进度或截图结论。

## 方法

1. 从原始需求和当前代码核实 ui/non_ui/backend/fullstack；来源不足写 unknown，不用调用者标签绕过实际 UI 范围。
2. new：只为首个真实界面整理两份规范、页面/组件与 CSS owner、fixture 数据形状、viewport 和 Preview 计划。未知与不适用分别写 unknown / N/A + reason。
3. legacy：只读盘点技术栈、路由、CSS 副作用、数据入口、组件候选、测试能力、可限界首个页面、例外和耦合风险。用户决定后选择低耦合范围；没有候选报告 not_ready 和缩小方案，不自动全仓组件化或 reset CSS。
4. 已有视觉规则直接引用；页面/交互/长期场景变更由 Experience 的明确作者处理，视觉规则变更由 Design 的明确作者处理。按当前任务已授权写集写入：build-plan 本技能只读整理；实际项目规范实现由 build-code 承接，不默默改规范。
5. 返回模式、两份来源及版本、范围、组件/样式边界、fixture、viewport、Preview、真实盘点、假设、缺项及用户实际选择。无 Preview 就没有视觉通过；输出能定位真实源和具体下一步即可，不要求 runtime classifier/schema/proof 包装。

## legacy 盘点说明

以下名称解释 `legacy_inventory` 的盘点方面，供按真实范围整理，不是必填字段或额外校验要求；未读、未知和不适用分别说明原因。

| 子项 | 盘点说明 |
| --- | --- |
| `technology_stack` | 当前技术栈及版本、构建方式 |
| `routes` | 页面路由、入口与实际范围 |
| `css_side_effects` | 全局样式及可能影响其它页面的副作用 |
| `data_entrypoints` | 数据入口、读写与来源 |
| `component_candidates` | 可复用或需整理的组件候选 |
| `testing_capability` | 可执行的测试与浏览器验证能力、缺项 |
| `baseline` | 当前可观察页面、行为与视觉基线 |
| `legacy_exceptions` | 历史例外及保留理由、影响 |
| `first_page_candidates` | 能限界的首个页面或区域候选 |
| `coupling_risks` | 与样式、数据、组件和其它页面的耦合风险 |
| `minimal_scope_reduction` | 缺少低耦合候选时的最小缩小方案 |

## 完成边界

全部适用输入均有实际来源或明确缺项、责任与影响；有 legacy_inventory 时逐项说明扫描/人读范围及 unknown，不把人工判断覆盖原始机器事实。不得宣称未读代码、未运行 Preview 或未测页面已经通过。浏览器验证由 `skills/isolated-browser-qa/SKILL.md` 的隔离路线执行。

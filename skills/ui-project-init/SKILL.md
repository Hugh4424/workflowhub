---
name: ui-project-init
description: 为新项目或历史项目建立最小、可回放的 UI 设计与组件基线。
version: 1.0.0
---

# UI Project Init

这是一个可搬运的输入整理技能，不是阶段编排器、质量评分器或推进 gate。

## new

新项目只建立第一个真实界面所需的最小基线：

- 项目级 `Design.md` 的初始版本字符串（例如 `2026.08`）；
- 页面/区域边界、现有或待建组件与样式 owner；
- 固定 fixture 的数据形状、目标 viewport、Preview/截图实施卡；
- 缺失项用 `unknown` 或 `N/A + reason` 记录。

`Design.md` 是项目通用设计源，不保存本任务状态、FR/AC、task 状态或截图结论。版本是可读引用，不是文件摘要。

## legacy

历史项目先做只读盘点：技术栈、路由、CSS 副作用、数据入口、组件候选、测试能力、可限界的 first-page 和耦合风险。人工确认后只选择一个低耦合页面/区域开始；不自动全仓组件化、reset CSS 或迁移不可控数据。没有可限界候选时输出 `not_ready`、风险和缩小建议，但不把它变成阻塞 gate。

## 输出合同

输出必须能被下游引用，并明确：`mode`、`design_revision`、`scope`、`component_boundary`、`style_boundary`、`fixture`、`viewport`、`preview`、`missing_items`、`assumptions`、`human_confirmation`。`legacy` 还必须输出 `legacy_inventory`，包含 `technology_stack`、`routes`、`css_side_effects`、`data_entrypoints`、`component_candidates`、`testing_capability`、`baseline`、`legacy_exceptions`、`first_page_candidates`、`coupling_risks`、`minimal_scope_reduction`。缺输入仍输出事实和原因；没有 Preview 不伪造视觉通过。

实际输出由 `runtime/stage/stage-content-contracts.mjs` 的
`buildUiProjectInitFact(input)` 生成。技能只负责收集输入和把返回事实写入
现有 `spec.md`/`quality/facts/`；不得用一段 Markdown 代替函数结果。

## 边界

本技能不调用 Figma/Storybook，不执行浏览器测试，不创建新 stage、第五材料、独立状态机或 no-design gate。它是 no stage、no gate 的便携输入整理器；真实测试由 build-code 的具体 testing skill 执行。

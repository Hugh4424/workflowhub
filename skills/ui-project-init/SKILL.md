---
name: ui-project-init
description: 为新项目或历史项目建立最小、可回放的 UI 设计与组件基线。
version: 1.0.0
---

# UI Project Init

这是一个可搬运的输入整理技能，不是阶段编排器、质量评分器或推进 gate。

## 两份项目规范的身份

UI 项目必须只有一份 `Design.md` 和一份 `Experience.md`。`Design.md` 是唯一视觉/组件规范：
设计原则、token、布局/响应式、组件 API、视觉状态、视觉 a11y、性能预算和治理规则都放
这里；它不写页面流转、业务动作或某次运行结果。`Experience.md` 是唯一页面/交互/长期测试
场景规范：页面索引、状态、流转、异常恢复、键盘语义、操作/预期/覆盖边界和已知缺口都放
这里；它不写颜色、字体、间距、断点、token 或组件视觉规则。两份文件都要有 owner、revision、
原始内容 `content_sha256`、显式 `anchor_id`/`anchor_title`；不能用标题 slug 冒充稳定 anchor，
也不能把它们当 task 的第五份材料。

## new

新项目只建立第一个真实界面所需的最小基线：

- 项目级 `Design.md` 的初始版本字符串（例如 `2026.08`）；
- 项目级 `Experience.md` 的初始版本字符串（例如 `2026.08`）；
- 页面/区域边界、现有或待建组件与样式 owner；
- 固定 fixture 的数据形状、目标 viewport、Preview/截图实施卡；
- 缺失项用 `unknown` 或 `N/A + reason` 记录。

`Design.md` 是项目通用设计源，不保存本任务状态、FR/AC、task 状态或截图结论。版本是可读
引用，但下游绑定还必须保存项目相对路径、原始 UTF-8 内容 hash、revision 和显式 anchor。
只使用既有视觉规则时绑定 Design，不要求更新 Design；页面/交互/长期场景改变时更新
Experience；视觉规则改变时更新 Design，同一改动可同时更新两份。

## legacy

历史项目先做只读盘点：技术栈、路由、CSS 副作用、数据入口、组件候选、测试能力、可限界的 first-page 和耦合风险。人工确认后只选择一个低耦合页面/区域开始；不自动全仓组件化、reset CSS 或迁移不可控数据。没有可限界候选时输出 `not_ready`、风险和缩小建议，但不把它变成阻塞 gate。

## 输出合同

输出必须能被下游引用，并明确：`mode`、`design_revision`、`experience_revision`、`scope`、`component_boundary`、`style_boundary`、`fixture`、`viewport`、`preview`、`source_identities`、`missing_items`、`assumptions`、`human_confirmation`。`legacy` 还必须输出 `legacy_inventory`，包含 `technology_stack`、`routes`、`css_side_effects`、`data_entrypoints`、`component_candidates`、`testing_capability`、`baseline`、`legacy_exceptions`、`first_page_candidates`、`coupling_risks`、`minimal_scope_reduction`。缺输入仍输出事实和原因；没有 Preview 不伪造视觉通过。

运行时合同由 `validateProjectStandardSources(input)` 统一检查两份规范的 identity、职责边界、
stale/missing 状态和唯一 writer；`buildConsumerCensus(input)` 统一接收可复现盘点。盘点必须带
`schema_version`、scanner version、源码 snapshot、scan config、逐项 `support_matrix`、稳定
`consumer_id` 和枚举 `unknown_reason`；合同版本固定为 `consumer-census.v1`，人工语义只能用 `source=human` 追加，不能覆盖 scanner
事实。影响分类由盘点和原始事实推导为 `non_ui`、`ui`、`backend`、`fullstack` 或 `unknown`，
不能由调用者标签降级。Only build-code may write a changed project standard; all other stages only
bind or verify the identity.

实际输出由 `runtime/stage/stage-content-contracts.mjs` 的
`buildUiProjectInitFact(input)` 生成。技能只负责收集输入和把返回事实写入
现有 `spec.md`/`quality/facts/`；不得用一段 Markdown 代替函数结果。

## 边界

本技能不调用 Figma/Storybook，不执行浏览器测试，不创建新 stage、第五材料、独立状态机或 no-design gate。它是 no stage、no gate 的便携输入整理器；真实测试由 build-code 的具体 testing skill 执行。

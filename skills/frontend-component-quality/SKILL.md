---
name: frontend-component-quality
description: 为 UI phase 维护组件、状态、ViewModel 与 CSS/token 的可复核质量地图。
version: 1.0.0
---

# Frontend Component Quality

公开入口只有本技能。它输出 **Component Quality Map**，并消费 `buildConsumerCensus` 的真实消费者；不替代 frontend-testing，不创建新 stage、第二 workflow、第二 entrypoint、独立 evidence store 或质量 gate；它是 no stage、no gate 的质量 lens。

## Component Quality Map

每个 UI phase 记录：

- `action`：`reuse`、`modify`、`extend-state-or-variant`、`add-local`、`extract-shared` 或 `remove-after-no-consumers`；
- affected component、每个真实 `real consumer`、兼容影响、props/events、状态 owner 和 typed ViewModel；
- 唯一 CSS/token owner、项目实际命令、browser scenario、viewport、fixture、截图状态和 coverage limits。

`modify`、`extend-state-or-variant`、`add-local`、`extract-shared` 都必须记录
`story_or_test_update`；`extract-shared` 必须有两个已确认的真实消费者；没有消费者只能
`remove-after-no-consumers`，且必须附 `no_consumer_evidence` 或 `evidence_refs`。
消费者暂时无法确认时，用结构化 `unknown`/`unavailable` + reason 保留风险，不把它
悄悄当成“零消费者”或删除依据。全局样式、跨 feature 覆盖或 `!important` 必须写理由
和消费者。缺字段用 `unknown`、`unavailable` 或 `N/A + reason`，不能把字段名字当作质量通过。

消费者盘点必须是可重放的 `consumer-census.v1`：输入包含 scanner version、源码 snapshot、
scan config 和 route/import/lazy/CSS/data 的逐项 support matrix；输出按稳定 `consumer_id`
排序。动态加载、生成代码、未支持框架、扫描失败和语义不确定必须带枚举 `unknown_reason`。
人工体验/视觉语义只追加 `source=human`，不能覆盖扫描原始项；没有真实 consumer 时保留
`unknown`，不能声称 component map 已完整。

## React/Next lens

当技术栈确认是 React/Next 时，只读使用随包固定的 Vercel MIT `react-best-practices` compiled guide；它提供性能和组件边界建议，不拥有 WorkflowHub 结果，也不独立触发阶段或 gate。非 React/Next 或技术栈未知时写 `N/A + reason`。每次迭代只检查固定上游是否有新版本，升级需人工比较并保留 `LICENSE`/`UPSTREAM`。

## Static quality check

可搬运的可执行检查入口是
`scripts/check-frontend-component-quality.mjs`。它从 stdin 或第一个参数读取
JSON：

```json
{
  "component_quality_map": [{"component": "SettingsForm"}],
  "css_files": [{
    "path": "src/settings.css",
    "scope": ".settings-form",
    "content": ".settings-form .save { color: red; }"
  }]
}
```

它报告 `duplicate-component`、`duplicate-selector`、`global-override`、
`important-declaration`、`css-leak` 以及静态输入缺失事实。没有发现问题时，
只要提供了非空 Map 或 CSS 输入才返回 `status: "ok"`；没有输入返回
`status: "not_applicable"`，不伪造质量通过。它不检查浏览器行为、截图、a11y
或运行时状态；这些仍由 `frontend-testing` 和 `isolated-browser-qa` 负责。

## 边界

本技能不重新设计视觉、不调用浏览器、不把 Design.md 改成任务状态。build-plan 只设计地图，build-code 按真实 diff 回填并调用具体 testing skill，verify-code 检查真实 consumer、兼容性和 CSS/token 泄漏。

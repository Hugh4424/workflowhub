---
name: design-source-readiness
description: 从项目级 Design.md 派生可读的 Screen Read Map，并保留缺项与人工确认事实。
version: 1.0.0
---

# Design Source Readiness

本技能只读项目通用 `Design.md`，生成给 build-spec 和现有 `plan-design-review` 使用的 **Screen Read Map**。它不复制 Design.md，不打分（no score），也不设置 gate。

## Read Map 字段

每个 section/page 都要尽力保留稳定 `section/page anchor`、目标与主操作、状态清单、组件和 token 来源、fixture、viewport、响应式/无障碍要求、已有 Preview/浏览器/截图引用、缺项代码和人工待答项。

## binding_state

- `bindable`：Design.md 存在、有项目版本字符串且当前引用可读；只表示可以引用，不表示视觉效果已通过。
- `not_bindable`：Design.md 不存在、版本发生变化或当前引用不一致；保留返工风险。
- `unknown`：版本缺失、内容无法读取或输入来源冲突；保留原因。

版本号是人可读的项目引用，不使用文件摘要，也不把任务状态写回 Design.md。`human` confirmation 只记录结果和材料引用，不记录负责人。

## 交接

输出包含 `design_revision`、`binding_state`、`read_map`、`missing_items`、`freshness`、`human_confirmation` 和 `N/A + reason`。缺 Design.md、Preview、fixture 或截图时写 `unknown`/`unavailable`，人工确认后仍可继续，不变成 no-design gate；这是 no gate 语义。

实际输出由 `runtime/stage/stage-content-contracts.mjs` 的
`deriveDesignSourceReadiness(input)` 生成。输入是调用方已经读取的整份
Design.md 内容或 section 列表；函数只派生 Screen Read Map，不改写来源，
也不靠 Markdown 文字假装完成检查。

## 边界

这是一个只读派生 lens，不是第二设计权威、第二 workflow、质量评分器或独立 review controller；实际页面、浏览器和截图事实沿现有阶段证据路径记录。

---
name: frontend-prototype-render
description: Render one task-scoped UI prototype from real component inputs and retain preview evidence before the user confirms it.
version: 1.0.0
---

# Frontend Prototype Render

这是 build-spec 的可搬运 UI 依赖：把当前任务已选定的真实组件输入渲染成一个可展示原型，
再把预览和截图留在任务证据目录。它不改产品源码、不创建页面实现、不替代 build-code，
也不创建 no stage 或 no gate。

## 输入

调用方必须提供真实组件输入：组件/路由入口、当前 fixture 或数据形状、目标 viewport、
Design.md 与 Experience.md 的已绑定 identity、以及当前 material revision。没有真实组件输入时
返回 `unknown` 和原因；不得用静态假页面冒充原型。

## 执行

1. 复用项目已有 preview/story/test harness，给出可运行的本地渲染命令和目标地址。
2. 用真实组件输入运行该可运行的本地渲染命令；命令不可用时保留 `exit_code`、`output_ref`、
   `output_hash` 和原因。成功结果只能是 `exit_code: 0`。
3. 每个 `component_inputs` 条目都写 `component_ref`、`component_hash`、`export_name`、
   `fixture_ref`、`fixture_hash`；组件和 fixture 必须是当前工作区内可读取的真实文件，hash
   必须逐项等于当前字节。随后在具体 `viewport` 展示生成的预览，写入任务
   `quality/evidence/` 下彼此不同的 `preview_ref`/`preview_hash` 与
   `screenshot_ref`/`screenshot_hash`。它们连同 `material_revision`、`snapshot_tree`
   必须与当前任务工作区一致，不能只写口头结论。
4. 展示后才向用户请求确认。确认写入当前任务的
   `quality/confirmations/<sha256>.json`，绑定展示的 preview ref、当前 material revision 和
   当前 `snapshot_tree` 及用户的 `accepted` 决定；用户明确同意才可把降级为提示词包。没有回复、拒绝、取消或
   不可展示都保留为 `unknown`/`unavailable`/`human_not_approved`，不能写成设计通过。

执行结果由本次 `frontend-prototype-render` 的既有 stage-outcome proof 的
`host_evidence` 认证；proof 与上述完整结构逐字段相同。它是当前 stage 的私有输入，
不是新的 receipt、公共命令或持久状态。

## 降级

只有用户明确同意后，才可以生成提示词包替代可运行原型；不额外要求
`preview_unavailable`。提示词包必须说明缺少的组件、渲染环境或浏览器能力，并保留同一任务
`quality/evidence/` 的 `prompt_ref`/`prompt_hash`，其字节必须逐字等于四行 `prompt_text`。
随后必须回传同一任务的
`returned_design_ref`/`returned_design_hash`，其 revision 必须等于当前 Design.md revision；
展示回传稿后，用户还要对回传稿写一份最终确认。降级确认绑定提示词包，最终确认绑定回传稿；
两者均绑定当前 material revision 和 snapshot_tree。提示词包不是截图、预览或最终设计确认的等价物。

## 输出与指标

输出 `component_inputs`、`render_command`、`exit_code`、`output_ref`、`output_hash`、`viewport`、
`preview_ref`、`preview_hash`、`screenshot_ref`、`screenshot_hash`、`material_revision`、
`snapshot_tree`、`confirmation_ref`、`confirmation_hash`、`human_confirmation`、`missing_items`
和 downgrade reason。记录真实组件输入数、渲染命令 exit、预览/截图引用是否存在和是否获用户确认，供当前 stage 的执行记录使用；
不新增持久状态或指标系统。

## 边界

本技能只产生任务级原型事实；真实页面实现、浏览器验收和组件质量由 build-code/verify-code
的既有 consumer 执行。no stage、no gate、无第二 workflow、无第二设计权威。

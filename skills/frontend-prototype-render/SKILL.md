---
name: frontend-prototype-render
description: Render one task-scoped UI prototype from real component inputs and retain preview evidence before the user confirms it.
version: 1.0.0
---

# Frontend Prototype Render

build-plan UI 分支与 build-prd 条件设计分支调用：用真实组件和 fixture 生成可展示原型，再取得用户对展示稿的真实答复。产品页面实现、验收仍由 build-code/verify-code 承担；no stage、no gate、无第二设计权威。

## 方法

1. 读取当前组件/路由入口、export、fixture/数据形状、viewport、Design.md 与 Experience.md 的实际路径和适用规则。缺真实组件就报告 unknown，不用静态假页面冒充运行原型。
2. 复用项目现有 preview/story/test harness；保存实际渲染命令、cwd、退出码、原始输出路径和失败原因。未运行或非零不称成功。
3. 用 `skills/isolated-browser-qa/SKILL.md` 的隔离路线展示真实组件。记录组件/fixture 路径、viewport、实际 Preview/截图文件和页/状态覆盖；缺展示就没有视觉通过。保留原始失败，一类输出一份。
4. **展示后确认**：展示完整、可审查原型后请用户确认展示内容。未答、拒绝、取消、不可展示分别保留 unknown/unavailable/human_not_approved；只记录真实答复和展示稿的实际路径，不依赖 hash、material revision、snapshot 或 stage-outcome proof 认证。

## 条件降级

只有用户明确同意才用提示词包代替可运行原型。说明缺组件、渲染环境或浏览器能力，保存实际 prompt 文件；取得返回设计的真实文件后展示回传稿，再记录对回传稿的最终真实答复。降级同意不等于最终设计同意；提示词包不等于 Preview、截图或设计通过。来源规则若变化，只复核受影响范围，不默默沿用旧选择。

## 输出与结束条件

返回实际组件输入、render_command、exit_code、output_ref、viewport、preview_ref、screenshot_ref、human_confirmation、missing_items 和 downgrade reason。每项有可读路径或具体缺失原因，用户明确确认的展示内容能定位；已安装工具失败不假装降级成功。将真实覆盖和限制交给当前主会话，不新增持久状态或认证 wrapper。

## 写作规范

创建或改写 agent 方法时，读取 `skills/spec-specify/SKILL.md` 的「技能写作规范（WR001）」唯一规范；此处不复制规范。

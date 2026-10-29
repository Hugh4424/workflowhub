---
name: frontend-prototype-render
description: Render one task-scoped UI prototype from real component inputs and retain preview evidence before the user confirms it.
---

# Frontend Prototype Render

build-plan UI 分支与 build-prd 条件设计分支调用：用真实组件和 fixture 生成可展示原型，再取得用户对展示稿的真实答复。产品页面实现、各Phase独立验收及最后Phase终末独立核对均由 build-code 承担；no stage、no gate、无第二设计权威。

## 方法

先选两路输入：**有稿**取得设计来源、目标元素、属性/数值、状态、验收点五类输入，声明页面元素与状态×视口分母，读取真实源码/结构/渲染证据；源码声明与实测分开。映射组件、token、布局及其 owner，源稿缺陷单列；缺关键项只限制依赖该项的范围，按 design-source-extraction 的 freshness、pending_review 与 blocked_scope 处理，不把截图猜测当 API 或批准值。**无稿**从当前需求、真实业务语义、许可和合成数据写完整任务、IA、状态与恢复；生成前及生成后实际读取 `skills/ui-copy-discipline/SKILL.md`，必要提示词沿 `skills/figma-make-prompt/SKILL.md`，提示词不代真实代码原型。

有稿、无稿、非 UI 分别回读 make-decision 的 raw_requirement/project_inventory/planned_or_changed_frontend_fact。非 UI 按真实范围给理由，不强迫生成页面。真实原型通用位置为 `specs/<task>/prototype/`，受控样本按当前 Phase 专属目录。有稿和无稿原型统一交付轻量 HTML/CSS/原生 JS 静态页面：有稿消费设计、数据和交互依据，不照搬原工程的 Next/Vite/服务运行环境；无稿也不先搭框架。取用与验收无需 npm、Next、CDN或外部字体，优先相对资源、自带数据和可直接打开的本地 HTML，必要时用标准库普通静态 HTTP 服务。保完整交互与状态，不降成静态图、空壳或 toast。本轮已存在 React 原稿可按用户明确迁移决定预编译成自包含 IIFE/CSS，以保真减返工；这是本轮转换，不成为今后默认重框架或有稿豁免。作者转换工具的依赖/锁/真实安装体积与耗时、发布文件字节、零 npm 消费者路径分别报告；可写源码与静态产物、入口/状态、CSS/fixture owner及后续工程接线边界一并交付，mock无真实 HTTP/存储/交易副作用。

设计依据准备执行 `skills/knowledge-graph/references/knowledge-reuse.md`：每个真实查询逐项作支持、需上下文、冲突、证据不足四判，记录采用/不用/待补证、理由与具体消费位置；图命中与索引存在只作线索。外部逐件来源/版本/权利和维护入口仅回 catalog；按来源权威与用户明确用途处理复制；unknown不冒已获grant，已明确个人研究用途时不默认作为施工门，原能力与来源/consumer义务继续。

六概念按当前任务消费，实际影响写在原型计划与交接：impeccable 保有界工艺及有稿身份；design-first-ui-prompting 将目标、层级、文案、约束写实且单变量迭代；animation-vocabulary 仅有业务需求时选具名动效并核 reduced motion，无动效写源据不适用、工程实现交后续实现 owner；better-colors 核语义 token 与实际背景对比，值回原源；better-typography 核数字稳定、长文完整值可达与沿现字体；better-layout 核分组、容器增长、操作可达及三视口 overflow。不得由这些参考强加色值、字体、断点、动画或第二规范/进度平台；未读全文或无实际消费者保持待补证。

1. 读取当前 HTML/脚本入口、真实 DOM/组件结构、fixture/数据形状、viewport；沿 `skills/project-norm-init/SKILL.md` 的「规范职责」定位本次原型适用类的真实专业源，核各源路径/稳定节、version、作用域、owner/consumer 与适用规则。通用规则沿原专业源，本次页面步骤/状态/权限/恢复沿当前 task spec/API，不复制第二正文。按类给缺源/冲突及影响，未读或单类 missing/stale 不当全部类失败；旧 Design.md/Experience.md 可供真实历史/可信条款输入，不是两份必需 active 源。缺真实输入报告 unknown；原生 DOM 与脚本交互属于真实实现，只有截图/空壳不能冒运行原型。
2. 实际打开交付 HTML，或用标准库静态服务展示；现有 preview/test harness 能直接消费静态入口时才复用，不因目标工程有框架就复制它的运行环境。记录实际入口、命令/直接打开方式、cwd、退出事实、输出与失败。无作者构建步骤不要求伪造 build；有预编译转换则另保作者构建原件，不能用它代零 npm 消费验证。file:// 若隔离 QA 不支持就记未测，HTTP通过不推导双击通过，不扩浏览器权限。
3. 用 `skills/isolated-browser-qa/SKILL.md` 的隔离路线展示真实组件。记录组件/fixture 路径、viewport、实际 Preview/截图文件和页/状态覆盖；缺展示就没有视觉通过。保留原始失败，一类输出一份。
   对每页×适用状态×任务声明视口逐格记录输入、预期、实际结果及恢复；十态逐项给适用或具名不适用依据，未测保持未验证。取真实 DOM、console/network、截图、键盘/焦点、缩放与溢出证据及首屏/适用交互计时方法；截图不证交互。可运行后由未参与实现者调用 `skills/plan-design-review/SKILL.md` 作八维独立设计审查；finding 回原作者修，受影响项由独立者复验。此产品设计审查不替 Phase 代码审查。
4. **展示后确认**：展示完整、可审查原型后请用户确认展示内容。未答、拒绝、取消、不可展示分别保留 unknown/unavailable/human_not_approved；只记录真实答复和展示稿的实际路径，不依赖 hash、material revision、snapshot 或 stage-outcome proof 认证。
   当前展示答复绑定实际页面/状态范围与用户原话；可合并展示两路，但只答一路不覆盖另一路。拒绝后只修受影响范围再展示；旧答复不代当前基准。批准原型与设计基准交 build-code 消费，不无据重画，不将原型同意冒最终业务验收。首次使用观察先让未参与实现的读者仅看页面说出下一步及预期，再记录实际动作、结果、卡点和理解核对；独立 agent 读回不冒真人可用性测试。

## 条件降级

只有用户明确同意才用提示词包代替可运行原型。说明缺组件、渲染环境或浏览器能力，保存实际 prompt 文件；取得返回设计的真实文件后展示回传稿，再记录对回传稿的最终真实答复。降级同意不等于最终设计同意；提示词包不等于 Preview、截图或设计通过。来源规则若变化，只复核受影响范围，不默默沿用旧选择。

## 输出与结束条件

返回实际组件输入、render_command、exit_code、output_ref、viewport、preview_ref、screenshot_ref、human_confirmation、missing_items 和 downgrade reason。每项有可读路径或具体缺失原因，用户明确确认的展示内容能定位；已安装工具失败不假装降级成功。将真实覆盖和限制交给当前主会话，不新增持久状态或认证 wrapper。

## 写作规范

创建或改写 agent 方法时，读取 `skills/spec-specify/SKILL.md` 的「技能写作规范（WR001）」唯一规范；此处不复制规范。

## 同仓方法依赖

`skills/isolated-browser-qa/SKILL.md`、`skills/spec-specify/SKILL.md`、`skills/project-norm-init/SKILL.md`；按上文实际条件读取，搬运时需同时提供或由调用者提供可读原件。

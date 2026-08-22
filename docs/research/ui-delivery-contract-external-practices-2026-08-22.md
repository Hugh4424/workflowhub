# UI 设计到前端交付：外部实践调研

**日期**：2026-08-22
**性质**：外部一手资料调研；不是已实施设计，也不是质量通过结论。
**目标**：把 UI 设计权威、前端实现、视觉回归、独立人工确认连接为一条轻量可执行链，供 WorkflowHub 的未来任务使用。

## 已证实的外部事实

1. [Figma Dev Mode](https://help.figma.com/hc/en-us/articles/15023124644247-Guide-to-Dev-Mode) 把「ready for dev」状态、版本比较、标注、设计属性、组件变体和资源链接放进设计交接界面；Code Connect 可把真实组件代码及其 props/variants 映射到设计组件。它支持交接，但不替代工程验收。
2. [Storybook stories](https://storybook.js.org/docs/get-started/whats-a-story) 是组件一个可渲染状态的可执行描述。一个组件可有多个 story 覆盖有意义状态和边界；story 同时是独立开发、复查和回归的共同对象。
3. [Playwright visual comparisons](https://playwright.dev/docs/test-snapshots) 用 `expect(page).toHaveScreenshot()` 生成并比对基准截图。官方明确要求基准和执行尽量固定在相同环境；浏览器、OS、字体和 headless 状态都会影响像素结果。动态内容应被隔离或冻结，不能以放宽阈值掩盖漂移。
4. [Chromatic visual testing](https://www.chromatic.com/docs/visual/) 将 story 或 Playwright 测试的渲染结果与基准逐像素比较，并要求人确认变更是否有意。它特别指出：功能测试可证明按钮能点，却无法发现按钮被 CSS 遮挡。

## 结论

UI 不是 build-code 才出现的「样式任务」。它至少有四份不可替代的事实：

`设计权威 → 可渲染状态 → 固定环境视觉证据 → 独立人工意图确认`

缺任何一环，模型或开发者都只能猜：

- 只有设计图：不知道空态、加载态、错误态、长文本和真实数据怎样表现。
- 只有 E2E：不知道视觉是否复现。
- 只有像素 diff：不知道视觉变更是故意还是回归。
- 只有人工截图评价：反馈不能稳定复现，下一轮又会退化。

## 可迁移的最小交付链

| 环节 | 唯一输入 | 产出事实 | 不做什么 |
| --- | --- | --- | --- |
| 决策/规格 | 已确认 UI scope | 设计权威与验收状态 | 不凭空设计页面 |
| 计划 | 页面、状态、组件映射 | 可实现任务与测试范围 | 不复制另一份需求 |
| 实现 | tokens、组件、stories | 可单独渲染的状态 | 不在旧全局 CSS 上堆补丁 |
| 验证 | 固定数据与视口 | 截图 diff、行为、a11y 事实 | 不把绿测当视觉通过 |
| 确认 | diff 与设计合同 | 独立确认或明确遗留项 | 不由实现者自判视觉完成 |

### 1. 设计权威：放进现有 `spec.md`

仅当 `ui_scope` 为真，规格必须有一个 `UI Contract` 小节；不新增阶段、不新增第五份当前材料。

- **来源**：Figma URL、frame/node、版本或更新标识；没有 Figma 时，设计源码/静态原型的 commit SHA 与入口路径。链接文字不是权威。
- **范围**：页面/区域、精确验收视口、主题、浏览器、响应式断点。
- **状态矩阵**：正常、空、加载、错误、禁用/权限、长文本/溢出；只列本任务真实会出现的状态。
- **交互合同**：点击、键盘、焦点、hover、弹层、错误反馈。原型动画只作线索，不能替代状态定义。
- **组件映射**：设计组件/variant → 代码组件 → story；已有组件优先复用，缺口显式列出。
- **验收锚点**：每个页面最多选 1–3 个高价值状态，写明截图名和预期；不追求每个像素、每个页面无限建档。

Figma 的 ready-for-dev、标注、版本比较和 Code Connect 是这个合同的可选来源能力；WorkflowHub 只记录可验证引用，不假设所有项目都使用 Figma。

### 2. 实现：用 stories 消除 agent 猜测

在 `plan.md` 写组件边界、状态归属和 token/CSS 权威；在 `tasks.md` 写每个页面的实现、story、浏览器场景和数据准备任务。前端 agent 必须以同一组状态对象工作：

- 每个新增或实质改动的通用组件有 story；主要页面至少有关键状态 story 或稳定路由场景。
- story 使用确定性、贴近真实形状的数据 fixture：真实 DTO 字段由 adapter 负责，视觉样例不能直接冒充生产响应。
- 同一状态矩阵驱动 story、浏览器测试和视觉截图；不维护三套各自漂移的 mock。
- 每个 UI 区域只保留一个 style/token 权威。跨页面复用走组件或 token；不要用 `!important`、全局选择器和后置覆盖补齐设计差异。

Storybook 的价值不是引入一个展示站，而是让「这个状态应该长什么样」成为代码可执行的共享合同。项目不适合引入 Storybook 时，可用同等的最小渲染路由，但仍要遵守同一状态/fixture/截图命名规则。

### 3. 验证：行为、像素、可访问性分开记录

`verify-code` 对 `ui_scope` 增加一个 UI lens，产出质量事实，不把事实缺失伪装成完成：

1. **行为**：关键交互 E2E；证明流程、权限和错误反馈。
2. **视觉**：固定浏览器、视口、字体、时钟、网络和 fixture 后，使用 Playwright 截图基准或同类系统比对。截图名称包含页面、状态、视口；基准更新必须是显式变更。
3. **可访问性**：键盘可达、焦点可见、语义/名称和必要的自动化扫描。自动化只发现部分问题，不能取代人工操作。
4. **独立视觉确认**：由非实现者（用户、设计 owner 或独立 reviewer）查看设计合同与 diff，确认「预期变更」或记录具体偏差。实现 agent 不能同时产出并裁决自己的视觉结论。

视觉证据至少记录：设计来源标识、候选代码 SHA、浏览器/OS 或容器镜像、视口、fixture 标识、基准截图、候选截图/diff、执行命令与人工结论。动态区域应明确冻结或遮蔽原因；不能默默提高 diff 容忍度。

## 给 WorkflowHub 的改进建议

### 入口与材料

1. `make-decision` 在发现页面、交互、设计图、前端改造关键词时，明确问一次：是否 `ui_scope`、设计权威在哪、谁确认视觉意图。无 UI scope 则不加 UI 流程。
2. `build-spec` 在 `ui_scope` 下写入上述 `UI Contract`；设计来源未冻结时，规格状态是 `incomplete`，不把草图当成可复现目标。
3. `build-plan` 把「页面/状态 → 组件/story → 测试场景」列入同一个 plan，而不是新增 UI backlog。
4. `build-code` 只消费这份合同。代码、story、fixture、截图用同一命名和状态集合；设计变更则回写 `spec.md`，不能只在聊天里改方向。
5. `verify-code` 执行 UI lens，保留质量事实。没有视觉或独立确认事实时，只能报告 `unavailable`/`incomplete`，不是阻止同 task 修复的许可证。

### 工具选择与边界

- **默认轻量组合**：已有 Playwright 的项目先用固定环境 screenshot + 人工 diff；无需立即引入云服务。
- **组件多、多人并行时**：引入 Storybook，把状态变成可浏览的 stories；视觉回归直接消费 stories。
- **需要跨浏览器、PR 审批和云端稳定渲染时**：再选 Chromatic 或等价系统。它是证据托管/审查工具，不是 UI 设计器。
- **Figma 项目**：Dev Mode/Code Connect 连接「设计组件 → 真实代码组件」；生成代码只能作为起点，最终仍由 stories、E2E 和视觉证据裁决。

不要把这些工具强制打包进 WorkflowHub runtime。WorkflowHub 应定义事实合同、适配器接口与 fail-loud 输出；具体项目选择 Playwright、Storybook、Chromatic 或等价实现。

## 低官僚性规则

- 非 UI 任务零新增负担。
- UI 小改只需受影响组件的 1 个 story/场景和 1 个截图锚点，不要求全站基准。
- UI 页面重做才要求完整状态矩阵、核心视口和独立视觉确认。
- 基准更新必须显示 diff 和原因；自动更新基准没有价值。
- 视觉失败先回到设计合同、状态 fixture、DOM/CSS 权威定位；禁止用扩大阈值或追加全局覆盖规则「治绿」。

## 需要后续验证的未知项

- 当前 WorkflowHub 的 `build-spec`、`build-plan`、`build-code`、`verify-code` 模板/runner 是否已有可扩展字段，还是需要最小 adapter。
- 当前各业务项目的 Playwright、Storybook、Figma、截图存储和 CI 能力；不能假定统一工具栈。
- UI 视觉确认由用户、设计 owner 还是独立 reviewer 承担；这是流程 owner 决策，不能由实现阶段自行指定。

## 来源

- Figma, [Guide to Dev Mode](https://help.figma.com/hc/en-us/articles/15023124644247-Guide-to-Dev-Mode)，访问于 2026-08-22。
- Storybook, [What's a story?](https://storybook.js.org/docs/get-started/whats-a-story)，访问于 2026-08-22。
- Playwright, [Visual comparisons](https://playwright.dev/docs/test-snapshots)，访问于 2026-08-22。
- Chromatic, [Visual testing with Chromatic](https://www.chromatic.com/docs/visual/)，访问于 2026-08-22。

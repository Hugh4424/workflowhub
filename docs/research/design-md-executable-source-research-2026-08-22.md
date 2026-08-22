# 可维护、可执行的 `Design.md` 调研

**日期**：2026-08-22  
**性质**：make-decision 调研输入；未改 WorkflowHub 生产代码、模板或阶段。  
**问题**：`Design.md` 怎样帮助未来项目设计新页面、复用组件和管理样式，而不变成 WorkflowHub 第五份当前材料。

## 结论

不存在“完美且包办一切”的 `Design.md`。正确定位是：**项目级、人类维护的设计源**。它保存代码无法可靠推导的产品意图和设计裁决；代码保存可执行细节；WorkflowHub 四份当前材料保存当前任务的决定、需求、计划和执行。

推荐链路：

`make-decision 定完整体验边界 → Design.md 固化设计意图 → spec.md 绑定设计版本和可验收 UI Contract → plan.md 映射实现 → 真实组件 Preview/Story 出效果图 → 浏览器行为/视觉/a11y 事实`

这不是第六阶段，也不是第五份 task truth。

| 事实类型 | 唯一 owner | 放置位置 | 不放什么 |
| --- | --- | --- | --- |
| 方向、取舍、延期 | WorkflowHub | `decision-log.md` | 组件 API、CSS 细节 |
| 可交付需求、交互和 AC | WorkflowHub | `spec.md` | 整份设计说明副本 |
| 组件/样式/测试实施映射 | WorkflowHub | `plan.md`、`tasks.md` | 重新定义页面意图 |
| 视觉意图和可复用设计规则 | 项目 design owner | `Design.md` | 任务状态、测试结果、代码清单 |
| token 值、组件 API、可渲染状态 | 代码 | token 文件、TypeScript、`*.stories.*` | 人工复制的第二份表 |
| 运行证据 | 测试与 review | 现有 quality/evidence facts | “设计已通过”自我声明 |

`spec.md` 的 UI Contract 只保存 `Design.md` 的路径、内容 hash/版本、受影响 screen/state ID 和验收锚点。`Design.md` 改变不会自动修改当前 task；当前 task 若要消费新版本，必须显式更新 UI Contract。这样不会破坏“当前工作真相只有四份材料”的宪法边界。[CONSTITUTION F3](../../CONSTITUTION.md)

## `Design.md` 应维护什么

只维护人要裁决、而代码无法从 TypeScript/CSS/Story 自动得出的内容。

```md
# Design.md

## Authority
- owner、来源模式：reference-reproduction | original-design
- 设计源：Figma node / 原型 / 截图集 / 组件库；版本或内容 hash
- 适用范围、允许引用的外部素材

## Product intent and information hierarchy
- 用户是谁、要完成什么、完成时看见什么
- 页面/路由的区域顺序、信息优先级、明确不可新增的内容/层级

## Screens and responsive rules
- screen ID、目标视口、断点后的结构变化
- 每页使用哪些已有组件；哪些可新建；哪些禁止替换

## User flows and interaction rules
- 入口、关键步骤、成功反馈、失败反馈、取消/返回、键盘和 focus

## State matrix
- default、loading、empty、error、long-data、disabled/locked、hover/focus
- 每状态用户可见内容与可执行/不可执行行为

## Component decisions
- 设计区域 -> 组件 -> allowed variant 的意图映射
- 抽取新共享组件的条件；不满足时保持页面局部组件

## Token and styling policy
- token 系统 ref；语义 token 使用规则；页面/组件 CSS owner
- 禁止跨 feature 覆盖、未登记 `!important`、第二 UI 库

## Fixture and content rules
- 效果图使用的固定 fixture ID、文本长度/数量级、隐私和动态数据处理

## Accessibility intent
- 必须有的 name/role、焦点顺序、键盘操作、不可仅靠颜色表达的状态

## Visual approval and deviations
- 截图基线范围、允许的明确偏差、未决问题、延期项、变更记录
```

这是内容模型，不是每页必须填满的长模板。小改动只需引用已存在 screen/component，并增加一条状态或偏差；新页面才补完整 screen、flow 和 state matrix。

### 不应写进 `Design.md`

- 具体 props 类型、组件完整 API、token 的数值、Story args、截图路径、命令、测试通过状态。
- 当前 task 的 FR、AC、任务卡、风险处置、完成结论。
- 可由代码直接导出的 class、DOM、文件列表和“像素已通过”。

这些内容人工双写会漂移。Storybook 的 story/args 是可渲染组件状态；同一 story 可被测试复用，适合作为效果图、组件示例和固定 fixture 的共同入口，而非再抄进 `Design.md`。[Storybook Args](https://storybook.js.org/docs/writing-stories/args)；[Storybook portable stories](https://storybook.js.org/docs/writing-tests/integrations/stories-in-unit-tests)

## 维护和变更纪律

1. **make-decision 先确定**：用户旅程、页面范围、信息层级、主要状态、成功/失败边界、非目标和延期。缺失时停在 Talk，不允许靠 build-spec 或 build-code 猜补。
2. **Design owner 更新 `Design.md`**：新增页面、改变信息层级、交互语义、视觉方向或共享组件规则时更新。视觉 bug 的 CSS 修复不改它。
3. **`build-spec` 只绑定，不补发明**：写 `design_ref + revision/hash + screen/state IDs`，并把已决 flow/state 转为 FR/AC。若发现原始需求缺失，返回 make-decision。
4. **`build-plan` 只落实**：写 `screen/state -> typed ViewModel -> component/variant -> story/preview -> CSS owner -> browser scenario`，不改用户体验方向。
5. **代码派生事实不回填**：组件 props、token 值、story args、截图快照分别留在它们的唯一代码 owner；`Design.md` 只链接逻辑类别或 screen/component ID。
6. **设计版本变化**：当前 task 要采用新设计时，更新 `Design.md` 后同步更新 `spec.md` 的引用/hash 和受影响 AC；不更新即仍按旧绑定实现。设计变更带来新用户流程或范围时，先回到 make-decision 记录新选择。

## UI 提示词：三种短提示词，禁止一条大而全

提示词不是需求真相。每次只注入当前 `Design.md` 的相关 screen/component slice，避免模型把整份历史设计当本页需求。

### 1. 设计/改版提示词

用于原创设计或设计源方向变更；**不写生产代码**。

```text
Mode: original-design | reference-reproduction.
Authority: <Design.md section + revision/hash + external ref>.
User outcome and non-goals: <decision-log choices>.
Target: <screen ID, route, viewport, theme>.
Hierarchy: <ordered regions; elements that must not be added>.
Available components: <component + allowed variants>; new-component budget: <explicit list>.
State and interaction matrix: <fixture IDs; success/failure/edge states>.
Token/CSS policy and accessibility intent: <relevant slice>.
Return: composition, component mapping, state annotations, OPEN decisions.
Do not: write production CSS/JSX, invent a feature, silently fill a missing reference.
```

`reference-reproduction` 遇到设计源缺项，输出 `OPEN`；不能凭“更美观”自作决定。`original-design` 的首次 Preview 必须由 design owner 确认后才可成为当前 task 的 design revision。

### 2. 组件拼版提示词

用于先设计效果图，再接真实接口。它只允许组合**真实组件**和固定 fixture：

```text
Render <screen/state/viewport> from the approved Design.md slice.
Use only <component imports and variants>; fixture=<ID> shaped as <ViewModel>.
Create/update the component story or stable preview route, not a parallel prototype.
CSS owner: <component/page>; tokens: <source>.
Deliver: renderable preview, screenshot name, component mapping, unresolved mismatch list.
```

默认态先出一张静态效果图；随后用同一 fixture ID 覆盖 loading/empty/error/long-data/locked 和关键 hover/focus；最后才接 DTO adapter 和动作。没有 Storybook 的项目可用稳定 preview route，但不能维护第二套原型 JSX/CSS。

### 3. 实现提示词

只处理已冻结 contract 的实现：typed DTO adapter、ViewModel、组件、状态、交互和本地样式。输入仍含 Design slice、组件映射、fixture 和 CSS owner；交付含 story/preview、行为场景和视觉场景。不允许通过 global override、无登记 `!important` 或新增 UI library “调到像”。

## 组件和 CSS：最小质量管理

不用“CSS 行数”或“全项目强制 Storybook”当质量指标。每个 `ui_scope` task 只检查四条：

1. **token 只有一个权威**：颜色、字体、间距、圆角、阴影来自同一 token/theme 来源。建议使用兼容 DTCG 的机器可读 token 格式；DTCG 支持类型、描述、分组和 alias，但它是 Community Group Report，不绑定 WorkflowHub 的运行时或版本。[DTCG Format](https://tr.designtokens.org/format/)
2. **样式只有一个 owner**：组件拥有自身的 variant 样式；页面只拥有布局。跨页面选择器和全局 reset 不用于修单页。
3. **数据只有一个入口**：DTO 先转 typed ViewModel；Story/Preview/E2E 使用同形 fixture。组件不直接消费 `Record<string, unknown>` 或宽松 API 对象。
4. **例外必须可审查**：第三方 bug 必须使用 global selector 或 `!important` 时，记录 selector、理由、consumer 和删除条件；否则是 quality finding。

Stylelint、禁第二 UI library import、token/raw-value 检查可按具体项目技术栈实例化；WorkflowHub 应管理规则和证据，不应捆绑某个前端框架。AgentHub 的 `frontend-testing` skill 对“视觉合同 -> lint/a11y/响应式/契约 mock/视觉回归”的翻译值得借鉴，但其工具组合不应成为硬编码依赖。[AgentHub frontend-testing](../../../multica-agenthub/packages/core/agenthub/skills/frontend-testing/SKILL.md)

## 验收：效果图不是完成结论

| 事实 | 共同输入 | 最小输出 | 裁决边界 |
| --- | --- | --- | --- |
| 组件效果图 | Story/Preview + fixture + viewport | 截图 | 早发现层级/布局错误 |
| 浏览器行为 | UI Contract + 真实场景 | DOM、交互、console、trace | 不证明视觉意图 |
| 视觉回归 | 固定环境 + 基准 | candidate、baseline、diff | diff 是否合理需人裁决 |
| 设计意图 | Design.md + diff | owner/reviewer 确认或偏差 | 不替代代码/行为测试 |

Playwright 要求尽可能固定 OS、browser、字体和环境；动态内容需要冻结、mask 或给出原因。`maxDiffPixels` 只能是场景级容差，不能全项目一刀切，更不能自动更新基准。[Playwright Visual Comparisons](https://playwright.dev/docs/test-snapshots)

缺任一事实时，记录 `incomplete`/`unavailable`，不能报告视觉通过；也不能把一般 quality finding 变成阻止同 task 修复的许可证。[CONSTITUTION F4](../../CONSTITUTION.md)

## AgentHub VibeCoding：借结构，不搬机制

### 值得借

- `design-fidelity-component-contract` 把设计源、state、element、transition、token、component candidate 和 implementation root 分开描述；其 `ui-contract` schema 还要求每个 element 有 source、variant、interaction 和 required 标记。这是“设计意图 -> 可验证映射”的好结构。[Skill](../../../multica-agenthub/packages/core/agenthub/skills/design-fidelity-component-contract/SKILL.md)；[Schema](../../../multica-agenthub/packages/core/agenthub/schemas/ui-contract.schema.json)
- Figma Code Connect 的一手设计同样支持 `Figma component/node -> production component import + props/variant` 映射；这是防止 agent 另写“看起来相似”的组件的可选适配器，不应成为使用 WorkflowHub 的前提。[Figma Code Connect](https://developers.figma.com/docs/code-connect/)
- `frontend-testing` 区分编译期规则、组件测试、a11y/响应式、接口 mock、视觉基线，并明确视觉 diff 的语义裁决需要人。这可成为 WorkflowHub UI lens 的检查顺序。

### 不应搬

- VibeCoding 的 Design stage 明确禁止写 `design.md`，把设计只放入 `spec.md`/`plan.md`。这不能满足项目级设计源、未来新页面复用和人类设计裁决的需要。[VibeCoding Design stage](../../../multica-agenthub/packages/core/agenthub/workflows/vibecoding/stages/design.md)
- Figma Make adapter 靠正则解析 JSX；条件渲染、computed className 等会给 warning。Figma MCP adapter 又仍标记为 pending。它们适合提供 candidate，不能自动成为设计真相或完成依据。[Figma Make adapter](../../../multica-agenthub/packages/core/agenthub/skills/design-fidelity-component-contract/adapters/figma-make-extractor.md)；[Figma MCP adapter](../../../multica-agenthub/packages/core/agenthub/skills/design-fidelity-component-contract/adapters/figma-mcp-extractor.md)
- AgentHub skill 自己列出响应式、暗色和 DOM 验证尚未自动接入 CI。不能以“输出了 JSON/PNG”当真实 UI QA。
- AgentHub 的 Contract 格式把 token 值和大量元素细节塞进 generated document；对 WorkflowHub 应只留 task 必需的 `UI Contract` slice，代码 token/stories 仍为唯一实现权威。

## Talk Round 2 可决选项

### 1. `Design.md` 的范围和版本

- **A（推荐）**：项目根维护一个版本化 `Design.md`；按页面/组件追加 section；每个 `ui_scope` task 的 `spec.md` 绑定 path + content hash + screen/state IDs。  
  后果：新页面可复用已有体系，当前 task 不会被后来改动悄悄改变。风险：design owner 必须维护少量版本纪律。
- B：每个 task 单独写一份 Design.md。  
  后果：任务隔离。风险：组件/token/页面规则很快分裂。
- C：没有 Design.md，只用 Figma/截图。  
  后果：工具最少。风险：无 Figma 的项目、交互状态和设计裁决仍会散在聊天里。

### 2. 组件效果图的默认实现

- **A（推荐）**：优先已有 Storybook；没有时用真实组件的稳定 preview route；同一 fixture 驱动 preview、测试和截图。  
  后果：轻，不多引工具，也不维护原型副本。风险：每个项目要声明 preview 入口。
- B：所有前端项目强制引入 Storybook。  
  后果：组件目录统一。风险：小项目多一套维护和构建成本。
- C：只在完整页面接 API 后截图。  
  后果：起步最快。风险：问题发现晚，容易回到反复补 CSS。

### 3. CSS/组件规则的强度

- **A（推荐）**：四条 owner 规则 + 变更扫描 + UI lens；例外可记录，但不能静默。  
  后果：能挡住全局覆盖和 DTO 透传，又不要求重写旧项目。风险：需要维护少量例外说明。
- B：严格全项目 token/Storybook/零 `!important` 门。  
  后果：一致性最高。风险：历史项目迁移阻力大、容易为过门而伪造。
- C：只做截图验收，不管组件/CSS owner。  
  后果：规则少。风险：视觉暂时能看，代码继续膨胀和互相覆盖。

## 来源和调研方法

- AgentHub VibeCoding workflow、skills、schema、adapter：本地直接读取，路径见文中链接。
- AnySearch（2026-08-22）：检索 Storybook portable stories/args、Playwright screenshot snapshots、DTCG token format、Figma Code Connect；结果后以官方文档为准。
- Figma, [Code Connect introduction](https://developers.figma.com/docs/code-connect/)，访问于 2026-08-22。
- Storybook, [Args](https://storybook.js.org/docs/writing-stories/args)；[Stories in unit tests](https://storybook.js.org/docs/writing-tests/integrations/stories-in-unit-tests)，访问于 2026-08-22。
- Design Tokens Community Group, [Format module](https://tr.designtokens.org/format/)，访问于 2026-08-22。
- Playwright, [Visual comparisons](https://playwright.dev/docs/test-snapshots)，访问于 2026-08-22。

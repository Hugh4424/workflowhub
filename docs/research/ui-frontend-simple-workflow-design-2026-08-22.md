# UI 与前端：最小可执行流程设计

**日期**：2026-08-22  
**性质**：WorkflowHub 改进建议；未改生产流程，未证明任何 UI 已通过。  
**范围**：只讨论未来项目的 UI 提示词、组件驱动效果图、设计资料、前端样式质量和验收；不改变五阶段，不增加第五份当前材料，不引入自动修复阻塞门。

## 结论

推荐把 UI 任务收敛为一条短链：

`确认视觉方向 → 冻结设计源 → 静态组件拼版 → 接真实行为 → 三类验收`

这是现有五阶段中的内容，不是新阶段：

| 当前阶段 | UI 只做一件事 | 唯一产出位置 |
| --- | --- | --- |
| `make-decision` | 判定是否有 UI scope、谁确认视觉 | `decision-log.md` |
| `build-spec` | 冻结设计源和页面状态合同 | `spec.md` |
| `build-plan` | 映射组件、CSS owner、fixture、验收 | `plan.md`、`tasks.md` |
| `build-code` | 先静态拼版，再接状态和接口 | 代码、task 执行事实 |
| `verify-code` | 分开看行为、视觉、可访问性 | 现有质量事实 |

核心改动不是多加审核，而是**在接 API 以前让真实组件先渲染出效果图**。用户或设计 owner 早看一次固定视口的页面，后续 agent 不再靠聊天中的“差不多”猜布局。

## 不新增 `Design.md` 作为 WorkflowHub 材料

当前宪法和各阶段都规定：`decision-log.md`、`spec.md`、`plan.md`、`tasks.md` 是唯一当前工作真相。`Design.md` 若同时保存设计决定、任务和验收，会成为第五份会漂移的真相，不能新增。[宪法 F3](../../CONSTITUTION.md)；[build-spec 边界](../../workflows/build-spec/SKILL.md)。

但项目可以有一个外部设计源，名字可以是 `Design.md`。它的身份必须很窄：**项目设计 owner 维护的输入**，不是 WorkflowHub 的阶段材料、任务表、测试报告或完成状态。

- 已有 Figma、已授权 HTML 原型或设计系统时：它们是设计源；不再创建 `Design.md`。
- 没有设计工具时：允许项目根目录的 `Design.md` 作为设计源。`spec.md` 只绑定 `path + Git SHA`；内容变化后必须重新绑定。
- WorkflowHub 可以根据决策草拟 UI 提示词，但不拥有外部设计源。设计 owner（用户、指定设计师，或明确授权的 agent）确认实际效果后，`build-spec` 才把来源写入 `UI Contract`。
- build-code 发现需要改变信息层级、交互或视觉方向，不能暗改 `Design.md`。它把具体差异返回 `make-decision` 或 `build-spec`；只修实现错误可留在同 task 修复。

这样既支持用户要的 `Design.md`，又不把它升级为第五份运行时真相。

### 最小 `Design.md` 格式

只在「无 Figma/原型」时使用。文件不放 task、代码路径、测试命令、通过状态或历史流水。

```md
# Design Brief — <feature>

- Owner: <human/design owner>
- Scope: <routes / areas>
- Source mode: original-design | reference-reproduction
- Render target: desktop 1440×1024; mobile 390×844
- Design system: <existing token/component source or none>

## Primary journey
<who enters, what they decide, what success looks like>

## Screen contracts
### <screen>
- Hierarchy: <top-to-bottom information order>
- Layout: <regions, density, responsive rule>
- Components: <component + variant + purpose>
- States: default | loading | empty | error | locked | long-content
- Interactions: <click, keyboard, focus, hover, dialog>
- Content rules: <realistic labels, limits, overflow>

## Visual direction
- Tokens: <color, type scale, spacing, radius, elevation>
- References: <approved image/Figma/prototype refs>
- Exclusions: <what must not appear>
```

“Owner”是内容责任人，不是新的 workflow role 或 runtime 状态。视觉事实最终仍以 `spec.md` 中绑定的 ref/hash 为准。

## UI Prompt：先设计，后实现

提示词不是规格替身，也不应直接要求模型“做一个好看的页面”。它只用于产生或修订设计源。一次提示词必须带齐以下 10 项：

1. **任务与用户目标**：用户是谁、关键决策是什么、完成后看见什么。
2. **模式**：`reference-reproduction`（忠实还原）或 `original-design`（允许设计探索）。两种模式不能混写。
3. **设计依据**：Figma/frame、原型、现有组件库、已有页面截图；没有就明确 `none`。
4. **页面边界**：路由/区域、最多两个关键屏幕、固定桌面和移动视口。
5. **信息层级**：从上到下列出内容优先级，不用“现代、简洁、高级”代替。
6. **组件清单**：必须复用的组件、允许新增的组件、各 variant 和禁止替代的元素。
7. **真实形状数据**：字段、长度、数量级、空/错误/锁定/长内容，不给虚假的 API 契约。
8. **视觉约束**：design token、密度、排版、间距、响应式规则、禁用的样式或图库。
9. **交互约束**：hover/focus/keyboard、弹层、加载、失败、不可操作时用户看到什么。
10. **交付格式**：每个屏幕输出结构说明、组件实例、状态和可审查效果图；不输出生产代码。

通用提示词骨架：

```text
Mode: <reference-reproduction | original-design>.
User outcome: <one sentence>.
Authority: <Figma/prototype/Design.md ref and hash, or none>.
Target: <route/area>; render <viewport A>, <viewport B>.
Use only: <existing components and variants>; new components: <explicit list>.
Hierarchy: <ordered regions and priority>.
Data and states: <fixture shape; default/empty/loading/error/locked/long-content>.
Visual rules: <tokens, density, responsive behavior>.
Interaction rules: <focus, keyboard, hover, dialog, failure feedback>.
Do not: invent features, change hierarchy, use arbitrary stock assets,
connect a backend, add global CSS, or write production code.
Return: <screen composition + state annotations + renderable visual>.
```

`reference-reproduction` 下，模型不得补全缺失视觉；缺失项列为 `OPEN`。`original-design` 下，第一张效果图必须由设计 owner 确认，再冻结为设计源。两种模式都不把生成图当成实现验收。

## 基于组件出效果图：一个静态拼版任务

不先搭完整页面、接假 API、再用 CSS 补救。`build-plan` 将每个主要屏幕拆成同一 Phase 内连续的三张 task 卡：

1. **静态拼版**：实际组件 + 确定性 fixture，在固定视口渲染默认态；只处理信息层级、布局、token 和响应式。产出首张可审查截图。
2. **状态与交互**：给相同组件接 `loading/empty/error/locked/long-content`、键盘和重点交互。
3. **真实接线**：DTO adapter → UI view-model → 组件。组件不直接吃宽松 API 对象；后端字段漂移不能沉默显示为空。

这三张卡不是三阶段。小改动可合并为一张；页面重做才拆三张。每张卡复用**同一 fixture 名、相同视口和状态 ID**，避免 design mock、story mock、E2E mock 三份漂移。

优先使用已有 Storybook/组件目录渲染。如果项目没有它，增加一个只供测试的稳定预览 route；预览必须渲染**真实组件**，不能新建第二套 HTML/CSS。story/preview 是组件效果图、视觉基线和复查共同入口，不要求把 Storybook 变成 WorkflowHub runtime 依赖。这个方式符合 stories 是可渲染组件状态这一外部实践结论。[前一轮研究](ui-delivery-contract-external-practices-2026-08-22.md#2-实现用-stories-消除-agent-猜测)。

## 只追加一个 `UI Contract` 小节

`spec.md` 已拥有产品流程、状态、AC 和失败边界；最小变化是在 `ui_scope: true` 时追加 `## UI Contract`。非 UI 任务只写 `N/A — no user-visible surface changed`。

```md
## UI Contract

- scope: <route/area>; mode: <reference-reproduction|original-design>
- visual owner: <human/design owner>
- design source: <figma/prototype/Design.md ref>; revision: <version or Git SHA>
- render targets: <browser>; <desktop viewport>; <mobile viewport or N/A>
- component source: <existing component/token source>

| Screen / state ID | Hierarchy + interaction contract | Component variants | Fixture ID | Screenshot ID |
| --- | --- | --- | --- | --- |
| UI-01/default | <short observable rule> | <actual names> | fx-ui-01 | ui-01-default-desktop |
| UI-01/error | <short observable rule> | <actual names> | fx-ui-01-error | ui-01-error-desktop |

- visual exclusions: <must not appear>
- a11y intent: <keyboard/focus/name requirements>
- change rule: design-source or hierarchy change returns to build-spec; implementation mismatch stays build-code
```

`decision-log.md` 只记录 `ui_scope`、模式、设计 owner 和方向选择；`plan.md` 只记录组件/样式/fixture/test mapping；`tasks.md` 只记录执行。任何一个文件都不复制整份设计稿。

现有 `build-spec` 已要求覆盖流程状态、可观察 AC、失败条件和不猜测缺失决定；现有 `plan-design-review` 已只在 UI scope 运行。因此应扩展它的输入和 findings，而不是新增一个设计阶段或第二个设计审查器。[build-spec](../../workflows/build-spec/SKILL.md)；[现有 UI lens](../../skills/plan-design-review/SKILL.md)。

## 组件与 CSS 质量：只管四个硬边界

不靠 CSS 行数或“代码优雅”打分。每个 UI task 在 `plan.md` 声明以下边界，`verify-code` 检查真实消费者：

1. **一层 token 权威**：颜色、字体、间距、圆角、阴影只来自现有 token/theme；新 token 写明 owner、consumer 和删除条件。
2. **一处样式 owner**：组件控制自身样式和 variant；页面只控制页面布局。feature CSS 不跨组件选择器、不覆盖旧页面、不碰全局 reset。
3. **一条数据入口**：API DTO 经 typed adapter 变为 UI view-model 后再给组件；fixture 与 view-model 同形，不使用 `Record<string, unknown>` 透传。
4. **一条例外记录**：第三方组件无法避免的 global selector 或 `!important` 必须写入 task，附 selector、原因、consumer 和删除条件；没有记录就是 defect，不以“能显示”为理由接受。

推荐加很小的静态检查，不绑定框架：扫描本次变更中的 `!important`、无 scope 的全局 selector、跨 feature import 和未注册 token；发现后报告文件和消费者。它是质量 finding，不自动停止同 task 修复，也不以新增“CSS 平台”解决旧代码。

## 验收：三种事实，不能互相替代

| 事实 | 最小方法 | 证明什么 | 不能证明什么 |
| --- | --- | --- | --- |
| 行为 | 真实浏览器关键旅程 | 点击、状态、失败反馈 | 视觉是否还原 |
| 视觉 | 固定环境截图与 diff | 布局、样式、溢出回归 | 变更是否符合意图 |
| 意图 | design owner/独立 reviewer 看合同和 diff | 变化是否被接受 | 代码是否无 bug |

**行为**复用 `isolated-browser-qa`：一个 task 一个 session、一个 engine、运行前后清理、不得触碰用户浏览器或停掉 app。现有输出已要求 route、scenario、截图、测试命令、hash 和 cleanup；补充 UI Contract 的 `fixture_id`、viewport、design-source revision 和 visual status 即可。[浏览器 QA 合同](../../workflows/verify-code/isolated-browser-qa.md)。

**视觉**优先项目已有 Playwright screenshot（或等价工具），固定 browser/OS/font/headless、视口、时钟、网络和 fixture。基准更新要有实际 diff 和理由；不能自动更新，不能靠提高阈值治绿。外部实践也明确：动态内容应冻结，功能测试无法发现被 CSS 遮住的按钮。[前一轮研究](ui-delivery-contract-external-practices-2026-08-22.md#已证实的外部事实)。

**意图**只用于页面重做、视觉敏感页面或 `reference-reproduction`。由 visual owner 或独立 reviewer 确认“符合”或写下具体偏差。缺少该事实只能报告 `incomplete`，不阻止同 task 修复，更不允许实现 agent 自己判自己的截图已经符合。

`verify-code` 的 UI lens 顺序固定：先设计源/合同，再 DOM 与组件映射，再状态和窄屏，再 CSS owner/数据入口，最后行为、视觉和 a11y 事实。它报告 defect 或 unavailable，不重写上游材料，也不创造新 gate；这与现有 review 是质量事实、不能阻止同 task 修复的边界一致。[宪法 F4](../../CONSTITUTION.md)。

## 低成本豁免

`ui_scope` 由 `make-decision`/`build-spec` 依据用户可见范围写入，不接受 build-code 自报 `false`。实际 diff 若含页面、组件、样式、文案层级或交互，`verify-code` 必须报告 scope 不一致。

- **非 UI**：没有用户可见表面变化。写 `N/A` 和原因，零额外任务。
- **视觉无关的前端内部改动**：保留一次已有行为测试；不要求截图，但写清无可见变化依据。
- **微小 UI 改动**：一个受影响状态、一个固定视口截图、一个行为断言；不要求全站基准或 Design.md。
- **没有可用视觉测试环境**：执行浏览器行为和人工截图，视觉事实标 `unavailable`；不能叫“视觉已通过”。
- **没有已有设计源的原创页面**：先输出一张组件拼版效果图并得到 visual owner 方向确认；不伪称像素复现。

## 最小实施拆解

1. **材料与 design lens**：给 `make-decision` 加 UI triage；给 `spec-template`/`build-spec` 增加条件 `UI Contract`；扩展现有 `plan-design-review`，检查 design source、模式、状态矩阵和 visual owner。
2. **计划与执行**：给 `plan-template`、`tasks-template`、`build-plan`、`build-code` 增加静态拼版 → 状态 → 接线的可选 task 结构，以及 token/CSS owner、fixture 和 preview/story mapping。复用现有 `frontend-testing`，不新建 runtime。
3. **证据与审查**：扩展 `browser-qa-evidence.v1` 的 UI 分支，绑定 viewport、fixture、design revision、visual evidence status；给 `verify-code` 增加上述单一 UI lens 和豁免核验。
4. **负例测试**：`ui_scope` 缺 design source、`reference-reproduction` 缺 visual owner、错误 source revision、截图缺 viewport/fixture、自动更新基准、`ui_scope=false` 但改了样式/页面、未说明 `!important`，均不能形成“视觉已确认”事实；仍允许同 task 修复。

实施顺序是 1 → 2 → 3 → 4。第一步就能让后续 PaperBuilder 前端任务在写功能 plan 前冻结 UI 方向；后面三步才把质量要求变成可执行、可审查事实。

## 证据来源

- [CONSTITUTION.md](../../CONSTITUTION.md) — F3 四材料、F4 质量事实与同 task 修复边界。
- [workflows/build-spec/SKILL.md](../../workflows/build-spec/SKILL.md) — `spec.md` 所有权、状态/AC 与不新增第二权威。
- [workflows/build-plan/SKILL.md](../../workflows/build-plan/SKILL.md) — plan/task 所有权、RED/GREEN、quality facts 非 gate。
- [workflows/build-code/SKILL.md](../../workflows/build-code/SKILL.md) — 现有 testing route、真实浏览器行为和 task 执行边界。
- [skills/plan-design-review/SKILL.md](../../skills/plan-design-review/SKILL.md) — 已存在的 conditional UI advisory lens。
- [workflows/verify-code/isolated-browser-qa.md](../../workflows/verify-code/isolated-browser-qa.md) — 现有浏览器 QA 运行和 evidence contract。
- [ui-delivery-contract-external-practices-2026-08-22.md](ui-delivery-contract-external-practices-2026-08-22.md) — Figma、Storybook、Playwright、Chromatic 的一手资料结论。

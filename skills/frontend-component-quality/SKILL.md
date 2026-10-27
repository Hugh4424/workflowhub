---
name: frontend-component-quality
description: 为 UI phase 维护组件、状态、ViewModel 与 CSS/token 的可复核质量地图。
---

# Frontend Component Quality

公开入口只有本技能。它输出 **Component Quality Map**，并核对目标项目当前源码中的真实消费者；真实盘点缺失时明确记 unknown/unavailable；不替代 frontend-testing，不创建新 stage、第二 workflow、第二 entrypoint、独立 evidence store 或质量 gate；它是 no stage、no gate 的质量 lens。

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

消费者盘点必须是可重放的 `consumer-census.v1`：输入包含 scanner version、扫描实际读取的源码 snapshot、
scan config 和 route/import/lazy/CSS/data 的逐项 support matrix；输出按稳定 `consumer_id`
排序。动态加载、生成代码、未支持框架、扫描失败和语义不确定必须带枚举 `unknown_reason`。
人工体验/视觉语义只追加 `source=human`，不能覆盖扫描原始项；没有真实 consumer 时保留
`unknown`，不能声称 component map 已完整。

### 两条链资产检查（C03）

**适用范围**：回测工作台与业务日志两条链，分别核前端组件、前端布局、设计组件、设计布局。开工读当前任务的 `quality/evidence/P1-ledger.json` 对象与 `mapping`，沿条目回读真实实现、消费者及设计源；用途、约束、变体与插槽以条目语义为准，同名不等于同义。台账是唯一对象清单，本段只提供检查方法。

**检查规则**：对每个选择记 `reuse`、`compose` 或 `gap`，分别说明用途依据、真实使用点、消费者与未知。用途、约束及合法变体已有对应且保留状态与插槽时选 `reuse`；现有对象需按布局组合且各自职责、状态归属仍明确时选 `compose`；两者都不能满足的具体语义缺失才记 `gap`，定位最小缺口及影响。回测链按台账区分曲线共享实现、绩效组合与声明的静态扫描范围内未见生产渲染、动态字符串／生成代码／跨项目运行时使用仍未知的旧表单；业务日志链按台账核页面、视图、行与详情浮层的职责及键盘入口，不用截图相似替代用途与真实调用。资产选择沿用项目组件、样式与交互语义；组合保留已有状态和可达操作，读改动两侧防止删掉合法分支。这里的三选一是资产判断，既有 Map 的 `action` 字段及其要求仍照上文记录。

**未知与缺失**：查不到的用途、消费者、合法配法或来源写 `unknown`／`unavailable`，附原因、已查范围与应补证的对象 owner；不能推成零消费者、允许删除或已批准复用。台账缺任一链的资产语义时交回台账作者，已有可定位部分继续如实记录；精确 props/API 与 token/CSS 数值回各自原源。

**来源与偏离**：对象依据只取当前任务 P1 台账及其原文引用。概念参考分别来自 [better-ui](https://github.com/vaferkhanom/Website-skills/blob/24f2b173f84bcf661d8e912dcbfb83d5fdf73d4e/better-ui/SKILL.md) 的既有组件与视觉语汇保留、[better-accessibility](https://github.com/vaferkhanom/Website-skills/blob/24f2b173f84bcf661d8e912dcbfb83d5fdf73d4e/better-accessibility/SKILL.md) 的语义与键盘操作、[interface-review](https://github.com/vaferkhanom/Website-skills/blob/24f2b173f84bcf661d8e912dcbfb83d5fdf73d4e/interface-review/SKILL.md) 的消费者范围与删除侧读回、[vercel-composition-patterns](https://github.com/vaferkhanom/Website-skills/blob/24f2b173f84bcf661d8e912dcbfb83d5fdf73d4e/vercel-composition-patterns/SKILL.md) 的按职责组合。该 commit 仅标本次可读镜像坐标，历史采用绑定与完整许可原件未取得，维持原缺口；本段原创表述，不复制其核心段落。既有 React/Next 参考仍只读下节及随包21行派生摘要，不视为完整上游。偏离：不写像素阈值、token 数值或精确 API，不引整包、不新增检查器；资产检查不能冒充浏览器、可访问性或工程验收通过。C06 只读引用本段资产输入，语义变更交回本卡 owner 另立卡。

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

本技能不重新设计视觉、不调用浏览器。沿 `skills/project-norm-init/SKILL.md` 的「规范职责」取本动作适用专业源的组件/布局/工程/质量规则，各类真实path/稳定节、version/作用域、owner/consumer 和缺口可定位；任务状态和实际测试结论留当前 task spec/facts，不写成专业规则或旧 Experience.md 历史。build-plan 只设计地图，build-code 按真实 diff 回填并调用具体 testing skill，build-code 的终末独立执行者检查真实 consumer、兼容性和 CSS/token 泄漏；不新增独立阶段。

## 固定来源与偏离

来源权威：[catalog](../catalog.yaml#skills.frontend-component-quality)；本便携小卡非权威；单技能副本缺catalog时向来源维护者取登记。
React/Next采用章节见catalog对应adopted。本地 Component Quality Map、真实 consumer census 与静态 CSS 检查仍归本技能；上游性能建议不替代浏览器验证。迭代按本节固定子文件核更新，保随包 LICENSE/UPSTREAM 并经人工比较，不自动追 HEAD。

## 写作规范

创建或改写 agent 方法时，读取 `skills/spec-specify/SKILL.md` 的「技能写作规范（WR001）」唯一规范；此处不复制规范。

## 同仓方法依赖

`skills/spec-specify/SKILL.md`、`skills/project-norm-init/SKILL.md`；按上文实际条件读取，搬运时需同时提供或由调用者提供可读原件。

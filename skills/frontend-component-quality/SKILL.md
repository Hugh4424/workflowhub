---
name: frontend-component-quality
description: 为 UI phase 维护组件、状态、ViewModel 与 CSS/token 的可复核质量地图。
---

# Frontend Component Quality

公开入口只有本技能。它输出 **Component Quality Map**，并核对目标项目当前源码中的真实消费者；真实盘点缺失时明确记 unknown/unavailable；不替代 frontend-testing，不创建新 stage、第二 workflow、第二 entrypoint、独立 evidence store 或质量 gate；它是 no stage、no gate 的质量 lens。

## 触发与实现前就绪

计划和实施先合看用户原始需求、项目真实前端库存与消费者、已接受计划或实际差异；页面、路由、组件或样式改动且有真实消费者时，实际执行 [实现就绪](references/implementation-readiness.md)。纯后端、纯文档或已证实无前端消费者时记 `N/A` 和依据，不建空表；消费者未知保 `unknown`，查明前停受影响路径，不当作无消费者。React/Next 规则只在技术栈确认时适用。

UI 实施前按参考逐项核规范、资产、设计输入、检查命令与测试数据，填写来源、缺口和处置；记录缺失时先补记录。依据处置先补、继续或只停受影响路径。实现时继续使用下方 Map 和真实消费者，检查与独立审查沿各自方法留原件；读取参考或填表不等于完成消费或验收。

## Component Quality Map

每个 UI phase 记录：

- `action`：`reuse`、`modify`、`extend-state-or-variant`、`add-local`、`extract-shared` 或 `remove-after-no-consumers`；
- affected component、每个真实 `real consumer`、兼容影响、props/events、状态 owner 和 typed ViewModel；
- 唯一 CSS/token owner、项目实际命令、browser scenario、viewport、fixture、截图状态和 coverage limits。

页面状态与 typed ViewModel 沿真实页面投影、当前 task/API 和各自 owner
取源，说明输入事实如何成为显示、筛选和可用操作。静态适配也须保留
这些语义；改变原投影时说明任务依据与影响。组件的展示/事件能力与
页面须完成的业务判断分别记录。

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

页面或布局需要组合时，在同一 Map 的用途与真实使用点中说明选择：
已有适用资产时，实际读取其画面与对应结构，核区域、层级、密度、
内容增长和操作关系的用途与限制。已核明确没有现产品或同场景资产，
仅将该项资产或比较面记不适用及原因。其余现有资产和规范继续消费；
沿真实需求、业务语义和可用专业规范形成关系，
说明 gap 与任务局部选择。存在但未读或不可读仍为 unknown/unavailable，
仅限制依赖该来源的判断；不捏造资产，也不因此阻断无稿原创。
按任务选择复用、组合或补缺，
把采用的关系交当前原型/实现作者；组件 import 只证明实现复用，
页面组合是否成立还须对照实际呈现与完整任务。

每个采用关系要能定位到真实组件/DOM 使用点及相应渲染区域，说明
调整理由、状态与样式 owner、DOM 与视觉顺序、适用限制和未知。
生成前记计划落点；生成后作者沿实际源码与渲染回读同一 Map，核实
落点及采用关系，差异在原记录更正或说明。未核的仍记计划/未知，
不把 Map 已填写当作已应用。
精确 API/token 仍回原源；规范不足时保原 owner 未决，任务局部选择
与来源事实分开。作者消费这些关系形成整页方案，独立 reader 核
实际使用；这里不生成新的共享布局包或第二套视觉规范。

### 变更影响与定向更新

需求、行为、组件或样式变更涉及既有消费者时，先读当前影响表与已确认规格，
核对旧→新行为、来源与版本、允许写集及失败语义，不把历史坐标当当前源码。
沿变更入口核直接使用点，再沿调用、组合或路由至少一层核间接消费者；
两层只是本次已查边界，未扫路径、动态装载及不可读源写unknown与原因，
附已查范围、原owner和下一处可补证位置，不据零命中推无消费者或允许删除。
输入是当前影响表、源字节与实际调用；输出仍放当前任务既有影响说明或Map，
逐项写改变、保持、未知、理由与真实使用点，不新建进度表、扫描器或质量gate。
只回写受影响的规范原源、实现与具名测试；状态、焦点、布局和错误通道各归原owner，
共享样式先核消费者，不用局部修复改变其它页面，也不靠全量测试代替影响判断。
失败回原owner并定向复验；环境或来源不可用保unknown/unavailable和恢复条件，
正文写入、方法执行、独立验证及后续采用分别留原件，不能互相冒充。
来源与版本：本节采用本地固定副本的变更影响步骤，
见[执行与变更指南](../external/spec-driven-production/references/execution.md#变更影响分析与续作)
及[来源登记](../external/README.md#spec-driven-production)，不复制上游规格正文。
原owner为前端组件质量方法维护者；使用点是既有Component Quality Map之后、
C03资产选择之前的影响核对，直接消费者为当前UI实施者与独立验收者。
复制/分发权利未声明仍为unknown；本任务按用户授权个人研究执行，不写已获许可。

### 两条链资产检查（C03）

**适用范围**：按当前任务分别核前端组件、前端布局、设计组件、设计布局，沿以下规则选择。回测工作台与业务日志两条链是原 C03 历史样例，不限制其它任务采用本方法。开工读当前任务已确认的具名对象输入与映射，或其适用 spec/Phase 清单，沿条目回读真实实现、消费者及设计源；缺清单时记录具体缺项、提供者和影响，不猜别的任务私有路径；用途、约束、变体与插槽以条目语义为准，同名不等于同义。上述当前任务对象输入是唯一对象权威，本段只提供检查方法；便携子任务沿其已交付输入取源，不要求额外读取宿主整份 Phase。

**检查规则**：对每个选择记 `reuse`、`compose` 或 `gap`，分别说明用途依据、真实使用点、消费者与未知。用途、约束及合法变体已有对应且保留状态与插槽时选 `reuse`；现有对象需按布局组合且各自职责、状态归属仍明确时选 `compose`；两者都不能满足的具体语义缺失才记 `gap`，定位最小缺口及影响。仅在核原 C03 两链历史样例时，沿该样例原台账使用下列专属检查：回测链区分曲线共享实现、绩效组合与声明的静态扫描范围内未见生产渲染、动态字符串／生成代码／跨项目运行时使用仍未知的旧表单；业务日志链核页面、视图、行与详情浮层的职责及键盘入口。其它任务沿当前对象用途与真实调用选择，不默认套用历史台账或上述专属检查；截图相似不能替代这些依据。资产选择沿用项目组件、样式与交互语义；组合保留已有状态和可达操作，读改动两侧防止删掉合法分支。这里的三选一是资产判断，既有 Map 的 `action` 字段及其要求仍照上文记录。

**未知与缺失**：查不到的用途、消费者、合法配法或来源写 `unknown`／`unavailable`，附原因、已查范围与应补证的对象 owner；不能推成零消费者、允许删除或已批准复用。未有当前对象清单或清单缺资产语义时，记具体缺项、提供者与影响，交回原作者；已有可定位部分继续如实记录；精确 props/API 与 token/CSS 数值回各自原源。

**来源与偏离**：上述两链历史对象依据取原 C03 的 P1 台账及其原文引用；当前任务对象沿其具名清单与真实源，不移用历史私有路径。概念参考分别来自 [better-ui](https://github.com/vaferkhanom/Website-skills/blob/24f2b173f84bcf661d8e912dcbfb83d5fdf73d4e/better-ui/SKILL.md) 的既有组件与视觉语汇保留、[better-accessibility](https://github.com/vaferkhanom/Website-skills/blob/24f2b173f84bcf661d8e912dcbfb83d5fdf73d4e/better-accessibility/SKILL.md) 的语义与键盘操作、[interface-review](https://github.com/vaferkhanom/Website-skills/blob/24f2b173f84bcf661d8e912dcbfb83d5fdf73d4e/interface-review/SKILL.md) 的消费者范围与删除侧读回、[vercel-composition-patterns](https://github.com/vaferkhanom/Website-skills/blob/24f2b173f84bcf661d8e912dcbfb83d5fdf73d4e/vercel-composition-patterns/SKILL.md) 的按职责组合。该 commit 仅标本次可读镜像坐标，历史采用绑定与完整许可原件未取得，维持原缺口；本段原创表述，不复制其核心段落。C03 当时的 React/Next 参考是21行派生摘要，不视为完整上游；摘要仅保存在源仓历史记录中，不随技能包提供，历史身份见随包 [UPSTREAM](upstream/react-best-practices/UPSTREAM.md)。当前固定源见下节。该 C03 概念段的偏离是不写像素阈值、token 数值或精确 API，不将镜像整包并入该段、不新增检查器；资产检查不能冒充浏览器、可访问性或工程验收通过。C06 只读引用本段资产输入，语义变更交回本卡 owner 另立卡。

## 按需查阅界面规则

界面实现或检查需要时，读取随包的 [Web Interface Guidelines](upstream/web-design-guidelines/command.md) 和 [better-ui](upstream/better-ui/SKILL.md)；仅取与实际页面、栈和任务相符的规则。项目已确认设计、组件、token 与交互约束优先，better-ui 的精确数值不是项目默认值；未复制的关联技能不视为可用。它们是只读参考，不新增执行器或验收结论，来源与权利边界回 catalog。

## React/Next lens

当技术栈确认是 React/Next 时，按需只读随包固定的 [react-best-practices](upstream/react-best-practices/SKILL.md) 与其规则；它提供性能和组件边界建议，不拥有 WorkflowHub 结果，也不独立触发阶段或 gate。非 React/Next 或技术栈未知时写 `N/A + reason`。每次迭代只检查固定上游是否有新版本，升级需人工比较并保留 `LICENSE`/`UPSTREAM`。

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

作为 `skills/plan-design-review/SKILL.md` 八维中组件/布局的实际消费方，沿上文Map和两条链资产检查回读真实wrapper/API、slot、状态/样式owner与消费者，检查任务声明视口的增长、滚动、浮层和关闭/焦点边界。精确值与合法配法回各原源；把组件名列入表不等于调用本方法或浏览器通过，未验证适用项保缺口。业务/视觉/交互/用户答复仍由各原owner判断，不复制第二八维规范。

本技能不重新设计视觉、不调用浏览器。沿 `skills/project-norm-init/SKILL.md` 的「规范职责」取本动作适用专业源的组件/布局/工程/质量规则，各类真实path/稳定节、version/作用域、owner/consumer 和缺口可定位；任务状态和实际测试结论留当前 task spec/facts，不写成专业规则或旧 Experience.md 历史。build-plan 只设计地图，build-code 按真实 diff 回填并调用具体 testing skill，build-code 的终末独立执行者检查真实 consumer、兼容性和 CSS/token 泄漏；不新增独立阶段。

## 固定来源与偏离

来源权威：[catalog](../catalog.yaml#skills.frontend-component-quality)；本便携小卡非权威；单技能副本缺catalog时向来源维护者取登记。
React/Next 固定规则与历史摘要的不同身份见 catalog 对应 adopted。本地 Component Quality Map、真实 consumer census 与静态 CSS 检查仍归本技能；上游性能建议不替代浏览器验证。迭代按本节固定子文件核更新，保随包 LICENSE/UPSTREAM 并经人工比较，不自动追 HEAD。

## 写作规范

创建或改写 agent 方法时，读取 `skills/spec-specify/SKILL.md` 的「技能写作规范（WR001）」唯一规范；此处不复制规范。

## 同仓方法依赖

`skills/spec-specify/SKILL.md`、`skills/project-norm-init/SKILL.md`；按上文实际条件读取，搬运时需同时提供或由调用者提供可读原件。

# 决策日志（decision-log）— C01 项目规范初始化与迁移

读者：本卡 make-decision 主会话、build-plan 与 build-code 作者，以及回读验收和风险的 verify-code 作者。
读完要能：定位真实需求、已确认决定、写入范围、验收索引与原件；区分示例、实际事实和缺口。

**状态（全文唯一一处状态声明）**：本阶段 make-decision **已完成**：

- step1～step11 已完成，含 **step7 方向审查**（原件 `quality/reviews/2026-10-14-007-make-decision-direction.json`，6 provider 全 `completed`，22 条 findings）、**step10 细节审查两轮**（第一轮 `quality/reviews/2026-10-14-020-make-decision-detail.json`，6 provider 全 `completed`，33 条 findings；第二轮 `quality/reviews/2026-10-14-027-make-decision-detail.json`，6 provider 全 `completed`，35 条 findings）、**step11 grill 四项退出检查全 pass**（`grill_summary: completed`）。
- step12 决策草稿、step13 最终确认（**已取得**，原件 `quality/evidence/human-confirmations/2026-10-14-001-make-decision-approved.md`，用户逐字答复「确认，按这份决定往下走」）、step14 确认后核对、step15 交接（原件 `quality/evidence/handoff/2026-10-14-make-decision-handoff.md`）均已完成。
- 真实事实：方向 Talk **8 批 23 问** + 逐模块收敛 **1 批 14 问** + 后续确认批（共 9 批 37 问，逐字见 `talk-batches.md`）；内部研究（迁移面审计、现场侦察、条款级映射、独立交叉核对）；补充研究三份；外部来源可达性与审查入口实测。
- 两次审查（direction 22 条 + detail 两轮 33/35 条）的逐条处置见 `quality/evidence/decision-log-refs/review-dispositions.md`。
- **未实测项（原样保留）**：本卡**没有运行**任何 PaperBuilder 构建或测试（`make check`/`pnpm`/vitest/Playwright）；外部两个固定来源的**许可与完整依赖闭包未核**。
- 已被取代的过程叙述（旧模块结构「工作包 ①～⑥」、方向假设 H1～H5、第一轮大纲、历次修订流水）整段外置在 `quality/evidence/decision-log-refs/decision-log-history-round1-2.md`，**该件是历史原件，不作为当前权威**。

## 任务身份

本节回答当前任务是什么类型。

- **任务类型**：普通任务（有实际执行目标：真实生成/迁移规范来源与 reader，并接入验收对象；不是只做规划）。
- **任务 id**：`workflowhub-ui-frontend-c01-norm-init-20261014`
- **母规划**：`specs/archive/workflowhub-ui-frontend-decision-refresh-20261013/prd.md` 卡 `C01`（第 191–208 行）、有效母决定 `specs/archive/workflowhub-ui-frontend-decision-refresh-20261013/decision-log.md` 的 `D-014`（第 202–251 行）。
- **认证 worktree**：`/Users/Hugh/Hugh/Project/workflowhub-workflowhub-ui-frontend-c01-norm-init-20261014`
- **任务分支**：`task/workflowhub/workflowhub-ui-frontend-c01-norm-init-20261014`
- **基线 commit**：`b66c134856a3b7aa13c7115b4e9a1df04dad1914`
- **任务库根**：`/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c01-norm-init-20261014`

完成判据：本节恰一次声明当前任务类型，且与用户真实声明一致。（当前声明来自母规划与用户"开始 C01 任务"的原话；用户若改类型，本节按真实声明重写。）

## 大纲地图

本节回答下游从哪里找到所需内容。按正文顶层节的实际顺序生成，本节自身省略。

- 任务身份
- 原始需求
- 需求变更记录
- 工作包与决定
- 要改哪些文件
- 范围与非目标
- 验收面
- 未决项
- 风险与延期交接
- 退役登记
- 外置事实索引

完成判据：目录每行对应一个正文顶层节，按正文顺序排列；大纲地图自身省略。

## 原始需求

本节回答每条需求来自哪里、落在哪条决定。

母规划的必要原义（用户痛点，逐字）：**「作为项目维护者，希望把真实规则整理到明确来源并让现有流程读取，以免新旧规范打架或迁移丢规则」**（`prd.md:36`，US01，主责卡 C01）。

C01 的整卡结果（逐字）：**「交付八类规范的实质生成/定位方法、必要缺口处理、旧条款与真实 reader 迁移及验收对象合同接入；消费者是项目维护者及现规划、原型、实施、验证入口。主责为现 ui-project-init 与各专业规范 owner。」**（`prd.md:193`）

| source_id | 需求/约束（原义） | 来源引用 | 落点 |
| --- | --- | --- | --- |
| R-C01-01 | 项目维护者要把真实规则整理到明确来源并让现有流程读取，不新旧规范打架、不迁移丢规则 | `prd.md:36`（US01） | ADR-C01-001 / ADR-C01-004 / ADR-C01-006 |
| R-C01-02 | 交付八类规范的实质生成/定位方法、必要缺口处理、旧条款与真实 reader 迁移、验收对象合同接入 | `prd.md:193` | ADR-C01-001 / ADR-C01-004 / ADR-C01-006 / ADR-C01-009 / ADR-C01-014 / ADR-C01-015 |
| R-C01-03 | 实现 S2 的八类分权及三种生成入口（新项目目标/方向/栈；已有可信规范；已有实现的可证明事实），不抄第二份 token/API | `prd.md:196`（C01-F1）、`prd.md:75-86`（S2）、`decision-log.md:221` | ADR-C01-014（三入口方法实现）；**缺口**：新项目入口无真实材料，AC-C01-1 如实记未完成 |
| R-C01-04 | 迁移上述 producer/reader 与有效规则 | `prd.md:196`（C01-F2） | ADR-C01-001 / ADR-C01-002 |
| R-C01-05 | 将 S5 验收对象实际接入当前 spec/实现/验证使用；缺工作区、服务、route、状态或 viewport 等必要项报具体名称；owner 缺省显式为用户 | `prd.md:196`（C01-F3） | ADR-C01-009（落点已定 = `spec-template.md` 验收对象区块） |
| R-C01-06 | 实际采用 SDD/材料评估等原能力并履行 S3，不新建维护 skill | `prd.md:196`（C01-F4） | ADR-C01-015（含派生验收子判据 AC-C01-F4） |
| R-C01-07 | 后续实现必须调整 `ui-project-init` 规范 producer、`build-plan` 读取、`frontend-testing` 来源/AC 关联、`verify-code` 验证；先从已知链核扩展，**不断言只有四处** | `decision-log.md:227` | ADR-C01-001 |
| R-C01-08 | 不新增/不强制 `Experience.md` 为规范权威，但**不删除、不改写历史**；其有效条款逐条核来源/适用/冲突及仍依赖它的 consumer，分配到相应专业源；未迁条款显式记影响/承接者，不静默丢规则、不批量删除、不假报已迁 | `decision-log.md:224-225` | ADR-C01-004 / ADR-C01-006 / ADR-C01-016 |
| R-C01-09 | 目录只用既有 `specs/design/`、`specs/frontend/`，**不创建 `spec/`**；领域语义直接复用既有 `GLOSSARY.md`，**不新增 `domain.md`** | `decision-log.md:231`、`decision-log.md:78-79`（U-019/U-020） | ADR-C01-004 / ADR-C01-008 |
| R-C01-10 | 安全隐私/输入处理、无障碍/包容性、国际化、响应式极值、性能、错误竞态横贯上述原 owner 与项目已有基础规范，**不另造第九规范平台** | `prd.md:88` | `## 范围与非目标` 非目标项 |
| R-C01-11 | 非目标：不全库迁移、不生成八个空文件、不负责未来持续升级（C08）、不做新设计源采集（C04） | `prd.md:194` | `## 范围与非目标` |
| R-C01-12 | 每类规范只在缺少同职责实质来源时用默认文件名；同目录有等价内容时复用；token/源码/API/Figma 资产/上游技能原件保持原位，不复制成第二真相 | `prd.md:75`、`decision-log.md:231` | ADR-C01-004 / ADR-C01-005 / ADR-C01-008 |

原始需求侧的编号体系另有两条来源，作为本卡的上游溯源（本卡不重编号）：

- 旧 PRD 卡号：**`C01` = OLD `T02` 的 FR1/FR2/FR5 + AC1/AC3/AC4**，加 `T08` 的 FR4/FR5（规范/术语）；`T02-FR3`（stylelint 规则包）归 **C06**，不是本卡。来源：`prd.md:469-494`。
- 旧需求覆盖编号：已由母决定 `decision-log.md:45-52` 分组成组承接；本卡直接相关的是「规范/证据分层」与「owner、规范回写」两组。

完成判据：每条真实需求有 source_id、原义、来源与落点；缺来源逐项写明。需求已逐条落到具体工作包/决定或具名缺口（见上表与 `## 验收面` 覆盖结论）。

## 需求变更记录

本节只指向需求变更的唯一原件；完整变更记录整节外置，主文保留每 U 的最小决定、受影响落点与来源指针。

完整变更记录整节外置在本卡唯一原件 [requirement-change-log.md](/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c01-norm-init-20261014/quality/evidence/decision-log-refs/requirement-change-log.md)；用户逐字原话在同一基准目录 `talk-batches.md`。本卡 U 逐字原话的批次锚点：001～003 在 `batch-001`，004 在 `batch-002`，005 在 `batch-003`，006/007 在 `batch-005` 与 `batch-006`，008 在 `batch-008`。

**继承自母规划的 U**（引用母规划原件，不复制全文）：

| U | 最小决定 | 受影响落点 |
| --- | --- | --- |
| 母 U-014/U-015 | 委托 Agent 决定每项目专业规范来源与更新流程；`Experience` 不管任务/状态/取消/恢复 | 母决定 `D-014`；本卡按 `D-014` 实施 |
| 母 U-019 | 领域业务语义直接复用既有 `GLOSSARY.md`、不新增 `domain.md`；设计/前端规范分别归指定目录 | 本卡 WP1/WP2、写集 |
| 母 U-020 | 更正 U-019 的目录拼写：不是 `spec/`，而是既有的 `specs/`；唯一目录为 `specs/design/`、`specs/frontend/` | 本卡 WP1/WP2、写集 |

**本卡自己的 U**（2026-10-14 用户真实答复，逐字见 `talk-batches.md` 对应批次；完整变更记录在本卡唯一原件里）：

| U | 最小决定 | 受影响落点 |
| --- | --- | --- |
| U-C01-001 | 真实项目改用 **PaperBuilder**（`/Users/Hugh/Hugh/Project/PaperBuilder`），设计稿来源改指 `/Users/Hugh/Downloads/UI`；用户授权 Agent 据此自行设计需求，目标是「实现有稿和无稿的UI验证」 | `## 范围与非目标`、`## 工作包与决定`、`## 验收面`、`## 未决项`（OI-C01-011/012/015） |
| U-C01-002 | C09 所需的样本、可运行环境、改造前基线准备，放进**本 C01 任务**作为独立工作包；不替代 C09 最终验证、不构成其它卡开工门、不计入 C01 自身 AC 完成声明 | WP-B；`## 要改哪些文件`；母规划 `prd.md:145/175/371` |
| U-C01-003 | 规范文件只创建审计确认真实适用的类，其余逐类写明不适用理由；C01 本卡 UI 设计展示记 `not_applicable` | `## 工作包与决定`、`## 验收面`（AC-C01-1 的「可消费或具名不适用」）；母规划 `prd.md:75/197/30` |
| U-C01-004 | 载体事实修正：母规划「两页 Next.js 载体」改为 **PaperBuilder 的 React 19 + Vite SPA**；`SimulationBoard`/`SimWorkbench` 记为设计源原型工程页面，不是 PaperBuilder 生产页面 | `## 范围与非目标`；母规划 `prd.md:24/147/366/369`；C09 对象定义 |
| U-C01-005 | 旧版本钉 **`b66c1348`**（唯一口径）；改造前基线**只钉住对象与口径、不真跑**；PaperBuilder 侧**开专用分支、验证后合并回 main** | WP-B、`## 范围与非目标`、`## 风险与延期交接` |
| U-C01-006 | **纠正落点**：PaperBuilder 根 `Design.md` 要**基于真实内容按八类迁入 `specs/design/`**，且迁移时**逐条检查内容是否需要更新**；推翻主会话 batch-004 的推断 | ADR-C01-004、ADR-C01-005、ADR-C01-012、ADR-C01-016；`## 范围与非目标` |
| U-C01-007 | 执行顺序：**先钉基线，再改** | ADR-C01-004 与 ADR-C01-010 的顺序硬约束；`## 风险与延期交接` |
| U-C01-008 | PaperBuilder 侧**按母规划 S2 分文件建**（不收缩为一份）；不采纳 detail 审查 F-DET2-10/25 的收缩建议 | ADR-C01-004、ADR-C01-016、`## 要改哪些文件` |

完成判据：每个真实 U 都有最小决定、受影响落点与唯一原件指针；本卡 U **U-C01-001～U-C01-008** 全部指向本卡唯一原件（主文 U 表与原件逐条一致），母 U 指向母规划原件，未复制全文。

## 工作包与决定

本节回答要交付什么、为何这样做以及失败后由谁处理。

**正式模块结构（用户 q21 确认并于 batch-009 增补 WP6）**：**WP1～WP6 + WP-B**。**WP-B 是附加工作，不计入 C01 原卡 AC。**

**执行顺序（唯一编号表述）**：**WP-B 的基线口径固定先行 → WP1 → WP2 → WP3 → WP4 → WP5**；**WP6 可与 WP1/WP2 并行**。

以下各决定依据：方向 Talk **8 批 23 问** + 逐模块收敛 **1 批 14 问** + 后续确认批（逐字见 `talk-batches.md`，共 9 批 37 问）、两份真实调研（`research.md`、`research-independent-check.md`）、迁移面审计（`migration-surface-audit.md`）与现场侦察（`target-recon.md`）收敛。每个决定固定四个父字段；当前决定正文只在此写一次。18 条决定 `ADR-C01-001`～`ADR-C01-018` 全部保留，编号、标题与四字段语义不变。

**模块与决定对照**：

| 工作包 | 定位 | 对应决定 |
| --- | --- | --- |
| **WP1** | 薄规范入口与三种内容起点 | ADR-C01-014 |
| **WP2** | 六处入口与相关 caller 改读新源／契约测试／旧 ADR 处置 | ADR-C01-001、ADR-C01-002、ADR-C01-003 |
| **WP3** | 验收对象合同接入 | ADR-C01-009 |
| **WP4** | 采用 SDD 与材料评估 | ADR-C01-015 |
| **WP5** | PaperBuilder 侧规范整理（条款去向、②类值源单源化、锚名承接、死引用、接口文档索引、删根 `Design.md`） | ADR-C01-004、ADR-C01-005、ADR-C01-006、ADR-C01-007、ADR-C01-008、ADR-C01-012、ADR-C01-016 |
| **WP6** | 方法与文档缺陷修复（本卡内做） | ADR-C01-017、ADR-C01-018 |
| **WP-B**（附加，**不计入 C01 原卡 AC**） | 基线口径固定与 C09 输入契约 | ADR-C01-010、ADR-C01-013 |
| 过程记录（非交付模块） | 母规划前提修订 | ADR-C01-011 |

### WP1 — 薄规范入口与三种内容起点

**要交付什么**：`skills/ui-project-init/` 变为**薄规范入口**——只做「定位负责源 + 接线到各专业原技能 + 显露缺口」；八类内容的**三种生成入口是内容的三种起点**（新项目已确认目标/方向/栈；已有可信规范；已有实现的可证明事实），**按类分别取源，不是一个技能实现三条入口**。来源 R-C01-03（C01-F1）；消费者为现规划、原型、实施、验证入口及项目维护者。

#### ADR-C01-014 — `ui-project-init` 作「薄规范入口」：只定位来源、接线、显露缺口（C01-F1）

- **做什么**：把 `skills/ui-project-init/` 从「产出两份大文件」改为**薄规范入口**，只做三件事：①**定位**八类各自真实来源、作用域、版本、owner、consumer 与缺口；②**接线**到各专业原技能的生成/维护动作；③**显露缺口**。八类内容一律由各事实原专业 owner 写：领域语义→既有 `GLOSSARY.md` + `grill-with-docs` 领域方法；视觉设计系统→`specs/design/design.md`（精确值归真实 token/主题源，`design-tokens` 维护）；组件及设计代码对应→`specs/design/components.md` + `frontend-design`/`frontend-component-quality`；布局与场景→`specs/design/layouts.md` + `information-architecture`/`frontend-design`；通用交互→`specs/design/interaction.md` + `ui-interaction-states`；前端工程→`specs/frontend/frontend.md` + SDD；内容与设计工艺→`specs/design/craft.md` + `design-brief`/`information-architecture`；质量判据→`specs/design/quality.md` + `specs/frontend/ui-quality.md` + 现 `frontend-testing`/隔离 QA。
  - **三种「生成入口」按内容起点理解**：同一类内容按项目所处起点（新项目／已有可信规范／已有实现）取源——新项目从真实目标/方向/栈建立必要内容，已有规范先核适用/冲突再派生消费者材料，已有实现先提取可证明事实/差异、未知不脑补。**不是一个技能实现三条入口**；三条路径各自需要真实材料例（AC-C01-1）。
  - 依据：`prd.md:196`（C01-F1）、`prd.md:194`（三种起点）、`prd.md:75`；`decision-log.md:221`（三条入口原文）、`:227`（规范写主是各事实原专业 owner）、`:246`（编排只接线，不成为新规则 writer 或自创规范维护 skill）、`:233-242`（逐类 owner 与消费者）；`prd.md:104/112/203/787`（不得自建维护 skill、不得另造规范总 writer）。**用户当面裁定**（`talk-batches.md#batch-009`）：接线员只接线，内容归专家。
  - **本条的更正记录**：先前版本写「在 `ui-project-init` 实现三种生成入口并产出八类内容」，经 `research-nav-c01-and-skill-division.md` 核对，**违背 16 条原文**，已按上述回改。
- **不做什么**：**不生成八类正文**、**不成为新规则 writer**、**不新建规范维护 skill**、不抄第二份 token/API 值、不为凑三入口伪造材料。
- **风险**：①薄入口若只登记不接线，会退化成一份没人用的清单——缓解：每类必须登记真实 consumer，否则不登记；②「新项目」起点在本轮没有真实可跑对象（用户 q20 已裁定如实记缺口），该起点只能给方法实现 + 具名缺口，**不得声称已实跑**；③接线点分散在多个原技能，改动面比原计划大。
- **改动**：`skills/ui-project-init/SKILL.md`（及其 `skill-bundle.json` 如涉登记）；被接线的各原技能按各自 owner 在 WP2/WP4 内处置。
- **唯一写主**：`ui-project-init` 的 owner。

### WP2 — 六处入口与相关 caller 改读新源／契约测试／旧 ADR 处置

**要交付什么**：六处点名入口及相关 caller 真实改读八类实际来源，且旧 `Design.md`/`Experience.md` 不再是 active 路由；来源 R-C01-01/02/04/07；消费者为现规划、原型、实施、验证入口及项目维护者。

#### ADR-C01-001 — 六处入口与相关 caller 改读八类实际来源

- **做什么**：把 `ui-project-init`（producer）、`design-source-readiness`（Read Map 取值口径）、`frontend-prototype-render`、`frontend-testing`、`build-plan`（两处旧分权正文收敛为一处）、`verify-code`（职责分离判据）改为读取八类实际来源；`binding_state` 从单一 `design_revision` 改为按类。
  - 依据：审计 A 表 25 条命中；`prd.md:196`（C01-F2）；`decision-log.md:227`（须调整四处已知链，不断言只有四处）。
  - 一并处置审计额外命中的 `frontend-component-quality:61`、`isolated-browser-qa:231`、`spec-prd:45`、`reuse-registry.md:47/92-94`、`catalog.yaml:842/850`。
- **不做什么**：不改 `skills/plan-design-review/`（已解耦）与 `workflows/build-prd/SKILL.md:17`（经 readiness/render 间接继承）。不为 `workflows/build-code` 造一个不存在 reader——审计确认它当前**没有**任何旧规范 reader，按 OI-C01-018 判定「间接继承」还是「真缺口」后如实记录。
- **风险**：`build-plan/SKILL.md:19` 与 `:30` 同文件双写，只改一处会留下静默的第二 active 条款。缓解：两处同批改并收敛为单一正文；由独立审查逐处核对。未知：审计未做全库穷尽扫描（`skills/**/*.json`、`docs/templates/**`、`metrics/**`），残余未知按具名缺口保留。
- **改动**：`skills/ui-project-init/SKILL.md`、`skills/design-source-readiness/SKILL.md`、`skills/frontend-prototype-render/SKILL.md`、`skills/frontend-testing/SKILL.md`、`workflows/build-plan/SKILL.md`、`workflows/verify-code/SKILL.md`、`skills/frontend-component-quality/SKILL.md`、`skills/isolated-browser-qa/SKILL.md`、`skills/spec-prd/SKILL.md`、`skills/reuse-registry.md`、`skills/catalog.yaml`。唯一 writer 按各文件原 owner 归属，本卡不改写他人 owner 的文件意图。

#### ADR-C01-002 — 契约测试的旧字面量断言同批改到八类口径，并替换失效的负断言

- **做什么**：`tests/contract/ui-skill-contract.test.mjs:19/42` 的 `required` 字面量 `"Design.md"` 与 `assert.match` 同批改到八类口径；`:198` 只匹配 `Design\.md.*SHA-256` 的负断言替换为对新口径仍有效的负例（否则旧文件名保护静默消失）。**保留** `:142-154` 锁定的 `build-plan` 5 个 trigger 字面量不变。
  - 依据：审计 D-1/D-6；`prd.md:197`（AC-C01-2「只替换文件名即失败」）。
- **不做什么**：不放宽断言强度、不删除该测试、不为保 GREEN 保留旧字面量。
- **风险**：该硬断言构成**反向激励**——实施者可能为保绿而留下 `Design.md` 字面量，正好制造新旧双 active。缓解：由独立审查专门核对「旧字面量残留」这一事实。
- **改动**：`tests/contract/ui-skill-contract.test.mjs`（行 19、42、198；trigger 段 142-154 不动）。
- **唯一写主**：`tests/contract/` 的既有 owner。

#### ADR-C01-003 — `docs/adr/0015` supersede，解开「删除条件挂旧源引用」的死锁

- **做什么**：把仍是 `Accepted` 的 `docs/adr/0015-ui-design-source-and-initialization.md` 标为被本卡决定 supersede，指明朝向；同时解开其 `:11` 把删除条件挂在旧源引用上的死锁。
  - 依据：审计 D-4；`prd.md:88`（旧 active 引用退出）。
- **不做什么**：不改写该 ADR 的历史正文；不删除它。`docs/adr/` 无索引文件是既有事实，不为本卡新增索引控制面。
- **风险**：不改会形成「ADR 权威 vs `specs/design` 权威」的规范双 active；只标 supersede 而不处置 `design_revision`（审计 E-4：该字段在 `runtime/`、`core/`、`scripts/`、`tools/`、`config/`、`contracts/`、`tests/` 零命中、唯一消费者已消失）会留下悬挂字段。缓解：两项同一决定内处置。
- **改动**：`docs/adr/0015-ui-design-source-and-initialization.md`。
- **唯一写主**：`docs/adr/` 的既有 owner。

### WP3 — 验收对象合同接入

**要交付什么**：让合法验收对象被真实消费者使用；来源 R-C01-05（C01-F3）；消费者为 spec/实现/验证使用方。

#### ADR-C01-009 — 为「验收对象」建立真实落点，覆盖具名缺项与 owner 缺省

- **做什么**：落点定为 **`skills/spec-specify/templates/spec-template.md` 内承载 `spec.md` 的「验收对象」结构化区块**（旧 `T02-FR-1` 明写「验收对象卡是 `spec.md` 内结构化区块、**不新增材料**」）。该区块要求**工作区、服务、route、状态、viewport** 等必要项在缺失时报出**具体名称**，并要求 **owner 缺省显式为用户**；区块必须被真实消费者使用（`workflows/build-plan/SKILL.md:21` 与 `workflows/verify-code/SKILL.md:18` 是该区块的既有读取点，改为读取区块而非只给指针）。
  - **缺项拦截载体（可执行）**：新增契约测试 **`tests/contract/acceptance-object-required-fields.test.mjs`**，断言去掉工作区／服务／route／状态／viewport 任一必要项时产生**确定性报错并点名缺项**（对应用户 batch-009 的「写在模板里 + 再做一条真的会跑的检查」，也是 AC-C01-3 的证据要求）。
  - 依据：`prd.md:196`（C01-F3）；`prd.md:470`（旧 T02-FR-1/FR-5、AC-1/AC-4 的映射）；审计 E-6（live 树三处当前都只给指针，无字段要求）；`decision-log.md:123-124`（D-005 的验收对象口径）；旧 `T02-FR-1`（验收对象卡为 `spec.md` 内结构化区块、不新增材料）与 `T02-FR-5`（owner 缺省=用户）、`T02-AC-1`（缺 viewport 报具体字段名）、`T02-AC-4`（owner 缺省输出）；用户 batch-009「写在模板里 + 再做一条真的会跑的检查」。
- **不做什么**：不新增独立材料载体（旧 FR 明确「不新增材料」）；不做只写 schema 不接消费者的空壳；不做只写在模板里、没有可执行拦截载体的半截交付。
- **风险**：若落点选在 `spec.md` 模板但无消费者读取，AC-C01-3 的「只有 schema 样例、未执行 consumer 不算通过」会直接判失败。缓解：落点必须接到真实消费者并留真实运行证据，同时留下可执行拦截载体的运行输出。
- **改动**：`skills/spec-specify/templates/spec-template.md`（验收对象结构化区块）与 `skills/spec-specify/SKILL.md`（区块的填写与缺项报出规则）；`workflows/build-plan/SKILL.md:21`、`workflows/verify-code/SKILL.md:18` 改为读取该区块；**新增 `tests/contract/acceptance-object-required-fields.test.mjs`**（缺项拦截）。唯一 writer = `skills/spec-specify/` 的 owner（模板与 SKILL.md）与 `tests/contract/` 的既有 owner（拦截测试）。

### WP4 — 采用 SDD 与材料评估

**要交付什么**：按母规划的固定来源真实采用 SDD 与材料评估，并履行 S3（查新、许可/完整闭包/适配/真实 consumer 与失败验证）；**不新建规范维护 skill**。来源 R-C01-06（C01-F4）；消费者为规范 producer/reader 与项目维护者。

#### ADR-C01-015 — 采用 SDD 与材料评估并履行 S3（C01-F4）

- **做什么**：按 `prd.md:610` 采用 **`spec-driven-production`（固定 commit `000b04a2a3553bddcf991b3dc42f9a5a2746fa6f`）** 的分责/更新方法（含 `references/execution.md`），按 `prd.md:611` 采用 **`material-agent-readiness-eval`（固定 commit `b62e87f3f91868033106b21f6398f0fd6d3d2043`）** 的 GUIDE/AUDIT 动作；履行 S3 的查新、许可/完整闭包/适配/真实 consumer 与失败验证。**登记采用 + 至少真跑一次；先核许可，允许则存固定副本**（用户 batch-009 模块四）。
  - 依据：`prd.md:196`（C01-F4）；`prd.md:610/611`（固定来源与状态）；`prd.md:728`（NAV-C01 把两者列入必读）；`prd.md:604`（不宣称本轮在线查新/已安装/效果已验证）；用户 batch-009（模块四的采用深度与本地副本口径）。
- **不做什么**：不迁 SDD 的**六材料双写/重开状态**（`prd.md:610` 逐字禁止）；不把材料分数当产品质量（`prd.md:611`）；**不新建规范维护 skill**（`prd.md:196`）。
- **风险**：两个固定来源是**外部 URL**，本机未安装、未核许可与完整依赖闭包。缓解：S3 要求采用前核验；核不到就如实记 `unavailable`，不冒「已采用」。**这是本卡真实的外部依赖缺口**，与迁移面审计里 `design-tokens`/`frontend-design` 不存在是两件不同的事（后者属 UI Designer 子技能，不在 C01-F4 范围内）。
- **改动**：`skills/reuse-registry.md`（采用登记）、`skills/ui-project-init/SKILL.md`（引用采用方法与条件）、`skills/catalog.yaml`（如涉登记）。
- **唯一写主**：`skills/reuse-registry.md` 与 `skills/catalog.yaml` 的既有登记 owner。

### WP5 — PaperBuilder 侧规范整理

**要交付什么**：在 PaperBuilder 按母规划 S2 **分文件**落规范正文，并把旧条款的去向登记清楚；根 `Design.md` 按 ADR-C01-016 在条款迁移后删除并 repoint；`Experience.md` 不删除、不改写历史；来源 R-C01-03/04/08/09/12；消费者为 PaperBuilder 维护者与其真实门禁。

#### ADR-C01-004 — 把 PaperBuilder 根 `Design.md` 的真实内容按八类迁入 `specs/design/`，并按需落 `specs/frontend/frontend.md`

- **做什么**：在 PaperBuilder 专用分支上，**基于根目录 `Design.md`（270 行，`mode: contract`）的真实内容**，把其承载的条款按八类分配落到 `specs/design/` 下的对应正文（②视觉设计系统、③组件及设计代码对应、④布局与场景、⑤通用交互的跨任务部分、⑦内容与设计工艺、⑧设计质量），并在新建的 `specs/frontend/frontend.md` 承载⑥前端工程、`specs/frontend/ui-quality.md` 承载⑧的工程/运行 UI 判据（是否拆出由 build-plan 按真实 owner 定）；**按母规划 S2 分文件建**（`specs/design/{design,components,layouts,interaction,craft,quality}.md` 等，用户 q23 裁定）。
  - **迁移时必须逐条检查内容是否需要更新**（用户原话「同时检查一下内容是否需要更新」）→ 逐条判断**保留 / 更新 / 标已过时**（用户 batch-009 模块五）：已核出的必改项见 ADR-C01-007（三处死引用）与 ADR-C01-006（已被取代的条款不得原样搬）。
  - 内容**引用而非复写**真实权威：`frontend/package.json`（React 19.2.4 + Vite 7.3.6 + TS 5.9.3 + vitest 3.2.4 + Playwright 1.55.0，无 Tailwind）、`Makefile:12-13/32-33/43-46/57-62/66-69`、`architecture/components.yaml`、`specs/prd.md` §12.7、`docs/adr/`（38 个）、`CONTEXT.md`（①领域语义的唯一词义源）。
  - 依据：**用户 q15 真实答复（`talk-batches.md#batch-005`）**：「现在的PaperBuilder的根目录里有Design.md文件，需要基于这个文件迁移到specs/design/里，同时检查一下内容是否需要更新。」；用户 q23（`batch-008`）「按母规划 S2 分文件建」；另见 `decision-log.md:231/236-242`（八类默认名与落点）、`prd.md:79-86`。
- **不做什么**：不为**没有实质来源**的类凭空造文件——按 q12「其余记缺口」保留具名缺口（G-1 治理条款、锚名与取值锚格式、上游技能原件）；不把设计源工程（`specs/Design/实盘UI/`、`/Users/Hugh/Downloads/UI`）的 Tailwind 工具类、`@theme` 块、`vite.config.ts` 当作 PaperBuilder 规范来源；不重排、不重命名、不改写 `specs/Design/` 内既有文件（`tests/test_prd_f6_sync.py:17-23` 字节锁 `P1 回测工作台.html`、`p1-footprint.js`，经 `Makefile:13,31` 进 `make check`）；不在本卡删除 `Experience.md`（根 `Design.md` 按 ADR-C01-016 在条款迁移后删除，须与守卫改造同批）。
- **风险**：`specs/design/` 与既有 `specs/Design/` 在本机是**同一物理目录**（同 inode），把规范正文写进去等于让该目录同时装设计原型与长期规范，角色混放（用户 q7 已确认接受）；**在区分大小写的系统上（如 Linux checkout）两者会分裂成两个目录**，文件名与引用会被分到两条路径上（见 `## 风险与延期交接` 的同名风险行；规范大小写由主会话**暂定为小写 `specs/design/`**（依母规划 U-020 既定目录名；属「普通细节的最小合理假设」，**未经用户确认、用户可覆写**）；既有 `specs/Design/`（设计原型）**不改名、不搬家**（其路径被 `tests/test_prd_f6_sync.py` 字节锁与 38 份 ADR 按「路径+行号」引用）。**分裂风险未被消除**：在区分大小写系统上仍是两个目录，须由 build-plan 落实一次「区分大小写环境的布局验证」）；`specs/frontend/` 目录当前不存在，新建即新增目录。若这两个目录被后续卡片误用为第二规范权威，会重演双源问题。缓解：每份正文写明唯一 owner 与 consumer，并在接口文档索引（ADR-C01-008）中登记。未知：本轮未跑 PaperBuilder 任何测试，`make check` 的真实影响未实测。
- **改动**：PaperBuilder 仓 `specs/design/*.md`（按承载新建）与 `specs/frontend/frontend.md`（新建，及按需 `specs/frontend/ui-quality.md`）；用**专用分支**，验证后合并回 `main`（用户 q11 答复）；操作前核实际 HEAD（侦察时 `8569bd5`，`main...origin/main [ahead 3]`）。**执行顺序硬约束**：本条的 PaperBuilder 侧改动必须在 **WP-B** 钉住改造前口径之后（用户 q14 答复）。
- **唯一写主**：PaperBuilder 设计 owner（`specs/design/*`）与 PaperBuilder 前端 owner（`specs/frontend/*`）。

#### ADR-C01-005 — ②类值源单源化：正文不写精确值，守卫测试改读机器可读清单

- **做什么**：②类视觉设计系统的**精确值唯一源**确认为 `frontend/src/ui/tokens-base.css:19-42`（31 条 `:root` 声明）+ `frontend/src/ui/live-cockpit.css:2`（feature role）——**精确值只留在 CSS，不迁移成第二份字面值清单**。新增的 `frontend/src/ui/tokens-anchor.json` **只承载角色 ID 与元数据**（角色名、归属类、退役状态、owner），**不含任何精确数值**。`frontend/src/ui/style-token-guard.test.ts` 改为：**从 `tokens-base.css` 推导数值**并与 `tokens-anchor.json` 的**角色集合**比对，**不再解析 markdown、也不维护第二份值**；执行走 **owning build-plan correction + 独立 test-change review**，并补等价负例。
  - 依 detail 审查 F-DET2-33：把值表迁成 JSON 等于把双写从 markdown 搬家到 JSON；本决定按该意见改为「值只在 CSS、清单只存角色元数据」。
  - 依据（原有）：用户 q13 明确授权（`talk-batches.md#batch-004`）；`decision-log.md:237`（②类「文档不手写第二份精确值」）；`Design.md:49`（旧契约自己承认单源却同时手写全表）；`style-token-guard.test.ts:2-3`（`DO NOT TOUCH` 与真实修改条件）；`Design.md:266`（精确声明/源值/唯一 owner/活作用域需对应独立 test-change review 与负例）。
- **不做什么**：不把双写从「markdown ↔ CSS」改成「markdown ↔ JSON ↔ CSS」（那是假解决）；不放宽守卫使其变绿；不新增 `style-token-baseline.json` 的 `exemptions`（`style-token-guard.test.ts:37-58` 要求恰好 3 项且逐字匹配，新增即 throw）。
- **风险**：改的是标了 `DO NOT TOUCH` 的活守卫，改错会让 PaperBuilder 失去对 token 的保护。缓解：保持断言强度、补等价负例、走独立 test-change review；未验证前不声称守卫已更新。**已由 q15 裁定（原 batch-004 推断已作废）**：②类**落 `specs/design/` 正文**、但**不含精确值**；精确值只在 CSS。
- **改动**：PaperBuilder 仓 `frontend/src/ui/style-token-guard.test.ts`、新增机器可读清单文件 **`frontend/src/ui/tokens-anchor.json`**（本卡钉死的唯一命名，与既有 `frontend/src/ui/style-token-baseline.json` 同目录同 owner；见 WP5 末尾的命名唯一定义）。
- **唯一写主**：PaperBuilder 前端 token owner。

**守卫不变量与所需证据（direction 审查 F-DIR-01/06/12/15/22 补充）**：

- **必须保持的不变量**（改造后逐条证明）：①`tokens-base.css:19-42` 的 31 条 `:root` 声明与 `tokens-anchor.json` 的**角色集合**一一对应（角色名不缺不多）；②`RETIRED` 4 个退役值仍被禁止回潮（`style-token-guard.test.ts:27-33,199-208`）；③失效事实引用仍被负断言拦住（`:210-212`）；④`style-token-baseline.json` 的 `exemptions` 仍恰好 3 项且逐字匹配 `EXEMPTION_SCOPE`（`:37-58`，新增即 throw）；⑤`specs/Design/shared.css` 的化石归档断言（`:214-217`）不受影响。
- **从守卫断言中剥离的项**（依 detail 审查 F-DET2-28）：**13 个共享/恢复角色的语义与禁令正文仍存在**这一事实，守卫在不再解析 markdown 后**无法**断言，改由**独立的文档/语义检查**证明，不写成守卫的不变量，避免承诺落空。
- **所需证据**：改造后 `style-token-guard.test.ts` 与 `live-pages.test.tsx` 相关用例**实际运行通过**；补一个等价负例——**篡改／增删 `tokens-anchor.json` 里的角色 ID、或破坏它与 `tokens-base.css`/`live-cockpit.css` 角色集合的映射时必须变红**（清单不含精确数值，故负例不作用于清单里的数值）。
- **②类正文未生成时的守卫基准**：守卫的**数值基准是 `tokens-base.css`（+ `live-cockpit.css`）**，角色集合基准是 `tokens-anchor.json`；因此守卫既不依赖 `Design.md` 是否存在，也不依赖 markdown 解析。
- **边界**：在保护强度未按上述证明前，**不得声称守卫已更新**。

#### ADR-C01-006 — 47 条旧条款逐条去向登记；无家可归与锚名登记为具名缺口

- **做什么**：把 `Design.md`（20 条 DES-*）、`Experience.md`（21 条 EXP-*）、`CONTEXT.md`（6 条 CTX-*）共 **47 条条款**逐条给出去向：归某类 / 归任务 spec / 留历史 / 具名缺口；旧 `Design.md` **按 ADR-C01-016 在条款迁移后删除**，`Experience.md` **不删除、不改写历史**。分类去向按 `research.md:99-108` 的适用性判定：①③④⑥⑧ 适用；② 适用但不含精确值；⑤⑦ 部分适用（任务级状态机归任务 spec，只有跨任务诚实规则可升为⑤）。每条按**保留 / 更新 / 标已过时**三选一判定（用户 batch-009 模块五）。
  - 依据：`decision-log.md:224-225`（不静默丢规则、不假报已迁、不在旧文件留第二 active 权威）；`prd.md:197`（AC-C01-2「列出实际旧条款与引用逐项去向」）；`research.md:298-304`；用户 batch-009（模块五旧条款处置口径）。
- **不做什么**：不把 ⑤类中 `Experience.md:106-163` 的 7 组流程与 `:74-104` 的 17 态升为长期正文（`D-014` `:240/:243` 明写归任务 spec/API）；不原样搬 `Design.md:201-207` 中被取代的 T07 三组件（`current-market-workbench.tsx:1214` 逐字承认不使用旧 t07 `HealthStrip`/`HealthAlert`）。
- **风险（必须具名保留，不得在收敛时被抹平）**：**G-1 治理条款无家可归**（`Design.md:226-233`、`Experience.md:253-258` 的变更门与 `DES-01`/`EXP-02` 文档元数据，八类均不承载）；**锚名无归属**（`PB-DES-LIVE-REFERENCE` 被 `live-pages.test.tsx:698,724`、`style-token-guard.test.ts:111,136,141` 硬编码消费，八类中无任何类承接「锚名」与「取值锚 markdown 格式」）；**有来源无 consumer 五项**（`Design.md:233` source-identity 绑定链两端断、`:207` 10 类 T07 fixture、`Experience.md:221` design-return fact、`Design.md:88` P7/T030 遗留、`Experience.md:232-251` 历史确认段）。缓解：登记承接者与补齐条件，随 `research.md` 原件保留。
- **改动**：本条**自身的产出是去向登记**（落在本卡决策材料与 `research.md`），**不直接改 PaperBuilder 文件**；条款实际落盘由 ADR-C01-004（按类写入 `specs/design/*`）与 ADR-C01-007（死引用改正）承接，`Experience.md` 的对应改动同见 `## 要改哪些文件` 的 PaperBuilder 侧写集行。承接者在后续卡片/OI 中具名。

#### ADR-C01-007 — 三处原件级死引用改指真实路径或标缺口，不原样搬

- **做什么**：处置实测 MISSING 的三处：`Design.md:8` 的 authority 路径 `specs/paperbuilder-v3-card-00-live-frontend-base/spec.md`；`Experience.md:18` 的 `quality/facts/` 目录（`Design.md` 侧同类死引用已被 `style-token-guard.test.ts:210-212` 反向断言清掉，`Experience.md` 未清，含 `:18`、`:20` 两处）；`Design.md:262`/`Experience.md:289` 的 `/Users/Hugh/Downloads/实盘UI`（真实存在的是 `/Users/Hugh/Downloads/UI`）。
  - 依据：`research.md:303`；`research-independent-check.md` 结论 3；`prd.md:197`（AC-C01-2 不得静默丢规则）。
- **不做什么**：不原样搬运死引用；不为了「看起来完整」伪造指向。
- **风险**：`Experience.md` 的 `revision: 2026.09.20.1` 与内容已脱钩（10-08/10-10/10-11 三次追写未改版，末次 `51d2e5e` +17 行），修引用时若顺手改版号会改写历史。缓解：只改引用、不动历史正文与版号；需改版号时另立决定。
- **改动**：PaperBuilder 仓 `Experience.md` 的引用行（保住历史正文）；`Design.md` 侧按既有清理方式处置。
- **唯一写主**：PaperBuilder 设计 owner。

#### ADR-C01-008 — 接口文档索引：只登记路径/anchor/owner/consumer/缺口

- **做什么**：为本项目八类规范建立一个**指针表**（位置与形态由 build-plan 定），每行登记：类、实际路径、section anchor、owner、consumer、缺口；照抄 `specs/archive/f20-event-ledger/spec.md:534-535` 的 `anchor source = explicit` 登记格式；吸收 CB-4 的「anchor 名保留」（让既有按锚名引用不必立即全改）。**新建一份只当指引的入口短文档**（用户 batch-009 模块五）。
  - 依据：`decision-log.md:232`（规范入口只定位实际来源、作用域、版本/owner/consumer 及缺口）；`prd.md:79-86`（每类都要求写清 consumer）；`docs/adr/` 无索引是真实缺口；用户 batch-009（模块五「要，新建一份只当指引的短文档」）。
- **不做什么**：索引**不得承载任何条款正文**、不得成为第二 progress/spec 权威、不得成为新的同步/漂移平台（`decision-log.md:225`）。每行必须有真实 consumer 路径，否则不登记。
- **风险**：索引容易被后续当成「规范真相」而长成第二正文。缓解：限定为指针表；每行 consumer 必须可核；独立审查核对「索引是否承载正文」。
- **改动**：PaperBuilder 仓新增索引文件 **`specs/design/README.md`**（本卡钉死的唯一命名；只做指针表）；不修改 `specs/Design/` 内既有原型。
- **唯一写主**：PaperBuilder 设计 owner。

#### ADR-C01-012 — 为锚名与取值锚格式指定承接，并入守卫改造同批验证

- **做什么**：为 `PB-DES-LIVE-REFERENCE` 锚名与「取值锚 markdown 格式」指定**显式承接**：在八类对应正文中以 **section anchor** 承接锚名（命名保持可被既有断言匹配）；对已被 4 处测试硬编码消费的锚名，提供**过渡期兼容别名**，使 `frontend/src/live-pages.test.tsx:698,724` 与 `frontend/src/ui/style-token-guard.test.ts:111,136,141` 在迁移同批仍可满足；取值锚格式随 ADR-C01-005 改为机器可读清单后，markdown 解析路径退役但**格式语义**（角色名 ↔ 值）在清单中保留。
  - 依据：direction 审查 F-DIR-02/06/21；`research.md` 缺口 (c)；`decision-log.md:232`（规范入口登记 anchor）。
- **不做什么**：不为迁就旧断言而保留 `Design.md` 作为 active 权威；不删除既有测试断言（那正是「保护静默消失」）。
- **风险**：过渡别名若长期不清理会变成第二套命名。缓解：在接口文档索引（ADR-C01-008）中登记别名与其退出条件；退出条件由 build-plan 定。
- **改动**：八类对应正文的 section anchor；`frontend/src/ui/style-token-guard.test.ts` 与 `frontend/src/live-pages.test.tsx` 中锚名消费方式的同批调整（与 ADR-C01-005 同一 test-change review）。
- **唯一写主**：PaperBuilder 前端 token owner（与 ADR-C01-005 同一 owner）。

#### ADR-C01-016 — 迁移后删除 PaperBuilder 根 `Design.md`，所有引用改指 `specs/design/`

- **做什么**：`Design.md` 的条款按八类迁入 `specs/design/` 后，**删除 PaperBuilder 根的 `Design.md`**；所有原本使用 `Design.md` 的位置改为指向 `specs/design/` 的对应正文。具体消费点至少含 `frontend/src/ui/style-token-guard.test.ts:13`（`read("../../../Design.md")`）、`skills/` 侧引用它的措辞、以及 PaperBuilder 内的其它引用。
  - 依据：**用户 q17 真实答复（batch-006）**：「迁移之后当前只保留specs/design/里面的design.md，不要保留根目录的，同时所有使用design.md的地方都要指向specs/design/」；理由是「留下原来的会造成项目污染和永远不可清理的垃圾过时文件」。用户 q23（batch-008）裁定按母规划 S2 分文件建、并逐个 repoint。
- **不做什么**：**不同等适用于 `Experience.md`**——用户 q17 只点名 `Design.md`；`Experience.md` 按 `decision-log.md:224-225` **不删除、不改写历史**（本卡只做条款迁移与死引用修复）。
- **风险**：删除是不可逆动作，且 `style-token-guard.test.ts:13` 正读该文件——**删文件与守卫改造必须同批完成**，否则测试 ENOENT。缓解：守卫改为读 `frontend/src/ui/tokens-anchor.json`（ADR-C01-005），从而不再「使用 design.md」；其余消费点逐处 repoint；同批运行相关测试取证。
- **改动**：PaperBuilder 仓删除 `Design.md`；`frontend/src/ui/style-token-guard.test.ts`（与 ADR-C01-005 同批）；其余 `Design.md` 消费点 repoint 到 `specs/design/*`。
- **唯一写主**：PaperBuilder 设计 owner（删除与 repoint），守卫改造同 ADR-C01-005 的 owner。

**命名唯一定义（本阶段钉死，供多处复用；来源：`skills/talk-with-zhipeng/SKILL.md` §4.5 与 `skills/grill-with-docs/SKILL.md` 退出检查 2）**：

| 名称 | 唯一来源文件 | 用途与 owner |
| --- | --- | --- |
| `specs/design/` | 本卡决定（本机与 PaperBuilder 既有 `specs/Design/` 是同一物理目录） | ②③④⑤⑦⑧ 类长期规范正文；该目录同时装既有设计原型，双重角色已由用户 q7 确认接受 |
| `specs/frontend/` | 本卡决定（新建） | ⑥⑧ 类前端专业规范正文 |
| `specs/frontend/frontend.md` | S2 默认名（`prd.md:84`、`decision-log.md:240`） | ⑥前端工程正文；owner = PaperBuilder 前端工程 owner |
| `specs/frontend/ui-quality.md` | S2 默认名（`prd.md:86`、`decision-log.md:242`） | ⑧工程/运行 UI 共用判据 |
| `specs/design/README.md` | 本卡决定（ADR-C01-008） | 八类规范的入口**指引文档**（指针表），只登记路径/anchor/owner/consumer/缺口 |
| `frontend/src/ui/tokens-anchor.json` | 本卡决定（ADR-C01-005） | ②类的**角色集合与元数据**清单，**不含任何精确数值**；精确值唯一源 = `frontend/src/ui/tokens-base.css`（+ `live-cockpit.css`）；owner = PaperBuilder 前端 token owner |
| `frontend/src/ui/tokens-base.css` | `Design.md:49` 自述 + 实测 | ②类颜色/字体值**唯一源** |
| `frontend/src/ui/live-cockpit.css` | `Design.md:264` | ②类 feature role 唯一 owner |
| `CONTEXT.md`（PaperBuilder 根） | 实测（无 `GLOSSARY.md`） | ①类领域语义唯一词义源；**不新建** `GLOSSARY.md` |
| 旧 WorkflowHub 版本 | 用户 q9（ADR-C01-010） | `b66c134856a3b7aa13c7115b4e9a1df04dad1914` |
| PaperBuilder 改造前状态 | 用户 q14（ADR-C01-010） | HEAD `8569bd5219e3cfcd87f1aade5f2ed4a5c03c692f`（`main...origin/main [ahead 3]`） |

### WP6 — 方法与文档缺陷修复（用户追加，本卡内做）

**要交付什么**：按用户 batch-007 q22 与 batch-009 模块六的裁定，在**本卡内**修复三处方法与文档缺陷：①`skills/wh-review/SKILL.md` 的**公开审查入口与 ref 解析差异**写清，并用一条契约测试固定；②`workflows/make-decision/SKILL.md` 的**每步「本步产物／进下一步前」条件提到行首加粗**，使漏做更容易被自己看见；③`skills/talk-with-zhipeng/SKILL.md`（及其格式文档）**新立「用户可见的说话方式」一节**，明确禁掉**大写编号／文件名加行号／下划线字段名**三种形态，并补一段正面示范。**只做文本澄清与既有行为的测试固定，不改 CLI 行为、不新增 stage/gate/控制面。**

#### ADR-C01-017 — 澄清 wh-review 的公开审查入口与 ref 解析差异（用户追加 W6-1）

- **做什么**：在 `skills/wh-review/SKILL.md` 写明：公开入口是七公开命令之一的 **`stage-runtime.mjs review --action=record`**（`tools/cli/stage-runtime.mjs:1236` 的 `review: ["record"]`），它经过 `resolveMaterialRefs`（`:679`/`:998`），会解析 `materials` 的**顶层** `{ref, sha256}`；裸 `wh-review-cli.mjs run` **不解析** ref（`review-materials.mjs:761` + `provider-material-projection.mjs:119` + `materialBytes`），走裸入口时必须内联完整字节；请求 JSON 形状必须是 `{ "request": { stage, review_track, surface, materials } }`（`:994`），且命令必须在**认证 worktree** 内执行，否则报 `CURRENT_WORKTREE_MISMATCH`。补一条契约测试把「公开 review 入口解析顶层 ref／裸入口不解析」这一事实固定住。
  - 依据：用户 q22 答复（batch-007）；本次三条实测——**`review-record` 作为 CLI 命令会被拒**（`unknown public runtime behavior`）、`review --action=record` 通过命令校验、非认证 worktree 执行报 `CURRENT_WORKTREE_MISMATCH`。
- **不做什么**：**不改 CLI 行为**、不改 `resolveMaterialRefs`、不新增公共命令或控制面、不删除裸入口。
- **风险**：文档与实现再次漂移。缓解：用契约测试固定既有行为；测试只断言现状，不新增能力。
- **改动**：`skills/wh-review/SKILL.md`；`tests/contract/` 下新增契约测试 **`tests/contract/wh-review-public-entry-and-ref-resolution.test.mjs`**（固定「公开入口解析顶层 ref／裸入口不解析／非认证 worktree 被拒」）。
- **唯一写主**：`skills/wh-review/` 的 owner（SKILL.md）与 `tests/contract/` 的既有 owner（契约测试）。

#### ADR-C01-018 — make-decision 的步骤产物与前置条件写成不易漏；talk 技能补「用户可见的说话方式」（用户追加 W6-2 / W6-3）

- **做什么**：（甲）在 `workflows/make-decision/SKILL.md` 把每步的**必需产物**与**步骤间前置条件**移到**行首并加粗**，写成不易漏（本卡实际漏掉的正是这几处）：①step9 的模块收敛必须产出 **red/blue 争议清单并逐条给处置**；②step10 的前置是「**全部模块收敛** + 写集表每个文件**只有一个写主**」，三者缺一即本步未完成；③step3 的内部与**外部**研究分支必须写明真实执行，或写明**真实跳过原因**（不得空白）；④正确调用独立审查的公开入口（与 ADR-C01-017 一致）。（乙）在 `skills/talk-with-zhipeng/SKILL.md` 及其格式文档**新立「用户可见的说话方式」一节**：明确禁掉**大写编号**（如 `WP1`/`AC-C01-1` 这类形态）、**文件名加行号**、**下划线字段名**三种形态，并补**一段正面示范**（用户 batch-009 模块六「新立一节 + 禁三种形态 + 补正例」）。
  - 依据：用户 batch-009 模块六真实裁定；用户 q22 答复（batch-007）；本卡 `## 风险与延期交接` 的 S-1～S-9 自查事实（均为真实发生的遗漏与跳步）；`research-talk-plain-language-defect.md`（只禁 5 个英文词、从未禁编号形态、语域同节混载、零正例）。
- **不做什么**：**不新增 stage、gate、控制面、检查器或机器门**；不改步骤语义与编号；不把「可发现性改进」做成新的推进许可；不做 batch-009 未采纳的**乙／丙**候选（`make-decision/steps.json` 的零消费者问题不在本卡修复范围）。
- **风险**：写成清单容易被后续当成新的硬门。缓解：文本显式声明「本条是可发现性改进，不是新门」；不新增任何自动校验。**残余风险**：文本加固只能让漏做**更容易被自己看见**，**不能**把「没看见」变成「被发现」；本卡**不声称**跳步不会再发生。
- **改动**：`workflows/make-decision/SKILL.md`；`skills/talk-with-zhipeng/SKILL.md` 及其格式文档。唯一写主 = `workflows/make-decision/` 的 owner 与 `skills/talk-with-zhipeng/` 的 owner。
- **W6-3（证据，不是交付）**：本阶段 S-1～S-9 的自查事实随本卡留存于本日志 `## 风险与延期交接` 的「本阶段执行缺陷与补救」节与 `review-dispositions.md`。

### WP-B — 基线口径固定与 C09 输入契约（附加工作，**不计入 C01 原卡 AC**）

**要交付什么**：一套无歧义的改造前口径与 C09 输入契约，供 C09 直接消费；来源 U-C01-002/U-C01-005；消费者为 C09。**本工作包不计入 C01 原卡 AC 的完成声明。**

#### ADR-C01-010 — 钉住改造前对象与口径，不真跑基线

- **做什么**：固定并留存：①旧 WorkflowHub commit **`b66c1348`**（唯一口径）；②**PaperBuilder 改造前 HEAD `8569bd5`** 与其 `main...origin/main [ahead 3]` 事实（必须在任何 PaperBuilder 改动前完成）；③样本清单；④设计源代次 = `/Users/Hugh/Downloads/UI`（绝对路径 + mtime，并记录它与 `/Users/Hugh/Downloads/UI设计稿` 是同工程两代、两代都不是 git 仓库）；⑤可运行环境与依赖版本（PaperBuilder：`frontend/node_modules` 已装、`pnpm` 10.28.2、`Makefile` targets、`PAPERBUILDER_F6_*` 变量；设计源：Vite 8 工程、可 `pnpm dev`/`preview`）；⑥S6 六指标定义与采集入口。
  - 依据：用户 q9/q10 真实答复（`talk-batches.md#batch-003`）；`prd.md:145`；S6 `prd.md:132-149`。
- **不做什么**：**不真跑旧流程基线实验**；不把六指标原始记录说成已有；不用历史 PB-T08 的 5 轮/30 缺陷/20+ 小时冒充基线（`prd.md:147`）；不用当前 HEAD 或模拟数据冒充（`prd.md:748`）。
- **风险（必须如实保留）**：**S6 六指标的「改造前原始记录」全盘不存在（零证据）**——已全盘 `find` 整个 Hugh 知识库与 Downloads 未命中 `baseline-metrics.json`；`quality/evidence/` 下只有 `decision-log-refs/`、`git-authorizations/`、`handoff/`、`human-confirmations/`、`prd-refs/`、`research/` 六项。本卡不真跑就不会产生，**AC-C09-1 的该条要求到 C09 仍需补跑**；本卡不得以「基线已固定」宣称该 AC 成立。唯一旧基线原件是 `specs/archive/workflowhub-ui-frontend-capability-20260904/evidence/pilot-baseline-design.md`，它是**设计研究不是运行基线**。
- **改动**：本卡任务库 `quality/evidence/` 下的基线口径原件（命名由 build-plan 定）；不改 PaperBuilder 与 WorkflowHub 的代码。
- **唯一写主**：本卡主会话（build-plan 定文件名）。

**C09 前置条件与禁止声明（direction 审查 F-DIR-07 补充）**：

- 六指标改造前原始数据的采集，显式列为 **C09 的前置阻塞条件**（不是「可后补」），并写入交给 C09 的传递项。
- **禁止**把空数据或未采集状态标为「基线已固定」「基线已采集」；本卡只能声明「口径已钉住、对象已固定、原始数据尚缺」。
- 本卡不改变用户 q10 的真实决定（不真跑），但该决定的后果（C09 需补跑）必须在传递项里写明。

#### ADR-C01-013 — 定义 C09 的输入契约（样本资格与缺失基线的标注规则）

- **做什么**：把本卡交给 C09 的输入定义清楚：①**样本资格**——「有稿」一侧的样本以**设计源代次 + 绝对路径 + mtime** 唯一确定，且必须在 PaperBuilder 专用分支合并前的状态上取；「无稿」一侧的对象与 API 本卡不定，如实留给 C09。②**缺失基线的标注规则**——S6 六指标的改造前原始数据**标为 `absent`（不存在）而非 `0`/空**，并在 C09 报告中作为**未覆盖**项列出，不得以「口径已固定」代替数据。③**对比单位**——旧 `b66c1348` 与 PaperBuilder 改造前 HEAD `8569bd5` 必须在任何改动前取到。
  - 依据：direction 审查 F-DIR-11；`prd.md:369`（AC-C09-2 同输入比较）；`prd.md:371`（只读资料不足时明确未决、不伪造样本）；U-C01-005。
- **不做什么**：本卡不定义「有稿」在 PaperBuilder 上的**实现语义**（是还原还是对比），那是 C09 的对象定义（OI-C01-022）；本卡不跑基线、不产出六指标数值。
- **风险**：若 C09 不接受这一输入契约，改造前参照仍会缺失。缓解：契约显式写在传递项里，C09 的 make-decision 必须真实消费或明确拒绝并给出替代；不得静默忽略。
- **改动**：本卡 `## 未决项` 的传递项与本卡任务库基线口径原件（与 ADR-C01-010 同一产出）。
- **唯一写主**：本卡主会话（与 ADR-C01-010 同一 owner）。

### 过程记录（不是交付模块）

#### ADR-C01-011 — 记录 D-014 在 PaperBuilder 上不成立的五条前提与七条需修订结论

- **做什么**：逐条记录并给出本卡处置：**五条不成立前提**——P2 值源名（`tokens.css`，实际 `tokens-base.css`）、P3 设计源形态（期望纸面 md，实际是 Figma Make 可运行工程）、P4 前端栈（期望 Next.js，实际 React 19 + Vite SPA）、P5 规范身份可信（期望作者权威，实际 `Design.md` 声明单源却手写全表、`Experience.md` 为 `mode: legacy` 且版本与内容脱钩）、P7 新目录语义（期望新建目录，实际 `specs/design` 与 `specs/Design` 同 inode、就地改义且被字节锁）。**七条需修订结论**含 `prd.md:272`「无 Figma 链路」措辞、`decision-log.md:231` 的 `GLOSSARY` 前提与 `specs/design` 撞名裁决、`:208-215` 的 `tokens.css` 名实不符、`:204` 需具名宿主基础来源（`AGENTS.md` 对三份规范零引用是真实缺口）、`:226`「未知 consumer 不当零」在 PaperBuilder 已是已知活跃。
  - 依据：`research-independent-check.md` 结论 1 与结论 5；本卡 U-C01-001/004。
- **不做什么**：不改母规划的八类路由、卡职责划分与 C09 最终验证职责（`talk-batches.md#batch-001` 推断 3 与 q8 答复）；不重写母规划原件（`specs/archive/**` 只读）。
- **风险**：新增起点形态「已有可运行设计原型工程」是母规划未定义的第四种形态，若不显式记录，后续卡片会按错误形态套模板。缓解：作为本卡决定正文与 OI 承接项显式保留。
- **改动**：本卡决策材料与 `## 未决项`；不改母规划原件。
- **唯一写主**：本卡主会话。

### 被排除的路线（当前仍排除）

- **不做**：全库迁移、生成八个空文件、为未来持续升级（C08）建机制、新设计源采集（C04）、第九规范平台（`prd.md:88/194`）。
- **不做**：把旧 `Experience.md` 恢复成第二 active 权威，或把旧文件批量删除（`decision-log.md:224-225`）。
- **不做**：新建 PaperBuilder 的 `GLOSSARY.md`（会打断 4 处 ADR + `tests/test_prd_f6_sync.py:10-16,76-99` 的按行号/全文引用）；①类来源就用 `CONTEXT.md` 原路径。
- **不做**：把八类合并回两个大文件（与 `decision-log.md:203/219/224-225` 逐字冲突）。
- **不做**：为**没有实质来源**的类凭空造规范文件（用户 q12「其余记缺口」）；但**根 `Design.md` 有真实内容的类必须按 q15 迁入 `specs/design/`**——这两条不矛盾，见 `talk-batches.md#batch-005` 的调和读法。
- **执行顺序约束**：**WP-B 的基线口径固定先行 → WP1 → WP2 → WP3 → WP4 → WP5；WP6 可与 WP1/WP2 并行**（用户 q14）；PaperBuilder 侧任何改动都必须在钉住其改造前 HEAD `8569bd5` 之后。
- **不做**：重排、重命名或改写 `specs/Design/` 内既有文件（`tests/test_prd_f6_sync.py:17-23` 字节锁 `P1 回测工作台.html`、`p1-footprint.js`，经 `Makefile:13,31` 进 `make check`）。
- **不做**：真跑改造前基线实验（用户 q10 答复）。
- **不做**：把设计源的 Tailwind 工具类、`@theme` 块或工程配置当作 PaperBuilder 的规范来源。

失败了怎么退：任一条方向假设或决定被证据推翻时，回 `research-and-diverge` 或方向 Talk 重排，不带着错前提进入本卡 build-plan；旧判断与更改理由保留在 `decision-log-history-round1-2.md`，不覆盖历史。PaperBuilder 侧的任何改动都在专用分支上，未验证即不合并回 `main`。

## 要改哪些文件

本节回答每条决定影响哪些仓库文件。下表是**正式写集**（第二轮收敛后的最终版，已删除候选/未收敛/待定/尚未决定是否纳入等过期状态句），每行有工作包、决定与唯一写主。

**写主口径**：同一文件涉多个工作包时，写主仍只有一个；`build-plan`／`verify-code` 对验收对象区块只读取、不另立字段定义。审计已核「不需改」：`skills/plan-design-review/`（唯一已与八类解耦的 caller，用泛称 "design sources"）；`workflows/build-prd/SKILL.md:17`（经 readiness/render 间接继承，改上游即生效）；`GLOSSARY.md`（no-change，见 `## 风险与延期交接` 的 grill 收口节）。

### WorkflowHub 侧

| 文件（仓库相对路径） | 改什么 | 工作包 | 决定 | 唯一写主 |
| --- | --- | --- | --- | --- |
| `skills/ui-project-init/SKILL.md` | 从「一份 Design.md + 一份 Experience.md」的旧双文件 producer 改为**薄规范入口**（定位/接线/显露缺口；三种内容是三种起点），并引用 SDD／材料评估的采用方法与条件 | WP1／WP2／WP4 | ADR-C01-014 / ADR-C01-001 / ADR-C01-015 | `ui-project-init` owner |
| `skills/design-source-readiness/SKILL.md` | Read Map 的约定来源从两文件改为 `specs/design/*` + `specs/frontend/*`；`binding_state` 从单一 `design_revision` 改为按类 | WP2 | ADR-C01-001 | `design-source-readiness` owner |
| `skills/frontend-prototype-render/SKILL.md` | 读取来源改为八类实际路径 | WP2 | ADR-C01-001 | `frontend-prototype-render` owner |
| `skills/frontend-testing/SKILL.md` | 「Design.md/Experience.md identity」改为按类的八类来源 identity | WP2 | ADR-C01-001 | `frontend-testing` owner |
| `workflows/build-plan/SKILL.md` | 两处旧分权正文收敛为**一处**；主读入口改指八类实际来源；`:21` 由「只给指针」改为读取验收对象结构化区块 | WP2／WP3 | ADR-C01-001 / ADR-C01-009 | `build-plan` owner |
| `workflows/verify-code/SKILL.md` | 职责分离判据从两文件改为八类；`:18` 改为读取验收对象结构化区块 | WP2／WP3 | ADR-C01-001 / ADR-C01-009 | `verify-code` owner |
| `skills/frontend-component-quality/SKILL.md` | 旧文件名反例锚改为「不改写项目专业规范」 | WP2 | ADR-C01-001 | `frontend-component-quality` owner |
| `skills/isolated-browser-qa/SKILL.md` | 英文反例「不回写 Experience.md」改为不回写任何专业规范源 | WP2 | ADR-C01-001 | `isolated-browser-qa` owner |
| `skills/spec-prd/SKILL.md` | 缺旧文件时的基线记录改为缺八类来源时记录真实缺口（原引用将悬空） | WP2 | ADR-C01-001 | `spec-prd` owner |
| `skills/reuse-registry.md` | 八类归属表更新；「唯一 consumer 是 build-spec」（已退役阶段）改为真实 caller `build-plan`/`build-prd`；登记 SDD 与材料评估的采用状态与条件 | WP2／WP4 | ADR-C01-001 / ADR-C01-015 | `reuse-registry.md` 的既有登记 owner |
| `skills/catalog.yaml` | purpose 与 update_policy 里的 `Design.md` 表述随八类更新；登记 SDD 与材料评估的采用状态与条件 | WP2／WP4 | ADR-C01-001 / ADR-C01-015 | `catalog.yaml` 的既有登记 owner |
| `skills/spec-specify/templates/spec-template.md` | 承载 `spec.md` 内「验收对象」结构化区块：工作区/服务/route/状态/viewport 缺项报具体名称、owner 缺省=用户 | WP3 | ADR-C01-009 | `spec-specify` owner |
| `skills/spec-specify/SKILL.md` | 定义验收对象区块的填写与缺项报出规则 | WP3 | ADR-C01-009 | `spec-specify` owner |
| `tests/contract/acceptance-object-required-fields.test.mjs`（**新增**） | **缺项拦截载体**：断言去掉工作区／服务／route／状态／viewport 任一必要项时产生**确定性报错并点名缺项** | WP3 | ADR-C01-009 | `tests/contract/` 的既有 owner |
| `tests/contract/ui-skill-contract.test.mjs` | **硬门**：`required` 里的字面量 `"Design.md"`（行 19/42）与 `assert.match` 同批改到八类口径，`：198` 负断言替换为仍有效负例。`build-plan` 的 5 个 trigger 字面量（行 142-154）**不可改** | WP2 | ADR-C01-002 | `tests/contract/` 的既有 owner |
| `docs/adr/0015-ui-design-source-and-initialization.md` | 旧双源 ADR 仍是 Accepted，与 S2/GLOSSARY 形成规范双 active；标 supersede 并解开「删除条件挂在旧源引用」的死锁 | WP2 | ADR-C01-003 | `docs/adr/` 的既有 owner |
| `docs/adr/0016-external-first-frontend-component-quality.md` | 按 `prd.md:618` 核其 SKILL/AGENTS 路径差异；固定 Vercel 源归属 `specs/frontend/frontend.md` | WP2 | ADR-C01-001 | `docs/adr/` 的既有 owner |
| `skills/wh-review/SKILL.md` | 写清公开审查入口是 `stage-runtime.mjs review --action=record`、裸入口不解析 ref、请求 JSON 形状与认证 worktree 约束 | WP6 | ADR-C01-017 | `skills/wh-review/` 的 owner |
| `tests/contract/wh-review-public-entry-and-ref-resolution.test.mjs`（**新增**） | 契约测试固定「公开入口解析顶层 ref／裸入口不解析／非认证 worktree 被拒」 | WP6 | ADR-C01-017 | `tests/contract/` 的既有 owner |
| `workflows/make-decision/SKILL.md` | 每步的必需产物与步骤间前置条件提到**行首加粗**（step9 red/blue 清单、step10 三前提、step3 外部研究或真实跳过原因、审查公开入口） | WP6 | ADR-C01-018 | `workflows/make-decision/` 的 owner |
| `skills/talk-with-zhipeng/SKILL.md`（及其格式文档） | 新立「用户可见的说话方式」一节：禁大写编号／文件名加行号／下划线字段名三种形态，并补一段正面示范 | WP6 | ADR-C01-018 | `skills/talk-with-zhipeng/` 的 owner |

### PaperBuilder 侧

| 文件（仓库相对路径） | 改什么 | 工作包 | 决定 | 唯一写主 |
| --- | --- | --- | --- | --- |
| PaperBuilder `specs/design/{design,components,layouts,interaction,craft,quality}.md` 等按八类落地的正文 | 基于根 `Design.md` 真实内容迁入，逐条判断**保留/更新/标已过时**，按母规划 S2 分文件建 | WP5 | ADR-C01-004 / ADR-C01-016 | PaperBuilder 设计 owner |
| PaperBuilder `specs/frontend/frontend.md`（及按需 `ui-quality.md`） | ⑥⑧ 类前端专业规范正文 | WP5 | ADR-C01-004 | PaperBuilder 前端 owner |
| PaperBuilder `specs/design/README.md` | 八类规范的入口**指引文档**（指针表） | WP5 | ADR-C01-008 | PaperBuilder 设计 owner |
| PaperBuilder **删除 `Design.md`** | 迁移完成后删除根文件，所有引用改指 `specs/design/` | WP5 | ADR-C01-016 | PaperBuilder 设计 owner |
| PaperBuilder `frontend/src/ui/tokens-anchor.json`（新增） | ②类的**角色集合与元数据**清单（**不含精确数值**） | WP5 | ADR-C01-005 | PaperBuilder 前端 token owner |
| PaperBuilder `frontend/src/ui/style-token-guard.test.ts` | 改为「从 `tokens-base.css` 推导数值 ↔ `tokens-anchor.json` 角色集合」比对，不再解析 markdown；同批完成删除 `Design.md` 的 repoint 与锚名承接 | WP5 | ADR-C01-005 / ADR-C01-016 / ADR-C01-012 | PaperBuilder 前端 token owner（走 owning build-plan correction + 独立 test-change review） |
| PaperBuilder `frontend/src/live-pages.test.tsx` | 锚名消费方式的同批调整（与 ADR-C01-005 同一 test-change review） | WP5 | ADR-C01-012 | PaperBuilder 前端 token owner |
| PaperBuilder `Experience.md` | 跨任务条款逐条迁入对应类（保留/更新/标已过时）；修两条死引用；**不删除、不改写历史** | WP5 | ADR-C01-006 / ADR-C01-007 | PaperBuilder 设计 owner |

**审计缺口（本卡必须处置或具名保留）**：

- `workflows/build-code/` 全仓无任何显式旧规范 reader —— 与母规划「核 build-code 相关 caller」的期望不符，需判定「间接继承」还是「真缺口」（审计 E-3，OI-C01-018/OI-C01-027）。
- `design-tokens`、`frontend-design` 等被指为写主的原技能在仓库中**不存在**，本仓无法核其真实性（审计 E-2，OI-C01-019/OI-C01-028）。
- `design_revision` 在 `runtime/`、`core/`、`scripts/`、`tools/`、`config/`、`contracts/`、`tests/` 中零命中，唯一消费者已消失（审计 E-4，OI-C01-020）。
- C01-F3 的「验收对象」在 live 树没有任何 schema/字段落点（审计 E-6）——已由 ADR-C01-009 定死落点并补可执行拦截载体。

**PaperBuilder 侧写集事实**：`Design.md`、`Experience.md` 的条款去向，以及按八类实际适用类生成的规范正文（`specs/design/*.md` 与 `specs/frontend/frontend.md`，按需 `ui-quality.md`）。**硬约束**：根 `Design.md` 迁移后删除、所有消费点改指新落点；`Experience.md` 不删除、不改写历史（`decision-log.md:225`）；`specs/Design/`（大写 D）与母规划要求的 `specs/design/` 在本机大小写不敏感文件系统上是**同一物理目录**，该目录当前装设计原型（`P0 风格样板.html`、`实盘UI/` 等），存在命名与用途冲突（用户 q7 已确认接受混放）；**在区分大小写的系统上这两条路径会分裂成两个目录，该分裂风险的规范大小写与验证方式尚未裁定**（详见 `## 风险与延期交接`）。

完成判据：每个路径是仓库相对路径，每行有具体改动、工作包、决定与唯一写主；每项改动的唯一 writer 可从决定的改动字段回读。**已满足**：写集为正式写集（非候选），无「待定/未收敛」状态句。

## 范围与非目标

本节回答目标、工作边界以及退出的事项。

- **目标**：让 WorkflowHub 的专业规范有明确、单一、可消费的来源，并让现有流程真实读取它；旧的有效规则不丢、不出现新旧双 active；验收对象（含 viewport 等必需项）真实接入消费。在真实项目 **PaperBuilder** 上真实跑通规范生成与读取。
- **范围**（已由 2026-10-14 方向 Talk 与逐模块收敛的真实答复收窄）：
  1. **WP1／WP2（WorkflowHub 侧）**：按 `D-014` 把六处点名入口（`ui-project-init`、`build-plan`、`design-source-readiness`/Read Map、`frontend-prototype-render`、`frontend-testing`、`verify-code`）及相关 caller（审计 25 处）迁移到八类分权；处置契约测试硬断言与 `docs/adr/0015`；`ui-project-init` 改为薄规范入口（ADR-C01-014）。
  2. **WP3（验收对象）**：把 S5 验收对象以 `spec.md` 内结构化区块接入当前 spec/实现/验证使用，并补一条真会跑的缺项拦截契约测试（ADR-C01-009）。
  3. **WP4（外部原能力）**：按固定来源采用 SDD 与材料评估并履行 S3（ADR-C01-015）。
  4. **WP5（PaperBuilder 侧）**：在 `/Users/Hugh/Hugh/Project/PaperBuilder` **开专用分支**，**基于根 `Design.md` 的真实内容按八类（按母规划 S2 分文件）迁入 `specs/design/`**，并按需落 `specs/frontend/frontend.md`（及按需 `ui-quality.md`）；迁移时**逐条判断保留/更新/标已过时**（死引用、已被取代的条款、名实不符处）；根 `Design.md` **按 ADR-C01-016 在条款迁移后删除、所有引用改指 `specs/design/`**；`Experience.md` **不删除、不改写历史**；`Experience.md` 的跨任务条款迁入对应类、任务级条款归任务 spec；验证后合并回 `main`。只落**有真实内容**的类，没有实质来源的项登记为具名缺口。
  5. **WP6（方法与文档缺陷修复，本卡内做）**：审查入口澄清 + 契约测试、make-decision 步骤产物提到行首加粗、talk 技能新立「用户可见的说话方式」一节（ADR-C01-017/018）。
  6. **WP-B（附加工作，不计入 C01 原卡 AC，U-C01-002）**：钉住改造前对象与口径——旧 WorkflowHub commit `b66c1348`、PaperBuilder 改造前 HEAD `8569bd5`、样本清单、设计源代次（`/Users/Hugh/Downloads/UI`，绝对路径 + mtime）、可运行环境与依赖版本、S6 六指标定义与采集入口。**只钉住，不真跑基线实验。**
- **非目标**：
  - 全库迁移 —— 理由：母规划明确排除；只做当前任务与已知链所需（`prd.md:194`）。
  - 生成八个空规范文件 —— 理由：八类是覆盖面不是文件数；空骨架被 AC-C01-1 判失败（`prd.md:75`、`prd.md:197`）。
  - 未来持续升级机制（C08）—— 理由：属 C08 职责；但本卡声明的入口迁移与实质生成**不能后置给 C08/C09**（`prd.md:194`、`prd.md:206`）。
  - 新设计源采集/提取器（C04）—— 理由：属 C04；本卡不要求 C04 先实现（`prd.md:194`、`prd.md:199`）。
  - 第九规范平台 —— 理由：横贯主题归原 owner 与基础规范（`prd.md:88`）。
  - 删除或改写历史 `Experience.md` —— 理由：不删历史、不静默丢规则（`decision-log.md:225`）。
  - 通用 IR / 全项目批量迁移 —— 理由：可后置技术项（`prd.md:206`）。
  - **有稿/无稿两条路径的完整 UI 验证** —— 理由：用户 q6 真实答复「留给 C09；本卡只做样本 + 环境 + 改造前基线的固定」。本卡交付其前提条件，不交付验证结论。
  - **真跑改造前基线实验** —— 理由：用户 q10 真实答复「只钉住对象与口径，不真跑」。
  - **新增 stage／gate／控制面／机器门** —— 理由：WP6 只做文本澄清与既有行为的测试固定（ADR-C01-017/018）。
- **载体事实修正（U-C01-004，用户 q8 已确认）**：母规划 `prd.md:147/366` 的「两页 Next.js 载体」按真实事实修正为 **PaperBuilder 的 React 19 + Vite SPA 前端**；`SimulationBoard`/`SimWorkbench` 是**设计源原型工程里的页面**（`specs/Design/实盘UI/src/components/`、`designs/figma-fuchuang/src/components/`），不是 PaperBuilder 的生产页面。母规划 `prd.md:24` 的「主要验证 React/Next.js」相应按实际栈读为 React。
- **目录决定（用户 q7 已确认）**：PaperBuilder 的规范正文就放 `specs/design/`，即既有的 `specs/Design/`（本机大小写不敏感，同一物理目录）；接受「设计原型与长期规范正文同目录」的角色混放。**该决定的区分大小写系统后果尚未裁定，按风险如实保留**（见 `## 风险与延期交接`）。
- **Supersedes / 修正**：本卡对母规划的 `prd.md:147`（设计源路径）、`prd.md:366`（Next.js 载体）作事实修正，并把 C09 早期准备落入本卡（U-C01-002）；不改母规划的八类路由、卡职责划分与 C09 的最终验证职责。母决定 `D-014` supersede 旧 `D-004` 的两文件限定与 Experience 分权（`decision-log.md:227`），明细只在母规划原件，本卡不复制。

完成判据：目标可观察，范围具体，每个非目标一行理由与去向；被替代主张逐条可定位，历史事实保留。

## 验收面

本节是 make-decision 到 build-plan 的交接索引；完整判据的唯一权威在 spec 的 `## Appendix A`，两处 AC 编号同号。

**编号口径**：AC-C01-1～AC-C01-4 的编号与判据直接承接母规划 C01 的 AC（`prd.md:197`），本卡不重编号、不改语义；**派生验收**（`AC-C01-F4`、`AC-C01-WP6`）另行注明，不插入原编号序列。

| AC 编号 | 可观察用例 | 成功条件 | 失败条件 | 证据 | 承接负责人 | 对应 UC |
| --- | --- | --- | --- | --- | --- | --- |
| AC-C01-1 | 三个内容起点（新项目已确认目标/方向/栈；已有可信规范；已有实现的可证明事实）分别用真实合法材料走一次读取/生成 | 三个起点各有真实合法材料的读取/生成例；所需八类内容可消费或具名不适用；缺源分支明确影响 | 空骨架、默认填业务规则、以错误实现冒正确标准 | **两条起点有真实依据**：PaperBuilder 的「已有可信规范」（根 `Design.md` 270 行 + `Experience.md` 318 行 + `CONTEXT.md` 383 行）与「已有实现的可证明事实」（`frontend/src/` 308 文件、根 `tests/` 291 项、内联 104 项、`ui/primitives.tsx`、`tokens-base.css`、38 ADR）。真实生成例 = `specs/design/*.md`（基于根 `Design.md` 真实内容迁入）与 `specs/frontend/frontend.md`（ADR-C01-004）。**第三条起点「新项目」无真实材料 → 具名缺口**（见覆盖结论） | build-plan 落验收判据；build-code 产出真实生成/读取证据；verify-code 独立核验 | UC-C01-1 |
| AC-C01-2 | 列出实际旧条款与引用，逐项给去向；核六处已知入口及相关 caller 实际读取新源 | 逐项去向齐备；六处入口及相关 caller 实际读新源；旧有效条款无静默丢失、无双 active 副本 | 只改 `ui-project-init`，或只替换文件名 | 条款去向 = `research.md` 的 47 条 clause 映射（DES-01…20 / EXP-01…21 / CTX-01…06）；reader 结果 = 改前后真实运行输出；WorkflowHub 侧断言 = `tests/contract/ui-skill-contract.test.mjs`（同批改，ADR-C01-002）；PaperBuilder 侧 = 专用分支上的真实改动 | build-plan 分配写集；build-code 实施；verify-code 独立核验 | UC-C01-2 |
| AC-C01-3 | 合法验收对象被真实消费者使用；去掉工作区／服务／route／状态／viewport 等必要项 | 真实消费者实际使用验收对象；去掉必要项时报出具体缺项；owner 缺省可见 | 只有 schema 样例、未执行 consumer；或只有模板条款、无**可执行的缺项拦截载体** | 落点**已定死** = `skills/spec-specify/templates/spec-template.md` 内的「验收对象」结构化区块（ADR-C01-009）；`workflows/build-plan/SKILL.md:21` 与 `workflows/verify-code/SKILL.md:18` 是该区块的**读取消费者**。证据 = 真实消费者运行输出 + **`tests/contract/acceptance-object-required-fields.test.mjs` 的运行输出**（去掉必要项时必须产生确定性报错并点名缺项，不能只有 schema 样例） | build-plan 分配写集；build-code 接入区块与拦截载体；verify-code 核验负例 | UC-C01-3 |
| AC-C01-4 | 分权后执行一次真实任务准备 | 设计/工程/任务/知识/facts 不混写；原始 `Experience` 仍在 | 未验证生成内容的语义适用性却报规范完成 | 真实任务准备输出；`/Users/Hugh/Hugh/Project/PaperBuilder/Experience.md` 仍存在且未被改写（字节与历史保持）；根 `Design.md` **已删除**且所有消费点已改指 `specs/design/`（ADR-C01-016） | build-plan 定义准备范围；build-code 执行；verify-code 核验不混写、`Experience.md` 保留与 `Design.md` 删除及 repoint | UC-C01-4 |
| **AC-C01-F4**（派生，不重编号；依 detail 审查 F-DET2-31 补） | C01-F4 的 SDD／材料评估采用与 S3 履行 | 固定来源身份可核（`spec-driven-production@000b04a2a3553bddcf991b3dc42f9a5a2746fa6f`、`material-agent-readiness-eval@b62e87f3f91868033106b21f6398f0fd6d3d2043`）；许可与完整依赖闭包已核或如实 `unavailable`；被真实 consumer 使用；未安装/不可达时如实登记且不包装成已交付 | 只写「已采用」而无来源身份、许可/闭包核验或真实 consumer | 采用登记原件（`skills/reuse-registry.md`/`catalog.yaml`）+ 核验记录或 `unavailable` 原文 | build-plan 定核验动作；build-code 执行；verify-code 核验 | UC-C01-4 |
| **AC-C01-WP6**（派生，不重编号；WP6 进正式范围的唯一可观察验收） | ①`skills/wh-review/SKILL.md` 是否写清公开入口与 ref 解析差异并被一条契约测试固定；②`workflows/make-decision/SKILL.md` 每步「本步产物／进下一步前」是否提到**行首加粗**；③`skills/talk-with-zhipeng/SKILL.md`（及其格式文档）是否新立「用户可见的说话方式」一节、明确禁掉大写编号／文件名加行号／下划线字段名、并补一段正面示范 | 三项**全部**具备：①入口差异有文本且契约测试真实运行通过；②可发现性改写落在**行首加粗**形态；③三节内容齐备（新节 + 三种形态禁令 + 一段正例） | 三项中任一项缺失，或只改了文本而契约测试未真实运行，或把「可发现性改进」做成新的 stage/gate/机器门 | 三份文件的改动后字节；`tests/contract/wh-review-public-entry-and-ref-resolution.test.mjs` 的真实运行输出 | build-plan 分配写集；build-code 实施；verify-code 核验三项齐备 | UC-C01-5 |

判定器（承接 `prd.md:198`）：真实来源及迁移前后条款/reader 结果对照，现任务准备输出，合法/缺项/冲突的定向负例，独立文档/语义检查。测试能证明读取失败与规则丢失，不仅数文件；**本卡不等待 C09 给结论**。

**覆盖结论（当前，如实保留缺口）**：R-C01-01～R-C01-12 已各自落到 `ADR-C01-001`～`ADR-C01-018` 的对应决定或 `## 范围与非目标`；**U-C01-001～U-C01-008** 见 `requirement-change-log.md`（主文 U 表与原件逐条一致）。**本卡不声称覆盖已全部完成**，已知缺口逐条如下：

1. **「新项目」入口无真实材料**（对抗性检查 A1）→ AC-C01-1 的该入口只能记未完成，不得以夹具或空骨架冒充。
2. **G-2 ②类双写冲突**已由 ADR-C01-005 处置（用户 q13 授权改守卫），但**守卫改造未执行、未验证**，执行前该冲突保持 open。
3. **G-1 治理条款无家可归**（OI-C01-024）已登记，承接者待定。
4. **锚名与取值锚格式无归属**（OI-C01-025）已登记，由 ADR-C01-012 承接过渡别名，具体映射留 build-plan。
5. **六指标改造前原始记录零证据**（ADR-C01-010），AC-C09-1 的该条到 C09 仍需补跑。
6. **上游技能原件不可核**（审计 E-2，OI-C01-019/OI-C01-028）。
7. **审计未做全库穷尽扫描**（`skills/**/*.json`、`docs/templates/**`、`metrics/**`）；`workflows/build-code/` 的 reader 判定亦未闭合（OI-C01-018/OI-C01-027）。
8. **`specs/design` 与 `specs/Design` 在区分大小写的系统上会分裂成两个目录** —— 规范大小写由主会话**暂定为小写 `specs/design/`**（依母规划 U-020 既定目录名；属「普通细节的最小合理假设」，**未经用户确认、用户可覆写**）；既有 `specs/Design/`（设计原型）**不改名、不搬家**（其路径被 `tests/test_prd_f6_sync.py` 字节锁与 38 份 ADR 按「路径+行号」引用）。**分裂风险未被消除**：在区分大小写系统上仍是两个目录，须由 build-plan 落实一次「区分大小写环境的布局验证」。

逐项对账读取唯一 `coverage-matrix-5d.md`（**已产生**，基准目录 `<本卡任务库根>/quality/evidence/decision-log-refs/`）；该原件的 R-C01-05／R-C01-08 两行已按当前决定订正。

完成判据：每条承诺有可观察用例、成功与失败边界、证据或具体缺口、承接负责人及对应 UC；spec 承接后逐条核对同号；覆盖矩阵逐项有事实、处置与落点或缺口。

## 未决项

本节回答尚缺什么、谁来解决以及下一步是什么。

| OI 编号 | 问题与来源 | 状态与处置 | 解决者与下一步 |
| --- | --- | --- | --- |
| OI-C01-001 | 「首个真实项目」是哪个真实项目？来源 `prd.md:194` | **已由真实答复回答（2026-10-14）**：PaperBuilder（`/Users/Hugh/Hugh/Project/PaperBuilder`）。见 U-C01-001 | 已关闭；依据 `talk-batches.md#batch-001` |
| OI-C01-002 | 三种起点的真实合法材料从哪来？来源 `prd.md:197`（AC-C01-1） | **部分由事实回答**：PaperBuilder 侦察确认它**明确不是「新项目」起点**，主体是「已有实现的可证明事实」，兼有形态不同的「已有可信规范」。第三条起点仍无真实材料，按用户 q20 如实记缺口 | 已按用户 q20 处置；缺口见 `## 验收面` 覆盖结论 1 |
| OI-C01-003 | 八类规范中本项目实际适用哪几类？`specs/design/`、`specs/frontend/` 当前是否存在？ | **事实已回答**：PaperBuilder 侧 10 个规范路径全缺、`spec/` 不存在、无 `GLOSSARY.md`（职能由 `CONTEXT.md` 承担）；本仓侧同样 7 类零文件零引用，仅领域语义 `GLOSSARY.md` 已就位。「本项目」已由 q12 明确为两侧都动（OI-C01-015） | 已关闭；依据 `talk-batches.md#batch-004` |
| OI-C01-004 | 本仓 `Experience.md` 及同类旧文件的现存位置、有效条款数、consumer？ | **事实已回答（PaperBuilder 侧）**：`Experience.md` 在 PaperBuilder 根，318 行，`anchor_id: PB-EXP-ROOT`、`mode: legacy`、`revision: 2026.09.20.1`。条款级去向清单已由 `research.md` 产生（47 条） | 已由 ADR-C01-006 承接 |
| OI-C01-005 | 六处点名入口之外还有哪些 caller 读旧路由？ | **事实已回答**：审计给出 25 条命中；额外命中 `skills/frontend-component-quality:61`、`skills/isolated-browser-qa:231`、`skills/spec-prd:45`、`skills/reuse-registry.md:47/92-94`、`skills/catalog.yaml:842/850`、`docs/adr/0015`、`docs/adr/0016`、`tests/contract/ui-skill-contract.test.mjs:19/42/198`。审计已声明未做全库穷尽扫描（`skills/**/*.json`、`docs/templates/**`、`metrics/**` 等），保留残余未知 | 已由 ADR-C01-001 全部处置；残余未知按具名缺口保留 |
| OI-C01-006 | S5 验收对象合同的字段清单从哪来、承载在哪里？ | **已由真实答复关闭**：落点定为 `skills/spec-specify/templates/spec-template.md` 内「验收对象」结构化区块；缺项报具体名称、owner 缺省=用户；并补一条真会跑的缺项拦截契约测试 | 已关闭；依据 ADR-C01-009 + `talk-batches.md#batch-009`（模块三） |
| OI-C01-007 | C09 的样本/环境/改造前基线由谁承载？ | **已由真实答复回答**：放进本 C01 任务作为独立工作包（WP-B）。见 U-C01-002 | 已关闭；依据 `talk-batches.md#batch-001` |
| OI-C01-008 | 本卡是否有真实 UI 设计展示？ | **已由真实答复回答**：不需要，记 `not_applicable`。见 U-C01-003 | 已关闭；依据 `talk-batches.md#batch-001` |
| OI-C01-009 | 旧 `T02-FR-3`（stylelint 规则包）是否确认归 C06 不在本卡？ | **open**；母规划 `prd.md:471` 明确归 C06，但本卡未取得用户确认 | 用户；后续确认时问 |
| OI-C01-010 | 本卡是否 mini-task？ | **已由独立评估回答**：**不建议 mini**。C01 命中「重大迁移」与「重大架构（权威来源变更）」两项一票否决判据，须走普通五阶段 | 已关闭；依据独立 mini 评估（见 `## 风险与延期交接`） |
| OI-C01-011 | 「实现有稿和无稿的UI验证」是本卡交付，还是 C09 交付、本卡只做样本/环境/改造前基线准备？来源：U-C01-001 第 3 条 | **已由真实答复回答（batch-002 q6）**：留给 C09；本卡只做样本 + 环境 + 改造前基线的固定 | 已关闭 |
| OI-C01-012 | 用户授权「自己设计需求」与母规划「不以母PRD授权当前即实施」的关系；本卡可新增/改写已确认需求到什么程度？ | **已由真实答复关闭**：授权边界以 batch-004 q12、batch-005 q15、batch-006 q17/q18、batch-008 q23、batch-009 各模块裁定为准；母规划八类路由、卡职责划分与 C09 最终验证职责不动 | 已关闭；依据上述各批真实答复 |
| OI-C01-013 | 改造前基线要固定哪些对象？「固定旧 WorkflowHub 版本」取哪个 commit？ | **已由真实答复回答（batch-003 q9/q10）**：commit = `b66c1348`；只钉口径不真跑。对象清单见 ADR-C01-010 | 已关闭 |
| OI-C01-014 | 基线准备是否需要独立 task/worktree？还是作为本卡的一个 Phase？ | **open**；用户已定「放进本卡」（U-C01-002），但内部承载形态（Phase vs 工作包）留 build-plan | 主会话；build-plan |
| OI-C01-015 | U-C01-003 的「本项目」指 WorkflowHub 仓还是 PaperBuilder 仓？ | **已由真实答复回答（batch-004 q12）**：PaperBuilder 侧落 `specs/frontend/frontend.md`；WorkflowHub 侧改方法。两侧都动 | 已关闭 |
| OI-C01-016 | 本卡提交范围是否跨到 PaperBuilder 仓？ | **已由真实答复回答（batch-002 q5、batch-003 q11）**：要跨；PaperBuilder 开专用分支，验证后合并回 `main` | 已关闭 |
| OI-C01-017 | `specs/Design/` 与母规划要求的 `specs/design/` 是同一物理目录；且载体事实不符 | **已由真实答复回答（batch-002 q7/q8）**：目录就用 `specs/design/`（接受混放）；载体修正为 React 19 + Vite SPA（U-C01-004）。在区分大小写的系统上会分裂为两个目录——规范大小写由主会话**暂定为小写 `specs/design/`**（依母规划 U-020 既定目录名；属「普通细节的最小合理假设」，**未经用户确认、用户可覆写**）；既有 `specs/Design/`（设计原型）**不改名、不搬家**（其路径被 `tests/test_prd_f6_sync.py` 字节锁与 38 份 ADR 按「路径+行号」引用）。**分裂风险未被消除**：在区分大小写系统上仍是两个目录，须由 build-plan 落实一次「区分大小写环境的布局验证」，按风险如实保留 | 目录与载体部分已关闭；**大小写分裂风险待用户裁定** |
| OI-C01-018 | `workflows/build-code/` 无任何显式旧规范 reader：是「间接继承」还是「真缺口」？来源：审计 E-3 | **open** | 主会话；build-plan |
| OI-C01-019 | `design-tokens`、`frontend-design` 等被指为写主的原技能在本仓不存在，C01 无法核其真实性；是否接受「引用而不核运行时」？来源：审计 E-2、母 OI-03 conditional | **open** | 主会话 + 用户 |
| OI-C01-020 | `docs/adr/0015` 是否 supersede（当前 Accepted 与 S2/GLOSSARY 形成规范双 active）；`design_revision` 无 consumer 的悬挂字段如何处置？来源：审计 D-4/E-4 | **open**；medium，但决定迁移能否落地。已在 ADR-C01-003 记处置方向，落点与形态留 build-plan | 主会话；build-plan |
| OI-C01-021 | PaperBuilder 侧专用分支的名字、以及「合并回 main」的时点与授权路径 | **open**；用户已定「开专用分支、验证后合并」（U-C01-005），细节留 build-plan 与实际执行 | 主会话；build-plan |
| OI-C01-022 | 「有稿」在 PaperBuilder 语境下的具体含义（把设计源在 PaperBuilder 里还原？还是设计源 vs PaperBuilder 现状对比？）——属 C09 的对象定义 | **open**；本卡只固定样本与口径，把该问题作为具名传递项交给 C09 | C09；本卡登记传递 |
| OI-C01-023 | PaperBuilder 侧落地的精确粒度与②类正文是否新建 | **已由真实答复关闭（batch-005 q15）**：根 `Design.md` 要**基于其真实内容迁移到 `specs/design/` 里**，并检查内容是否需要更新；其后 batch-008 q23 进一步定「按母规划 S2 分文件建」 | 已关闭；依据 ADR-C01-004 / U-C01-006 / U-C01-008 |
| OI-C01-024 | G-1 治理条款无家可归（`Design.md:226-233`、`Experience.md:253-258` 的变更门与 `DES-01`/`EXP-02` 文档元数据，八类均不承载） | **open**；本卡登记具名缺口与承接者，不硬塞进八类 | 主会话；build-plan 定承接者 |
| OI-C01-025 | 锚名 `PB-DES-LIVE-REFERENCE` 与「取值锚 markdown 格式」在八类中无归属，却被 4 处测试硬编码消费 | **open**；ADR-C01-005 的守卫改造会改变其消费方式，ADR-C01-012 已给过渡别名，具体映射留 build-plan | 主会话；build-plan |
| OI-C01-026 | 新增起点形态「已有可运行设计原型工程」是母规划未定义的第四种形态 | **open**；ADR-C01-011 已记，需在 build-plan 与后续卡片显式承接 | 主会话；build-plan + 后续卡片 |
| OI-C01-027 | `workflows/build-code/` 无任何旧规范 reader：间接继承还是真缺口？PaperBuilder 侧门禁测试的改动需 owning build-plan correction + 独立 test-change review，该流程归属哪个任务 | **open**；ADR-C01-005 已授权改动，流程归属待定 | 主会话；build-plan |
| OI-C01-028 | 母规划指为写主的 `design-tokens`、`frontend-design` 等原技能在本机不存在；②类值源动作的真实 owner 与存在性验证方式未定（direction 审查 F-DIR-04 新增） | **open**；已补入收敛大纲 | 主会话；build-plan |
| OI-C01-029 | 锚名过渡别名的退出条件（ADR-C01-012） | **open**；避免长期形成第二套命名 | 主会话；build-plan |
| OI-C01-030 | 「范围 vs 验收标准」的验收分歧（direction 审查 F-DIR-05/10/16/19）：AC-C01-1 要求三入口、AC-C01-2 要求六处入口实际读新源，而真实材料只覆盖两个入口 | **已由真实答复关闭（batch-006 q20）**：AC-C01-1 的「新项目」入口**如实记为未完成缺口，不扩范围**；该缺口在 `## 验收面` 的覆盖结论中已具名列出 | 已关闭（detail 审查 F-DET2-15/32 指出的"重新开回"已修正） |

需要目标/范围/方案/验收四行答复时读取外置收敛检查；需要 OI 与大纲节点对应关系时读取外置 OI 大纲，路径见 `## 外置事实索引`。

完成判据：未决项在一张表中一条一行，逐项有问题、来源、真实状态、处置或下一步及解决者；零问题写无。**本表 OI-C01-001～OI-C01-030 全部真实存在于表中，正文引用到的每个 OI 编号均可在此查到。**

## 风险与延期交接

本节回答风险怎样触发、造成什么后果以及由谁承接。

| 内容 | 触发与后果 | 处理阶段与 owner | 来源 |
| --- | --- | --- | --- |
| 旧规则与隐含 reader 遗漏 | 迁移时只改显名入口，隐含 consumer 仍读旧路由，形成新旧双 active 或规则静默丢失 | 本卡以逐条来源/去向与真实 reader 输出发现；缺项保留并定向修复 | `prd.md:205`；审计 A 表已给出 25 条命中 |
| 契约测试构成反向激励 | `tests/contract/ui-skill-contract.test.mjs:19/42` 硬断言 SKILL.md 必含字面量 `"Design.md"`；实施者可能为保 GREEN 而保留旧字面量，制造新旧双 active | 同批改断言到八类口径，并在独立审查中核对「旧字面量残留」事实 | 审计 D-1/D-6 |
| `docs/adr/0015` 规范双 active | 该 ADR 仍是 Accepted，与 S2/GLOSSARY 的八类口径并存；其删除条件还挂在旧源引用上，形成死锁 | 在本卡内 supersede 或 amend，并解开删除条件 | 审计 D-4 |
| `build-plan/SKILL.md:19` 与 `:30` 同文件双写 | 只改一处会把另一处留成静默残留的第二 active 条款 | 收敛为单一分权正文；独立审查逐处核对 | 审计 D-2、`decision-log.md:219` |
| 六指标改造前原始记录零证据 | 全盘不存在 `baseline-metrics.json`；本卡按用户答复不真跑基线，因此 AC-C09-1 的该条到 C09 仍需补跑 | 本卡只钉口径并**如实标缺口**（标 `absent`，不标 0），不得宣称该 AC 成立；缺口传给 C09 | 侦察 C 节、U-C01-005 |
| 设计源两代混用 | `/Users/Hugh/Downloads/UI`（2026-10-01）与 `/Users/Hugh/Downloads/UI设计稿`（2026-09-05）是同一工程两代，两个关键页面组件被改写（`SimWorkbench` 858→1893 行）；两代都不是 git 仓库，无版本号 | WP-B 必须记录选定代次的绝对路径 + mtime；C09 按 AC-C09-2 显式声明选定代次，禁止混用 | 侦察 B 节、`prd.md:369`（AC-C09-2） |
| PaperBuilder 目录角色混放 | `specs/design/` 与既有 `specs/Design/` 在本机是同一物理目录，规范正文将与设计原型 HTML/工程同目录 | 用户 q7 已确认接受；在规范文件内与基线口径中显式写明该目录的双重角色 | U-C01-004 相关、侦察 A.2 |
| **`specs/design` 与 `specs/Design` 在区分大小写的系统上会分裂** | 本机 APFS 大小写不敏感，两条路径是同一目录；**在区分大小写的系统（如 Linux checkout）上会分裂成两个目录**，共享同一目录的内容与引用会被分到两条路径上，出现同一规范两处落点、repoint 指向不一致、`make check` 字节锁按路径命中与否不一致的后果 | 规范大小写由主会话**暂定为小写 `specs/design/`**（依母规划 U-020 既定目录名；属「普通细节的最小合理假设」，**未经用户确认、用户可覆写**）；既有 `specs/Design/`（设计原型）**不改名、不搬家**（其路径被 `tests/test_prd_f6_sync.py` 字节锁与 38 份 ADR 按「路径+行号」引用）。**分裂风险未被消除**：在区分大小写系统上仍是两个目录，须由 build-plan 落实一次「区分大小写环境的布局验证」。承接：build-plan 落实该验证动作；用户可在 build-plan 前覆写该暂定 | codex/luna detail 审查第二轮（大小写不敏感文件系统假设不成立）；`research-independent-check.md` 同 inode 事实；OI-C01-017 |
| 跨仓交付 | PaperBuilder 侧改动不在本任务认证 worktree（`runtime/task/workspace.mjs` 只绑一个）；误操作可能扰动 PaperBuilder 的 `main` | 按用户 q11 答复用专用分支；合并回 main 前核实际 HEAD 并走真实 Git 授权 | U-C01-005、侦察 A 节 |
| 上游技能原件不可核 | 母规划指为写主的 `design-tokens`、`frontend-design` 等在本仓不存在，无法核其生成/维护动作的真实性 | 采用前核文件、依赖闭包、许可与真实运行条件；核不到就具名保留缺口，不冒「已验证」 | 审计 E-2、母 OI-03 conditional |
| 材料评分冒产品有效 | 用材料评分/Markdown 重生成证明规范生效，实际消费者未运行 | 本卡以真实 consumer 实际读取为判据（AC-C01-2/3） | `decision-log.md:226` |
| 条件生成器不可用 | 无 Figma/非 shadcn 主路径下照搬生成器物；PaperBuilder 真实前端无 Tailwind 而设计源用 Tailwind 4 | 不强换项目库；无合法路径时说明具体后果再处理；来源边界按八类实际 owner 定 | `prd.md:205`、`decision-log.md:250`、侦察 A 节 |
| 静态研究被冒充可运行能力 | 把母规划的研究结论当成已验证能力，跳过真实运行 | 本卡逐条区分「已交付」与「静态研究」；未运行保未完成 | `decision-log.md:325` |
| 目录拼写回退 | 误建 `spec/` 而非 `specs/`，或新增 `domain.md`；PaperBuilder 侧无 `GLOSSARY.md` 而只有 `CONTEXT.md` | 以 `decision-log.md:231` 与本仓 `GLOSSARY.md` 为准；PaperBuilder 术语载体按收敛结论定，改动前核真实目录 | `decision-log.md:231`、U-020、侦察 A.1 |
| C01-F3 无落点 | 「验收对象」在 live 树没有任何 schema/字段要求工作区/服务/route/状态/viewport 具名，也不要求 owner 缺省显式为用户 | 已由 ADR-C01-009 定死落点并补可执行缺项拦截载体；实施与核验在 build-code/verify-code | 审计 E-6、`prd.md:196` |
| **未实测：PaperBuilder 构建与测试** | 本卡**没有运行**任何 PaperBuilder 构建或测试（`make check`/`pnpm`/vitest/Playwright）；「迁移后相关测试是否真的绿」属未实测，**不判失败、也不冒通过** | 列为 build-code 的验证项；执行时记录真实命令与退出码 | 本阶段执行事实 |
| **未核：外部来源许可与依赖闭包** | `spec-driven-production` 与 `material-agent-readiness-eval` 两个固定来源的许可与完整依赖闭包未核 | 按 S3 归采用者；核不到记 `unavailable`，不冒「已采用」（AC-C01-F4） | ADR-C01-015、`prd.md:604` |

### 方向对抗性检查（make-decision step6）

轻量攻击当前方向是否过早锁定、隐藏前提及更小可逆路径。**不设否决权**，只产出带事实依据的风险清单；不替用户选方向，也不增设机器门。

| # | 攻击点 | 事实依据 | 若不处理的后果 | 更小/更可逆的路径 |
| --- | --- | --- | --- | --- |
| A1 | **过早锁定「首个真实项目 = PaperBuilder」** | 该结论来自用户真实答复（`talk-batches.md#batch-001`）；而侦察确认 PaperBuilder 只是三个内容起点里的「已有实现 + 已有规范」，**「新项目」这一入口没有真实材料** | AC-C01-1 要求「三个起点分别有真实合法材料的读取/生成例」；若只跑通两个，该 AC 只能记未完成，而不是靠夹具冒充 | 把「新项目」入口显式记为具名缺口并写明影响，只对已具备真实材料的入口取证；待真实新项目出现再补。**不**把这一缺口藏进"覆盖完成" |
| A2 | **隐藏前提：旧条款都能干净归入八类** | `Experience.md` 是 `mode: legacy`，318 行里含 CARD08 对账账本的长段行为契约（侦察 A.1） | 强行归类会造出假规范，或把任务历史升格成长期 MUST；这正是 `decision-log.md:225` 禁止的「假报已迁」 | 允许第三种去向：**任务专用条款归任务 spec/API，历史留原文件**（`D-014` 原文即「分配到相应专业源**或任务合同**」）；无家可归的条款必须具名，不得"其它" |
| A3 | **基线口径漏了 PaperBuilder 自身的改造前状态** | 侦察确认 PaperBuilder `main` 领先 `origin/main` 3 个提交、HEAD `8569bd5`；本卡将在它上面开分支改规范 | 一旦本卡改了 PaperBuilder，它的「改造前」状态就被覆盖，C09 再也取不到 | 基线口径必须**同时**钉住 PaperBuilder 的改造前 HEAD `8569bd5` 与其 `[ahead 3]` 事实；这是零成本动作，必须在任何 PaperBuilder 改动之前完成 |
| A4 | **不可逆动作：合并回 PaperBuilder main** | 用户 q11 已选「开专用分支，验证后合并回 main」 | 误合并会扰动 PaperBuilder 自身开发线，且与它 3 个未推送提交交叠 | 分支隔离 + 合并前核实际 HEAD + 走 `runtime/interface/git-authorize.mjs` 真实授权；无法验证的部分保持未合并并如实报告 |
| A5 | **范围膨胀：用户授权「自己设计需求」** | `talk-batches.md#batch-001` 的用户原话；而母规划说「不以母PRD授权当前即实施」（`prd.md:208`） | 本卡可能悄悄吸收 C05/C06/C07/C09 的职责，产出无人验收的新承诺 | 本卡只把「有稿/无稿验证所需的前提」作为**传递项**记录（样本、环境、口径、缺口），不实现验证本身；超出本卡卡面的需求一律写成 C09 的输入而非本卡交付 |
| A6 | **八类目录约定的既有事实未被母规划预见** | `specs/design/`（母规划）与 PaperBuilder 既有 `specs/Design/` 在本机是同一物理目录，且该目录装设计原型（侦察 A.2）；**在区分大小写系统上会分裂** | 规范正文与设计源混放，读者无法判断哪个是长期权威；大小写分裂后同一规范出现两处落点 | 用户 q7 已选择接受混放；本卡只需在规范文件与基线口径中显式写明该目录双重角色，不改动既有原型文件（改动它们会打断 38 个 ADR 的路径+行号引用）。大小写已由主会话按最小合理假设暂定（未经用户确认、用户可覆写），分裂风险仍在，按上表同名风险行如实保留 |
| A7 | **「两页 Next.js」这一被确认载体在现实中不存在** | 侦察 C 节：仓库与 `Project/` 下均无任何 Next.js 工程；唯一实物在设计源里 | 若继续按不存在的载体做规划，C09 的比较对象永远建不起来 | 已由 U-C01-004 按真实事实修正为 PaperBuilder 的 React SPA；C09 的对象定义据此重写 |

**结论**：当前方向**没有**被判定为无效或违反硬约束，也没有出现必须停止的迹象；上述 7 条均为"需要显式处置"的风险，其中 **A2（条款去向）与 A3（PaperBuilder 改造前 HEAD）必须在本卡收敛阶段落成具体决定**，A1 的缺口必须具名保留。Kill 与 Recycle 的真实判断权在用户与后续独立审查，此处只列事实。

### 逐模块收敛结论（第二轮，按用户要求逐模块讨论所得）

用户当面指出：主会话在「大纲确认」之后**没有逐模块与用户讨论需求细节**，且此前「由一个技能返回八类规范」的设计偏离母规划。主会话据此补做三份调研，并**逐模块**与用户讨论（7 个模块、14 个问题），逐字答复见 `talk-batches.md#batch-009`。本节结论**取代此前仅由主会话单方写出的模块设计**。

| 模块 | 讨论到的选择 | 用户裁定 | 影响的决定 |
| --- | --- | --- | --- |
| 一 规范由谁写 | 内容归各专业方法，还是归一个技能 | **薄入口：接线员只接线，内容归专家** | 回改 ADR-C01-014 |
| 二 改读取点 | 改动范围 / 旧规则去向粒度 / 仓库硬测试 | **25 处全部处置；47 条逐条列去向；硬测试同批改成按新分类判断** | ADR-C01-001 / ADR-C01-002 |
| 三 验收对象 | 缺项报出的形态 / 最小必填集 | **模板写规则 + 一条真会跑的检查；先定最小必填集** | ADR-C01-009 |
| 四 外部方法 | 采用深度 / 是否存本地副本 | **登记采用 + 至少真跑一次；先核许可，允许就存固定副本** | ADR-C01-015 |
| 五 PaperBuilder | 旧条款处置口径 / 入口索引 | **逐条判断保留-更新-标已过时；新建一份只当指引的入口短文档** | ADR-C01-004 / 006 / 008 |
| 六 修我自己的毛病 | 说话改法 / 跳步改法 | **说话：新立一节 + 禁三种形态 + 补正例；跳步：只做甲（每步产物提到行首）** | ADR-C01-017 / ADR-C01-018 |
| 附加 基线 | 样本粒度 / 六指标缺口交付 | **钉住材料来源与代次、具体对象留后；六指标缺口明写不存在并列下游开工前置** | ADR-C01-010 / ADR-C01-013 |

**三份补充调研的结论（原件在 `quality/evidence/decision-log-refs/`）**：

1. `research-nav-c01-and-skill-division.md`——回到母规划核清分工：`ui-project-init` 的原文职责是**薄规范入口**（定位每类真实来源/作用域/版本/owner/consumer/缺口 + 接线 + 显露缺口），**不是**八类正文的 writer；铁证为「编排只接线，不成为新规则 writer 或自创规范维护 skill」与「规范写主是各事实原专业 owner」。八类内容各有专业 owner。**「三种入口」是内容的三种起点（新项目／已有可信规范／已有实现），按类分别取源**，不是一个技能实现三条入口。**「一个技能返回八类」违背 16 条原文**，已回改。
2. `research-make-decision-defect.md`——跳步根因有二且互相独立：①**要求无产物形态定义**（step9 的「red/blue 争议清单」全仓只出现一次、藏在 872 字长段落的第二句、无形态/无落点/无最小字段，且与 wh-review 的 red/blue pair 重名撞车）；②**约束无消费者**（`make-decision/steps.json` 的 `loadStageSkillStepManifest` 全仓零调用者，其 `observable_result` 声明不进上下文也不进包，且系统性弱化 SKILL.md——step10 的三条完成判据在清单里零覆盖）。15 步里只有 2 步有显式完成判据；`grep 前置/若未满足` 在 SKILL.md 零命中，而「全部模块收敛后」里的「收敛」全文无判据定义。**事实更正：第一次 detail 审查（33 条 findings）全是文档一致性问题，无一条发现跳步；S-1～S-9 由用户当面质疑后自查发现——这本身印证根因②（审查材料不含步骤执行轨迹）。**
3. `research-talk-plain-language-defect.md`——用户侧大白话要求存在，但**只禁 5 个英文词（内部 ID/hash/receipt/attempt/runner），从未禁「编号」形态**（`WP1`/`AC-C01-1` 这类大写编号全仓无禁令）；且**用户语域与记录语域同节混载**，记录侧编号/字段约束密度（19 处）远高于用户侧（9 处）且**零正例**；`grill-with-docs` 把 `question_id`/`axis`/`option_id` 写成「大白话问题卡」的组成，`talk-with-zhipeng` 的 YAML 示例紧跟在「每题必须使用统一问题卡：」之后，两者都把内部字段名投射成「卡本身」。

**残余风险（不得声称已消除）**：文本加固只能让漏做**更容易被自己看见**，**不能**把「没看见」变成「被发现」。本卡**不声称**跳步不会再发生；该残余风险登记在本节与上表。

### 本阶段执行缺陷与补救（stage self-audit，2026-10-14）

用户对本阶段的执行顺序提出质疑后，主会话逐条自查，结论如下。**以下均为真实缺陷，不是"已处理"**。

| # | 缺陷 | 事实 | 补救 |
| --- | --- | --- | --- |
| S-1 | **step9 模块收敛未完成就进了 step10** | `workflows/make-decision/SKILL.md` 第 46 行要求模块收敛「产出 red/blue 争议清单并逐条给处置，辩论未决项」；本卡**从未产出 red/blue 清单，也未逐模块与用户辩论未决项** | 回到 step9：产出 red/blue 清单、逐条处置、取得用户对未决项的答复，之后才做 detail。**已补做**：red/blue 争议清单 RB-1～RB-6 逐条有处置，无遗留未决项 |
| S-2 | **step10 的完成判据未满足** | 同文件第 49 行要求「写集表每个文件只有一个写主」；`ADR-C01-009`（验收对象落点）的精确文件与符号仍写「待 module-convergence 收口时定」，**不满足单一写主** | 在 step9 内把该落点定死，再重跑 detail。**已完成**：落点定死为 `spec-template.md` 内区块，写集每行有唯一写主 |
| S-3 | **step5 outline-talk 未真实收口** | 修订后大纲写进了本日志，但**从未取得用户对大纲本身的显式确认**；只在 q14 里问了模块顺序 | 本卡 Talk 第 6 批补问大纲确认（见 `talk-batches.md#batch-006`）；**之后 batch-007 q21 取得用户对重做后大纲的真实确认** |
| S-4 | **step8 module-breadth-confirm 只做了半截** | 该步要求「全部模块命名，各用一到三句说明范围，列风险与优先级排序；取得用户的粗粒度真实确认」。实际只问了「先做哪个」，**未取得模块清单与范围的确认** | 同 S-3，在同一批补问；**并已由 batch-009 的逐模块收敛补齐** |
| S-5 | **step3 的外部调研分支起初未执行** | 该步要求「内部与外部研究」。本卡起初只做了内部研究（迁移面审计、现场侦察、条款级映射、独立核对），**外部调研空白** | **已补救**：对 C01-F4 的两个固定来源做了真实可达性与内容性质核实（均 HTTP 200、内容与 `prd.md:610/611` 一致），原件见 `research-external-sources.md`；并更正了「把 UI Designer 子技能与本两个来源混为一谈」的事实错误 |
| S-6 | **detail 第一次运行的材料投递由我方两个错误造成** | ①**调用入口错误**：用了裸 `wh-review-cli.mjs run`，该入口不经过 `resolveMaterialRefs`，ref 被序列化成 JSON 存根；**正确入口是 `stage-runtime.mjs review --action=record`**（`review-record` 作为 CLI 命令会被拒，报 `unknown public runtime behavior`），且**必须在认证 worktree 内执行**，否则报 `CURRENT_WORKTREE_MISMATCH`。②**嵌套 ref 错误**：把 `{ref, sha256}` 放进 `context_map`／`evidence_map` 的**成员**里，而解析只覆盖 `materials` 顶层成员——`workflows/make-decision/SKILL.md:48` 已明确警告「嵌套 ref 不被 resolver 递归读取，不能算已送达」 | 已改走官方 `review --action=record` 路径重做一次（在认证 worktree 内执行） |
| S-7 | **detail 重试被主动暂停** | 第二次 detail 运行已内联正文、材料投递正确，但**在产出前被主动取消**，原因是 S-1/S-2 未补救——继续跑会审到未收敛的方向并浪费「每轨一次」的机会 | 完成 step9 后重跑一次 |
| S-8 | **主会话两次误判根因，并据此错误地指向 wh-review 与 make-decision 方法** | 第一次断言「wh-review 没有 ref 解析实现」；第二次断言「make-decision 方法文本与实际执行路径不匹配」。两次都没先核实官方命令入口就下结论 | 两次更正已追加到 `review-dispositions.md`（保留错误原文，不改写历史）；本表与下文「关于 wh-review 与 make-decision 的核查结论」按真实事实重写 |
| S-9 | **方案大改后没有主动重审** | 第一次 detail 审查（33 条 findings）审的是此后已被取代的方案；其后模块结构两次重做、内容归属根本变更、读取点 6→25、条款去向汇总→逐条、验收对象加了可执行检查、外部方法加了真跑、新增 WP6 与三条 U。**当前方案当时从未被独立审查看过**，而主会话没有主动识别应重审 | 由用户主动提问后重跑第二次 detail（依据与限定见 `review-dispositions.md` 第四节）；本条缺陷本身如实留档 |

**关于 wh-review 与 make-decision 的核查结论（第二次更正，取代我先前的错误判断）**：

- 主会话先前两次「根因判断」（先是「wh-review 没有 ref 解析实现」，后是「make-decision 方法文本与实际执行路径不匹配」）**均为错误**；两次更正都已留在 `review-dispositions.md` 的原始记录里，不改写历史。
- **真实事实**：`resolveMaterialRefs` 定义在 `tools/cli/stage-runtime.mjs:679`，由公开命令 **`stage-runtime.mjs review --action=record`** 调用（命令集 `:1236`、解析调用 `:998`）。**wh-review 与 make-decision 的方法本身没有缺陷。** 母任务走的正是这条官方路径——其请求文件以 `quality/evidence/decision-log-refs/*review-request.json` 的形态保存在母任务库中，`approved_direction` 同样是 `{ref, sha256}` 并被正确解析。
- **真正的错误是主会话的调用入口**：用了裸 `skills/wh-review/scripts/wh-review-cli.mjs run`，该入口不经过 `resolveMaterialRefs`，于是 ref 被序列化成 JSON 存根投递。
- **另一个自身错误**：把 `{ref, sha256}` 放进 `context_map`／`evidence_map` 的**成员**里。即使走官方路径，解析也只覆盖 `materials` 的**顶层**成员，嵌套 ref 不展开——`workflows/make-decision/SKILL.md:48` 自己就写了这句警告。
- **是否需要修**：`skills/wh-review/SKILL.md:58` 写「当前 CLI 保留 run、verify-final、doctor 的真实既有接口，按实际脚本参数调用」，容易让执行者误以为裸 `run` 与公开入口在 ref 解析上等价。**用户已在 batch-007 q22 裁定把「审查入口澄清 + 一条契约测试」放进 WP6 在本卡内做**（ADR-C01-017），并已在 `## 要改哪些文件` 列入 `skills/wh-review/SKILL.md` 与新增契约测试；本卡不再保留「超出范围、不修改」的旧结论。
- **处置**：细节审查走公开 `review --action=record` 路径在认证 worktree 内执行；第二次 detail 运行即本轨有效重审（原件 `2026-10-14-027`）；先前两次（裸 CLI 一次、被主动取消一次）均未产生语义结论，不计入。

### grill 收口（step11，覆盖矩阵五类 + 四项退出检查 + 领域/ADR 结论）

**五类全需求覆盖矩阵（当前调用内的临时验证视图，不持久化原文）**：

| 消息类 | 真实原始消息落点 | 决策轴与真实选择 | 绑定 |
| --- | --- | --- | --- |
| `goal` | US01「把真实规则整理到明确来源并让现有流程读取」（`prd.md:36`）；C01 卡结果（`prd.md:193`） | 真实项目与落点：PaperBuilder（b-001）、按 S2 分文件（b-008）、根 `Design.md` 删除（b-006 q17） | ADR-C01-004/016；AC-C01-1/2 |
| `flow_or_surface` | 六处点名入口（`prd.md:194`）；三种生成入口（`prd.md:196`）；PaperBuilder 的 `specs/design/`、`specs/frontend/` | 目录用 `specs/design/`（b-002 q7）、PaperBuilder 开专用分支后合并（b-003 q11） | ADR-C01-001/014；AC-C01-2 |
| `data_or_state` | 八类来源与 owner（`prd.md:75-86`）；②类值源（`Design.md:49`）；验收对象字段（`prd.md:196`）；S6 六指标（`prd.md:132-149`） | 授权改守卫（b-004 q13）、基线只钉口径不真跑（b-003 q10） | ADR-C01-005/009/010；AC-C01-3 |
| `success_failure_acceptance` | AC-C01-1～4（`prd.md:197`）；判定器（`prd.md:198`） | 新项目入口如实记缺口、不扩范围（b-006 q20） | `## 验收面` 全表 + AC-C01-F4 + AC-C01-WP6 |
| `constraint_non_goal_defer` | 非目标（`prd.md:194`、`prd.md:88`） | 双路径验证留 C09（b-002 q6）；`Experience.md` 同等迁移但保留（b-006 q18） | `## 范围与非目标` + 被排除的路线 |

**结论**：五类均有真实原始消息、落到具体决策轴、高/中影响轴均有用户真实选择并绑定到决定/FR/AC。无未覆盖消息类。

**四项客观退出检查**：

| 检查 | 结果 | 事实依据 |
| --- | --- | --- |
| 1 外部依赖接口是否已核实真实定义（非文档假设） | **pass** | 本轮真实核实：`spec-driven-production@000b04a2…` 与 `material-agent-readiness-eval@b62e87f3…` 均 **HTTP 200 可取全文**，内容与 `prd.md:610/611` 描述一致（见 `research-external-sources.md`）；审查入口 `stage-runtime.mjs review --action=record` 的入参、ref 解析与工作目录约束均已实测；PaperBuilder 的 `Makefile` targets、`frontend/package.json` 依赖版本、`vite.config.ts` 环境变量均为实读文件。**未实测**的是 `make check`/`pnpm` 的真实执行（不改变方向，列为 build-code 验证项）。外部来源的**许可与完整依赖闭包仍未核**（按 S3 归采用者，核不到记 `unavailable`，见 AC-C01-F4）。 |
| 2 涉及字段/路径命名是否已有唯一权威定义 | **pass** | 见 `## 工作包与决定` WP5 末尾的「命名唯一定义」表：`specs/design/`、`specs/frontend/`、`specs/frontend/frontend.md`、`specs/frontend/ui-quality.md`、`specs/design/README.md`、`frontend/src/ui/tokens-anchor.json`（角色集合与元数据，不含精确数值）、`tokens-base.css`、`live-cockpit.css`、`CONTEXT.md`、旧 commit `b66c1348`、PaperBuilder 改造前 HEAD `8569bd5` 均已给唯一来源。 |
| 3 失败路径/异常语义是否明确 | **pass** | 缺源→显露未知不造空文件；断链→改指真实路径或标缺口；冲突→显式处置不静默；守卫改造→未按不变量证明前不得声称已更新；基线→缺失标 `absent` 不标 0；跨仓→未验证不合并；外部来源→核不到记 `unavailable`；测试红→同批处置不放宽；缺项拦截→去掉必要项必须确定性报错并点名。 |
| 4 范围边界「做什么/不做什么」是否写死 | **pass** | `## 范围与非目标`（含 WP1～WP6 + WP-B 的模块边界）+「被排除的路线」+ 模块与决定对照表；WP-B 明确不计入 C01 原卡 AC；过程记录（ADR-C01-011）明确不是交付模块。 |

**GLOSSARY 结论**：`no-change`。理由（有据）：C01 依赖的领域术语已在 `GLOSSARY.md` 中定义且含义一致——`设计源`（`:94`）、`设计依据`（`:97`）、`项目设计规范`（`:100`）、`项目专业规范`（`:103`）、`AC`（`:77`）、`任务功能规格`（`:106`）；C01 把已有规则迁到新落点并修引用，**不引入新的领域概念**，八类是该表 `项目专业规范` 的实例而非新词。`有稿`/`无稿` 的**含义仍未确定**，属 C09 的对象定义（OI-C01-022），本卡不固定、故不收录。文件引用：`/Users/Hugh/Hugh/Project/workflowhub/GLOSSARY.md`。**本卡对 `GLOSSARY.md` 不做改动。**

**ADR 结论**：`created`。三项判据**全部为真**——①**难以反转**：删除 PaperBuilder 根 `Design.md`、修改标注 `DO NOT TOUCH` 的活守卫、以及六处 reader 换源，反悔成本实质；②**无背景会意外**：未来读者会问「为什么规范正文落在 `specs/design/`，而该目录同时装设计原型」「为什么 token 守卫不再读 markdown 而读角色清单」；③**存在真实取舍**：一份 vs 按 S2 分文件（用户 q23 裁定）、镜像保留 vs 删除（用户 q17 裁定）、本卡改守卫 vs 移出（用户 q19 裁定）均有真实备选。文件引用：**PaperBuilder `docs/adr/0035-project-norm-authority-and-value-source-migration.md`**（编号按 PaperBuilder 现有最大号 `0034` 顺延，由 build-code 在 WP5 内落盘）；WorkflowHub 侧以 supersede 既有 `docs/adr/0015-ui-design-source-and-initialization.md` 承载（ADR-C01-003），不另建第二份 WorkflowHub ADR。

**与现有术语/ADR 的冲突及处置**：`resolved`。①与现有术语无冲突（见上）；②与母规划 S2 的目录约定有一处**已裁定的偏离**——PaperBuilder 的 `specs/design/` 同时装设计原型与长期规范，用户 q7 已确认接受，登记在 ADR-C01-004 与命名表；③与母规划「两页 Next.js 载体」的表述冲突已由 U-C01-004 修正为 React 19 + Vite SPA；④与 WorkflowHub `docs/adr/0015`（仍 Accepted 的旧双源 ADR）的冲突由 ADR-C01-003 supersede 处置。

```
grill_summary:
  status: completed
  direction_changing_challenges_resolved: true
  context: { status: no-change, reason: "C01 依赖的术语均已定义且含义一致；不引入新领域概念；有稿/无稿含义未定属 C09，本卡不固定", file_references: ["GLOSSARY.md"] }
  adr: { status: created, reason: "三项判据全部为真：难以反转、无背景会意外、存在真实取舍", file_references: ["PaperBuilder docs/adr/0035-project-norm-authority-and-value-source-migration.md（编号由 build-code 在 WP5 落盘）", "docs/adr/0015-ui-design-source-and-initialization.md（supersede）"] }
  conflicts: { status: resolved, disposition: "术语无冲突；目录双重角色经用户 q7 接受并登记；Next.js 载体表述由 U-C01-004 修正；ADR0015 由 ADR-C01-003 supersede" }
  requirement_coverage: { status: complete, message_classes: [goal, flow_or_surface, data_or_state, success_failure_acceptance, constraint_non_goal_defer], uncovered: [] }
  exit_checks: { external_interfaces: pass, canonical_names: pass, failure_semantics: pass, scope_boundaries: pass }
```

**Grill 不再提问的事实理由**：五类覆盖下，所有会改变目标/方向/范围/方案/风险或长期规则的决策轴均已由**方向 Talk 8 批 23 问 + 逐模块收敛 1 批 14 问（共 9 批 37 问）**的用户真实答复解决；剩余未决项均为 low/medium 且已具名 owner 与完成条件，不改变方向。**唯一例外**是 `specs/design` 与 `specs/Design` 在区分大小写系统上的分裂风险——它已由主会话按最小合理假设**暂定**（未经用户确认、用户可覆写），并如实保留在上文风险表中。

### 质量边界

材料、实施、测试、独立审查与物理交付分别报告；未执行保留具体缺口，用户确认引用外置原件。

本卡尚未确立高风险用户可见事实，故省略 `high_risk_fact` 行；若用户在方向 Talk 中明确声明或三输入推导确立，再按模板单行形状补记。

**已确认事实**：用户最终确认真实取得，原件 `quality/evidence/human-confirmations/2026-10-14-001-make-decision-approved.md`（逐字「确认，按这份决定往下走」）；确认**不授权** Git 提交/推送/合并/归档/清理、删除 PaperBuilder 任何文件、外部包落盘、部署。

完成判据：每项风险或延期列触发、后果、阶段、owner 与来源；质量缺口逐项可见，高风险分类与不可逆授权分别有真实依据。

## 退役登记

本节回答哪些对象已退出以及谁作了决定。

| 日期 | 哪张（R/FR/AC/Phase/材料） | 为什么退役 | 谁决定 | 原来的需求编号 |
| --- | --- | --- | --- | --- |
| 2026-10-13（母规划决定日） | 旧母决定 `D-004`（`Design.md`/`Experience.md` 两文件规范限定与 Experience 分权） | 由 `D-014` 八类专业规范分权替代 | 母规划真实用户确认（U-014/U-015/U-019/U-020） | 由 `D-014` 承接；旧原件保留，不删除历史 |
| 2026-10-14（本卡用户答复 q17） | PaperBuilder 根 `Design.md` | 用户 q17 裁定：条款迁入 `specs/design/` 后删除根文件，避免项目污染与不可清理的过时文件 | 用户（`talk-batches.md#batch-006`） | 由 ADR-C01-016 承接；条款去向见 ADR-C01-006 |
| 2026-10-14（本卡用户答复 q22） | 「`skills/wh-review/SKILL.md` 超出 C01 卡范围、本卡不修改它」这一旧结论 | 用户 q22 裁定把「审查入口澄清 + 契约测试」放进 WP6 在本卡内做，该旧结论不再成立 | 用户（`talk-batches.md#batch-007`） | 由 ADR-C01-017 承接 |

本卡**新增退役对象两项**：PaperBuilder 根 `Design.md`（上表）与「wh-review 超出卡范围」的旧结论（上表）。旧 `Experience.md` **不退役、不删除、不改写历史**，其有效条款按 `D-014` 逐条分配（`decision-log.md:224-225`）。

完成判据：实际退役每行有日期、对象、理由、决定人与原需求编号去向；没有真实授权不声称已批准删除。

## 外置事实索引

基准目录＝任务库根 `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-c01-norm-init-20261014`；下列相对路径相对该基准目录解析，不能按 worktree cwd 解析。

继承原件（在本卡自己的原件产生前，结论沿这些真实来源回读，不复制）：

| 内容 | 真实位置 | 主文留什么 |
| --- | --- | --- |
| 母规划 C01 卡与共享定义 | `/Users/Hugh/Hugh/Project/workflowhub/specs/archive/workflowhub-ui-frontend-decision-refresh-20261013/prd.md` | 需求原义、AC 编号与判据、范围与非目标 |
| 母决定 `D-014` 与 R/U 表 | `/Users/Hugh/Hugh/Project/workflowhub/specs/archive/workflowhub-ui-frontend-decision-refresh-20261013/decision-log.md` | 八类分权路由、迁移入口、旧条款处置原则 |
| 母任务调研 canonical 报告 | `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-ui-frontend-decision-refresh-20261013/quality/evidence/decision-log-refs/research.md` | research_id 与结论 |
| C01 直接调研综合 | 同上目录 `project-norm-authority-synthesis.md` | 八类责任面、来源、更新流程结论 |
| 母任务覆盖矩阵 | 同上目录 `coverage-matrix-5d.md` | 覆盖结论与缺口 |
| 母任务需求变更原件 | 同上目录 `requirement-change-log.md` | 每 U 最小决定与受影响落点 |

本卡自己的原件（**已产生的标「已产生」**；未产生的按此单份保存，不复制已有原件）：

| 原件定位（相对本卡任务库根） | 到达条件 | 主文留什么 | 状态 |
| --- | --- | --- | --- |
| `quality/evidence/decision-log-refs/talk-batches.md` | 回读用户在某批 Talk 说过什么时读 | batch_id 与结论 | 已产生（**batch-001～009**：方向 Talk 8 批 23 问 + 逐模块收敛 1 批 14 问，共 9 批 37 问） |
| `quality/evidence/decision-log-refs/requirement-change-log.md` | 需回读每个 U 的完整变更、真实处置、原文锚点与受影响决定时读 | 每 U 最小决定与受影响落点 | 已产生（**U-C01-001～008** + 母 U 继承） |
| `quality/evidence/decision-log-refs/migration-surface-audit.md` | 核 C01 在 WorkflowHub 仓的迁移面（producer/reader/caller）时读 | 25 条命中、六处入口现状、双 active 风险、缺口 | 已产生 |
| `quality/evidence/decision-log-refs/target-recon.md` | 核 PaperBuilder / 设计源 / 旧版本 / 样本环境 / mini 判据的真实事实时读 | 起点判定、旧规范正文现状、设计源两代差异、基线零证据 | 已产生 |
| `quality/evidence/decision-log-refs/research.md` | 写 ADR 的为什么、核八类条款级映射与 candidates 时读 | research_id、八类适用性、candidates 结论 | **已产生**（312 行） |
| `quality/evidence/decision-log-refs/research-independent-check.md` | 核母规划调研在新目标项目上是否成立时读 | 被推翻结论与最小可行交付候选 | **已产生**（307 行） |
| `quality/evidence/decision-log-refs/research-external-sources.md` | 核两个外部固定来源的可达性与内容性质时读 | 实测状态与内容一致性结论 | 已产生 |
| `quality/evidence/decision-log-refs/research-nav-c01-and-skill-division.md` | 核 `ui-project-init` 的原文职责与「三种入口」的真实含义时读 | 薄入口结论与 16 条原文铁证 | 已产生 |
| `quality/evidence/decision-log-refs/research-make-decision-defect.md` | 核跳步根因（产物无形态定义 + 约束无消费者）时读 | 两条根因与事实更正 | 已产生 |
| `quality/evidence/decision-log-refs/research-talk-plain-language-defect.md` | 核「说黑话」根因与语域混载事实时读 | 只禁 5 个英文词、未禁编号形态、零正例 | 已产生 |
| `quality/evidence/decision-log-refs/review-dispositions.md` | 有 finding 需处置或核对 fixed/rejected 理由时读；Grill 逐项处置也在此 | finding／问题编号与结论 | **已产生**（direction 22 条 + detail 两轮 33 条／35 条，2026-10-14） |
| `quality/reviews/2026-10-14-007-make-decision-direction.json` | 回读 direction 审查原始件、provider 身份与失败类别时读 | 审查轨道、provider 终态与结论 | 已产生（6 provider 全 completed，22 条 findings） |
| `quality/reviews/2026-10-14-020-make-decision-detail.json` | 回读 detail 第一轮有效运行原件时读 | 审查轨道、provider 终态与结论 | 已产生（6 provider 全 completed，33 条 findings） |
| `quality/reviews/2026-10-14-027-make-decision-detail.json` | 回读 detail 第二轮（方案大改后重审）原件时读 | 审查轨道、provider 终态与结论 | 已产生（6 provider 全 completed，35 条 findings） |
| `quality/evidence/decision-log-refs/coverage-matrix-5d.md` | 逐项核所有真实 R 与全部真实 U 的事实／处置／落点或缺口时读 | 验收面的覆盖结论、缺口与条件指针 | 已产生（R-C01-05／R-C01-08 两行已按当前决定订正） |
| `quality/evidence/decision-log-refs/decision-log-history-round1-2.md` | 回读已被取代的过程叙述（旧工作包 ①～⑥、H1～H5、第一轮大纲、旧编号锚定、修订流水）时读 | 历史事实与旧编号对照 | 已产生（**历史原件，非当前权威**） |
| `quality/evidence/decision-log-refs/verbatim-declarations.md` | 核对用户原话或共享定义逐字文本时读 | 编号与原件锚点 | 未产生（当前逐字原话在 `talk-batches.md`） |
| `quality/evidence/decision-log-refs/convergence-check.md` | 需要目标／范围／方案／验收四行真实答复时读 | `## 未决项` 的一行指针 | 未产生 |
| `quality/evidence/decision-log-refs/divergent-candidates.md` | 复核被否候选与可证伪条件时读 | 候选编号与取舍结论 | 未产生（候选结论在 `research.md`） |
| `quality/evidence/decision-log-refs/open-item-outline.md` | 需要未决项与大纲节点对应关系时读 | OI 编号、状态与下一步 | 未产生（OI 全表在 `## 未决项`） |
| `quality/evidence/decision-log-refs/research-candidates.md` | 回读候选摘要、推荐与拒绝理由时读 | 可从报告回读的结论 | 未产生（候选暂在 `research.md`） |
| `quality/evidence/decision-log-refs/final-confirmation.md` | 核对用户确认的展示对象、答复与消息定位时读 | 确认范围与来源 | 未产生（当前确认原件在 `quality/evidence/human-confirmations/`） |
| `quality/evidence/human-confirmations/2026-10-14-001-make-decision-approved.md` | 核对用户最终确认的真实答复与展示范围时读 | 确认范围与来源 | **已产生** |
| `quality/evidence/handoff/2026-10-14-make-decision-handoff.md` | 需要 make-decision → build-plan 的唯一人读交接时读 | 阶段交接、已完成与未完成清单 | **已产生** |
| `quality/evidence/git-authorizations/` | 核对 Git 授权时读 | 实际授权范围与 HEAD | 未产生（本阶段确认不构成 Git 授权） |

核对实际授权时，引用任务库 `quality/evidence/human-confirmations/`、`quality/evidence/git-authorizations/` 已有原件；`human-confirmations` 已产生 1 件，`git-authorizations` 仍未产生。

完成判据：每条指针说明基准目录、唯一原件定位、到达条件与主文留什么；缺失逐项说明，每类事实只留一份原始件。

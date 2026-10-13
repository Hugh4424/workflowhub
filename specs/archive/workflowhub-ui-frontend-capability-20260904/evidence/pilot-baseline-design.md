# 基线任务设计调研：UI设计稿（PaperBuilder Figma Make 重设计产物）

> 调研对象：`/Users/Hugh/Downloads/UI设计稿/`（PaperBuilder 策略工作台的 Figma Make 重设计产物，React 19 + Tailwind 4 + Vite）
> 目的：为 workflowhub 改造前后对照实验设计基线任务
> 采集时间：2026-09-04
>
> **⚠️ 效力说明（2026-09-04 detail 复审后）：本文件 §5 的调研建议写于 R4 决策之前。最终实验协议以方案 v3 §8「对照实验协议（唯一权威版）」为准**：范围=SimulationBoard+SimWorkbench 两页（本文件建议的 Board 副选不采用）；目标仓=Next.js（本文件建议的独立 Vite 不采用——R4-2：同栈会被抄源码污染实验）；源码可见性=B0 现状流程可读源码、P1/P2 实现侧禁读源码（提取器输出为唯一规格来源）。本文件的组件清单/数据层/可渲染性/风险事实仍有效。

---

## 1. 项目完整结构

### 1.1 顶层布局

- 标准 Figma Make 导出骨架：`index.html` / `package.json` / `pnpm-lock.yaml` / `vite.config.ts`（356 行，含大量 Figma Make 专用插件）/ `tsconfig.json` / `.mise.toml`（node 22 + pnpm 10.34.3）/ `AGENTS.md` / `CLAUDE.md`（仅一行）/ `.figma/make/`（Figma Make 站点配置目录）/ `dist/`（已构建产物）/ `node_modules/`（已安装）。
- `package.json` 依赖极少：`react@^19`、`react-dom@^19`；devDeps：`tailwindcss@^4`、`@tailwindcss/vite@^4`、`@vitejs/plugin-react@^6`、`vite@^8`、`typescript@^5.7`、`oxfmt`。**无 UI 组件库、无路由库、无图表库**——全部手写。
- scripts：`dev` = `vite --host 0.0.0.0`（默认端口 8443，strictPort），`build` / `preview` / `format`（oxfmt）。

### 1.2 src/ 全部文件清单（按行数排序，职责见下表）

| 文件 | 行数 | 一句话职责 |
|---|---|---|
| `src/components/SimWorkbench.tsx` | 754 | 模拟盘工作台页（最大组件，内含子标签页） |
| `src/components/SimulationBoard.tsx` | 675 | 模拟盘看板/列表页 |
| `src/components/SimRunDialog.tsx` | 539 | 模拟运行参数配置对话框 |
| `src/components/Workbench.tsx` | 326 | 策略工作台页（Board 进入的主工作区） |
| `src/components/Board.tsx` | 291 | 策略看板首页（卡片网格，应用入口页） |
| `src/components/CandleChart.tsx` | 261 | 手绘 K 线图组件（SVG/canvas） |
| `src/components/PositionReview.tsx` | 261 | 持仓复盘面板 |
| `src/components/StrategyIterationTab.tsx` | 258 | 策略迭代标签页（组装 iteration/* 子组件） |
| `src/components/AttributionDetail.tsx` | 216 | 归因分析详情面板 |
| `src/components/NewStrategy.tsx` | 157 | 新建策略表单页 |
| `src/components/SmartAttributionTab.tsx` | 155 | 智能归因标签页 |
| `src/components/ValidationModal.tsx` | 154 | 验证结果弹窗 |
| `src/components/iteration/ManualIterateDialog.tsx` | 137 | 手动迭代对话框 |
| `src/components/iteration/DiffConfirmDialog.tsx` | 95 | 迭代差异确认对话框 |
| `src/components/iteration/MetricCompare.tsx` | 95 | 指标对比展示组件 |
| `src/components/RuntimeSettingsModal.tsx` | 81 | 运行时设置弹窗 |
| `src/components/VersionHistory.tsx` | 78 | 版本历史列表 |
| `src/components/iteration/Modal.tsx` | 77 | 通用模态框基件 |
| `src/components/iteration/SetOfficialDialog.tsx` | 76 | 设为官方版本对话框 |
| `src/components/iteration/SmartConfigDialog.tsx` | 73 | 智能迭代配置对话框 |
| `src/components/MiniFootprint.tsx` | 67 | 迷你足迹图（分时/盘口微缩图） |
| `src/components/EquityCurve.tsx` | 60 | 资金曲线小组件 |
| `src/components/iteration/LlmConfigDialog.tsx` | 41 | LLM 配置对话框 |
| `src/App.tsx` | 49 | 根组件：4 个视图（board / workbench / new / sim-workbench）的 hash 路由切换 |
| `src/data.ts` | 266 | 数据源（详见 §3） |
| `src/attribution.ts` | 253 | 归因领域模型/类型与计算辅助 |
| `src/iteration.ts` | 229 | 迭代领域模型/类型 |
| `src/index.css` | 43 | Tailwind 4 入口样式 |
| `src/main.tsx` | 10 | 入口挂载 |
| `src/vite-env.d.ts` | 1 | Vite 类型声明 |

合计：**24 个 tsx/css/ts 源文件，5778 行**（不含 vite-env.d.ts）。页面级组件 5 个（Board、Workbench、NewStrategy、SimWorkbench、SimulationBoard），其余为面板/对话框/图表组件。

### 1.3 组件职责核读结果（已逐个核读，修正上表注释）

- `App.tsx`（49）：根组件，hash 路由在 4 视图间切换：`board`（默认）/ `workbench` / `new` / `sim-workbench`；**无 react-router**。
- `Board.tsx`（291）：应用首页"看板"，内含 `strategies` / `simulations` 两个 tab——策略卡片网格（筛选：全部/草稿/候选/验证中/已归档/暂无回测），`simulations` tab 直接内嵌 `SimulationBoard`；聚合打开 RuntimeSettingsModal / ValidationModal / VersionHistory / SimRunDialog。
- `Workbench.tsx`（326）：回测工作台页（从 Board 点策略卡进入），含 K 线区、订单列表（全部/亏损/未成交）、详情三 tab（`描述 & DSL` / `策略迭代` / `智能归因`），内嵌 CandleChart、PositionReview、StrategyIterationTab、SmartAttributionTab、AttributionDetail、LlmConfigDialog。
- `SimulationBoard.tsx`（675）：**T08 模拟记录页**——按 T08 spec 实现 SimStatus 九态（draft/preparing/running/lagging/isolated/stopping/completed/failed/incomplete_close）与 run_kind 四标签；三区域（待启动/当前运行中/已停止）卡片分区；内置 `RunDrawer` 最小运行详情抽屉（7 个 DrawerSection：状态和运行身份/快照摘要/账户结果/关键时间线/行情记录可用性/证据边界/工作台入口）。
- `SimWorkbench.tsx`（754，最大）：**V2 Frame 05 实时模拟工作台**——SimInfo 注册表（6 张模拟卡：live/completed/failed/incomplete/draft/ready × run_kind 四种）、K线+Footprint 主区、详情 tab（模拟订单/等，非订单 tab 显示"详细内容将在后续版本提供"占位）、账户面板（初始资金/当前权益/已实现 PnL 等）。
- `SimRunDialog.tsx`（539）：创建/冻结预检/启动运行的配置对话框（对应 V2 Frame 07），含一整套手写 SVG 小图标。
- `NewStrategy.tsx`（157）：新建策略表单（内嵌 DSL YAML 模板字符串）。
- `StrategyIterationTab.tsx`（258）+ `iteration/` 7 个组件（共 559 行）：**F11+F12a 策略迭代统一工作区**——迭代历史列表、手动/智能迭代对话框、DiffConfirmDialog 差异确认、MetricCompare 六指标对比、SetOfficialDialog 设正式版、LlmConfigDialog、通用 Modal 基件。
- `SmartAttributionTab.tsx`（155）：F9 智能归因分页——任务状态机（idle/queued/running/done/partial/failed）横幅 + 归因列表。
- `AttributionDetail.tsx`（216）：F9 归因详情大弹窗——左解释右关联头寸列表（候选勾选/已确认/证据不完整态）。
- `PositionReview.tsx`（261）：F9 头寸复盘右侧抽屉——评论历史生命周期（已收集/已纳入 F9/已应用/已丢弃）。
- `ValidationModal.tsx`（154）：多窗口验证结果弹窗；`VersionHistory.tsx`（78）：版本历史列表；`RuntimeSettingsModal.tsx`（81）：运行时设置弹窗。
- 图表三件套（全部手绘、无图表库）：`CandleChart.tsx`（261，K线+Footprint 簇）、`EquityCurve.tsx`（60，种子伪随机资金曲线）、`MiniFootprint.tsx`（67，5+2 根微缩足迹图）。

---

## 2. src/imports/ 设计 prompt 与截图清单及对应关系

`src/imports/` 共 4 份 prompt MD（2132 行）+ 10 张 PNG。**grep 全仓确认：所有 PNG 与 MD 均未被任何 tsx/css 引用**——它们是 Figma Make 导出时随车携带的设计输入存档，不是运行时资源（不影响渲染）。

### 2.1 四份 prompt MD

| 文件 | 行数 | 描述范围 | 对应组件 |
|---|---|---|---|
| `PaperBuilder-T08-UI-Design-Prompt.md` | 617 | **T08 模拟管理三界面**：模拟记录页（三区归属规则、搜索/异常筛选/排序、卡片信息层级、卡片操作随状态变化）、模拟详情页、最小运行详情抽屉；含状态设计（隔离态、事实三态、指标空态）、run_kind 五标签、响应式（1440/1280/390）、可访问性、完整文案清单、禁止事项 | `SimulationBoard.tsx`（675 行，含 RunDrawer）是主对应物；SimStatus 九态与 run_kind 枚举在代码中逐字对应（代码注释明写 "per T08 spec"）。**注意**：T08 的"模拟详情页"（`/simulations/{id}` 独立页）在产物中未见独立组件，被 RunDrawer + SimWorkbench 吸收 |
| `PaperBuilder-V2-Figma-Make-_______________.md` | 558 | **V2 模拟列表/详情/实时模拟工作台 8 Frame**：Frame 01-02 模拟列表（三区域、卡片字段全集、操作随状态变化）、Frame 03 模拟详情、Frame 04 最小运行详情抽屉、Frame 05 实时模拟工作台（最终 T06 形态）、Frame 06 T05 行情输入验证工作台、Frame 07 Live/历史输入选择与预检、Frame 08 异常/停止/证据边界；含完整视觉 token（#14141f 背景等 12 色、13px 基础字号、JetBrains Mono 数字） | `SimWorkbench.tsx`（Frame 05）、`SimRunDialog.tsx`（Frame 07）、`SimulationBoard.tsx`（Frame 01-02 与 T08 重叠）、RunDrawer（Frame 04）。Frame 06（T05 行情输入验证）未见对应组件 |
| `PaperBuilder-F9-Figma-Make-UI-Redesign-Prompt.md` | 663 | **F9 回测工作台全量重设计**：整体视觉方向、回测工作台结构、「策略更新」分页（操作区+回测记录与失败交易归因）、「智能归因」分页（任务状态/筛选栏/归因列表/空态）、「归因详情」大弹窗（左解释右头寸列表、三种确认态）、「头寸复盘」右侧抽屉（摘要/交易上下文/成交解释/评论四层）、5 条关键交互流程、状态与标签清单 | `Workbench.tsx`（壳+描述&DSL）、`SmartAttributionTab.tsx`、`AttributionDetail.tsx`、`PositionReview.tsx`、`ValidationModal.tsx`（回测记录展开）、`attribution.ts`（归因领域模型） |
| `PaperBuilder-F11-F12a-Figma-Make-_____.md` | 294 | **F11+F12a 统一"策略迭代"工作区**：左 40% 操作+迭代历史 / 右 60% 当前迭代信息；手动迭代输入弹窗、版本差异确认弹窗（首屏大白话）、保存/回测/六指标比较/稳定性验证、智能迭代入口与 F21 详情、F12a 设为正式版弹窗、统一 LLM 配置、边界态与"明确不要设计"清单 | `StrategyIterationTab.tsx` + `iteration/` 全部 7 个组件 + `iteration.ts`（迭代领域模型） |

四份 prompt 与组件覆盖面是**多对多**：SimulationBoard 同时实现 T08 与 V2 Frame 01-02（两份 prompt 对"模拟列表"的要求高度重叠但措辞不同，属同一需求的两次迭代）。

### 2.2 截图与组件对应关系

- 7 张 `ScreenShot_2026-08-18_*.png`（均 3600×2016，Retina 桌面截图，3 分钟内连拍）：从时间戳与连拍模式推断为**现有 PaperBuilder 产品（V1/旧版）各页面的参考截图**，供 Figma Make 做"参照重设计"（redesign from existing UI），对应 F9 prompt 的"全量重设计"语境。
- `image.png`（2806×1114）、`image-1.png`（3868×2728）：推断为粘贴进 prompt 的参考图（超宽，可能是工作台全屏或多屏拼接）。
- `8c2cf2018fc3319c24b4f0cb8ff0f2b0.png`（1636×1100）：哈希命名，Figma 资源导出命名风格，推断为 Figma 内引用素材。
- ⚠️ 本调研环境所用模型不支持图像输入，截图内容未逐张目验；上述对应关系为基于文件名/尺寸/时间戳的推断，如需精确映射需用图像模型补验。

---

## 3. 数据层：data.ts 结构（mock，非真实数据）

三份数据文件全部是**硬编码 mock**，无网络请求、无本地存储、无后端：

- `src/data.ts`（266 行）：
  - `Strategy` 接口（27 字段：id/name/version/build/status/评分/审计/六指标/起止日期/曲线种子/主操作文案）+ `strategies` 数组 **8 条硬编码策略**（ICT 扫流动性、未完成拍卖回补、足迹连续失衡、SMC 结构突破回踩、VWAP 与 Delta 同向、老布二次入场、足迹 Delta 翻转、陷阱单反转）。
  - `orders` 11 条硬编码成交记录（side/time/qty/pnl/win）。
  - `dslYaml`：一段 DSL YAML 模板字符串。
  - 图表数据由 `seed` 字段驱动的**确定性伪随机生成器**产出（EquityCurve/MiniFootprint），不是真实行情。
- `src/attribution.ts`（253 行）：归因领域常量（RUN_ID/策略名/回测区间硬编码）+ `Source/Outcome/RelState/Evidence` 枚举与 meta 表 + `Position`/`Attribution` 接口 + 硬编码 `attributions` 数组（8+ 条）+ `totals`。
- `src/iteration.ts`（229 行）：迭代领域枚举（IterSource/IterStatus/Verdict）+ `Iteration` 接口 + 硬编码 `confirmedAttributions` / `iterations` 数组。
- `SimWorkbench.tsx` 内部另有独立 `SimInfo` 注册表（6 张模拟卡），与 data.ts 不共享——**模拟域数据有两份口径**（SimulationBoard 内一份、SimWorkbench 内一份），是改版时需小心的不一致源。

数据真实性判定：**风格真实的 mock**（字段命名、状态枚举、文案都贴合 PaperBuilder 真实业务语言，prompt 里明确要求"示例数据必须标注示例/不得表现为真实数据"），适合作为 UI 重实现的演示基座，但不具备任何数据持久性或真实计算。

---

## 4. 可渲染性评估

| 检查项 | 结论 |
|---|---|
| node_modules | ✅ 已安装（9 个顶层包：react、react-dom、tailwindcss、@tailwindcss/vite、@vitejs/plugin-react、vite、typescript、oxfmt、@types/*），`.bin/` 有 `vite`、`tsc`、`oxfmt` 可执行 |
| 依赖闭合 | ✅ pnpm-lock.yaml 与 package.json 匹配；依赖极少（无 UI 库/路由/图表库），供应链面小 |
| 启动配置 | ✅ `pnpm dev` = `vite --host 0.0.0.0`，默认端口 8443（strictPort，PORT 环境变量可改）；`.mise.toml` 锁定 node 22 + pnpm 10.34.3 |
| index.html | ⚠️ 含 Figma 模板占位注释（`<!-- figma:title -->` 等），由 vite.config.ts 的 `figmaSiteConfiguration` 插件在构建时从 `.figma/make/site.json` 注入；**该插件是自包含的**（定义在 vite.config.ts 内），不依赖 Figma 云端，离线可跑 |
| vite.config.ts | ⚠️ 356 行中含 4 个 Figma Make 专用插件（siteConfiguration / errorOverlayReplay / reactRefreshBoundaryFallback / makeKit），全部本地实现；引用 `./.figma/make/site.json`（存在，295 字节） |
| dist/ | ✅ 已有构建产物：`index.html` + `robots.txt` + `assets/index-ChWl2uQh.js`（405 KB）+ `assets/index-DUQiBJoc.css`（59 KB），共 468 KB——**证明项目曾成功 build**，且产物可直接静态伺服 |
| 外部网络依赖 | ⚠️ `index.css` 从 Google Fonts 加载 Inter / JetBrains Mono（离线时字体回退 system font，不阻断渲染） |
| 结论 | **开箱可渲染**：`pnpm dev` 或 `pnpm preview`（伺服 dist/）均可直接起服务；未实际启动（按要求只审配置） |

对基线实验的意义：**设计源本身可以直接 `pnpm preview` 作为"视觉基准参照物"**，视觉比对时无需重建 Figma 文件——这是该设计稿作为对照实验设计源的最大便利。

---

## 5. 基线任务设计建议（改版前后对照实验）

### 5.1 目标范围建议

**推荐：选 `SimulationBoard`（模拟记录页）为主对照页，`Board`（策略看板首页）为校准副页。**

| 候选页 | 行数 | 评估 |
|---|---|---|
| **SimulationBoard（推荐主选）** | 675（+依赖 EquityCurve 60） | ✅ 正是 PB-T08 三页之一（T08 = 模拟记录/模拟工作台/策略列表），**与 T08 历史数据天然同源**；状态矩阵最丰富（SimStatus 九态 × run_kind 四类 × 三区域 × RunDrawer 七节），最适合考"状态覆盖率"；无重图表依赖（仅小曲线），视觉比对噪声小；规模适中（单页可控，1-2 天量级） |
| **Board 策略看板（推荐副选/校准）** | 291（+EquityCurve/VersionHistory/ValidationModal） | ✅ T08 三页之"策略列表"对应物；结构简单（卡片网格+筛选），适合作为**实验流程校准页**（先跑它验证度量工具链，再跑主页）；⚠️ 注意它内嵌 SimulationBoard tab，做主页实验时需隔离该 tab |
| SimWorkbench | 754 | ❌ 不建议首轮：内含 CandleChart（261 行手绘 K线+Footprint），视觉 diff 噪声大；且是 V2 prompt 页而非 T08 原始范围，与 T08 可比性弱。可作 P2 扩展页 |
| Workbench（回测工作台，F9） | 326+下属约 1000 | ❌ 属 F9 prompt 范围，T08 历史数据不含它，无法对齐 |

范围结论：**主对照 = SimulationBoard 单页（对齐 T08 三页之一）**，与 P1 试点阈值（返工 ≤2 轮、提取覆盖率 ≥90%）配套；Board 作为工具链校准的垫场任务。若要做 P2 全链路，可加 SimWorkbench 凑齐 T08 两页。

### 5.2 改版前基线跑法

**基线定义**：用当前 workflowhub（仅有 §调研 4 盘点的 8 个前端技能，无 M1+ 新能力：无设计提取器、无对照矩阵、无规格五要素强制、无视觉 diff oracle、无验收对象卡强绑定）派发同一任务。任务指令、设计源、验收人、验收标准与改版后运行**完全相同**，唯一自变量是 workflowhub 版本。

**两种载体利弊分析：**

| 维度 | A. 独立 Vite 项目（新建空白仓，同栈 React19+TW4+Vite） | B. PaperBuilder worktree（T08 原环境） |
|---|---|---|
| 环境成本 | ✅ 极低：`pnpm create vite` 即起，无后端 | ❌ 高：设计稿 5299 + 实现 5173 + API 5174 三服务，T08 期间挂过两次 |
| 变量隔离 | ✅ 干净：只有"视觉对齐"一个变量，缺陷归因清晰 | ❌ 混入数据链路（DTO/投影 owner）、CSS 历史债务（1056 行 417 历史块）、环境守护等 T08 噪声 |
| 复制泄漏风险 | ❌ **致命**：同栈 + 设计源就是可运行代码，agent 可直接抄 src → 实验失效。**必须加控制**：禁读设计源 src（只允许 `pnpm preview` 渲染页 + 浏览器 computed style + 截图）→ 但这又偏离 T08 真实条件（T08 转折点是 R3 起直接贴设计源码） | ✅ 天然防抄：目标是 PaperBuilder 自身架构/CSS 体系，设计源码只能当规格参考不能直接搬 |
| 与 T08 可比性 | ⚠️ 只能比"视觉对齐缺陷"子集；数据真实、CSS 债务、环境类缺陷（约占 T08 缺陷的 35%：25% 验证/环境 + 10% CSS 债务）无法复现 | ✅ 全口径可比：同一页面、同一代码库、同一数据真实性要求、同一验收人 |
| 可重复性 | ✅ 可随时重置重跑，适合前后两轮对照 | ⚠️ T08 后 PaperBuilder 已含实现，需回滚/另开页面目标，操作复杂 |
| 结论 | **适合作为主实验载体**，但必须显式声明口径收窄（见 5.4） | 适合作为**可比性锚点/校准**：不必重跑全文，可用 T08 历史会话快照直接回填基线值 |

**推荐跑法（B0 基线任务卡）**：
- 载体：独立 Vite 项目（同栈），mock 数据**直接复用设计源的 data.ts/attribution.ts**（这不属于视觉泄漏，且保证数据口径一致）。
- 设计源访问控制（关键）：**第一轮允许读设计源 TSX 源码**（对齐 T08 R3 后的真实条件：规格可引用设计源码）；若要测"无源码、纯渲染提取"的严格场景，留作改版后第二轮变体，不作为基线。
- 绑定登记（吸取教训 6）：任务卡必须写明 仓库路径 / 分支 / dev server 端口 / 设计源路径与 git hash（`UI设计稿` 无 git——用目录内容 hash 或文件清单+_mtime 快照代替）/ 验收 viewport（1440×900、1280×900）。
- 验收：同一用户按"看到成品 → 提反馈 → 记缺陷"的 T08 方式验收，不做任何流程增强（这正是基线的意义）。

### 5.3 度量口径（六项指标的定义、测法、工具）

| 指标 | 定义（口径） | 测量方法 | 工具 | 基线预期（参照 T08） |
|---|---|---|---|---|
| **返工轮次** | 一轮 = builder 宣告完成 → 验收驳回（含≥1 条缺陷）→ 再次交付。最终通过轮不计入返工 | 会话日志中"交付声明 → 用户驳回"对计数；每轮记轮次号+驳回缺陷数 | workflowhub 会话日志 + 缺陷登记表（facts.jsonl 附注） | T08 = 5 轮；改造后阈值 ≤2 |
| **缺陷数（分级）** | CRITICAL = 结构缺失/自创结构/功能错误；MODERATE = 数值/状态/交互错误但结构在；MINOR = 像素级偏差/ hover/文案字距。分级在登记时定，不允许事后降级 | 每轮验收逐条登记：描述+分级+根因类（提取缺失/规格模糊/验证失效/边界未测/环境/消歧） | 缺陷登记表（MD 表或 jsonl）；独立 reviewer 复核分级 | T08 ≈30 条（未分级，需按此口径回填）；改造后底线 ≤10、目标 ≤5 |
| **人工介入小时** | 用户花在验收、提反馈、答疑消歧、环境救火上的墙钟时间；不含等待 agent 的时间 | 会话日志用户消息时间戳聚类（相邻 <30min 算同一段介入），段时长相加 | 会话日志分析脚本（一次性小工具） | T08 = 20+h；改造后阈值 ≤2h |
| **验收确认次数** | 用户给出"通过/确认"的次数。口径（沿用 plan v2 O3）：只计最终确认；设计方向确认另计 | 会话日志中明确确认语计数 | 人工登记 | T08 = 5（每轮都要用户看）；改造后目标 =1 |
| **提取覆盖率** | 设计稿应提取条目中被提取进派发规格的比例。应提取清单 = 本文 §1.3 组件清单（本页组件+状态枚举+token+文案）为 ground truth | 逐条核对派发规格引用了多少条：组件 N/N、状态 N/9、run_kind N/4、文案 N/N | 对照清单表（本文件 §1/§2 即现成 ground truth） | 基线（无提取器）预期 <30%，靠 builder 临场读；改造后阈值 ≥90% |
| **视觉比对差异** | 固定 viewport（1440×900 主、1280×900 辅）下实现页 vs 设计源 `pnpm preview` 页的截图差异 | ① 数值：pixelmatch/odiff 像素差异率（注意：两页图表均为种子确定性伪随机，同种子可复现，可比对）；② 语义：kaelig 式 9 维清单（layout/typography/colors/spacing/shadows/borders/radius/icons/states）逐维 PASS/MINOR/MODERATE/CRITICAL，由**独立上下文 reviewer** 评分 | agent-browser 截图（双 viewport）+ pixelmatch + 独立 reviewer 评 9 维表 | 基线预期：用户 R1 反应"完全是两个产品"；改造后目标：CRITICAL/MODERATE = 0，MINOR 列容忍清单 |

### 5.4 与 T08 历史数据的可比性分析

**T08 原始数据**（来自 research-pbt08-lessons.md）：5 轮返工 / 约 30 缺陷 / 20+ 人工小时 / 验收确认 5 次。范围 = 三页（模拟记录/模拟工作台/策略列表），环境 = PaperBuilder 真实代码库 + 真实数据要求 + CSS 历史债务 + 服务两次中断。

**可比性声明（必须写进实验记录，防止口径漂移）：**

1. **范围归一化**：基线只跑 1-2 页，T08 是三页。对齐口径 = **按页归一**（缺陷数/小时 ÷ 页数）或**只比"模拟记录页"相关缺陷子集**（需从 T08 会话快照回填分拣，约 30 条缺陷中归属模拟记录页的部分）。推荐后者，更诚实。
2. **缺陷分级回填**：T08 的 30 缺陷未按 CRITICAL/MODERATE/MINOR 分级，需用本文 5.3 口径从会话快照（session-759ab146…）回填，否则"≤10 缺陷"阈值与"30"不可比。回填由独立上下文完成（宪法：禁止自审自判）。
3. **载体差异声明**：独立 Vite 载体**复现不了** T08 的三类缺陷源：数据链路（DTO/投影）、CSS 历史债务（约 10%）、环境中断（luna 认定的"最致命"）。基线测得的缺陷数因此是 T08 的**下界估计**，实验报告必须写"基线（洁净环境）vs T08（真实环境）"而非直接等号。这正是选 PaperBuilder worktree 做校准锚点的理由。
4. **设计源访问口径**：T08 R1-R2  builder 未见设计源码（凭类名脑补），R3 起规格贴源码后一次通过。基线若全程允许读源码，等于站在"T08 R3 后条件"起跑，返工轮次会系统性偏低；建议基线任务卡显式记录"设计源码可见性 = true"，并在分析时与 T08 分阶段对照（R1-R2 条件 vs R3+ 条件分开比）。
5. **人工介入口径**：T08 的 20+ 小时含跨会话等待与环境救火；基线只计验收/反馈/消歧动作时长（5.3 口径）。回填 T08 时须按同口径重算，不能直接用"20+"。
6. **n=1 声明**（沿用 plan v2）：单次基线 + 单次改造后运行不称"统计显著"，只称"达到/未达到阈值"。

---

## 6. 风险：该设计稿作为设计源的坑

### 6.1 已证实的坑（本次调研发现，有硬数据）

1. **AI 生成代码未遵守自家 prompt 的视觉 token（样式真实性）**：V2 prompt 明确规定 12 色设计系统（App 背景 `#14141f` 等），实际产物中 **12 色里 8 色零使用**，仅 `#64df95`/`#ff8aa1` 各出现 3 次；产物自造了一套更深的色板（`#06080d` body 背景、`#0a0d14`×20、`#080b11`×10 等，全仓 22 个手写 hex，外加大量 Tailwind 默认色带透明度如 `bg-emerald-500/10`）。**含义：把产物当"忠实实现了 prompt 的设计稿"是错的——它本身就是一次有偏差的 AI 实现。对照实验的"设计基准"必须选边：以产物渲染结果为准（preview 截图）还是以 prompt token 为准。建议：以渲染结果为准（T08 当时就是这么做的），并把 prompt 与产物的偏差本身登记为已知事实。**
2. **模拟域数据双口径**：`SimulationBoard` 与 `SimWorkbench` 各自内置独立的模拟卡数据集，互不同步——改版若两页都碰，会产生"列表页状态 vs 工作台状态不一致"的假缺陷。
3. **占位面（incomplete surface）**：SimWorkbench 的非"模拟订单"详情 tab 渲染"详细内容将在后续版本提供"——设计源自身有空态，验收时不能把这些当实现缺陷。
4. **图表为伪随机生成**：EquityCurve/MiniFootprint/CandleChart 均由 seed 驱动。好处是确定性可 diff；坑是**视觉比对时必须保证同种子**，否则 diff 全是噪声。
5. **T08 prompt 的"模拟详情页"无独立组件**：被 RunDrawer + SimWorkbench 吸收——以 prompt 为验收清单时会误判"缺页"，以产物为准则无碍。再次说明必须"选边"。

### 6.2 Figma Make 产物类项目的已知通病（通用风险）

6. **assets 引用**：本项目实测干净（10 张 PNG 全部零引用、无外部图片 URL、图标全为手写 SVG path）——但 Figma Make 产物常有 `figma:asset` 占位图、外链 Unsplash 图离线即裂的问题，换设计源时需重新核查。
7. **Figma 专用构建噪音**：vite.config.ts 356 行里约 280 行是 4 个 Figma Make 插件（site 配置注入/错误 overlay 回放/refresh 边界/makeKit）；index.html 含 `<!-- figma:* -->` 占位符。**若把该项目复制为基线实现仓的模板，必须剥掉这些**，否则"能跑"的假象掩盖配置不可移植性。好在这些插件自包含、不依赖 Figma 云端。
8. **无路由/无状态持久**：hash 路由 + 内存 state，刷新即丢视图（`#workbench` 硬编码 strategies[0]）。基线任务若涉及多页跳转验收，需把"视图状态丢失"预先登记为设计源固有行为，不算缺陷。
9. **外部字体依赖**：Google Fonts（Inter/JetBrains Mono）离线回退——视觉比对时两字体的 metrics 差异会造成全页像素级 diff 假阳性，**比对环境必须固定字体加载状态**（要么都联网，要么都断网并声明）。
10. **依赖极简是双刃剑**：无组件库意味着所有交互（对话框焦点管理、Esc 关闭、select 样式）都是手写的，质量参差；改版后技能若引入组件库，视觉会偏离设计源——任务卡需声明"允许/禁止引入组件库"。

### 6.3 对实验设计的风险处置汇总

| 风险 | 处置 |
|---|---|
| 设计基准选边（prompt vs 产物渲染） | 以产物 `pnpm preview` 渲染为唯一视觉基准；prompt 仅作语义/文案参考；偏差登记 |
| 同栈复制泄漏 | 基线允许读源码（对齐 T08 R3+ 条件），独立 Vite 仓为**新仓新写**而非 fork；缺陷根因分类中设"直接复制"项以便识别 |
| 视觉 diff 假阳性 | 固定 viewport、固定字体加载、同种子图表、pixelmatch 阈值化 + 9 维人工语义评分兜底 |
| 设计源自带空态/占位 | 验收清单预先登记"非缺陷项"清单（占位 tab、hash 路由丢状态等） |
| 数据双口径 | 基线只跑 SimulationBoard 单页规避；跑 SimWorkbench 时需先对齐两份 mock |

---

## 附：调研方法声明

- 全部事实来自对 `/Users/Hugh/Downloads/UI设计稿` 的直接文件系统核查（行数、依赖、配置、grep 交叉验证），未启动任何服务。
- 截图内容未目验（本模型无图像输入），§2.2 对应关系为推断，已标注。
- 缺陷分级回填、T08 按页分拣属于后续动作，本文只给口径不给数值。

# 调研 4：WorkflowHub 前端相关能力盘点（现状事实）

> 核实方式：全仓检查（skills/、workflows/、runtime/schemas/、specs/archive/），2026-09-04。
> 重要前提：**workflowhub 自身没有 web 前端应用**（仓库根目录无 frontend/apps/web），其"前端能力"= 面向消费者项目（如 PaperBuilder）的前端任务技能族。

## 1. 已有技能族（8 个前端相关，全部存在）

| 技能 | 职责边界（自述） |
|---|---|
| `skills/ui-project-init` | 新项目/历史项目建 UI 基线：Design.md/Experience.md、组件/样式边界、fixture、viewport、Preview 卡。自述"不调用 Figma/Storybook，不执行浏览器测试"、"没有 Preview 不伪造视觉通过" |
| `skills/design-source-readiness` | 只读 Design.md 派生 Screen Read Map + binding_state。自述"不复制 Design.md，不打分（no score），也不设置 gate"、"不是第二设计权威" |
| `skills/frontend-prototype-render` | build-spec 的 UI 依赖：真实组件+fixture+viewport 渲染原型，留 preview_ref/screenshot_ref 哈希证据后请用户确认；降级需用户明确同意。自述"不改产品源码、不创建页面实现、不替代 build-code" |
| `skills/frontend-component-quality` | 输出 Component Quality Map + 静态检查脚本（重复组件、CSS 泄漏、global override、!important）。**明确声明不碰视觉/浏览器/截图/a11y/运行时** |
| `skills/frontend-testing` | build-code 确认 UI 改动后执行状态/交互测试，走 isolated-browser-qa 路由；"截图和清理事实必须保留"。无设计稿比对 |
| `skills/isolated-browser-qa` | 浏览器 QA 路由器（agent-browser/browser-use 二选一）；UI 证据绑定 state/viewport/fixture/design_revision/visual observation/a11y。`visual` 只有 observed/not_observed + screenshot_refs——**无基准比对逻辑** |
| `skills/fullstack-slice-testing` | 跨前端/API/后端/DB 真实链路 slice 测试；截图仅"如适用"，无视觉职责 |
| `skills/verify-change` | lens-only、report-only：只读 review-packet.v1 和 frozen bundle，不产生 artifacts，不接触浏览器/截图 |

**确认：全仓搜"像素/视觉对齐/设计稿 diff/截图比对/computed style"零命中；视觉相关 schema 仅 `runtime/schemas/browser-qa-evidence.v1.json` 一个，且为观察语义。**

## 2. 工作流路径上的视觉环节

- `workflows/build-code`：L88+「Conditional UI implementation handoff」消费 Component Quality Map；UI phase 官方 handler 可调一次 isolated-browser-qa，证据过 browser-qa-evidence.v1 校验。视觉仅为"observation 事实 + 截图引用"。
- `workflows/verify-code`：L52+「Conditional UI consumer alignment」检查真实 consumer/state owner/CSS token owner/browser-state 事实是否产生；缺 design source/fixture/viewport/screenshot 记 `unknown/unavailable`，"not silently treated as visual completion and is not a gate"。
- 结论：整条链路对"视觉"统一是**事实记录语义**（viewport/fixture/visual status/screenshot ref/unknown+reason），从技能层到 schema 层**没有像素级对齐、设计稿 diff、截图比对机制**。

## 3. 存量可用但未组成闭环的资产

- `skills/verify-change`、`stage-reflection`、`message-based quality`：workflowhub 已有"证据新鲜度/独立来源"基建，可承载视觉证据。
- 35 个运行时 schema（33 evidence + 相关），仅 browser-qa-evidence 与视觉相关。
- `specs/archive/` 三个历史 UI 契约任务：`ui-frontend-delivery-contract`、`executable-ui-fullstack-design-contract-20260826`、`ui-e2e-delivery-contract-20260830` —— **workflowhub 已三次尝试解决 UI 交付问题，但都停在"契约/证据"层**，未触及"设计稿→高保真"的视觉 oracle。
- 无 git 提交习惯问题：当前任务 worktree 分支已建但未提交（执行中）。

## 4. 宪法/治理约束（改造方案必须遵守）

- 不新增 stage/gate、不新增第五材料、不新增独立状态机/证据仓；能力下沉 skills/（薄核心窄契约）。
- 质量裁决须由独立来源独立上下文产出，禁止自审自判；事实记录不阻断推进（unknown/unavailable 不算失败但不可伪称通过）。
- 新增生产文件/schema/命令必须同时写明唯一 consumer、owner、替代关系和删除条件；不得双写、不得永久 compatibility bridge。
- 目录变更先更新 `docs/architecture/move-map.json`；skills 应可独立调用、可搬运，不绑死宿主。

## 5. 能力差距速览（与"设计稿 100% 复现"目标对照）

| 环节 | workflowhub 现状 | 缺口 |
|---|---|---|
| 设计稿数字化（token/几何/状态提取） | 无工具；design-source-readiness 只读现有 Design.md | 缺 Design Extractor（确定性提取 + 输入质量分数） |
| 组件对照清单（设计×实现×状态矩阵） | 无 | 缺 parity checklist 生成 |
| 视觉感知/比对（多视口截图、几何 diff、设计参考对照） | 只有观察语义截图 | 缺 visual oracle + diff 报告 schema |
| builder 规格信息密度 | 由主会话心情决定 | 缺强制模板（精确数值/源码行号/验收值/状态覆盖） |
| 边界压力测试（长 token/空数据/hover 死区/390px） | 无 | 缺 edge-case battery |
| CSS 历史债务 | frontend-component-quality 已有重复组件/泄漏检测 | 缺"同选择器多定义"统计（可低成本补） |
| 验收对象绑定（branch/worktree/服务/URL/hash/viewport） | ui-project-init 有 viewport/Preview，但无强绑定 | 缺验收对象卡 |
| 视觉评审规则库 | 无 | 可由 Website-skills P0/P1 规则知识库注入 |
| 渲染反馈回路（改→渲染→截→看→修） | 无（isolated-browser-qa 是一次性 QA，非回路） | 缺 harness + 清单 + stale guard |
| 迭代预算/收敛判定 | 无 | 缺 budget/收益递减事实 |

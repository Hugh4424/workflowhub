# WorkflowHub 前端能力升级完整方案（v3）

> 任务：workflowhub-ui-frontend-capability-20260904
> v3 变更：纳入用户三项新要求——①试点基线对照实验（B0 改版前基线 + P1/P2 改版后 + T08 历史三口径对比，基于 `/Users/Hugh/Downloads/UI设计稿`）；②12 个 P0 技能规则级深读（`evidence/p0-deep/`，共 ~700 条可执行规则）并入移植精化；③工程质量四维度（组件化/统一性/可维护性/性能）升级为一等能力（`evidence/engineering-quality-integration.md` 落点矩阵）。
> v2 已纳入：Talk R1/R2/R3 全部用户决策（18 项）、2026-08-22 历史设计骨架、Design.md/Experience.md 中心制、124 技能全量分类、三轮审查（42 findings）处置。
> 状态：R4 已锁定（决策表 23 项），detail 复审处置完毕即收尾。

---

## 0. 方案总纲（一页看懂）

**问题**：workflowhub 前端技能是"流程执行器+事实记录器"，视觉是观察语义不是验收语义；PB-T08 证明瓶颈在设计稿未数字化、无对照清单、规格密度不足、agent 无眼睛无收敛。

**已有骨架（不重造）**：仓内 2026-08-22 设计已定主链「确认视觉方向 → 冻结设计源 → 静态组件拼版 → 接真实行为 → 三类验收（行为/视觉/意图）」、reference-reproduction / original-design 双模式、UI Contract、四条硬边界、三类验收事实互不替代，且已大部分落地（build-spec UI Contract、plan-design-review、8 个前端技能）。

**本方案 = 骨架之上补执行侧 + 规则弹药**：

| 类别 | 内容 |
|---|---|
| 中心规范 | **Design.md / Experience.md 中心制**——所有 UI 工作围绕两文件读取/遵守/维护/回写（用户架构决策） |
| 新技能 ×3 | `design-extractor` / `ui-parity-checklist` / `ui-visual-fidelity` |
| 新 schema ×3 | `design-extract.v1` / `ui-parity-checklist.v1` / `visual-diff-report.v1`（任务级证据层，辅助两文件，不取代） |
| 新工具 ×2 + 规则包 ×1 | `design-extract.mjs` / `ui-capture.mjs`（tools/cli + agent-browser 驱动）+ stylelint 规则包（不自研 css-hygiene CLI）；边界电池降级为技能内清单 |
| 现有技能接线 | 8 个前端技能 + build-code/verify-code handler 增强 |
| 技能移植 | Website-skills 按类混合：镜像分类 ①7+②24+③24+④69=124 ✓（全表见 research-website-skills.md §3）；另 +1 条 ADR 0016 既定（vercel-react-best-practices 从官方仓固定 commit 完整放入）= **8 条 skills/external/ 登记** |
| 流程机制 | 验收对象卡、builder 规格密度模板、失败三层归档（vibe RLHF）、消歧协议、环境守护、验收矩阵编排（iterate-until-verified） |

**验收语义升级（用户锁定）**：缺视觉证据 → 完成声明必须标 `incomplete` 并附原因；"100% 复现"= 对照矩阵全绿 + MINOR 容忍清单（CRITICAL/MODERATE 必修，MINOR 记录交用户确认）。

---

## 1. 目标流程与标准（未来每个 UI 任务长这样）

### 1.1 统一链路（有稿/无稿一条链）

```
make-decision   判定 ui/non_ui + 谁确认视觉 + 验收对象**意图**记入 decision-log（设计源身份/目标 viewport；branch/服务/URL 此阶段常不存在）
                验收对象卡载体=build-spec 产出的 spec.md UI Contract 结构化区块（不新增材料）；其字段 schema+校验器（page/route/state/viewport/版本/owner/失败状态）为 build-spec 必产出
     ↓
build-spec      冻结设计源时绑定验收对象卡**实测值**（branch/worktree/服务/URL/设计源hash）
                ┌ 有稿(reference-reproduction)：冻结设计源，design-extractor 数字化设计稿
                │         （双源交叉：源码意图 + computed style 真实值；与 Design.md 冲突显式记录）
                └ 无稿(original-design)：读/建 Design.md+Experience.md 基线 → 六段式设计方向 +
                          better-* 规范收敛 → prototype-render 出效果图 → 用户确认 → 冻结自建设计稿
                产出：UI Contract + design-extract.v1 + ui-parity-checklist.v1（初始全红）
     ↓
build-plan      组件/CSS owner/fixture/验收映射；静态拼版→状态→接线 task 卡（同 fixture 名/视口/状态 ID）
     ↓
build-code      CSS 清场（css-hygiene）→ 分组件派发（规格密度五要素强制）→ 静态拼版 → 状态交互 → 真实接线
                只允许 Design.md 登记的 token/组件；新 token 登记回写
                冲突行为（官方审查 O6 修正）：设计稿值不在 Design.md token 表时，builder **记例外记录交设计 owner 裁决**（是否回写新 token），不得静默近似——复用四条硬边界的例外记录机制
                偏差与 overlay（detail 审查修正）：owner 批准的设计稿修正记 **approved-deviation**（owner/理由/修正值/验收处置），parity 判定按批准偏差豁免或重冻结基线；owner 批准的新 token 以**任务本地 overlay** 供当前任务使用，任务结束合并回写 Design.md（冻结 revision provenance 不受污染）
                每大区域走视觉感知回路（ui-capture+清单+stale guard）
     ↓
verify-code     parity 矩阵逐项核对 → 视觉感知+diff（9 维）→ 边界电池 → 收敛判定（预算/收益递减/禁回归）
                → 三类事实（行为/视觉/意图）分开记，独立上下文裁决
                → 全绿+MINOR 确认 → 才可声明完成；缺视觉证据 = incomplete+原因
     ↓
沉淀            新 pattern/规范经设计 owner 确认后**任务内即时回写** Design.md/Experience.md（用户 R3 决策）；失败三层分类归档（规则/工具/人际）
                注意（官方审查 O2 修正）：spec.md 绑定的 design_revision 是**任务期不可变快照**；任务内回写产生新 revision 供下一任务，
                当前任务继续用冻结 revision；回写内容影响当前任务设计源时（罕见）须 owner 重新确认+重新冻结
```

### 1.2 验收标准（锁定）

- **复现完成 = 对照矩阵全绿 + MINOR 容忍清单经用户确认**；逐像素完美不做（不可达且拖入无限打磨）。判定口径（detail 复审修正）：MINOR **不算绿**——"全绿"=无 MINOR/MODERATE/CRITICAL；MINOR 行经用户确认后标 `accepted-minor`，判定 = 全绿 ∨ 仅剩 accepted-minor。
- **缺视觉证据 = 完成声明 incomplete + 原因**（宪法 unknown/unavailable 不伪造通过）。
- 三类事实互不替代：行为（真实浏览器旅程）≠ 视觉（截图/几何 diff）≠ 意图（设计 owner/独立 reviewer 确认）。
- 豁免分级沿用历史设计：非 UI 写 N/A；微小 UI 改动一状态一视口一断言；无视觉环境标 unavailable 不叫通过。

### 1.3 装饰与动效标准（调研结论锁定）

- 数据密集深色后台**装饰特效默认零预算**；动效只服务状态通信（loading/processing/selected/focus），且去动画后状态仍可判读。
- 动效实现遵守 animate/Emil 框架：频率门槛、目的不明不写、只动 transform/opacity、UI<300ms、reduced-motion 门控。
- **复现任务中设计稿没有的动效不许加**（保复现）；有则按稿参数精确实现。
- **设计稿本身有专业缺陷时（用户 R3 决策）：照抄 + 缺陷清单交用户裁决**——忠实复现优先，同时产出专业缺陷清单（对比度/a11y/动效过度），用户决定是否偏离设计稿修正。
- **设计 owner 缺省 = 用户本人**（用户 R3 决策）：owner 未显式指定时所有设计裁决找用户，流程不悬空。

### 1.4 工程质量四维度（用户要求升级为一等能力；落点矩阵详见 `engineering-quality-integration.md`）

**不只视觉复现，还要高质量前端代码。** 落点决策（R4-4 已确认）：**扩展 `frontend-component-quality`**（不新增技能——接线零成本、避免"重复控制面"红线）。**违规语义（R4-5 已确认）：记事实交 owner 裁决**，不阻断（唯一阻断边界仍是"规格缺五要素禁止派发"）。

| 维度 | 规范写在哪 | 执行检查在哪 | 验收怎么查 | 证据记在哪 |
|---|---|---|---|---|
| 组件化 | Design.md 组件 API 章节（组合优于配置/共享原语单一来源/props 契约；vercel-composition-patterns 8 模式 30 子规则+7 反模式信号） | build-plan 组件 Map + build-code UI 交接逐条核对 | verify-code design-alignment + interface-review 爆炸半径（>5 消费者即查） | component_quality_map |
| 统一性 | Design.md token 三层+命名规范（better-colors/typography/layout 提炼） | build-code 只许登记 token/组件（已有）+ stylelint 规则包 | parity 矩阵 token 列 + 组件复用审查（同概念组件禁止每页各造） | design-extract/parity |
| 可维护性 | Experience.md 治理规则（组件 owner/复杂度上限/死代码义务） | stylelint 规则包（同选择器多定义/!important/旧代标记）+ 文件结构规范 | verify-code 结构检查 + 死代码报告 | component_quality_map |
| 性能 | Experience.md 性能预算（bundle/重渲染/加载阈值） | **vercel-react-best-practices 70 规则 8 大类完整落地**（ADR 0016 补债：现仅 21 行手写摘要，须完整放入 skills/external/）+ optimize-web-animations 先测后改 | isolated-browser-qa 性能取证 + 预算核对（超预算记事实交 owner） | browser-qa-evidence.v1 扩展 |

---

## 2. 新技能规格（3 个，可搬运，不绑宿主）

### 2.1 `skills/design-extractor`
- 触发：build-spec 确认 ui scope 且存在设计源（含 original-design 冻结的自建稿）。
- 输入：设计源身份（path/hash/URL/viewport）+ 页面路径 + 能力形态（宿主 agent-browser 首选 / Figma MCP 可选 / 视觉模型降级）+ Design.md/Experience.md 引用。
- 三模式：**①可渲染设计+源码（主模式，用户已确认）**：读源码类名/结构（意图）+ 浏览器 dump 全元素 computed style（真实值）双源交叉，冲突以 computed 为准并记录差异；②Figma MCP；③截图+视觉模型（标 LOW_FIDELITY）。**边界澄清（detail 复审修正）：提取器属于设计源读取侧**——对照实验中"实现侧禁读设计稿源码"的约束不适用于提取器。
- 输出 `design-extract.v1`：token 表（computed 值+归属组件+与 Design.md token 的映射/冲突记录）、组件规格（结构树+每元素样式+交互态+数据态）、页面布局（主网格/栏宽/页宽/间距节奏）、缺失项 `[PENDING]`（缺席是数据）、**输入质量分数**（0-1 确定性扣分）。**LOW_FIDELITY 或质量分 <0.8 → 暂停进入人工确认点**（用户 R3 决策）：呈现提取结果+不确定项，用户确认/补充后才进 build-code——不静默 GIGO。
- 不做：不设计、不改产品源码、不评审实现。
- 冲突分层（独立审查 F8 修正）：**测量层冲突**（设计源码类名意图 vs computed 真实值）自动以 computed 为准并记录差异——computed 是渲染真实；**规范层冲突**（设计稿值 vs Design.md/Experience.md 登记的 token/规范）不得静默选边，显式记录交设计 owner 裁决。

### 2.2 `skills/ui-parity-checklist`
- 触发：design-extract 完成后。
- 输入：`design-extract.v1` + 实现页面 DOM/组件树（agent-browser dump）。**两阶段契约（detail 审查修正）**：build-spec 阶段页面尚未编码——以实现侧全 `missing` 初始化全红矩阵（不需要已编码页面）；build-code 后逐行填充实现侧证据。
- 输出 `ui-parity-checklist.v1`：矩阵「设计组件×实现组件×结构一致×数值一致×状态覆盖×证据 ref」+ 未覆盖声明（未覆盖≠通过）+ 组件复用审查（共享原语必须同一组件，防每页一个 Metric）。
- 消费：builder 派发规格必须含相关行；verify-code 逐项核证据。

### 2.3 `skills/ui-visual-fidelity`
- 触发：UI 改动交付前（build-code 收尾 + verify-code UI 检查）。
- 阶段：capture（`ui-capture.mjs`：多 viewport 截图+console/network/overflow+树 hash stale guard）→ perceive（结构化清单逐项作答：截断/重叠/溢出/交互元素视口内/mobile 坍塌/console=0；答不上明说）→ compare（有参考图：DOM 几何 diff 主+截图 diff 辅 9 维 PASS/MINOR/MODERATE/CRITICAL；无参考图声明"仅感知"）→ edge-battery → report。
- 收敛（可证伪定义，独立审查 F3 修正）：parity 矩阵新增 PASS 项数停滞（连续一轮无新增绿）+ 每区域最大 3 轮迭代上限 + 禁回归；有界验证法（impeccable craft-floor：批量截图一轮→一批修完→至多再一轮→停）。**MINOR/MODERATE/CRITICAL 分级标尺固化在 ui-visual-fidelity 技能内**（用户 R3 决策，全项目统一）；分级标尺、质量分数扣分表、收敛度量口径、**9 个比对维度清单+visual-diff-report.v1 数据结构+P1/P2 测量契约（覆盖率分母/缺陷计数单位/轮次边界/停滞判定）**是 build-spec 必须产出的可执行定义——缺任一项，方案不算可实施。
- 独立裁决：perceive/compare 由独立上下文执行（子代理/不同模型）。
- 输出：`browser-qa-evidence.v1`（扩展）+ `visual-diff-report.v1`。

---

## 3. 新工具 ×2 + 规则包 ×1 + 技能内清单（tools/cli/，无运行时状态，agent-browser 驱动）

| 工具 | 命令形态 | 产出 |
|---|---|---|
| `design-extract.mjs` | `design-extract [--source <设计源码路径>] [--url <渲染URL>] [--mode code\|figma\|image] [--pages]`（code 模式双源都收；figma/image 模式只收对应来源） | token 表+组件规格 MD/JSON+质量分数 |
| `ui-capture.mjs` | `ui-capture <dir> --url <服务基础URL> <route> --viewports 1440x900,390x844 [--design-ref]`（截图前先做服务连通性探针，失败=标 unavailable 不伪造） | `.capture/*.png` + report.json（console/network/overflow/treeHash/designRefHash/**git commit+worktree path——证据 provenance 与验收对象卡绑定**） |
| ~~css-hygiene.mjs~~ → **stylelint 规则包**（simplicity-guard 修正：与 stylelint+PurgeCSS 现成规则高度重叠，不自研 CLI） | `stylelint.config` 规则集：同选择器多定义/!important/死代码/旧代标记 | lint 报告 |
| ~~ui-edge-battery.mjs~~ → **ui-visual-fidelity 技能内边界电池清单**（simplicity-guard 修正：降级为清单+agent-browser 执行，不独立 CLI） | 技能内 checklist | 长 token/长英文/超长中文/空数据/390px/hover 死区 pass-fail 清单 |

---

## 4. 新 schema（3 个，登记唯一 consumer/owner/删除条件）

| schema | 唯一 consumer | owner | 删除条件 |
|---|---|---|---|
| `design-extract.v1` | ui-parity-checklist、build-code UI handler | design-extractor | 设计源不再是任务输入时 |
| `ui-parity-checklist.v1` | build-code UI handler、verify-code（经 verify-change 技能做证据检查） | ui-parity-checklist | 无 UI 任务消费时 |
| `visual-diff-report.v1` | verify-code（经 verify-change 技能做证据检查）、人工验收卡 | ui-visual-fidelity | 视觉验收机制被替代时 |

`browser-qa-evidence.v1` 扩展（不新建）：visual 增加 perceive_answers / ref_screenshot_refs / geometry_diff 可选字段，向后兼容。

**与两文件中心制的关系**：schema 是任务级证据（执法记录仪）；Design.md/Experience.md 是项目级规范（法律）。schema 辅助两文件的执行与验收，永不取代。

---

## 5. 现有技能与流程接线

1. **ui-project-init**：验收对象卡强制登记；Design.md 模板注入 better-colors/typography/layout 原则+tailwind token 三层范式+设计方向六段式+深色工作台基线词汇；Experience.md 模板注入交互/状态规范；original-design 子流程编排（方向收敛→prototype→确认→冻结）。
2. **design-source-readiness**：Screen Read Map 扩展（区域几何/token 引用/状态矩阵/参考截图 identity）。**注意（ADR 0015 约束）：本技能保持不打分**——输入质量分数归 design-extractor 的 design-extract.v1，不进本技能。
3. **frontend-prototype-render**：复用真实生产 route；fixture 与组件 hash 一致；意图→车道→预算的动效决策（单主效果+性能预算）。
4. **frontend-component-quality**：+css-hygiene 同选择器多定义；+vercel-react-best-practices 性能维度（按 ADR 0016 完整放入的官方固定版本，React 栈已确认）；+组件组合模式；+a11y 规则源；+动效检查（能力门控链/状态通信原则/Emil 频率表）；+better-interface severity 标尺。
5. **frontend-testing**：视觉改动强制最小多视口矩阵+交互状态截图 oracle+axe-core；组件快照不算页面验收。
6. **isolated-browser-qa**：多 viewport/hover-focus popover/DOM 几何/参考截图 diff 字段/edge 模式/+stitched-full-page-capture 全页截图修复/+optimize-web-animations 性能取证。
7. **fullstack-slice-testing**：DTO→ViewModel→DOM region seam 事实（防"接口成功但区域为空"）。
8. **verify-change**：UI scope 核视觉证据 fresh/snapshot 绑定/route-viewport-state 覆盖；缺视觉证据→完成声明 incomplete+原因。
9. **build-code UI handler**：parity checklist 驱动派发；builder 规格密度五要素**按提取模式适配**（官方审查 O1 修正）：code 模式=extract 路径+源码行号/figma 模式=节点 id+属性表/image 模式=区域坐标+测量值；三模式共有=精确验收值/目标文件隔离/"逐值复制禁止近似、稿有结构不许缺、稿无结构不许加"/全状态覆盖清单。规格缺要素禁止派发（已证明边界，见 §7.4）。
10. **verify-code UI lens**：顺序固定——设计源/合同→DOM 组件映射→状态窄屏→CSS owner/数据入口→行为/视觉/a11y 事实；验收矩阵编排采用 iterate-until-verified（主观词→Gate|验证方法|二值条件|证据；worker 返 artifact 不返 confidence；制造/评判分离；同法反复失败→换法或报 blocker）。

---

## 6. 技能移植终案（用户已确认 B1 按类混合、B2 暗色皮肤进 references；移植形态遵循 ADR 0016）

**移植形态（ADR 0016 既定模式）**：外部技能一律完整放入 `skills/external/<name>/` + 固定上游 commit + 保留 LICENSE/UPSTREAM + catalog.yaml 登记（path/hash/upstream/consumer/owner/删除条件）。实测 `skills/external/` 尚未落地，本任务实施时建立。**vercel-react-best-practices 按 ADR 0016 既定决策执行**：固定 `vercel-labs/agent-skills@dd089a8c752c966dee8bf0f27cb625ba193ffd9e` 完整放入作 code-lens（不用 Website-skills 镜像、不做 HIGH+ 子集裁剪；React/Next 栈前提用户已确认）。

- **① 复制为独立技能（7 个，skills/external/ 模式登记）**：web-design-guidelines（固化快照）、better-ui、animate（并入 animation-vocabulary 词表）、review-animations、iterate-until-verified、landing-page、vercel-react-view-transitions；外加 ADR 0016 既定的 vercel-react-best-practices（官方仓固定版本）
- **② 概念并入现有技能（24 个技能/23 概念行）**：全表见 `research-website-skills.md` §3-②（impeccable craft-floor→ui-visual-fidelity、better-colors/typography/layout/tailwind-design-system/设计方向六段式→ui-project-init、composition-patterns/a11y/动效原则/better-interface/better-writing→frontend-component-quality、optimize-web-animations/stitched-full-page-capture→isolated-browser-qa 等）
- **③ 辅助参考（24 个，references/ 按需，登记固定 commit）**：含 3 个暗色工作台皮肤（dark-glass-clean-layout、framed-tech-dark-border-gradient、glass-dark-ui，作 original-design 起步模板）、threejs/globe-gl、8 个暗色布局参考、scroll-progress-timeline、gsap、tailwind-4-docs 等
- **④ 不引入（69 个）**：营销皮肤/装饰特效/滚动叙事/平台错配/镜像缺失（全表同 §3-④）。计数口径：镜像分类 ①7+②24+③24+④69=124 ✓；vercel-react-best-practices 不计入镜像分类，按 ADR 0016 单独登记（取件走官方仓固定 commit），与 ①7 合计 8 条 skills/external/ 登记
- **移植纪律**：只提炼不整族 vendor；自带 review-output 一律剪掉（规则源非证据源）；姊妹引用改写；镜像缺失技能登记上游固定 commit；规则弹药进 references/，不进默认加载链；**逐技能 LICENSE 审计**（来源/署名义务/改造再分发边界——Website-skills 汇集多上游，剪掉 review-output 与改写引用属改造再分发）随登记入 catalog；catalog `update_policy` 落地为定期上游漂移检查动作（M4 建立，之后随任务触发或按季度）。

### 6.1 P0 深读精化（12 个 P0 技能规则级深读，`evidence/p0-deep/` 共 ~700 条可执行规则）

| 技能 | 深读后修正/确认 |
|---|---|
| impeccable（~210 条） | **扩展**：除 craft-floor+有界验证→ui-visual-fidelity 外，critique/audit 评分体系→frontend-component-quality，finish-reviewer 四态裁决→verify-change，DESIGN.md 规范→design-extractor |
| better-ui（24 条） | 确认独立复制，且评审输出格式+"10% 慢放评审法"一并复制 |
| interface-review（~22 条） | **扩展**：整体并入 verify-change（爆炸半径 >5 消费者即查/删除侧回归扫描/只读纪律），非仅三态概念 |
| web-design-guidelines（103 条 17 大类） | 确认独立复制；**本体仅 40 行 wrapper，规则在远端 command.md——固化快照必须含远端全文**（不许运行时拉外网） |
| better-accessibility（112 条） | 修正：主体在 6 个 reference 文件，全部并入 component-quality/testing |
| vercel-composition-patterns（8 模式/30 子规则+7 反模式信号） | 确认并入 component-quality；**追加**：生成侧并入 frontend-prototype-render，provider 替换策略并入 frontend-testing |
| vercel-react-best-practices（70 条 8 大类） | **ADR 0016 补债事实**：现状仅 21 行手写摘要且 skills/external/ 不存在——完整放入是还技术债，列入 M4 |
| animate（5 铁律+7 步决策链+13 Never-Ship+14 配方） | 确认独立复制，**须连同 RECIPES.md 一起复制**，4 处交叉引用改写 |
| animation-vocabulary（12 类 **91 词条**） | 修正之前低估 30%（误记 70），并入 animate |
| better-colors（78 条）/better-typography（90 条）/better-layout（46 条） | 确认原则进 Design.md 模板；**分流**：色板生成程序/审计五步法、45 条 CSS↔Tailwind 速查表、CSS 配方→进 build-code/前端技能 references（不进 Design.md 正文）；三份同构 review-output.md 合并为单一 review 输出契约（归 frontend-component-quality）+各领域 Severity 补丁，不复制三份 |

---

## 7. 宪法兼容性声明

1. 不新增 stage/gate/第五材料/独立状态机；视觉报告是事实不是许可证。
2. Design.md/Experience.md 是项目级外部设计源（设计 owner 维护），spec.md 只绑 path+SHA——不是第五材料（宪法 F3，沿用 2026-08-22 设计）。
3. 质量裁决独立上下文：design-extract 分数、parity 核对、perceive/compare、失败三层分类均由独立来源产出，禁止自审自判。
4. 事实不阻断：质量分数低=人工确认点呈交（非机器硬门）。唯一阻断型控制面是「规格缺五要素禁止派发」——**已按宪法 F5/F11 正名登记为已证明边界**（用户 R3 决策）：证明来源=PB-T08 规格密度与返工强反相关；consumer=build-code 派发；owner=build-code UI handler；退出条件=规格模板被更可靠机制替代时先迁移再移除。
5. 技能可搬运：新技能只写流程与格式契约，渲染/截图/视觉模型经宿主路由。
6. 新增文件先登记：schema/工具/技能均有唯一 consumer/owner/删除条件；目录变更同步 move-map.json。
7. conversational gate 形态落地人际判断（低置信决策给风险权衡选项）；品味裁决永远在人。
8. 宪法 S4（独立审查 F5 修正）：三个自研新技能配套执行指标（调用次数/提取覆盖率/质量分分布/收敛轮次），纳入统一执行记录底座；S3：外部技能登记含上游更新检查策略（见 §6 移植纪律）。

---

## 8. 实施里程碑（A1 全链路 + R3 薄闭环先行 + R4 基线对照实验；详见 `pilot-baseline-design.md`）

**对照实验协议（唯一权威版，R4 锁定 + detail 复审调和；附录 pilot-baseline-design.md §5 的早期建议与本节冲突处以本节为准）**：

- **范围**：SimulationBoard + SimWorkbench 两页（T08 三页之二）
- **设计源**：`/Users/Hugh/Downloads/UI设计稿`（可渲染 Figma Make 产物；视觉基准以产物渲染为准，不以 prompt 文本为准——已实证产物未遵守自家 12 色系统）
- **三方跑法**：
  - **B0（改版前基线）**：现状流程——agent 可渲染设计稿、**可读设计稿源码**（即 PB-T08 实际做法），无任何新技能。测的是"现状真实水平"。
  - **P1/P2（改版后）**：新链路——**实现侧（builder）禁止读设计稿源码，提取器输出是唯一设计规格来源**；提取器属于设计源读取侧，不受禁读约束（detail 复审边界澄清）。测的是"提取器中介+规格驱动"的增量。
  - **T08 历史数据**：第三参照（5 轮/30 缺陷/20+ 人工小时）
- **目标仓**：Next.js（非 Vite——设计稿本身是 Vite+React 源码，同栈会被直接抄源码污染实验）
- **模式覆盖**：B0/P1/P2 全是 reference-reproduction（有稿）；**original-design 模式另设 P3 试点**（无稿真实任务，验证自建设计稿子流程；通过条件=设计方向确认 1 次 + 复现协议正常跑通 + 验收确认 1 次）
- **六指标统一测量**：返工轮次/缺陷数（分级）/人工介入小时/验收确认次数/提取覆盖率/视觉比对差异

| 里程碑 | 内容 | 预估 |
|---|---|---|
| **B0** | **改版前基线**：现状流程（可渲染设计稿+可读源码，复现 PB-T08 做法）实现 SimulationBoard+SimWorkbench 两页 demo（Next.js 目标仓），全程记录六指标。**必须在改造开工前跑** | ~0.5-1 天（真实任务执行） |
| M0 | 验收对象卡（载体=spec.md UI Contract 区块）+ **Design.md/Experience.md 最小基线字段契约前移**（detail 审查：M1/P1 已依赖两文件，不能等 M4）+ stylelint 规则包 + 失败三层归档机制 | ~1-2 天 |
| M1 | **薄闭环**：design-extractor（技能+工具+schema）+ ui-parity-checklist（两阶段契约）+ design-source-readiness 接线 + **最小 parity→build-code 派发接线**（detail 审查倒挂修正）+ **iterate-until-verified 移植登记前移**（M3 编排依赖它） | ~4-6 天 |
| **P1** | **试点 1（真实 UI 任务跑薄闭环：提取+对照+人工视觉确认）**。**可证伪通过标准**：① 提取覆盖率 ≥90%（设计稿组件被提取比例）② parity 矩阵实际驱动派发（派发规格引用矩阵行——派发接线已在 M1）③ 试点任务返工 ≤2 轮。**试点模式须在验收对象卡标注**（有稿/无稿）；P1+P2 合计须覆盖 reference-reproduction 与 original-design 两种模式，真实任务只有一种时记录缺口不谎称覆盖。任一未达=失败 → **回 build-spec 重新评估 M2-M4 设计**（官方审查 O4/O15 修正：不是"只返工 M1"） | 随真实任务 |
| M2 | ui-visual-fidelity（capture+perceive+compare 双轨 diff+edge battery+收敛）+ browser-qa-evidence 扩展 + visual-diff-report | ~4-6 天（重估） |
| M3 | builder 规格密度模板 + 派发边界落地 + build-code/verify-code 接线 + 验收矩阵编排（基于 M1 已移植的 iterate-until-verified） | ~4-5 天（重估） |
| M4 | 技能移植（逐技能 LICENSE 审计+skills/external/ 登记，含 **ADR 0016 补债**：vercel-react-best-practices 70 规则完整放入）+ **frontend-component-quality 四维度扩展开发**（SKILL.md 修改+check 脚本扩项+references 引入，detail 复审修正：此前无里程碑承接）+ Design.md/Experience.md 完整模板升级 + CONTEXT.md 术语登记 + ADR 0024 登记落盘 | ~5-6 天 |
| **P2** | **试点 2（全链路，同设计稿同范围复跑）**，对照 B0 基线与 T08 历史，按可证伪阈值判定：返工轮次 ≤2、缺陷数 ≤10（基线 30 的 1/3）、**用户人工介入 ≤2 小时**（基线 20+）、**验收确认次数 =1**（口径=最终 MINOR 容忍清单确认；设计方向确认另计）、**视觉判定=CRITICAL/MODERATE=0 且 MINOR 全部列容忍清单经确认**（绝对口径；"较 B0 收敛程度"只作数据呈现不作判定条件）。任一未达=未通过，缺口回流 build-spec（n=1 试点不称"统计显著"，只称达到/未达到阈值；与 B0 同设计稿对照提供直接可比性） | 随真实任务 |
| **P3** | **试点 3（original-design 模式）**：无稿真实任务，验证自建设计稿子流程。通过条件：设计方向确认 =1 次 + 复现协议正常跑通（提取/对照/视觉环节全走到）+ 验收确认 =1 次 | 随真实任务 |

**预期（口径统一，官方审查 O12 修正）**：PB-T08 类任务 5 轮→1-2 轮、人工介入 20+ 小时→≤2 小时；缺陷**底线阈值 ≤10**（基线 30 的 1/3），**预期目标 ≤5**（基线 1/6，依据教训分布：60% 可编码前消灭、25% 可交付前消灭）。

---

## 9. 决策记录（全部已确认）

| # | 决策点 | 结论 | 轮次 |
|---|---|---|---|
| 1 | 前端技术栈 | React/Next.js 为主；react-best-practices 按 ADR 0016 官方仓固定 commit 完整放入作 code-lens | 前置 |
| 2 | 设计源形态 | 可渲染设计源为主（双源交叉主模式） | 前置 |
| 3 | 视觉模型 | 有视觉能力（perceive 多模态+diff 双轨） | 前置 |
| 4 | 改造深度 | 全链路一次到位（实施节奏已由 #13 修订为 M1+P1 先行试点再铺开） | R1 |
| 5 | 技能形态 | 3 独立新技能+扩展 8 个+按类混合移植 | R1+R2 |
| 6 | 验收标准 | 对照矩阵全绿+MINOR 容忍清单 | R1 |
| 7 | 完成声明边界 | 缺视觉证据=incomplete+原因 | R1 |
| 8 | 无稿任务 | build-spec 产出自建设计稿，统一链路 | R2 |
| 9 | schema | 3 个都要+**Design.md/Experience.md 中心制** | R2 |
| 10 | 提取器形态 | tools/cli+agent-browser | R2 |
| 11 | 试点 | 真实 UI 任务试点，拆两段：P1 薄闭环试点（M1 后）+ P2 全链路试点（M4 后），均可证伪 | R2+R3 |
| 12 | 派发约束正名 | 按 F5/F11 登记为已证明边界 | R3 |
| 13 | 实施节奏 | M1+P1 薄闭环先行试点，再铺开 M2-M4 | R3 |
| 14 | 低质量输入 | LOW_FIDELITY/质量分<0.8 → 人工确认点 | R3 |
| 15 | 设计 owner 缺省 | 用户本人 | R3 |
| 16 | 两文件回写 | 任务内即时回写（owner 确认后） | R3 |
| 17 | 缺陷稿处理 | 照抄+缺陷清单交用户裁决 | R3 |
| 18 | 分级标准归属 | 固化在 ui-visual-fidelity 技能 | R3 |
| 19 | 基线范围 | SimulationBoard + SimWorkbench 两页 | R4 |
| 20 | 基线载体 | Next.js 目标仓（非 Vite 防抄源码）；实现侧禁止读设计稿源码 | R4 |
| 21 | B0 基线 | 真跑（改版前用当前 workflowhub 实现一遍） | R4 |
| 22 | 工程质量落点 | 扩展 frontend-component-quality（不新增技能） | R4 |
| 23 | 违规语义 | 性能/组件规范违反=记事实交 owner 裁决，不阻断 | R4 |

**目标重定义明示（独立审查 F7 要求）**：用户原话"100% 复现"在本方案中落地为**"对照矩阵全绿 + MINOR 容忍清单经用户确认"**，逐像素完美明确不做（不可达且拖入无限打磨）。这不是静默降级，是经用户 C1 决策确认的可证伪验收语义。

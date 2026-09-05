# WorkflowHub 前端能力升级完整方案（v1）

> 任务：workflowhub-ui-frontend-capability-20260904
> 目标：让 workflowhub 具备专业 UI 设计与前端开发能力；有 UI 设计稿时能 100% 复现其样式与细节；未来前端任务不再出现"20+ 小时人工、5 轮返工、30 个缺陷"。
> 依据：`evidence/research-pbt08-lessons.md`（历史教训）、`evidence/research-vibecoding-best-practices.md`（业界最佳实践：monday.com/kaelig/yureki/Vercel 等）、`evidence/research-website-skills.md`（P0/P1 技能研究）、`evidence/workflowhub-capability-inventory.md` + `evidence/workflowhub-gap-analysis.md`（现状与差距）。
> 状态：草案，待用户审阅确认后进入 build-spec/build-plan。

---

## 0. 方案总纲（一页看懂）

**问题**：workflowhub 的前端技能都是"流程执行器 + 事实记录器"，唯独缺少从"设计稿"到"高保真页面"的执行闭环与视觉 oracle。PB-T08 证明：瓶颈不是模型写 CSS 的能力，而是 (a) 设计稿从未被数字化，(b) 没有组件对照清单，(c) builder 拿到的规格信息密度不足，(d) agent 没有"眼睛"、没有收敛机制。

**方案**：在不新增 stage/gate 的宪法约束下，按"**提取 → 对照 → 实现 → 感知验证 → 收敛**"五环，用 **3 个新技能 + 3 个新 schema + 3 个新工具 + 8 个现有技能接线 + 一批规则知识库注入** 补齐。视觉从"观察语义"升级为"验收语义"——每个环节产出可核对的事实，机器先于用户发现缺陷。

**落点一览**：

| 类别 | 名称 | 解决缺口 |
|---|---|---|
| 新技能 | `design-extractor`（设计稿数字化提取器） | 缺口 1：无提取、无质量分数 |
| 新技能 | `ui-parity-checklist`（组件对照清单） | 缺口 2：用户当人肉 diff |
| 新技能 | `ui-visual-fidelity`（感知回路+diff oracle+边界电池+预算） | 缺口 4/5：无眼睛、无收敛 |
| 新 schema | `design-extract.v1`、`ui-parity-checklist.v1`、`visual-diff-report.v1` | 证据从观察升级为可比对 |
| 新工具 | `ui-capture`（harness）、`design-extractor` 脚本、`css-hygiene` 检查 | 缺口 1/4/8（复用 agent-browser） |
| 现有技能接线 | ui-project-init / design-source-readiness / frontend-prototype-render / frontend-component-quality / frontend-testing / isolated-browser-qa / fullstack-slice-testing / verify-change | 8 处扩展（见 §5） |
| 规则知识库 | better-ui、web-design-guidelines、better-colors/typography/layout、vercel-react-best-practices（栈决策）、animate+review-animations、impeccable(craft-floor 节选) | 缺口 7：无"什么是对的"规则 |
| 流程机制 | 验收对象卡、builder 规格密度模板、失败三层归档（vibe RLHF）、消歧协议、环境守护 | 缺口 3/6/9 |

---

## 1. 核心设计：100% 复现协议（每个 UI 对齐任务的标准动作）

任何"已有 UI 设计稿要复现"的任务，build-code 的 UI phase 强制走以下协议（作为技能/检查项，不新增 stage）：

### 第 0 步 验收对象卡（任务开始时，make-decision/build-spec 交接必带）
```
project / branch / worktree / 服务{cwd,pid,port,url} / api / 设计源{path,revision,sha256}
viewports: 1440×900, 1280×720, 390×844 / 设计状态清单与 fixture 分工(固定样本 vs 真实运行)
```
- 依据 luna 教训"没有确认 5173 服务的是哪个 branch 就不能说页面已修复"与 yureki stale guard。
- 服务实例每次验证前 health check（登记的端口+启动命令+env），挂了按登记自动拉起，不许"看起来在跑"。

### 第 1 步 设计稿数字化（design-extractor）
按设计源形态三选一（可在规格中登记能力形态）：
1. **可渲染设计 + 源码**（最优，PB-T08 形态）：双源交叉——读设计源码类名/结构（意图）**同时**在浏览器 dump 每个元素的 computed style（真实渲染值：色值/字号/字重/行高/间距/圆角/边框/背景/阴影）。PB-T08 的 R1 惨案正是只读类名不读渲染值。
2. **Figma**：Figma MCP/API + 变量绑定解析 + 实例子节点展开（kaelig：REST API 不给实例 children，需 Figma Console MCP）。
3. **静态截图 + 标注**（降级）：视觉模型读出结构+色值，输出标 `[LOW_FIDELITY]` 并记录"可复现性受限"。

输出 `design-extract.v1`：
- token 表（所有颜色/字体/字号/行高/间距/圆角/边框/阴影/透明度的 computed 值 + 归属组件）
- 组件规格（每个组件的结构树 + 每元素样式 + 交互态 hover/focus/active/disabled + 数据态 有数据/无数据/loading/error）
- 页面级布局（主网格、栏宽、页宽、间距节奏）
- 缺失项目标 `[PENDING]`（**缺席是数据**，不许猜）
- **输入质量分数**（0-1，确定性扣分：无法渲染 −0.3、每 [PENDING] −0.02、每缺状态 −0.05…）；<0.8 时规格头部注明风险并呈交用户（三选一：修输入/人工给映射/明确接受低质量）——与宪法"不伪造通过"同精神，不静默 GIGO。

### 第 2 步 组件对照清单（ui-parity-checklist）
自动生成矩阵并落盘 `ui-parity-checklist.v1`：

| 设计组件 | 实现组件 | 结构一致? | 数值一致? | 状态覆盖(hover/focus/empty/error…) | 证据 ref |
|---|---|---|---|---|---|

- 改造完成的定义 = 全绿。**不绿不进入用户验收**。
- 生成依据：design-extract 的组件规格 vs 实现 DOM/组件树（agent-browser 或静态分析）。
- 同时做组件复用审查：设计稿/实现中的共享原语（本页面的 metric 组件、曲线组件、弹层、badge…）必须共用同一组件——防 PB-T08"每页一个 Metric"问题。

### 第 3 步 CSS 清场（改动任何 CSS 前）
- 跑 `css-hygiene`：同选择器多定义（>1 代即列出）、!important、global override、死代码。
- 同选择器 ≥2 代定义时，先机械清除再写——根除"改了没效果→再写一条→债上加债"。

### 第 4 步 分组件派发（builder 规格强制信息密度模板）
派发前校验模板五要素齐全，缺一禁止派发：
1. `design-extract.v1` 路径 + 设计源源码路径+**行号**（要求 builder 先读再改，禁止凭印象）；
2. 精确验收值（"该元素必须 w-280 bg #0a0d14 border white/8%"——不是"更紧凑些"）；
3. 目标文件 + 隔离边界（并行 builder 不互踩）；
4. **逐值复制，禁止近似；设计稿有的结构不许缺，没有的结构不许加**；
5. 该组件的全状态覆盖清单（每个状态都要验）。
- 复用纪律：禁止自创组件/自创 token；扩展既有 token 不建平行体系（kaelig Tier-1 教训：#333 fallback、假前缀全灭）。

### 第 5 步 视觉感知回路（ui-visual-fidelity，build 期间每大区域一次）
- `ui-capture` harness：多 viewport 截图 + `report.json`（console errors / failed requests / `scrollWidth>clientWidth`）+ **当前树 hash**（stale 防护：completion 时 hash 不匹配即拒绝，机械而非荣誉）。
- 结构化检查清单（不是"review the screenshots"这种无法失败的指令）：
  - 文本有无截断/重叠/出界？overflow 每 viewport 为 false 吗（是则点名元素）？
  - 本次改动涉及的交互元素是否在视口内可见？mobile 是否单列坍塌？
  - console errors 是否为零？每条都按 blocker 处理；**答不上就明说答不上，不许半看图就自信描述**。
- 有视觉模型：截图发给模型按 checklist 逐项作答（perception）；
- 有设计参考截图：同时做 **comparison**——DOM 几何 diff（同元素 computed style 逐属性对比脚本）为主、截图 diff 为辅（visual diff，9 维：layout/typography/colors/spacing/shadows/borders/radius/icons/states）。

### 第 6 步 边界电池（所有含文本/浮层的 UI 交付前）
- 64 字符无空格 token（哈希）→ 容器溢出检测；长英文错误串 → 折行/截断；超长中文；无数据/null/空数组 → 体面"−"；所有 hover 浮层 → 触发器与浮层间像素死区检查（top 偏移>0 必须 hover 桥）；390px 最小视口 → 横向溢出。

### 第 7 步 收敛与独立裁决
- 每 worker 明确退出标准 + 最大轮数 + 收益递减阈值（收益 <2% 即停并记录可接受偏差）+"禁止回归"（修复不得让先前 PASS 变 MODERATE）。
- 视觉 diff/对照清单由**独立上下文**产出（子代理或不同模型），禁止自审自判（宪法）。
- 人只在三类问题上被叫到（kaelig 三层框架）：低置信/冲突决策（conversational gate：给风险权衡选项，非技术倾倒）、输入质量不足、品味裁决（"是否好看"留给人——perception 回路解决"是否坏了"，不解决品味，诚实边界）。

### 第 8 步 沉淀（vibe RLHF 三层）
每次返工/失败按三层分类归档：
- **规则层**（agent 缺规则，写进 skill 永不再犯）→ 立即晋升进对应技能的规则文件；
- **工具层**（基础设施缺）→ 记入 backlog（如"Figma REST 不给实例 children"）；
- **人际层**（必须人判断）→ 记入"下次哪些决策该早点问"。
- 分类产出自独立上下文（review 子代理/复盘），禁止主会话自评自判。规则随技能版本管理，**规则不 decay，会复利**。

---

## 2. 新技能规格（3 个，均为可搬运技能，不绑宿主）

### 2.1 `skills/design-extractor`
- 触发：build-spec 确认 UI 相关、且存在设计源（UI design docs / returned design / Figma / live design URL）。
- 输入：设计源身份（path/hash/URL/viewport）+ 页面路径 + 能力形态声明（可从宿主的 agent-browser / Figma CLI / 视觉模型中选择并登记）。
- 输出：`design-extract.v1`（见 §1 第 1 步），落盘 `quality/evidence/` 或任务证据目录，登记 hash。
- 不做什么：不设计、不改产品源码、不评审实现。
- 依赖声明：agent-browser（首选）；Figma MCP（可选）；视觉模型（降级）。主技能本体是流程+格式契约，渲染由宿主路由。

### 2.2 `skills/ui-parity-checklist`
- 触发：design-extract 完成后、build-code UI phase 开始时。
- 输入：`design-extract.v1` + 实现页面 DOM/组件树（agent-browser dump）。
- 输出：`ui-parity-checklist.v1`（矩阵 + 每项状态 + 证据 ref + 未覆盖声明）；"未覆盖不默认为通过"。
- 消费方式：builder 派发前把相关行复制进规格；verify-code 逐项核证据。

### 2.3 `skills/ui-visual-fidelity`
- 触发：任何 UI 改动交付前（build-code UI phase 收尾 + verify-code UI 检查）。
- 内部阶段：capture（harness+多视口+hash）→ perceive（结构化清单逐项作答）→ compare（参考图：几何 diff+截图 diff，无参考图则声明"无参考，仅感知"）→ edge-battery → report（`visual-diff-report.v1` + budget 记录）。
- 收敛规则：写入技能文本（最大轮数、收益递减、禁回归、把"可接受偏差 vs 需人判"写进报告）。
- 输出：`browser-visual-evidence.v1`（扩展）+ `visual-diff-report.v1`。
- 独立裁决要求：perceive/compare 步骤由独立上下文执行。

---

## 3. 新工具规格（3 个，tools/cli/ 或 scripts/，均无运行时状态）

1. **`tools/cli/ui-capture.mjs`**（借鉴 yureki 60 行 harness，半天内）：
   `ui-capture <project-dir> <route> --viewports 1440x900,390x844 [--design-ref <url|file>]`
   → `.capture/*.png` + `report.json`（consoleErrors/failedRequests/overflow/treeHash/designRefHash）
2. **`tools/cli/design-extract.mjs`**（配合 agent-browser；1 天）：
   `design-extract <design-url> [--pages ...] [--mode code|figma|image]`
   → token 表 + 组件规格 MD/JSON（computed style 全量）+ 来源标记（class vs computed 冲突时以 computed 为准并记录差异）
3. **`tools/cli/css-hygiene.mjs`**（半天，frontend-component-quality 现有 check 脚本扩展）：同选择器多定义统计、!important、无引用类、旧代选择器标记。

另：**`tools/cli/ui-edge-battery.mjs`**（半天）可并入 ui-capture 的 `--edge` 模式：注入长 token/长英文/超长中文/空数据/390px/hover 死区探针，输出 pass/fail 清单。

---

## 4. 新证据 schema（3 个，均需登记唯一 consumer/owner/删除条件）

| schema | 唯一 consumer | owner | 删除条件 |
|---|---|---|---|
| `design-extract.v1` | design-extractor（生成）、ui-parity-checklist、build-code UI handler | design-source-readiness（事实层） | 设计源不再是任务输入时 |
| `ui-parity-checklist.v1` | build-code UI handler（核对）、verify-change（消费证据） | frontend-component-quality | 无 UI 任务消费时 |
| `visual-diff-report.v1` | ui-visual-fidelity（生成）、verify-change、人工验收卡 | isolated-browser-qa | 视觉验收被替代机制取代时 |

- `browser-qa-evidence.v1` **扩展**（不新建）：`visual` 增加 `perceive_answers`、`ref_screenshot_refs`、`geometry_diff`；保持向后兼容（新增可选字段）。
- 所有新 schema 遵循现有 evidence 规则：hash 绑定、freshness、unknown/unavailable 不伪造通过、不新增 gate（报告是事实，推进许可仍是现有机制）。

---

## 5. 现有技能接线（8 处，最小侵入）

1. **ui-project-init**：初始化时强制写验收对象卡（branch/worktree/服务实例/URL/设计源 hash/viewport）；Design.md 模板嵌入 better-colors/better-typography/better-layout 的原则骨架（token 分层、排版数值、间距节奏），标注"规则源非证据源"。
2. **design-source-readiness**：Screen Read Map 扩展（区域几何、token 引用、状态矩阵、参考截图 identity）；新增输入质量分数事实（低分 → 呈现但不阻塞，附风险）。
3. **frontend-prototype-render**：允许优先复用真实生产 route；fixture 与组件 hash 一致性校验；输出增加"与 design-extract 的偏差清单"（可选）。
4. **frontend-component-quality**：加同选择器多定义统计（css-hygiene）；性能维度可注入 vercel-react-best-practices 检查项（栈决策后）；motion 规则注入 review-animations 十条标准；组件 API 规则注入 vercel-composition-patterns。
5. **frontend-testing**：视觉改动强制"最小多视口矩阵 + 交互状态截图 oracle + axe-core 通过"；组件快照不算页面验收。
6. **isolated-browser-qa**：增加多 viewport 参数、hover/focus popover 检查、DOM 几何采集、参考截图与 diff 证据字段、edge 模式；保持 session 隔离与 cleanup。
7. **fullstack-slice-testing**：把 DTO→ViewModel→DOM region 的 seam 纳入事实记录，防止"接口返回成功但页面区域为空"。
8. **verify-change**：UI scope 检查视觉证据 fresh、绑定当前 snapshot、覆盖声明的 route/viewport/state；缺失设计对比证据时记 unknown 而非通过（已有语义，扩检查项）。

---

## 6. 规则知识库引入（Website-skills/官方，按优先级+成本）

> 通用原则：**只提炼原则+数值，不做整族 vendor**；一律落 `references/` 注入现有技能（规则源非证据源；评审证据仍走现有独立审查）；MIT 来源登记 `skills/catalog.yaml`（path/hash/upstream）；跨技能引用需改写；自带 review-output/a11y report 的必须剪掉（与 workflowhub 评审阶段重复）。

| 优先级 | 引入 | 形态 | 依据 | 成本 |
|---|---|---|---|---|
| P0-A | better-ui 16 条数值处方 | references → frontend-component-quality / isolated-browser-qa | 同心圆角/阴影分工/光学对齐=复现后"感觉不像"高频根因；纯 MD 零依赖 | 低 |
| P0-B | web-design-guidelines (~100 规则) | **固化快照**进 references → frontend-component-quality（不运行时拉外网） | 工程规则兜底 | 低 |
| P0-C | better-colors / better-typography / better-layout | 提炼原则+全部数值 → Design.md 模板 + token 纪律 | 深色数据密集刚需（暗色 ramp/语义分层/tabular-nums/iOS 16px 缩放）；"未要求不改色"与复现立场一致 | 中（裁剪子文档） |
| P1 | vercel-react-best-practices（70 规则） | 只迁 HIGH+ 子集；**前置决策：workflowhub 客户项目是否 React 栈** | 数据密集渲染/重渲染 15 条直接命中 | 低（本机已有副本） |
| P1 | animate + review-animations | animate→references；review-animations→独立审查人（契合宪法独立裁决） | motion 空白域；"稿没动效不加"是复现防线 | 低-中（裁 pick-ui-library 引用） |
| P2 | impeccable（只抽 craft-floor + 有界验证法） | 注入 ui-visual-fidelity 的收敛规则 | 有界验证（批量截图一轮→一批修完→至多再一轮→停） | 高（跳过人格/脚本） |
| P0-流程 | iterate-until-verified（方法论） | 直接作为 **verify 编排模板**：主观词→验收矩阵（Gate｜验证方法｜二值通过条件｜证据）；worker 返 artifact 不返 confidence；**制造/评判分离**（verifier 扣住实现者自评）；失败按证据路由最小修订；同法反复失败→换法或报 blocker，不许弱化 gate 换成功 | 与宪法"独立来源独立上下文裁决"直接同构，是可操作化模板 | 半天 |
| P3 | vercel-composition-patterns | references → frontend-component-quality | 组件 API 纪律 | 极易 |
| P3(范式) | tailwind-design-system | **只抽 token 范式**：Brand→Semantic→Component 三层、*-foreground 语义命名对、.dark 覆盖同名 token → Design.md token 章节模板 | token 组织范式 | 低 |
| P3(内容) | landing-page | 直接搬入 skills/（build-spec 页面需求阶段），要素 checklist 作验收辅助 lens | 补内容/转化结构层；与产品 UI 复现无关 | 半天 |
| 不引入 | beautiful-shadows（黑投影深色无效+arbitrary 值冲突）、gradient（亮色品牌模板）、web-component-design（三框架混合+过浅）、animation-vocabulary（并入 animate）、find-animation-opportunities（并入 improve 类别）、pricing-page/product-proof 等其余营销页模板族（P2 按需） | — | 调研结论 | — |

---

## 7. 与宪法的兼容性声明

1. **不新增 stage/gate**：全部改动落在现有 make-decision/build-spec/build-plan/build-code/verify-code 的技能与证据层；视觉报告是事实不是许可证（与现有 quality fact 语义一致）。
2. **不新增第五材料/独立状态机**：ui-parity-checklist 与 visual-diff-report 走 `quality/evidence/`。
3. **质量裁决独立**：design-extract 的分数、parity 核对、感知/diff 均由独立上下文产出；主会话不得自评自判。
4. **事实不阻断**：唯一强约束是"规格缺五要素禁止派发"（这是材料完整性规则，与现有"材料不可读则不能推进"同类）；质量分数低时是"风险标注+呈交"而非硬 gate。
5. **技能可搬运**：新技能只声明流程与格式契约，渲染/截图/视觉模型经宿主路由（agent-browser/isolated-browser-qa 已是宿主中立）。
6. **新增文件先登记**：3 个 schema + 3 个工具 + 3 个技能均给出唯一 consumer/owner/删除条件（见 §4）；目录变更同步 `docs/architecture/move-map.json`。
7. **human gate 形态**：conversational gate（低置信决策给人、给风险权衡选项）——与宪法"推进/不可逆操作经人确认"一致；品味裁决永远在人。

---

## 8. 实施里程碑（建议顺序，可独立切片）

| 里程碑 | 内容 | 预估 | 消灭 |
|---|---|---|---|
| M0 | 验收对象卡（ui-project-init 强化）+ css-hygiene + 失败三层归档机制 | ~1 天 | 根因 1/3/9 的一部分 |
| M1 | design-extractor（技能+工具+schema）+ ui-parity-checklist + design-source-readiness 接线 | ~3-5 天 | **60% 缺陷（编码前）** |
| M2 | ui-visual-fidelity（capture+perceive+compare+edge+budget）+ browser-qa-evidence 扩展 + visual-diff-report | ~3-5 天 | **25% 缺陷（交付前）** |
| M3 | builder 规格密度模板 + build-code UI phase 接线 + verify-code 检查项 | ~2 天 | 规格密度根因 |
| M4 | 规则知识库注入（better-ui → web-design-guidelines → better-*/react 栈决策 → animate/review） | ~2-4 天 | 实现纪律空白 |
| M5 | 试点：拿一个真实 UI 任务（如 PB-T08 类）完整走一遍协议，量对比（轮次/缺陷/人工小时） | ~1-2 天 | 验证与调参 |

**总投入约 2-3 周（单人）**；若只先做 M0+M1，即可把"设计提取+对照清单"补上，同类任务 5 轮 → 2 轮的期望成立；M0-M2 完成后 → 1-2 轮成立。

**预期量化**（依据 PB-T08 基线：5 轮、~30 缺陷、20+ 人工小时）：
- 用户参与：从"5 轮人肉 QA" → "1 次确认签字"；
- 缺陷分布：60% 被 M1 消灭、25% 被 M2 消灭、10% CSS 债务、5% 消歧；
- 一次通过率：R3 起"设计源码逐行贴给 builder 即一次通过"的机制，成为默认。

---

## 9. 落地时的决策点（已由用户确认）

| # | 决策点 | 用户结论（2026-09-04） | 对方案的影响 |
|---|---|---|---|
| 1 | 前端技术栈 | **React/Next.js 为主** | vercel-react-best-practices 走「先迁 HIGH+ 子集」，同时保留框架无关子集；composition-patterns 一并迁（React 19 规则标注版本） |
| 2 | 设计源形态 | **可渲染设计源为主**（vite 应用+TSX 源码，PB-T08 形态） | design-extractor 的模式一（双源交叉：源码意图+computed style）为主模式，Figma/截图模式为降级备案 |
| 3 | 视觉模型 | **运行环境有视觉能力** | perceive 走多模态截图+结构化清单；diff 走截图+DOM 几何双轨；harness 的数值信号仍保留（捕获 1/3 布局 bug） |
| 4 | M0 是否先行 | **全部方案确认后再动**（不提前实施） | 保留里程碑顺序 M0-M5；在用户确认方案 v1 后统一进入 build-spec 排期 |
| 5 | 试点对象（M5） | 待定 | 建议 PB-T08 类任务回放，待实施排期时再定 |

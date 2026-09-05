# 工程质量四维度集成调研（组件化/统一性/可维护性/性能）

> 任务：为「工程质量四维度」成为一等能力找出现有结构的精确落点。
> 调研日期：2026-09-04。范围：`skills/frontend-component-quality`、`skills/ui-project-init`、`workflows/build-code`、`workflows/verify-code`、`workflows/build-plan`、ADR 0015/0016、decision-log 与方案 v2。
> 背景决策（decision-log.md L91）：目标升级为「工程化能力非常强的 UI 设计+前端工程能力」——不止视觉复现，还要组件化/统一性/可维护性/性能四维高质量。

---

## 1. `skills/frontend-component-quality` 现状精读

### 1.1 文件清单（实测）

```
skills/frontend-component-quality/
├── SKILL.md                                   （61 行，version 1.0.0）
├── skill-bundle.json                          （登记 5 个文件 + upstream 来源）
├── scripts/check-frontend-component-quality.mjs（158 行静态检查脚本）
└── upstream/react-best-practices/
    ├── AGENTS.md    （21 行手写摘要，非完整上游文件）
    ├── LICENSE      （MIT）
    └── UPSTREAM.md  （固定 vercel-labs/agent-skills@dd089a8c）
```

**没有 `references/` 目录**——任务描述的 references 实为 `upstream/`，且只有 3 个文件。skill-bundle.json 登记的上游 path 是 `skills/react-best-practices/AGENTS.md`。

### 1.2 现在覆盖什么

SKILL.md 的三个机制：

1. **Component Quality Map**（L11-30）：每个 UI phase 记录组件动作（`reuse`/`modify`/`extend-state-or-variant`/`add-local`/`extract-shared`/`remove-after-no-consumers`）、真实 consumer、兼容影响、props/events、状态 owner、typed ViewModel、唯一 CSS/token owner、项目实际命令、browser scenario、viewport、fixture、截图状态、coverage limits。硬规则：`extract-shared` 需两个已确认真实消费者；删除需 `no_consumer_evidence`；缺字段写 `unknown`/`unavailable`/`N/A + reason`。消费者盘点走可重放的 `consumer-census.v1`（scanner version、源码 snapshot、support matrix、稳定 consumer_id、枚举 unknown_reason）。
2. **React/Next lens**（L32-34）：React/Next 栈时只读使用随包固定的 Vercel MIT react-best-practices compiled guide，提供「性能和组件边界建议」；非 React/Next 写 `N/A + reason`。
3. **Static quality check**（L36-57）：`scripts/check-frontend-component-quality.mjs` 从 stdin/参数读 JSON，报告 `duplicate-component`、`duplicate-selector`、`global-override`、`important-declaration`、`css-leak` 及输入缺失事实；无输入返回 `not_applicable`，不伪造通过；明确不检查浏览器行为/截图/a11y/运行时状态。

三阶段接线已存在（实测 skill-deps.yaml）：build-plan `trigger: ui_scope`（设计 Map）、build-code `trigger: actual_frontend_test`（回填执行）、verify-code `trigger: ui_acceptance`（验收核对），均 `execution: inline`。

### 1.3 对照四维度逐维度评估

| 维度 | 现状覆盖 | 缺口 |
|---|---|---|
| **组件化** | 中等偏强。Component Quality Map 的 action 枚举、真实 consumer、双消费者 extract-shared 规则、状态 owner/typed ViewModel 都是组件化纪律 | ①无组件组合模式（composition patterns）规则弹药；②组件 API 设计规范只落在 Design.md 职责描述里，技能内无可执行检查项；③静态脚本只有 `duplicate-component` 一项组件化检查 |
| **统一性** | **最强维度**（但仅限 CSS 层）。唯一 CSS/token owner、`duplicate-selector`、`global-override`、`important-declaration`、`css-leak` 五项检查 + `!important` 须写理由和消费者 | ①仅限 CSS/token 层，命名规范、目录结构、组件 API 形态一致性无规则；②方案 v2 已定的「css-hygiene 同选择器多定义」扩展未实施 |
| **可维护性** | 弱-中。有 `story_or_test_update` 强制、状态 owner、`no_consumer_evidence`、未知保留 `unknown` 不伪造 | ①无复杂度/重复代码/目录结构/文档同步规则；②无通用可维护性检查项，静态脚本零覆盖此维度 |
| **性能** | **最弱维度**。仅 L34 一句「提供性能和组件边界建议」+ upstream 摘要里 2 节（Eliminating Waterfalls、Bundle Size Optimization）共约 8 行 | ①无完整规则（ADR 0016 要求的 70 规则未放入，见 §4）；②无任何性能检查项；③性能预算虽属 Design.md 职责（ui-project-init L14）但无执行链——预算写了也没人查；④方案 v2 已定的「optimize-web-animations 性能取证」归 isolated-browser-qa，未实施 |

### 1.4 方案 v2 §5.4 已定扩展项 vs 现状（全部未实施）

方案 v2 L135 已定 frontend-component-quality 的六项扩展：+css-hygiene 同选择器多定义、+vercel-react-best-practices 性能维度（完整放入）、+组件组合模式、+a11y 规则源、+动效检查（能力门控链/状态通信原则/Emil 频率表）、+better-interface severity 标尺。**实测当前 SKILL.md 一项都还没有**——本任务是把这些从「已定」变成「落地」。

---

## 2. `skills/ui-project-init` 现状精读

### 2.1 文件清单（实测）

只有 `SKILL.md`（58 行）+ `skill-bundle.json`。**无模板文件**——Design.md/Experience.md 的「模板」目前只以职责清单的文字形式存在于 SKILL.md L13-19，没有实体 `templates/` 目录。

### 2.2 两份项目规范的身份（L11-19，四维度规范章节的天然落点）

- **Design.md** = 唯一视觉/组件规范：「设计原则、token、布局/响应式、**组件 API**、视觉状态、视觉 a11y、**性能预算**和**治理规则**都放这里」（L13-15）；不写页面流转、业务动作或某次运行结果。
- **Experience.md** = 唯一页面/交互/长期测试场景规范：页面索引、状态、流转、异常恢复、键盘语义、操作/预期/覆盖边界、已知缺口（L15-17）；不写颜色/字体/间距/断点/token/组件视觉规则。
- 两文件均需 owner、revision、`content_sha256`、显式 `anchor_id`/`anchor_title`；不是 task 第五材料（宪法 F3 兼容，decision-log 核心架构决策 §L150-157 重申两文件中心制）。

### 2.3 四维度规范章节应该加在哪

**主体加在 Design.md 职责清单的展开处**——现有职责名已为四维度预留了挂点：

| 维度 | Design.md 现有挂点（L13-15 职责项） | 应加的章节内容 |
|---|---|---|
| 组件化 | 「组件 API」 | 组件组合模式规范、props/events 契约规范、共享组件提取标准（双消费者规则的项目级表述） |
| 统一性 | 「token」「治理规则」 | 命名规范、目录/文件组织、样式唯一权威（一层 token/一处 owner 已有历史四条硬边界基础） |
| 可维护性 | 「治理规则」 | 复杂度上限、重复代码处置、文档/注释同步规则、删除条件登记 |
| 性能 | 「性能预算」 | 预算数值表（bundle/首屏/交互/动效帧率）、预算超标的例外记录与 owner 裁决流程 |

Experience.md 只承接交互侧性能语义（加载状态、异常恢复的体验约定），工程规范主体不进 Experience.md，避免双写。

**落点形态注意**：由于 ui-project-init 目前没有实体模板文件，四维度规范章节的落地有两种形态——(a) 在 SKILL.md L13-15 职责清单中把四个挂点展开为明确章节名清单；(b) 新增 `templates/Design.md` 实体模板。方案 v2 §5.1 已定「Design.md 模板注入 better-colors/typography/layout 原则+tailwind token 三层范式+设计方向六段式」，意味着实施时会建实体模板——四维度章节应搭这次模板建立的便车一并注入。

### 2.4 边界约束（不可越界）

- SKILL.md L9：本技能「不是阶段编排器、质量评分器或推进 gate」；L58：不创建新 stage、第五材料、独立状态机或 no-design gate。四维度规范进 Design.md 是**输入整理**（建立/维护规范文件），不是质量裁决——合规。
- 运行时合同已有 `validateProjectStandardSources(input)` 统一检查两份规范的 identity/职责边界/stale 状态/唯一 writer（L44-50）——四维度章节加入后此合同无需改动，只是规范内容变厚。

---

## 3. build-code / verify-code 现有质量检查环节（工程质量检查项的接入点）

### 3.1 build-code（L95-129 「Conditional UI implementation handoff」+ Work loop）

现有质量环节：

1. **UI 交接（L97-103）**：`ui_applicability=ui` 时，编辑前消费 Component Quality Map，对每条 entry 核对真实 consumer、状态 owner、typed ViewModel、CSS/token owner、`story_or_test_update`——**这是工程质量检查项的执行接入点**。缺失事实保留 `unknown`/`unavailable`/`N/A + reason`，不是 gate。
2. **测试执行（L105-110）**：build-code 是 frontend-testing 的唯一执行 owner；实施顺序固定为「静态组合 → 状态交互 → DTO→ViewModel 接线」。
3. **受控浏览器 QA（L113-129）**：唯一执行缝是 build-code handler 调 `isolated-browser-qa` 适配器一次，证据须过 `browser-qa-evidence.v1`。
4. **Work loop step 4（L150-155）**：完整 diff 对照每个受影响 FR/AC 扫描（行为、状态/数据、错误/取消/恢复、共享接口、并发、真实浏览器行为）。
5. **step 5-6 独立 review + finding 处置**；阶段末 `spec-analyze`。

### 3.2 verify-code（职责 L36-42 + 「Conditional UI consumer alignment」L51-72）

现有质量环节：

1. **代码审查五问（L36-42）**：真实入口/consumer/接口一致性；状态机/生命周期/并发/取消/资源释放/错误传播；权限/安全/数据泄漏/失败恢复；**是否新增重复控制面、无 consumer 的抽象或不必要的兼容分支**（←可维护性维度的现有钩子）；测试是否走真实入口。
2. **UI consumer 对齐（L51-66）**：消费 Component Quality Map + UI Contract，逐条核对真实 consumer/state owner/ViewModel/CSS owner/`story_or_test_update`/兼容边界/浏览器状态事实；`design-alignment.mjs` 是唯一投影——**这是工程质量验收的接入点**。
3. **设计源身份校验（L68-72）**：对 Design.md/Experience.md source identities 和 `consumer-census.v1` 校验真实 changed-file consumers；stale hash/缺 anchor/缺 consumer 报 unknown reason。
4. 两个 review 依赖（dsh-code-review 架构师审 + wh-review 异源审），最多四个动作固定流程。

### 3.3 工程质量检查项应接入哪个环节（结论）

| 环节 | 接入内容 | 文件：位置 |
|---|---|---|
| **build-plan 设计** | Component Quality Map 扩展四维字段（性能预算绑定、组合模式选择、命名/目录归属） | `workflows/build-plan/SKILL.md` L92-114「Conditional UI component-quality plan」 |
| **build-code 执行** | 静态检查脚本扩展项在 UI 交接环节随 Map 逐条核对执行；性能预算在 diff 扫描（step 4）中核对 | `workflows/build-code/SKILL.md` L97-103 + L150-155 |
| **verify-code 验收** | 四维检查结果经 design-alignment 投影纳入 consumer 对齐核对；性能事实经 browser-qa 证据 | `workflows/verify-code/SKILL.md` L51-72 |

三处接线均已存在（skill-deps.yaml 已注册 frontend-component-quality），**工程质量检查项不需要新的接线，只需要扩展现有三个接缝的字段与检查项**。

---

## 4. ADR 0016 vs 现状：70 规则完整放入的差距清单

### 4.1 ADR 0016 的要求（docs/adr/0016-external-first-frontend-component-quality.md，Accepted 2026-08-22）

- 固定来源：`vercel-labs/agent-skills` commit `dd089a8c752c966dee8bf0f27cb625ba193ffd9e` 的 `skills/react-best-practices/SKILL.md`（metadata version 1.0.0）；
- 形态：**完整放入** `skills/external/vercel-react-best-practices/` 并保留 LICENSE/UPSTREAM——即上游完整 70 条 React/Next 最佳实践规则全量落仓，不做子集裁剪；
- 用途：作 React/Next 项目的性能 code-lens，只读，不拥有 WorkflowHub 结果，不触发阶段或 gate；
- 治理：唯一维护 owner = skill bundle maintainer；唯一调用者 = build-plan/build-code/verify-code；跨框架部分保留窄适配，不复制外部规则。

decision-log L171 与方案 v2 L147 两次重申：「按 ADR 用官方仓固定版本**完整放入**（非 Website-skills 镜像、非 HIGH+ 子集裁剪）」，并实测确认 `skills/external/` 目录不存在。

### 4.2 现状（实测）

| 项 | ADR 0016 要求 | 现状 | 差距 |
|---|---|---|---|
| 规则完整性 | 完整 70 规则全量放入 | `upstream/react-best-practices/AGENTS.md` 仅 21 行手写摘要，只有 3 节（Eliminating Waterfalls / Bundle Size Optimization / Component boundaries），约 10 条规则意涵 | **缺约 60+ 条规则**：数据获取细节、渲染策略、服务端组件边界、缓存、懒加载模式、事件处理、列表渲染等全部缺失 |
| 落仓路径 | `skills/external/vercel-react-best-practices/` | `skills/frontend-component-quality/upstream/react-best-practices/` | `skills/external/` 目录不存在，ADR 既定移植模式未建立 |
| 上游文件名 | ADR 写 `skills/react-best-practices/SKILL.md` | UPSTREAM.md 与 skill-bundle.json 写 `skills/react-best-practices/AGENTS.md` | 文件名记载不一致（上游仓该目录同时有 SKILL.md 与 AGENTS.md，需以固定 commit 实核），实施时须以真实上游为准并修正 ADR 或登记 |
| 登记 | catalog.yaml 应有 path/hash/upstream/consumer/owner/删除条件 | catalog.yaml 只有技能本体条目（L598-618），无 external 登记段 | 缺 external 登记 schema 与本条登记 |
| LICENSE/UPSTREAM | 保留 | ✅ 已保留（MIT LICENSE + UPSTREAM.md） | 无差距 |
| 升级纪律 | 人工比较固定上游，不自动替换 | ✅ SKILL.md L34 已写 | 无差距 |

### 4.3 差距修复清单（实施时）

1. 建立 `skills/external/vercel-react-best-practices/`，从固定 commit `dd089a8c` 完整复制上游 SKILL.md（70 规则全文）+ LICENSE + UPSTREAM.md；
2. 现有 `frontend-component-quality/upstream/` 21 行摘要的处理：迁移调用引用到 external 目录后删除（ADR 0016 L9「先迁移调用者再移除该适配」）；或保留为「窄适配摘要」但明确其身份是索引不是规则源——建议前者，避免双规则源；
3. catalog.yaml 增加 external 登记段（path/hash/upstream/consumer/owner/删除条件）；
4. 修正 ADR 0016 或 UPSTREAM 的文件名记载（SKILL.md vs AGENTS.md）；
5. frontend-component-quality SKILL.md L32-34「React/Next lens」引用路径改写指向 `skills/external/vercel-react-best-practices/`。

---

## 5. 工程质量四维度落点表（完整矩阵）

> 原则：规范层（法律）= Design.md/Experience.md 项目级文件；执行检查 = 现有三阶段接缝；验收 = verify-code 既有投影；证据 = 任务级 schema/事实（执法记录仪），不新增第五材料、不新增 gate、不新增 stage（宪法 + 方案 v2 §7 宪法兼容性声明）。

| 维度 | 规范写在哪 | 执行检查在哪 | 验收怎么查 | 证据记在哪 |
|---|---|---|---|---|
| **组件化** | 项目级：`Design.md`「组件 API」章节扩展（组合模式、props/events 契约、提取标准）——ui-project-init 模板注入落点，见 `skills/ui-project-init/SKILL.md` L13-15 + 方案 v2 §5.1。任务级：`workflows/build-plan/SKILL.md` L92-114 Component Quality Map（action/consumer/state owner/ViewModel 已存在，补组合模式选择字段） | build-code UI 交接逐条核对（`workflows/build-code/SKILL.md` L97-103）；静态脚本扩项：`skills/frontend-component-quality/scripts/check-frontend-component-quality.mjs` 在 `duplicate-component` 外补组合模式违例检查 | verify-code UI consumer 对齐（`workflows/verify-code/SKILL.md` L51-66）：真实 consumer、双消费者 extract-shared、`story_or_test_update` 逐条核对；`consumer-census.v1` 校验 | 任务事实：`contract_facts.component_quality_map`（stage-content-contracts，skill-deps 已登记 consumer `validateComponentQualityMap`）；静态检查 findings 记入 phase 执行事实（tasks.md 执行状态填写区） |
| **统一性** | `Design.md`「token」+「治理规则」章节：命名规范、目录组织、一层 token 权威/一处样式 owner（沿用 2026-08-22 历史四条硬边界，decision-log L165） | 现有最强：静态脚本已查 `duplicate-selector`/`global-override`/`important-declaration`/`css-leak`；补方案 v2 已定「css-hygiene 同选择器多定义」；命名/目录统一性检查项加入同一脚本 | verify-code alignment 投影核对 CSS/token owner（L53-59）；Design.md source identity + stale hash 校验（L68-72）保证规范未被绕开 | 同上 component_quality_map 的 CSS/token owner 字段 + 检查 findings；Design.md 绑定事实（path+SHA+anchor）记 spec.md（历史设计沿用） |
| **可维护性** | `Design.md`「治理规则」章节：复杂度上限、重复处置、文档同步、删除条件登记 | 静态脚本扩项（重复代码/无 consumer 抽象检测为候选）；build-code work loop step 4 diff 扫描（L150-155）含「共享接口/兼容边界」核对；verify-code 审查五问第 4 条「是否新增重复控制面、无 consumer 的抽象」（L41）已是最直接钩子 | verify-code 代码审查五问（L36-42）+ dsh-code-review/wh-review 双 review 的 findings 处置（fixed/rejected_invalid/accepted_risk/needs_human） | review findings + disposition 记 `facts.review`/`facts.code_review`（skill-deps 已登记）；finding disposition 记 tasks.md 执行事实 |
| **性能** | `Design.md`「性能预算」章节：预算数值表（bundle/首屏/交互/动效帧率）+ 超标例外记录与 owner 裁决流程；规则弹药 = ADR 0016 完整 70 规则（`skills/external/vercel-react-best-practices/`，待 §4.3 落地） | 三层：①build-code UI 交接时 React/Next lens 对照 70 规则做实现层核对（SKILL.md L32-34 引用改指 external）；②静态脚本补 bundle/导入类检查候选项；③运行时性能取证归 isolated-browser-qa（方案 v2 §5.6 optimize-web-animations，browser-qa-evidence.v1 扩展字段），build-code handler 是唯一执行缝（L113-129） | verify-code 经 design-alignment 投影核对预算绑定与实测事实；性能预算超标记 `unknown`/例外事实交 owner，不是 gate（宪法「记录事实而非阻断」） | `browser-qa-evidence.v1`（扩展性能字段，方案 v2 §4 已定向后兼容扩展）；预算核对结论记 component_quality_map 扩展字段；预算例外记 Design.md 例外记录 |

**横向说明**：

- 四维度的「规范」全部汇聚到 Design.md 一个文件（Experience.md 只承接交互侧体验约定），符合两文件中心制（decision-log L150-157），不产生第三份规范。
- 四维度的「执行/验收」全部复用已注册的三阶段接缝（build-plan ui_scope / build-code actual_frontend_test / verify-code ui_acceptance），不新增 skill-deps 条目以外的控制面。
- 缺失统一保留 `unknown`/`unavailable`/`N/A + reason`，质量事实不阻断推进（宪法 F-系 + verify-code L101-111）。

---

## 6. 评估：扩展 frontend-component-quality vs 新增 frontend-engineering-quality

### 6.1 扩展 frontend-component-quality（推荐）

**利**：
1. **接线零成本**：三阶段 skill-deps.yaml（build-plan/build-code/verify-code）已全部注册该技能且 `execution: inline`，扩展字段与检查项即刻生效，不动任何编排。
2. **符合已定决策**：方案 v2 §5.4 已明确把四维相关的六项扩展（性能 lens、组合模式、a11y、动效、severity 标尺、css-hygiene）全部定给本技能；decision-log 经 42 条 findings 三轮审查确认，逆决策需重开 Talk。
3. **符合宪法与治理边界**：「简单优先」「没有当前消费者的重复控制面不新增」（AGENTS.md 治理边界）；两个质量 lens 必然在 consumer/CSS owner/Map 字段上双写，违反「不新增双写」。
4. **符合 ADR 0016 薄适配模式**：外部规则（70 条）进 `skills/external/`，跨框架窄适配留在本技能——架构已为此设计好分层。
5. Map 的 action 枚举、unknown 语义、不伪造通过纪律与四维度要求天然兼容。

**弊**：
1. 技能变厚：SKILL.md 从 61 行扩展到可能 150+ 行，references/ 需新建（规则弹药按需加载可缓解——方案 v2 §6 移植纪律「规则弹药进 references/，不进默认加载链」）。
2. 名称语义偏窄：「component-quality」字面不覆盖性能/工程维度。**缓解**：保留名称（改名牵动 skill-deps/catalog/三阶段 SKILL.md 引用，成本高），扩写 frontmatter description 为「组件化/统一性/可维护性/性能四维工程质量 lens」；或经 ADR 正式改名（不推荐，收益不抵成本）。

### 6.2 新增 frontend-engineering-quality

**利**：语义名实相符；职责边界纸面干净；不碰现有技能。

**弊**：
1. **直接撞治理红线**：与 frontend-component-quality 在组件化/统一性两个维度 100% 重叠，构成「没有当前消费者的重复控制面」——AGENTS.md 明示不新增；需先迁移现有三处消费者再建新技能，纯浪费。
2. 接线成本高：三阶段 skill-deps、catalog、stage-content-contracts 的 `validateComponentQualityMap` 消费边都要新增或分叉。
3. 双 lens 双写：同一组件的 consumer/owner 事实两处维护，违反「唯一 writer」合同（ui-project-init L49-50 原则）。
4. 逆已定决策：方案 v2 §5.4 与三轮审查结论需作废重审。

### 6.3 明确建议

**扩展 `frontend-component-quality`，不新增技能。** 具体形态：

1. SKILL.md 扩为四维度结构（组件化/统一性/可维护性/性能四节），性能节引用 `skills/external/vercel-react-best-practices/`（70 规则按 §4.3 落地）；
2. 规则弹药（组合模式/a11y/动效/severity 标尺）进新建 `references/` 按需加载；
3. `scripts/check-frontend-component-quality.mjs` 扩检查项（同选择器多定义、组合模式违例等），保持「无输入 not_applicable、不伪造通过」语义；
4. 规范章节搭 ui-project-init 实体模板建立的便车注入 Design.md（§2.3）；
5. 名称不动，description 扩写；如未来语义争议变大，再经 ADR 评估改名。

---

## 附：调研依据文件清单

- `skills/frontend-component-quality/SKILL.md`（61 行全文精读）、`skill-bundle.json`、`scripts/check-frontend-component-quality.mjs`（158 行）、`upstream/react-best-practices/{AGENTS.md,LICENSE,UPSTREAM.md}`
- `skills/ui-project-init/SKILL.md`（58 行全文精读；实测无 templates/ 目录）
- `workflows/build-code/SKILL.md` L95-129（UI 交接）/L131-175（work loop）/L244-255（reporting）
- `workflows/verify-code/SKILL.md` L36-42（审查五问）/L51-72（UI consumer 对齐）/L74-95（审查依赖与流程）
- `workflows/build-plan/SKILL.md` L92-114（Component Quality Map 设计）+ 三阶段 `skill-deps.yaml`
- `docs/adr/0016-external-first-frontend-component-quality.md`（11 行全文）、ADR 0015（不打分约束，经 decision-log L170 转述）
- `specs/workflowhub-ui-frontend-capability-20260904/decision-log.md` L80-209（四维度要求 L91、ADR 0016 修正 L171、两文件中心制 L150-157）
- `specs/workflowhub-ui-frontend-capability-20260904/evidence/frontend-capability-upgrade-plan-v2.md` §5（接线 L128-145）/§6（移植终案 L147-155）/§7（宪法兼容性）
- `skills/catalog.yaml` L556-568（ui-project-init）、L598-618（frontend-component-quality）；实测 `skills/external/` 不存在

# MERGE-template-gap-analysis — 现有 spec/plan/tasks 模板 × 新 spec 结构提案 差距分析

> 任务：`workflowhub-thin-core-card-02-20260919`
> 目的：把**现有三个模板**与**用户已确认的新 spec 结构提案**逐项对照，找出差距，并检验新结构是否满足**全部原始需求**。
> 只读作业：本报告未修改任何被审文件（模板、decision-log、draft-final-merge、research 报告全部只读）。
> 读取快照：
> - 模板：`skills/spec-specify/templates/spec-template.md`（198 行）、`skills/spec-plan/templates/plan-template.md`（244 行）、`skills/spec-tasks/templates/tasks-template.md`（259 行）
> - 新结构权威源：card-02 `decision-log.md` T-048（L1298-1316）＋用户输入的结构提案（两者一致）
> - 原始需求权威源：`research/REQ-full-inventory.md`（561 行，316 需求单元）、`decision-log.md`（1329 行，V-01..V-28 / T-001..T-050）、`draft-final-merge.md`（854 行，D-001..D-014）、`research/I-B-build-spec-build-plan-quality-core.md`（335 行，K1–K12）、`research/MERGE-two-stages-consolidation.md`（429 行）
> - 结构来源报告：`research/R-G-spec-narrative-and-decomposability.md`（968 行，候选 D / §11.4 / §11.5 / §12.1）

---

## 0. 先说三件影响全局的事实

**事实 F1：新结构提案的对照组不是现有 spec-template。**
`R-G §12.1` 的映射表标题是「**被否 10 节** → 候选 D 的映射表（内容一个都没丢，换的是轴）」，但那 10 节指的是 **R-B §8 的模板骨架**（`0目标/1硬约束/2改动范围/3边界与错误/4示例/5验收/6未决/附录`，R-G L875 自述），**不是**本仓现行 `skills/spec-specify/templates/spec-template.md` 的 13 节。因此：
> 「10 节内容一个都没丢」这句结论，**从未对真实 template 做过逐节核对**。本报告第 3 部分就是在补做这件事，结果是：**真实模板至少 11 处内容在新结构中无落点**。

**事实 F2：新结构只定义了 spec，没有定义 phase。**
R-G §11.4 明写「候选 D **不预设** phase 内部写法」；R-G §12.3 建议 phase 文档继续用 R-B §8 的固定字段骨架。也就是说，`plan-template.md` + `tasks-template.md` 的**全部内容**在新体系里的落点，取决于一份**尚未写出的 phase 模板**。本报告对这类项一律标注新落点＝`phase 文档（形态未定）`，并在第 3 部分区分「换地方（合理）」与「真缺」。

**事实 F3：draft-final-merge D-002 与 T-048 对主干节数口径不一致（需登记）。**
- D-002 ⑤（draft-final-merge L85）＝「主干用候选 B **四拍**（问题/动机 → 改成什么 → 为什么这样改 → 具体机制按 seam 分节）」。
- T-048（decision-log L1309）＝主干 **6 节**（在第 4 节后新增「5 怎么知道改对了」「6 未决与风险」）。
新结构提案与 T-048 一致，D-002 未同步。**这是同一事实的两份表述**（正是 R-G 点名的致命失效条件），须按 T-049/append-only 方式追加 supersession 登记。

**事实 F4（附带）：`.specify/templates/` 历史模板已死。**
现存 `.specify/templates/`＝`plan-template.md`（4794B）、`tasks-template.md`（9948B）、`checklist-template.md`（1312B）；**无 spec-template.md**。全仓检索 `.specify/templates` 的引用**只出现在历史只读材料**：`specs/archive/m11-build-spec-v1/{plan,spec,tasks}.md`、`specs/archive/m12-build-plan-v1/spec.md`、`.omc/artifacts/**`。**skills/ workflows/ runtime/ tools/ docs/ 零引用**。且 m11/m12 的 `FR-DECOUPLE-002` 明确「不读目标项目 `.specify/templates/`，路径不存在时 fail-loud，不做 `.specify/` 回退」。三个技能实际加载的是 `skills/<skill>/templates/`（`spec-specify/SKILL.md:22`、`spec-plan/SKILL.md:22`、`spec-tasks/SKILL.md:21`）。
> **结论：`.specify/templates/` 不作为本次改造对象，只作为历史只读保留。**

**同批相邻模板（本次不逐节展开，但受新三文档模型影响）**：`skills/decision-log/templates/decision-log-template.md`（新模型＝「方向」权威，T-012/D-002①）、`skills/spec-prd/templates/prd-template.md`（PRD＝产品权威，D-002）。

---

## 第 1 部分：现有三个模板的逐节清单

### 1.1 `skills/spec-specify/templates/spec-template.md`（198 行；5 个前置块 + 13 个编号节）

| # | 节号 + 标题 | 行数 | 该节要求填什么字段（原文摘录为准） |
|---|---|---|---|
| — | 文件定位声明 | L3 | 「本文件只写产品问题、行为、边界和验收，**不写文件路径、代码符号或工程命令**」 |
| — | 元数据头 | L5-7 | 功能名 / 来源（accepted decision 或用户故事的精确引用）/ **状态（草稿 / 已接受 / 已替换）** |
| 前置 1 | 速读卡（30 秒） | L9-18 | 一句话需求 / 核心改动点 / **最大影响面** / 验收信号 |
| 前置 2 | 来源与决策映射 | L20-29 | 表：Source ID / Decision ID / FR·AC IDs / Status·affected scope / Unresolved·handoff；规则：每条 FR/AC 必须能回到本表；**scope revision 只追加映射和 revision note，不另建需求账本** |
| 1 | 问题与紧迫性 | L31-33 | 从用户视角说明麻烦、现有方式为何不够、为何现在必须处理 |
| 2 | 背景、目标与范围 | L35-50 | 背景 / 目标 / 范围内；「**非目标只在第 10 节维护，避免两份真相**」 |
| 3 | 用户场景与状态覆盖 | L52-72 | SCN-001：角色 / Given / When / Then；**八态覆盖清单**：默认·空·错误·加载·取消·边界·权限·竞态（每态写 SCN ID 或 `N/A — 理由`） |
| 4 | 产品事实与假设（PFACT） | L74-89 | PFACT-01：status（`verified`/`inferred`/`unknown`/`not_applicable`）/ 证据或来源 / owner·影响 / 不适用理由 / 关联 FR·AC；`unknown` 必须关联 RISK 或 OPEN；**生成约束：必须直接满足 `spec-content.v3`，原样交给严格 `spec-analyze`** |
| 5 | 功能需求 | L91-105 | 功能域叙述（DOMAIN）＋ FR-DOMAIN-001：范围边界 / 依据（decision·PFACT ID）/ 场景（SCN）/ 验收（AC）；每条 FR 至少连接一个 PFACT、SCN 和 AC |
| 6 | 模块划分 | L107-116 | 模块：负责什么 / 对外提供什么 / 依赖谁 / **测试边界** |
| 7 | 关键实体 | L118-125 | 实体：定义 / 字段和约束 / 关系 |
| 8 | 数据和生命周期 | L127-136 | 数据粒度 / 数据时效 / 缺失或迟到 / 预览与正式 / 当前与历史 / 归属与清理 |
| 9 | 兼容性预留 | L138-146 | 既有消费方 / 命名预留 / 容器预留 / 状态预留 / 扩展边界 |
| 10 | 明确不做与默认必须成立 | L148-158 | 明确不做（**唯一权威非目标列表**，需写来源 decision ID、阶段/永久性质）/ 默认必须成立（关联 FR 和 AC） |
| 11 | 验收标准 | L160-169 | AC-01：需求（FR ID）/ 验证方法 / 通过条件 / 失败条件 / 证据类型（`test`/`evidence`/`manual`）；「验收停留在产品层；**精确命令和工程 oracle 留给 plan/tasks**」 |
| 12 | 风险、未决与交接 | L171-186 | RISK-01：受影响 ID / 触发条件 / 后果 / 缓解或 STOP / **处理 Stage** / 验证；OPEN-01：受影响 ID / owner / 影响 / **处理 Stage** / 关闭条件或 STOP |
| 13 | 业务影响与回归范围 | L188-198 | 受影响功能：既有行为 / 本需求影响 / 回归路径 / 验收；＋ 可能受冲击的业务规则 / 明确无影响 |

### 1.2 `skills/spec-plan/templates/plan-template.md`（244 行；22 个顶层块）

| # | 节号 + 标题 | 行数 | 该节要求填什么字段 |
|---|---|---|---|
| — | 头部 | L1-4 | Input（decision-log.md ref、spec.md ref）/ Template version `plan-task.v4` |
| 1 | 材料导航 | L6-15 | 表：章节·材料锚点 / 职责与摘要 / **M/S/B/P 读取时机**（主会话·子代理·后台·并行）；「不产生第五份权威材料」 |
| 2 | Quick Read | L17-24 | Goal / Non-goals（含 source·decision ref）/ Before / After / Main risk / Next step |
| 3 | Technical Context → Global Constraints | L26-37 | Verified facts / Language·runtime / Primary dependencies / Storage·state / Testing / Target environment / Scale·scope / Unresolved facts |
| 4 | Code Anchors | L39-45 | Verified anchors / Existing interfaces / **Read now** / **Must read before task** / **Context mode（Lite / Full / N/A）** |
| 5 | Reuse → Extend → New（表） | L47-51 | Capability / Decision(reuse·extend·new) / Existing anchor / Reason·removal condition（new 需写 consumer、owner、test、删除条件） |
| 6 | Solution Design — Overview | L53-57 | 2–4 段讲清完整技术链路、关键数据流、最小改动方式 |
| 7 | Solution Design — Module responsibilities | L59-66 | 每模块：Responsibility / Consumes / Produces / **Must not decide** |
| 8 | Solution Design — Interfaces, data, and lifecycle | L68-74 | Interfaces·schemas / Data flow·state / API contract / UI·external code / **Fail-loud behavior** |
| 9 | UI Delivery Contract | L76-88 | UI applicability / Component action / Real consumer / State owner / Typed ViewModel / CSS·token owner / Fixture·viewport / Browser·a11y·performance / Screenshot handoff / Coverage limits / N-A reason |
| 10 | Design-gap handoff | L90-100 | design_status / missing_items / fallback_visual_basis / constraints·assumptions / rework_risk·human_confirmation / current_material_ref·design_revision / visible_labels / preview·fixture·viewport·screenshot_refs / responsive·a11y |
| 11 | File Boundary | L102-114 | NEW / MODIFY / **DO NOT TOUCH（精确保护文件路径及理由）** |
| 12 | Technical Decisions | L116-130 | DEC-001：Problem / Options / Selected / Reason / Consequence·risk / Fallback；＋ **F10 real threat / F10 existing cover / F10 bypassable / F10 maintenance cost / F10 disposition** |
| 13 | Test Strategy | L132-144 | 表：Target / Task / Role(RED·GREEN) / **gate_cmd·expected_exit** / **Oracle·evidence_path**；＋ tier/data source/sample/scenario/逐 AC oracle 绑定规则；＋ review canonical attempt·reflection v2 约束 |
| 14 | Rollback and Recovery | L146-151 | Global recovery rule / **Irreversible boundaries（需明确授权的 commit·push·merge·archive·cleanup）** / Recovery owner |
| 15 | Engineering Risk Handoff | L152-160 | PLAN-RISK-001：Affected IDs / Trigger / Consequence / Mitigation or STOP / Handling Stage / Verification |
| 16 | Implementation Order | L162-164 | producer-before-consumer 顺序、Phase ID、必须串行的原因 |
| 17 | Dependencies and Parallelism | L166-170 | Dependencies / **Parallel work（独立输入、依赖和文件所有权）** / External dependencies |
| 18 | Requirement and Verification Traceability（表） | L172-176 | Source·decision / **FR** / AC / Phase·Task / Depends on / Exact files / **Command·oracle** |
| 19 | Governance Synchronization Matrix（表） | L178-182 | Governance surface / Actual files / Change·no change / Task IDs / Reason |
| 20 | Constitution Check | L184-208 | constitution binding JSON（ref/hash/id/version/clause_count=22）＋ **F1–F11、Q1–Q3、S1–S8 逐条事实与证据** |
| 21 | Phase P1（内联阶段块） | L210-244 | Goal / Files（NEW·MODIFY·DO NOT TOUCH）/ Tasks（T-ID 列表）/ Verify / Knowledge / STOP / Done / Risks and rollback |

### 1.3 `skills/spec-tasks/templates/tasks-template.md`（259 行；3 个前置块 + Phase 块 + 4 个收尾块）

| # | 节号 + 标题 | 行数 | 该节要求填什么字段 |
|---|---|---|---|
| — | 头部 | L1-4 | Input（decision-log.md、spec.md、plan.md ref）/ Template version `plan-task.v4` |
| 1 | 材料导航 | L6-15 | 同 plan：章节·锚点 / 职责与摘要 / M·S·B·P 读取时机 |
| 2 | Phase P1 — Goal | L19-21 | 本 Phase 可观察结果；「不要复制产品 rationale」 |
| 3 | Phase P1 — Files | L23-27 | NEW / MODIFY / DO NOT TOUCH |
| 4 | Phase P1 — Tasks | L29-202 | **任务卡**：T001（RED）、T002（GREEN）、T003（FINAL）三张卡，各约 30 字段：ID / Phase / goal / **design_state** / **versioned_refs（spec·plan ref+hash+id JSON）** / source_refs·decision_refs / 输入 / 依赖 / 并行 / FR / AC / 动作 / 精确文件 / **boundary（files + symbols/regions）** / 输出 / Knowledge / **verification_role** / **paired_task** / gate_cmd / expected_exit / oracle / evidence_path / STOP / recovery / task risk / test tier·method / scenarios·commands·expected exit·oracle / fixtures_services / coverage limits |
| 4a | ├ Delivery contract fields（新计划必须显式填写） | L63-90 | acceptance_role / ui_scope / **acceptance_data JSON**（source·sample·scenario·tier）/ **e2e_scope**（ui·fullstack·high_risk_user_visible·not_required）/ **e2e_decision_refs** / **e2e_risk_decision_ref** / **high_risk_fact JSON** / execution（command argv·service module_ref）JSON 形状示例 / 逐 AC `entries[].assertions` 输出契约 |
| 4b | ├ UI phase/task fields（仅 UI scope） | L92-102 | ui_scope / component action·real consumer / state owner·typed ViewModel·CSS·token owner / fixture·viewport·responsive / browser·a11y·performance·screenshot / coverage limits·N-A reason / design-gap handoff / design refs / state UI facts |
| 4c | ├ 执行状态填写区（**唯一完成权威**） | L104-114、L148-158、L192-202 | 任务完成 checkbox / status / actual_changes / executed_commands / evidence_refs / covered_ac / **review_fact** / completed_at / 执行事实 |
| 5 | Phase P1 — Verify | L204-210 | Target（FR·AC·跨任务 seam）/ gate_cmd / expected_exit / evidence_path / Oracle |
| 6 | Phase P1 — Knowledge | L212-214 | 交给下一 Phase 的已核实接口、来源和风险事实 |
| 7 | Phase P1 — STOP | L216-218 | 命令损坏、oracle 不符、越界或需新设计时返回 owning material |
| 8 | Phase P1 — Done | L220-222 | 测试、AC 覆盖、review findings、证据和大白话交接事实 |
| 9 | Phase P1 — Risks and rollback | L224-228 | Risk / Prevention / Rollback·recovery |
| 10 | §4 Final current-snapshot aggregate strategy | L230-241 | tier·method / scenarios / command / expected exit / oracle / fixtures_services / evidence_path / coverage limits / STOP / **execution_contract（跑一次；复用 canonical receipts；超时记 incomplete；不全量重跑）** |
| 11 | Dependency Graph | L243-249 | order（T001 RED → T002 GREEN → T003 FINAL）＋ text 图 |
| 12 | 完成区填写纪律说明段 | L251 | executed_commands·evidence_refs·review_fact·执行事实只填真实调用及消费者结果；缺失/partial/unavailable 分别写清 |
| 13 | Final Boundary Check | L253-259 | 5 条勾选：Phase 八小节完整 / 一卡一完成区且文件属 Phase 子集 / 每行为变化有同命令同 oracle 的 RED→GREEN 且 FINAL 只聚合一次 / 无环且双向追溯闭合 / review·test·evidence 只是事实不是许可证 |

---

## 第 2 部分：旧 → 新 映射（逐节）

> 落点枚举：`主干第 N 节` / `附件 A·B·C·D` / `附录` / `phase 文档（形态未定）` / **`无落点`**。
> 新结构（权威）：主干 1 问题 · 2 改成什么（含非目标/不做/预算）· 3 为什么这样改（被否方案与取舍；MUST/SHOULD 内嵌）· 4 具体机制（按切片分节）· 5 怎么知道改对了（场景化验收+可执行判据）· 6 未决与风险（消除条件/责任人/期限）；附件 A 需求登记（R-ID/一句话/验收判据/覆盖切片/状态）· B 写集与依赖（切片→文件→依赖）· C 未决表（ID/消除条件/责任人/期限）· D 覆盖指针（R-ID→切片）；附录 被否方案详述·来源·术语表。

### 2.1 spec-template → 新结构

| 旧模板 | 旧节 | 新结构落点 | 轴变化 |
|---|---|---|---|
| spec-template | 文件定位声明（L3） | **无落点（方向反转）** | 产品层独占 → spec 变为「实现设计权威」含架构与写集（REQ-D-03 / REQ-K-08） |
| spec-template | 元数据头：功能名·来源·状态（L5-7） | 附录（来源）；**状态无落点** | 头部元数据 → 叙事化；「已替换」状态语义消失 |
| spec-template | 速读卡（L9-18） | 主干（整条主干即速读）＋ 附件 A「一句话」 | 独立卡片 → 论证链首段（R-G §12.1：结论前置） |
| spec-template | 速读卡·最大影响面（L17） | **无落点** | 影响面字段消失 |
| spec-template | 来源与决策映射（L20-29） | 附件 A（R-ID/一句话/状态）＋ 附录（来源） | 表 → 降级到附件；Decision ID 列移交 decision-log（R-G §12.2） |
| spec-template | §1 问题与紧迫性（L31-33） | 主干第 1 节 | 抽象视角陈述 → **一个具体故事 + 现状为什么不行** |
| spec-template | §2 背景/目标/范围内（L35-50） | 主干第 1 节（背景）＋ 主干第 2 节（目标/范围） | 三小节平铺 → 问题→改成什么 的因果链；非目标前移 |
| spec-template | §2「非目标只在第 10 节维护」（L50） | 主干第 2 节（非目标/不做清单） | 单一权威处从 §10 前移到主干第 2 节 |
| spec-template | §3 场景 + **八态清单**（L52-72） | 主干第 5 节（场景化验收）；**八态清单无落点** | Given/When/Then 保留为场景；**八态矩阵作为结构化清单消失** |
| spec-template | §4 PFACT（L74-89）＋ spec-content.v3 生成约束 | **无落点**（主干第 6 节可容 `unknown`，但无状态机、无证据字段、无 schema 约束） | 事实层状态机 → 未决/风险叙述 |
| spec-template | §5 FR 层（L91-105） | 附件 A（R-ID 直连切片）＋ 主干第 4 节（切片） | **FR 中间层被压缩**；范围边界→每片「不做」；依据→附录来源；场景·验收→主干第 5 节/附件 A |
| spec-template | §6 模块划分（L107-116） | 主干第 4 节（切片＝被隐藏的决策＋与既有部分的交互）＋ 附件 B（依赖） | 产品职责模块 → 可独立交付/验证的切片 |
| spec-template | §7 关键实体（L118-125） | **无落点** | 数据模型节整体消失 |
| spec-template | §8 数据和生命周期（L127-136） | **无落点** | 六字段整体消失 |
| spec-template | §9 兼容性预留（L138-146） | **无落点**（主干第 2 节非目标部分覆盖「不承诺什么」） | 五字段整体消失 |
| spec-template | §10 明确不做（L148-158） | 主干第 2 节 | 唯一权威非目标列表 → 前移并「必须写为什么不是目标」 |
| spec-template | §10 默认必须成立（L156-158） | 主干第 3 节（关键约束 MUST/SHOULD 内嵌） | 独立教条节 → 语境化标记（RFC 2119） |
| spec-template | §11 验收标准（L160-169） | 主干第 5 节 ＋ 附件 A「验收判据」 | 产品层 AC 表 → 场景化验收；**四段式/黑名单/证据类型/V1V2V3 分离无显式落点** |
| spec-template | §11「精确命令留给 plan/tasks」（L169） | phase 文档（形态未定；R-B §8 骨架的验收节） | plan/tasks 删除 → 命令落点改到 phase |
| spec-template | §12 风险（RISK-01 六字段，L173-179） | 主干第 6 节（风险叙述）＋ 附件 C（仅未决）；**触发条件/处理 Stage/验证无结构化落点** | 风险与未决合并为一条叙事轴；**附件 C 只收未决** |
| spec-template | §12 未决（OPEN-01 五字段，L181-186） | 主干第 6 节 ＋ 附件 C | 保留并**新增「期限」**（R-G：加 TBR 语义） |
| spec-template | §13 业务影响与回归范围（L188-198） | **无落点**（主干第 4 节「与既有部分的交互」弱覆盖「既有行为」） | 影响面/回归路径/无影响声明整节消失 |

### 2.2 plan-template → 新结构

| 旧模板 | 旧节 | 新结构落点 | 轴变化 |
|---|---|---|---|
| plan-template | 头部 Input·version（L1-4） | 附录（来源） | 机器版本号消失 |
| plan-template | 材料导航 M/S/B/P（L6-15） | 附件 D 覆盖指针（部分）＋ 紧凑索引 | MERGE D5 主动删除「三份材料各写一遍的导航表」 |
| plan-template | Quick Read（L17-24） | 主干第 1/2/6 节 | 六字段速览 → 叙事主干 |
| plan-template | Technical Context（L26-37） | 主干第 3 节（约束内嵌）＋ 附件 B（依赖）；**语言·运行时/存储/目标环境/规模无落点** | 全局参数表 → 语境化约束 |
| plan-template | Code Anchors（L39-45） | 主干第 4 节「与既有部分的交互」＋ 附件 B（切片→文件）＋ phase 文档；**Read now / Must read / Context mode 无落点** | 阅读纪律字段消失 |
| plan-template | Reuse→Extend→New（L47-51） | 主干第 4 节（切片＝被隐藏的决策）＋ 附录（被否方案） | 全局能力表 → 逐片决策 |
| plan-template | Solution Design Overview（L53-57） | 主干第 4 节 | 技术链路叙述 → 切片论证 |
| plan-template | Module responsibilities（L59-66） | 主干第 4 节（交互）＋ 附件 B | 模块契约表 → 切片声明；**Must not decide 无落点** |
| plan-template | Interfaces·data·lifecycle（L68-74） | 主干第 3 节（关键约束内嵌）；**Data flow·API contract·Fail-loud 无落点** | 接口契约表 → 内嵌句 + 附件 B |
| plan-template | UI Delivery Contract（L76-88） | **无落点** | 12 字段 UI 契约整体消失 |
| plan-template | Design-gap handoff（L90-100） | **无落点** | 设计缺口交接整体消失 |
| plan-template | File Boundary NEW/MODIFY/DO NOT TOUCH（L102-114） | 附件 B（切片→文件）＋ 主干第 4 节「不做」；**DO NOT TOUCH 无落点** | 全局三清单 → 逐片声明；**禁改清单缺结构化落点（K9 要求保留）** |
| plan-template | Technical Decisions DEC-001（L116-130） | 主干第 3 节（被否方案与取舍）＋ 附录（详述）；**F10 五字段无落点** | 决策条目 → 论证链；宪法 F10 检查面消失 |
| plan-template | Test Strategy（表，L132-144） | 主干第 5 节（可执行判据）＋ phase 文档（任务卡 gate_cmd/oracle/evidence） | 全局 RED/GREEN 表 → 就地判据 |
| plan-template | Rollback and Recovery（L146-151） | 主干第 6 节（责任人）；**不可逆边界/恢复 owner 无结构化落点** | 恢复策略节消失 |
| plan-template | Engineering Risk Handoff（L152-160） | 主干第 6 节 ＋ 附件 C（部分）；**Handling Stage 无落点** | 风险表 → 叙事 + 未决表 |
| plan-template | Implementation Order（L162-164） | 附件 B 依赖 ＋ phase 文档执行顺序 | 顺序叙述 → 依赖表 |
| plan-template | Dependencies and Parallelism（L166-170） | 附件 B（切片→文件→依赖）；**并行五项声明只落 2 项** | 全局并行节 → 逐片声明（V-18 五项缺 3 项，扩项归 CARD-03） |
| plan-template | Requirement and Verification Traceability（L172-176） | 附件 A（R-ID）＋ B（文件/依赖）＋ D（覆盖指针）；**FR 列与 Command·oracle 列无落点** | 七列表 → 三附件分载 |
| plan-template | Governance Synchronization Matrix（L178-182） | **无落点** | 治理同步矩阵整体消失 |
| plan-template | Constitution Check（L184-208） | **无落点** | F1–F11/Q/S 逐条检查 + binding JSON 整体消失 |
| plan-template | Phase P1 块（L210-244） | phase 文档（形态未定） | 内联阶段块 → 独立 phase 文档 |

### 2.3 tasks-template → 新结构

| 旧模板 | 旧节 | 新结构落点 | 轴变化 |
|---|---|---|---|
| tasks-template | 头部·材料导航（L1-15） | 附录（来源）／附件 D | 同 plan |
| tasks-template | Phase Goal / Files / Verify / Knowledge / STOP / Done / Risks（L19-27、L204-228） | phase 文档（形态未定；R-B §8 骨架） | 阶段块 → 独立工作包文档 |
| tasks-template | 任务卡 30 字段（L31-202） | phase 文档（任务卡；MERGE 5.1 步骤 6 明确 spec-plan 承接） | 卡字段 → 单写 phase 文档；**`versioned_refs`/`design_state`/`boundary` 等机器字段去向待定** |
| tasks-template | Delivery contract fields（L63-90） | phase 文档；`acceptance_data`/`e2e_scope`/`versioned_refs`/`material_fingerprint` **主动删除** | 哈希/回执机器外壳删除（OI-013；MERGE D2/D3/D5） |
| tasks-template | UI phase/task fields（L92-102） | **无落点** | UI 字段组整体消失 |
| tasks-template | 执行状态填写区（L104-114 等） | phase 文档完成区 ＋ task facts（`facts.jsonl`） | 「唯一完成权威」位置从 tasks.md 迁到 phase 文档/事实层 |
| tasks-template | §4 Final aggregate strategy（L230-241） | phase 文档 Verify ＋ 主干第 5 节 | 全局聚合策略 → 阶段就地验证 |
| tasks-template | Dependency Graph（L243-249） | 附件 B 依赖 ＋ 紧凑索引 | 图 → 表 |
| tasks-template | Final Boundary Check（L253-259） | **无落点**（可归合并审查 checklist） | 5 条自检清单消失 |

### 2.4 `无落点` 项汇总（第 3 部分逐条展开）

**A. spec-template**：定位声明（方向反转，非缺）· 元数据「状态」· 速读卡「最大影响面」· **八态清单** · **PFACT + spec-content.v3 生成约束** · **FR 中间层** · **关键实体** · **数据与生命周期** · **兼容性预留** · AC 的「验证方法/证据类型/四段式/V1V2V3」· RISK 的「触发条件/处理 Stage/验证」· **业务影响与回归范围** · 「精确命令留给 plan/tasks」（换地方）
**B. plan-template**：技术环境 4 字段 · Code Anchors 3 字段 · **UI Delivery Contract** · **Design-gap handoff** · **DO NOT TOUCH** · **F10 五字段** · Rollback 的不可逆边界/恢复 owner · **Governance Synchronization Matrix** · **Constitution Check** · 并行声明 3 项 · 追溯表 FR 列与 Command·oracle 列
**C. tasks-template**：**UI 字段组** · 任务卡机器字段（versioned_refs/design_state/boundary）· **Final Boundary Check**

---

## 第 3 部分：新结构缺失项清单（重点）

> 判定枚举：`合理（有替代承接）` / `不合理（真缺口）` / `需用户裁决`。
> **统计：30 项 —— 合理 11 / 不合理 4 / 需用户裁决 15。**

| ID | 它是什么（旧模板 + 原文摘录） | 在旧模板里起什么作用 | 缺了会怎样（具体后果） | 判定 + 理由 |
|---|---|---|---|---|
| G-01 | **PFACT 产品事实与假设层**（spec §4，L74-89）：「**status**：`verified` / `inferred` / `unknown` / `not_applicable`」「**证据或来源**…**不适用理由**…**关联**：FR ID、AC ID」＋「PFACT、FR、AC…必须直接满足 `spec-content.v3`。生成结果会原样交给严格 `spec-analyze`」 | 把「已核实事实 / 推断 / 未知 / 不适用」从主观叙述降为可核对状态；是 spec 与严格 spec-analyze 的机器接口 | ①「推断」会被当「已核实」写进 spec，K1 的「未溯源回退」失效；②`spec-analyze`（K7，D-009 保留）失去输入契约，跨材料语义一致性检查无判定基准；③`unknown` 与 RISK/OPEN 的强制关联断裂 | **需用户裁决**：新结构主干第 6 节可容 `unknown`，但**事实层状态机与 schema 契约是 spec-content.v3 的现行系统合同**，废除与否须用户明示（涉及 D-009 K7 的存续） |
| G-02 | **场景与状态覆盖矩阵（八态）**（spec §3，L63-72）：「默认态 / 空态 / 错误态 / 加载态 / 取消态 / 边界态 / 权限态 / 竞态 —— 每态写 SCN ID / N/A — 理由」 | 强制 happy-path 之外的失败/取消/权限/竞态状态被设计；是 **K4** 的载体，也是 R-G 引用的「Scenario 方法显著更好」证据的落点 | 只写 happy path；下游 build-code 边写边猜；`spec-analyze` 无法发现状态漏设计；**K4 在 K1–K12 中无承接者**（D-009 裁定 K1–K12 全部必须保留并逐条指派承接者） | **不合理（真缺口）**：K4 是 user-confirmed 的必须保留质量核心；新结构主干第 5 节只说「场景化验收」，**没有任何八态枚举**，无替代承接者。最小修复：主干第 5 节保留八态清单，或在附件 A 增加「状态覆盖」列 |
| G-03 | **关键实体**（spec §7，L118-125）：「定义 / 字段和约束 / 关系」 | 只写影响行为的业务字段与关系，防止下游自造数据模型 | spec 作为「实现设计权威」（REQ-K-08：架构取舍/全局依赖/验证策略）**没有了数据模型唯一落点**；plan/tasks 已删、phase 只写差异 → 实体模型无处安放，下游各自发明 | **需用户裁决**：可迁往 phase 文档（R-B §8 骨架「3 边界与错误」弱覆盖）或作为主干第 4 节切片内声明；两条路都需用户明确，否则「一事实一权威」在数据模型上失守 |
| G-04 | **数据和生命周期**（spec §8，L127-136）：「数据粒度 / 数据时效 / 缺失或迟到 / 预览与正式 / 当前与历史 / 归属与清理」 | 数据驱动需求必须填；不涉及时写 `N/A — 理由` | 数据时效、补传、预览与正式状态、历史保留、清理归属全部无落点；下游按错误数据语义实现 | **需用户裁决**：与新结构主干第 4 节切片无自然映射；若判定为「phase 文档字段」，须在 phase 模板里显式列出（现存 R-B §8 骨架无此字段） |
| G-05 | **兼容性预留**（spec §9，L138-146）：「既有消费方 / 命名预留 / 容器预留 / 状态预留 / 扩展边界」 | 分阶段交付时防止堵死后续版本 | 分阶段交付时后续版本被命名/结构/状态取值堵死；「本期预留什么、不承诺什么」无从核对 | **需用户裁决**：主干第 2 节「非目标/不做清单」只覆盖「不做什么」，不覆盖「预留什么」 |
| G-06 | **业务影响与回归范围**（spec §13，L188-198）：「既有行为 / 本需求影响 / **回归路径** / 验收 / 可能受冲击的业务规则 / 明确无影响」 | 声明影响面与必须重新走通的业务流程；是 verify-code「受影响回归验收」的输入（REQ-B-14、SD-07④） | ①**U-001#2 明确要求 phase 文档含「影响范围」**，该字段在 spec 层与新 phase 层都无落点；②「明确无影响」的已核实声明消失，回归范围无法界定；③REQ-D-10「只引用不复制」的对照面之一缺失 | **不合理（真缺口）**：U-001#2 逐字要求「影响范围」，母 PRD SD-07④ 要求 verify-code 做「受影响回归验收」，两者都需要这个字段；新结构无任何替代承接者 |
| G-07 | **验收标准的四段式/黑名单/证据类型/V1V2V3 物理分离**（spec §11，L160-169）：「**验证方法** / **通过条件** / **失败条件** / **证据类型**：`test`/`evidence`/`manual`」；D-005（T-006 用户已裁定）「四段式（条件→行为→可度量标准→失败场景）+ 不可判定词黑名单 + V0 禁入 + V1 人工条目须与 V2/V3 机器条目物理分离」 | 把「不可判定」从主观判断降为字符串命中；防止 AC 写成口号；防止人工条目与机器条目混写导致一并自报通过 | ①**T-006 是用户逐字裁定的决定**，新结构主干第 5 节「场景化验收 + 可执行判据」未写四段式/黑名单/V0，**已裁定的验收格式失去结构位**；②「证据类型」消失 → verify-code 无证据分类输入；③人工/机器条目混写（D-005 风险已登记） | **不合理（真缺口）**：T-006/D-005 是 user_confirmed 决定，`AC-07` 还要求「验收标准条目满足可执行形式（条件→行为+可度量标准+≥1 失败场景）」；新结构只有一句「可执行判据」，**无替代承接者**。最小修复：主干第 5 节四段式 + 附件 A「验收判据」列固定四段式，黑名单与 V0 写入主干第 5 节的 MUST 句 |
| G-08 | **FR 中间层与稳定 ID**（spec §5，L91-105）：「**FR-DOMAIN-001**：一个独立、可观察、可测试的行为 —— 范围边界 / 依据 / 场景 / 验收」＋「新需求使用 `FR-DOMAIN-NNN`；每条 FR 至少连接一个 PFACT、SCN 和 AC」 | 需求翻译的**派生层**：把产品需求翻成可实现的独立行为单元，并给稳定 ID 供双向追溯 | **K2「source → FR → AC → phase/task → command/oracle 双向追溯闭环」断链**：附件 A 是 `R-ID → 切片`，附件 D 是 `R-ID → 切片`，FR 与 AC 段消失；K1 的「需求翻译完整性」没有翻译对象；`spec-analyze`（K7）失去 FR 层对照 | **需用户裁决**：两种可能——①切片（seam）**即** FR 层（则可判定为「换地方」）；②切片是交付单元、FR 是行为单元，两者不等价（则真缺）。**须用户明确「切片是否充当 FR」**，否则 K2 的闭环无法声称成立 |
| G-09 | **RISK 的结构化六字段**（spec §12，L173-179）：「受影响 ID / **触发条件** / 后果 / 缓解或 STOP / **处理 Stage** / **验证**」 | 风险可登记、可指派阶段、可验证是否已处理；`处理 Stage` 枚举横跨 make-decision/build-spec/build-plan/build-code/verify-code | 附件 C 只收**未决**（ID/消除条件/责任人/期限），**风险无结构化附件**；「处理 Stage」无落点（且 `build-spec` 已取消，枚举本身须改）；风险与未决混在主干第 6 节一条叙事里，无法逐条核对 | **需用户裁决**：主干第 6 节「未决**与风险**」可在叙事层承载，但结构化风险表（可解析、可检查）无落点；若接受「风险只叙事」，须明确它与「无遗漏」目标的关系 |
| G-10 | **spec 元数据头**（spec L5-7）：「功能名 / 来源 / **状态**（草稿 / 已接受 / 已替换）」 | 标识 spec 的来源与生命周期状态 | 「已替换」语义消失 → 被取代的 spec 无法标记；「来源」在附录可承（部分）；功能名并入主标题 | **需用户裁决**：`状态` 字段与 append-only/supersession 纪律相关（V-05），新结构未提 |
| G-11 | **Technical Context / Global Constraints**（plan L26-37）：「Verified facts / Language·runtime / Primary dependencies / Storage·state / Testing / Target environment / Scale·scope / Unresolved facts」 | 全局技术事实与约束的单一落点，防止下游自造运行环境假设 | **语言·运行时、存储·状态边界、目标环境与兼容范围、规模范围**四类无落点；下游（弱模型）按错误环境假设实现 | **需用户裁决**：主干第 3 节「关键约束内嵌」可承「Verified facts/Testing」，附件 B 可承「Primary dependencies」，**其余四类无替代承接者** |
| G-12 | **Code Anchors**（plan L39-45）：「Verified anchors / Existing interfaces / **Read now** / **Must read before task** / **Context mode：Lite·Full·N/A**」 | 控制设计期与执行期的读取量（上下文成本控制，与 U-009#1「减少自动压缩次数」同源） | 主干第 4 节可承「精确路径/符号」；**Context mode 这一上下文预算字段无落点**；「Must read before task」的延迟读取纪律消失 | **需用户裁决**：Context mode 与 U-009#1/U-002 的上下文控制要求直接相关，须指明替代（phase 文档字段？） |
| G-13 | **File Boundary 的 DO NOT TOUCH**（plan L112-114）：「**DO NOT TOUCH**：精确保护文件路径及理由」 | 禁改边界（预写测试/打分代码冻结，T-007）；**K9「NEW/MODIFY/DO NOT TOUCH 精确三清单，禁通配，phase/卡边界逐级子集」** 的载体 | 附件 B 只有「切片→文件→依赖」＝NEW/MODIFY；**禁改清单无落点** → 预写测试可被静默放宽（T-007/R-6 已登记该风险）；V-12「oracle 与实现者分离」失去执行面 | **不合理（真缺口）**：K9 是必须保留的质量核心，D-007/T-039 又把「预写测试被修改」列为审查自检清单第 3 条——**没有 DO NOT TOUCH 就无法判定该条**。最小修复：附件 B 增「禁改」列，或主干第 4 节每片固定「不做/禁改」两栏 |
| G-14 | **Technical Decisions 的 F10 五字段**（plan L126-130）：「F10 real threat / F10 existing cover / F10 bypassable / F10 maintenance cost / F10 disposition（keep·simplify·remove）」 | 宪法 F10（新增控制面/重复控制面）的逐条检查面；「不得只换存放位置」（V-23）的落地字段 | 新增/改造控制面时无「真实威胁 / 已有覆盖 / 可绕过 / 维护成本 / 处置」的强制自检；**V-23「每项新增规则须有当前缺陷或用户结果理由」失去结构化落点**（D-009 ⑦ 明确要求改造项逐项写明理由） | **需用户裁决**：可迁到阶段检查步骤或审查自检清单；但新结构与本提案都未指定 |
| G-15 | **Test Strategy 表 + 测试路由判类**（plan L132-144；tasks L58、L143、L187）：「Target / Task / Role / gate_cmd·expected_exit / Oracle·evidence_path」＋「test tier / test method：simple·feature·fullstack」 | RED/GREEN 可证伪对（K9）与测试蓝图/路由（K10）的载体；「同 gate_cmd、同 oracle identity」纪律 | 若由 phase 文档承接则不缺；新结构主干第 5 节「可执行判据」+ phase 文档可承 | **合理（有替代承接）**：替代承接者＝`testing-system-blueprint`（K10 蓝图）+ `test-routing-advisor`（simple/feature/fullstack 判类）+ phase 文档任务卡（gate_cmd/oracle/evidence_path）。须在 phase 模板里逐字保留「同一 gate_cmd、同一 oracle」纪律 |
| G-16 | **UI Delivery Contract + Design-gap handoff**（plan L76-100，共 22 个字段） | UI 任务的契约面：真实消费者、状态所有者、typed ViewModel、CSS/token owner、fixture/viewport、browser/a11y/perf、截图交接、design-gap 交接 | 非 UI 任务可 `N/A`，但**模板必须能承载 UI 任务**；MERGE **R-52** 明确要求「`frontend-prototype-render` 须显式纳入 UI 路径，否则能力静默丢失」；**K4 还要求 UI 每态另记 responsive/a11y** | **需用户裁决**：新结构无 UI 位；若判定「UI 面只在 phase 文档」，须在 phase 模板显式保留这 22 字段并绑定 K4 的 responsive/a11y |
| G-17 | **Rollback and Recovery**（plan L146-151）：「Global recovery rule（只回滚当前实现，保留四份材料）/ **Irreversible boundaries（需明确授权的 commit·push·merge·archive·cleanup）** / Recovery owner」 | 回滚边界与不可逆授权（宪法级第二道人为门，SD-17①） | 主干第 6 节可承「Recovery owner」；**「不可逆边界」清单无落点** → 不可逆动作的授权前置失去显式声明 | **需用户裁决**：主干第 3 节 MUST 内嵌句可承（「commit/push 须逐次授权」），但这不是结构位而是任意性叙事，可核对性下降 |
| G-18 | **Governance Synchronization Matrix**（plan L178-182）：Governance surface / Actual files / Change·no change / Task IDs / Reason | 治理面（宪法/技能/测试/文档）的同步义务表；**AGENTS.md 要求「新增文件必须先登记职责和消费者」**、**REQ-P-04/MERGE 要求同步 skill-bundle/catalog/move-map 声明哈希** | 新增/改造技能与模板时的治理同步无落点；AGENTS.md「本任务新增控制面登记」（owner/consumer/删除条件）无强制表 | **需用户裁决**：可归 build-plan 阶段步骤的登记义务，但新结构未指定落点 |
| G-19 | **Constitution Check**（plan L184-208）：binding JSON（ref/hash/id/version/clause_count=22）+ F1–F11 + Q1–Q3 + S1–S8 逐条事实与证据 | 宪法逐条对照（CLAUDE.md 硬规则「任何改动须符合宪法，并用 constitution-checklist.md 逐条对照」） | 宪法逐条检查在新结构无落点；只剩主干第 3 节的 MUST/SHOULD 句 | **需用户裁决**：宪法检查本应是**阶段步骤**（属 build-plan 的检查动作）而非 spec 文档字段；但 MERGE 的 13 步清单里**没有显式宪法检查步**，替代承接者未证实 → 须用户/后续设计确认 |
| G-20 | **材料导航（M/S/B/P 读取时机表）**（plan L6-15；tasks L6-15） | 让不同执行者（主会话/子代理/后台/并行）知道何时读哪份材料的哪一节 | 大材料下读取时机无指引 | **合理（有替代承接）**：MERGE「消失的行为/载体」D5 主动删除「三份材料各写一遍的材料导航表」；替代＝**紧凑索引**（T-014 纯指针表）＋**附件 D 覆盖指针** |
| G-21 | **并行/写集/依赖的完整声明**（plan L166-170；V-18 要求「读集、写集、文件 owner、接口符号清单、合并责任」五项） | ①合并审查的 plan 质量核心之一（「依赖正确/并行声明/写集」）；并行事实记录 | 附件 B 只落「写集 + 依赖」2 项，缺读集/文件 owner/接口符号清单/合并责任 3 项（V-18 第 8 项「未声明或不实＝验收失败事实」也无落点） | **合理（有替代承接）**：**T-038 明确裁定「本卡保持现状（写集+依赖），扩项归 CARD-03」并登记该不完整（R-45）**；替代承接者＝CARD-03 + R-45 登记 + ①合并审查的现有核对面 |
| G-22 | **任务卡 30 字段**（tasks L31-202）：含 `design_state`、`boundary（files + symbols/regions）`、`paired_task`、`verification_role`、`recovery`、`task risk`、`fixtures_services`、`coverage limits` | 可执行任务边界、RED/GREEN 配对、失败恢复；K9/K10 的执行面 | 新结构只定义 spec，未定义 phase 任务卡 → 这些字段暂无结构位 | **合理（有替代承接）**：替代承接者＝**phase 文档**，MERGE 5.1 步骤 6 明写 `spec-plan` 产出「单一 phase 差异文档（**含任务卡**：Goal/Files/AC/FR/RED-GREEN/命令/oracle/证据/STOP/rollback + 写集/依赖声明 + 双向追溯 + 文件边界三清单）」 |
| G-23 | **执行状态填写区（唯一完成权威）**（tasks L104-114 等）：任务完成 checkbox / status / actual_changes / executed_commands / evidence_refs / covered_ac / review_fact / completed_at / 执行事实 | 任务完成的唯一权威记录（执行事实不冒充规划） | 新结构无执行状态位 | **合理（有替代承接）**：替代承接者＝**phase 文档完成区** ＋ 任务事实层（`facts.jsonl`）；AGENTS.md vNext 边界「build-code、verify-code 只消费同一份材料和 task facts」同向 |
| G-24 | **Delivery contract fields**（tasks L63-90）：`acceptance_role` / `ui_scope` / `acceptance_data JSON` / `e2e_scope` / `e2e_decision_refs` / `high_risk_fact JSON` / 逐 AC `entries[].assertions` 输出契约 / `versioned_refs` | 真实验收的执行绑定与机器可解析输出 | 部分字段属**主动删除对象** | **合理（有替代承接）**：MERGE「消失的行为/载体」明确删除 `hash/snapshot/revision/receipt` 校验机器、`<sha256>` 命名、**`versioned_refs`、`material_fingerprint`、`acceptance_data` JSON**（D2/D3/D5；OI-013）；`ui_scope`/`acceptance_role` 归 phase 模板 |
| G-25 | **§4 Final current-snapshot aggregate strategy**（tasks L230-241）：tier·method / scenarios / command / oracle / fixtures_services / evidence_path / coverage limits / STOP / execution_contract（跑一次、复用 canonical receipts、超时记 incomplete、不全量重跑） | 最终聚合验收策略；「不全量回归」「不重跑掩盖局部失败」纪律 | 新结构只到 spec；无最终聚合位 | **合理（有替代承接）**：替代＝phase 文档 Verify ＋ 主干第 5 节 ＋ K10 测试蓝图；「不全量重跑」纪律与 AGENTS.md 测试硬规则同源，须在 phase 模板保留 |
| G-26 | **Final Boundary Check**（tasks L253-259）5 条勾选 | 产出物自检清单；「review/test/evidence 是事实不是许可证」的显式声明 | 自检清单无落点 | **需用户裁决**：可归 ①合并审查 checklist 或 phase 文档收尾节；须指定，否则「事实不是许可证」只剩共享定义而无逐项核对 |
| G-27 | **追溯表的 FR 列与 Command·oracle 列**（plan L172-176） | 双向追溯闭合与命令/oracle 绑定 | Command·oracle 可迁 phase 任务卡；FR 列见 G-08 | **合理（有替代承接）**：Command·oracle → phase 任务卡（`gate_cmd`/`oracle`/`evidence_path`）；**FR 列见 G-08（需用户裁决）** |
| G-28 | **spec 定位声明「不写文件路径、代码符号或工程命令」**（spec L3） | 早期把 spec 限在产品层，防止 spec 变成实现文档 | — | **合理（方向反转，非缺）**：U-001#1「spec 是把 decision-log 进行完整的实现所进行的翻译…含**架构方案**」＋REQ-D-03/REQ-D-10/REQ-K-08「spec＝实现设计权威（架构取舍、全局依赖、验证策略）」＋新结构主干第 4 节每片声明**写集**（文件）→ 旧定位已被用户逐字推翻 |
| G-29 | **「精确命令和工程 oracle 留给 plan/tasks」**（spec L169） | 产品层 spec 与工程层 plan/tasks 的分工声明 | plan/tasks 双写已删（FR-09/AC-09），该分工句失效 | **合理（有替代承接）**：替代承接者＝**phase 文档任务卡**（`gate_cmd`/`expected_exit`/`oracle`/`evidence_path`，MERGE 5.1 步骤 6） |
| G-30 | **Implementation Order**（plan L162-164） | producer-before-consumer 顺序与串行原因 | 顺序无单一落点 | **合理（有替代承接）**：替代＝附件 B「切片→文件→**依赖**」＋ 紧凑索引（T-014 汇总全局并行视图）＋ phase 文档执行顺序 |

---

## 第 4 部分：反向缺失（新结构有、旧模板无）

> **统计：16 项。** 每项给出对 `spec-specify` / `spec-plan` / `spec-tasks` 的含义（改造量见第 6 部分）。

| ID | 新结构要求 | 旧模板现状（逐条核对） | 对现有技能意味着什么 |
|---|---|---|---|
| N-01 | **叙事主干（有序论证链，≤3 页，人从头读到尾）** | spec-template 是 13 个**并列容器**（L31 起）；plan-template 是 22 个**参数表并列块**；两者都无「从头读到尾」的论证链 | `spec-specify` 须**重写骨架**（并列节 → 有序论证链）；这是最大的单项改造 |
| N-02 | **开头用「一个具体故事」** | 旧 §1「从用户视角说明麻烦、现有方式为何不够」（L33）＝抽象陈述；无「故事」要求 | `spec-specify` 生成规则须新增「具体故事」必填语义与判据（否则仍会写成抽象陈述） |
| N-03 | **主干第 2 节含「预算」** | 旧模板无任何预算字段（且 T-018 明确**不设任何长度数值目标**） | **张力**：新结构「预算」与 T-018/D-004「不设任何长度数值目标（硬或软）」冲突；须澄清「预算」＝什么（读取预算？切片数预算？） |
| N-04 | **主干第 3 节＝被否方案与取舍（spec 层）** | spec-template **完全没有**被否方案字段（无 Options/Rejected）；只有 plan-template DEC-001 的 `Options`/`Reason`/`Fallback`（L121-125）与 `rejected_alternatives`（在 decision-log 块内） | 被否方案**从 plan 层升格为 spec 主干第 3 节**（R-G：「被否方案从附录升格为主干第 3 节」）→ `spec-specify` 增职责；同时 plan 的 DEC-001 字段需并入 spec 或下沉 phase |
| N-05 | **关键约束（MUST/SHOULD）内嵌在相关句子里，不单设「硬约束」节** | plan-template 有独立的 `### Global Constraints`（L28）；spec-template 的「默认必须成立」是独立小节（L156） | 须**取消独立约束节**并把约束打散进主干第 3/4 节 → `spec-plan` 的 Global Constraints 节被拆解，检查面（如何核对「所有 MUST 都出现」）需新建 |
| N-06 | **第 4 节按切片（seam）分小节；每片＝被隐藏的决策 + 与既有部分的交互 + 写集/依赖/不做** | 旧模板按「模块职责」（spec §6）/「Solution Design + Module responsibilities」（plan）或按文件边界三清单组织；**无「切片」概念、无「被隐藏的决策」概念** | `spec-specify` 与 `spec-plan` 的分节轴都要换成切片轴；「被隐藏的决策」需要新的生成规则与质量判据（如何判定「这片是否真的隐藏了一个决策」） |
| N-07 | **第 5 节＝场景化验收（Scenario 方法）** | spec-template 有 SCN Given/When/Then（§3）**与**独立 AC 表（§11）两处；新结构把两者合并为单一验收轴 | 两处合并需处理「SCN 与 AC 谁权威」；`spec-specify` 的 §3/§11 结构调整为单节 |
| N-08 | **未决每条带「消除条件 / 责任人 / **期限**」** | spec §12 OPEN-01 有 owner 与「关闭条件或 STOP」（L183-186），**无期限**；plan/tasks 无期限字段 | `spec-specify` 增「期限」必填；须定义期限的语义（日期？触发条件？「不设期限」怎么写） |
| N-09 | **契约附件 A/B/C/D 四件（结构化、可解析、单一事实源，需要时跳转）** | 旧模板只有：spec 的「来源与决策映射」表（≈A 的一部分）、plan 的追溯表（≈A+B+D 混合）、**无独立的未决表 C**、**无纯指针 D** | `spec-specify` 需新增 4 个附件结构；`spec-plan` 的追溯表须拆成 A/B/D；`spec-tasks` 的 dependency/traceability 部分并入 B |
| N-10 | **附录：被否方案详述、来源、术语表** | 旧三模板**均无附录**；被否方案详情在 decision-log 块内；**无术语表**、**无来源附录** | `spec-specify` 新增 3 个附录节；术语表与 CONTEXT.md 的关系须定义（避免第二权威） |
| N-11 | **失效条件：附件与主干若出现同一事实的两份表述且无人检查 → 立刻停止双读，该事实只留附件、主干改指针** | 旧模板只有一条相关规则：spec §2「非目标只在第 10 节维护，避免两份真相」（L50）；**无失效条件、无降级动作、无检查机制** | `spec-specify` 与 `spec-plan` 都需新增「一致性可检查项」；R-G §11.4 已给出可脚本检查项（R-ID 孤儿、写集交集冲突、未决缺责任人或期限、**附件与主干 ID 一致性**）→ 可复用现有检查工具面（T-040 双轨判据） |
| N-12 | **末段「质疑预登记」** | 旧模板无 FAQ / 预登记概念；spec §12 只有 RISK/OPEN | `spec-specify` 新增「质疑预登记」节；须定义它与 RISK/OPEN 的区别（R-G：审查者从「想问题」变成「检查问题是否已被回答」） |
| N-13 | **「参考层回到教学层同一批例子」纪律**（Rust RFC 纪律，R-G §11.5 第 1 条） | 旧模板无教学层/参考层区分，也无「同一批例子」纪律 | `spec-specify` 新增该纪律的执行规则；须定义「教学层」在本项目中的读者角色（R-G §11.2 已点名「纯内部工具项目里可能不存在教学层读者」） |
| N-14 | **前后半分工：主干可读 + 附件可解析；「人只在需要时跳转」的读取纪律** | 旧模板无「双读」概念；plan/tasks 的「材料导航」是读取时机表但**不是**「主干/附件双读」纪律 | `spec-specify` 需新增「何时必须跳附件」的指针规则（R-G §11.4 代价项：「附件一旦被当成可选的表格，就会被跳过——需要明确什么时候必须跳附件」） |
| N-15 | **主干 ≤3 页软目标** | T-018/D-004 明确「**不设任何长度数值目标（硬或软）**」，且 T-018 取代 T-008 的软目标部分 | **直接张力**；T-048 R-58 已调和为「≤3 页是软目标，实际判据＝按切片可分节、每片可独立验证」。须以 R-58 口径写入模板，不得写成数值门 |
| N-16 | **spec 定位变更：decision-log＝方向 / spec＝设计 / phase＝工作包** | 旧体系：spec-template 自称「只写产品层，不写文件路径/代码符号/工程命令」；plan-template 承担工程方案；tasks-template 承担任务卡 | `spec-specify` 定位整体变更（产品层 → 设计层）；`spec-plan` 从「工程方案」变为「phase 差异文档 + 卡片投影」；`spec-tasks` 职责被吸收（MERGE 4.4：职责并入 `spec-plan`，保留技能文件作可搬运能力，新阶段不再双写调用） |

---

## 第 5 部分：原始需求覆盖核查（最重要）

> 筛取自输入 3 中**与 spec/plan/tasks 三种文档形态相关**的原始需求，共 **63 条**。
> 判定枚举：`满足` / `部分满足（缺什么）` / `不满足`。
> **统计：满足 14 / 部分满足 42 / 不满足 7。**

### 5.1 逐字声明层 V-01..V-28（12 条）

| 需求 ID | 来源 | 逐字原文（截断） | 新结构承接落点 | 是否满足 |
|---|---|---|---|---|
| V-01 | SD-06 / DL L825-827 | 「环境故障、配置缺失或无意义断言不算有效 RED；**纯文档等不为形式制造失败**」 | 主干第 5 节「可执行判据」；有效 RED 判据须落 phase 任务卡 | **部分满足**（缺「有效 RED 三判据」与「纯文档不制造失败」的显式字段；旧 spec/plan 亦无，属原有缺口） |
| V-02 | SD-06 / L829-831 | 「G-2…**必须显式豁免**——补一条可失败的检查，或写明豁免理由与风险并在验收中披露；**不允许直接跳过**」 | 主干第 5 节 ＋ 主干第 6 节（风险披露） | **部分满足**（缺「豁免 vs 补检查」的二选一槽位与「必须在验收中披露」的字段） |
| V-03 | SD-09 / L833-835 | 「需求保真采用逐字双层结构——**原始声明不得改写**，派生需求带 source 锚点」 | 附件 A（状态列）＋ 附录（来源）＋ 主干 | **部分满足**（新结构无「原始声明层」概念；逐字层留在 decision-log，附件 A 无 source 锚点列） |
| V-04 | SD-09 / L837-839 | 「结论分三档：**接受 / 接受但有偏离 / 拒绝**；偏离必须写明**改了什么、为什么**；原话一改，派生项**标记待复核**」 | 附件 A「状态」列 | **部分满足**（三档枚举、「改了什么+为什么」、「待复核」标记均未在附件 A 字段中写明） |
| V-10 | AC-07/AC-08/oracle/验收依赖 / L862-867 | 「条件=抽一个**真实实施 task** 的 spec.md」…「**验收依赖**：一个真实 task 样例」 | 主干第 5 节（场景化验收） | **部分满足**（T-041 已裁定「卡内造最小真实 fixture task」；新结构无「验收样例来源」字段，抽取对象与「多 phase」要求无结构位） |
| V-11 | FR-20/SD-15/AC-26 / L869-872 | 「不适用时记 N/A+reason；「缺**不适用**产物」不得判失败，「缺**适用**产物或**伪造**产物」仍判失败」＋「任一为**模拟或脚本自证**，即失败」 | 主干第 5 节（可执行判据） | **部分满足**（缺 N/A+reason 槽位、缺「伪造判失败」与「脚本自证即失败」的反例判据字段） |
| V-12 | FR-17/AC-17 / L874-877 | 「验收 oracle 与实现者分离——**测试目录对实现者只读或隐藏**」 | phase 文档（DO NOT TOUCH）——**新结构无落点** | **部分满足**（见 G-13：DO NOT TOUCH 无落点 → 该分离无法判定） |
| V-18 | 方向契约/OI-012 / L899-901 | 「每个并行工作包在 build-plan 声明**读集、写集、文件 owner、接口符号清单、合并责任**…未声明或声明不实…=**验收失败事实**」 | 附件 B（切片→文件→依赖） | **部分满足**（只落 2/5；T-038 裁定扩项归 CARD-03 并登记 R-45） |
| V-20 | 定位代价 / L907-909 | 「方法工具包不再承诺机器认证阶段完成、跨会话证据链或自动判断全部证据过期…**不假称纯技能提供同等机器保证**」 | **无落点** | **不满足**（D-008 ⑤ 要求写入 spec；新 spec 结构无该声明位；旧 spec-template 亦无，属 D-008 新增需求） |
| V-23 | 母 PRD/控制面纪律 / L922-925 | 「**每项新增规则必须给出当前缺陷或用户结果理由**，不得只换存放位置」 | 主干第 3 节（取舍）；**无强制字段** | **部分满足**（可叙事承载，但无「逐项理由」的可核对结构；D-009 ⑦ 要求改造项逐项写明） |
| V-25 | CARD-02 原文 / L931-934 | 「无 PRD 的普通任务：**精简 spec 引用用户原始需求与 decision-log 产品事实**」＋「**不得把实现方便性写成用户已批准的新需求**」 | 附件 A（R-ID 来源）＋ 附录（来源） | **部分满足**（禁令句无落点；「精简」无判据） |
| V-27 | 用户原始要求 / L940-943 | 「不能修复时可**停止并交接未完成事实**，不能用 review unavailable 替失败开脱」＋「**质量事实**：不宣称测试通过、审查完成…**物理动作及授权**：不宣称已交付」 | **无落点** | **不满足**（D-006 ⑥ 已裁定把披露纪律写进材料；新 spec 结构无披露节，旧三模板亦无） |

### 5.2 质量核心 K1–K12（12 条，逐条）

| 需求 ID | 来源（I-B §4 ＋ V-28） | 逐字原文（截断） | 新结构承接落点 | 是否满足 |
|---|---|---|---|---|
| K1 | I-B L216 | 「每条新增/变更 FR/AC 绑定 `R*/D*` 与 `source_status`；**没有来源的需求必须回 make-decision**；spec 不发明产品方向」 | 附件 A（R-ID/状态）＋ 附录（来源） | **部分满足**（缺 `source_status` 字段与「未溯源回退 make-decision」规则；且 FR 层缺失，见 G-08） |
| K2 | I-B L217 | 「`source → FR → AC → phase/task → command/oracle/evidence` 双向映射， orphan 任务是 finding」 | 附件 A（R-ID→切片）＋ B（切片→文件/依赖）＋ D（R-ID→切片） | **部分满足**（**FR 与 AC 段断链**；附件 D 只到切片，不到 phase/task/command/oracle） |
| K3 | I-B L218 | 「每个 AC 固定 `验证：/通过：/失败：/证据：` 四标签，正文非空，禁 TBD/TODO/待填写」 | 主干第 5 节 ＋ 附件 A「验收判据」 | **部分满足**（缺四标签与禁占位符约束；见 G-07） |
| K4 | I-B L219 | 「默认/空/错误/加载/取消/边界/权限/竞态八态，每态关联 SCN 或 `N/A — reason`；UI 每态另记 responsive/a11y」 | **无落点** | **不满足**（新结构主干第 5 节无八态枚举；无替代承接者） |
| K5 | I-B L220 | 「一批独立问题、每问一轴、2–3 互斥选项含后果与风险与推荐；发卡即结束调用，必须真实 `ask→wait→reply→resume`；十维度查缺」 | 非 spec 模板面：`spec-clarify` 技能（MERGE 步骤 3） | **满足**（skill/步骤承接，属交互技能而非文档结构；T-005 已裁定并入 build-plan） |
| K6 | I-B L221 | 「wh-review 冻结当前字节 → 一次 broker 请求 → 真实 findings + provenance；主会话逐条 `fixed/rejected_invalid/accepted_risk/needs_human`」 | 非 spec 模板面：`merged-review` 步骤 9；D-007 ④ 收敛为三态 | **满足**（技能/步骤承接；注意 D-007 把四态收敛为 `fixed / 拒绝并写理由 / needs_human`） |
| K7 | I-B L222 | 「严格 report-only 检查原始需求/decision-log/spec/plan/tasks 的语义一致、**DEFER/OPEN 四要素闭环**、每个 task oracle、流程/状态/边界/非目标覆盖」 | 附件 A/B/C/D 结构化 ＋ 附件 C 四要素（ID/消除条件/责任人/期限） | **满足**（附件 C 恰好就是 DEFER/OPEN 四要素闭环的载体；但**状态/边界覆盖**因 G-02 八态缺失而不完整 → 仍标「满足（DEFER/OPEN 面）」，整体见 K4） |
| K8 | I-B L223 | 「四阶梯 YAGNI 删减；工程边界/失败模式/RED-GREEN/接口消费者检查；UI 状态/无障碍/响应式检查；方向/前提/替代检查」 | 非 spec 模板面：`merged-review` packet lens（MERGE 步骤 9） | **满足**（技能承接；T-043/D-009 保留） |
| K9 | I-B L224 | 「同一 `gate_cmd`/同一 oracle 的 RED→GREEN…`NEW/MODIFY/DO NOT TOUCH` 精确三清单，禁通配，phase/卡边界逐级子集」 | 附件 B（切片→文件→依赖）——**只有 NEW/MODIFY** | **部分满足**（DO NOT TOUCH 无落点＝G-13；RED/GREEN 对落 phase 任务卡） |
| K10 | I-B L225 | 「每个行为 phase 设计风险维度/场景/oracle/证据路径/覆盖限制；按真实改动判 simple/feature/fullstack」 | 非 spec 模板面：`testing-system-blueprint` ＋ `test-routing-advisor`（MERGE 步骤 7/8）＋ phase 任务卡 | **满足**（技能承接；MERGE 明确「保留」） |
| K11 | I-B L226 | 「读 steps.json manifest，逐项报告执行状态/产物存在性/完成判据…六区块复盘绑定 evidence_refs 与 confidence」 | 非 spec 模板面：`stage-reflection` ＋ 阶段内联协议（MERGE 4.2） | **满足**（部分覆盖，替代承接者明确；K11 保留为阶段收尾事实） |
| K12 | I-B L227 | 「build-plan 完成后大白话展示，取得用户真实回复并记录为人类对齐事实；不自动越过人做不可逆动作」 | 非 spec 模板面：阶段内联协议 ＋ handler consumer（MERGE 4.2） | **满足**（替代承接者明确） |

### 5.3 本卡 T 决策中支撑新结构的条（7 条）

| 需求 ID | 来源 | 逐字原文（截断） | 新结构承接落点 | 是否满足 |
|---|---|---|---|---|
| T-006 | DL L555-564 / D-005 | 「四段式（条件→行为→可度量标准→失败场景）+ 不可判定词黑名单」＋「V0…条目禁止入库」＋「V1（人工）/V2（机器）/V3（机器+存量）分级细化留 build-plan」＋「V1 人工条目须与 V2/V3 机器条目**物理分离**」 | 主干第 5 节 ＋ 附件 A「验收判据」 | **部分满足**（见 G-07：四段式/黑名单/V0/V1V2V3 分离在新结构中均无显式位） |
| T-017 | DL L677-702 / D-003 | phase 文档三层混合：**L0 目标/理由/非目标（永不删）· L1 接口契约+不变量+错误语义+可执行验收+不可逆确认门 · L2 参考步骤（每步 ≤6 行，至少一行可验证判据，带过期条件）** | **新结构未定义 phase**（R-G §11.4「不预设 phase 内部写法」） | **部分满足**（新结构承诺「只保证 phase 的边界与判据在 spec 里可见」；L0/L1/L2 三层须由 phase 模板承接，当前无模板） |
| T-026 | DL L799-808 / D-011 | 保真四规则：逐字双层 / 三档结论 / 强度校验（三问）/ 待复核；＋五条防压缩判据 | 附件 A「状态」列 ＋ 附录「来源」 | **部分满足**（四规则与五条判据在新结构中只落「状态」一列；「强度校验三问」无落点） |
| T-035 | DL L1167-1172 | 「本卡只定义测试流程的**结构要求**（写进 spec/phase 模板的字段：**测试标准、RED/GREEN、路由、证据**）」（用户裁定） | 主干第 5 节（可执行判据）＋ phase 模板 | **部分满足**（新 spec 结构无「测试标准」独立位；四个字段必须落 phase 模板，当前模板未造） |
| T-040 | DL L1212-1221 / D-008 | 双轨判据：轨 1 ID 定义唯一性；轨 2 四类事实人工核对+抽样；度量恢复「**0 处**两个文件对同一事实各自声明权威」 | 非 spec 模板面：检查工具（`check-*`） | **满足**（工具面承接，属 D-008） |
| T-041 | DL L1223-1232 / D-006 | 「**卡内造一个最小真实样例（fixture task）**，按新格式产出该样例的 spec.md 与 phase 文档（至少含 2 个 phase）」 | 非 spec 模板面：fixture 交付物 | **满足**（交付物面承接；注意它同时意味着 spec 模板与 phase 模板都要被真实使用一次） |
| T-043 | DL L1244-1263 / D-009 | 合并账：「净新增 0 步／28→13／真正新建最小集=空集／交付物＝新的 13 步 build-plan + **6–8 个现有技能改造** + **1 份模板合并（plan-template 吸收 tasks-template）** + 3 个阶段文件」 | 非 spec 结构面，但**直接决定模板改造路径** | **满足**（与第 6 部分改造量建议一致：不新建第三份模板，改造现有 plan/template） |

### 5.4 U-001 / U-002 用户原文要求（9 条）

| 需求 ID | 来源 | 逐字原文（截断） | 新结构承接落点 | 是否满足 |
|---|---|---|---|---|
| REQ-I-02 | 规划 DL L49 U-001#1 | 「spec 文档需要包含更标准的**需求文档、验收流程、测试标准、架构方案**等，相当于 spec 文档是把 decision-log 进行完整的实现所进行的翻译」 | 需求文档→附件 A；验收流程→主干第 5 节；测试标准→主干第 5 节/phase；架构方案→主干第 4 节 | **部分满足**（**四件内容未在结构上显式命名**；「把 decision-log 完整实现所进行的翻译」这一属性无判据） |
| REQ-I-03 | 规划 DL L49 U-001#1 | 「需要结构更清晰、内容更清楚、验收更明确」 | 主干有序论证链 ＋ 主干第 5 节 ＋ 附件 | **满足**（结构轴从并列容器改为论证链 = 直接回应「结构更清晰」） |
| REQ-I-04 | 规划 DL L49 U-001#1 | 「避免出现所有 phase 做完了，但是一次真实测试验收都没做过，一直在用脚本验收，功能实现的完全不合理」 | 主干第 5 节（可执行判据）＋ phase 验收 | **部分满足**（新 spec 结构无「真实验收 vs 脚本验收」的判据槽位；该禁令须在 phase/审查面落地） |
| REQ-I-05 | 规划 DL L50 U-001#2 | 「plan 去除…而是每一个 phase 一个实现文档，里面要写清楚**背景、方案、流程、影响范围、测试标准、验收流程**等等」 | phase 文档（形态未定） | **部分满足**（删除 plan/tasks 的前提成立；**六项内容在新结构中无落点**，须由 phase 模板承接；且「影响范围」在 spec 层亦无落点＝G-06） |
| REQ-I-07 | 规划 DL L50 U-001#2 | 「一个 phase 一个文档也能避免 agent 上下文爆炸」 | 主干 ≤3 页 ＋ 附件「需要时跳转」 | **满足**（R-G §11.4 直接以「主干短 + 附件不占阅读路径 + 避免 split-attention」回应；且 U-009#1「减少自动压缩次数」同向） |
| REQ-I-19 | 规划 DL L56 U-001#8 | 「有一点问题，agent 就搞一大堆严格验收、新对象、新标准、新流程…」 | 主干失效条件（降级/升格路径）＋ T-043 净新增 0 | **部分满足**（新结构的失效条件表是收敛机制；但「不新增新标准」本身无硬约束字段 → V-23 的 G-14 同源） |
| REQ-K-09 | 规划 DL L636 | 无 PRD 普通任务「精简 spec 引用用户原始需求和 decision-log 中的产品事实，再承接必要目标说明与实现设计；**不得把实现方便性写成用户已批准的新需求**」 | 附件 A（R-ID）＋ 附录（来源） | **部分满足**（禁令无落点；见 V-25/G 系列） |
| REQ-K-11 | 规划 DL L638 | 「删除 plan.md/tasks.md 双写及其相等性协议。产品目标改变回到其唯一权威更新…**包内不能另写相冲突版本**」 | 双写删除（方向一致）＋ 主干失效条件 | **部分满足**（「包内不能另写相冲突版本」缺可检查判据；新结构只处理「附件 vs 主干」，未处理「phase 包 vs 全局」） |
| REQ-K-12 | 规划 DL L639 | 「有 PRD 时产品权威在 PRD，spec 只管实现设计；**不是 PRD 与 spec 同时管同一需求**」 | 主干一事实一权威 ＋ 附件 D 纯指针 | **满足**（新结构「只放指针，不复制正文」＝该分层的直接落地） |

### 5.5 母 PRD CARD-02 原文（FR / AC / D）（12 条）

| 需求 ID | 来源 | 逐字原文（截断） | 新结构承接落点 | 是否满足 |
|---|---|---|---|---|
| REQ-D-03 ＋ FR-07 | prd.md L266/L271 / 逐字 | 「每个实施 task 保留单一 spec.md，由该 task 的 **build-plan 产出**…含更标准的**需求文档、验收流程、测试标准、架构方案**」（FR-07 同） | 新结构即 build-plan 产出的 spec 骨架 | **部分满足**（产出者与单一 spec 成立；**四件翻译内容未在结构中显式命名**，无「四件齐备可定位」的核对字段） |
| FR-08 | prd.md L272 / 逐字 | 「phase/工作包文档**只含本检索边界内差异 + 引用**，不复制 PRD 或 spec 完整正文；**小任务可用简短章节，不机械增加文件**」 | phase 文档（形态未定）；主干失效条件 | **部分满足**（phase 结构未定义；「小任务可用简短章节、不机械增加文件」无显式条款） |
| AC-07 | prd.md L277 / 逐字 | 「条件=抽一个**真实实施 task** 的 spec.md；行为=逐件核对四件翻译内容；度量=四件齐备且可定位到章节；验收标准条目满足可执行形式（条件→行为+可度量标准+≥1 失败场景）。失败场景=缺任一件，或 **spec 大段复制 PRD 产品需求正文**，即失败」 | 主干第 5 节（场景验收）＋ 附件 A；复制禁令**无落点** | **部分满足**（抽取对象由 T-041 fixture 承接；**四件翻译的「可定位到章节」与「不得复制 PRD 正文」两条均无结构位**） |
| AC-08 | prd.md L278 / 逐字 | 「条件=抽一个**多 phase task** 的 phase 文档…度量=每份 phase 文档只含差异/边界/依赖/自身验收 + 对全局目标的引用，无 PRD/spec 完整正文复制；**紧凑索引存在**。失败场景=任一 phase 文档为全量复制或索引缺失，即失败」 | phase 文档（形态未定）＋ 紧凑索引（T-014） | **部分满足**（新结构只定义 spec；紧凑索引在 T-014 已定「纯指针表」，但新结构未给它落点——R-G §12.2 只说附件 D 是「该索引在 spec 侧的对应物」） |
| REQ-D-10 ＋ REQ-K-08 | prd.md L268 / 规划 DL L635 | 「spec 为**实现设计权威**：仅引用 PRD/decision 中的目标，写**架构取舍、全局依赖和验证策略**，**不复制完整产品需求或重新定义验收目标**」 | 架构取舍→主干第 3 节；全局依赖→附件 B；验证策略→主干第 5 节 | **部分满足**（前三项有落点；**「不复制完整产品需求」与「不重新定义验收目标」两条禁令无落点**，且与「验收四段式在 spec 内」存在潜在张力） |
| REQ-D-11 | prd.md L268 / 逐字 | 「phase/工作包文档（只写本包**差异、边界、依赖、自身测试/验收**）」 | phase 文档（形态未定） | **部分满足**（四要素须由 phase 模板承接；新结构未定义） |
| REQ-D-13 | prd.md L268 / 逐字 | 「**无 PRD 的普通任务**：精简 spec 引用用户原始需求与 decision-log 产品事实」 | 附件 A（R-ID）＋ 附录（来源） | **部分满足**（形态未区分；无「精简」判据） |
| REQ-D-16 | prd.md L273 / 逐字 | 「小任务可用简短章节，**不机械增加文件**」 | 主干 ≤3 页软目标 ＋ 失效条件（降级为候选 A） | **部分满足**（R-G 失效条件表有「变更小（主干 <1 页即可说清）→ 只用候选 A 的 1–4 + 6，附件仅留需求登记」，是对该条的部分承接；但未写入 spec 模板的显式条款） |
| REQ-D-18 ＋ FR-10 | prd.md L274 / 逐字 | 「「无重复契约」标准被写成**可测量检查**并作为**命名交付项**交付（SD-13②）」 | 非 spec 模板面：检查工具（T-040/D-008） | **满足**（工具面承接） |
| REQ-D-23 ＋ AC-10 | prd.md L280 / 逐字 | 「AC-10：条件=产品目标发生变化；行为=只在其唯一权威文件更新，引用处随引用调整；度量=**无第二处需手工同步的副本**。失败场景=同一变更需在两份各自声明权威的文件中分别改写，即失败」 | **无落点**（新结构只做静态唯一性；失效条件只处理「附件 vs 主干」，不处理「变更传播」） | **不满足**（D-008 ⑥ 已裁定「补变更传播核对 + 一条 AC 条目」，新 spec 结构无该核对位） |
| REQ-D-29 | prd.md L286 / 逐字 | 「**spec/phase 文档模板与 CARD-03（工作方法）、CARD-04（验收写入）的衔接以接口蓝图为准**」 | 无落点（记在 D-004 ③ 的跨卡接口协调） | **部分满足**（D-004 ③ 已把 T-023 扩为「与 CARD-01+CARD-03+CARD-04 的模板衔接」，属阶段义务而非 spec 结构位） |
| REQ-D-33 | prd.md L290 / 逐字 | 「最小读取集：必需=本卡 + SD-02/SD-13 + D-001 L552-560；条件=Q6/Q17、L758-761」 | **无落点**（属阶段输入约定；新结构无读取集字段） | **不满足**（L-30 已判定「最小读取集未按母 PRD 登记」，新 spec 结构亦无该位） |

### 5.6 其余相关原始需求（11 条）

| 需求 ID | 来源 | 逐字原文（截断） | 新结构承接落点 | 是否满足 |
|---|---|---|---|---|
| REQ-K-19 | 规划 DL L658 | 「不能修复时可**停止并交接未完成事实**，不能用 review unavailable 替失败开脱」 | **无落点** | **不满足**（同 V-27；D-006 ⑥ 已裁定补登） |
| REQ-K-20 | 规划 DL L660 | 「整体功能只有从真实入口联通实跑…才可声明完成。Agent 展示**实际改动、验证结果、未验证项和风险**，用户按需抽验」 | **无落点** | **不满足**（完成宣称的「展示四项」是文档面义务，新 spec 结构无落点；旧三模板亦无） |
| REQ-B-21 ＋ B-22 | prd.md L62 / 逐字 | 「需求保真采用**逐字双层结构**——原始声明不得改写,派生需求带 source 锚点」＋「结论分三档:接受/接受但有偏离/拒绝;偏离必须写明改了什么、为什么;原话一改,派生项标记待复核」 | 附件 A「状态」 ＋ 附录「来源」 | **部分满足**（同 V-03/V-04：三档枚举、偏离说明栏、待复核标记均无字段） |
| REQ-B-25 ＋ REQ-C-05 | prd.md L70 / 逐字 | 「每个并行工作包在 build-plan 声明**读集、写集、文件 owner、接口符号清单、合并责任**,作为**事实记录**…未声明或声明不实…=**验收失败事实**」 | 附件 B（切片→文件→依赖） | **部分满足**（同 V-18；扩项归 CARD-03，R-45 已登记） |
| REQ-Q-13 | prd.md L644-645 / 逐字 | 「**停止规则**:CARD-10 通过后进入停止规则——**只有真实用户问题或真实失败才触发新一轮修改,不做猜测式流程优化**」 | **无落点**（属阶段/停止规则面，非文档结构） | **部分满足**（D-014 ② 已登记为停止规则；新 spec 结构不承接，属合理边界，但材料里无其落点） |
| REQ-Q-15 | prd.md L656-659 / 逐字 | 「**实质变化**（方向、权限、范围、设计行为、验收）须先展示前后承诺并获得真实确认，然后记录来源 revision、受影响条款/卡片与在途影响」 | **无落点**（decision-log / 变更程序面） | **部分满足**（D-014 ① 已裁定本卡补做；新 spec 结构无「受影响条款/在途影响」位） |
| REQ-E-22 | prd.md L373 / 逐字 | 「AC-26…失败场景=任一节奏点缺真实执行记录，或任一为**模拟或脚本自证**，即失败」 | 主干第 5 节（可执行判据） | **部分满足**（同 V-11；「脚本自证即失败」的反例判据无字段） |
| REQ-B-32 | prd.md L90 / 逐字 | F1–F7「定性为**过渡基线**…CARD-05/06 新路径就位后按迁移表转为只读历史或删除，**不静默留存**」 | **无落点** | **部分满足**（属迁移/删除面，非 spec 结构；L-23 已裁定补登过渡基线，落点应在 decision-log/迁移表） |
| REQ-P-01 | 规划 DL L933 | 「减少材料与证据写入量（**索引抖动的根因是文件数**，与 OI-003 删除重复证据包装一致）」 | 主干 ≤3 页 ＋ 附件「需要时跳转」＋ T-043 净新增 0 | **部分满足**（方向同向；无「文件数」指标，且新结构新增 4 个附件 + 1 份 phase 模板，文件数可能上升） |
| REQ-G-02 | prd.md L513 / 逐字 | 「各卡 AC 验收事实作为**输入引用**（存在性核对：事实存在且未漂白），不逐条复核内容，用户保留**按需抽验任何 AC 事实**的权利」 | **无落点**（属 CARD-10 套件面） | **部分满足**（D-006 ⑤ 已裁定「抽取结论不得由实现者单独宣称」；新 spec 结构无「抽验通路/定位与原文通路」位） |
| REQ-D-31 | prd.md L288 / 逐字 | 「**局部风险**：把「单一权威」做成新的刚性文档仪式（与 R-007 减阻塞目标冲突）」 | 主干失效条件 ＋ T-048 R-58（≤3 页为软目标） | **部分满足**（失效条件表是收敛机制；「避免刚性仪式的具体方式」尚未写入 spec 结构） |

### 5.7 覆盖核查结论（最重要的一段）

**满足 14 条**：K5 · K6 · K7（DEFER/OPEN 面）· K8 · K10 · K11 · K12 · REQ-I-03 · REQ-I-07 · REQ-K-12 · REQ-D-18/FR-10 · T-040 · T-041 · T-043。合计 14 条。
**部分满足 42 条**（见上表）。
**不满足 7 条**（逐条列出，不掩盖）：
1. **K4** 场景与状态覆盖矩阵八态 —— 新结构无落点、无替代承接者；
2. **V-20** 「不假称同等机器保证」—— 无落点；
3. **V-27** 退出语义与披露纪律（停止并交接未完成事实 / 不宣称测试通过·审查完成·已交付）—— 无落点；
4. **REQ-K-19** 同一披露纪律（「不能用 review unavailable 替失败开脱」）—— 无落点；
5. **REQ-K-20** 完成宣称「展示实际改动、验证结果、未验证项和风险」—— 无落点；
6. **REQ-D-23 / AC-10** 变更传播（改一处、无第二处手工同步）—— 无落点；
7. **REQ-D-33** 最小读取集 —— 无落点。

> 口径说明（避免与第 3 部分看起来矛盾）：第 3 部分按**旧模板是否有落点**判定，因此 `G-07 T-006 四段式`、`G-13 K9 DO NOT TOUCH`、`G-06 影响范围` 在该处判 `不合理（真缺口）`；本部分按**原始需求是否被承接**判定，这三条在需求表里记 `部分满足`（因为 T-041 fixture 与 phase 文档给了它们一个尚未写出的落点）。两处判定不冲突，合并去重后的真缺口见 6.2。

---

## 第 6 部分：结论与建议

### 6.1 新结构相对现有模板：净增 / 净减 / 改造

**净增（16 项，第 4 部分）**
叙事主干（有序论证链 + ≤3 页）· 开头具体故事 · 第 2 节「预算」· 第 3 节「被否方案与取舍」（spec 层新增）· MUST/SHOULD 内嵌纪律 · 第 4 节按切片分节（每片＝被隐藏的决策 + 交互 + 写集/依赖/不做）· 场景化验收作为验收轴 · 未决带「期限」· 契约附件 A/B/C/D · 附录（被否方案详述/来源/术语表）· 失效条件（附件 vs 主干双写 → 立即停止双读）· 末段质疑预登记 · 「参考层回到教学层同一批例子」纪律 · 主干/附件双读纪律 · spec 定位变更（方向/设计/工作包三分）。

**净减（30 项无落点中 11 项合理 + 若干主动删除）**
- **主动删除（有替代）**：材料导航 M/S/B/P（→ 紧凑索引 + 附件 D）· `versioned_refs` / `material_fingerprint` / `acceptance_data` / `e2e_*` JSON / `<sha256>` 命名 / 回执校验（MERGE D2/D3/D5 + OI-013）· plan.md/tasks.md 双写及相等性协议（FR-09/AC-09）· 「三份材料各写一遍的材料导航表」（MERGE D5）· 旧 spec 的「只写产品层，不写文件路径/代码符号/工程命令」定位（被 U-001#1 推翻）。
- **换地方（有替代）**：Test Strategy / 测试路由 → `testing-system-blueprint` + `test-routing-advisor` + phase 任务卡；任务卡 30 字段 / 执行状态区 / 最终聚合策略 → phase 文档 + task facts；追溯表 Command·oracle 列 → phase 任务卡；实现顺序 → 附件 B 依赖；并行五项声明（缺 3 项）→ CARD-03（R-45 已登记）。

**改造（对三个技能）**
- `spec-specify`：**整体重写**（13 并列节 → 6 节论证主干 + 4 附件 + 附录）；新增切片轴、被否方案节、质疑预登记、失效条件；把 AC 四段式/黑名单/V0/V1V2V3 分离写进主干第 5 节；补回八态、影响范围、DO NOT TOUCH；处理「预算」与 T-018 的张力。
- `spec-plan`：**由「工程方案模板」改造为「phase 差异文档模板」**（吸收 `spec-tasks` 的卡片投影；按 T-017 三层 L0/L1/L2；按 R-B §8 的固定字段骨架承载弱模型执行）。MERGE 4.3 明确路径：**改造 `plan-template.md` 或 `tasks-template.md` 之一，保留另一份作历史，不新建第三份模板**。
- `spec-tasks`：**职责并入 `spec-plan`**（MERGE 4.4：「保留技能文件作可搬运能力，但新阶段不再双写调用；或改造为「phase 差异文档渲染器」」）；`Final Boundary Check` 与完成区须明确新落点。

### 6.2 真缺口清单（第 3 部分判 `不合理` 的 4 项 ∪ 第 5 部分 `不满足` 的 7 条 = **去重后 10 项**）与最小修复建议

| # | 缺口 | 依据 | 最小修复建议 |
|---|---|---|---|
| 1 | **K4 八态场景/状态覆盖矩阵无落点** | K4（I-B L219，D-009 裁定必须保留）；旧 spec §3 L63-72 | 主干第 5 节增加固定八态清单（默认/空/错误/加载/取消/边界/权限/竞态，每态 SCN 或 `N/A — reason`）；UI 每态另记 responsive/a11y。**不要新增文件、不要新增技能**（符合 T-036/V-21） |
| 2 | **K9 的 DO NOT TOUCH 禁改清单无落点** | K9（I-B L224）；T-007 预写测试冻结；D-007 自检清单第 3 条 | 附件 B 由三列扩为四列：`切片 → 文件（NEW/MODIFY） → **禁改（DO NOT TOUCH，含理由）** → 依赖`；或主干第 4 节每片固定「改动面 / 禁改 / 不做」三栏 |
| 3 | **T-006 四段式 + 黑名单 + V0 禁入 + V1V2V3 物理分离无结构位** | D-005（用户逐字裁定）；AC-07「验收标准条目满足可执行形式」 | 主干第 5 节写 MUST 句：每条验收＝`条件 → 行为 → 可度量标准 → 失败场景` 四段；附件 A「验收判据」列按四段式固定；黑名单词表与 V0 禁入写入主干第 5 节；V1 人工条目与 V2/V3 机器条目物理分离（分表或分列） |
| 4 | **G-06「影响范围 / 回归范围」无落点** | U-001#2 逐字要求 phase 含「影响范围」；SD-07④ verify-code「受影响回归验收」；旧 spec §13 | 二选一并写死：①主干第 4 节每片固定「影响面（既有行为→本需求影响）」两栏；②phase 文档固定「影响范围 + 回归路径」节。**建议①**（spec 是实现设计权威，影响面属设计信息） |
| 5 | **AC-10 变更传播无落点** | D-008 ⑥ 已裁定「补变更传播核对 + 一条 AC 条目」 | 主干第 5 节增加「变更传播」验收项：改一处 → 引用处随引用调整 → 无第二处手工同步；并纳入检查工具的核对项（T-040 轨 2 人工抽样） |
| 6 | **V-20「不假称同等机器保证」无落点** | D-008 ⑤ 已裁定写入 README/`--help` 与 spec | 主干第 3 节加一条 MUST 句（本工具是事实记录，不构成门禁，不提供机器认证/证据链/过期判断保证），并在附件 A 登记为一条需求 |
| 7 | **V-27 / REQ-K-19 退出语义与披露纪律无落点** | D-006 ⑥ 已裁定补登 | 主干第 6 节固定「退出语义」三句：可停止并交接未完成事实 / 不以 review unavailable 替真实测试失败开脱 / 不宣称测试通过·审查完成·已交付 |
| 8 | **REQ-K-20 完成宣称「展示四项」无落点** | 母 PRD SD-05 / FR-50 / REQ-K-20 | 与第 7 项合并写入主干第 6 节：完成宣称前须展示「实际改动 / 验证结果 / 未验证项 / 风险」；不作为 spec 的设计内容，而作为 spec 的**收尾声明节** |
| 9 | **REQ-D-33 最小读取集无落点** | 母 PRD L290；L-30 已判偏离 | 不放在 spec 结构里（属阶段输入约定）：写入 `workflows/build-plan/SKILL.md` 的输入节，并在 spec 附录「来源」中声明实际读取集 |

### 6.3 改造量估计（对三个技能）

| 技能 | 改动规模 | 具体动作 | 依据 |
|---|---|---|---|
| `spec-specify` | **大（重写模板）** | ①模板由 198 行 / 18 块 → 6 节主干 + 附件 A–D + 附录；②分节轴从「信息种类」换为「切片」；③新增被否方案节、质疑预登记、失效条件、附录三节；④补回八态 / 影响范围 / 四段式 / DO NOT TOUCH；⑤删除 PFACT 与 spec-content.v3 绑定（若用户裁 G-01 为废除）或改造为附件字段；⑥AC 词表升级（D-005）＋按 V-23 写明「当前缺陷或用户结果理由」（R-51 点名） | MERGE 4.4 行 1；T-048；D-002 ⑤ |
| `spec-plan` | **大（换职责）** | ①由「工程方案模板」改造为「phase 差异文档模板」（吸收 `spec-tasks` 的卡片投影；R-B §8 固定字段骨架）；②按 T-017 落 L0/L1/L2 三层与退出机制；③追溯/phase 块**单写**；④删除 `versioned_refs` 哈希；⑤保留 13 步中步骤 6 要求的全部卡片字段（Goal/Files/AC/FR/RED-GREEN/命令/oracle/证据/STOP/rollback + 写集/依赖 + 双向追溯 + 文件边界三清单）；⑥承载 UI 22 字段（若用户裁 G-16 为 phase 面） | MERGE 4.4 行 3；MERGE 5.1 步骤 6；T-017；D1/OI-013 |
| `spec-tasks` | **中→并入或转型** | 二选一：①职责并入 `spec-plan`，保留技能文件作可搬运能力，新阶段不再双写调用；②改造为「phase 差异文档渲染器」。**无论哪条，`Final Boundary Check`、执行状态区、`§4 Final aggregate strategy` 必须有明确新落点**（建议归 phase 模板） | MERGE 4.4 行 4；MERGE 4.3「不新建第三份模板」 |
| 附：`spec-clarify` / `spec-analyze` / `wh-review` / `stage-reflection` | 小→中 | `spec-clarify` 入口由 build-spec 改为 build-plan；`spec-analyze` 单次覆盖合并材料集；`wh-review` 承载一次合并审查；`stage-reflection` 吸收逐项遗漏披露 | MERGE 4.4 行 2/5/6/7 |

**总量**：新建技能 0 / 新建 stage 0 / 新建控制面 0 / **新建模板 0**（改造现有模板）；涉及 **6–8 个现有技能 + 3 个阶段文件**（与 T-043 合并账一致，净新增为 0）。

### 6.4 是否存在「新结构无法承接某条原始需求」——逐条列出

**确认无法承接（无落点、无替代承接者、有原始需求支撑）——9 条**（其中第 7 条合并了 V-27 与 REQ-K-19 两条需求；合并去重后共 10 条需求级缺口）：

1. **K4 场景与状态覆盖矩阵（八态）** —— I-B L219 / 旧 spec §3 L63-72。新结构主干第 5 节只有「场景化验收」，八态枚举消失；无任何附件或技能承接。
2. **T-006/D-005 验收四段式 + 不可判定词黑名单 + V0 禁入 + V1/V2V3 物理分离** —— 用户逐字裁定。新结构「可执行判据」未定义判定形式。
3. **K9 的 DO NOT TOUCH 精确禁改清单** —— I-B L224。附件 B 只有「切片→文件→依赖」。
4. **U-001#2「影响范围」（以及 SD-07④ 受影响回归验收的输入）** —— 逐字原文；spec 层与 phase 层都无落点。
5. **AC-10 变更传播（改一处、无第二处手工同步）** —— prd.md L280。新结构只做静态唯一性检查。
6. **V-20「不假称同等机器保证」** —— 母 PRD SD-17 / D-008 ⑤。新结构无声明位。
7. **V-27 / REQ-K-19「可停止并交接未完成事实」与披露三句** —— 用户原始要求 / D-006 ⑥。
8. **REQ-K-20 完成宣称「展示实际改动、验证结果、未验证项、风险」** —— 母 PRD SD-05/FR-50。
9. **REQ-D-33 最小读取集** —— prd.md L290（属阶段输入约定，spec 结构不承接；须另找落点）。

**须用户裁决才能判定是否无法承接（2 条，判定分叉点）：**

10. **K2「source → FR → AC → phase/task → command/oracle」双向闭环**：若「切片（seam）＝FR 层」，则落点完整（附件 A/D + phase 任务卡）；若不等价，则 FR 与 AC 段断链。**须用户明确「切片是否充当 FR」**。
11. **G-01 PFACT + `spec-content.v3` 生成约束**：若 k7（`spec-analyze` 严格一致性检查）继续保留，则 spec 必须有机器可解析的事实层；若废除该检查，则 PFACT 可随旧模板一起删。**须用户明确 K7 与 spec-content.v3 的存续**。

**另一类须澄清的口径冲突（不是「无法承接」而是「两份表述」）：**

12. **主干节数口径**：D-002 ⑤ ＝「四拍」（4 节），T-048/新结构 ＝「6 节」。须追加 supersession 登记（append-only，不改 D-002 原文）。
13. **「预算」vs T-018「不设任何长度数值目标（硬或软）」**：新结构第 2 节要求「含…预算」，而 D-004/T-018 明确禁止数值目标。须澄清「预算」的所指（建议＝读取预算/切片数上限/附件不计入主干预算，即 R-G §12.2 对 T-008 的表述），并写明它**不是**长度数值门。
14. **「主干 ≤3 页」vs T-018**：R-58 已调和为「软目标，实际判据＝按切片可分节、每片可独立验证」；须把 R-58 口径写进模板，避免被下游当成数值门。

### 6.5 一句话结论

新结构**在「组织轴」上是一次真实的升级**（并列容器 → 有序论证链；双读件 → 主干+契约附件），**对现有 plan/tasks 的绝大多数内容实现了「换地方」而非「消失」**；但把「被否 10 节 → 候选 D」的映射表当作「内容一个都没丢」的证据是**不成立的**——那张表的对照组是 R-B 的草案骨架，不是现行的 198 行 `spec-template.md`。对真实模板逐节核对后，**30 项无落点中 11 项有替代承接（合理）、15 项需用户裁决、4 项是真缺口**；再叠加原始需求覆盖核查（63 条中 **不满足 7 条**），**去重后共 10 项真缺口**：K4 八态、T-006 四段式+黑名单、K9 DO NOT TOUCH、影响范围/回归、AC-10 变更传播、V-20 机器保证声明、退出与披露纪律（V-27 + REQ-K-19）、完成宣称四项（REQ-K-20）、最小读取集（REQ-D-33）。这 10 项全部可以用「在主干第 5/6 节加固定槽位 + 在附件 A/B 各加一列」的最小改动补回，**不需要新增任何技能、stage、控制面或模板**——与 T-043 合并账「净新增 0」一致。此外有 2 个判定分叉点（切片是否充当 FR、K7/spec-content.v3 是否存续）与 3 处口径冲突（D-002 四拍 vs T-048 六节、「预算」vs T-018 无数值目标、「≤3 页」vs T-018）须用户裁决／追加登记。

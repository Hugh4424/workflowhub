# I-B 研究报告：build-spec 与 build-plan 阶段流程的质量核心

- **任务**：workflowhub-thin-core-card-02-20260919（CARD-02 文档权威与单一事实源 + E-6「保留 build-spec / build-plan 流程与质量核心」）
- **方法**：只读静态分析。逐文件读取 `workflows/build-spec/`、`workflows/build-plan/`、`skills/` 下 spec/plan 相关技能与模板、`docs/templates/`、旧规划 decision-log（OI / D-001）与新卡 decision-log、`docs/standard-workflow.md`。
- **结论一句话**：build-spec 的质量核心是「把已确认方向翻译成**可验收、可追溯、无遗漏**的行为规格（含唯一的 Clarify 交互）」；build-plan 的质量核心是「把规格翻译成**窄边界、可执行、RED/GREEN 可证伪**的任务卡（含一次独立审查 + 严格跨材料一致性检查）」。新四阶段 `make-decision → build-plan → build-code → verify-code` 必须把这两套语义都并入 build-plan，而不是只保留文档形态。

---

## 0. 速览结论

| 维度 | build-spec | build-plan |
| --- | --- | --- |
| 权威产物 | `spec.md`（唯一） | `plan.md` + `tasks.md` |
| 语义定位 | 产品行为规格（用户可观察） | 工程实现设计 + 可执行任务卡 |
| 独占能力 | Clarify 交互、场景/状态矩阵、PFACT、AC 四段式、UI Contract、决策溯源绑定 | RED/GREEN 对、精确文件边界、依赖/并行、测试蓝图/路由、最终聚合卡、人工确认 |
| 审查节奏（现行） | 1 次冻结后独立审查 + findings 处置 | 1 次 plan/tasks 独立审查 + findings 处置 |
| 新流程合并点 | 并入 build-plan（OI-014：build-plan 完成后一次合并审查覆盖 spec + phase 文件） | 承接 spec 翻译 + 原 plan 审查两类质量核心 |

---

## 1. build-spec 阶段分析

### 1.1 定位与权威边界

- build-spec 的职责是把当前 `decision-log.md` 转成当前 `spec.md`；四份材料各自独立、是唯一当前工作权威：
  - `decision-log.md` 拥有原始需求、用户选择、理由、风险、非目标与延期方向；
  - `spec.md` 拥有产品行为、流程、状态、FR、AC、失败边界与产品面契约；
  - `plan.md` / `tasks.md` 是下游工程产物，**不得用来补缺失的产品决策**。
  - 证据：`workflows/build-spec/SKILL.md` L18–L33。
- 该阶段**只写 spec.md**，已有规格**就地修订**而非新建平行规格；方向级缺口暴露给 make-decision，不自行发明产品方向（L29–L35）。
- 唯一回退协议：实现级问题留在当前 stage；规格歧义回 build-spec；方向级回 make-decision；材料缺口回对应 owner；环境不可用只记 attempt。错配只让完成事实保持 `incomplete`，保留同 task 修复，禁止整阶段重跑（L9–L14）。
- 上下文边界：`spec.md` 由认证 worktree 的 `specs/<task-id>/` 承载；外置任务目录只放 `task.json`、`facts.jsonl`、`quality/`、`index.json` 等执行文件，不新增 gate（L36–L39）。

### 1.2 步骤清单（`workflows/build-spec/steps.json`，15 步）

| # | step_slug | 作用 | 关键完成证据 |
| --- | --- | --- | --- |
| 1 | read-decision-log | 读 portable 包 + 当前 decision-log | decision-log.md |
| 2 | conditional-spec-research | 仅当事实不足才研究；否则记 skipped+理由 | spec.md / quality/evidence/research |
| 3 | spec-clarify | 唯一澄清流：一批独立问题 + 真实 ask→wait→reply→resume | spec.md / quality facts |
| 4 | spec-specify | 生成行为规格 | spec.md |
| 5 | simplicity-guard | 删除/收窄/复用决策落到 spec | spec.md |
| 6 | plan-ceo-review | 问题、范围、价值、替代、方向检查 | spec.md |
| 7 | ui-project-init | UI 时记录 new/legacy 边界；非 UI 记 N/A | spec.md / quality facts |
| 8 | design-source-readiness | UI 时产出 Screen Read Map（bindable/not_bindable/unknown） | spec.md / quality facts |
| 9 | conditional-plan-design-review | UI 时四行提示词 + 预览/截图/人工确认事实 | spec.md |
| 10 | freeze-spec | 冻结需求/流程/状态/边界/FR/AC/非目标/延期 | spec.md |
| 11 | review-frozen-spec | 一次独立 findings 审查，保留真实 attempt/result/provider provenance | quality/reviews/... |
| 12 | main-agent-disposes-findings | 逐条处置 fixed/rejected_invalid/accepted_risk/needs_human | spec.md |
| 13 | stage-end-spec-analyze | 原始需求+decision-log vs 完整 spec 的严格语义检查 | spec.md / quality facts |
| 14 | publish-spec-result | 大白话交接（非 gate） | spec.md / review |
| 15 | stage-reflection | 阶段末复盘 v2（非阻断） | quality/stage-reflection/... |

（来源：`steps.json` L5–L19。第 15 步 `on_stage_end: true, blocking: false`。）

### 1.3 产出物

1. **`spec.md`（唯一核心产物）**——产品行为、流程、状态、FR、AC、失败边界、产品面契约。
2. 质量事实：`quality/evidence/research/<sha256>.json`、`quality/reviews/attempts/...`、`quality/reviews/results/`、`quality/facts/`、`quality/stage-reflection/build-spec/<reflection_key>.json`、`quality/confirmations/<sha256>.json`（UI 时）。
3. 非产物：不写 plan/tasks，不写实现文件清单、代码符号、工程替代方案、精确测试命令或任务步骤（SKILL.md L261–L265）。

### 1.4 质量机制（本阶段实际在跑的）

1. **决策溯源绑定**：每条新增/变更 FR/AC 必须保留到当前 decision-log 的紧凑绑定（`R*` / report requirement ID / `INC-*` + 承载选择的 `D*`），并记 `source_status`（current/deferred/non-goal/unknown）；**没有来源的 FR 就是新需求，必须回 make-decision**（`skills/spec-specify/SKILL.md` L80–L88）。
2. **稳定 ID 与双向追溯**：每条场景/PFACT/FR/AC/风险/开放问题都有稳定 ID；新需求用 `FR-{DOMAIN}-{NNN}`；每条 FR 至少连一个 PFACT、场景与 AC；每条 AC 命名其 FR、验证方法、通过条件、失败条件与证据类型（L49–L55）。
3. **AC 四段式可执行验收**：每个新 AC 使用四个不带缩进的标签，顺序固定 `验证：`、`通过：`、`失败：`、`证据：`，每条正文非空；禁止 `- **验证方法**` 之类旧式标签；整行为 `TBD/TODO/待填写` 无效（L35–L39）。
4. **场景与状态矩阵**：覆盖默认、空、错误、加载、取消、边界、权限、竞态八态，每态关联场景或写 `N/A — reason`（L53–L55；`skills/spec-specify/templates/spec-template.md` L63–L72）。
5. **PFACT 四态事实层**：`verified` / `inferred` / `unknown` / `not_applicable` 四选一，状态字段互斥；`unknown` 必须绑定 RISK 或 OPEN；`inferred` 是假设的唯一权威位置（L64–L71）。
6. **唯一 Clarify 交互**：`spec-clarify` 是规格澄清的唯一 owner；它把陈述分为「已锁定上游决定 / 上游未决项 / 新歧义」三类，独立轴一批、依赖轴出批，选项最多 3 个且互斥、写明后果与风险、给推荐项；发卡即结束本次调用，必须 `ask → wait → 真实回复 → resume`；无歧义必须显式记 `trigger=false` + 理由；缺回复/错卡/过期 hash 保持 `incomplete`（SKILL.md L236–L244；`skills/spec-clarify/SKILL.md` L19–L77）。
7. **Clarify 十维度完整性检查**：user journey、page/surface scope、data & state transitions、success boundary、failure boundary、permissions/actors、integrations & external effects、non-goals、deferred handoff、acceptance/observable evidence；缺失维度记 `unknown`/`deferred`/真实问题，绝不静默填充（`skills/spec-clarify/SKILL.md` L79–L88）。
8. **一次独立 findings 审查**：`wh-review` 把当前 spec 字节冻结成一个临时 bundle、只发一次 broker 请求，返回真实 provider 身份、transport outcome、findings 与 material hash；`available` 只表示至少一个异源 reviewer 返回合法 findings；空 findings 是建议，不是完成或批准；`unavailable` 绝不改写成 pass（`skills/wh-review/SKILL.md` L44–L51、L88–L89）。
9. **findings 四态处置**：`fixed` / `rejected_invalid` / `accepted_risk` / `needs_human`；有效 finding 在同 task 修复，未解决风险保持可见；这是 `review-frozen-spec` 之后的处置步，编辑 spec 不会重新派发已完成的 review（`steps.json` L16；SKILL.md L287–L291）。
10. **stage-end spec-analyze 严格一致性检查**：映射原始需求 → decision → spec → plan → task → FR/AC → 验证证据；查不一致、重复、歧义、范围漂移、孤儿任务、未覆盖 FR/AC、缺 source refs、测试策略欠定义；含 DEFER/OPEN 的 owner/trigger/handoff/close 闭环；ID 与文件存在只是绑定、不是证明；缺失输入返回 `material_incomplete`（`skills/spec-analyze/SKILL.md` L45–L53、L92）。
11. **simplicity-guard 四阶梯**：P0 需不需要 → P1 已有覆盖 → P2 复用+改造 → P3 最小新增；只有 P0–P2 全不成立才允许 P3，且 P3 仍须最小；例外保留信任边界输入校验、防丢数据错误处理、安全、无障碍基础（`skills/simplicity-guard/SKILL.md` L21–L47、L77–L84）。
12. **plan-ceo-review 方向透镜**：分离用户问题与推导假设；挑战最小可行范围；细节审查时至少对比一个可信替代；找出一个失败即可推翻方向的 premise（`skills/plan-ceo-review/SKILL.md` L13–L25）。
13. **条件 UI 路径（UI Contract）**：按 `ui-project-init → design-source-readiness → frontend-prototype-render → plan-design-review` 顺序消耗依赖；组件/fixture hash 必须匹配当前 Workspace 字节；UI Contract 保留 `page_or_region`、交互流、可见 label、状态矩阵（每态含 `name`、`interaction_flow`、`responsive`、`a11y`）、设计状态/缺项/回退视觉依据/约束/假设/返工风险/人工确认/当前材料引用，以及 preview/fixture/viewport/screenshot/design-version 引用（SKILL.md L114–L149）。
14. **项目标准源边界**：`Design.md` 是项目级视觉与组件标准，`Experience.md` 是项目级交互与页面流标准；UI 规格必须按路径、内容 hash、revision、owner、明确章节锚点绑定两者；严格分析器拒绝手工修补或只用标题 slug 的绑定（L183–L195）。

### 1.5 build-spec 独占能力（相对 build-plan）

1. **唯一 Clarify 交互**：`spec-clarify` 只在 build-spec 的依赖声明里；build-plan 明确「Do not run Talk, Clarify, or Grill here」（`workflows/build-plan/SKILL.md` L100–L103）。
2. **产品行为规格权威**：场景/状态矩阵、PFACT 事实层、产品面契约、产品级 AC（`验证/通过/失败/证据`）。
3. **决策溯源绑定**：FR/AC → `R*/D*` 的 source binding，以及「无来源即回 make-decision」的硬规则。
4. **UI Contract 与 Design.md/Experience.md 双源绑定**：含预览/截图/人工确认的完整 UI 设计闭环。
5. **`freeze-spec` 语义**：冻结用户流程/页面/数据状态/FR/AC/边界/非目标/延期，之后不得改写 decision-log.md（L210–L215）。

### 1.6 spec.md 结构与内容要求（模板现状）

**有模板**：`skills/spec-specify/templates/spec-template.md`（198 行）。结构为 13 节：

1. 速读卡（30 秒）：一句话需求、核心改动点、最大影响面、验收信号（L9–L18）；
2. 来源与决策映射表：`Source ID | Decision ID | FR/AC IDs | Status/affected scope | Unresolved/handoff`（L20–L29）；
3. 问题与紧迫性（L31–L33）；
4. 背景、目标与范围（非目标只在第 10 节维护，L35–L50）；
5. 用户场景与状态覆盖（SCN-001 角色/Given/When/Then + 八态清单，L52–L72）；
6. 产品事实与假设 PFACT（L74–L89）；
7. 功能需求 FR-{DOMAIN}-{NNN}：范围边界/依据/场景/验收（L91–L105）；
8. 模块划分（只写产品职责，L107–L116）；
9. 关键实体（L118–L125）；
10. 数据和生命周期（L127–L136）；
11. 兼容性预留（L138–L146）；
12. 明确不做 + 默认必须成立（唯一权威非目标列表，L148–L158）；
13. 验收标准 AC：需求/验证方法/通过条件/失败条件/证据类型（L160–L169）；
14. 风险/未决与交接（RISK 含受影响 ID、触发、后果、缓解或 STOP、处理 Stage、验证；OPEN 含 owner、影响、处理 Stage、关闭条件或 STOP，L171–L186）；
15. 业务影响与回归范围（L188–L198）。

模板约束：PFACT、FR、AC、场景、来源映射、验证方法、oracle、失败条件必须直接满足 `spec-content.v3`；生成结果原样交给严格 `spec-analyze`，禁止主 agent 手工补写状态、标签或失败条件（L87–L89）。

**关键副产物**：`## 材料导航`（新 spec 输出必须含，可再生产、非权威；每行含章节、一句话摘要、M/S/B/P 建议读取时机）（`skills/spec-specify/SKILL.md` L13–L20）。

---

## 2. build-plan 阶段分析

### 2.1 定位与权威边界

- build-plan 把当前 `decision-log.md` 与 `spec.md` 转成当前 `plan.md` 与 `tasks.md`；**只拥有 plan.md 与 tasks.md**；不改产品方向、不重写规格、不执行代码（`workflows/build-plan/SKILL.md` L18–L25）。
- 四份材料是唯一当前工作真相；旧 review、provider 状态、执行历史与审计事实只能解释质量，不能替代当前决策/规格（L20–L23）。
- 明确「不重放方向」：不运行 Talk、Clarify 或 Grill，也不跑 `talk-with-zhipeng` 作替代；那些属于 make-decision（L98–L103）。业务确认必须在交接时进行：先大白话展示已完成的 plan，取得用户真实回复，再由当前会话发布 `human-confirmation.v3` 到 `quality/confirmations/<sha256>.json`，并把 ref 交给官方 handler 校验；**缺失 review 事实不阻断同 task 继续研究、规划或修复**（L103–L117）。
- 确认后唯一可写区是 `tasks.md` 的执行状态填写区，`plan.md` 语义段不得再改（L114–L115）。

### 2.2 步骤清单（`workflows/build-plan/steps.json`，13 步）

| # | step_slug | 作用 |
| --- | --- | --- |
| 1 | read-current-materials | 读 portable 包 + decision-log + spec |
| 2 | conditional-spec-research | 规划研究真实结果或如实 unavailable |
| 3 | testing-system-blueprint | 每个行为 phase 的风险维度/场景/oracle/命令/证据/覆盖限制 |
| 4 | spec-plan | 实现 phase、边界、依赖、风险、回滚与验证 |
| 5 | simplicity-guard | 删除不必要拆分、重复组件与范围扩张 |
| 6 | plan-eng-review | 工程边界、依赖、失败路径、回滚、验证 |
| 7 | test-routing-advisor | 按预计改动给出 simple/feature/fullstack |
| 8 | spec-tasks | 可执行任务卡（Goal/Files/AC/FR/RED-GREEN/命令/oracle/证据/STOP/rollback） |
| 9 | review-plan | 对当前 plan.md/tasks.md 一次独立 review |
| 10 | main-agent-disposes-findings | 同 task 修复有效 finding |
| 11 | final-spec-analyze | 严格 report-only 跨四材料一致性检查（含 DEFER/OPEN 与每个 task oracle） |
| 12 | publish-plan-result | 大白话交接 + 用户真实回复发布 human-confirmation.v3 |
| 13 | stage-reflection | 阶段末复盘 v2（非阻断） |

（来源：`steps.json` L5–L17。）

### 2.3 产出物

1. **`plan.md`**：快速卡、技术上下文、代码锚点、方案设计、精确文件边界（NEW/MODIFY/DO NOT TOUCH）、技术决策、测试策略、回滚与恢复、实施顺序、依赖与并行、`source → FR → AC → task → oracle` 追溯、治理同步矩阵、Constitution Check，加直接 `## Phase ...` 块（SKILL.md L169–L174；`skills/spec-plan/SKILL.md` L22–L31）。
2. **`tasks.md`**：有序无环的可执行卡集合，使用 `plan-task.v4` 卡契约字段，后接一个完成区（SKILL.md L175–L191）。
3. 质量事实：review、research、testing blueprint、routing、spec-analyze、stage-reflection、human-confirmation。
4. **不产出**：不产代码、不执行 RED/GREEN、不写测试结果（L116–L117）。

### 2.4 质量机制

1. **测试系统蓝图**：为每个行为 phase 设计风险维度、场景、oracle、命令、证据路径与覆盖限制；检查行为结果、状态/数据流、错误/取消/恢复、权限/安全、并发/原子性、跨模块 seam、可观测性/来源，以及 UI 适用时的加载/空/错误/边界与可访问性；明确哪些维度不适用及原因，不能只写「单测通过」；缺失写 `unknown/incomplete`，不伪造 pass，也不要求无关全量回归（`skills/testing-system-blueprint/SKILL.md` L9–L23）。
2. **RED/GREEN 可证伪对**：每个行为变化用**同一 `gate_cmd`** 与**同一 oracle identity**、task-relative 证据路径；RED 必须由目标断言导致非零（不是 setup 失败）；GREEN 期望 0 并保留命名负例；`gate_cmd` 只是测试命令，绝不是开始/继续/发布的许可（`skills/spec-plan/SKILL.md` L114–L132；`skills/spec-tasks/SKILL.md` L100–L118）。
3. **精确文件边界三清单**：`NEW` / `MODIFY` / `DO NOT TOUCH`；禁止通配与目录级所有权；每个 phase 文件列表是全局边界的精确子集，每张任务卡是其 phase 的精确子集（`skills/spec-plan/SKILL.md` L70–L78；`skills/spec-tasks/SKILL.md` L94–L98）。
4. **依赖、顺序与并行**：先生产者后消费者；依赖图必须无环并说明每条串行边的理由；并行仅在输入、依赖、文件所有权独立时成立（`skills/spec-plan/SKILL.md` L96–L112、L166–L171）。
5. **测试路由判类**：独立读 `changed_files`、`phase_count`、`test_command`、阶段标识；`simple`（文档/文案/静态配置或单模块低风险）→ `feature`（一个功能域的行为变化）→ `fullstack`（跨前后端/API/DB/认证/部署/并发，或边界无法证明更窄）；风险不明取更高级；`phase_count > 1` 不是单独升级理由，但跨功能域多 phase 至少 `feature`（`skills/test-routing-advisor/SKILL.md` L8–L16）。
6. **双向追溯映射**：`source/decision IDs → FR → AC → phase/task ID → command/oracle/evidence`；每条当前 FR/AC 都映射到任务，每个任务映射回有效来源、FR、AC；没有来源的条目是上游决策缺口，不是发明范围的邀请（`skills/spec-plan/SKILL.md` L134–L148；SKILL.md L192–L193）。
7. **一次独立 plan 审查**：通过声明的 `wh-review` adapter 提交一次真实独立 review，保留 canonical `attempt_ref`、真实 `result_ref`，把明确 ref 作为 `receipts.review` 交给官方 build-plan handler 认证；技能名或手写 `executed=true` 不算证明；保留 provider/model/transport/provenance 与 partial/unavailable（SKILL.md L194–L206；`steps.json` L13）。
8. **final-spec-analyze 严格收尾**：findings 处置与最后一次 plan/tasks 修订之后、`publish-plan-result` 之前，真实调用一次严格 `spec-analyze`；packet 必须覆盖原始需求、decision-log 派生事实、spec、plan、tasks、流程/状态/边界/非目标覆盖、每个 `DEFER-*`/`OPEN-*` 的 owner/trigger/handoff/close 条件，以及每个 task oracle；结果为 report-only，不成为第五份材料、不成为新质量门（SKILL.md L207–L217）。
9. **STOP 条件**：命令不可执行、接口签名不可用、依赖缺失、文件越界、测试会弱化已接受断言、或需要新的产品/架构决策时，停止并回到所属材料（`skills/spec-plan/SKILL.md` L166–L171；`skills/spec-tasks/SKILL.md` L132–L138）。
10. **Phase 交接块**：每个 phase 固定 `Goal` / `Files` / `Tasks` / `Verify` / `Knowledge` / `STOP` / `Done` / `Risks and rollback`，tasks.md 中在该 phase 卡片之前也要有同样的块；`Files` 只复述 plan 的 phase 边界供阅读，plan.md 仍是权威，任何不一致都是 STOP 回 plan.md（`skills/spec-tasks/SKILL.md` L63–L69；SKILL.md L219–L223）。
11. **人工确认（human-confirmation.v3）**：build-plan 完成后必须取得用户真实回复并发布 `quality/confirmations/<sha256>.json`，官方 handler 消费其 ref 进入 `facts.human_confirmation`；这只是人类对齐，不是机器许可证（SKILL.md L256–L269；`steps.json` L16）。
12. **条件 UI Component Quality Map**：`frontend-component-quality` 是唯一 owner；每项写明动作（`reuse`/`modify`/`extend-state-or-variant`/`add-local`/`extract-shared`/`remove-after-no-consumers`）、真实消费者、兼容影响、状态 owner、typed ViewModel、唯一 CSS/token owner；`extract-shared` 至少两个真实消费者，`remove-after-no-consumers` 需要 `no_consumer_evidence` 或证明无当前消费者的 `evidence_refs`（SKILL.md L119–L139）。

### 2.5 任务分解方法

- **设计契约 = `plan-task.v4`**（`skills/spec-tasks/templates/tasks-template.md` L4）。每张卡的字段顺序：`ID`, `Phase`, `goal`, `design_state`, `versioned_refs`, `source_refs / decision_refs`, `输入`, `依赖`, `并行`, `FR`, `AC`, `动作`, `精确文件`, `boundary`, `输出`, `Knowledge`, `verification_role`, `paired_task`, `gate_cmd`, `expected_exit`, `oracle`, `evidence_path`, `STOP`, `recovery`, `task risk`，外加测试设计字段 `test tier / test method`、scenarios、fixtures、coverage limits（`skills/spec-tasks/SKILL.md` L28–L35；模板 L26–L61）。
- **映射与投影规则**：卡 ID、依赖、精确文件、FR/AC 映射从 plan.md 复制；依赖图无环并解释每条串行边；一张卡只拥有一个行为或一个紧密受限的非行为结果；并行卡要求独立输入、依赖与文件；每条当前 FR/AC 至少出现在一张卡中，且每张被追溯的卡映射回当前 source/decision 与有效 plan 行（`skills/spec-tasks/SKILL.md` L79–L87）。
- **完成区是唯一完成权威**：`status`（pending/in_progress/completed）、actual changed files、commands/exits、evidence refs、covered ACs、review fact、completion time、`执行事实`；只有执行者改 `status`；复选框只是渲染；`执行事实` 是 append-only 事实文本，build-plan/verify-code 只能追加带标签的规划/人类对齐事实，不能改写 status/改动/命令/证据（`skills/spec-tasks/SKILL.md` L36–L58；模板 L104–L114）。
- **小改动最小档**：单行为变化用 1 个 Phase、1 对 RED/GREEN、1 张 FINAL 聚合卡；保留结构标题但对确实不适用的产品/集成节写 `N/A — reason`；不为填模板造卡或造 phase（`skills/spec-plan/SKILL.md` L80–L85；`skills/spec-tasks/SKILL.md` L71–L75）。

### 2.6 与 build-spec 的分工

| 事项 | build-spec | build-plan |
| --- | --- | --- |
| 产品行为/流程/状态/FR/AC/失败边界 | **拥有** | 只消费，不改写 |
| 实现文件清单/代码符号/工程替代/精确测试命令/任务步骤 | 明确禁止写入（SKILL.md L259–L265） | **拥有** |
| Clarify / Talk / Grill | Clarify 唯一 owner（Talk/Grill 禁） | 全部禁止（L100–L103） |
| 测试 | 只写 AC 的证据类型，不写命令 | 设计 RED/GREEN、命令、oracle、证据路径，不执行 |
| 审查 | 1 次冻结后审查 spec | 1 次审查 plan+tasks |
| 端到端一致性 | stage-end spec-analyze（原始需求+decision+spec） | final-spec-analyze（原始需求+decision+spec+plan+tasks） |

---

## 3. 支撑技能清单（职责一句话 + 关键机制）

| 技能 | 谁用 / 执行方式 | 职责一句话 | 关键机制（证据） |
| --- | --- | --- | --- |
| `spec-prd` | build-prd，唯一 writer | 产出规划任务的单一可维护 PRD（先大纲/结果导向任务地图，再细节卡） | 恰好两次内容调用 + 同 revision 绑定；地图核对与最终确认是两个真实人门；UI 时 `display_before_reply` + `human_approved`；拒绝/未答/错版保持 `draft`（L27–L67、L69–L90、L102–L121） |
| `spec-specify` | build-spec，inline | 从冻结决策材料起草可测试规格 | 受控 `readArtifact/writeArtifact` 回调；固定模板；稳定 ID；AC 四段式；PFACT 四态；decision-log 绑定（L8–L11、L22–L25、L35–L39、L49–L71、L80–L88） |
| `spec-clarify` | build-spec，inline（唯一澄清 owner） | 解决规格中的材料歧义 | 三类陈述分类；独立轴一批、依赖轴出批；每问一个决策轴；`trigger=false` 必须显式；十维度完整性检查（L19–L47、L56–L77、L79–L88） |
| `spec-research` | build-spec/build-plan，independent | 只做轻量规划问题，返回内存结果 | 与 `deep-research` 分工；不写正式报告；不必要就 `status: skipped` + 理由，不假装研究（L13–L25） |
| `spec-plan` | build-plan，inline | 把决策+规格转成最简可执行实现计划 | 13 节 plan 模板；reuse→extend→new + F10；精确文件边界；phase 八字段；RED/GREEN 同命令同 oracle；一条双向追溯；STOP 条件（L22–L31、L56–L61、L70–L78、L96–L112、L114–L148、L166–L171） |
| `spec-tasks` | build-plan，inline | 把 plan 投影成有依赖顺序的紧凑任务卡 | `plan-task.v4` 卡契约；完成区唯一权威；投影规则；`精确文件` 必须逐字节来自 plan 行且是 Phase 子集；FINAL 是普通卡不是新 stage（L28–L41、L36–L58、L79–L98、L104–L118） |
| `spec-analyze` | 四个写作 stage，inline / lens-only | 单一 stage-end 语义一致性检查 | 映射 raw requirement→…→证据；查不一致/重复/歧义/漂移/孤儿任务；DEFER/OPEN 四要素闭环；六段大白话摘要；report-only 不阻断；severity CRITICAL/HIGH/MEDIUM/LOW；覆盖率指标（L21–L24、L45–L53、L62–L70、L92–L101） |
| `plan-ceo-review` | wh-review packet 内的 advisory lens | 产品方向/前提/范围/替代方案检查 | 分离问题与假设；挑战最小可行范围；细节审查至少一个可信替代；找出可推翻方向的 premise（L13–L25） |
| `plan-eng-review` | build-plan 直接调用，advisory | 工程顺序/边界/失败模式/验证检查 | 需求→任务→客观验证映射；接口/签名/CLI/事件/schema 必须有精确锚点与明确消费者；无效状态转移/并发假设/fail-loud；每条 `[P]` 并行要有独立输入与非重叠文件；拒绝占位或默认全量命令（L24–L42） |
| `plan-design-review` | build-spec，UI 时 advisory | UI 信息架构/状态/无障碍/响应式检查 | 主旅程与交互态；空/加载/错误/恢复；可访问名/焦点序/对比意图/键盘路径；响应式约束；缺 UI 证据记为 packet gap 而非猜视觉（L12–L18） |
| `intake-decision-review` | wh-review make-decision 方向轨，blind lens | 方向级盲审：问题/框架/范围/可行性 | 输入只允许原始需求+客观事实+硬约束+非目标；禁止含方案/排序/decision-log/spec/plan；四角度各一条 finding；只返回 `{findings:[]}`；缺料即 unavailable，永远不是 pass（L14–L53） |
| `simplicity-guard` | build-spec/build-plan packet 内 advisory lens | 审查是否走过四阶梯最小路径 | 四阶梯决策树 P0–P3；P3 三条写法纪律；例外保护校验/错误处理/安全/无障碍；删除优于新增；不输出 verdict（L21–L47、L60–L91） |
| `review` | 通用 review lens | 通用只读审查：正确性/范围/证据/未决风险 | 事实与推断分离；每个材料声明对照 packet 证据；缺失证据是 unavailable 不是 pass；finding 只许用 provider 协议字段（L12–L25） |
| `wh-review` | 各 stage 审查 adapter | 把当前材料字节送给异源 reviewer 并返回真实 findings | 不校验 workspace/task/git/revision；冻结提交字节并 hash；一次 broker 请求；`available` 仅是至少一个异源 reviewer 返回合法 JSON；unavailable 保留真实 error code，永不改写成 pass（L14–L17、L44–L51、L88–L95） |
| `debate` | 可选便利层（review 裁决阶段） | 审查发现裁决/多方案对比/决策对抗 | 明确是可降级便利层非质量地基；四队法庭（甲乙丙丁）+ 主代理法官禁言；最多 2 轮 mailbox；缺并行能力降级为单人三档；不替代独立审查，只裁决已有 findings（L10–L16、L37–L53） |
| `testing-system-blueprint` | build-plan，inline | 为每个 Task/Phase 生成分层测试与证据策略 | 风险维度枚举；明确不适用维度与原因；输出 scope/层级/场景/命令/oracle/fixture/执行器/证据/覆盖限制/snapshot 绑定；是事实不是 gate（L9–L23） |
| `test-routing-advisor` | build-plan，independent | 判 simple/feature/fullstack，只判类不执行 | 独立读 changed_files；风险不明取更高一级；`result: fail` 时仍给最保守 tier；完全无法判定用 fullstack（L8–L16、L31–L37） |
| `requirement-lineage` | 审计 / verify-code | 建立需求→决策→产物→验证谱系 | 保留来源标识，审计中绝不重编号；`missing`/`partial`/`stale` 语义；不得仅凭 plan 或旧 verdict 声称需求被接受/实现/验证（L16–L22） |
| `decision-log` | make-decision | 维护唯一决策记录（本报告仅确认边界） | — |

---

## 4. 质量核心清单（必须保留）

> 判定标准：真正提升了「可验收、可追溯、可证伪、不遗漏、不被伪造为通过」的机制。每条给出新四阶段（`make-decision → build-plan → build-code → verify-code`）中的承接者。

| # | 机制名 | 实际做什么 | 防的是什么问题 | 新流程承接者 |
| --- | --- | --- | --- | --- |
| K1 | **需求翻译完整性 + 未溯源回退** | 每条新增/变更 FR/AC 绑定 `R*/D*` 与 `source_status`；没有来源的需求必须回 make-decision；spec 不发明产品方向 | 规格偷偷发明范围、decision-log 与 spec 各说一套、下游按错误需求实现 | build-plan（spec.md 生产者）+ make-decision（缺口 owner） |
| K2 | **稳定 ID + 双向追溯闭环** | 场景/PFACT/FR/AC/风险/OPEN 稳定 ID；`source → FR → AC → phase/task → command/oracle/evidence` 双向映射，孤儿任务/未覆盖 AC 是 finding | 需求丢失、任务无来源、验收无对应、计划与规格断链 | build-plan（plan.md + tasks.md 的追溯表与映射规则） |
| K3 | **AC 四段式可执行验收** | 每个 AC 固定 `验证：/通过：/失败：/证据：` 四标签，正文非空，禁 TBD/TODO/待填写；证据只声明类型，执行事实由 verify-code 提供 | AC 写成口号、无法判真假、失败条件缺失、用「测试通过」代替可判 oracle | build-plan（spec.md OC/AC 段）+ build-code/verify-code（执行事实） |
| K4 | **场景与状态覆盖矩阵** | 默认/空/错误/加载/取消/边界/权限/竞态八态，每态关联 SCN 或 `N/A — reason`；UI 每态另记 responsive/a11y | 只写 happy path、失败/取消/权限/竞态状态漏设计、下游边写边猜 | build-plan（spec.md 场景节） |
| K5 | **唯一 Clarify 交互 + 十维度完整性检查** | 一批独立问题、每问一轴、2–3 互斥选项含后果与风险与推荐；发卡即结束调用，必须真实 `ask→wait→reply→resume`；无歧义显式 `trigger=false`；十维度查缺 | 替用户臆测答案、批量塞依赖问题、漏掉旅程/权限/延期/验收维度、把未回答当已确认 | build-plan（保留唯一 Clarify 语义与十维度检查；不得新增第二套 Clarify） |
| K6 | **一次独立异源审查 + findings 四态处置** | wh-review 冻结当前字节 → 一次 broker 请求 → 真实 findings + provider/transport provenance；主会话逐条 `fixed/rejected_invalid/accepted_risk/needs_human`；unavailable ≠ pass、空 findings ≠ 批准 | 自审自判、把 unavailable/partial 当通过、finding 被静默丢弃、用「审查通过」替代真实执行 | build-plan（OI-014：build-plan 完成后、build-code 开工前一次合并审查，覆盖 spec + phase 文件，两类质量核心合一） |
| K7 | **stage-end spec-analyze 跨材料语义一致性** | 严格 report-only 检查原始需求/decision-log/spec/plan/tasks 的语义一致、DEFER/OPEN 四要素闭环、每个 task oracle、流程/状态/边界/非目标覆盖；缺失输入 `material_incomplete` | ID 齐全但语义漂移、延期/未决项无 owner/触发/关闭条件、任务 oracle 空转、把文件存在当质量 | build-plan（final-spec-analyze，一次，report-only） |
| K8 | **顾问透镜组：simplicity-guard / plan-eng-review / plan-design-review（+ plan-ceo-review）** | 四阶梯 YAGNI 删减；工程边界/失败模式/RED-GREEN/接口消费者检查；UI 状态/无障碍/响应式检查；方向/前提/替代检查 | 投机抽象、重复建设、只增不删、并行声明不成立、UI 只做视觉不设计状态、方向 premise 未被挑战 | build-plan（作为 advisory 输入注入那一次合并审查的 packet；不再各自独立成步） |
| K9 | **RED/GREEN 可证伪对 + 精确文件边界** | 同一 `gate_cmd`/同一 oracle 的 RED→GREEN；RED 由目标断言导致非零、GREEN 为 0 且保留命名的负例；`NEW/MODIFY/DO NOT TOUCH` 精确三清单，禁通配，phase/卡边界逐级子集 | 形式化 RED、用环境错误冒充 RED、弱化断言换取绿色、边界漂移与顺手术、计划命令不可执行 | build-plan（设计）+ build-code（执行）+ verify-code（真实入口验收） |
| K10 | **测试蓝图 + 测试路由判类** | 每个行为 phase 设计风险维度/场景/oracle/证据路径/覆盖限制；按真实改动判 simple/feature/fullstack，风险不明取更高级 | 只写「单测通过」、缺失败/并发/seam 覆盖、全量回归代替针对性验证、层级判错导致漏测 | build-plan（设计）+ build-code（按真实 changed files 重判并执行） |
| K11 | **阶段末逐项遗漏披露 + 阶段复盘** | 读 steps.json manifest，逐项报告执行状态/产物存在性/完成判据，区分未启动/跳过/产物缺失/完成判据缺失/unknown/unavailable；六区块复盘（what_helped 等）绑定 evidence_refs 与 confidence | 用一条阶段结论均摊所有 step、把 executor_absent 记成正常跳过、把缺失伪装成完成 | build-plan（保留逐项披露与复盘，去掉其机器认证依赖） |
| K12 | **人工确认（真实用户回复）** | build-plan 完成后大白话展示，取得用户真实回复并记录为人类对齐事实；不自动越过人做不可逆动作 | 替用户确认、把 agent 推断当批准、把确认当机器工作许可 | build-plan（保留）+ verify-code（终末真实入口验收） |

> 说明：K1–K12 在新流程里不需要 12 个独立 step。建议的收敛映射是——K1/K2/K3/K4/K5 归入 build-plan 的「spec 翻译与验收设计」；K6/K7/K8 合并为 build-plan 收尾的**一次合并审查 + 一次严格一致性检查**；K9/K10 归入任务卡设计；K11/K12 保留为收尾事实与两道人为门（OI-012：只留推进确认与不可逆 Git 授权）。

---

## 5. 可删除面

> 依据：旧规划 decision-log 的 OI-001 / OI-003 / OI-012 / OI-013 与 D-001；新卡 decision-log 的 E-5（CARD-05 合并审查并入）与 E-6。

| # | 机制 | 现状证据 | 判定 | 理由与依据 |
| --- | --- | --- | --- | --- |
| D1 | **plan.md / tasks.md 双写及相等性协议** | build-plan 同时产出 plan.md（13 节）与 tasks.md（逐卡重述 Goal/Files/Tasks/Verify/…）（`skills/spec-plan/SKILL.md` L22–L31；`skills/spec-tasks/SKILL.md` L63–L69） | **删除** | D-001 L638 明确「删除 plan.md/tasks.md 双写及其相等性协议」；OI-001 收敛为「一份权威 spec + 每个 phase 只写本检索边界内的差异 + 常驻紧凑索引」。tasks.md 的 Phase 块与 plan 的 Phase 块是同一事实的两份声明，正是「无重复契约」的反例。新流程应让 phase 差异文档直接承担任务卡职责，或让 plan.md 成为唯一 phase 权威。 |
| D2 | **哈希/快照/身份/材料/回执校验机器** | `stage-input-packet.v1` 绑定 `material_revision`、`snapshot_tree`、source SHA-256、`packet_freeze_hash`（build-spec SKILL.md L100–L112；build-plan SKILL.md L85–L96）；`versioned_refs` 带真实 SHA-256（tasks-template L37）；clarify receipt 要求 `revision-[a-f0-9]{64}` 与 `snapshotTree`（`runtime/evidence/canonical-receipt-writer.mjs` L450–L452）；wh-review `material_fingerprint` 防复用（wh-review SKILL.md L95） | **删除** | OI-013 已收敛「彻底全删」：阶段推进、审查派发、测试执行不依赖哈希/sha/快照/身份/材料/回执校验；记录层也不用内容寻址哈希，改「普通文件名 + 纯文本引用」；质量 = 真实执行 + 独立审查 + 人确认。D-001 L666 亦把「多层重复 evidence 包装」列为删除目标。保留语义（此答复对应此版本、错绑/过期检测）需按 OI-003 先书面承认损失清单，再决定是否保留窄能力（OI-003 L241）。 |
| D3 | **stage completion 通用认证 / task kernel / fact graph 强制依赖** | build-spec 与 build-plan 均以「正式完成事实」绑定 handler 认证（`skill-deps.yaml` 的 `consumer: stage-handlers#...`，两文件全文）；stage-content-contracts 定义 `FORMAL_STAGES` 与 `validateFallbackProtocol`（`runtime/stage/stage-content-contracts.mjs` L464、L485） | **删除（保留语义、去机器认证）** | D-001 L666 点名「stage completion 通用认证、task kernel/fact graph 对日常工作的强制依赖」；OI-003 收敛为「删除通用事实引擎前必须先承认真实损失清单」。`fallback_protocol` 的路由语义（歧义回 spec、方向回 decision）应保留为文本约定，不应继续要求机器校验。 |
| D4 | **固定 Talk 轮次、14 步顺序锁定、强制每 Phase review/handoff/不变路线重选、只保护流程形状的测试** | build-spec 15 步、build-plan 13 步的固定顺序与 `depends_on` 链（两处 steps.json）；每阶段各自的 review + stage-reflection + stage-handoff + spec-analyze（`skill-deps.yaml`） | **删除（合并为一次）** | OI-001 resolution：「删除固定 Talk 轮次与 14 步顺序锁定、stage completion 通用认证、plan.md/tasks.md 双写及只保护流程形状的测试」；D-001 L666 点名「固定 Talk 轮次、强制每 Phase review/handoff/不变路线重选，以及只保护这些流程形状的测试」。OI-014 已把 build-plan 的 spec 审查 + plan 审查合并为**一次**；build-code 的 phase 审查节奏保留（每 phase 一次 + 全 phase 集成一次 + verify-code 终末一次）。 |
| D5 | **重复的证据包装层与冗余 profile/兼容层** | `quality/facts/` + `quality/evidence/` + `quality/reviews/attempts|results|reports/` + `quality/stage-reflection/` + `quality/confirmations/` 多层（build-spec steps.json L6–L19）；`content_profile: spec-content.v3` fail-closed 与 legacy `ambiguity-ledger.v2` 兼容（`skills/spec-specify/SKILL.md` L57–L63）；卡字段既要 `plan-task.v4` 又要 `versioned_refs` hash 与 delivery contract JSON（tasks-template L37、L63–L90） | **删除/合并** | OI-003：「删除多层重复 evidence 包装」；OI-013 记录层改普通文件名；D-001 L666 把「多层重复 evidence 包装、plan/tasks 重复合同」列为删除目标。同一事实不应在 facts、evidence、reflection、summary 四处各留一份权威。 |

### 5.1 可删除面中的「保留语义、删除机器」清单（避免误删真实质量）

以下机制虽然其**载体**（校验机器、哈希、gate）要删，但**语义**必须由 build-plan/build-code/verify-code 以人工或事实记录形式承接：

- 独立审查（异源、独立上下文）——改成一次合并审查的语义，不删。
- findings 处置四态——保留为文本处置，不删。
- 未完成/不可用/跳过的事实披露——保留（K11）。
- 不可逆 Git 授权与推进确认——保留为两道人为门（OI-012）。
- 真实命令的 exit/output 采集、原子写入、失败与缺口事实、历史只读——保留（OI-003、D-001 L664）。
- 安全、数据完整性、输入校验——按 `simplicity-guard` 例外条款不得删除（simplicity-guard L77–L84）。

### 5.2 建议合并/降级的仪式性机制

| 机制 | 现状 | 建议 |
| --- | --- | --- |
| `freeze-spec`（step 10） | 冻结 spec 后生成冻结事实 | 语义并入「spec 定稿」，不作为独立 step 与机器门；OI-012 已把「迁移表冻结、并行声明、接口蓝图冻结」从推进前置降级为事实记录 + 验收核对 |
| `## 材料导航` M/S/B/P 表 | spec/plan/tasks 三份都要求（spec-specify L13–L20；spec-plan L22–L27；spec-tasks L13–L19） | 保留为可选索引；三份材料各写一遍同一张导航表是重复事实，可只保留一份索引 |
| 四个 advisory 透镜各自成步 | build-spec step 5/6/8/9，build-plan step 5/6 | 合并为一次审查 packet 里的多个 lens（`plan-ceo-review`/`simplicity-guard` 本来就声明在同一 packet 内运行，见 plan-ceo-review L8–L11、simplicity-guard L10–L13） |
| `stage-handoff` + `publish-*-result` + `stage-reflection` 三步收尾 | 两处 skill-deps.yaml 各声明三个收尾技能 | 收尾事实合并为一次「阶段交接 + 复盘」输出；OI-003 允许多层包装合并 |

---

## 6. 模板现状

### 6.1 `docs/templates/`（任务指定目录）

**几乎没有模板**：只有 `docs/templates/project-gitignore.md`（906 字节）。spec/plan 模板不在这个目录。

### 6.2 与 spec/plan 相关的真实模板位置

| 模板 | 路径 | 行数 | 服务对象 | 结构要点 |
| --- | --- | --- | --- | --- |
| spec 模板 | `skills/spec-specify/templates/spec-template.md` | 198 | build-spec 的 `spec.md` | 13 节，见 §1.6；含来源映射表、SCN、PFACT、FR、AC 四段式、风险/OPEN |
| plan 模板 | `skills/spec-plan/templates/plan-template.md` | 244 | build-plan 的 `plan.md` | 13 个命名节 + `## Phase` 块；含 `Reuse→Extend→New` 表、UI Delivery Contract、File Boundary 三清单、Technical Decisions + F10、Test Strategy、Traceability、Governance Synchronization Matrix、Constitution Check（F1–F11/Q1–Q3/S1–S8 共 22 条） |
| tasks 模板 | `skills/spec-tasks/templates/tasks-template.md` | 259 | build-plan 的 `tasks.md` | `plan-task.v4`；RED/GREEN/FINAL 三卡示例；Delivery contract fields（acceptance_role/ui_scope/acceptance_data/e2e_scope）；UI phase/task fields；`执行状态填写区（唯一完成权威）`；Final Boundary Check |
| PRD 模板 | `skills/spec-prd/templates/prd-template.md` | — | build-prd 的 `prd.md` | 导航/产品总览/共享定义/任务地图/最终展示稿确认/任务卡/风险与交付说明/变更说明；每卡 16 个固定字段 |
| （历史）spec-kit 模板 | `.specify/templates/plan-template.md`、`.specify/templates/tasks-template.md`、`.specify/templates/checklist-template.md` | 4794/9948/1312 字节 | 早期 spec-kit 流程 | 与现行 `skills/spec-*` 模板并存，属历史兼容区；需确认是否仍被引用 |

### 6.3 模板与 CARD-02 目标的落差（现状问题）

- 现有 spec 模板 198 行、plan 模板 244 行、tasks 模板 259 行；三份都有「材料导航」节，plan 与 tasks 大量结构性重复（Phase 块、Goal/Files/Tasks/Verify/Knowledge/STOP/Done/Risks）。
- tasks 模板的交付契约字段（`versioned_refs` hash、`acceptance_data` JSON、`e2e_decision_refs`、`high_risk_fact` JSON-in-Markdown）按 OI-013 属于冻结删除对象。
- 新卡 E-1/E-3 要求「精炼 + 好读 + 无遗漏 + 可被低智力模型执行」，需要**新模板**（spec 由 build-plan 产出，含四件翻译内容：需求文档、验收流程、测试标准、架构方案；phase 文档只写本检索边界内差异 + 常驻紧凑索引），见 `prd.md` L266–L291、FR-07/FR-08。
- 现行模板中的「PFACT/来源映射/spec-content.v3」是为 build-spec 独立阶段设计的；合并进 build-plan 后需要重排优先级，避免规格与工程内容在同一文档里争夺权威（CARD-02 原文：「spec 为实施前翻译」、「不复制完整产品需求或重新定义验收目标」）。

---

## 7. 对新四阶段流程的迁移建议（供后续 spec/plan 设计）

1. **结构**：`make-decision`（含现状盘点的原始需求/决定）→ `build-plan`（同时产出 spec.md + phase 差异文档/紧凑索引 + 任务卡）→ `build-code` → `verify-code`；删除 build-spec 作为独立 stage 的入口，但**不删除**它的 K1–K5 语义。
2. **审查**：按 OI-014，在 build-plan 完成后、build-code 开工前做**一次合并审查**，同时覆盖 spec（需求翻译完整性/验收可执行/架构合理）与 plan（依赖正确/并行声明/写集）两类质量核心。build-code 每 phase 一次 + 全 phase 集成一次 + verify-code 终末一次不变。
3. **一致性检查**：保留一次 `spec-analyze` 式 report-only 严格检查，但输入从「四份材料」改为「decision-log/PRD + spec + phase 文档 + 任务卡」，并保留 DEFER/OPEN 四要素闭环与 task oracle 检查。
4. **Clarify**：保留为 build-plan 内唯一交互式澄清流，保留 `ask→wait→reply→resume` 与 `trigger=false` 显式记录，但删除其 receipt 哈希/快照绑定，改用普通文件名 + 纯文本引用。
5. **CLI/任务卡**：保留 RED/GREEN 同命令同 oracle、精确文件边界、依赖/并行声明、STOP 条件；删除 `versioned_refs` 哈希、`acceptance_data` 的机器 JSON 契约、`material_fingerprint` 防复用。
6. **两道人为门**（OI-012）：只保留「推进中的人为确认对话」与「不可逆 Git 授权」；迁移表冻结、并行声明、接口蓝图冻结降级为事实记录 + 验收核对。

---

## 8. 证据索引（关键文件与行号）

| 证据 | 位置 |
| --- | --- |
| build-spec 职责/权威/回退/复盘/UI/规格内容/工作序列/完成交接 | `workflows/build-spec/SKILL.md` L9–L14、L18–L39、L41–L63、L75–L112、L114–L195、L197–L244、L246–L257、L259–L269、L271–L300、L302–L317 |
| build-spec 步骤 | `workflows/build-spec/steps.json` L5–L19 |
| build-spec 依赖与消费者 | `workflows/build-spec/skill-deps.yaml` L5–L17、L18–L25 |
| build-plan 职责/依赖/回退/UI/工作序列/契约/质量交接 | `workflows/build-plan/SKILL.md` L9–L14、L18–L29、L51–L81、L83–L96、L98–L117、L119–L158、L160–L217、L219–L243、L245–L269 |
| build-plan 步骤 | `workflows/build-plan/steps.json` L5–L17 |
| build-plan 依赖与消费者 | `workflows/build-plan/skill-deps.yaml` L3–L14 |
| spec 模板 | `skills/spec-specify/templates/spec-template.md` L1–L198 |
| plan 模板 | `skills/spec-plan/templates/plan-template.md` L1–L244 |
| tasks 模板 | `skills/spec-tasks/templates/tasks-template.md` L1–L259 |
| PRD 模板 | `skills/spec-prd/templates/prd-template.md` |
| 技能职责 | `skills/spec-specify/SKILL.md`、`spec-clarify/SKILL.md`、`spec-analyze/SKILL.md`、`spec-plan/SKILL.md`、`spec-tasks/SKILL.md`、`simplicity-guard/SKILL.md`、`plan-ceo-review/SKILL.md`、`plan-eng-review/SKILL.md`、`plan-design-review/SKILL.md`、`wh-review/SKILL.md`、`review/SKILL.md`、`debate/SKILL.md`、`intake-decision-review/SKILL.md`、`testing-system-blueprint/SKILL.md`、`test-routing-advisor/SKILL.md`、`requirement-lineage/SKILL.md` |
| OI-001/OI-003/OI-012/OI-013 | `specs/workflowhub-thin-core-rebuild-planning-20260919/decision-log.md` L193–L253、L417–L457 |
| D-001 与删除目标 | 同上 L601–L618、L631–L639、L654–L668 |
| CARD-02 / CARD-05 / E-6 目标 | `specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md` L108–L111、L142–L160、L264–L291、L353–L392 |
| 标准工作流描述 | `docs/standard-workflow.md` L27–L29、L178–L265 |
| 校验机器现状 | `runtime/stage/stage-content-contracts.mjs` L464、L485、L3516–L3545；`runtime/evidence/canonical-receipt-writer.mjs` L444–L503 |
| `docs/templates/` 现状 | 仅 `docs/templates/project-gitignore.md` |

---

## 9. 结论

build-spec 与 build-plan 的价值**不在两阶段拓扑**，而在它们各自承载的一套质量语义：build-spec 提供「决策→规格」的可验收翻译（需求溯源、稳定 ID、AC 四段式、场景/状态矩阵、唯一 Clarify、UI Contract）；build-plan 提供「规格→任务」的可证伪翻译（RED/GREEN 同 oracle、精确文件边界、依赖/并行、测试蓝图与路由、双向追溯、一次独立审查、最终严格一致性检查、人工确认）。

新四阶段把这些语义**合并进 build-plan + make-decision + build-code + verify-code** 即可，同时删除围绕它们建造的机器外壳（哈希/快照/revision 校验、stage completion 通用认证、plan/tasks 双写、重复 evidence 包装、固定轮次与逐阶段 review/handoff）。一句话：**留下问题定义、验收 oracle、边界与证伪方法；删掉证明「流程走完了」的那套机器。**

---

*报告完成时间：2026-09-20。本报告为只读分析，未修改仓库任何源文件。*

# 功能规格：M14a 审计契约层

**功能名**: `m14a-audit-contract-layer`
**来源**: 上游 make-decision 决策记录
**状态**: 澄清后规格

## 速读卡（30 秒看懂这个需求）

- **一句话需求**：定义 workflowhub 审计契约，让 task_dir、worktree、review、verify、handoff 等质量事实有稳定字段、来源约束和可引用产物。
- **核心改动点**：定义 execution trace 字段；固定 failure_domain 首批词表；定义 skills inventory 字段口径；定义 harness surface 边界；分离契约版本和采集实现版本。
- **最大影响面**：workflowhub 的执行记录、审查事实、技能登记和 harness surface 文档。
- **验收信号**：本目录下的 schema、taxonomy、inventory、surface 文档能被 build-plan 直接引用，且明确不包含诊断算法、blocking gate、自进化建议、per-skill 机器执行入口或采集 parser 实现。
- **spec-ladder 档位**：B 档。理由：本需求跨 schema、orchestrator、skills、adapters、dashboard 多个契约面，但只定义文档和 schema 口径，不引入外部依赖或破坏性迁移。
- **F10 速查**：真实威胁是 LLM 声称流程跑通但缺少机器事实；现有机制没有统一字段和来源口径；契约文档可被绕过所以只记录事实不阻断；长期成本集中在版本维护，需保持字段窄且变更需 review。

## 1. 问题陈述

当前：workflowhub 重构后，审查流程、task_dir、worktree、3rd-review、verify freshness、handoff 等事实散落在评论、日志、产物和口头叙述中。

问题：没有统一审计契约时，后续 agent 可以把流程说成“跑通”，但读者无法稳定核查哪些字段存在、哪些事实来自机器信号、哪些 surface 可进入未来自进化候选池。

## 2. 背景、目标和边界

### 背景

上游决策记录 D1-D6 已明确：M14a 先钉死契约，不提前实现诊断算法或 gate。后续 build-plan/build-code 需要一个可引用的单一规格来源，避免 execution trace、failure taxonomy、skill registry 和 harness surface 各自分裂。

### 目标

1. 定义 execution trace / execution record 的字段范围和事实来源约束。
2. 固定首批 `failure_domain` 词表，只表达领域，不表达解决方案。
3. 定义 `skills-inventory.schema.json` 作为 repo skill registry 的唯一字段口径。
4. 定义 `harness-surface.md` 的五类 surface、四个字段和权限语义。
5. 明确契约版本与采集实现版本的分离规则。

### 非目标（明确不做）

1. 不写诊断算法。
2. 不做 blocking gate。
3. 不做自进化建议。
4. 不新增 per-skill 机器执行入口。
5. 不实现采集 parser。
6. 不照搬外部工具权限系统。

### 假设

- **假设 1**：`execution-trace.schema.json` 作为新契约文件更清晰。来源：decision-log D1 允许“定义 execution-trace.schema.json 或扩展 execution-record.schema.json”。理由：本阶段只定契约，新文件能避免把未实现字段伪装成现有执行记录能力。
- **假设 2**：四类事实来源字段使用引用数组或 provenance 对象表达，而非内联完整内容。来源：decision-log D1 的 `transcript_refs`、`artifact_refs`、`facts_refs`、`provenance`。理由：artifact-first 能减少长日志复制，也方便下游追溯。
- **假设 3**：`skills-inventory.schema.json` 只描述 skill registry，不描述 skill 执行入口。来源：decision-log D5/D6。理由：用户明确排除了 per-skill 机器执行入口。
- **假设 4**：harness surface 权限语义保留四级命名。来源：decision-log D3。理由：上游已批准四级语义，build-spec 只补字段定义。

## 3. 用户场景与用例

### 场景一：下游计划引用契约（正常路径）

- **角色**：build-plan 阶段执行者。
- **前置条件**：Given M14a spec 目录已生成。
- **操作步骤**：When 执行者阅读 required_reads 中列出的契约文件。
- **预期结果**：Then 执行者能直接知道要实现哪些字段、词表、registry 字段和 surface 文档，不需要回翻 make-decision 长日志。

### 场景二：审查者核查事实来源（正常路径）

- **角色**：独立审查者。
- **前置条件**：Given 某条 stage 执行记录声明 review 已运行。
- **操作步骤**：When 审查者检查 execution trace 的 `transcript_refs`、`artifact_refs`、`facts_refs` 和 `provenance`。
- **预期结果**：Then 审查者能区分机器事实、人类来源和未知事实，不把口头陈述当作通过证据。

### 场景三：失败分类保持窄口径（边界路径）

- **角色**：后续实现者。
- **前置条件**：Given 某次任务暴露 review 未真正运行的问题。
- **操作步骤**：When 实现者记录 `failure_domain`。
- **预期结果**：Then 实现者只能选择 `review` 等领域词，不能在 taxonomy 中塞入 severity、root cause、修复建议或判断算法。

### 场景四：防止范围越界（失败路径）

- **角色**：build-code 阶段执行者。
- **前置条件**：Given 执行者准备新增 per-skill `index.mjs` 或 blocking gate。
- **操作步骤**：When 执行者对照本 spec 的非目标和隐性必达。
- **预期结果**：Then 该新增被识别为越界，需要另走后续任务或人工决策，不属于 M14a。

## 4. 功能需求

### 域：CONTRACT（审计契约）

- **FR-CONTRACT-001**：系统必须定义 execution trace 契约字段，覆盖身份与层次、执行上下文、时间与结果、事实引用四类字段。来源：D1。
  - **场景**：Given 下游需要实现执行记录，When 读取契约字段表，Then 能看到 `run_id`、`session_id`、`stage`、`step_id`、`attempt_id`、`parent_step_id`、`skill`、`skill_version`、`agent_id`、`issue_id`、`task_id`、`task_dir`、`target_repo_root`、`worktree_root`、`branch`、`started_at`、`completed_at`、`status`、`exit_code`、`duration_ms`、`retry_of`、`transcript_refs`、`artifact_refs`、`facts_refs`、`provenance`、`schema_version`、`collector_version`。

- **FR-CONTRACT-002**：系统必须把原始 `version` 拆分为 `skill_version`、`schema_version`、`collector_version`，禁止保留含义模糊的单一版本字段。来源：D1/D4。
  - **场景**：Given 审查者看到一条执行记录，When 核查版本字段，Then 能分别判断 skill 契约、schema 契约和采集实现版本。

- **FR-CONTRACT-003**：系统必须提供字段归属表，至少声明每个字段的归属层、生成者、采集方式、消费视图和可信来源。来源：scope.in。
  - **场景**：Given 某字段出现异常，When 读取字段归属表，Then 能知道应由哪个层负责生成和修复，不靠猜测。

- **FR-CONTRACT-004**：系统必须要求关键事实可追溯到 transcript、artifact、facts、provenance 或明确人类来源；来源未知时必须表达为 unknown，不得假绿。来源：scope.in/D1。
  - **场景**：Given review 事实缺少机器证据，When 生成执行事实，Then 结果记录为 unknown 或人类来源，而不是 pass。

- **FR-CONTRACT-005**：系统必须固定首批 `failure_domain` 为九个领域词：`task_dir`、`worktree`、`review`、`verify`、`handoff`、`transcript`、`skill_missing`、`artifact_missing`、`token_waste`；taxonomy 不得包含 severity、root cause、修复建议或判断算法。来源：D2。
  - **场景**：Given 一次失败要分类，When 选择 failure_domain，Then 只能从九个领域词选择，不在词表文件中写诊断逻辑。

- **FR-CONTRACT-006**：系统必须定义 `skills-inventory.schema.json` 作为 repo skill registry 的唯一字段口径，且该 schema 不得新增 per-skill 机器执行入口。来源：D5/D6。
  - **场景**：Given 需要登记一个 skill，When 读取 inventory schema，Then 能知道元数据字段要求，但不会看到要求实现 `index.mjs` 或等价入口。

- **FR-CONTRACT-007**：系统必须定义 `harness-surface.md`，覆盖 schema、orchestrator、skills、adapters、dashboard 五类 surface；每类必须声明 `risk`、`owner`、`permission`、`validation_method`。来源：D3。
  - **场景**：Given 未来评估某个 surface 是否可进入自进化候选池，When 读取 surface 表，Then 能看到风险、归属、权限和验证方式。

- **FR-CONTRACT-008**：系统必须定义权限语义 `locked`、`append_only`、`editable`、`human_controlled`，并说明它们只表达契约边界，不实现权限系统。来源：D3。
  - **场景**：Given 一个 surface 标为 `human_controlled`，When 下游实现读取文档，Then 知道它需要人类控制边界，但本阶段不新增权限执行系统。

- **FR-CONTRACT-009**：系统必须定义契约版本与采集实现版本的分离规则：字段、词表、surface 语义变化 bump 契约版本；parser bugfix、采集脚本重构、性能优化只 bump 实现版本；采集实现必须声明支持的契约版本范围。来源：D4。
  - **场景**：Given parser 只修复了读取 bug，When 记录版本变化，Then 只更新 collector_version，不更新 schema_version。

- **FR-CONTRACT-010**：系统必须在 required_reads 中列出下游必读文件，包括本 spec、execution trace schema、failure taxonomy、skills inventory schema、harness surface、constitution check、baseline report 和 review summary。来源：build-spec 3.8。
  - **场景**：Given build-plan 即将开始，When 读取质量事实契约，Then 能获得完整必读文件清单。

### 域：STRUCTURE（规格结构）

- **FR-STRUCTURE-001**：spec.md 必须包含三层结构：速读卡、正文、附录；速读卡必须位于文件顶部 30 行内。来源：build-spec FR-STRUCTURE-001。
  - **场景**：Given 读者打开 spec，When 只读前 30 行，Then 能理解需求、核心改动、影响面和验收信号。

- **FR-STRUCTURE-002**：spec.md 必须包含 Known Gaps 段，即使当前为空也要显式列出。来源：build-spec FR-STRUCTURE-002。
  - **场景**：Given 后续阶段查找留白事项，When 读取 Known Gaps，Then 能看到已知缺口或“当前无新增缺口”的声明。

### 域：ARTIFACT（产物）

- **FR-ARTIFACT-001**：本阶段必须以 artifact-first 方式产出长报告，只在回报中传路径，不内联长日志。来源：build-spec 3.10。
  - **场景**：Given 审查报告超过 500 字，When build-spec 汇报结果，Then 汇报只给结论和路径。

## 5. 模块划分（条件触发）

### Execution Trace Contract

- **负责什么**：定义执行事实字段、来源约束和版本分离。
- **对外提供什么业务能力**：让下游能实现可核查的执行记录。
- **需要哪些上游业务能力**：make-decision D1/D4 的字段范围和版本规则。
- **验收边界**：schema 文件存在、字段覆盖完整、无诊断算法。

### Quality Failure Taxonomy

- **负责什么**：定义首批 failure_domain 领域词。
- **对外提供什么业务能力**：让失败事实有一致领域标签。
- **需要哪些上游业务能力**：make-decision D2 的九词表。
- **验收边界**：词表只含领域说明，不含 severity/root cause/solution/algorithm。

### Skills Inventory Contract

- **负责什么**：定义 repo skill registry 字段口径。
- **对外提供什么业务能力**：让 skill 元数据登记可统一校验。
- **需要哪些上游业务能力**：make-decision D5/D6。
- **验收边界**：schema 文件存在，且不要求 per-skill 执行入口。

### Harness Surface Contract

- **负责什么**：定义 schema、orchestrator、skills、adapters、dashboard 五类 surface 的风险和权限边界。
- **对外提供什么业务能力**：让未来自进化候选池有边界输入。
- **需要哪些上游业务能力**：make-decision D3。
- **验收边界**：每类 surface 均有 risk/owner/permission/validation_method。

## 6. 关键实体（条件触发）

### Execution Trace Record

- **定义**：一次 stage 或 step 执行的审计记录。
- **字段**：见 `execution-trace.schema.json`。
- **关系**：通过 `parent_step_id`、`retry_of`、`task_id`、`issue_id` 与任务、步骤和重试链关联。

### Failure Domain

- **定义**：失败所属领域的受控词。
- **字段**：`domain`、`description`、`included_signals`、`excluded_meanings`。
- **关系**：可被执行事实或审查报告引用，但不携带解决方案。

### Skill Inventory Entry

- **定义**：repo 内一个 skill 的登记条目。
- **字段**：见 `skills-inventory.schema.json`。
- **关系**：与 skill 文件、owner、stage、version 和 portability metadata 关联。

### Harness Surface

- **定义**：harness 中可能被审查、修改或纳入候选池的边界面。
- **字段**：`surface`、`risk`、`owner`、`permission`、`validation_method`。
- **关系**：与未来自进化候选池评估相关，但本阶段不自动推荐或修改。

## 7. 数据和生命周期（条件触发）

- **数据粒度**：单次执行记录、单个 failure_domain、单个 skill 条目、单个 surface 条目。
- **数据时效**：契约文件随 repo 版本演进；执行 trace 实例随任务执行产生。
- **数据归属与生命周期约束（用户可见）**：契约归 workflowhub repo；任务执行记录归 task_tracking_root；长日志只通过引用保存。
- **清理策略**：本阶段不定义清理实现；只要求引用目标可追溯，缺失时表达为 unknown。

## 8. 兼容性预留（条件触发）

- **向后兼容**：现有 execution record 可在后续阶段映射到新 trace 契约；M14a 不要求立即迁移历史记录。
- **扩展预留**：schema 使用 `schema_version` 和 `collector_version` 分离；future 字段必须通过契约版本变更引入。

## 9. 不做和隐性必达

### 明确不做

1. 不写诊断算法。
2. 不做 blocking gate。
3. 不做自进化建议。
4. 不新增 per-skill 机器执行入口。
5. 不实现采集 parser。
6. 不照搬外部工具权限系统。

### 隐性必达

- **事实不假绿**：缺少机器证据时记录 unknown 或人类来源，不声明 pass。
- **质量不阻断**：本阶段质量检查只记录和浮现，不把记录型检查变成 gate。
- **字段窄口径**：新增字段必须能映射到 D1-D6 或 build-spec 质量要求。
- **下游可引用**：所有长报告和契约产物必须有稳定路径。

## 10. 验收清单及未决问题

### 验收检查（success_criteria）

- [ ] **AC-CONTRACT-001**：`execution-trace.schema.json` 存在，且包含 D1 列出的身份、上下文、时间结果、事实引用字段。反向：任一 D1 必需字段缺失即失败。← FR-CONTRACT-001
- [ ] **AC-CONTRACT-002**：schema 使用 `skill_version`、`schema_version`、`collector_version`，不保留单一含义不明的 `version` 字段。反向：存在必填 `version` 字段即失败。← FR-CONTRACT-002
- [ ] **AC-CONTRACT-003**：spec 或 schema 附录包含字段归属表。反向：字段没有归属层/生成者/采集方式/消费视图/可信来源即失败。← FR-CONTRACT-003
- [ ] **AC-CONTRACT-004**：事实来源约束明确 unknown 语义。反向：缺证据时允许声明 pass 即失败。← FR-CONTRACT-004
- [ ] **AC-CONTRACT-005**：`quality-failure-taxonomy.md` 只列九个首批 `failure_domain`，且不含 severity/root cause/solution/algorithm 字段。反向：词表外新增领域或出现算法语义即失败。← FR-CONTRACT-005
- [ ] **AC-CONTRACT-006**：`skills-inventory.schema.json` 存在，且不要求 `index.mjs` 或等价 per-skill 入口。反向：schema 要求机器执行入口即失败。← FR-CONTRACT-006
- [ ] **AC-CONTRACT-007**：`harness-surface.md` 覆盖 schema/orchestrator/skills/adapters/dashboard，且每项都有 risk/owner/permission/validation_method。反向：任一 surface 或字段缺失即失败。← FR-CONTRACT-007
- [ ] **AC-CONTRACT-008**：权限枚举定义 `locked`/`append_only`/`editable`/`human_controlled`，并声明不实现权限系统。反向：把权限枚举写成执行系统即失败。← FR-CONTRACT-008
- [ ] **AC-CONTRACT-009**：版本规则区分契约版本与采集实现版本。反向：parser bugfix 导致 schema_version 变化即失败。← FR-CONTRACT-009
- [ ] **AC-CONTRACT-010**：质量事实契约列出 required_reads。反向：build-plan 无法从本 spec 找到必读路径即失败。← FR-CONTRACT-010
- [ ] **AC-STRUCTURE-001**：速读卡在文件顶部 30 行内。反向：打开文件前 30 行看不到一句话需求和核心改动即失败。← FR-STRUCTURE-001
- [ ] **AC-STRUCTURE-002**：Known Gaps 段存在。反向：无 Known Gaps 标题即失败。← FR-STRUCTURE-002
- [ ] **AC-ARTIFACT-001**：长报告以文件路径引用。反向：阶段回报内联超过 500 字长报告即失败。← FR-ARTIFACT-001

### 未决风险和问题

- **~~execution trace 新文件还是扩展旧 schema —— 已决~~**：本 spec 选择新建 `execution-trace.schema.json`，避免把未来契约误写成现状能力。
- **~~permission 命名是否微调 —— 已决~~**：沿用 D3 四级命名。
- **Known Gaps**：本阶段不定义诊断算法、blocking gate、自进化建议、per-skill 机器执行入口、采集 parser 或权限执行系统；这些是刻意留白，不是遗漏。

## 11. 影响范围（业务性质）

- **受影响功能：执行记录契约**
  - 既有行为：执行事实字段分散，部分事实只能从叙述推断。
  - 本需求影响：后续实现有统一字段和来源约束。
  - 回归要点：不得把未知事实写成通过。

- **受影响功能：审查和验证事实**
  - 既有行为：3rd-review 是否真跑、verify 是否 fresh 可能不可追溯。
  - 本需求影响：review/verify 相关事实必须有 transcript/artifact/facts/provenance 或 human source。
  - 回归要点：审查不可用时应记录 unknown，不应假装 pass。

- **受影响功能：skill registry**
  - 既有行为：skill 元数据口径未由唯一 schema 约束。
  - 本需求影响：后续 inventory 以本 schema 为字段口径。
  - 回归要点：不新增 per-skill 执行入口。

- **受影响功能：harness surface**
  - 既有行为：可编辑 surface 边界没有统一表。
  - 本需求影响：五类 surface 都有 risk/owner/permission/validation_method。
  - 回归要点：surface 文档不等于自动授权或自进化建议。

- **明确无影响**：不改变当前 runtime 调度行为；不改变现有 review runner 调用方式；不迁移历史 execution records；不推送远端分支。

## 附录 A：字段归属表

| 字段 | 归属层 | 生成者 | 采集方式 | 消费视图 | 可信来源 |
|---|---|---|---|---|---|
| `run_id` | orchestration | runtime | machine | trace tree | runtime facts |
| `session_id` | orchestration | runtime | machine | trace tree | runtime facts |
| `stage` | workflow | stage runner | machine | stage timeline | stage context |
| `step_id` | workflow | stage/skill | machine or declared | step timeline | skill contract |
| `attempt_id` | workflow | retry controller | machine | retry chain | runtime facts |
| `parent_step_id` | workflow | stage/skill | machine or declared | hierarchy | skill contract |
| `skill` | skill | stage/skill | declared | skill inventory | SKILL.md |
| `skill_version` | skill | skill author | declared | audit/version view | SKILL.md frontmatter |
| `agent_id` | platform | Multica/runtime | machine | actor view | issue assignment/runtime |
| `issue_id` | platform | Multica/runtime | machine | issue trace | issue metadata |
| `task_id` | workflow | orchestrator | declared | task view | decision-log/stage context |
| `task_dir` | tracking | task-dir parser | machine | artifact lookup | task record paths |
| `target_repo_root` | repo | worktree context | machine | repo view | worktree.json |
| `worktree_root` | repo | worktree context | machine | repo view | worktree.json |
| `branch` | repo | worktree context | machine | repo view | worktree.json/git |
| `started_at` | runtime | runner | machine | timeline | execution record |
| `completed_at` | runtime | runner | machine | timeline | execution record |
| `status` | runtime | runner | machine | result view | execution record |
| `exit_code` | runtime | command runner | machine | result view | process result |
| `duration_ms` | runtime | runner | machine | metrics | execution record |
| `retry_of` | runtime | retry controller | machine | retry chain | execution record |
| `transcript_refs` | evidence | runner/platform | machine | evidence view | transcript artifact |
| `artifact_refs` | evidence | runner/stage | machine | evidence view | artifact path |
| `facts_refs` | evidence | collector | machine | facts view | facts artifact |
| `provenance` | evidence | collector/stage | machine or human declared | audit view | provenance record |
| `schema_version` | contract | contract owner | declared | compatibility view | schema file |
| `collector_version` | collector | collector owner | declared | compatibility view | collector release |

## 附录 B：质量事实契约

### 1. scope 边界

- **IN**：execution trace/schema 字段范围、字段归属表、quality-failure-taxonomy、skills-inventory.schema.json、harness-surface、版本分离规则、事实来源约束。
- **OUT**：诊断算法、blocking gate、自进化建议、per-skill 机器执行入口、采集 parser 实现、外部工具权限系统照搬。
- **裁剪机制**：所有新增内容必须能映射到 D1-D6；无法映射的内容记为 Known Gaps 或下游任务，不进入本阶段契约。

### 2. 自检结果

| 检查 | 结果 | 说明 |
|---|---|---|
| spec-ladder 档位已声明 | pass | B 档已在速读卡声明。 |
| FR 编号格式 | pass | 使用 `FR-CONTRACT-*`、`FR-STRUCTURE-*`、`FR-ARTIFACT-*`。 |
| 每个 FR 有 Given/When/Then 场景 | pass | 每条 FR 均有场景。 |
| 五章硬门完整 | pass | 速读卡、FR、不做、验收、影响范围均存在。 |
| spec↔decision-log 覆盖率 | pass | D1-D6 均映射到 FR。 |
| 无澄清占位残留 | pass | 无需人工澄清的问题。 |
| Known Gaps 段存在 | pass | 已在未决风险和本附录列出。 |
| Spec-Purity grep | warn | 本 spec 包含 contract 文件名、字段名和路径引用；为契约规格必要内容，不是实现算法。 |
| Artifact-first | pass | 长报告写入 artifact 文件，回报只传路径。 |
| FR 行为验证 | pass | 场景描述系统行为，不包含实现代码。 |

### 3. 独立审查摘要

- **verdict**：unknown
- **摘要路径**：`/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/m14a-audit-contract-layer/reviews/verdict-build-spec-4af31a97-7382-4973-b8f8-f259189bfb42-round-1.raw.json`
- **说明**：Step 3.7 在 Claude CLI 修复后重试，仍返回 `escalate_to_human` / `actual_mode=not_executed`，`failure_reason=claude-code-non-zero-exit`，`resolutionSummary=claude-code-non-zero-exit; attempts=1; status=143`。最小 Claude CLI 请求可成功；完整 wh-review 材料调用仍无可解析 verdict。这不是异源审查通过证据，按 build-spec auto-advance unknown 分支停止等待人工裁决。

### 4. 未解风险

- `[FRICTION] spec-purity grep`: 契约规格不可避免包含 schema 文件名和字段名；建议审查时区分“契约字段定义”和“实现细节泄露”。
- `[FRICTION] 3rd-review unavailable`: Claude Code runner 两次返回 `claude-code-non-zero-exit`，第二次发生在最小 Claude CLI 已恢复后；完整审查仍未得到可解析 pass verdict，按 auto-advance 规则停止等待人工裁决。
- 当前无 decision-log 覆盖缺口。
- scope-triage 命中 `blocking` / `阻断`，均位于“明确不做”或“非阻断记录语义”上下文；不是执行阻断语义。

### 5. handoff required_reads

1. `specs/m14a-audit-contract-layer/spec.md`
2. `specs/m14a-audit-contract-layer/execution-trace.schema.json`
3. `specs/m14a-audit-contract-layer/quality-failure-taxonomy.md`
4. `specs/m14a-audit-contract-layer/skills-inventory.schema.json`
5. `specs/m14a-audit-contract-layer/harness-surface.md`
6. `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/m14a-audit-contract-layer/artifacts/build-spec-constitution-check.md`
7. `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/m14a-audit-contract-layer/artifacts/build-spec-baseline-report.md`
8. `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/m14a-audit-contract-layer/artifacts/build-spec-f10-analysis.md`
9. `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/m14a-audit-contract-layer/reviews/`

## 附录 C：设计决策

- 选择新建 execution trace schema，而不是直接扩展现有 record schema。
- failure taxonomy 只保留领域词，不混入 root cause、severity 或修复建议。
- harness surface 权限枚举只表达边界，不实现权限系统。
- 版本分离是契约稳定性的核心，不把 parser bugfix 伪装成契约变更。

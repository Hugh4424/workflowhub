# Data Contracts: M14a 审计契约层

## 1. Execution Trace Record

- **Owner side**：workflow/runtime、stage runner、skill、task-path/worktree context、metrics/evidence collector
- **Consumer side**：审查器、trace/facts/dashboard 视图、后续诊断与验证流程
- **Format**：JSON object；权威 schema 为 `execution-trace.schema.json`
- **Required fields/types**：
  - 身份与层次：`run_id:string`、`session_id:string`、`stage:string`、`step_id:string`、`attempt_id:string`、`skill:string`、`skill_version:string`、`task_id:string`
  - 上下文：`task_dir:string`、`worktree_root:string`；`parent_step_id`、`agent_id`、`issue_id`、`target_repo_root`、`branch` 可为 `string|null`
  - 时间与结果：`started_at:string(date-time)`、`status:enum`；`completed_at:string(date-time)|null`、`exit_code:integer|null`、`duration_ms:integer|null`、`retry_of:string|null`
  - 事实引用：`transcript_refs:ref[]`、`artifact_refs:ref[]`、`facts_refs:ref[]`、`provenance:object`
  - 版本：`schema_version:string`、`collector_version:string`
- **Validation rules**：必填字符串非空；`duration_ms >= 0`；`status` 仅允许 `pending|running|success|failed|blocked|unknown|skipped`；每个 ref 必须符合 schema 的引用定义；`provenance` 必含 `source_type`、`source_ref`、`confidence`，来源不可证实时使用 `unknown`，不得假写 `pass/success`；禁止含义模糊的单一 `version`。
- **Version/compatibility**：字段、枚举、事实语义变化 bump `schema_version`；采集 bugfix/重构/性能优化只 bump `collector_version`；collector 必须声明支持的 schema 版本范围；M14a 不要求迁移历史 execution record。

## 2. Failure Domain Taxonomy

- **Owner side**：workflowhub contract owner
- **Consumer side**：execution trace、审查报告、后续诊断实现
- **Format**：Markdown 受控词表；权威文件为 `quality-failure-taxonomy.md`
- **Required fields/types**：每个条目含 `domain:string`、`description:string`、`included_signals:string/list`、`excluded_meanings:string/list`
- **Validation rules**：`domain` 仅允许 `task_dir`、`worktree`、`review`、`verify`、`handoff`、`transcript`、`skill_missing`、`artifact_missing`、`token_waste`；不得加入 severity、root cause、修复建议、solution 或判断算法。
- **Version/compatibility**：词表成员或语义变化属于契约变化，必须 bump 契约版本；本期为封闭首批九词表。

## 3. Skills Inventory Document

- **Owner side**：repo skill registry 维护者
- **Consumer side**：skill 发现、审计、可移植性/指标覆盖视图
- **Format**：JSON object；权威 schema 为 `skills-inventory.schema.json`
- **Required fields/types**：顶层 `schema_version:string`、`generated_at:string(date-time)`、`skills:array`。每个 skill 必含 `name:string`、`path:string`、`version:string|null`、`stage:string|null`、`owner:string|null`、`source:repo|external_adapted|unknown`、`portable:boolean`、`metrics_expected:boolean`、`subagent_friendly:boolean`；可选 `description`、`inputs:string[]`、`outputs:string[]`、`required_reads:string[]`、`notes`。
- **Validation rules**：顶层和 skill entry 不允许未声明字段；必填名称/路径非空；schema 只登记元数据，不得要求 `index.mjs` 或任何 per-skill 机器执行入口。
- **Version/compatibility**：inventory 字段或枚举变化 bump `schema_version`；新增 skill 条目不等于 schema 版本变化。

## 4. Harness Surface Registry

- **Owner side**：workflowhub harness/contract owner
- **Consumer side**：人工治理、未来候选池评估、审查者
- **Format**：Markdown 表格；权威文件为 `harness-surface.md`
- **Required fields/types**：每项含 `surface`、`risk`、`owner`、`permission`、`validation_method`；`surface` 必覆盖 `schema`、`orchestrator`、`skills`、`adapters`、`dashboard`。
- **Validation rules**：`permission` 仅允许 `locked|append_only|editable|human_controlled`；每类 surface 的四个描述字段均非空；权限值只表达契约边界，不得解释为已实现授权、自动修改或 blocking enforcement。
- **Version/compatibility**：surface 类别、字段或权限语义变化 bump 契约版本；普通说明修订保持向后兼容。

## 5. Field Ownership Mapping

- **Owner side**：contract owner；各字段实际生成者包括 runtime、stage/skill、platform、task-dir parser、worktree context、collector
- **Consumer side**：实现者、审查者、故障归属与兼容性视图
- **Format**：`spec.md` 附录中的 Markdown 表格
- **Required fields/types**：每个 execution trace 字段必须映射 `字段`、`归属层`、`生成者`、`采集方式`、`消费视图`、`可信来源`
- **Validation rules**：execution trace schema 的每个字段都必须有归属行；机器事实与 declared/human 来源必须区分；无法确认的来源必须显式为 `unknown`。
- **Version/compatibility**：schema 字段增删改时同步更新归属表；归属变化需作为契约变更审查。

## 6. Downstream Required Reads Handoff

- **Owner side**：build-spec/build-plan stage
- **Consumer side**：build-plan、build-code、verify-code 与独立审查者
- **Format**：稳定路径列表
- **Required fields/types**：必须引用 spec、execution trace schema、failure taxonomy、skills inventory schema、harness surface、constitution check、baseline report、F10 analysis、review/diagnosis summary。
- **Validation rules**：长报告只传引用，不内联正文；repo 产物优先使用 repo-relative 路径，task execution 产物使用 canonical task root；引用缺失时记录 `unknown/unavailable`，不得假定通过。
- **Version/compatibility**：文件重命名或移动必须同步更新 required reads；M14a 不改变 runtime 调度或 review runner API。

# 实施计划：m14a-audit-contract-layer

## Summary

以“schema + 解释性文档”为最小实现：完成 execution trace、failure taxonomy、skill inventory、harness surface 四份契约，复用现有 task path、metrics、stage-result、review 与 evidence 事实源；不新增采集器、诊断器、blocking gate、权限系统或 per-skill runtime。

**minimal-path**: P1 — 直接复用 JSON Schema、Markdown 及现有 task path/metrics/review/evidence 机制，只补契约与静态验证。

## Technical Context

- **Language/Version**: JSON Schema Draft 2020-12、Markdown；静态验证使用仓库现有 Node.js ESM 测试环境（具体 Node.js 版本未在 spec 指定）
- **Primary Dependencies**: Node.js 标准库与仓库现有测试栈；不新增依赖
- **Storage**: `specs/m14a-audit-contract-layer/` 中的 repo-relative 契约产物；task execution 记录沿用 canonical task root
- **Testing**: 仓库现有 Vitest 栈；`npx vitest run tests/m14a-audit-contract-layer.test.mjs`，覆盖 JSON 可解析、required/enum/static text assertions 与禁止项扫描
- **Target Platform**: workflowhub repository 与现有 CI/本地 Node.js 环境
- **Project Type**: AI workflow orchestration contract repository
- **Performance Goals**: N/A — 本期只定义静态契约，不新增运行时热路径
- **Constraints**: 未知不得假绿；契约版本与 collector 版本分离；taxonomy 九词封闭；权限仅为治理语义；不得改变 runtime/review API
- **Scale/Scope**: 修改 4 个现有 feature contract 文件并新增 1 个聚焦测试文件；计划与任务产物另计

## Constitution Check

### Framework Principles (F)

- [x] **F1 薄核心** — 只定义外围契约文件，不把采集、诊断或授权逻辑塞入 runtime 核心。
- [x] **F2 窄契约** — 两份 schema 与两份受控 Markdown 只暴露明确字段、枚举和兼容规则。
- [x] **F3 物理事实靠机器校验但不阻断** — 静态测试验证文件结构；契约明确记录事实与 unknown，不引入 blocking quality gate。
- [x] **F4 质量靠异源审查与人而非阻断式质量门** — 计划保留独立审查和人工确认，不把 schema 变成质量裁决器。
- [x] **F5 gate 谨慎添加出事再补无用则移除** — 不新增 CI gate，仅在现有测试栈加入契约回归测试。
- [x] **F6 统一外置执行记录** — execution trace 引用现有 task record、metrics、stage-result、review、evidence，而非复制事实。
- [x] **F7 推进与不可逆操作不自动越过人** — harness permission 仅描述边界，不授权自动修改；阶段仍由既有人工检查点控制。
- [x] **F8 简单优先** — 采用 P1 复用路径，不新增依赖、parser、registry runtime 或兼容层。
- [x] **F9 可证伪不假绿** — provenance 允许并要求无法证明时表达 unknown；静态测试包含反向断言。
- [x] **F10 自动化按真实收益添加，不为“机器可校验”本身堆基建** — 只保留仓库现有 Vitest 可执行的窄回归测试。

### Quality Principles (Q)

- [x] **Q1 记事实而非阻断** — taxonomy 与 trace 记录领域、来源、状态，不输出修复算法或自动裁决。
- [x] **Q2 gate 三类划分** — 本期 schema validation 属入口/记录校验，人工确认仍独立；无记录型阻断门。
- [x] **Q3 异源审查加人工把关** — build-plan 独立审查与人工 checkpoint 保持既有边界。

### Skill Principles (S)

- [x] **S1 能用外部就不造轮子** — 使用 JSON Schema 标准与 Markdown，不造自定义 schema language。
- [x] **S2 外部技能可针对项目改造合宪** — 本计划不引入外部技能；标准格式按 workflowhub 事实源约束落地。
- [x] **S3 迭代时保持最新并就地检查** — schema 声明 draft 与版本规则，测试就地核查枚举/required。
- [x] **S4 自定义技能必须有指标系统** — 未新增 skill；inventory 仅声明 `metrics_expected`，不复制指标实现。
- [x] **S5 自定义技能方便子代理调用省主上下文** — 未新增 skill；required reads 传稳定路径而非内联长报告，便于子代理读取。
- [x] **S6 自定义技能参考市面方案不闭门造车** — 使用 JSON Schema Draft 2020-12 与现有 metrics/task record 模型。
- [x] **S7 一阶段一技能一工作流一文件夹** — 不改 workflow/skill 目录结构；契约集中于单一 feature spec 目录。
- [x] **S8 自定义技能可独立调用可搬运** — 未新增 skill；契约示例采用 repo/task-root relative 引用，避免固化本机路径。

## Project Structure

### Documentation (this feature)

```text
specs/m14a-audit-contract-layer/
├── spec.md                          # MODIFY：权威需求、审查事实与 handoff 路径
├── research.md                      # UNCHANGED：已有机制与风险
├── data-contracts.md                # UNCHANGED：跨边界契约摘要
├── execution-trace.schema.json      # MODIFY：trace/provenance/version 契约
├── quality-failure-taxonomy.md      # MODIFY：九领域封闭词表
├── skills-inventory.schema.json     # MODIFY：skill registry 元数据契约
├── harness-surface.md               # MODIFY：五类 surface 与权限语义
├── plan.md                          # NEW：本计划
└── tasks.md                         # NEW：实施任务
```

### Source Code (repository root)

```text
tests/
└── m14a-audit-contract-layer.test.mjs # NEW：窄静态契约回归测试
```

## Complexity Tracking

No constitution violations requiring justification. 上游 spec 的 Claude Code 正式 flow 为 `not_executed/unknown`。Kimi Code CLI 首轮与 round 2 的结论为 `revise`；修订后的 round 3 结论为 `pass`、`findings=none`，证据见 task root 下 `artifacts/build-plan-kimi-review-round3.md`。此前“首轮和本轮均为 revise”的 wording 是 round 3 完成前的过时记录，本计划以 round 3 报告为当前结论。

## Implementation Steps

### Phase 1: Setup / Foundation

#### Step 1.1: 固化共享版本、引用与事实来源语义

- **做什么**：完善 `execution-trace.schema.json`，覆盖 D1 字段、层次关系、状态、非空引用、provenance/unknown 语义，以及 `skill_version`/`schema_version`/`collector_version` 分离与支持范围。
- **涉及文件**：`specs/m14a-audit-contract-layer/execution-trace.schema.json`
- **映射需求**：FR-CONTRACT-001、FR-CONTRACT-002、FR-CONTRACT-003、FR-CONTRACT-004、FR-CONTRACT-009

#### Step 1.2: 固化窄失败领域词表

- **做什么**：完善 `quality-failure-taxonomy.md` 的九项封闭表格、included/excluded 语义和版本规则；明确不含 severity/root cause/solution/algorithm。
- **涉及文件**：`specs/m14a-audit-contract-layer/quality-failure-taxonomy.md`
- **映射需求**：FR-CONTRACT-005、FR-CONTRACT-009

### Phase 2: Core Implementation

#### Step 2.1: 完成 skill inventory 元数据 schema

- **做什么**：完善顶层及 entry 的 required/type/enum/additionalProperties 约束，包含 portability、metrics、subagent 与 required reads 元数据；明确不要求 `index.mjs`。
- **涉及文件**：`specs/m14a-audit-contract-layer/skills-inventory.schema.json`
- **映射需求**：FR-CONTRACT-006、FR-CONTRACT-009、FR-CONTRACT-010

#### Step 2.2: 完成 harness surface 治理文档

- **做什么**：为 schema/orchestrator/skills/adapters/dashboard 五类 surface 填写 risk、owner、permission、validation_method，定义四个 permission 值只表示治理边界。
- **涉及文件**：`specs/m14a-audit-contract-layer/harness-surface.md`
- **映射需求**：FR-CONTRACT-007、FR-CONTRACT-008、FR-CONTRACT-009

### Phase 3: Polish / Verification

#### Step 3.1: 增加聚焦静态契约测试并核对 handoff

- **做什么**：用仓库现有 Vitest 验证两份 JSON 可解析、required/enum/version 规则、九领域、五 surface、权限集合、unknown 与禁止项；核对 spec 的结构、Known Gaps 和 required_reads 仍完整。长报告仅引用路径。
- **涉及文件**：`tests/m14a-audit-contract-layer.test.mjs`、`specs/m14a-audit-contract-layer/spec.md`（只读核对）
- **映射需求**：FR-CONTRACT-001..010、FR-STRUCTURE-001、FR-STRUCTURE-002、FR-ARTIFACT-001

### Scope Boundary Verification

- 不修改 runtime 调度、`metrics/collector.mjs`、review runner API 或历史 execution records。
- 不新增 per-skill `index.mjs`、采集 parser、诊断器、自进化推荐、blocking CI gate、权限执行系统或第三方依赖。
- 不把本机绝对路径写进 schema 常量或示例；task execution 路径继续通过 canonical task root 解析。
- 实施代码/契约范围仅含四份契约与一个聚焦测试文件；`spec.md` 仅作验证输入。计划阶段另产生或更新 `plan.md`、`tasks.md`、`research.md`、`data-contracts.md` 与一致性分析产物，不计入上述五个实施文件。
- 当前 branch/review snapshot 还包含 `core/make-decision-worktree.mjs`、对应测试、`skills/wh-review/scripts/wh-review.mjs`、review runners、review resilience 测试，以及工作区的 `decision-payload.json`、`receipt-map.json`。按 git/review snapshot 事实，这些属于上游 make-decision 或审查基础设施，不是 M14a 四契约实施 task，也不纳入“四份契约 + 一个聚焦测试”的范围；本 stage 不声明曾修改或交付这些文件。

## F10 Anti-Over-Engineering Gate

| 提议项 | 真实已观察失败 | 已有覆盖 | 可绕过性 | 长期维护成本 | 结论 |
|---|---|---|---|---|---|
| 两份 JSON Schema | 执行事实/skill 元数据当前无唯一字段口径，unknown 与版本含义可漂移 | JSON Schema 标准可直接覆盖，现有文档不足以机器核对 | 生产者仍可不采用；但作为权威契约与测试输入并非安全 theatre | 低：随契约字段变化维护 | KEEP |
| 两份受控 Markdown | failure domain 和 surface 权限易混入诊断/授权实现语义 | Markdown 已是仓库契约载体 | 可被实现忽略，但审查者可直接核对范围 | 低：仅语义/枚举变化时更新 | KEEP |
| 聚焦 Vitest 回归测试 | 手改 schema/表格可能漏 required、九领域或五 surface | 仓库现有 Vitest 测试栈可复用 | 可不运行，但 CI/人工均可实跑；断言能真实失败 | 低：单文件静态断言 | KEEP |
| 新采集 parser/validator CLI | 无已观察到必须由新 runtime 解决的失败；本期只需契约 | 现有 collector/task path 已承担事实采集 | 容易旁路且形成第二事实模型 | 高且持续 | PRUNE |
| blocking CI gate/权限系统 | spec 明确非目标，无真实授权需求 | 现有人工审查/确认边界 | 可绕过并误导为 enforcement | 高且持续 | PRUNE |
| per-skill runtime/index | inventory 只需元数据口径 | 现有 skill discovery 已存在 | 新入口会造成双运行面 | 高且持续 | PRUNE |

**F10 alterations**：删除所有 parser、validator CLI、blocking gate、权限 enforcement、per-skill runtime 任务；保留四份契约与一个复用现有测试栈的静态测试。未产生需重跑 Steps 2–4 的后置修改，因为裁剪已直接反映在首次 plan/tasks 中。

## M10 Baseline Comparison

| 指标名 | M12 实值 | M10 baseline | delta |
|---|---|---|---|
| missed_step_rate | unknown（仅 upstream make-decision/build-spec 两段已完成且已落盘，全五段值待 verify-code 完成后才可计算） | 0.05 | unknown |
| test_execution_rate | unknown（build-plan 阶段无测试执行数据，待 build-code/verify-code） | 0.8295 | unknown |
| review_execution_rate | unknown（review 阶段尚未执行） | 1 | unknown |
| rework_rounds | unknown（全流程未完成，无返工数据） | 6.075 | unknown |
| rework_proxy_count | unknown（全流程未完成，无代理返工数据） | 25.25 | unknown |

## Verification Mapping

| Step | FR | AC | 验证方式 |
|---|---|---|---|
| 1.1 | FR-CONTRACT-001/002/003/004/009 | AC-CONTRACT-001/002/003/004/009 | JSON parse + required/version/provenance/ownership 对照与反向断言 |
| 1.2 | FR-CONTRACT-005/009 | AC-CONTRACT-005/009 | 九项集合精确相等；扫描禁止语义；核对版本规则 |
| 2.1 | FR-CONTRACT-006/009/010 | AC-CONTRACT-006/009/010 | JSON parse + entry required/additionalProperties；确认无机器入口字段；required reads 可定位 |
| 2.2 | FR-CONTRACT-007/008/009 | AC-CONTRACT-007/008/009 | 五 surface/四 permission 集合及每行四字段非空；无 enforcement 声明 |
| 3.1 | FR-CONTRACT-001..010、FR-STRUCTURE-001/002、FR-ARTIFACT-001 | AC-CONTRACT-001..010、AC-STRUCTURE-001/002、AC-ARTIFACT-001 | `npx vitest run tests/m14a-audit-contract-layer.test.mjs`；顶部 30 行、Known Gaps、artifact-first/required_reads 静态检查 |

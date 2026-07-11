# WorkflowHub 五阶段重构与步骤级审计

> 一句话需求：把 WorkflowHub 固定为五个连续 stage，并用 canonical manifest、journal 与 receipt 形成可追溯且 fail-closed 的需求保真与步骤审计链。
>
> 核心改动：统一 stage 拓扑、显式步骤合同、单一审计裁决、generic core/Multica adapter 分层，以及覆盖正常、失败、遗留与对抗场景的验证合同。

**Spec ladder：C 档。** 变更横跨五个 stage、执行记录、审计消费者、平台适配和迁移边界，且会冻结新的执行拓扑，需完整三层 spec 与额外影响分析。

**F10 四问。** 真实威胁是需求在阶段交接和隐式步骤中丢失、审计假绿；现有 journal/receipt 仅提供局部事实，未形成 canonical coverage 与单一 verdict；若消费者可自行裁决则可绕过，因此必须让 aggregator 成为唯一裁决者；长期成本来自五份 manifest、adapter 与 fixtures，控制手段是窄合同、复用 registry 和冻结拓扑后只按证据扩展。

## 问题陈述与目标

现行 WorkflowHub 的阶段动作、执行事实和需求来源没有同一条可机器核对的保真链。重构目标是让 `source → immutable requirement ID → decision → artifact → acceptance criteria` 可追溯，并让每个 stage 的 expected topology 与 observed facts 可比较。

## Clarifications

### Session 2026-07-11

- 未检测到需正式澄清的关键歧义；上游 final ledger 已裁定 R1–R9，R10 明确撤回。

## 范围

### IN

- 五个连续 stage 的职责、顺序与旧→新映射。
- 每 stage 的 canonical step manifest、entry/exit receipt、journal 对账。
- canonical requirement ledger、coverage、hash/stale DAG 与 fail-closed lifecycle。
- audit aggregator 单一裁决及 stage-result、validator、facts assembly 消费合同。
- generic core/Multica adapter 分层、迁移、复用 registry、文档和 fixtures。

### OUT

- R10 对应的额外自动化设计：已撤回，避免无收益基建。
- 具体实现语言、函数名和文件布局：留给 build-plan。
- 创建不存在 schema 的 project memory：上游已裁定 no change。
- 本阶段修改任何 `SKILL.md`：本阶段只定义产品与验收规格。

## 功能需求

### FR-STRUCTURE-001 — 五阶段 canonical topology（承接 R1、R3、R8）

系统必须把工作流表示为五个连续整数 stage；每 stage 只承担一个主要动作，并提供旧 stage 到新 stage 的无歧义映射。

- Given 一个旧流程定义，When 执行迁移映射，Then 每个旧动作恰好映射到一个新 stage，且新 stage 编号连续、无重复、无空洞。

### FR-CONTRACT-001 — 每阶段 canonical step manifest（承接 R1、R3、R4）

五个 stage 必须各有一份 canonical step manifest，声明稳定 step ID、顺序、入口条件、完成证据和可观察结果。

- Given 任一 stage 即将执行，When 加载其 manifest，Then 系统得到完整有序 expected step 集合，且每个 step 都有唯一稳定 ID；系统不得接受 ID 重复、编号不连续、依赖成环或顺序缺失的 manifest。

### FR-ARTIFACT-001 — entry/exit receipt 与 journal 事实（承接 R4）

每个 step 必须在进入和退出边界记录 receipt；journal 与 receipt 只描述 observed facts，不重写 expected topology。

- Given 一个 step 正常完成，When 审计其执行记录，Then 可找到同一 attempt 的匹配 entry 与 terminal exit receipt，且 journal 中的 step ID 与 manifest 一致；缺失任一边界 receipt、跨 attempt 拼接或 step ID 不一致时不得解释为完成。

### FR-ALIGN-001 — immutable requirement lineage（承接 R9）

每条接受需求必须持有不可变 requirement ID，并覆盖 source、decision、artifact 与 acceptance criteria 的完整映射；撤回项不得进入验收分母。

- Given R1–R9 accepted 且 R10 withdrawn，When 计算 coverage，Then 分母为 9、覆盖为 9/9，R10 仅保留历史状态而不影响 verdict。

### FR-REVIEW-001 — aggregator 单一审计真相源（承接 R5）

aggregator 必须基于 manifest 与 observed facts 计算 canonical verdict；stage-result、validator 和 facts assembly 只能引用或验证该 verdict，不得独立重算质量结论。

- Given manifest 与 journal/receipt 存在差异，When aggregator 完成对账，Then 仅 aggregator 产出 canonical verdict，所有消费者报告同一 verdict 与证据引用。

### FR-BEHAV-001 — fail-closed lifecycle（承接 R4、R9）

缺失、重复、乱序、未知、stale 或 hash 不一致的必需证据必须产生明确的非通过或 unknown 事实，不得被解释为成功。

- Given 一个必需 exit receipt 缺失，When aggregator 计算 verdict，Then 结果不为 pass，并明确列出缺失 step 与证据类型。

### FR-TRACKING-001 — hash 与 stale DAG（承接 R9）

需求、决策、产物和验收节点必须携带可验证关联；上游内容变化后，下游派生节点必须可被标记 stale，直到重新生成并建立新 hash 关系。

- Given 已验收 artifact 的上游 decision 发生变化，When 执行 lineage 校验，Then 相关 artifact 与 acceptance 节点标记 stale，旧 hash 不得继续支持 pass。

### FR-ACCOUNT-001 — canonical audit summary（承接 R4、R5、R9）

aggregator 必须输出结构化 audit summary，至少包含 expected/observed step、requirement coverage、缺失/额外/乱序/stale 事实、canonical verdict 和证据引用。

- Given 一个完整执行，When 请求 audit summary，Then 所有必需字段均存在，且计数可由 manifest、ledger、journal 与 receipt 重算验证；缺字段、不可重算计数或证据引用断裂时不得发布 pass summary。

### FR-SCOPETRIAGE-001 — consumer/evidence matrix（承接 R2）

复用或抽取机制必须由 consumer 数量、重复度、typed I/O、failure/skip/human semantics 的证据支持；未满足证据时维持局部实现。

- Given 两个候选消费者语义不同，When 评估是否抽取公共机制，Then matrix 显示差异并拒绝伪复用，不扩大本次范围。

### FR-CONTRACT-002 — generic core 与 Multica adapter（承接 R9）

generic core 只能消费 canonical input 并计算 coverage/audit；Multica adapter 只负责获取平台 source 并规范化为 canonical input，平台细节不得泄漏到 core 裁决。

- Given 同一 canonical ledger 分别来自 Multica 与离线 fixture，When 交给 generic core，Then 产生等价 audit summary 与 verdict。

### FR-COMM-001 — 合同、迁移与调用者文档（承接 R6、R7、R9）

交付必须包含 canonical schema、consumer 合同、复用 registry、旧→新迁移说明、失败语义与 caller 使用说明。

- Given 一个旧 caller 准备迁移，When 阅读交付文档，Then 能确定输入、输出、失败行为、旧字段映射和迁移完成信号，无需读取实现源码；文档不得省略 legacy/unknown、skip、retry、human gate 或错误码语义而诱导 caller 将未知状态当作成功。

### FR-BUILD-001 — 验证组合（承接 R6、R7、R9）

验证必须覆盖 unit、integration、legacy 与 adversarial fixtures，并证明五阶段拓扑、需求覆盖、单一 verdict、fail-closed、hash/stale 和 adapter/core 边界。

- Given 正常、遗留、缺证据、篡改 hash 与平台来源五类 fixture，When 运行验收套件，Then 每类产生预期可证伪结果，缺数据不得被零填或假绿。

- Given 五 stage 全链执行包含大量 receipt 与 retry attempt，When 验收套件对账全部记录，Then expected/observed 计数与逐项证据引用保持一致，且不得因分页、批量或顺序变化漏计。

### 补充行为场景

- Given 两个消费者同时读取同一执行的 audit summary，When validator 与 facts assembly 分别处理，Then 二者引用同一 aggregator verdict 与证据哈希，且不得产生独立或相互冲突的质量结论。（FR-REVIEW-001）
- Given 同一 step attempt 存在多个 terminal exit receipt，When aggregator 对账，Then 报告 duplicate 并使 verdict 不为 pass，且不得任取一条作为有效完成。（FR-BEHAV-001）
- Given journal 含 manifest 未声明的 step，When aggregator 对账，Then 报告 unexpected，且不得动态扩张 expected topology。（FR-BEHAV-001）
- Given receipt 顺序违反 manifest 依赖顺序，When aggregator 对账，Then 报告 out-of-order/dependency 事实，且不得通过重排记录假造 pass。（FR-BEHAV-001）
- Given adapter 无法完整获取权威 source，When 执行 canonical normalization，Then 返回 SOURCE_INCOMPLETE 或 unknown 且不提交空 ledger，系统不得以空分母计算 100% coverage。（FR-CONTRACT-002、FR-ALIGN-001）
- Given 遗留 caller 缺 canonical 必需字段，When 进入迁移边界，Then 返回可定位的 legacy/unknown 错误及迁移指引，且不得静默补默认值。（FR-COMM-001）

## 不做

- 不恢复已撤回 R10。
- 不在 spec 阶段决定函数、模块或命令行参数。
- 不新增阻断式质量门；机器记录物理事实，质量由异源审查与人工判断。
- 不让 adapter、validator、stage-result 或 facts assembly 成为第二个 verdict authority。

## 验收标准

- **AC-01**：定义集合为 `{make-decision, build-spec, build-plan, build-code, verify-code}`；5/5 stage 均为连续整数、单主要动作，且旧动作映射 100% 完整、每个旧动作恰好对应一个新 stage。
- **AC-02**：已裁定消费者集合为上述 5 个 stage 及 `{stage-result, validator, facts assembly}`；8/8 消费者进入 consumer/evidence matrix，并各有复用或不复用结论及证据。
- **AC-03**：5/5 stage manifest 定义稳定且唯一的 step ID、有序 expected topology、入口条件、完成证据和可观察结果。
- **AC-04**：分母为 5/5 stage manifest 内声明的全部 expected step；正常全链 fixture 中 100% expected step 各具同 attempt 匹配 entry/terminal exit receipt，并可与 journal 逐项对账。
- **AC-05**：裁决消费者集合为 `{stage-result, validator, facts assembly}`；3/3 只引用或验证 canonical audit summary，0/3 独立重算 verdict。
- **AC-06**：R1–R9 lineage coverage 为 9/9；R10 不进入分母；hash 变化可使下游 stale。
- **AC-07**：来源集合为 `{Multica source, offline fixture}`；2/2 规范化为同一 canonical input 后由 generic core 产生等价 summary/verdict，且 core 中平台专有依赖为 0。
- **AC-08**：验证层集合 `{unit, integration, legacy, adversarial}` 为 4/4；失效类型集合 `{missing, duplicate, out-of-order, unknown, tampered-hash, stale}` 为 6/6，且每类至少一个 fixture 证明 verdict 不会假绿。

## 影响范围

- **已有 stage 定义**：make-decision、build-spec、build-plan、build-code、verify-code 的编号、动作边界、条件分支与 handoff 合同需要迁移。
- **已有执行记录写入者**：stage executors 的 journal/receipt 写入需遵循 manifest step/attempt 和 entry/terminal exit 合同。
- **已有结果消费者**：stage-result 改为携带 audit summary 引用；validator 仅复算一致性；facts assembly 仅装配；迁移 caller 处理新失败语义。
- **新增 canonical 记录**：五份 manifest、immutable source manifest、requirements ledger、computed coverage、audit summary 与 reuse registry。
- **平台与离线场景**：Multica source 获取封装在 adapter；generic core 与离线 fixtures 不依赖平台细节。
- **运维与迁移场景**：新增 missing/unexpected/duplicate/out-of-order/drift/stale/source unavailable 可观察事实及 legacy/unknown 迁移错误；不新增服务、CI 基建或阻断式质量门。

本次主要新建审计能力并迁移上述既有调用边界；除条目化列出的 stage 定义、记录写入者、结果消费者和迁移 caller 外，无其他已有产品功能或用户场景应被破坏。

## Edge Cases & Failure Handling

上述 duplicate、unexpected、out-of-order、source unavailable 与 legacy missing fields 已转为“补充行为场景”的 GWT。stale 由 FR-TRACKING-001 的 GWT 覆盖；missing receipt 由 FR-BEHAV-001 的 GWT 覆盖。

## 约束与取舍

- 选择 canonical manifest + ledger + aggregator，换取唯一权威与可重算性；代价是维护五份 manifest 和迁移文档。
- 选择 narrow typed contracts，避免共享内部实现造成耦合。
- 选择记录事实与异源审查，不把质量判断做成自动阻断门。

## Known Gaps

- 具体 schema 字段、存储格式、模块布局和迁移批次由 build-plan 决定。
- 性能目标待基于实际 ledger/receipt 规模在计划阶段建立基线。
- 人工判断界面的 UX 不在本次实现范围。

## 设计决策

- **保留 R1–R9，撤回 R10**：替代方案是连同 resolver/creator、显式 base、dirty/ahead human gate 一并扩展；驳回因其不属于本次材料与验收分母，会制造无收益基建。R1–R9 均有用户确认与 final ledger 证据。
- **manifest 管 expected、journal/receipt 管 observed**：替代方案是由 journal 反推 expected topology；驳回因整步缺失时 journal 无记录，反推会把遗漏误判为不存在。
- **aggregator 单一裁决**：替代方案是 stage-result、validator、facts assembly 各自重算；驳回因多权威会产生漂移、冲突 verdict 与绕过路径。
- **generic core + Multica adapter**：替代方案是把平台获取逻辑嵌入裁决 core；驳回因平台细节会污染可复算合同、破坏离线 fixture 等价性并扩大迁移耦合。

## 质量事实契约

1. **scope 边界**：IN/OUT 见“范围”；裁剪机制为 final ledger 接受状态、consumer/evidence matrix 与 YAGNI。
2. **自检结果**：ladder pass；FR 编号 pass；每 FR Given/When/Then pass；五章 pass；R1–R9 对齐 pass；澄清残留 pass；Known Gaps pass；Spec-Purity warn（术语中出现实现产物名，均为合同级示例，无 shell 命令或绝对路径）。
3. **独立审查摘要**：unknown；待 wh-review build-spec 异源审查后回填 verdict 与报告路径。
4. **未解风险**：scope-triage 高危词命中“fail-closed/不得/必须”均用于验收语义，不是质量阻断门；decision-log 差异无；[FRICTION] metrics stage-start 首次调用缺 cfg 失败 | 建议：调用方统一提供 configForCollector。
5. **handoff required_reads**：本 spec；final decision ledger；constitution check；baseline report；异源审查报告；plain-language brief；stage-result-build-spec.json。

# 规范：设计上下文质量与建议式异源审查

## 1. 目标

让 `make-decision → build-spec → build-plan → build-code → verify-code` 的设计产物足够完整，同时让执行模型只加载完成当前 task 所需的最小上下文。目标是减少返工、上下文和 token 浪费，并保持可追踪、可测试、可审查的高质量交付。

信息分为产品事实、工程事实、task 执行投影和实现证据四层。每条事实只在所属层写一次；下游通过稳定、带版本身份的引用按需解析，不复制整段背景。

## 2. 范围与非目标

### 范围

- 统一 build-spec、build-plan、tasks 的内容合同、稳定 ID 和交接规则。
- 为 make-decision、build-spec、build-plan、verify-code 定义“异源审查只提供 findings”的呈现与处置规则。
- 为 build-code 定义按 task 的最小上下文投影要求。
- 为 verify-code 补充 accepted spec/plan/tasks 与当前实现证据的一致性核对。
- 对设计产物记录可用的已验证事实、未知项、风险、影响与验收方法。

### 非目标

- 不迁移全仓目录，不做 deletion test、架构清理、历史运行时重构、AJV/runtime 修复或模型路由改造。
- 不改变 build-code 现有的严格实现质量审查流程。
- 不让 verify-code 重跑 simplicity-guard 或重新做完整代码审查。
- 不新增第二套事实账本、审计系统、通用质量平台、packet 生命周期或 token 硬门。
- 不按模型能力、模型路由或供应商差异改变本合同。

## 3. 已验证产品事实

以下 PFACT 的共同正式证据是 accepted make-decision Decision Log `receipts/decision-log/53b8b4ce30048c61c3557e6364efcb5071e4c1a931aa0e7bc4eee5f97e078a9c.md`（hash `53b8b4ce30048c61c3557e6364efcb5071e4c1a931aa0e7bc4eee5f97e078a9c`）及 `results/make-decision/attempt-0001.json`（snapshot `069fee3ec905a7d95cbd04de26c5e5e5d00f05a6`）。这些是本任务的上游产品事实，不是实现完成证据。

- **PFACT-01 — 设计一次、按 task 投影。** 状态：`verified`；来源：D1。详细工程判断写一次，task 只保存必要引用，build-code 临时投影关联片段。影响 FR-01、FR-10、FR-11、FR-16 及 AC-01、AC-09、AC-10、AC-19、AC-20。
- **PFACT-02 — 产品与工程事实分层。** 状态：`verified`；来源：D2。spec 管 PFACT/FR/AC，plan 管 ANCHOR/FACT/DEC/CTRL，plan 只单向引用 spec。影响 FR-04 至 FR-07 及 AC-03 至 AC-05。
- **PFACT-03 — task 是静态设计产物。** 状态：`verified`；来源：D5。tasks 只表达可否开始、停止和恢复，运行状态外置。影响 FR-03、FR-10 及 AC-08、AC-16。
- **PFACT-04 — 工程质量和最终验证分工。** 状态：`verified`；来源：D4、D6、D10。plan 设计工程决定，build-code 审实际实现，verify 用当前证据核对已接受设计。影响 FR-08、FR-09、FR-14、FR-15 及 AC-06、AC-07、AC-14、AC-15。
- **PFACT-05 — 四阶段审查提供建议。** 状态：`verified`；来源：D15，以及 `CONSTITUTION.md` 的 F3、F4、Q1、Q2。make-decision 保留双 track；四阶段不把审查 verdict 当通过门；证据充分的严重 finding 仍进入现有窄人工风险边界。影响 FR-12、FR-13、FR-16 及 AC-11 至 AC-13、AC-20。
- **PFACT-06 — 当前交付范围受限。** 状态：`verified`；来源：D14。架构清理、删除测试、AJV/runtime 修复和模型路由改造均不在范围内。影响 AC-17。

## 4. 术语与层级

- **PFACT**：产品/流程事实，例如用户目标、批准范围、外部约束和已验证前提。
- **FR**：功能需求，说明系统必须交付的行为或能力。
- **AC**：验收标准，说明如何证明 FR 已满足。
- **ANCHOR**：代码阅读锚点；只属于 plan。
- **FACT**：工程事实；只属于 plan。
- **DEC**：工程决策；只属于 plan。
- **CTRL**：工程质量控制项；只属于 plan。
- **task 投影**：build-code 为一个 task 临时解析的最小相关片段，不是新的持久事实来源。

`spec` 只保存 PFACT、FR、AC 和产品层约束。`plan` 只保存 ANCHOR、FACT、DEC、CTRL 和实施安排。允许 plan 引用 spec；禁止 spec 扫代码、复制工程结论，或与 plan 维护第二份相同事实。

## 5. 事实、引用与兼容合同

### FR-01：稳定 ID 与版本化引用

来源 PFACT：PFACT-01、PFACT-02、PFACT-03、PFACT-04。

所有 PFACT、FR、AC、ANCHOR、FACT、DEC、CTRL 和 task 都必须有在所属 accepted artifact 内唯一、稳定的 ID。跨 artifact 引用不得是裸 ID，必须同时携带 `artifact_kind`、已认证 `artifact_ref/hash`（或等价版本身份）和 `id`，并能在该身份内确定性解析。artifact 更新后，旧引用仍只解析绑定的历史版本，不能漂移到同名新 ID。

引用缺失、重复、跨层反向引用、引用对象已删除或版本不兼容时，相关 task 必须停止执行并说明恢复条件；不得静默猜测、扫描全仓补全或复制整份设计材料兜底。

### FR-02：事实状态与证据边界

来源 PFACT：PFACT-01、PFACT-04。

PFACT 和 FACT 必须标记为 `verified`、`inferred`、`unknown` 或 `not_applicable`。

- `verified` 必须附可复核的命令与结果，或正式 ref/hash/snapshot。代码、Workspace 或实现相关 FACT 必须同时绑定当前 snapshot；外部事实必须绑定对象版本或正式 ref。没有该绑定的历史命令结果不能在新 snapshot 继续显示为 `verified`。
- `inferred` 必须写出推断来源与限制，不能冒充已验证。
- `unknown` 必须写出未知会影响的范围和后续确认者。
- `not_applicable` 必须写出不适用理由。

没有可核验证据时不得使用 `verified`。未知项一旦会改变 scope、AC、接口、数据、安全或运行，就必须成为 task 的 STOP 条件或明确的上游阻塞项。

### FR-03：兼容读取且不改写历史

来源 PFACT：PFACT-03。

新设计产物使用版本化内容合同。读取旧模板或旧字段时，只做明确的兼容读取与缺失报告；不得自动改写历史 accepted 产物，不得创建镜像账本。无法无损映射的旧内容必须显示为未知或需要上游补齐。

## 6. build-spec 内容合同

### FR-04：可验收的产品规范

来源 PFACT：PFACT-01、PFACT-02。

每份 spec 必须包含：核心用户目标、范围、非目标、PFACT、FR、AC、产品层实现约束、测试/验收方法、风险/难点/影响范围和下游交接。

每个 PFACT 至少包含：ID、陈述、事实状态、来源/证据、影响的 FR/AC 和必要限制。每个 FR 至少包含：ID、可观察的交付行为、关联 PFACT、范围边界和关联 AC。每个 AC 至少包含：ID、关联 FR、要验证的行为、验证方法、通过条件和所需证据类型。AC 必须可独立判定，不能用“合理”“充分”“必要时”等无法验收的词替代标准。

### FR-05：spec 的过程和内容边界

来源 PFACT：PFACT-02。

spec 不得包含代码路径、符号定位、候选工程方案、被排除方案、实现状态机细节或重复的工程原则矩阵。这些内容必须留给 plan。spec 可以写产品层约束，例如“不得新增第二账本”“必须保持历史产物只读”，但不能把它们伪装成具体代码设计。

spec 的风险和难点必须说明影响哪个 FR/AC、发生条件、后果、缓解或 STOP、处理 Stage 和验证方式；不能只列泛泛风险。build-spec 的语义起草不得扫描 CandidateWorkspace 或从实现代码推断 PFACT。为审查本工作流合同而选择的既有 WorkflowHub 合同片段，只能由 FR-16 的冻结最小 packet 提供，不能反向写成 PFACT。

## 7. build-plan 与 tasks 内容合同

### FR-06：代码阅读依据

来源 PFACT：PFACT-02。

plan 必须区分 `read_now` 与 `must_read_before_task`。每个 ANCHOR 至少记录 path、symbol 或最小行范围、阅读原因、关联的 FR/AC/DEC、所依据的 snapshot。`read_now` 是计划作者必须已读的代码；`must_read_before_task` 是执行该 task 前必须读的代码。没有阅读依据的工程判断不能伪装为 verified FACT。

### FR-07：候选、排除、复用与工程决定

来源 PFACT：PFACT-02、PFACT-04。

每个影响接口、schema、状态、数据流、安全、并发、拓扑、Phase 顺序或测试策略的关键 DEC，必须记录：候选方向、选中方向、选择理由、事实/代码证据、后果、风险、明确排除的方向及排除理由、关联 FR/AC/task。

没有实际比较必要的简单变更，不得为了格式制造多余候选；其 DEC 可以采用 Lite 记录，但仍要说明为什么无需完整比较。纯 P1 直接复用或没有独立工程判断的变更，不建立 DEC/CTRL，只引用已有 ANCHOR/FACT 和适用约束。现有 `plan-eng-review`、`wh-review`、模板、读取器和 evidence 结构是 P1/P2 优先复用点；只有已有能力已被证明无法满足本规范时才可最小改造或新增。禁止用“以后可能需要”“更通用”作为唯一理由保留能力。

### FR-08：工程质量设计矩阵

来源 PFACT：PFACT-04。

plan 对每个影响实现结构的关键 DEC，必须以 Lite、Full 或 `not_applicable` 之一检查并记录 DRY、KISS、YAGNI、SoC、Cognitive Load、State/Data Flow、Robustness、Context Friendliness、历史代码影响。

- Lite 适用于局部、无状态、无接口/数据/安全影响的手术式变更；记录适用结论和最小理由。
- Full 适用于接口、schema、状态、数据流、安全、并发、拓扑、跨 Phase 依赖或测试策略变化；逐项记录具体约束、主要风险和对应测试/验收。
- `not_applicable` 只能在该维度确实不改变当前决策时使用，并说明理由。

该矩阵是设计说明和审查材料，不是新的 stage 通过门。build-plan 必须定义可机器或人工一致执行的最小 Lite/Full 触发规则，不能仅靠作者主观选择；该规则只适用于实际存在且影响实现结构的关键 DEC，不能强迫纯复用或无新判断的 task 填表。

### FR-09：防御性设计与历史影响

来源 PFACT：PFACT-04。

对输入、外部数据、状态转换、失败路径或历史兼容有影响的 DEC，plan 必须说明：输入/失败边界、错误传播或用户可见结果、数据保持策略、状态所有者与转换、回滚/恢复方式、受影响历史代码和兼容策略。

无此类影响时应明确“不适用”的事实理由，不能省略。不得用吞错、默认成功或隐式兜底掩盖错误。

### FR-10：静态 task 设计态与最小上下文

来源 PFACT：PFACT-01、PFACT-03。

tasks 是静态设计产物，不是运行看板。每个 task 只允许设计状态 `ready` 或 `blocked-by-design`；运行中的 `in_progress`、`done`、`failed` 只属于执行记录。

每个 task 至少包含：task ID、所属 Phase、目标、关联 FR/AC/DEC/ANCHOR/FACT/CTRL 的版本化引用、最小 Knowledge、边界、实现/测试/验收命令、design state、STOP 条件、恢复条件和任务级风险。

“最小 Knowledge”必须以必要引用、任务特有边界和命令表达，不能复制完整 spec、plan、Decision Log 或其他 task 的背景。执行时 build-code 根据引用创建临时投影，只包含该 task 需要的受控片段、解析来源和未知项；投影完成后不成为新的 accepted 事实。

### FR-11：上下文成本只观测

来源 PFACT：PFACT-01。

build-plan 必须为首版定义可复现的 packet/token 观测口径：采样 task、采集时点、正式来源、packet bytes/引用数和比较方式。每个 task 在来源可获得时记录 packet bytes、引用数、遗漏/多余引用、实现 token、返工原因、最终缺陷和 AC 失败。没有正式来源的数据必须标为 `unknown`，不得估算。首版不设置 token 上限、成本评分或因观测数据阻断交付，也不新建专用 telemetry 系统。

## 8. 建议式异源审查

### FR-12：审查职责与严重问题边界

来源 PFACT：PFACT-05。

make-decision 保留相互独立的方向盲审和细节审查：方向盲审只看原始需求、客观事实、约束和非目标；细节审查看主 agent 的完整方案。两个 track 都只提供 findings 和建议，不得合并，也不构成通过门。

make-decision、build-spec、build-plan、verify-code 的异源审查都用于发现当前主方案的问题。它们对用户和 stage 呈现 findings、证据、影响和主 agent 处置；底层 `pass` 或 `revise_required` 不是阶段放行或阻断语义。build-code 继续使用其现有严格实现质量审查，不在本规范改变。

只有当前冻结材料的正式 finding 同时满足 `disposition=actionable`、`severity=major|blocking`、证据锚点有效或满足既有多来源佐证规则，并绑定当前 snapshot，才触发现有宪法的窄暂停。主 agent 不能单独将这种 finding 标记为 `deferred_with_risk`：它只能先修复，或由用户通过既有正式记录对该 finding/current snapshot 明确承担风险；风险接受不改写 reviewer 结论。minor、无效锚点、timeout、unavailable 或空输出只记录“未获得建议”或非阻断 finding，不得触发风险接受。

### FR-13：复审只限结构性返工

来源 PFACT：PFACT-05。

build-spec、build-plan、verify-code 默认对当前主方案做一次完整初审。普通文字修正、补充证据或局部修复不重派审查。

只有 actionable 的 major/blocking finding 实际导致以下任一变化时，才允许一次新的完整审查：方向、AC、接口、schema、状态、安全、并发、拓扑、Phase 顺序或测试策略。处置记录必须绑定 finding、实际 changed dimensions 和证据。

结构性复审后的 findings 仍由主 agent 处置；不得循环重审来制造“通过”。同一审查流至多有一次结构性完整复审。此规则不改变 build-code 的既有每 Phase 完整审查行为。

### FR-14：simplicity-guard 的准确位置

来源 PFACT：PFACT-04。

simplicity-guard 只在 make-decision 的 detail、build-spec、build-plan 和 build-code 的冻结审查材料中使用，用四阶梯检查必要性、直接复用、改造复用和最小新增。它必须要求删除无需求/故障/硬约束依据的能力，优先复用现有能力，并保护必要的输入验证、数据安全、错误处理和无障碍基础。

verify-code 不运行 simplicity-guard；它只核对 build-code 的当前 snapshot 证据是否存在、是否新鲜以及是否与 accepted 设计一致。

## 9. verify-code 一致性核对

### FR-15：基于现有证据的设计一致性

来源 PFACT：PFACT-04。

verify-code 必须使用 accepted spec、plan、tasks 的版本化引用，结合逐 AC evidence、build-code phase evidence、fresh tests 和当前 final review，核对当前 snapshot 是否实现已接受的 FR/AC/DEC/CTRL。

verify 只增加必要的 spec ID、plan DEC/CTRL ID、偏差说明、selected anchors 与 evidence refs；不得重新发送完整 spec/plan/tasks/code/diff，不得建立独立 conformance schema 或重复 build-code 的代码质量裁决。

当发现未授权偏离、unknown、缺失 AC 覆盖、过期 review 或 snapshot 不一致时，verify 必须给出受影响 ID、已有证据、缺口和恢复条件。它不能把旧 snapshot、历史 review 或口头说明当成当前实现证据。

### FR-16：冻结的最小审查上下文

来源 PFACT：PFACT-01、PFACT-05。

build-spec、build-plan 和 verify-code 的 review packet 必须绑定当前 draft、已接受上游事实与正式 material/snapshot identity。现有代码、合同、接口或复用点只能由显式 `context_map` 选择最小行段；运行或测试事实只能由 `evidence_map` 表明 `complete` 或 `unknown`。不得默认交付完整代码、目录、原始日志或完整历史设计材料。

packet 必须记录实际 bytes 和引用数供 FR-11 观测；缺少必需 context/evidence map 时审查只记录 unavailable，不得伪造 provider 结论。该要求复用既有 wh-review 冻结 material 机制，不创建 packet 生命周期、预算 gate 或第二账本。

## 10. 验收标准

- **AC-01（FR-01、FR-02、FR-04）**：accepted spec 包含唯一的 PFACT/FR/AC ID；每个 PFACT 含状态、来源/证据和影响的 FR/AC；每个 FR 和 AC 的关联 ID 都能解析且无缺失。
- **AC-02（FR-02）**：PFACT/FACT 只使用四种规定状态；每个 `verified` 条目都有可复核证据，代码 FACT 绑定当前 snapshot；未知项不会显示成已验证。
- **AC-03（FR-05、FR-06）**：spec 不含代码锚点或工程方案；plan 不复制产品事实；plan 只单向引用 spec。
- **AC-04（FR-06）**：plan 的 `read_now` 和 `must_read_before_task` 分开记录；每个代码锚点有定位、原因、关联 ID 和 snapshot。
- **AC-05（FR-07）**：每个关键 DEC 记录候选、选中、理由、证据、后果、风险和排除依据；纯 P1 复用不产生人为 DEC/CTRL。
- **AC-06（FR-08）**：每个关键结构 DEC 都有 Lite/Full/不适用的工程质量记录；Full 覆盖九个规定维度，Lite/不适用有可检查理由。
- **AC-07（FR-09）**：涉及状态、数据、错误或历史兼容的 DEC 明确状态所有者、失败路径、恢复和测试；没有影响时有不适用理由。
- **AC-08（FR-03、FR-10）**：tasks 只保存静态设计态、版本化引用、最小 Knowledge、命令与 STOP/恢复条件；运行状态不写回 accepted tasks。
- **AC-09（FR-01、FR-10）**：task 投影只解析相关版本化引用；缺失、冲突或过期引用会明确停止，而非扫描全仓或加载所有背景。
- **AC-10（FR-11）**：上下文和返工数据只在有正式来源时按已定义口径观测；首版不会因 token 或评分阈值阻断。
- **AC-11（FR-12）**：make-decision 的方向盲审和细节审查仍是两个 track；四个规定阶段的审查均以 finding/disposition 呈现，不以 verdict 作为通过门；正式严重 finding 仅走既有窄人工风险边界。
- **AC-12（FR-13）**：build-spec、build-plan、verify-code 只有结构性返工才可最多完整复审一次；普通修复不复审，复审后不循环追求通过。
- **AC-13（FR-12、FR-13）**：每个普通 finding 的处置可追踪为采用、带理由拒绝或带风险延期；正式严重 finding 的延期必须有用户绑定的风险记录；不可用审查不会被伪造成质量结论。
- **AC-14（FR-14）**：simplicity-guard 在指定四个位置使用，在 verify-code 不重跑；检查不会删除已经证明必要的验证、错误处理或安全保护。
- **AC-15（FR-15）**：verify-code 用 accepted 版本化引用和当前 snapshot 的既有 evidence 对齐 AC、DEC/CTRL 与实际交付；发现偏离会给出具体恢复条件，不新增第二摘要生命周期。
- **AC-16（FR-03、FR-10）**：旧格式只能被版本化读取，历史 accepted 记录保持只读；不能无损识别的内容明确报告为 unknown 或待上游补齐。
- **AC-17（范围）**：实施不包含本规范列出的架构清理、删除测试、全仓迁移、AJV/runtime 修复或模型路由改造。
- **AC-18（FR-05）**：每条设计风险都能定位到受影响的 FR/AC、发生条件、后果、缓解或 STOP、处理 Stage 和验证方式；不能用泛泛风险代替交接。
- **AC-19（FR-01、FR-02）**：跨 artifact 的 task/plan/verify 引用都绑定 accepted artifact identity/version/hash 与稳定 ID；旧 artifact 更新后不会解析到同名新 ID；代码 FACT 的 verified 证据绑定当前 snapshot。
- **AC-20（FR-16）**：build-spec/build-plan/verify-code 的审查只传当前阶段必要的冻结材料和显式 context/evidence maps；缺 map 时记录 unavailable，不能把完整仓库或历史材料塞入 packet，也不因此产生新 gate。
- **AC-21（FR-01、FR-07、FR-08）**：首个使用本规范的 v1 spec/plan/tasks 有引用闭合测试，逐项验证 PFACT→FR→AC 和跨 artifact identity；纯复用 task 不会被强迫制造 DEC/CTRL 或九维记录。

## 11. 风险、失败模型与交接

- **RISK-01 — 字段膨胀。** 影响 FR-07、FR-08、FR-11、AC-05、AC-06、AC-10。触发条件是为“完整性”新增没有 P0-P2 必要性或复用依据的字段、registry、状态或 gate；后果是上下文和维护面扩大。build-plan 以 Lite/Full 和 simplicity-guard 选择最小字段；发现无依据新增时停止该项设计，删除或复用现有能力后再继续。
- **RISK-02 — 投影遗漏或引用漂移。** 影响 FR-01、FR-10、AC-01、AC-09、AC-19。触发条件是 task 的版本化引用缺失、重复、已删除、版本不兼容或解析到不相关片段；后果是实现模型缺少必要约束或加载过量背景。build-plan 定义引用闭合测试和投影规则，build-code 在解析失败时停止并返回上游恢复条件；不得扫描全仓兜底。
- **RISK-03 — finding 处置或结构性返工误判。** 影响 FR-12、FR-13、AC-11 至 AC-13。触发条件是把普通修复当作复审、把结构变化漏记，或把不可用结果当结论；后果是浪费审查成本或遗漏真正的设计变化。build-plan 把 finding、changed dimensions 和 disposition 绑定到既有 review flow，并用合同测试覆盖普通修复、结构复审和 unavailable 情形。
- **RISK-04 — 旧模板无法无损读取。** 影响 FR-03、FR-10、AC-08、AC-16。触发条件是旧字段无法映射到新静态 task/版本化引用合同；后果是历史事实被误写或执行者误解状态。build-plan 定义只读兼容映射与 unknown 报告；映射不完整时停止相关 task，要求上游补齐，不自动迁移历史记录。
- **RISK-05 — 设计与当前验证证据脱节。** 影响 FR-02、FR-15、AC-02、AC-15。触发条件是 evidence/ref/hash/snapshot 缺失、过期或与当前快照不一致；后果是把旧实现或口头说明误当交付证据。verify-code 按当前 snapshot 报告受影响 ID、证据缺口和恢复条件；不能以历史 review 代替当前 evidence。

build-plan 必须在不改变上述边界的前提下：确认现有模板、合同、读取器与审查材料的代码锚点；定义精确字段存放位置和版本化兼容读取；给出 Lite/Full 的可执行触发规则；选择 advisory finding 的最小传输兼容方式；定义 FR-11 的首版 packet/引用/返工观测口径；确认与既有 `ambiguity-ledger.v1` 的单向衔接且不复制其运行时账本；拆分 task 和测试计划；复用既有 `plan-eng-review`/`wh-review`；并明确每个变更怎样满足 AC-01 至 AC-21。

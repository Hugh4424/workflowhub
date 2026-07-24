# wh-review 最小充分审查材料与集成审查规格

## 1. 目标

让 wh-review 为每个 stage 交付当前判断所需、可复核且可追溯的最小充分材料。优化材料不是缩小质量范围：build-code 的每个 Phase 仍以完整冻结 diff 严格审查至 pass；最终审查只聚焦跨 Phase 集成，不把已经由 Phase review 覆盖的历史 diff 再次交给 provider。

本规格同时修复公开审查记录泄露 broker 私有路径的问题。WorkflowHub 只消费 3rd-review 的 `workflowhub-result.v2` 公共结果，继续由 3rd-review 做唯一的异源 provider group 派发。

## 2. 锁定边界

- 不用 byte、token、时长、输出量或文件数量阈值拒绝、截断、拆分或降级审查材料；`packet-plan` 只记录实际 inclusion/exclusion 和 delivery bytes。
- build-spec、build-plan、verify-code 的首轮 review 仍是非 gate 质量事实；普通修复不跑小型二审。结构性改变是 acceptance criteria、接口、schema、状态模型、安全边界、并发、拓扑、Phase 顺序或测试策略的改变；只有这类改变最多再跑一次初始高强度完整 review。
- build-code 每个 Phase 的完整 diff review 和直到 pass 的规则不变；最终 integration review 也必须绑定最终快照，但不重放历史完整 diff。
- 不改 3rd-review、provider 配置、CLI 参数、模型路由、同源排除或新建第二条派发路径。
- 不把 raw log、broker private workspace/state/session 文件、绝对宿主路径或完整项目默认交给 provider。

## 3. 功能需求

### FR-MAT-01：材料矩阵与无上限选择

`stage-materials.json` 是 stage 可见材料集合的唯一权威；contracts 定义材料语义；sealed manifest 定义本次 provider 可见 bytes/hash。所有 stage 的 packet-plan 必须列明已交付和排除类别及理由，但不得参与准入判断。未知材料 fail-closed 为 `MATERIAL_FORBIDDEN`，缺少必需材料为 `MATERIAL_INCOMPLETE`，两者都在 provider 调用前发生。

build-plan 初始 review 的必需材料增加 `draft_tasks`，与 `approved_spec`、`acceptance_criteria`、`draft_plan` 同时冻结。build-spec、build-plan、verify-code 继续以显式 `context_map`/`evidence_map` 选择少量直接片段；任何未被 map 选择的源文件、diff 和原始证据都不默认进入 packet。

### FR-MAP-02：地图状态和锚点

每个 map 保持 map-level `complete|unknown`。当 map 为 `complete` 时，每个 `complete` entry 必须至少有一个有效的 frozen-snapshot anchor（唯一 id、相对路径、行范围、role、reason）。entry 不能再用自由文本 `not_needed_reason` 代替 anchor。

没有可交付上下文的 entry 只能显式标记为 `not_applicable` 或 `unknown`，并同时有受限 reason code 和简短说明；它们不算 complete。build-code 的 acceptance entry 仍须一对一覆盖声明 AC，且 implementation 与 verification 各有已选择 anchor。无效锚点、重复锚点、未覆盖的 AC/change/seam 必须如实生成材料不完整或 unknown 事实，不能补猜内容。

### FR-VERIFY-03：逐 AC 验收摘要

verify-code 在 provider packet 内交付 `ac-evidence-summary.v1`，而不是整棵 canonical evidence 或 raw log。摘要必须按已接受 AC 一对一列出：`result`、acceptance leaf ref/hash、nested evidence ref/hash、test receipt ref/hash、`scenario`、`oracle`、`actual_outcome`、`evidence_type`、`coverage_limits`、`exceptions`。

摘要只可从认证 acceptance leaf、其认证 nested evidence、测试 receipt 和已接受 AC 集读取。字段是规范性合同，必须由 `ac-evidence-summary.v1` JSON schema 校验；为支持可读语义，acceptance evidence 合同可增加向后兼容的可选结构化字段。旧 leaf 或缺少来源的字段一律写为 explicit `unknown`，不得由日志、路径名或模型推断。leaf/hash、重复/缺失 AC、nested hash 或 snapshot 不一致必须使材料不完整。

### FR-PHASE-04：Phase 完整审查保持不变

有 `phase_id` 的 build-code review 自动派生 `review_scope=phase`。其 packet 必须继续包含该 Phase `base_tree..candidate_tree` 的完整冻结 `changes.diff`、change map、受控测试摘要和按地图选择的必要上下文；每个 Phase 的 review 继续完整检查范围、测试、simplicity-guard、DRY/KISS/YAGNI/SoC、复杂度、状态/数据流、鲁棒性和可读性，直到正式 pass。现有 Phase 的重试、continuation、重开与 evidence publication 生命周期保持不变；每一次仍审查完整当前 Phase diff，不把上一次 finding 当作唯一审查范围。完整 diff 的捕获必须以流式或受控临时文件实现，不得以固定 `maxBuffer` 或等价内存上限拒绝大 diff。

### FR-INTEGRATION-05：最终集成审查

无 `phase_id` 的 build-code final review 自动派生 `review_scope=integration`；调用方不可传入或覆盖该字段。`subject_kind` 仍为 `worktree`，但 `review_scope` 必须进入 attempt/result schema、reuse identity、review-chain identity、final verification 和 stage-handler 比对，以区分旧的“全 worktree diff”语义和新的 integration 语义。新记录只允许 `phase|integration`；旧的无 scope 记录只能明确标为 legacy，绝不能自动冒充 integration。已接受的 legacy final review 仅保留审计价值，不能进入 verify-code lineage；若同一 snapshot 的 coverage、phase-map 和测试 identity 仍完整，必须重跑一次正式 integration review 生成新 identity，否则明确 `MATERIAL_INCOMPLETE` 并回到 build-code 重新建立可验证事实，绝不设过渡放行窗口。

final review 在 provider 调用前生成并验证：

1. `phase-review-coverage.v1`：从 accepted build-plan checkpoint tree 到 final tree 枚举 canonical Phase evidence/result，选择唯一、连续且最终为 pass 的 coverage chain，证明最终树中的每项最终改动都由恰好一条连续 Phase PASS 链覆盖。任何有实现改动的 build-code 任务必须在 build-plan 中声明至少一个正式 Phase；零 Phase 不是合法的“空链”替代。漏 Phase、分叉、重复、attempt/result 不匹配、tree/hash 不连续或最终改动无归属都不能挑一条“看起来可用”的链，必须 `MATERIAL_INCOMPLETE`。
2. 每个 Phase 在 sealed packet 之后持久化 hash-bound 的最小 phase-map trace（不含完整 diff/raw log），作为最终可重建事实。
3. `cross-phase-seam-index.v1`：只从 coverage chain 与上述 canonical phase-map trace 派生跨 Phase 的 producer/consumer interface、schema、shared state/resource、error/cancel flow 和 cross-phase tests；不同 Phase 各自只修改一个文件时，只要形成上述关系也必须入索引，不能把“同一文件被多个 Phase 修改”当作前提。每个 seam 自身携带最终 snapshot anchor，或显式 `not_applicable|unknown` 与 reason；不再维护重复的 `integration_map`。
4. AC→change→test/evidence 追踪和 fresh structured test summary。

integration packet 的内容材料仅含 approved spec/AC、fresh test summary、coverage chain、seam index、上述引用选择的最终快照片段和 frozen reviewer lenses；矩阵生成的 `review-instructions`、manifest 与 packet-plan 仍按既有合同随包交付。它不得包含 `changes.diff`、完整历史 Phase diff、cumulative diff、raw log 或完整项目。缺 coverage/seam/AC/测试 identity 的 packet 不调 provider，而是发布带 `MATERIAL_INCOMPLETE` 的 unavailable review attempt；它是质量/身份事实，不自动新增 stage gate。

### FR-TRACE-06：公开追溯和私有路径隔离

WorkflowHub 不得探测、读取、存储或在 attempt/report 中投影 `brokerRuntimeRoot/<runtime>/state.json`，也不得保留 `session_artifact_path`。公开报告只显示 broker 公共结果实际返回的 provider、adapter、model、effort、thinking、duration、usage、retry、runtime ID、session ID、状态、unavailable diagnostic、findings、根因和修改方向。

没有 session 文件路径时统一展示 `SESSION_PATH_UNAVAILABLE`；usage、session 或其他可选值未返回时保持 `null`/unavailable，不能用 packet bytes 伪造 token。遇到 public result 含私有绝对路径时必须记录 `PUBLIC_RESULT_INVALID`/unavailable，绝不将其变成 pass。

### FR-WORKFLOW-07：合同、流程与文档同步

更新 wh-review skill、build-spec/build-plan/build-code/verify-code workflow 和 stage contracts，使材料合同、第一轮/结构性重审语义、Phase 与 integration 职责、AC 摘要、报告字段和 caller-visible 术语一致。任何含实现改动的 build-plan 必须声明至少一个正式 Phase。同步更新 `CONTEXT.md` 和 ADR 0007。build-code final handler 和 verify-code lineage 只能接受同一快照的 `worktree + integration` 正式结果；Phase result 不能替代 final integration result。

### FR-CONTINUITY-08：审查连续性不由 WorkflowHub 超时终止

WorkflowHub 不得以固定 wall-clock、record-lock 等待时限或等价外层预算，把仍由 3rd-review 正常监督、执行或可恢复的同一 review 判为失败、取消或不可用。相同 canonical identity 的并发调用必须等待/复用同一 canonical outcome；锁异常、失主或可证伪的不一致状态必须明确 fail loud，而不是在固定分钟数后制造超时结论。provider 会话活性与恢复仍由 3rd-review 负责，WorkflowHub 不读取其私有状态文件。

## 4. 失败语义与风险

材料身份失败、非法 map、范围/hash/snapshot 不一致和禁止材料属于 entry-integrity 事实：fail loud、不调 provider，并发布 unavailable attempt。provider unavailable、SAME_SOURCE、协议/输出错误是 transport/public-result 事实：写入 attempt/report，不伪装为语义 pass。review finding 是质量事实：按各 stage 已锁定的非 gate/Phase-pass 规则处理，不新增通用自动质量门。

主要风险是历史 Phase evidence 尚不足以生成连续 coverage/seam index，或 build-plan/实现没有任何正式 Phase；此时显式失败为材料不完整，不能回退到自动全项目、累计 diff 或零 Phase 空链投递。

## 5. 验收标准

- **AC-01 review scope 身份**：新 build-code phase/integration attempt 与 result 都持久化 `review_scope` 并参与 lock、reuse、chain、attempt/result、stage-handler 与 verify-final identity 校验；篡改 scope、用 phase 结果验 final、或把 legacy 无 scope 结果当 integration 都不可用。legacy 已接受 final 只能在同 snapshot 事实完整时重跑正式 integration review；否则必须 `MATERIAL_INCOMPLETE`，不得进入 verify-code。
- **AC-02 无阈值与 Phase 完整性**：构建各 stage packet 的测试证明 `packet-plan` 只遥测；不存在按 bytes/tokens/duration/output count 拒绝、截断或拆包的分支；完整 diff 捕获没有固定 `maxBuffer` 上限，流式/临时文件产物与 Git 完整 diff 的 bytes/hash 一致；每个 Phase packet 仍有完整冻结 diff，非 pass Phase 不能推进。
- **AC-03 build-plan 完整 draft**：缺 `draft_tasks` 在 provider 前报 `MATERIAL_INCOMPLETE`；合法 bundle 含 `requirements/draft_tasks.md`；额外材料仍 `MATERIAL_FORBIDDEN`。
- **AC-04 anchors 可证伪**：complete entry 缺 anchor、重复/越界 anchor 或未覆盖的 build-code AC/change 必失败；合法 `not_applicable|unknown` 必带 reason code，不能冒充 complete。
- **AC-05 verify AC 摘要**：`ac-evidence-summary.v1` schema 校验每个 accepted AC 恰一条摘要且 leaf/nested/test receipt refs/hashes 可验证；缺结构化来源的语义字段为 explicit unknown；raw logs/完整 canonical 树不进 provider packet。
- **AC-06 coverage 和单一 seam 索引**：所有有实现改动的 plan 至少有一个正式 Phase；coverage chain 从 accepted plan checkpoint 连续到 final tree，每段唯一 Phase PASS；缺 Phase、缺段/分叉/重复/tree 错配和缺 phase-map trace 都形成 unavailable attempt。seam index 只从 canonical trace 与 chain 派生，跨文件的 Producer/Consumer 关系即使各文件只在一个 Phase 修改也必须覆盖；每个候选 seam 有最终 anchor 或 audited disposition，且不存在重复 `integration_map`。
- **AC-07 integration 材料与安全报告**：final integration result/attempt 与 implementation/tests 同一 snapshot；integration bundle 不含 `changes.diff`、历史 Phase diff、raw log 或完整项目。attempt/report 无 `session_artifact_path`、`state.json` 或私有绝对路径；实际返回的 provider/model/effort/thinking/duration/usage/runtime/session/findings 正确显示，未返回值明确 unavailable/null。
- **AC-08 边界保持**：测试证明 WorkflowHub 仍只以一个 3rd-review group 调用派发，不改 provider 路由；spec/plan/verify 普通修复无 closure 小审查，build-code Phase 严格 pass 与 final integration lineage 均保持。
- **AC-09 审查连续性**：不存在 WorkflowHub 的固定 review/record-lock wall-clock 超时分支；并发相同 identity 只等待或复用 canonical outcome。测试用超过旧本地等待窗口的受控健康 review 证明其可完成且不会被 WorkflowHub 取消；可证伪的锁异常/失主状态明确失败，但不会把健康的 3rd-review 会话误判为预算或时间终止。

## 6. 非目标

不为任意项目建立自动“最佳材料”推理器；不改变 3rd-review 的私有 runtime/session 实现；不重新审查完整历史项目；不以优化为名降低代码审查、测试或既有安全/错误处理要求。

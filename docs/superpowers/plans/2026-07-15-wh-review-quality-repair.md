# wh-review Quality Repair Plan

## Goal

保留 V4 的 `frozen packet + short stage contract + report-only lens + human disposition + runtime gate` 分层。修复运行时正确性、事实可证性、迁移映射和来源不足处置。不复制旧 AgentHub 全部 prompt，不建设通用规则引擎。

## Constitutional boundaries

- 机器只记录、校验物理事实；不把测试失败伪装成业务裁决。
- 质量 finding 由独立 provider 产出，最终 disposition 由人负责。
- 不把 transport/provider failure 转换成 review finding 或假 pass。
- 新 schema、gate 必须直接服务可证伪性；避免为形式完整堆机制。

## Phase 0 — Baseline

1. 从本地 `main@029422e` 创建 `codex/wh-review-quality-repair` worktree。
2. 运行 wh-review targeted tests，记录基线。
3. 每个 phase 使用 RED → GREEN → targeted regression。

## Phase 1 — Runtime correctness

### Late blocking

- 合同语义：`introduced_this_round OR previously_impossible` 任一成立，finding 可保持 blocking。
- 降级条件：两个证明均不存在时才标记 late/minor。
- `introducedBlockingIds` 与 `previouslyImpossibleIds` 必须独立构造，禁止复用同一 Set。当前没有可验证的“前轮不可能发现”结构化 fact，后者保持空集；不得用 provider 叙述伪造 host proof。

### Finding identity

- finding identity 不再依赖完整 issue 文本和单一行号。
- 使用稳定 root-cause key/fingerprint；位置、证据和 provider provenance 分开聚合。
- 不做 NLP 猜测；provider 提供受约束稳定 key，host 负责规范化和 hash。
- 非法或缺失稳定 key fail loud；协议/schema 同步升级。

### Typed evidence tests

- 仅 introduced、仅 previously impossible、两者都有、两者都无。
- 同一 provider 的同根因不同措辞/行号合并；不同 provider 不凭自由 slug 自动合并。
- 不同根因不得误合并。
- locations/evidence/provider provenance 保留。

## Phase 2 — Typed evidence

统一 EvidenceRecord：

- `fact_id`
- `kind`
- `source`
- `captured_at`
- `sha256`
- `status` 或 `value` 至少一个
- 命令类事实可带 `exit_code`

`host_verified_facts`、`test_evidence`、`verification_closure` 使用明确 item schema。旧字符串/空对象 fail loud。数组是否允许为空由 stage material requirement 决定，不把“空数组”本身变成业务 hard finding。

### Contract and ledger tests

- 合法 status/value/command record。
- 缺 ID、来源、时间、hash。
- 错误 exit code 类型。
- 未知字段。
- packet hash/canonicalization 回归。

## Phase 3 — Quality contracts and migration evidence

不搬旧 prompt。每个 stage 只补通用且影响 verdict 的明确规则：

- `build-spec`：双向追溯；happy/failure/boundary；可判定验收。
- `build-plan`：消费点；依赖/失败路径；验证命令真实性；接口变化反向引用。
- `build-code`：行为/状态/错误；原子性/竞态；消费者影响；结构泄漏与重复 canonical 能力。
- `verify-code`：逐 AC 与原始用户问题闭环；有限台账禁止抽样；fresh/hash-bound evidence；UI 条件 isolated browser evidence。

删除固定阈值、固定路径、固定命令、80%、1000 行、blanket `any/as/wrapper`、普遍 dogfood。

`legacy-rule-ledger.md` 保持迁移证据，不进入运行时。每条 `keep/host/lens/removed` 必须指向可验证 owner：具体 C/H rule、fact ID、stage-plan lens clause 或明确 removal rationale。禁止只指整个 `§Hard invariants`。

### Source coverage tests

- legacy ID 唯一。
- target 文件和 anchor/rule 存在。
- lens 必须在对应 stage/condition 声明。
- removed 必须有具体理由。
- 保留规则具备 violation、valid exception、vacuous evidence fixture。

## Phase 4 — Source coverage

- 记录 `requested/completed/business_valid/failed` 来源覆盖。
- 默认最低有效来源数保持 1，避免日常流程僵化。
- 只有 stage policy 明确要求 2 个来源时，来源不足进入 `needs_human/escalate_to_human`。
- provider failure 只作为诊断和风险处置材料，不转换为 finding。
- 0 个有效来源绝不发布 pass。

### Tests

- 0 个有效来源。
- 默认 policy：1 个有效 + 其他失败。
- 高风险 policy：要求 2 个但仅 1 个有效。
- 两个有效来源正常聚合。

## Phase 5 — Verification and review

按顺序执行：

1. targeted tests。
2. facade tests。
3. workflow integration tests。
4. `npm test`。
5. `npm run check`。
6. `git diff --check`。
7. 独立 constitution-checklist 审查。
8. 冻结 plan/diff packet，运行 3rd-review：OpenCode、Kimi、Claude Code。
9. 真实 finding 修复后再跑 closure review。

Claude Code/provider 基础设施失败只记录诊断，不计作有效审查结果。

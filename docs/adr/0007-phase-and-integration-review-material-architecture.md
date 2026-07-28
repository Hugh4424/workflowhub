# ADR 0007 — Phase 与集成审查使用不同的最小充分材料

- Status: Accepted
- Superseded note: Phase/integration review verdicts are now preserved as
  quality facts rather than `pass` gates. Identity, hash, snapshot, scope, and
  material bindings remain fail-closed; serious findings use the separate
  authenticated risk-pause contract.

build-code 的单个 Phase 继续以完整冻结 diff 严格审查并保存 provider
的原始质量裁决；最终审查改为绑定同一最终快照的集成审查，只交付连续
Phase 审查覆盖链、自动生成的跨 Phase seam 索引（索引本身带每个 seam
的最终锚点或显式未知/不适用项），以及 AC 到改动和测试/证据的追踪。
provider 的 `pass`、`revise_required`、`unavailable` 都是质量事实，不是
WorkflowHub 阶段通过状态。严重且可行动的发现走独立的修复/风险暂停协议；
其他裁决不会形成反复调用 provider 的 pass loop。这样保留对真实代码改动的
完整检查，避免把已审过的历史 diff 再次交给高成本 reviewer 重做；
WorkflowHub 仍只消费 3rd-review 的公共结果，绝不读取或公开 broker 私有
state/session 文件。

## Decision

- `phase_id` 存在时自动派生 `review_scope=phase`：packet 必有完整
  `base_tree..candidate_tree` diff、change map、受控测试摘要和 map 选择的直接上下文。
  每个冻结 Phase 身份只产生一次正式质量事实。若严重可行动发现触发修复，修复后的新
  快照是新 Phase 身份并重新完整审查；原裁决不可改写。
- `phase_id` 缺失时自动派生 `review_scope=integration`：只接受
  `subject_kind=worktree`。在 provider 调用前，必须从 accepted build-plan checkpoint
  到最终树重建唯一、连续的 canonical Phase review trace chain，并验证 fresh test 和 AC
  `change/test/evidence` trace。缺 Phase、缺 trace、分叉、树不连续、零 Phase 或 legacy
  无 scope record 一律为 `MATERIAL_INCOMPLETE`，不回退到全项目或累计 diff。
- Integration packet 禁止 `changes.diff`、历史 Phase diff、cumulative diff、raw log、
  完整项目与重复 `integration_map`；它仅有 coverage、seam、AC trace、fresh test summary
  及选中的最终快照片段。`packet-plan` 是材料选择/排除的遥测，不设 byte、token、时间、
  输出量或文件数上限，也不参与放行判断。
- seam 只能来自 canonical trace 的已认证语义关系和最终快照 anchor。当前最小 Phase trace
  只证明路径和证据绑定；它不能证明 producer/consumer、schema、状态、错误/取消或跨 Phase
  测试关系。因此当前派生 seam 必须是带 `TRACE_HAS_PATHS_NOT_SEMANTIC_SEAMS` 的 `unknown`，
  不能把相邻 Phase 或共享路径伪称为完整语义 seam。
- build-spec、build-plan、verify-code 的首轮仍是非 gate 质量事实：普通修复不二审；只有
  绑定 ledger 明确记录结构性变更时，才最多同 route 重做一次完整高强度审查。它不形成 pass
  loop。build-code 使用每个冻结 Phase 一次完整审查与最终集成审查；其裁决语义同样不是
  阶段 pass gate。

## Public trace and aggregation

报告只写 provider、adapter、model、effort/thinking、用时、usage、runtime/session ID、
finding、根因和修改方向。session 文件路径永远显示
`SESSION_PATH_UNAVAILABLE`；WorkflowHub 不读取或记录 broker state、raw output 或 native
CLI session 文件。3rd-review 负责异源 group、同源排除和健康会话；WorkflowHub 对同一
request ID 轮询公共 status，不用外层 wall-clock 预算取消健康审查。

聚合只采纳有效语义输出，每个 adapter 最多一个按配置优先级选出的代表。priority 只是
同 adapter 去重顺序，不是模型智力权重。major/blocking finding 需要有效 direct/machine
anchor，或两个异源 adapter 的一致 inferred evidence 才会 actionable；无效 anchor 和
单一推断分别记录为 `invalid_evidence` 与 `needs_corroboration`。minor 非阻塞。只有
actionable cluster 才产生 `revise_required`。该值保持为 provider 质量事实；
严重发现是否暂停阶段由独立、可认证的风险协议决定。

## Considered Options

- 每次最终审查都投递完整 worktree diff：历史重复会淹没跨 Phase 交互，成本随 Phase 累积，并让 reviewer 重做已完成的工作。
- 只给概要或测试结果：无法核查跨 Phase seam，且会削弱最终审查。
- 采用 Phase 完整审查加最终集成审查：保留完整改动审查，同时把最终视角聚焦在尚未被单 Phase 覆盖的交互。

## Consequences

最终审查身份必须明确为 `review_scope=integration`，并且覆盖链、seam 索引、AC 追踪和材料地图都必须可证伪；材料不足或违规材料如实记录，不能伪装为通过或用字节、时间、token 上限替代判断。代价是历史 trace 或语义 seam 事实不足的任务会显式停在 `MATERIAL_INCOMPLETE`，而不是用更大的审查包掩盖证据缺口。

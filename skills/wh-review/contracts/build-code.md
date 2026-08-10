# Build Code 审查合同

provider 只能审查冻结材料，不得访问真实仓库、运行 Git 或读取宿主绝对路径。

## 两种审查主体

`phase_id` 存在时，runner 自动派生 `review_scope=phase`。这是一份严格代码审查：
必须审查完整当前 Phase diff，不能只检查上轮 finding；正式 verdict 原样保留为质量事实。
review verdict 不是继续工作或无限复审的 gate；Phase 完成仍需要测试、AC、finding
disposition 和 serious 风险处置事实。

Phase 的审查对象由宿主根据 `phase_id` 和 Git 工作树推导，调用方不能传入
`tasks.md` 的 `execution_file_paths`、`phasePaths` 或其他路径选择器。已提交的 Phase
以直接父提交树到候选提交树为审查范围，并记录 `commit_oid`、`parent_commit`、
`parent_tree`、`commit_tree`、`candidate_tree` 及树一致性；未提交的 Phase 不伪造提交，
记录 `commit_oid=null` 和当前 HEAD 树。提交树与候选树不一致时，结果只能是
`unavailable`/`incomplete`，不能继续沿用旧审查结论。上述绑定是审查事实的完整性保护，
不是任务继续工作的 gate，也不引入恢复、重绑或锁状态。

`phase_id` 缺失时，runner 自动派生 `review_scope=integration`，且
`subject_kind=worktree`。它只用于所有 Phase 之后的最终集成审查，不能重放历史
diff，也不能替代任何 Phase 审查。调用方不得提供或覆盖 scope。Phase result、legacy
无 scope worktree result、或不同快照的 worktree result 都不能作为最终结果。

## Phase 审查必需材料

- `review-instructions.md`：stage、审查问题和输出格式。
- `source.json`、`change-map.json`，以及完整 `changes.diff` 或 `diff-index.json` + 选中
  `diff-shards/`。不超过 320 KiB 时保持完整 diff 交付。超过阈值时，全量 diff 以 hash
  命名存入 runner canonical archive；index 绑定完整 ref/hash/bytes/lines、全部
  change/hunk ID、每个 shard 的 hash 和交付状态。代码与合同 shard 必须交付；测试、
  fixture 和证据 shard 可只保留摘要和 anchor。缺 shard、hash 不符或 change ID 覆盖
  不全必须在 provider 调用前失败。
- 已批准 spec 和验收标准。
- 与当前 `snapshot_tree` 对应的、已由 runner 验证哈希的测试 receipt 引用和结构化测试摘要。完整 receipt 与原始测试日志只留在 canonical storage 追溯，不递归交给 provider。
- 与本次审查有关的 reviewer 技能文件。
- `manifest.json`：列出 provider 可见的每个文件及其 byte size、SHA-256，并据此计算 `material_id`。

`wh_review.v2` 路由还必须附带四张结构化 map，每张均使用
`state: complete|unknown`、简短 `summary`、逐项 `entries`（`id`、`subject`、
`rationale`、`disposition`）；`unknown` 必须有 `unknown_reason`。每个 `complete`
entry 必须有可验证 anchors；`not_applicable` 或 `unknown` entry 必须有受限
`reason_code` 和理由，不能用 `not_needed_reason` 绕过：

- `phase_map`：本 phase 的边界、完整 diff 和 base/candidate 对应关系。完整 diff 已是改动行权威时，entry 使用 `not_applicable` 并说明原因。
- `impact_map`：变更文件的直接生产者、消费者、依赖、数据/状态边界和测试面。
- `reuse_map`：已检查的现有能力、实际复用点，或不能复用的具体理由。
- `acceptance_map`：必须有唯一的 `acceptance_ids`，并为每条 AC 提供同 ID 的
  entry；每个 entry 要写明 `implementation`、`verification`、具体理由，以及已选
  `implementation_anchor_ids` / `verification_anchor_ids`。没有
  可用证据时，map 用 `state: unknown` 和 `unknown_reason` 明确暴露，不得用一条
  泛化摘要冒充完整 AC 覆盖。

runner 只从这些 anchors 生成 `context/<id>.txt`：默认 anchor 只能指向**未变更**的
直接依赖文件。若必须引用变更文件，anchor 必须写非空 `outside_diff_reason`，且声明的
candidate 行区间不得与任何 unified diff hunk 相交；否则 runner 直接失败，不会静默把
已在 `changes.diff` 出现的代码再次整段交付。context header 会记录该例外理由。未被 map
选中的当前文件、间接依赖和原始日志禁止入包。大 diff 使用可审计的索引交付，不是静默
截断；`packet-plan.delivery_mode` 必须诚实写 `inline_complete` 或 `selected_context`。
完整 provider 可见文件 byte/hash 清单由 `manifest.json` 提供。`selected_context` 包含
Phase 相关 FR/AC/合同摘录、compact maps、测试摘要和 anchors；全文 spec/maps 仅保留
canonical ref/hash/bytes。总交付超过 330 KiB 时必须在 dispatch 前失败。
大 Phase 的 full change-map 也只存 canonical audit；provider 版本只保留
change ID、path、status 和 hunk IDs。`selected_context` 不交付独立
`context/<anchor>.txt`；context 仅存 canonical audit，`diff-index.anchors` 用
`anchor_id → shard_id,line` 短引用定位。

`phase_map` 必须覆盖 `change-map.json` 的全部 `change_id`；`impact_map` 也必须
覆盖全部 change_id。`reuse_map` 和 `acceptance_map` 的每个 entry 必须关联至少一个
change_id。`complete` 的 impact/reuse/acceptance entry 必须有 anchors；没有可交付
上下文时使用 `not_applicable|unknown` 和 reason code，不得用泛化文字跳过直接影响面的判断。

缺少任一必需材料时，本次 attempt 返回 `unavailable`。补齐后直接重跑，不创建或修复永久 flow。可选的 plan、设计背景、扫描、性能、安全证据或上轮 findings 不存在时，`review-instructions.md` 必须说明未提供及原因。

## 审查重点

- 整个当前 phase diff、变更文件和直接影响面是否完整，实际行为是否符合 spec、AC 和非目标。
- 接口、schema、依赖、生产者/消费者、状态归属和数据流是否同步且可解释。
- 是否遵守 `simplicity-guard` P0–P3、DRY、KISS、YAGNI、SoC；是否有未批准扩项、重复实现、投机抽象、兼容层、死代码或吞错兜底。
- 复杂度是否受控：一个读者能否在局部理解控制流、状态变化和异常分支，而不需要跨大量文件猜测上下文。
- 防御性实现是否与改动相称：输入校验、错误处理、超时、取消、重试、幂等、原子性、部分成功和并发在涉及处是否正确。
- 测试和证据是否针对当前 snapshot，覆盖关键成功、失败、边界、直接消费者和集成行为。

DRY/KISS/YAGNI/SoC、复杂度或可读性 finding 必须指出当前 diff 中的具体
后果和可验证改法；纯风格偏好和推测性未来工作只能是非阻塞建议。

`simplicity-guard` 只审当前 diff，不得重开 accepted 产品范围，不得按 LOC、
风格或假设性未来需求裁决，也不得删除规格要求的测试、输入校验、错误处理、
安全或可访问性保护。

## 最终 Integration 审查材料

Integration 只读取当前四份材料（批准的 `spec.md`/AC 来自当前材料）、最终代码
快照、当前快照的测试事实、当前 AC trace、冻结 reviewer lens 和审查说明。runner
在调用 provider 前校验 implementation/test receipt 的当前 snapshot 绑定；这些是
质量事实，不是继续工作的许可证。

AC trace 只表达当前 AC 到当前任务变化、测试和证据的对应关系，并验证引用的 hash
与最终快照一致。历史 Phase 审查、旧 snapshot、seam、phase map、continuity 或
lineage 记录不属于当前 Integration 输入，也不生成新的控制链；它们若存在，只能
作为只读历史事实保留。

Integration packet 明确禁止 `changes.diff`、累计历史 diff、raw log、完整项目和
重复 `integration_map`。缺少或不可用的质量事实如实记录为 `unavailable`，但不得
把质量结果改写成完成，也不得把它变成阻止同一任务修复的 gate。

Integration 的正式结果必须与 implementation receipt、fresh test receipt 和最终
snapshot 同树；verdict 原样保留为质量事实，不能被改写成阶段通过。它仍是严格
build-code 边界，不适用 build-spec/build-plan/verify-code 的普通修复免二审规则。

provider 无法形成 semantic result 时，认证的 `unavailable` attempt 也是原样保留的
质量事实，不得改写成 `pass`，也不得称为“审查通过”。Phase 与 Integration 的结构
闭包仍按各自合同继续判定；`unavailable` 本身不使用 risk acceptance。`revise_required`
中存在 actionable `major|blocking` serious finding 时，按精确 finding/card/reply
绑定要求修复或显式接受风险；不为取得 reviewer `pass` 无限重复审查。

## 输出

输出遵循 `provider-protocol.md` 的最小 reviewer JSON：`verdict`、`summary`、`findings`。不要求 checklist、pass items、skillResults、bundle hash、finding 生命周期或模型回显材料 hash。

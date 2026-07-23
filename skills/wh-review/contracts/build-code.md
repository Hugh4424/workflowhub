# Build Code 审查合同

provider 只能审查冻结材料，不得访问真实仓库、运行 Git 或读取宿主绝对路径。

## 两种审查主体

`phase_id` 存在时，runner 自动派生 `review_scope=phase`。这是一份严格代码审查：
完整当前 Phase diff 必须反复审查到正式 `pass`，不能只检查上轮 finding。

`phase_id` 缺失时，runner 自动派生 `review_scope=integration`，且
`subject_kind=worktree`。它只用于所有 Phase 之后的最终集成审查，不能重放历史
diff，也不能替代任何 Phase PASS。调用方不得提供或覆盖 scope。Phase result、legacy
无 scope worktree result、或不同快照的 worktree result 都不能作为最终结果或
verify-code lineage。

## Phase 审查必需材料

- `review-instructions.md`：stage、审查问题和输出格式。
- `source.json`、完整 phase `changes.diff` 与生成的 `change-map.json`。change map 必须绑定 phase_id、base/candidate tree、每个变更文件和每个 hunk 的确定性 ID，是完整的变更文件索引；diff 是本 phase 全部改动的唯一完整代码权威；不得默认附带变更文件全文。
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
选中的当前文件、间接依赖和原始日志禁止入包。这不是按字节截断：完整 diff 永远保留，
直接上下文按合同显式选择；provider-facing `packet-plan` 只保留材料类别、选中 anchor 与排除理由，完整文件 byte/hash 清单由 `manifest.json` 提供。不存在大小上限
或按大小拒绝。

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

Integration 在调用 provider 前从 accepted build-plan checkpoint 到最终快照重建唯一、
连续的正式 Phase PASS trace chain。每一段必须有同一树身份的 phase evidence、正式
pass result、最小 phase-map trace、绿测 receipt 和完整 AC `change/test/evidence`
追踪。零 Phase、缺段、分叉、重复、树或哈希不连续、历史 PASS 没有 trace、或 legacy
无 scope result 都是 `MATERIAL_INCOMPLETE`；它们不允许回退为全项目、累计 diff 或
"空链"投递。

Integration packet 只包含：批准 spec/AC、最终快照的 fresh test summary、
`phase-review-coverage.v1`、`cross-phase-seam-index.v1`、AC trace、冻结 reviewer
lens，以及由这些记录选择的最终快照片段。它明确禁止 `changes.diff`、完整历史 Phase
diff、cumulative diff、raw log、完整项目和重复 `integration_map`。

seam index 不是猜测器。只有 canonical trace 已认证生产者/消费者接口、schema、共享
状态或资源、错误/取消流、跨 Phase 测试关系，并有最终快照 anchor 时，seam 才能标为
`complete`。当前最小 phase trace 只认证路径和证据绑定，不能证明上述语义关系；因此
派生的条目必须诚实标为 `unknown`，写明 `TRACE_HAS_PATHS_NOT_SEMANTIC_SEAMS`，而不是
把共享路径或相邻 Phase 伪称为完整语义 seam。`unknown` 是给 reviewer 的风险事实，不能
被静默补全。

Integration 的正式 `pass` 必须与 implementation receipt、fresh test receipt 和最终
snapshot 相同，才可作为 build-code final/verify-code lineage。它仍是严格 build-code
边界，不适用 build-spec/build-plan/verify-code 的普通修复免二审规则。

## 输出

输出遵循 `provider-protocol.md` 的最小 reviewer JSON：`verdict`、`summary`、`findings`。不要求 checklist、pass items、skillResults、bundle hash、finding 生命周期或模型回显材料 hash。

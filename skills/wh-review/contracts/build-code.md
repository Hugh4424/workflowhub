# Build Code 审查合同

provider 只能审查冻结材料，不得访问真实仓库、运行 Git 或读取宿主绝对路径。

## 必需材料

- `review-instructions.md`：stage、审查问题和输出格式。
- `source.json`、完整 phase `changes.diff`、`changed-files.json` 与生成的 `change-map.json`。change map 必须绑定 phase_id、base/candidate tree、每个变更文件和每个 hunk 的确定性 ID；diff 是本 phase 全部改动的唯一完整代码权威；不得默认附带变更文件全文。
- 已批准 spec 和验收标准。
- 与当前 `snapshot_tree` 对应的测试 receipt 和结构化测试摘要。原始测试日志只留在 canonical storage 追溯，不递归交给 provider。
- 与本次审查有关的 reviewer 技能文件。
- `manifest.json`：列出 provider 可见的每个文件及其 byte size、SHA-256，并据此计算 `material_id`。

`wh_review.v2` 路由还必须附带四张结构化 map，每张均使用
`state: complete|unknown`、简短 `summary`、逐项 `entries`（`id`、`subject`、
`rationale`）；`unknown` 必须有 `unknown_reason`：

- `phase_map`：本 phase 的边界、完整 diff 和 base/candidate 对应关系。
- `impact_map`：变更文件的直接生产者、消费者、依赖、数据/状态边界和测试面。每个 `complete` 条目必须有可验证 `anchors`（唯一 id、snapshot path、行区间、role、reason）。
- `reuse_map`：已检查的现有能力、实际复用点，或不能复用的具体理由；`complete` 条目同样必须有 anchors。
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
直接上下文按合同显式选择；packet-plan 只记录实际字节和选择/排除理由，不存在大小上限
或按大小拒绝。

`phase_map` 必须覆盖 `change-map.json` 的全部 `change_id`；`impact_map` 也必须
覆盖全部 change_id。`reuse_map` 和 `acceptance_map` 的每个 entry 必须关联至少一个
change_id。每个 impact/reuse/acceptance entry 要么提供 anchors，要么给出具体
`not_needed_reason`，不得用泛化文字跳过直接影响面的判断。

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

## 输出

输出遵循 `provider-protocol.md` 的最小 reviewer JSON：`verdict`、`summary`、`findings`。不要求 checklist、pass items、skillResults、bundle hash、finding 生命周期或模型回显材料 hash。

# Make Decision 审查合同

provider 只能审查冻结材料，不得访问真实仓库、运行 Git 或读取宿主绝对路径。`direction` 和 `detail` 是两个独立 track，各自产生一个 paired review fact；每个 track 共享本次 `snapshot_tree` 和 `material_id`，并各发一个 `role=red` 与一个 `role=blue` 的独立 request。两次 request 使用同一 `pair_id`，结果保留 provider×role provenance。

## 共同材料

两个 track 都必须包含：

- `review-instructions.md`：当前 track、审查问题和输出格式。
- 原始用户需求。
- 本 track 所需材料。
- 与这些材料一致的 reviewer 技能文件。
- `manifest.json`：列出 provider 可见的每个文件及其 byte size、SHA-256，并据此计算 `material_id`。

每次真正执行 `make-decision` 时，`direction` 和 `detail` 各执行一次当次输入的 red/blue pair；每个 role 只调用一次，不把 paired request 变成重试循环。
旧结果只作为不可变历史保留，不自动复用，也不通过正文、版本、material_id 或
semantic hash 判断“还是不是同一份”。同一次执行不为追求空 findings 重审。
如果本次只有 `unavailable`，它没有 advice，修复缺失路由或材料后才可重新调用。

缺少必需材料时，本次 attempt 返回 `unavailable`，并作为当前 track 下
`quality/reviews/attempts/*` 的不可变质量事实保留；它没有 findings，也不能写成
“没有问题”。补齐后可在同一 track 重新调用，产生新的质量事实。direction/detail
结果必须绑定当前材料与冻结快照；direction 只有在 Round 2 完成后才能记录，detail 只有在
Round 3、完整 grill 和 decision draft 完成后才能记录，不能互相替代或跳过中间步骤。

两个 track 都引用同一份当前 OI authority。每个 OI/consumer 记录至少绑定
`task_id`、`outline_version` 和 `oi_id`；当前版本变化、缺 ID、类别替代、遗漏条目或旧
版本都保留为 `incomplete`。direction、detail、approve-decision 的职责分别是方向完整性、
终态逐条对账、以及既有整体确认中的分组处置；任何一个消费者都不能替代另一个，也不能把
质量事实变成推进许可。Direction and detail cannot substitute for each other; both remain
advisory quality facts, not permission to continue work.

## direction

必需材料只有：

- 原始用户需求。
- 已知客观事实、硬约束和明确的非目标。
- 当前 `convergence_outline` questions-only 投影：包含当前全部 OI ID、固定类别、原始
  问题/未知、来源、`task_id` 和 `outline_version`；为防止答案锚定，展示状态统一为 `open`。

禁止交付：

- 拟定方案、推荐方案或方案比较结论。
- OI 的答案、`selected_disposition`、依据、结论、终态字段、确认分组或
  `interaction_ref`/`interaction_hash`（这些属于 detail/approve-decision 消费者）。
- decision log、detail 审查结果或已批准方向。
- spec、plan、实现 diff、代码或测试结果。

runner 必须从材料集合中排除这些内容，不能先交付再要求 provider 忽略。发现禁止材料时必须在调用 provider 前返回 `MATERIAL_FORBIDDEN`。

审查重点：真实问题、方向对位、更小更稳的路径、关键前提、范围和时机。

审查顺序固定为一个逻辑 paired review fact：red 与 blue 各一次 broker group request，合计两次 public request。每个 request 携带 broker-owned
`direction-review.v1` flow。内部先从原始需求和事实重建“要解决什么、不能做什么、失败会
怎样”，到 reveal 边界后才呈现当前选择，再挑战选择和更小的替代路径。reconstruct 不得
读取当前选择；WorkflowHub 不得用第二次 public request 拼出这个顺序。只报告会伤害交付的
具体问题。不要把时间花在材料命名、快照、流程、receipt 或“是否完整走过步骤”上。

## detail

必需材料：

- 原始用户需求。
- 已批准方向，包括可读 decision log 与 grill 文档判断。
- 待审规格或验收草案。
- 可选的 `context_map` / `evidence_map` 优化：仅交付 map 明确选择、与方向落地直接相关的片段；不得默认附带 diff 或完整当前文件。未提供 maps 仍须调用 provider。

审查重点：

- 三轮职责是否分别覆盖问题/成功标准与调研、方向/范围/取舍与风险、盲审 finding/假设与剩余风险。
- 每轮是否有可见的开始队列、逐题处理、回答后重排和有事实依据的结束结论；每次只处理一个决策轴。
- 每项关键决定是否记录精确来源、事实与约束、选择理由、影响范围、后果风险、被拒方案、未决项及 supersedes 关系。
- grill 结果是否记录 CONTEXT changed/no-change、ADR created/not-needed 的三项判断、冲突处理、文件引用和四项退出检查。
- 当前 OI 的每个终态是否逐条保留 `oi_id`、`outline_version`、状态专属字段、影响维度和
  分组/交互绑定；不得用总体结论、summary-only 文本或 direction 的 questions-only 投影
  冒充 detail 对账。
- 方案是否忠实于批准方向，关键前提和边界是否完整，验收是否可判断，是否未经确认扩大范围。

先查交付风险，再查记录形式：需求有没有丢、用户流程能不能走通、状态和失败边界是否
可实现、验收是否能被测试打破、方案是否比必要范围更大。只有这些会改变交付结果的问题
才应成为 finding；文件齐不齐、引用漂不漂亮、审查动作是否“标准化”不单独报 finding。

detail 的同一 wh-review packet 必须包含 `simplicity-guard` 只读 advisory lens，逐项执行
P0-P3：优先删除、直接复用或最小改造；标出 scope creep、重复已有能力，以及没有故障
证据或硬约束的长期能力。lens 不单独调用、不生成事实或 receipt；发现实质扩大实现或
维护面的内容时，在同一 findings 中报告具体问题，由 Stage Agent 处置。

direction 是不含候选方案的盲审，不包含 `simplicity-guard` 或其他依赖候选方案的 lens，
避免从不存在的方案中推断或裁剪内容。

detail 的公开调用只提交任务身份、`review_track=detail` 和三项材料：
`raw_requirement`、完整当前 `approved_direction`、`draft_spec_or_acceptance`。
`review_instructions`、packet 元数据、hash、provider/model 配置等由 runner 生成或受信配置，
调用方提交时必须在 provider 前点名 `forbidden`；三项材料分别按 `missing`、`empty`、`type`
诊断。`approved_direction` 必须逐字匹配当前 Workspace 的 `decision-log.md`，并带当前
material revision；不匹配时报告 `identity`/`freshness`，不得静默替换成摘要或旧结果。
其中的当前 OI 终态记录必须逐条绑定 `task_id`、`outline_version`、`oi_id`、
`selected_disposition`、`impact_dimensions` 和 `requires_user_decision`；分组确认的
`visible_group_id|batch_id` 与 `interaction_ref`/`interaction_hash` 只作为既有
`approve-decision` 证明被消费，不得被 direction 投影泄露或由 detail 代填。

`context_map` 和 `evidence_map` 只是可选优化。提供时，map-level state 必须是
`complete|unknown`，并包含简短 summary 和逐项 entries；每个 entry 包含 id、subject、
rationale、disposition。`complete` entry 必须使用可验证 anchors（id、snapshot path、
行区间、role、reason）；`not_applicable` 或 `unknown` entry 必须有受限 reason code 和
理由，不能用自由文本 `not_needed_reason` 冒充完整判断。map-level `unknown` 还必须说明
`unknown_reason`。runner 只交付 complete anchors 对应的直接片段；maps 缺失不返回
`MATERIAL_INCOMPLETE`，也不阻止 provider 调用。

## 输出

输出遵循 `provider-protocol.md` 的最小 reviewer JSON：只包含 `findings`。不要求 checklist、summary、verdict、skillResults、bundle hash、finding 生命周期或模型回显材料 hash。

由于该 provider protocol 只有 findings-only 输出，`findings: []` 只能表示本次提交材料中没有报告可交付风险，不能编码 `checked_no_gap`、逐条 OI 覆盖或阶段完成。runner 必须把本合同作为真实审查指令交付给 provider；没有独立认证的逐条覆盖事实时，不得把空 findings 推导为 `checked_no_gap` 或通过。

findings、传输状态和材料绑定都是异源 review 的质量事实，不是 WorkflowHub stage 的
通过/不通过。`single_round` 表示一个逻辑 review fact 完成后，不再为了追求空 findings 自动发起后续复审；
direction 的每个 role request 内部仍必须提供可观察的 reconstruct/reveal/challenge 顺序和 reveal boundary；detail 的每个 role 也只发一个短请求。两种 track 都不得为了追求空 findings 再发后续复审。
finding 处理和最终快照变化属于业务材料变更；旧 findings 不被改写，也不生成
独立 resolution action。下一次真正重跑该阶段时，再审查那次的当前输入。

## 处置边界

direction 和 detail 都只获取异源 advice，不要求 provider `pass` 或 findings=[]。没有最终文本、路径失败、timeout、`PROCESS_DEAD`、坏 JSON 或其他 transport failure 时，attempt 必须保持 `unavailable`/`incomplete`，不能写成 findings、没有问题或通过。decision-log 的决定和 finding 处置仍由 WorkflowHub 阶段负责；review 不成为阶段推进 gate。

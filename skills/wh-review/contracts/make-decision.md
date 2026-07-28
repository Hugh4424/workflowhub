# Make Decision 审查合同

provider 只能审查冻结材料，不得访问真实仓库、运行 Git 或读取宿主绝对路径。`direction` 和 `detail` 是两个独立 track，各自产生结果；它们共享本次 `snapshot_tree`，但材料和 `material_id` 不同。

## 共同材料

两个 track 都必须包含：

- `review-instructions.md`：当前 track、审查问题和输出格式。
- 原始用户需求。
- 本 track 所需材料。
- 与这些材料一致的 reviewer 技能文件。
- `manifest.json`：列出 provider 可见的每个文件及其 byte size、SHA-256，并据此计算 `material_id`。

缺少必需材料时，本次 attempt 返回 `unavailable`，并作为当前 track 的已认证
provider-attempt action 留在 review flow 中；它没有语义 verdict，也不能写成“审查通过”。
补齐后可在同一 track 重新调用。direction/detail flow 必须绑定当前
make-decision run；direction 只有在 Round 2 完成后才能记录，detail 只有在
Round 3、完整 grill 和 decision draft 完成后才能记录，不能互相替代或跳过中间步骤。

## direction

必需材料只有：

- 原始用户需求。
- 已知客观事实、硬约束和明确的非目标。

禁止交付：

- 拟定方案、推荐方案或方案比较结论。
- decision log、detail 审查结果或已批准方向。
- spec、plan、实现 diff、代码或测试结果。

runner 必须从材料集合中排除这些内容，不能先交付再要求 provider 忽略。发现禁止材料时必须在调用 provider 前返回 `MATERIAL_FORBIDDEN`。

审查重点：真实问题、方向对位、更小更稳的路径、关键前提、范围和时机。

## detail

必需材料：

- 原始用户需求。
- 已批准方向，包括可读 decision log 与 grill 文档判断。
- 待审规格或验收草案。
- 仅由 `context_map` 明确选择的、与方向落地直接相关的既有约束片段；不得默认附带 diff 或完整当前文件。

审查重点：

- 三轮职责是否分别覆盖问题/成功标准与调研、方向/范围/取舍与风险、盲审 finding/假设与剩余风险。
- 每轮是否有可见的开始队列、逐题处理、回答后重排和有事实依据的结束结论；每次只处理一个决策轴。
- 每项关键决定是否记录精确来源、事实与约束、选择理由、影响范围、后果风险、被拒方案、未决项及 supersedes 关系。
- grill 结果是否记录 CONTEXT changed/no-change、ADR created/not-needed 的三项判断、冲突处理、文件引用和四项退出检查。
- 方案是否忠实于批准方向，关键前提和边界是否完整，验收是否可判断，是否未经确认扩大范围。

detail 必须加载 `simplicity-guard` 只读 lens，逐项执行 P0-P3：优先删除、
直接复用或最小改造；标出 scope creep、重复已有能力，以及没有故障证据或
硬约束的长期能力。实质扩大实现或维护面时必须 `revise_required`。

direction 是不含候选方案的盲审，禁止加载 `simplicity-guard`，避免从不存在的
方案中推断或裁剪内容。

`wh_review.v2` 的 detail 还必须提供 `context_map` 和 `evidence_map`。每张 map 的
map-level state 是 `complete|unknown`，有简短 summary 和逐项 entries；每个 entry
有 id、subject、rationale、disposition。`complete` entry 必须使用可验证 anchors
（id、snapshot path、行区间、role、reason）；`not_applicable` 或 `unknown` entry 必须
有受限 reason code 和理由，不能用自由文本 `not_needed_reason` 冒充完整判断。map-level
`unknown` 还必须说明 `unknown_reason`。runner 只交付 complete anchors 对应的直接片段。

## 输出

输出遵循 `provider-protocol.md` 的最小 reviewer JSON：`verdict`、`summary`、`findings`。不要求 checklist、pass items、skillResults、bundle hash、finding 生命周期或模型回显材料 hash。

`pass` 和 `revise_required` 都只是异源 provider 的质量事实，不是 WorkflowHub
stage 的通过/不通过。make-decision 使用 `single_round`：初次语义结果后不再调用
provider 追求 `pass`；对 finding 的处理，以及 direction 审查后 grill/decision 产生的
最终快照 delta，都写入同一 track 的零-provider `wh-review-resolution.v1` action。
该 action 对原 verdict 是 `pass` 或 `revise_required` 都适用，可绑定完整 response
ledger，也可明确写成 `unverified`，但永远不改写原 verdict、不移动语义 head，也不声称
二审通过。

# Make Decision 审查合同

provider 只能审查冻结材料，不得访问真实仓库、运行 Git 或读取宿主绝对路径。`direction` 和 `detail` 是两个独立 track，各自产生结果；它们共享本次 `snapshot_tree`，但材料和 `material_id` 不同。

## 共同材料

两个 track 都必须包含：

- `review-instructions.md`：当前 track、审查问题和输出格式。
- 原始用户需求。
- 本 track 所需材料。
- 与这些材料一致的 reviewer 技能文件。
- `manifest.json`：列出 provider 可见的每个文件及其 byte size、SHA-256，并据此计算 `material_id`。

如果这是已有 `pass` 基线后的增量审查，当前必需材料仍由 runner 完整校验，
每次审查都完整交付当前材料；材料变化后重新调用会产生新的不可变 attempt，
不读取上一轮结果，也不生成增量材料或增量审查范围。

缺少必需材料时，本次 attempt 返回 `unavailable`，并作为当前 track 下
`quality/reviews/attempts/*` 的不可变质量事实保留；它没有 findings，也不能写成
“没有问题”。补齐后可在同一 track 重新调用，产生新的质量事实。direction/detail
结果必须绑定当前材料与冻结快照；direction 只有在 Round 2 完成后才能记录，detail 只有在
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

审查顺序固定为一次 public request、一个逻辑 review fact：请求携带 broker-owned
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

`context_map` 和 `evidence_map` 只是可选优化。提供时，map-level state 必须是
`complete|unknown`，并包含简短 summary 和逐项 entries；每个 entry 包含 id、subject、
rationale、disposition。`complete` entry 必须使用可验证 anchors（id、snapshot path、
行区间、role、reason）；`not_applicable` 或 `unknown` entry 必须有受限 reason code 和
理由，不能用自由文本 `not_needed_reason` 冒充完整判断。map-level `unknown` 还必须说明
`unknown_reason`。runner 只交付 complete anchors 对应的直接片段；maps 缺失不返回
`MATERIAL_INCOMPLETE`，也不阻止 provider 调用。

## 输出

输出遵循 `provider-protocol.md` 的最小 reviewer JSON：只包含 `findings`。不要求 checklist、summary、verdict、skillResults、bundle hash、finding 生命周期或模型回显材料 hash。

findings、传输状态和材料绑定都是异源 review 的质量事实，不是 WorkflowHub stage 的
通过/不通过。`single_round` 表示一个逻辑 review fact 完成后，不再为了追求空 findings
自动发起后续复审；direction 也只发一个 broker group request，内部 flow 必须提供可观察
的 reconstruct/reveal/challenge 顺序和 reveal boundary。detail 也只发一个短请求。finding
处理和最终快照变化属于业务材料变更。材料变化后的新 attempt 仍完整交付当前材料；旧
findings 不被改写，也不生成独立 resolution action。

## 处置边界

direction 和 detail 都只获取异源 advice，不要求 provider `pass` 或 findings=[]。没有最终文本、路径失败、timeout、`PROCESS_DEAD`、坏 JSON 或其他 transport failure 时，attempt 必须保持 `unavailable`/`incomplete`，不能写成 findings、没有问题或通过。decision-log 的决定和 finding 处置仍由 WorkflowHub 阶段负责；review 不成为阶段推进 gate。

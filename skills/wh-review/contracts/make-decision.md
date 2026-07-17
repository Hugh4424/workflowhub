# Make Decision 审查合同

provider 只能审查冻结材料，不得访问真实仓库、运行 Git 或读取宿主绝对路径。`direction` 和 `detail` 是两个独立 track，各自产生结果；它们共享本次 `snapshot_tree`，但材料和 `material_id` 不同。

## 共同材料

两个 track 都必须包含：

- `review-instructions.md`：当前 track、审查问题和输出格式。
- 原始用户需求。
- 本 track 所需材料。
- 与这些材料一致的 reviewer 技能文件。
- `manifest.json`：列出 provider 可见的每个文件及其 byte size、SHA-256，并据此计算 `material_id`。

缺少必需材料时，本次 attempt 返回 `unavailable`。补齐后直接重跑，不创建或修复永久 flow。

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
- 已批准方向或 decision log。
- 待审规格或验收草案。
- `source.json`、`changes.diff`、changed-files 清单和所有未删除变更文件的当前内容。

审查重点：方案是否忠实于批准方向，关键前提和边界是否完整，验收是否可判断，是否未经确认扩大范围。

detail 必须加载 `simplicity-guard` 只读 lens，逐项执行 P0-P3：优先删除、
直接复用或最小改造；标出 scope creep、重复已有能力，以及没有故障证据或
硬约束的长期能力。实质扩大实现或维护面时必须 `revise_required`。

direction 是不含候选方案的盲审，禁止加载 `simplicity-guard`，避免从不存在的
方案中推断或裁剪内容。

## 输出

输出遵循 `provider-protocol.md` 的最小 reviewer JSON：`verdict`、`summary`、`findings`。不要求 checklist、pass items、skillResults、bundle hash、finding 生命周期或模型回显材料 hash。

# Build Code 审查合同

provider 只能审查冻结材料，不得访问真实仓库、运行 Git 或读取宿主绝对路径。

## 必需材料

- `review-instructions.md`：stage、审查问题和输出格式。
- 当前完整代码 snapshot 的 `source.json`、`changes.diff`、changed-files 清单和所有未删除变更文件的当前内容。
- 已批准 spec 和验收标准。
- 与当前 `snapshot_tree` 对应的测试结果。
- 与本次审查有关的 reviewer 技能文件。
- `manifest.json`：列出 provider 可见的每个文件及其 byte size、SHA-256，并据此计算 `material_id`。

缺少任一必需材料时，本次 attempt 返回 `unavailable`。补齐后直接重跑，不创建或修复永久 flow。可选的 plan、设计背景、扫描、性能、安全证据或上轮 findings 不存在时，`review-instructions.md` 必须说明未提供及原因。

## 审查重点

- 实际行为是否符合 spec 和验收。
- 错误、状态、持久化、原子性、并发和取消是否正确。
- 接口、依赖和所有受影响消费者是否同步。
- 测试是否覆盖关键成功、失败和边界反例。
- 是否出现越界变更或隐藏失败。

## 输出

输出遵循 `provider-protocol.md` 的最小 reviewer JSON：`verdict`、`summary`、`findings`。不要求 checklist、pass items、skillResults、bundle hash、finding 生命周期或模型回显材料 hash。

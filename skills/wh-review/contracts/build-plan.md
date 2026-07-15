# Build Plan 审查合同

provider 只能审查冻结材料，不得访问真实仓库、运行 Git 或读取宿主绝对路径。

## 必需材料

- `review-instructions.md`：stage、审查问题和输出格式。
- 已批准 spec 和验收标准。
- 待审 plan，至少包含 phase、任务、依赖和验证方式。
- `source.json`、`changes.diff`、changed-files 清单和所有未删除变更文件的当前内容。
- 与本次审查有关的 reviewer 技能文件。
- `manifest.json`：列出 provider 可见的每个文件及其 byte size、SHA-256，并据此计算 `material_id`。

缺少任一必需材料时，本次 attempt 返回 `unavailable`。补齐后直接重跑，不创建或修复永久 flow。可选材料不存在时，`review-instructions.md` 必须说明未提供及原因。

## 审查重点

- 每项需求是否落到具体任务和可判断的验证。
- phase、依赖和生产者/消费者顺序是否可执行。
- 接口、状态、失败路径、并发和回退是否遗漏。
- 验证是否能在行为错误时失败，而不是只检查文件存在。
- 是否引入 spec 未要求的抽象、兼容层或范围。

## 输出

输出遵循 `provider-protocol.md` 的最小 reviewer JSON：`verdict`、`summary`、`findings`。不要求 checklist、pass items、skillResults、bundle hash、finding 生命周期或模型回显材料 hash。

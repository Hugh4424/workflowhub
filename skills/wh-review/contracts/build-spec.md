# Build Spec 审查合同

provider 只能审查冻结材料，不得访问真实仓库、运行 Git 或读取宿主绝对路径。

## 必需材料

- `review-instructions.md`：stage、审查问题和输出格式。
- 原始用户需求。
- 已批准决策。
- 待审 spec，至少包含范围、非目标和验收标准。
- `source.json`、`changes.diff`、changed-files 清单和所有未删除变更文件的当前内容。
- 与本次审查有关的 reviewer 技能文件；UI scope 才包含 UI reviewer 技能。
- `manifest.json`：列出 provider 可见的每个文件及其 byte size、SHA-256，并据此计算 `material_id`。

缺少任一必需材料时，本次 attempt 返回 `unavailable`。补齐后直接重跑，不创建或修复永久 flow。可选材料不存在时，`review-instructions.md` 必须说明未提供及原因。

## 审查重点

- 每项原始需求和批准决策是否进入 spec。
- 成功、失败和边界场景是否清楚。
- 验收是否客观、可判断。
- 范围、非目标、状态和接口责任是否一致。
- 是否伪造来源，或未经批准扩大、缩减范围。

## 输出

输出遵循 `provider-protocol.md` 的最小 reviewer JSON：`verdict`、`summary`、`findings`。不要求 checklist、pass items、skillResults、bundle hash、finding 生命周期或模型回显材料 hash。

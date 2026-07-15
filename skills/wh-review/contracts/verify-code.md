# Verify Code 审查合同

provider 只能审查冻结材料，不得访问真实仓库、运行 Git 或读取宿主绝对路径。

## 必需材料

- `review-instructions.md`：stage、审查问题和输出格式。
- 验收标准。
- 当前完整代码 snapshot 的 `source.json`、`changes.diff`、changed-files 清单和所有未删除变更文件的当前内容。
- 每条验收标准对应的新鲜、可定位证据。
- 尚未关闭的问题和例外；没有时也要明确写明“无”。
- 与本次审查有关的 reviewer 技能文件。
- `manifest.json`：列出 provider 可见的每个文件及其 byte size、SHA-256，并据此计算 `material_id`。

UI scope 还必须包含真实浏览器证据，包括被验证流程、关键状态、结果、是否复用登录态和清理结果。缺少任一必需材料时，本次 attempt 返回 `unavailable`。补齐后直接重跑，不创建或修复永久 flow。

## 审查重点

- 每条验收标准是否有针对当前 snapshot 的客观证据。
- 证据来源、对象和结果是否可定位且互相一致。
- 关键失败和边界场景是否覆盖。
- 尚未关闭的问题和例外是否诚实，是否与交付范围冲突。
- UI 证据是否证明真实页面流程和关键状态，而不是只证明页面能打开。

## 输出

输出遵循 `provider-protocol.md` 的最小 reviewer JSON：`verdict`、`summary`、`findings`。不要求 checklist、pass items、skillResults、bundle hash、finding 生命周期或模型回显材料 hash。

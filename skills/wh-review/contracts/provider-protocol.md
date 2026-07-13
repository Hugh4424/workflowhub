# Provider Protocol

所有 provider 只读 `review-packet.v1` 与冻结的 skill bundle。不得修改材料、生成报告、访问真实仓库、请求绝对路径或要求执行版本控制命令。

Output must be a single bare JSON object。禁止 Markdown JSON 围栏和对象外文字。原始输出不是业务结论；只有通过 `reviewer-output.schema.json`、合同 hash、材料 hash 与 skill bundle hash 校验的输出才可进入合并。

顶层必须包含 `packet_hash`、`manifest_hash`、`diff_sha256`、`contract_hash`、`skill_bundle_hash`、`packet_status`、`verdict`、`summary`、`findings`、`checklist`、`pass_items` 与 `skillResults`。`revise_required` 还必须包含 `rootCause` 与 `fixApproach`。

每个 finding 至少包含 `file`、`line`、`rule_id`、`severity`、`issue`、`evidence` 与 `suggested_fix`。`rule_id` 必须精确属于当前冻结的选中合同；禁止合同外 finding。

`pass_items` 必须逐项对应通过的 checklist id，并包含 `rule_id`、可定位的 `artifact_anchor` 与具体 `evidence`；仅写“已检查”或“通过”无效。

`skillResults` 中每个 required skill 必须有技能名、bundle hash、`lens-only` mode、检查对象、证据和结论。仅写“已检查”或“通过”视为无效证据。

`checklist` 必须无重复地完整覆盖当前合同全部 C/H ID。每个 passed C/H 必须有同 ID 的 `pass_items`；每个 failed H 必须有同 ID 且 severity 为 `blocking` 的 finding。每个 provider 必须回显全部五个 hash。hash 不一致、材料缺失、非 JSON 或空洞技能证据均不是语义 verdict。

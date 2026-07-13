# Provider Protocol

所有 provider 只读 `review-packet.v1` 与冻结的 skill bundle。不得修改材料、生成报告、访问真实仓库、请求绝对路径或要求执行版本控制命令。

输出必须是单个裸 JSON 对象；禁止 Markdown JSON 围栏和对象外文字。原始输出不是业务结论；只有通过 `reviewer-output.schema.json`、合同 hash、材料 hash 与 skill bundle hash 校验的输出才可进入合并。

每个 finding 至少包含 `file`、`line`、`rule_id`、`severity`、`issue`、`evidence` 与 `suggested_fix`。合同外 finding 最高为 `minor`。

`pass_items` 必须逐项对应通过的 checklist id，并包含 `rule_id`、可定位的 `artifact_anchor` 与具体 `evidence`；仅写“已检查”或“通过”无效。

`skillResults` 中每个 required skill 必须有技能名、bundle hash、`lens-only` mode、检查对象、证据和结论。仅写“已检查”或“通过”视为无效证据。

每个 provider 必须回显 `packet_hash`、`manifest_hash`、`diff_sha256`、`contract_hash` 与 `skill_bundle_hash`。hash 不一致、材料缺失、非 JSON 或空洞技能证据均不是语义 verdict。

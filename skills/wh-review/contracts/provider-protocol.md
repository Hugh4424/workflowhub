# Provider Protocol

所有 provider 只读 `review-packet.v1` 与冻结的 skill bundle。不得修改材料、生成报告、访问真实仓库、请求绝对路径或要求执行版本控制命令。

Output must be a single bare JSON object, or contain exactly one Markdown `json` fence containing that object; text before or after the fence is allowed and ignored. 原始 stdout/stderr 由 host 从 `3rd-review` private runtime 复制并按 SHA-256 复核；解析后的本 JSON 另存为 parsed output，二者不得混用。原始输出不是业务结论；只有通过 `reviewer-output.schema.json` 和合同校验的输出才可进入合并。材料、合同与 skill bundle 的 hash 由 host 根据已验证的 delivery receipt 和 intent 绑定，provider 不得回显这些 hash。

顶层必须包含 `packet_status`、`verdict`、`summary`、`findings`、`checklist`、`pass_items` 与 `skillResults`。`revise_required` 还必须包含 `rootCause` 与 `fixApproach`。

每个 finding 至少包含 `file`、`line`、`rule_id`、`severity`、`issue`、`evidence` 与 `suggested_fix`。合同内 finding 的 `rule_id` 必须精确属于当前冻结的选中合同。合同外 finding 使用 `external:<stable-id>` 或未选中的 C/H ID，且 `severity` 只能为 `minor`；它不得出现在 checklist 或 `pass_items`，也不得形成 hard gate。

`pass_items` 必须逐项对应通过的 checklist id，并包含 `rule_id`、可定位的 `artifact_anchor` 与具体 `evidence`；仅写“已检查”或“通过”无效。`artifact_anchor` 不能只写字段名：通常使用 `changes.diff:line <n>`、`review-packet.v1.json:<json-path>`、`contracts/<stage>.md:line <n>` 或 `skills/<name>/<file>:line <n>` 这类带 `:` 或 `#` 的锚点；仅当证据覆盖整个冻结 diff 时，精确的 `changes.diff` 也是合法锚点。

`verdict` 的唯一规范枚举是小写 `pass`、`revise_required`、`escalate_to_human`。`revise`、`REVISE` 和其他未知值都不是合法 verdict，必须拒绝。

`skillResults` 必须与冻结 StageSkillPlan 的 required skills 精确一一对应：每个 declared skill 必须有技能名、`lens-only` mode、检查对象、证据和结论；不得添加未声明的条目。bundle hash 由 host 注入。若冻结 StageSkillPlan 没有 required skills，`skillResults` 必须精确为 `[]`，不得输出 `no-extra-lens` 或其他虚拟 skill result。仅写“已检查”或“通过”视为无效证据。

`checklist` 必须无重复地完整覆盖当前合同全部 C/H ID。每个 passed C/H 必须有同 ID 的 `pass_items`；每个 failed H 必须有同 ID 且 severity 为 `blocking` 的 finding。材料 hash 不一致、材料缺失、非 JSON 或空洞技能证据均不是语义 verdict；其中 hash 只由 host 校验。

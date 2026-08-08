# Provider Protocol

本合同分开两件事：3rd-review 向 WorkflowHub 返回什么，以及 reviewer 模型输出什么。传输成功不等于审查通过。

## 材料边界

- provider 只能读取 3rd-review 为本次调用准备的只读附件 workspace。
- provider 不得访问真实仓库、运行 Git、读取宿主绝对路径或自行补取材料。
- `material_id` 由 WorkflowHub 根据 canonical manifest 计算，绑定全部 provider 可见文件的相对路径、byte size 和 SHA-256；它不包含宿主路径、provider、session、runtime 或时间。
- 3rd-review 负责附件复制和文件完整性。WorkflowHub 不读取 3rd-review 的 private workspace、`state.json`、raw 文件或内部 attestation。
- 材料缺失、不可读、传输失败或 hash 不符都不是语义 verdict。
- Phase 大 diff 可使用 `diff-index.v1`。provider 只能读取 manifest 内的 index、已选
  shard、摘要和 anchors；材料必须自足完成审查，不存在二次补取或包外工具入口。

## 3rd-review 公共结果：workflowhub-result.v2

WorkflowHub 只调用 managed public lifecycle：

```text
workflowhub-run.v1 start -> workflowhub-run.v1 status -> workflowhub-result.v2
```

request 声明：

```json
{
  "required_result_protocol": "workflowhub-result.v2",
  "host_provider": "codex/terra",
  "provider_allowlist": ["kimi/coding", "codex/terra"]
}
```

`material_id` 由 broker 根据已校验附件计算并返回，request 不传该字段。

这是一整个 reviewer group 的一次调用。WorkflowHub 传入本 stage 配置的完整
候选 profile 列表，不逐个启动 CLI；3rd-review 按 adapter 自动排除与 host 同源
的 profile，并行运行其余成员，管理它们的会话、健康、重试和私有附件 workspace。
WorkflowHub 为同一 identity 使用确定 request ID 重连并轮询 `status`，由 broker
client 的 30 分钟默认 deadline 负责有限生命周期，不查看私有状态文件判断会话
是否健康；Codex host bridge 另有 35 分钟安全 envelope。仅当运维显式设置
`WORKFLOWHUB_HOST_BRIDGE_TIMEOUT_MS` 时才覆盖 host envelope；低于 35 分钟或格式
非法的值回退到 35 分钟，避免 host 先于 broker 杀掉子进程。任一截止后都必须保留
`unavailable`/timeout 事实。每个候选都必须有一条
公共结果；被排除的成员返回 `SAME_SOURCE` 诊断，绝不能被当成通过或悄悄丢弃。

每个 provider 的公开结果最少包含：

```json
{
  "result_protocol": "workflowhub-result.v2",
  "provider": "opencode",
  "adapter": "opencode",
  "model": "opencode/glm-5.2",
  "effort": "high",
  "thinking": null,
  "status": "completed",
  "material_id": "<sha256>",
  "runtime_id": "<opaque-runtime-id>",
  "session_id": null,
  "session_file_path": null,
  "continuable": false,
  "timing": { "started_at_ms": 1, "completed_at_ms": 2, "duration_ms": 1 },
  "usage": null,
  "retry": { "count": 0, "progress_events": 0 },
  "raw_output_ref": null,
  "unavailable_diagnostics": null,
  "output": "provider 最终原文",
  "error": null
}
```

规则：

- `status` 只能是 `completed`、`failed` 或 `cancelled`。
- `session_id`、`output` 可以为空。
- `error` 只能是 `null` 或 `{ "code": "...", "message": "..." }`。
- WorkflowHub 严格校验 `adapter/model/effort/thinking`、时间、usage、retry、runtime/session 和公共结果结构；绝不读取 broker private runtime、raw output 或 session 文件。
- `session_file_path` 必须为 `null`；报告应显示 `SESSION_PATH_UNAVAILABLE`，不能猜测路径。
- provider 未回传 usage 时必须为 `null`，不能用 packet bytes 冒充 token。
- `raw_output_ref` 必须为 `null`；任何 raw output 都是 broker 私有数据。
- 协议不兼容必须在 provider 启动前返回 `PROTOCOL_INCOMPATIBLE`。
- runtime/session 只用于续跑和诊断，不参与材料身份、聚合或放行。
- `completed` 只表示 provider 已返回。只有 reviewer output 解析成功后才有语义结果。

## Reviewer 最小输出

允许完整纯 JSON，或全文唯一一个 fenced JSON object。最小结构：

```json
{
  "verdict": "pass",
  "summary": "简短结论",
  "findings": []
}
```

`verdict` 只能是 `pass` 或 `revise_required`。finding 结构：

```json
{
  "severity": "blocking",
  "path": "材料相对路径",
  "line": 1,
  "issue": "具体问题",
  "root_cause": "可验证的根因",
  "recommendation": "具体建议",
  "evidence_kind": "direct",
  "evidence": "材料中可复核的事实、行为或机器证据"
}
```

`severity` 只能是 `blocking`、`major` 或 `minor`。`path` 必须是 provider 可见的材料相对路径；没有可靠行号时 `line` 可以省略或为 `null`，不得猜测行号。

语义一致性是硬合同：

- `pass` 只能包含 `minor` finding，也可以没有 finding。
- 只要存在 `major` 或 `blocking` finding，`verdict` 必须是 `revise_required`。
- `revise_required` 必须至少包含一条具体 finding，不得只给空泛结论。
- `major` 和 `blocking` 必须有 `root_cause`、`evidence_kind` 和 `evidence`。`evidence_kind` 只能是 `direct`、`machine` 或 `inferred`；不得把猜测标为 direct。
- host 会校验锚点、聚合重复 finding，并只让有足够证据的 cluster 阻断。单个 `inferred` major/blocking 不会因 provider 品牌、置信度或 token 数而自动放行或阻断。

## 聚合规则

只接受 parse-valid 的 `pass|revise_required` 输出。相同 adapter 若返回多个成功
profile，只取配置优先级最高的一条作为该 adapter 的代表；优先级只决定去重代表，不是
模型智力权重，也不会决定 finding 是否成立。host 按 packet 路径、行号和规范化 issue
聚类，并保留每个 provider 的 attribution。

- `blocking|major`：有有效 `direct|machine` anchor，或有至少两个异源 adapter 的相同
  `inferred` evidence，才是 `actionable`。
- 无效 direct/machine anchor 为 `invalid_evidence`；仅一个 inferred adapter 为
  `needs_corroboration`。两者都不让语义 verdict 变成 `revise_required`。
- `minor` 为 `nonblocking_minor`。只有存在 `actionable` cluster，聚合 verdict 才是
  `revise_required`；否则在 quorum 已满足时为 `pass`。

这使具体、可复核证据可以由一个异源 reviewer 报告，同时不会把 transient model
质量波动、品牌或成本当作裁决依据。

每个冻结 snapshot 只允许一次语义审查。`revise_required` 必须原样保留，不能
通过 response ledger、risk acceptance、零 provider action 或同一 snapshot 的再次
调用改成 `pass`。修改后生成新 snapshot 时，才开始一次新的初始审查；旧结果只
作为历史质量事实。`build-code` 永远是完整 phase/integration 审查，`verify-code`
还要绑定新鲜测试和独立审查。response ledger、resolution record 和旧 namespace
不属于当前生产审查输入。

不要求 reviewer 输出 checklist、pass items、skillResults、checked objects、bundle hash、material hash、finding ID、closure bundle 或 session 信息。格式错误时只能请求同一冻结材料的协议恢复；公共 attempt 只保留规范化诊断，不复制 provider 原文。每次失败都不得提升为 pass；后续正式调用可在同一公共合同下再次尝试，不能因为次数耗尽而伪造或阻断语义审查。

## 失败分类

WorkflowHub 只在报告投影层分类，不改 provider 的原始 attempt/result：

- attempt：`completed`、`OUTPUT_INVALID`、`PROVIDER_UNAVAILABLE`、`TIMEOUT`、`SAME_SOURCE`；
- finding：有效、`invalid_anchor`、重复、未采纳；
- 未知错误码归 `UNKNOWN` 并告警。

失败 attempt 的耗时单独统计，不进入有效审查质量分母；失败不会自动重试。

# Provider Protocol

本合同分开两件事：3rd-review 向 WorkflowHub 返回什么，以及 reviewer 模型输出什么。传输成功不等于没有 finding。

## 材料边界

- provider 只能读取 3rd-review 为本次调用准备的只读附件 workspace。
- provider 不得访问真实仓库、运行 Git、读取宿主绝对路径或自行补取材料。
- `material_id` 由 WorkflowHub 根据 canonical manifest 计算，绑定全部 provider 可见文件的相对路径、byte size 和 SHA-256；它不包含宿主路径、provider、session、runtime 或时间。
- 3rd-review 负责附件复制和文件完整性。WorkflowHub 不读取 3rd-review 的 private workspace、`state.json`、raw 文件或内部 attestation。
- 材料缺失、不可读、传输失败或 hash 不符都不是 findings 结果。
- Phase 大 diff 可使用 `diff-index.v1`。provider 只能读取 manifest 内的 index、已选
  shard、摘要和 anchors；材料必须自足完成审查，不存在二次补取或包外工具入口。

## 3rd-review 公共结果：workflowhub-result.v3

普通审查面每一轮 `wh-review` attempt 只发起一次同步 public request：

```text
3rd-review run --request -> terminal workflowhub-result.v3 group
```

request 声明：

```json
{
  "required_result_protocol": "workflowhub-result.v3",
  "host_provider": "codex/terra",
  "provider_allowlist": ["kimi/coding", "codex/terra"]
}
```

request 同时声明本次审查合同和语义材料身份：

```json
{
  "contract_id": "wh-review.contract.build-code.v1",
  "contract_hash": "<sha256>",
  "semantic_hash": "<sha256>"
}
```

`material_id` 仍由 broker 根据已校验附件计算并返回；它不是语义身份，不能用来
判断“只写回状态”或“实际改变了被审行为”。

这是一整个 reviewer group 的一次调用。WorkflowHub 传入本 stage 配置的完整
候选 profile 列表，不逐个启动 CLI；3rd-review 按 adapter 自动排除与 host 同源
的 profile，并行运行其余成员，管理它们的会话、健康、重试和私有附件 workspace。
WorkflowHub 不实现 advisory lock、process flight、polling、poll interval、session lifecycle
或额外 timeout；这些 provider lifecycle 事实由 3rd-review broker 负责。`run` 阻塞到
broker 返回 terminal group；exit code `3` 的 stdout 仍是合法的 unavailable terminal
group，必须按公开协议读取，不能丢弃或改写为空 findings。每个候选都必须有一条
公共结果；被排除的成员返回 `SAME_SOURCE` 诊断，绝不能被当成没有 finding 或悄悄丢弃。

这是一次 reviewer group 的一次 public request。WorkflowHub 不在外层追加 retry、
格式纠正、换 provider、同源兜底或 continuation。broker 可以在这一次 request 内部
按自己的生命周期策略重试，但必须把次数和终态放进公开结果。terminal unavailable、
材料拒绝和真实 semantic finding 都原样记录；它们不能被重放成“没有问题”。如果要
再次审查，必须由上层因为真实材料/代码变化产生新的审查调用，不能为了拿到空 findings
重复同一主题。

唯一例外是 `make-decision.direction`：一次逻辑审查事实严格包含两个有序的 public
request。第一请求只做盲问题重建；只有第一请求的成员都得到可信终态后，第二请求才揭示
`current_selection` 并消费第一请求的重建。两次请求不建立 continuation/session/recovery
状态，也不产生第二条 WorkflowHub review fact；两次请求的 transport、usage 和 timing
都并入同一 attempt 的 provider attempts。第一请求失败时不发送第二请求。

每个 provider 的公开结果最少包含：

```json
{
  "attempts": [{
    "attempt_id": "<opaque-attempt-id>",
    "completed_at_ms": 2,
    "duration_ms": 1,
    "error": null,
    "kind": "initial",
    "provider_retry_count": 0,
    "session_id": null,
    "started_at_ms": 1,
    "status": "completed"
  }],
  "continuable": false,
  "deadline_ms": 360000,
  "error": null,
  "identity": {
    "provider": "opencode",
    "adapter": "opencode",
    "config_id": "<opaque-config-id>",
    "model": "opencode/glm-5.2",
    "source_id": "<opaque-source-id>"
  },
  "material": {
    "material_id": "<sha256>",
    "contract_id": "wh-review.contract.build-code.v1",
    "contract_hash": "<sha256>",
    "semantic_hash": "<sha256>"
  },
  "output": "provider 最终原文",
  "provenance": {
    "raw_output_sha256": null,
    "raw_stderr_sha256": null,
    "runtime_id": "<opaque-runtime-id>"
  },
  "recovery": {
    "provider_internal_retry_count": 0,
    "fresh_execution_retry_count": 0,
    "same_session_repair_count": 0
  },
  "result_protocol": "workflowhub-result.v3",
  "session_id": null,
  "status": "completed",
  "timing": { "started_at_ms": 1, "completed_at_ms": 2, "duration_ms": 1 },
  "usage": null
}
```

规则：

- provider member 的 `status` 只能是 `completed`、`failed` 或 `cancelled`；group 的 `outcome` 才是 `completed`、`partial`、`unavailable` 或 `cancelled`。
- `session_id`、`output` 可以为空。
- `error` 只能是 `null` 或 `{ "code": "...", "message": "..." }`。
- WorkflowHub 严格校验 v3 的 `identity`、`material`、`timing`、`usage`、`recovery`、`runtime/session` 和公共结果结构；绝不读取 broker private runtime、raw output 或 session 文件。
- provider 未回传 usage 时必须为 `null`，不能用 packet bytes 冒充 token。
- v3 `provenance` 只保留 runtime 和 stdout/stderr digest；旧公开投影中的 `raw_output_ref` 若出现，也只能是 `broker-output-ref.v1` 的公开逻辑引用，不能用于读取 broker 私有 raw output。
- 协议不兼容必须在 provider 启动前返回 `PROTOCOL_INCOMPATIBLE`。公共 broker 本身无法启动、以非零码退出或本地调用失败时，WorkflowHub 分别记录 `BROKER_SPAWN_FAILED`、`BROKER_EXIT_NONZERO` 或 `BROKER_INVOCATION_FAILED`；这些是一次 group transport 事实，不是 provider finding，也不能改写成 `findings: []`。
- broker 以 stderr 返回 `{ "error": { "code": "...", "message": "..." } }` 时，WorkflowHub 保留这个安全的公共错误码和消息；非 JSON 输出只保留 stdout/stderr 的 SHA-256，不把原始流或主机路径写入任务材料。
- 一次 group 调用在产生 provider member 之前失败时，attempt 保留配置的 reviewer coverage 和顶层错误，但 `provider_attempts` 为空；不能把同一个 group 失败复制成多个 provider 失败，也不能据此统计多个 provider 重试。
- runtime/session 只用于续跑和诊断，不参与材料身份、聚合或放行。
- `completed` 只表示 provider 已返回。只有 reviewer output 解析成功且符合 findings schema
  后，才有可用的 findings 结果。

## Reviewer 最小输出

允许完整纯 JSON，或全文唯一一个 fenced JSON object。provider 的唯一语义输出是 findings：

```json
{
  "findings": []
}
```

除 `findings` 外不得输出 `verdict`、`summary`、stage 状态或 reviewer 结论。finding 结构：

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

Finding 约束是硬合同：

- `findings` 为空只表示 provider 没有提出具体问题，不表示 stage 完成或允许继续工作。
- `major` 和 `blocking` 必须有 `root_cause`、`evidence_kind` 和 `evidence`。`evidence_kind` 只能是 `direct`、`machine` 或 `inferred`；不得把猜测标为 direct。
- host 会校验锚点、聚合重复 finding，并标出证据充分度。单个 `inferred` major/blocking
  不会因 provider 品牌、置信度或 token 数自动改变 stage 状态。

## 聚合规则

只接受 parse-valid 的 findings 输出。显式 WorkflowHub route 配置了几个 profile，就把几
个 profile 都作为独立的 provider member 记录下来，保留每个 profile 的 attribution；相同
adapter 的多个 profile 不能互相凑出异源 quorum，adapter/source 只用于 quorum 计数。旧的
无 route fallback 仍按配置优先级选每个 adapter 的代表。优先级只决定 fallback 去重，
不是模型智力权重，也不会决定 finding 是否成立。host 按 packet 路径、行号和规范化 issue
聚类，并保留每个 provider 的 attribution。

- `blocking|major`：有有效 `direct|machine` anchor，或有至少两个异源 adapter 的相同
  `inferred` evidence，才是 `actionable`。
- 无效 direct/machine anchor 为 `invalid_evidence`；仅一个 inferred adapter 为
  `needs_corroboration`。两者都只作为事实和处置提示，不是 stage gate。
- `minor` 为 `nonblocking_minor`。存在 `actionable` cluster 时，主 agent 需要处理；没有
  actionable cluster 也不生成 reviewer 结论。

这使具体、可复核证据可以由一个异源 reviewer 报告，同时不会把 transient model
质量波动、品牌或成本当作裁决依据。

每个冻结 snapshot 的每一轮 public request 只允许一次语义 findings 审查；不得用同一个
snapshot 重放真实 finding。修改后生成新 snapshot 时，才开始一次新的初始审查；旧结果只作为历史质量事实。`build-code` 永远是完整 phase/integration
审查，`verify-code` 还要绑定新鲜测试和独立审查。response ledger、resolution record
和旧 namespace 不属于当前生产审查输入。

不要求 reviewer 输出 checklist、skillResults、checked objects、bundle hash、material hash、finding ID、closure bundle 或 session 信息。格式错误直接记录为 `OUTPUT_INVALID` / `unavailable`；WorkflowHub 不发起 continuation、session 恢复或 format-correction 第二次 broker 调用。broker 如需内部重试，必须在同一次 public request 内完成并通过公开 retry facts 报告。公共 attempt 只保留规范化诊断，不复制 provider 原文。每次失败都保持为失败事实，不能伪装成格式修复，也不能因为失败次数伪造或阻断语义审查。

## 失败分类

WorkflowHub 只在报告投影层分类，不改 provider 的原始 attempt/result：

- attempt：`completed`、`partial`、`unavailable`、`OUTPUT_INVALID`、`PROVIDER_UNAVAILABLE`、`TIMEOUT`；
- finding：有效、`invalid_anchor`、重复、未采纳；
- 未知错误码归 `UNKNOWN` 并告警。

失败 attempt 的耗时单独统计，不进入有效审查质量分母。单次 public request 内的
broker 生命周期事实必须可回放；WorkflowHub 不增加第二层重试或 same-source 结果。

## WorkflowHub 处置边界

所有 stage 都只消费可信异源 advice。provider 不输出 `pass`、stage verdict 或完成结论；WorkflowHub
也不能因为缺少 `pass`、空 findings 或 transport 成功而伪造通过。没有最终文本的
`PROCESS_DEAD`、`SIGTERM`、timeout、路径错误、坏 JSON、协议错误和其他 transport failure
只能保留为 `unavailable`/`incomplete` 事实，不能进入 findings、不能变成“没有重要问题”。

build-code 的 review cycle 复用现有 `actionable` 和 `major|blocking` 分类：当前可信语义结果没有
这类 finding 才是该 cycle 的 clean 结束；有重要 finding 时，只有真实修复或被审主题真实变化后
才允许一次 focused review。相同 finding、没有实际变化或 provider 没有可信终态时停止自动继续，
保留 `needs_human`、`unavailable` 或 `incomplete`。这不新增 loop controller、持久状态对象或
WorkflowHub quality gate。

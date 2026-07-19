# Provider Protocol

本合同分开两件事：3rd-review 向 WorkflowHub 返回什么，以及 reviewer 模型输出什么。传输成功不等于审查通过。

## 材料边界

- provider 只能读取 3rd-review 为本次调用准备的只读附件 workspace。
- provider 不得访问真实仓库、运行 Git、读取宿主绝对路径或自行补取材料。
- `material_id` 由 WorkflowHub 根据 canonical manifest 计算，绑定全部 provider 可见文件的相对路径、byte size 和 SHA-256；它不包含宿主路径、provider、session、runtime 或时间。
- 3rd-review 负责附件复制和文件完整性。WorkflowHub 不读取 3rd-review 的 private workspace、`state.json`、raw 文件或内部 attestation。
- 材料缺失、不可读、传输失败或 hash 不符都不是语义 verdict。

## 3rd-review 公共结果：workflowhub-result.v1

WorkflowHub 仍只调用现有入口：

```text
3rd-review.mjs run --request=... --attachments=... --attachments-root=... --attachment-delivery=file_only
```

request 声明：

```json
{
  "required_result_protocol": "workflowhub-result.v1"
}
```

`material_id` 由 broker 根据已校验附件计算并返回，request 不传该字段。

每个 provider 的公开结果最少包含：

```json
{
  "result_protocol": "workflowhub-result.v1",
  "provider": "opencode",
  "status": "completed",
  "material_id": "<sha256>",
  "session_id": null,
  "output": "provider 最终原文",
  "error": null
}
```

规则：

- `status` 只能是 `completed`、`failed` 或 `cancelled`。
- `session_id`、`output` 可以为空。
- `error` 只能是 `null` 或 `{ "code": "...", "message": "..." }`。
- WorkflowHub 只校验协议 major、status、`material_id` 和 reviewer output；增加可选字段不得导致拒绝。
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
  "recommendation": "具体建议"
}
```

`severity` 只能是 `blocking`、`major` 或 `minor`。`path` 必须是 provider 可见的材料相对路径；没有可靠行号时 `line` 可以省略或为 `null`，不得猜测行号。

语义一致性是硬合同：

- `pass` 只能包含 `minor` finding，也可以没有 finding。
- 只要存在 `major` 或 `blocking` finding，`verdict` 必须是 `revise_required`。
- `revise_required` 必须至少包含一条具体 finding，不得只给空泛结论。

不要求 reviewer 输出 checklist、pass items、skillResults、checked objects、bundle hash、material hash、finding ID、closure bundle 或 session 信息。格式错误最多在同一 session 请求一次只重发 JSON；仍失败时本次 provider 结果不可用，原文继续保存，但不得提升为 pass。

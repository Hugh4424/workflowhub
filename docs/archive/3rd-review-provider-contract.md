# 3rd-review Provider Contract V1

本文件定义 Broker 与 provider adapter 的通用边界。不定义审查 verdict、findings、stage 或报告格式；这些由 wh-review 通过 `response_contract` 提供。

## Adapter API

```text
probe(request, provider_config, signal)
  -> binary_path, binary_hash, version, backend, auth_state, capabilities

execute(request, provider_config, signal)
  -> stdout, stderr, exit_code, elapsed_ms, process_metadata

resume(request, session_ref, provider_config, signal)
  -> stdout, stderr, exit_code, elapsed_ms, process_metadata

normalize(raw, response_contract)
  -> generic output envelope + private payload_ref

persist_session(native_state, allowlist)
  -> private session_ref
```

## Generic output envelope

Adapter必须返回：

```json
{
  "format": "json",
  "input_hash": "sha256...",
  "contract_hash": "sha256...",
  "payload_ref": "private://...",
  "output_status": "valid|invalid|truncated|missing",
  "provider_metadata": {
    "provider": "kimi",
    "model": "...",
    "backend": "moonshot",
    "backend_confidence": "verified|inferred|unknown"
  }
}
```

业务 payload 只能通过授权的 `payload_ref` 交给 wh-review。Broker 不访问业务字段。`private://` 只能解析到本次 request 所属的 0700 runtime，读取必须匹配 request、receipt、owner、mode 和 hash。

## Hermetic profile minimum

每个 adapter 必须定义并测试：

- 固定 reviewer working directory；
- 明确 CLI flags，禁用写文件、shell、MCP、plugins、hooks 和默认 persona；
- 明确允许传入的环境变量名称，清除其他环境变量；
- 仅只读挂载/复制必要的认证状态，auth state 与 session state 分离；
- provider-specific `HOME`/XDG/session allowlist，禁止复制整个 HOME/XDG；
- stdout/stderr redaction 和 10 MiB 上限；
- 受保护文件 hash 不变的负向测试；
- 无写工具、无 shell 工具、无 MCP/tool event 的负向测试；
- provider binary probe 到 spawn 之间 realpath/hash 不变；
- `EACCES`、`ENOSPC`、`EROFS` 时保留旧成功结果并产生明确 diagnostic。

## Capability release

fake adapter 测试只能证明 argv/normalizer。continuation capability 必须由真实两轮 smoke 生成版本、binary hash、transport、evidence hash、expiry 和 revocation 信息。未通过、已过期或已撤销时返回顶层 `CONTINUATION_FAILED`，`detail_code=UNSUPPORTED`。

## API-compatible provider

API provider 使用配置中的 `base_url`、`model`、`auth_env` 和安全 header 允许列表；secret 只从运行时环境读取，不进入 JSON request、argv、stdout、receipt 或报告。HTTP retry 必须绑定 request id，并与 CLI 的“不得全文重投”策略分开定义。

## Timeout contract

每个 provider 的默认单次 timeout 为 180 秒；用户可以在全局 JSON 显式提高到 600 秒。request aggregate deadline 另行指定，默认上限建议 900 秒；单次 provider timeout、retry、resume、queue 全部消耗同一 aggregate budget。120 秒是普通审查 SLO，不是硬上限；任何超过 120 秒的执行必须在 metrics 中标记。

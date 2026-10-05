# 3rd-review V3：通用异源 Agent Broker 设计稿

> Archive only — superseded by [ADR 0001: V4 CLI contract](../adr/0001-v4-cli-contract.md). This document preserves the original R01–R60 design history; it is not an implementation contract.

状态：设计稿，未实施；最终 Kimi/Claude Code 外部复审均 `APPROVE`，可进入 Phase 0。V3 继承 [3rd-review-redesign-draft.md](./3rd-review-redesign-draft.md) 的 R01–R60 原始需求；本文只重写实现边界和失败处理。V3 被批准后，V2 中的旧 runner、固定 120/180 秒默认值、Read 事件证明、`lsof` 硬阻断和单体 provider 脚本都不再作为实现依据。

## 1. 先给结论

3rd-review 只做四件事：

1. 接收主 Agent 产生的最小请求；
2. 按全局 JSON 的 tier 并行启动其他 provider CLI；
3. 监控进程、保存原始输出和私有 receipt；
4. 返回每个 provider 的独立结果（含 `session_id`/`runtime_id`，如果 provider 支持）和失败诊断。

审查合同、材料、五个 stage 的质量规则、结果合并、报告标题、报告内容、报告落盘和 stage-result 全部属于 wh-review。3rd-review 不解析 `verdict`、finding、checklist，也不要求 Claude 的 Read 事件；它只提供通用执行和会话能力。

默认直接 `spawn` provider CLI，默认不使用 tmux。需要交互 PTY、后台脱离终端或人工观察时才使用 tmux。tmux 不是 provider 路由器，也不是必需依赖。

不再设置默认 180 秒或 120 秒杀进程。默认 `deadline_seconds=null`，进程只要仍然活跃就继续监控；固定时间只能由调用方或全局配置显式设置。沉默只产生 `idle_warning`/`stalled_suspected`，不自动杀进程、不自动重新派发同一任务。若调用方确实需要硬上限，必须显式设置 deadline，并在 receipt 中记录。

## 2. 为什么上一版耗时长且真实测试失败

这不是某一个 provider 的偶发问题，而是边界设计错误。旧链同时维护了 workflowhub 内置 Claude runner、sibling `run-heterologous-review.mjs` 和 `/tmp/3rd-review-v1`，三套协议、认证、报告和超时互相不兼容。

真实证据包括：

- `/tmp/3rd-review-v1/reviews/phase-b-real-smoke/claude-code/result.json`：provider 启动成功，但返回了工具探索文本，最终 `input_hash_mismatch`；
- `/tmp/3rd-review-v1/reviews/phase-b-real-smoke/kimi/result.json`：返回合法 JSON 内容，但字段是 `status`，不是调用方要求的 `verdict`，被判 `invalid_result_schema`；
- 同一目录的 Codex 结果在预检阶段 `auth_failed`，OpenCode 也在预检阶段失败；
- 旧 host 检测把 macOS `lsof /usr/bin/login` 的空结果当成异常，Claude/Codex/OpenCode 甚至没有启动就被 fail-closed；
- 旧 runner 单 provider、固定约 600 秒，内置 runner 的 idle/retry 没有统一尝试次数；失败后可能再次全文投喂，造成“等很久—杀进程—重新派发”的循环。

根因和删除动作如下：

| 根因 | 结果 | V3 删除/迁移 |
| --- | --- | --- |
| 业务 schema 写死在 core | 合法 provider 输出被误判 | schema 由 wh-review 验证 |
| Read/artifact 证明写死 | Kimi/Codex/OpenCode 无法满足 Claude 事件 | core 只校验输入 hash |
| `--bare`、env-strip、整套 HOME 隔离 | 订阅 OAuth/keychain 失效 | adapter 选择认证模式 |
| `lsof`/进程 ancestry 硬门 | host 未识别就不执行 | host hint 主导，probe 只诊断 |
| 一个超大 `providers.mjs` | CLI 参数、解析、恢复互相污染 | 每 provider 一个薄 adapter |
| 全量 inline skill/material | token 和耗时膨胀 | wh-review 生成 bounded prompt/delta |
| 预检 inference canary | 每个 provider 多一次真实调用 | 只做 binary/version/auth 状态探测 |
| `status=success` 就停 tier | unknown identity 误阻断 fallback | 只按 `execution_eligible` 停层 |
| 无上限 retry/fresh | 无限重派和重复成本 | 一次 resume/repair，禁止 silent fresh |

## 3. 外部项目调研结论

没有一个项目可以直接作为 workflowhub 的完整依赖，但它们提供了可以组合的成熟模式：

| 项目 | 值得复用 | 不直接复用 |
| --- | --- | --- |
| [partner-skill](https://github.com/LearnPrompt/partner-skill) | `submit/status/result/resume/cancel`、同会话、job 目录、receipt、failure playbook | Codex 专用 JSONL 和完整 Partner 工作流 |
| [oh-my-claudecode](https://github.com/Yeachan-Heo/oh-my-claudecode) | `omc ask` 薄 CLI、`which/--version` 探测、可选 tmux、heartbeat/outbox | Team、hooks、worktree、整套 Claude 编排 |
| [qiaomu-llm-mcp](https://github.com/joeseesun/qiaomu-llm-mcp) | `~/.config/.../registry.json`、`secret_ref`、model 路由、错误归一化 | MCP/API 作为强制执行层 |
| [oh-my-codex](https://github.com/Yeachan-Heo/oh-my-codex) | `doctor` + 真实 smoke、direct/tmux 选择、session state | Codex 专属目标、skill、HUD |
| [oh-my-opencode](https://github.com/HaiNinh1/oh-my-opencode) | provider/model fallback、cooldown、并发上限、session recovery、doctor | 25+ hooks、MCP、完整编排层 |
| [tmux](https://github.com/tmux/tmux) | detached PTY、`has-session`、`capture-pane`、人工 attach | 不负责 provider、路由、JSON 解析或恢复 |

最接近目标的组合是：partner 的 job/receipt + qiaomu 的 registry + OMC 的探测/可选 tmux + OMO 的有限 fallback。只借鉴模式，不引入这些项目的运行时依赖。

## 4. V3 架构

```mermaid
flowchart LR
  H[Claude/Kimi/Codex/OpenCode host skill]
  H --> B[3rd-review broker]
  B --> C[config loader\n~/.config/3rd-review/config.json]
  B --> S[common supervisor\nspawn / process group / activity]
  S --> A1[claude-code adapter]
  S --> A2[kimi adapter]
  S --> A3[codex adapter]
  S --> A4[opencode adapter]
  S -. optional .-> T[tmux PTY]
  A1 --> R[/tmp receipt + raw output]
  A2 --> R
  A3 --> R
  A4 --> R
  R --> W[wh-review: contract / merge / report / stage-result]
```

### 4.1 Broker

Broker 只负责：配置快照、请求 hash、tier 并行、同源过滤、调用 adapter、状态汇总、失败保留、receipt 写入、`status/resume/cancel/read-private`。

Broker 不负责：stage 选择、审查提示词、材料清单、Read set、finding 去重、verdict 多数票、报告或 stage-result。

### 4.2 Common supervisor

Common supervisor 是唯一的进程治理实现：

- `spawn(command, argv, {cwd, env, stdio})`，禁止 shell 拼接；
- Unix 创建独立 process group，Windows 使用 Job Object 或等价能力；
- stdout/stderr 实时写入 `0600` 文件，各自有可配置上限，超限停止收集并记录 `OUTPUT_LIMIT`；
- 直接模式取消顺序为 `SIGINT → SIGTERM → SIGKILL`，每一步等待进程组结束；tmux 模式使用 `send-keys C-c → kill-pane → kill-session`；
- 记录 pid、start fingerprint、exit code、signal、最后输出时间和最后 heartbeat；
- CLI adapter 的 stdout/stderr 增长和 NDJSON 事件由 supervisor 以 `onActivity(event)` 记录；没有独立事件流时，输出增长本身就是 activity，不能使用未定义的“adapter event”假设 provider 正在思考；
- 未来 `kind: "api"` plan 使用同一 attempt/receipt/limits，但由 adapter/supervisor 的 `AbortController` 管理 HTTP 请求，不创建子进程；当前四个内置 provider 不走此分支；
- 直接模式和 tmux 模式使用同一状态机，tmux 只替换 PTY 承载；
- 每次 `run/resume` 启动时按固定 session 前缀 `3rd-review-<runtime-id>-<provider>` 清理已过期且无 active lease 的 orphan tmux pane/session；lease 文件位于 `$TMPDIR/3rd-review/.leases/<runtime-id>/<provider>`，使用原子创建和 owner uid/pid 校验；不杀仍有 lease 的任务；
- 写盘使用临时文件 + atomic rename，`ENOSPC/EACCES` 作为明确失败，不吞掉。

### 4.3 Thin adapter

每个 provider 一个独立模块，而不是每个 provider 复制一套 runner：

```js
export default {
  id,
  probe(ctx),       // which/--version，可选 auth status
  buildStart(ctx),  // TransportPlan；材料编码由 adapter 决定
  buildResume(ctx), // provider 原生 session 续跑
  parse(stdout, stderr, ctx),
  classify(error, ctx)
}
```

`buildStart/buildResume` 返回以下二选一的传输计划，Broker 不猜测 provider 的输入方式：

```js
{ kind: "cli", command, argv, env, cwd, input: { mode: "stdin" | "argv" | "temp_file", value } }
{ kind: "api", base_url, method: "POST", headers, body, auth_env }
```

当前四个内置 provider 只实现 `kind: "cli"`；`kind: "api"` 只预留给未来的 OpenAI-compatible adapter，仍然使用 Node 内置 `fetch`，不引入常驻服务或第三方依赖。API key 只从 `auth_env`/provider config 读取，在内存中构造 `Authorization` header；header 值、auth_env 值和任何 secret 都不能进入 request、input_hash、argv、body、receipt 或报告。

`parse` 必须声明输入是一次性 JSON、文本还是 NDJSON/stream-json，并在 adapter 内累积流后提取最终消息、session id、usage 和退出状态。新增 provider 只需增加 `adapters/<provider>.mjs`、一个真实 smoke fixture 和配置项；不修改 tier、supervisor、receipt 或 wh-review。Node 版本与现有项目一致，不为每个 provider 再引入 Python 运行时。

### 4.4 Host 集成与 request 协议

全局 `3rd-review` skill 负责识别“审查/仔细审查/异源审查”等意图，生成最小 `ReviewRequest`，注入 host hint，调用 Broker，并把 opaque result 返回给主 Agent。Broker 不解析自然语言，也不决定 stage 或业务 verdict。

首轮 request 的最小结构：

```json
{
  "protocol_version": 3,
  "request_id": "uuid",
  "nonce": "base64url-random-128bit",
  "runtime_id": null,
  "round": 1,
  "host_hint": {"provider": "codex", "backend": "codex-cli", "wrapper_hash": "sha256:..."},
  "material": {"encoding": "text", "text": "bounded prompt", "input_hash": "sha256:...", "bytes": 1234},
  "contract_ref": "opaque://wh-review/contract-hash",
  "previous_receipt_hash": null,
  "force_tier": null,
  "overrides": {}
}
```

`material.text` 是 wh-review 生成的 bounded opaque 输入；Broker 先拒绝未配对 UTF-16 surrogate 等非法 Unicode scalar，再按严格 UTF-8 字节重新计算 `bytes` 和 `input_hash`，不自动替换为 U+FFFD，也不信任调用方声明值或读取合同语义。`input_hash` 覆盖 `material.text` 的全部 UTF-8 字节；声明的 `bytes` 或 hash 不一致返回 `REQUEST_INVALID`。超大材料必须在 spawn 前拒绝。`contract_ref` 只作为绑定值，必须是最长 512 字节的 `opaque://` 字符串；合同内容和验证由 wh-review 管理。

`request_id`、`runtime_id` 和 `nonce` 都只能是 1–128 字节的 `[A-Za-z0-9_-]`/base64url 不透明值，不能包含路径分隔符。`request_id` 使用 UUIDv4；`runtime_id` 和 nonce 使用系统 CSPRNG 生成的 16 字节 base64url 值。nonce 绑定到 request、runtime、owner uid 和 receipt；不进入 prompt、argv、provider body、stdout 或公开报告。Broker 首次收到缺失 nonce 的 request 时自动生成 nonce 并返回；之后所有 `run/resume/read-private` 都必须带回相同 nonce。相同 `request_id + nonce` 返回已有 job，nonce 不同返回 `REPLAY_DETECTED`；已存在的 `request_id` 缺 nonce 时返回 `NONCE_REQUIRED`，不创建第二个 job。nonce 与对应 receipt 共享 24 小时未使用 TTL；active lease 存在时不因墙钟杀进程或提前失效，终态且过期后返回 `NONCE_EXPIRED`，调用方必须用新 `request_id` 创建 request。nonce 泄露时由调用方先 cancel 旧 job，再以新 `request_id` 创建 request，不支持静默轮换。

`round` 是从 1 开始的连续整数：`round=1` 时 `previous_receipt_hash` 必须为 null；后续 round 必须引用同一 `runtime_id + provider` 的上一轮 receipt，不能跳号。Broker 只验证连续性和 hash，wh-review 决定何时发起下一轮。`force_tier` 只允许 wh-review 的受信调用使用，普通 host request 必须为 null。

### 4.5 Result、receipt 和 private payload

Broker 返回的 canonical result 只描述执行，不包含业务 verdict：

```json
{
  "request_id": "uuid",
  "nonce": "...",
  "config_hash": "sha256:...",
  "selected_tier": 0,
  "stop_reason": "execution_eligible|no_eligible|forced_tier|all_failed|runtime_unavailable",
  "providers": [{
    "id": "kimi",
    "status": "completed",
    "execution_eligible": true,
    "session_id": "provider-native-id-or-null",
    "runtime_id": "opaque-id",
    "receipt_ref": "private://...",
    "diagnostic_ref": null,
    "metrics": {"elapsed_ms": 0, "turns": 0, "input_bytes": 0, "output_bytes": 0, "retry_count": 0},
    "error_code": null,
    "persisted": true
  }]
}
```

`status: "completed"` 只有在 raw output、receipt 和必要 diagnostic 已成功持久化时才允许；进程完成但写盘失败时返回 `status: "failed"`、`execution_eligible: false`、`error_code: "RUNTIME_UNAVAILABLE"`、`persisted: false`，内存中的结果不得被标记为成功。若所有 provider 都发生该错误，aggregate `stop_reason` 为 `runtime_unavailable`；其他 provider 的成功结果仍保留。

私有 receipt 还保存 `request_id`、nonce、owner uid、config snapshot/hash、provider profile hash、input/contract hash、round、session、raw/diagnostic 路径和 expiry。wh-review 通过本地接口读取，不直接拼接路径：

```text
3rd-review read-private --runtime-id <id> --provider <provider> --nonce <nonce> --ref raw|diagnostic|receipt
```

该接口只接受 `raw|diagnostic|receipt` 三个 canonical ref，校验当前 uid、nonce、request/runtime 绑定、`0600` receipt 和路径 containment：runtime/provider id 先按路径分隔符拆成组件，每个组件必须匹配 `[A-Za-z0-9_-]{1,64}`，拒绝空组件、`.`、`..`、反斜杠、NUL、NTFS ADS 和绝对路径；对 runtime root、provider 目录和目标文件执行 `lstat/realpath`，拒绝符号链接逃逸和 root 外路径，并要求 canonical path 以 `$TMPDIR/3rd-review/` 加路径分隔符为前缀。raw/diagnostic 写入前脱敏已知 auth_env 值，读取时仍标记为 sensitive，不能出现在公开报告。不能读取其他 job，不能输出 secrets。`status/cancel/read-private` 是纯读/控制操作，不触发 GC。

## 5. 活跃进程监控和超时策略

### 5.1 配置语义

```json
{
  "deadline_seconds": null,
  "idle_warning_seconds": 600,
  "stalled_suspected_seconds": 1200,
  "poll_interval_seconds": 5,
  "max_turns": 16,
  "max_input_bytes": 524288,
  "max_input_tokens": null,
  "max_output_bytes": 10485760,
  "max_output_tokens": null,
  "max_budget_usd": null
}
```

- `deadline_seconds=null`：无默认 wall-clock kill；进程正常结束或用户取消才结束；
- `deadline_seconds=N`：仅在用户明确设置时启用，超时返回 `DEADLINE_EXCEEDED`；
- `idle_warning_seconds`：只改变状态/提示，不杀进程，不触发重复派发；
- `stalled_suspected_seconds`：进程仍存在但连续没有 stdout/stderr、adapter 事件或 PTY 变化时，标记为疑似卡住；只提醒和等待人工 `status/cancel`，不把它当成失败重派。CPU/IO 只做可选诊断，不是跨平台必需能力；
- `max_turns`、`max_output_bytes`：优先使用 provider 原生成本和输出边界，不依赖墙钟。`max_turns` 是默认 16，表示最多允许 16 个完整 turn（第 16 个完成后停止，不启动第 17 个），可按 provider 覆盖；provider 不支持时 adapter 必须标记 `limit_unenforced`，不能假装已限制；
- `max_input_bytes`、`max_input_tokens`：在 spawn 前校验 request；`bytes` 由 Broker 计算，token 只有在 adapter 声明 tokenizer/估算器时才校验；不支持 token 估算却设置了上限时返回 `UNSUPPORTED`，超限返回 `INPUT_TOO_LARGE`，不启动 provider；
- `max_output_tokens`、`max_budget_usd`：provider 支持时透传；不支持时只记录“未执行成本限制”，不能伪造已限制；
- request 可以覆盖全局值，但不能把 `null` 静默改成 180/600。

### 5.2 状态机

```text
created → starting → running
running → waiting_auth | waiting_input | waiting_network | idle_warning | stalled_suspected
running → completed | failed | cancelled | deadline_exceeded
process vanished without receipt → failed/PROCESS_DIED
```

`RUNTIME_UNAVAILABLE` 不是独立生命周期状态，而是 `failed` 终态的 `error_code`；任何 provider 的 raw/receipt 无法持久化时都必须走 `failed(error_code=RUNTIME_UNAVAILABLE, persisted=false)`。

每 5 秒更新一次 heartbeat。一次 heartbeat 只需证明：进程仍存在、进程组仍存在、stdout/stderr 是否增长、adapter 是否收到新事件、tmux pane 是否存在。CPU/IO 统计只能作为辅助证据，不能作为“模型一定在思考”的证明。

长时间无输出但进程仍存活时，状态为 `idle_warning`、`stalled_suspected` 或 `waiting_unknown`。Broker 不杀、不 fresh、不重复派发；用户可以 `3rd-review status`、`cancel`，或者等待 provider 自己结束。已知认证提示、交互提示、网络重连提示分别归类为 `waiting_auth`、`waiting_input`、`waiting_network`，这些状态不自动重试。这样“进程被 180 秒杀掉后又从头开始”的循环被彻底切断。

### 5.3 防止无限循环

- 一个 request/provider 只有一个 active attempt；相同 request 的重复 `run` 返回已有 job，而不是再开进程；
- 终态前不允许另一个 worker 抢占；通过 `/tmp` lock/lease 防重复；
- provider 明确返回 transient 且已有 session：最多一次同 session `resume`；
- 已完成但输出格式不合法：最多一次不重发材料的 JSON repair；
- 无 session、认证失败、spawn 失败、host block、进程死亡或 idle：不自动 fresh；
- resume/repair 失败直接保留诊断并继续其他 provider/tier；只有 wh-review 明确发起 fresh request 才允许新会话。

## 6. 四个内置 provider 的调用边界

具体 flags 由 adapter 按实际 `--help`/版本能力构造，不能由 Broker 猜测或硬编码一个“万能 argv”。以下是当前 CLI 的最小形态：

| Provider | 首轮 | 续跑 | 认证/隔离要点 |
| --- | --- | --- | --- |
| Claude Code | `claude -p --output-format json --safe-mode --permission-mode plan --tools Read ...` | `claude --resume <id> -p ...` | 不用 `--bare`、`--no-session-persistence`；safe mode 保留 OAuth/keychain，禁用自定义 hooks/plugins/MCP |
| Kimi | `kimi -p ... --output-format stream-json --model ... --agent-file <readonly.yaml> --skills-dir <empty> --mcp-config {}` | `kimi --session <id> -p ... --output-format stream-json` | 使用明确的只读 agent 文件；仅 `--plan` 不足以改变默认工具；不使用 `--yolo` |
| Codex | `codex exec --json -s read-only -C <runtime> -m <model> ...` | `codex exec resume <id> --json ...` | 默认不使用 `--ignore-user-config` 破坏订阅认证；通过 read-only/profile 覆盖禁写；resume/schema 能力按版本 probe |
| OpenCode | `opencode run --format json --model provider/model --variant <effort> --agent <readonly> ...` | `opencode run --session <id> --format json ...` | `--pure` 只禁插件，不等于禁写；必须配只读 agent/config；模型必须来自 `opencode models`/用户配置 |

认证模式由 adapter 声明：`native_login`、`env`、`config_ref`。全局配置只保存环境变量名或配置引用，不保存 key。不能为了“隔离”复制整个 HOME，也不能用 `--bare` 代替订阅认证；如果某 provider 无法在只读 profile 中安全复用登录态，返回 `AUTH_UNAVAILABLE`，不伪造成功。每个 adapter 必须在 `probe` 结果中记录当前 CLI 版本和已验证的 flags；OpenCode 的 `--agent/--variant`、Codex 的 resume/schema 等能力必须按本机 `--help` 结果决定，未知能力返回 `UNSUPPORTED`。

材料传递完全由 adapter 负责：Claude/Kimi 可用 `-p` 或 stdin，Codex/OpenCode 按当前版本选择 stdin、参数或受控临时文件；禁止 shell 拼接和未经转义的 prompt 参数。所有方式都必须写入同一个 `input_hash`，以便 continuation 校验。

输出解析只做 transport 层工作：提取最终文本/JSON、原生 session id、model/backend、usage 和退出状态；可去除 Markdown code fence，但不把 `status` 自动猜成业务 `verdict`。如果达到 `max_output_bytes` 时最终 JSON/stream 尚未完整，直接返回 `OUTPUT_LIMIT`，不可 repair；只有完整输出但 JSON 语法错误才返回 `INVALID_JSON`。Broker 发现 `INVALID_JSON` 且存在 session 时，最多调用同一 adapter 的 `parse(..., {repair: true})` 一次，repair 不重新投喂材料；业务合同不匹配由 wh-review 记录 `INVALID_PROVIDER_OUTPUT`，Broker 不返回该业务错误码。

## 7. 全局配置和路由

配置文件：`~/.config/3rd-review/config.json`，目录 `0700`、文件 `0600`。配置修改使用临时文件和 atomic rename。

```json
{
  "version": 3,
  "defaults": {
    "mode": "direct",
    "deadline_seconds": null,
    "idle_warning_seconds": 600,
    "stalled_suspected_seconds": 1200,
    "poll_interval_seconds": 5,
    "max_turns": 16,
    "max_input_bytes": 524288,
    "max_input_tokens": null,
    "max_output_bytes": 10485760,
    "max_output_tokens": null,
    "max_budget_usd": null
  },
  "tiers": [
    ["claude-code", "kimi", "codex"],
    ["opencode"]
  ],
  "providers": {
    "claude-code": {"enabled": true, "kind": "cli", "command": "claude", "model": "sonnet", "effort": "medium", "auth_mode": "native_login", "auth_env": [], "env_allowlist": ["PATH", "HOME", "TERM", "LANG", "LC_ALL", "LC_CTYPE", "NO_COLOR", "THIRD_REVIEW_ACTIVE"]},
    "kimi": {"enabled": true, "kind": "cli", "command": "kimi", "model": "default", "effort": "medium", "auth_mode": "native_login", "auth_env": [], "env_allowlist": ["PATH", "HOME", "TERM", "LANG", "LC_ALL", "LC_CTYPE", "NO_COLOR", "THIRD_REVIEW_ACTIVE"]},
    "codex": {"enabled": true, "kind": "cli", "command": "codex", "model": "gpt-5.4", "effort": "medium", "auth_mode": "native_login", "auth_env": [], "env_allowlist": ["PATH", "HOME", "TERM", "LANG", "LC_ALL", "LC_CTYPE", "NO_COLOR", "THIRD_REVIEW_ACTIVE"]},
    "opencode": {"enabled": true, "kind": "cli", "command": "opencode", "model": "provider/model", "effort": "medium", "auth_mode": "config_ref", "auth_env": [], "env_allowlist": ["PATH", "HOME", "TERM", "LANG", "LC_ALL", "LC_CTYPE", "NO_COLOR", "THIRD_REVIEW_ACTIVE"]}
  }
}
```

`kind: "cli"` 可以使用订阅、OAuth、API key 或 OpenAI-compatible backend，只要该 provider CLI 自己支持并通过 `native_login`、`auth_env` 或 `config_ref` 注入。全局 JSON 只保存变量名/配置引用，不保存密钥。未来若确实需要直连 HTTP，再增加 `kind: "api"` adapter，不改变 CLI 路由协议。

`env_allowlist` 是在不可删除的安全基础集合（`PATH`、`TERM`、`LANG`、`LC_ALL`、`LC_CTYPE`、`NO_COLOR`、`THIRD_REVIEW_ACTIVE`）上追加 provider 配置目录和 `auth_env`；provider 不能删掉基础集合，`CODEX_HOME` 等 provider 专用变量由对应 adapter 显式追加并记录在 profile hash 中。

读取配置后立即生成 canonical JSON 的 SHA-256 `config_hash`，写入每个 receipt。Canonical 规则固定为 UTF-8、递归按 Unicode code-point 排序对象键、数组保持原顺序、保留 `null`、仅允许有限 IEEE-754 binary64 number（拒绝 `NaN`、`Infinity`、`-0` 和溢出值，指数和小数按 JCS 规则规范化且不保留尾随零）、无空白和无末尾换行；不能使用平台对象遍历顺序或原始文件换行。`config_hash = SHA-256(canonical_json(parsed_config))`，实现不一致时拒绝加载配置。`resume` 必须使用相同的 `config_hash`、provider profile、model、backend 和 auth mode；配置发生变化时返回 `CONFIG_SNAPSHOT_CHANGED`，不得静默续跑旧 session。

`runtime_id` 在首轮由 Broker 生成并写入 receipt；调用方传入的 runtime 只能引用同一 owner/nonce 下的既有 runtime。runtime id 冲突、owner 不匹配或路径已存在但 receipt 不匹配时返回 `RUNTIME_ID_CONFLICT`/`BINDING_MISMATCH`，绝不复用目录。

路由规则：

1. 配置加载时只对 `enabled: true` provider 计数；拒绝同一个 enabled provider 出现在多个 tier、tier 不是数组或 provider id 未注册；disabled provider 可以保留在配置中但永远不启动；
2. 过滤 disabled、显式 excluded 和明确同源 provider/backend；
3. 当前 tier 的可运行 provider 并行执行；
4. 保留所有成功结果，失败独立写 diagnostic；
5. 当前 tier 只有在至少一个结果 `execution_eligible=true` 时停止；
6. 零个 `execution_eligible` 才进入下一层；host unknown 的成功只能作为参考，不能停止 fallback；
7. `force_tier` 必须是从 0 开始的整数且小于 tier 数量；越界、负数或空 tier 返回 `REQUEST_INVALID`，合法但所有 provider 被禁用/同源排除时返回 `NO_ELIGIBLE`，不自动改用其他 tier；
8. wh-review 若发现业务合同无效，可通过新的 request 显式指定 `force_tier` 或在同 session 发起一次 repair；Broker 不自行改变 tier；
9. 主 Agent 合并结果，3rd-review 不做多数票或仲裁。

`execution_eligible` 是 3rd-review 的通用传输状态：进程正常结束、输出非空且能被 adapter 解析、receipt 已提交、host/backend 满足异源过滤，并且没有 `host_unknown`、`AUTH_*`、`HOST_*`、`OUTPUT_*`、`PROCESS_*`、`RUNTIME_UNAVAILABLE` 或 `CONFIG_*` 失败。它不代表审查业务正确，也不代表通过。

`business_valid`、`verdict`、`findings` 和 `approval_eligible` 只由 wh-review 根据 stage-specific contract 产生。Broker 不读取这些字段的含义。若当前 tier 有传输成功但业务合同无效的结果，wh-review 可以在同一 session 上发起一次 repair，或明确发起下一 tier；Broker 不偷偷把业务失败转换成 fresh 重试。

## 8. 会话和临时 runtime

- 每个 provider 独立保存自己的 native session id；provider 之间绝不交换 session；
- 私有 runtime：`$TMPDIR/3rd-review/<runtime-id>/<provider>/`，目录 `0700`、文件 `0600`。`runtime-id` 是跨 round 稳定的不透明句柄，不随每轮 request-id 重建；一个 provider 一个目录，provider 之间不共享文件；
- receipt 内保存 `runtime_id`、`session_id`、adapter/version、model、effort、profile hash、`config_hash`、input/contract hash、root/latest round 和 expiry；wh-review 可用 `runtime_id + provider` 找到上一轮并继续；公开结果可以带 `session_id`，公开报告只显示是否复用和节省的 bytes/tokens/time；
- runtime 不默认替换 provider 的原生认证目录。需要临时 `HOME`/`CODEX_HOME` 时只 staging 必要的只读认证状态，不复制整套用户配置，不把 token 写入 receipt；provider 自己产生的 native session 文件只由对应 adapter 管理。
- runtime 连续 24 小时未成功使用即过期；只在 `run` 或 `resume` 启动时扫描 `$TMPDIR/3rd-review/` 下的过期 runtime，跳过 active lease，`status/cancel/read-private` 不延长 TTL、也不触发 GC；不引入 daemon/cron/launchd；
- round 2+ 由 wh-review 生成 delta、current manifest 和 previous receipt hash；broker 只验证 hash/lineage/binding，不重新解释 manifest 规则；
- session、model、backend、profile、`config_hash` 或 input hash 不一致返回 `CONFIG_SNAPSHOT_CHANGED` 或 `CONTINUATION_FAILED/BINDING_MISMATCH`，不静默 fresh；
- provider 不支持 native continuation 时返回 `CONTINUATION_FAILED/UNSUPPORTED`，不丢弃同层其他成功结果。

## 9. Host、插件信任和安全边界

接受“受约束的插件信任”，但不再引入 PKI、跨进程签名、`lsof` 硬门或 managed restricted profile：

- host skill/wrapper 显式注入 `host_provider`、`host_backend`、wrapper 路径和 manifest hash；这是同源排除的主要证据；
- 缺失或失效时标记 `host_unknown`，仍执行 provider，但不能 `execution_eligible`；
- process ancestry、`ps`、`lsof` 只作为诊断字段，空结果不能阻止 provider 启动；
- managed host 的 data-egress、EACCES/EPERM、网络代理或策略拒绝不能绕过，记录 `blocked_by_host`，不伪装成 provider auth/network 失败；
- child env 设置 `THIRD_REVIEW_ACTIVE=1`，host skill 看到该标记时拒绝再次调用 3rd-review；prompt 同时明确禁止递归调用；
- secrets 只能由 provider 自己的 native login、环境变量或 config_ref 读取；不进入 request、prompt、argv、stdout、receipt 或报告；
- 每个 adapter 只能传递固定环境白名单：`PATH`、`HOME`/provider 原生配置目录、`TERM`、`LANG`/`LC_*`、`NO_COLOR`、明确声明的 `auth_env` 和 `THIRD_REVIEW_ACTIVE`；其余环境变量默认清除，receipt 只记录名称不记录值；
- adapter 生成的只读 profile 必须禁止写文件、危险执行和外部副作用；MCP、第三方 plugins、skills 默认关闭。若 provider 只能通过 Shell 读取材料，则默认拒绝 Shell；确需启用时只允许预先声明的只读命令（如 `cat/head/tail/sed/rg/find`）、固定 cwd、禁止重定向/命令替换/管道写入，并由 provider sandbox 再约束。不能因为“只读审查”而假设所有 provider 都有同名 `Read` 工具。认证配置按 provider 只读复用，无法同时满足时返回 `AUTH_UNAVAILABLE`。

## 10. 异常与恢复基线

该表必须随代码维护，不能在重构时删除对应测试：

| 阶段 | 代码 | 自动动作 | 是否重试 |
| --- | --- | --- | --- |
| request | `REQUEST_INVALID`、`NONCE_REQUIRED`、`NONCE_EXPIRED`、`REPLAY_DETECTED`、`INPUT_TOO_LARGE` | spawn 前拒绝，返回字段/大小/nonce 诊断 | 否 |
| binary/version | `BINARY_NOT_FOUND`、`BINARY_CHANGED` | 写诊断，进入其他 provider | 否 |
| config | `CONFIG_INVALID`、`DUPLICATE_PROVIDER_TIER`、`CONFIG_SNAPSHOT_CHANGED` | 拒绝加载或拒绝续跑，保留旧 receipt | 否 |
| auth | `AUTH_UNAVAILABLE`、`AUTH_INTERACTIVE` | 提示用户登录 | 否 |
| host | `BLOCKED_BY_HOST` | 记录 errno/策略 | 否 |
| network | `NETWORK_DNS`、`PROVIDER_429`、`PROVIDER_5XX` | 有 session 才 resume 一次 | 最多一次 |
| process | `PROCESS_DIED`、`SPAWN_EACCES` | 回收进程组，写 stderr | 否 |
| activity | `IDLE_WARNING`、`STALLED_SUSPECTED`、`WAITING_INPUT` | 保持 job，等待 status/cancel | 否 |
| deadline | `DEADLINE_EXCEEDED` | 仅显式 deadline 时 SIGINT/TERM/KILL | 否 |
| output | `INVALID_JSON` | 已有 session 时仅做一次 JSON-only repair，不重发材料 | 最多一次 |
| output | `OUTPUT_LIMIT` | 标记截断并失败；不得假设 repair 能恢复丢失内容；wh-review 明确发起新 request 才能提高上限 | 否 |
| business | `INVALID_PROVIDER_OUTPUT` | 由 wh-review 根据业务合同标记；Broker 只返回 transport parse 结果 | 否 |
| continuation | `CONTINUATION_FAILED`（`MISSING/EXPIRED/BINDING_MISMATCH/UNSUPPORTED/REJECTED`）、`RUNTIME_ID_CONFLICT` | 不 fresh，交给 wh-review 决定 | 否 |
| storage | `ENOSPC`、`EACCES`、receipt hash mismatch | 尽力写 diagnostic receipt；返回 `RUNTIME_UNAVAILABLE`，stderr 明示，绝不宣称成功 | 否 |
| scheduling | `DUPLICATE_ACTIVE_REQUEST` | 返回现有 request/job | 否 |
| routing | `NO_ELIGIBLE` | 指定 tier 没有可运行 provider；不自动跳 tier | 否 |

失败结果不会增加 wh-review 业务 round，不覆盖旧 success，不生成假的 report。部分成功立即可读；全部失败才返回聚合失败。

## 11. wh-review 的职责边界

wh-review 保留原有高质量规则：

- 根据五个 stage、风险和轮次选择审查方式、lens、合同和 provider 数量；
- 生成 bounded prompt、材料 package、manifest、required read set、verified facts 和 delta；
- 让 provider 输出 stage-specific contract；
- 验证每个 provider 的 verdict/findings/checklist、hard invariant、冲突和 closure；
- 合并独立意见，生成 agenthub 风格标题、结论先行报告、Revision Record、报告索引和 stage-result；
- 失败只落 diagnostic，不增加业务轮次；
- round 2+ 从每个 provider 的私有 session receipt 续跑，不把 Claude session 交给 Kimi/Codex/OpenCode；
- 控制输入 bytes、估算 tokens、effort、max_turns 和是否 full review。完整 `SKILL.md` 不进入 reviewer context。

3rd-review 不再重复这些规则，也不再落盘 workflowhub 的业务报告。

## 12. 安全不变量和威胁模型

- **重放/重复执行**：`request_id + nonce`、owner uid 和 active lease 必须同时匹配；不匹配就拒绝，不创建第二个 job。
- **路径逃逸**：所有 runtime/provider/ref 参数先做字符集校验，再做 `lstat/realpath` containment；禁止 `..`、绝对路径和符号链接逃逸。
- **配置漂移**：canonical config/profile hash 进入 receipt；resume hash 不一致就返回 `CONFIG_SNAPSHOT_CHANGED`，不能静默 fresh。
- **递归调用**：子进程带 `THIRD_REVIEW_ACTIVE=1`；host skill 看到该标记不得再次触发 3rd-review。
- **凭据泄露**：secret 只从 native login、`auth_env` 或 `config_ref` 读取；不进 prompt、argv、body、receipt、公开结果或报告；raw/diagnostic 只写入脱敏后的 `0600` 文件。
- **宿主限制**：data-egress、EACCES/EPERM、代理拒绝和策略拒绝只记录为 `blocked_by_host`，不绕过、不伪装、不自动重派。

## 13. 实施顺序和验收

每个 phase 完成后先用真实 Kimi 或 Claude Code 做 bounded 外部审查，外部审查未通过不进入下一 phase；宿主策略阻断时保存 `blocked_by_host` 证据，换到允许外发的 host 补验。所有实现必须在独立 git worktree、`codex/*` 分支中完成，不直接修改主 checkout；生产代码软预算为约 600–1200 行、6–10 个文件，按实际提交统计，超过任一上限必须暂停该 phase、说明新增复杂度并由独立 provider 复审，不能作者自审放行。

1. **Phase 0：删双栈**：冻结 request/result/receipt、nonce、`read-private`、config snapshot/hash 和 material delivery 协议；实现 mock broker/adapter 作为集成测试基线；确认新入口，停止旧 sibling runner 和内置 runner 的并行维护。
2. **Phase 1：common supervisor**：direct spawn、process group、activity heartbeat、status/cancel、无默认 deadline、输出上限和私有 receipt。
3. **Phase 2：四个薄 adapter**：Claude/Kimi/Codex/OpenCode 的真实 `--help` 能力探测、native auth、环境白名单、只读 profile、材料传递、最终输出和 session id 解析；保留 `kind: "api"` 的可扩展边界，不在本阶段引入 HTTP 服务。
4. **Phase 3：broker 路由**：全局 JSON、tier 并行、eligible 停层、部分成功保留、host unknown 降级。
5. **Phase 4：有限恢复**：一次同 session resume、一次 JSON repair、continuation receipt、24 小时 GC、重复请求锁。
6. **Phase 5：真实矩阵**：四个 host × 四个 reviewer，覆盖同源排除、异源成功、auth 失败、host block、network、idle、cancel、invalid output、session continuation、config change、read-private、input too large 和 partial success。
7. **Phase 6：wh-review 接线**：只接入 request、contract validation、merge、report、stage-result；删除旧 Read-attestation 和全文 fresh retry。

发布门禁：fake fixture 只证明 supervisor/protocol；每个 adapter 必须有真实短输入 smoke；continuation 必须逐 provider 两轮实测后才标记 supported；未证明 provider 只能返回 `UNSUPPORTED`，不能把 fixture 绿灯当成真实能力。

## 14. 原始需求覆盖检查

R01–R08 由四个 CLI adapter、`kind: cli|api` 扩展边界、auth_mode、host hint 和 backend receipt 覆盖；R09–R16 由全局 JSON、config snapshot/hash、nonce 幂等、tier broker、并行/fallback、partial success 和显式 host block 覆盖；R17–R29、R31–R39 由 wh-review 保留；R30、R40–R49 由 canonical result/receipt、`read-private`、activity monitor、显式 deadline、输入/输出上限、成本指标、有限恢复和真实 smoke 覆盖；R50–R54 由薄 adapter、env/profile 约束、worktree/phase 审查和先 3rd-review 后 workflowhub 的实施顺序覆盖；R55–R60 由 provider 独立 session、`$TMPDIR` runtime、24 小时 GC、config/lineage 校验、delta、禁止 silent fresh 和私有 session receipt 覆盖。

唯一的语义调整是 R40：约 120 秒从“杀进程的硬超时”改为普通审查 SLO/诊断目标；R09/R15 的 timeout 字段保留为显式可选 deadline，默认 `null`。R47 的进程终止仍对用户显式 deadline、cancel、provider 自己的终止和宿主关闭生效。没有任何原始结果要求被删除。

## 15. 参考资料

- [Claude Code CLI reference](https://code.claude.com/docs/en/cli-usage)
- [Kimi Code CLI command](https://www.kimi.com/code/docs/en/kimi-code-cli/reference/kimi-command)
- [OpenCode CLI](https://dev.opencode.ai/docs/cli/)
- [Codex exec issue/continuation discussion](https://github.com/openai/codex/issues/22998)
- [tmux README](https://github.com/tmux/tmux)

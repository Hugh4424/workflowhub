# ADR 0001 — V4 CLI 审查执行合同

**状态**：已采纳（2026-07-13）

## 决策

`3rd-review` 是通用、同步、CLI-first 的跨 provider broker。它不包含 workflow stage
合同、业务技能、finding 合并、业务 verdict、报告或自动修复。V4 固定唯一的审查执行
入口：

```text
3rd-review run --config=<config.json> --request=<request.json>
```

唯一的首轮附件扩展是下列完整三元组：

```text
--attachments=<manifest.json>
--attachments-root=<absolute-root>
--attachment-delivery=<file_only|always_embed>
```

三项必须一起出现。首轮可携带初始三元组；附件 runtime 的 continuation 按下文携带
独立 delta 三元组，或显式复用已冻结材料。
`--attachments-root` 必须是 config `attachment_roots` allowlist 中的真实目录，manifest
的 source 必须是该 root 下的安全相对路径和允许 prefix。broker 校验 regular file、size
和 SHA-256 后复制到 provider 私有 workspace；provider 不接触调用方真实仓库。

附件使用 `material protocol v5`。producer 密封后的 packet、diff、manifest 是唯一 authority；
broker 只允许校验、逐字节复制、复验，禁止脱敏、重写或重算 provider-visible 材料。
delivery receipt 记录相等的 `sealed_manifest_hash`、`provider_visible_manifest_hash` 和
`byte_identity: "verified"`。旧附件 runtime 只读，协议不匹配在 provider 启动前返回
`MATERIAL_PROTOCOL_MISMATCH`。

`doctor` 在顶层声明当前材料协议：

```json
{
  "material_protocol": {
    "version": 5,
    "delivery_attestation": "sealed-exact-copy.v1"
  }
}
```

调用方必须在启动 provider 前核对该声明。字段缺失、版本不同或 attestation 不同都属于
`MATERIAL_PROTOCOL_MISMATCH`，不能从 delivery 字段推测兼容。

`file_only` 使用该 provider 私有 workspace 交付冻结文件，不要求 `/etc` policy 或
`/usr/local` wrapper。broker 会拒绝 symlink、hard link、路径穿越、size/hash 不符，并在
运行与续跑前复验冻结副本。这个边界保证材料完整性和稳定路径，不声称替代操作系统 sandbox；
adapter 可继续使用宿主 CLI 原生的只读模式。

## request 与续跑

request 是 JSON，至少包含以下 V4 字段：

```json
{
  "version": 4,
  "host_provider": "codex",
  "prompt": "frozen review packet prompt",
  "continuation": null
}
```

`host_provider` 是受支持的宿主 provider 或 `CLI/model` 实例名，broker 不让同源 CLI 审查。调用方可选
`provider_allowlist`，其中只能包含配置中不重复的完整 provider 实例名。首轮的
`continuation` 为 `null` 或省略；续跑唯一使用：

默认不传 `provider_allowlist`，broker 会并行启动当前 tier 的全部异源 provider；只要其中一项
`completed`，该 tier 即被选中；没有一项 `completed` 且没有 `cancelled` 才进入下一 tier。显式 `provider_allowlist`
只会收窄可路由的配置实例；`workflowhub-result.v2` 把该列表视为 caller-ordered candidate group，并由
broker 统一并行派发、隔离 workspace、绑定材料和维护 native session。候选中的同源 adapter 以
`SAME_SOURCE` 公共结果返回，不使整个组无效。取消会终止当前路由，不进入下一 tier。

```json
{
  "version": 4,
  "host_provider": "codex",
  "prompt": "delta-only continuation prompt",
  "continuation": { "runtime_id": "<initial-runtime-uuid>" }
}
```

续跑不接收 provider session id。broker 从 runtime 私有状态取得原生 session，只允许两种附件行为：

- delta：request 携带完整、独立密封的 delta 三元组；其 continuation manifest 绑定首轮
  `initial_material_manifest_hash`、递增 `sequence` 和前一轮 `previous_delivery_manifest_hash`。
- reuse：request 不携带附件，并显式设置 `reuse_frozen_material: true`；只复用该 provider/session
  最近一次已验证的冻结材料，不发布新 delta。

普通 continuation 既不携带 delta、也未请求 reuse 时 fail-closed。runtime 过期、找不到、锁争用、
附件变化或没有可续跑 session 都是显式错误/诊断，不能隐式创建新 runtime 或 fresh session。
continuation 只保存 `manifest_hash` / `delivery_manifest_hash` 单链；不存在 raw/derived 双材料、
provider-material 派生 hash，也不迁移旧 timeout/redaction schema。

## stdout、exit code 与错误码

成功执行时，`run` 向 stdout 输出一个 JSON 对象并以 exit code `0` 结束。输出包含
`version`、`runtime_id`、`round`、`host_provider`、`selected_tier` 和每个 provider 的
执行结果。provider 的 transport 失败、跳过、认证失败、超时、取消或输出解析失败仍属于
该 JSON 的 provider result；它们不自动成为 broker 进程错误，也不表示业务 verdict。

请求、配置、附件或 runtime 无法由 broker 接受时，CLI 向 stderr 输出：

```json
{ "error": { "code": "ERROR_CODE", "message": "details" } }
```

并以 exit code `2` 结束。error code 是稳定机器可读的失败分类，例如
`REQUEST_INVALID`、`CONFIG_INVALID`、`ATTACHMENT_ROOT_FORBIDDEN`、
`ATTACHMENT_HASH_MISMATCH`、`ATTACHMENT_IMMUTABLE`、`RUNTIME_EXPIRED`、
`RUNTIME_BUSY`、`NO_CONTINUABLE_SESSION`、`PROVIDER_BUSY` 和
`ATTACHMENT_DELIVERY_UNSUPPORTED`。调用方必须保留 code 和诊断，不得把它们映射为 pass。

adapter wrapper 与 broker 的 provider 失败分类另有一条私有机器协议：wrapper 在 provider 失败时把版本化的
`3RD_REVIEW_FAILURE {"version":1,"code":"...","message":"..."}` 记录写入 stderr；broker
优先解析该记录，且绝不把 provider stdout 中的审查内容当作错误证据。OpenCode 在会话结束但没有
可解析的 terminal assistant 文本时返回 `PROVIDER_NO_TERMINAL_RESULT`，而不是笼统地伪装成认证或
网络失败。若 OpenCode 同时提供有效 native `session_id`，broker 只在同一 cwd 和同一材料链上再发起一次
终态恢复提示；恢复过程由 managed session、provider process 和 health guardian 的真实活跃、失联、退出或
失败事实裁决，不使用 adapter 固定总时限或 idle 时限。恢复结果仍须通过严格 JSON 与 session identity 校验。
认证、网络、权限、无 session、超时或恢复失败都不得被当成成功；两次 stdout/stderr 与首错/恢复错只保留在
runtime 私有证据中。wrapper 仍保留原始 stdout/stderr 供 runtime 私有证据使用；公共失败结果只发布稳定 code、
安全 message 和已观察到的 native `session_id`，不发布 raw stream diagnostic。

收到 `SIGINT` 或 `SIGTERM` 时 broker 终止其 provider process tree 并写入
`workflow_shutdown` 取消来源；CLI 分别以 signal exit code `130` 或 `143` 结束。

## runtime、session 与私有原始输出

`runtime_id` 是 broker 生成的 UUID，也是后续 request 允许携带的唯一续跑身份。每个
provider 的 native `session_id`、原始 stdout/stderr、其私有文件引用和绝对路径由 runtime
私有状态保存，不能从 `status` 获得。`run` 的 provider result 可以返回已解析输出、
session id 和原始流 hash；调用方负责把这些视为私有证据并在公开投影中脱敏。

取消只通过以下控制命令进行：

```text
3rd-review cancel --config=<config.json> --runtime-id=<uuid> \
  --provider=<provider> --source=<source>
```

source 只能是 `user`、`workflow_shutdown`、`broker_idle_timeout` 或
`broker_max_duration`。`status` 和 `doctor` 分别只读取脱敏 runtime 状态和执行环境
能力；`doctor` 不做真实模型调用。

## 兼容性边界

当前 adapter id 的单一真源是 `lib/provider-ids.mjs`：`claude-code`、`codex`、`kimi`、
`opencode`、`pi`、`antigravity`。配置可用裸 adapter id，或 `CLI/model` 实例名，例如
`pi/deepseek`；实例保留完整 public id，并映射到同名 CLI adapter 和安全 runtime key。config、
request 和 adapter registry 必须共同使用该真源，新增 adapter 不得只修改其中一处。

`pi` 通过受控 CLI wrapper 消费原生 JSONL。wrapper 只向 broker 发布 session、精简 progress、
最终 assistant text、`agent_end` 和 `agent_settled`；原生 `message_update` 可重复携带完整 thinking
内容，不能直接计入 broker raw output。Pi 支持两种 delivery 和同一 native session continuation。

`antigravity` 使用独立 `agy` CLI 的 plain-text print 输出。V4 首版只声明单轮 `file_only`：没有
`always_embed`、session、usage 或 continuation。AGY 会把 conversation、brain 和日志写入 native profile；
因此必须在 provider 配置里显式确认 `allow_host_state: true`，否则 adapter 启动前失败。
headless 文件读取需要 `--dangerously-skip-permissions`，所以它同样不构成 OS sandbox；其 prompt
进入 argv，adapter 对其施加 64KiB 上限。测试模型用显示名 `Gemini 3.5 Flash (Low)`。

`run-heterologous-review.mjs` 不是 V4 接口。任何旧 runner、旧 flag 或未列入
`scripts/3rd-review.mjs` command allowlist 的参数都会被拒绝为 `REQUEST_INVALID`；调用方
只能用本文固定的 `run --request` 合同执行审查。实现依据：

- `scripts/3rd-review.mjs`
- `lib/broker.mjs`
- `lib/attachments.mjs`
- `lib/runtime.mjs`
- `docs/exceptions.md`

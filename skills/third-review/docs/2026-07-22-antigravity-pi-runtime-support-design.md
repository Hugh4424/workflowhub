# Antigravity 与 Pi Runtime 接入设计

状态：已实现，待真实 smoke 与发布审查
日期：2026-07-22
目标：3rd-review V4

## 决策

- provider id 单一真源：`lib/provider-ids.mjs`，包含既有四个 provider、`pi`、`antigravity`。
- Pi 是完整 adapter：`file_only`、`always_embed`、native session continuation、usage、progress 与取消。
- Antigravity 是低维护 adapter：单轮 `file_only`、plain-text final output、取消与 doctor；不支持 `always_embed`、usage、session 或 continuation。它会写 native CLI profile，配置必须显式设置 `allow_host_state: true`。
- 两个 CLI 都只提供工具层或 CLI 层限制；provider-private workspace 不是 OS sandbox。处理不可信材料时，部署方必须在 broker 外提供容器或系统 sandbox。

## 本机验证基线

| Runtime | CLI | 验证模型 | 结果 |
| --- | --- | --- | --- |
| Antigravity | `agy 1.1.5` | `Gemini 3.5 Flash (Low)` | print、只读 marker 成功 |
| Antigravity | `agy 1.1.5` | `Gemini 3.6 Flash (High)` | 模型 label 与审查调用成功 |
| Pi | `pi 0.81.1` | `deepseek/deepseek-v4-flash` | JSONL、stdin、session 成功 |
| Pi | `pi 0.81.1` | `kimi-coding/k3` | JSONL、session continuation 成功 |

Antigravity 模型必须用显示名。`gemini-3.5-flash-low` 在本机版本会错误映射到 Medium；
`Gemini 3.6 Flash (High)` 也拒绝通用 `--effort high`。

## Pi adapter

Adapter 使用 `pi-supervised-cli.mjs` 启动真实 CLI：

```text
pi --mode json --print --model <model> [--thinking <level>]
  --no-extensions --no-skills --no-prompt-templates --no-themes
  --no-context-files --no-approve --tools read,grep,find,ls
  --session-dir <runtime-private>/pi/sessions
  (--session-id <uuid> | --session <prior-uuid>)
```

- 完整 prompt 经 stdin 传递，因此 `always_embed` 保持 V4 字节语义和大小 gate。
- wrapper 不直接转发原生 `message_update`：K3 的 thinking delta 会重复携带完整 reasoning/signature，可能远超 broker 的 10MB output cap。
- wrapper 只发布 session、精简 progress、最终 assistant text/usage/stop reason、`agent_end` 与 `agent_settled`。
- parser 只接受：精确预分配/续跑 session id、最后一个 assistant final、非失败 stop reason、`willRetry:false` 的 `agent_end` 和 `agent_settled`。任何缺失、错 session 或 malformed stream 都 fail closed。
- `provider.effort` 映射 `--thinking`；未配置 effort 时保留兼容的 `thinking:true -> low`、`thinking:false -> off`。

Pi 的 session 目录位于 broker runtime，cwd 通过 stable writable view 保持不变，delta attachment 续跑不会丢失 native session。

## Antigravity adapter

首版命令：

```text
agy --new-project --mode plan --sandbox --dangerously-skip-permissions
  [--model <display-name>] -p <prompt>
```

- `agy` 没有 `run`、`--format stream-json`、`--tools` 或 stdout session/usage。
- 无 `--dangerously-skip-permissions` 时，headless plan mode 会拒绝读取 file-only marker，却可能以 exit 0 结束；所以此 flag 是当前 CLI 的必要条件。
- `--dangerously-skip-permissions` 不等于 OS sandbox。adapter 从 readonly frozen bundle cwd 启动，prompt 明确禁止越界/写入，但严格隔离仍由外部负责。
- AGY 1.1.5 把 conversation、brain、log 写到 `~/.gemini/antigravity-cli`，且切换隔离 `HOME` 会要求重新登录。因此 adapter 不伪造“runtime-private raw output”：默认 sample 禁用它；启用时必须同时显式设置 `allow_host_state: true`，仅用于可信、可写入本机 native profile 的材料。
- prompt 必须出现在 argv，并明确拒绝 `always_embed`。它不应处理不适合暴露给本机同用户进程的秘密；Broker 不用字节上限中止已启动的审查。
- generic `provider.effort` 不映射；配置非空时启动前返回 `PROVIDER_OPTION_UNSUPPORTED`。
- session_id 始终为 `null`，broker 的既有 continuation 选择自然返回 `NO_CONTINUABLE_SESSION`，不会 fresh fallback。

## 修改范围

- `lib/provider-ids.mjs`：统一 provider id。
- `lib/config.mjs`、`lib/broker.mjs`、`lib/adapters/index.mjs`：使用统一 id；broker 将 plan 的 expected native session 传给 parser。
- `lib/adapters/pi.mjs`、`lib/adapters/pi-supervised-cli.mjs`：Pi contract 与 JSONL 过滤。
- `lib/adapters/antigravity.mjs`：AGY 单轮 contract。
- `config.example.json`、`SKILL.md`、ADR、异常文档：能力和边界。
- 新增 fake CLI、adapter、broker integration tests。

## 验收

自动化必须覆盖：

1. config、request、registry 对六个 provider id 一致；
2. Pi file-only、always-embed、session continuation、错 session fail closed、usage 与 JSONL 压缩；
3. Antigravity plain-text parse、64KiB gate、generic effort 拒绝、file-only、无 session continuation、always-embed 拒绝；
4. 原四个 runtime 的全量回归；
5. 每个新 runtime 的 doctor、真实 CLI 首轮、file-only marker、Pi continuation、取消 smoke。

发布前记录验证版本：AGY `1.1.5`、Pi `0.81.1`。CLI 版本升级后必须重跑模型选择、parser、session 与权限 smoke；`doctor --version` 成功本身不能证明协议仍兼容。

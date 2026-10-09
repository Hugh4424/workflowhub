---
name: 3rd-review
description: 通用异源 CLI 调用器。用户要求“审查、仔细审查、异源审查、找独立 reviewer”时使用；按全局配置调用其他 provider，返回原始意见、session id 和明确失败诊断，不生成业务 verdict、合同或报告。
---
来源：3rd-review v4.0.0，commit 97132960d7dab9145cbd0bdf610e09bf422e2ec0

# 3rd-review

调用方负责准备精简 prompt、材料、审查合同和最终报告；本技能只执行异源 CLI。

```bash
node {skill-root}/scripts/3rd-review.mjs run \
  --request=request.json --config=~/.config/3rd-review/config.json
```

部署前用同一 root 验证附件配置；`attachments:false` 或 `attachment_root.status !== "ready"` 时不得提交首轮附件：

```bash
node {skill-root}/scripts/3rd-review.mjs doctor \
  --config=~/.config/3rd-review/config.json \
  --attachments-root=/approved/packet-root
```

首轮可附带经过 hash/size 校验的只读材料。root 必须在配置的 `attachment_roots` 中：

```bash
node {skill-root}/scripts/3rd-review.mjs run \
  --request=request.json --config=~/.config/3rd-review/config.json \
  --attachments=manifest.json --attachments-root=/approved/packet \
  --attachment-delivery=file_only
```

首次 request：

```json
{"version":4,"host_provider":"codex","prompt":"请独立审查以下变更...","continuation":null}
```

后续轮次只续跑已有 provider 的原生 session：

```json
{"version":4,"host_provider":"codex","prompt":"根据反馈再检查这两个问题...","continuation":{"runtime_id":"上一轮 runtime_id"}}
```

- `tiers` 内并发；只有该层没有一个真实执行成功才进入下一层。
- 自动排除 request 中的 `host_provider`；这是调用方受信任地声明的宿主身份，broker 不自动探测 host。成功和失败都返回，调用方自行合并成功意见。
- 配置 key 可用裸 CLI id（如 `pi`）或 `CLI/model` 实例名（如 `pi/deepseek`、`pi/k3`）。实例名独立路由、session 和 runtime workspace；`provider_allowlist` 必须填写配置中的完整实例名。同一 CLI 的不同实例仍视为同源，不能互相审查。
- 订阅 CLI 使用 `auth.type:"native"`；API-key provider 使用 `auth.type:"env"` 并只填写 `auth.env` 的变量名，绝不写入值。
- 不跨 provider 静默 fallback、不伪造成功。常规 V4 provider 执行不自动重试；OpenCode 在首轮明确返回 `PROVIDER_NO_TERMINAL_RESULT` 且已观察到 native session 时，最多用同一 session 做一次终态恢复，首轮 `single_round` 也允许，`full_only` 除外。`workflowhub-result.v3` 另按其协议执行有界恢复：允许文档列明的单次 fresh execution 或 same-session repair，不把 timeout 作为重试理由。初始 provider 执行不设总时限；OpenCode 同 session 终态恢复使用独立的 bounded recovery window（默认 30 秒），超时仍 fail-closed，并保留两次私有 raw evidence。每个 provider 独立续跑自己的 session。
- `file_only` 先生成 delivery plan，再把完整、hash/size 校验的 `review-packet.v1.json`、`changes.diff`、`manifest.json` 复制到 provider 专用只读 bundle。Kimi/OpenCode 的 profile、运行配置和 legacy `review-input.md` 不放入该 bundle。prompt 不嵌入 diff，也不泄露宿主路径、worktree 或 git。
- Codex 在 `thread/start` / `thread/resume` 选择 `review_packet` permission profile；该 profile 只读 provider workspace、拒绝其他文件系统路径并关闭网络。`turn/start` 继承线程 profile，不发送 `permissions` 或 legacy `sandbox` 覆盖。
- delivery receipt 使用明确字节语义：`material_total_bytes` 是 provider-visible 附件总字节（两种 delivery 都记录）；`rendered_prompt_bytes` 只在 `always_embed` 记录，表示 adapter model instruction、调用方审查指令和完整渲染附件组成的最终模型文本字节，并用于单次 512KB gate。禁止使用含糊的 `total_bytes`。
- `file_only` 不依赖系统级 wrapper 或 root policy。broker 校验来源路径、普通单链接文件、size 与 SHA-256，把材料复制到 provider-private workspace，锁定副本，并在首次运行和续跑前重新验证冻结材料。
- 私有 workspace 是材料投递边界，不宣称是操作系统安全边界。adapter 自带的只读模式仍会启用；如部署环境额外提供 sandbox，可在 broker 外叠加，但缺少 sandbox 不会移除 `file_only` capability。
- `pi` 使用受控 JSONL wrapper：prompt 经 stdin 传递，支持 `file_only`、`always_embed` 与 native session 续跑；wrapper 丢弃重复 thinking delta，只保留 session、progress、最终 assistant 文本和 settled 证据，避免原生 JSONL 撞 output cap。默认示例模型是 `cc-switch-deep-seek/deepseek-v4-flash`。
- `antigravity` 调用 `agy` 的 plan/sandbox 模式，使用 `--output-format stream-json`，`step_update` 作去重进展游标、`result` 作终态；首版只支持单轮 `file_only`，不支持 `always_embed` 或续跑。它为 headless 文件读取使用 `--dangerously-skip-permissions`；这不是 OS sandbox，且 AGY 会写本机 native profile，所以启用前必须显式配置 `allow_host_state: true` 并只处理可信材料。模型必须使用显示名 `Gemini 3.5 Flash (Low)`，不能使用会在本机 1.1.5 映射到 Medium 的 slug。
- `always_embed` 只在 provider 明确支持时使用：broker 渲染完整最终 prompt 后一次计算 UTF-8 总量；超过 512KB 返回 `MATERIAL_TOO_LARGE`，不产生 session 或可续跑结果。不得用 diff chunk 绕过该上限。
- 续跑不重传附件；broker 会重新验证首轮冻结副本的 size/hash/身份。
- `status` 是公开投影，不返回 session、review output、raw output ref 或绝对路径。
- 首轮结果含 `selected_tier`；续跑为 `null`。`cancelled` 是独立状态，不是 provider 失败。
- 临时状态在 `/tmp/3rd-review`，每次命令自动清理超过 24 小时且没有活跃进程的状态。
- `status` 查看活跃进程；只有 `cancel` 或明确终态失败会终止进程。初始执行没有默认 120/180 秒限制；仅同 session 终态恢复有独立的 bounded recovery window。连续 5 个健康检查间隔无新进展的 provider 以 `PROCESS_STALLED` 终态失败结束并回收进程组，antigravity 以去重的 stream-json 事件计进展；有进展即清零，总时长不设上限。
- `doctor` 只验证 CLI executable，不能证明登录、认证或真实模型调用。

查看完整异常语义与维护约束：[`docs/exceptions.md`](docs/exceptions.md)。

## 写作规范

创建或改写 agent 方法时，读取 `skills/spec-specify/SKILL.md` 的「技能写作规范（WR001）」唯一规范；此处不复制规范。

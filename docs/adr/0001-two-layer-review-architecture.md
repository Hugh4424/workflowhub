# ADR 0001 — V4 审查层：workflowhub 编排与通用 broker 分层

**状态**：已取代（2026-07-15）。当前生产设计见
`docs/superpowers/specs/2026-07-15-wh-review-simple-reliable-design.md`。

> 本 ADR 仅保留历史背景。runtime、
> session、flow、reset、private receipt 和 public projection 不再作为 WorkflowHub
> 正确性链；异源 provider、冻结完整材料、transport/semantic 分离仍保留。

## 背景

workflowhub 需要按 stage 进行异源审查，但 provider 不应读取真实仓库、执行
`git`，或依赖宿主机绝对路径。审查输入必须是可校验、可复现的同一份 packet；
续跑必须复用首轮 runtime 和各 provider 的原生 session，不能再把完整首轮材料
重复投喂或静默创建新会话。

这些要求分属两个边界：workflowhub 知道 stage、合同、技能和业务裁决；
`3rd-review` 只知道跨 provider 的执行、受限附件传输、runtime 和 session。把两者
混在一起会让通用 broker 绑定 workflowhub 业务，也会让 workflow 直接依赖 provider
调用细节。

## 决策

### workflowhub：唯一业务编排层

所有 workflow 和 CLI 通过
`skills/wh-review/scripts/wh-review-cli.mjs` 调用
`skills/wh-review/scripts/review-round-facade.mjs` 的 `ReviewRoundFacade`。Facade 的
边界固定为：

1. `prepare()` 按 stage 选择 `skills/wh-review/contracts/` 中的合同和
   `stage-skill-plan.json`，冻结 `review-packet.v1.json`、技能 bundle 与附件 manifest。
2. `run()` 只经 `skills/wh-review/scripts/broker-client.mjs` 调用 broker，保存私有
   round receipt，校验 provider 输出并合并有效结果。
3. `publish()` 在 finding disposition 完成后，原子写入脱敏的 core receipt、报告和
   stage projection；未发布的 `run()` 结果不是公开业务结论。

五个允许的 stage 是 `make-decision`、`build-spec`、`build-plan`、`build-code` 和
`verify-code`。其中 `make-decision` 的 `direction` 与 `detail` track 是独立 flow。
未知 stage、track 或不安全任务/flow id 必须失败，不能路由到通用合同。

### packet 与附件：唯一 provider 证据边界

`review-packet.v1.json` 由
`skills/wh-review/schemas/review-packet.v1.json` 定义。它包含冻结的统一 diff、变更
文件 hash、需求/AC/设计摘录、宿主验证过的测试证据、材料 manifest/hash、合同 hash
和技能 bundle hash。任何必需材料或 hash 不完整时，Facade 写入
`MATERIAL_INCOMPLETE` 诊断并禁止启动 provider。

首轮可通过受限附件把 packet、合同和 bundle 复制到 provider 私有 workspace。附件
root、允许 source prefix 和 broker 命令只来自宿主配置
`~/.workflowhub/config.json` 的 `third_review`；配置验证实现在
`skills/wh-review/scripts/third-review-host-config.mjs`。provider 只能审查 packet 和
冻结附件，不得要求访问真实仓库、执行 `git` 或读取绝对路径。

### 3rd-review：通用执行 broker

`3rd-review` 的唯一审查执行入口是其 V4 CLI `run --request`。workflowhub 只通过
`BrokerClient` 以该入口调用它；broker 不选择 stage 合同、不解释业务技能、不校验
业务 verdict，也不写 workflowhub 报告。通用 CLI 合同见
`/Users/Hugh/Hugh/Project/3rd-review/docs/adr/0001-v4-cli-contract.md`，实现位于
`/Users/Hugh/Hugh/Project/3rd-review/scripts/3rd-review.mjs`。

Facade 先以 `doctor` 取得并冻结 broker-owned provider capability snapshot；调用方不能
自报 provider capability 或附件投递方式。首轮向 broker 发送 V4 request 和附件三元组；
后续轮次只发送 `continuation.runtime_id`，不重传附件。broker 对每个 provider 自行使用
其私有原生 session，并验证已冻结的附件和 hash。

### runtime、session 与公开边界

首轮 private receipt 保存唯一 `initial_runtime_id`、每个 provider 的 `session_id`、
transport 状态、原始 stdout/stderr 引用与 hash。它们只存在
`tasks/{task-id}/reviews/private/round-*/`，不得进入 core receipt、报告、stage result
或后续 request。

仅同时满足 `transport_status=completed`、`packet_status=complete`、
`business_valid=true` 且有 `semantic_verdict` 的 provider 输出可参加 aggregate。
`CANCELLED`、认证失败、超时、材料不足、hash 不匹配、进程失败和非 JSON 都是 transport
或 packet diagnostic，`semantic_verdict=null`。取消必须记录
`user`、`workflow_shutdown`、`broker_idle_timeout` 或 `broker_max_duration` 来源；外层
workflow 不设置会误杀 provider 的 wall-clock timeout。

无法继续（runtime TTL、session 不可用、能力快照或冻结基线变化）时，flow 进入
`blocked_by_human_confirmation`。唯一的新 flow 入口是带 `reason` 与
`human_approval_ref` 的 `wh-review-cli.mjs reset`；系统不得静默换 session 或 fresh run。
异常的 retry、私有证据和阻断结果以
`docs/adr/0002-v4-review-exception-state-matrix.md` 为准。

## 后果

- workflowhub 拥有 stage/track、合同、技能、packet、finding disposition、跨 stage
  carryover 和公开语义 verdict。
- `3rd-review` 保持可复用的 V4 执行 broker，拥有 provider 路由、私有 workspace、
  runtime、native session、原始输出和取消生命周期。
- CI 与下游只消费已发布的 `{ semantic_verdict, core_receipt_hash, needs_human }`，不读取
  raw artifact、runtime 或 session。
- 旧的 workflow 直连 provider 路径和非 V4 broker 调用不再是支持接口。

## 参考实现

- `skills/wh-review/SKILL.md`
- `skills/wh-review/scripts/wh-review-cli.mjs`
- `skills/wh-review/scripts/review-round-facade.mjs`
- `skills/wh-review/scripts/broker-client.mjs`
- `skills/wh-review/scripts/public-review-projection.mjs`
- `docs/adr/0002-v4-review-exception-state-matrix.md`

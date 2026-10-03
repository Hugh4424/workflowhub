# 3rd-review 通用异源 Agent 调用设计 V2

状态：设计稿，待 Kimi 与 Claude Code 复审及用户批准  
日期：2026-07-12  
基线：`docs/3rd-review-redesign-draft.md` 的 R01–R60、历史报告和真实 Host 验收证据

## 1. 设计结论

`3rd-review` 重建为通用的异源 Agent 调用 Broker。它不理解审查业务，不生成审查 verdict，不决定 stage，不生成 workflowhub 报告。

`wh-review`/workflowhub 负责审查业务：提示词、材料、合同、lens、结果解释、报告、receipt 提交和 `stage-result`。

核心原则：

1. 执行成功、输出有效、身份可信、业务可采纳是四个不同状态。
2. Host 身份探测失败不能阻止 provider 执行；只能降低 eligibility。
3. tier 只有出现通用的 `selection_eligible=true` 才停止 fallback；wh-review 再将其映射为业务采纳状态。
4. Provider 业务 payload 是 request 携带的 opaque contract，Broker 不硬编码 `verdict/findings/checklist`。
5. fake routing、provider adapter contract、真实 Host 矩阵三类验收严格分离。
6. Provider continuation 只有真实两轮 smoke 通过后才发布；未证明的 provider 明确返回 `UNSUPPORTED`。
7. 失败诊断不能覆盖已成功结果，不能静默全文 fresh retry。

## 2. 真实问题与历史教训

本版不是在现有实现上继续叠加状态字段。真实验收暴露了以下架构问题：

- macOS `/usr/bin/login` 的 `lsof` status 1 被当作硬错误，导致多个 CLI Host 在 provider 启动前失败。
- host acceptance 把未选择的 fault scenario 也要求必须产出 evidence。
- deterministic routing 使用真实 Kimi 身份，污染了同源排除和 tier 测试。
- Broker 用 `status === success` 停止 fallback，未验证 backend/Host 的结果也可能终止下一层。
- `providers.mjs` 硬编码审查业务 schema，`route-review` 混入 workflowhub 路由。
- OpenCode/Codex continuation 仅有 fake transport，尚无完整真实发布证据。
- Round 2 `saved_input_bytes` 与实际输入差不一致，说明指标有多个计算源。
- wh-review runtime 尚未真正接入，旧稿的 R17–R39 仍是后续阶段。

可信的正向证据只有部分 Kimi/Claude 两轮 continuation；不能把单次 adapter smoke 或插件结果当成四 Host 全矩阵通过。

## 3. 原始需求保留声明

旧稿 §2 的 R01–R60 全部保留，本版不删除原始需求。职责映射如下：

| 需求 | V2 归属 | 实现边界 |
|---|---|---|
| R01–R08 provider、CLI/API、认证、Host、backend、隔离 | 3rd-review + provider adapters | Broker 只管通用执行元数据；adapter 管 CLI/API 细节 |
| R09–R16 全局配置、tier、并行、fallback、合并边界 | 3rd-review Broker | 只按 eligibility 停止，不解释业务 verdict |
| R17–R29 stage、合同、材料、lens、五阶段质量 | wh-review | 3rd-review 只接收 opaque input/response contract |
| R30–R39 result 合并、报告、receipt、stage-result | wh-review | Broker 只返回 canonical execution result 和 private payload ref |
| R40–R49 性能、token、恢复、进程、真实门禁、观测 | 3rd-review + acceptance | 指标单点计算，异常说明独立维护 |
| R50 简单维护 | 全局架构约束 | 小模块、无业务污染、旧链最终删除 |
| R51–R54 迁移、worktree、phase 审查顺序 | 工程流程 | 不进入运行时状态机 |
| R55–R60 独立 session、临时 runtime、TTL、delta、禁止 silent fresh、隐私 | 3rd-review session + wh-review registry | Provider-specific state 只由 adapter 管理 |

### 3.1 不可删除的原始行为

- 支持 Claude Code、Codex、Kimi、OpenCode 作为 Host。
- 支持多个 reviewer 并行和多层 fallback。
- 支持 CLI 订阅/OAuth、环境变量 API key、OpenAI-compatible backend。
- 每个 provider 独立 session；后续轮次优先续跑自身 session。
- 支持 model、effort/thinking、timeout 成本控制。
- 成功结果保留，失败结果提醒。
- 当前层没有可采纳异源成功才进入下一层。
- continuation 缺失时不能偷偷全文 fresh。
- 所有异常必须可诊断、可测试、可维护。

## 4. 组件边界

```text
任意 Host Agent / 3rd-review Skill 触发器
        │ 最小 JSON request + 可选 host_hint
        ▼
3rd-review Broker
  ├─ request/config snapshot
  ├─ tier planner
  ├─ provider adapter runner
  ├─ identity/eligibility evaluator
  ├─ private session/receipt store
  └─ canonical result writer
        │ private payload_ref + session_ref
        ▼
wh-review
  ├─ stage contract / lens / material
  ├─ business result interpretation
  ├─ merged verdict / findings / disposition
  ├─ human-readable report
  └─ stage-result / workflow transition
```

### 4.1 3rd-review 负责

- 读取全局 JSON 配置。
- 接受可选 `host_hint`，旁路探测 Host provenance。
- 过滤已知同源 provider。
- 按 tier 并行调用 provider。
- 处理认证、超时、网络、输出、session、进程和 runtime 异常。
- 计算通用 execution/output/identity/eligibility 状态。
- 保存私有 receipt、session_ref 和 payload_ref。
- 以 `selection_eligible` 决定 fallback。

### 4.2 3rd-review 不负责

- `verdict`、`findings`、`checklist`、`hard_invariant` 的业务解释。
- stage、round 业务推进。
- 审查方式、审查 lens、提示词内容。
- merged result、报告标题、报告落盘、`stage-result`。
- workflowhub 的 finding closure 和人工裁决。

### 4.3 wh-review 负责

- 根据 stage/risk/round 决定审查方式。
- 生成短 contract、lens、材料包和 verified facts。
- 把业务输出 schema 作为 `response_contract` 传给 3rd-review。
- 消费 private payload_ref 并解释业务结果。
- 合并多个 provider 的意见，保留冲突和 hard invariant。
- 原子提交 round receipt，投影 report/index，写 `stage-result`。

### 4.4 全局 Skill 入口

每个 Host 只安装同一份可搬运的 `3rd-review/SKILL.md`。触发“审查一下”“仔细审查”“异源审查”“第三方审查”“review”时，入口：

1. 检查递归标记，避免 reviewer 再次触发 3rd-review；
2. 读取可选 `THIRD_REVIEW_HOST_PROVIDER/BACKEND/MODEL`；
3. 构造最小 request envelope 和随机 nonce；
4. 调用 `3rd-review run --request <request>`；
5. 返回 canonical result/private payload_ref。

无 host hint 仍执行，但只能得到 `host=unknown` 和 `selection_eligible=false`。Skill 不生成业务报告。

## 5. 通用 Request/Result 协议

### 5.1 Request

```json
{
  "protocol_version": 1,
  "request_id": "opaque-request-id",
  "nonce": "request-nonce",
  "input_hash": "sha256...",
  "contract_hash": "sha256...",
  "host_hint": {
    "provider": "kimi",
    "backend": "moonshot",
    "confidence": "verified",
    "source": "host-skill",
    "attestation": "private://host-attestation"
  },
  "input": {
    "prompt": "opaque provider input",
    "materials": []
  },
  "response_contract": {
    "format": "json",
    "schema": {}
  },
  "routing": { "policy": "global" },
  "deadline_ms": 600000,
  "continuation": {
    "round": 2,
    "provider": "claude-code",
    "previous_receipt_ref": "private://...",
    "previous_receipt_hash": "sha256...",
    "delta": { "changed": [], "deleted": [], "manifest": [] },
    "start_fresh": false,
    "fresh_reason": null
  }
}
```

`host_hint` 可省略。没有 hint 时仍必须执行，但 Host identity 为 unknown，不能形成可采纳异源成功。`nonce`由Skill入口生成，绑定request和receipt，用于幂等与重放检测，不参与业务 input hash。

`host_hint.source=host-skill` 必须包含由安装时受信 wrapper/manifest 验证的 attestation；普通 env/user JSON 的 `declared` 只能作为提示。无 hint、伪造/过期 attestation 或 provenance probe 失败统一映射为 `unknown`，但仍执行 provider。无 lsof 时，合法 host-skill attestation 仍必须能得到 verified。

`response_contract.schema`只能使用受限 JSON Schema 子集：禁止外部 `$ref`、脚本、无限递归和未限制复杂度的正则；schema 有大小、深度、节点数上限，并绑定 `contract_hash` 和 `input_hash`。

`input_hash` 和 `contract_hash` 由 Broker 对 canonical input/contract 重新计算；request 中提供的值只用于比对，缺失或不匹配时返回 `REQUEST_HASH_MISMATCH`，不能信任调用方自报 hash。

`start_fresh=true` 只能由 wh-review 发送，并必须提供非空、限长且不含 secret 的 `fresh_reason`、新的 round id 和新的 request nonce；它与 `previous_receipt_ref`/delta continuation 互斥。3rd-review 不得自行把 continuation failure 转成 fresh。

Broker 只校验：

- request envelope；
- input hash；
- response 是否符合传入的通用 contract；
- transport metadata；
- provider/session/lineage binding。

Broker 不读取或理解业务 payload 内的 verdict/findings/checklist。

### 5.2 Canonical Broker Result

```json
{
  "request_id": "opaque-request-id",
  "provider": "claude-code",
  "execution": {
    "status": "succeeded|failed|timeout|cancelled|blocked",
    "attempt_kind": "initial|continuation|repair",
    "retry_count": 0,
    "resume_count": 0,
    "continuation_count": 0
  },
  "output": {
    "status": "valid|invalid|truncated|missing",
    "contract_valid": true,
    "payload_ref": "private://..."
  },
  "identity": {
    "host": "verified|declared|unknown",
    "backend": "verified|inferred|unknown",
    "same_source": false
  },
  "eligibility": {
    "selection_eligible": true
  },
  "session": {
    "state": "new|reused|missing|expired|unsupported",
    "session_ref": "private://...",
    "session_id_hash": "..."
  },
  "metrics": {
    "input_bytes": 0,
    "continuation_input_bytes": 0,
    "saved_input_bytes": 0,
    "elapsed_ms": 0,
    "continuation_elapsed_ms": 0,
    "fresh_estimated_elapsed_ms": null,
    "session_reuse_count": 0,
    "fresh_restart_count": 0
  },
  "diagnostics": []
}
```

私有 canonical result/receipt 可以向 wh-review 提供 provider 原生 `session_id` 和 opaque `session_ref`，以便下一轮继续同一 provider session；它们不能进入公开报告。公开报告只显示 hash、状态和 metrics；raw session id、opaque handle、native runtime 路径只进入私有 `0600` receipt。

### 5.3 Aggregate/Tier Result

每个 request 只生成一个 aggregate result，绑定 `request_id`、`nonce`、`input_hash` 和 `config_hash`：

```json
{
  "request_id": "opaque-request-id",
  "nonce": "request-nonce",
  "input_hash": "sha256...",
  "config_hash": "sha256...",
  "tiers": [
    { "index": 0, "providers": [], "selection_eligible_count": 0, "completed": true }
  ],
  "stopped_by": "selection_eligible|all_failed|deadline|cancelled|none",
  "results": [],
  "failures": []
}
```

`payload_ref` 只能通过 Broker 的 `read-private --request-id <id> --nonce <nonce> --ref <ref>` 接口读取，并同时校验 receipt hash、owner、mode、UID、request hash 和路径 containment。wh-review 不直接拼接 `private://` 为文件路径。

## 6. Tier、同源和 fallback

每个 tier 的 enabled provider 并行执行。当前层全部完成后：

```text
execution.status == "succeeded"
&& output.status == "valid"
&& identity.host == "verified"
&& identity.backend == "verified"
&& identity.same_source == false
&& output.contract_valid == true
&& payload_persisted == true
&& receipt_committed == true
→ selection_eligible=true，停止 fallback

否则
→ 保留当前层所有结果和诊断
→ 进入下一层
```

以下情况不能停止 fallback：

- provider 成功但 Host unknown；
- backend unknown；
- 输出合法但 identity 未验证；
- provider 结果被标记同源；
- 成功结果的 receipt 尚未完整提交。

同源 provider 必须排除；unknown provider 不得被错误排除，也不能算正式异源成功。

主 Agent/wh-review 自行合并多个业务结果，3rd-review 不投票、不做共识。

## 7. Host identity

Host identity 是 eligibility 证据，不是执行前硬门。

优先级：

1. Host skill 注入的 `host_hint`；
2. 可选 process ancestry/provenance probe；
3. provider/backend 自报和 resolved model 的辅助证据。

`lsof`、`ps`、`/proc` 不可用、status 1、空输出或权限不足时：

```text
host confidence = unknown
provider 仍执行
selection_eligible = false
```

已知同源时提前排除；未知时保留结果并继续 fallback。

Host identity acceptance 必须覆盖：有效 host-skill attestation 在无 lsof 的 macOS 环境仍判定 verified；缺失、过期、错误签名、provider/backend/nonce 不匹配的 attestation 判定 unknown；unknown 仍启动 provider，但不得 `selection_eligible`；普通 declared hint 不能替代 attestation。

## 8. 全局配置

默认配置：`~/.config/3rd-review/config.json`。可由 `THIRD_REVIEW_CONFIG` 覆盖。

```json
{
  "version": 1,
  "tiers": [
    ["claude-code", "kimi", "codex"],
    ["opencode"]
  ],
  "providers": {
    "claude-code": {
      "enabled": true,
      "kind": "cli",
      "command": "claude",
      "model": "default",
      "effort": "medium",
      "timeout_seconds": 180,
      "auth": { "mode": "oauth" }
    },
    "kimi": {
      "enabled": true,
      "kind": "cli",
      "command": "kimi",
      "model": "default",
      "effort": "medium",
      "timeout_seconds": 180,
      "auth": { "mode": "env", "variable": "MOONSHOT_API_KEY" }
    },
    "openai-compatible": {
      "enabled": true,
      "kind": "api",
      "base_url": "https://api.example.invalid/v1",
      "model": "review-model",
      "effort": "medium",
      "timeout_seconds": 180,
      "auth": { "mode": "env", "variable": "OPENAI_API_KEY" },
      "allowed_headers": ["content-type", "x-request-id"]
    }
  }
}
```

配置支持 CLI 订阅/OAuth、环境变量 API key、provider config 和 API-compatible provider。配置只保存变量名，不保存 key 值。

每个 request 启动时生成 `config_hash`。运行期间配置变化不影响当前轮；当前轮配置快照发生变化时返回 `CONFIG_SNAPSHOT_CHANGED`，continuation 绑定中的配置变化则返回顶层 `CONTINUATION_FAILED`、`detail_code=CONFIG_CHANGED`。配置校验拒绝 unknown provider、重复 provider、空 tier、禁用 provider 被显式路由和非法 auth/timeout；配置文件要求 owner-only 权限，并通过临时文件＋atomic rename 更新。

`host_hint.confidence=declared` 只能作为提示，不能成为 `selection_eligible` 的依据；只有受信 Host adapter 的 `verified` 证据才能满足 eligibility。无 hint 或 probe 失败统一映射为 `unknown`。受约束的已安装 Host Skill 在安装时登记 provider、backend、skill manifest hash 和本地公钥；每次调用签发短时 `host_attestation`（request nonce、provider、backend、issued_at、expiry），Broker 验签后将 Host 标为 verified。无法验签时仍执行，但不可 eligible。

120 秒是普通短审查的性能目标（SLO/诊断阈值），不是硬超时，也不是复杂审查的上限。每个 provider 默认 timeout 为 180 秒；600 秒只能由用户在全局 JSON 中显式配置，不能静默成为默认。每个 request 必须给出 aggregate deadline，全局上限建议 900 秒。实际 elapsed 和是否超过 120 秒目标必须进入 metrics。tier、queue、retry、resume 和 provider timeout 共享同一 deadline，任何重试不得重置预算。CLI 网络错误只允许同 session/adapter 定义的有限恢复；API-compatible provider 可按 HTTP request id 做有限重试，不能套用 CLI 全文重投。

## 9. Provider Adapter 与 capability

推荐模块结构：

```text
src/broker/
src/request/
src/config/
src/host/
src/adapters/interface.mjs
src/adapters/claude-code.mjs
src/adapters/kimi.mjs
src/adapters/codex.mjs
src/adapters/opencode.mjs
src/session/
src/security/
src/result/
src/acceptance/
```

Adapter 统一接口：

```text
probe()       → binary/version/backend/auth/capabilities
execute()     → raw stdout/stderr/process metadata
resume()      → provider-native continuation
normalize()   → generic output envelope
persistState()
```

Adapter 负责 provider 参数、model、effort、auth、native session 和 provider-specific error。Broker 不拼 provider argv。

每个 adapter 的 hermetic profile 必须在 spawn 前明确：固定 CWD、完整 flags、允许环境变量白名单、清除其余环境变量、只读认证状态、session allowlist、禁用 persona/hooks/plugins/MCP/写工具/shell 工具。负向验收必须验证受保护文件 hash 不变、无工具事件、无非白名单环境变量泄漏；不能用 `--pure` 或 provider 自述代替证据。具体接口和负向用例见 `docs/3rd-review-provider-contract.md`。

### 9.1 Capability 发布

fake adapter 测试不能发布 capability。真实两轮 smoke 通过后生成版本绑定 registry：

```json
{
  "provider": "kimi",
  "cli_version": "1.48.0",
  "transport": "session",
  "evidence_sha256": "...",
  "released": true
}
```

没有真实证据的 provider：

- Round 1 可执行；
- Round 2 返回顶层 `CONTINUATION_FAILED`，并使用 `detail_code=UNSUPPORTED|MISSING|EXPIRED|BINDING_MISMATCH|CONFIG_CHANGED|REJECTED|BUSY`；
- 不得静默 fresh；
- 不得把 fake 通过当生产能力。

## 10. Session 与临时 Runtime

- runtime 仅使用 `$TMPDIR/3rd-review/...`；
- 默认目录 `0700`、文件 `0600`；
- idle 24 小时自动过期；
- 启动、成功续跑、Host acceptance 时 GC；
- SIGTERM 清理并等待 process group；
- stale lock 安全回收，活进程不误删；
- provider state 必须由 adapter 声明 allowlist；
- 禁止复制整个 HOME/XDG；
- auth state 只读，session state 与 auth 分离；
- 不保存 API key；
- session/ref 只存私有 receipt。

Claude/Kimi 如能使用原生 session ref，可只保存 opaque ref；Codex/OpenCode 只有在明确、可验证的 native state allowlist 通过真实门禁后才发布 continuation。

Round 2+ 使用：

- changed/new body；
- deleted paths；
- 当前完整 manifest metadata；
- finding disposition；
- previous receipt hash；
- provider 自己的 root/latest session ref。

Broker 必须证明：

```text
previous_manifest + delta = current_manifest
```

session、model、backend、profile、config、manifest 任一不匹配，必须在 provider spawn 前返回顶层 `CONTINUATION_FAILED` 和稳定 `detail_code`。

## 11. 异常与恢复

完整异常矩阵维护在：

`docs/3rd-review-error-and-recovery.md`

最低覆盖：

- 配置非法/中途变化；
- binary 不存在、版本不支持、运行中 binary 被替换；
- OAuth 未登录、API key 缺失、交互认证阻塞；
- Host unknown、同源、managed host 阻断；
- DNS、网络断开、429、5xx；
- prompt 超过输入预算/token 限制；
- provider 超时、挂死、SIGTERM；
- stdout/stderr 超限、JSON 非法、输出截断、JSONL 混杂；
- session missing/expired/rejected；
- runtime 权限、ENOSPC、EROFS、EACCES、损坏、stale lock、并发；
- receipt 重放、request 重复、request hash 不匹配；
- secret 泄漏、redaction 失败；
- wh-review report projection 失败；
- tier 部分成功、全部失败、provider 不可用。

默认恢复规则：

1. 网络/429/5xx：共享 deadline 下有限重试；
2. 已有 session 的暂态失败：同 session resume 一次；
3. 已完成分析但 JSON 非法：同 session 请求 JSON 一次，不重投材料；
4. prompt 超限：返回 `INPUT_TOO_LARGE`，不由 Broker 自行分块；
5. session 丢失/过期：返回稳定失败，不自动 fresh；
6. fresh 只能由 wh-review 用明确 `start_fresh` 原因请求；
7. 成功结果先保存，后续 persistence failure 只加 warning；
8. timeout/cancel 必须 kill process group 并等待回收。

## 12. 输入、性能和安全

- Broker 设置最大 request bytes 和材料 bytes；默认建议 4 MiB request 上限，具体 stage budget 由 wh-review 控制；
- broker 不自行分块、不静默截断；
- wh-review 负责 lens、material、delta 和 token 预算；
- request 通过 canonical hash 去重；
- stdout/stderr 各有 10 MiB 上限，写盘前 redaction；
- `0600` 运行文件；
- provider binary realpath/hash 在 probe 和 spawn 前一致；
- receipt 带 nonce/attempt id，拒绝重放；
- public report 不复制 raw session id、handle、auth、native path；
- metrics 只能由 Broker 计算一次，summary 不重新猜测。

## 13. 三层验收

### 13.1 Core routing tests

只用 fake adapter，不启动真实 CLI：

- same-tier parallel；
- zero-success fallback；
- mixed preserve；
- unknown Host；
- same-source；
- partial success；
- auth/provider unavailable；
- timeout/hang；
- invalid/truncated output；
- input too large；
- config drift。

### 13.2 Provider contract tests

每个 adapter 单独测试：

- command/argv/model/effort；
- auth preflight；
- output normalization；
- native resume；
- timeout/process cleanup；
- provider-specific transient errors；
- state allowlist 和 secret isolation。

### 13.3 Real Host matrix

四个 Host：Claude Code、Kimi、Codex、OpenCode。四个 reviewer 同样为四个 provider。四种同源组合必须排除，12 种异源组合按真实 capability 逐个验收。

每份报告必须记录：

- Host 是否 verified；
- provider 是否实际启动；
- Round 1/2 状态；
- session 是否复用；
- delta 是否成立；
- fresh 是否发生；
- selection eligibility；
- 未执行的稳定原因。

未选择的 scenario 不得被汇总器要求 evidence。

## 14. wh-review 集成

3rd-review 完成并验收后，才进入 workflowhub Phase D：

1. wh-review 生成 stage contract、lens、材料和 `response_contract`；
2. 调用 `3rd-review run --request review-request.json`；
3. 读取 private payload_ref 和 session_ref；
4. 按 provider 合并业务 verdict/findings；
5. 原子写 round receipt；
6. 幂等投影 report/index；
7. `stage-result` 只引用 receipt hash 和公开 continuation metrics；
8. 不复制 raw session id、handle、auth 或 runtime path。

3rd-review 不直接写 workflow stage，不直接生成业务报告。

## 15. 迁移阶段

### Phase 0：冻结与协议

- 停止向旧 `providers.mjs` 增加功能补丁；
- 旧 `route-review`/`route-rules` 标记为 wh-review legacy；
- 冻结通用 Request/Result/Diagnostic schema；
- 创建异常与恢复说明文件；
- 删除“已完成”但未被真实证据支持的声明。
- 冻结现有 `skills/wh-review/` 直接调用旧 Claude runner 的运行时；Phase 6 替换前禁止新旧链混用。

### Phase 1：纯 Broker Vertical Slice

- JSON config；
- request snapshot/hash；
- tier planner；
- eligibility；
- fallback；
- fake adapter；
- canonical result。

### Phase 2：Claude/Kimi Adapter

- 真实 CLI；
- auth/timeout/output/continuation；
- capability registry；
- 真实两轮 smoke。

### Phase 3：Host 与异常

- host hint；
- process provenance 软失败；
- process group；
- input budget；
- request dedup；
- runtime/lock/GC；
- secret isolation；
- 全异常矩阵测试。

### Phase 4：Codex/OpenCode

- adapter contract；
- native state allowlist；
- 真实两轮门禁；
- 通过后才 release continuation；evidence 到期、CLI binary hash 改变或显式撤销后立即失效。

### Phase 5：真实 Host Matrix

- 四 Host；
- 12 异源组合；
- 4 同源排除；
- 未选 scenario 不误报；
- 只接受真实可复现 evidence。

### Phase 6：wh-review/workflowhub

- stage contract/lens/material；
- business response schema；
- merged result；
- receipt/report/index/stage-result；
- 每 provider session registry；
- 五 stage 全链路。

### Phase 7：删除旧链

- 删除旧业务污染的 Broker 逻辑；
- 删除 Read attestation、全文 fresh retry、OMC 硬依赖和重复 metrics；
- 不长期维护双栈。

## 16. 完成标准

在下列条件全部满足前，不宣称新方案完成：

- `3rd-review` 不再硬编码审查业务 schema；
- route-review 业务逻辑已移出 Broker；
- Host provenance 失败不会阻断 provider；
- fallback 只按 `selection_eligible` 停止，wh-review 再映射业务采纳状态；
- fake routing 与真实 provider 验收分离；
- 认证、网络、超时、输入过大、非法输出、session、runtime、锁、磁盘、取消和 secret 异常均有稳定 code、测试和说明；
- 每个 released continuation provider 有真实两轮证据；
- 公共报告不会泄漏 session/handle/auth/runtime；
- wh-review 完成 report/stage-result/session registry 集成；
- 四 Host 矩阵报告可以区分执行失败、身份未知、provider 不可用和同源排除；
- 旧链已删除或明确隔离；
- 每个 phase 经过 Claude Code、Kimi 和必要的真实 Host 门禁。

## 17. 相关文档

- 历史需求与失败经验：`docs/3rd-review-redesign-draft.md`
- 异常与恢复维护手册：`docs/3rd-review-error-and-recovery.md`
- provider contract：`docs/3rd-review-provider-contract.md`
- workflowhub 五阶段业务设计：由 wh-review 维护，不放入 3rd-review core

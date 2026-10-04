# 3rd-review / wh-review 重设计草案（历史基线）

> V2 正式设计已独立写入 [3rd-review-redesign-v2.md](./3rd-review-redesign-v2.md)。本文件保留 R01–R60、历史教训和旧方案对照，不再作为新实现的架构规范。异常维护基线见 [3rd-review-error-and-recovery.md](./3rd-review-error-and-recovery.md)。

> 状态：V1 简化稿，待异源审查。  
> 日期：2026-07-11  
> 原则：先恢复可用性，再按真实故障增加机制。

## 1. 背景

当前审查链的问题不是五个 stage 分别坏，而是共享执行边界过度复杂：

- Claude/Kimi 已完成审查，却被 provider event/Read attestation 误判失败。
- Kimi 输出解析、凭证环境、Claude 工头配置隔离不稳定。
- wh-review 把完整 SKILL.md 塞进审查包，输入膨胀到 300KB，单次耗时超过 500 秒。
- fresh repair 会重新审查全文，几乎翻倍时间和 token。
- raw verdict、round、report、index、stage-result 没有一个正式提交入口。
- fixture 全绿不能证明真实 CLI 可用。

目标不是继续加安全证明和状态机，而是恢复一条短、清楚、可诊断的真实审查链。

## 2. 完整原始需求

以下需求全部来自本次讨论。简化只能减少实现层和重复机制，不能删除这些结果要求。

### 2.1 Provider 与宿主

- **R01 CLI执行、认证方式开放**：审查任务统一通过 Claude Code、Codex、Kimi、OpenCode 等 CLI 执行；CLI 后端既可使用订阅登录/OAuth，也可使用 API key 或 OpenAI-compatible provider，不要求只用订阅。
- **R02 多宿主**：3rd-review 可从 Claude Code、Codex、Kimi、OpenCode 等不同主 Agent 中调用。
- **R03 多 reviewer**：同一轮可执行多个异源 provider，分别返回独立意见。
- **R04 同源排除**：根据显式 host 和实际 backend 排除同源 reviewer，不能自审自判。
- **R05 OpenCode**：OpenCode 必须成为正式 provider，不只停留在 capability smoke。
- **R06 凭据来源**：复用各 CLI 自身登录态、OAuth、环境变量或 provider config；API key 不得进入 prompt、review request、report、artifact 或 workflowhub，全局路由配置也不保存明文凭据。
- **R07 Hermetic profile**：provider reviewer 不继承默认 agent、工头规则、hooks、plugins、MCP 和写权限；同时不能破坏该 provider 已配置的订阅或 API-key 认证。
- **R08 真实 backend 记录**：receipt 记录 CLI provider、model 和可获得的 backend identity；无法证明异源时不标记异源成功。

### 2.2 全局配置与路由

- **R09 全局配置**：集中配置 tiers、providers、enabled、command、model、effort、timeout。
- **R10 多级 fallback**：每个 tier 可配置多个 provider。
- **R11 同层并行**：当前 tier 的 eligible providers 并行执行。
- **R12 成功保留**：部分 provider 成功时保留全部成功结果；失败单独提醒。
- **R13 Fallback条件**：当前 tier 至少一个成功就不进入下一层；零成功才 fallback。
- **R14 主 Agent 合并**：3rd-review 不做共识或仲裁，由当前主 Agent 合并多个 reviewer 意见。
- **R15 成本配置**：每个 provider 可配置 model、thinking/effort 和 timeout。
- **R16 宿主限制可见**：managed host 阻断外发时记录 `blocked_by_host`，不重试、不伪装成 provider 故障。

### 2.3 输入、合同与五阶段质量

- **R17 wh-review 决策**：wh-review 根据 stage、风险、轮次决定审查方式和需要的 reviewer/lens。
- **R18 合同准备**：wh-review 维护 base policy 与五个 stage 的差异合同，不把 provider transport 规则混入合同。
- **R19 材料准备**：wh-review 生成精确、不可静默截断、hash绑定的材料包。
- **R20 短输入**：完整 SKILL.md 不进入 reviewer context；只发送短 lens/checklist 和必要材料。
- **R21 Host facts**：test/build/hash/diff/browser QA 等机械事实由 host 执行，区分 machine-verified 与 host-asserted。
- **R22 增量审查**：round 2+ 使用 delta、未闭合 findings 和必要上下文；影响扩散时恢复 full review。
- **R23 Intake质量**：direction blind review 与 detail review 分开；覆盖真实问题、scope、优先级、歧义、验收和用户批准边界。
- **R24 Design质量**：逐项覆盖 FR、来源、失败/边界场景、业务影响、非目标和可验收性；UI 条件适用时加入设计审查。
- **R25 Plan质量**：覆盖 FR→task→verify、依赖、阶段完成、失败/回滚、真实命令、影响范围和治理约束。
- **R26 Code质量**：按 phase 审查 exact diff、相关源码/测试、spec/plan/task、RED/GREEN事实、错误/安全边界和返修消费点。
- **R27 Acceptance质量**：逐 AC、逐原始需求闭环，禁止抽样；UI 必须有真实浏览器 QA 证据。
- **R28 Coverage receipt**：reviewer 对 stage checklist 输出 pass/fail/NA 和证据；关键 invariant 未检查时不能 pass。
- **R29 历史规则迁移**：旧合同每条规则必须进入 legacy ledger，明确保留、迁到 host、迁到 lens 或有证据删除。

### 2.4 结果合并、报告与落盘

- **R30 独立结果**：每个 reviewer result 保留 provider/model/verdict/summary/findings/耗时和失败信息。
- **R31 合并合同**：定义 merged-result schema、finding identity、去重、冲突保留、disposition、上轮 closure 和人工升级条件。
- **R32 硬门不被多数覆盖**：任一 reviewer 命中安全/数据损失等 stage hard invariant 时，主 Agent 不能用多数 pass 静默覆盖。
- **R33 人读报告**：复用 agenthub 的标题和信息架构，先结论，再根因、finding、修复和验收条件。
- **R34 稳定命名**：报告使用 `design-review-001-revise.md` 等人读文件名，UUID 留 machine receipt。
- **R35 轮次闭环**：报告展示 previous findings 的 open/fixed/closed 和 Revision Record。
- **R36 运行信息分离**：provider/model/effort/token/耗时/transport 放 machine receipt，报告正文只给相对链接。
- **R37 正式提交**：wh-review 通过唯一 commit 函数原子写 round receipt，幂等投影 report/index，stage-result 引用 receipt hash。
- **R38 失败不污染业务**：transport/provider失败只写 diagnostic，不增加业务 round、不生成业务审查报告、不沿用旧 success。
- **R39 单一任务根**：落盘只接受 canonical task directory，避免 `root + taskId` 重复嵌套。

### 2.5 性能、恢复与可维护性

- **R40 性能可控**：普通 provider审查目标在约120秒内，超时明确失败，不能默认跑十分钟。
- **R41 Token可控**：记录 contract/lens/material bytes和估算token；lens和总输入有stage预算。
- **R42 失败早停**：binary/auth/host block/timeout/output invalid 能尽早发现，不能等完整长审查结束才判断。
- **R43 成功不丢**：一个 provider 已成功时，其他 provider失败或超时不使其结果失效。
- **R44 Session恢复**：provider支持显式session id时，暂态失败可同session resume一次。
- **R45 JSON-only repair**：分析已完成但JSON非法时，只在同session请求canonical JSON一次，不重新发送材料；响应必须绑定原input hash。
- **R46 禁止全文fresh retry**：无session时不自动重新审全文；retry不重置总预算。
- **R47 进程治理**：timeout能终止provider进程树；stdout/stderr各有10MiB上限、`0600`权限和脱敏。
- **R48 真实CLI门禁**：fake CLI测试外，发布前必须跑真实Claude/Kimi/Codex/OpenCode短输入smoke。
- **R49 可观测性**：记录输入bytes/tokens、provider/model/effort、elapsed、turns、retry/resume和失败阶段。
- **R50 简单可维护**：优先复用外部项目成熟模式；V1生产代码以约600–1200行、6–10个文件为软预算，Node零外部依赖；不能为压行数删除需求。
- **R51 不长期双栈**：新入口验证后删除旧Read attestation、fresh全文retry和OMC硬依赖，不长期维护两套执行路径。
- **R52 Worktree隔离**：3rd-review必须在独立git worktree和`codex/`分支实施，不直接修改主checkout。
- **R53 Phase异源审查**：每个实施phase完成后，用真实Claude Code审查bounded phase packet；若宿主策略阻断，必须记录`blocked_by_host` artifact，并在允许外发的环境补验后才能最终合并。
- **R54 实施顺序**：先完成3rd-review全部实现、测试和迁移，再开始workflowhub/wh-review代码改动。
- **R55 Provider独立跨轮Session**：round 1保存每个provider自己的原生session；round 2+只能续跑同一provider的root/latest session，禁止provider之间交换session。
- **R56 临时Continuation Runtime**：Codex/OpenCode等需要本地session状态时，只能使用`$TMPDIR/3rd-review-continuations/<uid>/<opaque-handle>`私有runtime；零用户配置、目录0700、文件0600、认证每轮重新staging，不长期保存凭据。
- **R57 自动过期与清理**：continuation runtime连续24小时未成功使用即过期；3rd-review启动、成功续跑和host acceptance启动时自动GC，系统临时目录清理作为第二层保障，不引入daemon/cron/launchd。
- **R58 Delta续审**：round 2+发送changed/new正文、deleted paths、完整当前manifest元数据、finding disposition和当前verified facts；broker必须证明`previous manifest + delta = current manifest`，不得静默漏文件或重新发送完整旧材料。
- **R59 禁止静默Fresh**：continuation缺失、过期、绑定不符、profile/model/backend变化或provider拒绝时返回稳定`CONTINUATION_FAILED`；只有wh-review能以明确reason请求fresh session，3rd-review不得自动全文重跑。
- **R60 Session隐私与可观测性**：原生session id和opaque handle只进入0600 machine receipt；人读报告只显示是否复用/过期/fresh及节省bytes/tokens/time，不显示完整session id。

## 3. 外部方案结论

### Partner Skill

复用：薄 CLI 调用、bounded handoff、结果留存、显式 session resume。

不复用：Codex 私有 JSONL 解析、完整 job runtime。

### oh-my-claudecode

复用：一个 provider 一组 CLI 参数、stdin、preflight、stdout/stderr。

不直接依赖 `omc ask`：它缺少本项目需要的 canonical verdict，也会引入额外 runtime。

### qiaomu-llm-mcp

复用：provider registry/config、凭证由 provider 自己管理。

不复用 MCP/通用 HTTP API 执行层：本项目统一通过 provider CLI 执行，避免多一层服务；CLI 内部使用订阅、OAuth 或 API-key backend 均合法。

最终组合：

```text
OMC 的薄 provider adapter
+ Partner 的简单结果/session思路
+ qiaomu 的配置驱动
```

## 4. V1 架构

```text
任意主 Agent
  │ explicit host
  ▼
wh-review
  │ request package
  ▼
3rd-review broker
  ├─ Claude adapter
  ├─ Codex adapter
  ├─ Kimi adapter
  └─ OpenCode adapter
  │ independent results
  ▼
主 Agent合并
  │ merged decision
  ▼
wh-review commit/report/stage-result
```

### 4.1 3rd-review 只负责

- 读取全局配置。
- 接收显式 host，排除同源 provider。
- 当前 tier 并行执行。
- 调用薄 provider adapter。
- 校验 provider 最终 JSON。
- 保留成功和失败。
- 当前层零成功才 fallback。
- 输出一个 aggregate result。

3rd-review 不理解 stage、round、finding closure 或 workflow推进。

### 4.2 wh-review 只负责

- stage→contract/lens。
- 精确材料清单和 host-verified facts。
- 生成短 request package。
- 交给主 Agent 合并 provider意见。
- 业务 round、报告、index、stage-result。

wh-review 不处理 provider binary、认证、环境、event parser、retry。

## 5. 最小文件结构

目标：新增 production 代码约 600–1200 行、6–10个文件，作为可维护性软预算；零外部 Node 依赖。

```text
config/review-providers.json
scripts/3rd-review.mjs
scripts/providers.mjs
SKILL.md
```

若 `providers.mjs` 过长，可拆为四个 `scripts/providers/*.mjs`。不预建更多抽象层。

不引入以下通用平台或额外抽象：

- 通用 job 数据库/状态机。
- 通用job的lease/stale takeover平台；continuation runtime与Claude稳定cwd所需的最小私有lease已实现，不扩展为通用调度框架。
- 动态/远端capability发现平台；按provider、CLI版本和真实两轮证据绑定的最小内置continuation capability registry已实现。
- policy/consent平台。
- transfer manifest系统。
- 多层 timeout/TTFO/idle/harvest预算框架。
- provider内部 Read attestation。
- 长期新旧双栈。

## 6. 全局配置

默认位置：`~/.config/3rd-review/config.json`。可用 `THIRD_REVIEW_CONFIG` 指定另一个文件。

只支持：内置默认＋一个用户覆盖文件。不做项目/OS五级合并。

```json
{
  "tiers": [
    ["claude-code", "codex", "kimi"],
    ["opencode"]
  ],
  "providers": {
    "claude-code": {
      "enabled": true,
      "command": "claude",
      "expected_backend": "anthropic",
      "model": "default",
      "effort": "high",
      "timeout_seconds": 120
    },
    "codex": {
      "enabled": true,
      "command": "codex",
      "expected_backend": "openai",
      "model": "default",
      "effort": "high",
      "timeout_seconds": 120
    },
    "kimi": {
      "enabled": true,
      "command": "kimi",
      "expected_backend": "moonshot",
      "model": "default",
      "effort": "high",
      "timeout_seconds": 120
    },
    "opencode": {
      "enabled": true,
      "command": "opencode",
      "expected_backend": "from_model",
      "model": "default",
      "effort": "high",
      "timeout_seconds": 120
    }
  }
}
```

全局路由配置不保存明文凭证。CLI 使用自身登录态、OAuth、环境变量或 provider config；receipt 只记录脱敏后的认证类型与 backend evidence，不记录 secret。

## 7. Request 与 Result

### 7.1 Request

```json
{
  "version": 1,
  "request_id": "opaque-id",
  "host": {
    "cli_provider": "codex",
    "model": "gpt-5",
    "backend_identity": "openai",
    "identity_source": "host-wrapper",
    "confidence": "verified"
  },
  "mode": "full",
  "contract": {"id": "design", "version": "1", "content": "短stage合同"},
  "lenses": [{"id": "architecture", "content": "短checklist"}],
  "package_root": "/absolute/sealed/package",
  "materials": [{"id": "spec", "path": "spec.md", "bytes": 1000, "sha256": "..."}],
  "verified_facts": {"machine_verified": [], "host_asserted": []},
  "previous_findings": [],
  "coverage": {"included": [], "excluded": [], "reason": "full"},
  "routing": {"allowed_providers": [], "excluded_providers": []},
  "deadline_seconds": 180,
  "input_hash": "sha256"
}
```

`host` 必须由宿主 wrapper 显式传入。环境检测只用于诊断。adapter在运行时记录实际model/backend及证据；配置中的`expected_backend`不能冒充实际值。已知同backend时不启动；backend未知时可执行，但结果`cross_engine_verified=false`，不能作为满足R04或停止fallback的唯一成功。

`input_hash`为request去除`request_id/deadline`等运行态字段后的canonical JSON SHA-256：对象键排序、数组顺序保留、UTF-8、CRLF→LF；覆盖contract、lenses、materials清单、facts、previous findings、coverage和routing。`profile_hash`不是request字段；每个adapter启动前，按实际binary realpath、argv中的model/effort、隔离settings摘要和允许工具摘要独立计算并写入attempt/result，不包含secret。

request同时指定绝对`package_root`；`materials[].path`只能是package_root内的相对路径。broker对每个文件执行lstat/realpath，拒绝`..`逃逸、绝对路径、symlink逃逸、非普通文件、bytes/hash不符。合法skill symlink在wh-review展开材料前解析并复制成package内普通文件，3rd-review不直接信任外部symlink root。

V1统一采用“broker校验后确定性内联”策略：broker按`materials[]`顺序读取文件，并使用同一个buffer完成bytes/hash校验与内联，避免校验后二次读取的TOCTOU；用固定`BEGIN/END MATERIAL <id>`边界渲染进stdin。provider不需要文件Read工具，也不解析Read event。若渲染后超过stage输入预算则prepare fail-loud，不静默截断。package仍是输入真相，inline只是transport。

### 7.2 Provider Result

```json
{
  "provider": "claude-code",
  "model": "...",
  "backend_identity": "anthropic",
  "identity_source": "provider-output|resolved-model|expected-config",
  "identity_confidence": "verified|inferred|unknown",
  "cross_engine_verified": true,
  "status": "success",
  "verdict": "pass|revise_required|escalate_to_human",
  "summary": "...",
  "findings": [{"finding_id": "provider-stable-id", "checklist_id": "design.fr", "invariant_id": null, "hard_invariant": false, "severity": "important", "issue": "...", "evidence": "...", "recommendation": "..."}],
  "checklist": [{"id": "design.fr", "status": "pass|fail|na", "evidence": "..."}],
  "metrics": {"elapsed_ms": 0, "input_bytes": 0, "input_tokens": null, "output_tokens": null, "turns": null, "effort": "high", "retry_count": 0, "resume_count": 0, "continuation_count": 0, "continuation_input_bytes": 0, "saved_input_bytes": 0, "continuation_elapsed_ms": 0, "fresh_estimated_elapsed_ms": null, "session_reuse_count": 0, "fresh_restart_count": 0, "failure_phase": null},
  "session": {"session_id": null, "id_ref": null, "attempt": 1, "resumed": false, "profile_hash": "sha256", "config_profile_hash": "sha256", "continuation": {"capability": "cross-round|unsupported", "status": "available|missing|expired|unsupported|unavailable", "handle": null, "root_round": 1, "latest_round": 1, "session_id_hash": null}},
  "input_hash": "sha256"
}
```

Provider失败使用同一外壳：

```json
{
  "provider": "kimi",
  "model": "...",
  "backend_identity": "moonshot",
  "status": "failed|timeout|blocked_by_host",
  "failure": {"phase": "preflight|spawn|run|parse|validate", "code": "...", "retryable": false, "provider_started": true},
  "metrics": {"elapsed_ms": 0, "input_bytes": 0, "input_tokens": null, "output_tokens": null, "turns": null, "effort": "high", "retry_count": 0, "resume_count": 0, "failure_phase": "run"},
  "session": {"id_ref": null, "attempt": 1},
  "input_hash": "sha256"
}
```

### 7.3 Aggregate Result

```json
{
  "request_id": "opaque-id",
  "host": {"cli_provider": "codex", "backend_identity": "openai"},
  "tier": 0,
  "reviews": [],
  "failures": [],
  "started_at": "...",
  "elapsed_ms": 0
}
```

主 Agent 只消费独立 results，自行合并。3rd-review 不改 reviewer verdict。

### 7.4 Merged Result（wh-review合同）

```json
{
  "request_id": "opaque-id",
  "input_hash": "sha256",
  "verdict": "pass|revise_required|escalate_to_human",
  "summary": "...",
  "findings": [
    {
      "finding_id": "stable-fingerprint",
      "sources": [{"provider": "claude-code", "finding_id": "provider-stable-id"}],
      "severity": "blocking|important|minor",
      "issue": "...",
      "disposition": "open|accepted|rejected|fixed|closed",
      "reason": "...",
      "hard_invariant": false
    }
  ],
  "provider_failures": [],
  "needs_human": false
}
```

合并不能用多数票覆盖`hard_invariant=true`的finding。每个provider finding具有稳定source finding id；merged result必须逐项映射所有hard-invariant source finding并给出disposition。除非存在machine-verified反证和明确reason，否则hard invariant未关闭时不能pass。缺映射、偷偷改成`hard_invariant=false`或丢失冲突时，wh-review commit拒绝。重复finding合并sources；冲突意见必须同时保留并写disposition/reason。无法处理的冲突或关键证据缺失时`needs_human=true`。

## 8. Broker 算法

```text
读取配置
→ 标准化显式host
→ 遍历tiers
→ 过滤disabled和同源provider
→ 当前tier全部并行启动
→ 每provider独立wall timeout
→ 校验最终JSON
→ 保存当前tier成功与失败

当前tier ≥1个cross_engine_verified成功：返回
当前tier 0成功：下一tier
全部失败：返回execution_failed
```

`routing.allowed_providers=[]`表示沿用全局tier；非空时与全局tier取交集；`excluded_providers`始终优先。backend身份unknown的成功结果可以返回给主Agent参考，但不计入“异源成功”，不能单独阻止fallback。

V1 等当前 tier 全部结束，不实现 harvest window。request的单一aggregate deadline约束initial和一次resume/repair；任何恢复只使用剩余时间，不重置预算。provider timeout默认120秒，配置可降低；提高时仍受request aggregate deadline限制。

## 9. Provider Adapter

统一最小接口：

```js
run({ request, providerConfig, signal })
```

adapter 只做：

- 找 binary/运行 `--version`。
- 用不含项目内容的固定canary检查当前 provider 认证/基本可用性；认证可来自订阅、OAuth 或 API key；canary成功不代表宿主允许发送私有材料。
- 构建 provider CLI 参数。
- stdin 传broker已验证并确定性渲染的短prompt/package内容。
- 使用 provider 自己已配置的登录态、OAuth 或 API-key config，不把凭据拼进prompt/argv/artifact。
- 设置 model/effort。
- timeout 后杀进程树。
- 解析最终 JSON。
- 提取显式 session id（若CLI提供）。
- 返回 stdout/stderr 摘要和耗时。

所有adapter都必须有最小hermetic profile：隔离persona/instructions/hooks/plugins/MCP并禁用文件/写/shell工具，同时只保留该provider认证所需的HOME、OAuth状态、认证环境变量或provider config。每个adapter各自提供负向测试，不能用一个通用flag假装已隔离。

3rd-review不建立job数据库，但保留最小run artifacts：

```text
<output-dir>/runs/<request-id>/<provider>/
  attempt-001.json
  stdout.raw
  stderr.raw
  result.json
```

stdout/stderr写盘前做已知secret脱敏，各自最多10MiB，超限写truncated marker；文件权限`0600`。`result.json`使用临时文件＋atomic rename。权限或写盘失败必须明确报错，不能只保留内存结果。

### Claude Code

- 隔离默认 agent、hooks、plugins、MCP。
- 只读或 tools disabled。
- 优先 native JSON schema/output。

### Codex

- 使用直接 CLI，不依赖 OMC runtime。
- 使用官方 JSON/output schema能力。
- 不使用危险的 unrestricted 默认参数。

### Kimi

- stdin stream-json/final-message-only。
- 本地校验 final JSON。

### OpenCode

- `run --pure --format json`。
- 使用专用 readonly reviewer agent。
- 不把 `--pure` 当成 readonly证明。

## 10. 最小恢复

V1 不做通用恢复状态机。

只允许：

1. 已获得 session id，且出现暂态 transport failure：同 session resume一次。
2. adapter观察到provider明确的completed/final marker、已获得session id但 final JSON非法：同 session只请求 JSON一次，不重新发送材料；exit 0本身不足以证明分析完成。
3. 没有 session id：不重新跑全文。

成功结果立即保留。其他 provider失败不影响它。

resume/repair必须绑定`provider + session_id + attempt_id + input_hash + profile_hash + model + effort`，响应回显原input hash。不一致直接失败。initial/resume/repair共享request aggregate deadline。

同轮恢复与跨轮continuation是两套计数和状态：`retry_count`表示当前轮completed-result repair，`resume_count`表示当前轮暂态resume，`continuation_count`表示round 2+成功续跑第一轮provider session。跨轮continuation不消耗当前轮的一次repair/resume额度。

跨轮continuation使用零配置临时runtime：`$TMPDIR/3rd-review-continuations/<uid>/<opaque-handle>`。handle不是路径；broker只能在自有临时根解析。runtime连续24小时未成功使用自动过期，并在每次启动/成功续跑/host acceptance时自动GC；失败尝试不延长TTL。wh-review round receipt按provider保存root/latest session、handle、result/profile/config-profile/model/backend/manifest hash和expiry；人读报告不显示原生id或handle。

round 2+ request引用artifact-root相对previous receipt及hash，携带完整当前manifest元数据、changed/new正文、deleted paths和finding disposition。broker安全读取receipt/runtime并验证lineage，然后对账`previous manifest + delta = current manifest`。任何session/receipt/profile/model/backend/manifest不匹配均在provider spawn前返回`CONTINUATION_FAILED`，禁止静默fresh全文重跑。

Continuation capability按provider及CLI版本独立发布，不能由fixture全绿推断。当前真实两轮门禁只发布Claude Code `2.1.x >= 2.1.207`的`--resume`与Kimi `1.48.x >= 1.48.0`的`--session`；Codex `exec resume`和OpenCode `-s`在各自真实门禁通过前保持`CONTINUATION_FAILED/UNSUPPORTED`。任一provider续跑失败不丢弃同层其他provider已成功结果。

明确禁止：

- fresh全文retry。
- retry后重置timeout。
- 多次链式resume。
- 失败后自动降成同源并声称异源成功。

## 11. Managed 宿主限制

`managed restricted profile` 是宿主环境，不是3rd-review功能。

如果宿主在CLI启动前阻止外发：

```json
{
  "provider": "claude-code",
  "status": "blocked_by_host",
  "retryable": false
}
```

broker继续其他合法provider；全部失败则明确失败。

若拒绝发生在broker进程启动前，3rd-review本身无法分类；宿主wrapper必须写同形态`blocked_by_host`结果。V1只承诺对broker可观察到的spawn拒绝自行分类。

V1 不实现policy registry、consent receipt或绕过机制。trusted MCP/tool属于部署选项，不进入核心。

## 12. wh-review 输入与质量

为避免500秒审查：

- 完整 SKILL.md 不进入provider context。
- base policy与stage contract分离。
- 每个stage使用短lens/checklist。
- lens cap为`min(32KB, max(8KB, material_bytes × 30%))`，它是上限而不是必须填满；单个lens不超过16KB。
- test/build/hash/browser QA由host执行，写入verified facts。
- provider只做独立判断，不重复机械检查。
- round2+使用delta＋未闭合findings＋必要上下文。
- 禁止静默截断；超出stage输入上限直接报错。

五个stage必须各自提供质量矩阵：required materials、conditional materials、host checks、reviewer checklist、blocking invariants、incremental rules、report sections、pass条件。矩阵必须覆盖 R23–R29，不能用统一 verdict schema 替代。

## 13. wh-review 报告与提交

wh-review提供一个正式commit函数：

```text
merged result
→ atomic round receipt
→ report/index投影
→ stage-result引用receipt hash
```

真正的commit point只有单个round receipt原子rename。report/index是可重建投影；stage-result由stage owner另行原子写入并引用receipt hash。中断后根据receipt幂等重建投影。

transport失败只写diagnostic，不增加业务round、不生成业务报告。

报告复用agenthub的信息架构：

- 人读中文标题。
- 顶部结论和一句话摘要。
- 根因、finding、修复、验收条件。
- 上轮finding闭环和Revision Record。
- provider/model/耗时/token放machine receipt，正文只给相对链接。

canonical目录：

```text
<task-dir>/reviews/runs/<run-id>/...
<task-dir>/reviews/<checkpoint>/round-001/{merged-result,receipt}.json
<task-dir>/reports/design-review-001-revise.md
<task-dir>/reports/review-index.md
<task-dir>/stage-result-design.json
```

本次stage推进只能引用与当前request hash匹配的receipt；新尝试失败时不得把旧success当成当前结果。

## 14. 实施阶段

### Phase A：可运行vertical slice

- 全局config。
- broker。
- fake CLI tests。
- Claude/Kimi薄adapter。
- 当前tier并行、排同源、零成功fallback。
- 冻结最小request/provider-result/aggregate-result schema。

完成条件：普通本机环境真实Claude/Kimi至少一个成功；managed宿主拒绝时明确`blocked_by_host`。

### Phase B：四provider

- Codex/OpenCode adapter。
- 四宿主×四reviewer同源排除测试。
- model/effort/timeout。
- 单次session resume/JSON-only repair。

### Phase C：替换旧链

- 新入口替换旧runner。
- 删除Read attestation、fresh全文retry、OMC硬依赖。
- 不长期保留双栈。
- 更新SKILL/README和真实smoke。

Phase C只修改3rd-review。完成并验收后，才进入单独的workflowhub Phase D，实现R17–R39。

### Phase D：workflowhub / wh-review（3rd-review完成后）

- 建立base policy、五份stage contract、stage quality matrix和legacy-rule-ledger。
- 实现精确package、verified facts、delta/full切换和输入预算。
- 实现merged-result schema与主Agent disposition流程。
- 实现单一round receipt commit、report/index投影和stage-result引用。
- 复用agenthub人读报告信息架构与稳定落盘路径。
- 实现每provider独立session registry，round 1保存root session，round 2+读取root/latest binding并构造continuation request。
- registry只在0600 machine receipt保存原生session id与opaque handle；按provider保存root/latest result、input、manifest、profile/config-profile、model/backend、round、last-used/expiry和continuation/fresh计数，并通过receipt hash原子提交。
- 实现完整manifest元数据与changed/new/deleted delta，对账失败不调用provider。
- 实现显式fresh-start policy；session过期/unsupported/rejected时不得由3rd-review偷偷重投完整材料。
- 报告记录continuation复用、过期、fresh原因和实际bytes/tokens/time节省，隐藏原生session id与handle。
- stage-result只引用已提交round receipt hash及公开continuation状态/metrics，不复制私有session字段；report/index/stage-result继续由同一receipt幂等投影。

## 15. V1 验收

- 新增production代码目标约600–1200行、6–10个文件；这是可维护性软预算，超出必须给理由并review，不能为了压行数删除需求。
- Node零外部依赖。
- fake CLI覆盖四adapter、timeout、invalid JSON、session resume、host exclusion、fallback。
- 真实Claude/Kimi/Codex/OpenCode短输入smoke。
- 每个adapter都必须通过：污染用户配置隔离负测、文件/写/shell工具禁用、两个小文件＋hash manifest经broker内联后的真实marker/package smoke、native final output解析。
- provider失败不丢其他成功结果。
- 任何自动恢复不重新发送全文。
- 四provider按真实capability逐个通过两轮continuation门禁：round 1明确缺陷为revise，round 2仅发送修复delta并复用同provider session得到pass；未证明的provider保持`CONTINUATION_UNSUPPORTED`。
- continuation runtime零配置位于系统TMPDIR，24小时闲置自动GC；过期、恶意handle、symlink、错误owner/mode、损坏manifest均fail closed且不误删其他lineage。
- round 2完整manifest必须可由round 1 manifest加changed/new/deleted delta精确重建；full round-1 material sentinel不得出现在round-2 provider输入。
- managed宿主拒绝不重试、不伪装provider失败。
- 旧Read attestation和fresh全文repair被删除。
- Phase A/B/C/D均有Claude Code bounded审查artifact；被managed policy阻断的phase在最终合并前补验。

## 16. 需求覆盖与实现映射

| 组件 | 覆盖需求 | 验收证据 |
|---|---|---|
| 全局配置 | R09–R10、R15 | 全局JSON；tier/fallback；model/effort/timeout进入CLI args |
| Broker | R02–R04、R11–R14、R16、R43 | 4×4 alias/同源单测；每host wrapper传host smoke；关键异源E2E；partial success；zero-success fallback |
| Provider adapters | R01、R05–R08、R30、R42、R44–R49 | fake CLI + 四个真实短输入smoke；session/timeout/output receipts |
| Request/package | R18–R22、R41 | hash/路径/截断测试；stage输入预算；delta/full切换 |
| Stage quality contracts | R17、R23–R29 | 五张quality matrix；legacy-rule-ledger；golden findings |
| 主Agent合并 | R14、R31–R32 | merged-result schema；重复/冲突/hard invariant fixtures |
| wh-review commit | R33–R39 | crash-point/idempotency tests；报告/index/stage-result引用同一receipt |
| 性能与维护 | R40–R42、R46–R54 | LOC/文件数；120s目标；无fresh全文retry；worktree/phase review artifacts |
| 跨轮续审 | R55–R60 | 独立session；delta闭包；24h GC；隐私；真实两轮门禁 |

### 16.1 完整 host×reviewer 验收矩阵

四个 host：Claude Code、Codex、Kimi、OpenCode。四个 reviewer同样为这四个provider。共16种组合：4种同源必须在单测中排除。12种异源组合通过alias/backend单测覆盖，并按每个adapter真实smoke、每个host wrapper smoke及关键E2E分层验证，避免重复昂贵调用。

OpenCode只有在可复现的机器证据同时证明以下条件后，才算正式完成R05：resolved effective profile中read/glob/grep/edit/bash/task等文件、写、shell工具全部为`false`、未暴露或`deny`；未继承用户persona/plugins/MCP/skills；真实公开package运行正常完成且无tool event；受保护文件运行前后hash不变。禁止用模型自述作证，也不强迫模型调用已从tool schema移除的工具——这类调用不可观测且会造成无意义挂死。

### 16.2 五阶段交付物

workflowhub相关实现开始前必须产出：

```text
contracts/base-review-policy.md
contracts/intake.md
contracts/design.md
contracts/plan.md
contracts/code.md
contracts/test-acceptance.md
contracts/stage-quality-matrix.md
contracts/legacy-rule-ledger.md
schemas/merged-result.v1.json
schemas/round-receipt.v1.json
```

本文件规定这些结果要求，但遵守R54：先完成3rd-review，再开始workflowhub Phase D。

### 16.3 需求完成判定

任何需求只有同时满足以下条件才可标记完成：

1. 有对应production行为或正式文档合同。
2. 有可证伪测试/真实smoke。
3. 结果由实际artifact证明，不靠模型自报。
4. 未通过兼容fallback伪装完成。

## 17. 延后事项

以下实现机制可以延后，但不得削弱 R01–R60 的结果要求：

- durable job store。
- 通用job crash takeover与跨worker lease平台。
- TTFO/semantic idle。
- harvest window。
- 动态/远端provider capability发现与协商平台。
- 本地离线模型。
- policy/trust管理。
- 高级缓存或通用跨作业自动接管。

其中R44的同轮显式session resume、R55–R60的跨轮continuation、最小私有lease和版本绑定capability registry均已属于V1；延后的只是通用durable job store、动态capability平台和跨worker自动接管。

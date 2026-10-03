# wh-review 异源审查重构设计

## 1. 目标与边界

本设计优化内置 `skills/wh-review`，不创建新技能。目标是让 workflowhub 在五个 workflow stage 中，以阶段合同、仓库内审查技能和 `3rd-review` 的异源 CLI 调用，完成可续跑、可审计、可恢复的审查。

边界固定：

- `3rd-review` 只负责异源 provider 选择、CLI 执行、原生 session 续跑、受限附件复制、原始输出和执行诊断。
- `wh-review` 负责 stage 合同、材料和技能选择、业务输出校验、finding 合并、主 Agent disposition、私有回执、公开报告和 workflow stage-result。
- `workflowhub` 只调用 `wh-review` 的完整轮次门面并推进自身工作流状态。

`3rd-review` 不接收 verdict、业务 schema、合同、报告或阶段语义。附件传输是通用文件传输能力，不理解 workflowhub 业务。本设计修正旧方案“本期不扩展 broker”的表述：本期只扩展受限附件复制；不增加 nonce、private-reference、config-hash、业务幂等或业务结果校验。

## 2. 单一合同结构

`contracts/` 是唯一审查规则源。不新增 `reviewers/` 目录，也不维护与合同重复的 prompt 正文。

```text
skills/wh-review/contracts/
  provider-protocol.md
  make-decision.md
  build-spec.md
  build-plan.md
  build-code.md
  verify-code.md
```

`provider-protocol.md` 只放跨阶段规则：只读、禁止改文件和写报告、结构化 JSON、finding 最低字段、合同外 finding 只能为 minor、`skillResults` 的证据三要素、原始输出不等于业务结论。

每个 stage contract 放唯一的阶段规则：角色、Must Read 顺序、材料清单、技能、轴/检查表、hard invariants、阻断条件、增量轮规则和阶段输出字段。现有 `intake.md`、`design.md`、`plan.md`、`code.md`、`test-acceptance.md` 迁为上述 stage 名称；所有“每轮独立会话”文字改为第 4 节的固定首轮 runtime 规则。删除旧 `CONTRACT-DEPTH: placeholder` 标记。

`make-decision.md` 含两个不重叠的 `review_track`：

- `direction`：只读原始用户需求。输入出现 decision-log、拟定方向、方案摘要或其他污染材料时，输出 `escalate_to_human`。
- `detail`：读取原始需求和 decision-log，检查盲点、细节、漂移和范围。

两条 track 是同一 workflow stage 的独立 review flow，不能合并成一个 prompt，也不共享 session。

Provider prompt 每轮由下列不可变部分组成：

```text
provider-protocol + stage contract 的选定 track + reviewer-output schema + 本轮材料
```

## 3. 阶段技能映射与仓库技能

新增 `skills/wh-review/stage-skill-plan.json`。它按 `stage + review_track` 选择仓库内技能、材料 profile、输出 schema、pass finding policy、续跑 policy 和附件传输模式。技能解析只允许 `workflowhub/skills/`，不再扫描 `~/.claude/skills`、`~/.codex/skills` 或 gstack。

| stage / track | 必需技能 | 规则 |
| --- | --- | --- |
| make-decision / direction | plan-ceo-review, review | 纯盲审 |
| make-decision / detail | review, plan-ceo-review | detail/drift/scope |
| build-spec | plan-ceo-review, review | UI 时加 plan-design-review |
| build-plan | spec-analyze, plan-eng-review, review | 原 speckit 名称废弃 |
| build-code | 无额外技能 | 规则在 code contract |
| verify-code | qa-only, verify-change | verify-change 为 light 模式 |

已存在的 `skills/spec-analyze` 和 `skills/verify-change` 直接复用。新增并迁移为自包含、`report-only` 的仓库技能：

```text
skills/plan-ceo-review/
skills/review/
skills/plan-design-review/
skills/plan-eng-review/
skills/qa-only/
```

迁移只保留审查 lens、checklist、review sections 和必要 specialist references。删除 gstack preamble、`~/.gstack`、telemetry、gstack binary、交互确认、网络和写入依赖。UI 验收仍服从 workflowhub 的 `isolated-browser-qa` 路由。`spec-analyze` 是唯一名称；更新 `build-plan` 合同和全部引用，不保留 `speckit-analyze` alias。

每个迁移技能携带 `review-bundle.json`，显式列出允许被异源审查读取的普通静态文件。resolver 只按该文件展开技能依赖闭包，不猜测相对引用；每一项必须位于该技能目录、存在、为普通单链接文件并有 SHA-256。`StageSkillPlan` 由 logical skill id、bundle hash、闭包文件列表、review mode、delivery mode、检查点和期望证据组成。可执行审查环境中才可标记为 executed；只读异源环境中的迁移技能均为 `lens-only`，不得伪造执行。

delivery mode 只有两种：`file_only` 要求 provider 从私有 workspace 读取技能，broker 只选择 capability 表中的 A 类文件访问 provider；无可用 provider 返回 `NO_CAPABLE_PROVIDER`。`always_embed` 仅允许 lens-only 技能，wh-review 内嵌 bundle，broker 可选择 A/B 类 provider，但超出 512KB 预算立即失败。当前 required skill 默认 `file_only`；不得使用未定义的 `auto` 模式。

## 4. 首轮 runtime 和续跑

一个 review flow 的身份是：

```text
task_id + stage + review_track + review_flow_id
```

首轮以完整、冻结的合同、材料和技能 bundle 调用 `3rd-review` v4，保存 `initial_runtime_id`、首轮 completed provider 集、每个 provider 的业务校验结果和全部 hash。`BrokerClient` 的可执行路径来自 workflowhub 配置 `third_review.command`，可为 PATH 命令或显式 node/script argv；不得硬编码个人绝对路径。启动时按需执行 `doctor` 验证该配置。BrokerClient 接收并仅在 private RoundReceipt 保存 broker 返回的 `runtime_id`、每 provider `session_id`、raw output ref/hash 与 transport status；它们绝不进入 continuation request、core receipt、报告或 stage-result。续跑唯一传 `initial_runtime_id`，不伪造也不直接传 session id。

第 2 轮及以后总是调用：

```json
{"version":4,"host_provider":"<host>","prompt":"<continuation prompt>","continuation":{"runtime_id":"<initial_runtime_id>"}}
```

不传上一轮 runtime，不创建新 runtime，不重复投喂首轮全文。continuation prompt 仅包含：PreviousFindings、ClosureEvidence、DeltaManifest、受影响材料、当前材料 manifest、跨阶段遗留状态和所需 skill-lens hash。

provider 的两种续跑资格分开计算：格式纠正只要求首轮 transport 已建立原生 `session_id`，且 broker 能证明相同 runtime、provider、session 和冻结材料；语义 R2 才要求上一轮 `business_valid:true`。transport、material、format attempt 不创建 semantic round，不递增 `business_round`，不写 projection guard，也不覆盖已有 semantic lineage。它们只追加 private attempt raw/receipt；同一 tree、合同和冻结材料修复后可重试。

续跑前先用 broker status 验证 initial runtime、provider session 和冻结材料仍可证明连续。只有审查对象 tree/合同/技能 bundle 改变，或 runtime/session/材料链确实无法证明连续时，才进入 `blocked_by_human_confirmation`。人工 reset 是唯一新建 flow 的入口：`wh-review-cli reset --task-id --stage --track --flow-id --reason --human-approval-ref`，生成新 flow 与新的 initial runtime，保留旧 flow/receipt，并在新 receipt 记录 parent flow 和授权。系统绝不静默换 session；provider 启动、cwd、附件或输出格式错误本身不是 reset 理由。

增量轮先关闭上轮 blocking。新 blocking 必须证明由本轮变更引入、且上轮不可能发现；否则写 `late_finding:true` 且最高为 minor。delta 校验失败不自动改 full review，也不自动 fresh start：材料不一致时进入 `blocked_by_human_confirmation`；仅人工明确执行 `reset` 才能新建完整材料的新 flow。相同 blocking 连续两轮未闭合时，要求根因、扫描范围、反例矩阵和 closure checklist；第三轮升级人工。

## 5. 异源技能可见性：通用附件传输

仅把技能放入 workflowhub 不会让 provider 发现它们：当前 `3rd-review` provider cwd 位于 `/tmp/3rd-review/<runtime>/workspace`。不得将 cwd 直接改成 workflowhub 根，也不得 symlink 仓库技能；这会暴露整仓、使 session 读到漂移规则。

`3rd-review` 增加向后兼容的通用 CLI 参数 `--attachments=<manifest.json>`、`--attachments-root=<absolute-root>` 和 `--attachment-delivery=<file_only|always_embed>`，不改变 v4 request 的业务字段。ADR 同时固定 CLI 参数、退出码、stdout JSON 和错误码。manifest 由 JSON Schema 校验，包含 `version`、`bundle_id`、`entries[{source,destination,sha256,embed}]`；source 一律相对 `--attachments-root`。broker 的配置列出允许 attachment roots，workflowhub 调用时 root 是其仓库根，且 source 只能位于 `skills/` 与 `skills/wh-review/contracts/`。broker 用 delivery mode 过滤 provider capability 表：A 类可读取 provider-private workspace；B 类仅能消费文本 prompt。首次运行时 broker：

1. 对 source 和 destination 都拒绝绝对路径、`~`、`..`、symlink、hard link、device、FIFO、socket、root 外文件和 hash 不匹配；只接受单链接普通文件。
2. 用 byte-copy 原子写入 `runtime/workspace/<provider>/skills/<skill>/`，复制完成后锁定冻结文件；provider 与 broker 必须在同一用户命名空间。workspace 是材料投递边界，不宣称是操作系统安全边界。
3. 写入冻结的 `skills-manifest.json`。
4. 每个 provider 使用自己的私有 workspace。

续跑不再接收附件，也不替换已有 bundle；broker 重新校验文件 hash 和 `skills-manifest.json`，任何不符都是 transport failure。格式纠正使用显式 `reuse_frozen_material` 审计分支，只允许相同 runtime、provider、session 和初始冻结 triad，不接受新材料；每次重试都复验并留 receipt。B 类使用 `always_embed` 的 bundle 内容由 wh-review 注入 prompt；broker 对最终完整渲染文本做 512KB gate，超限返回 `MATERIAL_TOO_LARGE`，不得切 chunk 规避。大包走真实 `file_only`。Kimi 的 `--skills-dir` 和 provider cwd 指向私有目录；所有 provider 调用前检查 cwd、bundle 和 skills 可读写属性是否满足 adapter 要求。`doctor` 只证明 executable 和静态复制能力；真实认证、cwd 和 marker 可见性由 opt-in smoke 证明。附件功能不选择技能、不解释合同、不校验 verdict，仍是 broker 的通用受限文件传输。

## 6. 轮次门面、校验与回执

新增 `ReviewRoundFacade`，所有 workflow 和 CLI 只调用它：

1. `prepare()`：取 task lock，生成 immutable ReviewIntent、StageSkillPlan、materials manifest 和 idempotency key。
2. `run()`：构造 prompt 和附件、调用 BrokerClient、保存 raw/diagnostic、校验每个 provider、合并为 merged result；不写 disposition。其输出由 `round-run-result.schema.json` 定义，含 merged findings、hard gate list、continuation eligibility、provider diagnostics 和 receipt draft ref。
3. 主 Agent 对 merged findings 写 `accept|reject|defer` 及证据。
4. `publish(dispositions)`：其输入由 `dispositions.schema.json` 定义，逐项绑定 finding id、action、evidence；schema/hash/hard-gate 不符返回明确错误。最多重提配置次数，超限 blocked。
5. `publish` 原子发布 private RoundReceipt、core receipt、中文报告、report-index 和 stage-result。

`ReviewIntent` 至少含 task、stage、track、flow、business round、host provider、contract hash、material manifest hash、skill bundle hash、initial runtime、previous core receipt hash、limits 和 idempotency key。

Provider raw output 只接受两种形式：完整纯 JSON；或全文中恰好一个 `json` fenced object。0 个或多个候选对象、第二个 JSON 对象、提取后 schema 不合法都不能产生 verdict。格式失败在相同 runtime/provider/session 上最多自动纠正两次，只要求重发 canonical JSON，不重传材料、不创建 semantic round；两次仍失败返回 `OUTPUT_FORMAT_INVALID` 或 `OUTPUT_SCHEMA_INVALID`，`semantic_verdict=null`。

模型只返回 verdict、summary、findings、checklist、pass items、`skillResults` 的语义证据和 host 分配的材料标识，不再负责复述 packet/manifest/diff/contract/skill bundle hash。host 以冻结材料实际字节、broker delivery receipt 和 intent 注入这些绑定；receipt 必须绑定 runtime、provider、session、冻结 triad、byte size 和 SHA-256，不能以 provider 自报代替。`revise_required` 必须含 rootCause 与 fixApproach。缺 checklist/hard invariant、空洞 skill evidence 是 `REVIEW_CONTRACT_INVALID`，不是 transport 成功的替代 verdict。

只有至少一份 outcome 同时满足 `transport_status=completed`、`packet_status=complete`、schema/合同校验通过且 `semantic_verdict!=null`，才产生业务 round。其余 attempt 只保留 raw、稳定 diagnostic 和私有 attempt receipt；不改 semantic flow、`business_round`、projection guard 或旧成功。finding id 为 `sha256(file\\0line\\0rule_id\\0normalized_issue)`；同类 finding 合并、冲突保留。`make-decision` 以 track 分节报告：direction 是需求级缺陷，detail 是方案级缺陷；direction 的 hard gate 或 escalate 不能被 detail 的 pass 覆盖，跨 track 冲突保留双证据并升级人工。任一业务有效 provider 命中 hard invariant，结论至少为 `revise_required`，不能被多数票覆盖。

private RoundReceipt 保存 provider transport/business 状态、runtime/session/raw/diagnostic 私有引用、合并结果、disposition、closure、bundle hash。prompt 模板、diagnostic、core receipt、报告和 index 都过滤 runtime id、session id 与 provider workspace 绝对路径。公开 core receipt 是脱敏投影；stage-result 只引用 core receipt hash，绝不引用 private receipt 路径。发布顺序为：private receipt → core receipt → 报告 → report-index → stage-result。task 级锁为 `flows/<task_id>.lock`。projection manifest 有 receipt/report/index/stage-result 路径与 `done_flags`；每项先写 temp 再 rename，启动时在锁内按未完成顺序幂等重放，不能重调 provider。

publish 再校验 disposition：hard invariant finding 不得被 disposition 标为 `accept`。违反时 publish 拒绝写入并要求主 Agent 重写；达到配置的最大次数后进入 `blocked_by_human_confirmation`。

异常状态矩阵是 ADR 的必需附件，至少覆盖 broker timeout、attachment copy/hash failure、`NO_CAPABLE_PROVIDER`、provider 非 JSON、business-invalid、lock 争用、disposition 超限、runtime 被 TTL 清理和 delta 不一致。每种状态固定 retry、diagnostic 和 blocked 结果。

## 7. 完整 review packet 与执行语义

`review-packet.v1.json` 是所有 provider 的唯一审查输入。`ReviewRoundFacade.prepare()` 在启动 broker 前生成并校验同一个 `packet_hash`；任一必需材料缺失时写 `MATERIAL_INCOMPLETE` diagnostic 并停止，不能调用 provider。packet 固定含：

```text
packet_hash / manifest_hash / diff_sha256
真实 unified diff / changed_files(path, hash, size)
AC 与设计摘录 / host-verified 测试证据
stage contract 与 skill bundle hashes / review round 元数据
```

BrokerClient 唯一允许的生产调用是：

```text
<third_review.command> run --config=<config> --request=<v4-request> [--attachments=...]
```

禁止调用 `run-heterologous-review.mjs`，禁止 `--diff`、`--output` 和任何旧 runner payload。静态测试扫描 `skills/wh-review` 和 `workflows/`，发现上述字符串或绕过 BrokerClient 的直接调用即失败。

每个 adapter 的 cwd 只能是 broker provider-private workspace，其中只含 review packet、冻结 skill bundle 和 broker 自身普通配置；不得挂载 workflowhub repo、task 目录或任何绝对宿主路径。provider prompt 明确规定：只审 packet，不执行 git，不读取真实 repo，不以绝对路径索取材料。adapter argv/fixture 必须证明此约束；host delivery receipt 绑定 `packet_hash` 和 `diff_sha256`，provider 只引用 host 分配的材料标识，不负责复述 hash。

每个 provider outcome 采用三轴，互不替代：

```text
transport_status: completed | cancelled | authentication_failed | timeout | failed
packet_status: complete | material_incomplete | hash_mismatch
semantic_verdict: pass | revise_required | escalate_to_human | null
```

`CANCELLED` 必有 `cancel_source`：`user`、`workflow_shutdown`、`broker_idle_timeout` 或 `broker_max_duration`。认证失败、材料不足、超时、取消、进程失败和输出格式错误都是 transport/material/format diagnostic，`semantic_verdict=null`；只有 `completed + complete + schema/合同校验通过` 的输出能拥有语义 verdict。稳定错误至少区分 `PROVIDER_UNAVAILABLE`、`ATTACHMENT_UNREADABLE`、`OUTPUT_FORMAT_INVALID`、`OUTPUT_SCHEMA_INVALID`、`MATERIAL_HASH_MISMATCH`、`REVIEW_CONTRACT_INVALID` 和 `CALLER_CANCELLED`，不得统一折叠成 `BUSINESS_INVALID`。

删除 wh-review 旧 `spawnSync` 600 秒外层 timeout，不得以旧 wall timeout 杀 V4 provider。若 workflow 明确配置等待上限，BrokerClient 只能调用 `3rd-review cancel`，并写 `cancel_source=workflow_shutdown` 与原始 runtime/provider；不得把取消伪装成 reviewer verdict。

aggregate 仅输入满足以下谓词的 provider outcome：

```text
transport_status == completed
&& packet_status == complete
&& business_valid == true
&& semantic_verdict != null
```

`cancelled`、认证失败、timeout、材料不足、hash 不符、非 JSON、业务无效和进程失败一律不能参与 finding 合并。private evidence 路径固定为 `<task>/reviews/private/round-.../{review-packet.json,manifest.json,broker-run.json,providers/<provider>.raw.txt,round-receipt.json}`；raw 回显 packet_hash、diff_sha256 与 smoke marker 后才可作为 packet 完整证据。

## 8. 迁移顺序

1. 建立上述 contracts、schema、stage-skill-plan、provider capability 表、legacy-rule-ledger 和附件传输 ADR；冻结旧规则的保留、迁移或删除理由。
2. 迁移五个 report-only 技能及其必要静态引用；为每个技能写原 gstack 依赖、替代与移除证明；静态检查禁止 gstack、`$HOME`、网络、文件写和子进程引用。将 resolver 改为仓库唯一来源；修正 `spec-analyze`、intake/test manifest。
3. 在 `3rd-review` 实现和测试通用附件传输、provider-private workspace、Kimi skills-dir 及 session bundle 冻结。
4. 在 `wh-review` 实现 ReviewRoundFacade、BrokerClient、profile/track 选择、validator、merge、receipt/projector；删除旧 Claude runner、Read-attestation、same-source 自动降级和旧 runner 协议。
5. 统一五个 workflow 的调用。`build-code` 删除旧两个子代理和直接 3rd-review 调用，改为 code review flow。

删除任何旧生产文件前，检查目标是否包含用户未提交修改；有修改立即中止并列出文件，不能覆盖。

## 9. 验收

- contracts 是唯一规则源；没有 reviewers 重复正文；direction 与 detail 材料隔离。
- 所有 required skills 都从 workflowhub/skills 解析；gstack 根被移除后仍可运行。
- provider capability 表、delivery mode 与 broker 选择共同证明：file_only 绝不选择 B 类，always_embed 的 B 类 prompt 预算不超限；首轮复制的 bundle 可被 A 类 provider 从私有 workspace 读取；续跑 hash 不变且不重拷贝。
- 每个 flow 的第 2 轮请求仅引用 initial runtime；无 automatic fresh start。
- provider 仅部分成功、全失败、无 session、无效 JSON、hash/checklist/skill evidence 失败都按状态机处理。
- late finding、连续未闭合、hard invariant 单票否决、跨阶段复现都有固定结果。
- private/core receipt 不泄露 session、runtime、原始输出、绝对路径或认证信息；hard invariant 不可被 disposition 覆盖；崩溃后投影可幂等恢复。
- 五个 workflow 无旧 runner/同级直接调用；至少每个 stage 有 mock E2E，至少一个 stage 有真实 provider 首轮加 continuation smoke。
- 附件边界拒绝 symlink、hard link、特殊文件、路径逃逸和 hash 不符；manifest root/cwd 解析固定；Kimi、Codex、Claude、OpenCode 的私有 workspace 行为均有 adapter 测试。
- mock broker 覆盖 A/B provider 选择、技能依赖闭包、reset、TTL 到期和 `RoundFacade.run/publish` schema。
- OpenCode 与 Kimi 的真实 smoke 使用同一 review-packet.v1；二者 raw output 必须引用 host 分配的材料标识并证明首/中/尾 diff marker 可见，host receipt 另行绑定 packet/hash，证据落入 private evidence 路径。

## 10. 简化修复方案（2026-07-14 修订）

用户体验只有一条主路径：准备完整材料 → 调 provider → 得到可用 verdict，或得到明确、可直接重试的错误。provider 启动、cwd、附件和格式错误只记 attempt，不锁 flow、不要求人工 reset。只有审查对象 tree/合同改变，或原 session/冻结材料连续性无法证明时，才要求新 flow。

不新建 PacketBuilder/ProviderRunner/VerdictNormalizer，不增加新的通用状态机。只局部修改现有 facade、parser/validator、schema/protocol、BrokerClient 和 smoke。已修复的 `providerId` 与 512KB/file_only 逻辑只补回归，测试失败才继续改。

### Phase 1：失败可直接重试

- transport/material/format 失败只保存 raw 和 attempt receipt。
- 不推进 semantic flow、`business_round`、projection guard，不覆盖已有 verdict。
- parser 接受纯 JSON或全文唯一 `json` fence；提取结果仍必须过 schema。
- 格式错误复用原 runtime/provider/session 和冻结材料，最多自动修正两次；耗尽后返回稳定错误，无 verdict、无需 reset。
- 回放现有 OpenCode、Kimi 失败 raw，证明旧 flow 锁死不再出现。

### Phase 2：host 管材料绑定

- 删除让模型复述 packet/manifest/diff/contract/skill hash 的要求；模型只给审查结论和证据。
- host 从冻结材料、delivery receipt 和 intent 注入绑定；每次复用只校验原 runtime/provider/session 和冻结 triad，不接收新附件。
- 错误就地给具体码：provider 不可用、附件不可读、格式错误、schema 错误、材料 hash 错、合同错误、调用方取消。禁止统一折叠成 `BUSINESS_INVALID`。
- 合同/tree 未变时直接重试；改变时才要求新 flow。

### Phase 3：真实链验收

- 先回放 `providerId`、512KB、OpenCode 格式、Kimi cwd/hash 历史样本。
- 再生成并投递完整 93-file packet；manifest 与 changed-files 对账，Kimi/OpenCode `file_only` raw 能看到首/中/尾 marker。
- 验证失败 attempt 不锁 flow，R2 复用原 session，tree 改变才 reset，最终 `verify-final` 可达。
- 普通单元测试不冒充真实链；真实 E2E 失败就报告具体失败点，不生成 semantic verdict。

本修订符合 F3/F4/F5/F8/F10 与 Q1/Q2/Q3：入口材料继续 fail-closed；质量判断交给异源审查和人；运行故障只记录、不把整个 workflow 卡死。

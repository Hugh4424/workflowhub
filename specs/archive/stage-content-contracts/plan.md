# 实施计划：Stage 内容契约

**Task ID**：`stage-content-contracts`  
**Spec**：`specs/stage-content-contracts/spec.md`  
**状态**：待正式 build-plan review 的完整草稿  
**实现仓库**：WorkflowHub CandidateWorkspace  
**测试策略**：风险驱动窄测试；不把全量测试作为默认步骤

## 1. 目标、非目标与可观察效果

### 目标

1. 让 `steps.json + journal + audit-aggregator` 成为五阶段唯一的过程完成权威。
2. 让真实问答、文档拷问、歧义关闭、decision-log、plan/tasks 和交接内容都有可验证的 typed evidence。
3. 让结构错误在发布成功 attempt 前明确失败，同时保留独立 review 对主观质量的裁决。
4. 让五阶段共用一条 TaskKernel 审查链；非 build-code 普通修改不再次调用 provider，重大结构变化最多补一次 full review，build-code 修复继续 full review 到 pass。
5. 完成后在原 `review-foundation-baseline` task 上创建 append-only continuation，并真实重放处理组 1。

### 非目标

- 不引入 Multica、Issue 评论身份、token proof 或真人密码学认证。
- 不新增第二套 audit verdict、第二个 review runner 或每个 Stage 各自维护的完成状态机。
- 不改 provider、prompt、路由和价格策略。
- 不修改旧 task、旧 attempt、旧 accepted record 的 bytes/hash。
- 不扩到处理组 5 的跨阶段唤醒或处理组 6 的 build-code Phase 门禁。
- 不用关键词评分代替独立工程 review。

### Before → After

| 观察点 | Before | After |
| --- | --- | --- |
| make-decision | 自报完成也可发布 | 三轮 talk、grill、decision、review、确认同 run 才发布 |
| build-spec | 歧义扫描无正式 ledger | 每条重大歧义有结论或明确 blocker |
| decision-log | receipt 内压缩摘要 | 独立可读 Markdown + canonical receipt/ref/hash |
| build-plan | 非空即可通过结构检查 | Phase、task、依赖、命令、FR/AC 全部可执行 |
| Stage 交接 | 用户话术与技术事实漂移 | 一份 completion facts 生成两个同步视图 |
| serious finding | 只记录或处理不一致 | 五阶段统一暂停并支持具体风险承担 |
| review 成本 | spec/plan 文案允许无限重审 | 普通修改零 provider；结构变化最多一次；代码修复到 pass |
| 历史任务 | 旧失败后无法可信继续 | 旧记录只读，新 revision/attempt 绑定旧 lineage |

## 2. Technical Context

- **Language/Version**：Node.js 20+，ECMAScript modules，Markdown，JSON Schema。
- **Primary Dependencies**：Node.js 标准库、Vitest、现有 `wh-review` schema validator；不新增 npm 依赖。
- **Storage**：TaskHandle/TaskKernel 管理 task 外置 canonical records；ArtifactDir 管理 CandidateWorkspace named artifacts。
- **Testing**：`npx vitest run` 的单文件或小测试组；tar/hash 使用 macOS 自带 `tar`、`shasum`、`comm`。
- **Target Platform**：macOS/Linux CLI 宿主；不得依赖 WorkflowHub cwd、Multica 或 Issue 身份。
- **Project Type**：宿主无关的 AI 工作流编排工具。
- **Performance Goal**：非 build-code 普通文档修改新增 provider 调用数必须为 0；内容校验只做本地确定性检查。
- **Constraints**：append-only、create-only、fail-loud、单一 audit verdict、单一 review flow/head、秘密最小化。
- **Scale/Scope**：恢复 31 个已完成 runtime 文件；新增 11 个窄 schema、4 个核心模块、10 个窄测试文件；修改 5 个 Stage Skill 和既有 writer/audit/handler/TaskKernel 接线。

## 3. 全局约束

- 31 个 bootstrap runtime 路径只能从认证 tar 原样回放，31/31 SHA-256 必须一致。
- TaskKernel/canonical writer 注入 task、stage、run、producer、ref/hash、snapshot；组件不得传入 root、task path、cwd。
- content validator 只判断结构、身份、顺序、绑定和映射，不判断自然语言质量。
- audit-aggregator 是唯一过程 pass/fail 生产者；review verdict 不被 risk acceptance 改写。
- direction、plan、final verify 仍是三个正常人工边界；build-spec/build-code 仅在 serious finding 时异常暂停。
- D1–D7 原 bytes/hash 不改，只新增七条字面量 correction appendix。
- 旧记录只读；新 continuation 必须绑定旧 accepted/attempt ref/hash 和原因。
- 每个行为改动先用最窄 RED 证明缺陷，再用同一测试文件验证 GREEN。
- 不默认运行全量测试；最终是否增加一次广覆盖由 verify-code 根据实际改动风险单独说明。

## 4. 治理同步矩阵

| 治理面 | 精确文件 | 处理 |
| --- | --- | --- |
| 宪法 | `CONSTITUTION.md`、`constitution-checklist.md`、`docs/adr/0010-serious-review-disposition.md` | 升级 1.3.0 并独立审查 |
| workflow | 五个 `workflows/*/SKILL.md`、make-decision/build-spec/build-plan `steps.json` | 接入证据和有限审查 |
| reviewer contract | `skills/plan-eng-review/SKILL.md`、`skills/wh-review/manifest.json` | 保留 lens-only，补结构材料事实 |
| schema | `core/schemas/stage-content-*.json` 及 decision/risk/plan schema | 新增 allowlisted typed contracts |
| runtime | `core/task-kernel-implementation.mjs`、`core/stage-handlers.mjs` | 单一权威接线 |
| knowledge/doc | `CONTEXT.md`、ADR、Skill 来源段 | 记录来源和边界 |
| automation | 8 个窄测试文件 | 不新增 CI 框架 |

## 5. Code Anchors 与 reuse / extend / new

| Anchor | 来源、路径与符号 | 当前职责 | 本次策略 |
| --- | --- | --- | --- |
| A-001 | `core/audit-aggregator.mjs:buildAuditSummaryFromJournalEvents` | 唯一过程 verdict | extend：读取 allowlisted content refs |
| A-002 | `core/audit-summary-carrier.mjs:loadAuditSummary` | 认证 audit carrier | reuse |
| A-003 | `core/canonical-receipt-writer.mjs:writeOfficialComponentReceipt` | 官方 receipt | extend：decision Markdown 与 typed evidence refs |
| A-004 | `core/task-kernel-implementation.mjs:buildTaskKernel` | task 权威、发布、review flow | extend：typed evidence、risk、continuation |
| A-005 | `core/stage-handlers.mjs:officialStageHandler` | 五阶段发布入口 | extend：只消费认证 carrier/refs |
| A-006 | bootstrap bundle 中的 `core/review-flow-authority.mjs` | review flow/root/head/CAS | reuse：Phase 1 原样回放 |
| A-007 | `skills/wh-review/scripts/review-controller.mjs:deriveChangeClassification` | 结构变化分类 | reuse + 补五阶段矩阵 |
| A-008 | `skills/wh-review/schemas/resolution.schema.json` | 零 provider resolution | reuse |
| A-009 | `skills/talk-with-zhipeng/SKILL.md` | 单轴决策卡和逐题交互 | extend：typed completion 输出 |
| A-010 | `skills/grill-with-docs/SKILL.md` | 文档拷问 | extend：真实问答和机械跳过事实 |
| A-011 | `skills/decision-log/SKILL.md` | 决策内容 | extend：唯一 decision-entry 与 Markdown |
| A-012 | `skills/plan-eng-review/SKILL.md` | 独立工程 lens | reuse，不建第二 runner |
| A-013 | `scripts/stage-runtime.mjs` | 官方 Stage CLI | extend：content/risk/continuation 命令 |
| A-014 | `metrics/collector.mjs` | 统一 metrics | reuse，故障 warn-only |

### 选择矩阵

| 能力 | 选择 | 理由 |
| --- | --- | --- |
| review flow/CAS/budget | reuse | 已完成并在稳定 runner 使用 |
| audit verdict | extend existing | 新建 verdict 会违反单一权威 |
| typed content writer | new narrow module | 现 writer 不允许这些 kind |
| document validators | new narrow module | 结构缺口需要确定性验证 |
| decision Markdown | extend official receipt | 恢复人工可读性，不建新状态机 |
| risk/omission | two separate schemas | 两种风险对象和放行边界不同 |
| completion views | one facts + two renderers | 防止两份事实漂移 |
| continuation | extend TaskKernel | 旧记录不可改，previous ref 不能充当新 revision |

## 6. 模块职责与接口

### 6.1 `core/stage-content-evidence.mjs`（new）

- `createStageContentEvidenceWriter({task, workspace, stage, workflowRunId, now})`
- 返回 `publish({kind, payload}) -> {ref, hash, value}`。
- caller 只能给 `kind + payload`；身份、snapshot、producer、ref/hash 由 writer 注入。
- `verifyStageContentEvidence({task, ref, hash, expectedStage, expectedRunId, expectedTree})` 只返回认证值，不产出 verdict。

### 6.2 `core/stage-content-contracts.mjs`（new）

- `validateInteractionCompletion(value)`
- `validateAmbiguityLedger(value)`
- `validateDecisionEntry(value)`
- `validateDecisionLogContract({main, appendices, coverage, interaction})`
- `validatePlanTaskContract({spec, plan, tasks})`
- 返回 `{ok, errors, facts}`；`ok` 是内容结构事实，由 audit-aggregator 决定过程 verdict。

### 6.3 `core/stage-review-disposition.mjs`（new）

- `seriousActionableFindings(reviewResult)` 只选择 `actionable + major|blocking + valid evidence`。
- `buildRiskAcceptancePayload({finding, review, snapshot, card, reply})` 生成最小业务 payload。
- TaskKernel 写 `risk-acceptance.v1`；模块不能推进 review head 或改 verdict。

### 6.4 `core/stage-completion-facts.mjs`（new）

- `buildStageCompletionFacts(stageAttempt)`
- `renderUserSummary(facts)`
- `renderSystemHandoff(facts)`
- `verifySharedCompletionFields(facts, userView, systemView)`

### 6.5 既有接线

- `core/audit-aggregator.mjs` 验证 manifest/journal/typed evidence，并保持唯一 verdict。
- `core/stage-handlers.mjs` 按 Stage 声明所需 evidence kind，不重算质量结论。
- `core/task-kernel-implementation.mjs` 在同一锁域内写 canonical record、推进 flow/head、记录 cost fact。
- `scripts/stage-runtime.mjs` 新增：
  - `publish-content-evidence --stage --project --task --kind --input`
  - `accept-review-risk --stage --project --task --input`
  - `continue-stage --stage=make-decision --project=workflowhub --task=review-foundation-baseline --input`

## 7. Schema、状态流与数据流

### Schema

| Schema | 核心字段 |
| --- | --- |
| `stage-content-evidence.v1` | kind、task/stage/run、producer、content_hash、snapshot、payload |
| `interaction-completion.v1` | round、queue、card_hash、ask/reply/re-rank、host refs、selected option |
| `ambiguity-ledger.v1` | ambiguity ID、分类、六类影响、状态、source、affected FR、spec hash |
| `decision-entry.v1` | question、choice、推荐、含义、source_type、exact excerpt、approval binding、事实、逻辑、影响、后果、风险、拒绝项、未决、supersedes |
| `decision-coverage-audit.v1` | source item、mapping、status、omission、card/reply、统计 |
| `decision-omission-acceptance.v1` | source/coverage/card/reply/decision bindings + 完整 decision_entry |
| `decision-correction-appendix.v1` | D1–D7 原 ref/hash、七条固定更正、accepted lookup binding |
| `decision-log-contract.v1` | Markdown main ref/hash、receipt ref/hash、appendix refs/hashes、恰好一次 coverage |
| `plan-task-contract.v1` | phase rows、task rows、FR/AC coverage、DAG、command/oracle checks |
| `stage-completion-facts.v1` | result、artifacts、tests/review、limits、risks、dependencies、next owner、user action、formal refs |
| `risk-acceptance.v1` | finding/review/evidence/snapshot/card/reply bindings、影响、后果、时间 |

### 状态流

```text
draft
  → minimized
  → hashed
  → canonical evidence written
  → audit reconciled
  → official Stage validation
  → attempt published
  → accepted lookup
```

失败路径：

```text
missing/tampered/misbound evidence
  → structural failure
  → no successful attempt
  → old head unchanged
```

审查路径：

```text
initial full review
  ├─ ordinary edit → zero-provider resolution → same flow head
  ├─ structural edit → one allowed full review → same flow head
  ├─ unavailable → provider attempt only → semantic head unchanged
  └─ build-code repair → fresh full review until pass
```

### 正常数据流

```text
host-visible ask/reply
  → talk/grill content payload
  → TaskKernel identity injection
  → typed evidence
  → audit-aggregator
  → Stage handler
  → append-only attempt
  → accepted lookup
  → one completion facts
  → user summary + system handoff
```

### 失败数据流

```text
caller identity/root/cwd injection
  → writer rejects before write

content hash/ref/tree mismatch
  → audit/handler rejects before attempt

serious valid finding
  → host-visible pause card
  → fix or exact risk acceptance
  → original review verdict retained

decision omission
  → coverage card
  → fix or decision-specific appendix
  → never reuse review risk schema
```

## 8. 精确文件树

### NEW

```text
core/stage-content-evidence.mjs
core/stage-content-contracts.mjs
core/stage-review-disposition.mjs
core/stage-completion-facts.mjs
core/schemas/stage-content-evidence.v1.json
core/schemas/interaction-completion.v1.json
core/schemas/ambiguity-ledger.v1.json
core/schemas/decision-entry.v1.json
core/schemas/decision-coverage-audit.v1.json
core/schemas/decision-omission-acceptance.v1.json
core/schemas/decision-correction-appendix.v1.json
core/schemas/decision-log-contract.v1.json
core/schemas/plan-task-contract.v1.json
core/schemas/stage-completion-facts.v1.json
core/schemas/risk-acceptance.v1.json
skills/decision-log/templates/decision-log-template.md
docs/adr/0010-serious-review-disposition.md
tests/stage-content-evidence.test.mjs
tests/stage-content-publication.test.mjs
tests/stage-interaction-contract.test.mjs
tests/stage-decision-contract.test.mjs
tests/stage-plan-task-contract.test.mjs
tests/stage-review-cost-policy.test.mjs
tests/stage-risk-acceptance.test.mjs
tests/stage-completion-facts.test.mjs
tests/stage-content-host-independence.test.mjs
tests/stage-content-continuation.test.mjs
```

### MODIFY

```text
CONSTITUTION.md
constitution-checklist.md
CONTEXT.md
core/audit-aggregator.mjs
core/canonical-receipt-writer.mjs
core/task-kernel-implementation.mjs
core/stage-handlers.mjs
core/stage-context.mjs
scripts/stage-runtime.mjs
scripts/validate-stage-replay.mjs
skills/talk-with-zhipeng/SKILL.md
skills/grill-with-docs/SKILL.md
skills/decision-log/SKILL.md
skills/spec-plan/SKILL.md
skills/spec-plan/templates/plan-template.md
skills/spec-tasks/SKILL.md
skills/spec-tasks/templates/tasks-template.md
skills/plan-eng-review/SKILL.md
skills/wh-review/manifest.json
workflows/make-decision/SKILL.md
workflows/make-decision/steps.json
workflows/make-decision/skill-deps.yaml
workflows/build-spec/SKILL.md
workflows/build-spec/steps.json
workflows/build-plan/SKILL.md
workflows/build-plan/steps.json
workflows/build-plan/skill-deps.yaml
workflows/build-code/SKILL.md
workflows/verify-code/SKILL.md
tests/interaction-quality-contract.test.mjs
tests/audit-aggregator.test.mjs
tests/official-make-decision-cli.test.mjs
tests/five-stage-audit-e2e.test.mjs
tests/host-independence.test.mjs
scripts/__tests__/stage-runtime-five-stage-e2e.test.mjs
```

### DO NOT TOUCH

```text
config/workflowhub.yaml
skills/wh-review/scripts/review-runner.mjs
skills/wh-review/scripts/third-review-host-config.mjs
workflows/build-code/phase-evidence.mjs
workflows/verify-code/freshness.mjs
package-lock.json
```

## 9. 候选方案、取舍与复杂度

| 决策 | 选择 | 拒绝方案 | 代价与理由 |
| --- | --- | --- | --- |
| 过程权威 | 扩展 audit-aggregator | 新 completion engine | 新引擎会双头 |
| 内容记录 | allowlisted typed envelope | 任意 JSON payload | allowlist 多 schema，但边界可验证 |
| decision artifact | Markdown + receipt refs | receipt 内单字符串 | 多一个 artifact，换来人工可读与稳定 diff |
| omission | 专用 appendix | 通用 risk record | 两 schema 稍多，但避免错误放行 |
| review 修改 | flow 内 resolution | 每改一次 provider review | 降低成本且不伪造 verdict |
| serious finding | 异常暂停 | 全部 finding 阻断 | 只处理有效严重问题 |
| continuation | TaskKernel append-only revision | 修改旧 accepted | 保留历史真实性 |
| 测试 | 窄测试矩阵 | 每步全量测试 | 降低资源和等待成本 |

### F10 复杂度判断

- 保留 4 个核心模块：分别承担 writer、content contract、risk、completion 单一职责。
- 保留 11 个 schema：每个都对应 spec 已明确的不同安全/放行边界；不合并 risk 与 omission。
- 不建通用 plugin framework、身份服务、第二 review runner、第二 verdict。
- 不新增 npm 依赖和默认全量测试。

## 10. 八种运行状态适用性

| 状态 | audit | review head | 用户交互 | 可发布 |
| --- | --- | --- | --- | --- |
| 正常成功 | pass | 当前语义 head | 仅既有业务边界 | 是 |
| 结构失败 | fail | 不变 | 无风险放行选项 | 否 |
| serious pause | 结构可通过 | verdict 保留 | 必须展示并等待 | 否，直到修复或承担风险 |
| risk accepted | 结构可通过 | verdict 保留 | 绑定具体 finding/reply | 仅同 snapshot |
| omission accepted | coverage 标 accepted_omission | 不影响 review | 绑定具体遗漏/reply | appendix 完整才可 |
| review unavailable | 记录 provider attempt | 语义 head 不变 | 不伪装 finding | 依 Stage 现有 unavailable 规则 |
| legacy read | legacy/unknown | 历史只读 | 给 continuation 条件 | 不能作为新执行证据 |
| build-code repair | fresh audit facts | 每次 fresh full review | 不新增正常 Phase 确认 | pass 后可发布 |

## 11. 九个场景优先级与独立测试

| 优先级 | 场景 | 独立价值 | 独立测试 |
| --- | --- | --- | --- |
| 1 | 跳过问答仍自称完成 | 直接封住问题 29 | `tests/stage-content-publication.test.mjs` |
| 2 | 完整 make-decision 发布 | 证明主链可用 | `tests/official-make-decision-cli.test.mjs` |
| 3 | 逐项关闭重大歧义 | 防隐含假设进入 spec | `tests/stage-interaction-contract.test.mjs` |
| 4 | 问题总数真实变化 | 防伪造逐题交互 | `tests/stage-interaction-contract.test.mjs` |
| 5 | 最终确认前发现遗漏 | 保证 decision 完整 | `tests/stage-decision-contract.test.mjs` |
| 6 | plan/tasks 可执行 | 提升 build-code 输入质量 | `tests/stage-plan-task-contract.test.mjs` |
| 7 | serious finding 风险处置 | 统一五阶段异常路径 | `tests/stage-risk-acceptance.test.mjs` |
| 8 | 双视图同源 | 改善用户理解与下游接力 | `tests/stage-completion-facts.test.mjs` |
| 9 | 修订不重复付费、旧任务继续 | 控制成本并恢复真实任务 | `tests/stage-review-cost-policy.test.mjs`、`tests/stage-content-continuation.test.mjs`、`scripts/validate-stage-replay.mjs` |

## 12. 实施 Phase

## Phase 1：原样恢复 31 个 bootstrap runtime 路径

### Goal
把稳定 runner 已完成的 review authority 原样放回 Candidate，不重建第二套实现。

### Files
只允许 `runtime-files.txt` 列出的 31 个路径。

### Tasks
T001 记录恢复前 RED；T002 安全解包；T003 验证 31/31 hash 和窄回归。

### Verify
tar 路径集合等于 manifest；无绝对路径、`..`、符号链接；`shasum -a 256 -c` 全部成功；review authority 小测试组通过。

### Knowledge
tar + manifest 是权威，patch 仅审计；任何差异不能人工重写。

### STOP
路径逃逸、清单外文件、符号链接、hash 不同或 Candidate 冲突时停止。

### Done
31 个路径逐字节一致，旧 runner/task records 未复制进 Candidate。

### 风险与回滚
风险是误覆盖设计产物；解包前验证路径集合。失败时删除本 Phase 新增的清单内文件，三个设计产物保持原 hash。

## Phase 2：研究与宪法 1.3.0

### Goal
先使 serious finding 的异常暂停符合宪法，再实施风险处置。

### Files
`CONSTITUTION.md`、`constitution-checklist.md`、`CONTEXT.md`、`docs/adr/0010-serious-review-disposition.md`、talk/grill Sources。

### Tasks
T010 固定三类成熟实践和 talk/grill 来源；T011 写宪法 RED；T012 修订 1.3.0；T013 做独立宪法 review。

### Verify
版本精确 1.3.0；F3/F4/F7/Q1/Q2 同步；条目仍为 21；旧→新映射和 revision source 完整。

### Knowledge
结构入口可 fail-loud；质量事实不变成普遍阻断门；serious pause 是有证据的异常点。

### STOP
独立宪法 review 未通过前，不进入 Phase 6 的 risk 实现。

### Done
宪法、checklist、ADR、来源记录一致，并有独立结论。

### 风险与回滚
风险是扩大 gate；只改五条并保留三个正常业务确认边界。失败时回滚本 Phase 宪法草稿，不影响 Phase 1 runtime。

## Phase 3：typed evidence、唯一 audit 与正式发布

### Goal
把内容证据接入既有 audit 和五阶段发布，不新增 verdict。

### Files
`core/stage-content-evidence.mjs`、11 个 schema、`core/audit-aggregator.mjs`、`core/canonical-receipt-writer.mjs`、`core/task-kernel-implementation.mjs`、`core/stage-handlers.mjs`、`scripts/stage-runtime.mjs` 及对应测试。

### Tasks
T020 写 writer/schema RED；T021 实现 writer；T022 写 audit/publication RED；T023 接线 audit/handler；T024 加五阶段 E2E 和展示一致性。

### Verify
缺失、重复、乱序、篡改、跨 task/stage/run/tree 全部在成功 attempt 前失败；writer/handler 不产生 verdict。

### Knowledge
TaskKernel 注入身份；组件只收内容与窄 callback。

### STOP
出现任意 payload、caller identity、第二 verdict 或半成品 head 时停止。

### Done
五阶段按 allowlist 消费 typed refs，正常正例发布，结构反例无成功 attempt。

### 风险与回滚
风险是 writer 权限过宽；用 kind allowlist、schema、create-only ref。回滚时移除新 kind 映射，不改旧 receipt。

## Phase 4：真实交互、歧义与完整 decision-log

### Goal
证明逐题交互真实发生，并形成唯一、可读、可追踪的 accepted decision 集合。

### Files
talk/grill/decision Skill、decision template、interaction/ambiguity/decision schemas、make-decision/build-spec workflow、coverage validator 和窄测试。

### Tasks
T030 写 interaction RED；T031 实现 talk/grill typed facts；T032 实现 ambiguity ledger；T033 写 decision RED；T034 实现唯一 decision-entry；T035 实现 Markdown + receipt lookup；T036 实现 coverage/omission/correction。

### Verify
无 reply 不推进；动态总数有原因；完整卡和秘密不落盘；decision 正文或一个 appendix 恰好覆盖；D1–D7 原 bytes 不变。

### Knowledge
`decision-entry.v1` 同时保留 `source_type`、exact excerpt、approval status/ref/hash 和用户能读懂的决定含义。

### STOP
需要伪造旧 typed proof、保存秘密、维护第二套 decision 字段或修改旧 decision bytes 时停止。

### Done
独立 `decision-log.md` 可读；receipt 只存 ref/hash/合同事实；下游从 accepted lookup 读取正文和 appendices。

### 风险与回滚
风险是正文与 receipt 漂移；writer 在同一 snapshot 内先最小化、再 hash、再 create-only 写入。失败保留旧 accepted 指针。

## Phase 5：AgentHub 级 plan/tasks 契约与有限 review 文案

### Goal
让 plan/tasks 可直接执行，并消除 build-spec/build-plan 的无限 review 冲突。

### Files
spec-plan/spec-tasks Skill 与模板、plan-task validator/schema、plan-eng-review、build-spec/build-plan Skill、wh-review manifest、窄测试。

### Tasks
T040 写 plan/tasks 删除字段 RED；T041 重写模板；T042 实现 validator/DAG/traceability；T043 强化 engineering lens；T044 修复两个 Stage 的 review 次数文案。

### Verify
Phase 六段、task 13 字段、精确命令、DAG、61 FR/53 AC 双向映射；provider pass 不能覆盖结构错误；普通改字不再次调用 provider。

### Knowledge
结构完整性由确定性 validator 提供事实，工程合理性由现有 lens-only 独立审查。

### STOP
出现第二 review runner、关键词质量评分、默认全量测试或无限 review 文案时停止。

### Done
模板达到本计划和 tasks 的质量；build-spec/build-plan 明确一次初审、普通修改零 provider、重大结构变化最多一次 full。

### 风险与回滚
风险是模板变重；字段只保留已发生真实问题所需内容。回滚模板不影响已接受 artifact。

## Phase 6：review 成本、serious pause 与风险承担

### Goal
五阶段共用 review flow/cost facts，只有有效 serious finding 进入异常处置。

### Files
TaskKernel、review controller/schema、stage-review-disposition、risk schema、五 Stage Skill/handler 和窄测试。

### Tasks
T050 补 review 矩阵 RED；T051 完成五阶段 flow/cost；T052 写 risk RED；T053 实现 serious pause；T054 实现 risk acceptance；T055 验证 omission/risk 分离。

### Verify
普通修改 provider=0；结构 full 最多一次；build-code fresh full 到 pass；unavailable 无 verdict；risk 不改 verdict、不放行结构错误。

### Knowledge
transport、contract、semantic 三种结果分开记录。

### STOP
出现第二计数器、估算成本、跨 snapshot 风险复用或 minor/unavailable 触发暂停时停止。

### Done
五阶段统一行为、cost 可由 event 逐项复算，所有异常路径有明确 own-result。

### 风险与回滚
风险是异常暂停演变为常规 gate；触发器固定为 valid actionable major/blocking。失败时保持旧 flow head。

## Phase 7：同源双视图与 metrics

### Goal
从一份 facts 生成好读总结和完整系统交接。

### Files
stage-completion-facts 模块/schema、五 Stage completion 接线、metrics 测试。

### Tasks
T060 写漂移 RED；T061 实现 facts 和两个 renderer；T062 接线五 Stage；T063 补六类 own-result metrics。

### Verify
共同字段漂移失败；用户视图无内部流水；系统视图 refs 完整；未提供的 duration/token 不估算；collector 失败 warn-only。

### Knowledge
用户消息不是 canonical record；system handoff 不直接倾倒给用户。

### STOP
两个 renderer 各自读取不同来源或 metrics 改变原结果时停止。

### Done
五 Stage completion facts 可复用；用户能看懂目标、效果、边界、风险、下一步和是否需行动。

### 风险与回滚
风险是 renderer 重复业务逻辑；只允许 renderer 格式化，不允许重新计算事实。

## Phase 8：宿主独立、continuation、真实重放与最终验证

### Goal
证明能力可搬运，并在原 task 真实继续和重放处理组 1。

### Files
`tests/stage-content-host-independence.test.mjs`、`tests/stage-content-continuation.test.mjs`、`scripts/validate-stage-replay.mjs`、TaskKernel continuation、stage-runtime CLI、原 `review-foundation-baseline` append-only records、最终 coverage evidence。

### Tasks
T070 写中性宿主测试；T071 实现 continuation CLI；T072 做逐项 coverage；T073 在原 task 创建 continuation；T074 由 WorkflowHub host 在真实 host-visible 会话生产重放；T075 用窄脚本验证同一 run/snapshot 的 replay facts；T076 独立 verify-code。

### Verify
非 WorkflowHub cwd 正例通过；root/task path/cwd 注入失败；旧 bytes/hash 不变；原 task 新 revision/attempt 真实产生；T074 的 producer action 来自 WorkflowHub host 而不是 facts collector；T075 验证 continuation、三轮 talk、grill、decision Markdown、direction/detail review、coverage audit、最终确认、run、snapshot 和顺序全部一致。

### Knowledge
continuation 是新执行，不是重新确认旧文档，也不是修改旧 accepted。

### STOP
找不到原 task、需要改写旧记录、只能写 replay 命令而不能实际运行时停止并报告。

### Done
61/61 FR、53/53 AC、5/5 原问题、21/21 宪法有证据；T074 留下真实 host producer 记录，T075 的 replay validator 通过，用户在 T076 verify-code 边界决定是否接受。

### 风险与回滚
风险是真实重放触发外部影响；重放范围仅处理组 1 的 make-decision，任何不可逆动作仍需独立授权。失败保留新失败 attempt，不删除历史。

## 13. 依赖与并行

```text
Phase 1 → Phase 2
Phase 1 → Phase 3
Phase 2 + Phase 3 → Phase 4
Phase 3 → Phase 5
Phase 2 + Phase 3 → Phase 6
Phase 3 + Phase 6 → Phase 7
Phase 4 + Phase 5 + Phase 6 + Phase 7 → Phase 8
```

- Phase 2 的研究可与 Phase 3 的 RED fixture 准备并行，但宪法审查必须先于 risk GREEN。
- Phase 4 的 interaction/ambiguity 与 Phase 5 的 plan/tasks 可在 Phase 3 后并行。
- Phase 7 在 completion facts schema 固定后可与 Phase 5 后半并行。
- Phase 8 必须等待全部实现和窄测试完成。

## 14. 21 条宪法逐项检查

- [x] **F1**：核心只保留编排/认证；内容逻辑在窄模块和 Skill。
- [x] **F2**：组件只收内容/callback，不收 root、task path、cwd。
- [x] **F3**：物理事实机器采集；只对真实结构入口 fail-loud。
- [x] **F4**：主观质量仍由异源 review + 人裁决。
- [x] **F5**：每个新检查都对应处理组 4 已发生问题。
- [x] **F6**：typed evidence、audit、metrics 进入统一 task 记录。
- [x] **F7**：保留 direction/plan/verify 三边界；serious 只是异常暂停。
- [x] **F8**：复用 audit/review authority，不建平行系统。
- [x] **F9**：每类契约都有正反例和真实非零 RED。
- [x] **F10**：不新增依赖、CI 框架、身份系统或默认全量测试。
- [x] **Q1**：review 质量事实记录；只有有效 serious finding 进入知情处置。
- [x] **Q2**：结构入口、事实采集、人工确认三类分开。
- [x] **Q3**：宪法、工程计划、代码和最终验证使用独立上下文。
- [x] **S1**：复用 wh-review、plan-eng-review 和现有 audit。
- [x] **S2**：迁移 AgentHub 优点时去除 Multica 固定规则。
- [x] **S3**：talk/grill 更新前记录上游版本、日期和替代候选。
- [x] **S4**：新增成功/失败/暂停/override/omission own-result。
- [x] **S5**：模块和测试可由子代理独立执行并返回窄摘要。
- [x] **S6**：只研究 append-only、interaction binding、human acceptance 三类成熟实践。
- [x] **S7**：五 Stage 目录保持一一对应；共用模块不复制到各 Stage。
- [x] **S8**：中性宿主真实 harness，禁止 Multica/Issue/cwd 依赖。

## 15. 61 FR → 53 AC → Step 精确追踪

| FR | AC | Step |
| --- | --- | --- |
| FR-AUD-001 | AC1, AC4, AC29, AC31, AC38 | T022, T023, T024 |
| FR-AUD-002 | AC1, AC3, AC29, AC31 | T020, T021, T023 |
| FR-AUD-003 | AC1, AC2, AC29, AC31 | T022, T023, T024 |
| FR-AUD-004 | AC1, AC3, AC29, AC31 | T022, T023, T024 |
| FR-AUD-005 | AC1, AC2, AC3, AC27, AC29, AC31 | T020, T022, T023 |
| FR-AUD-006 | AC1, AC3, AC29, AC31 | T021, T023, T024 |
| FR-AUD-007 | AC11, AC29, AC31, AC33 | T030, T031 |
| FR-AUD-008 | AC29, AC31, AC34 | T033, T035 |
| FR-AUD-009 | AC27, AC29, AC31, AC35 | T033, T036 |
| FR-AUD-010 | AC29, AC31, AC39, AC44 | T020, T021, T070 |
| FR-INT-001 | AC2, AC29, AC31 | T030, T031 |
| FR-INT-002 | AC5, AC29, AC31 | T030, T031 |
| FR-INT-003 | AC6, AC29, AC31 | T030, T031 |
| FR-INT-004 | AC2, AC7, AC29, AC31 | T030, T031 |
| FR-INT-005 | AC8, AC29, AC31 | T030, T031 |
| FR-INT-006 | AC9, AC29, AC31 | T030, T031 |
| FR-INT-007 | AC10, AC29, AC31, AC35 | T033, T034, T036 |
| FR-INT-008 | AC11, AC29, AC31 | T030, T031 |
| FR-INT-009 | AC29, AC31, AC33 | T030, T031 |
| FR-AMB-001 | AC12, AC29, AC31 | T032 |
| FR-AMB-002 | AC12, AC29, AC31 | T032 |
| FR-AMB-003 | AC13, AC29, AC31 | T032 |
| FR-AMB-004 | AC14, AC29, AC31 | T032, T050 |
| FR-DEC-001 | AC15, AC29, AC31, AC35 | T033, T034, T036 |
| FR-DEC-002 | AC15, AC29, AC31, AC35 | T033, T034, T036 |
| FR-DEC-003 | AC16, AC29, AC31 | T035 |
| FR-DEC-004 | AC16, AC29, AC31 | T035 |
| FR-DEC-005 | AC29, AC31, AC37 | T036 |
| FR-PLN-001 | AC17, AC29, AC31 | T040, T041, T042 |
| FR-PLN-002 | AC18, AC29, AC31 | T040, T041, T042 |
| FR-PLN-003 | AC19, AC29, AC31 | T040, T041, T042 |
| FR-PLN-004 | AC20, AC29, AC31 | T040, T042 |
| FR-PLN-005 | AC21, AC29, AC31 | T042, T043, T044 |
| FR-PLN-006 | AC21, AC29, AC31, AC38 | T043, T044 |
| FR-HOF-001 | AC22, AC29, AC31 | T060, T061, T062 |
| FR-HOF-002 | AC23, AC29, AC31 | T060, T061, T062 |
| FR-HOF-003 | AC22, AC23, AC29, AC31 | T060, T061, T062 |
| FR-HOF-004 | AC29, AC31, AC36, AC52 | T051, T060, T061 |
| FR-REV-001 | AC29, AC31, AC46 | T001, T003, T050, T051 |
| FR-REV-002 | AC29, AC31, AC46 | T001, T003, T050, T051 |
| FR-REV-003 | AC14, AC21, AC29, AC31, AC47 | T001, T003, T044, T050, T051 |
| FR-REV-004 | AC14, AC21, AC29, AC31, AC48 | T001, T003, T044, T050, T051 |
| FR-REV-005 | AC29, AC31, AC49 | T001, T003, T050, T051 |
| FR-REV-006 | AC29, AC31, AC50 | T001, T003, T050, T051 |
| FR-REV-007 | AC29, AC31, AC51 | T001, T003, T050, T051, T071 |
| FR-REV-008 | AC29, AC31, AC47, AC48, AC49, AC52 | T001, T003, T050, T051 |
| FR-REV-009 | AC29, AC31, AC53 | T001, T002, T003 |
| FR-RSK-001 | AC24, AC29, AC30, AC31 | T011, T012, T013, T052, T053 |
| FR-RSK-002 | AC25, AC29, AC30, AC31 | T011, T012, T013, T052, T053 |
| FR-RSK-003 | AC26, AC29, AC30, AC31 | T011, T012, T013, T052, T054 |
| FR-RSK-004 | AC26, AC27, AC29, AC30, AC31 | T011, T012, T013, T052, T054, T055 |
| FR-GOV-001 | AC29, AC31, AC40 | T011, T012, T013 |
| FR-GOV-002 | AC29, AC31, AC40, AC41 | T011, T012, T013, T053 |
| FR-GOV-003 | AC29, AC31, AC40, AC41 | T011, T012, T013, T053 |
| FR-GOV-004 | AC29, AC31, AC42 | T010 |
| FR-GOV-005 | AC29, AC31, AC43 | T063 |
| FR-GOV-006 | AC29, AC31, AC44 | T070 |
| FR-GOV-007 | AC29, AC31, AC42, AC45 | T010 |
| FR-CMP-001 | AC28, AC29, AC31, AC37 | T036, T071, T072 |
| FR-CMP-002 | AC28, AC29, AC31 | T071, T073 |
| FR-CMP-003 | AC29, AC31, AC32 | T073, T074, T075, T076 |

所有 AC1 至 AC53 至少出现在一行映射中；所有 FR 均使用完整 ID，不使用范围缩写。

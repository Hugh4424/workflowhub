# 实现计划：WorkflowHub SDD 文档权威与薄核心重构

- **Input**：`decision-log.md`（sha256 `daccd2175bfa17847aef806a2f62378c7b3fd1f1a9873330ec72c546c938e9eb`）、`spec.md`（sha256 `47eea7e4767b986700317c9f83655acb8ce6938f0b282d730c95c115338f5a8d`）
- **Template version**：`plan-task.v4`

## 材料导航

| 章节 / 材料锚点 | 职责与摘要 | M/S/B/P 读取时机 |
| --- | --- | --- |
| `decision-log.md#决定` | D-001..D-014、T-083、范围和跨卡归属 | M/S：规划开始；B：finding 核对 |
| `spec.md#5-功能需求` | 22 条 FR 对应的行为边界 | M/S：任务切片；P：实现前 |
| `spec.md#11-验收标准` | 22 条 AC、失败条件和证据类型 | M/S：测试蓝图；P：RED/GREEN |
| `plan.md#implementation-order` | producer-before-consumer 顺序 | M：排期；P：阶段开始 |
| `tasks.md#dependency-graph` | 执行卡和唯一执行状态填写区 | P：执行与回读 |

spec-research: skipped — 当前实现锚点、consumer、失败路径、测试约定与回滚边界均已由本仓当前代码和现有 18 份调研确定；本阶段只做本地 current-interface readback，不需要新的外部研究。

simplicity-guard: P0 必要性全部来自已确认 FR/AC；P1/P2 复用或窄改现有技能、workflow、runtime 与 tests；P3 新建机制、技能、stage、public command、store、模板和文件均为空集。

plan-eng-review: 已核对 producer-before-consumer、active/historical 枚举、confirmation 原子写、shared-file 串行、同命令 RED/GREEN、rollback 与真实 consumer；缺口由后续独立 wh-review 再产 findings，不在本行自报 pass。

## Quick Read

- **Goal**：在不新增 stage、public command、持久对象、技能或第五材料的前提下，把未来 authoring 流程收敛为四阶段、build-plan 13 步、单一 phase 工程权威和纯指针索引；同步修复覆盖确认、字段兼容与 interaction aggregate active 链。
- **Non-goals**：来源：D-001、D-013、T-083。不回写母 PRD；不做 provider 工具选型/对比实验；不改前端；不做 T-083 外的广义删除；不修改 CARD-01 蓝图或归档材料；本次 main fast-forward 已完成，后续不执行 commit/push/archive/cleanup。
- **Before**：CARD-01 已在 main 实现普通任务 pre/post topology 与真实 CLI consumer；CARD-02 作者面仍为 build-spec+build-plan、spec/plan/tasks 双写；coverage assert 生产 0 调用；decision-log 字段解析不识别 `- field：`；aggregate 仍有 active writer/input/consumer/completion 依赖，并被 CARD-01 当作非阻断 diagnostic 保真路径。
- **After**：复用且不复制 CARD-01 的 `runtime/task/task-topology.mjs`；post 普通任务仍投影 `make-decision → build-plan → build-code → verify-code`，pre/历史仍可读取旧 build-spec，当前本卡按 pre 五阶段完成 bootstrap；build-plan 13 步写 spec、phase、纯指针索引；K1–K12 逐项有 consumer/oracle；覆盖检查进入 approve 原子路径；24 块 96 字段统一识别；aggregate active 链删除但其“质量失配只作非阻断 diagnostic”语义由现有 direct facts/diagnostic publication 保留，不改名重建 aggregate。
- **Main risk**：误在 CARD-02 新建第二 topology registry，或删除 aggregate 时同时破坏 CARD-01 已验收的失败保真语义；以及 runtime 巨型合同文件内多项变更互相遮蔽。
- **Next step**：先写目标断言 RED，确认失败由旧合同触发，再按 phase 顺序改实现；任何需要新产品选择的差异 STOP 回 decision/spec。

## Technical Context

### Global Constraints

- **Verified facts**：Node `v24.14.0`；ESM；Vitest；认证 task worktree 已由 `cd26676a096ad561bedce0611a81ab55a02b89a2` fast-forward 到 `main=b39f34baca116d036c52fdf42f914810a7ae66e3`，无冲突且 CARD-02 未跟踪材料未被覆盖。CARD-01 接口蓝图现为仓内已提交文件 `docs/contracts/card-01-stage-material-interface.md`，sha256=`7aa596fb7f7e794b6b25af831fcef5aa321de0dbe2576f6c7eb20e2986447e63`；CARD-01 四材料已归档到 `specs/archive/workflowhub-thin-core-card-01-20260919/`。
- **Language / runtime**：JavaScript `.mjs`、JSON、YAML、Markdown；公共 CLI 仍只允许 doctor/status/run/review/verify/confirm/authorize 七类。
- **Primary dependencies**：现有 TaskKernel、stage handlers/content contracts、wh-review broker、skill bundle/catalog；全部复用，不引入新包。
- **Storage / state**：四材料在认证 worktree；task store 只放 `task.json`、`facts.jsonl`、`quality/`；`index.json` 已退役，不恢复。
- **Testing**：只跑受影响 Vitest 文件；RED 必须由目标断言失败；禁止全量 `npm test`、`test:safe`、无范围 vitest。
- **Target environment**：本仓 CLI 与 portable skill bundle；历史已发布 build-spec 记录继续只读。
- **Scale / scope**：4 个作者模板、2 个 workflow package、约 15 个 runtime/CLI consumer、CARD-01 focused regression 与约 20 个 CARD-02 针对性测试文件；不跨仓写入。
- **Unresolved facts**：真实多 phase/luna E2E 与 review 对比实验分别由 CARD-10/CARD-05；make-decision confirmation 已发布，public spec-analyze publication unavailable，后者保留质量事实。

### CARD-01 bootstrap preflight

- build-code 开始 T001 前必须重新读取仓内已提交的 `docs/contracts/card-01-stage-material-interface.md` 与 `runtime/task/task-topology.mjs`；若 contract/hash 改变且未有经审查的新版本，或实现不再同时声明 pre 五阶段/post 四阶段 cohort，则 STOP 回 build-plan。
- 本卡不得修改 CARD-01 contract、topology owner 或归档材料。CARD-02 只消费其 post 普通任务四阶段投影；正式阶段总集合保留旧 build-spec 供 pre cohort/历史读取。
- activation 只对新建 post cohort 任务生效；当前 card-02 始终按 pre 五阶段完成 build-code/verify-code，不允许用自己的目标拓扑重解释自己。

## Code Anchors

- **Verified anchors**：
  - `runtime/stage/stage-content-contracts.mjs`：`validateSpecContentProfile`、`validatePlanTaskContract`、`buildDecisionCoverageAudit`、`assertDecisionCoverageReadyForConfirmation`、`analyzeDecisionOutline`、interaction aggregate validators。
  - `runtime/stage/stage-handlers.mjs`：active HANDLERS、`buildSpecUiFacts`、`interactionAggregateFacts`、`buildDirectionReviewInput`、`safeReviewFacts` consumer。
  - `runtime/task/task-kernel-implementation.mjs`：`publishHumanConfirmation`、interaction publication writer。
  - `runtime/task/task-topology.mjs`：`TOPOLOGY_PROJECTIONS`、`readActivationCohort`、`resolveTopology`、`validateStageForTopology`；CARD-01 唯一 topology owner，本卡只读复用。
  - `tools/cli/stage-runtime.mjs`：`resolveTaskTopologyRoute` 与 public stage/action/input allowlist；CARD-02 只改材料/handler consumer，不复制 topology。
  - `tools/cli/task-bootstrap.mjs`：activation cohort 三字段冻结；本卡只读。
  - `tools/cli/check-decision-log-chain.mjs`：decision block 字段解析。
  - `skills/wh-review/scripts/review-materials.mjs`：build-plan packet/projection。
  - `runtime/evidence/canonical-receipt-writer.mjs`、`runtime/review/review-record-route.mjs`、`skills/wh-review/scripts/simple-review-runner.mjs`：CARD-01 已提交的 frozen material identity 与 authenticated review seam；本计划严格只读回归，不纳入 CARD-02 写集。
- **Existing interfaces**：`stage-input-packet.v1`、`spec-content.v3`、`plan-task.v4`、`human-confirmation.v3`、`quality-fact.v1`、`wh-review-result.v1`；旧 schema 只读兼容。
- **Read now**：两个 workflow 的 `steps.json`/`skill-deps.yaml`、三作者 skill/template、stage material/profile/handler 当前 contract。
- **Must read before task**：每个 task 列出的 exact test 与被改 symbol 邻接代码；历史 schema 仅在拆 active/historical 枚举前读取。
- **Context mode**：Full — 变更跨 authoring、runtime、review、confirmation，且删除面需要反向 consumer census。

### Reuse → Extend → New

| Capability | Decision | Existing anchor | Reason / removal condition |
| --- | --- | --- | --- |
| decision/spec/phase/index authoring | extend | 现有 decision-log/spec-specify/spec-plan/spec-tasks | 原位改职责；不新建模板/技能 |
| 13 步规划链 | extend | `workflows/build-plan/` | 吸收 build-spec；post cohort 不再投影 build-spec，pre/history 保留读取 |
| review 与 analyzer | extend | wh-review/spec-analyze | 单 packet、单 consumer、单 final analyze |
| coverage confirmation | extend | 现有 coverage audit + confirmation writer | 接入已有原子写边界，不造 gate/store |
| field parser | extend | `checkDecisionLogChain` | 同一 parser 兼容 list prefix/fullwidth colon |
| aggregate 删除 | reuse deletion seam | active registries/writer/consumer inventory + CARD-01 diagnostic publication | 删除 active aggregate 路径；legacy reader 保留；失配继续作为非阻断 direct diagnostic 发布 |
| 无上限 review attachment transport | extend | `review-materials`、`simple-review-runner`、`stage-runtime`、runtime/skill bounds | 删除本地 byte cap、截断和预派发大小阻塞；完整 manifest + SHA 交给 attachment transport；外部 provider 限制只记录为已派发事实 |
| 新机制 | N/A | N/A | P0–P2 已覆盖，P3 新建为空集 |

## Solution Design

### Overview

先改作者面和 workflow 声明：decision-log/spec/phase/索引仍复用四个现有 skill/template 路径，build-plan 吸收 spec authoring、Clarify、UI conditional、testing blueprint、routing、merged review、final analyze 和 reflection，形成 13 步。`spec-tasks` 不再写第二份工程正文，只投影纯指针索引；旧 build-spec 包保留给 pre cohort/历史读取，post cohort 不再投影它。

再改 runtime consumer：复用 CARD-01 已提交的 topology 投影，不修改 `task-topology.mjs` owner；build-plan handler 同时消费 spec、phase/index、测试蓝图与一次 review；review-materials/spec-analyze 改为单写材料模型；不保留永久双写 bridge，也不在 stage runtime 建第二 topology registry。

最后在同一 runtime phase 内先把逐条 coverage audit 接到 `publishHumanConfirmation` 同一原子事务：confirmation 始终记录真实用户选择，coverage passed/incomplete 作为独立质量事实发布，不作推进 gate；再删 interaction aggregate active writer/input/consumer/completion 依赖。CARD-01 已实现的 stale/malformed/unbound 失配不得消失：改由现有 direct confirmation/question/material facts 进入既有 machine diagnostic publication，不创建 aggregate receipt、别名或第二状态面。旧 aggregate schema/reader 保留只读。

### 28 步 → 13 步权威合并账

| # | 新 step | 旧来源 | owner/consumer | Oracle |
| --- | --- | --- | --- | --- |
| 1 | read-current-materials | build-plan P1 + build-spec BS1 | build-plan 主会话 | 当前 decision/spec/source 可读且身份一致 |
| 2 | conditional-spec-research | P2 + BS2 | spec-research | executed findings 或 skipped/unavailable 有原因 |
| 3 | spec-clarify | BS3 | spec-clarify / build-plan | trigger=false+0，或真实 ask→wait→reply→resume |
| 4 | spec-specify | BS4 + freeze BS10 | spec-specify | spec 内容合同、来源、AC、八态通过 |
| 5 | conditional-ui-readiness | BS7+BS8；render 既有依赖 | UI 三技能 / build-plan | non_ui=N/A；ui 时 init/readiness/preview 齐全 |
| 6 | spec-plan | P4 + P8 | spec-plan（吸收 spec-tasks 投影） | 单一 phase 权威、纯指针索引、精确边界 |
| 7 | testing-system-blueprint | P3 | testing-system-blueprint | 风险/场景/命令/oracle/证据/限制齐全 |
| 8 | test-routing-advisor | P7 | test-routing-advisor | simple/feature/fullstack 单 JSON 判类 |
| 9 | merged-review | BS11+P9；BS5/6/9、P5/6 为 lens | wh-review 唯一 consumer | 一次完整 packet；provider/provenance/findings 可回读 |
| 10 | main-agent-disposes-findings | BS12+P10 | build-plan 主会话 | 每 finding 终态+owner/证据；不重派审查 |
| 11 | final-spec-analyze | BS13+P11 | spec-analyze | 单次五输入 report-only 一致性结果 |
| 12 | publish-result-and-confirm | BS14+P12 | build-plan 主会话 + confirmation/handoff | 展示后真实回复与 current confirmation |
| 13 | stage-reflection | BS15+P13 | stage-reflection/handoff consumer | 六区块、身份、遗漏逐项披露 |

计数：保留 11、合并 11、改造 6、删除旧入口 0 个质量语义；28→13，净新增 step=0。这里的“删除 0”指质量语义不删；旧双写载体与 aggregate active 控制面按各自删除合同处理。

### K1–K12 逐条承接

| K | Consumer | 保留/改变语义 | 可执行 oracle | Owner | 删除条件 |
| --- | --- | --- | --- | --- | --- |
| K1 | spec-specify + spec-clarify | 保留；无 source 锚点即失败 | source→FR/AC coverage + 未溯源 RED | build-plan | 等价翻译机制经审查替代 |
| K2 | spec-specify + coverage/OI | 改为 R→FR→AC→phase→oracle | 逐条 disposition/强度 + OI↔D | card-02/CARD-07 | coverage 机制经审查替代 |
| K3 | spec-specify/附件 A | 保留四段式，加入 V0 黑名单 | AC 合同 validator + merged review | build-plan | 等价可判定格式替代 |
| K4 | spec 附件 A/状态矩阵 | 保留八态 | 八态逐项 fixture | build-plan | 等价覆盖判据替代 |
| K5 | spec-clarify | 保留唯一 Clarify 与十维度 | trigger=false+0 或真实 lifecycle | build-plan/CARD-07 | CARD-07 整体替代交互平台 |
| K6 | wh-review + step10 | 改为一次审查、三态目标处置 | canonical attempt/result + disposition | CARD-05/CARD-10 | 替代审查机制经审查上线 |
| K7 | spec-analyze | 改为一次五输入、切片层 | strict profile consistent 或真实 unavailable | build-plan | 等价一致性检查替代 |
| K8 | simplicity/CEO/eng/design lenses | 改为同 packet lens、单 safeReviewFacts | consumer count=1 + findings stream | CARD-05 | lens 组被替代评审取代 |
| K9 | spec-plan + phase contract | 保留 RED/GREEN、精确边界 | 同 gate_cmd/oracle，RED 目标失败 | build-plan | 测试变更机制经审查替代 |
| K10 | blueprint + routing advisor | 保留 | blueprint fields + routing JSON | build-plan | 等价测试路由替代 |
| K11 | stage-reflection + inline disclosure | 保留；部分覆盖状态显式 | bootstrap 分别记录旧 build-spec 15 步与旧 build-plan 13 步遗漏；post 目标只记录合并后 build-plan 13 步遗漏 + v2 reflection | CARD-07 | 独立技能由真实 consumer 承接 |
| K12 | structured question + confirm | 保留真实用户回复；部分覆盖状态显式 | human-confirmation.v3 current readback | 各交互 stage 主会话 | 经审查替代确认机制上线 |

K1–K10=完全覆盖；K11/K12=部分覆盖；无承接者=0。每行五字段非空只是必要条件，T010/T011 仍检查 consumer 行为与延期事实，CARD-10 负责真实任务语义等价复核。

### 8 个现有技能改造

| Skill | 改造 | Consumer | Owner | 删除条件 |
| --- | --- | --- | --- | --- |
| decision-log | 四类模板中的方向权威、OI/source 原文与字段语法 | build-plan step1/4 | build-plan | 被等价 direction writer 替代 |
| spec-specify | 写未来 spec、四段式/黑名单/freeze | build-plan step4 | build-plan | 被等价 spec writer 替代 |
| spec-clarify | owner 移到 build-plan，保留唯一交互 | step3 | build-plan/CARD-07 | CARD-07 替代交互平台 |
| spec-plan | 单一 phase writer，吸收 task 投影 | step6 | build-plan | 被等价 phase writer 替代 |
| spec-tasks | 改为纯指针索引 renderer，不写第二正文 | step6 | build-plan | 索引被 phase 原生视图替代 |
| spec-analyze | 单次五输入/切片层检查 | step11 | build-plan | 等价 analyzer 替代 |
| wh-review | 一次 spec+phase 合并 packet/lenses | step9 | CARD-05 | 替代 review 上线 |
| stage-reflection | 吸收逐项遗漏披露，生成 current handoff | step13 | CARD-07 | 经审查 reflection/handoff 替代 |

计数口径：恰好 8 个被改造 skill=`decision-log`、`spec-specify`、`spec-clarify`、`spec-plan`、`spec-tasks`、`spec-analyze`、`wh-review`、`stage-reflection`。`testing-system-blueprint` 与 `test-routing-advisor` 作为 step7/8 现状依赖原样复用，不计改造、不改其文件。

### Module responsibilities

#### Portable authoring packages

- **Responsibility**：定义文档/phase/index 形态、13 步顺序和可搬运技能职责。
- **Consumes**：decision/spec 和 frozen packet。
- **Produces**：一个 spec、一个 phase 工程权威、一个纯指针索引。
- **Must not decide**：产品方向、执行事实、provider pass。

#### Stage runtime

- **Responsibility**：消费 CARD-01 topology 投影，认证当前材料、handler consumers、confirmation 原子写与质量 publication；active 顺序的唯一 owner 是 `runtime/task/task-topology.mjs`。
- **Consumes**：四材料与正式 receipt。
- **Produces**：现有 facts/evidence；无新 store。
- **Must not decide**：review finding 的产品裁决或工作许可证。

#### Review/analyze seam

- **Responsibility**：冻结一次完整材料、异源 findings、最终 report-only 语义检查。
- **Consumes**：raw requirement、spec、phase/index。
- **Produces**：canonical attempt/result 与现有 quality fact。
- **Must not decide**：阶段 pass、风险接受、不可逆授权。

### Interfaces, data, and lifecycle

- **Interfaces / schemas**：current build-plan packet 改为 raw requirement + decision + spec + phase/index；历史 build-spec enum/schema 只读。`human-confirmation.v3` 不新增字段。
- **Data flow / state**：make-decision 确认 → build-plan 13 步 → current spec/phase/index → build-code/verify-code；失败保留 unknown/unavailable/incomplete。
- **API contract**：N/A — 无 HTTP/API；仅现有 CLI 行为，删除 `interaction_aggregate` input 后应 fail-loud 为 unknown field。
- **UI / external code**：N/A — `non_ui`，不改 Design.md/Experience.md/前端。
- **Fail-loud behavior**：coverage checker 对缺 disposition/source/强度/owner/排除理由的 fixture 非零并列 ID/位置；正式确认路径仍写真实用户 confirmation，同时原子发布 `coverage=incomplete` 质量事实，不把质量检查变成推进 gate；旧 aggregate input 被拒绝；完整 review 不可送达时 truthful unavailable。

## UI Delivery Contract (仅 UI phase/task 使用)

N/A — decision-log 三源已结构化得出 `non_ui`；无页面、组件、浏览器、截图或设计确认。

## File Boundary

### NEW

- N/A — 四模板、测试与 runtime 均复用现有文件；fixture 嵌入现有 targeted tests，净新增文件为 0。

### MODIFY

- `skills/decision-log/SKILL.md`
- `skills/decision-log/templates/decision-log-template.md`
- `skills/decision-log/skill-bundle.json`
- `skills/spec-specify/SKILL.md`
- `skills/spec-specify/templates/spec-template.md`
- `skills/spec-specify/skill-bundle.json`
- `skills/spec-plan/SKILL.md`
- `skills/spec-plan/templates/plan-template.md`
- `skills/spec-plan/skill-bundle.json`
- `skills/spec-tasks/SKILL.md`
- `skills/spec-tasks/templates/tasks-template.md`
- `skills/spec-tasks/skill-bundle.json`
- `skills/spec-clarify/SKILL.md`
- `skills/stage-reflection/SKILL.md`
- `skills/spec-analyze/SKILL.md`
- `skills/spec-analyze/skill-bundle.json`
- `skills/wh-review/contracts/build-plan.md`
- `skills/wh-review/scripts/review-materials.mjs`
- `skills/wh-review/skill-bundle.json`
- `skills/catalog.yaml`
- `workflows/build-plan/SKILL.md`
- `workflows/build-plan/steps.json`
- `workflows/build-plan/skill-deps.yaml`
- `workflows/build-spec/SKILL.md`
- `workflows/build-spec/steps.json`
- `workflows/build-spec/skill-deps.yaml`
- `config/workflowhub.yaml`
- `runtime/stage/stage-handoff.mjs`
- `runtime/stage/completion-predicates.mjs`
- `runtime/stage/stage-content-contracts.mjs`
- `runtime/stage/stage-handlers.mjs`
- `runtime/stage/stage-runner.mjs`
- `runtime/stage/stage-skill-runtime.mjs`
- `runtime/review/stage-materials.json`
- `runtime/task/task-kernel-implementation.mjs`
- `runtime/task/task-store.mjs`
- `runtime/task/task-handle.mjs`
- `tools/cli/stage-runtime.mjs`
- `tools/cli/check-decision-log-chain.mjs`
- `tests/decision-log-content-contract.test.mjs`
- `tests/stage-review-cost-policy.test.mjs`
- `tests/stage-decision-contract.test.mjs`
- `tests/stage-interaction-contract.test.mjs`
- `tests/contract/spec-stage-artifact-closure.test.mjs`
- `tests/contract/material-producer-consumer-roundtrip.test.mjs`
- `tests/contract/phase-quality-handoff.test.mjs`
- `tests/contract/filled-plan-task-production.test.mjs`
- `tests/contract/stage-order-and-host-interaction.test.mjs`
- `tests/contract/stage-routing-and-concrete-testing.test.mjs`
- `tests/contract/spec-analyze-completeness.test.mjs`
- `tests/contract/review-materials-contract.test.mjs`
- `tests/contract/ui-stage-integration.test.mjs`
- `tests/contract/human-confirmation-v3.test.mjs`
- `tests/contract/decision-log-chain-warnings.test.mjs`
- `tests/contract/make-decision-interaction-publication.test.mjs`
- `tests/contract/decision-convergence-depth.test.mjs`
- `tests/contract/zero-machine-gate-advancement.test.mjs`
- `tests/acceptance/card-01-current.mjs`
- `tests/integration/vnext-official-stage-run.test.mjs`

### DO NOT TOUCH

- `specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md` — 母 PRD 只读。
- `docs/contracts/card-01-stage-material-interface.md`、`runtime/task/task-topology.mjs`、`tools/cli/task-bootstrap.mjs` — CARD-01 已提交接口与 owner 只读；禁止复制 registry。
- `specs/archive/workflowhub-thin-core-card-01-20260919/**` — CARD-01 归档材料不重写。
- `runtime/schemas/interaction-completion.v1.json` — 旧 aggregate 记录只读兼容。
- `specs/archive/` — 历史材料不重写。
- 现有测试的目标断言与评分逻辑 — build-code 未经显式变更请求不得放宽；CARD-01 aggregate-specific assertions 仅可在本卡经审查的 replacement contract 下迁移为 direct diagnostic assertions，语义不得删除。

### 删除证明

- `FR-FLOW-003 / AC-FLOW-003`：T001/T002 以 `ORACLE-AUTHORING-001` 证明目标 post workflow 只产一个 phase 工程正文与纯指针索引；active plan/tasks 等价 writer、reader、相等性协议与校验路径反向扫描为 0。旧 pre/history 材料只读保留，不参与 active writer。
- `FR-CLEAN-001 / AC-CLEAN-001`：T007/T008 以 `ORACLE-AGGREGATE-001` 证明 public aggregate input、active writer、receipt key、handler/review/completion/questions-only consumer 为 0；`runtime/schemas/interaction-completion.v1.json` 与旧 task bytes 只读保留，direct diagnostic 不重建 aggregate receipt/control plane。
- **失败条件**：任一目标仍有 active producer/consumer/validator、历史 reader 被物理删除、或用新名字/新 store 重建同类控制面，则删除证明失败并回 owning task。

## Technical Decisions

### DEC-001 — 原位复用四个作者技能

- **Problem**：目标要四模板但禁止新技能/模板。
- **Options**：新建；永久兼容层；原位改造现有 decision-log/spec-specify/spec-plan/spec-tasks。
- **Selected**：extend — 原位改造，spec-tasks 转纯指针索引职责。
- **Reason**：P1/P2 已覆盖，净新增 0，真实 consumer 已存在。
- **Consequence / risk**：旧名称可能误导；通过职责文档、catalog 和 active deps 同步消除。
- **Fallback**：回滚当前 phase 变更，保留原技能字节与材料。
- **F10 disposition**：keep。

### DEC-002 — pre/post cohort 与历史读取分离

- **Problem**：post 普通任务需要四阶段，但当前 card-02 和旧任务必须继续按 pre 五阶段读取。
- **Options**：全删 build-spec enum；所有任务永远五阶段；复用 CARD-01 cohort 映射，post 投影四阶段、pre/history 保留五阶段读取。
- **Selected**：reuse — 直接消费 main 已提交的 `runtime/task/task-topology.mjs` 与 `resolveTaskTopologyRoute`，不造 bootstrap mode、第二 registry 或 compatibility writer。
- **Reason**：满足新任务四阶段目标、CARD-01 蓝图和本卡 bootstrap 边界。
- **Consequence / risk**：CARD-02 若再次维护 stage 顺序，会与 CARD-01 owner 漂移。
- **Fallback**：回滚 CARD-02 material/review consumer 改动；不改 topology owner 或历史 schema bytes。
- **F10 disposition**：keep。

### DEC-003 — confirmation 原子边界接 coverage

- **Problem**：coverage assert 生产 0 调用，确认可在逐条缺失时写入。
- **Options**：handler 后检查；新增 gate/store；在 `publishHumanConfirmation` 同一锁/事务内运行 audit，并把 passed/incomplete 质量事实与真实 confirmation 一起发布。
- **Selected**：extend — 第三项；checker 负例仍 fail-loud，runtime quality incomplete 不阻断 confirmation。
- **Reason**：唯一真实 consumer，无第二状态面，同时保持“质量事实不是推进许可证”。
- **Consequence / risk**：raw requirement parser 必须从认证材料派生，不能信 caller 自报。
- **Fallback**：回滚接线但保留 parser/测试事实；不得留下 confirmation/quality 半记录。
- **F10 disposition**：keep。

### DEC-004 — aggregate 只删 active 链并保留 direct diagnostic 语义

- **Problem**：内容寻址 aggregate 是不合理 active 依赖，但旧记录仍需读取；CARD-01 main 又把 stale/malformed aggregate 降为非阻断 diagnostic，删除 aggregate 时不能删除失败保真。
- **Options**：全删 schema/reader；改名重建；删 active aggregate writer/input/consumer/completion并保留 legacy reader，同时用现有 direct question/confirmation/material facts 发布同级非阻断 diagnostic。
- **Selected**：reuse deletion seam — 第三项，不新增 store/public input/receipt alias。
- **Reason**：同时满足 T-083、CARD-01 已验收的“失配可见但不作工作许可证”和历史可审计性。
- **Consequence / risk**：删除面横跨 runtime/tools/workflow，需反向扫描；replacement 若再次聚合即构成违规第二控制面。
- **Fallback**：逐提交回滚当前 active 删除；旧记录始终不写新字节。
- **F10 disposition**：keep。

## Test Strategy

所有命令由 build-code 执行；本阶段只设计。每个 RED/GREEN 对使用同一命令与 oracle。

| Target | Task | Role | gate_cmd / expected_exit | Oracle / evidence_path |
| --- | --- | --- | --- | --- |
| FR-DOC/TEST/FLOW | T001/T002 | RED/GREEN | `npx vitest run tests/decision-log-content-contract.test.mjs tests/contract/spec-stage-artifact-closure.test.mjs tests/contract/material-producer-consumer-roundtrip.test.mjs tests/stage-review-cost-policy.test.mjs` / nonzero→0 | `ORACLE-AUTHORING-001` / `quality/tests/card02-authoring.json` |
| FR-FLOW/REVIEW | T003/T004 | RED/GREEN | T003/T004 同一 8-file command / nonzero→0 | `ORACLE-RUNTIME-001`：single writer、finding disposition+owner/deadline、changed-cause retry、原始分母/anchor/elapsed 三指标、四项 self-check、CARD-01 topology 绿色前置 / `quality/tests/card02-runtime.json` |
| FR-COVER | T005/T006 | RED/GREEN | `npx vitest run tests/stage-decision-contract.test.mjs tests/contract/human-confirmation-v3.test.mjs tests/contract/decision-log-chain-warnings.test.mjs` / nonzero→0 | `ORACLE-COVERAGE-001` / `quality/tests/card02-coverage.json` |
| FR-AUTH-001 | T005/T006 | RED/GREEN | 同 T005/T006 command / nonzero→0 | `ORACLE-AUTHORITY-001` / `quality/tests/card02-authority.json`（ID 唯一性报告 + 四类事实抽样记录） |
| FR-CLEAN | T007/T008 | RED/GREEN | `node tests/acceptance/card-01-current.mjs`（runner 显式包含 4 个 CARD-02 aggregate/direct-diagnostic tests）/ nonzero→0 | `ORACLE-AGGREGATE-001` / `quality/tests/card02-aggregate-delete.json` |
| FR-TEST-003/004 | T009/T010 | RED/GREEN | `npx vitest run tests/integration/vnext-official-stage-run.test.mjs tests/contract/filled-plan-task-production.test.mjs tests/contract/ui-stage-integration.test.mjs` / nonzero→0 | `ORACLE-FIXTURE-001` / `quality/tests/card02-fixture-smoke.json` |
| 全部当前状态 | T011 | FINAL | targeted union command / 0 | `ORACLE-CARD02-FINAL` / `quality/tests/card02-final-recheck.json` + `quality/tests/card02-acceptance-matrix.json` |

风险维度：行为结果、材料状态/数据流、错误/取消/恢复、确认权限、原子写、跨模块 seam、来源/provenance；UI/浏览器/a11y 不适用。局部作者合同和 coverage parser 可用 `feature`；整体路线为 `fullstack`，因为 active stage protocol、CLI confirmation、runtime consumer 与 review packet 形成跨协议链。

test-routing-advisor：整体路线=`fullstack`；理由=改动跨 skills/workflows/config/runtime/tools/tests，并改变 cohort stage protocol、CLI confirmation、runtime consumer 与 review packet；P1 作者合同与 T005/T006 可用 feature 级局部命令，P2 protocol seam 与 T011 aggregate 使用 fullstack-slice-testing。

## Rollback and Recovery

- **Global recovery rule**：只回滚当前实现 phase；四材料、review 原件、失败事实和旧 schema 保留。
- **Irreversible boundaries**：commit/push/merge/archive/cleanup 均未授权，不执行。
- **Recovery owner**：build-code 主会话；命令损坏先恢复该 task 最小 diff，再重新运行同一 targeted command，不跑全量掩盖。

### Engineering Risk Handoff

- **PLAN-RISK-001**：active/historical enum 混用
  - **Affected IDs**：FR-FLOW-001..003、T003/T004
  - **Trigger**：旧 build-spec record 无法读取或 active status 仍列五阶段
  - **Consequence**：历史破坏或新拓扑未生效
  - **Mitigation or STOP**：先列 reader/writer consumers；历史 schema 不改；任一混用 STOP
  - **Handling Stage**：build-code
  - **Verification**：stage order + historical read tests

- **PLAN-RISK-002**：巨型 runtime 文件多任务重叠
  - **Affected IDs**：FR-COVER-001、FR-CLEAN-001、T003..T008
  - **Trigger**：并行修改同一 symbol 邻区
  - **Consequence**：接线/删除互相覆盖
  - **Mitigation or STOP**：P2 全部串行；先 coverage 后 aggregate；每对完成即跑 targeted test
  - **Handling Stage**：build-code
  - **Verification**：依赖图与 git diff symbol census

- **PLAN-RISK-003**：review/analyze public publication 缺口
  - **Affected IDs**：FR-REVIEW-001..003、AC-REVIEW-001..003
  - **Trigger**：现有 public route 仍不能发布 current spec-analyze
  - **Consequence**：内容可验证但 canonical quality 保持 unavailable
  - **Mitigation or STOP**：只使用本卡已批准的现有 writer 接线；不得新增 public command/store；无法在边界内完成则 truthful unavailable
  - **Handling Stage**：build-code / verify-code
  - **Verification**：formal run readback

- **PLAN-RISK-004**：CARD-01 archive 后 acceptance setup 漂移
  - **Affected IDs**：FR-CLEAN-001、AC-CLEAN-001、T007/T008
  - **Trigger**：`zero-machine-gate-advancement` 仍读取已迁移的非归档 plan 路径
  - **Consequence**：当前 baseline 为 22/23，ENOENT 可伪装成目标 RED
  - **Mitigation or STOP**：T007 先单独修正只读 archive 路径并验证原断言通过，再加入目标 RED；若仍是 setup failure 则 STOP
  - **Handling Stage**：build-code
  - **Verification**：baseline failure 原件 + repaired-harness green + target RED 三段证据

## Implementation Order

1. P1/T001→T002：T001 的 first action 执行 CARD-01 committed preflight，再冻结四模板和 13 步作者合同；它们是 runtime consumer 的输入。
2. P2/T003→T004：把 CARD-01 topology 当作只读绿色前置，只修改 build-plan material/handler/review/analyzer consumer；pre/post/history 回归必须持续为绿。
3. P2/T005→T006：在 confirmation 原子事务内计算并发布 coverage 质量事实；即使 incomplete 也保留真实 confirmation，不把检查变成 gate。
4. P2/T007→T008：先修 CARD-01 archive-path test harness 并隔离目标 RED，再删除 aggregate active 链和迁移 direct diagnostic 语义。
5. P3/T009→T010：双 phase fixture RED/GREEN；T011 只读运行当前快照 bounded aggregate并发布逐 AC 状态矩阵。

## Dependencies and Parallelism

- **Dependencies**：T001（first action= CARD-01 committed preflight）→T002→T003→T004→T005→T006→T007→T008→T009→T010→T011；串行原因是接口蓝图、producer/consumer 与共享 runtime files。
- **Parallel work**：N/A — P2 多个行为共同修改 stage-content/handlers/task-kernel，文件所有权重叠；不并行。
- **External dependencies**：CARD-01 已提交 contract/topology/acceptance（path/hash/commit 见 Technical Context）是只读前置；review provider 仅产生质量事实，实施/测试不依赖 provider 在线。CARD-03/05/07/10 的延期项不在本卡 build-code 开工。

## Requirement and Verification Traceability

| Source / decision | FR | AC | Phase / Task | Depends on | Exact files | Command / oracle |
| --- | --- | --- | --- | --- | --- | --- |
| R-001/R-002 D-002/D-011 | FR-DOC-001..005、FR-OI-001 | AC-DOC-001..005、AC-OI-001 | P1/T001-T002 | none | authoring skills/templates | `ORACLE-AUTHORING-001` |
| R-003 D-003/D-006 | FR-TEST-001..004 | AC-TEST-001..004 | P1/T001-T002、P3/T009-T010 | T002/T008 | templates/tests | `ORACLE-AUTHORING-001` + `ORACLE-FIXTURE-001` |
| R-004 D-007 | FR-REVIEW-001..003 | AC-REVIEW-001..003 | P2/T003-T004 | T002 | review/analyze/runtime files | `ORACLE-RUNTIME-001` |
| R-005 D-008 | FR-AUTH-001..002 | AC-AUTH-001..002 | P1/T001-T002、P2/T005-T006 | T004 | templates + coverage runtime | `ORACLE-COVERAGE-001` |
| R-006 D-009 | FR-FLOW-001..003 | AC-FLOW-001..003 | P1/T001-T002、P2/T003-T004 | T002 | workflows + material/review consumer；CARD-01 topology read-only | `ORACLE-RUNTIME-001` |
| R-007 D-010 | FR-COVER-001..002 | AC-COVER-001..002 | P2/T005-T006 | T004 | confirmation/parser/tests | `ORACLE-COVERAGE-001` |
| R-008 T-083 | FR-CLEAN-001 | AC-CLEAN-001 | P2/T007-T008 | T006 | aggregate active chain/tests | `ORACLE-AGGREGATE-001` |
| R-009 D-014 | FR-HANDOFF-001 | AC-HANDOFF-001 | P3/T009-T011 | T008 | integration fixture/handoff facts | `ORACLE-FIXTURE-001` + `ORACLE-CARD02-FINAL` |

## Governance Synchronization Matrix

| Governance surface | Actual files | Change / no change | Task IDs | Reason |
| --- | --- | --- | --- | --- |
| 四材料/模板职责 | decision-log/spec-plan/spec-tasks/spec-specify skill+template | change | T001/T002 | 单一权威与未来三材料形态 |
| cohort workflow | build-plan/build-spec workflow package | change | T001/T002 | 作者链合并；CARD-01 topology owner 不改 |
| CARD-01 topology | `docs/contracts/...`、`runtime/task/task-topology.mjs`、`tools/cli/task-bootstrap.mjs` | reuse/read-only regression | T003/T004/T011 | main 已实现 post 四阶段与 pre 五阶段 |
| runtime consumer | stage/content/handler/runner/task/CLI | change | T003-T008 | material/review/coverage/diagnostic consumer 同步，不复制 topology |
| review/analyze | wh-review/spec-analyze | change | T003/T004 | 一次 packet、一次 consumer、一次 analyze |
| 宪法 | `CONSTITUTION.md`、`constitution-checklist.md` | no change | T011 | 本卡实现现有条款，不改宪法 |
| 母 PRD/CARD-01 | DO NOT TOUCH paths | no change | 全部 | 用户已确认只读 |

## Constitution Check

- **Constitution binding**：`{"artifact_kind":"constitution","ref":"constitution-checklist.md","hash":"91c72a0db7a77da84369d0aada56105612c21def13761f6aa7db387b8922f434","id":"CONSTITUTION","version":"1.9.0","clause_count":22}`
- **F1**：重活留技能，runtime 只认证/调度；post cohort 不投影 build-spec，pre/history 不重复实现。
- **F2**：spec/phase/index、review、confirmation 走窄合同。
- **F3**：四材料与 publication 分离；写前 fail-loud。
- **F4**：异源 review 已有；findings 不作 gate，同 task 修复。
- **F5**：删除 aggregate gate；不新增 gate。
- **F6**：task store 仍统一外置；不恢复 index。
- **F7**：三处正常确认；non_ui 不加 UI 确认；不可逆动作独立授权。
- **F8**：原位复用、无永久 bridge。
- **F9**：RED 必须目标断言；unknown/unavailable 保留。
- **F10**：P0–P2 覆盖，新增机制为空。
- **F11**：覆盖接线有唯一 owner/consumer/test；不把辅助质量缺失升级为工作阻塞。
- **Q1**：review/test/evidence 缺失限制完成宣称，不冻结同 task 修复。
- **Q2**：工作资格、publication、完成判据分离。
- **Q3**：独立 review 与用户确认分别保留。
- **S1**：复用当前技能/依赖。
- **S2**：项目化改造不破 portability。
- **S3**：bundle/catalog 同步并就地检查。
- **S4**：审查能力三指标、模板/coverage oracle 纳入现有记录。
- **S5**：技能输入冻结 packet，子代理可独立消费。
- **S6**：继承 18 份外部/内部调研结论。
- **S7**：post 四阶段仍一阶段一 workflow；旧 build-spec 供 pre cohort/历史读取。
- **S8**：skills 不绑定宿主路径或 transcript。

## Phase P1 — 作者合同与 13 步 workflow

### Goal

四模板、K1–K12、13 步 build-plan 和 bundle/catalog 在同一作者面一致；不改 runtime active consumer。

### Files

- **NEW**：N/A — 净新增 0。
- **MODIFY**：`skills/decision-log/SKILL.md`、`skills/decision-log/templates/decision-log-template.md`、`skills/decision-log/skill-bundle.json`、`skills/spec-specify/SKILL.md`、`skills/spec-specify/templates/spec-template.md`、`skills/spec-specify/skill-bundle.json`、`skills/spec-plan/SKILL.md`、`skills/spec-plan/templates/plan-template.md`、`skills/spec-plan/skill-bundle.json`、`skills/spec-tasks/SKILL.md`、`skills/spec-tasks/templates/tasks-template.md`、`skills/spec-tasks/skill-bundle.json`、`skills/spec-clarify/SKILL.md`、`skills/stage-reflection/SKILL.md`、`skills/spec-analyze/SKILL.md`、`skills/spec-analyze/skill-bundle.json`、`skills/wh-review/contracts/build-plan.md`、`skills/wh-review/scripts/review-materials.mjs`、`skills/wh-review/skill-bundle.json`、`skills/catalog.yaml`、`workflows/build-plan/SKILL.md`、`workflows/build-plan/steps.json`、`workflows/build-plan/skill-deps.yaml`、`workflows/build-spec/SKILL.md`、`workflows/build-spec/steps.json`、`workflows/build-spec/skill-deps.yaml`、`config/workflowhub.yaml`、`tests/decision-log-content-contract.test.mjs`、`tests/stage-review-cost-policy.test.mjs`、`tests/contract/spec-stage-artifact-closure.test.mjs`、`tests/contract/material-producer-consumer-roundtrip.test.mjs`。
- **DO NOT TOUCH**：runtime 文件；母 PRD；CARD-01 committed contract/topology/archive。

### Tasks

- `T001`：RED — 旧模板/28 步/plan-tasks 双写被目标合同拒绝。
- `T002`：GREEN — 原位改四作者技能、build-plan 13 步、bundle/catalog。

### Verify

命令见 `ORACLE-AUTHORING-001`；RED 非零必须来自目标合同，GREEN exit 0；证据 `quality/tests/card02-authoring.json`。

### Knowledge

未来 spec 6 节+A/B/C/D 是被实现模板；当前 task 的 `spec.md` 仍是 `spec-content.v3`。P1/T002 只改 build-plan/build-spec workflow package；P2 只消费 main 已提交的 CARD-01 topology 并做只读回归，不拆、不复制 active registry。

### STOP

需要新增技能/模板、改母 PRD、或无法在现有四个作者技能内表达职责时回 decision/spec。

### Done

模板合同、steps/deps、bundle/catalog targeted tests 通过；K1–K12 与 13 步映射无悬空。

### Risks and rollback

风险：旧名称语义漂移。回滚：整体回滚 P1 skill/workflow 文件，不碰材料和 review 原件。

## Phase P2 — Runtime consumer、coverage 与 aggregate 删除

### Goal

CARD-01 已提交的 post/pre topology 持续为绿；CARD-02 只让 build-plan runtime 消费单写材料；coverage 在确认事务内成为独立质量事实而非 gate；aggregate active 链为零，历史 reader与非阻断 direct diagnostic 语义保留。

### Files

- **NEW**：N/A。
- **MODIFY**：`runtime/stage/stage-handoff.mjs`、`runtime/stage/completion-predicates.mjs`、`runtime/stage/stage-content-contracts.mjs`、`runtime/stage/stage-handlers.mjs`、`runtime/stage/stage-runner.mjs`、`runtime/stage/stage-skill-runtime.mjs`、`runtime/review/stage-materials.json`、`runtime/task/task-kernel-implementation.mjs`、`runtime/task/task-store.mjs`、`runtime/task/task-handle.mjs`、`tools/cli/stage-runtime.mjs`、`tools/cli/check-decision-log-chain.mjs`、`tests/contract/phase-quality-handoff.test.mjs`、`tests/contract/stage-order-and-host-interaction.test.mjs`、`tests/contract/stage-routing-and-concrete-testing.test.mjs`、`tests/contract/spec-analyze-completeness.test.mjs`、`tests/contract/review-materials-contract.test.mjs`、`tests/contract/human-confirmation-v3.test.mjs`、`tests/contract/decision-log-chain-warnings.test.mjs`、`tests/stage-decision-contract.test.mjs`、`tests/stage-interaction-contract.test.mjs`、`tests/contract/make-decision-interaction-publication.test.mjs`、`tests/contract/decision-convergence-depth.test.mjs`、`tests/contract/zero-machine-gate-advancement.test.mjs`、`tests/acceptance/card-01-current.mjs`。
- **DO NOT TOUCH**：`docs/contracts/card-01-stage-material-interface.md`、`runtime/task/task-topology.mjs`、`tools/cli/task-bootstrap.mjs`、`runtime/schemas/interaction-completion.v1.json`、CARD-01 归档材料。

### Tasks

- `T003/T004`：RED/GREEN — CARD-01 topology 只读回归 + CARD-02 single writer、review/analyze consumer。
- `T005/T006`：RED/GREEN — 原始需求逐条 coverage + 24×4 字段解析。
- `T007/T008`：RED/GREEN — interaction aggregate active producer/input/consumer/completion 删除。

### Verify

分别使用 `ORACLE-RUNTIME-001`、`ORACLE-COVERAGE-001`、`ORACLE-AGGREGATE-001`；每对同命令，失败原件分路径保存。

### Knowledge

顺序固定：先读取已提交 topology 并改 current material/runtime consumer，再 coverage，再 aggregate。旧 schema/reader 是审计兼容，不得重新进入 active writer；CARD-01 diagnostic 语义不得随 aggregate 一起删除。

### STOP

CARD-01 topology regression 失败、出现第二 topology registry、历史/pre 任务不可读、post 任务仍投影 build-spec、当前 card-02 被重解释为 post、coverage 质量阻断真实 confirmation、confirmation/quality 出现半记录、或删除需要新 public command/store 时停止。

### Done

三个 targeted GREEN 均 exit 0；CARD-01 topology/diagnostic focused regression 为绿；public input 拒绝 aggregate；确认缺项逐条报 ID/位置；历史 fixture 可读。

### Risks and rollback

风险：共享巨型文件修改覆盖。回滚：按 task 对回滚，保持先 coverage 后 deletion 的安全顺序。

## Phase P3 — 真实切片 smoke 与当前快照聚合

### Goal

用双 phase fixture 验证模板/索引/冻结测试/弱模型 handoff 形态，并一次运行当前范围 aggregate；不冒充 CARD-10 真实 task 抽验。

### Files

- **NEW**：`tests/acceptance/card-02-current.mjs` — one structured current-snapshot producer that preserves each AC outcome.
- **MODIFY**：`runtime/evidence/canonical-evidence-validators.mjs`、`runtime/evidence/freshness.mjs`、`runtime/stage/stage-handlers.mjs`、`runtime/stage/stage-runner.mjs`、`tests/contract/acceptance-execution-tier.test.mjs`、`tests/integration/vnext-official-stage-run.test.mjs`、`tests/contract/filled-plan-task-production.test.mjs`、`tests/contract/ui-stage-integration.test.mjs`。
- **DO NOT TOUCH**：P1/P2 已验证实现；真实 CARD-10 task。

### Tasks

- `T009/T010`：RED/GREEN — 双 phase fixture smoke、non_ui N/A、冻结测试/DO NOT TOUCH/真实入口交接合同。
- `T011`：FINAL — 只读 bounded aggregate，逐 AC 记录 achieved/deferred/unavailable/incomplete；命令执行成功与 AC 业务结果分开，后者不因前者成功而漂白。

### Verify

`T009/T010` 使用 integration/production/UI conditional 三文件同命令；`T011` 只读运行 P1/P2/P3 与 D-015 targeted 文件，保留首次 failed receipt、生成 `quality/tests/card02-final-recheck.json` 与独立 `quality/tests/card02-acceptance-matrix.json`，expected exit 0。

### Knowledge

fixture 只证明模板 smoke；AC-TEST-004 与 OPEN-005 仍由 CARD-10 真实 task 关闭。

### STOP

任一 AC 无 task/oracle、aggregate 需要全量 test、或必须修改 P1/P2 文件才能绿时返回 owning task，不在 FINAL 顺手修。

### Done

当前 targeted aggregate exit 0；review/finding/unknown/deferred facts 齐全；handoff 明确 build-code 不得猜测范围。

### Risks and rollback

风险：fixture 假绿。预防：明确 coverage limits 与真实 task deferred；回滚仅测试 fixture，不回滚已验证产品合同。

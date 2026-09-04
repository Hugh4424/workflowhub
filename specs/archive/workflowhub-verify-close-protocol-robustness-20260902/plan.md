# 实现计划：verify-code / close 执行协议健壮性改造

- **Input**：`specs/workflowhub-verify-close-protocol-robustness-20260902/decision-log.md`（accepted）、`specs/workflowhub-verify-close-protocol-robustness-20260902/spec.md`（冻结审查后修订版）
- **Template version**：`plan-task.v3`

## Quick Read（速读卡）

- **Goal**：协议错误与质量失败分层（白名单硬编码+默认保守）、verify-code 从已认证 Stage Agent outcome 派生绑定、resolved-review 首个失败结构化诊断、纯 payload 预检、协议错误轻量痕迹；质量 fail-closed 与公共行为七类不变。
- **Non-goals**：fail-closed 放宽、broker 异步化、task store 路径/快照治理、新公共行为类、跨调用断点续跑/恢复框架、review-level invocation provenance、白名单配置化、旧记录迁移（来源：D-008、D-012~D-016 / spec §10 非目标节）。
- **Before**：机械协议错误与质量失败同一失败通道→整轮 LLM 重跑；绑定靠 host 猜 ref；close resolved-review 报错笼统；schema 拒绝只在 handler 边界。
- **After**：发布阶段白名单错误可在同一次调用内最多纯 publication 重试（留轻量痕迹）；绑定从当前已认证 Stage Agent outcome 派生；resolved-review 诊断报告固定顺序的首个失败；预检只覆盖纯 payload 子集。
- **Main risk**：分层误判（RISK-001，默认保守兜底）；outcome 声明错误导致绑定残余风险（RISK-002）；预检纯子集与 handler 规则漂移（RISK-003）；诊断改造误动 resolved-review 判定（RISK-004）。
- **Next step**：先按修订后的 P0/P1/P2/P3/P4/P5 计划做契约 RED；任何需要新增 review schema、facts 字段/账本、公共行为、跨调用 retry token 或放宽质量语义的实现立即 STOP。

## Technical Context

### Global Constraints

- **公共行为面**：七类不变（doctor/status/run/review/verify/confirm/authorize）；预检=stage-runtime 私有命令，经既有公共行为 run 的新 action 路由，不新增第八类行为。
- **fail-closed 不变**：质量失败/unavailable 语义一行不改；分层只在发布/记录边界生效。
- **推进与质量分离**：`run` 只检查四份当前材料和结构性 runtime 边界；缺失、过期或 unavailable 的上游/当前质量事实只写入质量与发布诊断，不阻断同 task 当前 stage，也不派生 `rerun` 动作。
- **默认保守**：白名单=runtime 深冻结常量；未列名错误=quality_failure；无配置/环境变量覆盖。
- **旧记录只读**：新痕迹事实追加到既有 facts API；旧 outcome/review/授权记录字节和哈希不变。
- **Verified facts**：stage-runner.mjs 当前 verify-code stage-outcome 绑定分支与失败通道；task-kernel-implementation.mjs resolved-review 授权链；stage-runtime.mjs 命令白名单/公共路由；stage-handlers.mjs 纯 envelope/acceptance shape 可抽取子集；task-store.mjs 固定十字段 appendTaskFact API；既有物理 close 与 Stage Agent outcome 认证测试。
- **Implementation caveats frozen by D-012~D-016**：P2 不扩展 review schema/storage；P3 只首个失败；P4 只纯 payload；P5 只能调用既有 appendTaskFact，字段映射不可实现即 STOP；P1 重试仅同一次调用内 publication phase，最多一次。
- **Language / runtime**：Node.js >=24，ESM；不新增 npm 依赖；预检不得隐式 bootstrap。
- **Testing**：Vitest；契约测试 tests/contract/，集成 tests/integration/；RED/GREEN 成对。
- **Test routing**：backend-only，无浏览器/UI 面（ui_applicability=non_ui）。

## Code Anchors（代码锚点）

- **改动锚点**：`runtime/stage/stage-runner.mjs`（绑定派生面：verify-code 分支 2255-2280=FR-BIND-001/002 唯一实现宿主；+失败通道分层）、`runtime/task/task-kernel-implementation.mjs`（142-228 授权链诊断化）、`runtime/stage/stage-handlers.mjs`（纯 envelope/acceptance shape helper 抽取）、`tools/cli/stage-runtime.mjs`（白名单 553-562、路由 845-895 各加一项）、`workflows/build-code/SKILL.md` 与 `workflows/verify-code/SKILL.md`（各一句预检指令）。
- **新增锚点**：`runtime/stage/protocol-error-whitelist.mjs`（move-map 登记：唯一 consumer=stage-runner 失败通道与预检命令；owner=workflowhub-verify-close-protocol-robustness-20260902 build-code；删除条件=分层机制废弃）。
- **只读锚点**：`runtime/schemas/`（预检复用源）、`tests/integration/vnext-official-stage-run.test.mjs`（既有绑定负例，保持绿）。
- **Read before task**：T101/T102 读 stage-runner.mjs 2200-2320 全文；T301/T302 读 task-kernel-implementation.mjs 130-230 全文；T401/T402 读 stage-runtime.mjs 540-570 与 840-900 全文。

## Solution Design（方案设计）

### Overview

四个窄改动面：①白名单常量模块（FR-CLASS-003 枚举+匹配规则+诊断模板）+stage-runner 失败通道分类；仅在已经得到合法 handler result 且处于 publication phase 时，于同一次 `runStage` 调用内最多进行一次纯 publication 重试，handler/LLM 只调用一次；②stage-runner verify-code 分支：从当前已认证 Stage Agent outcome 中唯一声明的 canonical `dsh-code-review` ref/hash 派生 binding，host 值只作等值断言；不扩展 review schema/storage；③task-kernel resolved-review 授权链只附带固定六桶中第一个失败的 check_id、expected、actual 诊断，physical close 五项不可逆授权不改；④stage-runtime 新增私有 `run:preflight` action，仅读 payload JSON，复用抽取的纯 envelope/acceptance shape 校验，退出码 0/2/1，绝不 bootstrap/读取任务记录。协议痕迹只在 publication 重试成功后通过既有 `appendTaskFact` 追加，不能新增 facts 字段/账本/quality fact；字段映射由计划任务明确验证，无法满足既有十字段契约即 STOP。

设计停止条件：如果实现需要 review attempt/result 增加 invocation 字段、隐式读取任务/worktree、跨调用 retry token、聚合后续依赖错误、新公共行为、新事实源或质量判定变化，立即回 owning material，不在 build-code 猜测。

### 失败恢复矩阵

| 情形 | 行为 | 副作用 | 恢复 |
| --- | --- | --- | --- |
| publication 阶段白名单协议错误 | 结构化诊断；同一次 runStage 内最多一次纯 publication 重试 | 仅重试成功后通过既有 facts 留痕 | 修正 payload 后按既有入口再次提交 |
| handler/pre-handler 错误 | 不走 publication retry，保持现状失败语义 | 现状 | 同 task 修复 |
| 未列名错误 | 按质量失败处理（现状语义） | 现状 | 同 task 修复 |
| outcome 派生绑定 | 从当前已认证 outcome 的唯一 dsh-code-review pair 派生 | 不改旧 review/outcome | host 值仅等值断言 |
| 预检失败 | 退出码 2+诊断数组 | 零 | 修正后重新预检 |
| resolved-review 授权失败 | 固定顺序首个失败诊断 | 无 | 针对该环修复重试 |

### Component Quality Map（UI）

N/A — ui_applicability=non_ui（decision-log 三源事实），无组件/页面/前端改动。

## File Boundary（文件边界）

### NEW

- `runtime/stage/protocol-error-whitelist.mjs`
- `tests/contract/protocol-error-classification.test.mjs`
- `tests/integration/protocol-error-in-place-resend.test.mjs`
- `tests/fixtures/protocol-errors/build-code-schema.json`
- `tests/fixtures/protocol-errors/build-code-acceptance-coverage.json`
- `tests/fixtures/protocol-errors/verify-code-binding.json`
- `tests/fixtures/protocol-errors/close-authorization.json`
- `tests/contract/verify-code-binding-derivation.test.mjs`
- `tests/contract/close-authorization-diagnostics.test.mjs`
- `tests/contract/stage-runtime-preflight.test.mjs`
- `tests/contract/protocol-error-trace.test.mjs`
- `tests/fixtures/protocol-errors/legacy-stage-outcome.json`
- `tests/fixtures/protocol-errors/legacy-authorization-record.json`
- `tests/fixtures/protocol-errors/README.md`

### MODIFY

- `runtime/stage/stage-runner.mjs`
- `runtime/stage/stage-handlers.mjs`
- `runtime/task/task-kernel-implementation.mjs`
- `tools/cli/stage-runtime.mjs`
- `workflows/build-code/SKILL.md`
- `workflows/verify-code/SKILL.md`
- `docs/architecture/move-map.json`
- `specs/workflowhub-verify-close-protocol-robustness-20260902/tasks.md`

## Technical Decisions（技术决策）

> D-012~D-016 are the current make-decision authority. The task cards below are implementation planning only; build-code must not infer broader behavior from superseded text.

### DEC-CLASS — 错误白名单载体

- **Publication fault class**：`stage_publication_transient` is an explicit, exact-code/message class used only by the real stage publication seam and deterministic fault injection; it is the sole retryable class. All historical classes and unknown errors remain non-retryable, including `EEXIST`.

- **Selected**：new（新窄模块 `runtime/stage/protocol-error-whitelist.mjs`）
- **候选**：runtime 常量内联进 stage-runner（拒绝：预检命令也要消费，内联=两处真相）；配置文件（拒绝：可被放宽，违 D-010）
- **F10 real threat**：无——纯分类常量，不扩大攻击面；默认分支 quality_failure 保证未知错误从严
- **F10 existing cover**：无既有载体（失败通道只 throw 字符串，无可复用分类结构）
- **F10 bypassable**：不可绕过——深冻结常量，无配置/环境变量读取路径，分类在失败通道强制经过
- **F10 maintenance cost**：低——15 类历史条目加 1 个显式发布瞬态测试/适配类+classify 函数；变更=代码评审+契约测试+lessons/故障注入证据

### DEC-BIND — 绑定派生实现面

- **Selected**：extend（stage-runner.mjs verify-code 分支）
- **Source**：当前已认证 Stage Agent outcome 中唯一 canonical `dsh-code-review` ref/hash；不扩展 review schema/storage，不做 invocation-level review provenance。
- **Selection rule**：只有 stage outcome 已通过 `authenticateStageOutcome` 且 `code_review` 的 stage/step/skill/ref/hash 完整有效时，才把该 pair 复制到本次 handler input；缺失或认证失败保持 unavailable/拒绝，不从 review 目录枚举或选择“最新”记录。
- **候选**：task-kernel 授权链托管（拒绝：绑定发生在 stage 发布边界，属 stage-runner 职责）

### DEC-DIAG — close 诊断化

- **Selected**：extend（task-kernel-implementation.mjs resolved-review 校验链 throw 附诊断）
- **Semantics**：固定六个逻辑桶，沿既有 fail-fast 顺序只报告第一个失败；不做多失败聚合；诊断附在原有 Error/TypeError 的非枚举冻结 `error.diagnostic` 上；physical close 五项不可逆操作授权链不改。
- **候选**：包一层诊断适配器（拒绝：第二控制面，违宪法薄核心）

### DEC-PREFLIGHT — 预检暴露方式

- **Selected**：extend（stage-runtime.mjs 私有 `run:preflight` action + runtime facade internal route，仍归公共 `run` 行为）
- **Pure seams**：抽取 `validateStageInvocation(stage, input)` 与 `validateAcceptanceCoverageShape(value, options)`；preflight 只接收显式 payload/acceptance IDs，不从 current spec/materials 推导，不调用 official handler 或 `recordConsumerInvocation`。
- **Input/coverage**：只读 payload JSON；仅验证抽取的纯 envelope/acceptance shape 子集；不 bootstrap、不读取 task/worktree/records/materials/invocation；record-backed 正式发布认证不纳入等价性承诺。
- **Exit**：valid=0，protocol-invalid=2 且 stdout diagnostics 数组，command/input/runtime error=1 且 stderr；普通 run 路径保持原行为。
- **候选**：新公共行为类（拒绝：违治理）；独立 CLI 文件（拒绝：重复入口）

### DEC-TRACE — 痕迹事实载体

- **Selected**：extend（publication retry 成功后复用 `appendTaskFact` 追加既有 task-fact.v1；stage-runner 直接使用已认证 `ctx.task.taskPath`，不新增 TaskKernel writer）
- **Producer timing**：publication 首次被分类时捕获一次 `occurred_at`；仅在一次 retry publication 成功后调用 appendTaskFact；append/index 失败不再重试且不得伪称痕迹已持久化。
- **Fixed mapping**：`task_id` 由已认证 task root 注入；`stage`=当前阶段；`source=protocol_error:<class_id>`；`status=repaired_in_place`；`created_at`=首次识别时间且 `occurred_at=created_at`；`invocation_id`=当前 StageContext 的既有 workflow run id（不是 retry token）；`source_digest`=当前认证 snapshot 的 source digest；`material_digest`=既有 `materialRevisionFromValues` 对固定顺序四材料 `[path,content-or-null]` 值的 `revision-<sha256>` 去前缀 64-hex；`content_hash`=既有 `canonicalJson`（UTF-8、对象键字典序、紧凑 JSON、无尾随换行）对 stage/class_id/occurred_at/status 四字段 trace payload 的 SHA-256；`output_ref` 固定为 `facts.jsonl`，append 返回的 ref（格式为 `facts.jsonl#<line>`）与 sha256 及 `index.json` 条目是新增行的权威定位和行哈希。只在 retry publication 成功后 append 一次；append/index 失败不重试 publication、不重跑 handler/LLM、不伪称痕迹已持久化。不得新增字段、companion record、quality fact 或第二账本。
- **STOP**：若现有 appendTaskFact 无法以真实、可审计值填满十字段，则不编码 P5，退回 spec/plan 修订。
- **候选**：独立痕迹账本（拒绝：新存储面无消费者）

## Test Strategy（测试策略）

- **方法**：backend-testing（Vitest）；RED/GREEN 成对，每对同 gate_cmd、同 FR/AC。
- **fixture 清单**：build-code schema 类、build-code acceptance_coverage 类、verify-code outcome-binding 类、close resolved-review 授权类四个样例文件（源自 lessons 原文）+ 两个旧格式 fixture（真实旧记录样本脱敏）。
- **关键断言**：分类 15 类+未列名默认；publication-only 重试五条状态不变量（handler/LLM 只一次、同次调用、步骤不重跑、既有结果不覆盖、质量失败仍 fail-closed）；outcome 派生绑定与 host 等值/冲突路径；resolved-review 六桶首个失败诊断；纯 payload 预检等价断言+零副作用监测；旧记录三断言分开（字节哈希/可读性/新痕迹可见）。
- **等价关系**：预检与 handler 对同一纯 payload 校验子集结论一致（不包含 record-backed 认证）。
- **不涉及删除**：本任务不删除任何文件、命令或能力，无 deletion proof 需求。
- **coverage limits**：不证明真实业务任务端到端（留 verify-code 阶段真机验证）；不证明 M16/lessons 消费侧。

## Rollback and Recovery（风险与回滚）

每 Phase 内 RED/GREEN 成对，GREEN 失败还原该 Phase 的 MODIFY 文件重来；白名单/绑定/诊断/预检四面互相独立，可单面回滚；技能指令为纯文本可单独回退。

### Engineering Risk Handoff

- **Affected IDs**：RISK-001（FR-CLASS-001/002、AC-CLASS-001）
- **Trigger**：白名单匹配规则把质量错误误判为 protocol_error
- **Consequence**：质量问题被原地重发放行，fail-closed 被架空
- **Mitigation or STOP**：默认分支=quality_failure；未列名专项测试；发现误判立即 STOP 回 P1 收窄匹配规则；publication retry 只对已分类且已产生合法 handler result 的错误生效
- **Handling Stage**：build-code P1；verify-code 复验
- **Verification**：AC-CLASS-001 专项测试（未列名新错误被拦）
- **Affected IDs**：RISK-002（FR-BIND-001/002、AC-BIND-001/002）
- **Trigger**：已认证 outcome 错误声明 review ref/hash，或 host 值覆盖 outcome 派生值
- **Consequence**：绑定错记录，close 授权错绑
- **Mitigation or STOP**：只接受通过完整认证的当前 outcome 唯一 dsh-code-review pair；host 仅等值断言；review-level invocation provenance 不在本任务；STOP 回 P2
- **Handling Stage**：build-code P2；verify-code 复验
- **Verification**：AC-BIND-001/002 outcome 认证与 host 冲突 fixture
- **Affected IDs**：RISK-003（FR-PREFLIGHT-001、AC-PREFLIGHT-001）
- **Trigger**：纯预检子集与 handler 的对应纯校验规则独立演进导致结论不一致
- **Consequence**：预检放行但 handler 拒绝（或反向），工具失信；record-backed 检查不由预检覆盖
- **Mitigation or STOP**：handler/preflight 共用抽取的纯 validator；等价断言限定纯子集；STOP 回 P4
- **Handling Stage**：build-code P4；verify-code 复验
- **Verification**：AC-PREFLIGHT-001 纯子集等价断言
- **Affected IDs**：RISK-004（FR-DIAG-001、AC-DIAG-001）
- **Trigger**：诊断化改动误放宽 resolved-review 授权校验判定
- **Consequence**：close 授权门槛降低
- **Mitigation or STOP**：判定条件一行不改（只改错误形状）；六个逻辑桶样例仍全失败；不做聚合；physical close 五项授权链不变；STOP 回 P3
- **Handling Stage**：build-code P3；verify-code 复验
- **Verification**：AC-DIAG-001（每样例仍失败，仅首个失败诊断化）

## Implementation Order（实施顺序）

P0（T001）→ P1（T101→T102→T103→T104）→ P2（T201→T202）与 P3（T301→T302）与 P4（T401→T402→T403）→ P5（T501→T502）→ P6（T601）。P1 是全局前置（分类器被失败通道、预检、痕迹三面消费）；P2/P3/P4 互相文件不重叠；P5 依赖 P1 失败通道；P6 收尾。P1~P5 的 phase summaries 是目标，不是已完成事实，只有各卡执行状态区可宣称完成。

## Dependencies and Parallelism（依赖与并行）

- **串行链**：T001→T101→T102→T103→T104→T501→T502→T601；T102→T401→T402→T403；T104→T201→T202；T104→T301→T302。
- **可并行**：P2/P3/P4 三条链在 T104/T102 就绪后两两文件不重叠，可并行推进（T201/T301/T401 均标注）。
- **外部依赖**：零新增 npm 依赖；wh-review/broker 不碰（任务 C）；storage/snapshot 不碰（任务 B）。

## Requirement and Verification Traceability（需求与验证追踪）

| Source | FR | AC | Task | Oracle |
| --- | --- | --- | --- | --- |
| D-003/D-010 | FR-CLASS-001/002 | AC-EXEC-001、AC-CLASS-001 | T101/T102/T103/T104 | ORACLE-CLASSIFY、ORACLE-RESEND |
| D-002/F-001 | FR-CLASS-003 | AC-EXEC-002/003 | T001/T101（fixture） | ORACLE-RECON、ORACLE-CLASSIFY |
| D-012 | FR-BIND-001/002 | AC-BIND-001/002 | T201/T202 | ORACLE-BIND |
| D-014 | FR-DIAG-001 | AC-DIAG-001 | T301/T302 | ORACLE-DIAG |
| D-015 | FR-PREFLIGHT-001/002 | AC-PREFLIGHT-001/002 | T401/T402/T403 | ORACLE-PREFLIGHT、ORACLE-PREFLIGHT-DOC |
| D-016 | FR-CLASS-004 | AC-TRACE-001 | T501/T502 | ORACLE-TRACE |
| D-007/D-016 | FR-COMPAT-001 | AC-COMPAT-001 | T501/T502 | ORACLE-COMPAT |
| D-008/D-012~D-016 | spec §10 | AC-NONGOAL-001 | T601 | ORACLE-NONGOAL |

## Governance Synchronization Matrix（治理同步矩阵）

| 治理面 | 动作 | 同步内容 | 状态 |
| --- | --- | --- | --- |
| docs/architecture/move-map.json | 同步（T102） | 登记 protocol-error-whitelist.mjs 职责/唯一 consumer/owner/删除条件 | planned |
| CONTEXT.md | 不更新 | 术语 protocol_error/quality_failure 已在 make-decision 阶段登记 | done |
| ADR | 不新增 | 本阶段无新不可逆决策（决策均在 make-decision 记录） | done |
| 公共行为面 | 不更新 | 七类不变；run:preflight 为既有行为的新 action 路由 | invariant |
| steps.json / 工作流拓扑 | 不更新 | T403 只加技能正文一句指令 | invariant |

## Constitution Check（宪法逐项检查）

- **Constitution binding**：`{"artifact_kind":"constitution","ref":"CONSTITUTION.md","hash":"e400d447d94a68fc629ac05acb23c807e34a5c929a5bd723c91c9b02dfc16732","id":"workflowhub-constitution","version":"1.7.0","clause_count":22}`

| 条款 | 结论 | 依据 |
| --- | --- | --- |
| F1 薄核心 | 符合 | 四面均为窄改动；能力下沉技能层（技能指令一句） |
| F2 窄契约 | 符合 | 预检/诊断 wire contract 固定且最小 |
| F3 简单优先 | 符合 | reuse→extend→new 阶梯；仅一个新窄模块 |
| F4 可证伪 | 符合 | 每 AC 有失败条件；RED/GREEN 成对 |
| F5 单一事实源 | 符合 | 白名单唯一模块；schema 单一复用源 |
| F6 无隐藏状态 | 符合 | 痕迹显式入 facts；无常量外状态 |
| F7 显式边界 | 符合 | NEW/MODIFY/DO NOT TOUCH 三级声明 |
| F8 失败可见 | 符合 | 协议错误诊断+痕迹；不静默 |
| F9 向后兼容 | 符合 | 旧记录只读 fixture 回归 |
| F10 新机制审查 | 符合 | DEC-CLASS 四问齐全（唯一 new） |
| F11 无重复控制面 | 符合 | 预检复用 handler 同源校验；无第二账本 |
| Q1 独立审查 | 符合 | 本计划经异源 wh-review（3 provider 完成） |
| Q2 fail-closed | 符合 | 默认保守；质量失败正向验证（AC-EXEC-001） |
| Q3 事实非许可证 | 符合 | 痕迹/诊断均为事实；不入质量结论 |
| S1 技能可搬运 | 符合 | 技能指令不含宿主特定路径 |
| S2 技能独立调用 | 符合 | 预检为独立 CLI 命令 |
| S3 技能单一职责 | 符合 | 每卡单一 Phase 单一职责 |
| S4 声明式依赖 | 符合 | skill-deps 不变 |
| S5 版本化材料 | 符合 | plan-task.v3 声明 |
| S6 宿主中立 | 符合 | 不依赖 codex session |
| S7 质量独立上下文 | 符合 | 审查走 wh-review 独立 provider |
| S8 诚实降级 | 符合 | provider 失败原样保留 |

## Phase P0 — 基线核验

### Goal

确认改动锚点现状、现有相关测试清单、lessons 历史错误样例整理为 fixture 源。

### Files

- **NEW**：`tests/fixtures/protocol-errors/README.md`、`tests/fixtures/protocol-errors/build-code-schema.json`、`tests/fixtures/protocol-errors/build-code-acceptance-coverage.json`、`tests/fixtures/protocol-errors/verify-code-binding.json`、`tests/fixtures/protocol-errors/close-authorization.json`
- **MODIFY**：无（本阶段不改生产文件）
- **DO NOT TOUCH**：全部生产文件

### Tasks

T001（recon）

### Verify

`node -e "require('node:fs').accessSync('tests/fixtures/protocol-errors/README.md')"`（exit 0）

### Knowledge

锚点行号以直读为准，plan 行号为撰写时快照。

### STOP

锚点与 plan 描述实质性不符（函数不存在/语义已变）→ 停止更新 plan 再继续。

### Done

索引文件落盘；15 类错误每类有 lessons entry_id 或源码派生标注；锚点核验结论记录。

### Risks and rollback

行号漂移导致误判——以函数名/语义为准；回滚=删除索引文件。

## Phase P1 — 错误分层核心

### Goal

白名单常量+分类器+诊断负载；stage-runner 失败通道支持白名单内协议错误原地修正重发。

### Files

- **NEW**：`runtime/stage/protocol-error-whitelist.mjs`、`tests/contract/protocol-error-classification.test.mjs`、`tests/integration/protocol-error-in-place-resend.test.mjs`
- **MODIFY**：`runtime/stage/stage-runner.mjs`、`docs/architecture/move-map.json`
- **DO NOT TOUCH**：runtime/schemas/（只读复用）、task-kernel、stage-runtime.mjs、质量判定语义

### Tasks

T101/T102（分类 RED/GREEN）、T103/T104（原地重发 RED/GREEN）

### Verify

两对 RED/GREEN 的命名 gate_cmd（见卡）全部按预期 exit；非回归命令独立记录真实 exit/timeout。

### Knowledge

fixture 文本取自 lessons 原文不得润色；分类默认分支=quality_failure。

### STOP

任何需要配置化白名单或放宽质量失败语义的实现 → 停止退回 spec。

### Done

15 类历史样例全判 protocol_error；显式发布瞬态类可重试；未列名判 quality_failure；原地重发五条状态不变量断言通过；既有套件绿。

### Risks and rollback

匹配规则过宽吞掉质量错误；回滚=还原 stage-runner.mjs 与删除白名单模块。

## Phase P2 — verify-code 绑定自动化

### Goal

quality_review_ref 由 runtime 从当前已认证 Stage Agent outcome 中唯一 canonical dsh-code-review pair 派生；host 值只作等值断言；不扩展 review schema/storage。

### Files

- **NEW**：`tests/contract/verify-code-binding-derivation.test.mjs`
- **MODIFY**：`runtime/stage/stage-runner.mjs`
- **DO NOT TOUCH**：dsh-code-review 技能、wh-review、review 存储

### Tasks

T201/T202（绑定 RED/GREEN）

### Verify

绑定契约 gate_cmd（见卡）按预期 exit。

### Knowledge

派生只在发布瞬间写新 outcome，不回写旧 outcome。

### STOP

任何允许 host 值覆盖派生值的实现 → 停止。

### Done

正向从当前已认证 Stage Agent outcome 派生精确相等+close 消费同值；缺失/认证失败/缺完整 pair/无法唯一确定 canonical dsh-code-review 均诊断拒绝不派生；host 值两条路径正确。该目标只有 T201/T202 执行、测试和独立审查均有证据后成立。

### Risks and rollback

已认证 outcome 声明错误或派生 pair 不完整；回滚=还原 verify-code 分支到三 throw 现状。

## Phase P3 — close 诊断

### Goal

resolved-review 授权校验链首个失败输出结构化诊断（六个 check_id 按既有固定顺序；不做聚合）。

### Files

- **NEW**：`tests/contract/close-authorization-diagnostics.test.mjs`
- **MODIFY**：`runtime/task/task-kernel-implementation.mjs`
- **DO NOT TOUCH**：校验标准本身、authorize 公共行为语义、`core/task-close.mjs` physical close 五项操作

### Tasks

T301/T302（诊断 RED/GREEN）

### Verify

诊断契约 gate_cmd（见卡）按预期 exit。

### Knowledge

check_id 六值与顺序以 spec §7 为唯一权威。

### STOP

任一环节样例变成通过（放宽校验）→ 停止。

### Done

六个逻辑桶各有首个失败诊断样例通过；按既有 fail-fast 只报告首个失败；不做多失败聚合；校验标准零放宽。该目标仅在 T301/T302 实际执行并有完整诊断字段证据后成立。

### Risks and rollback

诊断化误改判定逻辑；回滚=还原 task-kernel-implementation.mjs。

> 绑定和诊断阶段目标为计划约束，不是已完成事实；完成必须以对应卡片执行状态、测试和独立审查证据为准。

## Phase P4 — 预检命令

### Goal

stage-runtime 私有 payload preflight（经 run:preflight 路由），复用 handler 抽取的纯 envelope/acceptance shape 校验，零副作用；两份工作流技能各加一句指令；不覆盖 record-backed 认证。

### Files

- **NEW**：`tests/contract/stage-runtime-preflight.test.mjs`
- **MODIFY**：`tools/cli/stage-runtime.mjs`、`runtime/stage/stage-handlers.mjs`、`workflows/build-code/SKILL.md`、`workflows/verify-code/SKILL.md`
- **DO NOT TOUCH**：runtime/schemas/（只读复用）、公共行为七类语义

### Tasks

T401/T402（预检 RED/GREEN）、T403（技能指令）

### Verify

预检契约 gate_cmd（见卡）按预期 exit；T403 文本检查 exit 0。

### Knowledge

预检与 handler 共用抽取的同一纯 payload validator；不复制 record-backed 认证规则，预检等价性仅覆盖该纯子集；不得隐式读取 spec/materials 推导 acceptance IDs。

### STOP

需要新增公共行为类或复制校验规则 → 停止退回 spec。

### Done

纯 payload 错误 fixture 全覆盖拦截；退出码 0/2/1；纯 validator 等价断言与零副作用断言通过；两份技能各一处指令。该目标仅在 T401/T402/T403 执行并有完整证据后成立。

### Risks and rollback

预检与 handler 规则漂移；回滚=移除 preflight 路由，handler 语义不变。

## Phase P5 — 痕迹与兼容

### Goal

publication retry 成功后的协议错误痕迹事实写入；仅复用既有 appendTaskFact 十字段，旧记录只读兼容 fixture 回归；映射不满足既有 API 即 STOP。

### Files

- **NEW**：`tests/contract/protocol-error-trace.test.mjs`、`tests/fixtures/protocol-errors/legacy-stage-outcome.json`、`tests/fixtures/protocol-errors/legacy-authorization-record.json`
- **MODIFY**：`runtime/stage/stage-runner.mjs`
- **DO NOT TOUCH**：quality/ 旧记录、旧 task store

### Tasks

T501/T502（痕迹+兼容 RED/GREEN；非回归命令独立记录）

### Verify

痕迹契约 gate_cmd（见卡）按预期 exit。

### Knowledge

痕迹=事实不是许可证；只调用既有 appendTaskFact/task-fact.v1 十字段，写入新 facts 行，不追加或修改旧 outcome/review/授权记录；无法以真实 authenticated context 填满字段即 STOP。

### STOP

痕迹写进旧记录或质量结论 → 停止。

### Done

retry 成功后按既有十字段 mapping 写痕迹且不入质量结论；retry 失败无 repaired fact；无法填满十字段即 STOP；旧 fixture 可解析且字节哈希不变；既有相关套件绿。该目标仅在 T501/T502 实际执行并有完整字段证据后成立。

### Risks and rollback

fixture 自造而非真实旧格式；回滚=还原 stage-runner.mjs 痕迹写入点；旧记录按行字节保留，facts.jsonl 新行的 append/index 证据独立核验。

## Phase P6 — 聚合验证

### Goal

最终聚合：全量测试+行为面审计+非目标审计+AC 覆盖汇总。

### Files

- **NEW**：无
- **MODIFY**：`specs/workflowhub-verify-close-protocol-robustness-20260902/tasks.md`（执行状态填写区）
- **DO NOT TOUCH**：全部生产文件（仅验证）

### Tasks

T601（聚合卡）

### Verify

`npx vitest run tests/contract/ tests/integration/`（必须记录真实 exit；exit 非 0 或超时均不得宣称全量通过）+ 审计清单。

### Knowledge

聚合不是新公共 stage。

### STOP

任一既有测试变红或审计发现非目标违反 → 停止回对应 Phase 修复。

### Done

全量命令有真实 exit 证据；若非 0/超时则如实标记未通过/未知并回对应 Phase；公共行为仍七类；diff 审计无违规；逐 AC 汇总完成；六段交接写出。

### Risks and rollback

聚合时才发现面间冲突（P1 通道 vs P2 分支）；回滚=定位违规项回对应 Phase。

## 独立审查事实与处置（build-plan，2026-09-02）

> 历史审查摘要仅保留事实；下方收口结论以当前材料和 D-012~D-016 为准。

- **传输事实**：status=available，outcome=**partial**，minimum_heterologous=1 满足。provider：opencode/v4flash=completed（0 findings）、antigravity/flash=completed（0 findings）、codex/luna=completed（3 findings）；**pi/coding=failed/RATE_LIMITED**（原始错误保留，不改写）。advice only。

| finding_id | 原始事实/来源 | status | next_action |
| --- | --- | --- | --- |
| FND-P01 | codex/luna major：绑定（FR-BIND-001/002）无具名实现面 | fixed | Code Anchors 与 DEC-BIND 明确"stage-runner verify-code 分支=绑定派生唯一实现宿主" |
| FND-P02 | codex/luna major：恢复细节不足 | rejected_invalid | 本计划含失败恢复矩阵+Engineering Risk Handoff 六字段×4 风险；finding 证据针对送审摘要压缩文本 |
| FND-P03 | codex/luna minor：T403 技能改动无 FR/AC 追溯 | rejected_invalid | T403 卡片 FR=FR-PREFLIGHT-002、AC=AC-PREFLIGHT-002；spec FR-PREFLIGHT-002 明示技能指令 |

## 阶段收口校验（spec-analyze，build-plan，2026-09-02）

逐条核对：当前 spec 的 FR/AC 全部有 task 承载；无孤儿 task；边界三面与 spec §10 一致；RED/GREEN 成对同 gate_cmd；T403 有 FR 追溯。历史 plan-task.v3 结构问题只作为背景，不能作为当前材料已验证通过的声明；ReferenceBindings 必须在本次全部材料编辑完成后由 live spec/plan hash 重新生成并经验证，不能沿用旧 hash。纯 payload、outcome binding、首个失败和既有十字段 facts 映射均与 D-012~D-016 一致。

### 六段大白话总结

1. **本阶段做了什么**：在不改变 make-decision 的前提下，将 P1/P2/P3/P4/P5 收窄为可执行的 publication-only retry、authenticated-outcome binding、first-failure diagnostics、pure payload preflight 和既有十字段 trace；P0/P6 保留为核验/收口。
2. **需求覆盖**：以当前 spec 的 FR/AC 追踪表为准；D-012~D-016 的每项 scope reduction 都有对应 task/STOP 条件。
3. **上游一致性**：plan 未发明产品方向；review provenance、跨调用 retry、facts 新 schema/账本和公共行为新增均明确为非目标。
4. **当场修复**：删除 invocation-level review-record 绑定、多失败聚合、全 handler preflight 等过宽承诺；补充既有 appendTaskFact 十字段映射前置检查。
5. **剩余风险**：RISK-001~004（各有兜底/回滚/验证）；OPEN-001 宿主认证位缺失如实保留。
6. **下游边界**：build-code 按卡执行，不得自行猜测：白名单枚举（spec FR-CLASS-003）、outcome 派生规则（spec FR-BIND-001）、预检退出码与纯子集（spec FR-PREFLIGHT-001）、check_id 首个失败顺序（spec §7）、既有十字段 facts mapping（DEC-TRACE）、卡片 boundary 外文件禁改。

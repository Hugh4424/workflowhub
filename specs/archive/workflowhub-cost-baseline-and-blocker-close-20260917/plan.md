# 实现计划：WorkflowHub 成本基线与阻塞收口

- **Input**：`decision-log.md@22af1df9a210aa8ea6de1b6e1415e14d1b860ddf18d02b07c6bde31667e679b3`、`spec.md@7773a5d3821a5edd1ffdaeb1ca3c33ae31b6fd955dbe96dc6c6f6a50212f1847`
- **Template version**：`plan-task.v4`

## 材料导航

| 章节 / 材料锚点 | 职责与摘要 | M/S/B/P 读取时机 |
| --- | --- | --- |
| `decision-log.md#D-001～D-026` | 已确认方向、非目标、授权与 OI-26 增量决策 | M 启动与人工确认前 |
| `spec.md#5. 功能需求` | 38 FR 的产品行为和失败边界 | S 每 Phase 开始前 |
| `spec.md#11. 验收标准` | 38 AC 的四段 oracle | S 写 RED/GREEN 与 FINAL 时 |
| `plan.md#Phase P1～P8` | 工程顺序、精确文件和恢复边界 | S 执行对应 Phase 前 |
| `tasks.md#Phase P1～P8` | 可执行卡与唯一执行状态填写区 | M/S 执行与聚合时 |

## Quick Read

- **Goal**：消除审查白等、超时误归、重发 no-op、格式误杀、两轨错绑、重采与记录锁浪费，并以 OI-26 终止收口重绑级联。
- **Non-goals**：不改变交互流程或人工确认点，不做 D5/D6，不改两个 config，不减少 provider 派发，不新增页面、采集面或完整 broker 状态机；来源：decision-log 非目标、D-026 与 spec §10。
- **Before**：非终态事实不能安全跨仓消费，agy 超时被误归，失败 attempt 可被钉死复用，确认读侧对合法差异不对称，两个声明检查为红。
- **After**：WH 先兼容、BR 后生产；真实失败可分类和一次恢复；格式宽容但七红线不动；合法非材料差异不触发重绑，实质变化仍失效；两个检查转绿。
- **Main risk**：跨仓 producer 早于 consumer 发布，或为了变绿越过授权/放宽 fail-closed。
- **Next step**：P1 先写 RED；任一越权、红线放宽或需要新决策立即 STOP。

## Technical Context

### Global Constraints

- **Verified facts**：Node.js ESM；当前 task 四材料是唯一权威；decision/spec 在 build-plan 中冻结；本任务 non_ui。
- **Language / runtime**：Node.js；WorkflowHub 使用定向 vitest；3rd-review 使用 node:test。
- **Primary dependencies**：现有 wh-review、stage runtime、3rd-review broker/adapters；无新依赖。
- **Storage / state**：执行事实只写现有 task store quality/facts 路径；不创建新状态权威。
- **Testing**：仅精确文件 targeted 命令；禁止 npm test、test:safe 和无范围全量 vitest；不触真实网络/provider。
- **Target environment**：认证 WorkflowHub worktree 与独立 3rd-review 仓；两个 config SHA 保持不变。
- **Scale / scope**：P1–P8 + FINAL，38 FR / 38 AC；外仓写入严格限制为 6 文件。
- **Unresolved facts**：N/A — direction/spec 已收口，构建期发现超出授权或需新语义时按 STOP 回用户。

## Code Anchors

- **Verified anchors**：`simple-review-runner.mjs` 等待与预检；`review-record-route.mjs` 复用；`stage-runner.mjs` 双轨事实/确认候选；3rd-review `broker.mjs` recovery/attempt；`workflowhub-result-v3.mjs` public projection。
- **Existing interfaces**：managed request/status/result、human-confirmation.v3、attempt.schema.json、stage quality facts。
- **Read now**：本计划 Quick Read、File Boundary、当前 Phase。
- **Must read before task**：任务卡 Knowledge 指定的 symbol/region 与当前测试断言。
- **Context mode**：Lite — 每张卡只加载精确文件和本轨 AC。

### Reuse → Extend → New

| Capability | Decision | Existing anchor | Reason / removal condition |
| --- | --- | --- | --- |
| 等待与成员事实 | extend | `skills/wh-review/scripts/simple-review-runner.mjs` | 复用现有轮询，不增第二 timer |
| 超时与重发 | extend | `$THIRD_REVIEW_ROOT/lib/broker.mjs` | 复用一次 fresh_execution 预算 |
| 格式解析 | extend | `runtime/review/review-output.mjs` | 扩宽输入形态但保留七红线 |
| 确认重绑 | extend | `runtime/stage/stage-runner.mjs` | D4 只补读侧对称，不做 D5/D6 |
| 控制面 | reuse | 现有 review/test/facts | 不新增控制面 |

## Solution Design

### Overview

先在 P1 扩展 WorkflowHub consumer，使其接受受控非终态成员事实并在到期前复检，同时先登记 attempt process/parse schema 与 WH consumer。只有 consumer/schema 兼容后，P2 才修改 3rd-review producer、超时归类、重发与 attempt 投影，避免半发布。P3–P5 依次处理预检/源漂移、格式/脱敏、两轨事实/schema。P6 删除重采和死锁并闭合 DEF-09；P7 实施 OI-26 冻结纪律与 D4；P8 修哈希红灯并做治理与最终聚合。

### Module responsibilities

#### 审查消费与派发
- **Responsibility**：等待、预检、源漂移、格式与质量事实绑定。
- **Consumes**：managed public envelope、review output、材料身份。
- **Produces**：结构化 review attempt/result 与本轨 quality fact。
- **Must not decide**：人工确认与需求方向。

#### 3rd-review producer
- **Responsibility**：诚实超时、一次恢复、attempt process/parse 事实、受控成员公开事实。
- **Consumes**：provider process/stdout/stderr。
- **Produces**：managed public envelope 与 workflowhub-result.v3。
- **Must not decide**：WorkflowHub 阶段推进。

#### 阶段与治理
- **Responsibility**：确认 read-side、冻结纪律、声明哈希与边界审计。
- **Consumes**：四材料、snapshot delta、bundle bytes。
- **Produces**：可验证确认复用判定与检查结果。
- **Must not decide**：D5/D6 或新增确认点。

### Interfaces, data, and lifecycle

- **Interfaces / schemas**：非终态成员仅 status/error.code/last_progress_at_ms；attempt 增 process_outcome 与 parse_outcome；其余 terminal schema 不放宽。
- **Data flow / state**：provider 进程事实 → BR parse/recovery → public envelope → WH wait/parse → canonical result → 本轨 quality fact。
- **API contract**：N/A — 无 HTTP 或新公共命令。
- **UI / external code**：N/A — non_ui；跨仓仅授权 6 文件。
- **Fail-loud behavior**：越权文件、实质确认变化被复用、七红线退化、provider/config 边界变化均 STOP。

## UI Delivery Contract (仅 UI phase/task 使用)

- **UI applicability**：`non_ui` — decision-log 已记录，本任务不含页面。
- **Component action**：N/A — non_ui。
- **Real consumer**：CLI/runtime consumer。
- **State owner**：N/A — non_ui。
- **Typed ViewModel**：N/A — non_ui。
- **CSS/token owner**：N/A — non_ui。
- **Fixture / viewport**：N/A — non_ui。
- **Browser / a11y / performance**：N/A — non_ui。
- **Screenshot handoff**：N/A — non_ui。
- **Coverage limits**：不覆盖浏览器/视觉。
- **N/A / unknown reason**：decision-log ui_applicability=non_ui。

### Design-gap handoff (不改变 Design.md 权威)

- **design_status**：`not_applicable`。
- **missing_items / reason**：[] — non_ui。
- **fallback_visual_basis**：N/A — non_ui。
- **constraints / assumptions**：不新增页面或交互。
- **rework_risk / human_confirmation**：N/A — UI 不适用；stage 确认点保持原样。
- **current_material_ref / design_revision**：当前四材料；N/A — no Design.md。
- **visible_labels**：N/A — non_ui。
- **preview_refs / fixture_refs / viewport_refs / screenshot_refs**：N/A — non_ui。
- **responsive / a11y**：N/A — non_ui。

## File Boundary

### NEW

- N/A — no new production files

### MODIFY

- `skills/wh-review/scripts/review-provider-client.mjs`
- `skills/wh-review/scripts/simple-review-runner.mjs`
- `runtime/review/review-record-route.mjs`
- `tests/review/review-managed-lifecycle.test.mjs`
- `tests/review/review-record-route.test.mjs`
- `skills/wh-review/scripts/__tests__/review-provider-client-v3.test.mjs`
- `runtime/review/schemas/attempt.schema.json`
- `skills/wh-review/scripts/review-result.mjs`
- `skills/wh-review/scripts/__tests__/simple-contracts.test.mjs`
- `skills/wh-review/scripts/__tests__/review-writer-taskhandle.test.mjs`
- `$THIRD_REVIEW_ROOT/lib/adapters/antigravity.mjs`
- `$THIRD_REVIEW_ROOT/lib/provider-failure.mjs`
- `$THIRD_REVIEW_ROOT/lib/recovery-policy.mjs`
- `$THIRD_REVIEW_ROOT/lib/broker.mjs`
- `$THIRD_REVIEW_ROOT/lib/workflowhub-result-v3.mjs`
- `$THIRD_REVIEW_ROOT/test/managed-session-lifecycle.test.mjs`
- `skills/wh-review/scripts/third-review-host-config.mjs`
- `skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs`
- `skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs`
- `tests/contract/review-material-change-redispatch.test.mjs`
- `runtime/review/review-output.mjs`
- `skills/wh-review/scripts/review-materials.mjs`
- `skills/wh-review/scripts/review-input-bounds.mjs`
- `skills/wh-review/scripts/__tests__/material-redaction.test.mjs`
- `tests/contract/review-materials-contract.test.mjs`
- `tests/contract/review-layering.test.mjs`
- `skills/wh-review/scripts/__tests__/review-runner.test.mjs`
- `skills/wh-review/scripts/__tests__/wh-review-cli-bounds.test.mjs`
- `runtime/stage/stage-runner.mjs`
- `tests/e2e/vnext-five-stage-current.test.mjs`
- `runtime/evidence/freshness.mjs`
- `skills/wh-review/scripts/wh-review-cli.mjs`
- `skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs`
- `tests/contract/per-ac-material-freshness.test.mjs`
- `tests/close/freshness-consistency.test.mjs`
- `tests/integration/verify-freshness-selection.test.mjs`
- `tests/e2e/ui-e2e-contract-dogfood.test.mjs`
- `tests/contract/performance-budget.test.mjs`
- `tests/contract/stage-runner-on-stage-end.test.mjs`
- `workflows/make-decision/SKILL.md`
- `workflows/build-spec/SKILL.md`
- `workflows/build-plan/SKILL.md`
- `docs/standard-workflow.md`
- `tests/contract/human-confirmation-v3.test.mjs`
- `tests/contract/freeze-classification-budget-usage-protocol.test.mjs`
- `skills/spec-analyze/skill-bundle.json`
- `skills/stage-handoff/skill-bundle.json`
- `skills/stage-reflection/skill-bundle.json`
- `skills/catalog.yaml`
- `skills/wh-review/skill-bundle.json`
- `workflows/build-code/SKILL.md`
- `workflows/verify-code/SKILL.md`
- `tests/contract/stage-reflection-wiring.test.mjs`
- `/Users/Hugh/Downloads/workflowhub-deferred-items-20260915.md`

### DO NOT TOUCH

- `~/.config/workflowhub/config.json` — configuration is frozen.
- `~/.config/3rd-review/config.json` — configuration is frozen.
- `specs/archive/**` — archive read-only.
- `runtime/stage/stage-runner.mjs` 的 D6 freeze pointer 与 `STAGE_FACT_MATERIALS` — D5/D6 non-goal.

## Deletion Proofs

- P6 删除 freshness 死代码与专属锁前先做 consumer grep；若存在生产 consumer 则 STOP。
- DEF-09 删除后旧 literal 活动命中为 0；不以跳过测试掩盖。
- 净减按逐文件 diff 行数记录，不用搬家或改名伪装删除。

## Technical Decisions

### DEC-001 — Consumer before producer

- **Problem**：BR 先发布新非终态形状会被现有 WH exact-key 校验误杀。
- **Options**：producer-first / consumer-first / 配置开关。
- **Selected**：extend — consumer-first。
- **Reason**：无配置、无双写且可分批回滚。
- **Consequence / risk**：短期 consumer 接受尚未出现的可选事实；必需键仍 fail-closed。
- **Fallback**：回滚当前 Phase，不发布 BR。
- **F10 disposition**：`simplify`。

### DEC-002 — Read-side symmetric confirmation

- **Problem**：合法执行记录/非材料差异在读侧触发重绑。
- **Options**：D4 对称 / D5 收窄材料 / D6 冻结 pointer。
- **Selected**：extend — 仅 D4。
- **Reason**：复用写侧 helper，约四行，实质材料变化仍失效。
- **Consequence / risk**：错误分类 snapshot delta 会扩大复用。
- **Fallback**：回滚 D4 与授权测试断言。
- **F10 disposition**：`simplify`。

## Test Strategy

RED/GREEN 每对使用同一 gate_cmd 与 oracle identity；build-plan 只设计，不执行实现测试。

| Target | Task | Role | gate_cmd / expected_exit | Oracle / evidence_path |
| --- | --- | --- | --- | --- |
| AC-WAIT-001, AC-WAIT-002, AC-HEALTH-003, AC-HEALTH-004, AC-BROKER-004 | T001/T002 | RED/GREEN | `见本 Phase Verify 的 gate_cmd（唯一命令来源，避免副本漂移）` / `1→0` | `ORACLE-WH-CONSUMER` / `quality/tests/output/P1-red-green.txt` |
| AC-HEALTH-001, AC-HEALTH-002, AC-BROKER-001, AC-BROKER-002, AC-BROKER-003 | T003/T004 | RED/GREEN | `见本 Phase Verify 的 gate_cmd（唯一命令来源，避免副本漂移）` / `1→0` | `ORACLE-BROKER-HEALTH` / `quality/tests/output/P2-red-green.txt` |
| AC-PREFLIGHT-001, AC-PREFLIGHT-002, AC-PREFLIGHT-003, AC-CLEANUP-005 | T005/T006 | RED/GREEN | `见本 Phase Verify 的 gate_cmd（唯一命令来源，避免副本漂移）` / `1→0` | `ORACLE-PREFLIGHT-DRIFT` / `quality/tests/output/P3-red-green.txt` |
| AC-FORMAT-001, AC-FORMAT-002, AC-FORMAT-003, AC-FORMAT-004 | T007/T008 | RED/GREEN | `见本 Phase Verify 的 gate_cmd（唯一命令来源，避免副本漂移）` / `1→0` | `ORACLE-FORMAT-REDLINES` / `quality/tests/output/P4-red-green.txt` |
| AC-BINDING-001, AC-BINDING-002 | T009/T010 | RED/GREEN | `见本 Phase Verify 的 gate_cmd（唯一命令来源，避免副本漂移）` / `1→0` | `ORACLE-FACT-BINDING` / `quality/tests/output/P5-red-green.txt` |
| AC-CLEANUP-001, AC-CLEANUP-002, AC-CLEANUP-003 | T011/T012 | RED/GREEN | `见本 Phase Verify 的 gate_cmd（唯一命令来源，避免副本漂移）` / `1→0` | `ORACLE-CLEANUP-NEGATIVE` / `quality/tests/output/P6-red-green.txt` |
| AC-REBIND-001, AC-REBIND-002, AC-REBIND-003, AC-REBIND-004 | T013/T014 | RED/GREEN | `见本 Phase Verify 的 gate_cmd（唯一命令来源，避免副本漂移）` / `1→0` | `ORACLE-CONFIRM-REBIND` / `quality/tests/output/P7-red-green.txt` |
| AC-CLEANUP-004, AC-GOV-001, AC-GOV-002, AC-GOV-003, AC-GOV-004, AC-GOV-005, AC-GOV-006, AC-GOV-007, AC-GOV-008, AC-GOV-009, AC-GOV-010 | T015/T016 | RED/GREEN | `见本 Phase Verify 的 gate_cmd（唯一命令来源，避免副本漂移）` / `1→0` | `ORACLE-FINAL-GOVERNANCE` / `quality/tests/output/P8-red-green.txt` |

## Rollback and Recovery

- **Global recovery rule**：只回滚当前 Phase 实现字节，保留四材料与原始失败事实；不通过扩大范围或放宽测试恢复。
- **Irreversible boundaries**：3rd-review 写入、commit/push/merge/archive/cleanup 均按既有人工授权；本计划不自动执行。
- **Recovery owner**：build-code 主会话按 Phase 回滚；verify-code 只记录事实。

### Phase Commit Points

- 每个 Phase 的 GREEN 证据落盘即为一个提交点；提交点之间不得混入下一 Phase 的实现字节。
- 跨 Phase 共享文件的串行归属：`simple-review-runner.mjs` 按 P1→P3→P4 顺序逐 Phase 提交；`review-record-route.mjs` 按 P1→P3 顺序；`stage-runner.mjs` 按 P5→P6→P7 顺序；同一文件的后续 Phase 修改以前一提交点为基线。
- 每个提交点产出补丁清单（changed files + 行数 + RED/GREEN 证据 ref），供回滚时按 Phase 精确切除，禁止跨 Phase 半发布。每个提交点还必须记录该 Phase 的 patch 清单 id 与共享文件 base hash（3rd-review 仓同样记录），使单 Phase 可逆回滚。

#### Open/Deferred 交接表

| 事项 | 负责人 / 处理阶段 | 触发条件 | 交接去向 | 关闭条件 |
| --- | --- | --- | --- | --- |
| OPEN-001 | 负责人：build-spec 主会话（已在 spec 闭合） | 触发：spec 起草期已处理 | 去向：无下游交接，spec.md L93 已闭合 | 关闭条件：AC-CLEANUP-005 通过即关闭 |
| OPEN-002 | 负责人：主会话口径调和 | 触发：spec 审查期口径对齐 | 去向：spec 例外清单口径，无下游交接 | 关闭条件：AC-GOV-004 基线对照通过 |
| OPEN-003 | 负责人：build-spec 主会话（确定性抽取规则已在 spec 闭合） | 触发：spec 起草期已处理 | 去向：实现归 build-code（P4 FORMAT 任务卡承接） | 关闭条件：AC-FORMAT-001~004 通过 |
| OPEN-004 | 负责人：build-code 主会话（P1 承接） | 触发：T001/T002 实施期 | 去向：P1 attempt.schema.json process_outcome/parse_outcome 形状落地 | 关闭条件：AC-BROKER-004 通过 |

### Engineering Risk Handoff

- **PLAN-RISK-001**：跨仓协议半发布
  - **Affected IDs**：FR-HEALTH-003、FR-BROKER-001～004、T001～T004
  - **Trigger**：BR producer 在 WH consumer 兼容前发布。
  - **Consequence**：非终态成员事实被误杀或整组 unavailable。
  - **Mitigation or STOP**：严格 P1→P2；P1 未绿即 STOP。
  - **Handling Stage**：build-code。
  - **Verification**：P1/P2 targeted GREEN 与两仓 diff allowlist。

## Implementation Order

P1 WH consumer/schema compatibility → P2 BR producer/health/retry → P3 preflight/wait/drift → P4 format/redlines → P5 binding/schema → P6 cleanup/DEF-09 → P7 OI-26/D4 → P8 hash/governance → FINAL targeted aggregate。P1/P3/P4 共用 simple-review-runner，必须串行。

## Dependencies and Parallelism

- **Dependencies**：P1→P2 是协议硬依赖；P3→P4→P5 对共享文件串行；P6 后 P7；P8 最后按真实 bytes 重算哈希。
- **Parallel work**：仅不同仓且无共享文件的只读取证可并行；写入由主会话串行整合。
- **External dependencies**：3rd-review 独立仓；缺失授权或越出 6 文件即 STOP。

## Requirement and Verification Traceability

| Source / decision | FR | AC | Phase / Task | Depends on | Exact files | Command / oracle |
| --- | --- | --- | --- | --- | --- | --- |
| D-004, D-023, D-025 / OI-04, OI-23, OI-25 | FR-WAIT-001, FR-WAIT-002, FR-HEALTH-003, FR-HEALTH-004, FR-BROKER-004 | AC-WAIT-001, AC-WAIT-002, AC-HEALTH-003, AC-HEALTH-004, AC-BROKER-004 | P1 / T001,T002 | none | `skills/wh-review/scripts/review-provider-client.mjs` | `见本 Phase Verify 的 gate_cmd（唯一命令来源）` / ORACLE-WH-CONSUMER |
| D-019, D-011, D-023, D-025 / OI-19, OI-23, OI-25 | FR-HEALTH-001, FR-HEALTH-002, FR-BROKER-001, FR-BROKER-002, FR-BROKER-003 | AC-HEALTH-001, AC-HEALTH-002, AC-BROKER-001, AC-BROKER-002, AC-BROKER-003 | P2 / T003,T004 | P1 | `$THIRD_REVIEW_ROOT/lib/adapters/antigravity.mjs` | `见本 Phase Verify 的 gate_cmd（唯一命令来源）` / ORACLE-BROKER-HEALTH |
| D-003 / OI scope | FR-PREFLIGHT-001, FR-PREFLIGHT-002, FR-PREFLIGHT-003, FR-CLEANUP-005 | AC-PREFLIGHT-001, AC-PREFLIGHT-002, AC-PREFLIGHT-003, AC-CLEANUP-005 | P3 / T005,T006 | P2 | `skills/wh-review/scripts/third-review-host-config.mjs` | `见本 Phase Verify 的 gate_cmd（唯一命令来源）` / ORACLE-PREFLIGHT-DRIFT |
| D-004 / OI scope | FR-FORMAT-001, FR-FORMAT-002, FR-FORMAT-003, FR-FORMAT-004 | AC-FORMAT-001, AC-FORMAT-002, AC-FORMAT-003, AC-FORMAT-004 | P4 / T007,T008 | P3 | `runtime/review/review-output.mjs` | `见本 Phase Verify 的 gate_cmd（唯一命令来源）` / ORACLE-FORMAT-REDLINES |
| D-005 / OI scope | FR-BINDING-001, FR-BINDING-002 | AC-BINDING-001, AC-BINDING-002 | P5 / T009,T010 | P4 | `runtime/stage/stage-runner.mjs` | `见本 Phase Verify 的 gate_cmd（唯一命令来源）` / ORACLE-FACT-BINDING |
| D-006 / OI scope | FR-CLEANUP-001, FR-CLEANUP-002, FR-CLEANUP-003 | AC-CLEANUP-001, AC-CLEANUP-002, AC-CLEANUP-003 | P6 / T011,T012 | P5 | `runtime/stage/stage-runner.mjs` | `见本 Phase Verify 的 gate_cmd（唯一命令来源）` / ORACLE-CLEANUP-NEGATIVE |
| D-007 / OI scope | FR-REBIND-001, FR-REBIND-002, FR-REBIND-003, FR-REBIND-004 | AC-REBIND-001, AC-REBIND-002, AC-REBIND-003, AC-REBIND-004 | P7 / T013,T014 | P6 | `workflows/make-decision/SKILL.md` | `见本 Phase Verify 的 gate_cmd（唯一命令来源）` / ORACLE-CONFIRM-REBIND |
| D-008 / OI scope | FR-CLEANUP-004, FR-GOV-001, FR-GOV-002, FR-GOV-003, FR-GOV-004, FR-GOV-005, FR-GOV-006, FR-GOV-007, FR-GOV-008, FR-GOV-009, FR-GOV-010 | AC-CLEANUP-004, AC-GOV-001, AC-GOV-002, AC-GOV-003, AC-GOV-004, AC-GOV-005, AC-GOV-006, AC-GOV-007, AC-GOV-008, AC-GOV-009, AC-GOV-010 | P8 / T015,T016 | P7 | `skills/spec-analyze/skill-bundle.json` | `见本 Phase Verify 的 gate_cmd（唯一命令来源）` / ORACLE-FINAL-GOVERNANCE |

## Governance Synchronization Matrix

| Governance surface | Actual files | Change / no change | Task IDs | Reason |
| --- | --- | --- | --- | --- |
| 人工确认 | `docs/standard-workflow.md`、三个 workflow SKILL | change wording, no gate move | T013/T014 | OI-26 冻结纪律与 step 12 明示 |
| 外仓授权 | 3rd-review 6 文件 | change within allowlist | T003/T004 | 用户明确授权 |
| 配置/provider | 两个 config | no change | T017 | 防止伪需求与派发收敛 |
| UI | page/routes | no change | T017 | non_ui |
| 宪法 | `constitution-checklist.md` | no change | all | 逐项核对 22 条 |

## Constitution Check

- **Constitution binding**：`{"artifact_kind":"constitution","ref":"constitution-checklist.md","hash":"91c72a0db7a77da84369d0aada56105612c21def13761f6aa7db387b8922f434","id":"CONSTITUTION","version":"2026-09-17","clause_count":22}`
- **F1**：遵守；以精确文件边界、targeted RED/GREEN、独立 review、事实非门禁与人工确认不移动为证。
- **F2**：遵守；以精确文件边界、targeted RED/GREEN、独立 review、事实非门禁与人工确认不移动为证。
- **F3**：遵守；以精确文件边界、targeted RED/GREEN、独立 review、事实非门禁与人工确认不移动为证。
- **F4**：遵守；以精确文件边界、targeted RED/GREEN、独立 review、事实非门禁与人工确认不移动为证。
- **F5**：遵守；以精确文件边界、targeted RED/GREEN、独立 review、事实非门禁与人工确认不移动为证。
- **F6**：遵守；以精确文件边界、targeted RED/GREEN、独立 review、事实非门禁与人工确认不移动为证。
- **F7**：遵守；以精确文件边界、targeted RED/GREEN、独立 review、事实非门禁与人工确认不移动为证。
- **F8**：遵守；以精确文件边界、targeted RED/GREEN、独立 review、事实非门禁与人工确认不移动为证。
- **F9**：遵守；以精确文件边界、targeted RED/GREEN、独立 review、事实非门禁与人工确认不移动为证。
- **F10**：遵守；以精确文件边界、targeted RED/GREEN、独立 review、事实非门禁与人工确认不移动为证。
- **F11**：遵守；以精确文件边界、targeted RED/GREEN、独立 review、事实非门禁与人工确认不移动为证。
- **Q1**：遵守；以精确文件边界、targeted RED/GREEN、独立 review、事实非门禁与人工确认不移动为证。
- **Q2**：遵守；以精确文件边界、targeted RED/GREEN、独立 review、事实非门禁与人工确认不移动为证。
- **Q3**：遵守；以精确文件边界、targeted RED/GREEN、独立 review、事实非门禁与人工确认不移动为证。
- **S1**：遵守；以精确文件边界、targeted RED/GREEN、独立 review、事实非门禁与人工确认不移动为证。
- **S2**：遵守；以精确文件边界、targeted RED/GREEN、独立 review、事实非门禁与人工确认不移动为证。
- **S3**：遵守；以精确文件边界、targeted RED/GREEN、独立 review、事实非门禁与人工确认不移动为证。
- **S4**：遵守；以精确文件边界、targeted RED/GREEN、独立 review、事实非门禁与人工确认不移动为证。
- **S5**：遵守；以精确文件边界、targeted RED/GREEN、独立 review、事实非门禁与人工确认不移动为证。
- **S6**：遵守；以精确文件边界、targeted RED/GREEN、独立 review、事实非门禁与人工确认不移动为证。
- **S7**：遵守；以精确文件边界、targeted RED/GREEN、独立 review、事实非门禁与人工确认不移动为证。
- **S8**：遵守；以精确文件边界、targeted RED/GREEN、独立 review、事实非门禁与人工确认不移动为证。

## 11. 验收标准

以下为 accepted spec 四段验收卡的字节级副本，供计划 oracle 绑定：

```json
> - [ ] **AC-WAIT-001**：到期前终态复检消除白等，阈值数字不动
  - **需求**：FR-WAIT-001；场景：SCN-002
验证：构造 operation 已 terminal 但等待侧轮询尚未察觉的审查场景，观察等待侧是否在上限到期前复检并直接消费结果；同时 diff 核对 1_200_000 阈值未被改动。
通过：不再空等到 20 分钟上限，终态结果被直接消费；阈值数字可 diff 验证未变。
失败：仍空等到 20 分钟上限才返回，或 1_200_000 数值被改动而无现场依据。
证据：针对性测试记录与复现命令输出（test）。
> - [ ] **AC-WAIT-002**：不可用审查不得被复用钉死，judged retry 仍可用
  - **需求**：FR-WAIT-002；场景：SCN-003
验证：构造 REVIEW_WAIT_EXCEEDED 且 provider_attempts 为 0 的不可用审查，同 key 再次发起请求观察是否复用；再以显式 judged retry 发起。
通过：同 key 新请求不复用该失败 attempt（不 reused）；显式 judged retry 被放行；不存在永久不可重试的不可用审查。
失败：同 key 请求出现 reused:true 复用失败 attempt，或显式 retry 被拒且无材料依据。
证据：attempt 目录原件与针对性测试（test）。
> - [ ] **AC-HEALTH-001**：agy 超时被诚实识别为 PROVIDER_PRINT_TIMEOUT 而非模型空输出
  - **需求**：FR-HEALTH-001；场景：SCN-004
验证：用 --print-timeout 2s 最小复现构造 agy 超时（退出码 0、空 stdout、stderr 79 字节 print timeout 警告），经 wh-review 调用链观察产出事实类别。
通过：产出可区分的超时事实（PROVIDER_PRINT_TIMEOUT），不再出现 emitted no final text 归类；授权仅 2 处（argv +1 元素、parse 改读 stderr）。
失败：仍被归为 PROVIDER_OUTPUT_INVALID「emitted no final text」，或改动越出授权文件。
证据：复现 attempt 的 stderr/stdout 与归类字段原件（evidence）。
> - [ ] **AC-HEALTH-002**：超时归类正确并纳入重发
  - **需求**：FR-HEALTH-002；场景：SCN-004、SCN-006
验证：检查 provider-failure 对 agy print timeout 串的归类与 recovery-policy 重发表；核对材料中 PROVIDER_PRINT_TIMEOUT 与 PROCESS_TIMEOUT 的层间映射写明。
通过：该串识别为超时类（进入重发表的 PROCESS_TIMEOUT），不再误归 PROCESS_EXIT_NONZERO；层间映射在材料可查。
失败：仍归 PROCESS_EXIT_NONZERO，或 PROCESS_TIMEOUT 不在可重发表，或两名映射未写明。
证据：针对性测试与材料节（test）。
> - [ ] **AC-HEALTH-003**：非终态成员级事实暴露并被轮询消费
  - **需求**：FR-HEALTH-003；场景：SCN-006
验证：运行含 antigravity 的 managed 审查，在成员进入失败态后读取非终态信封与 WH 轮询行为；核对守卫测试 managed-session-lifecycle.test.mjs:58-71 已同批改并写明理由。
通过：非终态信封暴露成员 status、error.code、last_progress_at_ms；WH 立即得到可判定事实，不必等满 20 分钟；守卫测试改到新边界且理由写明，必需键与 fail-closed 未放宽。
失败：非终态信封无成员级事实，或 WH 仍须等满时限，或守卫测试未同批改。
证据：信封原件、守卫测试改动记录与材料理由（test）。
> - [ ] **AC-HEALTH-004**：真卡死与健康但慢可区分
  - **需求**：FR-HEALTH-004；场景：SCN-006
验证：对照 agy stderr 含 print timeout 串的失败 attempt 与健康但慢的 attempt，观察归类与处置差异。
通过：前者识别为超时类失败并可触发停止/重发，后者按健康但慢处理不被误杀；停滞的可观察判据为成员 error.code 已置位或 provider 自报超时，无自报信号的真卡死由既有 20 分钟上限与到期前终态复检兜底；spec 不新增 broker 状态机。
失败：两类 attempt 不可区分、健康但慢成员被误杀，或为卡死检测新增状态机/墙钟判死。
证据：两类 attempt 事实对照（evidence）。
> - [ ] **AC-BROKER-001**：single_round 与 full_only 各获得一次 fresh_execution 重发
  - **需求**：FR-BROKER-001；场景：SCN-006
验证：对 single_round 与 full_only 各构造一次可重发类失败（如 PROCESS_TIMEOUT），观察重发计数。
通过：两模式均获得一次 fresh_execution 重发。
失败：重发仍被关闭（fresh_execution_retry_count 为 0）。
证据：针对性测试与 broker 记录（test）。
> - [ ] **AC-BROKER-002**：same_session_repair 无 resume 时降级 fresh_execution
  - **需求**：FR-BROKER-002；场景：SCN-006
验证：构造 same_session_repair 策略下无 resume 可用的失败，观察降级路径。
通过：自动降级为 fresh_execution 并执行，不再静默 no-op。
失败：same_session_repair_count 为 0 且无 fresh_execution 发生。
证据：针对性测试与 broker 记录（test）。
> - [ ] **AC-BROKER-003**：attempt 公开事实以 parse 结果为准
  - **需求**：FR-BROKER-003；场景：SCN-004
验证：复现进程 ok 但输出解析失败的场景，读取公开 attempt 事实。
通过：attempts[0] 记录与 parse 结果一致（failed 带错误码），进程失败与解析失败可归因区分。
失败：失败 attempt 仍被记为 completed 且 error 为 null。
证据：公开 attempt 事实原件与复现记录（evidence）。
> - [ ] **AC-BROKER-004**：attempt.schema.json 登记新增字段并修抛错缺口
  - **需求**：FR-BROKER-004；场景：SCN-004
验证：审查 attempt.schema.json 属性表与新增字段登记；复跑 review-result 写 execution 字段路径。
通过：新增字段有名字、类型、枚举、生产者、唯一 consumer 与删除条件——process_outcome（ok/exit_nonzero/timeout/launch_failure）与 parse_outcome（ok/invalid/empty_output）两项已按契约登记且组合可归因区分进程失败与解析失败；写事实不再抛 TypeError。
失败：schema 未登记新字段，或写 execution 字段仍抛错。
证据：schema 改动与针对性测试（test）。
> - [ ] **AC-PREFLIGHT-001**：非法 host_provider 在派发前被拦下
  - **需求**：FR-PREFLIGHT-001；场景：SCN-005
验证：以 host_provider 取 claude 调用 wh-review run。
通过：在 buildBundle、加锁、dispatch 之前落 blocked_before_dispatch，provider_attempts 为 0。
失败：通过 WH 预检到达 3rd-review 才在 broker 处失败。
证据：预检拦截 attempt 原件（test）。
> - [ ] **AC-PREFLIGHT-002**：model id / CLI 可执行性 / 认证 / 活性探测四项预检生效
  - **需求**：FR-PREFLIGHT-002；场景：SCN-005
验证：分别以不存在的 model id（取 `agy models` 清单外值）、不可执行的 CLI、形状非法的认证、活性探测失败的 provider 发起审查。
通过：四项均在 buildBundle、加锁、dispatch 之前被拦下，落 blocked_before_dispatch 且 provider_attempts 为 0，各带结构化 error.code（MODEL_ID_INVALID / CLI_UNAVAILABLE / AUTH_INVALID / ACTIVE_PROBE_FAILED）与预检诊断字段；单 provider 被拦时该 provider 跳过、其余 provider 照常派发；同组全部被拦时本次请求在 dispatch 前失败；各附针对性测试。
失败：任一项到达 dispatch 才失败，或被拦时无 exit 状态、无结构化错误码、无零派发事实可观察。
证据：四项针对性测试记录与被拦 attempt 原件（test）。
> - [ ] **AC-PREFLIGHT-003**：预检能力边界写明
  - **需求**：FR-PREFLIGHT-003；场景：SCN-005、SCN-006
验证：核对材料与预检文档中的能力边界声明。
通过：写明 antigravity 型运行时失败静态预检原理上抓不到、由审查中健康检测承接。
失败：未写明边界，或宣称预检可拦截运行时失败。
证据：材料节与文档核对记录（manual）。
> - [ ] **AC-FORMAT-001**：甲类误杀修复（不连坐、保原 code、不吞 parse 错）
  - **需求**：FR-FORMAT-001；场景：SCN-007
验证：构造成员 output 含一个 /xxx 路径的组审查与普通 broker 失败 message 含路径的场景。
通过：只 fail 越界成员、组记 partial；路径检查只扫结构化路径字段；脱敏保原 code 并附 cause_code；空 catch 不再吞 parse 错；死常量删除；截断标记覆盖所有丢段路径。
失败：整组被判 PUBLIC_RESULT_INVALID、真实 code 丢失或 parse 错仍被吞。
证据：甲类逐条针对性测试（test）。
> - [ ] **AC-FORMAT-002**：CJK 脱敏边界正确
  - **需求**：FR-FORMAT-002；场景：SCN-007
验证：对含 CJK 标点的材料调用 redactProviderHostPaths，脱敏前后逐项比对 token 计数。
通过：路径后紧跟的非路径文本不被吞掉；DEF-01、取消理由： 等 token 计数逐项不变。
失败：仍出现吞并正文（如 DEF-01 计数 20→19、总字节 -1196 的形态）。
证据：脱敏前后对照输出（test）。
> - [ ] **AC-FORMAT-003**：乙类格式宽容取得 findings
  - **需求**：FR-FORMAT-003；场景：SCN-008
验证：用 JSONL、多围栏唯一含 findings、更大包裹、顶层多余键、severity 别名的样本输出跑解析；用带额外键的非终态信封跑客户端校验。
通过：各样本均取得 findings；非终态信封忽略额外键且保留必需 5 键；抽取优先级（JSONL＞单 fence JSON＞首个可解析候选）、severity 别名映射与「只丢该条不整员失败」规则逐项可复现。
失败：任一格式样本仍整员判 OUTPUT_INVALID，或多候选/别名处理结果不确定。
证据：乙类样本测试套件（test）。
> - [ ] **AC-FORMAT-004**：丙类 7 条红线原样保留
  - **需求**：FR-FORMAT-004；场景：SCN-008
验证：diff 核对 7 条红线相关代码与断言；核对反向断言改写的理由与新边界说明。
通过：私路 fail-closed、finding 落真实材料行、minimum_heterologous、材料白名单与固定指令、材料身份绑定、envelope 必需键、非 minor 需 evidence_kind/evidence/root_cause 逐项未改动；反向断言改动写明理由。
失败：任一红线被放宽，或断言改动无理由。
证据：diff 与材料说明核对（manual）。
> - [ ] **AC-BINDING-001**：两轨 review 事实各绑本轨 result
  - **需求**：FR-BINDING-001；场景：SCN-009
验证：先只提交 direction receipt 运行 execute，再只提交 detail receipt 运行 execute，读取两条 quality fact 的指向。
通过：direction_review 绑 direction result、detail_review 绑 detail result；缺轨不产生错绑 recorded 事实。
失败：任一轨事实指向另一轨 result。
证据：两次 execute 落盘 fact 原件（test）。
> - [ ] **AC-BINDING-002**：一 subject 不并存两条冲突事实
  - **需求**：FR-BINDING-002；场景：SCN-009
验证：修复后核对质量事实账本中 review subject 的事实集合。
通过：同一 subject 的 current 事实不存在两条指向不同 result 的冲突事实（历史 fact 保留为 provenance 不参与当前判定）。
失败：仍存在一 subject 两条指向不同 result 的事实。
证据：quality/facts 账本核对记录（evidence）。
> - [ ] **AC-CLEANUP-001**：重采残留修复且净行数为负
  - **需求**：FR-CLEANUP-001；场景：SCN-011
验证：diff 统计重采相关改动并跑发布路径针对性测试。
通过：{fresh:true} 两处强制全量重采去除；freshness.mjs 死代码与 3 处测试引用删除；净行数为负；源稳定性防护由既有 revision/hashes 检查承担且有测试覆盖。
失败：采用接缝映射表方案，或去掉后出现事实绑到漂移源的可复现路径。
证据：行数表与针对性测试（test）。
> - [ ] **AC-CLEANUP-002**：15 分钟记录锁净减删除
  - **需求**：FR-CLEANUP-002；场景：SCN-011
验证：删除前做全仓 consumer 扫描（含测试与工具引用）与安全不变式审查；删除后复算行数。
通过：函数本体、专属锁、仅服务它的私有导出与测试全部删除，行数净减；材料中给出无消费者证明。
失败：仍保留不可达记录锁，或净行数为正，或无 consumer 证明。
证据：consumer 扫描输出与行数表（evidence）。
> - [ ] **AC-CLEANUP-003**：DEF-09 闭合
  - **需求**：FR-CLEANUP-003；场景：SCN-011
验证：构建期删除 ui-e2e-contract-dogfood.test.mjs:223 残留字面量并检索活动命中。
通过：quality-verify.v1 活动命中数降为 0，受影响测试 GREEN。
失败：残留字面量仍在或测试红。
证据：命中检索输出与测试记录（test）。
> - [ ] **AC-CLEANUP-004**：两红灯转绿且基线写明
  - **需求**：FR-CLEANUP-004；场景：SCN-011
验证：重跑 check-skill-closure 与 smoke-local-skill-dispatch；核对声明对齐文件数与披露措辞行数。
通过：两检查 exit 0；声明对齐为 4 个声明文件 9 行值替换净 0（spec-analyze 2 行、stage-handoff 1 行、stage-reflection 1 行、catalog.yaml 5 行）；约 +10 行 outcome 披露措辞补回；材料写明接受 25b44430 字节为基线；stage-reflection-wiring 第三条回归闭合。
失败：以更新声明掩盖漂移、回退内容，或未写明基线接受。
证据：两检查退出码与行数表（test）。
> - [ ] **AC-CLEANUP-005**：失败率本仓可控修复落地
  - **需求**：FR-CLEANUP-005；场景：SCN-001、SCN-004
验证：跑三条实现 bug 的针对性测试并构造源漂移止损场景。
通过：锚点校验仍要求 existsSync + 真实行号；失败码不再大批落为未归类；源漂移事实成立时立即中止等待轮询、attempt 记 failed 且 error.code=REVIEW_SOURCE_DRIFT、未完 session 解耦事实可观察（不调用 cancelManaged）；每条附针对性测试。
失败：锚点校验降级、引入墙钟判死，或失败码仍大批未归类。
证据：针对性测试记录（test）。
> - [ ] **AC-REBIND-001**：make-decision 收口材料冻结
  - **需求**：FR-REBIND-001；场景：SCN-010
验证：核对 workflows/make-decision/SKILL.md:219-225 改写与材料中四个自造章节精确节名计数。
通过：SKILL 已写明 step 1–10 写材料、step 11–14 只落 task store；四节精确节名计数为 0。
失败：SKILL 未改或四节仍在。
证据：SKILL 文本与节名计数输出（manual）。
> - [ ] **AC-REBIND-002**：build-spec 冻结语义补记
  - **需求**：FR-REBIND-002；场景：SCN-010
验证：核对 build-spec SKILL 与 docs/standard-workflow.md:191-195。
通过：两处明写 freeze-spec / review-frozen-spec 之后不得改写 decision-log.md，规格歧义按 fallback 协议路由回 make-decision。
失败：任一处未补记。
证据：两处文本核对（manual）。
> - [ ] **AC-REBIND-003**：build-plan 可写区与确认补记
  - **需求**：FR-REBIND-003；场景：SCN-010
验证：核对 build-plan SKILL:101-108 与 docs/standard-workflow.md:239。
通过：前者明写确认后唯一可写区是 tasks.md 执行状态填写区；后者补记 build-plan step 12 人工确认要求；两处不再矛盾。
失败：未补记或矛盾仍在。
证据：两处文本核对（manual）。
> - [ ] **AC-REBIND-004**：读侧对称生效且实质改动仍失效
  - **需求**：FR-REBIND-004；场景：SCN-010
验证：构造三类变化——仅改写 tasks.md 执行状态填写区、仅发生非材料快照变化、decision-log.md 实质改动——分别调用 currentConfirmationCandidate 判定。
通过：前两类仍命中既有确认（返回同一 confirmation ref）；第三类使确认失效；human-confirmation-v3.test.mjs:296-308 断言已按新边界更新并注明授权来源。
失败：实质改动也被豁免，或断言只改不写理由。
证据：三类场景判定输出与测试改动记录（test）。
> - [ ] **AC-GOV-001**：人工确认点零改动
  - **需求**：FR-GOV-001；场景：SCN-011
验证：审查本任务全量 diff 中 talk/grill/confirm/authorize 相关改动。
通过：无任何减少、增加或搬移人工确认点的改动。
失败：出现相关改动。
证据：全量 diff 审查记录（manual）。
> - [ ] **AC-GOV-002**：零采集面、零收益数字
  - **需求**：FR-GOV-002；场景：SCN-011
验证：审查 diff 与材料措辞。
通过：无新增采集文件、字段或命令；不出现未实测收益数字；不以 fixture/simulation 充当 after。
失败：出现任一。
证据：diff 与材料核对记录（manual）。
> - [ ] **AC-GOV-003**：净减或持平与例外清单约束
  - **需求**：FR-GOV-003；场景：SCN-011
验证：逐文件行数表对照例外清单 10 条。
通过：清单外每条修复净减或持平；例外逐条登记项、依据与删除条件。
失败：清单外净增，或删除被换成搬家/改名/加统一层。
证据：逐文件行数表（evidence）。
> - [ ] **AC-GOV-004**：两红灯转绿且不劣化
  - **需求**：FR-GOV-004；场景：SCN-011
验证：跑 check-skill-closure、smoke-local-skill-dispatch、verify-structure、run-checks 并对照基线。
通过：前两者 exit 0；后两者不劣化；无新增 lint 错误（对照本任务现场复算的 28 error 基线）。
失败：任一不满足，或以掩盖方式变绿。
证据：四命令退出码与输出（test）。
> - [ ] **AC-GOV-005**：延期文件更新交付
  - **需求**：FR-GOV-005；场景：SCN-011
验证：核对延期文件与 decision-log 处置表逐条一致。
通过：DEF-01~07 每条有终态、取消理由、触发条件、owner；DEF-08/DEF-09 完整定义。
失败：未更新或出现无理由悬空条目。
证据：延期文件文本（manual）。
> - [ ] **AC-GOV-006**：写入面守住
  - **需求**：FR-GOV-006；场景：SCN-011
验证：核对材料写入入口、identity 写者与 quality 写者面。
通过：材料入口仍 2 个、identity 仍单写者、quality 多写者面未扩大、第三套材料写入实现未启用。
失败：引入第三材料写入者或第二 identity 写者。
证据：写入面核对记录（manual）。
> - [ ] **AC-GOV-007**：跨仓授权边界守住
  - **需求**：FR-GOV-007；场景：SCN-012
验证：核对 3rd-review 仓 diff 与两个 config 文件状态、antigravity 派发配置。
通过：写入逐条落在授权 6 文件清单内；两 config 未改；派发未减少。
失败：越界写入或 config 被改。
证据：跨仓 diff 与 config 状态核对（manual）。
> - [ ] **AC-GOV-008**：零页面维持
  - **需求**：FR-GOV-008；场景：SCN-011
验证：审查 diff 中页面、路由、前端依赖。
通过：无新增；build-reflection-page.mjs 仍无生产调用者；UI applicability 保持 non_ui。
失败：出现新增页面或前端依赖。
证据：diff 审查记录（manual）。
> - [ ] **AC-GOV-009**：无原件数字全部标注
  - **需求**：FR-GOV-009；场景：SCN-011
验证：审查材料引用的历史数字。
通过：无原件的历史数字均标注「无原件不可复核」；根因结论附文件：行号与可复现只读命令。
失败：未标注即当作事实引用，或以其作为收益基线。
证据：材料核对记录（manual）。
> - [ ] **AC-GOV-010**：验收账本唯一且逐项可判
  - **需求**：FR-GOV-010；场景：SCN-011
验证：核对 acceptance_criterion facts 账本。
通过：每条修复的通过判据与失败判据逐项落入账本；无单独以「阻塞不再发生」充当判据的条目。
失败：判据缺失或账本形式不符。
证据：账本 facts 清单（evidence）。
```

## Phase P1 — WorkflowHub 先容忍非终态成员事实与等待复检

### Goal

先让 WorkflowHub 安全读取非终态成员 status/error.code/last_progress_at_ms，并修复终态复检与不可用审查复用；保持 20 分钟阈值且不调用 cancelManaged。本 Phase 同时落地 FR-FORMAT-003 的 consumer 侧 extra top-level key 容忍与 attempt schema 的 process_outcome/parse_outcome 登记：按 RISK-009 同批约束，WH consumer/schema 必须先于 P2 producer 发布新字段之前兼容，避免半发布窗口。

### Files

- **MODIFY**：`skills/wh-review/scripts/review-provider-client.mjs`
- **MODIFY**：`skills/wh-review/scripts/simple-review-runner.mjs`
- **MODIFY**：`runtime/review/review-record-route.mjs`
- **MODIFY**：`tests/review/review-managed-lifecycle.test.mjs`
- **MODIFY**：`tests/review/review-record-route.test.mjs`
- **MODIFY**：`skills/wh-review/scripts/__tests__/review-provider-client-v3.test.mjs`
- **MODIFY**：`runtime/review/schemas/attempt.schema.json`
- **MODIFY**：`skills/wh-review/scripts/review-result.mjs`
- **MODIFY**：`skills/wh-review/scripts/__tests__/simple-contracts.test.mjs`
- **MODIFY**：`skills/wh-review/scripts/__tests__/review-writer-taskhandle.test.mjs`
- **DO NOT TOUCH**：`~/.config/workflowhub/config.json` — 配置禁止改动
- **DO NOT TOUCH**：`~/.config/3rd-review/config.json` — 配置禁止改动
- **DO NOT TOUCH**：`specs/archive/**` — 归档只读

### Tasks

- T001 RED：建立 WH-CONSUMER 失败证据。
- T002 GREEN：最小实现并保持同命令同 oracle。

### Verify

ORACLE-WH-CONSUMER



- **Target**：AC-WAIT-001, AC-WAIT-002, AC-HEALTH-003, AC-HEALTH-004, AC-BROKER-004, AC-FORMAT-003, AC-FORMAT-004
- **gate_cmd**：`./node_modules/.bin/vitest run tests/review/review-managed-lifecycle.test.mjs tests/review/review-record-route.test.mjs skills/wh-review/scripts/__tests__/review-provider-client-v3.test.mjs skills/wh-review/scripts/__tests__/simple-contracts.test.mjs skills/wh-review/scripts/__tests__/review-writer-taskhandle.test.mjs --poolOptions.forks.singleFork --no-fileParallelism --testTimeout=15000 --hookTimeout=15000`
- **expected_exit**：RED=1；GREEN=0。
- **evidence_path**：`quality/tests/output/P1-red-green.txt`
- **Oracle**：ORACLE-WH-CONSUMER，通过与失败边界逐项对应 spec 四段卡。

### Knowledge

只使用已核实现有接口；缺失事实保持 unavailable，不把 review/test 当推进许可证。

### STOP

命令损坏、越出 Files、需要改 config/provider/确认点、放宽七红线或产生新设计时立即停止并回 owning material。

### Done

目标 AC 有真实 RED/GREEN 原件、changed-file allowlist 与独立 Phase review；未执行时不得勾选。

### Risks and rollback

风险为越界或半发布；只回滚本 Phase，保留原失败与 provenance。

## Phase P2 — 3rd-review 健康、重发与公开 attempt 事实

### Goal

在 WH 已兼容后，使 antigravity 超时诚实分类、一次 fresh_execution 生效、attempt 按 parse 结果落事实，并只暴露受控非终态成员字段。T003 额外包含 BR→WH 跨仓 envelope 确定性 seam 断言：以 fake envelope 端到端验证 WH consumer（P1 已落地）能读取 BR 新公开字段，成员级私路违规只 fail 该成员、group 记 partial。

### Files

- **MODIFY**：`$THIRD_REVIEW_ROOT/lib/adapters/antigravity.mjs`
- **MODIFY**：`$THIRD_REVIEW_ROOT/lib/provider-failure.mjs`
- **MODIFY**：`$THIRD_REVIEW_ROOT/lib/recovery-policy.mjs`
- **MODIFY**：`$THIRD_REVIEW_ROOT/lib/broker.mjs`
- **MODIFY**：`$THIRD_REVIEW_ROOT/lib/workflowhub-result-v3.mjs`
- **MODIFY**：`$THIRD_REVIEW_ROOT/test/managed-session-lifecycle.test.mjs`
- **DO NOT TOUCH**：`~/.config/workflowhub/config.json` — 配置禁止改动
- **DO NOT TOUCH**：`~/.config/3rd-review/config.json` — 配置禁止改动
- **DO NOT TOUCH**：`specs/archive/**` — 归档只读

### Tasks

- T003 RED：建立 BROKER-HEALTH 失败证据。
- T004 GREEN：最小实现并保持同命令同 oracle。

### Verify

ORACLE-BROKER-HEALTH



- **Target**：AC-HEALTH-001, AC-HEALTH-002, AC-BROKER-001, AC-BROKER-002, AC-BROKER-003, AC-HEALTH-003, AC-HEALTH-004
- **gate_cmd**：`bash -c 'cd /Users/Hugh/Hugh/Project/3rd-review && node --test --test-timeout=30000 test/antigravity-adapter.test.mjs test/provider-failure.test.mjs test/recovery-policy.test.mjs test/broker.test.mjs test/managed-session-lifecycle.test.mjs test/workflowhub-result-v3.test.mjs test/workflowhub-result-v3-hardening.test.mjs test/output-sanitization.test.mjs'`
- **expected_exit**：RED=1；GREEN=0。
- **evidence_path**：`quality/tests/output/P2-red-green.txt`
- **Oracle**：ORACLE-BROKER-HEALTH，通过与失败边界逐项对应 spec 四段卡。

### Knowledge

只使用已核实现有接口；缺失事实保持 unavailable，不把 review/test 当推进许可证。

### STOP

命令损坏、越出 Files、需要改 config/provider/确认点、放宽七红线或产生新设计时立即停止并回 owning material。

### Done

目标 AC 有真实 RED/GREEN 原件、changed-file allowlist 与独立 Phase review；未执行时不得勾选。

### Risks and rollback

风险为越界或半发布；只回滚本 Phase，保留原失败与 provenance。

## Phase P3 — 派发前预检、等待止损与源漂移分类

### Goal

在 bundle、锁和 dispatch 前完成四类静态预检；运行期源漂移立即停止本仓等待并保留 judged retry，不声称静态预检能抓运行期空输出。

预检契约在本计划定死，不推迟到 build-code：数据源为 3rd-review host 配置与 `SUPPORTED_PROVIDER_IDS` 白名单对照；入口为 `third-review-host-config.mjs` 的 `adapterOf` 白名单校验加 `simple-review-runner.mjs` 的 `runStaticPreflight`；总预算 ≤5s 且预检自身零 provider 派发；结构化错误码固定为 `MODEL_ID_INVALID`、`CLI_UNAVAILABLE`、`AUTH_INVALID`、`ACTIVE_PROBE_FAILED`；单 provider 失败只跳过该 provider，全部失败才 `blocked_before_dispatch` 且 `provider_attempts=0`；不新增 config 项、不新增第二 timer。逐 provider 的 CLI 名称取自 3rd-review host 配置的 provider 定义（不硬编码、不新增配置项），每项检查独立超时 2000ms、四项合计不超过 5s；MODEL_ID_INVALID 在 bundle 前由 host 配置解析层产生，CLI_UNAVAILABLE 由 simple-review-runner 的静态只读检查产生，AUTH_INVALID 由只读凭证存在性检查产生，ACTIVE_PROBE_FAILED 由单个只读活性探测产生；四个探针各自的结构化结果与注入 seam 由 P3 gate 中的 third-review-host-config.test.mjs 与 simple-review-runner.test.mjs 断言。

### Files

- **MODIFY**：`skills/wh-review/scripts/third-review-host-config.mjs`
- **MODIFY**：`skills/wh-review/scripts/simple-review-runner.mjs`
- **MODIFY**：`runtime/review/review-record-route.mjs`
- **MODIFY**：`skills/wh-review/scripts/review-result.mjs`
- **MODIFY**：`skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs`
- **MODIFY**：`skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs`
- **MODIFY**：`tests/contract/review-material-change-redispatch.test.mjs`
- **MODIFY**：`tests/review/review-record-route.test.mjs`
- **DO NOT TOUCH**：`~/.config/workflowhub/config.json` — 配置禁止改动
- **DO NOT TOUCH**：`~/.config/3rd-review/config.json` — 配置禁止改动
- **DO NOT TOUCH**：`specs/archive/**` — 归档只读

### Tasks

- T005 RED：建立 PREFLIGHT-DRIFT 失败证据。
- T006 GREEN：最小实现并保持同命令同 oracle。

### Verify

ORACLE-PREFLIGHT-DRIFT



- **Target**：AC-PREFLIGHT-001, AC-PREFLIGHT-002, AC-PREFLIGHT-003, AC-CLEANUP-005
- **gate_cmd**：`./node_modules/.bin/vitest run skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs tests/contract/review-material-change-redispatch.test.mjs tests/review/review-record-route.test.mjs --poolOptions.forks.singleFork --no-fileParallelism --testTimeout=15000 --hookTimeout=15000`
- **expected_exit**：RED=1；GREEN=0。
- **evidence_path**：`quality/tests/output/P3-red-green.txt`
- **Oracle**：ORACLE-PREFLIGHT-DRIFT，通过与失败边界逐项对应 spec 四段卡。

### Knowledge

只使用已核实现有接口；缺失事实保持 unavailable，不把 review/test 当推进许可证。

### STOP

命令损坏、越出 Files、需要改 config/provider/确认点、放宽七红线或产生新设计时立即停止并回 owning material。

### Done

目标 AC 有真实 RED/GREEN 原件、changed-file allowlist 与独立 Phase review；未执行时不得勾选。

### Risks and rollback

风险为越界或半发布；只回滚本 Phase，保留原失败与 provenance。

## Phase P4 — 格式宽容、CJK 脱敏与七条红线

### Goal

按确定性优先级提取异源 findings、只丢坏 finding/越界成员、修 CJK 边界与错误分类，同时原样保留七条 fail-closed 红线。FR-FORMAT-003 的 consumer 侧 extra-key 容忍已在 P1 落地，本 Phase 只保留解析优先级、脱敏与截断余项，不重复实现。

### Files

- **MODIFY**：`runtime/review/review-output.mjs`
- **MODIFY**：`skills/wh-review/scripts/review-materials.mjs`
- **MODIFY**：`skills/wh-review/scripts/review-input-bounds.mjs`
- **MODIFY**：`skills/wh-review/scripts/review-provider-client.mjs`
- **MODIFY**：`skills/wh-review/scripts/simple-review-runner.mjs`
- **MODIFY**：`skills/wh-review/scripts/__tests__/material-redaction.test.mjs`
- **MODIFY**：`tests/contract/review-materials-contract.test.mjs`
- **MODIFY**：`skills/wh-review/scripts/__tests__/review-runner.test.mjs`
- **MODIFY**：`skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs`
- **MODIFY**：`skills/wh-review/scripts/__tests__/wh-review-cli-bounds.test.mjs`
- **MODIFY**：`skills/wh-review/scripts/__tests__/simple-contracts.test.mjs`
- **MODIFY**：`tests/contract/review-layering.test.mjs`
- **DO NOT TOUCH**：`~/.config/workflowhub/config.json` — 配置禁止改动
- **DO NOT TOUCH**：`~/.config/3rd-review/config.json` — 配置禁止改动
- **DO NOT TOUCH**：`specs/archive/**` — 归档只读

### Tasks

- T007 RED：建立 FORMAT-REDLINES 失败证据。
- T008 GREEN：最小实现并保持同命令同 oracle。

### Verify

ORACLE-FORMAT-REDLINES



- **Target**：AC-FORMAT-001, AC-FORMAT-002, AC-FORMAT-003, AC-FORMAT-004
- **gate_cmd**：`./node_modules/.bin/vitest run skills/wh-review/scripts/__tests__/material-redaction.test.mjs tests/contract/review-materials-contract.test.mjs skills/wh-review/scripts/__tests__/review-runner.test.mjs skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs skills/wh-review/scripts/__tests__/wh-review-cli-bounds.test.mjs skills/wh-review/scripts/__tests__/simple-contracts.test.mjs tests/contract/review-layering.test.mjs --poolOptions.forks.singleFork --no-fileParallelism --testTimeout=15000 --hookTimeout=15000`
- **expected_exit**：RED=1；GREEN=0。
- **evidence_path**：`quality/tests/output/P4-red-green.txt`
- **Oracle**：`ORACLE-FORMAT-REDLINES`；七文件 gate 必须逐项覆盖四个 FORMAT AC、成功路径与七条 fail-closed 红线负例；RED 仅接受目标 assertion 非零，GREEN 使用同一 command 且为 0。
- **Coverage**：七文件为 `skills/wh-review/scripts/__tests__/material-redaction.test.mjs`、`tests/contract/review-materials-contract.test.mjs`、`skills/wh-review/scripts/__tests__/review-runner.test.mjs`、`skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs`、`skills/wh-review/scripts/__tests__/wh-review-cli-bounds.test.mjs`、`skills/wh-review/scripts/__tests__/simple-contracts.test.mjs`、`tests/contract/review-layering.test.mjs`；仅覆盖列出的 FR/AC 与命名负例，不宣称全量回归、浏览器或真实 provider/network 覆盖。

### Knowledge

只使用已核实现有接口；缺失事实保持 unavailable，不把 review/test 当推进许可证。

### STOP

命令损坏、越出 Files、需要改 config/provider/确认点、放宽七红线或产生新设计时立即停止并回 owning material。

### Done

目标 AC 有真实 RED/GREEN 原件、changed-file allowlist 与独立 Phase review；未执行时不得勾选。

### Risks and rollback

风险为越界或半发布；只回滚本 Phase，保留原失败与 provenance。

## Phase P5 — 两轨质量事实绑定

### Goal

direction/detail 仅绑定本轨 result，缺轨保持 missing；保留历史 provenance（attempt schema 的 process/parse outcome 登记已在 P1 落地，本 Phase 只做双轨绑定）。

### Files

- **MODIFY**：`runtime/stage/stage-runner.mjs`
- **MODIFY**：`tests/e2e/vnext-five-stage-current.test.mjs`
- **DO NOT TOUCH**：`~/.config/workflowhub/config.json` — 配置禁止改动
- **DO NOT TOUCH**：`~/.config/3rd-review/config.json` — 配置禁止改动
- **DO NOT TOUCH**：`specs/archive/**` — 归档只读

### Tasks

- T009 RED：建立 FACT-BINDING 失败证据。
- T010 GREEN：最小实现并保持同命令同 oracle。

### Verify

ORACLE-FACT-BINDING

- **Target**：AC-BINDING-001, AC-BINDING-002
- **gate_cmd**：`./node_modules/.bin/vitest run tests/e2e/vnext-five-stage-current.test.mjs -t "binds each make-decision review fact" --poolOptions.forks.singleFork --no-fileParallelism --testTimeout=15000 --hookTimeout=15000`
- **expected_exit**：RED=1；GREEN=0。
- **evidence_path**：`quality/tests/output/P5-red-green.txt`
- **Oracle**：ORACLE-FACT-BINDING，通过与失败边界逐项对应 spec 四段卡。

### Knowledge

只使用已核实现有接口；缺失事实保持 unavailable，不把 review/test 当推进许可证。

### STOP

命令损坏、越出 Files、需要改 config/provider/确认点、放宽七红线或产生新设计时立即停止并回 owning material。

### Done

目标 AC 有真实 RED/GREEN 原件、changed-file allowlist 与独立 Phase review；未执行时不得勾选。

### Risks and rollback

风险为越界或半发布；只回滚本 Phase，保留原失败与 provenance。

## Phase P6 — 证据重采、私锁与 DEF-09 净减清理

### Goal

删除 fresh 强制重采、死 freshness 接口与 15 分钟专属锁，删除 DEF-09 旧字面量；保留源稳定性 revision/hash 防护。三个 freshness 测试文件（per-ac-material-freshness、freshness-consistency、verify-freshness-selection）改为删除断言语义：断言对死接口无引用且 stage-runner 2507-2511 的材料 revision/hash 稳定性防护保留，而非继续运行旧行为断言。

### Files

- **MODIFY**：`runtime/stage/stage-runner.mjs`
- **MODIFY**：`runtime/evidence/freshness.mjs`
- **MODIFY**：`skills/wh-review/scripts/wh-review-cli.mjs`
- **MODIFY**：`skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs`
- **MODIFY**：`tests/contract/per-ac-material-freshness.test.mjs`
- **MODIFY**：`tests/close/freshness-consistency.test.mjs`
- **MODIFY**：`tests/integration/verify-freshness-selection.test.mjs`
- **MODIFY**：`tests/e2e/ui-e2e-contract-dogfood.test.mjs`
- **MODIFY**：`tests/contract/performance-budget.test.mjs`
- **MODIFY**：`tests/contract/stage-runner-on-stage-end.test.mjs`
- **DO NOT TOUCH**：`~/.config/workflowhub/config.json` — 配置禁止改动
- **DO NOT TOUCH**：`~/.config/3rd-review/config.json` — 配置禁止改动
- **DO NOT TOUCH**：`specs/archive/**` — 归档只读

### Tasks

- T011 RED：建立 CLEANUP-NEGATIVE 失败证据。
- T012 GREEN：最小实现并保持同命令同 oracle。

### Verify

ORACLE-CLEANUP-NEGATIVE



- **Target**：AC-CLEANUP-001, AC-CLEANUP-002, AC-CLEANUP-003
- **gate_cmd**：`./node_modules/.bin/vitest run tests/contract/performance-budget.test.mjs tests/contract/stage-runner-on-stage-end.test.mjs skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs tests/e2e/ui-e2e-contract-dogfood.test.mjs tests/contract/per-ac-material-freshness.test.mjs tests/close/freshness-consistency.test.mjs tests/integration/verify-freshness-selection.test.mjs --poolOptions.forks.singleFork --no-fileParallelism --testTimeout=30000 --hookTimeout=15000`
- **expected_exit**：RED=1；GREEN=0。
- **evidence_path**：`quality/tests/output/P6-red-green.txt`
- **Oracle**：ORACLE-CLEANUP-NEGATIVE，通过与失败边界逐项对应 spec 四段卡。

### Knowledge

只使用已核实现有接口；缺失事实保持 unavailable，不把 review/test 当推进许可证。

### STOP

命令损坏、越出 Files、需要改 config/provider/确认点、放宽七红线或产生新设计时立即停止并回 owning material。

### Done

目标 AC 有真实 RED/GREEN 原件、changed-file allowlist 与独立 Phase review；未执行时不得勾选。

### Risks and rollback

风险为越界或半发布；只回滚本 Phase，保留原失败与 provenance。

## Phase P7 — OI-26 冻结纪律与确认读侧对称

### Goal

补齐 make-decision/build-spec/build-plan 冻结纪律和 step 12 确认说明；读侧复用合法非材料差异，decision-log 实质变化仍使确认失效。文档冻结的文本断言落在 freeze-classification-budget-usage-protocol.test.mjs（已在本 Phase gate 内），不断言未 gate 的文件。

### Files

- **MODIFY**：`workflows/make-decision/SKILL.md`
- **MODIFY**：`workflows/build-spec/SKILL.md`
- **MODIFY**：`workflows/build-plan/SKILL.md`
- **MODIFY**：`docs/standard-workflow.md`
- **MODIFY**：`runtime/stage/stage-runner.mjs`
- **MODIFY**：`tests/contract/human-confirmation-v3.test.mjs`
- **MODIFY**：`tests/contract/freeze-classification-budget-usage-protocol.test.mjs`
- **DO NOT TOUCH**：`~/.config/workflowhub/config.json` — 配置禁止改动
- **DO NOT TOUCH**：`~/.config/3rd-review/config.json` — 配置禁止改动
- **DO NOT TOUCH**：`specs/archive/**` — 归档只读

### Tasks

- T013 RED：建立 CONFIRM-REBIND 失败证据。
- T014 GREEN：最小实现并保持同命令同 oracle。

### Verify

ORACLE-CONFIRM-REBIND



- **Target**：AC-REBIND-001, AC-REBIND-002, AC-REBIND-003, AC-REBIND-004
- **gate_cmd**：`./node_modules/.bin/vitest run tests/contract/human-confirmation-v3.test.mjs tests/contract/freeze-classification-budget-usage-protocol.test.mjs --poolOptions.forks.singleFork --no-fileParallelism --testTimeout=15000 --hookTimeout=15000`
- **expected_exit**：RED=1；GREEN=0。
- **evidence_path**：`quality/tests/output/P7-red-green.txt`
- **Oracle**：ORACLE-CONFIRM-REBIND，通过与失败边界逐项对应 spec 四段卡。

### Knowledge

只使用已核实现有接口；缺失事实保持 unavailable，不把 review/test 当推进许可证。

### STOP

命令损坏、越出 Files、需要改 config/provider/确认点、放宽七红线或产生新设计时立即停止并回 owning material。

### Done

目标 AC 有真实 RED/GREEN 原件、changed-file allowlist 与独立 Phase review；未执行时不得勾选。

### Risks and rollback

风险为越界或半发布；只回滚本 Phase，保留原失败与 provenance。

## Phase P8 — 声明哈希、治理边界与最终聚合

### Goal

修复两个既有红灯并逐项审计十条治理边界、外仓授权、延期交付和唯一验收账本；最终只做一次有界的 current canonical facts readback，不把 P1–P8、provider 和跨仓检查重新串成一条长流程。

### Files

- **MODIFY**：`skills/spec-analyze/skill-bundle.json`
- **MODIFY**：`skills/stage-handoff/skill-bundle.json`
- **MODIFY**：`skills/stage-reflection/skill-bundle.json`
- **MODIFY**：`skills/catalog.yaml`
- **MODIFY**：`skills/wh-review/skill-bundle.json`
- **MODIFY**：`workflows/make-decision/SKILL.md`
- **MODIFY**：`workflows/build-spec/SKILL.md`
- **MODIFY**：`workflows/build-plan/SKILL.md`
- **MODIFY**：`workflows/build-code/SKILL.md`
- **MODIFY**：`workflows/verify-code/SKILL.md`
- **MODIFY**：`tests/contract/stage-reflection-wiring.test.mjs`
- **MODIFY**：`/Users/Hugh/Downloads/workflowhub-deferred-items-20260915.md`
- **DO NOT TOUCH**：`~/.config/workflowhub/config.json` — 配置禁止改动
- **DO NOT TOUCH**：`~/.config/3rd-review/config.json` — 配置禁止改动
- **DO NOT TOUCH**：`specs/archive/**` — 归档只读

### Tasks

- T015 RED：建立 FINAL-GOVERNANCE 失败证据。
- T016 GREEN：最小实现并保持同命令同 oracle。 同卡把 DEF-01~09 按 decision-log 来源与 owner 写入 /Users/Hugh/Downloads/workflowhub-deferred-items-20260915.md，并逐条核对一致。
- T017 FINAL：读取当前 material revision/snapshot 绑定的 canonical facts，逐项映射 38 条 AC；复用现有 receipt，不自动重跑 P1–P8、provider 或跨仓流程，缺失/过期/失败保持非通过事实。

### Verify

ORACLE-FINAL-GOVERNANCE



- **Target**：AC-CLEANUP-004, AC-GOV-001, AC-GOV-002, AC-GOV-003, AC-GOV-004, AC-GOV-005, AC-GOV-006, AC-GOV-007, AC-GOV-008, AC-GOV-009, AC-GOV-010
- **gate_cmd**：`node --input-type=module --eval '<T017 acceptance_data.execution 的 current canonical facts readback argv>' "$TASK_DIR"`；只读取当前 task facts 并按当前 material revision/snapshot 过滤，不启动 provider、跨仓测试或新的全量聚合。
- **expected_exit**：0。命令本身只负责输出逐 AC 的实际状态；`passed` 以外的 `missing`、`unavailable`、`failed`、stale 均保持非通过，由 acceptance evidence 记录，不能被 exit 0 覆盖。
- **evidence_path**：`quality/tests/T017-final-current-facts.json` 及其官方 capture output。
- **Oracle**：ORACLE-FINAL-GOVERNANCE：38 条 AC 恰好各有一条 current-fact assertion；只有 current canonical fact 为 `passed` 才满足通过判据，未覆盖的手工治理证据保持 `unavailable`。

### Knowledge

只使用已核实现有接口；缺失事实保持 unavailable，不把 review/test 当推进许可证。

### STOP

命令损坏、越出 Files、需要改 config/provider/确认点、放宽七红线或产生新设计时立即停止并回 owning material。

### Done

目标 AC 有真实 RED/GREEN 原件、changed-file allowlist 与独立 Phase review；未执行时不得勾选。

### Risks and rollback

风险为越界或半发布；只回滚本 Phase，保留原失败与 provenance。

## Complexity Trade-offs

- 复用既有 wait/recovery/parser/snapshot helpers，不建统一中间层。
- P6 以净删除为主；新增 schema 字段与守卫仅限用户授权例外。
- 不用 config 开关、第二 timer、compatibility bridge 或完整 broker 状态机掩盖问题。

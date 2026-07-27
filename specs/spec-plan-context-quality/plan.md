# 实施计划：设计上下文质量与建议式异源审查

**Input**：受控命名产物 spec.md
**Status**：Draft

## Summary

### Goal

在不改运行时架构的前提下，用稳定版本化引用把最少必要上下文交给下游：spec 保存产品事实和验收；plan 保存已读代码、工程判断和质量约束；tasks 保存静态执行设计；review 报告 findings；verify 用当前证据核对已接受设计。

### Non-goals

- 不删除或迁移 core、scripts、tests、fixtures、node_modules，不做 deletion test。
- 不修改 launcher、stage-runtime、TaskKernel、Workspace/CandidateWorkspace、dispatch、provider route 或 AJV 安装。
- 临时 bootstrap runner 的 resolution-before-pause 修复不进入本任务产品提交。
- build-code 严格审查不变；verify 不重跑 simplicity-guard 或完整代码审查。
- 不新增第二账本、packet lifecycle、token gate、质量平台或历史 accepted 改写。

### Before → After

- Before：设计产物缺少明确层级、版本身份、工程判断、最小上下文和一致性边界；review verdict 容易被误解为阶段门。
- After：每层只写自己的事实；task 用 ref/hash/ID 按需投影；v2 内容证据确定性校验；审查和 verify 用现有 wh-review/evidence 给出可恢复 findings。

## Technical Context

- **Language / runtime**：Node.js ESM；ajv 8.17.1、vitest 2.1.9。
- **Primary dependencies**：复用 ajv、vitest、TaskKernel、stage-content、wh-review；不新增依赖。
- **Storage / state**：Workspace named artifacts 和 TaskKernel append-only records；v1 只读。
- **Testing**：npx vitest run 聚焦命令；snapshot 稳定后一次 npm test；改 Skill 后 npm run check。
- **Target environment**：已认证 runner；CandidateWorkspace 只承载 artifact/snapshot，不能承载 node_modules。
- **Project type**：五阶段 AI 开发工作流技能框架。
- **Performance goals**：只观测 packet bytes/引用数；不设预算 gate。
- **Constraints**：D1/D2/D4/D5/D6/D10/D14/D15；历史只读；结构错误 fail-loud；一般 finding 只记录。
- **Scale / scope**：27 个既有文件修改、4 个新增文件；新增仅 2 个 v2 schema，其余为既有合同、Skill 和聚焦测试。
- **Relevant ADR / context**：accepted Decision Log、accepted spec.md、CONSTITUTION.md。
- **Unresolved facts**：实现前复核函数签名和测试文件；若 v1 不能无损映射，保留 v1 并报告 unknown，不迁移。

## Global Constraints

- spec 只维护 PFACT/FR/AC；plan 只维护 ANCHOR/FACT/DEC/CTRL；tasks 不写运行状态。
- 跨 artifact 引用必须有 artifact_kind、authenticated ref/hash、ID；缺失/冲突/过期即 STOP。
- v2 只扩展读取/校验；不得改写/回填 v1 或镜像历史。
- 优先复用 plan-eng-review、wh-review、现有模板、stage-content-evidence、receipt/audit；仅新增两个明确 schema。
- 审查呈现 finding、证据、影响、处置；只有现有 actionable + major|blocking 例外走用户风险记录。
- packet/返工/token 数据无正式来源即 unknown。
- CandidateWorkspace 缺 AJV 是入口错用：正式调用从已认证 runner 启动；本任务不安装、复制、软链依赖。

## Governance Synchronization Matrix

| Governance surface | Actual files | Change / no change | Task IDs | Reason |
|---|---|---|---|---|
| Project rules | AGENTS.md,CONSTITUTION.md | no change | T002,T004,T006,T008 | 仅逐项对照 |
| Workflow contracts | workflows five stages | change | T002,T004,T006,T008 | 内容、投影、审查边界 |
| Review contracts | wh-review contracts,materials,plan-eng-review | change | T005,T006 | maps/findings 规则 |
| Schemas and events | stage-content contracts,evidence,schemas | change | T001-T004 | v2 兼容合同 |
| Runtime configuration | package.json,provider config | no change | None | D14 排除 |
| Knowledge and docs | spec/plan/tasks templates | change | T002,T004 | 低上下文产物 |
| Automation gates | existing Vitest files | change | T001-T008 | 只测真实行为 |

## Code Anchors and Reuse Decisions

### Verified anchors

| Anchor | Path and symbol | Current responsibility | Intended use | Forbidden change |
|---|---|---|---|---|
| A-001 | core/stage-content-contracts.mjs:validatePlanTaskContract | v1 plan/tasks、DAG、命令、覆盖 | extend v2 parser/validator | 不建平行账本 |
| A-002 | core/stage-content-evidence.mjs:registry | typed evidence/schema/required kinds | register v2 kinds | 不改 receipt ownership |
| A-003 | core/canonical-receipt-writer.mjs:writeCanonicalAuditSummary | 消费 required content facts | reuse | 不手写 audit |
| A-004 | skills/wh-review/scripts/review-materials.mjs | frozen maps/最小材料 | extend v2 maps/bytes facts | 不送全仓/日志 |
| A-005 | workflows/build-code/SKILL.md:Phase Card | task/phase 和严格审查 | extend task projection | 不改 strict review |
| A-006 | workflows/verify-code/SKILL.md | current evidence 核对 | extend design-ID 对齐 | 不重做 code review |
| A-007 | skills/plan-eng-review/SKILL.md | lens-only 工程计划检查 | extend 九维检查 | 不加 provider/verdict |
| A-008 | scripts/stage-runtime.mjs | 正式 runner/records | reference only | 不改 runner/AJV |

### Reuse → Extend → New

| Capability | Decision | Existing candidates | Reason |
|---|---|---|---|
| spec ID/风险合同 | extend | A-001,A-002,spec template | 有 typed evidence，最小补字段 |
| plan/task 追踪 | extend | A-001,A-002,templates | v1 已有 DAG/命令/覆盖；先兼容现有 FR-01/AC-01 |
| frozen review maps | extend | A-004,contracts | 已有 maps，无 packet 平台 |
| 工程质量设计 | extend | A-007 | 已由 wh-review 加载 |
| task projection | extend | A-005 | 仅加解析/STOP |
| verify 对齐 | extend | A-006,current evidence | 不建 conformance schema |
| v2 schema | new | v1 schemas | v1 必须只读兼容 |

### Existing interface signatures

| Signature ID | Object | Verified current signature/schema | Source anchor |
|---|---|---|---|
| SIG-001 | validatePlanTaskContract | ({ spec, plan, tasks }) => { ok, errors, facts } | A-001 |
| SIG-002 | buildPlanTaskContract | ({ spec,plan,tasks,planRef,planHash,tasksRef,tasksHash }) => typed facts | A-001 |
| SIG-003 | content kind registry | kind → schema；stage → required kinds | A-002 |
| SIG-004 | wh-review maps | context_map/evidence_map frozen fields | A-004 |
| SIG-005 | stage runtime | node scripts/stage-runtime.mjs run with canonical receipts | A-008 |

## Read-now and Must-read-before-task

**read_now snapshot**：a316413eb0c35a97bfc29c0297a2f7537219bb81；以下是计划作者已读的代码事实，后续实现若当前 snapshot 改变，必须重新验证相关 FACT。

| Anchor | Mode | Exact location | Related IDs | Reason |
|---|---|---|---|---|
| A-001 | read_now | core/stage-content-contracts.mjs:303-515 | FR-01,FR-06,FR-10,DEC-01,DEC-02 | 当前 v1 parser、coverage、DAG、command oracle |
| A-002 | read_now | core/stage-content-evidence.mjs:20-60,377-380 | FR-01,FR-02,FR-04,DEC-02 | schema registry、revisionable/required kind 边界 |
| A-003 | read_now | core/canonical-receipt-writer.mjs:99-139 | FR-01,FR-02,AC-01,AC-02,DEC-02 | required kind 由既有 canonical audit 消费；若需改 audit 才能消费则 STOP |
| A-008 | read_now | scripts/stage-runtime.mjs:1-50,283-289 | FR-01,FR-02,AC-01,AC-02,DEC-02 | 正式 runner 只调用既有 audit；不得把 runtime/AJV 改动带入本 task |
| A-004 | read_now | skills/wh-review/scripts/review-materials.mjs:140-180,922-1025 | FR-12,FR-13,FR-16,DEC-03 | maps、frozen packet、unavailable 行为 |
| A-005 | read_now | workflows/build-code/SKILL.md:158-208 | FR-10,FR-14,DEC-04 | Phase Card、严格审查边界 |
| A-006 | read_now | workflows/verify-code/SKILL.md:150-209 | FR-11,FR-15,DEC-04 | fresh evidence、AC 叶子、review reuse |
| A-007 | read_now | skills/plan-eng-review/SKILL.md:1-45 | FR-07,FR-08,DEC-01,DEC-05 | lens-only 工程计划审查职责 |

| Task | must_read_before_task | Why / STOP |
|---|---|---|
| T001,T002 | A-001,A-002,A-003、A-008、skills/spec-specify/SKILL.md、build-spec Skill | 签名、required-kind audit 或 v1/v2 ownership 与本计划不符则 STOP |
| T003,T004 | A-001,A-002,A-007、plan-task-contract.v1 schema | 先确认 v1 schema 是既有文件；不得另建同名 schema |
| T005,T006 | A-004、stage-materials.json、三份 review contract | maps/route/round 任一现有约束不符则 STOP |
| T007,T008 | A-005,A-006、accepted build-code/verify evidence interfaces | 不得将完整 code/diff 或新 conformance schema 带入 |

## FACT Register

| FACT | Status | Evidence and snapshot | Impact |
|---|---|---|---|
| FACT-01 | verified | A-001 at a316413…：现有 FR/AC regex 不匹配 FR-01/AC-01，coverage 会空转 | DEC-01,CTRL-01,FR-01,AC-19,AC-21 |
| FACT-02 | verified | A-002 at a316413…：注册 schema 不等于 stage required kind；build-spec/build-plan required arrays 当前为空 | DEC-02,CTRL-02,FR-01,FR-02 |
| FACT-03 | verified | A-002 at a316413…：plan-task-contract.v1 已有 schema 文件并已注册 | DEC-01,FR-03,AC-16 |
| FACT-04 | verified | A-004 at a316413…：context_map/evidence_map 缺失应 unavailable；完整 anchor 才进入 packet | DEC-03,FR-12,FR-16 |
| FACT-05 | verified | A-005/A-006 at a316413…：build-code strict review 与 verify fresh evidence 已存在 | DEC-04,FR-14,FR-15 |
| FACT-06 | unknown | 实现 token、返工原因、最终缺陷没有当前正式来源；后续由 build-code/verify 的正式 records 按 DEC-05 确认 | CTRL-04,FR-11；记录 unknown，不估算、不回填历史 |

## Engineering Decision Register

**Lite/Full trigger**：接口、schema、状态、数据流、安全、并发、拓扑、Phase 顺序或测试策略变化为 Full；局部无状态且不改变这些边界才可 Lite；纯 P1 直接复用不建 DEC/CTRL。每个 Full 决策以下九维均有明确结论：DRY、KISS、YAGNI、SoC、Cognitive Load、State/Data Flow、Robustness、Context Friendliness、历史影响。

### DEC-01 — 兼容现有 ID grammar 并建立非空闭合

- **Candidates**：规范化所有 accepted ID；仅新增 v2 parser；在既有 v1 parser/schema 兼容 FR-01/AC-01 后由 v2 继承。
- **Selected**：扩展既有 v1 parser/schema 以只读识别 FR-01/AC-01，并让 v2 复用同一 ID parser。所有跨 artifact 关系采用唯一 ReferenceBinding={artifact_kind,ref,hash,id}：spec|plan|tasks|evidence 的 hash 是认证 SHA-256，code 的 hash 是当前 snapshot tree；裸 ID、缺 kind/ref/hash/id、过期 hash 或 kind/id 不匹配均 fail-loud。RED 必须证明漏掉一个 accepted FR/AC 会真实失败且 accepted_count 非零。
- **Evidence**：FACT-01、A-001、A-002。
- **Consequences / risk**：保持历史 artifact bytes；会扩大 v1 接受 grammar，必须测试旧 grammar 和新 grammar 都可读。
- **Excluded**：重命名 accepted IDs 会改写历史；仅 v2 修复会让当前 v1 stage contract 继续空转。
- **Links**：FR-01,FR-03,FR-06,FR-10；AC-01,AC-04,AC-08,AC-16,AC-19,AC-21；T001-T004。
- **Full quality matrix**：DRY=共用一个 parser；KISS=两个已知 grammar，无迁移；YAGNI=不支持任意 ID；SoC=parser 只解析、schema 只约束；Cognitive Load=单一 grammar table；State/Data Flow=v1/v2 均只读输入→facts；Robustness=non-empty/unknown/duplicate 均 fail-loud；Context=task 只带 resolved IDs；历史=保留 v1 bytes。测试=T003/T004。

### DEC-02 — v2 evidence 必须被真实生产和消费

- **Candidates**：只注册 v2 schema；新增独立 evidence 系统；在 A-002 注册且把 v2 加到对应 stage required/revisionable kinds。
- **Selected**：build-spec 要求 ambiguity-ledger.v2，build-plan 要求 plan-task-contract.v2；v2 加入现有 revisionable kinds；skills 发布对应 v2，audit 复用 A-003 自动消费。ambiguity-ledger.v2 的 subject_binding 与每条 PFACT/FR/AC relation 使用 ReferenceBinding；plan-task-contract.v2 的 upstream_spec_binding、ANCHOR/FACT/DEC/CTRL/task refs 使用同一对象，不允许用文本 versioned refs 代替。
- **Evidence**：FACT-02、A-002、A-003。
- **Consequences / risk**：缺 v2 会在已有结构入口失败；不能对历史 v1 task 追写。
- **Excluded**：schema-only 无消费者；第二账本重复 A-002/A-003。
- **Links**：FR-01,FR-02,FR-04,FR-06；AC-01,AC-02,AC-04,AC-19；T001-T004。
- **Full quality matrix**：DRY=reuse registry/audit；KISS=每 stage 一项 required kind；YAGNI=不加 lifecycle；SoC=writer/validator/audit 保持职责；Cognitive=明确发布顺序；State=artifact hash→typed evidence→audit；Robustness=missing/stale/hash mismatch fail；Context=review 只看到 map/refs；历史=v1 only-read。测试=T001/T002/T003/T004。

### DEC-03 — review 保持 findings-only 和一次结构复审

- **Candidates**：底层 verdict 作 stage gate；每次修改重审；复用 wh-review 的 resolution/one-full flow。
- **Selected**：复用 A-004；ordinary response 零 provider，direction/AC/interface/schema/state/security/concurrency/topology/phase_order/test_strategy 改变才一轮 full；maps 缺失为 unavailable。
- **Evidence**：FACT-04、D15、A-004。
- **Consequences / risk**：严重 finding 仍进入既有人工风险记录；不会通过改写 verdict 假装 pass。
- **Excluded**：新 provider route、closure loop、packet state store。
- **Links**：FR-12,FR-13,FR-14,FR-16；AC-11,AC-12,AC-13,AC-14,AC-20；T005,T006。
- **Full quality matrix**：DRY=reuse flow；KISS=一个 structural budget；YAGNI=不加 retry policy；SoC=review 产事实、stage/human 决策；Cognitive=明确 ordinary/structural；State=initial→resolution/full→recorded；Robustness=invalid maps unavailable；Context=minimum anchors；历史=result/resolution append-only。测试=T005/T006。

### DEC-04 — task 临时投影和 verify 当前证据对齐

- **Candidates**：全量 spec/plan/code packet；新 conformance schema；按 accepted ref/hash/ID 解析最小投影并复用 current evidence。
- **Selected**：按 task 只解析必要 spec/plan/tasks/FACT/DEC/CTRL；verify 仅补 affected ID、selected anchor、evidence ref、gap/recovery。
- **Evidence**：FACT-05、A-005、A-006。
- **Consequences / risk**：缺/冲突/过期引用 STOP；verify 不重新裁决代码质量。
- **Excluded**：全仓扫描、完整 diff/code 重送、第二 code review。
- **Links**：FR-10,FR-11,FR-15；AC-08,AC-09,AC-10,AC-15；T007,T008。
- **Full quality matrix**：DRY=reuse accepted evidence；KISS=temporary projection；YAGNI=无持久投影；SoC=projection 不接受；Cognitive=task-local refs；State=resolve→execute→discard；Robustness=missing/stale STOP；Context=最小 bytes；历史=旧 evidence 不作 current proof。测试=T007/T008。

### DEC-05 — 观测口径和非目标范围

- **Candidates**：token threshold/telemetry；不记录；使用正式已有 records 的采样观测。
- **Selected**：采样 T004、T006、T008；在其 GREEN 正式 artifact/review/verify record 完成时读取 material manifest bytes、manifest ref count、task projection ref count、遗漏引用、多余引用、正式 implementation token、返工原因、最终缺陷和 AC 失败；与同 task 前一次完整正式记录比较，缺前值或来源即 unknown；无阈值/评分/阻断。
- **Evidence**：FACT-06、FR-11、A-004/A-006。
- **Consequences / risk**：首版只得到可复现 baseline，不承诺成本下降。
- **Excluded**：新 telemetry、token budget gate、估算数据。
- **Links**：FR-11；AC-10；T004,T006,T008。
- **Lite quality matrix**：局部观测合同，无接口状态变更；DRY/KISS/YAGNI=复用正式 records；SoC=记录不决定阶段；Robustness=无来源 unknown；Context=只存计数；历史=不回填旧记录。测试=T003/T004；实际记录=T004/T006/T008。

## CTRL Register

| CTRL | Enforced rule | Evidence |
|---|---|---|
| CTRL-01 | accepted FR/AC count 必须 >0，漏任一 FR/AC、PFACT→FR→AC、cross-artifact ref/hash/ID 或 pure reuse exemption 都失败 | T003 RED/T004 GREEN |
| CTRL-02 | build-spec/build-plan 缺对应 v2 required kind 失败；v2 revision 保留同一 stage identity | T001/T002/T003/T004 |
| CTRL-03 | maps missing→unavailable/no dispatch；ordinary 零 provider；structural 最多一次 | T005/T006 |
| CTRL-04 | T004/T006/T008 按 DEC-05 记录 packet bytes、引用数、遗漏/多余引用、token、返工、缺陷、AC 失败或 unknown；无 token threshold | T004/T006/T008 的 GREEN observation 或 explicit unknown |
| CTRL-05 | AC-17 是既有 build-plan human confirmation 的显式 scope item；最终 verify human confirmation 比较 implementation changed list 与 DO NOT TOUCH list，不新增自动 hash gate | T008 confirmation evidence |

## Modules, Interfaces, and Data Contracts

### Module responsibilities

#### v2 content-contract layer

- **Responsibility**：验证 stable ID、artifact identity、事实状态、引用闭合、风险、Lite/Full 和静态 task state。
- **Consumes**：exact spec/plan/tasks bytes 与 authenticated ref/hash/snapshot。
- **Produces**：ambiguity-ledger.v2、plan-task-contract.v2；历史 v1 artifact bytes 不变，v1 reader/schema 只做兼容扩展。
- **Must not decide**：产品方向、provider verdict、runtime state、token gate。

#### workflow skills and templates

- **Responsibility**：生成分层、最小、可审查 Markdown。
- **Consumes**：accepted upstream ref/hash 与显式 anchors/maps。
- **Produces**：named artifacts/review material。
- **Must not decide**：历史迁移、runner route、目录清理。

#### wh-review presentation

- **Responsibility**：从冻结材料产 findings/disposition；maps 缺失即 unavailable。
- **Consumes**：draft、upstream identity、context_map、evidence_map。
- **Produces**：existing result/resolution。
- **Must not decide**：stage pass、自动风险接受或 packet lifecycle。

#### task projection and verify alignment

- **Responsibility**：按 task 版本引用生成临时最小投影；verify 对齐 design IDs/current AC/phase/test/review evidence。
- **Consumes**：accepted refs/hashes/current snapshot evidence。
- **Produces**：STOP/recovery 或 deviation evidence。
- **Must not decide**：全仓扫描补事实、重跑 quality review。

### Schemas and data model

- ReferenceBinding：唯一对象 {artifact_kind,ref,hash,id}；spec|plan|tasks|evidence 使用认证 SHA-256，code 使用 snapshot tree；每一个 PFACT→FR→AC、ANCHOR/FACT/DEC/CTRL、task projection 与 verify relation 只能用该对象，缺任一字段、kind/id 不匹配或 stale hash 均 STOP。
- ambiguity-ledger.v2：spec content hash、artifact identity、PFACT/FR/AC relation 的 ReferenceBinding、状态；每个 risk entry 必填 affected_ids、trigger_condition、consequence、mitigation_or_stop、handling_stage、verification；不复制正文。
- plan-task-contract.v2：v1 兼容识别 FR-01/AC-01 后，v1 phase/DAG/command/coverage 加 upstream_spec_binding、所有 ANCHOR/FACT/DEC/CTRL/task 的 ReferenceBinding、read_now/must_read、Lite/Full、ready|blocked-by-design、STOP/recovery、unknown。每张 task card 的 authoritative fields 是 task ID、Phase、goal、versioned_refs、Knowledge、boundary、action、test/acceptance command、design_state、STOP、recovery、risk；Phase 段落只能给共同约束，不能代替 card 字段。
- context_map：最小 path/symbol/line segment、关联 ID、选择理由。
- evidence_map：complete 或 unknown、canonical ref/hash/snapshot；不复制原始日志。

### State transitions

draft → deterministic v2 validation → frozen review material → finding/disposition or unavailable → verified resolution or one structural review → receipt/accepted artifact

Invalid：missing ref/hash、改写 v1、runtime task state、stale snapshot、missing maps、第二 structural review、verdict 映射 pass；全部 fail-loud。

### Data flow and integration points

accepted decision/spec identity → template artifact → A-001/A-002 typed evidence → A-004 frozen review material → existing TaskKernel receipt/review flow → build-code projection / verify alignment

- **Dependencies**：Ajv 只由 authenticated runner 解析 schema；Vitest 测行为；TaskKernel ownership 不变。
- **Integration points**：A-002、five workflow Skill、three review contracts、A-004 maps。
- **Compatibility boundaries**：v1 read-only；build-code strict review/provider route 不变；candidate 不承载 node_modules。

## Project Structure

### NEW

core/schemas/ambiguity-ledger.v2.json
core/schemas/plan-task-contract.v2.json
tests/stage-plan-task-contract.test.mjs
tests/verify-code-design-alignment.test.mjs

### MODIFY

skills/spec-specify/SKILL.md
skills/spec-specify/templates/spec-template.md
skills/spec-plan/SKILL.md
skills/spec-plan/templates/plan-template.md
skills/spec-tasks/SKILL.md
skills/spec-tasks/templates/tasks-template.md
skills/plan-eng-review/SKILL.md
workflows/make-decision/SKILL.md
workflows/build-spec/SKILL.md
workflows/build-plan/SKILL.md
workflows/build-code/SKILL.md
workflows/verify-code/SKILL.md
skills/wh-review/stage-materials.json
skills/wh-review/contracts/build-spec.md
skills/wh-review/contracts/build-plan.md
skills/wh-review/contracts/verify-code.md
skills/wh-review/scripts/review-materials.mjs
core/stage-content-contracts.mjs
core/stage-content-evidence.mjs
core/schemas/plan-task-contract.v1.json
tests/stage-content-evidence.test.mjs
tests/stage-review-cost-policy.test.mjs
tests/final-cutover-guards.red.test.mjs
tests/verify-code-freshness.test.mjs
tests/verify-code-facts.test.mjs
skills/wh-review/scripts/__tests__/review-controller.test.mjs
skills/wh-review/scripts/__tests__/review-source-materials.test.mjs
skills/wh-review/scripts/__tests__/simple-contracts.test.mjs

### DO NOT TOUCH

scripts/stage-runtime.mjs
core/task-kernel-implementation.mjs
core/workspace.mjs
core/workspace-runner.mjs
core/dispatch-component.mjs
package.json
CONSTITUTION.md
constitution-checklist.md
historical tasks and accepted receipts

## Complexity Trade-offs

| Decision | Options considered | Selected option | Reason | Consequence / risk |
|---|---|---|---|---|
| 内容合同 | 新平台 / 改写 v1 / v2 扩展 | v2 扩展 | 复用验证器且历史只读 | 两份小 schema、需兼容测试 |
| 引用 | 复制全文 / 裸 ID / ref+hash+ID | ref+hash+ID | 最小且不漂移 | 缺 identity STOP |
| 质量矩阵 | 所有 task Full / 无记录 / key DEC Lite/Full | key DEC Lite/Full | 控制认知负担 | 需测试触发 |
| 审查 | pass gate / 每改重审 / findings+一轮结构复审 | findings+一轮 | 少 token 保留独立盲区 | serious 保留人工风险 |
| 上下文观测 | token quota / telemetry / existing facts | existing facts | 无可靠来源不造系统 | 首版不作成本结论 |
| runtime 问题 | candidate 安装 / 改 runner / 正确入口 | 正确入口 | D14 排除 runtime 改造 | 入口错明确失败 |

## F10 Anti-Over-Engineering Gate

- **Real threat / 真实威胁**：低上下文执行者加载错层、遗漏事实、误用 review verdict，导致返工。
- **Existing cover / 已有覆盖**：A-001/A-002/A-004/A-007 已覆盖结构、evidence、frozen material、工程审查。
- **Bypassable / 可绕过**：缺 identity/maps 必须 unavailable/STOP；不增加 dispatcher/token/state store。
- **Maintenance cost / 长期维护成本**：两个 schema、现有 parser 分支和聚焦测试；新 lifecycle/服务收益不足。
- **Decision**：保留 v2 扩展；不新增平台、runner replacement、自动化 gate 或目录重构。

## Test Strategy

- 所有行为变化先 RED，再以同一 oracle GREEN。
- Phase 1：npx vitest run tests/stage-content-evidence.test.mjs。
- Phase 2：npx vitest run tests/stage-plan-task-contract.test.mjs tests/stage-content-evidence.test.mjs。
- Phase 3：npx vitest run tests/stage-review-cost-policy.test.mjs tests/final-cutover-guards.red.test.mjs skills/wh-review/scripts/__tests__/review-controller.test.mjs skills/wh-review/scripts/__tests__/review-source-materials.test.mjs skills/wh-review/scripts/__tests__/simple-contracts.test.mjs。
- Phase 4：npx vitest run tests/verify-code-freshness.test.mjs tests/verify-code-facts.test.mjs tests/verify-code-design-alignment.test.mjs。
- 稳定 snapshot 后只执行一次 npm test；改 Markdown/Skill 时执行 npm run check。

## Rollback and Recovery

- **Global recovery rule**：accepted spec/plan/tasks 和 append-only receipts 保留；只回滚未接受实现。
- **Irreversible boundaries**：删除、历史迁移、runner/provider/依赖、宪法或 serious risk 均需独立授权。
- **Compatibility recovery**：v2 失败报告 unknown/STOP，保留 v1；不得自动转换。
- **Review recovery**：ordinary edit 用 verified resolution；仅 structural change 允许一轮 full review；unavailable 如实记录。

## Implementation Order

先固定 v2 parser/schema 和 v1 read-only 边界；再让 templates/skills 生成它；再接 wh-review maps/findings；最后接 task projection/verify。各 Phase 都依赖前一 Phase，避免并改 stage-content contracts 或同一 workflow contract。

## Implementation Steps

## Phase 1：版本化 spec 与内容证据合同

### Goal

spec 可表达 PFACT/FR/AC、状态、风险、影响和 version identity；v2 evidence 与 v1 共存。

### Files

- NEW：core/schemas/ambiguity-ledger.v2.json
- MODIFY：skills/spec-specify/SKILL.md、skills/spec-specify/templates/spec-template.md、workflows/build-spec/SKILL.md、core/stage-content-contracts.mjs、core/stage-content-evidence.mjs（含 REQUIRED_STAGE_CONTENT_KINDS、REVISIONABLE_KINDS）、tests/stage-content-evidence.test.mjs

### Tasks

T001、T002。

### Verify

- **Target**：FR-01,FR-02,FR-03,FR-04,FR-05 / AC-01,AC-02,AC-03,AC-16,AC-18,AC-19
- **gate_cmd**：npx vitest run tests/stage-content-evidence.test.mjs
- **expected_exit**：0
- **evidence_path**：apply/evidence/phase-1-content-contract.stdout
- **display_cmd**：None — gate is concise
- **Oracle**：完整 v2 identity、spec 禁代码锚点/工程方案、逐项 risk 字段通过；duplicate/missing/stale ReferenceBinding 或 risk 字段拒绝；v1 bytes 不变。

### Knowledge

A-001/A-002 的 v1 parser、registry、build-spec ambiguity ledger 已读；不需外部研究。

### STOP

若 v2 必须改写历史 receipt、无法绑定风险/状态到 identity、或必须改 runner/TaskKernel 才能发布，停止。

### Done

v2 schema/validator、spec template/skill、build-spec contract 和 RED/GREEN 测试完成；v1 只读。

### Risks and rollback

- **Risk**：工程锚点进入 spec 或 v2 成为第二账本。
- **Prevention**：只存 ID/identity/状态；skill 固定层边界。
- **Rollback / recovery**：回退未接受实现；历史 v1/spec 不动。

## Phase 2：plan/tasks 工程决策和静态投影合同

### Goal

plan 记录 anchors、FACT/DEC/CTRL、Lite/Full 九维质量、状态/错误/历史影响；tasks 用静态 state、最小 versioned refs、STOP/recovery。

### Files

- NEW：core/schemas/plan-task-contract.v2.json、tests/stage-plan-task-contract.test.mjs
- MODIFY：core/schemas/plan-task-contract.v1.json
- MODIFY：skills/spec-plan/SKILL.md、skills/spec-plan/templates/plan-template.md、skills/spec-tasks/SKILL.md、skills/spec-tasks/templates/tasks-template.md、workflows/build-plan/SKILL.md、skills/plan-eng-review/SKILL.md、core/stage-content-contracts.mjs、core/stage-content-evidence.mjs（含 REQUIRED_STAGE_CONTENT_KINDS、REVISIONABLE_KINDS）

### Tasks

T003、T004。

### Verify

- **Target**：FR-06,FR-07,FR-08,FR-09,FR-10,FR-11 / AC-03,AC-04,AC-05,AC-06,AC-07,AC-08,AC-09,AC-10,AC-21
- **gate_cmd**：npx vitest run tests/stage-plan-task-contract.test.mjs tests/stage-content-evidence.test.mjs
- **expected_exit**：0
- **evidence_path**：apply/evidence/phase-2-plan-task-contract.stdout
- **display_cmd**：None — focused gate is oracle
- **Oracle**：FR-01/AC-01 grammar 的 accepted_count 非零且漏项失败；PFACT→FR→AC 的 ReferenceBinding 四字段闭合；plan 禁复制 PFACT 且只单向引用 spec；read_now/must_read 分离；runtime state 拒绝；v1 非无损字段为 unknown。

### Knowledge

A-001/A-002/A-007 和 package scripts 已读；无新外部 API/storage。

### STOP

若需复制完整 spec/Decision Log、纯 P1 reuse 强造 DEC、或 Lite/Full 无确定触发规则，停止。

### Done

v2 plan/task evidence、templates、workflow instructions/lens 统一最小 refs、九维质量、静态 task；兼容读取报告 unknown。

### Risks and rollback

- **Risk**：质量矩阵变模板噪声或 task 变运行看板。
- **Prevention**：只对 key DEC 触发；schema 拒绝 in_progress/done/failed。
- **Rollback / recovery**：撤销未接受实现；v1 reader 不变。

## Phase 3：冻结审查材料和建议式呈现

### Goal

四阶段 review 以 findings/disposition 呈现；build-spec/build-plan/verify 用最小 maps；ordinary 修复零重派，structural 返工最多一次。

### Files

- MODIFY：workflows/make-decision/SKILL.md、workflows/build-spec/SKILL.md、workflows/build-plan/SKILL.md、skills/wh-review/stage-materials.json、skills/wh-review/contracts/build-spec.md、skills/wh-review/contracts/build-plan.md、skills/wh-review/contracts/verify-code.md、skills/wh-review/scripts/review-materials.mjs、tests/stage-review-cost-policy.test.mjs、tests/final-cutover-guards.red.test.mjs、skills/wh-review/scripts/__tests__/review-controller.test.mjs、skills/wh-review/scripts/__tests__/review-source-materials.test.mjs、skills/wh-review/scripts/__tests__/simple-contracts.test.mjs

### Tasks

T005、T006。

### Verify

- **Target**：FR-12,FR-13,FR-14,FR-16 / AC-11,AC-12,AC-13,AC-14,AC-20
- **gate_cmd**：npx vitest run tests/stage-review-cost-policy.test.mjs tests/final-cutover-guards.red.test.mjs skills/wh-review/scripts/__tests__/review-controller.test.mjs skills/wh-review/scripts/__tests__/review-source-materials.test.mjs skills/wh-review/scripts/__tests__/simple-contracts.test.mjs
- **expected_exit**：0
- **evidence_path**：apply/evidence/phase-3-review-contract.stdout
- **display_cmd**：None — assertions expose dispatch/verdict behavior
- **Oracle**：direction/detail remain separate；missing maps→unavailable/no dispatch；ordinary zero provider；one structural max；simplicity position unchanged。

### Knowledge

A-004 frozen material parser/stage-materials maps 已读；D15 已接受：verdict 非 pass gate，serious 复用既有风险边界。

### STOP

若需要新 route、第二 packet store、unavailable 伪造 pass、或改 build-code strict review，停止。

### Done

review contracts/Skills 一致；formal facts 保留 verdict，但 public/downstream 消费 finding/disposition；flow 测试覆盖审查成本。

### Risks and rollback

- **Risk**：serious finding 被静默绕过或普通修复无限重审。
- **Prevention**：保留现有 risk API 和 verified resolution/structural chain。
- **Rollback / recovery**：回退未接受文案/parser；历史 result/resolution 不动。

## Phase 4：最小 task 投影与 verify 当前证据对齐

### Goal

build-code task 解析最小受控投影并 fail-loud；verify 用 accepted design/current evidence 报 deviation/unknown/recovery。

### Files

- NEW：tests/verify-code-design-alignment.test.mjs
- MODIFY：workflows/build-code/SKILL.md、workflows/verify-code/SKILL.md、tests/verify-code-freshness.test.mjs、tests/verify-code-facts.test.mjs

### Tasks

T007、T008。

### Verify

- **Target**：FR-10,FR-15 / AC-08,AC-09,AC-15,AC-17
- **gate_cmd**：npx vitest run tests/verify-code-freshness.test.mjs tests/verify-code-facts.test.mjs tests/verify-code-design-alignment.test.mjs
- **expected_exit**：0
- **evidence_path**：apply/evidence/phase-4-verify-alignment.stdout
- **display_cmd**：None — focused tests are evidence
- **Oracle**：only selected refs enter projection；stale/unknown/missing AC/current snapshot mismatch names IDs/recovery；no simplicity/full review rerun；AC-17 由既有确认范围表而非新自动 gate 证明。

### Knowledge

A-005/A-006 已读；accepted artifacts/evidence refs 是 canonical inputs，不可由目录发现。

### STOP

若需要写入完整 code/diff/spec、独立 conformance schema、或重跑 build-code verdict，停止。

### Done

projection 和 verify alignment 完成且覆盖；AC-17 的 non-goal changed-path 列表已在 build-plan/verify 既有 human confirmation 中明确确认。

### Risks and rollback

- **Risk**：verify 成第二审查或 projection 成新事实源。
- **Prevention**：只引用现有 current evidence；projection 临时不接受。
- **Rollback / recovery**：回退未接受 workflow/test 修改，保留 accepted artifacts。

## Dependencies and Parallelism

Phase 1 → Phase 2 → Phase 3 → Phase 4

- Phase 1 定义 spec identity；Phase 2 才能引用。
- Phase 2 定义 plan/task v2；Phase 3 才能冻结完整 review material。
- Phase 4 消费 accepted-contract shape，最后实施。
- 每个 Phase RED→GREEN 串行；Phase 不并行，避免并改 stage-content contracts/workflow contracts。

## FR to AC to Step Traceability

| FR | Task IDs | AC IDs | Phase | Verification evidence |
|---|---|---|---|---|
| FR-01,FR-02,FR-03,FR-04,FR-05 | T001,T002 | AC-01,AC-02,AC-03(a),AC-16,AC-18,AC-19 | Phase 1 | phase-1-content-contract |
| FR-06,FR-07,FR-08,FR-09,FR-10,FR-11 | T003,T004 | AC-03(b),AC-04,AC-05,AC-06,AC-07,AC-08,AC-09,AC-10,AC-21 | Phase 2 | phase-2-plan-task-contract |
| FR-12,FR-13,FR-14,FR-16 | T005,T006 | AC-11,AC-12,AC-13,AC-14,AC-20 | Phase 3 | phase-3-review-contract |
| FR-10,FR-15 | T007,T008 | AC-08,AC-09,AC-15,AC-17 | Phase 4 | phase-4-verify-alignment |

## Verification Mapping

AC-03(a) 是 spec 层禁止代码锚点/工程方案；AC-03(b) 是 plan 层禁止复制 PFACT 且只能单向绑定 accepted spec。它们共同满足同一 AC，不代表重复或跨 Phase 漂移。

| Step | FR IDs | AC IDs | Exact gate evidence |
|---|---|---|---|
| T001,T002 | FR-01,FR-02,FR-03,FR-04,FR-05 | AC-01,AC-02,AC-03(a),AC-16,AC-18,AC-19 | apply/evidence/phase-1-content-contract.stdout |
| T003,T004 | FR-06,FR-07,FR-08,FR-09,FR-10,FR-11 | AC-03(b),AC-04,AC-05,AC-06,AC-07,AC-08,AC-09,AC-10,AC-21 | apply/evidence/phase-2-plan-task-contract.stdout |
| T005,T006 | FR-12,FR-13,FR-14,FR-16 | AC-11,AC-12,AC-13,AC-14,AC-20 | apply/evidence/phase-3-review-contract.stdout |
| T007,T008 | FR-10,FR-15 | AC-08,AC-09,AC-15,AC-17 | apply/evidence/phase-4-verify-alignment.stdout |

## Constitution Check

### Framework Principles

- [x] **F1 薄核心** — 重活留在技能/合同层，不扩张 TaskKernel。
- [x] **F2 窄契约** — 只传 ref/hash/ID 和 maps。
- [x] **F3 结构事实强校验质量事实分级处置** — identity/hash/snapshot/schema fail-loud，一般 finding 记录。
- [x] **F4 质量靠异源审查与人严重问题窄暂停** — wh-review 独立；serious 复用风险记录。
- [x] **F5 gate 谨慎添加出事再补无用则移除** — 仅补真实缺口，无 gate 平台。
- [x] **F6 统一外置执行记录** — reuse records，不永久绑定 runner。
- [x] **F7 关键决策与不可逆操作不自动越过人** — 三个确认点和独立授权不变。
- [x] **F8 简单优先** — v2 extend，禁止 runner replacement/复制依赖。
- [x] **F9 可证伪不假绿** — stale/unknown/missing maps 明确失败/unavailable。
- [x] **F10 自动化按真实收益添加，不为机器可校验本身堆基建** — 聚焦行为测试，不加 CI/gate。

### Quality Principles

- [x] **Q1 一般质量记事实严重问题先暂停** — verdict 非日常门，serious 窄暂停。
- [x] **Q2 gate 三类划分与严重问题异常处置** — 入口、记录、确认分离。
- [x] **Q3 异源审查加人工把关** — wh-review 是质量来源，runner identity 不是 verdict。

### Skill Principles

- [x] **S1 能用外部就不造轮子** — reuse existing skills/schemas/lens。
- [x] **S2 外部技能可针对项目改造合宪** — 最小合同扩展。
- [x] **S3 迭代时保持最新并就地检查** — 本任务不升级外部来源。
- [x] **S4 自定义技能必须有指标系统** — reuse execution facts，不建 telemetry。
- [x] **S5 自定义技能方便子代理调用省主上下文** — task projection 按需读取。
- [x] **S6 自定义技能参考市面方案不闭门造车** — accepted research/现有 guards 是依据。
- [x] **S7 一阶段一技能一工作流一文件夹** — 五 workflow folder 保持独立。
- [x] **S8 自定义技能可独立调用可搬运** — 只依赖受控 interface，不写宿主路径。
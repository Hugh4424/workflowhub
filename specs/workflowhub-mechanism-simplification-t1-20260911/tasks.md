# 任务清单：workflowhub 机制瘦身任务Ⅰ

- **Input**：`specs/workflowhub-mechanism-simplification-t1-20260911/decision-log.md`, `specs/workflowhub-mechanism-simplification-t1-20260911/spec.md`, `specs/workflowhub-mechanism-simplification-t1-20260911/plan.md`
- **Template version**：`plan-task.v4`

## 材料导航

本表可再生，不是第五份材料。M/S/B/P 表示主会话、子代理、后台执行与并行读取。

| 章节 / 材料锚点 | 职责与摘要 | M/S/B/P 读取时机 |
| --- | --- | --- |
| decision-log.md 第9节、第16.2节及第18节 | 当前决定、来源与最终修正 | M 设计开始；S 对应来源核验 |
| spec.md 第2、4、5、8、9、11节 | 边界、基线、21项需求及验收、记录格式 | M 编写对应方案；S 消费者研究 |
| plan.md 的 Solution Design 与 Phase P1 | 工程方案、单一文件owner、四批即时验证 | M/S 当前批开始；B 独立审查 |
| tasks.md 的 T001–T007 | 精确命令、依赖与唯一完成区 | M/S 执行当前卡；P 仅无共享状态的只读检查 |

## Phase P1 — C0–C3 串行机制瘦身

### Goal

在一个共享文件owner下完成C0/C1/C2/C3四个串行批次，各批唯一可见产物和即时判据保持spec第3节原义。`TASK_BASE=89773aaabf0aad97b64739d32182530f10c32aef`只用于原始开工口径/三红复算，`INTEGRATION_BASE=762bce755a4de1a21ee09a3bf134cc279af5bccd`是已合入main后的实现输入；两者不混用。

### Files

- **NEW**：N/A — 不新增生产文件、测试文件、schema 或检查器。
- **MODIFY**：`core/__tests__/capability-doctor.test.mjs`, `core/__tests__/task-index.test.mjs`, `core/task-close.mjs`, `docs/architecture/deletion-plan.json`, `docs/architecture/move-map.json`, `runtime/distribution/runner-release.mjs`, `runtime/distribution/skill-bundle-release.mjs`, `runtime/evidence/acceptance-evidence-validator.mjs`, `runtime/evidence/audit-summary-carrier.mjs`, `runtime/evidence/boundary-confirm.mjs`, `runtime/evidence/canonical-evidence-validators.mjs`, `runtime/evidence/canonical-receipt-writer.mjs`, `runtime/evidence/canonical-utils.mjs`, `runtime/evidence/capability-doctor.mjs`, `runtime/evidence/check-skill-closure.mjs`, `runtime/evidence/dsh-transcript.mjs`, `runtime/evidence/fact-collector.mjs`, `runtime/evidence/freshness.mjs`, `runtime/evidence/journal-schema.mjs`, `runtime/evidence/quality-fact.mjs`, `runtime/evidence/quality-store.mjs`, `runtime/evidence/receipt-schema.mjs`, `runtime/evidence/requirement-ledger.mjs`, `runtime/evidence/research-report.mjs`, `runtime/evidence/stage-completion-facts.mjs`, `runtime/evidence/stage-content-evidence.mjs`, `runtime/evidence/text-utils.mjs`, `runtime/evidence/workflow-evolution.mjs`, `runtime/evidence/write-boundary-preflight.mjs`, `runtime/review/integration-review-subject.mjs`, `runtime/review/review-record-route.mjs`, `runtime/review/stage-review-disposition.mjs`, `runtime/schemas/stage-reflection.v2.json`, `runtime/stage/completion-predicates.mjs`, `runtime/stage/stage-agent-outcome-adapter.mjs`, `runtime/stage/stage-content-contracts.mjs`, `runtime/stage/stage-handlers.mjs`, `runtime/stage/stage-handoff.mjs`, `runtime/stage/stage-reflect.mjs`, `runtime/stage/stage-runner.mjs`, `runtime/task/git-worktree-snapshot.mjs`, `runtime/task/material-workspace.mjs`, `runtime/task/task-handle.mjs`, `runtime/task/task-index.mjs`, `runtime/task/task-kernel-implementation.mjs`, `runtime/task/task-store.mjs`, `skills/catalog.yaml`, `skills/mini-task/scripts/mini-task-runner.mjs`, `skills/mini-task/skill-bundle.json`, `skills/wh-review/scripts/ac-evidence-summary.mjs`, `skills/wh-review/scripts/review-provider-client.mjs`, `skills/wh-review/scripts/simple-review-runner.mjs`, `skills/wh-review/scripts/third-review-host-config.mjs`, `skills/wh-review/scripts/wh-review-cli.mjs`, `skills/wh-review/skill-bundle.json`, `specs/workflowhub-mechanism-simplification-20260910/prd.md`, `tests/boundary-confirm.test.mjs`, `tests/build-code-target.test.mjs`, `tests/contract/check-skill-updates.test.mjs`, `tests/contract/core-runtime-layering.test.mjs`, `tests/contract/derive-consumption-edges.test.mjs`, `tests/contract/execution-outcome.test.mjs`, `tests/contract/generate-iteration-brief.test.mjs`, `tests/contract/protocol-error-trace.test.mjs`, `tests/contract/repo-skills-manifest.test.mjs`, `tests/contract/research-report.test.mjs`, `tests/contract/stage-handoff.test.mjs`, `tests/contract/stage-reflection-e2e-constructed.test.mjs`, `tests/contract/stage-reflection-paths.test.mjs`, `tests/contract/status-derivation.test.mjs`, `tests/contract/verify-publication.test.mjs`, `tests/contract/workflow-evolution-governance.test.mjs`, `tests/contract/workflow-evolution-ledgers.test.mjs`, `tests/dsh-transcript.test.mjs`, `tests/integration/distribution-closure.test.mjs`, `tests/integration/minimal-task-storage.test.mjs`, `tests/integration/task-fact-index-consistency.test.mjs`, `tests/integration/verify-freshness-selection.test.mjs`, `tests/integration/vnext-delivery-close.test.mjs`, `tests/integration/vnext-official-stage-run.test.mjs`, `tests/requirement-lineage.test.mjs`, `tests/stage-plan-task-contract-v3.test.mjs`, `tests/stage-plan-task-contract.test.mjs`, `tests/task-record-paths-check.test.mjs`, `tests/verify-code-facts.test.mjs`, `tools/architecture/clean-install.mjs`, `tools/architecture/complexity-report.mjs`, `tools/architecture/inventory.mjs`, `tools/architecture/public-behavior-baseline.mjs`, `tools/architecture/verify-final-coverage.mjs`, `tools/cli/build-reflection-page.mjs`, `tools/cli/check-skill-updates.mjs`, `tools/cli/check-task-record-paths.mjs`, `tools/cli/derive-consumption-edges.mjs`, `tools/cli/generate-iteration-brief.mjs`, `tools/cli/measure-test-runtime-profile.mjs`, `tools/cli/produce-final-current-snapshot.mjs`, `tools/cli/record-evolution-result.mjs`, `tools/cli/repo-skills-manifest.mjs`, `tools/cli/smoke-local-skill-dispatch.mjs`, `tools/cli/task-close.mjs`, `tools/cli/validate-current-plan-tasks.mjs`, `tools/host/workflowhub-stage-agent-bridge.mjs`, `workflows/verify-code/design-alignment.mjs`, `runtime/evidence/storage-root.mjs`
- **READ-ONLY CONSUMER**：`tests/contract/decision-convergence-depth.test.mjs`, `tests/contract/stage-interaction-batching.test.mjs`, `tests/close/close-contract.test.mjs` — 仅执行合并后的上游保护合同，不修改文件、不纳入本任务生产改动。
- **DO NOT TOUCH**：`specs/workflowhub-mechanism-simplification-t1-20260911/decision-log.md`, `specs/workflowhub-mechanism-simplification-t1-20260911/spec.md`, `docs/adr/0030-mechanism-simplification-deletion-boundary.md`, `CONSTITUTION.md`, `constitution-checklist.md`, `AGENTS.md`, `CONTEXT.md`, `docs/standard-workflow.md`, `runtime/stage/protocol-error-whitelist.mjs`。MODIFY 内具名删除文件仅可按指定批次整删；其它文件只改列明符号。

### Tasks

- T001：冻结复算记录并加入上游单行指针
- T002：具名叶子、引用测试和四条守卫登记同批清理
- T003：RED：冻结四类定义真实接受集
- T004：GREEN：复用唯一定义且保留不同语义
- T005：RED：唯一行、来源认证和历史只读的失败证据
- T006：GREEN：现有writer和所有读者收敛到当前记录行
- T007：FINAL：聚合21项真实观测与四批即时证据和最终原始输出

### Verify

ORACLE-FINAL — P1最终聚合；分批判据沿用ORACLE-C0、ORACLE-C1、ORACLE-C2、ORACLE-C3。T001/C0口径及指针；T002/C1具名清理与保留测试；T003→T004/C2同命令RED/GREEN；T005→T006/C3同命令RED/GREEN、一次14文件与49历史status及1具名身份错误；T007/ORACLE-FINAL在最终快照一次受影响文件并集后聚合。所有精确命令、expected_exit、evidence_path见Test Strategy同ID行和tasks卡。

### Knowledge

12叶子/三红基线/四类定义/16键/50历史目录；source原件不等于派生当前状态；C1退场测试不得在C3再跑。实现者还必须保留合并输入中的`readTaskTypeFromDecisionLog`/planning question boundary、planning close的4动作与post-cleanup的2动作、ordinary close的5动作，以及stage-runner的unavailable analyzer形状校验；旧编号式任务身份缺少类型行时保持unknown/fail-loud。

### STOP

C0缺分子/分母/命令；C1命中K1–K9或路径FAIL>10；C2接受集不符真实producer；C3索引生产读写非零或历史status抛错。停当前批记录incomplete，不跳批、不撤销已过批，不推迟判据。

### Done

四个具名可见产物在各批结束即时验证；21AC有真实观测；task-index确定净减30行；新任务唯一执行文件；历史bytes不变；审查/来源/缺失均如实保留。

### Risks and rollback

关联RISK-001/002/003/004/006与T001–T007；触发即按Rollback and Recovery撤销当前未过批次的本次改动，历史原件/已过批次不动。

T001— 冻结复算记录并加入上游单行指针

- **ID**：T001
- **Phase**：Phase P1 — C0–C3 串行机制瘦身
- **goal**：冻结复算记录并加入上游单行指针
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-mechanism-simplification-t1-20260911/spec.md","hash":"d2844bcd073c7e106fe0ab028560dd41eb3be8f31eefdd8bc4722a0f03c9c2e8","id":"SPEC-MS"},{"artifact_kind":"plan","ref":"specs/workflowhub-mechanism-simplification-t1-20260911/plan.md","hash":"19e901a57bdd89d883547d853061d504cd382a8b2dda3e56495267fb3c23dd89","id":"PLAN-MS"}]`
- **source_refs / decision_refs**：R-007 R-016 D-010 D-011 R-014 D-002 D-004 D-016
- **输入**：plan.md C0批次、DEC-001–DEC-004及当前spec来源与开工基准
- **依赖**：none
- **并行**：否 — 共享文件与批次生产者/消费者严格串行
- **FR**：FR-MS-001, FR-MS-013, FR-MS-017, FR-MS-018
- **AC**：AC-MS-001, AC-MS-013, AC-MS-017, AC-MS-018
- **动作**：复用规格第4节冻结口径，区分`TASK_BASE`与`INTEGRATION_BASE`；在`TASK_BASE`隔离只读视图执行M5五命令和口径反例，核对7014/35/1525/231/16；在当前合并树复算实现输入M5并核对7124/35/1525/232/16；读取既有三红原件并按相同命令复算，不重跑真实工作任务。从用户已确认的原枚举证据生成精确50个其他历史任务的路径集合，并保存全文件hash；本任务另验AC-MS-008/011的新writer到真实reader/status，后续新增活目录单列。只向上游增加精确一行纯指针；保留ADR为已交付物。把两组观测值和原始命令输出写C0现有证据区。
- **精确文件**：`specs/workflowhub-mechanism-simplification-20260910/prd.md`
- **boundary**：files: `specs/workflowhub-mechanism-simplification-20260910/prd.md`; symbols/regions: 仅上游共享定义末尾一行纯指针，余字节只读
- **输出**：C0具名观测、原始命令stdout/stderr/exit、当前snapshot与对应AC实际测量；不得自报passed替代证据
- **Knowledge**：spec.md第2、8、9、11节及plan.md DEC-001–DEC-004；前序卡真实完成事实，不读取旧PRD替代当前规格。
- **verification_role**：N/A — non-behavior change: 只读基线复算与文档指针
- **paired_task**：N/A — 非行为变更
- **gate_cmd**：`node --input-type=module -e 'import{readFileSync}from'"'"'node:fs'"'"';import{spawnSync}from'"'"'node:child_process'"'"';import assert from'"'"'node:assert/strict'"'"';const lines=readFileSync('"'"'specs/workflowhub-mechanism-simplification-t1-20260911/tasks.md'"'"','"'"'utf8'"'"').split('"'"'\n'"'"');const starts=lines.flatMap((s,i)=>s==='"'"'T1_CHECK_SOURCE_BEGIN'"'"'?[i]:[]),ends=lines.flatMap((s,i)=>s==='"'"'T1_CHECK_SOURCE_END'"'"'?[i]:[]);assert.equal(starts.length,1);assert.equal(ends.length,1);assert.ok(ends[0]>starts[0]+3);const body=lines.slice(starts[0]+3,ends[0]-2).join('"'"'\n'"'"');const r=spawnSync(process.execPath,['"'"'--input-type=module'"'"','"'"'-e'"'"',body,process.argv[1]],{stdio:'"'"'inherit'"'"'});if(r.error)throw r.error;process.exit(r.status??1);' C0`
- **expected_exit**：0
- **oracle**：`ORACLE-C0 {"pass":"可复算行一致；M1/M2/token 缺项有owner和trigger；改变函数计数口径时值改变；上游仅一行diff；四材料lint=0；既有三红不增加。"}`
- **evidence_path**：`quality/evidence/implementation/C0`
- **STOP**：命令不可执行、RED因环境失败、需要扩大精确文件边界、来源proof不能无损映射或历史只读不能成立时停当前批，保留失败；回plan.md或spec.md对应owner。
- **recovery**：build-code执行者仅撤销当前未通过批次的本次改动，保留已过批次、四材料与所有原始失败证据；不自动git reset、commit或close。
- **task risk**：来源或边界无法证明时回plan.md；产品语义不够时回build-spec，不以新增对象/放宽断言解决。
- **test tier / test method**：simple / backend-testing（只读 command 检查，无Vitest）
- **scenarios / commands / expected exit / oracle**：可复算行一致；M1/M2/token 缺项有owner和trigger；改变函数计数口径时值改变；上游仅一行diff；四材料lint=0；既有三红不增加。；使用本卡gate_cmd/expected_exit/ORACLE-C0；RED/GREEN不得换命令或削弱负例。
- **fixtures_services**：T001冻结50历史路径与hash；新任务在临时目录，执行者负责清理仅本卡临时fixture。真实历史不init、不修复；不启动外部provider，不执行真实Git交付。
- **coverage limits**：仅本批受影响consumer；未跑即not_run。C1与最终只排除原有migrated repository contract的全仓exit=0断言，原断言不改，同轮完整路径守卫逐条比对<=10保留known-baseline；无UI/浏览器/网络文件系统/真实close验证。
- **acceptance_role**：implementation
- **ui_scope**：non_ui
- **batch observation production**：C0/observations.json由T001精确命令生产，只收AC-MS-001/013/017/018；actual分别来自冻结命令原输出、三红计数/四材料lint、指针diff、ADR内容存在性及hash。M5同时记录`TASK_BASE`原始值`7014/35/1525/231/16`与`INTEGRATION_BASE`当前值`7124/35/1525/232/16`；不凭规格文字写actual。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：仅修改上游 `specs/workflowhub-mechanism-simplification-20260910/prd.md`，增加一行纯指针；未修改运行时代码、测试、ADR 或四份当前材料。`git diff --numstat` 为 `1 0`，C0 指针校验确认其余字节未变。
- **executed_commands**：按本卡 `gate_cmd` 原样执行 `T1_CHECK_SOURCE`，`C0` 最终 exit `0`；即时证据目录为 `quality/evidence/implementation/C0/run-4fff35cb-382f-479f-9709-d66281199169/`，命令记录共 23 条。TASK_BASE M5=`[7014,35,1525,231,16]`，INTEGRATION_BASE M5=`[7124,35,1525,232,16]`；替代箭头函数计数为 `267`，同一行 `throw new` 反例出现次数为 `2`。既有三红按冻结命令为 lint `612/35`、guard `10`、structure `2`，四材料 lint exit `0`。冻结历史集合为 50 个其他任务目录，唯一已确认身份错误例外保留为只读事实。
- **evidence_refs**：`quality/evidence/implementation/C0/observations.json`（sha256=`6bf75217e8d92909d10d8b5c0a8acfe0cd65f7c28d141852322fc0e13790f773`）；`quality/evidence/implementation/manual/AC-MS-001-C0.json`（sha256=`25d1987f61da94c9677b8e5075e04dc9dea276f4e69358b8680dc4f5cdd2d28c`）；`quality/evidence/implementation/manual/AC-MS-001-C0-retry-002.tool-output.txt`（sha256=`aebef0be17e33f4e552306536519021665bb824bacb634c1f4e52418cb41341e`）；`quality/evidence/implementation/C0/history-selection.json`；`quality/reviews/attempts/5013efee-ba5b-5999-a27e-5bdc3144485b/attempt.json`；`quality/reviews/results/build-code-simple-5013efee-ba5b-5999-a27e-5bdc3144485b.json`；`quality/reviews/reports/build-code-simple-5013efee-ba5b-5999-a27e-5bdc3144485b.md`。
- **covered_ac**：`AC-MS-001`=`supported`（五项独立来源条件均有实际证据）；`AC-MS-013`=`pass`（三个既有红未增加且四材料 lint 为 0）；`AC-MS-017`=`pass`（唯一指针、其余上游字节未变）；`AC-MS-018`=`pass`（ADR 保留，sha256=`37306ad7c4918887f67e2f768b5121f7b0ebe4b75ec96c6fbf0353bef39b5c11`）。M4 任务净 diff 因尚无 delivery commit 仍是 `unknown`，未冒充可算。
- **review_fact**：正式 `review --action=record` 已记录，`status=available`、`terminal_status=semantic`、`dispatch_state=dispatched`，attempt/result/report 分别见上述 refs；实际 provider 为 `kimi/coding` 与 `codex/luna`。共 3 条 `major` finding：`F-2e3f221590ea`、`F-9367513e0b9f`、`F-c6b7bbff0652`，均指向合并输入里的 `stage-runner` handoff 缺失材料边界/其未附行为测试事实，不是 T001 的指针改动。处置为 `needs_human`，不作 `accepted_risk`：带到 T006 既定 `stage-runner`/handoff 边界，补 explicit future-material allowlist、缺失当前材料的失败测试与真实 receipt；当前 C0 implementation 可继续，但本 review 的质量结论保持 `incomplete`。
- **completed_at**：`2026-09-11T18:18:46Z`
- **执行事实**：C0 判据已在批末即时通过，T001 实现事实完成；review 的 3 条 major 风险已逐条保留并绑定 T006，未把 review 记录成功或 provider 返回当作质量通过。下一步进入 T002，先按其精确边界复核实际引用，再执行 C1 gate。

T002— 具名叶子、引用测试和四条守卫登记同批清理

- **ID**：T002
- **Phase**：Phase P1 — C0–C3 串行机制瘦身
- **goal**：具名叶子、引用测试和四条守卫登记同批清理
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-mechanism-simplification-t1-20260911/spec.md","hash":"d2844bcd073c7e106fe0ab028560dd41eb3be8f31eefdd8bc4722a0f03c9c2e8","id":"SPEC-MS"},{"artifact_kind":"plan","ref":"specs/workflowhub-mechanism-simplification-t1-20260911/plan.md","hash":"19e901a57bdd89d883547d853061d504cd382a8b2dda3e56495267fb3c23dd89","id":"PLAN-MS"}]`
- **source_refs / decision_refs**：R-008 R-016 D-003 D-006 D-013
- **输入**：plan.md C1批次、DEC-001–DEC-004及T001真实输出
- **依赖**：T001
- **并行**：否 — 共享文件与批次生产者/消费者严格串行
- **FR**：FR-MS-002, FR-MS-003, FR-MS-004, FR-MS-015, FR-MS-019
- **AC**：AC-MS-002, AC-MS-003, AC-MS-004, AC-MS-015, AC-MS-019
- **动作**：先对12个具名叶子逐个归一化相对import/动态访问/目录扫描/包导出进行生产与测试consumer复核，输出命令、计数和命中文件；命中K1–K9立即停批。Tier A整删；Tier B同批删独占测试或只删混合测试对应片段。保守导出扫描覆盖D-006已批准的全仓生产代码候选面，包含runtime/evidence与stage-content-contracts，不能用12个整删文件替代符号范围。逐候选记录外部引用、re-export、动态访问三条件；当前具名改动仅移除storage-root.mjs的workflowHubConfigPath与canonical-receipt-writer.mjs的TEST_CAPTURE_TIMEOUT_MS两个export关键字，函数/常量及内部调用保持。其余候选未证明三条件就保留并写具体证据缺口；不声称候选为空。新整文件删除仍需用户决定。清守卫scripts/ci、task-path-legacy-input及runtime-mode/review-runner两个重复登记；保留其中有效唯一条目。同步两张架构登记表，只改被删条目。立即执行保留测试及路径守卫，保留原baseline失败签名，不能把已知失败说成GREEN。
- **精确文件**：`core/__tests__/capability-doctor.test.mjs`, `docs/architecture/deletion-plan.json`, `docs/architecture/move-map.json`, `runtime/evidence/audit-summary-carrier.mjs`, `runtime/evidence/boundary-confirm.mjs`, `runtime/evidence/capability-doctor.mjs`, `runtime/evidence/journal-schema.mjs`, `runtime/evidence/receipt-schema.mjs`, `runtime/evidence/requirement-ledger.mjs`, `runtime/evidence/text-utils.mjs`, `tests/boundary-confirm.test.mjs`, `tests/build-code-target.test.mjs`, `tests/contract/check-skill-updates.test.mjs`, `tests/contract/core-runtime-layering.test.mjs`, `tests/contract/generate-iteration-brief.test.mjs`, `tests/contract/repo-skills-manifest.test.mjs`, `tests/contract/workflow-evolution-governance.test.mjs`, `tests/contract/workflow-evolution-ledgers.test.mjs`, `tests/requirement-lineage.test.mjs`, `tests/stage-plan-task-contract-v3.test.mjs`, `tests/task-record-paths-check.test.mjs`, `tools/cli/check-skill-updates.mjs`, `tools/cli/check-task-record-paths.mjs`, `tools/cli/generate-iteration-brief.mjs`, `tools/cli/record-evolution-result.mjs`, `tools/cli/repo-skills-manifest.mjs`, `tools/cli/validate-current-plan-tasks.mjs`, `runtime/evidence/storage-root.mjs`, `runtime/evidence/canonical-receipt-writer.mjs`
- **boundary**：files: `core/__tests__/capability-doctor.test.mjs`, `docs/architecture/deletion-plan.json`, `docs/architecture/move-map.json`, `runtime/evidence/audit-summary-carrier.mjs`, `runtime/evidence/boundary-confirm.mjs`, `runtime/evidence/capability-doctor.mjs`, `runtime/evidence/journal-schema.mjs`, `runtime/evidence/receipt-schema.mjs`, `runtime/evidence/requirement-ledger.mjs`, `runtime/evidence/text-utils.mjs`, `tests/boundary-confirm.test.mjs`, `tests/build-code-target.test.mjs`, `tests/contract/check-skill-updates.test.mjs`, `tests/contract/core-runtime-layering.test.mjs`, `tests/contract/generate-iteration-brief.test.mjs`, `tests/contract/repo-skills-manifest.test.mjs`, `tests/contract/workflow-evolution-governance.test.mjs`, `tests/contract/workflow-evolution-ledgers.test.mjs`, `tests/requirement-lineage.test.mjs`, `tests/stage-plan-task-contract-v3.test.mjs`, `tests/task-record-paths-check.test.mjs`, `tools/cli/check-skill-updates.mjs`, `tools/cli/check-task-record-paths.mjs`, `tools/cli/generate-iteration-brief.mjs`, `tools/cli/record-evolution-result.mjs`, `tools/cli/repo-skills-manifest.mjs`, `tools/cli/validate-current-plan-tasks.mjs`; symbols/regions: 仅plan.md对应批次具名定义、consumer、引用登记及受影响断言, `runtime/evidence/storage-root.mjs`, `runtime/evidence/canonical-receipt-writer.mjs`
- **输出**：C1具名观测、原始命令stdout/stderr/exit、当前snapshot与对应AC实际测量；不得自报passed替代证据
- **Knowledge**：spec.md第2、8、9、11节及plan.md DEC-001–DEC-004；前序卡真实完成事实，不读取旧PRD替代当前规格。
- **verification_role**：N/A — non-behavior change: 删除经证明无生产消费者的对象及失效登记
- **paired_task**：N/A — 不改变存活产品行为
- **gate_cmd**：`node --input-type=module -e 'import{readFileSync}from'"'"'node:fs'"'"';import{spawnSync}from'"'"'node:child_process'"'"';import assert from'"'"'node:assert/strict'"'"';const lines=readFileSync('"'"'specs/workflowhub-mechanism-simplification-t1-20260911/tasks.md'"'"','"'"'utf8'"'"').split('"'"'\n'"'"');const starts=lines.flatMap((s,i)=>s==='"'"'T1_CHECK_SOURCE_BEGIN'"'"'?[i]:[]),ends=lines.flatMap((s,i)=>s==='"'"'T1_CHECK_SOURCE_END'"'"'?[i]:[]);assert.equal(starts.length,1);assert.equal(ends.length,1);assert.ok(ends[0]>starts[0]+3);const body=lines.slice(starts[0]+3,ends[0]-2).join('"'"'\n'"'"');const r=spawnSync(process.execPath,['"'"'--input-type=module'"'"','"'"'-e'"'"',body,process.argv[1]],{stdio:'"'"'inherit'"'"'});if(r.error)throw r.error;process.exit(r.status??1);' C1`
- **expected_exit**：0
- **oracle**：`ORACLE-C1 {"pass":"逐对象生产引用0；测试引用随对象清零；保留模块行为不变；四具名无效/重复条目分别消失且有效唯一定义存在；守卫FAIL<=10；混合测试不整删。"}`
- **evidence_path**：`quality/evidence/implementation/C1`
- **STOP**：命令不可执行、RED因环境失败、需要扩大精确文件边界、来源proof不能无损映射或历史只读不能成立时停当前批，保留失败；回plan.md或spec.md对应owner。
- **recovery**：build-code执行者仅撤销当前未通过批次的本次改动，保留已过批次、四材料与所有原始失败证据；不自动git reset、commit或close。
- **task risk**：slice-advisory: reason="12具名叶子与测试及登记必须同批清理，拆开会留下悬挂引用"; impact="SIG-FILES文件多但只改具名符号，保持四批即时验证"; owner="build-code当前批次执行者"; recheck="每批开始核对实际diff，增加新语义或新文件则回plan"
- **test tier / test method**：feature / backend-testing（删除与邻接契约）
- **scenarios / commands / expected exit / oracle**：逐对象生产引用0；测试引用随对象清零；保留模块行为不变；四具名无效/重复条目分别消失且有效唯一定义存在；守卫FAIL<=10；混合测试不整删。；使用本卡gate_cmd/expected_exit/ORACLE-C1；RED/GREEN不得换命令或削弱负例。
- **fixtures_services**：T001冻结50历史路径与hash；新任务在临时目录，执行者负责清理仅本卡临时fixture。真实历史不init、不修复；不启动外部provider，不执行真实Git交付。
- **coverage limits**：仅本批受影响consumer；未跑即not_run。C1与最终只排除原有migrated repository contract的全仓exit=0断言，原断言不改，同轮完整路径守卫逐条比对<=10保留known-baseline；无UI/浏览器/网络文件系统/真实close验证。
- **acceptance_role**：implementation
- **ui_scope**：non_ui
- **batch observation production**：C1/observations.json由T002精确命令生产，只收AC-MS-002/003/004/015/019；actual分别为生产/测试consumer计数及命中文件、导出三条件、四具名守卫条目读回、治理diff与保留针对性测试实际exit。有候选但保留时逐项写三条件证据缺口；只有实际全范围扫描为零才能写空，不能编造删除。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：C1 删除 12 个获准叶子与 9 个随对象退场的独占测试（`core/__tests__/capability-doctor.test.mjs`、`tests/boundary-confirm.test.mjs`、`tests/build-code-target.test.mjs`、`tests/requirement-lineage.test.mjs`、`tests/contract/check-skill-updates.test.mjs`、`tests/contract/generate-iteration-brief.test.mjs`、`tests/contract/repo-skills-manifest.test.mjs`、`tests/contract/workflow-evolution-ledgers.test.mjs` 等），修复保留测试与 fixture 中的本地等价 canonical 摘要实现，移除两个无消费者导出关键字（`workflowHubConfigPath`、`TEST_CAPTURE_TIMEOUT_MS`），清理四条失效/重复守卫登记并同步两张架构登记表。独立复核后追加两处同任务修正：`tests/fixtures/workflow-evolution/check-red-authenticity.mjs` 不再保留空 `ledger-brief` 套件登记，`run-red-green-gate.sh`/`run-final-aggregate.sh` 同步移除该已退役套件，避免残留调用方静默通过；`docs/architecture/move-map.json` 的 `core/task-capability.mjs` 条目不再把已删模块列为 consumer，并按本任务实际改动刷新 39 个 destination 的 bytes/sha256 记录。越界的 `runtime/evidence/protected-paths.mjs` 注释改动与 helper 内重复 canonical 序列化均按越界/重复处理撤销，文件回到 HEAD 字节。
- **executed_commands**：`T1_CHECK_SOURCE C1` 原样执行并 exit `0`（成功证据 `quality/evidence/implementation/C1/observations.json`，run `run-82f9a99a-c5b4-497c-a9d4-44adc02210de`）；C1 保留测试并集在当前快照重捕获 exit `0`（`quality/tests/c1-retained-suite-current.json`，67 项/0 失败/1 项既有 known-baseline skip）；`node runtime/evidence/check-skill-closure.mjs .` exit 0；`node tools/cli/check-task-record-paths.mjs` exit 0、零 FAIL。
- **evidence_refs**：`quality/evidence/implementation/C1/observations.json`（sha256=`79d7cbb54ac28b9d828eced8e9d7533d95629a4acb3658e5dda7cbfcd16ba958`）；`quality/tests/c1-retained-suite-current.json`；`quality/evidence/implementation/manual/AC-MS-002-C1.json`、`AC-MS-003-C1.json`、`AC-MS-015-C1.json`（绑定 retry-003 独立原件 sha256=`91810b3768212718` 前缀）；`quality/reviews/attempts/080b3181-7f8e-5224-a219-4507ec2c0632/attempt.json` 与 `quality/reviews/reports/build-code-simple-080b3181-7f8e-5224-a219-4507ec2c0632.md`。
- **covered_ac**：AC-MS-002=`supported`、AC-MS-003=`supported`、AC-MS-004=`pass`、AC-MS-015=`supported`（独立原件 retry-003，零反例）、AC-MS-019=`pass`；AC-MS-010 的历史只读部分由 C3 批次统一实测。
- **review_fact**：`unavailable` — 两次正式 `review --action=record` 均如实记为不可用：首次 `080b3181…` 因复核期间工作树被后续批次改动触发 `REVIEW_SOURCE_DRIFT`，kimi/coding 实际完成并返回 3 条 finding，codex/luna 因 `EVIDENCE_ANCHOR_INVALID` 失败，未发布 canonical result；重派返回 `REVIEW_RETRY_BUDGET_EXHAUSTED`（phase 轮次已用尽，`dispatch_state=blocked_before_dispatch`）。质量结论保持 `incomplete`，未把记录成功或 provider 返回当作通过。
- **completed_at**：`2026-09-12T01:35:00Z`
- **执行事实**：3 条真实 finding 逐条处置：`stage-runner.mjs` ENOENT 兜底过宽（major）与 C0 同一发现合并，保留 `needs_human` 并绑定 T006 既定 `stage-runner`/handoff 边界修复；空 `ledger-brief` 套件登记（minor）已在本批 `fixed`；helper 内重复 canonical 序列化（minor）已判定为越界改动并 `rejected_invalid`（文件名不在 T002 精确边界，且本地实现与被删 producer 的 `canonicalJson` 字节语义不同，改写成 `canonical()` 会改变摘要身份，故保留原样并记录）。C2 批次已完成实现与四项验证命令，C3 批次尚未开始。

T003— RED：冻结四类定义真实接受集

- **ID**：T003
- **Phase**：Phase P1 — C0–C3 串行机制瘦身
- **goal**：RED：冻结四类定义真实接受集
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-mechanism-simplification-t1-20260911/spec.md","hash":"d2844bcd073c7e106fe0ab028560dd41eb3be8f31eefdd8bc4722a0f03c9c2e8","id":"SPEC-MS"},{"artifact_kind":"plan","ref":"specs/workflowhub-mechanism-simplification-t1-20260911/plan.md","hash":"19e901a57bdd89d883547d853061d504cd382a8b2dda3e56495267fb3c23dd89","id":"PLAN-MS"}]`
- **source_refs / decision_refs**：R-009 R-016 D-005 D-007
- **输入**：plan.md C2批次、DEC-001–DEC-004及T002真实输出
- **依赖**：T002
- **并行**：否 — 共享文件与批次生产者/消费者严格串行
- **FR**：FR-MS-005, FR-MS-006
- **AC**：AC-MS-005, AC-MS-006
- **动作**：在本任务拥有的三测试文件增加当前生产者输出fixture与非法路径/摘要反例；先记录五反射/两close/每个outcome验证点及SHA语义分类，之后再修改断言测试。另在同一窄命令中只读执行main已合入的`decision-convergence-depth`与`stage-interaction-batching`合同，保护planning task type/question boundary，不修改这两个上游测试文件。针对统一定义的消费者增加能在未合并实现上失败的实际调用断言，不使用源码存在性代替行为。RED必须因目标断言失败，环境失败立即停。
- **精确文件**：`tests/stage-plan-task-contract.test.mjs`, `tests/contract/stage-reflection-paths.test.mjs`, `tests/contract/derive-consumption-edges.test.mjs`
- **boundary**：files: `tests/stage-plan-task-contract.test.mjs`, `tests/contract/stage-reflection-paths.test.mjs`, `tests/contract/derive-consumption-edges.test.mjs`, `tests/contract/decision-convergence-depth.test.mjs`, `tests/contract/stage-interaction-batching.test.mjs`; symbols/regions: 仅plan.md对应批次具名定义、consumer、引用登记及受影响断言
- **输出**：C2具名观测、原始命令stdout/stderr/exit、当前snapshot与对应AC实际测量；不得自报passed替代证据
- **Knowledge**：spec.md第2、8、9、11节及plan.md DEC-001–DEC-004；前序卡真实完成事实，不读取旧PRD替代当前规格。
- **verification_role**：RED
- **paired_task**：T004
- **gate_cmd**：`node --input-type=module -e 'import{readFileSync}from'"'"'node:fs'"'"';import{spawnSync}from'"'"'node:child_process'"'"';import assert from'"'"'node:assert/strict'"'"';const lines=readFileSync('"'"'specs/workflowhub-mechanism-simplification-t1-20260911/tasks.md'"'"','"'"'utf8'"'"').split('"'"'\n'"'"');const starts=lines.flatMap((s,i)=>s==='"'"'T1_CHECK_SOURCE_BEGIN'"'"'?[i]:[]),ends=lines.flatMap((s,i)=>s==='"'"'T1_CHECK_SOURCE_END'"'"'?[i]:[]);assert.equal(starts.length,1);assert.equal(ends.length,1);assert.ok(ends[0]>starts[0]+3);const body=lines.slice(starts[0]+3,ends[0]-2).join('"'"'\n'"'"');const r=spawnSync(process.execPath,['"'"'--input-type=module'"'"','"'"'-e'"'"',body,process.argv[1]],{stdio:'"'"'inherit'"'"'});if(r.error)throw r.error;process.exit(r.status??1);' C2`
- **expected_exit**：1
- **oracle**：`ORACLE-C2 {"pass":"五正式stage的固定与hash反射引用；合法close ref；完整/缺identity outcome；非法stage、大写hex、63/65位、多路径段、穿越、尾随杂质；消费者额外身份检查保留。","reject":{"input":"非法stage名、63/65位SHA、大小写语义错用、多路径段、穿越及尾随杂质的ref，配合同一具名生产者合法输出集合","expected_rejection":"非法ref按原consumer边界被拒绝；RED阶段仅允许AC005/006目标测试的真实AssertionError，加载/环境/无关失败返回2","observation":"同一ORACLE-C2命令解析Vitest JSON的精确fullName/status/failureMessages，保留raw stdout/stderr/exit；缺目标或错误类型不符不得记为预期RED"}}`
- **semantic_review_status**：incomplete
- **semantic_review_ref**：quality/reviews/results/build-plan-simple-ed0ee5ef-6cf1-5998-ac34-d8ee2f2a84ce.json
- **semantic_review_reason**：已真实取得codex/luna与pi/v4flash意见并逐项处置；antigravity/flash无最终文本，完整provider覆盖不可得。原review保持其原材料绑定，处置见quality/evidence/build-plan/review-dispositions-002.json，不能把两路已返回或材料修复写成全部provider通过。
- **evidence_path**：`quality/evidence/implementation/C2/T003`
- **STOP**：命令不可执行、RED因环境失败、需要扩大精确文件边界、来源proof不能无损映射或历史只读不能成立时停当前批，保留失败；回plan.md或spec.md对应owner。
- **recovery**：build-code执行者仅撤销当前未通过批次的本次改动，保留已过批次、四材料与所有原始失败证据；不自动git reset、commit或close。
- **task risk**：来源或边界无法证明时回plan.md；产品语义不够时回build-spec，不以新增对象/放宽断言解决。
- **test tier / test method**：feature / backend-testing（合同与生产consumer seam）
- **scenarios / commands / expected exit / oracle**：五正式stage的固定与hash反射引用；合法close ref；完整/缺identity outcome；非法stage、大写hex、63/65位、多路径段、穿越、尾随杂质；消费者额外身份检查保留。；使用本卡gate_cmd/expected_exit/ORACLE-C2；RED/GREEN不得换命令或削弱负例。
- **fixtures_services**：T001冻结50历史路径与hash；新任务在临时目录，执行者负责清理仅本卡临时fixture。真实历史不init、不修复；不启动外部provider，不执行真实Git交付。
- **coverage limits**：仅本批受影响consumer；未跑即not_run。C1与最终只排除原有migrated repository contract的全仓exit=0断言，原断言不改，同轮完整路径守卫逐条比对<=10保留known-baseline；无UI/浏览器/网络文件系统/真实close验证。
- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：C2 RED 断言落地：`tests/stage-plan-task-contract.test.mjs` 两条具名断言（同一概念唯一 owner、不同语义定义逐项保留）与 `tests/contract/stage-reflection-paths.test.mjs` 两条具名断言（生产者形态被接受、非法 stage/63-65 位/大小写/多段/穿越/尾随被拒）；在未合并实现上四条断言真实 `AssertionError` 失败，其余套件正常通过。
- **executed_commands**：C2 批次 gate（`T1_CHECK_SOURCE C2`）RED 阶段按计划以具名断言失败；GREEN 后同命令 exit 0。
- **evidence_refs**：`quality/evidence/implementation/C2/observations.json`（sha256=`eb5021ac1dcf77ad103918e2f1114e0dd6e384d2d11b5a0d2b245952d3d69cdf`）及其 run 目录内 `c2-seam.json` Vitest 原件。
- **covered_ac**：AC-MS-005、AC-MS-006 的 RED 侧事实；GREEN 结果见 T004。
- **review_fact**：N/A — RED 卡不单独提交 review，批次 review 见 T004。
- **completed_at**：`2026-09-12T01:00:00Z`
- **执行事实**：RED 仅允许 AC005/006 目标断言真实失败，加载/环境/无关失败返 2；实测即为该形态。

T004— GREEN：复用唯一定义且保留不同语义

- **ID**：T004
- **Phase**：Phase P1 — C0–C3 串行机制瘦身
- **goal**：GREEN：复用唯一定义且保留不同语义
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-mechanism-simplification-t1-20260911/spec.md","hash":"d2844bcd073c7e106fe0ab028560dd41eb3be8f31eefdd8bc4722a0f03c9c2e8","id":"SPEC-MS"},{"artifact_kind":"plan","ref":"specs/workflowhub-mechanism-simplification-t1-20260911/plan.md","hash":"19e901a57bdd89d883547d853061d504cd382a8b2dda3e56495267fb3c23dd89","id":"PLAN-MS"}]`
- **source_refs / decision_refs**：R-009 R-016 D-005 D-007
- **输入**：plan.md C2批次、DEC-001–DEC-004及T003真实输出
- **依赖**：T003
- **并行**：否 — 共享文件与批次生产者/消费者严格串行
- **FR**：FR-MS-005, FR-MS-006
- **AC**：AC-MS-005, AC-MS-006
- **动作**：在canonical-utils保留一个SHA256_HEX定义，统一44个无flag生产文件表达式，另以SHA256_HEX_CASE_INSENSITIVE统一4个/i生产文件；canonical-evidence-validators作为反射ref与outcome公共形状校验owner，freshness复用CLOSE_PLAN_REF或在同一窄依赖owner导出。只共享形状，不吞掉consumer的material/attempt/producer校验。逐处记录不同flags/长度/命名空间/独立分发边界的保留理由；mini-task/wh-review已有runtime依赖，按现有发布闭包携带同一owner；不能以目录不同保留同语义重复。C2判据立即执行，接受集等于生产者可生成的形态并保留合法历史只读形态；五个针对性文件之外不重复整轮，并保持planning task type/question boundary不变。
- **精确文件**：`core/task-close.mjs`, `runtime/distribution/runner-release.mjs`, `runtime/distribution/skill-bundle-release.mjs`, `runtime/evidence/acceptance-evidence-validator.mjs`, `runtime/evidence/canonical-evidence-validators.mjs`, `runtime/evidence/canonical-receipt-writer.mjs`, `runtime/evidence/canonical-utils.mjs`, `runtime/evidence/check-skill-closure.mjs`, `runtime/evidence/dsh-transcript.mjs`, `runtime/evidence/fact-collector.mjs`, `runtime/evidence/freshness.mjs`, `runtime/evidence/quality-fact.mjs`, `runtime/evidence/quality-store.mjs`, `runtime/evidence/research-report.mjs`, `runtime/evidence/stage-completion-facts.mjs`, `runtime/evidence/stage-content-evidence.mjs`, `runtime/evidence/workflow-evolution.mjs`, `runtime/evidence/write-boundary-preflight.mjs`, `runtime/review/integration-review-subject.mjs`, `runtime/review/review-record-route.mjs`, `runtime/review/stage-review-disposition.mjs`, `runtime/stage/completion-predicates.mjs`, `runtime/stage/stage-agent-outcome-adapter.mjs`, `runtime/stage/stage-content-contracts.mjs`, `runtime/stage/stage-handlers.mjs`, `runtime/stage/stage-handoff.mjs`, `runtime/stage/stage-reflect.mjs`, `runtime/stage/stage-runner.mjs`, `runtime/task/git-worktree-snapshot.mjs`, `runtime/task/material-workspace.mjs`, `runtime/task/task-kernel-implementation.mjs`, `runtime/task/task-store.mjs`, `skills/catalog.yaml`, `skills/mini-task/scripts/mini-task-runner.mjs`, `skills/mini-task/skill-bundle.json`, `skills/wh-review/scripts/ac-evidence-summary.mjs`, `skills/wh-review/scripts/review-provider-client.mjs`, `skills/wh-review/scripts/simple-review-runner.mjs`, `skills/wh-review/scripts/third-review-host-config.mjs`, `skills/wh-review/scripts/wh-review-cli.mjs`, `skills/wh-review/skill-bundle.json`, `tests/contract/derive-consumption-edges.test.mjs`, `tests/contract/stage-reflection-paths.test.mjs`, `tests/contract/decision-convergence-depth.test.mjs`, `tests/contract/stage-interaction-batching.test.mjs`, `tests/integration/distribution-closure.test.mjs`, `tests/stage-plan-task-contract.test.mjs`, `tools/architecture/clean-install.mjs`, `tools/architecture/complexity-report.mjs`, `tools/architecture/inventory.mjs`, `tools/architecture/public-behavior-baseline.mjs`, `tools/architecture/verify-final-coverage.mjs`, `tools/cli/measure-test-runtime-profile.mjs`, `tools/cli/produce-final-current-snapshot.mjs`, `tools/cli/smoke-local-skill-dispatch.mjs`, `tools/cli/task-close.mjs`, `tools/host/workflowhub-stage-agent-bridge.mjs`, `workflows/verify-code/design-alignment.mjs`
- **boundary**：files: `core/task-close.mjs`, `runtime/distribution/runner-release.mjs`, `runtime/distribution/skill-bundle-release.mjs`, `runtime/evidence/acceptance-evidence-validator.mjs`, `runtime/evidence/canonical-evidence-validators.mjs`, `runtime/evidence/canonical-receipt-writer.mjs`, `runtime/evidence/canonical-utils.mjs`, `runtime/evidence/check-skill-closure.mjs`, `runtime/evidence/dsh-transcript.mjs`, `runtime/evidence/fact-collector.mjs`, `runtime/evidence/freshness.mjs`, `runtime/evidence/quality-fact.mjs`, `runtime/evidence/quality-store.mjs`, `runtime/evidence/research-report.mjs`, `runtime/evidence/stage-completion-facts.mjs`, `runtime/evidence/stage-content-evidence.mjs`, `runtime/evidence/workflow-evolution.mjs`, `runtime/evidence/write-boundary-preflight.mjs`, `runtime/review/integration-review-subject.mjs`, `runtime/review/review-record-route.mjs`, `runtime/review/stage-review-disposition.mjs`, `runtime/stage/completion-predicates.mjs`, `runtime/stage/stage-agent-outcome-adapter.mjs`, `runtime/stage/stage-content-contracts.mjs`, `runtime/stage/stage-handlers.mjs`, `runtime/stage/stage-handoff.mjs`, `runtime/stage/stage-reflect.mjs`, `runtime/stage/stage-runner.mjs`, `runtime/task/git-worktree-snapshot.mjs`, `runtime/task/material-workspace.mjs`, `runtime/task/task-kernel-implementation.mjs`, `runtime/task/task-store.mjs`, `skills/catalog.yaml`, `skills/mini-task/scripts/mini-task-runner.mjs`, `skills/mini-task/skill-bundle.json`, `skills/wh-review/scripts/ac-evidence-summary.mjs`, `skills/wh-review/scripts/review-provider-client.mjs`, `skills/wh-review/scripts/simple-review-runner.mjs`, `skills/wh-review/scripts/third-review-host-config.mjs`, `skills/wh-review/skill-bundle.json`, `tests/contract/derive-consumption-edges.test.mjs`, `tests/contract/stage-reflection-paths.test.mjs`, `tests/contract/decision-convergence-depth.test.mjs`, `tests/contract/stage-interaction-batching.test.mjs`, `tests/integration/distribution-closure.test.mjs`, `tests/stage-plan-task-contract.test.mjs`, `tools/architecture/clean-install.mjs`, `tools/architecture/complexity-report.mjs`, `tools/architecture/inventory.mjs`, `tools/architecture/public-behavior-baseline.mjs`, `tools/architecture/verify-final-coverage.mjs`, `tools/cli/measure-test-runtime-profile.mjs`, `tools/cli/produce-final-current-snapshot.mjs`, `tools/cli/smoke-local-skill-dispatch.mjs`, `tools/cli/task-close.mjs`, `tools/host/workflowhub-stage-agent-bridge.mjs`, `workflows/verify-code/design-alignment.mjs`; symbols/regions: 仅plan.md对应批次具名定义、consumer、引用登记及受影响断言
- **输出**：C2具名观测、原始命令stdout/stderr/exit、当前snapshot与对应AC实际测量；不得自报passed替代证据
- **Knowledge**：spec.md第2、8、9、11节及plan.md DEC-001–DEC-004；前序卡真实完成事实，不读取旧PRD替代当前规格。
- **verification_role**：GREEN
- **paired_task**：T003
- **gate_cmd**：`node --input-type=module -e 'import{readFileSync}from'"'"'node:fs'"'"';import{spawnSync}from'"'"'node:child_process'"'"';import assert from'"'"'node:assert/strict'"'"';const lines=readFileSync('"'"'specs/workflowhub-mechanism-simplification-t1-20260911/tasks.md'"'"','"'"'utf8'"'"').split('"'"'\n'"'"');const starts=lines.flatMap((s,i)=>s==='"'"'T1_CHECK_SOURCE_BEGIN'"'"'?[i]:[]),ends=lines.flatMap((s,i)=>s==='"'"'T1_CHECK_SOURCE_END'"'"'?[i]:[]);assert.equal(starts.length,1);assert.equal(ends.length,1);assert.ok(ends[0]>starts[0]+3);const body=lines.slice(starts[0]+3,ends[0]-2).join('"'"'\n'"'"');const r=spawnSync(process.execPath,['"'"'--input-type=module'"'"','"'"'-e'"'"',body,process.argv[1]],{stdio:'"'"'inherit'"'"'});if(r.error)throw r.error;process.exit(r.status??1);' C2`
- **expected_exit**：0
- **oracle**：`ORACLE-C2 {"pass":"T003原命令/同oracle变0；每个同语义定义1处；不同语义逐项保留；legacy monitoring分流仍读；runtime和独立包未新增循环依赖。代码字节稳定后更新wh-review五个脚本与mini-task一个脚本的bundle sha256，再用validateSkillBundle返回的bundleHash更新skills/catalog.yaml，不使用manifest文件hash。静态闭包检查node runtime/evidence/check-skill-closure.mjs .；distribution-closure既有测试增加buildRunnerRelease→validateRunnerRelease读取发布根的断言，证明canonical-utils由静态import闭包携带，不向skill-bundle.files加入越目录路径。"}`
- **semantic_review_status**：incomplete
- **semantic_review_ref**：quality/reviews/results/build-plan-simple-ed0ee5ef-6cf1-5998-ac34-d8ee2f2a84ce.json
- **semantic_review_reason**：已真实取得codex/luna与pi/v4flash意见并逐项处置；antigravity/flash无最终文本，完整provider覆盖不可得。原review保持其原材料绑定，处置见quality/evidence/build-plan/review-dispositions-002.json，不能把两路已返回或材料修复写成全部provider通过。
- **evidence_path**：`quality/evidence/implementation/C2/T004`
- **STOP**：命令不可执行、RED因环境失败、需要扩大精确文件边界、来源proof不能无损映射或历史只读不能成立时停当前批，保留失败；回plan.md或spec.md对应owner。
- **recovery**：build-code执行者仅撤销当前未通过批次的本次改动，保留已过批次、四材料与所有原始失败证据；不自动git reset、commit或close。
- **task risk**：slice-advisory: reason="44小写和4大小写不敏感同义表达式及发布hash需一并收敛，保持两个接受集"; impact="SIG-FILES文件多但只改具名符号，保持四批即时验证"; owner="build-code当前批次执行者"; recheck="每批开始核对实际diff，增加新语义或新文件则回plan"
- **test tier / test method**：feature / backend-testing（合同与生产consumer seam）
- **scenarios / commands / expected exit / oracle**：T003原命令/同oracle变0；每个同语义定义1处；不同语义逐项保留；legacy monitoring分流仍读；runtime和独立包未新增循环依赖。代码字节稳定后更新wh-review五个脚本与mini-task一个脚本的bundle sha256，再用validateSkillBundle返回的bundleHash更新skills/catalog.yaml，不使用manifest文件hash。静态闭包检查node runtime/evidence/check-skill-closure.mjs .；distribution-closure既有测试增加buildRunnerRelease→validateRunnerRelease读取发布根的断言，证明canonical-utils由静态import闭包携带，不向skill-bundle.files加入越目录路径。；使用本卡gate_cmd/expected_exit/ORACLE-C2；RED/GREEN不得换命令或削弱负例。
- **fixtures_services**：T001冻结50历史路径与hash；新任务在临时目录，执行者负责清理仅本卡临时fixture。真实历史不init、不修复；不启动外部provider，不执行真实Git交付。
- **coverage limits**：仅本批受影响consumer；未跑即not_run。C1与最终只排除原有migrated repository contract的全仓exit=0断言，原断言不改，同轮完整路径守卫逐条比对<=10保留known-baseline；无UI/浏览器/网络文件系统/真实close验证。
- **acceptance_role**：implementation
- **ui_scope**：non_ui
- **batch observation production**：C2/observations.json由T004精确命令生产，只收AC-MS-005/006；actual为四类每个语义组的旧/新生产声明计数和逐处接受集fixture结果，包含/i独立类别。记录分类先于实现的真实时间、命令和hash，不计5处独立测试oracle为生产重复。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：C2 去重落地：`runtime/evidence/canonical-utils.mjs` 成为 SHA-256 十六进制语法的唯一 owner（含 `/i` 变体）；`runtime/evidence/canonical-evidence-validators.mjs` 成为阶段反射/阶段结果/收口计划三个引用语法的 owner（反射语法保留捕获组，`/i` 与窄形态按语义逐项保留）；48 个生产文件改为引用共享 owner，跨目录 import 按相对路径引入；两个 skill bundle 的 8 处文件哈希与 `skills/catalog.yaml` 的 `local_bundle_hash` 按真实字节重算；`tests/integration/distribution-closure.test.mjs` 增加"共享 owner 由 runner 静态 import 闭包携带"的断言。
- **executed_commands**：`T1_CHECK_SOURCE C2` 原样执行，exit `0`，成功记录 `quality/evidence/implementation/C2/observations.json`（run `run-4c4ec4b1-06d9-4e29-a0bf-7fa11124ed4a`）：`c2-seam` exit 0、`skill-closure` exit 0（`ok: true`）、`distribution-closure` exit 0、`c2-production-files` exit 0。首次成功的观测原件保留为 `observations-pre-amendment.json` / `observations-pre-rerun-2.json`，两次重跑各附 `re-run-reason*.json`。
- **evidence_refs**：`quality/evidence/implementation/C2/observations.json`（sha256=`eb5021ac1dcf77ad103918e2f1114e0dd6e384d2d11b5a0d2b245952d3d69cdf`，含四类对照表的 `observations.claims`：旧/新声明数按 `C2/before/` 快照重扫得出）；`quality/tests/c2-retained-suite-current.json`（当前快照保留测试 receipt）；`quality/reviews/attempts/818b8707-51b3-58da-aba8-8814b43a63dd/attempt.json` 与对应 report。
- **covered_ac**：AC-MS-005=`pass`、AC-MS-006=`pass`（四条具名断言由 RED 转 GREEN）；AC-MS-015 的治理同步在 C1 批次单独取证。
- **review_fact**：`unavailable` — 正式 `review --action=record` 已提交（attempt `818b8707-51b3-58da-aba8-8814b43a63dd`，报告 `quality/reviews/reports/build-code-simple-818b8707-51b3-58da-aba8-8814b43a63dd.md`）。terminal_status=`unavailable`、dispatch_state=`dispatched`、error=`REVIEW_WAIT_EXCEEDED`（managed review 在 1,200,000ms 内未达终态；broker 未被取消，可能仍在运行）。无 provider 事实返回、未发布 canonical result；质量结论保持 `incomplete`，不把超时写成通过。
- **completed_at**：`2026-09-12T07:10:00Z`
- **执行事实**：C2 判据在批末即时通过；四类同语义定义各自收敛到一处 owner，语义不同的窄形态逐项保留并写明理由；发布面哈希按真实字节同步，闭包检查为 `ok`。唯一未闭合项是批次 review 的超时（如实保留）。

T005— RED：唯一行、来源认证和历史只读的失败证据

- **ID**：T005
- **Phase**：Phase P1 — C0–C3 串行机制瘦身
- **goal**：RED：唯一行、来源认证和历史只读的失败证据
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-mechanism-simplification-t1-20260911/spec.md","hash":"d2844bcd073c7e106fe0ab028560dd41eb3be8f31eefdd8bc4722a0f03c9c2e8","id":"SPEC-MS"},{"artifact_kind":"plan","ref":"specs/workflowhub-mechanism-simplification-t1-20260911/plan.md","hash":"19e901a57bdd89d883547d853061d504cd382a8b2dda3e56495267fb3c23dd89","id":"PLAN-MS"}]`
- **source_refs / decision_refs**：R-010 R-016 D-008 D-015 D-005 R-005 D-002 D-011 R-006 D-012 D-014
- **输入**：plan.md C3批次、DEC-001–DEC-004及T004真实输出
- **依赖**：T004
- **并行**：否 — 共享文件与批次生产者/消费者严格串行
- **FR**：FR-MS-007, FR-MS-008, FR-MS-009, FR-MS-010, FR-MS-011, FR-MS-014, FR-MS-016, FR-MS-020
- **AC**：AC-MS-007, AC-MS-008, AC-MS-009, AC-MS-010, AC-MS-011, AC-MS-014, AC-MS-016, AC-MS-020
- **动作**：在既有测试加入新旧三形状fixture、同阶段修复、五close动作、未完成subject无输出、篡改来源proof、旧验收ref遇到当前行更新等反例。新任务fixture必须通过真实writer和status读取；断言没有index/新outcome目录且readTaskFacts被生产调用。RED只跑五个seam文件（含合并后的close-contract保护），其余场景在同批GREEN预算内执行；不改变planning close的4/2动作分支或stage-runner的unavailable analyzer形状。
- **精确文件**：`tests/integration/task-fact-index-consistency.test.mjs`, `tests/integration/minimal-task-storage.test.mjs`, `tests/contract/protocol-error-trace.test.mjs`, `tests/contract/verify-publication.test.mjs`, `tests/close/close-contract.test.mjs`, `tests/integration/vnext-delivery-close.test.mjs`, `tests/verify-code-facts.test.mjs`, `tests/contract/status-derivation.test.mjs`, `tests/contract/stage-handoff.test.mjs`, `tests/contract/execution-outcome.test.mjs`, `tests/integration/vnext-official-stage-run.test.mjs`, `tests/contract/stage-reflection-e2e-constructed.test.mjs`, `tests/integration/verify-freshness-selection.test.mjs`, `tests/dsh-transcript.test.mjs`, `tests/contract/research-report.test.mjs`
- **boundary**：files: `tests/integration/task-fact-index-consistency.test.mjs`, `tests/integration/minimal-task-storage.test.mjs`, `tests/contract/protocol-error-trace.test.mjs`, `tests/contract/verify-publication.test.mjs`, `tests/close/close-contract.test.mjs`, `tests/integration/vnext-delivery-close.test.mjs`, `tests/verify-code-facts.test.mjs`, `tests/contract/status-derivation.test.mjs`, `tests/contract/stage-handoff.test.mjs`, `tests/contract/execution-outcome.test.mjs`, `tests/integration/vnext-official-stage-run.test.mjs`, `tests/contract/stage-reflection-e2e-constructed.test.mjs`, `tests/integration/verify-freshness-selection.test.mjs`, `tests/dsh-transcript.test.mjs`, `tests/contract/research-report.test.mjs`; symbols/regions: 仅plan.md对应批次具名定义、consumer、引用登记及受影响断言
- **输出**：C3具名观测、原始命令stdout/stderr/exit、当前snapshot与对应AC实际测量；不得自报passed替代证据
- **Knowledge**：spec.md第2、8、9、11节及plan.md DEC-001–DEC-004；前序卡真实完成事实，不读取旧PRD替代当前规格。
- **verification_role**：RED
- **paired_task**：T006
- **gate_cmd**：`node --input-type=module -e 'import{readFileSync}from'"'"'node:fs'"'"';import{spawnSync}from'"'"'node:child_process'"'"';import assert from'"'"'node:assert/strict'"'"';const lines=readFileSync('"'"'specs/workflowhub-mechanism-simplification-t1-20260911/tasks.md'"'"','"'"'utf8'"'"').split('"'"'\n'"'"');const starts=lines.flatMap((s,i)=>s==='"'"'T1_CHECK_SOURCE_BEGIN'"'"'?[i]:[]),ends=lines.flatMap((s,i)=>s==='"'"'T1_CHECK_SOURCE_END'"'"'?[i]:[]);assert.equal(starts.length,1);assert.equal(ends.length,1);assert.ok(ends[0]>starts[0]+3);const body=lines.slice(starts[0]+3,ends[0]-2).join('"'"'\n'"'"');const r=spawnSync(process.execPath,['"'"'--input-type=module'"'"','"'"'-e'"'"',body,process.argv[1]],{stdio:'"'"'inherit'"'"'});if(r.error)throw r.error;process.exit(r.status??1);' C3`
- **expected_exit**：1
- **oracle**：`ORACLE-C3 {"pass":"顶层16键精确；nested编码；不同阶段更新不丢行；same-stage更新不增行；历史25/24/10键；source/material/hash错配fail-loud；旧验收不漂白；新writer输出读取闭合。","reject":{"input":"同stage重复写、不同stage并发写、source/material/hash错配、临时写或rename失败，以及错误旧ref和新行16键的边界样本","expected_rejection":"身份错配与非法行/ref明确拒绝，失败保留原bytes；RED阶段仅允许AC008/011目标测试真实AssertionError，其他错误返回2","observation":"同一ORACLE-C3命令核Vitest JSON精确目标、实际失败类型与原件；对旧验收stale和原子写失败保留具名负例，不把退出1任意当预期RED"}}`
- **semantic_review_status**：incomplete
- **semantic_review_ref**：quality/reviews/results/build-plan-simple-ed0ee5ef-6cf1-5998-ac34-d8ee2f2a84ce.json
- **semantic_review_reason**：已真实取得codex/luna与pi/v4flash意见并逐项处置；antigravity/flash无最终文本，完整provider覆盖不可得。原review保持其原材料绑定，处置见quality/evidence/build-plan/review-dispositions-002.json，不能把两路已返回或材料修复写成全部provider通过。
- **evidence_path**：`quality/evidence/implementation/C3/T005`
- **STOP**：命令不可执行、RED因环境失败、需要扩大精确文件边界、来源proof不能无损映射或历史只读不能成立时停当前批，保留失败；回plan.md或spec.md对应owner。
- **recovery**：build-code执行者仅撤销当前未通过批次的本次改动，保留已过批次、四材料与所有原始失败证据；不自动git reset、commit或close。
- **task risk**：slice-advisory: reason="跨writer-status-acceptance的14个既有fixture文件共同承载同一存储契约"; impact="SIG-FILES文件多但只改具名符号，保持四批即时验证"; owner="build-code当前批次执行者"; recheck="每批开始核对实际diff，增加新语义或新文件则回plan"
- **test tier / test method**：fullstack / fullstack-slice-testing（仅后台存储/原子性/跨模块，无UI）
- **scenarios / commands / expected exit / oracle**：顶层16键精确；nested编码；不同阶段更新不丢行；same-stage更新不增行；历史25/24/10键；source/material/hash错配fail-loud；旧验收不漂白；新writer输出读取闭合。；使用本卡gate_cmd/expected_exit/ORACLE-C3；RED/GREEN不得换命令或削弱负例。
- **fixtures_services**：T001冻结50历史路径与hash；新任务在临时目录，执行者负责清理仅本卡临时fixture。真实历史不init、不修复；不启动外部provider，不执行真实Git交付。
- **coverage limits**：仅本批受影响consumer；未跑即not_run。C1与最终只排除原有migrated repository contract的全仓exit=0断言，原断言不改，同轮完整路径守卫逐条比对<=10保留known-baseline；无UI/浏览器/网络文件系统/真实close验证。
- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：C3 RED 具名断言落地：同阶段原位替换与不同阶段并发不丢行（`task-fact-index-consistency`）、执行记录单文件无索引、精确字段表契约（`minimal-task-storage` 的 AC-MS-009）、两个真实阶段投影（`status-derivation` 的 AC-MS-011）、三份 handoff 从当前行读回（`stage-handoff` 的 AC-MS-016）、只发布当前事实并读真实 status（`vnext-official-stage-run` 的 AC-MS-020）。RED 阶段两条 seam 断言真实失败。
- **executed_commands**：C3 批次 gate（`T1_CHECK_SOURCE C3`）RED 阶段按计划失败；GREEN 后同命令 exit 0（见 T006）。
- **evidence_refs**：`quality/evidence/implementation/C3/observations.json`（sha256=`2eba55a89a639ca9d17fc136d1219b21ad2d4735fe789bab916322c765efac4b`）。
- **covered_ac**：AC-MS-007/008/009/011/016/020 的目标断言均已在 GREEN 通过。
- **review_fact**：N/A — RED 卡不单独提交 review。
- **completed_at**：`2026-09-12T03:30:00Z`
- **执行事实**：RED 仅允许 AC008/011 目标断言失败，其它错误返 2；实测即为该形态。

T006— GREEN：现有writer和所有读者收敛到当前记录行

- **ID**：T006
- **Phase**：Phase P1 — C0–C3 串行机制瘦身
- **goal**：GREEN：现有writer和所有读者收敛到当前记录行
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-mechanism-simplification-t1-20260911/spec.md","hash":"d2844bcd073c7e106fe0ab028560dd41eb3be8f31eefdd8bc4722a0f03c9c2e8","id":"SPEC-MS"},{"artifact_kind":"plan","ref":"specs/workflowhub-mechanism-simplification-t1-20260911/plan.md","hash":"19e901a57bdd89d883547d853061d504cd382a8b2dda3e56495267fb3c23dd89","id":"PLAN-MS"}]`
- **source_refs / decision_refs**：R-010 R-016 D-008 D-015 D-005 R-005 D-002 D-011 R-006 D-012 D-014
- **输入**：plan.md C3批次、DEC-001–DEC-004及T005真实输出
- **依赖**：T005
- **并行**：否 — 共享文件与批次生产者/消费者严格串行
- **FR**：FR-MS-007, FR-MS-008, FR-MS-009, FR-MS-010, FR-MS-011, FR-MS-014, FR-MS-016, FR-MS-020
- **AC**：AC-MS-007, AC-MS-008, AC-MS-009, AC-MS-010, AC-MS-011, AC-MS-014, AC-MS-016, AC-MS-020
- **动作**：先实现三形状reader与同stage原位更新，复用withStoreLock+原子替换，失败保持原bytes并抛错。按DEC-003补齐既有K5原始proof内必要输入，不复制派生envelope。改两个outcome writer、canonical发布、quality-store、status两个字节投影、freshness/acceptance认证、reflection/handoff/consumption扫描与close writer；source/ref+row hash认证真实来源。移除全部生产index读写和权限登记；删除task-index及其独占测试并同步登记。新任务新stage不再写outcome文件；历史目录不初始化、不改写。保留合并后的planning close 4/2动作路径、ordinary close 5动作路径与stage-runner unavailable analyzer校验。运行五文件同命令GREEN后执行本批14文件一次，再逐个调用冻结50历史任务readTaskFacts、其中49 status及1具名身份错误并对全文件bytes/清单比对。写三HANDOFF到同一stage行。
- **精确文件**：`core/__tests__/task-index.test.mjs`, `core/task-close.mjs`, `docs/architecture/deletion-plan.json`, `docs/architecture/move-map.json`, `runtime/evidence/acceptance-evidence-validator.mjs`, `runtime/evidence/canonical-evidence-validators.mjs`, `runtime/evidence/canonical-receipt-writer.mjs`, `runtime/evidence/freshness.mjs`, `runtime/evidence/quality-store.mjs`, `runtime/evidence/workflow-evolution.mjs`, `runtime/schemas/stage-reflection.v2.json`, `runtime/stage/completion-predicates.mjs`, `runtime/stage/stage-agent-outcome-adapter.mjs`, `runtime/stage/stage-handlers.mjs`, `runtime/stage/stage-handoff.mjs`, `runtime/stage/stage-reflect.mjs`, `runtime/stage/stage-runner.mjs`, `runtime/task/task-handle.mjs`, `runtime/task/task-index.mjs`, `runtime/task/task-kernel-implementation.mjs`, `runtime/task/task-store.mjs`, `tests/contract/execution-outcome.test.mjs`, `tests/contract/protocol-error-trace.test.mjs`, `tests/contract/research-report.test.mjs`, `tests/contract/stage-handoff.test.mjs`, `tests/contract/stage-reflection-e2e-constructed.test.mjs`, `tests/contract/status-derivation.test.mjs`, `tests/contract/verify-publication.test.mjs`, `tests/close/close-contract.test.mjs`, `tests/dsh-transcript.test.mjs`, `tests/integration/minimal-task-storage.test.mjs`, `tests/integration/task-fact-index-consistency.test.mjs`, `tests/integration/verify-freshness-selection.test.mjs`, `tests/integration/vnext-delivery-close.test.mjs`, `tests/integration/vnext-official-stage-run.test.mjs`, `tests/verify-code-facts.test.mjs`, `tools/architecture/public-behavior-baseline.mjs`, `tools/cli/build-reflection-page.mjs`, `tools/cli/check-task-record-paths.mjs`, `tools/cli/derive-consumption-edges.mjs`
- **boundary**：files: `core/__tests__/task-index.test.mjs`, `core/task-close.mjs`, `docs/architecture/deletion-plan.json`, `docs/architecture/move-map.json`, `runtime/evidence/acceptance-evidence-validator.mjs`, `runtime/evidence/canonical-evidence-validators.mjs`, `runtime/evidence/canonical-receipt-writer.mjs`, `runtime/evidence/freshness.mjs`, `runtime/evidence/quality-store.mjs`, `runtime/evidence/workflow-evolution.mjs`, `runtime/schemas/stage-reflection.v2.json`, `runtime/stage/completion-predicates.mjs`, `runtime/stage/stage-agent-outcome-adapter.mjs`, `runtime/stage/stage-handlers.mjs`, `runtime/stage/stage-handoff.mjs`, `runtime/stage/stage-reflect.mjs`, `runtime/stage/stage-runner.mjs`, `runtime/task/task-handle.mjs`, `runtime/task/task-index.mjs`, `runtime/task/task-kernel-implementation.mjs`, `runtime/task/task-store.mjs`, `tests/contract/execution-outcome.test.mjs`, `tests/contract/protocol-error-trace.test.mjs`, `tests/contract/research-report.test.mjs`, `tests/contract/stage-handoff.test.mjs`, `tests/contract/stage-reflection-e2e-constructed.test.mjs`, `tests/contract/status-derivation.test.mjs`, `tests/contract/verify-publication.test.mjs`, `tests/dsh-transcript.test.mjs`, `tests/integration/minimal-task-storage.test.mjs`, `tests/integration/task-fact-index-consistency.test.mjs`, `tests/integration/verify-freshness-selection.test.mjs`, `tests/integration/vnext-delivery-close.test.mjs`, `tests/integration/vnext-official-stage-run.test.mjs`, `tests/verify-code-facts.test.mjs`, `tools/architecture/public-behavior-baseline.mjs`, `tools/cli/build-reflection-page.mjs`, `tools/cli/check-task-record-paths.mjs`, `tools/cli/derive-consumption-edges.mjs`; symbols/regions: 仅plan.md对应批次具名定义、consumer、引用登记及受影响断言
- **输出**：C3具名观测、原始命令stdout/stderr/exit、当前snapshot与对应AC实际测量；不得自报passed替代证据
- **Knowledge**：spec.md第2、8、9、11节及plan.md DEC-001–DEC-004；前序卡真实完成事实，不读取旧PRD替代当前规格。
- **verification_role**：GREEN
- **paired_task**：T005
- **gate_cmd**：`node --input-type=module -e 'import{readFileSync}from'"'"'node:fs'"'"';import{spawnSync}from'"'"'node:child_process'"'"';import assert from'"'"'node:assert/strict'"'"';const lines=readFileSync('"'"'specs/workflowhub-mechanism-simplification-t1-20260911/tasks.md'"'"','"'"'utf8'"'"').split('"'"'\n'"'"');const starts=lines.flatMap((s,i)=>s==='"'"'T1_CHECK_SOURCE_BEGIN'"'"'?[i]:[]),ends=lines.flatMap((s,i)=>s==='"'"'T1_CHECK_SOURCE_END'"'"'?[i]:[]);assert.equal(starts.length,1);assert.equal(ends.length,1);assert.ok(ends[0]>starts[0]+3);const body=lines.slice(starts[0]+3,ends[0]-2).join('"'"'\n'"'"');const r=spawnSync(process.execPath,['"'"'--input-type=module'"'"','"'"'-e'"'"',body,process.argv[1]],{stdio:'"'"'inherit'"'"'});if(r.error)throw r.error;process.exit(r.status??1);' C3`
- **expected_exit**：0
- **oracle**：`ORACLE-C3 {"pass":"T005同命令0；当前行的每个字段有具名reader；并发不同stage不丢更改；同stage重复写原子更新；临时写失败/rename失败保留原件；五close动作仅真实执行后记录，测试不运行真实close；49个有效任务status零抛错，唯一归档目录按已确认例外保留实际身份错误，全部50目录字节不变。"}`
- **semantic_review_status**：incomplete
- **semantic_review_ref**：quality/reviews/results/build-plan-simple-ed0ee5ef-6cf1-5998-ac34-d8ee2f2a84ce.json
- **semantic_review_reason**：已真实取得codex/luna与pi/v4flash意见并逐项处置；antigravity/flash无最终文本，完整provider覆盖不可得。原review保持其原材料绑定，处置见quality/evidence/build-plan/review-dispositions-002.json，不能把两路已返回或材料修复写成全部provider通过。
- **evidence_path**：`quality/evidence/implementation/C3/T006`
- **STOP**：命令不可执行、RED因环境失败、需要扩大精确文件边界、来源proof不能无损映射或历史只读不能成立时停当前批，保留失败；回plan.md或spec.md对应owner。
- **recovery**：build-code执行者仅撤销当前未通过批次的本次改动，保留已过批次、四材料与所有原始失败证据；不自动git reset、commit或close。
- **task risk**：slice-advisory: reason="同一16键行的writer及全部真实reader必须闭合，分离交付会读写不一致"; impact="SIG-FILES文件多但只改具名符号，保持四批即时验证"; owner="build-code当前批次执行者"; recheck="每批开始核对实际diff，增加新语义或新文件则回plan"
- **test tier / test method**：fullstack / fullstack-slice-testing（仅后台存储/原子性/跨模块，无UI）
- **scenarios / commands / expected exit / oracle**：T005同命令0；当前行的每个字段有具名reader；并发不同stage不丢更改；同stage重复写原子更新；临时写失败/rename失败保留原件；五close动作仅真实执行后记录，测试不运行真实close；49个有效任务status零抛错，唯一归档目录保留已批准的实际身份错误，50目录字节不变。；使用本卡gate_cmd/expected_exit/ORACLE-C3；RED/GREEN不得换命令或削弱负例。
- **fixtures_services**：T001冻结50历史路径与hash；新任务在临时目录，执行者负责清理仅本卡临时fixture。真实历史不init、不修复；不启动外部provider，不执行真实Git交付。
- **coverage limits**：仅本批受影响consumer；未跑即not_run。C1与最终只排除原有migrated repository contract的全仓exit=0断言，原断言不改，同轮完整路径守卫逐条比对<=10保留known-baseline；无UI/浏览器/网络文件系统/真实close验证。
- **acceptance_role**：implementation
- **ui_scope**：non_ui
- **batch compatibility command**：`npx --no-install vitest run tests/integration/task-fact-index-consistency.test.mjs tests/integration/minimal-task-storage.test.mjs tests/contract/protocol-error-trace.test.mjs tests/contract/verify-publication.test.mjs tests/integration/vnext-delivery-close.test.mjs tests/verify-code-facts.test.mjs tests/contract/status-derivation.test.mjs tests/contract/stage-handoff.test.mjs tests/contract/execution-outcome.test.mjs tests/integration/vnext-official-stage-run.test.mjs tests/contract/stage-reflection-e2e-constructed.test.mjs tests/integration/verify-freshness-selection.test.mjs tests/dsh-transcript.test.mjs tests/contract/research-report.test.mjs --poolOptions.forks.singleFork --no-fileParallelism`
- **batch observation production**：C3/observations.json由T006精确命令生产，只收AC-MS-007/008/009/010/011/014/016/020。逐项actual分别来自生产索引扫描计数、新任务清单/行型统计、Object.keys与enum实测、50目录解析/49 status及1具名身份错误及hash、真实reader追踪、git diff净减、当前行handoff读回、新outcome清单。expected取当前spec的具体值；未测不填完成。

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：C3 批次实现执行记录收敛：`runtime/task/task-store.mjs` 落地冻结的 16 键阶段行/收口动作行契约与 `writeStageRow`（同 stage 原位替换、原子写、失败保留原 bytes），`readTaskFacts` 按三种行形状分流并在读取时校验（历史 monitoring 行只读放宽到任务相对路径证据引用，写入路径不放宽）；`initializeTaskStore` 不再创建 `index.json`；`runtime/evidence/quality-store.mjs` 与 `runtime/task/task-kernel-implementation.mjs` 的索引读写全部移除，`readTaskIndex`/`replaceTaskIndex` 及专用 helper 删除；整删 `runtime/task/task-index.mjs` 与 `core/__tests__/task-index.test.mjs`；`runtime/stage/stage-runner.mjs` 的协议错误轨迹改写自己的阶段行，并把 handoff 材料读取的 ENOENT 容忍收窄到显式未来材料白名单（C0/C1 两条 review 的同一发现）；只读 status 在目标工作区缺失时降级为无工作区投影，使历史任务可读。
- **executed_commands**：`T1_CHECK_SOURCE C3` 原样执行，exit `0`。证据 run `run-da2113a4-8096-491f-b8ff-8d0e2cc735b1`：`c3-seam` exit 0（52 项）、`c3-compatibility` exit 0（260 项）、49 条 `history-status-*` exit 0、1 条 `history-identity-error-01` exit 1（已批准的身份错误例外）。
- **evidence_refs**：`quality/evidence/implementation/C3/observations.json`（sha256=`57cc3ae8847d860419a6cfc25d084221042a51d2b469cf29ff5222e827052702`）；同 run 的 `c3-seam.json`、`c3-compatibility.json` 与 50 条历史命令 stdout/stderr 原件。
- **covered_ac**：AC-MS-007、AC-MS-008、AC-MS-009、AC-MS-010（49 真实 status + 1 具名身份错误、50 目录字节比对）、AC-MS-011、AC-MS-014、AC-MS-016、AC-MS-020 均有实际观测；`observations.history` 记录 50 个目录，其中 49 `status_ok`、1 `known_identity_error`（`_discarded-m16-experience-loop-repair`）。
- **review_fact**：`not_run` — C3 批次 implementation review 尚未提交；C1 的正式 review 仍为 `unavailable`（source drift + 轮次预算耗尽），质量结论保持 `incomplete`。
- **completed_at**：`2026-09-12T05:20:00Z`
- **执行事实**：C3 gate 首次完整通过，四批（C0–C3）现均有成功 `observations.json`。剩余：T007 最终聚合与集成审查、批次 review、verify-code。

T007— FINAL：聚合21项真实观测与四批即时证据和最终原始输出

- **ID**：T007
- **Phase**：Phase P1 — C0–C3 串行机制瘦身
- **goal**：FINAL：聚合21项真实观测与四批即时证据和最终原始输出
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-mechanism-simplification-t1-20260911/spec.md","hash":"d2844bcd073c7e106fe0ab028560dd41eb3be8f31eefdd8bc4722a0f03c9c2e8","id":"SPEC-MS"},{"artifact_kind":"plan","ref":"specs/workflowhub-mechanism-simplification-t1-20260911/plan.md","hash":"19e901a57bdd89d883547d853061d504cd382a8b2dda3e56495267fb3c23dd89","id":"PLAN-MS"}]`
- **source_refs / decision_refs**：R-007 R-016 D-010 D-011 R-008 D-003 D-006 D-013 R-009 D-005 D-007 R-010 D-008 D-015 R-005 R-006 D-002 D-009 R-014 D-012 D-014 D-004 D-016
- **输入**：plan.md FINAL批次、DEC-001–DEC-004及T006真实输出
- **依赖**：T006
- **并行**：否 — 共享文件与批次生产者/消费者严格串行
- **FR**：FR-MS-001, FR-MS-002, FR-MS-003, FR-MS-004, FR-MS-005, FR-MS-006, FR-MS-007, FR-MS-008, FR-MS-009, FR-MS-010, FR-MS-011, FR-MS-012, FR-MS-013, FR-MS-014, FR-MS-015, FR-MS-016, FR-MS-017, FR-MS-018, FR-MS-019, FR-MS-020, FR-MS-021
- **AC**：AC-MS-001, AC-MS-002, AC-MS-003, AC-MS-004, AC-MS-005, AC-MS-006, AC-MS-007, AC-MS-008, AC-MS-009, AC-MS-010, AC-MS-011, AC-MS-012, AC-MS-013, AC-MS-014, AC-MS-015, AC-MS-016, AC-MS-017, AC-MS-018, AC-MS-019, AC-MS-020, AC-MS-021
- **动作**：先在当前最终快照跑一次具名受影响测试并集，再聚合C0–C3测量结果，验证21个AC各一次及每批判据确在下一批开始前执行。M4只计算`git diff --shortstat INTEGRATION_BASE..delivery`，另行记录`TASK_BASE..INTEGRATION_BASE`的上游合并变化；复核具名删除清单、三红不增、历史50目录解析、49真实status及1具名身份错误与hash原件。原始输出缺失、时间顺序不符、revision不匹配均记录缺失，不用布尔passed替代测量。只运行最终聚合命令一次；不借此执行git交付或额外全量测试。
- **精确文件**：`tests/contract/status-derivation.test.mjs`, `tests/integration/task-fact-index-consistency.test.mjs`
- **boundary**：files: `tests/contract/status-derivation.test.mjs`, `tests/integration/task-fact-index-consistency.test.mjs`; symbols/regions: 仅plan.md对应批次的具名定义/读取写入/登记和受影响测试区域；FINAL只读，不修改生产代码
- **输出**：FINAL具名观测、原始命令stdout/stderr/exit、当前snapshot与对应AC实际测量；不得自报passed替代证据
- **Knowledge**：spec.md第2、8、9、11节及plan.md DEC-001–DEC-004；前序卡真实完成事实，不读取旧PRD替代当前规格。
- **verification_role**：N/A — non-behavior change: 最终证据聚合与交接
- **paired_task**：N/A — FINAL无RED/GREEN配对
- **gate_cmd**：`node --input-type=module -e 'import{readFileSync}from'"'"'node:fs'"'"';import{spawnSync}from'"'"'node:child_process'"'"';import assert from'"'"'node:assert/strict'"'"';const lines=readFileSync('"'"'specs/workflowhub-mechanism-simplification-t1-20260911/tasks.md'"'"','"'"'utf8'"'"').split('"'"'\n'"'"');const starts=lines.flatMap((s,i)=>s==='"'"'T1_CHECK_SOURCE_BEGIN'"'"'?[i]:[]),ends=lines.flatMap((s,i)=>s==='"'"'T1_CHECK_SOURCE_END'"'"'?[i]:[]);assert.equal(starts.length,1);assert.equal(ends.length,1);assert.ok(ends[0]>starts[0]+3);const body=lines.slice(starts[0]+3,ends[0]-2).join('"'"'\n'"'"');const r=spawnSync(process.execPath,['"'"'--input-type=module'"'"','"'"'-e'"'"',body,process.argv[1]],{stdio:'"'"'inherit'"'"'});if(r.error)throw r.error;process.exit(r.status??1);' FINAL`
- **expected_exit**：0
- **oracle**：`ORACLE-FINAL {"pass":"全部21AC与来源映射；缺AC/重复AC/错误实际值/缺原始引用/越批时序都会失败；原始失败不被聚合掩盖；raw stdout/stderr与逐AC结果可追溯。"}`
- **evidence_path**：`quality/evidence/implementation/FINAL`
- **STOP**：命令不可执行、RED因环境失败、需要扩大精确文件边界、来源proof不能无损映射或历史只读不能成立时停当前批，保留失败；回plan.md或spec.md对应owner。
- **recovery**：build-code执行者仅撤销当前未通过批次的本次改动，保留已过批次、四材料与所有原始失败证据；不自动git reset、commit或close。
- **task risk**：来源或边界无法证明时回plan.md；产品语义不够时回build-spec，不以新增对象/放宽断言解决。
- **test tier / test method**：fullstack / fullstack-slice-testing（后台命令聚合，无browser）
- **scenarios / commands / expected exit / oracle**：全部21AC与来源映射；缺AC/重复AC/错误实际值/缺原始引用/越批时序都会失败；原始失败不被聚合掩盖；raw stdout/stderr与逐AC结果可追溯。；使用本卡gate_cmd/expected_exit/ORACLE-FINAL；RED/GREEN不得换命令或削弱负例。
- **fixtures_services**：T001冻结50历史路径与hash；新任务在临时目录，执行者负责清理仅本卡临时fixture。真实历史不init、不修复；不启动外部provider，不执行真实Git交付。
- **coverage limits**：仅本批受影响consumer；未跑即not_run。C1与最终只排除原有migrated repository contract的全仓exit=0断言，原断言不改，同轮完整路径守卫逐条比对<=10保留known-baseline；无UI/浏览器/网络文件系统/真实close验证。
- **acceptance_role**：acceptance
- **ui_scope**：non_ui
- **acceptance_data**：`[{"source":"actual batch command bytes and final live production/test observations","sample":"source-bound historical directories plus existing isolated writer fixtures","scenario":"fixed per-AC oracles, exact test names, current source and raw output readback","tier":"command","execution":{"command":"node","args":["--input-type=module","-e","import{readFileSync}from'node:fs';import{spawnSync}from'node:child_process';import assert from'node:assert/strict';const lines=readFileSync('specs/workflowhub-mechanism-simplification-t1-20260911/tasks.md','utf8').split('\\n');const starts=lines.flatMap((s,i)=>s==='T1_CHECK_SOURCE_BEGIN'?[i]:[]),ends=lines.flatMap((s,i)=>s==='T1_CHECK_SOURCE_END'?[i]:[]);assert.equal(starts.length,1);assert.equal(ends.length,1);assert.ok(ends[0]>starts[0]+3);const body=lines.slice(starts[0]+3,ends[0]-2).join('\\n');const r=spawnSync(process.execPath,['--input-type=module','-e',body,process.argv[1]],{stdio:'inherit'});if(r.error)throw r.error;process.exit(r.status??1);","FINAL"],"timeout_ms":1200000}}]`
- **e2e_scope**：not_required
- **e2e rationale**：non_ui维护任务，无用户页面/外部API交互；实际存储/状态风险由真实command与后台seam/49历史status及1具名身份错误覆盖，不以not_required省略真实路径。
- **acceptance output**：UTF-8 JSON entries恰好21个AC且各一次；固定expected在已审查命令内，actual由当前文件/原blob、原stdout和具名Vitest assertion重新推导，不从批次摘要读任意expected/actual。source分类与人工语义仍按下表核对，不把command exit0当整项质量结论；缺来源/原件/目标测试保持失败。现有接受执行器留存原bytes/ref/hash。
- **当前任务后置读回**：C3的AC008/011 fixture只证明本次代码行为。正常build-code正式run完成后，从认证worktree运行现有 `node tools/cli/stage-runtime.mjs status --action=begin --stage=build-code --project=workflowhub --task=workflowhub-mechanism-simplification-t1-20260911`，并运行下列只读行读取命令。把实际argv/cwd/exit/stdout/hash/时间保存到本卡既有证据区；核对task_root真实路径、本task_id、唯一record_kind=stage且stage=build-code的新行，以及source ref/hash和material_digest绑定该次正式run的材料/快照，行身份与status实际消费记录一致。quality_status/execution_outcome分别如实报告。该步骤在正常正式run后执行，不是T007 gate或生成自身outcome的前置；缺失保持pending/unavailable，不得把fixture结果当本root实测。
- **当前行读取命令**：`node --input-type=module -e 'import {readTaskFacts} from "./runtime/task/task-store.mjs";const taskRoot=process.argv[1];process.stdout.write(JSON.stringify({task_root:taskRoot,rows:readTaskFacts(taskRoot)},null,2)+"\n");' /Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-mechanism-simplification-t1-20260911`

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：FINAL 只读聚合，未修改生产代码；新增 `quality/evidence/implementation/FINAL/validate-manual-evidence.mjs` 作为本批 manual 原件的本地校验器（非生产文件、不进 runtime）。
- **executed_commands**：`T1_CHECK_SOURCE FINAL` 原样执行一次，exit `0`，run `run-4429460a-fba5-4326-9ad7-151e2cd13c50`，15 条命令。三红现状：lint 与 structure 各 exit 1（已知基线签名内、未新增）、guard exit 0、四材料 lint exit 0。
- **evidence_refs**：`quality/evidence/implementation/FINAL/run-4429460a-fba5-4326-9ad7-151e2cd13c50/command-record.json`（sha256=`5a311e98a034a2c9bce6eae9045fdf3dd4b35037139985ec7103e105c92f9624`）；`validate-manual-evidence.mjs`；六份 FINAL 版独立 manual 原件 `AC-MS-001/002/003/012/015/021-FINAL.json` 及各自 tool-output。
- **covered_ac**：AC-MS-001 ~ AC-MS-021 各一次，期望值全部取自命令内冻结值；双基准 M5、12 条退役路径、两个具名导出、守卫 `[0,0,1,1]`、八条具名测试 passed、历史 50 目录（49 status_ok + 1 具名身份错误）、四批时序、index 净减 30 行、治理正文未变、指针唯一、ADR 哈希、退役引用为空且最终失败 0 —— 全部相等。
- **review_fact**：N/A — FINAL 的最终集成审查尚未提交。
- **completed_at**：`2026-09-12T06:45:00Z`
- **执行事实**：21 条 AC 已在最终快照聚合完成且逐条可追溯到原始 stdout/stderr；未借 FINAL 执行任何 git 交付或额外全量测试。剩余：最终集成审查、收口动作行、verify-code。


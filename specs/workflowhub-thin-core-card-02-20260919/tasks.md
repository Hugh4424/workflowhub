# 任务清单：WorkflowHub SDD 文档权威与薄核心重构

- **Input**：`decision-log.md`、`spec.md`（`47eea7e4767b986700317c9f83655acb8ce6938f0b282d730c95c115338f5a8d`）、`plan.md`（`aeff98327b5abeea46a6ff1f0895d7e1571b4309865bfb66ea208b30fd261d34`）
- **Template version**：`plan-task.v4`

> Bootstrap 边界：本文件为当前 pre cohort 的现行 `plan-task.v4` 执行卡，必须按旧 build-plan 合同完整存在；它不是目标 post cohort 的第二工程权威。build-code 完成后，post cohort 只保留 phase 工程正文与纯指针执行索引，取消 plan/tasks 等价双写。

## 材料导航

| 章节 / 材料锚点 | 职责与摘要 | M/S/B/P 读取时机 |
| --- | --- | --- |
| `decision-log.md#决定` | 范围、取舍、风险、非目标 | M/S：首次；P：STOP 回看 |
| `spec.md#5-功能需求` | 22 条 FR | M/S：切片；P：任务开始 |
| `spec.md#11-验收标准` | 22 条 AC 与失败语义 | M/S：测试设计；P：RED/GREEN |
| `plan.md#file-boundary` | 全局唯一文件边界 | M：生成卡；P：越界检查 |
| `tasks.md#dependency-graph` | 11 卡执行顺序 | P：每卡开始/结束 |

## Phase P1 — 作者合同与 13 步 workflow

### Goal

四模板、K1–K12 与 13 步 build-plan 在现有 skill/workflow 中单写一致，净新增 0。

### Files

- **NEW**：N/A — 净新增 0。
- **MODIFY**：`skills/decision-log/SKILL.md`、`skills/decision-log/templates/decision-log-template.md`、`skills/decision-log/skill-bundle.json`、`skills/spec-specify/SKILL.md`、`skills/spec-specify/templates/spec-template.md`、`skills/spec-specify/skill-bundle.json`、`skills/spec-plan/SKILL.md`、`skills/spec-plan/templates/plan-template.md`、`skills/spec-plan/skill-bundle.json`、`skills/spec-tasks/SKILL.md`、`skills/spec-tasks/templates/tasks-template.md`、`skills/spec-tasks/skill-bundle.json`、`skills/spec-clarify/SKILL.md`、`skills/stage-reflection/SKILL.md`、`skills/spec-analyze/SKILL.md`、`skills/spec-analyze/skill-bundle.json`、`skills/wh-review/contracts/build-plan.md`、`skills/wh-review/scripts/review-materials.mjs`、`skills/wh-review/skill-bundle.json`、`skills/catalog.yaml`、`workflows/build-plan/SKILL.md`、`workflows/build-plan/steps.json`、`workflows/build-plan/skill-deps.yaml`、`workflows/build-spec/SKILL.md`、`workflows/build-spec/steps.json`、`workflows/build-spec/skill-deps.yaml`、`config/workflowhub.yaml`、`tests/decision-log-content-contract.test.mjs`、`tests/stage-review-cost-policy.test.mjs`、`tests/contract/spec-stage-artifact-closure.test.mjs`、`tests/contract/material-producer-consumer-roundtrip.test.mjs`。
- **DO NOT TOUCH**：runtime 文件；母 PRD；CARD-01 committed contract/topology/archive。

### Tasks

#### T001 — RED：作者合同拒绝旧结构与双写

- **ID**：T001
- **Phase**：Phase P1 — 作者合同与 13 步 workflow
- **goal**：用目标断言证明旧模板、28 步组合与 plan/tasks 双写不满足当前 spec。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"spec.md","hash":"47eea7e4767b986700317c9f83655acb8ce6938f0b282d730c95c115338f5a8d","id":"CARD02-SPEC"},{"artifact_kind":"plan","ref":"plan.md","hash":"aeff98327b5abeea46a6ff1f0895d7e1571b4309865bfb66ea208b30fd261d34","id":"CARD02-PLAN"}]`
- **source_refs / decision_refs**：R-001/R-002/R-003/R-005/R-006 → D-002/D-003/D-008/D-009/D-011 → FR-DOC-001..005/FR-OI-001/FR-TEST-001..003/FR-AUTH-001..002/FR-FLOW-001..003
- **输入**：当前四作者模板、两个 workflow manifest、K1–K12 映射与当前 bundle/catalog；已提交 CARD-01 contract/topology/acceptance。
- **依赖**：none
- **并行**：否 — first RED。
- **FR**：FR-DOC-001、FR-DOC-002、FR-DOC-003、FR-DOC-004、FR-DOC-005、FR-OI-001、FR-TEST-001、FR-TEST-002、FR-TEST-003、FR-AUTH-001、FR-AUTH-002、FR-FLOW-001、FR-FLOW-002、FR-FLOW-003
- **AC**：AC-DOC-001、AC-DOC-002、AC-DOC-003、AC-DOC-004、AC-DOC-005、AC-OI-001、AC-TEST-001、AC-TEST-002、AC-TEST-003、AC-AUTH-001、AC-AUTH-002、AC-FLOW-001、AC-FLOW-002、AC-FLOW-003
- **动作**：first action 读取 `docs/contracts/card-01-stage-material-interface.md`（sha256 `7aa596fb...e63`）、`runtime/task/task-topology.mjs` 与 focused baseline，核对 pre/post topology 和当前已知 22/23 acceptance 状态；通过接口核对后，只增加/收紧目标断言：四模板、13 步、单 phase 权威、纯指针索引、无 active 双写。
- **精确文件**：`tests/decision-log-content-contract.test.mjs`、`tests/stage-review-cost-policy.test.mjs`、`tests/contract/spec-stage-artifact-closure.test.mjs`、`tests/contract/material-producer-consumer-roundtrip.test.mjs`
- **boundary**：files 为上述 4 个测试；不改生产实现。
- **输出**：CARD-01 committed preflight 事实 + 非零 RED；RED 失败点逐项对应旧作者合同，不把已知 archive-path setup failure 混入本 gate。
- **Knowledge**：当前 spec 自身仍用 spec-content.v3；测试目标是未来合同。
- **verification_role**：RED
- **paired_task**：T002
- **gate_cmd**：`npx vitest run tests/decision-log-content-contract.test.mjs tests/stage-review-cost-policy.test.mjs tests/contract/spec-stage-artifact-closure.test.mjs tests/contract/material-producer-consumer-roundtrip.test.mjs`
- **expected_exit**：1
- **oracle**：`ORACLE-AUTHORING-001 {"pass":"目标合同全部成立","reject":{"input":"旧模板、旧 steps 与双写 fixture","expected_rejection":"目标断言非零失败且不是 setup","observation":"raw output 定位旧合同断言"}}`
- **semantic_review_status**：incomplete
- **semantic_review_ref**：quality/reviews/results/card02-authoring-phase-review.json（planned-not-produced）
- **semantic_review_reason**：规划态；独立审查将在配对 GREEN 后写回，当前不得宣称完成。
- **evidence_path**：`quality/tests/card02-authoring-red.json`
- **STOP**：CARD-01 contract/hash/topology 不匹配、测试无法加载、失败与目标无关、或断言要求新技能/模板时停止。
- **recovery**：build-code 主会话恢复测试到可执行状态，不弱化目标。
- **task risk**：把当前 spec 外壳误当未来模板，导致 bootstrap 假 RED。
- **test tier / test method**：feature / backend-testing — 跨作者合同与 workflow manifest。
- **runtime profile**：runtime profile=phase；ceiling=300000ms。
- **runtime permissions**：network=deny；db=deny；filesystem=worktree/temp only；subprocess=explicit vitest only；environment=local_ci。
- **scenarios / commands / expected exit / oracle**：旧四模板、旧 15+13 步、plan/tasks 等价双写；同 gate_cmd；nonzero；ORACLE-AUTHORING-001。
- **fixtures_services**：仓内模板与 manifest；无 provider/service。
- **coverage limits**：不验证 runtime active consumer。
- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：`tests/decision-log-content-contract.test.mjs`、`tests/stage-review-cost-policy.test.mjs`、`tests/contract/spec-stage-artifact-closure.test.mjs`、`tests/contract/material-producer-consumer-roundtrip.test.mjs`；只新增目标作者合同断言并移除与目标冲突的 plan/tasks 等价断言。
- **executed_commands**：`node tools/cli/stage-runtime.mjs verify --action=execute --stage=build-code --project=workflowhub --task=workflowhub-thin-core-card-02-20260919 --input=/tmp/workflowhub-card02.n5YUIJ/t001-red-capture.json`；receipt `exit_code=1`。
- **evidence_refs**：`quality/tests/card02-authoring-red.json#8f1d64eb90f56490065be9533ce45902601c8d9b3c49d590658536c4afb94036`；output `quality/tests/output/card02-authoring-red.output#44902fe2a3924d5d9888c805151faacd794f1da90c3104bf3393b4048a60b847`。
- **covered_ac**：`AC-DOC-001..005`、`AC-OI-001`、`AC-TEST-001..003`、`AC-AUTH-001..002`、`AC-FLOW-001..003` 均由 `ORACLE-AUTHORING-001` 的目标 RED 锁定；尚未 GREEN。
- **review_fact**：N/A — P1 review 按卡设计在配对 T002 GREEN 后执行。
- **completed_at**：`2026-09-21T00:34:11.074Z`
- **执行事实**：CARD-01 preflight 保持 pre cohort；四测试正确 nonzero，失败来自旧 ADR/template、旧 13-step ownership/deps、旧 plan/tasks 双写或作者 bundle 未同步；无 setup failure。

#### T002 — GREEN：原位改造作者技能与 build-plan workflow

- **ID**：T002
- **Phase**：Phase P1 — 作者合同与 13 步 workflow
- **goal**：让 T001 变绿，K1–K12 与 13 步无遗漏，净新增 0。
- **design_state**：ready
- **versioned_refs**：同 T001。
- **source_refs / decision_refs**：同 T001。
- **输入**：T001 真实 RED 与当前 skill/workflow bytes。
- **依赖**：T001
- **并行**：否 — 同一作者面与 bundle/catalog。
- **FR**：FR-DOC-001、FR-DOC-002、FR-DOC-003、FR-DOC-004、FR-DOC-005、FR-OI-001、FR-TEST-001、FR-TEST-002、FR-TEST-003、FR-AUTH-001、FR-AUTH-002、FR-FLOW-001、FR-FLOW-002、FR-FLOW-003
- **AC**：AC-DOC-001、AC-DOC-002、AC-DOC-003、AC-DOC-004、AC-DOC-005、AC-OI-001、AC-TEST-001、AC-TEST-002、AC-TEST-003、AC-AUTH-001、AC-AUTH-002、AC-FLOW-001、AC-FLOW-002、AC-FLOW-003
- **动作**：原位改 decision/spec/phase/index skill/template；build-plan 吸收 13 步；build-spec 标为历史只读；同步 bundle/catalog/config。
- **精确文件**：`skills/decision-log/SKILL.md`、`skills/decision-log/templates/decision-log-template.md`、`skills/decision-log/skill-bundle.json`、`skills/spec-specify/SKILL.md`、`skills/spec-specify/templates/spec-template.md`、`skills/spec-specify/skill-bundle.json`、`skills/spec-plan/SKILL.md`、`skills/spec-plan/templates/plan-template.md`、`skills/spec-plan/skill-bundle.json`、`skills/spec-tasks/SKILL.md`、`skills/spec-tasks/templates/tasks-template.md`、`skills/spec-tasks/skill-bundle.json`、`skills/spec-clarify/SKILL.md`、`skills/stage-reflection/SKILL.md`、`skills/spec-analyze/SKILL.md`、`skills/spec-analyze/skill-bundle.json`、`skills/wh-review/contracts/build-plan.md`、`skills/wh-review/scripts/review-materials.mjs`、`skills/wh-review/skill-bundle.json`、`skills/catalog.yaml`、`workflows/build-plan/SKILL.md`、`workflows/build-plan/steps.json`、`workflows/build-plan/skill-deps.yaml`、`workflows/build-spec/SKILL.md`、`workflows/build-spec/steps.json`、`workflows/build-spec/skill-deps.yaml`、`config/workflowhub.yaml`、`tests/decision-log-content-contract.test.mjs`、`tests/stage-review-cost-policy.test.mjs`、`tests/contract/spec-stage-artifact-closure.test.mjs`、`tests/contract/material-producer-consumer-roundtrip.test.mjs`
- **boundary**：不得修改 runtime、母 PRD、CARD-01；不得新增文件。
- **输出**：目标模板与 13 步 manifest，T001 gate exit 0。
- **Knowledge**：spec-tasks 只负责纯指针索引；不保留 plan/tasks 等价正文。
- **verification_role**：GREEN
- **paired_task**：T001
- **gate_cmd**：`npx vitest run tests/decision-log-content-contract.test.mjs tests/stage-review-cost-policy.test.mjs tests/contract/spec-stage-artifact-closure.test.mjs tests/contract/material-producer-consumer-roundtrip.test.mjs`
- **expected_exit**：0
- **oracle**：`ORACLE-AUTHORING-001 {"pass":"四模板、13 步、K1-K12 与单写全部通过，目标负例仍失败"}`
- **semantic_review_status**：incomplete
- **semantic_review_ref**：quality/reviews/results/card02-authoring-phase-review.json（planned-not-produced）
- **semantic_review_reason**：规划态；独立审查将在本 GREEN 后写回，当前不得宣称完成。
- **evidence_path**：`quality/tests/card02-authoring-green.json`
- **STOP**：需要 runtime compatibility bridge、第五材料或新技能时停止。
- **recovery**：整体回滚 P1 skill/workflow diff；保留测试 RED 证据。
- **task risk**：bundle hash/catalog 漏同步；旧 build-spec 被误物理删除；slice-advisory: reason="四模板、bundle/catalog 与两个 workflow manifest 必须由同一卡同步，否则作者合同会漂移"; impact="单卡精确文件超过10，审查与回滚成本上升"; owner="T002 作者合同 owner"; recheck="T002 GREEN 后核对 bundle hash、catalog 与 13 步 manifest"
- **test tier / test method**：feature / backend-testing。
- **runtime profile**：runtime profile=phase；ceiling=300000ms。
- **runtime permissions**：network=deny；db=deny；filesystem=worktree/temp only；subprocess=explicit vitest only；environment=local_ci。
- **scenarios / commands / expected exit / oracle**：目标结构、旧结构负例、bundle/catalog 一致；同 gate_cmd；0；ORACLE-AUTHORING-001。
- **fixtures_services**：仓内模板/manifest fixture；无服务。
- **coverage limits**：不证明 runtime 已切四阶段。
- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：四作者 template/skill、post 13-step workflow/deps、build-spec historical-only declaration、merged-review contract、stage-end analyzer/reflection、bundle/catalog 同步；`spec-tasks` 改为纯指针 index，不再生成 phase/task 卡正文。T011 首次 current union 发现 approve-decision observable-result 的单词间隔不满足既有 writer contract；已将其改为 `existing writer for confirmation`，不改变 direct confirmation/reply/rejection 语义。
- **executed_commands**：`git diff --check` exit 0；`node tools/cli/stage-runtime.mjs verify --action=execute --stage=build-code --project=workflowhub --task=workflowhub-thin-core-card-02-20260919 --input=/tmp/workflowhub-card02.n5YUIJ/t002-green-capture.json`；`npx --no-install vitest run tests/decision-log-content-contract.test.mjs --poolOptions.forks.singleFork --no-fileParallelism --reporter=verbose` exit 0（4/4）。
- **evidence_refs**：`quality/tests/card02-authoring-green-recheck2.json#1e6f661083d7151cecf6f9f0f688084ead0bb27ec4ebfd479a20da49c79eef96`；output `quality/tests/output/card02-authoring-green-recheck2.output#14ef8ad4c491aa1fca4c71795eeb9b40da51efbe58adcede2989878ce737f312`。
- **covered_ac**：`AC-DOC-001..005`、`AC-OI-001`、`AC-TEST-001..003`、`AC-AUTH-001..002`、`AC-FLOW-001..003`；21 targeted assertions GREEN。
- **review_fact**：`quality/reviews/attempts/9c18eac1-7fb9-5ca5-afce-3fd500e97a0d/attempt.json`，`unavailable` / `REVIEW_WAIT_EXCEEDED`。60 秒后 canonical attempt 已发布、lock 已释放；kimi/coding 与 codex/luna 仍 `running`，caller 未取消。无 findings/result 可伪造；该缺口限制 P1 质量完成声明，不阻止同 task 后续安全实现。
- **completed_at**：`2026-09-21T01:06:59.492Z`
- **执行事实**：ORACLE-AUTHORING-001 从目标 RED 转 GREEN；CARD-01 pre topology 未改；无新 stage、public command、store、skill 或兼容双写。P1 review 的 canonical unavailable 原件如上保留。

### Verify

- **Target**：FR-DOC/OI/TEST/AUTH/FLOW 作者合同。
- **gate_cmd**：同 T001/T002。
- **expected_exit**：0。
- **evidence_path**：`quality/tests/card02-authoring-green.json`。
- **Oracle**：ORACLE-AUTHORING-001。

### Knowledge

P2 必须消费 P1 的 current manifest；旧 build-spec 仅保留历史读取，不得重新注册 active。

### STOP

任何新增技能/模板/材料/public command 或母 PRD 写入。

### Done

T001/T002 证据、AC 映射、bundle/catalog 读回齐全。

### Risks and rollback

- **Risk**：名字不变但职责变化导致消费者漂移。
- **Prevention**：deps/catalog/consumer 测试同改。
- **Rollback / recovery**：回滚 P1 diff，不触碰当前四材料。

## Phase P2 — Runtime consumer、coverage 与 aggregate 删除

### Goal

CARD-01 已提交的 post/pre topology 持续为绿；CARD-02 build-plan runtime 消费单写材料；coverage 在 confirmation 事务内发布独立质量事实而非 gate；aggregate active 链清零，同时保留非阻断 direct diagnostic 语义。

### Files

- **NEW**：N/A。
- **MODIFY**：`runtime/stage/stage-handoff.mjs`、`runtime/stage/completion-predicates.mjs`、`runtime/stage/stage-content-contracts.mjs`、`runtime/stage/stage-handlers.mjs`、`runtime/stage/stage-runner.mjs`、`runtime/stage/stage-skill-runtime.mjs`、`runtime/review/stage-materials.json`、`runtime/task/task-kernel-implementation.mjs`、`runtime/task/task-store.mjs`、`runtime/task/task-handle.mjs`、`tools/cli/stage-runtime.mjs`、`tools/cli/check-decision-log-chain.mjs`、`tests/contract/phase-quality-handoff.test.mjs`、`tests/contract/stage-order-and-host-interaction.test.mjs`、`tests/contract/stage-routing-and-concrete-testing.test.mjs`、`tests/contract/spec-analyze-completeness.test.mjs`、`tests/contract/review-materials-contract.test.mjs`、`tests/contract/human-confirmation-v3.test.mjs`、`tests/contract/decision-log-chain-warnings.test.mjs`、`tests/stage-decision-contract.test.mjs`、`tests/stage-interaction-contract.test.mjs`、`tests/contract/make-decision-interaction-publication.test.mjs`、`tests/contract/decision-convergence-depth.test.mjs`、`tests/contract/zero-machine-gate-advancement.test.mjs`、`tests/acceptance/card-01-current.mjs`。
- **DO NOT TOUCH**：`docs/contracts/card-01-stage-material-interface.md`、`runtime/task/task-topology.mjs`、`tools/cli/task-bootstrap.mjs`、`runtime/schemas/interaction-completion.v1.json`、CARD-01 归档材料。

### Tasks

#### T003 — RED：single-writer 与 merged review consumer 目标断言

- **ID**：T003
- **Phase**：Phase P2 — Runtime consumer、coverage 与 aggregate 删除
- **goal**：证明 CARD-01 topology 已绿，但 build-plan material/review/analyze consumer 仍要求旧双写或旧 packet。
- **design_state**：ready
- **versioned_refs**：同 T001。
- **source_refs / decision_refs**：R-004/R-006 → D-007/D-009 → FR-REVIEW-001..003/FR-FLOW-001..003
- **输入**：P1 current workflow 与现有 runtime registries/packet/handler。
- **依赖**：T002
- **并行**：否 — producer-before-consumer。
- **FR**：FR-REVIEW-001、FR-REVIEW-002、FR-REVIEW-003、FR-FLOW-001、FR-FLOW-002、FR-FLOW-003
- **AC**：AC-REVIEW-001、AC-REVIEW-002、AC-REVIEW-003、AC-FLOW-001、AC-FLOW-002、AC-FLOW-003
- **动作**：增加 single writer、merged review/analyze packet 目标断言；把 CARD-01 pre/post topology、真实 CLI route 和 dual journey 作为必须保持绿色的只读前置；review assertions 必须覆盖每个 finding 的 disposition/owner/deadline、仅 concrete failure 改变才 retry、原始 finding 分母/有效 finding 分子/有效 anchor 分子/elapsed 计算，以及“无 oracle、无溯源、预写测试被改、不可逆操作缺确认门”四项结论+位置；加入 307200B 边界内成功、历史 T-075 的 362477B 完整输入超限 regression fixture、零静默截断、canonical unavailable/provenance 的 review fixture；不得把历史样本字节数冒充当前四材料大小。
- **精确文件**：`tests/contract/phase-quality-handoff.test.mjs`、`tests/contract/stage-order-and-host-interaction.test.mjs`、`tests/contract/stage-routing-and-concrete-testing.test.mjs`、`tests/contract/spec-analyze-completeness.test.mjs`、`tests/contract/review-materials-contract.test.mjs`
- **boundary**：只改上述 5 个 CARD-02 测试；`tests/contract/activation-cohort.test.mjs`、`tests/contract/task-topology-projection.test.mjs`、`tests/integration/card-01-dual-journey.test.mjs` 只读执行，不改断言。
- **输出**：非零 RED，只能来自双写、旧 packet 或超限输入被静默截断；CARD-01 topology/dual-journey tests 必须仍通过。
- **Knowledge**：topology owner 已在 main；历史 enum/schema 仍需 readable，CARD-02 不实现第二 registry。
- **verification_role**：RED
- **paired_task**：T004
- **gate_cmd**：`npx vitest run tests/contract/phase-quality-handoff.test.mjs tests/contract/stage-order-and-host-interaction.test.mjs tests/contract/stage-routing-and-concrete-testing.test.mjs tests/contract/spec-analyze-completeness.test.mjs tests/contract/review-materials-contract.test.mjs tests/contract/activation-cohort.test.mjs tests/contract/task-topology-projection.test.mjs tests/integration/card-01-dual-journey.test.mjs`
- **expected_exit**：1
- **oracle**：`ORACLE-RUNTIME-001 {"pass":"CARD-01 post/pre topology 保持绿色；CARD-02 single writer、merged packet、finding处置、changed-cause retry、三指标原始计数、四项self-check、超限保真与历史读取同时成立","reject":{"input":"双写 consumer、旧 review/analyze packet、缺 disposition/owner/deadline/自检/原始分母或超限 review fixture","expected_rejection":"CARD-02 目标断言非零失败且 CARD-01 topology/dual journey 不失败","observation":"raw output 定位双写、旧 packet、审查合同缺口或静默截断断言"}}`
- **semantic_review_status**：incomplete
- **semantic_review_ref**：quality/reviews/results/card02-runtime-phase-review.json（planned-not-produced）
- **semantic_review_reason**：规划态；独立审查将在配对 GREEN 后写回，当前不得宣称完成。
- **evidence_path**：`quality/tests/card02-runtime-red.json`
- **STOP**：RED 因历史 fixture 损坏或 setup 失败。
- **recovery**：修测试加载，不改目标。
- **task risk**：把已提交 topology owner 误当 CARD-02 写面，形成第二 registry。
- **test tier / test method**：fullstack / fullstack-slice-testing — 跨 CLI、runtime、review protocol。
- **runtime profile**：runtime profile=phase；ceiling=300000ms。
- **runtime permissions**：network=deny；db=deny；filesystem=worktree/temp only；subprocess=explicit vitest only；environment=local_ci。
- **scenarios / commands / expected exit / oracle**：CARD-01 topology 绿色前置、history read、single writer、packet/analyze；同命令；nonzero；ORACLE-RUNTIME-001。
- **fixtures_services**：内存 task/worktree fixture；无真实 provider。
- **coverage limits**：不含 coverage/aggregate 行为。
- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）
- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：`tests/contract/phase-quality-handoff.test.mjs`、`tests/contract/stage-order-and-host-interaction.test.mjs`、`tests/contract/stage-routing-and-concrete-testing.test.mjs`、`tests/contract/spec-analyze-completeness.test.mjs`、`tests/contract/review-materials-contract.test.mjs`；先将 P1 post-cohort 基线收紧为纯指针、13-step 与单 review consumer，再加入 T003 runtime consumer、raw metrics/self-check 与完整输入边界目标断言。
- **executed_commands**：`node tools/cli/stage-runtime.mjs verify --action=execute --stage=build-code --project=workflowhub --task=workflowhub-thin-core-card-02-20260919 --input=/tmp/workflowhub-card02.n5YUIJ/t003-red-capture.json`；receipt `exit_code=1`。
- **evidence_refs**：`quality/tests/card02-runtime-red.json#aab2e3cea0b43a4152f660c4324cebacc0e602591aa9dfefa9cb8f16a78c9c14`；output `quality/tests/output/card02-runtime-red.output#25153376a0015f2787e19e0c916295cb3b55e5336a910cc70c94c66e0ab68260`。
- **covered_ac**：`AC-REVIEW-001..003`、`AC-FLOW-001..003` 由 `ORACLE-RUNTIME-001` 的目标 RED 锁定；尚未 GREEN。
- **review_fact**：N/A — paired GREEN pending。
- **completed_at**：`2026-09-21T02:48:34.574Z`
- **执行事实**：八文件 gate 为 `5 failed / 143 passed`；五个失败均为 CARD-02 single writer、merged packet/self-check、changed-cause retry、raw metrics/self-check 与 307200B 完整输入目标。CARD-01 activation/topology/dual journey 三个只读前置 `30/30` 通过；无 setup 或 provider failure。

#### T004 — GREEN：同步 material、review 与 analyzer consumer

- **ID**：T004
- **Phase**：Phase P2 — Runtime consumer、coverage 与 aggregate 删除
- **goal**：让 T003 变绿，single writer 与 merged review/analyze 成为真实 consumer，同时 CARD-01 topology/dual journey 保持绿色。
- **design_state**：ready
- **versioned_refs**：同 T001。
- **source_refs / decision_refs**：同 T003。
- **输入**：T003 RED、P1 manifests、现有 runtime anchors。
- **依赖**：T003
- **并行**：否 — shared registries。
- **FR**：FR-REVIEW-001、FR-REVIEW-002、FR-REVIEW-003、FR-FLOW-001、FR-FLOW-002、FR-FLOW-003
- **AC**：AC-REVIEW-001、AC-REVIEW-002、AC-REVIEW-003、AC-FLOW-001、AC-FLOW-002、AC-FLOW-003
- **动作**：只读复用 CARD-01 cohort 投影；build-plan handler 合并 spec/phase/index；更新 handoff/completion/review/analyze packet；review packet 先判完整输入大小，可送则完整送，超限则发布 truthful unavailable，保留来源清单、transport/provider 事实、finding disposition/owner/deadline、changed-cause retry、三指标的原始分母/分子与 elapsed、四项 self-check 结论+位置，不截断；不得在 stage runtime 复制 stage order。
- **精确文件**：`runtime/stage/stage-handoff.mjs`、`runtime/stage/completion-predicates.mjs`、`runtime/stage/stage-content-contracts.mjs`、`runtime/stage/stage-handlers.mjs`、`runtime/stage/stage-runner.mjs`、`runtime/stage/stage-skill-runtime.mjs`、`runtime/review/stage-materials.json`、`runtime/task/task-kernel-implementation.mjs`、`runtime/task/task-store.mjs`、`runtime/task/task-handle.mjs`、`tools/cli/stage-runtime.mjs`、`tests/contract/phase-quality-handoff.test.mjs`、`tests/contract/stage-order-and-host-interaction.test.mjs`、`tests/contract/stage-routing-and-concrete-testing.test.mjs`、`tests/contract/spec-analyze-completeness.test.mjs`、`tests/contract/review-materials-contract.test.mjs`
- **boundary**：仅 material/review/analyze registries 与 packet symbols；`runtime/task/task-topology.mjs`、`tools/cli/task-bootstrap.mjs` 和 CARD-01 topology tests 只读；不改 coverage assert、interaction aggregate symbols、`tools/cli/check-decision-log-chain.mjs` 或 T005/T007 预写测试；不改历史 schema bytes。
- **输出**：T003 gate exit 0，旧 record fixture 可读；超限 review 产生 canonical unavailable 且 material bytes 未截断。
- **Knowledge**：后续 T006/T008 继续改部分共享文件，必须串行。
- **verification_role**：GREEN
- **paired_task**：T003
- **gate_cmd**：`npx vitest run tests/contract/phase-quality-handoff.test.mjs tests/contract/stage-order-and-host-interaction.test.mjs tests/contract/stage-routing-and-concrete-testing.test.mjs tests/contract/spec-analyze-completeness.test.mjs tests/contract/review-materials-contract.test.mjs tests/contract/activation-cohort.test.mjs tests/contract/task-topology-projection.test.mjs tests/integration/card-01-dual-journey.test.mjs`
- **expected_exit**：0
- **oracle**：`ORACLE-RUNTIME-001 {"pass":"CARD-01 post/pre topology 保持绿色；CARD-02 单写 packet、finding处置、changed-cause retry、三指标原始计数、四项self-check、超限保真与旧历史读取同时成立"}`
- **semantic_review_status**：incomplete
- **semantic_review_ref**：quality/reviews/results/card02-runtime-phase-review.json（planned-not-produced）
- **semantic_review_reason**：规划态；独立审查将在本 GREEN 后写回，当前不得宣称完成。
- **evidence_path**：`quality/tests/card02-runtime-green-t004-recheck2.json`
- **STOP**：需要永久 compatibility writer、修改 CARD-01 topology owner 或删除历史 enum。
- **recovery**：回滚 CARD-02 material/review consumer diff，保留 P1 manifest与 CARD-01 topology。
- **task risk**：material、handler 与 review packet 跨多个现有 owner，漏同步会产生单写漂移；slice-advisory: reason="material handler、review packet 与 analyzer consumer 必须同步，拆开会产生单写不一致"; impact="单卡精确文件超过10，审查与回滚成本上升"; owner="T004 material consumer owner"; recheck="T004 GREEN 后核对 single writer、review/analyze 与 CARD-01 topology regression"
- **test tier / test method**：fullstack / fullstack-slice-testing。
- **runtime profile**：runtime profile=phase；ceiling=300000ms。
- **runtime permissions**：network=deny；db=deny；filesystem=worktree/temp only；subprocess=explicit vitest only；environment=local_ci。
- **scenarios / commands / expected exit / oracle**：同 T003；0；ORACLE-RUNTIME-001。
- **fixtures_services**：内存 task/worktree fixture。
- **coverage limits**：不证明真实 provider review。
- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）
- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：以真实 `runStage → stage-end → facts.jsonl → handoff` 链替换静态假绿：build-plan handler 的同一份 authenticated review 现在一次产出 review、disposition、`review_analysis/self_checks`，并在 handoff 前投影到唯一 stage row；row 保留 owner/deadline、anchor、changed-cause retry、raw/valid/anchor 分子分母和 elapsed。307200B 完整 packet、362477B truthful unavailable/manifest readback、固定 runner-owned instructions 均有行为断言。附带修复 review record 路由：timeout/SIGTERM/SIGINT 先 abort 并等待 cleanup；未确认 cleanup 记 `sent_unparsed` 且同材料复用；所有认证后的 route/retry/history/source pre-dispatch 失败写 canonical unavailable attempt；`REVIEW_WAIT_EXCEEDED` 不再重派同材料的仍运行 runtime。
- **executed_commands**：`node tools/cli/stage-runtime.mjs verify --action=execute --stage=build-code --project=workflowhub --task=workflowhub-thin-core-card-02-20260919 --input=/tmp/workflowhub-card02.n5YUIJ/t004-green-capture.json`；`node tools/cli/stage-runtime.mjs verify --action=execute --stage=build-code --project=workflowhub --task=workflowhub-thin-core-card-02-20260919 --input=/tmp/workflowhub-card02.n5YUIJ/review-route-hardening-capture.json`。
- **evidence_refs**：`quality/tests/card02-runtime-red.json#aab2e3cea0b43a4152f660c4324cebacc0e602591aa9dfefa9cb8f16a78c9c14`；`quality/tests/card02-runtime-green-t004-recheck2.json#567128ebbe6fd7c0c2e444667865d2f68c0cf9a3d67c7034dc64ef326ec3a287`；`quality/tests/card02-review-route-hardening.json#469215ec497808ce8089cfbe02c329b816c5700e3e0cf4d56c432e2302bebdfe`。
- **covered_ac**：`AC-REVIEW-001..003`、`AC-FLOW-001..003`；ORACLE-RUNTIME-001 通过：CARD-01 topology/dual journey、single row consumer、merged review/analyze、三指标/四项 self-check、完整/超限 packet 与旧历史读取同时成立。
- **review_fact**：`semantic_review_status=incomplete` 仍为规划态原事实；本次独立代码审查仅为本地质量检查，不能替代 planned-not-produced 的 canonical provider review。
- **completed_at**：`2026-09-21T04:40:32.000Z`
- **执行事实**：T004 formal gate `8 files / 149 tests` exit 0，snapshot_tree=`a2291fd34e36669b77e93d11fca19049d068b917`；路由专项 `4 files / 241 tests` exit 0（207.57s）。

#### T005 — RED：逐条 coverage 与 96 字段兼容

- **ID**：T005
- **Phase**：Phase P2 — Runtime consumer、coverage 与 aggregate 删除
- **goal**：证明 confirmation 路径未发布逐条 coverage 质量事实，且字段 parser 漏识别 list/fullwidth 形态；不要求质量缺口阻止真实用户确认。
- **design_state**：ready
- **versioned_refs**：同 T001。
- **source_refs / decision_refs**：R-005/R-007 → D-008/D-010 → FR-AUTH-001/FR-COVER-001/002
- **输入**：原始需求 fixture、card-01 10 块/card-02 14 块字段 fixture。
- **依赖**：T004
- **并行**：否 — confirmation/runtime shared files。
- **FR**：FR-AUTH-001、FR-COVER-001、FR-COVER-002
- **AC**：AC-AUTH-001、AC-COVER-001、AC-COVER-002
- **动作**：增加五类 checker failure fixture、production call spy、24×4 计数断言，以及含重复 ID/四类事实双权威的 authority RED；命名证据为无重复契约报告和四类事实抽样记录。runtime fixture 断言 confirmation 仍写入，但同一原子事务发布 `coverage=incomplete` 质量事实并列缺失 ID/位置。
- **精确文件**：`tests/stage-decision-contract.test.mjs`、`tests/contract/human-confirmation-v3.test.mjs`、`tests/contract/decision-log-chain-warnings.test.mjs`
- **boundary**：只改 3 个测试。
- **输出**：checker 负例目标断言非零；runtime confirmation fixture 写入成功且暴露 incomplete quality；列出缺 ID/位置或识别数不足。
- **Knowledge**：coverage 必须在 confirmation 原子事务内计算并发布，但质量事实不是 progression gate。
- **verification_role**：RED
- **paired_task**：T006
- **gate_cmd**：`npx vitest run tests/stage-decision-contract.test.mjs tests/contract/human-confirmation-v3.test.mjs tests/contract/decision-log-chain-warnings.test.mjs`
- **expected_exit**：1
- **oracle**：`ORACLE-COVERAGE-001 {"pass":"checker 五类覆盖缺失均被拒绝、runtime confirmation 保留且发布 incomplete quality、96 个字段统一识别","reject":{"input":"缺 source anchor、弱化强度、缺排除理由、数量不平与旧 parser fixture","expected_rejection":"checker 目标断言非零；runtime 路径不得拒绝真实 confirmation","observation":"raw output 定位具体缺失类别/字段，并读回 confirmation 与 coverage quality"}}`
- **semantic_review_status**：incomplete
- **semantic_review_ref**：quality/reviews/results/card02-coverage-phase-review.json（planned-not-produced）
- **semantic_review_reason**：规划态；独立审查将在配对 GREEN 后写回，当前不得宣称完成。
- **evidence_path**：`quality/tests/card02-coverage-red.json`、`quality/tests/card02-authority-red.json`
- **STOP**：非零来自环境、fixture 解析或旧任务缺失。
- **recovery**：修 fixture，不弱化逐条断言。
- **task risk**：把 caller 自报 sourceItems 当原始清点。
- **test tier / test method**：feature / backend-testing。
- **runtime profile**：runtime profile=phase；ceiling=300000ms。
- **runtime permissions**：network=deny；db=deny；filesystem=worktree/temp only；subprocess=explicit vitest only；environment=local_ci。
- **scenarios / commands / expected exit / oracle**：缺 source/disposition/strength/owner-count、完整 GREEN、mixed colon；同命令；nonzero；ORACLE-COVERAGE-001。
- **fixtures_services**：内存 decision/task fixture。
- **coverage limits**：只覆盖已知输入，不证明全局无遗漏。
- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）
- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：仅在卡片限定的三个测试文件新增 T005 RED：五类逐条 coverage failure、known-inventory duplicate authority/四类样本、confirmation 仍写但 coverage=incomplete、list-prefix/fullwidth-colon 24×4 字段。发现 T004 broker cancellation test fixture 被 static guard 误报后，按最窄路径在 `DIRECT_WRITER_AUTHORITIES` 登记该精确路径；不会跳过其它静态规则。
- **executed_commands**：`node tools/cli/stage-runtime.mjs verify --action=execute --stage=build-code --project=workflowhub --task=workflowhub-thin-core-card-02-20260919 --input=/tmp/workflowhub-card02.n5YUIJ/t005-red-capture.json`；captured test exit 1。
- **evidence_refs**：`quality/tests/card02-coverage-red.json#97712dd10ac803174bd4b6b98eb63c9da710453ac7a54b2051383bc3555e17a2`；output `quality/tests/output/card02-coverage-red.output#25f6d8aa0a75409dd7fc11fb5cf75f07d0ed90e2b5677a0ba010dbfa83719c02`。
- **covered_ac**：`AC-AUTH-001`、`AC-COVER-001`、`AC-COVER-002` 由 8 个目标 RED 锁定；尚未 GREEN。
- **review_fact**：N/A — paired GREEN pending
- **completed_at**：`2026-09-21T05:00:00.000Z`
- **执行事实**：三文件 gate captured test exit 1；64/72 PASS，8 个失败全部为 T005 新断言，snapshot_tree=`06d9f96e533ffb8a7baac1abb48790693959f6f1`。

#### T006 — GREEN：确认事务内 coverage 质量接线与统一字段 parser

- **ID**：T006
- **Phase**：Phase P2 — Runtime consumer、coverage 与 aggregate 删除
- **goal**：让 T005 变绿，confirmation 与 coverage quality 同事务保真，24 块 96 字段统一识别。
- **design_state**：ready
- **versioned_refs**：同 T001。
- **source_refs / decision_refs**：R-005/R-007 → D-008/D-010 → FR-AUTH-001/FR-COVER-001/002
- **输入**：T005 RED、认证 decision-log/raw requirement、confirmation writer。
- **依赖**：T005
- **并行**：否 — 原子写边界。
- **FR**：FR-AUTH-001、FR-COVER-001、FR-COVER-002
- **AC**：AC-AUTH-001、AC-COVER-001、AC-COVER-002
- **动作**：扩展现有 coverage audit 同时产 ID 唯一性结果与四类事实抽样记录；实现 raw index parser；在 `publishHumanConfirmation` 同一锁/事务内调用 audit 并发布 passed/incomplete quality fact，coverage incomplete 不抛出、不阻止 confirmation；field regex 支持 list prefix/全角冒号；不新增工具/文件。
- **精确文件**：`runtime/stage/stage-content-contracts.mjs`、`runtime/stage/stage-handlers.mjs`、`runtime/task/task-kernel-implementation.mjs`、`tools/cli/check-decision-log-chain.mjs`、T005 tests。
- **boundary**：不新增 caller gate payload/store；不做文件名特判；coverage 质量不得决定是否允许 confirmation。
- **输出**：同 gate exit 0；缺失 fixture 写一次真实 confirmation + 一份 incomplete quality fact；完整 fixture 写一次 confirmation + passed quality fact。
- **Knowledge**：T008 将删 aggregate 邻接代码，先固定 confirmation protection。
- **verification_role**：GREEN
- **paired_task**：T005
- **gate_cmd**：`npx vitest run tests/stage-decision-contract.test.mjs tests/contract/human-confirmation-v3.test.mjs tests/contract/decision-log-chain-warnings.test.mjs`
- **expected_exit**：0
- **oracle**：`ORACLE-COVERAGE-001 {"pass":"checker 五类负例精确失败；runtime confirmation 在 incomplete/passed 两态都原子写并发布真实 quality；96/96 字段统一识别"}`
- **semantic_review_status**：incomplete
- **semantic_review_ref**：quality/reviews/results/card02-coverage-phase-review.json（planned-not-produced）
- **semantic_review_reason**：规划态；独立审查将在本 GREEN 后写回，当前不得宣称完成。
- **evidence_path**：`quality/tests/card02-coverage-green-recheck2.json`
- **STOP**：coverage 变成 confirmation gate、quality 在事务外丢失、来源来自 caller 自报、或现行材料假阳性。
- **recovery**：回滚接线，确认 confirmation/quality 无半记录；保留 RED evidence。
- **task risk**：解析器对历史格式假阳性/假阴性。
- **test tier / test method**：feature / backend-testing。
- **runtime profile**：runtime profile=phase；ceiling=300000ms。
- **runtime permissions**：network=deny；db=deny；filesystem=worktree/temp only；subprocess=explicit vitest only；environment=local_ci。
- **scenarios / commands / expected exit / oracle**：同 T005；0；ORACLE-COVERAGE-001。
- **fixtures_services**：内存 task store，测试后清理。
- **coverage limits**：不含真实用户确认内容质量。
- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）
- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：扩展既有 `buildDecisionCoverageAudit`，输出五类逐项失败、闭合计数和仅限 known inventory 的 authority report；`publishHumanConfirmation(make-decision)` 在同一 store lock/发布路径写 coverage audit evidence 和 `coverage=passed|incomplete` canonical quality fact，coverage 不完整或认证 inventory 坏时不阻断 confirmation；passed 仅接受 manifest 引用、hash 绑定的 raw requirement inventory、逐项 source bytes/excerpt 及当前 decision-log anchor。quality schema/writer 合法支持 coverage/incomplete/coverage_audit，旧枚举保持可读；parser 支持 list prefix、全角 colon/bracket 并返回 blocks/fields counts。coverage 不写入 build-code/verify-code/close confirmation。
- **executed_commands**：`node tools/cli/stage-runtime.mjs verify --action=execute --stage=build-code --project=workflowhub --task=workflowhub-thin-core-card-02-20260919 --input=/tmp/workflowhub-card02.n5YUIJ/t006-green-capture.json`。
- **evidence_refs**：`quality/tests/card02-coverage-red.json#97712dd10ac803174bd4b6b98eb63c9da710453ac7a54b2051383bc3555e17a2`；`quality/tests/card02-coverage-green-recheck2.json#ee5a9eb6be4eb82b160d580df816a1886b25fc837a766cdc8da1c7acdb3b980c`；output `quality/tests/output/card02-coverage-green-recheck2.output#54167cfe86ef55d4cf9add9e44ff05d4c90de2eb92c6a8097e8c3a1e8d0c03e0`。
- **covered_ac**：`AC-AUTH-001`、`AC-COVER-001`、`AC-COVER-002`；five failure diagnostics、confirmation incomplete/passed 读回、known-inventory authority scope、24×4 parser 均通过。
- **review_fact**：依用户当前指令，P2 不在每个 task 审查；唯一 Phase review 在 T008 GREEN 后执行。
- **completed_at**：`2026-09-21T05:20:00.000Z`
- **执行事实**：三文件 GREEN gate `74/74` exit 0，snapshot_tree=`077506df458401fadf3b1ed9a9b8fada50a3a580`。

#### T007 — RED：aggregate active 链必须为零

- **ID**：T007
- **Phase**：Phase P2 — Runtime consumer、coverage 与 aggregate 删除
- **goal**：证明 public input、writer、consumer、completion/review 仍依赖 aggregate。
- **design_state**：ready
- **versioned_refs**：同 T001。
- **source_refs / decision_refs**：R-008/T-083 → FR-CLEAN-001
- **输入**：active consumer census、旧 aggregate fixture、CARD-01 current acceptance（baseline 23 项中 22 项通过；AC-GATE-001 因归档后旧 plan 路径 ENOENT 失败）。
- **依赖**：T006
- **并行**：否 — 与 coverage 共享 runtime 邻区。
- **FR**：FR-CLEAN-001
- **AC**：AC-CLEAN-001
- **动作**：先单独把 CARD-01 predicate census 读取路径改到已提交 archive并运行当前断言至绿，保存 repaired-harness 证据；再反转 active 断言：无 aggregate 仍完成，旧 input 被拒，新 aggregate 不写，legacy reader 仍读；stale/malformed/unbound 失配改由 direct question/confirmation/material facts 生成现有非阻断 diagnostic，不要求 aggregate receipt。同步 CARD-01 acceptance assertion 名称，不删除其 AC；把 `stage-interaction-contract`、`make-decision-interaction-publication`、`decision-convergence-depth` 作为非 AC targeted regressions 加入 acceptance runner（`zero-machine-gate-advancement` 已由原 AC 映射执行）。
- **精确文件**：`tests/stage-interaction-contract.test.mjs`、`tests/contract/make-decision-interaction-publication.test.mjs`、`tests/contract/decision-convergence-depth.test.mjs`、`tests/contract/zero-machine-gate-advancement.test.mjs`、`tests/acceptance/card-01-current.mjs`
- **boundary**：只改上述 5 个测试/acceptance map；不改 CARD-01 contract、topology、archive bytes 或 production。
- **输出**：baseline ENOENT 原件、repaired-harness green、随后非零目标 RED 三段证据；CARD-01 非 aggregate AC 继续通过，失败只来自 active aggregate 引用或 direct diagnostic replacement 尚未实现。
- **Knowledge**：旧 schema/reader 是允许保留面；CARD-01 已验收的“质量失配可见但不作 work permit”是必须保留的接口语义。
- **verification_role**：RED
- **paired_task**：T008
- **gate_cmd**：`node tests/acceptance/card-01-current.mjs`
- **expected_exit**：1
- **oracle**：`ORACLE-AGGREGATE-001 {"pass":"active aggregate producer、input、consumer 与 completion 引用为零；legacy reader 可读；direct diagnostic 保留 CARD-01 失败保真","reject":{"input":"含 active interaction aggregate 引用或缺 direct diagnostic replacement 的 fixture","expected_rejection":"目标断言非零失败且不是归档路径/setup 失败","observation":"raw output 列出 active symbol 命中或缺失的 direct diagnostic 语义"}}`
- **semantic_review_status**：incomplete
- **semantic_review_ref**：quality/reviews/results/card02-aggregate-phase-review.json（planned-not-produced）
- **semantic_review_reason**：规划态；独立审查将在配对 GREEN 后写回，当前不得宣称完成。
- **evidence_path**：`quality/tests/card02-aggregate-delete-red.json`
- **STOP**：RED 仍来自归档路径/setup、要求删除 legacy schema/reader、要求修改 CARD-01 topology，或不再有真实确认/失败保真保护。
- **recovery**：修测试范围；不恢复 aggregate gate。
- **task risk**：把历史引用误计 active consumer，或把 aggregate 名称删除误当成失败保真语义已迁移。
- **test tier / test method**：fullstack / fullstack-slice-testing。
- **runtime profile**：runtime profile=phase；ceiling=300000ms。
- **runtime permissions**：network=deny；db=deny；filesystem=worktree/temp only；subprocess=explicit vitest only；environment=local_ci。
- **scenarios / commands / expected exit / oracle**：归档路径可读、无 aggregate 完成、旧 input 拒绝、新 aggregate 零、旧记录读、stale/malformed/unbound direct diagnostic；同命令；nonzero；ORACLE-AGGREGATE-001。
- **fixtures_services**：内存 task store + legacy record fixture。
- **coverage limits**：不物理删除历史文件。
- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）
- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：将 CARD-01 predicate census 改读已提交 archive plan；反转四个 T007 定向回归的 active aggregate 断言（public `interaction_aggregate`/`receipts.interaction` 拒绝、kernel writer/helper 退役、current OI closure 不依赖 aggregate、legacy OI bytes 可读），并将 CARD-01 map 同步到新断言；依用户“每 phase 一次审查”指令，将旧 build-plan `review-plan` forward-step 断言更新为现有单次 `merged-review`，不新增 task-level review。
- **executed_commands**：`node tools/cli/stage-runtime.mjs verify --action=execute --stage=build-code --project=workflowhub --task=workflowhub-thin-core-card-02-20260919 --input=/tmp/workflowhub-card02.n5YUIJ/t007-red-recheck-capture.json`。
- **evidence_refs**：保留初次 `quality/tests/card02-aggregate-delete-red.json`（揭示旧 AC-REVIEW-001 测试漂移）；当前 RED 为 `quality/tests/card02-aggregate-delete-red-recheck.json#0757749ac1ed48c49f2f75db85ae84184d6b3f0f8ddf2f9b23322064b105a7b7`，output `quality/tests/output/card02-aggregate-delete-red-recheck.output#c51c8f0db27535e7594f3fc1c06d49a6131948f045daea862d233119bbcdb625`。
- **covered_ac**：`AC-CLEAN-001`；CARD-01 的非 aggregate AC 与 `AC-REVIEW-001` 通过，预期 RED 仅为 AC-FLOW-001/002/003 与 AC-GATE-004 四条 active aggregate 链。
- **review_fact**：依用户当前指令，P2 不在每个 task 审查；唯一 Phase review 在 T008 GREEN 后执行。
- **completed_at**：`2026-09-21T06:09:19Z`
- **执行事实**：official capture exit=`1`（预期），snapshot_tree=`7768d1955b9264d6305f32106ff23049320c252a`，59,675ms；4-file 定向回归为 71 cases：59 passed、12 failed，失败均为 aggregate active 链。

#### T008 — GREEN：删除 aggregate active producer/input/consumer/completion

- **ID**：T008
- **Phase**：Phase P2 — Runtime consumer、coverage 与 aggregate 删除
- **goal**：让 T007 变绿，不以改名重建回执控制面。
- **design_state**：ready
- **versioned_refs**：同 T001。
- **source_refs / decision_refs**：同 T007。
- **输入**：T007 目标 RED、T006 coverage confirmation protection、CARD-01 23 项 acceptance map。
- **依赖**：T007
- **并行**：否 — shared runtime。
- **FR**：FR-CLEAN-001
- **AC**：AC-CLEAN-001
- **动作**：删 public aggregate input、active writer、receipt key、handler/review/completion/questions-only consumer；保留 legacy validators/readers；复用 `stage-runner.mjs#currentConfirmationCandidate`、handler `subjectFact` 和既有 `result.facts.machine_gate_diagnostics → quality/evidence/machine-gate-diagnostics/` publication，把 direct question/confirmation/material binding 的 stale/malformed/unbound 失败作为非阻断 diagnostic 写入；aggregate-specific diagnostic IDs 随 active 输入退役，不聚合、不内容寻址为 interaction receipt、不作为推进许可证。
- **精确文件**：`runtime/stage/stage-content-contracts.mjs`、`runtime/stage/stage-handlers.mjs`、`runtime/stage/stage-runner.mjs`、`runtime/stage/stage-skill-runtime.mjs`、`runtime/stage/completion-predicates.mjs`、`runtime/review/stage-materials.json`、`runtime/task/task-kernel-implementation.mjs`、`tools/cli/stage-runtime.mjs`、`tests/stage-interaction-contract.test.mjs`、`tests/contract/make-decision-interaction-publication.test.mjs`、`tests/contract/decision-convergence-depth.test.mjs`、`tests/contract/zero-machine-gate-advancement.test.mjs`、`tests/acceptance/card-01-current.mjs`
- **boundary**：不改 `runtime/schemas/interaction-completion.v1.json`、CARD-01 contract/topology/archive；不清历史 task bytes；不得用新名字、新 receipt 或新 store 重建 aggregate。
- **输出**：同 gate exit 0，active aggregate reverse scan 为 0，legacy read 通过，CARD-01 23 项 acceptance 全部通过。
- **Knowledge**：确认真实性由材料答复、独立 review、human confirmation、coverage 接线承载；machine diagnostic publication 只保留失配事实，不产生工作许可。
- **verification_role**：GREEN
- **paired_task**：T007
- **gate_cmd**：`node tests/acceptance/card-01-current.mjs`
- **expected_exit**：0
- **oracle**：`ORACLE-AGGREGATE-001 {"pass":"active aggregate 引用为零、legacy readable、CARD-01 direct diagnostic 语义通过且无同义 replacement control plane"}`
- **semantic_review_status**：incomplete
- **semantic_review_ref**：quality/reviews/results/card02-aggregate-phase-review.json（planned-not-produced）
- **semantic_review_reason**：规划态；独立审查将在本 GREEN 后写回，当前不得宣称完成。
- **evidence_path**：`quality/tests/card02-aggregate-delete-green.json`
- **STOP**：需要删除旧 record、修改 CARD-01 topology、出现确认/diagnostic 保护空洞，或 replacement 再次形成聚合 receipt/control plane。
- **recovery**：回滚本 task active 删除，保留 T006；重新缩小 consumer census。
- **task risk**：遗留 active alias、新名字重建相同控制面，或为了清零 symbol 而静默删除 CARD-01 diagnostic AC；slice-advisory: reason="aggregate 删除与 CARD-01 direct diagnostic replacement 必须同步修改 runtime 和既有 acceptance，否则会丢失失败保真"; impact="单卡精确文件超过10，审查与回滚成本上升"; owner="T008 aggregate removal owner"; recheck="T008 GREEN 后核对 active reverse scan、legacy reader 与 CARD-01 23项 acceptance"
- **test tier / test method**：fullstack / fullstack-slice-testing。
- **runtime profile**：runtime profile=phase；ceiling=300000ms。
- **runtime permissions**：network=deny；db=deny；filesystem=worktree/temp only；subprocess=explicit vitest only；environment=local_ci。
- **scenarios / commands / expected exit / oracle**：同 T007，另要求 CARD-01 acceptance 23/23；0；ORACLE-AGGREGATE-001。
- **fixtures_services**：内存 task store；清理测试临时目录。
- **coverage limits**：不验证跨宿主 transcript 证明。
- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）
- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：删除 TaskKernel 的 aggregate publisher/observer 与 `quality/evidence/interactions/**` current writer；public CLI、stage input 和 `receipts.interaction` fail-loud 拒绝 retired input；删除 handler/review/completion 对 aggregate 的 active consumer，使 current OI closure 与 direction review 只消费 decision-log、review 与 confirmation 的 direct facts，保留 legacy aggregate validator/read-only bytes。同步删 `stage-skill-runtime` consumer 登记，并把 make-decision workflow/steps 的 active aggregate 指令改为 direct confirmation；依用户 phase-only review 指令，更新 CARD-01 review forward assertion为现有 `merged-review`，不新增 task-level review。P3 的真实 CLI 用例还暴露 make-decision completion 中两个已删 producer 的残留 consumer（`interaction.evidence`、`machineGateDiagnostics`）；已删除，未恢复 aggregate/control plane。
- **executed_commands**：`node tools/cli/stage-runtime.mjs verify --action=execute --stage=build-code --project=workflowhub --task=workflowhub-thin-core-card-02-20260919 --input=/tmp/workflowhub-card02.n5YUIJ/t008-green-capture.json`；`node tools/cli/stage-runtime.mjs review --action=record --stage=build-code --project=workflowhub --task=workflowhub-thin-core-card-02-20260919 --input=/tmp/workflowhub-card02.n5YUIJ/p2-phase-review.json`；修复后用 `/tmp/workflowhub-card02.n5YUIJ/t008-green-recheck2-capture.json` 重跑四文件定向 gate。
- **evidence_refs**：`quality/tests/card02-aggregate-delete-green.json#821754a969d3bee04438eb95eaf9b3d295fc14a276e747cae1c75813e1ece4ff`；output `quality/tests/output/card02-aggregate-delete-green.output#861ee677156a78741a86889630006e289f151979196bc7d5b1de38aa44400662`；修复后 `quality/tests/card02-aggregate-delete-green-recheck2.json#9a69d7ffc042b1b9de54beeca813f4fedfdfb413171ce8d7020d85c01d18a967`，output `quality/tests/output/card02-aggregate-delete-green-recheck2.output#a20c426317c981c842ed94a85af93c5e60dbd48830d742c95d9e9e91a8bf5497`；P2 单次审查 attempt `quality/reviews/attempts/74b8bb6a-9cdb-5a59-a7b3-0ee09b42d119/attempt.json#63decc015f879196964f1b80ceb1ec33af94460ce3119f076a5858073335c15c`，report `quality/reviews/reports/build-code-simple-74b8bb6a-9cdb-5a59-a7b3-0ee09b42d119.md#c20481b4b7fac88ed19b81f54137caaaf1905a5d24e63676b38230c26ca0dcc3`。
- **covered_ac**：`AC-CLEAN-001`；CARD-01 23/23 passed，public old input rejection、writer removal、direct OI closure、legacy read、无 replacement control plane 及真实 current CLI completion 路径均覆盖。
- **review_fact**：P2 唯一独立 review 已记录一次，`terminal_status=unavailable`、`dispatch_state=blocked_before_dispatch`、`REVIEW_INPUT_TOO_LARGE`（455,671B > 307,200B）；未截断、未 dispatch、无 findings/result，按 phase-only policy 不重试。其后发现并修复的残留 consumer 未被这次 unavailable review 覆盖，作为限制保留，不新开 task review。
- **completed_at**：`2026-09-21T06:35:21Z`
- **执行事实**：初始 official GREEN capture exit=`0`，snapshot_tree=`e87c786f31521a2eb67fe1464c26433bbdbd7d07`，41,110ms；修复后的定向 T008 four-file gate `71/71` passed，receipt snapshot_tree=`588e0289d8b93ca725c85bf842b7a9a511e17d89`，17,075ms。review 的 CLI exit=`0` 仅表示 canonical unavailable attempt 已写入，不代表 provider semantic review 成功。

### Verify

- **Target**：FR-REVIEW/FLOW/COVER/CLEAN。
- **gate_cmd**：T003/T005/T007 三组 targeted commands。
- **expected_exit**：GREEN 均 0。
- **evidence_path**：`quality/tests/card02-runtime-green.json`、`card02-coverage-green.json`、`card02-aggregate-delete-green.json`。
- **Oracle**：ORACLE-RUNTIME-001 / COVERAGE-001 / AGGREGATE-001。

### Knowledge

P3 只消费 current implementation，不在 FINAL 中顺手修 P2。

### STOP

历史/pre 不可读、post 仍投影 build-spec、当前 card-02 被重解释、确认半写、active aggregate 仍存在、或 public surface 增加。

### Done

三组 GREEN、consumer census、failure facts 与 rollback 边界齐全。

### Risks and rollback

- **Risk**：共享文件覆盖与删除过界。
- **Prevention**：严格串行、每对局部 gate、legacy DO NOT TOUCH。
- **Rollback / recovery**：按 pair 回滚，保留前序已绿保护。

## Phase P3 — 真实切片 smoke 与当前快照聚合

### Goal

证明双 phase 模板/索引/冻结测试交接可执行，并一次汇总当前范围；不冒充真实 CARD-10 验收。

### Files

- **NEW**：N/A。
- **MODIFY**：`tests/integration/vnext-official-stage-run.test.mjs`、`tests/contract/filled-plan-task-production.test.mjs`、`tests/contract/ui-stage-integration.test.mjs`。
- **DO NOT TOUCH**：P1/P2 已验证实现；真实 CARD-10 task。

### Tasks

#### T009 — RED：双 phase fixture 的目标断言真实失败

- **ID**：T009
- **Phase**：Phase P3 — 真实切片 smoke 与当前快照聚合
- **goal**：用缺全局指针/紧凑索引/冻结测试保护的双 phase fixture 产生目标断言 RED。
- **design_state**：ready
- **versioned_refs**：同 T001。
- **source_refs / decision_refs**：R-003/R-009 → D-003/D-006/D-014 → FR-TEST-003/004、FR-HANDOFF-001
- **输入**：P1/P2 GREEN 实现与有意缺字段的双 phase fixture。
- **依赖**：T008
- **并行**：否 — first fixture RED。
- **FR**：FR-TEST-003、FR-TEST-004、FR-HANDOFF-001
- **AC**：AC-TEST-003、AC-TEST-004、AC-HANDOFF-001
- **动作**：在现有 tests 内加入 ≥2 phase 负例，断言失败必须来自缺目标字段、测试保护或真实入口交接，不得来自 setup。
- **精确文件**：`tests/integration/vnext-official-stage-run.test.mjs`、`tests/contract/filled-plan-task-production.test.mjs`、`tests/contract/ui-stage-integration.test.mjs`
- **boundary**：只改三个测试；不改 production。
- **输出**：非零 RED，定位目标断言。
- **Knowledge**：UI non_ui；真实 luna task 仍 deferred。
- **verification_role**：RED
- **paired_task**：T010
- **gate_cmd**：`npx --no-install vitest run tests/integration/vnext-official-stage-run.test.mjs tests/contract/filled-plan-task-production.test.mjs -t 'T009 RED / T010 GREEN' --poolOptions.forks.singleFork --no-fileParallelism --reporter=verbose; vitest_status=$?; node --test --test-name-pattern='T009 RED / T010 GREEN' tests/contract/ui-stage-integration.test.mjs; ui_status=$?; [ "$vitest_status" -eq 0 ] && [ "$ui_status" -eq 0 ]`
- **expected_exit**：1
- **oracle**：`ORACLE-FIXTURE-001 {"pass":"双 phase fixture 的目标合同成立且延期状态保真","reject":{"input":"缺全局指针、紧凑索引或冻结测试保护的双 phase fixture","expected_rejection":"目标断言非零失败且不是 setup","observation":"raw output 定位缺失目标字段、测试保护或入口交接"}}`
- **semantic_review_status**：incomplete
- **semantic_review_ref**：quality/reviews/results/card02-fixture-phase-review.json（planned-not-produced）
- **semantic_review_reason**：规划态；独立审查将在配对 GREEN 后写回，当前不得宣称完成。
- **evidence_path**：`quality/tests/card02-fixture-red.json`
- **STOP**：失败来自 setup、单 phase 或需要改 production。
- **recovery**：修 fixture/test harness，不弱化目标。
- **task risk**：伪 RED 或用 fixture 关闭真实 E2E。
- **test tier / test method**：fullstack / fullstack-slice-testing — 内存全链 fixture。
- **runtime profile**：runtime profile=phase；ceiling=300000ms。
- **runtime permissions**：network=deny；db=deny；filesystem=worktree/temp only；subprocess=explicit vitest only；environment=local_ci。
- **scenarios / commands / expected exit / oracle**：缺字段/测试被改/入口缺失；同命令；1；ORACLE-FIXTURE-001。
- **fixtures_services**：内存 task/worktree；无 provider，自动清理。
- **coverage limits**：不覆盖真实 provider、真实 luna、真实用户确认、跨仓。
- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）
- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：为 P1/P2 两条真实 build-code entry 增加同一双 phase fixture 的 target contract：缺失 `global_plan_ref`、紧凑两项 index 或各 phase 冻结测试 ref/hash 时必须给出精确错误；同时将监控副作用 CLI fixture 迁到认证 worktree、唯一普通任务身份段和 current direct session，显式拒绝 retired `stage_outcome_*` 预期。
- **executed_commands**：`node tools/cli/stage-runtime.mjs verify --action=execute --stage=build-code --project=workflowhub --task=workflowhub-thin-core-card-02-20260919 --input=/tmp/workflowhub-card02.n5YUIJ/t009-red-capture.json`。
- **evidence_refs**：`quality/tests/card02-fixture-red.json#2a06f5d28d707307f37ae078daeaba6eb8a23612bcbb5118579dbb2d4877513b`；output `quality/tests/output/card02-fixture-red.output#d266a024497205d82a4da0c7163df21a1064c560d800e1e60eac252bcdc00f9b`。
- **covered_ac**：`AC-TEST-003`、`AC-HANDOFF-001`；目标 RED 仅列出 `global_plan_ref`、紧凑 index、P1/P2 `frozen_test` ref/hash 四项，UI deferred test 同时通过，未出现 setup 或 production failure。
- **review_fact**：P3 唯一 review 在 T010 GREEN 后执行，`terminal_status=unavailable`、`dispatch_state=blocked_before_dispatch`、`REVIEW_INPUT_TOO_LARGE`（486,777B > 307,200B）；完整 packet 未截断、provider 未 dispatch、无 findings/result，按 phase-only policy 不重试。
- **completed_at**：`2026-09-21T08:02:41Z`
- **执行事实**：capture writer 成功写入 receipt；其中 child command exit=`1`、duration=`13,499ms`。Vitest 仅 1 条 target fixture 失败，Node UI deferred target 1/1 passed。

#### T010 — GREEN：双 phase smoke 与延期边界

- **ID**：T010
- **Phase**：Phase P3 — 真实切片 smoke 与当前快照聚合
- **goal**：让 T009 同一命令变绿，验证模板/索引/冻结测试/DO NOT TOUCH/non_ui/handoff；真实 luna E2E 保持 deferred。
- **design_state**：ready
- **versioned_refs**：同 T001。
- **source_refs / decision_refs**：R-003/R-009 → D-003/D-006/D-014 → FR-TEST-003/004、FR-HANDOFF-001
- **输入**：T009 RED 与 P1/P2 current implementation。
- **依赖**：T009
- **并行**：否 — RED/GREEN 串行。
- **FR**：FR-TEST-003、FR-TEST-004、FR-HANDOFF-001
- **AC**：AC-TEST-003、AC-TEST-004、AC-HANDOFF-001
- **动作**：补齐 fixture 正例与状态断言；AC-TEST-004 只验证 deferred 四要素和 STOP，不伪造真实 luna 证据。
- **精确文件**：`tests/integration/vnext-official-stage-run.test.mjs`、`tests/contract/filled-plan-task-production.test.mjs`、`tests/contract/ui-stage-integration.test.mjs`
- **boundary**：只改三个测试；不改 P1/P2 production。
- **输出**：同命令 exit 0；fixture smoke achieved；真实 E2E deferred。
- **Knowledge**：真实 E2E 由 CARD-10 关闭。
- **verification_role**：GREEN
- **paired_task**：T009
- **gate_cmd**：`npx --no-install vitest run tests/integration/vnext-official-stage-run.test.mjs tests/contract/filled-plan-task-production.test.mjs -t 'T009 RED / T010 GREEN' --poolOptions.forks.singleFork --no-fileParallelism --reporter=verbose; vitest_status=$?; node --test --test-name-pattern='T009 RED / T010 GREEN' tests/contract/ui-stage-integration.test.mjs; ui_status=$?; [ "$vitest_status" -eq 0 ] && [ "$ui_status" -eq 0 ]`
- **expected_exit**：0
- **oracle**：`ORACLE-FIXTURE-001 {"pass":"双 phase 正例可回读、负例仍失败、deferred 不转 pass"}`
- **semantic_review_status**：incomplete
- **semantic_review_ref**：quality/reviews/results/card02-fixture-phase-review.json（planned-not-produced）
- **semantic_review_reason**：规划态；独立审查将在本 GREEN 后写回，当前不得宣称完成。
- **evidence_path**：`quality/tests/card02-fixture-smoke.json`
- **STOP**：需要修改 production 或把 deferred 写 pass。
- **recovery**：回 owning task；保留 RED evidence。
- **task risk**：fixture 通过被误报真实可执行性。
- **test tier / test method**：fullstack / fullstack-slice-testing。
- **runtime profile**：runtime profile=phase；ceiling=300000ms。
- **runtime permissions**：network=deny；db=deny；filesystem=worktree/temp only；subprocess=explicit vitest only；environment=local_ci。
- **scenarios / commands / expected exit / oracle**：默认/错误/boundary/non_ui/deferred；同命令；0；ORACLE-FIXTURE-001。
- **fixtures_services**：内存 task/worktree；无 provider，自动清理。
- **coverage limits**：不覆盖真实 provider、真实 luna、真实用户确认、跨仓。
- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）
- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：完成同一双 phase handoff（全局 plan pointer、紧凑 P1/P2 index、每 phase 内容地址化 frozen-test ref/hash）；P1 保持 `non_ui/not_applicable`，P2 real Luna E2E 保持 `deferred` 且含 owner、trigger、reason_or_limit、stop_condition，未改写为 passed。
- **executed_commands**：`node tools/cli/stage-runtime.mjs verify --action=execute --stage=build-code --project=workflowhub --task=workflowhub-thin-core-card-02-20260919 --input=/tmp/workflowhub-card02.n5YUIJ/t010-green-capture.json`。
- **evidence_refs**：`quality/tests/card02-fixture-smoke.json#c7c87372375a474ff09bbf9842e3c5f0e1d363b9112002eddbfd40b90705c984`；output `quality/tests/output/card02-fixture-smoke.output#6a337b83a9e2f236e0a44de458e1f85f88febbdf60912c97e290e928937f76cc`。
- **covered_ac**：`AC-TEST-003`、`AC-TEST-004`、`AC-HANDOFF-001`；Vitest two target fixtures and Node UI target all passed, real Luna remains deferred.
- **review_fact**：P3 唯一 phase review 已执行，attempt `quality/reviews/attempts/b12c1c1c-6130-5b80-a9a3-f5be22aee3ff/attempt.json#242b4d748d773e68dc1e9d934a1e115b31f1e6dae7de03d170b0a9d520f6ac9a`，report `quality/reviews/reports/build-code-simple-b12c1c1c-6130-5b80-a9a3-f5be22aee3ff.md#23df0e0c5fb3538cf2436323930a723b4ee3b3661ed5f015dc0115f79304de2b`；`terminal_status=unavailable`、未 dispatch、无 findings/result，因完整 packet 486,777B 超过 307,200B，未截断且不重试。
- **completed_at**：`2026-09-21T08:03:35Z`
- **执行事实**：child command exit=`0`、duration=`11,510ms`，Vitest 2/2 target fixtures passed，Node UI 1/1 passed；未运行该文件其余 106 条无关历史 fixture。

#### T011 — FINAL：只读当前快照 bounded aggregate

- **ID**：T011
- **Phase**：Phase P3 — 真实切片 smoke 与当前快照聚合
- **goal**：只读运行受影响 targeted tests，对 22 条 AC 分别记录 achieved/deferred/unavailable/incomplete，不把延期或未知漂白。
- **design_state**：ready
- **versioned_refs**：同 T001。
- **source_refs / decision_refs**：R-001..R-009 → D-001..D-014/T-083 → 全部 FR/AC
- **输入**：T002/T004/T006/T008/T010 真实结果。
- **依赖**：T010
- **并行**：否 — aggregate 读取全部前序事实。
- **FR**：FR-DOC-001、FR-DOC-002、FR-DOC-003、FR-DOC-004、FR-DOC-005、FR-OI-001、FR-TEST-001、FR-TEST-002、FR-TEST-003、FR-TEST-004、FR-REVIEW-001、FR-REVIEW-002、FR-REVIEW-003、FR-AUTH-001、FR-AUTH-002、FR-FLOW-001、FR-FLOW-002、FR-FLOW-003、FR-COVER-001、FR-COVER-002、FR-CLEAN-001、FR-HANDOFF-001
- **AC**：AC-DOC-001、AC-DOC-002、AC-DOC-003、AC-DOC-004、AC-DOC-005、AC-OI-001、AC-TEST-001、AC-TEST-002、AC-TEST-003、AC-TEST-004、AC-REVIEW-001、AC-REVIEW-002、AC-REVIEW-003、AC-AUTH-001、AC-AUTH-002、AC-FLOW-001、AC-FLOW-002、AC-FLOW-003、AC-COVER-001、AC-COVER-002、AC-CLEAN-001、AC-HANDOFF-001
- **动作**：只执行一次 targeted union；由 `tests/acceptance/card-02-current.mjs` 运行原四段 bounded command，并输出严格逐 AC producer：22 个 `entries[]` 各含 `acceptance_criterion_id,outcome=achieved|deferred|unavailable|incomplete,assertions[]`，非 achieved 必含 owner/reason。build-code 分别记录命令执行与 AC 业务结果；命令 exit 0 不会把 deferred/unavailable 写成 achieved/covered。AC-TEST-004 真实 E2E、AC-REVIEW-003 CARD-05 对比实验按当前事实保持 deferred。
- **精确文件**：`tests/acceptance/card-02-current.mjs`、`tests/contract/acceptance-execution-tier.test.mjs`（仅 structured mixed-outcome producer 的命名用例）、`tests/integration/vnext-official-stage-run.test.mjs`、`tests/contract/filled-plan-task-production.test.mjs`、`tests/contract/ui-stage-integration.test.mjs`、`tests/contract/review-materials-contract.test.mjs`、`tests/contract/review-public-entrypoints.test.mjs`、`tests/contract/review-input-bounds-portability.test.mjs`、`tests/contract/stage-runtime-preflight.test.mjs`、`skills/wh-review/scripts/__tests__/wh-review-cli-bounds.test.mjs`、`skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs`。
- **boundary**：producer 只编排原有四段 read-only command，不修改其冻结断言、评分逻辑或 production；D-015 是用户直接要求的现有 `FR-REVIEW-001` transport correction，故纳入 union；integration 文件只运行 T009/T010、direct CLI 无副作用和历史 unavailable consumer 三个命名用例，不重跑其余 100 条无关 fixture。任何新失败必须回 owning correction。
- **输出**：三段 bounded command 原始结果 + `card02-acceptance-matrix.v1` 逐 AC 状态矩阵；unknown 输入必须落为 unavailable/incomplete，不得省略或改成 achieved。
- **Knowledge**：真实 E2E/review 实验仍由 CARD-10/05。
- **verification_role**：N/A — non-behavior change: read-only final aggregate
- **paired_task**：N/A — final aggregate has no RED/GREEN pair
- **gate_cmd**：`node tests/acceptance/card-01-current.mjs && npx --no-install vitest run tests/decision-log-content-contract.test.mjs tests/stage-review-cost-policy.test.mjs tests/stage-decision-contract.test.mjs tests/stage-interaction-contract.test.mjs tests/contract/spec-stage-artifact-closure.test.mjs tests/contract/material-producer-consumer-roundtrip.test.mjs tests/contract/phase-quality-handoff.test.mjs tests/contract/filled-plan-task-production.test.mjs tests/contract/stage-order-and-host-interaction.test.mjs tests/contract/stage-routing-and-concrete-testing.test.mjs tests/contract/spec-analyze-completeness.test.mjs tests/contract/review-materials-contract.test.mjs tests/contract/review-public-entrypoints.test.mjs tests/contract/review-input-bounds-portability.test.mjs tests/contract/stage-runtime-preflight.test.mjs tests/contract/human-confirmation-v3.test.mjs tests/contract/decision-log-chain-warnings.test.mjs tests/contract/make-decision-interaction-publication.test.mjs tests/contract/decision-convergence-depth.test.mjs skills/wh-review/scripts/__tests__/wh-review-cli-bounds.test.mjs skills/wh-review/scripts/__tests__/simple-review-runner.test.mjs --poolOptions.forks.singleFork --no-fileParallelism --reporter=verbose && npx --no-install vitest run tests/integration/vnext-official-stage-run.test.mjs -t 'T009 RED / T010 GREEN|guards the official stage run against monitoring fact and projection side effects|keeps a pre-dispatch oversized review attempt unavailable without blocking the repository-owned build-spec run' --poolOptions.forks.singleFork --no-fileParallelism --reporter=verbose && node --test tests/contract/ui-stage-integration.test.mjs`
- **expected_exit**：0
- **oracle**：`ORACLE-CARD02-FINAL {"pass":"三段 targeted command exit 0；22/22 AC 各有 achieved/deferred/unavailable/incomplete 真实状态、证据或延期四要素；deferred/unknown 不转 pass；current/pre/post/history seam 一致"}`
- **evidence_path**：`quality/tests/card02-final-recheck.json`（首轮 `card02-final.json` 为保留的 P1 wording failure 原件）+ `quality/tests/card02-acceptance-matrix.json`。
- **STOP**：命令不可执行、矩阵不是 22/22、AC 缺 status/owner/reason、证据不能映射 owning task，或需要修改任何测试/生产文件。
- **recovery**：回 owning task，只重跑受影响命令；所有修复完成后再只读跑 aggregate。
- **task risk**：aggregate 太宽、超时或误把 deferred 计 pass。
- **test tier / test method**：fullstack / fullstack-slice-testing — targeted current-snapshot aggregate。
- **runtime profile**：runtime profile=aggregate；ceiling=900000ms。
- **runtime permissions**：network=deny；db=deny；filesystem=worktree read-only/temp evidence only；subprocess=explicit vitest only；environment=local_ci。
- **scenarios / commands / expected exit / oracle**：全部 AC 状态、失败保真、history/pre/post、跨 task seams；同命令；0；ORACLE-CARD02-FINAL。
- **fixtures_services**：仓内/内存 fixture；无真实 provider；清理临时 task。
- **coverage limits**：不覆盖真实 luna E2E、CARD-05 provider 对比、发布/close；这些为 deferred，不是通过。
- **current contract test**：`npx --no-install vitest run tests/contract/acceptance-execution-tier.test.mjs -t 'keeps explicit deferred and unavailable AC outcomes out of coverage while an independent review receives the executed command evidence' --poolOptions.forks.singleFork --no-fileParallelism --reporter=verbose`；它验证 mixed outcome 的 current packet 可以被独立 review 消费，同时不变成 acceptance coverage。
- **acceptance_role**：acceptance
- **ui_scope**：non_ui
- **acceptance_data**：`[{"source":"T011 current structured acceptance producer","sample":"the original CARD-01/CARD-02/P3/UI bounded command set and the explicit 22-AC status map","scenario":"current command execution plus per-AC achieved/deferred/unavailable readback","tier":"command","execution":{"command":"node","args":["tests/acceptance/card-02-current.mjs"],"timeout_ms":900000}}]`
- **e2e_scope**：not_required

##### 执行状态填写区（唯一完成权威）
- [x] **任务完成**
- **status**：`completed_with_limits`
- **actual_changes**：只读聚合 CARD-01 current acceptance、CARD-02 targeted union、三条命名 integration fixture 和原生 UI fixture；D-015 transport correction 纳入 current union。生成独立 matrix 路径，避免与保留的失败 test receipt 双写。
- **executed_commands**：`node tools/cli/stage-runtime.mjs verify --action=execute --stage=build-code --project=workflowhub --task=workflowhub-thin-core-card-02-20260919 --input=/tmp/workflowhub-card02.n5YUIJ/t011-final-capture.json`（child exit=1，保留 P1 wording failure）；修复 owner T002 后，用 `/tmp/workflowhub-card02.n5YUIJ/t011-final-recheck-capture.json` 重跑（child exit=0）。
- **evidence_refs**：failed `quality/tests/card02-final.json#c1d606a500d2bf69104a9de35890b7a7e2241a293b9f73ef5febbfb2dc6e5e96`，output `quality/tests/output/card02-final.output#3d5c27fdb67a463a36fcc49ada37405efddd7edde3f6affd04ef5ea268c444e2`；current GREEN `quality/tests/card02-final-recheck.json#768be99ee9e55f3701e8bfd48adddfc3dbb74354590cd5e9d9b3d7149380a8c4`，output `quality/tests/output/card02-final-recheck.output#47501d7388943e29949653993c87c7010739be944cac8c80f3221f5be47f91ed`；matrix `quality/tests/card02-acceptance-matrix.json#bce0b0b40ac48001e2acf39df00e4a8e70caff69e8ce77c0238a6894ed6293df`。
- **covered_ac**：22/22 已列入 matrix：18 achieved、2 deferred（AC-TEST-004、AC-REVIEW-003）、2 unavailable（AC-REVIEW-001、AC-REVIEW-002）；无遗漏或批量漂白。
- **review_fact**：P1/P2/P3 各只执行一次 phase review；P1 `REVIEW_WAIT_EXCEEDED`，P2/P3 `REVIEW_INPUT_TOO_LARGE` historical unavailable。D-015 已删除本地 cap 并以 full-attachment tests 验证，但按 phase-only policy 不补派历史 review；无 provider semantic result 不改写为 pass。
- **completed_at**：`2026-09-21T09:43:08.855Z`
- **执行事实**：current recheck snapshot_tree=`1a409534a0922828d66edf4824dc8e4832ae6161`，duration=`216,384ms`，exit=`0`；matrix material_revision=`revision-8289f21ea4edf39b99c3bda28f089239e629e4d21c5f7bb7b5c29f64bf1b85be`。

### Verify

- **Target**：全部当前 FR/AC 和跨 task seam。
- **gate_cmd**：T009/T010 fixture command；T011 bounded union。
- **expected_exit**：0。
- **evidence_path**：`quality/tests/card02-fixture-smoke.json`、`quality/tests/card02-final-recheck.json`、`quality/tests/card02-acceptance-matrix.json`。
- **Oracle**：ORACLE-FIXTURE-001 / ORACLE-CARD02-FINAL。

### Knowledge

build-code 只消费当前材料；真实 CARD-10/CARD-05 延期不得自行关闭。

### STOP

FINAL 发现 production 缺口返回 owning task；不在最终卡顺手改实现。

### Done

bounded aggregate、22 AC 的 achieved/deferred/unavailable 状态、质量事实与大白话 handoff 齐全。

### Risks and rollback

- **Risk**：fixture 假绿或 aggregate 过宽。
- **Prevention**：coverage limits + owning task 返回规则。
- **Rollback / recovery**：只回滚测试 fixture；实现修复回原任务。

### D-015 直接用户纠正 — 审查 attachment 无本地字节上限

- **归属**：现有 `FR-REVIEW-001` / `AC-REVIEW-001` 的 transport implementation correction；不新建 stage、public command、store、review route 或 task-level review。
- **实现**：删除 307,200B delivery cap、verify-code 300/150/160/96KiB bounds、local packet preflight `limit_bytes` 比较，以及由这些本地大小判断生成的 `REVIEW_INPUT_TOO_LARGE → blocked_before_dispatch`。完整 reviewable diff/material 以附件文件和 manifest SHA 传输；分片只能分段，不能截断。
- **保留**：历史 unavailable attempts、身份/路径/hash 校验、取消/超时、以及外部 provider 原始 input/token-limit 错误分类；外部错误不得伪装成本地未派发。
- **targeted verification**：`review-materials-contract`、`review-public-entrypoints`、`review-input-bounds-portability`、`stage-runtime-preflight`、wh-review bounds/simple-runner 和 legacy unavailable consumer readback。
- **status**：`completed` — canonical combined capture exit=0。
- **executed_command**：`node tools/cli/stage-runtime.mjs verify --action=execute --stage=build-code --project=workflowhub --task=workflowhub-thin-core-card-02-20260919 --input=/tmp/workflowhub-card02.n5YUIJ/review-unbounded-green-capture.json`。
- **evidence_ref**：`quality/tests/card02-review-unbounded-green.json#ef31f4bba64b2a7cf3f116d1b931208688d221f7bab4bb152757290fe48b9a1e`；output `quality/tests/output/card02-review-unbounded-green.output#99e715ee9db47bd45e6dbcb20f7033760ae68326d163cfc1a67222ecfdc7e17b`；snapshot_tree=`ad155cd6f53b097128888f6fc9910342598df2e1`；duration=`92,801ms`。

## 4. Final current-snapshot aggregate strategy

- **tier / method**：fullstack / fullstack-slice-testing（bounded）。
- **scenarios**：四模板、13 步、single writer、active/historical、review/analyze、coverage、96 字段、aggregate 删除、双 phase fixture、non_ui、失败保真。
- **command**：T011 `gate_cmd`。
- **expected exit**：0。
- **oracle**：ORACLE-CARD02-FINAL。
- **fixtures_services**：仓内与内存 task fixtures；无 provider；命令结束清理临时目录。
- **evidence_path**：`quality/tests/card02-final-recheck.json` + `quality/tests/card02-acceptance-matrix.json`
- **coverage limits**：不覆盖真实 luna E2E、CARD-05 provider 对比、release/close。
- **STOP**：命令损坏、AC 缺失、边界越界或需要新方向。
- **execution_contract**：当前快照最后运行一次；局部失败先回 owning task，仅重跑受影响命令，修复完成后再跑一次 aggregate；超时记 incomplete，不自动全量重跑。

## Dependency Graph

- **order**：T001 → T002 → T003 → T004 → T005 → T006 → T007 → T008 → T009 → T010 → T011

```text
T001 RED → T002 GREEN
                 ↓
T003 RED → T004 GREEN → T005 RED → T006 GREEN → T007 RED → T008 GREEN
                                                                      ↓
                                                              T009 RED → T010 GREEN → T011 FINAL
```

## Final Boundary Check

- [x] 每个 Phase 有 Goal、Files、Tasks、Verify、Knowledge、STOP、Done、Risks and rollback。
- [x] 每个任务只有一张卡和一个完成区；文件属于所属 Phase。
- [x] 每个行为变化有同命令、同 oracle 的 RED/GREEN；FINAL 只聚合一次。
- [x] 依赖无环；全部 FR/AC 有 task；unknown/deferred 未写成通过。
- [x] review/test/evidence 只作事实，不是工作许可证。

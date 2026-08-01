# 任务清单：Stage 内容契约

**输入**：`specs/stage-content-contracts/spec.md`、本轮 `draft-plan.md`  
**执行根**：WorkflowHub CandidateWorkspace  
**证据目录**：`apply/evidence/`  
**测试规则**：每个行为改动先执行对应 RED，再执行同文件 GREEN；只跑列出的窄命令。

## 全局执行规则

1. 每个命令从 CandidateWorkspace 根目录执行。
2. `gate_cmd` 的 stdout/stderr 原样写入对应 `evidence_path`；不得用 `grep` 或 `tail` 的退出码冒充测试结果。
3. `expected_exit: 1` 表示实现前的真实 RED；`expected_exit: 0` 表示实现后的 GREEN。
4. 修改 task 的 `文件` 只能是精确路径；新增未列文件、新依赖或架构决定时触发 STOP 并返回 plan。
5. `[P]` 仅表示不同文件且无未完成依赖时可并行。
6. 不默认运行全量测试；最终广覆盖是否必要由 T076 根据实际风险单独说明。

## Phase 1：原样恢复 31 个 bootstrap runtime 路径

### Goal
把已完成的 review authority 逐字节恢复到 Candidate，并证明没有重建或污染。

### Files

- Modify：`runtime-files.txt` 中列出的 31 个精确路径。
- Forbidden：`CONTEXT.md`、`docs/adr/0009-stage-content-authority.md`、`specs/stage-content-contracts/spec.md`。

### Tasks

#### T001 — 恢复前 manifest RED

- **ID**：T001
- **动作**：对 Candidate 执行 31 路径 SHA-256 校验，记录恢复前至少一个缺失项。
- **精确文件**：`"${WORKFLOWHUB_BOOTSTRAP_BUNDLE_DIR:?}"/runtime.sha256`
- **输入**：认证 `runtime.sha256`。
- **输出**：`apply/evidence/T001-bootstrap-red.stdout`、`apply/evidence/T001-bootstrap-red.stderr`。
- **依赖**：无。
- **并行**：否；Phase 1 首项。
- **FR**：FR-REV-001、FR-REV-002、FR-REV-003、FR-REV-004、FR-REV-005、FR-REV-006、FR-REV-007、FR-REV-008、FR-REV-009。
- **AC**：AC29、AC31、AC46、AC47、AC48、AC49、AC50、AC51、AC52、AC53。
- **gate_cmd**：`mkdir -p apply/evidence && shasum -a 256 -c "${WORKFLOWHUB_BOOTSTRAP_BUNDLE_DIR:?}"/runtime.sha256 > apply/evidence/T001-bootstrap-red.stdout 2> apply/evidence/T001-bootstrap-red.stderr`
- **expected_exit**：1
- **oracle**：恢复前至少一个清单路径缺失；命令不得写 Candidate。
- **evidence_path**：`apply/evidence/T001-bootstrap-red.stdout`、`apply/evidence/T001-bootstrap-red.stderr`

#### T002 — 安全回放 tar

- **ID**：T002
- **动作**：先证明 tar 路径集合与 `runtime-files.txt` 完全相等且无路径逃逸/符号链接，再定向解包。
- **精确文件**：`"${WORKFLOWHUB_BOOTSTRAP_BUNDLE_DIR:?}"/bootstrap-runtime-files.tar`、`"${WORKFLOWHUB_BOOTSTRAP_BUNDLE_DIR:?}"/runtime-files.txt`。
- **输入**：T001 RED、认证 tar、路径清单。
- **输出**：Candidate 中 31 个逐字节恢复文件。
- **依赖**：T001。
- **并行**：否。
- **FR**：FR-REV-009。
- **AC**：AC29、AC31、AC53。
- **gate_cmd**：`mkdir -p apply/evidence && tar -tf "${WORKFLOWHUB_BOOTSTRAP_BUNDLE_DIR:?}"/bootstrap-runtime-files.tar | LC_ALL=C sort > apply/evidence/T002-tar-paths.stdout && LC_ALL=C sort "${WORKFLOWHUB_BOOTSTRAP_BUNDLE_DIR:?}"/runtime-files.txt > apply/evidence/T002-manifest-paths.stdout && diff -u apply/evidence/T002-manifest-paths.stdout apply/evidence/T002-tar-paths.stdout && awk 'substr($0,1,1)=="/" || index("/" $0 "/","/../") { bad=1 } END { exit bad }' apply/evidence/T002-tar-paths.stdout && tar -tvf "${WORKFLOWHUB_BOOTSTRAP_BUNDLE_DIR:?}"/bootstrap-runtime-files.tar > apply/evidence/T002-tar-types.stdout && awk '$1 ~ /^l/ { bad=1 } END { exit bad }' apply/evidence/T002-tar-types.stdout && tar -xf "${WORKFLOWHUB_BOOTSTRAP_BUNDLE_DIR:?}"/bootstrap-runtime-files.tar`
- **expected_exit**：0
- **oracle**：两个排序路径集合完全相等，tar 无绝对路径、`..` 或符号链接，解包只写 31 个路径。
- **evidence_path**：`apply/evidence/T002-tar-paths.stdout`、`apply/evidence/T002-manifest-paths.stdout`、`apply/evidence/T002-tar-types.stdout`

#### T003 — 31/31 hash GREEN 与 authority 窄回归

- **ID**：T003
- **动作**：逐文件验证 SHA-256，并运行 review flow、canonical review、五阶段接线的窄测试。
- **精确文件**：`core/__tests__/canonical-review-result.test.mjs`、`core/__tests__/task-kernel-publish.test.mjs`、`skills/wh-review/scripts/__tests__/review-controller.test.mjs`、`scripts/__tests__/stage-runtime-five-stage-e2e.test.mjs`。
- **输入**：T002 恢复文件和 `runtime.sha256`。
- **输出**：31/31 hash 与四文件窄测试证据。
- **依赖**：T002。
- **并行**：否。
- **FR**：FR-REV-001、FR-REV-002、FR-REV-003、FR-REV-004、FR-REV-005、FR-REV-006、FR-REV-007、FR-REV-008、FR-REV-009。
- **AC**：AC29、AC31、AC46、AC47、AC48、AC49、AC50、AC51、AC52、AC53。
- **gate_cmd**：`mkdir -p apply/evidence && shasum -a 256 -c "${WORKFLOWHUB_BOOTSTRAP_BUNDLE_DIR:?}"/runtime.sha256 > apply/evidence/T003-hash-green.stdout 2> apply/evidence/T003-hash-green.stderr && npx vitest run core/__tests__/canonical-review-result.test.mjs core/__tests__/task-kernel-publish.test.mjs skills/wh-review/scripts/__tests__/review-controller.test.mjs scripts/__tests__/stage-runtime-five-stage-e2e.test.mjs --pool=forks --maxWorkers=1 --minWorkers=1 > apply/evidence/T003-review-flow-green.stdout 2> apply/evidence/T003-review-flow-green.stderr`
- **expected_exit**：0
- **oracle**：31 行全部 `OK`；单 root/head、CAS、预算、latest event、build-code 重审和精确 receipt 用例通过。
- **evidence_path**：`apply/evidence/T003-hash-green.stdout`、`apply/evidence/T003-review-flow-green.stdout`

### Verify
T003 的两个 gate 均为 0；三个设计产物 hash 与 Phase 1 前一致。

### Knowledge
tar/manifest 是唯一恢复权威；patch 只用于审计。

### STOP
任一 hash 不同、路径集合不同、tar 路径逃逸或设计产物改变。

## Phase 2：窄研究与宪法 1.3.0

### Goal
先修订 serious finding 异常处置所需宪法，再允许风险处置代码进入 diff。

### Files

- Modify：`CONSTITUTION.md`、`constitution-checklist.md`、`CONTEXT.md`。
- Create：`docs/adr/0010-serious-review-disposition.md`。
- Forbidden：`runtime/review/stage-review-disposition.mjs`、`runtime/schemas/risk-acceptance.v1.json`，直至 T013 通过。

### Tasks

#### T010 [P] — 固定三类实践与 talk/grill 来源

- **ID**：T010
- **动作**：记录 append-only audit、host-visible interaction binding、human risk/omission acceptance 三类来源；记录 talk/grill 上游版本、检查日期、替代候选和采用/拒绝理由。
- **精确文件**：`CONTEXT.md`、`skills/talk-with-zhipeng/SKILL.md`、`skills/grill-with-docs/SKILL.md`。
- **输入**：accepted spec 的 FR-GOV-004、FR-GOV-007。
- **输出**：每类一条可追溯结论和两个 Skill 的 Sources 段。
- **依赖**：T003。
- **并行**：是；可与 T011 RED 准备并行。
- **FR**：FR-GOV-004、FR-GOV-007。
- **AC**：AC29、AC31、AC42、AC45。
- **gate_cmd**：`mkdir -p apply/evidence && npx vitest run tests/skill-provenance-strict.test.mjs tests/interaction-quality-contract.test.mjs --pool=forks --maxWorkers=1 --minWorkers=1 > apply/evidence/T010-provenance.stdout 2> apply/evidence/T010-provenance.stderr`
- **expected_exit**：0
- **oracle**：两 Skill 均有来源版本/commit、检查日期、替代候选和选择理由；三类研究不新增 provider、身份系统或通用框架。
- **evidence_path**：`apply/evidence/T010-provenance.stdout`

#### T011 — 宪法冲突 RED

- **ID**：T011
- **动作**：新增窄测试，证明 1.2.0 的 F3/F4/F7/Q1/Q2 不能表达 serious finding 异常暂停。
- **精确文件**：`tests/stage-risk-acceptance.test.mjs`。
- **输入**：FR-GOV-001、FR-GOV-002、FR-GOV-003、FR-RSK-001、FR-RSK-002、FR-RSK-003、FR-RSK-004。
- **输出**：实现前失败的版本/条目/映射断言。
- **依赖**：T003。
- **并行**：否。
- **FR**：FR-GOV-001、FR-GOV-002、FR-GOV-003、FR-RSK-001、FR-RSK-002、FR-RSK-003、FR-RSK-004。
- **AC**：AC24、AC25、AC26、AC27、AC29、AC30、AC31、AC40、AC41。
- **gate_cmd**：`mkdir -p apply/evidence && npx vitest run tests/stage-risk-acceptance.test.mjs --pool=forks --maxWorkers=1 --minWorkers=1 > apply/evidence/T011-constitution-red.stdout 2> apply/evidence/T011-constitution-red.stderr`
- **expected_exit**：1
- **oracle**：测试因版本不是 1.3.0 或五条语义/映射缺失而失败。
- **evidence_path**：`apply/evidence/T011-constitution-red.stdout`、`apply/evidence/T011-constitution-red.stderr`

#### T012 — 宪法 1.3.0 GREEN

- **ID**：T012
- **动作**：只修订 F3/F4/F7/Q1/Q2，更新版本、revision source、五条旧→新映射和 checklist。
- **精确文件**：`CONSTITUTION.md`、`constitution-checklist.md`、`docs/adr/0010-serious-review-disposition.md`。
- **输入**：T011 RED 和锁定的 serious 阈值/五阶段范围。
- **输出**：1.3.0 宪法、21 条 checklist、ADR。
- **依赖**：T011。
- **并行**：否。
- **FR**：FR-GOV-001、FR-GOV-002、FR-GOV-003、FR-RSK-001、FR-RSK-002、FR-RSK-003、FR-RSK-004。
- **AC**：AC24、AC25、AC26、AC27、AC29、AC30、AC31、AC40、AC41。
- **gate_cmd**：`mkdir -p apply/evidence && npx vitest run tests/stage-risk-acceptance.test.mjs --pool=forks --maxWorkers=1 --minWorkers=1 > apply/evidence/T012-constitution-green.stdout 2> apply/evidence/T012-constitution-green.stderr`
- **expected_exit**：0
- **oracle**：版本精确 1.3.0，条目恰好 21，五条语义、来源和映射全部通过。
- **evidence_path**：`apply/evidence/T012-constitution-green.stdout`

#### T013 — Phase 2 独立审查准备与冻结

- **ID**：T013
- **动作**：冻结宪法 diff、accepted spec 锚点和 T012 证据，交给 build-code Phase 独立 review；不在本 task 内自审自判。
- **精确文件**：`CONSTITUTION.md`、`constitution-checklist.md`、`docs/adr/0010-serious-review-disposition.md`、`apply/evidence/T012-constitution-green.stdout`。
- **输入**：T010、T012。
- **输出**：Phase 2 review packet 和 canonical review result ref。
- **依赖**：T010、T012。
- **并行**：否。
- **FR**：FR-GOV-001、FR-GOV-002、FR-GOV-003、FR-RSK-001、FR-RSK-002、FR-RSK-003、FR-RSK-004。
- **AC**：AC24、AC25、AC26、AC27、AC29、AC30、AC31、AC40、AC41。
- **gate_cmd**：`mkdir -p apply/evidence && npx vitest run tests/stage-risk-acceptance.test.mjs tests/contract-freeze.test.mjs --pool=forks --maxWorkers=1 --minWorkers=1 > apply/evidence/T013-constitution-freeze.stdout 2> apply/evidence/T013-constitution-freeze.stderr`
- **expected_exit**：0
- **oracle**：冻结材料与当前 tree 一致；正式 Phase review 无未处置 actionable finding 后才允许 T052。
- **evidence_path**：`apply/evidence/T013-constitution-freeze.stdout` 和 Phase review canonical ref

### Verify
T010、T012、T013 为 0，且 Phase review 无未处置 actionable finding。

### Knowledge
serious pause 是证据充分时的异常处置，不是常规质量门。

### STOP
宪法条目不是 21、五条外语义漂移或独立 review 未收口。

## Phase 3：typed evidence、唯一 audit 与正式发布

### Goal
建立窄 content evidence 能力，并让五阶段只通过既有 audit/handler 发布。

### Files

- Create：`core/stage-content-evidence.mjs` 及 11 个 `core/schemas/*.json`。
- Modify：`core/audit-aggregator.mjs`、`core/canonical-receipt-writer.mjs`、`core/task-kernel-implementation.mjs`、`core/stage-handlers.mjs`、`core/stage-context.mjs`、`scripts/stage-runtime.mjs`。

### Tasks

#### T020 — typed writer/schema RED

- **ID**：T020
- **动作**：覆盖未知 kind、caller identity/root/cwd、错 hash/tree、重复冲突和秘密未最小化。
- **精确文件**：`tests/stage-content-evidence.test.mjs`。
- **输入**：FR-AUD-002、FR-AUD-005、FR-AUD-010。
- **输出**：实现前 RED matrix。
- **依赖**：T003。
- **并行**：否。
- **FR**：FR-AUD-002、FR-AUD-005、FR-AUD-010。
- **AC**：AC1、AC2、AC3、AC27、AC29、AC31、AC39、AC44。
- **gate_cmd**：`mkdir -p apply/evidence && npx vitest run tests/stage-content-evidence.test.mjs --pool=forks --maxWorkers=1 --minWorkers=1 > apply/evidence/T020-evidence-red.stdout 2> apply/evidence/T020-evidence-red.stderr`
- **expected_exit**：1
- **oracle**：至少一个不合法 payload 被旧代码错误接受或缺少 API，测试真实失败。
- **evidence_path**：`apply/evidence/T020-evidence-red.stdout`、`apply/evidence/T020-evidence-red.stderr`

#### T021 — typed writer/schema GREEN

- **ID**：T021
- **动作**：实现 allowlisted envelope、schema dispatch、身份注入、minimize→hash→write 顺序和认证 reader。
- **精确文件**：`core/stage-content-evidence.mjs`、`runtime/schemas/stage-content-evidence.v1.json`、`core/schemas/interaction-completion.v1.json`、`runtime/schemas/ambiguity-ledger.v1.json`、`runtime/schemas/decision-entry.v1.json`、`runtime/schemas/decision-coverage-audit.v1.json`、`runtime/schemas/decision-omission-acceptance.v1.json`、`runtime/schemas/decision-correction-appendix.v1.json`、`runtime/schemas/decision-log-contract.v1.json`、`runtime/schemas/plan-task-contract.v1.json`、`runtime/schemas/stage-completion-facts.v1.json`、`runtime/schemas/risk-acceptance.v1.json`。
- **输入**：T020 fixtures。
- **输出**：create-only `{ref, hash, value}` 和认证 reader。
- **依赖**：T020。
- **并行**：否。
- **FR**：FR-AUD-002、FR-AUD-005、FR-AUD-006、FR-AUD-010。
- **AC**：AC1、AC2、AC3、AC27、AC29、AC31、AC39、AC44。
- **gate_cmd**：`mkdir -p apply/evidence && npx vitest run tests/stage-content-evidence.test.mjs --pool=forks --maxWorkers=1 --minWorkers=1 > apply/evidence/T021-evidence-green.stdout 2> apply/evidence/T021-evidence-green.stderr`
- **expected_exit**：0
- **oracle**：合法 kind 成功；未知 kind、caller identity/root/cwd、篡改和重复冲突全部在写入前失败。
- **evidence_path**：`apply/evidence/T021-evidence-green.stdout`

#### T022 [P] — audit/publication RED

- **ID**：T022
- **动作**：为缺失、重复、乱序、未成功、跨 run/task/stage/tree 和第二 verdict 写反例。
- **精确文件**：`tests/stage-content-publication.test.mjs`。
- **输入**：T021 API 和五 Stage steps manifest。
- **输出**：publication RED matrix。
- **依赖**：T021。
- **并行**：是；可与 T024 fixture 准备并行。
- **FR**：FR-AUD-001、FR-AUD-003、FR-AUD-004、FR-AUD-005。
- **AC**：AC1、AC2、AC3、AC4、AC29、AC31、AC38。
- **gate_cmd**：`mkdir -p apply/evidence && npx vitest run tests/stage-content-publication.test.mjs --pool=forks --maxWorkers=1 --minWorkers=1 > apply/evidence/T022-publication-red.stdout 2> apply/evidence/T022-publication-red.stderr`
- **expected_exit**：1
- **oracle**：旧 handler 至少让一个缺证据路径错误发布或缺少所需接口。
- **evidence_path**：`apply/evidence/T022-publication-red.stdout`、`apply/evidence/T022-publication-red.stderr`

#### T023 — audit/handler/TaskKernel GREEN

- **ID**：T023
- **动作**：把 typed refs 接入 audit context、TaskKernel publication 和五 Stage receipt allowlist；handler 只消费认证 facts。
- **精确文件**：`core/audit-aggregator.mjs`、`core/task-kernel-implementation.mjs`、`core/stage-handlers.mjs`、`core/stage-context.mjs`、`core/canonical-receipt-writer.mjs`、`scripts/stage-runtime.mjs`。
- **输入**：T021 writer、T022 fixtures。
- **输出**：唯一 audit carrier、content refs 和无半成品的 official attempts。
- **依赖**：T022。
- **并行**：否。
- **FR**：FR-AUD-001、FR-AUD-002、FR-AUD-003、FR-AUD-004、FR-AUD-005、FR-AUD-006。
- **AC**：AC1、AC2、AC3、AC4、AC29、AC31、AC38。
- **gate_cmd**：`mkdir -p apply/evidence && npx vitest run tests/stage-content-publication.test.mjs tests/audit-aggregator.test.mjs --pool=forks --maxWorkers=1 --minWorkers=1 > apply/evidence/T023-publication-green.stdout 2> apply/evidence/T023-publication-green.stderr`
- **expected_exit**：0
- **oracle**：正常路径发布；所有结构反例非零且无成功 attempt；只有 audit summary 包含过程 verdict。
- **evidence_path**：`apply/evidence/T023-publication-green.stdout`

#### T024 — 五阶段 E2E 与展示一致性

- **ID**：T024
- **动作**：接入 make-decision/build-spec/build-plan/build-code/verify-code；修复 verified evidence 同时显示 unknown 的矛盾。
- **精确文件**：`scripts/__tests__/stage-runtime-five-stage-e2e.test.mjs`、`tests/five-stage-audit-e2e.test.mjs`、`tests/official-make-decision-cli.test.mjs`。
- **输入**：T023 official publication。
- **输出**：五阶段正反例和一致 missing_items/evidence_state。
- **依赖**：T023。
- **并行**：否。
- **FR**：FR-AUD-001、FR-AUD-003、FR-AUD-004、FR-AUD-006。
- **AC**：AC1、AC2、AC3、AC4、AC29、AC31、AC38。
- **gate_cmd**：`mkdir -p apply/evidence && npx vitest run scripts/__tests__/stage-runtime-five-stage-e2e.test.mjs tests/five-stage-audit-e2e.test.mjs tests/official-make-decision-cli.test.mjs --pool=forks --maxWorkers=1 --minWorkers=1 > apply/evidence/T024-five-stage-green.stdout 2> apply/evidence/T024-five-stage-green.stderr`
- **expected_exit**：0
- **oracle**：五 Stage 正例通过；缺证据失败；verified 不再同时显示 unknown；semantic verdict 原值保留。
- **evidence_path**：`apply/evidence/T024-five-stage-green.stdout`

### Verify
T021、T023、T024 为 0；T020、T022 的相同测试在实现前为 1。

### Knowledge
content contract 的 `ok/errors` 是输入事实，不是第二个 Stage verdict。

### STOP
caller 能写身份字段、任意 payload 被接受或 handler 自己决定过程 pass/fail。

## Phase 4：真实交互、歧义与完整 decision-log

### Goal
真实逐题交互进入 canonical evidence；accepted decision 只有一套 schema，并同时可读、可审计。

### Files

- Modify：talk/grill/decision Skills、make-decision/build-spec workflow。
- Create：decision template。
- Use：Phase 3 interaction/ambiguity/decision schemas。

### Tasks

#### T030 — interaction/ambiguity RED

- **ID**：T030
- **动作**：覆盖双轴、缺推荐/理由/含义/后果/风险、内部黑话、假 reply、无 re-rank、分母假变化、grill 摘要替代和未清 blocker。
- **精确文件**：`tests/stage-interaction-contract.test.mjs`、`tests/interaction-quality-contract.test.mjs`。
- **输入**：FR-AUD-007、FR-INT-001、FR-INT-002、FR-INT-003、FR-INT-004、FR-INT-005、FR-INT-006、FR-INT-007、FR-INT-008、FR-INT-009。
- **输出**：逐字段删除和顺序反例。
- **依赖**：T023、T010。
- **并行**：否。
- **FR**：FR-AUD-007、FR-INT-001、FR-INT-002、FR-INT-003、FR-INT-004、FR-INT-005、FR-INT-006、FR-INT-008、FR-INT-009。
- **AC**：AC2、AC5、AC6、AC7、AC8、AC9、AC11、AC29、AC31、AC33。
- **gate_cmd**：`mkdir -p apply/evidence && npx vitest run tests/stage-interaction-contract.test.mjs tests/interaction-quality-contract.test.mjs --pool=forks --maxWorkers=1 --minWorkers=1 > apply/evidence/T030-interaction-red.stdout 2> apply/evidence/T030-interaction-red.stderr`
- **expected_exit**：1
- **oracle**：旧实现至少错误接受一个假回答/缺轮次/摘要 grill/错误分母反例。
- **evidence_path**：`apply/evidence/T030-interaction-red.stdout`、`apply/evidence/T030-interaction-red.stderr`

#### T031 — talk/grill typed interaction GREEN

- **ID**：T031
- **动作**：落实 ask→wait→reply→re-rank、动态分母、三轮 aggregate、grill 四项 exit facts；不保存完整卡片或秘密。
- **精确文件**：`skills/talk-with-zhipeng/SKILL.md`、`skills/grill-with-docs/SKILL.md`、`workflows/make-decision/SKILL.md`、`workflows/make-decision/steps.json`、`workflows/make-decision/skill-deps.yaml`。
- **输入**：T030 fixtures、T021 writer。
- **输出**：三轮 talk + grill 的 `interaction-completion.v1` refs/hashes。
- **依赖**：T030。
- **并行**：否。
- **FR**：FR-AUD-007、FR-INT-001、FR-INT-002、FR-INT-003、FR-INT-004、FR-INT-005、FR-INT-006、FR-INT-008、FR-INT-009。
- **AC**：AC2、AC5、AC6、AC7、AC8、AC9、AC11、AC29、AC31、AC33。
- **gate_cmd**：`mkdir -p apply/evidence && npx vitest run tests/stage-interaction-contract.test.mjs tests/interaction-quality-contract.test.mjs --pool=forks --maxWorkers=1 --minWorkers=1 > apply/evidence/T031-interaction-green.stdout 2> apply/evidence/T031-interaction-green.stderr`
- **expected_exit**：0
- **oracle**：三轮正例和机械零问题 grill 正例通过；所有假回答、顺序、隐私和内容反例失败。
- **evidence_path**：`apply/evidence/T031-interaction-green.stdout`

#### T032 [P] — ambiguity ledger

- **ID**：T032
- **动作**：实现逐轴分类、六维影响、material、结论/blocker、spec hash 和 review resolution 绑定。
- **精确文件**：`workflows/build-spec/SKILL.md`、`workflows/build-spec/steps.json`、`tests/stage-interaction-contract.test.mjs`。
- **输入**：T031 interaction、最终 spec content。
- **输出**：`ambiguity-ledger.v1` canonical ref/hash。
- **依赖**：T031、T023。
- **并行**：是；可与 T033 RED 准备并行。
- **FR**：FR-AMB-001、FR-AMB-002、FR-AMB-003、FR-AMB-004。
- **AC**：AC12、AC13、AC14、AC29、AC31。
- **gate_cmd**：`mkdir -p apply/evidence && npx vitest run tests/stage-interaction-contract.test.mjs --pool=forks --maxWorkers=1 --minWorkers=1 > apply/evidence/T032-ambiguity-green.stdout 2> apply/evidence/T032-ambiguity-green.stderr`
- **expected_exit**：0
- **oracle**：独立轴不能合并；重大 blocker 阻止 publication；无重大歧义有事实理由；旧 spec hash 拒绝。
- **evidence_path**：`apply/evidence/T032-ambiguity-green.stdout`

#### T033 — decision coverage RED

- **ID**：T033
- **动作**：覆盖缺 source_type、exact excerpt、approval binding、推荐/含义/后果/风险、重复覆盖、错 hash、摘要 detail packet 和 schema 混用。
- **精确文件**：`tests/stage-decision-contract.test.mjs`。
- **输入**：FR-AUD-008、FR-AUD-009、FR-INT-007、FR-DEC-001、FR-DEC-002。
- **输出**：decision-entry、coverage、omission、detail packet RED matrix。
- **依赖**：T023。
- **并行**：否。
- **FR**：FR-AUD-008、FR-AUD-009、FR-INT-007、FR-DEC-001、FR-DEC-002。
- **AC**：AC10、AC15、AC27、AC29、AC31、AC34、AC35。
- **gate_cmd**：`mkdir -p apply/evidence && npx vitest run tests/stage-decision-contract.test.mjs --pool=forks --maxWorkers=1 --minWorkers=1 > apply/evidence/T033-decision-red.stdout 2> apply/evidence/T033-decision-red.stderr`
- **expected_exit**：1
- **oracle**：旧 decision receipt 至少因单一 schema、来源/批准绑定或 coverage 缺口失败。
- **evidence_path**：`apply/evidence/T033-decision-red.stdout`、`apply/evidence/T033-decision-red.stderr`

#### T034 — 唯一 `decision-entry.v1`

- **ID**：T034
- **动作**：让正文和 omission appendix 共用一个 schema；加入 source_type、approval_status/ref/hash、人类可读含义和全部承重字段。
- **精确文件**：`runtime/stage/stage-content-contracts.mjs`、`runtime/schemas/decision-entry.v1.json`、`skills/decision-log/SKILL.md`、`skills/decision-log/templates/decision-log-template.md`。
- **输入**：T033 fixtures、accepted spec Section 6。
- **输出**：唯一 decision validator 与 Markdown 模板。
- **依赖**：T033。
- **并行**：否。
- **FR**：FR-INT-007、FR-DEC-001、FR-DEC-002。
- **AC**：AC10、AC15、AC29、AC31、AC35。
- **gate_cmd**：`mkdir -p apply/evidence && npx vitest run tests/stage-decision-contract.test.mjs --pool=forks --maxWorkers=1 --minWorkers=1 > apply/evidence/T034-decision-entry-green.stdout 2> apply/evidence/T034-decision-entry-green.stderr`
- **expected_exit**：0
- **oracle**：schema `required` 遍历覆盖每个字段；正文与 appendix 不再维护两套决定字段。
- **evidence_path**：`apply/evidence/T034-decision-entry-green.stdout`

#### T035 — 人类可读 Markdown + canonical lookup

- **ID**：T035
- **动作**：make-decision 发布独立 `decision-log.md`；receipt 保存 main ref/hash 和 contract refs；accepted lookup 只指向最终版本。
- **精确文件**：`core/canonical-receipt-writer.mjs`、`core/task-kernel-implementation.mjs`、`core/stage-handlers.mjs`、`workflows/make-decision/SKILL.md`、`tests/stage-decision-contract.test.mjs`。
- **输入**：T034 decision entries、T031 interaction aggregate。
- **输出**：可读 Markdown artifact、receipt ref/hash、accepted stable lookup。
- **依赖**：T034、T031。
- **并行**：否。
- **FR**：FR-AUD-008、FR-DEC-003、FR-DEC-004。
- **AC**：AC16、AC29、AC31、AC34。
- **gate_cmd**：`mkdir -p apply/evidence && npx vitest run tests/stage-decision-contract.test.mjs tests/official-make-decision-cli.test.mjs --pool=forks --maxWorkers=1 --minWorkers=1 > apply/evidence/T035-decision-lookup-green.stdout 2> apply/evidence/T035-decision-lookup-green.stderr`
- **expected_exit**：0
- **oracle**：Markdown 可直接读取；receipt hash 与其 bytes 一致；存在 revision 时下游只读 accepted 最终 ref。
- **evidence_path**：`apply/evidence/T035-decision-lookup-green.stdout`

#### T036 — coverage、omission 与 D1–D7 correction

- **ID**：T036
- **动作**：逐条审计原始需求/回答/grill/review/承重决定；遗漏先展示后等待；接受时写专用 appendix；追加七条固定 correction。
- **精确文件**：`runtime/stage/stage-content-contracts.mjs`、`runtime/schemas/decision-coverage-audit.v1.json`、`runtime/schemas/decision-omission-acceptance.v1.json`、`runtime/schemas/decision-correction-appendix.v1.json`、`runtime/schemas/decision-log-contract.v1.json`、`workflows/make-decision/SKILL.md`、`tests/stage-decision-contract.test.mjs`。
- **输入**：T035 main ref/hash、interaction、source items、D1–D7 旧 ref/hash。
- **输出**：coverage audit、零个或多个 omission appendix、一个 correction appendix、accepted decision set。
- **依赖**：T035、T032。
- **并行**：否。
- **FR**：FR-AUD-009、FR-INT-007、FR-DEC-001、FR-DEC-002、FR-DEC-005、FR-CMP-001。
- **AC**：AC10、AC15、AC27、AC28、AC29、AC31、AC35、AC37。
- **gate_cmd**：`mkdir -p apply/evidence && npx vitest run tests/stage-decision-contract.test.mjs --pool=forks --maxWorkers=1 --minWorkers=1 > apply/evidence/T036-decision-coverage-green.stdout 2> apply/evidence/T036-decision-coverage-green.stderr`
- **expected_exit**：0
- **oracle**：每个 source item 恰好覆盖一次；accepted_omission 不伪装 covered；D1–D7 旧 bytes/hash 不变且七条更正逐字匹配。
- **evidence_path**：`apply/evidence/T036-decision-coverage-green.stdout`

### Verify
T031、T032、T034、T035、T036 为 0，T030/T033 的实现前证据为 1。

### Knowledge
receipt 是机器索引；`decision-log.md` 是人类主文件；两者通过 ref/hash 绑定。

### STOP
保存完整对话/秘密、补造旧 typed proof、修改 D1–D7 或用 review risk 代替 omission。

## Phase 5：plan/tasks 内容契约与有限 review

### Goal
把 AgentHub 成熟质量迁入宿主无关模板，并修复 build-spec/build-plan 的无限 review 文案。

### Files

- Modify：spec-plan/spec-tasks Skill 和模板、plan-eng-review、build-spec/build-plan Skill、wh-review manifest。
- Use：`plan-task-contract.v1`。

### Tasks

#### T040 — plan/tasks 结构 RED

- **ID**：T040
- **动作**：逐项删除 plan 必填区、Phase 六段、task 13 字段，制造重复 ID、孤儿 FR/AC、无效依赖和环。
- **精确文件**：`tests/stage-plan-task-contract.test.mjs`。
- **输入**：FR-PLN-001、FR-PLN-002、FR-PLN-003、FR-PLN-004。
- **输出**：字段删除和 DAG RED matrix。
- **依赖**：T023。
- **并行**：否。
- **FR**：FR-PLN-001、FR-PLN-002、FR-PLN-003、FR-PLN-004。
- **AC**：AC17、AC18、AC19、AC20、AC29、AC31。
- **gate_cmd**：`mkdir -p apply/evidence && npx vitest run tests/stage-plan-task-contract.test.mjs --pool=forks --maxWorkers=1 --minWorkers=1 > apply/evidence/T040-plan-task-red.stdout 2> apply/evidence/T040-plan-task-red.stderr`
- **expected_exit**：1
- **oracle**：旧非空校验错误接受至少一个结构缺口。
- **evidence_path**：`apply/evidence/T040-plan-task-red.stdout`、`apply/evidence/T040-plan-task-red.stderr`

#### T041 [P] — 重写 spec-plan/spec-tasks 模板

- **ID**：T041
- **动作**：迁入 Technical Context、治理矩阵、Code Anchors、模块/接口/schema/状态流、精确文件、方案取舍、Phase Done/风险/回滚、13 字段 task 和窄测试规则。
- **精确文件**：`skills/spec-plan/SKILL.md`、`skills/spec-plan/templates/plan-template.md`、`skills/spec-tasks/SKILL.md`、`skills/spec-tasks/templates/tasks-template.md`。
- **输入**：T040 fixtures、本轮完整 plan/tasks 结构。
- **输出**：宿主无关模板；无 Multica 固定包、绝对 Knowledge 规则或默认全量测试。
- **依赖**：T040。
- **并行**：是；可与 T043 lens 文案修改并行。
- **FR**：FR-PLN-001、FR-PLN-002、FR-PLN-003。
- **AC**：AC17、AC18、AC19、AC29、AC31。
- **gate_cmd**：`mkdir -p apply/evidence && npx vitest run tests/m12-templates.test.mjs tests/stage-plan-task-contract.test.mjs --pool=forks --maxWorkers=1 --minWorkers=1 > apply/evidence/T041-template-green.stdout 2> apply/evidence/T041-template-green.stderr`
- **expected_exit**：0
- **oracle**：模板包含全部结构；不存在 `Run full test suite` 默认任务；不存在 Multica/Issue/固定宿主路径。
- **evidence_path**：`apply/evidence/T041-template-green.stdout`

#### T042 — plan-task validator/DAG/traceability GREEN

- **ID**：T042
- **动作**：实现 plan/tasks parser、Phase/task rows、命令/oracle 检查、DAG 和逐项 FR/AC 双向覆盖。
- **精确文件**：`runtime/stage/stage-content-contracts.mjs`、`runtime/schemas/plan-task-contract.v1.json`、`core/stage-handlers.mjs`、`workflows/build-plan/steps.json`、`workflows/build-plan/skill-deps.yaml`。
- **输入**：T040 matrix、T041 模板。
- **输出**：`plan-task-contract.v1` facts。
- **依赖**：T041。
- **并行**：否。
- **FR**：FR-PLN-001、FR-PLN-002、FR-PLN-003、FR-PLN-004、FR-PLN-005。
- **AC**：AC17、AC18、AC19、AC20、AC21、AC29、AC31。
- **gate_cmd**：`mkdir -p apply/evidence && npx vitest run tests/stage-plan-task-contract.test.mjs --pool=forks --maxWorkers=1 --minWorkers=1 > apply/evidence/T042-validator-green.stdout 2> apply/evidence/T042-validator-green.stderr`
- **expected_exit**：0
- **oracle**：所有结构正例通过；空标题、自然语言命令、孤儿、重复、无效依赖、环和 review pass 覆盖结构错全部失败。
- **evidence_path**：`apply/evidence/T042-validator-green.stdout`

#### T043 [P] — engineering lens 材料合同

- **ID**：T043
- **动作**：让现有 lens 检查模块边界、接口/schema、状态流、实现效果、精确命令、rollback 和并行真实性；仍为 lens-only。
- **精确文件**：`skills/plan-eng-review/SKILL.md`、`skills/wh-review/manifest.json`、`tests/stage-plan-task-contract.test.mjs`。
- **输入**：完整 spec/plan/tasks 和 T042 contract facts。
- **输出**：正式 review material 必含 engineering lens 的事实。
- **依赖**：T040。
- **并行**：是；可与 T041 并行。
- **FR**：FR-PLN-005、FR-PLN-006。
- **AC**：AC21、AC29、AC31、AC38。
- **gate_cmd**：`mkdir -p apply/evidence && npx vitest run tests/stage-plan-task-contract.test.mjs tests/m12-subskill-exclusion.test.mjs --pool=forks --maxWorkers=1 --minWorkers=1 > apply/evidence/T043-lens-green.stdout 2> apply/evidence/T043-lens-green.stderr`
- **expected_exit**：0
- **oracle**：缺 lens 的正式 build-plan review material 失败；没有新增 runner 或 verdict。
- **evidence_path**：`apply/evidence/T043-lens-green.stdout`

#### T044 — 修复 build-spec/build-plan 无限 review 冲突

- **ID**：T044
- **动作**：删除“changed draft 无限重审”规则；统一为一次 initial full、普通修改零 provider resolution、重大结构变化最多一次 full；build-code 规则不变。
- **精确文件**：`workflows/build-spec/SKILL.md`、`workflows/build-plan/SKILL.md`、`tests/stage-review-cost-policy.test.mjs`。
- **输入**：已接受 review 成本决定、TaskKernel flow API。
- **输出**：两个 Stage 无冲突的正式规则。
- **依赖**：T042、T043、T003。
- **并行**：否。
- **FR**：FR-PLN-005、FR-PLN-006、FR-REV-003、FR-REV-004。
- **AC**：AC14、AC21、AC29、AC31、AC38、AC47、AC48。
- **gate_cmd**：`mkdir -p apply/evidence && npx vitest run tests/stage-review-cost-policy.test.mjs --pool=forks --maxWorkers=1 --minWorkers=1 > apply/evidence/T044-review-policy-green.stdout 2> apply/evidence/T044-review-policy-green.stderr`
- **expected_exit**：0
- **oracle**：两个 Skill 不含无限 review 语义；ordinary edit provider delta 为 0；第二次 structural full 派发前失败。
- **evidence_path**：`apply/evidence/T044-review-policy-green.stdout`

### Verify
T041–T044 为 0；本轮 draft-plan/tasks 可由 T042 validator 读取并得到 61/61、53/53。

### Knowledge
结构 validator 不能把 reviewer 语义结果改成 pass。

### STOP
模板再次出现占位命令、默认全量测试、第二 review runner 或范围缩写追踪。

## Phase 6：review 成本、serious pause 与风险承担

### Goal
完成五阶段统一成本事实和具体 serious finding 的知情处置。

### Files

- Modify：TaskKernel、review controller、五 Stage Skill/handler。
- Create：stage-review-disposition 模块和 risk schema。

### Tasks

#### T050 — 五阶段 review/cost 缺口 RED

- **ID**：T050
- **动作**：补省略/correct/stale/cross-stage/cross-revision CAS、普通修改、十类结构变化、unavailable 和 cost 重算反例。
- **精确文件**：`tests/stage-review-cost-policy.test.mjs`。
- **输入**：Phase 1 authority，以及 FR-REV-001、FR-REV-002、FR-REV-003、FR-REV-004、FR-REV-005、FR-REV-006、FR-REV-007、FR-REV-008。
- **输出**：仅缺失矩阵 RED，不建新 fixture framework。
- **依赖**：T003、T044。
- **并行**：否。
- **FR**：FR-REV-001、FR-REV-002、FR-REV-003、FR-REV-004、FR-REV-005、FR-REV-006、FR-REV-007、FR-REV-008、FR-AMB-004。
- **AC**：AC14、AC29、AC31、AC46、AC47、AC48、AC49、AC50、AC51、AC52。
- **gate_cmd**：`mkdir -p apply/evidence && npx vitest run tests/stage-review-cost-policy.test.mjs --pool=forks --maxWorkers=1 --minWorkers=1 > apply/evidence/T050-review-cost-red.stdout 2> apply/evidence/T050-review-cost-red.stderr`
- **expected_exit**：1
- **oracle**：至少一个非 build-code Stage 矩阵或 revision lineage 缺口真实失败。
- **evidence_path**：`apply/evidence/T050-review-cost-red.stdout`、`apply/evidence/T050-review-cost-red.stderr`

#### T051 — 五阶段 review/cost GREEN

- **ID**：T051
- **动作**：只补五阶段覆盖、合法 revision isolation/lineage 和由 flow events 可复算的 cost facts。
- **精确文件**：`core/task-kernel-implementation.mjs`、`runtime/review/review-flow-authority.mjs`、`skills/wh-review/scripts/review-controller.mjs`、`skills/wh-review/schemas/resolution.schema.json`、`core/stage-handlers.mjs`。
- **输入**：T050 gaps。
- **输出**：统一 flow/head/CAS/budget/cost 行为。
- **依赖**：T050。
- **并行**：否。
- **FR**：FR-REV-001、FR-REV-002、FR-REV-003、FR-REV-004、FR-REV-005、FR-REV-006、FR-REV-007、FR-REV-008、FR-HOF-004。
- **AC**：AC14、AC21、AC29、AC31、AC36、AC46、AC47、AC48、AC49、AC50、AC51、AC52。
- **gate_cmd**：`mkdir -p apply/evidence && npx vitest run tests/stage-review-cost-policy.test.mjs skills/wh-review/scripts/__tests__/review-controller.test.mjs core/__tests__/task-kernel-publish.test.mjs --pool=forks --maxWorkers=1 --minWorkers=1 > apply/evidence/T051-review-cost-green.stdout 2> apply/evidence/T051-review-cost-green.stderr`
- **expected_exit**：0
- **oracle**：普通修改 0 provider；结构 full 最多一次；build-code 每次 fresh full；unavailable 无 verdict/root；cost 逐 event 重算相等。
- **evidence_path**：`apply/evidence/T051-review-cost-green.stdout`

#### T052 — serious/risk RED

- **ID**：T052
- **动作**：覆盖五阶段 major/blocking、minor、invalid anchor/evidence、unavailable、timeout、通用同意、跨 snapshot、新 finding 和 omission 混用。
- **精确文件**：`tests/stage-risk-acceptance.test.mjs`。
- **输入**：T013 宪法、T051 review facts。
- **输出**：risk trigger/binding RED matrix。
- **依赖**：T013、T051。
- **并行**：否。
- **FR**：FR-RSK-001、FR-RSK-002、FR-RSK-003、FR-RSK-004。
- **AC**：AC24、AC25、AC26、AC27、AC29、AC30、AC31。
- **gate_cmd**：`mkdir -p apply/evidence && npx vitest run tests/stage-risk-acceptance.test.mjs --pool=forks --maxWorkers=1 --minWorkers=1 > apply/evidence/T052-risk-red.stdout 2> apply/evidence/T052-risk-red.stderr`
- **expected_exit**：1
- **oracle**：旧实现缺少五阶段统一暂停或强绑定 risk acceptance，测试真实失败。
- **evidence_path**：`apply/evidence/T052-risk-red.stdout`、`apply/evidence/T052-risk-red.stderr`

#### T053 — serious pause GREEN

- **ID**：T053
- **动作**：只对 valid `actionable + major|blocking` 生成异常暂停卡；正常 build-spec/build-code 不增加确认。
- **精确文件**：`runtime/review/stage-review-disposition.mjs`、`core/stage-handlers.mjs`、`workflows/make-decision/SKILL.md`、`workflows/build-spec/SKILL.md`、`workflows/build-plan/SKILL.md`、`workflows/build-code/SKILL.md`、`workflows/verify-code/SKILL.md`。
- **输入**：T052 findings、T012 宪法。
- **输出**：五阶段统一 pause facts 和 host-visible 卡片合同。
- **依赖**：T052。
- **并行**：否。
- **FR**：FR-RSK-001、FR-RSK-002、FR-GOV-002、FR-GOV-003。
- **AC**：AC24、AC25、AC29、AC30、AC31、AC40、AC41。
- **gate_cmd**：`mkdir -p apply/evidence && npx vitest run tests/stage-risk-acceptance.test.mjs --pool=forks --maxWorkers=1 --minWorkers=1 > apply/evidence/T053-serious-pause-green.stdout 2> apply/evidence/T053-serious-pause-green.stderr`
- **expected_exit**：0
- **oracle**：五阶段 serious 触发；minor/invalid/unavailable 不触发；无 serious 的两个自动 Stage 不新增确认。
- **evidence_path**：`apply/evidence/T053-serious-pause-green.stdout`

#### T054 — risk acceptance GREEN

- **ID**：T054
- **动作**：TaskKernel 强绑 finding/review/evidence/snapshot/card/reply/选择/时间，create-only 写 risk record，保持原 verdict。
- **精确文件**：`runtime/review/stage-review-disposition.mjs`、`runtime/schemas/risk-acceptance.v1.json`、`core/task-kernel-implementation.mjs`、`scripts/stage-runtime.mjs`、`tests/stage-risk-acceptance.test.mjs`。
- **输入**：T053 pause facts 和真实 host reply。
- **输出**：`risk-acceptance.v1` ref/hash。
- **依赖**：T053。
- **并行**：否。
- **FR**：FR-RSK-003、FR-RSK-004。
- **AC**：AC26、AC27、AC29、AC30、AC31。
- **gate_cmd**：`mkdir -p apply/evidence && npx vitest run tests/stage-risk-acceptance.test.mjs --pool=forks --maxWorkers=1 --minWorkers=1 > apply/evidence/T054-risk-acceptance-green.stdout 2> apply/evidence/T054-risk-acceptance-green.stderr`
- **expected_exit**：0
- **oracle**：只放行同 finding+snapshot；跨 snapshot、新 finding、通用同意、错 hash 和结构错误失败；verdict 不变。
- **evidence_path**：`apply/evidence/T054-risk-acceptance-green.stdout`

#### T055 — review risk 与 decision omission 分离

- **ID**：T055
- **动作**：证明两 schema 互不接受对方 payload，且 omission 不能放行 audit/结构错误。
- **精确文件**：`tests/stage-risk-acceptance.test.mjs`、`tests/stage-decision-contract.test.mjs`。
- **输入**：T036 omission、T054 risk。
- **输出**：schema cross-use 反例。
- **依赖**：T036、T054。
- **并行**：否。
- **FR**：FR-RSK-004。
- **AC**：AC26、AC27、AC29、AC30、AC31。
- **gate_cmd**：`mkdir -p apply/evidence && npx vitest run tests/stage-risk-acceptance.test.mjs tests/stage-decision-contract.test.mjs --pool=forks --maxWorkers=1 --minWorkers=1 > apply/evidence/T055-risk-omission-separation.stdout 2> apply/evidence/T055-risk-omission-separation.stderr`
- **expected_exit**：0
- **oracle**：risk payload 不能写 omission namespace；omission payload 不能写 risk namespace；两者都不能覆盖结构失败。
- **evidence_path**：`apply/evidence/T055-risk-omission-separation.stdout`

### Verify
T051、T053、T054、T055 为 0；T050、T052 实现前为 1。

### Knowledge
review transport、contract validity、semantic verdict 分开。

### STOP
第二计数器、成本估算、跨 snapshot 复用、risk 改 verdict 或 ordinary edit 调 provider。

## Phase 7：同源双视图与 metrics

### Goal
让用户总结好读、系统交接完整，且两者共用同一事实。

### Files

- Create：completion facts 模块/schema/test。
- Modify：五 Stage completion 和 metrics 接线。

### Tasks

#### T060 — completion drift RED

- **ID**：T060
- **动作**：制造共同字段漂移、用户泄漏内部 refs、系统缺 refs、指标估算和 renderer 自行重算。
- **精确文件**：`tests/stage-completion-facts.test.mjs`。
- **输入**：FR-HOF-001、FR-HOF-002、FR-HOF-003、FR-HOF-004。
- **输出**：双视图 RED matrix。
- **依赖**：T023。
- **并行**：否。
- **FR**：FR-HOF-001、FR-HOF-002、FR-HOF-003、FR-HOF-004。
- **AC**：AC22、AC23、AC29、AC31、AC36、AC52。
- **gate_cmd**：`mkdir -p apply/evidence && npx vitest run tests/stage-completion-facts.test.mjs --pool=forks --maxWorkers=1 --minWorkers=1 > apply/evidence/T060-completion-red.stdout 2> apply/evidence/T060-completion-red.stderr`
- **expected_exit**：1
- **oracle**：旧 completion 输出至少存在漂移或缺少统一 facts API。
- **evidence_path**：`apply/evidence/T060-completion-red.stdout`、`apply/evidence/T060-completion-red.stderr`

#### T061 — completion facts 与双 renderer GREEN

- **ID**：T061
- **动作**：实现共同 facts、用户 renderer、系统 renderer 和共同字段一致性检查。
- **精确文件**：`core/stage-completion-facts.mjs`、`runtime/schemas/stage-completion-facts.v1.json`、`tests/stage-completion-facts.test.mjs`。
- **输入**：T060 fixtures 和 official attempt facts。
- **输出**：一份 canonical facts、两个派生视图。
- **依赖**：T060。
- **并行**：否。
- **FR**：FR-HOF-001、FR-HOF-002、FR-HOF-003、FR-HOF-004。
- **AC**：AC22、AC23、AC29、AC31、AC36、AC52。
- **gate_cmd**：`mkdir -p apply/evidence && npx vitest run tests/stage-completion-facts.test.mjs --pool=forks --maxWorkers=1 --minWorkers=1 > apply/evidence/T061-completion-green.stdout 2> apply/evidence/T061-completion-green.stderr`
- **expected_exit**：0
- **oracle**：共同字段一致；用户视图含目标/做法/效果/边界/风险/下一步/动作且无内部流水；系统视图 refs 完整。
- **evidence_path**：`apply/evidence/T061-completion-green.stdout`

#### T062 — 五 Stage completion 接线

- **ID**：T062
- **动作**：五 Stage 完成时只从 T061 facts 生成两视图，并使用同一 human-readable artifact label/accepted lookup。
- **精确文件**：`workflows/make-decision/SKILL.md`、`workflows/build-spec/SKILL.md`、`workflows/build-plan/SKILL.md`、`workflows/build-code/SKILL.md`、`workflows/verify-code/SKILL.md`、`core/stage-handlers.mjs`。
- **输入**：T061 renderers。
- **输出**：五阶段一致 completion handoff。
- **依赖**：T061。
- **并行**：否。
- **FR**：FR-HOF-001、FR-HOF-002、FR-HOF-003。
- **AC**：AC22、AC23、AC29、AC31。
- **gate_cmd**：`mkdir -p apply/evidence && npx vitest run tests/stage-completion-facts.test.mjs scripts/__tests__/stage-runtime-five-stage-e2e.test.mjs --pool=forks --maxWorkers=1 --minWorkers=1 > apply/evidence/T062-five-stage-completion.stdout 2> apply/evidence/T062-five-stage-completion.stderr`
- **expected_exit**：0
- **oracle**：五 Stage 共享 fields；用户消息不含 hash/receipt/attempt/runner；system handoff 不缺 review/dependency/recovery。
- **evidence_path**：`apply/evidence/T062-five-stage-completion.stdout`

#### T063 — 六类 own-result metrics

- **ID**：T063
- **动作**：覆盖 entry、success、structural-fail、serious-pause、risk-override、omission-accept；collector 故障 warn-only。
- **精确文件**：`tests/stage-completion-facts.test.mjs`、`tests/metrics-smoke.test.mjs`、`tests/metrics-taskhandle-v2.test.mjs`。
- **输入**：T062 五 Stage completion。
- **输出**：统一 metrics skeleton/own-result facts。
- **依赖**：T062、T055。
- **并行**：否。
- **FR**：FR-GOV-005。
- **AC**：AC29、AC31、AC43。
- **gate_cmd**：`mkdir -p apply/evidence && npx vitest run tests/stage-completion-facts.test.mjs tests/metrics-smoke.test.mjs tests/metrics-taskhandle-v2.test.mjs --pool=forks --maxWorkers=1 --minWorkers=1 > apply/evidence/T063-metrics-green.stdout 2> apply/evidence/T063-metrics-green.stderr`
- **expected_exit**：0
- **oracle**：六类 own-result 均存在；collector 抛错只产生 warning，原 Stage result 不变。
- **evidence_path**：`apply/evidence/T063-metrics-green.stdout`

### Verify
T061、T062、T063 为 0，T060 实现前为 1。

### Knowledge
renderer 只格式化，不读仓库、不查 task、不重算事实。

### STOP
两个视图使用不同来源或 metrics 改变阶段结果。

## Phase 8：宿主独立、continuation、真实重放与最终验证

### Goal
证明无宿主绑定，并让原 `review-foundation-baseline` task 真实继续。

### Files

- Create：host-independence/continuation tests、continuation input、`scripts/validate-stage-replay.mjs`。
- Modify：TaskKernel、stage-runtime CLI。
- External append-only target：`workflowhub/review-foundation-baseline canonical task records`。

### Tasks

#### T070 — 中性宿主真实 harness

- **ID**：T070
- **动作**：从非 WorkflowHub cwd、无 Multica/Issue 身份环境执行 make-decision/build-spec/build-plan 正例和 root/task path/cwd 注入反例。
- **精确文件**：`tests/stage-content-host-independence.test.mjs`、`tests/host-independence.test.mjs`。
- **输入**：T036、T044、T055、T063 完整能力。
- **输出**：真实中性宿主正反例。
- **依赖**：T036、T044、T055、T063。
- **并行**：否。
- **FR**：FR-AUD-010、FR-GOV-006。
- **AC**：AC29、AC31、AC39、AC44。
- **gate_cmd**：`mkdir -p apply/evidence && npx vitest run tests/stage-content-host-independence.test.mjs tests/host-independence.test.mjs --pool=forks --maxWorkers=1 --minWorkers=1 > apply/evidence/T070-host-independence.stdout 2> apply/evidence/T070-host-independence.stderr`
- **expected_exit**：0
- **oracle**：临时非项目 cwd 正例完成；root/task path/cwd/repository discovery 注入全部失败；纯正则扫描不是唯一证据。
- **evidence_path**：`apply/evidence/T070-host-independence.stdout`

#### T071 — append-only continuation API/CLI

- **ID**：T071
- **动作**：实现新 revision flow，绑定旧 accepted/attempt ref/hash 和重新执行原因；禁止修改旧记录或把 previous_result_ref 当 revision。
- **精确文件**：`core/task-kernel-implementation.mjs`、`core/task-handle.mjs`、`scripts/stage-runtime.mjs`、`tests/stage-content-continuation.test.mjs`。
- **输入**：旧 task identity、旧未接受 attempt/review、current runner identity。
- **输出**：`continue-stage` command 和 append-only lineage record。
- **依赖**：T051、T070。
- **并行**：否。
- **FR**：FR-REV-007、FR-CMP-001、FR-CMP-002。
- **AC**：AC28、AC29、AC31、AC37、AC51。
- **gate_cmd**：`mkdir -p apply/evidence && npx vitest run tests/stage-content-continuation.test.mjs core/__tests__/task-kernel-publish.test.mjs --pool=forks --maxWorkers=1 --minWorkers=1 > apply/evidence/T071-continuation-green.stdout 2> apply/evidence/T071-continuation-green.stderr`
- **expected_exit**：0
- **oracle**：旧 bytes/hash 不变；新 lineage 唯一；跨 task/revision、backfill、原地 mutation 和永久 bypass 失败。
- **evidence_path**：`apply/evidence/T071-continuation-green.stdout`

#### T072 — 61 FR / 53 AC / 5 问题 / 21 宪法覆盖

- **ID**：T072
- **动作**：从 canonical spec、tasks 和 acceptance evidence 逐项生成无范围缩写的覆盖报告。
- **精确文件**：`specs/stage-content-contracts/spec.md`、`specs/stage-content-contracts/plan.md`、`specs/stage-content-contracts/tasks.md`、`constitution-checklist.md`、`apply/evidence/stage-content-coverage.json`。
- **输入**：Phase 1 至 Phase 7 已通过 gate 的 canonical evidence refs，以及 T070、T071 的宿主独立与 continuation facts。
- **输出**：61/61 FR、53/53 AC、5/5 原问题、21/21 宪法报告。
- **依赖**：T070、T071。
- **并行**：否。
- **FR**：FR-CMP-001。
- **AC**：AC28、AC29、AC31、AC37。
- **gate_cmd**：`mkdir -p apply/evidence && node tools/cli/validate-field-mapping.mjs specs/stage-content-contracts/spec.md specs/stage-content-contracts/plan.md specs/stage-content-contracts/tasks.md > apply/evidence/T072-coverage.stdout 2> apply/evidence/T072-coverage.stderr`
- **expected_exit**：0
- **oracle**：无 orphan FR、AC、task；每项有真实 evidence ref；未知项明确为 unknown 而非 pass。
- **evidence_path**：`apply/evidence/T072-coverage.stdout`、`apply/evidence/stage-content-coverage.json`

#### T073 — 在原 task 创建 continuation

- **ID**：T073
- **动作**：读取原 `review-foundation-baseline` 旧失败 lineage，创建新 make-decision revision/attempt 起点。
- **精确文件**：`apply/inputs/review-foundation-baseline-continuation.json`、`workflowhub/review-foundation-baseline canonical task records`。
- **输入**：T071 CLI、T072 coverage、旧 attempt/review refs/hashes。
- **输出**：原 task 的 append-only continuation ref/hash，以及只含 continuation ref 的 `apply/evidence/T073-continuation.ref`。
- **依赖**：T072。
- **并行**：否。
- **FR**：FR-CMP-002、FR-CMP-003。
- **AC**：AC28、AC29、AC31、AC32。
- **gate_cmd**：`mkdir -p apply/evidence apply/inputs && node scripts/stage-runtime.mjs continue-stage --stage=make-decision --project=workflowhub --task=review-foundation-baseline --input=apply/inputs/review-foundation-baseline-continuation.json > apply/evidence/T073-continuation.stdout 2> apply/evidence/T073-continuation.stderr && node --input-type=module -e "import fs from 'node:fs'; const value=JSON.parse(fs.readFileSync('apply/evidence/T073-continuation.stdout','utf8')); if(typeof value.continuation_ref!=='string'||value.continuation_ref.length===0) process.exit(1); fs.writeFileSync('apply/evidence/T073-continuation.ref',value.continuation_ref+'\\n');"`
- **expected_exit**：0
- **oracle**：输出新 continuation ref/hash；旧 attempt/review bytes/hash 未变；没有另建替代 task。
- **evidence_path**：`apply/evidence/T073-continuation.stdout`、`apply/evidence/T073-continuation.ref`

#### T074 — WorkflowHub host 真实生产处理组 1 replay

- **ID**：T074
- **动作**：`producer_action`：WorkflowHub host 使用 T073 continuation ref，真实调用 `workflows/make-decision/SKILL.md`；在同一 host-visible 会话逐次完成三轮 talk、完整 grill、独立 decision Markdown、direction review、detail review、coverage audit 和最终确认。每次 ask 后必须真实暂停并等待用户回复；`collect-task-facts` 或任何脚本只能在生产完成后读取事实，不能模拟回复、选择或 producer action。
- **精确文件**：`workflows/make-decision/SKILL.md`、`workflowhub/review-foundation-baseline canonical task records`。
- **输入**：T073 continuation ref、处理组 1 原始需求、同一 host-visible 会话的真实用户回复。
- **输出**：新 revision 下同一 run 的三轮 interaction refs、grill ref、decision Markdown ref/hash、direction/detail review refs、coverage audit ref、最终确认 ref、audit ref 和 attempt ref。
- **依赖**：T073。
- **并行**：否。
- **FR**：FR-CMP-003。
- **AC**：AC29、AC31、AC32。
- **gate_cmd**：`mkdir -p apply/evidence && node tools/cli/collect-task-facts.mjs --project=workflowhub --task=review-foundation-baseline > apply/evidence/T074-replay-facts.stdout 2> apply/evidence/T074-replay-facts.stderr`
- **expected_exit**：0
- **oracle**：该命令只验证 WorkflowHub host 已生产一个新的 make-decision run，且该 run 明确绑定 T073 continuation ref；命令成功不证明完整 replay，也不执行或模拟任何 ask/reply。
- **evidence_path**：`apply/evidence/T074-replay-facts.stdout`、T074 host-visible 会话 refs、原 task canonical refs

#### T075 — 同一 run/snapshot replay facts 验证

- **ID**：T075
- **动作**：新增窄 validator，读取 TaskKernel 认证 records，验证 T073 continuation 与 T074 新 run 的绑定；验证三轮 talk、grill、decision Markdown、direction/detail review、coverage audit、最终确认、audit 和 attempt 全部属于同一 run/snapshot，顺序完整且无跨 run/ref/hash/tree 复用。
- **精确文件**：`scripts/validate-stage-replay.mjs`、`tests/stage-content-continuation.test.mjs`。
- **输入**：T073 continuation ref、T074 canonical refs 和 host-visible ask/reply bindings。
- **输出**：`apply/evidence/T075-replay-validation.stdout`、`apply/evidence/T075-replay-validation.stderr`。
- **依赖**：T074。
- **并行**：否。
- **FR**：FR-CMP-003。
- **AC**：AC29、AC31、AC32。
- **gate_cmd**：`mkdir -p apply/evidence && npx vitest run tests/stage-content-continuation.test.mjs --pool=forks --maxWorkers=1 --minWorkers=1 > apply/evidence/T075-replay-validator-tests.stdout 2> apply/evidence/T075-replay-validator-tests.stderr && node scripts/validate-stage-replay.mjs --project=workflowhub --task=review-foundation-baseline --continuation-ref=apply/evidence/T073-continuation.ref > apply/evidence/T075-replay-validation.stdout 2> apply/evidence/T075-replay-validation.stderr`
- **expected_exit**：0
- **oracle**：validator 只在 continuation、run、snapshot、全部 refs/hashes、三轮顺序、grill、两路 review、coverage 和最终确认全部一致时返回 0；缺失、乱序、跨 run、跨 snapshot 或仅有 facts collector 输出时返回非零。
- **evidence_path**：`apply/evidence/T075-replay-validator-tests.stdout`、`apply/evidence/T075-replay-validation.stdout`、`apply/evidence/T075-replay-validation.stderr`

#### T076 — 独立 verify-code 与用户最终确认

- **ID**：T076
- **动作**：由 verify-code 独立核对实现、窄测试、正式 build-code reviews、覆盖和 T075 replay validation；只在风险证明必要时提议一次广覆盖。
- **精确文件**：`workflows/verify-code/SKILL.md`、`apply/evidence/stage-content-coverage.json`、`apply/evidence/T075-replay-validator-tests.stdout`、`apply/evidence/T075-replay-validation.stdout`。
- **输入**：完整 build-code accepted result、T075 replay validation。
- **输出**：独立 verify-code result 和用户最终确认卡。
- **依赖**：T075。
- **并行**：否。
- **FR**：FR-CMP-003。
- **AC**：AC29、AC31、AC32。
- **gate_cmd**：`mkdir -p apply/evidence && npx vitest run tests/stage-content-evidence.test.mjs tests/stage-content-publication.test.mjs tests/stage-interaction-contract.test.mjs tests/stage-decision-contract.test.mjs tests/stage-plan-task-contract.test.mjs tests/stage-review-cost-policy.test.mjs tests/stage-risk-acceptance.test.mjs tests/stage-completion-facts.test.mjs tests/stage-content-host-independence.test.mjs tests/stage-content-continuation.test.mjs --pool=forks --maxWorkers=1 --minWorkers=1 > apply/evidence/T076-risk-scoped-verification.stdout 2> apply/evidence/T076-risk-scoped-verification.stderr`
- **expected_exit**：0
- **oracle**：所有直接相关窄测试通过；独立 review/verify 无假绿；61/53/5/21 覆盖和 T075 的真实 replay validation 均有证据；用户看到已知、未知、风险和效果。
- **evidence_path**：`apply/evidence/T076-risk-scoped-verification.stdout` 和 verify-code canonical refs

### Verify
T070–T076 为 0；T074 必须由 WorkflowHub host 在同一 host-visible 会话真实生产，不接受 collect-task-facts 或脚本模拟；T075 必须验证同一 run/snapshot 的全部 replay facts。

### Knowledge
continuation 是新执行 lineage，不是“重新确认上游文档”入口。

### STOP
需要修改旧记录、猜 task、创建替代 task、执行不可逆外部动作或只能给 replay 计划。

## 依赖 DAG

```text
T001 → T002 → T003
T003 → T010
T003 → T011 → T012 → T013
T003 → T020 → T021 → T022 → T023 → T024
T010 + T023 → T030 → T031 → T032
T023 → T033 → T034
T031 + T034 → T035
T032 + T035 → T036
T023 → T040
T040 → T041
T040 → T043
T041 → T042
T003 + T042 + T043 → T044
T003 + T044 → T050 → T051
T013 + T051 → T052 → T053 → T054
T036 + T054 → T055
T023 → T060 → T061 → T062
T055 + T062 → T063
T036 + T044 + T055 + T063 → T070
T051 + T070 → T071 → T072 → T073 → T074 → T075 → T076
```

## Phase Gate 总结

- Phase 1：31/31 hash + review authority 窄回归。
- Phase 2：1.3.0、21 条、五条映射 + 独立 Phase review。
- Phase 3：typed evidence/audit/publication 正反例。
- Phase 4：真实 interaction、ambiguity、decision/omission/correction。
- Phase 5：plan/tasks contract + engineering lens + 有限 review 文案。
- Phase 6：五阶段 cost/serious/risk。
- Phase 7：双视图 + metrics。
- Phase 8：中性宿主 + 逐项覆盖 + 原 task 真实 replay + verify-code。

本清单没有默认全量测试任务；T076 仍是 10 个直接相关测试文件组成的风险驱动验证集。

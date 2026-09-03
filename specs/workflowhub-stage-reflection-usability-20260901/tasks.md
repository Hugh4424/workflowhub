# 任务清单：stage-reflection 复盘器可用性与信息质量改造

- **Input**：`specs/workflowhub-stage-reflection-usability-20260901/decision-log.md`、`specs/workflowhub-stage-reflection-usability-20260901/spec.md`、`specs/workflowhub-stage-reflection-usability-20260901/plan.md`；当前 SHA-256 见外部 manifest `quality/evidence/material-hashes-20260901.json`（早期 hash 仅保留为历史 provenance）
- **Template version**：`plan-task.v3`
- **Current-material audit**：当前 SHA-256 见外部 manifest `quality/evidence/material-hashes-20260901.json`；仅记录材料 provenance，不是 build-code 或验收授权。

## Phase P0 — 基线同步与前置核验

### Goal

核验任务分支已同步 main 的 M16 基线，登记 M16 任务状态与实际消费面，决定 P6 排期。

### Files

- **NEW**：无
- **MODIFY**：无（git 操作）
- **DO NOT TOUCH**：四份材料语义

### Tasks

#### T001 — 基线同步与 M16 状态核验

- **ID**：T001
- **Phase**：Phase P0
- **goal**：核验当前任务分支已与 main 的 M16 基线对齐，记录 merge provenance、M16 归档质量边界与可排期事实；不重复执行已经发生的 fast-forward。
- **design_state**：ready
- **versioned_refs**：decision-log@ec63835f…、spec@43768b23…、plan@bbbf4dce…（见 Input 行完整哈希）
- **source_refs / decision_refs**：RISK-002、OPEN-01 → FR-M16-001 排期前置 / AC-M16-001 可行性
- **输入**：任务分支原始基线 `eeb9dfa12`、已观察的 main/M16 provenance、M16 归档任务追踪目录状态
- **依赖**：none
- **并行**：否 — 后续所有 Phase 依赖已核验基线
- **FR**：FR-M16-001（排期前置）
- **AC**：AC-M16-001（可行性核验部分）
- **动作**：只读核对并记录 `eeb9dfa12 → cdafb4446（M16 merge）→ fff255c78（归档 M16 材料）`；确认当前任务分支与 main 同指 `fff255c78`，登记实际 M16 消费面；读取归档 M16 T001–T009=`completed`、T010/AC-GOV-002=`incomplete/inconclusive`。不重复 merge，不修改 M16 归档材料。
- **精确文件**：无计划生产文件改动；事实记录追加到本卡执行区
- **boundary**：files: 无计划改动；只读 provenance/代码/归档状态；不把 merge 或已有 focused/browser 事实升格为 M16 全质量通过
- **输出**：基线对齐事实 + M16 实际消费面清单 + 独立质量 incomplete 事实
- **Knowledge**：当前 main 已含 M16 生产实现；`fff255c78` 仅归档材料；现行消费链仍只编译 stage-reflection.v1，未实现本任务要求的 v2/availability/historical replay mixed-input 语义
- **verification_role**：evidence
- **paired_task**：none
- **gate_cmd**：`npm test && npm run check`（已合入当前基线后的回归；依赖可用时执行，依赖缺失按真实 exit 记录）
- **expected_exit**：0
- **oracle**：ORACLE-BASELINE — 已合入当前 main 基线后的全量测试应与基线一致（无新红）
- **evidence_path**：`quality/tests/stage-reflection-usability-p0-baseline/gate.json`
- **STOP**：merge 冲突涉及本任务将改文件且语义不明 → 停止并请用户核对
- **recovery**：不做 reset/abort；若后续发现基线漂移，另行按用户指示处理并保留当前未提交材料
- **task risk**：误把 merge 当 M16 完成 → P6 质量边界错误
- **test tier / test method**：simple — provenance/代码面核验 + 全量回归（依赖可用时）
- **scenarios / fixtures**：已对齐/发生漂移两路径；无 fixture
- **coverage limits**：不证明 M16 完成；不证明本任务 AC；测试依赖缺失时不宣称通过

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：未改生产文件；当前任务 worktree 已观察到 `git merge --no-edit main` 的 fast-forward 结果，HEAD 与 main 同为 `fff255c78e1ae105347d60fcbc307ffa0da03840`。M16 实际消费面已登记：`runtime/evidence/workflow-evolution.mjs`、`runtime/schemas/workflow-evolution.v1.json`、`tools/cli/build-reflection-page.mjs`、`tools/cli/build-reflection-page-template.html`、`tools/cli/derive-consumption-edges.mjs` 及对应 candidates/page/governance/e2e contracts。T001 的完成范围仅为基线/provenance/消费面事实核验；npm test/npm run check 因依赖缺失仍无通过证据，不能外推为本任务或 M16 质量通过。
- **executed_commands**：`git status --short --branch`、`git rev-list --left-right --count HEAD...main`、`git merge --no-edit main`（fast-forward，无冲突）；`npm test` exit=127（`vitest: command not found`，0 tests）；`npm run check` exit=127（`markdownlint-cli2: command not found`，0 checks）。
- **evidence_refs**：当前 M16 归档 `specs/archive/workflowhub-m16-evolution-20260831/tasks.md:580-616`；基线命令结果为本轮执行事实，尚未写入外部 quality evidence。
- **covered_ac**：仅 AC-M16-001 前置可行性核验部分；不覆盖 M16 quality acceptance。
- **review_fact**：独立只读审计确认 M16 T001–T009=`completed`，T010/AC-GOV-002=`incomplete/inconclusive`；main 合入不等于 M16 全质量闭合。
- **completed_at**：2026-09-03（T001 有界事实核验完成；基线测试因依赖缺失不构成通过证据）
- **执行事实**：外部 fast-forward 已发生，不重复 merge；`eeb9dfa12 → cdafb4446（M16 merge）→ fff255c78（归档材料）`。本事实不改变 M16 归档任务 status，也不将测试依赖缺失改写为通过。

## Phase P1 — schema 与验证器

### Goal

五态词汇（v1 枚举扩 + 可用性事实 $defs）、v2 三件套 schema、验证器完整性规则，带正负例 fixture。

### Files

- **NEW**：`runtime/schemas/stage-reflection.v2.json`、`tests/fixtures/stage-reflection/v2-valid.json`、`tests/fixtures/stage-reflection/v2-invalid-missing-trio.json`、`tests/fixtures/stage-reflection/v1-legacy-record.json`
- **MODIFY**：`runtime/schemas/stage-reflection.v1.json`（status 枚举 + $defs.availability_fact）、`tools/cli/validate-stage-reflection.mjs`（完整性规则）、`tests/contract/validate-stage-reflection.test.mjs`（或既有对应测试）
- **DO NOT TOUCH**：发布链、页面、M16、stage-runner

### Tasks

#### T101 — RED：schema 与验证器契约

- **ID**：T101
- **Phase**：Phase P1
- **goal**：用失败测试固定五态枚举、可用性事实结构、v2 三件套与验证器完整性规则。
- **design_state**：ready
- **versioned_refs**：同 Input 行
- **source_refs / decision_refs**：D-002/D-004/D-005、FND-D06/FND-DD07/FND-S01/S02/S03 → FR-STATE-001、FR-QUALITY-002/003 / AC-STATE-001、AC-QUALITY-002/003
- **输入**：spec §7.1 字段级契约、既有 v1 schema 与验证器
- **依赖**：T001
- **并行**：否 — P1 首个 RED
- **FR**：FR-STATE-001、FR-QUALITY-002、FR-QUALITY-003
- **AC**：AC-STATE-001、AC-QUALITY-002、AC-QUALITY-003
- **动作**：写契约测试——①v1 接受 unavailable/not_scheduled（记录态前向兼容）且旧三态记录 fixture 回归；②availability_fact $defs 字段集（stage/state/原因码/时间戳/任务身份）正负例；③v2 三件套正例（五栏状态+证据引用、identity 快照、source_completeness）与负例（缺三件套、引用悬空未标注）；④验证器完整性规则：六类区块缺失→显式 annotation；悬空引用→degraded（既有）；移除候选双硬信号门槛不变（既有负例回归）
- **精确文件**：`tests/contract/validate-stage-reflection.test.mjs`、`tests/fixtures/stage-reflection/v2-valid.json`、`tests/fixtures/stage-reflection/v2-invalid-missing-trio.json`、`tests/fixtures/stage-reflection/v1-legacy-record.json`
- **boundary**：files: 上列四个测试/fixture 文件；symbols: 测试断言区；不改生产代码
- **输出**：稳定 RED（因目标 schema/规则缺失）
- **Knowledge**：qualityRefExists 把 #fragment 当路径一部分（F-015）；既有负例（悬空降级/双硬信号）不得弱化
- **verification_role**：RED
- **paired_task**：T102
- **gate_cmd**：`npx vitest run tests/contract/validate-stage-reflection.test.mjs`
- **expected_exit**：1
- **oracle**：ORACLE-SCHEMA-V2 — 仅因五态/v2/完整性规则缺失失败；既有用例仍通过
- **evidence_path**：`quality/tests/stage-reflection-usability-p1-schema/gate.json`
- **STOP**：为让测试通过而弱化既有负例或旧记录语义 → 停止
- **recovery**：修正 fixture/断言；方向问题退回 spec
- **task risk**：把"枚举扩展"误实现为破坏旧记录校验
- **test tier / test method**：feature — backend-testing（schema+验证器契约）
- **scenarios / fixtures**：五态正例；旧记录回归；v2 正负例；完整性负例；fixture 如上
- **coverage limits**：不证明发布链与页面；只证明 schema/验证器语义

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：新增五态/availability/v2 fixture 与 RED 契约断言；既有 8 个 legacy 回归仍在 RED 阶段通过。
- **executed_commands**：`npx vitest run tests/contract/validate-stage-reflection.test.mjs`（RED，exit 1；13 tests，5 failures，8 legacy tests passed；记录于 progress.md）。
- **evidence_refs**：`quality/tests/stage-reflection-usability-p1-schema/gate.json`、`progress.md`
- **covered_ac**：`AC-STATE-001`、`AC-QUALITY-002`、`AC-QUALITY-003`（RED 契约）
- **review_fact**：P1 独立审查传输在产生语义结果前以 exit 143 结束，状态 `unavailable`；不宣称 review pass。
- **completed_at**：2026-09-03
- **执行事实**：RED 失败仅覆盖目标 schema/完整性缺失；未弱化旧悬空引用降级与 remove_candidate 双硬信号门槛。

#### T102 — GREEN：schema 与验证器实现

- **ID**：T102
- **Phase**：Phase P1
- **goal**：实现 v1 枚举扩展、availability $defs、v2 schema 与验证器完整性规则，使 T101 通过。
- **design_state**：ready
- **versioned_refs**：同 Input 行
- **source_refs / decision_refs**：同 T101
- **输入**：T101 RED
- **依赖**：T101
- **并行**：否 — RED/GREEN 串行
- **FR/AC**：同 T101
- **动作**：v1 schema status 枚举 += unavailable/not_scheduled + $defs.availability_fact；新建 v2 schema（三件套，引用 v1 安全引用模式）；验证器加完整性规则（六类区块/三件套缺失→显式 annotation；不改动既有降级与移除门槛逻辑）
- **精确文件**：`runtime/schemas/stage-reflection.v1.json`、`runtime/schemas/stage-reflection.v2.json`、`tools/cli/validate-stage-reflection.mjs`
- **boundary**：files: 上列三个生产文件；symbols: 枚举/$defs/完整性规则区；既有规则行不改义
- **输出**：T101 全绿
- **Knowledge**：v1 旧记录必须原样通过；v2 独立文件不动 v1 语义
- **verification_role**：GREEN
- **paired_task**：T101
- **gate_cmd**：`npx vitest run tests/contract/validate-stage-reflection.test.mjs`
- **expected_exit**：0
- **oracle**：ORACLE-SCHEMA-V2（同 T101，转绿且负例保留）
- **evidence_path**：`quality/tests/stage-reflection-usability-p1-schema/gate.json`
- **STOP**：需要改既有降级/门槛语义才能转绿 → 停止退回 spec
- **recovery**：还原三文件重来
- **task risk**：验证器新规则误伤既有合法记录
- **test tier / test method**：feature — backend-testing
- **scenarios / fixtures**：同 T101
- **coverage limits**：同 T101

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：扩展 `runtime/schemas/stage-reflection.v1.json` 五态与 availability `$defs`；新增独立 `runtime/schemas/stage-reflection.v2.json`；在 `tools/cli/validate-stage-reflection.mjs` 增加六类区块/三件套 completeness annotations；收紧 availability task identity；移除固定反射记录对 standalone availability fact 的错误强制依赖；验证器 CLI 保持只校验、不写回固定记录。
- **executed_commands**：`npx vitest run tests/contract/validate-stage-reflection.test.mjs`（GREEN，exit 0，15/15）；`node --check tools/cli/validate-stage-reflection.mjs`（0）；v1/v2 JSON parse（0）；`git diff --check`（0）。
- **evidence_refs**：`quality/tests/stage-reflection-usability-p1-schema/gate.json`
- **covered_ac**：`AC-STATE-001`、`AC-QUALITY-002`、`AC-QUALITY-003`
- **review_fact**：独立审查传输在产生语义结果前以 exit 143 结束，状态 `unavailable`；相邻回归发现 1 个 P2 executor_absent 输出缺口，已转入 P2，不归因于 P1。
- **completed_at**：2026-09-03
- **执行事实**：P1 定向 gate 15/15；保留既有 evidence downgrade/remove_candidate 逻辑，验证器默认不改写输入。Ajv 仅输出未安装 formats plugin 的 `date-time` warning。

## Phase P2 — 执行闭环与调度语义

### Goal

reflect 闭环 + runner 两处最小改动 + 状态转移矩阵 + 失败恢复矩阵。

### Files

- **NEW**：`runtime/stage/stage-reflect.mjs`、`tests/contract/stage-reflect.test.mjs`、`tests/fixtures/stage-reflect/judgment-valid.json`、`tests/fixtures/stage-reflect/judgment-invalid.json`、`tests/fixtures/stage-reflect/transfer-matrix.json`
- **MODIFY**：`tools/cli/stage-runtime.mjs`（私有命令 reflect + 公共路由 run:reflect）、`runtime/stage/stage-runner.mjs`（两处最小改动）、`docs/architecture/move-map.json`（add/modify 登记）、`tests/contract/stage-runner-reflection.test.mjs`（或既有对应测试）、`tests/e2e/stage-reflection-real-task.test.mjs`（无执行器路径语义更新）
- **DO NOT TOUCH**：RUNTIME_BEHAVIORS 七类、TaskKernel、页面、五阶段拓扑

### Tasks

#### T201 — RED：执行闭环与状态转移契约

- **ID**：T201
- **Phase**：Phase P2
- **goal**：用失败测试固定 reflect 闭环、状态转移矩阵五行、失败恢复矩阵五行与公共路由不越界。
- **design_state**：ready
- **versioned_refs**：同 Input 行
- **source_refs / decision_refs**：D-001/D-002、G-001、FND-D06/FND-S07、PFACT-001/003/008 → FR-EXEC-001/002/004、FR-STATE-002 / AC-EXEC-001/002/004、AC-STATE-002
- **输入**：spec §5 EXEC/STATE 域、§7.1 判断输入契约、状态转移表、失败恢复矩阵；stage-runner/stage-runtime 锚点
- **依赖**：T102
- **并行**：否
- **FR**：FR-EXEC-001、FR-EXEC-002、FR-EXEC-004、FR-STATE-002
- **AC**：AC-EXEC-001、AC-EXEC-002、AC-EXEC-004、AC-STATE-002
- **动作**：写契约测试——①合法判断 JSON → reflect → 固定路径发布成功（字节内容寻址一致）+lessons 合并完成；②非法输入 → 拒绝+真实原因+零副作用，修正后可重试；③同字节重复 → 幂等；④异字节冲突 → 明确报错不覆盖；⑤发布成功+合并失败 → 记录 degraded+合并失败事实+lessons 无半成品；⑥发布失败 → lessons 不提交；⑦无执行器 run → 不发布失败记录+落 unavailable 可用性事实（executor_absent）+固定路径空闲；⑧preflight/身份/启动失败/中断路径 → not_scheduled 事实（对应原因码）；⑧b 阶段从未启动（同任务后续阶段有 outcome、本阶段三无）→ runner 不写、由投影派生规则承载（fixture 在 T401，runner 侧零改动）；⑨事后补记 → 固定路径真实记录覆盖派生态；⑩公共路由回归：`run --action=reflect` 可用且 RUNTIME_BEHAVIORS 仍七类（public-behavior-baseline 不越界）；⑪既有 e2e（注入 executor）语义不回归
- **精确文件**：`tests/contract/stage-reflect.test.mjs`、`tests/fixtures/stage-reflect/judgment-valid.json`、`tests/fixtures/stage-reflect/judgment-invalid.json`、`tests/fixtures/stage-reflect/transfer-matrix.json`、`tests/contract/stage-runner-reflection.test.mjs`、`tests/e2e/stage-reflection-real-task.test.mjs`
- **boundary**：files: 上列六个测试/fixture 文件；symbols: 断言区；tmpdir FS harness；不改生产代码
- **输出**：稳定 RED（目标模块/命令/改动缺失）
- **Knowledge**：createImmutable 同字节幂等/异字节 EEXIST；原子边界=validate→lessons 暂存→发布→提交；调度点 stage-runner.mjs:1655-1713；executor 注入 :2122-2123
- **verification_role**：RED
- **paired_task**：T202
- **gate_cmd**：`npx vitest run tests/contract/stage-reflect.test.mjs tests/contract/stage-runner-reflection.test.mjs tests/e2e/stage-reflection-real-task.test.mjs`
- **expected_exit**：1
- **oracle**：ORACLE-REFLECT-CHAIN — 仅因目标行为缺失失败；既有用例（含 e2e 注入路径）仍通过
- **evidence_path**：`quality/tests/stage-reflection-usability-p2-reflect/gate.json`
- **STOP**：需要第八公共行为/改阶段状态机/弱化不可变语义 → 停止退回 spec
- **recovery**：修正测试/fixture；runner 语义争议退回 spec
- **task risk**：把 run 的"不发布"误实现为"发布空记录"占路径
- **test tier / test method**：feature（高端）— backend-testing 幂等/并发/持久化维度 + TDD；tmpdir FS harness + 冲突/崩溃 fixture
- **scenarios / fixtures**：转移矩阵五行 + 恢复矩阵五行逐行 fixture；interrupted-same-task-recovery 模式
- **coverage limits**：单机文件系统；不证明真实宿主合规（P7 覆盖）

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：新增 `runtime/stage/stage-reflect.mjs`，补齐合法/非法/重复/冲突/发布失败/合并失败/恢复失败的事务契约测试，并固定 executor_absent、not_scheduled、注入 executor 的 runner 语义。
- **executed_commands**：P2 精确 gate `npx vitest run tests/contract/stage-reflect.test.mjs tests/contract/stage-runner-reflection.test.mjs tests/e2e/stage-reflection-real-task.test.mjs`（GREEN，exit 0，3 files/21 tests）；补充 runner 回归 29/29；官方无 packet 集成用例 1 passed/47 skipped；语法、move-map JSON 与 `git diff --check` 均 exit 0。RED 原始精确 gate 未在本次续接中保留完整 transcript，已按 partial 记录，不伪造。
- **evidence_refs**：`quality/tests/stage-reflection-usability-p2-reflect/gate.json`
- **covered_ac**：`AC-EXEC-001`、`AC-EXEC-002`、`AC-EXEC-004`、`AC-STATE-002`
- **review_fact**：独立审查 broker 以 `BROKER_EXIT_NONZERO`/exit 143 结束且无 provider 终审结果，状态 `unavailable`；不宣称审查通过。
- **completed_at**：2026-09-03
- **执行事实**：shared `runStageReflection` 已承接 scheduled runner 与 CLI reflect；失败判断保留原始 `status/error`；恢复/发布失败在锁内做 CAS 回滚并写 durable failure fact；普通 handler error 仍可反射，startup/identity/interrupted/preflight 归 `not_scheduled`。

#### T202 — GREEN：执行闭环与 runner 改动实现

- **ID**：T202
- **Phase**：Phase P2
- **goal**：实现 stage-reflect 深模块、reflect 私有命令与 run:reflect 路由、runner 两处改动、move-map 登记，使 T201 通过。
- **design_state**：ready
- **versioned_refs**：同 Input 行
- **source_refs / decision_refs**：同 T201
- **输入**：T201 RED
- **依赖**：T201
- **并行**：否
- **FR/AC**：同 T201
- **动作**：新建 `runtime/stage/stage-reflect.mjs`（输入校验→复用 runStageEndReflection 抽取的共享函数→原子边界）；`stage-runtime.mjs` 加私有命令 reflect（parseArgs 白名单）+ 公共路由 `"run:reflect": "reflect"`；`stage-runner.mjs` 两处改动（runStageEndReflection 及其调度/发布调用点；stage-runtime.mjs 的 stageReflectionPublication 只是 executor 供给包装、不是改动点）——①无 executor 时不发布失败记录、改落 unavailable 可用性事实（executor_absent，写 evidence 区不占固定路径）；②preflight/身份/启动失败与中断路径落 not_scheduled 可用性事实；move-map 登记新文件（add：consumer=reflect 命令/页面与 M16 投影，owner=本任务，删除条件=机制退役）
- **精确文件**：`runtime/stage/stage-reflect.mjs`、`tools/cli/stage-runtime.mjs`、`runtime/stage/stage-runner.mjs`、`docs/architecture/move-map.json`
- **boundary**：files: 上列四个；symbols: stage-runner 仅两处改动点（调度/发布语义），阶段状态机/步骤序列不动；stage-runtime 仅命令白名单+路由表
- **输出**：T201 全绿；runner diff 恰好两处
- **Knowledge**：共享函数抽取不得改变 runStageEndReflection 既有行为（e2e 注入路径回归绿证明）
- **verification_role**：GREEN
- **paired_task**：T201
- **gate_cmd**：同 T201
- **expected_exit**：0
- **oracle**：ORACLE-REFLECT-CHAIN（转绿且负例/回归保留）
- **evidence_path**：`quality/tests/stage-reflection-usability-p2-reflect/gate.json`
- **STOP**：runner 出现第三处改动或 e2e 注入路径回归 → 停止
- **recovery**：还原四文件重来
- **task risk**：共享函数抽取引入行为漂移
- **test tier / test method**：feature（高端）— 同 T201
- **scenarios / fixtures**：同 T201
- **coverage limits**：同 T201

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：实现 `stage-reflect.mjs` 反射事务、`run --action=reflect` 私有实现与公共 run 路由、runner 可用性/未调度事实，并完成 move-map 登记；同步修正既有 stage-end 事务断言以覆盖真实 producer-consumer seam。
- **executed_commands**：`npx vitest run tests/contract/stage-reflect.test.mjs tests/contract/stage-runner-reflection.test.mjs tests/e2e/stage-reflection-real-task.test.mjs` exit 0（21/21）；`npx vitest run tests/contract/stage-reflect.test.mjs tests/contract/stage-runner-reflection.test.mjs tests/contract/stage-runner-on-stage-end.test.mjs` exit 0（29/29）；语法、JSON 与 diff 校验 exit 0。
- **evidence_refs**：`quality/tests/stage-reflection-usability-p2-reflect/gate.json`
- **covered_ac**：`AC-EXEC-001`、`AC-EXEC-002`、`AC-EXEC-004`、`AC-STATE-002`
- **review_fact**：独立审查结果 `unavailable`（broker exit 143，无语义 findings）；P2 不能据此宣称独立审查 green。
- **completed_at**：2026-09-03
- **执行事实**：未增加第八类公共行为；无 executor 仅写 evidence 区 availability fact，不占固定反射路径；无固定 record 时保留 `executor_absent`/`not_scheduled` 的真实原因。

## Phase P3 — 技能与文档

### Goal

复盘技能重写 + 五份工作流与标准流程文档补阶段末指令。

### Files

- **NEW**：无
- **MODIFY**：`skills/stage-reflection/SKILL.md`、`workflows/make-decision/SKILL.md`、`workflows/build-spec/SKILL.md`、`workflows/build-plan/SKILL.md`、`workflows/build-code/SKILL.md`、`workflows/verify-code/SKILL.md`、`docs/standard-workflow.md`、`tests/contract/stage-reflection-skill-contract.test.mjs`
- **DO NOT TOUCH**：steps.json 拓扑、skill-deps.yaml 依赖声明

### Tasks

#### T301 — 技能重写与五处指令

- **ID**：T301
- **Phase**：Phase P3
- **goal**：SKILL.md 按六类问题结构化输出重写（机器链描述与实际一致）；五份工作流+标准流程文档各补一句阶段末复盘执行指令。
- **design_state**：ready
- **versioned_refs**：同 Input 行
- **source_refs / decision_refs**：D-001/D-004、FND-D08/FND-D11、PFACT-007 → FR-EXEC-003、FR-QUALITY-001 / AC-EXEC-003、AC-QUALITY-001
- **输入**：spec §5 QUALITY 域、§7.1 契约、reflect 实际行为（T202 完成后）
- **依赖**：T202
- **并行**：否（指令必须描述真实行为）
- **FR**：FR-EXEC-003、FR-QUALITY-001
- **AC**：AC-EXEC-003、AC-QUALITY-001
- **动作**：重写 stage-reflection SKILL.md（六类问题结构化区块、判断 JSON 契约引用、消费边由验证器自动派生的真实描述、未知显式标注规则）；五份 workflow SKILL.md 与 standard-workflow.md 各加一句阶段末指令（"阶段结束时主会话按 stage-reflection 技能产出判断并调用 run --action=reflect"）；技能契约测试断言关键句与命令一致性
- **精确文件**：`skills/stage-reflection/SKILL.md`、五份 `workflows/*/SKILL.md`、`docs/standard-workflow.md`、`tests/contract/stage-reflection-skill-contract.test.mjs`
- **boundary**：files: 上列八个；symbols: 文档段落；steps.json/依赖声明不动
- **输出**：契约测试绿；人工核对指令与实际命令行为一致
- **Knowledge**：F-009 漂移教训——文档必须描述机器真实行为
- **verification_role**：GREEN（文档契约）
- **paired_task**：none（文档类 RED 由契约测试缺失断言先行体现，随本卡一并提交）
- **gate_cmd**：`npx vitest run tests/contract/stage-reflection-skill-contract.test.mjs`
- **expected_exit**：0
- **oracle**：ORACLE-SKILL-DOCS — 关键句存在且与 reflect 命令行为一致；漂移断言（旧错误描述）不再通过
- **evidence_path**：`quality/tests/stage-reflection-usability-p3-docs/gate.json`
- **STOP**：技能需要机器不支持的能力 → 停止退回 spec
- **recovery**：还原文档改动
- **task risk**：指令措辞与实际命令不一致（新漂移）
- **test tier / test method**：simple — 纯文档 + 钉文档契约测试
- **scenarios / fixtures**：六类区块样例判断 JSON 被 reflect 接受（P7 真机验证覆盖）
- **coverage limits**：不证明会话合规（P7 覆盖）

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：新增五态页面 fixture 与可用性事实/从未启动/固定记录优先级契约测试，覆盖旧页面与 M16 只读回归。
- **executed_commands**：`npx vitest run tests/contract/build-reflection-page.test.mjs` exit 0，1 file/8 tests；HTML/静态安全断言同套通过，`node --check` 与 `git diff --check` exit 0。T401 RED transcript 在 dirty worktree 续接中不完整，receipt 按 partial 记录。
- **evidence_refs**：`quality/tests/stage-reflection-usability-p4-page/gate.json`
- **covered_ac**：`AC-STATE-003`
- **review_fact**：P4 独立审查待执行；当前不宣称 review green。
- **completed_at**：2026-09-03
- **执行事实**：测试固定 `not_scheduled` 不再回退为 unknown，并验证 availability fact 与 later-stage outcome 派生的页面状态。

## Phase P4 — 页面最小生效面

### Goal

not_scheduled 词表 + 契约测试同步 + 旧记录回归。

### Files

- **NEW**：`tests/fixtures/reflection-page/five-states.json`（五态 fixture）
- **MODIFY**：`tools/cli/build-reflection-page-template.html`（stateNames/stateLabel 补 not_scheduled）、`tests/contract/build-reflection-page.test.mjs`
- **DO NOT TOUCH**：投影器 mjs、M16 趋势区、任务视图其他字段

### Tasks

#### T401 — RED：页面五态断言

- **ID**：T401
- **Phase**：Phase P4
- **goal**：用失败测试固定五态徽章渲染与旧记录回归。
- **design_state**：ready
- **versioned_refs**：同 Input 行
- **source_refs / decision_refs**：D-006、R-101、FND-D07 → FR-STATE-003 / AC-STATE-003
- **输入**：Component Quality Map（plan）、模板 174/179 行现状
- **依赖**：T001
- **并行**：是 — 与 P1/P2 文件不相交
- **FR**：FR-STATE-003
- **AC**：AC-STATE-003
- **动作**：写页面契约测试——五态 fixture 渲染断言（not_scheduled 显示 not_scheduled 而非 unknown 兜底）；可用性事实派生断言（无记录+unavailable/not_scheduled 事实→对应徽章）；从未启动派生规则断言（同任务后续阶段有 outcome、本阶段三无→not_scheduled；无任何后续→unknown）；旧记录 fixture 回归；M16 趋势区既有断言不动
- **精确文件**：`tests/contract/build-reflection-page.test.mjs`、`tests/fixtures/reflection-page/five-states.json`、`tests/fixtures/reflection-page/availability-facts.json`（可用性事实+从未启动场景）
- **boundary**：files: 上列两个；symbols: 状态断言区
- **输出**：稳定 RED（not_scheduled 词表缺失）
- **Knowledge**：模板 unavailable 已有样式；not_scheduled 复用同类不新增 token
- **verification_role**：RED
- **paired_task**：T402
- **gate_cmd**：`npx vitest run tests/contract/build-reflection-page.test.mjs`
- **expected_exit**：1
- **oracle**：ORACLE-PAGE-FIVE-STATES — 仅因 not_scheduled 词表缺失失败；既有断言通过
- **evidence_path**：`quality/tests/stage-reflection-usability-p4-page/gate.json`
- **STOP**：需要动投影器或趋势区 → 停止退回 spec
- **recovery**：修正断言/fixture
- **task risk**：误改投影器透传逻辑
- **test tier / test method**：feature（低端）— frontend-testing 状态维度；静态模板免浏览器
- **scenarios / fixtures**：五态枚举渲染 fixture + 旧记录 fixture
- **coverage limits**：不做浏览器截图（词表级变更；P7 全链覆盖页面显示）

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：新增五态与 availability/never-started/fixed-precedence 契约 fixture/断言，覆盖旧页面与 M16 只读回归；T402 负责生产实现。
- **executed_commands**：T401 RED transcript 在 dirty worktree 续接中不完整；最终配对 gate `npx vitest run tests/contract/build-reflection-page.test.mjs` exit 0，8/8，具体 GREEN 事实见 T402 与 gate receipt。
- **evidence_refs**：`quality/tests/stage-reflection-usability-p4-page/gate.json`
- **covered_ac**：`AC-STATE-003`
- **review_fact**：最终 P4 独立审查状态 `partial`：antigravity/flash 无 findings；opencode/pax3.8 与 codex/luna 均 `PROVIDER_IDENTITY_INVALID`。不宣称 review green。
- **completed_at**：2026-09-03
- **执行事实**：测试覆盖 availability fact、固定记录优先级、后续有效 outcome 的 not_scheduled、无后续 outcome 的 unknown，以及未来/损坏 outcome 不参与推断。

#### T402 — GREEN：页面词表实现

- **ID**：T402
- **Phase**：Phase P4
- **goal**：模板词表补 not_scheduled，使 T401 通过。
- **design_state**：ready
- **versioned_refs**：同 Input 行
- **source_refs / decision_refs**：同 T401
- **输入**：T401 RED
- **依赖**：T401
- **并行**：否
- **FR/AC**：同 T401
- **动作**：stateNames Set 与 stateLabel 映射补 not_scheduled（复用既有徽章样式类）；`build-reflection-page.mjs` 新增可用性事实读取与派生（扫描 evidence 区可用性事实目录→按事实内容 (task_id,stage) 定位→派生优先级=固定路径记录 > 可用性事实 > 从未启动规则 > unknown；不改布局/视图/趋势区数据流）
- **精确文件**：`tools/cli/build-reflection-page-template.html`、`tools/cli/build-reflection-page.mjs`
- **boundary**：files: 模板+投影器两个文件；symbols: 模板 stateNames/stateLabel 两行区域 + 投影器新增派生读取函数；不动布局/组件/趋势区/既有数据装配语义
- **输出**：T401 全绿
- **Knowledge**：Component Quality Map 条目（extend-state-or-variant）已登记
- **verification_role**：GREEN
- **paired_task**：T401
- **gate_cmd**：同 T401
- **expected_exit**：0
- **oracle**：ORACLE-PAGE-FIVE-STATES（转绿且旧记录回归保留）
- **evidence_path**：`quality/tests/stage-reflection-usability-p4-page/gate.json`
- **STOP**：需要新增 CSS token/改布局 → 停止退回 spec
- **recovery**：还原模板改动
- **task risk**：词表与 schema 枚举不同步（测试已钉）
- **test tier / test method**：feature（低端）— 同 T401
- **scenarios / fixtures**：同 T401
- **coverage limits**：同 T401

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：模板复用既有 quiet badge 样式加入 `not_scheduled` 词表/标签；投影器只读扫描内容寻址 availability facts，按 `(task_id, stage)` 派生，并实现固定记录 > availability fact > 从未启动 > unknown 优先级；拒绝未来/损坏 outcome，汇总任务 failed/degraded/not_scheduled 状态；校验器 CLI 不写回；候选证据按钮接入受控 reference panel，切换任务时清理旧引用；未改 M16 判定语义或趋势区布局。
- **executed_commands**：`npx vitest run tests/contract/build-reflection-page.test.mjs` exit 0，8/8；stdout SHA-256 `66d646a7d391b6d1ce5f31645f5bd32d1984506af40223cce2c3473223018985`；stderr SHA-256 `19c4f062f43f40151d8b5d8582925c62087036728732bf1b5ce7bdd019b0da5e`；`node --check tools/cli/build-reflection-page.mjs`、HTML 静态断言与 `git diff --check` exit 0。
- **evidence_refs**：`quality/tests/stage-reflection-usability-p4-page/gate.json`
- **covered_ac**：`AC-STATE-003`
- **review_fact**：最终 P4 独立审查状态 `partial`：antigravity/flash 无 findings；opencode/pax3.8 与 codex/luna 均 `PROVIDER_IDENTITY_INVALID`。此前审查发现的时间边界、完整 fixture、任务汇总、只读验证器与证据交互问题已修复；不宣称 review green。
- **completed_at**：2026-09-03
- **执行事实**：非法/损坏/哈希不匹配或未来时间的 availability fact/outcome 不参与状态推断；固定反射记录仍优先，无后续有效 outcome 的缺失阶段保持 unknown；future/stale confirmation 不进入 live Evolution。

## Phase P5 — 一次性历史导入

### Goal

20 条教训转换落库（分项目）+ 证据文件落库 + 介入提取（20/20 凭证）+ severity 校准核验；转换器用后归档。

### Files

- **NEW**：`tools/cli/import-historical-reflection.mjs`、`tests/contract/import-historical-reflection.test.mjs`、`tests/fixtures/historical-import/sample-package/*`
- **MODIFY**：`docs/architecture/move-map.json`（add + 归档条件）
- **WRITE（仓外存储）**：`Projects/workflowhub/lessons/*.jsonl`、`Projects/paperbuilder/lessons/*.jsonl`（或离线标注）、`Projects/*/quality/evidence/historical-replay-20260901/transcript-index.jsonl`
- **DO NOT TOUCH**：正式任务目录、既有 lessons 读取逻辑

### Tasks

#### T501 — RED：导入转换器契约

- **ID**：T501
- **Phase**：Phase P5
- **goal**：用失败测试固定 §7.2 映射契约、幂等键、条目级原子回滚与分项目归属。
- **design_state**：ready
- **versioned_refs**：同 Input 行
- **source_refs / decision_refs**：D-003、G-002、FND-D01/FND-S04、PFACT-006 → FR-IMPORT-001/002/003 / AC-IMPORT-001/002/003
- **输入**：spec §7.2 映射契约 + 归属表；离线回填包目录（`/Users/Hugh/Downloads/workflowhub-stage-reflection-historical-backfill-20260901/`，实际为 transcript-index 1 个、historical-records 1 个、按 stage 分拆的 lessons 5 个 JSONL；报告 md 仅作来源上下文）。T501 首个动作=验证 manifest 所列文件存在并清点字节哈希，缺失即 STOP 如实报告，不重建数据。
- **依赖**：T102（验证器完整性规则）
- **并行**：是 — 与 P2/P3/P4 文件不相交
- **FR**：FR-IMPORT-001、FR-IMPORT-002、FR-IMPORT-003
- **AC**：AC-IMPORT-001、AC-IMPORT-002、AC-IMPORT-003
- **动作**：写契约测试——①record_kind→entry_kind 恒等改名；②source_refs 字符串→对象化；③unknown 任务身份保留+historical_replay=true 标注；④evidence_refs 去 fragment 指文件级；⑤全量预演过验证器（无悬空降级）；⑥幂等：重复导入同键不重复写；⑦坏行：单条失败→该条不落库+报告，已成功条目保留；⑧分项目归属按归属表
- **精确文件**：`tests/contract/import-historical-reflection.test.mjs`、`tests/fixtures/historical-import/sample-package/*`
- **boundary**：files: 上列测试/fixture；symbols: 断言区；不改生产代码
- **输出**：稳定 RED（转换器缺失）
- **Knowledge**：readLessonRows 的 entry_kind 严格枚举与 source.task_id 匹配合并（append-lesson-observation.mjs:107-144）
- **verification_role**：RED
- **paired_task**：T502
- **gate_cmd**：`npx vitest run tests/contract/import-historical-reflection.test.mjs`
- **expected_exit**：1
- **oracle**：ORACLE-HISTORICAL-IMPORT — 仅因转换器缺失失败
- **evidence_path**：`quality/tests/stage-reflection-usability-p5-import/gate.json`
- **STOP**：离线包缺失/损坏 → 停止并报告（不重建数据）
- **recovery**：修正 fixture；契约争议退回 spec
- **task risk**：把 unknown 任务身份"修复"成假身份（必须原样保留+标注）
- **test tier / test method**：feature — backend-testing 幂等/回滚/坏行维度；混合 JSONL fixture
- **scenarios / fixtures**：正常 20 条 / 坏行 / 重复执行 / 悬空引用 / 分项目混合
- **coverage limits**：severity 校准质量属判断性，走独立 review 不靠测试

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：新增混合 JSONL fixture 与导入契约测试；按恢复后的实际包结构固定 20 条来源、20 条历史记录、40 条 lessons 行、8 个项目/阶段目标。
- **executed_commands**：`node tools/cli/import-historical-reflection.mjs --input=/Users/Hugh/Downloads/workflowhub-stage-reflection-historical-backfill-20260901 --storage-root=/tmp/workflowhub-historical-import-check-3 --dry-run` exit 0；`npx vitest run tests/contract/import-historical-reflection.test.mjs` exit 0（4/4）。原始包由 2026-09-01 来源会话的精确 patch 字节恢复；未伪造 RED，首次缺包事实保留在 gate 中。
- **evidence_refs**：`quality/tests/stage-reflection-usability-p5-import/gate.json`；`quality/evidence/material-hashes-20260901.json`；原始来源会话日志路径记录于 `findings.md`。
- **covered_ac**：`AC-IMPORT-001`、`AC-IMPORT-002`、`AC-IMPORT-003`。
- **review_fact**：P5 独立 review 尚未完成；4/4 是契约测试事实，不升格为 review green。
- **completed_at**：2026-09-03
- **执行事实**：精确包路径是离线输入/暂存目录，不是运行时依赖；20 个 transcript 路径均为现存 regular file，unknown task_id 原样保留。

#### T502 — GREEN：导入转换器实现

- **ID**：T502
- **Phase**：Phase P5
- **goal**：实现一次性转换器（映射→预演→落库，幂等+条目级原子回滚），使 T501 通过。
- **design_state**：ready
- **versioned_refs**：同 Input 行
- **source_refs / decision_refs**：同 T501
- **输入**：T501 RED + 离线包实测结构
- **依赖**：T501
- **并行**：否
- **FR/AC**：同 T501
- **动作**：实现 `tools/cli/import-historical-reflection.mjs`（--input=<离线包路径> --storage-root=<Knowledge> --dry-run|--execute）；move-map 登记（add；consumer=本次导入一次性执行，owner=本任务，删除/归档条件=导入验收通过后归档）
- **精确文件**：`tools/cli/import-historical-reflection.mjs`、`docs/architecture/move-map.json`
- **boundary**：files: 上列两个；symbols: 一次性脚本；不进入公共行为面
- **输出**：T501 全绿；--dry-run 全量预演报告
- **Knowledge**：条目级原子边界；幂等键=项目+阶段+原行标识+内容哈希
- **verification_role**：GREEN
- **paired_task**：T501
- **gate_cmd**：同 T501
- **expected_exit**：0
- **oracle**：ORACLE-HISTORICAL-IMPORT（转绿且坏行/幂等负例保留）
- **evidence_path**：`quality/tests/stage-reflection-usability-p5-import/gate.json`
- **STOP**：转换需要改动正式 lessons 读取逻辑 → 停止退回 spec
- **recovery**：还原脚本；已落库条目按幂等键回滚
- **task risk**：预演通过但正式落库路径不同（dry-run 与 execute 共用同一写入函数消除）
- **test tier / test method**：feature — 同 T501
- **scenarios / fixtures**：同 T501
- **coverage limits**：同 T501

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：新增一次性 `tools/cli/import-historical-reflection.mjs`，并登记 move-map consumer、owner 与归档条件；未改正式 lessons 读取逻辑或公共行为面。
- **executed_commands**：`node --check tools/cli/import-historical-reflection.mjs` exit 0；`npx vitest run tests/contract/import-historical-reflection.test.mjs` exit 0（4/4）；真实包 dry-run exit 0（20 merged entries、40 formal rows、8 targets、errors=[]）。
- **evidence_refs**：`quality/tests/stage-reflection-usability-p5-import/gate.json`；`docs/architecture/move-map.json`。
- **covered_ac**：`AC-IMPORT-001`、`AC-IMPORT-002`、`AC-IMPORT-003`。
- **review_fact**：P5 独立 review 尚未完成；转换器测试已覆盖幂等、冲突拒绝、坏包前置拒绝与项目拆分。
- **completed_at**：2026-09-03
- **执行事实**：dry-run 与 execute 共用同一计划/写入路径；历史数据写入 `historical_replay` 标记与 file-level evidence refs，不要求正式任务目录存在。

#### T503 — 人工介入补录（20/20 提取凭证）

- **ID**：T503
- **Phase**：Phase P5
- **goal**：对 20 个历史会话补一轮人工介入提取（每会话一份提取凭证），并对 20 条记录逐条按规则做 severity 校准（产出 severity_reason 与依据，FND-P04 修复：判断性工作由主会话产出，独立 review 抽查而非替代产出）。
- **design_state**：ready
- **versioned_refs**：同 Input 行
- **source_refs / decision_refs**：D-003、T-009、FND-S05、PFACT-006 → FR-IMPORT-004 / AC-IMPORT-004
- **输入**：transcript-index.jsonl 的 20 个 transcript 路径（/Users/Hugh/.codex/sessions/...）
- **依赖**：none（可与 T501/T502 并行）
- **并行**：是
- **FR**：FR-IMPORT-004、FR-IMPORT-005
- **AC**：AC-IMPORT-004、AC-IMPORT-005
- **动作**：批量子代理（每会话一个或分组）读取会话 transcript，提取用户真实介入（纠正/补充/停止/重定向）与步骤锚点；产出 20 份提取凭证（{会话身份, 提取时间, 覆盖区间, 结果}）；"已检查且无介入"附锚点证据；不可见/失败显式标记低置信度+原因；结果写回离线包供 T504 转换（低置信度标注）。**severity 校准**：主会话对 20 条逐条按规则定级（occurrence_count≥2 或用户确认→high；单次→medium；纯提示/体验→low），每条写 severity_reason+出现次数证据（跨 20 条的重复模式统计），写回离线包供 T504；校准产出接受独立 review 抽查（不替代产出）
- **精确文件**：离线包 `quality/evidence/intervention-extraction/*.json`（20 份凭证）+ 更新 `quality/stage-reflection/historical-records.jsonl` 的 interventions 字段
- **boundary**：files: 仅离线包内提取产物；不改正式存储；不伪造介入
- **输出**：20/20 凭证 + 介入字段更新
- **Knowledge**：会话 transcript 可能超长/压缩——覆盖区间如实记录；LLM 分析低置信度标注
- **verification_role**：evidence
- **paired_task**：none
- **gate_cmd**：凭证清单核对（20/20）+ 抽样锚点核对（人工/脚本）
- **expected_exit**：0（全部凭证存在且格式合法）
- **oracle**：ORACLE-INTERVENTION-COVERAGE — 凭证 20/20；零介入条目有锚点证据；失败条目有显式标记
- **evidence_path**：`quality/tests/stage-reflection-usability-p5-intervention/gate.json`
- **STOP**：transcript 大面积不可见 → 停止并报告可见性事实，不编造
- **recovery**：缺失会话显式标记低置信度（诚实降级，不阻塞其余）
- **task risk**：把"无介入"当成"未检查"（凭证必须区分）
- **test tier / test method**：feature — 数据提取+凭证核对（severity/介入质量另走独立 review）
- **scenarios / fixtures**：20 会话混合（有介入/无介入/不可见）
- **coverage limits**：提取深度校正属 DE-004

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：写入 20/20 份 `historical-intervention-certificate.v1` 凭证，并更新 20 条 historical records 的 interventions、extraction_evidence、intervention_status 与 severity_reason；未改正式存储。
- **executed_commands**：20 个凭证逐文件 JSON 解析、20 个 transcript 行锚点范围核验、19 observed/1 none_observed 结果核验、20 条 severity=medium 规则核验均 exit 0。
- **evidence_refs**：`quality/tests/stage-reflection-usability-p5-intervention/gate.json`；`/Users/Hugh/Downloads/workflowhub-stage-reflection-historical-backfill-20260901/quality/evidence/intervention-extraction/`。
- **covered_ac**：`AC-IMPORT-004`、`AC-IMPORT-005` 的证据产出部分；低可见性/partial 元数据保持不变。
- **review_fact**：确定性覆盖核验与批量会话提取已完成；独立质量 review 尚未完成，不宣称人工判断 review green。
- **completed_at**：2026-09-03
- **执行事实**：20/20 凭证存在且引用范围均落在实际 transcript 行数内；单次且无该条用户确认的 20 条 judgment 按规则校准为 medium；未把 none_observed 改写为未检查。

#### T504 — 执行导入与 20/20 断言

- **ID**：T504
- **Phase**：Phase P5
- **goal**：正式执行导入（含 T503 介入结果），20/20 落库+证据文件落库+severity 校准核验，转换器归档。
- **design_state**：ready
- **versioned_refs**：同 Input 行
- **source_refs / decision_refs**：D-003、T-008、FND-S05 → FR-IMPORT-001~005 / AC-IMPORT-001~005
- **输入**：T502 转换器 + T503 介入结果 + 离线包
- **依赖**：T502、T503
- **并行**：否
- **FR**：FR-IMPORT-001~005
- **AC**：AC-IMPORT-001~005
- **动作**：--dry-run 全量预演（报告 20/20 可导入）→ --execute 正式落库（workflowhub lessons / paperbuilder lessons 或离线标注 / 证据索引文件落 evidence 区）→ 逐条核验：归属、引用无悬空、severity 校准理由、介入字段显式、historical_replay 标注 → 幂等重跑验证 → 转换器归档
- **精确文件**：仓外存储写入（Projects/*/lessons、Projects/*/quality/evidence/historical-replay-20260901/）
- **boundary**：files: 仓外存储限定路径；不动任何正式任务目录与仓内生产文件
- **输出**：20/20 落库 + 全部 AC-IMPORT 通过 + 归档事实
- **Knowledge**：落库后 M16 候选池立即可读（仅供参考档）
- **verification_role**：evidence
- **paired_task**：none
- **gate_cmd**：导入断言脚本（20/20 计数+归属+引用校验）
- **expected_exit**：0
- **oracle**：ORACLE-IMPORT-20OF20 — 计数/归属/引用/校准/标注五类断言全过
- **evidence_path**：`quality/tests/stage-reflection-usability-p5-import-exec/gate.json`
- **STOP**：任一条目归属不明或预演失败 → 停止，不部分落库冒充完成
- **recovery**：按幂等键回滚已落库条目
- **task risk**：分项目目录不存在时静默并入 workflowhub（必须显式离线标注）
- **test tier / test method**：feature — 同 T501
- **scenarios / fixtures**：正式 20 条
- **coverage limits**：历史教训对 M16 的业务收益属 DE-001 延伸观察

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：T502/T503 已完成；按真实离线包完成正式仓外导入、项目分流、历史标记、介入/严重度字段与幂等重跑；转换器归档保留待显式授权。
- **executed_commands**：真实包 `--dry-run` exit 0；首次 `--execute` exit 0、40 行写入；第二次 `--execute` exit 0、0 行新增且 `idempotent=true`；落库后 20/20、40 行、引用/分流/标记断言通过。
- **evidence_refs**：`quality/tests/stage-reflection-usability-p5-import-exec/gate.json`；`quality/tests/stage-reflection-usability-p5-import/gate.json`；`quality/tests/stage-reflection-usability-p5-intervention/gate.json`。
- **covered_ac**：AC-IMPORT-001~005 的转换、落库、证据、介入/严重度、幂等行为均有事实证据；转换器归档仍未执行。
- **review_fact**：P5 独立质量审查未执行；focused/import assertions 不等于 release/close verdict。
- **completed_at**：2026-09-03
- **执行事实**：正式写入仅触及指定 `Projects/*/lessons` 与 `Projects/*/quality/evidence/historical-replay-20260901/`；未触碰正式 task 目录；归档/cleanup 无授权，保持未执行。

## Phase P6 — M16 消费改进（基线已合入，按本任务做消费适配）

### Goal

在已合入的 M16 消费链上，按 spec 混合输入期望表识别、过滤并分层；保持 M16 既有契约测试、候选判定语义和趋势区布局不变。

### Files

- **READ/CONSUME**：`runtime/evidence/workflow-evolution.mjs`、`runtime/schemas/workflow-evolution.v1.json`、`tools/cli/build-reflection-page.mjs`、`tools/cli/build-reflection-page-template.html`、`tools/cli/derive-consumption-edges.mjs`
- **MODIFY（T603 最小边界）**：优先 `tools/cli/build-reflection-page.mjs` 输入归一化；仅当 RED 证明深模块必须承接过滤时，才改 `runtime/evidence/workflow-evolution.mjs` 消费入口；不得扩写 M16 data-plane
- **NEW（仅当无现成 seam）**：mixed-input fixture/contract；优先复用 `tests/contract/workflow-evolution-candidates.test.mjs`、`tests/contract/build-reflection-page.test.mjs`，并以 `tests/contract/workflow-evolution-final-aggregate.test.mjs`、governance 与 `tests/e2e/workflow-evolution-current.test.mjs` 作回归
- **DO NOT TOUCH**：M16 归档材料；candidate identity、zero-consumption/repeat-intervention 两档规则、quality-tax 原有计算边界（仅按本 spec 排除 historical replay/availability 输入）、lock/CAS、lifecycle、Evolution 三分区布局

### Tasks

#### T601 — M16 merge 核验 gate

- **ID**：T601
- **Phase**：Phase P6
- **goal**：核验 M16 已合入当前分支，读取最终消费侧代码登记实际改动面，并拆记其仍未闭合的独立质量事实（关闭 OPEN-01，不宣称 AC-M16-001 通过）。
- **design_state**：ready
- **versioned_refs**：同 Input 行；基线为当前 HEAD `fff255c78e1ae105347d60fcbc307ffa0da03840`
- **source_refs / decision_refs**：T-015、RISK-002、OPEN-01 → FR-M16-001 / AC-M16-001
- **输入**：`eeb9dfa12 → cdafb4446` M16 merge provenance、`fff255c78` 归档提交、M16 归档任务状态与当前代码
- **依赖**：T001
- **并行**：否 — 先完成基线/消费面登记，再设计 mixed-input RED
- **FR**：FR-M16-001
- **AC**：AC-M16-001（前置可行性与消费面核验，不是最终通过）
- **动作**：只读核对当前分支与 main 同指 `fff255c78`；读取 `specs/archive/workflowhub-m16-evolution-20260831/tasks.md`：T001–T009 completed、T010/AC-GOV-002 incomplete/inconclusive；登记 direct consumer surface：`runtime/evidence/workflow-evolution.mjs`、`runtime/schemas/workflow-evolution.v1.json`、`tools/cli/build-reflection-page.mjs`、`tools/cli/build-reflection-page-template.html`、`tools/cli/derive-consumption-edges.mjs` 及 candidates/page/governance/e2e contracts；确认现行链仍只编译 stage-reflection.v1，缺 v2/availability/historical replay mixed-input 处理。关闭 OPEN-01 的“具体文件待定”，保留 RISK-002 与质量 incomplete。
- **精确文件**：无计划生产文件改动；仅在本卡执行区登记事实
- **boundary**：files: 无写入；不重复 merge；不改 M16 归档材料或生产语义
- **输出**：merge provenance + direct consumer surface + M16 quality incomplete + OPEN-01 closed fact
- **Knowledge**：main 已有 M16 data-plane/Evolution 页面，但 `row_status=historical` 不是 historical replay；现行 page builder 只消费认证 stage-reflection.v1 judgments/interventions
- **verification_role**：evidence
- **paired_task**：none
- **gate_cmd**：只读 provenance/状态/消费面核对；依赖可用时另行执行 `npm test && npm run check`
- **expected_exit**：0（事实核验完成；测试依赖缺失不改写为通过）
- **oracle**：ORACLE-M16-MERGE-GATE — merged provenance、direct surface、T010 quality status 三者均有依据
- **evidence_path**：`quality/tests/stage-reflection-usability-p6-m16-gate/gate.json`
- **STOP**：若需要改 M16 判定语义/趋势布局、增第二事实源，停止并回 spec/decision；不得重复 merge
- **recovery**：无（核验性任务）
- **task risk**：误把 main 有 M16 代码或 archive commit 当 M16 全质量闭合

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：未改 M16 生产代码；登记 direct consumer surface 与现行缺口，关闭 OPEN-01 的“具体文件待定”前置问题。当前分支/main 同指 `fff255c78e1ae105347d60fcbc307ffa0da03840`；M16 真实 merge 为 `cdafb4446`。
- **executed_commands**：只读 `git status/log/rev-list/diff` 与代码/归档材料核验；重复 merge 未执行。基线 `npm test` exit=127（`vitest` 缺失）；`npm run check` exit=127（`markdownlint-cli2` 缺失）。
- **evidence_refs**：`specs/archive/workflowhub-m16-evolution-20260831/tasks.md:580-616`；当前 M16 direct surface：`runtime/evidence/workflow-evolution.mjs`、`runtime/schemas/workflow-evolution.v1.json`、`tools/cli/build-reflection-page.mjs`、`tools/cli/build-reflection-page-template.html`、`tools/cli/derive-consumption-edges.mjs`、对应 contracts/e2e。
- **covered_ac**：AC-M16-001 前置可行性核验；不覆盖 mixed-input 实现或 M16 全质量 acceptance。
- **review_fact**：独立审计确认 T001–T009 completed；T010/AC-GOV-002=`incomplete/inconclusive`。现行代码无 stage-reflection.v2、availability fact、historical_replay 的 M16 消费契约。
- **completed_at**：2026-09-01
- **执行事实**：`eeb9dfa12 → cdafb4446 → fff255c78`；`fff255c78` 仅归档 M16 四份材料。OPEN-01 已按 merge provenance+实际消费面关闭，但 RISK-002/质量 incomplete 保留。

#### T602 — RED：M16 混合输入契约

- **ID**：T602
- **Phase**：Phase P6
- **goal**：在已确认的 M16 消费 seam 上，用失败测试固定 FR-M16-001 的五行 mixed-input 语义，不把现有 M16 回归测试误当作本 AC 证据。
- **design_state**：ready
- **versioned_refs**：同 Input 行；M16 基线 `fff255c78e1ae105347d60fcbc307ffa0da03840`
- **source_refs / decision_refs**：FND-S06、T601、RISK-003/RISK-004 → FR-M16-001 / AC-M16-001
- **输入**：spec §5 FR-M16-001 五行期望；T601 登记的 `build-reflection-page.mjs`/`workflow-evolution.mjs` 消费面；`stage-reflection.v1/v2` 与 availability/historical-replay 输入契约（分别由 T102/T402/T504 产出）
- **依赖**：T601、T102、T402、T504
- **并行**：否 — 必须先有 v1/v2、availability 与历史导入输入形状，再固定 M16 RED
- **FR/AC**：FR-M16-001 / AC-M16-001
- **动作**：优先扩展现有 `tests/contract/build-reflection-page.test.mjs` 与 `tests/contract/workflow-evolution-candidates.test.mjs` 的 fixture/seam；若现有测试无合适边界，再新增本任务 mixed-input fixture。逐行断言：①v1 旧记录进入既有候选/税/趋势；②v1 unavailable/not_scheduled availability 不计判断、不分层、不进税分母、不产生趋势点；③v2 判断按既有规则进入；④`historical_replay=true` 只进 reference_only、不进税分母并标历史来源；⑤单条 malformed 局部跳过且有 diagnostic。同步执行 M16 candidates/page/ledger/governance/final-aggregate/e2e 既有回归以确认基线。
- **精确文件**：优先 `tests/contract/build-reflection-page.test.mjs`、`tests/contract/workflow-evolution-candidates.test.mjs`；必要时同目录新增 fixture/contract；不改 M16 归档材料与生产文件
- **boundary**：files: 仅当前任务测试/fixture；symbols: 输入归一化、过滤与计数断言；不改 candidate identity、zero-proof/repeat 两档规则、quality-tax 原有算法、lock/CAS、lifecycle、趋势布局
- **输出**：稳定 RED（证明现行消费链只处理 stage-reflection.v1，尚未处理 v2/availability/historical replay/malformed diagnostic）
- **Knowledge**：stage-reflection.v1 当前只能验证 `ok|degraded|failed`；M16 `row_status=historical` 不等于 historical replay；缺 producer/schema/fixture 时必须 STOP，不重建第二事实源
- **verification_role**：RED
- **paired_task**：T603
- **gate_cmd**：`npx vitest run tests/contract/build-reflection-page.test.mjs tests/contract/workflow-evolution-candidates.test.mjs`
- **expected_exit**：1
- **oracle**：ORACLE-M16-MIXED-INPUT — 五行期望逐行断言，且失败只来自尚未实现的消费适配
- **evidence_path**：`quality/tests/stage-reflection-usability-p6-m16/gate.json`
- **STOP**：需要改 M16 判定语义/分层规则/趋势布局、创建第二事实源，或 T102/T402/T504 尚未提供输入契约 → 停止并回对应前置任务/spec
- **recovery**：还原 mixed-input fixture/断言；不还原已合入 M16
- **task risk**：把现有 M16 focused tests 的绿结果误当 AC-M16-001；或把缺输入 producer 静默当 empty
- **test tier / test method**：feature — backend-testing + workflow-evolution/page contract tests
- **scenarios / fixtures**：v1 legacy / v1 availability / v2 trio / historical replay / one malformed；输入 fixture source/hash 可追溯
- **coverage limits**：不证明 M16 业务收益，不证明 M16 T010 quality closure，不改变 M16 原有语义

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：新增 mixed-input 页面契约 fixture/断言，覆盖 v1、v2、availability、historical replay、malformed 五类输入；未改 M16 archive。
- **executed_commands**：首次 mixed-input 测试在 v2 尚未接入时按预期失败；适配后 `npx vitest run tests/contract/build-reflection-page.test.mjs tests/contract/workflow-evolution-candidates.test.mjs` exit 0（76/76）。
- **evidence_refs**：`quality/tests/stage-reflection-usability-p6-m16/gate.json`；`tests/contract/build-reflection-page.test.mjs`。
- **covered_ac**：`AC-M16-001` mixed-input 语义契约部分；不覆盖 M16 T010/AC-GOV-002 的质量闭环与业务收益。
- **review_fact**：独立 P6 review 尚未完成；focused tests 通过不等于 M16 全质量通过。
- **completed_at**：2026-09-03
- **执行事实**：RED 真实证明 v2 被旧 parser 判为 unavailable；GREEN 后确认 availability 不进入观察/税、历史回放不进入 live tax 且强制 reference_only、坏 lesson 保留 diagnostic。

#### T603 — GREEN：M16 消费侧实现

- **ID**：T603
- **Phase**：Phase P6
- **goal**：在不改 M16 判定算法与页面布局的前提下，实现 T602 固定的 stage-reflection mixed-input 识别/过滤/分层，使 T602 通过并保持 M16 既有回归绿。
- **design_state**：ready
- **versioned_refs**：同 Input 行；实现基线 `fff255c78e1ae105347d60fcbc307ffa0da03840`
- **source_refs / decision_refs**：同 T602
- **输入**：T602 RED；T102 的 v1/v2 验证结果；T402 的 availability projection；T504 的 historical replay lessons/evidence
- **依赖**：T602
- **并行**：否
- **FR/AC**：同 T602
- **动作**：优先修改 `tools/cli/build-reflection-page.mjs` 的输入归一化/认证过滤，使 v1/v2/availability/historical replay 映射到 M16 已有 `observations`/`interventions`/`consumer_proofs` 输入；只有 T602 证明深模块必须承接过滤时，才最小修改 `runtime/evidence/workflow-evolution.mjs` 消费入口。availability 不进入判断、候选或税分母；historical replay 强制 `reference_only`、不进税分母并保留来源标记；单条 malformed 局部跳过并写 diagnostic；保留现有 target authority、identity、proof、lock/CAS、lifecycle、两档阈值与页面三分区。
- **精确文件**：优先 `tools/cli/build-reflection-page.mjs`；必要时 `runtime/evidence/workflow-evolution.mjs`；相应 schema/fixture/test 文件仅按 T602 证明的最小范围修改；不改 `build-reflection-page-template.html` 除非 T602 证明必须增加历史来源/状态文案且仍不改布局
- **boundary**：files: T601 surface 内且由 RED 证明必要的文件；symbols: 输入 envelope/过滤/diagnostic 与现有 observation 装配；不改 M16 判定语义、候选身份、两档规则、quality-tax 算法、lock/CAS、lifecycle、趋势布局
- **输出**：T602 全绿 + M16 focused contracts/page/e2e 回归绿；实现/测试/输入 fixture 字节与 evidence 绑定
- **Knowledge**：现行 M16 schema 未定义 stage-reflection.v2/status_matrix/source_completeness/historical_replay；缺 producer 或 schema 时必须 STOP，不以 empty/unknown 掩盖实现缺口
- **verification_role**：GREEN
- **paired_task**：T602
- **gate_cmd**：`npx vitest run tests/contract/build-reflection-page.test.mjs tests/contract/workflow-evolution-candidates.test.mjs tests/contract/workflow-evolution-ledgers.test.mjs tests/contract/workflow-evolution-governance.test.mjs tests/contract/workflow-evolution-final-aggregate.test.mjs tests/e2e/workflow-evolution-current.test.mjs`
- **expected_exit**：0
- **oracle**：ORACLE-M16-MIXED-INPUT — 五行 mixed-input 期望转绿，既有 M16 identity/proof/lock/CAS/lifecycle/page 回归仍保留
- **evidence_path**：`quality/tests/stage-reflection-usability-p6-m16/gate.json`
- **STOP**：若必须改 M16 判定语义/分层规则/趋势布局、无法保持既有回归，或缺少前置 producer/schema → 停止并回 spec/用户，不去 M16 归档任务侧加需求
- **recovery**：还原本任务消费适配与 fixture；保留已合入 M16 实现、归档材料和失败 evidence
- **task risk**：把历史候选 row_status 或 unavailable 错当 historical replay/availability 输入；把 malformed 静默丢弃；或以兼容桥扩大永久数据面
- **test tier / test method**：feature — backend-testing + workflow-evolution/page contract regression
- **scenarios / fixtures**：同 T602；另测 v1/v2 旧新兼容、历史来源标记、单条 malformed diagnostic 与现有 target/proof identity
- **coverage limits**：不证明 M16 业务收益，不证明 M16 T010 quality closure，不改 M16 归档材料

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：仅修改 `tools/cli/build-reflection-page.mjs`：v1/v2 双 schema 识别；历史 merged lesson 生成 reference-only 页面候选；历史输入不送入 M16 live observations/tax；malformed lesson 延续局部 diagnostic。未改 M16 深模块、schema、模板布局或 archive。
- **executed_commands**：focused page/candidates 76/76；ledgers 16/16；e2e current 3/3；全套 P6 命令 exit 0（6 files/130 tests）；修正归档路径后 M16 既有 regression 四子门禁均 green（pool-tax 85/85、ledger-brief 40/40、monitor 9/9、governance 22/22），事实见 gate。
- **evidence_refs**：`quality/tests/stage-reflection-usability-p6-m16/gate.json`；`docs/architecture/move-map.json`。
- **covered_ac**：混合输入消费语义实现部分；M16 既有 deterministic regression 已恢复并通过，M16 T010/AC-GOV-002 仍 incomplete/inconclusive，不宣称质量闭环或 release green。
- **review_fact**：独立 P6 review 尚未完成；focused contracts 不是独立审查。
- **completed_at**：2026-09-03
- **执行事实**：保留 M16 candidate identity、zero-proof/repeat 两档规则、quality-tax、lock/CAS、lifecycle 与趋势布局；历史输出明确 `historical_replay=true`、`tier=reference_only`、`freshness=stale`。

## Phase P7 — 最小真机验证（聚合卡）

### Goal

构造场景跑通全链四类路径，汇总 AC-VERIFY；失败路径真报失败。

### Files

- **NEW**：`tests/e2e/stage-reflect-real-chain.test.mjs`
- **MODIFY**：无
- **DO NOT TOUCH**：生产文件

### Tasks

#### T701 — 全链真机验证

- **ID**：T701
- **Phase**：Phase P7
- **goal**：经正式入口构造场景跑通"raw 前奏 → 会话视角判断 JSON（按重写后技能契约）→ reflect 校验/合并/发布 → 页面显示 → M16 消费"全链；覆盖成功/失败/未调度/验证失败四类路径；汇总 AC-VERIFY-001~004。
- **design_state**：ready
- **versioned_refs**：同 Input 行
- **source_refs / decision_refs**：D-007、T-014、FND-D02/FND-DD04 → AC-VERIFY-001~004、AC-EXEC-001、AC-QUALITY-001
- **输入**：P1-P6 全部产物（M16 基线已合入；若 T602/T603 未完成，M16 消费环节与 AC-M16-001 如实记 incomplete）
- **依赖**：T202、T301、T402、T504、T603
- **并行**：否 — 最终聚合
- **FR**：验收域（D-007）
- **AC**：AC-VERIFY-001、AC-VERIFY-002、AC-VERIFY-003、AC-VERIFY-004
- **动作**：构造临时任务场景：①成功路径（合法判断→发布→页面徽章→M16 计数）；②失败路径（非法判断→拒绝→页面 unavailable→可修正重试）；③未调度路径（模拟 preflight 失败→not_scheduled 事实→页面显示）；④验证失败路径（悬空引用→degraded）；每路径断言 facts 与页面投影；会话视角判断 JSON 必须按重写后 SKILL.md 契约构造且被接受（AC-QUALITY-001 行为级验证）；全量测试（npm test 门禁）+ 独立审查事实核对汇总（wh-review/dsh-code-review 由 build-code/verify-code 既有步骤执行，本卡只汇总不替代）
- **精确文件**：`tests/e2e/stage-reflect-real-chain.test.mjs`
- **boundary**：files: 测试一个文件；symbols: E2E 场景；tmpdir 隔离，测试负责清理
- **输出**：四类路径证据 + AC-VERIFY 汇总
- **Knowledge**：F9——验证场景在实际为假时必须真报失败；真实业务任务质量验证属 DE-001（本卡不冒充）
- **verification_role**：final-aggregate
- **paired_task**：none
- **gate_cmd**：`npx vitest run tests/e2e/stage-reflect-real-chain.test.mjs && npm test`（全量契约为 AC-VERIFY-001 门禁，FND-P07 修复）
- **expected_exit**：0
- **oracle**：ORACLE-REAL-CHAIN — 四类路径结果与预期逐条一致；任一偏离即失败
- **evidence_path**：`quality/tests/stage-reflection-usability-p7-real-chain/gate.json`
- **STOP**：验证只能靠弱化断言通过 → 停止并修验证本身（F9）
- **recovery**：修正场景/断言；生产问题回到对应 Phase 修复
- **task risk**：构造场景与真实会话行为差距 → 判断 JSON 由"会话真实视角"手工构造（非生成器）降低差距
- **test tier / test method**：fullstack — fullstack-slice-testing + isolated-browser-qa（页面截图证据）
- **scenarios / fixtures**：四类路径构造输入 + facts 断言 + 页面截图
- **coverage limits**：构造场景≠真实业务任务（DE-001）；不证明长期合规率

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`partial`
- **actual_changes**：新增 `tests/e2e/stage-reflect-real-chain.test.mjs`，复用正式 `stage-runtime`/`run`、`confirm`、真实 task/worktree 与页面 builder，覆盖成功、失败、preflight not_scheduled、悬空证据 degraded 四类路径；补齐共享 stage-outcome fixture 的 `skill.input_refs` 合同字段。
- **executed_commands**：`npx vitest run tests/e2e/stage-reflect-real-chain.test.mjs` 已通过 1/1；页面断言包含五态、reflection 持久化、M16 evolution 投影与 `ai_used=false`；isolated-browser-qa 页面 smoke 已通过并清理；`npm run test:safe` 的历史结果为 exit 1（209 files：208 passed、1 failed、25 skipped；2188 passed、1 failed、25 skipped），唯一失败为 `tests/official-component-receipts.test.mjs:566` 的外层子进程启动超时；已将父进程保护从 500ms 调整为 5000ms，子进程 `lockWaitMs=25` 不变，受影响测试文件复跑 52/52；异源 verify-code review 已真实 dispatch，路由修复后 `wh-review doctor` exit 0；review-round findings 2 条 minor 已修复，定向复测 4 files/33 tests 通过；按用户要求未重跑完整 safe aggregate。
- **evidence_refs**：`quality/tests/stage-reflection-usability-p7-real-chain/gate.json`；`tests/e2e/stage-reflect-real-chain.test.mjs`。
- **covered_ac**：AC-VERIFY-003/004 构造链 focused evidence；AC-VERIFY-001/002、四路径浏览器验收与全量门禁仍 incomplete。
- **review_fact**：异源 verify-code review round `available/partial`；`pi/coding` 返回 2 条有效 minor findings，均已修复；`grok/grok`、`pi/v4flash` 为 `PROVIDER_IDENTITY_INVALID`，`codex/luna` 为 `SAME_SOURCE`。本 review packet 是修复前 snapshot，按合同不重复 provider review；canonical dsh-code-review/session-event 仍 unavailable，浏览器 QA 仍只是 smoke；focused E2E 不等于业务任务 acceptance 或 release green。
- **completed_at**：2026-09-03
- **执行事实**：测试使用 tmpdir 隔离且 afterEach 清理；失败路径真保留 failed/degraded；P7 不授权 close、archive、cleanup。
- **后续代码审查修复**：独立只读审查发现页面在 `stale` 状态下隐藏 `reference_only` 历史候选、候选层级标签硬编码为 `judgment · 非事实`、`generated_at` 的 `date-time` schema 校验被 Ajv 忽略、真实 preflight reason 未断言。已修复模板渲染/事实标签、统一严格 RFC3339 校验，并补充 malformed reflection、页面事实标签、`preflight_failed` availability 的契约/E2E 断言；相关定向测试 5 files/49 tests 通过。

# Tasks — workflowhub-m17-repo-skills-multicli-20260903

- **Template version**: `plan-task.v3`
- 来源：plan.md / spec.md / decision-log.md。每张卡执行后在本卡「执行状态填写区」回填事实。
- **当前执行策略（2026-09-05 用户确认）**：不再执行 `test:safe` 或 `npm test` 全量回归；卡片中的历史 `gate_cmd: npm test` 与早期 full-test 事实只读保留，后续仅执行对应 focused gate。缺失质量事实继续记为 `incomplete`/`unavailable`。

## Phase B1 — 簿记批

### Goal
孤儿三技能裁定落地、复用登记同步、目录真相表修复+延期文档归档+知识库回写。

### Files
**MODIFY** `skills/qa-only/`（删除）、`skills/verify-change/`（删除）、`skills/catalog.yaml`、`skills/reuse-registry.md`、`docs/reuse-registry.md`、`docs/architecture/move-map.json`；**NEW** `docs/operations/deferred-tasks-m17.md`、`docs/research/`（三份调研归档）；Knowledge 侧 roadmap.md/progress.md 回写（仓外，不占边界）。
### Tasks
T1、T2、T3

### Verify
受影响域 focused tests 全绿；登记 diff 为空；move-map 抽查全中；历史全量失败事实保持可见，不再为本任务重跑全量回归。

### Knowledge
G-002/G-003 核查结论、F-004、batch-governance 删除先例。

### STOP
发现任一待删技能出现新消费者 → 停止回 build-plan。

### Done
AC-C-001 簿记部分证据齐。

### Risks and rollback
全部可 git revert；删除项 git 历史可恢复。

### T1：孤儿三技能处置（删二留一）

- **ID**：T1
- **Phase**：Phase B1 — 簿记批
- **goal**：删除 qa-only 与 verify-change 目录及 catalog 条目；resolving-merge-conflicts 在 catalog 登记消费者=core/task-close.mjs 冲突报错路径
- **design_state**：designed
- **versioned_refs**：`specs/workflowhub-m17-repo-skills-multicli-20260903/spec.md@2c165e25`
- **输入**：D-009、G-002/G-003 核查结论、batch-governance 先例
- **依赖**：无
- **并行**：不并行（簿记批串行）
- **FR**：FR-C-011
- **AC**：AC-C-001
- **动作**：删两个技能目录；catalog 删两条目+登记 resolving-merge-conflicts 消费者；reuse-registry 同步标注
- **精确文件**：`skills/catalog.yaml`
- **boundary**：files: `skills/qa-only/`、`skills/verify-change/`、`skills/catalog.yaml`、`skills/reuse-registry.md`
- **输出**：删除提交+登记更新
- **Knowledge**：verify-code required_skills 已于 e294f09d5 裁掉两技能；review-packet.v1 无生产者
- **verification_role**：N/A — 非行为变更：死契约删除+登记，无运行时行为
- **paired_task**：N/A — 非行为变更
- **gate_cmd**：`npm test`
- **expected_exit**：0
- **oracle**：两目录与条目不存在；resolving-merge-conflicts 条目含消费者字段；npm test 全绿
- **evidence_path**：quality/tests/t1-orphan-skills.json
- **STOP**：任一待删技能出现新消费者 → 回 build-plan
- **recovery**：git 历史恢复目录，重新裁定
- **task risk**：低

#### 执行状态填写区

- 状态：已执行（质量事实不完整；T1 实现、测试捕获与阶段复盘已记录）

#### 执行事实

- 2026-09-05：执行首个 `npm test` gate，exit `127`；`vitest: command not found`，测试依赖不可用，未安装或改动 `node_modules`。
- 2026-09-05：删除 `skills/qa-only/`、`skills/verify-change/` 三个文件各自的目录内容及 catalog 两条目；`skills/reuse-registry.md` 同步移除两条；保留 `skills/resolving-merge-conflicts/`，并在 catalog 的 `local_changes` 写明唯一消费者 `core/task-close.mjs:1411` 合并冲突报错路径。
- 2026-09-05：删除前完成仓内消费者核查；当前非历史生产引用仅剩 `core/task-close.mjs:1411` 对 `resolving-merge-conflicts` 的报错路径。历史文档与归档材料中的旧名未改写。
- **AC-C-001/T1**：删除与消费者登记事实已产生；正式测试捕获为 `quality/tests/t1-t3-npm-test.json`（exit `127`）和 `quality/tests/t1-t3-focused-static.json`（exit `1`，部分套件收集阶段缺 `js-yaml`）；该 AC 的完整绿灯结论保持 `incomplete`。

### T2：复用登记同步+状态词表+审计

- **ID**：T2
- **Phase**：Phase B1 — 簿记批
- **goal**：skills/reuse-registry.md 与 docs/reuse-registry.md 双份同步；status 词表对齐；_spike 目录审计记录落盘
- **design_state**：designed
- **versioned_refs**：`specs/workflowhub-m17-repo-skills-multicli-20260903/spec.md@2c165e25`
- **输入**：FR-C-012、T1 删除结果
- **依赖**：T1
- **并行**：不并行
- **FR**：FR-C-012
- **AC**：AC-C-001
- **动作**：双份登记内容对齐（含 T1 删除反映）；词表统一；_spike 审计结论写入登记
- **精确文件**：`skills/reuse-registry.md`
- **boundary**：files: `skills/reuse-registry.md`、`docs/reuse-registry.md`
- **输出**：双份一致登记+审计记录
- **Knowledge**：registry 测试 tests/reuse-registry.test.mjs 存在可作核对
- **verification_role**：N/A — 非行为变更：文档登记同步
- **paired_task**：N/A — 非行为变更
- **gate_cmd**：`npm test`
- **expected_exit**：0
- **oracle**：双份登记 diff 为空；registry 测试绿
- **evidence_path**：quality/tests/t2-registry-sync.json
- **STOP**：双份内容存在无法判定的冲突 → 回 build-plan
- **recovery**：以仓内实际技能清单为准重录
- **task risk**：低

#### 执行状态填写区

- 状态：已执行（质量事实不完整；T2 文档与审计、测试捕获与阶段复盘已记录）

#### 执行事实

- 2026-09-05：同步 `skills/reuse-registry.md` 与 `docs/reuse-registry.md` 的复用状态词表：`native`、`adopted`、`adapted`、`absorbed`、`rejected`、`watch`。
- 2026-09-05：扫描当前 `skills/` 路径，未发现 `_spike` 目录或文件；未将该结果外推为仓外历史目录已删除。
- **AC-C-001/T2**：登记同步与 `_spike` 审计事实已产生；`quality/tests/t1-t3-focused-static.json` 中 registry 套件 2 项通过，但同批测试整体 exit `1`，完整 AC 结论保持 `incomplete`。

### T3：目录真相表修复+延期文档归档+知识库回写

- **ID**：T3
- **Phase**：Phase B1 — 簿记批
- **goal**：move-map 与实际文件位置一致；延期任务文档归档进仓并登记；Knowledge roadmap/progress.md 回写 M17 进展
- **design_state**：designed
- **versioned_refs**：`specs/workflowhub-m17-repo-skills-multicli-20260903/spec.md@2c165e25`
- **输入**：FR-C-017、FND-005 注记、T1/T2 结果
- **依赖**：T1、T2
- **并行**：不并行
- **FR**：FR-C-017
- **AC**：AC-C-001
- **动作**：全量核对 move-map（含 T1 删除项）；/Users/Hugh/Downloads/workflowhub-m17-deferred-tasks.md 归档为 docs/operations/deferred-tasks-m17.md 并登记；主仓 docs/research/ 三份调研归档进仓并登记；Knowledge 回写
- **精确文件**：`docs/architecture/move-map.json`
- **boundary**：files: `docs/architecture/move-map.json`、`docs/operations/deferred-tasks-m17.md`、`docs/research/`
- **输出**：修复后 move-map+归档文件+回写记录
- **Knowledge**：move-map 是目录迁移唯一事实（AGENTS.md）
- **verification_role**：N/A — 非行为变更：登记与文档
- **paired_task**：N/A — 非行为变更
- **gate_cmd**：`npm test`
- **expected_exit**：0
- **oracle**：move-map 抽查全中；归档文件存在且已登记；npm test 全绿
- **evidence_path**：quality/tests/t3-move-map-repair.json
- **STOP**：发现未列入 move-map 的新增文件无消费者登记 → 回 build-plan
- **recovery**：补登记或移回文件，重新核对
- **task risk**：低

#### 执行状态填写区

- 状态：已执行（质量事实不完整；仓内归档、move-map、测试捕获与阶段复盘已记录）

#### 执行事实

- 2026-09-05：将 `/Users/Hugh/Downloads/workflowhub-m17-deferred-tasks.md` 归档为 `docs/operations/deferred-tasks-m17.md`，已验证字节一致。
- 2026-09-05：为延期文档、三份研究文档及 T1 删除文件补充 `docs/architecture/move-map.json` 条目；JSON 可解析，条目含 owner、consumer、delete_condition 与当前文件 hash/大小事实。
- 2026-09-05：在当前 `/Users/Hugh/Knowledge/Projects/workflowhub` 未发现可写的 `roadmap.md`/`progress.md`；只发现 `git-ref-archive/stray-task-artifacts/progress.md` 历史归档，未改写历史文件，因此 Knowledge 回写记为 `unavailable`。
- **AC-C-001/T3**：仓内归档与 move-map 事实已产生；Knowledge 回写 `unavailable`，正式测试捕获记录 `npm test` exit `127`，完整 AC 结论保持 `incomplete`。

## Phase B1 阶段收尾事实

- **实现范围**：完成 T1/T2/T3；只改动技能删除、复用登记、延期文档归档、三份研究文档入仓、move-map 登记；未新增运行时控制面，未改写历史归档。
- **测试路由**：实际变更均为文档、配置、删除和目录登记，`test-routing-advisor` 判定行为测试 `not_applicable`；`backend-testing` 对本阶段 `not_applicable`。保留静态检查作为最小验证层。
- **正式测试捕获**：`quality/tests/t1-t3-npm-test.json` exit `127`（任务 worktree 无 `vitest`）；`quality/tests/t1-t3-focused-static.json` exit `1`（2 个 registry/repository 套件共 5 项通过，`js-yaml` 缺失导致另 2 个套件收集失败）。两份输出均已由 public `verify --action=execute --stage=build-code` 捕获。
- **静态验证**：`git diff --check` 通过；`docs/architecture/move-map.json` 可解析且新增条目 hash/bytes 抽查通过；延期文档与 Downloads 源文件字节一致；T1 删除目录、catalog/reuse-registry 条目静态 oracle 通过。
- **阶段审查**：`wh-review` 已按一次性规则尝试；在 broker 前因 `Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'ajv' imported from /Users/Hugh/Hugh/Project/workflowhub-workflowhub-m17-repo-skills-multicli-20260903/runtime/evidence/freshness.mjs` 失败，review 状态为 `unavailable`，没有可供处置的 provider findings，不能写成通过。
- **阶段复盘**：已调用 public `run --action=reflect --stage=build-code`；当前记录 `quality/stage-reflection/build-code.json`，机器验证状态为 `degraded`，消费扫描 `partial`，未将缺失 outcome 推导为零消费。
- **阶段结论**：T1/T2/T3 的实现事实齐，但 B1 质量事实不完整；`AC-C-001` 保持 `incomplete`，Knowledge 回写保持 `unavailable`，不影响继续同任务安全执行 T4。
- **下一步**：进入 Phase B2 的 T4，先做 `core/fact-indexes.mjs` 反向引用核查与 `parse-framework-config.mjs` 去留评估，再更新 move-map 和 T4 事实。

## Phase B2 — 纯归位批

### Goal
死代码删除、review 双副本收敛、stage-content-contracts 纯归位、task-capability 迁移；零行为变更。

### Files
**MODIFY** `core/fact-indexes.mjs`（删除）、`core/parse-framework-config.mjs`、`runtime/review/`、`runtime/review/stage-review-disposition.mjs`、`runtime/stage/stage-content-contracts.mjs`（核验 main 已完成的归位，不再移动）、`skills/wh-review/scripts/`（review 双副本旧位收敛为薄转发）、`runtime/stage/stage-handlers.mjs`、`runtime/evidence/stage-content-evidence.mjs`、`runtime/evidence/canonical-receipt-writer.mjs`、`runtime/task/task-kernel-implementation.mjs`、`core/task-close.mjs`、`tools/cli/validate-field-mapping.mjs`、`tools/cli/stage-runtime.mjs`、`core/task-capability.mjs`（迁出）、`docs/architecture/move-map.json`；**NEW** `runtime/task/task-capability.mjs`（迁入）。
### Tasks
T4、T5、T6、T7

### Verify
每卡 npm test 全绿；T6 归位 diff 仅路径与转发。

### Knowledge
F-004 域级契约测试清单；spec-stage-artifact-closure.test 锚点形态。

### STOP
任一归位需要改逻辑才能过测试 → 停止回本 Phase。

### Done
AC-C-001 归位部分证据齐。

### Risks and rollback
RISK-P-01/RISK-P-04；整批可 revert。

### T4：死代码删除+解析配置评估

- **ID**：T4
- **Phase**：Phase B2 — 纯归位批
- **goal**：删除 core/fact-indexes.mjs（无消费者）；评估 parse-framework-config 去留并落盘结论
- **design_state**：designed
- **versioned_refs**：`specs/workflowhub-m17-repo-skills-multicli-20260903/spec.md@2c165e25`
- **输入**：FR-C-013、T3 move-map 基线
- **依赖**：T3
- **并行**：不并行（move-map 单文件纪律）
- **FR**：FR-C-013
- **AC**：AC-C-001
- **动作**：反向引用扫描证明零消费者后删除 fact-indexes；parse-framework-config 评估结论写入 move-map 注记；同步 move-map
- **精确文件**：`core/fact-indexes.mjs`
- **boundary**：files: `core/fact-indexes.mjs`、`core/parse-framework-config.mjs`、`docs/architecture/move-map.json`
- **输出**：删除提交+评估结论
- **Knowledge**：扫描派子代理执行（AGENTS.md）
- **verification_role**：N/A — 非行为变更：死代码删除，契约测试兜底
- **paired_task**：N/A — 非行为变更
- **gate_cmd**：`npm test`
- **expected_exit**：0
- **oracle**：npm test 全绿；move-map 同步；评估结论落盘
- **evidence_path**：quality/tests/t4-dead-code.json
- **STOP**：扫描发现活消费者 → 停止，改登记消费者而非删除
- **recovery**：git revert 恢复文件
- **task risk**：低

#### 执行状态填写区

- 状态：已执行（质量事实不完整；T4 删除、评估、测试捕获已记录）

#### 执行事实

- 2026-09-05：反向引用扫描排除 `docs/` 与 `specs/` 历史材料后，`core/fact-indexes.mjs` 无当前生产或测试消费者；按 T4 删除。历史文档/归档规格未改写。
- 2026-09-05：`core/parse-framework-config.mjs` 保留；当前唯一代码消费者是 `core/__tests__/parse-framework-config.test.mjs`，其 8 项契约测试通过。
- 2026-09-05：同步 `docs/architecture/move-map.json`：fact-indexes 写入 delete 事实（46727 bytes、原 hash `fa87acad548fdd0b9d6b1873c18cd7a24525f3098135a02f8284e6863dc604e4`），parse-framework-config 写入 retain 评估结论。
- **AC-C-001/T4**：静态 oracle 通过（文件删除、零当前引用、move-map JSON 与 diff check）；正式聚焦测试 `quality/tests/t4-parse-framework-config.json` exit `0`，`quality/tests/t4-npm-test.json` exit `127`（`vitest` 不可用），完整 AC 结论保持 `incomplete`。

### T5：review 双副本收敛

- **ID**：T5
- **Phase**：Phase B2 — 纯归位批
- **goal**：review 相关双副本收敛为 runtime/review/ 单一来源；旧位置仅保留薄转发并注明删除条件
- **design_state**：designed
- **versioned_refs**：`specs/workflowhub-m17-repo-skills-multicli-20260903/spec.md@2c165e25`
- **输入**：FR-C-014、T4 结果
- **依赖**：T4
- **并行**：不并行
- **FR**：FR-C-014
- **AC**：AC-C-001
- **动作**：逐文件比对双副本差异→以 runtime/review/ 为权威→旧位改薄转发（注明删除条件）→同步 move-map
- **精确文件**：`runtime/review/stage-review-disposition.mjs`
- **boundary**：files: `runtime/review/`、`skills/wh-review/scripts/`、`docs/architecture/move-map.json`
- **输出**：收敛后单一来源+转发删除条件注记
- **Knowledge**：约 12-14 个文件涉双副本（F-004）
- **verification_role**：N/A — 非行为变更：收敛为转发，零逻辑变更
- **paired_task**：N/A — 非行为变更
- **gate_cmd**：`npm test`
- **expected_exit**：0
- **oracle**：npm test 全绿；diff 显示旧位仅剩转发
- **evidence_path**：quality/tests/t5-review-shim.json
- **STOP**：双副本存在行为差异无法直接收敛 → 停止回 build-plan
- **recovery**：git revert 整卡
- **task risk**：中

#### 执行状态填写区

- 状态：已执行（main 基线已完成收敛；质量事实不完整；测试捕获已记录）

#### 执行事实

- 2026-09-05：核对 main 基线的 review 归位结果：`runtime/review/{integration-review-subject,review-output,schema-validator}.mjs` 为权威实现，`skills/wh-review/scripts/` 对应旧位仅保留转发；未发现旧 `core/` review 实现需要新增迁移。
- 2026-09-05：`skills/wh-review/scripts/integration-review-subject.mjs` 仅增加旧入口标识后调用 runtime 实现；`review-output.mjs` 与 `schema-validator.mjs` 仅 re-export，未发现行为分叉。move-map 已有对应 move/shim 事实，本卡未重复改写。
- **AC-C-001/T5**：`tests/contract/integration-review-subject.test.mjs` 7 项、`tests/contract/review-layering.test.mjs` 9 项通过；同批 `skills/wh-review/scripts/__tests__/integration-review-subject.test.mjs` 因任务 worktree 无 `ajv` 在收集阶段失败，正式捕获 `quality/tests/t5-review-shim-focused.json` exit `1`，完整 AC 结论保持 `incomplete`。

### T6：stage-content-contracts 方案三纯归位

- **ID**：T6
- **Phase**：Phase B2 — 纯归位批
- **goal**：stage-content-contracts 纯归位到 runtime 分区现行位置，旧位留桶式转发；零逻辑变更
- **design_state**：designed
- **versioned_refs**：`specs/workflowhub-m17-repo-skills-multicli-20260903/spec.md@2c165e25`
- **输入**：FR-C-015、T5 结果；spec-stage-artifact-closure.test:36-41 锚点形态
- **依赖**：T5
- **并行**：不并行
- **FR**：FR-C-015
- **AC**：AC-C-001
- **动作**：核对 main 已将文件置于 `runtime/stage/stage-content-contracts.mjs`，确认旧 `core/` 路径不存在、全部导入方指向现行路径、move-map 与实际一致；不再创建 `runtime/schemas/stage-content-contracts.mjs`，不触碰巨型函数，不清理死导出
- **精确文件**：`runtime/stage/stage-content-contracts.mjs`
- **boundary**：files: `runtime/stage/stage-content-contracts.mjs`、`runtime/stage/stage-handlers.mjs`、`runtime/evidence/stage-content-evidence.mjs`、`runtime/evidence/canonical-receipt-writer.mjs`、`runtime/task/task-kernel-implementation.mjs`、`core/task-close.mjs`、`tools/cli/validate-field-mapping.mjs`、`tools/cli/stage-runtime.mjs`、`docs/architecture/move-map.json`
- **输出**：归位提交+零逻辑变更 diff 证明
- **Knowledge**：导入方清单=core/task-close.mjs、tools/cli/validate-field-mapping.mjs、tools/cli/stage-runtime.mjs、runtime/evidence/stage-content-evidence.mjs、runtime/evidence/canonical-receipt-writer.mjs、runtime/task/task-kernel-implementation.mjs、runtime/stage/stage-handlers.mjs；main 已删除旧 session-state 导入方
- **verification_role**：N/A — 非行为变更：纯归位，diff 仅路径与转发
- **paired_task**：N/A — 非行为变更
- **gate_cmd**：`npm test`
- **expected_exit**：0
- **oracle**：npm test 全绿（含 spec-stage-artifact-closure）；归位 diff 无逻辑行变更
- **evidence_path**：quality/tests/t6-contracts-relocation.json
- **STOP**：源正则锚点无法兼容 → 停止回本卡（RISK-P-01）
- **recovery**：git revert 整卡，保留原位
- **task risk**：中

#### 执行状态填写区

- 状态：已执行（main 基线已完成归位；质量事实不完整；计划目标已按实际路径纠正）

#### 执行事实

- 2026-09-05：核对 main 合入后的实际布局：`runtime/stage/stage-content-contracts.mjs` 是现行权威文件，旧 `core/stage-content-contracts.mjs` 与计划误列的 `runtime/schemas/stage-content-contracts.mjs` 均不存在；全部当前导入方仍指向 `runtime/stage`。
- 2026-09-05：发现 move-map 原有 `sha256_after`/大小落后于 main 当前文件，已更新为 `e545626b1007d4a6520a78b3b2a24a092c906616cdacde5a1db12baa847a267f` / `301581`；未复制文件、未改动巨型函数和死导出。
- 2026-09-05：因本卡是 main 已完成归位的基线核验，未新增代码变更；同步修正 plan/tasks 的错误 `runtime/schemas` 目标，避免创建第二套契约位置。
- **AC-C-001/T6**：静态 oracle 通过（现行路径存在、旧路径不存在、语法检查通过、move-map hash/bytes 对齐）；相关契约测试因任务 worktree 缺 `ajv`/`js-yaml` 在收集阶段失败，完整 AC 结论保持 `incomplete`。

### T7：task-capability 迁移+登记

- **ID**：T7
- **Phase**：Phase B2 — 纯归位批
- **goal**：core/task-capability.mjs 迁移到现行分区并登记消费者；B2 批末全量核对 move-map
- **design_state**：designed
- **versioned_refs**：`specs/workflowhub-m17-repo-skills-multicli-20260903/spec.md@2c165e25`
- **输入**：FR-C-016、T4-T6 结果
- **依赖**：T6
- **并行**：不并行
- **FR**：FR-C-016
- **AC**：AC-C-001
- **动作**：迁移文件+更新导入+登记消费者与删除条件+move-map 同步+B2 批全量核对
- **精确文件**：`core/task-capability.mjs`
- **boundary**：files: `core/task-capability.mjs`、`runtime/task/task-capability.mjs`、`docs/architecture/move-map.json`
- **输出**：迁移提交+登记+全量核对记录
- **Knowledge**：迁移目标分区以 move-map 登记为准
- **verification_role**：N/A — 非行为变更：迁移+登记
- **paired_task**：N/A — 非行为变更
- **gate_cmd**：`npm test`
- **expected_exit**：0
- **oracle**：npm test 全绿；move-map 全量核对全中
- **evidence_path**：quality/tests/t7-capability-migration.json
- **STOP**：消费者不明 → 停止回 build-plan
- **recovery**：git revert 整卡
- **task risk**：低

#### 执行状态填写区

- 状态：已执行（质量事实不完整；T7 迁移、导入更新与登记已记录）

#### 执行事实

- 2026-09-05：将 `core/task-capability.mjs` 原字节迁入 `runtime/task/task-capability.mjs`；原文件 bytes `1268`、hash `47d7eb6c7f3cd2a9bba49dd77de502bb3d6647b75f1e21b636afc01e6b5dbe60`，迁移后 hash 保持一致。
- 2026-09-05：更新 5 个当前导入方：`core/artifact-dir.mjs`、`runtime/task/task-handle.mjs`、`runtime/task/workspace.mjs`、`runtime/review/review-record-route.mjs`、`runtime/evidence/audit-summary-carrier.mjs`；反向扫描不再发现 `core/task-capability.mjs` 引用。
- 2026-09-05：同步 move-map 的 source/destination、owner、consumer、delete_condition 与 hash/bytes；直接 import/brand oracle 通过，`git diff --check` 通过。
- **AC-C-001/T7**：迁移与登记静态事实通过；`core/__tests__/capability-doctor.test.mjs` 4 项通过，但涉及完整 TaskHandle 的测试因任务 worktree 缺 `ajv` 在收集阶段失败，`npm test` 仍不可用，完整 AC 结论保持 `incomplete`。

## Phase B2 阶段收尾事实

- **实现范围**：T4 删除 dead `core/fact-indexes.mjs` 并保留有测试消费者的 `parse-framework-config.mjs`；T5 核验 review runtime 单一来源与旧位薄转发；T6 以 main 已完成的 `runtime/stage/stage-content-contracts.mjs` 归位为基线并修正 move-map；T7 将 Task capability 原字节迁入 `runtime/task/` 并更新 5 个导入方。
- **计划修正**：main 实际不存在 `runtime/schemas/stage-content-contracts.mjs`，该错误目标已从 plan/tasks 删除；没有创建第二套契约模块。T6 的实际动作由“移动”改为“现行路径、导入图和 move-map 核验”。
- **测试路由**：本批均为删除、路径迁移、转发和登记，不引入新行为；按 `test-routing-advisor`/`backend-testing` 规则保留静态 oracle 与局部契约测试，不伪造完整行为覆盖。
- **正式测试事实**：T4 解析器 8 项通过；T5 相关 16 项通过但 1 个旧位测试套件因 `ajv` 缺失在收集阶段失败；B2 aggregate 4 个套件共 28 项通过、7 个套件因 `ajv`/`js-yaml` 缺失在收集阶段失败，正式记录为 `quality/tests/b2-focused-aggregate.json` exit `1`；`npm test` 仍 exit `127`。
- **静态验证**：T4/T6/T7 的删除、路径、hash/bytes、JSON 解析、语法和 `git diff --check` oracle 均通过；未发现超出边界的运行时逻辑改动。
- **阶段审查**：本批 `wh-review` 已执行一次；broker 在加载 `runtime/evidence/freshness.mjs` 时因任务 worktree 缺 `ajv` 失败，状态 `unavailable`，没有可处置 findings，不能称审查通过。
- **阶段复盘**：当前 build-code fixed reflection `quality/stage-reflection/build-code.json` 已在 B1 记录为 `degraded`；本批不覆盖或伪造 immutable reflection，后续 build-code 聚合仍需保留该质量限制。
- **阶段结论**：B2 代码/路径事实已完成，但全量测试、部分契约测试和独立审查仍不完整；`AC-C-001` 保持 `incomplete`。下一步进入 B3/T8，先删除 host-protocol 中已确认的两行死约定并做全文零引用核查。

## Phase B3 — 多 CLI 批

### Goal
死约定删除、显式身份与 Stage Agent outcome 契约验证、Claude/宿主显式结果接线验证、文档对齐。

### Files
**MODIFY** `skills/workflowhub-host-protocol/SKILL.md`（删 75/76 行+对齐段）、`tools/host/workflowhub-stage-agent-bridge.mjs`、`runtime/stage/stage-agent-outcome-adapter.mjs`、`tools/cli/stage-runtime.mjs`（仅当前契约暴露缺口时）、`AGENTS.md`、`CONTEXT.md`、`README.md`；**NEW** `tests/contract/host-outcome-bridge.test.mjs`、`tests/contract/claude-outcome-packet.test.mjs`、`tests/fixtures/host-outcome/`、`tests/fixtures/claude-outcome/`。
### Tasks
T8、T9、T10、T11、T12、T13

### Verify
T8 grep 断言；T9/T11 对当前 main 做契约回归验证；仅在暴露窄缺口时修生产代码；npm test 可运行时全绿。

### Knowledge
F-005（历史格式事实）、F-006、D-008、D-010、ADR-0024、当前 Stage Agent bridge 实现。

### STOP
需要读取/扫描 transcript、从宿主 session 猜身份、新增 Claude dispatch 或第二套控制面 → 停止回 build-plan。

### Done
AC-B-001/AC-B-002/AC-B-004 的实现边界、静态断言和失败语义已留证；运行契约测试与独立审查仍保持 `incomplete`/`unavailable`。

### Risks and rollback
RISK-P-02；宿主未提交结构化结果或绑定不匹配时只能记 `unavailable`/失败；无需 hooks，整批可 revert。

### Phase B3 执行汇总

- **实现**：T8 删除两条死约定；T9/T11 新增显式 identity、host outcome、Claude session 的契约测试与脱敏 fixture；T10/T12 因未发现可据此实施的生产缺口均为 `not_applicable`；T13 完成协议、术语和 README 对齐。
- **正式测试事实**：`quality/tests/t8-dead-convention.json` 与 `quality/tests/t13-doc-alignment.json` exit `0`；`quality/tests/t9-identity-outcome.json`、`quality/tests/t11-claude-outcome-packet.json` 与 `quality/tests/b3-identity-outcome-aggregate.json` exit `1`，均在收集阶段因任务 worktree 缺少 `ajv` 而为 0 tests；`npm test` 仍 exit `127`（`vitest: command not found`）。
- **静态事实**：新增测试/fixture 语法、JSON、move-map 与 `git diff --check` 通过；未新增 session/env/transcript fallback、Claude 专用 adapter、dispatch 或控制面。
- **阶段审查**：`wh-review` 已按 B3 执行一次，但加载 `runtime/evidence/freshness.mjs` 时因缺少 `ajv` 失败；状态 `unavailable`，无 findings，不称审查通过。
- **阶段复盘**：沿用已固定的 `quality/stage-reflection/build-code.json`，其状态为 `degraded`；未覆盖 immutable reflection，也未伪造 B3 新 ref。
- **下一步**：进入 B4/T14；先在当前 task 继续完成清单生成器与指标扫描的 RED/GREEN，保留本阶段测试环境缺口，待依赖恢复后重跑 T9/T11。

### T8：host-protocol 死约定删除

- **ID**：T8
- **Phase**：Phase B3 — 多 CLI 批
- **goal**：删除 skills/workflowhub-host-protocol/SKILL.md 第 75/76 行两条死约定
- **design_state**：designed
- **versioned_refs**：`specs/workflowhub-m17-repo-skills-multicli-20260903/spec.md@2c165e25`
- **输入**：D-008、G-001
- **依赖**：T7
- **并行**：不并行
- **FR**：FR-B-007
- **AC**：AC-B-004
- **动作**：删除两行死约定；grep 全仓确认两变量无生产消费者（留证）
- **精确文件**：`skills/workflowhub-host-protocol/SKILL.md`
- **boundary**：files: `skills/workflowhub-host-protocol/SKILL.md`
- **输出**：文档删除提交+grep 零引用留证
- **Knowledge**：两变量从未有代码兑现（F-004）
- **verification_role**：N/A — 非行为变更：文档删除
- **paired_task**：N/A — 非行为变更
- **gate_cmd**：`npm test`
- **expected_exit**：0
- **oracle**：两行不存在；grep 零生产引用记录入档
- **evidence_path**：quality/tests/t8-dead-convention.json
- **STOP**：grep 发现活消费者 → 停止回 build-plan（改裁定）
- **recovery**：git revert 恢复两行
- **task risk**：低

#### 执行状态填写区

- 状态：已执行（2026-09-05；非行为文档删除；质量事实不完整）
- 事实：已删除 `skills/workflowhub-host-protocol/SKILL.md` 中的 `WORKFLOWHUB_STAGE_RUN_INPUT_PATH` 与 `WORKFLOWHUB_CODEX_ROLLOUT_STARTED_AT` 两条死约定；保留仍有消费者的 `WORKFLOWHUB_STAGE_OUTCOME_PATH`。
- 验证：当前生产 roots（`runtime/`、`tools/`、`skills/`、`core/`、`workflows/`、`config/`）全文零引用；host-protocol 文件零引用；`node --check` 与 `git diff --check` 通过。
- 正式证据：`quality/tests/t8-dead-convention.json`，静态 oracle exit `0`；`npm test` 仍受任务 worktree 缺少 `vitest` 阻断，未宣称全绿。
- 偏差：无生产代码改动；按 main 已有 outcome bridge 保留 live `WORKFLOWHUB_STAGE_OUTCOME_PATH`，未扩大删除范围。

### T9：显式身份与 outcome bridge 契约回归验证

- **ID**：T9
- **Phase**：Phase B3 — 多 CLI 批
- **goal**：验证 FR-B-008/AC-B-002：显式 `--project/--task` 或认证 worktree 可定位任务；部分、冲突、缺失身份 fail-closed；Stage Agent bridge 要求完整显式绑定与 `agent_run_id`
- **design_state**：designed
- **versioned_refs**：`specs/workflowhub-m17-repo-skills-multicli-20260903/spec.md@2c165e25`
- **输入**：spec FR-B-008/AC-B-002；`docs/adr/0024-remove-host-session-binding.md`；当前 `stage-runtime.mjs` 与 Stage Agent bridge
- **依赖**：T8
- **并行**：不并行
- **FR**：FR-B-008
- **AC**：AC-B-002
- **动作**：新建契约测试，构造显式身份完整/部分/冲突/无认证 worktree 样例，以及 bridge 缺字段、缺 `agent_run_id`、绑定不一致样例；确认旧 session/env 不被读取
- **精确文件**：`tests/contract/host-outcome-bridge.test.mjs`
- **boundary**：files: `tests/contract/host-outcome-bridge.test.mjs`、`tests/fixtures/host-outcome/`
- **输出**：当前 main 契约回归结果；若暴露缺口，记录窄修复前基线
- **Knowledge**：ADR-0024 与当前 bridge 实现；旧 session/env/v2 仅为历史事实（D-010）
- **verification_role**：N/A — 当前 main 已有实现，先做独立契约验证
- **paired_task**：T10
- **gate_cmd**：`npx vitest run tests/contract/host-outcome-bridge.test.mjs`
- **expected_exit**：0
- **oracle**：显式身份完整路径通过；部分/冲突/无认证上下文 fail-closed；bridge 必须收到 `project_name/task_id/task_path/stage/attempt_id/agent_run_id`；不读取旧 session/env
- **evidence_path**：quality/tests/t9-identity-outcome.json
- **STOP**：无法在不引入宿主特定路径或隐式 session 的前提下验证 → 回 build-plan
- **recovery**：修正测试构造；若为生产缺口，先更新事实与窄修复边界
- **task risk**：低

#### 执行状态填写区

- 状态：已执行（2026-09-05；契约测试已落地，质量事实不完整）
- 事实：新增 `tests/contract/host-outcome-bridge.test.mjs` 与 `tests/fixtures/host-outcome/`，覆盖显式 `project/task`、认证 worktree、部分/缺失/冲突身份、旧 session/env 忽略、legacy `execution` 拒绝、缺 `agent_run_id` 与 `task_path` 绑定冲突。
- 路由事实：`test-routing-advisor` 重判为 `fullstack`；`backend-testing` 采用真实 identity resolver/host bridge 入口、失败边和临时 Git/task fixture。
- 正式证据：`quality/tests/t9-identity-outcome.json`，exit `1`；收集阶段因任务 worktree 缺少 `ajv`（`runtime/evidence/freshness.mjs`）而 0 tests，未宣称契约通过。
- 静态事实：`node --check tests/contract/host-outcome-bridge.test.mjs`、fixture/move-map JSON 解析与 `git diff --check` 通过；当前 main 已有 identity/bridge 邻接覆盖可供后续复核。
- 偏差：未引入 session/env/transcript fallback、Claude 专用控制面或生产修复；由于收集阻断，T10 不以本次测试失败推导生产缺口。
- 2026-09-05 重跑：完成 `npm ci --ignore-scripts` 后按同一 gate 通过 public `verify --action=execute` 重跑 `quality/tests/t9-identity-outcome-rerun.json`，exit `0`，7 tests passed，receipt hash `d2f0c5003efab8205b394a6294fcb522c0fd5e6e3cb1b693843ab90de53a4d60`；原始缺依赖 receipt 仍保留为历史事实。

### T10：显式身份/outcome 窄修复（按需）

- **ID**：T10
- **Phase**：Phase B3 — 多 CLI 批
- **goal**：仅当 T9 暴露当前 main 的真实契约缺口时，窄修显式身份或 bridge 校验；不得恢复旧 session/env/v2，也不得扩大 runtime 宿主边界
- **design_state**：designed
- **versioned_refs**：`specs/workflowhub-m17-repo-skills-multicli-20260903/spec.md@2c165e25`
- **输入**：T9 当前 main 回归结果与失败事实
- **依赖**：T9
- **并行**：不并行
- **FR**：FR-B-008
- **AC**：AC-B-002
- **动作**：默认无生产改动；若有明确缺口，只改 `stage-runtime.mjs`、Stage Agent bridge 或 outcome adapter 的最小边界，并补负例回归
- **精确文件**：`tools/host/workflowhub-stage-agent-bridge.mjs`
- **boundary**：files: `tools/host/workflowhub-stage-agent-bridge.mjs`、`runtime/stage/stage-agent-outcome-adapter.mjs`、`tools/cli/stage-runtime.mjs`
- **输出**：无缺口则 `not_applicable`；有缺口则窄修复+回归结果
- **Knowledge**：当前 main 已删除旧 session-state/event/hook；不得以旧实现或 transcript fallback 修复
- **verification_role**：N/A — 条件性窄修复，不预设生产缺口
- **paired_task**：T9
- **gate_cmd**：`npx vitest run tests/contract/host-outcome-bridge.test.mjs`
- **expected_exit**：0
- **oracle**：T9 契约通过；如有修复则正负例通过，且 `npm test` 可运行时全绿
- **evidence_path**：quality/tests/t10-identity-outcome-fix.json
- **STOP**：需要恢复旧 session/env/v2、读取 transcript、增加控制面或修改无关 runtime → 停止回 build-plan
- **recovery**：回退窄修复，保留 T9 失败事实
- **task risk**：中

#### 执行状态填写区

- 状态：不适用（2026-09-05；未发现可据此实施的生产缺口）
- 事实：T9 的失败发生在测试收集阶段（任务 worktree 缺 `ajv`），不构成生产行为失败；当前 main 的 identity resolver、bridge 拒绝 legacy `execution`/receipt、task-path 绑定均已有实现与邻接覆盖。
- 处置：不修改 `tools/cli/stage-runtime.mjs`、Stage Agent bridge 或 outcome adapter；保留 T9 exit `1` 与依赖缺失事实，后续环境恢复后由 T9 重跑确认。
- 证据：`quality/tests/t9-identity-outcome.json`；无 `quality/tests/t10-identity-outcome-fix.json`，避免用空 receipt 冒充窄修复。

### T11：Claude/宿主显式 outcome packet 契约回归验证

- **ID**：T11
- **Phase**：Phase B3 — 多 CLI 批
- **goal**：验证 FR-B-009/AC-B-001：Claude/宿主提交显式 `session` 或 `unavailable`，结果经现有 bridge 绑定 task/stage/attempt/snapshot/material；缺结果与绑定冲突保留失败语义
- **design_state**：designed
- **versioned_refs**：`specs/workflowhub-m17-repo-skills-multicli-20260903/spec.md@2c165e25`
- **输入**：spec FR-B-009；D-010；当前 Stage Agent bridge/outcome adapter；F-005 仅作历史事实
- **依赖**：T10
- **并行**：不并行
- **FR**：FR-B-009
- **AC**：AC-B-001
- **动作**：新建契约测试与脱敏 outcome fixture；覆盖有效 `session`、显式 `unavailable`、缺 outcome、错误 task/stage/attempt/snapshot/material、禁止 `execution`/receipt 输入
- **精确文件**：`tests/contract/claude-outcome-packet.test.mjs`
- **boundary**：files: `tests/contract/claude-outcome-packet.test.mjs`、`tests/fixtures/claude-outcome/`
- **输出**：当前 main 契约回归结果；不读取或生成 transcript bytes
- **Knowledge**：Claude 由宿主负责结构化结果；缺结果只能记 `unavailable`，不能反推
- **verification_role**：N/A — 当前 main 已有 bridge/outcome 接线，先做独立契约验证
- **paired_task**：T12
- **gate_cmd**：`npx vitest run tests/contract/claude-outcome-packet.test.mjs`
- **expected_exit**：0
- **oracle**：有效结果生成 `workflowhub-stage-outcomes.v1` 并绑定五类上下文；缺失/错误绑定/不允许字段 fail-closed；无 transcript 读取路径
- **evidence_path**：quality/tests/t11-claude-outcome.json
- **STOP**：测试需要 transcript、hook、目录探测或历史反查才能成立 → 回 build-plan
- **recovery**：修正 fixture，保留显式 outcome 语义
- **task risk**：低

#### 执行状态填写区

- 状态：已执行（2026-09-05；契约测试已落地，质量事实不完整）
- 事实：新增 `tests/contract/claude-outcome-packet.test.mjs` 与 `tests/fixtures/claude-outcome/`，覆盖显式 Claude `session`、缺 host result、task 绑定冲突及共享 bridge/schema 约束；测试 fixture 不读取或生成 transcript。
- 正式证据：`quality/tests/t11-claude-outcome-packet.json`，exit `1`；收集阶段因任务 worktree 缺少 `ajv`（`runtime/evidence/freshness.mjs`）而 0 tests，未宣称 outcome 契约通过。
- 静态事实：`node --check`、fixture/move-map JSON 解析与 `git diff --check` 通过；未引入 Claude 专用 adapter 或 dispatch。
- 偏差：完整 session→outcome 运行验证待依赖恢复后重跑；当前 main 的相邻 Stage Agent outcome 事实仍保留为参考，不替代本次 receipt。
- 2026-09-05 重跑：按同一 gate 通过 public `verify --action=execute` 重跑 `quality/tests/t11-claude-outcome-packet-rerun.json`，exit `0`，4 tests passed，receipt hash `8b0669b480346afa2523bfc7b87f639967faa07a0760aeb95c008bf79314b199`；contract fixture 已修正为合法 source identity 与 stage-end analyzer 最小事件，未引入 transcript。

### T12：Claude outcome bridge 接线窄修复（按需）

- **ID**：T12
- **Phase**：Phase B3 — 多 CLI 批
- **goal**：仅当 T11 暴露真实缺口时，窄修现有 bridge/outcome adapter 的显式 `session`/`unavailable` 校验与归一接线；不创建 Claude 专用适配器
- **design_state**：designed
- **versioned_refs**：`specs/workflowhub-m17-repo-skills-multicli-20260903/spec.md@2c165e25`
- **输入**：T11 当前 main 回归结果与失败事实
- **依赖**：T11
- **并行**：不并行
- **FR**：FR-B-009
- **AC**：AC-B-001
- **动作**：默认无生产改动；若有缺口，只改当前 bridge/outcome adapter 的最小验证边界，并补失败/恢复断言
- **精确文件**：`tools/host/workflowhub-stage-agent-bridge.mjs`
- **boundary**：files: `tools/host/workflowhub-stage-agent-bridge.mjs`、`runtime/stage/stage-agent-outcome-adapter.mjs`
- **输出**：无缺口则 `not_applicable`；有缺口则窄修复+回归结果
- **Knowledge**：D-010；runtime 不读宿主路径、不读 transcript，不增加第二 dispatch/control plane
- **verification_role**：N/A — 条件性窄修复，不预设生产缺口
- **paired_task**：T11
- **gate_cmd**：`npx vitest run tests/contract/claude-outcome-packet.test.mjs`
- **expected_exit**：0
- **oracle**：T11 契约通过；如有修复则 `workflowhub-stage-outcomes.v1` 绑定与失败语义通过，且 `npm test` 可运行时全绿
- **evidence_path**：quality/tests/t12-claude-outcome-fix.json
- **STOP**：需要 transcript 解析、宿主特定路径、第三套 dispatch/control plane 或永久兼容桥 → 停止回 build-plan
- **recovery**：回退窄修复，保留 T11 失败事实
- **task risk**：中

#### 执行状态填写区

- 状态：不适用（2026-09-05；未发现可据此实施的生产缺口）
- 事实：T11 仅在收集阶段受 `ajv` 缺失阻断，不能把环境失败推导为 bridge/outcome 生产缺口；当前 main 已有共享 `session`/`unavailable` 接线与绑定校验。
- 处置：不修改 bridge/outcome adapter，不创建 Claude 专用适配器；保留 T11 的失败 receipt，依赖恢复后由 T11 重跑。
- 证据：`quality/tests/t11-claude-outcome-packet.json`；无 `quality/tests/t12-claude-outcome-fix.json`。

### T13：文档对齐

- **ID**：T13
- **Phase**：Phase B3 — 多 CLI 批
- **goal**：协议/使用说明/目录职责文档同步显式身份、Stage Agent outcome bridge、Claude/宿主结果责任与本次簿记结论
- **design_state**：designed
- **versioned_refs**：`specs/workflowhub-m17-repo-skills-multicli-20260903/spec.md@2c165e25`
- **输入**：FR-B-010、T8/T9/T11/T12 最终口径
- **依赖**：T12
- **并行**：不并行
- **FR**：FR-B-010
- **AC**：AC-B-003
- **动作**：host-protocol SKILL.md 删除死约定并补显式 identity/outcome bridge 段；AGENTS.md/CONTEXT.md 术语与职责核对；README 使用说明核对
- **精确文件**：`skills/workflowhub-host-protocol/SKILL.md`
- **boundary**：files: `skills/workflowhub-host-protocol/SKILL.md`、`AGENTS.md`、`CONTEXT.md`、`README.md`
- **输出**：文档对齐改动（未提交）
- **Knowledge**：CONTEXT.md no-change 判定仅限术语（decision-log 文档结果节）
- **verification_role**：N/A — 非行为变更：文档对齐
- **paired_task**：N/A — 非行为变更
- **gate_cmd**：`npm test`
- **expected_exit**：0
- **oracle**：文档口径与实现一致（抽查：显式身份字段、outcome bridge 落点、宿主责任、删除项）
- **evidence_path**：quality/tests/t13-doc-alignment.json
- **STOP**：发现文档需改术语表实质内容 → 回 build-plan
- **recovery**：git revert 文档改动
- **task risk**：低

#### 执行状态填写区

- 状态：已执行（2026-09-05；文档对齐完成，质量事实不适用）
- 事实：`skills/workflowhub-host-protocol/SKILL.md`、`AGENTS.md`、`CONTEXT.md`、`README.md` 已统一显式身份、`session`/`unavailable` outcome、共享 bridge、旧 session/env/transcript 不作为身份来源，以及 Claude/宿主责任边界。
- 验证：T8 死约定零引用静态 receipt；文档范围 `git diff --check` 通过；无行为代码改动。
- 偏差：未提交 commit；commit/push/merge/archive/cleanup 均未执行，待用户明确授权与后续验收。

## Phase B4 — 留证验收批

### Goal
清单生成器、指标扫描、X 处置、CLI 映射文档与核实记录、归一契约测试与 Claude e2e、干净安装留档；十条验收逐条最小留证。

### Files
**NEW** `tools/cli/repo-skills-manifest.mjs`、`repo-skills.manifest.json`、`docs/cli-tool-mapping.md`、`docs/operations/codex-support-verification.md`、`docs/operations/claude-e2e-sample.md`、`docs/operations/clean-install-archive.md`、`tests/contract/repo-skills-manifest.test.mjs`、`tests/contract/metrics-enabled-report.test.mjs`、`tests/contract/cli-parity.test.mjs`、`tests/e2e/claude-outcome-packet.test.mjs`、`tests/fixtures/catalog-drift/`、`tests/fixtures/metrics-scan/`；**MODIFY** `skills/catalog.yaml`（metrics_enabled）、`tests/contract/`（checker 族）、`skills/wh-review/skill-bundle.json`、`skills/wh-review/scripts/third-review-host-config.mjs`、`skills/reuse-registry.md`、`docs/architecture/move-map.json`、`tools/architecture/clean-install.mjs`。
### Tasks
T14、T15、T16、T17、T18、T19、T20、T21

### Verify
两对 RED/GREEN；T20 parity+e2e；T21 存档可复现；npm test 全绿。

### Knowledge
PFACT-01/03/06、F-006、spec §11 十条验收口径。

### STOP
任一验收条无法留证 → 停止并如实记录缺口。

### Done
十条验收+AC-C-001 全部证据齐。

### Risks and rollback
RISK-S-03；留证从简防线。

### T14 RED：指标扫描报告测试先行

- **ID**：T14
- **Phase**：Phase B4 — 留证验收批
- **goal**：把 FR-A-002/AC-A-005 写成失败测试：metrics_enabled=false 的核心技能被报告、漏报即失败
- **design_state**：designed
- **versioned_refs**：`specs/workflowhub-m17-repo-skills-multicli-20260903/spec.md@2c165e25`
- **输入**：spec FR-A-002/AC-A-005；现有 checker 族形态
- **依赖**：T13
- **并行**：不并行
- **FR**：FR-A-002
- **AC**：AC-A-005
- **动作**：新建契约测试：构造含 false 核心技能的 catalog 样例，断言报告段列出且无漏报
- **精确文件**：`tests/contract/metrics-enabled-report.test.mjs`
- **boundary**：files: `tests/contract/metrics-enabled-report.test.mjs`、`tests/fixtures/metrics-scan/`
- **输出**：RED 测试（当前应失败）
- **Knowledge**：核心技能口径=五阶段入口+依赖闭包（spec FR-A-001）
- **verification_role**：RED
- **paired_task**：T15
- **gate_cmd**：`npx vitest run tests/contract/metrics-enabled-report.test.mjs`
- **expected_exit**：1
- **oracle**：AC-A-005 报告名单与登记逐条一致
- **evidence_path**：quality/tests/t14-metrics-red.json
- **STOP**：现有 checker 无挂接点 → 回 build-plan
- **recovery**：修正测试构造，保持 RED 语义
- **task risk**：低

#### 执行状态填写区

- 状态：已执行（RED 语义已捕获；测试依赖缺失，未把收集失败写成断言通过）

#### 执行事实

- 2026-09-05：新增 `tests/contract/metrics-enabled-report.test.mjs` 与 `tests/fixtures/metrics-scan/catalog.json`；测试覆盖 false 核心技能必报、false 非核心技能不误报、缺失声明不可静默漏报。
- 2026-09-05：按 T14 gate 捕获 `quality/tests/t14-metrics-red.json`，exit `1`；实际失败发生在测试收集阶段，任务 worktree 缺 `js-yaml`，因此尚未执行测试断言，RED 证据为 `incomplete`。
- **AC-A-005/T14**：失败测试与失败留证已产生；依赖恢复后必须重跑，不能用本次收集失败宣称 RED 断言已验证。
- 2026-09-05 重跑：依赖恢复后同一测试文件通过 public `verify --action=execute` 重跑 `quality/tests/t14-metrics-red-rerun.json`，exit `0`；该 receipt 是实现后的回归事实，不替代原始 RED receipt，原始 T14 RED 仍保留。

### T15 GREEN：指标扫描挂接实现

- **ID**：T15
- **Phase**：Phase B4 — 留证验收批
- **goal**：catalog 补 metrics_enabled 字段；现有 checker 增加报告段，使 T16 测试转绿
- **design_state**：designed
- **versioned_refs**：`specs/workflowhub-m17-repo-skills-multicli-20260903/spec.md@2c165e25`
- **输入**：T16 RED 测试
- **依赖**：T14
- **并行**：不并行
- **FR**：FR-A-002
- **AC**：AC-A-005
- **动作**：catalog 逐技能补 metrics_enabled；checker 报告段实现；扫描输出存档
- **精确文件**：`skills/catalog.yaml`
- **boundary**：files: `skills/catalog.yaml`、`tests/contract/`
- **输出**：GREEN 实现+扫描存档+npm test 全绿
- **Knowledge**：不新建控制面（D-005/宪法 F11）
- **verification_role**：GREEN
- **paired_task**：T14
- **gate_cmd**：`npx vitest run tests/contract/metrics-enabled-report.test.mjs`
- **expected_exit**：0
- **oracle**：AC-A-005 断言全部通过+扫描存档落盘
- **evidence_path**：quality/tests/t15-metrics-green.json
- **STOP**：需要新建独立扫描器 → 回 build-plan（违反复用裁定）
- **recovery**：回退到 T16 RED 修正构造
- **task risk**：低

#### 执行状态填写区

- 状态：已执行（实现已落地；GREEN 质量事实不完整）

#### 执行事实

- 2026-09-05：在现有 `runtime/evidence/check-skill-closure.mjs` 增加 `coreSkillNamesFromCatalog` 与 `buildMetricsEnabledReport`；核心集合按 `used_by_stages` 起始并沿 `dependency_closure` 闭包扩展，false 与缺失声明分别报告。
- 2026-09-05：`skills/catalog.yaml` 的 40 个技能条目补齐 `metrics_enabled`；有阶段消费者的技能为 `true`，无阶段消费者的独立/历史技能为 `false`，不扩展 capability_decisions。
- 2026-09-05：按 T15 gate 捕获 `quality/tests/t15-metrics-green.json`，exit `1`；同一任务 worktree 缺 `js-yaml`，测试 0 项执行，GREEN 结论保持 `incomplete`。
- **AC-A-005/T15**：实现静态与语义代码已落地，但当前没有可用的运行时 GREEN 证据；依赖恢复后重跑 T14/T15。
- 2026-09-05 重跑：按 T15 gate 通过 public `verify --action=execute` 产生 `quality/tests/t15-metrics-green-rerun.json`，exit `0`，2 tests passed，receipt hash `473aa67bc580a038d908e866e9767c6baa95de84a8259a6b0ca3db38fdc9159f`；随后补充真实 `runtime/evidence/check-skill-closure.mjs` catalog scan，产生 `quality/tests/t15-metrics-scan-rerun2.json`，exit `0`，receipt hash `a5454868664c46011da239ae45777cb87542131668fe339f5252732d4ede71a1`；T15 当前扫描确认核心技能无 disabled/missing metrics 声明，全量 `npm test` 仍受仓库既有失败项影响。

### T16 RED：清单生成器契约测试先行

- **ID**：T16
- **Phase**：Phase B4 — 留证验收批
- **goal**：把 FR-A-001/AC-A-002 写成失败测试：catalog→manifest 字段齐全、--check 漂移 diff 逐字段、口径唯一
- **design_state**：designed
- **versioned_refs**：`specs/workflowhub-m17-repo-skills-multicli-20260903/spec.md@2c165e25`
- **输入**：spec FR-A-001/AC-A-002；catalog.yaml 现状
- **依赖**：T15
- **并行**：不并行
- **FR**：FR-A-001
- **AC**：AC-A-002
- **动作**：新建契约测试：字段完整性、与 catalog 逐字段一致、构造漂移样例断言 diff 非零退出
- **精确文件**：`tests/contract/repo-skills-manifest.test.mjs`
- **boundary**：files: `tests/contract/repo-skills-manifest.test.mjs`、`tests/fixtures/catalog-drift/`
- **输出**：RED 测试（当前应失败）
- **Knowledge**：manifest 字段八项固定（roadmap M17a 产出物 2）
- **verification_role**：RED
- **paired_task**：T17
- **gate_cmd**：`npx vitest run tests/contract/repo-skills-manifest.test.mjs`
- **expected_exit**：1
- **oracle**：AC-A-002 字段可回溯+漂移检出断言
- **evidence_path**：quality/tests/t16-manifest-red.json
- **STOP**：catalog 字段缺失无法支撑八字段 → 回 build-plan
- **recovery**：修正测试构造，保持 RED 语义
- **task risk**：低

#### 执行状态填写区

- 状态：已执行（RED 断言已触发；随后进入 GREEN 实现）

#### 执行事实

- 2026-09-05：新增 `tests/contract/repo-skills-manifest.test.mjs` 与 `tests/fixtures/catalog-drift/catalog.yaml`；覆盖八字段映射、runtime 技能筛选和 `--check` 字段级漂移。
- 2026-09-05：按 T16 gate 捕获 `quality/tests/t16-manifest-red.json`，exit `1`；测试已收集并执行 2 项，因生成器尚不存在，两项均在生成命令 exit 断言处失败，符合 RED 语义。
- **AC-A-002/T16**：RED 测试断言已实际执行；漂移字段断言待生成器 GREEN 后复跑。

### T17 GREEN：清单生成器实现

- **ID**：T17
- **Phase**：Phase B4 — 留证验收批
- **goal**：实现 tools/cli/repo-skills-manifest.mjs（生成+--check diff），生成 repo-skills.manifest.json，使 T14 测试转绿
- **design_state**：designed
- **versioned_refs**：`specs/workflowhub-m17-repo-skills-multicli-20260903/spec.md@2c165e25`
- **输入**：T14 RED 测试
- **依赖**：T16
- **并行**：不并行
- **FR**：FR-A-001
- **AC**：AC-A-002
- **动作**：实现生成器；跑出生成物并提交；登记 move-map
- **精确文件**：`tools/cli/repo-skills-manifest.mjs`
- **boundary**：files: `tools/cli/repo-skills-manifest.mjs`、`repo-skills.manifest.json`、`docs/architecture/move-map.json`
- **输出**：GREEN 实现+清单生成物+npm test 全绿
- **Knowledge**：生成物可重建，catalog 是真相（spec §8）
- **verification_role**：GREEN
- **paired_task**：T16
- **gate_cmd**：`npx vitest run tests/contract/repo-skills-manifest.test.mjs`
- **expected_exit**：0
- **oracle**：AC-A-002 断言全部通过+生成物 --check diff 为空
- **evidence_path**：quality/tests/t17-manifest-green.json
- **STOP**：需要 catalog 结构扩容 → 回 build-plan
- **recovery**：回退到 T14 RED 修正构造
- **task risk**：低

#### 执行状态填写区

- 状态：已执行（生成器与生成物已落地；正式 GREEN 质量事实不完整）

#### 执行事实

- 2026-09-05：新增 `tools/cli/repo-skills-manifest.mjs`；只读取 `skills/catalog.yaml` 的 runtime 状态条目，按八字段映射生成 `repo-skills.manifest.json`，`--check` 输出字段级 diff 并以非零退出。
- 2026-09-05：生成 `repo-skills.manifest.json`，当前包含 36 个 native/adopted/adapted 技能条目；不把 absorbed/rejected/watch capability 记录混入打包清单。
- 2026-09-05：用隔离 loader 仅把已存在的 main `js-yaml` 依赖映射给生成器，验证 fixture 生成、无漂移 `--check` 和 `skills[0].version` 漂移均符合预期；该 loader 未进入仓库，任务 worktree 依赖仍未安装。
- 2026-09-05：按 T17 gate 捕获 `quality/tests/t17-manifest-green.json`，exit `1`；任务 worktree 缺 `js-yaml`，生成器未能启动，正式 GREEN 结论保持 `incomplete`。
- **AC-A-002/T17**：实现与生成物已落地，生成器隔离验证通过；依赖恢复后必须用仓内正式命令重跑并留新鲜 GREEN receipt。
- 2026-09-05 重跑：按 T17 gate 通过 public `verify --action=execute` 产生 `quality/tests/t17-manifest-green-rerun.json`，exit `0`，2 tests passed，receipt hash `14a8c3593076da617f10ee181d49d6fd8326342e1923aff433866a7798ab5d3d`；修正 generator 不应按 status 过滤 catalog 后，当前 manifest 生成 40 项，再产生 `quality/tests/t17-manifest-green-rerun2.json`，exit `0`，2 tests passed，receipt hash `f0058012808537ae36dc2b59645d0ffe71e3cec980654aebcd0e2d6ed9c2f63f`；生成器与 `--check` 的 focused GREEN 事实已恢复。


### T18：X2/X3/X4 处置

- **ID**：T18
- **Phase**：Phase B4 — 留证验收批
- **goal**：X3 补 engines 风格 semver 声明；X4 状态改标 adopted；X2 记录不引入
- **design_state**：designed
- **versioned_refs**：`specs/workflowhub-m17-repo-skills-multicli-20260903/spec.md@2c165e25`
- **输入**：FR-A-003、F-006（engines 风格/semver 区间/未知字段忽略）
- **依赖**：T17
- **并行**：不并行
- **FR**：FR-A-003
- **AC**：AC-A-003
- **动作**：wh-review skill-bundle/third-review-host-config 补 3rd-review 依赖声明+运行时探针报 unknown；X4 登记 adopted；X2 不引入记录落盘
- **精确文件**：`skills/wh-review/skill-bundle.json`
- **boundary**：files: `skills/wh-review/skill-bundle.json`、`skills/wh-review/scripts/third-review-host-config.mjs`、`skills/reuse-registry.md`
- **输出**：三处置记录+声明文件
- **Knowledge**：3rd-review broker 路径 ~/.workflowhub/config.json 引用（现状事实）
- **verification_role**：N/A — 非行为变更：声明与登记；探针仅报告
- **paired_task**：N/A — 非行为变更
- **gate_cmd**：`npm test`
- **expected_exit**：0
- **oracle**：声明存在且 engines 风格；X4=adopted；X2 不引入记录落盘；npm test 全绿
- **evidence_path**：quality/tests/t18-x-disposition.json
- **STOP**：声明需要改 broker 协议 → 回 build-plan
- **recovery**：git revert 声明改动
- **task risk**：低

#### 执行状态填写区

- 状态：已执行（声明、探针与登记已落地；正式全量测试质量事实不完整）

#### 执行事实

- 2026-09-05：`skills/wh-review/skill-bundle.json` 增加 `3rd-review-broker` 的 `runtime_dependencies` 声明，版本区间为 `>=1.2.0`；更新当前 bundle 内两项已漂移文件 hash，并同步 `skills/catalog.yaml` 的 `wh-review.local_bundle_hash`。
- 2026-09-05：`skills/wh-review/scripts/third-review-host-config.mjs` 增加 `probeThirdReviewBroker`；broker 只暴露 schema `version: 4`、未暴露 semver `engine_version` 时返回 `status: unknown`，不把 schema 版本冒充兼容通过；trusted config 同步带出 probe 事实。
- 2026-09-05：`skills/reuse-registry.md` 与 `docs/reuse-registry.md` 写入 X2 不引入、X3 独立 broker + unknown 探针、X4 `debate=adopted` 结论；新增 focused test 后共 26 项通过。
- 2026-09-05：按 T18 gate 捕获 `quality/tests/t18-x-disposition.json`，exit `127`；任务 worktree 无 `vitest`，因此 npm test 未执行，完整质量结论保持 `incomplete`。
- **AC-A-003/T18**：X 处置与声明事实已落地，T18 全量测试证据仍不完整；依赖恢复后重跑。
- 2026-09-05 重跑：通过 public `verify --action=execute` 产生 `quality/tests/t18-x-disposition-rerun.json`，exit `0`，26 tests passed，receipt hash `3a7d6d758f6eb20e884ed22a1b1e2e0c0ae233c8af4eab71263c386033d46a48`；补充 broker 有效 semver 的 compatible/incompatible 分支后，再产生 `quality/tests/t18-x-disposition-rerun2.json`，exit `0`，28 tests passed，receipt hash `823f07bffa59cf311a26a9ec578af69e67137139568de5bd37061bcb6a861d7c`；T18 focused 事实已恢复，但总 `npm test` 仍有仓库既有失败项。

### T19：CLI 映射文档+Codex 核实记录+Claude E2E 样例记录

- **ID**：T19
- **Phase**：Phase B4 — 留证验收批
- **goal**：docs/cli-tool-mapping.md（工具/权限/字段映射/缺失语义）+Codex 逐字段核实记录+Claude 端到端样例记录三份落盘
- **design_state**：designed
- **versioned_refs**：`specs/workflowhub-m17-repo-skills-multicli-20260903/spec.md@2c165e25`
- **输入**：FR-A-004、T12 outcome bridge 验证结果、本任务已产生的真实结果事实
- **依赖**：T18
- **并行**：不并行
- **FR**：FR-A-004
- **AC**：AC-B-003、AC-B-005、AC-B-001
- **动作**：mapping 文档逐项覆盖五段技能所需工具与字段；Codex 核实记录逐字段能/部分/暂不支持+降级；Claude E2E 样例记录（本任务真实会话为素材）
- **精确文件**：`docs/cli-tool-mapping.md`
- **boundary**：files: `docs/cli-tool-mapping.md`、`docs/operations/codex-support-verification.md`、`docs/operations/claude-e2e-sample.md`
- **输出**：三份文档落盘
- **Knowledge**：缺失语义约定（spec §8）；五段=五阶段技能
- **verification_role**：N/A — 非行为变更：文档记录
- **paired_task**：N/A — 非行为变更
- **gate_cmd**：`npm test`
- **expected_exit**：0
- **oracle**：mapping 覆盖核对无缺口；核实记录逐字段有结论；样例记录引用齐全
- **evidence_path**：quality/tests/t19-cli-mapping.json
- **STOP**：任一五段技能所需工具无法判定映射 → 如实记 unknown 并继续（不阻塞）
- **recovery**：补核后更新文档
- **task risk**：低

#### 执行状态填写区

- 状态：已执行（文档与字段核实记录已落地；真实 Claude E2E 与全量测试仍不完整）

#### 执行事实

- 2026-09-05：新增 `docs/cli-tool-mapping.md`、`docs/operations/codex-support-verification.md`、`docs/operations/claude-e2e-sample.md`，覆盖工具/权限/字段映射、unknown/unavailable/missing 语义、Codex 字段级结论及 Claude 可重放样例。
- 2026-09-05：Codex 记录确认显式 `--project/--task`、认证 worktree、`agent_run_id`、session/unavailable、snapshot/material 绑定均有当前代码锚点；旧 session/env/transcript fallback 记为不支持；3rd-review semver 因 broker 无 `engine_version` 记为暂不可核实。
- 2026-09-05：Claude 样例明确标记为结构化回放，不冒充真实 Claude CLI 会话；引用 T11 outcome-packet 测试和其 exit `1`/0 项/缺 `ajv` 事实。
- 2026-09-05：文档静态 gate 按 T19 捕获 `quality/tests/t19-cli-mapping.json`，exit `0`；`npm test` 按补充 receipt `quality/tests/t19-npm-test.json`，exit `127`，任务 worktree 无 `vitest`。
- **AC-B-003/AC-B-005/AC-B-001/T19**：映射与核实文档已齐；T19 本身未执行真实 Claude CLI，会话级结构化 packet e2e 在 T20 完成并单独留证。

### T20：CLI 归一契约测试+Claude 结果包 e2e

- **ID**：T20
- **Phase**：Phase B4 — 留证验收批
- **goal**：Codex/DSH parity 契约测试与 Claude outcome-packet e2e 落地；适配层无业务流程分叉扫描结论留证
- **design_state**：designed
- **versioned_refs**：`specs/workflowhub-m17-repo-skills-multicli-20260903/spec.md@2c165e25`
- **输入**：FR-A-005、T9/T11/T12 显式 identity/outcome 验证结果、T19 文档
- **依赖**：T19
- **并行**：不并行
- **FR**：FR-A-005
- **AC**：AC-A-004、AC-B-001、AC-B-002、AC-B-004
- **动作**：parity 测试断言两前端写入字段等价；Claude 结果包重放 e2e；适配层扫描（只含映射差异）结论留档
- **精确文件**：`tests/contract/cli-parity.test.mjs`
- **boundary**：files: `tests/contract/cli-parity.test.mjs`、`tests/e2e/claude-outcome-packet.test.mjs`
- **输出**：两个测试文件+扫描结论存档+全绿输出
- **Knowledge**：parity=Codex/DSH 同引擎两前端（spec FR-A-005）；Claude 走结果包重放
- **verification_role**：N/A — 非行为变更：新增特征化/契约测试，不改生产行为
- **paired_task**：N/A — 非行为变更
- **gate_cmd**：`npm test`
- **expected_exit**：0
- **oracle**：parity 等价断言+e2e 归一断言+扫描零分叉结论
- **evidence_path**：quality/tests/t20-cli-parity.json
- **STOP**：测试揭示真实行为分叉 → 停止回 build-plan（新发现）
- **recovery**：按揭示的分叉修生产或如实记录
- **task risk**：中

#### 执行状态填写区

- 状态：已执行（2026-09-05；T20 focused parity/e2e 通过；正式全量 gate exit `1`，保留既有仓库失败项）

#### 执行事实

- 2026-09-05：新增 `tests/contract/cli-parity.test.mjs`，以同一 `workflowhub-stage-agent-bridge` 重放 Codex/DSH 两个显式 identity packet，断言 canonical stage fields 归一后等价，并扫描 bridge 不含 CLI-specific business-flow 分支。
- 2026-09-05：新增 `tests/e2e/claude-outcome-packet.test.mjs`，重放 Claude structured outcome packet，经共享 bridge 写入 `workflowhub-stage-outcomes.v1`，再由官方 `build-code` route 消费；结果保持 `incomplete`，未把缺失质量事实改成通过。
- 2026-09-05：T20 focused gate `npx vitest run tests/contract/cli-parity.test.mjs tests/e2e/claude-outcome-packet.test.mjs` exit `0`，3 tests passed；初次 public receipt `quality/tests/t20-cli-parity.json` hash `ebc04eab7dd026f8aaeb544700640cf73e0b2c35ca2970011ea5cbe04ad340a8` 已留存；修正 T9/T11 fixture 与 catalog bundle hash 后，当前快照 rerun receipt `quality/tests/t20-cli-parity-rerun.json` hash `1e199cb7662414ab5c57acce1c316d233b94d4a9a2e75fb1b6af152c50549c90`，exit `0`，3 tests passed；修正 Claude E2E 改走公开 `stage-runtime run --action=execute`、unavailable 顶层 `agent_run_id` 后，最新 receipt `quality/tests/t20-cli-parity-rerun2.json` hash `a0dea610226205b5af6cb5efb6fb254689b235790987bfc5ad2709a71035a1bd`，exit `0`，3 tests passed。
- 2026-09-05：正式 `npm test` 完成，exit `1`；`217` test files 中 `2237` passed、`25` skipped、`10` failed，测试数为 `2275`，失败包含既有 close-sidecar/template、stage-reflection evidence、stage-runtime help、governance move-map，以及修正前的 T9/T11 fixture 收集失败；T20 新增测试在该全量运行中已通过。该结果不能写成全量 GREEN。
- **AC-A-004/AC-B-001/AC-B-002/AC-B-004/T20**：parity 与 Claude bridge→official consumer 链路已实际通过；focused receipt 已留存，全量 `npm test` 明确为 `incomplete/failed`，不影响将本阶段缺口如实交给后续验证。

### T21：干净安装留档+总验收

- **ID**：T21
- **Phase**：Phase B4 — 留证验收批
- **goal**：clean-install.mjs 跑一次存档（环境前置清单+命令+退出码+输出摘要）；十条验收+AC-C-001 逐项核对收口
- **design_state**：designed
- **versioned_refs**：`specs/workflowhub-m17-repo-skills-multicli-20260903/spec.md@2c165e25`
- **输入**：FR-A-006、全部前序卡结果
- **依赖**：T20
- **并行**：不并行（总验收最后跑）
- **FR**：FR-A-006
- **AC**：AC-A-001、AC-C-001
- **动作**：干净环境跑 clean-install 并存档；按 spec §11 逐条核对留证齐；缺口如实记录
- **精确文件**：`tools/architecture/clean-install.mjs`
- **boundary**：files: `tools/architecture/clean-install.mjs`、`docs/operations/clean-install-archive.md`
- **输出**：存档输出+十条验收核对表
- **Knowledge**：存档必须可由第三人按命令复现（spec AC-A-001）
- **verification_role**：N/A — 非行为变更：留档与核对
- **paired_task**：N/A — 非行为变更
- **gate_cmd**：`node tools/architecture/clean-install.mjs`
- **expected_exit**：0
- **oracle**：存档含前置清单/命令/退出码/输出摘要；十条验收逐条有留证
- **evidence_path**：quality/tests/t21-clean-install.json
- **STOP**：任一验收条缺证据 → 停止并如实记录缺口（禁止伪造）
- **recovery**：补留证后重跑核对
- **task risk**：低

#### 执行状态填写区

- 状态：已执行（2026-09-05；clean-install 全套检查通过；总验收仍保持 incomplete）

#### 执行事实

- 2026-09-05：首次按无参 gate 运行时发现 `parseArgs` 将四项检查默认置为 `false`，命令虽 exit `0` 但跳过 runner、skill bundle 与 layout 验证；这是 gate 语义缺口，未把该次结果当作通过。
- 2026-09-05：修正 `tools/architecture/clean-install.mjs`，无参 `node tools/architecture/clean-install.mjs` 默认执行四项完整检查；复跑 exit `0`，runner `118` 文件、skill bundle `116` 文件，五阶段依赖解析 `passed`，runner install `0`，隔离 bootstrap/doctor 均为 `0`，source tree 与 untracked audit 前后未改变。
- 2026-09-05：正式 public receipt `quality/tests/t21-clean-install.json` exit `0`，receipt hash `faa4cda53051eabd9eb896b7e1ddc6148052a6febbde221add0b4282eee33a93`；随后按不可变 receipt 规则用当前快照生成 `quality/tests/t21-clean-install-rerun.json`，exit `0`，receipt hash `21b995483e6787fff60ec81a4b59993808b1cc843312982470e87fe7ffd8fd06`，输出 hash `f03786988e14d6b2e216ad53aa5a5b40e5f1d96164bd7d7a867256807e9e4ba4`；复现与验收核对写入 `docs/operations/clean-install-archive.md`。
- 2026-09-05：最终文档/登记 hash 更新后再次直接执行无参命令，仍为完整检查 `passed`；`tests/integration/runner-clean-install.test.mjs` 5 tests passed，未产生新的 public receipt，避免把同一证据重复写成可覆盖记录。
- 2026-09-05：复核发现 clean-install 的 bootstrap/doctor 不是五阶段 task 样例；已在归档中改为明确记录，AC-A-001 保持 `incomplete`，不把发布/解析 smoke 伪装成核心流程证据。
- 2026-09-05：按 `test-routing-advisor` 对 T21 实际边界重判为 `fullstack`：`tools/architecture/clean-install.mjs` 同时覆盖 release 构建、安装、五阶段技能解析、隔离 task/bootstrap/doctor 与 source-tree 不变性；重判 JSON 为 `{"routing_tier":"fullstack","routing_rationale":"clean-install spans release packaging, installation, stage-skill resolution, isolated task bootstrap/doctor, and source-tree invariants","result":"pass","ts":"2026-09-05T03:39:58Z"}`。
- 2026-09-05：按 `backend-testing` 采用真实 runner release/install 与隔离 Git/task fixture；`node tools/architecture/clean-install.mjs` 完整检查通过，`npx vitest run tests/integration/runner-clean-install.test.mjs` exit `0`，5 tests passed。
- 2026-09-05：clean-install 临时根改为先 `realpath`；在 macOS `/var` symlink 环境下，已安装 CLI 现在实际执行，storage root 不再因 symlink 被错误拒绝。该修复只增强现有隔离布局检查，不新增 runtime 控制面。
- 2026-09-05：加入 stage-reflection fixture 与 Claude 探针事实后再次执行 `node tools/architecture/clean-install.mjs`，仍 exit `0`、`status=passed`；source tree hash `5c669e4a53a80ca4f9b4e3c9fbdc943387c6c16ab583def6a785b1a2eaa1799c`、untracked audit hash `ed0c23fb20786f3e476051d0c0a1fedf1e789cb716694317312a7a8730395442` 均前后保持不变。

### Build-code 独立审查与当前结论

- 2026-09-05：初轮可用的异源 `wh-review` 审查 material `dce53d...fc40`、runtime `36ec7d7d...03ad` 返回了 11 项 findings。其余 6 项已在当前快照修正：AC-B-002 改引当前 T9/T11/T20 rerun receipts；manifest generator 不再按 status 静默过滤 catalog；metrics report 接入真实 catalog checker；broker semver 有效时报告 compatible/incompatible；Claude E2E 改走公开 `stage-runtime run --action=execute`；unavailable fixture 与 bridge 统一使用顶层 `agent_run_id`。
- 2026-09-05：任务分支 fast-forward 合入最新 `main` `6090fbc5`；其上游 wh-review 修复增加 provider 材料宿主路径脱敏、身份降级时保留 broker 原始错误码，并补充 `material-redaction`/`simple-review-runner` 测试。该上游变更属于现有 review consumer 的加固，不改变 M17 FR/AC 或批次计划。
- 2026-09-05：当前快照的再次独立审查分别提交 45 项全量材料（material `c51a7534...d0ca`）和 26 项源码/测试材料（material `a6f4600d...0d19`），两次均因本机 3rd-review broker `PROCESS_TIMEOUT` 返回 `REVIEW_EXECUTION_TIMEOUT`，无可处置 findings；该结果保持 `unavailable`，不视为通过。
- 2026-09-05：修正合入 main 后暴露的四项当前契约漂移：session-binding 测试不再要求已由 main 删除的旧文件出现在未提交 diff；make-decision 文档补充新项目 `.gitignore` 模板引用；stage-runtime help 期望加入现行 `reflect` action；同步反思页两个 move-map bytes/hash。对应窄回归（M17 相关测试、身份/运行时/治理契约）14 个文件、99 项测试 exit `0`。
- 2026-09-05：独立审查指出多来源 catalog 原来只取 `upstream[0]`；已将 manifest 的 `origin_path`/`origin_framework` 固定为按登记顺序对齐的数组，补充 multi-origin fixture 与契约测试。wh-review 的 broker 依赖变更同步 bump 到 `4.1.0`，补 change note、bundle/catalog hash。
- 2026-09-05：独立审查指出 clean-install 归档把未执行的五阶段样例标为通过；已修正文档为 `AC-A-001=incomplete`，并保留已执行的发布/解析/bootstrap/doctor 事实。
- 2026-09-05：尝试用真实 `claude` CLI 在当前任务 worktree 执行最小 `repo-skills.manifest --check` 探针；CLI 返回 exit `1`、API `503`（`Pricing configuration is temporarily unavailable`），实际仓内命令未执行，故不能形成 Claude 真实阶段样例，AC-B-001 继续保持 `incomplete`。
- 2026-09-05：重试同一只读 Claude CLI 探针（CLI `2.1.251`，session `eeb1e5b6-85d9-4383-95ae-7f6b2e02ffcb`，Haiku fallback，预算 `$0.25`）仍 exit `1`、API `503`（`Pricing configuration is temporarily unavailable`），仓内命令未执行；该外部服务阻塞已再次确认，不把结构化回放样例改写成真实阶段通过。
- 2026-09-05：另以已登录 OAuth 的 `--safe-mode` 复试同一只读 Claude CLI 探针；约 `155s` 无终端结果且仓内命令未执行，已终止外部请求，记为 `unavailable`/无终态输出，不作为通过或新的 API 错误码。
- 2026-09-05：实际 `codex` CLI `0.151.0` 以 ephemeral/read-only 模式执行同一 `node tools/cli/repo-skills-manifest.mjs --check` 探针，session `01a07028-887b-7c90-9767-224b25cb6208` exit `0`；该结果证明 Codex CLI 可执行仓内检查，但不是五阶段核心流程样例，也不证明宿主前端已读取 manifest。
- 2026-09-05：实际 `codex` CLI `0.151.0` 以 ephemeral 模式启动官方五阶段 E2E 单用例，session `01a07031-734c-79f2-ae7d-9e6faaa53f02` exit `0`，`1 passed`、`23 skipped`、`80.24s`；隔离 fixture 创建 release/task 并执行五阶段 runtime。该证据证明 Codex CLI 可启动现行五阶段测试链，但不等于 Codex 自身完成业务任务或读取 manifest，AC-B-001 仍因 Claude 阶段样例缺失保持 `incomplete`。
- 2026-09-05：修复主线移除顶层 `quality/` 后遗留的 stage-reflection 契约测试路径：将 `quality/evidence/stage-reflection-ac-mapping.md` 改为仓内测试 fixture `tests/fixtures/stage-reflection/ac-mapping.md`，并登记 move-map；定向测试 `4` tests passed、exit `0`。该 fixture 明确不是运行时质量 receipt。
- 2026-09-05：修复后当前窄回归覆盖 M17 相关 bridge/manifest/parity/e2e/governance `7` 个文件、`27` tests passed，以及 stage-reflection 构造契约 `4` tests passed；manifest check、skill-closure、`git diff --check` 均 exit `0`。未执行 `test:safe` 或正式全量 `npm test`。
- 2026-09-05：针对主线遗留风险继续做窄验证：`tests/contract/review-materials-contract.test.mjs` `31/31` 通过；`tests/e2e/stage-reflection-real-task.test.mjs` `2/2` 通过（官方 bootstrap + stage-runtime 五阶段 fixture，`62.02s`）；close 相关 targeted checks `13/13` 通过，另有模板单测 `1/1` 通过。上述均未扩大为全量回归。
- 2026-09-05：最终窄回归仅覆盖受影响的 manifest/governance/repository 三个契约文件，`13` tests passed、exit `0`；`repo-skills.manifest --check`、skill-closure checker、`git diff --check` 均 exit `0`。未执行 `test:safe` 或正式全量 `npm test`。
- 仍需人工或后续任务处理的边界：按用户要求不再重跑正式全量 `npm test`；最近一次可核验全量结果仍为 exit `1`（10 个测试文件、13 项测试失败，2237 passed、25 skipped），后续当前快照全量尝试曾运行约 9 分钟无可读汇总后停止，未取得新的 exit code，因此不能覆盖既有失败事实。T20 parity 目前验证的是共享 bridge 的两种 packet，不是仓外真实 Codex/DSH CLI frontend；没有可用的真实 Claude CLI 阶段会话，AC-B-001 保持 `incomplete`；FR-C-017 的 Knowledge roadmap/progress 回写仍 `unavailable`。
- 当前 build-code 不进入 verify-code，也不作完成/发布结论；下一步补真实 Claude/CLI 与 Knowledge 外部事实，继续只跑窄测试和针对性审查；按用户确认不再执行 `test:safe`/`npm test` 全量回归，现有全量失败事实保留不覆盖。
- 2026-09-05：针对 transcript 边界补跑 `npx vitest run tests/dsh-transcript.test.mjs tests/m15-stage-outcome-stop-hook.test.mjs`，2 个文件、8 tests passed、exit `0`；确认当前生产路径不扫描/反查 transcript，DSH 解析器无活跃调用方，未做额外生产改动。
- 2026-09-05：补齐 T21 clean-install 的真实五阶段执行缺口：`tools/architecture/clean-install.mjs` 现在在临时 task 中写入四份当前材料，并用安装后的 Runner 依次调用五个 public `stage-runtime run --action=execute`；五次返回当前 stage、exit `0`，并写入至少五条质量 fact。该样例不调用 provider，质量缺失仍保持 `incomplete`/`unavailable`。
- 2026-09-05：T21 focused gate `npx vitest run tests/integration/runner-clean-install.test.mjs` exit `0`，1 个文件、5 tests passed，耗时 `67.49s`；新增断言确认 `run_from_installed_runner=true`、`stage_count=5`、五阶段顺序与退出码。按用户明确要求，未运行 `test:safe` 或 `npm test` 全量回归。
- 2026-09-05：按 `test-routing-advisor` 对本次 T21 变更分类为 `fullstack`：`{"routing_tier":"fullstack","routing_rationale":"clean-install spans release packaging, installation, stage-skill resolution, isolated task bootstrap, five public stage executions, and quality-fact persistence","result":"pass"}`；按 `backend-testing` 采用安装副本 Runner、隔离 Git/task fixture、逐阶段 exit/stage/quality-fact oracle，测试边界不包含 provider 或宿主前端。
- 2026-09-05：针对本次 clean-install 变更发起一次新的 `wh-review` build-code 异源审查；本机 broker 约 180 秒无输出，人工终止，记录为 `unavailable`/`REVIEW_CANCELLED`，无 findings，不能视为审查通过；此前当前快照审查的 `REVIEW_EXECUTION_TIMEOUT` 事实仍保留。
- 2026-09-05：同步更新 `docs/operations/clean-install-archive.md` 与 `docs/architecture/move-map.json`，归档明确区分“安装副本五阶段 public 路径可执行”与“受支持宿主实际完成业务任务”两层证据；AC-A-001 继续为 `incomplete`，plan 不在 build-code 阶段改写。
- 2026-09-05：按“先同步 main”规则，将任务分支 fast-forward 到 `main=248a7de36ab82fe0fb103f34a7e5a355da14006c`；上游新增 `wh-review` 跨项目 diff 投递绑定（实现/测试路径分类、预算内双类 fallback、manifest/packet-plan/diff-index 绑定与真实 unified hunk 校验）。该变更不改 M17 FR/AC 或批次顺序。
- 2026-09-05：main 同步后发现 `skills/catalog.yaml` 的 `wh-review.local_bundle_hash` 未跟随新的 `review-materials.mjs` 内容更新；已修为解析得到的 `c6d7801f99afa4df3130205048aefa3d156928fdc1fa92c26dac82bcc5aea364`，并同步 move-map。`node runtime/evidence/check-skill-closure.mjs`、`node tools/cli/repo-skills-manifest.mjs --check`、`git diff --check` 均 exit `0`。
- 2026-09-05：main 新增审查投递契约窄测 `npx vitest run tests/contract/review-materials-contract.test.mjs` exit `0`，1 个文件、38 tests passed，42.66s；不替代全量质量，也未运行 `test:safe`/`npm test`。
- 2026-09-05：main 同步后复核 `wh-review` bundle 的 catalog closure：初次发现 `catalog local_bundle_hash` 漂移，修复后 `node runtime/evidence/check-skill-closure.mjs` 返回 `ok=true`、核心技能 disabled/missing 均为空；同步更新 `docs/operations/codex-support-verification.md` 的基线与 move-map，避免证据文档继续指向旧 commit。
- 2026-09-05：依赖恢复后按原受影响边界补跑窄回归，未运行 `test:safe` 或 `npm test`：B1 static `./node_modules/.bin/vitest run tests/reuse-registry.test.mjs tests/skill-provenance-strict.test.mjs core/__tests__/check-skill-closure.test.mjs tests/contract/repository-governance.test.mjs --config vitest.config.mjs --root .` exit `0`，4 files/32 tests passed；B2 focused 原 aggregate 文件集 exit `0`，11 files/163 tests passed；B3 `tests/contract/host-outcome-bridge.test.mjs tests/contract/claude-outcome-packet.test.mjs` exit `0`，2 files/11 tests passed。该证据修正此前由 `ajv`/`js-yaml`/`vitest` 缺失造成的收集失败，但不覆盖历史全量失败事实，也不解除独立审查、真实 Claude/DSH frontend、Knowledge 回写和 AC-A-001/AC-C-001 的未完成边界。
- 2026-09-05：通过公开 `verify --action=execute --stage=build-code` 为上述三组窄回归补发不可变 receipt；三者均绑定 HEAD `248a7de36ab82fe0fb103f34a7e5a355da14006c`、snapshot tree `20586732258883fd7ffcea2f073ecd775e53bbf8`：`quality/tests/b1-static-rerun.json` exit `0`、receipt hash `c51fe445fbdbcab9fe1323f16e91b092f641c521f820e3e983be0449dc8fa023`；`quality/tests/b2-focused-rerun.json` exit `0`、receipt hash `bc8a31c1a3c5289cb04fc69bd3022a1e98e6df57268498045aa7ede2179cc1b4`；`quality/tests/b3-outcome-rerun.json` exit `0`、receipt hash `c4df679c03723471c06bd43bd8f6a90e9b64d08b42c05df81259e967214704f7`。receipt 只覆盖对应窄测试，不替代历史全量失败和外部事实缺口。
- 2026-09-05：再次执行真实 Claude CLI 只读探针（90 秒本地上限，仅请求 `node tools/cli/repo-skills.manifest.mjs --check`）；全程无 stdout，进程由本地 timeout 终止，exit `124`，未确认仓内命令执行。该次保持 `unavailable`/`incomplete`，并同步更新 `docs/operations/claude-e2e-sample.md`；不运行 `test:safe`/`npm test`。
- 2026-09-05：针对主线合入后历史失败族补跑 close/stage-reflection/preflight/governance 窄回归，并通过公开 `verify --action=execute --stage=build-code` 捕获 `quality/tests/post-main-contracts-rerun.json`；9 files/63 tests passed、exit `0`，绑定 HEAD `248a7de36ab82fe0fb103f34a7e5a355da14006c`、snapshot tree `4a8bd10200e29b8f57759979ff86a2629d04cc69`，receipt hash `f09381ad083022e3f343acfb4c80a2b32bdd6ba74406d41f73c583e7bdebfbb4`。该窄证据清除了对应可复现契约失败，但不替代历史全量失败或外部证据缺口。
- 2026-09-05：按实际 storage root `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub` 复核 Knowledge 回写边界；项目根没有当前 `roadmap.md`/`progress.md`，命中的均为其他任务或历史归档，FR-C-017 继续 `unavailable`；未改写历史/其他任务。
- 2026-09-05：补发当前 build-code 官方 `run --action=execute` 质量事实：实现快照 `quality/evidence/implementation/fc373f1d44a54626ff56274847f60deb9f9e096c394325c95498d0fcb62a70da.json`，复用已通过的 `quality/tests/b2-focused-rerun.json`；官方结果 `status=in_progress`、`quality_status=incomplete`，`risk_tests_fresh=satisfied`，其余 acceptance、stage-end spec-analyze、finding dispositions、integration review 仍缺失；stage outcome 与 stage reflection 分别为 `unavailable:stage_outcome_missing`、`unavailable:executor_absent`。该登记只发布真实事实，不把窄测或缺失审查改写成完成。
- 2026-09-05：为当前快照补跑单文件窄测 `tests/contract/repo-skills-manifest.test.mjs`，通过公开 `verify --action=execute` 生成 `quality/tests/build-code-current-narrow.json`，exit `0`，receipt hash `2ed0709f85a388fa1ed960d2eb089a9e4dcaae136507f390f747325aa4a0fd81`，snapshot tree `35f2576b951b299d284f0eb72797698e2479587c`；随后官方 build-code `run --action=execute` 复用该测试 receipt 与实现快照 `quality/evidence/implementation/ba536fe7d3b6d538bc39eb55d0b59f9ac5fe43b80793326e26bb522afac5dcd2.json`，结果仍为 `status=in_progress`、`quality_status=incomplete`，仅 `risk_tests_fresh=satisfied`，integration review 缺失；`stage_outcome=unavailable:stage_outcome_missing`、`stage_reflection=unavailable:executor_absent`。测试快照已对齐，未运行 `test:safe`/`npm test`。
- 2026-09-05：在追加上述记录后，再次用同一单文件测试生成当前材料快照 receipt `quality/tests/build-code-current-narrow-rerun.json`，exit `0`，receipt hash `b390f7094fbdcfcfed86ceaee26460d31fddd69848c64bf6c5cd20d0a5fc876d`，snapshot tree `e09e6c5a5ed2325d61e283c60edff8b9c71fee22`；官方 build-code `run --action=execute` 绑定实现快照 `quality/evidence/implementation/3e53d254ce1c51fdc0245e4d8a6b954cbd8a63a1803f6515d2847a54ef16b074.json` 与该测试 receipt，结果仍为 `status=in_progress`、`quality_status=incomplete`，仅 `risk_tests_fresh=satisfied`；acceptance、stage-end spec-analyze、finding dispositions、integration review 仍未满足，stage outcome/reflection 仍分别 `unavailable:stage_outcome_missing`/`unavailable:executor_absent`。

## Phase B5 — M17 当前质量事实补录

### Goal
不重做计划审查，不扩大 M17 生产实现。基于当前实现和已有 receipts，一次补齐五类缺失事实：acceptance criteria、stage-end spec-analyze、finding dispositions、integration review、stage outcome。

### Files
**READ/INVOKE** `tools/cli/stage-runtime.mjs`、`tools/host/workflowhub-stage-agent-bridge.mjs`、`runtime/stage/stage-runner.mjs`、`workflows/build-code/steps.json`、`workflows/build-code/skill-deps.yaml`
**MODIFY** `quality/facts/m17-acceptance-criteria.json`、`quality/facts/m17-stage-end-spec-analyze.json`、`quality/reviews/results/m17-finding-dispositions.json`、`quality/reviews/results/m17-integration-review.json`、`quality/evidence/stage-outcomes/build-code/<sha256>.json`（只追加当前事实）；不修改生产代码，不新增 public command、store、adapter、Knowledge writer 或 manifest 口径。

### Tasks
T22

### Verify
只做当前事实 readback 和必要的 public runtime/bridge 调用；不执行 `test:safe`、`npm test` 或其他全量回归。所有新增事实绑定当前 task、stage、attempt、snapshot、material revision；不可用原因原样保留。

### Knowledge
不新增 Knowledge 回写；只消费当前 task 已确认材料和既有 quality facts。

### STOP
需要恢复 transcript/session 推断、把 replay 当真实执行、修改生产代码、重复无效 provider 重试，或必须依赖全量回归才能继续时停止，保留 `incomplete/unavailable`。

### Done
五类事实均有当前绑定记录，或明确的 `unavailable` 记录；不把缺失事实改写成通过。若仍有缺失，M17 继续保持 `incomplete/not_released`。

### Risks and rollback
宿主、review provider 或阶段收尾执行器可能不可用；只追加不可变质量事实，不覆盖旧记录，不做 destructive cleanup。

### T22：M17 五类质量事实补录

- **ID**：T22
- **Phase**：Phase B5 — M17 当前质量事实补录
- **goal**：在不改生产代码、不重新设计计划审查的前提下，使用当前实现和已有 receipts 补齐五个 build-code 缺失质量主题
- **design_state**：designed
- **versioned_refs**：`decision-log.md@sha256:0fe95ef68caeb15dbd370cf14a9c83ad4e7aee8a8943e7139566483eae5d81d2；spec.md@sha256:c3ed30c51ee96026d4c358e734233173de522522f00f328c8eded31ca6c31249；plan.md/tasks.md 使用执行时的 current authenticated material_revision`
- **source_refs / decision_refs**：spec §8/§11；D-001；D-007；D-010；当前 tasks.md 已记录的 build-code status 与 receipts
- **输入**：当前四份材料、当前 status、B1-B4 已有实现/test/review facts、当前 task/stage/attempt/snapshot/material identity
- **依赖**：T21
- **并行**：不并行
- **FR**：FR-A-001~FR-C-017
- **AC**：AC-A-001~AC-C-001
- **动作**：读取当前 status 与已有 receipts 并复用仍绑定当前 identity 的事实；补逐项 acceptance criteria ledger；调用现有 `spec-analyze` stage-end 路由；逐条写 finding disposition（`accepted_risk` 必须绑定同一 finding 的人工授权）；调用现有 `phase_id=null` integration review；通过现有 public bridge/run 生成包含上述事实和真实缺失原因的当前 build-code stage outcome；不重跑全量测试、不另建控制面
- **精确文件**：`quality/facts/m17-acceptance-criteria.json`、`quality/facts/m17-stage-end-spec-analyze.json`、`quality/reviews/results/m17-finding-dispositions.json`、`quality/reviews/results/m17-integration-review.json`、`quality/evidence/stage-outcomes/build-code/<sha256>.json`
- **boundary**：只追加上述当前质量事实；不修改 `spec.md`、`plan.md`、生产代码、review broker、宿主 adapter 或历史记录
- **输出**：一份当前 acceptance criteria ledger、stage-end spec-analyze、逐条 finding dispositions、`phase_id=null` integration review、当前 stage outcome；不可用时输出完整绑定的 `unavailable`
- **Knowledge**：无
- **verification_role**：N/A — non-behavior: quality-fact supplementation
- **paired_task**：N/A — non-behavior: no implementation change
- **test tier/method**：report-only/readback + public runtime/bridge；不执行全量测试
- **scenarios**：五类事实全部可用；复用已有当前事实；宿主或 provider 不可用；旧 receipt/packet 身份过期；人工授权缺失
- **fixtures**：当前 task 的已有 quality facts、stage outcome 与 review fixtures 仅作协议核对
- **coverage limits**：不新增生产行为证明；fixture/replay 不能证明真实宿主执行；`unavailable` 不等于通过
- **gate_cmd**：`node tools/cli/stage-runtime.mjs status --action=begin --stage=build-code --project=workflowhub --task=workflowhub-m17-repo-skills-multicli-20260903`
- **expected_exit**：0
- **oracle**：五类主题均有当前 task/stage/attempt/snapshot/material 绑定；stage outcome 含 `acceptance_criteria`、`spec_analyze`、`finding_dispositions`、`integration_review`；integration review 的 `phase_id=null`；缺失保持 `missing/unavailable`；没有用空 findings 或旧 receipt 冒充完成
- **evidence_path**：`quality/evidence/stage-outcomes/build-code/<sha256>.json`、`quality/facts/`、`quality/reviews/results/`
- **STOP**：当前材料在执行中变化、packet 缺 identity、需要 transcript/replay 推断、provider 失败被要求改写为通过，或只能跑全量回归
- **recovery**：保留失败/不可用事实；仅在外部状态真实变化后新建 attempt；不覆盖旧 receipt、不回写历史
- **task risk**：中

#### 执行状态填写区

- 状态：待执行

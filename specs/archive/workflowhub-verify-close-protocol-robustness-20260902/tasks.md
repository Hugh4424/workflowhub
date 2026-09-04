# 任务卡：verify-code / close 执行协议健壮性改造

- **Input**：`specs/workflowhub-verify-close-protocol-robustness-20260902/decision-log.md`（accepted）、`specs/workflowhub-verify-close-protocol-robustness-20260902/spec.md`（当前修订版）、`specs/workflowhub-verify-close-protocol-robustness-20260902/plan.md`（当前修订版）
- **Template version**：`plan-task.v3`
- **卡片说明**：RED/GREEN 成对；每卡含执行状态填写区（唯一完成权威）；材料修订完成并验证前不得进入 build-code。

## Phase P0 — 基线核验

### Goal

确认改动锚点现状、现有相关测试清单、lessons 历史错误样例整理为 fixture 源。

### Files

- **NEW**：`tests/fixtures/protocol-errors/README.md`、`tests/fixtures/protocol-errors/build-code-schema.json`、`tests/fixtures/protocol-errors/build-code-acceptance-coverage.json`、`tests/fixtures/protocol-errors/verify-code-binding.json`、`tests/fixtures/protocol-errors/close-authorization.json`
- **MODIFY**：无（本阶段不改生产文件）
- **DO NOT TOUCH**：全部生产文件

### Tasks

- T001

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

#### T001 — 基线核验与样例整理

- **ID**：T001
- **Phase**：Phase P0 — 基线核验
- **goal**：直读确认四个改动锚点与既有绑定负例测试现状；把 lessons 历史错误样例整理为 fixture 来源索引。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-verify-close-protocol-robustness-20260902/spec.md","hash":"ff4dbd1eaa399b88d73229dcb2a44d0e6c089092c41aa320260017e761452c85","id":"SPEC"},{"artifact_kind":"plan","ref":"specs/workflowhub-verify-close-protocol-robustness-20260902/plan.md","hash":"9f76818b5e34cfaf76ea0ba7ef847160fe81c9c431fa9f069581099fc20a4931","id":"PLAN"}]`
- **source_refs / decision_refs**：D-002/D-010、F-001/F-002/F-003、PFACT-006 → FR-CLASS-003 / AC-CLASS-001；基线仅承载历史样例事实，不承载 retry/binding 方向
- **输入**：plan.md Code Anchors、两项目 lessons 三文件
- **依赖**：无
- **并行**：否 — 后续全部依赖
- **FR**：FR-CLASS-003
- **AC**：AC-CLASS-001
- **动作**：①直读 stage-runner.mjs 2200-2320、task-kernel-implementation.mjs 130-230、stage-runtime.mjs 540-570+840-900，确认与 plan 锚点一致，不一致则更新 plan；②确认 tests/integration/vnext-official-stage-run.test.mjs:997 绑定负例现状；③把 FR-CLASS-003 的 15 类错误逐条映射到 lessons 原始 entry_id，写 fixture 来源索引
- **精确文件**：`tests/fixtures/protocol-errors/README.md`、`tests/fixtures/protocol-errors/build-code-schema.json`、`tests/fixtures/protocol-errors/build-code-acceptance-coverage.json`、`tests/fixtures/protocol-errors/verify-code-binding.json`、`tests/fixtures/protocol-errors/close-authorization.json`
- **boundary**：files: `tests/fixtures/protocol-errors/README.md`、`tests/fixtures/protocol-errors/build-code-schema.json`、`tests/fixtures/protocol-errors/build-code-acceptance-coverage.json`、`tests/fixtures/protocol-errors/verify-code-binding.json`、`tests/fixtures/protocol-errors/close-authorization.json`；symbols: 无生产改动
- **输出**：索引文件+锚点核验结论（一致/差异清单）
- **Knowledge**：锚点行号以直读为准，plan 行号为撰写时快照
- **verification_role**：N/A — non-behavior change: 基线核验不改生产行为
- **paired_task**：N/A — recon 卡无 RED/GREEN 配对
- **gate_cmd**：`node -e "require('node:fs').accessSync('tests/fixtures/protocol-errors/README.md')"`
- **expected_exit**：0
- **oracle**：ORACLE-RECON — 15 类错误每类有 lessons entry_id 或源码派生标注
- **evidence_path**：`quality/tests/verify-close-protocol-p0-recon/gate.json`
- **STOP**：锚点与 plan 描述实质性不符（函数不存在/语义已变）→ 停止更新 plan 再继续
- **recovery**：以直读事实为准修订 plan.md
- **task risk**：行号漂移导致误判——以函数名/语义为准
- **test tier / test method**：simple — 人工核验+文件存在检查
- **scenarios / fixtures**：lessons 三文件逐条
- **coverage limits**：不验证任何运行行为

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：`tests/fixtures/protocol-errors/README.md`、`tests/fixtures/protocol-errors/build-code-schema.json`、`tests/fixtures/protocol-errors/build-code-acceptance-coverage.json`、`tests/fixtures/protocol-errors/verify-code-binding.json`、`tests/fixtures/protocol-errors/close-authorization.json`
- **executed_commands**：`node -e "const fs=require('node:fs'); const files=['tests/fixtures/protocol-errors/README.md','tests/fixtures/protocol-errors/build-code-schema.json','tests/fixtures/protocol-errors/build-code-acceptance-coverage.json','tests/fixtures/protocol-errors/verify-code-binding.json','tests/fixtures/protocol-errors/close-authorization.json']; files.forEach(f=>fs.accessSync(f)); files.filter(f=>f.endsWith('.json')).forEach(f=>JSON.parse(fs.readFileSync(f)))"` (exit 0); `git diff --check --no-index /dev/null tests/fixtures/protocol-errors/README.md` (exit 0); `node --input-type=module -e 'fixture JSON parse, UUID uniqueness, and 15-class mapping checks'` (exit 0)
- **evidence_refs**：fixture files in current worktree; exact historical entry IDs and error text preserved; portable provenance limitation recorded
- **covered_ac**：AC-CLASS-001 (partial: source inventory only; no runtime classification claim)
- **review_fact**：independent P0 fixture review recorded; provenance/class mapping findings fixed; no production behavior review applicable
- **completed_at**：2026-09-03T00:00:00Z
- **执行事实**：P0 已完成：核对四个运行时锚点和既有绑定负例入口；建立四个历史错误样例族，共 15 个历史条目与 15 个规范分类的逐项映射；close 六 check_id 中无历史样例的类别明确标记 runtime-derived；未修改生产代码。源 lessons 不在可移植 worktree，README 明确记录 source_line=null 与核验限制。session-event 在 DSH 宿主因无 codex session id 返回 unavailable，未伪造记录。

## Phase P1 — 错误分层核心

### Goal

白名单常量+分类器+诊断负载；仅对已获得合法 handler result 的 publication 阶段，在同一次 runStage 调用内最多进行一次纯 publication 重试；handler/LLM 不重跑。

### Files

- **NEW**：`runtime/stage/protocol-error-whitelist.mjs`、`tests/contract/protocol-error-classification.test.mjs`、`tests/integration/protocol-error-in-place-resend.test.mjs`
- **MODIFY**：`runtime/stage/stage-runner.mjs`、`docs/architecture/move-map.json`
- **DO NOT TOUCH**：runtime/schemas/（只读复用）、task-kernel、stage-runtime.mjs、质量判定语义

### Tasks

- T101
- T102
- T103
- T104

### Verify

两对 RED/GREEN 的命名 gate_cmd（见卡）全部按预期 exit；非回归命令独立记录真实 exit/timeout。

### Knowledge

fixture 文本取自 lessons 原文不得润色；分类默认分支=quality_failure。

### STOP

任何需要配置化白名单或放宽质量失败语义的实现 → 停止退回 spec。

### Done

15 类历史样例全判 protocol_error；未列名判 quality_failure；publication-only 重试五条状态不变量断言通过；既有套件绿；P2/P3/P4/P5 scope caveat 均如实记录。该完成条件仅在 T101~T104 实际执行并有独立证据后成立。

### Risks and rollback

匹配规则过宽吞掉质量错误；回滚=还原 stage-runner.mjs 与删除白名单模块。

#### T101 — RED：白名单与分类器契约

- **ID**：T101
- **Phase**：Phase P1 — 错误分层核心
- **goal**：用失败测试固定白名单完整枚举、分类规则与诊断负载形状，并为后续 publication-only retry 提供分类契约。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-verify-close-protocol-robustness-20260902/spec.md","hash":"ff4dbd1eaa399b88d73229dcb2a44d0e6c089092c41aa320260017e761452c85","id":"SPEC"},{"artifact_kind":"plan","ref":"specs/workflowhub-verify-close-protocol-robustness-20260902/plan.md","hash":"9f76818b5e34cfaf76ea0ba7ef847160fe81c9c431fa9f069581099fc20a4931","id":"PLAN"}]`
- **source_refs / decision_refs**：D-002/D-003/D-010、FND-DD02、PFACT-006 → FR-CLASS-001/002/003 / AC-CLASS-001、AC-EXEC-002、AC-EXEC-003
- **输入**：T001 索引、spec FR-CLASS-003 十五类枚举
- **依赖**：T001
- **并行**：否 — P1 首个 RED
- **FR**：FR-CLASS-001、FR-CLASS-002、FR-CLASS-003
- **AC**：AC-CLASS-001、AC-EXEC-002、AC-EXEC-003
- **动作**：写契约测试——①白名单常量逐项存在（verify-code 4 类+close 6 环节+build-code/build-plan 5 类，共 15 类，每类含错误标识/适用阶段/匹配规则/诊断模板）；②分类函数：15 个 lessons 重放 fixture 全部判为 protocol_error；③未列名新错误类型判为 quality_failure（专项）；④白名单为深冻结常量，无配置/环境变量读取路径；⑤诊断负载字段为 check_id/expected/actual
- **精确文件**：`tests/contract/protocol-error-classification.test.mjs`
- **boundary**：files: `tests/contract/protocol-error-classification.test.mjs`；symbols: 测试断言区；只读使用 P0 fixture，不改 fixture 或生产代码
- **输出**：稳定 RED（白名单模块不存在）
- **Knowledge**：fixture 文本取自 lessons 原文，不得润色改写
- **verification_role**：RED
- **paired_task**：T102
- **gate_cmd**：`npx vitest run tests/contract/protocol-error-classification.test.mjs`
- **expected_exit**：1
- **oracle**：ORACLE-CLASSIFY — 仅因白名单模块/分类器缺失失败
- **evidence_path**：`quality/tests/verify-close-protocol-p1-classify/gate.json`
- **STOP**：为通过而删减白名单条目或弱化未列名=quality_failure 断言；或把分类 RED 扩展成跨调用恢复机制 → 停止
- **recovery**：修正 fixture/断言；枚举分歧退回 spec
- **task risk**：fixture 与 lessons 原文漂移
- **test tier / test method**：feature — backend-testing（常量+分类器契约）
- **scenarios / fixtures**：15 类历史样例+1 个未列名新错误（只读使用 P0 fixture）
- **coverage limits**：不证明失败通道行为；只证明分类语义

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：`tests/contract/protocol-error-classification.test.mjs`
- **executed_commands**：`TERM=xterm npx vitest run tests/contract/protocol-error-classification.test.mjs`（exit 0，6 passed）
- **evidence_refs**：当前 worktree 的分类契约测试；RED 阶段缺失模块的失败事实保留在 `progress.md`
- **covered_ac**：AC-CLASS-001、AC-EXEC-002、AC-EXEC-003（分类契约；不声称 publication 行为）
- **review_fact**：独立 Standards/Spec 审查未发现该测试边界的有效缺口
- **completed_at**：2026-09-03T10:42:42Z
- **执行事实**：先写分类 RED 契约并观察缺失实现失败，随后由 T102 接入实现；当前命名 gate 绿，未列名错误仍归 `quality_failure`。

#### T102 — GREEN：白名单常量与分类器

- **ID**：T102
- **Phase**：Phase P1 — 错误分层核心
- **goal**：实现白名单常量模块与分类器，使 T101 通过；分类结果供 publication-only retry 使用，但不改变质量失败语义。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-verify-close-protocol-robustness-20260902/spec.md","hash":"ff4dbd1eaa399b88d73229dcb2a44d0e6c089092c41aa320260017e761452c85","id":"SPEC"},{"artifact_kind":"plan","ref":"specs/workflowhub-verify-close-protocol-robustness-20260902/plan.md","hash":"9f76818b5e34cfaf76ea0ba7ef847160fe81c9c431fa9f069581099fc20a4931","id":"PLAN"}]`
- **source_refs / decision_refs**：D-002/D-003/D-010、FND-DD02、PFACT-006 → FR-CLASS-001/002/003 / AC-CLASS-001、AC-EXEC-002、AC-EXEC-003
- **输入**：T101 RED
- **依赖**：T101
- **并行**：否 — RED/GREEN 串行
- **FR**：FR-CLASS-001、FR-CLASS-002、FR-CLASS-003
- **AC**：AC-CLASS-001、AC-EXEC-002、AC-EXEC-003
- **动作**：新建 runtime/stage/protocol-error-whitelist.mjs（深冻结常量：15 类条目+classify(error)→protocol_error|quality_failure+诊断负载构造，默认分支 quality_failure）；move-map 登记（唯一 consumer=stage-runner 失败通道与预检命令；owner=workflowhub-verify-close-protocol-robustness-20260902 build-code；删除条件=分层机制废弃）
- **精确文件**：`runtime/stage/protocol-error-whitelist.mjs`、`docs/architecture/move-map.json`
- **boundary**：files: `runtime/stage/protocol-error-whitelist.mjs`、`docs/architecture/move-map.json`；symbols: 新模块全区；不碰其他模块
- **输出**：T101 全绿
- **Knowledge**：常量必须深冻结；分类默认分支=quality_failure；publication retry 仅限已产生合法 handler result 后的同次纯 publication 阶段
- **verification_role**：GREEN
- **paired_task**：T101
- **gate_cmd**：`npx vitest run tests/contract/protocol-error-classification.test.mjs`
- **expected_exit**：0
- **oracle**：ORACLE-CLASSIFY（转绿且未列名断言保留）
- **evidence_path**：`quality/tests/verify-close-protocol-p1-classify/gate.json`
- **STOP**：需要引入配置/环境变量才能转绿 → 停止退回 spec
- **recovery**：还原两文件重来
- **task risk**：匹配规则过宽把质量错误吞进白名单
- **test tier / test method**：feature — backend-testing
- **scenarios / fixtures**：同 T101
- **coverage limits**：同 T101

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：`runtime/stage/protocol-error-whitelist.mjs`、`docs/architecture/move-map.json`
- **executed_commands**：`TERM=xterm npx vitest run tests/contract/protocol-error-classification.test.mjs`（exit 0，6 passed）；`node tools/cli/run-checks.mjs`（exit 0）
- **evidence_refs**：分类契约 6 tests；runtime checks 全部通过
- **covered_ac**：AC-CLASS-001、AC-EXEC-002、AC-EXEC-003
- **review_fact**：白名单深冻结、默认 `quality_failure`、无配置/环境覆盖；未扩大为恢复框架
- **completed_at**：2026-09-03T10:42:42Z
- **执行事实**：实现 15 个历史协议错误类加 1 个显式瞬态 publication 类；未知错误不重试。

#### T103 — RED：原地重发语义契约

- **ID**：T103
- **Phase**：Phase P1 — 错误分层核心
- **goal**：用失败测试固定同一次 runStage 调用内 publication-only retry 的五条状态不变量。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-verify-close-protocol-robustness-20260902/spec.md","hash":"ff4dbd1eaa399b88d73229dcb2a44d0e6c089092c41aa320260017e761452c85","id":"SPEC"},{"artifact_kind":"plan","ref":"specs/workflowhub-verify-close-protocol-robustness-20260902/plan.md","hash":"9f76818b5e34cfaf76ea0ba7ef847160fe81c9c431fa9f069581099fc20a4931","id":"PLAN"}]`
- **source_refs / decision_refs**：D-003、FND-S02 → FR-CLASS-001 / AC-EXEC-001
- **输入**：T102 分类器、stage-runner 失败通道现状
- **依赖**：T102
- **并行**：否
- **FR**：FR-CLASS-001
- **AC**：AC-EXEC-001
- **动作**：写集成测试——①verify-code 与 close 各有独立 publication 失败场景；②合法 handler result 后的白名单错误返回结构化诊断；③同一次 runStage 调用内纯 publication retry 最多一次并成功；④断言 handler/LLM 只调用一次；⑤断言同一执行/stage 身份、已成功步骤不重复执行、既有已认证结果字节不覆盖；⑥质量失败/unavailable 样例仍 incomplete 无放行（正向 fail-closed 验证）；⑦retry 失败不产生 repaired fact
- **精确文件**：`tests/integration/protocol-error-in-place-resend.test.mjs`
- **boundary**：files: `tests/integration/protocol-error-in-place-resend.test.mjs`；symbols: 断言区；不改生产代码
- **输出**：稳定 RED（失败通道无分层语义）
- **Knowledge**：既有 vnext-official-stage-run 集成测试必须保持绿；retry 只能复用已捕获的合法 handler result 与 publication inputs，不能重新执行 handler/LLM；失败 retry 不创建恢复 token 或 continuation
- **verification_role**：RED
- **paired_task**：T104
- **gate_cmd**：`npx vitest run tests/integration/protocol-error-in-place-resend.test.mjs`
- **expected_exit**：1
- **oracle**：ORACLE-RESEND — 仅因分层/原地重发语义缺失失败
- **evidence_path**：`quality/tests/verify-close-protocol-p1-resend/gate.json`
- **STOP**：为满足断言而放宽质量失败样例语义 → 停止
- **recovery**：修正断言；语义分歧退回 spec
- **task risk**：测试误把整轮重跑后成功当同次 publication retry——必须断言 handler/LLM 次数、调用身份与 publication 次数
- **test tier / test method**：feature — backend-testing（集成）
- **scenarios / fixtures**：verify-code/close 重放+质量失败正向样例
- **coverage limits**：不证明绑定派生（P2）与预检（P4）

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：`tests/integration/protocol-error-in-place-resend.test.mjs`
- **executed_commands**：`TERM=xterm npx vitest run tests/integration/protocol-error-in-place-resend.test.mjs`（exit 0，3 passed）
- **evidence_refs**：同次 publication retry 集成契约；handler/LLM 单次调用断言
- **covered_ac**：AC-EXEC-001（状态不变量与 fail-closed 正向样例）
- **review_fact**：RED 阶段先验证旧失败通道未使用 publication seam；后续 seam 收窄为真实 publisher 拦截器
- **completed_at**：2026-09-03T10:42:42Z
- **执行事实**：测试固定同次、最多一次纯 publication retry；不证明正式 verify-code provider 通过。

#### T104 — GREEN：失败通道分层改造

- **ID**：T104
- **Phase**：Phase P1 — 错误分层核心
- **goal**：stage-runner 失败通道接入分类器：仅在合法 handler result 后的 publication 失败中允许同次最多一次纯 publication retry；其他失败保持现状。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-verify-close-protocol-robustness-20260902/spec.md","hash":"ff4dbd1eaa399b88d73229dcb2a44d0e6c089092c41aa320260017e761452c85","id":"SPEC"},{"artifact_kind":"plan","ref":"specs/workflowhub-verify-close-protocol-robustness-20260902/plan.md","hash":"9f76818b5e34cfaf76ea0ba7ef847160fe81c9c431fa9f069581099fc20a4931","id":"PLAN"}]`
- **source_refs / decision_refs**：D-003、FND-S02 → FR-CLASS-001 / AC-EXEC-001
- **输入**：T103 RED
- **依赖**：T103
- **并行**：否
- **FR**：FR-CLASS-001
- **AC**：AC-EXEC-001
- **动作**：stage-runner 对已产生合法 handler result 后的 publication 失败过 classify()；protocol_error→携带诊断负载并用同次捕获 inputs 最多纯 publication retry 一次；handler/LLM 不重跑；retry 成功后交给既有 trace hook；quality_failure 与 handler/pre-handler 错误保持现状语义；既有测试全绿
- **精确文件**：`runtime/stage/stage-runner.mjs`
- **boundary**：files: `runtime/stage/stage-runner.mjs`；symbols: 失败通道分层钩子；verify-code 绑定分支属 P2 不在此动
- **输出**：T103 全绿+既有测试绿
- **Knowledge**：失败通道改动不得触碰质量判定与调度序列
- **verification_role**：GREEN
- **paired_task**：T103
- **gate_cmd**：`npx vitest run tests/integration/protocol-error-in-place-resend.test.mjs`
- **expected_exit**：0
- **oracle**：ORACLE-RESEND（重发契约须真实 exit 0；官方 Stage Agent 非回归单独执行并记录真实 exit/timeout，无关套件不作为本卡绿色依据）
- **evidence_path**：`quality/tests/verify-close-protocol-p1-resend/gate.json`
- **STOP**：需要改质量判定/调度语义才能转绿 → 停止退回 spec
- **recovery**：还原 stage-runner.mjs 重来
- **task risk**：分层钩子误拦正常质量失败
- **test tier / test method**：feature — backend-testing（集成）
- **scenarios / fixtures**：同 T103
- **coverage limits**：同 T103

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：`runtime/stage/stage-runner.mjs`
- **executed_commands**：`TERM=xterm npx vitest run tests/contract/protocol-error-classification.test.mjs tests/contract/protocol-error-trace.test.mjs tests/integration/protocol-error-in-place-resend.test.mjs`（exit 0，14 passed）
- **evidence_refs**：P1/P5 focused publication、classification、trace tests
- **covered_ac**：AC-EXEC-001、AC-EXEC-002、AC-EXEC-003
- **review_fact**：保持 quality failure/unavailable 不放行；append/index 失败按 D-016 原有 writer 错误 fail-loud
- **completed_at**：2026-09-03T10:42:42Z
- **执行事实**：合法 handler result 后只进入 publication-only retry；handler/LLM 不重跑，失败不伪造 repaired fact。

## Phase P2 — verify-code 绑定自动化

### Goal

quality_review_ref 由 runtime 从当前已认证 Stage Agent outcome 中唯一 canonical dsh-code-review pair 派生；host 值只作等值断言；不扩展 review schema/storage。

### Files

- **NEW**：`tests/contract/verify-code-binding-derivation.test.mjs`
- **MODIFY**：`runtime/stage/stage-runner.mjs`
- **DO NOT TOUCH**：dsh-code-review 技能、wh-review、review 存储

### Tasks

- T201
- T202

### Verify

绑定契约 gate_cmd（见卡）按预期 exit。

### Knowledge

派生只在发布瞬间写新 outcome，不回写旧 outcome；该目标只有 T201/T202 完成并有当前 authenticated outcome fixture 证据后才可宣称。

### STOP

任何允许 host 值覆盖派生值的实现 → 停止。

### Done

正向从当前已认证 Stage Agent outcome 派生精确相等+close 消费同值；缺失/认证失败/缺完整 pair/无法唯一确定 canonical dsh-code-review 均诊断拒绝不派生；host 值两条路径正确。该完成条件仅在 T201/T202 实际执行并有契约证据后成立。

### Risks and rollback

已认证 outcome 声明错误或派生 pair 不完整；回滚=还原 verify-code 分支到三 throw 现状。

#### T201 — RED：绑定派生契约

- **ID**：T201
- **Phase**：Phase P2 — verify-code 绑定自动化
- **goal**：用失败测试固定派生规则、消歧规则与 host 值处置。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-verify-close-protocol-robustness-20260902/spec.md","hash":"ff4dbd1eaa399b88d73229dcb2a44d0e6c089092c41aa320260017e761452c85","id":"SPEC"},{"artifact_kind":"plan","ref":"specs/workflowhub-verify-close-protocol-robustness-20260902/plan.md","hash":"9f76818b5e34cfaf76ea0ba7ef847160fe81c9c431fa9f069581099fc20a4931","id":"PLAN"}]`
- **source_refs / decision_refs**：D-005/D-012、FND-D04、FND-DD03、FND-S03、FND-P01 → FR-BIND-001/002 / AC-BIND-001/002
- **输入**：T104、spec FR-BIND-001/002
- **依赖**：T104
- **并行**：否 — P2 单链
- **FR**：FR-BIND-001、FR-BIND-002
- **AC**：AC-BIND-001、AC-BIND-002
- **动作**：写契约测试——①host 不提供 ref：runtime 从当前已认证、current/completed 的 verify-code Stage Agent outcome 唯一派生 canonical dsh-code-review ref/hash，close 消费同值；②缺 outcome、认证失败、缺 ref/hash、不完整 pair 或无法唯一确定 canonical dsh review → 诊断拒绝且不派生；③host 提供一致 ref→幂等接受；④host 提供不一致 ref→诊断拒绝（期望=outcome 派生值，实际=提供值），派生值不被覆盖；⑤既有绑定负例（vnext-official-stage-run:997）语义保持拒绝；不枚举 review 目录、不选择 latest、不扩展 review schema/storage
- **精确文件**：`tests/contract/verify-code-binding-derivation.test.mjs`
- **boundary**：files: `tests/contract/verify-code-binding-derivation.test.mjs`；symbols: 断言区；不改生产代码
- **输出**：稳定 RED（派生逻辑不存在）
- **Knowledge**：派生只在发布瞬间写新 outcome，不回写旧 outcome；该目标只有 T201/T202 完成并有当前 authenticated outcome fixture 证据后才可宣称
- **verification_role**：RED
- **paired_task**：T202
- **gate_cmd**：`npx vitest run tests/contract/verify-code-binding-derivation.test.mjs`
- **expected_exit**：1
- **oracle**：ORACLE-BIND — 仅因派生/消歧逻辑缺失失败
- **evidence_path**：`quality/tests/verify-close-protocol-p2-bind/gate.json`
- **STOP**：为通过而允许 host 值覆盖派生值 → 停止
- **recovery**：修正断言；规则分歧退回 spec
- **task risk**：当前 authenticated outcome 结构未能唯一确定 canonical dsh-code-review；遇到缺失/不完整/歧义必须拒绝，不可回退到 review 目录选择记录
- **test tier / test method**：feature — backend-testing
- **scenarios / fixtures**：正向 1+负向（缺失 outcome/认证失败/缺失或不完整 pair/非 canonical pair）+host 值 2；不把 review-directory 记录作为 fixture source
- **coverage limits**：不证明 dsh-code-review 本身质量

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：`tests/contract/verify-code-binding-derivation.test.mjs`
- **executed_commands**：`TERM=xterm npx vitest run tests/contract/verify-code-binding-derivation.test.mjs`（exit 0，6 passed）
- **evidence_refs**：当前绑定派生契约；host omission/equal/conflict、缺失 pair、attempt ref 负例
- **covered_ac**：AC-BIND-001、AC-BIND-002
- **review_fact**：host-conflict 单例在原实现已具备拒绝语义，未伪造为 RED；派生缺失/不完整路径先失败后修复
- **completed_at**：2026-09-03T10:42:42Z
- **执行事实**：绑定 RED 的有效缺口是 outcome 派生和完整 pair；当前契约 gate 通过。

#### T202 — GREEN：绑定派生实现

- **ID**：T202
- **Phase**：Phase P2 — verify-code 绑定自动化
- **goal**：改造 verify-code 分支为从**成功认证的当前 Stage Agent outcome**直接派生其唯一 canonical dsh-code-review pair + host 等值诊断处置，使 T201 通过；不枚举 review 目录、不选择 latest、不扩展 review schema/storage。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-verify-close-protocol-robustness-20260902/spec.md","hash":"ff4dbd1eaa399b88d73229dcb2a44d0e6c089092c41aa320260017e761452c85","id":"SPEC"},{"artifact_kind":"plan","ref":"specs/workflowhub-verify-close-protocol-robustness-20260902/plan.md","hash":"9f76818b5e34cfaf76ea0ba7ef847160fe81c9c431fa9f069581099fc20a4931","id":"PLAN"}]`
- **source_refs / decision_refs**：D-005/D-012、FND-D04、FND-DD03、FND-S03、FND-P01 → FR-BIND-001/002 / AC-BIND-001/002
- **输入**：T201 RED
- **依赖**：T201
- **并行**：否
- **FR**：FR-BIND-001、FR-BIND-002
- **AC**：AC-BIND-001、AC-BIND-002
- **动作**：stage-runner verify-code 分支改造：认证当前 Stage Agent outcome 后，从其中唯一 canonical dsh-code-review ref/hash 派生 quality_review binding；host 值一致=幂等、不一致=诊断拒绝；删除 host 必须提供对齐 ref 前提；缺 outcome/认证失败/缺完整 pair 时不派生并保持 fail-closed；不修改 review schema/storage
- **精确文件**：`runtime/stage/stage-runner.mjs`
- **boundary**：files: `runtime/stage/stage-runner.mjs`；symbols: verify-code 绑定分支；失败通道其余部分不动
- **输出**：T201 全绿+既有测试绿
- **Knowledge**：派生源=成功认证的当前 Stage Agent outcome；必须通过当前 task/stage/snapshot/material/manifest/step/skill 认证并提供唯一完整 canonical dsh-code-review ref/hash；不读取 review 目录、不选 latest；stageOutcome.value=null 或认证失败时绝不合成 pair
- **verification_role**：GREEN
- **paired_task**：T201
- **gate_cmd**：`npx vitest run tests/contract/verify-code-binding-derivation.test.mjs`
- **expected_exit**：0
- **oracle**：ORACLE-BIND（绑定契约须真实 exit 0；官方 Stage Agent 非回归单独执行并记录真实 exit/timeout）
- **evidence_path**：`quality/tests/verify-close-protocol-p2-bind/gate.json`
- **STOP**：需要改审查记录认证语义才能转绿 → 停止退回 spec
- **recovery**：还原分支到三 throw 现状重来
- **task risk**：stageOutcome.value 为 null 时被错误当作 review candidate，或已认证 outcome 的 dsh-code-review pair 不完整；回滚=还原 verify-code 分支到原有拒绝语义
- **test tier / test method**：feature — backend-testing
- **scenarios / fixtures**：同 T201
- **coverage limits**：同 T201

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：`runtime/stage/stage-runner.mjs`、`runtime/stage/stage-agent-outcome-adapter.mjs`、`tests/integration/vnext-official-stage-run.test.mjs`
- **executed_commands**：`TERM=xterm npx vitest run tests/contract/verify-code-binding-derivation.test.mjs`（exit 0，6 passed）；目标 official-stage slice（exit 0，12 passed）
- **evidence_refs**：authenticated current build-code outcome、producer/run identity、sibling handling、verify-code derived review tests
- **covered_ac**：AC-BIND-001、AC-BIND-002
- **review_fact**：canonical completed result ref 收紧；optional invalid outcome 保持 unavailable/incomplete，不伪造质量通过
- **completed_at**：2026-09-03T10:42:42Z
- **执行事实**：runtime 从 authenticated outcome 派生 ref/hash；host 只作等值断言；未枚举 review 目录或扩展 review schema/storage。

## Phase P3 — close 诊断

### Goal

resolved-review 授权校验链首个失败输出结构化诊断（六个 check_id 按既有固定顺序；不做聚合）；physical close 五项不可逆授权链不改。

### Files

- **NEW**：`tests/contract/close-authorization-diagnostics.test.mjs`
- **MODIFY**：`runtime/task/task-kernel-implementation.mjs`
- **DO NOT TOUCH**：校验标准本身、authorize 公共行为语义、`core/task-close.mjs` physical close 五项操作

### Tasks

- T301
- T302

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

#### T301 — RED：close 诊断契约

- **ID**：T301
- **Phase**：Phase P3 — close 诊断
- **goal**：用失败测试固定 resolved-review 六个逻辑桶的首个失败诊断 wire contract。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-verify-close-protocol-robustness-20260902/spec.md","hash":"ff4dbd1eaa399b88d73229dcb2a44d0e6c089092c41aa320260017e761452c85","id":"SPEC"},{"artifact_kind":"plan","ref":"specs/workflowhub-verify-close-protocol-robustness-20260902/plan.md","hash":"9f76818b5e34cfaf76ea0ba7ef847160fe81c9c431fa9f069581099fc20a4931","id":"PLAN"}]`
- **source_refs / decision_refs**：D-003/D-014、FND-S05、PFACT-003 → FR-DIAG-001 / AC-DIAG-001
- **输入**：T104、spec §7 诊断负载契约
- **依赖**：T104
- **并行**：可与 P2 并行（不同文件）— 是
- **FR**：FR-DIAG-001
- **AC**：AC-DIAG-001
- **动作**：写契约测试——通过现有 kernel publishVNextQualityFact seam 构造六个逻辑桶各一个失败样例（bind_outcome/outcome_ref/outcome_current/review_binding/review_identity/finding_coverage），为后续桶补齐所有前置有效的 authenticated outcome/review/finding fixture；断言：①错误保留原有 Error/TypeError 类别与消息匹配，并附非枚举、冻结的 error.diagnostic（字段为 check_id/expected/actual）；②按既有 fail-fast 顺序只返回第一个诊断，后续依赖读取不发生；③校验标准未放宽（每个样例仍失败，只是诊断化）；④physical close 现有回归继续通过且不调用该 resolved-review validator
- **精确文件**：`tests/contract/close-authorization-diagnostics.test.mjs`
- **boundary**：files: `tests/contract/close-authorization-diagnostics.test.mjs`；symbols: 断言区；不改生产代码；physical close 五项操作保持只读
- **输出**：稳定 RED（诊断结构不存在）
- **Knowledge**：check_id 六值与顺序以 spec §7 为唯一权威；实现只返回既有 fail-fast 顺序的首个诊断，不聚合后续依赖检查
- **verification_role**：RED
- **paired_task**：T302
- **gate_cmd**：`npx vitest run tests/contract/close-authorization-diagnostics.test.mjs`
- **expected_exit**：1
- **oracle**：ORACLE-DIAG — 命名诊断契约必须以可归因失败为 RED；物理 close 回归另行执行并记录真实结果，不得将无关失败归因于诊断缺失
- **evidence_path**：`quality/tests/verify-close-protocol-p3-diag/gate.json`
- **STOP**：为通过而让任一环节样例变成通过 → 停止（那是放宽校验）
- **recovery**：修正断言
- **task risk**：诊断化误改判定逻辑
- **test tier / test method**：feature — backend-testing
- **scenarios / fixtures**：六个逻辑桶失败样例+依赖前置失败时只返回首个诊断样例
- **coverage limits**：不证明授权通过路径（既有测试覆盖）

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：`tests/contract/close-authorization-diagnostics.test.mjs`
- **executed_commands**：`TERM=xterm npx vitest run tests/contract/close-authorization-diagnostics.test.mjs`（exit 0，7 passed）
- **evidence_refs**：六个 check_id 首失败样例加合法 resolution 回归
- **covered_ac**：AC-DIAG-001
- **review_fact**：断言保留原 Error/TypeError 和消息；诊断非枚举、冻结；未聚合后续失败
- **completed_at**：2026-09-03T10:42:42Z
- **执行事实**：RED 先固定六桶 wire contract，当前诊断契约 gate 通过。

#### T302 — GREEN：授权链诊断化

- **ID**：T302
- **Phase**：Phase P3 — close 诊断
- **goal**：task-kernel 授权链 throw 统一改抛结构化诊断，使 T301 通过。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-verify-close-protocol-robustness-20260902/spec.md","hash":"ff4dbd1eaa399b88d73229dcb2a44d0e6c089092c41aa320260017e761452c85","id":"SPEC"},{"artifact_kind":"plan","ref":"specs/workflowhub-verify-close-protocol-robustness-20260902/plan.md","hash":"9f76818b5e34cfaf76ea0ba7ef847160fe81c9c431fa9f069581099fc20a4931","id":"PLAN"}]`
- **source_refs / decision_refs**：D-003/D-014、FND-S05、PFACT-003 → FR-DIAG-001 / AC-DIAG-001
- **输入**：T301 RED
- **依赖**：T301
- **并行**：否
- **FR**：FR-DIAG-001
- **AC**：AC-DIAG-001
- **动作**：resolved-review 校验链每个现有失败分支附带 check_id/expected/actual；判定条件一行不改；按既有 fail-fast 顺序只报告第一个失败，不做多失败聚合；physical close 五项不可逆授权链不改
- **精确文件**：`runtime/task/task-kernel-implementation.mjs`
- **boundary**：files: `runtime/task/task-kernel-implementation.mjs`；symbols: 授权链错误构造区；判定逻辑行不改
- **输出**：T301 全绿+既有测试绿
- **Knowledge**：错误仍保留各原有 Error/TypeError 类别、消息和 fail-fast 判定；仅在 resolved-review 校验链失败错误上附加非枚举冻结 `error.diagnostic`；六桶映射与 bounded expected/actual 由 T301 fixture 固定；不改变 physical close 授权或判定
- **verification_role**：GREEN
- **paired_task**：T301
- **gate_cmd**：`npx vitest run tests/contract/close-authorization-diagnostics.test.mjs`
- **expected_exit**：0
- **oracle**：ORACLE-DIAG（诊断契约须真实 exit 0；物理 close 回归另行执行并记录真实结果，无关套件不作为本卡绿色依据）
- **evidence_path**：`quality/tests/verify-close-protocol-p3-diag/gate.json`
- **STOP**：需要改判定条件、聚合后续失败或改变 physical close 授权才能转绿 → 停止退回 spec
- **recovery**：还原文件重来
- **task risk**：错误形状变化打破宿主 catch 约定
- **test tier / test method**：feature — backend-testing
- **scenarios / fixtures**：同 T301
- **coverage limits**：同 T301

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：`runtime/task/task-kernel-implementation.mjs`
- **executed_commands**：`TERM=xterm npx vitest run tests/contract/close-authorization-diagnostics.test.mjs`（exit 0，7 passed）
- **evidence_refs**：close diagnostics contract；physical close 文件未改动
- **covered_ac**：AC-DIAG-001
- **review_fact**：仅增强诊断负载，未放宽授权条件或改变 physical close 五项操作
- **completed_at**：2026-09-03T10:42:42Z
- **执行事实**：六桶按既有顺序首个失败即返回，`error.diagnostic` 为冻结非枚举字段。

## Phase P4 — 预检命令

### Goal

stage-runtime 私有 payload preflight（经 run:preflight 路由），复用 handler 抽取的纯 envelope/acceptance shape 校验，零副作用；两份工作流技能各加一句指令；不覆盖 record-backed 认证。

### Files

- **NEW**：`tests/contract/stage-runtime-preflight.test.mjs`
- **MODIFY**：`tools/cli/stage-runtime.mjs`、`runtime/stage/stage-handlers.mjs`、`workflows/build-code/SKILL.md`、`workflows/verify-code/SKILL.md`
- **DO NOT TOUCH**：runtime/schemas/（只读复用）、公共行为七类语义

### Tasks

- T401
- T402
- T403

### Verify

预检契约 gate_cmd（见卡）按预期 exit；T403 文本检查 exit 0。

### Knowledge

预检与 handler 共用抽取的纯 payload validator；不复制 record-backed 认证规则，预检等价性仅覆盖该纯子集。

### STOP

需要新增公共行为类或复制校验规则 → 停止退回 spec。

### Done

纯 payload 错误 fixture 全覆盖拦截；退出码 0/2/1；纯 validator 等价断言与零副作用断言通过；两份技能各一处指令。

### Risks and rollback

预检与 handler 的同一纯 payload validator 子集规则漂移；record-backed 认证明确不等价；回滚=移除 preflight 路由，handler 语义不变。

#### T401 — RED：预检契约

- **ID**：T401
- **Phase**：Phase P4 — 预检命令
- **goal**：用失败测试固定纯 payload preflight 的 wire contract、私有 run:preflight 路由、0/2/1 exit 语义与零副作用边界。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-verify-close-protocol-robustness-20260902/spec.md","hash":"ff4dbd1eaa399b88d73229dcb2a44d0e6c089092c41aa320260017e761452c85","id":"SPEC"},{"artifact_kind":"plan","ref":"specs/workflowhub-verify-close-protocol-robustness-20260902/plan.md","hash":"9f76818b5e34cfaf76ea0ba7ef847160fe81c9c431fa9f069581099fc20a4931","id":"PLAN"}]`
- **source_refs / decision_refs**：D-006/D-015、FND-D03、FND-DD01、FND-S04 → FR-PREFLIGHT-001/002 / AC-PREFLIGHT-001/002
- **输入**：T102 白名单、spec FR-PREFLIGHT-001
- **依赖**：T102
- **并行**：可与 P2/P3 并行（不同文件）— 是
- **FR**：FR-PREFLIGHT-001、FR-PREFLIGHT-002
- **AC**：AC-PREFLIGHT-001、AC-PREFLIGHT-002
- **动作**：写契约测试——①调用 stageRuntimeCliMain 的 run preflight action 时仅委托 preflight，公共 facade 仍七类；②直接调用并通过正式 handler 的纯 envelope validator，断言相同纯 payload 的 accept/reject 结果一致，且 preflight 不调用 recordConsumerInvocation；③可表达为纯 payload 的 build-code/verify-code envelope 与 acceptance_coverage shape fixture 全部拦截（退出码 2+stdout 诊断数组）；④合法纯 payload 退出码 0 且无诊断；⑤命令/输入/runtime 错误退出码 1 且走 stderr；⑥副作用监测：执行前后 task/worktree/material/review/invocation/quality 无读取或写入、无网络/LLM/额外子进程；⑦验证 preflight 分支位于 identity/bootstrap/session/write-boundary 之前
- **精确文件**：`tests/contract/stage-runtime-preflight.test.mjs`
- **boundary**：files: `tests/contract/stage-runtime-preflight.test.mjs`；symbols: 断言区；不改生产代码
- **输出**：稳定 RED（命令不存在）
- **Knowledge**：预检与 handler 共用抽取的同一纯 payload validator；不复制 record-backed 规则，等价性只覆盖纯 envelope/acceptance shape 子集；不能读取 current spec/materials 推导 acceptance IDs
- **verification_role**：RED
- **paired_task**：T402
- **gate_cmd**：`npx vitest run tests/contract/stage-runtime-preflight.test.mjs`；非回归补充：`npx vitest run tests/contract/runtime-facade.test.mjs`
- **expected_exit**：1
- **oracle**：ORACLE-PREFLIGHT — 命名 preflight 契约必须以可归因的命令/路由缺失失败；非回归命令单独记录，不将无关失败归因于 preflight
- **evidence_path**：`quality/tests/verify-close-protocol-p4-preflight/gate.json`
- **STOP**：为通过而把校验规则复制一份到新文件 → 停止（必须复用同一源）
- **recovery**：修正断言
- **task risk**：副作用监测误报（测试自身写入需隔离）
- **test tier / test method**：feature — backend-testing（CLI 契约）
- **scenarios / fixtures**：T101 fixture 全集+合法样例+错误样例
- **coverage limits**：不证明 record-backed handler 认证或内部业务逻辑；仅证明纯 validator 等价性与 preflight 零副作用

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：`tests/contract/stage-runtime-preflight.test.mjs`
- **executed_commands**：`TERM=xterm npx vitest run tests/contract/stage-runtime-preflight.test.mjs`（exit 0，7 passed）
- **evidence_refs**：preflight 纯校验、0/2/1 exit、零副作用契约
- **covered_ac**：AC-PREFLIGHT-001、AC-PREFLIGHT-002
- **review_fact**：仅测试 pure payload 子集；不把 record-backed 认证当作已覆盖
- **completed_at**：2026-09-03T10:42:42Z
- **执行事实**：RED 先固定命令/路由缺失，当前 preflight 契约 gate 通过。

#### T402 — GREEN：预检命令实现

- **ID**：T402
- **Phase**：Phase P4 — 预检命令
- **goal**：stage-runtime 新增私有 payload preflight 与 run:preflight 路由，使 T401 通过；只覆盖纯 validator，不 bootstrap 或读取 record-backed 状态。允许修改 `runtime/stage/stage-handlers.mjs` 抽取并导出 `validateStageInvocation` 与 `validateAcceptanceCoverageShape` 两个纯 helper；不得调用 official handler 或 `recordConsumerInvocation`。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-verify-close-protocol-robustness-20260902/spec.md","hash":"ff4dbd1eaa399b88d73229dcb2a44d0e6c089092c41aa320260017e761452c85","id":"SPEC"},{"artifact_kind":"plan","ref":"specs/workflowhub-verify-close-protocol-robustness-20260902/plan.md","hash":"9f76818b5e34cfaf76ea0ba7ef847160fe81c9c431fa9f069581099fc20a4931","id":"PLAN"}]`
- **source_refs / decision_refs**：D-006/D-015、FND-D03、FND-DD01、FND-S04 → FR-PREFLIGHT-001/002 / AC-PREFLIGHT-001/002
- **输入**：T401 RED
- **依赖**：T401
- **并行**：否
- **FR**：FR-PREFLIGHT-001、FR-PREFLIGHT-002
- **AC**：AC-PREFLIGHT-001、AC-PREFLIGHT-002
- **动作**：命令白名单+内部 preflight 实现（仅读 payload JSON→调用与 handler 共用的纯 envelope/acceptance shape validator→valid=0、protocol-invalid=2+stdout diagnostics、command/input/runtime error=1）；公共路由表加 run:preflight→preflight；在 bootstrap/session binding 前分支；零 task/worktree/material/review/invocation 读取和零外部写入
- **精确文件**：`tools/cli/stage-runtime.mjs`、`runtime/stage/stage-handlers.mjs`
- **boundary**：files: `tools/cli/stage-runtime.mjs`、`runtime/stage/stage-handlers.mjs`；symbols: 命令白名单一项+路由表一项+preflight 函数，以及 validateStageInvocation/validateAcceptanceCoverageShape 纯 helper 抽取；其余行不改（stage-handlers 仅抽取并复用纯 shape 校验，不改变 record-backed 校验）
- **输出**：T401 全绿+既有相关测试绿
- **Knowledge**：沿用 run:reflect/artifact 的私有 action 路由模式；preflight 必须在 identity/bootstrap/session/write-boundary 前分支，且只读取输入 payload；不调用 official handler/recordConsumerInvocation，不读取 record-backed 状态；只验证纯 envelope 与 acceptance coverage shape
- **verification_role**：GREEN
- **paired_task**：T401
- **gate_cmd**：`npx vitest run tests/contract/stage-runtime-preflight.test.mjs`；非回归补充：`npx vitest run tests/contract/runtime-facade.test.mjs`
- **expected_exit**：0
- **oracle**：ORACLE-PREFLIGHT（纯 preflight 契约须真实 exit 0；非回归仅作为独立证据，不把无关套件结果归因于 preflight）
- **evidence_path**：`quality/tests/verify-close-protocol-p4-preflight/gate.json`
- **STOP**：需要新增公共行为类才能转绿 → 停止退回 spec
- **recovery**：还原文件重来
- **task risk**：路由误绑到错误内部命令
- **test tier / test method**：feature — backend-testing（CLI 契约）
- **scenarios / fixtures**：同 T401
- **coverage limits**：不证明 record-backed handler 认证或业务逻辑；仅证明纯 validator、0/2/1 exit contract 与 preflight 零副作用

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：`tools/cli/stage-runtime.mjs`、`runtime/stage/stage-handlers.mjs`
- **executed_commands**：`TERM=xterm npx vitest run tests/contract/stage-runtime-preflight.test.mjs tests/contract/acceptance-execution-tier.test.mjs tests/final-cutover-guards.red.test.mjs`（exit 0，78 passed，22 skipped）
- **evidence_refs**：preflight/acceptance/legacy regression tests；`node tools/cli/verify-structure.mjs` 通过
- **covered_ac**：AC-PREFLIGHT-001、AC-PREFLIGHT-002
- **review_fact**：`currentOnly` 与 legacy mode 明确分开；无 bootstrap、record read 或新公共行为
- **completed_at**：2026-09-03T10:42:42Z
- **执行事实**：preflight 在 identity/bootstrap 前只读 JSON payload；纯 validator 与正式 handler 共用。

#### T403 — 工作流技能预检指令

- **ID**：T403
- **Phase**：Phase P4 — 预检命令
- **goal**：build-code/verify-code 技能各增补一句提交前先预检指令。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-verify-close-protocol-robustness-20260902/spec.md","hash":"ff4dbd1eaa399b88d73229dcb2a44d0e6c089092c41aa320260017e761452c85","id":"SPEC"},{"artifact_kind":"plan","ref":"specs/workflowhub-verify-close-protocol-robustness-20260902/plan.md","hash":"9f76818b5e34cfaf76ea0ba7ef847160fe81c9c431fa9f069581099fc20a4931","id":"PLAN"}]`
- **source_refs / decision_refs**：D-006/D-015、FND-DD01 → FR-PREFLIGHT-002 / AC-PREFLIGHT-002
- **输入**：T402 命令可用
- **依赖**：T402
- **并行**：否
- **FR**：FR-PREFLIGHT-002
- **AC**：AC-PREFLIGHT-002
- **动作**：两份 SKILL.md 各加一句指令（含命令用法与预检失败先修正再提交）；不动工作流拓扑/steps.json
- **精确文件**：`workflows/build-code/SKILL.md`、`workflows/verify-code/SKILL.md`
- **boundary**：files: `workflows/build-code/SKILL.md`、`workflows/verify-code/SKILL.md`；symbols: 各一句指令；其余行不改
- **输出**：指令文本落盘
- **Knowledge**：指令只描述建议顺序，不把预检写成新质量门；仅说明纯 payload 自查，不声称完成 record-backed 认证
- **verification_role**：N/A — non-behavior change: 纯文档指令不改运行行为
- **paired_task**：N/A — 文档卡无 RED/GREEN 配对
- **gate_cmd**：`node -e "const fs=require('node:fs');for(const f of ['workflows/build-code/SKILL.md','workflows/verify-code/SKILL.md']) if(!fs.readFileSync(f,'utf8').includes('preflight')) process.exit(1)"`
- **expected_exit**：0
- **oracle**：ORACLE-PREFLIGHT-DOC — 两文件各含一处预检指令且无 steps.json 变更
- **evidence_path**：`quality/tests/verify-close-protocol-p4-preflight/gate.json`
- **STOP**：指令被写成阻断质量门语义 → 停止
- **recovery**：还原两文件重来
- **task risk**：措辞把预检说成必过门禁
- **test tier / test method**：simple — 文本检查
- **scenarios / fixtures**：N/A — 纯文本指令无测试场景
- **coverage limits**：不证明命令行为（T401/T402 覆盖）

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：`workflows/build-code/SKILL.md`、`workflows/verify-code/SKILL.md`
- **executed_commands**：`node -e "const fs=require('node:fs');for(const f of ['workflows/build-code/SKILL.md','workflows/verify-code/SKILL.md']) if(!fs.readFileSync(f,'utf8').includes('preflight')) process.exit(1)"`（exit 0）
- **evidence_refs**：两份技能文本检查；`steps.json` 未变更
- **covered_ac**：AC-PREFLIGHT-002
- **review_fact**：指令明确为 optional self-check，不是新质量门
- **completed_at**：2026-09-03T10:42:42Z
- **执行事实**：两份工作流技能均已加入提交前 payload preflight 指令。

## Phase P5 — 痕迹与兼容

### Goal

publication retry 成功后的协议错误痕迹事实写入；仅复用既有 appendTaskFact 十字段，旧记录只读兼容 fixture 回归；映射不满足既有 API 即 STOP。

### Files

- **NEW**：`tests/contract/protocol-error-trace.test.mjs`、`tests/fixtures/protocol-errors/legacy-stage-outcome.json`、`tests/fixtures/protocol-errors/legacy-authorization-record.json`
- **MODIFY**：`runtime/stage/stage-runner.mjs`
- **DO NOT TOUCH**：quality/ 旧记录、旧 task store

### Tasks

- T501
- T502

### Verify

痕迹契约 gate_cmd（见卡）按预期 exit。

### Knowledge

痕迹=事实不是许可证；只调用既有 `appendTaskFact`，写入 facts.jsonl 新行；`output_ref` 固定为 `facts.jsonl`，append 返回的 ref（格式为 facts.jsonl#行号）与 sha256 及 index 条目是新增行的权威定位和行哈希；不追加或修改旧记录字节流；append/index 失败不重试 publication、不重跑 handler/LLM、不伪称痕迹已持久化。

### STOP

痕迹写进旧记录或质量结论 → 停止。

### Done

retry 成功后按既有十字段 mapping 写痕迹且不入质量结论；retry 失败无 repaired fact；旧 fixture 可解析且字节哈希不变；append 返回 ref/sha256 与 index 条目可关联；既有相关套件绿。该目标仅在 T501/T502 实际执行并有完整字段证据后成立。

### Risks and rollback

fixture 自造而非真实旧格式；回滚=还原 stage-runner.mjs 痕迹写入点。

#### T501 — RED：痕迹与旧记录回归契约

- **ID**：T501
- **Phase**：Phase P5 — 痕迹与兼容
- **goal**：用失败测试固定既有十字段痕迹事实、canonical digest/reference mapping、append 时序与旧记录不变量。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-verify-close-protocol-robustness-20260902/spec.md","hash":"ff4dbd1eaa399b88d73229dcb2a44d0e6c089092c41aa320260017e761452c85","id":"SPEC"},{"artifact_kind":"plan","ref":"specs/workflowhub-verify-close-protocol-robustness-20260902/plan.md","hash":"9f76818b5e34cfaf76ea0ba7ef847160fe81c9c431fa9f069581099fc20a4931","id":"PLAN"}]`
- **source_refs / decision_refs**：D-007/D-016、FND-D05、FND-S06 → FR-CLASS-004、FR-COMPAT-001 / AC-TRACE-001、AC-COMPAT-001
- **输入**：T104 失败通道、spec FR-CLASS-004/FR-COMPAT-001
- **依赖**：T104
- **并行**：否
- **FR**：FR-CLASS-004、FR-COMPAT-001
- **AC**：AC-TRACE-001、AC-COMPAT-001
- **动作**：写契约测试——①同一次 publication retry 成功后 facts 存在轻量痕迹；②逐字段断言既有 task-fact.v1 十字段 mapping：task_id/stage/material_digest/source_digest/invocation_id/source/status/content_hash/created_at/output_ref 均为真实、合法且可关联值，其中 source=`protocol_error:<class_id>`、status=`repaired_in_place`、created_at=首次识别时间；③retry 失败不写 repaired fact；④阶段质量结论不含痕迹影响（非 incomplete 依据）；⑤旧格式 fixture（改造前 outcome/授权记录样例）可解析；⑥旧记录原始字节哈希不变；⑦痕迹追加既有 facts API 的新行而非修改旧记录；⑧无法用 authenticated context 填满十字段时测试明确要求 STOP，不新增 writer/schema
- **精确文件**：`tests/contract/protocol-error-trace.test.mjs`、`tests/fixtures/protocol-errors/legacy-stage-outcome.json`、`tests/fixtures/protocol-errors/legacy-authorization-record.json`
- **boundary**：files: `tests/contract/protocol-error-trace.test.mjs`；symbols: 断言区；legacy fixture 仅作为只读输入，不改生产代码
- **输出**：稳定 RED（痕迹路径不存在）
- **Knowledge**：旧 fixture 字节取自真实旧记录样本（脱敏）；痕迹字段必须按 DEC-TRACE 的既有 task-fact.v1 十字段映射生成：material_digest=既有四材料 materialRevisionFromValues digest、content_hash=既有 canonicalJson 对 stage/class_id/occurred_at/status 四字段 trace payload 的 SHA-256、occurred_at=created_at、output_ref=facts.jsonl，新增行以 append 返回的 ref（格式为 facts.jsonl#行号）与 sha256 及 index 条目关联；无法用真实 authenticated context 填满十字段则 STOP
- **verification_role**：RED
- **paired_task**：T502
- **gate_cmd**：`npx vitest run tests/contract/protocol-error-trace.test.mjs`
- **expected_exit**：1
- **oracle**：ORACLE-TRACE（命名 trace 契约必须以可归因的缺失痕迹路径失败；官方 Stage Agent 非回归单独执行并记录真实 exit/timeout；旧 fixture 解析须已通过）
- **evidence_path**：`quality/tests/verify-close-protocol-p5-trace/gate.json`
- **STOP**：为通过而把痕迹写进旧记录或质量结论 → 停止
- **recovery**：修正断言/fixture
- **task risk**：fixture 不是真实旧格式（自造旧记录）
- **test tier / test method**：feature — backend-testing
- **scenarios / fixtures**：痕迹正例+旧格式 fixture+哈希对比
- **coverage limits**：不证明 M16/lessons 消费侧

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：`tests/contract/protocol-error-trace.test.mjs`
- **executed_commands**：`TERM=xterm npx vitest run tests/contract/protocol-error-trace.test.mjs`（exit 0，5 passed）
- **evidence_refs**：十字段 mapping、facts/index ref、旧 fixture 字节哈希契约
- **covered_ac**：AC-TRACE-001、AC-COMPAT-001
- **review_fact**：只复用既有 `appendTaskFact`；append/index 失败不作第三次 retry
- **completed_at**：2026-09-03T10:42:42Z
- **执行事实**：RED 先固定缺失痕迹失败，当前 trace/compat 契约 gate 通过。

#### T502 — GREEN：痕迹写入实现

- **ID**：T502
- **Phase**：Phase P5 — 痕迹与兼容
- **goal**：失败通道在同一次 publication retry 成功后按既有十字段 facts contract 追加痕迹事实，使 T501 通过；retry 失败不写 repaired fact。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-verify-close-protocol-robustness-20260902/spec.md","hash":"ff4dbd1eaa399b88d73229dcb2a44d0e6c089092c41aa320260017e761452c85","id":"SPEC"},{"artifact_kind":"plan","ref":"specs/workflowhub-verify-close-protocol-robustness-20260902/plan.md","hash":"9f76818b5e34cfaf76ea0ba7ef847160fe81c9c431fa9f069581099fc20a4931","id":"PLAN"}]`
- **source_refs / decision_refs**：D-007/D-016、FND-D05、FND-S06 → FR-CLASS-004、FR-COMPAT-001 / AC-TRACE-001、AC-COMPAT-001
- **输入**：T501 RED
- **依赖**：T501
- **并行**：否
- **FR**：FR-CLASS-004、FR-COMPAT-001
- **AC**：AC-TRACE-001、AC-COMPAT-001
- **动作**：stage-runner 在合法 handler result 的 publication 失败处识别 protocol_error，并在同一次调用内最多执行一次纯 publication retry；handler/LLM 只执行一次；首次分类时捕获 `occurred_at`，重试成功后仅通过已认证 `ctx.task.taskPath` 调用既有 `appendTaskFact` 一次，按 DEC-TRACE 填满十字段并取得返回的 ref/sha256 与 index 条目关联；append/index 失败不重试 publication、不重跑 handler/LLM、不伪称痕迹已持久化；无法真实填满既有字段则 STOP；不触碰质量结论计算
- **精确文件**：`runtime/stage/stage-runner.mjs`
- **boundary**：files: `runtime/stage/stage-runner.mjs`；symbols: 失败通道 publication retry 后的既有 facts append 写入点；其余行不改
- **输出**：T501 全绿+既有测试绿
- **Knowledge**：痕迹=事实不是许可证；只调用既有 appendTaskFact/task-fact.v1 十字段；不新建独立账本、字段或 quality fact；映射无法满足即 STOP 退回规划
- **verification_role**：GREEN
- **paired_task**：T501
- **gate_cmd**：`npx vitest run tests/contract/protocol-error-trace.test.mjs`
- **expected_exit**：0
- **oracle**：ORACLE-TRACE（十字段 trace 契约须真实 exit 0；官方 Stage Agent 非回归单独执行并记录真实 exit/timeout，仅作独立证据）
- **evidence_path**：`quality/tests/verify-close-protocol-p5-trace/gate.json`
- **STOP**：需要新 facts 存储面才能转绿 → 停止退回 spec（复用既有 facts）
- **recovery**：还原文件重来
- **task risk**：痕迹写入影响性能或产生噪声（应仅在协议错误路径）；appendTaskFact 无幂等键时必须保持单次内存 guard，不得持久化 retry token
- **test tier / test method**：feature — backend-testing
- **scenarios / fixtures**：同 T501
- **coverage limits**：同 T501

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：`runtime/stage/stage-runner.mjs`
- **executed_commands**：`TERM=xterm npx vitest run tests/contract/protocol-error-trace.test.mjs tests/integration/protocol-error-in-place-resend.test.mjs`（exit 0，8 passed）
- **evidence_refs**：retry success trace、retry failure no fact、append failure no third retry、legacy fixture
- **covered_ac**：AC-TRACE-001、AC-COMPAT-001
- **review_fact**：十字段均由 authenticated context 填充；无新账本、字段或 quality fact
- **completed_at**：2026-09-03T10:42:42Z
- **执行事实**：成功重试后追加一条 `repaired_in_place` facts 行；失败仍 fail-loud，不重跑 handler/LLM。

## Phase P6 — 聚合验证

### Goal

最终核验：运行全量测试并记录真实 exit/timeout；行为面、非目标和 AC 覆盖审计；不得把非 0/超时命令宣称为通过。

### Files

- **NEW**：无
- **MODIFY**：`specs/workflowhub-verify-close-protocol-robustness-20260902/tasks.md`（执行状态填写区）
- **DO NOT TOUCH**：全部生产文件（仅验证）

### Tasks

- T601

### Verify

`npx vitest run tests/contract/ tests/integration/`（必须记录真实 exit；exit 非 0 或超时均不得宣称全量通过）+ 审计清单。

### Knowledge

聚合不是新公共 stage。

### STOP

任一既有测试变红或审计发现非目标违反 → 停止回对应 Phase 修复。

### Done

全量命令有真实 exit 证据；若非 0/超时则如实标记失败/未知并回对应 Phase；公共行为仍七类；diff 审计无违规；逐 AC 汇总完成；六段交接写出。

### Risks and rollback

聚合时才发现面间冲突（P1 通道 vs P2 分支）；回滚=定位违规项回对应 Phase。

## 独立审查事实与处置（build-plan，2026-09-02）

- **传输事实**：status=available，outcome=**partial**，minimum_heterologous=1 满足。provider：opencode/v4flash=completed（0 findings）、antigravity/flash=completed（0 findings）、codex/luna=completed（3 findings）；**pi/coding=failed/RATE_LIMITED**（原始错误保留，不改写）。advice only。

| finding_id | 原始事实/来源 | status | next_action |
| --- | --- | --- | --- |
| FND-P01 | codex/luna major：绑定（FR-BIND-001/002）无具名实现面 | fixed | Code Anchors 与 DEC-BIND 明确"stage-runner verify-code 分支=绑定派生唯一实现宿主" |
| FND-P02 | codex/luna major：恢复细节不足 | rejected_invalid | 本计划含失败恢复矩阵+Engineering Risk Handoff 六字段×4 风险；finding 证据针对送审摘要压缩文本 |
| FND-P03 | codex/luna minor：T403 技能改动无 FR/AC 追溯 | rejected_invalid | T403 卡片 FR=FR-PREFLIGHT-002、AC=AC-PREFLIGHT-002；spec FR-PREFLIGHT-002 明示技能指令 |

### 阶段收口校验（spec-analyze，build-plan，2026-09-02）

逐条核对：10 条 FR 全部有 task 承载；12 条 AC 全部有 gate/oracle；无孤儿 task；边界三面与 spec §10 一致；RED/GREEN 成对同 gate_cmd；T403 有 FR 追溯。首轮官方发布暴露 plan-task.v3 结构契约不合（phase 字段格式/全局 File Boundary/Constitution binding/Technical Decisions F10 四问等），已按当时材料版本修复；该历史事实不代表当前材料已通过验证，ReferenceBindings 须在全部材料编辑完成后重新生成。D-016 的 canonical digest、trace hash、facts 行定位和 append 失败语义已由当前 decision-log/plan/spec 冻结后再执行 T501/T502。

#### T601 — 聚合验证

- **ID**：T601
- **Phase**：Phase P6 — 聚合验证
- **goal**：最终核验：运行全量测试并记录真实 exit/timeout；行为面、非目标和 AC 覆盖审计；不得把非 0/超时命令宣称为通过。
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"spec","ref":"specs/workflowhub-verify-close-protocol-robustness-20260902/spec.md","hash":"ff4dbd1eaa399b88d73229dcb2a44d0e6c089092c41aa320260017e761452c85","id":"SPEC"},{"artifact_kind":"plan","ref":"specs/workflowhub-verify-close-protocol-robustness-20260902/plan.md","hash":"9f76818b5e34cfaf76ea0ba7ef847160fe81c9c431fa9f069581099fc20a4931","id":"PLAN"}]`
- **source_refs / decision_refs**：D-008/D-012~D-016、FND-DD04 → spec §10 / AC-NONGOAL-001 + 全部 AC
- **输入**：P1-P5 全部 GREEN（仅以各卡真实执行状态和证据为准，phase summary 不计）
- **依赖**：T104、T202、T302、T402、T403、T502
- **并行**：否 — 收尾卡
- **FR**：FR-CLASS-001、FR-CLASS-002、FR-CLASS-003、FR-CLASS-004、FR-BIND-001、FR-BIND-002、FR-PREFLIGHT-001、FR-PREFLIGHT-002、FR-DIAG-001、FR-COMPAT-001
- **AC**：AC-EXEC-001、AC-EXEC-002、AC-EXEC-003、AC-CLASS-001、AC-BIND-001、AC-BIND-002、AC-PREFLIGHT-001、AC-PREFLIGHT-002、AC-DIAG-001、AC-TRACE-001、AC-COMPAT-001、AC-NONGOAL-001
- **动作**：①跑 tests/contract/ 与 tests/integration/ 全量并记录真实 exit/timeout；②公共行为面检查（help 输出仍七类）；③diff 审计：无 fail-closed 放宽、无 checkpoint/recovery、无白名单配置化、无 review schema/storage 扩展、无 facts 新账本/字段、任务 B/C 边界文件零改动；④逐 AC 汇总覆盖状态，非 0/超时只记 failed/unknown；⑤六段大白话交接；⑥填写本卡执行状态区
- **精确文件**：`specs/workflowhub-verify-close-protocol-robustness-20260902/tasks.md`
- **boundary**：files: `specs/workflowhub-verify-close-protocol-robustness-20260902/tasks.md`；symbols: 执行状态填写区；生产文件零改动
- **输出**：聚合报告（测试输出+审计清单+AC 汇总）
- **Knowledge**：聚合不是新公共 stage；全量命令 exit=1 或超时必须保留为失败/未知事实，不得伪造绿色证据
- **verification_role**：N/A — non-behavior change: 聚合验证只运行既有套件与审计
- **paired_task**：N/A — 聚合卡无 RED/GREEN 配对
- **gate_cmd**：`npx vitest run tests/contract/ tests/integration/`
- **expected_exit**：0
- **oracle**：ORACLE-NONGOAL — exit 0 且审计清单无违规项；非 0/超时只形成失败/未知证据，不能通过
- **evidence_path**：`quality/tests/verify-close-protocol-p6-aggregate/gate.json`
- **STOP**：任一既有测试变红或审计发现非目标违反 → 停止回对应 Phase 修复
- **recovery**：定位违规项回对应 Phase
- **task risk**：聚合时才发现面间冲突（P1 通道 vs P2 分支）
- **test tier / test method**：fullstack — backend-testing（全量套件）
- **scenarios / fixtures**：全部 Phase 场景与 fixture 汇总
- **coverage limits**：不证明真实业务任务端到端（留 verify-code 阶段真机验证）

##### 执行状态填写区（唯一完成权威）

- [ ] **任务完成**
- **status**：`failed`
- **actual_changes**：仅补充本执行状态；无生产文件变更
- **executed_commands**：`TERM=xterm npm test`（exit 1；6 failed / 205 passed files，29 failed / 2168 passed / 25 skipped tests；完整回归事实保留）；`TERM=xterm npm run test:exclusive`（exit 0；31 passed）；`TERM=xterm npx vitest run tests/contract/stage-runtime-preflight.test.mjs tests/integration/vnext-official-stage-run.test.mjs`（exit 0；69 passed）；最终 focused 套件（9 files）exit 0，132 passed / 22 skipped；`TERM=xterm npm run check`（exit 0）；`TERM=xterm npm run compare:public-behavior`（exit 0，`ok: true`）；`git diff --check`（exit 0）
- **evidence_refs**：完整回归命令真实退出事实；受影响 official stage-run 全量复跑 69/69；focused 132/22；`npm run check`、exclusive、结构检查和 public behavior compare 独立通过
- **covered_ac**：AC-NONGOAL-001 部分覆盖；全量聚合未通过，不能汇总宣称全部 AC 通过
- **review_fact**：独立 Standards/Spec 审查有效意见已修复；正式 verify-code/provider review 仍不可用
- **completed_at**：2026-09-03T10:42:42Z
- **执行事实**：完整回归仍失败；已确认其中两条官方 stage-run 兼容回归属于本任务并已修复，受影响文件 69/69 复跑通过。剩余失败属于既有 M16 archive 路径/治理、stage-reflection 证据、lease 时序和 stale host 路径问题。当前 DSH session 仍绑定错误且 `workflowhub-capability` 缺失，未形成正式 verify-code/close 证据。保持 `failed/incomplete/unavailable`，不 close。

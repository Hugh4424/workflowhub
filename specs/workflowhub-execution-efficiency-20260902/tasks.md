# Tasks — workflowhub-execution-efficiency-20260902

- **Template version**: `plan-task.v3`
- 来源：plan.md / spec.md / decision-log.md。每张卡执行后在本卡"执行状态填写区"回填事实。

## Phase P1 — 存储一致性

### Goal
doctor 可机器核验存储一致性；writer 记录解析来源；旧树归档；untracked 捕获点根治。

### Files
**MODIFY** `tools/cli/stage-runtime.mjs`（doctor 区）、`runtime/evidence/storage-root.mjs`、`tools/cli/task-bootstrap.mjs`（writer 来源区）、`runtime/stage/stage-context.mjs`、`runtime/evidence/canonical-receipt-writer.mjs`、`runtime/stage/stage-handlers.mjs`（仅 diff 证据捕获点区域）；**NEW** `tests/contract/doctor-storage-consistency.test.mjs`、`tests/contract/writer-resolution-source.test.mjs`、`tests/contract/diff-evidence-capture-point.test.mjs`、`tests/fixtures/diff-evidence/historical-untracked-mismatch.json`、`docs/operations/old-tree-archive.md`。

### Tasks
T1、T2、T3、T4、T5、T6、T7

### Verify
各对 gate_cmd RED→GREEN；T5 shell 断言。

### Knowledge
F-203/F-204/F-206/PFACT-01/04/05。

### STOP
需要改 stage-runner.mjs 或任务 A 分区 → 停止回本 Phase。

### Done
AC-1/AC-2/AC-3 证据齐。

### Risks and rollback
stage-runtime 与 A 冲突→让路；全部改动可 git revert。

### T1 RED：doctor 存储一致性测试先行

- **ID**：T1
- **Phase**：Phase P1 — 存储一致性
- **goal**：先把 AC-1 表驱动五例写成失败测试（解析链三来源/漂移/可疑第二根/writer 字段一致与不一致/历史缺字段 unknown）
- **design_state**：designed
- **versioned_refs**：`specs/workflowhub-execution-efficiency-20260902/spec.md@ba99cb84`
- **source_refs / decision_refs**：D-004、C-002、spec FR-001/AC-1
- **输入**：spec.md AC-1；F-204/F-206 锚点
- **依赖**：无
- **并行**：可与 T3/T5/T6/T8/T10 并行
- **FR**：FR-001
- **AC**：AC-1
- **动作**：新建测试文件，用 fake 环境构造五例，断言 doctor 输出 storage 段全字段与 exit 0
- **精确文件**：`tests/contract/doctor-storage-consistency.test.mjs`
- **boundary**：files: `tests/contract/doctor-storage-consistency.test.mjs`
- **输出**：RED 测试（当前应失败）
- **Knowledge**：doctor 现状只返回四字段（F-204）
- **verification_role**：RED
- **paired_task**：T2
- **gate_cmd**：`npx vitest run tests/contract/doctor-storage-consistency.test.mjs`
- **expected_exit**：1
- **oracle**：AC-1 doctor-storage-consistency.test.mjs 五例断言全过
- **evidence_path**：quality/tests/t1-doctor-red.json
- **STOP**：测试无法在不改生产代码下构造 → 回 plan.md
- **recovery**：修正测试构造，保持 RED 语义
- **task risk**：低

#### 执行状态填写区

- status：pending
- 执行事实：

### T2 GREEN：doctor 存储一致性实现

- **ID**：T2
- **Phase**：Phase P1 — 存储一致性
- **goal**：实现 doctor 的 storage 段（解析链/选中来源/写入根/可疑第二根/warnings），exit 恒 0
- **design_state**：designed
- **versioned_refs**：`specs/workflowhub-execution-efficiency-20260902/spec.md@ba99cb84`
- **source_refs / decision_refs**：D-004、C-002、spec FR-001/AC-1
- **输入**：T1 RED 测试
- **依赖**：T1
- **并行**：与 T4/T7 并行
- **FR**：FR-001
- **AC**：AC-1
- **动作**：扩展 resolveStorageRoot 暴露解析链细节；doctor 命令组装 storage 段与 warnings；历史缺字段显示 unknown
- **精确文件**：`tools/cli/stage-runtime.mjs`
- **boundary**：files: `tools/cli/stage-runtime.mjs`、`runtime/evidence/storage-root.mjs`
- **输出**：T1 测试转绿
- **Knowledge**：resolveStorageRoot 为 launcher-only（PFACT-01）
- **verification_role**：GREEN
- **paired_task**：T1
- **gate_cmd**：`npx vitest run tests/contract/doctor-storage-consistency.test.mjs`
- **expected_exit**：0
- **oracle**：AC-1 doctor-storage-consistency.test.mjs 五例断言全过
- **evidence_path**：quality/tests/t2-doctor-green.json
- **STOP**：doctor 改动越出 doctor 区 → 停止
- **recovery**：回退改动，重新对齐测试
- **task risk**：中（与任务 A 同文件不同区，遵守分区）

#### 执行状态填写区

- status：pending
- 执行事实：

### T3 RED：writer 解析来源记录测试先行

- **ID**：T3
- **Phase**：Phase P1 — 存储一致性
- **goal**：失败测试——任务创建/写入后 task.json 含 write_resolution_source 且与实际来源一致
- **design_state**：designed
- **versioned_refs**：`specs/workflowhub-execution-efficiency-20260902/spec.md@ba99cb84`
- **source_refs / decision_refs**：D-004、spec FR-002/AC-1
- **输入**：spec AC-1 例 d/e
- **依赖**：无
- **并行**：与 T1/T5/T6 并行
- **FR**：FR-002
- **AC**：AC-1
- **动作**：新建测试，构造 env/config/home 三来源各一例 + 历史任务缺字段一例
- **精确文件**：`tests/contract/writer-resolution-source.test.mjs`
- **boundary**：files: `tests/contract/writer-resolution-source.test.mjs`
- **输出**：RED 测试
- **Knowledge**：writer 调用方=stage-context/task-bootstrap（F-206）
- **verification_role**：RED
- **paired_task**：T4
- **gate_cmd**：`npx vitest run tests/contract/writer-resolution-source.test.mjs`
- **expected_exit**：1
- **oracle**：AC-1 writer-resolution-source.test.mjs 四例断言全过
- **evidence_path**：quality/tests/t3-writer-red.json
- **STOP**：task.json 写入面不在既有 writer → 回 plan.md
- **recovery**：调整构造
- **task risk**：低

#### 执行状态填写区

- status：pending
- 执行事实：

### T4 GREEN：writer 解析来源记录实现

- **ID**：T4
- **Phase**：Phase P1 — 存储一致性
- **goal**：writer 在 task.json 落 write_resolution_source ∈ `{env, config, home}`
- **design_state**：designed
- **versioned_refs**：`specs/workflowhub-execution-efficiency-20260902/spec.md@ba99cb84`
- **source_refs / decision_refs**：D-004、spec FR-002/AC-1
- **输入**：T3 RED 测试
- **依赖**：T3
- **并行**：与 T2/T7 并行
- **FR**：FR-002
- **AC**：AC-1
- **动作**：task-bootstrap 与 stage-context 的任务写入路径记录解析来源
- **精确文件**：`tools/cli/task-bootstrap.mjs`
- **boundary**：files: `tools/cli/task-bootstrap.mjs`、`runtime/stage/stage-context.mjs`
- **输出**：T3 测试转绿
- **Knowledge**：task-bootstrap 同时是 B5a 修改面（T9 分区注意）
- **verification_role**：GREEN
- **paired_task**：T3
- **gate_cmd**：`npx vitest run tests/contract/writer-resolution-source.test.mjs`
- **expected_exit**：0
- **oracle**：AC-1 writer-resolution-source.test.mjs 四例断言全过
- **evidence_path**：quality/tests/t4-writer-green.json
- **STOP**：需要新增写入面 → 回 plan.md
- **recovery**：回退
- **task risk**：低

#### 执行状态填写区

- status：pending
- 执行事实：

### T5 旧树归档标记（ops）

- **ID**：T5
- **Phase**：Phase P1 — 存储一致性
- **goal**：旧 Knowledge tree 根落 ARCHIVED.md（一次性豁免写入），仓内留 ops 记录
- **design_state**：designed
- **versioned_refs**：`specs/workflowhub-execution-efficiency-20260902/spec.md@ba99cb84`
- **source_refs / decision_refs**：D-004、C-003、spec FR-003/AC-2
- **输入**：旧树路径事实（休眠自 ~2026-08 中旬）
- **依赖**：无
- **并行**：与 T1/T3/T6 并行
- **FR**：FR-003
- **AC**：AC-2
- **动作**：写 docs/operations/old-tree-archive.md（标记全文+豁免说明）；在旧树根创建 ARCHIVED.md；确认旧树其余零写入
- **精确文件**：`docs/operations/old-tree-archive.md`
- **boundary**：files: `docs/operations/old-tree-archive.md`
- **输出**：AC-2 证据
- **Knowledge**：旧树休眠事实见 decision-log F-016
- **verification_role**：N/A — 非行为变更：ops 一次性动作，无可运行 RED
- **paired_task**：N/A — 非行为变更无配对
- **gate_cmd**：`bash -c 'test -f /Users/Hugh/Knowledge/ARCHIVED.md && grep -q "禁止写入" /Users/Hugh/Knowledge/ARCHIVED.md'`
- **expected_exit**：0
- **oracle**：AC-2 标记存在且含权威根/休眠日期/禁止写入声明
- **evidence_path**：quality/tests/t5-archive.json
- **STOP**：旧树已被他人改动 → 停止并报告
- **recovery**：保留现状，记录冲突事实
- **task risk**：低

#### 执行状态填写区

- status：pending
- 执行事实：

### T6 RED：diff 证据捕获点 fixture 与测试先行

- **ID**：T6
- **Phase**：Phase P1 — 存储一致性
- **goal**：失败测试——历史 untracked mismatch 样例转 fixture 重放；正常流程端到端；捕获唯一性/次序/中断断言
- **design_state**：designed
- **versioned_refs**：`specs/workflowhub-execution-efficiency-20260902/spec.md@ba99cb84`
- **source_refs / decision_refs**：D-003、spec FR-004/AC-3
- **输入**：PaperBuilder build-code lessons 真实失败 payload；F-203 锚点
- **依赖**：无
- **并行**：与 T1/T3/T5 并行
- **FR**：FR-004
- **AC**：AC-3
- **动作**：新建测试+fixture：a) 历史样例重放 b) 发布后不改=不误报 c) 发布后再改=fail-closed d) 捕获恰好一次且在发布事务内 e) 中断回滚
- **精确文件**：`tests/contract/diff-evidence-capture-point.test.mjs`
- **boundary**：files: `tests/contract/diff-evidence-capture-point.test.mjs`、`tests/fixtures/diff-evidence/historical-untracked-mismatch.json`
- **输出**：RED 测试
- **Knowledge**：捕获现状=canonical-receipt-writer.mjs:323 捕获时冻结（F-203）
- **verification_role**：RED
- **paired_task**：T7
- **gate_cmd**：`npx vitest run tests/contract/diff-evidence-capture-point.test.mjs`
- **expected_exit**：1
- **oracle**：AC-3 diff-evidence-capture-point.test.mjs 五例断言（含 fixture 重放）全过
- **evidence_path**：quality/tests/t6-capture-red.json
- **STOP**：历史样例无法复原 → 用等价构造样例并记录
- **recovery**：调整 fixture
- **task risk**：中

#### 执行状态填写区

- status：pending
- 执行事实：

### T7 GREEN：diff 证据捕获点移入发布事务

- **ID**：T7
- **Phase**：Phase P1 — 存储一致性
- **goal**：untracked 哈希唯一捕获点移到发布事务内；verify 重算保持 fail-closed
- **design_state**：designed
- **versioned_refs**：`specs/workflowhub-execution-efficiency-20260902/spec.md@ba99cb84`
- **source_refs / decision_refs**：D-003、spec FR-004/AC-3；OPEN-P-01 在本卡定点
- **输入**：T6 RED 测试
- **依赖**：T6
- **并行**：与 T2/T4 并行
- **FR**：FR-004
- **AC**：AC-3
- **动作**：在 canonical-receipt-writer 发布路径内定点唯一捕获（OPEN-P-01）；stage-handlers diff 证据区只做捕获点相关适配；verify 重算语义不动
- **精确文件**：`runtime/evidence/canonical-receipt-writer.mjs`
- **boundary**：files: `runtime/evidence/canonical-receipt-writer.mjs`、`runtime/stage/stage-handlers.mjs`
- **输出**：T6 测试转绿
- **Knowledge**：stage-handlers:1416-1423 重算逻辑是 fail-closed 本体，不削弱
- **verification_role**：GREEN
- **paired_task**：T6
- **gate_cmd**：`npx vitest run tests/contract/diff-evidence-capture-point.test.mjs`
- **expected_exit**：0
- **oracle**：AC-3 diff-evidence-capture-point.test.mjs 五例断言（含 fixture 重放）全过
- **evidence_path**：quality/tests/t7-capture-green.json
- **STOP**：需要碰 stage-handlers 捕获点外区域 → 停止回本卡
- **recovery**：回退
- **task risk**：高（发布事务语义，须手术式）

#### 执行状态填写区

- status：pending
- 执行事实：

## Phase P2 — B5a 身份移除

### Goal
删除会话身份派生与绑定调用，落地显式>派生身份算法。

### Files
**MODIFY** `tools/cli/stage-runtime.mjs`（会话派生区）、`tools/cli/task-bootstrap.mjs`（绑定调用区）；**NEW** `tests/contract/identity-resolution.test.mjs`。

### Tasks
T8、T9

### Verify
identity-resolution.test RED→GREEN（六例+outcomes 完整性）。

### Knowledge
PFACT-02/07/08；F-201。

### STOP
需要保留任何会话派生 → 停止回 make-decision。

### Done
AC-5 证据齐。

### Risks and rollback
旧任务记录只读不消费；可 git revert。

### T8 RED：身份解析六例测试先行

- **ID**：T8
- **Phase**：Phase P2 — B5a 身份移除
- **goal**：失败测试——显式/派生/冲突/皆缺/登记损坏/旧记录六例 + 正式 run 的 step/skill outcomes 完整有序断言
- **design_state**：designed
- **versioned_refs**：`specs/workflowhub-execution-efficiency-20260902/spec.md@ba99cb84`
- **source_refs / decision_refs**：D-007、spec FR-005/FR-007/AC-5
- **输入**：spec AC-5
- **依赖**：无
- **并行**：与 P1/P3 各 RED 并行
- **FR**：FR-005, FR-007
- **AC**：AC-5
- **动作**：新建测试构造六例身份场景与 outcomes 完整性断言
- **精确文件**：`tests/contract/identity-resolution.test.mjs`
- **boundary**：files: `tests/contract/identity-resolution.test.mjs`
- **输出**：RED 测试
- **Knowledge**：绑定族导入点 stage-runtime:35/task-bootstrap:27（F-201）
- **verification_role**：RED
- **paired_task**：T9
- **gate_cmd**：`npx vitest run tests/contract/identity-resolution.test.mjs`
- **expected_exit**：1
- **oracle**：AC-5 identity-resolution.test.mjs 六例+outcomes 断言全过
- **evidence_path**：quality/tests/t8-identity-red.json
- **STOP**：认证 worktree 登记身份读不到 → 回 plan.md
- **recovery**：调整构造
- **task risk**：中

#### 执行状态填写区

- status：pending
- 执行事实：

### T9 GREEN：会话派生移除与身份算法落地

- **ID**：T9
- **Phase**：Phase P2 — B5a 身份移除
- **goal**：删除 stage-runtime 会话派生与 task-bootstrap 绑定调用；实现显式>派生、冲突/缺失 fail-closed
- **design_state**：designed
- **versioned_refs**：`specs/workflowhub-execution-efficiency-20260902/spec.md@ba99cb84`
- **source_refs / decision_refs**：D-007、spec FR-005/FR-007/AC-5
- **输入**：T8 RED 测试
- **依赖**：T8, T2
- **并行**：与 T11 并行
- **FR**：FR-005, FR-007
- **AC**：AC-5
- **动作**：stage-runtime 删除 4 个绑定族导入及派生路径（保留 doctor 分区）；task-bootstrap 删除绑定调用；身份解析按 FR-007 算法落地；旧 session 字段只读
- **精确文件**：`tools/cli/stage-runtime.mjs`
- **boundary**：files: `tools/cli/stage-runtime.mjs`、`tools/cli/task-bootstrap.mjs`
- **输出**：T8 测试转绿
- **Knowledge**：stage-agent-bridge 输入面归 T14（B5b 批）
- **verification_role**：GREEN
- **paired_task**：T8
- **gate_cmd**：`npx vitest run tests/contract/identity-resolution.test.mjs`
- **expected_exit**：0
- **oracle**：AC-5 identity-resolution.test.mjs 六例+outcomes 断言全过
- **evidence_path**：quality/tests/t9-identity-green.json
- **STOP**：需要改 stage-agent-bridge（属 T14 批） → 停止
- **recovery**：回退
- **task risk**：高（与 A 同文件分区纪律）

#### 执行状态填写区

- status：pending
- 执行事实：

## Phase P3 — C 面契约守护

### Goal
broker 输出契约守护+终态如实+隐私边界；调用约定文本。

### Files
**MODIFY** `skills/wh-review/scripts/review-provider-client.mjs`、`skills/wh-review/SKILL.md`；**NEW** `skills/wh-review/scripts/__tests__/provider-output-contract.test.mjs`。

### Tasks
T10、T11、T12

### Verify
provider-output-contract.test RED→GREEN；T12 grep 断言。

### Knowledge
PFACT-06；终态矩阵（spec 第 7 节）。

### STOP
需要改 broker 公共 schema/新增公共字段/加超时机制 → 停止回本 Phase。

### Done
AC-4/AC-7 证据齐。

### Risks and rollback
fake 输出用 lessons 真实 payload 校准；可 revert。

### T10 RED：provider 输出契约测试先行

- **ID**：T10
- **Phase**：Phase P3 — C 面契约守护
- **goal**：失败测试——五终态用例+0字节 contract_failure+相同指纹不重试+四公共边界脱敏断言
- **design_state**：designed
- **versioned_refs**：`specs/workflowhub-execution-efficiency-20260902/spec.md@ba99cb84`
- **source_refs / decision_refs**：D-005、spec FR-008/FR-009/FR-010/AC-4
- **输入**：spec 终态矩阵；lessons 真实失败 payload（0 字节、PUBLIC_RESULT_INVALID）
- **依赖**：无
- **并行**：与所有 P1/P2 RED 并行
- **FR**：FR-008, FR-009, FR-010
- **AC**：AC-4
- **动作**：新建测试，fake broker 输出构造五终态与隐私用例
- **精确文件**：`skills/wh-review/scripts/__tests__/provider-output-contract.test.mjs`
- **boundary**：files: `skills/wh-review/scripts/__tests__/provider-output-contract.test.mjs`
- **输出**：RED 测试
- **Knowledge**：0 字节现状=JSON.parse 裸抛（PFACT-06）
- **verification_role**：RED
- **paired_task**：T11
- **gate_cmd**：`npx vitest run skills/wh-review/scripts/__tests__/provider-output-contract.test.mjs`
- **expected_exit**：1
- **oracle**：AC-4 provider-output-contract.test.mjs 五终态+脱敏+不重试断言全过
- **evidence_path**：quality/tests/t10-broker-red.json
- **STOP**：契约守护需改公共 schema → 停止回本卡
- **recovery**：调整构造
- **task risk**：中

#### 执行状态填写区

- status：pending
- 执行事实：

### T11 GREEN：broker 输出契约守护实现

- **ID**：T11
- **Phase**：Phase P3 — C 面契约守护
- **goal**：0字节/非法JSON→contract_failure 内部标签；原文入私有证据区；公共边界脱敏；partial 永不当 pass
- **design_state**：designed
- **versioned_refs**：`specs/workflowhub-execution-efficiency-20260902/spec.md@ba99cb84`
- **source_refs / decision_refs**：D-005、spec FR-008/FR-009/FR-010/AC-4
- **输入**：T10 RED 测试
- **依赖**：T10
- **并行**：与 T9 并行
- **FR**：FR-008, FR-009, FR-010
- **AC**：AC-4
- **动作**：review-provider-client 读取处加契约守护；脱敏落地四公共边界；比较键复用 material_fingerprint
- **精确文件**：`skills/wh-review/scripts/review-provider-client.mjs`
- **boundary**：files: `skills/wh-review/scripts/review-provider-client.mjs`
- **输出**：T10 测试转绿
- **Knowledge**：spawn 无超时保持现状（调用约定归 T12 文本，不加机制）
- **verification_role**：GREEN
- **paired_task**：T10
- **gate_cmd**：`npx vitest run skills/wh-review/scripts/__tests__/provider-output-contract.test.mjs`
- **expected_exit**：0
- **oracle**：AC-4 provider-output-contract.test.mjs 五终态+脱敏+不重试断言全过
- **evidence_path**：quality/tests/t11-broker-green.json
- **STOP**：需要给 spawn 加超时机制（超出本任务范围，归调用约定） → 停止
- **recovery**：回退
- **task risk**：中

#### 执行状态填写区

- status：pending
- 执行事实：

### T12 调用约定文本（docs）

- **ID**：T12
- **Phase**：Phase P3 — C 面契约守护
- **goal**：wh-review SKILL.md 写明宿主后台执行+轮询约定与终态处置矩阵引用
- **design_state**：designed
- **versioned_refs**：`specs/workflowhub-execution-efficiency-20260902/spec.md@ba99cb84`
- **source_refs / decision_refs**：D-005、spec FR-011/AC-7
- **输入**：spec 第 7 节终态矩阵
- **依赖**：无
- **并行**：与所有任务并行
- **FR**：FR-011
- **AC**：AC-7
- **动作**：wh-review SKILL.md 增"长审查由宿主后台执行+轮询收集；不重试无变化输入；终态处置见矩阵"段
- **精确文件**：`skills/wh-review/SKILL.md`
- **boundary**：files: `skills/wh-review/SKILL.md`
- **输出**：AC-7 证据
- **Knowledge**：不引入任何机制（D-005）
- **verification_role**：N/A — 非行为变更：文档文本
- **paired_task**：N/A — 非行为变更无配对
- **gate_cmd**：`bash -c 'grep -q "后台执行" skills/wh-review/SKILL.md && grep -q "material_fingerprint" skills/wh-review/SKILL.md'`
- **expected_exit**：0
- **oracle**：AC-7 约定段存在且含比较键说明
- **evidence_path**：quality/tests/t12-convention.json
- **STOP**：需要新增配置文件 → 停止回本卡
- **recovery**：回退
- **task risk**：低

#### 执行状态填写区

- status：pending
- 执行事实：

## Phase P4 — B5b 原子批（gated）

### Goal
删除 session 三件套+bridge 显式输入+五份 SKILL.md 改写，同一 git 提交原子交付。

### Files
**MODIFY** `tools/host/workflowhub-stage-agent-bridge.mjs`、`workflows/make-decision/SKILL.md`、`workflows/build-spec/SKILL.md`、`workflows/build-plan/SKILL.md`、`workflows/build-code/SKILL.md`、`workflows/verify-code/SKILL.md`；**NEW** `tests/contract/session-binding-removed.test.mjs`、`docs/adr/0023-remove-host-session-binding.md`。
**DELETE** `tools/host/workflowhub-codex-session-state.mjs`、`tools/host/workflowhub-codex-session-hook.mjs`、`tools/host/workflowhub-codex-session-event.mjs`。

### Tasks
T13、T14

### Verify
session-binding-removed.test RED→GREEN+提交内容原子性断言。

### Knowledge
PFACT-02/03；F-201/F-202 引用清单。

### STOP
gate 未释放（usability 未合并且未取消且 14 天内）→ 本 Phase 不启动；发现 SKILL.md 已被 usability 改写 → 只删三件套+bridge，跳过改写。

### Done
AC-6 证据齐（同提交断言+零残留 grep）。

### Risks and rollback
原子批必须单提交；任何部分缺失整体 revert。

### T13 RED：B5b 移除后状态测试先行

- **ID**：T13
- **Phase**：Phase P4 — B5b 原子批（gated）
- **goal**：失败测试——三件套不存在、SKILL.md 含遗漏披露段且无绑定段、bridge 无 session_id 依赖、全仓引用零残留、同提交原子性断言
- **design_state**：designed
- **versioned_refs**：`specs/workflowhub-execution-efficiency-20260902/spec.md@ba99cb84`
- **source_refs / decision_refs**：D-006、D-007、C-001、spec FR-006/FR-012/AC-6
- **输入**：spec AC-6；F-201/F-202 引用清单
- **依赖**：T9
- **并行**：gate 释放后与 T15 之前的一切并行
- **FR**：FR-006, FR-012
- **AC**：AC-6
- **动作**：新建测试断言移除后状态（当前应失败）+提交内容原子性检查脚本
- **精确文件**：`tests/contract/session-binding-removed.test.mjs`
- **boundary**：files: `tests/contract/session-binding-removed.test.mjs`
- **输出**：RED 测试
- **Knowledge**：gate 信号见 spec FR-006（合并/取消/14 天）
- **verification_role**：RED
- **paired_task**：T14
- **gate_cmd**：`npx vitest run tests/contract/session-binding-removed.test.mjs`
- **expected_exit**：1
- **oracle**：AC-6 session-binding-removed.test.mjs 零残留+披露段+原子性断言全过
- **evidence_path**：quality/tests/t13-b5b-red.json
- **STOP**：gate 未释放 → 不启动
- **recovery**：等待 gate 或按 C-001 接管
- **task risk**：中

#### 执行状态填写区

- status：pending
- 执行事实：

### T14 GREEN：B5b 原子批交付

- **ID**：T14
- **Phase**：Phase P4 — B5b 原子批（gated）
- **goal**：同一 git 提交内：删三件套、改 bridge 显式输入、五份 SKILL.md 移除绑定段+新增遗漏披露段
- **design_state**：designed
- **versioned_refs**：`specs/workflowhub-execution-efficiency-20260902/spec.md@ba99cb84`
- **source_refs / decision_refs**：D-006、D-007、C-001、spec FR-006/FR-012/AC-6
- **输入**：T13 RED 测试；gate 释放信号
- **依赖**：T13
- **并行**：无（原子批独占）
- **FR**：FR-006, FR-012
- **AC**：AC-6
- **动作**：按 F-201/F-202 清单删除三件套（tools/host/workflowhub-codex-session-state/hook/event.mjs，Phase DELETE 行）并改写 bridge+五份 SKILL.md；ADR 随批创建；单提交交付
- **精确文件**：`tools/host/workflowhub-stage-agent-bridge.mjs`
- **boundary**：files: `tools/host/workflowhub-stage-agent-bridge.mjs`、`workflows/make-decision/SKILL.md`、`workflows/build-spec/SKILL.md`、`workflows/build-plan/SKILL.md`、`workflows/build-code/SKILL.md`、`workflows/verify-code/SKILL.md`、`docs/adr/0023-remove-host-session-binding.md`
- **输出**：T13 测试转绿；零残留
- **Knowledge**：遗漏披露段文案=R-006 用户原文语义
- **verification_role**：GREEN
- **paired_task**：T13
- **gate_cmd**：`npx vitest run tests/contract/session-binding-removed.test.mjs`
- **expected_exit**：0
- **oracle**：AC-6 session-binding-removed.test.mjs 零残留+披露段+原子性断言全过
- **evidence_path**：quality/tests/t14-b5b-green.json
- **STOP**：无法单提交原子交付 → 停止整体 revert
- **recovery**：整体 revert 重排
- **task risk**：高（gated+原子性）

#### 执行状态填写区

- status：pending
- 执行事实：

## Phase P5 — 聚合验收

### Goal
全量回归+全 AC 证据聚合。

### Files
**MODIFY** `tests/contract/doctor-storage-consistency.test.mjs`、`tests/contract/writer-resolution-source.test.mjs`、`tests/contract/diff-evidence-capture-point.test.mjs`、`tests/contract/identity-resolution.test.mjs`、`tests/contract/session-binding-removed.test.mjs`、`skills/wh-review/scripts/__tests__/provider-output-contract.test.mjs`（聚合卡回填证据引用）。

### Tasks
T15

### Verify
npm run test:safe && npm run check。

### Knowledge
质量缺失保持如实。

### STOP
任一 RED/GREEN 对未闭合 → 回对应卡。

### Done
全 AC 证据齐（gated 项如实记录）。

### Risks and rollback
B5b 未释放时 AC-6 记 gated 事实而非伪造通过。

### T15 聚合验收卡

- **ID**：T15
- **Phase**：Phase P5 — 聚合验收
- **goal**：全量回归+AC-1~AC-7 证据聚合+零残留终检
- **design_state**：designed
- **versioned_refs**：`specs/workflowhub-execution-efficiency-20260902/spec.md@ba99cb84`
- **source_refs / decision_refs**：D-001~D-008、spec 全部 FR/AC
- **输入**：全部 GREEN 卡证据
- **依赖**：T2, T4, T5, T7, T9, T11, T12, T14
- **并行**：无（收尾独占）
- **FR**：FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, FR-007, FR-008, FR-009, FR-010, FR-011, FR-012
- **AC**：AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7
- **动作**：跑全量回归；聚合各 AC 证据；B5b 未交付时如实记录 gated 事实
- **精确文件**：`tests/contract/doctor-storage-consistency.test.mjs`
- **boundary**：files: `tests/contract/doctor-storage-consistency.test.mjs`、`tests/contract/writer-resolution-source.test.mjs`、`tests/contract/diff-evidence-capture-point.test.mjs`、`tests/contract/identity-resolution.test.mjs`、`tests/contract/session-binding-removed.test.mjs`、`skills/wh-review/scripts/__tests__/provider-output-contract.test.mjs`
- **输出**：聚合验收证据
- **Knowledge**：质量缺失保持如实
- **verification_role**：N/A — 非行为变更：聚合验证，非新公共阶段
- **paired_task**：N/A — 非行为变更无配对
- **gate_cmd**：`npm run test:safe && npm run check`
- **expected_exit**：0
- **oracle**：AC-1 全量回归绿+check 结构校验过
- **evidence_path**：quality/tests/t15-aggregate.json
- **STOP**：任一 AC 证据缺失且非 gated → 回对应卡修复
- **recovery**：定位失败卡重做
- **task risk**：中

#### 执行状态填写区

- status：pending
- 执行事实：
- 用户回复（build-plan 交接确认后追加）：

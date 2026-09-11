# 任务清单：规划任务的提问边界、产物纪律与不归档收口

- **Input**：`decision-log.md`、`spec.md`、`plan.md`
- **Template version**：`plan-task.v4`

- **Design status**：draft；D033已确定后续归档范围，T007/T008及T009/T010按明确接口修订。D034工具补丁不计作12卡实施。执行status以各卡"执行状态填写区"为准（2026-09-12：T001–T010 经 owner 裁定记为基线记录，T011/T012 为原有 completed）。

## 材料导航

| 章节 / 材料锚点 | 职责与摘要 | M/S/B/P 读取时机 |
| --- | --- | --- |
| decision-log.md#增量决策 | D026/027/029/031/032当前边界 | M 歧义时；S只读冻结相关段 |
| spec.md#5-功能需求、#11-验收标准 | 产品行为、20FR/16AC与定性限制 | B 每卡开始前；M按需 |
| plan.md#requirement-and-verification-traceability | 唯一映射、文件owner与方案 | M统筹；B/S执行前；P仅独立读取 |
| tasks.md#phase-p1、#4-final-current-snapshot-aggregate-strategy | 具体命令、oracle、状态区 | B执行；M收证据摘要 |

本清单只投影当前plan。T001的共同前提是现有build-plan最终人类确认及正式run已读回，绑定本task、当前四材料revision/snapshot及plan/tasks源hash；缺确认时只修订当前计划，不执行任何产品卡。确认ref保存在现有canonical执行事实，不回填本文造成自指hash，也不新建前置任务或gate。所有status初始pending，expected_exit是设计不是执行。D032真实位置澄清不等于build-plan最终确认，更不授权当前任务的物理交付。命名目标必须选中至少一条真实断言，不能把零测试退出0当GREEN。

## Phase P1 — 任务类型、提问与真实阶段披露

### Goal

提问前从唯一声明选边界；逐项分报产物与完成事实，链检查不再零匹配假绿。

### Files

- **NEW**：N/A — 复用现有文件
- **MODIFY**：`workflows/make-decision/SKILL.md`、`workflows/build-spec/SKILL.md`、`workflows/build-plan/SKILL.md`、`workflows/build-code/SKILL.md`、`workflows/verify-code/SKILL.md`、`skills/decision-log/SKILL.md`、`skills/decision-log/templates/decision-log-template.md`、`runtime/stage/stage-content-contracts.mjs`、`tools/cli/check-decision-log-chain.mjs`、`tests/contract/decision-convergence-depth.test.mjs`、`tests/contract/stage-interaction-batching.test.mjs`、`tests/contract/decision-log-chain-warnings.test.mjs`、`tests/contract/stage-reflection-wiring.test.mjs`
- **DO NOT TOUCH**：`runtime/schemas/task-fact.v1.json`、`runtime/task/task-store.mjs`；不改stage枚举或持久字段。

### Verify

ORACLE-TYPE-ASK / ORACLE-TRUTHFUL-END — 本phase使用下列同名任务oracle；命令与事实路径如下。

T001→T002：`node node_modules/vitest/vitest.mjs run tests/contract/decision-convergence-depth.test.mjs tests/contract/stage-interaction-batching.test.mjs --testNamePattern=planning-hardening --poolOptions.forks.singleFork --no-fileParallelism`；RED expected_exit=1（目标断言），GREEN expected_exit=0；ORACLE-TYPE-ASK；`quality/evidence/build-code/T001-T002/pair.json`。

T003→T004：`node node_modules/vitest/vitest.mjs run tests/contract/decision-log-chain-warnings.test.mjs tests/contract/stage-reflection-wiring.test.mjs --testNamePattern=planning-hardening --poolOptions.forks.singleFork --no-fileParallelism`；RED expected_exit=1（目标断言），GREEN expected_exit=0；ORACLE-TRUTHFUL-END；`quality/evidence/build-code/T003-T004/pair.json`。

### Knowledge

类型是当前决策材料的一条声明；旧绑定失效不等于已重新处置。已有 D024/D025 改动保留，不重写旧历史。

### STOP

输入缺少真实来源、RED为setup错误、GREEN需放宽断言、发现越界文件或新产品决定时返回对应四材料owner。

### Done

T001、T002、T003、T004 的执行区具备真实变更、命令退出码、逐AC事实和证据引用；失败、跳过、unavailable保留。没有真实执行前全部pending；不把计划中的预期结果当成实测。

### Risks and rollback

RISK-04、OPEN-02/04/05：类型误判、链字段旧缺失、快照/文本碰撞。仅回撤本phase新增分支与指令，不删除旧告警，不伪造旧产物。

### Tasks

- T001：RED 类型声明与提问边界
- T002：GREEN 类型声明与提问边界
- T003：RED 逐项阶段披露与零条目链检查
- T004：GREEN 逐项阶段披露与零条目链检查

#### T001 — RED：类型声明与提问边界

- **ID**：T001
- **Phase**：Phase P1 — 任务类型、提问与真实阶段披露
- **goal**：获得来自目标断言而非setup的真实失败；类型声明与提问边界
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"plan","ref":"specs/workflowhub-build-prd-workflow-hardening-20260911/plan.md","hash":"8f8931d2380b74d66122342fd82fa0d4e6e515484a7f34f76ce654eabb69ff29","id":"PLAN"},{"artifact_kind":"spec","ref":"specs/workflowhub-build-prd-workflow-hardening-20260911/spec.md","hash":"88174d3fa19c254f1c877194a746ce65a9889c5b2c5a6ef150ad4570bc64905d","id":"SPEC"}]`
- **source_refs / decision_refs**：D-001 D-002 D-003 D-004 D-005 D-008 D-009 D-026；上游来源别名 AC-01 AC-02 AC-03 AC-14 AC-15 AC-16 AC-18
- **输入**：`spec.md#5-功能需求`、`plan.md#phase-p1`；当前源字节与明确的场景/文件边界
- **依赖**：none；先消费上述当前build-plan最终确认与正式run结果，未经确认不开始RED
- **并行**：否 — 按plan既定生产者顺序执行，未声明并行写
- **FR**：FR-TYPE-001 FR-TYPE-002 FR-ASK-001 FR-ASK-002 FR-ASK-003 FR-DOC-001
- **AC**：AC-TYPE-001 AC-ASK-001 AC-ASK-002 AC-ASK-003 AC-PRD-001
- **动作**：只在列明测试文件增加带 planning-hardening 与相应AC ID的命名目标，使用真实现有入口/模板及独立fixture；先验证命令确实选中了测试。首次正式需求提问前，make-decision主会话创建decision-log.md及任务身份段，落一条明确的规划任务/普通任务声明；已有用户明确类型即使用该类型，缺失/冲突按unknown回报并向用户澄清类型，不擅自猜测，仅暂停依赖类型的提问/内容分支，仍可做不依赖类型的准备。规划任务的六类方向槽位（完整用户流程、页面范围、数据状态、成功/失败边界、非目标、延期）逐类保留，每类有真实用户回答或empty加具体留空理由；缺任一槽、改名替代、只写none或假填非真实回答均为负例。用户中途改型后，按当前新类型逐条重新处置已有问答和产物，在当前已确认决定中记录旧问题引用、处置理由和新内容位置；未经重新处置的旧内容不得继续消费，不新增schema、控制面或未批准的类型机器状态，不重绑旧record。唯一规划/普通声明；缺声明、重复同值、冲突双值、未知值；只在任务身份段读取；中途换类型后旧问答/产物不再作当前证据，新内容按新边界重处置；十类禁项各有反例，普通任务仍允许实现细节；选项三项信息缺一的负例。 目标断言先失败，不能先改生产实现来得到RED。已由上游实现的h4等行为不得刻意破坏来造RED；记录其基线，RED针对仍缺的行为。
- **精确文件**：`tests/contract/decision-convergence-depth.test.mjs`、`tests/contract/stage-interaction-batching.test.mjs`
- **boundary**：files: `tests/contract/decision-convergence-depth.test.mjs`、`tests/contract/stage-interaction-batching.test.mjs`; symbols/regions: 任务身份声明、readTaskTypeFromDecisionLog计划内纯函数、当前提问/内容分支与相应fixture；不扩大文件集合
- **输出**：RED目标证据，保留原stdout/stderr、命令fingerprint、snapshot/material与对应AC事实；记录断言失败位置，不能拿语法/依赖错误作RED
- **Knowledge**：结构与夹具只能证明声明/边界合同；旧 hash 被拒绝不是重处置完成证明。AC-ASK-002/003 的完整定性结论仍受 D-029 限制，不伪造用户实际提问行为。
- **verification_role**：RED
- **paired_task**：T002
- **gate_cmd**：`node node_modules/vitest/vitest.mjs run tests/contract/decision-convergence-depth.test.mjs tests/contract/stage-interaction-batching.test.mjs --testNamePattern=planning-hardening --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：1
- **oracle**：`ORACLE-TYPE-ASK {"pass":"首次正式需求提问前，make-decision主会话创建decision-log.md及任务身份段，落一条明确的规划任务/普通任务声明；已有用户明确类型即使用该类型，缺失/冲突按unknown回报并向用户澄清类型，不擅自猜测，仅暂停依赖类型的提问/内容分支，仍可做不依赖类型的准备。任务身份段的唯一类型声明可读为规划任务或普通任务；重复同值、冲突双值及未知值均被识别为unknown。规划任务的六类方向槽位（完整用户流程、页面范围、数据状态、成功/失败边界、非目标、延期）逐类保留，每类有真实用户回答或empty加具体留空理由；缺任一槽、改名替代、只写none或假填非真实回答均为负例。规划问答与产物逐类满足十类实现细节禁项，普通任务仍可追问实现细节，选项含含义、直接后果与主要风险。用户中途改型后，按当前新类型逐条重新处置已有问答和产物，在当前已确认决定中记录旧问题引用、处置理由和新内容位置；未经重新处置的旧内容不得继续消费，不新增schema、控制面或未批准的类型机器状态，不重绑旧record；仅更换hash不算完成。","reject":{"input":"未创建decision-log任务身份或未落明确类型声明即开始正式需求提问；忽略用户已明确类型而自行猜测；分别提供缺失、重复、冲突、未知或仅在身份段外出现的声明，unknown时不澄清便进入依赖类型的分支，或连不依赖类型的准备也暂停；六类方向槽位逐类缺一、改名替代、只写none、无具体理由留空或假填非真实回答；规划问答或产物含任一实现机制禁项；选项缺含义、后果或风险；改类型后继续消费未重新处置的旧问答/产物、仅更新hash、缺旧问题引用/处置理由/新内容位置，或新增schema/控制面/未批准的类型机器状态、重绑旧record。","expected_rejection":"不得把先问后声明、自行猜类型或unknown下越过类型澄清的提问/内容分支判为合规，也不得将暂停扩大到不依赖类型的准备；不得将无效声明推断为有效类型；不得把缺任一方向槽、非真实回答、无理由留空、越界内容、信息不全选项或未经新类型逐条重处置的旧内容判为当前合规结果；不得靠新增结构/类型机器状态或旧record重绑满足重处置。","observation":"读回主会话创建decision-log任务身份、用户类型原话/澄清答复、明确声明与首次正式需求提问的顺序；夹具读回类型结论、具体缺口及unknown时分支暂停范围；逐类核对六类槽位的真实回答来源或empty具体理由，并逐类缺一及假填检验；逐类断言规划禁项、普通任务边界及选项三项信息；对照改型前后逐条问答和产物，在当前已确认决定读回旧问题引用、处置理由、新内容位置，确认未经处置旧内容不被消费、未新增schema/控制面/类型机器状态且旧record未重绑。"}}`
- **semantic_review_status**：completed
- **semantic_review_ref**：`quality/reviews/results/build-plan-simple-e5eaaa6a-8530-5ced-ab77-658e1e5dc20d.json`
- **semantic_review_reason**：独立三provider已完成本次草案审查，实际canonical result见ref；本卡有效发现已在当前计划中修复，最终spec-analyze核对修订。此字段不代表产品测试或阶段质量通过。
- **evidence_path**：`quality/evidence/build-code/T001-T002/pair.json`
- **STOP**：零测试匹配、setup失败、未知实际函数签名、需要弱化断言/新增控制面/改产品方向或越界文件时回对应owner；缺质量事实不是停止同task修复的理由
- **recovery**：本卡执行者保留失败原件，修复输入/本次改动后只重跑受影响命名目标；不reset用户改动、不删除旧事实；上游既有D024/D025/D030局部修复保留
- **task risk**：结构与夹具只能证明声明/边界合同；旧 hash 被拒绝不是重处置完成证明。AC-ASK-002/003 的完整定性结论仍受 D-029 限制，不伪造用户实际提问行为。
- **test tier / test method**：feature / backend-testing（本地内容/接口/持久化切片）；独立预判总路线fullstack；本卡命名目标预算60秒
- **scenarios / commands / expected exit / oracle**：首次正式需求提问前，make-decision主会话创建decision-log.md及任务身份段，落一条明确的规划任务/普通任务声明；已有用户明确类型即使用该类型，缺失/冲突按unknown回报并向用户澄清类型，不擅自猜测，仅暂停依赖类型的提问/内容分支，仍可做不依赖类型的准备。规划任务的六类方向槽位（完整用户流程、页面范围、数据状态、成功/失败边界、非目标、延期）逐类保留，每类有真实用户回答或empty加具体留空理由；缺任一槽、改名替代、只写none或假填非真实回答均为负例。用户中途改型后，按当前新类型逐条重新处置已有问答和产物，在当前已确认决定中记录旧问题引用、处置理由和新内容位置；未经重新处置的旧内容不得继续消费，不新增schema、控制面或未批准的类型机器状态，不重绑旧record。唯一规划/普通声明；缺声明、重复同值、冲突双值、未知值；只在任务身份段读取；中途换类型后旧问答/产物不再作当前证据，新内容按新边界重处置；十类禁项各有反例，普通任务仍允许实现细节；选项三项信息缺一的负例。 命令=`node node_modules/vitest/vitest.mjs run tests/contract/decision-convergence-depth.test.mjs tests/contract/stage-interaction-batching.test.mjs --testNamePattern=planning-hardening --poolOptions.forks.singleFork --no-fileParallelism`；退出=1；oracle=ORACLE-TYPE-ASK
- **fixtures_services**：独立当前材料/问答/manifest/outcome fixture；缺失与冲突显式构造，真实用户确认不从fixture发布；service=N/A — 无线上服务
- **coverage limits**：结构与夹具只能证明声明/边界合同；旧 hash 被拒绝不是重处置完成证明。AC-ASK-002/003 的完整定性结论仍受 D-029 限制，不伪造用户实际提问行为。 不真跑新规划任务，不声称少问/变短/token收益。
- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：本卡按 owner 裁定转为基线记录，RED 未独立执行。既有实现与命名目标在同一次 dirty worktree 写入中一并落盘：`tests/contract/decision-convergence-depth.test.mjs` 新增 `planning-hardening AC-TYPE-001` 两个命名目标（+97/−3 行），`tests/contract/stage-interaction-batching.test.mjs` 新增 `planning-hardening` 问句边界三个命名目标（+79/−0 行）。
- **executed_commands**：`node node_modules/vitest/vitest.mjs run tests/contract/decision-convergence-depth.test.mjs tests/contract/stage-interaction-batching.test.mjs --testNamePattern=planning-hardening --poolOptions.forks.singleFork --no-fileParallelism`；实测 exit 0，`Test Files 2 passed (2)`、`Tests 5 passed | 19 skipped (24)`，与本卡设计的 `expected_exit=1`（RED）不符，故不构成 RED 证据。
- **evidence_refs**：`quality/evidence/build-code/P1/phase-card.md`（sha256 `8c790cf8dfe363f66383fa5dab6a0907d4e0053cec610cbc211af0579a86ea18`）；基线绿测结果见本卡 `executed_commands` 所记录的实时输出。
- **covered_ac**：`AC-TYPE-001` `AC-ASK-001` `AC-ASK-002` `AC-ASK-003` `AC-PRD-001` 在基线中被命名目标选中并通过；但 canonical AC 事实中 `AC-TYPE-001`/`AC-ASK-001`/`AC-PRD-001` 仍为 `missing`、`AC-ASK-002`/`AC-ASK-003` 另有一条 `failed`，故本卡不宣称这些 AC 已认证通过。
- **review_fact**：N/A — build-code review not executed
- **completed_at**：2026-09-11T23:59:00+08:00
- **执行事实**：2026-09-11：选定 P1/T001，读回当前四材料、正式 build-plan 确认/outcome；创建 `quality/evidence/build-code/P1/phase-card.md`。**2026-09-12 基线核对**：实测 gate 命令 exit 0（5 passed/19 skipped），main 上两个测试文件 `planning-hardening` 命中数均为 0，即命名目标与实现同为 dirty worktree 新增，从未经过本卡设计的 RED→GREEN 序列。owner（用户）明确裁定"改为基线记录"。**本记录不含产品 RED 证据**；快照身份不可解析（`d2ac0f2d…`/`0e7bf9d0…` 等均非有效 git 对象），canonical `facts.jsonl` 为 0 行，故本卡记为基线而非认证通过。

#### T002 — GREEN：类型声明与提问边界

- **ID**：T002
- **Phase**：Phase P1 — 任务类型、提问与真实阶段披露
- **goal**：满足配对目标断言并保留全部负例；类型声明与提问边界
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"plan","ref":"specs/workflowhub-build-prd-workflow-hardening-20260911/plan.md","hash":"8f8931d2380b74d66122342fd82fa0d4e6e515484a7f34f76ce654eabb69ff29","id":"PLAN"},{"artifact_kind":"spec","ref":"specs/workflowhub-build-prd-workflow-hardening-20260911/spec.md","hash":"88174d3fa19c254f1c877194a746ce65a9889c5b2c5a6ef150ad4570bc64905d","id":"SPEC"}]`
- **source_refs / decision_refs**：D-001 D-002 D-003 D-004 D-005 D-008 D-009 D-026；上游来源别名 AC-01 AC-02 AC-03 AC-14 AC-15 AC-16 AC-18
- **输入**：`spec.md#5-功能需求`、`plan.md#phase-p1`；T001真实失败及原始输出
- **依赖**：T001
- **并行**：否 — 依赖配对RED且可能共享文件
- **FR**：FR-TYPE-001 FR-TYPE-002 FR-ASK-001 FR-ASK-002 FR-ASK-003 FR-DOC-001
- **AC**：AC-TYPE-001 AC-ASK-001 AC-ASK-002 AC-ASK-003 AC-PRD-001
- **动作**：首次正式需求提问前，make-decision主会话创建decision-log.md及任务身份段，落一条明确的规划任务/普通任务声明；已有用户明确类型即使用该类型，缺失/冲突按unknown回报并向用户澄清类型，不擅自猜测，仅暂停依赖类型的提问/内容分支，仍可做不依赖类型的准备。在任务身份段加入固定标签与受控值说明，make-decision主会话在提问前读它；在既有stage-content-contracts.mjs增加计划中的内部纯函数readTaskTypeFromDecisionLog(markdown)，仅返回规划任务/普通任务/unknown；唯一任务身份段中表格或粗体标签列表读取，重复/未知即unknown。既有 analyzeDecisionConvergence 与core/task-close消费同一个解析器，材料检查解析同一声明并沿用现有 errors/事实返回，不增 schema 或新结果位。缺失/冲突按 unknown 报告，不推断。规划分支只约束 D-004 类别，普通分支不收紧；规划任务的六类方向槽位（完整用户流程、页面范围、数据状态、成功/失败边界、非目标、延期）逐类保留，每类有真实用户回答或empty加具体留空理由；缺任一槽、改名替代、只写none或假填非真实回答均为负例。用户中途改型后，按当前新类型逐条重新处置已有问答和产物，在当前已确认决定中记录旧问题引用、处置理由和新内容位置；未经重新处置的旧内容不得继续消费，不新增schema、控制面或未批准的类型机器状态，不重绑旧record。
- **精确文件**：`workflows/make-decision/SKILL.md`、`skills/decision-log/SKILL.md`、`skills/decision-log/templates/decision-log-template.md`、`runtime/stage/stage-content-contracts.mjs`、`tests/contract/decision-convergence-depth.test.mjs`、`tests/contract/stage-interaction-batching.test.mjs`
- **boundary**：files: `workflows/make-decision/SKILL.md`、`skills/decision-log/SKILL.md`、`skills/decision-log/templates/decision-log-template.md`、`runtime/stage/stage-content-contracts.mjs`、`tests/contract/decision-convergence-depth.test.mjs`、`tests/contract/stage-interaction-batching.test.mjs`; symbols/regions: 任务身份声明、readTaskTypeFromDecisionLog计划内纯函数、当前提问/内容分支与相应fixture；不扩大文件集合
- **输出**：GREEN目标证据，保留原stdout/stderr、命令fingerprint、snapshot/material与对应AC事实；只有该scope可判真的部分才写通过
- **Knowledge**：结构与夹具只能证明声明/边界合同；旧 hash 被拒绝不是重处置完成证明。AC-ASK-002/003 的完整定性结论仍受 D-029 限制，不伪造用户实际提问行为。
- **verification_role**：GREEN
- **paired_task**：T001
- **gate_cmd**：`node node_modules/vitest/vitest.mjs run tests/contract/decision-convergence-depth.test.mjs tests/contract/stage-interaction-batching.test.mjs --testNamePattern=planning-hardening --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：0
- **oracle**：`ORACLE-TYPE-ASK {"pass":"首次正式需求提问前，make-decision主会话创建decision-log.md及任务身份段，落一条明确的规划任务/普通任务声明；已有用户明确类型即使用该类型，缺失/冲突按unknown回报并向用户澄清类型，不擅自猜测，仅暂停依赖类型的提问/内容分支，仍可做不依赖类型的准备。任务身份段的唯一类型声明可读为规划任务或普通任务；重复同值、冲突双值及未知值均被识别为unknown。规划任务的六类方向槽位（完整用户流程、页面范围、数据状态、成功/失败边界、非目标、延期）逐类保留，每类有真实用户回答或empty加具体留空理由；缺任一槽、改名替代、只写none或假填非真实回答均为负例。规划问答与产物逐类满足十类实现细节禁项，普通任务仍可追问实现细节，选项含含义、直接后果与主要风险。用户中途改型后，按当前新类型逐条重新处置已有问答和产物，在当前已确认决定中记录旧问题引用、处置理由和新内容位置；未经重新处置的旧内容不得继续消费，不新增schema、控制面或未批准的类型机器状态，不重绑旧record；仅更换hash不算完成。","reject":{"input":"未创建decision-log任务身份或未落明确类型声明即开始正式需求提问；忽略用户已明确类型而自行猜测；分别提供缺失、重复、冲突、未知或仅在身份段外出现的声明，unknown时不澄清便进入依赖类型的分支，或连不依赖类型的准备也暂停；六类方向槽位逐类缺一、改名替代、只写none、无具体理由留空或假填非真实回答；规划问答或产物含任一实现机制禁项；选项缺含义、后果或风险；改类型后继续消费未重新处置的旧问答/产物、仅更新hash、缺旧问题引用/处置理由/新内容位置，或新增schema/控制面/未批准的类型机器状态、重绑旧record。","expected_rejection":"不得把先问后声明、自行猜类型或unknown下越过类型澄清的提问/内容分支判为合规，也不得将暂停扩大到不依赖类型的准备；不得将无效声明推断为有效类型；不得把缺任一方向槽、非真实回答、无理由留空、越界内容、信息不全选项或未经新类型逐条重处置的旧内容判为当前合规结果；不得靠新增结构/类型机器状态或旧record重绑满足重处置。","observation":"读回主会话创建decision-log任务身份、用户类型原话/澄清答复、明确声明与首次正式需求提问的顺序；夹具读回类型结论、具体缺口及unknown时分支暂停范围；逐类核对六类槽位的真实回答来源或empty具体理由，并逐类缺一及假填检验；逐类断言规划禁项、普通任务边界及选项三项信息；对照改型前后逐条问答和产物，在当前已确认决定读回旧问题引用、处置理由、新内容位置，确认未经处置旧内容不被消费、未新增schema/控制面/类型机器状态且旧record未重绑。"}}`
- **semantic_review_status**：completed
- **semantic_review_ref**：`quality/reviews/results/build-plan-simple-e5eaaa6a-8530-5ced-ab77-658e1e5dc20d.json`
- **semantic_review_reason**：独立三provider已完成本次草案审查，实际canonical result见ref；本卡有效发现已在当前计划中修复，最终spec-analyze核对修订。此字段不代表产品测试或阶段质量通过。
- **evidence_path**：`quality/evidence/build-code/T001-T002/pair.json`
- **STOP**：零测试匹配、setup失败、未知实际函数签名、需要弱化断言/新增控制面/改产品方向或越界文件时回对应owner；缺质量事实不是停止同task修复的理由
- **recovery**：本卡执行者保留失败原件，修复输入/本次改动后只重跑受影响命名目标；不reset用户改动、不删除旧事实；上游既有D024/D025/D030局部修复保留
- **task risk**：结构与夹具只能证明声明/边界合同；旧 hash 被拒绝不是重处置完成证明。AC-ASK-002/003 的完整定性结论仍受 D-029 限制，不伪造用户实际提问行为。
- **test tier / test method**：feature / backend-testing（本地内容/接口/持久化切片）；独立预判总路线fullstack；本卡命名目标预算60秒
- **scenarios / commands / expected exit / oracle**：首次正式需求提问前，make-decision主会话创建decision-log.md及任务身份段，落一条明确的规划任务/普通任务声明；已有用户明确类型即使用该类型，缺失/冲突按unknown回报并向用户澄清类型，不擅自猜测，仅暂停依赖类型的提问/内容分支，仍可做不依赖类型的准备。规划任务的六类方向槽位（完整用户流程、页面范围、数据状态、成功/失败边界、非目标、延期）逐类保留，每类有真实用户回答或empty加具体留空理由；缺任一槽、改名替代、只写none或假填非真实回答均为负例。用户中途改型后，按当前新类型逐条重新处置已有问答和产物，在当前已确认决定中记录旧问题引用、处置理由和新内容位置；未经重新处置的旧内容不得继续消费，不新增schema、控制面或未批准的类型机器状态，不重绑旧record。唯一规划/普通声明；缺声明、重复同值、冲突双值、未知值；只在任务身份段读取；中途换类型后旧问答/产物不再作当前证据，新内容按新边界重处置；十类禁项各有反例，普通任务仍允许实现细节；选项三项信息缺一的负例。 命令=`node node_modules/vitest/vitest.mjs run tests/contract/decision-convergence-depth.test.mjs tests/contract/stage-interaction-batching.test.mjs --testNamePattern=planning-hardening --poolOptions.forks.singleFork --no-fileParallelism`；退出=0；oracle=ORACLE-TYPE-ASK
- **fixtures_services**：独立当前材料/问答/manifest/outcome fixture；缺失与冲突显式构造，真实用户确认不从fixture发布；service=N/A — 无线上服务
- **coverage limits**：结构与夹具只能证明声明/边界合同；旧 hash 被拒绝不是重处置完成证明。AC-ASK-002/003 的完整定性结论仍受 D-029 限制，不伪造用户实际提问行为。 不真跑新规划任务，不声称少问/变短/token收益。
- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：本卡按 owner 裁定转为基线记录，GREEN 未作为独立步骤执行。卡片要求的生产改动已在同一 dirty worktree 落盘：`runtime/stage/stage-content-contracts.mjs` 新增计划内纯函数 `readTaskTypeFromDecisionLog`（worktree 4 处引用，main 0 处），并同步 `workflows/make-decision/SKILL.md`、`skills/decision-log/SKILL.md`、`skills/decision-log/templates/decision-log-template.md` 的任务身份声明与受控值说明。
- **executed_commands**：`node node_modules/vitest/vitest.mjs run tests/contract/decision-convergence-depth.test.mjs tests/contract/stage-interaction-batching.test.mjs --testNamePattern=planning-hardening --poolOptions.forks.singleFork --no-fileParallelism`；实测 exit 0，`Test Files 2 passed (2)`、`Tests 5 passed | 19 skipped (24)`，与本卡设计的 `expected_exit=0` 一致，可作为基线满足事实，但不能作为 GREEN 步骤已按序执行的证据。
- **evidence_refs**：`quality/evidence/build-code/P1/phase-card.md`（sha256 `8c790cf8dfe363f66383fa5dab6a0907d4e0053cec610cbc211af0579a86ea18`）；实现位置 `runtime/stage/stage-content-contracts.mjs` 的 `readTaskTypeFromDecisionLog`。
- **covered_ac**：`AC-TYPE-001` `AC-ASK-001` `AC-ASK-002` `AC-ASK-003` `AC-PRD-001` 在基线中被命名目标选中并通过；canonical AC 事实仍为 `missing`（`AC-ASK-002`/`AC-ASK-003` 另有 `failed`），故不宣称已认证通过。
- **review_fact**：N/A — build-code review not executed
- **completed_at**：2026-09-11T23:59:00+08:00
- **执行事实**：**2026-09-12 基线核对**：`readTaskTypeFromDecisionLog` 在 main 上为 0 处、worktree 为 4 处；`tests/contract/stage-interaction-batching.test.mjs:192` 直接断言 make-decision SKILL 引用该函数。实现先于/同于测试存在，故本卡无独立 GREEN 步骤可执行。owner（用户）明确裁定"改为基线记录"。快照身份不可解析、canonical 质量事实为 `missing`/`incomplete`，本卡记为基线而非认证通过。

#### T003 — RED：逐项阶段披露与零条目链检查

- **ID**：T003
- **Phase**：Phase P1 — 任务类型、提问与真实阶段披露
- **goal**：获得来自目标断言而非setup的真实失败；逐项阶段披露与零条目链检查
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"plan","ref":"specs/workflowhub-build-prd-workflow-hardening-20260911/plan.md","hash":"8f8931d2380b74d66122342fd82fa0d4e6e515484a7f34f76ce654eabb69ff29","id":"PLAN"},{"artifact_kind":"spec","ref":"specs/workflowhub-build-prd-workflow-hardening-20260911/spec.md","hash":"88174d3fa19c254f1c877194a746ce65a9889c5b2c5a6ef150ad4570bc64905d","id":"SPEC"}]`
- **source_refs / decision_refs**：D-023 D-024 D-025 D-030
- **输入**：`spec.md#5-功能需求`、`plan.md#phase-p1`；当前源字节与明确的场景/文件边界
- **依赖**：T002
- **并行**：否 — 按plan既定生产者顺序执行，未声明并行写
- **FR**：FR-CHECK-001 FR-CHAIN-001
- **AC**：AC-CHECK-001 AC-CHAIN-001
- **动作**：只在列明测试文件增加带 planning-hardening 与相应AC ID的命名目标，使用真实现有入口/模板及独立fixture；先验证命令确实选中了测试。manifest 声明一条未启动、一条跳过、一条已执行但产物缺失、一条产物存在而完成判据缺失；无 outcome 时仍逐条列声明项；executor_absent 不等于正常跳过；h3/h4 决定、无条目、真实缺字段告警。 目标断言先失败，不能先改生产实现来得到RED。已由上游实现的h4等行为不得刻意破坏来造RED；记录其基线，RED针对仍缺的行为。
- **精确文件**：`tests/contract/decision-log-chain-warnings.test.mjs`、`tests/contract/stage-reflection-wiring.test.mjs`
- **boundary**：files: `tests/contract/decision-log-chain-warnings.test.mjs`、`tests/contract/stage-reflection-wiring.test.mjs`; symbols/regions: 五stage的阶段末披露段、checkDecisionLogChain条目识别与零匹配文案；不修OPEN04/05；不扩大文件集合
- **输出**：RED目标证据，保留原stdout/stderr、命令fingerprint、snapshot/material与对应AC事实；记录断言失败位置，不能拿语法/依赖错误作RED
- **Knowledge**：不修 OPEN-04/05 的跨阶段快照与文本碰撞，不补过去执行来源。真实旧告警基数为116，D032新条目如增加合法检查对象应单独说明，不能强造固定总数。
- **verification_role**：RED
- **paired_task**：T004
- **gate_cmd**：`node node_modules/vitest/vitest.mjs run tests/contract/decision-log-chain-warnings.test.mjs tests/contract/stage-reflection-wiring.test.mjs --testNamePattern=planning-hardening --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：1
- **oracle**：`ORACLE-TRUTHFUL-END {"pass":"报告逐条对应manifest全部声明步骤，分别列明完成、跳过、未完成或不可用，并将产物实际存在性与完成判据齐备性分开；没有outcome仍列出所有声明项，executor_absent保持不可用而非正常跳过。链检查识别h3/h4决定条目，零条目明确披露未识别到条目，缺链字段保留真实advisory告警。","reject":{"input":"manifest包含未启动、明确跳过、执行后产物缺失、产物存在但完成判据缺失的步骤；另提供无outcome、executor_absent，以及零决定条目或h3/h4决定缺链字段的材料。","expected_rejection":"不得遗漏声明步骤、用一条笼统原因替代逐项状态、以产物存在替代完成判据，或将executor_absent记为正常跳过；零条目不得报告无告警，缺字段不得补造或隐藏。","observation":"按manifest逐项比对报告状态、产物读回事实与判据缺项；核对h3/h4识别数量、零条目说明及缺字段告警，确认告警不被改成推进门禁。"}}`
- **semantic_review_status**：completed
- **semantic_review_ref**：`quality/reviews/results/build-plan-simple-e5eaaa6a-8530-5ced-ab77-658e1e5dc20d.json`
- **semantic_review_reason**：独立三provider已完成本次草案审查，实际canonical result见ref；本卡有效发现已在当前计划中修复，最终spec-analyze核对修订。此字段不代表产品测试或阶段质量通过。
- **evidence_path**：`quality/evidence/build-code/T003-T004/pair.json`
- **STOP**：零测试匹配、setup失败、未知实际函数签名、需要弱化断言/新增控制面/改产品方向或越界文件时回对应owner；缺质量事实不是停止同task修复的理由
- **recovery**：本卡执行者保留失败原件，修复输入/本次改动后只重跑受影响命名目标；不reset用户改动、不删除旧事实；上游既有D024/D025/D030局部修复保留
- **task risk**：不修 OPEN-04/05 的跨阶段快照与文本碰撞，不补过去执行来源。真实旧告警基数为116，D032新条目如增加合法检查对象应单独说明，不能强造固定总数。
- **test tier / test method**：feature / backend-testing（本地内容/接口/持久化切片）；独立预判总路线fullstack；本卡命名目标预算60秒
- **scenarios / commands / expected exit / oracle**：manifest 声明一条未启动、一条跳过、一条已执行但产物缺失、一条产物存在而完成判据缺失；无 outcome 时仍逐条列声明项；executor_absent 不等于正常跳过；h3/h4 决定、无条目、真实缺字段告警。 命令=`node node_modules/vitest/vitest.mjs run tests/contract/decision-log-chain-warnings.test.mjs tests/contract/stage-reflection-wiring.test.mjs --testNamePattern=planning-hardening --poolOptions.forks.singleFork --no-fileParallelism`；退出=1；oracle=ORACLE-TRUTHFUL-END
- **fixtures_services**：独立当前材料/问答/manifest/outcome fixture；缺失与冲突显式构造，真实用户确认不从fixture发布；service=N/A — 无线上服务
- **coverage limits**：不修 OPEN-04/05 的跨阶段快照与文本碰撞，不补过去执行来源。真实旧告警基数为116，D032新条目如增加合法检查对象应单独说明，不能强造固定总数。 不真跑新规划任务，不声称少问/变短/token收益。
- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：本卡按 owner 裁定转为基线记录，RED 未独立执行。卡片要求的命名目标已在同一 dirty worktree 落盘：`tests/contract/decision-log-chain-warnings.test.mjs` 新增 `planning-hardening AC-CHAIN-001` 目标（worktree 3 处 `planning-hardening`，main 0 处），`tests/contract/stage-reflection-wiring.test.mjs` 新增 `planning-hardening AC-CHECK-001` 逐项披露目标（1 处，main 0 处）。
- **executed_commands**：`node node_modules/vitest/vitest.mjs run tests/contract/decision-log-chain-warnings.test.mjs tests/contract/stage-reflection-wiring.test.mjs --testNamePattern=planning-hardening --poolOptions.forks.singleFork --no-fileParallelism`；实测 exit 0，`Test Files 2 passed (2)`、`Tests 3 passed | 8 skipped (11)`，与本卡设计的 `expected_exit=1`（RED）不符，故不构成 RED 证据。
- **evidence_refs**：`quality/evidence/build-code/P1/phase-card.md`（sha256 `8c790cf8dfe363f66383fa5dab6a0907d4e0053cec610cbc211af0579a86ea18`）
- **covered_ac**：`AC-CHAIN-001` `AC-CHECK-001` 在基线中被命名目标选中并通过；canonical AC 事实未记录本卡认证结果，故不宣称已认证通过。
- **review_fact**：N/A — build-code review not executed
- **completed_at**：2026-09-11T23:59:00+08:00
- **执行事实**：**2026-09-12 基线核对**：实测 gate exit 0；命名目标与实现同为 dirty worktree 新增，从未经过本卡设计的 RED→GREEN 序列。owner（用户）明确裁定"改为基线记录"。**本记录不含产品 RED 证据**；快照身份不可解析（`d2ac0f2d…`/`0e7bf9d0…` 等均非有效 git 对象），canonical `facts.jsonl` 为 0 行，故记为基线而非认证通过。

#### T004 — GREEN：逐项阶段披露与零条目链检查

- **ID**：T004
- **Phase**：Phase P1 — 任务类型、提问与真实阶段披露
- **goal**：满足配对目标断言并保留全部负例；逐项阶段披露与零条目链检查
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"plan","ref":"specs/workflowhub-build-prd-workflow-hardening-20260911/plan.md","hash":"8f8931d2380b74d66122342fd82fa0d4e6e515484a7f34f76ce654eabb69ff29","id":"PLAN"},{"artifact_kind":"spec","ref":"specs/workflowhub-build-prd-workflow-hardening-20260911/spec.md","hash":"88174d3fa19c254f1c877194a746ce65a9889c5b2c5a6ef150ad4570bc64905d","id":"SPEC"}]`
- **source_refs / decision_refs**：D-023 D-024 D-025 D-030
- **输入**：`spec.md#5-功能需求`、`plan.md#phase-p1`；T003真实失败及原始输出
- **依赖**：T003
- **并行**：否 — 依赖配对RED且可能共享文件
- **FR**：FR-CHECK-001 FR-CHAIN-001
- **AC**：AC-CHECK-001 AC-CHAIN-001
- **动作**：五个现有 stage 主会话分别消费已有 step_outcomes/completion/stage_outcome_summary 与自己的 steps manifest；对声明引用做真实读回，再分别报告产物存在性与完成事实，不把 stage 结论均摊到每步，不扩摘要 schema。补 checkDecisionLogChain 的零识别显式告警及 CLI 文案，保持 advisory 与 run-checks 唯一消费者；保留已做的 h4 修复，不补造旧链字段。
- **精确文件**：`workflows/make-decision/SKILL.md`、`workflows/build-spec/SKILL.md`、`workflows/build-plan/SKILL.md`、`workflows/build-code/SKILL.md`、`workflows/verify-code/SKILL.md`、`tools/cli/check-decision-log-chain.mjs`、`tests/contract/decision-log-chain-warnings.test.mjs`、`tests/contract/stage-reflection-wiring.test.mjs`
- **boundary**：files: `workflows/make-decision/SKILL.md`、`workflows/build-spec/SKILL.md`、`workflows/build-plan/SKILL.md`、`workflows/build-code/SKILL.md`、`workflows/verify-code/SKILL.md`、`tools/cli/check-decision-log-chain.mjs`、`tests/contract/decision-log-chain-warnings.test.mjs`、`tests/contract/stage-reflection-wiring.test.mjs`; symbols/regions: 五stage的阶段末披露段、checkDecisionLogChain条目识别与零匹配文案；不修OPEN04/05；不扩大文件集合
- **输出**：GREEN目标证据，保留原stdout/stderr、命令fingerprint、snapshot/material与对应AC事实；只有该scope可判真的部分才写通过
- **Knowledge**：不修 OPEN-04/05 的跨阶段快照与文本碰撞，不补过去执行来源。真实旧告警基数为116，D032新条目如增加合法检查对象应单独说明，不能强造固定总数。
- **verification_role**：GREEN
- **paired_task**：T003
- **gate_cmd**：`node node_modules/vitest/vitest.mjs run tests/contract/decision-log-chain-warnings.test.mjs tests/contract/stage-reflection-wiring.test.mjs --testNamePattern=planning-hardening --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：0
- **oracle**：`ORACLE-TRUTHFUL-END {"pass":"报告逐条对应manifest全部声明步骤，分别列明完成、跳过、未完成或不可用，并将产物实际存在性与完成判据齐备性分开；没有outcome仍列出所有声明项，executor_absent保持不可用而非正常跳过。链检查识别h3/h4决定条目，零条目明确披露未识别到条目，缺链字段保留真实advisory告警。","reject":{"input":"manifest包含未启动、明确跳过、执行后产物缺失、产物存在但完成判据缺失的步骤；另提供无outcome、executor_absent，以及零决定条目或h3/h4决定缺链字段的材料。","expected_rejection":"不得遗漏声明步骤、用一条笼统原因替代逐项状态、以产物存在替代完成判据，或将executor_absent记为正常跳过；零条目不得报告无告警，缺字段不得补造或隐藏。","observation":"按manifest逐项比对报告状态、产物读回事实与判据缺项；核对h3/h4识别数量、零条目说明及缺字段告警，确认告警不被改成推进门禁。"}}`
- **semantic_review_status**：completed
- **semantic_review_ref**：`quality/reviews/results/build-plan-simple-e5eaaa6a-8530-5ced-ab77-658e1e5dc20d.json`
- **semantic_review_reason**：独立三provider已完成本次草案审查，实际canonical result见ref；本卡有效发现已在当前计划中修复，最终spec-analyze核对修订。此字段不代表产品测试或阶段质量通过。
- **evidence_path**：`quality/evidence/build-code/T003-T004/pair.json`
- **STOP**：零测试匹配、setup失败、未知实际函数签名、需要弱化断言/新增控制面/改产品方向或越界文件时回对应owner；缺质量事实不是停止同task修复的理由
- **recovery**：本卡执行者保留失败原件，修复输入/本次改动后只重跑受影响命名目标；不reset用户改动、不删除旧事实；上游既有D024/D025/D030局部修复保留
- **task risk**：不修 OPEN-04/05 的跨阶段快照与文本碰撞，不补过去执行来源。真实旧告警基数为116，D032新条目如增加合法检查对象应单独说明，不能强造固定总数。
- **test tier / test method**：feature / backend-testing（本地内容/接口/持久化切片）；独立预判总路线fullstack；本卡命名目标预算60秒
- **scenarios / commands / expected exit / oracle**：manifest 声明一条未启动、一条跳过、一条已执行但产物缺失、一条产物存在而完成判据缺失；无 outcome 时仍逐条列声明项；executor_absent 不等于正常跳过；h3/h4 决定、无条目、真实缺字段告警。 命令=`node node_modules/vitest/vitest.mjs run tests/contract/decision-log-chain-warnings.test.mjs tests/contract/stage-reflection-wiring.test.mjs --testNamePattern=planning-hardening --poolOptions.forks.singleFork --no-fileParallelism`；退出=0；oracle=ORACLE-TRUTHFUL-END
- **fixtures_services**：独立当前材料/问答/manifest/outcome fixture；缺失与冲突显式构造，真实用户确认不从fixture发布；service=N/A — 无线上服务
- **coverage limits**：不修 OPEN-04/05 的跨阶段快照与文本碰撞，不补过去执行来源。真实旧告警基数为116，D032新条目如增加合法检查对象应单独说明，不能强造固定总数。 不真跑新规划任务，不声称少问/变短/token收益。
- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：本卡按 owner 裁定转为基线记录，GREEN 未作为独立步骤执行。卡片要求的生产改动已落盘：`tools/cli/check-decision-log-chain.mjs` 在本 worktree 修改（worktree 19 处 warn 命中 vs main 18 处），并同步五个 stage SKILL（`workflows/` 下 make-decision、build-spec、build-plan、build-code、verify-code）的阶段末产物/完成事实逐项披露。
- **executed_commands**：`node node_modules/vitest/vitest.mjs run tests/contract/decision-log-chain-warnings.test.mjs tests/contract/stage-reflection-wiring.test.mjs --testNamePattern=planning-hardening --poolOptions.forks.singleFork --no-fileParallelism`；实测 exit 0，`Test Files 2 passed (2)`、`Tests 3 passed | 8 skipped (11)`，与本卡设计的 `expected_exit=0` 一致，可作为基线满足事实，但不构成 GREEN 步骤已按序执行的证据。
- **evidence_refs**：`quality/evidence/build-code/P1/phase-card.md`（sha256 `8c790cf8dfe363f66383fa5dab6a0907d4e0053cec610cbc211af0579a86ea18`）
- **covered_ac**：`AC-CHAIN-001` `AC-CHECK-001` 在基线中被命名目标选中并通过；canonical AC 事实未记录本卡认证结果，故不宣称已认证通过。
- **review_fact**：N/A — build-code review not executed
- **completed_at**：2026-09-11T23:59:00+08:00
- **执行事实**：**2026-09-12 基线核对**：链 checker 零条目显式告警与阶段末披露实现均已在 worktree 存在，main 上无对应改动，故无独立 GREEN 步骤可执行。owner（用户）明确裁定"改为基线记录"。快照身份不可解析（`d2ac0f2d…`/`0e7bf9d0…` 等均非有效 git 对象），canonical `facts.jsonl` 为 0 行，故记为基线而非认证通过。

## Phase P2 — 方向层 PRD、子任务接手与非阶段复盘

### Goal

保留16字段与完整旅程覆盖；子任务只读接手；末步生产、保存并读回复盘，不接正式stage。

### Files

- **NEW**：N/A — 复用现有文件
- **MODIFY**：`skills/spec-prd/SKILL.md`、`skills/spec-prd/templates/prd-template.md`、`workflows/build-prd/SKILL.md`、`workflows/build-prd/steps.json`、`tests/contract/spec-prd-skill-contract.test.mjs`、`tests/contract/build-prd-review-contract.test.mjs`
- **DO NOT TOUCH**：`runtime/schemas/task-fact.v1.json`、`runtime/task/task-store.mjs`；不改stage枚举或持久字段。

### Verify

ORACLE-PRD-HANDOFF / ORACLE-PORTABLE-REFLECTION — 本phase使用下列同名任务oracle；命令与事实路径如下。

T005→T006：`node node_modules/vitest/vitest.mjs run tests/contract/spec-prd-skill-contract.test.mjs --testNamePattern=planning-hardening --poolOptions.forks.singleFork --no-fileParallelism`；RED expected_exit=1（目标断言），GREEN expected_exit=0；ORACLE-PRD-HANDOFF；`quality/evidence/build-code/T005-T006/pair.json`。

T007→T008：`node node_modules/vitest/vitest.mjs run tests/contract/build-prd-review-contract.test.mjs --testNamePattern=planning-hardening --poolOptions.forks.singleFork --no-fileParallelism`；RED expected_exit=1（目标断言），GREEN expected_exit=0；ORACLE-PORTABLE-REFLECTION；`quality/evidence/build-code/T007-T008/pair.json`。

### Knowledge

spec-prd仍是唯一PRD内容writer；第6步只补非内容复盘与报告，规划复盘不是正式stage-reflection。

### STOP

输入缺少真实来源、RED为setup错误、GREEN需放宽断言、发现越界文件或新产品决定时返回对应四材料owner。

### Done

T005、T006、T007、T008 的执行区具备真实变更、命令退出码、逐AC事实和证据引用；失败、跳过、unavailable保留。没有真实执行前全部pending；不把计划中的预期结果当成实测。

### Risks and rollback

RISK-02/03/05：材料变短与可接手性未实跑；通用record可用不等于有调用。回撤本phase文本与调用片段，保留已产生不可变复盘事实；失败如实unavailable。

### Tasks

- T005：RED 方向层 PRD 与子任务最小接手
- T006：GREEN 方向层 PRD 与子任务最小接手
- T007：RED 非阶段复盘生产、保存与读回
- T008：GREEN 非阶段复盘生产、保存与读回

#### T005 — RED：方向层 PRD 与子任务最小接手

- **ID**：T005
- **Phase**：Phase P2 — 方向层 PRD、子任务接手与非阶段复盘
- **goal**：获得来自目标断言而非setup的真实失败；方向层 PRD 与子任务最小接手
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"plan","ref":"specs/workflowhub-build-prd-workflow-hardening-20260911/plan.md","hash":"8f8931d2380b74d66122342fd82fa0d4e6e515484a7f34f76ce654eabb69ff29","id":"PLAN"},{"artifact_kind":"spec","ref":"specs/workflowhub-build-prd-workflow-hardening-20260911/spec.md","hash":"88174d3fa19c254f1c877194a746ce65a9889c5b2c5a6ef150ad4570bc64905d","id":"SPEC"}]`
- **source_refs / decision_refs**：D-005 D-006 D-007 D-014 D-015 D-017 D-018 D-021 D-027；上游来源别名 AC-04 AC-05 AC-06 AC-11 AC-13 AC-16 AC-17
- **输入**：`spec.md#5-功能需求`、`plan.md#phase-p2`；当前源字节与明确的场景/文件边界
- **依赖**：T004
- **并行**：否 — 按plan既定生产者顺序执行，未声明并行写
- **FR**：FR-DOC-001 FR-PRD-001 FR-PRD-002 FR-PRD-003 FR-CHILD-001 FR-CHILD-002 FR-CHILD-003
- **AC**：AC-PRD-001 AC-PRD-002 AC-CHILD-001 AC-CHILD-002 AC-CONTRACT-001
- **动作**：只在列明测试文件增加带 planning-hardening 与相应AC ID的命名目标，使用真实现有入口/模板及独立fixture；先验证命令确实选中了测试。完整旅程、每项需求的责任卡/排除理由、目标边界验收依赖四项；模板外章节、实现机制细节、缺旅程/覆盖负例；16卡字段字面量保留；限定输入的子任务夹具；母/兄弟材料写入尝试被禁止，边界偏离三项留痕。 目标断言先失败，不能先改生产实现来得到RED。已由上游实现的h4等行为不得刻意破坏来造RED；记录其基线，RED针对仍缺的行为。
- **精确文件**：`tests/contract/spec-prd-skill-contract.test.mjs`
- **boundary**：files: `tests/contract/spec-prd-skill-contract.test.mjs`; symbols/regions: 现有模板product_overview/task_map/16字段填充说明、子任务最小读取与差异留痕；不扩大文件集合
- **输出**：RED目标证据，保留原stdout/stderr、命令fingerprint、snapshot/material与对应AC事实；记录断言失败位置，不能拿语法/依赖错误作RED
- **Knowledge**：限定读取的夹具不等于真实子任务运行；AC-CHILD-001完整可接手性与省上下文收益保持未知；不得为了填模板恢复已取消的机器差额链。
- **verification_role**：RED
- **paired_task**：T006
- **gate_cmd**：`node node_modules/vitest/vitest.mjs run tests/contract/spec-prd-skill-contract.test.mjs --testNamePattern=planning-hardening --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：1
- **oracle**：`ORACLE-PRD-HANDOFF {"pass":"规划PRD在既有章节保留完整旅程、每项需求的责任卡或明确排除理由，每卡具备目标、边界、验收与依赖且16个既有字段名完整；决策与PRD内容仅到方向层。限定输入的子任务夹具仅消费本卡及自身材料，母任务与兄弟材料/记录前后字节不变，不触发母任务close、无文件move、无文件delete；偏离边界时保留原边界、实际偏离和原因，结构接手结果不冒充完整定性接手验收。","reject":{"input":"规划材料增加模板外章节或实现机制细节，缺旅程、需求覆盖或任务四项信息；删改既有字段名；子任务依赖未提供的母任务实现细节，分别尝试写母任务或兄弟记录、触发母任务close、move或delete文件，或偏离边界却缺三项说明。","expected_rejection":"材料结构或内容边界缺口不得判为合规，缺最小输入不得靠猜测完成接手；越权写入、母任务close、move、delete均不得发生，不能仅凭文件字节不变判为只读；缺失差异记录不得判为可追溯。","observation":"检查章节、十类禁项、覆盖映射及16字段；限定夹具读取集，比对母任务与兄弟材料/记录前后字节；对照调用账目及tree_before/tree_after，逐项观察被拒绝的写入/母任务close/move/delete尝试，确认无母任务close触发、无move/delete执行且路径集合及文件内容保持不变；核对差异三项内容，完整定性结论仍按D029披露不可用。"}}`
- **semantic_review_status**：completed
- **semantic_review_ref**：`quality/reviews/results/build-plan-simple-e5eaaa6a-8530-5ced-ab77-658e1e5dc20d.json`
- **semantic_review_reason**：独立三provider已完成本次草案审查，实际canonical result见ref；本卡有效发现已在当前计划中修复，最终spec-analyze核对修订。此字段不代表产品测试或阶段质量通过。
- **evidence_path**：`quality/evidence/build-code/T005-T006/pair.json`
- **STOP**：零测试匹配、setup失败、未知实际函数签名、需要弱化断言/新增控制面/改产品方向或越界文件时回对应owner；缺质量事实不是停止同task修复的理由
- **recovery**：本卡执行者保留失败原件，修复输入/本次改动后只重跑受影响命名目标；不reset用户改动、不删除旧事实；上游既有D024/D025/D030局部修复保留
- **task risk**：限定读取的夹具不等于真实子任务运行；AC-CHILD-001完整可接手性与省上下文收益保持未知；不得为了填模板恢复已取消的机器差额链。
- **test tier / test method**：feature / backend-testing（本地内容/接口/持久化切片）；独立预判总路线fullstack；本卡命名目标预算60秒
- **scenarios / commands / expected exit / oracle**：完整旅程、每项需求的责任卡/排除理由、目标边界验收依赖四项；模板外章节、实现机制细节、缺旅程/覆盖负例；16卡字段字面量保留；限定输入的子任务夹具；母/兄弟材料写入与母任务close/move/delete尝试分别被禁止；调用账目及tree_before/tree_after确认母/兄弟材料字节不变、不触发母close、无move/delete；边界偏离三项留痕。 命令=`node node_modules/vitest/vitest.mjs run tests/contract/spec-prd-skill-contract.test.mjs --testNamePattern=planning-hardening --poolOptions.forks.singleFork --no-fileParallelism`；退出=1；oracle=ORACLE-PRD-HANDOFF
- **fixtures_services**：小型规划PRD正反fixture与只读母/兄弟哨兵文件；固定现有16字段；不重写历史材料；service=N/A — 无线上服务
- **coverage limits**：限定读取的夹具不等于真实子任务运行；AC-CHILD-001完整可接手性与省上下文收益保持未知；不得为了填模板恢复已取消的机器差额链。 不真跑新规划任务，不声称少问/变短/token收益。
- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：本卡按 owner 裁定转为基线记录，RED 未独立执行。卡片要求的命名目标已落盘：`tests/contract/spec-prd-skill-contract.test.mjs` 新增 `planning-hardening` 方向层 PRD/子任务接手目标（worktree 4 处，main 0 处）。
- **executed_commands**：`node node_modules/vitest/vitest.mjs run tests/contract/spec-prd-skill-contract.test.mjs --testNamePattern=planning-hardening --poolOptions.forks.singleFork --no-fileParallelism`；实测 exit 0，`Test Files 1 passed (1)`、`Tests 3 passed | 10 skipped (13)`，与本卡设计的 `expected_exit=1`（RED）不符，故不构成 RED 证据。
- **evidence_refs**：`quality/evidence/build-code/P1/phase-card.md`（sha256 `8c790cf8dfe363f66383fa5dab6a0907d4e0053cec610cbc211af0579a86ea18`）
- **covered_ac**：`AC-PRD-001` `AC-PRD-002` `AC-CHILD-001` `AC-CHILD-002` `AC-CONTRACT-001` 中，基线命名目标实际覆盖 `AC-PRD-001`、`AC-CHILD-001/002`、`AC-CONTRACT-001`；`AC-CHILD-001` 的完整可接手性仍受 D-029 限制为不可用。
- **review_fact**：N/A — build-code review not executed
- **completed_at**：2026-09-11T23:59:00+08:00
- **执行事实**：**2026-09-12 基线核对**：实测 gate exit 0；命名目标与实现同为 dirty worktree 新增，从未经过本卡设计的 RED→GREEN 序列。owner（用户）明确裁定"改为基线记录"。**本记录不含产品 RED 证据**；快照身份不可解析（`d2ac0f2d…`/`0e7bf9d0…` 等均非有效 git 对象），canonical `facts.jsonl` 为 0 行，故记为基线而非认证通过。

#### T006 — GREEN：方向层 PRD 与子任务最小接手

- **ID**：T006
- **Phase**：Phase P2 — 方向层 PRD、子任务接手与非阶段复盘
- **goal**：满足配对目标断言并保留全部负例；方向层 PRD 与子任务最小接手
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"plan","ref":"specs/workflowhub-build-prd-workflow-hardening-20260911/plan.md","hash":"8f8931d2380b74d66122342fd82fa0d4e6e515484a7f34f76ce654eabb69ff29","id":"PLAN"},{"artifact_kind":"spec","ref":"specs/workflowhub-build-prd-workflow-hardening-20260911/spec.md","hash":"88174d3fa19c254f1c877194a746ce65a9889c5b2c5a6ef150ad4570bc64905d","id":"SPEC"}]`
- **source_refs / decision_refs**：D-005 D-006 D-007 D-014 D-015 D-017 D-018 D-021 D-027；上游来源别名 AC-04 AC-05 AC-06 AC-11 AC-13 AC-16 AC-17
- **输入**：`spec.md#5-功能需求`、`plan.md#phase-p2`；T005真实失败及原始输出
- **依赖**：T005
- **并行**：否 — 依赖配对RED且可能共享文件
- **FR**：FR-DOC-001 FR-PRD-001 FR-PRD-002 FR-PRD-003 FR-CHILD-001 FR-CHILD-002 FR-CHILD-003
- **AC**：AC-PRD-001 AC-PRD-002 AC-CHILD-001 AC-CHILD-002 AC-CONTRACT-001
- **动作**：仅调整现有字段的填写纪律：product_overview写完整方向旅程，task_map写需求覆盖与责任卡，保留16字段及四类依赖；不加章节或数字篇幅上限。最小读取集只含本卡/共享定义必要段与子任务自有材料；五阶段开工说明要求子任务自行设计、在自己材料记原边界/实际偏离/原因；不读机器父子链、不写母或兄弟、不自动归档。
- **精确文件**：`skills/spec-prd/SKILL.md`、`skills/spec-prd/templates/prd-template.md`、`tests/contract/spec-prd-skill-contract.test.mjs`
- **boundary**：files: `skills/spec-prd/SKILL.md`、`skills/spec-prd/templates/prd-template.md`、`tests/contract/spec-prd-skill-contract.test.mjs`; symbols/regions: 现有模板product_overview/task_map/16字段填充说明、子任务最小读取与差异留痕；不扩大文件集合
- **输出**：GREEN目标证据，保留原stdout/stderr、命令fingerprint、snapshot/material与对应AC事实；只有该scope可判真的部分才写通过
- **Knowledge**：限定读取的夹具不等于真实子任务运行；AC-CHILD-001完整可接手性与省上下文收益保持未知；不得为了填模板恢复已取消的机器差额链。
- **verification_role**：GREEN
- **paired_task**：T005
- **gate_cmd**：`node node_modules/vitest/vitest.mjs run tests/contract/spec-prd-skill-contract.test.mjs --testNamePattern=planning-hardening --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：0
- **oracle**：`ORACLE-PRD-HANDOFF {"pass":"规划PRD在既有章节保留完整旅程、每项需求的责任卡或明确排除理由，每卡具备目标、边界、验收与依赖且16个既有字段名完整；决策与PRD内容仅到方向层。限定输入的子任务夹具仅消费本卡及自身材料，母任务与兄弟材料/记录前后字节不变，不触发母任务close、无文件move、无文件delete；偏离边界时保留原边界、实际偏离和原因，结构接手结果不冒充完整定性接手验收。","reject":{"input":"规划材料增加模板外章节或实现机制细节，缺旅程、需求覆盖或任务四项信息；删改既有字段名；子任务依赖未提供的母任务实现细节，分别尝试写母任务或兄弟记录、触发母任务close、move或delete文件，或偏离边界却缺三项说明。","expected_rejection":"材料结构或内容边界缺口不得判为合规，缺最小输入不得靠猜测完成接手；越权写入、母任务close、move、delete均不得发生，不能仅凭文件字节不变判为只读；缺失差异记录不得判为可追溯。","observation":"检查章节、十类禁项、覆盖映射及16字段；限定夹具读取集，比对母任务与兄弟材料/记录前后字节；对照调用账目及tree_before/tree_after，逐项观察被拒绝的写入/母任务close/move/delete尝试，确认无母任务close触发、无move/delete执行且路径集合及文件内容保持不变；核对差异三项内容，完整定性结论仍按D029披露不可用。"}}`
- **semantic_review_status**：completed
- **semantic_review_ref**：`quality/reviews/results/build-plan-simple-e5eaaa6a-8530-5ced-ab77-658e1e5dc20d.json`
- **semantic_review_reason**：独立三provider已完成本次草案审查，实际canonical result见ref；本卡有效发现已在当前计划中修复，最终spec-analyze核对修订。此字段不代表产品测试或阶段质量通过。
- **evidence_path**：`quality/evidence/build-code/T005-T006/pair.json`
- **STOP**：零测试匹配、setup失败、未知实际函数签名、需要弱化断言/新增控制面/改产品方向或越界文件时回对应owner；缺质量事实不是停止同task修复的理由
- **recovery**：本卡执行者保留失败原件，修复输入/本次改动后只重跑受影响命名目标；不reset用户改动、不删除旧事实；上游既有D024/D025/D030局部修复保留
- **task risk**：限定读取的夹具不等于真实子任务运行；AC-CHILD-001完整可接手性与省上下文收益保持未知；不得为了填模板恢复已取消的机器差额链。
- **test tier / test method**：feature / backend-testing（本地内容/接口/持久化切片）；独立预判总路线fullstack；本卡命名目标预算60秒
- **scenarios / commands / expected exit / oracle**：完整旅程、每项需求的责任卡/排除理由、目标边界验收依赖四项；模板外章节、实现机制细节、缺旅程/覆盖负例；16卡字段字面量保留；限定输入的子任务夹具；母/兄弟材料写入与母任务close/move/delete尝试分别被禁止；调用账目及tree_before/tree_after确认母/兄弟材料字节不变、不触发母close、无move/delete；边界偏离三项留痕。 命令=`node node_modules/vitest/vitest.mjs run tests/contract/spec-prd-skill-contract.test.mjs --testNamePattern=planning-hardening --poolOptions.forks.singleFork --no-fileParallelism`；退出=0；oracle=ORACLE-PRD-HANDOFF
- **fixtures_services**：小型规划PRD正反fixture与只读母/兄弟哨兵文件；固定现有16字段；不重写历史材料；service=N/A — 无线上服务
- **coverage limits**：限定读取的夹具不等于真实子任务运行；AC-CHILD-001完整可接手性与省上下文收益保持未知；不得为了填模板恢复已取消的机器差额链。 不真跑新规划任务，不声称少问/变短/token收益。
- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：本卡按 owner 裁定转为基线记录，GREEN 未作为独立步骤执行。卡片要求的生产改动已在 worktree：`skills/spec-prd/SKILL.md`、`skills/spec-prd/templates/prd-template.md` 与 `tests/contract/spec-prd-skill-contract.test.mjs` 同批修改，方向层 PRD 填充纪律与每需求责任卡/排除理由写入既有章节。
- **executed_commands**：`node node_modules/vitest/vitest.mjs run tests/contract/spec-prd-skill-contract.test.mjs --testNamePattern=planning-hardening --poolOptions.forks.singleFork --no-fileParallelism`；实测 exit 0，`Test Files 1 passed (1)`、`Tests 3 passed | 10 skipped (13)`，与本卡设计的 `expected_exit=0` 一致，可作为基线满足事实，但不构成 GREEN 步骤已按序执行的证据。
- **evidence_refs**：`quality/evidence/build-code/P1/phase-card.md`（sha256 `8c790cf8dfe363f66383fa5dab6a0907d4e0053cec610cbc211af0579a86ea18`）
- **covered_ac**：`AC-PRD-001` `AC-PRD-002` `AC-CONTRACT-001` 在基线中被命名目标选中并通过；canonical AC 事实未记录本卡认证结果，故不宣称已认证通过。
- **review_fact**：N/A — build-code review not executed
- **completed_at**：2026-09-11T23:59:00+08:00
- **执行事实**：**2026-09-12 基线核对**：PRD 填充纪律实现与测试同批落盘，main 无对应改动，故无独立 GREEN 步骤可执行。owner（用户）明确裁定"改为基线记录"。快照身份不可解析（`d2ac0f2d…`/`0e7bf9d0…` 等均非有效 git 对象），canonical `facts.jsonl` 为 0 行，故记为基线而非认证通过。

#### T007 — RED：非阶段复盘生产、保存与读回

- **ID**：T007
- **Phase**：Phase P2 — 方向层 PRD、子任务接手与非阶段复盘
- **goal**：获得来自目标断言而非setup的真实失败；非阶段复盘生产、保存与读回
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"plan","ref":"specs/workflowhub-build-prd-workflow-hardening-20260911/plan.md","hash":"8f8931d2380b74d66122342fd82fa0d4e6e515484a7f34f76ce654eabb69ff29","id":"PLAN"},{"artifact_kind":"spec","ref":"specs/workflowhub-build-prd-workflow-hardening-20260911/spec.md","hash":"88174d3fa19c254f1c877194a746ce65a9889c5b2c5a6ef150ad4570bc64905d","id":"SPEC"}]`
- **source_refs / decision_refs**：D-010 D-016 D-019 D-027 D-033；上游来源别名 AC-07 AC-09 AC-12
- **输入**：`spec.md#5-功能需求`、`plan.md#phase-p2`；当前源字节与明确的场景/文件边界
- **依赖**：T006
- **并行**：否 — 按plan既定生产者顺序执行，未声明并行写
- **FR**：FR-REFLECT-001 FR-CHECK-001 FR-CLOSE-003
- **AC**：AC-REFLECT-001 AC-CHECK-001 AC-META-001 AC-CLOSE-002
- **动作**：只在列明测试文件增加带 planning-hardening 与相应AC ID的命名目标，使用真实现有入口/模板及独立fixture；先验证命令确实选中了测试。非空结论引用实际步骤，task/workflow绑定一致，publish→read→hash一致；空内容、错task、写入失败、读回失败均 unavailable；没有正式stage身份；源/确认/review/复盘/交付分报；不增加第三次spec-prd内容调用或第二次review。 目标断言先失败，不能先改生产实现来得到RED。已由上游实现的h4等行为不得刻意破坏来造RED；记录其基线，RED针对仍缺的行为。 将T008同一SKILL调用片段作为被测输入，在真实临时TaskHandle/Kernel中执行保存→读回→报告/交接；断言payload task_id/workflow/material_refs/step_results/reflection_facts完整且来自本次fixture，不只检查路径存在。 按plan“声明的实际producer与保存合同”补现有第6步的声明保存/读回片段：普通JSON仅task_id、workflow、material_refs、reply_text、step_slug=report-facts-and-handoff，显式当前decision/PRD/附件ref+hash，raw字节寻址并由既有publishCanonicalRecord/readRecord保存读回。不得借human-confirmation.v3的accepted/rejected表示清单完成；不新增step/script/export/schema/store，不扫描latest。真实fixture执行该snippet，验证原话、当前材料、错task/hash/空话/写读失败；声明不能误读为复盘或操作确认。 依plan“第6步唯一可执行来源与人工归档调用边界”，实现/测试唯一标记包围的完整ESM块，真实宿主必须调用reportFactsAndHandoff，reader验证原件后生成report/handoff；接手用同一reader重读。测试按标记提取SKILL原始块执行同一入口，禁止复制实现、只测保存函数或仅匹配文字。
- **精确文件**：`tests/contract/build-prd-review-contract.test.mjs`
- **boundary**：files: `tests/contract/build-prd-review-contract.test.mjs`; symbols/regions: build-prd现有第6步及其受控kernel保存读回调用片段、reflection_facts输入与测试；不扩大文件集合
- **输出**：RED目标证据，保留原stdout/stderr、命令fingerprint、snapshot/material与对应AC事实；记录断言失败位置，不能拿语法/依赖错误作RED
- **Knowledge**：reflection_facts 原先只是 optional review slot，不宣称已存在专用producer。通用kernel保存读回的夹具证明接线；不真跑规划任务，不把非stage复盘塞进五阶段facts.jsonl或stage-reflection强闭环。
- **verification_role**：RED
- **paired_task**：T008
- **gate_cmd**：`node node_modules/vitest/vitest.mjs run tests/contract/build-prd-review-contract.test.mjs --testNamePattern=planning-hardening --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：1
- **oracle**：`ORACLE-PORTABLE-REFLECTION {"pass":"规划工作流末步在报告前生产并保存非空复盘结论及实际步骤引用，绑定当前task与build-prd工作流，发布后读回内容和hash一致；不绑定正式stage身份。源、确认、审查、复盘与交付事实分别披露，不增加第三次spec-prd内容调用或第二次审查。 已声明portable路径按raw字节SHA寻址，报告summary/step_results与保存后读回value一致，接手者按同一显式taskPath/ref/hash读回。 同一现有保存接口对声明保留当前材料绑定及原话；声明不是复盘或closeplan确认。 第6步必须运行唯一源块的reportFactsAndHandoff→readReflectionForReport，报告值来自校验后的readback；接手再次按显式ref/hash读取同一记录。","reject":{"input":"复盘结论为空、步骤引用不实、task或workflow错绑、混入正式stage身份，或复盘写入及读回发生失败。 另构造缺material_refs/step_results来源、workflow错误、报告引用另一份未验hash的值。 声明为空/错task/材料ref或hash错误、保存读回失败，或把声明作复盘/closeplan approval。 源块标记缺失/重复、只复制snippet、报告使用未读回payload、跳过reader、handoff篡改或接手读到其他记录。","expected_rejection":"不得将空、错绑、未保存或无法读回的复盘记为完成；失败保持unavailable并披露具体缺口，不用其他事实或额外内容调用、额外审查替代复盘。 不能把通用kernel保存成功或optional review槽当成已绑定复盘事实。 声明错误不得返回成功ref或触发操作；不引入完成枚举。 源码未被实际调用或reader拒绝时不得产出成功handoff；自然语言执行效果保持未实测。","observation":"读回末步触发顺序、复盘原件与hash，核对task/workflow及步骤引用；失败夹具检查unavailable和分项报告，并核对内容调用及审查次数未增加。 真实执行SKILL片段，核对raw字节/sha/ref与报告和handoff读取值。 执行同一声明snippet，读回raw/hash/原话及失败输出；检查无close approval、授权或Git动作。 从真实SKILL提取唯一完整ESM块并执行第6步入口，在真实TaskKernel读回报告与接手调用链；对照顺序及源字节，不以字符串存在代替实际执行。"}}`
- **semantic_review_status**：completed
- **semantic_review_ref**：`quality/reviews/results/build-plan-simple-e5eaaa6a-8530-5ced-ab77-658e1e5dc20d.json`
- **semantic_review_reason**：D033当前独立三provider审查已返回；6条原始发现按plan当前处置表修订，本字段表示已审查及处置，不表示产品行为通过或最终人类确认。
- **evidence_path**：`quality/evidence/build-code/T007-T008/pair.json`
- **STOP**：零测试匹配、setup失败、未知实际函数签名、需要弱化断言/新增控制面/改产品方向或越界文件时回对应owner；缺质量事实不是停止同task修复的理由
- **recovery**：本卡执行者保留失败原件，修复输入/本次改动后只重跑受影响命名目标；不reset用户改动、不删除旧事实；上游既有D024/D025/D030局部修复保留
- **task risk**：reflection_facts 原先只是 optional review slot，不宣称已存在专用producer。通用kernel保存读回的夹具证明接线；不真跑规划任务，不把非stage复盘塞进五阶段facts.jsonl或stage-reflection强闭环。
- **test tier / test method**：feature / backend-testing（本地内容/接口/持久化切片）；独立预判总路线fullstack；本卡命名目标预算60秒
- **scenarios / commands / expected exit / oracle**：非空结论引用实际步骤，task/workflow绑定一致，publish→read→hash一致；空内容、错task、写入失败、读回失败均 unavailable；没有正式stage身份；源/确认/review/复盘/交付分报；不增加第三次spec-prd内容调用或第二次review。 命令=`node node_modules/vitest/vitest.mjs run tests/contract/build-prd-review-contract.test.mjs --testNamePattern=planning-hardening --poolOptions.forks.singleFork --no-fileParallelism`；退出=1；oracle=ORACLE-PORTABLE-REFLECTION 同时测试声明保存原话、材料绑定和读写失败；反例与上述oracle一致。
- **fixtures_services**：在已有TaskHandle/TaskKernel测试fixture的隔离task中执行SKILL中的实际保存/读回片段；成功、空内容、错误绑定、写/读失败输入；无真实规划会话；service=N/A — 无线上服务
- **coverage limits**：reflection_facts 原先只是 optional review slot，不宣称已存在专用producer。通用kernel保存读回的夹具证明接线；不真跑规划任务，不把非stage复盘塞进五阶段facts.jsonl或stage-reflection强闭环。 不真跑新规划任务，不声称少问/变短/token收益。
- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：本卡按 owner 裁定转为基线记录，RED 未独立执行。卡片要求的命名目标已落盘：`tests/contract/build-prd-review-contract.test.mjs` 新增 `planning-hardening` 非阶段复盘生产/保存/读回目标（worktree 3 处 `planning-hardening`、7 处 `publishCanonicalRecord`/`reflection_facts`，main 均为 0）。
- **executed_commands**：`node node_modules/vitest/vitest.mjs run tests/contract/build-prd-review-contract.test.mjs --testNamePattern=planning-hardening --poolOptions.forks.singleFork --no-fileParallelism`；实测 exit 0，`Test Files 1 passed (1)`、`Tests 2 passed | 8 skipped (10)`，与本卡设计的 `expected_exit=1`（RED）不符，故不构成 RED 证据。
- **evidence_refs**：`quality/evidence/build-code/P1/phase-card.md`（sha256 `8c790cf8dfe363f66383fa5dab6a0907d4e0053cec610cbc211af0579a86ea18`）
- **covered_ac**：`AC-REFLECT-001` `AC-CHECK-001` `AC-META-001` `AC-CLOSE-002` 中，基线命名目标实际覆盖 `AC-REFLECT-001`/`AC-META-001` 与 `AC-CHECK-001`/`AC-CLOSE-002`。
- **review_fact**：N/A — build-code review not executed
- **completed_at**：2026-09-11T23:59:00+08:00
- **执行事实**：**2026-09-12 基线核对**：实测 gate exit 0；命名目标与实现同为 dirty worktree 新增，从未经过本卡设计的 RED→GREEN 序列。owner（用户）明确裁定"改为基线记录"。**本记录不含产品 RED 证据**；快照身份不可解析（`d2ac0f2d…`/`0e7bf9d0…` 等均非有效 git 对象），canonical `facts.jsonl` 为 0 行，故记为基线而非认证通过。

#### T008 — GREEN：非阶段复盘生产、保存与读回

- **ID**：T008
- **Phase**：Phase P2 — 方向层 PRD、子任务接手与非阶段复盘
- **goal**：满足配对目标断言并保留全部负例；非阶段复盘生产、保存与读回
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"plan","ref":"specs/workflowhub-build-prd-workflow-hardening-20260911/plan.md","hash":"8f8931d2380b74d66122342fd82fa0d4e6e515484a7f34f76ce654eabb69ff29","id":"PLAN"},{"artifact_kind":"spec","ref":"specs/workflowhub-build-prd-workflow-hardening-20260911/spec.md","hash":"88174d3fa19c254f1c877194a746ce65a9889c5b2c5a6ef150ad4570bc64905d","id":"SPEC"}]`
- **source_refs / decision_refs**：D-010 D-016 D-019 D-027 D-033；上游来源别名 AC-07 AC-09 AC-12
- **输入**：`spec.md#5-功能需求`、`plan.md#phase-p2`；T007真实失败及原始输出
- **依赖**：T007
- **并行**：否 — 依赖配对RED且可能共享文件
- **FR**：FR-REFLECT-001 FR-CHECK-001 FR-CLOSE-003
- **AC**：AC-REFLECT-001 AC-CHECK-001 AC-META-001 AC-CLOSE-002
- **动作**：在现有第6步 report-facts-and-handoff 内先由主会话生产 reflection_facts，再通过其已认证 task/kernel 的 publishCanonicalRecord(relativePath,raw) 保存到已声明 portable-workflow-outcomes/build-prd 内容寻址记录，readRecord(relativePath) 读回；随后报告并把同一ref交给接手者。SKILL给出实际可执行的窄调用片段及所需已存在上下文，测试执行该片段而非只匹配词；宿主无kernel能力就如实 unavailable，不另造命令/dispatcher。 精确接口按plan“非stage复盘的具体保存与读回”：openTask(taskPath,projectName,taskId)→createTaskKernel(task)；输入是当前宿主显式task/workflow、material_refs、step_results和reflection_facts；JSON.stringify(payload,null,2)+"\n"算sha256，ref=quality/evidence/portable-workflow-outcomes/build-prd/<sha256>.json；publishCanonicalRecord后readRecord字节/hash双读回，报告只消费读回value并交接同ref/hash。snippet使用真实runtime/task/task-handle.mjs及task-kernel.mjs导出，不能bootstrapStage("build-prd")。 按plan“声明的实际producer与保存合同”补现有第6步的声明保存/读回片段：普通JSON仅task_id、workflow、material_refs、reply_text、step_slug=report-facts-and-handoff，显式当前decision/PRD/附件ref+hash，raw字节寻址并由既有publishCanonicalRecord/readRecord保存读回。不得借human-confirmation.v3的accepted/rejected表示清单完成；不新增step/script/export/schema/store，不扫描latest。真实fixture执行该snippet，验证原话、当前材料、错task/hash/空话/写读失败；声明不能误读为复盘或操作确认。 依plan“第6步唯一可执行来源与人工归档调用边界”，实现/测试唯一标记包围的完整ESM块，真实宿主必须调用reportFactsAndHandoff，reader验证原件后生成report/handoff；接手用同一reader重读。测试按标记提取SKILL原始块执行同一入口，禁止复制实现、只测保存函数或仅匹配文字。
- **精确文件**：`workflows/build-prd/SKILL.md`、`workflows/build-prd/steps.json`、`tests/contract/build-prd-review-contract.test.mjs`
- **boundary**：files: `workflows/build-prd/SKILL.md`、`workflows/build-prd/steps.json`、`tests/contract/build-prd-review-contract.test.mjs`; symbols/regions: build-prd现有第6步及其受控kernel保存读回调用片段、reflection_facts输入与测试；不扩大文件集合
- **输出**：GREEN目标证据，保留原stdout/stderr、命令fingerprint、snapshot/material与对应AC事实；只有该scope可判真的部分才写通过
- **Knowledge**：reflection_facts 原先只是 optional review slot，不宣称已存在专用producer。通用kernel保存读回的夹具证明接线；不真跑规划任务，不把非stage复盘塞进五阶段facts.jsonl或stage-reflection强闭环。
- **verification_role**：GREEN
- **paired_task**：T007
- **gate_cmd**：`node node_modules/vitest/vitest.mjs run tests/contract/build-prd-review-contract.test.mjs --testNamePattern=planning-hardening --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：0
- **oracle**：`ORACLE-PORTABLE-REFLECTION {"pass":"规划工作流末步在报告前生产并保存非空复盘结论及实际步骤引用，绑定当前task与build-prd工作流，发布后读回内容和hash一致；不绑定正式stage身份。源、确认、审查、复盘与交付事实分别披露，不增加第三次spec-prd内容调用或第二次审查。 已声明portable路径按raw字节SHA寻址，报告summary/step_results与保存后读回value一致，接手者按同一显式taskPath/ref/hash读回。 同一现有保存接口对声明保留当前材料绑定及原话；声明不是复盘或closeplan确认。 第6步必须运行唯一源块的reportFactsAndHandoff→readReflectionForReport，报告值来自校验后的readback；接手再次按显式ref/hash读取同一记录。","reject":{"input":"复盘结论为空、步骤引用不实、task或workflow错绑、混入正式stage身份，或复盘写入及读回发生失败。 另构造缺material_refs/step_results来源、workflow错误、报告引用另一份未验hash的值。 声明为空/错task/材料ref或hash错误、保存读回失败，或把声明作复盘/closeplan approval。 源块标记缺失/重复、只复制snippet、报告使用未读回payload、跳过reader、handoff篡改或接手读到其他记录。","expected_rejection":"不得将空、错绑、未保存或无法读回的复盘记为完成；失败保持unavailable并披露具体缺口，不用其他事实或额外内容调用、额外审查替代复盘。 不能把通用kernel保存成功或optional review槽当成已绑定复盘事实。 声明错误不得返回成功ref或触发操作；不引入完成枚举。 源码未被实际调用或reader拒绝时不得产出成功handoff；自然语言执行效果保持未实测。","observation":"读回末步触发顺序、复盘原件与hash，核对task/workflow及步骤引用；失败夹具检查unavailable和分项报告，并核对内容调用及审查次数未增加。 真实执行SKILL片段，核对raw字节/sha/ref与报告和handoff读取值。 执行同一声明snippet，读回raw/hash/原话及失败输出；检查无close approval、授权或Git动作。 从真实SKILL提取唯一完整ESM块并执行第6步入口，在真实TaskKernel读回报告与接手调用链；对照顺序及源字节，不以字符串存在代替实际执行。"}}`
- **semantic_review_status**：completed
- **semantic_review_ref**：`quality/reviews/results/build-plan-simple-e5eaaa6a-8530-5ced-ab77-658e1e5dc20d.json`
- **semantic_review_reason**：D033当前独立三provider审查已返回；6条原始发现按plan当前处置表修订，本字段表示已审查及处置，不表示产品行为通过或最终人类确认。
- **evidence_path**：`quality/evidence/build-code/T007-T008/pair.json`
- **STOP**：零测试匹配、setup失败、未知实际函数签名、需要弱化断言/新增控制面/改产品方向或越界文件时回对应owner；缺质量事实不是停止同task修复的理由
- **recovery**：本卡执行者保留失败原件，修复输入/本次改动后只重跑受影响命名目标；不reset用户改动、不删除旧事实；上游既有D024/D025/D030局部修复保留
- **task risk**：reflection_facts 原先只是 optional review slot，不宣称已存在专用producer。通用kernel保存读回的夹具证明接线；不真跑规划任务，不把非stage复盘塞进五阶段facts.jsonl或stage-reflection强闭环。
- **test tier / test method**：feature / backend-testing（本地内容/接口/持久化切片）；独立预判总路线fullstack；本卡命名目标预算60秒
- **scenarios / commands / expected exit / oracle**：非空结论引用实际步骤，task/workflow绑定一致，publish→read→hash一致；空内容、错task、写入失败、读回失败均 unavailable；没有正式stage身份；源/确认/review/复盘/交付分报；不增加第三次spec-prd内容调用或第二次review。 命令=`node node_modules/vitest/vitest.mjs run tests/contract/build-prd-review-contract.test.mjs --testNamePattern=planning-hardening --poolOptions.forks.singleFork --no-fileParallelism`；退出=0；oracle=ORACLE-PORTABLE-REFLECTION 同时测试声明保存原话、材料绑定和读写失败；反例与上述oracle一致。
- **fixtures_services**：在已有TaskHandle/TaskKernel测试fixture的隔离task中执行SKILL中的实际保存/读回片段；成功、空内容、错误绑定、写/读失败输入；无真实规划会话；service=N/A — 无线上服务
- **coverage limits**：reflection_facts 原先只是 optional review slot，不宣称已存在专用producer。通用kernel保存读回的夹具证明接线；不真跑规划任务，不把非stage复盘塞进五阶段facts.jsonl或stage-reflection强闭环。 不真跑新规划任务，不声称少问/变短/token收益。
- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：本卡按 owner 裁定转为基线记录，GREEN 未作为独立步骤执行。卡片要求的生产改动已在 worktree：`workflows/build-prd/SKILL.md` 步骤 6 `report-facts-and-handoff` 的 reflection_facts 与内容寻址保存/读回（worktree 4 处，main 0 处）；`workflows/build-prd/steps.json` 未出现 `reflection_facts` 字面量（worktree 与 main 均为 0 处），该声明落在 SKILL 文本与测试接线中。
- **executed_commands**：`node node_modules/vitest/vitest.mjs run tests/contract/build-prd-review-contract.test.mjs --testNamePattern=planning-hardening --poolOptions.forks.singleFork --no-fileParallelism`；实测 exit 0，`Test Files 1 passed (1)`、`Tests 2 passed | 8 skipped (10)`，与本卡设计的 `expected_exit=0` 一致，可作为基线满足事实，但不构成 GREEN 步骤已按序执行的证据。
- **evidence_refs**：`quality/evidence/build-code/P1/phase-card.md`（sha256 `8c790cf8dfe363f66383fa5dab6a0907d4e0053cec610cbc211af0579a86ea18`）
- **covered_ac**：`AC-REFLECT-001` `AC-META-001` 在基线中被命名目标选中并通过；canonical AC 事实未记录本卡认证结果，故不宣称已认证通过。
- **review_fact**：N/A — build-code review not executed
- **completed_at**：2026-09-11T23:59:00+08:00
- **执行事实**：**2026-09-12 基线核对**：reflection_facts 与通用保存/读回接线已在 worktree 存在，main 无对应改动，故无独立 GREEN 步骤可执行。owner（用户）明确裁定"改为基线记录"。快照身份不可解析（`d2ac0f2d…`/`0e7bf9d0…` 等均非有效 git 对象），canonical `facts.jsonl` 为 0 行，故记为基线而非认证通过。

## Phase P3 — 规划任务四动作与延后人工归档

### Goal

声明为规划任务的默认收尾执行四动作、不归档、不写completed；主仓同相对路径保留后正常cleanup。

### Files

- **NEW**：N/A — 复用现有文件
- **MODIFY**：`core/task-close.mjs`、`tools/cli/task-close.mjs`、`tests/integration/build-prd-delivery.test.mjs`、`tests/close/close-contract.test.mjs`
- **DO NOT TOUCH**：`runtime/schemas/task-fact.v1.json`、`runtime/task/task-store.mjs`；不改stage枚举或持久字段。

### Verify

ORACLE-UNARCHIVED-CLOSE — 本phase使用下列同名任务oracle；命令与事实路径如下。

T009→T010：`node node_modules/vitest/vitest.mjs run tests/integration/build-prd-delivery.test.mjs tests/close/close-contract.test.mjs --testNamePattern=planning-hardening --poolOptions.forks.singleFork --no-fileParallelism`；RED expected_exit=1（目标断言），GREEN expected_exit=0；ORACLE-UNARCHIVED-CLOSE；`quality/evidence/build-code/T009-T010/pair.json`。

### Knowledge

D031允许窄裁剪archive；D032允许主仓同相对路径保留后正常cleanup。plan.steps与逐动作记录供恢复，不新增收口完成对象。

### STOP

无法区分新规划收尾与显式legacy planning、必须改archive执行器、缺独立授权、主仓读不回材料或需要新增模式/字段时返回plan/source owner；不扩大操作范围。

### Done

T009、T010 的执行区具备真实变更、命令退出码、逐AC事实和证据引用；失败、跳过、unavailable保留。没有真实执行前全部pending；不把计划中的预期结果当成实测。

### Risks and rollback

RISK-01与D032：遗漏固定五步检查、提前cleanup、重复动作。保持原有默认五步逻辑可恢复；对已发生物理动作只按逐项事实补做，禁止逆改历史或删除材料。

### Tasks

- T009：RED 四动作、不归档与人工声明
- T010：GREEN 四动作、不归档与人工声明

#### T009 — RED：四动作、不归档与人工声明

- **ID**：T009
- **Phase**：Phase P3 — 规划任务四动作与延后人工归档
- **goal**：获得来自目标断言而非setup的真实失败；四动作、不归档与人工声明
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"plan","ref":"specs/workflowhub-build-prd-workflow-hardening-20260911/plan.md","hash":"8f8931d2380b74d66122342fd82fa0d4e6e515484a7f34f76ce654eabb69ff29","id":"PLAN"},{"artifact_kind":"spec","ref":"specs/workflowhub-build-prd-workflow-hardening-20260911/spec.md","hash":"88174d3fa19c254f1c877194a746ce65a9889c5b2c5a6ef150ad4570bc64905d","id":"SPEC"}]`
- **source_refs / decision_refs**：D-011 D-012 D-013 D-016 D-027 D-031 D-032 D-033；上游来源别名 AC-08 AC-09 AC-10 AC-12 AC-17
- **输入**：`spec.md#5-功能需求`、`plan.md#phase-p3`；当前源字节与明确的场景/文件边界
- **依赖**：T008
- **并行**：否 — 按plan既定生产者顺序执行，未声明并行写
- **FR**：FR-CLOSE-001 FR-CLOSE-002 FR-CLOSE-003 FR-CLOSE-004 FR-CHILD-003
- **AC**：AC-CLOSE-001 AC-CLOSE-002 AC-CLOSE-003 AC-CHILD-002 AC-META-001
- **动作**：只在本卡两个测试文件增加planning-hardening且含AC ID的目标，先证明真实入口存在及测试匹配；未实现的新分支以目标断言失败为RED，不接受setup/参数语法失败冒充。覆盖下述close oracle全部正反例；测试执行SKILL当前声明调用者而非发明自然语言分类器。现有已通过行为保留基线，不人为破坏造RED。初次规划四动作与普通/legacy五动作对照；逐一缺四动作授权拒绝；merge/push/主仓读回失败不cleanup，材料保全后正常cleanup。删除旧WT后从当前main经显式旧四步plan和当前声明准备后续archive/push两步；未完成/撤回/只有放弃项/无归档令时主会话不发起；声明ref冒充操作确认、错task/ref/hash/材料漂移拒绝。后续archive分别缺archive或commit授权时零移动，缺push授权时零推送；move后commit失败只恢复完整等字节暂存重命名，其余改动/冲突拒绝；commit后push失败只补推送同一归档commit，物理成功而结果写失败先probe不重做；主仓/远端漂移不扩大推送范围；close/execute/complete/status均不写completed.json，不重建WT，不重复merge/cleanup。 按plan“人工声明的caller合同”让当前清单/声明原话与ref/hash进入现有plan展示；材料仍用delivery.planning.materials/attachments，新两步plan只在现有materials映射追加唯一[declarationRef]:rawSHA条目，由preparePostCleanupArchivePlan写入、validateDeliveryPlan/readPlanningDeclaration验task-store字节与当前材料并由既有closePlanHash绑定；无有效完成声明/撤回/无归档令不发起prepare，收到展示后的真实操作确认才走现有授权执行。测试从真实第6步指令核对该前置合同，并在真实临时Git中走prepare→confirm→authorize→execute验证缺失/拒绝/陈旧确认及缺授权均无移动提交；不把测试布尔值或关键词判断当LLM理解原话的证明。 现有 `validateDeliveryPlan` 非legacy时拒绝delivery.planning的分支（当前约1743行）须按已认证规划类型及严格4/2步骤集窄放行；同一判定用于 `confirmClosePlan/publishPlanningHumanConfirmation/publishPlanningIrreversibleAuthorization` 的既有非stage分流，不能只修改materials映射或强写legacy close_mode。
- **精确文件**：`tests/integration/build-prd-delivery.test.mjs`、`tests/close/close-contract.test.mjs`
- **boundary**：files: `tests/integration/build-prd-delivery.test.mjs`、`tests/close/close-contract.test.mjs`; symbols/regions: 现有close计划选择、授权、executor步骤校验、物理probe、恢复和完成写点；archive/push仅增加D033限定分支，普通/legacy原行为保留；不扩大文件集合
- **输出**：RED目标证据，保留原stdout/stderr、命令fingerprint、snapshot/material与对应AC事实；记录断言失败位置，不能拿语法/依赖错误作RED
- **Knowledge**：所有Git/文件动作只在测试临时仓和本地裸remote夹具运行，绝不触碰本任务真实分支/remote/母材料。D032/D033是产品设计授权，不是本次真实close授权；只允许归档执行器D033受限分支，普通/legacy原行为必须保留。运行时只校验声明引用与版本，不判断自然语言；当前主会话必须使用真实有效答复。
- **verification_role**：RED
- **paired_task**：T010
- **gate_cmd**：`node node_modules/vitest/vitest.mjs run tests/integration/build-prd-delivery.test.mjs tests/close/close-contract.test.mjs --testNamePattern=planning-hardening --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：1
- **oracle**：`ORACLE-UNARCHIVED-CLOSE {"pass":"初次规划四动作保全主仓和远端同相对路径材料后正常cleanup，不归档不写completed.json；普通任务及显式legacy planning保持原行为。D033后续从main当前材料经本次有效声明、实际归档操作确认、archive与commit分别授权及独立push授权，完成严格archive-spec/push-target-branch两步且完整树不变；无需旧WT，不重新merge/cleanup。声明原话可查，不等于操作批准；失败保留事实并仅补未完成动作。 当前清单/有效声明原话及ref/hash在归档plan展示中出现并由现有plan-hash绑定；必须取得本次操作确认及archive/commit各自授权，push独立。","reject":{"input":"初次规划四动作与普通/legacy五动作对照；逐一缺四动作授权拒绝；merge/push/主仓读回失败不cleanup，材料保全后正常cleanup。删除旧WT后从当前main经显式旧四步plan和当前声明准备后续archive/push两步；未完成/撤回/只有放弃项/无归档令时主会话不发起；声明ref冒充操作确认、错task/ref/hash/材料漂移拒绝。后续archive分别缺archive或commit授权时零移动，缺push授权时零推送；move后commit失败只恢复完整等字节暂存重命名，其余改动/冲突拒绝；commit后push失败只补推送同一归档commit，物理成功而结果写失败先probe不重做；主仓/远端漂移不扩大推送范围；close/execute/complete/status均不写completed.json，不重建WT，不重复merge/cleanup。 缺声明/损坏ref/陈旧材料；声明有效但无本次操作确认、确认拒绝、旧plan确认或缺archive/commit任一授权；撤回/未完成的caller场景不提供操作确认。","expected_rejection":"无有效声明/归档令时调用者不触发；错task/声明hash/plan确认/版本/主仓路径或无有效初次cleanup事实时明确拒绝；archive或commit任一未授权不移动，push未授权不推送；漂移/混入变更/部分移动/冲突不覆盖不吞错；不重复已完成动作，不写completed.json，不把普通或legacy错误选择为新规划分支。 真实prepare或execute拒绝，Git树/提交保持不变；不得把声明ref视作操作确认。人工识别自然语言未实测，不能用注入布尔值宣称已验证。","observation":"真实隔离Git repo和bare remote读取声明原文、plan、operation授权/consumed及逐step记录，核对调用账目、归档commit和源/目标/远端完整树及文件字节；断言WT已删除后新prepare/confirm/execute链仍可完成。主动注入各失败并检查重试物理次数不增加、主仓未夹带提交、所有完成写点缺席。验证真实SKILL调用者指令合同及机械拒绝链，声明语义理解未实测，不假定runtime能理解自然语言或发现隐瞒的撤回。 提取真实SKILL第6步人类前置指令核对展示与顺序，真实临时Git/Kernel逐入口验证plan绑定及拒绝链，分别报告机械断言结果与人工语义未实测。"}}`
- **semantic_review_status**：completed
- **semantic_review_ref**：`quality/reviews/results/build-plan-simple-e5eaaa6a-8530-5ced-ab77-658e1e5dc20d.json`
- **semantic_review_reason**：D033当前独立三provider审查已返回；6条原始发现按plan当前处置表修订，本字段表示已审查及处置，不表示产品行为通过或最终人类确认。
- **evidence_path**：`quality/evidence/build-code/T009-T010/pair.json`
- **STOP**：无有效声明/操作确认/逐动作授权、主仓材料未保全或冻结后漂移则不执行对应物理动作；零测试匹配、setup失败、未知接口签名、需弱化负例/新增schema或mode/store/越界文件时回对应owner。D033范围已确定，不重复请求同一决定；产品设计仍不得由build-code擅改。
- **recovery**：本卡执行者保留失败原件，修复输入/本次改动后只重跑受影响命名目标；不reset用户改动、不删除旧事实；临时repo故障只清本测试创建的目录，真实已完成动作不得重做
- **task risk**：所有Git/文件动作只在测试临时仓和本地裸remote夹具运行，绝不触碰本任务真实分支/remote/母材料。D032/D033是产品设计授权，不是本次真实close授权；只允许归档执行器D033受限分支，普通/legacy原行为必须保留。运行时只校验声明引用与版本，不判断自然语言；当前主会话必须使用真实有效答复。
- **test tier / test method**：fullstack / fullstack-slice-testing（non_ui真实本地Git/授权切片）；独立预判总路线fullstack；本卡命名目标预算180秒
- **scenarios / commands / expected exit / oracle**：初次规划四动作与普通/legacy五动作对照；逐一缺四动作授权拒绝；merge/push/主仓读回失败不cleanup，材料保全后正常cleanup。删除旧WT后从当前main经显式旧四步plan和当前声明准备后续archive/push两步；未完成/撤回/只有放弃项/无归档令时主会话不发起；声明ref冒充操作确认、错task/ref/hash/材料漂移拒绝。后续archive分别缺archive或commit授权时零移动，缺push授权时零推送；move后commit失败只恢复完整等字节暂存重命名，其余改动/冲突拒绝；commit后push失败只补推送同一归档commit，物理成功而结果写失败先probe不重做；主仓/远端漂移不扩大推送范围；close/execute/complete/status均不写completed.json，不重建WT，不重复merge/cleanup。 命令同gate_cmd；退出同expected_exit；oracle=ORACLE-UNARCHIVED-CLOSE。
- **fixtures_services**：测试创建的隔离Git repo、本地bare remote、真实文件/授权record；无网络远端。测试自身清理mkdtemp目录，禁止使用用户workspace/root为删除目标；service=N/A — 无线上服务
- **coverage limits**：所有Git/文件动作只在测试临时仓和本地裸remote夹具运行，绝不触碰本任务真实分支/remote/母材料。D032/D033是产品设计授权，不是本次真实close授权；只允许归档执行器D033受限分支，普通/legacy原行为必须保留。运行时只校验声明引用与版本，不判断自然语言；当前主会话必须使用真实有效答复。 不真跑新规划任务，不声称少问/变短/token收益。
- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：本卡按 owner 裁定转为基线记录，RED 未独立执行。卡片要求的命名目标已落盘：`tests/integration/build-prd-delivery.test.mjs` 与 `tests/close/close-contract.test.mjs` 新增 `planning-hardening unarchived planning close` 组（各 1 处 `planning-hardening`，main 均为 0），覆盖四动作不归档、legacy 五动作、两动作归档与逐动作授权拒绝。
- **executed_commands**：`node node_modules/vitest/vitest.mjs run tests/integration/build-prd-delivery.test.mjs tests/close/close-contract.test.mjs --testNamePattern=planning-hardening --poolOptions.forks.singleFork --no-fileParallelism`；实测 exit 0，`Test Files 2 passed (2)`、`Tests 14 passed | 11 skipped (25)`，其中 `close-contract.test.mjs` 11 passed/5 skipped、`build-prd-delivery.test.mjs` 3 passed/6 skipped。与本卡设计的 `expected_exit=1`（RED）不符，故不构成 RED 证据。
- **evidence_refs**：`quality/evidence/build-code/P1/phase-card.md`（sha256 `8c790cf8dfe363f66383fa5dab6a0907d4e0053cec610cbc211af0579a86ea18`）
- **covered_ac**：`AC-CLOSE-001` `AC-CLOSE-002` `AC-CLOSE-003` `AC-CHILD-002` `AC-META-001` 在基线中被命名目标选中并通过；canonical AC 事实未记录本卡认证结果，故不宣称已认证通过。
- **review_fact**：N/A — build-code review not executed
- **completed_at**：2026-09-11T23:59:00+08:00
- **执行事实**：**2026-09-12 基线核对**：实测 gate exit 0（本组用例真实执行 Git/临时仓夹具，单组约 63s，属测试自身行为）；命名目标与实现同为 dirty worktree 新增，从未经过本卡设计的 RED→GREEN 序列。owner（用户）明确裁定"改为基线记录"。**本记录不含产品 RED 证据**；快照身份不可解析（`d2ac0f2d…`/`0e7bf9d0…` 等均非有效 git 对象），canonical `facts.jsonl` 为 0 行，故记为基线而非认证通过。

#### T010 — GREEN：四动作、不归档与人工声明

- **ID**：T010
- **Phase**：Phase P3 — 规划任务四动作与延后人工归档
- **goal**：满足配对目标断言并保留全部负例；四动作、不归档与人工声明
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"plan","ref":"specs/workflowhub-build-prd-workflow-hardening-20260911/plan.md","hash":"8f8931d2380b74d66122342fd82fa0d4e6e515484a7f34f76ce654eabb69ff29","id":"PLAN"},{"artifact_kind":"spec","ref":"specs/workflowhub-build-prd-workflow-hardening-20260911/spec.md","hash":"88174d3fa19c254f1c877194a746ce65a9889c5b2c5a6ef150ad4570bc64905d","id":"SPEC"}]`
- **source_refs / decision_refs**：D-011 D-012 D-013 D-016 D-027 D-031 D-032 D-033；上游来源别名 AC-08 AC-09 AC-10 AC-12 AC-17
- **输入**：`spec.md#5-功能需求`、`plan.md#phase-p3`；T009真实失败及原始输出
- **依赖**：T009
- **并行**：否 — 依赖配对RED且可能共享文件
- **FR**：FR-CLOSE-001 FR-CLOSE-002 FR-CLOSE-003 FR-CLOSE-004 FR-CHILD-003
- **AC**：AC-CLOSE-001 AC-CLOSE-002 AC-CLOSE-003 AC-CHILD-002 AC-META-001
- **动作**：按plan“清理后的后续归档”实现已有close的--archive声明ref窄参数；prepare/confirm分支允许无已删WT但保留写边界认证及主仓归属验证。初次规划严格四步、普通和legacy严格五步、后续archive/push严格两步；初次规划也在deriveCurrentDeliveryInput的普通verify-code要求前分流，复用planningMaterialContext及非stage确认/授权但不改成legacy mode；按冻结task_commit中的声明及严格steps验类型，归档后不依赖已移走源。closeDelivery/prepareDeliveryClosePlan增加archiveDeclarationRef/priorPlanHash；私有preparePostCleanupArchivePlan和readPlanningDeclaration读取当前材料与显式原四步事实，沿既有plan writer保存。requiredCloseAuthorizations使archive step分别消费archive/commit，push独立消费push；executeClosePlan增加archiveDeclarationRef并检查声明与另行操作确认，不直调executor。归档/push仅在两步分支补main基线和精确移动/提交/推送重试，原分支不变；validateDeliveryPlan、registry、physicalDeliveryMissing、inspect、execute、complete与close返回统一按steps读回且不写completed.json；CLI finish指向真实plan/step结果。实现全部下述负例，不新增schema/store/mode或历史替换链。 按plan“人工声明的caller合同”让当前清单/声明原话与ref/hash进入现有plan展示；材料仍用delivery.planning.materials/attachments，新两步plan只在现有materials映射追加唯一[declarationRef]:rawSHA条目，由preparePostCleanupArchivePlan写入、validateDeliveryPlan/readPlanningDeclaration验task-store字节与当前材料并由既有closePlanHash绑定；无有效完成声明/撤回/无归档令不发起prepare，收到展示后的真实操作确认才走现有授权执行。测试从真实第6步指令核对该前置合同，并在真实临时Git中走prepare→confirm→authorize→execute验证缺失/拒绝/陈旧确认及缺授权均无移动提交；不把测试布尔值或关键词判断当LLM理解原话的证明。 现有 `validateDeliveryPlan` 非legacy时拒绝delivery.planning的分支（当前约1743行）须按已认证规划类型及严格4/2步骤集窄放行；同一判定用于 `confirmClosePlan/publishPlanningHumanConfirmation/publishPlanningIrreversibleAuthorization` 的既有非stage分流，不能只修改materials映射或强写legacy close_mode。
- **精确文件**：`core/task-close.mjs`、`tools/cli/task-close.mjs`、`tests/integration/build-prd-delivery.test.mjs`、`tests/close/close-contract.test.mjs`
- **boundary**：files: `core/task-close.mjs`、`tools/cli/task-close.mjs`、`tests/integration/build-prd-delivery.test.mjs`、`tests/close/close-contract.test.mjs`; symbols/regions: 现有close计划选择、授权、executor步骤校验、物理probe、恢复和完成写点；archive/push仅增加D033限定分支，普通/legacy原行为保留；不扩大文件集合
- **输出**：GREEN目标证据，保留原stdout/stderr、命令fingerprint、snapshot/material与对应AC事实；只有该scope可判真的部分才写通过
- **Knowledge**：所有Git/文件动作只在测试临时仓和本地裸remote夹具运行，绝不触碰本任务真实分支/remote/母材料。D032/D033是产品设计授权，不是本次真实close授权；只允许归档执行器D033受限分支，普通/legacy原行为必须保留。运行时只校验声明引用与版本，不判断自然语言；当前主会话必须使用真实有效答复。
- **verification_role**：GREEN
- **paired_task**：T009
- **gate_cmd**：`node node_modules/vitest/vitest.mjs run tests/integration/build-prd-delivery.test.mjs tests/close/close-contract.test.mjs --testNamePattern=planning-hardening --poolOptions.forks.singleFork --no-fileParallelism`
- **expected_exit**：0
- **oracle**：`ORACLE-UNARCHIVED-CLOSE {"pass":"初次规划四动作保全主仓和远端同相对路径材料后正常cleanup，不归档不写completed.json；普通任务及显式legacy planning保持原行为。D033后续从main当前材料经本次有效声明、实际归档操作确认、archive与commit分别授权及独立push授权，完成严格archive-spec/push-target-branch两步且完整树不变；无需旧WT，不重新merge/cleanup。声明原话可查，不等于操作批准；失败保留事实并仅补未完成动作。 当前清单/有效声明原话及ref/hash在归档plan展示中出现并由现有plan-hash绑定；必须取得本次操作确认及archive/commit各自授权，push独立。","reject":{"input":"初次规划四动作与普通/legacy五动作对照；逐一缺四动作授权拒绝；merge/push/主仓读回失败不cleanup，材料保全后正常cleanup。删除旧WT后从当前main经显式旧四步plan和当前声明准备后续archive/push两步；未完成/撤回/只有放弃项/无归档令时主会话不发起；声明ref冒充操作确认、错task/ref/hash/材料漂移拒绝。后续archive分别缺archive或commit授权时零移动，缺push授权时零推送；move后commit失败只恢复完整等字节暂存重命名，其余改动/冲突拒绝；commit后push失败只补推送同一归档commit，物理成功而结果写失败先probe不重做；主仓/远端漂移不扩大推送范围；close/execute/complete/status均不写completed.json，不重建WT，不重复merge/cleanup。 缺声明/损坏ref/陈旧材料；声明有效但无本次操作确认、确认拒绝、旧plan确认或缺archive/commit任一授权；撤回/未完成的caller场景不提供操作确认。","expected_rejection":"无有效声明/归档令时调用者不触发；错task/声明hash/plan确认/版本/主仓路径或无有效初次cleanup事实时明确拒绝；archive或commit任一未授权不移动，push未授权不推送；漂移/混入变更/部分移动/冲突不覆盖不吞错；不重复已完成动作，不写completed.json，不把普通或legacy错误选择为新规划分支。 真实prepare或execute拒绝，Git树/提交保持不变；不得把声明ref视作操作确认。人工识别自然语言未实测，不能用注入布尔值宣称已验证。","observation":"真实隔离Git repo和bare remote读取声明原文、plan、operation授权/consumed及逐step记录，核对调用账目、归档commit和源/目标/远端完整树及文件字节；断言WT已删除后新prepare/confirm/execute链仍可完成。主动注入各失败并检查重试物理次数不增加、主仓未夹带提交、所有完成写点缺席。验证真实SKILL调用者指令合同及机械拒绝链，声明语义理解未实测，不假定runtime能理解自然语言或发现隐瞒的撤回。 提取真实SKILL第6步人类前置指令核对展示与顺序，真实临时Git/Kernel逐入口验证plan绑定及拒绝链，分别报告机械断言结果与人工语义未实测。"}}`
- **semantic_review_status**：completed
- **semantic_review_ref**：`quality/reviews/results/build-plan-simple-e5eaaa6a-8530-5ced-ab77-658e1e5dc20d.json`
- **semantic_review_reason**：D033当前独立三provider审查已返回；6条原始发现按plan当前处置表修订，本字段表示已审查及处置，不表示产品行为通过或最终人类确认。
- **evidence_path**：`quality/evidence/build-code/T009-T010/pair.json`
- **STOP**：无有效声明/操作确认/逐动作授权、主仓材料未保全或冻结后漂移则不执行对应物理动作；零测试匹配、setup失败、未知接口签名、需弱化负例/新增schema或mode/store/越界文件时回对应owner。D033范围已确定，不重复请求同一决定；产品设计仍不得由build-code擅改。
- **recovery**：本卡执行者保留失败原件，修复输入/本次改动后只重跑受影响命名目标；不reset用户改动、不删除旧事实；临时repo故障只清本测试创建的目录，真实已完成动作不得重做
- **task risk**：所有Git/文件动作只在测试临时仓和本地裸remote夹具运行，绝不触碰本任务真实分支/remote/母材料。D032/D033是产品设计授权，不是本次真实close授权；只允许归档执行器D033受限分支，普通/legacy原行为必须保留。运行时只校验声明引用与版本，不判断自然语言；当前主会话必须使用真实有效答复。
- **test tier / test method**：fullstack / fullstack-slice-testing（non_ui真实本地Git/授权切片）；独立预判总路线fullstack；本卡命名目标预算180秒
- **scenarios / commands / expected exit / oracle**：初次规划四动作与普通/legacy五动作对照；逐一缺四动作授权拒绝；merge/push/主仓读回失败不cleanup，材料保全后正常cleanup。删除旧WT后从当前main经显式旧四步plan和当前声明准备后续archive/push两步；未完成/撤回/只有放弃项/无归档令时主会话不发起；声明ref冒充操作确认、错task/ref/hash/材料漂移拒绝。后续archive分别缺archive或commit授权时零移动，缺push授权时零推送；move后commit失败只恢复完整等字节暂存重命名，其余改动/冲突拒绝；commit后push失败只补推送同一归档commit，物理成功而结果写失败先probe不重做；主仓/远端漂移不扩大推送范围；close/execute/complete/status均不写completed.json，不重建WT，不重复merge/cleanup。 命令同gate_cmd；退出同expected_exit；oracle=ORACLE-UNARCHIVED-CLOSE。
- **fixtures_services**：测试创建的隔离Git repo、本地bare remote、真实文件/授权record；无网络远端。测试自身清理mkdtemp目录，禁止使用用户workspace/root为删除目标；service=N/A — 无线上服务
- **coverage limits**：所有Git/文件动作只在测试临时仓和本地裸remote夹具运行，绝不触碰本任务真实分支/remote/母材料。D032/D033是产品设计授权，不是本次真实close授权；只允许归档执行器D033受限分支，普通/legacy原行为必须保留。运行时只校验声明引用与版本，不判断自然语言；当前主会话必须使用真实有效答复。 不真跑新规划任务，不声称少问/变短/token收益。
- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：本卡按 owner 裁定转为基线记录，GREEN 未作为独立步骤执行。卡片要求的生产改动已在 worktree：`core/task-close.mjs` 出现 `archiveDeclarationRef`/`preparePostCleanupArchivePlan`/`priorPlanHash` 共 25 处（main 0 处），`tools/cli/task-close.mjs` 同步；四/五/两动作步骤集、归档声明引用与分离的 archive/commit/push 授权随之落地。
- **executed_commands**：`node node_modules/vitest/vitest.mjs run tests/integration/build-prd-delivery.test.mjs tests/close/close-contract.test.mjs --testNamePattern=planning-hardening --poolOptions.forks.singleFork --no-fileParallelism`；实测 exit 0，`Test Files 2 passed (2)`、`Tests 14 passed | 11 skipped (25)`，与本卡设计的 `expected_exit=0` 一致，可作为基线满足事实，但不构成 GREEN 步骤已按序执行的证据。
- **evidence_refs**：`quality/evidence/build-code/P1/phase-card.md`（sha256 `8c790cf8dfe363f66383fa5dab6a0907d4e0053cec610cbc211af0579a86ea18`）
- **covered_ac**：`AC-CLOSE-001` `AC-CLOSE-002` `AC-CLOSE-003` `AC-CHILD-002` `AC-META-001` 在基线中被命名目标选中并通过；canonical AC 事实未记录本卡认证结果，故不宣称已认证通过。
- **review_fact**：N/A — build-code review not executed
- **completed_at**：2026-09-11T23:59:00+08:00
- **执行事实**：**2026-09-12 基线核对**：四动作/不归档实现与测试同批落盘，main 无对应改动，故无独立 GREEN 步骤可执行。owner（用户）明确裁定"改为基线记录"。另注：本卡未在本次基线中复跑 P4 定向回归，P4 修复的独立事实见 T011/T012 记录。快照身份不可解析（`d2ac0f2d…`/`0e7bf9d0…` 等均非有效 git 对象），canonical `facts.jsonl` 为 0 行，故记为基线而非认证通过。

## Phase P4 — 单点登记同步与一次最终聚合

### Goal

重算受影响bundle与登记，提供现有acceptance command消费者可读的测试结果，不掩盖D029未决验收。

### Files

- **NEW**：`tests/fixtures/planning-workflow-hardening-acceptance.mjs`
- **MODIFY**：`skills/decision-log/skill-bundle.json`、`skills/spec-prd/skill-bundle.json`、`skills/catalog.yaml`、`repo-skills.manifest.json`、`docs/architecture/move-map.json`
- **DO NOT TOUCH**：`runtime/schemas/task-fact.v1.json`、`runtime/task/task-store.mjs`；不改stage枚举或持久字段。

### Verify

ORACLE-CONTRACT-HASH / ORACLE-FINAL — 本phase使用下列同名任务oracle；命令与事实路径如下。

T011 使用 `node --input-type=module -e 'import assert from "node:assert/strict"; import {readFileSync} from "node:fs"; import yaml from "js-yaml"; import {validateSkillBundle} from "./runtime/adapters/local-skill-resolver.mjs"; const c=yaml.load(readFileSync("skills/catalog.yaml","utf8")); for(const n of ["decision-log","spec-prd"]){const b=validateSkillBundle(process.cwd(),"skills/"+n+"/skill-bundle.json","skills/"+n+"/SKILL.md"); assert.equal(c.skills.find(s=>s.name===n).local_bundle_hash,b.bundleHash);}' && node tools/cli/repo-skills-manifest.mjs --check && node --check tests/fixtures/planning-workflow-hardening-acceptance.mjs`，expected_exit=0；T012 使用 `node tests/fixtures/planning-workflow-hardening-acceptance.mjs`，expected_exit=0，ORACLE-FINAL，证据 `quality/evidence/build-code/T012/final.json`。退出0只表示结果收集成功，不能把 unavailable AC 算通过。

### Knowledge

源文件稳定后才重算hash；逐AC原始证据与provider/review事实分离。

### STOP

测试未选中任何断言、final只按进程exit制造逐AC通过、模板token被删、需要新增生产框架或补D029 oracle时停止该卡并回计划。

### Done

T011、T012 的执行区具备真实变更、命令退出码、逐AC事实和证据引用；失败、跳过、unavailable保留。机械测试可通过与三个定性AC仍unavailable同时成立；不据此宣称整体验收或发布。

### Risks and rollback

FR-CONTRACT-001、RISK-05：hash与当前文件错配、把定性缺口漂绿。重算仅本次改动闭包；收集器失败保留原输出与部分报告，只清它创建的临时目录。

### Tasks

- T011：登记同步与有界结果适配
- T012：FINAL 一次当前快照聚合

#### T011 — 登记同步与有界结果适配

- **ID**：T011
- **Phase**：Phase P4 — 单点登记同步与一次最终聚合
- **goal**：稳定源字节后同步两套bundle、catalog/manifest与测试fixture登记，准备唯一最终结果适配
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"plan","ref":"specs/workflowhub-build-prd-workflow-hardening-20260911/plan.md","hash":"8f8931d2380b74d66122342fd82fa0d4e6e515484a7f34f76ce654eabb69ff29","id":"PLAN"},{"artifact_kind":"spec","ref":"specs/workflowhub-build-prd-workflow-hardening-20260911/spec.md","hash":"88174d3fa19c254f1c877194a746ce65a9889c5b2c5a6ef150ad4570bc64905d","id":"SPEC"}]`
- **source_refs / decision_refs**：D-016 D-017 D-019 D-024 D-025 D-029 D-032
- **输入**：T002/T004/T006/T008/T010当前源变更及原始测试事实；plan单一映射
- **依赖**：T010
- **并行**：否 — catalog与move-map单一写owner，必须在源稳定后执行
- **FR**：FR-CONTRACT-001
- **AC**：AC-CONTRACT-001 AC-META-001
- **动作**：先在现有move-map登记NEW test-only fixture的owner=T011、consumer=T012和既有acceptance_data command executor、替代关系=仅将现有Vitest结果转换为所需JSON、删除条件=有原生同形逐AC输出。随后实现该fixture，仅执行plan列明9个受影响文件一次（增加只读 tests/decision-log-content-contract.test.mjs）、无网络/用户Git写入，使用现有Vitest JSON reporter；根据带AC ID的真实命名assertion结果生成唯一entries，零匹配/重复/失败/中断保留。三个D029定性AC输出明确unavailable及原因，不将其proxy转成通过。重算decision-log/spec-prd逐文件sha256，再用validateSkillBundle的bundleHash更新两个catalog项；运行既有生成器 `node tools/cli/repo-skills-manifest.mjs`（不带--check为生成）同步repo-skills.manifest.json，再由后续gate的 `node tools/cli/repo-skills-manifest.mjs --check` 校验；metadata只证明生成物同步，不是行为验收。保留上游已有hash改动，不改无关包。 collector不带testNamePattern，实际9文件集合按plan固定。内置AC→test_file/full_name显式映射，AC-CLOSE-002强制并入T007/T008和T009/T010两组selectors，少任一组不得形成完整条目，每个selector恰好一次；同AC跨pair全部assertions合并唯一entry，ID为路径::完整测试名，不取first/any-pass。9文件全部既有测试（含无AC标签）也进入AC-CONTRACT-001，原基线失败/skip/setup错误照实保留。stdout同时含entries与collection原始stdout/stderr、child exit/signal/timeout；collector预算570000ms，外层600000ms。完整收集可exit0但断言失败仍failed；映射缺项/坏报告/自身异常必须非零。T011不运行collector，T012通过正式executor只跑一次。
- **精确文件**：`skills/decision-log/skill-bundle.json`、`skills/spec-prd/skill-bundle.json`、`skills/catalog.yaml`、`repo-skills.manifest.json`、`docs/architecture/move-map.json`、`tests/fixtures/planning-workflow-hardening-acceptance.mjs`
- **boundary**：files: `skills/decision-log/skill-bundle.json`、`skills/spec-prd/skill-bundle.json`、`skills/catalog.yaml`、`repo-skills.manifest.json`、`docs/architecture/move-map.json`、`tests/fixtures/planning-workflow-hardening-acceptance.mjs`; symbols/regions: 两个bundle闭包、对应catalog项、由catalog生成的manifest、NEW测试fixture职责项及有界reporter适配；无生产runtime改动
- **输出**：登记与hash一致；一份test-only collector可供T012执行，保留13个机械AC与3个定性不可用的区分
- **Knowledge**：validateSkillBundle(packageRoot,bundlePath,expectedSkillPath)返回bundleHash；manifest生成器不校验local_bundle_hash，必须同时做专门比较；不只检查JSON可解析
- **verification_role**：N/A — non-behavior change: 登记与test-only结果适配不改变产品运行行为
- **paired_task**：N/A — 非行为任务无RED/GREEN配对
- **gate_cmd**：`node --input-type=module -e 'import assert from "node:assert/strict"; import {readFileSync} from "node:fs"; import yaml from "js-yaml"; import {validateSkillBundle} from "./runtime/adapters/local-skill-resolver.mjs"; const c=yaml.load(readFileSync("skills/catalog.yaml","utf8")); for(const n of ["decision-log","spec-prd"]){const b=validateSkillBundle(process.cwd(),"skills/"+n+"/skill-bundle.json","skills/"+n+"/SKILL.md"); assert.equal(c.skills.find(s=>s.name===n).local_bundle_hash,b.bundleHash);}' && node tools/cli/repo-skills-manifest.mjs --check && node --check tests/fixtures/planning-workflow-hardening-acceptance.mjs`
- **expected_exit**：0
- **oracle**：`ORACLE-CONTRACT-HASH {"pass":"decision-log与spec-prd两套bundle的逐文件sha和catalog登记的bundleHash均与当前内容一致，repo-skills manifest匹配当前声明，新collector语法有效；该结果仅证明登记及适配器准备，不宣称逐AC行为通过。"}`
- **evidence_path**：`quality/evidence/build-code/T011/metadata.json`
- **STOP**：源字节仍变、16字段被删、需要补D029产品oracle、仅用进程exit构造全AC通过、引入第二套执行框架或越界文件时返回plan
- **recovery**：保留原字节和失败输出，修正本次hash登记或fixture，再做同范围检查；不改历史事实、不自动更新全部包
- **task risk**：metadata exit0不证明阶段、验收或release；校验脚本漏比bundleHash会假绿
- **test tier / test method**：simple / backend-testing 的静态检查；最终聚合由T012按fullstack-slice-testing执行
- **scenarios / commands / expected exit / oracle**：两包正确/内容改动hash过期/catalog误配/manifest漂移；命令同gate_cmd，预期0，ORACLE-CONTRACT-HASH；构造失败输入时仅测试临时副本
- **fixtures_services**：当前两个skill包与本地Vitest JSON；fixture临时report目录由自身清理；不启线上service
- **coverage limits**：只验证登记闭包与collector准备，不声称全部机械/定性AC已通过；OPEN06文档只读核对，ADR仍proposed
- **acceptance_role**：implementation
- **ui_scope**：non_ui

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **actual_changes**：已完成两个 skill bundle、catalog、repo-skills manifest、move-map 与 test-only collector 的登记/同步；本次 P4 修复另外更新了 `core/task-close.mjs` 与其针对性回归测试，但不改变 T011 的登记职责。
- **executed_commands**：`node --input-type=module -e 'import assert from "node:assert/strict"; import {readFileSync} from "node:fs"; import yaml from "js-yaml"; import {validateSkillBundle} from "./runtime/adapters/local-skill-resolver.mjs"; const c=yaml.load(readFileSync("skills/catalog.yaml","utf8")); for(const n of ["decision-log","spec-prd"]){const b=validateSkillBundle(process.cwd(),"skills/"+n+"/skill-bundle.json","skills/"+n+"/SKILL.md"); assert.equal(c.skills.find(s=>s.name===n).local_bundle_hash,b.bundleHash);}' && node tools/cli/repo-skills-manifest.mjs --check && node --check tests/fixtures/planning-workflow-hardening-acceptance.mjs`；exit 0，输出 `repo skills manifest: ok`。
- **evidence_refs**：`quality/evidence/build-code/P4/phase-card.md`；下游一次性聚合及其原始输出见 `quality/evidence/stage-outcomes/build-code/217413d7eb906b9945c35049445c195ae6399ca9d5dde2ae4d4697375b765c75.json`、`quality/evidence/stage-quality/build-code/acceptance-stdout-b565b08b581fe667b06940d60056270feabf84331fb93bc5bf993eb6ecefadf2.bin`、`quality/evidence/stage-quality/build-code/acceptance-stderr-e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855.bin`。
- **covered_ac**：`AC-META-001` 的登记/hash/manifest检查通过；`AC-CONTRACT-001` 由 T012 真实聚合保留，但其一个 run-checks registration 断言失败，不能宣称合同 AC 全部通过。
- **review_fact**：已有集成审查 `quality/reviews/results/build-code-simple-060f26c9-0b05-5ffb-a792-d4d5c7ec4d53.json` 在修复前快照发现 `completeDeliveryClosePlan` 授权消费顺序的 major finding；当前代码已修复并由针对性测试覆盖，用户明确取消修复后的重审，因此当前集成质量事实仍 `unavailable/incomplete`，不把修复写成审查通过。
- **completed_at**：2026-09-11T23:23:32+08:00
- **执行事实**：T011 登记/hash gate 本次真实 exit 0；未运行 T012 collector。T012 的真实聚合随后只执行一次并保留失败/unavailable事实。

#### T012 — FINAL：一次当前快照聚合

- **ID**：T012
- **Phase**：Phase P4 — 单点登记同步与一次最终聚合
- **goal**：执行一次当前快照最终聚合，区分实际测试结果与D029未完成验收，交接所有风险
- **design_state**：ready
- **versioned_refs**：`[{"artifact_kind":"plan","ref":"specs/workflowhub-build-prd-workflow-hardening-20260911/plan.md","hash":"8f8931d2380b74d66122342fd82fa0d4e6e515484a7f34f76ce654eabb69ff29","id":"PLAN"},{"artifact_kind":"spec","ref":"specs/workflowhub-build-prd-workflow-hardening-20260911/spec.md","hash":"88174d3fa19c254f1c877194a746ce65a9889c5b2c5a6ef150ad4570bc64905d","id":"SPEC"}]`
- **source_refs / decision_refs**：D-001 D-002 D-003 D-004 D-005 D-006 D-007 D-008 D-009 D-010 D-011 D-012 D-013 D-014 D-015 D-016 D-017 D-018 D-019 D-020 D-021 D-022 D-023 D-024 D-025 D-026 D-027 D-028 D-029 D-030 D-031 D-032 D-033
- **输入**：T001…T011真实执行区、当前source/plan/tasks/hash；既有AC与未决/延期交接表
- **依赖**：T011
- **并行**：否 — 唯一最终聚合读取全部前序结果
- **FR**：FR-TYPE-001 FR-TYPE-002 FR-ASK-001 FR-ASK-002 FR-ASK-003 FR-DOC-001 FR-CHECK-001 FR-CHAIN-001 FR-PRD-001 FR-PRD-002 FR-PRD-003 FR-CHILD-001 FR-CHILD-002 FR-CHILD-003 FR-REFLECT-001 FR-CLOSE-001 FR-CLOSE-002 FR-CLOSE-003 FR-CLOSE-004 FR-CONTRACT-001
- **AC**：AC-TYPE-001 AC-ASK-001 AC-ASK-002 AC-ASK-003 AC-PRD-001 AC-CHECK-001 AC-CHAIN-001 AC-PRD-002 AC-CHILD-001 AC-CHILD-002 AC-CONTRACT-001 AC-REFLECT-001 AC-META-001 AC-CLOSE-001 AC-CLOSE-002 AC-CLOSE-003
- **动作**：在真实当前build-code outcome生成后，由既有公共 run --action=execute --stage=build-code --input=<实际input>触发本卡，receipts.stage_outcomes传该真实ref字符串并保留其余已有receipts；不手动先跑collector。acceptance_data从本卡读取，经projectAcceptanceExecutionData→acceptanceExecutionFacts→executePrivateAcceptance执行。由既有acceptance_data command执行器运行本卡声明的collector一次；先保存9文件原始JSON与stderr、选中/跳过/失败断言和timeout，再产生每AC恰一次的entries及aggregate ref/hash。针对13个机械AC只用绑定其ID的真实测试事实，AC-CLOSE-002唯一entry必须包含T007/T008声明链和T009/T010归档链的全部selectors；AC-ASK-002、AC-ASK-003、AC-CHILD-001的完整定性证据仍unavailable，不把结构proxy或review变成通过。列出所有OPEN/DEFER及处理者；真实独立review、当前stage outcome、确认与reflection缺失分别披露，不擅自补过去证明。 consumer自动持久化acceptance stdout/stderr原件、逐AC叶与quality/facts；叶绑定真实outcome/actor，并从stdout重新推导断言认证。返回后读真实共同stdout ref/hash，task.readRecordBytes验hash，再用kernel.publishCanonicalRecord保存quality/evidence/build-code/T012/final.json交付副本；已有异字节副本不得覆盖，正式引用仍为真实leaf/fact/outcome。
- **精确文件**：`tests/fixtures/planning-workflow-hardening-acceptance.mjs`
- **boundary**：files: `tests/fixtures/planning-workflow-hardening-acceptance.mjs`; symbols/regions: 只执行collector，必要修正自身结果映射需回T011；其余受影响源码/测试只读，禁止扩大测试集合
- **输出**：当前原始输出、逐AC entries、aggregate ref/hash、未完成/失败/跳过/unavailable清单与plain-language交接；collector退出0不等于完整验收完成
- **Knowledge**：D019不真跑新规划任务；D029不补验收标准。三个定性AC的availability结果不是新的产品oracle；完整验收可保持incomplete，不能宣称release或physical close。 现有comparator只按严格expected/actual判passed/failed；三个定性actual=`{status:"unavailable",reason:"D029定性证据未补齐"}`会产生failed质量事实，报告要区分证据不足与机械测试失败，不能假称runtime有第三种验收终态。
- **verification_role**：N/A — non-behavior aggregate verification: 只收集当前结果，不新增产品行为
- **paired_task**：N/A — 唯一FINAL聚合无RED/GREEN配对
- **gate_cmd**：`node tests/fixtures/planning-workflow-hardening-acceptance.mjs`
- **expected_exit**：0
- **oracle**：`ORACLE-FINAL {"pass":"指定9个测试文件的真实执行结果及原始输出被完整收集并可解析，每个AC恰有一项映射，不遗漏负例、失败、跳过、timeout或unknown；13个机械AC只按绑定其ID的真实断言判定，3个定性AC保持unavailable，收集成功不得被宣称为全AC通过。 所有关联pair的命名selectors各恰好匹配一次并全部保留，原有9文件contracts也进入AC-CONTRACT-001；真实官方executor已保存并认证stdout及逐AC叶，final.json只为验hash后的副本，不充当质量权威。"}`
- **evidence_path**：`quality/evidence/build-code/T012/final.json`
- **STOP**：命令/collector不存在、零断言、AC遗漏或重复、setup/timeout、原始输出缺失、scope扩大或有人要求把unavailable变passed时回对应卡；不全量重跑
- **recovery**：保留当前已完成片段与原失败；修复真实受影响项后只复跑该范围，最终聚合引用同一当前source的证据，不制造重试pass或新任务
- **task risk**：将Vitest人读输出、退出0、文件存在或review建议当成逐AC验收；已知D029缺口被漂绿
- **test tier / test method**：fullstack / fullstack-slice-testing；non_ui，在临时Git/真实kernel边界验证，浏览器不适用
- **scenarios / commands / expected exit / oracle**：全部SCN001…006对应夹具和负例、兼容旧planning/普通模式、部分失败恢复；SCN007无直接AC按D029披露；command=`node tests/fixtures/planning-workflow-hardening-acceptance.mjs`，expected_exit=0仅收集，ORACLE-FINAL
- **fixtures_services**：T011 collector；9个限定文件；临时隔离repo/bare remote/record fixture；stdout/stderr暂存只归collector，失败保留到现有evidence后清其私有临时目录；无线上服务
- **coverage limits**：不真跑规划任务或当前任务close；不证明少问/变短/token收益；不补OPEN03历史执行、不修OPEN04/05，不新增D029验收；既有其它目录测试不在本次覆盖
- **acceptance_role**：acceptance
- **ui_scope**：non_ui
- **acceptance_data**：`[{"source":"当前已认证worktree中的9个指定测试文件及其真实Vitest JSON输出","sample":"planning-hardening正反场景、既有邻接兼容测试；D029三个定性AC的不可用事实","scenario":"一次有界聚合并逐AC输出真实命名断言结果；缺证据/定性缺口不变passed；不运行新的规划任务","tier":"command","execution":{"command":"node","args":["tests/fixtures/planning-workflow-hardening-acceptance.mjs"],"timeout_ms":600000}}]`
- **e2e_scope**：not_required

##### 执行状态填写区（唯一完成权威）

- [x] **任务完成**
- **status**：`completed`
- **execution_status**：`completed_with_failures`
- **quality_status**：`incomplete`
- **actual_changes**：正式 build-code executor 已按 T012 声明执行一次 collector，持久化原始 stdout/stderr、逐 AC 结果和 failure/unavailable 事实；其后完成 P4 close-finalization 修复与针对性验证，未重跑 T012。
- **executed_commands**：官方 `run --action=execute --stage=build-code` 触发 `node tests/fixtures/planning-workflow-hardening-acceptance.mjs` 一次，绑定 attempt `build-code-official-run-20260911-04`、snapshot `d2ac0f2d4202029acdf3193c219936ced7d0b891`；collector 原始 child exit 1，26 suites：24 passed/2 failed；86 tests：85 passed/1 failed；timeout=false。修复后额外定向验证：`./node_modules/.bin/vitest run tests/close/cleanup-resume-finalize.test.mjs -t "does not consume close authorizations before a physical-state failure" --poolOptions.forks.singleFork --no-fileParallelism` exit 0（1/1），同文件完整运行 exit 0（4/4）；独立 close contract slice exit 0（30/30）。
- **evidence_refs**：`quality/evidence/stage-outcomes/build-code/217413d7eb906b9945c35049445c195ae6399ca9d5dde2ae4d4697375b765c75.json`、`quality/evidence/stage-quality/build-code/acceptance_execution-a240eb57443071fda4e20234eee9122bf9a8c7649bbe12f93aee3a7af8e601da.json`、`quality/evidence/stage-quality/build-code/acceptance-stdout-b565b08b581fe667b06940d60056270feabf84331fb93bc5bf993eb6ecefadf2.bin`、`quality/evidence/stage-quality/build-code/acceptance-stderr-e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855.bin`、`quality/evidence/build-code/P4/phase-card.md`、`quality/reviews/results/build-code-simple-060f26c9-0b05-5ffb-a792-d4d5c7ec4d53.json`。
- **covered_ac**：正式聚合保留 12 个机械 AC 通过、`AC-CONTRACT-001` 失败、`AC-ASK-002`/`AC-ASK-003`/`AC-CHILD-001` 实际 `unavailable`；其余结果以原始逐 AC 叶保留。P4 修复直接覆盖 `AC-CLOSE-003` 的重试/无重复消费风险，但新修复未进入官方 T012 快照，故当前 AC 状态不能升级为已认证通过。
- **review_fact**：修复前集成审查的 kimi major finding 已按 `fixed` 处置（生产修复 + 1/4 focused GREEN + 4/4 close file + 独立 30/30 close contract）；用户明确要求修复后不重审，重审事实为 `skipped/cancelled`，不存在当前快照的集成 review pass。
- **completed_at**：2026-09-11T23:23:32+08:00
- **执行事实**：T012 collector 只运行一次；aggregate wrapper `acceptance_execution-a240...json` 仍是 `missing`，原始 stdout/stderr 与逐 AC 结果保留。`stage-reflection` 已按公共 `run --action=reflect` 尝试一次，因修复后无可认证当前 Stage Agent outcome 记录为 `unavailable/executor_absent`，ref `quality/evidence/stage-reflection-availability/8c717ee52bdfda266d78a0558409a4a07f763aaf2a07f1bb78a518664231b320.json`。当前未授权 commit/push/merge/archive/cleanup，未宣称 release 或 physical close。

## 4. Final current-snapshot aggregate strategy

- **tier / method**：fullstack / fullstack-slice-testing，独立routing确认；non_ui无浏览器
- **scenarios**：20FR/16AC的当前命名测试与失败/恢复、旧planning/普通兼容、D029三项定性不可用；SCN007按来源保留无直接AC
- **command**: `node tests/fixtures/planning-workflow-hardening-acceptance.mjs`
- **expected exit**：0（收集成功，不代表全AC通过）
- **oracle**：ORACLE-FINAL — 与T012同一身份、同一9文件执行、逐AC原始证据及不可用区分
- **fixtures_services**：`tests/contract/decision-convergence-depth.test.mjs`、`tests/contract/stage-interaction-batching.test.mjs`、`tests/contract/decision-log-chain-warnings.test.mjs`、`tests/contract/stage-reflection-wiring.test.mjs`、`tests/contract/spec-prd-skill-contract.test.mjs`、`tests/contract/build-prd-review-contract.test.mjs`、`tests/integration/build-prd-delivery.test.mjs`、`tests/close/close-contract.test.mjs`、`tests/decision-log-content-contract.test.mjs`；隔离本地fixture，无线上service
- **evidence_path**：`quality/evidence/build-code/T012/final.json`
- **coverage limits**：不真跑新规划任务，不证明定性收益；不补D029、不修OPEN04/05；collector输出不可用或失败时保留incomplete
- **STOP**：命令损坏、零匹配、逐AC遗漏/重复、原始输出缺失、越界或新决定
- **execution_contract**：正式build-code execute从本卡acceptance_data触发一次不带名称过滤的9文件union，禁止先手动运行后由官方重复执行；raw stdout/stderr、逐AC叶由既有executor持久化认证，final.json只为验hash后的副本；当前快照一次总预算600秒；失败保留stdout/stderr及部分结果；不再无范围全量回归。只有新改动/新失败才复跑受影响项。真实review的canonical attempt/result与usage/timing、正式outcome、human-confirmation.v3、reflection semantic ref/raw sha256分别消费，不互相替代。

## 未决与延期交接（plan派生，只读保留）

| ID | Owner | Trigger | Handoff / consumer | Close / retain condition |
| --- | --- | --- | --- | --- |
| OPEN-01 | build-plan | 原五步与不归档冲突 | T009/T010 | D031/D032方向歧义已解决；实现仍需真实读回 |
| OPEN-02 | build-plan | checker暴露旧116条告警 | T003/T004及verify-code | 不补造链字段；永久N/A/替代校验需后续真实决定 |
| OPEN-03 | 用户 | 过去阶段来源无法认证 | T012/verify-code | 真实来源出现或用户接受未完成；不从历史猜执行 |
| OPEN-04 | 用户 | 下游材料改上游快照 | T012/verify-code披露 | 另定绑定语义；本任务不实现，不反复重绑 |
| OPEN-05 | 用户 | direction/open散文字碰撞 | T012/verify-code披露 | 另定结构化/命中区分；不改措辞绕检查 |
| OPEN-06 | build-spec | 术语/ADR长期落点检查 | T011只读 | 已resolved；CONTEXT与ADR0027，ADR仍proposed |
| DEFER-01 | 用户 | 要求取消人工归档确认 | T010/T012与归档行为 | 否则永久保留人工授权 |
| DEFER-02 | 用户 | 首个其它类型真实任务 | T002的类型边界 | 未决前不增加受控值或规则 |
| DEFER-03 | 用户 | 要求重做或旧材料进入实施 | T006/未来子任务 | 否则历史只读 |
| DEFER-04 | 用户 | 无法读回未归档状态成真实痛点 | T010逐动作事实 | 否则不建独立完成记录 |
| RISK-05 | verify-code | 尝试补产品oracle或全绿 | T012 | 保留源AC02/06/11/18及执行纪律维度的缺口，D029不补 |

## Dependency Graph

- **order**：既有build-plan当前材料最终确认（正式run已读回）→T001→T002→T003→T004→T005→T006→T007→T008→T009→T010→T011→T012；每个RED先于其GREEN，catalog与最终结果最后收敛。无并行写入声明，无环。

## Final Boundary Check

- Phase Files逐字复制plan；每卡写边界为所属Phase子集，运行测试不授予修改其读到的其他文件。
- 5组RED/GREEN同命令/同oracle/同pair证据路径；FINAL只运行一次指定集合。
- 只有build-code执行者可改status、actual_changes、executed_commands、evidence_refs、covered_ac、review_fact、completed_at；本阶段不预填成功。
- 产品方向与规格由对应owner负责；质量unknown/unavailable不阻止修复，也不能包装成完成或release。

## 当前独立审查处置

D033增量审查实际result为 `quality/reviews/results/build-plan-simple-e5eaaa6a-8530-5ced-ab77-658e1e5dc20d.json`；6条原始发现按plan当前处置表修订，其中两条是同一AC-CLOSE-002聚合遗漏。T001增加现有最终确认依赖，T007/T008明确唯一源块及真实reader/报告接线，T009/T010明确人工caller与机械拒绝链及未实测边界，T011/T012补全跨pair map和D033引用。原9条审查及F-61a3c088952f的D033方向来源保留；本字段不覆盖provider原件、不宣称产品验证。D034工具修复明确不属于本计划产品交付或T012 AC验收。**状态更正（2026-09-12）**：本字段原记"全部12卡执行status仍pending"；T011/T012 的执行区早已为 `completed`，T001–T010 于 2026-09-12 经 owner 裁定按基线记录写入 `completed`（不含产品 RED 证据，详见各卡执行事实与 `quality/evidence/build-code/baseline-record-20260912.md`）。卡级 `completed` 不等于 build-code stage 通过。

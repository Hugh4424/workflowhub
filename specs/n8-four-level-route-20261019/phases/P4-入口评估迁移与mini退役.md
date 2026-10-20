# Phase P4 — 入口评估迁移与 mini 退役

读者：P4 实施者、独立审查者、P5 流程作者与后续维护者。
读完要能：按契约头重放入口评估与退役扫描，读回新模块、调用点、目录与枚举状态，并说清历史原件与已接受风险。

P0 在场（材料选节状态，不是执行进度）：

| 必留内容（P0） | 本卡落点 | 状态 |
| --- | --- | --- |
| 独立结果与对应 FR/AC | 契约头「覆盖 AC」与 T005/T006 的「Source / FR / AC」 | written |
| 已交付输入/本卡增量 | T005「Inputs」「Action」、T006「Inputs」「Action」 | written |
| 实施合同与写入边界 | 契约头「Write set」与「文件边界」 | written |
| 目标命令/oracle/原件位置 | 契约头 gate_cmd／oracle／evidence_path | written |
| 停止/回滚/完成条件 | 「停止」「完成」「风险与回滚」 | written |

## Phase 契约头

- **Global spec**：`spec.md#实现设计全局权威`
- **Write set**：`workflows/make-decision/scripts/entry-evaluation.mjs`；`workflows/make-decision/SKILL.md`；`workflows/make-decision/steps.json`；`workflows/make-decision/skill-deps.yaml`；`skills/catalog.yaml`；`skills/reuse-registry.md`；`docs/architecture/move-map.json`；`runtime/review/review-policy.mjs`；`runtime/review/stage-materials.json`；`runtime/review/ocr-delegation-adapter.mjs`；`runtime/review/schemas/attempt.schema.json`；`runtime/review/schemas/result.schema.json`；`runtime/review/schemas/stage-materials.schema.json`；`skills/wh-review/SKILL.md`；`skills/wh-review/skill-bundle.json`；`skills/wh-review/stage-skill-plan.json`；`skills/wh-review/scripts/review-materials.mjs`；`skills/wh-review/scripts/review-semantic-projection.mjs`；`skills/wh-review/scripts/simple-review-runner.mjs`；`skills/wh-review/scripts/third-review-host-config.mjs`；`skills/wh-review/scripts/__tests__/review-semantic-projection.test.mjs`；`skills/wh-review/scripts/__tests__/simple-contracts.test.mjs`；`skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs`；`skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs`；`tools/cli/stage-runtime.mjs`；`core/task-close.mjs`；`skills/decision-log/templates/decision-log-template.md`；`skills/spec-plan/templates/phase-template.md`；`tests/contract/entry-evaluation.test.mjs`；`tests/contract/ocr-delegation-route.test.mjs`；`tests/host-independence.test.mjs`；`tests/contract/card03-review-orchestration.test.mjs`；`tests/contract/review-materials-contract.test.mjs`；`tests/contract/verify-architect-acceptance.test.mjs`；`tests/review/review-record-route.test.mjs`；`GLOSSARY.md`；`docs/standard-workflow.md`
- **Dependency**：P3
- **Consumer**：P5 的入口路由作者、P7 验收者、技能目录与审查合同读者
- **gate_cmd**：`node node_modules/vitest/vitest.mjs run tests/contract/entry-evaluation.test.mjs tests/contract/ocr-delegation-route.test.mjs tests/host-independence.test.mjs tests/contract/review-materials-contract.test.mjs tests/contract/card03-review-orchestration.test.mjs tests/contract/verify-architect-acceptance.test.mjs tests/review/review-record-route.test.mjs skills/wh-review/scripts/__tests__/review-semantic-projection.test.mjs skills/wh-review/scripts/__tests__/simple-contracts.test.mjs skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs && node tools/cli/check-skill-consistency.mjs --root "$PWD"`
- **oracle**：ORACLE-ENTRY-FUNCTION
- **evidence_path**：`quality/evidence/2026-10-20-004-p4-entry-retire.output`
- **STOP**：入口评估行为改变、调用点遗漏、或删除后仍有当前消费者时停；回本卡实施者核引用扫描与调用点，保留原失败；历史原件只读保留，不因校验失败而回删。
- **覆盖 AC**：AC-ENTRY-1（函数子面主验）、AC-MAT-3（主验）
- **Done**：AC-ENTRY-1 的函数子面与 AC-MAT-3 按原判据逐条件核；新模块导出新名且返回语义不变（`choices` 的 mini 品牌改名有记录）、旧模块与旧调用点删除、目录与枚举扫描零当前消费者、历史原件仍在；独立审查事实与未覆盖项写明。

## 工作包声明（人读事实）

- **读集**：`spec.md` 的 PFACT-006、PFACT-007 与 RISK-004；`decision-log.md` 的 D-016、「入口函数迁移」「F 技能矩阵与 mini-task 合并」「退役登记」；`skills/mini-task/scripts/mini-task-runner.mjs`；`workflows/make-decision/SKILL.md`、`steps.json`、`skill-deps.yaml`；`runtime/review/review-policy.mjs`、`stage-materials.json`、schemas、`ocr-delegation-adapter.mjs`；`skills/wh-review/**` 的 mini 分支；`skills/catalog.yaml`、`skills/reuse-registry.md`、`docs/architecture/move-map.json`
- **定序写主**：本卡唯一 writer 先迁函数与调用点（T005），再删路线与枚举（T006）；`tools/cli/stage-runtime.mjs` 与 `core/task-close.mjs` 在 P1–P3 已改其他分支，本卡只改 mini 分支；`skills/catalog.yaml` 在 P3 已加 closeout 调用者，本卡只删 mini 条目
- **接口符号清单**：`evaluateEntryRoute(input)`（新名，返回 `status`、`reason`、`expanded_risks`、`choices`）、`reviewRuleFor`、`runMiniTaskCodeReview`（删除）、mini close 模式（删除）；不新增未命名包装函数
- **合并责任**：本卡 writer 交真实 diff 与扫描输出；删除类改动逐项核当前消费者，冲突先读当前字节
- **progress_cursor**：只指任务事实库 `facts.jsonl` 的 `phase_progress`，本文件不保存进度值

## 速读卡（人读；只写本 Phase 增量）

- **本 Phase 结果**：入口评估从 mini-task 技能迁到 `make-decision` 并改名，调用点与模板同步；mini-task 作为独立路线、审查枚举与收口模式退役，历史原件只读保留。
- **非目标**：不重造入口观测、不改 `TASK_TYPES`、不改入口判据语义；不删历史 review/facts 原件；不新增中央技能矩阵。
- **改动前**：`evaluateMiniTaskScope` 住在 `skills/mini-task/scripts/mini-task-runner.mjs`；mini-task 有独立 SKILL、runner、bundle、catalog 条目、审查 kind 与 close 模式；`mini_task.*` 分布在大约二十个生产与测试文件。
- **改动后**：新模块 `workflows/make-decision/scripts/entry-evaluation.mjs` 导出改名后的入口函数；make-decision 第 1/8 步与两个模板指向新模块；mini 技能、审查 kind、schemas、adapter、close 模式与相关测试删除；历史 `mini_task.*` 审查文件保留但可能无法再校验。
- **与相邻 Phase 的边界**：P3 交收口确认；本卡交入口函数与退役；P5 用新函数与目录写路由和流程。
- **主要风险**：删除面越界到历史原件或漏删当前消费者；返工走法是先扫描再删，保留引用清单，逐项修到零当前消费者。
- **下一步**：P5 在根步骤表与四套流程中调用新入口函数。
- **动手前必读**：`skills/mini-task/scripts/mini-task-runner.mjs:91-120`（评估函数与返回）、`:195-212`（runner 与导出）；`workflows/make-decision/SKILL.md:40`（第 1 步调用）、`:92`（第 8 步展示）；`workflows/make-decision/steps.json` 第 1 步；`runtime/review/review-policy.mjs:3-6,38-42,75-80`；`runtime/review/stage-materials.json:378-435`；`runtime/review/ocr-delegation-adapter.mjs:575-588`；`tools/cli/stage-runtime.mjs:330,395,1182,1242-1248`；`core/task-close.mjs:366`（mini close 模式）；`skills/catalog.yaml:679-692`；`docs/architecture/move-map.json:2086-2114`
- **未决事实**：`choices` 的 mini 品牌改名是否影响历史决策记录的可读性（记录里保留旧值即可，需在 T005 内实读确认）；`createMiniTaskRunner` 无生产调用，可直接删除

## 本 Phase 材料导航（人读）

| 材料 / 锚点 | 本 Phase 用它做什么 | 读取时机 |
| --- | --- | --- |
| `spec.md#实现设计全局权威` | 全局方案、文件边界与兼容说明 | 写卡前 |
| `decision-log.md#D-016`、`#入口函数迁移`、`#F-技能矩阵与mini-task合并` | 迁移与退役决定的来源 | 写卡前与审查时 |
| `skills/mini-task/scripts/mini-task-runner.mjs` | 被迁移的函数与 runner | 迁移前 |
| `runtime/review/**` 的 mini 分支 | 枚举删除范围 | 删除前 |
| `docs/architecture/move-map.json` | 目录登记 | 删除后同步 |

## L0 — 结果与变更

入口评估函数住在即将退役的技能里，调用点、模板与测试都指向旧路径；mini-task 同时提供独立路线、审查 kind 与收口模式，与新的小改动/普通路线冲突。本 Phase 先把入口能力迁走并改名，再删除路线与枚举，历史原件保留。

- **结果**：入口评估在 `make-decision` 内可用且调用点同步；mini-task 不再作为路线存在；历史审查原件仍在。
- **非目标**：不改变评估语义（状态、原因、风险集合），不重造观测，不新增技能或矩阵文件。
- **与其它 Phase 的区别**：本卡是迁移与退役；P5 才写四套流程如何使用入口函数。

## L1 — 可执行契约

### 文件边界

- **新增**：`workflows/make-decision/scripts/entry-evaluation.mjs`、`tests/contract/entry-evaluation.test.mjs`
- **修改**：`workflows/make-decision/SKILL.md`、`workflows/make-decision/steps.json`、`workflows/make-decision/skill-deps.yaml`、`skills/catalog.yaml`、`skills/reuse-registry.md`、`docs/architecture/move-map.json`、`runtime/review/review-policy.mjs`、`runtime/review/stage-materials.json`、`runtime/review/ocr-delegation-adapter.mjs`、`runtime/review/schemas/attempt.schema.json`、`runtime/review/schemas/result.schema.json`、`runtime/review/schemas/stage-materials.schema.json`、`skills/wh-review/SKILL.md`、`skills/wh-review/skill-bundle.json`、`skills/wh-review/stage-skill-plan.json`、`skills/wh-review/scripts/review-materials.mjs`、`skills/wh-review/scripts/review-semantic-projection.mjs`、`skills/wh-review/scripts/simple-review-runner.mjs`、`skills/wh-review/scripts/third-review-host-config.mjs`、`skills/wh-review/scripts/__tests__/review-semantic-projection.test.mjs`、`skills/wh-review/scripts/__tests__/simple-contracts.test.mjs`、`skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs`、`skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs`、`tests/contract/ocr-delegation-route.test.mjs`、`tools/cli/stage-runtime.mjs`、`core/task-close.mjs`、`skills/decision-log/templates/decision-log-template.md`、`skills/spec-plan/templates/phase-template.md`、`tests/host-independence.test.mjs`、`tests/contract/card03-review-orchestration.test.mjs`、`tests/contract/review-materials-contract.test.mjs`、`tests/contract/verify-architect-acceptance.test.mjs`、`tests/review/review-record-route.test.mjs`、`GLOSSARY.md`、`docs/standard-workflow.md`
- **删除**：`skills/mini-task/SKILL.md`、`skills/mini-task/scripts/mini-task-runner.mjs`、`skills/mini-task/skill-bundle.json`、`skills/wh-review/contracts/mini-task-design.md`、`skills/wh-review/contracts/mini-task-implementation.md`、`tests/integration/mini-task-delivery.test.mjs`、`tests/integration/mini-task-a-resume.test.mjs`
- **禁止改动**：`specs/archive/**`、`docs/archive/**`、`quality/**`、`.planning/**`、`graphify-out/**` 的历史原件；`skills/answer-as-page/**`；`runtime/task/portable-workflow-run.mjs`；不删除任何历史 review/facts 文件。

### 任务顺序

T005 先迁函数、调用点与模板并交回可跑测试；T006 在 T005 完成后删除路线与枚举，并修到零当前消费者。T006 依赖 T005。

### T005 — 入口评估迁入 make-decision 并改名

- **Source / FR / AC**：`R-002`、`U-007`、`D-016` / `FR-ENTRY-001` / `AC-ENTRY-1`（函数子面）；`U-007`、`D-016` / `FR-SKILL-001` / `AC-MAT-3`（迁移部分）。复用现有入口观测与真实风险事实，保 `TASK_TYPES`；入口函数迁入 make-decision 并改名，行为保留。
- **Inputs**：PFACT-006 的当前函数与消费者；`skills/mini-task/scripts/mini-task-runner.mjs:91` 的返回形状；`workflows/make-decision/SKILL.md:40` 与 `steps.json` 第 1 步、`skills/decision-log/templates/decision-log-template.md:93`、`skills/spec-plan/templates/phase-template.md:20`；P3 交回的收口与审查事实不参与本 Task。
- **Files / symbols**：`workflows/make-decision/scripts/entry-evaluation.mjs`（新模块，symbol：`evaluateEntryRoute`）；`workflows/make-decision/SKILL.md`（section：第 1 步与第 8 步调用）；`workflows/make-decision/steps.json`（entry：第 1 步 observable_result）；`workflows/make-decision/skill-deps.yaml`（entry：入口技能与依赖）；`skills/decision-log/templates/decision-log-template.md`（section：独立验收单元与入口评估）；`skills/spec-plan/templates/phase-template.md`（section：入口真实返回对照）；`tests/contract/entry-evaluation.test.mjs`（新测试）
- **Action**：①把 `evaluateMiniTaskScope` 的实现复制到新模块，导出名改为 `evaluateEntryRoute`，保留输入字段、`status`、`reason`、`expanded_risks` 语义；`choices` 从 `["shrink-mini-task","create-ordinary-five-stage-task"]` 改为路由语言（如 `["shrink-scope","create-ordinary-five-stage-task"]`），旧值保留在历史决策记录并在模块注释里写明这是唯一的行为文本变化。②更新 make-decision 第 1 步与第 8 步的调用、`steps.json` 对应描述与 `skill-deps.yaml` 的依赖条目，去掉对小技能名的引用。③更新两个模板的引用为「现有入口评估函数」与新模块名，不复制函数正文。④写 `tests/contract/entry-evaluation.test.mjs`：覆盖已知事实返回 `suitable`、缺事实返回 `paused`、`paused` 的 `reason`/`expanded_risks`/`choices` 保留、四类风险硬覆盖、输入类型非法时明确报错；断言新模块导出名与路径、新函数与旧函数对同一输入的语义一致；旧路径的不可导入断言归 T006，本 Task 保留旧模块供调用点对照。⑤删除旧模块内的其余 mini 交付能力不在本 Task（归 T006）。
- **Outputs / failure**：新模块导出新名、语义不变、调用点无旧名；非法输入明确报错；旧模块在本 Task 结束前仍可导入（删除归 T006）。
- **Boundary / DO NOT TOUCH**：不改 `TASK_TYPES`、不改评估判据、不重造观测、不改 `runtime/review/**`（归 T006）；不删旧文件（归 T006）。
- **Dependency**：`P3`；无本 Phase 内更早 Task。
- **Test tier / skill**：unit + contract / backend-testing；面为入口评估返回值与调用点；UI 面不适用。
- **Scenario / fixture or service**：正例为完整入口事实与缺事实两组；反例为四类风险硬覆盖、非法布尔与缺键；纯函数，无外部服务。
- **RED/GREEN gate_cmd**：`node node_modules/vitest/vitest.mjs run tests/contract/entry-evaluation.test.mjs`
- **expected_exit**：RED nonzero; GREEN 0
- **RED target failure**：`ORACLE-ENTRY-FUNCTION` 的目标断言是新模块 `evaluateEntryRoute` 与旧函数对同一输入返回相同 `status`/`reason`/`expanded_risks`；创建模块前该断言无法运行（导入失败属收集失败，另记，不计目标 RED）。RED 归因按「收集失败」记录，目标 RED 记 unavailable 并写原因，不以导入失败冒充目标断言失败。
- **RED evidence**：`quality/evidence/2026-10-20-004-p4-entry-red.output`（记录实际导入失败与「收集失败、非目标 RED」的归因；目标 RED 记 unavailable 及原因）。
- **GREEN oracle**：ORACLE-ENTRY-FUNCTION 同命令退出 0；两组正例与四组反例通过；调用点无旧名。
- **Evidence**：`quality/evidence/2026-10-20-004-p4-entry-retire.output` 与 `quality/evidence/2026-10-20-004-p4-entry-red.output`。
- **Coverage limit**：不证明真实会话会调用新函数；不证明路由决策质量；`choices` 文本改名只在本卡记录，不回溯旧决策记录。
- **STOP / recovery**：语义与旧函数不一致、或调用点仍有旧名时停；回本卡实施者按旧函数测试逐项对齐，不删旧测试换绿。
- **测试变更请求**：`none`
- **Done**：AC-ENTRY-1 函数子面与 AC-MAT-3 迁移部分按原判据核完；RED/GREEN 同 oracle；调用点零旧名；独立审查与未覆盖项写明。

### T006 — mini-task 路线、审查枚举与收口模式退役

- **Source / FR / AC**：`U-007`、`D-016` / `FR-SKILL-001` / `AC-MAT-3`。四套流程各自列技能；31 共用单一定义；mini 路线退役，历史审查枚举按 D-016 删除，历史原件只读保留。
- **Inputs**：T005 交回的新模块与调用点；`runtime/review/**` 的 mini 分支清单（`review-policy.mjs:3-6,38-42,75-80`、`stage-materials.json:378-435`、`ocr-delegation-adapter.mjs:575-588`、`tools/cli/stage-runtime.mjs:330,395,1182,1242-1248`、`core/task-close.mjs:366`）；`skills/wh-review/**` 的 mini 分支与四份脚本测试；`skills/catalog.yaml:679-692`、`skills/reuse-registry.md`、`docs/architecture/move-map.json:2086-2114`。
- **Files / symbols**：`runtime/review/review-policy.mjs`（symbol：`REVIEW_KINDS`、`assertReviewIdentity`、`reviewRuleFor`）；`runtime/review/stage-materials.json`（entry：`mini_task`）；`runtime/review/ocr-delegation-adapter.mjs`（symbol：mini kind 分支）；`runtime/review/schemas/attempt.schema.json`、`runtime/review/schemas/result.schema.json`、`runtime/review/schemas/stage-materials.schema.json`（mini 枚举）；`skills/wh-review/SKILL.md`、`skills/wh-review/skill-bundle.json`、`skills/wh-review/stage-skill-plan.json`、`skills/wh-review/scripts/review-materials.mjs`、`skills/wh-review/scripts/review-semantic-projection.mjs`、`skills/wh-review/scripts/simple-review-runner.mjs`、`skills/wh-review/scripts/third-review-host-config.mjs`、`skills/wh-review/scripts/__tests__/review-semantic-projection.test.mjs`、`skills/wh-review/scripts/__tests__/simple-contracts.test.mjs`、`skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs`、`skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs`；`tools/cli/stage-runtime.mjs`（symbol：`runMiniTaskCodeReview`、miniImplementation 分支）；`core/task-close.mjs`（symbol：mini close 模式）；`skills/catalog.yaml`、`skills/reuse-registry.md`、`docs/architecture/move-map.json`；`GLOSSARY.md`、`docs/standard-workflow.md`；`tests/host-independence.test.mjs`、`tests/contract/ocr-delegation-route.test.mjs`（含 232-233 的 mini 身份用例）、`tests/contract/card03-review-orchestration.test.mjs`、`tests/contract/review-materials-contract.test.mjs`、`tests/contract/verify-architect-acceptance.test.mjs`、`tests/review/review-record-route.test.mjs`
- **Action**：①删除 `skills/mini-task/**` 三个文件、`skills/wh-review/contracts/mini-task-*.md`、两个 mini 集成测试。②从 `review-policy`、`stage-materials`、三个 schema、OCR adapter、`stage-runtime` 的 mini 分支、`core/task-close` 的 mini close 模式中删除 `mini_task.*` 相关枚举与代码路径；保留其它 kind。③修 `skills/wh-review` 的脚本与脚本测试中被删分支的引用，断言改为不存在的 kind 被拒绝。④修 `catalog.yaml`、`reuse-registry.md`、`move-map.json`、`GLOSSARY.md`、`docs/standard-workflow.md` 的入口与登记；删除 move-map 的 mini 条目。⑤修 `tests/host-independence.test.mjs` 的 runner 路径扫描与其余受影响测试，使其断言当前真实状态；在 `entry-evaluation.test.mjs` 增断言旧路径 `skills/mini-task/scripts/mini-task-runner.mjs` 不可再导入；保留历史原件的只读事实。⑥跑一次引用扫描：当前代码、方法与目录对 `mini-task`/`mini_task`/`createMiniTaskRunner` 的引用应为零（历史 `specs/archive/**`、`docs/archive/**`、旧 review 文件除外），并把扫描命令与输出留证据。
- **Outputs / failure**：mini 路线无当前消费者、枚举删除、历史原件仍在；仍有当前消费者时报出具体文件:行号，不静默放过。
- **Boundary / DO NOT TOUCH**：不删 `quality/**`、`specs/archive/**`、`docs/archive/**`、`.planning/**`、`graphify-out/**` 与任何历史 review/facts；不改其它审查 kind 的行为；不改 `TASK_TYPES`。
- **Dependency**：`T005`
- **Test tier / skill**：contract / backend-testing；面为审查身份、目录一致性、引用扫描；历史文件可校验性不测（已接受风险）。
- **Scenario / fixture or service**：正例为删除后受影响测试全绿；反例为未知 kind 仍被接受、目录残留条目；无外部服务。
- **RED/GREEN gate_cmd**：`node node_modules/vitest/vitest.mjs run tests/contract/review-materials-contract.test.mjs tests/review/review-record-route.test.mjs tests/contract/verify-architect-acceptance.test.mjs tests/contract/ocr-delegation-route.test.mjs skills/wh-review/scripts/__tests__/review-semantic-projection.test.mjs skills/wh-review/scripts/__tests__/simple-contracts.test.mjs skills/wh-review/scripts/__tests__/third-review-host-config.test.mjs skills/wh-review/scripts/__tests__/wh-review-cli.test.mjs && node tools/cli/check-skill-consistency.mjs --root "$PWD"`
- **expected_exit**：RED nonzero; GREEN 0
- **RED target failure**：`ORACLE-ENTRY-FUNCTION` 断言 `MINI_TASK_REFS` 扫描结果为空且未知 review kind 被拒；当前仍有残留引用与枚举，目标断言失败。
- **RED evidence**：`quality/evidence/2026-10-20-004-p4-retire-red.output`。
- **GREEN oracle**：ORACLE-ENTRY-FUNCTION 同命令退出 0；引用扫描为空、未知 kind 被拒、历史原件存在。
- **Evidence**：`quality/evidence/2026-10-20-004-p4-entry-retire.output`、`quality/evidence/2026-10-20-004-p4-retire-red.output`、引用扫描输出。
- **Coverage limit**：不证明 16 个历史任务与 398 个历史审查文件仍可校验（已接受风险）；不证明业务仓经验落盘。
- **STOP / recovery**：仍有当前消费者、或删除波及历史原件时停；回本卡实施者按引用清单逐项修，历史原件若已误删从 git 历史恢复并记录。
- **测试变更请求**：`none`（受影响测试按新事实修断言，不改变被冻结的 oracle 语义）
- **Done**：AC-MAT-3 全部适用条件核完；引用扫描为空；未知 kind 反例通过；历史原件仍在；独立审查与已接受风险写明。

### 测试策略

| 目标 | Task | 角色 | gate_cmd / 预期退出码 | 判据 / 证据路径 |
| --- | --- | --- | --- | --- |
| 入口评估迁入并改名 | T005 | RED | `node node_modules/vitest/vitest.mjs run tests/contract/entry-evaluation.test.mjs` / 1 | ORACLE-ENTRY-FUNCTION / `quality/evidence/2026-10-20-004-p4-entry-red.output` |
| 入口评估迁入并改名 | T005 | GREEN | `node node_modules/vitest/vitest.mjs run tests/contract/entry-evaluation.test.mjs` / 0 | ORACLE-ENTRY-FUNCTION / `quality/evidence/2026-10-20-004-p4-entry-retire.output` |
| mini 路线与枚举退役 | T006 | RED | `node node_modules/vitest/vitest.mjs run tests/contract/review-materials-contract.test.mjs` / 1 | ORACLE-ENTRY-FUNCTION / `quality/evidence/2026-10-20-004-p4-retire-red.output` |
| mini 路线与枚举退役 | T006 | GREEN | `node node_modules/vitest/vitest.mjs run tests/contract/review-materials-contract.test.mjs tests/review/review-record-route.test.mjs tests/contract/verify-architect-acceptance.test.mjs` / 0 | ORACLE-ENTRY-FUNCTION / `quality/evidence/2026-10-20-004-p4-entry-retire.output` |

面声明：入口评估面（测）、审查身份与 schema 面（测）、目录一致性面（测）、历史文件可校验面（不测，理由：D-016 已接受删除枚举导致历史校验可能中断）。

### 覆盖边界

- **覆盖上限**：只证明入口能力迁移与退役后当前代码零引用、受影响测试全绿；不证明历史校验、不证明真实路由质量。
- **显式不覆盖**：历史 398 个审查文件的重新校验、业务仓经验、四路真跑。

### 停止

入口语义变化、调用点残留、删除波及历史原件或仍有当前消费者时停；回本卡实施者按引用清单处理，保留原失败。

### 完成

AC-ENTRY-1 函数子面与 AC-MAT-3 的适用条件满足、RED/GREEN 同 oracle、引用扫描为空、历史原件仍在、独立审查已做，才可判完成；删完文件不等于完成。

### 风险与回滚

- **风险**：删除面越界或漏删
- **影响**：历史原件丢失或残留第二套审查规则
- **缓解**：先迁移后删除；删除前扫描；历史文件只读并在测试里断言存在
- **回滚**：按 git 历史恢复删除文件，回退枚举改动；已接受的校验风险保持记录
- **触发条件**：历史文件缺失、或引用扫描非空

### 交接知识（给下游 Phase 与审查的已核实事实）

- 新模块路径 `workflows/make-decision/scripts/entry-evaluation.mjs` 与导出名 `evaluateEntryRoute` 是 P5 路由与流程的唯一入口名。
- `choices` 的 mini 品牌改名是唯一行为文本变化，旧值只在历史决策记录里。
- 历史 `mini_task.*` 审查文件保留在 `quality/reviews/` 与任务库，删除枚举后可能无法再校验，已接受。

## L2 — 可删除参考

实现期间可读决策记录 D-016 与「退役登记」的删除面；删掉本节不改变 L0/L1。

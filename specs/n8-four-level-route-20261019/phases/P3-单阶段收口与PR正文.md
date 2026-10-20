# Phase P3 — 单阶段收口与 PR 正文

读者：P3 实施者、独立审查者、P5 轻档流程作者与 P7 验收者。
读完要能：按契约头重放收口确认测试与三份收口契约测试，读回确认 stage 的来源、close-plan 路由与 TCR 原件，并说清哪些收口条件仍未闭环。

P0 在场（材料选节状态，不是执行进度）：

| 必留内容（P0） | 本卡落点 | 状态 |
| --- | --- | --- |
| 独立结果与对应 FR/AC | 契约头「覆盖 AC」与 T003/T004 的「Source / FR / AC」 | written |
| 已交付输入/本卡增量 | T003「Inputs」「Action」、T004「Inputs」「Action」 | written |
| 实施合同与写入边界 | 契约头「Write set」与「文件边界」 | written |
| 目标命令/oracle/原件位置 | 契约头 gate_cmd／oracle／evidence_path | written |
| 停止/回滚/完成条件 | 「停止」「完成」「风险与回滚」 | written |

## Phase 契约头

- **Global spec**：`spec.md#实现设计全局权威`
- **Write set**：`core/task-close.mjs`；`tools/cli/task-close.mjs`；`tools/cli/stage-runtime.mjs`；`skills/stage-closeout/SKILL.md`；`skills/catalog.yaml`；`docs/delivery-closeout-charter.md`；`tests/contract/stage-closeout-skill.test.mjs`；`tests/contract/stage-closeout-step-contract.test.mjs`；`tests/contract/delivery-closeout-charter-contract.test.mjs`；`tests/contract/light-close-confirm.test.mjs`
- **Dependency**：P2
- **Consumer**：P5 轻档流程作者、P7 验收者、收口与交付读者
- **gate_cmd**：`node node_modules/vitest/vitest.mjs run tests/contract/light-close-confirm.test.mjs tests/contract/stage-closeout-skill.test.mjs tests/contract/stage-closeout-step-contract.test.mjs tests/contract/delivery-closeout-charter-contract.test.mjs`
- **oracle**：ORACLE-LIGHT-CLOSE
- **evidence_path**：`quality/evidence/2026-10-20-003-p3-light-close.output`
- **STOP**：确认 stage 推导与任务阶段事实不一致、或冻结测试改动未取得独立审查时停；回本卡实施者核 `confirmClosePlan`/`acceptedConfirmation` 与三份契约测试，保留原失败。
- **覆盖 AC**：AC-CLOSE-1（主验）、AC-CLOSE-2（主验）、AC-CLOSE-3（主验）、AC-ENTRY-4（收口读取点子面）
- **Done**：三条 AC 按原判据逐条件核；新测试同时断言轻任务确认记录 stage 为 `make-decision`、复杂任务仍为 `verify-code`、PR 正文取 spec、三份冻结测试按 TCR 更新且审查原件可读；独立审查事实与未闭环项写明。

## 工作包声明（人读事实）

- **读集**：`spec.md` 的 PFACT-004、PFACT-005、PFACT-012 与 RISK-003；`decision-log.md` 的 E 模块「收口/交付/驾驶舱」；`core/task-close.mjs` 的 `confirmClosePlan`、`acceptedConfirmation`、`buildDefaultPrDescription`；`tools/cli/stage-runtime.mjs:1339-1349` 的 confirm 分支；三份收口契约测试
- **定序写主**：本卡唯一 writer 持笔 `core/task-close.mjs`、`tools/cli/task-close.mjs`、`tools/cli/stage-runtime.mjs` 的 confirm 分支、`skills/stage-closeout/SKILL.md`、`skills/catalog.yaml`、`docs/delivery-closeout-charter.md` 与三份契约测试；P1/P2 已交同一文件的其他分支，本卡只改 confirm 与 closeout 段
- **接口符号清单**：`confirmClosePlan({taskDir, planRef, outcome, replyText})`、`acceptedConfirmation(c, planRef, confirmationRef, expectedPlan)`、`buildDefaultPrDescription(c, {baseline, source, head, base})`、`closeConfirmationStage(taskDir)`
- **合并责任**：本卡 writer 交真实 diff、测试输出与 TCR 原件；与 P1/P2 同文件改动按行段分开，冲突先读当前字节
- **progress_cursor**：只指任务事实库 `facts.jsonl` 的 `phase_progress`，本文件不保存进度值

## 速读卡（人读；只写本 Phase 增量）

- **本 Phase 结果**：轻档任务能在定方向阶段完成一次真实物理收口：确认记录 stage 按任务实际阶段写，`stage-closeout` 接受定方向调用者，PR 正文取 spec，冻结测试的改动有 TCR 与独立审查。
- **非目标**：不新增 stage、不改 close plan 的执行动作、不改归档/删除策略、不替 N7 改既有收口义务。
- **改动前**：`confirmClosePlan` 写死 `stage:"verify-code"`，`acceptedConfirmation` 只接受 verify-code；`stage-runtime` 的 close-plan 特判只在 `--stage=verify-code`；三份契约测试把 stage-closeout 的调用者钉在 `build-prd`/`verify-code`。
- **改动后**：确认 stage 由任务阶段事实确定性推导（有 `verify-code` 行取 `verify-code`，只有 `make-decision` 行取 `make-decision`）；close-plan 路由接受这两个阶段；三份契约测试按 TCR 更新并保留旧断言证据。
- **与相邻 Phase 的边界**：P2 交审查记录，本卡交收口；P5 在流程正文写「何时触发收口」。
- **主要风险**：stage 推导取错（例如按最近写入行而非真实阶段），导致确认记录与 plan 不符；返工走法是用任务阶段事实的确定性规则并加两条路径的反例。
- **下一步**：P5 在四套流程末步接收口，P4 删除 mini-task 收口模式。
- **动手前必读**：`core/task-close.mjs:230-240`（PR 正文读 spec）、`:398-410`（`confirmClosePlan`）、`:411-430`（`acceptedConfirmation`）、`tools/cli/stage-runtime.mjs:1339-1349`（confirm 分支）、`tools/cli/task-close.mjs:29-48`（CLI 参数）、`tests/contract/stage-closeout-step-contract.test.mjs:1,17-30,71-77`（frozen 声明与断言）、`tests/contract/stage-closeout-skill.test.mjs:21`、`tests/contract/delivery-closeout-charter-contract.test.mjs:38-40`、`skills/catalog.yaml:199`
- **未决事实**：close plan 是否已有字段可承载 confirm stage（若无可从 facts 推导，不新增 plan 字段）；需在 T003 内实读 close plan 构建与校验后确定

## 本 Phase 材料导航（人读）

| 材料 / 锚点 | 本 Phase 用它做什么 | 读取时机 |
| --- | --- | --- |
| `spec.md#实现设计全局权威` | 全局方案与文件边界 | 写卡前 |
| `decision-log.md#E-收口交付驾驶舱` | 确认 stage 参数化与 TCR 的来源 | 写卡前与审查时 |
| `core/task-close.mjs` | 确认与 close plan 实现 | 改第一行前 |
| `skills/stage-closeout/SKILL.md` | 调用者与交付说明正文 | 改第一行前 |
| 三份收口契约测试 | 冻结断言与 TCR 对象 | 改断言前 |

## L0 — 结果与变更

物理收口当前只服务 `build-prd`/`verify-code`；轻档任务在定方向阶段完成后无法用同一条收口路径交付，因为确认 stage 被写死。本 Phase 把确认 stage 改为按任务实际阶段推导，并让 `stage-closeout` 与三份契约测试承认定方向调用者。

- **结果**：轻档任务在 `make-decision` 完成后能走真实物理收口；复杂任务路径不变；冻结测试的改动有 TCR 与独立审查。
- **非目标**：不改提交/推送/PR/归档/清理的动作本身，不改最终 close 的用户确认边界。
- **与其它 Phase 的区别**：本卡是收口与交付入口；审查记录归 P2，流程触发归 P5。

## L1 — 可执行契约

### 文件边界

- **新增**：`tests/contract/light-close-confirm.test.mjs`
- **修改**：`core/task-close.mjs`、`tools/cli/task-close.mjs`、`tools/cli/stage-runtime.mjs`（只改 confirm 分支）、`skills/stage-closeout/SKILL.md`、`skills/catalog.yaml`、`docs/delivery-closeout-charter.md`、`tests/contract/stage-closeout-skill.test.mjs`、`tests/contract/stage-closeout-step-contract.test.mjs`、`tests/contract/delivery-closeout-charter-contract.test.mjs`
- **禁止改动**：`runtime/review/**`、`runtime/task/portable-workflow-run.mjs`、`skills/answer-as-page/**`、`specs/archive/**`；本卡不新增 close plan 字段，不改迷你收口模式（归 P4）。

### 任务顺序

T003 先交确认 stage 与 close-plan 路由；T004 再交 stage-closeout 调用者、目录数据与三份契约测试的 TCR。T004 依赖 T003 的确认 stage 行为。

### T003 — 确认 stage 按任务实际阶段推导

- **Source / FR / AC**：`R-004`、`D-012` / `FR-CLOSE-001` / `AC-CLOSE-1`；`PRD-N8`、`D-012` / `FR-CLOSE-001` / `AC-CLOSE-2`。四级收口与交付接线归本卡；单阶段收口可用，不伪造 verify-code。
- **Inputs**：PFACT-004 的当前行（`core/task-close.mjs:402,413`、`tools/cli/stage-runtime.mjs:1344`）；PFACT-012 的冻结断言；P2 交回的审查记录（收口材料可读）；任务阶段事实由 `runtime/task/task-store.mjs` 读写。
- **Files / symbols**：`core/task-close.mjs`（symbol：`confirmClosePlan`、`acceptedConfirmation`、新纯函数 `closeConfirmationStage`）；`tools/cli/task-close.mjs`（symbol：CLI 参数传递）；`tools/cli/stage-runtime.mjs`（symbol：confirm 分支）；`tests/contract/light-close-confirm.test.mjs`（新测试）
- **Action**：①写 `closeConfirmationStage(taskDir)`：读任务事实行，按 `verify-code` → `build-prd` → `make-decision` 的顺序返回实际阶段；三者都没有时抛明确错误。`build-prd` 是既有收口调用者（PFACT-005），不得因新增轻档把它挤掉；既有以 `verify-code` 记录的 build-prd 确认原件只读保留，新记录按实际阶段写。②`confirmClosePlan` 用该函数记录 confirmation 的 stage；`acceptedConfirmation` 用同一函数校验 `value.stage`，不匹配时报 `CONFIRMATION_REJECTED`。③`stage-runtime` 的 confirm 分支把 close-plan 特判从 `--stage=verify-code` 放宽为 `verify-code` 与 `make-decision` 两者，仍只对 close 目录内的 plan 路径生效；实际 stage 由 `confirmClosePlan` 推导，不信任调用方传入值。④写新测试：轻任务夹具（只有 make-decision 阶段行）走 `confirmClosePlan` 后记录 stage 为 `make-decision` 且 `acceptedConfirmation` 接受；复杂任务夹具（有 verify-code 行）记录 `verify-code`；规划任务夹具（只有 build-prd 行）记录 `build-prd`；把 `verify-code` 记录挂到轻任务 plan 时被拒。⑤断言 `buildDefaultPrDescription` 读的是 spec 正文（既有行为），不新增字段。⑥兼容既有 build-prd 确认原件：任务有 `build-prd` 行且无 `verify-code` 行时，`acceptedConfirmation` 同时接受旧代码以 `verify-code` 记录的确认（历史原件只读、不改写），新记录仍按 `build-prd` 写；测试覆盖这条只读兼容。
- **Outputs / failure**：两条任务路径各自的确认记录 stage 正确；stage 不符时拒绝并保留 plan 显示；无阶段行时报明确错误。
- **Boundary / DO NOT TOUCH**：不改 close plan 的 JSON 字段与校验、不改显示内容、不改提交/推送/归档动作；不新增持久状态。
- **Dependency**：`P2`；无本 Phase 内更早 Task。
- **Test tier / skill**：contract / backend-testing；面为确认记录与校验、CLI 路由；浏览器面不适用。
- **Scenario / fixture or service**：正例为轻任务与复杂任务各一条 close plan；反例为 stage 交叉、无阶段行；夹具沿用 `tests/close` 的临时任务与临时 Git 仓库写法，结束清理。
- **RED/GREEN gate_cmd**：`node node_modules/vitest/vitest.mjs run tests/contract/light-close-confirm.test.mjs`
- **expected_exit**：RED nonzero; GREEN 0
- **RED target failure**：`ORACLE-LIGHT-CLOSE` 断言轻任务确认记录 stage 为 `make-decision`；当前实现写死 `verify-code`，目标断言失败。
- **RED evidence**：`quality/evidence/2026-10-20-003-p3-red.output`（首次真实执行后保存）。
- **GREEN oracle**：ORACLE-LIGHT-CLOSE 同命令退出 0；两条路径 stage 正确、交叉被拒、PR 正文读 spec。
- **Evidence**：`quality/evidence/2026-10-20-003-p3-light-close.output` 与 `quality/evidence/2026-10-20-003-p3-red.output`。
- **Coverage limit**：不证明真实 Git 远程动作可用；不证明归档与清理；不覆盖 mini 收口模式（归 P4）。
- **STOP / recovery**：确认记录与 plan 不符、或 CLI 路由拒绝合法轻任务时停，回本卡实施者核推导函数与路由；不通过改测试期望值换绿。
- **测试变更请求**：`none`（本 Task 不改冻结断言；冻结断言改动在 T004）
- **Done**：AC-CLOSE-1、AC-CLOSE-2 中与本 Task 相关的条件核完；RED/GREEN 同 oracle；两条路径与反例通过；独立审查与未覆盖项写明。

### T004 — stage-closeout 定方向调用者与 TCR

- **Source / FR / AC**：`PRD-N8`、`D-012` / `FR-CLOSE-001` / `AC-CLOSE-2`；`R-011`、`D-013` / `FR-CLOSE-001` / `AC-CLOSE-3`；`U-003`、`D-002` / `FR-ENTRY-002` / `AC-ENTRY-4`（收口消费者读级别与路线，读不到按复杂并记缺口）。stage-closeout 增加定方向调用者；每次收口写经验；冻结测试改动走一次 TCR 并独立审查。
- **Inputs**：T003 交回的确认 stage 行为；`skills/stage-closeout/SKILL.md:8` 的当前调用者清单；三份契约测试的当前断言；`skills/catalog.yaml:199` 的 `used_by_stages`。
- **Files / symbols**：`skills/stage-closeout/SKILL.md`（section：调用者与交付说明，无代码符号）；`skills/catalog.yaml`（entry：stage-closeout 的 `used_by_stages`）；`docs/delivery-closeout-charter.md`（section：收口入口）；`tests/contract/stage-closeout-skill.test.mjs`、`tests/contract/stage-closeout-step-contract.test.mjs`、`tests/contract/delivery-closeout-charter-contract.test.mjs`（冻结断言按 TCR 更新）
- **Action**：①在 `SKILL.md` 的调用者段加 `make-decision`（轻档在实施与审查完成后触发物理交付），写清「反思收口在前、物理交付在后」「普通 PR 正文读 spec」「收口前读决策记录『级别与路线』；读不到按复杂路线处理并记缺口，不静默降档」。②`catalog.yaml` 的 `stage-closeout.used_by_stages` 增加 `make-decision`。③`docs/delivery-closeout-charter.md` 的入口段同步。④按 TCR 改三份契约测试的调用者断言：旧断言、旧字节、理由、本次 RED 证据与独立审查引用写入本卡的「测试变更请求」并指向证据路径；保留旧断言的失败原件。⑤补 `light-close-confirm.test.mjs` 的文档断言：SKILL 与 charter 含定方向调用者与经验要求。
- **Outputs / failure**：三份契约测试按新调用者通过；旧断言证据保留；文档与 catalog 一致；不一致时报出。
- **Boundary / DO NOT TOUCH**：不改 close plan 字段与执行动作；不改其他技能的 `used_by_stages`；不改 N7 的既有收口义务。
- **Dependency**：`T003`
- **Test tier / skill**：contract / backend-testing；面为技能目录一致性、文档契约、TCR 记录；UI 面不适用。
- **Scenario / fixture or service**：正例为 catalog + 三份契约测试同批通过；反例为漏改某一份契约测试或 catalog 值；无外部服务。
- **RED/GREEN gate_cmd**：`node node_modules/vitest/vitest.mjs run tests/contract/light-close-confirm.test.mjs tests/contract/stage-closeout-skill.test.mjs tests/contract/stage-closeout-step-contract.test.mjs tests/contract/delivery-closeout-charter-contract.test.mjs`
- **expected_exit**：RED nonzero; GREEN 0
- **RED target failure**：`ORACLE-LIGHT-CLOSE` 断言 `stage-closeout` 的 `used_by_stages` 含 `make-decision` 且 SKILL 有定方向调用者段；当前为 `['build-prd','verify-code']` 且无该段，目标断言失败。
- **RED evidence**：`quality/evidence/2026-10-20-003-p3-tcr-red.output`（冻结断言旧失败原件）。
- **GREEN oracle**：ORACLE-LIGHT-CLOSE 同命令退出 0；三份契约测试与 catalog 一致；TCR 记录含旧/新断言、理由与独立审查引用。
- **Evidence**：`quality/evidence/2026-10-20-003-p3-light-close.output`、`quality/evidence/2026-10-20-003-p3-tcr-red.output`、TCR 审查原件路径。
- **Coverage limit**：不证明真实收口动作在业务仓执行成功；不证明经验写入的业务仓路径可用；不覆盖 P7 的四路验收。
- **STOP / recovery**：契约测试与 catalog 不一致、或 TCR 缺独立审查时停；回本卡实施者补齐，不直接改断言值而无记录。
- **测试变更请求**：有 — 理由：让 stage-closeout 接受定方向调用者（D-012/E 模块取舍）；旧断言：`used_by_stages` 等于 `['build-prd','verify-code']`（三份契约测试同义）；新断言：含 `make-decision`；此前 RED 证据：`quality/evidence/2026-10-20-003-p3-tcr-red.output`；独立审查引用：本 Phase 的独立审查原件（T004 完成后补具体路径）。
- **Done**：AC-CLOSE-2、AC-CLOSE-3 中与本 Task 相关的条件核完；RED/GREEN 同 oracle；TCR 记录与审查原件可读；独立审查与未覆盖项写明。

### 测试策略

| 目标 | Task | 角色 | gate_cmd / 预期退出码 | 判据 / 证据路径 |
| --- | --- | --- | --- | --- |
| 轻任务确认 stage 按实际阶段 | T003 | RED | `node node_modules/vitest/vitest.mjs run tests/contract/light-close-confirm.test.mjs` / 1 | ORACLE-LIGHT-CLOSE / `quality/evidence/2026-10-20-003-p3-red.output` |
| 轻任务确认 stage 按实际阶段 | T003 | GREEN | `node node_modules/vitest/vitest.mjs run tests/contract/light-close-confirm.test.mjs` / 0 | ORACLE-LIGHT-CLOSE / `quality/evidence/2026-10-20-003-p3-light-close.output` |
| stage-closeout 接受定方向调用者 | T004 | RED | `node node_modules/vitest/vitest.mjs run tests/contract/stage-closeout-skill.test.mjs` / 1 | ORACLE-LIGHT-CLOSE / `quality/evidence/2026-10-20-003-p3-tcr-red.output` |
| stage-closeout 接受定方向调用者 | T004 | GREEN | `node node_modules/vitest/vitest.mjs run tests/contract/light-close-confirm.test.mjs tests/contract/stage-closeout-skill.test.mjs tests/contract/stage-closeout-step-contract.test.mjs tests/contract/delivery-closeout-charter-contract.test.mjs` / 0 | ORACLE-LIGHT-CLOSE / `quality/evidence/2026-10-20-003-p3-light-close.output` |

面声明：确认与 close plan 面（测）、技能目录面（测）、文档契约面（测）、真实 Git 远程面（不测，理由：本卡不发真实交付，远程动作由 P7 与真实收口运行承担）。

### 覆盖边界

- **覆盖上限**：只证明确认 stage、调用者与文档契约按实际阶段工作；不证明远程交付、归档清理与经验落盘成功。
- **显式不覆盖**：真实业务仓 Improvements 写入、远程 push/PR、最终 close 的用户确认范围。

### 停止

确认 stage 与 plan 不符、三份契约测试不一致、或 TCR 无独立审查时停；回本卡实施者补齐材料，保留原失败。

### 完成

AC-CLOSE-1/2/3 的适用条件满足、RED/GREEN 同 oracle、TCR 记录与审查原件可读、独立审查已做，才可判完成；文档断言通过不等于真实收口成功。

### 风险与回滚

- **风险**：确认 stage 推导取错或 TCR 绕过审查
- **影响**：轻任务收口被拒，或冻结测试被无审查改动
- **缓解**：确定性推导规则 + 两条路径反例；TCR 记录绑定独立审查
- **回滚**：回退 `closeConfirmationStage` 与三份契约测试的改动，恢复 verify-code 常量
- **触发条件**：反例变红或审查原件缺失

### 交接知识（给下游 Phase 与审查的已核实事实）

- close plan 不接受新字段；确认 stage 由 facts 行推导，plan 字节不变。
- 三份契约测试是同一事实的三处断言，改一处必须同步三处并保留旧失败。
- `buildDefaultPrDescription` 已经读 `specs/<task>/spec.md`；轻档产 spec 后 PR 正文自动可用，不需要新代码。

## L2 — 可删除参考

实现期间可读 P1 的材料放行与 P5 的收口时点；删掉本节不改变 L0/L1。

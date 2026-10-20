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
- **Write set**：`core/task-close.mjs`；`tools/cli/task-close.mjs`；`tools/cli/stage-runtime.mjs`；`skills/stage-closeout/SKILL.md`；`skills/catalog.yaml`；`docs/delivery-closeout-charter.md`；`tests/contract/stage-closeout-skill.test.mjs`；`tests/contract/stage-closeout-step-contract.test.mjs`；`tests/contract/delivery-closeout-charter-contract.test.mjs`；`tests/contract/light-close-confirm.test.mjs`；`tests/close/close-contract.test.mjs`；`tests/close/cleanup-resume-finalize.test.mjs`；`tests/contract/close-remote-branch-cleanup.test.mjs`；`tests/contract/card05-close-cli-mechanism.test.mjs`；`tests/contract/card05-planning-gap-behavior.test.mjs`；`tests/contract/close-sidecar-and-archive.test.mjs`；`tests/integration/vnext-delivery-close.test.mjs`；`specs/n8-four-level-route-20261019/spec.md`；`specs/n8-four-level-route-20261019/phases/P3-单阶段收口与PR正文.md`；`specs/n8-four-level-route-20261019/phases/index.md`
- **Dependency**：P2
- **Consumer**：P5 轻档流程作者、P7 验收者、收口与交付读者
- **gate_cmd**：`node node_modules/vitest/vitest.mjs run tests/contract/light-close-confirm.test.mjs tests/contract/stage-closeout-skill.test.mjs tests/contract/stage-closeout-step-contract.test.mjs tests/contract/delivery-closeout-charter-contract.test.mjs`
- **oracle**：ORACLE-LIGHT-CLOSE
- **evidence_path**：`quality/tests/2026-10-20-031-p3-independent-red.output`
- **STOP**：确认 stage 推导与任务阶段事实不一致、或冻结测试改动未取得独立审查时停；回本卡实施者核 `confirmClosePlan`/`acceptedConfirmation` 与三份契约测试，保留原失败。
- **覆盖 AC**：AC-CLOSE-1（主验）、AC-CLOSE-2（主验）、AC-CLOSE-3（主验）、AC-ENTRY-4（收口读取点子面）
- **Done**：三条 AC 按原判据逐条件核；新测试同时断言轻任务确认记录 stage 为 `make-decision`、复杂任务仍为 `verify-code`、PR 正文取 spec、三份冻结测试按 TCR 更新且审查原件可读；独立审查事实与未闭环项写明。

## 工作包声明（人读事实）

- **读集**：`spec.md` 的 PFACT-004、PFACT-005、PFACT-012 与 RISK-003；`decision-log.md` 的 E 模块「收口/交付/驾驶舱」；`core/task-close.mjs` 的 `confirmClosePlan`、`acceptedConfirmation`、`buildDefaultPrDescription`；`tools/cli/stage-runtime.mjs:1339-1349` 的 confirm 分支；三份收口契约测试
- **定序写主**：本卡唯一 writer 持笔 `core/task-close.mjs`、`tools/cli/task-close.mjs`、`tools/cli/stage-runtime.mjs` 的 confirm 分支、`skills/stage-closeout/SKILL.md`、`skills/catalog.yaml`、`docs/delivery-closeout-charter.md` 与三份契约测试；P1/P2 已交同一文件的其他分支，本卡只改 confirm 与 closeout 段
- **接口符号清单**：`confirmClosePlan({taskDir, planRef, outcome, replyText})`、`acceptedConfirmation(c, planRef, confirmationRef, expectedPlan)`、`buildDefaultPrDescription(c, {baseline, source, head, base})`、`closeConfirmationStage(taskDir)`
- **合并责任**：本卡 writer 交真实 diff、测试输出与 TCR 原件；与 P1/P2 同文件改动按行段分开，冲突先读当前字节
- **规则锚**：`spec.md` FR-CLOSE-001「物理收口必须接受定方向阶段的调用者」；Appendix A AC-CLOSE-1「每次阶段末做反思收口」、AC-CLOSE-2「确认 stage 可按实际阶段传」、AC-CLOSE-3「四级每次收口都写业务仓 Improvements」；本卡 T003 Action 的 `verify-code` → `build-prd` → `make-decision` 与旧规划确认只读兼容。
- **材料变更影响**：补规则锚、材料影响、TCR 精确断言及真实执行事实；spec 全局边界与纯指针 index 同步已授权七夹具及三材料路径，不改已确认方向。速读卡及 Outputs 的“两条路径”是旧摘要，实施以 T003 Action 三条阶段路径为准。stage-runtime 仅接 verify-code/make-decision；规划入口保留 `tools/cli/task-close.mjs confirm` 直调同一 owner，不新增 public API。范围原件为 `quality/evidence/2026-10-20-069-p3-included-scope.json`、`070-p3-outside-scope.json`。
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
- **修改**：`tests/close/close-contract.test.mjs`；`tests/close/cleanup-resume-finalize.test.mjs`；`tests/contract/close-remote-branch-cleanup.test.mjs`；`tests/contract/card05-close-cli-mechanism.test.mjs`；`tests/contract/card05-planning-gap-behavior.test.mjs`；`tests/contract/close-sidecar-and-archive.test.mjs`；`tests/integration/vnext-delivery-close.test.mjs`；`specs/n8-four-level-route-20261019/spec.md`；`specs/n8-four-level-route-20261019/phases/P3-单阶段收口与PR正文.md`；`specs/n8-four-level-route-20261019/phases/index.md`；`core/task-close.mjs`、`tools/cli/task-close.mjs`、`tools/cli/stage-runtime.mjs`（只改 confirm 分支）、`skills/stage-closeout/SKILL.md`、`skills/catalog.yaml`、`docs/delivery-closeout-charter.md`、`tests/contract/stage-closeout-skill.test.mjs`、`tests/contract/stage-closeout-step-contract.test.mjs`、`tests/contract/delivery-closeout-charter-contract.test.mjs`
- **禁止改动**：`runtime/review/**`、`runtime/task/portable-workflow-run.mjs`、`skills/answer-as-page/**`、`specs/archive/**`；本卡不新增 close plan 字段，不改迷你收口模式（归 P4）。

### 任务顺序

T003 先交确认 stage 与 close-plan 路由；T004 再交 stage-closeout 调用者、目录数据与三份契约测试的 TCR。T004 依赖 T003 的确认 stage 行为。

### T003 — 确认 stage 按任务实际阶段推导

- **Source / FR / AC**：`R-004`、`D-012` / `FR-CLOSE-001` / `AC-CLOSE-1`；`PRD-N8`、`D-012` / `FR-CLOSE-001` / `AC-CLOSE-2`。四级收口与交付接线归本卡；单阶段收口可用，不伪造 verify-code。
- **Inputs**：PFACT-004 的当前行（`core/task-close.mjs:402,413`、`tools/cli/stage-runtime.mjs:1344`）；PFACT-012 的冻结断言；P2 交回的审查记录（收口材料可读）；任务阶段事实由 `runtime/task/task-store.mjs` 读写。
- **Files / symbols**：`tests/close/close-contract.test.mjs`；`tests/close/cleanup-resume-finalize.test.mjs`；`tests/contract/close-remote-branch-cleanup.test.mjs`；`tests/contract/card05-close-cli-mechanism.test.mjs`；`tests/contract/card05-planning-gap-behavior.test.mjs`；`tests/contract/close-sidecar-and-archive.test.mjs`；`tests/integration/vnext-delivery-close.test.mjs`；`specs/n8-four-level-route-20261019/spec.md`；`specs/n8-four-level-route-20261019/phases/P3-单阶段收口与PR正文.md`；`specs/n8-four-level-route-20261019/phases/index.md`；七测试仅 fixture 阶段事实；三 Markdown 仅范围/原件事实；`core/task-close.mjs`（symbol：`confirmClosePlan`、`acceptedConfirmation`、新纯函数 `closeConfirmationStage`）；`tools/cli/task-close.mjs`（symbol：CLI 参数传递）；`tools/cli/stage-runtime.mjs`（symbol：confirm 分支）；`tests/contract/light-close-confirm.test.mjs`（新测试）
- **Action**：①写 `closeConfirmationStage(taskDir)`：读任务事实行，按 `verify-code` → `build-prd` → `make-decision` 的顺序返回实际阶段；三者都没有时抛明确错误。`build-prd` 是既有收口调用者（PFACT-005），不得因新增轻档把它挤掉；既有以 `verify-code` 记录的 build-prd 确认原件只读保留，新记录按实际阶段写。②`confirmClosePlan` 用该函数记录 confirmation 的 stage；`acceptedConfirmation` 用同一函数校验 `value.stage`，不匹配时报 `CONFIRMATION_REJECTED`。③`stage-runtime` 的 confirm 分支把 close-plan 特判从 `--stage=verify-code` 放宽为 `verify-code` 与 `make-decision` 两者，仍只对 close 目录内的 plan 路径生效；实际 stage 由 `confirmClosePlan` 推导，不信任调用方传入值。④写新测试：轻任务夹具（只有 make-decision 阶段行）走 `confirmClosePlan` 后记录 stage 为 `make-decision` 且 `acceptedConfirmation` 接受；复杂任务夹具（有 verify-code 行）记录 `verify-code`；规划任务夹具（只有 build-prd 行）记录 `build-prd`；把 `verify-code` 记录挂到轻任务 plan 时被拒。⑤断言 `buildDefaultPrDescription` 读的是 spec 正文（既有行为），不新增字段。⑥兼容既有 build-prd 确认原件：任务有 `build-prd` 行且无 `verify-code` 行时，`acceptedConfirmation` 同时接受旧代码以 `verify-code` 记录的确认（历史原件只读、不改写），新记录仍按 `build-prd` 写；测试覆盖这条只读兼容。
- **Outputs / failure**：两条任务路径各自的确认记录 stage 正确；stage 不符时拒绝并保留 plan 显示；无阶段行时报明确错误。
- **Boundary / DO NOT TOUCH**：不改 close plan 的 JSON 字段与校验、不改显示内容、不改提交/推送/归档动作；不新增持久状态。
- **Dependency**：`P2`；无本 Phase 内更早 Task。
- **Test tier / skill**：contract / backend-testing；面为确认记录与校验、CLI 路由；浏览器面不适用。
- **Scenario / fixture or service**：正例为轻任务与复杂任务各一条 close plan；反例为 stage 交叉、无阶段行；夹具沿用 `tests/close` 的临时任务与临时 Git 仓库写法，结束清理。
- **RED/GREEN gate_cmd**：`node node_modules/vitest/vitest.mjs run tests/contract/light-close-confirm.test.mjs`
- **expected_exit**：RED nonzero; GREEN 0
- **RED target failure**：`ORACLE-LIGHT-CLOSE` 断言轻任务确认记录 stage 为 `make-decision`；当前实现写死 `verify-code`，目标断言失败。
- **RED evidence**：`quality/tests/2026-10-20-030-p3-independent-red.output`（真实四文件批次 exit 1；目标断言失败与夹具错误按 `quality/evidence/2026-10-20-077-p3-red-diagnosis.json` 区分，夹具错误不当接线 RED）。
- **GREEN oracle**：ORACLE-LIGHT-CLOSE 同命令退出 0；两条路径 stage 正确、交叉被拒、PR 正文读 spec。
- **Evidence**：`quality/tests/2026-10-20-031-p3-independent-red.output` 与 `quality/tests/2026-10-20-030-p3-independent-red.output`。
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
- **RED evidence**：`quality/tests/2026-10-20-030-p3-independent-red.output`（同一真实四文件批次中的冻结集合失败；同名 `.json` 为原始回执）。
- **GREEN oracle**：ORACLE-LIGHT-CLOSE 同命令退出 0；三份契约测试与 catalog 一致；TCR 记录含旧/新断言、理由与独立审查引用。
- **Evidence**：`quality/tests/2026-10-20-031-p3-independent-red.output`、`quality/tests/2026-10-20-030-p3-independent-red.output`、TCR 审查原件路径。
- **Coverage limit**：不证明真实收口动作在业务仓执行成功；不证明经验写入的业务仓路径可用；不覆盖 P7 的四路验收。
- **STOP / recovery**：契约测试与 catalog 不一致、或 TCR 缺独立审查时停；回本卡实施者补齐，不直接改断言值而无记录。
- **测试变更请求**：有 — 理由：让 stage-closeout 接受定方向调用者（D-012/E 模块取舍）；旧断言：`used_by_stages` 等于 `['build-prd','verify-code']`（三份契约测试同义）；新断言：精确阶段集合为 `[build-prd, verify-code, make-decision]`；charter 明确排除 `build-plan`、`build-code`；此前 RED 证据：`quality/tests/2026-10-20-030-p3-independent-red.output`；独立审查引用：`quality/evidence/2026-10-20-031-p3-tcr-independent-review.md`（SHA256 `b517a23b00134d01518d7991b7ad3d16f093b8019814cce6aa01768d51d66338`）；旧三份断言字节保留于 `071-p3-before-stage-closeout-skill.txt`、`072-p3-before-stage-closeout-step-contract.txt`、`073-p3-before-delivery-closeout-charter-cont.txt`（均在 quality/evidence）。
- **Done**：AC-CLOSE-2、AC-CLOSE-3 中与本 Task 相关的条件核完；RED/GREEN 同 oracle；TCR 记录与审查原件可读；独立审查与未覆盖项写明。

### 测试策略

| 目标 | Task | 角色 | gate_cmd / 预期退出码 | 判据 / 证据路径 |
| --- | --- | --- | --- | --- |
| 轻任务确认 stage 按实际阶段 | T003 | RED | `node node_modules/vitest/vitest.mjs run tests/contract/light-close-confirm.test.mjs` / 1 | ORACLE-LIGHT-CLOSE / `quality/tests/2026-10-20-030-p3-independent-red.output` |
| 轻任务确认 stage 按实际阶段 | T003 | GREEN | `node node_modules/vitest/vitest.mjs run tests/contract/light-close-confirm.test.mjs` / 0 | ORACLE-LIGHT-CLOSE / `quality/tests/2026-10-20-031-p3-independent-red.output` |
| stage-closeout 接受定方向调用者 | T004 | RED | `node node_modules/vitest/vitest.mjs run tests/contract/stage-closeout-skill.test.mjs` / 1 | ORACLE-LIGHT-CLOSE / `quality/tests/2026-10-20-030-p3-independent-red.output` |
| stage-closeout 接受定方向调用者 | T004 | GREEN | `node node_modules/vitest/vitest.mjs run tests/contract/light-close-confirm.test.mjs tests/contract/stage-closeout-skill.test.mjs tests/contract/stage-closeout-step-contract.test.mjs tests/contract/delivery-closeout-charter-contract.test.mjs` / 0 | ORACLE-LIGHT-CLOSE / `quality/tests/2026-10-20-031-p3-independent-red.output` |

实际执行说明：表中 T003/T004 窄命令仍是原定目标；030 与031实际 argv 均为契约头四文件聚合命令，按同批次承接各目标，未声称窄命令曾单独执行。030 exit 1 含真实目标/冻结集合失败及两条 runtime 夹具错误，后者不是接线 RED；分界见077原件。031文件名虽含 red，真实回执 exit 0、47 passed，保留原名。

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

### 本次执行事实（2026-10-20，等待独立质量审查）

- TCR 先于冻结断言变更：`quality/evidence/2026-10-20-031-p3-tcr-independent-review.md`。三份旧字节见上述 071–073 原件；实际旧实现与新三阶段断言的目标 RED 是 `quality/tests/2026-10-20-030-p3-independent-red.output`（同名 `.json` 原始回执，exit 1）。旧 `003-p3-red.output`、`003-p3-tcr-red.output`、`003-p3-light-close.output` 仅为原计划名，未生成这些文件；本卡契约头、Task 与测试表已改指实际 030/031 原件，不复制现有输出补旧名或改写 raw。029 早轮夹具错误保留但不当目标 RED；030 两条 runtime 夹具路径错误不当接线目标 RED。
- 范围窄补：七个既有直接确认消费者的测试夹具原来没有阶段事实；新合同要求无阶段报错，不能由生产默认 verify-code 保旧夹具通过。主会话已明确允许仅补其原场景本应存在的 verify-code stage 行，原断言不变；具体七路径与调用依据见 `quality/evidence/2026-10-20-076-p3-adjacent-fixture-scope.json`。先保存新实现下真实失败，再补夹具与复验。生产写集未扩大。
- 新实现只推导 `record_kind=stage` 的三阶段事实；旧规划确认以原文件只读接受，所有 plan/hash/remote/reply/path 保护保留。规划 consumer 使用 `tools/cli/task-close.mjs confirm`；stage-runtime 只接本卡两个阶段，普通非 close 确认沿既有分支。
- `tools/cli/task-close.mjs` 现有参数已经直传唯一 close owner，不需要改动；`buildDefaultPrDescription` 已读 spec，本次仅用真实 prepare 输出验证，不重复实现。
- 浏览器面 N/A：写集无浏览器可见界面。真实远程 push/PR/归档清理及业务仓 Improvements 落盘未在本卡执行，分别等待 P7/真实收口具名 owner；本卡文档与本地夹具测试不代其通过。

### 本 Phase 自带判据小结（review-ready 前记录）

- 主门已由独立测试执行者实际提交 `verify --action=execute`，卡 gate_cmd 四文件 47/47、exit 0；原件 `quality/tests/2026-10-20-031-p3-independent-red.output` 与同名 `.json`。文件 slug 沿首轮命名为 red，真实执行事实是 GREEN，不改名复制。包含真实 close prepare/confirm/authorize、两阶段 runtime 路由、规划 task-close 入口、PR 正文、旧规划兼容及其保护反例。
- AC-CLOSE-1：`incomplete` — 收口方法已区分先反思后物理，四级调用由轻档/复杂/规划 stage 入口承接；独立人读判定待主会话本 Phase 审查，证据为当前 `skills/stage-closeout/SKILL.md` 与上述主门。
- AC-CLOSE-2：`pass`（仅本卡实现与独立执行判据）— 上述主门与 031 TCR；不冒正式代码质量结论，正式 OCR/Standards/Spec 仍由主会话执行。
- AC-CLOSE-3：`incomplete` — 本卡已把四级每次业务仓 Improvements、无发现具名依据及越界不可用接到收口正文；真实业务仓落盘由 P7/实际收口 owner 执行，尚无该事实，不以文本测试替代。
- AC-ENTRY-4：`incomplete`（本卡收口读取点）— 正文已有「级别与路线」读取与缺失按复杂、记缺口；实际四路消费与独立读者结论待 P7，不签全 AC。

- 邻接原失败：`quality/tests/2026-10-20-032-p3-adjacent-fixture.output` / 同名 `.json`，exit 1，七文件 29 fail / 22 pass / 3 skip；具名失败是确认夹具没有实际 stage fact。只补七处 fixture 的 verify-code 行，所有原断言原样保留。CLI 边界补充 `quality/tests/2026-10-20-033-p3-route-boundary.output` / 同名 `.json`，exit 0，新增 owned relative 与多 ref 两例通过；其余 34 新例在该次按具名过滤未运行，不把 skip 当失败或新覆盖。主门 47 例与该次 2 例分别报告，不冒一次执行。

- 邻接修复后同命令 GREEN：`quality/tests/2026-10-20-034-p3-adjacent-fixture.output` / 同名 `.json`，exit 0，七文件 51 passed / 3 skipped。3 skipped 是既有 `realPrReadback` 条件未提供时的真实 GitHub URL/cutoff/resume/可见性测试，未冒通过；本地真实 Git/bare remote 的授权、取消、重放、归档与清理夹具检查通过，不代真实业务仓验收。
- 本次测试作者仅新增 `tests/contract/light-close-confirm.test.mjs` 36 例；七处邻接夹具由本卡 writer 补阶段事实，原断言未改。执行者收尾已核 `n8-light-close-*` 临时目录为空，并删除本次三个执行输入文件；未复用浏览器登录态，浏览器 N/A。正式 OCR 与 Standards/Spec 尚未启动，review-ready 交主会话，未 commit。

- 审查投影范围补齐：实跑前合同 079 虽 ok=true，但 P3 phase_rows.write_set 仅原十路径，漏掉七邻接夹具及本次材料；scope capture/phase projection 都消费该列表，故按已授权纯测试范围同步本卡头、T003 Files、文件边界、spec 全局边界与 index。允许集中的 `tools/cli/task-close.mjs` 是既有未改消费者，不计实际 diff。

### 本 Phase 审查与修复读回（2026-10-20）

- 正式 OCR 原件 `quality/reviews/2026-10-20-027-build-code-phase-p3.json`；终态读回 `quality/evidence/2026-10-20-087-p3-ocr-terminal-readback.md`。Kimi completed/ok 一条 minor（反序测试覆盖），Codex completed/ok 零 finding；Antigravity failed/parse null packet guard，raw025 无可救回 JSON，保留 available-with-failures 与覆盖未定，不冒三路通过。Standards `085-p3-standards-review.md`、Spec `086-p3-spec-review.md`（均 quality/evidence）并列空 finding，标 same_source_degraded，不替代 OCR。
- 唯一有效 finding 已保完整原文与 fixed 处置：`quality/evidence/2026-10-20-089-p3-review-findings-fixed.json`。只追加两项低优先阶段行在前的参数，原断言不动；当前生产已符合固定优先级，这是纯覆盖补充，不伪造实现 RED。独立具名复验 `quality/tests/2026-10-20-035-p3-reverse-order-coverage.output` 与同名 `.json`，exit 0，7 passed /31 skipped；未重复主门、邻接或 OCR。
- AC-CLOSE-1：`pass`（本卡步骤/顺序与调用者人读判据）— 正式027与同源Spec086结合收口正文；反思/物理分开并具名四级入口，不代真实物理交付完成。
- AC-CLOSE-2：`pass`（本卡确认/PR正文/TCR与独立执行判据）— 主门031、边界033、反序035、TCR031与正式027/处置089；provider失败与其覆盖限制保留，非总体质量全通过。
- AC-CLOSE-3：`incomplete` — 本卡正文接线已交；真实业务仓 Improvements、无发现具名依据/越界记录仍由 P7/实际收口 owner 留证，本轮用户只执行 build-code，不进入 verify-code，保验收缺口。
- AC-ENTRY-4：`incomplete`（全AC）— 本卡收口读取点与缺失按复杂已交；四处完整消费及实际四路判定留给相应承接 Phase/P7，不在此补签。
- 整个 build-code 仍 in-progress；本卡审后提交不进入 verify-code、不执行真实远程发布或最终 close。原 029–034 执行/失败及上游 P1/P2 证据、游标保留。

# Phase P5 — 派发前拦截客观开工错误

主会话在派发开发前执行一条现有检查。
可重复的错误会停止相关派发，并留下能复读的探针原件。
探针是用真实只读操作核对具体条件的短命令。

## 哪些节必须写，哪些可以省？

本段给出可独立交付、观察、回退的单个结果。

| 段落 | 状态 | 本段用法 |
| --- | --- | --- |
| 交付、依据、开工材料 | written | 定位可观察结果、来源及上游输入。 |
| 验收、写集、验证 | written | 找判据、实际写主和反例。 |
| 消费者、任务与机器字段 | written | 交已知输入及执行边界。 |
| 末验收 | not-applicable | 完整验收归第 10 段。 |

## 这一 Phase 交出什么？

开发只有在当前材料和客观条件通过后才收到任务。
执行环境、依赖、数据、权限、表结构、外部服务、回退缺口都能从五列找到。
五列为命令、期望、证据、机器或人判、负责人。

第 4 段先交隔离测试数据、版本、可复跑命令及清理证明。
复用 `tests/fixtures/execution-quality/prepare-test-data.mjs` 的实际回执。
确认该段已交回 `workflows/build-plan/SKILL.md` 后，才改其开工交接。
第 6 段接本段派发方法与错误原件，接着处理实施期失败。
跨项目数据迁移、备份保留数和磁盘水位由原跨项目任务负责。
当前 `run --action=execute` 仍只承担已有游标与终末引用职责，首步只加一次就绪调用。
**配套与影响**：配套调整＝`skills/spec-plan/templates/phase-template.md` 的就绪表、`workflows/build-code/SKILL.md` 派发前步骤、`tools/cli/stage-runtime.mjs` 首步调用；配套迁移＝旧任务补就绪表、旧「第 0 阶段」建议删去；配套移除＝「第 0 阶段」建议与 `run-checks` 加首步调用的双调用；影响范围＝build-code 第一步、P4 数据探测、主管道既有游标职责。

## 这一 Phase 怎么验收？

- 防再发（build-plan 审查后）：gate_cmd 裸变量、写集派生件、AC 与写集范围、需求对账四项粗查；缺项具名，不假过。

### 验收 1：客观检查能在开工时实跑吗？

独立测试者从同一合法阶段卡造两份只有探针条件不同的 S 级隔离输入。
S 指按真实协议造的最小可重复数据。
先预查成功输入，证明任务认证、Node、脚本和材料都可用。
再撤掉临时只读能力标记，使探针实际退出非零并给具名错误。
同一命令还测删探针及改一字节导致旧材料指纹失效。
指纹是对指定字节计算的哈希，只有原材料可回读才比较。
通过要求正常输入实际执行，记录可定位阶段、材料、探针、状态、执行者和时点。
合法表却探不到权限、缺探针或沿用旧结果须显示具体失败。
缺可读原件不能当通过；适用的人判只记未核实与提供者。

### 验收 2：红色条件下派发入口非零拒绝，且工作树与事实无变化吗？

独立读者在同一派发入口按验收 1 的失败输入观察一次。
开工前后用同一基准记录 `git diff --name-only` 的文件集合与逐文件字节，并记 `facts.jsonl` 的当前行数。
红色下派发入口退出非零并给出具名拒绝理由；拒绝后声明写集的字节与开工前相同。
`facts.jsonl` 不新增派发行，原有行保持原字节。
坏对照有两件：把非零拒绝改成警告后继续派发，以及删掉探针后入口仍返回 0。
通过要求三件事同时成立：派发入口非零拒绝、前后 diff 字节相同、facts 无新派发行。
正例恢复临时标记并重走入口，交给受控开发角色并新增一行真实派发记录。
拒绝理由缺 owner，或只写日志而不返回非零，都不算通过。
派发回执不可读时只保留该缺口，不用脚本结论代替派发行为。

两验收共用第 4 段提供的数据协议与只读服务替身。
机器面和宿主读回分别判，按「怎么验证」运行同一入口。
UI 不适用。写集仅开工文档、CLI、运行时材料检查和配套测试。

| 验收 | 成本类别 | 活动分钟 | 上限与来源 | 重试 | 资源提供者 | 首判与末验 |
| --- | --- | ---: | --- | --- | --- | --- |
| 1 | 命令级 | 9 | 18 分钟，待校准 | 修客观原因后一次 | 第 4 段数据负责人与计划负责人 | P5 独立测试；末段读原件 |
| 2 | 独立读回级 | 12 | 24 分钟，待校准 | 受影响路径一次 | 主会话提供宿主记录、独立审查者读文件 | 实际派发边界首判；末段复核 |

总账 9 + 12 + 合用准备 5 + 受影响复验 6 = 32 活动分钟。
各项为人工估算，来源是已读测试蓝图的最小正反例及共同准备。
`phase_budget={soft_min:45,hard_min:80,variance_threshold:1.5,source:provisional}`。
`execution_budget={window_minutes:70,command_cap:12,wait_cap:unknown,retry_reserve:6}`。
分钟和命令数来自本页拟定流程，待首次现场冷运行校准。
用户等候目前无事项；审查等候由独立执行者完成触发。
宿主记录等待由主会话提供真实派发回执后结束，均另记实际时间。

## 为什么现在做，依据是什么？

过去到了写代码才发现权限和数据不可用。
决策日志第四包与本轮开工澄清保一个现有检查入口和真实的只读探测。
设备、依赖、路径、权限结果、版本等可重复判断的错误停止相关派发。
代表性、权限是否足够以及回退是否真能恢复，由具名人读。

## 开始前读什么？

先读任务库 `quality/evidence/build-plan/2026-11-19-003-clarify-readiness-answer.md`。
再读已确认大纲第 5 段，以及第 4 段交来的当前版本、命令和清理原件。
读 `tools/cli/run-checks.mjs:45` 与 `runtime/stage/stage-content-contracts.mjs:671`。
前者消费材料，后者共享规格与阶段检查。
再读 `tools/cli/stage-runtime.mjs:17,589,638` 的调用点与 run/execute 入口，首步就绪调用接在这里。
实际候选入口在 `workflows/build-code/SKILL.md` 派发前的步骤 1。
读 `runtime/task/task-handle.mjs` 的 `openTask` 与 `captureCommand`。
依 `specs/backend/architecture.md`、`specs/api/contract.md` 和
`specs/acceptance/acceptance.md` 核认证身份、错误与独立验收原件。

## 每个文件由谁改，先做什么？

本段开发是唯一写主。先在现材料契约核对应阶段的五列与持有者。
登记新增定向测试的 owner、唯一入口及替代/删除条件。
第 4 段先交回职责登记，第 8 段随后按依赖边接手。
在既有检查器的私有 CLI 内加当前任务读取方式，不新增公开行为。
保留现用法。当前模式用绝对任务根和当前阶段选同一份材料。
核当前工作树、阶段、版本、允许的探针及是否具备只读范围。
专用 Phase 模式沿既有私有 CLI，保不带 Phase 时的报告原合同。
`node tools/cli/run-checks.mjs --task-path "$WH_TASK" --phase "$WH_PHASE"`
这是计划接线；当前 CLI 尚未接 --phase，本段案例验证旧调用仍按原行为。
载入可认证数据准备回执；确认它和当前材料对应。
凭任务身份运行项目已核的具名只读 argv，不解释不可信材料为 shell。
人判行原样输出负责人和恢复条件，未核实不自动停派发。

在 `workflows/build-code/SKILL.md` 的派发前步骤落实际入口。
阶段主会话消费真实退出、输入范围和原始回执，失败即停相关派发。
探针回执用已有 `captureCommand` 每次新留，保 argv、cwd、退出与失败输出。
仅在现 stage row 的事实引用连回该原件，保已存在游标及其他内容。
无可靠引用或落账回读失败不能发出客观通过。
没有程序可验的探针时不自行扩权，具名交原负责人。

| 精确路径 | 本段落点或实际消费 |
| --- | --- |
| `runtime/stage/stage-content-contracts.mjs` | 当前 Phase/材料检查，复用 `validatePostPhaseContract`；形状与只读执行分属原 owner |
| `tools/cli/stage-runtime.mjs` | run/execute 首步调用同一 `validatePostPhaseContract`；只加这一次调用，不改 execute 既有语义、返回值与游标写入。P9 后接同一入口的捕获接线 |
| `tools/cli/run-checks.mjs` | 现参数处理与检查入口；读取五列、同一任务捕获、打印失败和原件 |
| `workflows/build-code/SKILL.md` | 派发前实际消费退出、允许继续范围和回执；第 6 段随后补实施期分诊 |
| `workflows/build-plan/SKILL.md` | 第 4 段交回后只补读取五列和向实施者交付的时点 |
| `skills/spec-plan/SKILL.md` | 全局与增量的开工设计各归原规格或 Phase |
| `skills/spec-plan/templates/phase-template.md` | 写入五列模板；第 6 段在本段交回后补分诊承接 |
| `docs/architecture/move-map.json` | 第 4 段交回后登记定向测试。开工检查 owner 维护，P5 独立门禁消费；同等见证接管后退役 |
| `tests/contract/build-code-readiness.test.mjs`、`tests/contract/stage-runtime-reflect-entry.test.mjs` | 新增独立断言，跑 CLI 并拒绝环境失败冒目标红 |

## 怎么验证？

本阶段命令待独立测试作者在实施前按卡建立，当前未运行。
机器项的执行入口是 `tools/cli/stage-runtime.mjs` 的 run/execute 首步：它在派发前调用 `validatePostPhaseContract`。
材料侧由 `node tools/cli/run-checks.mjs --material-root <任务材料绝对路径> --stage=build-plan` 调用同一函数，前移不新增命令。
首步只加调用，不改 execute 既有语义；两处结果都落同一条 facts 阶段行。
先核 `git rev-parse --show-toplevel` 与进程 cwd 一致且为认证任务工作树。
核该树的 `package-lock.json` 可读，并实查本地 Vitest 文件与版本。
实施测试负责人复用 `P1-skill-loading.md#怎么验证` 的锁定依赖准备与回执。
只在当前授权范围内按该锁文件准备，留实际命令及失败或成功原件。
运行器、锁文件、工作树或测试收集缺失是装置失败，不能记为目标红。
恢复装置后由同一独立测试负责人重走定向命令。
同一条命令跑合法、权限标记缺失、缺探针、材料更新及正常恢复。
只用第 4 段租用的可再生隔离样本和受控只读标记，不接产品库。
复用 `createTrackedTempDir` 让同一进程建、用、正常回收。
运行原始回执放任务证据区；不和临时夹具一起回收。
目标红须确实跑到旧入口并命中具名断言。
未安装依赖、认证失败和解析失败另记，旧行为已满足则保真实结果。
独立读者执行验收 2 的步骤，并在同一记录标运行范围与未覆盖项。

## 下一消费者拿什么继续？

主会话把真实检查与派发接线交给第 6 段。
给末验收交两条原判据、stdout、具名探测回执、配对写集读回和缺口。
配置或权属有错，由该输入负责人修复，再重走同一入口。
范围外的跨项目真实验证保未确认，不使用受控权限拒绝冒真实证据。

## 每张任务卡怎么写？

### 任务 5：让开工检查执行并约束派发

为什么做：合法表格可能掩盖真实权限错误，开发前应确证。
交付什么：真实探针、原件和派发前决定可从同一个入口回读。
不做什么：已有执行游标职责与真实产品数据库保持原状。
前置：读取第四段的数据合同、原件、共享文件交回及本轮开工答复。
怎么做：先接共享材料验证与检查入口，再改派发步骤实际消费。
怎么验收：同一目标测试核正反输入，独立读者核真实派发与写集。
证据：留命令退出、探针原件、指纹和派发回执，声明真实宿主范围。
下游（含何时停）：失败停相关派发，交原 owner，修复后重走。

<!-- markdownlint-disable-next-line MD036 -->
**校验器用，人可跳过**

- **任务编号**：T005
- **来源 / FR / AC**：R-002、R-003、R-012；需求 2、5；决策日志第四包、D-005；FR-WH-004、
  AC-P4-001、AC-P4-002。以本轮两条开工澄清覆盖旧 execute 写法。
- **输入**：P4/T004 的隔离数据、版本与回执；合法 Phase 与当前索引；
  当前任务身份；计划 owner 在派发前提供已认证的只读探针。
- **文件 / 符号**：`tools/cli/run-checks.mjs`、`runtime/stage/stage-content-contracts.mjs`、
  `tools/cli/stage-runtime.mjs`、`workflows/build-code/SKILL.md`、`workflows/build-plan/SKILL.md`、
  `skills/spec-plan/SKILL.md`、`skills/spec-plan/templates/phase-template.md`、
  `docs/architecture/move-map.json`、`tests/contract/build-code-readiness.test.mjs`。
  符号：`parseArguments`、
  `validatePostPhaseContract`、`stage-runtime` run/execute 首步、当前 build-code 方法步骤 1。
- **动作**：从真实材料绑定当前任务与版本，执行允许的只读 argv，
  保原回执并用现有事实指针回读。以真实退出和原件决定是否派发，
  保留人判独立；旧命令调用仍工作。
- **输出 / 失败**：正常结果与具名阶段、材料、探针、状态、执行者及时间可回读；
  缺失、过期、失败有不同原因，相关开发无派发，保旧回执。
- **边界 / 禁止改动**：不改 `tools/cli/stage-runtime.mjs` execute 分支的既有语义、返回值与游标写入，只在 run/execute 首步加一次就绪调用；
  生产数据、用户真实环境、其它阶段和 AC 正文不动。P6 后写本段已交回的方法和模板。
- **依赖**：T004
- **测试层级 / 技能**：`feature`。S 级命令集成与真实派发独立回读；主技能 backend-testing。
  本任务无浏览器或全量数据面。
- **场景 / 夹具或服务**：正常形状，合法表加权限拒绝，缺探针，旧材料失效，
  恢复后同入口可派；以共享临时 owner 回收，保失败回执。
- **预写测试**：独立作者先写 `tests/contract/build-code-readiness.test.mjs`；
  版本冻结后方可交开发，目标 RED 未运行。
- **可观察接缝**：实际 argv、原回执、宿主派发事件与实际写集。
- **测试变更请求**：无；有变更沿既有独立裁决，保原字节与原件。
- **RED/GREEN 门禁命令**：`node node_modules/vitest/vitest.mjs run tests/contract/build-code-readiness.test.mjs`
- **预期退出码**：RED nonzero; GREEN 0。两次均待执行。
  先回读 P1 锁定依赖准备、认证 cwd 和本地运行器；装置失败不计入 RED。
- **RED 目标失败**：ORACLE-PHASE-READINESS；合法表配失败探针时，
  当前入口不能交可回读的真实拒绝/回执，须命中同名断言；环境失败另记。
- **GREEN 判定器**：ORACLE-PHASE-READINESS 通过须真跑只读探针、保出口原件。
  失败无相关派发与写集字节改动，恢复后同入口回到可派发。
- **证据**：计划原件 `quality/tests/p5-readiness.output`，
  及 `quality/evidence/p5-readiness-observation.md`；真实 append 返回替换计划指针。
- **覆盖上限**：S 级只证应报的拒绝及实际本地入口，
  未覆盖真实外部服务、真实权限和数据代表性。
- **停止 / 恢复**：身份、材料版本、只读性、回执或范围无法核时停相关派发；
  回数据/材料或执行入口原 owner 修复后独立重验。
- **完成**：前置（不作完成条件）：同一命令实际跑并保原件。
  完成条件（只写效果）：适用机器项可回读且反例非零拒绝，
  独立读者回核前后 diff 字节相同、facts 无新派发行，并保正常恢复证据。
  AC-P4-001、AC-P4-002 目前 incomplete，尚未实施和独立判定。

## 机器字段（校验器用，人可跳过）

- **全局规格**：`spec.md#实现设计全局权威`
- **Write set**：`runtime/stage/stage-content-contracts.mjs`、`tools/cli/run-checks.mjs`、
  `tools/cli/stage-runtime.mjs`、`workflows/build-code/SKILL.md`、`workflows/build-plan/SKILL.md`、
  `skills/spec-plan/SKILL.md`、`skills/spec-plan/templates/phase-template.md`、
  `docs/architecture/move-map.json`、`tests/contract/build-code-readiness.test.mjs`、
  `tests/contract/stage-runtime-reflect-entry.test.mjs`
- **Dependency**：P4
- **消费者**：build-code 派发主会话、P6 修复分诊与末段验收者
- **gate_cmd**：`node node_modules/vitest/vitest.mjs run tests/contract/build-code-readiness.test.mjs`
- **oracle**：ORACLE-PHASE-READINESS
- **evidence_path**： planned: `quality/evidence/p5-readiness-observation.md`
- **STOP**：客观错误或原件不可回读时停相关派发，交原输入负责人，修后独立复验。
- **覆盖 AC**：AC-P4-001、AC-P4-002
- **Done**：前置（不作完成条件）：结构、命令和退出原件。
  完成条件（只写效果）：AC-P4-001 命令级、AC-P4-002 独立读回级，
  均 incomplete。真实探针、非零拒绝、前后 diff 字节相同、facts 无新派发行及正常恢复回读齐后，由原独立读者分别判。

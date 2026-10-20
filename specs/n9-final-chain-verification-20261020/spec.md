# 功能规格：让最终十环执行可逐环核实

读者：计划确认者、八个 Phase 的实施者、独立审查者与 verify-code 验收者。读完要能定位原始需求、十环判据、允许改动与唯一验收条款。

- **功能名**：最终十环执行核对（含审查健康检测与 N6 页面十环派生）。
- **来源**：本目录 `decision-log.md` 的 D-006–D-012、R-001–R-010、U-001–U-010，含U-009合入核设计与U-010补E4继续授权；当前完整计划确认独立引用外置 `quality/evidence/2026-10-20-082-final-build-plan-user-confirmation.md`，不追溯改写此前答复；父 PRD `specs/archive/skills-framework-redesign-20261014/prd.md` 的 N9 卡与 AC-T4-1…6、AC-011；外部方法原件见 `## 补充材料`。
- **状态**：当前8Phase/14Task/13FR/17AC完整设计已按082真实确认，082 当时授权仅完成设计与build-plan阶段交接；现 U-012 / D-013 已授权进入 build-code 并明确修改 N9 依赖。E4设计已补，080完整分析与081定向处置原件记录当前核对/修复范围；异源质量结论仍未取得，不冒质量通过。此确认不接受N8欠账/G1豁免，082 不授权进入build-code，当前实施授权沿 D-013；本文不证明实现、测试、页面或验收完成。
- **认证工作区**：`/Users/Hugh/Hugh/Project/workflowhub-n9-final-chain-verification-20261020`；分支 `task/workflowhub/n9-final-chain-verification-20261020`；创建与历史测量基线 `91ac87877f3cb936c11b311f2e15427801beb731`。N8 已快进合入，当前集成 HEAD 为 `1d24f938310e4fbe6b5ad13e3b419b39bc2a83d1`，真实读回见 `quality/evidence/2026-10-20-037-n8-into-n9-merge-readback.json`；合入不等于 N8 完整验收通过。
- **外置任务基准**：`/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/n9-final-chain-verification-20261020`。下文 `quality/` 引用相对该基准，不相对工作树。

## 材料导航

本导航可再生，只帮助定位。目标与取舍读 `decision-log.md#工作包与决定`；本规格的场景、事实与功能要求给行为解释；`Appendix A` 独占验收条件；实现设计给全局接口与写集；`phases/index.md` 只导航，具体动作、命令与停止条件读各独立 Phase。运行结果读外置 task facts 与质量原件，材料正文不存执行进度。

- 十环是什么：§3 场景与 §7 关键实体；级别适用性表：§7.1。
- 五态与分母：§5 FR-CHAIN-002/003 与 §7.2。
- 报告字段与写入者：§7.3、§8 与实现设计「接口与失败语义」。
- 审查健康与 `antigravity`：§5 FR-CHAIN-007/008。
- 页面与 N6 旧账：§5 FR-CHAIN-009/010/011。
- 父 AC 承接与差异：§「来源与决策映射」与 `Appendix A` 的「父 AC 承接」段。

## P0 在场

| 必留内容（P0） | 落点 | 状态 |
| --- | --- | --- |
| 目标与场景 | §1、§2、§3 | written |
| 全局实现设计与边界 | 实现设计（全局权威）、§10 | written |
| 唯一验收正文 | `Appendix A` | written |
| 测试面与验收对象 | 测试标准、验收对象 | written；QA配置/两尺寸已定义，服务与浏览器execution=not_run，非已观察效果 |
| 关键依赖、风险与来源 | 来源与决策映射、实现设计·全局文件边界与依赖、§12 | written |

P1 只展开真实触发项：跨模块接口（十环报告字段与页面的数据契约）、数据迁移（不适用）、UI（页面模板，见测试标准与验收对象）、部署约束（不适用）。P2 无额外补充材料读者。

## 速读卡（30 秒）

- **一句话需求**：给一个有认证的任务，逐环读出十环里哪些真的发生了、哪些缺失或取不到、哪些本来就不该发生，并能复算完成率。
- **核心改动点**：
  - 新增十环声明与逐环判据模块，按任务级别裁剪，结论只用现有五态。
  - 复用现有便携工作流核对内核，接入 `run-checks` 的只读报告出口，报告由调用者保存到任务库。
  - 修审查侧「重复被拒仍算进展」与整组不返回；对齐 `antigravity` 真实读取 payload。
  - N6 页面由七环改十环，补 spec/审查/PR 三类节点与 provenance；N6 13 项旧账逐项收口。
- **最大影响面**：`run-checks` 无参数行为、build-prd 便携工作流默认行为、N6 已验收页面结构、review provider 健康判定。
- **验收信号**：一条只读命令在真实任务上产出逐环结论且不阻断；七类受控负例各自报出预期结论；三个真实任务的结论与独立人工读回一致。

## 来源与决策映射

| 来源 ID | 决定 ID | FR / AC | 状态 / 受影响范围 | 未决 / 交接 |
| --- | --- | --- | --- | --- |
| R-001 | D-003、D-006 | FR-CHAIN-001 / AC-M1-1 | current；十环结果与消费方 | 无 |
| R-002 | D-006、D-007 | FR-CHAIN-001、FR-CHAIN-002 / AC-M1-1、AC-M2-1 | current；十环逐环枚举与判据 | 无 |
| R-003 | D-008 | FR-CHAIN-004、FR-CHAIN-005 / AC-M3-1、AC-M3-2 | current；复用核对内核 | 内核复用范围见实现设计 |
| R-004 | D-006、D-007 | FR-CHAIN-001、FR-CHAIN-002 / AC-M1-1、AC-M2-1 | current；只报告、不推断成功 | 无 |
| R-005 | D-004、D-006 | FR-CHAIN-001 / AC-M1-1、AC-M1-2 | current；级别裁剪 | 旧任务无级别节按复杂，见 AC-M1-2 |
| R-006 | D-006、D-007 | FR-CHAIN-002、FR-CHAIN-003 / AC-M2-1、AC-M2-2 | current；证据谓词与分母 | 无 |
| R-007 | D-008 | FR-CHAIN-005 / AC-M3-1 | current；G1 减法 | 基线见 §12 与 `quality/evidence/2026-10-20-027-build-plan-g1-baseline.txt` |
| R-008 | D-003 | FR-CHAIN-001 / AC-M1-3 | current；0 项新增外部采用 | 清单差异见 AC-M1-3 |
| R-009 | D-001 | FR-CHAIN-001 / AC-M1-1 | 历史整卡前置按 D-013 改为消费已交付实现 | OI-006 已按用户选择解决；N8欠账保留 |
| U-001 | D-002 | 全部 FR / 全部 AC | current；不跳阶段、审查只取一次异源建议 | 无 |
| U-002 | D-003 | FR-CHAIN-004 / AC-M3-3 | current；任意已完成任务可核 | 无 |
| U-003 | D-004、D-006 | FR-CHAIN-001 / AC-M1-1、AC-M1-2 | current；按级别裁剪 | 无 |
| U-004 | D-005 | FR-CHAIN-004、FR-CHAIN-009 / AC-M3-4、AC-M6-1 | current；报告通道＋页面派生 | 无 |
| U-005 | D-011、D-012 | FR-CHAIN-009、FR-CHAIN-010、FR-CHAIN-011 / AC-M6-1、AC-M6-2、AC-M6-3 | current；N6 13 项旧账纳入本任务 | 不可逆项记 limitation |
| U-006 | D-010 | FR-CHAIN-007、FR-CHAIN-008 / AC-M5-1、AC-M5-2 | current；审查活锁与健康检测 | 无 |
| U-007 | D-007、D-008 | FR-CHAIN-002 / AC-M2-2 | current；写集以 Phase 契约头为机器来源 | 无 |
| U-008 | D-012 | FR-CHAIN-011 / AC-M6-3 | current；N6 最终验证补记 | 补记标记见 AC-M6-3 |
| U-009 | N8合入后核设计 | FR-CHAIN-001、FR-CHAIN-002、FR-CHAIN-009、FR-CHAIN-010 / AC-M1-1、AC-M2-1、AC-M6-1、AC-M6-2 | current；真实原话沿032唯一原件，037记实际合并/质量限制 | 仅授权合入与设计核对，不代表计划确认或接受N8欠账 |
| R-010、U-010；父PRD E4 / FR-T4-002（:464、530） | 逐step判据/真实consumer有限回填 | FR-CHAIN-012/013、AC-M7-1/2；OPEN-06 / OI-014 | current；P1/T002、P2/T004、P3/T006、P7/T013设计承接，实施未取得 | 051继续授权/061 trigger=false只补原需；不接受N8欠账/G1豁免、不进入code |

父 AC 承接按真实原义重排，不沿用 `decision-log.md:366` 的错配：

| 父条款 | 本规格承接 | 承接方式 |
| --- | --- | --- |
| AC-T4-1 跳步可见（`stage_skip_rate`、`step_attestation_coverage` 可测） | AC-M7-1，十环面另AC-M1-1/AC-M2-1 | 同一报告workflow_metrics核当前步骤/阶段集合；十环metrics单独复算，不等义替代父step指标 |
| AC-T4-2 对账只记事实、不阻断 | AC-M3-2、AC-M1-1 | 缺环时命令仍退出 0，事实逐环可见 |
| AC-T4-3 可判定 step 数上升（父历史2/53） | AC-M7-1/2及OPEN-06 | 从当前选中route取step分母，P1/P2/P3核报告、P7回填consumer；不能用0/10环或历史53/84替代step实际观察 |
| AC-T4-4 净长度不增（`skill_md_bytes`、`unconditional_read_bytes`） | AC-M3-1 | 用本任务实测方法字节基线与必读字节清单对比，替代父指标名 |
| AC-T4-5 前后完成率对比报告（非阻断） | AC-M3-3 | 三个真实任务给出改造前后可核环数对比，独立读者复核 |
| AC-T4-6 十环逐环可核事实与复跑方式 | AC-M1-1、AC-M3-4 | 逐环 basis 含命令＋退出码或原件＋sha256 或带字段记录 |
| AC-011 ①–⑤ | AC-M1-1、AC-M2-1、AC-M3-1、AC-M3-2、AC-M3-3、AC-M3-4 | ①→指标可测；②→十环状态行 10/10 在场；③→不阻断；④→字节不增；⑤→前后对比报告 |

父条款 `AC-012`（`cacheRead`/`wall_s` 不劣化、`steps` 或 `cacheRead` 至少一项下降）属 N1 成本观测面，本卡只记录主会话成本窗口，不作本卡 AC；差异理由与 owner 见 §12 OPEN-03。

## 1. 需求解释：问题与紧迫性

一个任务从原始需求走到提交 PR，今天没有一条能逐环回答「这一步真的发生了吗」的通道。仓库里有若干检查器，但它们不成链：`run-checks` 拒绝任何参数，`check-decision-log-chain` 被叫作真空通过，`validatePostPhaseContract` 不在产物门里。结果是最常见的误判——文件存在被当成完成，缺环不可见，正常工作被当成违规跳步。

用户原始需求第 3 项要的是一条十环链条逐环可核；父 PRD 把这条需求拆给 N9，并要求合法跳过不计违规、只报告不新增门。本任务必须先让「可核」这件事成立，再让页面能把结论读出来。

## 2. 背景、目标与范围

### 背景

- 现有五态词表（`completed` / `skipped` / `not_applicable` / `incomplete` / `unavailable`）已由 `runtime/stage/stage-skill-runtime.mjs:6` 定义并在 stage 结果上使用；本任务复用它，不新增状态。
- 便携工作流核对内核 `runtime/task/portable-workflow-run.mjs` 含 manifest 装载、逐 step 证据核对、结果状态归并三件能力，但写死 `build-prd` 且不导出；默认行为的既有测试是本次不改语义的证据面。
- `tools/cli/run-checks.mjs` 是现有只读检查聚合入口，任何参数都以退出码 1 拒绝（`:166-170`），适合作为十环报告的出口。
- N8 已合入 main 与本工作树：根 `workflows/make-decision/steps.json` 是复杂 15 步，`workflows/make-decision/flows/{small,normal,planning}/steps.json` 分别是 9/11/11 步；级别与适用性不是步骤字段，唯一入口事实读点为决策记录 `## 级别与路线`。小改动/普通在 `make-decision` 内实施与测试，普通整次实现审记录在 `build-code` 审查面，但不产生 `build-code`/`verify-code` 阶段行。
- `quality/evidence/2026-10-20-026-build-plan-n8-inflight-state.md` 保留其在途时点，不作为当前未合入事实。当前生产路径与模板可读；N8 最终交接 `n8-four-level-route-20261019/quality/evidence/handoff/2026-10-20-010-verify-code-handoff.md:47-59` 仍保留 3 条材料/合同 AC pass、28 条 incomplete，合入不自动关闭验收；当前 N9 实施前置按 D-013 的用户明确决定修改，亦不扩大 N9 到 N8 的欠账范围。

### 目标

- 对任意有认证的任务，逐环给出结论与依据，完成率按本级适用环数可复算。
- 缺环、冲突、取不到、合法不适用分别可读；正常工作不被误判为违规。
- 审查侧能区分「正常推进」与「同一动作反复被拒的活锁」；单路卡死不拖死整组。
- N6 页面从报告派生展示十环，页面只读；N6 审计的 13 项旧账逐项落到三态。

### 范围内

- 十环声明、级别适用性、逐环证据谓词与完成率（M1、M2）。
- 复用核对内核、`run-checks` 只读出口与报告字段（M3）。
- 受控负例与逐模块验证（M4）。
- 审查进展判定、组内收口与 `antigravity` 适配（M5）。
- 页面十环派生、两处刷新时点与 N6 13 项旧账（M6）。

> 非目标只在 §10 维护。

## 3. 用户场景与状态覆盖

### SCN-001：验收者核一个已完成任务

- **角色**：任务验收者。
- **前提**：任务库有 `task.json` 与材料，目标仓可读。
- **触发**：执行 `node tools/cli/run-checks.mjs --task-path <任务目录>`。
- **结果**：stdout 是逐环报告；环 1–8 有可核事实或具名缺口，环 9 按级别给出结论，环10按§7.2实际交付时点/声明/原件判定，不无条件skipped；命令退出 0。
- **回写**：调用者把 stdout 存为 `<任务>/quality/evidence/final-chain-report.json`。

### SCN-002：核一个没有级别节的旧任务

- **角色**：验收者。
- **前提**：旧任务 decision-log 无「级别与路线」或该节缺关键事实/可回读原ref。历史开工计数不作当前全库事实；本任务已补节但历史七输入/调用缺源也走此场景。
- **触发**：同 SCN-001。
- **结果**：按复杂档判定；每环 basis 记「级别未取得」与所用回退；不把未产生的环判成不适用，也不静默删环。
- **回写**：报告 `level.source` 记 `fallback-complex`，`level.declared=false`。

### SCN-003：小改动任务

- **角色**：验收者。
- **前提**：受控副本带 `## 级别与路线`，用户选择小改动。
- **触发**：同 SCN-001。
- **结果**：环 9 为 `not_applicable` 并写依据；环 1–8、10 按真实材料判定；分母不含环 9。

### SCN-004：规划任务

- **角色**：验收者。
- **前提**：受控副本声明规划任务。
- **触发**：同 SCN-001。
- **结果**：环 5–8 按级别为 `not_applicable`；环 9 按「无实现交付」判 `not_applicable`，文档审查事实记入 basis 备注；环 10 因交付声明「不做」记 `not_applicable`，不计入分母（依据是交付声明，不是级别）。

### SCN-005：材料不可读或缺文件

- **角色**：验收者。
- **前提**：任务目录存在但 `spec.md` 缺失，或某原件不可读。
- **触发**：同 SCN-001。
- **结果**：对应环为 `unavailable` 或 `incomplete` 并写具体原因；其余环照常出结论；命令仍退出 0。

### SCN-006：声明写集与真实 diff 不一致

- **角色**：审查者。
- **前提**：Phase 契约头写集与 `git diff --name-only <baseline>..HEAD` 不同。
- **触发**：同 SCN-001。
- **结果**：环 7 单列越界项，不把差异过滤掉；结论保持 `incomplete` 并写冲突备注。

### SCN-007：审查 provider 活锁

- **角色**：主会话。
- **前提**：某 provider 反复发起被 hook 拒绝的读取。
- **触发**：发起一次审查。
- **结果**：被拒事件不计进展；5 个健康间隔后该路落 `PROCESS_STALLED` 终态；其余已完成结果照常返回。

### SCN-008：页面展示十环

- **角色**：查看者。
- **前提**：`verify-code` 逐 AC 结果形成后。
- **触发**：页面刷新。
- **结果**：页面显示十环节点与逐环结论、依据、证据类型、是否计入分母；provenance 写报告 sha 与决策记录指纹；旧件保留。

### 状态覆盖清单

- [x] **默认态**：SCN-001；正常复杂任务全环出结论。
- [x] **空态**：SCN-005；任务目录空或 `task.json` 不可读时逐环 `unavailable`。
- [x] **错误态**：SCN-005、SCN-006；材料缺失与冲突分别可读。
- [ ] **加载态**：N/A — 只读命令无异步加载视图。
- [x] **取消态**：SCN-007；单路取消/超窗落终态，其余结果保留。
- [x] **边界态**：SCN-003、SCN-004；级别裁剪边界。
- [x] **权限态**：SCN-001；只读认证任务目录，路径越界或不可读记 `unavailable`，不写任务库。
- [x] **竞态**：SCN-008；页面与报告同批写入并保旧件，报告为唯一事实，页面不同步以报告为准。

## 4. 产品事实与假设（PFACT）

- **PFACT-001**：十环定义来自父 PRD 与十环补遗，逐环为原始需求、decision-log、调研方案、方案、spec、phase、代码实现、测试验证、最终审查、提交 PR。
  - **状态**：`verified`
  - **证据或来源**：`/Users/Hugh/Hugh/Project/workflowhub/specs/archive/skills-framework-redesign-20261014/prd.md:459-475`；`quality/evidence/decision-log-refs/s3/T4-compliance-supplement.md:15-27`。
  - **关联**：FR-CHAIN-001、AC-M1-1、SCN-001。
- **PFACT-002**：`run-checks` 现在拒绝任何参数并以退出码 1 结束；无参数聚合包含 6 个 checker，其中 `check-decision-log-chain` 为 advisory。
  - **状态**：`verified`
  - **证据或来源**：`tools/cli/run-checks.mjs:114-171`（实读 2026-10-20）。
  - **关联**：FR-CHAIN-004、AC-M3-2、SCN-001。
- **PFACT-003**：便携工作流内核写死 `build-prd`：`WORKFLOW`、`TERMINAL_DIRECTORY`、`STEP_RESULT_REF` 三个常量，三个核对函数未导出；`loadPortableWorkflowManifest` 读 `workflows/<workflow>/steps.json`。
  - **状态**：`verified`
  - **证据或来源**：`runtime/task/portable-workflow-run.mjs:5-7,42-50,103-165`（实读 2026-10-20）。
  - **关联**：FR-CHAIN-004、FR-CHAIN-005、AC-M3-1、SCN-001。
- **PFACT-004**：五态词表是 `completed`/`skipped`/`not_applicable`/`incomplete`/`unavailable`，并带 `trigger`/`executed` 生命周性约束。
  - **状态**：`verified`
  - **证据或来源**：`runtime/stage/stage-skill-runtime.mjs:6,30-34`（实读 2026-10-20）。
  - **关联**：FR-CHAIN-002、AC-M1-1、AC-M2-1。
- **PFACT-005**：当前模板 `skills/decision-log/templates/decision-log-template.md:35-41` 已有 `## 级别与路线`，且要求真实选择、入口事实来源、调用与唯一原 ref；关键事实或原 ref 缺失时按复杂并记缺口。027/026 中的旧日志计数仅属当时范围，不推断当前所有任务缺节；本任务补节也不补造历史七输入或调用，缺源时仍可 `fallback-complex`。
  - **状态**：`verified`
  - **证据或来源**：当前模板 `:35-41`、`workflows/make-decision/SKILL.md:25-31,54-66`；`quality/evidence/2026-10-20-037-n8-into-n9-merge-readback.json`。历史计数沿 026 原件保留。
  - **关联**：FR-CHAIN-001、AC-M1-2、SCN-002。
- **PFACT-006**：N8 四套方法与步骤表已在 `1d24f938310e4fbe6b5ad13e3b419b39bc2a83d1` 合入本工作树，步骤数为复杂 15、小改动 9、普通 11、规划 11；合入后 N8 仍有 28/31 AC incomplete，不能称整卡验收完成。
  - **状态**：`verified`
  - **证据或来源**：当前 `workflows/make-decision/steps.json:187-200` 与三套 flow；037 合并读回；N8 外置交接 `quality/evidence/handoff/2026-10-20-010-verify-code-handoff.md:47-59`（相对 N8 任务库）。
  - **关联**：FR-CHAIN-001、AC-M1-1、§12 OPEN-02。
- **PFACT-007**：`validatePostPhaseContract` 是现有无状态合同校验器，`spec.md` 与 Phase 契约头缺项会被报错；`checkSkillConsistency(root)` 是现有技能一致性报告入口。
  - **状态**：`verified`
  - **证据或来源**：`runtime/stage/stage-content-contracts.mjs:413`；`tools/cli/check-skill-consistency.mjs`。
  - **关联**：FR-CHAIN-002、AC-M2-2。
- **PFACT-008**：N6 页面模板现为七环 CORE、12 类节点，含 ANCHOR 与 DATA provenance；改十环会撞 N6 已验收的 AC-118/121。
  - **状态**：`verified`
  - **证据或来源**：`skills/answer-as-page/templates/overview-template.html`；`quality/evidence/2026-10-20-018-n6-page-seven-vs-ten-rings-analysis.md`。
  - **关联**：FR-CHAIN-009、AC-M6-1。
- **PFACT-009**：N6 审计的 13 项旧账按 A7/B2/C4 分类，A 类由本任务直接做。
  - **状态**：`verified`
  - **证据或来源**：`quality/evidence/2026-10-20-019-n6-debt-closure-plan.md`；D-012。
  - **关联**：FR-CHAIN-011、AC-M6-3。
- **PFACT-010**：G1 基线已在 build-plan 开工时实测：方法面字节合计 70548 B，报告文件明细在原件里。
  - **状态**：`verified`
  - **证据或来源**：`quality/evidence/2026-10-20-027-build-plan-g1-baseline.txt`。
  - **关联**：FR-CHAIN-005、AC-M3-1。
- **PFACT-011**：`antigravity` 适配把 `step_update` 的 `ACTIVE`/`DONE`/`ERROR` 三种状态都算 `progress`；`process.mjs` 只在 `progress===true` 时重置进展窗口，`health-runner.mjs:32-38` 已有 5 个间隔的 `PROCESS_STALLED` 规则。
  - **状态**：`verified`
  - **证据或来源**：`skills/third-review/lib/adapters/antigravity.mjs:130-133`；`skills/third-review/lib/process.mjs:167-172`；`skills/third-review/lib/health-runner.mjs:32-38`（实读 2026-10-20）。
  - **关联**：FR-CHAIN-007、AC-M5-1。
- **PFACT-012**：`run-checks.mjs` 在聚合时把每个 checker 的 stdout/stderr 直接写入自己的 stdout，因此报告要作为可保存原件，只能在带参数分支走纯 JSON 输出。
  - **状态**：`verified`
  - **证据或来源**：`tools/cli/run-checks.mjs:51-53,114-159`（实读 2026-10-20）。
  - **关联**：FR-CHAIN-004、AC-M3-2、AC-M3-4。
- **PFACT-013**：`workflows/verify-code/steps.json` 是 8 步，步数与 `step_id` 被 `tests/contract/stage-closeout-step-contract.test.mjs:19-35` 冻结；末步固定为 `closeout` 且文本含「收口」与 `measure-main-agent-cost`。
  - **状态**：`verified`
  - **证据或来源**：`workflows/verify-code/steps.json`；`tests/contract/stage-closeout-step-contract.test.mjs:19-35`（实读 2026-10-20）。
  - **关联**：FR-CHAIN-010、AC-M6-2。

## 5. 功能需求

### 十环声明与级别适用性（CHAIN）

十环是执行环节的唯一清单；级别适用性决定每环在四级路线下的必需、按需或不适用。声明由代码常量承载，矩阵每格写依据来源，读不到级别时按复杂并记缺口。

- **FR-CHAIN-001**：系统必须为十环各给出适用性（`required` / `on_demand` / `not_applicable`）与依据；只从决策记录 `## 级别与路线` 取得最新有效的真实用户选择，来源核验与失败回退见 §7.1；推荐或未答不代选，缺源按复杂并记「级别未取得」；不得按材料存在性推断适用性，不得新增状态枚举。
  - **范围边界**：含十环清单、四级矩阵、级别解析与 `level` 报告字段；不含证据取数与判定执行。
  - **依据**：PFACT-001、PFACT-005、PFACT-006；D-004、D-006；R-002、R-005、R-009。
  - **场景**：SCN-001、SCN-002、SCN-003、SCN-004。
  - **验收**：AC-M1-1、AC-M1-2。
- **FR-CHAIN-002**：系统必须为每环定义可核事实（证据类型＋可判定谓词）与五态判定；文件存在、目录存在、字段齐全都不算完成；冲突记为 `incomplete` 并写备注；环 2／5 读取非空扫描、决定数或必要段事实，合法/空/缺段负例按 §7.2 判定，不改变既有 advisory checker 的退出语义；环 4 必须读单元级追踪表并逐字段判空；环 9 只认当前范围的实现或交付独立审查原件与真实终态。
  - **范围边界**：含逐环谓词、证据类型判定与冲突备注；不含报告输出格式。
  - **依据**：PFACT-004、PFACT-007；D-006、D-007；R-002、R-004、R-006。
  - **场景**：SCN-001、SCN-005、SCN-006。
  - **验收**：AC-M2-1、AC-M2-2。
- **FR-CHAIN-003**：完成率分母必须等于本级适用环数；`completed` 计入分子；`incomplete`/`unavailable`/`skipped` 计入分母不计分子；`not_applicable` 不计入分母；报告同时给出 `skip_rate` 与 `attestation_coverage` 两个可复算数。
  - **范围边界**：只定义分母与两个指标，不新增评分门。
  - **依据**：PFACT-004；D-007；R-006；父 AC-T4-1/AC-011。
  - **场景**：SCN-001、SCN-003、SCN-004。
  - **验收**：AC-M2-1。

### 核对执行、报告与复用（KERNEL）

核对执行把声明与判据变成对指定任务的一次只读跑动，结果从现有 `run-checks` 出口输出，并由调用者保存为任务库报告原件。

- **FR-CHAIN-004**：系统必须以可选任务路径参数在现有 `run-checks` 上触发十环核对，带参数时**只输出纯 JSON 报告**（不走聚合、不混 checker 日志）；缺环只报告不阻断（退出 0）；无参数时行为与退出码不变；报告不直接写任务库。
  - **范围边界**：含内核参数化、报告字段与 CLI 接线；不含页面渲染。
  - **依据**：PFACT-002、PFACT-003；D-005、D-008；R-001、R-003、U-002、U-004。
  - **场景**：SCN-001、SCN-005、SCN-006。
  - **验收**：AC-M3-2、AC-M3-3、AC-M3-4。
- **FR-CHAIN-005**：复用必须先于新增：参数化并导出三件核对函数，`build-prd` 默认行为逐字不变；新增代码只在十环判据与报告装配；方法面、模板面与必读方法字节都不得高于本任务实测基线（两份原件：`027` 与 `029`），并给出删掉或合并的对象：页面旧七环重复映射分支、verify-code 重复刷新文字、三任务对照前的人工逐环摘录。
  - **范围边界**：含内核参数化与减法登记；不含把 ten-ring 收进阻断失败集。
  - **依据**：PFACT-003、PFACT-010；D-008；R-007、G1。
  - **场景**：SCN-001。
  - **验收**：AC-M3-1。

### 受控负例与逐模块验证（NEGATIVE）

负例只在仓库受控副本上造，每个负例有期望逐环结论，验证后删副本并复跑回基线。

- **FR-CHAIN-006**：系统必须能用七个受控负例证伪判据：漏环、只有文件没有事实、声明与事实冲突、规划任务无代码/PR、旧任务无级别节、材料不可读、零输入；每个负例报出预期结论，恢复后与基线一致，真实工作树不被扰动。
  - **范围边界**：只改 `tests/fixtures` 下的受控副本；不改真实任务材料，不新增评分器。
  - **依据**：D-009；外部方法「可证伪」原则；R-004、R-006。
  - **场景**：SCN-002、SCN-003、SCN-004、SCN-005、SCN-006。
  - **验收**：AC-M4-1。

### 审查健康与 antigravity（REVIEW）

- **FR-CHAIN-007**：审查进展只认「被允许的读取完成（`step_update` 的 `DONE` 且无 `tool_info.error`）」与「最终答案」两类事件；裸模型轮次（`agent_response` 的 `DONE`）、被拒、报错、重复工具调用只算 liveness，不算进展；沿用现有 5 个健康间隔，超窗把该路判 `PROCESS_STALLED` 终态；**另加一条无总时长上限的有界恢复**：当 provider 进程已消失但 `close` 未触发（后代仍持有 stdio）时，按有界恢复判该路 `PROVIDER_NO_TERMINAL_RESULT` 终态；其余已完成结果照常返回；不新增墙钟总时限。**与 D-010 字面的差异**见 §12 RISK-05：把「模型推进步骤」整体算进展会让真实活锁永不清零（`2026-10-20-024` §2.1 的原始事件序列），故按 D-010 的同一目标收紧为「被允许的读取＋最终答案」。
  - **范围边界**：只改健康判定与组内收口，不改 provider 路由与业务语义。
  - **依据**：D-010；`quality/evidence/2026-10-20-014-direction-review-slowdown-diagnosis.md`；U-006。
  - **场景**：SCN-007。
  - **验收**：AC-M5-1。
- **FR-CHAIN-008**：`antigravity` hook 必须同时接受真实 payload 形状（`tool_name`＋`tool_info.parameters.Path`）与现有形状（`toolCall.name=view_file`＋`args.AbsolutePath`）；路径先取 realpath 再与 bundle 内精确文件比对；越界与链接逃逸继续拒绝。
  - **范围边界**：只放宽形状匹配；不降低路径安全检查。
  - **依据**：D-010；`2026-10-20-014`；U-006。
  - **场景**：SCN-007。
  - **验收**：AC-M5-2。

### 页面派生与 N6 旧账（PAGE）

- **FR-CHAIN-009**：N6 页面模板必须把 CORE 从七环改为十环，节点类型 12→15（新增 spec/审查/PR），重映射 ANCHOR，按十环渲染逐环结论、依据、证据类型与是否计入分母，侧车增加 `ring:1…10` 节点，DATA 写报告 sha 与决策记录指纹；已归档任务的旧页面保留不动。
  - **范围边界**：含模板、页面生成方法、页面测试与 N8 small/normal/planning 三个页面 consumer 段；small 保无页例外，normal 在实际 make-decision 刷新，planning 按方向/交接条件出页；不含第二页面数据源。
  - **依据**：PFACT-008；D-011；U-004、U-005。
  - **场景**：SCN-008。
  - **验收**：AC-M6-1、AC-M3-4。
- **FR-CHAIN-010**：复杂路线的 `verify-code` 必须在两个时点刷新报告、页面与同名侧车并保旧件：逐 AC 结果形成且实际流程未到交付时点后（环1–9真实结论，环10依§7.2为skipped），以及 closeout/PR 完成后（补环 10 与终态）。普通路线由 P5 在 normal `make-decision` 第10步逐 AC 后、第11步 closeout/PR 后按相同报告/双指纹/输出/保旧件接口刷新，不伪造 verify-code 行；P6只消费该契约并负责复杂分支。small 无页例外与 planning 原出页/交接条件保留，不要求规划物理交付刷新。
  - **范围边界**：含 `verify-code` 方法与 steps 接线；不改 N6 归档 spec。
  - **依据**：D-011；U-004；R-004。
  - **场景**：SCN-008。
  - **验收**：AC-M6-2。
- **FR-CHAIN-011**：N6 审计的 13 项旧账必须逐项落到三态之一（已收／具名 `incomplete`／用户决定）；A 类 7 项由本任务直接做，B 类 2 项有真实数据才做，C 类 4 项按用户裁定；不可逆项记 limitation；D12 补写必须标「补记于 2026-10-20」并引用真实原件。
  - **范围边界**：只按审计清单收口，不顺手重写 N6 方法语义。
  - **依据**：PFACT-009；D-012；U-005、U-008。
  - **场景**：SCN-008。
  - **验收**：AC-M6-3。

- **FR-CHAIN-012**：核对器必须在同一只读报告中逐项给出任务实际选择路线的步骤声明、真实完成判据consumer、证据来源、human/program判定边界及五态结论；只读已有执行事实，不自动运行专业技能、不把目录/字段存在冒completed。选中flow替换复杂根步骤，同名slug按来源路径区分，后继build-prd仅在实际声明执行时纳入。`workflow_metrics`中的`stage_skip_rate`与`step_attestation_coverage`使用可回读步骤/阶段集合独立复算，不能用十环`metrics`或固定53/84替代。
  - **范围边界**：P1纯声明/谓词、P2现runner与唯一报告、P3现测试临时反例；不新增持久状态、schema或第二报告。
  - **依据**：R-010、父PRD E4/FR-T4-002:464,530；`step-consumer-design.md#输入集合与适用路线`、`#判定责任与回填方法`。
  - **场景**：SCN-001至SCN-005的实际步骤核对；无源、零输入与human判据不可机判必须具名保留。
  - **验收**：AC-M7-1。
- **FR-CHAIN-013**：五根入口及三个flow的当前steps声明必须可直达原方法的真实完成判据与原件consumer；只在八个现有`observable_result`内补稳定方法章节/步骤指针，保原条件、step_id/slug/schema/kind/目录和阶段身份，不普改已有充分判据的35个active技能。专业技能按当前入口依赖/真实触发取原定义，退役mini不恢复。
  - **范围边界**：P7/T013唯一持笔附件点名八个steps.json；verify steps由P6交P7串行。SKILL正文只条件回读，不复制附件表或加机器门。
  - **依据**：R-010、父PRD E4/FR-T4-002；附件逐source映射为唯一行级设计，spec与Phase不复制第二表。
  - **场景**：独立执行者从步骤声明定位原方法、必要事实与失败反例，目录指针不能自行证明完成。
  - **验收**：AC-M7-2。

## 6. 模块划分

| 模块 | 职责 | 对外提供 | 依赖 | 测试边界 |
| --- | --- | --- | --- | --- |
| M1 十环声明与适用性 | 十环清单、四级矩阵、级别解析 | 声明常量与 `level` 判定 | N8 已交付实现的级别声明（D-013）；无则按复杂 | 矩阵完整、缺级别回退 |
| M2 逐环判据与分母 | 每环证据谓词、五态映射、完成率 | `evaluateRing`、`summarize` | M1 的适用性 | 谓词正负例、分母可复算 |
| M3 核对执行与报告 | 任务材料取数、报告装配、CLI 接线 | `runFinalChainCheck`、报告 JSON | M1、M2、内核三函数 | 报告字段、退出码、三任务对照 |
| M4 受控负例 | 七个负例与期望结论 | fixture 与合同测试 | M3 的报告形状 | 负例各自报对、恢复回基线 |
| M5 审查健康 | 进展判定、组内收口、`antigravity` 形状 | 健康判定与 hook | 现有 broker/health 实现 | 假 provider、真实 payload、逃逸 |
| M6 页面与旧账 | 十环页面、两处刷新、13 项旧账 | 模板、页面实例、旧账记录 | M2/M3 的报告字段 | 模板结构、provenance、逐项三态 |

## 7. 关键实体

### 7.1 十环与级别

- **十环**：`ring` 1–10，顺序固定为原始需求、decision-log、调研方案、方案、spec、phase、代码实现、测试验证、最终审查、提交 PR。
- **级别**：`small`、`normal`、`complex`、`planning`；值域不扩展。
- **适用性**：每环每级取 `required`、`on_demand`、`not_applicable` 之一，并带 `source`（`level-declaration` / `step-table` / `fallback-complex`）。

| 环 | 小改动 | 普通 | 复杂 | 规划 |
| --- | --- | --- | --- | --- |
| 1 原始需求 | required | required | required | required |
| 2 decision-log | required | required | required | required |
| 3 调研方案 | on_demand | required | required | required |
| 4 方案 | required | required | required | required |
| 5 spec | required | required | required | not_applicable |
| 6 phase | required | required | required | not_applicable |
| 7 代码实现 | required | required | required | not_applicable |
| 8 测试验证 | required | required | required | not_applicable |
| 9 最终审查 | not_applicable | required | required | not_applicable |
| 10 提交 PR | on_demand | on_demand | on_demand | on_demand |

- **级别来源核验**：只消费「级别与路线」内可定位来源的真实用户选择及该节明确指向、可回读的入口调用/返回原 ref，并核七项判级事实及来源是否充分。最新已确认变更承接旧/新级别与来源；保留历史，新的推荐未答不覆盖旧有效选择。新风险已使旧选择不再适用、多个选择无法消歧、关键事实缺失或原 ref 不可回读时，返回 `complex`、`declared=false`、`source=fallback-complex`，逐项写缺口/owner；回退不表示用户已选复杂。任务性质「普通任务」不等于级别 `normal`；同义表述须能从真实选择原文无歧义映射，不能靠推荐补值。
- **解析职责**：P2 runner 仅在认证材料根/当前 task 根内安全回读该节明确指向的原件，拒越界、别名逃逸与不安全链接，传文本与已核来源状态给 P1 纯函数；P1 不读文件，不另建 schema、选择账本或历史扫描器。本任务真实复杂选择可保其确认来源，但历史七输入/原调用未取得时仍按回退记缺口，不把补节当补证。
- **矩阵范围**：只核选中路线承诺的环节。small 恰 1 个 Phase、normal 默认 1 个且有独立交付单元才 2；planning 本阶段只交方向/任务卡给 `build-prd`，不产生 spec/Phase/实现/测试，未启动后继阶段不是漏做。环 9 的实现审口径不覆盖 planning 的方向/细节文档审；small 无独立审查轴，保持 `not_applicable`，不因 N8 验收欠账自动加审。
- **环 3 按需条件**：存在会改变方向的真实未知（外部事实、接口或风险）；没有则 `not_applicable` 并写「无真实未知」。
- **环 9 语义**：实现或交付的最终独立审查。规划任务的文档审查记入 basis 备注，不充当环 9。
- **环 10 语义**：适用性一律 `on_demand`——由真实交付声明决定：声明不做记 `not_applicable`（不计入分母），声明要做的实际时点与缺件分支唯一按§7.2「环10来源与时点」判，不能仅凭无PR就incomplete；不按级别预设，也不把「规划任务」本身当成不做交付的依据。

### 7.2 判定与五态

- **证据类型**：`command_exit`（命令＋退出码）、`file_sha256`（原件＋sha256）、`record_ref`（带字段的记录引用）。目录存在、文件存在、字段齐全都不构成任一类型。
- **分母口径**：`counted_in_denominator = state ≠ not_applicable`（按解析后的状态算，不按级别策略算）；适用环数为分母，`completed` 为分子。
- **五态映射**：成功＝`completed`；合法跳过＝`not_applicable`（`trigger=false` 且 `executed=false`，带依据）；还没产生＝`skipped`（写「流程未到」）；缺失＝`incomplete`（`trigger=true`、`executed=false`）；取不到＝`unavailable`；冲突＝`incomplete`＋备注。不新增状态词。
- **环 2 抗空转**：读取 `check-decision-log-chain` 实际 command/exit 与该任务非空扫描、至少一条决定条目的事实；runner 在现有读材料路径核扫描范围、决定数与必要段，缺项记 `incomplete`、原件取不到记 `unavailable`。该 checker 明确是 advisory（`tools/cli/check-decision-log-chain.mjs:4-8,113-120`），空输入/缺段的目标测试应断言环 2 非 `completed`，不要求 checker 非 0。
- **环 5 抗空转**：`spec.md` 非空且必要段与 `validatePostPhaseContract` 实际结果可核；缺段/空输入报告非 `completed`，不以一次 exit 0 代替结果。证据只证明声明级，basis 必须写明。原计划“负例 checker 必须非 0”与 advisory 真实合同不兼容，现按其既有退出语义更正；不增阻断、不扩 checker 生产写集。
- **环 4 单元三件**：读该任务的单元追踪表（来源→FR/AC→Phase/Task→oracle），逐行四字段非空；缺任一字段记 `incomplete` ＋一条事实，表不可读记 `unavailable`，不静默跳过。相同证据按 `duplicate_of` 引首条，不因复用提高事实强度。
- **轻档事实读取**：环 7/8 从当前 task 的真实 `make-decision` 阶段 evidence、`quality/tests` 与实际 diff 读取实施/测试事实；spec/Phase 不证明执行。normal 环 9 可引用同一 make-decision 行挂接的 `quality/reviews` 实现审，完整身份须同 task、`stage=build-code`、`review_scope=phase`、`subject_kind=phase`、`review_kind=null`、`phase_id=null`，以整次真实 diff 为范围；按实际 `surface`、合同与原件识别代码面，不要求额外 build-code/verify-code 阶段行。complex 仍逐 Phase 加终末，small 无独立审。
- **环 9 口径**：只认当前范围的实现或交付独立审查，读取 `subject_kind`/`surface`/`review_scope` 及完整身份、实际 provider 终态与原件；文档审只进 basis 备注。至少一路 `completed && parse_outcome=ok`、可回读原始意见及覆盖/失败限制分别保留（`skills/wh-review/SKILL.md:36-53`）；字段不足按独立人读，在 `limits[]` 记「环 9 不可机判」，不把 status/coverage 字段齐全、空 findings 或局部审冒完整审。
- **环10来源与时点**：交付声明取任务facts交付行或decision-log的 `## 交付声明`；两处都没有为unavailable，不按级别预设。明确不做交付为not_applicable；声明要做且真实流程尚未到交付时点为skipped（流程未到）；已到/声称完成交付、应有原件却无PR读回为incomplete；PR四字段与原件可核才completed。P2只从当前阶段/步骤事实或具名事件原件取实际时点，时点取不到为unavailable，不从PR缺失猜流程未到。

### 7.3 报告

- **文件名**：`quality/evidence/final-chain-report.json`（相对任务库根）。
- **写入者**：调用者保存 `run-checks` stdout；`run-checks` 自身不写任务库。
- **必填字段**：具名顶层键 `schema_version`、`task_id`、`baseline_commit`、`material_root`、`level`（`value`/`declared`/`source`）、`rings[]`（`ring`/`name`/`applicability`/`state`/`evidence_type`/`basis[]`/`counted_in_denominator`/`conflict`）、`completion`（`applicable`/`completed`/`rate`）、`metrics`（`skip_rate`/`attestation_coverage`）、`limits[]`，以及 `chain_state`、`workflow_steps[]`、`workflow_metrics`；`basis[]` 每条带 `evidence_level`：真实证据取三类型之一；仅承载缺失、不可取得、不适用或回退原因的说明性条目取 `null`，不构成证据，不计入 attestation coverage，不使环或 step 判为 `completed`。只有真实重复证据可带 `duplicate_of`，指向首次出现。`limits[]` 记取消、未证实与口径限制：先把适用环映射成 step status（`completed→completed`、`skipped→in-progress`、`incomplete→failed`、`unavailable→unverified`，`not_applicable` 不参与），再用 `stateForStepResults` 的既有词表产出 `succeeded`/`failed`/`in-progress`/`unverified` 之一。
- **缺报告**：页面显示缺口，不显示完成。

**逐step协议（同一报告的补充，不是第二进度权威）**：`workflow_steps[]`每条使用当前source路径＋step_slug定位，带stage、route、owner_ref（原方法稳定标题/步骤）、当前声明与原件依据、applicability、human/program的实际可核子面、state及limits。行级来源设计只在`step-consumer-design.md`，各Phase按自身行/触发技能读取，不强制全读附件（终稿75106 B）；真实判据始终由当前原方法独占，附件只导航。P1只判断传入事实，不写fs；P2安全读取根manifest及根flows指向的相对受控文件，方法引用限定认证包/当前任务读集，不递归扫描技能库、不执行Markdown命令。human语义结论只从现task facts对应stage evidence明确引用的普通原始读回件取得：具名执行者/独立读者在原件说明本source+slug、实际输入/观察、原方法判据与达/未达及限制；runner安全回读该ref；不能可靠提取或source身份冲突时保raw ref、unavailable/limits并交真实reader，不按关键词推completed；可核时把原结论及原ref带入同一workflow_steps.basis，不建human schema或新human状态对象。无真实人读结论时state=unavailable（已有目标失败则incomplete），owner_ref非空绝非completed；程序只核来源/身份/command/exit等可证子面，不自动读散文推断语义通过。

`workflow_metrics`与十环`metrics`分义：`step_attestation_coverage = 有可核执行原件的适用step数 / 当前选中路线适用step数`，是否有原件不等于该step完成；报告同时给声明step集合与本次适用step集合、分子分母及参与source+slug，去重同执行原件不提高覆盖数；每条参与集合在workflow_steps可复算。`stage_skip_rate = 当前任务声明候选阶段集合中有规则依据且实际阶段行确认未调用的阶段数 / 声明候选阶段数`；stage候选集合只从已确认决策级别路线＋当前入口路由＋facts明确声明实际分支重建，不增task workflow字段；缺stage行不推未调用。报告在workflow_metrics附分子、分母及stage source refs/实际stage行集合，未选flow不另算stage。只有声明集合/实际行来源足够才计算；未选flow不当新stage、后继未启动不猜stage skip。集合缺失/分母0时该读数为null并在limits说明，不把未知填0；不新增状态词、不把比例作推进门。human判据保人读边界，program子面失败/取数失败分别记录，advisory退出语义保持。P7回填前后P2都读当前源，可报告owner ref未补而不依赖未来P7文件；P8末验用已回填源重核并读P7原件。

## 8. 数据和生命周期

- **数据粒度**：一次命令对应一个任务的一份报告；一个任务可因材料变化重跑，旧报告保留。
- **数据时效**：每次执行读当前材料与当前 `HEAD`；不缓存判定结果。
- **缺失或迟到**：材料缺失逐环记 `unavailable`；`baseline_commit` 读不到时记 `unavailable` 并把环 7 标为不可核。
- **预览与正式**：报告是唯一事实；页面是从报告派生的展示，不同步以报告为准。
- **当前与历史**：报告按次保存，不覆盖旧件；已归档任务的旧页面保留。
- **归属与清理**：报告归任务库 `quality/evidence/`，由任务 owner 决定清理；核对器只读。

## 9. 兼容性预留

- **既有消费方**：`build-prd` 便携工作流的既有测试与 terminal 写入路径保持；`run-checks` 无参数聚合保持；N6 已归档页面保持。
- **命名预留**：报告字段用词固定为上文英文键；不承诺新增公共 runtime 命令。
- **容器预留**：N/A — 不新增持久化容器或第二游标。
- **状态预留**：沿用五态；不新增状态机或生命周期对象。
- **扩展边界**：本期只加十环核对、审查健康与页面十环；不承诺跨仓任务注册表、宿主历史扫描或 LLM 判分通道。

## 10. 明确不做与默认必须成立

### 明确不做

- 不新建阶段、阻断门、第二进度权威、步骤历史状态机或第二游标（D-001、D-008、§范围）。
- 不扩 `portable-workflow-run.mjs` 的 terminal 对象，不恢复旧 stage 执行器（R-003）。
- 不新增公共 runtime 命令；十环入口就是 `run-checks`（D-008）。
- 不批量重核 N1–N8，不扫描宿主历史，不为任意路径就读（D-003）。
- 审查侧不加墙钟超时、不换执行者、不伪造成功；不因一次拒绝杀 provider（D-010）。
- 不建第二页面数据源；页面不回写进度；不批量重生成已归档页面（D-011）。
- 不伪造测量、不补造时点；不把「N9 做了十环页面」当 N6 旧账闭环（D-012）。
- 不改 N6 归档 spec；不越权写其他任务 facts（D-012；D12 需授权标记）。

### 默认必须成立

- 文件存在、目录存在、字段齐全都不算完成；缺环只记不阻断（关联 FR-CHAIN-002、AC-M2-1）。
- 合法跳过不计违规；不适用不从列表静默删除（关联 FR-CHAIN-001、AC-M1-1）。
- 报告为唯一事实，页面只读派生（关联 FR-CHAIN-009、AC-M3-4）。
- 五态词表不扩展，冲突不新增状态（关联 FR-CHAIN-002、AC-M2-2）。

## 验收流程

从 `decision-log.md#验收面` 取可观察接口与成功失败边界，按 SCN-001 入口逐环定位 FR、`Appendix A` 同号 AC、所属 Phase 的命令与可回读证据；外置原件按 `decision-log.md#外置事实索引` 的到达条件读。本节只描述流程，判据在 `Appendix A`。

## 测试标准

本项目声明的测试面如下；每面写清适用性与 oracle，命令在所属 Phase 卡，`Appendix A` 只指同一 oracle 与预期证据。

| 测试面 | 适用性 | oracle | 证据类型 | 覆盖 AC |
| --- | --- | --- | --- | --- |
| 单元/合同测试（`npx vitest run <受影响文件>`） | 适用：声明、谓词、报告、页面结构、hook | 命名断言 | 命令＋退出码 | AC-M1-1/2、AC-M2-1/2、AC-M3-1/2、AC-M4-1、AC-M5-1/2、AC-M6-1 |
| CLI 行为面（`run-checks` 无参数/带任务路径） | 适用：退出码与输出形状 | 退出码与 stdout 断言 | 命令＋退出码 | AC-M3-2、AC-M3-3 |
| 真实任务对照面（本任务、N2、N6） | 适用：结论与人工读回一致 | 独立人工读回 | 记录引用＋命令 | AC-M3-3、AC-M1-3、AC-M6-3 |
| 页面结构面（HTML 断言） | 适用：十环、15 类节点、provenance | 命名断言 | 命令＋退出码 | AC-M6-1 |
| 浏览器可见面 | 适用：十环静态HTML有真实可见改动；由P8/verify-code执行agent驱动隔离agent-browser、新profile、owned loopback静态HTTP，不需用户提供技术环境 | 实际报告派生页；1440×900与390×844为计划测试尺寸，执行时读回真实viewport | URL/title/DOM ready、截图、展开/溢出、console/errors、a11y与清理原件 | AC-M6-1浏览器子条件、AC-M6-2刷新读回 |
| 审查健康面（受控假 provider） | 适用：不调真实模型 | 假 provider 事件序列 | 命令＋退出码 | AC-M5-1/2 |

浏览器执行职责：P5交真实报告派生HTML与侧车，P8/verify-code执行agent按本仓 `skills/isolated-browser-qa/SKILL.md` 的 `--run` 生命周期先doctor/owned cleanup，检查实际页面后finally cleanup。仅以本任务页面产物目录启动自有127.0.0.1静态HTTP临时服务，动态端口启动后保存真实地址；白名单保localhost/127.0.0.1，不为file://删保护。只停本次自建server与owned浏览器资源，不停用户服务、不触用户Chrome。工具真实失败才按原方法修复/保unavailable，不能预先以“无服务/无授权”写N/A；用户第一次看真实页作效果选择仍独立保留，自动QA不代用户偏好。

### 验收对象

本节按模板唯一合同保留尚未执行的真实对象。service/route由执行agent启动owned loopback预览并生成实际HTML后回填，不把未来地址或空模板路径冒已就绪页面。viewport是本计划明确测试尺寸，非已观察产品效果，执行时核真实读数。

```json
{
  "workspace": "/Users/Hugh/Hugh/Project/workflowhub-n9-final-chain-verification-20261020",
  "service": { "mode": "owned loopback static HTTP", "host": "127.0.0.1", "port": "runtime-assigned", "document_root": "当前任务quality/evidence中本次页面产物目录", "execution": "not_run" },
  "route": { "producer": "answer-as-page caller", "artifact": "本次真实报告派生HTML的实际文件名；执行时由caller输入及生成原件取得，不是overview-template.html", "url": "启动后读取实际loopback URL", "execution": "not_run" },
  "state": "实际 final-chain-report.json 派生的生成HTML，含有源正常、缺报告/缺环与合法不适用状态",
  "viewport": [{ "width": 1440, "height": 900 }, { "width": 390, "height": 844 }],
  "owner": "verify-code执行agent"
}
```

三来源核对（实读范围与引用）：

- `raw_requirement`：用户原话「我可以在N6任务中实现的html中查看」（`decision-log.md#需求变更记录` U-004；原件 `quality/evidence/decision-log-refs/requirement-change-log.md#u-004`）→ UI 范围 true。
- `project_inventory`：仓库有 `skills/answer-as-page/templates/overview-template.html`（75119 B）与 `skills/answer-as-page/SKILL.md`；无 `apps/`、无前端框架目录 → 页面以静态模板产出，UI 范围 true。
- `planned_or_changed_frontend_fact`：D-011 明确改该模板的 CORE、节点类型与 ANCHOR → 前端改动 true。

历史对象检查 `quality/tests/2026-10-20-009-build-plan-acceptance-object.json` 保其当时service/viewport缺失，不冒当前测试设计。现计划两个viewport已有明确测试来源，service/route现为明确预览配置且execution=not_run，实际地址/页名仍待执行agent从owned loopback临时server与生成HTML读回；这是agent可取得的运行事实，不让用户提供端口/技术尺寸。模板checkAcceptanceObject仅核非空结构，不证明地址可用或页面渲染；执行时把真实对象与三源context交同一producer重核保存原始结果。当前未启动server/浏览器，不宣已测。本次主会话已从上述实际JSON与三源context调用模板唯一checker，原件 `quality/tests/2026-10-20-017-final-plan-acceptance-object.json` 记录exit0、ok=true、missing_fields=[]；只证计划对象最小字段结构齐，service/route仍execution=not_run，不证预览已启动、页面已生成或浏览器效果通过。

### UI 来源与适用性（八类）

按 `skills/ui-project-init/SKILL.md`「规范职责」逐类记真实源、作用域、owner/consumer 与缺源影响；不生成第二份设计正文。

| 类 | 本任务适用性与真实源 | owner / consumer | 缺口或影响 |
| --- | --- | --- | --- |
| ①领域语义 | 不适用（本任务不新增领域词；decision-log 记 GLOSSARY no-change） | 项目领域 owner / 设计与文案 | 无 |
| ②视觉设计系统 | 无独立 `specs/design/design.md`；样式内联在 `overview-template.html`，本任务不改颜色/字号/间距 | 设计系统 owner / 模板读者 | 缺独立 token 源，记 N/A 而非新建 |
| ③组件 | N/A — 单文件静态模板，无共享组件与 storybook | 组件 owner / 实现与测试 | 无组件复用或删除决策 |
| ④布局 | 适用：十个环节点的横向/分组布局沿用现模板布局，只改 CORE 与 ANCHOR 常量 | 布局 owner / 页面渲染 | 无独立布局正文，沿用现行模板 |
| ⑤通用交互 | N/A — 页面只读展示，无新增控件或交互状态 | 交互 owner / 规划与测试 | 无 |
| ⑥前端工程 | N/A — 单文件 HTML，无构建、无框架、无类型层 | 前端工程 owner / 实现 | 无 |
| ⑦内容与设计工艺 | 适用：十环名称与逐环字段用词取自本规格 §7 与 `Appendix A`，不另造文案 | 内容设计 owner / 页面读者 | 无独立 craft 正文，来源指本规格 |
| ⑧质量判据 | 适用：页面结构断言与P8隔离静态HTML验收；计划1440×900/390×844须实际读回 | 质量 owner / verify-code执行agent | 未来工具/页面未就绪保真实失败，不预先以无服务/授权豁免 |

## 架构边界

产品边界：十环声明、判据、报告、页面展示对人类验收者可见。工程边界：声明与判据是纯函数模块，执行与报告是读材料并装配的薄层，CLI 只加一个可选参数；页面模板只消费报告字段，不自己取数。真实消费者是 `run-checks` 调用者、页面生成流程与三任务验收者。

## 实现设计（全局权威）

本节消费 PRD 与 decision-log，不重新决定产品目标；缺失写 unknown 与 owner。

### 代码锚点

- **读取顺序**：先读 `runtime/task/portable-workflow-run.mjs:5-7,42-50,103-165`（内核三常量与三函数），再读 `tools/cli/run-checks.mjs:114-171`（聚合与参数拒绝），再读 `runtime/stage/stage-skill-runtime.mjs:6,30-34`（五态），再读 `skills/third-review/lib/adapters/antigravity.mjs`（hook 形状）与 `skills/answer-as-page/templates/overview-template.html`（七环、节点、ANCHOR），最后读 `workflows/verify-code/steps.json`（刷新点）与 `skills/decision-log/templates/decision-log-template.md:35-41`（级别节）。
- **代码锚点**：`runtime/task/portable-workflow-run.mjs` 的 `WORKFLOW`、`STEP_RESULT_REF`、`TERMINAL_DIRECTORY` 与 `loadPortableWorkflowManifest`、`validateStepResultEvidence`、`validateStepResults`、`stateForStepResults`；`tools/cli/run-checks.mjs` 的 `runAggregate` 与 `isMain` 参数分支；`runtime/stage/stage-skill-runtime.mjs` 的 `OUTCOME_STATUSES`；`skills/third-review/lib/adapters/antigravity.mjs` 的 hook 入口；`skills/answer-as-page/templates/overview-template.html` 的 `CORE`、`ANCHOR`、`DATA`。锚点行号是生成时刻快照，会漂移，不作契约。
- **运行条件**：Node 20 ESM（仓内既有），vitest 跑 `tests/contract`，`node tools/cli/run-checks.mjs` 直接可执行；无新增依赖。
- **现状与目标差异**：现状没有十环声明与判据、`run-checks` 不收参数、内核不导出；目标是新增声明/判据/报告，并把内核参数化后复用。

### 接口与失败语义

- **选择的架构方案**：新增 `runtime/task/final-chain.mjs`（纯声明与谓词）与 `runtime/task/final-chain-runner.mjs`（读材料、装配报告）；参数化并导出内核三函数；`run-checks` 加 `--task-path`。放弃「另写独立脚本」与「只在 verify-code 调用」两个候选：前者多一个无人消费的入口，后者把只读检查绑进阶段收口。
- **模块职责**：`final-chain.mjs` 声明十环、矩阵与谓词，不读文件；`final-chain-runner.mjs` 读任务材料形成 bundle 并调谓词，不写任务库；`run-checks` 只负责输出与退出码；内核负责结构校验与证据命名空间核验。
- **内核复用边界**：只给 `WORKFLOW` 与 `STEP_RESULT_REF` 加带默认值的选项，并给证据核验加按命名空间的 `verifyEvidence`；默认值保持字面量 `build-prd` 与现有正则，`build-prd` 命名空间沿用现有 attestation 文件规则（逐字不变），`final-chain` 命名空间核验真实原件可读与 sha256 绑定。**不参数化 `TERMINAL_DIRECTORY`、不导出或改动 terminal writer（`:81-88`）、不改 `runPortableWorkflow`**。`stateForStepResults` 返回形状不变，只用于报告 `chain_state` 徽标，不复用于环状态。
- **接口与数据流**：`--task-path` → 读 `task.json`（`task_id`、`baseline_commit`、`target_repo_root`）→ 解析材料根（依序当前工作树 `specs/<task_id>`、当前工作树 `specs/archive/<task_id>`、`target_repo_root` 下同名路径）→ 逐环求值（环 7 在**材料根所属仓库**跑 `git diff --name-only <baseline>..HEAD`：当前任务＝认证 worktree，已合并任务＝材料根所在主仓；`target_repo_root` 只用于材料回退定位，不用于取当前 diff）→ 报告 JSON 到 stdout → 退出 0。缺材料不抛错，逐环降级。`run-checks` 用分支内 `await import(...)` 载入执行层，不新增顶层 import（`core/__tests__/run-checks.test.mjs` 的 fixture 只复制 7 个文件）。
- **失败语义**：任务目录不存在或 `task.json` 不可读 → stderr 具体错误 + 退出 2（参数/输入错误），不产出半份报告；单环材料缺失 → 该环 `unavailable`，其余照常；`--task-path` 之外的多余参数 → 与现状一致拒绝（退出 1）。
- **新增控制面**：`final-chain` 命名空间是内核参数而非新状态机；不新增公共命令、不新增持久对象。

### 全局文件边界与依赖

- **新增**：`runtime/task/final-chain.mjs`、`runtime/task/final-chain-runner.mjs`、`tests/contract/final-chain-declarations.test.mjs`、`tests/contract/final-chain-runner.test.mjs`、`tests/contract/final-chain-negatives.test.mjs`、`tests/contract/verify-code-page-refresh.test.mjs`、`tests/fixtures/final-chain/**`。
- **修改**：`runtime/task/portable-workflow-run.mjs`、`tools/cli/run-checks.mjs`、`docs/architecture/move-map.json`、`skills/third-review/lib/adapters/antigravity.mjs`、`skills/third-review/lib/process.mjs`、`skills/third-review/test/antigravity-adapter.test.mjs`、`skills/third-review/test/process.test.mjs`、`skills/third-review/test/review-progress-liveness.test.mjs`、`skills/third-review/test/adapters-health.test.mjs`、`skills/answer-as-page/templates/overview-template.html`、`skills/answer-as-page/SKILL.md`、`tests/contract/answer-as-page-skill.test.mjs`、`tests/contract/n6-terminal-review-fixes.test.mjs`、`workflows/verify-code/SKILL.md`、`workflows/verify-code/steps.json`、`skills/decision-log/templates/decision-log-template.md`、`skills/decision-log/SKILL.md`、`workflows/make-decision/flows/small/SKILL.md`、`workflows/make-decision/flows/normal/SKILL.md`、`workflows/make-decision/flows/planning/SKILL.md`（三flow SKILL由P5持笔，仅页面consumer/normal时点）；`workflows/make-decision/steps.json`、`workflows/build-prd/steps.json`、`workflows/build-plan/steps.json`、`workflows/build-code/steps.json`、`workflows/make-decision/flows/small/steps.json`、`workflows/make-decision/flows/normal/steps.json`、`workflows/make-decision/flows/planning/steps.json`（P7/T013；verify steps原已列，由P6先写P7后写）。
- **禁止改动**：`tests/contract/final-chain-plan-red.test.mjs`（2026-10-20 read实核，sha256=0ca1da0ce73bacdff6f01e67bffaabf70b4a4a89f9ede9a0af2f67ef4fcd2ab4，首部production只读/TCR声明及四组PLAN-CLI/HEALTH/PAGE/REFRESH不改）；`specs/n2-skill-catalog-portability-20261016/**`、`specs/archive/n6-skeleton-module-decision-20261019/**`（只读历史）、`specs/archive/skills-framework-redesign-20261014/**`（父 PRD 只读）、其他任务的 `facts.jsonl` 与 `task.json`（D-012 的 D12 补记需专门授权标记与原件引用）、`runtime/task/task-store.mjs`（本任务不改证据槽实现）。
- **全局依赖**：P1→P2→P3；P2→P5→P6→P7；P4独立；唯一末验P8依赖P3/P4/P6/P7。P1先写move-map，P2消费后追加同路径；P6先写verify steps刷新文字，P7在其当前字节上补consumer指针，故P7依P6；P1纯协议/P2当前源读取不依未来P7回填。P5写flow SKILL，P7后补flow steps到该当前方法指针，不重复写SKILL。
- **文件归属**：每个 Phase 的写集在契约头逐条列精确路径；同一批次内同路径互斥。
- **回滚与恢复**：内核参数化后 `build-prd` 测试若变化，回退参数化补丁保留其余改动；页面改动若撞冻结断言，按 TCR 一次变更并保留旧断言证据；报告字段变化回退判据模块。

### 需求到任务追踪

| 来源 / 决定 | 原义行为 / 强度 | FR / AC | Phase / Task | 正例 + 负例判据 / 证据 | 依赖 / 状态 |
| --- | --- | --- | --- | --- | --- |
| R-001、R-002、R-005；D-004、D-006 | 十环逐环可核、按级别裁剪、合法跳过不计漏步 | FR-CHAIN-001 / AC-M1-1、AC-M1-2 | P1/T001 | ORACLE-P1-DECLARATION：矩阵 10×4 全格有依据、五态不扩展；负例：旧任务无级别节按复杂并记缺口 | none；current |
| R-002、R-004、R-006；D-006、D-007 | 每环证据类型＋可判定谓词，文件存在不算完成 | FR-CHAIN-002、FR-CHAIN-003 / AC-M2-1、AC-M2-2 | P1/T002 | ORACLE-P1-PREDICATE：分母＝适用环、只有文件判 incomplete；负例：Phase 头缺 Write set 报未取得、spec 与 Phase 不一致报冲突 | T001；current |
| R-003、R-007；D-008；G1 | 复用核对逻辑、默认行为不变、字节不增 | FR-CHAIN-005 / AC-M3-1 | P2/T003 | ORACLE-P2-KERNEL：build-prd 既有断言原样通过、方法字节不高于 70548 B；负例：默认命名空间改变即失败 | none；current |
| R-001、R-003、R-004、R-008；D-005、D-008 | 读材料产出逐环报告与三任务对照、独立清单首次核回；runner不写任务库 | FR-CHAIN-004、FR-CHAIN-001 / AC-M3-4、AC-M3-3、AC-M1-3 | P2/T004 | ORACLE-P2-REPORT：报告具名字段齐、三个真实任务结论与人工一致；负例：缺 spec 报 unavailable 不崩 | T003；current |
| R-001、R-004；D-005、D-008 | 接现有 run-checks，只报告不阻断 | FR-CHAIN-004 / AC-M3-2、AC-M3-3 | P2/T005 | ORACLE-P2-RUNCHECKS：无参数输出与退出码不变、带路径 exit 0；负例：多余参数仍拒绝 | T003、T004；current |
| R-004、R-006；D-009 | 负例放受控副本、恢复后回基线 | FR-CHAIN-006 / AC-M4-1 | P3/T006 | ORACLE-P3-NEGATIVES：七个负例各自报对、恢复后与基线一致；负例：任一负例未报错即失败 | T002、T004；current |
| U-006；D-010 | 进展只认允许事件、超窗落终态、其余返回 | FR-CHAIN-007 / AC-M5-1 | P4/T007 | ORACLE-P4-HEALTH：假 provider 5 间隔内 PROCESS_STALLED、慢 provider 不误判；负例：仍无限等待即失败 | none；current |
| U-006；D-010 | 真实 payload 放行、越界仍拒 | FR-CHAIN-008 / AC-M5-2 | P4/T008 | ORACLE-P4-ANTIGRAVITY：真实形状放行、bundle 外与链接逃逸拒绝；负例：放宽后越界可读即失败 | T007；current |
| U-004、U-005；D-011 | 页面十环、15 类节点、provenance | FR-CHAIN-009 / AC-M6-1 | P5/T009 | ORACLE-P5-TEMPLATE：十环与 15 类节点在场、旧七环断言更新；负例：缺环或旧结构残留即失败 | T004；current |
| U-004、U-005、U-009；D-011 | 报告字段进页面、缺报告显示缺口、normal实际make-decision两时点契约 | FR-CHAIN-009、FR-CHAIN-010 / AC-M3-4、AC-M6-2 | P5/T010 | ORACLE-P5-PROVENANCE：provenance 指向报告 sha 与指纹；负例：页面自造数据或缺报告仍显示完成即失败 | T009；current |
| U-004、U-005；D-011 | 两处刷新、保旧件 | FR-CHAIN-010 / AC-M6-2 | P6/T011 | ORACLE-P6-REFRESH：两个时点各写页面与侧车且保旧件；负例：少刷新一次或覆盖旧件即失败 | T010；current |
| U-005、U-008；D-012 | 13 项旧账三态、补记带标记 | FR-CHAIN-011 / AC-M6-3 | P6/T012 | ORACLE-P6-DEBT：13 项逐项三态有可核事实；负例：声称已修却无可核事实即失败 | T011；current |
| R-001–R-010、U-001–U-010；D-003、D-006–D-012 | 逐条收束十七条 AC，含 0 项新增采用与三任务对照 | FR-CHAIN-001、FR-CHAIN-002、FR-CHAIN-003、FR-CHAIN-004、FR-CHAIN-005、FR-CHAIN-006、FR-CHAIN-007、FR-CHAIN-008、FR-CHAIN-009、FR-CHAIN-010、FR-CHAIN-011、FR-CHAIN-012、FR-CHAIN-013 / AC-M1-1、AC-M1-2、AC-M1-3、AC-M2-1、AC-M2-2、AC-M3-1、AC-M3-2、AC-M3-3、AC-M3-4、AC-M4-1、AC-M5-1、AC-M5-2、AC-M6-1、AC-M6-2、AC-M6-3、AC-M7-1、AC-M7-2 | P8/T014 | ORACLE-P8-ACCEPTANCE：17 行结论与 17 条 AC 一一对应；负例：任一 AC 无证据或声明替代执行即失败 | P1–P7；current |
| R-010、U-010；父E4 | 逐step当前路线、human/program边界与独立父指标，同一报告 | FR-CHAIN-012 / AC-M7-1 | P1/T002、P2/T004、P3/T006 | ORACLE-P1-PREDICATE/ORACLE-P2-REPORT/ORACLE-P3-NEGATIVES：正例当前source+slug逐项有源；反例目录存在、缺human、零扫描、错route、零分母不得completed或造0 | P1→P2→P3；current |
| R-010、U-010；父E4 | 八steps可操作consumer接缝 | FR-CHAIN-013 / AC-M7-2 | P7/T013 | ORACLE-P7-CONSUMER：独立逐行回读原方法完成/失败/缺源，坏锚/只目录判未达；结构guard不冒语义 | P6；current |

### 全局验证策略

父E4有限补正由FR012/013、AC-M7-1/2与P1/P2/P3/P7明确承接；附件终稿含35当前依赖技能源映射，原方法独占判据，不再以十环覆盖等义代step。P8读实际实施原件后判，设计在场不冒执行完成。

- **验证策略**：先做第一份真实观察（本任务），由独立人工读回逐环对照，再扩到 N2、N6；负例在真实观察之后。技术面用受影响合同测试，人读面用独立读者，效果面留 verify-code。
- **RED/GREEN 设计**：每条行为 Task 在 Phase 卡写预写测试与同一条 `npx vitest run <文件>`；RED 只认命名目标断言失败，GREEN 退出 0；未取得 RED 原件写 `unavailable — 原因`，不伪造。
- **最终聚合**：`P8/T014` 逐条消费 P1–P7 原件核对 17 条 AC，补必要未闭环 case；只读汇总不叫端到端执行。
- **不能证明的内容**：已可读 N8 合入后的步骤/模板合同，但不证明其28条欠账已验、完整四路/N1/G1或首次消费者；真实浏览器渲染由P8必要未闭case验，不预先豁免；真实provider模型行为仍保原限制。

## Appendix A — 验收判据（唯一权威）

每条 AC 用同号唯一正文；精确命令留所属 Phase。判定方式：`AC-M1-1`、`AC-M1-3`、`AC-M6-3` 只能人读＋机器辅助；AC-M7-2为独立方法复放；AC-M7-1含human/program分界；其余为机器可判＋人读复核。

- [ ] **AC-M1-1**：关联 FR-CHAIN-001；来源 R-002、R-004、R-005；观察对象是 `final-chain.mjs` 的十环声明与四级矩阵，以及命令在四个受控任务上的输出。
验证：实施者在本次任务内提供四个带级别节的受控副本（small/normal/complex/planning）与本任务真实对照，独立执行者跑 `node tools/cli/run-checks.mjs --task-path <受控副本>` 读每环 `applicability`/`state`/`basis`；矩阵完整性由合同测试断言。
通过：十环全部在场且顺序固定；10×4 每格取 `required`/`on_demand`/`not_applicable` 之一并带依据来源，四级受控任务逐环断言而非只核级别名；真实选择与可回读原 ref/关键事实齐才 `declared=true`，只有推荐、来源不足或冲突按 §7.1 回退；结论只出现五个既有状态词；planning 选中方向路线的环 5–9 为 `not_applicable`，small 的环 9 为 `not_applicable`；每环结果在报告中恰被一个字段承载（唯一消费者）。
失败：出现第六个状态词或新状态序列；把「材料里没找到」写成 `not_applicable`；未读级别就填矩阵；任一环缺依据。
证据：`quality/tests/2026-10-20-*-p1-declaration.*`、`quality/evidence/final-chain-report.json`（受控副本与本任务各一份）。

- [ ] **AC-M1-2**：关联 FR-CHAIN-001；来源 R-005；观察对象是一个 N8 前的真实旧任务（无级别节）。
验证：独立执行者对旧任务跑同一命令，读 `level` 与逐环 basis。
通过：`level.value=complex`、`level.declared=false`、`level.source=fallback-complex`；每环 basis 含「级别未取得」；不把未产生的环判成 `not_applicable`，也不静默删环。
失败：静默降级或猜级别；把回退写成已声明；把缺失环从列表删除。
证据：`quality/evidence/final-chain-report.json`（旧任务一份）与命令输出。

- [ ] **AC-M1-3**：关联 FR-CHAIN-001；来源 R-008；观察对象是 N9 的外部采用清单。
验证：P2/T004 首次承接清单，由未参与实现的独立读者按父 PRD `:472` 的 6 项具名方法、`:513-514` 的 2 项 N9 消费源与 `tasks/N9.md` 的入口，逐项核对 `quality/evidence/final-chain-adoption-audit.json` 的判断与来源；去重后为 9 项（`planning-and-task-breakdown`、`build-the-lever`、`multi-phase-plan` 各只算一次）。P8 只消费既有首验原件，不补首次清单判断。
通过：去重后 9 项每项都有判断，且 `source_ref` 是可解析路径或明确写 `unavailable` 与 owner；`adopted_count=0`；`tasks/N9.md` 与父 PRD 的条目差异逐条记录。
失败：只用 `N9.md` 自证完整；漏项；声称采用；把历史既有消费计入新增分母。
证据：`quality/evidence/final-chain-adoption-audit.json` 与独立读者记录。

- [ ] **AC-M2-1**：关联 FR-CHAIN-002、FR-CHAIN-003；来源 R-006；观察对象是逐环谓词与 `completion` 字段。
验证：对同一任务核分母与逐环结论；用「只有文件没有事实」的受控副本对照。
通过：分母＝本级适用环数；`completed` 计入分子；`incomplete`/`unavailable`/`skipped` 计入分母不计分子；`not_applicable` 不计入分母；报告给出可复算的 `skip_rate` 与 `attestation_coverage`；只有文件没有事实判 `incomplete`。
失败：分母含不适用环；文件存在被判完成；比率与服务端四舍五入不一致或不可复算。
证据：同 AC-M1-1 的报告与合同测试输出。

- [ ] **AC-M2-2**：关联 FR-CHAIN-002；来源 R-006、U-007；观察对象是 Phase 契约头与 spec 写集表。
验证：用两个受控副本：Phase 契约头缺 `Write set`；spec 写集表与 Phase 头不一致。
通过：分别报「未取得」与「冲突」；冲突记 `incomplete` 并写备注；不用散文或并集掩盖。
失败：缺 Write set 被判完成；冲突被合并成单一结论；擅自改口径。
证据：两个受控副本的报告与合同测试输出。

- [ ] **AC-M3-1**：关联 FR-CHAIN-005；来源 R-003、R-007；观察对象是便携工作流内核与 G1 基线。
验证：跑 `build-prd` 既有便携工作流测试；按 `2026-10-20-027`（方法面 70548 B）与 `2026-10-20-029`（模板面与必读方法面：`REQUIRED_BYTES_TOTAL=84928`）同清单同法实测，原预算不重置。另读 `2026-10-20-035-n8-merged-g1-baseline.json`，同时列开工→最终与 N8 合入后→最终两套差额；N8 已带入方法 +1155 B、模板 +1213 B（其中决策模板 +1155、Phase 模板 +58），必读总数仍 84928 B。归因不自动豁免原预算；P5新增承接的三个flow SKILL也逐文件计改前/改后差额，不因不在旧清单而隐去增长，不悄重置原总预算。缺口由 P2/T003 登记并在计划确认展示，新增八steps面沿065逐文件同法实测（当前47762 B，verify steps与原METHOD重叠不叠加），附件仅按相关行加载、不变成全任务必读。没有已证净减数，不预承诺收益或重置原预算；缺口交接验证、不增“接受增长才设计完整”的新门。减法/具名 limitation 按下行原判据。
通过：既有断言逐字通过；必读方法面（029 的 `REQUIRED_BYTES_TOTAL=84928`）不增加；受影响文件逐个给出改前/改后字节与差额，凡增加的文件都在同文件内有具名删除或合并（三类对象之一），或由用户在计划确认时接受具名 limitation；`run-checks` 无参数仍走原聚合路径。
失败：任一既有断言失败或语义变化；必读面增加；文件增长但既无同文件减法也无用户接受的 limitation；只加规则无减法对象。
证据：既有测试原始输出、字节实测记录。

- [ ] **AC-M3-2**：关联 FR-CHAIN-004；来源 R-001、R-004；观察对象是 `run-checks` 的两个分支。
验证：分别跑无参数与带 `--task-path`。
通过：无参数输出与退出码与改动前一致；带路径输出十环报告且退出 0，缺环不阻断；多余参数仍以退出码 1 拒绝。
失败：改变既有阻断语义；带路径时因缺环退出非 0；崩溃或半份输出。
证据：两次命令的原始输出与退出码。

- [ ] **AC-M3-3**：关联 FR-CHAIN-004；来源 U-002、R-001；观察对象是本任务、N2、N6 三个真实任务。
验证：实施者按 10 环 × 3 任务的读回表（环/判据/state/证据路径/basis）由未参与实现者逐条填写；再跑核对器对照。改造前的同口径机读基线记为 `unavailable — 改造前无十环核对器，人工表在 build-code 首日采集`，不补造数字。
通过：三份报告与读回表逐环一致；不一致处有具名原因；改造前后对比只在有真实基线时给出，否则记 limitation；读回表由独立读者签名与时间。
失败：只跑本任务；用「每环都有状态行」或「命令 exit 0」代替对照；把 unavailable 写成无差异。
证据：三份报告、独立人工读回表与对比记录。

- [ ] **AC-M3-4**：关联 FR-CHAIN-004、FR-CHAIN-009；来源 D-005、U-004；观察对象是报告原件与页面 provenance。
验证：读 `final-chain-report.json` 必填字段；读页面 DATA 的 provenance；再删报告副本看页面表现。
通过：报告具名顶层键与 `rings[]` 逐环字段齐；页面 provenance 指向报告 sha256 与决策记录指纹；报告缺失时页面显示缺口。
失败：报告缺字段；页面自造数据；缺报告仍显示完成。
证据：报告原件、页面读回记录、缺报告负例。

- [ ] **AC-M4-1**：关联 FR-CHAIN-006；来源 R-004、R-006；观察对象是七个受控负例。
验证：逐个跑负例，再删副本重跑基线。
通过：七个负例各自报出预期逐环结论；恢复后与基线一致；`git status` 证明真实工作树未被扰动。
失败：负例不报错；需改真实材料；留下改动。
证据：七个负例输出、恢复后基线输出、`git status` 原件。

- [ ] **AC-M5-1**：关联 FR-CHAIN-007；来源 U-006；观察对象是受控假 provider 与正常慢 provider。
验证：受控假 provider 反复发被拒读取，并在其间穿插 `agent_response` 的 `DONE`；另跑一个「有允许读取 `DONE` 推进」的正常慢 provider。
通过：前者仍在 5 个健康间隔内落 `PROCESS_STALLED` 终态且组返回其余结果；后者不被误判；第三种输入（provider 进程消失但 `close` 未触发、后代持有 stdio）在有界恢复内落 `PROVIDER_NO_TERMINAL_RESULT`；不新增墙钟总时限。
失败：仍无限等待；误杀有允许读取推进的正常路；把 `agent_response` 或 `ERROR` 算进展。
证据：假 provider 事件序列与命令退出码。

- [ ] **AC-M5-2**：关联 FR-CHAIN-008；来源 U-006；观察对象是 `antigravity` hook。
验证：用真实 payload 形状、bundle 外路径、链接逃逸三种输入。
通过：真实形状放行；bundle 外与链接逃逸拒绝。
失败：放宽后越界可读；真实形状仍被拒。
证据：三种输入的 hook 输出与退出码。

- [ ] **AC-M6-1**：关联 FR-CHAIN-009；来源 U-004、U-005；观察对象是页面模板与页面实例。
验证：读模板 `CORE`/`ANCHOR`/`DATA`；用一个真实报告对象注入模板渲染并读回；已归档页面只读比对原字节。
通过：模板含十环与 15 类节点；逐环字段齐（结论/依据/证据类型/分母/备注）；侧车有 `ring:1…10`；provenance 含报告 sha 与决策记录指纹；新页面用十环，已归档旧页面原字节保留；只有当真实存在七环断言时才按一次 TCR 更新该断言，没有旧断言时写「无旧断言可更新，TCR 不适用」。
失败：缺环或字段；页面成第二权威；倒改已归档旧页面；渲染分支（缺报告缺口、ring 顺序）无断言。
证据：模板断言与渲染读回输出、页面实例、TCR 记录（或「不适用」说明）。
浏览器可见面适用，由P8/verify-code执行agent按owned loopback静态HTTP与两个测试viewport完成；未取得真实截图/DOM/console/a11y与cleanup原件时AC-M6-1不能pass，不能预先以无服务/授权豁免。

- [ ] **AC-M6-2**：关联 FR-CHAIN-010；来源 U-004、U-005及U-009适配；复杂观察verify-code两处刷新，normal观察实际make-decision两事件，owner各路线当前执行者；P5写normal契约、P6写复杂契约。
验证：复杂路线在 verify-code 逐 AC 后与 closeout/PR 后各跑一次刷新；普通路线在 make-decision 第10步逐 AC 后与第11步 closeout/PR 后各跑一次，P5持笔 normal 契约，P6消费共同接口。各路线正文写精确命令、输入（新一次报告、decision-log）、页面/侧车输出目录与旧件保留方式。
通过：各适用路线的两个时点均重核报告，再按相同报告sha/decision指纹接口写页面与同名侧车并保旧件；环1–9有真实结论；首时点在实际流程未到交付时环10依§7.2为skipped，末时点按实际声明/原件补真实结论；normal 仍只有 make-decision 阶段行，small无页与planning原出页/交接条件不变。
失败：少刷新一次；时点错（closeout 前补环 10）；覆盖旧件；只有文字没有可执行入口。
证据：verify-code 两处刷新的产物与旧件保留事实；本任务 build-code 阶段对该 AC 记 deferred，不判 pass。

- [ ] **AC-M6-3**：关联 FR-CHAIN-011；来源 U-005、U-008；观察对象是 N6 审计 13 项旧账。
验证：逐项读回三态与可核事实；D12 补记核对标记与原件引用。
通过：13 项各有「已收／具名 `incomplete`／用户决定」之一；A 类有真实读回；B 类有真实数据或 `unavailable`；C 类有用户答复或具名未答；D12 带「补记于 2026-10-20」并引用真实原件。
失败：声称已修却无可核事实；把不可逆项写成已收；补记伪装当时已有。
证据：`quality/evidence/2026-10-20-*-n6-debt-readback.*` 与逐项记录。

- [ ] **AC-M7-1**：关联FR-CHAIN-012；来源R-010/父E4；对象是同一final-chain-report的workflow_steps与workflow_metrics，P1/T002、P2/T004首次承接、P3/T006反例，P8仅聚合。
验证：独立预期从当前根/选中flow及附件相关行取得；受控small/normal/complex/planning正例逐step比路径+slug集合，缺原件、零输入、错路线/同名slug混用、human语义仅字段齐、advisory exit0、缺阶段集合与分母0为反例；全在现测试内存/临时根，不扩静态副本。
通过：选择集合与实际源一致，human/program边界和未测限制逐行可读，零扫描不completed；两个workflow比例可按报告行/实际阶段声明复算且与十环metrics分义；单一CLI报告、原无参数语义不变，无新增持久对象。
失败：固定53/84/旧行数当实际分母、根复杂与flow相加、目录存在冒步骤完成、程序假判human通过、取不到补0或另造进度账本。

- [ ] **AC-M7-2**：关联FR-CHAIN-013；来源R-010/父E4；对象是P7八个steps声明到真实方法的可操作接缝。
验证：P7/T013独立读者逐当前step核owner_ref稳定章节/步骤、原件类别与原条件保全；现有结构/frozen test保持，独立人读沿每个不同方法分支找完成/失败/缺源处置，附件仅相关行条件读取。
通过：八个当前源全部已回填准确consumer指针且可回源，原step/schema/kind/目录/阶段身份不变；35active技能已有判据仅引用、退役mini不恢复；新增字节八文件逐个实测纳G1双差额，不凭导航通过冒执行完成。
失败：漏当前source、失效章节、复制整表/新增validator或许可门、覆盖原observable条件、方法无充分判据却仍报可执行、改冻结测试求绿。

## 12. 风险、未决与交接

- **RISK-01**：旧任务统一按复杂处理会误报缺失。
  - **受影响 ID**：FR-CHAIN-001、AC-M1-2。
  - **触发条件**：任务无「级别与路线」或关键来源缺失；不复用旧计数推定当前所有任务。
  - **后果**：规划或小改动任务被报 `incomplete`，读者误判为漏步。
  - **缓解或停止**：basis 逐环写「级别未取得」与回退；报告 `level` 显式标 `declared=false`；受控副本演示正确裁剪。
  - **处理阶段**：P1、P3；verify-code 复核。
  - **验证**：AC-M1-2 的旧任务报告与 AC-M1-1 的受控副本对照。
- **RISK-02**：`antigravity` 放宽形状扩大读取面。
  - **受影响 ID**：FR-CHAIN-008、AC-M5-2。
  - **触发条件**：新形状接受路径但 realpath 比对失效。
  - **后果**：bundle 外文件被读。
  - **缓解或停止**：realpath＋bundle 根精确比对，越界与链接逃逸负例；不放宽检查。
  - **处理阶段**：P4。
  - **验证**：AC-M5-2 的三种输入。
- **RISK-03**：七环改十环撞 N6 已验收结论。
  - **受影响 ID**：FR-CHAIN-009、AC-M6-1。
  - **触发条件**：冻结测试断言七环/12 类节点。
  - **后果**：页面测试失败或压着失败交付。
  - **缓解或停止**：显式 supersede（D-011），一次 TCR＋独立审查，保旧断言证据。
  - **处理阶段**：P5。
  - **验证**：AC-M6-1 的 TCR 记录与测试输出。
- **RISK-04**：进展定义收紧后，只有模型轮次、长时间没有允许读取的正常 provider 可能被误判。
  - **受影响 ID**：FR-CHAIN-007、AC-M5-1。
  - **触发条件**：provider 连续 5 个健康间隔只发 `agent_response`、没有被允许的读取完成。
  - **后果**：正常但极慢的一路被 `PROCESS_STALLED` 终止。
  - **缓解或停止**：窗口按真实慢样本校准并在报告写依据；AC-M5-1 的正例用「有允许读取推进」的慢 provider；只有模型轮次的情形如实记风险，不加墙钟总时限。
  - **处理阶段**：P4；verify-code 复核。
  - **验证**：AC-M5-1 的正反例与校准记录。
- **RISK-05**：D-010 字面写「模型推进步骤」算进展，与真实活锁证据冲突。
  - **受影响 ID**：FR-CHAIN-007、AC-M5-1。
  - **触发条件**：按字面把 `agent_response` 的 `DONE` 算进展。
  - **后果**：被拒读取之间每 1–2 次就有一次模型轮次，进展窗口被反复清零，5 个间隔永不触发，活锁仍在（`2026-10-20-024` §2.1 原始事件序列：`agent_response` duration 10–182s）。
  - **缓解或停止**：按 D-010 的同一目标收紧为「被允许的读取＋最终答案」；不引入跨事件状态门控（会改 `observeLine` 的无状态契约）；在 spec 与本条明确记录该差异，由计划确认时让用户看到。
  - **处理阶段**：P4；计划确认。
  - **验证**：AC-M5-1 的负例必须穿插 `agent_response` 的 `DONE` 仍落终态。
- **RISK-07**：已合并任务（N2、N6）的环 7 diff 会把后续提交算进范围。
  - **受影响 ID**：FR-CHAIN-002、AC-M3-3。
  - **触发条件**：`baseline..HEAD` 在已合并主仓上包含本任务之后的其它提交。
  - **后果**：越界项里出现与 N2/N6 无关的路径，读者误判。
  - **缓解或停止**：报告 `limits[]` 记该限制；人工对照只看与任务材料相关的路径；不把该限制写成通过或失败。
  - **处理阶段**：P2/T004；verify-code 复核。
  - **验证**：三份报告的 `limits[]` 含该条，AC-M3-3 的人工读回记录逐条说明。
- **OPEN-03**：AC-012 的量化子条（`cacheRead`/`wall_s`/`steps`）不在本卡。
  - **受影响 ID**：FR-CHAIN-005、AC-M3-1。
  - **负责人**：N1 成本观测 owner；本卡只记录主会话成本窗口。
  - **影响**：G1 只证明方法/必读字节与减法对象，不证明主 Agent 四项指标的下降。
  - **处理阶段**：N1 与终末 G1 验收；本卡交接写明该分离。
  - **关闭条件或停止**：N1 完整成本观测到位后由 N1/终末 G1 判；本卡不代替。
- **OPEN-04**：模板生产者缺失已关闭；当前模板 `## 级别与路线` 已随 N8 合入，真实模板可读不等于每个旧任务已有完整来源。
  - **受影响 ID**：FR-CHAIN-001、AC-M1-1。
  - **负责人**：P1/P2 消费者；N8 模板 owner 保唯一事实合同。
  - **影响**：旧任务无节、关键事实缺失、真实选择或原 ref 不可回读仍按 §7.1 回退；本任务历史七输入/原调用缺口不补造。
  - **处理阶段**：P1 来源判定与 P2 安全回读；不新增旧账。
  - **关闭条件或停止**：生产者存在以当前模板 `:35-41` 与037为据；各任务来源充分性另按原件逐项核，未取得保 limitation。
- **OPEN-05**：本阶段异源审查未返回正式可用结论。被拒读取算progress有014/024/016实际依据；012只证provider已退、主调用挂起且无正式record后终止，没有直接close事件/后代stdio持有采样。“进程退但close未触发”仅候选根因，P4保防守性有限可证伪case，不冒该次已证原因。010是首attempt blocked_before_dispatch/provider0，不冒第二次已执行审查。
  - **受影响 ID**：全部 FR/AC 的独立审查事实。
  - **负责人**：本计划 P4（T007 同时修两条：进展定义；以及 provider 进程消失但 `close` 未触发时的有界恢复，使组内不再无限等待）；下一个 build-code 阶段的独立审查仍按既有口径执行。
  - **影响**：没有 wh-review 的 provider 建议；本阶段实际获得的独立意见是 `2026-10-20-028` 的 32 条分析，已逐条处置。
  - **处理阶段**：build-code 首次独立审查；不换执行者、不把 unavailable 写成空 findings 或通过。
  - **关闭条件或停止**：按wh-review真实原件同时核三条件：至少一路completed且parse_outcome=ok；发现或空findings有可回读原始件；保material_coverage.undetermined与真实discarded_facts（有才保，无事实不造占位）。缺一无正式结论；候选根因的防守case通过不关闭原独立审查缺口。
- **RISK-06**：N8 已合入但当前矩阵/来源实现仍可能偏离其真实合同。
  - **受影响 ID**：FR-CHAIN-001、AC-M1-1。
  - **触发条件**：N8 合入后 `flows` 路径或级别声明变化。
  - **后果**：矩阵依据过期。
  - **缓解或停止**：实施前按 `2026-10-20-026` 的重核清单重读；读不到按复杂记缺口。
  - **处理阶段**：build-code 开工前由 P1 owner 重核。
  - **验证**：OI-006 的关闭记录。
- **OPEN-06**：父E4/FR-T4-002原设计漏项由FR-CHAIN-012/013、AC-M7-1/2、P1/T002→P2/T004→P3/T006及P7/T013形成有限补正，行级唯一来源为step-consumer-design附件；这只补设计，不宣实际回填/逐step执行已完成。P7持八steps，P8消费实际原件与必要未闭环case。附件终稿75106 B、sha256 eb878d66ecd91208f5be449302b44acebeb2596792f9afcc1444190bd98f5158，依赖35行已读；080完整分析与081定向处置已回读来源/当前设计修复，082确认本次补正设计；本项据这些原件记录设计补齐，不表示八steps已回填或逐step实际执行完成，实施状态留build-code/verify-code，禁止仅改closed冒实施完成。
- **OPEN-01**：G1 的模板与必读字节面已补基线（029），但改造后尚未同法测量。
  - **受影响 ID**：FR-CHAIN-005、AC-M3-1。
  - **负责人**：P2/T003 实施者。
  - **影响**：当前只取得027/029开工前值与035合入归因（方法+1155、模板含Phase额外+58），尚无N9改造后同法读数；既不能证明改后方法面不增，也不能证明必读全口径不增，原预算保持待验。
  - **处理阶段**：build-code。
  - **关闭条件或停止**：同一清单同法实测并记录；取不到写 `unverified`。
- **OPEN-02**：N9 实施依赖已由用户按 D-013 明确修改；原 N8 整卡验收欠账保留。
  - **受影响 ID**：FR-CHAIN-001、AC-M1-1、AC-M3-3。
  - **负责人**：N9 主会话按 D-013 执行新依赖；N8 原 owner 保留28条欠账，N9 不承接或豁免。
  - **影响**：037证明交付集成；N8最新010交接仍是3条材料/合同pass、28 incomplete，未建立完整四路/N1/G1/首次消费者验收。
  - **处理阶段**：N9 build-code 前已取得真实用户依赖选择；实施按原 Phase 写集推进。
  - **关闭条件或停止**：已取得用户明确选择「修改 N9 依赖，仅消费已交付实现并保留 N8 欠账」，来源 quality/evidence/2026-10-20-084-build-code-dependency-user-decision.md；此关闭只针对 N9 前置，不证明 N8 完整验收通过。

阶段事实限制沿外置062成本源与063图更新原件：原任务起点事件未取得，不以本轮继续重置窗口、不填假0/账行；图更新prompt/语义抽取许可未取得，未更新不等无变化。它们不阻止本任务设计修复，不冒已测。

D-010取舍边界：本计划把真实裸agent_response轮次从progress收紧为仅liveness，是相对“模型推进步骤”字面的工程取舍，依据024真实活锁与016目标RED。本次082已在完整计划展示中明确该设计取舍及正常但长时间仅模型回复可能被判停滞的风险，用户真实确认；保慢provider正例/校准、不加墙钟总时限。不追溯051为当时已接受，不据此接受N8/G1其它欠账或授权实施。

## 13. 业务影响与回归范围

- **既有行为**：`build-prd` 便携工作流结果核对与 terminal 写入；`run-checks` 无参数聚合；N6 已归档页面。
- **本需求影响**：内核加参数但默认不变；`run-checks` 只加一个可选参数；页面模板改十环并承接 N8 三个页面 consumer，normal 两次刷新发生于实际 make-decision，small仍无页、planning仍只方向/交接；审查健康判定改「被拒不算进展」。
- **回归路径**：既有 `portable-workflow` 受影响测试、`run-checks` 无参数输出、N6 页面既有测试按一次 TCR 更新。
- **可能受冲击的业务规则**：review provider 的等待语义与组内结果传播；页面节点分类被十环替代。
- **明确无影响**：N2/N6 材料与 facts；其他任务的 `quality/`；父 PRD 与归档 spec。

## 补充材料

- 十环补遗：`quality/evidence/decision-log-refs/s3/T4-compliance-supplement.md:12-35`（相对父任务库 `skills-framework-redesign-20261014`）。
- 父 AC 原文：父任务 `quality/evidence/decision-log-refs/s3/T4-T10-remaining.md:45-49`、`module-convergence/M10-agent-step-compliance.md:63`、`raw-requirements/2026-10-14-skills-framework-redesign.md:13`、父 PRD `:193-199,203-211,254,459-475,513-514`。
- 单元三件：父任务 `quality/evidence/decision-log-refs/requirement-unit-traceability.md:37-38`。
- 上游提取与差异：`quality/evidence/2026-10-20-022-build-plan-upstream-requirements.md`。
- N8 历史在途形态：026只保原时点；当前集成读 `quality/evidence/2026-10-20-037-n8-into-n9-merge-readback.json`，字节归因读035，验收限制读N8任务库010交接；不把三个事实合并成完成声明。
- 内核与 CLI 事实：`quality/evidence/2026-10-20-023-build-plan-kernel-and-cli-facts.md`。
- 审查健康与页面事实：`quality/evidence/2026-10-20-024-build-plan-review-health-and-page-facts.md`。
- 知识图开工调研：`quality/evidence/2026-10-20-025-build-plan-knowledge-graph.md`。
- G1 基线：`quality/evidence/2026-10-20-027-build-plan-g1-baseline.txt`。

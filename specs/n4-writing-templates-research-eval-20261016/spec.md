# 功能规格：写作规则、四类材料、研究来源与评测合同真的生效

读者：本任务的实施者、每 Phase 的独立审查者与 verify-code 终末验收者。
读完要能：定位用户目标、场景、来源、唯一验收判据，以及每条需求落到哪个 Phase/Task 与哪条 oracle。

> 基于已确认的 `specs/n4-writing-templates-research-eval-20261016/decision-log.md`（D-001…D-022）
> 与两份 ADR（`docs/adr/0049-…`、`docs/adr/0050-…`）。本文件承载产品行为与全局实现设计；
> Phase 文件只写各自差异，`phases/index.md` 只存指针。本文件不重写产品目标，产品目标权威仍在
> 原始需求与 decision-log。

- **功能名**：写作规则与四类材料的生效与校准
- **来源**：`specs/archive/skills-framework-redesign-20261014/prd.md` 的 N4 章节（`:354`–`:371`）、选节合同（`:213`–`:226`）、G1（`:195`）、ORACLE-T3/T9（`:253`、`:259`）；当前 decision-log 的 R-001…R-015 与 U-001…U-008
- **状态**：build-plan 按本轮用户要求刷新计划，等待当前计划确认；本轮未实施 N4、未 commit/push，未作 N4 功能验收

### 本轮 main 合入后的计划基准

本节回答：现在消费哪个基准、旧观察还能证明什么、哪些等待已解除。

- 用户本轮原话：「我把N3任务完成之后提交到main分支了，请你把改动合并到当前分支，再看看当前任务计划是否需要更新，更新完成后把最新的handoff文件路径发给我。」本轮只更新计划，不授权实施 N4。
- 主会话已按授权 ff-only：原 HEAD `aac808bf796de7adb8e2b4c9bfc8be8d337e7b6c` → 当前 HEAD / 本次 main revision `5e6eb6e2c2edb09b8df65db01fe0873d5b606434`（PR #6，N3 交付 tip `418c6115715dbb1c97ef75ce50c6f08856898669`）。原 baseline、task.json 与 decision-log 的历史原件不改。
- N3 已合入、归档、结束写入；当前只读材料在 `specs/archive/n3-review-test-diagnosis-qa-20261016/`。依据外置 N3 最终原件 `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/n3-review-test-diagnosis-qa-20261016/quality/evidence/handoff/2026-10-18-006-verify-code-handoff.md` 的第 1、3、8、10 节与本轮用户确认，原并发写入等待已解除，不再等待被删除的旧 worktree。该原件仍记 verify-code `unverified`、AC009 效益未达及其它 incomplete；合并/物理交付不等于全 AC 质量通过，也不把 N3 这些质量缺口新增为 N4 阻塞。
- FR/AC、28 处原验收集合与五维三态口径不变；旧文字中的「n3 完成后」现按上述交付结束事实满足。N4 内部 P3→P4→P5 共享文件依赖仍有效，后写者重读当前文件并保全 N3 已有方法与测试。
- 本文件 PFACT-001…014、2026-10-17 的行数/计数、RED 探针与报告均是原规划时刻观察，不冒本轮现状或当前测试。旧 `…001-build-plan-silent-layer-red-probe.txt` 只有漏检线索：其合法 control 未成立、purity poisons=false，不能充当有效目标 RED。P1 必须先取得当前合法 control，再用同一夹具跑目标断言；本轮未执行 N4 RED/GREEN。
- 本轮只读行为探针原件 `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/n4-writing-templates-research-eval-20261016/quality/tests/2026-10-18T112541514292Z-post-n3-readonly-probe.txt`：合法/restored control `ok=true`；四英文越层各唯一 pointer-only 错误且 `command_oracle_checks.valid=false`（文案污染）；四中文越层 `ok=true`（漏检）；真实依赖错误使 dependency=false/command=true，缺门禁使 dependency=true/command=false。此为当前缺陷观察，不是尚不存在的冻结测试 RED。当前 consistency 的 failures 为空、仅 catalog 报告；15 名称四登记与 why 三处仍无命中。实现前须按卡片生成并冻结同一测试。
- 本轮生产源码实读：索引英文纯度分支仍在 `stage-content-contracts.mjs:416`，两项文案反推 `valid` 现为 `:732-733`，标题识别现 `:746`；N3 新收紧 `requestsG2`（`:579`）与纯 `.md` owned 写集（`:584-585`）。P1 不重做 G-2，P3 不恢复 YAML 注释豁免，保留 parser 与真实 source.json 的正反断言。
- 来源差量：当前「完整来源权威」精确串为 23 处，另 5 个原集合成员由 N3 改写。P4 对原 28 成员逐路径验收，只改尚缺的部分，不强制重新实施 28 次。P5 复用 N3 已有 review/test/来源登记与 notice，仅补 N4 自身机制/条目。

## 速读卡（30 秒）

本节回答：谁需要什么结果，最主要改动与验收信号是什么。

- **一句话需求**：写四类材料的人真的先读到唯一写作规范，四类模板各自声明本类必留内容并在场可判，材料引用外部来源能回核版本与原链，评测有真实好坏例与独立判定，而机器侧不再把「本该被拦住的写法」漏过去。
- **核心改动点**：
  - 机器侧三处静默层修好：中文标签越层写法从「漏检」变「被拦住」，两项 `valid` 标志改由真实条件判定
  - 一个只报告检查承接写作规则可靠层与四类必留项在场，默认退出 0、不接任何失败路径
  - 四类五个模板各自声明必留/可选/备用分层与三态，来源写版本与回原链，推断就地标注
  - 评测合同落进既有的测试资产治理文件与各模板验收章节：好坏例取真实件、同一把尺、独立判定、匿名不自判
  - 28 处重复的来源权威声明句收敛为 ADR-0046 的「最小便携小卡 + 非权威」一形
  - 验收改独立方匿名盲评，五项维度、三态判定，「无法判断」如实记录
- **最大影响面**：`runtime/stage/stage-content-contracts.mjs` 的校验行为、五个材料模板的字面、28 个 `SKILL.md` 的来源段、四类材料方法文件与三个真实文档出口
- **验收信号**：真实漏检例被拦住且恢复后仍通过；旧材料零字节改动照旧通过；只报告检查退出码仍为 0 且不进 `failures`；28 处收敛后权威唯一处仍是 `skills/catalog.yaml`；盲评逐维度给三态且「无法判断」折算为零

## 来源与决策映射

本节回答：每项需求如何回到原始来源和已确认决定。

| 来源 ID | 决定 ID | FR / AC ID | 状态 / 受影响范围 | 未决 / 交接 |
| --- | --- | --- | --- | --- |
| `R-001` | `D-001`、`D-002`、`D-005`、`D-019` | `FR-N4-001 / AC-T3-2` | `current；四类材料读者与 owner 范围` | `「更短」子句经 U-001 退役，去向见 decision-log「退役登记」` |
| `R-002` | `D-005`、`D-006`、`D-007` | `FR-N4-002 / AC-T3-1、AC-T3-2、AC-T3-3` | `current；四类五个模板的选节声明` | `模板路径由本文件按实读点名，见 OPEN-01` |
| `R-003` | `D-007`、`D-006` | `FR-N4-003 / AC-T3-4、AC-T3-6` | `current；独立交付粒度与 skip 理由` | `无` |
| `R-004` | `D-009`、`D-002`、`D-006`、`D-008` | `FR-N4-004 / AC-T3-5、AC-N4-04` | `current；来源引用、推断标注与 28 处收敛` | `28 处中 19 处与 n3 重叠，见 OPEN-02` |
| `R-005` | `D-018`、`D-019`、`D-002` | `FR-N4-005 / AC-T3-9` | `current；「下降」子句已退役，只留「下游不回改」` | `字节基线与分母口径不得重新引入` |
| `R-006` | `D-001`、`D-016` | `FR-N4-006 / AC-T9-1` | `current；WR001 到达条件与标准本地解释` | `ISO 全文缺口见 OPEN-03` |
| `R-007` | `D-001`、`D-002`、`D-014` | `FR-N4-007 / AC-T9-2` | `current；WR001 一处正文与三处挂载` | `无` |
| `R-008` | `D-003`、`D-002` | `FR-N4-008 / AC-T9-3、AC-008` | `current；可靠层校准与只报告语义` | `精确率只作参考数字，不作启用硬门` |
| `R-009` | `D-002`、`D-014` | `FR-N4-009 / AC-T3-2、AC-T3-5、AC-N4-01、AC-N4-02` | `current；判定器口径的承接` | `OI-009：父件未逐条给各号条文，本卡逐条条件是分解结果` |
| `R-010` | `D-015`、`D-016`、`D-017` | `FR-N4-010 / AC-N4-06、AC-N4-07` | `current；15 项采用与 why 三处落点` | `why 三处落点当前零锚点，见 OPEN-04` |
| `R-011` | `D-005`、`D-006`、`D-007` | `FR-N4-011 / AC-T3-3、AC-T3-6、AC-T3-10` | `current；选节合同全表的三态与判定器` | `无` |
| `R-012` | `D-018`、`D-019`、`ADR-0049:25` | `FR-N4-013 / AC-N4-08`（声明义务）与 `FR-N4-012 / AC-004、AC-013`（链路与分级） | `current；G1 只留声明义务` | `字节子句与字节分母已退役` |
| `R-013` | `D-020` | `FR-N4-006 / AC-T9-1` | `current；最小读取集与标准范围限制` | `不声称完整符合 ISO` |
| `R-014` | `D-017` | `FR-N4-012 / AC-004` | `current；与 n3 互斥合入定序` | `19 处真重叠与 n3 完成事实，见 OPEN-02` |
| `R-015` | `D-021`、`D-019` | `FR-N4-012 / AC-013` | `current；供 N5/N6/N8 的整卡结果` | `本卡不给首切片` |
| `U-001` | `D-018` | `FR-N4-005 / AC-004、AC-013` | `current；字节下降口径退役` | `不得重新引入字节基线或分母` |
| `U-002` | `D-014`、`D-006`、`D-011` | `FR-N4-009 / AC-N4-01、AC-N4-03` | `current；中文化只加不改 + 修静默层` | `归档与在跑材料零字节改动是验收项` |
| `U-003` | `D-017`、`D-021` | `FR-N4-012 / AC-004` | `current；原 n3 外部等待已由本轮用户确认与 main 合入/写入结束事实满足` | `N4 实施仍须当前计划确认；不宣称 N3 全 AC 通过` |
| `U-004` | `D-019` | `FR-N4-001 / AC-013` | `current；验收对象是产出文档质量` | `判定者与样本清单见 OPEN-05` |
| `U-005` | `D-015` | `FR-N4-010 / AC-N4-07` | `current；why 定为补强偏缺口` | `答复为结论级转述，见 OPEN-06` |
| `U-006` | `D-001` | `FR-N4-007 / AC-T9-1` | `current；三处真实文档出口进范围` | `本卡只落到达条件，方法正文归 N7` |
| `U-007` | `D-008` | `FR-N4-004 / AC-N4-04` | `current；28 处本轮一次收敛` | `无` |
| `U-008` | `D-019` | `FR-N4-005 / AC-013、AC-N4-05` | `current；五项维度与三态定死` | `答复为结论级转述，见 OPEN-06` |

每条 FR/AC 都能回到本表；范围修订只追加受影响映射与修订说明，不另建需求账本。

## 1. 需求解释：问题与紧迫性

本节回答：用户遇到什么问题，为什么现在处理。

本仓已经写下了大量写作规范与材料模板，但规范与产出之间缺少可观察的因果链。已经实测过的形状有三种。第一种是「规范写了但没人读」：唯一写作规范 WR001 的到达条件原文是「创建或改写 agent 方法时」，因此写 `spec.md`、写 decision-log、写 PRD 时字面不触发；`docs/adr/0043-document-standards-checks-are-report-only.md:15-17` 把这个形状记为要求被遗失的直接原因，并在同处记下当时实测「36 处指针 + 零挂载 + 零可执行事实」。

第二种是「机器本该拦住却漏过去」：纯指针索引里用中文写 `- **预期退出码**：0` 一类要点，今天的 `runtime/stage/stage-content-contracts.mjs:416` 只匹配四个英文字面，中文写法不被拦住。同文件 `:756` 与 `:757` 两项 `valid` 标志又是由错误文案正则反推出来的，文案一改就会静默变真，掩盖真实缺陷。这两个静默层都在生产校验路径上。

第三种是「来源方法没有程序消费者」：`runtime/evidence/research-report.mjs` 在本仓只有 `tests/contract/research-report-current.test.mjs:16` 一条 import，本仓自己的 `docs/architecture/move-map.json:349` 也把该测试记作模块的直接消费者；`skills/deep-research/SKILL.md` 在 `skill-deps.yaml` 里被声明，runtime 只解析它的路径而不读它的正文。

这三件事合起来的效果是：下游读到的是「规范存在」，不是「规范生效」。本任务要改变的就是这个差别，并让改动之后的文档质量由不参与改动的一方独立判定。

## 2. 背景、目标与范围

本节回答：当前产品基础、交付目标与范围是什么。

### 背景

本节回答：哪些既有能力与决定影响本需求。

本仓已有四类材料模板与工作流入口，已有只报告检查器（`tools/cli/check-skill-consistency.mjs` 的 `checkSkillConsistency(root)`，返回 `{failures, reports}`，`reports` 走 stdout、从不参与退出码），已有生产校验器（`runtime/stage/stage-content-contracts.mjs` 的 `validatePostPhaseContract`，由 `tools/cli/stage-runtime.mjs` 在代码审查路径上真实执行），已有唯一来源权威（`skills/catalog.yaml`）与中英字段别名表（`FIELD_LABEL_ALIASES`）。

`ADR-0043` 已定「能机械判定的部分做成只报告的检查器：不评分、默认退出码 0、不接任何 stage/gate/CI 失败路径、未跑即 `unknown`」；`ADR-0046` 已定来源登记收敛为 `skills/catalog.yaml` 一处机器权威，其余保留最小便携小卡；`ADR-0049` 退役字节下降验收、改独立方匿名盲评；`ADR-0050` 定中文化只加不改并先修中文识别静默漏检。本卡在这些既有决定内实施，不改它们的取值。

### 目标

本节回答：用户能获得哪些可验证结果。

- 写四类材料、写阶段报告/交接、写阶段反思、写 PR/交付说明的人，在动笔前必经唯一写作规范，且这一步有独立可读的产物可核
- 四类五个模板各自声明本类必留内容与在场三态；可客观判定的必留项缺失被只报告检查报出，只能靠散文声明的项如实报「无法判定/未覆盖」
- 材料引用外部来源时带版本与回原文直达链接；推断就地紧跟一句标注
- 28 处重复的来源权威声明句收敛为「最小便携小卡 + 明示非权威」，权威唯一处仍是 `skills/catalog.yaml`
- 机器侧不再漏掉中文标签的越层写法；两项 `valid` 标志不再由错误文案反推
- 评测合同落进既有的 `docs/architecture/test-asset-governance-rules.md` 与四类模板验收章节：好坏例取真实件、同一把尺、独立判定、匿名不自判
- 整体验收由独立方匿名盲评给出，五项维度逐项三态，`无法判断` 如实记录且不折算成「更好」

### 范围内

本节回答：本期具体交付哪些业务能力。

- 机器侧三处静默层修复与一个只报告检查的扩展
- 四类五个模板的分层声明、三态写法、来源版本与回原链、推断标注、验收类标题统一
- 四类方法与仓内入口的写作动作前置、来源收敛、why 落点、真实文档出口到达条件
- 评测合同的两处既有落点（治理文件与模板验收章节）
- 15 项外部做法的逐项落点与四文件登记
- 独立方匿名盲评的验收口径

> 非目标只在第 10 节维护，避免两份真相。

## 3. 用户场景与状态覆盖

本节回答：谁在什么条件下触发动作，正常与异常结果是什么。

### SCN-001：材料作者写四类材料中的任意一类

本节回答：该场景的角色、前提、触发与可观察结果是什么。

- **角色**：四类材料作者（make-decision、build-plan、build-prd 主会话）
- **前提**：当前任务已确认方向；本卡 10 处必做动作已落地
- **触发**：开始写 `decision-log.md`、`spec.md`、`phases/P<n>.md`、`phases/index.md` 或 PRD
- **结果**：写作动作步骤里先读到 WR001 再动笔；`spec.md` 的 AC 用四行式标签；模板声明的必留项在场
- **回写**：改动落在 `skills/decision-log/SKILL.md`、`skills/spec-specify/SKILL.md`、`skills/spec-plan/SKILL.md`、`skills/spec-prd/SKILL.md` 与三个对应 workflow 入口的写作步骤；AC-T9-1 与 AC-T9-2 据此判定

### SCN-002：独立验收者跑只报告检查并读四类模板

本节回答：该场景的角色、前提、触发与可观察结果是什么。

- **角色**：不参与本次改动的独立验收者
- **前提**：四类五个模板已声明必留层与三态
- **触发**：在认证 worktree 跑 `check-skill-consistency`
- **结果**：可客观判定的必留项缺失被报出；仅散文声明的项报「无法判定/未覆盖」；退出码仍为 0，报告不进 `failures`
- **回写**：AC-T3-2、AC-T9-3、AC-008、AC-N4-02 据此判定

### SCN-003：机器校验器读到中文标签的越层写法

本节回答：该场景的角色、前提、触发与可观察结果是什么。

- **角色**：`runtime/stage/stage-content-contracts.mjs` 的 `validatePostPhaseContract` 与其真实调用方
- **前提**：一个纯指针 `phases/index.md` 里写了 `- **预期退出码**：0` 一类要点
- **触发**：校验器读这份索引
- **结果**：该写法被拦住并报出具体违规；恢复为纯指针写法后仍通过；`dependency_validation.valid` 与 `command_oracle_checks.valid` 由真实条件判定，不再因无关注释文案翻转
- **回写**：AC-N4-01 与本卡的冻结负例测试据此判定

### SCN-004：材料作者引用外部来源

本节回答：该场景的角色、前提、触发与可观察结果是什么。

- **角色**：四类材料作者与下游实施者
- **前提**：来源权威唯一处为 `skills/catalog.yaml`
- **触发**：材料引用一个外部来源，或写下一句推断
- **结果**：引用带版本与回原文直达链接，取不到时写 `unverified`；推断就地紧跟标注；28 个 `SKILL.md` 各只留最小便携小卡与非权威声明，仍能回 catalog 与外部原文根
- **回写**：AC-T3-5、AC-N4-04 据此判定

### SCN-005：独立判定者做匿名盲评

本节回答：该场景的角色、前提、触发与可观察结果是什么。

- **角色**：verify-code 指派的不参与本次改动的独立判定者
- **前提**：判定标准与样本清单在判定前定死；样本匿名
- **触发**：对改前（归档真实材料）与改后（同题重写）样本逐维度判定
- **结果**：五项维度各给「更好／打平／无法判断」与具名原因；`无法判断` 不折算成「更好」；某维度在全部样本上都「无法判断」时该维度记未达成
- **回写**：AC-013、AC-N4-05 据此判定

### SCN-006：必留项缺失与检查自身不可用

本节回答：该场景的角色、前提、触发与可观察结果是什么。

- **角色**：只报告检查的执行者与读报告的人
- **前提**：受控制造一处可判定的必留项缺失（如纯指针 index 越层承载正文、`## L2` 截断点缺失、Phase 写集位置缺失）
- **触发**：跑只报告检查；再受控制造检查自身不可用（命令不存在、依赖缺失或执行失败之一）
- **结果**：可判定缺失被报出；仅散文声明的项报「无法判定/未覆盖」；检查不可用时如实记「未覆盖」或 `unknown` 并保留原始失败与检测输出，不静默通过、不改退出码、不写进 `failures`、不阻断其它工作，同一不可用事实只记录一次
- **回写**：AC-N4-02、AC-N4-05 据此判定

### SCN-007：改动之后下游回读材料

本节回答：该场景的角色、前提、触发与可观察结果是什么。

- **角色**：下游真实消费者（N5/N6/N8 的作者与独立验收者）
- **前提**：本卡已交付四类材料与模板
- **触发**：下游照常消费其所需内容
- **结果**：下游所需的条件、失败与权限边界仍在场，下游不回改材料；归档材料与其它在跑任务材料零字节改动
- **回写**：AC-T3-9、AC-N4-03、AC-004 据此判定

### 状态覆盖清单

本节回答：默认、空、错误、加载、取消、边界、权限与竞态分别如何处理。

- [ ] **默认态**：SCN-001；材料作者按既有写法产出，模板声明的必留项在场
- [ ] **空态**：SCN-003；零输入/空输入必须返回具体缺项，`unknown` 不填 0（AC-T3-7）
- [ ] **错误态**：SCN-006；必留项缺失报缺失，检查自身不可用记「未覆盖／`unknown`」并保留原始失败
- [ ] **加载态**：N/A — 本卡无异步加载视图，检查与校验器都是同步本地执行
- [ ] **取消态**：SCN-006；检查被取消按 D-022 记「未覆盖」并保留原始失败与检测输出，回滚保持原报告不变，不把取消读成通过
- [ ] **边界态**：SCN-003；中文标签越层写法必须被拦住，而未被本次改动覆盖的 `## Appendix A — 验收判据（唯一权威）` 标题**不**进识别集合（ADR-0050:28）
- [ ] **权限态**：SCN-005 与 SCN-007；判定者不得是实现者，写主与判定者分离；归档与其它在跑任务材料零字节改动（AC-N4-03）
- [ ] **竞态**：SCN-007；19 个路径与 n3 重叠，实施按路径互斥串行，后写方在锁内重读并保全先写方行为（OPEN-02）

## 4. 产品事实与假设（PFACT）

本节回答：哪些事实已核实，哪些推断或未知影响需求。

- **PFACT-001**：`runtime/stage/stage-content-contracts.mjs:416` 的索引纯度检查当前只匹配四个英文字面，中文标签越层写法不被拦住；同文件 `:756`、`:757` 两项 `valid` 标志由错误文案正则反推
  - **状态**：`verified`（原规划观察，不是有效目标 RED；当前合法 probe 见基准段）
  - **证据或来源**：本卡历史执行原件 `quality/tests/2026-10-17-001-build-plan-silent-layer-red-probe.txt`；生产源码 `runtime/stage/stage-content-contracts.mjs:416`、`:756`、`:757`、`:146`
  - **关联**：FR-N4-009、AC-N4-01、RISK-01

- **PFACT-002**：`tools/cli/check-skill-consistency.mjs` 当前没有「材料写作」或「必留项」概念，也不读任何模板文件；其 `reports` 通道走 stdout 且从不参与退出码
  - **状态**：`verified`
  - **证据或来源**：本卡真实执行的原件 `quality/tests/2026-10-17-002-build-plan-report-only-gap.txt`；源码 `tools/cli/check-skill-consistency.mjs:15`、`:153-170`
  - **关联**：FR-N4-008、AC-008、AC-N4-02

- **PFACT-003**：四类五个模板路径已按仓内实存文件点名并逐个实读存在
  - **状态**：`verified`
  - **证据或来源**：`skills/decision-log/templates/decision-log-template.md`（211 行）、`skills/spec-specify/templates/spec-template.md`（432 行）、`skills/spec-plan/templates/phase-template.md`（504 行）、`skills/spec-plan/templates/index-template.md`（12 行）、`skills/spec-prd/templates/prd-template.md`（138 行）——本步逐个实读存在与行数
  - **关联**：FR-N4-002、FR-N4-011、AC-T3-1、OPEN-01

- **PFACT-004**：把模板正文当逐字标准的契约测试实际是 3 个文件、只覆盖 2 个模板；`phase-template.md` 占 2 个，`spec-template.md` 占 1 个，其余三个模板零测试引用
  - **状态**：`verified`
  - **证据或来源**：`tests/contract/post-build-plan-missing-index.test.mjs:349-350`（读 `phase-template.md`）、`tests/contract/card05-author-material-consumer.test.mjs:15-27`（读 `phase-template.md` 四个注释块）、`tests/contract/acceptance-object-required-fields.test.mjs:6-16`（读 `spec-template.md` 的 marker 与 producer 逐字字节）；runner 均为 vitest
  - **关联**：FR-N4-009、AC-N4-03、RISK-02

- **PFACT-005**：`tests/contract/post-build-plan-missing-index.test.mjs:350` 依赖的切分串 `#### 示例：` 在 `phase-template.md` 里不存在，该次 `split` 当前是空操作
  - **状态**：`verified`
  - **证据或来源**：`grep -cF '#### 示例：' skills/spec-plan/templates/phase-template.md` 与 `skills/spec-specify/templates/spec-template.md` 均为 0；测试 `:350` 的 `.split("#### 示例：")[0]` 因此不截断
  - **关联**：FR-N4-009、RISK-02

- **PFACT-006**：`runtime/evidence/research-report.mjs` 在本仓没有生产调用点，唯一 import 在 `tests/contract/research-report-current.test.mjs:16`；注册资本 `docs/architecture/move-map.json:349` 也把该测试记作直接消费者
  - **状态**：`verified`
  - **证据或来源**：全仓 `grep` 每条导出符号，8/9 个符号在测试文件外零命中；`docs/architecture/move-map.json:349`；`runtime/adapters/local-skill-resolver.mjs:124` 只返回 SKILL.md 路径不读其正文
  - **关联**：FR-N4-004、AC-T3-5、OPEN-03

- **PFACT-007**：五个模板都有一个生产 runtime 读者，读的是字节稳定性而不是文义
  - **状态**：`verified`
  - **证据或来源**：`runtime/distribution/skill-bundle-release.mjs:252-255` 收集 bundle locators、`:345-346` `captureSourceBytes()` 调 `readStableFile(root, locator, "release source")`；入口链 `runtime/distribution/runner-release.mjs:7`、`:160`，CLI main `skill-bundle-release.mjs:489`；bundle 声明见 `skills/decision-log/skill-bundle.json:6`、`skills/spec-specify/skill-bundle.json:6`、`skills/spec-plan/skill-bundle.json:6-7`、`skills/spec-prd/skill-bundle.json:6`
  - **关联**：FR-N4-002、AC-N4-03、RISK-03

- **PFACT-008**：`why`（追问代码成因）的三个指定落点当前一个锚点都没有
  - **状态**：`verified`
  - **证据或来源**：对 `skills/decision-log/SKILL.md`、`skills/spec-analyze/SKILL.md`、`workflows/verify-code/SKILL.md` 三个文件跑 `grep -nE "why|成因|逐级回读|谱系|git blame|竞争假设"` 均 exit 1；全仓 `逐级回读` 只有 1 处命中，且是 decision-log 自身在描述该落点
  - **关联**：FR-N4-010、AC-N4-07、OPEN-04、RISK-04

- **PFACT-009**：四个登记文件当前都不含 15 项中任何一项的条目；`skills/catalog.yaml` 只登记两个来源仓库
  - **状态**：`verified`
  - **证据或来源**：`skills/catalog.yaml`（1623 行）与 `skills/reuse-registry.md`、`THIRD_PARTY_NOTICES.md`、`docs/architecture/move-map.json` 逐项 grep 15 个条目名，全部零命中；`skills/catalog.yaml:23` `addy-agent-skills`、`:35` `pstack` 是既有项目条目
  - **关联**：FR-N4-010、AC-N4-06、RISK-05

- **PFACT-010**：`skills/catalog.yaml` 的来源登记（ADR-0046 的机器权威处）与 28 个 `SKILL.md` 的重复权威声明句是两件事；本卡收敛的是后者
  - **状态**：`verified`
  - **证据或来源**：`grep -rl "完整来源权威" --include="SKILL.md" skills/ | wc -l` → 28（唯一处仍为 `skills/catalog.yaml`）；`grep -rn WR001 runtime tools tests` → 0 行，指向 WR001 的指针句在本步实测为 42 个文件（36 `skills/` + 5 `workflows/` + 1 `docs/`）
  - **关联**：FR-N4-004、AC-N4-04

- **PFACT-011**：原规划时本卡与 n3 已申报写集真重叠 19 路径，其中 9 个当时有未提交改动；这是旧观察，不是当前锁或等待
  - **状态**：`verified`（历史观察；当前状态见「本轮 main 合入后的计划基准」）
  - **证据或来源**：原规划按 n3 的 114 路径与本卡声明求交为 19；现只读 N3 材料在 `specs/archive/n3-review-test-diagnosis-qa-20261016/`，不再引用已删除 worktree 的命令作为当前证据
  - **关联**：FR-N4-012、AC-004、OPEN-02、RISK-06

- **PFACT-012**：本卡写集表自检注释称「10 个与另一张卡重叠」，但同表实际标记「与另一张卡重叠」的数据行是 19 行，且该 19 条经合并 n3 声明写集逐条核实
  - **状态**：`verified`
  - **证据或来源**：`awk` 统计写集表数据行 54 行、含 `28 处之一` 28 行、含 `与另一张卡重叠` 19 行；前述求交同样得 19 条
  - **关联**：FR-N4-012、AC-004、OPEN-02

- **PFACT-013**：ISO §5.2.4–Annex B 全文未取得，本卡不声称完整标准符合
  - **状态**：`verified`
  - **证据或来源**：decision-log OI-002 与 D-020；父需求 prd:367、prd:369
  - **关联**：FR-N4-006、AC-T9-1、RISK-07

- **PFACT-014**：验收对象所需的最小五项在本任务无法全部为真值，`service`、`route`、`viewport` 三项是观察到的「不存在」而不是没观察到
  - **状态**：`verified`
  - **证据或来源**：本卡真实执行的原件 `quality/evidence/2026-10-17-build-plan-acceptance-object-check.json`；三源适用性逐项记 `ui_scope: false` 与真实理由
  - **关联**：AC-T9-1、RISK-08

## 5. 功能需求

本节回答：产品必须具备哪些独立行为与失败边界。

### 写作规则生效（N4WR）

本节回答：本功能域如何把各项用户行为串起来。

写作规则的生效由一段可观察的因果链组成：材料作者在动笔前读到唯一规范正文；模板声明本类必留内容；只报告检查把可判定的缺失报出来；独立方读产物判定。「读到」不由入口文字的存在证明，而由写作动作步骤里的必做动作与实际产出的材料共同证明。

- **FR-N4-001**：改动完成后，四类材料读者能用完整产物独立行动，且整体产出文档质量由独立方匿名盲评判定更高或打平；本卡是写作规则、四类模板、研究来源与评测合同的完整 owner，不给兄弟卡首切片
  - **范围边界**：包括四类材料、三处真实文档出口与评测合同；不包含「材料总字节下降」这一已退役口径
  - **依据**：R-001、U-004、D-019、ADR-0049；服务对象为 `prd:356` 的 US-03／US-04／US-06／US-10
  - **场景**：SCN-001、SCN-005、SCN-007
  - **验收**：AC-013

- **FR-N4-002**：四类五个模板各自声明本类的必留必要内容，声明的必留集合与产物实际在场节一致；可客观判定的必留项缺失被报出，仅散文声明的必留项如实报「无法判定/未覆盖」
  - **范围边界**：包括五模板的节级声明、只报告检查的在场报告、以及「按任务选 P1/P2 并写出选节理由」（理由写在既有材料导航/节声明中，`prd:217`）；不新增全局机器清单、不新增机器标题约定
  - **依据**：R-002、R-011、D-005、D-006、PFACT-003、PFACT-007
  - **场景**：SCN-002
  - **验收**：AC-T3-2

- **FR-N4-003**：四类材料各自有可单独交付、可单独判定的结果与对应 FR/AC；`not-applicable` 带不适用理由与依据，`deferred` 三件齐（责任卡、触发条件、受影响结果），且 P0 标题不被 `deferred` 抹掉
  - **范围边界**：包括四类交付粒度与三态写法；不把 P1/P2 固定成清单、不用 `not-applicable` 遮缺设计
  - **依据**：R-003、R-011、D-007
  - **场景**：SCN-002、SCN-006
  - **验收**：AC-T3-4、AC-T3-6

- **FR-N4-004**：材料引用外部来源时写清版本与回原文直达链接，取不到写 `unverified`；推断就地紧跟一句标注；28 处重复的来源权威声明句收敛为「最小便携小卡 + 明示非权威」一形，权威唯一处仍是 `skills/catalog.yaml`
  - **范围边界**：包括来源引用写法、推断标注与 28 处收敛；不删除便携小卡本体、不删除 catalog 坐标、不建第二处权威
  - **依据**：R-004、U-007、D-008、D-009、D-010、PFACT-006、PFACT-010
  - **场景**：SCN-004
  - **验收**：AC-T3-5、AC-N4-04

- **FR-N4-005**：改动之后下游真实消费者回读其所需内容时不被追回改；材料所需的条件、失败与权限边界仍在场；本卡不设任何字节基线、不报字节分母、不用「基线不增」核销
  - **范围边界**：包括下游不回改、并发模板修改由本卡归口、缺段/失联报告、以及「读回发现消费者失去条件则恢复该内容」；不把字节、行数、单节占比、句长当验收或拦截条件；不改 oracle 换短（短不以牺牲判据为代价，禁止为缩短而改判定器）
  - **依据**：R-005、R-012、U-001、U-008、D-018、D-019、ADR-0049
  - **场景**：SCN-007
  - **验收**：AC-T3-9、AC-013

- **FR-N4-006**：两份标准的语言中性核心规则在本仓有明确解释与已读范围，写 `spec.md` 与写 decision-log 的真实写作必经该规则；ISO §5.2.4–Annex B 未取得全文时保持范围限制，不声称完整符合
  - **范围边界**：包括 WR001 的本地解释、范围限制、以及设计与实施前先读 `prd:370` 的最小读取集与 `prd:367` 点名的 mattpocock `writing-for-agents` 及其本地配套（当前规则 owner 仍是本仓 WR001，四类模板消费其指针而非重抄）；不把未读条文当要求、不新建标准符合性判定器
  - **依据**：R-006、R-013、D-001、D-016、D-020、PFACT-013
  - **场景**：SCN-001
  - **验收**：AC-T9-1

- **FR-N4-007**：WR001 正文唯一处不变，并在四类材料方法、仓内入口与只报告检查三处各有真实挂载与真实消费者；阶段报告/交接、阶段反思、PR/交付说明三处出口的写作动作也必经该规则
  - **范围边界**：包括三处挂载与三处出口到达条件；不写三个出口的方法正文（方法正文归 N7）、不在四处复制规范条文
  - **依据**：R-007、U-006、D-001、D-002、D-014
  - **场景**：SCN-001、SCN-002
  - **验收**：AC-T9-2

- **FR-N4-008**：只报告检查对四类真实文档的人工标注样本分项报真阳性、假阳性与分母；精确率数值只作人读参考，不作启用硬门；报告默认退出 0、不评分、不加字数上限、不接任何 stage/gate/CI 失败路径
  - **范围边界**：包括可靠层校准、只报告语义与「低可靠的项退回模板/人工指引而不进自动检测」；中文计数按 `prd:361` 的既定算法执行（汉字各 1，连续拉丁/数字串 1，行内代码 1，标点与空格不计，以 `。`/`！`/`？` 断句，排除机器字面与引用块并说明例外），并只用它做参考数字；不设 30/40 字或 400 字节硬限、不用精确率数值作拦截条件
  - **依据**：R-008、D-002、D-003、PFACT-002、ADR-0043
  - **场景**：SCN-002；覆盖集合含空标题、占位、超长句与允许例外四类（`prd:259`）
  - **验收**：AC-T9-3、AC-008

- **FR-N4-009**：中文标签的越层写法从「漏检」变「被拦住」，恢复为纯指针写法后仍通过；两项 `valid` 标志改由真实条件判定而非匹配错误文案；旧材料沿整篇兜底与既有中英对照表继续可读，归档材料与其它在跑任务材料零字节改动
  - **范围边界**：包括索引纯度、两项 `valid` 标志与三个逐字 oracle 测试同步；不改 17 个英文必填字段名、不改错误文案、不把 `## Appendix A — 验收判据（唯一权威）` 追加进识别集合
  - **依据**：R-009、U-002、D-014、PFACT-001、PFACT-004、PFACT-005、ADR-0050
  - **场景**：SCN-003、SCN-006、SCN-007
  - **验收**：AC-N4-01、AC-N4-03

- **FR-N4-010**：15 项外部做法逐项只吸收一个具体机制、落进既有文件；三项重复/不适用项写清落点与出处交独立方核；`why` 定为补强偏缺口并在三个落点各可读回；未新增技能文件、未新增控制面、未搬整套清单
  - **范围边界**：包括 15 项落点、四文件登记与**逐行生效判据**（每项写出该采用的最低可观察生效判据，并按该判据做一次真实消费者首验，例如 `hillclimb` 的正反负载可区分与证据不足时 `inconclusive`、`eval` 的输入预算可比与判定者不见模型名、`documentation-and-adrs` 的重号负例被报告，机制落在 `skills/decision-log/SKILL.md` 的「ADR 仅在难以反转、无背景会意外、有真实取舍三项同时成立时记录」那段：新增 ADR 前先核当前最大编号与既有重复号，出现重号时报告而不静默占用）；不引入 feature flag、放量阈值、错误预算、十路 lane、`check-plan.mjs`、逐次台账或 MCP/`gh` 依赖
  - **依据**：R-010、U-005、D-015、D-016、D-017、PFACT-008、PFACT-009
  - **场景**：SCN-001、SCN-002
  - **验收**：AC-N4-06、AC-N4-07

- **FR-N4-011**：`P0/P1/P2` 决定章节是否在场，`written/not-applicable/deferred` 说明在场内容的状态，两者不互相代替；判定器只核「模板声明的 P0 在场、在场声明与内容一致」；不同任务的 P1/P2 集合不相同
  - **范围边界**：包括选节合同全表与判定器口径；不把候选节固定必填、不让篇幅指标进评分或阻断槽
  - **依据**：R-011、R-003、D-005、D-006、D-007
  - **场景**：SCN-002、SCN-006
  - **验收**：AC-T3-3、AC-T3-6、AC-T3-10

- **FR-N4-013**：G1 的声明义务在本卡内履行并逐条写出——声明本卡删除、合并或降档了什么；只加规则而未简化既有物时如实写明这一点，不声称已简化；声明不实由独立方用真实 diff 与读回发现，记为事实而不作门
  - **范围边界**：包括删除/合并/降档的三类声明与「只加规则」的如实标注；不设字节基线、不报净字节、不用分母核销（ADR-0049:26）
  - **依据**：R-012、D-018、ADR-0049:25、`prd:195`
  - **场景**：SCN-007
  - **验收**：AC-N4-08

- **FR-N4-012**：与 n3 重叠的路径按路径互斥串行合入，后写方在锁内重读并保全先写方行为，本卡不替 n3 补首次落点；本卡实施开工条件包含「n3 整卡完成」这一真实事实
  - **范围边界**：包括 19 个重叠路径的定序与开工前置；不因同路径要求本卡先交首切片、不改宿主并发配置
  - **依据**：R-014、R-015、U-003、D-017、D-021、PFACT-011、PFACT-012
  - **场景**：SCN-007
  - **验收**：AC-004

> 新需求使用 `FR-DOMAIN-NNN`；FR 与 AC 的 DOMAIN 只写单段大写 `[A-Z][A-Z0-9]*`，序号正好三位。来源只认 R-、U-、PRD-、CARD- 开头的编号；每条 FR 至少连接一个 PFACT、SCN 和 AC。AC-T3-*／AC-T9-*／AC-004／AC-008／AC-013 是父需求与本卡确认的既有编号，`AC-N4-*` 在本卡命名空间内，两组同号一一对应。

## 6. 模块划分

本节回答：哪些产品职责可独立交付与验收。

### 机器侧校验与只报告检查

本节回答：本模块负责什么、对外提供什么、依赖谁。

- **负责什么**：把「本该被拦住的写法」拦住；把写作规则可靠层与四类必留项在场情况报出来
- **对外提供什么**：`validatePostPhaseContract` 的既有 `{ok, errors, facts}` 形状与 `checkSkillConsistency` 的既有 `{failures, reports}` 形状
- **依赖谁**：既有 `FIELD_LABEL_ALIASES` 与 `labelAlternation`（同模块私有）、既有 `reports` 通道、既有 `run-checks` 步骤
- **测试边界**：新冻结负例证明漏检变拦住；两项 `valid` 标志各有真实条件判定与反向用例

### 四类材料模板层

本节回答：本模块负责什么、对外提供什么、依赖谁。

- **负责什么**：声明本类必留重要内容、可选与备用的选节规则、在场三态、来源引用与推断标注写法
- **对外提供什么**：五个模板文件的可读正文与节级声明
- **依赖谁**：WR001 唯一规范正文、ADR-0046 的便携小卡形状、选节合同表
- **测试边界**：每类模板的必留项在场与三态各有可核读回；三个逐字 oracle 测试同步后仍绿

### 四类方法与真实文档出口

本节回答：本模块负责什么、对外提供什么、依赖谁。

- **负责什么**：把「写前先读 WR001」落成写作动作步骤里的必做动作；落 why 的三处落点；收敛 28 处来源权威句
- **对外提供什么**：各 `SKILL.md` 与 workflow 入口的可读正文
- **依赖谁**：`skills/catalog.yaml` 唯一权威、既有中英对照表、n3 完成事实（重叠路径）
- **测试边界**：10 处必做动作逐处读回；28 处逐路径收敛前后 grep 比对

### 评测合同与验收口径

本节回答：本模块负责什么、对外提供什么、依赖谁。

- **负责什么**：把好坏例、同一把尺、独立判定、匿名与不自判落进既有治理文件与模板验收章节；把 15 项采用登记进四个既有登记文件
- **对外提供什么**：`docs/architecture/test-asset-governance-rules.md` 的可读正文与四个登记文件的新增条目
- **依赖谁**：既有治理文件、`ADR-0037`、`ADR-0043`、`ADR-0050`
- **测试边界**：逐段落点读回；15 项逐项落点读回与登记条目核对

## 7. 关键实体

本节回答：哪些字段、约束和关系改变用户行为。

- **字段标签别名表**：
  - **定义**：`runtime/stage/stage-content-contracts.mjs` 的 `FIELD_LABEL_ALIASES`，经 `labelAlternation()` 消费，是中英字段名的唯一机器权威
  - **字段和约束**：60 条登记项；新增中文写法只能追加别名，不得替换或删除既有英文名与错误文案
  - **关系**：索引纯度检查、`fieldValue`、`phaseWriteSet` 都从它取候选标签；本卡只让索引纯度检查也消费它

- **完整性检查事实**：
  - **定义**：`validatePostPhaseContract` 返回的 `facts.dependency_validation` 与 `facts.command_oracle_checks`
  - **字段和约束**：各含一个 `valid` 布尔；本卡后由真实条件判定，不再扫错误文案
  - **关系**：`ok` 仍由 `errors` 长度决定；`valid` 与 `ok` 各自独立，`valid` 为真不表示 `ok` 为真

- **只报告报告**：
  - **定义**：`checkSkillConsistency(root)` 返回的 `reports` 数组中的条目
  - **字段和约束**：走 stdout，前缀 `[check-skill-consistency] `；从不进入 `failures`；不参与退出码
  - **关系**：`failures` 决定退出码；`run-checks` 只消费子进程退出码

- **必留项在场声明**：
  - **定义**：各模板章节声明里写明的本类必留/可选/备用归类与三态
  - **字段和约束**：`P0/P1/P2` 决定是否在场，`written/not-applicable/deferred` 说明在场状态；`not-applicable` 带理由与依据，`deferred` 带责任卡、触发条件与受影响结果
  - **关系**：只报告检查对可客观判定项报缺失，对仅散文声明项报「无法判定/未覆盖」

- **便携小卡**：
  - **定义**：28 个 `SKILL.md` 来源段收敛后的形态，只留最小坐标与明示非权威声明
  - **字段和约束**：可回 `skills/catalog.yaml` 与外部原文根；不删本体、不删坐标
  - **关系**：唯一权威仍在 `skills/catalog.yaml`

## 8. 数据和生命周期

本节回答：数据如何产生、更新、迟到、保留与清理。

- **数据粒度**：一次检查调用对应一份 `reports` 与一份 `failures`；一次校验调用对应一份 `{ok, errors, facts}`
- **数据时效**：每次调用读当前工作树文件；不新增缓存、不新增持久状态
- **缺失或迟到**：检查自身不可用时记「未覆盖」或 `unknown` 并保留原始失败与检测输出；同一不可用事实只记录一次
- **预览与正式**：不适用 — 本卡产物是仓内材料与检查输出，无预览态
- **当前与历史**：历史归档材料与其它在跑任务材料只读，零字节改动；旧决定与旧编号保留原 ref，不覆写
- **归属与清理**：检查输出为一次性环境读数，不搬进证据区；原始测试输出与审查原件各留一份

## 9. 兼容性预留

本节回答：既有消费者如何保持，扩展承诺止于哪里。

- **既有消费方**：`run-checks` 的聚合退出码语义、`stage-runtime` 的校验调用路径、四类材料的既有英文写法、`tests/contract/` 三个逐字 oracle 测试、五个模板的发布期字节读者
- **命名预留**：复用既有 `checkSkillConsistency(root)` 与 `validatePostPhaseContract`，不承诺新增顶层 CLI 入口
- **容器预留**：N/A — 不新增持久化容器或第二进度权威
- **状态预留**：保持 `{failures, reports}` 与 `{ok, errors, facts}` 形状，不新增状态值或字段
- **扩展边界**：本期只延伸到写作规则可靠层与四类必留项在场；不承诺语义判定的自动检测

## 10. 明确不做与默认必须成立

本节回答：哪些范围被明确排除，哪些约束始终成立。

### 明确不做

本节回答：什么本次不选，来源与理由是什么。

- 不新增第四套规范对象、不新增第二套来源账本；`skills/spec-specify/SKILL.md` 的 WR001 已是唯一规范层（D-011、D-008）
- 不新增 stage、gate、评分器、持久台账或第二进度权威（D-002、D-015）
- 不在「复用既有 consistency 纯函数不可行」未证前新增顶层 CLI 检查入口（D-002、PRD prd:263）
- 不新增极简模板（`prd:357`）；也不做替换式全仓改名；不改归档材料与其它在跑任务材料（U-002、D-014）
- 不删除任何来源便携小卡或 `skills/catalog.yaml` 坐标（D-008、ADR-0046）
- 不把 `## Appendix A — 验收判据（唯一权威）` 追加进验收标题识别集合（ADR-0050:28）
- 不把归档 P8 的 75.8% 反例当机器判据，只作人读复测（D-012；此处 P8 指归档任务 `design-execution-efficiency-20261014` 的 Phase，不是本卡 Phase）
- 不声称完整符合 ISO 标准（D-020）
- 不写三个真实文档出口的方法正文，只落到达条件；方法正文归 N7（PRD prd:188／prd:733）
- 不设验收用字节基线、不报字节分母、不用「基线不增」核销（U-001、D-018、ADR-0049:26）
- 本阶段不实施任何仓内改动（U-003）

### 默认必须成立

本节回答：哪些产品不变量不用用户重复提出。

- 新增写作只报告检查默认退出 0，不接任何 stage/gate/CI 失败路径；既有生产校验器仍对真实违规返回 `ok=false` 与错误，不受此 report-only 约束；缺失与不可用保持 `unknown`/`unavailable`/`incomplete`，不伪装成通过；关联 FR-N4-008／AC-008
- 归档材料与其它在跑任务材料零字节改动；关联 FR-N4-009／AC-N4-03
- 来源权威唯一处仍是 `skills/catalog.yaml`；关联 FR-N4-004／AC-N4-04
- 质量裁决由不参与改动的独立来源产出，禁止自审自判；关联 FR-N4-001／AC-013

## 验收流程

本节回答：从场景入口如何找到唯一AC与可回读证据。

从当前 decision-log 主文的 `## 验收面` 交接索引取可观察接口和成功失败边界，再从场景入口依次定位 FR、`## Appendix A — 验收判据（唯一权威）` 的同号 AC、所属 Phase 命令和可回读证据；按其外置事实索引的到达条件读唯一原 ref。本节只描述流程，不复制 AC 的通过或失败判据。

## 测试标准

本节回答：行为切片使用什么oracle、证据类型与覆盖边界。

本卡按项目自身声明测试面如下，逐面写适用或具名不适用理由、oracle、证据类型和覆盖边界。路由档位不是项目测试面。

**面 1：生产校验器的索引纯度与两项 `valid` 标志（适用）**。oracle 为 `ORACLE-N4-LABEL-GATE`，证据类型为真实执行输出与冻结负例测试，覆盖上限是只证明该两个行为接缝，不证明语义判定质量。所属命令见 `phases/P1-机器侧静默层修复.md` 的 `gate_cmd`。覆盖 AC-N4-01。

**面 2：只报告检查的输出与退出码（适用）**。oracle 为 `ORACLE-N4-REPORT-ONLY`，证据类型为真实执行输出加退出码，覆盖上限是只证明报告可见与不接失败路径，不证明报告本身准确。所属命令见 `phases/P2-只报告检查接入.md`。覆盖 AC-008、AC-N4-02。

**面 3：四类材料与模板的在场与三态（适用）**。oracle 为 `ORACLE-N4-MATERIAL-LAYERS`，证据类型为模板声明读回与既有契约测试原样通过，覆盖上限是只证明声明与在场一致，不证明声明是否恰当。所属命令见 `phases/P3-四类模板与材料分层.md`。覆盖 AC-T3-1、AC-T3-2、AC-T3-3、AC-T3-4、AC-T3-6。

**面 4：来源引用、收敛与推断标注（适用）**。oracle 为 `ORACLE-N4-SOURCE-CONVERGENCE` 与 `ORACLE-N4-REAL-OUTLETS`，证据类型为收敛前后 `grep` 输出与逐处读回，覆盖上限是只证明指针形状与文本在场，不证明读者理解。所属命令见 `phases/P4-来源引用与出口到达条件.md`。覆盖 AC-T3-5、AC-N4-04、AC-T9-1、AC-T9-2。

**面 5：评测合同与 15 项采用（适用）**。oracle 为 `ORACLE-N4-EVAL-15`，证据类型为逐段落点读回与逐项登记条目核对，覆盖上限是只证明落点与登记在场，不证明机制已产生行为效果。所属命令见 `phases/P5-评测合同与15项采用.md`。覆盖 AC-T9-3、AC-N4-06、AC-N4-07。

**面 6：旧材料与在跑材料的零字节兼容（适用）**。oracle 为 `ORACLE-N4-COMPAT-ZERO-DIFF`，证据类型为真实 `git diff --name-only` 范围比对与旧材料复跑，覆盖上限是只证明本次未改动受保护路径，不证明旧材料内容正确。所属命令见 `phases/P1-机器侧静默层修复.md`。覆盖 AC-N4-03。

**面 7：独立交付粒度与失败/权限边界（适用）**。oracle 为 `ORACLE-N4-BOUNDARIES`，证据类型为受控负例前后读回，覆盖上限是只证明边界未被删除或遮蔽。所属命令见 `phases/P3-四类模板与材料分层.md`。覆盖 AC-T3-10。

**面 8：链路指针完整性与下游不回改（适用）**。oracle 为 `ORACLE-N4-CHAIN-INTEGRITY`，证据类型为 `node tools/cli/check-decision-log-chain.mjs` 的 advisory 输出与下游读回，覆盖上限是只证明每环有可核指针，不证明指针语义正确。所属命令见 `phases/P6-链路完整性与独立审查范围.md`。覆盖 AC-004、AC-T3-9。

**面 9：浏览器可见面（具名不适用）**。不适用理由：本卡在认证 worktree 内无 `apps/` 目录、零个 `.tsx`/`.vue`/`.jsx` 文件、`package.json` 无前端框架依赖；本卡写集是 markdown 方法文件与两个 `.mjs` 校验/检查模块，不新增或改动任何路由、页面或组件。因此没有浏览器端到端面可列。

**面 10：独立方匿名盲评（适用，非机器面）**。oracle 为 `ORACLE-N4-BLIND-REVIEW`，证据类型为逐维度三态记录与具名原因，覆盖上限是只给出五项维度的比较结论，不证明未来任务的效果。所属命令见 `phases/P7-独立盲评与整卡验收.md`。覆盖 AC-013、AC-N4-05。

每个要测的面与覆盖 AC 都指向所属 Phase 的一条可执行命令；`## Appendix A — 验收判据（唯一权威）` 只指同一 oracle 与预期证据，精确命令留给各 Phase。

### 验收对象

本节回答：哪个真实对象被检查，缺什么输入，谁提供或执行。

当前 spec 在本节填写实际验收对象数据、每项来源与未观察范围。三项来源已按真实材料核实：`raw_requirement` 取 `specs/archive/skills-framework-redesign-20261014/prd.md` 的 N4 章节（`:354`–`:371`，该文件 sha256 `ea45ae46c6117f00c0534523400e89d5e16ec4aaf6f68649bd74ae31de68e1b0`），请求里没有任何页面、视图、组件或浏览器交互；`project_inventory` 取认证 worktree 实测（无 `apps/`、零 `.tsx`/`.vue`/`.jsx`、`package.json` 无前端框架依赖）；`planned_or_changed_frontend_fact` 取本卡 decision-log 声明的写集（markdown 方法/模板文件加两个 `.mjs` 模块与四个测试文件，不新增路由、页面、组件或视口）。三项都核为非 UI，理由均为真实来源事实。

因为三项均为非 UI，验收对象采用本模板的嵌套 CLI 形状。`workspace` 与 `state` 取真实值；`cli.command`、`cli.entry_ref`、`cli.sample_ref`、`cli.oracle_ref` 在本步为 `null`：它们指向的是一条真实可执行的验收命令、其入口权威、真实样本与 oracle，而这三件在本阶段确实尚未产生，由 build-code／verify-code 的对应 Phase 补齐。本步据此如实记录 `ok=false` 与缺项清单，不伪造一条命令冒充已存在。

```json
{
  "workspace": "/Users/Hugh/Hugh/Project/workflowhub-n4-writing-templates-research-eval-20261016",
  "state": { "execution": "not_run", "subject": "build-plan 材料：spec.md、phases/P1-P7、phases/index.md" },
  "cli": {
    "command": null,
    "entry_ref": null,
    "sample_ref": null,
    "oracle_ref": null
  },
  "owner": "用户"
}
```

本步的真实执行原件：`quality/evidence/2026-10-17-build-plan-acceptance-object-check.json`（含对象输入、三来源引用与实际读取范围、生产模板 sha256、VM 执行返回值与 `missing_fields` 原文）。该检查只核结构、引用与缺项，不读文件、不执行命令、不认证来源语义，也不证明服务健康或业务效果。

## 架构边界

本节回答：产品接口与工程职责如何划分。

产品边界是「材料作者拿到的规范与模板是否真的可用」，工程边界是「机器侧校验与只报告检查的行为」。真实消费者是四类材料作者、独立验收者与 `run-checks` 的既有调用链。全局架构方案在下方「实现设计（全局权威）」维护，各 Phase 只承接自身差异。

## 实现设计（全局权威）

本节回答：用什么架构、接口、代码与验证策略实现已确认产品行为。

### 代码锚点

本节回答：实现者先读哪些真实路径、符号与消费者。

- **来源边界**：原始 PRD 与 decision-log 只作来源映射，不在实现设计中创建第二份需求账本。
- **现状与目标差异**：现状是「规范存在但到达条件不触发、中文越层写法漏检、两项 `valid` 标志由文案反推、来源方法无程序消费者」；目标是「写作动作前置、越层写法被拦住、`valid` 由真实条件判定、来源与推断写法可回核」。消费者是四类材料作者与独立验收者。
- **读取顺序**：先读 `runtime/stage/stage-content-contracts.mjs` 的 `validatePostPhaseContract`（`:407`）与 `labelAlternation`（`:146`），再读 `tools/cli/check-skill-consistency.mjs` 的 `checkSkillConsistency`（`:15`）与 CLI 守卫（`:153-170`），再读 `tools/cli/run-checks.mjs` 的 consistency 步骤（`:132-134`），最后读三个逐字 oracle 测试。
- **代码锚点**：
  - `runtime/stage/stage-content-contracts.mjs` 的 `validatePostPhaseContract({spec,index,phases,reviewReadScope})`（`:407`）、`labelAlternation(name)`（`:146`）、`FIELD_LABEL_ALIASES`（`:79`）、索引纯度检查（`:416`）、`facts.dependency_validation.valid`（`:756`）、`facts.command_oracle_checks.valid`（`:757`）、卡内 17 个必填字段清单（`:533-538`）、验收标题识别集合（`:770`）
  - `tools/cli/check-skill-consistency.mjs` 的 `checkSkillConsistency(root)`（`:15`，唯一导出，返回 `{failures, reports}`）、CLI 守卫与退出码（`:153-170`）
  - `tools/cli/run-checks.mjs` 的 `runChecker`（`:22-56`）、consistency 步骤（`:132-134`）、聚合退出（`:150-159`）
  - `tools/cli/stage-runtime.mjs` 的校验调用点（`:568`、`:611`）与 wh-review lens 硬清单（`:398`）
  - 三个逐字 oracle 测试：`tests/contract/post-build-plan-missing-index.test.mjs`（`:348-367`，读 `skills/spec-plan/templates/phase-template.md`，钉 12 个中文标签前缀与 `ORACLE-PUBLISH-DOC`）、`tests/contract/card05-author-material-consumer.test.mjs`（`:15-27`，钉四个 card05 作者示例 marker（四类示例块各一个，逐个要求恰好出现一次）与三个双花括号占位符（TASK_ID、TASK_ROOT、WORKTREE_ROOT，逐字字面以该测试 `:24` 为准））、`tests/contract/acceptance-object-required-fields.test.mjs`（`:6-16`，钉 c01 验收对象 producer 的 marker（要求恰好出现一次）与其后 producer 源码的逐字字节）
  - 四类五个模板：`skills/decision-log/templates/decision-log-template.md`（`:54` `## 工作包与决定`）、`skills/spec-specify/templates/spec-template.md`（`:142` `## 6. 模块划分`、`:250` marker、`:252-303` producer、`:383` 验收判据标题）、`skills/spec-plan/templates/phase-template.md`（`:163` 风险与回滚、`:177` G-2 首行、`:233-251` 验收固定小节、`:285` G-2 标题、`:291-302` 12 个中文标签行、`:322` 完整作者材料示例、`:328`/`:394`/`:408`/`:454` 四个 marker）、`skills/spec-plan/templates/index-template.md`、`skills/spec-prd/templates/prd-template.md`
  - 唯一规范正文：`skills/spec-specify/SKILL.md` 的 `## 技能写作规范（WR001）`（标题 `:144`，正文 `:146-161`）
  - 来源唯一权威：`skills/catalog.yaml`
  - 既有治理与决定：`docs/architecture/test-asset-governance-rules.md`、`docs/adr/0043-…`、`docs/adr/0046-…`、`docs/adr/0049-…`、`docs/adr/0050-…`
  - 五个模板的生产字节读者：`runtime/distribution/skill-bundle-release.mjs` 的 locator 收集（`:252-255`）与 `captureSourceBytes()`（`:345-346`）
  - 行号只作定位辅助，标注为生成本步时刻的快照、会漂移、不作契约。契约面由点名的符号与行为语义构成；逐 Task 的坐标与常量名归 Phase 卡。
- **运行条件**：原规划 Node v24.14.0/vitest2.1.9 仅旧观察；本轮 worktree 无 node_modules，不能让 `npx vitest` 隐式联网安装。已有 runner 可复用 `/Users/Hugh/Hugh/Project/workflowhub/node_modules/.bin/vitest`，保持 cwd 为本认证 worktree、显式点名文件并 `--no-file-parallelism`；`node --test` 仅用于实际 node:test 文件。Phase 中 npx 形状是计划命令，执行前按此读回实际 runner；缺失记 unavailable，不新增依赖/全量回归。

### 接口与失败语义

本节回答：输入如何变成输出，非法或缺失输入怎样失败。

- **选择的架构方案**：先复用，再窄扩展，确有真实收益才新机制。复用 `checkSkillConsistency(root)` 的既有 `reports` 通道承接本卡唯一的只报告报告；复用同模块既有的 `labelAlternation` 让索引纯度检查覆盖中文标签；把两项 `valid` 改为由产生该错误的结构化条件判定。放弃「新增独立检查入口」与「为可判定性补造机器标题」两条路，因为它们各自造第二套控制面或与既有散文分层冲突（simplicity-guard 阶梯 P1/P2 命中）。
- **模块职责**：`runtime/stage/stage-content-contracts.mjs` 消费 `spec`/`index`/`phases` 产出 `{ok, errors, facts}` 或真实错误 → `tools/cli/check-skill-consistency.mjs` 消费仓库根产出 `{failures, reports}` → `tools/cli/run-checks.mjs` 只消费子进程退出码。三者都不裁决文档质量。
- **接口与数据流**：索引文本与卡字段标签 → `labelAlternation` 候选集 → 纯度/必填判定 → `errors` 字符串与结构化错误类别 → `facts` 的两个 `valid`；模板与材料正文 → 必留层与三态声明 → `reports` 条目 → stdout。无新持久化，无新状态。
- **失败语义**：中文越层写法必须被拦住并报出具体违规；`valid` 由结构化条件判定，错误文案改动不再翻转它；检查自身不可用（命令不存在、依赖缺失、版本不符、执行失败、超时、取消或空输出）如实记「未覆盖」或 `unknown` 并保留原始失败与检测输出，不静默通过、不改退出码、不写进 `failures`、不阻断其它工作，同一不可用事实只记录一次。
- **新增控制面**：N/A — 使用既有检查函数、既有报告通道与既有校验器，无新控制面。条件性例外：只有当 build-code 证明「复用既有纯函数不可行」并给出可核查依据时，才考虑 `tools/cli/check-material-authoring.mjs`；未证前不新增，且须先登记 `docs/architecture/move-map.json`。

### 全局文件边界与依赖

本节回答：各Phase如何分工、依赖、并行与回滚。

- **新增**：`tests/contract/chinese-label-detection.test.mjs`（新冻结负例；文件名按 `docs/architecture/test-asset-governance-rules.md:33` 的命名规则去任务名前缀，decision-log 原声明为 `tests/contract/n4-chinese-label-detection.test.mjs`，见 OPEN-07）。条件新增（未证不复用不可行则**不**新增）：`tools/cli/check-material-authoring.mjs`。
- **修改**：见下方「需求到任务追踪」与各 Phase 契约头的精确写集。计数口径：decision-log 写集表申报 54 行；七个 Phase 契约头写入集的**去重并集为 52 个路径**（含跨 Phase 共享路径的重复申报共 **65 个槽位**）；按类型分：`.md` 43 个、`.mjs` 7 个、`.yaml` 1 个、`.json` 1 个。同一并行批次内逐路径唯一 writer；跨 Phase 共享的 12 个路径在同批次内按先写者→后写者定序。
- **禁止改动**：`specs/archive/**`（只读）；其它在跑任务材料（`specs/n2-*/**`、`specs/n3-*/**`）；`runtime/stage/stage-content-contracts.mjs` 的验收标题识别集合（`:770`）；17 个英文必填字段名清单（`:533-538`）；既有错误文案；本卡不写 `AGENTS.md`、`docs/standard-workflow.md`、`GLOSSARY.md`。
- **n3 重叠范围（声明交集）**：原声明去重并集 52 路径（65 槽位）与 n3 归档声明 114 路径的交集为 **19 条**，分布为 **P3 3 条、P4 11 条、P5 9 条**（各 Phase 计数有重复，去重 19）。这不是当前 Git 实际变更集：N3 实际还修改了 P1 的生产校验器；P1 亦须消费当前 G-2。n3 外部写入等待已解除，实施仍待当前计划确认，并按下述内部依赖与独占 writer 定序。
- **全局依赖**：P1 提供校验器契约事实；P2 依赖 P1；P3 依赖 P1；P4 依赖 P2 与 P3（P2 提供报告通道、P3 会先写同一 Phase 模板）；P5 依赖 P3 与 P4；P6 依赖 P1–P5；P7 依赖 P1–P6。依赖边分两类：功能前置（上游交回可消费结果）与共享写集定序（同路径的先写者交回已核实状态）。两类都必须与 `phases/index.md` 的「依赖」列及各 Phase 契约头**逐条一致**（Phase 头允许在依赖值后带括注说明，索引列只写编号；依赖 id 集合必须相同，括注不参与比对）。
- **文件归属与共享路径定序**：每个路径在同一并行批次内只有一个持笔 Task；跨 Phase 共享的 12 个路径按「先写者→后写者」定序，且每条共享边在 `phases/index.md` 的依赖列与两侧 Phase 契约头都有对应依赖边。清单：`skills/spec-plan/templates/phase-template.md`（P3→P4→P5）；`skills/decision-log/templates/decision-log-template.md`（P3→P4）；`skills/spec-specify/templates/spec-template.md`（P3→P5）；`skills/decision-log/SKILL.md`（P4→P5）；`skills/deep-research/SKILL.md`（P4→P5）；`skills/spec-plan/SKILL.md`（P4→P5）；`skills/spec-specify/SKILL.md`（P4→P5）；`skills/spec-prd/SKILL.md`（P4→P5）；`skills/spec-analyze/SKILL.md`（P4→P5）；`skills/wh-review/SKILL.md`（P4→P5）；`skills/knowledge-graph/SKILL.md`（P4→P5）；`workflows/build-plan/SKILL.md`（P4→P5）。后写者写回前先读回先写者在该路径的已核实状态，无法回读时写 `unknown` 与原因，不阻断其余路径。本卡不新增文件以「收进单一 Phase」的方式规避：这些路径的改动本就属于不同职责，硬并会造出一个跨职责的巨型 Phase。
- **回滚与恢复**：任一 Phase 的改动只退回自己的 hunk，不覆盖其它工作；测试转红时回该 Phase 的原 writer 局部修，禁止改 oracle 求绿。

### 需求到任务追踪

本节回答：每个原始行为如何对应FR、AC、Task与正反oracle。

从当前 `decision-log.md` 的 `## 验收面` 交接索引与 R-、U-、PRD-、CARD- 编号逐条核对已确认决定；上游 PRD 原件另作只读对照。下列每行给可回读 source ID/位置。**每个 Task 卡在此表至少有一行**；`正例 + 负例判据 / 证据` 列写 oracle 与本卡证据归口（`quality/tests/`、`quality/evidence/`），精确命令留给所属 Phase。

| 来源 / 决定 | 原义行为/强度 | FR / AC | Phase / Task | 正例 + 负例判据 / 证据 |
| --- | --- | --- | --- | --- |
| R-002、R-011 / D-005、D-006 | 四类模板声明本类必留必要内容；P0/P1/P2 与三态不互相代替 | FR-N4-002、FR-N4-009 / AC-T3-2、AC-N4-01 | P1/T001 | ORACLE-N4-LABEL-GATE / quality/tests/2026-10-17-001-build-plan-silent-layer-red-probe.txt |
| R-009、U-002 / D-014、ADR-0050 | 中文标签越层写法由漏检变被拦住，恢复后仍通过 | FR-N4-009 / AC-N4-01 | P1/T001 | ORACLE-N4-LABEL-GATE / quality/tests/2026-10-17-001-build-plan-silent-layer-red-probe.txt |
| R-009、U-002 / D-014、ADR-0050 | 中文标签越层写法由漏检变被拦住，恢复后仍通过 | FR-N4-009 / AC-N4-01 | P1/T002 | ORACLE-N4-LABEL-GATE / quality/tests/2026-10-17-003-p1-label-gate-green.txt |
| U-002 / D-014、ADR-0050 | 归档与在跑任务材料零字节改动且照旧通过 | FR-N4-009 / AC-N4-03 | P1/T003 | ORACLE-N4-COMPAT-ZERO-DIFF / quality/tests/2026-10-17-004-p1-compat-range.txt |
| R-008、R-009 / D-002、ADR-0043 | 只报告检查范围收窄到实测可靠层；未跑记 unknown；不接失败路径 | FR-N4-008 / AC-008 | P2/T004 | ORACLE-N4-REPORT-ONLY / quality/tests/2026-10-17-005-p2-report-only.txt |
| R-009 / D-002、D-022 | 只报告语义：报告可见、退出码 0、不计入 failures、不可判定记 unknown | FR-N4-008 / AC-N4-02 | P2/T005 | ORACLE-N4-REPORT-ONLY / quality/tests/2026-10-17-006-p2-run-checks.txt |
| R-009 / D-002、D-022 | 只报告语义：报告可见、退出码 0、不计入 failures、不可判定记 unknown | FR-N4-008 / AC-N4-02 | P2/T006 | ORACLE-N4-REPORT-ONLY / quality/tests/2026-10-17-007-p2-unavailable-and-compat.txt |
| R-002、R-011、R-003 / D-005、D-006、D-007 | 四类模板声明本类必留必要内容与三态；候选节与分层指向同一候选集 | FR-N4-002、FR-N4-003、FR-N4-011 / AC-T3-1、AC-T3-2 | P3/T007 | ORACLE-N4-MATERIAL-LAYERS / quality/tests/2026-10-17-008-p3-material-layers.txt |
| R-011 / D-007 | 不同任务的 P1/P2 集合不相同，不被固定成一份清单 | FR-N4-011、FR-N4-002、FR-N4-003 / AC-T3-3、AC-T3-4、AC-T3-6 | P3/T008 | ORACLE-N4-MATERIAL-LAYERS / quality/tests/2026-10-17-008-p3-material-layers.txt |
| R-003 / D-007 | 四类各有可单独交付、可单独判定的结果与 FR/AC | FR-N4-003、FR-N4-002、FR-N4-011 / AC-T3-4、AC-T3-3、AC-T3-6 | P3/T008 | ORACLE-N4-MATERIAL-LAYERS / quality/tests/2026-10-17-008-p3-material-layers.txt |
| R-003、R-011 / D-006 | not-applicable 带理由与依据、deferred 三件齐、P0 标题不被抹掉 | FR-N4-003、FR-N4-002、FR-N4-011 / AC-T3-6、AC-T3-3、AC-T3-4 | P3/T008 | ORACLE-N4-MATERIAL-LAYERS / quality/tests/2026-10-17-008-p3-material-layers.txt |
| R-002、R-004、R-011 / D-005、D-006、D-014、D-016 | Phase 与纯指针 index 的分层、效果评测指标基线与验收总则在位 | FR-N4-002、FR-N4-004、FR-N4-011、FR-N4-008、FR-N4-009 / AC-T3-1、AC-T3-2、AC-T3-8、AC-T3-10、AC-T3-9 | P3/T009 | ORACLE-N4-MATERIAL-LAYERS / quality/tests/2026-10-17-009-p3-verbatim-oracles.txt |
| R-003、R-011 / D-006 | not-applicable 带理由与依据、deferred 三件齐、P0 标题不被抹掉 | FR-N4-003、FR-N4-002、FR-N4-008、FR-N4-009 / AC-T3-6、AC-T3-1、AC-T3-10、AC-T3-2、AC-T3-8、AC-T3-9 | P3/T009 | ORACLE-N4-MATERIAL-LAYERS / quality/tests/2026-10-17-009-p3-verbatim-oracles.txt |
| R-011 / D-006 | 四类消费都不丢失败与权限边界 | FR-N4-011、FR-N4-002、FR-N4-008、FR-N4-009 / AC-T3-10、AC-T3-1、AC-T3-2、AC-T3-8、AC-T3-9 | P3/T009 | ORACLE-N4-BOUNDARIES / quality/tests/2026-10-17-009-p3-verbatim-oracles.txt |
| R-005、U-001 / D-018、D-019、ADR-0049 | 下游不回改；不设字节基线、不报字节分母 | FR-N4-005、FR-N4-002、FR-N4-008、FR-N4-009 / AC-T3-9、AC-T3-1、AC-T3-10、AC-T3-2、AC-T3-8 | P3/T009 | ORACLE-N4-BOUNDARIES / quality/tests/2026-10-17-009-p3-verbatim-oracles.txt |
| R-004、U-007 / D-008、ADR-0046 | 28 处重复来源权威句收敛且权威唯一处仍是 skills/catalog.yaml | FR-N4-004 / AC-N4-04 | P4/T010 | ORACLE-N4-SOURCE-CONVERGENCE / quality/tests/2026-10-17-010-p4-source-outlets.txt |
| R-004 / D-009、D-010 | 来源引用带版本与回原链；推断就地标注；零输入返回具体缺项 | FR-N4-004 / AC-T3-5 | P4/T011 | ORACLE-N4-SOURCE-CONVERGENCE / quality/tests/2026-10-17-011-p4-outlets.txt |
| R-009 / D-002 | 四类材料各喂一次空输入，返回具体缺项且 unknown 不填 0 | FR-N4-004 / AC-T3-7、AC-T3-5 | P4/T011 | ORACLE-N4-SOURCE-CONVERGENCE / quality/tests/2026-10-17-011-p4-outlets.txt |
| R-006、U-006 / D-001、D-020 | 写 spec 与 decision-log 必经 WR001；三处出口各自 consumer 写清 | FR-N4-006、FR-N4-007 / AC-T9-1、AC-T9-2 | P4/T012 | ORACLE-N4-REAL-OUTLETS / quality/tests/2026-10-17-011-p4-outlets.txt |
| R-007 / D-001、D-002、D-014 | WR001 正文唯一，三处挂载各有真实消费者 | FR-N4-007、FR-N4-006 / AC-T9-2、AC-T9-1 | P4/T012 | ORACLE-N4-REAL-OUTLETS / quality/tests/2026-10-17-011-p4-outlets.txt |
| R-008 / D-003、D-011、D-012 | 只报告检查对四类真实文档样本分项报真/假阳性与分母 | FR-N4-008 / AC-T9-3 | P5/T013 | ORACLE-N4-EVAL-15 / quality/tests/2026-10-17-012-p5-eval-15.txt |
| R-008、R-009 / D-003、D-011、D-012 | 只报告检查分项报真/假阳性与分母、未跑记 unknown | FR-N4-008、FR-N4-001、FR-N4-005 / AC-T9-3、AC-008、AC-013 | P5/T014 | ORACLE-N4-EVAL-15 / quality/tests/2026-10-17-012-p5-eval-15.txt |
| R-010 / D-015、D-016 | 15 项逐项只吸一个机制，落进既有文件并登记 | FR-N4-010 / AC-N4-06、AC-T9-3 | P5/T015 | ORACLE-N4-EVAL-15 / quality/tests/2026-10-17-012-p5-eval-15.txt |
| R-010 / D-015、D-016 | 15 项逐项只吸一个机制，落进既有文件并登记 | FR-N4-010 / AC-N4-06 | P5/T016 | ORACLE-N4-EVAL-15 / quality/tests/2026-10-17-014-p5-adoptions.txt |
| R-010 / D-015、D-016 | 15 项逐项只吸一个机制，落进既有文件并登记 | FR-N4-010 / AC-N4-06 | P5/T017 | ORACLE-N4-EVAL-15 / quality/tests/2026-10-17-014-p5-adoptions.txt |
| R-012 / D-018、ADR-0049:25、prd:195 | G1 的删除/合并/降档声明与「只加规则」如实标注 | FR-N4-013 / AC-N4-08 | P5/T017 | ORACLE-N4-EVAL-15 / quality/tests/2026-10-17-012-p5-eval-15.txt |
| R-010、U-005 / D-015、prd:187 | why 定为补强偏缺口并在三个落点各可读回 | FR-N4-010 / AC-N4-07 | P5/T018 | ORACLE-N4-EVAL-15 / quality/tests/2026-10-17-013-p5-why-outlets.txt |
| R-008 / D-003、D-011 | 用四类真实文档的人工标注样本跑校准，分项数字可复算 | FR-N4-008 / AC-T9-3 | P5/T019 | ORACLE-N4-EVAL-15 / quality/tests/2026-10-17-013-p5-calibration.txt |
| R-014 / D-017、D-021、PFACT-011 | 真重叠路径按真实依赖边定序，不因同路径先交首切片 | FR-N4-012 / AC-004 | P6/T020 | ORACLE-N4-CHAIN-INTEGRITY / quality/tests/2026-10-17-015-p6-chain-integrity.txt |
| R-014、U-003 / D-017、D-021 | 真重叠路径按真实依赖边定序，不因同路径先交首切片 | FR-N4-012、FR-N4-005 / AC-004、AC-T3-9 | P6/T021 | ORACLE-N4-CHAIN-INTEGRITY / quality/tests/2026-10-17-016-p6-downstream-readback.txt |
| R-014 / D-014、PFACT-011 | 四类材料互斥合入的定序约束在卡内可读回 | FR-N4-012、FR-N4-001、FR-N4-005、FR-N4-002、FR-N4-008、FR-N4-009 / AC-004、AC-013、AC-N4-04、AC-T3-10、AC-T3-5、AC-T9-3 | P7/T024 | ORACLE-N4-BLIND-REVIEW / quality/tests/2026-10-17-018-p7-blind-review-and-acceptance.txt |
| R-009、U-002 / D-014、D-002 | 材料、测试与对象的现值被逐条核收并记档位 | FR-N4-009、FR-N4-011、FR-N4-001、FR-N4-005 / AC-N4-01、AC-N4-02、AC-N4-03、AC-T3-1、AC-T3-2、AC-T3-3、AC-T3-4、AC-T3-6、AC-T3-8、AC-008、AC-N4-05、AC-T3-7、AC-T3-9 | P7/T025 | ORACLE-N4-BLIND-REVIEW / quality/tests/2026-10-17-018-p7-blind-review-and-acceptance.txt |
| R-006、U-008 / D-001、D-019、D-020 | 独立方按既定匿名五维三态执行盲评并产出该子条件首次事实，其它上游结论只核收 | FR-N4-006、FR-N4-007、FR-N4-002、FR-N4-008、FR-N4-009、FR-N4-001、FR-N4-005、FR-N4-012 / AC-T9-1、AC-T9-2、AC-N4-04、AC-T3-10、AC-T3-5、AC-T9-3、AC-013、AC-N4-05 | P7/T026 | ORACLE-N4-BLIND-REVIEW / quality/tests/2026-10-17-017-p7-acceptance-object.txt |
| R-008、R-012 / D-011、D-012、D-013、D-018 | 评测合同、15 项落点与 G1 三类声明被核收，登记条目与落点一致 | FR-N4-008、FR-N4-010、FR-N4-001、FR-N4-005、FR-N4-004、FR-N4-012、FR-N4-013 / AC-T9-3、AC-N4-06、AC-008、AC-N4-05、AC-T3-7、AC-T3-9、AC-004、AC-N4-07、AC-T9-1、AC-T9-2、AC-N4-08 | P7/T027 | ORACLE-N4-BLIND-REVIEW / quality/tests/2026-10-17-018-p7-blind-review-and-acceptance.txt |
| R-001、U-004、U-008 / D-019、D-013 | 盲评逐维度三态与无法判断处置被核收 | FR-N4-001、FR-N4-005、FR-N4-012、FR-N4-009、FR-N4-011 / AC-013、AC-N4-05、AC-N4-02、AC-N4-03 | P7/T028 | ORACLE-N4-BLIND-REVIEW / quality/tests/2026-10-17-018-p7-blind-review-and-acceptance.txt |
| R-010、U-005 / D-015、prd:187 | why 三处落点与三项重复清单被核收 | FR-N4-010、FR-N4-004、FR-N4-008、FR-N4-012、FR-N4-001 / AC-N4-07、AC-004、AC-N4-06、AC-T9-1、AC-T9-2、AC-013、AC-N4-05 | P7/T029 | ORACLE-N4-BLIND-REVIEW / quality/tests/2026-10-17-013-p5-why-outlets.txt |
| R-012 / D-018、D-019 | 效果评测的基线、指标与正负例被核收 | FR-N4-012、FR-N4-009、FR-N4-011、FR-N4-001 / AC-013、AC-N4-02、AC-N4-03、AC-004、AC-N4-05、AC-N4-06、AC-N4-07 | P7/T029 | ORACLE-N4-BLIND-REVIEW / quality/tests/2026-10-17-001-build-plan-silent-layer-red-probe.txt |
| R-001、R-012 / D-019、D-018 | 六项结论与带欠账完成形态被核收 | FR-N4-001、FR-N4-012 / AC-004、AC-013、AC-N4-05、AC-N4-06、AC-N4-07 | P7/T029 | ORACLE-N4-BLIND-REVIEW / quality/tests/2026-10-17-018-p7-blind-review-and-acceptance.txt |
| R-001、U-004 / D-019、ADR-0049 | 四类材料读者能用完整产物独立行动；质量由独立方匿名盲评判定 | FR-N4-001、FR-N4-005 / AC-013 | P7/T022 | ORACLE-N4-BLIND-REVIEW / quality/tests/2026-10-17-018-p7-blind-review-and-acceptance.txt |
| U-008 / D-019、ADR-0049 | 盲评无法判断记具名原因、不折算成更好；全样本无法判断的维度记未达成 | FR-N4-005、FR-N4-001、FR-N4-009、FR-N4-011 / AC-N4-05、AC-N4-01、AC-N4-02、AC-N4-03、AC-T3-1、AC-T3-2、AC-T3-3、AC-T3-4、AC-T3-6、AC-T3-8 | P7/T023 | ORACLE-N4-BLIND-REVIEW / quality/tests/2026-10-17-018-p7-blind-review-and-acceptance.txt |
| R-012、R-013、R-014、R-015 / D-017、D-018、D-019、D-021 | 全部小节按 P0/P1/P2 分级；P0 基准是该产物本次权威声明 | FR-N4-012、FR-N4-002、FR-N4-008、FR-N4-009 / AC-013、AC-N4-04、AC-T3-10、AC-T3-5、AC-T9-3 | P7/T024 | ORACLE-N4-BLIND-REVIEW / quality/tests/2026-10-17-018-p7-blind-review-and-acceptance.txt |

### 全局验证策略

本节回答：各风险如何被目标检查与最终逐AC验收覆盖。

- **验证策略**：本卡的行为面集中在两个 `.mjs` 模块的可观察输出与 52 个写路径（其中 `.md` 43 个）的文本在场。机器面用冻结负例与真实执行输出核；文本面用逐处读回与收敛前后 `grep` 比对核；整体效果由独立方匿名盲评核。三个面各自报告，互不代替。
- **RED/GREEN 设计**：原 P1 探针 `quality/tests/2026-10-17-001-build-plan-silent-layer-red-probe.txt` 保留为历史线索，不是有效目标 RED：合法 control 本身有未知 FR 等错误，且只含纯度文案导致 valid 翻转的假设未被该件证实。P1/T001 在当前 HEAD 先证明合法 control，再对四中文/四英文越层例与恢复例、两 valid 的真实错误条件逐一实跑；同一冻结 oracle 配对 GREEN，未执行前写 unavailable。原 P2 `…002-build-plan-report-only-gap.txt` 只有关键词能力缺口观察（exit1），不等于行为断言 RED；T004 仍须具名报告断言。其余 Task 按卡片取得真实目标失败，未取得写 unavailable，不用旧观察冒本轮验证。
- **最终聚合**：由 P7 逐条消费 P1–P6 的原件核对全部 24 条 AC；P7 只复核与补必要未闭环 case，不作任何 AC 的首次结论。门命令 `npx vitest run tests/contract/chinese-label-detection.test.mjs tests/contract/post-build-plan-missing-index.test.mjs tests/contract/card05-author-material-consumer.test.mjs tests/contract/acceptance-object-required-fields.test.mjs`。
- **不能证明的内容**：不证明 ISO 标准符合性、不证明真实读者理解质量、不证明未来任务的效果、不证明检查器在语义层可靠；这些保持 `unknown` 或交独立人读。

每个 Phase `phases/P<n>-*.md` 指向本节和全局目标的稳定锚点，不复制全局设计；每个 Task 再写自己的第一步代码动作、同命令 RED/GREEN 和失败 oracle。

## Appendix A — 验收判据（唯一权威）

本节回答：每条承诺如何验证、通过、失败并留下证据。decision-log 主文的 `## 验收面` 只交接可观察接口与成功失败边界，条件原 ref 按其外置事实索引回读；判据以本节为准，AC 编号同号。

**AC 判定方式**：`机器可判`＝本任务内一条命令可重放真假；`只能人读`＝判据是语义可用性，命令输出不构成结论；`需真实环境+用户在场`＝真实外部环境产生判据且用户在场。每条 AC 的判定时点、执行 owner 与成功失败信号写在本条内。

- [ ] **AC-T3-1**：候选节/各节读者与分层/模板表达两条路径分别可回读且指向同一候选集；模板仍单一 writer。关联 FR-N4-002。判定方式：机器可判加只能人读。
验证：P3 实施者提供两份回读记录——记录一是「候选节与各节读者」清单（对每类材料列出候选节及其真实读者），记录二是「分层/模板表达」清单（同一候选集上给出的 P0/P1/P2 分级与模板表达），两份由 P3/T007 产出并各留原件；另提供模板 diff。独立执行者在本次任务内对五个模板逐项打开，核两条路径指向同一候选集且模板仍单一 writer。缺任一份记录时记录具体缺口。
通过：两项分别可回读且指向同一候选集；五个模板每个只有一条声明路径；所需来源与证据齐备。
失败：两项指向不同候选集，或恢复成两个 writer、两套 P0，或回读记录缺失而被当成通过。
证据：两份回读记录与 `git diff --name-only` 范围的原件路径；由执行者发布，此处不是执行结果。

- [ ] **AC-T3-2**：模板声明的必留项与产物实际在场节一致；有机器可识别结构可判的必留项缺失时被只报告检查报出；仅散文声明的必留项如实报「无法判定/未覆盖」并交独立人读。关联 FR-N4-002、FR-N4-009。
验证：P3 实施者提供五个模板的声明与 P2 的只报告检查输出；独立执行者逐类打开模板，核声明为必留的节是否实际在场，并对受控制造的一处可判定缺失与一处散文声明分别核报告措辞。执行 owner 是独立验收者，时点是 P3 完成后。
通过：可判定必留项缺失被报出且报出具体项；仅散文声明项报「无法判定/未覆盖」；声明的必留集合与实际一致。
失败：可判定必留项缺失而无人报出；把仅散文声明项报成确定结论或静默通过；声明的必留集合与实际不符。
证据：只报告检查输出原件加模板声明读回；由执行者发布。

- [ ] **AC-T3-3**：可选节（P1/P2）集合因任务不同而不同。关联 FR-N4-011。判定方式：机器可判。
验证：独立执行者取两个不同任务的真实材料（本卡材料与任一在跑任务材料，只读），比对实际节集合。执行 owner 是独立验收者，时点是 P3 完成后。
通过：两份材料的实际节集合经比对确实不同；P1/P2 未在任何模板里被固定成一份清单。
失败：P1/P2 被固定成一份清单，或所有材料节集合相同。
证据：两份材料的实际节集合比对原件；由执行者发布。

- [ ] **AC-T3-4**：每类材料有可单独交付、可单独判定的结果与对应 FR/AC。关联 FR-N4-003。判定方式：只能人读。
验证：P3 作者提供每类的交付结果与 FR/AC 映射；独立读者核四类是否各有独立判定对象。执行 owner 是独立验收者，时点是 P3 完成后。
通过：四类各有可单独交付、可单独判定的结果与对应 FR/AC，映射逐条可回读。
失败：把整卡范围压成不可单独判定的切片，或用首切片当整卡。
证据：每类的交付结果与 FR/AC 映射原件；由执行者发布。

- [ ] **AC-T3-5**：每个引用真实可达，无坏锚、无指向不存在的节；零输入返回具体缺项且空与不可读分开。关联 FR-N4-004。判定方式：机器可判。
验证：P4 实施者提供逐条引用清单；独立执行者逐个打开材料中的来源引用与跨材料指针，并对四类材料各喂一次空输入/零输入。执行 owner 是独立验收者，时点是 P4 完成后。
通过：每个引用真实可达、无坏锚；零输入返回具体缺项；空与不可读分开报告，`unknown` 未填 0。
失败：存在坏锚或指向不存在的节而未报；零输入报成功，或空输入被当成通过。
证据：逐条可读回记录与零输入实跑输出；由执行者发布。

- [ ] **AC-T3-6**：`not-applicable` 带不适用理由与依据；`deferred` 三件齐（责任卡、触发条件、受影响结果）；P0 标题不被抹掉。关联 FR-N4-003、FR-N4-011。判定方式：机器可判加只能人读。
验证：P3 实施者提供受控负例；独立执行者制造 skip 与 deferred 各一例再恢复，核两类写法的四要素。执行 owner 是独立验收者，时点是 P3 完成后。
通过：not-applicable 带不适用理由与依据；deferred 三件齐；P0 标题在 deferred 状态下仍在场；恢复后仍通过。
失败：用 not-applicable 遮缺设计，或 deferred 缺件而被当作完成，或 P0 标题被 deferred 抹掉。
证据：受控负例前后读回原件；由执行者发布。

- [ ] **AC-T3-7**：对四类材料各喂一次空输入/零输入时返回具体缺项；空与不可读分开，`unknown` 不填 0。关联 FR-N4-004。判定方式：机器可判。
验证：独立执行者对四类材料各构造一次零输入并实际执行检查与校验路径，记录返回的缺项清单。执行 owner 是独立验收者，时点是 P4 完成后。
通过：四类各自返回具体缺项；空输入与不可读分别报告；`unknown` 未被填成 0。
失败：零输入报成功，或空输入被当成通过，或 `unknown` 被填成 0。
证据：零输入实跑输出原件；由执行者发布。

- [ ] **AC-T3-8**：分层落在既有三条机器层边界内（Phase 的 `## L2` 截断点、纯指针 index、Phase 写集位置），不新增机器 heading 或枚举。关联 FR-N4-008。判定方式：机器可判。
验证：独立执行者在认证 worktree 跑 `npx vitest run tests/acceptance/card-02-current.test.mjs` 与索引纯度检查，核分层未越出既有三条边界。执行 owner 是独立验收者，时点是 P3 完成后。
通过：校验器实跑通过；index 未承载正文；未新增机器 heading 或枚举。
失败：新增机器 heading 或枚举以表达分层，或 index 承载正文。
证据：校验器实跑输出与 index 纯度检查输出原件；由执行者发布。

- [ ] **AC-T3-9**：下游不回改——下游所需的条件、失败与权限边界仍在场；「下降」子句不参与判定。关联 FR-N4-005。判定方式：只能人读加机器可判。
验证：P3 实施者提供下游读回记录；独立执行者按下游真实所需逐项核条件、失败与权限边界是否仍在场，并核本次判定未使用任何字节量。执行 owner 是独立验收者，时点是 P3 完成后。
通过：下游所需的条件、失败与权限边界仍在场且下游未回改；判定中未出现字节基线或字节分母。
失败：下游被迫回改，或边界被删除、被 not-applicable 遮住、被改写，或判定中重新出现字节量。
证据：下游读回记录与真实 diff 原件；由执行者发布。

- [ ] **AC-T3-10**：四类消费都不丢失败与权限边界。关联 FR-N4-011。判定方式：机器可判加只能人读。
验证：P3 实施者提供四类受控负例；独立执行者对四类材料各制造一次失败/权限越界场景再恢复，核边界未被删除或遮蔽。执行 owner 是独立验收者，时点是 P3 完成后。
通过：四类消费都不丢失败与权限边界；恢复后仍通过。
失败：边界被删、被 not-applicable 遮住或被改写。
证据：受控负例前后读回原件；由执行者发布。

- [ ] **AC-T9-1**：两份标准的语言中性核心规则有本地解释与已读范围，写 `spec.md` 与写 decision-log 的真实写作必经该规则；阶段报告/交接、阶段反思、PR/交付说明三处出口的写作动作也必经该规则且各自 consumer 写清；ISO 未取得全文时保持范围限制。关联 FR-N4-006、FR-N4-007。判定方式：只能人读加机器可判。
验证：P4 实施者提供三处出口写作动作的 diff；独立执行者逐处读回三处出口的必做动作与各自 consumer 声明，并核 ISO 范围限制仍在场。执行 owner 是独立验收者，时点是 P4 完成后。
通过：三处出口各有「写前先读 WR001」必做动作且 consumer 逐处写清；规范正文仍只在一处；范围限制明确写出未取得全文。
失败：任一处出口缺必做动作或 consumer 未写清；把未读 ISO 条文当要求；规范正文出现第二份。
证据：三处出口写作动作的读回记录与 `git diff` 原件；由执行者发布。

- [ ] **AC-T9-2**：WR001 正文唯一；模板、仓内入口、检查三处挂载各有真实消费者且指向同一正文。关联 FR-N4-007。判定方式：机器可判加只能人读。
验证：P4 实施者提供三处挂载读回记录；独立执行者逐个打开三处挂载点，核其消费者与指向；并核 WR001 正文只有一处。执行 owner 是独立验收者，时点是 P4 完成后。
通过：正文唯一；三处挂载各有真实消费者且指向同一正文；无第二份正文。
失败：正文出现第二份，或挂载点只有文字没有动作或检查。
证据：三处挂载读回记录原件；由执行者发布。

- [ ] **AC-T9-3**：用四类真实文档的人工标注样本校准后跑只报告检查，分项报真阳性、假阳性与分母；默认退出 0、不评分、不加字数门；低于可靠层的项不进判定。关联 FR-N4-008。判定方式：机器可判。
验证：P5 实施者提供人工标注样本、分母与一组正反负载（同一判定合同下可区分的正例与负例各若干）；独立执行者实际运行只报告检查，核分项数字可复算、正反负载确实被区分（区分度不足或样本过薄时记 `inconclusive` 并写明原因，不折算成通过）、退出码为 0、未出现评分或字数门、未查不可靠项。执行 owner 是独立验收者，时点是 P5 完成后。
通过：分项报真阳性、假阳性与分母且可复算；中文计数按 `prd:361` 的既定算法（汉字各 1、连续拉丁/数字串 1、行内代码 1、标点与空格不计、以 `。`/`！`/`？` 断句、排除机器字面与引用块并说明例外）给出参考数字与分母；并用正反负载证明该评测合同的区分度与噪声（证据不足时记 `inconclusive`，不折算成通过），匿名与同尺在判定前定死；默认退出 0；无评分、无字数门；低于可靠层的项未进判定。
失败：出现评分、字数门或阻断行为；查了未校准项；不可判定项被当结果；正反负载无法区分却被报成通过，或区分度不足时用「打平／通过」掩盖而没有记 `inconclusive`。
证据：检查输出原件加人工标注样本与分母原件；由执行者发布。

- [ ] **AC-004（父号）**：核同一任务材料的链路指针完整性——decision→spec 与 phase→commit/PR 每环有可核指针。原「材料总字节较基线下降」子句及其字节基线／分母口径已退役（U-001／D-018），此判据不考核任何字节量、也不设字节基线。关联 FR-N4-012。判定方式：机器可判。
验证：P6 实施者提供链路清单；独立执行者在认证 worktree 跑 `node tools/cli/check-decision-log-chain.mjs specs/n4-writing-templates-research-eval-20261016/decision-log.md` 并逐环核指针。执行 owner 是独立验收者，时点是 P6 完成后。
通过：链路上每环有可核指针；判定中未出现任何字节量。
失败：任一环无指针；判定中重新引入字节基线或字节分母。
证据：指针检查输出原件；字节统计与字节基线均不作为判据。

- [ ] **AC-008（父号）**：写一份 spec 与一份 decision-log 后跑检查器，范围收窄到实测可靠层；默认退出 0、不接 stage/gate/CI 失败路径；未跑记 `unknown`；规范同时挂在文档必经入口且模板内建骨架。关联 FR-N4-008。判定方式：机器可判。
验证：P2 实施者提供模板与入口证据；独立执行者跑 `npx vitest run tests/acceptance/card-02-current.test.mjs` 与只报告检查，核退出码与失败路径未接。执行 owner 是独立验收者，时点是 P2 完成后。
通过：检查器范围收窄到实测可靠层；默认退出 0；未接任何失败路径；未跑时记 `unknown`；规范挂在必经入口且模板内建骨架。
失败：出现评分、字数门或阻断；查了实测不可靠项；不可判定项被当结果；规范只写在某个技能里。
证据：检查输出原件加模板与入口证据原件；由执行者发布。

- [ ] **AC-013（父号）**：对一份真实大材料做保结构的内容处理——全部小节按 P0/P1/P2 分级；P0 核对基准是该产物本次的权威声明；在场声明与实际一致；未改成扁平日志；重复事实可被只报告报出；不同级别的同一产物其 P1/P2 集合不相同。原「总字节下降」子句及字节基线／分母口径已退役，改由独立盲评承接（U-001／U-004、D-018）。关联 FR-N4-001、FR-N4-005、FR-N4-012。判定方式：只能人读加机器可判。
验证：P7 判定者按判定前定死的标准对匿名样本逐维度判定；独立执行者另外核分级清单、节集合比对与检查输出。执行 owner 是独立判定者（非实现者），时点是 P7 开始后。
通过：全部小节按 P0/P1/P2 分级；P0 基准是该产物本次权威声明；在场声明与实际一致；未改成扁平日志；重复事实可被只报告报出；不同级别的同一产物 P1/P2 集合不相同；五项维度逐项给三态且判定时间早于结论。
失败：未分级或 P1/P2 被固定；用全局固定清单当 P0 基准；下游回改；改成扁平日志；P0 小节被删；判定后补标准。
证据：分级清单、节集合比对、检查输出与独立盲评结论原件；由执行者发布。

- [ ] **AC-N4-01（本卡新造）**：在纯指针 index 里写一条中文标签要点（真实漏检例：`- **预期退出码**：0`），跑生产校验器时该写法被拦住并报出具体违规；恢复后仍通过；同类 `门禁命令`／`判定器`／`证据路径` 一并被拦住；旧材料的英文写法不被误伤。关联 FR-N4-009。判定方式：机器可判。
验证：P1 实施者提供冻结负例测试；独立执行者跑 `npx vitest run tests/contract/chinese-label-detection.test.mjs` 并核四类中文标签各被拦住、恢复后通过、英文写法仍通过。执行 owner 是独立验收者，时点是 P1 完成后。
通过：四类中文标签的越层写法各被拦住并报出具体违规；恢复为纯指针写法后仍通过；英文写法未被误伤；目标断言真实失败过。
失败：仍是漏检（`ok=true`、无纯度错误而违规在场），或修好后误伤旧材料的英文写法。
证据：RED 原件 `quality/tests/2026-10-17-001-build-plan-silent-layer-red-probe.txt` 与新冻结负例测试的 GREEN 输出；由执行者发布。

- [ ] **AC-N4-02（本卡新造）**：跑接入后的 `run-checks` 与只报告检查，报告可见、退出码仍为 0、不计入 `failures`；检查自身不可用时仍为 0 且不可判定项记 `unknown`。关联 FR-N4-008。判定方式：机器可判。
验证：P2 实施者提供 `run-checks` 输出；独立执行者跑 `node tools/cli/run-checks.mjs`，再受控制造检查自身不可用并重跑。执行 owner 是独立验收者，时点是 P2 完成后。
通过：报告可见；退出码仍为 0；未计入 `failures`；不可判定项记 `unknown`；不可用时仍为 0 且保留原始失败。
失败：检查阻断或改退出码；把只报告改造成门；不可判定项被报成确定结论；不可用被写进 `failures`。
证据：`run-checks` 输出与退出码原件、不可用受控场景输出原件；由执行者发布。

- [ ] **AC-N4-03（本卡新造）**：用归档与在跑任务材料做兼容读回——n2/n3 的 22 个 active 材料与归档材料零字节改动；合法旧材料通过、违规旧材料继续明确报错，且无新增回归（沿整篇兜底与中英对照表），对照表能解释旧写法。关联 FR-N4-009。判定方式：机器可判。
验证：P1 实施者提供范围声明；独立执行者跑 `git diff --name-only` 并与声明写集逐条比对，再对旧材料复跑。执行 owner 是独立验收者，时点是 P1 完成后。
通过：`git diff --name-only` 未出现 `specs/archive/**`、`specs/n2-*/**`、`specs/n3-*/**`；旧材料按改动前生产基线与当前生产实现对同一原字节复跑：合法输入通过，违规输入继续明确报错，未新增回归；对照表能解释旧写法。
失败：任一归档或在跑材料被改动；合法旧材料因本次改动失配报错、违规旧材料被静默放过，或新增回归。
证据：`git diff --name-only` 输出与旧材料复跑输出原件；由执行者发布。

用户澄清（2026-10-18）：/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/n4-writing-templates-research-eval-20261016/quality/evidence/2026-10-18-016-p1-compatibility-user-decision.json；正式确认：/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/n4-writing-templates-research-eval-20261016/quality/evidence/human-confirmations/2026-10-18-002-build-plan-compatibility-clarified.json。原基线错误与审查原件保留，不把澄清当作已执行或通过。

- [ ] **AC-N4-04（本卡新造）**：对 28 个 `SKILL.md` 逐路径跑收敛前后的 `grep -rl "完整来源权威" --include="SKILL.md" skills/` 并逐处读回——28 处全部收敛为「最小便携小卡 + 非权威」一形，权威唯一处仍是 `skills/catalog.yaml`，每处仍能回 catalog 与外部原文根。关联 FR-N4-004。判定方式：机器可判加只能人读。
验证：P4 实施者提供收敛前后 grep 输出；独立执行者跑同一条 `grep -rl "完整来源权威" --include="SKILL.md" skills/` 并逐处读回 28 个文件。执行 owner 是独立验收者，时点是 P4 完成后。
通过：28 处全部收敛为该一形；`skills/catalog.yaml` 仍是唯一权威；每处仍能回 catalog 与外部原文根；写集标「28 处之一」的 28 行与检索结果逐路径一致；19 个重叠路径按定序等待后合入。
失败：有路径未收敛或收敛后失去 catalog 坐标；出现第二处权威；改动越出这 28 行写集；与 n3 重叠的路径未按定序等待而先写。
证据：收敛前后 `grep` 输出原件、28 行写集比对与逐处读回原件；由执行者发布。

- [ ] **AC-N4-05（本卡新造）**：制造检查自身不可用的受控场景（命令不存在／依赖缺失／执行失败之一），再制造必留项缺失与盲评「无法判断」各一例——不可用时如实记「未覆盖」或 `unknown` 并保留原始失败与检测输出，不静默通过、不改退出码、不写进 `failures`、不阻断其它工作；必留项缺失按能力边界分列；盲评「无法判断」记具名原因、不折算成「更好」，全样本都「无法判断」的维度记未达成。关联 FR-N4-005。判定方式：机器可判加只能人读。
验证：P2 实施者提供不可用受控场景；P7 判定者提供逐维度记录；独立执行者核三类场景的实际输出、退出码与措辞。执行 owner 是独立验收者，时点是 P7 完成后。
通过：检查不可用时如实记「未覆盖」或 `unknown` 且保留原始失败与检测输出；退出码仍为 0；未写进 `failures`；不阻断其它工作；必留项缺失按能力边界分列；「无法判断」有具名原因且未折算成「更好」；全样本无法判断的维度记未达成。
失败：不可用被读成通过或被写进 `failures`；不可判定项被报成确定结论；「无法判断」被折算成「更好」或据此改判总体。
证据：受控场景实跑输出、原始失败与检测输出、盲评逐维度记录原件；由执行者发布。

- [ ] **AC-N4-06（本卡新造）**：对 15 项外部做法逐项做一次落点首验——逐项打开其既有落点文件，核「每项只吸一个机制」在正文可读回，并核登记条目；三项重复／不适用（发布与回滚、任务拆分、减少读者负担）写清落点与出处并交独立方核；未新增技能文件、未新增控制面、未搬整套清单。关联 FR-N4-010。判定方式：机器可判加只能人读。
验证：P5 实施者提供逐项落点清单；独立执行者逐项打开 15 个落点并核四个登记文件的新增条目。执行 owner 是独立验收者，时点是 P5 完成后。
通过：15 项逐项有可读回的落点与出处，且逐项写出最低可观察生效判据、给出至少一条真实负例、并在真实消费者上做过一次首验（取不到真实消费者时记 `unavailable` 与具名 owner，不折算成通过）；三项重复／不适用写清落点与出处并已交独立方核；四个登记文件各有对应新增条目；未新增技能文件、未新增控制面、未搬整套清单。
失败：任一项无落点或只有清单没有正文；任一项只写落点而没有可观察生效判据或没有首验；把三项重复项当已实施；新增技能文件或第二套控制面。n3 前置（非缺口）：`docs/architecture/move-map.json` 由 P5/T017 持笔（与 n3 重叠，等 n3 整卡完成后写）；n3 未完成或该条目未落时，其登记一条记 `incomplete` 与具名 owner，不记 `pass`。
证据：15 项逐项落点读回记录与四个登记文件条目原件；由执行者发布。

- [ ] **AC-N4-07（本卡新造）**：对 why 的三处落点逐个打开读回——三处各有 why 的既有落点正文，且 why 定为补强偏缺口、重复／不适用清单为三项。关联 FR-N4-010。判定方式：机器可判加只能人读。
验证：P5 实施者提供三处落点正文；独立执行者逐个打开三个落点，核 why 的正文在场与「补强偏缺口」定性。执行 owner 是独立验收者，时点是 P5 完成后。
通过：三处各有 why 的既有落点正文且可读回；why 定为补强偏缺口；重复／不适用清单为三项。
失败：三处有任一处缺落点；仍把 why 记作重复／不适用；在 n3 未完成时先写重叠路径。
证据：三处落点读回记录与写集定序行原件；由执行者发布。

- [ ] **AC-N4-08（本卡新造）**：按 G1 逐类声明本卡删除、合并或降档了什么；未做简化时不声称已简化，如实写明「只加规则而未简化既有物」。关联 FR-N4-013。判定方式：只能人读加机器可判。
  - **受影响 ID**：R-012、D-018、ADR-0049:25
验证：P5 实施者提供三类声明清单；独立执行者逐条核声明与真实 diff 是否一致，并对「只加规则」的情形核是否如实标注。执行 owner 是独立验收者，时点是 P5 完成后。
通过：三类声明逐条在场且与真实 diff 一致；未做简化的部分如实标注「只加规则而未简化既有物」；声明与 diff 不一致处被记为事实。
失败：未声明删除/合并/降档；把「只加规则」说成已简化；声明与真实 diff 不一致而未被记为事实。
证据：三类声明清单与 `git diff --name-only` 输出原件；由执行者发布。


> 验收判据停留在产品层；全局 oracle 映射见「需求到任务追踪」，精确命令留给所属 Phase。
>
> **同号内容重划记录（superseding 事实）**：decision-log 的 `AC-N4-06` 含「why 按补强偏缺口在三处落点各可读回」，本节把它拆到 `AC-N4-07`（why 独立可判），`AC-N4-06` 只留 15 项落点与登记；decision-log 的 `AC-N4-04` 失败条件写「与 n3 重叠的 10 个路径」，本节按实测改为 19（见 PFACT-011、PFACT-012）。两处都是本卡材料内的重划，不改 decision-log 的历史文字，编号同号承接不变。

## 12. 风险、未决与交接

本节回答：哪些触发可能损害结果，由谁在哪个阶段处理。

- **RISK-01**：中文标签漏检被留到实施后才被发现
  - **受影响 ID**：PFACT-001、FR-N4-009、AC-N4-01
  - **触发条件**：P1 未先写冻结负例，直接在实施后才补测试
  - **后果**：无法证明「由漏检变被拦住」这一行为变化，RED 变成事后构造
  - **缓解或停止**：P1/T001 先以当前合法 control 写冻结负例并实跑取得 RED，再改生产代码；旧001探针不是有效 RED，本轮只读 probe 也不冒冻结测试执行
  - **处理阶段**：P1
  - **验证**：冻结负例的目标断言在改动前真实失败，改动后通过；原件见 `quality/tests/2026-10-17-001-build-plan-silent-layer-red-probe.txt`

- **RISK-02**：模板字面改动打断两个逐字 oracle 测试
  - **受影响 ID**：PFACT-004、PFACT-005、FR-N4-009、AC-N4-03
  - **触发条件**：改 `phase-template.md` 的 `### G-2 纯文档示例（既有字段，无新增运行行为）` 标题、四个 `<!-- card05-author-example:* -->` 注释块或 `:291-302` 的 12 个中文标签行；或改 `spec-template.md` 的 `<!-- c01-acceptance-object-check -->` 与 producer 字节
  - **后果**：`tests/contract/post-build-plan-missing-index.test.mjs` 与 `tests/contract/card05-author-material-consumer.test.mjs`、`tests/contract/acceptance-object-required-fields.test.mjs` 由绿转红；`phase-template.md:177` 的 `#### 示例：` 切分串当前不存在，改动时才可能暴露
  - **缓解或停止**：P3 与 P4 的同批同步这三个测试；改前先实跑取得基线，改后再实跑
  - **处理阶段**：P3、P4
  - **验证**：三个测试在改动前后各实跑一次，结果与差异留原件

- **RISK-03**：模板改动破坏发布期字节稳定性
  - **受影响 ID**：PFACT-007、FR-N4-002、AC-N4-03
  - **触发条件**：五个模板在发布打包的捕获与暂存之间发生字节漂移
  - **后果**：`runtime/distribution/skill-bundle-release.mjs` 的 `captureSourceBytes()` 报发布源不稳定
  - **缓解或停止**：模板改动只在本卡 Phase 内一次完成，Phase 内不再二次改写同一文件
  - **处理阶段**：P3、P4
  - **验证**：`runtime/distribution/skill-bundle-release.mjs:345-346` 的稳定读取在每次模板改动后仍通过

- **RISK-04**：why 三处落点写成空声明
  - **受影响 ID**：PFACT-008、FR-N4-010、AC-N4-07
  - **触发条件**：只在三处各加一句提及，不写 why 的实际做法
  - **后果**：AC-N4-07 表面上通过，实际仍是零锚点
  - **缓解或停止**：P5 为三处各写 why 的实际做法正文；独立读回时按「能否据此追查一处真实代码成因」判定
  - **处理阶段**：P5
  - **验证**：三处落点逐处读回，正文足以让人按逐级回读追到一处真实成因

- **RISK-05**：15 项采用被误当已实施
  - **受影响 ID**：PFACT-009、FR-N4-010、AC-N4-06
  - **触发条件**：把重复／不适用三项当已实施，或只写登记不写正文
  - **后果**：AC-N4-06 虚过，父需求 R-010 的采用承诺落空
  - **缓解或停止**：三项逐项写清落点与出处并交独立方核；独立读回时核「正文可读回」而不只看登记
  - **处理阶段**：P5
  - **验证**：15 项逐项打开落点文件核正文；四个登记文件各有对应条目

- **RISK-06**：与 n3 的重叠路径被抢先写
  - **受影响 ID**：PFACT-011、PFACT-012、FR-N4-012、AC-004
  - **触发条件**：n3 未完成即写 19 个重叠路径之一
  - **后果**：覆盖 n3 未提交改动或丢失其行为
  - **缓解或停止**：n3 已交付结束，不再等待；P1、P3、P4、P5 均先读当前 main 的实际差异，保全其 G-2、测试/审查方法与来源信息，只补 N4 差量；N4 内部共享路径仍按真实依赖由唯一 writer 顺序写。若出现新的真实共享 writer，只停对应路径并交现 owner 协调，不新增锁平台
  - **处理阶段**：P3、P4、P5
  - **验证**：合入前读回先写方该路径的已核实状态；无法回读时写 `unknown` 与原因

- **RISK-07**：未读 ISO 条文被当要求
  - **受影响 ID**：PFACT-013、FR-N4-006、AC-T9-1
  - **触发条件**：把 §5.2.4–Annex B 当作已读要求写进规则
  - **后果**：虚假标准符合声明
  - **缓解或停止**：保持范围限制到取得合法全文为止；规则正文只采用已读到的两标准语言中性核心原则
  - **处理阶段**：P4
  - **验证**：范围限制在正文中明确写出未取得全文

- **RISK-08**：验收对象缺项被当成通过
  - **受影响 ID**：PFACT-014、AC-T9-1
  - **触发条件**：把 `ok=false` 的验收对象检查读成已具备
  - **后果**：验收对象从未真实建立，verify-code 无从消费
  - **缓解或停止**：如实记录 `ok=false` 与缺项清单；build-code／verify-code 的对应 Phase 补齐 `cli.command`／`entry_ref`／`sample_ref`／`oracle_ref` 后再判
  - **处理阶段**：P7、verify-code
  - **验证**：本步原件 `quality/evidence/2026-10-17-build-plan-acceptance-object-check.json` 的 `missing_fields` 在后续阶段被逐项补齐或如实保留为缺口

- **OPEN-01**：四类材料模板的具体路径由本文件按仓内实存文件点名
  - **受影响 ID**：PFACT-003、FR-N4-002、FR-N4-011、AC-T3-1
  - **负责人**：build-plan 作者（本步）
  - **影响**：父需求只说「各自既有模板」未点名路径；若点名与实际不同会选错写入文件
  - **处理阶段**：build-plan（本步已处置）
  - **关闭条件或停止**：本步已逐个实读五个模板的存在与行数（PFACT-003）；若后续发现父需求所指不同，按同一决定改点名，不动表内容

- **OPEN-02**：原 n3 并发写入等待已解除；当前计划尚未授权实施
  - **受影响 ID**：PFACT-011、PFACT-012、FR-N4-012、AC-004、AC-N4-04
  - **负责人**：主会话交接当前 main 与原件；未来 N4 各路径唯一 writer 保全先写方
  - **影响**：N3 交付结束与本轮用户确认已满足原外部定序条件；不再等旧 worktree 或 N3 全 AC 通过。N4 内部共享路径依赖保留，读回后仅补差量。
  - **处理阶段**：本轮 build-plan 已解除外部等待；N4 build-code 仍未开始
  - **关闭条件或停止**：本轮仅合入 main、更新计划；展示当前计划后由用户确认是否进入实施。19 路径口径保留为历史声明交集，不改 decision-log 原文字，也不把 N3 未达质量条件转成新增 gate

- **OPEN-03**：研究来源方法无程序消费者
  - **受影响 ID**：PFACT-006、FR-N4-004、AC-T3-5
  - **负责人**：材料作者与独立验收者
  - **影响**：不得把「来源方法已生效」当既成事实；本卡只落写法要求，不新增 runtime 调用点
  - **处理阶段**：P4
  - **关闭条件或停止**：按治理边界写明缺口（无 consumer 即如实记，不新增重复控制面）；若后续出现真实 consumer，另行登记

- **OPEN-04**：why 三处落点当前零锚点
  - **受影响 ID**：PFACT-008、FR-N4-010、AC-N4-07
  - **负责人**：P5 实施者
  - **影响**：AC-N4-07 当前不可达；若不写正文则永远不可达
  - **处理阶段**：P5
  - **关闭条件或停止**：三处各有 why 的实际做法正文并可据此追查一处真实代码成因

- **OPEN-05**：独立盲评的判定者身份与样本清单尚无原件
  - **受影响 ID**：FR-N4-001、FR-N4-005、AC-013、AC-N4-05
  - **负责人**：verify-code 指派不参与本次改动的独立方；样本清单落本卡验收材料
  - **影响**：判定前未落实会导致自审自判或验收口径落空
  - **处理阶段**：P7、verify-code
  - **关闭条件或停止**：判定者身份与上下文差异有原件、样本清单在判定前定死

- **OPEN-06**：U-005…U-008 的用户答复只有结论级转述，无逐字原件
  - **受影响 ID**：FR-N4-005、FR-N4-010、AC-013、AC-N4-06、AC-N4-07
  - **负责人**：make-decision 主会话补落 11 批消息与 BATCH-012 逐字原件
  - **影响**：这四条变更的授权强度只到转述级，不得被引作「用户原话」
  - **处理阶段**：本卡范围外，如实保留
  - **关闭条件或停止**：逐字原件落盘并给消息定位；未补前按结论级转述标注

- **OPEN-08**：`docs/architecture/move-map.json` 的 N4 差量登记尚未实施（n3 外部前置已满足）
  - **受影响 ID**：FR-N4-010、AC-N4-06
  - **负责人**：P5/T017 实施者（该路径已在其 Phase 写入集内）
  - **影响**：该文件已有 N3 的职责/consumer/保留登记；T017 在 N4 内部定序后重读、只补 N4 差量，不重登记 N3。未落 N4 条目时 AC-N4-06 相应记 `incomplete` 与具名 owner；原因是 N4 未实施，不再是 n3 未完成
  - **处理阶段**：P5、P7
  - **关闭条件或停止**：该文件出现本卡 15 项登记条目并与落点一致；未关闭前 AC-N4-06 的登记一条记 `incomplete`，不记 `pass`


- **OPEN-07**：新冻结负例的文件名与 decision-log 原声明不同
  - **受影响 ID**：FR-N4-009、AC-N4-01
  - **负责人**：build-plan 作者（本步）
  - **影响**：decision-log 写 `tests/contract/n4-chinese-label-detection.test.mjs`；`docs/architecture/test-asset-governance-rules.md:33` 明确「禁止以任务名、卡号或里程碑名命名测试文件，名称描述被测行为」，且注明规则作用于新测试。本文件改点名为 `tests/contract/chinese-label-detection.test.mjs`（去任务名前缀），行为与冻结负例性质不变
  - **处理阶段**：build-plan（本步已处置）
  - **关闭条件或停止**：实施按本文件点名的路径落文件；若 reviewer 判定必须沿原声明名，按原声明名落并在同处记录该判定

## 13. 业务影响与回归范围

本节回答：改动影响哪些既有行为，哪些路径须保持。

### 机器侧校验与只报告检查

本节回答：该功能的既有行为、变化与回归路径是什么。

- **既有行为**：`validatePostPhaseContract` 对合法材料返回 `ok=true`、对违规返回具体 `errors`；`checkSkillConsistency` 返回 `{failures, reports}` 且退出码只由 `failures` 决定
- **本需求影响**：索引纯度检查多覆盖四类中文标签；两项 `valid` 改由真实条件判定；`reports` 多一组写作规则可靠层与必留项在场条目。退出码语义不变
- **回归路径**：`npx vitest run tests/acceptance/card-02-current.test.mjs`、`npx vitest run tests/contract/post-build-plan-missing-index.test.mjs`、`npx vitest run tests/contract/card05-author-material-consumer.test.mjs`、`npx vitest run tests/contract/acceptance-object-required-fields.test.mjs`、`node tools/cli/run-checks.mjs`
- **验收**：AC-N4-01、AC-N4-02、AC-008

- **可能受冲击的业务规则**：既有英文写法必须继续通过；错误文案不得改动；验收标题识别集合不得扩充；`failures` 集合不得扩张
- **明确无影响**：本卡无数据迁移、无认证变更、无前端路由或组件改动；共享路径存在但由 P3→P4→P5 真实依赖与唯一 writer 串行。外部引用可达性与独立审查仍按实际执行/不可用记录，不能概称无外部调用

## 补充材料

本节回答：推导、原始输出与被否方案到哪里查。

- 决策与理由权威：`specs/n4-writing-templates-research-eval-20261016/decision-log.md` 的 `## 工作包与决定`（D-001…D-022）
- 原始需求逐字原件：`specs/archive/skills-framework-redesign-20261014/prd.md` 的 N4 章节（`:354`–`:371`）、选节合同（`:213`–`:226`）、G1（`:195`）、ORACLE-T3/T9（`:253`、`:259`）、AC 号归属（`:285`）
- 方向记录：`docs/adr/0049-retire-byte-drop-acceptance-for-anonymous-blind-review.md`、`docs/adr/0050-chinese-task-card-field-names-with-silent-detection-fix.md`
- 既有约束：`docs/adr/0043-document-standards-checks-are-report-only.md`、`docs/adr/0046-single-source-registration-authority.md`、`docs/architecture/test-asset-governance-rules.md`
- 本步真实执行原件：`quality/tests/2026-10-17-001-build-plan-silent-layer-red-probe.txt`、`quality/tests/2026-10-17-002-build-plan-report-only-gap.txt`、`quality/evidence/2026-10-17-build-plan-acceptance-object-check.json`
- 调研原件：`quality/evidence/decision-log-refs/research.md` 与同目录五份报告（sha256 见 decision-log「外置事实索引」）

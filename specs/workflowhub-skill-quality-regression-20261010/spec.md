# 功能规格：技能质量回归定点修复（workflowhub-skill-quality-regression-20261010）

读者：实施者、独立审查者与后续 verify-code 验收读者。
读完要能：定位本次要修的八个机制、每条改动的来源、唯一验收判据与不覆盖边界。

这是写作指引，不是质量门；机器读取的标题与标签、被锁定文字、真实逐字声明按原样保留。

> 基于已接受的 `decision-log.md`（make-decision 阶段用户第 13 步确认，材料提交 `c28e2fb1`）。
> 本文件承载产品行为与全局实现设计；`phases/P<n>.md` 只写各 Phase 的实现增量，
> `phases/index.md` 只存指针。产品目标与已接受的取舍以 decision-log 为权威，本文件不重写一份。

> **叙事主干**连续说明问题、目标、取舍与机制。所有可判定验收正文只在 `Appendix A`；
> 主干只保留稳定指针，避免双写。

- **功能名**：技能质量回归定点修复
- **来源**：`decision-log.md`（`## 原始需求` R-001–R-017、`## 需求变更记录` U-001–U-020、`#### ADR-001`–`#### ADR-011`、`## 要改哪些文件`、`## 验收面`）
- **状态**：草稿；等待用户对当前计划的实际确认（build-plan 第 12 步）
- **任务形态**：post cohort；材料为 `decision-log.md` + 本 `spec.md` + 独立 `phases/P<n>.md` + 纯指针 `phases/index.md`

## 速读卡（30 秒）

- **一句话需求**：把 2026-10-08「技能现代化」之后实际执行质量下降的**机制**定点修掉，且不让仓库变复杂、不破坏薄核心。
- **核心改动点**：
  - 审查轴统一：删掉「OCR 不可用就换执行者」这个概念，`architect-code-review` 回到「同源补充轴、独立执行、与 OCR 可用性无关」
  - 写集校验：治理文件豁免 + 「已按 Dependency 串行」的 Phase 对可共享写集（补两条契约测试）
  - 纯删：4 份逐字重复复盘段与 131 B 同 sha 句各收敛为一处；删 `catalog.yaml` 44 条 legacy 登记
  - decision-log 模板按**下游消费**重设计，方法文件只要求模板里有落点的东西；ADR-023 补归档
  - 矛盾与登记修正（九类）；5 个 workflow 的 17 处步骤判据改写（净行 0）
  - 全量回归的宽口径收回；`steps.json` 只做 JSON 空白归一（内容一字不删）
- **最大影响面**：`CONSTITUTION.md`／`AGENTS.md`／`README.md`／`GLOSSARY.md`／`docs/standard-workflow.md` 五份治理文本、5 个 workflow 的 `SKILL.md`／`steps.json`／`skill-deps.yaml`、`tools/cli/stage-runtime.mjs`、`runtime/stage/stage-content-contracts.mjs`、`skills/decision-log/**`、`skills/catalog.yaml`。
- **验收信号**：逐 AC 在 `Appendix A`；每个 Phase 的 `gate_cmd` 在 HEAD 上真实 RED、实施后真实 GREEN；`run-checks` exit 0（HEAD 基线实测 0）。
- **本次不宣告「已修好」**：效果由用户在新版 workflowhub 上另跑新任务判断（AC-006、R-010）。

## 来源与决策映射

本节回答：每项需求如何回到原始来源和已确认决定。

> 本节只保存 ID 关系，不复制 decision-log 正文。`U-`／`R-` 是当前 decision-log 的 producer 编号；
> `ADR-001`–`ADR-011` 是**该 decision-log 内部的决定编号**，与仓库领域 ADR（`docs/adr/0035`–`0037`）不是同一对象，两处编号不得互相引用混用。

| 来源 ID | 决定 ID | FR / AC ID | 状态 / 受影响范围 | 未决 / 交接 |
| --- | --- | --- | --- | --- |
| 用户 2026-10-10 授权（逐字回复「queen计划／两项都授权」，原件 `quality/evidence/human-confirmations/2026-10-10-001-build-plan-accept.json`） | 无 `ADR`（计划确认时追加的授权范围，**不是** decision-log 的决定） | `FR-QUAL-014` / `AC-007`；`FR-QUAL-015`；`FR-QUAL-016` / `AC-008` | `current`；授权把 `OPEN-05`（`workflows/verify-code/design-alignment.mjs` 断链）纳入本次修、批准 `OPEN-13` 的审查管道修复方案 A/B（C 仅登记） | P10/T026–T028、P11/T029–T030；P9 汇总同步 |
| `R-001`、`R-002`、`R-009`、`R-012` | `ADR-001`、`ADR-007` | `FR-QUAL-001` / `AC-003` | `current`；治理文本、技能正文、runtime 接线 | P1/T001、T002 |
| `R-012`、`U-005`、`U-020` 第 2 项 | `ADR-007` | `FR-QUAL-002` / `AC-004`、`AC-005c` | `current`；改宪配套与领域 ADR-0035 | P1/T004 |
| `U-005`、`U-006`、`U-007`、`U-020` 第 2 项 | `ADR-007` | `FR-QUAL-003` / `AC-003` | `current`；冻结测试改而不删、受影响清单 | P1/T003 |
| `U-002`、`OI-006`、`U-007` | `ADR-002`、`ADR-008` | `FR-QUAL-005` / `AC-003` | `current`；`runtime/stage/stage-content-contracts.mjs` | P2/T005–T007 |
| `U-007`、`U-009`、`U-020` 第 1 项 | `ADR-005` | `FR-QUAL-006` / `AC-005a`、`AC-005b`、`AC-005c` | `current`；5 份 `SKILL.md`、`skills/catalog.yaml` | P3/T008–T010 |
| `R-015`、`R-016`、`U-014`、`U-015`、`U-016`、`U-017` | `ADR-005`、`ADR-006` | `FR-QUAL-007` / `AC-003`、`AC-005c` | `current`；`skills/decision-log/**`、`docs/adr/0037`；入口消费者旧 U 句 | P4/T011–T013；P3/T008（仅入口该句） |
| `U-014`、`U-018` 第 2 项、`R-005`、`R-014` | `ADR-003`、`ADR-006` | `FR-QUAL-008` / `AC-003`、`AC-005c` | `current`；九类矛盾与登记 | P5/T014–T017 |
| `R-012`、`R-013`、`R-017`、`U-008`、`U-010`、`U-013`、`U-019` | `ADR-011` | `FR-QUAL-009` / `AC-006`、`AC-003` | `current`；5 个 workflow 共 17 处（`R-013`「全程领域维护零触发」落在 P6 单元 #4＝`make-decision:27`） | P6/T018–T020 |
| `R-011`、`U-006`、`U-018` 第 3 项 | `ADR-010` | `FR-QUAL-010` / `AC-003` | `current`；`docs/standard-workflow.md:15` | P7/T021 |
| `R-014`、`U-018` 第 4/5 项、`U-020` 第 3 项 | `ADR-005`、`ADR-006` | `FR-QUAL-011` / `AC-003`、`AC-004` | `current`；`workflows/*/steps.json`、6 条坏引用 | P8/T022–T023 |
| `R-002`、`R-004`、`R-010`、`R-011` | `ADR-001`、`ADR-004` | `FR-QUAL-012` / `AC-003`、`AC-004` | `current`；交付可核查与如实披露 | P8/T023、P9/T024–T025 |
| `R-001`、`R-003`、`R-005`、`R-009` | `ADR-001`、`ADR-003` | `FR-QUAL-013` / `AC-001`、`AC-002` | `current`；审计口径与覆盖（原件 R5/R6） | P9/T024 |
| `R-010`、`U-001`、`U-011` 第 2 项 | `ADR-001` | `FR-QUAL-013` / `AC-005a`、`AC-006` | `current`；字节事实与用户实跑读回 | P9/T024、T025 |

每条 FR/AC 都必须能回到本表；范围修订只追加受影响映射与修订说明，不另建需求账本。
`U-001`–`U-020` 与 `ADR-001`–`ADR-011` 中未单列的条目由本表三列（来源 → FR/AC → Phase/Task）承接，
逐条处置表在 `decision-log.md` 的「未落项与处置」与「未决项」，本文件不复制。

## 1. 需求解释：问题与紧迫性

2026-10-08「技能现代化」之后，实际执行质量反而下降：`decision-log` 变啰嗦、`build-plan` 中途只剩一个 Phase、`build-code` 未跑完。用户随后把范围扩到「主动发现更多衰退并全部处理」并要求查清根因。

这些不是观感问题：诊断已把根因落到可证伪的机制上（方法文本互相打架、判据在常驻序列里被抢跑、写集校验与真实材料不符），并且**同样的机制会在每个新任务上重复生效**。修复的紧迫性来自复现性，而不是严重性形容词：只要这些机制还在，下个任务的产物会以同样方式退化。

本任务的定位是**定点修掉引起退化的机制**，不是回滚那轮改动，也不是加一层覆盖式规则。

## 2. 背景、目标与范围

### 背景

现代化把 `skills/**` + `workflows/**` 的 `SKILL.md` 总字节从 247,333 带到 296,850（+20.0%），真正被执行者读进上下文的那部分变胖；同时引入/暴露了互相矛盾的规则。三份后续审计（`R5` 16 个改动文件逐条结论、`R6` 36 项逐技能结论 + `S-01`–`S-18`、`R4` 逐文件 diff）与五份契约考古（`F1`–`F5`）提供了事实来源；`W1` 按写作标准推翻了 `F2` 的三处删除判定；`X1`／`X2`／`Y1`／`Z1` 给出了根因与横切清单。本任务自身的七次独立审查/复核回执**全部是 `needs_revision`、从未取得 `pass`**——这一点在 §12 如实转述，不得被读成已通过独立审查。

### 目标

- 八类退化机制各有一段可独立核查的修复，且每条修复绑定它针对的发现编号（`AC-003`）。
- 修复过程本身不新增 stage／gate／字段／文件类型／新机制；优先「删」与「并」，其次「改一句话」，最后才「加」（`ADR-001`、`U-003`）。
- 删除项逐条给出「model-relative no-op 证据」或「承接落点」（`AC-005b`）；同一意思只留一处权威，且每个保留的指针带明确触发分支（`AC-005c`）。
- `SKILL.md` 总字节不高于修复前的 296,850 B——**只作事实记录，不作质量结论**（`AC-005a`、隐藏前提 B）。

### 范围内

- 修复对象：`workflows/**`（5 个 workflow）与 `skills/**` 的方法文本、模板与相关契约；被诊断证明为根因、且用户已授权改动的 `runtime/stage/stage-content-contracts.mjs` 与 `tools/cli/stage-runtime.mjs` 的既有判定面（`U-002`／`OI-006`）。
- 覆盖口径：全量文件级回归审计已经完成（`R5`／`R6`），本任务承接其结论并逐条落地，不重做逐文件复述。

> 非目标只在第 10 节维护，避免两份真相。

## 3. 用户场景与状态覆盖

本节回答：谁在什么条件下触发动作，正常与异常结果是什么。

### SCN-001：下个任务的 make-decision 产出 decision-log

- **角色**：后续任务的 make-decision 主会话
- **前提**：新版 workflowhub（本任务改动已交付）被用于一个新任务
- **触发**：按当前 `skills/decision-log/SKILL.md` 与模板编写 `decision-log.md`
- **结果**：文档按「下游消费」形状组织；`## 大纲地图` 与正文顶层节逐行对应；12 类过程内容外置到任务库并留带触发条件的指针；`## 验收面` 带覆盖矩阵
- **回写**：本次**不实跑验证**（`U-011` 第 2 项）；判定归 `AC-006` 的用户实跑

### SCN-002：下个任务的 build-plan 产出 Phase 计划

- **角色**：后续任务的 build-plan 主会话与实施者
- **前提**：一个真实存在共享写集的计划；`runtime/stage/stage-content-contracts.mjs` 已按 P2 放宽
- **触发**：用 `validatePostPhaseContract` 校验 `spec.md` + `phases/index.md` + 各 `phases/P<n>.md`
- **结果**：治理文件共享不再报重复；**已按 `Dependency` 真正串行**的 Phase 对可共享同一路径；非串行的同改仍报错
- **回写**：`AC-003` 由 P2 的 oracle 判定，含非串行同改确实报错的反向用例

### SCN-003：做代码审查的执行者遇到 OCR 不可用

- **角色**：执行 `build-code`／`verify-code` 代码审查的会话
- **前提**：`ocr` 命令不存在（ENOENT）或版本低于 1.12.9；或已安装但执行失败/超时/取消
- **触发**：按 `workflows/{build-code,verify-code}/SKILL.md` 的审查轴段落决定怎么审
- **结果**：如实记 `unavailable`/`unknown` 并保留检测输出与原始失败，**不换执行者**；`architect-code-review` 作为同源补充轴独立执行，与 OCR 可用性无关
- **回写**：`AC-003` 由 P1 的 oracle 判定；措辞锁测试同批改而不删

### SCN-004：交付时核对未修项与效果

- **角色**：本次任务的主会话、独立审查与后续 verify-code 读者
- **前提**：十个 Phase 的改动已落地；用户尚未实跑新任务
- **触发**：读 P9 的事实汇总与 §12 的披露
- **结果**：逐 AC 一行事实（含字节实测、覆盖缺口、`unavailable` 项），**不出现「已修好」结论**；两个新发现（下方 `RISK-02`／`OPEN-01`）逐条具名
- **回写**：`AC-004`、`AC-005a`；效果判定留给 `AC-006`

### SCN-005：审查管道坏掉时的事实守恒

- **角色**：后续任何派发独立审查的主会话、审查路线维护者
- **前提**：某条 provider 路线失败，且它的原始输出被保留在 `quality/reviews/`；解析器与进度判据处于修复前的状态
- **触发**：`OUTPUT_INVALID`／`PROCESS_STALLED`／`PROVIDER_HEALTH_FAILED` 三类失败各自发生时
- **结果**：三件事同时成立——(a) 唯一可解析的 findings JSON 不再被整份丢弃；(b) 活着在流的心跳不会被算成「无进展」、真静默仍会停；(c) 失败来源的原始件被只读回读一次并记录「是否可救回发现」；失败**不**被改写成通过或空 findings
- **回写**：`AC-007`；`AC-008` 由 `OPEN-05` 的处置回写

### 状态覆盖清单

- [ ] **默认态**：SCN-003 的「OCR 可用、正常走 OCR」对照用例（P1 保留 installed 路径断言）
- [ ] **空态**：SCN-002 的「计划无任何共享写集」对照用例（P2 的既有契约测试）
- [ ] **错误态**：SCN-002 的「非串行同改仍报错」反向用例；SCN-003 的「OCR 不可用如实记 unavailable」
- [ ] **加载态**：N/A — 本次改的是方法与 runtime 判定面，没有 UI 加载视图
- [ ] **取消态**：SCN-003 的「OCR 执行被取消」分支（如实记 unavailable，不回退执行者）
- [ ] **边界态**：SCN-003 的版本边界 1.12.8／1.12.9（`ENOENT` 与「低于 1.12.9」的判定面锁在 P1 的 oracle 里）
- [ ] **权限态**：N/A — 不改变权限、认证与凭据边界
- [ ] **竞态**：N/A — 唯一共享写入面是治理文件；并发冲突由既有 `git diff --name-only` 独立审查兜底（`ADR-008`），本次不新增机制

## 4. 产品事实与假设（PFACT）

本节回答：哪些事实已核实，哪些推断或未知影响需求。

> 每条只选择一种状态，其他状态字段删除。`verified` 必须是本任务实读/实跑得到的事实。

- **PFACT-001**：`SKILL.md` 字节基线可复算
  - **状态**：`verified`
  - **证据或来源**：`decision-log.md:847-855` 的实测表（现代化前 `721cd7fb^` 247,333 B；`9f817a71` 296,850 B；命令 `git ls-tree -r --long <ref> -- skills workflows | grep 'SKILL.md' | awk '{s+=$4} END {print s}'`）
  - **关联**：FR-QUAL-006、FR-QUAL-013、AC-005a
- **PFACT-002**：M1 的四类删除对象都真实存在且量级与材料一致
  - **状态**：`verified`
  - **证据或来源**：本任务实读（`c28e2fb1`）：`skills/catalog.yaml:82-562` 的 `legacy_registration_history` 实为 481 行 / 20,466 B / 44 条；`build-plan:42`／`build-prd:34`／`verify-code:52`／`make-decision:62` 四份复盘段各 570 B、sha256 前 16 位同为 `595c00b4c1c48356`；同 sha 的「本地偏离」句在四份 `SKILL.md` 中各 596 B，其末句「迭代时核上述具名子文件的更新及更优候选，说明真实源差、本地偏离与采用理由，不自动追 HEAD。」= 131 B
  - **关联**：FR-QUAL-006、AC-005b
- **PFACT-003**：写集校验当前把「未授权同改」与「串行 Phase 共享」一律判为重复，且无治理文件白名单
  - **状态**：`verified`
  - **证据或来源**：实读 `runtime/stage/stage-content-contracts.mjs:413-417`（`write set duplicates … owned by …`）与 `:640`（`ok: errors.length === 0`）；该文件 `白名单|whitelist|governance` 命中 0 ⇒ 白名单是新增
  - **关联**：FR-QUAL-005、AC-003
- **PFACT-004**：OCR 换执行者的实现面集中在 `tools/cli/stage-runtime.mjs:1007-1027` 的 `runner` 闭包与 `:393`／`:440-451`／`:577-578`／`:633` 的 `nativePacketFallback` 联动点
  - **状态**：`verified`
  - **证据或来源**：实读 `c28e2fb1`；`:1014` 是 `detection.status === "not_installed"` 分支，`:1026` 返回 `{...result, executor:"wh-review", fallback}`
  - **关联**：FR-QUAL-002、AC-003
- **PFACT-005**：引用 `tools/cli/stage-runtime.mjs` 的测试计数与受影响集合
  - **状态**：`verified`
  - **证据或来源**：本任务两轮独立扫描（`c28e2fb1`）：仓库级分类给出 **30** 个测试文件，其中删回退后**必须同步改的 6 项**＝`tests/contract/code-review-ocr-fallback.test.mjs`、`tests/contract/verify-architect-acceptance.test.mjs`、`tests/review/card09-targeted-dispatch.test.mjs`、`skills/wh-review/scripts/__tests__/simple-contracts.test.mjs`、`skills/wh-review/scripts/review-materials.mjs:93` 的登记（后经实读确认**未登记**被改名路径，故不改）、`docs/architecture/move-map.json` 的登记；另一轮对 `tests/**` 的原始复扫给出 **32** 个文件（含仅 import 的）。两个计数口径不同、均未证明为全集 ⇒ 实施时以当次 `grep -rl stage-runtime tests skills --include=*.mjs` 的输出为分母，差异如实登记；decision-log 记「约 35 个测试」是未产出清单的估计
  - **关联**：FR-QUAL-003、AC-003
- **PFACT-006**：`simplicity-guard`／`architect-code-review`／`workflowhub-host-protocol` 三份技能里「同源补充轴」这个词当前 0 命中；该词当前只出现在 `workflows/build-code/SKILL.md:48`
  - **状态**：`verified`
  - **证据或来源**：本任务 grep（`c28e2fb1`）。因此 M3a 的「后两者引用它」不是既有事实，P1 必须**先普查三份技能的现行措辞**再改写
  - **关联**：FR-QUAL-001、AC-003
- **PFACT-007**：`skills/spec-plan/templates/phase-template.md` 的 13 项验收小节全仓唯一、无重复
  - **状态**：`verified`
  - **证据或来源**：`U-020` 第 1 项裁定 + 本任务实读 `:12`（判定规则）与 `:228`（授权边界）
  - **关联**：FR-QUAL-006、AC-005b
- **PFACT-008**：decision-log 模板现状与 M3b 的增量
  - **状态**：`verified`
  - **证据或来源**：实读 `skills/decision-log/templates/decision-log-template.md`（140 行）：`## 大纲地图` **已存在**（`:12`，故「加回」在 HEAD 上是「保留为本文节目录」）；`## 退役登记` 0 命中（新增）；`skills/decision-log/SKILL.md`（61 行）无 `读者：`/`读完要能：`/「不是质量门」；`docs/adr/` 现最高号 0034，0035–0037 空
  - **关联**：FR-QUAL-007、AC-003
- **PFACT-009**：`W-06` 的落点是 `make-decision:23/:34/:38`，其中只有 `:34`／`:38` 是英文整句，`:23` 是「句首英文短语 + 中文」；三者都没有被材料给出逐字目标句
  - **状态**：`verified`
  - **证据或来源**：本任务实读（`c28e2fb1`）：`:34`＝`Every completed research report must explicitly declare \`candidates\`；…`、`:38`＝`The direction advice receives the current convergence_outline questions-only projection (…)`、`:23`＝`**Plan, don't do**：方向地图只澄清路线…`；全行纯英文的扫描 0 命中（严格口径），故「三处整句英文」（`decision-log.md:791`）与 `R5` 对 `:23` 的描述为「句首英文短语 + 中文」
  - **负责人、影响**：P6 实施者读 `R5` 原件取其给的方向（中文化），并据此写目标句；影响 FR-QUAL-009
  - **关联**：FR-QUAL-009、AC-006、OPEN-03
- **PFACT-010**：M3c 的「F3 三处行内复原」在 HEAD 上是**替换**而不是补缺
  - **状态**：`unknown`
  - **证据或来源**：实读 `skills/grill-with-docs/GLOSSARY-FORMAT.md:13`（`{A one or two sentence description of the term}`）与 `:43`（`One or two sentences max`），与材料要「恢复」的目标串不同；逐字目标串在 `F3` 原件
  - **负责人、影响**：P5 实施者读 `F3` 原件取逐字目标句；影响 FR-QUAL-008
  - **关联**：FR-QUAL-008、AC-003、OPEN-04
- **PFACT-011**：`catalog.yaml` 的登记漂移数量与材料所记不一致，且材料未给逐条目标文本
  - **状态**：`verified`
  - **证据或来源**：本任务实读（`c28e2fb1`）：① `used_by_stages` 与真实 `workflows/*/skill-deps.yaml` 比对，P5 的 `--census` 实算漂移 **18 条**（39 条 current 登记；仓库级另一口径给出 32 条），`run-checks` 的 `check-skill-consistency` 打印 16 行（它跳过 2 条双方都为空集的条目）——材料记「12 条」不可复现；② `build-spec` 在 `used_by_stages` **0 处**、在 `owner_stage` **0 处**；13 处落在 `legacy_registration_history` 段内（`:91,:169,:197,:209,:220,:256,:327,:350,:361,:384,:516,:525,:534`，P3 删除该段后随之消失），其余 14 处是 `local_changes`／`purpose`／`capability_decisions` 里的历史说明，材料记「8 条 `used_by_stages` 残留」字段名与条数均不符；③ 本机绝对路径只有 2 处，都在 `catalog.yaml:29`、`:75`，`skills/reuse-registry.md` **0 处**；④ 材料给的 `move-map.json:3501`／`:3785` 不是节名登记，而是 `named_data_readers` 的文件路径数组；`OCR 能力与回退` 在 `catalog.yaml` 与 `move-map.json` 中 0 命中
  - **负责人、影响**：P5 先产普查清单再落地（`decision-log.md:800` 的「build-plan 先产普查清单」）；影响 FR-QUAL-008
  - **关联**：FR-QUAL-008、AC-003
- **PFACT-014**：`AGENTS.md:25`／`:26` 与 `docs/standard-workflow.md:15` 的现行逐字
  - **状态**：`verified`
  - **证据或来源**：本任务实读（`c28e2fb1`）：`:25`＝「只跑受影响针对性测试；禁止全量回归：禁止无范围地跑全量 `vitest`、`npm test` 或 `test:safe`。」；`:26`＝「例外只有用户或 CI 守卫明确要求；例外命令必须在执行证据中写清原因和范围。」；`docs/standard-workflow.md:15` 含要删的 12 字「与当前计划明确的最终检查」，且 `grep -rn 最终检查` 只命中该行
  - **关联**：FR-QUAL-010、AC-003
- **PFACT-015**：改宪配套的落点现状
  - **状态**：`verified`
  - **证据或来源**：本任务实读（`c28e2fb1`）：`CONSTITUTION.md:3 Version: 1.9.2`；`constitution-checklist.md` 30 行，`回退`／`fallback`／`OCR`／`architect`／`执行者` **全 0 命中** ⇒ 逐条对照记录与版本号是本次新增内容；`GLOSSARY.md:93` 引用 `workflows/build-code/SKILL.md#L42-L54` 与 `workflows/verify-code/SKILL.md#L44` 两个行号锚，P1 改这两个文件的节题头后必须重新校准（`decision-log.md:531`）
  - **关联**：FR-QUAL-004、AC-003
- **PFACT-016**：6 条坏引用的目标路径实测
  - **状态**：`verified`
  - **证据或来源**：本任务实读（`c28e2fb1`）：坏引用①的 8 处登记（`:191`／`:751`／`:765`／`:236`／`:845`／`:410`／`:1120`／`:1419`）逐条 `test -e` **exit 1** 且都带 `status: retired`；②`skills/wh-review/scripts/review-materials.mjs:38` 的 `skills/spec-tasks/` 不存在；③`tests/acceptance/card-03-current.mjs:22-23` 的 `RETIRED_TEMPLATES` 被 `:469` 用作负向断言（材料误报）；④`skills/spec-plan/SKILL.md:67` 的 `skills/spec-tasks/templates/index-template.md` 不存在；⑤⑥`skills/reuse-registry.md:42/43/44` 指向三个已删技能目录
  - **关联**：FR-QUAL-011、AC-003、AC-004
- **PFACT-017**：独立审查那一次的真实产出与三条失败路线的原始证据
  - **状态**：`verified`
  - **证据或来源**：本任务实跑与实读（`c28e2fb1`）：合并原件 `quality/reviews/2026-10-10-005-build-plan-document.json`（`status=available`／`outcome=partial`／5 条路线派发、2 成 3 败、7 条 findings）；`2026-10-10-002-…-provider-1.output` 是 `kimi/coding` 的原始输出＝**118 字节散文 + 一个合法 findings JSON（10 条）**同一行粘连；broker 运行目录里 `pi/v4flash` 的 stdout 为 **91,659 行／4.4 MB、去重后仅 29 种行**（`pi.progress` 事件不带载荷），`antigravity/opus` 的 stdout 含 `Individual quota reached… Resets in 4h10m10s`
  - **关联**：FR-QUAL-014、FR-QUAL-015、AC-007
- **PFACT-018**：`OPEN-05` 那条断链的实读
  - **状态**：`verified`
  - **证据或来源**：本任务实读（`c28e2fb1`）：`workflows/verify-code/design-alignment.mjs:4` 从 `runtime/stage/stage-content-contracts.mjs` 导入 `buildConsumerCensus`，而该文件**不导出**这个符号 ⇒ 动态 import 该模块直接失败（`does not provide an export named 'buildConsumerCensus'`）；`alignUiDesignEvidence` 全仓**只有定义、零调用者**；引用面还有 `tests/verify-code-design-alignment.test.mjs` 与 `docs/architecture/move-map.json` 的 4 处登记
  - **关联**：FR-QUAL-016、AC-008
- **PFACT-013**：`tools/cli/check-decision-log-chain.mjs` 与现行 decision-log 形状不匹配
  - **状态**：`verified`
  - **证据或来源**：本任务实读（`c28e2fb1`）：`:15 const CHAIN_FIELDS = ["module", "requirement_ids", "derived_from", "artifacts"];`、`:16 const DECISION_ID = /^D-\d+$/;`、`:42 const match = /^#{3,4}\s+(D-\d+)\b[^\n]*$/.exec(line);`；live `decision-log.md` 里 `^#{3,4} D-\d+` **0** 处、`^#{3,4} ADR-\d+` **11** 处；`run-checks` 实测输出 `no decision entries were recognized`
  - **关联**：FR-QUAL-008、AC-003
- **PFACT-012**：`docs/research/**`、`specs/archive/**`、`docs/archive/**` 是只读历史件
  - **状态**：`not_applicable`
  - **证据或来源**：宪法与 `AGENTS.md` 的治理边界；本任务不改写历史
  - **关联**：FR-QUAL-012、AC-004

## 5. 功能需求

本节回答：产品必须具备哪些独立行为与失败边界。

### 审查轴统一与改宪配套（QUAL-AXIS）

把「OCR 不可用就换执行者」这一概念从治理文本、技能正文、接线与 runtime 中连根删除；冻结测试按 test change request 改而不删，保留其真实覆盖面。

- **FR-QUAL-001**：治理文本与技能正文统一为「OCR 不可用如实记 `unavailable`/`unknown`，**不换执行者**；`architect-code-review` 是同源补充轴、独立执行、与 OCR 可用性无关」。必须覆盖 6 处治理文本（`CONSTITUTION.md`、`AGENTS.md`、`README.md`、`GLOSSARY.md`、`docs/standard-workflow.md`、`constitution-checklist.md`）、技能正文（`skills/wh-review/SKILL.md` 与 `contracts/verify-code.md`、`skills/architect-code-review/SKILL.md`、`skills/simplicity-guard/SKILL.md`、`skills/workflowhub-host-protocol/SKILL.md`、`skills/mini-task/SKILL.md`）与两个 workflow 的 `## OCR 能力与回退` 节；保留项（如 `docs/adr/*` 历史 rollback 语义、「回退默认值」、「不得静默回退」）按同形词排除，不得连带改
  - **范围边界**：包括文本统一与触发条件改写；不新增审查轴、不新增长驻行、不收窄公共 schema
  - **依据**：`ADR-007`、`U-003` 第 2 条、`U-005`、`F1 §4`、`PFACT-006`
  - **场景**：SCN-003
  - **验收**：AC-003、AC-005c
- **FR-QUAL-002**：runtime 与接线删除换执行者路径：`tools/cli/stage-runtime.mjs` 删 fallback 闭包与 `executor:"wh-review"`（改后如实返回 `unavailable`）；`runtime/review/ocr-delegation-adapter.mjs:291` 措辞改为「no substituted executor was used」；`workflows/verify-code/skill-deps.yaml:18` 的 architect 条目改为按同源补充轴触发；`workflows/{build-code,verify-code}/steps.json` 删回退句；当前 OCR013 minor 的两 YAML `wh-review-provider.required_when` 仅校准为已有 `document_review` 标签，保持其余 capability 元数据/路由不变；冻结 contract test `:15` 与现 P1 oracle `:497` T002 TARGET／`:550-562` T003 GUARD 只校准同一具名 metadata 的预期/解释/诊断，保精确断言及其它全部保护；由独立 TCR087原件承接提案074，不新增字段或机制
  - **范围边界**：删前先确认 `nativePacketFallback` 是否被同源补充轴复用；只改既有判定面，不新增字段
  - **依据**：`ADR-007`、`U-005` 第 4 项、`OI-013`、`PFACT-004`
  - **场景**：SCN-003
  - **验收**：AC-003
- **FR-QUAL-003**：冻结测试**改而不删**：`tests/contract/code-review-ocr-fallback.test.mjs`（文件名去掉 `-fallback`，not_installed 用例改为断言 `unavailable`/`unknown` 且**无** `fallback` 字段，installed-failure 用例保留）、`tests/contract/verify-architect-acceptance.test.mjs`（删 `fallbackSourceStatus`／`expectFallbackSource`／`wiringCommentSource`／`architectSource` 与相应的 `it`，保留同源补充轴覆盖）、`tests/contract/ocr-ac006-011-experiments.test.mjs:88-91`、`tests/review/card09-targeted-dispatch.test.mjs:183-196`、`skills/wh-review/scripts/__tests__/simple-contracts.test.mjs:437-505`、`tests/contract/ocr-delegation-adapter.test.mjs:992`；并产出「引用 `stage-runtime.mjs` 的受影响测试清单」（`PFACT-005`）后复跑
  - **范围边界**：测试改动走仓库既有的 test change request 流程并保留旧断言与失败原件；不改 `post-build-plan-missing-index.test.mjs` 的 build-plan 断言
  - **依据**：`OI-022`、`F1 §4-18`、`AUD-MOD MB-02`、`PFACT-005`
  - **场景**：SCN-003
  - **验收**：AC-003
- **FR-QUAL-004**：改宪配套三件：`constitution-checklist.md` 逐条对照记录、`CONSTITUTION.md` 版本 `1.9.2 → 1.9.3`、关联决定与领域 ADR `docs/adr/0035-*.md`
  - **范围边界**：改宪本身已由 `U-005` 授权；本 FR 只落配套记录，不扩大改宪范围
  - **依据**：`U-005`、`U-020` 第 2 项、`high_risk_fact`（`decision-log.md:940`）、`PFACT-015`
  - **场景**：SCN-004
  - **验收**：AC-003、AC-004

### 写集校验对齐真实材料（QUAL-VALIDATOR）

- **FR-QUAL-005**：`runtime/stage/stage-content-contracts.mjs` 增加治理文件白名单（+3 行）与「独占，或两 Phase 已按 `Dependency` 串行」（+9 行）两条判定；`tests/contract/post-build-plan-missing-index.test.mjs` 补两条契约测试（+8 行），包含**非串行同改仍报错**的反向用例；并把该决定落 `docs/adr/0036-*.md`
  - **范围边界**：只改既有的独占判定与既有测试面；去掉 `AGENTS.md:25` 可选枚举的加法；不新增字段或校验器
  - **依据**：`ADR-008`、`F4 §2`、`AUD-MOD MC-04`、`PFACT-003`
  - **场景**：SCN-002
  - **验收**：AC-003

### 纯删与模板重设计（QUAL-DELETE、QUAL-DECISIONLOG）

- **FR-QUAL-006**：只删真 no-op 与真重复：① 4 份逐字重复复盘段收敛为一处，owner = `skills/stage-reflection/SKILL.md`，其余 4 处留**带触发分支的条件指针**（`build-code:82` 是 570 B 变体，按其自身事实处理，不并入同 sha 集合）；② 131 B 同 sha 句全仓收敛为一处（删前先核 `catalog.yaml` 覆盖度，未覆盖时把保留的那 1 份放回原处）；③ 删 `skills/catalog.yaml` 的 `legacy_registration_history` 44 条。`skills/spec-plan/templates/phase-template.md` 整体不动、`:228` 逐字保留，`git diff` 必须为空
  - **范围边界**：只删；已按 `U-009`／`U-020` 推翻的删除（11 条 `完成判据：`、fog 五段、13 项验收小节、`spec-analyze` 六类披露、四分支归口）**不得回退删除**
  - **依据**：`ADR-005`（经 `U-007`／`U-009`／`U-020` 三次修订）、`PFACT-002`、`PFACT-007`、用户 `V-007`
  - **场景**：SCN-001、SCN-004
  - **验收**：AC-005a、AC-005b、AC-005c
- **FR-QUAL-007**：decision-log 模板按下游消费重设计：`## 大纲地图` 保留并逐行对应正文顶层节；新增 `## 退役登记`（五列：日期｜哪张｜为什么退役｜谁决定｜原来的需求编号，无退役对象写「本任务无退役对象」）；`## 需求变更记录` 改一行一条索引；12 项过程内容**一次外置**到任务库 `quality/evidence/decision-log-refs/` 下的同名节文件；`## 外置事实索引` 加「基准目录＝绝对路径」必填行；`## 验收面` 加覆盖矩阵。`skills/decision-log/SKILL.md` 为唯一写主（补骨架与「这是写作指引，不是质量门」，改 `:19`／`:22`／`:32`／`:58`，修 `:32`／`:34`／`:40` 的悬空引用）；ADR-023 归档为 `docs/adr/0037-adopt-cross-language-writing-rules.md`（避开已占用的 `0023`）；真实入口 `workflows/make-decision/SKILL.md` 方法第 1 步的旧 U 块句由 P3/T008 同行改为发生需求变更并写该节时读取 decision-log 唯一 owner 的条件指针，承接 P4 后的 U 索引形状，保留该行其它句与净行 0
  - **范围边界**：外置件落在任务库、下游 cwd 强制是认证 worktree，因此**只能靠绝对路径**取用；不改 `workflows/make-decision/SKILL.md` 的方向 Talk／grill 本体
  - **依据**：`D1`、`D2`、`U-014`–`U-017`、`ADR-005`、`ADR-006`、`PFACT-008`
  - **场景**：SCN-001
  - **验收**：AC-003、AC-005c

### 矛盾修正与步骤判据（QUAL-CONTRADICTION、QUAL-STEPS）

- **FR-QUAL-008**：九类矛盾与登记修正：`workflows/build-plan/SKILL.md:20` 改正面句；`F3` 的三处行内复原逐条落地（`skills/plan-eng-review/SKILL.md:43`、`skills/grill-with-docs/GLOSSARY-FORMAT.md:43` 与 `:13`、`skills/spec-specify/SKILL.md:135`）；键名/字段一致（`grill-with-docs:73`／`:85` 的 `changed|no-change`、`mini-task:17` 与 runner 路由、`isolated-browser-qa:227` 的 `failure_reason`）；`skills/spec-analyze/SKILL.md` 六类披露**保留**并补落点；`skills/catalog.yaml` 与两份 `reuse-registry` 的漂移、8 条 `build-spec` 残留、2 处本机绝对路径；`Z1` 撤下四项（`O-03`／`O-04`／`O-07`／`O-08`）＋`O-09` 改 `tools/cli/check-decision-log-chain.mjs` 认现行 `ADR-NNN`+5 字段；`skills/spec-specify` 的 `description` 补 WR001 分支；`skills/review/SKILL.md` 的宿主指令段不泄进 provider packet；`S-13`／`S-15`／`W-08`／`W-09`／`W-10`
  - **范围边界**：**6 条坏引用的写主划分如下**——①`skills/catalog.yaml`、④`skills/spec-plan/SKILL.md:67`、⑤⑥`skills/reuse-registry.md` 的**写入由 P5 承接**（`U-007` 要求 `reuse-registry` 的 stale 行「按现状改写」而非删整份），P8 只做逐条 0 命中核对与处置登记，不重复持笔；②`skills/wh-review/scripts/review-materials.mjs:38`、③`tests/acceptance/card-03-current.mjs:23` 由 P8 落地。`catalog.yaml` 的 44 条删除归 P3；漂移/残留条目必须**先产普查清单**再落地，不得照抄「12 条」或「8 条」
  - **依据**：`F3`、`W1 D3/D4`、`Z1`、`R5 W-01`–`W-10`、`R6 S-02`–`S-18`、`U-014`、`U-018` 第 2 项、`PFACT-010`、`PFACT-011`、`PFACT-013`
  - **场景**：SCN-002
  - **验收**：AC-003、AC-005c
- **FR-QUAL-009**：5 个 workflow 的 `SKILL.md` 共 **17 处行内改写**（`X1 §4` 5 处 ＋ `Y1 §4` 11 处，含 `build-code:15/:17`）＋并入 `W-06`；第 10 步判据改穷尽式且输入定为「全文＋原件全部编号」；`workflows/make-decision/steps.json` step 14 补术语核对一句（**非门**）。每个文件 `git diff --numstat` 的 add 必须等于 del（**净行 0**）
  - **范围边界**：只改方法文本与其措辞锁测试；**不新增 stage／gate／字段／文件／机制**；`make-decision:23/:34/:38` 的 W-06 落点先按 `R5` 原件核实（`PFACT-009`），核不到就如实记 `unknown` 并不改。「17 处」的构成按 `decision-log.md:726` 的算法读作「`X1 §4` 的 5 项 ＋ `Y1 §4` 的 11 项 ＋ `W-06` 并入的 1 项」，其中「处」＝**改写单元**（有的单元跨多个物理行，如 `Y1 §4-3` 含 4 个文件、`Y1 §4-7` 含 2 行、`Y1 §4-9` 含 4 处）；第 10 步判据改动与 `steps.json` step 14 是同一写集行内**另列**的项，不计入 17。P6 卡片必须逐项列出自己的改写单元清单与计数，并写明与 `ADR-011` 逐 workflow 计数（5＋2＋4＋3＋2＝16）之间的差异口径
  - **依据**：`ADR-011`、`R-017`、`U-013`、`U-019`、`X1 §4`、`Y1 §4`、`PFACT-009`
  - **场景**：SCN-001
  - **验收**：AC-006、AC-003

### 执行纪律与沉积清理（QUAL-REGRESSION、QUAL-SEDIMENT）

- **FR-QUAL-010**：删 `docs/standard-workflow.md:15` 的「与当前计划明确的最终检查」12 字，使文档口径与硬规则一致；`AGENTS.md:25`／`:26` 保持原样（不改成别的写法、不加可选枚举）
  - **范围边界**：只删这一处宽口径；不新增例外枚举
  - **依据**：`ADR-010`、`F5 §5`、`AUD-MOD MC-02`、`U-018` 第 3 项、`PFACT-014`
  - **场景**：SCN-004
  - **验收**：AC-003
- **FR-QUAL-011**：`workflows/*/steps.json`（5 份）**只做 JSON 纯空白重缩进**，`completion_evidence` 内容一字不删（`OI-024`：宿主是否消费未证，缺消费者证明）；6 条坏引用逐条具名处置（`skills/catalog.yaml`、`skills/wh-review/scripts/review-materials.mjs:38`、`tests/acceptance/card-03-current.mjs:23`、`skills/spec-plan/SKILL.md:67`、`skills/reuse-registry.md` ⑤⑥）；空白归一后 `git diff -w` 为空且 `run-checks` exit 0
  - **实读修正（写进 P8 卡片）**：5 份 `steps.json` 在 HEAD 与审计基线上**都已是 2 空格规范序列化**，可归一字节为 **0** ⇒ M8/T022 是**守恒任务**，它的 TARGET 是「上游定稿预条件」（P1 删掉的两处回退句 + P6 补的 step 14 术语句）＋ canonical 序列化，「内容一字不删」由 GUARD 承担；材料 `F2:15` 的 5580 B／965 B 作为不可复现登记
  - **范围边界**：`workflows/*/steps.json` 的内容变更（P1／P6）必须先于空白归一（P8）；`skills/spec-plan/SKILL.md:67`、`skills/reuse-registry.md`、`skills/catalog.yaml` 三处坏引用的**写入由 P5（M3c）承接**，P8 只做 0 命中核对与处置登记；坏引用③（`tests/acceptance/card-03-current.mjs:23`）已实读裁定为**故意的退役清单**（`:469` 用作负向断言），属材料误报，**不改字节**（`OPEN-08`）；坏引用①的 8 处具名登记都带 `status: retired`，**保留原值不改 `path`**（改写会与 `check-skill-consistency` 的 `path === skills/<name>/SKILL.md` 一致性冲突，且 `U-007` 只授权删 44 条）
  - **依据**：`Z1`、`AUD-MOD MC-03`、`U-020` 第 3 项、`R6` 坏引用①–⑥、`PFACT-016`
  - **场景**：SCN-004
  - **验收**：AC-003、AC-004

### 交付可核查（QUAL-DELIVERY）

- **FR-QUAL-012**：交付事实可独立核查：每条改动绑定它针对的发现编号并提供 before/after 文本对照；写集表里每个文件全任务只有一个写主（跨 Phase 重复仅限**已声明串行**的 Phase 对）；「未落项与处置」里记为「不处理」的项逐条写明理由，不重新纳入
  - **范围边界**：交付动作（commit/push/merge）只在真实发生时按授权来源核对分支与 HEAD；本阶段不做 Git 动作
  - **依据**：`ADR-004`、`AC-003`、`decision-log.md` 的「未落项与处置」、`PFACT-005`、`PFACT-012`
  - **场景**：SCN-004
  - **验收**：AC-003、AC-004
- **FR-QUAL-013**：逐 AC 事实汇总与如实披露：审计口径落在 `R5`（16 个改动文件）与 `R6`（36 项技能 + `S-01`–`S-18`）的既有结论上，不另做逐文件复述；每条发现至少一条事实证据（diff 行号或会话事件索引）；汇总里**不出现「已修好」结论**，`incomplete`／`unavailable` 保持可见；字节只作 `AC-005a` 的事实
  - **范围边界**：本次不做验收判断；`AC-006` 由用户在新任务上实跑读回，缺失保持 `unavailable`。P9采用125选择A与独立129的条件：原builder T024固定 `appendRecord(T + '/quality/evidence/execution-memo', 'p9-current-facts', 'md', bytes)` 只产一份ordinary不可变聚合报告，卡只留实际返回ref、不双写当前状态；生成前不填假path，生成后材料owner补唯一actual指针/header/index，最终formal review前完成。P9 builder在W不写生产/材料，实际scope仅外置oracle与T024返回的唯一普通报告 `quality/evidence/execution-memo/2026-10-10-141-p9-current-facts.md`（发布后immutable只读；当前事实仅从该原件读取）；旧009/index只读，不授整目录。
  - **依据**：`R-010`、`U-001`、`U-011` 第 2 项、隐藏前提 B（`decision-log.md:494`）、`AC-001`、`AC-002`、`PFACT-001`、`PFACT-012`
  - **场景**：SCN-004
  - **验收**：AC-001、AC-002、AC-004、AC-005a

### 审查管道修复（QUAL-REVIEW-PIPELINE，用户授权）

- **FR-QUAL-014**：让独立审查的**可用来源不再被静默丢掉**，且「活着在流」不被误判成「停滞」：
  - ① 结果解析：在既有「整份 JSON／JSONL 行／唯一围栏 JSON」之外，接受**唯一嵌入的裸 JSON 对象**——必须只有一个候选且通过同一套 findings 校验；出现多个候选、校验失败、或只有散文，都仍判 `invalid`。提取本身记为事实，不得改写为通过。
  - ② 进度核算：区分 `liveness`（收到帧）与 `progress`（有语义进展）。支持域中 `streamLiveness:true` 必须有 callable effective probe：`typeof (probeSession ?? plan.probeSession) === "function"`；任意 `streamLiveness:true + streamProgress:true`，以及无 callable effective probe 且 `streamProgress:false`，均为 unsupported input，必须在 spawn 前同步抛出 `TypeError` 且不得调用 `beforeSpawn`。普通 `streamLiveness:false` 的 no-probe 行为保持不变，包括 no-probe + `streamProgress:true` 的既有五 health interval 静默停止。对支持域，重复的无载荷心跳只刷 liveness、不再被当作「新进展」；适配器已能提供的会话推进信号（如 pi 的 session leaf 前移）参与判定。每个 `observation.liveness === true` 帧（纯 liveness、首个/重复 progress、terminal-bearing）使 process-owned `livenessGeneration` 单调递增；不得调用 protected `healthRunner.noteProgress`，不得合成 cursor/session，不引入总 wall-clock timeout、schema、status、ledger 或 provider state。health probe 以当前 generation 与上一 health tick/上一 probe 结束 generation 比较：首 tick baseline 为 `0`，完成当前结果分类/投影后再更新 baseline；只有 generation advanced 的非 terminal `busy` 才仅为 health diagnostics 投影为 `progressing`，保留原 cursor/session/error/evidence；停帧回到原始 `busy`，沿既有五 interval 静默路径停止；probe 间 heartbeat 与下一 tick 前到达的帧同样计入。verified non-terminal cursor/session 前移才重置 12-interval semantic window；valid `completed` 仅在尚无 `terminalClaim`/`PROCESS_STALLED` claim 时 authoritative 并保留 raw/session/cursor/`health_harvested`，已 stalled 不可复活；old-round 由 adapter baseline/`validateCompleted` 判定，不能由 generation 猜测。只有心跳、长期无语义进展时**有界**停下，真正静默仍必须停下。
  - ③ 失败回读义务：对 `OUTPUT_INVALID` 且有原始输出的失败来源，操作者必须**只读回读一次**并记录「原始件里是否存在唯一可解析的 findings JSON」；允许据此救回发现，**禁止**把失败改写成通过或空 findings。
  - **范围边界**：不改 findings schema、不加必填字段、不新增状态文件或常驻账本；不改「总耗时永不是上限」的既有取舍；不实现 `OPEN-13` 的分片审查（C 只登记职责、consumer、owner、测试与删除条件）。
  - **依据**：`PFACT-017`、`OPEN-13`、用户 2026-10-10 授权
  - **场景**：SCN-005
  - **验收**：AC-007
- **FR-QUAL-015**：审查派发卫生（只改方法文本与操作口径，不改代码）：派发前用**已有的** broker 探针筛掉确定性不可用的路线；在满足「至少一条异源建议」的前提下把路线数收到 3 条；账号配额窗口内不使用对应的 provider，大包全文审查不使用会打转的路线；本条不引入新的编译器、队列或重试状态。
  - **范围边界**：不新增公共命令、不新增调度状态；探针只读、失败照实记录。
  - **依据**：`PFACT-017`、`OPEN-13` B 层、用户 2026-10-10 授权
  - **场景**：SCN-005
  - **验收**：AC-007
- **FR-QUAL-016**：`workflows/verify-code/design-alignment.mjs:4` 的断链按**最小改法**处理：删除死链路（其导入的导出不存在、模块导入即失败、导出函数全仓零调用者），并同步 `docs/architecture/move-map.json` 的登记；`tests/verify-code-design-alignment.test.mjs` 要么随死链路一并清理、要么改为断言「该模块不再存在且无悬空引用」，二者择一并在卡片写明选择理由。
  - **范围边界**：不改 `runtime/stage/stage-content-contracts.mjs` 的导出面（那是另一件事的写集）；不新增替代实现；不重写 `verify-code` 的其它行为。P11/T029 最小例外仅 `skills/frontend-component-quality/SKILL.md:9` 的既有消费要求一句，保真实盘点义务、consumer-census.v1 原字段/格式及缺真实盘点的 unknown/unavailable，不新增 scanner/provider；来源为正式039与独立116，原件保留。
  - **依据**：`PFACT-018`、`OPEN-05`、用户 2026-10-10 授权
  - **场景**：SCN-005
  - **验收**：AC-008

> 新需求使用 `FR-QUAL-NNN`。每条 FR 至少连接一个 PFACT、一个 SCN 和一个 AC。

## 6. 模块划分

本节回答：哪些产品职责可独立交付与验收。

> 只写产品职责，不写实现类名。十个模块与一个交付自检模块，各自对应一个 Phase。

- **M3a 审查轴统一与改宪配套**（P1）：负责把「换执行者」概念从治理文本、技能正文、接线与 runtime 删除，并留下改宪对照记录
  - **对外提供**：统一的审查轴表述、可执行的冻结测试、`docs/adr/0035`
  - **依赖谁**：无上游 Phase
  - **测试边界**：OCR 不可用分支的对照用例（`unavailable`／无 `fallback` 字段）与 installed 路径回归各有具名断言
- **M4 写集校验**（P2）：负责让校验器区分治理文件与实现文件、并按真实串行放行共享写集
  - **对外提供**：`validatePostPhaseContract` 的新判定与两条契约测试
  - **依赖谁**：无
  - **测试边界**：治理文件共享与串行共享各一条正例，非串行同改一条反例
- **M1 纯删**（P3）：负责真 no-op 与真重复的收敛
  - **对外提供**：4 份复盘段与同 sha 句各一处 + 条件指针；`catalog.yaml` 少 44 条
  - **依赖谁**：无
  - **测试边界**：`phase-template.md` 的 `git diff` 为空（零改动正例）
- **M3b decision-log 重设计**（P4）：负责模板与方法文件的落点一致
  - **对外提供**：模板新节序与新字段、外置指针写法、`docs/adr/0037`
  - **依赖谁**：无
  - **测试边界**：模板节序与下游引用可解析
- **M3c 矛盾与登记修正**（P5）：负责九类互相打架的说法与漂移登记
  - **对外提供**：新串唯一、坏引用（除归 M8 的 6 条外）0 命中、校验器认现行 ADR 形状
  - **依赖谁**：P3（`catalog.yaml` 先删 44 条）、P1（治理文本先统一）
  - **测试边界**：`check-decision-log-chain.mjs` 对新旧形状各一条用例
- **M7 步骤判据**（P6）：负责把「方法写了而执行者不照做」的一类缺陷按判据修掉
  - **对外提供**：5 个 workflow 的 17 处改后判据（净行 0）
  - **依赖谁**：P3（`SKILL.md` 先删重复段）、P5（`build-plan/SKILL.md:20` 先改）
  - **测试边界**：净行 0（`git diff --numstat` add == del）与两个措辞锁测试同批改
- **M6 回归口径**（P7）：负责把全量回归的例外收回
  - **对外提供**：两处口径一致的方法文本
  - **依赖谁**：P1（`docs/standard-workflow.md` 先统一）
  - **测试边界**：`AGENTS.md:26` 逐字保留（读回断言）
- **M8 无落点义务与死沉积**（P8）：负责 `steps.json` 空白归一与坏引用处置
  - **对外提供**：内容逐字未变的 JSON、6 条坏引用的处置结论
  - **依赖谁**：P1、P6（`steps.json` 内容先改完）
  - **测试边界**：`git diff -w` 为空（正例）＋ `run-checks` exit 0
- **M9 审查管道修复**（P10，用户授权）：负责让独立审查的可用来源不再被静默丢掉、活流不被误判停滞，并把失败回读与派发卫生成文
  - **对外提供**：解析器的「唯一嵌入裸 JSON」一路（含四种输入的对照）、区分 liveness/progress 的进度核算、失败回读义务句、派发前探针与路线收窄口径
  - **依赖谁**：P1（`skills/wh-review/SKILL.md` 的唯一写主先落定）
  - **测试边界**：四种解析输入的对照 + 心跳重复不误停/真静默必停两条对照 + 既有三路解析回归
- **M10 `verify-code` 死链路清理**（P11，用户授权）：负责 `OPEN-05` 的断链按最小改法处置
  - **对外提供**：导入期不再失败的 `verify-code` 目录面、无悬空引用的仓库面、同步后的 `move-map.json` 登记
  - **依赖谁**：P5（`move-map.json` 共享写集，需串行）
  - **测试边界**：模块可导入或已删除 + 悬空引用 `grep` 计数 0 + `run-checks` exit 0
- **交付与自检**（P9）：负责逐 AC 事实汇总、字节对照与如实披露
  - **对外提供**：一份可复核的事实汇总（非验收结论）
  - **依赖谁**：P1–P8、P10、P11 全部
  - **测试边界**：逐 AC 行数与 AC 条数相等；无「已修好」字样；`AC-006` 记 `unavailable`

## 7. 关键实体

本节回答：哪些字段、约束和关系改变用户行为。

> 本节只写影响行为的字段与关系。

- **Phase 契约头**：
  - **定义**：`phases/P<n>.md` 文件级字段，runtime 逐字读取
  - **字段和约束**：`Global spec` 必须出现 `spec.md`；`Write set` 是精确文件路径（不得目录或 glob）；`Dependency` 只能引用更早的 Phase 或 `none`；`Consumer` 与索引逐字一致；`gate_cmd` 是一条可直接执行的命令；`oracle` 以 `ORACLE-` 开头；`evidence_path` 是相对任务根的路径；`STOP` 与 `Done` 必须与 L1 同名小节写同一件事
  - **关系**：一个 Phase 一行索引；索引不承载 L0/L1/L2、命令、oracle、证据路径或执行状态
- **`steps.json`**：
  - **定义**：`workflows/*/steps.json` 的步骤清单，顶层 `schema_version`／`stage_slug`／`steps`，step 级 `step_id`／`step_slug`／`observable_result`／`completion_evidence`
  - **字段和约束**：P8 只改空白，不改任何字段值；`observable_result` 仍是非空字符串（`runtime/task/portable-workflow-run.mjs:33` 的唯一校验）
  - **关系**：内容变更（P1／P6）必须发生在空白归一（P8）之前，同一文件不得两模块各写一遍
- **写集（write set）**：
  - **定义**：某 Phase 允许改动的精确路径集合，来自该 Phase 契约头
  - **字段和约束**：全任务每个路径在**同一时刻**只有一个持有者；跨 Phase 重复必须在索引与卡片的 `Dependency` 上写成真实串行；治理文件共享与串行共享由 P2 的校验器放行，非串行同改仍报错
  - **关系**：P9 的汇总以索引的实际写集为分母

## 8. 数据和生命周期

本节回答：数据如何产生、更新、迟到、保留与清理。

- **数据粒度**：每个 Phase 一份契约头与若干 Task 卡；每个 Task 一份 oracle 判定
- **数据时效**：oracle 在 HEAD 上实跑取 RED；实施后同一条命令取 GREEN；RED/GREEN 原件各留一份
- **缺失或迟到**：外部原件（`AUD-COV`／`AUD-MOD`）未存盘的事实如实登记为缺口，不由本任务补造
- **预览与正式**：本阶段只产出材料与 RED 证据，不产出 GREEN 与验收结论
- **当前与历史**：`specs/archive/**`、`docs/archive/**`、`docs/research/**` 只读保留，不改写历史字节
- **归属与清理**：审计与实施证据归任务库根 `quality/tests/`（每类事实一份原件，不复制镜像、不做目录快照）

## 9. 兼容性预留

本节回答：既有消费者如何保持，扩展承诺止于哪里。

- **既有消费方**：`tools/cli/stage-runtime.mjs:553` 的 `phaseReviewSourceProjection` 只读 `parsed.facts.phase_rows`（不判 `ok`），因此 P2 放宽 `ok` 语义不改它的行为；`runtime/task/portable-workflow-run.mjs:33` 只校验 `observable_result` 非空；`skills/wh-review/scripts/review-materials.mjs` 与 `runtime/distribution/skill-bundle-release.mjs:18` 按 JSON 读 `steps.json`
- **命名预留**：本次不新增公共导出；`runtime/review/schemas/result.schema.json` 的 `executor` 枚举与 `fallback` 定义**本次不收窄**（收窄属公共契约变更，无本次决定，见 `OPEN-01`）
- **容器预留**：N/A — 不新增持久化容器
- **状态预留**：保持 `validatePostPhaseContract` 的返回形状（`{ ok, errors, facts }`）；只改 `errors` 的产生条件
- **扩展边界**：本期只改既有判定面与既有路径；不承诺新增校验器、指标或审查焦点

## 10. 明确不做与默认必须成立

### 明确不做

本节回答：什么本次不选，来源与理由是什么。

> 这是唯一权威非目标列表；上游批准的 out-of-scope 逐条继承。

- 不整体回滚到现代化前再择优吸收（用户 `V-003`；无法归因且会丢有效部分）。
- 不覆加一层「产物形状与长度上限」（用户 `V-003`；新旧规则打架）。
- 不找回 `skills/debate` 整机制，也不把它的「≤200 字」通用化（`F3` + `OI-011`）。
- 不新增 stage／gate／字段／文件类型／新机制，不新增「最少 Phase 数」校验或数字阈值（`U-003`、`F4`）。
- 不改 `skills/spec-plan/templates/phase-template.md`：`:222-239` 的 13 项验收小节原地保留，`:228` 逐字保留（`U-020` 第 1 项）。本任务的八个模块不改这 13 项。
- 不删 decision-log 模板的 11 条 `完成判据：`、`make-decision` 的 fog 五段、`spec-analyze` 的六类披露、`stage-reflection` 的四分支归口（`U-009` 第 3 项、`U-020` 第 1 项、用户 `V-007`）。
- 不删 `workflows/*/steps.json` 的 `completion_evidence` 内容（`U-020` 第 3 项、`OI-024`）。
- 不删 `skills/catalog.yaml` 的 44 条以外的登记，也不改动 `catalog.yaml` 的 provenance 语义（用户 `V-007` 维持删除 44 条；其余留）。
- 本次不做验收判断、不宣告「已修好」（`R-010`、`U-001`）；不设速度硬指标，不为提速删内容（`R-011`）。
- 不修 P8 的执行侧仪式与协调膨胀（968 `send_message`／179 `wait_agent`／6 次 compaction）——如实登记为已知未覆盖项。
- 不处理「未落项与处置」表中记为「不处理」的项（`R1 #3`、`R1 #11`、`R2 缺口 4/5/6`、`R4-c`、`R4-e`、`X2 §5`、`Z1` 真死清单三项）；重新纳入需要用户决定。

### 默认必须成立

本节回答：哪些产品不变量不用用户重复提出。

- `node tools/cli/run-checks.mjs` 在每次改动的实际执行点上 exit 0（HEAD 基线实测 0）；关联 FR-QUAL-012。
- 只跑受影响针对性测试；禁止无范围全量 `vitest`／`npm test`／`test:safe`，最终检查也仅限用户或 CI 守卫明确授权的范围，计划列出检查本身不产生例外授权（`AGENTS.md:26` 原样保留）；关联 FR-QUAL-010。
- 每类事实只留一份原始件；不复制镜像、不做目录快照、不用 `git archive`（证据硬规则）；关联 FR-QUAL-013。
- 写集里每个路径在当前执行时刻只有一个持有者，跨 Phase 重复必须是真实串行；关联 FR-QUAL-012。

## 验收流程

从场景入口依次定位 FR、`Appendix A` 的 AC、验证方法与可回读证据；本节只描述流程，不复制 AC 的通过或失败判据。本次任务**不做验收判断**：逐 AC 的事实由 P9 汇总，最终效果由用户在 `AC-006` 的实跑中读回。

## 测试标准

每个 Phase 的 `oracle` 只读仓库或按既有夹具调用真实导出，不写工作树；判定器跨 Task 复用一条 `gate_cmd`，用 `--task=TNNN` 选断言集；每条断言标 `[TARGET]`（目标行为，HEAD 上应失败）或 `[GUARD]`（必保事实，HEAD 上应通过）。行为面 Task 的 RED 必须是具名目标断言失败；纯文档 Task 按 `G-2` 用客观结构判定器替代，并如实声明不覆盖运行时行为。精确命令留给各 Phase 契约头。

## 架构边界

区分产品边界与工程边界：产品边界是「执行者在哪个轴、用什么条件做代码审查」「计划允许怎么共享写集」「模板与方法要求什么」；工程边界是 `tools/cli/stage-runtime.mjs` 的审查派发闭包、`runtime/stage/stage-content-contracts.mjs` 的写集判定、以及各方法文件与模板的措辞。全局架构方案在下方「实现设计」维护，各 Phase 只承接自身差异。

## 实现设计（全局权威）

### 代码锚点

- **来源边界**：原始需求与 decision-log 只作来源映射，本文件不创建第二份需求账本。
- **现状与目标差异**：现状存在换执行者路径（`stage-runtime.mjs:1007-1027`）、写集独占硬判定（`stage-content-contracts.mjs:413-417`）、4 份同 sha 复盘段与 44 条 legacy 登记、模板与方法的悬空引用、5 个 workflow 的 17 处判据缺口、`docs/standard-workflow.md:15` 的宽口径、6 条坏引用；目标是各条落到可执行判据。
- **读取顺序**：① `workflows/{build-code,verify-code}/SKILL.md` 的 `## OCR 能力与回退` 节与两个 `skill-deps.yaml`；② `tools/cli/stage-runtime.mjs:393/440-451/573-578/633/1007-1027`；③ `runtime/stage/stage-content-contracts.mjs:361-417/640`；④ `skills/catalog.yaml:82-562` 与 5 份 `workflows/*/SKILL.md`；⑤ `skills/decision-log/{SKILL.md,templates/decision-log-template.md}`；⑥ `skills/plan-eng-review/SKILL.md:43`、`skills/grill-with-docs/GLOSSARY-FORMAT.md:13/43`、`skills/spec-specify/SKILL.md:135`；⑦ `docs/standard-workflow.md:15` 与 `AGENTS.md:25/:26`；⑧ `workflows/*/steps.json`。
- **代码锚点（实读，`c28e2fb1`）**：`tools/cli/stage-runtime.mjs:1015 const fallback={from:"ocr",…}`、`:1026 return {...result,executor:"wh-review",fallback}`、`:393 function projectOcrCodeReviewBundle(built, attachmentRoot, request, source, nativePacketFallback = false)`、`:573 export function prepareTaskBoundBuildCodeReviewBundle(context, request, {` + `:578 nativePacketFallback = false,`；`runtime/stage/stage-content-contracts.mjs:361 export function validatePostPhaseContract({ spec, index, phases } = {})`、`:413-417` 独占判定、`:640 return Object.freeze({ ok: errors.length === 0, … })`；`runtime/review/ocr-delegation-adapter.mjs:291` 的 `"…no legacy review fallback was used"`；`tools/cli/run-checks.mjs:145` 调用 `check-decision-log-chain`（advisory）。
- **运行条件**：Node `v24.14.0`（实跑）；vitest 走 `npx --no-install vitest run <scoped files>`；`run-checks` 走 `node tools/cli/run-checks.mjs`。

### 接口与失败语义

- **选择的架构方案**：复用现有方法与判定面，只做「删／并／改一句话」，确有两处需要「加」的判定（治理文件豁免、串行共享）按 `ADR-008` 限量加入既有校验器并配反向测试。放弃整体回滚与覆盖层：它们无法归因且会把有效规则一起丢掉。
- **模块职责**：治理文本与技能正文消费统一表述 → runtime 消费该表述并如实返回 `unavailable`；校验器消费 Phase 契约头与索引产生 `{ok, errors, facts}`；模板与方法互为落点；五个 workflow 的 `SKILL.md`／`steps.json`／`skill-deps.yaml` 是判据载体。各模块都不裁决质量。
- **接口与数据流**：Phase 契约头 + `spec.md` + 索引 → `validatePostPhaseContract` → `{ok, errors, facts}` → 代码审查组包（`stage-runtime.mjs:553`）；`steps.json` → `portable-workflow-run.mjs:33` 非空校验；OCR 检测结果 → 审查派发闭包 → 审查记录（`executor` 不再出现 `wh-review`）。
- **失败语义**：OCR 不可用（ENOENT／低于 1.12.9）或已装但失败/超时/取消 ⇒ 如实记 `unavailable`/`unknown`、保留原始失败，**不换执行者**；写集非串行同改 ⇒ 保持报错；`steps.json` 解析失败 ⇒ 不落盘、如实报错；外置件取不到 ⇒ 记 `unavailable` 并给绝对路径。
- **新增控制面**：`docs/adr/0035`／`0036`／`0037` 三份决定记录文件（既有 ADR 文件类型）与任务库 `quality/tests/sqr-p*-oracle.mjs` 判定器（既有证据面），**不新增**运行时控制面、字段或校验器。

### 全局文件边界与依赖

- **新增**：`docs/adr/0035-remove-ocr-executor-fallback-and-amend-constitution.md`；`docs/adr/0036-write-set-governance-exemption-and-serialized-sharing.md`；`docs/adr/0037-adopt-cross-language-writing-rules.md`；任务库根 `quality/tests/sqr-p1-oracle.mjs`–`sqr-p11-oracle.mjs`（十一份判定器；p10／p11 属用户授权的追加范围）、`quality/tests/sqr-plan-index.mjs`（索引渲染与计划一致性判定器，持笔者＝build-plan 主会话，P9 只运行）与 `quality/tests/2026-10-10-N-sqr-pN-red.log`（`N` 为一位或多位当日序号）（RED 原件）；`skills/wh-review/scripts/__tests__/review-output-embedded-json.test.mjs`（P10 解析对照单测）；`skills/third-review/test/review-progress-liveness.test.mjs`（P10 进度对照单测）。
- **修改**：`CONSTITUTION.md`；`constitution-checklist.md`；`AGENTS.md`；`README.md`；`GLOSSARY.md`；`docs/standard-workflow.md`；`docs/reuse-registry.md`；`docs/architecture/move-map.json`；`tools/cli/stage-runtime.mjs`；`tools/cli/check-decision-log-chain.mjs`；`runtime/stage/stage-content-contracts.mjs`；`runtime/review/ocr-delegation-adapter.mjs`；`skills/catalog.yaml`；`skills/reuse-registry.md`；`skills/decision-log/SKILL.md`；`skills/decision-log/templates/decision-log-template.md`；`skills/wh-review/SKILL.md`；`skills/wh-review/contracts/verify-code.md`；`skills/wh-review/scripts/review-materials.mjs`；`skills/wh-review/scripts/__tests__/simple-contracts.test.mjs`；`skills/architect-code-review/SKILL.md`；`skills/simplicity-guard/SKILL.md`；`skills/workflowhub-host-protocol/SKILL.md`；`skills/mini-task/SKILL.md`；`skills/isolated-browser-qa/SKILL.md`；`skills/plan-eng-review/SKILL.md`；`skills/grill-with-docs/SKILL.md`；`skills/grill-with-docs/GLOSSARY-FORMAT.md`；`skills/spec-specify/SKILL.md`；`skills/spec-plan/SKILL.md`；`skills/spec-analyze/SKILL.md`；`skills/review/SKILL.md`；`skills/stage-handoff/SKILL.md`；`workflows/make-decision/SKILL.md`；`workflows/make-decision/steps.json`；`workflows/build-plan/SKILL.md`；`workflows/build-code/SKILL.md`；`workflows/build-code/skill-deps.yaml`；`workflows/build-code/steps.json`；`workflows/verify-code/SKILL.md`；`workflows/verify-code/skill-deps.yaml`；`workflows/verify-code/steps.json`；`workflows/build-prd/SKILL.md`；`workflows/build-plan/steps.json`；`workflows/build-prd/steps.json`；`tests/contract/code-review-ocr.test.mjs`（新增路径）；`tests/contract/code-review-ocr-fallback.test.mjs`（改名后删除的旧路径，与上一个路径同批处理）；`tests/contract/verify-architect-acceptance.test.mjs`；`tests/contract/ocr-ac006-011-experiments.test.mjs`；`tests/contract/ocr-delegation-adapter.test.mjs`；`tests/contract/post-build-plan-missing-index.test.mjs`；`tests/review/card09-targeted-dispatch.test.mjs`；`runtime/review/review-output.mjs`；`skills/third-review/lib/process.mjs`；`skills/third-review/lib/adapters/pi.mjs`；`workflows/verify-code/design-alignment.mjs`（P11 择一：删除或改为不再导入缺失符号）；`tests/verify-code-design-alignment.test.mjs`（随 P11 的选择一并清理或改写断言）；`skills/frontend-component-quality/SKILL.md`（P11/T029 仅第 9 行消费义务一句，保后文 consumer-census.v1 与其它字节）。
- **禁止改动**（逐条附实读记录，见下表）：
- **全局依赖与每文件触改顺序**：

| 文件 | 触改顺序（Phase） | 依据 |
| --- | --- | --- |
| `workflows/make-decision/SKILL.md` | P3 → P6 | `M1` 先删重复段；P3/T008 在 P4/T011、T012 后只把方法第 1 步旧 U 块句同行改成 decision-log owner 条件指针（来源 quality/evidence/execution-memo/2026-10-10-018-p4-standards-supplement.json，FR-QUAL-007/AC-003/005c）；`M7` 后改既定判据，不承接或扩大该句 |
| `workflows/build-plan/SKILL.md` | P3 → P5（`:20`） → P6 | `ADR-005` 归属表；`build-plan:20` 唯一写权归 M3c |
| `workflows/build-code/SKILL.md` | P1（`## OCR 能力与回退` 节） → P3 → P6 | `ADR-007` 与 `ADR-011` 同文件串行 |
| `workflows/verify-code/SKILL.md` | P1 → P3 → P6 | 同上 |
| `skills/wh-review/SKILL.md` | P1 → P10（追加失败回读义务与派发卫生句） | P1 是唯一写主；P10 落地时按锚文本重取位置 |
| `runtime/review/review-output.mjs` | P10 | 唯一写主（用户在计划确认时授权） |
| `skills/third-review/lib/process.mjs` | P10 | 同上 |
| `skills/third-review/lib/adapters/pi.mjs` | P10 | 同上 |
| `workflows/verify-code/design-alignment.mjs` | P11 | 唯一写主（`OPEN-05` 授权；删除或去掉缺失导入） |
| `skills/frontend-component-quality/SKILL.md` | P11/T029 | 仅第 9 行既有消费要求一句；来源正式039、独立116及主会话最小范围授权，保 consumer-census.v1 与其它字节 |
| `docs/architecture/move-map.json` | P1 → P5 → P11 | 三个写主必须串行；P11 只同步本 Phase 删掉的登记 |
| `workflows/build-prd/SKILL.md` | P3 → P5（`W-10` 措辞） → P6 | `S-13`／`W-10` 归 M3c，17 处含 build-prd |
| `workflows/*/steps.json` | P1（build-code／verify-code 内容） → P6（make-decision step 14） → P8（空白归一一次） | 内容先改，空白只做一次 |
| `skills/catalog.yaml` | P3（删 44 条） → P5（漂移与绝对路径） | `ADR-005`/`ADR-006` 归属表 |
| `AGENTS.md` | P1（治理文本统一） → P5（`:58`）；P7 只读核对 `:25`／`:26` | `M6` 不改 `AGENTS.md` 字节 |
| `docs/standard-workflow.md` | P1 → P7（`:15` 删 12 字） | `M3a` 先统一，`M6` 后删 |
| `docs/architecture/move-map.json` | P1（`:789/:793/:2841/:3429/:3432`） → P5（`:1870-1881`） | 两模块互不重叠 |
| `tests/contract/verify-architect-acceptance.test.mjs` | P1 唯一写主（P6 实读+实跑证明不需要再改：`:21` 的 7 串不落在 P6 的改写单元内部；且 P1 已按 test change request 删掉该 `it`） | `ADR-011:479` 的字面「同批改」与实读冲突，按实读落地并如实登记（见 `OPEN-12`） |
| `tests/contract/build-prd-review-contract.test.mjs` | 不写入集：P5、P6 分别实读证明 `:40` 是 `toMatch`（只需 1 处命中），两者的改动都不落在命中点内部 | 以 sha256 记入 P5 的 DO NOT TOUCH 表；实跑 HEAD `16 passed` exit 0 |
| `skills/spec-plan/SKILL.md` | P5 唯一写主（`:19`、`:67`） | `O-07` 与 `W-09` 同属 M3c；P8 只读核对坏引用④ |
| `skills/mini-task/SKILL.md` | P1（`:17` 删换执行者表述） → P5（`:17` 与 runner 路由一致） | 两模块同触一行，串行 |
| `skills/reuse-registry.md` | P5 唯一写（stale 行按现状改写） → P8 只读核对坏引用⑤⑥ | `U-007` 要求修正而非删整份；F-06 的坏引用写主由 P5 承接 |
| `docs/reuse-registry.md` | P5（`:13` 删 fallback 句） | 与 `skills/reuse-registry.md` 是两份不同文件，逐条写精确路径 |
| `skills/wh-review/scripts/review-materials.mjs` | P1（仅当 `:36-40` 登记了被改名的测试文件） → P8（`:38` 的 `skills/spec-tasks/` 坏引用②） | 两处不同锚点；P1 的条件性改动由其实读结果决定 |
| `tests/acceptance/card-03-current.mjs` | 不写入集：P8 只读核对，登记材料误报 | 见 `OPEN-08`（已由实读裁定为**故意的退役清单**） |

- **文件归属**：每个路径在任一执行时刻只有一个持有者；上表出现两次以上的路径，其索引 `Dependency` 必须写成真实串行，且后触改者必须先重取锚点（按锚文本定位，不按行号）。
- **本计划自身是 `ADR-008` 的真实材料实例**：本计划存在跨 Phase 重复写路径，全部落在上表的串行对之间。在 P2 落地前，现行校验器会把本计划判为写集重复（`ok:false`）——这是**预期事实**，不是缺陷；已实读 `tools/cli/stage-runtime.mjs:553-556` 只读 `parsed.facts.phase_rows`、不判 `ok`，因此不阻断派发。P2 落地后同一输入应 `ok:true`。
- **回滚与恢复**：任一 Phase 出错时，原 owner 从该 Phase 的基线提交恢复其写入集（`git checkout <phase-base> -- <写集路径>`），不丢弃其它 Phase 的改动、不改写历史；`phase-template.md` 若被意外改动，按 `U-020` 逐字恢复。

### 需求到任务追踪

从 `decision-log.md` 的 `## 验收面` 与 R-、U-、ADR- 编号逐条核对已确认决定；原件缺失记 `unknown`，不猜补。ID 或文件名出现但没有具体行为、负例与原文强度对照，不算覆盖。

| 来源 / 决定 | 原义行为/强度 | FR / AC | Phase / Task | 正例 + 负例判据 / 证据 | 依赖 / 状态 |
| --- | --- | --- | --- | --- | --- |
| `U-003`、`U-005`、`ADR-007` | 「回退」概念彻底删除；OCR 不可用如实记不可用、不换执行者 | FR-QUAL-001／002／003 / AC-003、AC-005c | P1/T001–T003 | ORACLE-SQR-P1：治理与技能文本无换执行者表述；not_installed 分支不再返回 `executor:"wh-review"`；installed 路径回归不变 | none；`current` |
| `U-005`、`U-020` 第 2 项 | 改宪配套三件落地，改宪为不可逆动作 | FR-QUAL-004 / AC-004 | P1/T004 | ORACLE-SQR-P1：`constitution-checklist.md` 有逐条对照；`CONSTITUTION.md` 版本为 `1.9.3`；`docs/adr/0035-*.md` 存在 | T001–T003；`current` |
| `OI-006`、`ADR-008` | 写集校验区分治理文件与实现文件，串行可共享 | FR-QUAL-005 / AC-003 | P2/T005–T007 | ORACLE-SQR-P2：治理文件共享 `ok:true`；串行对共享 `ok:true`；**非串行同改 `ok:false`**；`docs/adr/0036-*.md` 存在 | none；`current` |
| `U-007`、`U-009`、`U-020` 第 1 项 | 只删真 no-op 与真重复；13 项验收原地保留 | FR-QUAL-006 / AC-005a、AC-005b、AC-005c | P3/T008–T010 | ORACLE-SQR-P3：复盘段与同 sha 句各 1 处且带触发分支；`phase-template.md` 的 `git diff` 为空；`:228` 逐字保留；44 条 legacy 登记 0 条；YAML 仍可解析 | none；`current` |
| `U-014`–`U-017`、`ADR-005` | 模板按下游消费重设计；ADR-023 补归档 | FR-QUAL-007 / AC-003、AC-005c | P4/T011–T013；P3/T008（仅入口旧 U 句） | ORACLE-SQR-P4：模板节序与「退役登记」五列齐备；外置索引有绝对路径必填行；`decision-log/SKILL.md` 有骨架与「不是质量门」；`docs/adr/0037-*.md` 存在且不与 `0023` 撞号；P3/T008 补充读回入口条件指针与该 owner/模板一致，make-decision 净行 0 | P4 none；入口补修依 P4/T011、T012；`current` |
| `Z1`、`R5`、`R6`、`F3` | 九类矛盾与登记修正，每条独立可验证 | FR-QUAL-008 / AC-003、AC-005c | P5/T014–T017 | ORACLE-SQR-P5：各新串 `grep -c` = 1；`changed|no-change` 一致；`check-decision-log-chain.mjs` 认现行 `ADR-NNN`+5 字段；漂移普查输出与落地逐条对应 | P1、P3；`current` |
| `ADR-011`、`R-017`、`U-013` | 5 个 workflow 17 处判据改写，净行 0 | FR-QUAL-009 / AC-006、AC-003 | P6/T018–T020 | ORACLE-SQR-P6：17 处锚文本逐一匹配目标串；`git diff --numstat` 每文件 add == del；第 10 步穷尽判据串存在；两个措辞锁测试同批改 | P3、P5；`current` |
| `ADR-010`、`U-018` 第 3 项 | 删宽口径 12 字，`AGENTS.md:26` 保持原样 | FR-QUAL-010 / AC-003 | P7/T021 | ORACLE-SQR-P7：`docs/standard-workflow.md` 无该 12 字；`AGENTS.md:26` 逐字含「例外只有用户或 CI 守卫明确要求」 | P1；`current` |
| `Z1`、`U-020` 第 3 项 | `steps.json` 内容不删、只空白归一；6 条坏引用处置 | FR-QUAL-011 / AC-003、AC-004 | P8/T022–T023 | ORACLE-SQR-P8：5 份 `steps.json` `git diff -w` 为空且 JSON 可解析；`completion_evidence` 条数不变；6 条坏引用逐条有结论 | P1、P6；`current` |
| `R-010`、`U-001`、隐藏前提 B | 不宣告已修好；字节只作事实 | FR-QUAL-012／013 / AC-001、AC-002、AC-004、AC-005a | P8/T023、P9/T024–T025 | ORACLE-SQR-P9：逐 AC 行数 = AC 条数；字节实测行存在且带命令；无「已修好」字样；`AC-006` 记 `unavailable` | P1–P8、P10、P11；`current` |
| `R5`／`R6` 原件 | 逐文件审计结论与 `S-01`–`S-18` 落点 | FR-QUAL-013 / AC-001、AC-002 | P9/T024 | ORACLE-SQR-P9：审计口径指向 `R5`（16 个改动文件）与 `R6`（36 项）；每条发现带事实证据引用 | P1–P8、P10、P11；`current` |
| 用户 2026-10-10 授权（`OPEN-13`） | 审查管道的三条失败根因各有一条可证伪修法；失败不被改写成通过 | FR-QUAL-014／015 / AC-007 | P10/T026–T028 | ORACLE-SQR-P10：散文+唯一 JSON 被接受而歧义/坏 JSON/纯散文仍 `invalid`；重复心跳不误停、真静默必停；既有三路解析回归；无新 schema 字段与状态文件 |
| 用户 2026-10-10 授权（`OPEN-05`） | 断链按最小改法处置，不引入替代实现 | FR-QUAL-016 / AC-008 | P11/T029–T030 | ORACLE-SQR-P11：模块导入期不再失败或已删除；悬空引用 `grep` 计数 0；`move-map.json` 无残留；`run-checks` exit 0 | P5（`move-map.json` 串行）；用户授权 |

### 全局验证策略

- **验证策略**：每个 Phase 一份判定器 `quality/tests/sqr-pN-oracle.mjs`，用 `--task=TNNN` 选断言集；行为面（P1、P2）走真实导出调用，其余按 `G-2` 用结构/字节判定器并对「不覆盖运行时行为」如实声明。
- **RED/GREEN 设计**：同一个判定器在 HEAD 上跑出 `[TARGET]` 失败（exit 1）即为 RED；实施后同命令 exit 0 即为 GREEN；`[GUARD]` 在两侧都必须通过。未执行不宣称 RED/GREEN。
- **最终聚合**：P9消费P1–P8、P10、P11的真实验证/review处置原件与run-checks，T024在唯一普通报告保原10AC逐行事实/8词表/真实证据、披露及真实当前最终HEAD与task代码字节；c28e2fb1=296850只作historical baseline，不冒当前。T025只读同一actual ref，卡不双写当前状态。P9自身新增/修改/删除与声明按既有Phase差异/原件/只读Git独立逐条比对，保实际appendRecord返回ref与原任务baseline允许路径；clean合法，错误明确显露，不以其它Phase dirty作归因或门、不筛allowlist抹undeclared写面。**它不是验收Phase**，保原template pin/13项、AC006 unavailable/no-pass及全部GUARD，不宣告通过；原009/121/125/129只读。
- **不能证明的内容**：不证明真实效果（`AC-006` 由用户实跑读回）；不证明模板重设计后日志真的变薄；不证明宿主要不要 `steps.json` 的 `completion_evidence`（`OI-024`）；不证明三个新 ADR 的长期有效性；`tests/contract/ocr-delegation-adapter.test.mjs` 在 HEAD 已有 **3 条与本次无关的既有失败**（单文件实测 `3 failed | 50 passed`，集中在宿主 hook／permissions 与 sibling 聚合用例），本次不修、也不以该整文件作为 P1 的门；该文件的 `:992` 措辞锁由 P1 判定器单独覆盖。

每个 `phases/P<n>.md` 指向本节和全局目标的稳定锚点，不复制全局设计；每个 Task 再写自己的第一步动作、同命令 RED/GREEN 与失败 oracle。

### 禁止改动（逐条实读记录，读取时刻 `c28e2fb1`，2026-10-10）

| 路径 | 逐字字段 / 符号 | 实读命令或工具 |
| --- | --- | --- |
| `skills/spec-plan/templates/phase-template.md` | `:12 > **判定规则**：H1 里出现一个「并且」连接的两个交付物…`；`:228 3. **授权边界**：写目标账号与环境、副作用白名单与数量上限…`；`:222-239` 13 项验收小节 | `read` + `grep -n` |
| `skills/spec-specify/templates/spec-template.md` | 6 处「回退」均为「回退默认值」语义（`:59`／`:111`／`:209`／`:245`／`:257`／`:286`） | `grep -n 回退` |
| `runtime/review/schemas/result.schema.json` | `:670-697` 定义 `fallback{from:"ocr",reason,detected_by}` 与 `executor` 枚举 `["ocr","wh-review"]` | 引用扫描（S3 实读） |
| `workflows/verify-code/design-alignment.mjs` | `:4 import { buildConsumerCensus, validateProjectStandardSources } from "../../runtime/stage/stage-content-contracts.mjs";`（两个导出在该模块已不存在；`alignUiDesignEvidence` 零调用者） | `read` + `node --input-type=module -e "import(...)"` → IMPORT_FAIL |
| `AGENTS.md` | `:25` 只跑受影响针对性测试…；`:26` 例外只有用户或 CI 守卫明确要求… | `read` |
| `specs/archive/**`、`docs/archive/**`、`docs/research/**` | 只读历史与调研原件 | 治理边界 |
| `core/**`、`scripts/**`、`metrics/**`、`fixtures/**`、`contracts/**` | 本次无消费者、无改动 | 范围外 |

## Appendix A — 验收判据（唯一权威）

本节回答：每条承诺如何验证、通过、失败并留下证据。`decision-log.md` 的 `## 验收面` 只是交接索引，判据以本节为准；**AC 编号与该节同号**（`AC-001`–`AC-006`，其中 `AC-005` 拆 `a/b/c`）。该节明确要求两处同号，属被锁定来源声明的允许例外，故本次不改为 `AC-{DOMAIN}-{NNN}` 形式。

- [ ] **AC-001**：对现代化改过的每个 `workflows/**`、`skills/**` 文件做一次回归审计；关联 FR-QUAL-013
验证：读 `R5-workflows-regression-audit-20261010.md`（16 个改动文件逐条结论）与 `R6-skills-regression-audit-20261010.md`（36 项逐技能结论 + `S-01`–`S-18`）的结论行，核对每个被现代化改过的文件都有「无衰退／有衰退（带编号）／无法判断（写缺口）」之一；P9 的判定器按文件清单逐条核对结论存在性
通过：每个被现代化改过的文件都能在 `R5`／`R6` 找到结论行；有衰退项带 `文件:行` 与 before/after 指针
失败：存在被现代化改过却无结论的文件；或把「无法判断」当成「无衰退」
证据：`R5`／`R6` 原件（任务库 `quality/evidence/decision-log-refs/`）；P9 判定器输出的核对结果；`quality/tests/2026-10-10-009-sqr-p9-red.log`

- [ ] **AC-002**：每条发现在三类根因（方法文本／执行者行为／上下文与工具）中有明确归类，且至少一条事实证据；关联 FR-QUAL-013
验证：读 `R2`（会话事件行号）、`R3`（指标对照 + 会话行为）、`R4`（commit 清单 + 逐文件 diff）、`F1`–`F5`，核对每条发现都有归类与证据指针
通过：每条发现带至少一条 diff 行号或会话事件索引，且归类属于三类之一
失败：只有推测、无法证伪；或某条发现无归类
证据：`R2`–`R4`、`F1`–`F5` 原件；P9 判定器的归类核对结果

- [ ] **AC-003**：每条修复绑定它针对的发现编号，有 before/after 文本对照，修复集内部无自相矛盾的规则；关联 FR-QUAL-001–013
验证：逐 Phase 判定器（`sqr-p1`–`sqr-p8`）在 HEAD 上 `[TARGET]` 失败、实施后退出 0；每个 Phase 卡片写「来源 / FR / AC」逐字来源编号；`git diff --name-only` 与声明写集逐条比对；`run-checks` exit 0；测试与最终检查只覆盖用户或 CI 守卫明确授权的受影响范围，计划自身不授权无范围全量回归
通过：十个 Phase 的判定器 GREEN、写集比对无越界、`run-checks` exit 0；每条改动能找到对应发现编号或 `F`／`W`／`S` 条目
失败：修复与发现不对应；新规则与旧规则冲突（例如「回退」概念在任一处残留，或「不换执行者」与 skill-deps 触发条件互相矛盾）；出现越界写集
证据：各 `quality/tests/2026-10-10-N-sqr-pN-red.log`（`N` 为一位或多位当日序号） 与 build-code 发布的 GREEN 原件；`git diff --name-only` 输出；`node tools/cli/run-checks.mjs` 输出

- [ ] **AC-004**：交付如实披露未修项；关联 FR-QUAL-002、FR-QUAL-004、FR-QUAL-011、FR-QUAL-012、FR-QUAL-013
验证：读「风险与延期交接」表、`## 未落项与处置` 表与 P9 的事实汇总，核对未修／无法修／证据不足项逐条有原因与现状
通过：每条未修项具名（文件或编号）、有原因、有 owner 或处理阶段；全文不出现「已修好」结论
失败：把 `incomplete`／`unavailable` 写成完成；或宣称效果已被证明
证据：`decision-log.md` 的相应表；P9 判定器对「无已修好字样」与「未修项逐条具名」的输出

- [ ] **AC-005a**：修复后 `skills/**/SKILL.md` + `workflows/**/SKILL.md` 总字节 **≤ 296,850 B**（事实记录，不作质量结论）；关联 FR-QUAL-006、FR-QUAL-013
验证：`git ls-tree -r --long <ref> -- skills workflows | grep 'SKILL.md' | awk '{s+=$4} END {print s}'`，修复前后各跑一次并原样记录实测值与命令
通过：修复后实测值 ≤ 296,850；前后实测值与命令原样出现在证据里
失败：高于修复前；或只记结论不记命令与实测值
证据：P9 判定器输出的字节实测行（含命令与两个 ref 的实测值）

- [ ] **AC-005b**：每条删除项二选一提供证据：① model-relative no-op 证据（相对当前模型默认行为的真实 case 有/无句对比，不是「grep 不到读者」）；② 承接落点（owner `文件:行`）；任一步骤的完成判据被删且无承接 = 失败；关联 FR-QUAL-006
验证：逐条核对 P3（以及 P5／P7／P8 的删除项）的删除清单，每条给出证据类型与具体指针
通过：每条删除项都有 no-op 证据或承接落点；`phase-template.md` 的 `:228` 与 13 项验收小节逐字保留
失败：出现「无机器读者即删」式判定；或删掉判据却没有承接
证据：`W1` 原件 §2 Q10 行；各 Phase 判定器的删除清单断言输出

- [ ] **AC-005c**：同一意思只剩一处权威（指针不收敛、也不新增常驻行）；每个保留/新增指针带明确触发分支，且落在写作当刻在场的常驻位置；因 M2 已取消，本条只剩「每个保留的指针必须带明确触发分支」；关联 FR-QUAL-001、FR-QUAL-006、FR-QUAL-007、FR-QUAL-008
验证：对 P3／P4／P5 的每个保留指针，核对它写明「读什么材料、在什么条件下读」；计数同一意思的权威处为 1
通过：每个保留指针带触发分支；同 sha 复盘段与 131 B 句各只剩 1 处权威且另 4 处是指针
失败：收敛后写作当刻到不了唯一权威；或指针无触发条件
证据：`W1 D4`；各 Phase 判定器的指针断言输出

- [ ] **AC-006**：M7 的步骤不漏——由用户下次实跑读回，**本次不做门**；关联 FR-QUAL-009
验证：本次不实跑。P9 只记录基线（77 份历史决策日志中仅 1 份出现完整 grill 方法、0 份出现术语 changed/no-change 行）与用户实跑待读回的事实
通过：用户下次真实执行 make-decision 时，产物里可读到 ① `grill_summary` 的**八个顶层键**（`status`／`direction_changing_challenges_resolved`／`context`／`adr`／`conflicts`／`requirement_coverage`／`exit_checks`／`decision_updates`，权威是 `skills/grill-with-docs/SKILL.md` 的 YAML 块 `:81-99`；本条的键数与行范围由 build-plan 收尾时的实读修正——此前的「七字段」漏了 `:97` 的 `decision_updates`）②术语表的 changed/no-change 行含理由与文件引用 ③ `## 原始需求` 表的处理状态列无空项
失败：产物里仍缺上述任一项（说明指针或判据仍未生效）
证据：**本次 `unavailable`——未执行。** 用户实跑结果为最终判断；P9 只留基线与 `unavailable` 声明

- [ ] **AC-007**：审查管道修复的可证伪判据——①「118 字节散文 + 一个合法 findings JSON」的输入被解析为**该 provider 的发现**（不再是 `OUTPUT_INVALID`），而「散文 + 两个候选 JSON」「散文 + 坏 JSON」「只有散文」三种输入仍然判 `invalid`；②重复的无载荷心跳不再把活跃流判成 `PROCESS_STALLED`，而真正静默的流仍然会停；③对 `OUTPUT_INVALID` 且保留原始输出的失败来源，存在一条只读回读记录（是否可救回唯一 findings JSON）；④既有三路解析（整份 JSON／JSONL／唯一围栏）行为不变；⑤没有新增 findings schema 字段、没有新增状态文件或常驻账本、没有引入总墙钟上限
验证：P10 的判定器（`quality/tests/sqr-p10-oracle.mjs`）＋ `skills/wh-review/scripts/__tests__/` 与 `skills/third-review/test/` 下新增的针对性单测
通过：上述 5 条全部有具名断言且逐条可重放；`run-checks` 保持 exit 0。P10 T027 另以 A-L 具名断言固定 supported/unsupported 边界：A 无 callable probe 的 `streamLiveness` 在 spawn 前拒绝；B `streamLiveness + streamProgress` 在 spawn 前拒绝；C 普通 no-probe `streamProgress` 五 interval 静默停止；D 有 probe 真静默五 interval 停止；E 心跳仅在 12 interval semantic window 内有界；F 心跳停止后回到五 interval 静默；G generation advanced 只产生 diagnostic-only `HEALTH_PROGRESSING` 投影并保留原 probe evidence，含 probe 间 heartbeat；H 停帧保留 `HEALTH_BUSY` 并五 interval 停止；I delayed verified cursor/session 重置 semantic window；J 未 stalled 前 valid completed 保留 `health_harvested`、raw、session、cursor；K stalled 后 completed 不得复活；L liveness-only observeLine 分支不调用 `noteProgress`。unsupported rejection 本身不是 AC pass；支持域外输入保持披露。
失败：任一条只能靠人工目视、或修复把失败改写成了通过／空 findings
证据：`PFACT-017`、P10 的 RED/GREEN 原件与 `OPEN-13` 的处置记录；旧 T027/169/168、052、002 原始件只读保留，不重写。
- [ ] **AC-008**：`OPEN-05` 断链处置的判据——①`workflows/verify-code/design-alignment.mjs` 不再在导入期失败（模块被删除，或不再导入不存在的符号）；②全仓当前文件不再有指向它、或指向被删符号的悬空引用（只排除既有 `.git/**`、`node_modules/**`、`specs/**`、`docs/archive/**`、`docs/research/**`；其余全体文件原字节均核，不按扩展名或文件类别缩范围，含当前代码、数据、agent 方法及无扩展名文件；读取失败明确报错，活 `.md` 消费义务不得以名词解释放行；悬空引用计数为 0）；③`docs/architecture/move-map.json` 无残留登记；④`tests/verify-code-design-alignment.test.mjs` 按卡片写明的选择被一并清理或改为断言「不再存在且无悬空引用」；⑤`run-checks` 保持 exit 0
验证：P11 的判定器（`quality/tests/sqr-p11-oracle.mjs`）与同一 3 个负向例；扫描加强及必要 oracle 校准须另经独立 TCR，保全部 TARGET/GUARD 身份、数量和失败强度，材料登记不代批准；历史066、039及 RED 原件只读保留
通过：上述 5 条全部有具名断言；两条命令可重放（悬空引用 `grep` ＋ `run-checks`）
失败：断链仍在、或引入替代实现/新机制、或改动落到 `runtime/stage/stage-content-contracts.mjs` 的导出面
证据：`PFACT-018`、P11 的 RED/GREEN 原件

> 验收判据停留在产品层；全局 oracle 映射见「全局验证策略」，精确命令留给所属 Phase。

## 12. 风险、未决与交接

本节回答：哪些触发可能损害结果，由谁在哪个阶段处理。

- **RISK-01**：把有效的方法规则删掉，造成二次退化
  - **受影响 ID**：FR-QUAL-006、FR-QUAL-008、AC-005b
  - **触发条件**：删除清单直接采用 `R5`／`R6` 的衰退判定（已被证伪 2 处），而不是以 `F2` 的逐条消费者证据为准
  - **后果**：二次退化，且无法归因
  - **缓解或停止**：M1 的每条删除在 P3 卡片里逐条二次确认；`phase-template.md` 整体不动、`git diff` 必须为空
  - **处理阶段**：build-plan（P3 卡片）／build-code（P3 执行）
  - **验证**：P3 判定器的删除清单与 `git diff` 断言；`AC-005b` 逐条证据
- **RISK-02**：`workflows/verify-code/design-alignment.mjs:4` 的断链（新发现，**不在 decision-log 的 48 行写集表内**——该表实读为 38 行，见澄清记录 `C-10`；**用户已于 2026-10-10 计划确认时授权纳入本次修，落点＝P11**）
  - **受影响 ID**：FR-QUAL-016、AC-008（原文的 FR-QUAL-013／AC-001／AC-004 保留为背景：它同时是 P9 披露项）
  - **触发条件**：任何以 `import` 加载该模块的路径；`alignUiDesignEvidence` 全仓零调用者，故当前不影响 `run-checks`
  - **后果**：verify-code 目录里存在一个加载即失败的死模块；它是「现代化前既有问题」（引入提交 `bfbe0ad0`／`457299b3` 均为 `721cd7fb^` 的祖先）
  - **缓解或停止**：已授权的最小改法＝删除死链路并同步 `move-map.json`（或改为不再导入缺失符号），不新增替代实现；若执行中发现需要动 `runtime/stage/stage-content-contracts.mjs` 的导出面，停下并交主会话裁决（那超出本次授权范围）
  - **处理阶段**：P11（build-code 内执行）
  - **验证**：`node --input-type=module -e "import('<W>/workflows/verify-code/design-alignment.mjs")"` 的真实退出结果（当前 IMPORT_FAIL）＋悬空引用 `grep` 计数＋`run-checks` exit 0
- **RISK-03**：M4 放宽写集独占后，真正的「未授权同改」漏过
  - **受影响 ID**：FR-QUAL-005、AC-003
  - **触发条件**：`Dependency` 声明的串行与实际执行顺序不一致
  - **后果**：两个执行者同时改同一文件
  - **缓解或停止**：豁免只对 `Dependency` 为真且真正串行的 Phase 对生效；补一条**非串行同改仍报错**的反向用例；治理文件真实并发冲突由既有 `git diff --name-only` 独立审查兜底
  - **处理阶段**：build-plan（P2 卡片）／build-code（P2 执行）
  - **验证**：P2 判定器的反向用例必须 `ok:false`
- **RISK-04**：M3a 改宪不可逆
  - **受影响 ID**：FR-QUAL-004、AC-004
  - **触发条件**：`CONSTITUTION.md` 版本升到 `1.9.3` 之后需要回退
  - **后果**：治理文本与版本号需要二次修订
  - **缓解或停止**：改动量最小（删「回退」概念 + 版本号），改前保留对照记录；回退走 `git checkout`
  - **处理阶段**：build-code（P1 执行）
  - **验证**：`constitution-checklist.md` 的逐条对照记录；`git diff` 只含声明写集
- **RISK-05**：M7 全是行为预期改写，效果未观测
  - **受影响 ID**：FR-QUAL-009、AC-006
  - **触发条件**：改写后的判据在新任务里仍被抢跑
  - **后果**：同样的步骤遗漏继续发生
  - **缓解或停止**：17 处按原件逐字落地并核对；效果由用户实跑读回，本次不宣称修复
  - **处理阶段**：build-code（P6 执行）／用户实跑
  - **验证**：P6 判定器的 17 处锚文本断言；`AC-006` 保持 `unavailable`
- **RISK-06**：`catalog.yaml` 44 条删掉后 provenance 无处可查
  - **受影响 ID**：FR-QUAL-006、AC-005b
  - **触发条件**：删除后需要回溯某个 legacy skill 的来源
  - **后果**：来源信息只能从 git 历史取
  - **缓解或停止**：按 `U-007` 第 1 项，删前先核 `catalog.yaml` 覆盖度；未覆盖时把保留的那 1 份放回原处；44 条保留在 git 历史可整条找回
  - **处理阶段**：build-code（P3 执行）
  - **验证**：P3 判定器的覆盖度核对输出
- **OPEN-01**：`runtime/review/schemas/result.schema.json:670-697` 仍接受 `executor:"wh-review"` 并定义 `fallback`
  - **受影响 ID**：FR-QUAL-002、AC-003
  - **负责人**：用户／后续任务
  - **影响**：公共 schema 与「不换执行者」的语义不完全一致（不再有生产者产出该值）
  - **处理阶段**：本次不动（收窄公共契约无本次决定）；登记待后续任务
  - **关闭条件或停止**：出现真实消费者需要收窄，或用户明确要求收窄时另行决定
- **OPEN-02**：`OI-024` 宿主是否消费 `workflows/*/steps.json` 的 `completion_evidence`
  - **受影响 ID**：FR-QUAL-011
  - **负责人**：后续任务
  - **影响**：无法证明它零 reader，故本次不删内容
  - **处理阶段**：本次只做空白归一；查实后再定去留
  - **关闭条件或停止**：在宿主侧查到真实读取点或确认无读取点
- **OPEN-03**：`W-06` 的目标串与 HEAD 不符（`PFACT-009`）
  - **受影响 ID**：FR-QUAL-009
  - **负责人**：P6 实施者
  - **影响**：若照「三处整句英文」找，会找不到落点
  - **处理阶段**：build-code（P6 执行前读 `R5` 原件核实）
  - **关闭条件或停止**：核实到真实落点或如实记 `unknown` 并跳过该处（不猜改）
- **OPEN-04**：`F3` 三处行内复原的逐字目标串在 HEAD 上是替换而非补缺（`PFACT-010`）
  - **受影响 ID**：FR-QUAL-008
  - **负责人**：P5 实施者
  - **影响**：目标串只能来自 `F3` 原件
  - **处理阶段**：build-code（P5 执行前读 `F3` 原件）
  - **关闭条件或停止**：取得逐字目标串；取不到则记 `unknown` 并不改
- **OPEN-05**：`workflows/verify-code/design-alignment.mjs:4` 断链的处置（见 `RISK-02`）
  - **受影响 ID**：FR-QUAL-013、AC-004
  - **负责人**：用户（三选一：纳入本次／指派 owner 后推进／本次不做）
  - **影响**：纳入即扩大写集与新增一个文件；不纳入则 verify-code 目录留一个死模块
  - **处理阶段**：build-plan 计划确认
  - **关闭条件或停止**：用户明确选择后写负责人
- **OPEN-06**：`OI-025` `## Append-only` 节的规则正文在 `de5fec9a` 撤节后无落点
  - **受影响 ID**：FR-QUAL-007
  - **负责人**：后续任务
  - **影响**：该规则正文目前已无落点
  - **处理阶段**：本次不恢复（`U-020` 第 3 项只处理 `steps.json`）
  - **关闭条件或停止**：后续任务定去留
- **OPEN-07**：P8 的执行侧仪式与协调膨胀（968 `send_message`／179 `wait_agent`／6 次 compaction）
  - **受影响 ID**：AC-004
  - **负责人**：后续任务
  - **影响**：下次执行仍会空转，不影响正确性只影响速度
  - **处理阶段**：本次不修，如实登记
  - **关闭条件或停止**：出现有源的执行侧修复方案时另行立项
- **OPEN-08**：坏引用③（`tests/acceptance/card-03-current.mjs:23`）**已由实读裁定为材料误报**（原「可能是有意清单」的未知已闭合）
  - **受影响 ID**：FR-QUAL-011、AC-004
  - **实读事实**：`:22 export const RETIRED_TEMPLATES = Object.freeze([` 与 `:23` 的两个已删模板路径，被 `:469 retired_templates_present: RETIRED_TEMPLATES.filter((file) => existsSync(join(cwd, file)))` 用作**负向断言**（这些模板必须不存在）⇒ 它不是悬空引用
  - **处置**：`tests/acceptance/card-03-current.mjs` **不在任何 Phase 的写入集**；P8/T023 只登记该结论与证据，不改字节
  - **关闭条件或停止**：已关闭；若后续实读发现它另有正向读取点，重新开项并交原 owner
- **OPEN-09**：`catalog.yaml` 里 14 处 `build-spec` 历史说明（`local_changes`／`purpose`／`capability_decisions`）**有意不改**
  - **受影响 ID**：FR-QUAL-008、AC-003
  - **负责人**：用户／后续任务
  - **影响**：验收若要求 `build-spec` 残留归零，需要先有改写历史说明的授权（撞 `U-007` 只授权删 44 条）
  - **处理阶段**：本次不改
  - **关闭条件或停止**：出现明确授权或真实消费者要求时另行决定
- **OPEN-10**：P5/T016 把 11 条零 stage 声明的 `used_by_stages` 改成 `[]` 是**目录真值驱动**，其前提未由用户单独确认
  - **受影响 ID**：FR-QUAL-008、AC-003
  - **负责人**：P5 实施者（执行前复核）
  - **影响**：若某条实为漏登记，改后会丢信号
  - **处理阶段**：build-code（T016 执行前用 `skills/*/skill-bundle.json` 与 5 份 `skill-deps.yaml` 再复核一次）
  - **关闭条件或停止**：复核存疑的条目按 `unknown` 保留原值，并在执行记录里写明
- **OPEN-11**：`skills/isolated-browser-qa/SKILL.md:227` 的「must end with a non-zero test exit」在 `references/fallback.md`（**不在写入集**）里没有对应约定
  - **受影响 ID**：FR-QUAL-008、AC-003
  - **负责人**：后续任务
  - **影响**：该句值域不明的部分只被减弱，未取得权威承接
  - **处理阶段**：本次不解；若要闭合需把 `references/fallback.md` 纳入写入集，或按 G-2 记 `unavailable`
  - **关闭条件或停止**：真实消费者要求一致化时另行决定
- **OPEN-12**：两个措辞锁测试**都不需要改字节**，与 `ADR-011:479` 的字面「两个测试已在写集内同批改」冲突
  - **受影响 ID**：FR-QUAL-009、AC-003
  - **实读事实**：`tests/contract/verify-architect-acceptance.test.mjs:21` 锁的 7 串在 P6 的改写单元下仍成立（P6 的 #6 只加行首前缀、#7 只搬同句子句，不落在任一串内部；且 P1 已按 test change request 删掉该 `it`）；`tests/contract/build-prd-review-contract.test.mjs:40` 的命中点在 `build-prd:18`／`:20`／`:28` 与 `steps.json`，而 P6 的 #16 只改 `:16`／`:22`；两文件实跑 `16 passed` exit 0
  - **处置**：按实读落地（不为字面「同批改」增加无意义字节），两个测试**都不进写入集**；`ADR-011:479` 的字面要求作为材料偏差如实登记
  - **负责人**：主会话已裁定；若执行时确有锁被破坏，按既有 test change request 路径处理
  - **关闭条件或停止**：build-code 执行时若发现锁变红，重新开项并交给对应 Phase 的 owner

## 13. 业务影响与回归范围

### 审查轴与执行纪律

- **既有行为**：代码面默认 OCR；已装 OCR 失败/超时/取消保留原失败；全量回归例外收在「用户或 CI」
- **本需求影响**：删除「换执行者」路径与其全部表述；无测试/安装条件下不再出现 `executor:"wh-review"` 与 `fallback` 字段
- **回归路径**：installed 路径（`:281-316` 的既有用例）与 `ocr-production-cutover` 的 `executor:"ocr"`／`legacy=0` 断言保持不变；由 P1 的 `[GUARD]` 断言与本 Phase 的针对性测试复跑覆盖
- **验收**：AC-003 的 P1 判定器
- **可能受冲击的业务规则**：`verify-code/skill-deps.yaml` 的 architect 触发条件由「OCR 可用性」改为「同源补充轴」——`build-code` 侧已按同源补充轴触发，本次对齐不新增字段
- **明确无影响**：不改权限与凭据、不改存储格式、不改 `specs/archive/**` 与 `docs/archive/**`、不动 `core/**`／`scripts/**`／`metrics/**`

### 计划材料与模板

- **既有行为**：模板与方法文件的落点关系；`phase-template.md` 的 13 项验收小节
- **本需求影响**：模板新增 `## 退役登记`、外置索引加绝对路径行、验收面加覆盖矩阵；方法文件只要求模板里有落点的东西
- **回归路径**：`phase-template.md` 的 `git diff` 为空；既有索引格式（`## Execution Index` 与现行列）不变；`steps.json` 内容逐字不变
- **验收**：AC-003、AC-005b 的 P3／P4／P8 判定器
- **可能受冲击的业务规则**：`readTaskTypeFromDecisionLog` 读模板任务类型行；P4 改模板时必须保持该行可解析
- **明确无影响**：不回填历史 decision-log；不改 pre cohort 的旧四材料读取

## 补充材料

本节回答：推导、原始输出与被否方案到哪里查。

- 主材料：`specs/workflowhub-skill-quality-regression-20261010/decision-log.md`（1018 行；`c28e2fb1`）。
- 原件（任务库 `quality/evidence/decision-log-refs/`）：`R1`–`R6`、`F1`–`F5`、`W1`、`X1`、`X2`、`Y1`、`Z1`、`D1`（两份）、`D2`、`DIR-01`、`DIR-02`、`V-002`–`V-017`。
- 缺口（如实登记）：`AUD-COV`／`AUD-MOD` 两份审计原件未单独存盘，结论已由 `U-018` 处置。
- 用户确认原件：`quality/evidence/human-confirmations/2026-10-10-001-make-decision-approve.md`（sha256 `29fe29a62f2f2ede4907c96e38e6df33a46e4ecb75c0cc524ddc20e097d1ad5e`）。
- 标杆材料：`specs/archive/workflowhub-review-efficiency-20261007/phases/P5.md`（Phase 卡形状）、`specs/archive/workflowhub-skill-modernization-20261008/decision-log.md`（被诊断对象）。

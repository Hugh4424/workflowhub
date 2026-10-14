# Phase P3 — 每个 Phase 的完成判据能由本 Phase 事实独立成立

读者：build-code 与 verify-code 的执行者、每 Phase 的独立审查者、本 Phase 的下游 Phase 作者。
读完要能：写出「完成判据降回本 Phase 事实」的三处方法文本改动（`Done` 逐条承接 AC、带欠账完成、末 Phase 角色与每 Phase 提交），并知道每条承接 AC 的判定归属由 spec 的 AC 正文决定、不由依赖链位置决定。

## Phase 契约头（文件级字段；runtime 逐字读取）

- **Global spec**：`spec.md#appendix-a--验收判据唯一权威`（全局判据唯一权威；本卡不复制 AC 正文）
- **Write set**：`workflows/build-code/SKILL.md`；`workflows/verify-code/SKILL.md`；`docs/standard-workflow.md`
- **Dependency**：none
- **Consumer**：build-code 与 verify-code 的执行者及每 Phase 独立审查者
- **gate_cmd**：`npx vitest run tests/contract/verify-architect-acceptance.test.mjs`
- **oracle**：ORACLE-P3-CLOSURE
- **evidence_path**：`quality/evidence/design-execution-efficiency-20261014/P3-phase-closure.md`
- **STOP**：三份文件里任一处的改动若会删改 `docs/standard-workflow.md` 第 21 行既有的「完成声明的上限 = 独立来源的结论」整句、或需要新增门禁／数字阈值／校验器／账本／档位词表，就地停下并在本 Phase 材料里写出缺哪条确认、交给上游 owner；不自行扩大写集。承接 AC 未达成时不停止，改走「带欠账完成」。
- **覆盖 AC**：AC-005、AC-006、AC-015
- **Done**：AC-005 记 inconclusive（判定方式「机器可判（逐条对照脚本输出全表 + 人读复核）」；材料侧首次核对在 build-plan 收口、不在本 Phase，本 Phase 只产出「Phase 卡如何写承接」的方法文本，证据指针为 `workflows/build-code/SKILL.md` 与 `workflows/verify-code/SKILL.md` 的方法文本位与其规则锚实读记录）。AC-006 记 pass（判定方式「只能人读」；仅指受控欠账形态；判定时点为 P3 收口时首次用受控场景核对形态；现有独立受控场景原件 `quality/evidence/2026-10-14-016-p3-independent-test-readback.md` 已产生，正式审查原件 `quality/reviews/2026-10-14-024-build-code-phase-p3.json` 保留本卡首次归属矛盾的原发现；独立定向读回原件 `quality/evidence/2026-10-14-033-p3-finding-independent-readback.md` 已确认原发现修复有效并逐项人读判定受控欠账形态 pass；该结论不是字符串 GREEN 或 OCR available，证据指针为033、上述原件及 `docs/standard-workflow.md` 的「带欠账完成」口径位）。AC-015 记 deferred（判定方式「机器可判」；首次结论点在 P1 收口的提交事实，本 Phase 只写提交纪律文本，证据指针为 `docs/standard-workflow.md` 的每 Phase 提交口径位与待补的 `git log` 提交事实）。各条已达成范围、剩余未达成原因、所需条件与具名 owner 逐条列在下方「完成」小节；未达成项不得写「通过」，AC-006 的受控形态结论不扩大为真实任务效率、环境或业务效果。
- **本 Phase 自带判据小结（人读）**：自己验了——三份目标文件的当前字节、`docs/standard-workflow.md` 第 21 行既有整句仍在且只出现一次；Phase 级 `gate_cmd`（`npx vitest run tests/contract/verify-architect-acceptance.test.mjs`）的改动前回归基线为 exit 0、7 passed，改动后执行原件 `quality/tests/2026-10-14-004-p3-phase-contract.output` 与同 stem `.json` 为 exit 0、7 passed，只证明所测既有契约未被破坏，不是 RED 或业务验收；T007／T008／T009 全是 G-2 纯文档卡，不执行 RED、不制造目标 RED，改动后三条客观检查原件分别为 `quality/tests/2026-10-14-005-p3-t007-target.output`、`quality/tests/2026-10-14-006-p3-t008-target.output`、`quality/tests/2026-10-14-007-p3-t009-target.output` 与各自同 stem `.json`，均 exit 0。AC-006 的受控形态已由独立原件 `quality/evidence/2026-10-14-016-p3-independent-test-readback.md` 核对，首次结论点仍归 P3 收口；正式审查原件 `quality/reviews/2026-10-14-024-build-code-phase-p3.json` 的原发现保持可见，独立原件 `quality/evidence/2026-10-14-033-p3-finding-independent-readback.md` 已确认两条正式 major 与同源 Spec minor 修复有效、无未处置严重问题，并逐项人读判定 AC-006 的受控欠账形态 pass；不把检查 GREEN 或 OCR available 写成通过。没验——AC-005 的材料侧逐条对照全表与执行事实复核、AC-015 的真实提交事实；AC-005 材料侧首次仍在 build-plan 收口，执行事实侧按 spec 在各承 Phase 收口后复核；AC-015 首次仍在 P1 收口，每 Phase 核自身提交，P8 只汇总复核。未验项所需条件与具名 owner 见「完成」小节。
- **带欠账完成（人读；显著位置标注）**：本卡**带欠账完成**。AC-006 的受控欠账形态已由独立人读判定达成；AC-005 的全表与 AC-015 的实际提交对账仍属未达成项，逐条列在「完成」小节（未达成项 + 所需条件 + 具名 owner）；剩余未达成项任何位置都不得写成 `pass`。

- 规则锚：`spec.md`「每 Phase 闭环与判据位置（CLOSURE）」的 FR-CLOSURE-001／002／003、`spec.md`「Appendix A — 验收判据（唯一权威）」的 AC-005／006／015；`decision-log.md` 的 D-017／D-018；`docs/standard-workflow.md`「专业质量」；`skills/spec-specify/SKILL.md`「技能写作规范（WR001）」。只绑定这些所依段落，其它段落变化不作废本 Phase 事实。
- 材料变更影响：spec 与本 Phase 冻结段落预计不改；本卡仅新增这两行人读锚。实施只改 `workflows/build-code/SKILL.md`、`workflows/verify-code/SKILL.md` 与 `docs/standard-workflow.md` 的本 Phase 收口、终末复核与提交纪律口径，不改运行时、模板、词表或其它 Phase 材料。

## 工作包声明（人读事实）

这些声明是事实记录，不阻断派发；派活纪律唯一权威见 AGENTS.md。

- **读集**：`specs/design-execution-efficiency-20261014/spec.md`（`Appendix A` 与「实现设计（全局权威）」）、`specs/design-execution-efficiency-20261014/decision-log.md`（M3 收敛段与 D-017／D-018）、任务库 `quality/evidence/decision-log-refs/module-design/M3M7.md` 的 M3 部分、`quality/evidence/build-plan-refs/BP-R4-docs-and-whreview-cli.md`、三份目标文件本身。
- **文件 owner**：本 Phase 三个写入路径由 T007 先落、T008 续落、T009 收口，按 T007 → T008 → T009 串行；串行理由是 T008 的完成形态是 T007 契约头的同一段落形态，T009 的提交口径要同时引用前两者的措辞。
- **接口符号清单**：N/A — 本 Phase 只改 Markdown 方法文本，不新增导出符号、公共命令、schema 或持久对象；消费面是既有方法读者与既有 `docs/standard-workflow.md` 段落。
- **合并责任**：产出方即本 Phase 实施者，负责把三处改动落全并在本 Phase 提交一次；失败换新执行者重做时沿用同一写集与同一 oracle，不扩大范围。
- **progress_cursor**：只指向任务事实库 `facts.jsonl` 的 `phase_progress`，本文件不保存进度值。

## 速读卡（人读；只写本 Phase 增量，不复制 `spec.md`）

- **本 Phase 结果**：`build-code`／`verify-code` 的方法文本与 `docs/standard-workflow.md` 的执行纪律里，出现「每个 Phase 的完成判据能由本 Phase 事实独立成立」的可执行写法：`Done` 逐条承接 AC（编号 + 现成 8 值档位 + 具名证据指针）、「本 Phase 自带判据小结」、承接未达成时的「带欠账完成」形态、末 Phase 只作复核而不作首次结论点、每 Phase 自带提交且提交在独立审查之后。
- **非目标**：不在本 Phase 改 `skills/spec-plan/templates/phase-template.md` 的判据面（归 P2、P6、P7）；不改 `spec.md` 的 AC 正文与判定方式唯一权威；不改 `GLOSSARY.md`；不动运行时任何模块；不新增档位词表以外的任何取值域。
- **改动前**：`workflows/build-code/SKILL.md` 有「实施、针对性测试、独立审查与 finding 修复全部完成后在本 Phase 提交一次」，但完成判据仍以全任务聚合与阶段末对账表述；`workflows/verify-code/SKILL.md` 有「三必留审查点」，但没有一句写明终末审查不作任何 AC 的首次结论产生点；`docs/standard-workflow.md` 同缺这两条口径。
- **改动后**：三份文件各自出现本 Phase 的三个增量口径，且 `docs/standard-workflow.md` 第 21 行的既有整句原样保留（机器按锚点字符串读该句，见「交接知识」）。
- **与相邻 Phase 的边界**：本 Phase 交付「方法文本如何写」，不交付模板字段（P2 的切分依据与 P6／P7 的模板判据面）；下游 P4 在同两个 SKILL 文件与 `docs/standard-workflow.md` 续写停机口径，依赖本 Phase 先落。
- **主要风险**：把「带欠账完成」写成新的完成状态或新字段。若因它返工，替代走法是只改措辞、只用既有 8 值档位词表与既有 `Done` 正文位置。
- **下一步**：P4 在 `workflows/build-code/SKILL.md`、`workflows/verify-code/SKILL.md`、`docs/standard-workflow.md`、`AGENTS.md` 上写停机适用范围与排除；本 Phase 的「交接知识」给出它必须原样保留的两处锚点。
- **动手前必读**：`docs/standard-workflow.md:21`（生成时刻导航提示，漂移不判卡失效；机器锚点句，禁改）；`workflows/build-code/SKILL.md:33`、`:74`、`:78`（生成时刻导航提示）；`workflows/verify-code/SKILL.md:18`、`:44`（生成时刻导航提示）；`spec.md` 的 `Appendix A` 中 AC-005、AC-006、AC-015 三条正文（判据唯一权威）；任务库 `quality/evidence/decision-log-refs/module-design/M3M7.md` 的「2. M3 方案」与「5. 判据标注机制」。
- **未决事实**：`docs/standard-workflow.md` 第 21 行的机器锚点字符串在 `tests/acceptance/card-03-current.mjs` 的锚点表里带反引号包裹 `adverse`／`unavailable`，而该文件实际字节不带反引号；影响是该条既有验收检查在本卡改动前即不成立，处置为原样保留该行、如实登记、不在本 Phase 修（下方「交接知识」与「覆盖边界」逐条写出）。

## 本 Phase 材料导航（人读；只列本 Phase 实际用到的锚点）

下表行号均为**生成时刻导航提示，漂移不判卡失效**；写卡与实施时按路径与符号定位，不按行号当契约。

| 材料 / 锚点 | 本 Phase 用它做什么 | 读取时机 |
| --- | --- | --- |
| `spec.md` 的 `Appendix A`（AC-005、AC-006、AC-015 三条正文） | 取判定方式、判定时点、执行 owner、所需条件、成功失败信号；本卡只引用不复制 | T007 开工前 |
| `decision-log.md` 的 M3 收敛段与 D-017／D-018 | 取「带欠账完成」与「末 Phase 不作首次结论点」的用户裁决原文 | 写卡前 |
| 任务库 `quality/evidence/decision-log-refs/module-design/M3M7.md` 的 M3 部分 | 取逐字方案：`Done` 三件套、判据小结三问、禁止跨 Phase 借签、末 Phase 角色 | T007、T009 开工前 |
| `docs/standard-workflow.md:11`、`:21`、`:25` | 取既有提交口径、锁定整句、证据口径；确认只做同步不改语义 | T008、T009 开工前 |
| `workflows/build-code/SKILL.md:31`、`:33`、`:74`、`:78` | 取既有 8 值词表引用位、每 Phase 一次审查位、提交口径位、三审查点位 | T007、T008 开工前 |
| `workflows/verify-code/SKILL.md:18`、`:44` | 取终末审查与覆盖语义位、三必留审查点位 | T007、T009 开工前 |
| `tests/acceptance/card-03-current.mjs` 的锚点表 | 确认第 21 行为机器锚点句、确认该锚点当前的实际匹配状态 | T008 开工前 |
| `skills/spec-plan/templates/phase-template.md` 的契约头 `Done` 行 | 确认既有 `Done` 义务（逐条档位 + 证据指针）已被模板要求，本 Phase 只补「逐条必须」与判据小结 | T007 开工前 |

## L0 — 结果与变更

本 Phase 让「这个 Phase 完成了吗」这个问题能只靠本 Phase 事实回答：`Done` 逐条承接 AC 的编号、档位与具名证据指针，并写出本 Phase 自己验了什么、没验什么、未验项要什么条件、谁负责；承接的 AC 没达成时用「带欠账完成」显著标注并逐条列缺口，而不是把它写成 `master pass` 或被下游补签。同时把末 Phase 从「首次产生全部 AC 结论」改为「消费沿途已产生的逐条结论并只补必要未闭环 case」，并写明每个 Phase 自带的开发、测试、独立审查与提交，提交在该 Phase 独立审查之后、该 Phase 收口时完成。

现在做的理由是：病例里 27 个 Phase 全部标 formal completed，而 16 条 AC 没有一条达到 `pass`；完成声明与 AC 结论脱钩的根因是判据被押到依赖链末端（`decision-log.md` step 4 的 P3 病灶、`module-design/M3M7.md` 的 §2.1）。本 Phase 与全局目标「每个 Phase 自带判据与提交、需真实环境的判据不押末端」的关系见 `spec.md#实现设计（全局权威）`。

- **结果**：三份文件的方法文本能让未参与实施的人按「AC 编号 → 承接 Phase → 判定方式 → 档位 → 具名证据指针」逐条读出一条 AC 的判定归属，并读出承接未达成时的完成形态与每个 Phase 的提交时点。
- **非目标**：不动 `phase-template.md`；不给 AC 另立一份判定方式标注；不新增档位词表、门禁、阈值、校验器或账本；不改任何运行时模块。
- **与其它 Phase 的区别**：P2 决定「Phase 边界由什么决定」，本 Phase 决定「Phase 完成判据写在哪、谁来判、没达成怎么写」；P8 是唯一末 Phase，本 Phase 只写末 Phase 的角色口径而不承担末 Phase 的验收执行。

## L1 — 可执行契约

### 文件边界

- **新增**：`N/A — 本 Phase 不新增文件，只改既有三份方法文本`。
- **修改**：`workflows/build-code/SKILL.md`、`workflows/verify-code/SKILL.md`、`docs/standard-workflow.md`。
- **禁止改动**：`skills/spec-plan/templates/phase-template.md`（判据面归 P2、P6、P7 的写集，本 Phase 碰它会与它们冲突）；`spec.md` 与 `phases/index.md`（build-plan 主会话的写集，AC 正文与判定方式唯一权威在 `spec.md`）；`GLOSSARY.md`（「带欠账完成」等三条术语已由 make-decision 落盘）；`runtime/evidence/acceptance-evidence-validator.mjs`（8 值档位词表的唯一来源，只引用不修改）；`runtime/` 下任何模块（本 Phase 零运行时代码改动）；`docs/standard-workflow.md` 第 21 行既有整句（机器按锚点字符串读取，见「交接知识」）。

### 任务顺序

T007 → T008 → T009，全任务唯一且稳定编号，接续本任务全局编号（P1 为 T001–T003、P2 为 T004–T006）。

- T007 先落：`workflows/build-code/SKILL.md` 与 `workflows/verify-code/SKILL.md` 的 `Done` 契约头写法与判据归属口径。
- T008 续落：`docs/standard-workflow.md` 的「带欠账完成」口径，串行理由是它引用 T007 写出的契约头完成形态措辞。
- T009 收口：`docs/standard-workflow.md` 的末 Phase 角色与每 Phase 自带提交口径，串行理由是它同时引用 T007 的末 Phase 角色口径与 T008 的完成形态口径。

三条串行的真实理由是同一路径 `docs/standard-workflow.md` 被 T008、T009 依次改动，以及后者的措辞依赖前者；本 Phase 内部不再引入并行。

### Task graph 与纵向切片（现有 Task 字段的写法）

本 Phase 的纵向切片沿真实读者切穿：规则来源（`spec.md` 的 AC 正文与 M3 设计原件）→ 方法正文（`workflows/build-code/SKILL.md`、`workflows/verify-code/SKILL.md`）→ 执行纪律（`docs/standard-workflow.md`）→ 真实消费者（build-code 与 verify-code 的执行者、每 Phase 独立审查者）。三张卡各自交一个可独立核对的增量，不存在的层不虚构：本 Phase 无 schema／API／UI 层，理由是本 Phase 只改 Markdown 方法文本，写集里没有代码文件。

逐卡写 blocked_by：T007 无阻塞；T008 阻塞于 T007 的两份 SKILL 文本；T009 阻塞于 T007 与 T008 的文本。不因编号相邻造依赖，三条边都对应真实的措辞依赖。

### 测试策略

本 Phase 没有行为代码，全部为窄纯文档增量（T007／T008／T009 三张卡都是 G-2 纯文档卡）。因此：Phase 级 `gate_cmd` 记为**改动前 exit 0 的回归基线**（实测 7 passed），它证明的是本 Phase 写集里的既有文本未被改动，**不是** RED；三条 Task 级命令都**不执行 RED、不制造行为 RED**，它们在改动前的非零只说明本 Phase 要写入的口径句尚未写入，属 G-2 的具名客观替代检查，不是「目标断言失败」形态的 RED，改动后为 0。下表只示范同一判定器的配对形状，不是本 Phase 的执行事实。

| 目标 | Task | 角色 | gate_cmd / 预期退出码 | 判据 / 证据路径 |
| --- | --- | --- | --- | --- |
| 本 Phase 写集内既有文本未被本 Phase 改动 | 全 Phase | 回归基线 | `npx vitest run tests/contract/verify-architect-acceptance.test.mjs` / `0`（改动前实测 7 passed，不是 RED） | ORACLE-P3-CLOSURE / 既有测试输出；偏离登记见「交接知识」 |
| 承接 AC 的完成判据写法落到两份方法文本 | T007 | GREEN（G-2；不执行 RED） | T007 卡内逐字命令 / `0`（改动前为非零：口径句尚未写入，不是目标 RED） | ORACLE-P3-CLOSURE / `quality/evidence/design-execution-efficiency-20261014/P3-phase-closure.md`（预期证据路径；实际引用由执行者保存） |
| 「带欠账完成」口径句齐备且锁定句唯一 | T008 | GREEN（G-2；不执行 RED） | T008 卡内逐字命令 / `0`（改动前为非零：口径句尚未写入，不是目标 RED） | ORACLE-P3-CLOSURE / `quality/evidence/design-execution-efficiency-20261014/P3-phase-closure.md`（预期证据路径；实际引用由执行者保存） |
| 末 Phase 角色句与提交时点句齐备、既有提交口径句仍在 | T009 | GREEN（G-2；不执行 RED） | T009 卡内逐字命令 / `0`（改动前为非零：口径句尚未写入，不是目标 RED） | ORACLE-P3-CLOSURE / `quality/evidence/design-execution-efficiency-20261014/P3-phase-closure.md`（预期证据路径；实际引用由执行者保存） |

要测的面与不测的面逐条说明：

- **方法文本面（测）**：用既有 `node` 读三份目标文件的实际字节，断言本 Phase 声明的关键口径句存在，并断言 `docs/standard-workflow.md` 第 21 行既有整句仍在且只出现一次。理由：本 Phase 的交付物就是这些句子，读真实字节是唯一能重放的判定。
- **运行时行为面（不测，具名理由）**：本 Phase 写集全为 `.md`，无新增运行行为，零运行时代码改动；因此不跑运行时单元测试，改由 Phase 级 `gate_cmd` 跑受影响范围的既有契约测试确认本 Phase 写集内的既有文本未被本 Phase 破坏。Phase 级 `gate_cmd` 取 `npx vitest run tests/contract/verify-architect-acceptance.test.mjs`（改动前实测 exit 0、7 passed），不取 `runtime-facade`／`thin-core-residue` 那对：后者在改动前即 4 条真实失败，理由与实测读数登记在「交接知识」。
- **浏览器可见面（不测，具名理由）**：本仓无 `apps/`、无 `.tsx`／`.vue`／`.jsx`，本 Phase 不改任何界面行为。
- **数据／网络／数据库面（不测，具名理由）**：本 Phase 不新增持久化、网络调用或数据库访问。
- **证据形式**：三条 Task 级命令的 exit 与原始输出各留单份，落 `quality/evidence/design-execution-efficiency-20261014/`；真实结果由执行者写进任务事实库，本文件不写执行状态。三条 Task 级命令的改动前非零与 Phase 级回归基线的改动前 exit 0 分别如实记录：前者是 G-2 的具名客观替代检查（口径句尚未写入），**不制造行为 RED**，也不构成任何 AC 的目标 RED 证据。

### 覆盖边界

- **覆盖上限**：整份 Phase 证据最多能确立「三份方法文本里出现了本 Phase 声明的口径句，且锁定整句未被改动」。它不能确立任何 AC 已经达成，也不能确立执行者会照这些句子做。
- **显式不覆盖**：AC-005 的材料侧逐条对照表（首次核对在 build-plan 收口，由 build-plan 主会话产出）；AC-006 的受控场景记录（由 build-code 承接，需一个承接 AC 未达成的真实或受控场景）；AC-015 的真实提交事实（首次结论点在 P1 收口的提交，随后每个 Phase 各自核对）；`tests/acceptance/card-03-current.mjs` 的锚点检查当前对该行的实际匹配状态（本 Phase 只登记事实，不修该检查）。

### 停止

条件：改动将删改 `docs/standard-workflow.md` 第 21 行既有整句的任何一个字；或需要新增门禁、数字阈值、校验器、账本、8 值以外的档位取值；或需要改 `phase-template.md`、`spec.md`、`GLOSSARY.md`、`runtime/` 才能落笔。负责材料：本 Phase 卡与三份目标文件。修复路径：就地停下，在本 Phase 材料里写清「缺哪条确认、属谁的写集、影响是什么」，交对应 owner，继续本 Phase 内不受影响的部分，不自行扩大写集。

不停止的情形：承接的 AC 未达成。此时按 T008 的「带欠账完成」形态显著标注并逐条列条件与 owner，本 Phase 仍收口。

### 完成

要诚实下结论所需的证据与结论强度逐条写在这里：

- **AC-005**（machine-readable；判定方式「机器可判（逐条对照脚本输出全表 + 人读复核）」）：本 Phase 只交付「Phase 卡如何写承接」的方法文本。本 Phase 档位 `inconclusive` — 未达成项：材料侧的逐条对照表（AC 编号 ↔ 承接 Phase ↔ 判定方式标记 ↔ 档位）不在本 Phase 产出，且 `spec.md` 的 AC 正文与 `phases/index.md` 由 build-plan 主会话写。所需条件：build-plan 收口时 `spec.md` 的 `Appendix A` 与 `phases/index.md` 可读、每条 AC 有判定方式标记、每个 Phase 契约头的 `覆盖 AC` 与 `Done` 齐备。具名 owner：build-plan 主会话（材料侧首次核对）；verify-code 承接（终末复核）。本 Phase 的贡献是让 `Done` 的承接写法可被逐条读。
- **AC-006**（只能人读；判定时点 P3 收口时首次用受控场景核对形态）：本 Phase 交付 `docs/standard-workflow.md` 的「带欠账完成」口径与本卡自身的显著标注示范。受控场景已经由独立执行者实际核对，唯一原件为 `quality/evidence/2026-10-14-016-p3-independent-test-readback.md`，含正例、五种欠账反例及首次结论归属负例；它只验证形态，不冒真实环境或业务效果。本 Phase 档位 `pass`，仅指受控欠账形态：正式审查原件 `quality/reviews/2026-10-14-024-build-code-phase-p3.json` 指出的卡内归属矛盾已由作者窄修，独立定向读回原件 `quality/evidence/2026-10-14-033-p3-finding-independent-readback.md` 确认原发现修复有效并对规则、当前卡、016受控场景和024原审查逐项人读判定 pass。所需条件已实际具备；不以已产出审查记录或字符串检查通过补签，也不扩大为真实效率、环境或业务效果。未追加正常审查，原发现保持原件。具名 owner：M3 实施者（本 Phase 执行者）；独立复核 P8。
- **AC-015**（机器可判；判定时点 P1 收口时首次结论、每个 Phase 收口各自核对、P8 汇总）：本 Phase 只交付提交纪律文本（提交在该 Phase 独立审查之后、该 Phase 收口时完成）。本 Phase 档位 `deferred` — 未达成项：本 Phase 自身的真实提交事实与 `git log`／`git show --stat` 读数。所需条件：本 Phase 的三份文件改动落地并通过本 Phase 独立审查后，在本 Phase 收口时提交一次；`git log`／`git show --stat` 可读。具名 owner：各 Phase 实施者（本 Phase 由本 Phase 实施者）；独立复核 P8。
- **结论强度上限**：本卡是**带欠账完成**，AC-006 仅受控欠账形态达成，AC-005 的全表与 AC-015 的实际提交对账仍未达成；任何读者不得把剩余缺口写成通过或把 AC-006 扩大为真实任务效率、环境或业务效果。提交纪要与 `docs/standard-workflow.md` 第 21 行的既有口径一致：完成声明的上限 = 独立来源的结论。
- **交接证据**：本 Phase 交给下游的已核实事实见「交接知识」；三份目标文件的改动范围由实施者用 `git diff --name-only` 与上方 Write set 逐条比对登记。

### 风险与回滚

- **风险**：「带欠账完成」被读成新的完成状态或新字段，从而变成新的门或账本。
- **影响**：触碰 AC-012 的全局边界，重复用户逐字否决过的「一大堆验收和收集」。
- **缓解**：所有出现处都写明它是 `Done` 正文里的人读措辞、只用既有 8 值档位词表、不是机器字段、不阻断同任务修复与后续安全部分。
- **回滚**：`git restore` 三个目标文件到本 Phase 开始前的字节；本 Phase 不新增文件，回滚面就是三条路径。
- **触发条件**：`git diff` 里出现新的状态取值、新字段名、新校验器或新账本，或出现「限制审查并发／限制轮次／按时长停止审查」任一措辞。

### 交接知识（给下游 Phase 与审查的已核实事实）

- `docs/standard-workflow.md` 第 21 行含既有整句 `**完成声明的上限 = 独立来源的结论**；该结论为 adverse 或 unavailable 时，只能声明到该结论允许的程度`，**禁改**（生成时刻导航提示，漂移不判卡失效）。我是怎么知道的：本卡写作时用 `node --input-type=module -e` 读该文件真实字节，逐字节命中的目标串以字符串拼接构造（避开工具层反引号转义），命令 exit 0，且整句在全文件只出现一次。
- 同一条既有检查 `tests/acceptance/card-03-current.mjs` 的锚点表里，该锚点写作 `…该结论为 \`adverse\` 或 \`unavailable\` 时…`（带反引号包裹），而目标文件真实字节不带反引号。我是怎么知道的：用 `sed -n '290,320p'` 读该检查的锚点表、用 `node` 读目标文件第 21 行并打印实际片段。影响：该锚点检查在本 Phase 改动前即不匹配；本 Phase 的处理是原样保留该行、如实登记、不修检查也不改该行（见「未决事实」与「覆盖边界」）。下游若要做机器核对，先复核这一事实，不要按锚点表里的字面以为该行已含反引号。
- `workflows/build-code/SKILL.md` 已含 `验收证据人读词表为 pass/fail/inconclusive/deferred/missing/inconsistent/incomplete/unavailable，来源 runtime/evidence/acceptance-evidence-validator.mjs:6`（生成时刻导航提示）。我是怎么知道的：`grep -n "acceptance-evidence-validator"` 命中该文件一行。本 Phase 复用该 8 值，不新增词表。
- `docs/standard-workflow.md` 第 11 行已含 `一个 Phase 的实施、针对性测试、独立审查与 finding 修复全部完成后，在本 Phase 提交一次，审查在提交前进行`（生成时刻导航提示）。我是怎么知道的：`read` 该文件全文 31 行。本 Phase 的提交纪律据此同步，不新造授权来源；T009 只补末 Phase 角色与「提交在该 Phase 独立审查之后」的时点口径。
- `workflows/verify-code/SKILL.md` 第 44 行已含 `三必留审查点为 build-plan wh-review 合并、build-code 每 Phase OCR、本阶段终末 OCR；不恢复全 Phase 集成审查`（生成时刻导航提示）。T009 的末 Phase 角色口径加在这条既有句子附近，不新增审查点。
- 本卡的 Phase 级 `gate_cmd` 相对分派时给出的那一对文件做了收窄：分派给的 `npx vitest run tests/contract/runtime-facade.test.mjs tests/contract/thin-core-residue.test.mjs` 在本 Phase 改动前就真实失败（实测 `Test Files 2 failed (2)`、`Tests 4 failed | 810 passed (814)`、exit 1），四条失败与本 Phase 写集无关：`runtime-facade` 报 `workflows/build-spec/SKILL.md` 不存在与一条 runner 契约未 reject；`thin-core-residue` 报已删模块被以新路径复活（`skills/` 八个 SKILL、`runtime/review/review-input-bounds.mjs`）。我是怎么知道的：在本 Phase 的三份目标文件**未改动**时执行该命令并读其输出，命令 exit 1。据此把 Phase 级 `gate_cmd` 收窄到 `npx vitest run tests/contract/verify-architect-acceptance.test.mjs`（实测 `Test Files 1 passed (1)`、`Tests 7 passed (7)`、exit 0，且它逐字读取本 Phase 写集里的 `workflows/build-code/SKILL.md` 与 `workflows/verify-code/SKILL.md`）；这是「原顺序 → 实际顺序 → 依据」形态的偏离登记，不改上游任何字节。

### 字段说明（人读；runtime 不解析本节，也不产生任何质量结论）

本 Phase 的契约性字段（`Write set`、`覆盖 AC`、`Done`、卡片 `Files / symbols`）只写精确路径、AC 编号与方法语义，不写行号；行号只出现在「动手前必读」「本 Phase 材料导航」「交接知识」「可观察接缝」这类导航性字段，并注明是生成时刻导航提示、漂移不判卡失效。

- `Done` 逐条承接 AC 时必须同时写出三件东西：AC 编号、一个来自 `runtime/evidence/acceptance-evidence-validator.mjs` 的 8 值档位、一条具名证据指针；缺任一件即该条在本 Phase 未闭环。
- **本 Phase 自带判据小结**固定回答三问：本 Phase 自己验了什么（附本 Phase `gate_cmd` 的原件落点）、没验什么（逐条带档位）、未验项所需条件与具名 owner。
- 「带欠账完成」的字面就写在契约头显著位置，与 `Done` 同一处可见；它不是新状态，不改变任何既有 writer。

### T007 — 完成判据降回本 Phase 事实：`Done` 逐条承接 AC 编号 + 档位 + 证据指针

- **Source / FR / AC**: R-009（「每个 phase 必须有独立的开发、测试、审查、提交；phase 完成即无遗漏」——量词是「每个 phase」，即全称；否定是「无遗漏」，即不得把任一承接 AC 留白）／U-002（step 8 追加切分与 Phase 闭环要求）／FR-CLOSURE-001（`Done` 必须逐条承接 AC：编号 + 现成 8 值档位 + 具名证据指针，并写「本 Phase 自带判据小结」；未参与该 AC 判定的 Phase 不得为该条写 pass，下游不得替上游补签）／AC-005（要求「按 AC 身份与归属映射逐条核四件事」并明文「计数相等不能判通过」）。行为强度逐条保全：AC-005 的「逐条」与「不得用聚合计数」、FR-CLOSURE-001 的两条否定（不得写 pass、不得补签）。
- **Inputs**: `spec.md` 的 `Appendix A` 三条 AC 正文（判定方式／时点／owner／条件／信号，唯一权威）；`decision-log.md` 的 M3 收敛段；任务库 `quality/evidence/decision-log-refs/module-design/M3M7.md` 的「2. M3 方案」与「5. 判据标注机制」；两份目标文件的当前字节。G-2 文档无新行为：本 Task 只写方法文本，无新增运行行为；既有可读来源为这两份文件本身与上述材料。
- **Files / symbols**: `workflows/build-code/SKILL.md`；`workflows/verify-code/SKILL.md`；symbol: 两份方法文本的 Phase 收口步骤与「Done」契约头写法段；无函数、无导出符号，N/A — 非代码方法文本。
- **Action**: 先在 `workflows/build-code/SKILL.md` 的 Phase 收口与三审查点段落写明：Phase 契约头 `Done` 逐条承接 AC（AC 编号 + 现成 8 值档位词表 + 具名证据指针），并写「本 Phase 自带判据小结」（自己验了什么／没验什么／未验项所需条件 + 具名 owner）；再写明 AC 的判定归属由 spec 的 AC 正文决定（判定方式 + 时点 + 执行 owner + 所需条件 + 成功失败信号），不由依赖链位置决定；再写明两条禁止：未参与该 AC 判定的 Phase 不得为该条写 pass，下游不得替上游补签。然后在 `workflows/verify-code/SKILL.md` 的覆盖语义段落写明同一条归属口径与同两条禁止，并写明终末复核按 spec 的判定方式标记决定每条 AC 记 unknown／unavailable 还是可直接判。只改用词与义务表述，不新增字段、步骤、门禁或词表；不新增运行行为，不修改执行逻辑。
- **Outputs / failure**: 两份方法文本各出现同一套完成判据写法；失败信号是本 Task 的 RED 命令断言不成立，及目标文件里出现新建词表、新建字段或新建步骤。可观察结果是未参与实施的人能按「AC 编号 → 档位 → 具名证据指针」读出一份方法文本的要求。
- **Boundary / DO NOT TOUCH**: 禁改 `skills/spec-plan/templates/phase-template.md`、`spec.md`、`phases/index.md`、`GLOSSARY.md`、`docs/standard-workflow.md`（后者归 T008／T009）、`runtime/evidence/acceptance-evidence-validator.mjs` 与 `runtime/` 下任何模块。理由：这些是别的 Phase／别的 owner 的写集或既有唯一词表来源，改它们会同时制造写集冲突与重复控制面。
- **Dependency**: none
- **Test tier / skill**: simple / backend-testing；面声明见 Phase「测试策略」的方法文本面，本 Task 取方法文本面的两份 SKILL 分片，不涉及运行时、浏览器、数据库与网络面。执行器：本地 Node/Vitest 命令；语义：独立人读。
- **Scenario / fixture or service**: G-2 文档无新行为；正例是改动后读两份方法文本并命中本 Task 声明的口径句；反向用例是读改动前的同一字节（口径句缺失，命令非零），以及删掉任一口径句后命令重新变为非零。fixture 就是工作树里的两份文件本身，无需搭建与清理。
- **RED/GREEN gate_cmd**: `node --input-type=module -e "import { strict as assert } from 'node:assert'; import { readFileSync as r } from 'node:fs'; const need=['Done','逐条承接','本 Phase 自带判据小结','具名证据指针','判定归属由','不得为该条写','不得替上游补签']; for (const p of ['workflows/build-code/SKILL.md','workflows/verify-code/SKILL.md']) { const s=r(p,'utf8'); for (const n of need) assert.ok(s.includes(n),'ORACLE-P3-CLOSURE '+p+' missing '+n); } console.log('P3-T007-GREEN')"`
- **expected_exit**: 客观检查预期0（改动后读两份方法文本、口径句齐备）；不执行RED；替代未执行，结构接纳不等于 GREEN 或阶段完成。
- **RED target failure**: ORACLE-P3-CLOSURE 断言：两份方法文本各含完成判据写法（`Done` 逐条承接、8 值档位、具名证据指针、本 Phase 自带判据小结、判定归属由 spec AC 正文决定、不得写 pass、不得补签）；改动前读同一字节时该类断言不成立，`Done` 档位承接要求保持可见为未写入。
- **RED 证据**: N/A — 理由：本 Task 是**纯文档改动**，只改 Markdown 方法文本，无新增运行行为；风险为执行者误把「`Done` 里写了 AC 编号」当作该 AC 已判并把未验项当成已完成。客观替代为既有方法文本读取用例重放与独立逐步文档审查：读两份文件真实字节，断言口径句齐备、锁定句仍在，判定未验项保持可见且不写 pass。
- **GREEN oracle**: ORACLE-P3-CLOSURE 两份方法文本齐备上述口径句、8 值档位词表仍只引用既有来源、未验项保持可见；原失败保持可见。
- **Evidence**: `quality/evidence/design-execution-efficiency-20261014/P3-t007-red.txt` 与 `P3-t007-green.txt`（计划路径；实际引用由执行者保存，且替代未执行不能当 GREEN）。
- **STOP / recovery**: 口径句写不进既有段落、或落笔需要新增字段／步骤／词表时停下，在 Phase 材料写明缺哪条确认并交上游 owner；保原失败，禁止改 oracle 求绿。
- **Coverage limit**: 只证明两份方法文本里出现了这些口径句；不证明任何 AC 已达成、不证明执行者会照做、不证明 `phase-template.md` 的判据面（归 P2／P6／P7），结构接纳不等于 GREEN。
- **Done**: AC-005 与 AC-006 的**方法文本条件**由本 Task 提供，判定本身不由此达到 — 两条的首次结论分别在 build-plan 收口与 P3 收口的受控场景，档位见 Phase「完成」小节；未参与实施的人可用本卡 RED/GREEN 命令重放本 Task 的判据。

### T008 — 承接 AC 未达成时的「带欠账完成」形态与禁止 pass

- **Source / FR / AC**: R-009（「phase 完成即无遗漏」的全称要求）／D-017（用户裁决：允许「带欠账完成」，必须在 Phase 契约头显著位置标出并逐条列未达成项 + 所需条件 + 具名 owner；永远不得写成 pass，该「永远」是禁止式）／FR-CLOSURE-002（只定义完成形态与标注义务；不新增机器字段，不阻断收口）／AC-006（判定方式「只能人读」，失败条件明文含「出现无标注的 completed 或写成 pass」）。行为强度保全：AC-006 的「永不写成 pass」是否定式，必须逐条可核而非只标注。
- **Inputs**: `decision-log.md` 的 M3 收敛段 D-017 原文；任务库 `quality/evidence/decision-log-refs/module-design/M3M7.md` 的「2.3 本 phase 完成后不留欠账给后面」与「8. 后果与风险」第 1 条；`docs/standard-workflow.md` 第 11、21、25 行（生成时刻导航提示，漂移不判卡失效）的当前字节；`tests/acceptance/card-03-current.mjs` 的锚点表实读。G-2 文档无新行为：本 Task 只同步既有执行纪律段落的措辞，无新增运行行为。
- **Files / symbols**: `docs/standard-workflow.md`；symbol: 「build-code 测试与质量」段与「stage 结束」段的既有完成口径句；无函数、无导出符号，N/A — 非代码执行纪律文本。
- **Action**: 在 `docs/standard-workflow.md` 的既有完成口径段落里同步三件事：允许「带欠账完成」，但必须在 Phase 契约头显著位置标注；逐条列出未达成项、所需条件与具名 owner；永不写成 pass。同时写明它不是新状态、不是新字段、不阻断同任务修复与后续安全部分，并写明未达成项按 spec 的 AC 判定方式标记记 unavailable 或 incomplete。只做与 M3 相关的口径同步，不缩写该文件既有段落语义，**不改第 21 行既有整句**，不新增章节类型或机器字段。
- **Outputs / failure**: 该文件出现上述三件事的具名口径；失败信号是本 Task 的 RED 命令断言不成立，或第 21 行既有整句被改动（由 Phase 级 `gate_cmd` 所在段落与本文件锁定句共同暴露）。
- **Boundary / DO NOT TOUCH**: 禁改 `workflows/build-code/SKILL.md` 与 `workflows/verify-code/SKILL.md`（归 T007）、`spec.md`、`phases/index.md`、`GLOSSARY.md`（含既有「带欠账完成」术语，本 Task 只引用不重定义）、`runtime/` 下任何模块。理由：同一路径在本 Phase 内只能有一个持笔者，且术语定义已有唯一权威。
- **Dependency**: T007
- **Test tier / skill**: simple / backend-testing；面声明见 Phase「测试策略」的方法文本面，本 Task 取该面的 `docs/standard-workflow.md` 分片。执行器：本地 Node/Vitest 命令；语义：独立人读。
- **Scenario / fixture or service**: G-2 文档无新行为；正例是改动后读该文件并命中「带欠账完成」口径句且锁定句仍在；反向用例是改动前读同一字节（口径句缺失，命令非零），以及把「永不写成 pass」删掉后命令重新变为非零。fixture 是该文件本身，无需搭建与清理。
- **RED/GREEN gate_cmd**: `node --input-type=module -e "import { strict as assert } from 'node:assert'; import { readFileSync as r } from 'node:fs'; const s=r('docs/standard-workflow.md','utf8'); for (const n of ['带欠账完成','未达成项','具名 owner','永不写成 pass']) assert.ok(s.includes(n),'ORACLE-P3-CLOSURE docs/standard-workflow.md missing '+n); const L=s.split(/\r?\n/); assert.ok(L[20].includes('**完成声明的上限 = 独立来源的结论**；该结论为 adverse 或 unavailable 时，只能声明到该结论允许的程度'),'ORACLE-P3-CLOSURE locked sentence moved'); assert.equal(L.filter((l)=>l.includes('完成声明的上限')).length,1,'ORACLE-P3-CLOSURE locked sentence duplicated'); console.log('P3-T008-GREEN')"`
- **expected_exit**: 客观检查预期0（改动后读该文件、带欠账口径句齐备且锁定句唯一）；不执行RED；替代未执行，结构接纳不等于 GREEN 或阶段完成。
- **RED target failure**: ORACLE-P3-CLOSURE 断言：`docs/standard-workflow.md` 含「带欠账完成」的显著标注义务、未达成项逐条、所需条件、具名 owner 与「永不写成 pass」，且第 21 行锁定句仍在、只出现一次；改动前读同一字节时该类断言不成立，「永不写成 pass」的禁止要求保持可见为未写入。
- **RED 证据**: N/A — 理由：本 Task 是**纯文档改动**，只同步 Markdown 执行纪律文本，无新增运行行为；风险为审查者误把「本 Phase 完成」的标注当作该 Phase 承接 AC 已达成并把欠账读成通过。客观替代为既有执行纪律文本读取用例重放与独立逐步文档审查：读该文件真实字节，断言带欠账口径句齐备、锁定句唯一，判定未达成项逐条可见且不写 pass。
- **GREEN oracle**: ORACLE-P3-CLOSURE `docs/standard-workflow.md` 齐备带欠账口径句、第 21 行锁定句原样且唯一；原失败保持可见。
- **Evidence**: `quality/evidence/design-execution-efficiency-20261014/P3-t008-red.txt` 与 `P3-t008-green.txt`（计划路径；实际引用由执行者保存，且替代未执行不能当 GREEN）。
- **STOP / recovery**: 该口径写不进既有段落、或落笔会改动第 21 行锁定句时停下，在 Phase 材料写明缺哪条确认并交上游 owner；保原失败，禁止改 oracle 求绿。
- **Coverage limit**: 只证明该执行纪律文本里出现了这些口径句且锁定句未被改动；不证明受控场景已构造、不证明执行者不会误读、不证明 GLOSSARY 的术语正文（已有唯一权威落盘），结构接纳不等于 GREEN。
- **Done**: AC-006 的**方法文本条件**由本 Task 提供；AC-006 的受控场景核对不由此达到，档位与 owner 见 Phase「完成」小节；未参与实施的人可用本卡 RED/GREEN 命令重放本 Task 的判据。

### T009 — 末 Phase 角色（只复核、不作首次结论点）与每 Phase 自带提交

- **Source / FR / AC**: R-009（「每个 phase 必须有独立的开发、测试、审查、提交」——顺序强度：独立审查在提交之前）／D-018（用户裁决：末 Phase 保留完整端到端串演，但不得成为任何 AC 的首次结论产生点，首次结论仍归各承接 Phase）／FR-CLOSURE-003（每 Phase 自带开发、测试、独立审查与提交；末 Phase 保留端到端串演而不作首次结论点）／AC-015（判定方式「机器可判」，成功条件含「提交在审查之后、该 Phase 收口时完成」，失败条件含「把提交推迟到末端」）。行为强度保全：AC-015 的「之后」是顺序约束，「推迟到末端」是禁止式。
- **Inputs**: `spec.md` 的 AC-015 正文与 `Appendix A` 末段的判定方式归结；`decision-log.md` 的 M3 收敛段 D-018；`docs/standard-workflow.md` 第 11 行（生成时刻导航提示）的既有提交口径；`workflows/verify-code/SKILL.md` 第 44 行（生成时刻导航提示）的既有三必留审查点句；T007 与 T008 已落的措辞。G-2 文档无新行为：本 Task 只在既有段落同步角色与提交时点，无新增运行行为。
- **Files / symbols**: `docs/standard-workflow.md`；symbol: 「build-code 测试与质量」段的末 Phase 角色句与每 Phase 提交时点句；无函数、无导出符号，N/A — 非代码执行纪律文本。
- **Action**: 在该文件的既有提交口径段落写明两件事：末 Phase 保留完整端到端串演，但不得成为任何 AC 的首次结论产生点，首次结论归属各承接 Phase；每个 Phase 自带开发、测试、独立审查与提交，且提交在该 Phase 独立审查之后、该 Phase 收口时完成，依据是该文件第 11 行既有口径，不新造授权来源。同时写明这条不新增审查点、不新增 stage、不改既有授权来源。只做与 M3 相关的口径同步，不缩写既有段落语义，不改第 21 行既有整句。
- **Outputs / failure**: 该文件出现「末 Phase 不作首次结论点」与「提交在独立审查之后、该 Phase 收口时完成」两句具名口径；失败信号是本 Task 的 RED 命令断言不成立，或出现「限制审查并发／限制轮次／按时长停止审查」类措辞。
- **Boundary / DO NOT TOUCH**: 禁改 `workflows/build-code/SKILL.md` 与 `workflows/verify-code/SKILL.md`（归 T007）、`spec.md`、`phases/index.md`、`GLOSSARY.md`、`runtime/` 下任何模块；禁改 `docs/standard-workflow.md` 第 21 行既有整句。理由：同一路径在本 Phase 内只能有一个持笔者，锁定句是既有机器锚点。
- **Dependency**: T007、T008
- **Test tier / skill**: simple / backend-testing；面声明见 Phase「测试策略」的方法文本面，本 Task 取该面的末 Phase 角色与提交时点分片。执行器：本地 Node/Vitest 命令；语义：独立人读。
- **Scenario / fixture or service**: G-2 文档无新行为；正例是改动后读该文件并命中末 Phase 角色句、提交时点句与既有提交口径句；反向用例是改动前读同一字节（角色句与提交时点句缺失，命令非零），以及把「不得成为任何 AC 的首次结论产生点」删掉后命令重新变为非零。fixture 是该文件本身，无需搭建与清理。
- **RED/GREEN gate_cmd**: `node --input-type=module -e "import { strict as assert } from 'node:assert'; import { readFileSync as r } from 'node:fs'; const s=r('docs/standard-workflow.md','utf8'); for (const n of ['不得成为任何 AC 的首次结论产生点','提交在该 Phase 独立审查之后','该 Phase 收口时完成']) assert.ok(s.includes(n),'ORACLE-P3-CLOSURE docs/standard-workflow.md missing '+n); const L=s.split(/\r?\n/); assert.ok(L[10].includes('一个 Phase 的实施、针对性测试、独立审查与 finding 修复全部完成后，在本 Phase 提交一次，审查在提交前进行'),'ORACLE-P3-CLOSURE submission anchor moved'); console.log('P3-T009-GREEN')"`
- **expected_exit**: 客观检查预期0（改动后读该文件、末 Phase 角色与提交时点句齐备且既有提交口径句仍在）；不执行RED；替代未执行，结构接纳不等于 GREEN 或阶段完成。
- **RED target failure**: ORACLE-P3-CLOSURE 断言：`docs/standard-workflow.md` 含「末 Phase 不得成为任何 AC 的首次结论产生点」与「提交在该 Phase 独立审查之后、该 Phase 收口时完成」，且既有提交口径句仍在；改动前读同一字节时该类断言不成立，末 Phase 角色约束保持可见为未写入。
- **RED 证据**: N/A — 理由：本 Task 是**纯文档改动**，只在既有段落同步角色与提交时点，无新增运行行为；风险为执行者误把末 Phase 的端到端串演当成 AC 的首次结论来源并把结论押回末端。客观替代为既有执行纪律文本读取用例重放与独立逐步文档审查：读该文件真实字节，断言末 Phase 角色句与提交时点句齐备、既有提交口径句仍在，判定首次结论归属保持可见在各承接 Phase。
- **GREEN oracle**: ORACLE-P3-CLOSURE `docs/standard-workflow.md` 齐备末 Phase 角色句与提交时点句、既有提交口径句原样；原失败保持可见。
- **Evidence**: `quality/evidence/design-execution-efficiency-20261014/P3-t009-red.txt` 与 `P3-t009-green.txt`（计划路径；实际引用由执行者保存，且替代未执行不能当 GREEN）。
- **STOP / recovery**: 角色句或提交时点句写不进既有段落、或落笔需要新增审查点／stage／授权来源时停下，在 Phase 材料写明缺哪条确认并交上游 owner；保原失败，禁止改 oracle 求绿。
- **Coverage limit**: 只证明该执行纪律文本里出现了这两句口径且既有提交口径句未被改动；不证明任何 Phase 真的提交了、不证明提交内容等于声明写集、不证明末 Phase 的实际执行事实（首次结论点与提交事实仍以 `git log`／`git show --stat` 与各 Phase 卡为准），结构接纳不等于 GREEN。
- **Done**: AC-015 的**方法文本条件**由本 Task 提供；AC-015 的真实提交事实不由此达到，档位与 owner 见 Phase「完成」小节；未参与实施的人可用本卡 RED/GREEN 命令重放本 Task 的判据。

## L2 — 可删除参考

- 本 Phase 的三条 Task 级命令是同一 oracle 的分片，删掉 L2 不改变 L0／L1 的任何义务。
- 写作时实际执行的只读命令与输出摘要（`node --input-type=module -e` 读三份文件、`grep`／`sed` 定位锚点、`git status --porcelain`）只供核对，不构成本 Phase 的执行事实；执行事实由 build-code 写在任务事实库。
- 参考 [mattpocock/skills](https://github.com/mattpocock/skills) 固定 commit `b0618bc436ad893b3c5e84e55fba86586d34a404` 的写作惯例只作方法背景，不作本 Phase 的判据。

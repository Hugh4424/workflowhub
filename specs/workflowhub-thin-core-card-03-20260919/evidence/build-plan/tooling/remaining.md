# CARD-03 build-plan：剩余工作清单（只读调查，2026-09-29）

Worktree `/Users/Hugh/Hugh/Project/workflowhub-workflowhub-thin-core-card-03-20260919`，分支 `task/workflowhub/workflowhub-thin-core-card-03-20260919`，HEAD `593571e4`。
DL = `specs/workflowhub-thin-core-card-03-20260919/decision-log.md`，DS = 同目录 `design.md`，PRD = `specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md`。
「已落」的证据只来自 grep / `git diff 6848760d..HEAD`（合并基点），没有跑测试。

## 0. 先看结论

1. **不少被登记为「已落」的方法文本，在仓库里其实查不到。** 对 `workflows/**`、`skills/**`、`AGENTS.md`、`docs/standard-workflow.md` grep `G-1`，0 命中。`skills/spec-plan/templates/phase-template.md` 里 grep `接口符号`、`合并责任`、`progress_cursor`，各 0 命中。`AGENTS.md` 里 grep `继承|轮询`，0 命中。五个 stage SKILL 里没有「按工作类型派子代理」的方法章节。已落的只有：ADR `docs/adr/0034-subagent-dispatch-and-parallel-rules.md`（149 行，含 SD-11 五件套与 G-1 的描述）、`CONTEXT.md:455-461` 子代理术语、`AGENTS.md:14-17` 三条通用委派规则、写集绑定句（`docs/standard-workflow.md:334-338`、`workflows/build-code/steps.json:15`），以及 E1–E16、M1–M5、审查面 16 条、模板中文化。这和 DL §12.6 :595「行 52 已设计、未实施」、DS :3304「43–52 行，已设计未实施 3 处」对得上：五阶段 SKILL 的方法条款（OI-001/004/005/011）状态是「错开实施」，**是 build-code 的主体工作**。
2. **CARD-04 已合入。** 合并提交是 `40421a46`（2026-09-29 15:18，在 main 上），已经通过 `97092b30` 并入本分支（合并基点 `6848760d`）。origin/main 比 HEAD 多 4 个与本卡无关的文档提交：`94000a65`、`b3cea456`、`332fe59b`、`56c8f267`。所以凡是写着「等 CARD-04 合并后」的项，**时点都已满足**。
3. **CARD-05 已完成并归档。** 合并提交 `24a4a751`（2026-09-26），归档提交 `ef920f1f`，两者都在 HEAD 和 origin/main 中；材料在 `specs/archive/workflowhub-thin-core-card-05-20260919/`（P1–P5）。
4. **不需要用户拍板就能开始 build-plan。** §五的三件事已结案（DL:394-400）。§18.5 两条和 §17.5 #4 属于「是否需要机器读数」，都可以按「不加」处理。G 节里标「需选路线」的项，需要用户在 build-plan 的 talk 中选一次。

## A. 需求基线

### PRD 原文（PRD:299-309，逐字）

- FR-11：五个阶段各自按工作类型派发子代理,实施/测试/审查上下文相互独立。
- FR-12：由审查或测试产生的修复回到原实施子代理,在连续上下文中完成。
- FR-13：主会话不承担大量阅读或编辑,只做派发、回收与交互类技能执行。
- FR-14：每个多工作包任务在计划阶段产出并行方案,含接口蓝图、依赖调度、并发数(2–5 以内)、worktree 隔离安排;每个并行工作包声明读集、写集、文件 owner、接口符号清单、合并责任,作为事实记录供验收核对;未声明或声明不实=验收失败事实,不阻断派发(SD-11 并行声明制,2026-09-19 第二轮按 OI-012 降级)。
- FR-15：接口必须变更时执行 G-1 收场:停并行、主会话重排、记录作废批次,无静默不一致。
- AC-11(对应 FR-11/FR-12)：条件=实跑一个多工作包实施 task;行为=观察派发记录;度量=实施/测试/审查子代理各有独立上下文证据(会话/上下文标识互不相同),且至少一次修复由原实施子代理承接。失败场景=审查与实施混在同一上下文,或修复换了上下文,即失败。
- AC-12(对应 FR-13)：条件=同一实跑;行为=核对主会话动作;度量=主会话无大量读写事实(派发/回收/交互类之外的批量读写记录为 0)。失败场景=主会话自行完成大段实现或阅读,即失败。
- AC-13(对应 FR-14)：条件=检查该 task 计划产物;行为=核对并行方案;度量=方案含接口蓝图、依赖调度、并发数且并发数 ≤5 且 ≥2(若并行),每个并行工作包的读集/写集/文件 owner/接口符号清单/合并责任声明齐备,并被执行遵守。失败场景=并行方案或工作包声明缺失、实跑并发超上限,或实跑读写越出声明集(…原文此处截断)
- AC-14(对应 FR-15)：条件=演练或实遇一次接口必须变更;行为=按 G-1 处置;度量=有停并行与重排记录,作废批次被显式登记,后续结果无静默不一致。失败场景=变更后并行继续且产生写集冲突或静默覆盖,即失败。
- AC-15(对应 FR-11)：条件=对五个阶段逐一核对;行为=确认同一工作方法适用;度量=五阶段均有按工作类型派发的实例或明确不适用理由。失败场景=任一阶段回到主会话全程自干且无理由记录,即失败。
- oracle（PRD:310）：一个多工作包实施 task 实跑,留派发/回收与独立上下文证据;主会话无大量读写;并发上限被遵守;G-1 场景演练记录存在;不承诺提速比例(并行收益实测留后续)。可后置技术项（PRD:318）：并行收益实测留后续；具体调度数据结构留本卡 build-plan。

### R 表（DL:96-117）

DL §12.7 :603-628 把 20 条统一改登记为 **deferred → 后续实施卡 build-code/verify-code**。用户最新指示是全部回到本卡；下表的承载列是本调查的建议。

| R | 来源 | OI | 原处置 | 建议承载 |
|---|---|---|---|---|
| R-001 | PRD:299 FR-11 | OI-001 | covered | build-code（五 SKILL 方法章节）＋ verify（AC-15） |
| R-002 | :300 FR-12 | OI-002 | covered | build-code 文本 ＋ verify（AC-11 后半） |
| R-003 | :301 FR-13 | OI-003 | covered | 已有 AGENTS.md:14-15；AC-12 做人工判读，属 verify |
| R-004 | :302 FR-14 | OI-004 | covered | build-code（phase-template 五件套字段 ＋ build-plan SKILL） |
| R-005 | :303 FR-15 | OI-005 | covered，技能文本落地推迟 | build-code（build-plan/build-code SKILL 的 G-1 段）——**未落** |
| R-006 | :305 AC-11 | OI-007 | deferred | 本卡 build-code 实跑，verify 判定 |
| R-007 | :306 AC-12 | OI-003 | covered | verify（人工判读一次动作清单） |
| R-008 | :307 AC-13 | OI-004 | covered，真实核对推迟 | build-plan 自己产出并行方案；verify 核对 |
| R-009 | :308 AC-14 | OI-005 | covered（演练） | 已有演练记录 DL §八 :443-459；verify 复核 |
| R-010 | :309 AC-15 | OI-006 | covered | build-code（build-spec 不适用理由已落 `workflows/build-spec/SKILL.md:51`） ＋ verify |
| R-011 | :295,:297 | OI-001/004 | covered | 同 R-001/R-004 |
| R-012 | :310,:311-315 | OI-007/008 | deferred | verify（oracle 实跑）；提速实测是非目标 |
| R-013 | PRD:70 SD-11 | OI-004 | covered | 同 R-004 |
| R-014 | PRD:94 SD-17 | OI-004/008/010 | covered | 写集绑定：声明层已落；runtime 层见 T-018 |
| R-015 | 母 DL:417-437 OI-012 | OI-004/010 | covered | 同 R-004/R-014 |
| R-016 | 母 DL:212-233 OI-002 | OI-001/002/003 | covered | 同 R-001–R-003 |
| R-017 | 母 DL:52 U-001#4 | OI-001/003 | covered | 同上 |
| R-018 | 母 DL:105 U-009#1 | OI-001 | covered | 同上 |
| R-019 | 母 DL:113 U-010#1 | OI-004/010 | covered | 同上 |
| R-020 | PRD:109,:144,:150,:155 | OI-001/008 | covered | 同上 |

## B. OI-001…OI-011（DL:170-330）

| OI | 选定处置（摘要） | 验收 / 反例 | 是否已落（证据） |
|---|---|---|---|
| OI-001 (:178) | 五阶段的落点＝各 SKILL 方法章节加计划期产物；build-prd 记不适用；AGENTS.md 委派纪律是唯一权威，五个 SKILL 各引用一次 | AC-15 / 反例：主会话全程自干且无理由；或只在本文件声称 | **部分已落**：`AGENTS.md:14-17` 有；五 SKILL 无引用（grep `子代理` 在 make-decision/build-plan/verify-code/build-spec SKILL 为 0）；build-spec 不适用理由在 :51 |
| OI-002 (:192) | 修复回到原子代理的同一会话（允许中途压缩），派发时附审查或测试发现原文 | AC-11 后半 / 反例：修复换新会话或未附原文 | **只落了术语** `CONTEXT.md:460`；build-code SKILL 无对应方法句（grep `连续上下文` 为 0） |
| OI-003 (:206) | 事后人工判读一次；阶段豁免表加阈值（DL:354-361：保留原文>500 字、目录级批量扫描、单步≥3 文件） | AC-12 / 反例：无清单 | 规则只在 DL；属 verify-only |
| OI-004 (:220) | 事实记录形态、接口符号清单、广播、worktree 配套清单、起手 3–5、合并责任＝产出方；载体是 phase-template；并发区间写进共用纪律 | AC-13 / 反例：缺声明、做成门、回滚、主会话代提交 | **未落**：phase-template 只有「写入集」（:27、:120），没有读集/owner/接口符号/合并责任/并发字段；ADR:34、:75-76 有描述 |
| OI-005 (:234) | build-plan SKILL 写产出，build-code SKILL 写收场，两边交叉引用 | AC-14 / 反例：只写一处 | **未落**（全仓技能 grep `G-1` 为 0）；只有演练记录 DL §八 |
| OI-006 (:248) | build-prd 记不适用理由；方法章节改到位 | AC-15 | 映射为 build-spec（DL:86-88），`workflows/build-spec/SKILL.md` +19 行，已落 |
| OI-007 (:262) | 不另起样例 task，以 card-03 自身执行为主证据，加演练；独立审查判定，写当前 stage 行 `finding_dispositions` | 反例：自审自判 | 属执行证据，**只能在 build-code/verify-code 产生** |
| OI-008 (:276) | 时间错开；build-plan 晚于 CARD-04 合并 | 已被 §十四（build-plan 先行）和「现在全落」取代 | 时点已满足（`40421a46` ⊆ HEAD） |
| OI-009 (:290) | 进度权威＝facts.jsonl `phase_progress`；phase 文件只放 `progress_cursor` 指针 | 反例：出现第二处状态值 | `tools/cli/stage-runtime.mjs` 有 16 处 `phase_progress`、1 处 `progress_cursor`；phase-template 无 `progress_cursor`。T-032 的 7 项参数化与 B1–B6 是否完成：**未知**（需要逐项核对） |
| OI-010 (:304) | 删跨 phase 全量快照绑定，只留该 phase 写集 | inventory :64/:65、测试 :164-165、e2e :499 | 声明层**已落**：`docs/standard-workflow.md:334-338`、`steps.json:15`；runtime 层见 T-018 |
| OI-011 (:318) | AGENTS.md 三条执行卫生加委派纪律，五 SKILL 各引用一次，四阶段子代理产出契约；三条可观察（禁全量继承、禁空转轮询、声明不实的发现路径）；F-9 | 反例：条款写不成可观察形态 | **部分已落**：`AGENTS.md:14-17` 是通用表述，没有「禁继承全部对话」「禁空转轮询」「声明不实路径」三条可观察句；四阶段产出契约是否齐备：**未知**；F-9 `workflows/make-decision/SKILL.md:345-346` 仍指「decision-log 的 Step×Executor 矩阵」（悬空权威） |

## C. 明确推迟到 build-plan/build-code 的项

| 项 | 锚点 | 目标文件 | 已落？ | 承载 |
|---|---|---|---|---|
| T-018 runtime 快照绑定 | DL:62、:880；DS:1397-1405、:2020 | 冻结候选清单逐字：`runtime/evidence/quality-fact.mjs:48`；`runtime/evidence/canonical-evidence-validators.mjs:251`、`:322-328`、`:397-399`、`:433`；`runtime/evidence/research-report.mjs:22`；`runtime/evidence/freshness.mjs`（import `ensureGitSnapshotObjectStore`/`materialRevisionFromValues`）；`runtime/stage/stage-runner.mjs`；`tools/cli/stage-runtime.mjs`（仅 H-1）。语义＝删掉跨 phase 的全量快照绑定，只留该 phase 声明的写集。**接口变化与删除责任方原文写的是「待 CARD-04 合并后随 build-plan 定」，即至今未定，需要 build-plan 定** | 否（合并基点以来这些文件 0 diff） | build-code（本卡最大的 runtime phase）；行号须在 build-plan 按现 HEAD 复核 |
| T-017 推迟的验收载体 | DL:879 | 各 AC 的真实载体 | 否 | verify-code |
| T-023 术语并存 | DL:436、:884；`CONTEXT.md:258-262`（「阶段协调 / Phase 执行」「阶段协调者交给 Phase 执行者」） vs `:461`「两套词不并存」 | `CONTEXT.md:258-262` | 否 | build-code（小，文字级） |
| F-9① | DL:434 | `workflows/make-decision/SKILL.md:345-346`，改为指向本文件的 :336-360 表与规则 | 否 | build-code（小） |
| §17 :690 / §18「实际生效路径由 build-plan 复核」 | DL:690 | M1–M5、E1–E16 的落点（§17.1–18.1 所列行号） | 文字已落（`8b452fc0`、`128aae99`） | build-plan 做一次读回核对，属 verification-only |
| G-1 / AC-14 | DL §八 :443-459 | — | 演练记录已有 | verify-only；若 build-code 实遇接口变更，按真实记录补 |
| AC-11 至少一次修复由原实施子代理承接 | PRD:305 | build-code 派发记录 | 否（需要实跑） | build-code 执行时产生，verify 判定 |
| AC-12 / AC-13 人工判读 | OI-003 / OI-004 | 主会话动作清单；本卡 spec/phase 的并行方案 | 否 | verify-code（独立上下文） |
| DS §14.17 审查编排措施 1–5 | DL:630-638、:650「须在计划中为其保留任务位」；DS:3374-3417 | 见 G 节 | 否 | 见 G 节 |
| 行 44 末句、行 47 第三句、行 52 | DS:3304 | `skills/spec-plan/SKILL.md`；`docs/standard-workflow.md`（复用句）；build-code/build-plan SKILL 共 6 条方法条款 | 否 | build-code |
| T-027 inventory 同步 | DL:71 | `docs/stage-atomic-step-inventory.md:13-26`、`:42-54`；`tests/p0-foundation-contracts.test.mjs:55` | 否（0 diff） | build-code（小） |
| T-029 根目录进度文件归档 | DL:73 | `git mv` 到 `docs/archive/retired-root-progress/`（目录不存在；根目录仍有 `HANDOFF-*.md`、`findings.md` 等）＋ AGENTS.md 一条 | 否 | build-code（小；属搬移，需确认清单） |
| T-030 | DL:74 | `workflows/build-plan/SKILL.md:209-215` 的字段枚举改为指向模板 | **未知**（该段现为英文步骤说明，需逐字比对） | build-plan 核对 |
| T-031 4 条既有红 | DL:75 | `tests/contract/build-code-apply-contract.test.mjs:15`/`:31`/`:57`、`tests/contract/review-step-forward-progress.test.mjs:97` | 否（2026-09-29 更正：未修，原记为转后续卡） | 按新指示回到本卡：build-code |
| T-028 Acceptance 内联引用 | DL:72 | spec-template、`skills/spec-plan/SKILL.md:14`、index-template | **未知** | build-plan 核对 |

## D. 原非目标（按新指示重新分类）

- 在 PRD 层面仍是非目标，本卡不做：审查工具选型（CARD-05，已完成）、验收机制细节（CARD-04，已合）、CARD-01 拓扑、并行收益实测（PRD:310、:318）、CARD-10 集成验收。
- 原本指向 CARD-05/06/后续卡、现在需要逐项重判的，见 G 节。

## E. 待裁决事项是否阻塞

- §五 三件事（DL:386-400）：2026-09-28 已答，2026-09-29 结案。**不阻塞。**
- §18.5 (1) E1 缺机器下界、(2) E5/E16 缺机器消费点（DL:812-813）：默认「不加」与 SD-17「减门禁」一致。**不阻塞**；若用户想加，就是新机制。
- 真正需要用户选的只有 G 节里标「需选路线」的项。

## F. 既有红基线（DL §18.3；/tmp/pb-land/evidence/）

有效清单是 `baseline.txt.files`（33 个文件）：15 个失败文件、38 条失败测试（`baseline-failures.txt`），parent `0d7cf4f6` 与 HEAD 的失败集合相同。

- 33 个文件：tests/build-code-diff-only；tests/contract/{acceptance-result-machine-classes, build-code-apply-contract, card04-final-aggregate, census-upstream-authoring, filled-plan-task-production, four-material-non-gate-contract, freeze-classification-budget-usage-protocol, governance-review-dispatch-boundary, material-producer-consumer-roundtrip, phase-quality-handoff, plan-acceptance-task-gate, post-cohort-authoring-files, post-cohort-executable-authoring, post-cohort-governance-materials, post-cohort-spec-design-authority, post-phase-contract, review-materials-contract, session-binding-removed, spec-stage-artifact-closure, stage-interaction-batching, stage-reflection-e2e-constructed, stage-reflection-skill-contract, stage-routing-and-concrete-testing, stage-skill-consumer-contract, stage-skill-invocation-contract, tier-c-deletion-boundary, workflow-quality-regression}；tests/{decision-log-content-contract, requirements-completeness-audit-acceptance, skill-provenance-strict, step-manifest}；tests/integration/distribution-closure。
- 15 个失败文件（38 条）：build-code-apply-contract（3）、card04-final-aggregate（3）、freeze-classification-budget-usage-protocol（3）、governance-review-dispatch-boundary（1）、material-producer-consumer-roundtrip（1）、phase-quality-handoff（2）、post-phase-contract（4）、review-materials-contract（2）、stage-reflection-skill-contract（1）、stage-routing-and-concrete-testing（1）、tier-c-deletion-boundary（1）、workflow-quality-regression（1）、integration/distribution-closure（10）、requirements-completeness-audit-acceptance（3）、step-manifest（2）。
- 另有 `check:skill-closure` 3 条既有红（涉及 architect-code-review，build-code ×2、verify-code ×1），以及 phase-template.md:12 MD028、:14 MD032 两条 lint 错。
- 建议：build-plan 为「既有红」单开一行处置（修／登记不修），至少 T-031 那 4 条按新指示回到本卡。

## G. 指向 CARD-05 / CARD-06 / 后续卡的条目（按用户新指示逐条重判）

判定口径——「CARD-05 已完成、无需搬回」需同时满足三条：
(a) 该项的 runtime 触点在 CARD-05 的 phase 写集内（`specs/archive/workflowhub-thin-core-card-05-20260919/phases/index.md`）；
(b) CARD-05 在 `24a4a751`（2026-09-26）合入；
(c) 本卡记录该项的时间晚于或等于该合入，且本卡的现场实测仍显示缺陷存在。
满足 (a)(b)、不满足 (c)，说明 CARD-05 做过，但本卡后来实测仍有残留，**必须搬回**。

### G-a 属于 CARD-05 范围且 CARD-05 已做完、无需搬回

- **审查工具选型与 OCR 委托**：PRD:296 明写归 CARD-05；CARD-05 P1–P5 已交付（ADR-0032、`runtime/review/ocr-delegation-adapter.mjs`、stage-materials 等）。本卡 DL:123、:135 只作排除引用。**判据**：(a)(b) 满足，本卡没有后续实测指出其缺陷。
- **3rd-review broker 的健康轮询与取消**：CARD-05 P4 已做。本卡没有指向它的挂账。
- 除此之外，**找不到一条被本卡挂给 CARD-05、同时能证明已被 CARD-05 解决的项**。理由：本卡所有挂 CARD-05 的记录（DL:661-662；DS:2480、:2559、:2613、:2615、:3374-3375、:3383、:3411）都写于 2026-09-28/29，晚于 CARD-05 合入（09-26），而且是在含 CARD-05 的代码上实测得出的。所以它们都是「CARD-05 之后仍存在」的残留，按新指示都要回本卡（见 G-b）。

### G-b 需要在本卡完成的项

规模：S≈<30 行，M≈30–150 行，L＝跨模块。

| # | 原文锚点 | 要改的文件 | 可行性 | 规模 |
|---|---|---|---|---|
| G1 | DL:823-827 §十九（stage 行 provisional，「post Phase index is missing」） | `runtime/task/material-workspace.mjs:9`（`POST_BASE_MATERIAL_FILES`）、`:13`（`phaseFilesFromIndex`）＋调用方 | **需选路线**：①按 stage 区分材料集（make-decision 只要求 `decision-log.md`）；②index 缺失时返回空 phase 集而不抛错；③不改代码，因为 build-plan 一产出 spec.md 和 phases/index.md，后续 stage 行就会自然消失（推断，未验证），只补一条回归测试。铁律：不得伪造材料。冲突风险：`tests/contract/post-phase-contract.test.mjs`、`phase-quality-handoff.test.mjs` 本来就是红，需在 build-plan 读断言确认 | S–M |
| G2 | DL:751 §17.5#5；DS 同 | `runtime/review/schemas/ac-evidence-summary.schema.json:32-34`（result 5 值 / leaf_result 4 值 / status 6 值）vs `runtime/evidence/acceptance-evidence-validator.mjs:6`（冻结 8 值） | **需选路线**：①schema 向 8 值对齐；②校验器与 schema 各自保持，在文档登记映射；③按字段拆分（result 取 8 值，status 维持现状）。**冲突**：`tests/contract/acceptance-result-machine-classes.test.mjs:95-99` 冻结 8 值（改校验器会冲突；改 schema 不冲突，但要搜 schema 的消费者） | S（改 schema）/ M（加消费者） |
| G3 | DL:711 §17.2#5 | `workflows/build-code/diff-scanner.mjs:17`、`:190`（`C2_IRREVERSIBLE_GIT_RULES`，只有 CLI 在调用）；意图来源 `specs/archive/m8-build-code/tasks.md:348`「停等确认」 | **需选路线**：①只改文本口径（C2 命中＝写 finding，不阻断），与 M5 对齐；②把 scanner 接入 runtime 路径，这是新控制面，与 SD-17 和 card-04 的 B-08 冲突；③删 C2 死规则。冲突测试：`tests/build-code-diff-only.test.mjs`（在基线集内，当前为绿），需读断言 | S（①③）/ L（②） |
| G4 | DL:806 §18.4#2 | `skills/wh-review/stage-skill-plan.json`（build-code/verify-code 的 `required_skills`）vs runner 把 plan-eng-review 当必需（`skills/wh-review/scripts/review-materials.mjs:59`） | **与冻结测试冲突**：`tests/contract/stage-routing-and-concrete-testing.test.mjs:92-93` `toEqual(["review"])`。路线：①改 runner 侧，不再把 plan-eng-review 当必需；②改 plan 并同步改测试，需用户授权改冻结断言；另需重算 wh-review bundle 哈希 | S–M |
| G5 | DL:62/:880 T-018；DS:1397-1405 | 见 C 节冻结清单 | **可直接做**（时点已满足）；但接口变化与删除责任方未定，需 build-plan 写接口蓝图。冲突风险：`runtime/evidence/**` 的契约测试，以及 card-04 的 C-18 `validateAcceptanceEvidence` 调用链（`freshness.mjs:56`、`:710`），需在 build-plan 定测试清单 | L |
| G6 | DS:1405「残留的全量绑定登记给 CARD-06」；DL:37 | 同 G5 的外延（T-018 之外的 snapshot 绑定残留） | **需选路线**：①并入 G5 一起删；②只登记范围，不删。范围大小**未知**，需 build-plan 做一次 `snapshot` grep 普查 | 未知（可能 L） |
| G7 | DL:750 §17.5#4(a)；DS:3448 | 退役登记表（`skills/decision-log/templates/decision-log-template.md:314-327`） | **需选路线**：①不加机器读数（默认，符合 SD-17）；②加一个 reader。建议①，文字登记即可 | 0 / M |
| G8 | DL:750 §17.5#4(b)(c)；DS:3449 | M5 销毁性动作无机器拦截点 | 同 G7：①保持纪律条款（默认）；②加拦截，这是新控制面，冲突 B-08 | 0 / L |
| G9 | DL:812-813 §18.5 两条 | E1 机器下界；E5/E16 机器消费点 | 同 G7，默认①不加 | 0 |
| G10 | DL:661-662；DS:3374-3375 §14.17 措施①（`--async` / `--action=collect` 非阻塞派发） | `tools/cli/stage-runtime.mjs`、`runtime/review/review-record-route.mjs` | **与已冻结约束冲突**：card-04 B-08 禁止新 CLI 动词和 schema 字段（DL:662）。需用户在「放弃 / 用现有动词实现 / 豁免 B-08」三条里选 | M–L |
| G11 | DS:3383 措施②（派发前契约预检） | `runtime/review/review-record-route.mjs`（`recordSimpleReviewRequest`，约 :1410 起）＋ CLI | 可直接做（只加校验、不加字段时）；确认不命中 B-08 | M |
| G12 | DS:3389-3390 措施③（结果完整性 `result_invalid`，原挂 CARD-06） | `skills/wh-review/scripts/simple-review-runner.mjs` 输出处理 | **冲突 B-08**（`result_invalid` 是新 attempt 态）；路线：①用现有 unavailable 状态加原因字段；②新增状态值（需豁免） | M |
| G13 | DL:662 措施④（审查包只绑写集，命中 B-06） | `runtime/review/review-input-bounds.mjs` | **需选路线**（与 card-04 B-06 口径冲突）；可与 G5 同批 | M |
| G14 | DS:3403 措施⑤（发现分级消费） | `workflows/build-code/SKILL.md` phase close 段；`findings-minor.md` 附件 | 可直接做（纯文本） | S |
| G15 | DS:3411；DL:630-638 | `tools/cli/stage-runtime.mjs:2006` `allowedRunFields` 里残留的 `"review_budget"` | 可直接做；需确认 `tests/contract/review-budget-deletion.test.mjs:90`/`:92`/`:98` 期望（大概率允许删） | S |
| G16 | DL:1795（card-04 归档）D-03；DL:674；DS:2615 | `runtime/review/review-record-route.mjs` 三处叠加缺陷（card-04 记录 :1177/:1180/:1229/:1417，现 HEAD 行号已漂移，如 `allowHistoricalPartialCoverage` 在 :1305/:1792/:1898）＋ `importCanonicalReviewResult` 只导不建 | **可做，但属于审查链核心**；需 build-plan 先重读现行代码，确认缺陷在 CARD-05 之后是否仍在（本调查未验证）。冲突测试：CARD-05 P2 新增的 `tests/contract/review-material-change-redispatch.test.mjs` 等 | M–L |
| G17 | DS:2508、:2614 | `docs/quality/business-case-catalog.json` 的 `source.revision` 改稳定锚点 ＋ `runtime/evidence/canonical-evidence-validators.mjs` | 与 G5 同文件，建议并批。DS:2614 另记该 json 在本卡 worktree 的状态有更正，需 build-plan 核实 | M |
| G18 | DL:470-475、:510、:515；DS:1431-1450、:2552 | `skills/**` 逐文件 sha 链（catalog `local_bundle_hash`、skill-bundle `files[].sha256`、`runtime/schemas/skill-catalog.schema.json`、`runtime/adapters/local-skill-resolver.mjs`、`runtime/evidence/check-skill-closure.mjs`、`repo-skills.manifest.json`） | **需用户选**：用户原话 T-036「不应该有任何逐文件-sha存在」→ 全删；但 DS:1450 列为跨 schema、resolver、closure 检查、全部技能条目的删除面。①本卡全删；②只删 `files[].sha256`，保留聚合哈希；③维持（每次改技能都重算）。冲突测试：DS:1433 消费者地图 #2/#3/#4/#5/#8、`tests/skill-provenance-strict.test.mjs`、`check:skill-closure` | L |
| G19 | DS:2507-2508 I-14 稳定锚点（原挂 CARD-06/CARD-04） | 绑定轴从整文件 sha256 改为章节编号或 AC 编号 | 与 G17/G18 耦合；需选路线（并入 / 不做） | M–L |
| G20 | DL:506、:511 A5 I-13 复用 semantic 审查的 runtime 面 | `runtime/review/review-record-route.mjs`（同三元组已有 semantic 则不再派发） | 可做；方法条款已在 `workflows/build-code/SKILL.md:93-95`（行号待复核） | M |
| G21 | DL:75 T-031 | 4 条既有红（见 C 节） | 可直接做（在测试侧或源码侧修，需读断言） | S–M |
| G22 | DL:805 §18.4#1 | `skills/spec-plan/templates/plan-template.md`、`skills/spec-tasks/templates/tasks-template.md`（废弃遗留） | **需选**：删除是 CARD-06 的删除面，要重算哈希，可能碰 `filled-plan-task-production.test.mjs` 等。①删；②保留 | S–M |
| G23 | DL:808 §18.4#4 | `docs/architecture/repository-inventory.tsv` | **与冻结测试冲突**：`tests/contract/repository-inventory.test.mjs:31` 要求与 `git show HEAD:` 逐字节相同，属设计如此。建议不动 | 0 |
| G24 | DL:466、:465 | `tests/contract/material-producer-consumer-roundtrip.test.mjs:15` 既有红；check-skill-closure 3 红（`runtime/evidence/check-skill-closure.mjs:703-704`） | 可做；并入 F 节既有红处置 | S–M |

## 汇总：剩余工作 → 承载

| 剩余工作 | 锚点 | 目标文件 | 已落？ | 承载 |
|---|---|---|---|---|
| 五 SKILL 方法章节（按工作类型派发、引用 AGENTS、产出契约） | OI-001/011；DS:3304 行 52 | `workflows/{make-decision,build-spec,build-plan,build-code,verify-code}/SKILL.md` | 否 | build-code P-A |
| SD-11 五件套字段与并发区间 | OI-004 | `skills/spec-plan/templates/phase-template.md`（＋ bundle 哈希） | 否 | build-code P-A |
| G-1 两侧条款 | OI-005 | build-plan/build-code SKILL | 否 | build-code P-A |
| AGENTS.md 三条可观察句 | OI-011 | `AGENTS.md` | 部分 | build-code P-A |
| 连续上下文修复条款 | OI-002 | build-code / verify-code SKILL | 否 | build-code P-A |
| T-023、F-9、T-027、T-029、行 44/47 | C 节 | CONTEXT.md、make-decision SKILL、inventory、根目录文件 | 否 | build-code P-B（小修） |
| T-018 runtime 与 G5/G6/G17/G19 | C/G | runtime/evidence/**、stage-runner、stage-runtime | 否 | build-code P-C（先定接口蓝图） |
| 审查编排 G10–G16、G20 | §14.17 | runtime/review/**、simple-review-runner | 否 | build-code P-D（其中 G10/G12/G13 需用户选路线） |
| G1–G4、G15、G21、G24 残留与既有红 | G/F | 见 G 节 | 否 | build-code P-E |
| G18/G22 sha 链与废弃模板删除 | G | skills/**、schema、resolver | 否 | 需用户选；选了再单开 phase |
| G7–G9、G23 | G | — | — | 默认不做（登记理由） |
| AC-11–AC-15 实跑与判定 | PRD:305-309 | 本卡执行记录 | 否 | verify-code（独立上下文） |
| §17/§18 生效路径读回 | DL:690 | M1–M5、E1–E16 落点 | 文字已落 | build-plan / verify 只读核对 |

未知项：T-028、T-030、T-032 B1–B6 是否完成；G6 残余绑定的范围；G16 缺陷在 CARD-05 之后是否仍在。以上都需要 build-plan 用子代理逐项读回。

# CARD-02 独立 Phase 文件漏项：设计→计划→实现→验收断点

## U-008 条件提交的当前核查结论

用户要求“CARD-02 所有原始需求全部实现且新材料明显更好”才提交 main；当前条件**未成立**。从母 PRD 的 AC-06～10 回看，AC-07/08 有本 task 的 spec/独立 Phase/纯指针索引实物，AC-09 有 post 路由和缺件拒绝代码，但三项尚无正式 build-plan→build-code/verify-code 的完整语义验收；AC-06 的逐事实无重复契约和 AC-10 的产品目标变更传播没有实际证明。不能拿文件存在或旧归档的 18 achieved 自述填绿。

当前 `tests/acceptance/card-02-current.mjs` 已按原 AC 完整判据纠正：DOC-003/004 保留 Phase/index 结构断言通过事实，但缺弱模型独立实施冷读与真实 index-reader 证据，不能称 achieved；22 条现为 **0 achieved、18 incomplete、2 deferred、2 unavailable**。`runtime/stage/stage-handlers.mjs#acceptanceExecutionFacts` 对 post 仍返回 `unavailable`/空项。`workflows/make-decision/skill-deps.yaml` 仍声明 `interaction_aggregate` consumer，与现行不再新增 aggregate 的作者合同冲突，AC-CLEAN-001 的 active consumer census 尚未闭合。P4/T020 将这些逐项作为真实状态核查，不以“未来计划”替代当前实现；因此本次**不提交 main**。

末端 analyzer 又有两层独立问题：旧 adapter 可把 decision-log 同时当原文与决策，`original_requirements`/coverage 由调用方同时自报，漏原话仍包内自洽；正式 `runOfficialStage` 没有 stage outcome 时只记录 missing，不实际执行五输入 `spec-analyze`。P4/T017/T018 新预写的两个命名目标测试确实在当前实现上 RED（各断言观察到 `result.ok=true`，目标期望 false）；这是漏洞证据，不是修复已完成。T019 必须再证明真实末端执行/发布/读回。具体设计和写集见 `phases/P4.md`。

### 本轮继续执行的边界（追加事实，不覆盖前述历史 RED）

此前把“每轮”却“仅第一轮”的显式限制词误判修成保守拒绝；纯 profile 增加独立 census 参数，对 identity-bound post build-plan 在无独立来源时返回 `material_incomplete`，并在来源 ID 集与包内 `original_requirements` 不等时报告具体缺项。`tests/contract/post-spec-analyze-original-source.test.mjs` 当时为 3/3 定向通过；**这些 fixture 的独立 census 是测试构造，不证明官方 producer 已读取当前原文字节**。此前 `runOfficialStage` 的 post build-plan 路径会运行 profile 并发布 `stage_end_spec_analyze:material_incomplete`；相邻两文件当时 16/16 通过。这是 D-033 前的实现快照，不能把它解释成现在必须补 manifest raw inventory。

按 U-009/D-033 的新权威，T017 现在须从认证 worktree 的当前 `decision-log.md` 字节/位置独立提取 U/V 逐字层和 U-002 等明确原子条目，反查 R 索引；不能只拿索引或同一个 packet 的 `original_requirements`/coverage 自证完整。额外 manifest raw ref/hash 或 host transcript 不再是前置。T019 仍须证明同版语义结果/质量事实的正式执行、发布与读回。缺这些原件时，CARD-02 全量 AC 和 U-008/U-009 的 main 提交条件仍不成立。一次包含大型集成文件的四文件定向运行在 120 秒无结果后主动中止（exit 130，不判通过/失败）；随后缩小到两个 post-phase 文件为 16/16 通过，未跑全量测试。

其后又补了一个正式读回缺口：先写目标断言确认 stage-end quality evidence 原先只存 `material_incomplete` 概要、不存 analyzer 原始结果（目标 RED）；现由现有 `publishAcceptanceQualityFact` 的 `subject_fact.analysis_result` 同事务保存 profile `status/errors/findings/summary/facts`，官方 fixture 可从 quality fact→acceptance evidence→stage-quality evidence 读回，具名用例 GREEN。该原件仍是**缺独立提取逐字来源**的分析结果，不是原始需求全覆盖证明；D-033 改变来源权威后，producer 正例仍须重做。

### U-009/D-033 来源权威修订（当前设计，非完成事实）

当前任务的最终 spec-analyze 将 `decision-log.md` 的逐字声明层/明确原子条目作为原始需求权威，正式 reader 必须从当前认证 worktree 的文件字节独立提取来源 ID、位置和材料身份，再反查索引、decision、spec FR/AC、Phase Task 与正反 oracle。旧 adapter 把 decision-log 全文同时塞进“原文”和“决定”是同源自证问题；**使用 decision-log 作为权威并不授权这种包内自报**。缺逐字层、索引漏项、语义弱化、正式结果未发布须分别保真。自然语言分句的穷尽性无法仅凭解析器证明，unknown 交独立语义审查。CARD-02 母 PRD/归档继续作为条件提交的独立历史验收原件，不改写为本任务额外 raw inventory 前置。本段是目标合同；当前代码是否满足由 T017～T019 的正式入口负例/正例与 readback 决定。

### D-033 后的定向实现与未达边界

当前 reader 已从 decision-log 逐字 U/V 与 U-002 原子条目恢复来源并回查 R 索引；R 只作追踪边，U-002 父引文和逐字重复的 V 保留审计但不重复计覆盖义务。当前样本独立分母 37、索引错误 0，原文单元记录位置/hash；正式末端结果携 decision-log 与技能包 hash。identity-bound post profile 已拒绝包内自报同句获得 `consistent`，无独立语义裁决保持不完整。受影响 4 文件 34 项定向测试通过，`git diff --check` 通过；这些是局部接线/结构证据，不是 CARD-02 22 AC 全绿、P4 正式业务完成或 main 提交条件。当前 OI-016、P2 可观察业务 seam、逐卡真实 RED/独立语义审查及母 PRD 全量验收仍缺原件。

### 独立语义 finding 的当前处置（不改写审查原件）

`research/p4-source-semantic-audit.md` 的 F-SEM-01 已在设计层修正：U-002-23/24 的原短语保留、父句的 make-decision 与用户共同梳理限定由 D-034/R-034、FR-40/AC-40、P2/T009 明确承接；仅后续 spec/AC 存在的负例已计划，真实问答与目标 RED 未取得，故状态 `incomplete`。F-SEM-02 的 U-002-17/18 是本卡执行纪律，不强造产品 FR；当前会话行为证据缺口为 `unknown/incomplete`。F-SEM-03 的 37 是来源记录而非独立产品义务数；F-SEM-04 的 parser `errors=[]` 只证明结构映射，未完成的语义等价仍留 `unknown`；F-SEM-05 按 U-009 接受 decision-log 为当前权威，但来源 hash 不宣称外部消息完整性。这些处置不是异源 provider verdict，也不是正式 build-plan stage-end 通过。

### P4/T019 真技能调用与验收分类的后续修复

此前正式 runner 的 `skill_id`/bundle hash 仅标记 JS profile，未证明 portable lens 真正执行。现已先以两个官方入口断言取得目标 RED（回调 0 次、无回调未标不可用），再在既有私有 publication 回调上接 `runSpecAnalyze`：绑定 task/stage/snapshot/material/source/skill hash、完整来源 ID，旧 revision/缺 ID/自称 `consistent` 被拒，质量事实仍由原 writer 发布。嵌入式 CLI 现可从 `services.specAnalyzeExecutor` 转发此回调；直接 shell `node` 没有可信 host service，仍保留 lens `unavailable`，不宣称正式语义审查完成。source summary 与机器 facts 已把自报 covered 的核验数固定为 0，并明确 37 是未语义去重的来源记录。CARD-02 当前验收分类也改为 0 achieved/18 incomplete/2 deferred/2 unavailable：DOC-003/004 的结构子断言保留，但原 AC 缺弱模型独立实施和真实 index-reader 证据，不能继续假绿。这些局部修复不替代 P2 业务行为或 T020 全量验收。

本记录回答 U-005。母 PRD 与 CARD-02 归档只读；结论依据当前源码和可回放测试，不把历史 T011 自述或绿色命令当完整验收。

| 用户问题 | 结论 | 直接证据 |
| --- | --- | --- |
| make-decision 说好的需求，build-plan 为何没生成对应开发计划？ | 需求没有完全消失：CARD-02 spec 已列 FR-DOC-003/004、FR-FLOW-003；plan P1/T001–T002 列作者技能、P2/T003–T004 列 runtime consumer。但计划没有规定 `每 Phase 一个物理文件` 的路径、创建/发现、身份绑定与缺件失败 oracle，且 `NEW=N/A`；“单一 phase 权威”可被缩窄成 `plan.md` 的多个章节。属于设计细化遗漏。 | 母 PRD `CARD-02` FR-08/09、AC-08/09；归档 `decision-log.md#d-002`、`spec.md#fr-doc-003`/`#fr-flow-003`、`plan.md#phase-p1`/`#file-boundary`。 |
| 一致性检查为何没发现？ | 检查断言只看模板关键词、纯指针索引和 13 步，未生成双 Phase 物理文件再下游读回；`AC-FLOW-003` 还被错绑到 merged-review 路由断言。这证明的是内部自洽，不是母 PRD 的物理产物目标。 | `tests/contract/spec-stage-artifact-closure.test.mjs` 的 sole phase author 测试；`tests/contract/material-producer-consumer-roundtrip.test.mjs` 的静态模板检查；原 `tests/acceptance/card-02-current.mjs` 的 AC-FLOW-003 映射。 |
| build-code 没实现对应计划吗？ | 实现了计划的缩窄版本：`spec-plan` 明令只写 `plan.md`，Phase 模板嵌入单文件；`spec-tasks` 把 `tasks.md` 改成纯指针。消除两份等价工程正文是部分完成，独立 Phase 文件及其生产/消费链没有实现。 | 原 `skills/spec-plan/SKILL.md` 的 `Write only plan.md`；原 `workflows/build-plan/steps.json` step 6；原 `runtime/stage/stage-handlers.mjs` build-plan handler。 |
| verify-code 没检查原始需求吗？ | 现行 verify-code 合同明确不重复检查上游材料完整性、不逐 AC 列原始需求结论；代码审查合同也不做 requirement replay。CARD-02 归档只找到 T011 对 18 achieved/2 deferred/2 unavailable 的自述，未找到能证明当时正式 verify-code 做过母 PRD AC-08/09 物理抽验的 canonical 原件；归档 stage-end build-plan spec-analyze 证据也自述 publication unavailable。因此不能断言“它确实跑过却漏报”；能确认的是合同与 AC 映射不能发现此类遗漏。 | 原 `workflows/verify-code/SKILL.md` 上游材料边界；`skills/wh-review/contracts/verify-code.md`；归档 `tasks.md#t011`、`quality/evidence/stage-end-spec-analyze-build-plan.json`。 |

## 当前任务的纠正边界

- 目标 post 集合：`decision-log.md`、`spec.md`、`phases/index.md`、索引所列每个 `phases/P<n>.md`；pre/history 四材料只读保留。
- 当前 `spec.md` 承担全局实现设计；Phase 各自承载差异与 L0/L1/L2；index 纯指针。当前 `plan.md/tasks.md` 草案已撤回；旧 review attempt 仅历史事实。
- 真正的验收需要“多 Phase 文件创建 → 材料 revision → 正式 build-plan handler → build-code/verify-code 读回 → 母 PRD AC-07/08/09 逐项判定”。任何只查标题、关键词或单一 exit 0 的测试都不充分。
- 尚未完成的正式 review、最终 spec-analyze、用户确认、stage reflection 和 build-plan stage row 分开记录，不因本报告或局部绿测试自动完成。

## 22 条原始 AC 的第二轮反查

`tests/acceptance/card-02-current.mjs` 的单条测试映射不等于该 AC 的完整判据。第二轮按归档 `spec.md` §11 的四段式重新比对：

| 类别 | 当前判断 | 不得越界宣称 |
| --- | --- | --- |
| `AC-DOC-003/004`、`AC-FLOW-003` | 本次增加独立物理 Phase、纯指针索引、post writer/reader/validator 与负例；须以当前多 Phase 任务再读回。 | 旧模板关键词或单文件 Phase 章节不算通过。 |
| `AC-DOC-001/002/005`、`AC-OI-001` | 既有模板与局部检查不等于填充后的四类语义及 OI 全序列投影。 | 需同一 fixture 的原文→决策→spec→Phase/下游回读，缺项记 `incomplete`。 |
| `AC-TEST-001/002/003` | 已有 AC 四段式 checker 和部分 fixture，但原映射分别错指 build-code routing、blueprint 文案与旧双 Phase fixture。 | V0=0、冻结测试非法变更拒绝、独立物理双 Phase RED 的原件未出现前不标 achieved。 |
| `AC-AUTH-001/002`、`AC-FLOW-001/002`、`AC-COVER-001/002`、`AC-CLEAN-001`、`AC-HANDOFF-001` | 生产代码/表格有部分基础；映射错绑或只查字段非空。特别是目标变更传播、K1–K12 实 consumer/oracle、延期四要素均未由原绑定断言证明。 | 各项必须补原始判据同义的现场回读；不以测试名、exit 0、字段存在代替。 |
| `AC-TEST-004`、`AC-REVIEW-003` | 归档明确交 CARD-10/CARD-05 的真实实验。 | 维持 `deferred`，不在本卡补造真实执行。 |
| `AC-REVIEW-001/002` | 无当前完整 Phase packet 的 canonical semantic 结果，也无可处置 finding。 | 维持 `unavailable`；修复 packet 路径不等于 review 通过。 |

因此 CARD-02 原来“18 achieved / 2 deferred / 2 unavailable”的自述不能直接沿用。验收脚本若无原始 AC 同义 oracle，必须降为真实 `incomplete`，不能继续汇总为 achieved。这里是设计与验收设计的双重遗漏，不仅是作者实现少写文件；verify-code 也没有原始需求复核职责，不能作为兜底证明。

## 母 PRD R-002 / AC-07～09 的本任务抽样

| 原始判据 | 当前 CARD-07 原件回读 | 限制 |
| --- | --- | --- |
| AC-07：spec 四件翻译 | `spec.md` §1–6 是需求/场景/FR；`## 验收流程` 给验证顺序；`## 测试标准` 给正负例、oracle 与覆盖限制；`## 架构边界` 给跨层 owner 和禁止复制；Appendix A 每个 AC 有需求、验证、通过、失败、证据字段。母 PRD 产品目标仅路径引用，没有整段复制。 | 这是 CARD-07 当前真实任务的人工定位，不把 CARD-02 原任务的 DOC-005 自动升为 achieved。 |
| AC-08：每包独立差异 | 当前 `phases/P1.md`、`P2.md`、`P3.md` 各自可读，L0/L1/L2 分开、Global spec 指针、精确写集/依赖/消费者、测试及 STOP；`phases/index.md` 只有指针行。缺件/索引复制/写集漂移由定向负例拒绝。 | Phase 所列的未来 P2/P3 实现尚未执行；文件可执行性不等于 GREEN。 |
| AC-09：无 active 双写 | 本任务 post 材料中没有 `plan.md/tasks.md`，正式 build-plan handler 可从物理 Phase 运行。 | active review/verify 旧读面仍须清点及修复；完成前保持 `AC-FLOW-003=incomplete`。 |

## U-006/U-007 纠偏：前述“物理文件可读”不是“能指导开发”

上表的 AC-07/08 定位曾过早：初版 CARD-07 `spec.md` 的全局工程设计只有「架构边界」下约两段，未填 `spec-template.md` 已声明的完整 `实现设计（全局权威）`；P1～P3 各 33 行、每份只一行 `Tasks`。母 PRD AC-07 的“四件翻译”必须包含可用的架构/测试方案，AC-08 和归档 AC-DOC-003 还要求弱执行者只凭当前 Phase 与稳定全局指针无需猜测。本次旧版**未满足内容判据**，即使 `validatePostPhaseContract` 曾返回 `ok:true`。原报告的“可定位”只证明章节标题，不能作为 achieved 证据。

根因不是单点遗漏，而是连续五处断点：

| 断点 | 原件证据 | 修复 owner / 反例 |
| --- | --- | --- |
| 原始要求缩窄 | 母 PRD CARD-02 R-002/AC-07～09 要真实 spec、独立 Phase、自身验收；CARD-02 plan `NEW=N/A`、只改旧 plan/tasks 模板。 | 当前 D-031/FR-50～52；删原始要求不得仍报完整。 |
| 真实内容抽验后置 | CARD-02 D-003 与归档 spec 将真实弱模型任务留 CARD-10，卡内以 fixture/模板 smoke 代替。 | 当前 P1/P3 做真实 CARD-07 材料可执行性抽样；CARD-10 实际弱模型仍 deferred。 |
| 模板二次压缩 | 新 `phase-template.md` 初版只要求一行 Task，当前 spec 未填全局实现设计；旧 task 执行前卡字段没有新落点。 | spec 填代码锚点/接口/依赖/验证；每 Phase L1 逐 Task 卡；一行 Task 负例必须失败。 |
| 同源验收假绿 | CARD-02 AC-FLOW-003 错绑 merged-review；新校验器按全文 ID 与 Phase 级命令计覆盖，空壳也 17/17。 | `validatePostPhaseContract` 改从 Task 卡和精确 source→FR→AC→P/T→oracle 计覆盖；错绑/空卡/缺负例报告 incomplete。 |
| 末端回溯未发生 | CARD-02 正式 spec-analyze publication unavailable，未见正式 verify-code 逐母 PRD 回读原件。 | 当前 build-plan 审查交 raw+全部 Phase；verify-code 将来核原始需求→实现→真实证据，未运行不得填通过。 |

另 `research/card02-79-alignment.md` 原来 11 条“CARD-02 已实现”含独立 Phase、完整 packet、无重复契约等过度结论，现已保留旧表并追加 11 条现行处置，当前分母为本卡 16、交其他卡 63、无无条件已实现。这是**来源账本假闭合**，不仅是生成文件的 bug。当前本任务新设计权威在 `decision-log.md#d-031`、`spec.md#实现设计全局权威` 与 Appendix A AC-50～52；仍须用最终实际材料/测试和独立语义审查核对，不因修文档自动变绿。

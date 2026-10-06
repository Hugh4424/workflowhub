# workflowhub-acceptance-flow-hardening-20261006 · 决策日志

## 任务身份

- **任务类型**：普通任务
- **分组维度**：按工作包

本任务改造 workflowhub 仓库自身的验收机制，属会进入 build-code 与 verify-code 的普通实现任务。

## 大纲地图

- 任务身份
- 原始需求
- ① 验收流程优化
- ② card-06 越权删除回收
- ③ 输出文档精炼
- ④ make-decision 步骤重构
- 要改哪些文件
- 整体成败怎么算
- 范围与非目标
- 未决项
- 验收面
- 风险、延期与退役登记

## 原始需求

用户要求把 workflowhub 的功能验收做成一条可执行、可判定、可复核、可回写的强链路：

1. 需求期与用户讨论确认验收标准与用户故事（R-001）。
2. build-plan 的 spec 必须含详细 user case（R-002），每个 phase 必须有明确验收标准（R-003）。
3. 必须规划一个独立验收 phase，端到端执行所有 user case（R-004）。
4. 验收数据必须由前面的 phase 提前设计（R-005）。
5. build-code 基于代码、接口、UI 执行测试并做效果评测（R-009），对照标准真实测试、保留可复核证据、判定结果与风险（R-010）。
6. verify-code 必须检查验收 phase 产物（R-007）。
7. 验收 phase 发现问题时做根因调研并修复（R-006），失败走「修复 → 重新验证 → case 与结论回写」闭环（R-011）。

用户硬约束三条：

- 不通过哈希或版本来追踪质量（U-017）。
- 保持薄核心，少 gate，少限制；执行全自动，不设人工确认与人工执行（U-006，源自 T-02、T-03）。
- 不做 CARD-01 与 CARD-03 回放（U-016）。

执行约束：按标准流程先建 worktree、从 make-decision 开始不跳阶段（R-013）；主会话只做规划、派发与交互（R-014）；Talk 与 Grill 由主会话用大白话说明选项的后果与风险（R-015）；每种审查只做一次并取异源建议（R-016）。

后续追加范围：一起修 OI-021 与 OI-022（U-010）；card-06 越权删除回收与本任务同做且单独占一个 phase（U-018）；所有文档输出物按 ASD-STE100 与 ISO 24495-1:2023 的核心思想精炼（U-019）；make-decision 步骤按大纲重组为 15 步并支持动态新增大纲模块（依据用户 m01418 的 8 步清单与 F-035、F-036；与字面清单的差异由用户在 m01800 与 m01807 逐项裁定，登记在 OPEN-017）。

编号指针：需求映射 R-001…R-016、用户逐字声明 U-001…U-019 与 V-001…V-019、Talk 批次 T-01…T-08、被否选项表与 G1…G4 选项原文，全部保留在 `log-archive-verbatim-and-talk.md`。调研出处登记表（36 行，含 ④ 的 F-035 与 F-036）与 OI 记录保留在 `log-archive-moved-sections.md`。

## ① 验收流程优化

### 要交付什么

用户五个问题的取证结论是：make-decision 并非没谈验收，缺的是验收标准没有 AC 编号、两阶段之间没有验收交接契约、端到端验收从未真正执行（OI-001）。

| # | 交付物 | 决定 |
| --- | --- | --- |
| 1 | user case 与验收标准的固定载体 | ADR-001 |
| 2 | 独立端到端验收 phase 与其 `Done` 判据 | ADR-002 |
| 3 | 完成信号与验收的时序 | ADR-003、ADR-010 |
| 4 | 每条结论可判定、可复核、可回写 | ADR-014、ADR-015、ADR-016、ADR-017、ADR-018、ADR-021 |
| 5 | 验收数据前置 | ADR-004 |
| 6 | 执行方式：全自动、无人工确认 | ADR-005 |
| 7 | 配套：先修既有破损件 | ADR-007 |
| 8 | 配套：放开 verify-code 审查面 | ADR-006 |
| 9 | 配套：一起修 OI-021 与 OI-022 | ADR-013 |
| 10 | 配套：verify-code 独立功能验收记录 | ADR-012 |
| 11 | 配套：build-code 效果评测 | ADR-011 |

### 决定

#### ADR-001 把 user case 与验收标准写进决策日志的 `## 验收面` 节

- **决定**：决策日志新增 `## 验收面` 节；每条验收标准写六项（可观察用例、成功条件、失败条件、证据、承接负责人、对应 UC）并各挂一个 AC 编号；**偏离说明**：用户逐字与档案（R-002、U-008、T-07-03）要求的是五字段，多出的第六项「对应 UC」是为给 AC 一个唯一分母，不是新增用户要求，删去它不影响五字段的语义；关系固定为「验收面用例 → AC（唯一分母）→ Phase 或 Task → 证据」。模板落在 `skills/decision-log/templates/decision-log-template.md`。spec 的场景卡（`**角色**`、`**前提**`、`**触发**`、`**结果**`）保持现状，不追加字段，追踪表不加 `SCN` 列。
- **为什么**：F-004 证伪了「make-decision 没谈验收」这一前提，真实缺口是验收标准无 AC 编号、两阶段之间无验收交接契约。CARD-10 的 `## 验收面` 是仓内既有先例，复用它不新增文件、不新增 ID 空间。
- **否掉了什么**：把 user case 写成 AC 的执行步骤——跨多 AC 的端到端场景无法表达，场景卡退化成装饰；新建独立 user case 文件与其自有编号——撞「不引入新 ID 空间」，且造出第二套与 AC 打架的分母；SCN 卡追加三字段并补追踪表 `SCN` 列——已按 T-07-03 撤回。
- **后果与风险**：好的是验收标准首次有了唯一分母与交接载体。坏的是模板新增节属新增契约，必须按 OI-020 治理登记第 ① 条登记。
- **影响面**：`skills/decision-log/templates/decision-log-template.md`。
- **开放问题**：OI-002、OI-003、OI-004、OI-009、OI-012。

#### ADR-002 在 build-plan 序列末尾放一个普通 phase 做端到端验收

- **决定**：build-plan 的最后一个 phase 是验收 phase，形态是普通 phase；它依赖前面的 phase，逐条执行 spec 的全部场景卡，逐条输出一个档位并附独立证据指针，判据落在该 phase 的 `gate_cmd`。phase 模板契约头新增字段 `覆盖 AC`。非 `pass` 一律不得计为通过；验收 phase 的 `Done` 必须逐条列出每个非 `pass` 的 AC 编号、档位、未通过原因与证据指针。
- **为什么**：验收要成为强阶段，必须有肯定规则，只写否定句不算。CARD-01 的事故正是端到端验收从未真正执行。放普通 phase 而不新建 stage，是薄核心的硬约束。
- **否掉了什么**：把验收提升为新 stage——撞 `CONSTITUTION.md` 的薄核心与 `skills/spec-plan/SKILL.md:28` 逐字 `The final aggregate is an ordinary Phase task, not a new gate.`（该行是一条长段，此句在行末；按整句 grep 可命中）；沿用 CARD-10「不逐条复核各卡 AC」模式——会架空端到端验收并重演记账 phase；只修破损件加补交接契约而不做独立验收 phase。
- **后果与风险**：好的是验收有了单一执行点。坏的是它可能退化成记账 phase，because CARD-03 的终末 phase P6（`specs/archive/workflowhub-thin-core-card-03-20260919/phases/P6.md`）只产出一条聚合条目 `AC-ACC-001` 与 15 条现有 active AC 行，判定靠一条 `gate_cmd`（`:8` `npx --no-install vitest run tests/acceptance/card-03-current.test.mjs`），不是逐 user case 的端到端验收；该卡 23 条 AC 中有 16 条从未真正执行（F-002）。
- **影响面**：`skills/spec-plan/templates/phase-template.md`。
- **开放问题**：OI-005、OI-015、OI-016。

#### ADR-003 验收 phase 未完成前 build-code 不得置 `succeeded`

- **决定**：把既有阶段工作陈述 `succeeded` 的前置条件写实——user case 全部执行完、宿主侧结论已算出、证据指针已写；未满足只能写 `unverified` 或 `blocked`。落点是 `skills/stage-handoff/SKILL.md:14` 的七值阶段工作陈述；不新增字段、不落 facts、不新增状态机、不新增 gate。
- **为什么**：全仓 `succeeded` 置位点实测为 0，`deriveStageCompletion` 等已从代码删除。CARD-01 的事故就是阶段先宣告成功、之后才发现端到端验收从未做。改既有条件的语义比加门禁更贴合「少 gate」。
- **否掉了什么**：先不动——F-001 的问题原样重演；只做留痕——不拦人，助手照样可以先说完成；写成硬条件或门禁——能堵住但与宪法「不引入阻断推进的质量门」冲突。
- **后果与风险**：好的是完成信号不再早于验收。坏的是缺数据时必须显式写降级原因，because 档位只许取 8 值词表、不得写 `unknown`。
- **影响面**：`skills/stage-handoff/SKILL.md`。
- **开放问题**：OI-018。

#### ADR-004 能提前设计的验收数据必须由前面的 phase 提前设计

- **决定**：能提前设计的验收数据写进各前置 phase 的 `写入集` 与 `Done`；验收 phase 只许补，且必须标来源档位；缺数据时保持 `incomplete` 或 `unavailable`，不得伪造。
- **为什么**：验收时现造数据会变成「为通过而临时造夹具」，是不假绿的直接反面；F-006-R6 已把「提前造夹具」列为被否面。
- **否掉了什么**：要求数据必须全部在 build-plan 设计好——计划赶不上变化、易卡死；验收时现造——违反不假绿。
- **后果与风险**：好的是验收数据有了来源。坏的是「能提前设计」的边界靠人判断，because 没有任何机器校验能判定某条数据是否本可提前设计。
- **影响面**：`skills/spec-plan/templates/phase-template.md`。
- **开放问题**：OI-006、OI-014。

#### ADR-005 验收由 agent 操作真实环境全自动执行，不设人工确认

- **决定**：真实浏览器、实盘等验收由 agent 操作真实环境执行；不设人工确认环节，也不设人工执行环节。执行前必须写清五项授权边界：目标账号与环境、允许的副作用白名单与数量上限、明确禁止的动作、授权有效期、失败即停条件。
- **为什么**：用户逐字要求「能自动的全自动优化，完全没必要人工参与确认和执行」。把局部测试当功能验收是 CARD-01 发火的主因。
- **否掉了什么**：全自动优先但覆盖不到真实浏览器与实盘——正是 CARD-01 发火主因；全人工清单——不可重复复核；按场景分层——被用户逐字推翻。
- **后果与风险**：好的是验收可重复、可复核。坏的是 agent 操作真实环境有副作用，because 未列出的动作一律禁止，凭据失效或环境不可达时必须立即停止并记 `unavailable` 或 `incomplete`，不得改写为 `pass`。
- **影响面**：`skills/spec-plan/templates/phase-template.md`（授权边界写作要求）与验收 phase 产物。

#### ADR-006 放开 verify-code 审查面，让它检查验收产物

- **决定**：verify-code 审查面放开到验收产物，同时改两处：`runtime/review/stage-materials.json` 中 verify-code 的 `forbidden` 清单，以及 `runtime/review/review-packet-identity.mjs:13` 的 `REVIEW_FOCUS["verify-code"]` 末句。回执新增宿主侧结论字段 `conclusion`（∈ `pass`、`pass_with_findings`、`needs_revision`、`reject`、`inconclusive`）与 `coverage`，两者都由宿主侧按 findings 与覆盖情况算出。这不算新增审查点，因为审查点身份是 `(stage, review_track, review_scope, review_kind)`，verify-code 只有 stage。
- **为什么**：verify-code 现在被禁止报告 AC 覆盖与证据完整性，验收产物因此无人检查。空 findings 不等于通过，所以结论必须由宿主侧另算。
- **否掉了什么**：由 verify-code 终末审查承担验收合理性检查——加职责会改审查点 identity；不改 `forbidden` 与 focus 直接硬做——用户第 5 条无法落地；要求 provider 给 verdict——撞 findings-only 协议；字段名用 `verdict`——撞 `runtime/review/canonical-review-result.mjs:362-364` 的校验。
- **后果与风险**：好的是验收产物有了独立检查点。坏的是结论推导规则必须写死，because 空 findings 只能记 `no_findings_returned`，任一 provider 失败必须记 `inconclusive`。
- **影响面**：`runtime/review/stage-materials.json`、`runtime/review/review-packet-identity.mjs`、`runtime/review/review-policy.mjs`、`runtime/review/schemas/result.schema.json`、`runtime/review/canonical-review-result.mjs`。
- **开放问题**：OI-008。

#### ADR-007 先修两件既有破损件：件一修实，件二显式退役

- **决定**：件一在 `runtime/review/provider-material-projection.mjs:15` 修 1 行（`(?<![A-Za-z0-9])` 改为 `(?<![A-Za-z0-9\\])`），并给 `skills/wh-review/scripts/__tests__/material-redaction.test.mjs` 补 3 至 6 行断言。件二显式退役：删 `skills/wh-review/scripts/ac-evidence-summary.mjs`、删其测试、删 `skills/wh-review/skill-bundle.json:18` 条目，并从 `tests/acceptance/card-03-current.mjs` 移除 8 处 `ORACLE-FIX-002` 死引用（`:121`、`:131`、`:162`、`:163`、`:463-475`、`:580`、`:583-584`、`:806-819`）。
- **为什么**：件一的正则会把代码里的 `\d\d:\d\d` 脱敏成 `\d\<host-path-redacted>`，污染 provider 读到的字节；该缺陷在 `paperbuilder-v2-t04` 记 `not_adopted` 后已二次复发，HEAD 仍未修。件二保护的是流程形状与机器认证，撞 FR-29、FR-32 与 SD-17，且生产 consumer 零引用。
- **否掉了什么**：两件都修实——必须复活快照树与 kernel 认证面，撞 FR-29；两件都退役——会让 provider 收到真实宿主路径，且无 PRD 依据；件一退役、件二修实——既丢安全职责又复活机器认证面；保留实现只退役测试——留下零 consumer 的孤儿机制。
- **后果与风险**：好的是脱敏不再吃掉正则字面量，且死引用清零。坏的是件二退役会改变 CARD-03 harness 的失败数，because 该 harness 的冻结基线（33 文件、38 条失败）未做推演。
- **影响面**：`runtime/review/provider-material-projection.mjs`、`skills/wh-review/scripts/__tests__/material-redaction.test.mjs`、`skills/wh-review/scripts/ac-evidence-summary.mjs`、`skills/wh-review/scripts/__tests__/ac-evidence-summary.test.mjs`、`skills/wh-review/skill-bundle.json`、`tests/acceptance/card-03-current.mjs`。
- **开放问题**：OI-019。

#### ADR-008 只改机制，历史任务不回填

- **决定**：只改机制，未来新任务生效；历史任务与在跑任务的既有材料与 facts 只读保留，不迁移、不回填。
- **为什么**：用户在范围问题上选定「只改机制、未来新任务生效，历史与在跑任务不回填」。
- **否掉了什么**：无。
- **后果与风险**：好的是回退无需迁移历史材料。坏的是已跑完的任务仍保留旧行为，because 机制不回填不可回溯。
- **影响面**：无（只约束本次改动范围）。
- **开放问题**：OI-011。

#### ADR-009 本任务自验收等于针对性测试加一次独立审查

- **决定**：本任务自己的验收等于针对性测试加一次独立审查，不做 CARD-01 与 CARD-03 回放。
- **为什么**：用户在本任务自验收方式上选定「只跑针对性测试加独立审查」。
- **否掉了什么**：做 CARD-01 与 CARD-03 历史回放。
- **后果与风险**：好的是本任务体量可控。坏的是本任务不实证证明新机制能拦住当初那批事故（假绿、P6 记账、端到端验收缺失、major 零处置），because 没有回放；该限制不得用摘要或计数粉饰，缺证据保持 `incomplete` 或 `unavailable`。
- **影响面**：无（只约束本任务自验收范围）。
- **已知限制**：一是不做 CARD-01 与 CARD-03 回放；二是不做 CARD-03 冻结基线推演（`tests/acceptance/card-03-current.mjs` 冻结基线含 33 文件、38 条失败），件二退役对 CARD-03 harness 的影响只做死引用扫描；三是这两条不因「针对性测试通过加独立审查通过」被抵消。
- **登记判据**：只对新增契约条目做 OI-020 治理登记；纯缺陷修复（件一）与退役删除（件二）不触发登记。
- **开放问题**：OI-010、OI-013。

#### ADR-010 失败修复后必须回写 case 与结论

- **决定**：失败处理走五步闭环「失败 → 根因调研 → 修复 → 复验 → case 与结论回写」。回写目标四个，缺一不算闭环：`spec.md` 的场景卡、`spec.md` 的 AC 表、phase 契约的 `覆盖 AC` 列、`facts.jsonl` 的既有字段。回写必须可复核：写清哪条 case 被改、为什么改、改后判定，档位取自 8 值词表。ADR-021 把回写目标扩为五项，第⑤项是这次修复本身的记录。
- **为什么**：只修代码不回写，case 与结论会与资产脱节，下一次验收继续用旧判据。
- **否掉了什么**：只在 `Done` 里写「已回写」而不指定目标；新建回写账本或注册表；把回写交给 provider 或审查回执。
- **后果与风险**：好的是修复结果回到资产。坏的是四个目标分散在四个文件，because 没有任何机器校验能证明四者一致。
- **影响面**：`skills/spec-specify/templates/spec-template.md`、`skills/spec-plan/templates/phase-template.md`、`runtime/task/task-store.mjs`。
- **开放问题**：OI-007、OI-017。

#### ADR-011 build-code 必须做实测效果评测，不只跑测试

- **决定**：build-code 基于代码、接口、UI 做实测效果评测：定义指标、对比基线与改动后、给正例与负例、给结论，并产出可复核记录。落点是 phase 契约的 `Done` 与 `evidence_path`。本仓无 UI（worktree 无 `apps/`、无 `.tsx`、`.vue`、`.jsx`），UI 面按不适用处理，但必须写明判据，不得用「无 UI」一句话免掉代码与接口面。
- **为什么**：R-009 要求效果评测；跑测试只能证明不回归，不能证明有效果。
- **否掉了什么**：把效果评测等同于跑测试；以本仓无 UI 为由把 R-009 整体判 out-of-scope——F-008 指出这是误判，R-009 的代码与接口两面在本仓适用；新建评测报告 schema 或持久对象。
- **后果与风险**：好的是改动效果可被复核。坏的是 UI 面只能写不适用，because 判据必须写明而不能省略。
- **影响面**：`skills/spec-plan/templates/phase-template.md`。

#### ADR-012 verify-code 的功能验收记录必须与终末代码审查分开成件

- **决定**：verify-code 侧的功能验收记录独立成件，不得由代码审查回执替代或冒充；verify-code 对验收产物的检查结论（宿主侧 `conclusion` 与 `coverage`）另成一件，并标注判定来源件是功能验收记录而非代码审查。
- **为什么**：CARD-10 的 `DIR-D1-T6` 已裁定功能验收记录必须与终末代码审查分开成件；R-007 要求 verify-code 检查验收产物的合理性。
- **否掉了什么**：以代码审查回执充当功能验收记录。
- **后果与风险**：好的是验收与代码审查两类事实不再混淆。坏的是同一阶段要产出两份记录，because 两份记录必须能分别读取、各自有路径。
- **影响面**：`workflows/verify-code/`、`runtime/review/stage-materials.json`、`runtime/review/review-packet-identity.mjs`。

#### ADR-013 一起修 OI-021 与 OI-022：审查材料契约与合法 key 集对齐

- **决定**：五项一起做。一是逐 key 对齐 `runtime/review/stage-materials.json` 的 `semantic_fields` 与同轨 `required` 及 `optional`（detail 轨与 direction 轨各一组）。二是补齐或删除非法 key。三是给 direction 轨补 `validateDirectionReviewInput`，或把规则写进 `skills/wh-review/contracts/make-decision.md`。四是写清 `approved_direction` 必须逐字节等于 decision-log 这条硬校验的归属（现落在 `skills/wh-review/scripts/review-materials.mjs:229-234`）。五是规定 `draft_spec_or_acceptance` 的合法内容来源。
- **为什么**：用户逐字「这次就一起修」。现状有 key 既不在 `semantic_fields` 也不在同轨 required 或 optional 里，direction 轨没有校验器。
- **否掉了什么**：只登记不修；重写审查材料契约的整体设计；新增第二套 key 空间。
- **后果与风险**：好的是审查输入契约自洽。坏的是 `review-materials.mjs` 的严格不等校验一旦移动归属，必须同步改契约文档，because 两处都描述同一义务就会漂移。
- **影响面**：`runtime/review/stage-materials.json`、`skills/wh-review/scripts/review-materials.mjs`、`skills/wh-review/contracts/make-decision.md`。
- **开放问题**：OI-021、OI-022。

#### ADR-014 每条验收结论必须携带可复核执行原件

- **决定**：每条验收结论携带五类执行事实：命令与参数、cwd 与执行者、exit code 与 signal 与 timeout、原始输出落点、机器可读测试报告（记 runner 与版本）。证据引用按形态分类：`execution_record`、`machine_report`、`trace`、`screenshot`、`coverage`、`mutation`、`contract_check`、`red_original`、`negative_control`。重跑后通过必须记 `flaky`，档位记 `inconclusive`，不得记 `pass`。效果评测必须写清跟什么比、指标与统计量、原始输出落在哪个具名文件。档位只复用既有 8 值词表。
- **为什么**：只有摘要或单一 SHA256 的结论无法复核，这是 F-011 已确认的假绿路径。覆盖率与测试数量只能作诊断。
- **否掉了什么**：给 `acceptance-evidence.v1` 新增字段——撞「不新增 schema」；新增独立 contract-test 或 eval stage——撞「不新增 stage」；mutation 常态化——需新增依赖，撞 D-007 零新依赖；flaky quarantine 台账——撞「不新增第二套进度权威」；把覆盖率数值当判据；要求环境指纹或产物 digest。
- **后果与风险**：好的是每条结论都能被重放。坏的是记录量增加，because 五类执行事实对每条 AC 都要写一次。
- **影响面**：`runtime/evidence/acceptance-evidence-validator.mjs`（只复用其 8 值词表，不复用该校验器本身，因为它含 `SHA256_HEX`、`ANCHOR_PATH`、`EVIDENCE_REF`）、`skills/spec-plan/templates/phase-template.md`。

#### ADR-015 复验必须独立于修复者，且同时过 F2P 与 P2P 双门

- **决定**：`Fixed` 不等于 `Verified`。一是复验判定必须来自与修复者不同的上下文（换 subagent，或换 provider），修复者自己的声明不算复验证据。二是复验同时满足至少一条 fail-to-pass 与既有相关测试全绿 pass-to-pass；判分照三档：F2P 为 1 且 P2P 为 1 记 FULL，0 小于 F2P 小于 1 且 P2P 为 1 记 PARTIAL，其余记 NO；PARTIAL 不得记 `pass`。三是分母为 0 不得判通过。四是回归范围取 modification-traversing 保守超集，不得只跑那一条失败测试。
- **为什么**：修复者自证是 F-013 差距表 G1 与 G2 判定的 blocker；只跑失败那一条会把回归漏掉。
- **否掉了什么**：交给独立审查同时承载复验与审查；只写文本要求而不定上下文；照搬外部基准的运行规模；把复验结论只落 `facts.jsonl`。
- **后果与风险**：好的是「修好了」有可判定的证据。坏的是换 provider 会带来额外成本与不稳定，because 任一 provider 失败时只能记 `inconclusive`。
- **影响面**：`skills/spec-plan/templates/phase-template.md` 与验收 phase 文件契约（复验记录写作要求）。

#### ADR-016 改 AC 或改用例必须走独立审查批准

- **决定**：一是纯重构不应改既有测试。二是改 AC 或改用例是语义变更，必须经独立审查批准，批准者不得是实现者本人，也不得与实现者同一上下文。三是必须留 `Rationale for Change` 与 `Impact Assessment`，写明为什么必须改既有测试才能变绿。四是改 AC 等于改承诺，必须显式重新取得确认，不得静默生效。五是变更登记照外部标准的变更请求登记列定义（`Change Request ID`、`Impact Assessment`、`Approval Status`、`Closure Notes/Verification Status`）。
- **为什么**：F-013 `:589` 与 `:591` 指出静默改 AC 与无影响评估的改测试是作弊形态。ADR-005 的「全自动无人工确认」只约束执行确认，不构成静默改 AC 的依据。
- **否掉了什么**：独立审查加用户确认；只需用户确认；交给 `facts.jsonl` 既有字段；只给来源分级不给批准链。
- **后果与风险**：好的是承诺变更留痕。坏的是批准链会让改判据变慢，because 批准者必须换上下文。
- **影响面**：`skills/spec-plan/templates/phase-template.md` 与验收 phase 文件契约。

#### ADR-017 证据以具名路径对应，降级项必须有风险承接人

- **决定**：对 ADR-003 补四条声明性要求，不新增字段、schema 或校验代码。一是每条验收结论以具名原始件路径加纯文本引用与被验对象对应，不引入哈希、不引入版本号、不做相等判定。二是 `deferred`、`unavailable`、`incomplete` 必须有风险承接人，handoff 写明谁在什么身份下接受该缺口。三是 handoff 的阶段工作陈述必须显式列出取降级值的是哪条 user case、原因与风险承接人。四是新记录不得携带已退役绑定字段 `snapshot_tree`、`source_digest`、`material_revision`、`freshness`（四个字段的现存出处分别是 `contracts/facts-subschema.json:17`、`:26`，`runtime/review/schemas/attempt.schema.json:68`、`:173`，`runtime/evidence/acceptance-evidence-validator.mjs:29`；`runtime/evidence/research-report.mjs:382` 只守 `snapshot_tree` 与 `material_scope_revision`，仅作范式出处）。
- **为什么**：F-014 `:410-412` 指出没有任何地方记录谁接受了风险，`:355-357` 指出无有权者签字只能记为未完成。F-018 `:257-265` 的 A1 至 A9 只读命令表与 `:271-284` 的 B1 至 B14 已存在机制表所建议的 Git commit 绑定据此不采纳，because 它撞 U-017 与 OI-013。
- **否掉了什么**：恢复 `snapshot_tree`、`source_digest`、`material_revision` 或回执校验的任何变体；把风险接受写成新字段或新记录。
- **后果与风险**：好的是带风险放行必须有人署名。坏的是本机制不承诺防材料偷换、不提供密码学不可否认性，because 具名路径绑定不做相等判定。
- **影响面**：`skills/stage-handoff/SKILL.md`、`runtime/evidence/research-report.mjs`（退役字段已只读）。

#### ADR-018 验收 phase 必须产出独立成件的验收结论

- **决定**：验收结论写在验收 phase 自己的文件（`phases/P<n>.md` 的固定小节），原始件放独立证据件（`quality/evidence/`），不新增文件类型。「不新增文件类型」指不新增 schema 或新的产物类别；在同一类别里多写一个实例（如 `quality/evidence/` 下多一份就绪件）不算新类型，是「独立成件」的正当形态。六项逐项非空，无则写「无加理由」：评估（含局限）、与计划的偏差及原因、未充分测试的特性及原因、未解决事件（逐条）、残留风险、签核对象。另补入口准则逐条核对结果，以及数据就绪件与环境就绪件各一份、独立成件、各写 status。
- **为什么**：外部标准要求评估含局限；F-012 `:162` 把数据就绪报告与环境就绪报告列为独立文档类型，`:275-289` 逐字指出夹具描述不等于就绪证据。
- **否掉了什么**：新增独立验收报告文件类型——会引入新的 post 文件，撞「不新增第二套进度权威」；写进 `spec.md` 附录——时序倒置；只做冒烟级检查；省略就绪件。
- **后果与风险**：好的是验收结论可单独读取、可单独签核。坏的是只报「全部成功条件达成」就不算通过，because 局限、偏差、残留风险三项必须写。
- **影响面**：`skills/spec-plan/templates/phase-template.md`、验收 phase 产物与 `quality/evidence/`。

#### ADR-019 AC 判据的唯一权威在 spec，决策日志的 `## 验收面` 只是交接索引

- **决定**：一是 AC 判据唯一权威等于 spec 的 `## Appendix A`，保持四行式（`验证：`、`通过：`、`失败：`、`证据：`）。二是决策日志的 `## 验收面` 是 make-decision 到 build-plan 的交接载体（索引加承接负责人），不是第二套判据权威。三是统一只做模板层文档统一：`skills/decision-log/templates/decision-log-template.md` 新增该节并声明它是索引，`skills/spec-specify/templates/spec-template.md` 补一句指回该节，两处 AC 编号同号。四是不新增 schema、校验器或测试，不改 `runtime/stage/stage-content-contracts.mjs:664` 的正则。
- **为什么**：F-019 `:205-210` 判定 spec 的 `## Appendix A` 是权威、`## 验收面` 是交接载体，`:274` 逐字指出最实际的风险不是判据冲突，而是没有模板可依。
- **否掉了什么**：两套形状字段集合并或机器校验——只会让死代码多匹配一种标题；统一为单一形状并删除 `## 验收面`；顺手修 `docs/architecture/test-asset-governance-rules.md:9` 的口径偏差——改为登记 `OPEN-016`。
- **后果与风险**：好的是下游只有一个判据权威。坏的是两份文档必须人工保持 AC 编号同号，because 没有机器校验。
- **影响面**：`skills/spec-specify/templates/spec-template.md`、`skills/decision-log/templates/decision-log-template.md`。

#### ADR-020 防自证：五条禁令加判定器必须要求显式通过元素

- **决定**：一是禁止用授权文本验证授权文本（`approved_direction`、授权回执、任务书措辞不得作为已通过的证据）。二是禁止删到测试变绿；测试变红不得改断言，除非显式判定为语义变更并走 ADR-016 批准链；「重跑直到绿」同样禁止。三是用例集合（黄金清单）的改动必须由另一个主体批准。四是禁止用计数代替逐条。五是禁止把 `incomplete`、`unavailable`、`missing`、`unverified` 写成 `pass` 或 `succeeded`。判定器必须要求显式通过元素，不得用「无失败即通过」。
- **为什么**：F-012 `:234-237` 逐字指出证据不得由被测方自产自证，`:158` 要求改套件由另一个主体批准；F-010 `:537` 逐字指出测试用例只有在没有其它结果元素时才被视为通过。
- **否掉了什么**：以代码审查冒充功能验收；把 `unverified` 升为一等结果值——需新增档位词，撞非目标；把机读产物列为必需交付物。
- **后果与风险**：好的是漂白与消音被明确禁止。坏的是显式通过元素的判定仍靠人读，because 本卡不新增校验器。
- **影响面**：验收 phase 文件契约与独立审查的判定要求。

#### ADR-021 失败必须先分诊，并补齐本仓自定的 Disposition 词表

- **决定**：一是失败先复现确认是不是 bug，再谈修复。分诊字段最低集等于 `Defect ID`、描述、是否可复现、`Version detected`、`Severity`、`Priority`、`Disposition`（初值 `Pending`）；判定者是不同于实现者的分诊者；证据是复现步骤与复现结果，缺则不算闭环。二是本仓自定 Disposition 词表：`Fixed`、`Won'tFix`、`Deferred`、`AcceptedRisk`、`Duplicate`、`NotABug`、`Referred`；取不修的取值必须带理由与风险接受人署名。关闭留痕等于 `Disposition` 终值加 `Closed by`、`Date closed`、`Change reference`、`Test reference`、`Closure Notes/Verification Status`。三是 ADR-010 的回写目标由四项扩为五项，第⑤项是这次修复本身的记录。
- **为什么**：F-013 `:570` 逐字指出 IEEE 1044 样本里没有 won't fix 取值（S1 Table A.1 只有 `Corrected`、`Not found`、`Referred`、`Duplicate`），必须自己补，否则决定不修会变成不留痕的黑洞；`:613-618` 逐字指出标准只要求记录最终处置、不要求谁批，这块留白必须自己补。F-013 差距表 G3 缺分诊、G4 缺 `Disposition` 语义、G5 缺缺陷记录本身作为回写目标、G6 缺新回归测试登记与追踪。
- **否掉了什么**：照搬外部组织的多级变更委员会、分诊负责人、回填委员会与复盘会；把 `facts.jsonl` 当关闭属性的落点；沿用「无 Disposition 也可关闭」；把人为疏忽当根因。
- **后果与风险**：好的是决定不修也留痕并有署名。坏的是自定词表没有外部标准背书，because IEEE 1044 未定义这些取值。
- **影响面**：`skills/spec-plan/templates/phase-template.md`、验收 phase 文件契约、`facts.jsonl`（只写既有字段）。

### OI-020 治理登记

本卡 12 条新增契约条目逐条登记。每条六项（唯一 consumer、owner、替代了什么、删除条件、仓库级 `docs/adr/0030-mechanism-simplification-deletion-boundary.md` 的零引用扫描结果、Runner 发布清单）的逐字原文见 `log-archive-moved-sections.md`。该 `0030` 是仓库级 ADR，与本日志自有的 ADR-001…029 不同源。

| # | 新增契约条目 | 唯一 consumer | owner | 替代了什么 | 删除条件 |
| --- | --- | --- | --- | --- | --- |
| ① | 决策日志模板新增 `## 验收面` 节与六项 | 模板节清单、`validatePostPhaseContract`（`runtime/stage/stage-content-contracts.mjs:1010`）、build-plan 作者与独立审查 | 模板加校验面 | 替代已撤回的 SCN 三字段落点 | 连续两个任务无真实 consumer |
| ② | phase 契约新增 `覆盖 AC` 字段 | `validatePostPhaseContract`、build-plan 作者与验收 phase 执行者 | phase 模板加校验面 | 新增，无替代 | 被并入既有 `Done` 或无 consumer |
| ③ | 宿主侧结论字段 `conclusion` 与 `coverage` | `runtime/review/canonical-review-result.mjs` 的 `adjudication` 分支 `:362-364` | `runtime/review/schemas/result.schema.json` 加聚合面 | 取代「空 findings 即通过」的既有静默行为 | 无 consumer，或与 `adjudication` 合并 |
| ④ | 验收 phase 的 `Done` 判据（逐条档位加效果评测落点） | phase 模板 `:35` 与 `validatePostPhaseContract` | phase 模板 | 新增，无替代 | 被并入 `gate_cmd` 或无 consumer |
| ⑤ | 阶段工作陈述 `succeeded` 的前置条件 | 人读交接（机器面无 consumer） | `skills/stage-handoff/SKILL.md` | 新增前置条件说明，不新增字段 | 被证伪或与新机制冲突 |
| ⑥ | 授权边界五项 | 验收 phase 执行者与独立审查 | phase 模板的任务描述与 `Done` 面 | 新增，无替代 | 被并入契约头字段或无 consumer |
| ⑦ | 回写闭环的四个目标 | `spec.md` 场景卡与 AC 表、`覆盖 AC` 列、`facts.jsonl` 既有字段 | spec 模板、phase 模板、`runtime/task/task-store.mjs` | 新增，无替代 | 无 consumer 或与既有载体重复 |
| ⑧ | verify-code 独立功能验收记录件 | `workflows/verify-code/` 契约与回执宿主侧结论 | `workflows/verify-code/`、`runtime/review/stage-materials.json`、`runtime/review/review-packet-identity.mjs` | 新增，无替代 | 与代码审查件完全重复 |
| ⑨ | 审查材料契约与合法 key 集对齐 | `skills/wh-review/scripts/review-materials.mjs:384` 的 `validateMaterialAllowlist`（它调 `:167` 的 `materialAllowlistForRule` 算 key 集）与 `:229-234` 的逐字节校验 | `runtime/review/stage-materials.json`、`skills/wh-review/contracts/make-decision.md`、`review-materials.mjs` | 修实既有错配，无替代物 | 两个列表合并后对齐失去 consumer |
| ⑩ | 八条机制级 ADR（ADR-014 至 ADR-021）的统一登记 | 验收 phase 文件与独立证据件、`skills/stage-handoff/SKILL.md`、两处模板 | phase 模板、`stage-handoff/SKILL.md`、两处模板 | 新增，无替代；不改被增补 ADR 的已有结论 | 某条 ADR 连续两个任务无 consumer |
| ⑪ | ADR-022 回收 phase 的统一登记 | 回收 phase 的 `gate_cmd` 与逐项处置清单、`F-024`、回收总账指针节 | 回收 phase 文件契约与 `F-024` | 新增，无替代；是对原「由另一代理负责」口径的改判 | 回收 phase 完成后连续两个任务无 consumer |
| ⑫ | ADR-023 精炼 phase 的统一登记 | 精炼 phase 逐条判据与 8 个文件改动面、`F-025`、`F-026`、精炼落点指针节 | 精炼 phase 文件契约、3 个模板、5 个 skill | 新增，无替代 | 精炼 phase 完成后连续两个任务无 consumer |

### 失败了怎么退

- 回退方式：只回退本卡新增的模板节、字段与回执字段，不迁移历史材料（ADR-008）。
- 不可逆项：`runtime/review/schemas/result.schema.json` 的回执新增字段不可逆性高，已产生的回执与下游消费方都会受影响；实现时必须同时改 schema 与聚合面。
- 回退后仍保留：所有登记条目与判据，便于下一次重新评估。

## ② card-06 越权删除回收

### 要交付什么

把 card-06 两批越权删除（P3 批次 `77de36088a84c496dc8b65d6a62d01280822691b`、P4 批次 `6da46d6d4fc4060ce83944781bb856ec7379d124`）逐项裁定并回收。

- 总账 46 项：拿回 23、部分拿回 18、不拿回 5。
- 优先级分布：P0 14、P1 20、P2 10、P3 2。
- 改动面 27 个既有文件（`workflows/**` 9、`skills/**` 16、`docs/**` 1、`tests/**` 1），零新建。
- 回收单独占 build-plan phase 序列中的一个普通 phase。
- 逐项裁定权威等于 `F-024-pullback-consolidated-ledger.md`；46 项逐项处置表与硬禁令 17 条全文见 `log-archive-moved-sections.md`。

### 决定

#### ADR-022 card-06 越权删除回收与本任务同做，回收单独占一个 phase

- **决定**：card-06 两批越权删除的回收纳入本任务；46 项逐条给出处置（拿回、部分拿回、不拿回）；改动面限 27 个既有文件、零新建；回收单独占 build-plan phase 序列中的一个普通 phase，不与机制改造 phase 混做；不新增 stage、gate、审查点或第二套进度权威。回收只以声明性文本或声明性字段进行，不重建任何被删的机器校验器、认证、receipts 或哈希绑定。
- **为什么**：用户逐字「同一个任务，回收单独占一个 phase」。46 项里只有 23 项拿回、18 项部分拿回、5 项不拿回，说明三次删除提交越过了授权边界，而当时没有任何检查发现。
- **否掉了什么**：由另一代理按 F-015、F-016、F-017 另行负责、本卡只登记 `OPEN-015`——该口径已被 U-018 取代；新建文件、schema 或名词空间承载回收；重建被删的机器校验器、认证、receipts 或哈希绑定。
- **后果与风险**：好的是越权删除有了逐项裁定与回收路径。坏的是回收范围没有回放实证，because 判据来自 `F-024` 的只读取证，未跑测试、未做回退演练。另有一条本卡推断（非实测）：当初没有「删除项对应授权清单」的逐项绑定，也没有对删除提交做 write-set 对照。
- **影响面**：27 个既有文件（`workflows/**` 9、`skills/**` 16、`docs/**` 1、`tests/**` 1）；逐项清单见 `F-024-pullback-consolidated-ledger.md`。

## ③ 输出文档精炼

### 决定

#### ADR-023 用跨语言写作规则精炼所有文档输出物，不新增控制面

- **决定**：用 ASD-STE100 与 ISO 24495-1:2023 的核心思想精炼 workflowhub 的所有文档输出物（`decision-log.md`、`spec.md`、`phases/P<n>.md`、`prd.md`、`phases/index.md`）。落地形态只有两条必做：一是模板里的固定小节骨架（文档头两行 `读者：` 与 `读完要能：`；小节标题必须能预测下一节内容；每节第一句说明本节回答什么问题；固定一个 `## 补充材料` 尾部小节承载推导、原始输出与被否方案；`phases/P<n>.md` 采用「结论 → 依据 → 例外与风险」顺序）；二是 `SKILL.md` 里的编号写作规则清单（每条一行、祈使句、可自检、显式写出允许的例外、显式声明「这是写作指引，不是质量门」）。可读写作清单文件可选，只作第二条的附属。精炼单独占 build-plan 一个普通 phase。
- **为什么**：本任务 worktree 的 `decision-log.md` 在本轮重写前实测 1,854 行、326,870 B（更早一版 2,354 行、511,939 B，约 217 B 每行），近三个归档任务分别是 1,392、1,033、928 行，涨的是单行内容。本轮按本条重写后为 548 行、80,069 B（作者交付值）；经两处定点更正后为 549 行、80,492 B，即 m01492 展示给用户的版本。用户逐字要求「精炼、高质量、好阅读、不丢失细节」。与 ASD-STE100 冲突处一律以 ISO 24495-1 为准，因为 ISO 定什么算好文档，STE 定句子和术语怎么收紧。只取跨语言通用规则：一段一主题、一词一义、结论在前、标题可预测、不为缩短而省略词或使用缩写、名词化动作还原成动词、默认主动语态；丢弃英文许可词表与词数与句法硬上限。
- **否掉了什么**：照搬 ASD-STE100 全部可用规则；做自动可读性评分器或字数门；落地 ISO 24495-1 的「拿真实读者试用」原则——做成流程节点即变成 gate；把精炼与 ADR-022 回收合成一个 phase——两者在 `skills/decision-log/SKILL.md` 与 `skills/spec-specify/SKILL.md` 两个文件上重叠，必须分开。
- **后果与风险**：好的是文档有了可自检的写作判据，且零新增控制面。坏的是判据靠人读自检，because 明确不做任何自动校验器、评分器、阻断门、许可词表与字数门。判据第 9 条受必保锚点约束：`skills/spec-plan/templates/phase-template.md:35`、`:50`、`:54` 三句与 `:198-217` 的 G-2 示例块一个字都不能改。
- **影响面**：`skills/decision-log/templates/decision-log-template.md`、`skills/decision-log/SKILL.md`、`skills/spec-prd/templates/prd-template.md`、`skills/spec-prd/SKILL.md`、`skills/spec-specify/templates/spec-template.md`、`skills/spec-specify/SKILL.md`、`skills/spec-plan/templates/phase-template.md`、`skills/spec-plan/SKILL.md`。

## ④ make-decision 步骤重构

### 要交付什么

把 make-decision 的步骤顺序改成与决策日志结构一致：先定大纲，再按大纲调研，然后方向 talk、方向审查、逐模块收敛、细节审查、grill。共 15 步，其中 11 步是现有步骤重排，4 步是新增。外部依据见 F-036 第 3 节。

1. 载入上下文与范围分诊（现有 `load-context` 与 `triage-scope`）。
2. **大纲 talk（新增）**：产出粗粒度大纲，含做哪几块的问题与边界，以及每块的方向假设。按 ADR-025，它显式标注为可修改假设，并写明什么证据会推翻它。
3. 内部与外部调研（现有 `research-and-diverge`）：围绕大纲每一块做研究，研究的输入包含「大纲是待验证假设」。
4. **大纲回改判定（新增）**：显式回答研究是否改了工作包清单或任一方向假设，产出修订后大纲，或维持不变加理由。
5. 方向 talk（现有 `outline-talk`）：基于修订后大纲与调研，对重要方向问题取得真实答复或明确待答。
6. **轻量对抗性检查（新增）**：用红队式提问攻击「方向是否被过早锁定」。不设否决权，只产出风险清单。
7. 方向审查（现有 `direction-advice`）：独立审查方向与修订后大纲，不审细节。按 ADR-026 写明 Kill 与 Recycle 权限与判据。
8. **全模块广度确认（新增）**：对全部模块做一次粗确认（命名、一到三句、风险与优先级排序），决定细化顺序，不进入细节。
9. 逐模块确认与需求 talk（现有 `module-convergence`）：对单个模块做深度收敛，并在收敛时记录该模块的重开条件。
10. 细节审查（现有 `detail-advice`）：全部模块收敛后做一次整体细节审查，检查模块间一致性与缺口。按 ADR-026 写明 Kill 与 Recycle 权限与判据。
11. grill（现有 `grill-with-docs`）：按 ADR-027，对细节决策加计划草案骨架做对抗性评审。
12. 写草稿（现有 `write-decision-draft`）。
13. 用户确认（现有 `approve-decision`）。
14. 一致性核对（现有 `stage-end-spec-analyze`）。
15. 交接（现有 `stage-handoff`）。

并支持中途新增需求时动态新增大纲模块：按 ADR-029，在同一决策日志新增一个大纲模块，并在该模块内补齐调研、决策、方案与验收标准；重开范围按 ADR-028 的上下文传递闭包判定。

**未采纳 F-036 建议的 5b（模块级细节审查）。** 用户在 m01807 只批准 2b、3b、4b 三处新增，未批准把细节审查拆成「逐模块审加整体审」两级；细节审查保持为第 10 步的一次整体审查。

### 决定

#### ADR-024 make-decision 步骤按大纲重排为 15 步

- **决定**：把 `workflows/make-decision/steps.json` 的 12 步重排并扩充为上节列出的 15 步，`step_id` 重编为连续整数。同步改 `workflows/make-decision/SKILL.md` 的编号方法与 `workflows/make-decision/skill-deps.yaml:8` 的 `trigger`。四处新增是大纲 talk、大纲回改判定、轻量对抗性检查、全模块广度确认；保留范围分诊与一致性核对两步。F-036 建议的 5b 模块级细节审查不采纳。
- **为什么**：F-036 实测用户方案的骨架在外部证据下站得住（大纲先于调研、方向 talk 在调研后、方向审查独立且在逐模块之前、逐模块收敛、grill 在细节审查之后、写草稿在最后）。用户 m01800 先裁定「加的四步对整体质量提升不大，只会极大提升耗时与 token 消耗」，随后 m01807 改判：2b、3b、4b 三处可以加，三处语义限定（ADR-025、ADR-026、ADR-027）保留，但 5b 不在批准之列。三处新增各有硬依据：大纲回改判定因为研究若不改变决策则无收益，须给调研一个可验收产出；全模块广度确认因为 OpenUP 与 Wiegers 要求先 outline 全部再 detail，且大纲写于调研之前、此时风险与优先级信息还不存在；轻量对抗性检查因为 CIA、Red Team Handbook、FM 6-0、UK MOD 都主张对抗性评审贯穿，只有 CIA 把末端检查写成补充性。5b 不采纳的理由是把细节审查拆成两级会重复审查动作，与用户的省时要求冲突。
- **否掉了什么**：F-036 的 5b 模块级细节审查；改 `runtime/` 任何文件——F-035 实测不需要；新增 schema；新增校验器；把 grill 只放一次（外部来源主张贯穿）；让细节审查只在最后做一次（会让缺陷延迟暴露，这是接受的风险，见下）。
- **后果与风险**：好的是重排代价低，且四处新增都落在散文与步骤清单上，不引入机器门。坏的是 `workflows/make-decision/skill-deps.yaml:8` 的 `trigger: after_outline_talk` 会变成谎话，必须同步改；且把 grill 挪到细节审查之后，必须同步改写 `workflows/make-decision/steps.json:45-49` 与 `workflows/make-decision/SKILL.md:23`，because 这两处逐字写着「草稿与Grill之后的wh-review细节建议」，即现有文字假定 grill 在细节审查之前。F-036 同时指出两条无法规避的反面证据：Torres 与 Lipiec 反对把 discovery 做成独立阶段，Shape Up 主张 `The scopes need to be discovered by doing the real work`。ADR-025 的语义限定把大纲写成可修改假设以避开后者；前者登记为 OPEN-017 已处置（见下）。不采纳 5b 意味着缺陷可能等到全部模块收敛才暴露，这是被接受的残留风险。
- **影响面**：`workflows/make-decision/steps.json:4-65`、`workflows/make-decision/SKILL.md:15-26`、`workflows/make-decision/skill-deps.yaml:8`。条件项：新步骤引入新技能时改 `workflows/make-decision/skill-deps.yaml:2-23`（撞 `tools/cli/smoke-local-skill-dispatch.mjs:22-27` 的「resolved 顺序等于声明顺序」断言）；改名 `approve-decision` 时改 `skills/decision-log/templates/decision-log-template.md:115` 与 `:125`。不需要改任何 `runtime/` 文件、`runtime/review/stage-materials.json`、`runtime/review/review-policy.mjs`、`runtime/schemas/skill-bundle.schema.json`、`docs/architecture/move-map.json`。
- **证据**：`F-035-make-decision-step-machine.md`、`F-036-external-discovery-sequencing.md` 第 3 节与第 4 节。

#### ADR-025 大纲是可修改假设，不是基线

- **决定**：步骤 2 产出的大纲必须显式标注为可修改假设，写明什么证据会推翻它；它同时包含「问题与边界」和「方向假设」两部分，不能只有工作包清单。大纲不得作为基线，也不得在此时承诺范围或成本。
- **为什么**：F-036 的支持证据都限定在 summary level：Design Sprint 周一 11:30 先画 map、14:00 才请专家；Vogels 2006 的 PR/FAQ 先写发布时要用的文档；PMI 的 rolling wave 与 planning package；Royce 1970 的 `STEP 1: PROGRAM DESIGN COMES FIRST`。反对的不是「先有大纲」，而是「把大纲细节化或承诺化」（Chechile 的 `we forge them into existence`、McConnell 的过早承诺、Trot et al. 的条件式反对）。Shape Up 逐字 `A problem without a solution is unshaped work` 说明只有问题没有方向不算成形工作。
- **否掉了什么**：把大纲写成基线；只列工作包不给方向；在第 1 步承诺范围或成本。
- **后果与风险**：好的是避开了 Chechile 一类直接攻击。坏的是「可修改假设」是散文约束，没有机器检查；如果执行者仍把它当基线，风险落回 OPEN-017。
- **影响面**：`workflows/make-decision/SKILL.md:15-26`。
- **证据**：`F-036-external-discovery-sequencing.md` 第 2 节①、第 4 节 D5。

#### ADR-026 两次独立审查必须写明 Kill 与 Recycle 权限与判据

- **决定**：步骤 7（方向审查）与步骤 10（细节审查）各自写明 Kill 与 Recycle 权限与判据。没有这两项，审查不得记作通过。
- **为什么**：F-036 指出两段式审查有对应物（PEP 的编辑审与指导委员会审，正当性来自「审的东西与审的人不同」），但「恰好两段」没有任何来源论证；反面证据很硬——Shape Up 逐字 `There's no "step two" to validate the plan or get approval`，Cooper 自报 `the gates have no teeth: Once a project is approved, it never gets killed`，只有 33% 的公司有严格闸门。写明权限是防止审查退化成项目进度汇报会的唯一手段。
- **否掉了什么**：只写「独立审查」不写权限；给审查加新的机器门（撞薄核心）。
- **后果与风险**：好的是审查有了真实后果。坏的是权限定义本身是散文，且 F-036 明确说「恰好两段审查」无依据，若将来发现一段更合适，本条需重开。
- **影响面**：`workflows/make-decision/SKILL.md:15-26`。
- **证据**：`F-036-external-discovery-sequencing.md` 第 2 节②、第 4 节 D7。

#### ADR-027 grill 的对象是细节决策加计划草案骨架

- **决定**：步骤 11 的 grill 质询对象是细节决策加计划草案骨架。骨架必须在步骤 10 与 11 之间产出。grill 是窗口不是终点，其后仍有步骤 12 至 15。
- **为什么**：Klein 逐字 `A typical premortem begins after the team has been briefed on the plan`；Shipley 的红队窗口是草稿接近完成之后、最终批准之前，且红队之后仍有 Gold Team。若第 6 步产物只是决策清单而没有可质询的计划草案，grill 会没有对象。
- **否掉了什么**：把 grill 放在细节审查之前（撞 Klein 的触发条件）；把 grill 当终点（Shipley 的红队之后仍有 Gold Team）；让 grill 只产出方案而不产出洞察。
- **后果与风险**：好的是 grill 有了明确对象。坏的是「计划草案骨架」这个产物今天在 `workflows/make-decision/steps.json` 里没有对应步骤，实现时必须确认它是步骤 10 的产出还是新的一步。
- **影响面**：`workflows/make-decision/steps.json:4-65`、`workflows/make-decision/SKILL.md:15-26`。
- **证据**：`F-036-external-discovery-sequencing.md` 第 2 节③、第 4 节 D6。

#### ADR-028 中途加模块用上下文传递闭包决定重开集，默认新增下游记录

- **决定**：中途新增模块时，默认新增下游决策记录，不改动已接受的记录。只有落在新模块上下文传递闭包内的旧决策才改为 `requires reassessment`。判据是 `context(p) = requirements(p) ∪ ⋃_{q≻p} solution(q)`，`≻` 是 `leadsTo` 的传递闭包；工程近似是从新模块触及的最高抽象层向下级联。只追加信息而不改变原决策用 amend，改变原决策用 supersede 加双向链接。每个模块在收敛时写死重开条件，类型限 metric、date、event、release 四型。
- **为什么**：F-036 找到的唯一形式化判据是 Szlenk et al. 的上下文传递闭包，但它来自单一学术来源，2012 年前后的提案，作者自称该问题 `has not been given much attention`，Gerdes et al. 2014 独立确认 traceability 支持 `not yet sufficiently provided`，所以引用时必须标注为单一学术提案。记录层已成熟一致：Nygard、AWS、Fowler、log4brains 都是「接受即不可变、只改状态、新记录 supersede」；log4brains 的真实数据是 19 条里只有 2 条被 supersede，说明默认动作应是新增下游记录而不是重开。F-036 同时纠正一处误引：MADR 没有 `amended` 状态。
- **否掉了什么**：把新增模块当作作废全部已收敛内容；默认重开（与 log4brains 的真实分布相反）；把 amend 与 supersede 混为一谈；依赖记忆判断是否重开。
- **后果与风险**：好的是重开范围有判据且不依赖记忆。坏的是该判据的工程可行性无法判定，F-036 明确列为不确定项，实现时若发现不可用，退回工程近似的级联判据。
- **影响面**：`workflows/make-decision/SKILL.md:21`。
- **证据**：`F-036-external-discovery-sequencing.md` 第 2 节⑤、第 4 节 D8。

#### ADR-029 中途新增需求时动态新增大纲模块，不新增步骤

- **决定**：在 `workflows/make-decision/SKILL.md:21` 的第 7 条加一句——中途新增需求时，在同一决策日志新增一个大纲模块，并在该模块内补齐调研、决策、方案与验收标准，不新增步骤。可选同步点是 `skills/decision-log/SKILL.md:17` 的第 6 条。
- **为什么**：模块不是 step，而是 `workflows/make-decision/steps.json:35-39` 的 `module-convergence` 内部的循环对象；决策日志已是 OI 记录制（`skills/decision-log/templates/decision-log-template.md:100-118`），新增模块等于新增一条 OI，无需新 schema、无需新名词空间。F-035 实测今天没有任何机器门阻止中途新增模块。
- **否掉了什么**：改 `steps.json` 来承载动态模块；新增 schema；新增名词空间。
- **后果与风险**：好的是改一处散文即可，且今天没有机器门阻止中途新增。坏的是方向审查的 `convergence_outline` 快照（`runtime/review/stage-materials.json:245`）在新增模块后若重跑审查需重生成，because 今天没有任何代码检查这个不一致。
- **影响面**：`workflows/make-decision/SKILL.md:21`；可选 `skills/decision-log/SKILL.md:17`。
- **证据**：`F-035-make-decision-step-machine.md`；重开判据见 ADR-028。

## 要改哪些文件

①、③、④ 三个工作包的改动面合并成一张表。全部为既有文件。

| 文件 | 改什么 | 工作包 | 决定 |
| --- | --- | --- | --- |
| `skills/decision-log/templates/decision-log-template.md` | 新增 `## 验收面` 节与六项骨架；`## 调研` 补「不复制到主文」规则；`## 动态 Talk 批次` 补「只写 batch_id、结论、用户选择」；`## 逐字声明层` 明确逐字只在 V 行保留一次 | ①③ | ADR-001、ADR-023 |
| `skills/spec-plan/templates/phase-template.md` | 契约头新增 `覆盖 AC` 字段；`Done` 写实逐条档位与效果评测落点；压缩字段说明表与 G-2 示例块，保留逐字锚点 | ①③ | ADR-002、ADR-011、ADR-023 |
| `skills/spec-specify/templates/spec-template.md` | 补一句指回 `## 验收面`；补 `## 速读卡（30 秒）` 与 `## Appendix A` 长度骨架 | ①③ | ADR-019、ADR-023 |
| `skills/stage-handoff/SKILL.md` | `succeeded` 前置条件改为验收 phase 已完成；补降级项与风险承接人写作要求 | ① | ADR-003、ADR-017 |
| `runtime/review/stage-materials.json` | verify-code 的 `forbidden` 放开；`semantic_fields` 与同轨 `required` 及 `optional` 逐 key 对齐 | ① | ADR-006、ADR-013 |
| `runtime/review/review-packet-identity.mjs` | `REVIEW_FOCUS["verify-code"]` 末句改写 | ① | ADR-006 |
| `runtime/review/review-policy.mjs` | verify-code 审查面放开到验收产物 | ① | ADR-006 |
| `runtime/review/schemas/result.schema.json` | 回执新增 `conclusion` 与 `coverage`，同步 `required` | ① | ADR-006 |
| `runtime/review/canonical-review-result.mjs` | 聚合与校验宿主侧结论 | ① | ADR-006 |
| `runtime/review/provider-material-projection.mjs` | 件一修实 1 行 | ① | ADR-007 |
| `skills/wh-review/scripts/__tests__/material-redaction.test.mjs` | 补 3 至 6 行断言 | ① | ADR-007 |
| `skills/wh-review/scripts/ac-evidence-summary.mjs` | 件二退役（删除） | ① | ADR-007 |
| `skills/wh-review/scripts/__tests__/ac-evidence-summary.test.mjs` | 件二退役（删除） | ① | ADR-007 |
| `skills/wh-review/skill-bundle.json` | 删该打包清单条目 | ① | ADR-007 |
| `tests/acceptance/card-03-current.mjs` | 清理 `ORACLE-FIX-002` 死引用 8 处 | ① | ADR-007 |
| `skills/wh-review/scripts/review-materials.mjs` | 同 key 判定对齐；direction 轨补校验；写清 `approved_direction` 逐字节校验归属 | ① | ADR-013 |
| `skills/wh-review/contracts/make-decision.md` | 补齐或删除非法 key；规定 `draft_spec_or_acceptance` 内容来源 | ① | ADR-013 |
| `runtime/evidence/acceptance-evidence-validator.mjs` | 只复用其 8 值档位词表，不新增档位词、不复用校验器本身 | ① | ADR-014 |
| `skills/decision-log/SKILL.md` | 加编号写作规则；第 6 条（`:17`）补动态模块同步点——现有 10 条中无一条讲动态模块，需新增该语义 | ③④ | ADR-023、ADR-029 |
| `skills/spec-prd/templates/prd-template.md` | 补 `## 实测记录` 节骨架；16 字段说明后补「每字段只写该卡增量」 | ③ | ADR-023 |
| `skills/spec-prd/SKILL.md` | 加四条编号写作规则与显式声明 | ③ | ADR-023 |
| `skills/spec-specify/SKILL.md` | 三处「不复制」合并成一条编号清单 | ③ | ADR-023 |
| `skills/spec-plan/SKILL.md` | 补「只写该 Task 的增量」与逐字清单例外 | ③ | ADR-023 |
| `workflows/make-decision/steps.json` | 重排步骤顺序，`step_id` 重编为连续整数 | ④ | ADR-024 |
| `workflows/make-decision/SKILL.md` | 同步步骤编号与方法；第 7 条补动态新增大纲模块 | ③④ | ADR-023、ADR-024、ADR-029 |
| `workflows/make-decision/skill-deps.yaml` | 同步 `trigger`；新步骤引入新技能时增 `skills` 列表项 | ④ | ADR-024 |

明确不改：`runtime/**` 中上述清单以外的文件、`tests/**` 中上述清单以外的文件、`REVIEW_FOCUS` 的其它字符串、`skills/*/steps.json`、`skills/wh-review/contracts/*.md` 中上述清单以外的文件、`skills/debate/references/output-template.md`、`skills/spec-tasks/templates/index-template.md`、`docs/architecture/test-asset-governance-rules.md`、`docs/architecture/move-map.json`、`CONSTITUTION.md`。

## 整体成败怎么算

### 目标

把 workflowhub 的功能验收做成一条可执行、可判定、可复核、可回写的强链路，覆盖「需求期定验收 → 计划期写 user case 与逐 phase 验收标准 → 实现期基于代码与接口与 UI 测试并做效果评测 → 独立验收 phase 端到端跑完所有 user case → verify-code 检查验收产物合理性」，并保持与现行宪法和治理边界一致。

### 成功与失败边界

| 主题 | 成功条件 | 失败条件 |
| --- | --- | --- |
| 判据覆盖 | 用户五个问题逐条被可重放的判据覆盖 | 只加文档不加可执行判据，重演记账 phase |
| 载体 | 验收面到 AC 到 Phase 到证据的关系在模板层锁死 | 把 `## 验收面` 当第二套判据权威 |
| 验收 phase 形态 | 普通 phase，`gate_cmd` 逐条给档位并附独立证据指针 | 退化成只数条数、不判语义 |
| 完成信号 | 验收 phase 未完成前 build-code 不置 `succeeded` | 验收 phase 未完成而阶段已置 `succeeded` |
| 审查面 | verify-code 审查面放开，回执含宿主侧 `conclusion` 与 `coverage` | 要求 provider 给 verdict |
| 破损件与登记 | 件一修实、件二退役，新增契约条目登记齐全 | 新增契约条目无登记（孤儿机制） |
| 控制面 | 未新增 stage、gate、审查点或第二套进度权威 | 新增 stage 或 gate |
| 功能验收记录 | verify-code 产出独立成件的功能验收记录 | 以代码审查冒充功能验收，或缺少该记录 |
| 材料契约 | key 集对齐，direction 轨有校验 | 仍不一致，或 direction 轨仍无校验 |
| 执行事实 | 五类执行事实齐备，证据按形态分类，重跑通过记 `flaky` | 只有摘要或单一 SHA256，无任何执行事实 |
| 复验 | 独立上下文，F2P 与 P2P 双门，分母非 0 | 自证、只跑一条、分母为 0 判通过 |
| 变更批准 | 独立审查批准并留影响评估 | 静默改 AC 或用例，或纯重构改既有测试 |
| 证据绑定 | 具名路径对应，降级项有风险承接人 | 无具名证据路径，或降级项无承接人 |
| 验收结论 | 独立成件，含局限、偏差、残留风险与签核对象 | 只报「全部成功条件达成」 |
| 形状权威 | 唯一权威在 spec，两处 AC 编号同号 | 为统一形状新增 schema、校验器或测试 |
| 防自证 | 五条禁令成立，判定器要求显式通过元素 | 删到变绿、用授权文本自证、用计数代替逐条、把降级值写成 `pass` |
| 分诊 | 先分诊，`Disposition` 落在自定词表内，回写五项齐备 | 未分诊即修，或关闭而不给 `Disposition` 与 `Closed by` |
| 反哈希 | 全程无哈希或版本相等判定 | 出现「要求哈希相等或版本相等才推进、才审查、才测试、才通过」的措辞或机制 |
| 回收 | 46 项逐条有处置，硬禁令 17 条全满足，改动面 27 个既有文件、零新建 | 把 `F-024` 判为不拿回的 5 项任一项拿回，或回收中新增 gate、校验器、必填字段、schema、名词空间，或写回哈希或版本相等判定 |
| 档位词 | 只用既有 8 值词表 | 自造档位词，或复用 `acceptance-evidence-validator.mjs` 的校验器本身 |

## 范围与非目标

### 范围

- 改 workflowhub 仓库自身的验收机制：stage 步骤契约、材料内容契约、审查点、证据与判定、回写闭环。取证范围限定 CARD-01 与 CARD-03 两个任务。
- 增补：修 OI-021 与 OI-022 两处自身缺陷（U-010）。
- 增补：把十份调研的结论落成八条机制级 ADR（ADR-014 至 ADR-021）。
- 增补：card-06 两批越权删除回收（U-018）。
- 增补：文档精炼（U-019）。
- 增补：make-decision 步骤按大纲重组并支持动态新增大纲模块。
- 用户流程与结果只记索引和验收影响，细节进入 spec。

### 非目标

- 不新增 stage、gate、审查点、第二套进度权威、自审自判。
- 不恢复 JSON 外壳、快照树认证、材料身份或哈希校验、回执校验及其任何变体；不沿用 `ac-evidence-summary.v1` 的 hash 与 anchor 契约。
- 不通过哈希或版本来追踪质量：验收证据与被验对象以具名路径加纯文本引用对应，不作为推进、审查、测试或通过的前置。
- 不做 CARD-01 与 CARD-03 回放；不回填历史任务与在跑任务；不改 UI 页面（本仓无 `apps/`、无 `.tsx` 与 `.vue`）。
- 不把 RED 测试当 user case 载体；不新增名词空间（user case 复用既有场景卡编号空间）。
- 不新增 schema、校验器、测试、档位词；只复用既有 8 值档位词表。
- 不新增 flaky quarantine 台账、不新增 mutation 常态化依赖、不新增独立 contract-test 或 eval stage。
- 不照搬独立评审仪式与时间门禁（示例映射会议、两周浸泡期、基线重置与回退裁定流程、机读产物必需交付）。
- 不照搬 ASD-STE100 的英文许可词表与词数或句法硬上限，也不新增任何可读性校验器、评分器或字数门；不落地 ISO 24495-1 的读者试用原则。
- 不在本日志复述 26 项与 46 项的逐项裁定细节。
- 不重建任何被删的机器校验器、认证、receipts 或哈希绑定。
- 不拿回 `F-024` 判为不拿回的 5 项：`registry:` 与 `metrics_path:`、deep-research、版本化 JSON 块、`closureCheck`、`architect-code-review`；`closureCheck` 若将来要回归，须由独立立项裁定。
- 不改 `runtime/**` 的既有判定语义之外的运行行为，不改 `tests/**` 与 `docs/architecture/move-map.json`。

## 未决项

| OPEN | 未决内容 | 状态与解决者 |
| --- | --- | --- |
| OPEN-001 | 「强」落在契约、审查还是证据 | 已收敛：三类落点同时做，不是三选一（T-01 选全做）。 |
| OPEN-002 | user case 与验收标准的载体与字段结构 | 已收敛：决策日志新增 `## 验收面` 节与六项（原「复用场景卡加三字段」已按 T-07-03 撤回）。 |
| OPEN-003 | 独立验收 phase 的位置与任务内容 | 已收敛：build-plan 序列最后一个普通 phase，逐条执行 spec 全部场景卡。 |
| OPEN-004 | 验收数据的准备方式与状态模型 | 已收敛：能提前设计的必须提前设计，验收时只许补并标来源档位，缺数据保持 `incomplete` 或 `unavailable`。 |
| OPEN-005 | 失败修复复验闭环的承接机制 | 未收敛，移交 build-plan：本卡只锁闭环时序；移交条件等于治理登记完成且承接机制不新增 stage、gate、审查点。 |
| OPEN-006 | verify-code 检查验收产物的形式 | 已收敛：放开审查面，前提是回执先有宿主侧结论字段。 |
| OPEN-007 | make-decision 的验收交接契约与 user case 载体形态 | 已收敛：交接契约前移为可观察结果与步骤序列，载体为 `## 验收面` 节（载体经 T-07-03 重定）。 |
| OPEN-008 | 本次改动自身的验收标准 | 已收敛：针对性测试加一次独立审查，不做回放。 |
| OPEN-009 | 阶段 `succeeded` 何时可置位、反证如何降级留痕、由谁判定 | 已收敛：验收 phase 未完成前不得置 `succeeded`；降级留痕落在阶段工作陈述与 handoff md，不落 facts，不是新 gate。 |
| OPEN-010 | 件一盘符脱敏污染与件二破损件怎么处置 | 已收敛：件一修实，件二显式退役。 |
| OPEN-011 | 新增机制的治理登记与零引用扫描、Runner 发布清单 | 已在本阶段完成登记：见 `### OI-020 治理登记` 的 12 条。 |
| OPEN-012 | `semantic_fields` 与同轨 `required` 及 `optional` 不一致 | 已在本卡范围内决定修复：逐 key 对齐，补齐或删除非法 key（ADR-013）；owner 等于 build-code。 |
| OPEN-013 | 审查材料契约与实现的边界未对齐、direction 轨无校验器 | 已在本卡范围内决定修复：补齐或删除非法 key、补 direction 轨校验、写清逐字节校验归属、规定内容来源（ADR-013）；owner 等于 build-code。 |
| OPEN-014 | card-06 的 26 项越权删除拿回多少 | 已收敛：并入 46 项总账（A01 至 A27 与 B01 至 B19），逐项裁定，落点 27 个既有文件、零新建（U-018）。 |
| OPEN-015 | card-06 同批 `6da46d6d` 是否同口径审一遍 | 已收敛：该批次 19 项（B01 至 B19）并入 46 项总账，拿回 6、部分拿回 12、不拿回 1（U-018）。 |
| OPEN-016 | `docs/architecture/test-asset-governance-rules.md:9` 把 decision-log 验收标准表错指给 `node tools/cli/check-decision-log-chain.mjs specs/<task>/decision-log.md`，而该工具 `:15` 与 `:53` 的 `CHAIN_FIELDS` 只读 `D-\d+` 四链字段 | 只登记，不顺手修（F-019 `:290-294`）；解决者等于 build-plan 或后续卡。 |
| OPEN-017 | F-036 的 D1 至 D9 与用户 m01418 的字面 8 步清单有 9 处差异，已由用户在 m01800 与 m01807 逐项裁定 | **已关闭**。用户 m01800 裁定不采纳四处新增；m01807 改判 2b、3b、4b 可以加、三处语义限定保留。最终结果：ADR-024 定稿为 15 步（11 步重排加 4 步新增），5b 模块级细节审查不采纳，ADR-025 至 ADR-029 全部保留。**无遗留待办。** |

OI 编号与问题的逐字原文见 `log-archive-decision-outline.md`（YAML）与 `log-archive-moved-sections.md`（OI 记录）。

## 验收面

### 验收标准

本卡 20 条验收标准（AC-01 至 AC-20）。每条给出可观察用例、成功条件、失败条件、证据、承接负责人与对应 UC。AC 判据的唯一权威在 spec 的 `## Appendix A`，本表是交接索引（ADR-019）。

| AC 编号 | 可观察用例 | 成功条件 | 失败条件 | 证据 | 承接负责人 | 对应 UC |
| --- | --- | --- | --- | --- | --- | --- |
| AC-01 | `decision-log.md` 的 `## 验收面` 节存在，20 条验收标准逐条给出六项；`skills/decision-log/templates/decision-log-template.md` 的节清单含 `## 验收面` | 节存在；20 条逐条六项非空；AC 编号连续；模板节清单含该节 | 节缺失，或任一条缺字段，或模板节清单未含该节 | `sed -n '/^## 验收面/,/^## 风险/p' decision-log.md` 原始输出加模板节清单读取记录（命令、exit code、落点） | make-decision 执行者（本卡）；模板改动承接方等于 build-code | UC-001 |
| AC-02 | `skills/spec-plan/templates/phase-template.md` 契约头出现 `覆盖 AC` 字段（写入集 `:28`、`gate_cmd` `:31`、`Done` `:35`、字段对照表 `:131-134`） | 字段落地且 `validatePostPhaseContract`（`runtime/stage/stage-content-contracts.mjs:1010`）返回 `ok: true` | 字段缺失，或校验未通过 | 模板契约头读取记录加校验命令与 exit code 与输出落点 | build-plan 执行者 | UC-002 |
| AC-03 | 验收 phase 的 `gate_cmd` 对每条 AC 输出一个档位并附一条独立证据指针 | 每条 AC 恰好一个词表内档位（`runtime/evidence/acceptance-evidence-validator.mjs:6` 的 8 值）并附一条独立证据指针 | 用计数代替逐条判定，或出现词表外档位 | 逐条核对记录加 `gate_cmd` 原始输出与落点 | 验收 phase 执行者 | UC-002 |
| AC-04 | 验收 phase 未完成（含失败修复复验闭环）时 build-code 阶段事实不出现 `succeeded` | 构造并重放负例，断言 build-code 阶段未置 `succeeded` | 验收 phase 未完成而阶段已置 `succeeded`（重演 F-006-R1 与 CARD-01 事故） | 负例构造脚本加重放原始输出加阶段事实读取记录 | build-code 执行者 | UC-003 |
| AC-05 | verify-code 审查面已放开（`runtime/review/stage-materials.json` 的 `forbidden` 与 `runtime/review/review-packet-identity.mjs:13` 的 focus 末句已改），回执含 `conclusion`（取值 `pass`、`pass_with_findings`、`needs_revision`、`reject`、`inconclusive`）与 `coverage` | 正例与负例各跑一次 verify-code 审查，回执均含 `conclusion` 与 `coverage`；空 findings 记 `no_findings_returned` 而非 `pass` | 回执缺 `conclusion` 或 `coverage`，或出现 `verdict` 字段（`runtime/review/canonical-review-result.mjs:362-364`），或把空 findings 当通过 | `node tools/cli/stage-runtime.mjs review --action=record --stage=verify-code` 正例与负例回执原始件（`adjudication` 在 `runtime/review/schemas/result.schema.json:630`，`const: "wh-review-adjudication.v1"` 在 `:638`） | verify-code 执行者 | UC-005 |
| AC-06 | `runtime/review/provider-material-projection.mjs:15` 修实后正则字面量 `\d\d:\d\d` 不再被脱敏；`skills/wh-review/scripts/ac-evidence-summary.mjs` 退役后零死引用 | 跑 `skills/wh-review/scripts/__tests__/material-redaction.test.mjs` 通过；对 `tests/acceptance/card-03-current.mjs` 的 `ac-evidence-summary` 死引用扫描（原 8 处：`:121`、`:131`、`:162`、`:163`、`:463-475`、`:580`、`:583-584`、`:806-819`）零命中 | 脱敏仍吃掉正则字面量，或死引用仍有命中，或保留活门 | 测试原始输出与 exit code 加死引用扫描命令与输出 | build-code 执行者 | UC-005 |
| AC-07 | `### OI-020 治理登记` 的 12 条（① 至 ⑫）每条六项齐全：唯一 consumer、owner、替代了什么、删除条件、仓库级 `docs/adr/0030-…` 的零引用扫描结果、Runner 发布清单 | 逐条核对六项写全；跑仓库级 `docs/adr/0030-…` 的零引用扫描；核对 Runner 发布清单 | 任一登记缺项，或新增契约条目无登记 | 逐条核对记录加零引用扫描输出加 Runner 发布清单读取记录 | make-decision 执行者与 build-code 执行者 | UC-001 |
| AC-08 | verify-code 侧存在一份独立功能验收记录，与终末代码审查回执分开成件（两份原始件、各自路径），记录逐条给出结论与独立证据指针 | 两份原始件各自存在、各自有路径；功能验收记录逐条有结论与证据指针 | 缺少独立功能验收记录，或以代码审查冒充功能验收 | 两份原始件路径与内容；依据 CARD-10 `specs/archive/workflowhub-thin-core-card-10-20260919/decision-log.md:1206` 的 `DIR-D1-T6` | verify-code 执行者（产出）；独立审查（判定） | UC-006 |
| AC-09 | detail 轨与 direction 轨的 `semantic_fields` 与同轨 `required` 及 `optional` 逐 key 一致（detail `:35-43` 对 `:269-286`；direction `:12-23` 对 `:240-268`），且 direction 轨有校验 | 逐 key 对齐，无「两者都不含」的 key；`approved_direction` 逐字节校验归属写明；`draft_spec_or_acceptance` 的合法内容来源明文规定 | 仍有 key 既不在 `semantic_fields` 也不在同轨 `required` 或 `optional`，或 direction 轨仍无校验 | 四段改后原始字节与路径；逐 key 比对表；`skills/wh-review/contracts/make-decision.md` 改后内容；`skills/wh-review/scripts/review-materials.mjs:167-188`、`:229-234`、`:393-401` 改后内容 | build-code；独立审查（判定） | UC-007 |
| AC-10 | 验收 phase 文件每条结论旁能找到五类执行事实（命令与参数、cwd 与执行者、exit code 与 signal 与 timeout、原始输出落点、机器可读报告含 runner 与版本）；`refs` 逐项标明形态分类；出现「首次失败加重跑通过」时档位记 `inconclusive` 并标 `flaky`；效果评测写清跟什么比、指标与统计量、原始输出落在哪个具名文件 | 五类执行事实齐备；`refs` 每项可分类；重跑通过记 `flaky`；效果评测有对比基线与指标；本仓无 UI 时须写一句具名判据说明为何不适用（判据缺失即未达成） | 只有摘要或单一 SHA256 而无任何执行事实；`refs` 出现无法分类的引用；重跑通过记 `pass`；效果评测只有单点数字或无可对比基线；未写 UI 面判据；出现环境指纹、产物 digest、哈希或版本相等判定；用覆盖率数值或测试数量当通过判据 | 验收 phase 文件加五类执行事实原始件；依据 `runtime/evidence/acceptance-evidence-validator.mjs:6` 的 8 值词表与 `F-011:332`、`:435-448`、`:451` | 验收 phase 执行者（产出）；独立审查（判定） | UC-008 |
| AC-11 | 复验记录写明复验者与修复者的上下文差异（换 subagent 的具体身份，或换 provider 的具体 provider 名）；同时列出 F2P 用例与 P2P 用例清单且两者计数均大于 0；写明所跑回归范围与「为什么这个范围是这次修改的保守超集」 | 四项齐备；`pass` 只在「F2P 大于等于 1 且 P2P 全绿且分母非 0 且复验者不等于修复者上下文」时给出 | 复验由修复者本人或同一上下文判定；只跑失败那一条；分母为 0 判通过；无 P2P 门；F2P 小于 1 却记 `pass` | 复验记录加 F2P 与 P2P 清单加回归范围说明；依据 `F-013:256`、`:279-282`、`:290`、`:294`、`:301`、`:309`、`:569`、`:738` | 修复者之外的复验执行者；独立审查（判定） | UC-004、UC-008 |
| AC-12 | 任何 AC 或用例集合的增删改在验收 phase 文件里可回读到三项：独立审查批准（批准者身份）、`Rationale for Change`、`Impact Assessment`；纯重构不改既有测试 | 三项齐备，且批准者非实现者本人、非同一上下文 | 静默改 AC 或用例；纯重构改了既有测试而无影响评估；改断言消音而未判定为语义变更 | 验收 phase 文件三项记录加批准者身份；依据 `F-013:575`、`:578`、`:589`、`:591`、`:593-596`、`:656-664` | 变更发起者；独立审查（批准与判定） | UC-008 |
| AC-13 | 每条验收结论旁能找到具名证据文件路径（纯文本，人读可定位，不出现哈希或版本相等判定）；`deferred`、`unavailable`、`incomplete` 行同段有风险承接人署名；handoff 阶段工作陈述显式列出取降级值的是哪条 user case、原因与风险承接人；新记录不含 `snapshot_tree`、`source_digest`、`material_revision`、`freshness` | 具名证据路径齐备；降级项有风险承接人署名；handoff 显式列出降级项；退役字段零出现 | 无具名证据路径；降级项无风险承接人；出现退役字段；出现 `rebind`、`reopen`、`replacement review`；出现哈希或版本相等判定 | 验收结论原文加 handoff 原文加退役字段零命中扫描记录；依据 `F-018:243-245`、`:303-321`，`F-014:355-357`、`:410-412`，四个退役字段的现存出处 `contracts/facts-subschema.json:17`、`:26`、`runtime/review/schemas/attempt.schema.json:68`、`:173`、`runtime/evidence/acceptance-evidence-validator.mjs:29`（`runtime/evidence/research-report.mjs:382` 只覆盖其中两个，作范式出处），U-017（V-017） | 验收 phase 执行者（写声明）；独立审查（判定） | UC-008 |
| AC-14 | 验收 phase 自己的文件（`phases/P<n>.md` 固定小节）里六项逐项非空：评估（含局限）、与计划的偏差及原因、未充分测试的特性及原因、未解决事件（逐条）、残留风险、签核对象；另有入口准则逐条核对结果，以及数据就绪报告与环境就绪报告各一份、独立成件、各含 status | 六项齐备且各自非空；入口准则逐条核对；两份就绪件独立成件并各含 status | 结论只报「全部成功条件达成」而不写局限、偏差或残留风险；缺入口准则；缺就绪件（以夹具描述代替）；未解决事件被合并成一句「部分失败」；新增独立验收报告文件类型 | 验收 phase 文件加入口准则核对记录加两份就绪件；依据 `F-012:158`、`:162`、`:210-214`、`:218-222`、`:241-244`、`:248-255`、`:259-267`、`:275-289` | 验收 phase 执行者（产出）；独立审查（判定） | UC-008 |
| AC-15 | spec 的 `## Appendix A` 保留「唯一权威」措辞与四行式（`验证：`、`通过：`、`失败：`、`证据：`）；`skills/decision-log/templates/decision-log-template.md` 节清单含 `## 验收面` 且声明为索引；两处 AC 编号集合逐条同号；`runtime/` 下零新增校验器 | 四项成立，且 `grep -rn '验收面' runtime tools tests lib config workflows` 仍为 0 命中 | 把 `## 验收面` 当第二套判据权威；为统一形状新增 schema、校验器或测试；改动 `runtime/stage/stage-content-contracts.mjs:664` 正则 | 两处模板改后原文加 AC 编号比对表加 grep 零命中输出；依据 `F-019:205-210`、`:214`、`:231-232`、`:244-246`、`:274`、`:282-286` | build-code（模板层改动）；独立审查（判定） | UC-008 |
| AC-16 | 验收记录里逐条 AC 各一行结论（结论行数与 AC 条数可比对）；黄金清单（用例集合）改动可回读到另一个主体的批准；不存在「无失败即通过」的判定；不存在改断言消音、用授权文本自证或漂白 | 四项成立；判定器要求显式通过元素而非「无失败即通过」 | 用授权文本（`approved_direction`、授权回执、任务书措辞）验证授权文本；测试变红改断言且未走 ADR-016 批准链；黄金清单改动无另一主体批准；用计数代替逐条；把 `incomplete`、`unavailable`、`missing`、`unverified` 写成 `pass` 或 `succeeded` | 验收记录加黄金清单变更记录加判定器原文；依据 `F-012:148`、`:158`、`:234-237`、`:259-267`，`F-014:317-325`、`:345`，`F-010:537`、`:539` | 验收 phase 执行者；独立审查（判定） | UC-008 |
| AC-17 | 每条失败有分诊结论（含是否可复现、`Version detected`、`Severity`、`Priority`、`Disposition` 初值 `Pending`）加终值 `Disposition`（落在自定词表 `Fixed`、`Won'tFix`、`Deferred`、`AcceptedRisk`、`Duplicate`、`NotABug`、`Referred` 内）加取不修取值时的理由与风险接受人署名加关闭留痕（`Closed by`、`Date closed`、`Change reference`、`Test reference`、`Closure Notes/Verification Status`）加回写五项（含第⑤项这次修复本身的记录） | 分诊四项加终值 Disposition 加关闭留痕加回写五项齐备；分诊者不等于实现者 | 失败未分诊即修；`Disposition` 取值在词表外；取不修取值而无理由与风险接受人署名；关闭而不给 `Disposition` 与 `Closed by`；回写五项缺一 | 分诊记录加关闭留痕加回写五项原文；依据 `F-013:561`、`:565`、`:570`、`:571`、`:604-609`、`:613-618`、`:644-652`、`:702` | 分诊者（与实现者不同的主体）；独立审查（判定） | UC-008 |
| AC-18 | 回收 phase 产物上能逐条读到 46 项处置与落点（拿回、部分拿回、不拿回三值之一，与 `F-024 §一` 一致），且 `F-024` 判为不拿回的 5 项在仓库里仍不出现（`config/workflowhub.yaml` 无 `registry:` 与 `metrics_path:`；`skills/decision-log/templates/decision-log-template.md` 无 `workflowhub-research-candidate-delivery.v1` 块；`skills/workflowhub-multica-sync/scripts/multica-skill-sync.mjs` 无 `closureCheck`） | 27 个既有文件按 `F-024 §二` 分组改到位（`workflows/**` 9、`skills/**` 16、`docs/**` 1、`tests/**` 1）；`git status --porcelain` 无新增文件；硬禁令 17 条逐条满足 | 新增 gate、校验器、必填字段、schema 或名词空间；写回哈希或版本相等判定；5 项不拿回项被拿回；46 项任一项无处置或处置与 `F-024` 不一致 | `F-024-pullback-consolidated-ledger.md` 原文加 46 行逐项处置清单加 `git status --porcelain` 与 `git diff --name-only` 原始输出加硬禁令 17 条逐条核对记录 | 回收 phase 执行者；独立审查（判定）；逐项裁定权威等于 `F-024` | UC-009 |
| AC-19 | 精炼 phase 产物上能读到 8 个既有文件的固定骨架（文档头两行 `读者：` 与 `读完要能：`、可预测标题、每节第一句「本节回答：」、`## 补充材料` 尾部小节）与生成这些文档的 `SKILL.md` 中的编号写作规则清单，清单里能读到显式声明「这是写作指引，不是质量门」与允许的例外；`## UI 判定` 与 `## 收敛检查` 两节在模板里由 0 命中变为存在 | `F-027 §7.1` 的 8 个既有文件改到位；`git status --porcelain` 无新增文件；`F-026 §四` 的必保锚点逐条不变（该表 26 行含表头与分隔行，实锚点 24 条），其中 `skills/spec-plan/templates/phase-template.md:35`、`:50`、`:54` 三句与 `:198-217` 的 G-2 示例块逐字未改 | 新增任何自动校验器、评分器、阻断门、许可词表或字数门；新增 gate、审查点、必填字段、schema、名词空间或档位词；改动 `runtime/**`、`tests/**`、`docs/architecture/move-map.json`；改坏必保锚点中任一项 | 8 个文件改后原文加锚点逐条比对记录加 `tests/acceptance/card-03-current.mjs:280,285,290,343` 与 `tests/contract/post-build-plan-missing-index.test.mjs:332` 通过记录 | 精炼 phase 执行者；独立审查（判定）；锚点权威等于 `F-026 §四` | UC-008 |
| AC-20 | `workflows/make-decision/steps.json` 的 15 步顺序与 ④ 的 `### 要交付什么` 清单一致（载入与范围分诊 → 大纲 talk → 内外部调研 → 大纲回改判定 → 方向 talk → 轻量对抗性检查 → 方向审查 → 全模块广度确认 → 逐模块确认与需求 talk → 细节审查（整体） → grill → 写草稿 → 用户确认 → 一致性核对 → 交接）；中途新增需求时同一决策日志新增一个大纲模块并补齐调研、决策、方案与验收标准 | 步骤顺序与目标顺序一致；`step_id` 为连续整数；大纲显式标注为可修改假设；新增模块不新增步骤、不新增 schema、不新增名词空间；两次审查各自写明 Kill 与 Recycle 权限与判据 | 步骤顺序与目标顺序不一致；新增模块需要新增步骤或 schema；出现硬编码步数断言；新增 gate 或校验器；大纲被写成基线或承诺了范围与成本；审查未写权限即记通过；把细节审查拆成逐模块审加整体审两级 | `F-035-make-decision-step-machine.md`、`F-036-external-discovery-sequencing.md` 第 3 节加改后 `workflows/make-decision/steps.json` 与 `workflows/make-decision/SKILL.md` 原文 | make-decision 步骤改造执行者；独立审查（判定） | 无（本轮新增，未登记 UC） |

## 风险、延期与退役登记

### 风险与延期交接

| id | 风险或延期内容 | 触发与后果 | 处理阶段与 owner |
| --- | --- | --- | --- |
| RISK-001 | 验收 phase 的 `gate_cmd` 只数条数，不逐条给档位与独立证据指针 | 触发等于验收 phase 内容仍是计数；后果等于重演 CARD-01「阶段先宣告成功、之后才发现端到端验收从未做」；本任务不做回放，故该风险不被实证排除 | 缓解等于 ADR-002 的肯定规则；owner 等于 build-plan 阶段与验收 phase 执行方 |
| T-02 遗留风险 | CARD-03 的终末 phase P6 只做一次聚合（一条 `AC-ACC-001` 加 15 条现有 active AC 行，靠一条 `gate_cmd` 判定，见 `specs/archive/workflowhub-thin-core-card-03-20260919/phases/P6.md:8`、`:12`），而该卡 23 条 AC 有 16 条从未真正执行（F-002）；若验收 phase 内容仍是计数与聚合，T-02 的处置失效 | 触发等于验收 phase 复用「登记加全量跑加记账」形态 | 缓解等于 ADR-002；owner 等于 build-plan 阶段 |
| 已知限制 | 不实证证明能拦住假绿、P6 记账、端到端验收缺失、major 零处置 | 触发等于把本卡机制当成已实证有效 | owner 等于 build-plan 与 verify-code 承接实证；见 ADR-009 的已知限制 |
| 取证限制 | F-004 只扫了 Codex 全库 20,791 文件、51 GB 中的两天（419 MB），更早日期未扫；Codex 到 DSH 的接力关系未核对 | 触发等于把两天内的观察当成全量结论 | owner 等于后续调研；缓解等于如实标注覆盖范围，不外推 |
| F-036 反面证据 | 外部来源反对把 discovery 做成一个独立阶段（Torres 逐字 `Don't think about discovery as a phase`；Lipiec 逐字 `the image of the "big research up-front" as the best practice`），直接命中第 3 步的形态；ADR-025 的可修改假设限定只避开了 Shape Up 那一支 | 触发等于把第 3 步当成已经外部证成的独立阶段 | owner 等于 build-plan 阶段；缓解等于 ADR-025 的语义限定，且本条不得被摘要成「外部一致支持」 |
| F-036 单源判据 | 重开集判据（ADR-028）来自 Szlenk et al. 的单一学术提案，作者自称该问题 `has not been given much attention`，Gerdes et al. 2014 独立确认 traceability 支持 `not yet sufficiently provided` | 触发等于把该判据当成成熟标准 | owner 等于 build-code 实现者；缓解等于同时写工程近似（从最高抽象层向下级联），并标注为单一学术提案 |

### 质量边界

- 质量事实：本日志已取得用户最终确认。用户在 m01493 逐字答复 `确认，继续往下吧`，是对 m01492 展示内容（549 行、80,492 B 的重写结果，四条如实限制，方向、范围、风险与验收面要点）以及此前全部 Talk 与 grill 轮次的真实确认；不是推断，也不是默认。确认之后本日志只做了追加：Append-only 更正、编号指针与短名对照表、以及 step 11 核对发现的定点更正；已确认的判据、范围与非目标均未改动。
- 版本绑定：本日志未纳入版本控制，故 step 11 核对覆盖的版本与最终交付版本的 sha256 记在 step 12 的 make-decision 交接件（`quality/evidence/handoff/`），本文件内不重复。
- 推进资格：已取得确认，可进入 build-plan。
- 完成判据：step 10 已取得用户真实确认，step 11 一致性核对完成并已处置其高严重度发现，step 12 交接件发布。
- 未闭合缺口：无。F-036 已交付并把 ADR-024 的步数定稿为 15 步（用户 m01800 与 m01807 逐项裁定）；其反面证据与单源判据按上表登记为风险，不当作已排除。
- 不可逆授权边界：本阶段未对 main 做任何 push、archive、cleanup，也未提交任何交付物。已发生两件由用户指示的引导动作：创建 worktree 与分支，以及把 main 合入本 worktree 分支（`be393a6e` → `b954b9a3`，合并的是 card-10 归档等 main 侧提交）。两者都属任务引导，不是交付授权。

### 退役登记

| 日期 | 退役对象 | 为什么退役 | 谁决定 | 原需求编号 |
| --- | --- | --- | --- | --- |
| 2026-10-06 | `skills/wh-review/scripts/ac-evidence-summary.mjs`（1,196 B、11 行） | 它保护的是流程形状与机器认证，撞 `prd.md:404` 的 FR-32、`prd.md:401` 的 FR-29、`prd.md:96` 的 SD-17；生产 consumer 零引用 | 用户委派判定权给主会话加 F-007 判定 | OI-013、FR-29、FR-32、SD-17 |
| 2026-10-06 | `skills/wh-review/scripts/__tests__/ac-evidence-summary.test.mjs`（10,171 B、157 行、9 个 `it`） | 它要求的正是 FR-57 与 AC-58 禁止的材料身份与哈希绑定；FR-32 只保留真实安全、失败、数据完整性测试；oracle 当前 9 比 9 红（`createTaskKernel is not a function`），不得漂白成「删掉一个通过的检查」 | 同上 | OI-013、FR-32、FR-57、AC-58 |
| 2026-10-06 | `skills/wh-review/skill-bundle.json:18` 的打包清单条目 | 随实现与测试整体退役，不换名搬进 Skill；不退役则 Runner 会持续发布零 consumer 的脚本 | 同上 | OI-013、FR-32 |
| 2026-10-06 | `tests/acceptance/card-03-current.mjs` 的 `ORACLE-FIX-002` 死引用 8 处（`:121`、`:131`、`:162`、`:163`、`:463-475`、`:580`、`:583-584`、`:806-819`） | `ORACLE-FIX-002` 引用的 schema 不存在、测试 9 比 9 红，是活 oracle 引用已死机制；移除后不得保留活门 | 同上 | OI-013、FR-29、SD-17 |

### Supersedes

无。

### Append-only 更正

1. 本日志的 `## 验收面` 形状：旧版为「9 条 UC 块加 19 条 AC 块」两套五字段叙述；重写后合并为一张 AC 表（20 行），UC 编号移入「对应 UC」列。判据不变。
2. AC-07 的条数：旧版写「11 条（① 至 ⑪）」，实测登记为 12 条（① 至 ⑫，含 ADR-023 的精炼 phase 登记）。判据不变，只更正数字。
3. AC-19 的文件数：旧版写「`F-026 §五` 的 6 个既有文件」，实测应为 8 个（`F-027 §7.1`）。判据不变，只更正数字。
4. 历史提交号：`runtime/stage/step-manifest.mjs` 不是 `77de3608` 删的，而是 `457299b3 refactor: complete Card-06 core retirement and migration`；`git show 77de3608^:workflows/make-decision/steps.json` 改前是 13 步（step 12 `publish-decision`、step 13 `stage-reflection`），HEAD 合并为 `stage-handoff`，所以变化是「7 字段变 3 字段，且 13 步变 12 步」。
5. AC-01 的旧落点更正（T-07-03）：`### 本任务的验收标准（对应问题①）` 第 1 条的落点（`skills/spec-specify/templates/spec-template.md:60-64` 的 SCN 三字段与 `:221` 起的追踪表 `SCN` 列）已撤回；该节属 step 8 历史草稿，按禁改保留原文。
6. AC-09 证据中的哈希改为路径，因为 U-017 禁止用哈希或版本追踪质量。
7. ADR-023 的 `为什么` 里的旧尺寸：旧版写「实测 2,292 行、482,094 B」与「约 210 B 每行」，是更早修订的过期实测；已改为本轮重写前的 1,854 行、326,870 B（更早一版 2,354 行、511,939 B，约 217 B 每行）与本轮重写后的 548 行、80,069 B（交付值）、549 行、80,492 B（展示给用户的版本）。判据不变，只更正数字。
8. step 11 一致性核对（F-037）的处置：① 删去悬空的 `U-020`，④ 的授权来源改引用户 m01418 与 F-035、F-036；② 两处行号更正（`check-decision-log-chain.mjs:5` 改 `:15`；`spec-template.md:218` 改 `:221` 起）；③ 一处符号错配更正（`validateMaterialAllowlist` 在 `review-materials.mjs:384`，不在 `:167-188`）；④ 四个退役字段各自补真实出处（`research-report.mjs:382` 只覆盖两个，降级为范式出处）；⑤ `skills/decision-log/SKILL.md` 的动态模块同步点统一到第 6 条（`:17`），并把两处 `ADR-025` 引用改为重编号后的 `ADR-029`；⑥ 补「短名到路径对照」与「Talk 批次到落点」两张表；⑦ 把 `skills/spec-plan/SKILL.md:28` 与 CARD-03 P6 的引文改为实跑可复算的表述（F-037 报这两条引文不成立，我复核后确认第一条成立、第二条不成立，只改了第二条）；⑧ 补 `## 原始需求` 与 `## 未决项` 的编号落点与默认路径，明确 UI 面判据与「不新增文件类型」的边界。判据、范围与非目标均未改动。
9. step 12 发布后的一次用户改判：ADR-024 的步数。发布前定稿为 16 步（含 F-036 建议的 2b、3b、4b、5b 与三处语义限定）。用户 m01800 先裁定「改回 8 步，你加的四步对整体质量提升不大，只会极大提升耗时和 token 消耗」，m01807 随后改判「2b、3b、4b 问题不大，可以加」并确认三处语义限定保留。**最终定稿为 15 步：11 步现有步骤重排加 4 步新增（大纲 talk、大纲回改判定、轻量对抗性检查、全模块广度确认）；5b 模块级细节审查不采纳。** ADR-025、ADR-026、ADR-027、ADR-028、ADR-029 全部保留。OPEN-017 随之关闭，无遗留待办。
10. build-plan 阶段的三处事实更正与三条裁定（依据 task store `quality/evidence/research/F-038-build-plan-writeset-partition.md` §四与 `F-040-build-plan-skeleton.md` §1）。事实更正：① `### 短名到路径对照` 的 task store 路径少一级 `/Hugh`，已原位改为 `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-acceptance-flow-hardening-20261006/quality/evidence/`；② ADR-007、AC-06 与 `### 退役登记` 的 `tests/acceptance/card-03-current.mjs` 死引用清单有误：`:583-584` 是 `ORACLE_DESCRIBES` 的通用展开，不是死引用，不得删除；AC-FIX-002 对象的实际边界是 `:805-820`（不是 `:806-819`）；清单漏了 `:26`（`FROZEN_VALIDATOR_RESULTS`，删 `:463-475` 后成孤儿）、`:151`（`ORACLE_IDS` 含 `ORACLE-FIX-002`）、`:430`（`criterionEnums()`，只服务 FIX-002）、`:507`（`schema_missing: schemaMissing`）四处；③ ADR-006 与 OI-020 第 ③ 条引用的 `runtime/review/canonical-review-result.mjs:362-364` 应为 `:361-364`（三元式从 `:361` 开始）。build-plan 裁定：Q2 改 `docs/architecture/move-map.json`（删 `:3214-3222` 的 `ac-evidence-summary.mjs` 条目，并从 `:1088`、`:1096` 的消费者列表删去 `ac-evidence-summary.test.mjs`），因为 AC-06 要求零死引用，过期登记就是死引用；`## 要改哪些文件` 与 `## 范围与非目标` 里「不改 move-map」是通用非目标，被 AC-06 的具体判据覆盖。Q5 改 `workflows/build-plan/steps.json`（A05 的 `completion_evidence[]` 声明字段），② 改动面由 27 个更正为 28 个既有文件，因为 `F-024` A05 行逐项列了 5 个 `steps.json`，§二汇总漏了一个。Q13 本次删除 `runtime/stage/stage-content-contracts.mjs` 的 OI YAML 解析死链（零调用者）；AC-15 的失败条件「改动 `:664` 正则」解释为「不许让该正则识别 `## 验收面`」，删除死链（`:664` 在其中）不算违反。判据、范围与其余非目标均未改动。
11. build-plan 审查（task store `quality/evidence/research/F-041-build-plan-wh-review.md` F041-05）发现的口径不一致：`### 改动面` 表第 `:404` 行把 `runtime/review/review-policy.mjs` 列为要改（「verify-code 审查面放开到验收产物」，ADR-006）。build-plan 裁定该文件只读（spec 澄清 Q4）：它只 import `runtime/review/stage-materials.json`，没有 verify-code 专属逻辑，所以 verify-code 审查面放开落在 P1 写集里的 `stage-materials.json` 与 runner focus 就够了；实现中若发现必须改它，P1 STOP 回主会话。`:404` 原文保留不改（append-only），以本条为准。
12. build-plan 结构分析（task store `quality/evidence/research/F-044-final-spec-analyze.md` F-11）发现的编号缺口：R-008、R-012 不在 `## 原始需求` 列表。R-008（验收成为很强的阶段、生成专业 user case 与验收标准）的内容由 R-001、R-002、R-004 覆盖。R-012（先调研 CARD-01、CARD-03 的会话与结果）已在 make-decision 完成，承接件为 task store `quality/evidence/research/F-001-card01-evidence.md`、`F-002-card03-evidence.md`、`F-003-mechanism-baseline.md`、`F-004-mp-acceptance-discussion.md`（见 `quality/evidence/log-archive-verbatim-and-talk.md` 需求映射 R-012 行）；make-decision 期的外部调研另见 `F-029-external-decision-record-design.md`。build-plan 不为这两条另设 Phase 或 Task。判据、范围与非目标均未改动。
13. build-code 期由 build-plan 材料 owner 澄清 P1/T002 的 STOP（2026-10-07，主会话核定；授权来源为用户本会话「确认计划，按照workflowhub标准严格执行build-code」及任务内自行解决问题要求）。原 STOP「某个 key 有写集外的生产者或消费者、删除它会改变 `review-semantic-projection.mjs` 的投影结果时停下」范围过宽，会禁止 ADR-013 已确认的非法 key 删除及同轨 key 对齐。当前两轨 8 个孤立 semantic key 未发现材料 producer；UI 判定对象与 verify-code UI 合同的同名字段不作为这两轨 producer。逐 key 来源与选择见 `phases/P1.md` 的「T002 key 对齐读回与 STOP 限定」，spec 澄清 Q21。只读 projection；字段清单因既定对齐改变不单独触发 STOP，删除会丢失当前真实审查输入或必须改写集外消费者行为时仍 STOP。未修改原 ADR-013，未改变方向、FR/AC、生产写集、冻结断言或历史原件；不新增 producer、许可、进度对象或用户确认门。

### 过程产物落点

本日志把过程产物移出到 task store 的 `quality/evidence/`。

| archive 文件 | 承接了什么 |
| --- | --- |
| `log-archive-verbatim-and-talk.md` | 原始需求与用户原话全节（R-001 至 R-016 映射、U-001 至 U-019 逐字、V-001 至 V-019、Talk 批次 T-01 至 T-08）、被否选项表、G1 至 G4 选项原文 |
| `log-archive-moved-sections.md` | OI-020 治理登记十二条逐字原文、OI 记录、必保锚点全表、调研出处 34 行登记表、② 逐项处置与硬禁令 17 条、失败了怎么退、OPEN 收敛状态、质量边界、过程产物落点原表 |
| `log-archive-decision-outline.md` | 22 条 OI 的 YAML 原文、框架节点表、固定类别表 |
| `log-archive-research-summaries.md` | 9 个 `#### F-00x 摘要` 全文（439 行） |
| `log-archive-review-dispositions.md` | 两轮审查处置表与结论 |
| `log-archive-step8-drafts.md` | `D-01` 至 `D-09` 原文与验收标准 7 条 |
| `log-archive-traceability-layers.md` | R 到 U 与 V 到决策到落点索引、原始声明层、三级追溯链、需求框架 |
| `log-archive-divergence-candidates.md` | 发散候选清单与可证伪大纲 |
| `log-archive-retrieval-and-doc-results.md` | 回收总账、精炼落点、调研候选交付、grill、最终确认、模块收敛、文档结果、退出检查 |
| `log-archive-final-exit-checks.md` | Grill 覆盖矩阵、退出检查四项 |

### 短名到路径对照

本日志里的裸文件名分属三棵树。按此表还原路径后才能 grep。

| 短名 | 真实位置 |
| --- | --- |
| `log-archive-*.md`、`F-0xx-*.md` | task store `/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-acceptance-flow-hardening-20261006/quality/evidence/`（调研件在其 `research/` 子目录） |
| `prd.md` | `specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md`（另有 `specs/archive/` 下同名件） |
| `phases/P6.md`（CARD-03） | `specs/archive/workflowhub-thin-core-card-03-20260919/phases/P6.md` |
| 其余 `runtime/`、`skills/`、`tools/`、`tests/`、`docs/` 路径 | 本 worktree 根目录下同名相对路径 |

### Talk 批次到落点

| 批次 | 落点 |
| --- | --- |
| T-01 | OPEN-001 |
| T-02 | 硬约束第 2 条；风险表 T-02 遗留风险 |
| T-03 | 硬约束第 2 条 |
| T-04 | ADR-005 |
| T-05 | ADR-004、ADR-007 |
| T-06 | ADR-009 |
| T-07 | ADR-013、ADR-018、ADR-019 |
| T-08 | ADR-014 至 ADR-021 |

逐字原文在 `log-archive-verbatim-and-talk.md`。

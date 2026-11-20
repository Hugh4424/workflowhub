# spec-analyze / build-plan 对账缺口审计与两段检查设计

- 类型：只读审计（未改任何源文件；本报告是唯一新增件）
- 日期：2026-11-19
- 对象：`skills/spec-analyze/`、`workflows/build-plan/`（步骤 6/9/10/11）、`skills/spec-plan/`（SKILL + phase-template）、decision-log 每包十项、现有 contract 测试与 review 输入
- 任务材料：`specs/execution-quality-build-code-hardening-20261119/decision-log.md`（v2，681 行，13 条需求，0 个 `AC-` 号）

## 0. 实测事实（本次真跑）

| 命令 | 结果 |
| --- | --- |
| `node skills/spec-plan/scripts/build-decision-baseline.mjs --decision-log <v2 日志>` | **exit 1**，`BASELINE_SOURCE_INVALID: no recognized 需求 source records` |
| `node tools/cli/check-decision-log-chain.mjs --file <v2 日志>` | exit 0，1 warning `no_decision_entries: no decision entries were recognized` |
| `npx vitest run tests/contract/spec-analyze-classes.test.mjs tests/contract/decision-evidence-consumption.test.mjs tests/contract/review-decision-baseline.test.mjs` | exit 0，119 passed / 2 skipped |

两条 exit 1/失明事实决定了下述设计：**新十项日志对现有机器检查不可见**，任何新增检查必须先能读到它。

## 1. spec-analyze 现在查什么

`skills/spec-analyze/SKILL.md` 是 lens-only、报告制、不写材料、不调 provider。

- **六类**（`:37`）：遗漏、矛盾、孤儿任务、越界、消费者、测试充分性；**第七类**读者可用（`:39`）。
- **五个时点**（`:56-62`）：方向定稿、日志定稿、build-plan 审前、build-plan 定稿后、build-code 完成。make-decision 分支（`:13`、`:58-59`）只有**逐句三态**（满足／被改写／丢失）＋缺口清单，产出并入 `requirement_coverage`（`:102`、`:109`）。
- **原始需求覆盖核对**（`:67-102`）：四段＝需求、方案、AC、Phase 承接；输出三段＝覆盖表／缺口清单／已声明不做；覆盖表列序是**需求编号、方案落点、AC 编号、承接 Phase、判定**（`:87`）。

**有无逐条需求→包/决定/验收表**：没有，且**不是 spec-analyze 在 make-decision 做的**。

- 覆盖核对明写「**post build-plan 收口前完整执行一次**」（`:69`），make-decision 时点只记「spec/Phase 尚未成稿属正常」（`:59`）。
- 现有 R→包/写集/决定 的落点检查在 **decision-log 的 coverage audit**（`skills/decision-log/SKILL.md:92`）+ `coverage-matrix-5d.md`（模板 `:636-640` 三栏＝来源、事实与处置、落点或缺口；`skills/decision-log/SKILL.md:62`），并且 make-decision 第 5/12 步已三次 `--file` 调链检查（`workflows/make-decision/SKILL.md:188,332`）。
- 所以「需求覆盖」今天是**两套半成品**：decision-log 侧有 R/U→包/写集/决定（无 AC 列），spec-analyze 侧有五列覆盖表（只在 build-plan 末跑）。

**缺什么（逐项）**

1. **无 AC 列值**：日志 0 个 `AC-`；每包「验收」是命令/反例/谁验的散文，无法与 spec Appendix A、Phase「覆盖 AC」join。模板本意是 AC 唯一权威在日志验收面（模板 `:556`），实写没落地。
2. **无 R 编号**：`## 原始需求（翻译后）`（日志 `:22`）用 `**需求 N**` 段落 + `落到：包 X`（13 条、13 个「落到」），无 `R-0xx`；模板要求 `source_id`／`需求 N` 表格形状，`build-decision-baseline` 的 `requirementHeading`（`scripts/build-decision-baseline.mjs:20`）不认「原始需求（翻译后）」，也不解析段落式需求 → 实测 exit 1。
3. **无「哪条决定」**：包的「最终决定」是散文，无 `D-xxx` 号（日志 `:644-658` 决定索引有 D-001…D-010，但包内不引用），覆盖行无法填决定列。
4. **无缺口 owner 的固定列**：coverage audit 写「谁接」但只对单元表生效（`tools/cli/check-decision-log-chain.mjs:192-235`，列 `单元/派生号/需求 + 谁接/落在哪/怎么验`），日志里没有这张表 → 检查静默。
5. **报告无机器可读形状**：覆盖表只在分析原件（Markdown），`requirement_coverage` 是散文（`:109`）。

## 2. build-plan 现在查什么

### phase 拆分后（第 6 步，`SKILL.md:55`）

查：全局设计写进同一 spec、独立 Phase 写集、`phase-template.md`「判定规则」拆并全集、共享写主先后/批次互斥/跨批依赖边、ADR-0036 写集重复豁免、成本三账与 `phase_budget`、验收七字段与「覆盖 AC」机器字段（`phase-template.md:763,850`）。

**没查**：每包十项→Phase 的映射；接口/风险/配套三项落点；包级依赖→Phase 依赖的保真（只查 Phase 图无环与「只能引用更早 Phase」）。

### 审查后（第 10→11 步，`:72-86`）

第 10 步：逐条处置 `fixed/rejected_invalid/accepted_risk/needs_human` + 每 Phase 四问一句话，**不核 findings 是否闭合**（无「修后原问题是否仍在」的复核），也无「修后 spec/phases 与 decision-log 是否仍一致」。

第 11 步：六类 + 覆盖核对 + 第七类 + `check-reader-record.mjs` + `check-authoring-budget.mjs`；覆盖核对四段与五列（`:76-84`），**基于原始需求，不基于每包十项**，且「缺口清单非空不许收口」是唯一硬约束。

### 已有的最强机检（可复用，但 join 不上）

`runtime/stage/stage-content-contracts.mjs` 的 `validatePostPhaseContract` 已强制：spec「需求到任务追踪」五列表（source→FR→AC→Phase/Task→oracle，`:1047-1062`，每个 AC/FR 必须在场、每张卡绑定一致）、Phase 写集/依赖/「覆盖 AC」/Done、Task 卡 17 字段。**缺的只是 join 键**：它从 spec 的 R/AC 出发，而 decision-log 既无 R 号也无 AC 号。

## 3. 两段检查设计

原则：**同一张表、两个时点、只加列不加表**；全部报告制。

### A. make-decision 结尾（第 13 步日志定稿，`spec-analyze` 内执行）

- 输入：`decision-log.md`（`## 原始需求` + 每包十项 + 决定索引）、`coverage-matrix-5d.md`（或需求索引）、每包「定验收」格原件。
- 输出（写进本阶段分析原件，`quality/evidence/` 下，不进日志正文）：

```
| 需求 | 落到哪个包 | 哪条决定 | 哪条验收 | 缺口 owner |
| R-001… | 包 3 | D-003 | AC-3-01 | — / 具名 owner + 恢复条件 |
```

- 规则：一需求一行，不按合计句计数；`决定` 写 `D-xxx` 或包内决定锚点；`验收` 写 `AC-<包号>-<序号>`（在 make-decision 定号，沿用模板 `:556` 的 AC 权威）；四段任一空＝该行进缺口，缺口 owner 必填。
- 退出码：不新增脚本时无退出码（分析原件是报告）；复用 `check-decision-log-chain.mjs` 时沿用现有语义——**0＝报告完成（含 warning）、1＝读不到输入或已命名的回答源错误**（`:7-13`、`:807-816`），无「通过/不通过」二值。
- 与既有件的关系：替代「日志定稿」时点里的空覆盖说明，不新增字段；结果并入 `requirement_coverage`。

### B. build-plan phase 拆分后（第 6 步末）

- 输入：日志每包十项（原始需求/完整方案/配套与影响/验收/风险/未决）、`spec.md`（全局设计、风险、非目标）、`phases/P<n>.md`（写集/依赖/覆盖 AC/Done/STOP）、`phases/index.md`。
- 输出（一份映射表 + 缺口行）：

```
| 包 | Phase | 接口落点 | 写集落点 | 验收落点(AC) | 风险/回退落点 | 配套四项落点 | 依赖与独立交付 | 缺口 owner |
```

- 落点判定：写集/依赖/验收可机检（Phase 机器字段 + spec 追踪表）；**接口、风险、配套四项无机器字段**（配套四项＝配套调整/迁移/移除/影响范围，日志 `:112`），必须人读并写原句位置；写不出落点即缺口。
- 依赖/独立交付：包级依赖必须能映射成 Phase 依赖边（包 i 依赖包 j 且 j 在更后 Phase → 缺口），每 Phase 必须能独立交付验收。
- 退出码：先作文本检查（无退出码）；包 10 落地脚本时沿 `validatePostPhaseContract` 的 `{ok, errors, facts}` 形状，报告制、缺项列 facts，exit 0，仅输入不可读 1。

### C. build-plan 审查后（第 10 步处置完、第 11 步前）

- 输入：原 findings JSON 与处置格、审查包的 `requirement_index`/`phase_risk_index`、当前 spec/phases 的真实 diff（`git diff --name-only` + 相关 hunk）、decision-log。
- 输出两张表：
  1. **闭合表**：`finding id | 处置 | 修复原件 | 原问题是否仍在（在/不在/未复核）| 缺口 owner`；标 fixed 但原件里原问题仍在 → 记「未闭合」，不改处置结论。
  2. **一致性表**：复用 A/B 两张表，只列被本轮修复触及的行（R/包/AC），核 `AC 对象/判据/写集/风险` 是否仍与日志十项一致；不一致写矛盾行 + owner＝决策作者或规格作者。
- 退出码：报告制，0；输入不可读 1。**缺 findings 原件或 diff 时写 `unavailable`/`incomplete`，不记已闭合。**

### 检查 vs 审查（不新增 gate）

| 项 | 性质 | 谁执行 | 是否阻断 |
| --- | --- | --- | --- |
| A/B/C 三张表 | 检查（静态对号、无 provider、事实） | spec-analyze（主会话只读执行）或既有 CLI | 否；缺口只登记，沿用第 11 步「缺口非空不许收口」与第 12 步三选一 |
| wh-review A/B 两路（`contracts/build-plan.md`） | 审查（语义裁定） | 独立 provider 上下文 | 否；空 findings 不等于通过 |
| 细节/方向五问与四镜头 | 审查 | 独立 provider | 否 |

新表的唯一新义务是「填列 + 缺口写 owner」；**不新增阶段、不新增审查轮、不加第二个必填 packet 键**（B 表走既有 `requirement_index`/`phase_risk_index` 可选键承载，`contracts/build-plan.md` 已定义）。

## 4. 最小改动清单

| # | 文件:位置 | 改什么 | 规模 |
| --- | --- | --- | --- |
| 1 | `skills/spec-analyze/SKILL.md:67-102` | 覆盖核对加两个 caller：make-decision 日志定稿（A 表五列）、build-plan 拆分后/审查后（B/C 表）；列集随阶段变，四段不变 | +25 行，改 3 句 |
| 2 | `workflows/build-plan/SKILL.md:55` 末、`:72` 末 | 各加一句指针：「拆分后跑 spec-analyze 的 B 表」「处置后跑 C 表」，不复述列 | +2 句 |
| 3 | `skills/decision-log/SKILL.md:92` | coverage audit 行加「验收列写 AC 号、决定列写 D/决定锚点」；R 编号必填 | +1 句 |
| 4 | `tools/cli/check-decision-log-chain.mjs:192-235` | 单元表 required 字段加 `验收`；新增十项条目识别（`**最终决定**` 等 bold 条目也算决定） | +15/-3 行 |
| 5 | `skills/spec-plan/scripts/build-decision-baseline.mjs:20,50` | `requirementHeading` 接受「原始需求（翻译后）」；段落式 `**需求 N**` 解析；输出加「每包设计」段（含 ref） | +30 行 |
| 6 | 测试 3 处 | 见 §5 | +6 case |

不动：`review-materials.mjs` 建包逻辑、`stage-content-contracts.mjs`、任何 runtime 状态、任何 gate。

## 5. 扩包 10 还是新开包 11

**建议：扩包 10，不新开 11。**

1. 包 10 已拥有全部相关决定：每包十项（日志 `:592-601`，其中「验收」要求 AC 号 `/ :600`）、build-plan 消费映射（`:605`）、完整性检查 `validate-decision-log`（`:606`）、配套调整含 baseline 与 build-plan 两条（`:607-612`）。新开 11 会出现两个 owner 与第二份消费映射。
2. 用户需求 12（`日志:103-109`）已写明「build-plan 核 spec/phases 是否消费每包设计；baseline 要收十项」，需求 13（`:110-116`）已写明「配套四项否则 build-plan 会漏」——A/B/C 是这两条的**可执行判据**，不是新需求。
3. 但注意顺序冲突：包 10 实施在 build-code，**本任务自己的 build-plan 用不上脚本版**。所以包 10 内部分两步交付：**文本先行**（#1-#3，随本阶段材料一起改，build-plan 立即可用）→ **脚本后到**（#4-#5＋测试），并把 #5 列为包 10 的第一条交付（现 exit 1 直接挡住 build-plan 第 9 步组包，`SKILL.md:67`）。

## 6. 验收命令 / 反例 / 测试

命令（期望）：

1. `npx vitest run tests/contract/spec-analyze-classes.test.mjs` → 0；新增断言含 A/B/C 三表列名与两个时点字面。
2. `npx vitest run tests/contract/decision-evidence-consumption.test.mjs` → 0；新增：缺 `验收` 列 → `missing_unit_field`（exit 0）；空表 → 报 no rows；十项日志不再 `no_decision_entries`。
3. `npx vitest run tests/contract/review-decision-baseline.test.mjs` → 0；新增 `原始需求（翻译后）`+段落需求 → exit 0 且 stdout 含「每包设计」。
4. `node skills/spec-plan/scripts/build-decision-baseline.mjs --decision-log specs/execution-quality-build-code-hardening-20261119/decision-log.md --spec <spec>` → 修后 0（现 1）。
5. `node tools/cli/check-decision-log-chain.mjs --file <日志>` → 0 且不再 `no_decision_entries`。
6. `npx vitest run tests/contract/review-materials-contract.test.mjs` → 0（确认未动 packet 键）。

反例（必须被判出）：

- R-005 只在包合并句出现，覆盖表无行 → 缺口行 + owner，不得记覆盖。
- 包的 `验收` 列空白 → `missing_unit_field`，不是「格式问题忽略」。
- 包 6 接口在 spec「接口与失败语义」无落点 → B 表缺口，build-plan 不收口。
- 包 7 依赖包 9 却被排到 P2 → B 表依赖缺口。
- 审查标 fixed、但 diff 里原断言仍在 → C 表「未闭合」。
- 修 AC-03 后日志未同步 → C 表矛盾行，owner＝决策作者。
- 命令 exit 0 但表 0 行 → 报 no rows，不记覆盖（对齐 `:115`「只有实际检查范围才报未发现」）。

## 7. 未取得与限制

- `quality/evidence/decision-log-refs/requirement-index.md`、`coverage-matrix-5d.md`、`quality/reviews/2026-11-19-00{5,6,7}*` 在任务 worktree **不存在**（日志 `:674-675` 已把它们当证据引用；日志 `:154/:160` 还记了方向 62 条、细节 37 条 findings）→ A 表输入与 C 表「原 findings」均未取得，无法验证实写形状；`quality/reviews/` 整个目录缺失，C 表今天只能对空。
- 真实 spec/phases 尚未产生，B/C 表只能用 T13/T16 归档对照，未在真实新日志上跑过。
- `check-decision-log-chain.mjs` 的十项识别是对 bold 条目的文本启发式，真实变体可能漏判。
- 未跑全量测试（按测试硬规则）；仅跑 §0 三条针对性命令。

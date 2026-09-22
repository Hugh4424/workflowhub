# I2 make-decision 改造史与复发链

> 任务：`workflowhub-thin-core-card-07-20260919`
> 方法：只读。核对归档四材料、外置任务 store 的 `quality/`、git 提交链与当前 HEAD 代码。
> 代码基准：`/Users/Hugh/Hugh/Project/workflowhub` HEAD `b39f34ba`；事故现场基准 `cd26676a`。
> 本报告未修改任何被审文件。
> **本报告的核心纪律**：每一行都区分「决议文本」与「实际实现」。凡声称与代码比对后不一致的，明确写出。

---

## 0. 结论速览

1. **历史改造尝试共 8 次**（6 次有实质机制改动 + 1 次补漏 + 1 次正在进行的 CARD-07 规划），跨 2026-08-04 → 2026-09-20，约 7 周。
2. **上游判断的「三次复发」是低估，且「三次」这个数字在历史材料里找不到先例**：仅按「有决议文本 + 有机制改动」计，make-decision 需求保真面的改造是 **6 次**（20260804 / 20260820 / 20260828 / 20260905 / 20260910 / 20260911），不是 3 次。「被修过两次」最早出现在 2026-09-10 的 ADR-0025，「第三次」最早出现在 2026-09-20 的 card-02 RC 报告。
3. **上游判断的「每次修复都停在类别级/消息级，从未落到需求单元级」——部分成立，但归因错位**。仓库里**至少有 3 套需求单元级校验器**：`requirement_replay`（verify-code，真在跑）、逐 `requirement_id` 的 `requirement coverage gap`（死代码）、`buildDecisionCoverageAudit`（死代码）。真正从未落到需求单元级的是 **make-decision 阶段自身**（`analyzeDecisionConvergence` / `validateRequirementCoverage`）。
4. **主因在机制粒度 —— 一手材料支持**。2026-08-29 commit `95919942` 的 diff 自证：该次「需求收敛」改造新增的覆盖校验，其唯一可选中的「逐条」维度是 **`message_class` 类别名**，不是需求单元（§3.3）。
5. **但机制粒度不是唯一主因，接线问题与之并列**。`assertDecisionCoverageReadyForConfirmation` 与 `requirement coverage gap` **两套逐条校验器至今全是死代码**；`requirement-ledger.mjs`（需求账本实现）被当浪费删掉；`talk_clarify` 与 `outline_closed` 跨 191 个任务「完全不相交」。§3 的 14 行失效分类里，「未接线/死代码」6 条 = 「粒度不够/不可证伪」6 条。
6. **「写了决议但没实现」是比「粒度不够」同样普遍的失败形态**。至少 5 例：20260828 的逐条强校验器从未接线；20260828 的 D-008②④ 与 D-002 supersedes 检查全未落成；20260910 的 `steps.json`「建立骨架」步骤从未落成 step；20260910 的 `convergence_outline` 投影在运行时**没有任何生产者**。
7. **出现了同一种病态的两次独立复现**：20260828 材料内「需求表 7 条无 covered / 覆盖矩阵 23/23 covered」互斥而无报警；20260909 材料内「原始需求表写『待处理』/ 覆盖矩阵已全部映射」互斥而无报警（`run1-inconsistent.json` finding #1）。同一失败形态、相隔 12 天、两个不同任务。
8. **CARD-07 的处境**：它要改的 `workflows/make-decision/SKILL.md` 与 `skills/decision-log/*` 在 HEAD 上**与 2026-08-29 之后基本未变**，即 CARD-07 面对的是同一份文本 + 一层被证明「写满标签词即可通过」的谓词。
9. **最强的一手反证（与上游叙事相反）**：20260804 的 `requirement_replay` 机制**今天仍然真实存在并被 `stage-handlers.mjs` 消费**（§6），且同材料还落了 101 个文件。这不支持「什么都停在纸面」的概括。
10. **上游报告有两处引用瑕疵（已逐条复核，不影响结论）**：`RC-...:342` 引 `…20260828/decision-log.md:385,387`，其中 `:385` 无意义、`:387` 正确可核；`RC-...:325,422` 自称「见第 7 节」但该报告只有 6 节。**核心证据可用。**
11. **考古新增了一条上游未引的一手锚点**：20260828 任务自己的复盘 `~/Knowledge/Projects/workflowhub/tasks/make-decision-requirement-convergence-20260828/root-cause-analysis.md:29` 逐字写了「**收敛假绿**：只有标题、纯 `R/D/AC/RISK` ID 也能通过；认证需求被压成 `message_class`，**不能逐条证明覆盖**」——**该缺口在 card-02 事故前约 3 周就被同一任务自认**，且因该报告在外置 task store 而不在 `specs/archive/`，上游 RC 报告未引用它。

---

## 1. 历史改造尝试全表

> 计数口径：只计**对 make-decision 需求保真/收敛面提出并落地过机制改动**的任务。「复发证据」列只引后续任务里**逐字**承认或实测到的同一问题。

| # | 任务 ID | 时间 | 要解决的问题（逐字） | 做了什么 | 声称结果（逐字） | 实际落地证据 | 复发？ | 复发证据 |
|---|---|---|---|---|---|---|---|---|
| 1 | `requirements-completeness-audit-20260804` | 2026-08-05 | 「调查五个根因：**make-decision 漏需求**、decision-log 不完整、build-spec 漏交付标准、verify-code 不回查原始需求、问题为何集中到最后才发现。」`decision-log.md:14` | ① 决议 D2「逐个列出需求语义并指向决策」`decision-log.md:138-148`；② 新建 `requirement_replay` 逐条校验（`canonical-receipt-writer.mjs` + `stage-handlers.mjs` 的 `requirementReplayFacts`）；③ `skills/decision-log/SKILL.md` 最低内容合同；④ `workflows/verify-code/SKILL.md` 原始需求回放节 | `tasks.md:18`：「`completed / quality=incomplete` … 不 close、不宣称 formal accepted」；**无「已解决」字样** | **真实存在**：`runtime/stage/stage-handlers.mjs:2523`（HEAD）、`runtime/evidence/canonical-receipt-writer.mjs:575,615-678`；commit `d8646ee7`（101 files, +8691/−524） | **是** | 2026-09-20 card-02：`RC-make-decision-omission-root-cause.md:379`（H-1）判定「同一根因的第三次发作」；但见 §6 反面证据 |
| 2 | `workflowhub-standard-stage-flow-hardening-20260820` | 2026-08-20/21 | 用户原话：「talk 为什么每次只有那么几个问题？**原始需求有没有在 make-decision 阶段彻底考虑清楚问清楚？**」「grill 总是错误的检查细节，**却忘了去检查需求整体**」`decision-log.md:9,17,18` | D-009 `:256`：「核对**每条需求或方向变化**都映射到 `decision-log.md` 的 requirement/decision/defer/reject 条目」，投影带 `axis_id/decision_ids/fr_ids/ac_ids`；`ff910799` 给 `completion-predicates.mjs` +558、`stage-content-contracts.mjs` +488 | `facts.jsonl` 末行 `stage=verify-code, status=manual_risk_close, created_at=2026-08-21T09:04:03Z` | **部分**：`REQUIREMENT_COVERAGE_CLASSES` 五类 + 认证 message 级 coverage 落成（`stage-content-contracts.mjs:2540,2558`），**但不是逐条** | **是** | 2026-09-20 `RC-make-decision-omission-root-cause.md:414` 把 20260820 列为复发案例（H-3 表）；机制本身即上游指认的「认证消息五类覆盖（类别级）」 |
| 3 | `make-decision-requirement-convergence-20260828` | 2026-08-28/29 | 用户原文：「现在make-decision的过程中的需求收敛**完全是随机的，想到什么问题就问什么问题**，完全没考虑原始需求是否满足、原始目标是否达到、验收目标是否清晰、所有需求方案是否收敛等。」`decision-log.md:14` | D-001 `:112`「原始需求矩阵逐条处置 + R→D 完整闭环」；D-002 `:126`；D-003 `:140` spec-analyze 加「目标达成/方案收敛」；D-006 `:182` 结束卡；**代码**：新增 `analyzeDecisionConvergence`（`95919942` +185），SKILL 写入「五维覆盖矩阵」 | `decision-log.md:485`「状态：accepted」；`:105`「矩阵状态：**23/23 covered**」；`:552`「status=consistent, ok=true, **covered_count=21/21**，无 errors」 | **部分 + 自认缺口**：`decision-log.md:387`「逐条覆盖=**部分**（需求列表主体自报，adapter:310 只绑 decision-log.md）」；`root-cause-analysis.md:9`「整体交付仍是 `quality_status=incomplete`、`product_release=not_released`…不能称为普通 clean acceptance」 | **是** | ① 自认：`…20260828/decision-log.md:387`「逐条覆盖=部分」（**已复核，657 行归档件，锚点正确**）；② `root-cause-analysis.md:29`（外置 task store）「**收敛假绿**：只有标题、纯 `R/D/AC/RISK` ID 也能通过；认证需求被压成 `message_class`，**不能逐条证明覆盖**」；③ `docs/adr/0025-...md:9-13`「已被修过两次」；④ **同表自相矛盾**：需求表 `:14-31` 中 **R-008~R-014 共 7 条没有 `covered` token**（写「本阶段硬约束」「已补执行」「Talk R2 真实回复」），而独立覆盖矩阵 `:105` 却称 **23/23 covered** —— 两个表对同一批需求给出不同状态，机器无一处报警 |
| 3b | **（#3 声称的逐条机制的真实落点）** `validateStageSpecAnalyzeProfile` | 早于 2026-08-28（`18bde535`） | —— | `stage-content-contracts.mjs:5839-5870` 建 `coverageById`、`:5951` 逐 `requirement_id` 报 `requirement coverage gap` —— **这是真正的需求单元级机器校验** | —— | **存在但是死代码**：其输入 `packet.original_requirements`（`:5808`）**唯一非空生产者是旧外部 Stage Agent** `tools/host/workflowhub-stage-agent-protocol.mjs:127`，而 `runtime/stage/stage-agent-outcome-adapter.mjs:680` 恒为 `original_requirements: []`；make-decision 分支（`:5751-5764`）走的是 `validateRequirementCoverage`（消息/类别口径）。`git merge-base --is-ancestor 18bde535 8cd189c05` **成立** → 该机制早于 #3 基线，**#3 从未触碰它** | **是** | card-02 `RC-...:69`：`validateRequirementCoverage` 只要求「每条**认证消息**恰好一个 output + 五类各出现一次」，「**一条消息可以承载几十条最小需求单元**」；`RC-...:338` 把同一函数列为「不是失明，是没接线」的同类 |
| 4 | `workflowhub-requirement-convergence-depth-20260905` | 2026-09-05/06 | 用户原话：「make-decision阶段的方向审查和细节审查都不够详细，无法获得足够深刻的异源审查建议，导致后续很多返工」`decision-log.md:7-8` | F-016 显式**复用** 20260828 框架；D-501 `:486`「**覆盖矩阵/收敛检查/UI applicability 不动**」；新增仅为 advisory 的 `check-decision-log-chain.mjs` + Talk/执行模型接线 | `decision-log.md:959`「需求覆盖情况：R-001~R-020 全部有处置（已覆盖/延期），五维矩阵与收敛检查四行表齐全；运行时语义检查 converge ok=true」；`:934`「无遗漏项：无」 | `analysisDecisionConvergence` live；但 `check-decision-log-chain.mjs:1-9`「deliberately never becomes a gate… exits 0」 | **是（本任务内自证）** | 细节审查 finding `e3fa8fb…json[13]`（major）：「五维需求-决策覆盖矩阵…所有维度的处置状态全为'待 Talk 收敛'或'待 Talk'，在多轮 Talk 及决策成型后仍未回填，**缺乏需求覆盖闭环证明**」；`:858` 记为「五维矩阵未回填（已回填）」 |
| 5 | `workflowhub-make-decision-hardening` | 2026-09-08/10 | 用户原话：「当前的workflowhub的make-decision流程**还是有严重问题**，需求和方案根本没讨论出什么结论就急着收口make-decision了，**还是我自己**…及时打断了收口流程，重新提出大量遗漏的地方…**make-decision的流程自己完全没发现这些问题**」`decision-log.md:18` | D-002/D-005/D-007：新增 `convergence_outline` 材料 + `outline_closed` 谓词（合取）+ OI 分析器；F-33 `:142` 明文承认 20260828 是「同一问题的前一次改造」 | `decision-log.md:961`「**尚未获得用户整体确认（step 11）**」；`:508`「**机器层面**：阶段完成事实与复盘**未达成**」；`:962`「处置为 `fixed` 的条目**指方案已修订，不代表已实现或已验证**」 | **存在**：`completion-predicates.mjs:60`、`stage-content-contracts.mjs:3038-3230`、`stage-handlers.mjs:3738-3744`；**但经 WIP salvage commit `07f341b2` 落盘，无合并任务分支** | **是** | ① `workflowhub-build-prd-workflow-hardening-20260911/decision-log.md:765`：「该投影在**运行时没有任何生产者**…因此 `outline_closed` 的 `direction_snapshot` 分量在当前代码下**无法满足**」；② `workflowhub-thin-core-card-01-20260919/spec.md:180` PFACT-007：「`outline_closed` 仍为真实 `missing`」；③ `workflowhub-mechanism-waste-reduction-20260915/decision-log.md:682`：「`talk_clarify` 与 `outline_closed` 两个 subject 集合**完全不相交**…这条组合在生产上**从未被接线**」 |
| 6 | `workflowhub-mechanism-simplification-t1-20260911` | 2026-09-11 | （机制减法任务，非需求保真） | Tier B 删除 `runtime/evidence/requirement-ledger.mjs`（需求账本实现）；两个覆盖相关 schema 维持 Tier B 不删 | `-t1/decision-log.md:94,425,448` 用户 T-006/T-018 两次维持 B；D-003 `:676` 拒绝「删到 Tier C」 | **实测：`runtime/evidence/requirement-ledger.mjs` 在 HEAD 已不存在**；`runtime/schemas/requirement-ledger.schema.json`、`requirements-coverage.schema.json` **仍在** | **是（负向）** | 删除的是需求账本实现，使「逐条账本」少了一条可能的落点（本项为**反向证据**：说明「需求单元级」资产曾被当作浪费移除） |
| 7 | `workflowhub-build-prd-workflow-hardening-20260911` | 2026-09-11/12 | `decision-log.md:765` 记录 20260910 的缺陷 | D-025 补 `deriveQuestionsOnlyOutline`（`stage-content-contracts.mjs:3004`），给 `direction_snapshot` 让投影有生产者 | `455ce7e5`（2026-09-12） | **存在**：`deriveQuestionsOnlyOutline` live | —— （这是对 #5 的补漏，本身不是新的需求保真改造） | —— |
| 8 | `workflowhub-thin-core-card-07-20260919`（本次） | 2026-09-19/20 | 用户原话要点：「现在的 make-decision 有严重问题，**完全没起到作用，变成纯粹的记录工具，还是弱化版的记录工具**」；「**把用户本身的需求弱化了，而且没有告诉用户**」`specs/workflowhub-thin-core-rebuild-planning-20260919/decision-log.md:871-872` | 规划中：FR-33..FR-38（发散+收敛双能力、逐字双层保真、append-only、取消固定轮次） | 未开始实施（母 PRD `prd.md:113,175` 指派） | 母 PRD 已定稿并确认；实现未起 | —— （本次即第 4 次复发的处置现场） | 机制诊断 #6 逐字：「**覆盖核对只按类别、不校验强度**：只检查六节点/类别有无覆盖，不比对每条原始需求是否被削弱」→「弱化在检查里不可见，所以既没被发现也没被告知」`decision-log.md:884` |

> **未找到**：任何一次改造的 decision-log 中，有「前两次（2026-08-04、2026-08-28）都写了决议，都没生效」这样的**显式**表述。全仓 grep `第三次复发` 在 specs/（排除 node_modules）**只命中我方的 card-02 RC 报告**，无历史先例。即：**「三次复发」这个判断是 2026-09-20 的 card-02 首次提出，不是历史材料里的既有结论。**

---

## 2. 复发链时间线

```
2026-08-04/05  #1 requirements-completeness-audit
              改了什么：需求点矩阵（材料层）+ requirement_replay 逐条校验（verify-code 侧）
              为什么没生效：真正逐条的那套在 verify-code，不在 make-decision；
                            make-decision 侧只有 SKILL 文本「逐个列出需求语义」

2026-08-20/21  #2 standard-stage-flow-hardening
              改了什么：五类 REQUIREMENT_COVERAGE_CLASSES + 认证 message 级 coverage
              为什么没生效：粒度从「需求」换成「认证消息」，一条消息可装 N 条需求；
                            D-009 声称「每条需求」但实现是 axis/class

2026-08-28/29  #3 make-decision-requirement-convergence
              改了什么：analyzeDecisionConvergence + 五维覆盖矩阵 + spec-analyze 两维
              为什么没生效：★ 决定性一手证据 ★
                - 校验只查「章节存在 + ≥2 行表格 + status 命中宽泛枚举 + 五类各出现一次」
                  （stage-content-contracts.mjs:3387/3418/3422-3434）
                - 唯一能选中的「逐条」维度 = message_class 类别名，不是需求单元
                  （见 §3.3 的 commit 95919942 diff）
                - 任务自己如实写下「逐条覆盖=部分（需求列表主体自报）」:387
                - 同一材料内：需求表 7 条无 covered token，覆盖矩阵却称 23/23 covered:105
                            —— 缺陷被写入材料，但没有进入校验器

2026-09-05/06  #4 workflowhub-requirement-convergence-depth
              改了什么：只复用 #3 的框架 + advisory 链检查器
              D-501 逐字「覆盖矩阵/收敛检查/UI applicability 不动」→ 粒度未动
              为什么没生效：同一任务内自证复发（五维矩阵一直「待 Talk 收敛」未回填）

2026-09-08/10  #5 workflowhub-make-decision-hardening
              改了什么：convergence_outline + outline_closed 合取谓词 + OI 分析器
              为什么没生效：★ 两处独立失效 ★
                (a) 「direction_snapshot」分量由 deriveQuestionsOnlyOutline 从同一份文档自导，
                    即「方向审查消费了大纲」这一合取项不可能失败
                (b) 项目在实际 profile 里从未接线 ——
                    「talk_clarify 与 outline_closed 完全不相交…从未被接线」（191 任务普查）
                (c) steps.json 从未落成「建立骨架」step；落盘是 WIP salvage commit，无合并分支

2026-09-20     #6→ card-02 事故（316 单元 → 38 条未完整承接：13 压缩/偏离 + 25 丢失）
              上游定性：同一根因第「三」次复发（按有决议文本计；按机制改动计是第 5 次）

2026-09-19/20  CARD-07（本次）—— 第 4 次处置现场
```

**旁支复发记录（同类形态，非需求保真面）**：
`specs/archive/wh-review-execution-flow-improvement/decision-log.md:371`（G-002，2026-08-11 前后）：「本地 Grill 仍要求一次只问一个问题……**当前 workflowhub 流程果然有问题**」（`:412` 用户原话）。
20260828 的调研（`decision-log.md:392`）与 20260910 都**逐字引用这条 G-002 作为「历史同源问题已证复发」**（`…20260828/decision-log.md:161` 拒绝理由逐字：「**只升级引用（历史 G-002 已证复发）**」）。
**即：在「Talk/Grill 交互形态」这个面上，「历史已证复发」的证据链比需求保真面更早（2026-08-11），且被后来的任务明确引用为拒案依据。**

**「为什么每次都复发」的一句话链**：每一次改造都把「需求」这个对象降级成了别的东西 ——
#1 降级到 verify-code、#2 降级到认证消息、#3 降级到 `message_class` 标签、#4 原地不动、#5 降级到自写 OI。
**唯一一次真正把「需求单元」当一等对象并接在生产路径上的，是 #1 的 `requirement_replay`，而它不在 make-decision。**
**仓库里另有至少两套真正的需求单元级校验器（`requirement coverage gap`、`buildDecisionCoverageAudit`），两套都是死代码。**
所以准确的病名不是「没人想到要做需求单元级」，而是 **「做过的需求单元级校验，一套被放到下游、两套没接线、一套（需求账本实现）被当浪费删掉」**。

---

## 3. 每次失败的机制层原因

| # | 失败原因 | 一手证据锚点 | 性质 |
|---|---|---|---|
| 1 | 逐条机制建在了**下游**（verify-code），make-decision 侧只写文本 | `stage-handlers.mjs:2523`（在 verify-code 路径）；`workflows/make-decision/SKILL.md`（#1 只 +16 行，内容是 Talk 双覆盖+摘要） | **实现了但落点错**（不是粒度不够） |
| 1b | 该下游机制后来被**指令层反转** | HEAD `workflows/verify-code/SKILL.md:136`：「不重新检查其完整性，也不列 AC 逐条结论」；`tests/verify-requirement-replay-contract.test.mjs` 断言已反转（`toMatch(/不列 AC 逐条结论/)`）。**但 runtime 的 `requirement_replay` 校验仍在** | **决议被撤、实现残留**（错配） |
| 2 | 粒度从「需求」偷换成「认证消息」 | `stage-content-contracts.mjs:2540-2563`：`coveredMessages` / `coveredClasses` / `coveredAxes` 三个 Set；一条消息可承载 N 条需求 | **实现了但粒度不够** |
| 3 | 覆盖校验只查形状不查对齐（★ 核心） | `stage-content-contracts.mjs:3387`（正则找章节）、`:3418`（`coverageRows.length < 2`）、`:3422-3434`（status 命中 `covered\|accepted_omission\|deferred\|rejected\|non.?goal\|延期\|拒绝\|覆盖\|已接受`）；`parseCoverageRows:2770-2783` 在 `## 原始需求…` 下抓**任意** ≥3 列表格。**从不枚举原始需求条数，也不要求一行一条** | **实现了但粒度不够** |
| 3a | **两个表对同一批需求给出互斥状态，机器不报警** | `…20260828/decision-log.md:14-31`（需求表：R-008~R-014 共 7 条无 `covered` token）对 `:105`（覆盖矩阵「23/23 covered」）——同一任务、同一材料、同一批需求，状态矛盾且无一处失败 | **实现了但不可证伪**（与 2026-09-09 的复发形态同型，见下行 7） |
| 3b | 唯一逐条强校验器存在但**从未接线** | `RC-...:63-68` 全仓 grep：`buildDecisionCoverageAudit`/`assertDecisionCoverageReadyForConfirmation` 定义在 `stage-content-contracts.mjs:3582/3630`，**生产调用者 0**；HEAD `b39f34ba` 复核**仍然如此** | **写了没实现（未接线）** |
| 3c | **另一条真正的需求单元级校验器也是死代码** | `stage-content-contracts.mjs:5839-5870`+`:5951` 逐 `requirement_id` 报 `requirement coverage gap`，但输入 `packet.original_requirements`（`:5808`）唯一非空生产者是旧外部 Stage Agent（`workflowhub-stage-agent-protocol.mjs:127`），当前路径恒为 `[]`（`stage-agent-outcome-adapter.mjs:680`） | **写了没实现（死代码）** |
| 4 | 明确决定「不动」上一版粒度 | `workflowhub-requirement-convergence-depth-20260905/decision-log.md:486`（D-501）逐字「覆盖矩阵/收敛检查/UI applicability 不动」 | **决议层面主动冻结** |
| 5 | 新增谓词可由自写文本满足 | `make-decision-hardening/decision-log.md:84` 逐字：「现有机器检查是**格式/自述检查**：主会话可以只写漂亮文本、把表格填满标签词，就通过全部 make-decision 谓词」；`:86`「「需求和方案没讨论出结论就收口」在机制上**完全不会被发现**」 | **实现了但语义不可证伪** |
| 5b | `direction_snapshot` 合取项**不可能失败** | `stage-content-contracts.mjs:3203`：回退到由**同一份** decision-log 的 OI 记录 `deriveQuestionsOnlyOutline(byId,…)` 生成快照 → 只要有 OI 记录就通过 | **实现了但自证** |
| 5c | 投影在运行时**没有生产者** | `workflowhub-build-prd-workflow-hardening-20260911/decision-log.md:765`：「该投影在**运行时没有任何生产者**…`outline_closed` 的 `direction_snapshot` 分量在当前代码下**无法满足**」 | **写了没实现** |
| 5d | 生产路径从未接线 | `workflowhub-mechanism-waste-reduction-20260915/decision-log.md:682`：「跨 191 个任务的普查结论：`talk_clarify` 与 `outline_closed` 两个 subject 集合**完全不相交**…「同时满足 outline_closed + human_confirmation 并发布 talk_clarify」这条组合在生产上**从未被接线**」 | **写了没实现** |
| 5e | `steps.json` 承诺的步骤从未落成 | `make-decision-hardening/decision-log.md:764-780` D-022 要求 steps.json「在 research 之前加入「建立骨架」完成项」；HEAD `workflows/make-decision/steps.json` **仍是 14 步，无该 step** | **写了没实现** |
| 6 | 「需求单元级」资产被作为浪费删除 | `-t1-20260911/decision-log.md:328` Tier B 删除 `runtime/evidence/requirement-ledger.mjs`；HEAD 实测**已不存在** | **反向：减法删掉了粒度落点** |
| 7 | **同一材料对同一需求给出互相否定的处置状态**（跨任务复现） | `workflowhub-research-handoff-hardening-20260909/quality/evidence/spec-analyze/run1-inconsistent.json` finding #1：「11 条需求在原始需求表仍写『待处理』……后半段覆盖矩阵却已把全部 20 条映射到 D/AC……**同一材料对同一需求给出互相否定的处置状态**」；同任务 F-99443dde4472 `:470`「材料存在可能**再次冒充需求覆盖**」 | **实现了但不可证伪**（与 #3 的 3a 行同型，相隔 12 天、两个不同任务，同一失败形态） |
| 8 | 覆盖矩阵的分析器入参里**根本没有「原始需求」这个对象** | `stage-content-contracts.mjs:3038-3042` 签名只有 `taskId / directionReview / interactionAggregate`；`RC-...:105` | **设计了但对象缺位** |
| 全 | 权威材料记了缺口，但缺口不进校验器 | `…20260828/decision-log.md:387`「逐条覆盖=部分（需求列表主体自报，adapter:310 只绑 decision-log.md）」+ `RC-...:405-407`：「缺口**已经被写入材料**，但**没有进入校验器**，因此下一次（本次）照样发生」 | **写了没实现** |

**三类失效率的分布（按上表 14 行归类）**：
- 「**写了没实现 / 没接线 / 死代码**」：3b、3c、5c、5d、5e、全 = **6 条**
- 「**实现了但粒度不够 / 不可证伪**」：2、3、3a、5、5b、7 = **6 条**
- 「**实现了但落点错 / 被反转 / 被删 / 对象缺位**」：1、1b、4、6、8 = **5 条**

> 这张分布表**部分修正**上游判断：主因不止「机制粒度」，「决议与实现脱节（未接线/死代码）」在数量上**并列第一**。
> 另需注意 **3c 与 3b 构成了同一个悖论的两次独立证明**：仓库里至少有 **两套**真正的需求单元级校验器（`requirement coverage gap` 与 `buildDecisionCoverageAudit`），**两套都是死代码**。上游说「病根不是'不知道怎么做'，而是'没接上'」（`RC-...:326`）在这两处完全成立 —— 而这不是粒度问题。

---

## 4. 对策的历史清单（提出过但被否决/延期）

| 对策 | 谁否的 | 理由（逐字要点） | 出处 |
|---|---|---|---|
| 新建独立收敛/检查文件或第五材料 | 审查者 + 历史 | 违反 F11 第五材料边界 | `…convergence-20260828/decision-log.md:119,147`；`workflowhub-make-decision-hardening/decision-log.md:617`（NG-03「不新建第五份材料或独立收敛检查文件」） |
| 机器全量硬校验 / 机器语义裁决 | 审查者 + 历史 | 违反 F10；机器不判断「讨论是否充分」 | `…convergence-20260828/decision-log.md:133`；`…hardening/decision-log.md:618`（NG-04「不做**机器语义裁决**」） |
| AC 硬校验 | 决策者 | 与「测试不是推进门」冲突 | `workflowhub-requirement-convergence-depth-20260905/decision-log.md:225` |
| 全量消息 evidence DB（transcript 全量持久账本） | 决策者 | 「重复控制面和隐私/维护成本」 | `workflowhub-standard-stage-flow-hardening-20260820/decision-log.md:263` |
| 只信 Stage Agent 自报 | 决策者 | 「无法防遗漏」 | 同上 `:263` |
| 把 research / capability proof 加进完成谓词 | 审查者 | 「与宪法冲突」；「立刻造出死谓词」 | `workflowhub-research-handoff-hardening-20260909/decision-log.md:269,338` |
| 让 `unavailable` 满足 `integration_review` 谓词 | 审查两次 blocking 反对 | —— | 同上 `:338` |
| 加每批 ≥2 题机器强门 | 决策者 | 「FND 误伤依赖题、违反 F10」 | `…convergence-20260828/decision-log.md:161` |
| 只改技能文本 / 只升级引用 | 决策者 | 「**纸面合规**，盲审 FND-001 点名」；「历史 G-002 **已证复发**」 | `…convergence-20260828/decision-log.md:119,147,161` |
| 机器校验 decision-log 最低结构 | —— | 延期给独立 runtime 任务 | `requirements-completeness-audit-20260804/decision-log.md:258` |
| 交互证据的完全机器强绑定 | —— | 「不在本任务落地（**延期**至后续治理任务）」 | `…convergence-20260828/decision-log.md:75,174-176` |
| 删到 Tier C（覆盖/需求账本 schema） | **用户** T-006/T-018 两次维持 B | 「动 Runner 发布清单与归档引用」（`runner-release.mjs:89` 按目录扫描把 `runtime/schemas/*.json` 全部打进发布清单） | `-t1-20260911/decision-log.md:94,352,425,448,676` |
| 对抗性 dogfood 作为验收 | 历史用户 | 已否决 | `…hardening/decision-log.md:621,845` |
| 单一 `source_manifest` 占位 | 决策者 | 被拒 | `requirements-completeness-audit-20260804/decision-log.md:138-148` |
| 复制需求原句骗匹配 | 决策者 | 被拒（`rejected_alternatives`） | `workflowhub-review-flow-repair-20260906/decision-log.md:330` |
| 新增语义审查轮次 / 关闭分析器 / 所有 OPEN 反写历史 | 决策者 | 被拒 | 同上 `:330` |
| verify-code 叠加 spec-analyze | 决策者 | 「重复成本」 | `workflowhub-standard-stage-flow-hardening-20260820/decision-log.md:248` |
| analyzer 作为编辑准入 gate | 决策者 | 「违宪且造成死锁」 | 同上 `:278` |
| 只改技能文本（硬化的同类拒法） | ADR-0025 | 「历史判为**纸面合规**」 | `docs/adr/0025-convergence-outline-and-close-loop.md`「被拒方案」段 |

> **重要观察**：被否决最频繁的两条恰恰是「机器强校验」（违 F10）与「只改文本」（被证纸面合规）。**历史把这条路的两端都堵死了** —— 既不许加机器硬门，又不许只依赖文本。CARD-07 面对的是同一个夹缝。

---

## 5. 对上游判断的验证

上游原话（`research/RC-make-decision-omission-root-cause.md:325`、`:418`，及 `quality/evidence/decision-log-process.md:363`）：

> 「同一缺陷在 `2026-08-04` 与 `2026-08-28` 两次任务中被明确诊断并"修复"…两次都只修到**类别级**…**同一根因的第三次复发**，且每次"修复"都停在**类别级/消息级**，从未落到**需求单元级**。这构成 H-2 之外的独立判定依据：主因不在"执行者不认真"，而在**机制粒度**」

| 子命题 | 判定 | 证据 |
|---|---|---|
| **「是第 N 次复发」** | **部分支持 —— 次数被低估** | 「三次」只在有决议文本口径下成立。按「提出并落地过机制改动」计是 **6 次**（20260804 / 20260820 / 20260828 / 20260905 / 20260910 / 20260911，见 §1）。上游自己的 H-3 表（`RC-...:411-416`）就列了 20260820，却仍称「三次」——**表与结论不自洽**。 |
| **「前两次是 2026-08-04、2026-08-28」** | **推翻（不完整）** | 20260820 的 `REQUIREMENT_COVERAGE_CLASSES` 五类机制（`stage-content-contracts.mjs:2540`）正是上游指认的「类别级」本体，且**晚于** 20260804（`git log -S` → `ff910799` Aug 21 / `aae652cb` Aug 22）。**上游指认的病灶机制，恰恰诞生于它没有列为「一次」的那次改造。** |
| **「前两次（2026-08-04、2026-08-28）都写了决议」** | **部分推翻（就 08-04 而言）** | 20260828 确实「主要是决议 + 一套类别级校验」。但 20260804 落了 **101 个文件 / +8691 行**（commit `d8646ee7`），含真实可运行的逐条校验；把它概括为「写了决议」低估了它的落地面。 |
| **「这个根因已经是第三次复发」** | **该数字在历史材料中无先例（[未找到]）** | 全仓（排除 `node_modules`）grep `第三次复发`/`三次复发` 在 `specs/` 下**只命中 card-02 自己的 RC 报告**；20260828、20260905、20260910 的任务材料里**没有任何一处**声称前次修复失败；20260905 甚至把 20260828 称为「上一个需求收敛任务……**再进一步**」（`decision-log.md:150`），20260910 的 ADR-0025 才第一次写「已被修过两次」。**即：复发是 2026-09-10 及以后才被追认的，2026-09-20 才升级为「第三次」。** |
| **「每次都停在类别级/消息级」** | **部分支持** | 对 **make-decision 覆盖校验**成立（20260820 消息级 → 20260828 `message_class` 级 → 20260905 冻结 → 20260910 OI 级但非需求级），证据见 §3 行 2/3/4。但**对 20260804 不成立**：该次建成了 `requirementReplayFacts` 逐条机制（§6）。 |
| **「从未落到需求单元级」** | **推翻（就全仓而言）／支持（就 make-decision 而言）** | **推翻，且证据强于预期**：`runtime/stage/stage-handlers.mjs:2523-2600` 今天仍逐 `R-*\|\|F15/F47/KD/F8/M08-*\|INC-*\|D-*` 强制 `source_id + status + linked_ids + evidence_refs`，漏报进 `missing_items`、多报直接 `throw`（`:2597`），`pass` 必须有证据（`canonical-receipt-writer.mjs:575,615-678`）。**且仓库里另有两套需求单元级校验器**：`stage-content-contracts.mjs:5951` 的逐 `requirement_id` `requirement coverage gap`、`:3582/3630` 的 `buildDecisionCoverageAudit`/`assertDecisionCoverageReadyForConfirmation`。**支持**：这三套**没有一套在 make-decision 阶段**——第 1 套在 verify-code，后两套是死代码（见 §3 行 3b/3c）。`make-decision` 侧到 HEAD 为止仍无等价物。 |
| **「主因不在执行者，在机制粒度」** | **支持（但需补一条并列主因）** | 粒度诊断被 2026-08-29 的 commit diff 直接证实（§3.3）。但 §3 的 14 行分类显示「**写了没实现/未接线/死代码**」6 条 ≥ 「粒度不够/不可证伪」6 条（并列，见 §3 分布表）。`assertDecisionCoverageReadyForConfirmation` 与 `requirement coverage gap` **两套逐条校验器都是死代码**、`outline_closed` 投影无生产者、`talk_clarify`/`outline_closed` 191 任务不相交 —— 这些**都不是粒度问题，是接线问题**。上游把 R-2 归为「主要根因之二」并写「病根不是'不知道怎么做'，而是'没接上'」（`RC-...:326`），这句**已经包含**了并列主因，只是第 3 节结论段又把它收束回「病根就在粒度」。**建议上游把结论改为「粒度 + 接线」双主因**，否则 CARD-07 可能只修粒度、继续不接线。 |
| **「20260804、20260828 都写了决议，都没生效」** | **部分支持** | 20260828：**强支持，且有比上游更强的证据**。除自认「逐条覆盖=部分」（`:387`）外，本报告新发现**同材料内两表互斥**：需求表 `:14-31` 有 7 条无 `covered` token，覆盖矩阵 `:105` 却称 23/23 covered，无一处报警 —— 这是「收敛假绿」的直接实证（`root-cause-analysis.md:29`）。20260804：**弱**。它**不是只写决议**——`d8646ee7` 真落了 101 文件；失效的是 (a) 落点在 verify-code、(b) 2026-09-20 的 SKILL 反转（`workflows/verify-code/SKILL.md:136`）、(c) 任务级验收证据**全部缺失**（无 `quality/` 目录、无 replay receipt、`quality/tests/research.json` 不存在）。 |
| **「这直接决定 CARD-07 会不会第四次踩同一个坑」** | **支持该风险的现实性** | CARD-07 的对象（`workflows/make-decision/SKILL.md`、`skills/decision-log/*`）自 2026-08-29 起基本未变；其头顶的 5 个谓词仍是 `RC-...` 指认的「写满标签词即可通过」形态（`stage-handlers.mjs:3733-3737` 发布，源自 `stage-content-contracts.mjs:3490-3505`）。 |

---

## 6. 反面证据

> 本节如实列出**不利于**「每次改造都失败」这一叙事的一手材料。

1. **20260804 的逐条机制是真的，且今天仍在跑。**
   `runtime/stage/stage-handlers.mjs:2523` `requirementReplayFacts`（HEAD 可验证）；`runtime/evidence/canonical-receipt-writer.mjs:575,615-678` 强制 `requirement_replay` 且 `pass` 必须有 `evidence_refs`，否则 `TypeError`。多报直接 `throw new Error('requirement_replay contains unknown source: …')`（`:2597` 附近）。这不支持「从未落到需求单元级」。
   **修正写法**：应为「**make-decision 阶段自身**从未落到需求单元级；verify-code 侧早在 2026-08-04 就有，但后来被指令层反转」。

2. **「三次复发」这个数字在历史材料里不存在先例。**
   全仓（排除 `node_modules`）grep `第三次复发` / `三次复发` 在 `specs/` 下**只命中我方 card-02 RC 报告**。20260828/20260905/20260910 的任务材料里**没有任何一处**声称前次修复失败；20260905 甚至把 20260828 称为「上一个需求收敛任务…**再进一步**」（`decision-log.md:150`），20260910 的 ADR-0025 才第一次写「已被修过两次」。**即：复发是事后追认的，不是当时已知的。**

2b. **真正的需求单元级校验器不止一套，而且都写得挺认真。**
   除 `requirement_replay` 外，`stage-content-contracts.mjs:5839-5870`+`:5951` 逐 `requirement_id` 报 `requirement coverage gap`；`:3582/3630` 的 `buildDecisionCoverageAudit`/`assertDecisionCoverageReadyForConfirmation` 逐 source item 配对、`missing !== 0` 直接抛错。**上游若说「没人知道怎么做需求单元级校验」，这四处代码就是反证。** 真正的问题是没人接上它们 —— 这是**接线问题**，不是能力问题。

2c. **20260828 的「收敛假绿」是当时就被写下来的，不是事后定罪。**
   `make-decision-requirement-convergence-20260828/root-cause-analysis.md:29`（该任务自己的复盘）：「**收敛假绿**：只有标题、纯 `R/D/AC/RISK` ID 也能通过；认证需求被压成 `message_class`，**不能逐条证明覆盖**」。这份复盘文件位于外置 task store，不在 `specs/archive/`，因此**上游 RC 报告没有引用它** —— 但它是同一任务的自认，早于 card-02 事故约 3 周。

3. **20260905 的最终效力评价是正面的。**
   `specs/archive/workflowhub-close-readiness-governance-20260906/evidence/research-Q1-convergence-task-effect.md:22`：「落盘率 ≈100%」；`:35` 只说「绝大多数改动为技能文本层…运行时代码仅 P1/P2/P3 三处」——是**范围描述**，不是失败判定。

4. **#2（20260820）与 #7（20260911补漏）都带了真实可运行的代码。**
   `ff910799`：`completion-predicates.mjs` +558、`stage-content-contracts.mjs` +488；`455ce7e5` 补上 `deriveQuestionsOnlyOutline`。它们的问题不是「没实现」，而是「实现的东西和要防的缺陷不是同一个东西」。

5. **需求收敛不是 make-decision 唯一的失败面，把它当唯一根因会高估。**
   `decision-log-process.md:278` 与 `RC-...:314` 都把 SD-09/SD-10 缺失定性为「**压缩为何不可见**」而非「压缩为何发生」；`RC-...:311` 明确 R-3（OI 前置）「本身不必然导致压缩」，是**设计选择**。真正让 38 条丢失的是录入端压缩 + 校验端失明的组合，不全是「粒度」一词能覆盖。

6. **20260804 的任务级验收证据整体缺失 —— 这既是反面也是正面。**
   反面：无 `quality/` 目录、无 replay receipt、`quality/tests/research.json`（AC-003 的 R3 锚点，sha256 `422f4044…`）不存在 → 当时**无法证明**修好了。
   正面：因此**不能据此断言它「生效了」**，也就不能据此断言它「失败了」——它是**不可判定**，不是已证失败。

7. **上游 RC 报告的行号引用已逐条复核，结论可用但有两处瑕疵。**
   - `RC-...:342` 引「`…20260828/decision-log.md:385,387`」：**`:387` 正确且可核**——原文逐字为「1. 逐条覆盖=**部分**（需求列表主体自报，adapter:310 只绑 decision-log.md）；」（归档件实测 657 行）。但 `:385` 是空行/`- 四维结论（用户投诉对应）：` 之上的一般行，**该一半引用无意义**。本条**不构成结论错误，只构成引用不精确**。
   - `RC-...:325` 与 `:422` 自称「见第 7 节」，但该报告只有 6 节（末节为「附：本报告的方法与局限」）——第 6 节才是「同类事故的历史证据」。**章节自指错误**。
   - **结论方向不受影响**（核心证据 `:387` 与 `:405-407` 均可核），但引用时建议直接改用 `:387` 与 `root-cause-analysis.md:29`。
   - **附带发现**：`RC-...` 未引用外置 task store 里的 `root-cause-analysis.md:29`（同一任务自认的「收敛假绿」），该文件位于 `~/Knowledge/Projects/workflowhub/tasks/make-decision-requirement-convergence-20260828/`，不在 `specs/archive/`。这是本次考古新增的一手锚点。

8. **「粒度」之外，20260905 的失败被上游自己定性为可接受风险。**
   `workflowhub-requirement-convergence-depth-20260905/decision-log.md:870` FND-DB23「阶段复盘兜底不成立…文本层腐烂」→ **accepted_risk**；`:916` RISK-004「文本层链字段仍可能腐烂（告警不阻断）」。即：**当时是知情接受的**，不是被漏掉的。

---

## 7. 未确认项

1. **[未确认] 20260804 是否「生效过」。** 任务级验收证据全部缺失（无 `quality/` 目录、无 replay receipt、`quality/tests/research.json` 不存在），因此其实际效果**不可判定**。需要 `make-decision-audit` 外部 store 或更早的 commit 才能补证。
2. **[未确认] 20260828 的 `95919942` 是否曾把 `assertDecisionCoverageReadyForConfirmation` 接线过。** 该函数在 `95919942` 中存在（`:3630`），但生产调用者 0。需 diff `95919942` 的 `stage-handlers.mjs` 逐行确认它是「本来就只给测试用」还是「接过后又被撤」。
3. **[未确认] `workflowhub-review-flow-repair-20260906` 与 make-decision 需求保真的关系。** 该任务 make-decision 侧**无需求单元覆盖提案**；唯一相关是 `:209`「审查结果零落盘」症状在 make-decision 阶段的复现。本报告未把它计入「改造尝试」。
4. **[未确认] 20260915 `mechanism-waste-reduction` 的 D-022/D-025 是否改变了 make-decision 完成判据的实际行为。** 决议文本在，跨 191 任务的接线普查结论是「从未被接线」；但未做动态运行验证。
5. **[未确认] `requirement-ledger.mjs` 被删前是否承担过 make-decision 的覆盖职责。** 现有证据只到「Tier B：零生产引用、有测试引用」（`-t1-20260911/decision-log.md:328`），未找到它曾被 make-decision 消费的证据。
6. **[已确认] `make-decision-redesign-candidates.md` 找到了。** 母规划 `decision-log.md:864` 引用的候选索引实际位于 **外置 task store**：`~/Knowledge/Projects/workflowhub/tasks/workflowhub-thin-core-rebuild-planning-20260919/quality/evidence/research/make-decision-redesign-candidates.md`（64 行；§2 M1–M12、§3 C1–C14、§4 F1–F10）。它不在 `specs/` 下，因此只在仓内查找会落空。**同一目录的候选清点已由本卡兄弟报告 `research/I1-redesign-candidates-inventory.md` 覆盖**，本报告不重复。
   *（更正：本报告初稿曾把此项标为「[未找到]」，是只在 `specs/` 内检索导致的假阴性。）*
   **该文件的 §4 第 6 条与本报告的粒度主题直接相关**，可作交叉印证：`make-decision-redesign-candidates.md:53`「**为机器友好而改写需求 → 破坏追溯链接恢复**（长句、照应、否定都损害精确率/召回率）」——即「把用户原话改写成机器可校验的形式」本身就是一种已登记的失败模式。
7. **[已确认] `20260828/decision-log.md:387` 与 `:105` 两个锚点已复核正确**（归档件 657 行）。上游 `RC-...:342` 的 `:385,387` 中只有 `:387` 有效。**本节相应条目已从「未确认」移出。**
8. **[未确认] 「第四次」的口径。** 本报告给出「按机制改动计 6 次、按决议文本计 3 次」两种口径。若 CARD-07 也失败，口径将是 **7 次 / 4 次**。上游未定义计数口径，这是本次报告与上游判断分歧的技术根源。

---

## 附：本报告的方法与局限

1. **只读**：未修改任何被审文件；本报告为新建文件。
2. **代码基准**：`workflowhub` HEAD `b39f34ba`（2026-09-21）；事故现场代码基准 `cd26676a`（`RC-...` 自述，`RC-...:6`）。两者对 `stage-content-contracts.mjs` 的行号有偏移（该文件在 card-02 期间增长），引用时已按可核对性优先选用 HEAD 行号。
3. **证据分层**：§1「实际落地证据」列全部经 `git show --stat` / `grep` / `sed` 在 HEAD 或指定 commit 上实测；未实测的一律标 `[未确认]` 或 `[未找到]`。
4. **未做动态验证**：未执行 `approve-decision` 流程、未跑测试、未重放任何 review。因此「未接线」的判定方法是**全仓 grep 调用者**（排除 `specs/archive`、`node_modules`），与 `RC-...:426` 同法，属静态结论。
5. **口径分歧已显式声明**：§5 与 §0.2 对「几次」给出两种计数口径，并说明上游未定义口径。
6. **不夹带设计建议**：本报告不做修复方案推荐；§4 仅为历史清单。

# RC — make-decision 大规模需求遗漏根因分析报告

> 任务：`workflowhub-thin-core-card-02-20260919`
> 事故对象：本 task 的 make-decision 阶段（316 个最小需求单元 → 38 条未完整承接：13 条压缩/偏离 + 25 条丢失）
> 方法：只读。实际读取 SKILL / steps.json / skill-deps.yaml / runtime 校验器 / 历史存档，逐条验证或推翻 9 条候选根因。
> 代码基准：本报告核对时 `workflowhub` 与事故 worktree 的 HEAD **同为** `cd26676a096ad561bedce0611a81ab55a02b89a2`（2026-09-20 15:11:56）。事故发生时点（2026-09-20 19:32 前后）跑的就是这份代码，因此下文行号即事故现场行号。
> 事故证据：`research/REQ-full-inventory.md`（316 单元清点 + 第二部分 L-01..L-38）
> 本报告未修改任何文件。

---

## 0. 一句话结论

make-decision 的需求保真机制在**两个粒度上都失守**：录入粒度是「OI 行」而不是「原始需求单元」，校验粒度是「五类标签各出现一次」而不是「逐条逐字强度」——**在 316 条原始需求被压缩成约 17 条 OI 的那一刻，下游再也没有任何环节能看见被丢掉的 299 条**；而唯一按条目绑定的强校验器 `assertDecisionCoverageReadyForConfirmation` 在生产路径上**根本没有被调用**。

---

## 1. 根因清单

每条给出：机制名 / 位置 / 因果链 / 证据 / 判定。

### R-1 覆盖矩阵与收敛校验是“类别级”而非“逐条级” —— **证实（主要根因）**

- **机制名**：requirement-to-decision coverage matrix + `analyzeDecisionConvergence` 的类别存在性校验。
- **它在哪**：
  - 契约文本：`workflows/make-decision/SKILL.md:184-192`
  - 校验实现：`runtime/stage/stage-content-contracts.mjs` 的 `analyzeDecisionConvergence`（L3361-3509）与 `parseCoverageRows`（L2770-2783）
  - 生产调用点：`runtime/stage/stage-handlers.mjs:3615-3627`
- **因果链**：契约要求矩阵“覆盖五个维度”，但校验只做三件事——① 决策日志里存在匹配正则的章节；② 该章节里 ≥2 行表格；③ 每行的 status 列命中一个宽泛枚举。**没有任何一条检查把矩阵行与原始需求单元对齐，也没有任何检查比较“这条需求的强度是否被削弱”**。于是矩阵可以只挂类别标签（“业务目标/流程/数据/验收/约束”）就通过。
- **证据（原文）**：

  SKILL 的承诺（`workflows/make-decision/SKILL.md:184-192`）：
  > `1. Replay the original requirement and create the unique current OI outline before research. … Completion: every part of the original requirement is represented or explicitly marked unresolved. Record the requirement-to-decision coverage matrix so that every original requirement has a visible disposition; the matrix must cover the five dimensions: business goal, flow/surface, data/state, success/failure/acceptance, and constraints/non-goals/deferrals.`

  校验实现只查章节与行数（`stage-content-contracts.mjs:3387`、`3415-3436`）：
  > `3387:  const requirementCoverage = hasSection(/^#{1,3}\s*(?:原始需求|requirement|来源与决策映射|需求→决定|需求矩阵)/im) || /(?:R-001|原始需求|requirement).*(?:D-001|决定|decision)/i.test(text);`
  > `3418:  if (requirementCoverage && coverageRows.length < 2) {`
  > `3419:    errors.push("requirement coverage section does not contain a mapped rows");`
  > `3422:    const dispositionColumn = coverageRows[0].findIndex((cell) => /状态|处置|disposition|status/i.test(cell));`
  > `3430:        if (!disposition || !/(?:covered|accepted_omission|deferred|rejected|non.?goal|延期|拒绝|覆盖|已接受)/i.test(disposition)) {`

  `parseCoverageRows` 甚至不识别“矩阵”，只在 `## 原始需求…` 章节内抓**任意** ≥3 列的行（`stage-content-contracts.mjs:2770-2783`）：
  > `2775:    if (/^#{1,3}\s*(?:原始需求|requirement|来源与决策映射|需求→决定|需求矩阵)/i.test(line)) inCoverage = true;`
  > `2779:      if (cells.length >= 3 && !/^[-:]+$/.test(cells[0])) rows.push(cells);`

  事故现场 `decision-log.md:20` 的章节标题正是 `## 原始需求与输入`，其下 `**主输入**（只读）` 三个带状态色的条目即满足“≥2 行 + 有 status 列”。**“316 条需求 → 决策”的覆盖矩阵在事故现场根本不存在，但校验报告为通过。**
- **判定**：**证实，且为主要根因。**共 25 条需求（L-09 明说“机制诊断已点名该缺陷，card-02 却复刻同一缺陷”）由此不可见。

---

### R-2 唯一真正的逐条强校验器存在，但生产路径上没有被调用 —— **证实（主要根因之二）**

- **机制名**：`decision-coverage-audit.v1` + `decision-omission-acceptance.v1` 遗漏附录机制。
- **它在哪**：`stage-content-contracts.mjs:2701-2750`、`3582-3636`。
- **因果链**：代码里**已经有一套正确设计的逐条机制**——`buildDecisionCoverageAudit` 对每个 source item（带 ref/hash）逐条求映射，无映射即 `coverage_status: "missing"`；`assertDecisionCoverageReadyForConfirmation` 在 `missing !== 0` 时抛错 `unhandled decision omissions must be shown to the user and resolved before final confirmation`。若它在生产路径上被调用，38 条遗漏至少会被强制“逐条展示给用户或写进 omission appendix”。**但它没有生产调用者。**
- **证据（原文）**：
  > `stage-content-contracts.mjs:2720:      if (!new Set(["covered", "accepted_omission"]).has(item?.coverage_status)) errors.push(\`source ${key} has invalid coverage status\`);`
  > `2736:    if (counts.missing !== 0) errors.push("unhandled decision omission blocks final confirmation");`
  > `3633:    throw new Error("unhandled decision omissions must be shown to the user and resolved before final confirmation");`

  全仓调用者检索（排除 `specs/archive` 与 `node_modules`）：
  ```
  $ grep -rn "assertDecisionCoverageReadyForConfirmation|buildDecisionCoverageAudit|validateDecisionLogContract" --include=*.mjs .
  ./runtime/stage/stage-content-contracts.mjs:2701  (定义)
  ./runtime/stage/stage-content-contracts.mjs:3582  (定义)
  ./runtime/stage/stage-content-contracts.mjs:3630  (定义)
  ./tests/stage-decision-contract.test.mjs:9,19,35,205,215,227,239,258   (仅测试)
  ```
  `runtime/stage/stage-handlers.mjs` 的 make-decision 完成处理器（L3615 起）只调用 `analyzeDecisionConvergence`（类别级）；`validateRequirementCoverage` 只在 `validateStageMaterialContracts`（L5748-5763）里被调用，且它要求的输入是 `packet.authenticated_requirement_messages` / `requirement_coverage_outputs`。
- **判定**：**证实。** 这是与 R-1 并列的主要根因：R-1 让遗漏算不出来，R-2 让“本来算得出来的那套”不生效。注意此处还存在**输入粒度旁路**：`validateRequirementCoverage` 只要求“每条**认证消息**恰好一个 output + 五类各出现一次”（`stage-content-contracts.mjs:2540-2563`），**一条消息可以承载几十条最小需求单元**。316 条被装进约 22 条 U-001/U-002/E/M 条目（事故现场 `decision-log.md:40-96`）后，该校验必然通过。

---

### R-3 “先建 OI 大纲、再调研”把压缩固化在上游 —— **证实（主要根因之三）**

- **机制名**：unique OI outline 前置 + “唯一 authority、不得另建需求账本”。
- **它在哪**：`workflows/make-decision/SKILL.md:59-66`、`:184-185`、`:220-230`；`workflows/make-decision/steps.json:5-6`。
- **因果链**：OI 大纲在 research *之前*建立，且是 question/source/status/terminal disposition 的**唯一来源**（SKILL:64-66）。OI 行的 `question` 是**重写后的一句话提问**，不是原始声明的逐字保留；OI 行同时携带 `status/selected_disposition/evidence/acceptance/counterexample`（事故现场每个 OI 块即有这些终态字段）。于是：
  1. 录入端：316 条原始声明 → 约 17 条 OI（事故现场 `decision-log.md:145-490`）。凡未被某一 OI 的 question 覆盖到的原始声明，**在系统里不存在**。
  2. 输出端：OI 块里的 `selected_disposition` 等终态字段**本身被下游当作已成文的结论**（它们同时承担“问题”和“答案”两个角色），压缩不再是“待填空”，而是“已定稿”。
- **证据（原文）**：
  > `SKILL.md:59-66: Before research starts, this stage creates exactly one current OI outline in the same \`decision-log.md\`. … Each row has an OI reference or \`empty: true\` with a concrete reason; omitted, bare-none, duplicate, or substituted rows are gaps. The OI record is the one source for question, source, status and terminal disposition. It is not a fifth material or a second state machine.`
  > `SKILL.md:220-222: 2. Execute the manifest in order. \`step 1–10 写材料；step 11–14 只落 task store\``
  > `steps.json:6: "observable_result": "The initial OI framework nodes, fixed categories, scope, uncertainty, and non-goals are written into decision-log.md; …"`
- **关键量化证据**：事故现场 OI-003 的 `source` 字段写的是
  > `decision-log.md:190: "source": "母 PRD CARD-02 L266「流程/状态」节、L268；I-B 报告 §4 质量核心 K1–K12；用户 U-001"`
  即 source 指向的是 **I-B 报告的 K1–K12 十二项**，而 OI-003/T-004 实际交付的是 **K1–K8 八项**（见 L-03）。**压缩就发生在 source → OI → 产出这条链上，而链条的任何一环都没有逐字比对。**
- **判定**：**证实，为主要根因之一。** 这是“信息在哪一步丢失”的答案所在（见第 3 节）。

---

### R-4 没有任何机制校验“OI 集合是否覆盖全部原始需求” —— **证实**

- **机制名**：`analyzeDecisionOutline`。
- **它在哪**：`runtime/stage/stage-content-contracts.mjs:3038-3260`（签名 L3038）。
- **它校验什么**（逐条读出）：
  - 六节点是否齐全、六类别是否齐全（L3083-3084）
  - 每行有 OI 引用或 `empty: true` + 具体理由（L3064-3066）
  - OI 记录 id 合法/不重复（L3090-3091）、被引用的 OI 必须有记录（L3095）、有记录的 OI 必须被引用（L3096）
  - `task_id` / `outline_version` 一致（L3100-3105）
  - `category` 合法、`source`/`question` 非空（L3119-3120）
  - `status` 合法；terminal 状态各自的必填字段（confirmed 要 selected_disposition/evidence/acceptance/counterexample，L3130-3133；deferred 要 owner/trigger/scope/impact/follow_up_acceptance，L3134-3137；not_applicable 要 reason + counterexample boundary，L3139-3141）
  - core impact 必须有 `requires_user_decision=true` 及 aggregate 绑定（L3125-3171）
  - direction 视角必须是 questions-only 投影且逐 OI 匹配（L3175-3197）
- **它不校验什么**（决定性）：**完全没有“OI 集合 ∪ = 原始需求集合”这条判断**。全文没有把 `originalRequirement` 作为入参传入 `analyzeDecisionOutline`（签名 L3038-3042 只有 `taskId / directionReview / interactionAggregate`）。`source` 字段只要“非空”即可（L3120），不要求可定位到原始声明，更不要求逐字。
- **证据（原文）**：
  > `3120:    for (const [field, label] of [["source", "source"], ["question", "question"]]) if (!substantiveOutlineValue(record[field])) errors.push(\`OI ${id} ${label} is missing\`);`
  > 签名 `3038-3042`：`export function analyzeDecisionOutline(decisionLogMarkdown, { taskId = null, directionReview = null, interactionAggregate = null } = {}) {`
- **判定**：**证实。** R-3 的压缩之所以“不可见”，正是因为本条缺位。

---

### R-5 三档结论与保真结构（SD-09/SD-10）在本仓**从未实现** —— **证实（但需正确定性）**

- **机制名**：SD-09 逐字双层需求保真 + 三档结论（接受 / 接受但有偏离 / 拒绝）+ 待复核；SD-10 append-only。
- **它在哪**：只在**母 PRD**里，不在任何技能或校验器里。
- **因果链**：没有逐字层 → 没有“原文 vs 当前口径”的对照对象；没有三档 → 偏离不需要被命名，因此**压缩在材料里不可见**。当 agent 把“不建 severity 门槛”换成四档分级时，材料上写的是“用户选择”，看不出这是偏离。
- **证据（原文 + 检索）**：
  母 PRD 有（`specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md:61,65`）：
  > `### SD-09 逐字双层需求保真与三档结论`
  > `### SD-10 append-only 收敛`

  技能侧检索为空：
  ```
  $ grep -rn "SD-09|SD-10|三档|append-only|待复核|逐字双层|只追加" \
      workflows/make-decision/ skills/decision-log/ skills/spec-analyze/ skills/talk-with-zhipeng/
  (无输出)
  ```
  `skills/decision-log/SKILL.md` 只有 `Preserve actual user wording when it defines an interface or boundary`（L177 附近，弱化为“接口或边界时”）与 `never rewrite history`（L179），**没有三档、没有待复核、没有“逐字层不可改写”**。
  归属证据：母 PRD `prd.md:175` 明确 `OI-010 | make-decision 改造为头脑风暴平台 | SD-09/SD-10 … | CARD-07`，`prd.md:453` 写明 CARD-07 的“最小读取集:必需=本卡 + SD-09/SD-10 + OI-010”。**SD-09/SD-10 的实现归 CARD-07，card-02 不在其责任面内。**
- **判定**：**证实存在，但不是 make-decision 的“实现缺陷”，而是机制缺口的一个已登记延期项。** 需要正确定性：SD-09/SD-10 缺失解释的是“**压缩为何不可见**”（即 38 条为何能一路走到完成而没有一处报警），**不是“压缩为何发生”**。压缩发生的直接原因是 R-1/R-3。
  旁证：本 task 事后自行补出的 `## 需求保真（fidelity，append-only 机制）`（事故现场 `decision-log.md:951-975`）与 `## 三档结论表`（L983 起）**恰恰是 SD-09 的重新发明**——用户/主会话不得不在材料里手工重建一个本该由 stage 提供的机制，这本身就证明该机制缺位。

---

### R-6 完成判据没有“逐条核对原始需求” —— **证实**

- **机制名**：`## Completion and fact writing`。
- **它在哪**：`workflows/make-decision/SKILL.md:408-416`。
- **因果链**：完成判据是“流程走完了”（Talk resolved / research done / Grill ran / findings disposed / user confirmed / aggregate bound），**没有一条是“原始需求逐条承接”**。因此一个把 316 条压成 17 条 OI 的执行，只要 Talk 跑了 3 轮、两条 review 有记录、用户点了确认，就满足全部完成条件。
- **证据（原文）**：
  > `SKILL.md:410-416: Do not claim this stage complete until Talk is resolved, any conditional Talk round 4 trigger is evaluated and handled, necessary research ran or has a truthful outcome, Grill ran, \`decision-log.md\` is current, independent review findings and transport facts are recorded, every finding has a disposition, the user explicitly confirmed the decision, and the content-addressed interaction aggregate binds that accepted decision.`

  唯一接近“逐条”的文本在 step 1 的 Completion 里（`SKILL.md:186-187: every part of the original requirement is represented or explicitly marked unresolved`），但：
  - 它没有任何校验器实现（见 R-1）；
  - 它不在 `## Completion` 节，不构成完成判据；
  - “represented”的判定主体是写 OI 的那一方，属**自审**，与 `AGENTS.md`「质量裁决由独立来源独立上下文产出，禁止自审自判」相悖实践。
- **判定**：**证实。**

---

### R-7 上下文守恒规则的 500 字上限 —— **证实存在，但非主要根因（部分成立）**

- **机制名**：Context conservation rules 第 1、2 条（S 回传 ≤500 字 / 主会话只留 ref+sha256+≤500 字摘要）。
- **它在哪**：`workflows/make-decision/SKILL.md:397-406`。
- **因果链（为什么不是主因）**：这两条**并不销毁原文**——原文要求先落盘到 `task_dir` 质量证据区/worktree artifact，回传的是摘要。所以严格说它不构成“信息丢失”，而是“主会话看不到细节”。但它是**放大器**：主会话只持有 ≤500 字摘要时，它没有能力在 step 1 建 OI 或 step 9 写草稿时逐条比对原始需求。母 PRD 事后已把“取消 500 字回传上限”列为修复项（`prd.md:427`、`prd.md:432 FR-34`、`prd.md:439 AC-34`）。
- **证据（原文）**：
  > `SKILL.md:399: 1. 全量 research-report、审查原始结果、debate 产物和草稿全文都落到 task_dir 的质量证据区或 worktree artifact；主会话只保留 \`ref + sha256 + 结构化摘要（≤500 字）\`。`
  > `SKILL.md:400: 2. S 回传必须是结论条目、证据 ref、置信度；研究/草稿/汇总类不超过 500 字，复核类按 \`severity|位置|问题|建议\` 一行一条，不回传长日志。`
  > `SKILL.md:384`（step 6 handoff 列）`: B 后台执行红/蓝审查；S 只归纳主题和争议，不做质量裁决；全文≤2页落盘，主会话摘要≤500字`
- **判定**：**部分成立（次要根因 / 放大器）。** 判定依据：① 原文落盘，不是销毁；② 本次事故的 38 条里，L-06/L-07/L-08 等整簇丢失发生在 **OI 录入端**（OI 里根本没有对应行），与摘要长度无关；③ 但若主会话持有全文，R-3 的压缩有机会在 step 1 被自查发现，因此它是重要加剧因素。

---

### R-8 方向审查/细节审查的输入是 questions-only 投影 —— **证实**

- **机制名**：direction advice 消费 `convergence_outline` questions-only projection；detail advice 逐 OI 检查 terminal 字段。
- **它在哪**：`SKILL.md:68-76`（三个 consumer 定义）、`steps.json:10,14`；实现 `runtime/stage/stage-handlers.mjs:972-1032`（`buildDirectionReviewInput`）、`stage-content-contracts.mjs:3004-3014`（`deriveQuestionsOnlyOutline`）、`3182-3197`。
- **因果链**：投影的允许字段被**硬编码白名单**为 `oi_id/id/category/source/question/status`，且 `status` 被强制写死为 `"open"`；同时**显式禁止** `answer / selected_disposition / disposition / evidence / conclusion / proposed_answer / interaction_ref / interaction_hash`。也就是说：
  - 审查者看到的 `question` 是**已被压缩过的提问**；
  - 审查者**看不到**用户原始声明、看不到终态 disposition，因此无法判断“这条 OI 的提问是否篡改了原意”；
  - 投影的完整性校验只要求“覆盖当前 OI 集合恰好一次”（L3183-3185），**不要求覆盖原始需求**。
- **证据（原文）**：
  > `stage-content-contracts.mjs:3006-3012:  const entries = [...byId.values()].map((record) => ({ oi_id: …, category: record.category, source: record.source, question: record.question, status: "open", }));`
  > `3182:    const allowedDirectionEntryFields = new Set(["oi_id", "id", "category", "source", "question", "status"]);`
  > `3185:    if (!sameIds) errors.push("direction convergence_outline does not cover every current OI exactly once");`
  > `3197:      for (const forbidden of ["answer", "selected_disposition", "disposition", "evidence", "conclusion", "proposed_answer", "interaction_ref", "interaction_hash"]) if (Object.hasOwn(entry ?? {}, forbidden)) errors.push(\`direction convergence_outline leaks ${forbidden}\`);`
  > `stage-handlers.mjs:1021-1028` 同样把 canonical entry 收敛为五字段并 hash。
- **判定**：**证实。** 审查“通过”只证明“当前 17 条 OI 内部自洽”，证明不了“316 条原始需求被承接”。这与 `AGENTS.md`「质量裁决由独立来源独立上下文产出」形式相符、实质失效——独立来源拿到的是被压缩后的输入。

---

### R-9 “Ask only questions whose answers could change direction” —— **部分成立（次因，非主因）**

- **机制名**：问题边界约束。
- **它在哪**：`SKILL.md:38-45`（`规划任务` 的方向级问题 + D-004 禁问清单）、`SKILL.md:244`（通用句）。
- **因果链（需要拆成两半）**：
  - **子命题 A“该约束导致实现级需求从不被提问”**：**推翻**。`SKILL.md:37-48` 明确区分任务类型：`普通任务` 保留实现细节提问权（`普通任务 keeps the existing question and artifact depth，可以继续追问实现细节, including questions about implementation details when their answers can change the implementation.`），而事故现场 `decision-log.md:3` 声明的是 `**任务类型**：普通任务`，`decision-log.md:16` 还专门写了选它的理由。所以本次事故**不受** D-004 禁问清单约束。
  - **子命题 B“问题只从 OI 派生，导致无 OI 的需求永不被提问”**：**证实**。`SKILL.md:64-66` 规定 OI 是 question 的唯一来源；`SKILL.md:229-230` 规定 Talk/research 只能“更新当前 outline 版本而不是创建第二个列表”。问题生成器 = OI 集合，于是**没有 OI 行的原始需求（如 G-2 豁免、oracle 分离、有条件 TDD）永远不会成为一个问题**，也就永远不会被登记为未决项。
- **证据（原文）**：
  > `SKILL.md:38-41: For \`规划任务\`, ask only questions that can change the direction: … The single authoritative D-004 forbidden list for planning questions is: 文件路径与文件面、函数名、字段名、算法、schema 形状、命令形态、入口参数形态、行号、代码片段、测试记录与实测记录.`
  > `SKILL.md:45-47: \`普通任务\` keeps the existing question and artifact depth，可以继续追问实现细节，including questions about implementation details when their answers can change the implementation.`
  > `SKILL.md:244: Ask only questions whose answers could change direction. Talk must cover both architecture direction and product journey or user outcome.`
  > `SKILL.md:64-66: The OI record is the one source for question, source, status and terminal disposition.`
  > `SKILL.md:228-230: Talk and research may add or revise OI rows, but they must update the current outline version rather than create a second list.`
- **判定**：**部分成立。** 真正的缺陷不是“只问方向级”，而是“**问什么由 OI 决定**”——问题边界本身继承 R-3 的压缩。

---

### R-10 “step 1–10 写材料；step 11–14 只落 task store” —— **部分成立（次要根因）**

- **机制名**：步骤分段写权约束。
- **它在哪**：`SKILL.md:220-230`；`steps.json:15-18`。
- **因果链**：该条禁止 step 11-14 向 `decision-log.md` 追加 agent 写的 step 小节，本意是防双写。但它的副作用是：**当用户在 step 11（approve-decision）之后指出“我的原始需求都被你压缩了”时，材料侧的补漏通道已按设计关闭**。实际后果可见事故现场：补漏最终是以“事后另起 `## 原始声明（verbatim，append-only）`（L818-949）+ `## 需求保真`（L951-975）+ `## 三档结论表`（L983 起）+ `## 决策追加 T-027..T-030`”的方式发生的——**是一个事后手工重建的平行结构，而不是机制内的回填**。
- **证据（原文）**：
  > `SKILL.md:220-225: 2. Execute the manifest in order. \`step 1–10 写材料；step 11–14 只落 task store\`：steps 1–10 write the current materials through their existing owners. From step 11 through step 14, only write stage facts to the task store (\`quality/evidence/handoff/\`, \`quality/stage-reflection/<stage>/\`, and \`facts.jsonl\`); do not append agent-created step sections to \`decision-log.md\`.`
  > `steps.json:15: "observable_result": "The user's actual confirmation is recorded in decision-log.md; …"`
  > `steps.json:16: "observable_result": "The existing spec-analyze profile checks the original requirement … valid gaps are repaired in this stage …"`
- **判定**：**部分成立。** 需要与本条同时读：`steps.json:16` 的 stage-end-spec-analyze 声称“valid gaps are repaired in this stage”，所以“补漏无落点”是**文本内部张力**（step 12 承诺修复，但 step 11-14 的写权又被限死）。真正起决定作用的仍是 R-1/R-2：即使补漏有落点，也没有校验器逼出补漏。

---

### R-11 检查器覆盖盘点：有没有任何一个校验器会因“原始需求未被逐条承接”而失败？ —— **证实：没有**

- **逐个说明**：

  | 校验器 | 位置 | 实际校验 | 会因逐条遗漏失败吗 |
  | --- | --- | --- | --- |
  | `analyzeDecisionOutline` | `stage-content-contracts.mjs:3038-3260` | 六节点/六类别齐全、OI 行自洽、terminal 字段齐备、direction 投影逐 OI 匹配 | **否**（不接收 `originalRequirement`，无 OI↔需求对齐） |
  | `analyzeDecisionConvergence` | 同上 `3361-3509` | 章节存在、矩阵 ≥2 行、status 命中枚举、五类标签各出现一次 | **否**（类别级） |
  | `validateRequirementCoverage` | 同上 `2519-2569` | 每条**认证消息**一个 output、message_class ∈ 5 类、五类齐备、high/medium 的 defer/not_asked 要 skip_reason | **否**（粒度=消息，非需求单元；一条消息可装 N 条需求） |
  | `validateDecisionLogContract` + `buildDecisionCoverageAudit` + `assertDecisionCoverageReadyForConfirmation` | 同上 `2701-2750`、`3582-3636` | **逐 source item** 配对，无映射即 `missing`，`missing !== 0` 抛错 | **会——但只被测试调用，生产路径零调用者** |
  | `validateDecisionLogStepUpdateContract` | 同上 `2576+` | step 更新的 append-only / disposition 绑定 | **否**（不校验内容覆盖；且同样只见于测试） |
  | `check-decision-log-chain.mjs` | `tools/cli/check-decision-log-chain.mjs:53-125` | 每个 `### D-<n>` 小节的 `module/requirement_ids/derived_from/artifacts` 字段存在性与格式 | **否**，且**永不失败**：`exit_code: 0`（L60/L123），docstring L6-8 自认 “deliberately never becomes a gate … the process exits 0”；`failures: []` 恒空 |
  | `check-stage-quality.mjs` | `tools/cli/check-stage-quality.mjs` | **完全无关**：只扫 `metrics/` + `scripts/` 下的三类反模式（V6① collectFacts 阻断开销、V6② stage_result 运行时阻断、V6③ 主观指标硬门），scan 目录见 L178-221 | **否**（连 decision-log 都不读） |
  | `spec-analyze` 阶段末一致性 | `skills/spec-analyze/SKILL.md:47-51` + `validateStageSpecAnalyzeProfile`（`stage-content-contracts.mjs:5798+`）/`validateStageMaterialContracts`（`5748-5763`） | 文本层承诺“Map every raw requirement/source ID from decision-log to the decision/spec/plan/task/FR/AC”（L47），但 make-decision 分支只跑 `validateRequirementCoverage` + `validateGrillSummary` + `validateFinalConfirmation` | **否**（承诺与实现有差距；缺口早在 2026-08-28 就被记录，见第 7 节） |

- **判定**：**证实——不存在任何校验器会因“原始需求未被逐条承接”而报失败。** 唯一具备该能力的实现是死代码。

---

## 2. 因果链图：从原始需求到最终材料，信息在哪一步丢失

```
[1] 原始需求：316 个最小需求单元
    来源：母 PRD(prd.md, 673 行) + 规划 decision-log(1001 行) + 用户陈述
    形态：逐字声明，散落在 SD-01..SD-17 / FR / AC / CARD 卡节 / Talk Q1-Q17 / Grill G-1..G-4
    │
    │  ✂ 丢失点 #1（人工转写、无逐字层）
    │     · 无机制：SD-09「原始声明不得改写 + 派生需求带 source 锚点」在本仓 0 实现（R-5）
    │     · 校验：无。spec-analyze 不比对原始声明
    │     · 事故现场：316 → 约 22 条（U-001/E-1..E-7、U-002/U-002-1..14、M-1..M-3）
    ▼
[2] 已登记需求：约 22 条叙事条目（decision-log.md:40-96）
    │    ← ⚠️ 此刻"逐条"这个词已经失效
    │
    │  ✂ 丢失点 #2 ★主要丢失点★（OI 录入，压缩在这里固化）
    │     · 机制：SKILL.md:59-66「调研前建立唯一 OI 大纲」+「OI 是 question/source/status 的唯一来源」
    │     · question 是重写后的一句话，不是原话；未覆盖的声明在系统内不存在
    │     · 校验：analyzeDecisionOutline（3038-3260）——校验行内自洽，不校验 OI↔原始需求对齐  ← R-4
    │     · 事故现场：22 → 17 条 OI（OI-001..OI-017）
    │       · OI 列表中没有任何一行对应「有条件 TDD/有效 RED/G-2」「oracle 与实现者分离」
    │         「SD-09/SD-10」「停止规则」「K9-K12」……
    ▼
[3] OI 大纲 v2：17 条 OI（decision-log.md:111-490）
    │    · OI 行同时携带 status/selected_disposition/evidence/acceptance/counterexample
    │      ⇒ 压缩已经"定稿"，不再是待填空
    │
    │  ✂ 丢失点 #3（覆盖矩阵，类别级核对）
    │     · 机制：SKILL.md:188-192 要求"矩阵覆盖五个维度"
    │     · 校验：analyzeDecisionConvergence（3387/3415-3436）只查章节存在 + ≥2 行 + status 命中枚举
    │     · parseCoverageRows（2770-2783）甚至不认矩阵，只在 ## 原始需求… 里抓任意 ≥3 列行
    │     · ⇒ 事故现场根本没有 R→D 矩阵，校验仍报 passed           ← R-1（主要根因）
    ▼
[4] 覆盖矩阵：省略或仅类别标签        【校验层在此处给出"通过"假象】
    │
    │  ✂ 丢失点 #4（认证消息粒度旁路）
    │     · 校验：validateRequirementCoverage（2519-2569）粒度 = "认证消息"，非需求单元
    │     · 一条消息可承载 N 条需求 ⇒ 22 条消息 × 5 类齐备 = passed   ← R-2 输入侧旁路
    ▼
[5] spec-analyze 阶段末一致性检查 → requirement_coverage = passed
    │    · skills/spec-analyze/SKILL.md:47 承诺"Map every raw requirement/source ID"
    │    · 实现（stage-content-contracts.mjs:5748-5763）只跑类别级校验
    │    · 唯一逐条校验器 assertDecisionCoverageReadyForConfirmation（3630）
    │      在本仓生产路径 0 调用者                                  ← R-2（主要根因）
    ▼
[6] 方向审查 / 细节审查（step 6 / step 10）
    │    · 输入 = questions-only 投影：仅 [oi_id, category, source, question, status="open"]
    │      显式禁入 answer/selected_disposition/evidence/conclusion（3197）
    │    · 审查者看不到原话、看不到终态、看不到遗漏
    │    · 完整性只要求"覆盖当前 OI 恰好一次"（3185），不要求覆盖原始需求  ← R-8
    ▼
[7] 完成判据（SKILL.md:410-416）：Talk 跑完 + review 有记录 + 用户确认
    │    · 没有任何一条要求"逐条核对原始需求"                        ← R-6
    ▼
[8] 最终材料：13 条压缩/偏离 + 25 条丢失 = 38 条未完整承接
        用户反馈：「我的原始需求都被你压缩了」「一直在收敛，没帮我扩散」
        事后补漏：手工另起 ## 原始声明 / ## 需求保真 / ## 三档结论表
                  （因为 step 11-14 写权已按设计关闭）              ← R-10
```

**信息丢失的实际发生位置（一句话）**：
- **压缩发生并固化在 [2]→[3]（OI 录入）**；
- **遗漏之所以不被发现，是因为 [3]→[8] 全部链路的校验粒度都是“类别/行内自洽”，而唯一逐条校验器（R-2）不在生产路径上**。
- 即：**丢失在 OI 录入端，隐身在校验端。**

---

## 3. 单一根因 vs 多重根因的判定

### 判定：**存在一个“根因对”，不是单一根因，也不是 9 条并列均摊。**

**主因（root-cause pair）＝ R-1 + R-2，二者互为必要条件：**

| | 机制 | 角色 | 反证检验 |
| --- | --- | --- | --- |
| **R-1** | 覆盖矩阵与收敛校验是类别级，不校验逐条强度 | **让遗漏算不出来** | 若只修 R-1（矩阵改为逐条强度），压缩会在 step 1/step 12 被逼出来 → 38 条中大部分会被强制展示 |
| **R-2** | 逐条强校验器存在于代码但不在生产路径 | **让本该算出来的那套不生效** | 若只修 R-2（把 `assertDecisionCoverageReadyForConfirmation` 接入 approve-decision），`source_items` 仍由材料自报为“22 条消息”，遗漏照样通过 → **必须同时修 R-1 的粒度** |

**为什么 R-3（OI 大纲前置）不是独立主因、而是 R-1/R-2 的承载面**：
OI 大纲前置本身不必然导致压缩——如果 OI 行**逐字**保留原始声明、且校验器逐条对齐 OI↔原始需求，那么 316 条会在 OI 层就暴露为 299 条 `empty` 或缺失行，被 R-1/R-2 的校验拦下。因此“调研前建 OI”是**设计选择**（先收窄后调研，母 PRD 也已点名，见 `specs/.../decision-log.md:880`），“OI 粒度不保真 + 无人校验 OI 覆盖”才是**缺陷**。故 R-3 归为**结构性条件/主要承载面**，不入主因对。

**次因（放大器 / 使不可见）：**
- **R-5**（SD-09/SD-10 未实现）：让“偏离”和“逐字层”双双缺席，**压缩不可见**。但归属为 CARD-07 延期项（`prd.md:175,453`），不是 make-decision 的实现 bug。
- **R-8**（审查只吃 questions-only 投影）：让两道独立审查**形式独立、实质同源**——审的是被压缩后的输入。
- **R-6**（完成判据无逐条核对）：给压缩后的材料发了“完成”通行证。
- **R-7**（≤500 字回传）：主会话失去逐条比对的能力。
- **R-9 子命题 B**（问题只从 OI 派生）：让无 OI 的需求连“被提问”的机会都没有。

**已推翻 / 部分成立的候选：**
- **R-9 子命题 A「只问方向级导致实现级需求从不被提问」→ 推翻**：本次 task 声明为 `普通任务`（事故现场 `decision-log.md:3`），`SKILL.md:45-47` 明确允许实现细节提问；D-004 禁问清单只约束 `规划任务`。
- **R-10「step 11-14 只落 task store 让补漏没有落点」→ 部分成立**：与 `steps.json:16`（step 12 承诺在本阶段修复 gap）存在文本张力，但不是决定性因素。

**判定依据（三条独立证据线同时指向 R-1/R-2）：**
1. **历史复发**：同一缺陷在 `2026-08-04` 与 `2026-08-28` 两次任务中被明确诊断并“修复”（见第 7 节），两次都只修到**类别级**，本次原样复发 ⇒ 病根就在“粒度”。
2. **代码自证**：正确实现（`assertDecisionCoverageReadyForConfirmation`）已存在于同仓，只是没接线 ⇒ 病根不是“不知道怎么做”，而是“没接上”。
3. **事故现场自证**：38 条里 25 条属“整簇丢失”（G-2、oracle 分离、有条件 TDD、K9-K12、停止规则……），这些簇**没有一条 OI 行**——恰是 OI 录入端压缩的指纹（R-3 作为承载面），而它们本应被逐条校验拦下（R-1/R-2）。

---

## 4. 为什么现有检查器没抓到 —— 逐个说明它为何失明

| # | 检查器 | 失明原因（一句话） | 关键证据 |
| --- | --- | --- | --- |
| 1 | `analyzeDecisionOutline` | **入参里没有“原始需求”这个对象**，只校验 OI 大纲内部自洽（节点/类别/字段/状态/投影），因此 OI 集合本身少了 299 条，它看不到也管不着。 | 签名 `stage-content-contracts.mjs:3038-3042`；`source` 只要非空 L3120 |
| 2 | `analyzeDecisionConvergence` | **粒度错位**：它验的是“矩阵章节存在 + ≥2 行 + status 是合法枚举 + 五类标签各出现一次”，任何一张两行的源文件表都能满足；`parseCoverageRows` 更是只在 `## 原始需求…` 下抓任意 ≥3 列表格。 | L3387、L3418、L3422-3434；L2770-2783 |
| 3 | `validateRequirementCoverage` | **粒度错位（输入侧）**：以“认证消息”为单位，一条消息可装 N 条最小需求；只要 22 条消息各有 output 且五类齐备即通过。 | L2519-2569，尤其 L2540-2563 |
| 4 | `validateDecisionLogContract` / `buildDecisionCoverageAudit` / `assertDecisionCoverageReadyForConfirmation` | **不是失明，是没接线**：它是唯一逐 source item 配对的强校验，`missing !== 0` 直接抛错，但全仓生产路径 0 调用者，仅测试引用。 | 定义 L2701-2750、3582-3636；调用者检索仅 `tests/stage-decision-contract.test.mjs` |
| 5 | `validateDecisionLogStepUpdateContract` | 只校验 step 更新的 append-only / disposition 绑定，不校验内容覆盖；同样仅被测试引用。 | L2576+；调用者仅 tests |
| 6 | `check-decision-log-chain.mjs` | **设计上就永不失败**：只对 `### D-<n>` 小节的 `module/requirement_ids/derived_from/artifacts` 出 advisory warning，`failures: []` 恒空、`exit_code: 0`；且它只看 D 小节字段，不看需求承接。 | L6-8 docstring、L60/L118-124、L159-160 |
| 7 | `check-stage-quality.mjs` | **完全不相干**：扫描面是 `metrics/` + `scripts/` 下的三类反模式代码（V6①/②/③），连 `decision-log.md` 都不读。 | L178-221 `collectScanFiles`；L78-170 三类检测器 |
| 8 | `spec-analyze`（step 12，阶段末唯一语义检查） | **承诺与实现有差距**：SKILL 文本 L47 承诺“Map every raw requirement/source ID from decision-log to the decision…”，make-decision 分支实际只跑 `validateRequirementCoverage`（类别级）+ `validateGrillSummary` + `validateFinalConfirmation`；该差距在 `2026-08-28` 已被明确记录为“逐条覆盖=部分（需求列表主体自报）”。 | `skills/spec-analyze/SKILL.md:47-48`；`stage-content-contracts.mjs:5748-5763`；`specs/archive/make-decision-requirement-convergence-20260828/decision-log.md:385,387` |
| 9 | 方向审查 / 细节审查（step 6 / step 10） | **输入被投影裁剪**：审查者只拿到 `[oi_id, category, source, question, status="open"]`，`answer/selected_disposition/evidence/conclusion` 被显式列为 forbidden leak；完整性只要求覆盖当前 OI 恰好一次。审查“独立”但审的是被压缩后的世界。 | `stage-handlers.mjs:1021-1028`；`stage-content-contracts.mjs:3182-3197` |

**共同失明模式（可复用的诊断结论）**：
所有检查器都在回答「**这份材料内部自洽吗**」，没有一个在回答「**这份材料相对原始需求完整吗**」。前者的对象是材料，后者的对象是需求——而原始需求在 make-decision 里**从来不是被校验的一等对象**（`analyzeDecisionOutline` 连入参都没有它）。

---

## 5. 修复点的定位：每个根因对应“最小修复面”

| 根因 | 最小修复面 | 具体到文件/位置 | 说明 |
| --- | --- | --- | --- |
| **R-1** 覆盖矩阵类别级 | **① 校验器代码 + ② SKILL 文本** | ① `runtime/stage/stage-content-contracts.mjs:3415-3436`（`analyzeDecisionConvergence` 的矩阵分支）：要求矩阵行必须绑定可定位的原始声明锚点，并逐行做“原口径 vs 当前口径”非空校验<br>② `workflows/make-decision/SKILL.md:188-192`：把“cover the five dimensions”改写为“每个原始需求单元一行 + 强度对照列” | 校验器改在前，SKILL 改在后，避免文本先承诺、实现不跟进 |
| **R-2** 逐条校验器未接线 | **③ 运行时接线（stage-handlers）+ ④ 材料模板** | ① `runtime/stage/stage-handlers.mjs` make-decision approve/complete 路径（L3615 附近）：在 `interaction_aggregate` 接受前调用 `assertDecisionCoverageReadyForConfirmation(buildDecisionCoverageAudit({...}))`，`sourceItems` 取自**原始需求清点**而非材料自报<br>② `workflows/make-decision/SKILL.md:306-316`：把 aggregate 装配前置改为“逐条 coverage audit 就绪” | `buildDecisionCoverageAudit`/`assertDecisionCoverageReadyForConfirmation` **已存在**，只需接线 + 换 sourceItems 来源；这是全仓投入产出比最高的一处 |
| **R-2 输入侧粒度** | **⑤ 校验器代码** | `stage-content-contracts.mjs:2519-2569` `validateRequirementCoverage`：把 `message_class` 五类的“类别计数”并存为“逐需求单元条目”，或要求 `axis_id` 与需求单元一一对应 | 与上一条同源；改粒度即可 |
| **R-3** OI 前置 + OI 粒度不保真 | **⑥ SKILL 文本 + ⑦ steps.json** | ① `SKILL.md:59-66`：OI 行新增“原始声明逐字引用 / source 锚点”必填字段（不新建材料，扩展既有 OI 记录字段）<br>② `steps.json:5-6`（step 1/2）：entry/observable_result 增加“以原始需求清点为输入、OI 集合须覆盖清点全集” | 注意：新增字段要先登记职责/consumer/删除条件（`AGENTS.md` 控制面纪律） |
| **R-5** SD-09/SD-10 未实现 | **⑧ SKILL 文本（只加“偏离标注”最小面）** | `workflows/make-decision/SKILL.md` 的 step 9 写草稿（`:289-294`）+ `skills/decision-log/SKILL.md:177-179`：在“逐字双层 + 三档 + 待复核”完整实现（CARD-07）之前，**最低限度**要求“任何改写用户原话至少并列原话与改写后口径” | **完整实现归 CARD-07**（`prd.md:175,453`）；本卡只做最小披露，不越界 |
| **R-6** 完成判据无逐条核对 | **⑨ SKILL 文本** | `SKILL.md:408-416` `## Completion and fact writing`：新增一条完成条件“原始需求清点逐条有 disposition（covered/accepted_omission/deferred/rejected）或显式排除理由” | 文本层最便宜的一处，但需 R-2 的校验器兜底才不是自审 |
| **R-7** ≤500 字回传 | **⑩ SKILL 文本** | `SKILL.md:384`、`:399`、`:400`：取消 500 字上限或改为“结构化候选清单 + 落盘全文 + 按需展开” | 母 PRD 已列为修复项（`prd.md:432 FR-34`、`prd.md:439 AC-34`），与本条一致 |
| **R-8** 审查只吃 questions-only | **⑪ 校验器代码 + ⑫ 审查输入模板** | ① `stage-content-contracts.mjs:3182` `allowedDirectionEntryFields`：增加只读的“原始声明锚点 + 当前口径”两字段<br>② `stage-handlers.mjs:972-1032 buildDirectionReviewInput`：canonical entry 带上原始声明锚点 | 需保持“不泄漏答案”的既有约束——原话不是答案，不冲突 |
| **R-9 子命题 B** 问题只从 OI 派生 | **⑬ SKILL 文本** | `SKILL.md:64-66`、`:228-230`：允许/要求“原始需求清点中未落到任何 OI 的条目，必须在下一轮 Talk 中作为问题或显式延期出现” | 与 R-1/R-3 同源，可合并 |
| **R-10** step 11-14 写权 | **⑭ SKILL 文本（澄清 border）** | `SKILL.md:220-225`：明确“用户提出实质性遗漏时，允许在同一 task 内向 `decision-log.md` 追加 append-only 的补回小节” | 与 `steps.json:16`（step 12 承诺修复 gap）对齐，消除文本张力 |

**最小修复面清单（按投入产出排序）：**
1. **接线** `assertDecisionCoverageReadyForConfirmation` 到 make-decision approve 路径，`sourceItems` 改取原始需求清点 —— **校验器代码 1 处 + 运行时 1 处**（直击 R-2）
2. **改粒度**：矩阵/覆盖校验从“类别是否出现”改为“逐条是否有 disposition + 强度对照” —— **校验器代码 1 处**（直击 R-1）
3. **OI 行加逐字锚点字段** —— **SKILL 文本 1 处 + OI 记录字段 1 处**（直击 R-3/R-4）
4. **完成判据补“逐条 disposition”** —— **SKILL 文本 1 处**（直击 R-6）
5. 其余（R-5/R-7/R-8/R-9/R-10）为放大器，**优先做 R-7（取消 500 字上限，母 PRD 已列）与 R-8（给审查者原始声明锚点）**。

---

## 6. 同类事故的历史证据

### H-1 `requirements-completeness-audit-20260804` —— 同类事故，用户亲自点名同一根因

`specs/archive/requirements-completeness-audit-20260804/decision-log.md`：
> `L14: | R2 | 调查五个根因：make-decision 漏需求、decision-log 不完整、build-spec 漏交付标准、verify-code 不回查原始需求、问题为何集中到最后才发现。 | U0 |`

该任务的 D2 决策（L140-147）已经给出了与本次完全同构的处方：
> `L141: - **问题/选择**：只记录"报告已覆盖"，还是逐个列出需求语义并指向决策？选择逐个列出。`
> `L143: - **来源**：五份报告；审计共同事实是粗粒度 \`3/3、4/4、5/5\` 不能证明用户结果已覆盖。`
> `L144: - **事实/推理**：报告中的页面、读者、订单、版本、真实数据和 close 语义被摘要吞掉；需求点矩阵能暴露"当前修复/后续/非目标/未决"。`
> `L146: - **后果/风险**：映射维护有成本；遗漏会在 coverage audit 暴露，而不是到最后才发现。`

另 `L156`：
> `- **事实/推理**：只维护 architecture queue 会漏策略列表、读者导航、订单生命周期、真实回测和 UI 失败；增加 product-journey queue 可在 make-decision 截住这些遗漏。`

`tasks.md:1265` 更直接写出了同一失败模式的名字：
> `- **goal**：重新检查 R1-R19、五份报告、INC-001~045、D1-D44、FR/AC/T，消除"任务全完成但需求遗漏"的错误结论。`

**对照结论**：2026-08-04 已经诊断出“make-decision 漏需求”、已经决定“逐个列出需求语义并指向决策”、已经写明“粗粒度 3/3、4/4、5/5 不能证明覆盖”——**本次 2026-09-19/20 的事故是同一根因的第三次发作**。

### H-2 `make-decision-requirement-convergence-20260828` —— 修复只到类别级，并如实记录了残余缺口

`specs/archive/make-decision-requirement-convergence-20260828/decision-log.md`：
> `L26: | R-013 | 收敛检查不能只看「原始需求有处置状态」，还要确认所有 decision 能**完整解决**原始需求，覆盖业务目标、未来扩展、UI 交互、验收目标、影响范围等维度。 | 用户原文：\`A，不仅要确认原始需求有处置状态，还要想办法确认所有decision可以完整的解决原始需求…\` | Talk R2 真实回复，选 A（R→D 覆盖矩阵 + 维度标注，spec-analyze 验收） |`

该任务的调研结论**逐字承认了缺口仍然存在**：
> `L385: - **spec-analyze 现状**：生产校验器 \`validateStageSpecAnalyzeProfile\`(stage-content-contracts.mjs:4029) + \`validateStageMaterialContracts\`(3982) + \`validateRequirementCoverage\`(1934)，stage-runner.mjs:367 强制调用。实际校验：……逐需求 coverage（semantic_match 为自报 expected/actual 浅字符串判断）……`
> `L387:   1. 逐条覆盖=**部分**（需求列表主体自报，adapter:310 只绑 decision-log.md）；`
> `L394: - **20260820 存档对照**：……**「目标达成/方案收敛」即使在 20260820 设计中（TE-2026-08-20 以来）也未要求，仍是缺口**。`

**对照结论**：2026-08-28 的实现把“逐条覆盖”做成了 `validateRequirementCoverage` 的**五类标签 + 消息级**校验（就是本次事故里那个必然通过的东西），并在同一份 decision-log 里**如实披露“逐条覆盖=部分”**。也就是说：
- 缺陷不是“没想到”；
- 缺口**已经被写入材料**，但**没有进入校验器**，因此下一次（本次）照样发生。

### H-3 历史证据的共同形态

| 时间 | 任务 | 提出的处方 | 落地到什么粒度 | 本次是否复发 |
| --- | --- | --- | --- | --- |
| 2026-08-04 | `requirements-completeness-audit-20260804` | 逐个列出需求语义并指向决策（D2） | 需求点矩阵（材料层） | **是** |
| 2026-08-20 | `workflowhub-standard-stage-flow-hardening-20260820` | 前四 stage 覆盖原始需求 / Grill 全需求矩阵（R-011/R-012） | 认证消息五类覆盖（类别级） | **是** |
| 2026-08-28 | `make-decision-requirement-convergence-20260828` | R-013：R→D 覆盖矩阵 + 维度标注 | `validateRequirementCoverage`（消息级 + 五类） | **是** |
| 2026-09-19/20 | **本次事故** `card-02` | —— | —— | 38 条遗漏 |

**结论**：这是**同一根因的第三次复发**，且每次“修复”都停在**类别级/消息级**，从未落到**需求单元级**。这构成 H-2 之外的独立判定依据：主因不在“执行者不认真”，而在**机制粒度**——三次修复都没有改粒度，所以每次都复发。

---

## 附：本报告的方法与局限（如实披露，不漂白）

1. **只读**：未修改任何被审文件。报告为新建文件。
2. **代码基准**：`workflowhub` 与事故 worktree 的 HEAD 均为 `cd26676a096ad561bedce0611a81ab55a02b89a2`，故文中行号即事故现场代码行号。
3. **生产/测试边界**：判定“R-2 未接线”的方法是全仓 `grep` 调用者（排除 `specs/archive`、`node_modules`）。未做动态运行验证（未执行 approve-decision 流程）。
4. **卡-02 运行时产物不可得**：`~/Knowledge/Projects/workflowhub/tasks/` 下**不存在** `workflowhub-thin-core-card-02-20260919` 目录，故无法核对当时的 `authenticated_requirement_messages` / `requirement_coverage_outputs` 原始 packet；本报告关于“316 条被装入约 22 条消息”的结论依据的是材料自身的 `U-001/E-*/U-002-*/M-*` 分解结构（`decision-log.md:40-96`）与 `validateRequirementCoverage` 的粒度契约，未做 packet 级实证。
5. **SD-09/SD-10 的归属**：按母 PRD `prd.md:175` 与 `prd.md:453`，其实现属 CARD-07 范围，本报告将其定性为“已登记延期的机制缺口”，未列为 make-decision 的实现缺陷。
6. **时效**：事故 worktree 的 `decision-log.md` 在本报告基线（`research/REQ-full-inventory.md` 的 779 行快照）之后已被追加到 1117 行，用户/主会话已自行补出 `## 原始声明` / `## 需求保真` / `## 三档结论表`。这些**事后补漏**不改变本报告对机制的分析——相反，第 3 节与第 5 节把它们的成因定位为 R-1/R-2/R-5/R-10。

# B 方案落地设计：缩小/退役决定必须引用 lens 条目

> 来源·产出：card-03 落地流程派发的只读调研子代理（外部调研 / 仓内审计；未改仓库任何文件）
> 来源·时间：2026-09-29 20:25（本机 CST，文件 mtime）
> 来源·支撑：支撑 decision-log §18 E14/E15/E16（缩小 / 退役决定必须引用 lens 条目）

只读审计产出，未改仓库任何文件。C3 = `/Users/Hugh/Hugh/Project/workflowhub-workflowhub-thin-core-card-03-20260919`（M1/M4/M5 与 §10 在案，其 `:78-83` 抄录见下）。
**重要口径**：主仓 `skills/plan-eng-review/SKILL.md` 当前只有 48 行、**尚无** §9/§10；`C3` 版为 89 行。故本文对 `skills/plan-eng-review/SKILL.md` 的引证一律标注 [C3]。

## 0. 事实基线（含一处新发现）

- 真正的绕过材料原因：build-plan 的 provider packet **required_skills 只声明 `review`**，`skills/wh-review/stage-skill-plan.json:32-39`（`"build-plan" → "required_skills": ["review"]`，:34）；而 `skills/wh-review/contracts/build-plan.md:56-58` 却写 `simplicity-guard` "作为同一 wh-review packet 内的 advisory lens"。合同承诺的 lens 不在 packet 声明里 ⇒ 名义提及、实质不递送。
- `workflows/build-plan/skill-deps.yaml:7` 确有 `simplicity-guard`（inline, trigger `simplicity_check`），但 `workflows/build-plan/SKILL.md:83-84` 把它与 `plan-eng-review` 并列为 "remain inline"；`:188-190` 逐字「`simplicity-guard` and `plan-eng-review` are ordinary advisory lenses in the declared review contract, not new workflow stages and not gates.」——**"declared review contract" 这一句与 packet 声明不符**（上面那条）。
- C3 `skills/plan-eng-review/SKILL.md:78-80` 逐字：「10. 加删同价的读数（report-only）：对每条 finding 标注**删除类**（删代码/删文件/删任务/删材料）或非删除类，并在结果里报出两个条数；只报数，**不设配额**、不要求「删够多少」，也不许为凑数把正常删除写成 finding。」→ **载体已存在：plan-eng-review 的 finding 流**（§10 已定义"每条 finding 分类 + 报数"）。
- `workflows/build-plan/SKILL.md:186-190` 逐字：「Do not create a double-solution exercise … or a process summary.」⇒ 不得新建第三份 lens 产物。
- `skills/spec-plan/SKILL.md:18` 逐字：「Choose reuse, then narrow extension, then new mechanism with stated consumer, owner, test, and removal condition.」——缩小/新增的决定**当前只要求写结论，不要求写出处**，这就是义务要挂的现有句。
- 落点载体（全部已存在，无需新建）：
  - `skills/spec-plan/templates/phase-template.md:24` `- **Risk and rollback**: [trigger, impact, mitigation, reversible action]`
  - `skills/spec-plan/templates/phase-template.md:18` `- **DO NOT TOUCH**: [exact protected paths and reason]`、`:19` Task order、`:16/:17` NEW/MODIFY
  - `skills/decision-log/templates/decision-log-template.md:289-293` `## 拒绝方案` 表（`| 选项 | 拒绝理由 | 关联 D |`）；:295-299 `## 风险与延期交接`
  - `skills/wh-review/contracts/build-plan.md:59-60` 逐字：「scope creep、重复已有能力、没有故障证据的长期能力，或修订后仍无理由保留的旧内容，报告具体删除或缩减 finding。」
- `skills/wh-review/scripts/review-materials.mjs:60` 已含 `"skills/simplicity-guard/"` ⇒ lens 文件**可被递送**；缺的是 required_skills 声明，不是投递路径。

## 1. B 落地设计（4 个落点，逐处给 file:line + 拟改文本）

### 落点 A｜何时加载 lens：搭车 `spec-plan` 的既有 reuse 选择句（不新增动作/不新增步骤）

**目标** `skills/spec-plan/SKILL.md:18`（主仓与 C3 同文；另 C3 该文件 bundle 已登记 2 files）。
**拟改文本**（在该句后追加 1 句）：
> Before writing a Phase or `spec.md` boundary decision that narrows, defers, or retires anything the current materials already contain, read `skills/simplicity-guard/SKILL.md` once and take its P0–P3 verdict into the decision; state which step (P0/P1/P2/P3) the decision stopped at.

理由：`:18` 本来就是"reuse → narrow → new"的唯一决定点，读一次 lens 是**搭车既有读材料动作**，不产生新 step、不产生新调用。与 C3 `:78-83` 的 §10 同源（§10 是复核侧，这里是作者侧）。

### 落点 B｜产出形态：复用 plan-eng-review 的 finding 流，不新建产物

**目标** C3 `skills/plan-eng-review/SKILL.md:78-83`（§10 内），追加 1 句（**不放逐条配额的措辞**）：
> 每条 finding 的文案里带上它引用的 simplicity-guard 阶梯或具体条目；对**缩小/退役/删除**类 finding，写明依据的是哪一条（P0 缺必要性证据 / P1 已有覆盖 / P2 可改造复用 / P3 非最小新增）。
**落点载体**：既有 `quality/reviews/attempts/<attempt_id>/attempt.json`（`skills/wh-review/contracts/build-plan.md:68-70` 的 findings-only JSON）+ 既有 `## 审查处置` 表 `skills/decision-log/templates/decision-log-template.md:279`。**不新建文件类型、不加字段**（B-08 禁止新建 schema）。

### 落点 C｜引用义务：写进 Phase 正文的既有 `Risk and rollback` 与 `## 拒绝方案`

**目标 1** `skills/spec-plan/templates/phase-template.md:24`（L1 内既有 bullet）。
**拟改文本**：
> - **Risk and rollback**: [trigger, impact, mitigation, reversible action；若本 Phase 缩小范围、退役或删除已存在内容：引用 lens 条目（P0–P3 + 该条 finding），未使用 lens 则写 `未使用 lens — 理由（≤1 句）`]

**目标 2** `skills/decision-log/templates/decision-log-template.md:289-293` `## 拒绝方案` 表。
**拟改文本**（在表头下的说明行，**不加列**）：在该表 `| 选项 | 拒绝理由 | 关联 D |` 后加一行说明「拒绝/退役/缩小的选项，拒绝理由里引用 lens 条目；未使用 lens 写 `未使用 lens — 理由（≤1 句）`」。
理由：`## 拒绝方案` 是"退役/拒绝"的**既有唯一登记处**；`Risk and rollback` 是 Phase 内既有字段。两处都是 agent 写的正文，用户不填。
**禁令自查**：`tests/contract/post-cohort-authoring-files.test.mjs:17-21` 校验 `phase-template.md` 必须含 L0/L1/L2/write set/dependency/STOP/gate_cmd/oracle/coverage limit/DO NOT TOUCH，且**不得**含 `plan.md`/`tasks.md` ⇒ 上述拟改文本不触碰禁区。

### 落点 D｜谁核：复用 wh-review 既有审查面，不新增门禁

**目标** `skills/wh-review/contracts/build-plan.md:59-60`（既有"报告具体删除或缩减 finding"），在其后追加 1 句：
> 缩小/退役/删除类 finding 必须给出所引 lens 条目；缺引用又无 `未使用 lens` 理由的，记为一条普通 finding。
**核什么**：①引用是否存在；②引用与该决定的阶梯是否自洽（P1 说"已有覆盖"就必须点出已有能力）。**核 ≠ 拦截**：`:32-35`、`:43-47` 已写明 findings 是质量事实不是 gate；C3 `:78-83` 也逐字「不设配额」。
**不要动**：`skills/wh-review/stage-skill-plan.json:32-39`。`tests/contract/stage-routing-and-concrete-testing.test.mjs:92-93` 逐字 `expect(json("skills/wh-review/stage-skill-plan.json").stages["build-plan"].required_skills).toEqual(["review"]);` ⇒ 把 `simplicity-guard` 加进 required_skills 会**直接打红这个冻结契约**。packet 声明与实际不符这条事实，**只能作为 finding 记**，本设计不改它。

### 落点 E｜"必须凑 finding"的陷阱

一句话写法（放进 `skills/simplicity-guard/SKILL.md:74` 既有句「没有这类问题时，不制造 finding」旁，不新增节）：
> 没有可删/可缩内容时，引用位置写 `lens 已读，无可删内容（P3 最小新增，理由：…）`，不产生 finding、不计数。
不设配额——与 C3 `:79-80` 逐字一致。

## 2. 代价分析：是否新增用户负担？

| 项 | 是否新增用户可见/需回答 | 说明 |
| --- | --- | --- |
| 落点 A 读 lens | 否 | 搭车 `spec-plan` 既有读材料；不新增 step（steps.json 12 步不动） |
| 落点 B finding 标注 | 否 | finding 本就走既有 attempts JSON；用户侧无新界面 |
| 落点 C 引用义务 | 否 | 写在 Phase/decision-log **正文**，作者（agent）填；用户不填 |
| 落点 D 审查 | 否 | 复用 `merged-review`(step 9) 与 `main-agent-disposes-findings`(step 10)；不新增确认点 |
| 落点 E 空集写法 | 否 | 是"不写什么"的豁免，比现状更省 |
| 风险 | 低 | 唯一可感成本：审查可能多出删除类 finding ⇒ step 10 主 agent 直接处置（既有 disposition 路径），**不回到用户**。C3 `:143-146` 的三选一确认点**已经存在**，本设计不新增、不改它 |

结论：**不新增用户确认点、不新增需用户回答的问题**。这条义务 100% 落在 agent 与既有审查面上。

## 3. 被否决的备选（≥2，含撞哪条约束）

1. **强制 lens 每次必须产 finding**（含"零 finding 视为未执行"）
   撞 `skills/simplicity-guard/SKILL.md:74` 逐字「没有这类问题时，不制造 finding」；撞 C3 `skills/plan-eng-review/SKILL.md:79` 逐字「**不设配额**、不要求「删够多少」，也不许为凑数把正常删除写成 finding」。另撞 `CONSTITUTION.md` F7/`:56` 确认点边界（会退化成"必须问用户"）。
2. **给 lens 加机器钩子/新步骤/新 gate**（如 build-plan 新增 `simplicity-guard` step，或 runtime 校验 `gate_cmd` 式拦截）
   撞 C4:2030「不得新增阻断门」、C4:2036「不得新建 schema / CLI 动词 / 控制面」（见 `/tmp/pb-forensics/verify-proposal.md:11`）；撞 `workflows/build-plan/SKILL.md:188-190` 逐字「…ordinary advisory lenses in the declared review contract, **not new workflow stages and not gates**」；steps.json 增步还会撞 `tests/contract/stage-routing-and-concrete-testing.test.mjs:82-84`（evidenceKinds 不得含 test/skill_invocation）。
3. **新建 `minimal-path` 字段或第三份 lens 产物文件**
   主仓已 `grep -rn minimal-path|minimal_path runtime workflows skills` = **0 命中**（该字段今天不存在，见 m00011 结论）；撞 `workflows/build-plan/SKILL.md:187-188` 逐字「Do not create a double-solution exercise, a build-plan Grill, a second decision log, a parallel review output, or a process summary.」；撞 design.md:592-594 D-FIELD=A（phase-template 不再加字段，见 verify-proposal.md:20）。
4. **把义务塞进用户确认话术（要求用户确认"是否用了 lens"）**
   撞 C3 `workflows/build-plan/SKILL.md:143-146`（三选一确认点**已存在且已足**，:146 逐字「不新增确认点、字段或文件」）与 `CONSTITUTION.md:54-56` F7。

## 4. 配套：simplicity-guard 自身要不要改？

**要改，但要极小心**——现状写法天生易被绕过：它只给原则与四阶梯，**不给可触发的动作、不指认调用点、不指认输出载体**，且 `:74` 自带"不制造 finding"的免罪出口；再叠加 packet 只声明 `review`，斜穿就发生。
**最小改动文本**（`skills/simplicity-guard/SKILL.md`，只加 1 处，插在 `:74` 之后"没有这类问题时，不制造 finding"的紧邻位置）：
> 调用点：`spec-plan` 写缩小/退役/boundary 决定前（见其 authoring contract）与 `plan-eng-review` 的 finding 复核；输出形态：**并入既有 finding JSON / 既有审查处置表**，每条带 P 阶梯与"删除/复用/缩小"动作；无可删内容时写明 `已读，无可删内容`。不得新建文件、字段或计数产物。

**影响面（改也必须同批刷新）**：
- `skills/simplicity-guard/skill-bundle.json`（`:3` `"skill":"simplicity-guard"`，files 里 `SKILL.md` 的 sha256）
- `skills/catalog.yaml:215-233`，尤其 `:218` `local_bundle_hash: c36970ae6d0639d5d0cc33fb1858c63534fb40bb2bcb548b65de0b3fd20dc413`
- 否则 `runtime/adapters/local-skill-resolver.mjs:110` 逐字 `if (entry.sha256 !== actual) throw new Error(\`bundle sha256 mismatch: ${locator}\`);` 抛错（实算在 `:108`）
- 另需同批刷：`skills/spec-plan/skill-bundle.json`（`templates/phase-template.md` 的 sha256，现 `b5a4b739…`）+ `skills/catalog.yaml:335`（`spec-plan` 的 `local_bundle_hash: bb470db0…`）——改落点 A/B 就会触发；改落点 C 目标 2 则须刷 `skills/decision-log/skill-bundle.json`（`templates/decision-log-template.md` 现 `a8f3ce63…`）与 catalog 对应项（`tests/contract/spec-stage-artifact-closure.test.mjs:28-30` 会校验二者相等）。
- **本次只写改法与影响面，未动手。**

## 4b. 外部做法对照（可选来源任务，m00094）

**实际使用的引擎：`advanced_search` + `engine:"anysearch"`，4 次检索全部由 anysearch 返回（无回退）；其中 2 条来源用 `web_fetch` 取原文核对。** 检索词：①YAGNI review checklist scope creep prevention；②design review simplicity heuristics complexity budget；③architecture decision record complexity budget mandatory simplicity；④Martin Fowler YAGNI/Design Stamina Hypothesis（补检）。

| # | 外部说法（来源类别 + URL） | 本设计采纳/不采纳 |
| --- | --- | --- |
| E1 | 「拒绝无法用**当前需求**证明的工作」是 YAGNI 的当代表述，且它主要针对**端到端功能**而非代码灵活性（作者一手 bliki：Martin Fowler，官方个人站 https://martinfowler.com/bliki/DesignStaminaHypothesis.html ；InfoQ 对其 YAGNI 演讲的报道 https://www.infoq.com/news/2015/06/yagni/ ）。⚠️核对：Design Stamina Hypothesis 原文**自述"只是一个 hypothesis，没有客观证据"**（逐字 "it is a conjecture, there is no objective proof that this phenomenon actually occurs"）⇒ 不得据此设任何阈值。 | **采纳其判断形态（"当前需求/故障证据能否证明"），不采纳其量化用法。** 与 `skills/simplicity-guard/SKILL.md:64` 既有措辞同构；本设计只要求"引用哪一条"，不设阈值。 |
| E2 | 简单性审查的公共原则集：**"复杂度留下的信号"**（小改动牵动多处、测试需要大量 setup、失败影响出乎意料）——可观察信号而非指标门禁；**"每一层都要挣得自己的位置"**；**"决定才消除复杂度"**（保留所有可能性会引入配置/兼容层/备选路径）；**"要求本身也要被质疑"**；**Reuse before you build**；**Rule of Three（第三次出现再抽象，警惕 premature abstraction）**。来源类别：公开技术书稿/社区权威整理，https://design-principles.info/principles/simplicity/ | **采纳两条**：(a)"每一层/每个新增必须挣得位置"与 (b)"决定才消除复杂度"——本设计的引用义务正是让"保留/新增"这个决定**显式化**，不新增机制。Rule of Three 与 `skills/spec-plan/SKILL.md:20` 的"精确写集、无目录级 glob"相容，但**不写入**（避免变成算法式判据）。 |
| E3 | ADR 被广泛用于"记录决定及其理由"，且有云厂商官方实践文章（AWS Architecture Blog，官方文档：https://aws.amazon.com/blogs/architecture/master-architecture-decision-records-adrs-best-practices-for-effective-decision-making/ ；仅取到标题/摘要层，正文被截断 ⇒ 细节标**未核实**）。 | **采纳方向、不新增载体**：本设计的引用义务落在**既有** `skills/decision-log/templates/decision-log-template.md:289-293` `## 拒绝方案` 与既有 ADR 字段块 `:213-228`，没有新建 ADR 文件、没有新列——与 `skills/decision-log/SKILL.md:14-16` 逐字「This is a material convention, not a new store, stage, or confirmation gate.」一致。 |

**明确不采纳的外部做法（附理由）**
1. **量化"复杂度预算/配额"**（按配额卡住新增、超预算即驳回）：会变成新阈值/新门禁——撞 C4:2030「不得新增阻断门」与 C3 §10 逐字「**不设配额**、不要求「删够多少」」（见本文 §3 备选 1）；且规模读数已有既有载体（`tools/architecture/complexity-report.mjs` 的 `budget()`、`tests/contract/repository-inventory.test.mjs` 的 baseline/waiver），再加一套即"同一口径两处权威"。
2. **多层审批 / 强制字段 / 强制 checklist 模板**（把简单性审查变成独立 gate 或必填 schema）：撞 `skills/wh-review/contracts/build-plan.md:32-35`「首轮 findings 是质量事实，不是 stage gate」、`:43-47`「不要求 provider `pass`」，以及 `CONSTITUTION.md` F7:54-56（正常确认只保留三处）。⇒ 一律不采纳，本设计零新增确认点。
3. **新建 `complexity budget` / `minimal-path` 文件或字段**：撞 `workflows/build-plan/SKILL.md:187-188` 逐字「Do not create … a second decision log, a parallel review output, or a process summary.」与 design.md:592-594 D-FIELD=A。
4. **"给 AI 加简单性评分器/自动删除建议工具"**（检索中出现的工具类结果，无官方文档支撑）：来源不可靠 + 会成为第二个 verdict，撞 `skills/wh-review/contracts/build-plan.md:68-70`（输出只含 findings、无 verdict）⇒ 不采纳。

**一个未找到权威来源的说法（如实记录，不采纳）**："complexity budget"作为宏观架构预算的工程做法，本轮只在社区/厂商营销页出现（如 `simplicity-first.dev/manifesto`，无官方文档支撑），**未找到权威一手来源** ⇒ 记 `unverified`，不作为设计依据。

## 5. 未核实项 / 未取到的逐字

1. **未核实**：C3 `skills/spec-plan/SKILL.md` 的 `:18` 行区间是否与主仓完全同文（两端都是该句，但未逐字 diff 全文）。
2. **未核实**：`skills/wh-review/contracts/build-plan.md` 是否在 C3 有并行小改（我只读了主仓版本）。
3. **未核实**：`runtime/stage/stage-content-contracts.mjs:7145-7157` 的 required 字段表**不含** `Risk and rollback`（只到 `Done`）⇒ 落点 C 目标 1 加文字不会触发该处报错；但**是否存在别处对 `Risk and rollback` 的取值校验未核实**。
4. **未核实**：`## 拒绝方案` 是否有机器解析（主仓只查到 `stage-content-contracts.mjs:313` 的 `REQUIRED_MAIN_SECTIONS` 含该节名，未见列级校验）。
5. **未取到的逐字**：主仓 `runtime/adapters/local-skill-resolver.mjs:108` 的哈希实算函数体（只取到 `:109-110`）。

# build-spec 审查机制调研与针对性优化提案（card03 / s926，spec 侧）

工作目录：`/Users/Hugh/Hugh/Project/workflowhub-workflowhub-thin-core-card-03-20260919`
调研范围：只读，12 项阅读清单，无全仓扫描。
回答的问题：card-04 在 build-code 跑了约 28 小时，复盘发现 8 类计划缺陷（a–h）。**build-spec 的审查机制本该在哪一步抓住它们？现状能不能抓住？该怎么改？**

前置口径（影响全文的两条）：

- 本 checkout 里 `workflows/build-spec/SKILL.md:9-15` 自述「For the post-cohort workflow, `build-spec` is historical read-only」。因此「计划能不能直接执行」这件事，**作者**在 post cohort 里是 `skills/spec-plan/SKILL.md`（由 build-plan 调用），**审查**分散在四处：计划作者自检（`spec-plan` + `phase-template.md`）、咨询透镜（`plan-eng-review`、`requirement-lineage`、`design-source-readiness`、`simplicity-guard`）、阶段末结构报告（`spec-analyze`）、人读规范（`docs/standard-workflow.md`）+ 仓库纪律（`AGENTS.md`）+ 一条契约测试。§1 逐条盘这四处。
- 另一侧代理的 build-code 侧报告在 `/tmp/wh-card03-s926/R-review-code.md`。§3 的提案与它**互补不重复**，§4 显式列出避开它的 8 条。

---

## §1 现有 build-spec 审查机制盘点

### A. 阶段本体 `workflows/build-spec/SKILL.md`（328 行）

1. **`:9-15` 范围界定**。逐字：「For the post-cohort workflow, `build-spec` is historical read-only」。——这不是检查，是把 post cohort 的计划工作交出去。**执行者**：读的人。**独立判据**：无。
2. **`:17-22` 统一回退协议**。五个正式 stage 共用 `runtime/stage/stage-content-contracts.mjs` 的 `validateFallbackProtocol`；明文「不新增 stage、public command、store 或 gate」。**执行者**：运行时校验器。**独立判据**：有，但判的是协议字段，不是计划质量。
3. **`:49-51` 阶段末遗漏披露**。逐字：「阶段结束的大白话总结必须逐项列出本阶段所有未完成、失败、跳过、不适用、`unknown`、`unavailable` 或 `incomplete` 的 step 和 skill，并写真实原因与证据引用；没有遗漏就明确写“无遗漏”。」以及 `:51`「若没有 stage outcome，也必须明确披露“outcome 缺失”；这不是“跳过”，而是当前事实 unavailable。」**执行者**：主会话自述。**独立判据**：无——它是自述纪律，正是「自审自判」，与 `AGENTS.md:17`「质量裁决由独立来源独立上下文产出，禁止自审自判」相对。**这是 a–h 兜底条款最好的落点（见 §3 P8）。**
4. **`:54-59` 阶段末逐项披露协议**。逐字：「阶段末逐项披露协议：主会话先读取本 stage 的 `workflows/<stage>/steps.json` manifest，再按声明顺序对齐当前阶段事实、产物和质量证据。」「产物存在不能替代完成判据。」**执行者**：主会话。**独立判据**：部分（对齐的是 manifest 声明，不是外部事实）。
5. **`:61-69` 阶段末复盘**。`stage-reflection.v2` 六区块 JSON，由 `validate-stage-reflection.mjs` 验证。**执行者**：运行时。**独立判据**：有，但判 JSON 形状与枚举值。
6. **`:75` 当前 producer、审查与验收引用**。逐字：「本阶段只细化当前决策与规格；未来 `plan.md`、`tasks.md` 的完备性不成为写规格的前置。AC 保留场景、数据来源、可判真 oracle 和失败条件。实际 command/service 验收由 build-code 的现有执行器产生原件，verify-code 消费同次独立 review 与真实用户确认；规格审查与 AC 文本都不替代执行证据。」——**这条明确把「执行验收」推给 build-code，等于说 build-spec 自己不做可执行性核查**。**执行者**：读的人。**独立判据**：无。**这是 e 的落点（§3 P5）。**
7. **`:79` review 记录路径**。逐字（末尾）：「不得把记录成功、空 findings、partial 或 unavailable 当作规格通过，也不为 clean 标签重复整轮审查。」**执行者**：主会话 + `stage-handlers#safeReviewFacts`。**独立判据**：有（`receipts.review` 认证）。**这是 f 的现成锚点（§3 P6）。**
8. **`:83-104` Portable dependencies**。`spec-research` 条件性独立研究 owner；`spec-clarify` 唯一规格澄清 owner；`spec-specify`、`simplicity-guard`、`plan-ceo-review` 是 **inline lens**。逐字：「Review is a quality fact, not a progression gate」。**执行者**：各自透镜。**独立判据**：无（inline = 同一上下文，违反 `AGENTS.md:17` 的精神）。
9. **`:109-123` Stage-input packet and context facts**。`stage-input-packet.v1`、`packet_freeze_hash`、三个**字符代数量**：`full_reread_count`、`subagent_input_bytes`、`review_material_bytes`，逐字限定「without token-budget or cost claims」。**执行者**：运行时。**独立判据**：有，但只有字节计数，**没有分项耗时/归属**（h 的直接证据）。
10. **`:208-241` Required specification content**。`:219` 起 10 条必写项；`:236-237` 第 7 条逐字「acceptance criteria with method, pass oracle, failure condition, evidence type, and affected user state」；`:240` 第 9 条逐字「assumptions, risks, unknowns, owners, handling stage, and close condition」——**只要求登记，不要求核实**。**执行者**：主会话自述。**独立判据**：无（`spec-analyze:95` 只查字段在不在）。
11. **`:243-255` 歧义清点与单一 Clarify 流程**。「List every material ambiguity separately with its possible impact」；禁用 Talk/Grill，只允许 `spec-clarify`。**执行者**：主会话。**独立判据**：无。
12. **`:257-268` Findings 处置对话分工**。争议 findings 复用 `spec-clarify`。**执行者**：主会话。**独立判据**：无。
13. **`:270-280` Boundaries**。不把实现文件清单/代码符号/测试命令写进 `spec.md`。**执行者**：读的人。**独立判据**：无。注意：这条与「核实真实入口/消费者」有张力——**要核实就得读实现文件，但实现细节不许写进 spec**（§5 不确定项 6）。
14. **`:282-298` Work sequence 第 1–6 步**。第 6 步 `:293-294` 逐字「Cross-check no decision was dropped, no new product scope was invented, and every AC is observable.」**执行者**：主会话自述。**独立判据**：无（自我交叉核对）。
15. **`:299-311` Work sequence 第 7–9 步**。第 9 步 `:304-311` 逐字「9. Run the final declared `stage-end-spec-analyze` step before publishing. It compares the original requirement and decision-log against the actual `spec.md`, all product flows/states/boundaries/non-goals, and current evidence. It checks semantics and evidence, not only IDs or file existence. Repair specification gaps in this stage; do not leave them for build-plan.」——**审查对象是 `spec.md` 全部产品语义，粒度里没有 Phase、没有 Task、没有「能不能直接执行」**。**执行者**：`spec-analyze` lens。**独立判据**：见第 23 条（结构判据有，语义判据被明文弃权）。
16. **`:313-328` Completion and handoff**。完成判据全是产品语义层（每决策有稳定含义、每 FR/AC 有 oracle 与失败条件）。**执行者**：主会话。**独立判据**：无。

> 全文事实：`workflows/build-spec/SKILL.md` 与 `skills/spec-analyze/SKILL.md` 里，`dry-run` / `dry run` / `可执行` / `executab` / `入口` / `consumer` / `真实入口` 这些词一共只命中 4 行，**没有一行在「核查计划能否直接执行」的语境里**（`:63` 是 CLI「公共入口 `run --action=reflect`」；`:69` 是 `deriveConsumptionEdges` 的消费边；`:115` 是 packet 派生文件 producer/consumer；`skills/spec-analyze/SKILL.md:95`/`:97` 是 `phases/index.md` 的 `consumer` 字段「在不在」）。

### B. `workflows/build-spec/steps.json`（21 行，15 个 step）

17. **`:15` step 11 `review-frozen-spec`**：build-spec 唯一的独立审查落点。observable_result 逐字含「this review is advice, not pass permission」。**执行者**：独立 review provider。**独立判据**：有，但**是 advice**，不构成交接前必须回答的问题。
18. **`:16-18` step 12/13/14**：step 12 `main-agent-disposes-findings` 逐字含「does not dispatch review-frozen-spec again merely because spec.md changed」（**e/f 的现成锚点**）；step 13 `stage-end-spec-analyze` 粒度逐字「user flow, states, FR/AC, boundaries, non-goals」——**没有 Phase/Task 粒度**；step 14 `publish-spec-result`「the comment is notification, not a gate」。
19. **`:14` step 10 `freeze-spec`**。observable_result 只要求 `spec.md` 含「requirements, flows, states, boundaries, FR, AC, non-goals, and deferred work」，**不提 Phase 粒度、不提可执行性**。
20. **全文件共性**：15 个 step 里，没有任何一个提到真实入口、真实消费者、RED 归因、跨 Phase 串行或最难链路走查。

### C. 咨询透镜与阶段末报告

21. **`skills/review/SKILL.md:12-16`——`review-frozen-spec` 实际用的检查表全文**（`review-frozen-spec` 走通用 review 面，`skills/review/` 是仓库里唯一的通用 review 检查表；对应关系见 §5 不确定项 4）。`:12-16` 逐字只有 5 条：「1. Separate stated facts from inferences.」「2. Compare every material claim with packet evidence.」「3. Flag scope drift, missing acceptance evidence, and contradictory artifacts.」「4. Prefer a precise finding over a broad quality opinion.」「5. Keep contract-external observations minor.」——**没有任何一条问「这份计划能不能直接执行」「入口/消费者是否真实存在」「RED 是否因目标行为失败」**。**执行者**：独立 review。**独立判据**：有（独立上下文），但检查内容不含计划可执行性。**这是 §3 全部提案最关键的补丁点。**
22. **`skills/review/SKILL.md:20-25, 29-30` 字段窄契约**。逐字：「Missing evidence is unavailable, never pass. Use the supplied packet only.」「A finding may explain the affected review angle in its prose, but must not add `axis`, `visibility`, `anchor`, `consequence`, or `correction` output fields.」；只允许 `severity`/`path`/`line`/`issue`/`root_cause`/`recommendation`/`evidence_kind`/`evidence`；`:29`「Return exactly one JSON object: `{ "findings": [...] }`. … Do not return `verdict`, `summary`, checklist fields, or a second object.」→ **能改的只有 §Check 的散文，不能加字段、不能改输出形状**。
23. **`skills/spec-analyze/SKILL.md`**。`:8`「Mode: `lens-only`. Delivery: `file_only`.」；`:30-33`「The runtime reports only material structure, references, and index agreement… `reported` means the check ran; it never means semantic consistency or review pass.」；`:48-53` 明文拒绝「a duplicate Phase body, command/oracle/task-card procedure, an active `plan.md`/`tasks.md` writer or equality path, or a missing/unreferenced Phase」——**最接近 a 的机器检查，但拒的是「重复」不是「混装」**；`:91-94` **关键免责条款**逐字「The independent merged review is the owner of behavior-strength judgments and source-requirement omissions, including quantifiers, negation, order, artifact form, failure and scope. The post report names only structural duplication, orphan references and absent test fields.」→ **d（RED 归因）被显式排除在结构报告之外**；`:95` 只查 Phase 卡字段「在不在」，不查「是否属实」；`:96-99` DEFER/OPEN 的 owner/触发/消费者/关闭条件**仅 pre cohort 检查**。**执行者**：运行时。**独立判据**：有（结构层），语义层被明文弃权。
24. **`skills/spec-analyze/SKILL.md:132-147`「## Review semantics」**。逐字：「This lens is read-only and 不阻断工作… This lens is not a provider review and does not create a separate workflow, store, or provider-pass gate.」→ **任何「加机器门禁」的提案都被这条挡住**，这也是 §3 全部写成人类条款的原因。
25. **`skills/spec-analyze/packet-lens.md:5, 13-17, 23-36, 38-41`**。同调：只报结构/引用缺口；「the independent merged review judges requirement omissions and behavior meaning」；「A present ID or a result of `reported` does not prove source coverage or behavioral equivalence」；「A declaration in the step manifest, a review projection, or an old outcome is not execution proof.」**结论**：「结构报告不许做语义/可执行性判断」是**刻意设计**，不是遗漏。
26. **`skills/requirement-lineage/SKILL.md`**。`:19`「Mark `missing` when no implementation evidence exists; mark `partial` when implementation or verification evidence is absent.」；`:20` 逐字「Mark `stale` when referenced evidence predates a material artifact change.」——**e 的现成语义（material change，不是「文件变了」）**；`:22`「Do not claim that a requirement is accepted, implemented, or verified solely from a plan or a prior verdict.」；`:24-26`「## Consumers」逐字「P3 audit reports and verify-code checks consume lineage records.」→ **消费者是 P3 audit 与 verify-code，不在 build-spec/build-plan 的交接前路径上，对计划没有约束力**。
27. **`skills/design-source-readiness/SKILL.md`**。`:9` 只读项目通用 `Design.md`，「不打分（no score），也不设置 gate」；`:14-15` 逐字「两份来源都要比较相对路径、原始 UTF-8 `content_sha256`、revision、显式 `anchor_id` 和 `anchor_title`，标题 slug 不是稳定身份；缺字段是 `missing`/`unknown`，漂移是 `stale`。」；`:34` 缺项写 `unknown`/`unavailable`，「人工确认后仍可继续，不变成 no-design gate」。**这是全仓唯一一处在交接前要求「内容 hash 必须与当前工作区读到的字节一致」的机制——但它只长在 UI 分支上，非 UI 路径没有任何等价物**（f/g 的关键缺口）。
28. **`skills/simplicity-guard/SKILL.md`**。`:10-13` 只读 advisory lens，「不产 stage-result，不修改被审材料… 不生成 `*-facts`、invocation receipt、独立 runtime 或第二个 stage owner」；`:18-19`「审查目标不是把缺口变成更多要求，而是找出能删除、复用或缩小的内容。发现额外内容时必须明确建议删除；不得用“以后可能需要”替它保留位置。」；`:26-47` P0–P3 四阶梯；`:60-66` 重点寻找五项，其中两条直接对口：「为执行或证明当前流程而新建第二套流程、证据、状态或发布系统」「只增不删：修订后旧抽象、兼容层、任务或文字仍被无理由保留」。**这是回应 f/g 的现成 lens，不需要新增机制**；它在 build-spec 是 inline lens（`workflows/build-spec/SKILL.md:91-92`），对应 `steps.json:9` step 5。

### D. 计划作者侧（审查链的上游，现行计划的真实作者）

29. **`skills/spec-plan/SKILL.md`**（审查清单里最硬的几条都在这里，但**都是作者自检**）。`:12` 唯一 Phase 工程作者、「A Phase contains only its implementation delta」；`:14` Phase 卡字段完备性；`:16` 全任务唯一连续 T 编号；`:20` 逐字「…Declare global NEW/MODIFY/DO NOT TOUCH… each implementation path has one Phase owner. Order producers before consumers… No directory-wide or glob write set is valid.」；`:22` 逐字「A mere ID occurrence is not coverage. Resolve an omitted source before calling the plan executable.」；`:26` 逐字「RED is valid only when the named target assertion fails, not setup/environment/configuration; a planned command or unrelated nonzero is not RED.」（**d 的最强锚点，已亲自核对**）；`:28` 逐字「Perform an execution dry-run on each Task card: can an implementer using only current spec, index, and that Phase identify the first symbol to inspect, the first edit, target RED, GREEN, negative case, and recovery without inventing a product choice? Repair any no.」（**h 的唯一锚点**；问题：dry-run 是**作者自审**，且只看**单张卡**，不看跨 Phase 与最难链路）。**执行者**：作者自己。**独立判据**：无。
30. **`skills/spec-plan/templates/phase-template.md`**（56 行）。`:1` 逐字 `# Phase P<n> — [outcome]`——**a 的唯一锚点，但它是个填空，没有判据**；`:3-6` `Global spec` / `Write set` / `Dependency` / `Consumer: [real downstream reader or component]`；`:26` `### Tnnn — [next globally unique Task ID and one observable result]`；`:28` Source/FR/AC（要求保留量词、否定、顺序与失败强度）；`:30` 逐字 `- **Files / symbols**: [NEW/MODIFY paths within this Phase write set; existing symbol/signature/consumer and verification source; unknown with owner and STOP]`（**c 的字段级锚点，但字段名叫 "verification source"，没有规定核实动作**）；`:33` `- **Boundary / DO NOT TOUCH**:`；`:38` 逐字 `- **Observable seam**: [the existing producer, persisted/current artifact, real reader/consumer, source denominator, and missing/invalid semantics for the AC; if absent, design and freeze this interface first and keep the AC incomplete rather than testing text]`（**b+c 最强字段，已亲自核对**）；`:39-42` RED/GREEN 四重字段，含 `:41` 逐字「RED target failure: [stable oracle ID and exact assertion/rejection that must fail before the change; setup or collection failure is not RED]」与 `:42`「missing execution is unavailable, not RED」；`:50-52` 逐字「Do not collapse multiple Tasks into one line」。
31. **`skills/plan-eng-review/SKILL.md`**（48 行，**advisory lens**）。`:9-11` 逐字「Mode: `advisory`, file-only, no stage result and no provider verdict. build-plan calls it directly after the plan draft and before test routing; wh-review only reads…」；`:29-30` 逐字「3. Check every changed interface, function signature, CLI, event, and schema / against an exact current anchor and an explicit consumer.」（b/c 最强条款，**但没定义核实动作，也没要求消费者是已存在的调用点**）；`:33-34` 第 5 条「Check task dependency order, file ownership, and whether every parallel `[P]` claim has independent inputs and non-overlapping files.」；`:36-38` 第 6 条逐字「Check every behavior change has an implementation-before RED and a post-implementation GREEN with an exact executable command, expected exit, evidence path, and observable oracle. Reject placeholder or default full suite commands.」（d 最强锚点，**但只查形式，不查失败原因类别**）；`:41-42` 第 8 条逐字「Check implementation effect: the planned consumer must actually use the new contract; schema parsing or file presence alone is not proof.」（c 最强锚点）；`:44-48` 输出到 `wh-review` 并逐字「Never emit a separate pass, revise decision, provider call, or stage result.」→ **findings 落在 wh-review，不在交接前，advisory 没有强制力**。**执行者**：advisory lens。**独立判据**：无（`file-only`、无 provider、无 stage result）。

### E. 机器与规范

32. **`runtime/review/review-policy.mjs`（103 行）**。`:3` `FORMAL_STAGES = new Set(["make-decision","build-spec","build-plan","build-code","verify-code"])`；`:4-6` `REVIEW_KINDS`/`REVIEW_TRACKS`/`REVIEW_SCOPES`（scopes 只有 `phase|integration`）；`:22-55` `assertReviewIdentity`：**build-spec 不允许任何 track 或 scope**（`:46-48`、`:51-53` 会抛错）→ build-spec 的审查规则只是 `matrix.stages["build-spec"]` 单一 profile，**没有 Phase 粒度概念**；`:96-98` 其它 stage 直接用 `stageRule`；`:101-103` `minimumReviewersFor(stage, track, reviewScope)`。**结论：build-spec 侧没有「审查次数」旋钮，f 在 build-spec 侧的正确落点是纪律条款，不是改机器契约。**
33. **`docs/standard-workflow.md`**。`:83-86` 逐字「代码审查使用 OCR delegation：`build-code` 每个 Phase 一次，`verify-code` 在最终 worktree 一次。`wh-review` 保留给 make-decision、build-spec、build-plan 等其它审查面。各自的 provider 身份、终态、findings 与失败原样记录；无真实审查结果时保留 `unavailable`，不把空 findings 当作补救结果。」；`:88-92` 逐字「没有真实主题变化，不重复全文读取、测试、review 或 analyzer。材料、风险或有效 finding 实际变化时，只重跑受影响的检查… 时间和 token 只作诊断，按 step、skill、读取、交互、provider wait、测试、review、返工和用户等待拆分；不可得就写 `unavailable`，不设统一预算 gate；review preflight 只记录当前请求的可观测事实，不改变 provider status 的运行时所有权。」；`:100-107` 交给用户的六项摘要；`:109-112`「摘要说的是当前事实，不是“文档存在所以完成”。交接只交接已确认的材料和事实。」；`:214-217`（build-spec 产物/完成/失败边界）逐字「核心产物是 `spec.md`。它必须能让下游直接知道入口、成功路径、失败/取消/重试/恢复、页面范围、数据状态、权限安全、接口/依赖、FR/AC、非目标和延期。研究或 Clarify 未完成、规格仍含方向性猜测、UI 设计未冻结或语义与 decision-log 冲突时，不能声称规格闭合；应在本 stage 修复，不能把问题留给 plan 或 code。」——**有「入口」二字，但四条失败条件没有一条是「入口未被核实」**；`:221-223` 专业质量逐字「…不能用完整的 `spec.md`、FR/AC 编号或文档存在代替真实规格质量。」；`:227-229` 下游交接逐字「…它不重新发明 PRD/decision 的目标，也不把 spec 缺口藏进 Phase 索引。」——**build-spec 全段没有任何一条要求「Phase 可独立验收/可独立提交」「入口/消费者真实存在」「RED 归因」「跨 Phase 串行」。**
34. **`tests/contract/post-cohort-executable-authoring.test.mjs`（77 行）——唯一的自动化检查，全是文本存在性断言**。断言 `skills/spec-plan/SKILL.md` 含 `execution dry-run`、`original requirement` 等字符串，`phase-template.md` 含 12 个字段名，`workflows/build-plan/skill-deps.yaml` 的 inputs 形状。**执行者**：CI 契约测试。**独立判据**：有，但**只证「句子在」，不证「计划可执行」**——d 的全部自动化保障就是几条正则。

### §1 判定表：a–h 现状能不能抓住

| # | 问题 | 判定 | 判据行号（现状最接近的条款） | 抓不住的原因 |
|---|---|---|---|---|
| a | 计划不能直接执行；P6/P10 混装多个需分别验收/提交的结果 | **部分能** | `skills/spec-plan/templates/phase-template.md:1`（`# Phase P<n> — [outcome]`，只是填空）；`skills/plan-eng-review/SKILL.md:33-34`（只查依赖顺序/文件所有权/`[P]` 不重叠）；`skills/spec-analyze/SKILL.md:48-53`（只拒重复 Phase body） | 有「一个 Phase 一个结果」的**标题占位**，没有任何一条**判断**「这里是不是混了两个结果」；机器检查拒的是重复不是混装 |
| b | 关键「需求 → 真实结果」链没走通：只有「将来如何观察效果」的合同 | **部分能** | `skills/spec-plan/templates/phase-template.md:38`（Observable seam 要求填既有产出方/已持久化产物/真实读取方）；`skills/plan-eng-review/SKILL.md:29-30`、`:41-42`；`docs/standard-workflow.md:214-217` | 字段与条款都在，但**没有核实动作**（谁去读那个消费者？读到什么算数？），也没有要求消费者是**已存在**的调用点；`standard-workflow.md:214-217` 的失败条件里没有「入口未被核实」 |
| c | 关键来源、消费者、外部前置条件、预写测试有效性**没在交接前核实**（例：写「恰含 8 个字段」，实际有第 9 个必需版本字段） | **部分能** | `skills/spec-plan/templates/phase-template.md:30`（`existing symbol/signature/consumer and verification source`）；`skills/spec-plan/SKILL.md:22`（`A mere ID occurrence is not coverage`）；`skills/plan-eng-review/SKILL.md:41-42`（`schema parsing or file presence alone is not proof`） | 条款全在**作者自检**里且是 advisory；`skills/spec-analyze/SKILL.md:95` 只查字段「在不在」，不查「是否属实」；没有一条要求在计划里留下**实读记录**（路径:行号 / 命令+退出码） |
| d | 部分预写「红测」是环境/夹具错误或本来就不是失败测试 | **部分能** | `skills/spec-plan/SKILL.md:26`（RED 有效性定义）；`skills/spec-plan/templates/phase-template.md:41-42`（`setup or collection failure is not RED` / `missing execution is unavailable, not RED`） | 定义在作者侧、advisory 侧；`skills/spec-analyze/SKILL.md:91-94` 明文把行为强度判断弃权给 merged review；**`skills/review/SKILL.md:12-16` 的 5 条 Check 里没有一条问 RED 归因**——独立审查这一环完全没接上 |
| e | 计划文件同时是历史流水账；无关文字改动触发旧证据过期（用整份常变计划文件哈希当稳定规则版本） | **部分能** | `skills/requirement-lineage/SKILL.md:20`（`stale` = `predates a material artifact change`）；`skills/design-source-readiness/SKILL.md:14-15`（`content_sha256` 必须与当前工作区一致，**仅 UI**）；`workflows/build-spec/steps.json:16`（`does not dispatch … again merely because spec.md changed`） | 「material change 才 stale」的语义**存在**，但没有任何一条禁止「用整份常变文件的全文哈希当一条稳定规则的版本」；唯一强制 hash 一致的机制只在 UI 分支 |
| f | 同一 Phase 两次正式审查 + 大量非正式复核件（P5 ≥15 份、P10 ≥26 份 Markdown） | **部分能** | `docs/standard-workflow.md:83-86`（`build-code` 每个 Phase 一次）；`workflows/build-spec/SKILL.md:79`（`不为 clean 标签重复整轮审查`）；`workflows/build-spec/steps.json:16` | 「不重复审查」已写明，但**没有一条管复核件本身的形态与保留**：几次复核要不要各起一个文件、同一主题第二次复核该写什么、复核材料能不能整目录复制——全无规定 |
| g | 证据无限膨胀（整棵工作树当证据反复拷贝，三份快照 5,576 文件 / 143 MB） | **部分能** | `skills/simplicity-guard/SKILL.md:60-66`（「为执行或证明当前流程而新建第二套流程、证据、状态或发布系统」；「只增不删」）；`:18-19` | 判据存在，但 `simplicity-guard` 在 build-spec 是 **inline advisory lens**，且 build-spec 段、`steps.json`、审查检查表都没有把它落到「证据/快照形态」上；`workflows/build-spec/SKILL.md:109-123` 只数字节、不判形态 |
| h | 耗时/token 没有分项可见性，无法及早发现「计划缺口」还是「实现 bug」 | **不能** | `workflows/build-spec/SKILL.md:109-123`（`without token-budget or cost claims`）；`docs/standard-workflow.md:88-92`（「时间和 token 只作诊断…不设统一预算 gate」） | 现状是**刻意**不做强制；`skills/spec-plan/SKILL.md:28` 的 dry-run 是作者自审且只看单张卡；没有任何条款要求把「计划缺口」与「实现未知」分开归属 |

**分布：能 0 / 部分能 7（a,b,c,d,e,f,g）/ 不能 1（h）。**
一句话结论：**build-spec 侧不是「没有条款」，而是「条款都在作者自己的上下文里，且交接前没有任何一个独立、必须回答的动作」。**八条里没有一条是现状能独立抓住的。

---

## §2 这次的问题本该被哪一步抓住（每条给最小改动点）

- **a（Phase 边界）**：本该在 `phase-template.md` 的 **H1 填写那一刻**被作者拦住——最小改动是**把 `# Phase P<n> — [outcome]` 从「填空」改成「填之前先回答三个问题」**，不新增字段、不改 `spec-plan` 的 step 拓扑。
- **b（需求→真实结果链）**：本该在填写 `- **Observable seam**:` 那一行时被拦住——最小改动是**在这一行的方括号里加「核实三元组」要求**（我是怎么知道的：路径:行号 或 命令+退出码），并把「只有计划文本能当读者」定为不合格。
- **c（来源/消费者/外部前置/预写测试有效性）**：本该在作者写下任何「字段个数/签名/版本项」断言时被拦住——最小改动是**在 `skills/spec-plan/SKILL.md:20` 的 `No directory-wide or glob write set is valid.` 之后补一段「实读条款」**，不与 §3 P2 重复（P2 管 AC 接缝，本条管受保护文件与外部前置）。
- **d（红测归因）**：本该在**独立审查**这一环被拦住，而不是作者自检——最小改动是**在 `skills/plan-eng-review/SKILL.md` 第 6 条之后追加「6a」三问**（这三问不动字段、不动 schema，只是检查表散文），并在 `skills/spec-plan/SKILL.md:26` 的定义句后补一句「计划里必须写归因，不能只写命令」。
- **e（整份计划文件哈希当稳定规则版本）**：本该在 `workflows/build-spec/SKILL.md:75` 那句「规格审查与 AC 文本都不替代执行证据」的旁边被拦住——最小改动是**紧接其后补一段「稳定版本锚」条款**。`requirement-lineage` 已有 `material change` 语义（`:20`），不需要新机制，只需要把它**接到计划写作纪律上**。
- **f + g（复核件与证据膨胀）**：本该在 `docs/standard-workflow.md:88-92`「不重复全文读取/测试/review」这段上被拦住——最小改动是**在这段末尾补一段「复核件纪律」**，并复用 `skills/simplicity-guard/SKILL.md:60-66` 已经写好的两条判据（不新建机制）。
- **h（成本/缺口归属无分项可见性）**：本该在**阶段末六项摘要**里被拦住——最小改动是**在 `docs/standard-workflow.md:100-107` 的第 2 项与第 5 项上加「必须标明归属：计划缺口 vs 实现未知」**，不新增计时器、不设预算（`standard-workflow.md:88-92` 已明令「不设统一预算 gate」）。
- **a–h 共同兜底**：`workflows/build-spec/SKILL.md:49-51`「阶段末遗漏披露」是现成的、本来就要求主会话自述的位置——最小改动是**在那之后加一页「交接前可执行性自问八条」**，把 a–h 变成必须逐条回答的问题。它不新增 step、不新增 gate，只是把已经要求写的「遗漏披露」写具体。

---

## §3 具体修改提案（8 条，全部是人类纪律/条款，无新门禁）

> 形式说明：① 每条给可粘贴的中文条款草案全文；② 给插入文件与**锚点逐字文本**（`▲` = 锚点文本由我亲自 `grep`/`sed` 核实的原文件逐字内容）；③ 给覆盖的 a–h 条目。
> 全部落在已有文件，不改任何 `steps.json` 拓扑、不改 `skill-deps.yaml`、不改 `runtime/**`、不新增 schema 或 js 校验模块。
> 每条末尾照 `AGENTS.md:21-23` 的写法加同一句声明。

### P1｜让「一个 Phase = 一个可独立验收的结果」从填空变成判据（覆盖 a）

**① 条款草案**（粘在 `phase-template.md` 的 H1 之后）：

```
> **写完这张卡之前先回答三问。三问答不完整，就不要写 H1，先拆 Phase。**

1. 这一个 Phase 交付的是**一个**结果吗？把这个结果写成一句能判真假的话（不是一串名词，不是一份文件清单）。
2. 谁来判它真假？指名哪条 AC 的哪个 oracle，以及判它的那一刻用的是哪份真实产出。
3. 它能独立提交吗？写完这个 Phase 就能 commit 并停手，不需要等同一计划里的另一个 Phase 才能验收？如果需要等，它们就是两个 Phase。

判定规则：H1 里出现一个「并且」连接的两个交付物，或者「同时/以及/顺便」引出的第二件事，就已经是两个结果，必须拆。
```

**② 位置与锚点**：文件 `skills/spec-plan/templates/phase-template.md`；插在 H1 之后、`Global spec` 行之前。
锚点逐字（`▲`）：
- 上一行：`# Phase P<n> — [outcome]`
- 下一行：`- **Global spec**: `spec.md#[stable-goal-anchor]` (Global goal and implementation design)`

**③ 覆盖**：a。

**声明**：本条是执行纪律，不是新的 stage、gate 或质量结论。

### P2｜「可观察接缝」必须留下核实三元组（覆盖 b，强化 c）

**① 条款草案**（把 `Observable seam` 这一行替换为）：

```
- **Observable seam**: [已有产出方 → 已持久化产物 → 真实读取方/消费者；来源分母；缺失或非法的语义。三项都要写「我是怎么知道的」：至少一项是 `文件路径:行号`，或 `实际命令 + 退出码`。只写「将来如何观察效果」不算接缝。若这条接缝目前不存在，就写 `unverified` 或 `unknown`，同时把这个 AC 标为未完成并写明 owner 与下次核实动作——不要改去测文本，也不要把它留给 build-code。]
```

**② 位置与锚点**：文件 `skills/spec-plan/templates/phase-template.md`；替换该行本身。
锚点逐字（`▲`，当前原文）：
`- **Observable seam**: [the existing producer, persisted/current artifact, real reader/consumer, source denominator, and missing/invalid semantics for the AC; if absent, design and freeze this interface first and keep the AC incomplete rather than testing text]`

**③ 覆盖**：b（主），c（副）。

**声明**：本条是执行纪律，不是新的 stage、gate 或质量结论。

### P3｜受保护文件与外部前置条件：断言必须来自实读（覆盖 c）

**① 条款草案**（作为新一段，粘在 `skills/spec-plan/SKILL.md:20` 之后）：

```
凡写入 DO NOT TOUCH、或依赖「外部尚未改动」的受保护文件，计划里必须留下核实那一刻的实读结果：文件路径、读到的字段/签名/版本项**逐字清单**、读取所用的命令或工具、日期。字段个数、必填项、版本项这类断言只能来自实读，不能来自记忆、推断或上游摘要——上游摘要是线索，不是证据。实读结果与已有断言不一致时，先改断言再继续；本轮无法实读就写 `unknown`，并写明 owner 与下次核实动作。计划里出现「恰含 N 个字段」「签名未变」「只依赖既有接口」这类句子而没有实读记录时，按未核实处理。
```

**② 位置与锚点**：文件 `skills/spec-plan/SKILL.md`；插在第 20 段之后（该段现有末句即为锚点）。
锚点逐字（`▲`，取自 `grep` 命中的第 20 行）：
`No directory-wide or glob write set is valid.`
备选锚点（若想更靠近字段定义）：`skills/spec-plan/templates/phase-template.md` 的
`- **Boundary / DO NOT TOUCH**: [exact protected files or scope; why this Task must not edit them]`

**③ 覆盖**：c。

**声明**：本条是执行纪律，不是新的 stage、gate 或质量结论。

### P4｜预写红测必须写归因，且独立审查必须问三句（覆盖 d）

**① 条款草案（a：加在第 6 条之后，编号 6a）**：

```
6a. 对每一条预写红测，问三句并把答案写进 finding 的 prose：
    (a) 它是**因目标行为**失败的吗——失败的断言名指向本 Task 要改的那个行为？
    (b) 它是夹具/环境/收集失败吗（缺少依赖、路径不存在、配置未建、collect error）？——这类**不是 RED**，只能记 `unavailable`。
    (c) 它本来就通过吗——那不是红测，是既存行为的现状证据，不能计入本阶段 RED。
    三类分不清时按 `unavailable` 处理。禁止把「命令返回非零」当作 RED。
```

**① 条款草案（b：加在 `skills/spec-plan/SKILL.md:26` 之内/之后一句）**：

```
计划里每一条红测都必须同时写下归因：目标行为失败 / 夹具或环境失败 / 本来就通过；只写命令与期望退出码不算写完。
```

**② 位置与锚点**：
- 文件 `skills/plan-eng-review/SKILL.md`；插在第 6 条之后、第 7 条之前。
  锚点逐字（`▲`）：`   suite commands.`（第 6 条末行）／下一条起点 `7. Identify failure modes, rollback/recovery boundaries, irreversible actions,`
- 文件 `skills/spec-plan/SKILL.md`；插在第 26 段内。
  锚点逐字（`▲`）：`RED is valid only when the named target assertion fails, not setup/environment/configuration; a planned command or unrelated nonzero is not RED.`

**③ 覆盖**：d。

**声明**：本条是执行纪律，不是新的 stage、gate 或质量结论。

### P5｜稳定规则只能用「规则本身的锚」做版本，不用整份常变文件（覆盖 e）

**① 条款草案**（粘在 `workflows/build-spec/SKILL.md:75` 之后）：

```
稳定业务规则、接口契约与 oracle 的版本锚，只能指向那段规则本身：规则所在文件 + 小节标题或显式 anchor（需要哈希时，哈希算在那段规则文本上）。不得用整份计划文件、流水账或综合文档的全文哈希，充当一条稳定规则的版本——那会让一次与这条规则无关的文字修订把全部旧证据判成过期。自检标准：如果这次改动只动了与这条规则无关的段落，这条规则的版本应当不变；如果它变了，说明版本锚挂错了地方。
```

**② 位置与锚点**：文件 `workflows/build-spec/SKILL.md`（「## 当前 producer、审查与验收引用」小节内）；插在第 75 段之后、第 77 段之前。
锚点逐字（`▲`）：`规格审查与 AC 文本都不替代执行证据。` / 下一段起点 `当前 WorkflowHub 会话直接执行规格阶段并通过现有 `run` 发布事实；`

**③ 覆盖**：e。

**声明**：本条是执行纪律，不是新的 stage、gate 或质量结论。

### P6｜复核件纪律：同一主题一份，第二次只追加「新增的事实」（覆盖 f、g）

**① 条款草案**（粘在 `docs/standard-workflow.md:88-92` 之后）：

```
复核件纪律：同一主题在同一阶段内只保留一份复核件。第二次及以后的复核不另起新文件，而是在原件尾部追加一节「本次相对上次新增的事实」，并写清触发这次复核的真实变化是什么。没有真实主题变化时，不写复核件，只在阶段摘要里说明本轮无新事实。禁止把整棵工作树、整个目录、或同一份材料的多个副本当作复核材料或证据反复复制；复核材料只包含本次判断真正读到的那些文件。
```

同一条的最后一句可另在 `workflows/build-spec/SKILL.md:79` 段末重复一次（就近约束规格审查）。

**② 位置与锚点**：
- 文件 `docs/standard-workflow.md`；插在「### review、测试和成本」小节末。
  锚点逐字（`▲`，该小节末句）：`review preflight 只记录当前请求的可观测事实，不改变 provider status 的运行时所有权。`
  下一节起：`### stage 结束`
- 文件 `workflows/build-spec/SKILL.md:79` 段末。
  锚点逐字（`▲`）：`也不为 clean 标签重复整轮审查。`

**③ 覆盖**：f、g。

**与 build-code 侧的分工**：`/tmp/wh-card03-s926/R-review-code.md` 的 P3 已提案「证据只留原始件、禁止目录快照」。本条**只**写「复核件（review/复盘文档）的形态与保留」，不重复它的证据体积纪律（见 §4 第 3 条）。

**声明**：本条是执行纪律，不是新的 stage、gate 或质量结论。

### P7｜阶段末摘要必须区分「计划缺口」与「实现未知」（覆盖 h）

**① 条款草案**（粘在 `docs/standard-workflow.md` 六项摘要的第 2 项之后）：

```
摘要的第 2 项和第 5 项必须逐条标明归属：这条风险是**本阶段现在就能修的计划缺口**，还是**实现尚未开始的未知**（只能由下游执行事实回答）。两类不得混写成一句「还有风险」。每条给一条真实证据引用；没有证据就写 `unavailable`。这样改的目的只有一个：让下一次复盘能在很早的时候分清「是计划没写清」还是「是实现写错了」，而不是在几十小时之后才发现。
```

**② 位置与锚点**：文件 `docs/standard-workflow.md`；插在「### stage 结束」的六项摘要列表第 2 项之后。
锚点逐字（`▲`，第 2 项）：`2. 本 stage 负责的需求/实现/代码风险覆盖到什么程度；`
备选锚点（若不想插在列表中间）：`workflows/build-spec/SKILL.md:311` 段末 `   risks, and the next stage boundary.`

**③ 覆盖**：h。

**声明**：本条是执行纪律，不是新的 stage、gate 或质量结论。

### P8｜交接前「可执行性自问八条」（覆盖 a–h，兜底）

**① 条款草案**（粘在 `workflows/build-spec/SKILL.md:49-51` 那一段之后）：

```
交接前可执行性自问（逐条写答案；答不上来的写 `unavailable` 并写明 owner，不要留到 build-plan 或 build-code）：

1. 每个 Phase 是不是一个可独立验收、可独立提交的结果？有没有哪张卡里混了两个用「并且」连接的交付物？
2. 每条关键 AC 的真实入口、真实消费者、独立判据都在计划里指名了吗？还是只有「将来如何观察效果」的说法？
3. 受保护文件、外部前置条件和预写测试的形式断言，是**实读**来的还是推断来的？实读记录写在哪一行？
4. 每条预写红测，是因目标行为失败，还是夹具/环境失败，还是本来就通过？
5. 有没有用整份常变文件的哈希，当作一条稳定规则的版本？
6. 同一主题的复核件有没有重复保留？复核材料有没有整目录复制？
7. 跨 Phase 的写入集与消费者顺序走一遍能连上吗？有没有哪个消费者要等一个还没安排的产出方？
8. 这次交接里，哪些风险是计划缺口、哪些是实现未知？两类分得开吗？

八条里任何一条答「不能确定」，就写进上面的阶段末遗漏披露，并写明它属于计划缺口还是实现未知。
```

**② 位置与锚点**：文件 `workflows/build-spec/SKILL.md`；插在「## 阶段末遗漏披露」小节内、最后一段之后（下一节是「## 阶段末复盘（必须执行）」）。
锚点逐字（`▲`）：`若没有 stage outcome，也必须明确披露“outcome 缺失”；这不是“跳过”，而是当前事实 unavailable。`

**③ 覆盖**：a、b、c、d、e、f、g、h（全部，兜底）。

**声明**：本条是执行纪律，不是新的 stage、gate 或质量结论。

---

## §4 明确不做的事与理由

1. **不新增任何 stage、gate、step、schema 或 js 校验模块。** 理由：`workflows/build-spec/SKILL.md:17-22` 明文「不新增 stage、public command、store 或 gate」；`skills/spec-analyze/SKILL.md:132-147` 明文「does not create a separate workflow, store, or provider-pass gate」；`AGENTS.md:54` 要求新控制面必须先登记职责、真实 consumer、owner、测试与删除条件——本轮没有可登记的 consumer，所以一条都不新增。
2. **不给 build-spec 增加 review track / review scope / 审查次数旋钮。** 理由：`runtime/review/review-policy.mjs:46-53` 对 build-spec 传 track 或 scope 会**抛错**，这是刻意设计；f（同一 Phase 两次正式审查）发生在 build-code，build-spec 侧正确的落点是条款（§3 P6），不是改机器契约。
3. **不重复 build-code 侧 `/tmp/wh-card03-s926/R-review-code.md` 的 8 条提案。** 尤其：它的 P3 已写「证据只留原始件 + 禁止目录/整树快照」，我的 P6 因此只写「复核件的形态与保留」；它的 P6 已写「Phase 成本一行」，我的 P7 因此只写「缺口归属」，不写计时。
4. **不改 `skills/review/SKILL.md` 的 finding 字段与输出形状。** 理由：`:20-25` 只允许 `severity`/`path`/`line`/`issue`/`root_cause`/`recommendation`/`evidence_kind`/`evidence` 八个 provider 字段并禁止 `axis`/`visibility`/`anchor`/`consequence`/`correction`；`:29` 只允许「exactly one JSON object」。§3 P4 因此只往 §Check 的**散文**里加第 6a 条，一个字段都不加。
5. **不改 `skills/spec-analyze/*` 的职责边界，不把结构报告升级成语义/可执行性判断。** 理由：`skills/spec-analyze/SKILL.md:91-94` 与 `skills/spec-analyze/packet-lens.md:13-17` 明文把行为强度判断弃权给独立 merged review。把这块搬进结构报告会改变运行时 owner 与门禁形态，等于偷偷加门禁。
6. **不给审查派发次数、证据字节数、快照文件数设任何上限或门禁。** 理由：`docs/standard-workflow.md:88-92` 明文「不设统一预算 gate」；`runtime/review/review-input-bounds.mjs` 逐字「Provider capability, rather than a local byte ceiling, decides whether delivery is possible.」。§3 P6 是**形态纪律**（一份还是多份、有没有复制目录树），不是数量上限。
7. **不把 `tests/contract/post-cohort-executable-authoring.test.mjs` 的存在性断言升级成语义断言。** 理由：契约测试只该证「文本/形状在不在」；让它去判「计划可执行」需要新增语义模型，正是第 1 条禁止的事。
8. **不动 `skills/spec-plan/templates/phase-template.md` 的字段名与字段集合（L1 的字段清单保持不变）。** 理由：`:50-52` 与契约测试都在核字段名；§3 P1/P2 是「在既有字段里加判据与核实要求」，不新增字段、不改名，避免连带改测试与索引。
9. **不把任何提案写成阻断。** 理由：`AGENTS.md:52`「测试、审查、历史和 inventory/complexity 只产生事实证据，不是推进许可证」；`AGENTS.md:67`「`unknown`、`unavailable`、`incomplete` 不能阻止同 task 修复」。§3 全部条款都允许写 `unknown`/`unavailable` 后继续。

---

## §5 不确定项

1. **`skills/plan-eng-review/SKILL.md`、`skills/spec-plan/SKILL.md`、`skills/spec-plan/templates/phase-template.md`、`tests/contract/post-cohort-executable-authoring.test.mjs` 不在我的 12 项阅读清单里。** 前三者的关键行我用 `grep`/`sed` 定点核实过（§3 里带 `▲` 的锚点都是我亲自看到的原文）；但 `tests/contract/post-cohort-executable-authoring.test.mjs` 我**没有亲自读原文**，第 34 条来自本目录既有草稿的阅读记录。
2. **一处既有草稿的引文错误已被我纠正**：同目录旧稿称 `phase-template.md:1` 是中文「# Phase P<n> — [这一 Phase 的一个可独立验收的结果]」、`:38` 是中文「可观察接缝」段。我实读后确认原文件这两行都是**英文**：`:1` = `# Phase P<n> — [outcome]`，`:38` = `- **Observable seam**: [...]`。本报告一律用我实读的英文原文作锚点。
3. **我没有核实 card-04 实际走的是 pre 还是 post cohort。** 本 checkout 里 build-spec 在 post 是只读历史阶段（`workflows/build-spec/SKILL.md:9-15`），所以我按「计划作者 = `skills/spec-plan/SKILL.md`」写。若 card-04 是 pre cohort，P1–P4 的落点需要从 `spec-plan` 改回 build-spec 自己的规格段，条款文字不变。
4. **`review-frozen-spec` 与 `skills/review/SKILL.md` 的对应关系是推断。** `workflows/build-spec/steps.json:15` 声明了 step 11 `review-frozen-spec`，`skills/review/` 是仓里唯一的通用 review 检查表，二者我按此关联；我没有去读运行时派发代码（不在清单里），因此第 21 条「这就是实际检查表」的强度是**推断**。若实际检查表另有其文，§3 P4 的第 6a 条应改挂到那个文件。
5. **`runtime/review/stage-materials.json` 我没有读**，因此 build-spec 的实际 `minimum_reviewers` 值未知，§4 第 2 条只能说到「没有旋钮」这一层。
6. **§3 P2/P3 与 `workflows/build-spec/SKILL.md:270-280`「Boundaries（不把实现文件清单/代码符号/测试命令写进 spec.md）」存在张力。** 要核实真实入口就必须读实现文件，而实现细节又不许写进 `spec.md`。我的草案把实读记录放在 **Phase 卡/计划材料与检查表**里，没有要求写进 `spec.md`；但这两处的边界是否真的允许，需要人来裁。
7. **「P5 ≥15 份、P10 ≥26 份复核件」是 parent 转述，我没有原始统计。** §3 P6 的条款不依赖具体数字，所以不受影响。
8. **我无法证明新增纪律条款会被执行。** 这些条款的效力依赖人和独立审查，这正是 `AGENTS.md:17`（禁止自审自判）与 `AGENTS.md:15`（重读量动作点派子代理）的范围；我不提供任何「加了条款就一定会被抓到」的保证。
9. **`docs/standard-workflow.md` 我只读了 3 段**（`:83-122`、`:100-112`、`:187-230`），未读全 402 行；build-plan 段（`:231-269`）未读，因此 §3 的插入点与 build-plan 段是否已有重复条款，**没有完全排除**。
10. **我没有跑任何命令、测试或验证提案落地效果**（只读调研，且禁止全仓扫描）。§3 的 8 条都是文本条款，落地后需要人按 `AGENTS.md:17` 派独立上下文复核。
11. **本文件路径 `/tmp/wh-card03-s926/R-review-spec.md` 在我开始前已存在一份 619 行的同任务旧稿**（结构为 `## 1.`–`## 5.`）。我按 parent 指定的固定产出路径写了本报告，**覆盖了旧稿**；旧稿的结论我已并入本文（尤其是 `plan-eng-review` / `spec-plan` / `phase-template` 三处锚点的指向），但它的原文没有逐字保留。若需要旧稿原文，只能从本次会话的压缩记录恢复。

---

`§1 34 条 / a–h 判定：能 0、部分能 7（a,b,c,d,e,f,g）、不能 1（h）/ §3 提案 8 条 / §4 9 条 / §5 11 条`

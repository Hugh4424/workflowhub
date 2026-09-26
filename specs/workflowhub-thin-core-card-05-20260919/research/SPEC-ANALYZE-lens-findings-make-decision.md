# spec-analyze 镜头结果：make-decision 终末语义检查（15 条 finding）

- **执行者**：子代理 `937f5122-5bf8-4d22-8fd3-30dc53fb35be`（独立上下文，lens-only，全程只读，未创建/修改任何文件）
- **执行依据**：`skills/spec-analyze/SKILL.md`
- **执行时间**：2026-09-22（同一会话内，父代理 `session-feb3a29b-7e29-467a-a577-78e9f4dd7578` 派发）
- **落盘者**：父代理（逐字转录子代理的投递内容；父代理未修改任何 finding 的文字、严重度或处置）
- **落盘原因**：原报告只经 `send_message` 投递，**在磁盘上无副本**——这本身即是 F-07 所指「证据落点在包外/易失」的同一病症。本文件即为该缺口的就地补救。

> 说明：本文件是**审查事实原件**，不是材料正文。`decision-log.md` 中引用的 finding 编号以本文件为准。

---

## 0. 总体判定

**不通过认证、不建议原样离开 make-decision。** 材料语义质量高、披露诚实（自我更正密度罕见），但**当前磁盘修订没有任何对应的用户确认**，且所有机器质量事实（coverage audit / acceptance evidence / confirmation）都绑在更早的修订上；再加一份 `material_incomplete`。结论 = 保留内容、补齐「重新认证」后再出阶段。

## 1. material_incomplete（缺输入，按 skill 要求不计为语义 finding）

包输入结构性缺失：任务清单未提供**已认证的原始需求清单**（authenticated raw requirement inventory）。亲验两份 coverage audit（`/Users/Hugh/Hugh/Knowledge/Projects/workflowhub/tasks/workflowhub-thin-core-card-05-20260919/quality/evidence/coverage-audits/`）：

| 审计文件 | material_revision | snapshot | decision_log_hash | status |
|---|---|---|---|---|
| `7ec39fd2….json` | `revision-9519539b…` | `b31865f7…` | `90999ee7…` | `incomplete` |
| `d2d3c149….json` | `revision-8db0d039…` | — | `09fbfbc0…` | `incomplete` |

两者均 `items:[]`、covered/accepted_omission/missing 全 0、`failures[0].code="source_inventory_unavailable"`、`message="authenticated raw requirement inventory is unavailable"`、`authority.scope="known_inventory"`、`duplicate_authorities:0`。

因此**无法认证**：(a) 原始需求/来源 ID→决策/FR·AC/目标证据的完整映射（clause 1 的上游半段）；(b) 覆盖率百分比；(c) 无孤儿需求、无漏覆盖（无法做反向集合差）；(d) 材料自建 `## 需求矩阵`（48 行）与「母 PRD CARD-05 24 项全 yes」的权威性；(e) 36 条决策的 `requirement_ids` 是否正确（材料自认：这些值是需求矩阵文本的机械倒排，未回核 `prd.md` L139–179，见 `decision-log.md:2989`）。

**以上是缺输入，不是材料的语义缺陷。**

## 2. 指标（Metrics）

- **Total Requirements**：48（`decision-log.md:2213–2262` 的 `## 需求矩阵` 行数：R-001…R-020、OI-001…OI-014、用户声明 1–6、D-101…D-108）；上游卡片级另有 24 项（母 PRD CARD-05 的 FR/AC/SD，`prd.md:353–388`）。
- **Total Tasks**：0（本阶段不产出 `tasks.md`；代替物是 `workflows/make-decision/steps.json` 的 14 步 manifest：12 步已执行、step 10 detail-advice 失败/unavailable、step 14 stage-reflection 待执行，`decision-log.md:2873–2886`）。
- **Coverage %**：**不可认证**（认证投影 0 项 / incomplete）。材料自评两套口径：C 节「24 项全部 yes」= 100%（**设计层**，交付物一件未产出，`:2912–2914`）；48 行矩阵里 covered 19 + covered（有条件）2 = 21/48，non_goal 26（归属其他卡），accepted_omission 1（用户声明 2）。
- **Ambiguity Count**：3。**Duplication Count**：1。**Critical Issues Count**：1。（另有 HIGH 7、MEDIUM 4、LOW 2，共 15 条 finding。）

## 3. Findings

每条含 skill 要求的 8 字段；`disposition` 原一律为 `pending_main_agent_review`（父代理后续在 `decision-log.md` 的处置表中给出终局处置）。

### F-01｜CRITICAL｜constitution_alignment（记录型，但阻塞出阶段）

- **source_artifact**：`specs/workflowhub-thin-core-card-05-20260919/decision-log.md`（`:2959–2961`）+ `quality/confirmations/*.json`
- **target_artifact**：同上 `decision-log.md`（阶段出口状态）、`quality/confirmations/`（缺当前修订的确认）
- **fr_or_task_id**：`workflowhub-thin-core-card-05-20260919`（阶段出口）；D-035 / D-021 义务
- **line_or_anchor**：`:2959`「D-035 改变了既有决策语义…先前 approve-decision 确认（绑 `revision-9519539b…`/`snapshot_tree=b31865f7…`）不再覆盖本次修订，须用户重新确认」；`:2961`「⚠️ 但材料整体仍待用户重新确认…在用户完成新一轮确认之前，材料不得被读作已获最终批准」
- **problem / impact**：磁盘上仅两份确认——`c7411d6dab1a`（accepted，`material_revision=revision-9519539b…`，`snapshot=b31865f7…`，2026-09-22T00:00:20.877Z）与 `2285ef23`（accepted，`revision-8db0d039…`，2026-09-21T23:35:39.685Z）；而当前 `decision-log.md` 实际 sha256 = `a76e41930d0318230df9166d441905627fd8e0e4379fc6dbce696b894782abd6`，**不被任何确认绑定**。材料自身也明文禁止把它读作已批准。阶段因此处在「内容已写、授权未给」的状态；若下游（build-spec）把它当已批准输入，就是把未确认的修订当作基线推进，违反「推进/不可逆动作经人确认」。
- **suggested_correction**：离开本阶段前完成一轮真实用户确认并把该确认绑到当前修订（或把 stage 状态显式记为 pending-reconfirmation，禁止下游消费）；不要用「材料已如实披露」替代确认本身。

### F-02｜HIGH｜inconsistency（机器认证与磁盘修订不一致）

- **source_artifact**：`quality/evidence/coverage-audits/7ec39fd2….json`、`d2d3c149….json`、`quality/evidence/acceptance/make-decision/*.json`、`quality/facts/dc158bf0….json`
- **target_artifact**：`decision-log.md:2651–2653`、`:2700`
- **fr_or_task_id**：阶段质量事实（SD-15/SD-17 语境）
- **line_or_anchor**：两份 audit 的 `decision_log_hash` 分别为 `90999ee7…`（revision-9519539b）与 `09fbfbc0…`（= `:2706` 记的修复前副本 sha256），**都不等于当前文件 sha256 `a76e4193…`**；12 份 acceptance evidence（acceptance_clarity / goal_achievement / outline_closed / plain_language_card / requirement_coverage / solution_convergence / ui_applicability = pass；finding_dispositions / non_goals / risks / scope / stage_end_spec_analyze = deferred 且 `summary.actual_outcome="missing"`）全部绑 `material_revision=revision-5f807b76…` / `snapshot_tree=513bd6a0…`，`evaluated_at 2026-09-22T04:19:32.639Z`；quality-fact `dc158bf0` 绑 `revision-8db0d039…`
- **problem / impact**：材料把「认证投影为空」写成了对当前材料的质量事实，但真正的机器事实是：**当前修订从未被任何覆盖审计或验收证据评过**（12 份验收证据里 5 份是 missing，且没有一份对应当前修订）。下游若引用这些证据会引用到过期修订；反过来「requirement_coverage=passed」也只是对 `5f807b76` 版材料成立。
- **suggested_correction**：对当前修订重跑 coverage audit 与 12 项 acceptance evidence（或把这 12 份证据的绑定修订与 missing 状态在材料里如实登记），再宣告阶段的机器事实。

### F-03｜HIGH｜inconsistency（自报计数与记录实际不符）

- **source_artifact**：`decision-log.md`（OI YAML 记录；机器重算）
- **target_artifact**：同文件 `:2309`、`:2355`、`:2694`、`:2945`、`:2827–2828`/`:2833–2834`
- **fr_or_task_id**：OI 台账 / 35 条 OI（clause 5 与覆盖披露）
- **line_or_anchor**：`grep -c "oi_id:"` = 35；`^status:` 实测 **21 confirmed / 14 deferred**；而材料自报 `:2309`/`:2355`/`:2694`「33 条：20 confirmed / 13 deferred / 0 open」、`:2945`「35 条（原记 33…新增 OI-034/OI-035，均 deferred）」→ 隐含 20/15。差异源：OI-027 由 D-028（`:2024`）从 deferred 升为 confirmed，材料未同步任何计数；`:2827` 仍写「31 条 OI 记录」。
- **problem / impact**：阶段末披露与需求覆盖层的 OI 计数不可信。下游按错计数判「还有 15 条未决 / 20 条已确认」会误判工作量与风险面。
- **suggested_correction**：用记录重算并统一四处计数（建议直接给一条机器可复算的状态表），删掉/标注过期计数。

### F-04｜HIGH｜inconsistency（材料内的假自证）

- **source_artifact**：`decision-log.md:2472`
- **target_artifact**：同文件 `:2472`（CF-1 证据行）
- **fr_or_task_id**：CF-1 / ADR-0031（记录可复核性）
- **line_or_anchor**：该行原文「`grep -rn "D-030"` 在本材料与 ADR-0032 中**零命中**」；实测同文件 `grep -c 'D-030'` = **37**（且全材料有 21 行引用 ADR-0031）。ADR-0032 那半句为真（grep = 0）。
- **problem / impact**：这是材料**自己写下的可复核断言且为假**，直接损害其「事实须可复核」的纪律；后续读者会据它以为材料从未引用 D-030/ADR-0031，进而错过 CF-1 的 ADR 冲突面。
- **suggested_correction**：就地更正该行（给出真实 grep 结果，保留「ADR-0032 未提及 ADR-0031」这一真事实）；同时检查同段其它自证性 grep 断言。

### F-05｜HIGH｜deferred_open_handoff_gap（clause 5）

- **source_artifact**：`decision-log.md:2456–2563`（CF-1…CF-9 条目）、`:2462`、`:2684`、`:1952`、`:1972`、`:2075`、`:2493–2498`
- **target_artifact**：同文件的 CF 状态行与 D-023/D-024/D-025/D-030/D-031 的义务行
- **fr_or_task_id**：CF-1…CF-9（等价于 OPEN-* 未决项）
- **line_or_anchor**：九条 CF 全部被标为 `RESOLVED by D-0xx`（`:2462`、`:2684`），但同一材料/同一批 D 条目同时写明实质工作未做：CF-1（D-024）「承担 ADR 的成文仍为 TODO，未落盘前该冲突的 ADR 侧记 open」（`:1952`、`:2474`）；CF-3（D-025）「跨仓改动尚未实施」「未登记跨仓交付项、未取得任何跨仓授权」（`:2493`、`:2498`），且 `:2937` 仍列为开放风险；CF-9（D-030）核验动作「登记但未执行」；CF-2（D-023）实现时序问题「交 build-plan，本条不预选」。这些条目**没有逐条的 owner / trigger / consumer（交接）/ close 条件四要素**（只有 D-024 笼统说「须在 build-plan 登记 owner 与验收」）。
- **problem / impact**：阶段表观上「九条冲突均已裁决闭合」，实际是「用户裁决了解法、交付义务还挂空」。下游若按 RESOLVED 读，会把未实施的跨仓改动、未落盘的 ADR、未执行的交付物核验当成已完成。
- **suggested_correction**：对每条 CF 补齐四要素（owner / trigger / consumer / close 条件），或指向具体承载它的 OI/build-plan 工作包；「RESOLVED」限定为「裁决级已闭合」，与「交付级闭合」分开标注。

### F-06｜HIGH｜deferred_open_handoff_gap（confirmed 标签掩盖的延期义务）

- **source_artifact**：`decision-log.md:182–200`（OI-004 记录）、`:2060–2078`（D-031）、`:198`（acceptance）、`:199`（counterexample）
- **target_artifact**：OI-004 记录与 D-031
- **fr_or_task_id**：OI-004；FR-54/AC-55；D-011/D-031
- **line_or_anchor**：OI-004 `status: 'confirmed'`，但其处置与验收新增一条**未执行的测量义务**：D-031 要求「补跑一条真实代码 diff 面的 wh-review 基线」，并明写「该实跑的执行属 build-plan 产出的对比实验设计，**本次未跑**，也不得声称已跑」（`:2075`）。因为是 `confirmed`（非 deferred/OPEN），OI-004 **不带** owner/trigger_condition/scope_boundary/follow_up_acceptance 字段（机器统计：四字段只出现在 14 条 deferred 记录 + OI-027）。
- **problem / impact**：一个真实的延期义务被 `confirmed` 标签藏起来，clause 5 无法通过状态字段扫描发现它；go/no-go 的基线集合据此「半个基线」，却没有任何记录保证代码面基线会被补上。
- **suggested_correction**：把该义务落成带四要素的记录（延长 OI-004 或新增 OI），或在验收里写明 owner/trigger/close。

### F-07｜HIGH｜underdefined（证据落点在包外且易失）

- **source_artifact**：`decision-log.md:1176`、`:1194`、`:1205`、`:1215–1233`、`:1235`、`:2697`、`:2939`；实测 `/tmp/wh-card05-forensics/`（124 个文件存在，但位于任务证据树之外）
- **target_artifact**：RF-16 基线登记块、SD-08 替代审查落点、D-011 基线集合
- **fr_or_task_id**：FR-22/FR-54/AC-55；SD-08；D-011/D-031
- **line_or_anchor**：基线的唯一时间锚点是会话自写的 `/tmp/wh-card05-forensics/step6-timestamps.txt`（`WALL_SECONDS=444`），材料自己把 `exit=0` / stderr 空标为「不可核验叙述」并移出基线组成（`:1215–1233`）；替代审查原件（41,069 B / 255 行）与 gap 分析 `stage-end-spec-analyze.md` 都只在 `/tmp`，材料自认「原件不在任务证据树内」「只在 /tmp」「随时可能被清理，当前不可长期复核」（`:1235`、`:2697`、`:2939`）。
- **problem / impact**：clause 1 要求「需求→决策→客观证据」闭环，但 go/no-go 阈值的基线数值在包内**无法独立复核**（包内只有叙述，锚点在 `/tmp`）；AC-55「阈值在实验前写死」缺少持久、可审计的载体。
- **suggested_correction**：按材料自己已写明的正确落点，把 `/tmp` 产物以带 attempt/result 绑定的审查事实或指定 `quality/evidence/` 位落盘并声明 consumer；在此之前不要把该基线称为客观证据。

### F-08｜HIGH｜inconsistency（六要素未齐备却判 yes）

- **source_artifact**：`decision-log.md:2573–2607`（六要素对照表）、`:2580–2582`、`:2586–2589`、`:2628–2638`（gap 修复登记）
- **target_artifact**：同文件的 FR-53/AC-54 现判行（`:2630`、`:2635`）与六要素表
- **fr_or_task_id**：FR-53 / AC-54
- **line_or_anchor**：同一份材料：要素 3「超时语义」判 **NOT satisfied**（「承担 ADR 的成文尚未落盘（D-024 明记 TODO，未成文前冲突记 open）」，`:2581`）；要素 4「unavailable 状态集合」判 **NOT satisfied**（「此前零命中；本次未枚举完备」，只给 11 项非完备种子，`:2582`、`:2591`）；要素 2 的「建议」字段取值域「无一手证据」（`:2580`、`:2589`）。但 gap 修复登记把 FR-53（`:2630`）与 AC-54（`:2635`）的「现判」写成 `yes`（标注「设计层」）。AC-54 的失败场景原文是「任一要素缺失或未冻结即接入，即失败」。
- **problem / impact**：同一文档内「未齐备」与 `yes` 并存，下游极可能把 `yes` 读成 AC-54 已满足——而 AC-54 恰恰是本卡接入 OCR 的前置门。
- **suggested_correction**：把 FR-53/AC-54 的现判降到 `partial`（并在 OI-033 关闭后升级），或明确写「yes 仅指已指派 owner，不等于要素齐备」。

### F-09｜MEDIUM｜underdefined（clause 1 的来源引用不完备）

- **source_artifact**：`decision-log.md:40`；实测 worktree `docs/adr/` 有两个 0031
- **target_artifact**：`:40`、`:102`、`:527`、`:1968`、`:2495` 的引用写法
- **fr_or_task_id**：FR-53/AC-54 语境下的来源可追溯性；D-030⑤
- **line_or_anchor**：`ADR-0031:85` 在 `:40` 是裸编号——worktree 里 0031 有两个文件（`0031-hosted-method-toolkit-direction.md` 11 行、`0031-review-check-downgrade-and-identity-boundary.md` 101 行），只有 `:2495` 用了全名可消歧；`card-02 DL:1193` 在 `:102`/`:527` 无路径，而 `/Users/Hugh/Hugh/Project/*card-02*` **已无活 worktree**（仅存档于 `specs/archive/workflowhub-thin-core-card-02-20260919/`）；`archive …/decision-log.md:332` 在 `:40` 少了 `specs/archive/` 前缀（`:1968` 才是完整写法）。
- **problem / impact**：引用无法被机械解析/复现（SD-17 要求纯文本路径引用），有人按字面找会找不到或找错文件；一旦存档目录变动即失联。
- **suggested_correction**：统一为 worktree 相对全路径（含文件名与行号），裸编号一律补齐。

### F-10｜MEDIUM｜ambiguity（术语漂移）

- **source_artifact**：`decision-log.md:2156`；worktree `CONTEXT.md:434–450`（术语表新增节）
- **target_artifact**：`CONTEXT.md` 术语表与 `decision-log.md` 的核心需求句
- **fr_or_task_id**：D-005/D-028/D-035；FR-25/SD-08
- **line_or_anchor**：术语表 `CONTEXT.md:444` 把 any-of-N 定义为「任一路成功即视为审查通过」，且全表**没有** `single_source` / `corroborated` / D-035 任何字样；`decision-log.md:2156` 核心需求仍写「多路异源并发，任一成功即审查通过」。而 D-035（`:2134`）已把「任一成功」降级为**派发判据**，结果取舍改为**并集入账 + 逐条标注来源强度**。
- **problem / impact**：下游按术语表实现就会做出被 D-035 明令修正的旧语义（首个成功即通过、其余丢弃），正好复现本卡要消灭的病。
- **suggested_correction**：`CONTEXT.md` 增补 `single_source`/`corroborated` 条目并按 D-035 改写 any-of-N 定义；同步修订 `decision-log.md:2156`。

### F-11｜MEDIUM｜ambiguity（同一承诺的两种状态并存）

- **source_artifact**：`decision-log.md:2564–2571`
- **target_artifact**：同文件 `:2867`、`:2906–2947`（阶段末披露 A/B/C 节）
- **fr_or_task_id**：D-006 风险承诺；publish-decision（`steps.json` step 13）
- **line_or_anchor**：`:2564–2569` 写「遗漏披露承诺的落点…**尚未产出**」「本材料（`decision-log.md`）是 step 12 的产物，**不含**该摘要」「本材料**不代写、不代判**该摘要」；而 `:2867` 声明 A 节即 step 13 产物、是文件内 7 处「须在阶段末遗漏披露」承诺的唯一落点，且 `:2906–2947` 确实给出了六段大白话总结（六项全 present）。
- **problem / impact**：读者无法判断「承诺是否已履行」；两种写法还分别暗示阶段末产物存在/不存在，直接影响本阶段能否算交付完整。
- **suggested_correction**：把 `:2564–2571` 标为历史（或改写为「落点见 §阶段末披露」），一处权威。

### F-12｜MEDIUM｜duplicate（同事实多份并列陈述、且互相矛盾，无弃用标记）

- **source_artifact**：`decision-log.md`
- **target_artifact**：同文件 `:2309`/`:2355`/`:2694`/`:2827–2834`/`:2945`（OI 计数）；`:2719–2734`/`:2787–2788`/`:2795–2796`/`:2805–2806` 与 `:1207`/`:1315`/`:1571`（token 口径「三层一致」vs 实测「两层 null + 一层无该键」）；`:2841–2842`/`:2859–2860` 与 `:2462`/`:2684`（CF「仍未决」vs「全部 RESOLVED」）；`:2809–2812` 与 `:2234`/`:2248`（R-020/OI-014「covered（已覆盖）」vs「covered（有条件）」）
- **fr_or_task_id**：覆盖矩阵 / CF 状态 / RF-16 基线登记
- **line_or_anchor**：上述行号成对冲突；`## 本次 gap 修复的原文留证`（`:2704–2864`）按设计保留被取代的原文，但文件里没有任何机器可读的弃用标记。
- **problem / impact**：任何自动读者（或快速扫读的人）会同时看到两个互斥值；clause 2 要求的「同一事实在材料内一致」在字面上不成立，判断只能靠人工按 `:2708`「正文的更正注为准」的口径裁决。
- **suggested_correction**：给留证区加显式「已弃用（superseded by X）」标记或索引，并统一 OI 计数到一处。

### F-13｜MEDIUM｜ambiguity（被替换面集仍有两个互斥答案）

- **source_artifact**：`decision-log.md:1346`、`:1552`、`:1667–1673`、`:1928–1934`
- **target_artifact**：D-006/D-018/D-023 的面集表述与 RF-11 的 3 个 diff 面
- **fr_or_task_id**：FR-23/FR-56/AC-23/AC-57；OI-026
- **line_or_anchor**：D-006 说被替换的是「②③④ 代码审查点」= `build-code/phase`、`build-code/integration`、`verify-code`；RF-11 的 3 个 diff 面是 `build-code/phase`、`verify-code`、`mini_task/implementation`；D-023 又把 integration 改成 diff 面。材料登记了 CF-2 并称 D-023 RESOLVED，但 D-023 只把 integration 改成 diff，**没有**解决「`mini_task/implementation` 是否在面集内」；「7 个文档审查面」的枚举也只有 6 个名字（`:2184–2186`）。
- **problem / impact**：下游 build-spec 无法从材料唯一确定「到底替换哪三个面、剩下几个文档面」，OI-026 的映射表因此可能建在两个不同集合上。
- **suggested_correction**：在 build-spec 冻结一张唯一权威的「审查面 × 输入形态 × 工具 × 归属」表，并把 D-006/D-018 的旧表述标为已由 D-023/OI-026 取代。

### F-14｜LOW｜underdefined（解析器驱动的偏离缺统一索引）

- **source_artifact**：`decision-log.md:2301–2377`（`### 1′`–`### 4′`）
- **target_artifact**：同文件解析器字段披露节
- **fr_or_task_id**：材料合规性（非语义）
- **line_or_anchor**：`outline_version` 被写成字符串 `'02'`（因 `substantiveOutlineValue` 要求长度>1，`:2371`/`:2402`）；OI-031 追加了 `framework_node`/`category` 映射，材料自认「不是解析器要求，属无必要的判断性映射」（`:2372`）；human-readable 台账仍保留 `open`/`待定`（`:2373`）。
- **problem / impact**：这些偏离散落在 4 个小节中，读者容易把它们当语义内容引用（材料已警告「不得当作材料原文引用」）。LOW：可读性/可审计性改进。
- **suggested_correction**：增加一张「解析器强制偏离索引」（字段 / 原因 / 影响的读者面）。

### F-15｜LOW｜underdefined（OCR 规则注入的未验证项未登记为验收项）

- **source_artifact**：`decision-log.md:1689–1737`（RF-15「仍未解决」清单）
- **target_artifact**：六要素对照表的要素 1/6 与 OI-033
- **fr_or_task_id**：FR-53/AC-54（适配合同冻结）
- **line_or_anchor**：RF-15 记录 `{{system_rule}}` 端到端注入未验证、多行 `rule` 未测、全局层 `include` 未测、上游无交叉验证；这些只写在 RF 块里，未进入任何 OI 或验收条目。
- **problem / impact**：适配合同冻结时可能重复发现同一批「未知」；LOW。
- **suggested_correction**：把这四项登记为适配合同冻结前的验收/见证项（可并入 OI-033 或要素 1 的验收）。

## 4. 六段大白话总结（子代理原文摘要）

1. **stage_work（本阶段做了什么）**：3 轮真实 Talk（T-001~T-017）、1 次 grill（G-CK + G-1~G-4）、2 次真实审查（step 6 direction 真派发 6 路 provider，25 条原始/14 条 canonical findings；step 10 detail 零派发失败 `REVIEW_HISTORY_UNAVAILABLE`）、1 次独立替代审查（18 条 findings，但原件只在 `/tmp` 且审的是修复前的 1871 行版本）、1 次 OCR 委托模式端到端两臂实验（kimi CLI 3 条 vs DSH 子代理 8 条，并集 9 条，各有一条对方漏掉的 high）。产出 36 条决策（D-001~D-036）、35 条 OI、P1–P18 缺陷闭环清单、48 行需求矩阵，跑官方检查器把 144 条决策链字段告警清到 0。
2. **requirement_coverage（需求覆盖）**：48 行里 26 行标 `non_goal`（归别的卡）、19 行 covered、2 行「有条件 covered」（R-020/OI-014，条件是本卡要真去核 card-02 的 ① 交付物，登记在 D-030）、1 行 accepted_omission（用户声明 2：不是所有审查都换）。母 PRD CARD-05 的 24 项在材料里全判 yes，但都只是「设计层」，交付物一件没有；而且没有任何认证覆盖投影背书（两份 audit 都是 `items=[]` / incomplete / `source_inventory_unavailable`），覆盖率数字不可认证。
3. **upstream_alignment（上游对齐）**：与母 PRD 的 CARD-05 节（`prd.md:353–388`，9 FR + 9 AC + 6 SD）逐条对齐，引用规划 DL 的条目都能核到；有一处**显式偏离**（D-018 把范围从「3 个代码面替换」扩成「3 面替换 + 7 个文档面问题修复 + wh-review 阻塞类彻底解决」，材料自己登记为偏离、不静默）；card-02 的三项入向义务（OPEN-002/RISK-003/T-075）已用 OI-032 接住但**三项都未闭合**；引用写法有几处不规范（ADR-0031 裸编号歧义、card-02 DL 无活路径、archive 路径缺前缀）。
4. **current_stage_repairs（本阶段修了什么）**：修掉 3 类事实错误（幽灵常量 `REVIEW_PACKET_MAX_DELIVERY_BYTES` 全仓无定义、恒真的 307,200B 验收判据、P1 的错误归因改成 `:211` 经 `:701`）、1 处范围自相矛盾（CF-2→D-023 把 integration 改成真 diff 审查）、1 处「两个方向都判不了真假」的验收（D-026 删掉第二析取支）、8 条语义 gap + 9 项多轮编辑残留、144 条字段合规告警；全程零删除（1782 个非空行逐字保留率 100%）。
5. **remaining_risks（剩余风险）**：go/no-go 可能直接判 no-go；any-of-N 全局化让 7 个文档面退化成「单源即通过」（用户已显式接受，缓解靠 OI-027 强制标注 `independence: partial`）；审查方要「能读仓库」会放大上下文成本，而宿主子代理这个新闸门还没有记账面（OI-029/D-027）；跨仓改 `3rd-review`（D-025）**本卡验收套件不覆盖**；与 CARD-06 写面重叠，需错时/分面合并；替代审查原件与基线锚点都只在 `/tmp`，随时可能被清；认证覆盖为空；最要紧的是**当前修订没有对应的用户确认**（材料自己写明「在用户完成新一轮确认之前，材料不得被读作已获最终批准」），而且没有任何机器质量事实是针对当前修订的。
6. **next_stage_boundary（下一阶段边界）**：build-spec 可以开始（把决策翻成 `spec.md`：冻结适配合同六要素、设计对比实验含预置阈值 + 代码面基线实跑、card-02 回溯臂用 FN1–FN6 当真值）；不得下移 D-001~D-036、P1–P18 闭环清单、35 条 OI；需 build-spec 承接的开放项 = OI-032/033/010/014/016/020/022/023/026/027/028/030/034/035；不要重新问用户已经答过的事。**但离开本阶段前建议先补两件事**：当前修订的用户确认 + 针对当前修订重跑机器质量事实。

## 5. 执行者自评（读了什么 / 能做什么 / 哪里是推断 / 总判定）

- **全文精读（执行者自己的眼睛）**：`decision-log.md` L1–180（身份/只读边界/UI applicability/OI 大纲+台账/OI 记录头）、L116–871（全部 35 条 OI 记录）、L862–1010、L1011–1335、L1336–1500、L1501–1665、L1666–1835、L1836–2005、L2006–2180、L2181–2305；抽样直读 L2465–2480（CF-1 块）。
- **部分读**：L2306–2660 与 L2661–2993（解析器字段披露、六要素对照、card-02 入向义务、gap 修复登记、18 条 finding 处置、未触碰清单、阶段末 A–E 节）由三个独立子代理逐区抽取并带行号引用（执行者审阅了它们的一致性，未逐字重读原文）；CF-2…CF-9 条目本体同样来自子代理抽取。
- **未读**：母 PRD `prd.md` 与规划 decision-log 的原文（经子代理 A 核对到行号并给出引用交叉表）；三份 `research/*.md` 与 ADR-0032、`CONTEXT.md` 的原文（经子代理 B 核对，含 RF-18 的 md5/字节数实测）；`CONSTITUTION.md` 原文（本会话只有 `AGENTS.md`/`CLAUDE.md` 注入）。
- **已完成的检查**：clause 1（部分，上游半段被缺输入挡住）、clause 2、clause 3、clause 5（可扫到的部分）、clause 6、clause 7；clause 4 在本阶段基本不适用（本阶段无测试/执行面，材料自己也登记了「未运行任何测试/构建」，`:2693`），仅能核到「未宣告最终聚合检查档 `simple|feature|fullstack`」——故未单独列 finding。
- **被缺输入挡住**：clause 1 的上游半段与任何覆盖率百分比（两份 audit 均 incomplete）。
- **哪些是推断而非包内证据**：严重度与类型分级；「下游会误读」类影响；F-02 里「当前修订从未被认证」的结论（基于算出的 sha256 `a76e4193…` 与两份 audit / 12 份验收证据所绑修订的比对——哈希与修订号是实测，结论是推断）；F-01 中「确认不覆盖当前修订」同样是实测（确认文件里没有该修订、材料自己写明）＋推断（阶段出口后果）。
- **总体判定**：**不建议原样离开 make-decision**。材料本身是这轮工作里质量最高的东西——披露密度、自我更正、零删除留证都可圈可点；但它现在处在「内容已改、授权未给、机器事实过期」的状态：需要 (1) 用户对当前修订的真实确认，(2) 对当前修订重跑覆盖审计与验收证据，同时把 1 条 CRITICAL / 7 条 HIGH（尤其 F-03 计数、F-04 假自证、F-05/F-06 clause-5 缺口、F-07 证据落点、F-08 六要素 yes 冲突）在主会话处置后再进 build-spec。缺输入部分按 skill 记 `material_incomplete`，**不给出 pass**。

# 一个 Phase 凭什么叫做完 —— 失效根因与执行层收敛判据

> 来源·产出：card-03 落地流程派发的只读取证子代理（事故取证 / 根因分析；未改仓库任何文件）
> 来源·时间：2026-09-29 19:11（本机 CST，文件 mtime）
> 来源·支撑：支撑 decision-log §17 M2（Phase 收尾三件事）与 §18 E13（完成声明的上限＝独立来源结论）

只读分析。所有出处为 `file:line`；标「推断」的是没有直接出处的判断。

## 1. 失效根因
**card-03 已经裁决过「缺质量事实怎么算」，但没有任何一处检查那个声明——因为系统里没有字段承载"声明"这件事。**

1. **「完成」没有能取真假的落点。** Phase 文件明文禁止写执行状态（`skills/spec-plan/templates/phase-template.md:15` 逐字「本文件由人编写，**不写执行状态**。跑没跑过…属于任务事实库」）；`phases/index.md` 侧同样被禁（`design.md:702` 引 `skills/spec-tasks/SKILL.md:8` 逐字 `not … a progress ledger`）；唯一被允许的状态载体是 `facts.jsonl` 的 4 键游标（`design.md:590`，`validatePhaseProgress` 恰 4 键全等校验），而它逐字声明「The cursor is navigation only: **it does not certify completion or unlock work.**」（`workflows/build-code/SKILL.md:245-250`）。runtime 确实逐字读 `Done` 等 5 个字段，但做的是**存在性检查**（`design.md:2975`：`validatePostPhaseContract` 的 `fieldValue(body,…)` + `:7097-7099` 三项存在性检查）。⇒ 机器验的是「`Done` 这一行有没有字」，不是「这一行是不是真的」。

2. **验收事实用内容寻址命名，所以「当前状态」没有名字。** 实测：仓外任务目录 `…/tasks/paperbuilder-live-simulation-durability-post-20260925/quality/evidence/acceptance/build-code/` 里 `AC-*` 文件**恰好 578 个**；按逻辑名归并后是 **17 个 AC × 每个 34 个内容寻址版本**（`ls | grep -c '^AC-'` = 578，每 AC 版本数唯一值 = 34，17×34 = 578）。该目录内**除 `AC-*` 与 `<逻辑名>-<64hex>.json` 外没有任何 index/current/latest 指针**（实测 `ls` 结果为空）。⇒「现在有几条 AC 没达成」这个问题没有单一路径能回答。**578 不是 578 个问题，是 17 个问题被重写了 34 次。**

3. **词汇表里只有"还没"和"没有"。** 实测扫全 build-code 验收树：`"result": "deferred"` 704 次、`"actual_outcome": "missing"` 585 次；`"result": "covered"` 与 `"result": "passed"` **各 0 次**。⇒ 系统从始至终没有表达"达成"的词。一个只有 deferred/missing 的词汇表，"做完"当然无法判真——`deferred` 逐字把"没做完"读成"以后再说"。

4. **阶段行自己写着不完整，却仍然关阶段——因为关阶段这个决定没有字段承载。** 实测 `facts.jsonl` 的 build-code 行：`layer_states {"implementation_completion":"partial","stage_quality":"incomplete","delivery":"unavailable","task_closure":"unavailable"}`；`close_action {"value":null,"reason":"**stage rows never carry a close action**"}`；`evidence {"value":[{"command":"stage-handoff:build-code","exit_code":0,"failure_signature":"published"}]}`——**阶段边界记录的唯一证据是一次 handoff 命令退出码 0**（发布文档的动作，不是测试）。同一条 stage-reflection 里 `"stage_status":"completed"` 与 `"status":"degraded"` 并存。

5. **于是 578/459 不是"直到最后才暴露"，而是从头到尾都在原地、却没有任何一句话能把它变成结论。** 实测 reflection `generated_at 2026-09-26T03:14:02.103Z`、`status "degraded"`、理由逐字「The current stage result has **all 17 AC facts missing**」；`blockers[0]` 逐字「**No real trading-day acceptance was run against this implementation.** … **local tests do not prove live continuity**」。任务 `task.json:created_at` = `2026-09-25T02:30:42.471Z`，会话自 09-25T12:36:51 起、共 101.9 h ⇒ **这条"全是 missing"的判断落在第 ~14.6 小时，之后又跑了 ~87 小时。** 缺的从来不是发现，是**把它说成结论的合法位置**。

6. **卡片落盘那一刻就登记了"没有阶段级事实"，同一时期的索引却在说"已覆盖"，没有一处能对比这两句话。** `phases/P1.md:53` gate_cmd 后缀逐字「**目标 RED 尚 unavailable**」；`:55` evidence_path 后缀逐字「**阶段级正式事实尚缺**」；而 `phases/index.md` P1 当前结果栏写「focused 行为已覆盖」。

## 2. 「做完」判据提案（三条，全部复用已有字段，零新增）

法理基础已有，不需要立新规：`design.md:1630` 引 `workflows/verify-code/SKILL.md:110` 逐字「review 结果只是质量事实，不是继续工作的许可证。**缺质量事实只限制完成声明，不限制继续验收和修复。**」——即"缺事实"本来就只该限制**那句话**。下面三条只是把这句话第一次落到可检查的位置，**不阻断任何推进**，只阻断一个词。
**D1 「一条命令、一个退出码」**：Phase 收尾时运行该卡片自己写的 `gate_cmd`（`phase-template.md:30`；`:123` 机器必填=是），把**这一次的原始完整输出**写到该卡片自己写的 `evidence_path`（`:32`；`:125` 机器必填=是）。
- 可证伪：**谁能验**＝任何人（含下游 Phase 的作者）；**拿什么验**＝`evidence_path` 里那份原始输出里的退出码；**不满足时谁被拦**＝没人被拦，但该 Phase **不得被写成完成**，只能写「未完成 + 那一条退出码」。
- 为什么当场可验：这两个字段今天就在卡片里、今天就被 runtime 按字面名读取（`:18` 逐字「它们由 runtime 按字面名读取，**不要翻译**」），缺的只是**没人执行过它们**。零新增字段。
**D2 「一个路径回答一个问题」**：该 Phase 的验收分母（几条 AC / 每条现状）必须能从**一个**路径读完——就用 D1 的那个 `evidence_path`。
- 可证伪：**谁能验**＝任何人；**拿什么验**＝对该路径读一次，能否列出分母和每条现状；**不满足时谁被拦**＝同上，不得写完成。
- 反面即实测事实：578 个文件名里没有 current（§1.2）。这条同时**只是在执行** card-03 已裁决的禁忌「记录层不用内容寻址哈希」（`design.md:2176` OI-013 + FR-29 逐字），不是新增约束。
**D3 「词汇表三分，删掉 deferred」**：验收分母里每条只允许三个值——`达成` / `未达成（本 Phase 内做得到，写下一步）` / `退役（写登记行，见 §4）`。
- 可证伪：**谁能验**＝任何人，grep 一次；**拿什么验**＝出现 `deferred` 即违规；**不满足时谁被拦**＝同上。
- 理由：`covered`/`passed` 各 0 次、`deferred` 704 次是实测的（§1.3）。删掉"以后再说"这个词以后，「卡在一个本任务做不到的 oracle 上」第一次**必须被说成人话**：要么退役，要么承认它是本 Phase 的下一步。
**D1–D3 与 card-03 禁忌的关系（逐条对表）**：不新增门禁/阻断/校验前置（`design.md:2175` SD-17/OI-012 逐字「一切机器/流程门禁删除」「规则类要求一律为『事实记录+验收核对』——没做或做假＝验收失败事实，如实记录，**不阻断推进**」）；不新增字段、`facts.jsonl` 键、public runtime 命令、projection、账本、第二份 phase 模板（`design.md:2177` §0）；不把执行状态写进 `phases/P<n>.md` 或 `phases/index.md`。三条**只改一句话的写法**，不改任何推进授权。
**谁来判断**：事实由产出方留（原始输出落地，`design.md:1629` 逐字「演练记录**只采事实**」）；**判定必须来自未参与产出的独立上下文**（`AGENTS.md:17`；`design.md:1629` 逐字「判定由独立上下文子代理给出」）。
**用户已批准的 ① 落点**：跑 `gate_cmd` → 写 `evidence_path` → `git commit`，同一个时刻。提交**不是判据**（提交不证明对错），它是 D1 未被反悔的存档，也正是逐字要的「既方便存档，又方便下一个 phase 审查的时候直接 git diff」。零新增字段。

## 3. 卡住判据（不设数字阈值）

用户反对随便设阈值。下面三条都不是数字，而是**两件事的比较**，每条写明谁来判断。
**S1 失败签名没变**：同一条 `gate_cmd` 再次执行后，失败的那一行与上一次**逐字相同**。
- 为什么不是阈值：判据是**变了没有**，不是**几次**。比较两个事实不构成阈值。
- 谁来判断：执行者必须先写一行「自上次以来我改了什么」；**写不出这一行，S1 即成立**。取证已有的 44.5% 失败标记输出仍在继续，就是这个形态。
**S2 同一文件为同一目的重写而 Phase 级结果未变**：`gate_cmd` 的退出码在两次该文件重写之间没有变化。
- 理由同上：单文件 163 次重写本身不是问题，**那 163 次之间 Phase 级结果没动**才是。
- 谁来判断：独立审查者，不是改写的人——改写的人已经用 163 次证明了不产生变化。
**S3 完成条件自己不可执行**（PaperBuilder 的真正杀手，唯一"人判断"的一条）：该 Phase 依赖的下一步，**读这句话的人今天在这个仓库里做不到**。
- 判据形态：读 `Done` / `STOP` / `next_review_trigger` 里写的下一步，问一句「我现在能做这一步吗」。做不到 ⇒ 这个 Phase 不是在推进中，是卡在一个**外部条件**上。
- 实测：reflection `next_review_trigger` 逐字「After the owning Phase is formally repaired and a **real trading-day acceptance run** produces current evidence.」真实交易日不是任务里的一步。
- 谁来判断：**人**（范围问题，不是质量问题）——落 `design.md:2175` 两道人为门之一「推进中的人为确认对话」。
- 阈值取舍的理由：S1/S2 可机械化，因为"有没有变化"客观；S3 不能，因为"做得到做不到"取决于人的授权范围。**硬给它设一个次数阈值，等于让机器替人决定范围**——那 9 条被否的补丁都是这个通病。

## 4. 放弃登记（用户已批准）

- **格式**（一行，字段名沿用用户原话的顺序）：`日期 | 哪张（P/T 编号） | 为什么一行 | 谁决定的 | 原承接的需求编号`。加最后一栏的理由：旧 17 AC 退役后**没有人能回答这 17 条需求现在归谁**（`phases/index.md:21` 逐字「旧的 17 AC…均标记为历史或退役；**它们不构成当前依赖，也不允许驱动新实现**」）——退役一张卡时必须指出它承接的是哪条需求，否则需求静默消失。
- **写在哪**：`decision-log.md`（make-decision 的产物；退役是**决定**，不是执行状态）。**不写进** `phases/P<n>.md`（`phase-template.md:15` 禁止）；**不把 index.md 变成新账本**（`design.md:702` 引 `SKILL.md:8` 逐字 `not … a progress ledger`）。index.md 现有「当前结果」栏只放一句指针（该文件本来就这么写），**理由与决定人只写在 decision-log.md 一处**，避免第二份正文漂移。
- **时机**：做决定的那一个回合内。11/20 张卡（55%）+ 整段 P4 退役却查不到任何"为什么"——不是没人知道，是**理由只在决定那一刻免费**，之后变成考古。
- **谁写**：做决定的人；上级拍的板写他的名字，agent 自己判的写 agent。**不许由被退役那张卡的作者单独自证**（`AGENTS.md:17`）。
- **为什么这样最省**：零新增文件、零新增字段、零新增 runtime 命令；复用 decision-log 一个已有的决定记录表。成本＝一次输入，换掉「11 张卡为什么消失」永久无法回答。

## 5. 反事实（拿 D1–D3 + S1–S3 重跑 PaperBuilder）

时间锚：会话 09-25T12:36:51 起，总 101.9 h（终点 ≈ 09-29 傍晚）。

- **第 ~14.6 小时（09-26T03:14Z）**：reflection 落盘 `status "degraded"`，理由「all 17 AC facts missing」，同一 stage row 写 `stage_quality: incomplete` / `delivery: unavailable`。**S3 在同一分钟成立**：`next_review_trigger` 要的是真实交易日，不是任务里的一步。⇒ 这一刻只能说「未完成」；那 17 条 AC 当场退役并留 5 栏登记行，而不是拖到 09-29。**救回 ≈87 小时**——这 87 小时里的实测损失：单文件 163 次重写、44.5% 失败标记、09-28T23:11:55Z 的 `git restore --staged --worktree :/` 清掉 194 文件/1474 改动。
- **第 ~82.6 小时（09-28T23:11:55Z）**：该次整树回滚。用户已批准的 ① 在 P1 收尾就有 commit，回滚粒度从"整棵树"降到"最后一个 Phase 以来的 diff"。
- **最后 ~36 小时**：`acceptance/build-code/` 最后一个文件写于 `Sep 28 06:39`（实测 `ls -lat`），之后到会期结束**验收事实一次都没再写**。D2 会在这里当场说话：分母的单一路径 36 小时没动 ⇒ 这个 Phase 事实上已经停了，而不是"在推进"。
- **D2 的具体拦截**：578 = 17×34 是重写放大，不是 578 个失败。D2 要求分母从单一 `evidence_path` 读 ⇒ 第一次重写就会暴露"同一个 AC 被写成第二个内容寻址文件"，不必攒到 34 版。
- **救不回的（如实说）**：D1–D3 不会让 17 条 AC 变得可达成——它们本来就需要真实交易日（reflection `blockers` 逐字「local tests do not prove live continuity」）。这套判据不把失败变成成功，只是把「卡在一个做不到的 oracle 上」从**跑了 101.9 小时**压缩成**第 14.6 小时说清楚**。

## 6. 我明确不做的

- 不新增 gate／阻断／校验前置（`design.md:2175` SD-17/OI-012 逐字「一切机器/流程门禁删除」「不阻断推进」）。
- 不新增字段、`facts.jsonl` 键、public runtime 命令、projection、账本、第二份 phase 模板（`design.md:2177` §0）。
- 不给任何数字阈值（用户明确反对；理由见 §3）。
- 不把执行状态写进 `phases/P<n>.md` 或 `phases/index.md`（`phase-template.md:15`、`design.md:702`）。
- 不新建"放弃登记簿"文件——那一行进 `decision-log.md`。
- 不做防跑偏的额外流程：D1 复用卡片里**已是必填却从没人执行**的 `gate_cmd`/`evidence_path`（`phase-template.md:123`/`:125`），D2 是"读一个路径"而非"维护一个路径"，D3 是**删词**而非加词。三条合计的新增执行动作 = **每 Phase 一次命令 + 一次提交 + 一行人话**。

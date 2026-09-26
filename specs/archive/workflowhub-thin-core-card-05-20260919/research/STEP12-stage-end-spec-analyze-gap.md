# stage-end-spec-analyze — CARD-05（workflowhub-thin-core-card-05-20260919）make-decision step 12

- 分析对象：`/Users/Hugh/Hugh/Project/workflowhub-workflowhub-thin-core-card-05-20260919/specs/workflowhub-thin-core-card-05-20260919/decision-log.md`（2128 行 / 288,183 B / sha256 `09fbfbc06e4c…`，mtime 2026-09-22 07:26:11）
- 要求权威：`specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md` `### CARD-05`（L353–388）+ SD 共享定义（L25–96）
- 性质：语义 gap 检查（非格式/风格检查）。本文件只读分析，未修改任何文件。

---

## (A) Provenance — 读了什么

| # | 材料 | 范围 / 方式 |
|---|---|---|
| 1 | `skills/spec-analyze/SKILL.md`（110 行） | 全文；其 Input boundary / Check / Result / Review semantics / Severity 条款即本次判据 |
| 2 | `workflows/make-decision/SKILL.md` L360–391（`## Stage-end consistency`） | 全文该节，逐字 |
| 3 | `workflows/make-decision/steps.json` step 12 `observable_result` | 全文解析 |
| 4 | 母 PRD `prd.md` | L25–99（SD-01..SD-17）、L100–200（任务地图/追踪表）、L353–388（CARD-05 全节）、L390–CARD-06、L483–511（CARD-09/CARD-10）、L595–673 |
| 5 | 被审材料 `card-05/decision-log.md` | **全文逐段读完**（1–270 / 271–570 / 571–810 / 811–1010 / 1011–1230 / 1231–1460 / 1461–1700 / 1701–1900 / 1901–2128） |
| 6 | 规划 decision-log | U-001#5(L53)、U-002(L61)、U-009#2(L106)、U-010#2/#3(L114–115)、OI-005(L276–295)、OI-013(L438–458)、OI-014(L459–478)、T-003(L540)、Q13(L819)、R-005/R-012/R-016/R-019/R-020 追踪行（逐字提取） |
| 7 | card-02 归档材料 | `specs/archive/workflowhub-thin-core-card-02-20260919/decision-log.md`（2181 行）与 `research/I-C-card-05-review-scope.md`（491 行）全文；另核 card-02 `spec.md` OPEN-002/RISK-003/FR-REVIEW-001 与 `quality/evidence/decision-log-process.md` 11 项交付物清单 |
| 8 | 磁盘上的审查事实 | `~/Knowledge/Projects/workflowhub/tasks/workflowhub-thin-core-card-05-20260919/`：`task.json`、`quality/confirmations/2285ef23….json`、`quality/facts/*.json`（2 份）、`quality/evidence/coverage-audits/d2d3c149….json`、`quality/reviews/attempts/{66ad856a,1696ecbc,c465624d}/attempt.json`、`providers/*.output.json`（5 份）、`results/make-decision-simple-66ad856a….json`、`reports/*.md`（4 份） |
| 9 | 取证报告 | `/tmp/wh-card05-forensics/`：`session1..4-report.md`、`ocr-research.md`、`ocr-rule-schema.md`、`current-review-arch.md`、`card05-scope-authority.md`、`step6-direction-report.md`、`step10-detail-report.md`、`substitute-detail-review.md`、`material-repair-report.md`、`cf-fold-report.md`、`cf-fold-parser-{before,after}.json`、`decision-log.snapshot.md`、`detail-request-input.json`、`build-facts.json`、`sanitisation-log.json` |
| 10 | 机理核对（只读） | `runtime/stage/stage-content-contracts.mjs` L3038–3189（`analyzeDecisionOutline`）、L3320–3467（`analyzeDecisionConvergence`）；`runtime/review/stage-materials.json` |

补充事实（用于校准"是否真的无法核验"）：`quality/confirmations/2285ef23….json` 记录 step `approve-decision`（=step 11）用户真实确认 `reply_text:"确认，推进"`、`decision:"accepted"`、`confirmed_at 2026-09-21T23:35:39.685Z`（+0800 07:35:39），绑定 `material_revision-8db0d039…`；`quality/evidence/coverage-audits/d2d3c149….json` 的 `decision_log_hash = 09fbfbc06e4ca93296d2337e7454ead505c21bb79c0d44d89eac7b74ff14819e` 与当前材料逐字节一致 → **该确认确实绑定当前这份 2128 行材料**（材料 mtime 07:26:11 早于确认 07:35:39）。

---

## (B) Gap list（按严重度）

### B-1 `blocking` — CF-6–CF-9 四条"须用户裁决"的未决冲突在最后一次用户确认中未获裁决，而材料自己规定它们必须先裁决才能进 build-spec

- 位置：材料 L1814–1815（"CF-1–CF-4 已…RESOLVED；仍未决的只有 **CF-6–CF-9**，上一条「必须由用户裁决后才能进 build-spec」对这一组继续生效"）、L1988（`CF-6 / CF-7 / CF-8 / CF-9 仍未决`）、L2048–2082（逐条仅写"需用户裁决 / 本修复不选"）、L1845。
- 缺什么：(1) 四条各自**没有 owner、trigger、hand-off/consumer、close/retain 条件**（只有"需用户裁决"，无裁决触发点、无完成后如何登记的落点）；(2) 最后一条用户输入是 step 11 的通用确认 `确认，推进`（`quality/confirmations/2285ef23….json`，绑定当前材料 revision），该文本**不点名 CF-6–CF-9**，材料中也没有任何一处记录这四条已获裁决或其被接受为风险。
- 为什么重要：这四条不是实现细节，三条会改决定本身——
  - CF-7（L2057–2064）：any-of-N 被外推到 7 个仍走旧 provider 的文档面，等于在无决策的情况下把多源一致性降为单源；
  - CF-8（L2066–2073）：`mode`（`full_only`/`single_round`）在逐路派发下的语义未处置，D-008"只读既有键"在该键上失去确定含义；
  - CF-9（L2075–2082）：母 PRD 把 ① 的 owner 写成 CARD-05（`prd.md:161-162/178-179`），本卡仅凭 card-02 自述判 `covered` 且**未登记任何交付物核验动作**。
  按 spec-analyze Check 第 5 条，`OPEN-*` 项必须四要素齐备（owner/trigger/consumer/close 条件），此处四缺其四；按 make-decision SKILL `## Stage-end consistency`（L386–388）"Repair any finding in make-decision… Do not move the gap to build-spec"，材料自己声明"必须先裁决才能进 build-spec"，因此带着这四条离场即把 gap 推给下游。

### B-2 `major` — FR-53 / AC-54 六要素中的「建议」与「unavailable 状态集合」两项在材料中不存在

- 位置：要求侧 `prd.md:364`（FR-53）与 `prd.md:374`（AC-54）："finding schema（严重度、文件/行号锚定、证据、**建议**）…**unavailable 状态集合**…"；材料侧 D-009 L236、D-012 L1273、D-019 L1533、OI-006 L236/L238。
- 缺什么：
  1. **「建议」字段**：D-019 把 schema 定为"以 OCR `LlmComment` 为骨架（`path` / `content` / `start_line` / `end_line` / `category` / `severity`），并按 D-012 补上强制证据字段"——骨架六字段与"强制证据字段"均**不含建议/修复建议**；D-012 的四要素（清单覆盖 / 强制 file:line+证据 / 4 级严重度 / 条数上限）同样不含建议。反证：材料自己在 G-CK（L1517）记录了二进制里确有 `suggestion_code` / `existing_code` 字段，但 D-019 未纳入，也未说明为何舍弃。
  2. **「unavailable 状态集合」**：全材料 `状态集合` 零命中（`grep 状态集合` = 0）。D-005/D-010/D-013/OI-009 给的是"三档路径"的行为，从未枚举状态集合本身；也没有任何 OI 或决定把它指派给某个阶段（对比：超时语义由 D-024 承担、有 TODO 与 owner 指向，L1652）。
- 为什么重要：AC-54 的失败场景逐字为"任一要素缺失或未冻结即接入，即失败"（`prd.md:374`）。这两项缺失使 AC-54 在接入时必然失败，且缺口既未登记为 OI 也未带 owner/完成条件，属"点名但未满足"。

### B-3 `major` — go/no-go 基线与被替换面不同型：基线是**文档方向审查**，实验语料/被替换面是**代码 diff**

- 位置：D-011 L1261（"基线以本次**控制臂实测值**为准（RF-16）：墙钟 444 s、6 次 provider 派发、25 原始 finding / 14 canonical、锚定 25/25"）、OI-004 L193（三指标"不差于 wh-review 实测基线"，基线同 RF-16）、RF-16 L1054（"step 6 方向建议审查"，取材 decision-log.md 59,914 B / 580 行）、L1086–1094、RF-19 L1158–1166（step 10 零派发，4 s / 0 findings）、D-022 L1580（语料 = card-02 回溯臂 + **本卡自身 build-code 阶段**）、D-023 L1631（被替换的 3 面即 3 个真实 diff 面）、需求矩阵 L1786（声明 4 记 `covered`）。
- 缺什么：文档里唯一在盘的控制臂数据是 make-decision **direction 轨**对一份 Markdown 决策材料的审查（59,914 B，file_only prompt 1,688 B）；而 D-022 的实验语料包含本卡 build-code 阶段（代码 diff），被替换的三面在 D-023 之后是真实 diff 面。**没有任何 wh-review 在代码 diff 面上的对照基线**，D-011 却把"不差于 wh-review 基线"的三项阈值写死为上述文档审查数字（findings 有效率 / 锚定准确率 / 耗时都随审查对象类型变化）。材料只在别处处置了"两次运行材料不同"（L1822 追加"对比实验必须冻结同一份材料"，指 step6 vs step10），**未处置"基线与候选臂不同型"**。
- 为什么重要：AC-55 的通过条件是"实验设计含接入阈值…对照规则得出 go 或 no-go"（`prd.md:375`）。基线不同型会让 go/no-go 结论在结构上不可判真假：代码 diff 上的 OCR 耗时/发现数与 Markdown 方向审查的数字不可比。用户声明 4（L1779）问的正是"是不是比本机的 wh-review 的 build-code 和 verify-code 质量更好"，按现设计无法回答。

### B-4 `major` — D-026 已删除的 D-014 第二析取支仍在两处**解析器权威 OI 记录**与 D-011 风险中生效

- 位置（未同步的三处旧副本）：
  - L151 `OI-002` YAML `acceptance:` —— "…OCR 臂须「至少产出 1 条 actionable finding」**或有一份明确、可复核的「本材料确无问题」结论**，否则判 no-go…失败判据=两臂都零 finding 仍判 go（D-011 风险）"；
  - L193 `OI-004` YAML `selected_disposition:` —— "…并追加一条非相对必要条件（D-014）：OCR 臂必须至少产出 1 条 actionable finding，**或有明确、可复核的「本材料确无问题」结论**，否则判 no-go 并保留 fallback"；
  - L1264 D-011 风险 —— "须补一条**非相对的必要条件**：OCR 臂必须至少产出 1 条 actionable finding **或有明确、可复核的"无问题"结论**；否则 go/no-go 判 no-go…"。
- 缺什么：D-026（L1680）已按用户裁决把该支**删除**，并明确"两臂都零发现 ⇒ 判 no-go"；L1308/L1681/2128 均声明原件仅作留证。但上述三处仍把被删分支写成现行判据，且 `OI-002` / `OI-004` 是 `### OI 记录（解析器权威记录，YAML）`（L105–107），属机器读取面。附带后果：`OI-002` 的失败判据"两臂都零 finding 仍判 go"在 D-026 之后已不可达（两臂都零发现已直接判 no-go），该 acceptance 同时失去两个方向的可判真假性（可用已删分支逃逸 + 失败条件不可能触发）。
- 为什么重要：这正是本题第 7 类（不可判真假的验收/成功条件）在原案中已修过一次、却留下了同族副本；且它落在解析器权威记录里，会被下游（build-spec/build-plan）当作现行阈值口径读取。

### B-5 `major` — card-02 侧对 CARD-05 的**入向**义务（适配合同文档审查档的真实缺陷 + 正式 run 路径未验证）在本卡材料中完全没有登记

- 位置：本卡 OI-020 L525/L535–536（只登记"① 本体 + 适配合同的文档审查档已由 card-02 提前完成"，完成条件仅"边界逐项对齐成文"且"措辞不得写成「①已并入 CARD-02」"）、RF-06 L989–994；card-02 归档侧：`decision-log.md:1856`（T-075 未完成项，逐字："①「逐字全文匹配 vs 300KB 输入上限」= **适配合同（文档审查档）的真实缺陷**…②**正式 run 路径未验证**：本次 detail 审查为 **bare/diagnostic sink 路径**结果，**不构成**「正式 run 路径在同一材料下会通过」的证明（正式路径极可能判 `MATERIAL_INCOMPLETE`）。**承接**：①合并审查（适配合同设计）；**不得**据此宣称审查路径可用。"）、card-02 `spec.md:636–641` **OPEN-002**（"CARD-05 审查适配合同增强 … **owner**：CARD-05 … **关闭条件或 STOP**：完整材料在正式 run 中可审查，或产品明确保留稳定 unavailable 边界"）、`spec.md:605–611` **RISK-003**（"适配合同能力增强交 CARD-05 … 处理 Stage：build-spec / build-plan / CARD-05"）。
- 缺什么：本卡材料对 `OPEN-002` / `RISK-003` / `T-075` / `适配合同增强` / `正式 run` / `bare` / `diagnostic` **全部零命中**（逐词 grep 已核）。也就是说：一个**带 owner（CARD-05）与关闭条件**的上游 OPEN 项被整体漏接；本卡对"适配合同的文档审查档"只保留"已由 card-02 完成"的事实登记。
- 为什么重要：spec-analyze Check 第 5 条要求可见的 `DEFER-*`/`OPEN-*` 在 decision-log 侧必须有 owner/trigger/handoff/close 条件；此处是"应接未接"，而不是"已登记后延期"。同时它揭示 RF-06 的"已完成"叙述**掩盖了该交付物自带的未修缺陷**（300KB 上限部分后来被 D-013/OI-025 的"基线已移除"事实覆盖，但"正式 run 路径未验证 / 极可能 MATERIAL_INCOMPLETE"这一半仍然活着，且与 OI-026 的适配合同交付物直接相关）。

### B-6 `major` — 控制臂基线的一项组成（"0 丢弃"）在盘上不存在机器记录；另有若干数字只有叙述

- 位置：L1080（"锚定 **25/25 `evidence_anchor_valid=true`，0 丢弃**…`discarded_facts` 与 `unanchored_finding_dropped` 均空"）→ 被 L1090（"锚定有效 | 25，丢弃 0"）与 D-011 L1261 / OI-004 L193 用作 go/no-go 基线取值。
- 盘上事实：三份 `attempt.json`（66ad856a / 1696ecbc / c465624d）**都不存在** `discarded_facts` 或 `unanchored_finding_dropped` 键；`/tmp/wh-card05-forensics/step10-detail-report.md:236` 自己写明"`discarded_facts` | **键不存在**（step 6 的两条 attempt 同样无此键；step 6 报告记的 `null` 系该字段缺省的读法）"。即"0 丢弃"是从字段缺失推断出来的叙述，不是机器记录。（`25/25 evidence_anchor_valid=true` 本身已由盘上 5 份 provider output 验证为真。）
- 同族（次要，一并列出以便一次修完，不单列 gap）：
  - `exit=0`（L1063）/`PIPESTATUS[0]=0`（L1139）：审查记录里**没有 exit code 字段**，唯一来源是会话自写的 `step6-timestamps.txt` / `step10-timestamps.txt`；"stderr 空"（L1063）无 stderr 捕获件（`*.err` 不存在），仅 step6 报告散文。
  - "token 完全不可得（`usage=null` **三层一致**）"（L1092/L1166）：实测为 attempt.json 6/6 `null` + broker state.json 6× `null` + provider output **无该键**（absent），非"三层一致 null"。
  - "整包 39,766 B"（L1093）：= 三份材料 + review-instructions.md 之和，未含 `manifest.json`(739 B) 与 `managed-request.json`(1,039 B)。
  - 盲审脱敏"9 处"（L1065）：`build-facts.json.blind_sanitisation` = 9 条，而 `/tmp/wh-card05-forensics/sanitisation-log.json` = **7** 条，两份台账不一致。
- 为什么重要：这些数字进入了 go/no-go 基线与"对比实验语料"的成立条件（AC-22 度量要求"发现数、失败边界、耗时**事实**"）。"0 丢弃"被当作基线指标却无记录，属于以叙述充当事实。

### B-7 `minor` — 自声明的主输入 SD-16（过渡基线）在正文中从未处置，且该术语被误用一次

- 位置：L25（主输入列出 `SD-16 过渡基线`）；正文对 SD-16 内容的唯一命中是 L1877（"该本地字节上限已由**过渡基线**删除"——此处"过渡基线"被用来指被删的字节上限常量，与 SD-16 的定义"本规划任务期间未提交的 `runtime/review/*`、`skills/wh-review/*` 修复代码"不是同一所指）；`grep 过渡基线` 在材料中仅此两处。SD-16 原文（`prd.md:90`）要求这些未提交修复"CARD-05/06 新路径就位后按迁移表（CARD-06 FR-51）转为只读历史或删除，不静默留存"。
- 缺什么：D-021"本卡不修项与归属卡"表（L1565–1573）列了身份/哈希机制移除与 wh-review 物理删除归 CARD-06，但没有 SD-16 过渡基线的处置或引用；材料既未声明由 CARD-05 与本卡相关，也未声明完全归 CARD-06。
- 为什么重要：这是本卡自己写进"主输入"的共享定义，属"点名但未落地"；且 L1877 的误用会让下游把"过渡基线"读成体积上限。

### B-8 `minor` — 多轮编辑留下的状态/计数残留（清单，逐条附行号）

1. L112："**30 条既有 OI** 已…给出终局处置（**20 条 `confirmed` / 11 条 `deferred`**，其中含 OI-025），并新增 OI-031" —— 20+11=31≠30；与 L1843"31 条 OI 记录：20 confirmed / 11 deferred" 冲突（实际 YAML 计数：20 confirmed / 11 deferred / 0 open，31 条，与 L1843 一致）。
2. L770 标题："### 2026-09-22 用户当面追加（本卡开工，**尚待 Talk 确认**）" —— Talk round 1–3 已全部发生并登记（L807/L1176/L1292），六条声明已在需求矩阵逐条处置。
3. L803："**待澄清**：`委托模式`…本卡已按 RF-01 一手验证的一手证据登记，**术语澄清完成**" —— 标签与同句结论自相矛盾。
4. L824–826：R-Q1-a/b/c 状态列全写"**调研中**"，而 L898 节标题为"调研事实（step 4，**R-Q1 结案**）"，RF-02/RF-03/RF-04（L915/L961/L972）与 RF-15（L1455）已给出结论。
5. L1266：D-011 状态"confirmed（相对形式）；**判别力补充条件待 Talk round 3 确认**" —— Talk round 3 已发生（L1296 T-013）且 D-014 已作出、后经 D-026 收窄。
6. L1813：未决项处置仍写"OI-030（实验判定维度；**其缺口使 D-014 第二析取支不可判真假，见 CF-4**）" —— CF-4 已由 D-026 RESOLVED（L1988、L2029）。
7. L1902：写"`analyzeDecisionOutline` 要求每条 OI 记录被至少一个框架节点**与**一个固定类别引用" —— 代码事实是 **OR**（`runtime/stage/stage-content-contracts.mjs:3093`：`const referenced = new Set([...frameworkMap.values(), ...categoryMap.values()]…)`；:3095 报错文案亦为"or"）。材料据此把 OI-031 追加进框架节点行，属无必要的判断性映射（人读面无害，但该字段说明本身与机器契约不符）。
8. L1788/L1794：声明 6 与 D-106 记 `covered`，落点写"收敛检查 solution 行列**为执行约束**"；材料自己在 OI-028 impact（L703）承认"该「执行约束」措辞本身在 `## 收敛检查` solution 行正文中未出现（材料内部不一致，两处原文均保留未改）"。
9. RF 编号缺 `RF-18`：L1102（RF-17）直接跳到 L1130（RF-19），`grep RF-18` 零命中；材料未说明该编号去向。18 条替代审查报告因此不在 RF 序列中，只能从 L1984/L2090 到达。

---

## (C) 需求覆盖核验表（要求 → 材料位置 → 是否真正满足）

| 要求 | 材料位置 | 实际满足？ |
|---|---|---|
| FR-22 替换前完成对比实验 + fallback 合同 | D-022 L1575–1584；D-011/D-014；RF-16 L1054 | **partial**：语料/阈值/fallback 定了，实验报告本身属 build-code（可延期）；但基线与候选臂不同型 → B-3 |
| FR-23 审查节奏按 SD-07 完整序列（含①） | D-006 L1188–1200；D-018 L1354–1366；收敛检查 L1802–1803 | **partial**：① 归 card-02 且无核验动作 → CF-9/B-1 |
| FR-24 单次成功不复审、无 severity 门槛 | D-003 L856–865；OI-011 L342–344 | **yes**（含取证 s1 复审浪费事实） |
| FR-25 unavailable → 一次独立替代审查 → unverified 披露 | D-005 L879–889；D-010 L1236–1246；OI-009 L299–301；L1736 被否方案 | **yes**（且 2026-09-22 本卡自己真实走了一次替代审查，18 条 finding） |
| FR-26 接入前能力与覆盖验证，不采信厂商数字 | RF-01 L900–913；RF-02 L915–957；RF-05 L978–987；RF-15 L1455–1502；D-004 L867–877；D-009 | **yes** |
| FR-53 适配合同六要素接入前冻结 | D-002（输入形态）、D-019（schema）、D-020（写入位置）、D-024（超时，成文 TODO 有 owner）；无「建议」字段、无「unavailable 状态集合」 | **partial** → B-2 |
| FR-54 go/no-go 规则与 no-go 处置 | D-011 L1261–1266；D-014 L1307–1314；D-026 L1675–1686；OI-004 L186–196 | **partial**：规则形式与 no-go 处置齐，阈值数值可留实验设计（有 owner）；基线取值不同型 → B-3 |
| FR-56 build-plan 一次合并审查（本卡执行） | RF-06 L989–994；D-006 L1196；OI-020 L525；CF-9 L2075 | **no（卡内）**：判 `covered` 仅凭 card-02 自述，核验动作未登记（CF-9 未决） |
| FR-57 派发/输入不依赖身份/哈希/快照/回执 | D-013 L1279–1290；D-017 L1338–1352；D-020 L1540–1549；OI-031 L748–766；收敛检查 L1805/L1821 | **yes**（设计层；现存违规已记 P14/OI-031，且明确"缺陷现存≠已修"） |
| AC-22 对比实验报告含真实任务/发现数/失败边界/耗时/fallback 结论 | D-022；RF-16；L1821 | **yes（设计层）**，报告属 build-code |
| AC-23 节奏点核对（含①、终末审查独立记录） | L1802、L1821；D-006 L1195 | **partial**（① 部分同 FR-56） |
| AC-24 同 scope 无复审 + 修复有记录 | D-003 L861–864；OI-011 L342 | **yes** |
| AC-25 不可用路径演练 + 来源/缺口记录 | D-005/D-010/OI-009；18 条替代审查（L1984、L2090–2117） | **yes**（但替代审查原件只在 `/tmp`，见 B-6 同族/局限） |
| AC-26 全部节奏点真实执行记录 | L1821；D-006 | **partial**：属 build-code 交付，未产出；有归属但无逐点 owner/命令清单 |
| AC-54 适配合同六要素齐备且晚于冻结 | D-002/D-019/D-020/D-024 | **partial** → B-2 |
| AC-55 实验设计含三阈值 + no-go 处置 | D-011/D-014/D-026；OI-004/OI-030 | **partial** → B-3 |
| AC-57 合并审查恰好一次、时机正确、两类质量核心齐备 | L1803（把 AC-57 写成**本卡**通过条件）；CF-9 | **no/partial**：本卡不执行 ①，却把它列入自己的验收通过条件且无核验动作 |
| AC-58 派发无身份/哈希/快照/回执前置 | D-013；D-017；OI-031 L762–765；L1821 | **yes** |
| SD-05 真实入口联通 / 代码审查≠功能验收 | L1715（终末代码审查独立事实，不与功能验收共用记录）；L1805/L1821 失败条件 | **yes**（实质落点；SD-05 未列入本卡主输入，但 CARD-05 最小读取集也未要求） |
| SD-07 审查节奏统一表述 | D-006/D-018/L1715；RF-08 M2 L1013（上游 OI-005 三点 vs SD-07 四点，已按 SD-07 采信） | **yes** |
| SD-08 独立替代审查 | D-005 L884；D-010；OI-009；L1736；18 条替代审查 | **yes** |
| SD-15 质量事实≠推进许可证 | D-013 L1284–1289；D-017 L1343；RF-19 证据限制 L1172；OI-025 校正 L639 | **yes** |
| SD-16 过渡基线处置 | 仅 L25（主输入）与 L1877（误用） | **no** → B-7 |
| SD-17 两道人为门与零机器门禁 | D-013/D-020/OI-031/AC-58；L1721"明确不动" | **yes** |

**合计 24 条：yes 13 / partial 8 / no 3。**（另有 FR-56、AC-57 两条同源，均因 ① 的核验缺口判 no。）

---

## (D) 控制臂证据核验表（claim → 盘上证据 → 是否证实）

| 声明（行号） | 盘上证据 | 结论 |
|---|---|---|
| "三次控制臂运行"（题面表述；材料 L1054/L1130/L1984） | 材料只把 RF-16、RF-19 标为"控制臂实测（语料 #0/#1）"；18 条那份被标为"独立替代审查（SD-08 fallback）" | **表述需更正**：2 次控制臂 + 1 次独立替代审查；材料本身未错 |
| step 6 = attempt `66ad856a` red `semantic`/`dispatched`/无 error/有 result（L1071） | `attempts/66ad856a…/attempt.json`：`role:"red"`、`terminal_status:"semantic"`、`dispatch_state:"dispatched"`、`error:null`、`result_ref` 存在 | **VERIFIED** |
| step 6 blue `1696ecbc` `unavailable`/`dispatched`/`REVIEW_QUORUM_INCOMPLETE`/`result_ref=null`（L1072） | 同目录 attempt.json：`terminal_status:"unavailable"`、`error.code:"REVIEW_QUORUM_INCOMPLETE"`、无 `result_ref` 键 | **VERIFIED**（"=null"应为"键不存在"） |
| 6 次 provider 调用与逐条耗时（L1074：221381/111378/432004；2859 RATE_LIMITED/220335/409974） | 两份 attempt.json 的 `provider_attempts[].execution.timing.duration_ms` 与 `error.code` **逐字相同**；blue kimi stderr 403 concurrent limit 在 `/tmp/3rd-review/1a484a17…/` 内 | **VERIFIED（逐字节）** |
| 25 原始 / 14 canonical（blocking 2 / major 11 / minor 1）/ blue 11 条被丢（codex 7 + antigravity 4）（L1078–1079） | 5 份 provider output：7+4+6+5+3 = **25**；`results/…66ad856a….json` `findings` = **14**，severity = `{major:11, minor:1, blocking:2}`；canonical `provider_results` 仅含 red 三家（5/6/3） | **VERIFIED（精确）** |
| 锚定 25/25 `evidence_anchor_valid=true`，0 丢弃（L1080） | 5 份 provider output 的 `evidence_anchor_valid` 数组长度 7/4/6/5/3，**全部 true** | **前半 VERIFIED**；"0 丢弃 / discarded_facts 与 unanchored_finding_dropped 均空" **NOT VERIFIED**（三个键在 attempt.json 中均不存在，step10 报告自认） → B-6 |
| 墙钟 444 s、`exit=0`、stderr 空（L1063） | `step6-timestamps.txt`：01:03:43→01:11:07、`EXIT=0`、`WALL_SECONDS=444`（会话自写）；provider epoch 时间戳 01:03:51→01:11:03 与之相容 | 窗口/墙钟 **VERIFIED**；`exit=0`、`stderr 空` **无运行件** → B-6 |
| 冻结指纹 sha256 `630618aa…`（59,914 B）（L1064） | `/tmp/wh-card05-forensics/decision-log.snapshot.md` = 59,914 B / 580 行，`shasum -a 256` = `630618aae183…` | **VERIFIED（逐字节）**；"运行后未再变"无复核件 |
| pair 终态 `recorded` / `semantic_status=available` / `partial=true`（L1088） | `/tmp/wh-card05-forensics/step6-direction-run.log` 同字段；`reports/…43261452….md`（1,097 B）原样记录 red `satisfied` / blue `incomplete` | **VERIFIED** |
| 字节代理量 39,766 / 42,962 / 1,688（L1093） | 42,962 = codex embed `review-input.md` 实际字节；1,688 = broker `state.json.last_prompt_bytes`；39,766 = 三材料+instructions 之和 | **数值 VERIFIED**；"整包"标签不准（漏 manifest 739 B + request 1,039 B） → B-6 同族 |
| provider 进程时间合计 1,397,931 ms、并行度 ≈3.15×（L1094） | 764,763 + 633,168 = 1,397,931；/444,000 = 3.148 | **VERIFIED（算术）** |
| blue 10.5 分钟真实算力产出 11 条被整体丢弃（L1096） | 220.335 s + 409.974 s = 10.505 min；11 条与无 result_ref 均已核 | **VERIFIED** |
| step 10 = attempt `c465624d`，`unavailable` / `blocked_before_dispatch` / `provider_attempts=[]` / `REVIEW_HISTORY_UNAVAILABLE` 及 error.message（L1148–1153） | `attempts/c465624d…/attempt.json` **逐字段相同**（含 message 全文），无 `providers/` 目录，无 pair report；`/tmp/3rd-review/` 内无该 id 的运行目录 | **VERIFIED（逐字段）** |
| step 10 请求体 174,204 B / sha `f0ebe291…` / `review_track=detail` / `host_provider=dsh`（L1140） | `detail-request-input.json` = 174,204 B，sha256 前缀 `f0ebe291…`；`.request.review_track="detail"`、`.host_provider="dsh"` | **VERIFIED（逐字节）** |
| detail 契约 `forbidden=[]`（逐字空数组）（L1141） | `runtime/review/stage-materials.json` → `make-decision.tracks.detail.forbidden=[]`；direction 为 6 键 | **VERIFIED** |
| 取材 decision-log sha `78e6cb38…`（96,976 B / 934 行）（L1142） | 从请求体取 `.request.materials.approved_direction`：96,976 B、sha256 `78e6cb38c313…`、换行数 934 | **VERIFIED（逐字节）** |
| step 10 报告 1,288 B（L1154） | `reports/…c465624d….md` = 1,288 B | **VERIFIED** |
| 18 条替代审查（high 7 / medium 10 / low 1）（L1984） | `/tmp/wh-card05-forensics/substitute-detail-review.md`（41,069 B / 255 行）：`### H1..H7`（7 high）、`### M1..M10`（10 medium）、`### L1`（1 low）= **18**；材料处置表 L2094–2113 恰 18 行；统计 L2115 = 10 fixed(含 L1)+2 fixed+registered+6 registered = 18 | **VERIFIED**（但该文件**不在任务 `quality/reviews/` 树内**：无 attempt / result / report，见 G 局限） |
| 替代审查所审材料 | 该报告自述"1871 行 / 207,573 B"，对应替代审查时的**修复前**版本；当前材料 2128 行 / 288,183 B | **口径需注意**：CF 与处置表基于修复前 revision，修复后未再复审（材料未声明这一点） |
| 步骤 11 最终确认存在 | `quality/confirmations/2285ef23….json`：`step_slug="approve-decision"`、`decision="accepted"`、`reply_text="确认，推进"`、`confirmed_at 2026-09-21T23:35:39.685Z`；其 `material_revision-8db0d039…` 与 coverage fact 同绑定，且 coverage audit 的 `decision_log_hash=09fbfbc0…` = 当前材料 sha | **VERIFIED**（确认绑定当前字节；但确认文本不点名 CF-6–CF-9 → B-1） |
| 覆盖事实（机器） | `quality/facts/dc158bf0….json`：`kind="coverage"`、`status="incomplete"`；`quality/evidence/coverage-audits/d2d3c149….json`：`items: []`、`covered/accepted_omission/missing` 全 0、`failures[0].code="source_inventory_unavailable"` | **VERIFIED**：认证覆盖投影为**空且 incomplete**；材料的需求矩阵是自建表，未获认证投影背书（按 spec-analyze：缺输入记 `material_incomplete`，不作为语义 finding） |
| `analyzeDecisionOutline ok=true`（`cf-fold-parser-after.json`，07:28） | 代码核对：框架节点与固定类别是 **OR** 关系（`stage-content-contracts.mjs:3093-3095`），31 条 OI 已在固定类别全覆盖 | **VERIFIED**：解析器四组件全 passed；但 `analyzeDecisionConvergence` 的 `requirement_coverage/plain_language_card` 在**未提供认证 requirement messages 时是结构性壳检查**（同文件 L3345–3351、L3448–3451：只要求存在覆盖节、≥2 行、含处置列且处置词合法），**不能读作语义覆盖已核** |

---

## (E) 多轮编辑残留的一致性问题（汇总）

1. **被删分支的三处旧副本**（B-4）：L151、L193（解析器权威 YAML）+ L1264（D-011 风险）——最重的一条残留。
2. **计数不一致**：L112（30 条既有 / 20+11）vs L1843（31 条 / 20+11）。
3. **过期状态标签**：L770"尚待 Talk 确认"、L803"待澄清"（同句已写"澄清完成"）、L824–826 R-Q1"调研中"（对 L898"R-Q1 结案"）、L1266 D-011"待 Talk round 3 确认"。
4. **已闭合却仍按未决引用**：L1813 引 CF-4（已 RESOLVED by D-026）。
5. **自相矛盾的 covered 依据**：L1788/L1794（声明 6 / D-106 的"收敛检查 solution 行列执行约束"），材料自己在 L703 承认该措辞不存在。
6. **解析器契约描述错误**：L1902"框架节点**与**固定类别"（代码为 OR）。
7. **编号断档**：无 RF-18（L1102→L1130），且 18 条替代审查未纳入 RF 序列。
8. **两份脱敏台账数量不一致**：9（`build-facts.json`）vs 7（`sanitisation-log.json`）。
9. **未同步声明**：L1783（声明 1 `covered`）与 L1198（D-006 风险"声明 1/2 不完整满足"）并存——材料已按"时序差异"披露（L1199、M4 处置 L1783），此条**不算未披露缺陷**，仅登记为需与下游说明的时序事实。

（未发现其他类别：18 条 finding 处置表、CF-1..CF-9、P1–P14、11 条 deferred OI 的终局字段均完整——见下。）

---

## (F) 总体判断

**不能按现状离开 make-decision。** 材料在"证据真实性"上表现突出（RF-16/RF-19 的每一个可核数字都逐字节对得上盘上记录，替代审查 18 条的严重度分布与处置统计全部可复核），但在"语义完整性"上有 1 条 blocking + 5 条 major：

- 必须**先修的（blocking）**：CF-6–CF-9。要么由用户逐条裁决并写入材料（含裁决后的登记落点），要么由用户明确"接受为携带风险"并给每条补 owner / trigger / close 条件；当前仅有通用"确认，推进"，而材料自己写着"必须由用户裁决后才能进 build-spec"（L1814–1815）。其中 CF-7、CF-8、CF-9 各自会改变决定正文，不能靠 build-spec 自行吸收。
- 必须**先修的（major）**：
  1. 同步 D-026 删除结果到 L151、L193、L1264（并把 OI-002 已不可达的失败判据改写为可判真假形式）；
  2. 补齐或以"owner+trigger+close 条件"显式延期 FR-53/AC-54 的「建议」字段与「unavailable 状态集合」；
  3. 修 go/no-go 基线不同型问题（要么以同一 diff 面/同一语料重测 wh-review 基线，要么收窄实验面并登记被替换代码面的后果）；
  4. 接住 card-02 的入向义务（`spec.md` OPEN-002 / RISK-003 / `decision-log.md:1856` T-075），登记为 OI 并给 owner 与关闭条件（含 CF-9 要求的"① 交付物核验动作"）；
  5. 把"0 丢弃"等无机器记录的基线数字从基线取值中移除或在材料中标注为推断，并修正 `exit/stderr/usage 三层/整包字节/脱敏 9-7` 等叙述性数字。
- minor（B-7、B-8 共 9 条）可在同一轮修复中一并改掉，不单独阻断。
- 本步骤自身还有一个**必须履行的义务**：D-006 风险承诺的"阶段末遗漏披露"（L2086 自认"尚未兑现"）应落在本 step 的六段大白话摘要里（`remaining_risks` / `next_stage_boundary` 两段必须写出：声明 2 为 accepted_omission、7 个文档面只做问题修复不换工具、① 由 card-02 承接且核验动作未定、CF-6–CF-9 未决）。

---

## (G) 我自己的局限（如实）

1. **未运行任何解析器/测试**（只读分析，且已声明不修改文件）。材料"唯一未通过项=no_open_items"的**历史**判断我未复跑；我只读了事后解析结果文件 `cf-fold-parser-{before,after}.json`（07:20/07:28，`ok=true`、四组件 passed）并核对了对应代码路径。
2. **未复核 s1–s4 四份会话原始证据**（13.4 亿 token、`unavailable`×33、455,671B/486,777B、121 分钟返工等）。这些原始记录不在仓内、也未被我在盘上定位到，故我对这些数字**不置可否**；它们支撑的是 OI-001/OI-002/取证总账，不影响 (B) 中各 gap 的成立（那些 gap 我都用了可复核的位置）。
3. **未复跑 OCR 二进制**（RF-01/RF-02/RF-10/RF-15 的 `ocr` 命令输出）。我只核对了这些节之间的口径一致性（"finding schema 脚手架"旧措辞的三处更正、`too_large` 归属、"全仓 grep 零命中"的作用域更正），未验证 OCR 行为本身。
4. **未核 card-02 材料自身的质量**（只核它登记了什么、以及它对 CARD-05 的入向义务）。因此 B-5 只主张"本卡漏接 OPEN-002/RISK-003"，不主张 card-02 的交付物是否真的合格。
5. **"建议"字段缺失（B-2）是对 AC-54 字面的判读**：若下游把 `content` 视为"含建议的说明文本"，该要素可被解释为部分满足；但材料无任何一处作出该解释或把建议列为必需字段，故按"点名但未落地"报告。
6. **基线不同型（B-3）是结构性判断**：我核到 D-011 的基线数字全部来自 RF-16 的 direction（文档）审查，且盘上不存在任何 wh-review 在代码 diff 面上的对照记录；但我无法排除 build-plan 阶段会另测一套代码面基线——材料并未这样写，故按现状报告。
7. **工具与作用域**：`~/Knowledge/Projects/...` 与 `/tmp/3rd-review/`、`/tmp/wh-card05-forensics/` 的可读性来自本次会话的文件权限；若这些临时路径被清理，B-6 同族与 D 表中"替代审查原件不在任务证据树"的结论会更强（原件更不可得）。

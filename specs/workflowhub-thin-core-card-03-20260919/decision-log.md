# decision-log — workflowhub-thin-core-card-03-20260919

## 任务身份

| 项 | 值 |
| --- | --- |
| 任务 ID | workflowhub-thin-core-card-03-20260919 |
| 项目 | workflowhub |
| 阶段 | make-decision（step 8 决策草稿已写、step 9 复核收口、step 10 用户已批准 2026-09-28；step 11–13 待执行） |
| Worktree | `/Users/Hugh/Hugh/Project/workflowhub-workflowhub-thin-core-card-03-20260919` |
| cohort | `post`（make-decision → build-plan → build-code → verify-code，**无 build-spec**） |
| 激活来源 | 母任务 PRD `specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md:293-320`（CARD-03 卡面） |
| 任务类型 | 普通任务 |
| 任务类型确认状态 | 已确认（T-001=A；用户本批逐字回复「A A A」，见 `## 本卡问答记录（T 表）`） |

任务类型判据（**已确认**；依据＝T-001=A，逐字回复见 `## 本卡问答记录（T 表）`）：母任务 PRD `specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md:320` 写明「以本卡创建独立实施 task」，本卡要落地的是五阶段统一的子代理派发方法、主会话职责边界与并行规则产出这类**实施面**交付，必然要讨论方法落点文件、声明字段形态与验收记录，故登记为 `普通任务`；母任务已按规划任务完成收敛（同 PRD），本卡是它拆出的下游实施卡。用户已在本轮第一批真实 Talk 中以 T-001 明确选择 A（本批逐字回复「A A A」，见 `## 本卡问答记录（T 表）`），故本声明为**已确认**，不再是待审状态；若用户后续改判为 `规划任务`，本卡问题面须按 `workflows/make-decision/SKILL.md:25-41` 的方向级问题面（禁用文件路径、函数名、字段名、算法、schema 形状、命令形态、入口参数形态、行号、代码片段、测试记录与实测记录）重做，且已产出的普通任务产物须逐条显式重新处置。

严格声明只有上表一条：`runtime/stage/stage-content-contracts.mjs:3150` 的 `readTaskTypeFromDecisionLog` 在 `## 任务身份` 节内只接受一条 `任务类型` 表格行或 `- **任务类型**：…` 项目符号，缺失、重复、冲突或非受控取值一律返回 `unknown`。

## 状态

- **当前进度（2026-09-28）**：step 1–7 已完成；step 8 决策草稿见 `## 决定`；step 9 detail-advice 已走**正式 wh-review 通道**完成（pair 927723e5；红 attempt 18523acf、蓝 attempt edec1d10；红 3 发现、蓝 5 发现，结果与报告落 Knowledge 任务根 `quality/reviews/`；另有一轮非正式子代理复核 4 P1＋7 P2 已全部修复）。**step 4 方向审查未走正式通道，登记为执行偏差，不回头补**。**step 10 已批准（2026-09-28，用户逐字「确认，继续吧」；confirmation `quality/confirmations/673f40451df408f8e6940243246c2d253974c11e3ed13b0d0b775c9b2200ce76.json`＋confirmation/coverage 两条 quality fact 已落 Knowledge 任务根）**。step 11 stage-end-spec-analyze 已完成（透镜 **consistent**、收敛七维全 passed；唯一修复＝12.7 二十条 R 需求显式延期登记，纯记账；事实 `quality/facts/786c1f41a927e9f6cfc0eac14502743007f14a4b2aa9bfb24b6bc9c75f6aca28.json`＋证据 `quality/evidence/coverage-audits/`）。step 12 publish-decision＝向用户发布大白话 handoff（方向／原因／风险／延期／下游边界，见收尾汇报）。step 13 stage-reflection 已落 `quality/stage-reflection/make-decision/52fbe536026e581d71792a922aa9da436c16eecdc12174b7ffcec4d4be59c273.json`（三条判断＋一条用户干预）。**make-decision 十三步全部完成（2026-09-28）**。阶段完成后用户又追加三条指令/裁决，全部登记并落地：①§五 三条未提问待裁决事实当面问清（2026-09-28）——Q2＝决定优先（OI-009 胜，防抄送登记），Q3＝禁令维持（index 不加状态列），Q1＝用户新指令「调研 plan/tasks 模板与 phase 模板差距并修改，让执行者对照干活」（⇒ 模板二次修订 195→217 行，设计书 §14.15）；②用户问「build-plan 审查细节需不需要优化，避免 spec/phase 大量遗漏无人知晓」⇒ 用户选 A：审查技能加第 9 条「遗漏类扫描」（九类逐类过堂＋需求逐条对账总闸），54→83 行，设计书 §14.16。两处落盘均经测试复验（0 新增红）＋相关 bundle 哈希重算。③第三组（2026-09-28）：用户就「card-04 会话审查耗时是否被法证遗漏」发问——实读 card-04 `quality/reviews/` 23 次 attempt：审查墙钟 2.88h＞全会话 exec 1.76h、43% 空 attempt、坏结果被照收、8 次 build-code 审查全部 ocr-host（OCR 机制合规）；用户裁决＝登记＋**详细设计方案**（design.md §14.17：非阻塞化／派发预检／结果校验／包绑写集／分级消费五项措施＋预算研究项〔用户质疑硬切浪费、降级为研究〕，写面登记为下游推迟＝施工表行 70）。④第四组（2026-09-28）：用户指令「能否先完成当前任务的make-decision，方便我后续先进行build-plan。等card-04合并进来后，再看看当前任务的decision、spec和phase有没有需要更新的地方」⇒ **make-decision 正式收工确认**（十三步＋四组追加全部落盘、追加后透镜/阅读器/契约复验全绿）＋**时序更新**：build-plan 不再等 CARD-04 合并、先行开跑；合并后回头核对 decision/spec/phase（登记在补充登记 §十四）。下方逐条为各轮历史记录，与本条不一致时以本条为准。

- **本轮范围**：仍是 step 1（load-context），**不进入下一阶段**——任务身份落盘、原始需求登记、范围与非目标、唯一 OI 大纲、本任务 OI records、收敛检查与 UI applicability；已吸收六批真实 Talk 的答复：第一批（T-001/T-002/T-003）逐字「A A A」，第二批（T-004/T-005/T-006）逐字「A、B、A」，第三批（T-007/T-008/T-009）逐字「A A A」，第四批（T-010/T-011/T-012）逐字「A A A」，第五批（T-013）用户自定义答复，第六批（T-014/T-015）逐字「A」「A」。本轮另做一次**形态对齐**：两张 OI 大纲表补上官方作者模板要求的拉丁关键字列（`skills/decision-log/templates/decision-log-template.md:47-67`），OI 记录改包进 yaml 围栏块（同模板 `:69-91`），并把原先另列一份的终态字段并入该块（见 `## OI records`）。**用户已明确本卡当前只做 make-decision**（T-013 自定义答复逐字：「本卡先进行make-decision，后续build-plan会等到card-04交付合并进来后再进行」），故本卡在 make-decision 阶段**不实际改任何 `workflows/*/SKILL.md`**，只产出接口/方法面的冻结候选与计划。本轮（step 8 write-decision-draft）另做三件事：登记十问十答 T-016…T-025、按交办口径修补三处材料缺陷（`## 原始需求` 处置列取值改为 reader 合法取值、新增文末大白话结束卡三节、写面声明更新）、并逐条登记红队 finding 与未提问的待裁决事实；详见 `## 补充登记`。
- **已取得的真实用户答复**：第一批三条问答（T-001…T-003）用户逐字回复「A A A」，三问均选 A——T-001 任务类型登记＝`普通任务`（故本卡可就实现细节追问）；T-002 验收载体＝以 card-03 自身执行事实为主证据、G-1 用演练记录、build-prd 记「明确不适用理由」，取证只采事实、判定必须来自独立上下文；T-003 build-prd 在本路线不跑的处置＝记「明确不适用理由」，`workflows/build-prd/SKILL.md` 方法章节照样改到位，派发实例证据由后续 pre 路线任务承担。第二批三条问答（T-004…T-006）用户逐字回复「A、B、A」——T-004＝单一进度权威是 `facts.jsonl` 的 `phase_progress` 游标（phase 文件只读、只声明指针，不复制状态值）；T-005＝本卡内顺手做证据绑定最小机制修补（绑定口径＝该 phase 声明的写集，落 `docs/standard-workflow.md:334-338` 的 step 11 与对应 steps 定义文件）；T-006＝三条执行卫生规则写进 `AGENTS.md` 通用工作纪律段一处权威、五阶段 `SKILL.md` 各引用一次。第三批三条问答（T-007…T-009）用户逐字回复「A A A」——T-007＝本卡范围**包含**「派发机制浪费」的治理：在 `AGENTS.md` 补一条**通用委派纪律**，并补齐四个阶段技能里缺失的「子代理产出契约」（先落盘、只回摘要、按子问题增量）；T-008＝phase 文件模板的载体＝**扩展现有** `skills/spec-plan/templates/phase-template.md`（该文件已被 3 个契约测试引用）、把新字段槽位加进去以保持单一权威（风险方向本轮已更正：该模板的契约测试断言全为子串包含式、纯新增字段不红，真实硬失败路径是 skill bundle 哈希链——见 `:50`、`:206` 与 `## 补充登记` 第七节）；T-009＝本卡自身验收的取证方式＝**事后人工判读一次**（把主会话本次真实做过的动作列成清单，逐条标「派发/回收/交互」还是「批量读写」），**零新增机制**。第四批三条问答（T-010…T-012）用户逐字回复「A A A」——T-010＝snapshot 绑定的机制修补**继续做**，但口径改为「**删掉跨 phase 的全量快照绑定**、只留该 phase 自己声明的写集」，并登记为「**减少机器门禁**」以对齐 SD-17 与母任务 OI-012；T-011＝SD-11 五件套**按外部一手证据收敛落地形态、不改需求字面**，五条各自以**事实记录**形态落地；T-012＝FR-12「连续上下文」的判据＝**回到同一个子代理会话**（允许中途被上下文压缩过），且派发时**必须附上审查/测试发现的原文**。第五批（T-013）为用户自定义答复，逐字原文见 T 表。第六批两条问答（T-014/T-015）用户逐字回复「A」「A」——T-014＝G-1 收场的落点＝`workflows/build-plan/SKILL.md` 与 `workflows/build-code/SKILL.md` **两处各写各的角色 + 一处交叉引用**（现仓 `grep "G-1" workflows/ docs/ runtime/` 零命中）；T-015＝并发上限口径＝**不写死数字**，把 SD-11 的「2–5」当区间约束写进五阶段共用纪律，每个任务开几个并发在 build-plan 的并行方案里**逐任务定**，并把 `workflows/make-decision/SKILL.md:357` 现有的「研究 4 / debate 4 / 红蓝 2」与区间对齐。全部逐字记录见 `## 本卡问答记录（T 表）`。
- **回复引用字段**：宿主未提供任何回复引用字段或哈希（六批答复均是直接给出用户回复原文）；本表与 T 表均**不补造**此类字段、不写任何哈希（纪律：不编造字段）。
- **已收敛**：本卡自己的 OI 清单（OI-001…OI-011）**已全部收敛为 `status: confirmed`**。前两批落定七条：OI-001（T-003=A）、OI-005（T-002=A，本轮 T-014=A 补落点）、OI-006（T-003=A）、OI-007（T-002=A）、OI-009（T-004=A，本轮 T-008=A 补载体）、OI-010（T-005=B，本轮 T-010=A 细化口径为「删除跨 phase 全量快照绑定」）、OI-011（T-006=A，本轮 T-007=A 扩写委派纪律）。**本轮新收敛四条**：OI-002（T-012=A，连续上下文判据）、OI-003（T-009=A，主会话「大量读写」的取证方式）、OI-004（T-011=A + T-015=A + T-008=A，并行方案与工作包声明的内容、载体与并发口径）、OI-008（T-013 自定义答复，与 CARD-04 的写面时序＝时间错开）。
- **仍为 `open`**：无。本卡 OI-001…OI-011 全部 confirmed；**未决项与 OI 清单无关**，只有两条：①`## 收敛检查` 的四维表已全部有内容（登记形态与该表逐字一致）——**目标**维度登记为 `无新需求` + 引用（本卡 `## 原始需求` R-001…R-020、`## 本卡问答记录（T 表）` T-001…T-015，以及只读母材料 `specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md:293-320`），**方案**维度已按 T-007/T-008/T-010/T-011/T-012/T-013/T-014/T-015 逐条登记方案级答复（取舍、被拒方案与未决项处置齐备，记在该行「用户答案」单元格内）；本行仍**不得代答、不得挪用母任务的答复**；②T-013/T-014/T-015 附带登记的外部事实（CARD-04 写面与硬碰撞、G-1 现仓零命中、3 个引用 phase-template 的契约测试待改（风险方向本轮已更正：真实硬失败路径是 skill bundle 哈希链，见 `## 补充登记` 第七节））。本轮补充：另有三条**未提问**的待裁决事实（phase 模板字段清单未定、card-04 审计骨架 `status` 与 OI-009 counterexample 冲突、`phases/index.md` 两列建议未裁决）——**不是本卡的 OI**，本卡不代答，如实登记在 `## 补充登记` 第五节。
- **已执行（发散 divergence 与调研 research）**：四份 Codex 会话审计（`/tmp/wh-card03-session-analysis/s0921a.md`、`/tmp/wh-card03-session-analysis/s0922a.md`、`/tmp/wh-card03-session-analysis/s0922b.md` 等）、外部一手调研（`/tmp/wh-card03-session-analysis/research-external-orchestration.md`）、子代理产出契约缺口调研（`/tmp/wh-card03-session-analysis/research-subagent-contract.md`）、实现侧缺口盘点（`/tmp/wh-card03-session-analysis/card03-baseline-gap.md`）、CARD-04 材料质量审计与写面碰撞核实（`/tmp/wh-card03-session-analysis/card04-plan-quality.md`、`/tmp/wh-card03-session-analysis/card04-writeface-collision.md`）、decision-log reader 一致性复验（`/tmp/wh-card03-session-analysis/decisionlog-reader-conformance.md`）；另有 direction-advice 两路报告与蓝方报告的独立锚点核对（`/tmp/wh-card03-session-analysis/direction-advice-red.md`、`/tmp/wh-card03-session-analysis/direction-advice-blue.md`、`/tmp/wh-card03-session-analysis/direction-advice-blue-verify.md`；蓝方报告自述其读取的版本只含 T-001…T-006，引用其结论前须按本文件当前 T 表复核）。**仍待执行**：Grill、detail-advice、approve-decision，以及按 T-013 推迟到 CARD-04 交付并合并进 main 之后的 build-plan 与实际落盘。**build-plan 按 T-013 自定义答复推迟到 CARD-04 交付并合并进 main 之后启动**——本卡本轮不进入 build-plan，也**不实际改任何 `workflows/*/SKILL.md`**（只产出接口/方法面的冻结候选与计划）。

### 已收敛 OI 的终态字段（就地，append-only）

十一条 `status: confirmed`（OI-001…OI-011）的 `selected_disposition` / `evidence` / `acceptance` / `counterexample` **就地登记在 `## OI records` 的 yaml 记录内**（字段形状对齐官方作者模板 `skills/decision-log/templates/decision-log-template.md:76-91`；读者消费见 `runtime/stage/stage-content-contracts.mjs#analyzeDecisionOutline`（原记 `:3307`，现 `:3462`） 的 `analyzeDecisionOutline` 与其 `#parseOiYamlBlocks`（原记 `:3390-3396`，现 `:3387` 起）的 confirmed 终态校验）。本节**不再另列一份终态表**：原「就地表」逐行终态字段已逐字搬进对应 OI 记录，append-only 语义保留——旧表述一律不改写，本轮 T-007…T-015 产生的新口径以「本轮 T-0xx 细化／补充」的形式追加在旧表述之后（例：OI-010 保留 T-005=B 的原分寸，其后追加 T-010=A 的「删除跨 phase 全量快照绑定、登记为减少机器门禁」）。同一信息只有一处权威，不产生第二份清单。

- **收敛检查现状**：**范围**维度取 T-001=A、T-003=A（本轮再补 T-007=A 的「派发机制浪费治理在本卡范围内」与 T-013 的「只做 make-decision、build-plan 推迟」）；**验收**维度取 T-002=A、T-005=B（本轮再补 T-009=A 的取证方式、T-011=A 的 SD-11 落地形态、T-012=A 的连续上下文判据、T-014=A 的 G-1 落点、T-015=A 的并发口径）；**目标**维度登记为 `无新需求` + 引用（本卡 `## 原始需求` R-001…R-020 与 `## 本卡问答记录（T 表）` T-001…T-015；六批 Talk 均未改动本卡目标，目标来源是只读母材料），**方案**维度已按 T-007/T-008/T-010/T-011/T-012/T-013/T-014/T-015 逐条登记方案级答复（该行「用户答案」单元格内另记取舍、被拒方案与未决项处置：无未决项，11 条 OI 全部 `confirmed`）。这八条属**方案级**而非细节处置：它们决定落点载体（`AGENTS.md` 与四个阶段技能 / 扩展现有 `skills/spec-plan/templates/phase-template.md`）、机制增减口径（删掉跨 phase 全量快照绑定、登记为减少机器门禁）、判据定义（连续上下文＝回到同一子代理会话、并发只写 2–5 区间不写死数字）与时序安排（build-plan 推迟到 CARD-04 交付合并进 main 之后），每条都改变本卡的方案形态并在对应 OI 记录的 `selected_disposition` 内留有被拒选项；细节处置则指已定方案内的措辞/行号级修补。**不得**用母任务的用户答复代替本卡的用户答复，**不得**代答。 本轮（step 8 write-decision-draft）另按 T-016…T-025 追加登记方案级答复，并修补 `requirement_coverage` 与 `plain_language_card` 两维所需的形式缺口（处置列取值、文末结束卡三节），见 `## 补充登记` 与 `## 收敛检查`。
- **工作面状态**：本卡 worktree 内的改动**全部落在已声明写面内**：本文件（本子代理直接写入），加下文两处由另一个子代理执行的写面；实测 `git status --porcelain` ＝ ` M CONTEXT.md`、`?? docs/adr/0034-subagent-dispatch-and-parallel-rules.md`、`?? specs/workflowhub-thin-core-card-03-20260919/`，与声明一致，除这三处外本轮未改动仓库任何其它文件。本轮除了登记 T-007…T-015 九条答复，还做了一次**形态对齐**（不改信息、不新增材料）：`## 唯一 OI 大纲` 两张表补上官方作者模板要求的拉丁关键字列，`## OI records` 由 markdown 表改为 yaml 围栏块并把原「就地表」终态字段并入。 本轮（step 8 write-decision-draft）更新写面声明：本卡当前写面＝本文件；另有两处**属于本卡、由另一个子代理执行**的写面（`CONTEXT.md`、`docs/adr/0034-*.md`）；`runtime/evidence/**`、`runtime/stage/stage-runner.mjs`、`tools/cli/stage-runtime.mjs` 登记为**本卡不做、留给 CARD-04 合并后的 build-plan／build-code** 的推迟写面（T-018 的 H-1，见 `## 补充登记` 第六节）。
- **未完成 / 待复核**：（1）**build-plan 未启动**——按 T-013 自定义答复（逐字：「本卡先进行make-decision，后续build-plan会等到card-04交付合并进来后再进行」）推迟到 CARD-04 交付并合并进 main 之后；本卡本轮**未实际改任何 `workflows/*/SKILL.md`**，只留冻结候选与计划。（2）**已知待改的落点**（本卡承担、尚未执行）：`skills/spec-plan/templates/phase-template.md`（T-008=A；风险方向本轮已更正——该模板的契约测试断言全为子串包含式、纯新增字段不红，真实硬失败路径是 skill bundle 哈希链，见 `## 补充登记` 第七节）；`docs/standard-workflow.md:334-338`（step 11）与 `workflows/build-code/steps.json:15`，并须一并核对 `docs/stage-atomic-step-inventory.md:64` 与 `:65`（ID10 `capture-implementation` 的 `bind evidence to current snapshot` 与 ID11 `authenticate-current-task-completion` 的 `retain incomplete facts honestly` 不可互替）、`tests/contract/stage-routing-and-concrete-testing.test.mjs:164-165`（子串式 `toMatch`，只追加短语不构成必红）、`tests/e2e/vnext-five-stage-current.test.mjs:499`（T-010=A）；`AGENTS.md` 通用委派纪律 + 四阶段技能的「子代理产出契约」（T-007=A）；`workflows/build-plan/SKILL.md` 与 `workflows/build-code/SKILL.md` 的 G-1 角色分工（T-014=A）。（3）**禁区（勿改）**：`docs/standard-workflow.md:88-92`（尤其 `:91`「不设统一预算 gate」）被 CARD-04 在 decision-log 引用了 5 处，本卡不得改动这五行。（4）**残留交付项**：未删除完的全量绑定要如实登记给 CARD-06（T-010=A 已确认此项）。（5）**待复核（本轮未独立核实，按来源如实标注）**：T-011 引用的外部一手证据条目（arXiv:2609.25396 的 82%／97%、arXiv:2604.03551 的 27.67%、Claude Code agent teams 的「Start with 3-5 teammates」原文）系父代理转述，本卡未直读原文；T-013 登记的 CARD-04 事实（worktree 41 个条目不干净、build-plan 于 2026-09-26 19:22:46 CST 收尾、build-code 已并发、`tools/cli/stage-runtime.mjs` `@@ -1483` +7−1 硬碰撞 1 处、`spec.md:603` 与其 build-plan 写集自相矛盾）同样来自交办方实测，未独立复核。（6）**形态缺口的实测结果（两条 reader 链，勿混；本轮 step 8 已修补）**：① `runtime/stage/stage-content-contracts.mjs#analyzeDecisionOutline`（原记 `:3307`，现 `:3462`） 的 `analyzeDecisionOutline` 已能读到本文件的 framework/category 两张表与 OI 记录——上一轮复验（`/tmp/card03-verify2/run.mjs`）在 `taskId` 传 `null` 与本卡 id 两种入参下均 `ok: true`、`components` 四项（`structure` / `direction_snapshot` / `no_open_items` / `terminal_fields`）全 `passed`、`oi_records` 11 条、`open_items: []`、`errors: []`。② `## 收敛检查` 与「需求覆盖 / 大白话结束卡」不走这条链：它们的读者是 `analyzeDecisionConvergence`（同文件 `#analyzeDecisionConvergence`，原记 `:3589`、现 `:3744`；其中 `## 收敛检查` 的判定在 `#structuredConvergenceFacts`，原记 `:3505`、现 `:3660`）。**上一轮实测**该函数的 `goal_achievement` / `scope` / `solution_convergence` / `acceptance_clarity` / `outline_closed` 已全 `passed`，但 `requirement_coverage: "missing"`、`plain_language_card: "missing"`（整体 `ok: false`）。原因（逐字代码）：`#analyzeDecisionConvergence` 的 requirement_coverage 判定（原记 `:3657`，现 `:3881`）要求 `## 原始需求` 的处置列命中 `/(?:covered|accepted_omission|deferred|rejected|non.?goal|延期|拒绝|覆盖|已接受)/i`，而 20 行原取值（`已登记，待收敛`、`已按原文逐字补全…`）全部未命中；`#structuredConvergenceFacts`（原记 `:3620`，现 `:3660` 起）要求「核心需求 + 目标 + 决定」三类节标题同时非空，本文件原缺这三类标题（`#structuredConvergenceFacts`，原记 `:3635`，报 `decision-log end card is missing core requirement, core goal, or selected direction`）。**本轮 step 8 已修补**：20 行处置列改为合法取值（多数为 `covered（…）`，R-006 为 `deferred（…）`），文末新增 `## 核心需求` / `## 核心目标` / `## 决定` 三节。这两维在 `runtime/stage/stage-handlers.mjs`（`completion_subjects` 段；原记 `:3596`） 被读出并作为 make-decision 的 `completion_subjects` 登记（`requirement_coverage` 原记 `:3656`、现 `:3823`；`plain_language_card` 原记 `:3668`、现 `:3835`）；**是否因此阻断阶段完成，仍未核实，标「待复核」**（本卡不新增门禁）。本轮复跑脚本 `/tmp/card03-draft/run.mjs` 的输出原文如下（就地补记）：`analyzeDecisionOutline` → `{"ok":true,"errors":[],"facts":{"outline_closed":"passed"},"components":{"structure":"passed","direction_snapshot":"passed","no_open_items":"passed","terminal_fields":"passed"}}`（`oi_records` 11 条、`open_items: []`）；`analyzeDecisionConvergence` → `{"ok":true,"errors":[],"facts":{"requirement_coverage":"passed","goal_achievement":"passed","scope":"passed","acceptance_clarity":"passed","solution_convergence":"passed","plain_language_card":"passed","outline_closed":"passed"}}`（两种入参各跑一次：`originalRequirement` 空串、以及本卡 8 行需求样本，两次结果一致；脚本 `/tmp/card03-draft/run.mjs`，输出原文留在 `/tmp/card03-draft/reader-output.txt`）。

## 本卡问答记录（T 表）

本卡（card-03）自己的问答编号空间，从 T-001 起。本卡已进行**六批**真实 Talk，每批一次性发出、一次性回收，用户逐字回复依次为：第一批三条（T-001…T-003）「A A A」（三问均选 A）；第二批三条（T-004…T-006）「A、B、A」（第 1、3 问选 A、第 2 问选 B）；第三批三条（T-007…T-009）「A A A」；第四批三条（T-010…T-012）「A A A」；第五批一条（T-013）**用户给出自定义答复**（非选项，逐字原文见该行）；第六批两条（T-014/T-015）逐字回复为「A」「A」（两次回复原文依次为 `A`、`A`）。**宿主未提供任何回复引用字段或哈希，本表不补造此类字段**（纪律：不编造字段、不写哈希）。**本轮（step 8 write-decision-draft）另登记十问十答（T-016…T-025）**：十条均取自交办方转述的用户真实答复，未提供分批信息，故按逐条答复登记、**不补造批次与回复引用字段**（纪律：不编造字段、不写哈希）。

| 问题 id | 问题（大白话） | 选项全集 | 用户选择 | 选择含义 | 来源 |
| --- | --- | --- | --- | --- | --- |
| T-001 | 任务类型登记：本卡按「普通任务」还是「规划任务」办？ | A=普通任务（允许 Talk 追问实现细节）／B=规划任务（只谈方向，禁止问文件路径、函数名、字段名、schema 形状、命令形态、行号、代码片段） | A（本批逐字回复「A A A」的第 1 答） | 本卡登记为 `普通任务`：问题面不受方向级禁令约束，可以就实现细节提问（问题面禁令见 `workflows/make-decision/SKILL.md:25-41`） | 本轮用户消息 |
| T-002 | 验收载体：AC-11…AC-15 要「实跑一个多工作包实施 task」，这个证据从哪来？ | A=用 card-03 自己的执行当主证据、缺的场景用显式演练补（G-1 用演练记录，build-prd 记「明确不适用理由」；取证只采事实，判定必须来自独立上下文）／B=自证 + 另起一个独立小样例 task／C=只做独立样例 task | A（本批逐字回复「A A A」的第 2 答） | 验收 oracle 取 A：主证据＝card-03 自身执行事实；G-1 走**演练**而非实遇；build-prd 记「明确不适用理由」；取证只采事实，**判定必须来自独立上下文**（禁止自审自判）；不另起独立样例 task | 本轮用户消息 |
| T-003 | build-prd 阶段在本任务不跑的处置：本卡 cohort=post，路线不含 build-prd，AC-15 的「五阶段」怎么记？ | A=记「明确不适用理由」，`workflows/build-prd/SKILL.md` 方法章节照样改到位，派发实例证据由后续 pre 路线任务承担／B=额外跑一个 pre 路线样例 task 专门覆盖／C=把 PRD 的「五阶段」措辞改成四阶段 | A（本批逐字回复「A A A」的第 3 答） | 本卡不跑 build-prd、也不另跑 pre 样例 task；`workflows/build-prd/SKILL.md` 的方法章节仍须改到位（方法覆盖五阶段），build-prd 的**派发实例证据**由后续 pre 路线任务承担，本卡处记「明确不适用理由」；不改写 PRD 的「五阶段」措辞 | 本轮用户消息 |
| T-004 | Q4 进度权威写在哪：post 路线的 phase 进度用哪一份材料做唯一权威？ | A=单一进度权威＝`facts.jsonl` 的 `phase_progress` 游标，phase 文件只读、只声明指针（如 `progress_cursor: facts.jsonl#build-code.phase_progress`）、不复制状态值／B=每个 phase 文件自带 `status` 字段、随做随改／C=`phases/index.md` 做唯一进度表 | A（本批逐字回复「A、B、A」的第 1 答） | 进度真值只有 `facts.jsonl` 的 `phase_progress` 游标一处；phase 文件不写状态值、只写指针。被拒：B（形成第二权威、与 facts.jsonl 不一致，且「随做随改」正是审计出的 churn 来源）；C（与 index 的纯指针定位冲突，且 index 已有单元格超 2000 字符被截断） | 本轮用户消息（逐字「A、B、A」第 1 答） |
| T-005 | Q5 snapshot 绑定怎么处置：证据绑定口径与整个 snapshot 绑定时，本卡怎么处置？ | A=只在方法侧规避，机制留 CARD-04/06／B=本卡内顺手做最小机制修补：绑定口径从「整个 snapshot」改成「该 phase 声明的写集」，落 `docs/standard-workflow.md` step 11 `authenticate-current-task-completion`（:334-338）与对应 steps 定义文件（`docs/stage-atomic-step-inventory.md:65`）／C=回母任务 make-decision 做增量决策写进 PRD | B（本批逐字回复「A、B、A」的第 2 答） | 本卡承担最小机制修补：证据绑定口径＝该 phase 声明的写集，不再绑整个 snapshot；落 `docs/standard-workflow.md:334-338`（该处合并前旧编号 `:289-290`，原文为「确认 task facts 绑定当前 snapshot，不把旧结果冒充当前结果」，现已按本口径改为「确认 task facts 绑定**该 phase 声明的写集**」）与对应 steps 定义文件。被拒：A（把机制问题留给后续卡）、C（回母任务改 PRD）。**风险（如实登记）**：该机制面原判归 CARD-04/06 写面，现由本卡承担，有与 CARD-04 在研工作树撞车的可能；父代理已另派子代理核实碰撞点，本卡须在 build-plan 前与 CARD-04 冻结接口（见 OI-008、OI-010） | 本轮用户消息（逐字「A、B、A」第 2 答） |
| T-006 | Q6 三条「执行卫生」规则写在哪一处权威？ | A=`AGENTS.md` 通用工作纪律段一处权威，五阶段 `SKILL.md` 各引用一次／B=五阶段各写一份正文／C=只写 `AGENTS.md`、`SKILL.md` 不提 | A（本批逐字回复「A、B、A」的第 3 答） | 三条规则（①长命令后台化、禁止轮询空转；②互不依赖的只读动作批量并行；③子代理必须增量落盘、只回传摘要、禁止把全文攒在最后一条消息里）写进 `AGENTS.md` 通用工作纪律段作唯一权威，五个阶段 `SKILL.md` 各引用一次、不复制正文。被拒：B（五份副本会漂移）；C（子代理只读 SKILL 时会漏） | 本轮用户消息（逐字「A、B、A」第 3 答） |
| T-007 | 本卡范围是否包含「派发机制浪费」的治理（委派纪律与子代理产出契约）？ | A=包含：在 `AGENTS.md` 补一条**通用委派纪律**，并补齐四个阶段技能里缺失的「子代理产出契约」（先落盘、只回摘要、按子问题增量）／B=只写原则不写做法／C=另立新卡 | A（本批逐字回复「A A A」的第 1 答） | 本卡范围**包含**该治理：`AGENTS.md` 补通用委派纪律（一处权威），四个阶段技能补齐缺失的「子代理产出契约」（先落盘、只回摘要、按子问题增量）。被拒：B（审计实测四个阶段现有上下文规则为零条，「只写原则」等于不落地）；C（要动只读母材料，且本卡自己做时仍被同一浪费咬）。**风险（如实登记）**：写面变大，且 `AGENTS.md` 是常驻上下文文件，条款必须克制 | 本轮用户消息（逐字「A A A」第 1 答） |
| T-008 | phase 文件模板的载体放哪（新字段槽位写进哪个文件）？ | A=**扩展现有** `skills/spec-plan/templates/phase-template.md`／B=新建独立模板／C=只在 `workflows/build-plan/SKILL.md` 写字段清单 | A（本批逐字回复「A A A」的第 2 答） | **扩展现有** `skills/spec-plan/templates/phase-template.md`（该文件已被 3 个契约测试引用），把新字段槽位加进去，保持**单一权威**。被拒：B（会造成两份 phase 模板、权威分裂，正是 card-04 审计实测的「同一判据两处权威」老毛病）；C（会回到 13 份 phase 文件字段顺序各写各的、进度表达缺失的老路）。**风险（如实登记；方向本轮已更正）**：原登记为「那 3 个引用该模板的契约测试要跟着改，是本卡已知风险最高的一处改动」，**该风险方向登记错了**——三处契约测试对该模板的断言全为 `toContain`／`toMatch` 子串包含式，纯新增字段、改行、重排只要保留关键字即通过；真实硬失败路径是 skill bundle 哈希链：改模板后 `runtime/adapters/local-skill-resolver.mjs:110` 抛 `bundle sha256 mismatch: templates/phase-template.md`，须同批刷新 `skills/spec-plan/skill-bundle.json:11` 与 `skills/catalog.yaml:335`，并会打红 `tests/skill-provenance-strict.test.mjs:25`／`:26` 与 `tests/contract/spec-stage-artifact-closure.test.mjs:118`（见 `## 补充登记` 第七节） | 本轮用户消息（逐字「A A A」第 2 答） |
| T-009 | 本卡自身验收怎么取证（AC-12/AC-13 的「大量读写」判据）？ | A=事后人工判读一次／B=建轻量记录文件／C=不取证只写结论 | A（本批逐字回复「A A A」的第 3 答） | **事后人工判读一次**——把主会话本次真实做过的动作列成清单，逐条标「派发/回收/交互」还是「批量读写」，判读一次并如实记录；**零新增机制**。被拒：B（与用户「不要任何机制统计 token/时间」的要求正面冲突）；C（AC-12/AC-13 会变成不可证伪的空话）。**风险（如实登记）**：只有一次抽样、不可持续，只能证明「本次做到了」 | 本轮用户消息（逐字「A A A」第 3 答） |
| T-010 | snapshot 绑定的机制修补还做不做？口径怎么定？ | A=继续做，口径改成「删掉跨 phase 的全量快照绑定」、只留该 phase 自己声明的写集，并记成「减少机器门禁」／B=退回方法侧规避／C=先与 CARD-04 对齐口径再定 | A（本批逐字回复「A A A」的第 1 答） | **继续做**，口径＝「**删掉跨 phase 的全量快照绑定**、只留该 phase 自己声明的写集」，并登记为「**减少机器门禁**」以对齐 SD-17 与母任务 OI-012。落点：`docs/standard-workflow.md:334-338`（step 11 `authenticate-current-task-completion`）与 `workflows/build-code/steps.json:15`；另需一并核对 `docs/stage-atomic-step-inventory.md:64`（ID10 `capture-implementation`／`bind evidence to current snapshot`，对应绑定收窄）与 `:65`（ID11 `authenticate-current-task-completion`／`retain incomplete facts honestly`，step 11 的读取点）、`tests/contract/stage-routing-and-concrete-testing.test.mjs:164-165`（子串式 `toMatch`，只追加短语不构成必红）、`tests/e2e/vnext-five-stage-current.test.mjs:499`。被拒：B（card-07 会话实测因全量绑定空转 6h36m）；C（先对齐再定）。**风险（如实登记）**：①`docs/standard-workflow.md` 与 `workflows/build-code/steps.json` 实测与 CARD-04 写面**零交集**（CARD-04 对 `docs/standard-workflow.md` 引用 0 处）；②警告：`docs/standard-workflow.md:88-92`（尤其 `:91`「不设统一预算 gate」）被 CARD-04 在 decision-log 引用了 5 处，**勿改这五行**；③残留的全量绑定要如实登记给 CARD-06；④CARD-04 的 `decision-log.md:2034` 非目标 B-06 与 SD-17 明令禁止「重新引入哈希绑定、回执、快照、材料身份校验类机器门禁」，本修补的语义邻接风险如实登记，并在验收口径里写明「本动作是移除全量绑定、减少机器门禁」 | 本轮用户消息（逐字「A A A」第 1 答） |
| T-011 | SD-11 五件套（冻结接口蓝图、并发起手数、worktree 隔离等）怎么落地？ | A=按外部一手证据收敛落地形态、不改需求字面／B=严格照 SD-11 字面／C=照字面 + 存疑注记 | A（本批逐字回复「A A A」的第 2 答） | **按外部一手证据收敛落地形态，但不改需求字面**——SD-11 五件套逐条仍有落点，但每条以**事实记录**形态落地：①「接口蓝图冻结」落成「接口符号清单（事实记录，不叫冻结）」；②补上外部唯一有实测数字的那条——并发方**广播「我已完成的改动」**（arXiv:2609.25396：构造场景干扰率 97%，一条广播消息恢复 **82%** 的 runs）；③worktree 隔离补齐配套清单（每 worktree 重装依赖、搬 gitignored `.env`、禁 symlink 依赖、分支独占改 detached HEAD、磁盘 O(N)、清理/恢复是状态机）；④并发写「**起手 3–5，且不随任务数增长**」。被拒：B（引入三家主流 agent 团队都没做的机制）；C（照字面 + 存疑注记，留痕没人看）。**风险（如实登记）**：与 SD-11 字面的「冻结」有措辞差，验收时要能被判为「已按 OI-012 降级为事实记录」。外部证据要点另登记：写集声明在业界**没有机器校验先例**（Claude Code agent teams 只有一句 best practice，无组件校验）；依赖门禁假阻塞有官方自认（`Task status can lag … which blocks dependent tasks`）；文本级合并冲突率 27.67%（arXiv:2604.03551）与「接口干扰率 1/834≈0.12%」（arXiv:2609.25396）是**两个不同问题，引用不得混用** | 本轮用户消息（逐字「A A A」第 2 答） |
| T-012 | FR-12「连续上下文」的判据是什么？ | A=回到同一个子代理会话（允许中途被上下文压缩过），且派发时必须附上审查/测试发现的原文／B=必须全程未被压缩/回收／C=不要求同会话、带交接就算 | A（本批逐字回复「A A A」的第 3 答） | 「连续上下文」＝**回到同一个子代理会话**（允许中途被上下文压缩过），且派发时**必须附上审查/测试发现的原文**。被拒：B（真实长任务几乎必然做不到，审计里单会话被压缩 5–49 次，会把 FR-12 变成永久失败条款）；C（等于 FR-12 无约束）。**风险（如实登记）**：「被压缩过还算不算原上下文」会有争议，验收时须明写口径 | 本轮用户消息（逐字「A A A」第 3 答） |
| T-013 | 与 CARD-04 的写面冲突怎么处置（本卡什么时候进 build-plan）？ | 本题用户未选 A/B/C，给出**自定义答复**（非选项单选） | **自定义答复（非选项）**——逐字原文：本卡先进行make-decision，后续build-plan会等到card-04交付合并进来后再进行 | ①本卡**现在只做 make-decision**，不进入 build-plan；②**build-plan 推迟到 CARD-04 交付并合并进 main 之后**再启动；③因此本卡在 make-decision 阶段**不实际改任何 `workflows/*/SKILL.md`**，只产出接口/方法面的冻结候选与计划；④与 CARD-04 的挂起碰撞（`runtime/stage/stage-runner.mjs`、`workflows/{make-decision,build-code,verify-code}/SKILL.md`）由**时间错开**消解，不需要现在交涉。**同时如实登记的新事实**：CARD-04 worktree 实测 41 个条目不干净、其 build-plan 于 2026-09-26 19:22:46 CST 收尾、build-code 已并发运行；硬碰撞已发生 1 处（`tools/cli/stage-runtime.mjs` `@@ -1483` +7−1）；CARD-04 的 `spec.md:603` 自述「本卡零 `workflows/**` 写入面」与其 build-plan 写集**自相矛盾**，交涉应针对 build-plan 而非 spec | 本轮用户消息（用户自定义答复，非选项） |
| T-014 | G-1（实施中真发现接口必须改）的收场规则落在哪个技能？ | A=两个技能各写各的角色 + 交叉引用／B=只写 `workflows/build-code/SKILL.md`／C=只写 `workflows/build-plan/SKILL.md` | A（本批逐字回复「A」的第 1 答） | **两个技能各写各的角色**——`workflows/build-plan/SKILL.md` 写「接口清单与并行方案怎么产出」，`workflows/build-code/SKILL.md` 写「实施中真发现接口必须改时的收场动作：停谁、谁重排、作废批次怎么登」，两处**交叉引用**防漂移。被拒：B（计划阶段冻结接口的人看不到收场规则）；C（实施期子代理看不到动作）。**风险（如实登记）**：两处提到 G-1，需一句交叉引用防漂移。**新事实**：`grep "G-1" workflows/ docs/ runtime/` 现为**零命中**，只有方向级定义（`specs/workflowhub-thin-core-rebuild-planning-20260919/decision-log.md:855`、同目录 `prd.md:70/297/303/308`），无任何可执行步骤 | 本轮用户消息（逐字「A」第 1 答） |
| T-015 | 并发上限写不写死数字（SD-11 的「2–5」与现仓 4/4/2 怎么统一）？ | A=不写死数字，把「2–5」当区间约束写进五阶段共用纪律、每个任务在 build-plan 的并行方案里逐任务定／B=写死 3／C=保持现状 4/4/2 | A（本批逐字回复「A」的第 2 答） | **不写死数字**——把 SD-11 的「2–5」当**区间约束**写进五阶段共用纪律；具体每个任务开几个并发，在 build-plan 的并行方案里**逐任务定**；并顺手把 `workflows/make-decision/SKILL.md:357` 现有的「研究 4 / debate 4 / 红蓝 2」与区间对齐。被拒：B（外部文档只是「起手建议」，写死易变成硬门）；C（会形成「同一判据两处权威」，正是审计刚认定的根因）。**风险（如实登记）**：区间宽松，验收只能判「在不在区间内」，判不了「取得好不好」。**新事实**：外部一手调研支持「起手 3–5，且**不随任务数增长**」（Claude Code agent teams 官方原文「Start with 3-5 teammates」「Three focused teammates often outperform five scattered ones」） | 本轮用户消息（逐字「A」第 2 答） |
| T-016 | 本卡交付重心：SD-11 五件套继续当主交付，还是与实测根因平级？ | A=五件套全部保留但**降为并列条款之一**，把有实测数字支撑的四条（禁子代理继承父代理全部对话、取消空转轮询、把跨 phase 的全量快照绑定收窄到该 phase 声明的写集、禁重复读同一文件／重跑同一测试）写成**同等权重的正文**，并加一张**逐条覆盖率矩阵**（每条标注「有实测支撑／无实测支撑／方向相反」+ 证据 ref）／B=维持五件套为主交付／C=把实测根因另立新卡 | A | 五件套仍是本卡交付物，但与四条实测条款**同等权重**；新增**逐条覆盖率矩阵**（证据引 `/tmp/wh-card03-session-analysis/s0921a.md`、`s0922a.md`、`s0922b.md` 的行号，见 `## 补充登记` 第一节）。被拒：B（维持审计实测里覆盖率极低的重心，即红队 F-1 的 blocker）；C（另立卡后本卡的实测根因仍无人处置）。风险（如实登记）：矩阵会明写第 1／4／5 条「无实测支撑」、第 3 条「方向相反」，属如实登记，不改需求字面（与 T-011=A 一致）。 | 本轮用户消息（step 8 交办答复；本题含义、后果与风险已在发问前的大白卡内呈现；不补造回复引用字段） |
| T-017 | 被推迟的 acceptance 怎么记才既真实又可核对？T-002（本卡内取证）与 T-013（build-plan 推迟）的冲突怎么裁？ | A=给每条被推迟的 acceptance 追一句「真实载体在 CARD-04 合并后的 build-plan/build-code，本卡内以冻结候选／演练／不适用理由代替」，并把 T-002 与 T-013 的冲突**显式裁决**（结论登记在 OI-007）／B=把 acceptance 改写成「本卡内可核对的形式」／C=不处置 | A | 逐条追载体说明 + 显式裁决登记 OI-007。被拒：B（改写 acceptance 会把真实判据缩成本卡内能自证的东西，等于降低验收标准，即红队 F-2 的 blocker）；C（同）。风险（如实登记）：本卡内可执行的部分（动作清单、演练记录、不适用理由）与推迟部分必须分清，裁决要写在材料里而不能只靠口头。 | 本轮用户消息（step 8 交办答复；含义、后果与风险已在发问前的大白卡内呈现） |
| T-018 | snapshot 绑定修补改到什么深度、改在哪个时点？ | A=真改 runtime，在本卡内做／B=真改 runtime，但**不在本卡进行**——本卡只**冻结改动候选清单**（改哪几个文件、改成什么语义、接口怎么变、删除责任方是谁）／C=只改方法侧 | 先选「真改 runtime」，随后在 H-1 明确「**真改，但不在本卡进行**」 | 本卡只冻结改动候选清单，真实代码改动等 CARD-04 合并后随 build-plan／build-code 落地。落点候选（红队实测）：`runtime/evidence/quality-fact.mjs:48`、`runtime/evidence/canonical-evidence-validators.mjs:251`／`:322-328`／`:397-399`／`:433`、`runtime/evidence/research-report.mjs:22`、`runtime/evidence/freshness.mjs`（import `ensureGitSnapshotObjectStore`／`materialRevisionFromValues`）。被拒：C（只改声明层＝红队 F-5，真实绑定不动）。风险（如实登记）：`runtime/**` 是 CARD-04／CARD-06 的写面交汇处，本卡只冻结清单不写代码，落地时须与 CARD-04 合并后的写面对齐。 | 本轮用户消息（先在选项内选 A，随后在 H-1 明确时点；含义、后果与风险已在发问前的大白卡内呈现） |
| T-019 | 条款的「可观察形态」覆盖多少条？ | A=全部条款都写成可观察形态／B=**只给最贵的三条**——①禁子代理继承父代理全部对话 ②禁空转轮询 ③「声明不实怎么被发现」／C=保持原则性措辞 | B | 只有三条写成可观察形态（每条给出可指认的事实与呈现位置），其余条款保持原则性短措辞。被拒：A（条款膨胀，而 `AGENTS.md` 是常驻上下文文件，与 T-007 登记的风险一致）；C（红队 F-3：纯文本约定的有效性已被同仓历史证伪——`docs/standard-workflow.md:88-89` 的重复读规则被实测违反，唯一被遵守的是可外部观察的「禁止全量回归」）。风险（如实登记）：只有三条可观察，其余条款仍靠纪律自觉。 | 本轮用户消息（step 8 交办答复；含义、后果与风险已在发问前的大白卡内呈现） |
| T-020 | FR-13「主会话不承担大量阅读或编辑」与 make-decision 的 M 独占步骤（step 1／5／6／7／12）结构性冲突（红队 F-4：AC-12 必失败或必豁免），怎么处置？ | A=补一张**阶段豁免表**（明确哪些 M 独占步骤的读写不计入「大量读写」）并给「大量」一个**可指认阈值**／B=把 FR-13 改成只约束 build-code 阶段／C=不处置 | A | 补**阶段豁免表**（至少含 make-decision 的 step 1 load-context、step 5 outline-talk、step 6 grill-with-docs、step 7 module-convergence、step 12 publish-decision 的决策记录写入）并给「大量」一个可指认阈值；登记进 **OI-003**，表与阈值见 `## 补充登记` 第二节。被拒：B（缩小 FR-13 的适用范围＝改需求字面）；C（AC-12 会变成不可判的条款）。风险（如实登记）：阈值是人为划线，且事后人工判读只有一次抽样（T-009=A 已登记）。 | 本轮用户消息（step 8 交办答复；含义、后果与风险已在发问前的大白卡内呈现） |
| T-021 | 「可观察形态」具体覆盖哪几件事？ | A=①禁继承全部对话 + ②禁空转轮询 + ③**声明不实发现路径**／B=只做 ① + ②／C=换成别的三件 | A | 同 T-019 的三条；其中「声明不实发现路径」＝给独立审查一条**可执行核对动作**（用实跑命令回放核对声明集，例如把 `git diff --name-only` 的输出与声明写集逐条比对），见 `## 补充登记` 第三节。被拒：B（不实声明仍无人发现，即红队 F-8）。风险（如实登记）：核对动作必须能被独立审查在不同上下文执行，不能依赖实施者自述。 | 本轮用户消息（step 8 交办答复；含义、后果与风险已在发问前的大白卡内呈现） |
| T-022 | 工作包的「合并责任」按什么做法定义？ | A=采用外部一手做法——**产出方自己提交／开 PR**；**失败时换一个新执行者重做，不回滚**／B=主会话统一代提交／C=失败即回滚 | A | 写进 **OI-004** 的 `selected_disposition`；**acceptance 与 counterexample 都必须覆盖它**（红队 F-10：并发方广播「我已完成的改动」是唯一有外部实测背书的手段——arXiv:2609.25396 的构造场景干扰率 97%、一条广播消息恢复 **82%** 的运行——此前正文有、acceptance 没有，本轮一并补上）。被拒：B（把提交责任收拢到主会话，加重主会话负担并与 FR-13 冲突）；C（回滚会抹掉已完成改动，外部证据支持换新执行者重做）。风险（如实登记）：外部一手证据系父代理转述，本卡未直读原文。 | 本轮用户消息（step 8 交办答复；含义、后果与风险已在发问前的大白卡内呈现） |
| T-023 | 核心角色的权威术语用哪一套？ | A=沿用仓库已有的「阶段协调者／Phase 执行者」／B=**以「子代理」为权威词**，在 `CONTEXT.md` 新增一条定义／C=分两套（方法面叫子代理、实现面叫阶段协调者） | B | `CONTEXT.md` 新增一条「子代理」定义（**由另一子代理执行**；本卡材料只登记这个决定与落点）。被拒：A（现有词与工作流／运行时文档里的「子代理」并存，会继续漂移）；C（两套词＝两处权威，正是审计认定的漂移来源）。风险（如实登记）：新增定义须避免与 `CONTEXT.md` 已有条目重复定义。 | 本轮用户消息（step 8 交办答复；含义、后果与风险已在发问前的大白卡内呈现） |
| T-024 | 「声明不实／失败」这类事实由谁判定、记到哪？ | A=由**独立审查子代理**判定，写进任务事实库 `facts.jsonl` 的验收事实（遵守「禁止自审自判」）／B=由实施者在阶段材料里自记／C=交给门禁判定 | A | 由独立审查子代理判定并写进 `facts.jsonl` 的验收事实；**只能记录，不得成为新门禁**（对齐 SD-17 与母任务 OI-012）。**落点更正（本轮核对实测）**：现仓 `facts.jsonl` 只接受 `stage`／`close_action` 两种行（`runtime/task/task-store.mjs:220`）并显式拒绝 quality fact（同文件 `:179`），唯一持久 finding 载体是当前 stage 行的 `finding_dispositions`（`runtime/stage/completion-predicates.mjs:124` 五值枚举）；判据与效力不变。被拒：B（自审自判，`AGENTS.md` 明令禁止）；C（新增门禁，与 SD-17 正面冲突）。风险（如实登记）：`facts.jsonl` 是事实库不是许可证（`AGENTS.md` 的治理边界），登记时必须保持「事实而非门」的语义。 | 本轮用户消息（step 8 交办答复；含义、后果与风险已在发问前的大白卡内呈现） |
| T-025 | Grill 的判定要不要落一条 ADR？`阶段`／`Phase` 的区分怎么沿用？ | A=Grill 判定「**要写一条 ADR**」（三项判据全真：难反转／无背景会意外／真实取舍），且 `阶段`／`Phase` 的区分沿用 `CONTEXT.md:258-259` 已有定义、不改／B=不写 ADR，只在决策日志里记／C=改 `CONTEXT.md` 的两词定义 | A | 写一条新 ADR，落 `docs/adr/0034-*.md`（`docs/adr/` 现有最大编号为 `0032-review-chain-delegation-and-layer-contract.md`，`0033` 为空号；**由另一子代理执行**）；`阶段`／`Phase` 沿用 `CONTEXT.md:258-259` 已有定义，不改。被拒：B（三项判据全真时不写 ADR，后来人要重新踩一遍）；C（已有定义够用，改它会造成两处权威）。风险（如实登记）：落笔前须再核对编号是否仍为空号（另一子代理与本卡可能并行写入）。 | 本轮用户消息（step 8 交办答复；含义、后果与风险已在发问前的大白卡内呈现） |
| T-026 | 本卡的写面到底包含什么、五个阶段技能算不算「本卡要做」？处置词表用几个值？ | A=写面＝各阶段技能的方法章节，实施与 CARD-04 错开／B=列为冻结候选/排队/推迟，不算本卡动作／C=只改不撞车的三个技能 | A | **反转此前「冻结候选/排队/推迟」的裁决**：写面逐字＝「写面＝各阶段技能的方法章节」；CARD-04 同时改其中三个文件是**时序约束、不是范围边界**。处置词表收敛为三个值：`本卡内做`/`错开实施`/`本卡不改`。被拒：B（把「文本已定稿」误当「无需本卡落地」）；C（把「同文件有人在改」当排除理由）。落点：本文件 §6.0 词表、§6.1 处置列、§6.3 分批表、§6.5 delta 表。风险：三个文件落点行号在 CARD-04 合并后全部漂移（build-code +24、verify-code +37、make-decision +11），落笔前必须按文本锚点重定位 | 本轮用户消息（逐字含「写面＝各阶段技能的方法章节」「CARD-04 编辑三个文件是 sequencing，不是 scope boundary」「冻结候选 / 排队 / 推迟 是 WRONG、必须反转」） |
| T-027 | `docs/stage-atomic-step-inventory.md` 的两段旧清单要不要本卡顺手同步？ | A=顺手同步到真实 `workflows/*/steps.json`／B=留给后续／C=只记录红 | A | 同步 make-decision 段 `:13-26`（14 行 → 13 行）与 build-plan 段 `:42-54`（13 行、8 处 slug 不符）。判据 `tests/p0-foundation-contracts.test.mjs:55`：改后 `documented.size = actual.size = 68`。连带：全文件 87 → 86 行，`:26` 之后行号 −1，`decision-log.md` 9 处对 `:64`/`:65` 的引用变为 `:63`/`:64`（是否同批重指见残留不确定）。不改 `docs/architecture/repository-inventory.tsv:104` | 本轮用户消息 q7_1=A |
| T-028 | `Acceptance inline` 内联到什么程度？ | A=只内联引用行（`AC-ID \| oracle ID \| 证据类型 \| spec.md 锚`）／B=连判据正文一起内联／C=不内联只给指针 | A | 只内联引用行；**不抄判据正文，不写「通过/失败」条件**。落点：`skills/spec-specify/templates/spec-template.md`（`Acceptance inline` 段）、`skills/spec-plan/SKILL.md:14` 末句、`skills/spec-tasks/templates/index-template.md` 登记点。连带摘要链回写（批 S） | 本轮用户消息 q7_2=A |
| T-029 | 根目录 5 份别的任务的进度文本怎么处置？ | A=移进归档目录 + 同步引用 + 写明唯一进度来源／B=原样保留只加说明／C=删除 | A | `git mv` 进 `docs/archive/retired-root-progress/`（5 份：`progress.md`、`task_plan.md`、`findings.md`、`HANDOFF-make-decision.md`、`HANDOFF-make-decision-card07.md`，basename 不变）；同步活区 3 处引用；`AGENTS.md:44` 之后新增「唯一进度来源」bullet；`.planning/.active_plan` **不动**（CARD-04 活指针）；`specs/archive/**` 的 3 处引用只登记不改 | 本轮用户消息 q7_3=A |
| T-030 | `workflows/build-plan/SKILL.md` 那段 phase 字段枚举怎么办？ | A=保留／B=改成指向模板但保留枚举／C=删掉枚举、改指模板 | C | 删 `workflows/build-plan/SKILL.md:209-215` 的 7 行字段枚举，改成指向 `skills/spec-plan/templates/phase-template.md`；**行数不变**（7 行 → 7 行，文件 20113 → 20066 字符）。保留 `phases/P<n>.md`、`phases/index.md`、`authority path, semantic anchor, write set, dependency, consumer`、`The final aggregate is an ordinary Phase task, not a new public stage.`、`L0/L1/L2` 五处字面。安全性依据：`gate_cmd`/`evidence_path`/`coverage limit`/`expected_exit` 在 `tests/` 全目录零命中要求该文件含；五条定距正则命中行与跨度逐条不变 | 本轮用户消息 q7_4=C |
| T-031 | 4 条既有红测试怎么处置？ | A=本卡顺手在测试侧修掉／B=留给后续／C=只登记 | A | 修 `tests/contract/build-code-apply-contract.test.mjs:15`/`:31`/`:57` 与 `tests/contract/review-step-forward-progress.test.mjs:97`，**全部只在测试侧改期望值**，并在本文件登记依据。**不得改 it 名称**（`:43`/`:42` 以 it 名称为锚点）。`core/__tests__/check-skill-closure.test.mjs` 的第 1 条（`build-code: prompt references undeclared skill architect-code-review`）**不属测试陈旧**，由 §1 修补 (1) 在散文侧消解 | 本轮用户消息 q7_5=A |
| T-032 | build-plan 要不要纳入 `phase_progress` 进度游标？ | A=不纳入／B=纳入（复用同一字段/载体/命令对）／C=另建一套 build-plan 进度 | B | build-plan 也纳入：**同一个 `phase_progress` 字段、同一 4 键、同一个 stage 行载体、同一对 `run` 写入 / `status` 读取**，只把「哪些 stage 的行允许携带它」从 build-code 扩到 build-plan+build-code，读回按被请求的 `values.stage` 选址。零新字段、零新命令、零新对象、零新账本、零新 export。**必须**先做 7 处参数化（A5），否则 build-plan 写入会伪造 `stage: "build-code"` 的行。语义靠**所在行的 `stage`** 区分，不靠游标内的键；消费者必须连 `row.stage` 一起读/传/引用。落盘顺序见 §6.4 | 本轮用户消息 q7_6=B |
| T-033 | 「修复回到原实施子代理，在连续上下文中完成」的判据与取证物是什么？ | A=回到同一个子代理会话（允许中途被上下文压缩）且派发必附审查/测试发现原文／B=只要带完整交接即算／C=用会话标识机械判定 | A | 判据逐字＝**回到同一个子代理会话**（允许该会话中途被上下文压缩过）；派发时**必须附上审查/测试发现的原文**，不带原文的重新派发不算；反向也失败项：把「曾被压缩过」判为不连续。判定取自**独立上下文**。**设计书侧缺落点**（全文 `连续上下文`/`独立上下文` 0 命中）⇒ 由 `DESIGN-v3.md` §3.7 的 G-1 行旁注 + 新增「本卡验收的载体与不适用清单」一节承担（§6.6 第 1 条） | `decision-log.md:176-182`（T-012=A） | 本轮用户消息 |
| T-034 | `:378` 那条「推迟写面」到底推迟什么？ | A=整个 `tools/cli/stage-runtime.mjs` 文件都在 CARD-04 合并后由后续阶段做／B=只推迟 T-018 的 H-1（快照绑定那套 runtime 语义），q7_6 的游标参数化仍在本卡内做 | B | **收窄**：`:378` 推迟的是 T-018 的 H-1（快照绑定那套 runtime 语义），**不是整个 `tools/cli/stage-runtime.mjs` 文件**。q7_6=B 的游标参数化（A5 的 7 处 + B1—B6）**仍在本卡内做**，只是与 CARD-04 的 `@@ -1486` hunk 错开。`DESIGN-v3.md:1116`（原 `#18`）与 `V4-M4.md:55` 把整个文件列为「本卡不改」的写法作废 | 本轮用户消息（交办方转述的确认裁决） |
| T-035 | 五个阶段技能在本卡的处置是「排队/不做」还是「错开实施」？ | A=保持「冻结候选/排队/推迟」／B=改判为「错开实施」（＝本卡交付，CARD-04 合并后落地） | B | 「三个阶段技能排队＝不做」的旧口径作废。逐字理由＝「当前 card-03 任务主要就是优化 build-code 的效率和执行，**怎么可能不改 build-code 的 SKILL 文件**！之前的决策有严重问题和歧义！」⇒ 五个阶段技能的方法章节全部计入本卡交付，处置＝`错开实施`；本卡 make-decision 阶段仍一行不写（T-013③ 不变） | 本轮用户消息（逐字原文） |
| T-036 | `skills/catalog.yaml` 的 `local_version: 1.3.0` 是否要 bump？ | A=不 bump，只回写两个 sha256／B=顺手 bump 到 1.3.1 并登记／C=交给 build-plan 时点定 | **用户逐字回答（未选任何选项）：「这个问题的前提条件有问题，不应该有任何逐文件-sha存在，这是核心的阻塞点！」** | 前提被否 ⇒ 本卡**零哈希动作**：不写、不算、不回写任何哈希（`skills/spec-plan/skill-bundle.json` 的 `files[].sha256`、`skills/catalog.yaml` 的 `local_bundle_hash`、`repo-skills.manifest.json` 相关字段）。该链属 OI-013 删除面（母 `prd.md:178` 责任卡含 CARD-06；同文件 `:244` 的 FR-29 逐字点名「材料身份/哈希/sha 校验」）⇒ **整表挂 CARD-06**，本卡不替它删除。消费者地图（8 处）与「已知代价」写进设计书 `## §6.8`、施工表 §6.1 第 42 行 |
| T-037 | Phase 的切分依据是什么（「按真实时长切 Phase」是否成立）？ | A=沿用「按真实时长切」／B=改为「按可独立验收、可独立提交的功能边界」切，时长只作诊断 | B | 用户逐字：「**请把『按真实时长切 Phase』去掉，1 个小时是我粗略的目标，不是硬指标**」。⇒ 切分依据＝**一个可独立验收、可独立提交的功能结果**（设计书 §14.2 的 I-3）；时长只作诊断，**不按时钟自动拆分或终止一个完整功能**（§14.3 I-11 的逐字草案）。此前这层意思只埋在 I-11 的草案正文里——`grep` 实测 `按真实时长`／`真实时长`／`一小时`／`强拆`／`硬指标`／`粗略` 在本文件与 `design.md` **全 0 命中**。⇒ 2026-09-28 升格为独立可检索的裁决记录（见 `design.md` §14.14.5），**不新增条文、不改任何文件** | 用户口头裁决（转述原文）；来源链见 `attachments/A5-doc-crosscheck.md` §2 的 X9（四文档同引「约一小时效率目标」，仓库 `grep` 0 命中，互引不构成独立证据） |
| T-038 | `A5-doc-crosscheck.md` §2 的 X1–X12 与 §3 的 ①–⑤ 怎么处置？ | A=全部落进本卡／B=只落与本卡方案有关的，其余登记为「外部文档事实更正」 | B | 12 条真值判定里与本卡有关的三条：**X6**（体量口径不完整——真值＝工作树 2,777 ＋ `T` 侧 6,448 文件/166M，已被 `design.md` 引用覆盖）、**X8**（四文档 8 处路径断链，真值根多一层 `Hugh/`；本卡 `attachments/` 的耐用副本不受影响）、**X9**（「约一小时效率目标」无落地来源，即 T-037 的来源）。其余 9 条是外部文档的事实更正与措辞更正，**不改变任何方案条目**。§3 的 ①–⑤ token 口径**采纳为引用纪律**：本卡任何引用 token 数字处必须写明属哪一种口径（本卡现行只引 21,135 秒静默，不是 token 口径）。⇒ `grep` 实测 `X1`…`X12`／`矛盾清单`／`口径混用`／`外置镜像`／`46,631,377`／`1,263,328,061` 此前在本文件与 `design.md` **全 0 命中**，本次补登记（见 `design.md` §14.14.6） | 主会话审计（2026-09-28；用户追问「所有需求都登记了吗」） |

六批答复的落点：T-001 决定 `## 任务身份` 的任务类型声明与问题面；T-002 落 OI-005、OI-007 与 `## 收敛检查` 的验收维度；T-003 落 OI-001、OI-006 与 `## 收敛检查` 的范围维度；T-004 落 OI-009（进度权威）；T-005 落 OI-010 与 `## 收敛检查` 的验收维度（证据绑定口径）；T-006 落 OI-011（执行卫生规则落点）；T-007 扩写 OI-011 并把「派发机制浪费的治理」写进 `## 范围`（落点含 `AGENTS.md` 通用委派纪律与四个阶段技能的「子代理产出契约」）；T-008 落 OI-009、OI-004 的载体（`skills/spec-plan/templates/phase-template.md`）；T-009 落 OI-003 与 `## 收敛检查` 的验收维度（取证方式）；T-010 细化 OI-010（删除跨 phase 全量快照绑定、登记为减少机器门禁）；T-011 落 OI-004（SD-11 五件套以事实记录形态落地）；T-012 落 OI-002 与 `## 收敛检查` 的验收维度（连续上下文判据）；T-013 落 OI-008 与 `## 范围`（只做 make-decision、build-plan 推迟到 CARD-04 合并之后）；T-014 落 OI-005 的落点（两技能各写角色 + 交叉引用）；T-015 落 OI-004 的并发口径（不写死数字、区间 2–5）。 本轮 T-016…T-025 的落点：T-016 落 OI-004 与 `## 补充登记` 第一节（五件套逐条覆盖率矩阵）；T-017 落 OI-007（显式裁决）与各 OI 的载体说明句；T-018 落 `## 补充登记` 第六节（推迟写面＝`runtime/evidence/**`、`runtime/stage/stage-runner.mjs`、`tools/cli/stage-runtime.mjs`）；T-019 与 T-021 落 OI-011 与 OI-004 的 acceptance（三条可观察形态 + 声明不实发现路径）；T-020 落 OI-003（阶段豁免表与阈值）；T-022 落 OI-004 的 `selected_disposition`／acceptance／counterexample；T-023 落 `CONTEXT.md`（另一子代理执行）；T-024 落 OI-007 与 OI-004 的 acceptance（独立审查判定 + **当前 stage 行**的 `finding_dispositions` 五值枚举、不成门；现仓 `facts.jsonl` 不收 quality fact）；T-025 落 `docs/adr/0034-*.md`（另一子代理执行）。

## 阶段集合校正（事实登记）

母任务 `prd.md` 与本卡 T-006 使用「五个阶段」并列举为 make-decision、build-prd、build-plan、build-code、verify-code；**仓库的正式 stage 集合不是这一组**：`runtime/task/task-store.mjs:9` 逐字 `const STAGES = new Set(["make-decision", "build-spec", "build-plan", "build-code", "verify-code"]);`，`docs/standard-workflow.md:29-38` 的正式 stage 表同此五项（`build-spec` 标「（pre/history）」，`:39` 逐字「`post` 不注册或执行 build-spec；它保留为 pre/history 的正式 stage，而不是死代码。」），而 `workflows/build-prd/SKILL.md:119` 逐字「Do not add `build-prd` to the canonical five stages or their stage manifests.」⇒ 卡面列举里的 `build-prd` 应按 `build-spec` 读。本卡 AC-15 的「五阶段逐一核对」以运行时正式五项为对象，`build-prd` 单列一行。

## 原始需求

来源锚点全部写到 `文件:行号`。五维覆盖用固定键名（全称见下表图例），取值 `—` 表示该维度对这条需求不适用或本卡不承担。

图例：`BG`=`business_goal`；`FS`=`flow_or_surface`；`DS`=`data_or_state`；`SFA`=`success_failure_acceptance`；`CND`=`constraint_non_goal_defer`。

| ID | 原始需求（逐字要点） | 来源锚点 | 五维覆盖 | 关联 OI | 当前处置 |
| --- | --- | --- | --- | --- | --- |
| R-001 | 「FR-11:五个阶段各自按工作类型派发子代理,实施/测试/审查上下文相互独立。」 | `specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md:299` | BG=五阶段统一工作方法、消除主会话自干与上下文混用；FS=make-decision/build-prd/build-plan/build-code/verify-code 五阶段派发面；DS=派发记录与子代理上下文标识；SFA=AC-11、AC-15；CND=不含审查工具选型与验收机制细节 | OI-001 | covered（按 T-003=A 落 OI-001：落点＝各阶段 `SKILL.md` 方法章节 + 计划期产物；实跑载体推迟到 CARD-04 合并后的 build-plan／build-code） |
| R-002 | 「FR-12:由审查或测试产生的修复回到原实施子代理,在连续上下文中完成。」 | `specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md:300` | BG=修复不换上下文，避免修复者缺原始实现知识；FS=审查/测试→修复回流路径；DS=「连续上下文」的判据与取证物；SFA=AC-11 后半（至少一次修复由原实施子代理承接）；CND=— | OI-002 | covered（按 T-012=A 落 OI-002：判据＝回到同一子代理会话，且派发须附审查／测试发现原文） |
| R-003 | 「FR-13:主会话不承担大量阅读或编辑,只做派发、回收与交互类技能执行。」 | `specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md:301` | BG=主会话上下文是稀缺资源，协调成本不得转移为自干；FS=主会话职责边界（派发/回收/交互类技能）；DS=「大量读写」的记录口径；SFA=AC-12；CND=— | OI-003 | covered（按 T-009=A 与 T-020=A 落 OI-003：事后人工判读一次 + 阶段豁免表与可指认阈值） |
| R-004 | 「FR-14:每个多工作包任务在计划阶段产出并行方案,含接口蓝图、依赖调度、并发数(2–5 以内)、worktree 隔离安排;每个并行工作包声明读集、写集、文件 owner、接口符号清单、合并责任,作为事实记录供验收核对;未声明或声明不实=验收失败事实,不阻断派发(SD-11 并行声明制,2026-09-19 第二轮按 OI-012 降级)。」 | `specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md:302` | BG=并行安全（不覆盖写入）且不引入新门；FS=计划阶段的并行方案产出与工作包声明；DS=接口蓝图/依赖调度/并发数/worktree 安排 + 每工作包五要素声明；SFA=AC-13；CND=声明缺失或不实只记验收失败事实，**不阻断派发** | OI-004 | covered（按 T-011=A、T-008=A、T-015=A、T-016=A、T-019=B、T-021=A、T-022=A 落 OI-004：事实记录形态 + 逐条覆盖率矩阵 + 三条可观察形态 + 合并责任与广播进 acceptance） |
| R-005 | 「FR-15:接口必须变更时执行 G-1 收场:停并行、主会话重排、记录作废批次,无静默不一致。」 | `specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md:303` | BG=接口变更时不留静默不一致；FS=G-1 收场流程（停并行→重排→继续）；DS=作废批次记录；SFA=AC-14；CND=— | OI-005 | covered（按 T-002=A、T-014=A 落 OI-005：AC-14 取演练 + 两个技能各写各的角色并交叉引用；技能文本落地推迟） |
| R-006 | 「AC-11(对应 FR-11/FR-12):条件=实跑一个多工作包实施 task;行为=观察派发记录;度量=实施/测试/审查子代理各有独立上下文证据(会话/上下文标识互不相同),且至少一次修复由原实施子代理承接。失败场景=审查与实施混在同一上下文,或修复换了上下文,即失败。」 | `specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md:305` | BG=验收 FR-11/FR-12 的真假；FS=多工作包实施 task 实跑；DS=会话/上下文标识、派发记录；SFA=本文即为成功/失败判据；CND=依赖「多工作包样例 task」存在（见 OI-007） | OI-007 | deferred（按 T-002=A、T-017=A 落 OI-007：真实载体在 CARD-04 合并后的 build-plan／build-code，本卡内以冻结候选／演练／不适用理由代替，裁决见 OI-007） |
| R-007 | 「AC-12(对应 FR-13):条件=同一实跑;行为=核对主会话动作;度量=主会话无大量读写事实(派发/回收/交互类之外的批量读写记录为 0)。失败场景=主会话自行完成大段实现或阅读,即失败。」 | `specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md:306` | BG=主会话边界可核对；FS=同一实跑的核对动作；DS=批量读写记录（须定口径，见 OI-003）；SFA=本文即为成功/失败判据；CND=— | OI-003 | covered（按 T-009=A、T-020=A 落 OI-003：本卡内以事后人工判读 + 阶段豁免表与阈值核对） |
| R-008 | 「AC-13(对应 FR-14):条件=检查该 task 计划产物;行为=核对并行方案;度量=方案含接口蓝图、依赖调度、并发数且并发数 ≤5 且 ≥2(若并行),每个并行工作包的读集/写集/文件 owner/接口符号清单/合并责任声明齐备,并被执行遵守。失败场景=并行方案或工作包声明缺失、实跑并发超上限,或实跑读写越出声明集(声明不实),即失败——声明缺失/不实按验收失败事实记录,不构成派发阻断(OI-012)。」 | `specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md:307` | BG=并行方案可核对且不成为门；FS=计划产物核对；DS=接口蓝图/依赖调度/并发数(2–5)/五要素声明；SFA=本文即为成功/失败判据；CND=不构成派发阻断 | OI-004 | covered（按 T-016=A、T-021=A、T-022=A 落 OI-004：逐条覆盖率矩阵、声明不实发现路径、合并责任；真实核对载体推迟到 CARD-04 合并后的 build-code） |
| R-009 | 「AC-14(对应 FR-15):条件=演练或实遇一次接口必须变更;行为=按 G-1 处置;度量=有停并行与重排记录,作废批次被显式登记,后续结果无静默不一致。失败场景=变更后并行继续且产生写集冲突或静默覆盖,即失败。」 | `specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md:308` | BG=G-1 可执行；FS=演练或实遇二选一；DS=停并行记录、重排记录、作废批次登记；SFA=本文即为成功/失败判据；CND=「演练还是实遇」须用户定（见 OI-005） | OI-005 | covered（按 T-002=A、T-014=A 落 OI-005：本卡内以演练记录满足） |
| R-010 | 「AC-15(对应 FR-11):条件=对五个阶段逐一核对;行为=确认同一工作方法适用;度量=五阶段均有按工作类型派发的实例或明确不适用理由。失败场景=任一阶段回到主会话全程自干且无理由记录,即失败。」 | `specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md:309` | BG=方法在五阶段都成立；FS=五阶段逐一核对；DS=每阶段的派发实例或不适用理由；SFA=本文即为成功/失败判据；CND=本卡 cohort=post，build-prd 在本路线不跑（见 OI-006） | OI-006 | covered（按 T-003=A 落 OI-006：build-prd 记明确不适用理由；五阶段 `SKILL.md` 的方法章节改动推迟） |
| R-011 | 卡面「结果与 consumer」+「流程/状态」：make-decision、build-prd、build-plan、build-code、verify-code 五阶段统一按**工作类型**派发子代理——实施/测试/审查各自独立上下文，修复回实施子代理保持连续上下文；主会话只派发、回收、执行交互类技能，不做大量读写；并行规则在计划阶段产出，即并行规则五件套(SD-11)；只给输入/写集/环境独立的工作；接口必须改时按 G-1 停并行重排；并行声明与接口冻结为事实记录+验收核对（非推进/派发前置）；consumer=用户(全部未来任务)与各阶段技能。流程：计划阶段→冻结接口蓝图→依赖感知调度生成并行分组(并发上限 2–5)→worktree 隔离派发→主会话回收结果→中心化验证瓶颈汇总。 | `specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md:295`、`prd.md:297` | BG=方法总纲与 consumer=全部未来任务+各阶段技能；FS=二阶段流程（计划期产出规则、执行期隔离派发与回收）；DS=并行分组/接口蓝图/作废批次；SFA=AC-11..AC-15；CND=事实记录+验收核对，非推进/派发前置 | OI-001、OI-004 | covered（按 T-003=A、T-007=A、T-012=A、T-014=A 落 OI-001 与 OI-004） |
| R-012 | 卡面 oracle 与依赖：「一个多工作包实施 task 实跑,留派发/回收与独立上下文证据;主会话无大量读写;并发上限被遵守;G-1 场景演练记录存在;不承诺提速比例(并行收益实测留后续)。」准备依赖=CARD-01 拓扑；实现依赖=CARD-01；验收依赖=多工作包样例 task；合并依赖=方法写入各阶段技能，与 CARD-04/05/07 的阶段写面以冻结接口协调(Group 1)。 | `specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md:310`、`prd.md:311-315` | BG=oracle 与依赖链清楚；FS=多工作包实施 task 实跑；DS=派发/回收证据、演练记录；SFA=oracle 五条即验收取材；CND=不承诺提速比例；样例 task 不存在则为覆盖限制 | OI-007、OI-008 | deferred（按 T-002=A、T-017=A 落 OI-007：多工作包实跑 oracle 与派发／回收证据的真实载体在 CARD-04 合并后的 build-plan／build-code，本卡内以冻结候选与演练核对代替，裁决见 OI-007） |
| R-013 | 「SD-11 并行规则五件套」（逐字）：「并行规则在计划阶段产出：①接口蓝图冻结（文件级符号与 import 图）；②依赖感知调度；③中心化验证瓶颈；④worktree 隔离；⑤**并发上限 2–5 个子代理**（用户原话定稿，取代决策记录中「硬上限起始 3–5」的旧表述）。并行仅用于输入、写集与环境独立的工作包；共享写面或真实发布依赖先协调，不为并行转移整合成本；接口必须改时按 G-1 停并行、主会话重排后继续。并行声明制：每个并行工作包在 build-plan 声明读集、写集、文件 owner、接口符号清单、合并责任，作为**事实记录**供验收核对；未声明或声明不实（实跑读写越出声明集）＝验收失败事实，如实记录，不阻断派发。接口蓝图冻结同按 OI-012 降级为事实记录＋验收核对，不构成推进前置。」 | `specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md:70`（节标题 `:69`、来源锚点 `:71`；已逐字复核） | BG=并行安全（不覆盖写入）且不新增门；FS=计划阶段产出五件套；DS=接口蓝图/依赖调度/验证瓶颈/worktree 隔离/并发上限 2–5 + 每工作包五要素声明；SFA=AC-13 取材（`prd.md:307`）；CND=声明制＝事实记录+验收核对，未声明或不实只记验收失败事实、不阻断派发 | OI-004 | covered（按 T-011=A 落 OI-004 以事实记录形态；T-016=A 另降为并列条款之一并加逐条覆盖率矩阵） |
| R-014 | 「SD-17 两道人为门与零机器门禁」（逐字）：「新系统仅有两道人为门——①推进中的人为确认对话；②不可逆 Git 授权（宪法级）。其余一切机器/流程校验（revision 绑定链、快照树认证、材料身份/哈希/sha 校验、回执 readback 校验等）均不构成阶段推进、审查派发、测试执行的前置；规则类要求（迁移表冻结、并行声明、接口蓝图冻结）一律为**事实记录＋验收核对**——未做或做假＝验收失败事实，如实记录，不阻断推进。记录层不用内容寻址哈希：普通文件名（不可变命名：日期＋序号＋描述，append-only）＋纯文本路径引用。质量＝真实执行＋独立审查＋人确认。**显式区分**：本规划任务自身 build-prd 使用过的 revision 绑定是现行系统合同，与本次新系统设计无关，不因此保留。」 | `specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md:94`（节标题 `:93`、来源锚点 `:95`；已逐字复核） | BG=薄核心、不新增机器门，质量靠真实执行+独立审查+人确认；FS=推进/审查派发/测试执行三条路径；DS=记录层用普通文件名（日期+序号+描述，append-only）+纯文本路径引用，不用内容寻址哈希；SFA=AC-13/AC-14 的「不阻断派发」取材；CND=两道人为门之外一切机器门禁删除，迁移表冻结/并行声明/接口冻结降级为事实记录+验收核对 | OI-004、OI-008、OI-010 | covered（按 T-005=B、T-010=A、T-024=A 落 OI-004 与 OI-010：只记录、不得成为新门禁） |
| R-015 | 母任务 OI-012 记录（逐字）——question：「「不应该有任何阻塞」的边界：新系统保留哪些门、删除哪些机器/流程门禁？」；selected_disposition：「只留两道人为门，其余机器门禁全删；冻结/声明类机制降级为事实记录+验收核对」；acceptance：「抽真实任务：无机器门禁阻断推进；两道人为门仍在。」；counterexample：「若某机器校验仍阻断推进（除两道人为门），即违反。」 | `specs/workflowhub-thin-core-rebuild-planning-20260919/decision-log.md:417-437`（`status: confirmed`；已逐字复核） | BG=「不应该有任何阻塞」的边界；FS=门禁清单与派发面；DS=冻结/声明类机制的记录形态（事实记录+验收核对）；SFA=acceptance/counterexample 原文即判据；CND=机器门禁全删、降级语义 | OI-004、OI-010 | covered（按 T-010=A、T-024=A 落 OI-004 与 OI-010：声明制降级为事实记录、只能记录不得成为新门禁，机制修补口径＝只留该 phase 声明的写集） |
| R-016 | 母任务 OI-002 记录（逐字）——question：「真实任务为何串行或上下文重复，怎样安排实现、测试、审查与修复才能减少等待且不转移协调成本？」；resolution：「已收敛（Round 3，经 U-009 第 1 条扩大到全部阶段）：make-decision、build-prd、build-plan、build-code、verify-code 都采用同一工作方法——按工作类型派发实施、测试、审查等子代理且各自独立上下文；修复回到实施子代理连续完成；主会话只做派发、回收与交互类技能，不做大量阅读或编辑，以保持主会话上下文干净并减少自动压缩次数。并行规则在计划阶段产出：先冻结接口蓝图（文件级符号与 import 图），再做依赖感知调度，保留中心化验证瓶颈，worktree 隔离并设硬并发上限（起始 3-5），只给输入、写集、环境独立的工作。」；selected_disposition：「全部阶段按工作类型派子代理，计划阶段产出并行规则，主会话只派发与回收」；acceptance：「每个阶段都给出派发与并行方案，主会话不承担大量读写」；counterexample：「回到每 task 单代理串行或让主会话自己干活」 | `specs/workflowhub-thin-core-rebuild-planning-20260919/decision-log.md:212-233`（`status: confirmed`；已逐字复核。**`:195-216` 不是本记录**：OI-001 记录为 `:190-211`，`:195-216` 是跨 OI-001 尾与 OI-002 头的错误切片，不作锚点） | BG=任务串行/上下文重复的现状缺口；FS=五阶段统一派发 + 修复回流原实施子代理；DS=并行规则（接口蓝图/调度/瓶颈/worktree/上限）；SFA=acceptance/counterexample 原文即判据；CND=并行规则在计划阶段产出（本卡只需产出方法，不承诺提速比例） | OI-001、OI-002、OI-003 | covered（按 T-003=A、T-007=A、T-012=A 落 OI-001、OI-002、OI-003：按工作类型派发 + 连续上下文 + 主会话边界） |
| R-017 | U-001 八点之第 4 点（逐字）：「4：build-code提速：每一个task的实现、审查、测试、修复应该是一个独立的子代理，避免上下文互相影响。主会话收集回复、派发任务、进行归纳和验收。同时，多个子代理、多个task、多个phase还可以设计并行规则，避免全部子代理都只能串行浪费时间！」 | `specs/workflowhub-thin-core-rebuild-planning-20260919/decision-log.md:52`（U-001 节 `:46-57`，八点正文 `:49-56`；已逐字复核） | BG=子代理隔离与并行提速的原始要求；FS=实现/审查/测试/修复四类独立子代理 + 主会话收集/派发/归纳/验收；DS=—；SFA=AC-11（`prd.md:305`）、AC-12（`prd.md:306`）；CND=— | OI-001、OI-003 | covered（落 OI-001 与 OI-003：五阶段统一派发 + 主会话边界；派发纪律与子代理产出契约的落点另见 OI-011，与 T-007=A 一致） |
| R-018 | U-009 第 1 条（逐字）：「1. **不止 build-code，所有阶段都要“派子代理 + 并行设计”**：`make-decision`、`build-prd`、`build-plan`、`verify-code` 都要用同一套工作方法——主会话不要一直干活，把工作尽量派给子代理；能并行的尽量并行；主会话只负责**派发、回收和交互类技能**；保证主会话上下文干净，**减少自动压缩次数**。」 | `specs/workflowhub-thin-core-rebuild-planning-20260919/decision-log.md:105`（U-009 节 `:103-109`；已逐字复核） | BG=主会话上下文干净、减少自动压缩次数；FS=五阶段（make-decision/build-prd/build-plan/verify-code + build-code）统一方法；DS=—；SFA=AC-11…AC-15（`prd.md:305-309`）；CND=— | OI-001 | covered（按 T-003=A 落 OI-001：五阶段统一派发，build-prd 记不适用理由） |
| R-019 | U-010 第 1 条（逐字）：「1：workflowhub任务执行时，大量的质量、流程阻塞，我希望彻底移除。workflowhub是一个薄核心的开发技能集，不应该有任何阻塞；」 | `specs/workflowhub-thin-core-rebuild-planning-20260919/decision-log.md:113`（U-010 节 `:111-118`；已逐字复核） | BG=彻底移除质量/流程阻塞；FS=任务执行期的门禁面；DS=—；SFA=AC-13（`prd.md:307`）、AC-14（`prd.md:308`）；CND=薄核心技能集、不应有任何阻塞（对应母任务 OI-012 与 SD-17） | OI-004、OI-010 | covered（按 T-010=A 落 OI-010：删除跨 phase 全量快照绑定） |
| R-020 | 卡片清单 CARD-03 行（逐字）：「CARD-03 全阶段子代理工作方法与并行规则｜五阶段统一按工作类型派子代理;并行规则五件套落地,声明制为事实记录+验收核对｜R-004/R-015/R-010、OI-002/OI-012」；追踪表三行（逐字）：R-004「U-001#4:子代理隔离、主会话协调、可并行｜SD-11(含并行声明制);FR-11..FR-15｜CARD-03｜AC-11..AC-15｜并行声明(读集/写集/owner/接口符号/合并责任)为事实记录+验收核对;未声明/不实=验收失败事实,不阻断派发(R8 按 OI-012 降级,第二轮)」；R-015「U-009#1:全部阶段派子代理+计划并行｜SD-11;FR-11..FR-15｜CARD-03｜AC-11..AC-15｜—」；R-010「U-002:大白话交互、主会话只派发与交互技能｜FR-13/38｜CARD-03/07｜AC-12/38｜派发方法归 03;大白话交互形态归 07」 | `specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md:109`（卡片清单行）、`prd.md:144`（R-004 行）、`prd.md:150`（R-010 行）、`prd.md:155`（R-015 行）（追踪表 `:137-160`；已逐字复核） | BG=本卡在整体路线中的位置（Group 1 方法层）；FS=卡片清单与追踪表映射；DS=—；SFA=追踪表 R-004/R-015→AC-11..AC-15、R-010→AC-12；CND=依赖 CARD-01 拓扑；与 CARD-07 分工：派发方法归 03、大白话交互形态归 07 | OI-001、OI-008 | covered（按 T-013 落 `## 范围` 与 `## 非目标`；**无对应问题卡**，理由：本行是卡片清单与追踪表的映射登记，不是一条可独立发问的需求；同表 CARD-06 删除执行与 CARD-10 集成验收不是本卡目标，与 CARD-04 按 OI-008 时间错开） |

## 范围

按母任务 PRD `specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md:296` 原文：

> 五阶段统一的子代理派发方法、主会话职责边界、计划阶段并行规则产出、G-1 收场流程。不含审查工具选型(CARD-05)、验收机制细节(CARD-04)。

补充界定（均为本卡自设的边界声明；其中最后两条已由 T-007=A 与 T-013 自定义答复确认）：

- 本卡交付「方法 + 声明 + 取证口径」，落在各阶段技能与计划期产物上；**不**新增 stage、**不**新增 gate、**不**新增控制面。
- 并行声明与接口冻结一律按 `prd.md:302`/OI-012 记为**事实记录 + 验收核对**，非推进/派发前置。
- 本卡 `cohort=post`，路线为 make-decision → build-plan → build-code → verify-code，**不跑 build-spec**。
- 本卡范围**包含**「派发机制浪费」的治理（T-007=A）：在 `AGENTS.md` 补一条**通用委派纪律**，并补齐四个阶段技能里缺失的「子代理产出契约」（先落盘、只回摘要、按子问题增量）。**风险（如实登记）**：写面变大，且 `AGENTS.md` 是常驻上下文文件，条款必须克制。
- 本卡当前**只做 make-decision**（T-013 用户自定义答复）：build-plan 推迟到 CARD-04 交付并合并进 main 之后再启动；make-decision 阶段**不实际改任何 `workflows/*/SKILL.md`**，只产出接口/方法面的冻结候选与计划；与 CARD-04 的挂起碰撞由**时间错开**消解，不需现在交涉。**（2026-09-28 部分推翻）**：用户「现在全落」，`workflows/build-spec/SKILL.md`、`workflows/build-code/SKILL.md`、`workflows/build-code/steps.json` 已实际落盘（见 12.3/12.5）；原「不实际改任何 `workflows/*/SKILL.md`」冻结仅对 runtime 代码层（`runtime/evidence/**` 等，见 `## 决定` T-018 条）仍然有效。原待确认项（steps.json 是否属冻结范围）已由事实回答：该文件已改（step 9 observable_result 按 P7a 整值替换＋step 11 绑定判据句追加），请用户在 step 10 追认。

## 非目标

- **不含审查工具选型**（母 PRD `prd.md:296` 明写归 CARD-05）。
- **不含验收机制细节**（母 PRD `prd.md:296` 明写归 CARD-04）。
- 不含 CARD-01 的阶段拓扑与入口分流改造（`prd.md:311-312` 记为准备/实现依赖，本卡只消费）。
- 不含并行收益的实测与量化（`prd.md:310` 明写「不承诺提速比例」；`prd.md:318` 列为可后置技术项）。
- 不含具体调度数据结构（`prd.md:318` 留本卡 build-plan）。
- 不含 CARD-06 的删除执行与 CARD-10 的总体集成验收执行。

## 唯一 OI 大纲（current authority）

本文件**只有这一份** OI 清单，是当前唯一权威（`outline_version: v1`，round-1 初稿；后续各批答复落点——T-004/T-005/T-006、T-007…T-009、T-010…T-012、T-013、T-014/T-015——一律按「后续任何 OI 的新增、改写或关闭都必须在本节内就地更新」的纪律**就地追加**进本节两张表与 `## OI records`，版本号不变）。两张表的表头与字段形状对齐官方作者模板 `skills/decision-log/templates/decision-log-template.md:47-67`：framework 表含 `node_id`/`framework_node`/`oi_ids`/`empty`/`reason`，category 表含 `category`/`oi_ids`/`empty`/`reason`；中文表述列保留为「承重内容」「证据状态」，同一信息只有一处权威。后续任何 OI 的新增、改写或关闭都必须在本节内就地更新，禁止另建第二份清单（不生成 `oi.md`、不生成 `open-items.md`、不生成 plan.md 与 tasks.md 双写）。

每行的取值规则（`workflows/make-decision/SKILL.md:43-50`）：每行要么引用一个本任务 OI 编号，要么写 `empty: true` + 具体原因；遗漏行、裸 `none`、重复行、替换行都算缺口。

### Framework nodes

| node_id | framework_node | oi_ids | empty | reason | 承重内容 | 证据状态 |
| --- | --- | --- | --- | --- | --- | --- |
| N-background | background | OI-001 | false | 背景节点由 OI-001 承重，母任务语料已逐字登记于 R-013…R-020 | 五阶段统一按工作类型派发的现状缺口与本卡动机（主会话自干、实施/测试/审查上下文混用） | 已收敛（T-003=A）；母任务语料已逐字登记于 R-013…R-020 |
| N-problem | problem | OI-002 | false | 问题节点由 OI-002 承重，判据已由 T-012=A 定案 | 「修复回原实施子代理」是硬要求；「连续上下文」＝回到同一个子代理会话（允许被压缩过），派发时必须附审查/测试发现的原文 | 已收敛（T-012=A） |
| N-goal | goal | OI-003 | false | 目标节点由 OI-003 承重，取证方式已由 T-009=A 定案 | 主会话职责边界要可核对：事后人工判读一次（把主会话动作列清单、逐条标「派发/回收/交互」或「批量读写」），零新增机制 | 已收敛（T-009=A） |
| N-solution | solution | OI-004、OI-009、OI-010、OI-011 | false | 方案节点由四条 OI 共同承重；本卡只做 make-decision，方案实际落盘待 CARD-04 合并后的 build-plan | 并行方案与工作包声明的内容、字段形态与取证方式（含声明制降级语义）；进度权威＝`facts.jsonl` 的 `phase_progress` 游标（phase 文件只读指针）；证据绑定＝该 phase 声明的写集，并**删除跨 phase 的全量快照绑定**；三条执行卫生规则 + 通用委派纪律的落点 | OI-009 已收敛（T-004=A+T-008=A）；OI-010 已收敛（T-005=B+T-010=A）；OI-011 已收敛（T-006=A+T-007=A）；OI-004 已收敛（T-011=A+T-015=A+T-008=A） |
| N-acceptance | acceptance | OI-007 | false | 验收节点由 OI-007 承重，验收样例 task 的选择已由 T-002=A 定案 | 验收样例 task 的选择——不另起样例 task，主证据＝card-03 自身执行事实，缺场景用显式演练补 | 已收敛（T-002=A） |
| N-extension | extension | OI-008 | false | 扩展节点由 OI-008 承重，处置已由 T-013 自定义答复定案 | 与 CARD-04/05/07 的写面接口与集成责任（SD-14 冻结接口顺序）；已发生硬碰撞 1 处（`tools/cli/stage-runtime.mjs` `@@ -1483` +7−1，T-013 登记时实测）；本轮 20:xx 复核该文件仍在 CARD-04 在研写面（现为 `@@ -1486 +1486,6 @@`），且撞车面另含 `workflows/build-code/SKILL.md`、`workflows/verify-code/SKILL.md` 等 13 个文件，明细见 `## 补充登记` 第七节 | 已收敛（T-013 自定义答复）：build-plan 推迟到 CARD-04 交付并合并进 main 之后 |

### Fixed categories

| category | oi_ids | empty | reason | 承重内容 | 证据状态 |
| --- | --- | --- | --- | --- | --- |
| complete_user_flow | OI-001、OI-011 | false | 完整流程节点由 OI-001 与 OI-011 承重（派发方法 + 执行卫生与委派纪律） | 完整流程：计划阶段→冻结接口蓝图（事实记录：接口符号清单，不叫冻结）→依赖感知调度生成并行分组（并发区间 2–5，起手 3–5 且不随任务数增长）→worktree 隔离派发（配套：每 worktree 重装依赖、搬 gitignored `.env`、禁 symlink 依赖、分支独占改 detached HEAD、磁盘 O(N)、清理/恢复是状态机）→主会话回收→中心化验证瓶颈汇总；并发方广播「我已完成的改动」；执行卫生（长命令后台化/只读动作批量并行/子代理增量落盘只回传摘要） | OI-001 已收敛（T-003=A）；OI-011 已收敛（T-006=A+T-007=A） |
| page_scope |  | true | 本卡 `ui_applicability=non_ui`（`specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md:316`），无页面/交互/前端组件面；不适用而非缺口 | 无页面/交互/前端组件面 | 已确认（三源一致，见本文件 `## UI applicability`） |
| data_state | OI-004、OI-009 | false | 数据状态节点由 OI-004 与 OI-009 承重（声明面与进度权威） | 并行方案与工作包声明即本卡的事实记录面：接口符号清单、依赖调度、并发数、worktree 安排、读集/写集/文件 owner/接口符号清单/合并责任；进度权威＝`facts.jsonl` 的 `phase_progress` 游标（phase 文件只声明 `progress_cursor` 指针） | OI-009 已收敛（T-004=A+T-008=A）；OI-004 已收敛（T-008=A+T-011=A+T-015=A） |
| success_failure_boundary | OI-002、OI-005、OI-010 | false | 成功/失败边界由 OI-002、OI-005、OI-010 承重（现仓 `grep "G-1" workflows/ docs/ runtime/` 零命中，收场规则待落地） | 接口必须变更时的失败/异常边界：G-1 停并行、主会话重排、作废批次登记、无静默不一致；连续上下文判据＝同会话 + 附审查/测试发现原文；证据绑定＝该 phase 声明的写集，并删除跨 phase 全量快照绑定 | OI-002 已收敛（T-012=A）；OI-005 已收敛（T-002=A+T-014=A）；OI-010 已收敛（T-005=B+T-010=A） |
| non_goals | OI-008 | false | 非目标边界由 OI-008 承重（含与 CARD-06 的残留登记关系） | 与 CARD-04（验收机制细节）、CARD-05（审查工具选型）、CARD-07（make-decision 写面）、CARD-06（删除执行与残留全量绑定登记）的边界与集成责任 | OI-008 已收敛（T-013 自定义答复）：时间错开 |
| deferred | OI-006 | false | 延期项由 OI-006 承重（build-prd 不跑；方案实际落盘按 T-013 推迟） | build-prd 在 post 路线不跑的处置；并行收益实测与调度数据结构留 build-plan；build-plan 本身按 T-013 推迟到 CARD-04 交付并合并进 main 之后 | 已收敛（T-003=A / T-013）：记「明确不适用理由」，方法章节照样改到位 |

## OI records

本卡自己的编号空间，从 OI-001 起，共 11 条，**全部 `status: confirmed`**（终态四字段就地登记在下方 yaml 记录内，同一份权威、不另列第二份清单）。字段形状对齐官方作者模板 `skills/decision-log/templates/decision-log-template.md:69-91`，读者消费见 `runtime/stage/stage-content-contracts.mjs#analyzeDecisionOutline`（原记 `:3307`，现 `:3462`；yaml 记录解析见 `#parseOiYamlBlocks`，原记 `:3232-3243`、现 `:3387` 起）。收敛来源：OI-001 / OI-005 / OI-006 / OI-007 由第一批答复（T-001…T-003，逐字「A A A」）收敛；OI-009 / OI-010 / OI-011 由第二批（T-004…T-006，逐字「A、B、A」）收敛；OI-003 由第三批（T-009=A）收敛；OI-002、OI-004 由第四批（T-010…T-012，逐字「A A A」）收敛；OI-008 由第五批（T-013 自定义答复）收敛；OI-004 另由第三批（T-008=A）与第六批（T-015=A）补充，OI-005 的落点由第六批（T-014=A）补充，OI-009 的载体由 T-008=A 补充，OI-010 的口径由 T-010=A 细化，OI-011 的范围由 T-007=A 扩写。`requires_user_decision: true` 适用于方向级与验收级问题；`visible_group_id` 取值＝该 OI 收敛时所在的那一批可见问答组（批次名；approve-decision 尚未执行）。

```yaml
ois:
  - task_id: workflowhub-thin-core-card-03-20260919
    outline_version: v1
    oi_id: OI-001
    category: complete_user_flow
    source: '`specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md:299`、`prd.md:309`（FR-11/AC-15）；本轮用户消息 T-003=A'
    question: '五阶段统一按工作类型派发子代理，实施/测试/审查各自独立上下文——这条方法要落到哪里才算「五阶段都适用」？`cohort=post` 时不跑的 build-prd 怎么记？'
    status: confirmed
    selected_disposition: '五阶段统一按工作类型派发的落点＝各阶段 `SKILL.md` 方法章节 + 计划期产物；`cohort=post` 不跑 build-prd 时记「明确不适用理由」，派发实例证据由后续 pre 路线任务承担。本轮 T-013 补充：本卡 make-decision 阶段不实际改任何 `workflows/*/SKILL.md`，实际落盘待 CARD-04 交付合并后的 build-plan 与 build-code；本轮只产出接口与方法面的冻结候选与计划。单一事实源＝`AGENTS.md` 通用工作纪律段的委派纪律与「子代理产出契约」（T-007=A 定的那一条），五阶段 `SKILL.md` 各引用一次、不复制正文（对齐 T-006=A 与本文件 `:31` 的「同一信息只有一处权威」）。'
    evidence: '本轮用户消息 T-003=A；母 PRD `specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md:299`、`prd.md:309`；本轮 T-013 自定义答复'
    impact_dimensions: [scope, acceptance]
    acceptance: 'AC-15（`specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md:309`）：五阶段均有按工作类型派发的实例或明确不适用理由本轮 T-017=A 补载体说明：本条 acceptance 的真实载体在 CARD-04 合并后的 build-plan／build-code，本卡内以冻结候选／演练／不适用理由代替。'
    counterexample: '任一阶段回到主会话全程自干且无理由记录（AC-15 失败场景）；或方法只在本文件声称已落地而五阶段 `SKILL.md` 未产出'
    requires_user_decision: true
    visible_group_id: G-任务类型与验收载体
  - task_id: workflowhub-thin-core-card-03-20260919
    outline_version: v1
    oi_id: OI-002
    category: success_failure_boundary
    source: '`specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md:300`、`prd.md:305`（FR-12/AC-11）；本轮用户消息 T-012=A'
    question: '「修复回到原实施子代理，在连续上下文中完成」——「连续上下文」用什么判据认定？可取证物是什么（会话标识？派发记录？）？换个上下文但带着完整交接算不算失败？'
    status: confirmed
    selected_disposition: '「连续上下文」＝**回到同一个子代理会话**（允许该会话中途被上下文压缩过）；派发时**必须附上审查/测试发现的原文**，不带原文的重新派发不算连续上下文。被拒：B＝必须全程未被压缩/回收（真实长任务几乎必然做不到，审计里单会话被压缩 5–49 次，会把 FR-12 变成永久失败条款）；C＝不要求同会话、带交接就算（等于 FR-12 无约束）。风险（如实登记）：「被压缩过还算不算原上下文」会有争议，验收时须明写口径。'
    evidence: '本轮用户消息 T-012=A；母 PRD `specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md:300`、`prd.md:305`（FR-12/AC-11）'
    impact_dimensions: [acceptance]
    acceptance: 'AC-11 后半（`specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md:305`）：同一次修复由原实施子代理承接，且该次派发附有审查/测试发现的原文；判定取自独立上下文本轮 T-017=A 补载体说明：本条 acceptance 的真实载体在 CARD-04 合并后的 build-plan／build-code，本卡内以冻结候选／演练／不适用理由代替。'
    counterexample: '修复换到新的子代理会话、或派发时未附审查/测试发现原文（AC-11 失败场景）；反向也失败：把「曾被上下文压缩过」判为不连续，使 FR-12 成为必然失败条款'
    requires_user_decision: true
    visible_group_id: G-绑定口径与并行形态
  - task_id: workflowhub-thin-core-card-03-20260919
    outline_version: v1
    oi_id: OI-003
    category: success_failure_boundary
    source: '`specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md:301`、`prd.md:306`（FR-13/AC-12）；本轮用户消息 T-009=A'
    question: '「主会话不承担大量阅读或编辑」——「大量」的可核对度量是什么？派发/回收/交互类之外的批量读写记录如何记为 0？'
    status: confirmed
    selected_disposition: '事后人工判读一次：把主会话本次真实做过的动作列成清单，逐条标「派发/回收/交互」还是「批量读写」，判读一次并如实记录；**零新增机制**（不建记录文件、不加统计）。被拒：B＝建轻量记录文件（与「不要任何机制统计 token/时间」的要求正面冲突）；C＝不取证只写结论（AC-12/AC-13 会变成不可证伪的空话）。风险（如实登记）：只有一次抽样、不可持续，只能证明「本次做到了」。本轮 T-020=A 补处置（红队 F-4：FR-13 与 make-decision 的 M 独占步骤结构性冲突，AC-12 必失败或必豁免）：补一张**阶段豁免表**——make-decision 的 step 1 load-context、step 5 outline-talk、step 6 grill-with-docs、step 7 module-convergence、step 12 publish-decision 的决策记录写入，其读写不计入「大量读写」；并给「大量」一个**可指认阈值**（表与阈值见 `## 补充登记` 第二节）。被拒：B＝把 FR-13 缩到只约束 build-code；C＝不处置。'
    evidence: '本轮用户消息 T-009=A；母 PRD `specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md:301`、`prd.md:306`（FR-13/AC-12）'
    impact_dimensions: [acceptance]
    acceptance: 'AC-12（`specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md:306`）：主会话动作清单存在且逐条分类，除「派发/回收/交互」类之外的批量读写记为 0；判定取自独立上下文本轮 T-020=A 补：判读时按阶段豁免表与可指认阈值执行——豁免步骤的动作不计入，其余动作按阈值判定（见 `## 补充登记` 第二节）。'
    counterexample: '没有动作清单、或清单与真实执行不符；或再次出现主会话批量读写文件却仍判通过（AC-12 失败场景）'
    requires_user_decision: true
    visible_group_id: G-派发纪律与模板载体
  - task_id: workflowhub-thin-core-card-03-20260919
    outline_version: v1
    oi_id: OI-004
    category: data_state
    source: '`specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md:302`、`prd.md:307`（FR-14/AC-13）；本轮用户消息 T-011=A、T-015=A、T-008=A'
    question: '并行方案与每个工作包的声明，具体写成什么内容、放在哪个计划产物、以什么方式取证供验收核对？并发数 2–5 的下限是硬要求还是「若并行」的条件要求？'
    status: confirmed
    selected_disposition: '并行方案与工作包声明一律以**事实记录**形态落地（声明制降级语义，按 `specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md:302` 与母任务 OI-012），不改需求字面：①SD-11① 的「接口蓝图冻结（文件级符号与 **import 图**）」按母任务 OI-012 降级为事实记录、不构成推进前置（判定＝业界零先例且方向与实证相反，见 `## 补充登记` 第一节）——它与 FR-14 要求工作包声明的「接口符号清单」**不是一回事**：后者是事实记录项、单独登记，不并入前者，也不为 import 图落任何冻结产物；②补上并发方广播「我已完成的改动」（arXiv:2609.25396：构造场景干扰率 97%，一条广播消息恢复 82% 的 runs）；③worktree 隔离配套清单（每 worktree 重装依赖、搬 gitignored `.env`、禁 symlink 依赖、分支独占改 detached HEAD、磁盘 O(N)、清理/恢复是状态机）；④并发写「起手 3–5，且不随任务数增长」。载体＝**扩展现有** `skills/spec-plan/templates/phase-template.md`（T-008=A，保持单一权威；风险方向本轮已更正：该模板的契约测试断言全为子串包含式、纯新增字段不红，真实硬失败路径是 skill bundle 哈希链——须同批刷新 `skills/spec-plan/skill-bundle.json:11` 与 `skills/catalog.yaml:335`，见 `## 补充登记` 第七节）。并发口径＝不写死数字，把 SD-11 的「2–5」当**区间约束**写进五阶段共用纪律，每任务在 build-plan 的并行方案里逐任务定，并把 `workflows/make-decision/SKILL.md:357` 现有的「研究 4 / debate 4 / 红蓝 2」与区间对齐（T-015=A）。被拒：B＝严格照 SD-11 字面（引入三家主流 agent 团队都没做的机制）；C＝照字面 + 存疑注记；并发侧被拒：B＝写死 3、C＝保持现状 4/4/2。风险（如实登记）：与 SD-11 字面的「冻结」有措辞差，验收要能被判为「已按 OI-012 降级为事实记录」；并发区间宽松，验收只能判「在不在区间内」。外部证据要点：写集声明在业界**没有机器校验先例**（Claude Code agent teams 只有一句 best practice，无组件校验）；依赖门禁假阻塞有官方自认（`Task status can lag … which blocks dependent tasks`）；文本级合并冲突率 27.67%（arXiv:2604.03551）与接口干扰率 1/834≈0.12%（arXiv:2609.25396）是**两个不同问题，引用不得混用**。本轮 T-016=A 细化：五件套**降为并列条款之一**，与四条有实测数字支撑的条款（禁子代理继承父代理全部对话、取消空转轮询、把跨 phase 的全量快照绑定收窄到该 phase 声明的写集、禁重复读同一文件／重跑同一测试）**同等权重**，并加一张逐条覆盖率矩阵（每条标注有实测支撑／无实测支撑／方向相反 + 证据 ref，见 `## 补充登记` 第一节）。本轮 T-022=A 补合并责任：采用外部一手做法——**产出方自己提交／开 PR**；**失败时换一个新执行者重做，不回滚**。本轮 T-019=B 与 T-021=A 补可观察形态：只把最贵的三条（禁继承全部对话、禁空转轮询、声明不实的发现路径）写成可观察形态，其余条款保持原则性短措辞；声明不实的发现路径与呈现位置见 `## 补充登记` 第三节。'
    evidence: '本轮用户消息 T-011=A、T-015=A、T-008=A；母 PRD `specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md:302`、`prd.md:307`（FR-14/AC-13）；`skills/spec-plan/templates/phase-template.md`；`workflows/make-decision/SKILL.md:357`'
    impact_dimensions: [scope, acceptance]
    acceptance: 'AC-13（`specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md:307`）：每个工作包有读集/写集/文件 owner/接口符号清单/合并责任的事实记录，可被验收核对；并行方案写明并发区间内取用的值；不存在把声明当推进前置的门本轮 T-022=A 与红队 F-10 补：合并责任＝产出方自己提交／开 PR、失败换新执行者重做不回滚；并发方**广播「我已完成的改动」**是否实际发生是可核对项；声明不实的发现方式与呈现位置＝`## 补充登记` 第三节列出的实跑核对动作，落到**当前 stage 行**的 `finding_dispositions`（`runtime/stage/completion-predicates.mjs:124` 的五值枚举 `fixed`／`rejected_invalid`／`accepted_risk`／`needs_human`／`user_decided`；现仓 `facts.jsonl` 只接受 `stage`／`close_action` 两种行、并显式拒绝 quality fact，见 `runtime/task/task-store.mjs:220` 与 `:179`）（只能记录、不得成为新门禁）。本轮 T-017=A 补载体说明：本条 acceptance 的真实载体在 CARD-04 合并后的 build-plan／build-code，本卡内以冻结候选／演练／不适用理由代替。'
    counterexample: '工作包缺少声明字段、或声明与真实执行不符（AC-13 失败场景）；反向：把并行声明做成派发前置的门，或把并发数写死成硬门本轮 T-022=A 补反向场景：把回滚当作失败处置（而不是换一个新执行者重做）、或把合并责任收拢回主会话代提交；以及跑了并发却没有任何「已完成改动」广播、或声明不实却无人按 `## 补充登记` 第三节的核对动作回放。'
    requires_user_decision: true
    visible_group_id: G-绑定口径与并行形态
  - task_id: workflowhub-thin-core-card-03-20260919
    outline_version: v1
    oi_id: OI-005
    category: complete_user_flow
    source: '`specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md:303`、`prd.md:308`（FR-15/AC-14）；本轮用户消息 T-002=A、T-014=A'
    question: 'G-1 收场流程（停并行→主会话重排→记录作废批次）的处置细则是什么？AC-14 允许「演练或实遇」，本卡取哪一种？'
    status: confirmed
    selected_disposition: 'AC-14 的 G-1 场景取「演练」而非实遇；演练记录与 card-03 自身执行事实共同作证据。本轮 T-014=A 补落点：**两个技能各写各的角色**——`workflows/build-plan/SKILL.md` 写「接口清单与并行方案怎么产出」，`workflows/build-code/SKILL.md` 写「实施中真发现接口必须改时的收场动作：停谁、谁重排、作废批次怎么登」，两处**交叉引用**防漂移。现仓 `grep "G-1" workflows/ docs/ runtime/` 为**零命中**，只有方向级定义（`specs/workflowhub-thin-core-rebuild-planning-20260919/decision-log.md:855`、同目录 `prd.md:70/297/303/308`），无任何可执行步骤。被拒：B＝只写 `workflows/build-code/SKILL.md`（计划阶段冻结接口的人看不到收场规则）；C＝只写 `workflows/build-plan/SKILL.md`（实施期子代理看不到动作）。风险（如实登记）：两处提到 G-1，需一句交叉引用防漂移。'
    evidence: '本轮用户消息 T-002=A、T-014=A；母 PRD `specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md:303`、`prd.md:308`、`prd.md:70/297`；`specs/workflowhub-thin-core-rebuild-planning-20260919/decision-log.md:855`；现仓 grep 零命中'
    impact_dimensions: [acceptance, ordinary_detail]
    acceptance: 'AC-14（`specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md:308`）：有一次 G-1 处置记录（停并行、重排、作废批次登记）且后续无静默不一致；两个技能各有对应角色与一句交叉引用本轮 T-017=A 补载体说明：本条 acceptance 的真实载体在 CARD-04 合并后的 build-plan／build-code，本卡内以冻结候选／演练／不适用理由代替。'
    counterexample: '无 G-1 处置记录、或演练只写结论而无可核对的步骤（AC-14 失败场景）；反向：`workflows/build-plan/SKILL.md` 与 `workflows/build-code/SKILL.md` 只有一处写着收场动作、另一处看不到'
    requires_user_decision: true
    visible_group_id: G-任务类型与验收载体
  - task_id: workflowhub-thin-core-card-03-20260919
    outline_version: v1
    oi_id: OI-006
    category: deferred
    source: '`specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md:309`（AC-15）+ 本卡 `cohort=post`；本轮用户消息 T-003=A'
    question: '本卡 `cohort=post`，路线不含 build-spec；AC-15 要求「五阶段均有按工作类型派发的实例或明确不适用理由」，build-prd 在本路线不跑时如何登记为「明确不适用」而不是失败？'
    status: confirmed
    selected_disposition: 'build-prd 在本路线不跑＝记「明确不适用理由」；`workflows/build-prd/SKILL.md` 方法章节照样改到位；不另跑 pre 样例 task、不改写 PRD 的「五阶段」措辞。'
    evidence: '本轮用户消息 T-003=A；母 PRD `specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md:309`（AC-15）；本卡 cohort=post（见 `## 任务身份`）'
    impact_dimensions: [scope]
    acceptance: 'AC-15（`specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md:309`）的五阶段逐条核对里 build-prd 一行有明确不适用理由，且 `workflows/build-prd/SKILL.md` 的方法章节已改到位本轮 T-017=A 补载体说明：本条 acceptance 的真实载体在 CARD-04 合并后的 build-plan／build-code，本卡内以冻结候选／演练／不适用理由代替。'
    counterexample: 'build-prd 一行留空或被记为失败/跳过；或 PRD 的「五阶段」措辞被本卡改写（越界）'
    requires_user_decision: true
    visible_group_id: G-任务类型与验收载体
  - task_id: workflowhub-thin-core-card-03-20260919
    outline_version: v1
    oi_id: OI-007
    category: data_state
    source: '`specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md:305`、`prd.md:310`、`prd.md:313`（AC-11/oracle/验收依赖）；本轮用户消息 T-002=A'
    question: 'AC-11/AC-12/AC-13 都要「实跑一个多工作包实施 task」，这个验收样例 task 从哪来？没有现成样例时用本卡自身、合成 fixture，还是如实记为覆盖限制？'
    status: confirmed
    selected_disposition: '不另起独立样例 task：主证据＝card-03 自身执行事实；缺场景用显式演练补；取证只采事实、判定必须来自独立上下文（禁止自审自判）。被拒：B＝自证 + 另起独立小样例 task；C＝只做独立样例 task。本轮 T-017=A 显式裁决：T-002=A（本卡自身执行事实为主证据、缺场景用演练、build-prd 记不适用理由）与 T-013（build-plan 推迟到 CARD-04 合并之后）**不冲突**——前者定本卡 make-decision 阶段的**取证形态**，后者定**真实落盘的时点**；凡依赖落盘后才存在的 acceptance 判据，真实载体在 CARD-04 合并后的 build-plan／build-code，本卡内以冻结候选／演练／不适用理由代替（各 OI 的 acceptance 已逐条追注）。本轮 T-024=A 补：失败与声明不实类事实由**独立审查子代理**判定并写进 `facts.jsonl` 的验收事实（禁止自审自判），**只能记录、不得成为新门禁**。**落点更正（本轮核对实测）**：现仓 `facts.jsonl` 只接受 `stage`／`close_action` 两种行（`runtime/task/task-store.mjs:220`）并显式拒绝 quality fact（同文件 `:179`），唯一持久 finding 载体是当前 stage 行的 `finding_dispositions`（`runtime/stage/completion-predicates.mjs:124` 的五值枚举 `fixed`／`rejected_invalid`／`accepted_risk`／`needs_human`／`user_decided`）；判据与效力不变。'
    evidence: '本轮用户消息 T-002=A；母 PRD `specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md:305`、`prd.md:310`、`prd.md:313`'
    impact_dimensions: [acceptance]
    acceptance: 'AC-11/AC-12/AC-13 各有可核对的真实执行事实或显式演练记录，且判定来自独立上下文（`specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md:310`、`prd.md:313`）本轮 T-017=A 补载体说明：本条 acceptance 的真实载体在 CARD-04 合并后的 build-plan／build-code，本卡内以冻结候选／演练／不适用理由代替。'
    counterexample: '用本卡自己的结论充当验收证据（自审自判）；或没有真实执行事实而宣称 AC-11…AC-13 通过'
    requires_user_decision: true
    visible_group_id: G-任务类型与验收载体
  - task_id: workflowhub-thin-core-card-03-20260919
    outline_version: v1
    oi_id: OI-008
    category: non_goals
    source: '`specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md:314-315`（合并依赖与集成责任，SD-14）；本轮用户消息 T-013 自定义答复'
    question: '本卡与 CARD-04（验收机制细节）、CARD-05（审查工具选型）、CARD-07（make-decision 写面）共享阶段写面，接口由谁先冻结、集成责任归属谁、协调发生在什么时点？'
    status: confirmed
    selected_disposition: '写面冲突按**时间错开**消解：本卡现在只做 make-decision、不进入 build-plan，**build-plan 推迟到 CARD-04 交付并合并进 main 之后**再启动；因此 make-decision 阶段不实际改任何 `workflows/*/SKILL.md`，只产出接口/方法面的冻结候选与计划，不需要现在与 CARD-04 交涉。已登记的新事实：CARD-04 worktree 实测 41 个条目不干净、其 build-plan 于 2026-09-26 19:22:46 CST 收尾、build-code 已并发运行；硬碰撞已发生 1 处（`tools/cli/stage-runtime.mjs` `@@ -1483` +7−1）；CARD-04 的 `spec.md:603` 自述「本卡零 `workflows/**` 写入面」与其 build-plan 写集自相矛盾，交涉应针对 build-plan 而非 spec。与 CARD-04 的挂起碰撞点为 `runtime/stage/stage-runner.mjs` 与 `workflows/{make-decision,build-code,verify-code}/SKILL.md`（本轮 20:xx 复核：此清单**不完整**——CARD-04 在研写面共 14 文件，另含 `runtime/evidence/{acceptance-evidence-validator,freshness,quality-store}.mjs`、`tools/cli/stage-runtime.mjs`、`skills/decision-log/{SKILL.md,templates/decision-log-template.md}` 等，明细见 `## 补充登记` 第七节）；残留的全量绑定登记给 CARD-06。'
    evidence: '本轮用户消息 T-013 自定义答复；母 PRD `specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md:314-315`（SD-14）；CARD-04 事实由交办方实测提供（本卡未独立复核）'
    impact_dimensions: [scope, acceptance]
    acceptance: '本卡在 make-decision 阶段对 `workflows/**` 的写入为 0（可用 `git status` 与 diff 核对）；build-plan 的启动时点晚于 CARD-04 交付合并进 main；与 CARD-04 的共享文件不存在未处置的冲突本轮 T-017=A 补载体说明：本条 acceptance 的真实载体在 CARD-04 合并后的 build-plan／build-code，本卡内以冻结候选／演练／不适用理由代替。'
    counterexample: '本卡在 make-decision 阶段改动了 `workflows/*/SKILL.md`；或在 CARD-04 尚未合并进 main 时就启动 build-plan 并与其写面碰撞'
    requires_user_decision: true
    visible_group_id: G-CARD-04写面冲突处置
  - task_id: workflowhub-thin-core-card-03-20260919
    outline_version: v1
    oi_id: OI-009
    category: data_state
    source: '本轮用户消息 T-004=A、T-008=A；母任务 `specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md:302`（FR-14 声明制＝事实记录）'
    question: 'post 路线的 phase 进度用哪一份材料做唯一权威：`facts.jsonl` 的 `phase_progress` 游标、phase 文件自带 `status`、还是 `phases/index.md` 做唯一进度表？'
    status: confirmed
    selected_disposition: '单一进度权威＝`facts.jsonl` 的 `phase_progress` 游标；phase 文件只读、只声明指针（`progress_cursor: facts.jsonl#build-code.phase_progress`），不复制状态值。本轮 T-008=A 补载体：新字段槽位**扩展现有** `skills/spec-plan/templates/phase-template.md`（不新建独立模板），保持单一权威；引用该模板的 3 个契约测试须同步改（本卡已知风险最高的一处改动）。被拒：phase 文件自带 `status` 随做随改（第二权威＋正是审计出的 churn 来源）、`phases/index.md` 做唯一进度表（与纯指针定位冲突，且已有单元格超 2000 字符被截断）；模板侧被拒：B＝新建独立模板（两份 phase 模板、权威分裂）、C＝只在 `workflows/build-plan/SKILL.md` 写字段清单（回到 13 份 phase 文件字段顺序各写各的）。本轮更正（红队 F-7 + 写面核对子代理 `/tmp/wh-card03-session-analysis/direction-advice-blue-verify.md`）：上述「引用该模板的 3 个契约测试须同步改」的**风险方向登记错了**——命中点为 `tests/contract/spec-stage-artifact-closure.test.mjs:58`、`tests/contract/post-cohort-authoring-files.test.mjs:10`、`tests/contract/post-cohort-executable-authoring.test.mjs:23`、`:63` 与 `skills/spec-plan/skill-bundle.json:10`，其断言全为 `toContain`／`toMatch` 子串包含式，纯新增字段、改行、重排、合并只要保留关键字即通过，**不会**因新增字段变红；真正不能动的是 **4 处负断言**（`tests/contract/post-cohort-authoring-files.test.mjs:20`、`:21`、`:31-33`、`tests/contract/post-cohort-executable-authoring.test.mjs:36`）与 **2 个结构锚点**（`tests/contract/post-cohort-executable-authoring.test.mjs:26` 的 `^### Tnnn — `、`:27-28` 的 `## L2`（`tests/contract/post-cohort-executable-authoring.test.mjs:26` 的 `^### Tnnn — `、`:27-28` 的 `## L2`）。**本轮补记（该更正此前漏了最硬的一条）**：改该模板的真实硬失败路径是 skill bundle 哈希链——`runtime/adapters/local-skill-resolver.mjs:110` 抛 `bundle sha256 mismatch: templates/phase-template.md`；全仓只有两处登记该文件的哈希：`skills/spec-plan/skill-bundle.json:11` 与 `skills/catalog.yaml:335`（无第四处）；不刷 bundle json → `tests/skill-provenance-strict.test.mjs:25` 抛出，刷 bundle 不刷 catalog → 同文件 `:26` 断言红，另有 `tests/contract/spec-stage-artifact-closure.test.mjs:118` 同时打红；三步须同批。授权实跑现状：`npx vitest run tests/skill-provenance-strict.test.mjs` ＝ exit 0／7 passed ⇒「必红」是条件预测，不是现状（明细见 `## 补充登记` 第七节）。另登记两条**未提问的待裁决冲突**（本卡不代答）：本条要新增的字段清单未定（T-008=A 只定载体）；card-04 审计骨架 L0 元数据块的 `status: not_started | in_progress | blocked | done`（`/tmp/wh-card03-session-analysis/card04-plan-quality.md:260`）与本条 acceptance／counterexample 正面冲突；`phases/index.md` 新增 `status`／`progress_cursor` 两列的提议（同文件 `:331`、`:386`）与 `skills/spec-tasks/SKILL.md:8`、`/tmp/wh-card03-session-analysis/card03-baseline-gap.md:276`（B6「建议不改」）相反。三条均见 `## 补充登记` 第五节。'
    evidence: '本轮用户消息 T-004=A、T-008=A；母任务 `specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md:302`；`skills/spec-plan/templates/phase-template.md`'
    impact_dimensions: [ordinary_detail]
    acceptance: '进度真值只在 `facts.jsonl` 一处；phase 文件与 `phases/index.md` 中不存在第二处状态值；phase 模板含新字段槽位且仓库里只有一份模板本轮 T-017=A 补载体说明：本条 acceptance 的真实载体在 CARD-04 合并后的 build-plan／build-code，本卡内以冻结候选／演练／不适用理由代替。'
    counterexample: 'phase 文件或 `phases/index.md` 出现第二处状态值并与 `facts.jsonl` 不一致；或仓库里出现两份 phase 模板'
    requires_user_decision: true
    visible_group_id: G-进度权威与执行卫生
  - task_id: workflowhub-thin-core-card-03-20260919
    outline_version: v1
    oi_id: OI-010
    category: success_failure_boundary
    source: '本轮用户消息 T-005=B、T-010=A；`docs/standard-workflow.md:334-338`（step 11 `authenticate-current-task-completion`）、`workflows/build-code/steps.json:15`、`docs/stage-atomic-step-inventory.md:65`'
    question: '证据绑定口径与整个 snapshot 绑定时怎么处置：只在方法侧规避（机制留 CARD-04/06），还是本卡内做最小机制修补，把绑定口径改成该 phase 声明的写集？'
    status: confirmed
    selected_disposition: '本卡继续做最小机制修补，口径细化为「**删掉跨 phase 的全量快照绑定**、只留该 phase 自己声明的写集」，并登记为「**减少机器门禁**」以对齐 SD-17 与母任务 OI-012。落点：`docs/standard-workflow.md:334-338`（step 11 `authenticate-current-task-completion`）与 `workflows/build-code/steps.json:15`；另需一并核对 `docs/stage-atomic-step-inventory.md:64`（ID10 `capture-implementation`／`bind evidence to current snapshot`，对应绑定收窄）与 `:65`（ID11 `authenticate-current-task-completion`／`retain incomplete facts honestly`，step 11 的读取点）、`tests/contract/stage-routing-and-concrete-testing.test.mjs:164-165`（子串式 `toMatch`，只追加短语不构成必红）、`tests/e2e/vnext-five-stage-current.test.mjs:499`。被拒：B＝退回方法侧规避（card-07 会话实测因全量绑定空转 6h36m）；C＝先与 CARD-04 对齐口径再定。风险（如实登记）：①`docs/standard-workflow.md` 与 `workflows/build-code/steps.json` 实测与 CARD-04 写面零交集（CARD-04 对 `docs/standard-workflow.md` 引用 0 处）；②`docs/standard-workflow.md:88-92`（尤其 `:91`「不设统一预算 gate」）被 CARD-04 在 decision-log 引用了 5 处，**勿改这五行**；③残留的全量绑定要如实登记给 CARD-06；④CARD-04 的 `decision-log.md:2034` 非目标 B-06 与 SD-17 明令禁止「重新引入哈希绑定、回执、快照、材料身份校验类机器门禁」，本修补的语义邻接风险如实登记，验收口径写明「本动作是移除全量绑定、减少机器门禁」。本轮红队 F-6 收口（写面补齐，并按本轮核对报告更正因果）：`workflows/build-code/steps.json:15` 一改，**三个读取点**需一并核对——不等于「必红」，其中 `tests/contract/stage-routing-and-concrete-testing.test.mjs:165` 是子串式 `toMatch`，只在其后追加短语时正则仍匹配——`tests/contract/stage-routing-and-concrete-testing.test.mjs:164,166`、`tests/e2e/vnext-five-stage-current.test.mjs:499`、`docs/stage-atomic-step-inventory.md:65`（前两处此前只被降级为「一并检查」、未进落点，第三处此前只在 evidence、不在 acceptance）。'
    evidence: '本轮用户消息 T-005=B、T-010=A；`docs/standard-workflow.md:334-338`；`workflows/build-code/steps.json:15`；`docs/stage-atomic-step-inventory.md:65`；`tests/contract/stage-routing-and-concrete-testing.test.mjs:164,166`；`tests/e2e/vnext-five-stage-current.test.mjs:499`'
    impact_dimensions: [ordinary_detail]
    acceptance: 'step 11 的绑定对象为该 phase 声明的写集、不再绑整个 snapshot；不新增 gate 或推门前置，`docs/standard-workflow.md:88-92` 五行未被改动；不引入新的哈希绑定、回执或材料身份校验本轮红队 F-6 补（因果按本轮核对报告更正）：上述三个读取点一并核对——`docs/stage-atomic-step-inventory.md:65`（ID11 `authenticate-current-task-completion`／`retain incomplete facts honestly`，本条讲的是 step 11 ⇒ 读取点指 `:65`）与 `:64`（ID10 `capture-implementation`／`bind evidence to current snapshot`，绑定收窄对应此行）、`tests/contract/stage-routing-and-concrete-testing.test.mjs:164-165`（子串式 `toMatch`，只追加短语不构成必红）、`tests/e2e/vnext-five-stage-current.test.mjs:499`；受影响测试只跑针对性范围（不做全量回归）。本轮 T-017=A 补载体说明：本条 acceptance 的真实载体在 CARD-04 合并后的 build-plan／build-code，本卡内以冻结候选／演练／不适用理由代替。'
    counterexample: '绑定仍绑整个 snapshot（旧结果可冒充当前结果）；或修补引入新的推进前置/机器门禁，或改动了 `docs/standard-workflow.md:88-92`'
    requires_user_decision: true
    visible_group_id: G-进度权威与执行卫生
  - task_id: workflowhub-thin-core-card-03-20260919
    outline_version: v1
    oi_id: OI-011
    category: complete_user_flow
    source: '本轮用户消息 T-006=A、T-007=A；`AGENTS.md` 通用工作纪律段'
    question: '三条执行卫生规则（长命令后台化、只读动作批量并行、子代理增量落盘只回传摘要）写在哪一处权威？'
    status: confirmed
    selected_disposition: '三条规则写进 `AGENTS.md` 通用工作纪律段作唯一权威，五阶段 `SKILL.md` 各引用一次、不复制正文。本轮 T-007=A 扩写：`AGENTS.md` 再补一条**通用委派纪律**，并补齐四个阶段技能里现有的「子代理产出契约」（先落盘、只回摘要、按子问题增量）——审计实测这四个阶段的上下文规则为零条，故必须写做法而不是只写原则。被拒：五阶段各写一份（副本漂移）、只写 `AGENTS.md` 而 SKILL 不提（子代理只读 SKILL 时会漏）、只写原则不写做法、另立新卡。风险（如实登记）：写面变大，且 `AGENTS.md` 是常驻上下文文件，条款必须克制。本轮 T-019=B 与 T-021=A 补可观察形态（只这三条，其余条款保持原则性短措辞）：①**禁子代理继承父代理全部对话**——派发时不得使用全量继承（审计实测 21/21 使用全量继承，占一次会话 **42%** 成本，`/tmp/wh-card03-session-analysis/s0921a.md:17`、同文件 `:347`）；可观察事实＝派发记录里的继承模式，以及随派发附上的原文摘要（对齐 `workflows/make-decision/SKILL.md:355` 的「ref + sha256 + 结构化摘要（≤500 字）」）。②**禁空转轮询**——长命令后台化后不得用固定短超时反复空转等待（审计实测轮询占 **27.35%**，1,382 次 `wait_agent` + 810 次 `write_stdin` + 236 次 `wait`，`/tmp/wh-card03-session-analysis/s0922b.md:127`、同文件 `:137`；212 次空转 → 13,545 s 纯阻塞，`s0921a.md:18`）；可观察事实＝派发／回收记录里没有「以远小于任务耗时的固定超时空转返回」的重复调用。③**声明不实的发现路径**见 `## 补充登记` 第三节与 OI-004 的 acceptance。本轮另登记两条与本仓不符的声称（红队 F-9）：`workflows/make-decision/SKILL.md:334` 声称的「Step×Executor 矩阵」在本仓**不存在**（全仓 `Step×Executor` 仅 6 处命中，5 处在归档 `specs/archive/workflowhub-requirement-convergence-depth-20260905/`：`decision-log.md:684`、`tasks.md:1895`、`:1904`、`:1943`、`plan.md:771`，另 1 处即该行本身；本卡材料零命中）；同文件 `:357` 写死「研究 4 / debate 4 / 红蓝 2」，与 SD-11 的 2–5 冲突且本卡材料此前零提及，由 T-015=A 已定的「不写死数字、区间约束」处置（见 OI-004）。'
    evidence: '本轮用户消息 T-006=A、T-007=A；`AGENTS.md`（通用工作纪律段）'
    impact_dimensions: [ordinary_detail]
    acceptance: '五阶段 `SKILL.md` 各有一处引用且正文唯一；`AGENTS.md` 含三条执行卫生规则 + 一条通用委派纪律；四个阶段技能含「子代理产出契约」的做法（先落盘、只回摘要、按子问题增量）本轮 T-019=B 与 T-021=A 补：独立审查按**可观察事实**判定——派发记录里的继承模式、回收记录里的空转调用、以及 `git diff --name-only` 的输出与声明写集的比对结果（见 `## 补充登记` 第三节）。本轮 T-017=A 补载体说明：本条 acceptance 的真实载体在 CARD-04 合并后的 build-plan／build-code，本卡内以冻结候选／演练／不适用理由代替。'
    counterexample: '出现第二份规则正文（副本漂移）；或子代理读 `SKILL.md` 时看不到这些规则；或只写原则不写做法'
    requires_user_decision: true
    visible_group_id: G-进度权威与执行卫生
```

## 补充登记（step 8 write-decision-draft）

本节登记本轮（step 8 write-decision-draft）新增的十问十答（T-016…T-025）的落点、T-016=A 要求的逐条覆盖率矩阵、T-020=A 的阶段豁免表与阈值、T-019=B／T-021=A 的声明不实发现路径、红队 finding 的逐条登记、未提问的待裁决事实，以及本轮写面声明。本节**不新增** OI、stage、gate 或任何控制面，不新增材料文件、不新增确认点，也不写任何回复引用字段或哈希。

### 一、SD-11 五件套逐条覆盖率矩阵（T-016=A）

| 条款（按母 PRD `prd.md:70` 的逐字编号与措辞） | 覆盖率判定 | 实测证据 ref | 本轮处置 |
| --- | --- | --- | --- |
| ① 接口蓝图冻结（文件级符号与 import 图） | **方向相反**（且无实测支撑） | 业界**零先例**，且方向与实证的修复手段相反（`/tmp/wh-card03-session-analysis/research-external-orchestration.md:591`）；三份会话审计的根因清单里没有「工作包写集冲突／接口漂移」条目（`/tmp/wh-card03-session-analysis/s0921a.md`、`/tmp/wh-card03-session-analysis/s0922a.md`、`/tmp/wh-card03-session-analysis/s0922b.md`），接口干扰率 1/834≈0.12%，实测起作用的修复是**事后广播**而非事前冻结（arXiv:2609.25396，父代理转述）；`/tmp/wh-card03-session-analysis/direction-advice-red.md:13`（五件套第 1／4／5 条零覆盖） | 按母任务 OI-012 降级为**事实记录**、不构成推进前置；**不为「文件级 import 图」落任何冻结产物**——它与 FR-14 的「接口符号清单」不是一回事（见下表之后的说明），OI-004 的 selected_disposition 已按此拆开 |
| ② 依赖感知调度 | **无实测支撑**（业界无此形状的先例） | 一手·官方文档 `https://code.claude.com/docs/en/agent-teams`（`/tmp/wh-card03-session-analysis/research-external-orchestration.md:53`、`:522`、`:603`）：真实形态是「任务带 `depends on` → 未满足者**不可认领** → 完成后**自动解锁** + 文件锁」＝**声明式依赖 + 认领时校验**，**没有中心 DAG 调度器、没有拓扑排序输出**；官方自认「Task status can lag … which blocks dependent tasks」 | 落成「声明式依赖 + 认领时校验 + 完成自动解锁」的**薄形状**，写进并行声明纪律；**不新建调度器对象**（事实记录，不是门） |
| ③ 中心化验证瓶颈 | **方向相反** | 实测验证不是瓶颈、是被**重复触发**：`verify --action=execute --stage=build-code` 逐字重复 **28 次**、`review --action=record` **9 次**（`/tmp/wh-card03-session-analysis/s0922a.md:153`、`:155`、`:223`、`:329`；`/tmp/wh-card03-session-analysis/s0921a.md:20`、`:289`、`:316`；`/tmp/wh-card03-session-analysis/s0922b.md:184-187`）；`/tmp/wh-card03-session-analysis/direction-advice-red.md:13`（「验证是被重复触发 28 次，不是缺中心化」） | **不落**「中心化验证瓶颈」这一条机制；改为按事实记录其真实代价，并把绑定对象收窄到该 phase 声明的写集（T-005=B、T-010=A，见 OI-010 与 `docs/stage-atomic-step-inventory.md:64`／`:65`） |
| ④ worktree 隔离 | **有实测支撑**（依据最硬），但配套**全部缺失** | 三家独立收敛、`.worktreeinclude` 同名同语义：`/tmp/wh-card03-session-analysis/research-external-orchestration.md:547`；配套清单（缺了会以「跑不起来／丢产物」失败）＝每个 worktree 重装依赖、搬 gitignored `.env`／secrets、不 symlink 依赖、一个分支同时只能被一个 worktree 检出 ⇒ detached HEAD、磁盘 O(N)（Codex 默认只留最近 15 个）、清理／恢复是状态机（约 10 个错误分支）、共享外部状态（DB／端口／迁移）无官方处置规范：同文件 `:550-556`、`:79`、`:103-104`、`:305-315`、`:426` | 保留为并行批次的落地方式与**配套清单候选**；真实落地（代码与模板）等 CARD-04 合并后的 build-plan／build-code，本卡只登记候选 |
| ⑤ 并发上限 2–5 个子代理 | **有实测支撑** | 一手·官方文档 `https://code.claude.com/docs/en/agent-teams`：「Start with 3-5 teammates」「15 个任务 3 个队友就够」（`/tmp/wh-card03-session-analysis/research-external-orchestration.md:591`、`:603`）；上限**不随任务数增长** | 不写死数字，按区间约束落五阶段共用纪律、逐任务在 build-plan 定（T-015=A）；`workflows/make-decision/SKILL.md:357` 现文写死「研究 4、debate 4、红蓝 2」与区间并存，已按 T-015=A 登记为待改落点 |
| 另：四条有实测数字支撑的条款（与五件套并列、同等权重） | 有实测支撑 | ①禁子代理继承父代理全部对话＝`/tmp/wh-card03-session-analysis/s0921a.md:17`、`:347`（21/21 使用全量继承，子代理 191.4 M input，占全会话 **42%**）；②禁空转轮询＝`/tmp/wh-card03-session-analysis/s0922b.md:127`、`:137`（轮询 2,248 次、**27.35%** 开销）、`/tmp/wh-card03-session-analysis/s0921a.md:18`（212 次空转 → 13,545 s 纯阻塞）；③快照绑定收窄＝`/tmp/wh-card03-session-analysis/s0922a.md:223`、`:14`（60–90 分钟／会话）；④禁重复读同一文件／重跑同一测试＝`/tmp/wh-card03-session-analysis/s0921a.md:20`（同一测试最多 28 次、同一源文件最多读 26 次）、`/tmp/wh-card03-session-analysis/s0922a.md:149-159` | 写成同等权重的正文；①与②另按 T-019=B／T-021=A 写成可观察形态（见 OI-011） |

**两条不在五件套内的相邻事项（不占上面 ①…⑤ 的编号）**：

- **并发方广播「我已完成的改动」**：arXiv:2609.25396 构造场景干扰率 97%、一条广播消息恢复 **82%** 的运行；`/tmp/wh-card03-session-analysis/research-external-orchestration.md:592`（「最该补的一条」）；本卡未直读原文，属父代理转述。它是 SD-11 之外**唯一有实测数字支撑**的冲突缓解手段，按 T-022=A 补进 OI-004 的 acceptance 与 counterexample（红队 F-10）。
- **FR-14 的工作包五要素声明**（读集、写集、文件 owner、接口符号清单、合并责任；母 PRD `prd.md:302`）：出自 **FR-14**、不在 SD-11 五件套内，与 SD-11① 的「文件级符号与 import 图」**不是一回事**——接口符号清单是事实记录项、单独登记；import 图不为它落任何冻结产物。五要素声明本身保留为「事实记录」形态，不得成为推进前置的门（T-011=A、T-024=A）。

### 二、阶段豁免表与「大量读写」的可指认阈值（T-020=A，登记进 OI-003）

| 步骤（技能／步名） | M 独占？ | 豁免内容 | 理由（材料引用） |
| --- | --- | --- | --- |
| make-decision step 1 `load-context` | 是（M+S） | 主会话读本卡材料与只读母材料、写本文件的身份／状态／需求／OI／收敛／UI 各节，不计入「大量读写」 | `workflows/make-decision/SKILL.md:338` 定为 M+S；本步产出就是决策记录本身 |
| make-decision step 5 `outline-talk` | 是（M） | 发问、收答复、就地登记 T 表 | `workflows/make-decision/SKILL.md:342`；交互必须由 M 发出（同文件 `:358`） |
| make-decision step 6 `grill-with-docs` | 是（M） | Grill 交互与 `grill_summary.decision_updates` 的折叠 | `workflows/make-decision/SKILL.md:315`；同文件 `:310-316` 规定 Grill 是交互思考不是 review |
| make-decision step 7 `module-convergence` | 是（M） | 模块级收敛与材料落盘 | `workflows/make-decision/SKILL.md:344` |
| make-decision step 12 `publish-decision` | 是（M） | 决策记录的发布写入 | `workflows/make-decision/SKILL.md:350`；发布是主会话职责（同文件 `:350` 表行的 executor 列＝`M`） |
| 判为「大量读写」的情形（**可指认阈值**） | — | 满足三者任一即计：①主会话为继续工作需**保留原文**（不是结构化摘要）超过 **500 字**——该阈值与 `workflows/make-decision/SKILL.md:355` 的「结构化摘要（≤500 字）」同量级但**约束对象不同**（前者管主会话留存的原文，后者管 S 回传摘要）；②一条命令做目录级批量扫描（跨目录 `grep -r`／`glob`／整目录读取）；③单步内离散文件读或写 **≥3 个文件**。豁免表所列步骤的动作不计入 | 阈值为本轮草稿候选；取证仍按 T-009=A 事后人工判读一次，零新增机制 |

### 三、「声明不实」的发现路径（T-019=B、T-021=A；红队 F-8 收口，登记进 OI-004 的 acceptance）

| 核对对象 | 可执行的核对动作 | 事实呈现位置 |
| --- | --- | --- |
| 工作包声明的读集／写集 | 独立审查用实跑命令回放：`git diff --name-only <base>..<head>` 的输出与声明写集逐条比对，多出／少掉的文件逐条列出 | 写入**当前 stage 行**的 `finding_dispositions`——唯一持久 finding 载体（`runtime/stage/completion-predicates.mjs:135-137` 注释逐字「the only persisted finding carrier: the current stage row」）；`disposition` 只能取五值枚举 `fixed`／`rejected_invalid`／`accepted_risk`／`needs_human`／`user_decided`（同文件 `:124`），字段集见同文件 `:126-129`。**不写 `facts.jsonl`**：现仓 `facts.jsonl` 只接受 `stage` 与 `close_action` 两种行（`runtime/task/task-store.mjs:220`），且显式拒绝 quality fact 进入（同文件 `:179`）。本卡的声明写集以第六节为准 |
| 声明「已广播已完成改动」 | 在该工作包的并发组内按广播约定文本做一次检索，并回放该广播消息 | 同上（写入当前 stage 行的 `finding_dispositions`，五值枚举见 `runtime/stage/completion-predicates.mjs:124`，字段集见同文件 `:126-129`） |
| 声明的接口符号清单与实际符号面 | 实跑命令列出实际 import／导出（如 `grep` 或语法检查），与声明逐条比对 | 同上（写入当前 stage 行的 `finding_dispositions`，五值枚举见 `runtime/stage/completion-predicates.mjs:124`，字段集见同文件 `:126-129`） |
| 判定人与效力 | 只能由**独立审查子代理**判定（禁止自审自判）；**只能记录，不得成为新门禁**（T-024=A，对齐 SD-17 与母任务 OI-012） | 同上（写入当前 stage 行的 `finding_dispositions`，五值枚举见 `runtime/stage/completion-predicates.mjs:124`，字段集见同文件 `:126-129`） |

### 四、红队 finding 的逐条登记（F-1…F-10 与红队自评）

- F-1（重心错配，blocker）：由 T-016=A 处置——五件套降为并列条款之一 + 逐条覆盖率矩阵（见本节一）。
- F-2（无可验收载体，blocker）：由 T-017=A 处置——每条被推迟的 acceptance 追一句载体说明；T-002 与 T-013 的冲突裁决登记在 OI-007。
- F-3（纯文本约定的有效性被同仓历史证伪）：由 T-019=B、T-021=A 处置——最贵三条改可观察形态；OI-011 的 acceptance 写明独立审查按什么事实判定。
- F-4（FR-13 与 make-decision 的 M 独占步骤结构性冲突，AC-12 必失败或必豁免）：由 T-020=A 处置——阶段豁免表 + 可指认阈值（见本节二，登记进 OI-003）。
- F-5（T-010 只改声明层、真实绑定在 runtime）：由 T-018 处置——本卡只冻结改动候选清单，真实代码改动等 CARD-04 合并后随 build-plan／build-code 落地。
- F-6（写面漏掉「一改就红」的读取点）：本轮补进 OI-010 的落点与 acceptance——`workflows/build-code/steps.json:15` 一改需一并核对三个读取点：`tests/contract/stage-routing-and-concrete-testing.test.mjs:164-165`（子串式 `toMatch`；只在其后追加短语时正则仍匹配，不构成「必红／须同批改断言」）、`tests/e2e/vnext-five-stage-current.test.mjs:499`、`docs/stage-atomic-step-inventory.md:64`（ID10 `capture-implementation`／`bind evidence to current snapshot`）与 `:65`（ID11 `authenticate-current-task-completion`／`retain incomplete facts honestly`，两句不可互替）。
- F-7（T-008 只定载体未定字段；两条未裁决冲突；「3 个契约测试须跟着改」风险方向错）：如实登记 + 更正风险方向。写面核对子代理 `/tmp/wh-card03-session-analysis/direction-advice-blue-verify.md` 的结论：三处契约测试与 `skills/spec-plan/skill-bundle.json:10` 的断言全为 `toContain`／`toMatch` 子串包含式，纯新增字段、改行、重排、合并只要保留关键字即通过，**不会**因新增字段变红；真正不能动的是 **4 处负断言**（`tests/contract/post-cohort-authoring-files.test.mjs:20`、`:21`、`:31-33`、`tests/contract/post-cohort-executable-authoring.test.mjs:36`）与 **2 个结构锚点**（`tests/contract/post-cohort-executable-authoring.test.mjs:26` 的 `^### Tnnn — `、`:27-28` 的 `## L2`）。两条未裁决冲突见本节五。
- F-8（声明制缺最后一跳：没写「怎么发现不实」）：由 T-019=B、T-021=A 处置，发现路径与呈现位置见本节三，并写进 OI-004 的 acceptance。
- F-9（两处与现仓不符的声称）：①`workflows/make-decision/SKILL.md:334` 声称的「Step×Executor 矩阵」在本仓**不存在**——全仓 `Step×Executor` 仅 6 处命中，5 处在归档 `specs/archive/workflowhub-requirement-convergence-depth-20260905/`（`decision-log.md:684`、`tasks.md:1895`、`:1904`、`:1943`、`plan.md:771`），另 1 处即该行本身，本卡材料零命中。**处置（本轮补全，此前只登记未给落点）**：唯一落点候选＝改 `workflows/make-decision/SKILL.md:334` 自身，指向同文件真实存在的 `:336-351` 的 step×executor 表与 `:353-360` 的 `### Context conservation rules` 六条；**不**在 decision-log 模板另立一处（二选一、禁双写）。责任方＝本卡 make-decision 阶段只冻结该候选，真实改动由 CARD-04 交付并合并进 main 之后的 build-plan／build-code 执行；时点＝不早于 CARD-04 合并（明细见 `## 补充登记` 第七节）；②同文件 `:357` 写死「研究 4 / debate 4 / 红蓝 2」，与 SD-11 的 2–5 冲突且本卡材料此前零提及——由 T-015=A 已定的「不写死数字、区间约束」处置（见 OI-004）。
- F-10（唯一有实测背书的手段没进 acceptance）：由 T-022=A 处置——合并责任＝产出方自己提交／开 PR，失败时换一个新执行者重做、不回滚；并发方广播「我已完成的改动」与合并责任都已进 OI-004 的 acceptance 与 counterexample。
- 红队诚实自评（如实登记）：红队本轮**自己推翻**了 4 个预设攻击面——「T-010 与 CARD-06 重复劳动」（部分推翻：T-010 的目标确是删除，残留的全量绑定已登记给 CARD-06）、「T-008 扩模板解决不了断链／进度权威」（推翻）、「本卡漏掉了广播」（推翻，材料三处都写了）、「五件套整体方向错」（部分推翻：第 2 条有外部先例、第 4 条是三家事实标准硬门禁、第 5 条与 T-015 的区间一致）。红队自评最弱环节：全部 finding 非执行级；量化证据来自另外三张卡的会话审计；F-5／F-6 间接依赖父代理转述。

### 五、未提问的待裁决事实（红队 F-7 的一部分；本卡不代答、不替用户决定）

以下三条**没有**对应的真实用户答复，故本卡只如实登记、不代答，也不新增确认点：

1. `skills/spec-plan/templates/phase-template.md` 要新增哪些字段：字段清单未定（T-008=A 只定了载体）。
2. 冲突：card-04 审计骨架的 L0 元数据块使用 `status: not_started | in_progress | blocked | done`（`/tmp/wh-card03-session-analysis/card04-plan-quality.md:260`），与 OI-009 的 acceptance／counterexample（phase 文件只声明指针、不复制状态值）正面冲突；谁让路未裁决。
3. 冲突：`phases/index.md` 新增 `status`／`progress_cursor` 两列的提议（`/tmp/wh-card03-session-analysis/card04-plan-quality.md:331`、`:386`）与 `skills/spec-tasks/SKILL.md:8`（index 明文禁止成为 progress ledger）、`/tmp/wh-card03-session-analysis/card03-baseline-gap.md:276`（B6「建议不改」）相反；谁让路未裁决。

**2026-09-28 裁决（用户当面答复，三条全问清）**：

1. 用户不认可现成的字段清单（也未选增删），给出新指令（逐字）：「我需要仔细调研原来的plan和tasks模板，看看现在的模板还有什么差距，应该如何修改。我希望最终的phase文件可以很方便的让执行者对照着干活，产出高质量的代码！」⇒ 转本卡新施工项：模板差距调研＋phase 模板再修改；调研结论与修改一并落 design.md 与模板文件，sha 链随之重算。
2. **OI-009 胜**。card-04 审计骨架的 L0 `status` 块属报告级人读摘要、不是仓库机制；仓库 `phases/*.md` 一律只许指针、不抄状态值。**防抄送登记**：该骨架格式仅限分析报告使用；任何卡不得把 `status: not_started|in_progress|blocked|done` 块写进仓库 phase 文件，违者按 OI-009 counterexample 判不合规。
3. **禁令维持**。`phases/index.md` 不加 `status`／`progress_cursor` 列；进度可见性由 `phase_progress` 事实承担（S10 已判现仓已具备）；改写 `skills/spec-tasks/SKILL.md:8` 的提议正式否决。

**2026-09-29 结案（合并后复核）**：第 2、3 条的悬置事实**已由 card-04 归档形态结案**——`specs/archive/workflowhub-thin-core-card-04-20260919/phases/index.md:7` 的列头为 `phase | authority ref | semantic anchor | write set | dependency | consumer`（**无 `status`／`progress` 列**），`phases/P1.md:3` 的 `## L0` 段无 `status` 字段 ⇒ 与本卡「phase 文件不设进度账本、index 不加状态列」的立场一致，OI-009 的禁令由 card-04 的归档形态佐证，无需改判。

### 六、写面声明（本轮更新）

- **本卡当前写面**：`specs/workflowhub-thin-core-card-03-20260919/decision-log.md`（本文件，本轮由本子代理直接写入）与 `specs/workflowhub-thin-core-card-03-20260919/design.md`（v4 实施设计书，同目录，由本轮装配产出）；设计书是 build-plan 的输入原料；本阶段唯一必需的产物仍是本文件。另有两处**属于本卡、由另一个子代理执行**的写面——`CONTEXT.md`（T-023=B 的「子代理」权威定义）与 `docs/adr/0034-*.md`（T-025=A 判定要写的新 ADR）。
- **推迟写面（本卡不做，留给 CARD-04 合并后的 build-plan／build-code）**：`runtime/evidence/**`（`runtime/evidence/quality-fact.mjs:48`、`runtime/evidence/canonical-evidence-validators.mjs:251`／`:322-328`／`:397-399`／`:433`、`runtime/evidence/research-report.mjs:22`、`runtime/evidence/freshness.mjs` 的 `ensureGitSnapshotObjectStore`／`materialRevisionFromValues` import）、`runtime/stage/stage-runner.mjs`、`tools/cli/stage-runtime.mjs`（T-018 的 H-1）。
- 本卡本轮的改动**全部在已声明写面内**：`specs/workflowhub-thin-core-card-03-20260919/decision-log.md`（本子代理直接写入）、`CONTEXT.md`（T-023=B；由另一个子代理写入）、`docs/adr/0034-subagent-dispatch-and-parallel-rules.md`（T-025=A；同一子代理写入）。实测 `git status --porcelain` ＝ ` M CONTEXT.md`、`?? docs/adr/0034-subagent-dispatch-and-parallel-rules.md`、`?? specs/workflowhub-thin-core-card-03-20260919/`；**「声明不实」的核对即以这一组已声明路径为准**（见第三节），除此之外本轮未改动仓库任何其它文件。
  - **2026-09-28 更新（step 9 detail-advice 复核 P1-2）**：以上是当轮快照。其后「模板全中文化」「现在全落（16 条提案 22 落点）」与施工表行 43–51／53–67：其中行 43、45–51 与 53–67 已落盘；行 44 的 `skills/spec-plan/SKILL.md` 末句未落（同一命题由 `skills/spec-plan/templates/phase-template.md:147`／`:175` 的 `可观察接缝` 字段规范承载）；行 52 按既定口径错开实施（**2026-09-29 一致性复核更正**）。落盘范围含 `AGENTS.md`、`docs/standard-workflow.md`、`workflows/build-code|build-spec`、`runtime/stage/*`、`runtime/task/*`、`skills/*`、`tests/*`），现行写面声明以 `## 决定` 段与 12.5 为准。

### 七、CARD-04 在研写面撞车实测与本轮核对报告收口（事实登记，不是门禁）

T-013=A 已登记「与 CARD-04 的挂起碰撞由时间错开消解」。本节按本轮独立核对报告 `/tmp/wh-card03-session-analysis/detail-advice-blue-verify.md` 的**实测**更新撞车事实，并把三处措辞更正到实测版本；本节只登记事实，不新增门禁、不新增材料文件、不新增确认点、不新增 schema 或命令。

核对树与口径：CARD-04 worktree（分支 `task/workflowhub/workflowhub-thin-core-card-04-20260919`，HEAD `ef920f1f`；**2026-09-29 复核更正**：该 worktree 目录整体已删除，CARD-04 材料现归档于 `specs/archive/workflowhub-thin-core-card-04-20260919/`，下列 diff 数与未跟踪文件数为当时实测）`git diff --stat` ＝ **14 files changed, 274 insertions(+), 32 deletions(-)**；另有约 30 个未跟踪新文件（`?? specs/workflowhub-thin-core-card-04-20260919/` 等）。

| 本卡候选落点 | 是否在 CARD-04 在研写面 | 实测依据（本轮一次 `git diff`，时点 20:xx） |
| --- | --- | --- |
| `workflows/make-decision/SKILL.md` | **在**——单 hunk `@@ -204,0 +205,11 @@`，**未触** `:331-362`，也未触 `:357` | `git diff -U0` hunk 头 |
| `workflows/build-code/SKILL.md` | **在**（`@@ -100,0 +101,24 @@`） | 同一次 `git diff -U0` hunk 头 |
| `workflows/verify-code/SKILL.md` | **在**（`@@ -79,0 +80,27 @@` 与 `@@ -180,0 +208,10 @@`） | 同一次 `git diff -U0` hunk 头 |
| `runtime/stage/stage-runner.mjs` | **在**（+135 行） | `git diff --stat` |
| `tools/cli/stage-runtime.mjs` | **在**（现为 `@@ -1486 +1486,6 @@`；T-013 登记时实测的是 `@@ -1483` +7−1） | `git diff -U0` hunk 头 |
| `runtime/evidence/acceptance-evidence-validator.mjs`、`runtime/evidence/freshness.mjs`、`runtime/evidence/quality-store.mjs` | **在** | `git diff --stat` 的 14 文件集合 |
| `skills/decision-log/SKILL.md`、`skills/decision-log/templates/decision-log-template.md` | **在**（`skills/decision-log/SKILL.md` `@@ -156,0 +157,15 @@`） | `git diff -U0` hunk 头 |
| `AGENTS.md`、`docs/standard-workflow.md`、`docs/stage-atomic-step-inventory.md`、`workflows/build-code/steps.json`、`skills/spec-plan/templates/phase-template.md`、`tests/contract/stage-routing-and-concrete-testing.test.mjs`、`workflows/build-plan/SKILL.md` | **不在** | 同一次 `git diff --stat` 的 14 文件集合内无这些路径 |

口径：凡标「在」的路径，本卡 make-decision 阶段一律只写冻结候选与计划（T-013=A 的时间错开，见 `## 范围` 第一条与第六节）；标「不在」的即批①落点，本轮按第六节的写面声明处置。**结论：本卡此前只登记 1 处硬碰撞（`tools/cli/stage-runtime.mjs`）是不完整的**——CARD-04 在研写面另含两个 `SKILL.md`（build-code、verify-code）与 `runtime/stage/stage-runner.mjs`、`runtime/evidence/**` 三件、`skills/decision-log/**` 两件；`## 唯一 OI 大纲` 的 N-extension 行与 OI-008 的原表述已在本轮就地补注。

**三处事实更正（以核对报告为准）**：

1. **phase-template 的真实失败路径＝skill bundle 哈希链，不是「3 个契约测试须同步改」**：改 `skills/spec-plan/templates/phase-template.md` 后，`runtime/adapters/local-skill-resolver.mjs:110` 抛 **`bundle sha256 mismatch: templates/phase-template.md`**（同文件 `:108` 先算实际 sha256、`:109` 判 `entry.sha256` 是否存在）。全仓**只有两处**登记该文件的哈希：`skills/spec-plan/skill-bundle.json:11`（该行登记 phase-template.md 的 sha256 现值，本次不抄写哈希字面量，读该行即得）与 `skills/catalog.yaml:335`（该行登记 spec-plan 的 `local_bundle_hash` 现值，本次不抄写哈希字面量，读该行即得）；**无第四处**——`repo-skills.manifest.json:189-205` 无哈希字段，`docs/architecture/repository-inventory.tsv` 是冻结快照（`tests/contract/repository-inventory.test.mjs:31` 钉死其历史字节）。精确化的失败模式：**不改 bundle json** → `tests/skill-provenance-strict.test.mjs:25` 调用 `validateSkillBundle` 时**抛出**；**改了 bundle json 但不改 catalog** → 同文件 `:26` 断言红。**第二个会同时打红的测试**＝`tests/contract/spec-stage-artifact-closure.test.mjs:118`。授权实跑现状：`npx vitest run tests/skill-provenance-strict.test.mjs` ＝ **exit 0 / 1 file passed / 7 tests passed / 402 ms** ⇒「必红」是改模板之后的**条件预测**，不是现状。三步须同批：改模板 → 刷 `skills/spec-plan/skill-bundle.json` → 刷 `skills/catalog.yaml`。
2. **`docs/stage-atomic-step-inventory.md` 的 `:64` 与 `:65` 不可互替**：`:64` ＝ ID10 `capture-implementation`，条件行为 `bind evidence to current snapshot`；`:65` ＝ ID11 `authenticate-current-task-completion`，条件行为 `retain incomplete facts honestly`。OI-010 的 acceptance（本文件 `:293`）讲的是 **step 11** ⇒ 读取点应指 **`:65`**；而机制修补讲的「绑定对象收窄」对应 **`:64`**。两处分别引用、各自写清语义。
3. **`tests/contract/stage-routing-and-concrete-testing.test.mjs` 的断言在 `:164-165`，是子串式 `toMatch`**：`:165` ＝ `toMatch(/current task facts is marked completed only when actual changes, tests, AC evidence, and review dispositions support that claim/i)`（`:166-167` 是另一条 `.completion_evidence` 的 `not.toContainEqual(... "tasks.md")`）。核对报告 node 实测：拟插入的短语落在匹配串**之后**时正则仍匹配（→ true）⇒ **「改 `workflows/build-code/steps.json:15` 必红、须同批改该断言」不成立，本文件已删除这类表述**；正确口径＝改法决定后果：只追加短语不红，删改现文匹配串才须同批更新断言。附带更正：`docs/standard-workflow.md` 的禁区是 `:88-92` 五行，其中「不设统一预算 gate」整句在 **`:91`**。

**悬空权威的落点候选（红队 F-9① 的处置；本卡只冻结候选，不在本卡实改）**：`workflows/make-decision/SKILL.md:334` 逐字写「口径唯一来自 decision-log 的“Step×Executor 矩阵”和“上下文守恒规则”」，而这两者在仓库里**都不存在**（`Step×Executor` 全仓 6 处命中：5 处在归档 `specs/archive/workflowhub-requirement-convergence-depth-20260905/` 的 `decision-log.md:684`、`tasks.md:1895`、`:1904`、`:1943`、`plan.md:771`，第 6 处即 `:334` 本身）。**唯一落点候选（二选一，禁双写）**：改 `:334` 自身，指向同文件真实存在的 `:336-351` 的 step×executor 表与 `:353-360` 的 `### Context conservation rules` 六条；**不**在 decision-log 模板另立一处（避免同一口径两处权威）。**责任方**：本卡 make-decision 阶段只冻结该候选，真实改动由 CARD-04 交付并合并进 main 之后的 build-plan／build-code 执行。**时点**：不早于 CARD-04 合并。

**术语并存的如实登记（T-023=B 的边界）**：`CONTEXT.md` 新术语节（本轮由另一子代理写入）声明「本次不沿用『阶段协调者／Phase 执行者』这一措辞称呼该执行者，两套词不并存」，但 `CONTEXT.md` 既有条目 `:258-259`（阶段协调 / Phase 执行）与 `:261-262`（Phase Card 定义里「阶段协调者交给 Phase 执行者」）仍把「阶段协调者」当执行者使用 ⇒ **本轮结束后「两套词并存」仍是仓库事实**，新节的「不并存」只是该节的取舍声明。**处置口径**：本卡不改 `CONTEXT.md` 既有条目；若要消解，落点＝`CONTEXT.md:258-259` 与 `:261-262` 两条既有条目，责任方＝本卡 T-023 条目的执行子代理与 CARD-04 合并后的 build-plan／build-code，时点＝不早于 CARD-04 合并。

**两处计数与范围的更正**：

- T-017=A 的「补载体说明」句实测共 **10 处**，行号 `:167`、`:181`、`:209`、`:223`、`:237`、`:251`、`:265`、`:279`、`:293`、`:307`（蓝方映射表记的「9 处」少算 `:265`／OI-008；本稿正文未出现该计数，故此更正只登记在本节）。
- T-013=A 的字面冻结是「不改任何 `workflows/*/SKILL.md`」，而 `workflows/build-code/steps.json` 位于 `workflows/` 下但**不是** `SKILL.md`（且实测不在 CARD-04 在研写面内）⇒ 它是否属本轮冻结范围**待用户在 step 10 确认**；本卡不替用户决定，本轮也不改该文件。

### 八、G-1 演练记录（T-002=A / AC-14）

**性质**：本卡 make-decision 阶段内一次**真实发生**的接口变更收场，附一次桌面复演。全程无代码改动。

**触发**：用户对本卡设计书的一处口径给出更正，逐字「有严重问题，当前 card-03 任务主要就是优化 build-code 的效率和执行，怎么可能不改 build-code 的 skill 文件！之前的决策有严重问题和歧义！」。此时设计书 §6.1 已按「三个阶段技能文件冻结不碰」冻结了接口假设，并有三个施工勘察子代理（M1 覆盖 `workflows/build-code/SKILL.md`、M2 覆盖 `workflows/build-plan/SKILL.md`、M3 覆盖 `workflows/verify-code/SKILL.md` 与 `workflows/make-decision/SKILL.md`）在并行执行。

**①停并行**：收到更正后立即停止按旧接口假设派发新批次，作废 §6.1 的「冻结/排队」处置词表（该词表把「等 CARD-04」误当成「不改」）。

**②主会话重排**：重新写下共同依据文件 `V4-BRIEF-2.md`（128 行：方法正文九条 + 硬规则 + 分片表），把「错开实施」定义为三值口径之一，并按新口径重派 M1–M4。

**③作废批次登记**：作废的不是已完成的只读勘察本身（M1/M2/M3 的勘察结果仍然有效并被 V4-C 合并），作废的是**接口假设**——「三个阶段技能文件不改」这一条；由此作废的派发单元＝按旧假设起草的 §6.1 处置列与 §6.3 批次 G。

**后续无静默不一致**：设计书 §6 被整节重写（V4-A），处置词表收敛为三值（本卡内做／错开实施／本卡不改），三个阶段技能进入「错开实施」；没有一条已完成工作被静默覆盖，也没有出现写集冲突。

**桌面复演（同口径）**：若发生「接口蓝图已冻结、实施中发现接口必须改」，按母 `prd.md:303`（FR-15）执行：停并行 → 主会话重排 → 登记作废批次 → 继续；那批并行收益作废但不产生静默不一致。`docs/standard-workflow.md` 中 `G-1` grep 零命中，故本记录自包含行为描述。

**不构成门禁**：本记录是材料小节与事实行，不是新行类型（`runtime/task/task-store.mjs:220` 只认 `stage`/`close_action`），不阻断推进（SD-17）。

### 九、q7_5 授权范围外的既有红与 T 行覆盖补记（事实登记）

- **全量基线实测（2026-09-27 06:34:24–07:42:46 CST；本 worktree、分支 `task/workflowhub/workflowhub-thin-core-card-03-20260919`、base `ef920f1f`；命令 `npx vitest run`）**：**Test Files 83 failed | 226 passed (310)**；**Tests 219 failed | 3332 passed | 28 skipped (3598)**；2 个 unhandled worker 错误；**耗时 4102.11s（68.4 分钟）**；exit=1。⇒ 设计书里所有「会不会红」的判断**一律对照这条基线读**，不得按「本卡只关心 5 条红」理解。与运行环境/工作树强相关的成片红（不是本卡引入、也不由本卡修）：①CARD07 journey 全组——`specs/workflowhub-thin-core-card-07-20260919/` 不在本 worktree（`tests/integration/vnext-official-stage-run.test.mjs:40` 的 `postStageMaterials()` ⇒ ENOENT）；②`specs/workflowhub-cost-baseline-and-blocker-close-20260917/decision-log.md` ENOENT；③`WH_TEST_THIRD_REVIEW_ROOT` 未设（`tests/review/review-managed-lifecycle.test.mjs:825`）；④`verify-code manifests must declare architect-code-review and finalize-code-review`（`runtime/stage/stage-agent-outcome-adapter.mjs:620`）；⑤`review result canonical authentication failed: REVIEW_EVIDENCE_INVALID: semantic result does not exactly match completed provider evidence and aggregation`（`runtime/stage/stage-handlers.mjs:2106`）。单文件耗时王（佐证「命令本身极贵」）：`tests/contract/stage-handoff.test.mjs` 222,818ms、`tests/close/close-contract.test.mjs` 160,648ms、`tests/contract/stage-runner-reflection.test.mjs` 146,887ms、`tests/contract/verify-code-binding-derivation.test.mjs` 57,880ms、`tests/contract/requirement-convergence-regression.test.mjs` 50,804ms；`tests/contract/ocr-ac006-011-experiments.test.mjs` 与 `tests/contract/freeze-classification-budget-usage-protocol.test.mjs` 各 14,371ms／19,998ms。

- **T 行覆盖补记（第 8 条由 T-031 承担）**：`workflows/build-code/SKILL.md:176` 的路径形定位符改裸 slug 散文形（逐字来源＝设计书 §1 R15 与 `## §6.1.4`／§6.1 逐字改动明细第 18 行；现文含路径形 `skills/architect-code-review/SKILL.md`，改成裸 slug 散文形 `调用一次 architect-code-review 技能。`）**不在测试侧、也不占 T-031 的 4 条名额**——它由 T-031 单元格内逐字指向的「§1 修补 (1) 在散文侧消解」承担。机器依据（逐字）：`runtime/evidence/check-skill-closure.mjs:703` 的正则要求字面 `skills/<name>/SKILL.md`，命中即同文件 `:704` 报 `prompt references undeclared skill`；`workflows/build-code/skill-deps.yaml` 的 `skills:` 清单不含该技能；`tests/contract/stage-skill-invocation-contract.test.mjs:76` 逐字 `expect(stageSkills["build-code"]).not.toContain("architect-code-review");` ⇒ 不能靠加声明消掉，只能改散文。
- **已知既有红，本卡不改**：`tests/contract/material-producer-consumer-roundtrip.test.mjs:15`（设计书「残留不确定」第 13 条记作 `:15:47`，指同一条断言）——已知既有红，本卡不改，理由：不在 q7_5 授权范围且与本卡写面无交集。

### 十、`skills/**` 逐文件 sha 链（第七批答复 T-036 的落点）

**用户裁决（2026-09-27 逐字）**：「这个问题的前提条件有问题，**不应该有任何逐文件-sha存在，这是核心的阻塞点！**」

- **本卡零哈希动作**：不写、不重算、不回写任何哈希。设计书 `## §6.8` 给出实测的 **8 处消费者地图**：`runtime/adapters/local-skill-resolver.mjs:83`（`throw new Error(`bundle sha256 mismatch: ${locator}`)`）、`tests/contract/spec-stage-artifact-closure.test.mjs:110-119`、`tests/skill-provenance-strict.test.mjs:25`、`tests/integration/mutation-guards.test.mjs:106`、`runtime/evidence/check-skill-closure.mjs:421`／`:436`／`:651`／`:692`／`:742`、`package.json:8` 的 `check:skill-closure` 与 `runtime/distribution/skill-bundle-release.mjs:245`／`:291`、`runtime/schemas/skill-catalog.schema.json:17`／`:22`、`core/__tests__/check-skill-closure.test.mjs:66`／`:223`／`:228`。
- **一条不可用的小路（实测排除）**：`files[]` 已支持纯字符串（无 `sha256` ⇒ 跳过逐文件校验），但 `skills/catalog.yaml` 的 `local_bundle_hash` 是 schema **必填**且契约断言仍比对 ⇒ 「只让 `spec-plan` 一个技能退链」跑不通，要么整链删除（CARD-06），要么整链回写。
- **已知代价（如实登记，不构成门禁）**：q7_2／T-028 必须改 `skills/spec-plan/templates/phase-template.md`；改而不回写哈希后，上列 #2／#3／#4／#5／#8 与 `check:skill-closure` 会红或抛错，直到 CARD-06 落地。按 SD-17，这是本卡的**已知事实**，不作为推进或验收的门禁。
- **责任方**：删除属母 PRD 的 **Group 2（CARD-06）写面**；本卡（Group 1）只交出地图与这段事实，不提前实施。

### 十一、目标重述后的第二组裁决：12 条 + A5 三条（2026-09-28）

**用户裁决（2026-09-28 逐字）**：①「**上面 12 条我都认都要改；加上A5的新增条目**」②「**skills/spec-plan/** 的 sha 链决定不变**」。

**触发原因（用户 2026-09-28 逐字重述目标）**：「我的最终目标是 build-plan 能设计出高效、可执行、清楚的计划，现在计划实施后，spec 和 phase 离这个目标还是很远，会导致 build-code 的时候浪费大量时间！build-code 的修改也不够，没有很好的对整个任务的执行流程进行很好的编排和设计。」⇒ 本卡的出口被**重述**为两件事：**计划可执行**（落点一）与 **build-code 全流程编排**（落点二），外加**卡住必须升级到人**（落点三）。

**取证来源（两处，别的来源不引）**：①**被分析会话**＝`/Users/Hugh/.codex/sessions/2026/09/26/rollout-2026-09-26T19-24-41-01a0dd75-d3c9-7d91-b3cc-5064ee568f5a.jsonl`（79,715,667 B / 49,470 行 NDJSON，2026-09-26T11:24:46Z → 2026-09-27T22:02:46Z）与其派生件 `/tmp/wh-card03-s926/`；②**会话自带复盘**＝`/Users/Hugh/Downloads/workflowhub-card04-build-code-超时复盘-20260928.md`（97 行）＋ `/Users/Hugh/Downloads/workflowhub-card04-build-code-audit-20260928/`（`analyze-transcript.py`、`time-token-metrics.json`、`01/02/03-*.md`）。

**落盘事实**：设计书新增 **`## §14 目标重述后的增量设计（I-1 … I-15）`**，追加后 `design.md` **2153 → 2605 行**（`## §14` 落在 `design.md:2157`）。**本节只登记，不改写 §1–§13 的任何已裁决结论。**

**12 条的落点（逐条对号入座，全部经本卡 worktree 实测核对）**：

| # | 一句话 | §14 条目 | 落地文件 | 处置 |
| --- | --- | --- | --- | --- |
| 1 | Phase 文件只写意图，禁写执行状态与修订流水账 | I-1 | `skills/spec-plan/templates/phase-template.md` 尾注段 +6 行 | 本卡内做 |
| 2 | 补齐三个缺失字段 | **I-2（前提已更正）** | 同上 | 本卡内做 |
| 3 | Phase 标题＝一个可独立验收、可独立提交的功能结果 | I-3 | 同上 | 本卡内做 |
| 4 | 写面纪律：Write set 不许把本任务自己的 `spec.md`/`decision-log.md`/`phases/*.md` 当实现目标 | I-4 | 同上 | 本卡内做 |
| 5 | 规模对账：覆盖不到必须写「未知」，不许留空 | I-5 | 同上 | 本卡内做 |
| 6 | 一次只推进一个 Phase | I-6 | `workflows/build-code/steps.json:5`（本卡内做）＋ `workflows/build-code/SKILL.md`（错开实施） | 分批 |
| 7 | 缺口集中退回，一次、尽早（给分界线） | I-7 | `workflows/build-code/SKILL.md` | 错开实施 |
| 8 | 一 Phase 一次正式审查 | I-8 | `workflows/build-code/steps.json:12`（本卡内做，加强 §5.2） | 本卡内做 |
| 9 | 只跑受影响测试；证据只留原件加指针 | I-9 | `docs/standard-workflow.md`（本卡内做）＋ `workflows/build-code/SKILL.md`（错开实施） | 分批 |
| 10 | 读取范围收窄：主会话读索引，实施者只读自己那份 | I-10（**已被 §5.1 覆盖**） | `workflows/build-code/SKILL.md` 补一句 | 错开实施 |
| 11 | 按 Phase 记真实成本，不新建账本 | I-11 | `docs/standard-workflow.md`（本卡内做）＋ 填 `runtime/stage/stage-handlers.mjs:280-281` 已有的两个 `null` | 本卡内做 |
| 12 | 目标标 `blocked` 时必须用大白话向人报告并给选项与风险；连续无进展的续跑必须停 | I-12 | **`AGENTS.md`** 新增 `### 卡住与升级（本任务后续执行）` 段（`### 测试硬规则` 之后、`## 入口文件` 之前，4 行，**已落地**） | 本卡内做（2026-09-28 用户逐字「允许，可以修改AGENTS.md」；**T-019=B 被显式推翻，`AGENTS.md` 净变更由三条变四条**；`docs/standard-workflow.md` 的 `### stage 结束` 段不改） |

**第 2 条的前提更正（必读；这是本轮最重要的事实订正）**：`skills/spec-plan/templates/phase-template.md`（**56 行**）里三个字段**都已经存在**——`:38` `Observable seam`、`:24` `Risk and rollback`、`:47` `test change request`。**2026-09-29 复核更正**：该模板经 `5202828a` 中文化重写后现为 **217 行**（原记 56 行与上述三个行号取自改写前的英文版本；现为 `:175` `- **可观察接缝**`、`:100` `### 风险与回滚`、`:184` `- **测试变更请求**`，复核见 `design.md` §14.1），本行的前提更正与结论不变。⇒ **缺的不是字段，是「被填」，而且没有任何地方拦得住。** CARD-04 十三份真实 `phases/P<n>.md` 的覆盖矩阵实测：`Global spec`/`Write set`/`Dependency`/`FR ·AC`/`STOP`/`Done` 各 **13/13**；`Consumer` **12/13（唯一缺的是 P11）**；`Observable seam`/`Prewritten test`/`RED evidence`/`test change request` **1/13（只有 P8）**；`Risk and rollback`／`Task order`／`Test strategy`／`Inputs and outputs` 各 **0/13**。**两条对得上的因果**：①唯一漏掉 `Consumer` 的 Phase 就是 P11，而 P11 的头号缺口正是「真实消费者/入口不存在」6 条、跨 31 小时未闭合；②`Observable seam`(1/13)↔A 类真实来源未认证 10 条、`Consumer`(12/13)↔B 类真实消费者不存在 8 条、`Prewritten test`+`RED evidence`(1/13)↔D 类预写测试无效 4 条、`Risk and rollback`(0/13)↔G 类失败边界未定义 11 条 ⇒ **这四项对应 33/61 条缺口。**

**A5 三条的落点**：①**I-13**「同（审查对象种类、Phase、审查范围）已有 semantic 结果则复用、不再派发；`unavailable` 也算一次尝试」——方法条款落 `workflows/build-code/SKILL.md:93-95` 段与 `docs/standard-workflow.md`，**runtime 面挂 CARD-05**；②**I-14**「业务规则版本绑定从整份文件 sha256 改为稳定锚点（章节/AC 编号）」——**全部挂 CARD-06/CARD-04**，理由：改动面（`docs/quality/**`、`runtime/evidence/**`）不在本卡写面——**这才是本节只登记、不落地的唯一理由**（**2026-09-29 复核更正**：原写「`docs/quality/business-case-catalog.json` **在本卡 worktree 实测不存在**（`ls docs/quality/` → `No such file or directory`；全仓 `find -name 'business-case-catalog*'` 零命中）」**不成立**——该文件实测在本卡 worktree 内（`ls -l` → 56200 B，首条字段 `"revision": "2026-09-28.card04-finite-a1-a2-p9-rule-sync.16"`），`runtime/evidence/canonical-evidence-validators.mjs` 亦实存 34520 B；挂 CARD-06/CARD-04 的结论不变）；③**I-15**「交接前可执行性核查」——落 `workflows/build-plan/SKILL.md`（错开实施）＋ `docs/standard-workflow.md`（本卡内做），**明确拒绝 A5 提出的 `runtime/stage/stage-handoff.mjs` 落点**。

**与既有裁决的三处冲突处置（§14.6，不静默覆盖）**：
1. **第 12 条 vs `AGENTS.md` 的「恰好三条」预算**：`decision-log.md:61`（T-019）用户选 **B＝只给最贵的三条**并**拒绝 A（条款膨胀）**，理由是该文件常驻上下文。**本卡原判定**：第 12 条改落 `docs/standard-workflow.md`，`AGENTS.md` 净变更仍恰好三条。**2026-09-28 用户逐字「允许，可以修改AGENTS.md」⇒ 该判定被推翻**：第 12 条落 `AGENTS.md` 新增 `### 卡住与升级（本任务后续执行）` 段 4 行（**已落地**），**净变更由三条变四条**，`design.md` §1.0 的「恰好三条」措辞按 §14.6 冲突 1 作废；`docs/standard-workflow.md` 的 `### stage 结束` 段（R13 那句）**保持原样不改**，不制造同一条款的第二权威。**推翻的理由**：本条靶子是 `blocked` 静默 **21,135.8 s（5 小时 52 分）** + 用户 ord 7299/7313 连续三条抗议 + **零通知人的通道**，严重性压过常驻上下文预算——不常驻的条款恰恰正是没人读到的那一条。
2. **`skills/spec-plan/**` 的 sha 链**：沿用裁决 A（本卡零哈希动作、整链挂 CARD-06，§6.8 与本节第十条）。本轮点名的**文档内部自相矛盾**已就地修正，见下。
3. **A5 两条的 runtime 面不在 CARD-03 写面**：只做方法条款与事实登记，**本卡不替 CARD-05/CARD-06 实施**。

**同批完成的三处文档内部一致性修正（是修正，不是新决策）**：
- `design.md` **§6.1.1 第 40 行**：处置由「本卡内做（同批回写摘要链）」改判为「**本卡不改**（由第 42 行覆盖）」——原第 40 行与第 42 行对同一批 `skills/catalog.yaml`、`skills/spec-plan/skill-bundle.json` 给出互斥处置，**以第 42 行为准**（授权来源是 SD-17 + OI-013 + 用户 2026-09-27 逐字）。
- `design.md` **§6.1.3** 节首新增**覆盖声明**：该节的 **A4、A5、B3 与整批 S 全部不执行**；批 S 的重算配方与强制点**保留为事实记录**（CARD-06 需要它），本卡不落地。批 A 的 A1–A3、批 B 的 B1–B2 照常执行。
- `design.md` **§3.2 净效果行**：原文「模板最终 64 行」保留不改（§6.1.3 P1-7.4 的「已应用」记录依赖该段逐字），就地加注「§14.2 再 +6 行 ⇒ **模板最终 70 行**，行数以 §14.2 为准」。（**2026-09-28 注：后以 §14.13.5 为准**——185 行草案＋bs P1/P2 并入 10 行＝**195 行**）

**写面与授权**：§14.7 施工表增补 **43–52 共 10 行**（增补后 §6.1.1 全表 **52 行、「无授权」0 行**）；其中 **43–51 本卡内做（9 行）**、**52 错开实施（1 行：`workflows/build-code/SKILL.md` 与 `workflows/build-plan/SKILL.md` 的 6 处方法条款，均在 CARD-04 写面内）**。两条不占编号的登记行：`runtime/review/review-record-route.mjs` 挂 CARD-05；`docs/quality/business-case-catalog.json` + `runtime/evidence/canonical-evidence-validators.mjs` 挂 CARD-06/CARD-04。（**2026-09-28 注：后增补至 67 行**，见 12.5 与 `design.md` §14.7）

**已知代价（如实登记，不构成门禁）**：本节新增的落点里，`skills/spec-plan/templates/phase-template.md`（+6 行）与 `skills/spec-plan/SKILL.md`（+1 句）都在 sha 链内；改而不回写哈希后，本节第十条列出的消费者 #2／#3／#4／#5／#8 与 `check:skill-closure` 会红或抛错，直到 CARD-06 落地。这些红**在既有红之上**（全量基线见 `### 九、`：**83 个测试文件 / 219 条测试红**，耗时 68.4 分钟）。按 SD-17 只登记、不设门。

**诚实边界（不做承诺）**：本组裁决**不保证「绝对零返工」**。可严格追求并检查的是复盘 §6 末尾那三条：**零已知计划缺口进入 build-code、零同范围重复正式审查、零无界计划改写**。
### 十二、产物模板中文化与审查面优化的追加指令（2026-09-28；事实登记 + 待裁决）

**指令（用户逐字，两条）**：
1. 「**之前说的模板的修改、审查的修改都要记录**」
2. 「**还有现在phase的模板比原来plan和tasks模板质量差距太大了，结构化、可阅读性、内容丰富程度都差的很远，需要仔细调研分析**」

#### 12.1 已落地的模板中文化（设计书 §14.10）

7 份产物模板已中文化，**机器可解析性由 runtime 别名层保底**（`runtime/stage/stage-content-contracts.mjs` 新增 `FIELD_LABEL_ALIASES` + `labelAlternation` + `declaresField` + `WITHOUT_PREDECESSOR`，并把 `taskField`／`fieldValue`／`analyzeField` 三个咽喉点与 10 余处标签读取点改为别名感知；`runtime/task/material-workspace.mjs` 三行同步双语）：

`skills/spec-plan/templates/plan-template.md`、`skills/spec-plan/templates/phase-template.md`、`skills/spec-tasks/templates/tasks-template.md`、`skills/spec-tasks/templates/index-template.md`、`skills/spec-specify/templates/spec-template.md`、`skills/spec-prd/templates/prd-template.md`、`skills/decision-log/templates/decision-log-template.md`。

配套：5 份契约测试同步放宽为中英双语；`skills/*/skill-bundle.json` 与 `skills/catalog.yaml` 的 sha 链重算（**显式推翻早先的 sha_chain=A「本卡零哈希动作」裁决**，理由＝模板中文化是用户直接指令，字节变化机械地强制重算）。

#### 12.2 已落地的 phase 模板质量升级（设计书 §14.12）

`skills/spec-plan/templates/phase-template.md` **56 → 185 行**：补三层人读结构（使用说明 / `## 速读卡` / `### 字段说明` 表 38 行 / 一张填满的 `T001` 示例卡），并补齐旧模板**漏掉的 5 个 runtime 已在逐字读取的文件级字段槽位** `gate_cmd`／`oracle`／`evidence_path`／`STOP`／`Done`（`runtime/stage/stage-content-contracts.mjs:7089-7094`）。**机器字段标签一个未改。**

真实作者「即兴发明」的证据：`specs/archive/workflowhub-thin-core-card-05-20260919/phases/P1.md:3-11` 自己补上了这 5 个字段，`:56-67` 还自造了 `FN1`–`FN6` 真值冻结表。

附带修复三处**中文化引入的英文单语回归**（`runtime/stage/stage-content-contracts.mjs:7132`／`:7147`／`:7160`）：`Files / symbols` 的符号检查加「符号」、卡内 `Dependency` 加「无」、末尾循环改用 `WITHOUT_PREDECESSOR`。

#### 12.3 审查面优化（设计书 §14.11；**2026-09-28 已全部落盘，见 12.5**）

两份只读调研报告已回收并做耐久存档（`specs/workflowhub-thin-core-card-03-20260919/attachments/R-review-spec.md`、`R-review-code.md`）：

- **build-spec 侧**：八条检查项现状判定 = **能 0 / 部分能 7 / 不能 1**。总因「条款全在作者自己的上下文里，交接前没有任何一个独立、必须回答的动作」。最硬证据：`workflows/build-spec/SKILL.md:88` 逐字「规格审查与 AC 文本都不替代执行证据」；`skills/review/SKILL.md:12-16` 的 Check 只有 5 条，**没有一条问计划可执行性、入口真实性、RED 归因**。
- **build-code 侧**：c／d／g 完全无条款，a／b／e／f／h 形态偏弱。总因「第 1 步定范围、第 8 步派审查、第 9 步处置、第 7 步收尾四个位置缺少必须回答的问题」。机器侧**三处反向许可**：`workflows/build-code/SKILL.md:76-78` 逐字 `Record the concrete material gap and continue safe code, task-fact, or quality-fact repair in the same task`（c 的直接许可来源）；`:190-192` 的 `capture-evidence` 措辞（「整棵工作树当证据」在这句话下完全合法）；`runtime/review/review-record-route.mjs:351-353` 的 `defaultSharedReviewTuple` 对 build-code 默认 `{subject_kind:"worktree", phase_id:null, review_scope:"integration"}`。

**裁决（2026-09-28，用户逐字）**：「**现在全落，碰撞按「时间错开」登记**」⇒ §14.11.2/§14.11.3 的 16 条提案**全部落盘**，落点与 CARD-04 写面的重叠按 ADR-0034 的「写面碰撞由时间错开消解」登记。落盘结果见 12.5，设计书见 §14.13。

（原待裁决文本，保留作历史：§14.11.4 的去重映射判定出 **5 条全新提案**（build-code P2 计划缺口集中一次退回、build-code P8 Phase 一次审查合同规范侧、build-spec P5 稳定版本锚、build-spec P6 复核件纪律、build-spec P7 阶段末摘要标明「计划缺口 vs 实现未知」）、**4 条部分重叠**、**6 条与 §14 既有条目重复**、**1 条待核**。设计书 §14.11.6 另有 6 条残留不确定（含去重只到摘要粒度、CARD-04 的 cohort 归属未核实、`review-frozen-spec` 与 `skills/review/SKILL.md` 的对应关系是推断）。**这批提案是否采纳、以及与本卡既有 I-1…I-18 的合并方式，需要用户或设计负责人裁定。**

#### 12.4 写面与既有裁决的关系

本条登记的全部改动都落在 §14.7 施工表已授权的行内（行 59 的 sha 链重算、行 61–62 的 phase 模板重构与 runtime 正则修复；行 43 的「追加 6 行」由此升级并作废）。**未新增任何门禁、stage、gate 或 schema。** §12.3 的提案已于 2026-09-28 全部落盘（用户「现在全落，碰撞按时间错开登记」），占用施工表行 63–67，落点表见 12.5。

#### 12.5 审查面 16 条提案的落盘（2026-09-28；设计书 §14.13）

| 侧 | 提案 | 文件 | 现落点 |
| --- | --- | --- | --- |
| build-spec | P1、P2 | `skills/spec-plan/templates/phase-template.md` | `:3`、`:129`/`:153`/`:177` |
| build-spec | P3、P4b | `skills/spec-plan/SKILL.md` | `:22`、`:30` |
| build-spec | P4a | `skills/plan-eng-review/SKILL.md` | `:40-44` |
| build-spec | P5、P6b、P8 | `workflows/build-spec/SKILL.md` | `:90`、`:96-98`、`:54-66` |
| build-spec | P6a、P7 | `docs/standard-workflow.md` | `:96`、`:140` |
| build-code | P1、P2、P4、P5b、P6a、P7b | `workflows/build-code/SKILL.md` | `:263-273`、`:16-32`、`:228-234`、`:303`、`:305-308`、`:281-284` |
| build-code | P3b | `AGENTS.md` | `:32-37` |
| build-code | P3a、P5a、P6b、P8 | `docs/standard-workflow.md` | `:107-123`、`:312-316`、`:94`、`:98-105` |
| build-code | P7a | `workflows/build-code/steps.json` | `:13`（`observable_result` 整值替换） |

- **除 `phase-template.md`（整份重写）与 `steps.json`（整值替换）外全部为纯增量、0 删除行**；`docs/standard-workflow.md:88-92` 禁区逐字节未动（`md5 19b0e07a1c49c4b6bd76f04b0a51c843`，与 HEAD 同段一致）。
- **两处报告锚点与实际文件不符**（`count == 0`，子代理按纪律不猜、跳过，由主会话按正确文本补落）：build-spec **P7**（`需求/实现/代码风险` vs 实际 `需求、实现或代码风险`，仅下标 16 一处标点差异）、build-code **P6b**（中文长句已折行）。⇒ 复用时**凡 `count != 1` 一律不猜**。
- **并发写者事故**：主会话补落的 build-spec P7 段被落地子代理当作「别人的改动」删除（它为使自己的 diff 自洽而回退），已重新落盘并登记。⇒ **同一文件不得同时由主会话与子代理写入**；子代理正确动作是**保留 + 报告**而非删除。
- **sha 链第四次重算**（本次落盘暴露的新消费者）：`skills/spec-plan/SKILL.md` 与 `skills/plan-eng-review/SKILL.md` 都是各自技能包的 `files[]` 成员 ⇒ `skills/catalog.yaml:335`（spec-plan `fc654704a8643bcc3530018634cd81e206524e1557cd6247878054070b8009d8`）与 `:634`（plan-eng-review `6921cf82dc6de8032d87a07bbd50f7a3862c8d5d51d0d47e433521f2241b43fa`）两处必须同步。**`plan-eng-review` 用字符串形 `files[]`（包内不声明 sha256），但 resolver 仍对实际内容算 `bundleHash` 并与 catalog 比对** ⇒ 判「是否受影响」不能只看包内有没有 sha256 字面。
- **测试实测**：12 个受影响契约测试文件 ⇒ `3 failed | 9 passed`、`162 passed | 3 failed`；**3 条红全部经 `git stash` 差分确认为 pre-existing**（`stage-plan-task-contract-v3`、`stage-plan-task-contract`、`material-producer-consumer-roundtrip`）。落盘前同组是 `7 failed`，全部为 `Error: bundle sha256 mismatch: SKILL.md` ⇒ 第四次重算把它降回 3 条 pre-existing。


#### 12.6 覆盖审计：来源 → 条目 → 落点（2026-09-28；设计书 §14.14）

**触发**：用户逐字追问「**所有需求都登记了吗？包括之前card-04任务执行出的问题和我后来提出的新需求？有完整记录并设计方案了吗？**」

**审计结论（诚实口径）**：逐条登记是有的（四个账本 `R-001…R-020`／`T-001…T-038`／`OI-001…OI-011`／`F-1…F-10`，加八个方案段 §14.0–§14.14），**但「完整性」此前不可核对**——缺一张从来源到条目的总对照表。总表已补在 `design.md` §14.14.1。

**实测出的五个缺口与裁决**（全文见 `design.md` §14.14.2–§14.14.6）：

1. `attachments/A5-doc-crosscheck.md` §5 的 `S1–S12` **从未逐条映射**（`S10`／`S11`／`S12` 在 `design.md` 与本文件各 0 命中）⇒ 逐条裁决：**S10 判定「现仓已具备」**（`runtime/task/task-store.mjs:243` 的 `["phase_id","task_id","material_revision","recorded_at"]` ＋ `workflows/build-code/SKILL.md:73-76` 的「material revision 匹配则续、缺失或过期则重新推导」），**S11 部分采纳**（三条可检查目标已登记）＋明确不采纳五组统计量（需新账本，违 OI-013／SD-17），**S5 的「投入上限」明确不做**（会变成预算 gate）。
2. `attachments/A2-plan-gaps.md` §2.2 的**九类**缺口未逐类映射 ⇒ 补「九类 × 落点」表；并登记两条读数口径（九类条数合计 66 > 61；「33」与「39」两个子集互有交叠、不是互补）。
3. **I-2 的「套话」判据缺失** ⇒ 不新增机械判据，指名人工判据＝`workflows/build-spec/SKILL.md:54-66` 的交接前八问第 1、3 问。
4. **用户「去掉『按真实时长切 Phase』」裁决未独立登记** ⇒ 新增 `T-037`（实质原在 §14.3 I-11 的逐字草案内，`grep` 六个关键词全 0 命中）。
5. **`A5` §2 的 `X1–X12` 与 §3 的 ①–⑤ 未登记** ⇒ 新增 `T-038`；其中 X6 已被 `design.md` 覆盖、X8 登记未修复（在外部文档内，不在本卡写面）、X9 正是 `T-037` 的来源。

**本节不改任何既有文件、不新增条文、不新增门禁**（SD-17）。施工表行 50／51／52 实测：行 50（`docs/standard-workflow.md:290-294`）与行 51（`runtime/stage/stage-handlers.mjs:294-295`）**已落地**，行 52 **已设计、未实施**（不是漏记；**2026-09-29 一致性复核更正**）。

**本节亦登记一处不对称**：三份取证报告（`A2-plan-gaps.md`／`A3b-volume.md`／`A5-doc-crosscheck.md`）此前**只被 `design.md` 引用，本文件零引用**——已在 `design.md` §14.14.1 如实登记，不要求补写引用。

**验证**：`analyzeDecisionOutline` → `ok=true errors=[] open_items=0`；`analyzeDecisionConvergence` → `ok=true errors=[]`；`tests/decision-log-content-contract.test.mjs` 4 ✓；`tests/contract/material-workspace.test.mjs` ＋ `tests/contract/review-materials-contract.test.mjs` 75 ✓。

#### 12.7 R 表逐条处置登记（2026-09-28；step 11 spec-analyze 修复）

step 11 透镜对 20 条 R 需求给出 20 条「partial 不能宣称已完整实现」finding。合法修复＝显式延期登记（合同 DEFER 机制：owner／trigger／handoff／close_condition 四要素非空）。本卡真实处置：全部 20 条的场景级验收（实跑）由下游实施卡完成，验收载体＝T-002=A（实跑一个多工作包实施 task）。纯记账追加，不改任何决定内容。

| R id | 处置 | 下游 owner | 触发 | 交接物 | 关闭条件 |
| --- | --- | --- | --- | --- | --- |
| R-001 | deferred | 后续实施卡的 build-code／verify-code | 该卡进入 build-code、按本决定 SD-11 矩阵实跑 | `## 决定` 的 D-### 绑定＋SD-11 覆盖率矩阵（:336-351）＋design.md §14.14 | 对应 AC 实跑证据落该卡 quality/evidence 且 verify-code 收口 |
| R-002 | deferred | 同上 | 同上 | 同上 | 同上 |
| R-003 | deferred | 同上 | 同上 | 同上 | 同上 |
| R-004 | deferred | 同上 | 同上 | 同上 | 同上 |
| R-005 | deferred | 同上 | 同上 | 同上 | 同上 |
| R-006 | deferred | 同上 | 同上 | 同上 | 同上 |
| R-007 | deferred | 同上 | 同上 | 同上 | 同上 |
| R-008 | deferred | 同上 | 同上 | 同上 | 同上 |
| R-009 | deferred | 同上 | 同上 | 同上 | 同上 |
| R-010 | deferred | 同上 | 同上 | 同上 | 同上 |
| R-011 | deferred | 同上 | 同上 | 同上 | 同上 |
| R-012 | deferred | 同上 | 同上 | 同上 | 同上 |
| R-013 | deferred | 同上 | 同上 | 同上 | 同上 |
| R-014 | deferred | 同上 | 同上 | 同上 | 同上 |
| R-015 | deferred | 同上 | 同上 | 同上 | 同上 |
| R-016 | deferred | 同上 | 同上 | 同上 | 同上 |
| R-017 | deferred | 同上 | 同上 | 同上 | 同上 |
| R-018 | deferred | 同上 | 同上 | 同上 | 同上 |
| R-019 | deferred | 同上 | 同上 | 同上 | 同上 |
| R-020 | deferred | 同上 | 同上 | 同上 | 同上 |

重跑透镜结果：20 条全部合法延期登记（deferred 四要素齐全）、收敛七维全 passed ⇒ 机器状态 **consistent**。事实文件落 `quality/facts/`（双层 Hugh 任务根）。

### 十三、card-04 审查耗时法证与审查编排优化设计登记（2026-09-28 第三组追加指令；设计权威＝design.md §14.17）

**用户指令（逐字，2026-09-28）**：「A，"每阶段审查预算+受控超时"需要研究要不要做，因为很容易因为这些预算强行停止正在运行的审查，导致更大的浪费，现在已经通过健康检查来判断审查是否还在运行了，没有必要在设置限制了吧。B，同时不能只登记到决策中，需要设计更详细的解决方案」⇒ 用户选 A（登记＋设计）＋两条修正：措施 6（预算/受控超时）**由落地降级为研究项**（理由：硬切在跑的审查造成更大浪费；健康检查〔attempt `execution.health` 的 liveness/progress_events〕已能判活）；要求**详细设计方案**而非一句话登记。

**法证数字（2026-09-28 实读 card-04 `quality/reviews/`，23 次 attempt 全量）**：13 次有审查腿、10 次空 attempt（43%）；两腿并行；腿合计 18,070s（5.02h）、墙钟 10,359s（2.88h）；8 次有效 build-code 阶段审查全部在 ocr-host（codex+kimi，OCR 机制合规＝card-05 FR-REVIEW-003 设计）；发现量 build-code ~295 条；P3/P4 各双轮；4f2643f1（P3 次轮）13 分钟墙钟返回 1.3KB 零发现被照收；会话总 34.6h、exec 合计 1.76h、wait_agent 12.2h——**审查墙钟 2.88h＞全会话 exec 的 1.62 倍**；P10 的 OCR packet 目录存在而 attempts 档无对应记录。

**五项措施（详细设计见 design.md §14.17，此处只登记名目与归属）**：①审查非阻塞化（dispatch→collect，配 phase-close 顺序表）；②派发前契约预检（fail-fast、不产生空 attempt）；③结果完整性自动校验（形状级，result_invalid 不静默入账）；④审查包只绑声明写集（G-3=B 原则推广到审查材料，diff-shards 法定为唯一路径）；⑤发现分级消费（档案全量保留，消费端 blocking/major 逐条处置、minor 批量）。**研究项⑥**：审查预算/受控超时——不设常规预算（2026-09-29 复核：**已被 card-04 落定为删除**，见 `tests/contract/review-budget-deletion.test.mjs:90`／`:92`／`:98`；残留 `tools/cli/stage-runtime.mjs:2006` 的 `"review_budget"` 键名），只余「卡死计数」与「report-only stall_warning」两个纯研究问题（初判 23 次 attempt 真实卡死 0 次，用户质疑成立）。

**写面登记**：措施 1–5 的 runtime 触点（`tools/cli/stage-runtime.mjs`、`runtime/review/review-record-route.mjs`、`runtime/review/review-input-bounds.mjs`、`skills/wh-review/scripts/simple-review-runner.mjs`、`workflows/build-code/SKILL.md`、`docs/standard-workflow.md`）登记为**下游推迟写面**（design.md 施工表行 70）——本卡只设计不动手；2026-09-29 复核：CARD-04 **未实现**，转 **CARD-05**（触点 `runtime/review/review-record-route.mjs`）与 **CARD-06**（触点 `skills/wh-review/scripts/simple-review-runner.mjs`）按 §14.17 拆任务。

### 十四、make-decision 收尾确认与时序裁决更新（2026-09-28 第四组追加指令）

**用户指令（逐字，2026-09-28）**：「能否先完成当前任务的make-decision，方便我后续先进行build-plan。等card-04合并进来后，再看看当前任务的decision、spec和phase有没有需要更新的地方」

**收尾确认**：make-decision **十三步全部完成**（step 1–9、step 10 批准〔confirmation `673f4045…`〕、step 11 spec-analyze 透镜 consistent〔fact `786c1f41…`〕、step 12 发布汇报、step 13 复盘〔`52fbe536…`〕）；四组追加指令（模板二次修订／审查第 9 条／审查编排优化设计／本收尾）全部登记落盘；追加后复验：透镜 **consistent**（ok=true、errors=0、findings=0、收敛 7/7）、`analyzeDecisionOutline` ok、`analyzeDecisionConvergence` ok、内容契约 4 ✓——**本阶段可正式收工**。

**时序裁决更新**：T-013 原自定义答复「build-plan 等到 card-04 交付合并进来后再进行」**由用户本指令更新为**：**build-plan 先行**；CARD-04 合并后回头核对 card-03 的 decision／spec／phase 是否需要更新（用户亲自指定的复核点，即「错开实施」的时间对账）。**2026-09-29 复核完成**：复核当时 main tip 为 `6848760d`，合并点提交为 `97092b30`；`git log --oneline 97092b30..main` 为空，其含义是 **main 当时已整体包含在本卡合并提交 `97092b30` 之内**（main ⊆ `97092b30`），**不是**「本卡位于 main tip」。结论＝本卡的 decision／spec／phase **无需更新**，复核点关闭。**截至 2026-09-29 复核时**，main 在此之后另前进 **3 个与本卡无关的提交**：`94000a65`（README post 行修正）、`b3cea456`（残留卡材料归档）、`332fe59b`（本轮 ARCHIVE-NOTE 来源更正），均属另一件事的处置 ⇒ **2026-09-29 现时** main tip = `332fe59b`，本卡分支**尚未包含**这三条：跑 `git log --oneline 97092b30..main` 会输出这三条，`git merge-base --is-ancestor 97092b30 main` 为**假**。（本句为**带日期的历史叙述**：main 继续前进不再使本句失真。）

**风险（如实登记）**：build-plan 先于合并 ⇒ 计划可能与 CARD-04 在研写面重叠（card-04 worktree 41 条目不干净、`tools/cli/stage-runtime.mjs` 曾实测硬碰撞 1 处）；缓解＝本条的合并后核对点＋施工表行 52「时间错开」＋行 70 已把审查编排的 runtime 触点推迟到合并后（2026-09-29 复核：CARD-04 **未实现**该设计，移交 CARD-05／CARD-06）。

**交给 build-plan 的现成状态**：`skills/spec-plan` bundle 哈希 `b1a6e954162da7506f18a74be37cb8b5cb63d14b386ad3b10fc98acb23dcc3e1`（phase 模板 **217 行**版）；`plan-eng-review` bundle 哈希 `ef828eb4f76b66c6e86e49e6b64130362242d9937b203d96f9cab3eac84ec6b7`（8+1 条检查，第 9 条＝九类遗漏扫描＋需求对账总闸）；§14.17 五项审查编排措施＝build-code 侧需求且 **CARD-04 未实现**（2026-09-29 复核），移交 CARD-05／CARD-06；预算研究项已由 card-04 落定为删除。这些不属 build-plan 实施范围，但须在计划中为其保留任务位。

### 十五、合并后复核修订（2026-09-29；仅文字级修订，未新增任何决策）

**背景**：card-04 的归档提交 `6848760d` 已并入 main，本卡 worktree 的合并点提交为 `97092b30`（Merge main into card-03）。复核当时 main tip 为 `6848760d`，`git log --oneline 97092b30..main` 为空 ⇒ **main 当时已整体包含在本卡的合并提交 `97092b30` 之内**（main ⊆ `97092b30`），用户亲自指定的「合并后回头核对」复核点**已完成**；核对口径＝card-04 的改动面即其合并提交 `40421a46` 对第一父 `40421a46^1` 的 diff，共 **110 个文件**。（**截至 2026-09-29 复核时** main 另前进 `94000a65`、`b3cea456`、`332fe59b` 三个与本卡无关的提交 ⇒ **2026-09-29 现时** main tip = `332fe59b`，见本节第 3 条与第十四节时序裁决更新；此为带日期的历史叙述。）

**复核结论**：本卡的 decision／spec／phase **无需内容性更新**；下面是本轮 13 条修订的分类与依据。

1. **ADR 撞号（编号维护）**：本卡的派发规则 ADR（原路径 `docs/adr/0033-…`）与 card-04 的 `docs/adr/0033-acceptance-truth-presentation-and-cohort-parity.md` 重号 ⇒ 本卡那份经 `git mv` 改名为 `docs/adr/0034-subagent-dispatch-and-parallel-rules.md`，本文件与 `design.md` 内全部路径引用同步改名；card-04 的 `0033` 一字未动。
2. **哈希链收尾**：`skills/catalog.yaml` 与 `skills/wh-review/skill-bundle.json` 的合并后哈希修复，经机器自己的校验器（`runtime/adapters/local-skill-resolver.mjs` 的 `validateSkillBundle`）对 worktree 内全部技能包逐个校验通过后提交；本轮拆成两个提交（哈希修复一个、本档案修订一个），便于独立回溯。
3. **过时复核点**：本档案第十四节的「CARD-04 合并后回头核对」已过时 ⇒ 改为「已于 `97092b30` 复核完成；复核当时 `git log --oneline 97092b30..main` 为空，即 main ⊆ `97092b30`；其后（截至 2026-09-29）main 另前进与本卡无关的 `94000a65`、`b3cea456`、`332fe59b`，**2026-09-29 现时** main tip = `332fe59b`」，结论＝本卡 decision／spec／phase 无需内容性更新。
4. **过时措辞与移交对象**：`design.md` §14.17 措施 1/2/3/5 原写「CARD-04 之后实现」，实测 **CARD-04 未实现**（main 的 `tools/cli/stage-runtime.mjs` 自合并点起零改动；全仓无 `--async`、无 `--action=collect`、无 attempt 态 `result_invalid`）⇒ 改为「CARD-04 未实现，转后续卡」，移交对象写 **CARD-05**（触点 `runtime/review/review-record-route.mjs`）与 **CARD-06**（触点 `skills/wh-review/scripts/simple-review-runner.mjs`）。
5. **越界风险登记**：上述设计里新增的 `--async`／`--action=collect`（新 CLI 动词）与 attempt 态 `result_invalid`（新 schema 字段）命中 card-04 的 **B-08**（不得新建 schema 字段／CLI 动词／控制面），措施 4 的「record 时拒收目录快照型材料」命中 **B-06**（不得重新引入材料同一性校验门）⇒ 三处一律显式写成「待 CARD-05／CARD-06 裁决」，并声明措施 4 **不是材料同一性门**。
6. **锚点更正**：§14.17 措施 4 原引 `runtime/review/review-input-bounds.mjs:5-6`；复核发现该文件**未被 card-04 触碰**（原判「已被 card-04 重写」不成立），其内容自始即「Provider capability, rather than a local byte ceiling, decides whether delivery is possible.」与 `{ materials, diff: null }` ⇒ 锚点更正为符号锚点，并如实记录该前提不成立。
7. **已结案的研究项**：§14.17 研究项 6（审查预算）实测**已被 card-04 落定为删除**（`tests/contract/review-budget-deletion.test.mjs:90` 断言 `evaluateReviewRound`／`readCanonicalBudgetHistory`／`REVIEW_RETRY_BUDGET` 不存在、`:92` 断言控制项 `review-budget-namespace` 为 `undefined`、`:98` 断言 ADR 含「不再维持正式审查预算」），只余 `tools/cli/stage-runtime.mjs:2006` 的 `"review_budget"` 键名残留。
8. **主题错配与补指针**：card-04 归档 decision-log 的 `:2237-2300` 主体是 D-009…D-015 的完成责任与验收方向，**不是**审查编排；审查编排的交接在同文件约 `:1790-1815` 段。本轮在本卡两份档案里**未找到**任何引 `:2237-2300` 当审查编排的地方（grep 零命中），故只补指针：该段登记的 `runtime/review/review-record-route.mjs` 三连缺陷 card-04 **触而未修**（该文件确在 card-04 的 110 文件改动清单内，见 `tests/review/review-record-route.test.mjs:96`；card-04 只登记、未修复那三处），属 CARD-05 领地。
9. **符号锚点化**：`design.md` 与本文件内会被 card-04 触碰的 `file:line` 锚点改为**符号锚点**（`path#symbol`，保留原行号作括注），逐个实读核实后落盘。
10. **施工表行号重取**：§6.1.1 与 §14.7 施工表中被 card-04 触碰的写面行号全部重取（内容全部存活、无一行失效）。
11. **状态校正**：施工表里「CARD-04 **正在改**」改为「CARD-04 **已改完**并落地」。
12. **写面登记失真更正**：`docs/standard-workflow.md` 与 `workflows/build-code/steps.json` **未被 card-04 触碰**却列在 §14.13.4 碰撞集 ⇒ 碰撞面收窄；`docs/quality/business-case-catalog.json` 原注「不在本卡 worktree」不成立（实测在本卡 worktree 内、56200 B，card-04 已对其作 `+806/−0` 写入）；`runtime/evidence/canonical-evidence-validators.mjs` 确实存在（34520 B）。
13. **悬置事实结案**：phase 骨架 `status` 字段与 `index.md` 状态列两条悬置事实，由 card-04 归档形态结案（`phases/index.md` 列头无 status／progress 列；`phases/P1.md` 的 `## L0` 段无 status 字段），与本卡 OI-009 立场一致。

**本轮性质声明**：以上全部为**文字级修订**（措辞、锚点、编号、状态、行号），**未新增任何决策、未改动任何 `runtime/**`／`workflows/**`／测试文件、未触碰 card-04 的任何文件**；所有行号与哈希值均以本卡 worktree（合并点 `97092b30`）的实读为准。

### 十六、残留卡 workflowhub-readme-post-materials-20260927 的处置（2026-09-29）

本节只登记一件与本卡无关、但由 card-04 父会话产生并在 2026-09-29 收尾的残留任务；不新增本卡决策。

1. **来源与授权**。该 task/worktree 由 **card-04 父会话**（`~/.codex/sessions/2026/09/26/rollout-2026-09-26T19-24-41-01a0dd75-d3c9-7d91-b3cc-5064ee568f5a.jsonl`，下称 PARENT）自行创建：bootstrap 命令在 **PARENT:9467**（`node tools/cli/task-bootstrap.mjs --project=workflowhub --task=workflowhub-readme-post-materials-20260927 --target-repo=/Users/Hugh/Hugh/Project/workflowhub`）；agent 自述动机在 **PARENT:9223-9224**（「适合另开一项只改文档的任务」）。创建前 27 分钟内**没有用户消息**；用户唯一相关的授权是 23:12:27Z 对 **card-04 三项验证**的选项答复，**不是**新建任务的授权。
2. **事后追认**。用户在 **PARENT:22922-22926**（`2026-09-27T07:43:17Z`）逐字答「可以，就改这一行」，**晚于创建 8 小时 03 分**，且只授权「改这一行」；全文没有「新建 task／跑完四阶段／提交／合并／推送」的用户语句。
3. **无人确认的连续自动推进**。四个阶段全在 card-04 的**同一个子代理**会话内跑完（`~/.codex/sessions/2026/09/27/rollout-2026-09-27T15-35-50-01a0e1ca-a7c7-7633-ae05-d466dd0d6c4c.jsonl`：`:1`（ordinal 0）的 session_meta 含 `/root/p13_report_consumer`；`:29`（ordinal 28）的 `role":"developer"` 消息含 `fork_turns`。**2026-09-29 复核更正**：原记「第 1/29 行的 session_meta 含 `/root/p13_report_consumer` 与 `fork_turns`」把归属记错，实测 `:1` 的 `grep -c fork_turns` = 0）。stage-end 时刻分别为 `07:57:42Z`／`08:48:28Z`／`09:03:11Z`／`09:03:40Z`；**build-code→verify-code 间隔 28.903 秒**。
4. **外置任务根可核值**。`task.json` 的 `created_at = 2026-09-26T23:39:59.864Z`，bootstrap 事务 `closed_at = 2026-09-26T23:40:01.266Z`；`quality/confirmations/` 共 10 条，`reply_text` 全为「可以，就改这一行」，其中 **build-code 与 verify-code 无确认记录**。
5. **处置与落地**。README 的 `post` 行已修正；截至 2026-09-29，该修正提交 `94000a65` 在**本地** main（远端 `origin/main` 仍为 `6848760d`，尚未推送；此为带日期的历史叙述）；只读检查器对本地 main 复验 **6 PASS / 0 FAIL**；该卡材料归档到 `specs/archive/workflowhub-readme-post-materials-20260927/`（9 个文件，含检查脚本与 RED／GREEN 证据，提交 `b3cea456`）；worktree 已删除；其分支 `task/workflowhub/workflowhub-readme-post-materials-20260927`（tip `ef920f1f`，已完全并入 main）随后删除。该卡**始终无提交、无交付、无收口**。
6. **来源声明**。上述转录锚点为**仓库外**证据（`~/.codex/sessions/**`），已在 2026-09-29 逐条 grep 复核；仓库内可核的只有第 4、5 条的外置值与 git 提交。


## 收敛检查

四维表按 `workflows/make-decision/SKILL.md`（四行表判据段；原记 `:213-219`，现 `:225`）（逐字：「Every row records the actual user answer or `无新需求` plus a concrete fact/material reference」）与 reader 契约 `runtime/stage/stage-content-contracts.mjs#structuredConvergenceFacts`（原记 `:3505-3567`，现 `:3660-3722`） 列出：**每一行**要么是**真实用户答复**，要么是 `无新需求`，两种都必须配一个**具体事实或材料引用**（判据＝`stage-content-contracts.mjs#recordedUserAnswer`，原记 `:3485-3493`、现 `:3640`；与 `stage-content-contracts.mjs#concreteMaterialReference`，原记 `:3494-3498`、现 `:3649`）；方案行另记取舍、被拒选项与未决项处置（`#structuredConvergenceFacts` 的 solution 分支，原记 `:3552-3557`，现 `:3707-3712`），验收行另记场景、数据来源、通过与失败判据（同函数 acceptance 分支，原记 `:3558-3564`，现 `:3713-3719`）。本卡已进行六批真实 Talk（T-001…T-015）：范围、方案、验收三维按真实用户答复填写（本轮补 T-007=A、T-008=A、T-009=A、T-010=A、T-011=A、T-012=A、T-014=A、T-015=A 与 T-013 自定义答复），目标维按 `无新需求` 登记（六批 Talk 均未改动目标，目标来源是只读母材料与本卡 `## 原始需求` R-001…R-020）。`empty: true` **不是**本表的合法形态（它只用于 `## 唯一 OI 大纲` 的节点/类别行，见 `stage-content-contracts.mjs#analyzeDecisionOutline`（原记 `:3333-3334`，现 `:3488-3489`））；本表不代答、不借用母任务的答复、不新增任何门禁或材料文件。 本轮（step 8 write-decision-draft）另登记十问十答 T-016…T-025（见 `## 本卡问答记录（T 表）` 与 `## 补充登记`），本节四行同步追加登记；本表仍不代答、不借用母任务的答复、不新增任何门禁或材料文件。

| 维度 | 用户答案 | 事实或材料引用 | 可执行验收 |
| --- | --- | --- | --- |
| 目标 | 无新需求 —— 本卡目标的来源是只读母材料与本卡 `## 原始需求` R-001…R-020（引用来源，不是本卡答复）；用户在本卡六批 Talk 里没有改动本卡目标：T-001…T-015 逐条核对，无一条涉及目标的增减或改写（T-001 任务类型、T-002 验收载体、T-003 build-prd 处置、T-004 进度权威、T-005 与 T-010 绑定口径、T-006 与 T-007 执行卫生与委派纪律落点、T-008 模板载体、T-009 取证方式、T-011 SD-11 落地形态、T-012 连续上下文判据、T-013 与 CARD-04 的时序、T-014 G-1 落点、T-015 并发口径），本轮另核对 T-016…T-025（交付重心、可验收性、快照修补深度、条款可观察性、主会话读写边界、可观察形态覆盖对象、合并责任、核心角色术语、失败事实归属、Grill 判定），同样无一条涉及目标的增减或改写，故本行登记为 `无新需求`，不代答、不新增目标。 | 本卡 `## 原始需求` R-001…R-020、`## 本卡问答记录（T 表）` T-001…T-015；只读引用来源（不是本卡答复）：母 PRD `specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md:293-320` | 场景：本维度的 `无新需求` 登记与本卡目标来源对齐后由 reader 读出；数据来源：本卡 `## 原始需求` R-001…R-020 与 `## 本卡问答记录（T 表）` 逐字答复；通过：目标来源可追到只读母材料、无代答、四维皆可由 reader 读出；失败：用母任务答复冒充本卡答复、或凭空新增或改写本卡目标 |
| 范围 | 用户答复：T-001=A（本卡登记 `普通任务`）、T-003=A（build-prd 在本路线不跑＝记「明确不适用理由」，方法章节照样改到位）、T-007=A（范围包含「派发机制浪费」的治理：`AGENTS.md` 补一条通用委派纪律 + 四个阶段技能补齐「子代理产出契约」）、T-013 自定义答复（本卡现在只做 make-decision，build-plan 推迟到 CARD-04 交付并合并进 main 之后，故 make-decision 阶段不实际改任何 `workflows/*/SKILL.md`）（**2026-09-28 部分推翻**：用户「现在全落」，`workflows/` 与 `skills/` 已实际落盘，见 12.3/12.5；build-plan 阶段启动仍推迟）。范围＝五阶段统一的子代理派发方法、主会话职责边界、计划阶段并行规则产出、G-1 收场流程、派发机制浪费治理（仅纪律与技能文本）；不含审查工具选型（CARD-05）、验收机制细节（CARD-04）、CARD-01 拓扑改造、并行收益实测、CARD-04 交付前的 `workflows/*/SKILL.md` 实际落盘。 | 本卡 `## 范围`、`## 非目标`、`## 本卡问答记录（T 表）`；R-001、R-011、R-012；`specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md:296` | 场景：改动只落在五阶段派发方法/主会话边界/并行规则产出/G-1 收场；数据来源：本卡 `## 范围` 与 `## 非目标`、用户答复逐字记录；通过：四项均改到位且无越界文件；失败：越界触碰 CARD-04、CARD-05、CARD-06、CARD-10 的面 |
| 方案 | 用户答复（方案级决策逐条登记）：T-007=A 派发机制浪费的治理写进本卡（`AGENTS.md` 补一条通用委派纪律 + 补齐四个阶段技能里现为零条的「子代理产出契约」：先落盘、只回摘要、按子问题增量）；T-008=A 扩展现有 `skills/spec-plan/templates/phase-template.md` 加字段槽位以保持单一权威；T-010=A 快照绑定收窄为「只留该 phase 声明的写集」并登记为减少机器门禁；T-011=A SD-11 五件套按外部一手证据收敛落地形态、不改需求字面（接口符号清单、广播「我已完成的改动」、worktree 配套清单、起手 3–5 不随任务数增长）；T-012=A「连续上下文」＝回到同一子代理会话（允许被压缩过）、派发时附审查或测试发现的原文；T-013 自定义答复＝本卡先做 make-decision、build-plan 等 CARD-04 交付合并后再进行；T-014=A G-1 两侧各写各的角色（`workflows/build-plan/SKILL.md` 写产出、`workflows/build-code/SKILL.md` 写收场）；T-015=A 并发上限不写死数字、把 2–5 当区间约束写进五阶段共用纪律；本轮另按 T-016=A、T-017=A、T-018（真改 runtime 但不在本卡进行，只冻结改动候选清单）、T-019=B、T-020=A、T-021=A、T-022=A、T-023=B、T-024=A、T-025=A 追加登记方案级答复（落点见 `## 补充登记`）。取舍：按外部一手证据收敛落地形态，不照需求字面照搬机制（代价是措辞有差，验收时须能被判为已按母任务 OI-012 降级为事实记录）。被拒方案：T-007=B 只写原则不写做法、T-007=C 另立新卡、T-008=B 新建独立模板、T-008=C 只在 `workflows/build-plan/SKILL.md` 写字段清单、T-010=B 退回方法侧规避、T-010=C 先与 CARD-04 对齐再定、T-011=B 严格照 SD-11 字面、T-011=C 照字面加存疑注记、T-012=B 要求全程未被压缩或回收、T-012=C 带交接就算、T-014=B 只写 `workflows/build-code/SKILL.md`、T-014=C 只写 `workflows/build-plan/SKILL.md`、T-015=B 写死 3、T-015=C 保持现状 4/4/2。未决项：OI 层面无未决项 —— 当前 `open_items` 为空（11 条 OI 全部 `confirmed`），另有 3 条**未提问**的待裁决事实（phase 模板字段清单、card-04 审计骨架 `status` 与 OI-009 counterexample 冲突、`phases/index.md` 两列建议），如实登记在 `## 补充登记` 第五节、本卡不代答；唯一剩余未完成项＝本卡实际落盘推迟到 CARD-04 交付合并进 main 之后，属 T-013 已登记的时序安排。 | 本卡 `## 唯一 OI 大纲`、`## OI records`（11 条 OI 全部 `confirmed`）、`## 本卡问答记录（T 表）` T-007…T-015；本卡 `## 原始需求` R-001…R-020；reader 判据 `workflows/make-decision/SKILL.md`（四行表判据段；原记 `:213-219`，现 `:225`） 与 `runtime/stage/stage-content-contracts.mjs:3552-3557` | 场景：本卡方案级决策在受影响文件落地时按 T 表逐条核对；数据来源：本卡 `## OI records` 各条 `selected_disposition` 与 `## 本卡问答记录（T 表）` 逐字答复；通过：逐条决策有真实答复锚点、落地与答复一致且未新增阻断门；失败：出现新增阻断门、自行代答方案，或落地与 T 表答复不一致 |
| 验收 | 用户答复：T-002=A（主证据＝card-03 自身执行事实；G-1 场景走演练记录；build-prd 记「明确不适用理由」；取证只采事实、判定必须来自独立上下文，禁止自审自判）、T-005=B 与 T-010=A（本卡内做最小机制修补：证据绑定口径由整个 snapshot 改为该 phase 声明的写集，落 `docs/standard-workflow.md` step 11 定义段与 `workflows/build-code/steps.json` step 11 observable_result，两处均 2026-09-28 补落——此前声称已落、实际未落，已更正并补落）、T-009=A（AC-12/AC-13 的取证＝事后人工判读一次主会话动作清单，零新增机制）、T-011=A 与 T-015=A（AC-13 的并行方案以事实记录形态落地，并发只写区间约束、逐任务在 build-plan 定）、T-012=A（AC-11 的「连续上下文」＝回到同一子代理会话且派发必附审查/测试发现原文）、T-014=A（AC-14 的 G-1 收场由 `workflows/build-plan/SKILL.md` 与 `workflows/build-code/SKILL.md` 各写各的角色并交叉引用）。本轮另按 T-017=A（被推迟的 acceptance 逐条追载体说明）、T-018（runtime 真改推迟到 CARD-04 合并后，本卡只冻结改动候选清单）、T-020=A（阶段豁免表与可指认阈值）、T-021=A（三条可观察形态含声明不实发现路径）、T-022=A（合并责任＝产出方自己提交／开 PR，失败换新执行者重做不回滚）、T-024=A（失败与不实事实由独立审查判定并写入当前 stage 行的 `finding_dispositions`，五值枚举见 `runtime/stage/completion-predicates.mjs:124`；现仓 `facts.jsonl` 不接受 quality fact，见 `runtime/task/task-store.mjs:179`／`:220`；只能记录、不成门）追加登记。 | 本卡 `## 原始需求` R-006、R-009、`## 本卡问答记录（T 表）`；`specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md:305-310`；`docs/standard-workflow.md:334-340`；`workflows/build-code/steps.json:15`；`skills/spec-plan/templates/phase-template.md` | 场景：card-03 自身执行事实为主证据、G-1 走演练记录；数据来源：AC-11…AC-15 的真实执行记录与产出证据，判定取自独立上下文；通过：逐条取得真实命令与证据、失败场景可判、绑定口径为该 phase 声明的写集；失败：缺适用产物仍判通过、伪造产物，或由实施者自产自判 |

## UI applicability

```json
{
  "result": "non_ui",
  "sources": {
    "raw_requirement": {
      "fact": "R-001…R-020 全部是子代理派发方法、主会话职责边界、并行规则五件套与 G-1 收场流程类要求，不含任何页面、交互或前端组件要求（来源 specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md:293-320）",
      "conclusion": "non_ui"
    },
    "project_inventory": {
      "fact": "本卡工作面预期为各阶段技能的方法章节（workflows/**、skills/**）与 specs/workflowhub-thin-core-card-03-20260919/ 材料；worktree /Users/Hugh/Hugh/Project/workflowhub-workflowhub-thin-core-card-03-20260919 内不含任何前端项目或前端组件",
      "conclusion": "non_ui"
    },
    "planned_or_changed_frontend_fact": {
      "fact": "计划改动为方法规则文本与声明字段（计划期产出），无前端组件新增、修改或删除；母 PRD specs/workflowhub-thin-core-rebuild-planning-20260919/prd.md:316 亦记载 ui_applicability=non_ui,无设计稿",
      "conclusion": "non_ui"
    }
  },
  "gate": false
}
```

三份来源结论全部为 `non_ui`，与 `result` 一致，故本事实为**已记录**而非 unknown；真实用户答复为「non_ui — 本卡不涉及页面、交互或前端组件」。本事实**不是门**（`gate: false`）。

## 核心需求

用户要的是：workflowhub 的五个阶段在派子代理干活时，主会话（协调者）别再被拖进大量阅读与编辑，也别再把钱花在重复劳动上——实测已经证明三处最贵的浪费：子代理第一次出场就继承父代理的全部对话（占一次会话 **42%** 的成本）、空转轮询等待（**27.35%** 的开销）、跨 phase 的全量快照绑定（**60–90 分钟／会话**）。本卡（CARD-03）要交的是**方法、声明形态与取证口径**：五阶段按工作类型派发的落点、主会话职责边界、计划期的并行与工作包声明、接口真要改时的 G-1 收场流程、以及派发纪律与子代理产出契约。本卡**不新增** stage、gate 或任何新控制面，只把上面这些写成可核对的事实记录与规则文本。

## 核心目标

把「子代理怎么派、主会话该干什么、并行怎么声明、接口被改怎么收场」写成五个阶段都适用、并能被独立上下文核对的方法与事实记录；同时把最贵的三处浪费写成可观察、可回放的条款（禁全量继承、禁空转轮询、声明不实的发现路径），并且**不在本卡新增任何阻断推进的门**。

## 决定

（本节＝step 8 决策草稿，**等用户确认后才算最终**；范围、非目标、成功标准、风险、未决项与推迟项见 `## 范围`、`## 非目标`、`## 收敛检查` 与 `## 补充登记`；模板升级、审查面优化与逐文件落点见 `### 十二`（12.1–12.6）。）

- 交付重心（T-016=A）：SD-11 五件套全部保留，但**降为并列条款之一**；四条有实测数字支撑的条款写成同等权重的正文——禁子代理继承父代理全部对话、取消空转轮询、把跨 phase 的全量快照绑定收窄到该 phase 声明的写集、禁重复读同一文件／重跑同一测试；并加一张逐条覆盖率矩阵（见 `## 补充登记` 第一节）。
- 可验收性（T-017=A）：每条被推迟的 acceptance 追一句「真实载体在 CARD-04 合并后的 build-plan／build-code，本卡内以冻结候选／演练／不适用理由代替」；T-002 与 T-013 的冲突显式裁决，结论登记在 OI-007。
- 快照绑定修补（T-018，分层口径）：分两层。**声明／判据层已本卡落地**（T-005=B／T-010=A 授权的最小机制修补，2026-09-28 补落）：`docs/standard-workflow.md` step 11 定义段（绑定对象＝该 phase 声明的写集、删跨 phase 全量快照比对）与 `workflows/build-code/steps.json` step 11 observable_result（追加判据句、原句逐字保留）。**runtime 代码层真改但不在本卡进行**：本卡只冻结改动候选清单（改哪几个文件、改成什么语义、接口怎么变、删除责任方是谁），真实代码改动等 CARD-04 合并后随 build-plan／build-code 落地。（2026-09-28 更正：此前验收行声称判据层已落、实际未落，已补落并改回如实表述。）
- 条款可观察性（T-019=B、T-021=A）：只把最贵的三条写成可观察形态——①禁子代理继承父代理全部对话 ②禁空转轮询 ③声明不实的发现路径（给独立审查一条可执行核对动作）；其余条款保持原则性短措辞。
- 主会话读写边界（T-020=A，登记 OI-003）：补阶段豁免表（make-decision 的 step 1／5／6／7／12 等 M 独占步骤的读写不计入「大量读写」），并给「大量」一个可指认阈值（见 `## 补充登记` 第二节）。
- 合并责任（T-022=A，登记 OI-004）：采用外部一手做法——产出方自己提交／开 PR；失败时换一个新执行者重做，不回滚；并发方广播「我已完成的改动」与合并责任都进 acceptance 与 counterexample。
- 术语（T-023=B、T-025=A 的**术语半**）：`CONTEXT.md` 以「子代理」为权威词并新增一条定义（由另一子代理执行）；`阶段`／`Phase` 的区分沿用 `CONTEXT.md:258-259` 已有定义，不改。**术语并存的如实登记**：`CONTEXT.md` 新术语节声明「不沿用『阶段协调者／Phase 执行者』、两套词不并存」，但 `CONTEXT.md:258-259`、`:261-262` 两条既有条目仍把「阶段协调者」当执行者使用 ⇒ 本轮结束后两套词并存仍是仓库事实；本卡不改既有条目，若要消解的落点＝这两条既有条目，责任方＝T-023 的执行子代理与 CARD-04 合并后的 build-plan／build-code，时点＝不早于 CARD-04 合并（见 `## 补充登记` 第七节）。
- 失败事实归属（T-024=A）：由独立审查子代理判定，写入**当前 stage 行**的 `finding_dispositions`（`runtime/stage/completion-predicates.mjs:124` 的五值枚举 `fixed`／`rejected_invalid`／`accepted_risk`／`needs_human`／`user_decided`）；现仓 `facts.jsonl` 不接受 quality fact（`runtime/task/task-store.mjs:179`、`:220`）。**只能记录，不得成为新门禁**。落点更正见 `## 补充登记` 第三节。
- Grill 收场（T-025=A 的 **ADR 半**；T-025 含术语与 ADR 两半，分挂这两行）：Grill 判定「要写一条 ADR」（难反转／无背景会意外／真实取舍三项判据全真），落 `docs/adr/0034-*.md`。
- 模板与审查面改动（不在上列裁决条目内、同属本卡交付，均已落地）：7 份产物模板中文化（12.1）、phase 模板 56→185 行质量重写（12.2）、审查面 16 条提案全部落盘（12.3/12.5，含 sha 链第四次重算的触发原因与并发写者事故教训）；逐文件落点见 `### 十二`。
- 写面（2026-09-28 step 9 复核后更新）：本文件与 `design.md` 为当前写面；**已落盘的改动面**＝`CONTEXT.md`、`docs/adr/0034-*.md`、`AGENTS.md`、`docs/standard-workflow.md`、`workflows/build-code/SKILL.md` 与 `workflows/build-code/steps.json`、`workflows/build-spec/SKILL.md`、`runtime/stage/stage-content-contracts.mjs`、`runtime/stage/stage-handlers.mjs`、`runtime/task/material-workspace.mjs`、`skills/` 七份模板与对应 `skill-bundle.json`、`skills/catalog.yaml`、`tests/` 五份契约测试；`runtime/evidence/**`、`runtime/stage/stage-runner.mjs`、`tools/cli/stage-runtime.mjs` 本卡不做，留给 CARD-04 合并后的 build-plan／build-code（T-018）。
- 推迟项：build-plan 阶段本身的启动与本卡依赖落盘的 acceptance 判据（T-013；**2026-09-28 注**：T-013 的「不实际改 workflows/skills」半已被用户「现在全落」部分推翻，落盘事实见 12.3/12.5）；未决项：三条未提问的待裁决事实（见 `## 补充登记` 第五节）。
- step 9 正式审查发现的处置（2026-09-28；pair 927723e5，红 3 蓝 5）：①红1／蓝3「草案引用未提交材料段」→ 材料组装缺口、非草案错误；重发材料时把 `## 补充登记` §2/§3 与 T-016–T-025 答复段内联进审查材料（本计划第 2 步）。②红2「交付边界与已批准方向冲突」→ 由 T-018 条的分层口径消解（声明层已落／runtime 层推迟）。③红3「方向未规定 reconstruct→reveal→challenge 流程」→ 驳回：该流程是 wh-review 审查 broker 的协议要求（`skills/wh-review/contracts/make-decision.md:56`、`provider-protocol.md:78-80`），不是 direction 材料的内容要求。④蓝1「T-018 与已落文件清单矛盾」→ 同一分层口径消解；判据句已补落。⑤蓝2「范围说不改 workflows 与已改清单矛盾」→ `## 范围` 节已补 2026-09-28 部分推翻注。⑥蓝4「build-prd 未更新」→ 经 `## 阶段集合校正`（:86-88）映射：卡面 build-prd＝仓内 build-spec；T-003「方法章节照样改到位」已由 `workflows/build-spec/SKILL.md` 改动满足（12.5 落点表 :22/:30/:90/:96-98/:54-66）；`workflows/build-prd/SKILL.md` 是 portable workflow、非五个正式阶段之一，本卡不动。⑦蓝5（minor）「占位符引用」→ 部分接受：`<host-path-redacted>` 是送审管道的路径脱敏产物（本卡文件内 0 命中）；「父代理转述」一条（arXiv:2609.25396）已在 SD-11 矩阵逐字登记未直读，维持登记。

